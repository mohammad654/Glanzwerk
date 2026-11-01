package com.glanzwerk.api.appointments;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.glanzwerk.api.common.BadRequestException;
import com.glanzwerk.api.employees.Employee;
import com.glanzwerk.api.employees.EmployeeService;

import lombok.RequiredArgsConstructor;

/**
 * Which slots exist, and which of them are still free.
 *
 * One grid for the whole business: every appointment is
 * {@code glanzwerk.appointments.slot-minutes} long, so the times on offer are the same
 * every open day and do not depend on the service chosen. That is what lets the
 * booking form show a day's whole row of times with the taken ones missing.
 *
 * It is a separate component from {@code AppointmentService} because the same rules
 * are needed twice, for opposite reasons: to *offer* free slots to a client, and to
 * *refuse* a slot that is not on the grid when one is submitted. Those must agree, and
 * the only way to guarantee that is for them to be the same code.
 */
@Component
@RequiredArgsConstructor
public class SlotCalendar {
    private final AppointmentRepository appointmentRepository;
    private final EmployeeService employees;
    private final AppointmentProperties properties;
    private final Clock clock;

    /**
     * The times an appointment may start on any open day.
     *
     * The last slot is the last one that still *ends* by closing time, which is why
     * 07:00–20:00 in hour slots offers 07:00 to 19:00 and not 20:00.
     */
    public List<LocalTime> gridTimes() {
        var times = new ArrayList<LocalTime>();
        var slot = properties.getSlotMinutes();

        for (var time = properties.getOpensAt();
             !time.plusMinutes(slot).isAfter(properties.getClosesAt());
             time = time.plusMinutes(slot)) {
            times.add(time);
            // A slot length that does not divide the day could otherwise wrap past
            // midnight and loop forever.
            if (time.plusMinutes(slot).equals(LocalTime.MIDNIGHT)) {
                break;
            }
        }

        return times;
    }

    /**
     * Rejects anything the slot grid does not contain.
     *
     * The time-of-day check is the one that matters most: without it a client could
     * post 07:13 and quietly own a slot nobody else is ever offered, which would then
     * block two of the real ones.
     */
    public void requireValidSlot(LocalDateTime start) {
        var now = LocalDateTime.now(clock);

        if (start.isBefore(now.plusHours(properties.getMinLeadTimeHours()))) {
            throw new BadRequestException("Please choose a time at least %d hours from now."
                    .formatted(properties.getMinLeadTimeHours()));
        }
        if (start.isAfter(now.plusDays(properties.getMaxDaysAhead()))) {
            throw new BadRequestException("That date is too far in the future.");
        }
        if (!properties.getOpenDays().contains(start.getDayOfWeek())) {
            throw new BadRequestException("We do not work on that day.");
        }
        if (!gridTimes().contains(start.toLocalTime())) {
            throw new BadRequestException("Please choose one of the times offered.");
        }
    }

    /** Whether the team still has room for one more visit over this window. */
    public boolean anyoneFree(Long serviceId, LocalDateTime start, LocalDateTime end) {
        var candidates = employees.assignableFor(serviceId);
        if (candidates.isEmpty()) {
            return false;
        }

        var commitments = commitmentsIn(start, end);
        return hasRoom(candidates, commitments, start, end);
    }

    /**
     * The days and times a client may still choose, for one service.
     *
     * {@code employeeId} narrows it to one person's calendar, for a client who asked
     * for somebody in particular. Without it a slot counts as free when *any*
     * qualified colleague could take it, which is what "whoever is available" means.
     *
     * One database query covers the whole range, and the grid is then computed in
     * memory: asking per day per slot would be hundreds of round trips for a month.
     */
    public List<DayAvailabilityDto> availability(Long serviceId, LocalDate from, LocalDate to, Long employeeId) {
        if (to.isBefore(from)) {
            throw new BadRequestException("The end of the range is before its start.");
        }
        if (from.plusDays(properties.getMaxAvailabilityDays()).isBefore(to)) {
            throw new BadRequestException("Please ask for at most %d days at a time."
                    .formatted(properties.getMaxAvailabilityDays()));
        }

        var candidates = employeeId == null
                ? employees.assignableFor(serviceId)
                : employees.assignableFor(serviceId).stream()
                        .filter(employee -> employee.getId().equals(employeeId))
                        .toList();

        if (candidates.isEmpty()) {
            // Nobody is trained for this service, or the person asked for is not.
            // No days at all, rather than a calendar of slots that cannot be filled.
            return List.of();
        }

        var commitments = commitmentsIn(from.atStartOfDay(), to.plusDays(1).atStartOfDay());
        var now = LocalDateTime.now(clock);
        var earliest = now.plusHours(properties.getMinLeadTimeHours());
        var latest = now.plusDays(properties.getMaxDaysAhead());
        var grid = gridTimes();

        var days = new ArrayList<DayAvailabilityDto>();

        for (var date = from; !date.isAfter(to); date = date.plusDays(1)) {
            if (!properties.getOpenDays().contains(date.getDayOfWeek())) {
                // A closed day is omitted entirely, not returned empty: the picker
                // should not offer a date it will then refuse.
                continue;
            }

            var free = new ArrayList<LocalTime>();
            for (var time : grid) {
                var start = date.atTime(time);
                var end = start.plusMinutes(properties.getSlotMinutes());

                if (start.isBefore(earliest) || start.isAfter(latest)) {
                    continue;
                }
                if (hasRoom(candidates, commitments, start, end)) {
                    free.add(time);
                }
            }

            if (!free.isEmpty()) {
                days.add(new DayAvailabilityDto(date, free));
            }
        }

        return days;
    }

    /** Every commitment in the window, split into "this person is busy" and "someone must go". */
    private record Commitments(Map<Long, List<BusySlot>> byEmployee, List<BusySlot> unassigned) {
    }

    private Commitments commitmentsIn(LocalDateTime from, LocalDateTime to) {
        var all = appointmentRepository.findCommitmentsInWindow(from, to, AppointmentStatus.blocking());

        return new Commitments(
                all.stream().filter(BusySlot::isAssigned).collect(Collectors.groupingBy(BusySlot::employeeId)),
                all.stream().filter(slot -> !slot.isAssigned()).toList());
    }

    /**
     * Whether one more visit fits in this slot.
     *
     * Free people minus visits already promised to nobody in particular. An
     * unassigned appointment is not spare capacity — the office still has to send
     * somebody — so counting only assigned ones would let the same slot be handed to
     * client after client and leave one qualified colleague owing three visits at
     * nine o'clock. The test is strict (`>`), because the pending ones have to be
     * covered before a new one can be.
     *
     * It is deliberately conservative: a pending appointment is assumed to need one of
     * *these* candidates, even though a colleague qualified for a different service
     * might end up taking it. Turning away a slot we could have filled is a smaller
     * failure than promising a visit nobody can make.
     */
    private boolean hasRoom(List<Employee> candidates, Commitments commitments,
                            LocalDateTime start, LocalDateTime end) {
        var free = candidates.stream()
                .filter(candidate -> isFree(commitments.byEmployee(), candidate.getId(), start, end))
                .count();

        var pending = commitments.unassigned().stream()
                .filter(slot -> slot.overlaps(start, end))
                .count();

        return free > pending;
    }

    private boolean isFree(Map<Long, List<BusySlot>> busy, Long employeeId,
                           LocalDateTime start, LocalDateTime end) {
        return busy.getOrDefault(employeeId, List.of()).stream()
                .noneMatch(slot -> slot.overlaps(start, end));
    }
}
