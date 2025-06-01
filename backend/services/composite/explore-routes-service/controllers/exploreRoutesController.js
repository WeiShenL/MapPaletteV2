const axios = require('axios');

// Service URLs 
const POST_SERVICE_URL = process.env.POST_SERVICE_URL 
const USER_SERVICE_URL = process.env.USER_SERVICE_URL 
const INTERACTION_SERVICE_URL = process.env.INTERACTION_SERVICE_URL

// Helper function to fetch user data for posts
const enrichPostsWithUserData = async (posts) => {
  try {
    // Get unique user IDs
    const userIds = [...new Set(posts.map(post => post.userID))];
    
    // Fetch user data in parallel
    const userPromises = userIds.map(userId => 
      axios.get(`${USER_SERVICE_URL}/api/users/${userId}`)
        .then(response => ({ userId, userData: response.data }))
        .catch(error => {
          console.error(`Error fetching user ${userId}:`, error.message);
          return { userId, userData: null };
        })
    );
    
    const userResults = await Promise.all(userPromises);
    
    // Create user map
    const userMap = {};
    userResults.forEach(({ userId, userData }) => {
      if (userData) {
        userMap[userId] = userData;
      }
    });
    
    // Enrich posts with user data
    return posts.map(post => ({
      ...post,
      username: userMap[post.userID]?.username || 'Unknown User',
      userAvatar: userMap[post.userID]?.profilePicture || null
    }));
  } catch (error) {
    console.error('Error enriching posts with user data:', error);
    // Return posts without enrichment if there's an error
    return posts;
  }
};

// Helper function to enrich posts with interactions from interaction service
const enrichPostsWithInteractions = async (posts, currentUserId = null) => {
  try {
    const enrichPromises = posts.map(async (post) => {
      const postId = post.postID || post.id;
      
      // Initialize default interactions
      let interactions = {
        likes: { count: 0, likes: [] },
        comments: { count: 0, comments: [] },
        shares: { count: 0, shares: [] }
      };
      
      try {
        // Fetch all interactions in parallel from interaction service
        const [likesResponse, commentsResponse, sharesResponse] = await Promise.all([
          axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/likes/post/${postId}`),
          axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/comments/post/${postId}`),
          axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/shares/post/${postId}`)
        ]);
        
        interactions.likes = likesResponse.data;
        interactions.comments = commentsResponse.data;
        interactions.shares = sharesResponse.data;
      } catch (error) {
        console.error(`Error fetching interactions for post ${postId}:`, error.message);
      }
      
      // Check if current user has liked the post
      const isLiked = currentUserId && interactions.likes.likes 
        ? interactions.likes.likes.some(like => like.userId === currentUserId) 
        : false;
      
      return {
        ...post,
        likeCount: interactions.likes.count || 0,
        commentCount: interactions.comments.count || 0,
        shareCount: interactions.shares.count || 0,
        likedBy: interactions.likes.likes ? interactions.likes.likes.map(like => like.userId) : [],
        commentsList: interactions.comments.comments || [],
        isLiked: isLiked
      };
    });
    
    return await Promise.all(enrichPromises);
  } catch (error) {
    console.error('Error enriching posts with interactions:', error);
    return posts;
  }
};

// Get all routes with pagination
const getAllRoutes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 8, 
      sortBy = 'popularity',
      search = '',
      userId = null
    } = req.query;
    
    console.log(`[GET_ALL_ROUTES] Fetching routes - page: ${page}, limit: ${limit}, sortBy: ${sortBy}, search: ${search}`);
    
    // Fetch all posts from post service
    const postsResponse = await axios.get(`${POST_SERVICE_URL}/api/allposts`);
    let posts = postsResponse.data;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort posts
    switch (sortBy) {
      case 'shortest':
        posts.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'longest':
        posts.sort((a, b) => (b.distance || 0) - (a.distance || 0));
        break;
      case 'popularity':
      case 'most-popular':
        posts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
      case 'least-popular':
        posts.sort((a, b) => (a.likeCount || 0) - (b.likeCount || 0));
        break;
      case 'newest':
        posts.sort((a, b) => {
          const dateA = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(b.createdAt);
          const dateB = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(a.createdAt);
          return dateA - dateB;
        });
        break;
      case 'oldest':
        posts.sort((a, b) => {
          const dateA = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(a.createdAt);
          const dateB = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(b.createdAt);
          return dateA - dateB;
        });
        break;
      default:
        // Default to most popular
        posts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = posts.slice(startIndex, endIndex);
    
    // Enrich posts with user data
    console.log(`[GET_ALL_ROUTES] Enriching ${paginatedPosts.length} posts with user data`);
    let enrichedPosts = await enrichPostsWithUserData(paginatedPosts);
    
    // Enrich posts with interactions (likes, comments, shares) from interaction service
    console.log(`[GET_ALL_ROUTES] Enriching posts with interactions`);
    enrichedPosts = await enrichPostsWithInteractions(enrichedPosts, userId);
    
    // Format posts for frontend
    const formattedPosts = enrichedPosts.map(post => ({
      ...post,
      modalId: `modal-${post.postID}`,
      timeSince: calculateTimeSince(post.createdAt)
    }));
    
    console.log(`[GET_ALL_ROUTES] Returning ${formattedPosts.length} routes out of ${posts.length} total`);
    res.json({
      posts: formattedPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(posts.length / limit),
        totalPosts: posts.length,
        postsPerPage: parseInt(limit),
        hasMore: endIndex < posts.length
      }
    });
  } catch (error) {
    console.error('[GET_ALL_ROUTES] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch routes',
      message: error.message 
    });
  }
};

// Get a single route by ID
const getRouteById = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;
    
    console.log(`[GET_ROUTE] Fetching route ${postId} for user ${userId || 'anonymous'}`);
    
    // Fetch post from post service
    const postResponse = await axios.get(`${POST_SERVICE_URL}/api/posts?id=${postId}`);
    let post = postResponse.data;
    
    // Enrich with user data
    let enrichedPosts = await enrichPostsWithUserData([post]);
    
    // Enrich with interactions from interaction service
    enrichedPosts = await enrichPostsWithInteractions(enrichedPosts, userId);
    
    let enrichedPost = enrichedPosts[0];
    
    // Format post
    const formattedPost = {
      ...enrichedPost,
      modalId: `modal-${enrichedPost.postID}`,
      timeSince: calculateTimeSince(enrichedPost.createdAt)
    };
    
    console.log(`[GET_ROUTE] Successfully returned route ${postId}`);
    res.json(formattedPost);
  } catch (error) {
    console.error(`[GET_ROUTE] Error fetching route ${req.params.postId}:`, error);
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: 'Route not found' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch route',
        message: error.message 
      });
    }
  }
};

// Helper function to calculate time since
const calculateTimeSince = (timestamp) => {
  if (!timestamp) return 'Just Now';
  
  let date;
  if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return count === 1 ? `1 ${interval.label} ago` : `${count} ${interval.label}s ago`;
    }
  }
  
  return 'Just Now';
};

module.exports = {
  getAllRoutes,
  getRouteById
};