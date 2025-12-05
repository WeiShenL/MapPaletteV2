import axios from '@/lib/axios';

class ProfileService {
  // Get complete user profile data
  // currentUserId is now extracted from JWT token on backend
  async getUserProfile(userId) {
    const response = await axios.get(`/api/profile/user/${userId}`);
    return response.data;
  }

  // Get user's followers
  // currentUserId is now extracted from JWT token on backend
  async getUserFollowers(userId) {
    const response = await axios.get(`/api/profile/user/${userId}/followers`);
    return response.data;
  }

  // Get users that the user is following
  // currentUserId is now extracted from JWT token on backend
  async getUserFollowing(userId) {
    const response = await axios.get(`/api/profile/user/${userId}/following`);
    return response.data;
  }
}

export default new ProfileService();