// backend/src/modules/group/group.service.ts
import crypto from 'crypto';
import * as repo from './group.repository.js';
import { ApiError } from '@/middlewares/error.middleware.js';
import { GroupResponse } from './group.types.js';

export const createGroupService = async (uid: string, body: any): Promise<GroupResponse> => {
  const groupId = crypto.randomUUID();
  const groupDoc = await repo.createNewGroup({
    groupId,
    createdBy: uid,
    name: body.name,
    components: body.components,
    sharedWith: body.sharedWith || [],
    isPublic: body.isPublic || false,
  });

  const emailMap = await repo.getEmailsForUids([uid]);

  // Use 'as any' as a bridge if the types are too different,
  // or explicitly map the properties for maximum robustness.
  const rawGroup = groupDoc.toObject();

  return {
    ...rawGroup,
    creatorEmail: emailMap[uid] || 'Unknown',
  } as unknown as GroupResponse; // Double casting: clear the error safely
};

export const listGroupsService = async (user: any): Promise<GroupResponse[]> => {
  const query = {
    $or: [{ createdBy: user.uid }, { isPublic: true }, { sharedWith: user.email }],
  };

  // Ensure repo.getGroupsByQuery uses .lean()
  const groups = await repo.getGroupsByQuery(query);
  const uids = [...new Set(groups.map((g: any) => g.createdBy))];
  const emailMap = await repo.getEmailsForUids(uids);

  return groups.map((g: any) => ({
    ...g,
    creatorEmail: emailMap[g.createdBy] || 'Unknown',
  })) as unknown as GroupResponse[];
};

export const updateGroupService = async (
  groupId: string,
  uid: string,
  updates: any,
): Promise<GroupResponse> => {
  const group = await repo.findGroupById(groupId);
  if (!group) throw new ApiError(404, 'Group not found');
  if (group.createdBy !== uid) throw new ApiError(403, 'Access denied');

  Object.assign(group, updates);
  await group.save();

  const emailMap = await repo.getEmailsForUids([uid]);
  return {
    ...group.toObject(),
    creatorEmail: emailMap[uid] || 'Unknown',
  } as unknown as GroupResponse;
};

export const deleteGroupService = async (groupId: string, uid: string): Promise<void> => {
  const group = await repo.findAndRemoveGroup(groupId, uid);
  if (!group) throw new ApiError(404, 'Group not found or access denied');
};
