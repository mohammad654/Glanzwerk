package com.glanzwerk.api.common;

/**
 * A rule that bean validation cannot express on its own — a start time in the past,
 * a service that is no longer bookable, a status transition that makes no sense.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
