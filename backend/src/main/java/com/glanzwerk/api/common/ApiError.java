package com.glanzwerk.api.common;

import java.time.Instant;
import java.util.Map;

/**
 * The only shape an error response ever takes.
 *
 * Success responses are bare DTOs, so a client can tell the two apart by status code
 * alone and never has to unwrap a payload. {@code fieldErrors} is populated only for
 * validation failures and omitted otherwise.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
    public static ApiError of(int status, String message, String path) {
        return new ApiError(Instant.now(), status, message, path, null);
    }

    public static ApiError validation(int status, String message, String path, Map<String, String> fieldErrors) {
        return new ApiError(Instant.now(), status, message, path, fieldErrors);
    }
}
