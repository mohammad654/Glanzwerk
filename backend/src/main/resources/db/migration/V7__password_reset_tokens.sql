-- ============================================================================
-- Password reset.
--
-- One row per reset request. The token itself is NOT stored: only its SHA-256
-- hash, for the same reason the users table stores a BCrypt hash rather than a
-- password. A dump of this table must not hand the reader a working reset link
-- for every account that asked for one.
--
-- A row is spent once (`used_at`) and expires on its own (`expires_at`), so a
-- link found later in a mailbox or a browser history is worth nothing. Asking
-- for a new link deletes the account's outstanding ones, which is why there is
-- an index on user_id.
--
-- ON DELETE CASCADE: a reset token has no meaning without its account. Unlike
-- appointments, there is no history here worth keeping.
--
-- !! SYNTAX: MariaDB 10.4 (what XAMPP ships). See the note at the top of V5.
-- ============================================================================

CREATE TABLE password_reset_tokens
(
    id         BIGINT AUTO_INCREMENT NOT NULL,
    user_id    BIGINT      NOT NULL,
    -- SHA-256 of the token, hex encoded: always 64 characters. VARCHAR rather than
    -- CHAR because `@Column(length = 64)` maps to VARCHAR, and `ddl-auto: validate`
    -- rejects the mismatch at startup. The rows are all 64 characters either way.
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME    NOT NULL,
    -- NULL until the link is used. A spent row is kept rather than deleted so a
    -- second click on the same link is refused instead of silently doing nothing.
    used_at    DATETIME,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT password_reset_tokens_pk PRIMARY KEY (id),
    -- Unique so a lookup by hash can never match two rows.
    CONSTRAINT password_reset_tokens_hash_uq UNIQUE (token_hash),
    CONSTRAINT password_reset_tokens_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX password_reset_tokens_user_idx ON password_reset_tokens (user_id);
