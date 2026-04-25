// backend/src/modules/themes/theme.repository.ts

import ThemeTemplate from '@/models/ThemeTemplate.js';
import User from '@/models/User.js';

export const findThemeById = async (themeId: string) => {
  return ThemeTemplate.findOne({ themeId });
};

export const createThemeDoc = async (data: any) => {
  return ThemeTemplate.create(data);
};

export const findThemesByQuery = async (query: any) => {
  return ThemeTemplate.find(query).sort({ updatedAt: -1 }).lean();
};

export const findUserByUid = async (uid: string) => {
  return User.findOne({ uid }).lean();
};

export const findUsersByUids = async (uids: string[]) => {
  return User.find({ uid: { $in: uids } }).lean();
};

export const deleteThemeDoc = async (themeId: string, uid: string) => {
  return ThemeTemplate.findOneAndDelete({ themeId, createdBy: uid });
};
