package com.glanzwerk.api.appointments;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * Which days and times a client may choose.
 *
 * Its own controller, open to any signed-in account, because both sides need exactly
 * the same answer: the client picking a slot on the booking form, and the office
 * rescheduling one in the dashboard. Two copies of this would be two chances to offer
 * a time the other half refuses.
 *
 * Authenticated rather than public: a free/busy calendar for the whole business is a
 * fair picture of how much work we have on, and not something to hand to a crawler.
 */
@RestController
@RequestMapping("/api/v1/availability")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class AvailabilityController {
    private final SlotCalendar slots;

    @GetMapping
    public List<DayAvailabilityDto> availability(
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long employeeId) {
        return slots.availability(serviceId, from, to, employeeId);
    }
}
