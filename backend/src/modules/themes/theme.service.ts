// backend/src/modules/themes/theme.service.ts

import crypto from 'crypto';
import * as repo from './theme.repository.js';
import { ApiError } from '@/shared/middleware/error.middleware.js';
import { formUtils } from '@/modules/forms/index.js';
import { IThemeCreate, IThemeUpdate, IThemeResponse } from './theme.types.js';

export const createThemeService = async (
  uid: string,
  body: IThemeCreate,
): Promise<IThemeResponse> => {
  const themeId = crypto.randomUUID();
  const normalizedEmails = (body.sharedWith || []).map(formUtils.normalizeEmail).filter(Boolean);

  const template = await repo.createThemeDoc({
    themeId,
    name: body.name,
    theme: body.theme,
    createdBy: uid,
    sharedWith: normalizedEmails,
    isPublic: body.isPublic || false,
  });

  const userObj = await repo.findUserByUid(uid);
  return {
    ...(template.toObject() as any),
    creatorEmail: userObj ? (userObj as any).email : 'Unknown',
  };
};

export const listThemesService = async (user: any): Promise<IThemeResponse[]> => {
  const uid = user.uid;
  const email = formUtils.normalizeEmail(user.email);

  const query: any = {
    $or: [{ createdBy: uid }, { isPublic: true }],
  };

  if (email) {
    query.$or.push({ sharedWith: email });
  }

  const templates = await repo.findThemesByQuery(query);

  const uids = [...new Set(templates.map((t: any) => t.createdBy as string))];
  const users = await repo.findUsersByUids(uids);
  const emailMap: Record<string, string> = {};
  users.forEach((u: any) => {
    emailMap[u.uid] = u.email;
  });

  return templates.map((t: any) => ({
    ...t,
    creatorEmail: emailMap[t.createdBy] || 'Unknown',
  }));
};

export const updateThemeService = async (
  themeId: string,
  uid: string,
  updates: IThemeUpdate,
): Promise<IThemeResponse> => {
  const template = await repo.findThemeById(themeId);
  if (!template) throw new ApiError(404, 'Theme not found');
  if (template.createdBy !== uid) throw new ApiError(403, 'Access denied');

  if (updates.name !== undefined) template.name = updates.name;
  if (updates.theme !== undefined) template.theme = updates.theme;
  if (updates.isPublic !== undefined) template.isPublic = updates.isPublic;
  if (updates.sharedWith !== undefined) {
    template.sharedWith = updates.sharedWith.map(formUtils.normalizeEmail).filter(Boolean);
  }

  await template.save();

  const userObj = await repo.findUserByUid(template.createdBy);
  return {
    ...(template.toObject() as any),
    creatorEmail: userObj ? (userObj as any).email : 'Unknown',
  };
};

export const deleteThemeService = async (themeId: string, uid: string) => {
  const template = await repo.deleteThemeDoc(themeId, uid);
  if (!template) throw new ApiError(404, 'Theme not found or access denied');
  return template;
};
