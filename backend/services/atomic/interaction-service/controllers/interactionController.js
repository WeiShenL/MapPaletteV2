const { db } = require('/app/shared/utils/db');
const { cache } = require('/app/shared/utils/redis');

// Like a post
const likeEntity = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId } = req.body;

  if (!entityType || !entityId || !userId) {
    return res.status(400).json({ message: 'Entity type, entity ID, and user ID are required' });
  }

  // Only support posts for now
  if (entityType !== 'post') {
    return res.status(400).json({ message: 'Only posts can be liked' });
  }

  console.log(`[LIKE] User ${userId} liking ${entityType} ${entityId}`);

  try {
    // Create like (unique constraint will prevent duplicates)
    const like = await db.like.create({
      data: {
        userId,
        postId: entityId,
      }
    });

    // Update post like count
    await db.post.update({
      where: { id: entityId },
      data: { likeCount: { increment: 1 } }
    });

    // Invalidate caches
    await cache.del(`post:${entityId}`);
    await cache.delPattern(`feed:*`);

    console.log(`[LIKE] Successfully created like: ${like.id}`);
    return res.json({
      message: 'Entity liked successfully!',
      interactionId: like.id
    });
  } catch (error) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      return res.status(400).json({ message: 'User has already liked this entity' });
    }
    console.error(`[LIKE] Error:`, error);
    return res.status(500).json({ message: 'Error creating like', error: error.message });
  }
};

// Unlike a post
const unlikeEntity = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId } = req.body;

  if (!entityType || !entityId || !userId) {
    return res.status(400).json({ message: 'Entity type, entity ID, and user ID are required' });
  }

  console.log(`[UNLIKE] User ${userId} unliking ${entityType} ${entityId}`);

  try {
    // Delete like
    const deleted = await db.like.deleteMany({
      where: {
        userId,
        postId: entityId,
      }
    });

    if (deleted.count === 0) {
      return res.status(400).json({ message: 'User has not liked this entity' });
    }

    // Update post like count
    await db.post.update({
      where: { id: entityId },
      data: { likeCount: { decrement: 1 } }
    });

    // Invalidate caches
    await cache.del(`post:${entityId}`);
    await cache.delPattern(`feed:*`);

    console.log(`[UNLIKE] Successfully removed like`);
    return res.json({ message: 'Entity unliked successfully!' });
  } catch (error) {
    console.error(`[UNLIKE] Error:`, error);
    return res.status(500).json({ message: 'Error removing like', error: error.message });
  }
};

// Share a post
const shareEntity = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId } = req.body;

  if (!entityType || !entityId || !userId) {
    return res.status(400).json({ message: 'Entity type, entity ID, and user ID are required' });
  }

  console.log(`[SHARE] User ${userId} sharing ${entityType} ${entityId}`);

  try {
    // Check if user already shared this post
    const existingShare = await db.share.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: entityId
        }
      }
    });

    if (existingShare) {
      console.log(`[SHARE] User ${userId} already shared ${entityType} ${entityId}`);
      return res.json({
        message: 'Post already shared',
        interactionId: existingShare.id,
        isNewShare: false
      });
    }

    // Create new share record
    const share = await db.share.create({
      data: {
        userId,
        postId: entityId,
      }
    });

    // Invalidate caches
    await cache.del(`post:${entityId}`);

    console.log(`[SHARE] Successfully created share: ${share.id}`);
    return res.json({
      message: 'Entity shared successfully!',
      interactionId: share.id,
      isNewShare: true
    });
  } catch (error) {
    console.error(`[SHARE] Error:`, error);
    return res.status(500).json({ message: 'Error creating share', error: error.message });
  }
};

// Create comment
const createComment = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ message: 'User ID and content are required' });
  }

  console.log(`[COMMENT] User ${userId} commenting on ${entityType} ${entityId}`);

  try {
    const comment = await db.comment.create({
      data: {
        userId,
        postId: entityId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          }
        }
      }
    });

    // Note: commentCount is updated by social-interaction-service (composite layer)
    // to avoid double-counting

    // Invalidate caches
    await cache.del(`post:${entityId}`);
    await cache.delPattern(`comments:${entityId}:*`);

    console.log(`[COMMENT] Successfully created comment: ${comment.id}`);
    return res.json({
      message: 'Comment created successfully!',
      comment
    });
  } catch (error) {
    console.error(`[COMMENT] Error:`, error);
    return res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
};

