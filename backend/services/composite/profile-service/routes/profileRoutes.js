const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Get complete profile data for a user
router.get('/user/:userId', profileController.getUserProfile);

// Get user's followers
router.get('/user/:userId/followers', profileController.getUserFollowers);

// Get users that the user is following
router.get('/user/:userId/following', profileController.getUserFollowing);

module.exports = router;