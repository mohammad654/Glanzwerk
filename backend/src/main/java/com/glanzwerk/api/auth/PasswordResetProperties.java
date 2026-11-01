package com.glanzwerk.api.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/**
 * How long a reset link lives, and where it points.
 *
 * The link has to be configuration: the API does not know what origin the site is
 * served from, and it is a different one in development, in the preview and in
 * production. Building it here rather than in the notifier keeps one place that knows
 * the URL, whatever delivers it.
 */
@ConfigurationProperties(prefix = "glanzwerk.password-reset")
@Getter
@Setter
public class PasswordResetProperties {
    /**
     * Short on purpose. The link is a credential sitting in a mailbox, and an hour is
     * long enough to walk to the computer and far too short to be worth hoarding.
     */
    private Duration tokenValidity = Duration.ofHours(1);

    /** The reset form's address. {@code {token}} is replaced with the token. */
    private String linkTemplate = "http://localhost:4300/de/passwort-neu-setzen?token={token}";

    public String linkFor(String token) {
        return linkTemplate.replace("{token}", token);
    }
}
