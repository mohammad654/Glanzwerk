-- =============================================================================
-- Glanzwerk: the whole schema.
--
-- This is the flattened end state of what used to be eight migrations. The
-- intermediate steps (bookings renamed to appointments, prices dropped, employee
-- accounts turned into plain records) described a history no database needs to
-- replay, so the tables are now declared the way the entities expect them.
--
-- Shape of the model:
--   users                  every person who can sign in, whatever their role.
--                          One place an email is unique, one password to protect.
--   service_offerings      what can be booked, named in both locales.
--   employees              a member of staff. NOT an account: no password and no
--                          way to sign in.
--   employee_skills        which services a member of staff is trained for.
--   appointments           one visit. Free of charge, one fixed slot.
--   contact_requests       website enquiries, stored before any email is attempted.
--   password_reset_tokens  one row per outstanding "I forgot my password".
--
-- Three modelling decisions worth not re-litigating:
--
--   There is deliberately no `clients` table: a client is a user with role CLIENT.
--   A second table holding their name and email again would be two sources for one
--   fact. Where the work happens is on the appointment, not on the client, because
--   the same client books for different addresses.
--
--   `employees` is not `users`. Staff have no login, so they are not accounts, and
--   there is no EMPLOYEE role. Their email is a contact detail, unique only so the
--   same person is not entered twice, and nullable.
--
--   There is no price anywhere. An appointment is a visit to come and look at the
--   job; what the work costs is agreed afterwards, outside this system.
--
-- !! SYNTAX: this runs on MariaDB 10.4 (what XAMPP ships), not MySQL. Keep to what
-- !! 10.4 accepts if this file is ever extended.
-- =============================================================================

CREATE TABLE users
(
    id            BIGINT AUTO_INCREMENT NOT NULL,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(254) NOT NULL,
    -- BCrypt hash. 60 characters today; the column is wider so a future, longer
    -- algorithm does not need a migration of every row.
    password      VARCHAR(255) NOT NULL,
    -- The only revocation this system has. Every access and refresh token carries
    -- the value it was minted against as a `tv` claim, and `AuthService.refresh`
    -- refuses one that no longer matches the row, so changing or resetting a
    -- password ends every other session within the access token's fifteen minutes
    -- instead of leaving a week-long refresh cookie alive.
    --
    -- A counter rather than a `password_changed_at` timestamp on purpose: a JWT's
    -- `iat` has one-second precision, so comparing against a time revoked the very
    -- session that had just changed the password whenever both landed in the same
    -- second. A counter has no precision to lose.
    token_version INT          NOT NULL DEFAULT 0,
    phone         VARCHAR(30),
    role          VARCHAR(20)  NOT NULL DEFAULT 'CLIENT',
    -- Deactivation instead of deletion: a departed client's appointments must still
    -- point at a real row.
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT users_pk PRIMARY KEY (id),
    CONSTRAINT users_email_unique UNIQUE (email),
    -- No EMPLOYEE: staff are rows in `employees`, not accounts.
    CONSTRAINT users_role_check CHECK (role IN ('CLIENT', 'ADMIN'))
);

CREATE TABLE service_offerings
(
    id               BIGINT AUTO_INCREMENT NOT NULL,
    -- Matches a key in the Angular service catalogue, which owns the marketing copy
    -- and the SEO pages. This is the join between the two halves of the system.
    service_key      VARCHAR(60)  NOT NULL,
    name_de          VARCHAR(255) NOT NULL,
    name_en          VARCHAR(255) NOT NULL,
    description_de   TEXT,
    description_en   TEXT,
    -- What we tell a client the work itself takes. It does NOT decide how long an
    -- appointment is: every appointment is one fixed slot.
    duration_minutes INT          NOT NULL,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT service_offerings_pk PRIMARY KEY (id),
    CONSTRAINT service_offerings_key_unique UNIQUE (service_key),
    CONSTRAINT service_offerings_duration_check CHECK (duration_minutes > 0)
);

CREATE TABLE employees
(
    id           BIGINT AUTO_INCREMENT NOT NULL,
    name         VARCHAR(255) NOT NULL,
    -- Contact details, not credentials: there is no password column and this is not
    -- a sign-in identity. Nullable because we may only have a phone number.
    email        VARCHAR(254),
    phone        VARCHAR(30),
    job_role     VARCHAR(20)  NOT NULL,
    -- Only ACTIVE and ON_LEAVE. "No longer with us" is is_active, so that fact has
    -- one home and the DTO derives the third display state from it.
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    weekly_hours INT          NOT NULL,
    hired_on     DATE         NOT NULL,
    -- Someone who has left is deactivated, never deleted: their appointments are
    -- business records.
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT employees_pk PRIMARY KEY (id),
    -- Unique so the same person is not entered twice. NULLs do not collide.
    CONSTRAINT employees_email_unique UNIQUE (email),
    CONSTRAINT employees_job_role_check
        CHECK (job_role IN ('CLEANER', 'SUPERVISOR', 'DRIVER', 'OFFICE')),
    CONSTRAINT employees_status_check CHECK (status IN ('ACTIVE', 'ON_LEAVE')),
    CONSTRAINT employees_hours_check CHECK (weekly_hours > 0 AND weekly_hours <= 60)
);

