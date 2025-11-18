import axios from '@/lib/axios';

const FEED_SERVICE_URL = import.meta.env.VITE_FEED_SERVICE_URL || 'http://localhost:3004';
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001';
const POST_SERVICE_URL = import.meta.env.VITE_POST_SERVICE_URL || 'http://localhost:3002';

class FeedService {
  // Get user's personalized feed
  async getUserFeed(userId, limit = 10, offset = 0) {
    const response = await axios.get(`${FEED_SERVICE_URL}/api/feed/user/${userId}`, {
      params: { limit, offset }
    });
    return response.data;
  }

  // Get all posts (discovery/explore)
  async getAllPosts(currentUserId, limit = 20, offset = 0) {
    const response = await axios.get(`${FEED_SERVICE_URL}/api/feed/all`, {
      params: { userId: currentUserId, limit, offset }
    });
    return response.data;
  }

  // Get single post with full details
  async getPostDetails(postId, currentUserId) {
    const response = await axios.get(`${FEED_SERVICE_URL}/api/feed/post/${postId}`, {
      params: { userId: currentUserId }
    });
    return response.data;
  }

  // Get trending posts
  async getTrendingPosts(limit = 10) {
    const response = await axios.get(`${FEED_SERVICE_URL}/api/feed/trending`, {
      params: { limit }
    });
    return response.data;
  }

  // Get user details
  async getUserDetails(userId) {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
    return response.data;
  }

  // Get user's posts
  async getUserPosts(userId) {
    const response = await axios.get(`${POST_SERVICE_URL}/api/users/${userId}/posts`);
    return response.data;
  }
}

export default new FeedService();