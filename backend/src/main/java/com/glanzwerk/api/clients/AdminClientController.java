package com.glanzwerk.api.clients;

import java.util.List;
import java.util.Locale;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/clients")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminClientController {
    /** A search box, not a payload — see {@code AdminAppointmentController}. */
    private static final int MAX_QUERY_LENGTH = 120;

    private final ClientService clients;

    @GetMapping
    public List<ClientSummaryDto> list(
            @RequestParam(required = false) @Size(max = MAX_QUERY_LENGTH) String query) {
        return clients.list(query);
    }

    @GetMapping("/{id}")
    public ClientDetailDto get(@PathVariable Long id, Locale locale) {
        return clients.get(id, locale);
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        clients.setActive(id, true);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        clients.setActive(id, false);
        return ResponseEntity.noContent().build();
    }
}
