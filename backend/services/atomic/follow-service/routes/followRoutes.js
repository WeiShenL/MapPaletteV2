const express = require('express');
const router = express.Router();
const { z } = require('zod');
const followController = require('../controllers/followController');
const { validate, userIdSchema, followSchema, paginationSchema, uuidSchema } = require('/app/shared/middleware/validator');
const { moderateLimiter, lenientLimiter, strictLimiter } = require('/app/shared/middleware/rateLimiter');
const { asyncHandler } = require('/app/shared/middleware/errorHandler');

// Schema for checking follow relationship - support both naming conventions
const checkFollowQuerySchema = z.object({
  followerId: uuidSchema.optional(),
  followingId: uuidSchema.optional(),
  followerUserId: uuidSchema.optional(),
  followingUserId: uuidSchema.optional(),
}).refine(
  data => (data.followerId || data.followerUserId) && (data.followingId || data.followingUserId),
  { message: 'Both follower and following IDs are required' }
);

// Create follow relationship (moderate rate limit)
// Note: Auth is handled at the composite service level (social-interaction-service)
router.post('/follow', moderateLimiter, validate({ body: followSchema }), asyncHandler(followController.createFollow));

// Delete follow relationship (moderate rate limit)
// Note: Auth is handled at the composite service level (social-interaction-service)
router.delete('/follow', moderateLimiter, validate({ body: followSchema }), asyncHandler(followController.deleteFollow));

// Get followers of a user (lenient rate limit)
router.get('/followers/:userId', lenientLimiter, validate({ params: userIdSchema, query: paginationSchema }), asyncHandler(followController.getFollowers));

// Get users that a user is following (lenient rate limit)
router.get('/following/:userId', lenientLimiter, validate({ params: userIdSchema, query: paginationSchema }), asyncHandler(followController.getFollowing));

// Check if user A follows user B (lenient rate limit)
router.get('/check', lenientLimiter, validate({ query: checkFollowQuerySchema }), asyncHandler(followController.checkFollow));

// Get follow statistics for a user (lenient rate limit)
router.get('/stats/:userId', lenientLimiter, validate({ params: userIdSchema }), asyncHandler(followController.getFollowStats));

// Sync follow counts (utility endpoint) - Strict rate limit (internal use)
router.post('/sync/:userId', strictLimiter, validate({ params: userIdSchema }), asyncHandler(followController.syncFollowCounts));

module.exports = router;