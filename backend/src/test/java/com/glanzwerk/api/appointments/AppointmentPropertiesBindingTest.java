package com.glanzwerk.api.appointments;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

/**
 * Binds `application.yaml`'s appointment block the way Spring does at startup.
 *
 * Config binding is the one kind of mistake the compiler cannot see and the unit
 * tests never reach: a comma-separated day list that does not become a
 * {@code Set<DayOfWeek>}, or a time written in a format {@code LocalTime} will not
 * take, fails when the application boots and not before. These are the exact strings
 * from `application.yaml`.
 */
class AppointmentPropertiesBindingTest {

    @Test
    void bindsTheValuesFromApplicationYaml() {
        var source = new MapConfigurationPropertySource(Map.of(
                "glanzwerk.appointments.zone", "Europe/Berlin",
                "glanzwerk.appointments.slot-minutes", "60",
                "glanzwerk.appointments.opens-at", "07:00",
                "glanzwerk.appointments.closes-at", "20:00",
                "glanzwerk.appointments.open-days", "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY",
                "glanzwerk.appointments.min-lead-time-hours", "2",
                "glanzwerk.appointments.max-days-ahead", "365"
        ));

        var properties = new Binder(source)
                .bind("glanzwerk.appointments", AppointmentProperties.class)
                .get();

        assertThat(properties.getZone()).isEqualTo(ZoneId.of("Europe/Berlin"));
        assertThat(properties.getOpensAt()).isEqualTo(LocalTime.of(7, 0));
        assertThat(properties.getClosesAt()).isEqualTo(LocalTime.of(20, 0));
        assertThat(properties.getOpenDays())
                .containsExactlyInAnyOrder(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                        DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY)
                .doesNotContain(DayOfWeek.SUNDAY);
        assertThat(properties.getMinLeadTimeHours()).isEqualTo(2);
        assertThat(properties.getMaxDaysAhead()).isEqualTo(365);
        assertThat(properties.getSlotMinutes()).isEqualTo(60);
    }

    @Test
    void defaultsToSixWorkingDaysWhenNothingIsConfigured() {
        var properties = new AppointmentProperties();

        assertThat(properties.getOpenDays()).hasSize(6).doesNotContain(DayOfWeek.SUNDAY);
        assertThat(properties.getZone()).isEqualTo(ZoneId.of("Europe/Berlin"));
        assertThat(properties.getOpensAt()).isEqualTo(LocalTime.of(7, 0));
    }
}
