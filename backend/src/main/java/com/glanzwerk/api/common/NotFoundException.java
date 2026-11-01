package com.glanzwerk.api.common;

/** The addressed record does not exist, or the caller may not know that it does. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
