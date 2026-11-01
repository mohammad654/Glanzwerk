package com.glanzwerk.api.appointments;

import java.util.Set;

/**
 * Where a job is in its life, and what may happen to it next.
 *
 * The allowed transitions live on the enum rather than in the service, so there is
 * one place to read the workflow and no way to reach a state by a path nobody
 * considered. {@code COMPLETED} and {@code CANCELLED} are terminal: a finished job
 * cannot be un-finished, which is what makes it safe to invoice from.
 */
public enum AppointmentStatus {
    REQUESTED,
    CONFIRMED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED;

    public Set<AppointmentStatus> allowedNext() {
        return switch (this) {
            case REQUESTED -> Set.of(CONFIRMED, CANCELLED);
            case CONFIRMED -> Set.of(IN_PROGRESS, CANCELLED);
            case IN_PROGRESS -> Set.of(COMPLETED, CANCELLED);
            case COMPLETED, CANCELLED -> Set.of();
        };
    }

    public boolean canTransitionTo(AppointmentStatus next) {
        return allowedNext().contains(next);
    }

    /**
     * Statuses that still occupy an employee's calendar.
     *
     * A constant rather than a fresh {@code Set.of(...)} per call: this is read on every
     * availability query and every double-booking check, and it never varies.
     */
    private static final Set<AppointmentStatus> BLOCKING = Set.of(REQUESTED, CONFIRMED, IN_PROGRESS);

    public static Set<AppointmentStatus> blocking() {
        return BLOCKING;
    }
}
