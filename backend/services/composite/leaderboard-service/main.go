package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var startTime = time.Now()

func main() {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS configuration - allow requests from frontend
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173", "http://localhost"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "x-supabase-api-version", "apikey", "x-client-info"}
	router.Use(cors.New(config))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		uptime := int(time.Since(startTime).Seconds())
		c.JSON(200, gin.H{
			"status":    "healthy",
			"service":   "leaderboard-service",
			"version":   "1.0.0",
			"timestamp": time.Now().Format(time.RFC3339),
			"uptime":    uptime,
			"dependencies": gin.H{
				"user-service": getEnvOrDefault("USER_SERVICE_URL", "http://localhost:3001/api/users"),
			},
		})
	})

	// Initialize routes
	setupRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Leaderboard service starting on port %s", port)
	router.Run(":" + port)
}

func setupRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		leaderboard := api.Group("/leaderboard")
		{
			leaderboard.GET("/", GetLeaderboard)
			leaderboard.GET("/user/:userId", GetUserRank)
			leaderboard.GET("/top/:limit", GetTopUsers)
		}
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}