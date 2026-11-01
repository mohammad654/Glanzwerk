package com.glanzwerk.api.services;

import java.util.List;
import java.util.Locale;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * The public, read-only view of the catalogue, used by the booking form and the
 * contact form's service picker.
 *
 * {@code Locale} is resolved from the request's {@code Accept-Language}, so the German
 * build of the site gets German names without asking for them. Only active services
 * are ever returned, so no caller can discover what we have stopped offering.
 */
@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
public class ServiceController {
    private final ServiceCatalogService catalog;

    @GetMapping
    public List<ServiceDto> list(Locale locale) {
        return catalog.listBookable(locale);
    }
}
