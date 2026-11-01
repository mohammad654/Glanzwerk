package com.glanzwerk.api.services;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glanzwerk.api.common.ConflictException;
import com.glanzwerk.api.common.NotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * The service catalogue: what the public site may book and what the dashboard edits.
 *
 * Nothing here deletes a service. A deleted row would break every booking that
 * referenced it, and the database forbids it anyway ({@code ON DELETE RESTRICT}), so
 * "remove from the offering" is modelled as deactivation and ends up being reversible.
 */
@Service
@RequiredArgsConstructor
public class ServiceCatalogService {
    private final ServiceOfferingRepository repository;
    private final ServiceMapper mapper;

    /** What a visitor may request an appointment about, in their language. */
    @Transactional(readOnly = true)
    public List<ServiceDto> listBookable(Locale locale) {
        return repository.findByActiveTrueOrderByNameDeAsc().stream()
                .map(service -> mapper.toDto(service, locale))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceAdminDto> listAll() {
        return repository.findAllByOrderByNameDeAsc().stream()
                .map(mapper::toAdminDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceAdminDto get(Long id) {
        return mapper.toAdminDto(require(id));
    }

    @Transactional
    public ServiceAdminDto create(ServiceRequest request) {
        if (repository.existsByServiceKeyIgnoreCase(request.getServiceKey())) {
            throw new ConflictException("A service with that key already exists.");
        }

        var service = ServiceOffering.builder()
                .serviceKey(request.getServiceKey().trim())
                .nameDe(request.getNameDe().trim())
                .nameEn(request.getNameEn().trim())
                .descriptionDe(request.getDescriptionDe())
                .descriptionEn(request.getDescriptionEn())
                .durationMinutes(request.getDurationMinutes())
                .active(true)
                .build();

        return mapper.toAdminDto(repository.save(service));
    }

    @Transactional
    public ServiceAdminDto update(Long id, ServiceRequest request) {
        var service = require(id);

        var key = request.getServiceKey().trim();
        if (!key.equalsIgnoreCase(service.getServiceKey()) && repository.existsByServiceKeyIgnoreCase(key)) {
            throw new ConflictException("A service with that key already exists.");
        }

        service.setServiceKey(key);
        service.setNameDe(request.getNameDe().trim());
        service.setNameEn(request.getNameEn().trim());
        service.setDescriptionDe(request.getDescriptionDe());
        service.setDescriptionEn(request.getDescriptionEn());
        service.setDurationMinutes(request.getDurationMinutes());

        return mapper.toAdminDto(repository.save(service));
    }

    @Transactional
    public ServiceAdminDto setActive(Long id, boolean active) {
        var service = require(id);
        service.setActive(active);
        return mapper.toAdminDto(repository.save(service));
    }

    /** The entity, for the booking flow. Package-visible callers get a loud 404 instead of null. */
    @Transactional(readOnly = true)
    public ServiceOffering require(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service not found."));
    }

    /** The entity, only if appointments may still be made about it. */
    @Transactional(readOnly = true)
    public ServiceOffering requireBookable(Long id) {
        var service = require(id);
        if (!service.isActive()) {
            throw new ConflictException("That service is no longer offered.");
        }
        return service;
    }
}
