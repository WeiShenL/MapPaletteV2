/**
 * Centralized Error Handler Middleware
 * Provides consistent error responses across all services
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Log error (will use Winston logger if available)
  if (global.logger) {
    if (statusCode >= 500) {
      global.logger.error('Server Error:', {
        error: message,
        code,
        statusCode,
        path: req.path,
        method: req.method,
        requestId: req.id,
        userId: req.user?.id,
        stack: err.stack,
      });
    } else {
      global.logger.warn('Client Error:', {
        error: message,
        code,
        statusCode,
        path: req.path,
        method: req.method,
        requestId: req.id,
        userId: req.user?.id,
      });
    }
  } else {
    // Fallback to console if logger not available
    console.error(`[ERROR] ${code}:`, message, {
      path: req.path,
      requestId: req.id,
      stack: err.stack,
    });
  }

  // Prisma-specific errors
  if (err.code?.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        code = 'UNIQUE_CONSTRAINT_VIOLATION';
        message = 'A record with this value already exists';
        details = { field: err.meta?.target };
        break;
      case 'P2025':
        statusCode = 404;
        code = 'RECORD_NOT_FOUND';
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        code = 'FOREIGN_KEY_VIOLATION';
        message = 'Referenced record does not exist';
        break;
      case 'P2014':
        statusCode = 400;
        code = 'RELATION_VIOLATION';
        message = 'The change would violate a relation constraint';
        break;
      default:
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = err.message;
  }

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(isDevelopment && { stack: err.stack }),
      ...(req.id && { requestId: req.id }),
    },
  };

  res.status(statusCode).json(response);
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Route');
  error.message = `Route ${req.method} ${req.path} not found`;
  next(error);
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
