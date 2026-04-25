import { IUserBase } from '@/modules/user/user.types.js';

export interface IAuthenticatedUser extends IUserBase {}

export interface IForm {
  formId: string;
  title: string;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: string;
}

export interface ISubmissionPageResponse {
  componentId: string;
  response: any;
}

export interface ISubmissionPage {
  pageId: string;
  responses: ISubmissionPageResponse[];
}

export interface ISubmissionBase {
  submissionId: string;
  formId: string;
  version: number;
  submittedBy: string | null;
  email: string | null;
  status: string;
  meta: {
    isQuiz: boolean;
  };
  pages: ISubmissionPage[];
}

export interface SubmissionResponse extends ISubmissionBase {
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrichedSubmission extends Omit<SubmissionResponse, 'meta' | 'email'> {
  formTitle: string;
  submittedAt: Date;
}
