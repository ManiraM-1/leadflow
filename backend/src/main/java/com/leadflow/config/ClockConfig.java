package com.leadflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.Duration;

@Configuration
public class ClockConfig {

    /**
     * Injected wherever the code needs "now", so tests can pin the time. Ticks in
     * milliseconds so timestamps survive the round trip through the database unchanged.
     */
    @Bean
    public Clock clock() {
        return Clock.tick(Clock.systemUTC(), Duration.ofMillis(1));
    }
}
