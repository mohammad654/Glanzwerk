package com.glanzwerk.api.appointments;

/**
 * The overview page's figures, counted in the database rather than in the browser.
 *
 * {@code completed} is a count, not a sum of money: appointments are free, so there
 * is no revenue to total. What the office wants to know is how many visits have
 * actually happened.
 */
public record AppointmentStatsDto(
        long requested,
        long confirmed,
        long today,
        long next7Days,
        long completed
) {
}
