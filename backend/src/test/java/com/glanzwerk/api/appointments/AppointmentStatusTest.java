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
    void reopensAFinishedOrCancelledAppointmentToTheStart() {
        // Back to REQUESTED rather than to whatever it was before, so the job is
        // re-confirmed and re-assigned deliberately instead of silently resuming.
        assertThat(AppointmentStatus.COMPLETED.allowedNext())
                .containsExactly(AppointmentStatus.REQUESTED);
        assertThat(AppointmentStatus.CANCELLED.allowedNext())
                .containsExactly(AppointmentStatus.REQUESTED);
    }

    @Test
    void reopeningIsTheOnlyWayOutOfATerminalStatus() {
        assertThat(AppointmentStatus.COMPLETED.canTransitionTo(AppointmentStatus.IN_PROGRESS)).isFalse();
        assertThat(AppointmentStatus.COMPLETED.canTransitionTo(AppointmentStatus.CANCELLED)).isFalse();
        assertThat(AppointmentStatus.CANCELLED.canTransitionTo(AppointmentStatus.CONFIRMED)).isFalse();
        assertThat(AppointmentStatus.CANCELLED.canTransitionTo(AppointmentStatus.COMPLETED)).isFalse();
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
