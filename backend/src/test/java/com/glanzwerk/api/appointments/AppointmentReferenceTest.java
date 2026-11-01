package com.glanzwerk.api.appointments;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * The reference is derived from the id, so reading one has to be the exact inverse of
 * writing it. The dashboard's search box offers the reference, and what gets typed
 * into it is whatever the client reads down the phone.
 */
class AppointmentReferenceTest {
    @Test
    @DisplayName("every reference the API hands out parses back to the id it came from")
    void roundTripsEveryReference() {
        for (long id : new long[] {1L, 7L, 42L, 99999L, 100000L, 1234567L}) {
            var appointment = Appointment.builder().id(id).build();
            assertThat(Appointment.idFromReference(appointment.getReference())).isEqualTo(id);
        }
    }

    @ParameterizedTest
    @DisplayName("it tolerates what a person actually types")
    @ValueSource(strings = {"GW-00007", "gw-00007", "GW00007", "gw 7", "GW-7", "  GW-00007  "})
    void acceptsTheWaysPeopleWriteIt(String typed) {
        assertThat(Appointment.idFromReference(typed)).isEqualTo(7L);
    }

    @ParameterizedTest
    @DisplayName("anything that is not a reference is not one")
    @ValueSource(strings = {"Maria", "maria@example.com", "GW-", "GW-abc", "7", "00007", "GW-7x", ""})
    void rejectsEverythingElse(String typed) {
        assertThat(Appointment.idFromReference(typed)).isNull();
    }

    @Test
    @DisplayName("an unsaved appointment has no reference, and null is not a reference")
    void handlesTheAbsentCases() {
        assertThat(Appointment.builder().build().getReference()).isNull();
        assertThat(Appointment.idFromReference(null)).isNull();
    }
}
