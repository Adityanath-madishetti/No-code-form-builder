import { findUserByUid, upsertUser, updateUserDetails } from './user.repository.js';
import { ApiError } from '@/middlewares/error.middleware.js';
import { IUser } from '@/database/models/User.js';

export const syncUserService = async (userData: any): Promise<IUser | null> => {
  const { uid, email, name, picture } = userData;
  return upsertUser(uid, {
    email: email || '',
    displayName: name || '',
    avatarUrl: picture || '',
    lastLogin: new Date(),
  });
};

export const getMeService = async (uid: string): Promise<IUser> => {
  const user = await findUserByUid(uid);
  if (!user) throw new ApiError(404, 'User not found. Please sync first.');
  return user;
};

export const updateMeService = async (uid: string, payload: any): Promise<IUser> => {
  // Logic simplified: Schema validation already handled "allowedFields"
  const user = await updateUserDetails(uid, payload);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};
