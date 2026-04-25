import { Router } from 'express';
import { loginByEmail } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';
import { validateRequest } from '@/middlewares/validate.middleware.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), loginByEmail);

export default router;
