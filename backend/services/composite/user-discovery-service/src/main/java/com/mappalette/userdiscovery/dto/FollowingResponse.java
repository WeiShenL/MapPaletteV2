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
    private List<String> following;
    
    @JsonProperty("count")
    private int count;
}