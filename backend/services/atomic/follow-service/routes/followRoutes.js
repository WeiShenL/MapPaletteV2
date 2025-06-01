const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');

// Create follow relationship
router.post('/follow', followController.createFollow);

// Delete follow relationship
router.delete('/follow', followController.deleteFollow);

// Get followers of a user
router.get('/followers/:userId', followController.getFollowers);

// Get users that a user is following
router.get('/following/:userId', followController.getFollowing);

// Check if user A follows user B
router.get('/check', followController.checkFollow);

// Get follow statistics for a user
router.get('/stats/:userId', followController.getFollowStats);

// Sync follow counts (utility endpoint)
router.post('/sync/:userId', followController.syncFollowCounts);

module.exports = router;