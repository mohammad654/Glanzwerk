package com.glanzwerk.api.employees;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glanzwerk.api.common.BadRequestException;
import com.glanzwerk.api.common.ConflictException;
import com.glanzwerk.api.common.NotFoundException;
import com.glanzwerk.api.common.Text;
import com.glanzwerk.api.services.ServiceOffering;
import com.glanzwerk.api.services.ServiceOfferingRepository;

import lombok.RequiredArgsConstructor;

/**
 * Staff administration.
 *
 * Much smaller than it was: creating an employee no longer creates an account, hash
 * a password or touch {@code users} at all, so there is no two-table transaction to
 * keep consistent. An employee is one row plus its skills.
 */
@Service
@RequiredArgsConstructor
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final ServiceOfferingRepository serviceRepository;
    private final EmployeeMapper mapper;

    @Transactional(readOnly = true)
    public List<EmployeeDto> list(Locale locale) {
        return employeeRepository.findAllWithSkills().stream()
                .map(employee -> mapper.toDto(employee, locale))
                .toList();
    }

    @Transactional(readOnly = true)
    public EmployeeDto get(Long id, Locale locale) {
        return mapper.toDto(require(id), locale);
    }

    /** The same people, reduced to what a client choosing a slot may see of them. */
    @Transactional(readOnly = true)
    public List<EmployeeOptionDto> assignableOptionsFor(Long serviceId) {
        return employeeRepository.findAssignableForService(serviceId).stream()
                .map(employee -> new EmployeeOptionDto(
                        employee.getId(), employee.getName(), employee.getJobRole()))
                .toList();
    }

    /** The entities, for the availability calculation. */
    @Transactional(readOnly = true)
    public List<Employee> assignableFor(Long serviceId) {
        return employeeRepository.findAssignableForService(serviceId);
    }

    @Transactional
    public EmployeeDto create(CreateEmployeeRequest request, Locale locale) {
        var email = Text.normalizeEmail(request.getEmail());
        requireEmailFree(email, null);

        var employee = Employee.builder()
                .name(request.getName().trim())
                .email(email)
                .phone(Text.blankToNull(request.getPhone()))
                .jobRole(request.getJobRole())
                .status(EmployeeStatus.ACTIVE)
                .weeklyHours(request.getWeeklyHours())
                .hiredOn(request.getHiredOn())
                .skills(resolveSkills(request.getServiceIds()))
                .active(true)
                .build();

        return mapper.toDto(employeeRepository.save(employee), locale);
    }

    @Transactional
    public EmployeeDto update(Long id, UpdateEmployeeRequest request, Locale locale) {
        var employee = require(id);
        var email = Text.normalizeEmail(request.getEmail());
        requireEmailFree(email, employee);

        employee.setName(request.getName().trim());
        employee.setEmail(email);
        employee.setPhone(Text.blankToNull(request.getPhone()));
        employee.setJobRole(request.getJobRole());
        employee.setStatus(request.getStatus());
        employee.setWeeklyHours(request.getWeeklyHours());
        employee.setHiredOn(request.getHiredOn());
        employee.setSkills(resolveSkills(request.getServiceIds()));

        return mapper.toDto(employeeRepository.save(employee), locale);
    }

    /**
     * Activating and deactivating is a flag, not a delete: appointments reference the
     * employee row and the database refuses to drop it, which is the behaviour we
     * want — history outlives employment.
     */
    @Transactional
    public EmployeeDto setActive(Long id, boolean active, Locale locale) {
        var employee = require(id);
        employee.setActive(active);
        return mapper.toDto(employeeRepository.save(employee), locale);
    }

    /**
     * Removing a record that should never have existed — a duplicate, a typo, somebody
     * entered before they ever started.
     *
     * Only ever that: the moment an appointment names this person, the row is part of
     * the business record and deactivating is the only way out. Refusing with a 409
     * says so, rather than letting the foreign key answer with a 500.
     */
    @Transactional
    public void delete(Long id) {
        var employee = require(id);

        if (employeeRepository.hasAppointments(id)) {
            throw new ConflictException(
                    "That employee has appointments on record. Deactivate them instead of deleting them.");
        }

        employeeRepository.delete(employee);
    }

    /** The employee, only if they may be put on an appointment for this service. */
    @Transactional(readOnly = true)
    public Employee requireAssignable(Long id, ServiceOffering service) {
        var employee = require(id);

        if (!employee.isSchedulable()) {
            throw new ConflictException("That employee is not available for new work.");
        }
        if (employee.getSkills().stream().noneMatch(skill -> skill.getId().equals(service.getId()))) {
            throw new BadRequestException("That employee is not trained for this service.");
        }

        return employee;
    }

    private Employee require(Long id) {
        return employeeRepository.findWithSkills(id)
                .orElseThrow(() -> new NotFoundException("Employee not found."));
    }

    /**
     * Email is only unique so the same person is not entered twice. Null is always
     * allowed — several employees may have no address on file.
     */
    private void requireEmailFree(String email, Employee current) {
        if (email == null) {
            return;
        }
        if (current != null && email.equalsIgnoreCase(current.getEmail())) {
            return;
        }
        if (employeeRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Another employee already has that email address.");
        }
    }

    /**
     * Turns the posted ids into real services, rejecting any that do not exist instead
     * of silently dropping them — a half-saved skill set is worse than a failed save.
     */
    private Set<ServiceOffering> resolveSkills(Set<Long> serviceIds) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            return new LinkedHashSet<>();
        }

        var found = serviceRepository.findAllById(serviceIds);
        if (found.size() != serviceIds.size()) {
            throw new BadRequestException("One or more selected services do not exist.");
        }

        return new LinkedHashSet<>(found);
    }
}
