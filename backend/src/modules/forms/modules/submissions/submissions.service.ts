// backend/src/modules/forms/modules/submissions/submissions.service.ts
import crypto from 'crypto';
import * as repo from './submissions.repository.js';
import Form from '@/models/Form.js';
import FormVersion from '@/models/FormVersion.js';
import { ApiError } from '@/shared/middleware/error.middleware.js';
import {
  canEditForm,
  canFillForm,
  canReviewSubmissions,
  normalizeEmail,
  normalizeVersionForResponse,
} from '../../form.utils.js';
import { evaluateFormLogicRuntime } from '@/shared/utils/logicEngine/index.js';
import {
  ISubmissionPage,
  IAuthenticatedUser,
  IForm,
  SubmissionResponse,
} from './submissions.types.js';
import { VersionResponse } from '../form-versions/form-version.types.js';

// --- Helpers ---
function assertFillAccess(form: IForm, version: VersionResponse, user: IAuthenticatedUser | null) {
  if (!canFillForm(form, version, user)) {
    if (!user) throw new ApiError(401, 'Authentication required to access this form');
    throw new ApiError(403, 'You do not have access to this form');
  }
}

function enforceCollectEmailMode(settings: any, reqBody: any, reqUser: IAuthenticatedUser | null) {
  const bodyEmail = normalizeEmail(reqBody?.email || '');
  const tokenEmail = normalizeEmail(reqUser?.email || '');

  if (settings.collectEmailMode === 'none') return null;

  const email = bodyEmail || tokenEmail || null;
  if (settings.collectEmailMode === 'required' && !email) {
    throw new ApiError(400, 'Email is required for this form');
  }
  return email;
}

function toCsvCell(value: any) {
  if (value === null || value === undefined) return '';
  const raw =
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : JSON.stringify(value);
  return `"${String(raw).replace(/"/g, '""')}"`;
}

function flattenSubmissionResponses(pages: any[] = []) {
  const out: Record<string, any> = {};
  for (const page of pages) {
    for (const response of page?.responses || []) {
      out[response.componentId] = response.response;
    }
  }
  return out;
}

// --- Services ---

export const submitFormService = async (
  formId: string,
  reqBody: any,
  user: IAuthenticatedUser | null,
) => {
  const form = await repo.findForm(formId);
  if (!form) throw new ApiError(404, 'Form not found');
  if (!form.isActive) throw new ApiError(400, 'Form is not accepting submissions');

  const publishedVersionDoc = await repo.findPublishedVersion(formId);
  if (!publishedVersionDoc)
    throw new ApiError(400, 'No published version available. Publish the form first.');

  const version = normalizeVersionForResponse(publishedVersionDoc);
  const { settings } = version;

  assertFillAccess(form, version, user);

  if (settings.requireLogin && !user) {
    throw new ApiError(401, 'Authentication required to submit this form');
  }

  if (settings.submissionLimit) {
    const count = await repo.countSubmissions({ formId, status: { $ne: 'draft' } });
    if (count >= settings.submissionLimit) {
      throw new ApiError(400, 'Submission limit reached');
    }
  }

  if (settings.closeDate && new Date() > new Date(settings.closeDate)) {
    throw new ApiError(400, 'Form submissions are closed');
  }

  const submissionPolicy = settings.submissionPolicy || 'none';
  if (user && (submissionPolicy === 'none' || submissionPolicy === 'edit_only')) {
    const existing = await repo.findExistingSubmission(formId, user.uid);
    if (existing) {
      throw new ApiError(409, 'New submissions are not allowed by this form policy');
    }
  }

  const email = enforceCollectEmailMode(settings, reqBody, user);

  const logicResult = evaluateFormLogicRuntime({
    version,
    pages: reqBody?.pages || [],
    stage: 'submit',
  });

  if (logicResult.errors?.length)
    throw new ApiError(409, 'Logic execution failed', logicResult.errors);
  if (logicResult.violations?.length)
    throw new ApiError(422, 'Validation failed', logicResult.violations);

  const submission = await repo.createSubmissionDoc({
    submissionId: crypto.randomUUID(),
    formId,
    version: reqBody.formVersion || version.version,
    submittedBy: user?.uid || null,
    email,
    status: reqBody?.status || 'submitted',
    meta: { isQuiz: version.meta?.isQuiz || false },
    pages: logicResult.pages as unknown as ISubmissionPage[],
  });

  return {
    message: settings.confirmationMessage || 'Thank you for your response!',
    submission,
  };
};

