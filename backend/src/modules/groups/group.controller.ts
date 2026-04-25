// backend/src/modules/group/group.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as service from './group.service.js';
import { ApiError } from '@/shared/middleware/error.middleware.js';

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const group = await service.createGroupService(req.user.uid, req.body);
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
};

export const listGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await service.listGroupsService(req.user);
    res.status(200).json({ groups });
  } catch (err) {
    next(err);
  }
};

export const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    // groupId is verified as a string by our validateRequest middleware
    const { groupId } = req.params;

    const group = await service.updateGroupService(
      groupId as string, // Cast to string to satisfy the service signature
      req.user.uid,
      req.body,
    );

    res.status(200).json({ group });
  } catch (err) {
    next(err);
  }
};

export const deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const { groupId } = req.params;

    await service.deleteGroupService(groupId as string, req.user.uid);
    res.status(200).json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
};
