package com.glanzwerk.api.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * Opens the OpenAPI UI, but only where it is enabled.
 *
 * In production {@code springdoc.api-docs.enabled} is false and these paths 404, so
 * permitting them there would advertise the whole API surface for nothing.
 */
@Component
public class SwaggerSecurityRules implements SecurityRules {
    private final boolean docsEnabled;

    public SwaggerSecurityRules(@Value("${springdoc.api-docs.enabled:false}") boolean docsEnabled) {
        this.docsEnabled = docsEnabled;
    }

    @Override
    public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry) {
        if (!docsEnabled) {
            return;
        }
        registry
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/swagger-ui.html").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll();
    }
}
