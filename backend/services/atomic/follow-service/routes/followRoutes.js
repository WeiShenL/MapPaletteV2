const path = require('path');
const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { verifyAuth } = require(path.join(__dirname, '../../../../shared/middleware/auth');
const { validate, userIdSchema, followSchema, paginationSchema } = require(path.join(__dirname, '../../../../shared/middleware/validator');
const { moderateLimiter, lenientLimiter, strictLimiter } = require(path.join(__dirname, '../../../../shared/middleware/rateLimiter');
const { asyncHandler } = require(path.join(__dirname, '../../../../shared/middleware/errorHandler');

// Create follow relationship (moderate rate limit)
router.post('/follow', moderateLimiter, verifyAuth, validate({ body: followSchema }), asyncHandler(followController.createFollow));

// Delete follow relationship (moderate rate limit)
router.delete('/follow', moderateLimiter, verifyAuth, validate({ body: followSchema }), asyncHandler(followController.deleteFollow));

// Get followers of a user (lenient rate limit)
router.get('/followers/:userId', lenientLimiter, validate({ params: { userId: userIdSchema.shape.userId }, query: paginationSchema }), asyncHandler(followController.getFollowers));

// Get users that a user is following (lenient rate limit)
router.get('/following/:userId', lenientLimiter, validate({ params: { userId: userIdSchema.shape.userId }, query: paginationSchema }), asyncHandler(followController.getFollowing));

// Check if user A follows user B (lenient rate limit)
router.get('/check', lenientLimiter, validate({ query: { followerId: userIdSchema.shape.userId, followingId: userIdSchema.shape.userId } }), asyncHandler(followController.checkFollow));

// Get follow statistics for a user (lenient rate limit)
router.get('/stats/:userId', lenientLimiter, validate({ params: { userId: userIdSchema.shape.userId } }), asyncHandler(followController.getFollowStats));

// Sync follow counts (utility endpoint) - Strict rate limit (internal use)
router.post('/sync/:userId', strictLimiter, validate({ params: { userId: userIdSchema.shape.userId } }), asyncHandler(followController.syncFollowCounts));

module.exports = router;