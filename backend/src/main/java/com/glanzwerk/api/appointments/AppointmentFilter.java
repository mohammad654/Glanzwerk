package com.glanzwerk.api.appointments;

import java.time.LocalDate;

import com.glanzwerk.api.common.Text;

/**
 * The dashboard's filter row, as one object.
 *
 * {@code likeQuery()} is what reaches the database: {@link Text#likePattern} lowercases
 * the text, wraps it in wildcards and escapes the ones the user typed, so the
 * repository's JPQL compares two plain bound parameters. The value is never
 * concatenated into the query, so a search for {@code ' or 1=1 --} finds the clients
 * whose name contains that text and nothing else happens.
 */
public record AppointmentFilter(
        AppointmentStatus status,
        Long employeeId,
        Long clientId,
        LocalDate from,
        LocalDate to,
        String query
) {
    /**
     * The id the search text refers to, when it is a reference like {@code GW-00007}.
     *
     * The reference is derived from the id rather than stored, so there is no column
     * to match it against — but the dashboard's search box offers it, and it is what
     * a client quotes on the phone.
     */
    public Long referenceId() {
        return Appointment.idFromReference(query);
    }

    public String likeQuery() {
        return Text.likePattern(query);
    }
}
