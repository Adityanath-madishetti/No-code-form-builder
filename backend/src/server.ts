// backend/src/server.ts
import { connectDB, disconnectDB } from '@/database/index.js';
import { logger } from '@/shared/logger/index.js';
import { app } from './app.js';

const PORT: string | number = process.env.PORT || 5000;

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
