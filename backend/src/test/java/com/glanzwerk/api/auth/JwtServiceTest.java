package com.glanzwerk.api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.glanzwerk.api.users.Role;
import com.glanzwerk.api.users.User;

class JwtServiceTest {
    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        var config = new JwtConfig();
        config.setSecret("test-secret-long-enough-for-hs256-signing");
        config.setAccessTokenExpiration(900);
        config.setRefreshTokenExpiration(604800);
        config.deriveKey();

        jwtService = new JwtService(config);
        user = User.builder().id(42L).name("Admin").email("admin@glanzwerk.de").role(Role.ADMIN).build();
    }

    @Test
    void carriesTheUserIdAndRole() {
        var token = jwtService.generateAccessToken(user).toString();

        var parsed = jwtService.parseToken(token, TokenType.ACCESS);
        assertThat(parsed).isNotNull();
        assertThat(parsed.getUserId()).isEqualTo(42L);
        assertThat(parsed.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void refusesARefreshTokenPresentedAsABearerToken() {
        var refresh = jwtService.generateRefreshToken(user).toString();

        // The whole point of the type claim: without it this week-long token would
        // authenticate every request.
        assertThat(jwtService.parseToken(refresh, TokenType.ACCESS)).isNull();
        assertThat(jwtService.parseToken(refresh, TokenType.REFRESH)).isNotNull();
    }

    @Test
    void refusesATokenSignedWithAnotherKey() {
        var otherConfig = new JwtConfig();
        otherConfig.setSecret("a-completely-different-secret-of-sufficient-length");
        otherConfig.deriveKey();
        var forged = new JwtService(otherConfig).generateAccessToken(user).toString();

        assertThat(jwtService.parseToken(forged, TokenType.ACCESS)).isNull();
    }

    @Test
    void refusesRubbish() {
        assertThat(jwtService.parseToken("not-a-token", TokenType.ACCESS)).isNull();
        assertThat(jwtService.parseToken("", TokenType.ACCESS)).isNull();
    }

    @Test
    void refusesATokenThatHasExpired() {
        var config = new JwtConfig();
        config.setSecret("test-secret-long-enough-for-hs256-signing");
        // Negative lifetime: issued already expired.
        config.setAccessTokenExpiration(-60);
        config.deriveKey();

        var expired = new JwtService(config).generateAccessToken(user).toString();

        assertThat(jwtService.parseToken(expired, TokenType.ACCESS)).isNull();
    }
}
