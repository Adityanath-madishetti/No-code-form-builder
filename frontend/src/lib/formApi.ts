// src/lib/formApi.ts
/**
 * Bridge between the backend FormVersion schema and the frontend Zustand store.
 * Handles loading from API → store hydration and store → API serialization.
 */
import { api } from './api';
import type { Form, FormPage } from '@/form/components/base';
import type { AnyFormComponent } from '@/form/registry/componentRegistry';
import { deserializeComponent } from '@/form/registry/componentRegistry';
import type { ComponentID } from '@/form/components/base';
import type { LogicRule, FormulaRule } from '@/form/logic/logicTypes';
import type { Workflow } from '@/form/workflow/workflowTypes';
// ── Frontend ComponentID ↔ Backend componentType mapping ──

const frontendToBackend: Record<string, string> = {
  Header: 'heading',
  Input: 'single-line-text',
  Textbox: 'single-line-text',
  Radio: 'radio',
  Checkbox: 'checkbox',
  Dropdown: 'dropdown',
  MultiLineText: 'multi-line-text',
  Email: 'email',
  Phone: 'phone',
  Number: 'number',
  Decimal: 'decimal',
  URL: 'url',
  Date: 'date',
  Time: 'time',
  FileUpload: 'file-upload',
  ImageUpload: 'image-upload',
  SingleChoiceGrid: 'single-choice-grid',
  MultiChoiceGrid: 'multi-choice-grid',
  MatrixTable: 'matrix-table',
  RatingScale: 'rating',
  LinearScale: 'linear-scale',
  Slider: 'slider',
  AddressBlock: 'address-block',
  NameBlock: 'name-block',
  ColorPicker: 'color-picker',
  Signature: 'signature',
  Payment: 'payment',
  Captcha: 'captcha',
  SectionDivider: 'section-divider',
  LineDivider: 'page-break',
  ColumnLayout: 'custom',
};

const backendToFrontend: Record<string, string> = {};
for (const [fe, be] of Object.entries(frontendToBackend)) {
  // Don't overwrite if already exists (first mapping wins)
  if (!backendToFrontend[be]) {
    backendToFrontend[be] = fe;
  }
}

// ── Types for backend responses ──

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
  settings: Record<string, unknown>;
  pages: BackendPage[];
  logic?: {
    rules?: LogicRule[];
    formulas?: FormulaRule[];
  };
}

// ── Load: API → Store ──

export async function loadFormVersion(formId: string): Promise<{
  form: Form;
  pages: FormPage[];
  components: AnyFormComponent[];
  version: number;
  logicRules: LogicRule[];
  logicFormulas: FormulaRule[];
}> {
  const res = await api.get<{ version: BackendFormVersion }>(
    `/api/forms/${formId}/versions/latest`
  );
  const v = res.version;

  // Build Form object
  const form: Form = {
    id: v.formId,
    name: v.meta.name,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    theme: null,
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
      children: childIds,
      isTerminal: false,
    });
  }

  return {
    form,
    pages,
    components,
    version: v.version,
    logicRules: v.logic?.rules ?? [],
    logicFormulas: v.logic?.formulas ?? [],
  };
}

// ── Save: Store → API ──

export async function saveFormVersion(
  formId: string,
  versionNum: number,
  storeForm: Form,
  storePages: Record<string, FormPage>,
  storeComponents: Record<string, AnyFormComponent>,
  createdBy: string = 'unknown',
  logicRules: LogicRule[] = [],
  logicFormulas: FormulaRule[] = []
): Promise<void> {
  // Build pages array in order
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
          required: (comp.validation as unknown as Record<string, unknown>)?.required === true,
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
      title: `Page ${idx + 1}`,
      components: comps,
    };
  });

  // Update the version
  await api.put(`/api/forms/${formId}/versions/${versionNum}`, {
    meta: {
      createdBy,
      name: storeForm.name,
      description: '',
      isDraft: true,
    },
    pages,
    logic: {
      rules: logicRules,
      formulas: logicFormulas,
    },
  });

  // Also sync the form header title so the dashboard stays in sync
  await api.patch(`/api/forms/${formId}`, { title: storeForm.name });
}

// ── Create New Version: clones latest → increments version ──

export async function createNewVersion(formId: string): Promise<number> {
  const res = await api.post<{ version: { version: number } }>(
    `/api/forms/${formId}/versions`
  );
  return res.version.version;
}

// ── Workflow ──

export async function loadWorkflow(formId: string): Promise<Workflow> {
  const res = await api.get<{ workflow: Workflow }>(
    `/api/forms/${formId}/workflow`
  );
  return res.workflow;
}

export async function saveWorkflow(formId: string, workflow: Workflow): Promise<void> {
  await api.put(`/api/forms/${formId}/workflow`, workflow);
}
