package com.glanzwerk.api.contact;

import java.time.Duration;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.glanzwerk.api.common.RateLimiter;
import com.glanzwerk.api.common.RequestIp;
import com.glanzwerk.api.common.TooManyRequestsException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * The website's contact form.
 *
 * The only write in the API a stranger can reach, so it is the only one that carries
 * three separate guards: bean validation on the payload, a honeypot field for bots
 * that fill everything in, and a per-address rate limit for the ones that come back.
 *
 * The response is 202, not 201: it is accepted for a human to answer, and no caller
 * is given a URL to read it back from.
 */
@RestController
@RequestMapping("/api/v1/contact-requests")
@RequiredArgsConstructor
public class ContactController {
    private static final int SUBMISSION_LIMIT = 5;
    private static final Duration SUBMISSION_WINDOW = Duration.ofHours(1);

    private final ContactService contactService;
    private final RateLimiter rateLimiter;

    @PostMapping
    public ResponseEntity<Void> submit(@Valid @RequestBody SubmitContactRequest request, HttpServletRequest httpRequest) {
        var key = "contact:" + RequestIp.of(httpRequest);
        if (!rateLimiter.tryAcquire(key, SUBMISSION_LIMIT, SUBMISSION_WINDOW)) {
            throw new TooManyRequestsException("Too many messages sent. Please try again later.");
        }

        contactService.submit(request);
        return ResponseEntity.accepted().build();
    }
}
