package com.glanzwerk.api.appointments;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AppointmentStatusTest {

    @Test
    void movesForwardThroughTheWorkflow() {
        assertThat(AppointmentStatus.REQUESTED.canTransitionTo(AppointmentStatus.CONFIRMED)).isTrue();
        assertThat(AppointmentStatus.CONFIRMED.canTransitionTo(AppointmentStatus.IN_PROGRESS)).isTrue();
        assertThat(AppointmentStatus.IN_PROGRESS.canTransitionTo(AppointmentStatus.COMPLETED)).isTrue();
    }

    @Test
    void cannotSkipAStage() {
        assertThat(AppointmentStatus.REQUESTED.canTransitionTo(AppointmentStatus.COMPLETED)).isFalse();
        assertThat(AppointmentStatus.REQUESTED.canTransitionTo(AppointmentStatus.IN_PROGRESS)).isFalse();
    }

    @Test
    void cannotReopenAFinishedOrCancelledAppointment() {
        assertThat(AppointmentStatus.COMPLETED.allowedNext()).isEmpty();
        assertThat(AppointmentStatus.CANCELLED.allowedNext()).isEmpty();
    }

    @Test
    void anythingStillOpenCanBeCancelled() {
        assertThat(AppointmentStatus.REQUESTED.canTransitionTo(AppointmentStatus.CANCELLED)).isTrue();
        assertThat(AppointmentStatus.CONFIRMED.canTransitionTo(AppointmentStatus.CANCELLED)).isTrue();
        assertThat(AppointmentStatus.IN_PROGRESS.canTransitionTo(AppointmentStatus.CANCELLED)).isTrue();
    }

    @Test
    void onlyOpenStatusesHoldAnEmployeesCalendar() {
        assertThat(AppointmentStatus.blocking())
                .containsExactlyInAnyOrder(AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS)
                .doesNotContain(AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED);
    }
}
