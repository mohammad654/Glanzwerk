package com.glanzwerk.api.appointments;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.glanzwerk.api.common.BadRequestException;
import com.glanzwerk.api.common.ConflictException;
import com.glanzwerk.api.common.NotFoundException;
import com.glanzwerk.api.employees.Employee;
import com.glanzwerk.api.employees.EmployeeService;
import com.glanzwerk.api.employees.JobRole;
import com.glanzwerk.api.services.ServiceCatalogService;
import com.glanzwerk.api.services.ServiceOffering;
import com.glanzwerk.api.users.Role;
import com.glanzwerk.api.users.User;
import com.glanzwerk.api.users.UserService;

/**
 * The rules a client must not be able to talk their way around: the slot, the length,
 * and whose appointment it is. Nothing about money, because appointments are free.
 *
 * {@link SlotCalendar} is the real one rather than a mock, built from the same stubs:
 * the point of several of these tests is that the rules the calendar offers and the
 * rules the service enforces are the same rules.
 */
@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {
    private static final ZoneId ZONE = ZoneId.of("Europe/Berlin");
    /** A Wednesday, 09:00 local, so "tomorrow at 10:00" is a normal working slot. */
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 28);
    private static final LocalDateTime TOMORROW_AT_TEN = TODAY.plusDays(1).atTime(10, 0);

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private ServiceCatalogService catalog;
    @Mock
    private EmployeeService employees;
    @Mock
    private UserService users;

    private AppointmentService appointments;
    private ServiceOffering service;
    private User client;
    private Employee employee;

    @BeforeEach
    void setUp() {
        var clock = Clock.fixed(TODAY.atTime(LocalTime.of(9, 0)).atZone(ZONE).toInstant(), ZONE);
        var properties = new AppointmentProperties();
        var slots = new SlotCalendar(appointmentRepository, employees, properties, clock);

        appointments = new AppointmentService(appointmentRepository, catalog, employees, users,
                new AppointmentMapper(), properties, slots, clock);

        service = ServiceOffering.builder()
                .id(5L).serviceKey("office").nameDe("Büroreinigung").nameEn("Office Cleaning")
                .durationMinutes(150).active(true)
                .build();

        client = User.builder()
                .id(7L).name("Medienhaus Elbtal GmbH").email("vogt@example.de")
                .role(Role.CLIENT).active(true).createdAt(Instant.now())
                .build();

        employee = Employee.builder()
                .id(11L).name("Maria Kowalski").jobRole(JobRole.SUPERVISOR)
                .weeklyHours(40).hiredOn(LocalDate.of(2023, 1, 1)).active(true)
                .skills(Set.of(service))
                .build();
    }

    @Test
    void makesEveryAppointmentOneFixedSlotRegardlessOfTheService() {
        requestedSlotIsFree();
        when(catalog.requireBookable(5L)).thenReturn(service);
        when(users.require(7L)).thenReturn(client);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(call -> call.getArgument(0));

        appointments.create(7L, request(null, TOMORROW_AT_TEN), Locale.GERMAN);

        var saved = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(saved.capture());
        // One hour, not the service's 150 minutes: an appointment is a visit, not the job.
        assertThat(saved.getValue().getEndTime()).isEqualTo(TOMORROW_AT_TEN.plusHours(1));
        assertThat(saved.getValue().getStatus()).isEqualTo(AppointmentStatus.REQUESTED);
    }

    @Test
    void booksForTheAuthenticatedCallerAndNobodyElse() {
        requestedSlotIsFree();
        when(catalog.requireBookable(5L)).thenReturn(service);
        when(users.require(7L)).thenReturn(client);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(call -> call.getArgument(0));

        appointments.create(7L, request(null, TOMORROW_AT_TEN), Locale.GERMAN);

        var saved = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(saved.capture());
        assertThat(saved.getValue().getClient().getId()).isEqualTo(7L);
    }

    @Test
    void refusesAnEmployeeWhoIsAlreadyBookedOverThatSlot() {
        when(catalog.requireBookable(5L)).thenReturn(service);
        when(employees.requireAssignable(11L, service)).thenReturn(employee);
        when(appointmentRepository.hasConflict(eq(11L), any(), any(), anyCollection(), eq(null)))
                .thenReturn(true);

        assertThatThrownBy(() -> appointments.create(7L, request(11L, TOMORROW_AT_TEN), Locale.GERMAN))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already has an appointment");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void refusesASlotWhenTheWholeQualifiedTeamIsBusy() {
        when(catalog.requireBookable(5L)).thenReturn(service);
        when(employees.assignableFor(5L)).thenReturn(List.of(employee));
        when(appointmentRepository.findCommitmentsInWindow(any(), any(), anyCollection()))
                .thenReturn(List.of(new BusySlot(11L, TOMORROW_AT_TEN, TOMORROW_AT_TEN.plusHours(1))));

        // Nobody was asked for by name, so accepting this would promise a visit that
        // no qualified colleague could actually make.
        assertThatThrownBy(() -> appointments.create(7L, request(null, TOMORROW_AT_TEN), Locale.GERMAN))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Nobody is available");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void refusesATimeThatIsNotOnTheSlotGrid() {
        when(catalog.requireBookable(5L)).thenReturn(service);

        // 10:13 would otherwise be a slot nobody else is ever offered, blocking two.
        assertThatThrownBy(() ->
                appointments.create(7L, request(null, TODAY.plusDays(1).atTime(10, 13)), Locale.GERMAN))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("one of the times offered");
    }

    @Test
    void refusesASlotInThePast() {
        when(catalog.requireBookable(5L)).thenReturn(service);

        assertThatThrownBy(() -> appointments.create(7L, request(null, TODAY.atTime(8, 0)), Locale.GERMAN))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void refusesASlotTooSoonToStaff() {
        when(catalog.requireBookable(5L)).thenReturn(service);

        // The clock says 09:00 and the lead time is two hours.
        assertThatThrownBy(() -> appointments.create(7L, request(null, TODAY.atTime(10, 0)), Locale.GERMAN))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hours from now");
    }

    @Test
    void refusesADayWeDoNotWork() {
        when(catalog.requireBookable(5L)).thenReturn(service);

        // 2026-11-01 is a Sunday.
        assertThatThrownBy(() ->
                appointments.create(7L, request(null, LocalDate.of(2026, 11, 1).atTime(10, 0)), Locale.GERMAN))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("do not work");
    }

    @Test
    void letsAClientCancelTheirOwnAppointment() {
        var appointment = existing(AppointmentStatus.CONFIRMED, client);
        when(appointmentRepository.findDetailed(99L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(call -> call.getArgument(0));

        var result = appointments.cancelAsClient(7L, 99L, Locale.GERMAN);

        assertThat(result.status()).isEqualTo(AppointmentStatus.CANCELLED);
    }

    @Test
    void hidesSomebodyElsesAppointmentRatherThanRefusingIt() {
        var appointment = existing(AppointmentStatus.CONFIRMED, client);
        when(appointmentRepository.findDetailed(99L)).thenReturn(Optional.of(appointment));

        // 404, not 403: a 403 would confirm that appointment 99 exists.
        assertThatThrownBy(() -> appointments.cancelAsClient(8L, 99L, Locale.GERMAN))
                .isInstanceOf(NotFoundException.class);

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void willNotCancelAFinishedVisit() {
        var appointment = existing(AppointmentStatus.COMPLETED, client);
        when(appointmentRepository.findDetailed(99L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointments.cancelAsClient(7L, 99L, Locale.GERMAN))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void willNotConfirmAnAppointmentWithNobodyOnIt() {
        var appointment = existing(AppointmentStatus.REQUESTED, client);
        when(appointmentRepository.findDetailed(99L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointments.changeStatus(99L, AppointmentStatus.CONFIRMED, Locale.GERMAN))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Assign an employee");
    }

    @Test
    void reopensACancelledVisitWhenItsSlotIsStillFree() {
        var appointment = existing(AppointmentStatus.CANCELLED, client);
        appointment.setEmployee(employee);
        when(appointmentRepository.findDetailed(99L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.hasConflict(eq(11L), any(), any(), anyCollection(), eq(99L)))
                .thenReturn(false);

        var result = appointments.changeStatus(99L, AppointmentStatus.REQUESTED, Locale.GERMAN);

        assertThat(result.status()).isEqualTo(AppointmentStatus.REQUESTED);
    }

    @Test
    void willNotReopenAVisitOntoASlotSomebodyElseNowHas() {
        // Cancelling freed the slot, so the office may well have given it away. Putting
        // the appointment back would double-book the employee without saying so.
        var appointment = existing(AppointmentStatus.CANCELLED, client);
        appointment.setEmployee(employee);
        when(appointmentRepository.findDetailed(99L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.hasConflict(eq(11L), any(), any(), anyCollection(), eq(99L)))
                .thenReturn(true);

        assertThatThrownBy(() -> appointments.changeStatus(99L, AppointmentStatus.REQUESTED, Locale.GERMAN))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already has an appointment");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void doesNotReCheckTheSlotForAnOrdinaryStepAlongTheWorkflow() {
        // The appointment already holds this slot, so asking whether it is free would
        // find the appointment itself.
        var appointment = existing(AppointmentStatus.CONFIRMED, client);
        appointment.setEmployee(employee);
        when(appointmentRepository.findDetailed(99L)).thenReturn(Optional.of(appointment));

        appointments.changeStatus(99L, AppointmentStatus.IN_PROGRESS, Locale.GERMAN);

        verify(appointmentRepository, never()).hasConflict(anyLong(), any(), any(), anyCollection(), any());
    }

    @Test
    void willNotSkipTheWorkflow() {
        var appointment = existing(AppointmentStatus.REQUESTED, client);
        when(appointmentRepository.findDetailed(99L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointments.changeStatus(99L, AppointmentStatus.COMPLETED, Locale.GERMAN))
                .isInstanceOf(ConflictException.class);
    }

    /** Somebody qualified is free, which is the normal case for a successful request. */
    private void requestedSlotIsFree() {
        when(employees.assignableFor(5L)).thenReturn(List.of(employee));
        when(appointmentRepository.findCommitmentsInWindow(any(), any(), anyCollection()))
                .thenReturn(List.of());
    }

    private CreateAppointmentRequest request(Long employeeId, LocalDateTime start) {
        var request = new CreateAppointmentRequest();
        request.setServiceId(5L);
        request.setEmployeeId(employeeId);
        request.setStartTime(start);
        request.setStreet("Könneritzstraße 24");
        request.setPostalCode("01067");
        request.setCity("Dresden");
        return request;
    }

    private Appointment existing(AppointmentStatus status, User owner) {
        // The mapper reads the service, so an appointment has to carry one even where
        // the test only cares about status.
        lenient().when(appointmentRepository.save(any(Appointment.class)))
                .thenAnswer(call -> call.getArgument(0));

        return Appointment.builder()
                .id(99L).client(owner).service(service)
                .startTime(TOMORROW_AT_TEN).endTime(TOMORROW_AT_TEN.plusHours(1))
                .status(status)
                .street("Könneritzstraße 24").postalCode("01067").city("Dresden")
                .createdAt(Instant.now())
                .build();
    }
}
