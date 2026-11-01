package com.glanzwerk.api.services;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {
    List<ServiceOffering> findByActiveTrueOrderByNameDeAsc();

    List<ServiceOffering> findAllByOrderByNameDeAsc();

    Optional<ServiceOffering> findByServiceKey(String serviceKey);

    boolean existsByServiceKeyIgnoreCase(String serviceKey);

    long countByActiveTrue();
}
