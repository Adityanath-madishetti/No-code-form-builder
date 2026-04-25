// backend/src/types/express.d.ts
import { IUser } from '../models/User.ts';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};
