/**
 * Workflow Engine Service
 * ────────────────────────────────────────────────────────────────────
 * Core state machine logic for managing form submission workflows.
 *
 * Responsibilities:
 * - Validate workflow definitions
 * - Find valid transitions from current state
 * - Execute transitions with condition + role checks
 * - Build audit history entries
 * ────────────────────────────────────────────────────────────────────
 */

import { evaluateCondition } from "../utils/conditionEvaluator.js";

/**
 * Validate a workflow definition.
 *
 * @param {Object} workflow
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateWorkflow(workflow) {
    const errors = [];

    if (!workflow) {
        return { valid: false, errors: ["Workflow is required"] };
    }

    const { states, initialState, transitions } = workflow;

    // States validation
    if (!Array.isArray(states) || states.length === 0) {
        errors.push("Workflow must have at least one state");
    } else {
        const uniqueStates = new Set(states);
        if (uniqueStates.size !== states.length) {
            errors.push("All states must be unique");
        }
    }

    // Initial state validation
    if (!initialState) {
        errors.push("initialState is required");
    } else if (Array.isArray(states) && !states.includes(initialState)) {
        errors.push(`initialState "${initialState}" must exist in states`);
    }

    // Transitions validation
    if (transitions && Array.isArray(transitions)) {
        const stateSet = new Set(states || []);

        for (let i = 0; i < transitions.length; i++) {
            const t = transitions[i];

            if (!t.id) {
                errors.push(`Transition at index ${i} is missing an id`);
            }

            if (!t.from) {
                errors.push(`Transition "${t.id || i}" is missing "from" state`);
            } else if (!stateSet.has(t.from)) {
                errors.push(`Transition "${t.id || i}" references undefined "from" state: "${t.from}"`);
            }

            if (!t.to) {
                errors.push(`Transition "${t.id || i}" is missing "to" state`);
            } else if (!stateSet.has(t.to)) {
                errors.push(`Transition "${t.id || i}" references undefined "to" state: "${t.to}"`);
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Get all transitions available from the current state.
 *
 * @param {Object} workflow
 * @param {string} currentState
 * @returns {Object[]} matching transitions
 */
export function getTransitionsFromState(workflow, currentState) {
    if (!workflow?.transitions) return [];
    return workflow.transitions.filter((t) => t.from === currentState);
}

/**
 * Get transitions available to a specific user (considering roles + conditions).
 *
 * @param {Object} workflow
 * @param {string} currentState
 * @param {Object} submissionData - flat data from the submission
 * @param {string|null} userRole - role of the current user
 * @returns {Object[]} transitions the user can take
 */
export function getAvailableTransitions(workflow, currentState, submissionData = {}, userRole = null) {
    const fromState = getTransitionsFromState(workflow, currentState);

    return fromState.filter((t) => {
        // Check role restriction
        if (t.roles && t.roles.length > 0) {
            if (!userRole || !t.roles.includes(userRole)) {
                return false;
            }
        }

        // Check condition
        try {
            return evaluateCondition(t.condition, submissionData);
        } catch {
            return false;
        }
    });
}

/**
 * Execute a specific transition by ID.
 *
 * @param {Object} workflow
 * @param {string} currentState
 * @param {string} transitionId
 * @param {Object} submissionData
 * @param {Object} user - { uid, email, role }
 * @returns {{ newState: string, historyEntry: Object }}
 * @throws {Error} if transition is invalid
 */
export function executeTransition(workflow, currentState, transitionId, submissionData = {}, user = {}) {
    // Find the transition
    const transition = workflow.transitions?.find((t) => t.id === transitionId);
    if (!transition) {
        throw Object.assign(new Error(`Transition "${transitionId}" not found`), { statusCode: 404 });
    }

    // Verify it's from the current state
    if (transition.from !== currentState) {
        throw Object.assign(
            new Error(`Transition "${transitionId}" is from state "${transition.from}" but submission is in state "${currentState}"`),
            { statusCode: 400 }
        );
    }

    // Check role
    if (transition.roles && transition.roles.length > 0) {
        const userRole = user.role || null;
        if (!userRole || !transition.roles.includes(userRole)) {
            throw Object.assign(
                new Error(`User role "${userRole || "none"}" is not authorized for this transition. Required: ${transition.roles.join(", ")}`),
                { statusCode: 403 }
            );
        }
    }

    // Evaluate condition
    try {
        const conditionMet = evaluateCondition(transition.condition, submissionData);
        if (!conditionMet) {
            throw Object.assign(
                new Error(`Condition not met for transition "${transitionId}": ${transition.condition}`),
                { statusCode: 400 }
            );
        }
    } catch (err) {
        if (err.statusCode) throw err;
        throw Object.assign(
            new Error(`Invalid condition in transition "${transitionId}": ${err.message}`),
            { statusCode: 400 }
        );
    }

    // Build history entry
    const historyEntry = {
        from: currentState,
        to: transition.to,
        transitionId: transition.id,
        timestamp: new Date(),
        user: user.uid || user.email || "system",
        note: transition.label || `${currentState} → ${transition.to}`,
    };

    return {
        newState: transition.to,
        historyEntry,
    };
}

/**
 * Determine the next state automatically (first valid transition).
 * Used for auto-advancing workflows.
 *
 * @param {Object} workflow
 * @param {string} currentState
 * @param {Object} submissionData
 * @returns {{ transition: Object, newState: string } | null}
 */
export function getNextState(workflow, currentState, submissionData = {}) {
    const available = getAvailableTransitions(workflow, currentState, submissionData);

    if (available.length === 0) return null;

    // Return the first valid transition
    const transition = available[0];
    return {
        transition,
        newState: transition.to,
    };
}
