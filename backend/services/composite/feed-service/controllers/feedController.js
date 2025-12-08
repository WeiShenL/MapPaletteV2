const { db } = require('/app/shared/utils/db');
const { cache } = require('/app/shared/utils/redis');

// Get user's personalized feed (OPTIMIZED with single query!)
const getUserFeed = async (req, res) => {
  const { userId } = req.params;
  const { cursor, limit = 20 } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  console.log(`[GET_USER_FEED] Fetching feed for user ${userId}`);

  try {
    // Try cache first
    const cacheKey = `feed:${userId}:${cursor || 'start'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`[GET_USER_FEED] Cache hit for user ${userId}`);
      return res.json(cached);
    }

    const take = parseInt(limit);

    // SINGLE OPTIMIZED QUERY instead of N queries!
    // This fetches posts from users that current user follows
    const posts = await db.post.findMany({
      where: {
        OR: [
          // Posts from users current user follows
          {
            user: {
              followers: {
                some: {
                  followerId: userId
                }
              }
            }
          },
          // User's own posts
          {
            userId: userId
          }
        ]
      },
      take: take + 1, // Fetch one extra to check if there's more
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

    // Check if current user liked these posts (batch query)
    let likedPostIds = new Set();
    if (postsToReturn.length > 0) {
      const likes = await db.like.findMany({
        where: {
          userId,
          postId: { in: postsToReturn.map(p => p.id) }
        },
        select: { postId: true }
      });
      likedPostIds = new Set(likes.map(l => l.postId));
    }

    // Format response
    const enrichedPosts = postsToReturn.map(post => ({
      id: post.id,
      userId: post.userId,
      title: post.title,
      description: post.description,
      waypoints: post.waypoints,
      color: post.color,
      region: post.region,
      distance: post.distance,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      user: post.user,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
      isLiked: likedPostIds.has(post.id),
    }));

    const result = {
      posts: enrichedPosts,
      pagination: {
        hasMore,
        nextCursor,
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    console.log(`[GET_USER_FEED] Returned ${enrichedPosts.length} posts for user ${userId}`);
    return res.json(result);
  } catch (error) {
    console.error(`[GET_USER_FEED] Error:`, error);
    return res.status(500).json({ message: 'Error fetching feed', error: error.message });
  }
};

// Get trending/explore posts (public feed)
const getTrendingPosts = async (req, res) => {
  const { cursor, limit = 20 } = req.query;

  console.log(`[GET_TRENDING] Fetching trending posts`);

  try {
    // Try cache
    const cacheKey = `trending:${cursor || 'start'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const take = parseInt(limit);

    // Get posts ordered by like count (trending)
    // Filter out posts from users with private profiles or private posts
    const posts = await db.post.findMany({
      where: {
        user: {
          isProfilePrivate: false,
          isPostPrivate: false,
        }
      },
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
      orderBy: [
        { likeCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const hasMore = posts.length > take;
    const postsToReturn = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1].id : null;

    const enrichedPosts = postsToReturn.map(post => ({
      id: post.id,
      userId: post.userId,
      title: post.title,
      description: post.description,
      waypoints: post.waypoints,
      color: post.color,
      region: post.region,
      distance: post.distance,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      user: post.user,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
    }));

    const result = {
      posts: enrichedPosts,
      pagination: {
        hasMore,
        nextCursor,
      }
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, result, 900);

    return res.json(result);
  } catch (error) {
    console.error(`[GET_TRENDING] Error:`, error);
    return res.status(500).json({ message: 'Error fetching trending posts', error: error.message });
  }
};

// Get recent posts (all posts, newest first)
const getRecentPosts = async (req, res) => {
  const { cursor, limit = 20, region } = req.query;

  console.log(`[GET_RECENT] Fetching recent posts`);

  try {
    const cacheKey = `recent:${region || 'all'}:${cursor || 'start'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const take = parseInt(limit);

    // Filter out posts from users with private profiles or private posts
    const posts = await db.post.findMany({
      where: {
        ...(region ? { region } : {}),
        user: {
          isProfilePrivate: false,
          isPostPrivate: false,
        }
      },
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

    const enrichedPosts = postsToReturn.map(post => ({
      id: post.id,
      userId: post.userId,
      title: post.title,
      description: post.description,
      waypoints: post.waypoints,
      color: post.color,
      region: post.region,
      distance: post.distance,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      user: post.user,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
    }));

    const result = {
      posts: enrichedPosts,
      pagination: {
        hasMore,
        nextCursor,
      }
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, result, 600);

    return res.json(result);
  } catch (error) {
    console.error(`[GET_RECENT] Error:`, error);
    return res.status(500).json({ message: 'Error fetching recent posts', error: error.message });
  }
};

// Search posts by region or keyword
const searchPosts = async (req, res) => {
  const { q, region, cursor, limit = 20 } = req.query;

  if (!q && !region) {
    return res.status(400).json({ message: 'Search query or region required' });
  }

  console.log(`[SEARCH_POSTS] Searching for: ${q || region}`);

  try {
    const take = parseInt(limit);

    // Filter out posts from users with private profiles or private posts
    const posts = await db.post.findMany({
      where: {
        AND: [
          region ? { region } : {},
          q ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          } : {},
          {
            user: {
              isProfilePrivate: false,
              isPostPrivate: false,
            }
          }
        ]
      },
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

    const enrichedPosts = postsToReturn.map(post => ({
      id: post.id,
      userId: post.userId,
      title: post.title,
      description: post.description,
      waypoints: post.waypoints,
      color: post.color,
      region: post.region,
      distance: post.distance,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      user: post.user,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
    }));

    return res.json({
      posts: enrichedPosts,
      pagination: {
        hasMore,
        nextCursor,
      }
    });
  } catch (error) {
    console.error(`[SEARCH_POSTS] Error:`, error);
    return res.status(500).json({ message: 'Error searching posts', error: error.message });
  }
};

// Get all posts (discovery/explore feed)
const getAllPosts = async (req, res) => {
  const { cursor, limit = 20 } = req.query;
  const userId = req.user?.id || req.query?.userId;

  console.log(`[GET_ALL_POSTS] Fetching all posts`);

  try {
    const cacheKey = `all:${cursor || 'start'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const take = parseInt(limit);

    // Get all public posts
    const posts = await db.post.findMany({
      where: {
        user: {
          isProfilePrivate: false,
          isPostPrivate: false,
        }
      },
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

    // Check if current user liked these posts (batch query)
    let likedPostIds = new Set();
    if (userId && postsToReturn.length > 0) {
      const likes = await db.like.findMany({
        where: {
          userId,
          postId: { in: postsToReturn.map(p => p.id) }
        },
        select: { postId: true }
      });
      likedPostIds = new Set(likes.map(l => l.postId));
    }

    const enrichedPosts = postsToReturn.map(post => ({
      id: post.id,
      userId: post.userId,
      title: post.title,
      description: post.description,
      waypoints: post.waypoints,
      color: post.color,
      region: post.region,
      distance: post.distance,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      user: post.user,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
      isLiked: likedPostIds.has(post.id),
    }));

    const result = {
      posts: enrichedPosts,
      pagination: {
        hasMore,
        nextCursor,
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return res.json(result);
  } catch (error) {
    console.error(`[GET_ALL_POSTS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// Get single post details
const getPostDetails = async (req, res) => {
  const postId = req.params.postId || req.params.id;
  const userId = req.user?.id || req.query?.userId;

  console.log(`[GET_POST_DETAILS] Fetching post ${postId}`);

  if (!postId) {
    return res.status(400).json({ message: 'Post ID is required' });
  }

  try {
    // Get post with all details
    const post = await db.post.findUnique({
      where: { id: postId },
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

    // Check if current user liked this post
    let isLiked = false;
    if (userId) {
      const like = await db.like.findFirst({
        where: {
          userId,
          postId
        }
      });
      isLiked = !!like;
    }

    const enrichedPost = {
      id: post.id,
      userId: post.userId,
      title: post.title,
      description: post.description,
      waypoints: post.waypoints,
      color: post.color,
      region: post.region,
      distance: post.distance,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      user: post.user,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      shareCount: post._count.shares,
      isLiked,
    };

    return res.json({ post: enrichedPost });
  } catch (error) {
    console.error(`[GET_POST_DETAILS] Error:`, error);
    return res.status(500).json({ message: 'Error fetching post details', error: error.message });
  }
};

module.exports = {
  getUserFeed,
  getTrendingPosts,
  getRecentPosts,
  searchPosts,
  getAllPosts,
  getPostDetails,
};
