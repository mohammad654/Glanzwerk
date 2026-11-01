package com.glanzwerk.api.common;

/** The caller has exceeded a rate limit. */
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}
