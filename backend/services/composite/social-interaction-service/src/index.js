const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from backend/.env --> ignored when run thru docker
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const socialInteractionRoutes = require('../routes/socialInteractionRoutes');

const app = express();
const PORT = process.env.PORT || 3005;
const startTime = Date.now();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (remove ltr)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body));
  }
  next();
});

// Routes
app.use('/api/social', socialInteractionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'social-interaction-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dependencies: {
      'user-service': process.env.USER_SERVICE_URL || 'http://localhost:3001/api/users',
      'post-service': process.env.POST_SERVICE_URL || 'http://localhost:3002/api/posts',
      'interaction-service': process.env.INTERACTION_SERVICE_URL || 'http://localhost:3003/api/interactions',
      'follow-service': process.env.FOLLOW_SERVICE_URL || 'http://localhost:3007/api/follow'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Social Interaction Composite Service running on port ${PORT}`);
});