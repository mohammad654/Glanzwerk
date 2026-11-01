package com.glanzwerk.api.auth;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/**
 * The browser origins allowed to call the API.
 *
 * A list, not a wildcard: the refresh cookie is sent with credentials, and
 * {@code Access-Control-Allow-Origin: *} is not permitted with credentials at all.
 * Both locale builds are served from one origin, so this is usually a single entry.
 */
@ConfigurationProperties(prefix = "glanzwerk.cors")
@Getter
@Setter
public class CorsProperties {
    private List<String> allowedOrigins = List.of();
}
