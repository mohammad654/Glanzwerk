package com.glanzwerk.api.employees;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * What a signed-in client is allowed to know about the team: who could come out for
 * the appointment they are about to request.
 *
 * Authenticated rather than public, and answering with {@link EmployeeOptionDto}
 * rather than the admin DTO, so a client learns a name and a job role and not the
 * team's work emails, phone numbers and contracts.
 */
@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employees;

    @GetMapping("/assignable")
    @PreAuthorize("isAuthenticated()")
    public List<EmployeeOptionDto> assignable(@RequestParam Long serviceId) {
        return employees.assignableOptionsFor(serviceId);
    }
}
