package com.glanzwerk.api.common;

/**
 * Sign-in failed, and the response says which half of it was wrong.
 *
 * {@code field} names the form field to put the message under — {@code "email"} when
 * no account has that address, {@code "password"} when the account exists and the
 * password does not match — so the sign-in form can mark the right input instead of
 * showing one sentence above both.
 *
 * This is a deliberate trade against {@link org.springframework.security.authentication.BadCredentialsException},
 * which the handler reports identically either way: distinguishing the two lets a
 * stranger test whether an address has an account here. It was asked for because
 * "email or password is incorrect" leaves a customer retyping a password for an
 * account that was never created. The rate limit on {@code /auth/login} is what keeps
 * the distinction from being usable as a bulk oracle.
 */
public class InvalidCredentialsException extends RuntimeException {
    private final String field;

    public InvalidCredentialsException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
