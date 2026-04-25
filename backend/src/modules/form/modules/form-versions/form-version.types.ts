// backend/src/modules/forms/modules/form-versions/form-version.types.ts
import { UserMinified } from '@/modules/user/index.js';

export interface IVersionHistory {
  version: number;
  createdBy: string;
  createdAt: Date;
  message: string;
}

export interface IFormVersionBase {
  formId: string;
  version: number;
  versionHistory: IVersionHistory[];
  meta: {
    createdBy: string;
    name: string;
    description?: string;
    isDraft: boolean;
    isQuiz: boolean;
  };
  pages: any[];
  logic: {
    rules: any[];
    formulas: any[];
  };
  settings: any;
  access: any;
}

export interface VersionResponse extends IFormVersionBase {
  createdAt: Date;
  updatedAt: Date;
}
