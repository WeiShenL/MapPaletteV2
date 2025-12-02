package com.mappalette.userdiscovery.service;

import com.mappalette.userdiscovery.client.FollowServiceClient;
import com.mappalette.userdiscovery.client.UserServiceClient;
import com.mappalette.userdiscovery.dto.AllUsersResponse;
import com.mappalette.userdiscovery.dto.DiscoveryResponse;
import com.mappalette.userdiscovery.dto.FollowingResponse;
import com.mappalette.userdiscovery.dto.PaginatedUsersResponse;
import com.mappalette.userdiscovery.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDiscoveryService {
    
    private final UserServiceClient userServiceClient;
    private final FollowServiceClient followServiceClient;
    
    private static final String DEFAULT_PROFILE_PICTURE = "/resources/images/default-profile.png";
    
    public DiscoveryResponse discoverUsers(String userId, int limit, int offset, boolean suggestionsOnly) {
        log.info("Discovering users for userId: {}, limit: {}, offset: {}, suggestionsOnly: {}", 
                userId, limit, offset, suggestionsOnly);
        
        try {
            // Step 1: Get all users from user service
            PaginatedUsersResponse response = userServiceClient.getAllUsers(1000);
            List<UserDto> allUsers = response.getUsers() != null ? response.getUsers() : new ArrayList<>();
            log.info("Retrieved {} total users from user service", allUsers.size());
            
            // Step 2: Get the current user's following list
            Set<String> followingIds = getFollowingIds(userId);
            log.info("User {} is following {} users", userId, followingIds.size());
            
            // Step 3: Filter users
            List<UserDto> discoveredUsers = allUsers.stream()
                .filter(user -> {
                    String userIdToCheck = user.getUserID() != null ? user.getUserID() : user.getId();
                    
                    // Skip current user
                    if (userIdToCheck.equals(userId)) {
                        return false;
                    }
                    
                    // Skip users that are already being followed
                    if (followingIds.contains(userIdToCheck)) {
                        return false;
                    }
                    
                    // Skip private profiles (since user doesn't follow them)
                    if (user.isProfilePrivate()) {
                        return false;
                    }
                    
                    return true;
                })
                .map(user -> {
                    // Ensure consistent data format
                    if (user.getId() == null && user.getUserID() != null) {
                        user.setId(user.getUserID());
                    } else if (user.getUserID() == null && user.getId() != null) {
                        user.setUserID(user.getId());
                    }
                    
                    // Set default profile picture if not present
                    if (user.getProfilePicture() == null || user.getProfilePicture().isEmpty()) {
                        user.setProfilePicture(DEFAULT_PROFILE_PICTURE);
                    }
                    
                    // Explicitly set isFollowing to false (they're not followed)
                    user.setFollowing(false);
                    
                    return user;
                })
                .collect(Collectors.toList());
            
            log.info("Found {} discoverable users after filtering", discoveredUsers.size());
            
            // Step 4: Apply pagination
            int totalCount = discoveredUsers.size();
            int fromIndex = Math.min(offset, totalCount);
            int toIndex = Math.min(offset + limit, totalCount);
            
            List<UserDto> paginatedUsers = discoveredUsers.subList(fromIndex, toIndex);
            
            // Step 5: If suggestions only, shuffle for variety
            if (suggestionsOnly && !paginatedUsers.isEmpty()) {
                paginatedUsers = new ArrayList<>(paginatedUsers);
                java.util.Collections.shuffle(paginatedUsers);
                paginatedUsers = paginatedUsers.stream()
                    .limit(limit)
                    .collect(Collectors.toList());
            }
            
            return DiscoveryResponse.builder()
                .users(paginatedUsers)
                .totalCount(totalCount)
                .followingCount(followingIds.size())
                .limit(limit)
                .offset(offset)
                .build();
                
        } catch (Exception e) {
            log.error("Error discovering users for userId: {}", userId, e);
            // Return empty response on error
            return DiscoveryResponse.builder()
                .users(new ArrayList<>())
                .totalCount(0)
                .followingCount(0)
                .limit(limit)
                .offset(offset)
                .build();
        }
    }
    
    public AllUsersResponse getAllUserData(String userId, int friendsLimit, int othersLimit) {
        log.info("Getting all user data for userId: {}, friendsLimit: {}, othersLimit: {}", userId, friendsLimit, othersLimit);
        
        try {
            // Step 1: Get all users from user service (max limit is 100)
            PaginatedUsersResponse response = userServiceClient.getAllUsers(100);
            List<UserDto> allUsers = response.getUsers() != null ? response.getUsers() : new ArrayList<>();
            log.info("Retrieved {} total users from user service", allUsers.size());
            
            // Step 2: Get the current user's following list
            Set<String> followingIds = getFollowingIds(userId);
            log.info("User {} is following {} users", userId, followingIds.size());
            
            // Step 3: Separate users into friends and other users
            List<UserDto> friends = new ArrayList<>();
            List<UserDto> otherUsers = new ArrayList<>();
            
            for (UserDto user : allUsers) {
                String userIdToCheck = user.getUserID() != null ? user.getUserID() : user.getId();
                
                // Skip current user
                if (userIdToCheck.equals(userId)) {
                    continue;
                }
                
                // Ensure consistent data format
                if (user.getId() == null && user.getUserID() != null) {
                    user.setId(user.getUserID());
                } else if (user.getUserID() == null && user.getId() != null) {
                    user.setUserID(user.getId());
                }
                
                // Set default profile picture if not present
                if (user.getProfilePicture() == null || user.getProfilePicture().isEmpty()) {
                    user.setProfilePicture(DEFAULT_PROFILE_PICTURE);
                }
                
                // Check if this user is a friend
                if (followingIds.contains(userIdToCheck)) {
                    user.setFollowing(true);
                    friends.add(user);
                } else if (!user.isProfilePrivate()) {
                    // Only include non-private profiles in other users
                    user.setFollowing(false);
                    otherUsers.add(user);
                }
            }
            
            log.info("Found {} friends and {} other users", friends.size(), otherUsers.size());
            
            // Step 4: Apply limits to friends and other users
            List<UserDto> limitedFriends = friends.stream().limit(friendsLimit).collect(Collectors.toList());
            List<UserDto> limitedOtherUsers = otherUsers.stream().limit(othersLimit).collect(Collectors.toList());
            
            return AllUsersResponse.builder()
                .friends(limitedFriends)
                .otherUsers(limitedOtherUsers)
                .totalFriendsCount(friends.size())
                .totalOtherUsersCount(otherUsers.size())
                .limit(othersLimit)
                .offset(0)
                .build();
                
        } catch (Exception e) {
            log.error("Error getting all user data for userId: {}", userId, e);
            // Return empty response on error
            return AllUsersResponse.builder()
                .friends(new ArrayList<>())
                .otherUsers(new ArrayList<>())
                .totalFriendsCount(0)
                .totalOtherUsersCount(0)
                .limit(othersLimit)
                .offset(0)
                .build();
        }
    }
    
    private Set<String> getFollowingIds(String userId) {
        try {
            FollowingResponse followingResponse = followServiceClient.getFollowing(userId);
            if (followingResponse != null && followingResponse.getFollowing() != null) {
                // Extract IDs from the user objects
                return followingResponse.getFollowing().stream()
                    .map(FollowingResponse.FollowingUserDto::getId)
                    .filter(id -> id != null)
                    .collect(java.util.stream.Collectors.toSet());
            }
        } catch (Exception e) {
            log.warn("Could not retrieve following list for user {}: {}", userId, e.getMessage());
        }
        return new HashSet<>();
    }
}