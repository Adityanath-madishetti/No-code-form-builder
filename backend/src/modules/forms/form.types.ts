import { VersionResponse } from './modules/form-versions/form-version.types.js';

export interface IForm {
  formId: string;
  title: string;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: string;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFormCreate {
  title?: string;
  description?: string;
}

export interface IFormUpdate {
  title?: string;
  isActive?: boolean;
}

export interface ISharedFormResponse extends Omit<IForm, 'isDeleted'> {
  sharedRole: 'editor' | 'reviewer';
  sharedRoles: string[];
  submissionCount: number;
}

export interface IFormWithVersion {
  form: IForm;
  latestVersion?: VersionResponse;
}

export interface IPublicFormResponse {
  form: IForm;
  version: VersionResponse;
}
