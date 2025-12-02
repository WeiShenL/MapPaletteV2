package com.mappalette.userdiscovery.controller;

import com.mappalette.userdiscovery.dto.AllUsersResponse;
import com.mappalette.userdiscovery.dto.DiscoveryResponse;
import com.mappalette.userdiscovery.service.UserDiscoveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/discover")
@RequiredArgsConstructor
// CORS is handled by Caddy reverse proxy - removed @CrossOrigin to prevent duplicate headers
@Slf4j
public class UserDiscoveryController {
    
    private final UserDiscoveryService userDiscoveryService;
    
    /**
     * Discover users that the current user is not following
     * 
     * @param userId The ID of the current user
     * @param limit Maximum number of users to return (default: 20)
     * @param offset Number of users to skip for pagination (default: 0)
     * @param suggestionsOnly If true, returns randomized suggestions (default: false)
     * @return DiscoveryResponse containing discoverable users
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<DiscoveryResponse> discoverUsers(
            @PathVariable String userId,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "false") boolean suggestionsOnly) {
        
        log.info("Discover users request - userId: {}, limit: {}, offset: {}, suggestionsOnly: {}", 
                userId, limit, offset, suggestionsOnly);
        
        DiscoveryResponse response = userDiscoveryService.discoverUsers(userId, limit, offset, suggestionsOnly);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get suggested users for the sidebar (convenience endpoint)
     * Returns a small number of randomized suggestions
     */
    @GetMapping("/users/{userId}/suggestions")
    public ResponseEntity<DiscoveryResponse> getSuggestedUsers(
            @PathVariable String userId,
            @RequestParam(defaultValue = "5") int limit) {
        
        log.info("Get suggested users request - userId: {}, limit: {}", userId, limit);
        
        // Always return suggestions only with no offset
        DiscoveryResponse response = userDiscoveryService.discoverUsers(userId, limit, 0, true);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all user data (friends and other users) in a single call
     * This is optimized for the friends page to reduce API calls
     */
    @GetMapping("/users/{userId}/all")
    public ResponseEntity<AllUsersResponse> getAllUserData(
            @PathVariable String userId,
            @RequestParam(defaultValue = "100") int friendsLimit,
            @RequestParam(defaultValue = "100") int othersLimit) {
        
        log.info("Get all user data request - userId: {}, friendsLimit: {}, othersLimit: {}", 
                userId, friendsLimit, othersLimit);
        
        AllUsersResponse response = userDiscoveryService.getAllUserData(userId, friendsLimit, othersLimit);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "healthy");
        healthResponse.put("service", "user-discovery-service");
        healthResponse.put("version", "1.0.0");
        healthResponse.put("timestamp", new Date().toInstant().toString());
        healthResponse.put("uptime", getUptimeInSeconds());
        
        Map<String, String> dependencies = new HashMap<>();
        dependencies.put("user-service", System.getenv("USER_SERVICE_URL") != null ? 
            System.getenv("USER_SERVICE_URL") : "http://localhost:3001/api/users");
        dependencies.put("follow-service", System.getenv("FOLLOW_SERVICE_URL") != null ? 
            System.getenv("FOLLOW_SERVICE_URL") : "http://localhost:3007/api/follow");
        healthResponse.put("dependencies", dependencies);
        
        return ResponseEntity.ok(healthResponse);
    }
    
    private static final long START_TIME = System.currentTimeMillis();
    
    private long getUptimeInSeconds() {
        return (System.currentTimeMillis() - START_TIME) / 1000;
    }
}