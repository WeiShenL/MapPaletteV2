package com.mappalette.userdiscovery.client;

import com.mappalette.userdiscovery.dto.UserDto;
import com.mappalette.userdiscovery.dto.PaginatedUsersResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;

@FeignClient(name = "user-service", url = "${user.service.url}")
public interface UserServiceClient {
    
    @GetMapping("/api/users/all")
    PaginatedUsersResponse getAllUsers(@RequestParam(value = "limit", defaultValue = "100") int limit);
    
    @GetMapping("/api/users/{userId}")
    UserDto getUserById(@PathVariable("userId") String userId);
}