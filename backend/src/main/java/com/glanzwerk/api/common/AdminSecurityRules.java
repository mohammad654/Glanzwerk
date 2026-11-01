package com.glanzwerk.api.common;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * One rule covering the whole dashboard API.
 *
 * The controllers also carry {@code @PreAuthorize("hasRole('ADMIN')")}. That is not
 * redundant: this rule protects the URL space, the annotations protect the methods,
 * and a new admin controller mounted outside {@code /admin} — or this prefix being
 * renamed — still cannot be called by a client.
 */
@Component
public class AdminSecurityRules implements SecurityRules {
    @Override
    public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry) {
        registry.requestMatchers("/api/v1/admin/**").hasRole("ADMIN");
    }
}
