const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env ar backend/
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// Import shared middleware and utilities
const { requestId } = require('/app/shared/middleware/requestId');
const { httpLogger, logger } = require('/app/shared/utils/logger');
const { errorHandler, notFoundHandler } = require('/app/shared/middleware/errorHandler');
const { createSwaggerConfig } = require('/app/shared/utils/swagger');

// Import routes
const userRoutes = require('../routes/userRoutes');

// Swagger configuration
const swagger = createSwaggerConfig({
  serviceName: 'User Service',
  version: '1.0.0',
  description: 'User management API - handles user profiles, authentication, and user data',
  port: process.env.PORT || 3001,
  apis: [path.join(__dirname, '../routes/*.js')],
});

// Create Express app
const app = express();
const startTime = Date.now();

// Middleware
app.use(requestId); // Track requests with unique IDs
app.use(httpLogger); // Log all HTTP requests
app.use(cors({ origin: true, allowedHeaders: ['Content-Type', 'Authorization', 'x-supabase-api-version'] }));
app.use(express.json());

// API Documentation
app.use('/api-docs', swagger.serve, swagger.setup);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'user-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dependencies: {}
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api', userRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(process.env.PORT || 3001, () => {
  logger.info(`User service running on port ${process.env.PORT || 3001}`);
});

// Handle shutdown signals
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