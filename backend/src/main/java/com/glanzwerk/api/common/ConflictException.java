package com.glanzwerk.api.common;

/**
 * The request is well formed but collides with the current state of the data: a
 * duplicate email, a double-booked employee, a booking that cannot leave its status.
 *
 * A collision that is one field's fault can name it, so the form marks that input
 * rather than only showing a sentence at the top. {@code field} is null when the
 * conflict belongs to the request as a whole.
 */
public class ConflictException extends RuntimeException {
    private final String field;

    public ConflictException(String message) {
        this(null, message);
    }

    public ConflictException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
