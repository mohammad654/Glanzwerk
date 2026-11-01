package com.glanzwerk.api.appointments;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * What the office may change about an appointment: who is going, when, and where.
 *
 * No price — appointments are free. No status either: that moves through its own
 * endpoint, which checks the transition is legal.
 */
@Data
public class UpdateAppointmentRequest {
    /** Null clears the assignment, which is how a visit goes back into the pool. */
    private Long employeeId;

    @NotNull(message = "Date and time are required")
    private LocalDateTime startTime;

    @NotBlank(message = "Street is required")
    @Size(max = 255, message = "Street must be at most {max} characters")
    private String street;

    @NotBlank(message = "Postal code is required")
    @Pattern(regexp = "^[0-9]{5}$", message = "Postal code must be five digits")
    private String postalCode;

    @NotBlank(message = "City is required")
    @Size(max = 120, message = "City must be at most {max} characters")
    private String city;

    @Size(max = 2000, message = "Notes must be at most {max} characters")
    private String notes;
}
