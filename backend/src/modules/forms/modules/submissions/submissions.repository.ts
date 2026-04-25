// backend/src/modules/forms/modules/submissions/submissions.repository.ts
import Submission from '@/models/Submission.js';
import FormVersion from '@/models/FormVersion.js';
import Form from '@/models/Form.js';
import { ISubmissionBase, IForm, SubmissionResponse } from './submissions.types.js';
import { IFormVersionBase, VersionResponse } from '../form-versions/form-version.types.js';

export const findForm = async (formId: string): Promise<IForm | null> => {
  return Form.findOne({ formId, isDeleted: false }) as any;
};

export const findLatestVersion = async (formId: string): Promise<VersionResponse | null> => {
  return FormVersion.findOne({ formId }).sort({ version: -1 }) as any;
};

export const findPublishedVersion = async (formId: string): Promise<VersionResponse | null> => {
  return FormVersion.findOne({ formId, 'meta.isDraft': false }).sort({ version: -1 }) as any;
};

export const countSubmissions = async (query: any) => {
  return Submission.countDocuments(query);
};

export const findExistingSubmission = async (formId: string, submittedBy: string) => {
  return Submission.findOne({
    formId,
    submittedBy,
    status: { $ne: 'draft' },
  });
};

export const createSubmissionDoc = async (data: ISubmissionBase) => {
  return Submission.create(data);
};

export const findSubmissionsPaginated = async (
  formId: string,
  skip: number,
  limit: number,
): Promise<SubmissionResponse[]> => {
  return Submission.find({ formId }).sort({ createdAt: -1 }).skip(skip).limit(limit) as any;
};

export const findAllSubmissions = async (formId: string): Promise<SubmissionResponse[]> => {
  return Submission.find({ formId }).sort({ createdAt: -1 }) as any;
};

export const findSubmissionById = async (
  formId: string,
  submissionId: string,
): Promise<SubmissionResponse | null> => {
  return Submission.findOne({ formId, submissionId }) as any;
};

export const findSubmissionsByUser = async (
  formId: string,
  submittedBy: string,
): Promise<SubmissionResponse[]> => {
  return Submission.find({ formId, submittedBy }).sort({ createdAt: -1 }) as any;
};

export const findGlobalSubmissionsByUser = async (
  submittedBy: string,
  limit: number,
): Promise<SubmissionResponse[]> => {
  return Submission.find({ submittedBy })
    .sort({ createdAt: -1 })
    .select('submissionId formId version status createdAt pages')
    .limit(limit) as any;
};
