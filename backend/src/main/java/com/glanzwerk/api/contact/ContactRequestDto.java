package com.glanzwerk.api.contact;

import java.time.Instant;

/** An enquiry as the dashboard lists it. */
public record ContactRequestDto(
        Long id,
        String name,
        String email,
        String phone,
        Long serviceId,
        String serviceName,
        String message,
        ContactRequestStatus status,
        String adminNotes,
        Instant createdAt,
        Instant updatedAt
) {
}
