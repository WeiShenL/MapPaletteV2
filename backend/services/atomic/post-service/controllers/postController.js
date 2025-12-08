const { db } = require('/app/shared/utils/db');
const { cache } = require('/app/shared/utils/redis');
const { renderMapFromPost, calculateWaypointsHash } = require('/app/shared/utils/googleMapsRenderer');
const { uploadRouteImage, uploadOptimizedRouteImage } = require('/app/shared/utils/storageService');
const axios = require('axios');

// User service URL for points updates
const USER_SERVICE_URL = `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/api/users`;

// Helper function to award points to user
async function awardPoints(userId, points) {
  try {
    await axios.put(
      `${USER_SERVICE_URL}/${userId}/points`,
      { pointsToAdd: points },
      { headers: { 'x-service-key': process.env.INTERNAL_SERVICE_KEY } }
    );
    console.log(`[POINTS] Awarded ${points} points to user ${userId} for creating post`);
  } catch (error) {
    console.error('Error awarding points:', error.message);
    // Don't throw - points are nice to have but not critical
  }
}

// Create a new post
const createPost = async (req, res) => {
  const { userID } = req.params;
  const { title, description, waypoints, color, region, distance, imageUrl } = req.body;

  if (!userID) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  console.log(`[CREATE_POST] User ${userID} creating new post`);

  try {
    // Get username from user
    const user = await db.user.findUnique({
      where: { id: userID },
      select: { username: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create post first (without image URL)
    const post = await db.post.create({
      data: {
        userId: userID,
        title,
        description: description || '',
        waypoints,
        color: color || '#FF0000',
        region,
        distance: parseFloat(distance),
        imageUrl: imageUrl || null,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
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

    // Generate map image if waypoints are provided and no imageUrl
    if (waypoints && !imageUrl) {
      try {
        console.log(`[CREATE_POST] Generating map image for post ${post.id}`);

        // Calculate hash for caching
        const parsedWaypoints = JSON.parse(waypoints);
        const waypointsHash = calculateWaypointsHash(parsedWaypoints, post.color);
        const cacheKey = `map:${waypointsHash}`;

        // Check cache first to avoid duplicate Google Maps API calls
        let cachedImageUrl = await cache.get(cacheKey);

        if (cachedImageUrl) {
          console.log(`[CREATE_POST] Using cached map image for hash ${waypointsHash}`);

          // Update post with cached URL
          await db.post.update({
            where: { id: post.id },
            data: { imageUrl: cachedImageUrl },
          });

          post.imageUrl = cachedImageUrl;
        } else {
          // Render map using Google Maps Static API (returns 3 sizes: thumbnail, medium, large)
          const mapImages = await renderMapFromPost(post);

          // Upload all sizes to storage
          const uploadResult = await uploadRouteImage(
            mapImages.large,
            userID,
            post.id,
            {
              waypointCount: parsedWaypoints.length,
              color: post.color,
              region: post.region,
              hash: waypointsHash,
            }
          );

          // Upload optimized versions (thumbnail and medium)
          await Promise.all([
            uploadOptimizedRouteImage(mapImages.thumbnail, userID, post.id, 'thumbnail'),
            uploadOptimizedRouteImage(mapImages.medium, userID, post.id, 'medium'),
          ]);

          // Update post with image URL
          await db.post.update({
            where: { id: post.id },
            data: { imageUrl: uploadResult.publicUrl },
          });

          post.imageUrl = uploadResult.publicUrl;

          // Cache the URL for 30 days (routes don't change)
          await cache.set(cacheKey, uploadResult.publicUrl, 30 * 24 * 60 * 60);

          console.log(`[CREATE_POST] Map image generated and uploaded: ${uploadResult.publicUrl}`);
        }
      } catch (imageError) {
        // Log error but don't fail the post creation
        console.error(`[CREATE_POST] Failed to generate map image:`, imageError);
        if (global.logger) {
          global.logger.error('Map image generation failed', {
            postId: post.id,
            userId: userID,
            error: imageError.message,
          });
        }
      }
    }

    // Award 10 points for creating a post
    await awardPoints(userID, 10);

    // Invalidate feed caches
    await cache.delPattern(`feed:*`);
    await cache.delPattern(`posts:user:${userID}:*`);

    console.log(`[CREATE_POST] Successfully created post ${post.id}`);
    return res.status(201).json({
      id: post.id,
      message: 'Post created successfully!',
      post
    });
  } catch (error) {
    console.error(`[CREATE_POST] Error:`, error);
    return res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};

// Get single post by ID (with caching)
const getPost = async (req, res) => {
  const postID = req.query.id || req.query.postId;

  if (!postID) {
    return res.status(400).json({ message: 'Post ID is required' });
  }

  console.log(`[GET_POST] Fetching post ${postID}`);

  try {
    // Try cache first
    const cacheKey = `post:${postID}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const post = await db.post.findUnique({
      where: { id: postID },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add counts to main object
    const postWithCounts = {
      ...post,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
    };
    delete postWithCounts._count;

    // Cache for 30 minutes
    await cache.set(cacheKey, postWithCounts, 1800);

    console.log(`[GET_POST] Successfully fetched post ${postID}`);
    return res.json(postWithCounts);
  } catch (error) {
    console.error(`[GET_POST] Error:`, error);
    return res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
};

// Update post
const updatePost = async (req, res) => {
  const postID = req.query.id || req.query.postId;
  const { title, description, imageUrl } = req.body;

  if (!postID) {
    return res.status(400).json({ message: 'Post ID is required' });
  }

  console.log(`[UPDATE_POST] Updating post ${postID}`);

  try {
    // Check if post exists and user owns it (should be done by middleware)
    const post = await db.post.update({
      where: { id: postID },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    // Invalidate cache
    await cache.del(`post:${postID}`);
    await cache.delPattern(`feed:*`);

    console.log(`[UPDATE_POST] Successfully updated post ${postID}`);
    return res.json({ message: 'Post updated successfully!', post });
  } catch (error) {
    console.error(`[UPDATE_POST] Error:`, error);
    return res.status(500).json({ message: 'Error updating post', error: error.message });
  }
};

// Delete post
const deletePost = async (req, res) => {
  const postID = req.query.id || req.query.postId;

  if (!postID) {
    return res.status(400).json({ message: 'Post ID is required' });
  }

  console.log(`[DELETE_POST] Deleting post ${postID}`);

  try {
    // Prisma will cascade delete likes, comments, shares automatically
    await db.post.delete({
      where: { id: postID }
    });

    // Invalidate caches
    await cache.del(`post:${postID}`);
    await cache.delPattern(`feed:*`);

    console.log(`[DELETE_POST] Successfully deleted post ${postID}`);
    return res.json({ message: 'Post deleted successfully!' });
  } catch (error) {
    console.error(`[DELETE_POST] Error:`, error);
    return res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
};

// Get all posts (with pagination)
// Filters out posts from users with private profiles or private posts
const getAllPosts = async (req, res) => {
  const { page = 1, limit = 20, cursor } = req.query;

  console.log(`[GET_ALL_POSTS] Fetching posts (page: ${page})`);

  try {
    const take = parseInt(limit);

    const posts = await db.post.findMany({
      where: {
        user: {
          isProfilePrivate: false,
          isPostPrivate: false,
        }
      },
      take: take + 1, // Fetch one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1 // Skip the cursor itself
      }),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const hasMore = posts.length > take;
    const postsToReturn = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1].id : null;

    // Map to include counts
    const postsWithCounts = postsToReturn.map(post => ({
      ...post,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
      _count: undefined,
    }));

    return res.json({
      posts: postsWithCounts,
      pagination: {
        hasMore,
        nextCursor,
      }
    });
  } catch (error) {
    console.error(`[GET_ALL_POSTS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// Get user's posts (with pagination)
const getUserPosts = async (req, res) => {
  const { userID } = req.params;
  const { page = 1, limit = 20, cursor } = req.query;

  console.log(`[GET_USER_POSTS] Fetching posts for user ${userID}`);

  try {
    // Try cache first
    const cacheKey = `posts:user:${userID}:${cursor || page}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const take = parseInt(limit);

    const posts = await db.post.findMany({
      where: { userId: userID },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const hasMore = posts.length > take;
    const postsToReturn = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1].id : null;

    const postsWithCounts = postsToReturn.map(post => ({
      ...post,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
      _count: undefined,
    }));

    const result = {
      posts: postsWithCounts,
      pagination: {
        hasMore,
        nextCursor,
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return res.json(result);
  } catch (error) {
    console.error(`[GET_USER_POSTS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching user posts', error: error.message });
  }
};

// Update interaction count (INTERNAL USE - requires service key)
const updateInteractionCount = async (req, res) => {
  const { id: postID } = req.params;
  const { likeCount, commentCount, shareCount, field, increment } = req.body;

  // Verify service key
  const serviceKey = req.headers['x-service-key'];
  if (serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: 'Forbidden: Service key required' });
  }

  try {
    let updateData = {};

    // Support both absolute values and increment format
    if (field && increment !== undefined) {
      // Increment format: { field: 'likeCount', increment: 1 }
      const validFields = ['likeCount', 'commentCount', 'shareCount'];
      if (!validFields.includes(field)) {
        return res.status(400).json({ message: 'Invalid field' });
      }
      updateData[field] = { increment: increment };
    } else {
      // Absolute value format: { likeCount: 5 }
      if (likeCount !== undefined) updateData.likeCount = likeCount;
      if (commentCount !== undefined) updateData.commentCount = commentCount;
      if (shareCount !== undefined) updateData.shareCount = shareCount;
    }

    const post = await db.post.update({
      where: { id: postID },
      data: updateData
    });

    // Invalidate cache
    await cache.del(`post:${postID}`);

    return res.json({ message: 'Counts updated', post });
  } catch (error) {
    console.error(`[UPDATE_COUNT] Error:`, error);
    return res.status(500).json({ message: 'Error updating counts', error: error.message });
  }
};

module.exports = {
  createPost,
  getPost,
  updatePost,
  deletePost,
  getAllPosts,
  getUserPosts,
  updateInteractionCount,
};
