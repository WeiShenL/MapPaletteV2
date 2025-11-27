import axios from '@/lib/axios';

const LEADERBOARD_API_URL = import.meta.env.VITE_LEADERBOARD_SERVICE_URL || 'http://localhost:8080';

class LeaderboardService {
  constructor() {
    this.baseURL = LEADERBOARD_API_URL;
  }

  /**
   * Get full leaderboard
   * @returns {Promise<Array>} Leaderboard data
   */
  async getLeaderboard() {
    try {
      const response = await axios.get(`${this.baseURL}/api/leaderboard/`);
      return response.data.leaderboard || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get a specific user's rank
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User rank data or null if not found
   */
  async getUserRank(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/leaderboard/user/${userId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // User not found in leaderboard
      }
      console.error('Error fetching user rank:', error);
      throw error;
    }
  }

  /**
   * Get top N users from leaderboard
   * @param {number} limit - Number of users to retrieve
   * @returns {Promise<Array>} Top users
   */
  async getTopUsers(limit = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/api/leaderboard/top/${limit}`);
      return response.data.leaderboard || [];
    } catch (error) {
      console.error('Error fetching top users:', error);
      throw error;
    }
  }

  formatPoints(points) {
    if (!points || points <= 0) {
      return 'No points yet';
    }
    return points.toLocaleString();
  }

  getRankDisplay(tier) {
    const tierMap = {
      'Champion': 'Champion',
      'Master': 'Master', 
      'Pro': 'Pro',
      'Elite': 'Elite',
      'Newbie': 'Newbie'
    };
    return tierMap[tier] || 'Unranked';
  }

  getRankClass(tier) {
    const classMap = {
      'Champion': 'rank-champion',
      'Master': 'rank-master',
      'Pro': 'rank-pro', 
      'Elite': 'rank-elite',
      'Newbie': 'rank-newbie'
    };
    return classMap[tier] || 'rank-newbie';
  }

  getTrophyClass(rank) {
    if (rank === 1) return '';
    if (rank === 2) return 'silver-trophy';
    if (rank === 3) return 'bronze-trophy';
    return '';
  }
}

export default new LeaderboardService();