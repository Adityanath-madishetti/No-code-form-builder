// backend/src/modules/forms/form.repository.ts

import Form from '@/database/models/Form.js';
import FormVersion from '@/database/models/FormVersion.js';
import Submission from '@/database/models/Submission.js';
import User from '@/database/models/User.js';
import { IForm, IFormCreate, IFormUpdate } from './form.types.js';
import { normalizeEmail } from './form.utils.js';

export const findFormById = async (formId: string) => {
  return Form.findOne({ formId, isDeleted: false });
};

export const createFormDoc = async (data: any) => {
  return Form.create(data);
};

export const createVersionDoc = async (data: any) => {
  return FormVersion.create(data);
};

export const findFormsByUser = async (uid: string) => {
  return Form.find({ isDeleted: false, createdBy: uid }).sort({ updatedAt: -1 });
};

export const findLatestVersion = async (formId: string) => {
  return FormVersion.findOne({ formId }).sort({ version: -1 });
};

export const findPublishedVersion = async (formId: string) => {
  return FormVersion.findOne({ formId, 'meta.isDraft': false }).sort({ version: -1 });
};

export const updateFormDoc = async (formId: string, updates: IFormUpdate) => {
  return Form.findOneAndUpdate(
    { formId, isDeleted: false },
    { $set: updates },
    { returnDocument: 'after', runValidators: true },
  );
};

export const deleteFormDoc = async (formId: string, uid: string) => {
  return Form.findOneAndUpdate(
    { formId, createdBy: uid, isDeleted: false },
    { $set: { isDeleted: true, isActive: false } },
    { returnDocument: 'after' },
  );
};

export const getSubmissionCounts = async (formIds: string[]) => {
  return Submission.aggregate([
    { $match: { formId: { $in: formIds } } },
    { $group: { _id: '$formId', count: { $sum: 1 } } },
  ]);
};

export const findFormsByIds = async (formIds: string[], excludeUid: string) => {
  return Form.find({
    formId: { $in: formIds },
    isDeleted: false,
    createdBy: { $ne: excludeUid },
  }).sort({ updatedAt: -1 });
};

export const getSharedFormAccessData = async (uid: string, email: string) => {
  const matchClauses: any[] = [
    { 'latestAccess.editors.uid': uid },
    { 'latestAccess.reviewers.uid': uid },
  ];
  if (email) {
    matchClauses.push({ 'latestAccess.editors.email': email });
    matchClauses.push({ 'latestAccess.reviewers.email': email });
  }

  return FormVersion.aggregate([
    { $sort: { version: -1 } },
    {
      $group: {
        _id: '$formId',
        latestAccess: { $first: '$access' },
      },
    },
    { $match: { $or: matchClauses } },
    { $project: { _id: 0, formId: '$_id', latestAccess: 1 } },
  ]);
};

export const findUsersByIdentities = async (emails: string[], uids: string[]) => {
  const [usersByEmail, usersByUid] = await Promise.all([
    emails.length ? User.find({ email: { $in: emails } }).select('uid email') : [],
    uids.length ? User.find({ uid: { $in: uids } }).select('uid email') : [],
  ]);
  return { usersByEmail, usersByUid };
};
