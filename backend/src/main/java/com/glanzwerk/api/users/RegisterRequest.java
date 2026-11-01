package com.glanzwerk.api.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * What a visitor may send to create an account.
 *
 * There is no {@code role} and no {@code active} field, so no request can ask for
 * EMPLOYEE or ADMIN: the role is not something the server has to ignore, it is
 * something the client cannot express. That is the mass-assignment guard.
 */
@Data
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between {min} and {max} characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 254, message = "Email must be at most {max} characters")
    private String email;

    /** The policy lives on {@link StrongPassword}, which the other two forms share. */
    @StrongPassword
    private String password;

    /** Optional: we can take a job without it, but it is how we call back. */
    @Pattern(regexp = "^$|^[0-9+()\\s-]{6,30}$", message = "Phone number is not valid")
    private String phone;
}
