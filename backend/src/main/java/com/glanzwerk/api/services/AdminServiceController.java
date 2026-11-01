package com.glanzwerk.api.services;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Service management. Under {@code /admin}, which the URL rules already close to
 * everyone but an administrator; the annotations repeat it per method so a change to
 * the path cannot quietly open these.
 */
@RestController
@RequestMapping("/api/v1/admin/services")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminServiceController {
    private final ServiceCatalogService catalog;

    @GetMapping
    public List<ServiceAdminDto> list() {
        return catalog.listAll();
    }

    @GetMapping("/{id}")
    public ServiceAdminDto get(@PathVariable Long id) {
        return catalog.get(id);
    }

    @PostMapping
    public ResponseEntity<ServiceAdminDto> create(@Valid @RequestBody ServiceRequest request, UriComponentsBuilder uri) {
        var created = catalog.create(request);
        return ResponseEntity
                .created(uri.path("/api/v1/admin/services/{id}").buildAndExpand(created.id()).toUri())
                .body(created);
    }

    @PutMapping("/{id}")
    public ServiceAdminDto update(@PathVariable Long id, @Valid @RequestBody ServiceRequest request) {
        return catalog.update(id, request);
    }

    @PostMapping("/{id}/activate")
    public ServiceAdminDto activate(@PathVariable Long id) {
        return catalog.setActive(id, true);
    }

    @PostMapping("/{id}/deactivate")
    public ServiceAdminDto deactivate(@PathVariable Long id) {
        return catalog.setActive(id, false);
    }
}
