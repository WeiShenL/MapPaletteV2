package main

import "time"

// User represents a user with leaderboard data
type User struct {
	UserID         string    `json:"id"`           
	Username       string    `json:"username"`
	ProfilePicture string    `json:"profilePicture"`
	Points         int       `json:"points"`
	IsPrivate      bool      `json:"isProfilePrivate"`
	CreatedAt      interface{} `json:"createdAt"`  
}

// LeaderboardEntry represents a user's position on the leaderboard
type LeaderboardEntry struct {
	UserID         string      `json:"userId"`      
	Username       string      `json:"username"`
	ProfilePicture string      `json:"profilePicture"`
	Points         int         `json:"points"`
	IsPrivate      bool        `json:"isProfilePrivate"`
	CreatedAt      interface{} `json:"createdAt"`
	Rank           int         `json:"rank"`
	Tier           string      `json:"tier"`
}

// LeaderboardResponse represents the complete leaderboard response
type LeaderboardResponse struct {
	Leaderboard []LeaderboardEntry `json:"leaderboard"`
	TotalUsers  int                `json:"totalUsers"`
	UpdatedAt   time.Time          `json:"updatedAt"`
}

// UserRankResponse represents a single user's rank information
type UserRankResponse struct {
	User
	Rank      int `json:"rank"`
	Tier      string `json:"tier"`
	TotalUsers int `json:"totalUsers"`
}

// PointBreakdown represents different types of points a user has earned
type PointBreakdown struct {
	PostPoints    int `json:"postPoints"`
	LikePoints    int `json:"likePoints"`
	CommentPoints int `json:"commentPoints"`
	FollowPoints  int `json:"followPoints"`
	Total         int `json:"total"`
}