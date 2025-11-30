import axios from '@/lib/axios';

class FeedService {
  // Get user's personalized feed
  async getUserFeed(userId, limit = 10, offset = 0, { signal } = {}) {
    const response = await axios.get(`/api/feed/user/${userId}`, {
      params: { limit, offset },
      signal
    });
    return response.data;
  }

  // Get all posts (discovery/explore)
  async getAllPosts(currentUserId, limit = 20, offset = 0) {
    const response = await axios.get(`/api/feed/all`, {
      params: { userId: currentUserId, limit, offset }
    });
    return response.data;
  }

  // Get single post with full details
  async getPostDetails(postId, currentUserId) {
    const response = await axios.get(`/api/feed/post/${postId}`, {
      params: { userId: currentUserId }
    });
    return response.data;
  }

  // Get trending posts
  async getTrendingPosts(limit = 10) {
    const response = await axios.get(`/api/feed/trending`, {
      params: { limit }
    });
    return response.data;
  }

  // Get user details
  async getUserDetails(userId) {
    const response = await axios.get(`/api/users/${userId}`);
    return response.data;
  }

  // Get user's posts
  async getUserPosts(userId) {
    const response = await axios.get(`/api/posts/users/${userId}/posts`);
    return response.data;
  }
}

export default new FeedService();