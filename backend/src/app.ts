// backend/src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { logger } from '@/shared/logger/index.js';
import { swaggerSpec } from '@/config/swagger.js';
import { errorHandler, ApiError } from '@/middlewares/error.middleware.js';
import apiRoutes from '@/routes/index.js';

const app: Application = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(helmet());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    if (res.statusCode >= 500) logger.error(message);
    else if (res.statusCode >= 400) logger.warn(message);
    else logger.http(message);
  });
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', apiRoutes);

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
});

app.use(errorHandler);

export { app };
