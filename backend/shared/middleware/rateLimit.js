const rateLimit = require('express-rate-limit');

const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

// Predefined rate limiters
const rateLimiters = {
  strict: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  moderate: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  permissive: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 500 }),
};

module.exports = { createRateLimiter, rateLimiters };
