package com.glanzwerk.api.auth;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Deletes reset tokens that can no longer be redeemed.
 *
 * Asking for a new link clears an account's outstanding ones, so the table stays tidy
 * for anyone who comes back. It grows without bound for everyone who does not: a row
 * per abandoned "I forgot my password", kept for ever. Spent and expired rows are dead
 * weight — {@code isRedeemableAt} already refuses both — and keeping a reset credential's
 * hash around longer than the credential is worth nothing and costs a little.
 *
 * Hourly rather than on every request: this is housekeeping, and doing it on the reset
 * path would put a table-wide delete in front of a user waiting for an email.
 */
@Component
@RequiredArgsConstructor
public class PasswordResetTokenCleanup {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetTokenCleanup.class);

    private static final long ONE_HOUR_MS = 60 * 60 * 1000L;

    private final PasswordResetTokenRepository tokens;
    private final Clock clock;

    @Scheduled(fixedDelay = ONE_HOUR_MS, initialDelay = ONE_HOUR_MS)
    @Transactional
    public void removeSpentTokens() {
        var removed = tokens.deleteExpiredOrUsedBefore(clock.instant());
        if (removed > 0) {
            log.debug("Removed {} spent password reset tokens", removed);
        }
    }
}
