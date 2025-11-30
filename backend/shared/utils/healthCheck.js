/**
 * Enhanced Health Check Utilities
 * Checks database, Redis, and dependency service health
 */

const { db } = require('./db');
const Redis = require('ioredis');
const axios = require('axios');

// Redis client for health checks
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

/**
 * Check database connectivity
 */
const checkDatabase = async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime: 0,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

/**
 * Check Redis connectivity
 */
const checkRedis = async () => {
  try {
    const start = Date.now();
    await redis.ping();
    const responseTime = Date.now() - start;
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

/**
 * Check external service health
 */
const checkService = async (serviceName, serviceUrl) => {
  try {
    const start = Date.now();
    const response = await axios.get(`${serviceUrl}/health`, {
      timeout: 5000, // 5 second timeout
    });
    const responseTime = Date.now() - start;

    return {
      status: response.data.status === 'healthy' ? 'healthy' : 'degraded',
      responseTime: `${responseTime}ms`,
      version: response.data.version,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

/**
 * Get system metrics
 */
const getSystemMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
    cpu: {
      user: `${Math.round(cpuUsage.user / 1000)}ms`,
      system: `${Math.round(cpuUsage.system / 1000)}ms`,
    },
    uptime: `${Math.round(process.uptime())}s`,
  };
};

/**
 * Comprehensive health check
 * @param {Object} config - Configuration object
 * @param {string} config.serviceName - Name of the service
 * @param {string} config.version - Version of the service
 * @param {Object} config.dependencies - Object mapping dependency names to URLs
 */
const healthCheck = async (config = {}) => {
  const {
    serviceName = 'unknown-service',
    version = '1.0.0',
    dependencies = {},
  } = config;

  const startTime = Date.now();
  const checks = {};

  // Check database
  checks.database = await checkDatabase();

  // Check Redis
  checks.redis = await checkRedis();

  // Check dependencies
  for (const [name, url] of Object.entries(dependencies)) {
    if (url) {
      checks[name] = await checkService(name, url);
    }
  }

  // Determine overall status
  const allHealthy = Object.values(checks).every(
    (check) => check.status === 'healthy'
  );
  const anyUnhealthy = Object.values(checks).some(
    (check) => check.status === 'unhealthy'
  );

  const overallStatus = allHealthy
    ? 'healthy'
    : anyUnhealthy
    ? 'unhealthy'
    : 'degraded';

  return {
    status: overallStatus,
    service: serviceName,
    version,
    timestamp: new Date().toISOString(),
    responseTime: `${Date.now() - startTime}ms`,
    checks,
    system: getSystemMetrics(),
  };
};

/**
 * Simple liveness probe (always returns 200)
 */
const liveness = (req, res) => {
  res.status(200).json({ status: 'alive' });
};

/**
 * Readiness probe (checks if service is ready to receive traffic)
 */
const readiness = async (config) => {
  return async (req, res) => {
    try {
      // Check database connectivity
      const dbCheck = await checkDatabase();

      if (dbCheck.status === 'healthy') {
        return res.status(200).json({
          status: 'ready',
          service: config.serviceName,
          timestamp: new Date().toISOString(),
        });
      } else {
        return res.status(503).json({
          status: 'not ready',
          service: config.serviceName,
          reason: 'Database unavailable',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      return res.status(503).json({
        status: 'not ready',
        service: config.serviceName,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Detailed health check endpoint
 */
const detailed = (config) => {
  return async (req, res) => {
    try {
      const health = await healthCheck(config);
      const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: config.serviceName,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };
};

module.exports = {
  healthCheck,
  checkDatabase,
  checkRedis,
  checkService,
  getSystemMetrics,
  liveness,
  readiness,
  detailed,
};
