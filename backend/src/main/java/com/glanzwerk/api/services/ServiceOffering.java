package com.glanzwerk.api.services;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A service that can be asked about: what it is called and roughly how long the work
 * itself takes.
 *
 * This is not the same thing as a service *page* on the website. The marketing pages
 * and their SEO copy stay in the Angular catalogue, because they are prerendered and
 * translated at build time. {@code serviceKey} is the join between the two: it holds
 * the same key the frontend catalogue uses, so a booking made here can be shown on
 * the site with the right title, image and link without duplicating any of that copy.
 *
 * Name and description exist in both locales as columns rather than in a translation
 * table. With exactly two locales and two translatable fields, a side table would add
 * a join to every read and a second insert to every write for nothing.
 *
 * There is no price. Appointments are free and this system never quotes for the work,
 * so a price column here would be a number nobody is accountable for.
 */
@Entity
@Table(name = "service_offerings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ServiceOffering {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /** Matches a key in the frontend's service catalogue. Stable, never shown. */
    @Column(name = "service_key", nullable = false, unique = true, length = 60)
    private String serviceKey;

    @Column(name = "name_de", nullable = false)
    private String nameDe;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "description_de", columnDefinition = "TEXT")
    private String descriptionDe;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    /**
     * Roughly how long the work itself takes, in minutes.
     *
     * Information for the client and the office, not a scheduling input: every
     * appointment is one fixed slot regardless, because an appointment is a visit to
     * look at the job rather than the job.
     */
    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    /**
     * An inactive service stays on past appointments but is offered to nobody new,
     * which is why services are deactivated rather than deleted.
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** The name in the caller's locale, German being the site's default. */
    public String nameIn(java.util.Locale locale) {
        return isGerman(locale) ? nameDe : nameEn;
    }

    public String descriptionIn(java.util.Locale locale) {
        return isGerman(locale) ? descriptionDe : descriptionEn;
    }

    private static boolean isGerman(java.util.Locale locale) {
        return locale == null || !"en".equalsIgnoreCase(locale.getLanguage());
    }
}
