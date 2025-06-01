package com.mappalette.userdiscovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class UserDiscoveryApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(UserDiscoveryApplication.class, args);
    }
}