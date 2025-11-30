const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

// Import shared middleware and utilities
const { requestId } = require(path.join(__dirname, '../../../../shared/middleware/requestId');
const { httpLogger, logger } = require(path.join(__dirname, '../../../../shared/utils/logger');
const { errorHandler, notFoundHandler } = require(path.join(__dirname, '../../../../shared/middleware/errorHandler');
const { createSwaggerConfig } = require(path.join(__dirname, '../../../../shared/utils/swagger');

const interactionRoutes = require('../routes/interactionRoutes');

// Swagger configuration
const swagger = createSwaggerConfig({
  serviceName: 'Interaction Service',
  version: '1.0.0',
  description: 'Interaction API - handles likes, comments, and shares on posts and routes',
  port: process.env.PORT || 3003,
  apis: [path.join(__dirname, '../routes/*.js')],
});

const app = express();
const PORT = process.env.PORT || 3003;
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
    service: 'interaction-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dependencies: {}
  });
});

// Routes
app.use('/api/interactions', interactionRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`Interaction Service running on port ${PORT}`);
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