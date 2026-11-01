package com.glanzwerk.api.contact;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

@RestController
@RequestMapping("/api/v1/admin/contact-requests")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminContactController {
    private static final int MAX_PAGE_SIZE = 100;
    /**
     * A search box, not a payload. Without a cap the parameter is an open door for a
     * megabyte of text that then becomes a leading-wildcard LIKE over every row.
     */
    private static final int MAX_QUERY_LENGTH = 120;

    private final ContactService contactService;

    @GetMapping
    public PagedResponse<ContactRequestDto> list(
            @RequestParam(required = false) ContactRequestStatus status,
            @RequestParam(required = false) @Size(max = MAX_QUERY_LENGTH) String query,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(MAX_PAGE_SIZE) int size) {
        return contactService.search(status, query, PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE)));
    }

    @GetMapping("/{id}")
    public ContactRequestDto get(@PathVariable Long id) {
        return contactService.get(id);
    }

    @PutMapping("/{id}")
    public ContactRequestDto update(@PathVariable Long id, @Valid @RequestBody UpdateContactRequest request) {
        return contactService.update(id, request);
    }
}
