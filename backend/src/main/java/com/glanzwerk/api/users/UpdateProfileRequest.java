package com.glanzwerk.api.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * What the signed-in holder of an account may change about it.
 *
 * Email is not here: changing the login identity needs a confirmation flow we do not
 * have, and allowing it silently would let an account be moved to an address its
 * owner never proved they control.
 */
@Data
public class UpdateProfileRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between {min} and {max} characters")
    private String name;

    @Pattern(regexp = "^$|^[0-9+()\\s-]{6,30}$", message = "Phone number is not valid")
    private String phone;
}
