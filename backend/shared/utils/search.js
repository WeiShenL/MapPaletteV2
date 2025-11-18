/**
 * Full-Text Search Utilities
 * PostgreSQL full-text search for users, posts, and routes
 */

const { db } = require('./db');

/**
 * Search users by username, display name, or bio
 * @param {string} query - Search query
 * @param {Object} options - Pagination options
 */
const searchUsers = async (query, options = {}) => {
  const { cursor, limit = 20 } = options;

  // Sanitize query for PostgreSQL full-text search
  const sanitizedQuery = query
    .trim()
    .split(/\s+/)
    .map((word) => `${word}:*`)
    .join(' & ');

  const users = await db.$queryRaw`
    SELECT
      id,
      username,
      "displayName",
      "profilePicture",
      bio,
      "followerCount",
      "followingCount",
      "postCount",
      "createdAt",
      ts_rank(search_vector, to_tsquery('english', ${sanitizedQuery})) as rank
    FROM "User"
    WHERE search_vector @@ to_tsquery('english', ${sanitizedQuery})
    ${cursor ? db.$queryRaw`AND id > ${cursor}::uuid` : db.$queryRaw``}
    ORDER BY rank DESC, id ASC
    LIMIT ${limit + 1}
  `;

  const hasMore = users.length > limit;
  const results = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  return {
    users: results,
    cursor: nextCursor,
    hasMore,
  };
};

/**
 * Search posts by name, description, or tags
 * @param {string} query - Search query
 * @param {Object} options - Search options
 */
const searchPosts = async (query, options = {}) => {
  const { cursor, limit = 20, includePrivate = false } = options;

  const sanitizedQuery = query
    .trim()
    .split(/\s+/)
    .map((word) => `${word}:*`)
    .join(' & ');

  const posts = await db.$queryRaw`
    SELECT
      p.id,
      p."userId",
      p.name,
      p.description,
      p."routeData",
      p.distance,
      p.duration,
      p.difficulty,
      p."isPublic",
      p."likeCount",
      p."commentCount",
      p."shareCount",
      p."createdAt",
      p."updatedAt",
      ts_rank(p.search_vector, to_tsquery('english', ${sanitizedQuery})) as rank
    FROM "Post" p
    WHERE p.search_vector @@ to_tsquery('english', ${sanitizedQuery})
    ${!includePrivate ? db.$queryRaw`AND p."isPublic" = true` : db.$queryRaw``}
    ${cursor ? db.$queryRaw`AND p.id > ${cursor}::uuid` : db.$queryRaw``}
    ORDER BY rank DESC, p.id ASC
    LIMIT ${limit + 1}
  `;

  const hasMore = posts.length > limit;
  const results = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  return {
    posts: results,
    cursor: nextCursor,
    hasMore,
  };
};

/**
 * Search across all entities (users and posts)
 * @param {string} query - Search query
 * @param {Object} options - Search options
 */
const searchAll = async (query, options = {}) => {
  const { limit = 10 } = options;

  const [userResults, postResults] = await Promise.all([
    searchUsers(query, { limit }),
    searchPosts(query, { limit }),
  ]);

  return {
    users: userResults.users,
    posts: postResults.posts,
    totalResults: userResults.users.length + postResults.posts.length,
  };
};

/**
 * Get search suggestions/autocomplete
 * @param {string} query - Partial search query
 * @param {string} type - Type of suggestions (users, posts, all)
 */
const searchSuggestions = async (query, type = 'all', limit = 5) => {
  const sanitizedQuery = query.trim().toLowerCase();

  const suggestions = [];

  if (type === 'users' || type === 'all') {
    const users = await db.user.findMany({
      where: {
        OR: [
          { username: { contains: sanitizedQuery, mode: 'insensitive' } },
          { displayName: { contains: sanitizedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePicture: true,
      },
      take: limit,
    });
    suggestions.push(...users.map((u) => ({ type: 'user', ...u })));
  }

  if (type === 'posts' || type === 'all') {
    const posts = await db.post.findMany({
      where: {
        AND: [
          { isPublic: true },
          {
            OR: [
              { name: { contains: sanitizedQuery, mode: 'insensitive' } },
              { description: { contains: sanitizedQuery, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
      },
      take: limit,
    });
    suggestions.push(...posts.map((p) => ({ type: 'post', ...p })));
  }

  return suggestions.slice(0, limit);
};

/**
 * Update search index for a user
 * @param {string} userId - User ID
 */
const updateUserSearchIndex = async (userId) => {
  await db.$executeRaw`
    UPDATE "User"
    SET search_vector =
      setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE("displayName", '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(bio, '')), 'C')
    WHERE id = ${userId}::uuid
  `;
};

/**
 * Update search index for a post
 * @param {string} postId - Post ID
 */
const updatePostSearchIndex = async (postId) => {
  await db.$executeRaw`
    UPDATE "Post"
    SET search_vector =
      setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(ARRAY_TO_STRING(tags, ' '), '')), 'C')
    WHERE id = ${postId}::uuid
  `;
};

/**
 * Rebuild all search indexes (maintenance operation)
 */
const rebuildSearchIndexes = async () => {
  if (global.logger) {
    global.logger.info('Rebuilding all search indexes...');
  }

  // Rebuild user search indexes
  await db.$executeRaw`
    UPDATE "User"
    SET search_vector =
      setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE("displayName", '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(bio, '')), 'C')
  `;

  // Rebuild post search indexes
  await db.$executeRaw`
    UPDATE "Post"
    SET search_vector =
      setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(ARRAY_TO_STRING(tags, ' '), '')), 'C')
  `;

  if (global.logger) {
    global.logger.info('Search indexes rebuilt successfully');
  }
};

module.exports = {
  searchUsers,
  searchPosts,
  searchAll,
  searchSuggestions,
  updateUserSearchIndex,
  updatePostSearchIndex,
  rebuildSearchIndexes,
};
