// src/lib/formApi.ts
import { api } from './api';
import type {
  AccessIdentity,
  CollectEmailMode,
  Form,
  FormAccess,
  FormPage,
  FormSettings,
  FormTheme,
  SubmissionPolicy,
} from '@/form/components/base';
import type {
  LogicRule,
  FormulaRule,
  ComponentShuffleStack,
} from '@/form/logic/logicTypes';
import type { Workflow } from '@/form/workflow/workflowTypes';
import type { AnyFormComponent } from '@/form/registry/componentRegistry';
import { deserializeComponent } from '@/form/registry/componentRegistry';
import type { ComponentID } from '@/form/components/base';

import {
  frontendToBackend,
  backendToFrontend,
} from './frontendBackendCompArray';

interface BackendIdentity {
  uid?: string;
  email: string;
}

interface BackendAccess {
  visibility?: 'public' | 'private' | 'link-only';
  editors?: BackendIdentity[];
  reviewers?: BackendIdentity[];
  viewers?: BackendIdentity[];
}

interface BackendSettings {
  submissionLimit?: number;
  closeDate?: string;
  collectEmailMode?: CollectEmailMode;
  submissionPolicy?: SubmissionPolicy;
  canViewOwnSubmission?: boolean;
  confirmationMessage?: string;
  collectEmail?: boolean;
  allowMultipleSubmissions?: boolean;
}

interface BackendComponent {
  componentId: string;
  componentType: string;
  label: string;
  description?: string;
  required?: boolean;
  group?: string;
  props: Record<string, unknown>;
  validation: Record<string, unknown>;
  order: number;
}

interface BackendPage {
  pageId: string;
  pageNo: number;
  title: string;
  description?: string;
  components: BackendComponent[];
  defaultNextPageId?: string;
  defaultPreviousPageId?: string;
}

interface BackendFormVersion {
  formId: string;
  version: number;
  meta: {
    createdBy: string;
    name: string;
    description: string;
    isDraft: boolean;
  };
  theme: FormTheme;
  settings?: BackendSettings;
  access?: BackendAccess;
  pages: BackendPage[];
  logic?: {
    rules?: LogicRule[];
    formulas?: FormulaRule[];
    componentShuffleStacks?: ComponentShuffleStack[];
  };
}

function normalizeIdentityList(
  list: BackendIdentity[] | undefined
): AccessIdentity[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: AccessIdentity[] = [];

  for (const entry of list) {
    const email =
      typeof entry?.email === 'string' ? entry.email.trim().toLowerCase() : '';
    const uid = typeof entry?.uid === 'string' ? entry.uid.trim() : '';
    if (!email) continue;
    const key = uid || email;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(uid ? { uid, email } : { email });
  }

  return out;
}

function normalizeAccess(access: BackendAccess | undefined): FormAccess {
  const visibility =
    access?.visibility === 'public' ||
    access?.visibility === 'private' ||
    access?.visibility === 'link-only'
      ? access.visibility
      : 'private';

  return {
    visibility,
    editors: normalizeIdentityList(access?.editors),
    reviewers: normalizeIdentityList(access?.reviewers),
    viewers: normalizeIdentityList(access?.viewers),
  };
}

function normalizeSettings(
  settings: BackendSettings | undefined
): FormSettings {
  const collectEmailMode: CollectEmailMode =
    settings?.collectEmailMode ??
    (settings?.collectEmail ? 'required' : 'none');

  const submissionPolicy: SubmissionPolicy =
    settings?.submissionPolicy ??
    (settings?.allowMultipleSubmissions ? 'resubmit_only' : 'none');

  return {
    submissionLimit:
      typeof settings?.submissionLimit === 'number'
        ? settings.submissionLimit
        : null,
    closeDate: settings?.closeDate || null,
    collectEmailMode,
    submissionPolicy,
    canViewOwnSubmission: settings?.canViewOwnSubmission === true,
    confirmationMessage:
      settings?.confirmationMessage || 'Thank you for your response!',
  };
}

export async function loadFormVersion(formId: string): Promise<{
  form: Form;
  pages: FormPage[];
  components: AnyFormComponent[];
  version: number;
  logicRules: LogicRule[];
  logicFormulas: FormulaRule[];
  logicShuffleStacks: ComponentShuffleStack[];
}> {
  const res = await api.get<{ version: BackendFormVersion }>(
    `/api/forms/${formId}/versions/latest`
  );
  const v = res.version;

  const form: Form = {
    id: v.formId,
    name: v.meta.name,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: v.meta.description || '',
      authorId: v.meta.createdBy,
      version: v.version,
    },
    theme: v.theme,
    access: normalizeAccess(v.access),
    settings: normalizeSettings(v.settings),
    pages: v.pages.map((p) => p.pageId),
  };

  const pages: FormPage[] = [];
  const components: AnyFormComponent[] = [];

  for (const bp of v.pages) {
    const childIds: string[] = [];

    for (const bc of bp.components) {
      const feId = backendToFrontend[bc.componentType] || bc.componentType;

      const comp = deserializeComponent({
        id: feId as ComponentID,
        instanceId: bc.componentId,
        metadata: {
          label: bc.label || feId,
        },
        props: bc.props as never,
        validation: bc.validation as never,
      });

      components.push(comp as unknown as AnyFormComponent);
      childIds.push(bc.componentId);
    }

    pages.push({
      id: bp.pageId,
      title: bp.title,
      description: bp.description,
      children: childIds,
      isTerminal: false,
      defaultPreviousPageId: bp.defaultPreviousPageId,
      defaultNextPageId: bp.defaultNextPageId,
    });
  }

  return {
    form,
    pages,
    components,
    version: v.version,
    logicRules: v.logic?.rules ?? [],
    logicFormulas: v.logic?.formulas ?? [],
    logicShuffleStacks: v.logic?.componentShuffleStacks ?? [],
  };
}

