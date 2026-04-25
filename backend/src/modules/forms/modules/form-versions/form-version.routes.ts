// backend/src/modules/forms/modules/form-versions/form-version.routes.ts
import { Router } from 'express';
import { verifyToken } from '@/shared/middleware/auth.middleware.js';
import * as controller from './form-version.controller.js';
import { validateRequest } from '@/shared/middleware/validate.middleware.js';
import { updateVersionSchema } from './form-version.schema.js';

import { validateFormVersionMiddleware } from './form-version.validator.js';

const router = Router({ mergeParams: true });

router.get('/latest', verifyToken, controller.getLatestVersion);
router.post('/publish', verifyToken, controller.publishVersion);

router.get('/', verifyToken, controller.listVersions);
router.post('/', verifyToken, controller.createVersion);

// TODO: update this to internal
// validateRequest(updateVersionSchema)
router.put('/:version', verifyToken, validateFormVersionMiddleware, controller.updateVersion);
router.get('/:version', verifyToken, controller.getVersion);

router.patch('/:version/settings', verifyToken, controller.updateVersionSettings);
router.patch('/:version/access', verifyToken, controller.updateVersionAccess);

export default router;
