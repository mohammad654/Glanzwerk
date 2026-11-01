package com.glanzwerk.api.services;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * What an administrator may set on a service.
 *
 * {@code active} is not here: activating and deactivating is its own endpoint, so a
 * careless full-object save cannot take a service off the site as a side effect.
 */
@Data
public class ServiceRequest {
    /**
     * Constrained to the shape of a catalogue key because it is used as an identifier
     * by the frontend and must stay URL- and code-safe.
     */
    @NotBlank(message = "Service key is required")
    @Size(max = 60, message = "Service key must be at most {max} characters")
    @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9]*$", message = "Service key must be letters and digits, starting with a letter")
    private String serviceKey;

    @NotBlank(message = "German name is required")
    @Size(max = 255, message = "Name must be at most {max} characters")
    private String nameDe;

    @NotBlank(message = "English name is required")
    @Size(max = 255, message = "Name must be at most {max} characters")
    private String nameEn;

    @Size(max = 5000, message = "Description must be at most {max} characters")
    private String descriptionDe;

    @Size(max = 5000, message = "Description must be at most {max} characters")
    private String descriptionEn;

    /** Half an hour to a ten-hour day: anything outside that is a data entry mistake. */
    @Min(value = 15, message = "Duration must be at least {value} minutes")
    @Max(value = 600, message = "Duration must be at most {value} minutes")
    private int durationMinutes;
}