export async function saveFormVersion(
  formId: string,
  versionNum: number,
  storeForm: Form,
  storePages: Record<string, FormPage>,
  storeComponents: Record<string, AnyFormComponent>,
  createdBy: string = 'unknown',
  logicRules: LogicRule[] = [],
  logicFormulas: FormulaRule[] = [],
  logicShuffleStacks: ComponentShuffleStack[] = []
): Promise<void> {
  const orderedPageIds = storeForm.pages;
  const pages: BackendPage[] = orderedPageIds.map((pageId, idx) => {
    const page = storePages[pageId];
    const comps: BackendComponent[] = (page?.children || []).map(
      (childId, order) => {
        const comp = storeComponents[childId];
        if (!comp) {
          return {
            componentId: childId,
            componentType: 'custom',
            label: 'Unknown',
            props: {},
            validation: {},
            order,
          };
        }

        return {
          componentId: comp.instanceId,
          componentType: frontendToBackend[comp.id] || comp.id.toLowerCase(),
          label: comp.metadata?.label || comp.id,
          description: '',
          required:
            (comp.validation as unknown as Record<string, unknown>)
              ?.required === true,
          group: 'input',
          props: comp.props as unknown as Record<string, unknown>,
          validation: comp.validation as unknown as Record<string, unknown>,
          order,
        };
      }
    );

    return {
      pageId,
      pageNo: idx + 1,
      title: page?.title || `Page ${idx + 1}`,
      description: page?.description || '',
      components: comps,
      defaultPreviousPageId: page?.defaultPreviousPageId,
      defaultNextPageId: page?.defaultNextPageId,
    };
  });

  await api.put(`/api/forms/${formId}/versions/${versionNum}`, {
    meta: {
      createdBy,
      name: storeForm.name,
      description: storeForm.metadata.description || '',
      isDraft: true,
    },
    theme: storeForm.theme,
    settings: {
      collectEmailMode: storeForm.settings.collectEmailMode,
      submissionPolicy: storeForm.settings.submissionPolicy,
      canViewOwnSubmission: storeForm.settings.canViewOwnSubmission,
      confirmationMessage: storeForm.settings.confirmationMessage,
      ...(storeForm.settings.submissionLimit !== null
        ? { submissionLimit: storeForm.settings.submissionLimit }
        : {}),
      ...(storeForm.settings.closeDate
        ? { closeDate: storeForm.settings.closeDate }
        : {}),
    },
    access: {
      visibility: storeForm.access.visibility,
      editors: storeForm.access.editors.map((entry) =>
        entry.uid
          ? { uid: entry.uid, email: entry.email }
          : { email: entry.email }
      ),
      reviewers: storeForm.access.reviewers.map((entry) =>
        entry.uid
          ? { uid: entry.uid, email: entry.email }
          : { email: entry.email }
      ),
      viewers: storeForm.access.viewers.map((entry) =>
        entry.uid
          ? { uid: entry.uid, email: entry.email }
          : { email: entry.email }
      ),
    },
    pages,
    logic: {
      rules: logicRules,
      formulas: logicFormulas,
      componentShuffleStacks: logicShuffleStacks,
    },
  });

  await api.patch(`/api/forms/${formId}`, { title: storeForm.name });
}

export async function createNewVersion(formId: string): Promise<number> {
  const res = await api.post<{ version: { version: number } }>(
    `/api/forms/${formId}/versions`
  );
  return res.version.version;
}

export async function deleteForm(formId: string) {
  try {
    const res = await api.delete<{ message: string; form: unknown }>(
      `/api/forms/${formId}`
    );
    return res.message; // "Form deleted"
  } catch (err) {
    console.error('Failed to delete form:', err);
    throw err;
  }
}
// ── Workflow ──

export async function loadWorkflow(formId: string): Promise<Workflow> {
  const res = await api.get<{ workflow: Workflow }>(
    `/api/forms/${formId}/workflow`
  );
  return res.workflow;
}

export async function saveWorkflow(
  formId: string,
  workflow: Workflow
): Promise<void> {
  await api.put(`/api/forms/${formId}/workflow`, workflow);
}
