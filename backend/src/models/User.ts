// backend/src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IUserBase } from '../modules/users/index.js';

export interface IUser extends IUserBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    roles: {
      type: [String],
      default: ['user'],
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', UserSchema);