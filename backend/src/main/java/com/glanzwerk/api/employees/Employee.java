package com.glanzwerk.api.employees;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.glanzwerk.api.services.ServiceOffering;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A member of staff.
 *
 * Deliberately **not** an account. They used to be a row in {@code users} with role
 * EMPLOYEE and a password, and it bought nothing: there is no employee-facing screen,
 * and an employee's token was refused by every endpoint except {@code /users/me}. So
 * there is no password column here, no role, and no way to sign in as one — an
 * employee is a record an administrator keeps, and nothing more.
 *
 * Email and phone are contact details rather than credentials. Email is unique only
 * so the same person is not entered twice by accident, and is nullable because we may
 * only have a mobile number for someone.
 */
@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email", length = 254)
    private String email;

    @Column(name = "phone", length = 30)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_role", nullable = false, length = 20)
    private JobRole jobRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Column(name = "weekly_hours", nullable = false)
    private int weeklyHours;

    @Column(name = "hired_on", nullable = false)
    private LocalDate hiredOn;

    /**
     * Someone who has left is deactivated, never deleted: their appointments are
     * business records, and the database refuses to drop a row one points at.
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * Which services this person is trained for. Eagerly fetched because every read
     * of an employee shows them, and a lazy set here is the classic N+1 on the list.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "employee_skills",
            joinColumns = @JoinColumn(name = "employee_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    @Builder.Default
    private Set<ServiceOffering> skills = new LinkedHashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Whether this person can be put on new work right now. */
    public boolean isSchedulable() {
        return active && status == EmployeeStatus.ACTIVE;
    }
}
