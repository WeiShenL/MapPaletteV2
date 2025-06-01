import axios from 'axios';

const SOCIAL_INTERACTION_SERVICE_URL = import.meta.env.VITE_SOCIAL_INTERACTION_URL || 'http://localhost:3005';

class SocialInteractionService {
  // Post interactions
  async likePost(postId, userId) {
    const response = await axios.post(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/like`, {
      userId
    });
    return response.data;
  }

  async unlikePost(postId, userId) {
    const response = await axios.delete(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/unlike`, {
      data: { userId }
    });
    return response.data;
  }

  async sharePost(postId, userId) {
    const response = await axios.post(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/share`, {
      userId
    });
    return response.data;
  }

  async addComment(postId, userId, content, username) {
    const response = await axios.post(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/comment`, {
      userId,
      content,
      username
    });
    return response.data;
  }

  async deleteComment(commentId, userId) {
    const response = await axios.delete(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/comments/${commentId}`, {
      data: { userId }
    });
    return response.data;
  }

  // Get all interactions for a post
  async getPostInteractions(postId, userId = null) {
    const params = userId ? `?userId=${userId}` : '';
    const response = await axios.get(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/interactions${params}`);
    return response.data;
  }

  // Follow interactions
  async followUser(targetUserId, userId) {
    console.log('[SocialInteractionService] followUser called with:')
    console.log('  targetUserId:', targetUserId)
    console.log('  userId:', userId)
    console.log('  URL:', `${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${targetUserId}/follow`)
    
    const response = await axios.post(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${targetUserId}/follow`, {
      userId
    });
    return response.data;
  }

  async unfollowUser(targetUserId, userId) {
    const response = await axios.delete(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${targetUserId}/unfollow`, {
      data: { userId }
    });
    return response.data;
  }

  async checkFollowStatus(targetUserId, userId) {
    const response = await axios.get(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${targetUserId}/follow-status?userId=${userId}`);
    return response.data;
  }

  async getFollowers(userId) {
    const response = await axios.get(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${userId}/followers`);
    return response.data;
  }

  async getFollowing(userId) {
    const response = await axios.get(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${userId}/following`);
    return response.data;
  }

  // Get suggested users (non-followed users)
  async getSuggestedUsers(userId, limit = 5) {
    const response = await axios.get(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${userId}/suggested?limit=${limit}`);
    return response.data;
  }
}

export default new SocialInteractionService();