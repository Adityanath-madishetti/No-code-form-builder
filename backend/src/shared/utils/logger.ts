// backend/src/utils/logger.ts
import winston from 'winston';

// Define severity levels (npm standard)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Determine the active log level based on the environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each level (only used in development)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Base format applied to all logs
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }), // Ensures error stack traces are printed
  winston.format.splat(),
);

// Format for local development (human-readable)
const devFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`),
);

// Format for production (structured JSON)
const prodFormat = winston.format.combine(baseFormat, winston.format.json());

const transports = [
  // Standard output transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  }),

  // File transports (Optional: Only use if you are not running in a containerized
  // environment like Docker/Kubernetes, which typically rely entirely on stdout)
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: prodFormat,
  }),
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: prodFormat,
  }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

export default logger;
