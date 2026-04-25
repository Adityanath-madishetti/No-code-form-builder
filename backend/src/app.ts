// backend/src/app.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authRoutes } from '@/modules/auth/index.js';
import { userRoutes } from '@/modules/users/index.js';
import { formRoutes } from '@/modules/forms/index.js';
import { aiRoutes } from '@/modules/ai/index.js';
import { groupRoutes } from '@/modules/groups/index.js';
import { themeRoutes } from '@/modules/themes/index.js';
import { submissionController } from '@/modules/forms/modules/submissions/index.js';
import { verifyToken } from '@/shared/middleware/auth.middleware.js';
import { errorHandler } from '@/shared/middleware/error.middleware.js';
import logger from '@/shared/utils/logger.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/config/swagger.js';

const app: Application = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(helmet());

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });

  next();
});

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
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/submissions/mine', verifyToken, submissionController.getMySubmissions);

app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use(errorHandler);

export default app;
