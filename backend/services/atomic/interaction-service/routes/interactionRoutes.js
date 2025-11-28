const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { verifyAuth } = require('/app/shared/middleware/auth');
const { validate, uuidSchema, commentSchema, paginationSchema } = require('/app/shared/middleware/validator');
const { moderateLimiter, lenientLimiter, strictLimiter } = require('/app/shared/middleware/rateLimiter');
const { asyncHandler } = require('/app/shared/middleware/errorHandler');
const { z } = require('zod');

// Entity validation schema
const entitySchema = z.object({
  entityType: z.enum(['post', 'comment', 'route']),
  entityId: uuidSchema,
});

const commentIdSchema = z.object({
  commentId: uuidSchema,
});

// Like/Unlike endpoints (moderate rate limit)
router.post('/like/:entityType/:entityId', moderateLimiter, verifyAuth, validate({ params: entitySchema }), asyncHandler(interactionController.likeEntity));
router.delete('/unlike/:entityType/:entityId', moderateLimiter, verifyAuth, validate({ params: entitySchema }), asyncHandler(interactionController.unlikeEntity));

// Share endpoints (moderate rate limit)
router.post('/share/:entityType/:entityId', moderateLimiter, verifyAuth, validate({ params: entitySchema }), asyncHandler(interactionController.shareEntity));

// Comment endpoints
router.post('/comment/:entityType/:entityId', moderateLimiter, verifyAuth, validate({ params: entitySchema, body: commentSchema }), asyncHandler(interactionController.addComment));
router.get('/comment/:commentId', lenientLimiter, validate({ params: commentIdSchema }), asyncHandler(interactionController.getComment));
router.delete('/comment/:commentId', strictLimiter, verifyAuth, validate({ params: commentIdSchema }), asyncHandler(interactionController.deleteComment));

// Get interactions for an entity (lenient rate limit)
router.get('/likes/:entityType/:entityId', lenientLimiter, validate({ params: entitySchema, query: paginationSchema }), asyncHandler(interactionController.getLikes));
router.get('/comments/:entityType/:entityId', lenientLimiter, validate({ params: entitySchema, query: paginationSchema }), asyncHandler(interactionController.getComments));
router.get('/shares/:entityType/:entityId', lenientLimiter, validate({ params: entitySchema, query: paginationSchema }), asyncHandler(interactionController.getShares));

// Check user interaction status (lenient rate limit)
router.get('/check/:entityType/:entityId/:userId', lenientLimiter, validate({ params: { ...entitySchema.shape, userId: uuidSchema } }), asyncHandler(interactionController.checkUserInteraction));

// Batch endpoints (moderate rate limit)
router.post('/batch', moderateLimiter, asyncHandler(interactionController.getBatchInteractions));

module.exports = router;