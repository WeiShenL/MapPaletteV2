/**
 * Request ID Middleware
 * Assigns unique ID to each request for distributed tracing
 */

const { randomUUID } = require('crypto');

/**
 * Adds unique request ID to each request
 * Supports X-Request-ID header or generates new UUID
 */
const requestId = (req, res, next) => {
  // Use existing request ID from header if present
  const existingId = req.get('X-Request-ID');
  req.id = existingId || randomUUID();

  // Add request ID to response headers for client tracking
  res.setHeader('X-Request-ID', req.id);

  next();
};

module.exports = { requestId };
