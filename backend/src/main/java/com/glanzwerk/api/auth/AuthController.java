package com.glanzwerk.api.auth;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.glanzwerk.api.common.RateLimiter;
import com.glanzwerk.api.common.RequestIp;
import com.glanzwerk.api.common.Text;
import com.glanzwerk.api.common.TooManyRequestsException;
import com.glanzwerk.api.users.RegisterRequest;
import com.glanzwerk.api.users.UserDto;
import com.glanzwerk.api.users.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Registration and sessions.
 *
 * {@code /register} creates a CLIENT and nothing else. It does not sign the new
 * account in: the client posts to {@code /login} next, which keeps one code path for
 * minting tokens.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    /** Attempts per window, per caller. Enough for a forgetful person, not for a script. */
    private static final int LOGIN_ATTEMPT_LIMIT = 10;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(5);
    /**
     * Wrong passwords per window, per account.
     *
     * The per-caller limit above does nothing against a password list spread over many
     * addresses, which is how online guessing is actually done, so the account gets a
     * budget of its own. Only *failures* are counted — a correct password never spends
     * any of it — but the budget is checked before the attempt, so once it is gone the
     * account is refused for the rest of the window whatever is submitted.
     *
     * That is the trade, and it is the usual one: a stranger can keep an account out of
     * its own sign-in form for up to fifteen minutes. The alternative is not bounding
     * online guessing at all, which is worse. The numbers are chosen so the lockout
     * stays cheap and rare — twenty wrong passwords is far past anybody genuinely
     * trying to remember theirs, fifteen minutes heals by itself, and the password
     * reset route is not rate limited against this key, so the real owner has a way
     * back in that does not wait for the window.
     *
     * Note that a single caller trips the ten-per-five-minutes limit above long before
     * this one, which is why this exists for the distributed case and not for the
     * ordinary one.
     */
    private static final int FAILED_LOGIN_LIMIT = 20;
    private static final Duration FAILED_LOGIN_WINDOW = Duration.ofMinutes(15);
    private static final int REGISTER_LIMIT = 5;
    private static final Duration REGISTER_WINDOW = Duration.ofHours(1);
    /**
     * Reset links are limited twice over: by address, so one person's inbox cannot be
     * filled from many machines, and by address-plus-caller, so one machine cannot
     * work through a list of addresses.
     */
    private static final int FORGOT_PASSWORD_LIMIT = 3;
    private static final Duration FORGOT_PASSWORD_WINDOW = Duration.ofHours(1);
    private static final int RESET_PASSWORD_LIMIT = 10;
    private static final Duration RESET_PASSWORD_WINDOW = Duration.ofHours(1);

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final UserService userService;
    private final JwtConfig jwtConfig;
    private final RefreshCookies refreshCookies;
    private final RateLimiter rateLimiter;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        limit("register:" + RequestIp.of(httpRequest), REGISTER_LIMIT, REGISTER_WINDOW);
        return ResponseEntity.status(201).body(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<SessionResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        limit("login:" + RequestIp.of(httpRequest), LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW);

        var failureKey = "login-failed:" + Text.normalizeEmail(request.getEmail());
        if (rateLimiter.isExhausted(failureKey, FAILED_LOGIN_LIMIT)) {
            throw new TooManyRequestsException("Too many failed sign-in attempts for that account. "
                    + "Please try again later or reset your password.");
        }

        LoginResult result;
        try {
            result = authService.login(request);
        } catch (RuntimeException exception) {
            // Charged on the failure, not on the attempt — see FAILED_LOGIN_LIMIT.
            rateLimiter.record(failureKey, FAILED_LOGIN_WINDOW);
            throw exception;
        }

        var response = ResponseEntity.ok();
        refreshCookies.issue(result.refreshToken())
                .forEach(cookie -> response.header(HttpHeaders.SET_COOKIE, cookie.toString()));

        return response.body(session(result));
    }

    /**
     * The cookie is read by name rather than from a header, and is the only credential
     * this endpoint accepts. {@code required = false} so a visitor with no session gets
     * a clean 401 instead of a 400 about a missing cookie.
     */
    @PostMapping("/refresh")
    public SessionResponse refresh(@CookieValue(value = RefreshCookies.REFRESH_NAME, required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new org.springframework.security.authentication.BadCredentialsException("No refresh token");
        }
        return session(authService.refresh(refreshToken));
    }

    /**
     * Starts a password reset. Answers 204 whether or not a link went out — there is
     * nothing to return, and the message belongs to the email, not to this response.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        var email = Text.normalizeEmail(request.getEmail());
        limit("forgot:" + email, FORGOT_PASSWORD_LIMIT, FORGOT_PASSWORD_WINDOW);
        limit("forgot:" + RequestIp.of(httpRequest), FORGOT_PASSWORD_LIMIT, FORGOT_PASSWORD_WINDOW);

        passwordResetService.requestReset(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Redeems a reset link. Rate limited against guessing: the token is 256 bits, so
     * this only closes the door on a client that is trying anyway.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request, HttpServletRequest httpRequest) {
        limit("reset:" + RequestIp.of(httpRequest), RESET_PASSWORD_LIMIT, RESET_PASSWORD_WINDOW);

        passwordResetService.reset(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Access tokens are stateless and stay valid until they expire, which is why
        // they are short-lived. Clearing the cookie ends the ability to get new ones.
        var response = ResponseEntity.noContent();
        refreshCookies.clear()
                .forEach(cookie -> response.header(HttpHeaders.SET_COOKIE, cookie.toString()));

        return response.build();
    }

    private SessionResponse session(LoginResult result) {
        return new SessionResponse(
                result.accessToken().toString(),
                jwtConfig.getAccessTokenExpiration(),
                result.user());
    }

    private void limit(String key, int limit, Duration window) {
        if (!rateLimiter.tryAcquire(key, limit, window)) {
            throw new TooManyRequestsException("Too many attempts. Please try again later.");
        }
    }
}
