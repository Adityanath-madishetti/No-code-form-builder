// backend/src/database/connection.ts
import mongoose from 'mongoose';
import logger from '../shared/utils/logger.js';

mongoose.set('strictQuery', true);

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error('FATAL: Missing MONGO_URI. Add it to backend/.env before starting the server.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error connecting to MongoDB: ${error.message}`, { error });
    } else {
      logger.error('Unknown error connecting to MongoDB', { error });
    }
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected! Attempting to reconnect...');
});

mongoose.connection.on('error', (error: Error) => {
  logger.error(`MongoDB connection error: ${error.message}`, { error });
});

// ---------------------------------------------------------
// GRACEFUL DISCONNECT (For server.ts)
// ---------------------------------------------------------
export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      logger.info('MongoDB connection closed gracefully.');
    } catch (error: unknown) {
      logger.error('Error during MongoDB disconnection:', { error });
    }
  }
};
