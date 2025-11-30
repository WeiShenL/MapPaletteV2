/**
 * Social Interaction Service
 * Handles post-specific interactions (likes, comments, shares)
 * For follow operations, use followService.js instead
 */
import axios from '@/lib/axios';
import followService from './followService';

const SOCIAL_INTERACTION_SERVICE_URL = import.meta.env.VITE_SOCIAL_INTERACTION_URL || 'http://localhost:3005';

class SocialInteractionService {
  // ==========================================
  // POST INTERACTIONS (Primary responsibility)
  // ==========================================

  /**
   * Like a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response data
   */
  async likePost(postId, userId) {
    const response = await axios.post(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/like`, {
      userId
    });
    return response.data;
  }

  /**
   * Unlike a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response data
   */
  async unlikePost(postId, userId) {
    const response = await axios.delete(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/unlike`, {
      data: { userId }
    });
    return response.data;
  }

  /**
   * Share a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response data
   */
  async sharePost(postId, userId) {
    const response = await axios.post(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/share`, {
      userId
    });
    return response.data;
  }

  /**
   * Add a comment to a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @param {string} content - Comment content
   * @param {string} username - Username
   * @returns {Promise<Object>} Response data
   */
  async addComment(postId, userId, content, username) {
    const response = await axios.post(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/comment`, {
      userId,
      content,
      username
    });
    return response.data;
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response data
   */
  async deleteComment(commentId, userId) {
    const response = await axios.delete(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/comments/${commentId}`, {
      data: { userId }
    });
    return response.data;
  }

  /**
   * Get all interactions for a post
   * @param {string} postId - Post ID
   * @param {string|null} userId - User ID (optional)
   * @returns {Promise<Object>} Interactions data
   */
  async getPostInteractions(postId, userId = null) {
    const params = userId ? `?userId=${userId}` : '';
    const response = await axios.get(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/posts/${postId}/interactions${params}`);
    return response.data;
  }

  /**
   * Get suggested users (non-followed users)
   * @param {string} userId - User ID
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Object>} Suggested users
   */
  async getSuggestedUsers(userId, limit = 5) {
    const response = await axios.get(`${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${userId}/suggested?limit=${limit}`);
    return response.data;
  }

  // ==========================================
  // FOLLOW OPERATIONS (Delegated to followService)
  // ==========================================
  // These methods are kept for backward compatibility
  // New code should use followService.js directly

  /**
   * @deprecated Use followService.followUser() instead
   */
  async followUser(targetUserId, userId) {
    console.warn('[SocialInteractionService] followUser is deprecated. Use followService.followUser() instead.');
    return followService.followUser(targetUserId, userId);
  }

  /**
   * @deprecated Use followService.unfollowUser() instead
   */
  async unfollowUser(targetUserId, userId) {
    console.warn('[SocialInteractionService] unfollowUser is deprecated. Use followService.unfollowUser() instead.');
    return followService.unfollowUser(targetUserId, userId);
  }

  /**
   * @deprecated Use followService.checkFollowStatus() instead
   */
  async checkFollowStatus(targetUserId, userId) {
    console.warn('[SocialInteractionService] checkFollowStatus is deprecated. Use followService.checkFollowStatus() instead.');
    return followService.checkFollowStatus(targetUserId, userId);
  }

  /**
   * @deprecated Use followService.getFollowers() instead
   */
  async getFollowers(userId) {
    console.warn('[SocialInteractionService] getFollowers is deprecated. Use followService.getFollowers() instead.');
    return followService.getFollowers(userId);
  }

  /**
   * @deprecated Use followService.getFollowing() instead
   */
  async getFollowing(userId) {
    console.warn('[SocialInteractionService] getFollowing is deprecated. Use followService.getFollowing() instead.');
    return followService.getFollowing(userId);
  }
}

export default new SocialInteractionService();