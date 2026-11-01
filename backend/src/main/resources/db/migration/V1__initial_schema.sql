-- =============================================================================
-- Glanzwerk: initial schema.
--
-- Replaces an earlier draft of this file that could never have run: it declared
-- foreign keys to `clients` and `employees` tables it never created, and CHECK
-- constraints on columns (total_price, status) that were not in the table. Nothing
-- had been applied, so this file is a rewrite rather than a correction.
--
-- Shape of the model:
--   users              every person, whatever their role. One place an email is
--                      unique, one password column to protect.
--   employee_profiles  the employment side of a member of staff, keyed by user id.
--   service_offerings  what can be booked, priced, and named in both locales.
--   bookings           one appointment. "Booking" and "appointment" are the same
--                      business concept here, so there is one table and one word.
--   contact_requests   website enquiries, stored before any email is attempted.
--
-- There is deliberately no `clients` table: a client is a user with role CLIENT.
-- A second table holding their name and email again would be two sources for one
-- fact. Where the work happens is on the booking, not on the client, because the
-- same client books for different addresses.
-- =============================================================================

CREATE TABLE users
(
    id         BIGINT AUTO_INCREMENT NOT NULL,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(254) NOT NULL,
    -- BCrypt hash. 60 characters today; the column is wider so a future, longer
    -- algorithm does not need a migration of every row.
    password   VARCHAR(255) NOT NULL,
    phone      VARCHAR(30),
    role       VARCHAR(20)  NOT NULL DEFAULT 'CLIENT',
    -- Deactivation instead of deletion: a departed employee's bookings must still
    -- point at a real row.
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT users_pk PRIMARY KEY (id),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('CLIENT', 'EMPLOYEE', 'ADMIN'))
);

CREATE TABLE service_offerings
(
    id               BIGINT AUTO_INCREMENT NOT NULL,
    -- Matches a key in the Angular service catalogue, which owns the marketing copy
    -- and the SEO pages. This is the join between the two halves of the system.
    service_key      VARCHAR(60)    NOT NULL,
    name_de          VARCHAR(255)   NOT NULL,
    name_en          VARCHAR(255)   NOT NULL,
    description_de   TEXT,
    description_en   TEXT,
    price            DECIMAL(10, 2) NOT NULL,
    duration_minutes INT            NOT NULL,
    is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT service_offerings_pk PRIMARY KEY (id),
    CONSTRAINT service_offerings_key_unique UNIQUE (service_key),
    CONSTRAINT service_offerings_price_check CHECK (price >= 0),
    CONSTRAINT service_offerings_duration_check CHECK (duration_minutes > 0)
);

CREATE TABLE employee_profiles
(
    -- The user's own id, so a person cannot have two employment records.
    user_id      BIGINT      NOT NULL,
    job_role     VARCHAR(20) NOT NULL,
    -- Only ACTIVE and ON_LEAVE. "No longer with us" is users.is_active, so that fact
    -- has one home.
    status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    weekly_hours INT         NOT NULL,
    hired_on     DATE        NOT NULL,

    CONSTRAINT employee_profiles_pk PRIMARY KEY (user_id),
    CONSTRAINT employee_profiles_users_fk
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT employee_profiles_job_role_check
        CHECK (job_role IN ('CLEANER', 'SUPERVISOR', 'DRIVER', 'OFFICE')),
    CONSTRAINT employee_profiles_status_check
        CHECK (status IN ('ACTIVE', 'ON_LEAVE')),
    CONSTRAINT employee_profiles_hours_check
        CHECK (weekly_hours > 0 AND weekly_hours <= 60)
);

-- Which services a member of staff is trained for. The composite primary key is what
-- stops the same qualification being recorded twice.
CREATE TABLE employee_skills
(
    employee_user_id BIGINT NOT NULL,
    service_id       BIGINT NOT NULL,

    CONSTRAINT employee_skills_pk PRIMARY KEY (employee_user_id, service_id),
    CONSTRAINT employee_skills_employee_fk
        FOREIGN KEY (employee_user_id) REFERENCES employee_profiles (user_id) ON DELETE CASCADE,
    CONSTRAINT employee_skills_service_fk
        FOREIGN KEY (service_id) REFERENCES service_offerings (id) ON DELETE CASCADE,

    INDEX employee_skills_service_idx (service_id)
);

CREATE TABLE bookings
(
    id               BIGINT AUTO_INCREMENT NOT NULL,
    client_user_id   BIGINT         NOT NULL,
    service_id       BIGINT         NOT NULL,
    -- Null until the office puts somebody on the job.
    employee_user_id BIGINT,
    -- Wall-clock local time: an appointment is a commitment to be somewhere at nine,
    -- which must not shift by an hour when the clocks change.
    start_time       DATETIME       NOT NULL,
    end_time         DATETIME       NOT NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'REQUESTED',
    -- Copied from the service at booking time. The price list changes; what was
    -- agreed for this job does not.
    price            DECIMAL(10, 2) NOT NULL,
    street           VARCHAR(255)   NOT NULL,
    postal_code      VARCHAR(20)    NOT NULL,
    city             VARCHAR(120)   NOT NULL,
    notes            TEXT,
    created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT bookings_pk PRIMARY KEY (id),

    -- RESTRICT, not CASCADE: losing a client or a service must never silently delete
    -- the record of work done for them.
    CONSTRAINT bookings_client_fk
        FOREIGN KEY (client_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT bookings_service_fk
        FOREIGN KEY (service_id) REFERENCES service_offerings (id) ON DELETE RESTRICT,
    -- Points at the employment record rather than at users, so a client account can
    -- never end up in this column.
    CONSTRAINT bookings_employee_fk
        FOREIGN KEY (employee_user_id) REFERENCES employee_profiles (user_id) ON DELETE RESTRICT,

    CONSTRAINT bookings_price_check CHECK (price >= 0),
    CONSTRAINT bookings_time_check CHECK (end_time > start_time),
    CONSTRAINT bookings_status_check
        CHECK (status IN ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),

    -- The dashboard's three filters: by day, by employee, by status. The composite on
    -- (employee, start) is the one the double-booking check reads.
    INDEX bookings_client_idx (client_user_id),
    INDEX bookings_start_time_idx (start_time),
    INDEX bookings_status_idx (status),
    INDEX bookings_employee_schedule_idx (employee_user_id, start_time)
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
