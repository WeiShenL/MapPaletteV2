const axios = require('axios');

// Service urls
const USER_SERVICE_BASE = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const POST_SERVICE_BASE = process.env.POST_SERVICE_URL || 'http://localhost:3002';
const INTERACTION_SERVICE_BASE = process.env.INTERACTION_SERVICE_URL || 'http://localhost:3003';
const FOLLOW_SERVICE_BASE = process.env.FOLLOW_SERVICE_URL || 'http://localhost:3007';

// full service URLs with API paths
const USER_SERVICE_URL = `${USER_SERVICE_BASE}/api/users`;
const POST_SERVICE_URL = `${POST_SERVICE_BASE}/api/posts`;
const INTERACTION_SERVICE_URL = `${INTERACTION_SERVICE_BASE}/api/interactions`;
const FOLLOW_SERVICE_URL = `${FOLLOW_SERVICE_BASE}/api/follow`;

// Internal service key header for service-to-service calls
const getServiceHeaders = () => ({
  'x-service-key': process.env.INTERNAL_SERVICE_KEY
});

// Helper function to award points to user
async function updateUserPoints(userId, points) {
  try {
    await axios.put(
      `${USER_SERVICE_URL}/${userId}/points`,
      { pointsToAdd: points },
      { headers: { 'x-service-key': process.env.INTERNAL_SERVICE_KEY } }
    );
    console.log(`[POINTS] Successfully updated points for user ${userId}: ${points > 0 ? '+' : ''}${points}`);
  } catch (error) {
    console.error('Error updating user points:', error.message, error.response?.data);
    // Don't throw - points are nice to have but not critical
  }
}

// Like a post
exports.likePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ message: 'Post ID and user ID are required.' });
  }

  console.log(`[LIKE] User ${userId} liking post ${postId}`);

  try {
    // Step 1: Record the like in interaction service
    const interactionResponse = await axios.post(
      `${INTERACTION_SERVICE_URL}/like/post/${postId}`,
      { userId },
      { headers: getServiceHeaders() }
    );

    // Step 2: Get post details to find creator
    const postResponse = await axios.get(`${POST_SERVICE_URL}/posts?postId=${postId}`);
    const post = postResponse.data;

    // Step 3: Award points to content creator
    if (post.userId && post.userId !== userId) {
      await updateUserPoints(post.userId, 3);
    }

    // Step 4: Update post like count
    await axios.patch(`${POST_SERVICE_URL}/${postId}/count`, {
      field: 'likeCount',
      increment: 1
    }, { headers: getServiceHeaders() });

    console.log(`[LIKE] Successfully liked post ${postId} by user ${userId}`);
    return res.status(200).json({
      message: 'Post liked successfully!',
      interactionId: interactionResponse.data.interactionId
    });
  } catch (error) {
    // If interaction service returns 400, it means already liked
    if (error.response?.status === 400) {
      console.log(`[LIKE] User ${userId} already liked post ${postId}`);
      return res.status(400).json({ message: error.response.data.message });
    }
    console.error(`[LIKE] Error liking post ${postId} by user ${userId}:`, error.message);
    return res.status(500).json({ message: 'Failed to like post' });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ message: 'Post ID and user ID are required.' });
  }

  console.log(`[UNLIKE] User ${userId} unliking post ${postId}`);

  try {
    // Step 1: Remove the like from interaction service
    await axios.delete(
      `${INTERACTION_SERVICE_URL}/unlike/post/${postId}`,
      { data: { userId }, headers: getServiceHeaders() }
    );

    // Step 2: Get post details to find creator
    const postResponse = await axios.get(`${POST_SERVICE_URL}/posts?postId=${postId}`);
    const post = postResponse.data;

    // Step 3: Remove points from content creator
    if (post.userId && post.userId !== userId) {
      await updateUserPoints(post.userId, -3);
    }

    // Step 4: Update post like count
    await axios.patch(`${POST_SERVICE_URL}/${postId}/count`, {
      field: 'likeCount',
      increment: -1
    }, { headers: getServiceHeaders() });

    console.log(`[UNLIKE] Successfully unliked post ${postId} by user ${userId}`);
    return res.status(200).json({ message: 'Post unliked successfully!' });
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`[UNLIKE] User ${userId} has not liked post ${postId}`);
      return res.status(400).json({ message: error.response.data.message });
    }
    console.error(`[UNLIKE] Error unliking post ${postId} by user ${userId}:`, error.message);
    return res.status(500).json({ message: 'Failed to unlike post' });
  }
};

