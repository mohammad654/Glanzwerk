package com.glanzwerk.api.appointments;

import java.util.List;
import java.util.Locale;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import com.glanzwerk.api.auth.CurrentUser;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * A client's own appointments.
 *
 * Every method works from {@code currentUser.requireId()}, so there is no path here
 * that can be pointed at another account's data. {@code CLIENT} only: administrators
 * work through the dashboard, and letting an admin token through here would make "my
 * appointments" quietly mean something different depending on who asked.
 */
@RestController
@RequestMapping("/api/v1/appointments")
@PreAuthorize("hasRole('CLIENT')")
@RequiredArgsConstructor
public class AppointmentController {
    private final AppointmentService appointments;
    private final CurrentUser currentUser;

    @GetMapping("/mine")
    public List<AppointmentDto> mine(Locale locale) {
        return appointments.listForClient(currentUser.requireId(), locale);
    }

    @PostMapping
    public ResponseEntity<AppointmentDto> create(
            @Valid @RequestBody CreateAppointmentRequest request, Locale locale, UriComponentsBuilder uri) {
        var created = appointments.create(currentUser.requireId(), request, locale);
        return ResponseEntity
                .created(uri.path("/api/v1/appointments/{id}").buildAndExpand(created.id()).toUri())
                .body(created);
    }

    @PostMapping("/{id}/cancel")
    public AppointmentDto cancel(@PathVariable Long id, Locale locale) {
        return appointments.cancelAsClient(currentUser.requireId(), id, locale);
    }
}
