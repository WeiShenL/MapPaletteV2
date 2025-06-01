package com.mappalette.userdiscovery.client;

import com.mappalette.userdiscovery.dto.FollowingResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "follow-service", url = "${follow.service.url}")
public interface FollowServiceClient {
    
    @GetMapping("/following/{userId}")
    FollowingResponse getFollowing(@PathVariable("userId") String userId);
    
    @GetMapping("/followers/{userId}")
    FollowingResponse getFollowers(@PathVariable("userId") String userId);
}