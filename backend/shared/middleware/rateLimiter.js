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
      const retryAfter = res.getHeader('Retry-After');
      const resetTime = req.rateLimit?.resetTime;
      const minutesRemaining = resetTime
        ? Math.ceil((new Date(resetTime).getTime() - Date.now()) / 60000)
        : Math.ceil(retryAfter / 60);

      if (global.logger) {
        global.logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          requestId: req.id,
          limit: req.rateLimit?.limit,
          current: req.rateLimit?.current,
        });
      }
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests (${req.rateLimit?.current || 'N/A'}/${req.rateLimit?.limit || 'N/A'}). Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
          limit: req.rateLimit?.limit,
          current: req.rateLimit?.current,
          remaining: req.rateLimit ? Math.max(0, req.rateLimit.limit - req.rateLimit.current) : 0,
          retryAfter: `${minutesRemaining} minutes`,
          resetTime: resetTime,
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
 * Strict rate limiter for sensitive endpoints (delete operations)
 * 60 requests per 15 minutes (~4 per minute)
 */
const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many delete requests. Please slow down.',
});

/**
 * Moderate rate limiter for regular API endpoints (likes, comments, shares)
 * 300 requests per 15 minutes (~20 per minute, ~1 every 3 seconds)
 */
const moderateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

/**
 * Lenient rate limiter for read-heavy endpoints
 * 1000 requests per 15 minutes
 */
const lenientLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

/**
 * Authentication rate limiter (strict but reasonable)
 * 10 attempts per 15 minutes to prevent brute force
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: 'Too many authentication attempts. Please try again in a few minutes.',
});

/**
 * Create rate limiter for posts
 * 60 creates per hour (~1 per minute)
 */
const createLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  message: 'You can create up to 60 posts per hour. Please try again later.',
});

/**
 * Global rate limiter for entire API
 * 2000 requests per 15 minutes per IP
 */
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: 'Too many requests from this IP. Please slow down.',
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
