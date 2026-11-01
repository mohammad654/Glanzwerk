package com.glanzwerk.api.services;

/**
 * A service as the public site and the appointment form see it: one locale, no audit
 * columns, and no indication that an inactive version of it might exist.
 *
 * No price — appointments are free and the work is quoted after a visit.
 */
public record ServiceDto(
        Long id,
        String serviceKey,
        String name,
        String description,
        int durationMinutes
) {
}
