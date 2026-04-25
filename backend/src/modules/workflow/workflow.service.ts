// backend/src/modules/workflow/workflow.service.ts

import Form from '@/database/models/Form.js';
import FormVersion from '@/database/models/FormVersion.js';
import Submission from '@/database/models/Submission.js';
import { ApiError } from '@/middlewares/error.middleware.js';
import { canEditForm } from '../form/form.utils.js';
import * as engine from './workflow.engine.js';
import { IWorkflow, ITransitionResult, IAvailableTransitions } from './workflow.types.js';

async function assertCanManageWorkflow(formId: string, user: any) {
  const [form, latestVersion] = await Promise.all([
    Form.findOne({ formId, isDeleted: false }),
    FormVersion.findOne({ formId }).sort({ version: -1 }),
  ]);

  if (!form) throw new ApiError(404, 'Form not found');
  if (!latestVersion) throw new ApiError(404, 'Form version not found');

  if (!canEditForm(form as any, latestVersion as any, user)) {
    throw new ApiError(403, 'Access denied');
  }

  return form;
}

function flattenSubmissionData(submission: any) {
  const data: Record<string, any> = {};

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

function mapStateToStatus(
  state: string,
): 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' {
  const mapping: Record<string, 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'> =
    {
      submitted: 'submitted',
      under_review: 'under_review',
      approved: 'approved',
      rejected: 'rejected',
      draft: 'draft',
    };
  return mapping[state] || 'submitted';
}

export const setWorkflowService = async (
  formId: string,
  workflowData: any,
  user: any,
): Promise<IWorkflow> => {
  const form = await assertCanManageWorkflow(formId, user);

  if (workflowData.enabled === false) {
    const workflow: IWorkflow = {
      enabled: false,
      states: workflowData.states || [],
      initialState: workflowData.initialState || '',
      transitions: workflowData.transitions || [],
    };
    (form as any).workflow = workflow;
    await form.save();
    return workflow;
  }

  const { valid, errors } = engine.validateWorkflow(workflowData);
  if (!valid) {
    throw new ApiError(400, `Invalid workflow: ${errors.join('; ')}`);
  }

  const workflow: IWorkflow = {
    enabled: workflowData.enabled !== false,
    states: workflowData.states,
    initialState: workflowData.initialState,
    transitions: (workflowData.transitions || []).map((t: any) => ({
      id: t.id,
      from: t.from,
      to: t.to,
      condition: t.condition || '',
      roles: t.roles || [],
      label: t.label || '',
    })),
  };

  (form as any).workflow = workflow;
  await form.save();

  return workflow;
};

export const getWorkflowService = async (formId: string, user: any): Promise<IWorkflow> => {
  const form = await assertCanManageWorkflow(formId, user);
  return (
    (form as any).workflow || { enabled: false, states: [], initialState: '', transitions: [] }
  );
};

export const transitionSubmissionService = async (
  formId: string,
  submissionId: string,
  transitionId: string,
  requestRole: string | undefined,
  userToken: any,
): Promise<ITransitionResult> => {
  if (!transitionId) throw new ApiError(400, 'transitionId is required');

  const form = await Form.findOne({ formId, isDeleted: false });
  if (!form) throw new ApiError(404, 'Form not found');

  const workflow = (form as any).workflow as IWorkflow;
  if (!workflow || !workflow.enabled) {
    throw new ApiError(400, 'Form does not have an active workflow');
  }

  const submission = await Submission.findOne({ formId, submissionId });
  if (!submission) throw new ApiError(404, 'Submission not found');

  if (!(submission as any).currentState) {
    throw new ApiError(400, 'Submission has no workflow state');
  }

  const submissionData = flattenSubmissionData(submission);

  const user = {
    uid: userToken?.uid,
    email: userToken?.email,
    role: requestRole || userToken?.role || null,
  };

  const { newState, historyEntry } = engine.executeTransition(
    workflow,
    (submission as any).currentState,
    transitionId,
    submissionData,
    user,
  );

  (submission as any).currentState = newState;
  (submission as any).workflowHistory.push(historyEntry);
  submission.status = mapStateToStatus(newState);

  await submission.save();

  return {
    submissionId: (submission as any).submissionId,
    currentState: (submission as any).currentState,
    status: submission.status,
    historyEntry,
  };
};

export const listAvailableTransitionsService = async (
  formId: string,
  submissionId: string,
  requestRole: string | undefined,
  userToken: any,
): Promise<IAvailableTransitions> => {
  const form = await Form.findOne({ formId, isDeleted: false });
  if (!form) throw new ApiError(404, 'Form not found');

  const workflow = (form as any).workflow as IWorkflow;
  if (!workflow || !workflow.enabled) {
    return { currentState: null, transitions: [] };
  }

  const submission = await Submission.findOne({ formId, submissionId });
  if (!submission) throw new ApiError(404, 'Submission not found');

  if (!(submission as any).currentState) {
    return { currentState: null, transitions: [] };
  }

  const submissionData = flattenSubmissionData(submission);
  const userRole = requestRole || userToken?.role || null;

  const transitions = engine.getAvailableTransitions(
    workflow,
    (submission as any).currentState,
    submissionData,
    userRole,
  );

  return {
    currentState: (submission as any).currentState,
    transitions: transitions.map((t) => ({
      id: t.id,
      from: t.from,
      to: t.to,
      label: t.label || `${t.from} → ${t.to}`,
      roles: t.roles,
    })),
  };
};
