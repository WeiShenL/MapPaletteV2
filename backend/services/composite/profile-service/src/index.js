const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const profileRoutes = require('../routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 3006;
const startTime = Date.now();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'profile-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dependencies: {
      'post-service': process.env.POST_SERVICE_URL || 'http://localhost:3002/api',
      'user-service': process.env.USER_SERVICE_URL || 'http://localhost:3001/api/users',
      'interaction-service': process.env.INTERACTION_SERVICE_URL || 'http://localhost:3003/api/interactions',
      'follow-service': process.env.FOLLOW_SERVICE_URL || 'http://localhost:3006/api/follow'
    }
  });
});

// Routes
app.use('/api/profile', profileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Profile Service running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});