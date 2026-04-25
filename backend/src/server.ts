// backend/src/server.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { connectDB, disconnectDB } from '@/database/index.js';
import { logger } from '@/shared/logger/index.js';
import { swaggerSpec } from '@/config/swagger.js';
import { errorHandler } from '@/middlewares/error.middleware.js';
import apiRoutes from '@/routes/index.js';

const app: Application = express();
const PORT: string | number = process.env.PORT || 5000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(helmet());

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

app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} signal received: closing HTTP server...`);

      server.close(async (err) => {
        if (err) {
          logger.error('Error closing HTTP server', { error: err });
        } else {
          logger.info('HTTP server closed.');
        }
        await disconnectDB();

        logger.info('Safe shutdown complete.');
        process.exit(err ? 1 : 0);
      });

      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Failed to start server: ${error.message}`, { error });
    } else {
      logger.error('Failed to start server with an unknown error:', { error });
    }
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection:', { reason });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { error });
  process.exit(1);
});

startServer();
