package com.glanzwerk.api.appointments;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * An appointment, joined to the records it points at.
 *
 * No price field: appointments are free. One DTO serves both the dashboard and a
 * client's own list, which is safe because a client can only ever fetch their own —
 * so the client block holds their own details, and the employee block is a name and
 * a job role, never contact details.
 */
public record AppointmentDto(
        Long id,
        String reference,
        ClientSummary client,
        ServiceSummary service,
        EmployeeSummary employee,
        LocalDateTime startTime,
        LocalDateTime endTime,
        int durationMinutes,
        AppointmentStatus status,
        String street,
        String postalCode,
        String city,
        String notes,
        Instant createdAt
) {
    public record ClientSummary(Long id, String name, String email, String phone) {
    }

    public record ServiceSummary(Long id, String serviceKey, String name) {
    }

    public record EmployeeSummary(Long id, String name, String jobRole) {
    }
}
