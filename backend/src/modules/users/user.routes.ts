import { Router } from 'express';
import { verifyToken } from '@/shared/middleware/auth.middleware.js';
import { syncUser, getMe, updateMe } from './user.controller.js';
import { validateRequest } from '@/shared/middleware/validate.middleware.js';
import { updateMeSchema } from './user.schema.js';

const router = Router();

router.post('/sync', verifyToken, syncUser);
router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, validateRequest(updateMeSchema), updateMe);

export default router;
