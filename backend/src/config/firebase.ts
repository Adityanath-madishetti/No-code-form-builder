// backend/src/config/firebase.js

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import logger from '../shared/utils/logger.js';

/**
 * Initialize Firebase Admin SDK.
 *
 * Expects one of:
 *   - FIREBASE_SERVICE_ACCOUNT_PATH  env var pointing to a JSON file
 *   - FIREBASE_SERVICE_ACCOUNT       env var containing the JSON string
 *
 * Falls back to Application Default Credentials if neither is set
 * (works on GCP / Cloud Run / Firebase Hosting).
 */
function initFirebaseAdmin() {
  // Already initialized — return the existing app
  if (admin.apps.length) {
    return admin;
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT;

  try {
    if (filePath && existsSync(filePath)) {
      const serviceAccount = JSON.parse(readFileSync(filePath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('Firebase Admin initialized with service account file');
    } else if (jsonString) {
      const serviceAccount = JSON.parse(jsonString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('Firebase Admin initialized with inline credentials');
    } else {
      logger.warn(
        'No Firebase credentials configured. Auth routes will not work. ' +
          'Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to your service account JSON file.',
      );
      // Initialize without credentials — verifyIdToken will fail
      // but the server can still start for non-auth endpoints
      admin.initializeApp();
    }
  } catch (err) {
    logger.warn(
      'Firebase Admin initialization failed',
      {
        error: err instanceof Error ? err.message : String(err),
      },
      'Auth routes will not work until this is fixed.',
    );
    // Still try a bare init so `admin.auth()` exists (will fail on use)
    if (!admin.apps.length) {
      try {
        admin.initializeApp();
      } catch {
        /* ignore */
      }
    }
  }

  return admin;
}

export default initFirebaseAdmin();
