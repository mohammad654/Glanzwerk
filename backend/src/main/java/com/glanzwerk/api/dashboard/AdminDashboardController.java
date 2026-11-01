package com.glanzwerk.api.dashboard;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.glanzwerk.api.appointments.AppointmentService;
import com.glanzwerk.api.clients.ClientQueryRepository;
import com.glanzwerk.api.contact.ContactService;
import com.glanzwerk.api.employees.EmployeeRepository;
import com.glanzwerk.api.services.ServiceOfferingRepository;

import lombok.RequiredArgsConstructor;

/**
 * The overview page's figures.
 *
 * One endpoint rather than five, because the page shows them together and five
 * requests would mean five round trips and five chances for a half-rendered dashboard.
 * Every number is a {@code count} in the database; nothing is loaded to be counted.
 */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final ClientQueryRepository clientQueries;
    private final EmployeeRepository employeeRepository;
    private final ServiceOfferingRepository serviceRepository;
    private final ContactService contactService;
    private final AppointmentService appointments;

    @GetMapping
    public DashboardDto overview() {
        return new DashboardDto(
                clientQueries.countActiveClients(),
                employeeRepository.countActive(),
                serviceRepository.countByActiveTrue(),
                contactService.countNew(),
                appointments.stats());
    }
}
