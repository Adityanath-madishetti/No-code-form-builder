// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.middleware.js';
import logger from '../utils/logger.js';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET is not defined in production.');
  }
  return secret || 'dev-secret-change-me';
};

/**
 * Middleware: Verify JWT Token
 * Expects header: Authorization: Bearer <JWT>
 */
export const verifyToken = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided'));
  }

  try {
    const token = authHeader.split(' ')[1]; // Cleaner split
    const secret = getJwtSecret();

    const decoded = jwt.verify(token, secret) as Request['user'];
    req.user = decoded;

    next();
  } catch (err) {
    logger.warn(`Invalid token attempt: ${req.ip}`);
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

/**
 * Middleware: Optional Auth
 * Proceed regardless of token validity, but attach user if valid
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as Request['user'];
    req.user = decoded;
  } catch {
    // Silently fail: user is simply not attached to the request
  }

  next();
};
