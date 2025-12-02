package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
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
		baseURL = "http://user-service:5000" // Default for Docker network
	}
	
	log.Printf("UserServiceClient initialized with baseURL: %s", baseURL)

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
	// Use leaderboard endpoint which returns users ordered by points
	// Use max allowed limit (100) and paginate if needed
	var allUsers []User
	page := 1
	limit := 100
	
	for {
		url := fmt.Sprintf("%s/api/users/leaderboard/all?limit=%d&page=%d", c.baseURL, limit, page)
		
		log.Printf("Fetching users from: %s", url)
		
		resp, err := c.client.Get(url)
		if err != nil {
			log.Printf("HTTP request failed: %v", err)
			return nil, fmt.Errorf("failed to fetch users: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			log.Printf("User service returned error status %d: %s", resp.StatusCode, string(body))
			return nil, fmt.Errorf("user service returned status %d: %s", resp.StatusCode, string(body))
		}

		var usersResp UsersResponse
		if err := json.NewDecoder(resp.Body).Decode(&usersResp); err != nil {
			log.Printf("Failed to decode response: %v", err)
			return nil, fmt.Errorf("failed to decode users response: %w", err)
		}

		allUsers = append(allUsers, usersResp.Users...)
		
		log.Printf("Fetched page %d: %d users (total so far: %d)", page, len(usersResp.Users), len(allUsers))
		
		// Check if we've fetched all pages
		if page >= usersResp.Pagination.TotalPages {
			break
		}
		page++
	}

	log.Printf("Successfully fetched total of %d users", len(allUsers))
	return allUsers, nil
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