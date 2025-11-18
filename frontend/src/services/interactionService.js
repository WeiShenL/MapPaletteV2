import axios from '@/lib/axios';

const INTERACTION_SERVICE_URL = import.meta.env.VITE_INTERACTION_SERVICE_URL || 'http://localhost:3003';

class InteractionService {
  // Like/Unlike operations
  async likeEntity(entityType, entityId, userId) {
    const response = await axios.post(`${INTERACTION_SERVICE_URL}/api/interactions/like/${entityType}/${entityId}`, {
      userId
    });
    return response.data;
  }

  async unlikeEntity(entityType, entityId, userId) {
    const response = await axios.delete(`${INTERACTION_SERVICE_URL}/api/interactions/unlike/${entityType}/${entityId}`, {
      data: { userId }
    });
    return response.data;
  }

  // Share operations
  async shareEntity(entityType, entityId, userId) {
    const response = await axios.post(`${INTERACTION_SERVICE_URL}/api/interactions/share/${entityType}/${entityId}`, {
      userId
    });
    return response.data;
  }

  // Comment operations
  async addComment(entityType, entityId, userId, content, username) {
    const response = await axios.post(`${INTERACTION_SERVICE_URL}/api/interactions/comment/${entityType}/${entityId}`, {
      userId,
      content,
      username
    });
    return response.data;
  }

  async deleteComment(commentId, userId) {
    const response = await axios.delete(`${INTERACTION_SERVICE_URL}/api/interactions/comment/${commentId}`, {
      data: { userId }
    });
    return response.data;
  }

  // Get interactions
  async getLikes(entityType, entityId) {
    const response = await axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/likes/${entityType}/${entityId}`);
    return response.data;
  }

  async getComments(entityType, entityId) {
    const response = await axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/comments/${entityType}/${entityId}`);
    return response.data;
  }

  async getShares(entityType, entityId) {
    const response = await axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/shares/${entityType}/${entityId}`);
    return response.data;
  }

  // Check user interaction status
  async checkUserInteraction(entityType, entityId, userId) {
    const response = await axios.get(`${INTERACTION_SERVICE_URL}/api/interactions/check/${entityType}/${entityId}/${userId}`);
    return response.data;
  }
}

export default new InteractionService();