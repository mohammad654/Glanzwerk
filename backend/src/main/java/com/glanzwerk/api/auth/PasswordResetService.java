package com.glanzwerk.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glanzwerk.api.common.BadRequestException;
import com.glanzwerk.api.common.ConflictException;
import com.glanzwerk.api.common.InvalidCredentialsException;
import com.glanzwerk.api.common.Text;
import com.glanzwerk.api.users.User;
import com.glanzwerk.api.users.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Forgotten passwords: issuing a one-time link and redeeming it.
 *
 * Two things make a stolen or guessed link worthless. The token is 256 bits of
 * {@link SecureRandom}, so it cannot be guessed; and only its hash is stored, so a
 * database dump cannot be turned back into links. Redeeming spends the row and
 * asking for a new link deletes the old ones, so at most one link per account works
 * at a time.
 *
 * Like sign-in, this says when no account has the address — see
 * {@link InvalidCredentialsException} for what that costs and why it was asked for.
 * Everything after that point is deliberately vague: an invalid, expired or spent
 * token all answer the same way, because the difference would tell whoever holds a
 * guessed token whether they are getting warmer.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {
    /** 32 bytes: a token nobody enumerates, and short enough to sit in a URL. */
    private static final int TOKEN_BYTES = 32;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetNotifier notifier;
    private final PasswordResetProperties properties;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Transactional
    public void requestReset(ForgotPasswordRequest request) {
        var email = Text.normalizeEmail(request.getEmail());

        var user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new InvalidCredentialsException(
                        "email", "No account is registered with that email address."));

        if (!user.isActive()) {
            // A new password would not let them in, so handing one out would only
            // waste their time. Why the account is blocked is not said here.
            throw new ConflictException("email",
                    "That account cannot be reset here. Please get in touch with us.");
        }

        // One live link per account: the previous one stops working the moment a new
        // one is asked for, so an older email cannot still be redeemed.
        tokenRepository.deleteByUserId(user.getId());

        var token = newToken();
        var expiresAt = clock.instant().plus(properties.getTokenValidity());

        tokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .tokenHash(hash(token))
                .expiresAt(expiresAt)
                .build());

        notifier.notifyPasswordReset(user, properties.linkFor(token), expiresAt);
    }

    @Transactional
    public void reset(ResetPasswordRequest request) {
        var token = tokenRepository.findByTokenHash(hash(request.getToken()))
                .filter(candidate -> candidate.isRedeemableAt(clock.instant()))
                .orElseThrow(() -> new BadRequestException(
                        "This reset link is no longer valid. Please ask for a new one."));

        var user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Revokes every token already issued for the account. Somebody who has lost
        // control of it resets the password precisely to end the other session, and a
        // week-long refresh cookie would otherwise outlive the reset.
        user.revokeIssuedTokens();
        userRepository.save(user);

        // Spent, not deleted: a second click is then refused with the message above
        // rather than looking as though nothing happened.
        token.setUsedAt(clock.instant());
        tokenRepository.save(token);
    }

    private static String newToken() {
        var bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        // URL-safe and unpadded, because it travels as a query parameter.
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * SHA-256, hex encoded.
     *
     * A fast hash rather than BCrypt on purpose: the input is 256 bits of randomness,
     * not a human-chosen password, so there is no dictionary to slow down — and the
     * redeem path looks the row up by this value, which a salted hash could not do.
     */
    private static String hash(String token) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            // SHA-256 is required of every JVM, so this cannot happen.
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
