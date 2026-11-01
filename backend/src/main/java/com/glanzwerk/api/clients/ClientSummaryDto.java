package com.glanzwerk.api.clients;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * A client as the dashboard lists them: the account, plus what their history adds up
 * to. The aggregates are computed in the database, because counting appointments per
 * client in Java would mean one query per row.
 *
 * {@code completedAppointments} is a count, not a sum of money: appointments are free.
 */
public record ClientSummaryDto(
        Long id,
        String name,
        String email,
        String phone,
        boolean active,
        Instant registeredAt,
        long appointmentCount,
        LocalDateTime lastAppointmentAt,
        long completedAppointments
) {
}
