package com.glanzwerk.api.employees;

/**
 * An employee as a client picking a slot sees them: a name and what they do.
 *
 * Deliberately not {@link EmployeeDto}. That one carries work email, phone, contracted
 * hours and start date, which a client has no business reading just because they are
 * signed in — handing the whole staff directory to anyone who registers is exactly
 * the kind of leak that comes from reusing an admin DTO on a client endpoint.
 */
public record EmployeeOptionDto(Long id, String name, JobRole jobRole) {
}
