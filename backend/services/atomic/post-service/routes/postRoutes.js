const express = require('express');
const router = express.Router();
const { z } = require('zod');
const postController = require('../controllers/postController');
const { verifyAuth, verifyOwnership, optionalAuth } = require('/app/shared/middleware/auth');
const { validate, postIdSchema, userIdSchema, userIDSchema, paginationSchema, createPostSchema, updatePostSchema, uuidSchema } = require('/app/shared/middleware/validator');
const { moderateLimiter, lenientLimiter, strictLimiter, createLimiter } = require('/app/shared/middleware/rateLimiter');
const { mapGenerationRateLimiter } = require('/app/shared/middleware/mapRateLimiter');
const { asyncHandler } = require('/app/shared/middleware/errorHandler');

// Schema for internal route that uses 'id' param
const idParamSchema = z.object({
  id: uuidSchema,
});

// Public routes - Read operations (lenient rate limit)
router.get('/allposts', lenientLimiter, optionalAuth, validate({ query: paginationSchema }), asyncHandler(postController.getAllPosts));
router.get('/posts', lenientLimiter, optionalAuth, validate({ query: postIdSchema }), asyncHandler(postController.getPost));
router.get('/users/:userID/posts', lenientLimiter, optionalAuth, validate({ params: userIDSchema, query: paginationSchema }), asyncHandler(postController.getUserPosts));

// Protected routes (requires authentication)
// Create operation (create rate limit - 20/hour + map generation limit - 50/hour)
router.post(
  '/create/:userID',
  createLimiter,
  mapGenerationRateLimiter(),
  verifyAuth,
  verifyOwnership('userID'),
  validate({ params: userIDSchema, body: createPostSchema }),
  asyncHandler(postController.createPost)
);

// Update operation (moderate rate limit)
router.put(
  '/posts',
  moderateLimiter,
  verifyAuth,
  validate({ body: updatePostSchema }),
  asyncHandler(postController.updatePost)
);

// Delete operation (strict rate limit)
router.delete(
  '/posts',
  strictLimiter,
  verifyAuth,
  validate({ query: postIdSchema }),
  asyncHandler(postController.deletePost)
);

// Internal service route (requires service key) - Strict rate limit
router.patch('/posts/:id/count', strictLimiter, validate({ params: idParamSchema }), asyncHandler(postController.updateInteractionCount));

module.exports = router;
