/**
 * Workflow Controller
 * ────────────────────────────────────────────────────────────────────
 * API handlers for workflow management and submission transitions.
 * ────────────────────────────────────────────────────────────────────
 */

import Form from "../models/Form.js";
import FormVersion from "../models/FormVersion.js";
import Submission from "../models/Submission.js";
import { createError } from "../middleware/errorHandler.js";
import { canEditForm } from "../utils/formPermissions.js";
import {
    validateWorkflow,
    executeTransition,
    getAvailableTransitions,
} from "../services/workflowEngine.js";

async function assertCanManageWorkflow(formId, user) {
    const [form, latestVersion] = await Promise.all([
        Form.findOne({ formId, isDeleted: false }),
        FormVersion.findOne({ formId }).sort({ version: -1 }),
    ]);

    if (!form) throw createError(404, "Form not found");
    if (!latestVersion) throw createError(404, "Form version not found");
    if (!canEditForm(form, latestVersion, user)) {
        throw createError(403, "Access denied");
    }

    return form;
}

/**
 * PUT /api/forms/:formId/workflow
 * Save or update a workflow definition on a form.
 */
export const setWorkflow = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const form = await assertCanManageWorkflow(formId, req.user);

        const workflowData = req.body;

        // If disabling, just save enabled: false
        if (workflowData.enabled === false) {
            form.workflow = {
                enabled: false,
                states: workflowData.states || [],
                initialState: workflowData.initialState || "",
                transitions: workflowData.transitions || [],
            };
            await form.save();
            return res.status(200).json({ message: "Workflow disabled", workflow: form.workflow });
        }

        // Validate workflow before saving
        const { valid, errors } = validateWorkflow(workflowData);
        if (!valid) {
            throw createError(400, `Invalid workflow: ${errors.join("; ")}`);
        }

        form.workflow = {
            enabled: workflowData.enabled !== false,
            states: workflowData.states,
            initialState: workflowData.initialState,
            transitions: (workflowData.transitions || []).map((t) => ({
                id: t.id,
                from: t.from,
                to: t.to,
                condition: t.condition || "",
                roles: t.roles || [],
                label: t.label || "",
            })),
        };

        await form.save();

        res.status(200).json({
            message: "Workflow saved",
            workflow: form.workflow,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/workflow
 * Retrieve the workflow definition for a form.
 */
export const getWorkflow = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const form = await assertCanManageWorkflow(formId, req.user);

        res.status(200).json({
            workflow: form.workflow || { enabled: false, states: [], initialState: "", transitions: [] },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/forms/:formId/submissions/:submissionId/transition
 * Execute a transition on a submission.
 *
 * Body: { transitionId: string, role?: string }
 */
export const transitionSubmission = async (req, res, next) => {
    try {
        const { formId, submissionId } = req.params;
        const { transitionId } = req.body;

        if (!transitionId) throw createError(400, "transitionId is required");

        // Load form + submission
        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");

        if (!form.workflow || !form.workflow.enabled) {
            throw createError(400, "Form does not have an active workflow");
        }

        const submission = await Submission.findOne({ formId, submissionId });
        if (!submission) throw createError(404, "Submission not found");

        if (!submission.currentState) {
            throw createError(400, "Submission has no workflow state");
        }

        // Flatten submission data for condition evaluation
        const submissionData = flattenSubmissionData(submission);

        // Execute the transition
        const user = {
            uid: req.user?.uid,
            email: req.user?.email,
            role: req.body.role || req.user?.role || null,
        };

        const { newState, historyEntry } = executeTransition(
            form.workflow,
            submission.currentState,
            transitionId,
            submissionData,
            user
        );

        // Update submission
        submission.currentState = newState;
        submission.workflowHistory.push(historyEntry);

        // Also update the status field to stay in sync
        submission.status = mapStateToStatus(newState);

        await submission.save();

        res.status(200).json({
            message: `Transitioned to "${newState}"`,
            submission: {
                submissionId: submission.submissionId,
                currentState: submission.currentState,
                status: submission.status,
                historyEntry,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/submissions/:submissionId/transitions
 * Get available transitions for the current user.
 *
 * Query: ?role=manager
 */
export const listAvailableTransitions = async (req, res, next) => {
    try {
        const { formId, submissionId } = req.params;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");

        if (!form.workflow || !form.workflow.enabled) {
            return res.status(200).json({ transitions: [] });
        }

        const submission = await Submission.findOne({ formId, submissionId });
        if (!submission) throw createError(404, "Submission not found");

        if (!submission.currentState) {
            return res.status(200).json({ transitions: [] });
        }

        const submissionData = flattenSubmissionData(submission);
        const userRole = req.query.role || req.user?.role || null;

        const transitions = getAvailableTransitions(
            form.workflow,
            submission.currentState,
            submissionData,
            userRole
        );

        res.status(200).json({
            currentState: submission.currentState,
            transitions: transitions.map((t) => ({
                id: t.id,
                from: t.from,
                to: t.to,
                label: t.label || `${t.from} → ${t.to}`,
                roles: t.roles,
            })),
        });
    } catch (err) {
        next(err);
    }
};

// ── Helpers ──

/**
 * Flatten submission pages/responses into a flat key-value object
 * for condition evaluation.
 */
function flattenSubmissionData(submission) {
    const data = {};

    if (submission.pages) {
        for (const page of submission.pages) {
            if (page.responses) {
                for (const resp of page.responses) {
                    data[resp.componentId] = resp.response;
                }
            }
        }
    }

    return data;
}

/**
 * Map workflow states to the existing status enum values where possible.
 */
function mapStateToStatus(state) {
    const mapping = {
        submitted: "submitted",
        under_review: "under_review",
        approved: "approved",
        rejected: "rejected",
        draft: "draft",
    };
    return mapping[state] || "submitted";
}
