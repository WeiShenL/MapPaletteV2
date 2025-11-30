/**
 * Structured Logging with Winston
 * Provides consistent, searchable logs across all services
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, userId, ...meta } = info;

    let log = `${timestamp} [${level}]: ${message}`;

    if (requestId) log += ` [ReqID: ${requestId}]`;
    if (userId) log += ` [User: ${userId}]`;

    // Add metadata if present
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    if (metaStr) log += `\n${metaStr}`;

    return log;
  })
);

// Define transports
const transports = [
  // Console output
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'development' ? consoleFormat : format,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );

  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );

  // HTTP logs
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'http.log'),
      level: 'http',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// HTTP request logger middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(level, 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.id,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

// Helper functions
const logInfo = (message, meta = {}) => logger.info(message, meta);
const logError = (message, error, meta = {}) => {
  logger.error(message, {
    ...meta,
    error: error?.message,
    stack: error?.stack,
  });
};
const logWarn = (message, meta = {}) => logger.warn(message, meta);
const logDebug = (message, meta = {}) => logger.debug(message, meta);
const logHttp = (message, meta = {}) => logger.http(message, meta);

// Make logger globally available
global.logger = logger;

module.exports = {
  logger,
  httpLogger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logHttp,
};
