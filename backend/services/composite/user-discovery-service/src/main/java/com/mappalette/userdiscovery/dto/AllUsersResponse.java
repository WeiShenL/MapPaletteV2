package com.mappalette.userdiscovery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllUsersResponse {
    
    @JsonProperty("friends")
    private List<UserDto> friends;
    
    @JsonProperty("otherUsers")
    private List<UserDto> otherUsers;
    
    @JsonProperty("totalFriendsCount")
    private int totalFriendsCount;
    
    @JsonProperty("totalOtherUsersCount")
    private int totalOtherUsersCount;
    
    @JsonProperty("limit")
    private int limit;
    
    @JsonProperty("offset")
    private int offset;
}