// backend/src/modules/forms/modules/form-versions/form-version.repository.ts
import FormVersion from '@/models/FormVersion.js';
import Form from '@/models/Form.js';

export const findLatestVersion = async (formId: string) => {
  return FormVersion.findOne({ formId }).sort({ version: -1 });
};

export const findVersionByNum = async (formId: string, version: number) => {
  return FormVersion.findOne({ formId, version });
};

export const listAllVersions = async (formId: string) => {
  return FormVersion.find({ formId })
    .select('formId version meta.name meta.isDraft createdAt updatedAt')
    .sort({ version: -1 })
    .lean();
};

export const updateVersionDoc = async (formId: string, version: number, updates: any) => {
  return FormVersion.findOneAndUpdate(
    { formId, version },
    { $set: updates },
    { returnDocument: 'after', runValidators: true },
  );
};

export const createNewVersionDoc = async (data: any) => {
  return FormVersion.create(data);
};
