/**
 * Input Validation Middleware with Zod
 * Validates request body, query params, and URL params
 */

const { z } = require('zod');
const { ValidationError } = require('./errorHandler');

/**
 * Validates request data against a Zod schema
 * @param {Object} schemas - Object containing schemas for body, query, and params
 * @param {z.ZodSchema} schemas.body - Schema for request body
 * @param {z.ZodSchema} schemas.query - Schema for query parameters
 * @param {z.ZodSchema} schemas.params - Schema for URL parameters
 */
const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      // Validate body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate URL parameters
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod errors into readable format
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return next(
          new ValidationError('Validation failed', details)
        );
      }
      next(error);
    }
  };
};

/**
 * Common validation schemas for reuse
 */

// UUID validation
const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

// Pagination schemas
const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),
});

// User schemas
const userIdSchema = z.object({
  userId: uuidSchema,
});

// User ID schema with capital D (for user-service routes)
const userIDSchema = z.object({
  userID: uuidSchema,
});

// Current User ID schema with capital D (for routes using :currentUserID)
const currentUserIDSchema = z.object({
  currentUserID: uuidSchema,
});

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Post schemas
const postIdSchema = z.object({
  postId: uuidSchema,
});

const createPostSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  routeData: z.record(z.any()), // JSON object
  distance: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).max(10).optional(),
});

const updatePostSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  routeData: z.record(z.any()).optional(),
  distance: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

// Interaction schemas
const likeSchema = z.object({
  postId: uuidSchema,
});

const commentSchema = z.object({
  postId: uuidSchema,
  content: z.string().min(1).max(500),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

// Follow schemas
const followSchema = z.object({
  followerUserId: uuidSchema,
  followingUserId: uuidSchema,
});

// Search schemas
const searchSchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['users', 'posts', 'all']).optional().default('all'),
  ...paginationSchema.shape,
});

// Sort schemas
const sortSchema = z.object({
  sortBy: z.enum(['createdAt', 'likes', 'comments', 'popular']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

module.exports = {
  validate,
  // Common schemas
  uuidSchema,
  paginationSchema,
  // User schemas
  userIdSchema,
  userIDSchema,
  currentUserIDSchema,
  usernameSchema,
  emailSchema,
  // Post schemas
  postIdSchema,
  createPostSchema,
  updatePostSchema,
  // Interaction schemas
  likeSchema,
  commentSchema,
  updateCommentSchema,
  // Follow schemas
  followSchema,
  // Search schemas
  searchSchema,
  sortSchema,
};
