package com.glanzwerk.api.users;

import static java.lang.annotation.ElementType.ANNOTATION_TYPE;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.ReportAsSingleViolation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The password policy, declared once.
 *
 * Three request bodies accept a new password — registration, changing one, and
 * redeeming a reset link — and all three carried their own copy of the same
 * {@code @Size} and {@code @Pattern}. Three copies of a security rule is three chances
 * for one of them to be relaxed without the others, and the one that drifts is the hole.
 * A composed constraint keeps each DTO declaring its own field while there is only one
 * definition of what "acceptable" means.
 *
 * It must agree character for character with {@code shared/password-rules.ts} in the
 * frontend, which ticks these requirements off as the user types. Note the plain
 * {@code [A-Z]}: it does not match {@code Ä}, and the browser-side rule does not either.
 *
 * <p>{@code max = 72} is BCrypt's own limit. Anything past it is silently ignored when
 * hashing, so accepting a longer password would quietly weaken it.
 *
 * <p>{@link ReportAsSingleViolation} so a password that breaks two rules comes back as
 * one message under one field, rather than as a stack of them.
 */
@Documented
@Constraint(validatedBy = {})
@Target({FIELD, PARAMETER, ANNOTATION_TYPE})
@Retention(RUNTIME)
@ReportAsSingleViolation
@NotBlank
@Size(min = StrongPassword.MIN_LENGTH, max = StrongPassword.MAX_LENGTH)
@Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$")
public @interface StrongPassword {
    int MIN_LENGTH = 8;

    /** BCrypt ignores anything beyond 72 characters, so the policy stops there too. */
    int MAX_LENGTH = 72;

    String message = "Password must be 8 to 72 characters and contain "
            + "an uppercase letter, a lowercase letter and a digit";

    String message() default message;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
