package com.glanzwerk.api.auth;

import com.glanzwerk.api.users.StrongPassword;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * A reset link being redeemed.
 *
 * The password rules are {@link StrongPassword}, the same constraint registration and
 * changing a password carry. They used to be three hand-copied sets of annotations,
 * which is three chances for one of them to be relaxed on its own.
 */
@Data
public class ResetPasswordRequest {
    @NotBlank(message = "The reset token is missing")
    private String token;

    @StrongPassword
    private String password;
}
