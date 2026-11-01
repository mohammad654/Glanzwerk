package com.glanzwerk.api.auth;

import com.glanzwerk.api.users.UserDto;

/** What a successful login produces internally, before the controller splits it. */
public record LoginResult(Jwt accessToken, Jwt refreshToken, UserDto user) {
}
