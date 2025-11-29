/**
 * Rate Limiting Middleware with Redis
 * Prevents DoS attacks and abuse by limiting request frequency
 */

const rateLimit = require('express-rate-limit');
const { default: RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');

// Create Redis client for rate limiting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  if (global.logger) {
    global.logger.error('Rate limiter Redis error:', err);
  } else {
    console.error('Rate limiter Redis error:', err);
  }
});

/**
 * Create rate limiter with Redis store
 * Falls back to memory store if Redis is unavailable
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Error handler
    handler: (req, res) => {
      if (global.logger) {
        global.logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          requestId: req.id,
        });
      }
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: res.getHeader('Retry-After'),
        },
      });
    },
    // Skip successful requests (only count errors for some endpoints)
    skip: (req, res) => options.skipSuccessfulRequests && res.statusCode < 400,
  };

  // Merge with custom options
  const config = { ...defaultOptions, ...options };

  // Use Redis store for distributed rate limiting
  try {
    config.store = new RedisStore({
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      sendCommand: (...args) => redis.call(...args),
    });
  } catch (error) {
    if (global.logger) {
      global.logger.warn('Failed to initialize Redis store for rate limiter, using memory store', {
        error: error.message,
      });
    } else {
      console.warn('Failed to initialize Redis store for rate limiter, using memory store');
    }
  }

  return rateLimit(config);
};

/**
 * Strict rate limiter for sensitive endpoints (auth, writes)
 * 10 requests per 15 minutes
 */
const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests to this endpoint, please try again later',
});

/**
 * Moderate rate limiter for regular API endpoints
 * 100 requests per 15 minutes
 */
const moderateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

/**
 * Lenient rate limiter for read-heavy endpoints
 * 500 requests per 15 minutes
 */
const lenientLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

/**
 * Authentication rate limiter (very strict)
 * 5 attempts per 15 minutes to prevent brute force
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: 'Too many authentication attempts, please try again later',
});

/**
 * Create rate limiter (very strict)
 * 20 creates per hour to prevent spam
 */
const createLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many items created, please try again later',
});

/**
 * Global rate limiter for entire API
 * 1000 requests per 15 minutes per IP
 */
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later',
});

module.exports = {
  createRateLimiter,
  strictLimiter,
  moderateLimiter,
  lenientLimiter,
  authLimiter,
  createLimiter,
  globalLimiter,
};
