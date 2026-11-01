package com.glanzwerk.api.employees;

import java.util.List;
import java.util.Locale;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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

@RestController
@RequestMapping("/api/v1/admin/employees")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminEmployeeController {
    private final EmployeeService employees;

    @GetMapping
    public List<EmployeeDto> list(Locale locale) {
        return employees.list(locale);
    }

    @GetMapping("/{id}")
    public EmployeeDto get(@PathVariable Long id, Locale locale) {
        return employees.get(id, locale);
    }

    @PostMapping
    public ResponseEntity<EmployeeDto> create(
            @Valid @RequestBody CreateEmployeeRequest request, Locale locale, UriComponentsBuilder uri) {
        var created = employees.create(request, locale);
        return ResponseEntity
                .created(uri.path("/api/v1/admin/employees/{id}").buildAndExpand(created.id()).toUri())
                .body(created);
    }

    @PutMapping("/{id}")
    public EmployeeDto update(@PathVariable Long id, @Valid @RequestBody UpdateEmployeeRequest request, Locale locale) {
        return employees.update(id, request, locale);
    }

    /** Only for a record with no history behind it — see {@link EmployeeService#delete}. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employees.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    public EmployeeDto activate(@PathVariable Long id, Locale locale) {
        return employees.setActive(id, true, locale);
    }

    @PostMapping("/{id}/deactivate")
    public EmployeeDto deactivate(@PathVariable Long id, Locale locale) {
        return employees.setActive(id, false, locale);
    }
}
