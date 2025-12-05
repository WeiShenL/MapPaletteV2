const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { optionalAuth } = require('/app/shared/middleware/auth');

// Get complete profile data for a user
// Uses optionalAuth to extract currentUser from JWT token
router.get('/user/:userId', optionalAuth, profileController.getUserProfile);

// Get user's followers
router.get('/user/:userId/followers', optionalAuth, profileController.getUserFollowers);

// Get users that the user is following
router.get('/user/:userId/following', optionalAuth, profileController.getUserFollowing);

module.exports = router;