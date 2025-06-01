const axios = require('axios');

// Service URLs - these should come from environment variables
const POST_SERVICE_URL = process.env.POST_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const INTERACTION_SERVICE_URL = process.env.INTERACTION_SERVICE_URL || 'http://localhost:3003';
const FOLLOW_SERVICE_URL = process.env.FOLLOW_SERVICE_URL || 'http://localhost:3007';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp) => {
  if (!timestamp) return new Date();
  
  // Handle Firestore timestamp object
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000);
  }
  
  // Handle regular date string or Date object
  return new Date(timestamp);
};

// Get user's personalized feed
exports.getUserFeed = async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  console.log(`[GET_USER_FEED] Fetching feed for user ${userId}`);
  
  try {
    // Step 1: Get user's following list from follow-service
    let followedUserIds = [];
    try {
      const followingResponse = await axios.get(`${FOLLOW_SERVICE_URL}/api/follow/following/${userId}`);
      // The follow-service returns { following: [...userIds], count: n }
      if (followingResponse.data && followingResponse.data.following && Array.isArray(followingResponse.data.following)) {
        followedUserIds = followingResponse.data.following;
      }
      console.log(`[GET_USER_FEED] User ${userId} is following ${followedUserIds.length} users`);
    } catch (error) {
      console.log(`[GET_USER_FEED] No following found for user ${userId}, showing own posts only`);
    }
    
    // Include the user's own posts
    followedUserIds.push(userId);
    
    // Step 2: Get posts from followed users (simplified - in production, use pagination)
    const postPromises = followedUserIds.map(async (followedUserId) => {
      try {
        const response = await axios.get(`${POST_SERVICE_URL}/api/users/${followedUserId}/posts`);
        return response.data;
      } catch (error) {
        console.log(`Failed to get posts for user ${followedUserId}`);
        return [];
      }
    });
    
    const postsArrays = await Promise.all(postPromises);
    const allPosts = postsArrays.flat();
    
    // Step 3: Sort posts by creation date (latest first)
    allPosts.sort((a, b) => {
      const dateA = convertTimestamp(a.createdAt);
      const dateB = convertTimestamp(b.createdAt);
      return dateB - dateA;
    });
    
    // Step 4: Take top N posts (pagination)
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const paginatedPosts = allPosts.slice(offset, offset + limit);
    
    // Step 5: Batch enrich posts with user data and interactions
    // Extract unique user IDs and post IDs
    const userIds = [...new Set(paginatedPosts.map(post => post.userID || post.userId))];
    const postIds = paginatedPosts.map(post => post.id || post.postID).filter(id => id);
    
    // Fetch all data in batch
    let userDataMap = {};
    let interactionsMap = {};
    
    try {
      // Batch fetch user data
      if (userIds.length > 0) {
        const userBatchResponse = await axios.post(`${USER_SERVICE_URL}/api/users/batch`, { userIds });
        userDataMap = userBatchResponse.data;
      }
      
      // Batch fetch interactions
      if (postIds.length > 0) {
        const interactionsBatchResponse = await axios.post(`${INTERACTION_SERVICE_URL}/api/interactions/batch`, {
          entityIds: postIds,
          entityType: 'post',
          userId: userId
        });
        interactionsMap = interactionsBatchResponse.data;
      }
    } catch (batchError) {
      console.error('Batch fetch error:', batchError.message);
      // Fall back to empty maps if batch fails
    }
    
    // Map the enriched data
    const enrichedPosts = paginatedPosts.map(post => {
      const postUserId = post.userID || post.userId;
      const postId = post.id || post.postID;
      
      // Get user data from batch result
      const userData = userDataMap[postUserId] || {
        username: 'Unknown User',
        profilePicture: '/default-profile.png'
      };
      
      // Get interactions from batch result
      const interactions = interactionsMap[postId] || {
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isLiked: false,
        comments: [],
        likes: []
      };
      
      return {
        id: postId,
        title: post.title,
        description: post.description,
        userId: postUserId,
        username: userData.username || 'Unknown User',
        profilePicture: userData.profilePicture || '/default-profile.png',
        image: post.image,
        distance: post.distance,
        region: post.region,
        waypoints: post.waypoints,
        createdAt: post.createdAt,
        likeCount: interactions.likeCount || 0,
        commentCount: interactions.commentCount || 0,
        shareCount: interactions.shareCount || 0,
        likedBy: interactions.likes ? interactions.likes.map(like => like.userId) : [],
        commentsList: interactions.comments || [],
        isLiked: interactions.isLiked || false
      };
    });
    
    console.log(`[GET_USER_FEED] Returning ${enrichedPosts.length} posts for user ${userId}`);
    return res.status(200).json({
      posts: enrichedPosts,
      pagination: {
        offset: offset,
        limit: limit,
        total: allPosts.length,
        hasMore: offset + limit < allPosts.length
      }
    });
    
  } catch (error) {
    console.error(`[GET_USER_FEED] Error fetching feed for user ${userId}:`, error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    return res.status(500).json({ 
      message: 'Error fetching feed', 
      error: error.message,
      details: error.response?.data 
    });
  }
};

