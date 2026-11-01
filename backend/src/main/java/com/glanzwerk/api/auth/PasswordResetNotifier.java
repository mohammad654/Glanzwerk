package com.glanzwerk.api.auth;

import java.time.Instant;

import com.glanzwerk.api.users.User;

/**
 * Gets a reset link to the person who asked for it.
 *
 * An interface with one logging implementation, exactly as {@code EnquiryNotifier} is:
 * the token is issued and stored today, and adding SMTP later is one new class and no
 * change to {@link PasswordResetService}. Delivery is the part most likely to change
 * and most likely to fail, so it is the part behind a seam.
 */
public interface PasswordResetNotifier {
    void notifyPasswordReset(User user, String resetLink, Instant expiresAt);
}
