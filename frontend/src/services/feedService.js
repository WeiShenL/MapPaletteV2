import axios from 'axios';

const FEED_SERVICE_URL = import.meta.env.VITE_FEED_SERVICE_URL || 'http://localhost:3004/api';
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001/api';
const POST_SERVICE_URL = import.meta.env.VITE_POST_SERVICE_URL || 'http://localhost:3002/api';

class FeedService {
  // Get user's personalized feed
  async getUserFeed(userId, limit = 10, offset = 0) {
    const response = await axios.get(`${FEED_SERVICE_URL}/feed/user/${userId}`, {
      params: { limit, offset }
    });
    return response.data;
  }

  // Get all posts (discovery/explore)
  async getAllPosts(currentUserId, limit = 20, offset = 0) {
    const response = await axios.get(`${FEED_SERVICE_URL}/feed/all`, {
      params: { userId: currentUserId, limit, offset }
    });
    return response.data;
  }

  // Get single post with full details
  async getPostDetails(postId, currentUserId) {
    const response = await axios.get(`${FEED_SERVICE_URL}/feed/post/${postId}`, {
      params: { userId: currentUserId }
    });
    return response.data;
  }

  // Get trending posts
  async getTrendingPosts(limit = 10) {
    const response = await axios.get(`${FEED_SERVICE_URL}/feed/trending`, {
      params: { limit }
    });
    return response.data;
  }

  // Get user details
  async getUserDetails(userId) {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
    return response.data;
  }

  // Get user's posts
  async getUserPosts(userId) {
    const response = await axios.get(`${POST_SERVICE_URL}/users/${userId}/posts`);
    return response.data;
  }
}

export default new FeedService();