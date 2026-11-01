package com.glanzwerk.api.services;

import java.util.Locale;

import org.springframework.stereotype.Component;

/**
 * Hand-written rather than generated: the public DTO picks one of two name columns
 * based on the caller's locale, which is a decision and not a field copy.
 */
@Component
public class ServiceMapper {

    public ServiceDto toDto(ServiceOffering service, Locale locale) {
        return new ServiceDto(
                service.getId(),
                service.getServiceKey(),
                service.nameIn(locale),
                service.descriptionIn(locale),
                service.getDurationMinutes());
    }

    public ServiceAdminDto toAdminDto(ServiceOffering service) {
        return new ServiceAdminDto(
                service.getId(),
                service.getServiceKey(),
                service.getNameDe(),
                service.getNameEn(),
                service.getDescriptionDe(),
                service.getDescriptionEn(),
                service.getDurationMinutes(),
                service.isActive(),
                service.getCreatedAt(),
                service.getUpdatedAt());
    }
}
