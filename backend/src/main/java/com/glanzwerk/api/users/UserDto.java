package com.glanzwerk.api.users;

import java.time.Instant;

/** An account as the API returns it. The password hash has no field here by design. */
public record UserDto(
        Long id,
        String name,
        String email,
        String phone,
        Role role,
        boolean active,
        Instant createdAt
) {
}
