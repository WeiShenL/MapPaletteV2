package com.mappalette.userdiscovery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("userID")
    private String userID;
    
    @JsonProperty("username")
    private String username;
    
    @JsonProperty("profilePicture")
    private String profilePicture;
    
    @JsonProperty("isProfilePrivate")
    private boolean isProfilePrivate;
    
    @JsonProperty("isFollowing")
    private boolean isFollowing;
    
    @JsonProperty("numFollowers")
    private Integer numFollowers;
    
    @JsonProperty("numFollowing")
    private Integer numFollowing;
}