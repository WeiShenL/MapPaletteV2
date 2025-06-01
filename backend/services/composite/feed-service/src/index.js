const express = require('express');
const cors = require('cors');
const feedRoutes = require('../routes/feedRoutes');

const app = express();
const PORT = process.env.PORT || 3004;
const startTime = Date.now();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/feed', feedRoutes);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Feed Composite Service running on port ${PORT}`);
  console.log('Connected services:');
  console.log(`- Post Service: ${process.env.POST_SERVICE_URL || 'http://localhost:3002'}`);
  console.log(`- User Service: ${process.env.USER_SERVICE_URL || 'http://localhost:3001'}`);
  console.log(`- Interaction Service: ${process.env.INTERACTION_SERVICE_URL || 'http://localhost:3003'}`);
  console.log(`- Follow Service: ${process.env.FOLLOW_SERVICE_URL || 'http://localhost:3007'}`);
});