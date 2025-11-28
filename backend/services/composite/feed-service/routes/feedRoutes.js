const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { verifyAuth, optionalAuth } = require('/app/shared/middleware/auth');
const { validate, userIdSchema, postIdSchema, paginationSchema } = require('/app/shared/middleware/validator');
const { lenientLimiter } = require('/app/shared/middleware/rateLimiter');
const { asyncHandler } = require('/app/shared/middleware/errorHandler');

// Get user's personalized feed (lenient rate limit, requires auth)
router.get('/user/:userId', lenientLimiter, verifyAuth, validate({ params: { userId: userIdSchema.shape.userId }, query: paginationSchema }), asyncHandler(feedController.getUserFeed));

// Get all posts (discovery/explore) - lenient rate limit
router.get('/all', lenientLimiter, optionalAuth, validate({ query: paginationSchema }), asyncHandler(feedController.getAllPosts));

// Get single post with full details - lenient rate limit
router.get('/post/:postId', lenientLimiter, optionalAuth, validate({ params: { postId: postIdSchema.shape.postId } }), asyncHandler(feedController.getPostDetails));

// Get trending posts - lenient rate limit
router.get('/trending', lenientLimiter, optionalAuth, validate({ query: paginationSchema }), asyncHandler(feedController.getTrendingPosts));

module.exports = router;