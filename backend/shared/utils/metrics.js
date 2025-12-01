/**
 * Metrics and Monitoring with Prometheus
 * Collects performance metrics, business metrics, and system metrics
 */

const promClient = require('prom-client');
const promBundle = require('express-prom-bundle');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

/**
 * Custom Metrics
 */

// HTTP Request Duration
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  registers: [register],
});

// HTTP Request Total
const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register],
});

// HTTP Request Errors
const httpRequestErrors = new promClient.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_code', 'service'],
  registers: [register],
});

// Active Connections
const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['service'],
  registers: [register],
});

// Database Query Duration
const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Database Query Total
const dbQueryTotal = new promClient.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'service'],
  registers: [register],
});

// Redis Operations
const redisOperationDuration = new promClient.Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const redisOperationTotal = new promClient.Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'result', 'service'],
  registers: [register],
});

// Business Metrics
const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['service'],
  registers: [register],
});

const postsCreated = new promClient.Counter({
  name: 'posts_created_total',
  help: 'Total number of posts created',
  labelNames: ['service'],
  registers: [register],
});

const likesGiven = new promClient.Counter({
  name: 'likes_given_total',
  help: 'Total number of likes given',
  labelNames: ['entity_type', 'service'],
  registers: [register],
});

const commentsCreated = new promClient.Counter({
  name: 'comments_created_total',
  help: 'Total number of comments created',
  labelNames: ['entity_type', 'service'],
  registers: [register],
});

const followsCreated = new promClient.Counter({
  name: 'follows_created_total',
  help: 'Total number of follow relationships created',
  labelNames: ['service'],
  registers: [register],
});

// Queue Metrics
const jobsProcessed = new promClient.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of background jobs processed',
  labelNames: ['queue', 'status', 'service'],
  registers: [register],
});

const jobDuration = new promClient.Histogram({
  name: 'job_duration_seconds',
  help: 'Duration of background job processing',
  labelNames: ['queue', 'job_type', 'service'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register],
});

const queueSize = new promClient.Gauge({
  name: 'queue_size',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue', 'service'],
  registers: [register],
});

// Rate Limiting Metrics
const rateLimitHits = new promClient.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'service'],
  registers: [register],
});

/**
 * Create metrics middleware for Express
 * Automatically tracks HTTP metrics
 */
const createMetricsMiddleware = (serviceName) => {
  return promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    customLabels: { service: serviceName },
    promClient: {
      collectDefaultMetrics: {},
    },
    metricsPath: '/metrics',
    promRegistry: register,
  });
};

/**
 * Middleware to track custom HTTP metrics
 */
const trackHttpMetrics = (serviceName) => {
  return (req, res, next) => {
    const start = Date.now();

    // Track active connections
    activeConnections.inc({ service: serviceName });

    // Cleanup on response finish
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route ? req.route.path : req.path;

      // Record duration
      httpRequestDuration.observe(
        {
          method: req.method,
          route,
          status_code: res.statusCode,
          service: serviceName,
        },
        duration
      );

      // Count total requests
      httpRequestTotal.inc({
        method: req.method,
        route,
        status_code: res.statusCode,
        service: serviceName,
      });

      // Count errors (4xx and 5xx)
      if (res.statusCode >= 400) {
        httpRequestErrors.inc({
          method: req.method,
          route,
          error_code: res.statusCode,
          service: serviceName,
        });
      }

      // Decrement active connections
      activeConnections.dec({ service: serviceName });
    });

    next();
  };
};

/**
 * Helper functions to track metrics
 */
const trackDbQuery = async (operation, table, serviceName, queryFn) => {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = (Date.now() - start) / 1000;

    dbQueryDuration.observe({ operation, table, service: serviceName }, duration);
    dbQueryTotal.inc({ operation, table, service: serviceName });

    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.observe({ operation, table, service: serviceName }, duration);
    dbQueryTotal.inc({ operation, table, service: serviceName });
    throw error;
  }
};

const trackRedisOperation = async (operation, serviceName, operationFn) => {
  const start = Date.now();
  try {
    const result = await operationFn();
    const duration = (Date.now() - start) / 1000;

    redisOperationDuration.observe({ operation, service: serviceName }, duration);
    redisOperationTotal.inc({ operation, result: 'success', service: serviceName });

    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    redisOperationDuration.observe({ operation, service: serviceName }, duration);
    redisOperationTotal.inc({ operation, result: 'error', service: serviceName });
    throw error;
  }
};

/**
 * Get metrics endpoint handler
 */
const getMetrics = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error.message);
  }
};

/**
 * Business metrics helpers
 */
const trackUserRegistration = (serviceName) => {
  userRegistrations.inc({ service: serviceName });
};

const trackPostCreation = (serviceName) => {
  postsCreated.inc({ service: serviceName });
};

const trackLike = (entityType, serviceName) => {
  likesGiven.inc({ entity_type: entityType, service: serviceName });
};

const trackComment = (entityType, serviceName) => {
  commentsCreated.inc({ entity_type: entityType, service: serviceName });
};

const trackFollow = (serviceName) => {
  followsCreated.inc({ service: serviceName });
};

const trackRateLimitHit = (endpoint, serviceName) => {
  rateLimitHits.inc({ endpoint, service: serviceName });
};

const trackJob = (queue, jobType, serviceName, status) => {
  jobsProcessed.inc({ queue, status, service: serviceName });
};

const trackJobDuration = (queue, jobType, serviceName, duration) => {
  jobDuration.observe({ queue, job_type: jobType, service: serviceName }, duration);
};

const updateQueueSize = (queue, serviceName, size) => {
  queueSize.set({ queue, service: serviceName }, size);
};

module.exports = {
  register,
  createMetricsMiddleware,
  trackHttpMetrics,
  getMetrics,
  // Tracking helpers
  trackDbQuery,
  trackRedisOperation,
  trackUserRegistration,
  trackPostCreation,
  trackLike,
  trackComment,
  trackFollow,
  trackRateLimitHit,
  trackJob,
  trackJobDuration,
  updateQueueSize,
  // Metrics objects (for advanced usage)
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    httpRequestErrors,
    activeConnections,
    dbQueryDuration,
    dbQueryTotal,
    redisOperationDuration,
    redisOperationTotal,
    userRegistrations,
    postsCreated,
    likesGiven,
    commentsCreated,
    followsCreated,
    jobsProcessed,
    jobDuration,
    queueSize,
    rateLimitHits,
  },
};
