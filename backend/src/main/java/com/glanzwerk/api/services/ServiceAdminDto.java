package com.glanzwerk.api.services;

import java.time.Instant;

/** A service as the dashboard edits it: both locales, and whether it is on offer. */
public record ServiceAdminDto(
        Long id,
        String serviceKey,
        String nameDe,
        String nameEn,
        String descriptionDe,
        String descriptionEn,
        int durationMinutes,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
