import axios from 'axios';

const INTERACTION_SERVICE_URL = import.meta.env.VITE_INTERACTION_SERVICE_URL || 'http://localhost:3003/api';

class InteractionService {
  // Like/Unlike operations
  async likeEntity(entityType, entityId, userId) {
    const response = await axios.post(`${INTERACTION_SERVICE_URL}/interactions/like/${entityType}/${entityId}`, {
      userId
    });
    return response.data;
  }

  async unlikeEntity(entityType, entityId, userId) {
    const response = await axios.delete(`${INTERACTION_SERVICE_URL}/interactions/unlike/${entityType}/${entityId}`, {
      data: { userId }
    });
    return response.data;
  }

  // Share operations
  async shareEntity(entityType, entityId, userId) {
    const response = await axios.post(`${INTERACTION_SERVICE_URL}/interactions/share/${entityType}/${entityId}`, {
      userId
    });
    return response.data;
  }

  // Comment operations
  async addComment(entityType, entityId, userId, content, username) {
    const response = await axios.post(`${INTERACTION_SERVICE_URL}/interactions/comment/${entityType}/${entityId}`, {
      userId,
      content,
      username
    });
    return response.data;
  }

  async deleteComment(commentId, userId) {
    const response = await axios.delete(`${INTERACTION_SERVICE_URL}/interactions/comment/${commentId}`, {
      data: { userId }
    });
    return response.data;
  }

  // Get interactions
  async getLikes(entityType, entityId) {
    const response = await axios.get(`${INTERACTION_SERVICE_URL}/interactions/likes/${entityType}/${entityId}`);
    return response.data;
  }

  async getComments(entityType, entityId) {
    const response = await axios.get(`${INTERACTION_SERVICE_URL}/interactions/comments/${entityType}/${entityId}`);
    return response.data;
  }

  async getShares(entityType, entityId) {
    const response = await axios.get(`${INTERACTION_SERVICE_URL}/interactions/shares/${entityType}/${entityId}`);
    return response.data;
  }

  // Check user interaction status
  async checkUserInteraction(entityType, entityId, userId) {
    const response = await axios.get(`${INTERACTION_SERVICE_URL}/interactions/check/${entityType}/${entityId}/${userId}`);
    return response.data;
  }
}

export default new InteractionService();