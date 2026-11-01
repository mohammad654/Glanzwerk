package com.glanzwerk.api.users;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Changing the password on the account the caller is already signed in to.
 *
 * The current password is asked for even though the caller holds a valid token: a token
 * can be a borrowed laptop, and this is the one change that would lock its owner out.
 * The new password's rules are {@link StrongPassword}, shared with registration and with
 * redeeming a reset link.
 */
@Data
public class ChangePasswordRequest {
    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @StrongPassword
    private String newPassword;
}
