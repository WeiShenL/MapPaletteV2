package com.mappalette.userdiscovery.config;

import feign.Logger;
import feign.Request;
import feign.Retryer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class FeignConfig {
    
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
    
    @Bean
    public Request.Options requestOptions() {
        return new Request.Options(
            5000, TimeUnit.MILLISECONDS,
            10000, TimeUnit.MILLISECONDS,
            true
        );
    }
    
    @Bean
    public Retryer retryer() {
        return new Retryer.Default(100, 1000, 3);
    }
}