package com.mappalette.userdiscovery.client;

import com.mappalette.userdiscovery.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@FeignClient(name = "user-service", url = "${user.service.url}")
public interface UserServiceClient {
    
    @GetMapping("/all")
    List<UserDto> getAllUsers();
    
    @GetMapping("/{userId}")
    UserDto getUserById(@PathVariable("userId") String userId);
}