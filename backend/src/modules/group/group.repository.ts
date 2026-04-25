// backend/src/modules/group/group.repository.ts
import ComponentGroup from '@/database/models/ComponentGroup.js';
import User from '@/database/models/User.js';
import { IGroupBase } from './group.types.js';

export const findGroupById = async (groupId: string) => {
  return ComponentGroup.findOne({ groupId });
};

export const createNewGroup = async (data: IGroupBase) => {
  return ComponentGroup.create(data);
};

export const getGroupsByQuery = async (query: any) => {
  return ComponentGroup.find(query).sort({ updatedAt: -1 }).lean();
};

export const findAndRemoveGroup = async (groupId: string, createdBy: string) => {
  return ComponentGroup.findOneAndDelete({ groupId, createdBy });
};

// Cross-module helper to fetch emails for creators
export const getEmailsForUids = async (uids: string[]): Promise<Record<string, string>> => {
  const users = await User.find({ uid: { $in: uids } })
    .select('uid email')
    .lean();
  const map: Record<string, string> = {};
  users.forEach((u) => {
    map[u.uid] = u.email;
  });
  return map;
};
