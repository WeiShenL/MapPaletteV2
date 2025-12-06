const axios = require('axios');

// Service urls
const POST_SERVICE_BASE = process.env.POST_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_BASE = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const INTERACTION_SERVICE_BASE = process.env.INTERACTION_SERVICE_URL || 'http://localhost:3003';
const FOLLOW_SERVICE_BASE = process.env.FOLLOW_SERVICE_URL || 'http://localhost:3007';

// full service URLs with API paths
const POST_SERVICE_URL = `${POST_SERVICE_BASE}/api/posts`;
const USER_SERVICE_URL = `${USER_SERVICE_BASE}/api/users`;
const INTERACTION_SERVICE_URL = `${INTERACTION_SERVICE_BASE}/api/interactions`;
const FOLLOW_SERVICE_URL = `${FOLLOW_SERVICE_BASE}/api/follow`;

// Get complete profile data for a user
exports.getUserProfile = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id; // Extract from JWT token via optionalAuth middleware

  try {
    // Step 1: Get user details and posts in parallel
    let user, userPosts;
    
    try {
      const [userResponse, postsResponse] = await Promise.all([
        axios.get(`${USER_SERVICE_URL}/${userId}`),
        axios.get(`${POST_SERVICE_URL}/users/${userId}/posts`)
      ]);
      
      user = userResponse.data;
      // Handle both array response and object response with posts property
      const postsData = postsResponse.data;
      userPosts = Array.isArray(postsData) ? postsData : (postsData.posts || []);
    } catch (error) {
      // If user not found, return a default profile or error
      if (error.response && error.response.status === 404) {
        // Check if this might be a Firebase Auth user without a Firestore document
        return res.status(404).json({ 
          message: 'User profile not found',
          userId: userId,
          details: 'This user may not have completed their profile setup'
        });
      }
      throw error; 
    }
    
    // Step 2: Get follow status (if viewing another user's profile)
    let followStatus = { isFollowing: false };

    if (currentUserId && currentUserId !== userId) {
      try {
        const followResponse = await axios.get(`${FOLLOW_SERVICE_URL}/check`, {
          params: { followerId: currentUserId, followingId: userId }
        });
        // Map 'following' from follow-service to 'isFollowing' for frontend
        followStatus = { isFollowing: followResponse.data.following || false };
      } catch (error) {
        console.error(`Failed to get follow status:`, error.message);
      }
    }
    
    // Step 3: Enrich posts with interaction data
    const enrichedPosts = await Promise.all(
      userPosts.map(async (post) => {
        // Get interaction data
        let interactions = {
          likes: { count: 0, likes: [] },
          comments: { count: 0, comments: [] },
          shares: { count: 0, shares: [] }
        };
        
        const postId = post.id || post.postID;
        if (postId) {
          try {
            const [likesResponse, commentsResponse, sharesResponse] = await Promise.all([
              axios.get(`${INTERACTION_SERVICE_URL}/likes/post/${postId}`),
              axios.get(`${INTERACTION_SERVICE_URL}/comments/post/${postId}`),
              axios.get(`${INTERACTION_SERVICE_URL}/shares/post/${postId}`)
            ]);
            
            interactions.likes = likesResponse.data;
            interactions.comments = commentsResponse.data;
            interactions.shares = sharesResponse.data;
          } catch (error) {
            console.error(`Failed to get interactions for post ${postId}`);
          }
        }
        
        // Check if current user has liked
        const hasLiked = currentUserId && interactions.likes.likes ? 
          interactions.likes.likes.some(like => like.userId === currentUserId) : false;
        
        // Get usernames for comments
        const enrichedComments = await Promise.all(
          (interactions.comments.comments || []).map(async (comment) => {
            try {
              const userResponse = await axios.get(`${USER_SERVICE_URL}/${comment.userId}`);
              return {
                ...comment,
                username: userResponse.data.username || 'Unknown User'
              };
            } catch (error) {
              return {
                ...comment,
                username: 'Unknown User'
              };
            }
          })
        );
        
        return {
          id: post.id || post.postID,
          title: post.title,
          description: post.description,
          userId: post.userID || post.userId,
          username: user.username,
          profilePicture: user.profilePicture,
          image: post.image,
          distance: post.distance,
          region: post.region,
          waypoints: post.waypoints,
          createdAt: post.createdAt,
          likeCount: interactions.likes.count || 0,
          commentCount: interactions.comments.count || 0,
          shareCount: interactions.shares.count || 0,
          likedBy: interactions.likes.likes ? interactions.likes.likes.map(like => like.userId) : [],
          commentsList: enrichedComments,
          isLiked: hasLiked
        };
      })
    );
    
    // Step 4: Calculate profile stats
    const totalDistance = userPosts.reduce((sum, post) => sum + (parseFloat(post.distance) || 0), 0);

    // Step 5: Return complete profile data
    return res.status(200).json({
      // User details
      user: {
        id: user.id || user.userID,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        birthday: user.birthday,
        followersCount: user.numFollowers || 0,
        followingCount: user.numFollowing || 0
      },
      
      // Profile stats
      stats: {
        routes: userPosts.length,
        following: user.numFollowing || 0,
        followers: user.numFollowers || 0,
        totalDistance: parseFloat(totalDistance.toFixed(1))
      },
      
      // Follow status (for current user)
      followStatus,
      
      // User's posts with full interaction data
      posts: enrichedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      
      // Simple routes data (for routes tab)
      routes: userPosts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(post => ({
          id: post.id || post.postID,
          title: post.title,
          distance: `${post.distance || 0} km`,
          image: post.image
        }))
    });

  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error.message);
    return res.status(500).json({
      message: 'Error fetching user profile',
      error: error.message,
      details: error.response?.data
    });
  }
};

