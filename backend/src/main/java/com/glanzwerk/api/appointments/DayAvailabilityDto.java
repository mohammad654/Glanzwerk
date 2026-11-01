package com.glanzwerk.api.appointments;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * One day a client may choose, and the times still free on it.
 *
 * Only days with at least one free time are ever returned, so a closed day, a fully
 * booked day and a day in the past are simply absent — the picker has nothing to grey
 * out, because it never learns those dates exist.
 *
 * Times are formatted {@code HH:mm} rather than as the default {@code HH:mm:ss}: they
 * are slot labels on a fixed grid, and the seconds would be noise in every one.
 */
public record DayAvailabilityDto(
        LocalDate date,
        @JsonFormat(pattern = "HH:mm") List<LocalTime> times
) {
}
