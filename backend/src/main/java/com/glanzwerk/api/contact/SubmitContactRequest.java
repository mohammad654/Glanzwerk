package com.glanzwerk.api.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * The contact form's payload.
 *
 * The rules mirror the Angular form's validators on purpose. The browser's copy is a
 * courtesy that saves a round trip; this one is the guard, because anyone can post
 * straight to the endpoint. The one unauthenticated write in the API is also the one
 * most worth validating tightly.
 */
@Data
public class SubmitContactRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between {min} and {max} characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 254, message = "Email must be at most {max} characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9+()\\s-]{6,30}$", message = "Phone number is not valid")
    private String phone;

    /** Optional: the service they picked, by id from the public catalogue. */
    private Long serviceId;

    @NotBlank(message = "Message is required")
    @Size(min = 10, max = 2000, message = "Message must be between {min} and {max} characters")
    private String message;

    /**
     * The consent checkbox. Required to be true, and stored nowhere: it is a condition
     * of accepting the message, and the record's existence is the evidence it was given.
     */
    @jakarta.validation.constraints.AssertTrue(message = "Please accept the privacy policy")
    private boolean consent;

    /**
     * A honeypot. The real form keeps this field hidden and empty; a bot that fills in
     * every input it finds will put something here, and we drop the message quietly.
     * Cheap, invisible to people, and needs no third-party captcha.
     */
    private String website;
}
