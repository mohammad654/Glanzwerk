package com.glanzwerk.api.appointments;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.EnumSet;
import java.util.Set;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/**
 * When appointments may be made, and how long one is.
 *
 * Configuration rather than constants because these are the business's hours, not
 * the software's: they will change before the code does, and an office manager
 * should not need a release to open Sundays or move to half-hour visits.
 */
@ConfigurationProperties(prefix = "glanzwerk.appointments")
@Getter
@Setter
public class AppointmentProperties {
    /**
     * The zone the wall-clock appointment times belong to.
     *
     * The {@code Clock} bean reads it instead of taking the JVM default, so the
     * lead-time and opening-hours rules are judged against Dresden's clock even when
     * the server runs in UTC — which is the normal container default.
     */
    private ZoneId zone = ZoneId.of("Europe/Berlin");

    /**
     * How long one appointment is, and therefore the step of the slot grid.
     *
     * Every appointment is the same length whatever service it is for: it is a visit
     * to look at the job, not the job. One length means one grid of times, which is
     * what lets the booking form offer "the whole day minus what is taken" instead of
     * a different set of start times per service.
     */
    private int slotMinutes = 60;

    private LocalTime opensAt = LocalTime.of(7, 0);

    /** An appointment must *end* by this time, not merely start before it. */
    private LocalTime closesAt = LocalTime.of(20, 0);

    private Set<DayOfWeek> openDays = EnumSet.of(
            DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY);

    /** How far ahead a request must be, so nobody books a visit for ten minutes' time. */
    private int minLeadTimeHours = 2;

    /** How far out a request may be, so the calendar cannot be filled with noise. */
    private int maxDaysAhead = 365;

    /** How many days of availability one request may ask about. */
    private int maxAvailabilityDays = 62;
}
