package com.glanzwerk.api.auth;

import com.glanzwerk.api.users.UserDto;

/**
 * What login and refresh return.
 *
 * The access token comes back in the body so the SPA can hold it in memory rather
 * than in {@code localStorage}, where any injected script could read it. The refresh
 * token is never in the body: it goes out as an HttpOnly cookie, which JavaScript
 * cannot touch at all.
 *
 * {@code expiresIn} is seconds, so the client can refresh before a call fails rather
 * than after, and {@code user} saves a second round trip on sign-in.
 */
public record SessionResponse(String accessToken, int expiresIn, UserDto user) {
}
