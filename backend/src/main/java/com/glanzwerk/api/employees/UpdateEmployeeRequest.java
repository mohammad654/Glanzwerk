package com.glanzwerk.api.employees;

import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Editing a member of staff.
 *
 * Email is editable here, unlike on a user: it is a contact detail rather than a
 * sign-in identity, so changing it proves nothing and breaks nothing. No
 * {@code active} field though — activating and deactivating is its own endpoint, so
 * a stale edit form cannot reinstate someone who was let go.
 */
@Data
public class UpdateEmployeeRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between {min} and {max} characters")
    private String name;

    @Email(message = "Email must be valid")
    @Size(max = 254, message = "Email must be at most {max} characters")
    private String email;

    @Pattern(regexp = "^$|^[0-9+()\\s-]{6,30}$", message = "Phone number is not valid")
    private String phone;

    @NotNull(message = "Job role is required")
    private JobRole jobRole;

    @NotNull(message = "Status is required")
    private EmployeeStatus status;

    @Min(value = 1, message = "Weekly hours must be at least {value}")
    @Max(value = 60, message = "Weekly hours must be at most {value}")
    private int weeklyHours;

    @NotNull(message = "Start date is required")
    private LocalDate hiredOn;

    @Size(max = 200, message = "Too many services selected")
    private Set<Long> serviceIds = Set.of();
}
