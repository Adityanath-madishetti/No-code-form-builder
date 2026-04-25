// backend/src/modules/forms/form.permissions.ts

import { normalizeLogicPayload } from '@/utils/logicEngine/index.js';

const VISIBILITY_VALUES = new Set(['public', 'private', 'link-only']);
const COLLECT_EMAIL_MODE_VALUES = new Set(['none', 'optional', 'required']);
const SUBMISSION_POLICY_VALUES = new Set([
  'none',
  'edit_only',
  'resubmit_only',
  'edit_and_resubmit',
]);

export interface IdentityEntry {
  uid: string;
  email: string;
}

export function normalizeEmail(email: string | any): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function asIdentity(raw: any): IdentityEntry | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const email = normalizeEmail(raw);
    return email ? { uid: '', email } : null;
  }

  if (typeof raw === 'object') {
    const uid = typeof raw.uid === 'string' ? raw.uid.trim() : '';
    const email = normalizeEmail(raw.email);
    if (!uid && !email) return null;
    return { uid, email };
  }

  return null;
}

function dedupeIdentities(entries: (IdentityEntry | null)[]): IdentityEntry[] {
  const byUid = new Set();
  const byEmail = new Set();
  const result: IdentityEntry[] = [];

  for (const entry of entries) {
    if (!entry) continue;
    const uidKey = entry.uid || '';
    const emailKey = normalizeEmail(entry.email);

    if (uidKey) {
      if (byUid.has(uidKey)) continue;
      byUid.add(uidKey);
      result.push({ uid: uidKey, email: emailKey });
      continue;
    }

    if (!emailKey || byEmail.has(emailKey)) continue;
    byEmail.add(emailKey);
    result.push({ uid: '', email: emailKey });
  }

  return result;
}

function listToIdentities(list: any): IdentityEntry[] {
  if (!Array.isArray(list)) return [];
  return dedupeIdentities(list.map(asIdentity).filter(Boolean));
}

export function normalizeAccess(access: any) {
  const visibility = VISIBILITY_VALUES.has(access?.visibility) ? access.visibility : 'private';

  return {
    visibility,
    editors: listToIdentities(access?.editors),
    reviewers: listToIdentities(access?.reviewers),
    viewers: listToIdentities(access?.viewers),
    roles: access?.roles || {},
  };
}

export function normalizeSettings(settings: any) {
  const collectEmailMode = COLLECT_EMAIL_MODE_VALUES.has(settings?.collectEmailMode)
    ? settings.collectEmailMode
    : settings?.collectEmail
      ? 'required'
      : 'none';

  const submissionPolicy = SUBMISSION_POLICY_VALUES.has(settings?.submissionPolicy)
    ? settings.submissionPolicy
    : settings?.allowMultipleSubmissions
      ? 'resubmit_only'
      : 'none';

  return {
    ...settings,
    collectEmailMode,
    submissionPolicy,
    canViewOwnSubmission: settings?.canViewOwnSubmission === true,
    confirmationMessage: settings?.confirmationMessage || 'Thank you for your response!',
  };
}

function matchesIdentity(entry: IdentityEntry, user: any): boolean {
  if (!entry || !user) return false;
  if (entry.uid && user.uid && entry.uid === user.uid) return true;
  if (entry.email && user.email) {
    return normalizeEmail(entry.email) === normalizeEmail(user.email);
  }
  return false;
}

function hasRole(roleList: any, user: any): boolean {
  const identities = listToIdentities(roleList);
  return identities.some((entry) => matchesIdentity(entry, user));
}

export function isOwner(form: any, user: any): boolean {
  return Boolean(form?.createdBy && user?.uid && form.createdBy === user.uid);
}

export function isEditor(version: any, user: any): boolean {
  return hasRole(version?.access?.editors, user);
}

export function isReviewer(version: any, user: any): boolean {
  return hasRole(version?.access?.reviewers, user);
}

export function isViewer(version: any, user: any): boolean {
  return hasRole(version?.access?.viewers, user);
}

export function canEditForm(form: any, version: any, user: any): boolean {
  return isOwner(form, user) || isEditor(version, user);
}

export function canReviewSubmissions(form: any, version: any, user: any): boolean {
  return isOwner(form, user) || isEditor(version, user) || isReviewer(version, user);
}

export function canFillForm(form: any, version: any, user: any): boolean {
  if (!form || !version) return false;

  const access = normalizeAccess(version.access);
  if (access.visibility === 'public') return true;

  if (!user) return false;
  if (isOwner(form, user)) return true;
  if (isEditor(version, user)) return true;
  if (isReviewer(version, user)) return true;
  if (isViewer(version, user)) return true;

  return false;
}

export function normalizeVersionForResponse(versionDoc: any) {
  if (!versionDoc) return versionDoc;
  const plain = versionDoc.toObject ? versionDoc.toObject() : versionDoc;

  plain.settings = normalizeSettings(plain.settings || {});
  plain.access = normalizeAccess(plain.access || {});
  plain.logic = normalizeLogicPayload(plain.logic || {});

  return plain;
}
