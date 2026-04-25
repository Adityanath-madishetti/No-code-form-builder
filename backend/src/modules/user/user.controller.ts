import { Request, Response, NextFunction } from 'express';
import { syncUserService, getMeService, updateMeService } from './user.service.js';
import { ApiError } from '@/middlewares/error.middleware.js';

export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const user = await syncUserService(req.user);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const user = await getMeService(req.user.uid);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const user = await updateMeService(req.user.uid, req.body);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};
