import axios from '@/lib/axios';

class ProfileService {
  // Get complete user profile data
  async getUserProfile(userId, currentUserId = null) {
    const response = await axios.get(`/api/profile/user/${userId}`, {
      params: currentUserId ? { currentUserId } : {}
    });
    return response.data;
  }

  // Get user's followers
  async getUserFollowers(userId, currentUserId = null) {
    const response = await axios.get(`/api/profile/user/${userId}/followers`, {
      params: currentUserId ? { currentUserId } : {}
    });
    return response.data;
  }

  // Get users that the user is following
  async getUserFollowing(userId, currentUserId = null) {
    const response = await axios.get(`/api/profile/user/${userId}/following`, {
      params: currentUserId ? { currentUserId } : {}
    });
    return response.data;
  }
}

export default new ProfileService();