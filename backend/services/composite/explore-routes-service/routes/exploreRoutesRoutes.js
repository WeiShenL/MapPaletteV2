const express = require('express');
const router = express.Router();
const { getAllRoutes, getRouteById } = require('../controllers/exploreRoutesController');

// Get all routes with pagination and filtering
// Query params: page, limit, sortBy, search, userId
router.get('/routes', getAllRoutes);

// Get a specific route by ID
router.get('/routes/:postId', getRouteById);

module.exports = router;