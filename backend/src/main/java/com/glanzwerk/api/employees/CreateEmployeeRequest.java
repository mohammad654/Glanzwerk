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
 * Adding a member of staff.
 *
 * There is no password, because an employee has no account to sign in to. There is
 * no role either — an employee is not a user, so there is nothing a request could
 * ask to be. Only an administrator can reach the endpoint behind this.
 */
@Data
public class CreateEmployeeRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between {min} and {max} characters")
    private String name;

    /** A contact address, not a login. Optional. */
    @Email(message = "Email must be valid")
    @Size(max = 254, message = "Email must be at most {max} characters")
    private String email;

    @Pattern(regexp = "^$|^[0-9+()\\s-]{6,30}$", message = "Phone number is not valid")
    private String phone;

    @NotNull(message = "Job role is required")
    private JobRole jobRole;

    @Min(value = 1, message = "Weekly hours must be at least {value}")
    @Max(value = 60, message = "Weekly hours must be at most {value}")
    private int weeklyHours;

    @NotNull(message = "Start date is required")
    private LocalDate hiredOn;

    /**
     * Services this person may be assigned to. Ids from the service catalogue.
     *
     * An appointment can only be given to somebody trained for its service, so an
     * empty list here means this person cannot be put on any visit.
     */
    @Size(max = 200, message = "Too many services selected")
    private Set<Long> serviceIds = Set.of();
}
