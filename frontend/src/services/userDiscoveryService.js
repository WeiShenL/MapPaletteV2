import axios from '@/lib/axios';

// Use relative URL to go through the Caddy proxy
// The proxy will route /api/discover/* to the user-discovery-service

export const userDiscoveryService = {
  /**
   * Discover users that the current user is not following
   * @param {string} userId - Current user's ID
   * @param {number} limit - Maximum number of users to return
   * @param {number} offset - Number of users to skip for pagination
   * @param {boolean} suggestionsOnly - If true, returns randomized suggestions
   * @returns {Promise} Discovery response with users
   */
  async discoverUsers(userId, limit = 20, offset = 0, suggestionsOnly = false) {
    try {
      const response = await axios.get(`/api/discover/users/${userId}`, {
        params: { limit, offset, suggestionsOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Error discovering users:', error);
      throw error;
    }
  },

  /**
   * Get suggested users for sidebar (convenience method)
   * @param {string} userId - Current user's ID
   * @param {number} limit - Maximum number of suggestions
   * @returns {Promise} Discovery response with suggested users
   */
  async getSuggestedUsers(userId, limit = 5) {
    try {
      const response = await axios.get(`/api/discover/users/${userId}/suggestions`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting suggested users:', error);
      throw error;
    }
  },

  /**
   * Get all user data - both friends and other users in a single call
   * @param {string} userId - Current user's ID
   * @param {number} limit - Maximum number of other users to return
   * @param {number} offset - Number of other users to skip for pagination
   * @returns {Promise} Response with friends and other users
   */
  async getAllUserData(userId, limit = 20, offset = 0) {
    try {
      const response = await axios.get(`/api/discover/users/${userId}/all`, {
        params: { 
          friendsLimit: 100,
          othersLimit: limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting all user data:', error);
      throw error;
    }
  }
};