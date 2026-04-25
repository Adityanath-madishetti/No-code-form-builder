// backend/src/services/workflowService.js

import Form from '../models/Form.js';
import FormVersion from '../models/FormVersion.js';
import Submission from '../models/Submission.js';
import { createError } from '../shared/middleware/error.middleware.js';
import { canEditForm } from '../modules/forms/form.utils.js';
import { validateWorkflow, executeTransition, getAvailableTransitions } from './workflowEngine.js';

async function assertCanManageWorkflow(formId, user) {
  const [form, latestVersion] = await Promise.all([
    Form.findOne({ formId, isDeleted: false }),
    FormVersion.findOne({ formId }).sort({ version: -1 }),
  ]);

  if (!form) throw createError(404, 'Form not found');
  if (!latestVersion) throw createError(404, 'Form version not found');
  if (!canEditForm(form, latestVersion, user)) {
    throw createError(403, 'Access denied');
  }

  return form;
}

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

function mapStateToStatus(state) {
  const mapping = {
    submitted: 'submitted',
    under_review: 'under_review',
    approved: 'approved',
    rejected: 'rejected',
    draft: 'draft',
  };
  return mapping[state] || 'submitted';
}

export async function setWorkflowService(formId, workflowData, user) {
  const form = await assertCanManageWorkflow(formId, user);

  if (workflowData.enabled === false) {
    form.workflow = {
      enabled: false,
      states: workflowData.states || [],
      initialState: workflowData.initialState || '',
      transitions: workflowData.transitions || [],
    };
    await form.save();
    return form.workflow;
  }

  const { valid, errors } = validateWorkflow(workflowData);
  if (!valid) {
    throw createError(400, `Invalid workflow: ${errors.join('; ')}`);
  }

  form.workflow = {
    enabled: workflowData.enabled !== false,
    states: workflowData.states,
    initialState: workflowData.initialState,
    transitions: (workflowData.transitions || []).map((t) => ({
      id: t.id,
      from: t.from,
      to: t.to,
      condition: t.condition || '',
      roles: t.roles || [],
      label: t.label || '',
    })),
  };

  await form.save();

  return form.workflow;
}

export async function getWorkflowService(formId, user) {
  const form = await assertCanManageWorkflow(formId, user);
  return form.workflow || { enabled: false, states: [], initialState: '', transitions: [] };
}

export async function transitionSubmissionService(
  formId,
  submissionId,
  transitionId,
  requestRole,
  userToken,
) {
  if (!transitionId) throw createError(400, 'transitionId is required');

  const form = await Form.findOne({ formId, isDeleted: false });
  if (!form) throw createError(404, 'Form not found');

  if (!form.workflow || !form.workflow.enabled) {
    throw createError(400, 'Form does not have an active workflow');
  }

  const submission = await Submission.findOne({ formId, submissionId });
  if (!submission) throw createError(404, 'Submission not found');

  if (!submission.currentState) {
    throw createError(400, 'Submission has no workflow state');
  }

  const submissionData = flattenSubmissionData(submission);

  const user = {
    uid: userToken?.uid,
    email: userToken?.email,
    role: requestRole || userToken?.role || null,
  };

  const { newState, historyEntry } = executeTransition(
    form.workflow,
    submission.currentState,
    transitionId,
    submissionData,
    user,
  );

  submission.currentState = newState;
  submission.workflowHistory.push(historyEntry);
  submission.status = mapStateToStatus(newState);

  await submission.save();

  return {
    submissionId: submission.submissionId,
    currentState: submission.currentState,
    status: submission.status,
    historyEntry,
  };
}

export async function listAvailableTransitionsService(
  formId,
  submissionId,
  requestRole,
  userToken,
) {
  const form = await Form.findOne({ formId, isDeleted: false });
  if (!form) throw createError(404, 'Form not found');

  if (!form.workflow || !form.workflow.enabled) {
    return { currentState: null, transitions: [] };
  }

  const submission = await Submission.findOne({ formId, submissionId });
  if (!submission) throw createError(404, 'Submission not found');

  if (!submission.currentState) {
    return { currentState: null, transitions: [] };
  }

  const submissionData = flattenSubmissionData(submission);
  const userRole = requestRole || userToken?.role || null;

  const transitions = getAvailableTransitions(
    form.workflow,
    submission.currentState,
    submissionData,
    userRole,
  );

  return {
    currentState: submission.currentState,
    transitions: transitions.map((t) => ({
      id: t.id,
      from: t.from,
      to: t.to,
      label: t.label || `${t.from} → ${t.to}`,
      roles: t.roles,
    })),
  };
}
