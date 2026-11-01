package com.glanzwerk.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Scheduling is on for one job: sweeping spent password reset tokens. See
 * {@code PasswordResetTokenCleanup}.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class GlanzwerkApplication {

    public static void main(String[] args) {
        SpringApplication.run(GlanzwerkApplication.class, args);
    }
}
