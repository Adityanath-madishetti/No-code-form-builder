// backend/src/routes/index.ts

import { Router } from 'express';
import { authRoutes } from '@/modules/auth/index.js';
import { userRoutes } from '@/modules/user/index.js';
import { formRoutes } from '@/modules/form/index.js';
import { aiRoutes } from '@/modules/ai/index.js';
import { groupRoutes } from '@/modules/group/index.js';
import { themeRoutes } from '@/modules/theme/index.js';
import { formTemplateRoutes } from '@/modules/form-template/index.js';
import { fluxorisRoutes } from '@/modules/fluxoris/index.js';
import { submissionController } from '@/modules/form/modules/submissions/index.js';
import { verifyToken } from '@/middlewares/auth.middleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/forms', formRoutes);
router.use('/groups', groupRoutes);
router.use('/themes', themeRoutes);
router.use('/form-templates', formTemplateRoutes);
router.use('/ai', aiRoutes);
router.use('/partner/fluxoris', fluxorisRoutes);

router.get('/submissions/mine', verifyToken, submissionController.getMySubmissions);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API Health Check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
