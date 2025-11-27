const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

// Import shared middleware and utilities
const { requestId } = require('../../../shared/middleware/requestId');
const { httpLogger, logger } = require('../../../shared/utils/logger');
const { errorHandler, notFoundHandler } = require('../../../shared/middleware/errorHandler');
const { createSwaggerConfig } = require('../../../shared/utils/swagger');

const feedRoutes = require('../routes/feedRoutes');

// Swagger configuration
const swagger = createSwaggerConfig({
  serviceName: 'Feed Service',
  version: '1.0.0',
  description: 'Feed API - aggregates posts from followed users for personalized feed',
  port: process.env.PORT || 3004,
  apis: [path.join(__dirname, '../routes/*.js')],
});

const app = express();
const PORT = process.env.PORT || 3004;
const startTime = Date.now();

// Middleware
app.use(requestId);
app.use(httpLogger);
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swagger.serve, swagger.setup);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'feed-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dependencies: {
      'post-service': process.env.POST_SERVICE_URL + '/health',
      'user-service': process.env.USER_SERVICE_URL + '/health',
      'interaction-service': process.env.INTERACTION_SERVICE_URL + '/health',
      'follow-service': process.env.FOLLOW_SERVICE_URL + '/health',
    }
  });
});

// Routes
app.use('/api/feed', feedRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`Feed Composite Service running on port ${PORT}`);
  logger.info('Connected services:', {
    postService: process.env.POST_SERVICE_URL || 'http://localhost:3002',
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    interactionService: process.env.INTERACTION_SERVICE_URL || 'http://localhost:3003',
    followService: process.env.FOLLOW_SERVICE_URL || 'http://localhost:3007'
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});