import type {
  LogicRule,
  FormulaRule,
  ComponentShuffleStack,
} from '@/form/logic/logicTypes';

interface VersionSettings {
  collectEmailMode: 'none' | 'optional' | 'required';
  submissionPolicy:
    | 'none'
    | 'edit_only'
    | 'resubmit_only'
    | 'edit_and_resubmit';
  canViewOwnSubmission: boolean;
  confirmationMessage?: string;
}

export interface PublicComponent {
  componentId: string;
  componentType: string;
  label: string;
  props: Record<string, unknown>;
  validation: Record<string, unknown>;
  required?: boolean;
}

export interface PublicPageData {
  pageId: string;
  pageNo: number;
  title: string;
  description?: string;
  components: PublicComponent[];
  defaultNextPageId?: string;
  defaultPreviousPageId?: string;
}

export interface PublicLogicData {
  rules?: LogicRule[];
  formulas?: FormulaRule[];
  componentShuffleStacks?: ComponentShuffleStack[];
}

// export interface RuntimeEvaluation {
//   values: Record<string, unknown>;
//   visibility: Record<string, boolean>;
//   enabled: Record<string, boolean>;
//   validationErrors: Record<string, string>;
//   nextPageId: string | null;
// }

export interface PublicFormData {
  form: { formId: string; title: string };
  version: {
    formId: string;
    version: number;
    meta: { name: string; description: string };
    settings: VersionSettings;
    pages: PublicPageData[];
    logic?: PublicLogicData;
  };
}

// export interface RuntimeComponent {
//   componentId: string;
//   componentType: string;
//   label: string;
//   props: Record<string, unknown>;
//   validation: Record<string, unknown>;
//   required?: boolean;
// }

// export interface RuntimePage {
//   pageId: string;
//   pageNo: number;
//   title: string;
//   description?: string;
//   components: RuntimeComponent[];
// }

// export interface RuntimeFormState {
//   form: { formId: string; title: string };
//   version: {
//     formId: string;
//     version: number;
//     meta: { name: string; description: string };
//     settings: VersionSettings;
//     pages: PublicPageData[];
//     logic?: PublicLogicData;
//   };
// }
