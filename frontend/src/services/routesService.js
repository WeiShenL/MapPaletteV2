import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_EXPLORE_ROUTES_URL || 'http://localhost:3008';

export const routesService = {
  // Get all routes with pagination and filters
  async getAllRoutes({ page = 1, limit = 8, sortBy = 'popularity', search = '', userId = null }) {
    try {
      const params = {
        page,
        limit,
        sortBy,
        search
      };
      
      if (userId) {
        params.userId = userId;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/routes`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  },

  // Get a single route by ID
  async getRouteById(postId, userId = null) {
    try {
      const params = userId ? { userId } : {};
      const response = await axios.get(`${API_BASE_URL}/api/routes/${postId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  }
};