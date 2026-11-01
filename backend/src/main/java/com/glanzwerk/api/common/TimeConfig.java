package com.glanzwerk.api.common;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.glanzwerk.api.appointments.AppointmentProperties;

@Configuration
public class TimeConfig {

    /**
     * The clock every time-dependent rule reads.
     *
     * Pinned to the business's own zone rather than taken from the JVM default. Appointment
     * times are wall-clock {@code LocalDateTime} in Dresden, and the slot rules compare
     * them against {@code LocalDateTime.now(clock)} — so a server running in UTC, which
     * is the normal container default, would judge "at least two hours ahead" and the
     * opening hours against a clock an hour or two off the times it is comparing.
     *
     * Injected rather than called statically so "is this slot in the past?" can be
     * tested without waiting for the clock to move.
     */
    @Bean
    public Clock clock(AppointmentProperties appointments) {
        return Clock.system(appointments.getZone());
    }
}
