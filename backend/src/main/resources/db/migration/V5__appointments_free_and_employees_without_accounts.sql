-- ============================================================================
-- Three changes that belong together, because each one removes something the
-- others still referenced.
--
--   1. A booking is an appointment, and an appointment is FREE. The table is
--      renamed and every price column goes — on the appointment and on the
--      service. Nothing quotes a price through this system any more; a price is
--      agreed after someone has been to look at the job.
--
--   2. An employee is no longer an account. They had a row in `users` with role
--      EMPLOYEE and a password, which bought nothing: there is no employee-facing
--      screen, and an employee's token was refused by every endpoint except
--      `/users/me`. They become plain records an administrator maintains, and
--      EMPLOYEE leaves the role enum.
--
--   3. Appointments are still assigned to an employee, so the double-booking
--      check keeps working — it points at `employees` instead of at a user.
--
-- Ids are carried over deliberately: copying each employee into `employees` with
-- its old user id lets every foreign key be repointed without a lookup table, so
-- existing appointments keep the person they were assigned to.
--
-- !! SYNTAX: this runs on MariaDB 10.4 (what XAMPP ships). That rules out
-- !! `RENAME COLUMN` and `RENAME INDEX`, which need 10.5.2+, so columns are
-- !! renamed with `CHANGE` and indexes are dropped and re-added. Check
-- !! constraints are dropped with `DROP CONSTRAINT`, not MySQL's `DROP CHECK`.
-- ============================================================================

-- 1. Employees as records -----------------------------------------------------

CREATE TABLE employees
(
    id           BIGINT AUTO_INCREMENT NOT NULL,
    name         VARCHAR(255) NOT NULL,
    -- Contact details now, not credentials: there is no password column and this
    -- is not a sign-in identity. Nullable because we may only have a phone number.
    email        VARCHAR(254),
    phone        VARCHAR(30),
    job_role     VARCHAR(20)  NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    weekly_hours INT          NOT NULL,
    hired_on     DATE         NOT NULL,
    -- Replaces what `users.is_active` used to say about them. Someone who has left
    -- is deactivated, never deleted: their appointments are business records.
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT employees_pk PRIMARY KEY (id),
    CONSTRAINT employees_email_unique UNIQUE (email),
    CONSTRAINT employees_job_role_check
        CHECK (job_role IN ('CLEANER', 'SUPERVISOR', 'DRIVER', 'OFFICE')),
    CONSTRAINT employees_status_check CHECK (status IN ('ACTIVE', 'ON_LEAVE')),
    CONSTRAINT employees_hours_check CHECK (weekly_hours > 0 AND weekly_hours <= 60)
);

INSERT INTO employees (id, name, email, phone, job_role, status, weekly_hours, hired_on, is_active, created_at)
SELECT u.id, u.name, u.email, u.phone, p.job_role, p.status, p.weekly_hours, p.hired_on, u.is_active, u.created_at
FROM employee_profiles p
         JOIN users u ON u.id = p.user_id;

-- 2. Repoint the skills join table -------------------------------------------

ALTER TABLE employee_skills DROP FOREIGN KEY employee_skills_employee_fk;
ALTER TABLE employee_skills CHANGE employee_user_id employee_id BIGINT NOT NULL;
ALTER TABLE employee_skills
    ADD CONSTRAINT employee_skills_employees_fk
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE;

-- 3. Bookings become appointments, and lose their price -----------------------
--
-- Every constraint and index is dropped and re-added under the new noun, so
-- nothing left in the schema calls an appointment a booking.

ALTER TABLE bookings DROP FOREIGN KEY bookings_employee_fk;
ALTER TABLE bookings DROP FOREIGN KEY bookings_client_fk;
ALTER TABLE bookings DROP FOREIGN KEY bookings_service_fk;

ALTER TABLE bookings DROP CONSTRAINT bookings_price_check;
ALTER TABLE bookings DROP CONSTRAINT bookings_time_check;
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;

ALTER TABLE bookings DROP COLUMN price;
ALTER TABLE bookings RENAME TO appointments;
ALTER TABLE appointments CHANGE employee_user_id employee_id BIGINT DEFAULT NULL;

-- Dropping the foreign keys left their backing indexes behind.
ALTER TABLE appointments DROP INDEX bookings_service_fk;
ALTER TABLE appointments DROP INDEX bookings_client_idx;
ALTER TABLE appointments DROP INDEX bookings_start_time_idx;
ALTER TABLE appointments DROP INDEX bookings_status_idx;
ALTER TABLE appointments DROP INDEX bookings_employee_schedule_idx;

ALTER TABLE appointments ADD INDEX appointments_client_idx (client_user_id);
ALTER TABLE appointments ADD INDEX appointments_service_idx (service_id);
ALTER TABLE appointments ADD INDEX appointments_start_time_idx (start_time);
ALTER TABLE appointments ADD INDEX appointments_status_idx (status);
-- The index the double-booking check reads, and the one backing the employee key.
ALTER TABLE appointments ADD INDEX appointments_employee_schedule_idx (employee_id, start_time);

-- RESTRICT, as before: losing a client, a service or a member of staff must never
-- silently delete the record of work arranged with them.
ALTER TABLE appointments
    ADD CONSTRAINT appointments_client_fk
        FOREIGN KEY (client_user_id) REFERENCES users (id) ON DELETE RESTRICT;
ALTER TABLE appointments
    ADD CONSTRAINT appointments_service_fk
        FOREIGN KEY (service_id) REFERENCES service_offerings (id) ON DELETE RESTRICT;
ALTER TABLE appointments
    ADD CONSTRAINT appointments_employee_fk
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE RESTRICT;

ALTER TABLE appointments
    ADD CONSTRAINT appointments_time_check CHECK (end_time > start_time);
ALTER TABLE appointments
    ADD CONSTRAINT appointments_status_check
        CHECK (status IN ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- 4. Drop the employee accounts ----------------------------------------------

DROP TABLE employee_profiles;
DELETE FROM users WHERE role = 'EMPLOYEE';

ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('CLIENT', 'ADMIN'));

-- 5. Services lose their price too -------------------------------------------
--
-- `duration_minutes` stays. It no longer decides how long an appointment is —
-- every appointment is one fixed slot — but it is still what we tell a client the
-- work itself takes, and the dashboard shows it.

ALTER TABLE service_offerings DROP CONSTRAINT service_offerings_price_check;
ALTER TABLE service_offerings DROP COLUMN price;
