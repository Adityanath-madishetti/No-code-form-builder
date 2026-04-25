import { Request, Response, NextFunction } from 'express';
import { loginByEmailService } from './auth.service.js';

export const loginByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const email: string = req.body.email;
    const result = await loginByEmailService(email);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
};