// Get all posts (for discovery/explore)
exports.getAllPosts = async (req, res) => {
  const { userId } = req.query; // Current user for privacy checks
  
  console.log(`[GET_ALL_POSTS] Fetching all posts (viewer: ${userId || 'anonymous'})`);
  
  try {
    // Step 1: Get all posts
    const postsResponse = await axios.get(`${POST_SERVICE_URL}/api/allposts`);
    const allPosts = postsResponse.data;
    
    // Step 2: Get all unique user IDs from posts
    const allUserIds = [...new Set(allPosts.map(post => post.userID || post.userId))];
    
    // Batch fetch all user data
    let userDataMap = {};
    if (allUserIds.length > 0) {
      try {
        const userBatchResponse = await axios.post(`${USER_SERVICE_URL}/api/users/batch`, { userIds: allUserIds });
        userDataMap = userBatchResponse.data;
      } catch (error) {
        console.error('Error fetching user batch data:', error.message);
      }
    }
    
    // Step 3: Filter based on privacy settings
    const visiblePosts = [];
    for (const post of allPosts) {
      const postUserId = post.userID || post.userId;
      const postCreator = userDataMap[postUserId] || { 
        username: 'Unknown User', 
        profilePicture: '/default-profile.png',
        isPostPrivate: false 
      };
      
      // If posts are private and user is not the creator, skip
      if (postCreator.isPostPrivate && postUserId !== userId) {
        continue;
      }
      
      visiblePosts.push({ post, creator: postCreator });
    }
    
    // Step 4: Batch fetch all interactions
    const postIds = visiblePosts.map(({ post }) => post.id || post.postID).filter(id => id);
    let interactionsMap = {};
    
    if (postIds.length > 0) {
      try {
        const interactionsBatchResponse = await axios.post(`${INTERACTION_SERVICE_URL}/api/interactions/batch`, {
          entityIds: postIds,
          entityType: 'post',
          userId: userId
        });
        interactionsMap = interactionsBatchResponse.data;
      } catch (error) {
        console.error('Error fetching interactions batch:', error.message);
      }
    }
    
    // Step 5: Map enriched posts
    const enrichedPosts = visiblePosts.map(({ post, creator }) => {
      const postId = post.id || post.postID;
      
      // Get interactions from batch result
      const interactions = interactionsMap[postId] || {
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isLiked: false,
        comments: [],
        likes: []
      };
      
      return {
        id: postId,
        title: post.title,
        description: post.description,
        userId: post.userID || post.userId,
        username: creator.username,
        profilePicture: creator.profilePicture,
        image: post.image,
        distance: post.distance,
        region: post.region,
        waypoints: post.waypoints,
        createdAt: post.createdAt,
        likeCount: interactions.likeCount || 0,
        commentCount: interactions.commentCount || 0,
        shareCount: interactions.shareCount || 0,
        likedBy: interactions.likes ? interactions.likes.map(like => like.userId) : [],
        commentsList: interactions.comments || [],
        isLiked: interactions.isLiked || false
      };
    });
    
    // Step 6: Sort by creation date (latest first)
    enrichedPosts.sort((a, b) => {
      const dateA = convertTimestamp(a.createdAt);
      const dateB = convertTimestamp(b.createdAt);
      return dateB - dateA;
    });
    
    // Step 7: Apply pagination
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const paginatedPosts = enrichedPosts.slice(offset, offset + limit);
    
    console.log(`[GET_ALL_POSTS] Returning ${paginatedPosts.length} out of ${enrichedPosts.length} visible posts`);
    return res.status(200).json({
      posts: paginatedPosts,
      pagination: {
        offset: offset,
        limit: limit,
        total: enrichedPosts.length,
        hasMore: offset + limit < enrichedPosts.length
      }
    });
    
  } catch (error) {
    console.error('[GET_ALL_POSTS] Error fetching posts:', error);
    return res.status(500).json({ 
      message: 'Error fetching posts', 
      error: error.message 
    });
  }
};

