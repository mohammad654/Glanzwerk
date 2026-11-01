package com.glanzwerk.api.common;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;

/**
 * One feature's contribution to the URL authorisation table.
 *
 * Each feature package declares what of itself is public, so the rules live next to
 * the endpoints they protect instead of in one list that drifts. {@code SecurityConfig}
 * collects every implementation and ends with {@code anyRequest().authenticated()},
 * which makes "authenticated" the default and every exception an explicit opt-in.
 */
public interface SecurityRules {
    void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry);
}
