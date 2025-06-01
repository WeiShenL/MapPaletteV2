const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

const followRoutes = require('../routes/followRoutes');

const app = express();
const startTime = Date.now();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/follow', followRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'follow-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dependencies: {}
  });
});

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`Follow Service running on port ${PORT}`);
});