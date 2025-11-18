const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController.new');
const { verifyAuth, verifyOwnership, optionalAuth } = require('/app/shared/middleware/auth');
const { validate } = require('/app/shared/middleware/validation');
const { rateLimiters } = require('/app/shared/middleware/rateLimit');
const { createPostSchema, updatePostSchema } = require('/app/shared/schemas/post');

// Public routes
router.get('/allposts', optionalAuth, postController.getAllPosts);
router.get('/posts', optionalAuth, postController.getPost);
router.get('/users/:userID/posts', optionalAuth, postController.getUserPosts);

// Protected routes (requires authentication)
router.post(
  '/create/:userID',
  verifyAuth,
  verifyOwnership('userID'),
  rateLimiters.moderate,
  validate(createPostSchema),
  postController.createPost
);

router.put(
  '/posts',
  verifyAuth,
  rateLimiters.moderate,
  validate(updatePostSchema),
  postController.updatePost
);

router.delete(
  '/posts',
  verifyAuth,
  rateLimiters.moderate,
  postController.deletePost
);

// Internal service route (requires service key)
router.patch('/posts/:id/count', postController.updateInteractionCount);

module.exports = router;