export const listSubmissionsService = async (
  formId: string,
  page: number,
  limit: number,
  user: IAuthenticatedUser,
) => {
  const [form, latestVersionDoc] = await Promise.all([
    repo.findForm(formId),
    repo.findLatestVersion(formId),
  ]);

  if (!form) throw new ApiError(404, 'Form not found');
  if (!latestVersionDoc) throw new ApiError(404, 'Form version not found');

  const latestVersion = normalizeVersionForResponse(latestVersionDoc);
  if (!canReviewSubmissions(form, latestVersion, user)) {
    throw new ApiError(403, 'Access denied');
  }

  const skip = (page - 1) * limit;
  const [submissions, total] = await Promise.all([
    repo.findSubmissionsPaginated(formId, skip, limit),
    repo.countSubmissions({ formId }),
  ]);

  return {
    form: { formId: form.formId, title: form.title },
    submissions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const exportSubmissionsCsvService = async (formId: string, user: IAuthenticatedUser) => {
  const [form, latestVersionDoc, submissions] = await Promise.all([
    repo.findForm(formId),
    repo.findLatestVersion(formId),
    repo.findAllSubmissions(formId),
  ]);

  if (!form) throw new ApiError(404, 'Form not found');
  if (!latestVersionDoc) throw new ApiError(404, 'Form version not found');

  const latestVersion = normalizeVersionForResponse(latestVersionDoc);
  if (!canReviewSubmissions(form, latestVersion, user)) {
    throw new ApiError(403, 'Access denied');
  }

  const orderedComponentIds: string[] = [];
  const componentSet = new Set<string>();

  for (const page of latestVersion.pages || []) {
    for (const component of page.components || []) {
      const componentId = component?.componentId;
      if (!componentId || componentSet.has(componentId)) continue;
      componentSet.add(componentId);
      orderedComponentIds.push(componentId);
    }
  }

  for (const submission of submissions) {
    const flat = flattenSubmissionResponses(submission.pages || []);
    for (const componentId of Object.keys(flat)) {
      if (componentSet.has(componentId)) continue;
      componentSet.add(componentId);
      orderedComponentIds.push(componentId);
    }
  }

  const header = [
    'submissionId',
    'submittedAt',
    'status',
    'submittedBy',
    'email',
    ...orderedComponentIds,
  ];
  const lines = [header.map(toCsvCell).join(',')];

  for (const submission of submissions) {
    const flat = flattenSubmissionResponses(submission.pages || []);
    const row = [
      submission.submissionId,
      submission.createdAt?.toISOString?.() || '',
      submission.status || '',
      submission.submittedBy || '',
      submission.email || '',
      ...orderedComponentIds.map((id) => flat[id] ?? ''),
    ];
    lines.push(row.map(toCsvCell).join(','));
  }

  return lines.join('\n');
};

export const getSubmissionService = async (
  formId: string,
  submissionId: string,
  user: IAuthenticatedUser,
) => {
  const [form, latestVersionDoc] = await Promise.all([
    repo.findForm(formId),
    repo.findLatestVersion(formId),
  ]);
  if (!form || !latestVersionDoc) throw new ApiError(404, 'Form or version not found');

  const latestVersion = normalizeVersionForResponse(latestVersionDoc);
  if (!canReviewSubmissions(form, latestVersion, user)) throw new ApiError(403, 'Access denied');

  const submission = await repo.findSubmissionById(formId, submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');

  return submission;
};

export const getMyFormSubmissionsService = async (formId: string, user: IAuthenticatedUser) => {
  const [form, latestVersionDoc, publishedVersionDoc] = await Promise.all([
    repo.findForm(formId),
    repo.findLatestVersion(formId),
    repo.findPublishedVersion(formId),
  ]);

  if (!form || !latestVersionDoc) throw new ApiError(404, 'Form or version not found');

  const latestVersion = normalizeVersionForResponse(latestVersionDoc);
  const publishedVersion = publishedVersionDoc
    ? normalizeVersionForResponse(publishedVersionDoc)
    : latestVersion;

  const canSelfView =
    publishedVersion.settings?.canViewOwnSubmission === true ||
    canReviewSubmissions(form, latestVersion, user) ||
    canEditForm(form, latestVersion, user);

  if (!canSelfView) throw new ApiError(403, 'Viewing your submissions is disabled for this form');

  return repo.findSubmissionsByUser(formId, user.uid);
};

export const updateMySubmissionService = async (
  formId: string,
  submissionId: string,
  reqBody: any,
  user: IAuthenticatedUser,
) => {
  const form = await repo.findForm(formId);
  if (!form) throw new ApiError(404, 'Form not found');

  const publishedVersionDoc = await repo.findPublishedVersion(formId);
  if (!publishedVersionDoc) throw new ApiError(400, 'No published version available');

  const version = normalizeVersionForResponse(publishedVersionDoc);
  const { settings } = version;

  assertFillAccess(form, version, user);

  if (settings.closeDate && new Date() > new Date(settings.closeDate)) {
    throw new ApiError(400, 'Form submissions are closed');
  }

  const policy = settings.submissionPolicy || 'none';
  if (policy !== 'edit_only' && policy !== 'edit_and_resubmit') {
    throw new ApiError(409, 'Editing submissions is not allowed by this form policy');
  }

  const submission = await repo.findSubmissionById(formId, submissionId);
  if (!submission || submission.submittedBy !== user.uid || submission.status === 'draft') {
    throw new ApiError(404, 'Submission not found or not editable');
  }

  const logicResult = evaluateFormLogicRuntime({
    version,
    pages: reqBody?.pages || [],
    stage: 'submit',
  });

  if (logicResult.errors?.length)
    throw new ApiError(409, 'Logic execution failed', logicResult.errors);
  if (logicResult.violations?.length)
    throw new ApiError(422, 'Validation failed', logicResult.violations);

  if (reqBody?.pages !== undefined) submission.pages = logicResult.pages as any;
  if (reqBody?.formVersion !== undefined) submission.version = reqBody.formVersion;
  submission.email = enforceCollectEmailMode(settings, reqBody, user);

  await (submission as any).save();
  return submission;
};

export const getMySubmissionsService = async (user: IAuthenticatedUser) => {
  const submissions = await repo.findGlobalSubmissionsByUser(user.uid, 100);

  const formIds = [...new Set(submissions.map((s) => s.formId))];
  const [forms, latestVersions] = await Promise.all([
    Form.find({ formId: { $in: formIds }, isDeleted: false }).select('formId title createdBy'),
    FormVersion.aggregate([
      { $match: { formId: { $in: formIds } } },
      { $sort: { version: -1 } },
      { $group: { _id: '$formId', version: { $first: '$$ROOT' } } },
    ]),
  ]);

  const formMap = new Map(forms.map((f) => [f.formId, f]));
  const versionMap = new Map(
    latestVersions.map((row) => [row._id, normalizeVersionForResponse(row.version)]),
  );

  const filtered = submissions.filter((submission) => {
    const form = formMap.get(submission.formId);
    const latestVersion = versionMap.get(submission.formId);
    if (!form || !latestVersion) return false;

    if (latestVersion.settings?.canViewOwnSubmission === true) return true;
    if (canReviewSubmissions(form, latestVersion, user)) return true;
    if (canEditForm(form, latestVersion, user)) return true;
    return false;
  });

  return filtered.map((submission) => ({
    submissionId: submission.submissionId,
    formId: submission.formId,
    formTitle: formMap.get(submission.formId)?.title || 'Unknown Form',
    version: submission.version,
    status: submission.status,
    submittedAt: submission.createdAt,
    pages: submission.pages || [],
  }));
};
