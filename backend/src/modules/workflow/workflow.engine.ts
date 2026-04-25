// backend/src/modules/workflow/workflow.engine.ts

import { evaluateCondition } from '@/shared/utils/conditionEvaluator.js';
import { IWorkflow, ITransition, IHistoryEntry } from './workflow.types.js';

/**
 * Validate a workflow definition.
 */
export function validateWorkflow(workflow: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!workflow) {
    return { valid: false, errors: ['Workflow is required'] };
  }

  const { states, initialState, transitions } = workflow;

  // States validation
  if (!Array.isArray(states) || states.length === 0) {
    errors.push('Workflow must have at least one state');
  } else {
    const uniqueStates = new Set(states);
    if (uniqueStates.size !== states.length) {
      errors.push('All states must be unique');
    }
  }

  // Initial state validation
  if (!initialState) {
    errors.push('initialState is required');
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
 */
export function getTransitionsFromState(workflow: IWorkflow, currentState: string): ITransition[] {
  if (!workflow?.transitions) return [];
  return workflow.transitions.filter((t: ITransition) => t.from === currentState);
}

/**
 * Get transitions available to a specific user.
 */
export function getAvailableTransitions(
  workflow: IWorkflow,
  currentState: string,
  submissionData: Record<string, any> = {},
  userRole: string | null = null,
): ITransition[] {
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
 */
export function executeTransition(
  workflow: IWorkflow,
  currentState: string,
  transitionId: string,
  submissionData: Record<string, any> = {},
  user: { uid?: string; email?: string; role?: string | null } = {},
): { newState: string; historyEntry: IHistoryEntry } {
  // Find the transition
  const transition = workflow.transitions?.find((t: ITransition) => t.id === transitionId);
  if (!transition) {
    const err = new Error(`Transition "${transitionId}" not found`);
    (err as any).statusCode = 404;
    throw err;
  }

  // Verify it's from the current state
  if (transition.from !== currentState) {
    const err = new Error(
      `Transition "${transitionId}" is from state "${transition.from}" but submission is in state "${currentState}"`,
    );
    (err as any).statusCode = 400;
    throw err;
  }

  // Check role
  if (transition.roles && transition.roles.length > 0) {
    const userRole = user.role || null;
    if (!userRole || !transition.roles.includes(userRole)) {
      const err = new Error(
        `User role "${userRole || 'none'}" is not authorized for this transition. Required: ${transition.roles.join(', ')}`,
      );
      (err as any).statusCode = 403;
      throw err;
    }
  }

  // Evaluate condition
  try {
    const conditionMet = evaluateCondition(transition.condition, submissionData);
    if (!conditionMet) {
      const err = new Error(
        `Condition not met for transition "${transitionId}": ${transition.condition}`,
      );
      (err as any).statusCode = 400;
      throw err;
    }
  } catch (err: any) {
    if (err.statusCode) throw err;
    const error = new Error(`Invalid condition in transition "${transitionId}": ${err.message}`);
    (error as any).statusCode = 400;
    throw error;
  }

  // Build history entry
  const historyEntry: IHistoryEntry = {
    from: currentState,
    to: transition.to,
    transitionId: transition.id,
    timestamp: new Date(),
    user: user.uid || user.email || 'system',
    note: transition.label || `${currentState} → ${transition.to}`,
  };

  return {
    newState: transition.to,
    historyEntry,
  };
}

/**
 * Determine the next state automatically (first valid transition).
 */
export function getNextState(
  workflow: IWorkflow,
  currentState: string,
  submissionData: Record<string, any> = {},
): { transition: ITransition; newState: string } | null {
  const available = getAvailableTransitions(workflow, currentState, submissionData);

  if (available.length === 0) return null;

  // Return the first valid transition
  const transition = available[0];
  return {
    transition,
    newState: transition.to,
  };
}
