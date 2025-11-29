const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// Load environment variables from backend/.env --> this only needed if run locally, if not ignored
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const exploreRoutesRoutes = require('../routes/exploreRoutesRoutes');

const app = express();
const PORT = process.env.PORT || 3008;
const startTime = Date.now();

// Middleware
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'explore-routes-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dependencies: {
      'post-service': process.env.POST_SERVICE_URL + '/health',
      'user-service': process.env.USER_SERVICE_URL + '/health',
      'interaction-service': process.env.INTERACTION_SERVICE_URL + '/health',
    }
  });
});

// Routes
app.use('/api', exploreRoutesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Explore Routes Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;