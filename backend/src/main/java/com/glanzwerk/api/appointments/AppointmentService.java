package com.glanzwerk.api.appointments;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glanzwerk.api.common.BadRequestException;
import com.glanzwerk.api.common.ConflictException;
import com.glanzwerk.api.common.NotFoundException;
import com.glanzwerk.api.common.Pages;
import com.glanzwerk.api.common.PagedResponse;
import com.glanzwerk.api.common.Text;
import com.glanzwerk.api.employees.Employee;
import com.glanzwerk.api.employees.EmployeeService;
import com.glanzwerk.api.services.ServiceCatalogService;
import com.glanzwerk.api.services.ServiceOffering;
import com.glanzwerk.api.users.UserService;

import lombok.RequiredArgsConstructor;

/**
 * The appointment workflow.
 *
 * Everything a client could lie about is decided here rather than accepted from the
 * request: the client is the authenticated caller, the length is one fixed slot, the
 * status starts at REQUESTED and only moves along the transitions the enum allows.
 * There is nothing to lie about regarding money, because appointments are free.
 */
@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final ServiceCatalogService catalog;
    private final EmployeeService employees;
    private final UserService users;
    private final AppointmentMapper mapper;
    private final AppointmentProperties properties;
    private final SlotCalendar slots;
    private final Clock clock;

    // ---------------------------------------------------------------- client side

    @Transactional
    public AppointmentDto create(Long clientUserId, CreateAppointmentRequest request, Locale locale) {
        var service = catalog.requireBookable(request.getServiceId());
        var start = request.getStartTime();
        var end = start.plusMinutes(properties.getSlotMinutes());
        slots.requireValidSlot(start);

        var employee = resolveEmployee(request.getEmployeeId(), service);
        if (employee != null) {
            requireFree(employee, start, end, null);
        } else {
            // Nobody was asked for by name, so the office will assign someone — but
            // only if someone could actually go. Accepting a time when the whole
            // qualified team is out would be promising a visit we cannot make.
            requireSomebodyFree(service, start, end);
        }

        var appointment = Appointment.builder()
                .client(users.require(clientUserId))
                .service(service)
                .employee(employee)
                .startTime(start)
                .endTime(end)
                .status(AppointmentStatus.REQUESTED)
                .street(request.getStreet().trim())
                .postalCode(request.getPostalCode().trim())
                .city(request.getCity().trim())
                .notes(Text.blankToNull(request.getNotes()))
                .build();

        return mapper.toDto(appointmentRepository.save(appointment), locale);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> listForClient(Long clientUserId, Locale locale) {
        return appointmentRepository.findForClient(clientUserId).stream()
                .map(appointment -> mapper.toDto(appointment, locale))
                .toList();
    }

    /**
     * A client calling off their own appointment.
     *
     * The ownership check is on the appointment's client id against the token's user
     * id, which is what stops a client cancelling somebody else's. It answers 404
     * rather than 403 for one that is not theirs, so the endpoint cannot be used to
     * find out which ids exist.
     */
    @Transactional
    public AppointmentDto cancelAsClient(Long clientUserId, Long appointmentId, Locale locale) {
        var appointment = requireDetailed(appointmentId);
        if (!appointment.getClient().getId().equals(clientUserId)) {
            throw new NotFoundException("Appointment not found.");
        }
        if (!appointment.getStatus().canTransitionTo(AppointmentStatus.CANCELLED)) {
            throw new ConflictException("This appointment can no longer be cancelled.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        return mapper.toDto(appointmentRepository.save(appointment), locale);
    }

    // ----------------------------------------------------------------- admin side

    @Transactional(readOnly = true)
    public PagedResponse<AppointmentDto> search(AppointmentFilter filter, Pageable pageable, Locale locale) {
        var sorted = Pages.sortedBy(pageable, Sort.by("startTime").descending());

        var page = appointmentRepository.search(
                filter.status(),
                filter.employeeId(),
                filter.clientId(),
                filter.from() == null ? null : filter.from().atStartOfDay(),
                filter.to() == null ? null : filter.to().plusDays(1).atStartOfDay(),
                filter.likeQuery(),
                filter.referenceId(),
                sorted);

        return PagedResponse.from(page, appointment -> mapper.toDto(appointment, locale));
    }

    @Transactional(readOnly = true)
    public AppointmentDto get(Long id, Locale locale) {
        return mapper.toDto(requireDetailed(id), locale);
    }

    @Transactional
    public AppointmentDto update(Long id, UpdateAppointmentRequest request, Locale locale) {
        var appointment = requireDetailed(id);
        requireOpen(appointment);

        var start = request.getStartTime();
        var end = start.plusMinutes(properties.getSlotMinutes());
        slots.requireValidSlot(start);

        var employee = resolveEmployee(request.getEmployeeId(), appointment.getService());
        if (employee != null) {
            requireFree(employee, start, end, appointment.getId());
        }

        appointment.setEmployee(employee);
        appointment.setStartTime(start);
        appointment.setEndTime(end);
        appointment.setStreet(request.getStreet().trim());
        appointment.setPostalCode(request.getPostalCode().trim());
        appointment.setCity(request.getCity().trim());
        appointment.setNotes(Text.blankToNull(request.getNotes()));

        return mapper.toDto(appointmentRepository.save(appointment), locale);
    }

    @Transactional
    public AppointmentDto changeStatus(Long id, AppointmentStatus next, Locale locale) {
        var appointment = requireDetailed(id);
        if (appointment.getStatus() == next) {
            return mapper.toDto(appointment, locale);
        }
        if (!appointment.getStatus().canTransitionTo(next)) {
            throw new ConflictException(
                    "An appointment cannot go from %s to %s.".formatted(appointment.getStatus(), next));
        }
        if (next == AppointmentStatus.CONFIRMED && appointment.getEmployee() == null) {
            throw new BadRequestException("Assign an employee before confirming the appointment.");
        }

        appointment.setStatus(next);
        return mapper.toDto(appointmentRepository.save(appointment), locale);
    }

    /**
     * Removing an appointment from the diary for good.
     *
     * The office's own correction for a row that should not be there at all — a test
     * booking, a duplicate, a visit entered against the wrong client. Cancelling is
     * still the right move for a visit that was really arranged and then called off,
     * because a cancelled appointment is a fact worth keeping; this is for the ones
     * that were never facts.
     */
    @Transactional
    public void delete(Long id) {
        appointmentRepository.delete(requireDetailed(id));
    }

    @Transactional(readOnly = true)
    public AppointmentStatsDto stats() {
        var today = LocalDate.now(clock);

        return new AppointmentStatsDto(
                appointmentRepository.countByStatus(AppointmentStatus.REQUESTED),
                appointmentRepository.countByStatus(AppointmentStatus.CONFIRMED),
                appointmentRepository.countInWindow(today.atStartOfDay(), today.plusDays(1).atStartOfDay()),
                appointmentRepository.countInWindow(today.atStartOfDay(), today.plusDays(7).atStartOfDay()),
                appointmentRepository.countByStatus(AppointmentStatus.COMPLETED));
    }

    // ------------------------------------------------------------------- internals

    private Appointment requireDetailed(Long id) {
        return appointmentRepository.findDetailed(id)
                .orElseThrow(() -> new NotFoundException("Appointment not found."));
    }

    private void requireOpen(Appointment appointment) {
        if (!AppointmentStatus.blocking().contains(appointment.getStatus())) {
            throw new ConflictException("A %s appointment can no longer be changed."
                    .formatted(appointment.getStatus().name().toLowerCase()));
        }
    }

    private Employee resolveEmployee(Long employeeId, ServiceOffering service) {
        return employeeId == null ? null : employees.requireAssignable(employeeId, service);
    }

    /**
     * Double-booking guard.
     *
     * This is a check-then-write, so two simultaneous requests for the same slot could
     * both pass it. The window is milliseconds wide and the consequence is one
     * appointment an administrator has to move, which is why it is not worth
     * serialising every insert over. If it ever matters, the fix is a unique index on
     * (employee, start) or a lock on the employee row, not a bigger check.
     */
    private void requireFree(Employee employee, LocalDateTime start, LocalDateTime end, Long excludedId) {
        if (appointmentRepository.hasConflict(
                employee.getId(), start, end, AppointmentStatus.blocking(), excludedId)) {
            throw new ConflictException("That employee already has an appointment at that time.");
        }
    }

    /** At least one person trained for the service has to be free, or there is no visit. */
    private void requireSomebodyFree(ServiceOffering service, LocalDateTime start, LocalDateTime end) {
        if (!slots.anyoneFree(service.getId(), start, end)) {
            throw new ConflictException("Nobody is available at that time. Please choose another slot.");
        }
    }
}
