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
public class FollowingResponse {
    
    @JsonProperty("following")
    private List<FollowingUserDto> following;
    
    @JsonProperty("pagination")
    private PaginationDto pagination;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FollowingUserDto {
        @JsonProperty("id")
        private String id;
        
        @JsonProperty("username")
        private String username;
        
        @JsonProperty("profilePicture")
        private String profilePicture;
        
        @JsonProperty("points")
        private Integer points;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationDto {
        @JsonProperty("page")
        private int page;
        
        @JsonProperty("limit")
        private int limit;
        
        @JsonProperty("total")
        private int total;
        
        @JsonProperty("totalPages")
        private int totalPages;
    }
}