// backend/src/modules/forms/form.service.ts

import crypto from 'crypto';
import * as repo from './form.repository.js';
import { ApiError } from '@/shared/middleware/error.middleware.js';
import {
  canEditForm,
  canFillForm,
  normalizeEmail,
  normalizeVersionForResponse,
  normalizeAccess,
} from './form.utils.js';
import { IFormCreate, IFormUpdate, ISharedFormResponse } from './form.types.js';

/**
 * Resolve UIDs for identities that only provide an email, if they exist in our system.
 */
export async function resolveAccessIdentities(access: any) {
  const normalized = normalizeAccess(access);

  // Collect all emails that need resolution
  const emailsToResolve = [...normalized.editors, ...normalized.reviewers, ...normalized.viewers]
    .filter((e) => !e.uid && e.email)
    .map((e) => e.email);

  if (emailsToResolve.length === 0) return normalized;

  // Bulk lookup
  const { usersByEmail } = await repo.findUsersByIdentities(emailsToResolve, []);
  const emailMap = new Map(usersByEmail.map((u: any) => [u.email.toLowerCase(), u.uid]));

  const resolve = (list: any[]) =>
    list.map((entry) => {
      if (!entry.uid && entry.email) {
        const foundUid = emailMap.get(entry.email.toLowerCase());
        if (foundUid) return { ...entry, uid: foundUid };
      }
      return entry;
    });

  return {
    ...normalized,
    editors: resolve(normalized.editors),
    reviewers: resolve(normalized.reviewers),
    viewers: resolve(normalized.viewers),
  };
}

export const createFormService = async (uid: string, body: IFormCreate) => {
  const formId = crypto.randomUUID();
  const title = body.title || 'Untitled Form';

  const form = await repo.createFormDoc({
    formId,
    title,
    currentVersion: 1,
    createdBy: uid,
  });

  const formVersion = await repo.createVersionDoc({
    formId,
    version: 1,
    meta: {
      createdBy: uid,
      name: title,
      description: body.description || '',
      isDraft: true,
    },
    settings: {
      collectEmailMode: 'none',
      submissionPolicy: 'none',
      canViewOwnSubmission: false,
    },
    access: {
      visibility: 'private',
      editors: [],
      reviewers: [],
      viewers: [],
    },
    pages: [],
    versionHistory: [
      {
        version: 1,
        createdBy: uid,
        createdAt: new Date(),
        message: 'Initial draft',
      },
    ],
  });

  return { form, formVersion };
};

export const listFormsService = async (uid: string) => {
  return repo.findFormsByUser(uid);
};

export const listSharedFormsService = async (user: any) => {
  const uid = user.uid;
  const email = normalizeEmail(user.email);

  const sharedFormRows = await repo.getSharedFormAccessData(uid, email);

  const hasIdentity = (list: any[] = []) =>
    Array.isArray(list) &&
    list.some((entry) => {
      const entryUid = typeof entry?.uid === 'string' ? entry.uid : '';
      const entryEmail = normalizeEmail(entry?.email);
      return (entryUid && entryUid === uid) || (email && entryEmail === email);
    });

  const roleMap = new Map<string, string[]>();
  for (const row of sharedFormRows) {
    const roles: string[] = [];
    if (hasIdentity(row.latestAccess?.editors)) roles.push('editor');
    if (hasIdentity(row.latestAccess?.reviewers)) roles.push('reviewer');
    if (roles.length) {
      roleMap.set(row.formId, roles);
    }
  }

  const sharedFormIds = [...roleMap.keys()];
  if (sharedFormIds.length === 0) return [];

  const [forms, submissionCounts] = await Promise.all([
    repo.findFormsByIds(sharedFormIds, uid),
    repo.getSubmissionCounts(sharedFormIds),
  ]);

  const countMap = new Map(submissionCounts.map((entry: any) => [entry._id, entry.count]));

  return forms
    .map((form: any) => {
      const sharedRoles = roleMap.get(form.formId) || [];
      if (!sharedRoles.length) return null;

      return {
        formId: form.formId,
        title: form.title,
        currentVersion: form.currentVersion,
        isActive: form.isActive,
        createdBy: form.createdBy,
        updatedAt: form.updatedAt,
        createdAt: form.createdAt,
        sharedRole: sharedRoles.includes('editor') ? 'editor' : 'reviewer',
        sharedRoles,
        submissionCount: countMap.get(form.formId) || 0,
      };
    })
    .filter(Boolean);
};

export const getFormService = async (formId: string, user: any) => {
  const form = await repo.findFormById(formId);
  if (!form) throw new ApiError(404, 'Form not found');

  const latestVersion = await repo.findLatestVersion(formId);
  if (!latestVersion) throw new ApiError(404, 'Form version not found');

  if (!canEditForm(form, latestVersion, user)) {
    throw new ApiError(403, 'Access denied');
  }

  return form;
};

export const updateFormService = async (formId: string, body: IFormUpdate, user: any) => {
  const form = await repo.findFormById(formId);
  if (!form) throw new ApiError(404, 'Form not found');

  const latestVersion = await repo.findLatestVersion(formId);
  if (!latestVersion) throw new ApiError(404, 'Form version not found');

  if (!canEditForm(form, latestVersion, user)) {
    throw new ApiError(403, 'Access denied');
  }

  return repo.updateFormDoc(formId, body);
};

export const deleteFormService = async (formId: string, uid: string) => {
  const form = await repo.deleteFormDoc(formId, uid);
  if (!form) throw new ApiError(404, 'Form not found');
  return form;
};

export const publishFormService = async (formId: string, uid: string) => {
  const form = await repo.findFormById(formId);
  if (!form) throw new ApiError(404, 'Form not found');
  if (form.createdBy !== uid) throw new ApiError(403, 'Access denied');

  await repo.updateFormDoc(formId, { isActive: true });

  const latestVersion = await repo.findLatestVersion(formId);
  if (!latestVersion) throw new ApiError(400, 'No version to publish');

  latestVersion.meta.isDraft = false;
  await (latestVersion as any).save();

  return { form, publishedVersion: latestVersion.version };
};

export const getPublicFormService = async (formId: string, user: any) => {
  const form = await repo.findFormById(formId);
  if (!form) throw new ApiError(404, 'Form not found');
  if (!form.isActive) {
    throw new ApiError(400, 'This form is not currently accepting responses');
  }

  const versionDoc = await repo.findPublishedVersion(formId);
  if (!versionDoc) throw new ApiError(400, 'No published version available');

  const version = normalizeVersionForResponse(versionDoc);

  if (!canFillForm(form, version, user)) {
    if (!user) throw new ApiError(401, 'Authentication required to access this form');
    throw new ApiError(403, 'You do not have access to this form');
  }

  return { form, version };
};
