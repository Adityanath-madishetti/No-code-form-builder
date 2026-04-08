export interface FormHeader {
  formId: string;
  title: string;
  currentVersion: number;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
  createdBy?: string;
}

export interface SharedFormHeader extends FormHeader {
  sharedRole: 'editor' | 'reviewer';
  sharedRoles: Array<'editor' | 'reviewer'>;
  submissionCount: number;
}

export interface MySubmission {
  submissionId: string;
  formId: string;
  formTitle: string;
  version: number;
  status: string;
  submittedAt: string;
  pages?: Array<{
    pageNo: number;
    responses: Array<{ componentId: string; response: unknown }>;
  }>;
}

export type LayoutMode = 'grid' | 'list';