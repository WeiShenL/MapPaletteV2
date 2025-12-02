import axios from '@/lib/axios';

const SOCIAL_INTERACTION_SERVICE_URL = import.meta.env.VITE_SOCIAL_INTERACTION_URL || 'http://localhost:3005';

const followService = {
  // Follow a user (currentUserId follows targetUserId)
  async followUser(targetUserId, currentUserId) {
    try {
      const response = await axios.post(
        `${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${targetUserId}/follow`,
        { userId: currentUserId }
      );
      return response.data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  // Unfollow a user (currentUserId unfollows targetUserId)
  async unfollowUser(targetUserId, currentUserId) {
    try {
      const response = await axios.delete(
        `${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${targetUserId}/unfollow`,
        { data: { userId: currentUserId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  // Check if current user follows target user
  async checkFollowStatus(targetUserId, currentUserId) {
    try {
      const response = await axios.get(
        `${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${targetUserId}/follow-status`,
        { params: { userId: currentUserId } }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      throw error;
    }
  },

  // Get followers of a user
  async getFollowers(userId) {
    try {
      const response = await axios.get(
        `${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${userId}/followers`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting followers:', error);
      throw error;
    }
  },

  // Get users that a user is following
  async getFollowing(userId) {
    try {
      const response = await axios.get(
        `${SOCIAL_INTERACTION_SERVICE_URL}/api/social/users/${userId}/following`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting following:', error);
      throw error;
    }
  }
};

export default followService;