const { db } = require('/app/shared/utils/db');
const { cache } = require('/app/shared/utils/redis');

// Create follow relationship
const createFollow = async (req, res) => {
  const { followerUserId, followingUserId } = req.body;

  if (!followerUserId || !followingUserId) {
    return res.status(400).json({ error: 'Both followerUserId and followingUserId are required' });
  }

  if (followerUserId === followingUserId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  console.log(`[FOLLOW] Creating follow: ${followerUserId} -> ${followingUserId}`);

  try {
    // Create follow relationship (unique constraint prevents duplicates)
    const follow = await db.follow.create({
      data: {
        followerId: followerUserId,
        followingId: followingUserId,
      }
    });

    // Update counts for both users
    await Promise.all([
      db.user.update({
        where: { id: followerUserId },
        data: { numFollowing: { increment: 1 } }
      }),
      db.user.update({
        where: { id: followingUserId },
        data: { numFollowers: { increment: 1 } }
      })
    ]);

    // Invalidate caches
    await cache.del(`user:${followerUserId}`);
    await cache.del(`user:${followingUserId}`);
    await cache.delPattern(`feed:${followerUserId}:*`);

    console.log(`[FOLLOW] Successfully created: ${followerUserId} -> ${followingUserId}`);
    return res.status(201).json({
      message: 'Follow relationship created successfully',
      followerId: followerUserId,
      followingId: followingUserId,
      follow
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Follow relationship already exists' });
    }
    console.error(`[FOLLOW] Error:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Delete follow relationship
const deleteFollow = async (req, res) => {
  const { followerUserId, followingUserId } = req.body;

  if (!followerUserId || !followingUserId) {
    return res.status(400).json({ error: 'Both followerUserId and followingUserId are required' });
  }

  console.log(`[UNFOLLOW] Deleting follow: ${followerUserId} -> ${followingUserId}`);

  try {
    // Delete follow relationship
    const deleted = await db.follow.deleteMany({
      where: {
        followerId: followerUserId,
        followingId: followingUserId,
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    // Update counts for both users
    await Promise.all([
      db.user.update({
        where: { id: followerUserId },
        data: { numFollowing: { decrement: 1 } }
      }),
      db.user.update({
        where: { id: followingUserId },
        data: { numFollowers: { decrement: 1 } }
      })
    ]);

    // Invalidate caches
    await cache.del(`user:${followerUserId}`);
    await cache.del(`user:${followingUserId}`);
    await cache.delPattern(`feed:${followerUserId}:*`);

    console.log(`[UNFOLLOW] Successfully deleted: ${followerUserId} -> ${followingUserId}`);
    return res.json({
      message: 'Follow relationship deleted successfully',
      followerId: followerUserId,
      followingId: followingUserId
    });
  } catch (error) {
    console.error(`[UNFOLLOW] Error:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Check if user follows another user
const checkFollow = async (req, res) => {
  const { followerUserId, followingUserId } = req.query;

  if (!followerUserId || !followingUserId) {
    return res.status(400).json({ error: 'Both followerUserId and followingUserId are required' });
  }

  try {
    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerUserId,
          followingId: followingUserId,
        }
      }
    });

    return res.json({ following: !!follow });
  } catch (error) {
    console.error(`[CHECK_FOLLOW] Error:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Get followers of a user
const getFollowers = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  console.log(`[GET_FOLLOWERS] Fetching followers for user ${userId}`);

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [followers, total] = await Promise.all([
      db.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              points: true,
            }
          }
        },
        take: parseInt(limit),
        skip,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.follow.count({ where: { followingId: userId } })
    ]);

    return res.json({
      followers: followers.map(f => f.follower),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error(`[GET_FOLLOWERS] Error:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Get users that current user is following
const getFollowing = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  console.log(`[GET_FOLLOWING] Fetching following for user ${userId}`);

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [following, total] = await Promise.all([
      db.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              points: true,
            }
          }
        },
        take: parseInt(limit),
        skip,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.follow.count({ where: { followerId: userId } })
    ]);

    return res.json({
      following: following.map(f => f.following),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error(`[GET_FOLLOWING] Error:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Batch check if user follows multiple users
const checkFollowBatch = async (req, res) => {
  const { followerUserId, followingUserIds } = req.body;

  if (!followerUserId || !followingUserIds || !Array.isArray(followingUserIds)) {
    return res.status(400).json({ error: 'followerUserId and followingUserIds array are required' });
  }

  try {
    const follows = await db.follow.findMany({
      where: {
        followerId: followerUserId,
        followingId: { in: followingUserIds }
      },
      select: {
        followingId: true
      }
    });

    const followingSet = new Set(follows.map(f => f.followingId));

    const result = followingUserIds.reduce((acc, userId) => {
      acc[userId] = followingSet.has(userId);
      return acc;
    }, {});

    return res.json(result);
  } catch (error) {
    console.error(`[CHECK_FOLLOW_BATCH] Error:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

module.exports = {
  createFollow,
  deleteFollow,
  checkFollow,
  getFollowers,
  getFollowing,
  checkFollowBatch,
};
