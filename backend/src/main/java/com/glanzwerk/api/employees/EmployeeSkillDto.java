package com.glanzwerk.api.employees;

/** One service an employee is trained for. The key lets the frontend link to its page. */
public record EmployeeSkillDto(Long serviceId, String serviceKey, String name) {
}
