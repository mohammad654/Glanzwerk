package com.glanzwerk.api.common;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Writes an {@link ApiError} straight onto the response.
 *
 * {@link GlobalExceptionHandler} covers everything that reaches a controller, but the
 * security filter chain rejects requests before that: an absent token and a wrong role
 * are both turned away by the filters, which used to answer with a bare status and an
 * empty body. That broke the one promise the API makes about failures — that every one
 * of them is this shape — so the browser had nothing to read and fell back to a generic
 * sentence for the two cases a user is most likely to hit.
 */
@Component
@RequiredArgsConstructor
public class ApiErrorWriter {
    private final ObjectMapper objectMapper;

    public void write(HttpServletRequest request, HttpServletResponse response,
                      HttpStatus status, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(
                response.getOutputStream(),
                ApiError.of(status.value(), message, request.getRequestURI()));
    }
}