-- Which services a member of staff is trained for. The composite primary key is what
-- stops the same qualification being recorded twice. This is what the slot calendar
-- counts to decide whether a visit can be promised at all.
CREATE TABLE employee_skills
(
    employee_id BIGINT NOT NULL,
    service_id  BIGINT NOT NULL,

    CONSTRAINT employee_skills_pk PRIMARY KEY (employee_id, service_id),
    CONSTRAINT employee_skills_employees_fk
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT employee_skills_service_fk
        FOREIGN KEY (service_id) REFERENCES service_offerings (id) ON DELETE CASCADE,

    INDEX employee_skills_service_idx (service_id)
);

CREATE TABLE appointments
(
    id             BIGINT AUTO_INCREMENT NOT NULL,
    client_user_id BIGINT       NOT NULL,
    service_id     BIGINT       NOT NULL,
    -- Null until the office puts somebody on the job. An unassigned appointment is
    -- still promised capacity, which is why the slot calendar counts it.
    employee_id    BIGINT,
    -- Wall-clock local time: an appointment is a commitment to be somewhere at nine,
    -- which must not shift by an hour when the clocks change. Nothing may convert
    -- these on the way to the database — see the datasource URL's
    -- `connectionTimeZone=LOCAL&preserveInstants=false`.
    start_time     DATETIME     NOT NULL,
    end_time       DATETIME     NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'REQUESTED',
    street         VARCHAR(255) NOT NULL,
    postal_code    VARCHAR(20)  NOT NULL,
    city           VARCHAR(120) NOT NULL,
    notes          TEXT,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT appointments_pk PRIMARY KEY (id),

    -- RESTRICT, not CASCADE: losing a client, a service or a member of staff must
    -- never silently delete the record of work arranged with them.
    CONSTRAINT appointments_client_fk
        FOREIGN KEY (client_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT appointments_service_fk
        FOREIGN KEY (service_id) REFERENCES service_offerings (id) ON DELETE RESTRICT,
    CONSTRAINT appointments_employee_fk
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE RESTRICT,

    CONSTRAINT appointments_time_check CHECK (end_time > start_time),
    CONSTRAINT appointments_status_check
        CHECK (status IN ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),

    -- The dashboard's three filters: by day, by employee, by status. The composite on
    -- (employee, start) is the one the double-booking check reads.
    INDEX appointments_client_idx (client_user_id),
    INDEX appointments_service_idx (service_id),
    INDEX appointments_start_time_idx (start_time),
    INDEX appointments_status_idx (status),
    INDEX appointments_employee_schedule_idx (employee_id, start_time)
);

CREATE TABLE contact_requests
(
    id          BIGINT AUTO_INCREMENT NOT NULL,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(254) NOT NULL,
    phone       VARCHAR(30),
    -- Nullable: a general enquiry need not name a service, and a service that is
    -- retired later must not take the enquiry with it.
    service_id  BIGINT,
    message     TEXT         NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'NEW',
    admin_notes TEXT,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT contact_requests_pk PRIMARY KEY (id),
    CONSTRAINT contact_requests_service_fk
        FOREIGN KEY (service_id) REFERENCES service_offerings (id) ON DELETE SET NULL,
    CONSTRAINT contact_requests_status_check
        CHECK (status IN ('NEW', 'READ', 'RESPONDED', 'CLOSED')),

    INDEX contact_requests_status_idx (status),
    INDEX contact_requests_created_at_idx (created_at)
);

-- One row per reset request. The token itself is NOT stored: only its SHA-256 hash,
-- for the same reason the users table stores a BCrypt hash rather than a password. A
-- dump of this table must not hand the reader a working reset link for every account
-- that asked for one.
--
-- A row is spent once (`used_at`) and expires on its own (`expires_at`), so a link
-- found later in a mailbox or a browser history is worth nothing. Asking for a new
-- link deletes the account's outstanding ones, which is why there is an index on
-- user_id. Spent and expired rows are swept hourly by `PasswordResetTokenCleanup`.
CREATE TABLE password_reset_tokens
(
    id         BIGINT AUTO_INCREMENT NOT NULL,
    user_id    BIGINT      NOT NULL,
    -- SHA-256 of the token, hex encoded: always 64 characters. VARCHAR rather than
    -- CHAR because `@Column(length = 64)` maps to VARCHAR, and `ddl-auto: validate`
    -- rejects the mismatch at startup.
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME    NOT NULL,
    -- NULL until the link is used. A spent row is kept rather than deleted so a
    -- second click on the same link is refused instead of silently doing nothing.
    used_at    DATETIME,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT password_reset_tokens_pk PRIMARY KEY (id),
    -- Unique so a lookup by hash can never match two rows.
    CONSTRAINT password_reset_tokens_hash_uq UNIQUE (token_hash),
    -- CASCADE: a reset token has no meaning without its account. Unlike an
    -- appointment, there is no history here worth keeping.
    CONSTRAINT password_reset_tokens_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    INDEX password_reset_tokens_user_idx (user_id)
);
