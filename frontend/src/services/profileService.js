import axios from 'axios';

const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL || 'http://localhost:3006/api';

class ProfileService {
  // Get complete user profile data
  async getUserProfile(userId, currentUserId = null) {
    const response = await axios.get(`${PROFILE_SERVICE_URL}/profile/user/${userId}`, {
      params: currentUserId ? { currentUserId } : {}
    });
    return response.data;
  }

  // Get user's followers
  async getUserFollowers(userId, currentUserId = null) {
    const response = await axios.get(`${PROFILE_SERVICE_URL}/profile/user/${userId}/followers`, {
      params: currentUserId ? { currentUserId } : {}
    });
    return response.data;
  }

  // Get users that the user is following
  async getUserFollowing(userId, currentUserId = null) {
    const response = await axios.get(`${PROFILE_SERVICE_URL}/profile/user/${userId}/following`, {
      params: currentUserId ? { currentUserId } : {}
    });
    return response.data;
  }
}

export default new ProfileService();