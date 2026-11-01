package com.glanzwerk.api.common;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Turns every exception into one {@link ApiError} shape.
 *
 * The catch-all deliberately returns a fixed sentence and logs the cause instead of
 * echoing {@code getMessage()}: a JPA or driver message tells an attacker the table
 * and column names. Everything above it is a message we wrote ourselves and chose
 * to show.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NotFoundException exception, HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    /**
     * A conflict that is one field's fault answers with that field as well as the
     * sentence, so the form can mark the input the user has to change — registering
     * an address that is already taken marks the email box, rather than leaving the
     * reason to an alert above a form that still looks fine.
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> handleConflict(ConflictException exception, HttpServletRequest request) {
        return fieldAware(HttpStatus.CONFLICT, exception.getField(), exception.getMessage(), request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequest(BadRequestException exception, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ApiError> handleRateLimit(TooManyRequestsException exception, HttpServletRequest request) {
        return error(HttpStatus.TOO_MANY_REQUESTS, exception.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        var fieldErrors = new HashMap<String, String>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.badRequest().body(ApiError.validation(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed.",
                request.getRequestURI(),
                fieldErrors
        ));
    }

    /**
     * A bound-out-of-range request parameter: {@code ?size=500} against {@code @Max(100)}.
     *
     * Spring raises this rather than {@link MethodArgumentNotValidException} for
     * constraints on method parameters, and without a handler of its own it reached
     * the catch-all — so a caller's own mistake came back as a 500 with a stack trace
     * in the log. The exception already carries a 400; this only gives it our shape.
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiError> handleParameterValidation(
            HandlerMethodValidationException exception, HttpServletRequest request) {
        var fieldErrors = new HashMap<String, String>();
        exception.getParameterValidationResults().forEach(result -> {
            var parameter = result.getMethodParameter().getParameterName();
            result.getResolvableErrors().stream()
                    .findFirst()
                    .ifPresent(error -> fieldErrors.putIfAbsent(
                            parameter == null ? "request" : parameter, error.getDefaultMessage()));
        });

        return ResponseEntity.badRequest().body(ApiError.validation(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed.",
                request.getRequestURI(),
                fieldErrors
        ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableBody(HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "Invalid request body.", request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException exception, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "Invalid value for '" + exception.getName() + "'.", request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleIntegrityViolation(DataIntegrityViolationException exception, HttpServletRequest request) {
        // A unique or foreign key the service layer did not catch first. The detail
        // names database objects, so it is logged and not returned.
        log.warn("Constraint violation on {}", request.getRequestURI(), exception);
        return error(HttpStatus.CONFLICT, "That change conflicts with existing data.", request);
    }

    /**
     * A credential failure that will not say more: a refresh cookie that is missing,
     * expired or forged, and any sign-in failure AuthService did not classify itself. Nothing here tells the caller which part was wrong.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(HttpServletRequest request) {
        return error(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.", request);
    }

    /**
     * A sign-in failure that does say which half was wrong — see
     * {@link InvalidCredentialsException} for why, and for what it costs.
     */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(
            InvalidCredentialsException exception, HttpServletRequest request) {
        return fieldAware(HttpStatus.UNAUTHORIZED, exception.getField(), exception.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(HttpServletRequest request) {
        return error(HttpStatus.FORBIDDEN, "You may not perform this action.", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled error on {} {}", request.getMethod(), request.getRequestURI(), exception);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please try again.", request);
    }

    /** The same message, additionally pinned to a field when the caller named one. */
    private ResponseEntity<ApiError> fieldAware(
            HttpStatus status, String field, String message, HttpServletRequest request) {
        if (field == null) {
            return error(status, message, request);
        }

        return ResponseEntity.status(status).body(ApiError.validation(
                status.value(), message, request.getRequestURI(), Map.of(field, message)));
    }

    private ResponseEntity<ApiError> error(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(ApiError.of(status.value(), message, request.getRequestURI()));
    }
}
