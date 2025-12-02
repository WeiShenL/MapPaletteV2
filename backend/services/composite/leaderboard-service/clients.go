package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// UserServiceClient handles communication with the user service
type UserServiceClient struct {
	baseURL string
	client  *http.Client
}

// NewUserServiceClient creates a new user service client
func NewUserServiceClient() *UserServiceClient {
	baseURL := os.Getenv("USER_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3001" 
	}

	return &UserServiceClient{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// UsersResponse represents the paginated response from user service
type UsersResponse struct {
	Users      []User `json:"users"`
	Pagination struct {
		Page       int `json:"page"`
		Limit      int `json:"limit"`
		Total      int `json:"total"`
		TotalPages int `json:"totalPages"`
	} `json:"pagination"`
}

// GetAllUsersWithPoints fetches all users with their points from the user service
func (c *UserServiceClient) GetAllUsersWithPoints() ([]User, error) {
	// Use leaderboard endpoint which returns all users ordered by points
	// with a high limit to get all users
	url := fmt.Sprintf("%s/api/users/leaderboard/all?limit=1000", c.baseURL)
	
	resp, err := c.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("user service returned status %d: %s", resp.StatusCode, string(body))
	}

	var usersResp UsersResponse
	if err := json.NewDecoder(resp.Body).Decode(&usersResp); err != nil {
		return nil, fmt.Errorf("failed to decode users response: %w", err)
	}

	return usersResp.Users, nil
}

// GetUserByID fetches a specific user by ID
func (c *UserServiceClient) GetUserByID(userID string) (*User, error) {
	url := fmt.Sprintf("%s/api/users/%s", c.baseURL, userID)
	
	resp, err := c.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("user service returned status %d: %s", resp.StatusCode, string(body))
	}

	var user User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to decode user response: %w", err)
	}

	return &user, nil
}