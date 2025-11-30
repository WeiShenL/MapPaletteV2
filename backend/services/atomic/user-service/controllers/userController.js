const { db } = require('/app/shared/utils/db');
const { cache } = require('/app/shared/utils/redis');

// Create a new user (called after Supabase auth creates the user)
// NOTE: This is typically not needed as the auth trigger handles user creation
// This endpoint is kept for manual user creation or profile completion
const createUser = async (req, res) => {
  const { email, username, profilePicture, birthday, gender, userId } = req.body;

  // Only email, username, and userId are required
  // birthday and gender are optional
  if (!email || !username || !userId) {
    return res.status(400).json({ message: 'Email, username, and userId are required.' });
  }

  console.log(`[CREATE_USER] Creating user: ${username}`);

  try {
    // Check if username already exists
    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const userData = await db.user.create({
      data: {
        id: userId, // Use Supabase auth user ID
        email,
        username,
        profilePicture: profilePicture || '/resources/default-profile.png',
        birthday: birthday || null, // Optional
        gender: gender || null,     // Optional
        isProfilePrivate: false,
        isPostPrivate: false,
        numFollowers: 0,
        numFollowing: 0,
        points: 0,
      },
    });

    console.log(`[CREATE_USER] Success: ${userData.id}`);
    return res.status(201).json({
      message: 'User created successfully',
      user: userData
    });
  } catch (error) {
    console.error(`[CREATE_USER] Error:`, error);
    return res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Get user by ID (with caching)
const getUserById = async (req, res) => {
  const { userID } = req.params;

  try {
    // Try cache first
    const cacheKey = `user:${userID}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const user = await db.user.findUnique({
      where: { id: userID },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        birthday: true,
        gender: true,
        isProfilePrivate: true,
        isPostPrivate: true,
        numFollowers: true,
        numFollowing: true,
        points: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cache for 1 hour
    await cache.set(cacheKey, user, 3600);
    return res.json(user);
  } catch (error) {
    console.error(`[GET_USER] Error:`, error);
    return res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Get all users (with pagination)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      db.user.findMany({
        take: parseInt(limit),
        skip,
        select: {
          id: true,
          username: true,
          profilePicture: true,
          points: true,
          numFollowers: true,
          numFollowing: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count(),
    ]);

    return res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(`[GET_ALL_USERS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get condensed users with following status (with pagination)
const getCondensedUsers = async (req, res) => {
  const { currentUserID } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [users, total, following] = await Promise.all([
      db.user.findMany({
        where: { id: { not: currentUserID } },
        take: parseInt(limit),
        skip,
        select: {
          id: true,
          username: true,
          profilePicture: true,
          points: true,
        },
        orderBy: { points: 'desc' },
      }),
      db.user.count({ where: { id: { not: currentUserID } } }),
      db.follow.findMany({
        where: { followerId: currentUserID },
        select: { followingId: true },
      }),
    ]);

    const followingIds = new Set(following.map(f => f.followingId));

    const usersWithFollowStatus = users.map(user => ({
      ...user,
      isFollowing: followingIds.has(user.id),
    }));

    return res.json({
      users: usersWithFollowStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(`[GET_CONDENSED_USERS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get user's followers (with pagination)
const getUserFollowers = async (req, res) => {
  const { userID } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [followers, total] = await Promise.all([
      db.follow.findMany({
        where: { followingId: userID },
        take: parseInt(limit),
        skip,
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              points: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.follow.count({ where: { followingId: userID } }),
    ]);

    const users = followers.map(f => f.follower);

    return res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(`[GET_FOLLOWERS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching followers', error: error.message });
  }
};

// Get user's following (with pagination)
const getUserFollowing = async (req, res) => {
  const { userID } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [following, total] = await Promise.all([
      db.follow.findMany({
        where: { followerId: userID },
        take: parseInt(limit),
        skip,
        select: {
          following: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              points: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.follow.count({ where: { followerId: userID } }),
    ]);

    const users = following.map(f => f.following);

    return res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(`[GET_FOLLOWING] Error:`, error);
    return res.status(500).json({ message: 'Error fetching following', error: error.message });
  }
};

// Get user's liked posts (with pagination - FIXED!)
const getUserLikedPosts = async (req, res) => {
  const { userID } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [likes, total] = await Promise.all([
      db.like.findMany({
        where: { userId: userID },
        take: parseInt(limit),
        skip,
        select: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.like.count({ where: { userId: userID } }),
    ]);

    const posts = likes.map(l => l.post);

    return res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(`[GET_LIKED_POSTS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching liked posts', error: error.message });
  }
};

// Update username (requires ownership - checked by middleware)
const updateUsername = async (req, res) => {
  const { userID } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    // Check if username is taken
    const existing = await db.user.findUnique({ where: { username } });
    if (existing && existing.id !== userID) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await db.user.update({
      where: { id: userID },
      data: { username },
    });

    // Invalidate cache
    await cache.del(`user:${userID}`);

    return res.json({ message: 'Username updated', user });
  } catch (error) {
    console.error(`[UPDATE_USERNAME] Error:`, error);
    return res.status(500).json({ message: 'Error updating username', error: error.message });
  }
};

// Update profile picture
const updateProfilePicture = async (req, res) => {
  const { userID } = req.params;
  const { profilePicture } = req.body;

  if (!profilePicture) {
    return res.status(400).json({ message: 'Profile picture URL is required' });
  }

  try {
    const user = await db.user.update({
      where: { id: userID },
      data: { profilePicture },
    });

    await cache.del(`user:${userID}`);

    return res.json({ message: 'Profile picture updated', user });
  } catch (error) {
    console.error(`[UPDATE_PROFILE_PICTURE] Error:`, error);
    return res.status(500).json({ message: 'Error updating profile picture', error: error.message });
  }
};

// Update privacy settings
const updatePrivacySettings = async (req, res) => {
  const { userID } = req.params;
  const { isProfilePrivate, isPostPrivate } = req.body;

  try {
    const user = await db.user.update({
      where: { id: userID },
      data: {
        ...(isProfilePrivate !== undefined && { isProfilePrivate }),
        ...(isPostPrivate !== undefined && { isPostPrivate }),
      },
    });

    await cache.del(`user:${userID}`);

    return res.json({ message: 'Privacy settings updated', user });
  } catch (error) {
    console.error(`[UPDATE_PRIVACY] Error:`, error);
    return res.status(500).json({ message: 'Error updating privacy', error: error.message });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  const { userID } = req.params;

  try {
    await db.user.delete({ where: { id: userID } });
    await cache.del(`user:${userID}`);

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(`[DELETE_USER] Error:`, error);
    return res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Update user points (INTERNAL USE ONLY - requires service key)
const updateUserPoints = async (req, res) => {
  const { userID } = req.params;
  const { pointsToAdd } = req.body;

  // Verify service key for internal service calls
  const serviceKey = req.headers['x-service-key'];
  if (serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: 'Forbidden: Service key required' });
  }

  try {
    const user = await db.user.update({
      where: { id: userID },
      data: {
        points: { increment: pointsToAdd || 0 },
      },
    });

    await cache.del(`user:${userID}`);
    await cache.del('leaderboard:*'); // Invalidate leaderboard cache

    return res.json({ message: 'Points updated', user });
  } catch (error) {
    console.error(`[UPDATE_POINTS] Error:`, error);
    return res.status(500).json({ message: 'Error updating points', error: error.message });
  }
};

// Update user count (INTERNAL USE ONLY - requires service key)
const updateUserCount = async (req, res) => {
  const { userID } = req.params;
  const { numFollowers, numFollowing } = req.body;

  // Verify service key
  const serviceKey = req.headers['x-service-key'];
  if (serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: 'Forbidden: Service key required' });
  }

  try {
    const user = await db.user.update({
      where: { id: userID },
      data: {
        ...(numFollowers !== undefined && { numFollowers }),
        ...(numFollowing !== undefined && { numFollowing }),
      },
    });

    await cache.del(`user:${userID}`);

    return res.json({ message: 'Count updated', user });
  } catch (error) {
    console.error(`[UPDATE_COUNT] Error:`, error);
    return res.status(500).json({ message: 'Error updating count', error: error.message });
  }
};

// Get users batch
const getUsersBatch = async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ message: 'userIds array is required' });
  }

  try {
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        points: true,
      },
    });

    return res.json(users);
  } catch (error) {
    console.error(`[GET_USERS_BATCH] Error:`, error);
    return res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get leaderboard (with caching and pagination)
const getUsersForLeaderboard = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Try cache first
    const cacheKey = `leaderboard:${page}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        take: parseInt(limit),
        skip,
        select: {
          id: true,
          username: true,
          profilePicture: true,
          points: true,
        },
        orderBy: { points: 'desc' },
      }),
      db.user.count(),
    ]);

    const result = {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return res.json(result);
  } catch (error) {
    console.error(`[LEADERBOARD] Error:`, error);
    return res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};

// Upload profile picture (using Supabase Storage)
const uploadProfilePicture = async (req, res) => {
  const { userID } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const { uploadProfilePicture: uploadToStorage } = require('/app/shared/utils/storageService');

    // Upload to Supabase Storage
    const uploadResult = await uploadToStorage(req.file.buffer, userID, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        message: 'Failed to upload profile picture to storage',
        error: uploadResult.error
      });
    }

    const publicUrl = uploadResult.publicUrl;

    // Update user profile picture in database
    await db.user.update({
      where: { id: userID },
      data: { profilePicture: publicUrl },
    });

    // Clear cache
    await cache.del(`user:${userID}`);

    console.log(`[UPLOAD_PROFILE_PICTURE] Success: ${userID} -> ${publicUrl}`);

    return res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: publicUrl,
      url: publicUrl
    });
  } catch (error) {
    console.error(`[UPLOAD_PROFILE_PICTURE] Error:`, error);
    return res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
};

// Assign default profile picture (admin only)
const assignDefaultProfilePicture = async (req, res) => {
  try {
    await db.user.updateMany({
      where: {
        profilePicture: { equals: null },
      },
      data: {
        profilePicture: '/resources/default-profile.png',
      },
    });

    return res.json({ message: 'Default profile pictures assigned' });
  } catch (error) {
    console.error(`[ASSIGN_DEFAULT_PROFILE] Error:`, error);
    return res.status(500).json({ message: 'Error assigning default profiles', error: error.message });
  }
};

module.exports = {
  createUser,
  getUserById,
  getAllUsers,
  getCondensedUsers,
  getUserFollowers,
  getUserFollowing,
  getUserLikedPosts,
  updateUsername,
  updateProfilePicture,
  updatePrivacySettings,
  deleteUser,
  updateUserPoints,
  updateUserCount,
  getUsersBatch,
  getUsersForLeaderboard,
  uploadProfilePicture,
  assignDefaultProfilePicture,
};
