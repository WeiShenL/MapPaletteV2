const express = require('express');
const router = express.Router();

// change the feedcontroller here ya...
const feedController = require('../controllers/feedController');

// Get user's personalized feed
router.get('/user/:userId', feedController.getUserFeed);

// Get all posts (discovery/explore)
router.get('/all', feedController.getAllPosts);

// Get single post with full details
router.get('/post/:postId', feedController.getPostDetails);

// Get trending posts
router.get('/trending', feedController.getTrendingPosts);

module.exports = router;