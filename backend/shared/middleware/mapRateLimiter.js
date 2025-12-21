/**
 * Map Image Generation Rate Limiter
 * Aggressive rate limiting to prevent Google Maps API abuse and unexpected charges
 */

const rateLimit = require('express-rate-limit');
const { default: RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');

/**
 * Create Redis client for rate limiting
 */
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 10,
  });

  client.on('error', (err) => {
    if (global.logger) {
      global.logger.error('Redis rate limiter error', { error: err.message });
    } else {
      console.error('Redis rate limiter error:', err);
    }
  });

  return client;
};

/**
 * Map image generation rate limiter
 * Generous limits for normal usage, prevents abuse
 * 120 map generations per hour per user (~2 per minute)
 */
const createMapGenerationLimiter = () => {
  const redisClient = createRedisClient();

  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:map:',
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 120, // 120 map generations per hour per user (~2 per minute)
    message: {
      success: false,
      error: {
        code: 'MAP_GENERATION_RATE_LIMIT',
        message: 'You have reached the map generation limit. Please wait before creating more posts with maps.',
        retryAfter: '1 hour',
        limit: 120,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Key by user ID (from route params)
    keyGenerator: (req) => {
      return req.params.userID || req.ip;
    },
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      const resetTime = req.rateLimit.resetTime;
      const minutesRemaining = Math.ceil((resetTime.getTime() - Date.now()) / 60000);
      const retryAfterText = minutesRemaining > 1 ? `${minutesRemaining} minutes` : '1 minute';

      if (global.logger) {
        global.logger.warn('Map generation rate limit exceeded', {
          userId: req.params.userID,
          ip: req.ip,
          limit: req.rateLimit.limit,
          current: req.rateLimit.current,
          resetTime: req.rateLimit.resetTime,
        });
      }

      res.status(429).json({
        success: false,
        error: {
          code: 'MAP_GENERATION_RATE_LIMIT',
          message: `Map generation limit reached (${req.rateLimit.current}/${req.rateLimit.limit} per hour). Please try again in ${retryAfterText}.`,
          limit: req.rateLimit.limit,
          current: req.rateLimit.current,
          remaining: Math.max(0, req.rateLimit.limit - req.rateLimit.current),
          resetTime: req.rateLimit.resetTime,
          retryAfter: retryAfterText,
        },
      });
    },
    // Skip successful requests (only count when map generation actually happens)
    skip: (req) => {
      // Skip if imageUrl is provided (no generation needed)
      return !!req.body.imageUrl;
    },
  });
};

/**
 * Global map generation rate limiter (across all users)
 * Prevents total API quota exhaustion
 * 2000 total map generations per hour across all users
 */
const createGlobalMapLimiter = () => {
  const redisClient = createRedisClient();

  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:map:global:',
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2000, // 2000 total map generations per hour across all users
    message: {
      success: false,
      error: {
        code: 'GLOBAL_MAP_LIMIT',
        message: 'The system is experiencing high demand. Please try again in a few minutes.',
        retryAfter: '15 minutes',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Global key (same for everyone)
    keyGenerator: () => 'global',
    handler: (req, res) => {
      const minutesRemaining = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 60000);

      if (global.logger) {
        global.logger.error('Global map generation rate limit exceeded', {
          limit: req.rateLimit.limit,
          current: req.rateLimit.current,
          resetTime: req.rateLimit.resetTime,
        });
      }

      res.status(503).json({
        success: false,
        error: {
          code: 'GLOBAL_MAP_LIMIT',
          message: `The system is experiencing high demand (${req.rateLimit.current}/${req.rateLimit.limit} maps generated this hour). Please try again in ${minutesRemaining} minutes.`,
          limit: req.rateLimit.limit,
          current: req.rateLimit.current,
          resetTime: req.rateLimit.resetTime,
          retryAfter: `${minutesRemaining} minutes`,
        },
      });
    },
    skip: (req) => {
      return !!req.body.imageUrl;
    },
  });
};

/**
 * IP-based rate limiter (backup in case user ID is missing)
 * 200 map generations per hour per IP
 */
const createIPMapLimiter = () => {
  const redisClient = createRedisClient();

  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:map:ip:',
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // 200 map generations per hour per IP
    message: {
      success: false,
      error: {
        code: 'IP_MAP_LIMIT',
        message: 'Too many map generation requests from this network. Please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    handler: (req, res) => {
      const minutesRemaining = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 60000);

      res.status(429).json({
        success: false,
        error: {
          code: 'IP_MAP_LIMIT',
          message: `Too many map generation requests from this network (${req.rateLimit.current}/${req.rateLimit.limit} per hour). Please try again in ${minutesRemaining} minutes.`,
          limit: req.rateLimit.limit,
          current: req.rateLimit.current,
          resetTime: req.rateLimit.resetTime,
          retryAfter: `${minutesRemaining} minutes`,
        },
      });
    },
    skip: (req) => {
      return !!req.body.imageUrl;
    },
  });
};

/**
 * Combined rate limiter middleware
 * Applies all rate limits in sequence
 */
const mapGenerationRateLimiter = () => {
  const userLimiter = createMapGenerationLimiter();
  const globalLimiter = createGlobalMapLimiter();
  const ipLimiter = createIPMapLimiter();

  return async (req, res, next) => {
    // Skip if imageUrl is already provided
    if (req.body.imageUrl) {
      return next();
    }

    // Apply rate limiters in sequence
    // 1. IP-based limiter (prevents single IP abuse)
    ipLimiter(req, res, (err) => {
      if (err) return next(err);
      if (res.headersSent) return; // Rate limit hit

      // 2. User-based limiter (prevents single user abuse)
      userLimiter(req, res, (err) => {
        if (err) return next(err);
        if (res.headersSent) return; // Rate limit hit

        // 3. Global limiter (prevents total quota exhaustion)
        globalLimiter(req, res, (err) => {
          if (err) return next(err);
          if (res.headersSent) return; // Rate limit hit

          // All rate limits passed
          next();
        });
      });
    });
  };
};

module.exports = {
  mapGenerationRateLimiter,
  createMapGenerationLimiter,
  createGlobalMapLimiter,
  createIPMapLimiter,
};
