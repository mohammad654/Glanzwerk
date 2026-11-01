package com.glanzwerk.api.employees;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record EmployeeDto(
        Long id,
        String name,
        String email,
        String phone,
        JobRole jobRole,
        EmployeeDisplayStatus status,
        boolean active,
        int weeklyHours,
        LocalDate hiredOn,
        List<EmployeeSkillDto> skills,
        Instant createdAt
) {
}
