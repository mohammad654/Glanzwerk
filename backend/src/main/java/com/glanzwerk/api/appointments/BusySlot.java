package com.glanzwerk.api.appointments;

import java.time.LocalDateTime;

/**
 * One window in which the business is already committed.
 *
 * A projection rather than the entity: working out a month of availability needs only
 * who is busy and when, and loading whole appointments to read three fields would drag
 * their client, service and notes along for nothing.
 *
 * {@code employeeId} is null for an appointment nobody has been assigned to yet. Those
 * are not free time — somebody still has to go — so they count against the team's
 * capacity for the slot rather than against one person's calendar.
 */
public record BusySlot(Long employeeId, LocalDateTime startTime, LocalDateTime endTime) {

    public boolean isAssigned() {
        return employeeId != null;
    }

    /** Whether this commitment overlaps the given window. Touching windows do not. */
    public boolean overlaps(LocalDateTime from, LocalDateTime to) {
        return startTime.isBefore(to) && endTime.isAfter(from);
    }
}
