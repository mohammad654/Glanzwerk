package com.glanzwerk.api.appointments;

import java.time.LocalDate;
import java.util.Locale;

import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.glanzwerk.api.common.PagedResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/**
 * Appointment management.
 *
 * The page size is capped, because an uncapped {@code size} parameter is a denial of
 * service anyone with a dashboard login can trigger by asking for a million rows.
 */
@RestController
@RequestMapping("/api/v1/admin/appointments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminAppointmentController {
    private static final int MAX_PAGE_SIZE = 100;
    /**
     * A search box, not a payload. Without a cap the parameter is an open door for a
     * megabyte of text that then becomes a leading-wildcard LIKE over every row.
     */
    private static final int MAX_QUERY_LENGTH = 120;

    private final AppointmentService appointments;

    @GetMapping
    public PagedResponse<AppointmentDto> list(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) @Size(max = MAX_QUERY_LENGTH) String query,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(MAX_PAGE_SIZE) int size,
            Locale locale) {
        var filter = new AppointmentFilter(status, employeeId, clientId, from, to, query);
        return appointments.search(filter, PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE)), locale);
    }

    @GetMapping("/stats")
    public AppointmentStatsDto stats() {
        return appointments.stats();
    }

    @GetMapping("/{id}")
    public AppointmentDto get(@PathVariable Long id, Locale locale) {
        return appointments.get(id, locale);
    }

    @PutMapping("/{id}")
    public AppointmentDto update(
            @PathVariable Long id, @Valid @RequestBody UpdateAppointmentRequest request, Locale locale) {
        return appointments.update(id, request, locale);
    }

    /** For a row that should never have been there — see {@link AppointmentService#delete}. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointments.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/status")
    public AppointmentDto changeStatus(
            @PathVariable Long id, @Valid @RequestBody ChangeAppointmentStatusRequest request, Locale locale) {
        return appointments.changeStatus(id, request.getStatus(), locale);
    }
}
