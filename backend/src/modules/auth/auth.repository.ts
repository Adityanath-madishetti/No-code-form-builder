import User, { IUser } from '@/database/models/User.js';

export const upsertUserByEmail = async (
  email: string,
  uid: string,
  displayName: string,
): Promise<IUser | null> => {
  return await User.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        lastLogin: new Date(),
      },
      $setOnInsert: {
        uid,
        displayName,
        roles: ['user'],
        accountStatus: 'active',
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );
};