// Share a post
exports.sharePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ message: 'Post ID and user ID are required.' });
  }

  console.log(`[SHARE] User ${userId} sharing post ${postId}`);

  try {
    // Step 1: Record the share in interaction service
    const interactionResponse = await axios.post(
      `${INTERACTION_SERVICE_URL}/share/post/${postId}`,
      { userId },
      { headers: getServiceHeaders() }
    );

    // Step 2: Get post details to find creator
    const postResponse = await axios.get(`${POST_SERVICE_URL}/posts?postId=${postId}`);
    const post = postResponse.data;

    // Step 3: Award points to content creator
    if (post.userId && post.userId !== userId) {
      await updateUserPoints(post.userId, 2);
    }

    // Step 4: Update post share count
    await axios.patch(`${POST_SERVICE_URL}/${postId}/count`, {
      field: 'shareCount',
      increment: 1
    }, { headers: getServiceHeaders() });

    console.log(`[SHARE] Successfully shared post ${postId} by user ${userId}`);
    return res.status(200).json({
      message: 'Post shared successfully!',
      interactionId: interactionResponse.data.interactionId
    });
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`[SHARE] User ${userId} already shared post ${postId}`);
      return res.status(400).json({ message: error.response.data.message });
    }
    console.error(`[SHARE] Error sharing post ${postId} by user ${userId}:`, error.message);
    return res.status(500).json({ message: 'Failed to share post' });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { userId, content, username } = req.body;

  if (!postId || !userId || !content) {
    return res.status(400).json({ 
      message: 'Post ID, user ID, and content are required.' 
    });
  }

  console.log(`[COMMENT] User ${userId} adding comment to post ${postId}`);

  try {
    // Step 1: Add comment via interaction service
    const interactionResponse = await axios.post(
      `${INTERACTION_SERVICE_URL}/comment/post/${postId}`,
      { userId, content, username },
      { headers: getServiceHeaders() }
    );

    // Step 2: Get post details to find creator
    const postResponse = await axios.get(`${POST_SERVICE_URL}/posts?postId=${postId}`);
    const post = postResponse.data;

    // Step 3: Award points to content creator (if not commenting on own post)
    if (post.userId && post.userId !== userId) {
      await updateUserPoints(post.userId, 1);
    }

    // Step 4: Update post comment count
    await axios.patch(`${POST_SERVICE_URL}/${postId}/count`, {
      field: 'commentCount',
      increment: 1
    }, { headers: getServiceHeaders() });

    console.log(`[COMMENT] Successfully added comment to post ${postId} by user ${userId}`);
    // The interaction service returns { comment: { id, ... } }, extract the id
    const commentData = interactionResponse.data.comment;
    return res.status(201).json({
      message: 'Comment added successfully!',
      commentId: commentData?.id,
      comment: commentData
    });
  } catch (error) {
    console.error(`[COMMENT] Error adding comment to post ${postId} by user ${userId}:`, error.message);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (!commentId || !userId) {
    return res.status(400).json({ message: 'Comment ID and user ID are required.' });
  }

  console.log(`[DELETE_COMMENT] User ${userId} deleting comment ${commentId}`);

  try {
    // Step 1: Get comment details before deletion
    const commentResponse = await axios.get(
      `${INTERACTION_SERVICE_URL}/comment/${commentId}`,
      { headers: getServiceHeaders() }
    );
    const comment = commentResponse.data;

    // Step 2: Delete comment via interaction service
    await axios.delete(
      `${INTERACTION_SERVICE_URL}/comment/${commentId}`,
      { data: { userId }, headers: getServiceHeaders() }
    );

    // Step 3: Update post comment count
    if (comment.entityType === 'post') {
      await axios.patch(`${POST_SERVICE_URL}/${comment.entityId}/count`, {
        field: 'commentCount',
        increment: -1
      }, { headers: getServiceHeaders() });
    }

    console.log(`[DELETE_COMMENT] Successfully deleted comment ${commentId}`);
    return res.status(200).json({ message: 'Comment deleted successfully!' });
  } catch (error) {
    if (error.response?.status === 403) {
      console.log(`[DELETE_COMMENT] User ${userId} unauthorized to delete comment ${commentId}`);
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }
    if (error.response?.status === 404) {
      console.log(`[DELETE_COMMENT] Comment ${commentId} not found`);
      return res.status(404).json({ message: 'Comment not found' });
    }
    console.error(`[DELETE_COMMENT] Error deleting comment ${commentId} by user ${userId}:`, error.message);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
};

// Get interaction details for a post (likes, comments, shares)
exports.getPostInteractions = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.query; 

  console.log(`[GET_INTERACTIONS] Fetching interactions for post ${postId} (user: ${userId})`);

  try {
    // Fetch all interaction data in parallel
    console.log(`[GET_INTERACTIONS] Calling interaction service...`);
    const [likesResponse, commentsResponse, sharesResponse, userInteractionResponse] = await Promise.all([
      axios.get(`${INTERACTION_SERVICE_URL}/likes/post/${postId}`),
      axios.get(`${INTERACTION_SERVICE_URL}/comments/post/${postId}`),
      axios.get(`${INTERACTION_SERVICE_URL}/shares/post/${postId}`),
      userId ? axios.get(`${INTERACTION_SERVICE_URL}/check/post/${postId}/${userId}`) : null
    ]);

    console.log(`[GET_INTERACTIONS] Received comments: ${commentsResponse.data?.length || 0}`);

    const response = {
      likes: likesResponse.data,
      comments: commentsResponse.data,
      shares: sharesResponse.data
    };

    if (userInteractionResponse) {
      response.userInteraction = userInteractionResponse.data;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching post interactions:', error.message);
    return res.status(500).json({ message: 'Failed to fetch post interactions' });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  const { targetUserId } = req.params;
  const { userId } = req.body;

  if (!targetUserId || !userId) {
    return res.status(400).json({ message: 'Target user ID and user ID are required.' });
  }

  if (targetUserId === userId) {
    return res.status(400).json({ message: 'Cannot follow yourself.' });
  }

  console.log(`[FOLLOW] User ${userId} following user ${targetUserId}`);

  try {
    // Step 1: Create follow relationship in follow service
    const followResponse = await axios.post(`${FOLLOW_SERVICE_URL}/follow`, {
      followerUserId: userId,
      followingUserId: targetUserId
    });

    // Track what succeeded for response
    const results = {
      followCreated: true,
      countsUpdated: false,
      pointsAwarded: false
    };

    // Step 2-4: Try to update user service (but don't fail if it doesn't work)
    try {
      // Update follower count for target user
      await axios.patch(`${USER_SERVICE_URL}/${targetUserId}/count`, {
        field: 'numFollowers',
        increment: 1
      });

      // Update following count for current user
      await axios.patch(`${USER_SERVICE_URL}/${userId}/count`, {
        field: 'numFollowing',
        increment: 1
      });

      results.countsUpdated = true;

      // Award points to the user being followed
      await updateUserPoints(targetUserId, 5);
      results.pointsAwarded = true;
    } catch (userServiceError) {
      console.error('Error updating user service:', userServiceError.message);
      // Continue - the follow relationship was created successfully
    }

    console.log(`[FOLLOW] Successfully created follow relationship: ${userId} -> ${targetUserId}`);
    return res.status(200).json({
      message: 'User followed successfully!',
      followId: followResponse.data.followId || followResponse.data.followingId,
      details: results
    });
  } catch (error) {
    // If follow service returns 409, it means already following
    if (error.response?.status === 409) {
      console.log(`[FOLLOW] User ${userId} already following user ${targetUserId}`);
      return res.status(400).json({ message: 'Already following this user.' });
    }
    console.error(`[FOLLOW] Error following user ${targetUserId} by user ${userId}:`, error.message);
    return res.status(500).json({ message: 'Failed to follow user' });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  const { targetUserId } = req.params;
  const { userId } = req.body;

  if (!targetUserId || !userId) {
    return res.status(400).json({ message: 'Target user ID and user ID are required.' });
  }

  console.log(`[UNFOLLOW] User ${userId} unfollowing user ${targetUserId}`);

  try {
    // Step 1: Remove follow relationship from follow service
    await axios.delete(`${FOLLOW_SERVICE_URL}/follow`, {
      data: {
        followerUserId: userId,
        followingUserId: targetUserId
      }
    });

    // Track what succeeded for response
    const results = {
      followRemoved: true,
      countsUpdated: false,
      pointsRemoved: false
    };

    // Step 2-4: Try to update user service (but don't fail if it doesn't work)
    try {
      // Update follower count for target user
      await axios.patch(`${USER_SERVICE_URL}/${targetUserId}/count`, {
        field: 'numFollowers',
        increment: -1
      });

      // Update following count for current user
      await axios.patch(`${USER_SERVICE_URL}/${userId}/count`, {
        field: 'numFollowing',
        increment: -1
      });

      results.countsUpdated = true;

      // Remove points from the user being unfollowed
      await updateUserPoints(targetUserId, -5);
      results.pointsRemoved = true;
    } catch (userServiceError) {
      console.error('Error updating user service:', userServiceError.message);
      // Continue - the unfollow was successful
    }

    console.log(`[UNFOLLOW] Successfully removed follow relationship: ${userId} -> ${targetUserId}`);
    return res.status(200).json({ 
      message: 'User unfollowed successfully!',
      details: results
    });
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`[UNFOLLOW] User ${userId} not following user ${targetUserId}`);
      return res.status(400).json({ message: 'Not following this user.' });
    }
    console.error(`[UNFOLLOW] Error unfollowing user ${targetUserId} by user ${userId}:`, error.message);
    return res.status(500).json({ message: 'Failed to unfollow user' });
  }
};

// Check if user follows another user
exports.checkFollow = async (req, res) => {
  const { targetUserId } = req.params;
  const { userId } = req.query;

  if (!targetUserId || !userId) {
    return res.status(400).json({ message: 'Target user ID and user ID are required.' });
  }

  try {
    const response = await axios.get(`${FOLLOW_SERVICE_URL}/check`, {
      params: {
        followerUserId: userId,
        followingUserId: targetUserId
      }
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error checking follow status:', error.message);
    return res.status(500).json({ message: 'Failed to check follow status' });
  }
};

// Get followers of a user
exports.getFollowers = async (req, res) => {
  const { userId } = req.params;

  try {
    const followersResponse = await axios.get(`${FOLLOW_SERVICE_URL}/followers/${userId}`);
    
    // Get user details for each follower
    const followerIds = followersResponse.data.followers.map(f => f.followerUserId);
    const userDetailsPromises = followerIds.map(id => 
      axios.get(`${USER_SERVICE_URL}/?id=${id}`)
    );
    
    const userDetailsResponses = await Promise.all(userDetailsPromises);
    const followersWithDetails = followersResponse.data.followers.map((follow, index) => ({
      ...follow,
      user: userDetailsResponses[index].data
    }));

    return res.status(200).json({
      followers: followersWithDetails,
      count: followersResponse.data.count
    });
  } catch (error) {
    console.error('Error getting followers:', error.message);
    return res.status(500).json({ message: 'Failed to get followers' });
  }
};

// Get users that a user is following
exports.getFollowing = async (req, res) => {
  const { userId } = req.params;

  try {
    const followingResponse = await axios.get(`${FOLLOW_SERVICE_URL}/following/${userId}`);
    
    // Get user details for each user being followed
    const followingIds = followingResponse.data.following.map(f => f.followingUserId);
    const userDetailsPromises = followingIds.map(id => 
      axios.get(`${USER_SERVICE_URL}/?id=${id}`)
    );
    
    const userDetailsResponses = await Promise.all(userDetailsPromises);
    const followingWithDetails = followingResponse.data.following.map((follow, index) => ({
      ...follow,
      user: userDetailsResponses[index].data
    }));

    return res.status(200).json({
      following: followingWithDetails,
      count: followingResponse.data.count
    });
  } catch (error) {
    console.error('Error getting following:', error.message);
    return res.status(500).json({ message: 'Failed to get following' });
  }
};

// Get suggested users for a user (non-followed users)
exports.getSuggestedUsers = async (req, res) => {
  const { userId } = req.params;
  const { limit = 5 } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  console.log(`[SUGGESTED_USERS] Getting suggestions for user ${userId}, limit: ${limit}`);

  try {
    // Step 1: Get current user's following list from follow service
    const followingResponse = await axios.get(`${FOLLOW_SERVICE_URL}/following/${userId}`);
    const followingIds = followingResponse.data.following.map(f => f.followingUserId);
    
    // Include current user in exclusion list
    const excludeUserIds = [...followingIds, userId];

    // Step 2: Get all users from user service
    const allUsersResponse = await axios.get(`${USER_SERVICE_URL}/all`);
    const allUsers = allUsersResponse.data;

    // Step 3: Filter out followed users and private profiles
    let eligibleUsers = allUsers.filter(user => {
      // Exclude current user and already followed users
      if (excludeUserIds.includes(user.userID || user.id)) {
        return false;
      }
      
      // Exclude private profiles (since user doesn't follow them)
      if (user.isProfilePrivate) {
        return false;
      }
      
      return true;
    });

    // Step 4: Shuffle the array for randomization
    for (let i = eligibleUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligibleUsers[i], eligibleUsers[j]] = [eligibleUsers[j], eligibleUsers[i]];
    }

    // Step 5: Take the requested number of users
    const suggestedUsers = eligibleUsers.slice(0, parseInt(limit));

    // Step 6: Format the response to match frontend expectations
    const formattedUsers = suggestedUsers.map(user => ({
      userID: user.userID || user.id,
      username: user.username,
      profilePicture: user.profilePicture || '/resources/images/default-profile.png',
      isFollowing: false // By design, these are non-followed users
    }));

    console.log(`[SUGGESTED_USERS] Returning ${formattedUsers.length} suggestions for user ${userId}`);
    return res.status(200).json({
      suggestedUsers: formattedUsers,
      count: formattedUsers.length,
      totalEligible: eligibleUsers.length
    });
  } catch (error) {
    console.error(`[SUGGESTED_USERS] Error getting suggestions for user ${userId}:`, error.message);
    return res.status(500).json({ message: 'Failed to get suggested users' });
  }
};