package com.glanzwerk.api.auth;

import java.util.Date;

import org.springframework.stereotype.Service;

import com.glanzwerk.api.users.User;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtService {
    private final JwtConfig jwtConfig;

    public Jwt generateAccessToken(User user) {
        return generateToken(user, TokenType.ACCESS, jwtConfig.getAccessTokenExpiration());
    }

    public Jwt generateRefreshToken(User user) {
        return generateToken(user, TokenType.REFRESH, jwtConfig.getRefreshTokenExpiration());
    }

    private Jwt generateToken(User user, TokenType type, long secondsValid) {
        var now = System.currentTimeMillis();
        var claims = Jwts.claims()
                .subject(user.getId().toString())
                .add("email", user.getEmail())
                .add("name", user.getName())
                .add("role", user.getRole().name())
                .add("type", type.name())
                // The revocation check. See User#tokenVersion.
                .add("tv", user.getTokenVersion())
                .issuedAt(new Date(now))
                .expiration(new Date(now + secondsValid * 1000))
                .build();

        return new Jwt(claims, jwtConfig.getSecretKey());
    }

    /**
     * The parsed token, or null when the signature, structure or algorithm is wrong.
     *
     * Private on purpose: it says nothing about expiry or token type, so a caller that
     * reached for it would accept a week-old refresh token as a bearer credential.
     * {@link #parseToken(String, TokenType)} is the only way in.
     */
    private Jwt parseSignature(String token) {
        try {
            var claims = Jwts.parser()
                    .verifyWith(jwtConfig.getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return new Jwt(claims, jwtConfig.getSecretKey());
        } catch (JwtException | IllegalArgumentException exception) {
            return null;
        }
    }

    /** A valid, unexpired token of the expected type, or null. */
    public Jwt parseToken(String token, TokenType expectedType) {
        var jwt = parseSignature(token);
        if (jwt == null || jwt.isExpired() || !jwt.isOfType(expectedType)) {
            return null;
        }
        return jwt;
    }
}
