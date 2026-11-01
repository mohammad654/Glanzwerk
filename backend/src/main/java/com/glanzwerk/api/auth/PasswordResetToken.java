package com.glanzwerk.api.auth;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import com.glanzwerk.api.users.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * One outstanding "I forgot my password" request.
 *
 * {@code tokenHash} is a SHA-256 of the token that went out, never the token itself —
 * the same reasoning as the password column. A leak of this table has to be useless,
 * and it is: a hash cannot be put in a URL.
 *
 * A row is spent once and expires on its own, so a link sitting in an old mailbox or
 * a shared browser history cannot be redeemed. {@code usedAt} is set rather than the
 * row deleted, so clicking the same link twice is refused with an explanation instead
 * of looking like the first click never happened.
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, length = 64, updatable = false)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Spendable: not already used, and not past its expiry. */
    public boolean isRedeemableAt(Instant now) {
        return usedAt == null && expiresAt.isAfter(now);
    }

    @Override
    public String toString() {
        // Deliberately omits the hash: a log line must not carry a reset credential,
        // even a hashed one.
        return "PasswordResetToken(id=" + id + ", expiresAt=" + expiresAt + ")";
    }
}
