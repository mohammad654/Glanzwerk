package com.glanzwerk.api.auth;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.glanzwerk.api.users.User;

/**
 * The default notifier: writes the reset link to the log.
 *
 * Nothing in this application sends email yet, so this is the only way the reset
 * flow can be finished — the link is read out of the API's console. It logs at WARN,
 * not INFO, because a reset link in a log file is a credential in a log file: anybody
 * who can read the log can take over the account. That is tolerable on a developer's
 * machine and not tolerable anywhere else, so the line says so every time.
 *
 * Replacing it is one class: implement {@link PasswordResetNotifier}, mark it
 * {@code @Primary} or delete this one. {@link PasswordResetService} does not change.
 */
@Component
public class LoggingPasswordResetNotifier implements PasswordResetNotifier {
    private static final Logger log = LoggerFactory.getLogger(LoggingPasswordResetNotifier.class);

    @Override
    public void notifyPasswordReset(User user, String resetLink, Instant expiresAt) {
        log.warn("No mail sender is configured, so this reset link is only in this log. "
                        + "Do not run a deployment on this notifier. Account #{}, valid until {}: {}",
                user.getId(), expiresAt, resetLink);
    }
}
