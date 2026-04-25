// backend/src/modules/forms/modules/form-versions/form-version.service.ts
import * as repo from './form-version.repository.js';
import Form from '@/database/models/Form.js';
import { ApiError } from '@/middlewares/error.middleware.js';
import { canEditForm, normalizeVersionForResponse } from '../../form.utils.js';
import { resolveAccessIdentities } from '../../form.service.js';
import { VersionResponse } from './form-version.types.js';

const assertCanEdit = async (formId: string, user: any) => {
  const form = await Form.findOne({ formId, isDeleted: false });
  const latestVersion = await repo.findLatestVersion(formId);

  if (!form || !latestVersion) throw new ApiError(404, 'Form or Version not found');
  if (!canEditForm(form, latestVersion, user)) throw new ApiError(403, 'Access denied');

  return { form, latestVersion };
};

export const getLatestVersionService = async (
  formId: string,
  user: any,
): Promise<VersionResponse> => {
  const { latestVersion } = await assertCanEdit(formId, user);
  return normalizeVersionForResponse(latestVersion) as unknown as VersionResponse;
};

export const createVersionService = async (formId: string, user: any): Promise<VersionResponse> => {
  const { latestVersion } = await assertCanEdit(formId, user);

  const newVersionNum = latestVersion.version + 1;
  const cloned = latestVersion.toObject();

  delete (cloned as any)._id;
  delete (cloned as any).createdAt;

  const newVersion = await repo.createNewVersionDoc({
    ...cloned,
    version: newVersionNum,
    'meta.isDraft': true,
    versionHistory: [
      ...(cloned.versionHistory || []),
      {
        version: newVersionNum,
        createdBy: user.uid,
        createdAt: new Date(),
        message: `Cloned ${newVersionNum}`,
      },
    ],
  });

  await Form.findOneAndUpdate({ formId }, { currentVersion: newVersionNum });
  return normalizeVersionForResponse(newVersion) as unknown as VersionResponse;
};

export const updateVersionService = async (
  formId: string,
  versionNum: number,
  payload: any,
  user: any,
): Promise<VersionResponse> => {
  await assertCanEdit(formId, user);
  const versionDoc = await repo.updateVersionDoc(formId, versionNum, payload);
  if (!versionDoc) throw new ApiError(404, 'Version not found');
  return normalizeVersionForResponse(versionDoc) as unknown as VersionResponse;
};

export const listVersionsService = async (formId: string, user: any) => {
  // Logic from your assertCanEdit check
  const form = await Form.findOne({ formId, isDeleted: false });
  if (!form) throw new ApiError(404, 'Form not found');

  return repo.listAllVersions(formId);
};

export const getVersionService = async (
  formId: string,
  versionNum: number,
  user: any,
): Promise<VersionResponse> => {
  const versionDoc = await repo.findVersionByNum(formId, versionNum);
  if (!versionDoc) throw new ApiError(404, 'Version not found');

  return normalizeVersionForResponse(versionDoc) as unknown as VersionResponse;
};

export const updateVersionSettingsService = async (
  formId: string,
  versionNum: number,
  payload: any,
  user: any,
) => {
  const settings = payload.settings ?? payload;
  // This uses the shared applyVersionUpdates logic or a direct repo call:
  const versionDoc = await repo.updateVersionDoc(formId, versionNum, { settings });
  if (!versionDoc) throw new ApiError(404, 'Version not found');
  return normalizeVersionForResponse(versionDoc) as unknown as VersionResponse;
};

export const updateVersionAccessService = async (
  formId: string,
  versionNum: number,
  payload: any,
  user: any,
) => {
  const access = await resolveAccessIdentities(payload.access ?? payload);
  const versionDoc = await repo.updateVersionDoc(formId, versionNum, { access });
  if (!versionDoc) throw new ApiError(404, 'Version not found');
  return normalizeVersionForResponse(versionDoc) as unknown as VersionResponse;
};

export const publishVersionService = async (
  formId: string,
  user: any,
): Promise<VersionResponse> => {
  const uid = user.uid;

  const form = await Form.findOne({ formId, isDeleted: false });
  if (!form) throw new ApiError(404, 'Form not found');

  // Only the owner can publish
  if (form.createdBy !== uid) throw new ApiError(403, 'Access denied');

  const version = await repo.updateVersionDoc(formId, form.currentVersion, {
    'meta.isDraft': false,
    $push: {
      versionHistory: {
        version: form.currentVersion,
        createdBy: uid,
        createdAt: new Date(),
        message: `Published version ${form.currentVersion}`,
      },
    },
  });

  if (!version) throw new ApiError(404, 'Version not found');

  await Form.findOneAndUpdate({ formId }, { isActive: true });

  return normalizeVersionForResponse(version) as unknown as VersionResponse;
};
