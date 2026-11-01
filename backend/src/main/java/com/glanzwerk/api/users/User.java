package com.glanzwerk.api.users;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * An account. Every person the system knows is a row here, whatever their role, so
 * there is exactly one place an email is unique and one password column to protect.
 *
 * Client- and employee-specific fields live in {@code ClientProfile} and
 * {@code EmployeeProfile} rather than as nullable columns on this table.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    /** Always a BCrypt hash. Never serialised: no DTO exposes it. */
    @Column(name = "password", nullable = false)
    private String password;

    /**
     * Bumped whenever the account's credentials change, which revokes its tokens.
     *
     * This is the only revocation this system has. A refresh cookie lives for a week
     * and cannot be withdrawn, so without it a stolen session outlasted the password
     * change made to stop it. Every token carries the version it was minted against;
     * {@code AuthService.refresh} refuses one whose version no longer matches, so every
     * session but the one that made the change dies at its next refresh.
     *
     * A counter and not a {@code passwordChangedAt} timestamp: a JWT's {@code iat} has
     * one-second precision, so comparing against a time revoked the very session that
     * had just changed the password whenever both landed in the same second.
     */
    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private int tokenVersion = 0;

    /** Invalidates every token already issued for this account. */
    public void revokeIssuedTokens() {
        tokenVersion++;
    }

    @Column(name = "phone")
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    /**
     * A deactivated account keeps its history but cannot sign in, which is what
     * blocking a client means — deleting the row would orphan their appointments.
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

    @Override
    public String toString() {
        // Deliberately omits the password hash so no log line can carry it.
        return "User(id=" + id + ", email=" + email + ", role=" + role + ")";
    }
}
