package com.glanzwerk.api.appointments;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.glanzwerk.api.common.BadRequestException;
import com.glanzwerk.api.employees.Employee;
import com.glanzwerk.api.employees.EmployeeService;
import com.glanzwerk.api.employees.JobRole;
import com.glanzwerk.api.services.ServiceOffering;

/**
 * What the booking form is offered.
 *
 * Two behaviours matter most here and are what the customer sees: a day the business
 * is closed never appears at all, and a day that does appear shows its whole row of
 * times minus the ones already taken.
 */
@ExtendWith(MockitoExtension.class)
class SlotCalendarTest {
    private static final ZoneId ZONE = ZoneId.of("Europe/Berlin");
    /** Wednesday 2026-10-28, 09:00. Sunday 2026-11-01 falls inside the test range. */
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 28);

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private EmployeeService employees;

    private SlotCalendar slots;
    private ServiceOffering service;
    private Employee maria;
    private Employee tomas;

    @BeforeEach
    void setUp() {
        var clock = Clock.fixed(TODAY.atTime(LocalTime.of(9, 0)).atZone(ZONE).toInstant(), ZONE);
        slots = new SlotCalendar(appointmentRepository, employees, new AppointmentProperties(), clock);

        service = ServiceOffering.builder().id(5L).serviceKey("office")
                .nameDe("Büroreinigung").nameEn("Office Cleaning").durationMinutes(150).active(true).build();

        maria = Employee.builder().id(11L).name("Maria Kowalski").jobRole(JobRole.SUPERVISOR)
                .weeklyHours(40).hiredOn(LocalDate.of(2023, 1, 1)).active(true).skills(Set.of(service)).build();
        tomas = Employee.builder().id(12L).name("Tomas Richter").jobRole(JobRole.CLEANER)
                .weeklyHours(35).hiredOn(LocalDate.of(2024, 1, 1)).active(true).skills(Set.of(service)).build();
    }

    @Test
    void offersEveryHourThatStillEndsByClosingTime() {
        // 07:00-20:00 in hour slots: 07:00 through 19:00, and not 20:00, because a
        // 20:00 start would run an hour past the shutters.
        assertThat(slots.gridTimes())
                .startsWith(LocalTime.of(7, 0))
                .endsWith(LocalTime.of(19, 0))
                .hasSize(13);
    }

    @Test
    void leavesOutDaysTheBusinessIsClosed() {
        availableWith(List.of(maria), List.of());

        var days = slots.availability(5L, TODAY, TODAY.plusDays(7), null);
        var dates = days.stream().map(DayAvailabilityDto::date).toList();

        // 2026-11-01 is a Sunday. It is absent, not present-and-empty: the picker
        // must not offer a date the server would then refuse.
        assertThat(dates).doesNotContain(LocalDate.of(2026, 11, 1));
        assertThat(dates).contains(LocalDate.of(2026, 10, 31), LocalDate.of(2026, 11, 2));
    }

    @Test
    void leavesOutOnlyTheTimesAlreadyTaken() {
        var friday = LocalDate.of(2026, 10, 30);
        availableWith(List.of(maria), List.of(
                new BusySlot(11L, friday.atTime(9, 0), friday.atTime(10, 0)),
                new BusySlot(11L, friday.atTime(14, 0), friday.atTime(15, 0))));

        var times = timesOn(slots.availability(5L, friday, friday, null), friday);

        assertThat(times).doesNotContain(LocalTime.of(9, 0), LocalTime.of(14, 0));
        // The rest of the day is still the whole grid.
        assertThat(times).contains(LocalTime.of(7, 0), LocalTime.of(8, 0), LocalTime.of(10, 0),
                LocalTime.of(15, 0), LocalTime.of(19, 0));
        assertThat(times).hasSize(11);
    }

    @Test
    void keepsASlotWhenOnlyOneOfTwoQualifiedColleaguesIsBusy() {
        var friday = LocalDate.of(2026, 10, 30);
        availableWith(List.of(maria, tomas), List.of(
                new BusySlot(11L, friday.atTime(9, 0), friday.atTime(10, 0))));

        // "Whoever is available" means the slot survives: Tomas can go.
        assertThat(timesOn(slots.availability(5L, friday, friday, null), friday))
                .contains(LocalTime.of(9, 0));
    }

    @Test
    void dropsASlotWhenEveryQualifiedColleagueIsBusy() {
        var friday = LocalDate.of(2026, 10, 30);
        availableWith(List.of(maria, tomas), List.of(
                new BusySlot(11L, friday.atTime(9, 0), friday.atTime(10, 0)),
                new BusySlot(12L, friday.atTime(9, 0), friday.atTime(10, 0))));

        assertThat(timesOn(slots.availability(5L, friday, friday, null), friday))
                .doesNotContain(LocalTime.of(9, 0));
    }

    @Test
    void narrowsToOnePersonsCalendarWhenOneIsAskedFor() {
        var friday = LocalDate.of(2026, 10, 30);
        availableWith(List.of(maria, tomas), List.of(
                new BusySlot(11L, friday.atTime(9, 0), friday.atTime(10, 0))));

        // Asking for Maria means Tomas being free is beside the point.
        assertThat(timesOn(slots.availability(5L, friday, friday, 11L), friday))
                .doesNotContain(LocalTime.of(9, 0));
        assertThat(timesOn(slots.availability(5L, friday, friday, 12L), friday))
                .contains(LocalTime.of(9, 0));
    }

    @Test
    void leavesOutTimesTodayThatAreAlreadyPastOrTooSoon() {
        availableWith(List.of(maria), List.of());

        var times = timesOn(slots.availability(5L, TODAY, TODAY, null), TODAY);

        // The clock says 09:00 and the lead time is two hours, so 11:00 is the first.
        assertThat(times).doesNotContain(LocalTime.of(7, 0), LocalTime.of(10, 0));
        assertThat(times).startsWith(LocalTime.of(11, 0));
    }

    @Test
    void countsAnUnassignedAppointmentAgainstTheTeamsCapacity() {
        var friday = LocalDate.of(2026, 10, 30);
        // One qualified colleague, and one visit already promised to nobody in
        // particular. She is the one who will have to go, so the slot is full.
        availableWith(List.of(maria), List.of(
                new BusySlot(null, friday.atTime(9, 0), friday.atTime(10, 0))));

        assertThat(timesOn(slots.availability(5L, friday, friday, null), friday))
                .doesNotContain(LocalTime.of(9, 0));
    }

    @Test
    void keepsASlotWhenThereAreMorePeopleThanPendingVisits() {
        var friday = LocalDate.of(2026, 10, 30);
        // Two qualified colleagues and one unassigned visit: there is still room.
        availableWith(List.of(maria, tomas), List.of(
                new BusySlot(null, friday.atTime(9, 0), friday.atTime(10, 0))));

        assertThat(timesOn(slots.availability(5L, friday, friday, null), friday))
                .contains(LocalTime.of(9, 0));
    }

    @Test
    void countsAssignedAndUnassignedTogether() {
        var friday = LocalDate.of(2026, 10, 30);
        // Two colleagues: one already booked by name, one visit owed to nobody. Both
        // are accounted for, so nothing is left.
        availableWith(List.of(maria, tomas), List.of(
                new BusySlot(11L, friday.atTime(9, 0), friday.atTime(10, 0)),
                new BusySlot(null, friday.atTime(9, 0), friday.atTime(10, 0))));

        assertThat(timesOn(slots.availability(5L, friday, friday, null), friday))
                .doesNotContain(LocalTime.of(9, 0));
    }

    @Test
    void offersNothingWhenNobodyIsTrainedForTheService() {
        when(employees.assignableFor(5L)).thenReturn(List.of());

        // No days at all, rather than a calendar of slots nobody could fill.
        assertThat(slots.availability(5L, TODAY, TODAY.plusDays(7), null)).isEmpty();
    }

    @Test
    void refusesAnAbsurdlyWideRange() {
        assertThatThrownBy(() -> slots.availability(5L, TODAY, TODAY.plusYears(5), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("at most");
    }

    @Test
    void refusesARangeThatEndsBeforeItBegins() {
        assertThatThrownBy(() -> slots.availability(5L, TODAY, TODAY.minusDays(1), null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void agreesWithWhatItOffers() {
        var friday = LocalDate.of(2026, 10, 30);
        availableWith(List.of(maria), List.of());

        // Every time the calendar offers must also pass the check a submission goes
        // through. If these two ever disagree, the form offers slots that fail.
        for (var time : timesOn(slots.availability(5L, friday, friday, null), friday)) {
            slots.requireValidSlot(friday.atTime(time));
        }
    }

    private void availableWith(List<Employee> candidates, List<BusySlot> busy) {
        when(employees.assignableFor(5L)).thenReturn(candidates);
        when(appointmentRepository.findCommitmentsInWindow(any(), any(), anyCollection()))
                .thenReturn(busy);
    }

    private List<LocalTime> timesOn(List<DayAvailabilityDto> days, LocalDate date) {
        return days.stream()
                .filter(day -> day.date().equals(date))
                .findFirst()
                .map(DayAvailabilityDto::times)
                .orElse(List.of());
    }
}