// Get single post with full details
exports.getPostDetails = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.query; // Current user
  
  console.log(`[GET_POST_DETAILS] Fetching details for post ${postId} (viewer: ${userId || 'anonymous'})`);
  
  try {
    // Step 1: Get post data
    const postResponse = await axios.get(`${POST_SERVICE_URL}/api/posts?id=${postId}`);
    const post = postResponse.data;
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Step 2: Get creator data
    let creator = { username: 'Unknown User', profilePicture: '/default-profile.png' };
    try {
      const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${post.userID || post.userId}`);
      creator = userResponse.data;
    } catch (error) {
      console.log('Failed to get post creator data');
    }
    
    // Step 3: Get all interactions
    const [likesResponse, commentsResponse, sharesResponse] = await Promise.all([
      axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/likes/post/${postId}`),
      axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/comments/post/${postId}`),
      axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/shares/post/${postId}`)
    ]);
    
    // Step 4: Check user interaction status
    let userInteractionStatus = { hasLiked: false, hasShared: false };
    if (userId) {
      try {
        const statusResponse = await axios.get(
          `${INTERACTION_SERVICE_URL}/api/interactions/check/post/${postId}/${userId}`
        );
        userInteractionStatus = statusResponse.data;
      } catch (error) {
        console.log('Failed to get user interaction status');
      }
    }
    
    // Step 5: Return enriched post
    console.log(`[GET_POST_DETAILS] Successfully fetched details for post ${postId}`);
    return res.status(200).json({
      id: post.id || post.postID,
      title: post.title,
      description: post.description,
      userId: post.userID || post.userId,
      username: creator.username,
      profilePicture: creator.profilePicture,
      image: post.image,
      distance: post.distance,
      region: post.region,
      waypoints: post.waypoints,
      color: post.color,
      createdAt: post.createdAt,
      likeCount: likesResponse.data.count,
      commentCount: commentsResponse.data.count,
      shareCount: sharesResponse.data.count,
      likedBy: likesResponse.data.likes.map(like => like.userId),
      commentsList: commentsResponse.data.comments,
      shares: sharesResponse.data.shares,
      isLiked: userInteractionStatus.hasLiked,
      hasShared: userInteractionStatus.hasShared
    });
    
  } catch (error) {
    console.error(`[GET_POST_DETAILS] Error fetching post ${postId}:`, error);
    return res.status(500).json({ 
      message: 'Error fetching post details', 
      error: error.message 
    });
  }
};

// Get trending posts (simplified - returns random selection)
exports.getTrendingPosts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  console.log(`[GET_TRENDING] Fetching ${limit} trending posts`);
  
  try {
    // Get all posts - use /allposts endpoint
    const postsResponse = await axios.get(`${POST_SERVICE_URL}/api/allposts`);
    const allPosts = postsResponse.data;
    
    if (allPosts.length === 0) {
      return res.status(200).json([]);
    }
    
    // Shuffle array to get random posts
    const shuffled = [...allPosts].sort(() => 0.5 - Math.random());
    
    // Take the first N posts after shuffle
    const randomPosts = shuffled.slice(0, Math.min(limit, allPosts.length));
    
    // Return simplified post data for trending display
    const trendingPosts = randomPosts.map(post => ({
      id: post.id || post.postID,
      title: post.title || 'Untitled Route',
      username: post.username || 'Unknown User',
      image: post.image || '/default-route.png',
      distance: post.distance || '0',
      likeCount: post.likeCount || 0,
      shareCount: post.shareCount || 0
    }));
    
    console.log(`[GET_TRENDING] Returning ${trendingPosts.length} trending posts`);
    return res.status(200).json(trendingPosts);
    
  } catch (error) {
    console.error('[GET_TRENDING] Error fetching trending posts:', error);
    return res.status(500).json({ 
      message: 'Error fetching trending posts', 
      error: error.message 
    });
  }
};