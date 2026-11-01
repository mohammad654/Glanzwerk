package com.glanzwerk.api.auth;

import java.util.Date;

import javax.crypto.SecretKey;

import com.glanzwerk.api.users.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

/** A parsed or freshly built token. {@code toString()} is its signed, compact form. */
public class Jwt {
    private final Claims claims;
    private final SecretKey secretKey;

    Jwt(Claims claims, SecretKey secretKey) {
        this.claims = claims;
        this.secretKey = secretKey;
    }

    public boolean isExpired() {
        return claims.getExpiration().before(new Date());
    }

    /**
     * The account's token version at the moment this was minted.
     *
     * Absent means zero, which is what tokens issued before the claim existed carry —
     * and the column defaults to zero, so those sessions keep working rather than all
     * being signed out by the deployment that introduced this.
     */
    public int getTokenVersion() {
        var version = claims.get("tv", Integer.class);
        return version == null ? 0 : version;
    }

    public Long getUserId() {
        return Long.valueOf(claims.getSubject());
    }

    public Role getRole() {
        return Role.valueOf(claims.get("role", String.class));
    }

    public TokenType getType() {
        var type = claims.get("type", String.class);
        return type == null ? null : TokenType.valueOf(type);
    }

    public boolean isOfType(TokenType expected) {
        return expected == getType();
    }

    @Override
    public String toString() {
        return Jwts.builder().claims(claims).signWith(secretKey).compact();
    }
}
