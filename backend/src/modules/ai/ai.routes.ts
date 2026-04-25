// backend/src/modules/ai/ai.routes.ts

import { Router } from 'express';
import { verifyToken } from '@/shared/middleware/auth.middleware.js';
import * as controller from './ai.controller.js';

const router = Router();

// POST /api/ai/generate-form
router.post('/generate-form', verifyToken, controller.generateForm);

export default router;
