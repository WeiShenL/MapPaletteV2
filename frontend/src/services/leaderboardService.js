const LEADERBOARD_API_URL = import.meta.env.VITE_LEADERBOARD_SERVICE_URL || 'http://localhost:8080';

class LeaderboardService {
  constructor() {
    this.baseURL = LEADERBOARD_API_URL;
  }

  async getLeaderboard() {
    try {
      const response = await fetch(`${this.baseURL}/api/leaderboard/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.leaderboard || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async getUserRank(userId) {
    try {
      const response = await fetch(`${this.baseURL}/api/leaderboard/user/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // User not found in leaderboard
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user rank:', error);
      throw error;
    }
  }

  async getTopUsers(limit = 10) {
    try {
      const response = await fetch(`${this.baseURL}/api/leaderboard/top/${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.leaderboard || [];
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