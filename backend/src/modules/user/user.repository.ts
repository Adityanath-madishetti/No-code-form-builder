import User, { IUser } from '@/database/models/User.js';

export const findUserByUid = async (uid: string): Promise<IUser | null> => {
  return User.findOne({ uid });
};

export const upsertUser = async (uid: string, data: Partial<IUser>): Promise<IUser | null> => {
  return User.findOneAndUpdate(
    { uid },
    { $set: data, $setOnInsert: { roles: ['user'], accountStatus: 'active' } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );
};

export const updateUserDetails = async (
  uid: string,
  updates: Partial<IUser>,
): Promise<IUser | null> => {
  return User.findOneAndUpdate(
    { uid },
    { $set: updates },
    { returnDocument: 'after', runValidators: true },
  );
};
