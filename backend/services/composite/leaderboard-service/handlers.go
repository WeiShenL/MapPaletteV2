package main

import (
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

var userClient = NewUserServiceClient()

// GetLeaderboard returns the complete leaderboard
func GetLeaderboard(c *gin.Context) {
	users, err := userClient.GetAllUsersWithPoints()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch leaderboard data",
			"details": err.Error(),
		})
		return
	}

	// Filter out private profiles and users with 0 points
	var publicUsers []User
	for _, user := range users {
		if !user.IsPrivate && user.Points > 0 {
			publicUsers = append(publicUsers, user)
		}
	}

	// Sort by points descending, then by username for ties
	sort.Slice(publicUsers, func(i, j int) bool {
		if publicUsers[i].Points == publicUsers[j].Points {
			return publicUsers[i].Username < publicUsers[j].Username
		}
		return publicUsers[i].Points > publicUsers[j].Points
	})

	// Create leaderboard entries with ranks and tiers
	leaderboard := make([]LeaderboardEntry, len(publicUsers))
	for i, user := range publicUsers {
		leaderboard[i] = LeaderboardEntry{
			UserID:         user.UserID,
			Username:       user.Username,
			ProfilePicture: user.ProfilePicture,
			Points:         user.Points,
			IsPrivate:      user.IsPrivate,
			CreatedAt:      user.CreatedAt,
			Rank:           i + 1,
			Tier:           calculateTier(i + 1),
		}
	}

	response := LeaderboardResponse{
		Leaderboard: leaderboard,
		TotalUsers:  len(leaderboard),
		UpdatedAt:   time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// GetUserRank returns a specific user's rank and position
func GetUserRank(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// Get the specific user
	user, err := userClient.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user data",
			"details": err.Error(),
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get all users to calculate rank
	allUsers, err := userClient.GetAllUsersWithPoints()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch leaderboard data",
			"details": err.Error(),
		})
		return
	}

	// Filter out private profiles and users with 0 points
	var publicUsers []User
	for _, u := range allUsers {
		if !u.IsPrivate && u.Points > 0 {
			publicUsers = append(publicUsers, u)
		}
	}

	// Sort by points descending, then by username for ties
	sort.Slice(publicUsers, func(i, j int) bool {
		if publicUsers[i].Points == publicUsers[j].Points {
			return publicUsers[i].Username < publicUsers[j].Username
		}
		return publicUsers[i].Points > publicUsers[j].Points
	})

	// Find user's rank
	rank := -1
	for i, u := range publicUsers {
		if u.UserID == userID {
			rank = i + 1
			break
		}
	}

	if rank == -1 {
		// User not in public leaderboard (private profile or 0 points)
		c.JSON(http.StatusOK, gin.H{
			"message": "User not in public leaderboard",
			"userId": user.UserID,
			"username": user.Username,
			"points": user.Points,
			"rank": 0,
			"tier": "Unranked",
		})
		return
	}

	response := UserRankResponse{
		User:       *user,
		Rank:       rank,
		Tier:       calculateTier(rank),
		TotalUsers: len(publicUsers),
	}

	c.JSON(http.StatusOK, response)
}

// GetTopUsers returns the top N users from the leaderboard
func GetTopUsers(c *gin.Context) {
	limitStr := c.Param("limit")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10 // Default to top 10
	}

	users, err := userClient.GetAllUsersWithPoints()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch leaderboard data",
			"details": err.Error(),
		})
		return
	}

	// Filter out private profiles and users with 0 points
	var publicUsers []User
	for _, user := range users {
		if !user.IsPrivate && user.Points > 0 {
			publicUsers = append(publicUsers, user)
		}
	}

	// Sort by points descending, then by username for ties
	sort.Slice(publicUsers, func(i, j int) bool {
		if publicUsers[i].Points == publicUsers[j].Points {
			return publicUsers[i].Username < publicUsers[j].Username
		}
		return publicUsers[i].Points > publicUsers[j].Points
	})

	// Limit results
	if limit > len(publicUsers) {
		limit = len(publicUsers)
	}
	topUsers := publicUsers[:limit]

	// Create leaderboard entries
	leaderboard := make([]LeaderboardEntry, len(topUsers))
	for i, user := range topUsers {
		leaderboard[i] = LeaderboardEntry{
			UserID:         user.UserID,
			Username:       user.Username,
			ProfilePicture: user.ProfilePicture,
			Points:         user.Points,
			IsPrivate:      user.IsPrivate,
			CreatedAt:      user.CreatedAt,
			Rank:           i + 1,
			Tier:           calculateTier(i + 1),
		}
	}

	response := LeaderboardResponse{
		Leaderboard: leaderboard,
		TotalUsers:  len(publicUsers),
		UpdatedAt:   time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// calculateTier determines the tier based on rank
func calculateTier(rank int) string {
	switch {
	case rank == 1:
		return "Champion"
	case rank == 2:
		return "Master"
	case rank == 3:
		return "Pro"
	case rank <= 10:
		return "Elite"
	default:
		return "Newbie"
	}
}