// Get comments for a post
const getComments = async (req, res) => {
  const { entityId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  console.log(`[GET_COMMENTS] Fetching comments for post ${entityId}`);

  try {
    // Try cache
    const cacheKey = `comments:${entityId}:${page}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where: { postId: entityId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip,
      }),
      db.comment.count({ where: { postId: entityId } })
    ]);

    const result = {
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    return res.json(result);
  } catch (error) {
    console.error(`[GET_COMMENTS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

// Delete comment (with entityId in route)
const deleteComment = async (req, res) => {
  const { entityId, commentId } = req.params;

  console.log(`[DELETE_COMMENT] Deleting comment ${commentId}`);

  try {
    await db.comment.delete({
      where: { id: commentId }
    });

    // Note: commentCount is updated by social-interaction-service (composite layer)
    // to avoid double-counting

    // Invalidate caches
    await cache.del(`post:${entityId}`);
    await cache.delPattern(`comments:${entityId}:*`);

    console.log(`[DELETE_COMMENT] Successfully deleted comment`);
    return res.json({ message: 'Comment deleted successfully!' });
  } catch (error) {
    console.error(`[DELETE_COMMENT] Error:`, error);
    return res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Get a single comment by ID
const getCommentById = async (req, res) => {
  const { commentId } = req.params;

  console.log(`[GET_COMMENT] Fetching comment ${commentId}`);

  try {
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Return with entityType and entityId for backwards compatibility
    return res.json({
      ...comment,
      entityType: 'post',
      entityId: comment.postId
    });
  } catch (error) {
    console.error(`[GET_COMMENT] Error:`, error);
    return res.status(500).json({ message: 'Error fetching comment', error: error.message });
  }
};

// Delete comment by ID only (looks up postId from the comment)
const deleteCommentById = async (req, res) => {
  const { commentId } = req.params;

  console.log(`[DELETE_COMMENT_BY_ID] Deleting comment ${commentId}`);

  try {
    // First get the comment to find its postId
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { postId: true }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const postId = comment.postId;

    // Delete the comment
    await db.comment.delete({
      where: { id: commentId }
    });

    // Update post comment count
    await db.post.update({
      where: { id: postId },
      data: { commentCount: { decrement: 1 } }
    });

    // Invalidate caches
    await cache.del(`post:${postId}`);
    await cache.delPattern(`comments:${postId}:*`);

    console.log(`[DELETE_COMMENT_BY_ID] Successfully deleted comment ${commentId}`);
    return res.json({ message: 'Comment deleted successfully!' });
  } catch (error) {
    console.error(`[DELETE_COMMENT_BY_ID] Error:`, error);
    return res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Check if user liked a post
const checkLike = async (req, res) => {
  const { entityId, userId } = req.params;
  // Also support userId from query for backwards compatibility
  const userIdToCheck = userId || req.query.userId;

  if (!userIdToCheck) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const like = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: userIdToCheck,
          postId: entityId,
        }
      }
    });

    return res.json({ liked: !!like });
  } catch (error) {
    console.error(`[CHECK_LIKE] Error:`, error);
    return res.status(500).json({ message: 'Error checking like status', error: error.message });
  }
};

// Get likes for a post
const getLikes = async (req, res) => {
  const { entityId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  console.log(`[GET_LIKES] Fetching likes for post ${entityId}`);

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [likes, total] = await Promise.all([
      db.like.findMany({
        where: { postId: entityId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip,
      }),
      db.like.count({ where: { postId: entityId } })
    ]);

    return res.json({
      count: total,
      likes: likes.map(like => ({
        id: like.id,
        userId: like.userId,
        username: like.user?.username,
        profilePicture: like.user?.profilePicture,
        createdAt: like.createdAt
      }))
    });
  } catch (error) {
    console.error(`[GET_LIKES] Error:`, error);
    return res.status(500).json({ message: 'Error fetching likes', error: error.message });
  }
};

// Get shares for a post
const getShares = async (req, res) => {
  const { entityId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  console.log(`[GET_SHARES] Fetching shares for post ${entityId}`);

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [shares, total] = await Promise.all([
      db.share.findMany({
        where: { postId: entityId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip,
      }),
      db.share.count({ where: { postId: entityId } })
    ]);

    return res.json({
      count: total,
      shares: shares.map(share => ({
        id: share.id,
        userId: share.userId,
        username: share.user?.username,
        profilePicture: share.user?.profilePicture,
        createdAt: share.createdAt
      }))
    });
  } catch (error) {
    console.error(`[GET_SHARES] Error:`, error);
    return res.status(500).json({ message: 'Error fetching shares', error: error.message });
  }
};

// Get all interactions for a post (batch)
const getInteractionsBatch = async (req, res) => {
  const { postIds, userId } = req.body;

  if (!postIds || !Array.isArray(postIds)) {
    return res.status(400).json({ message: 'postIds array is required' });
  }

  try {
    const likes = userId ? await db.like.findMany({
      where: {
        postId: { in: postIds },
        userId,
      },
      select: { postId: true }
    }) : [];

    const likedPostIds = new Set(likes.map(l => l.postId));

    const result = postIds.reduce((acc, postId) => {
      acc[postId] = {
        liked: likedPostIds.has(postId),
      };
      return acc;
    }, {});

    return res.json(result);
  } catch (error) {
    console.error(`[BATCH_INTERACTIONS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching interactions', error: error.message });
  }
};

module.exports = {
  likeEntity,
  unlikeEntity,
  shareEntity,
  createComment,
  getComments,
  deleteComment,
  getCommentById,
  deleteCommentById,
  checkLike,
  getLikes,
  getShares,
  getInteractionsBatch,
};
