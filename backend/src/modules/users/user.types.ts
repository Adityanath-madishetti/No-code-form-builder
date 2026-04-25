// backend/src/modules/user/user.types.ts

export type UserStatus = 'active' | 'suspended';

export interface IUserBase {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  roles: string[];
  accountStatus: UserStatus;
  lastLogin?: Date;
}

export interface UserResponse extends IUserBase {
  createdAt: Date;
  updatedAt: Date;
}

export type UserMinified = Pick<IUserBase, 'uid' | 'email' | 'displayName' | 'avatarUrl'>;