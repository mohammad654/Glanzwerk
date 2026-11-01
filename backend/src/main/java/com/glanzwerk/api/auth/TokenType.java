package com.glanzwerk.api.auth;

/**
 * Which of the two tokens a JWT is.
 *
 * It is a claim rather than a convention so that a refresh token cannot be presented
 * as a bearer token. Without it, the long-lived refresh token would authenticate
 * every request for a week, which defeats the point of a short access token.
 */
public enum TokenType {
    ACCESS,
    REFRESH
}
