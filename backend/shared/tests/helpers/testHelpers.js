/**
 * Test Helper Functions
 */

const { db } = require('../../utils/db');

/**
 * Clean up test database
 */
const cleanupDatabase = async () => {
  // Delete in correct order due to foreign key constraints
  await db.comment.deleteMany({});
  await db.like.deleteMany({});
  await db.share.deleteMany({});
  await db.follow.deleteMany({});
  await db.post.deleteMany({});
  await db.user.deleteMany({});
};

/**
 * Create test user
 */
const createTestUser = async (overrides = {}) => {
  return await db.user.create({
    data: {
      id: overrides.id || 'test-user-' + Date.now(),
      username: overrides.username || 'testuser' + Date.now(),
      email: overrides.email || `test${Date.now()}@example.com`,
      displayName: overrides.displayName || 'Test User',
      ...overrides,
    },
  });
};

/**
 * Create test post
 */
const createTestPost = async (userId, overrides = {}) => {
  return await db.post.create({
    data: {
      userId,
      name: overrides.name || 'Test Route',
      description: overrides.description || 'Test route description',
      routeData: overrides.routeData || {},
      distance: overrides.distance || 5.0,
      duration: overrides.duration || 60,
      difficulty: overrides.difficulty || 'moderate',
      isPublic: overrides.isPublic !== undefined ? overrides.isPublic : true,
      ...overrides,
    },
  });
};

/**
 * Create test follow relationship
 */
const createTestFollow = async (followerId, followingId) => {
  return await db.follow.create({
    data: {
      followerId,
      followingId,
    },
  });
};

/**
 * Create test like
 */
const createTestLike = async (userId, entityType, entityId) => {
  return await db.like.create({
    data: {
      userId,
      entityType,
      entityId,
    },
  });
};

/**
 * Create test comment
 */
const createTestComment = async (userId, entityType, entityId, content) => {
  return await db.comment.create({
    data: {
      userId,
      entityType,
      entityId,
      content: content || 'Test comment',
    },
  });
};

/**
 * Generate fake JWT token for testing
 * Note: In real tests, you should use actual Supabase tokens or mock the auth middleware
 */
const generateTestToken = (userId) => {
  // This is a placeholder - in real tests, generate actual JWT or mock auth
  return `Bearer test-token-${userId}`;
};

/**
 * Wait for async operations
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  cleanupDatabase,
  createTestUser,
  createTestPost,
  createTestFollow,
  createTestLike,
  createTestComment,
  generateTestToken,
  wait,
};
