package com.glanzwerk.api.appointments;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * What a client may ask for.
 *
 * There is no status field and no length: the status always starts at
 * {@code REQUESTED} and the end time is the start plus one slot, worked out on the
 * server. There is no price field either, because the appointment is free. The
 * client id is not here — it comes from the token, so nobody can book in someone
 * else's name.
 */
@Data
public class CreateAppointmentRequest {
    @NotNull(message = "Service is required")
    private Long serviceId;

    /** Optional: a client may ask for a particular person, or leave it to the office. */
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
