package com.glanzwerk.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class JwtConfigTest {

    @Test
    void refusesASecretTooShortToSignWith() {
        var config = new JwtConfig();
        config.setSecret("too-short");

        // Fails at startup rather than signing every token with a guessable key.
        assertThatThrownBy(config::deriveKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32");
    }

    @Test
    void acceptsASecretOfSufficientLength() {
        var config = new JwtConfig();
        config.setSecret("dev-only-insecure-secret-change-me-before-any-deployment");

        config.deriveKey();

        assertThat(config.getSecretKey()).isNotNull();
    }

    @Test
    void defaultsToAShortAccessTokenAndAWeekLongRefresh() {
        var config = new JwtConfig();

        assertThat(config.getAccessTokenExpiration()).isEqualTo(900);
        assertThat(config.getRefreshTokenExpiration()).isEqualTo(604800);
        // Secure by default; only the dev profile turns it off, for plain-HTTP localhost.
        assertThat(config.isCookieSecure()).isTrue();
    }
}
