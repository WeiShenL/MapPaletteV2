const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });
const interactionRoutes = require('../routes/interactionRoutes');

const app = express();
const PORT = process.env.PORT || 3003;
const startTime = Date.now();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/interactions', interactionRoutes);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Interaction Service running on port ${PORT}`);
});