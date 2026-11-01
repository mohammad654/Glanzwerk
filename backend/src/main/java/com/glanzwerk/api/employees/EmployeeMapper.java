package com.glanzwerk.api.employees;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

/**
 * Hand-written because the display status is derived from two fields and the skill
 * names depend on the caller's locale.
 */
@Component
public class EmployeeMapper {

    public EmployeeDto toDto(Employee employee, Locale locale) {
        return new EmployeeDto(
                employee.getId(),
                employee.getName(),
                employee.getEmail(),
                employee.getPhone(),
                employee.getJobRole(),
                displayStatus(employee),
                employee.isActive(),
                employee.getWeeklyHours(),
                employee.getHiredOn(),
                skills(employee, locale),
                employee.getCreatedAt());
    }

    private List<EmployeeSkillDto> skills(Employee employee, Locale locale) {
        return employee.getSkills().stream()
                .map(service -> new EmployeeSkillDto(
                        service.getId(),
                        service.getServiceKey(),
                        service.nameIn(locale)))
                .sorted(Comparator.comparing(EmployeeSkillDto::name))
                .toList();
    }

    /** A deactivated record reads as INACTIVE whatever its scheduling status says. */
    private EmployeeDisplayStatus displayStatus(Employee employee) {
        if (!employee.isActive()) {
            return EmployeeDisplayStatus.INACTIVE;
        }
        return employee.getStatus() == EmployeeStatus.ON_LEAVE
                ? EmployeeDisplayStatus.ON_LEAVE
                : EmployeeDisplayStatus.ACTIVE;
    }
}
