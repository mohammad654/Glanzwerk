package com.glanzwerk.api.auth;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@ConfigurationProperties(prefix = "glanzwerk.jwt")
@Validated
@Getter
@Setter
public class JwtConfig {
    /** Minimum key length for HS256, in bytes, per RFC 7518. */
    private static final int MIN_SECRET_BYTES = 32;

    @NotBlank(message = "glanzwerk.jwt.secret must be set (see backend/.env.example)")
    private String secret;

    /** Seconds. Short, because a stolen access token cannot be revoked. */
    @Min(60)
    private int accessTokenExpiration = 900;

    /** Seconds. The refresh cookie's lifetime, and so the length of a session. */
    @Min(300)
    private int refreshTokenExpiration = 604800;

    /**
     * Whether the refresh cookie is marked {@code Secure}. False only for plain-HTTP
     * local development: with it on, a browser never sends the cookie back over
     * {@code http://localhost} and the session silently dies on reload.
     */
    private boolean cookieSecure = true;

    private SecretKey secretKey;

    @PostConstruct
    void deriveKey() {
        var bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_SECRET_BYTES) {
            // Fail at startup rather than sign tokens with a guessable key.
            throw new IllegalStateException(
                    "glanzwerk.jwt.secret must be at least " + MIN_SECRET_BYTES + " characters");
        }
        this.secretKey = Keys.hmacShaKeyFor(bytes);
    }

    public SecretKey getSecretKey() {
        return secretKey;
    }
}
