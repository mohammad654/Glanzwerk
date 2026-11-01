package com.glanzwerk.api.auth;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    /**
     * The account is needed in every case this is called, so it is fetched with the
     * token rather than lazily afterwards.
     */
    @EntityGraph(attributePaths = "user")
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Asking for a new link invalidates the ones already sent. */
    void deleteByUserId(Long userId);

    /**
     * Clears out rows that can no longer be redeemed: past their expiry, or already
     * spent. See {@link PasswordResetTokenCleanup} for why this is swept rather than
     * cleaned up inline.
     */
    @Modifying
    @Query("delete from PasswordResetToken t where t.expiresAt < :now or t.usedAt is not null")
    int deleteExpiredOrUsedBefore(@Param("now") Instant now);
}