// Get user's followers
exports.getUserFollowers = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id; // Extract from JWT token via optionalAuth middleware

  try {
    // Get user's followers list from user service
    const followersResponse = await axios.get(`${USER_SERVICE_URL}/followers/${userId}`);
    const followers = followersResponse.data || [];
    
    // Enrich follower data (followers already contains user objects)
    const enrichedFollowers = await Promise.all(
      followers.map(async (followerData) => {
        try {
          const followerId = followerData.userID || followerData.id;
          
          // Check if current user follows this follower
          let isFollowing = false;
          if (currentUserId) {
            try {
              const followResponse = await axios.get(`${FOLLOW_SERVICE_URL}/check`, {
                params: { followerUserId: currentUserId, followingUserId: followerId }
              });
              isFollowing = followResponse.data.isFollowing;
            } catch (error) {
              // Silently fail
            }
          }
          
          return {
            id: followerId,
            username: followerData.username,
            profilePicture: followerData.profilePicture,
            bio: followerData.bio,
            isFollowing: isFollowing
          };
        } catch (error) {
          return null;
        }
      })
    );
    
    // Filter out any null values
    const validFollowers = enrichedFollowers.filter(f => f !== null);

    return res.status(200).json({
      followers: validFollowers,
      count: validFollowers.length
    });

  } catch (error) {
    console.error(`Error fetching followers for user ${userId}:`, error.message);
    return res.status(500).json({
      message: 'Error fetching followers',
      error: error.message
    });
  }
};

// Get users that the user is following
exports.getUserFollowing = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id; // Extract from JWT token via optionalAuth middleware

  try {
    // Get user's following list from user service
    const followingResponse = await axios.get(`${USER_SERVICE_URL}/following/${userId}`);
    const following = followingResponse.data || [];
    
    // Enrich following data (following already contains user objects)
    const enrichedFollowing = await Promise.all(
      following.map(async (followingData) => {
        try {
          const followingId = followingData.userID || followingData.id;
          
          // Check if current user follows this user
          let isFollowing = false;
          if (currentUserId) {
            try {
              const followResponse = await axios.get(`${FOLLOW_SERVICE_URL}/check`, {
                params: { followerUserId: currentUserId, followingUserId: followingId }
              });
              isFollowing = followResponse.data.isFollowing;
            } catch (error) {
              // Silently fail
            }
          }
          
          return {
            id: followingId,
            username: followingData.username,
            profilePicture: followingData.profilePicture,
            bio: followingData.bio,
            isFollowing: isFollowing
          };
        } catch (error) {
          return null;
        }
      })
    );
    
    // Filter out any null values
    const validFollowing = enrichedFollowing.filter(f => f !== null);

    return res.status(200).json({
      following: validFollowing,
      count: validFollowing.length
    });

  } catch (error) {
    console.error(`Error fetching following for user ${userId}:`, error.message);
    return res.status(500).json({
      message: 'Error fetching following',
      error: error.message
    });
  }
};