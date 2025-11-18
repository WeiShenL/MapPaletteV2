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
public class DiscoveryResponse {
    
    @JsonProperty("users")
    private List<UserDto> users;
    
    @JsonProperty("totalCount")
    private int totalCount;
    
    @JsonProperty("followingCount")
    private int followingCount;
    
    @JsonProperty("limit")
    private int limit;
    
    @JsonProperty("offset")
    private int offset;
}