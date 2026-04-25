import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { upsertUserByEmail } from './auth.repository.js';
import { LoginResult } from './auth.types.js';

export const loginByEmailService = async (emailInput: string): Promise<LoginResult> => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
  }

  const normalizedEmail = emailInput.toLowerCase().trim();
  const displayName = normalizedEmail.split('@')[0];

  const uid = crypto.createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 24);

  const user = await upsertUserByEmail(normalizedEmail, uid, displayName);

  if (!user) {
    throw new Error('Failed to create or retrieve user record.');
  }

  const token = jwt.sign({ uid: user.uid, email: user.email }, jwtSecret, { expiresIn: '7d' });

  return {
    token,
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    },
  };
};
