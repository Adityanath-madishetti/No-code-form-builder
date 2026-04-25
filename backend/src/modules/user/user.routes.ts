import { Router } from 'express';
import { verifyToken } from '@/middlewares/auth.middleware.js';
import { syncUser, getMe, updateMe } from './user.controller.js';
import { validateRequest } from '@/middlewares/validate.middleware.js';
import { updateMeSchema } from './user.schema.js';

const router = Router();

router.post('/sync', verifyToken, syncUser);
router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, validateRequest(updateMeSchema), updateMe);

export default router;
