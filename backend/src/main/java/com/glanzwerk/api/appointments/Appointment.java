package com.glanzwerk.api.appointments;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.glanzwerk.api.employees.Employee;
import com.glanzwerk.api.services.ServiceOffering;
import com.glanzwerk.api.users.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One appointment: a client, a service they want looked at, a time, and a place.
 *
 * There is no price. An appointment is free — it is somebody coming out to see the
 * job — and what the work itself costs is agreed afterwards, outside this system.
 * That is why nothing here, and nothing in the service catalogue, carries money.
 *
 * Every appointment is the same length, {@code glanzwerk.appointments.slot-minutes}.
 * The service decides what is being looked at, not how long looking takes, which is
 * what makes a single slot grid possible for the whole business.
 *
 * Times are {@link LocalDateTime}: an appointment is a wall-clock commitment in
 * Dresden, and storing it as an instant would move it by an hour twice a year. That
 * only holds if nothing converts them on the way to the database — which is why
 * {@code hibernate.jdbc.time_zone} is deliberately unset and the datasource URL
 * carries {@code connectionTimeZone=LOCAL&preserveInstants=false}. See
 * `application.yaml`. The audit columns are {@link Instant}, because those are
 * moments in time rather than wall-clock commitments.
 */
@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_user_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceOffering service;

    /**
     * Null until somebody is put on the job. An {@link Employee} is a plain staff
     * record with no login, so this is not a user and cannot be confused for one.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    /** Always the start plus one slot. Stored so the overlap query stays a plain range. */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.REQUESTED;

    @Column(name = "street", nullable = false)
    private String street;

    @Column(name = "postal_code", nullable = false, length = 20)
    private String postalCode;

    @Column(name = "city", nullable = false, length = 120)
    private String city;

    private static final Pattern REFERENCE = Pattern.compile("(?i)gw[-\\s]?0*(\\d{1,18})");

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * The number both sides quote on the phone, derived from the id rather than
     * stored. A stored reference would need its own sequence, its own uniqueness
     * check and a second write after the insert, all to hold a value the id already
     * determines.
     */
    public String getReference() {
        return id == null ? null : "GW-%05d".formatted(id);
    }

    /**
     * The id a reference points at, or null when the text is not one.
     *
     * It sits next to {@link #getReference()} because the two have to agree, and
     * tolerates what a person actually types off a confirmation mail: lower case, the
     * dash left out, the leading zeros left off.
     */
    public static Long idFromReference(String text) {
        if (text == null) {
            return null;
        }
        var match = REFERENCE.matcher(text.trim());
        return match.matches() ? Long.valueOf(match.group(1)) : null;
    }
}
