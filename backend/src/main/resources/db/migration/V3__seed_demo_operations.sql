-- =============================================================================
-- Demo staff, clients, bookings and enquiries, so the dashboard has something to
-- show on a fresh database.
--
-- Everything here is invented. The names, the @example.de addresses and the 0351
-- 5550 numbers are not real and are not meant to look real. This replaces the
-- hard-coded demo arrays the Angular admin area used to ship with — the same data,
-- but now behind a login, where client records belong.
--
-- Delete this migration before the first production deployment, or run
-- `DELETE FROM bookings; DELETE FROM contact_requests;` and remove these accounts.
-- Everything is dated relative to the migration run, so the calendar is not empty
-- whenever the database is created.
--
-- The seeded passwords are public, like the admin one in V2:
--   employee: maria.kowalski@example.de / Mitarbeit!2026
--   client:   vogt@example.de           / Kundin!2026
-- =============================================================================

-- ---------------------------------------------------------------- staff accounts
INSERT INTO users (name, email, password, phone, role, is_active)
VALUES ('Maria Kowalski', 'maria.kowalski@example.de',
        '$2a$10$ssWeiWphdoW9YQ0FUAD.RO1I79SpOuO6LWfypYbMedPwhv5zsLApu',
        '0351 5550 201', 'EMPLOYEE', TRUE),
       ('Tomas Richter', 'tomas.richter@example.de',
        '$2a$10$ssWeiWphdoW9YQ0FUAD.RO1I79SpOuO6LWfypYbMedPwhv5zsLApu',
        '0351 5550 202', 'EMPLOYEE', TRUE),
       ('Sabine Lehmann', 'sabine.lehmann@example.de',
        '$2a$10$ssWeiWphdoW9YQ0FUAD.RO1I79SpOuO6LWfypYbMedPwhv5zsLApu',
        '0351 5550 203', 'EMPLOYEE', TRUE);

INSERT INTO employee_profiles (user_id, job_role, status, weekly_hours, hired_on)
SELECT id, 'SUPERVISOR', 'ACTIVE', 40, DATE_SUB(CURRENT_DATE, INTERVAL 3 YEAR)
FROM users WHERE email = 'maria.kowalski@example.de';

INSERT INTO employee_profiles (user_id, job_role, status, weekly_hours, hired_on)
SELECT id, 'CLEANER', 'ACTIVE', 35, DATE_SUB(CURRENT_DATE, INTERVAL 18 MONTH)
FROM users WHERE email = 'tomas.richter@example.de';

INSERT INTO employee_profiles (user_id, job_role, status, weekly_hours, hired_on)
SELECT id, 'CLEANER', 'ON_LEAVE', 20, DATE_SUB(CURRENT_DATE, INTERVAL 8 MONTH)
FROM users WHERE email = 'sabine.lehmann@example.de';

-- Qualifications. Maria covers the commercial contracts, Tomas the residential and
-- seasonal work, Sabine the household side.
INSERT INTO employee_skills (employee_user_id, service_id)
SELECT u.id, s.id
FROM users u
         JOIN service_offerings s ON s.service_key IN ('maintenance', 'office', 'school', 'medical', 'publicSector')
WHERE u.email = 'maria.kowalski@example.de';

INSERT INTO employee_skills (employee_user_id, service_id)
SELECT u.id, s.id
FROM users u
         JOIN service_offerings s ON s.service_key IN ('housing', 'glass', 'winter', 'facility', 'gardening')
WHERE u.email = 'tomas.richter@example.de';

INSERT INTO employee_skills (employee_user_id, service_id)
SELECT u.id, s.id
FROM users u
         JOIN service_offerings s ON s.service_key IN ('home', 'deepClean')
WHERE u.email = 'sabine.lehmann@example.de';

-- -------------------------------------------------------------- client accounts
INSERT INTO users (name, email, password, phone, role, is_active)
VALUES ('Medienhaus Elbtal GmbH', 'vogt@example.de',
        '$2a$10$C1JLOFQWxUFCrlXJSmVJJe5xaGzaxThiasyfS2wP0Yq5LFo3KbNy.',
        '0351 5550 110', 'CLIENT', TRUE),
       ('Grundschule Johannstadt', 'kuehn@example.de',
        '$2a$10$C1JLOFQWxUFCrlXJSmVJJe5xaGzaxThiasyfS2wP0Yq5LFo3KbNy.',
        '0351 5550 121', 'CLIENT', TRUE),
       ('Familie Hartmann', 'hartmann@example.de',
        '$2a$10$C1JLOFQWxUFCrlXJSmVJJe5xaGzaxThiasyfS2wP0Yq5LFo3KbNy.',
        '0351 5550 134', 'CLIENT', TRUE);

-- --------------------------------------------------------------------- bookings
-- One finished job, one confirmed job in the next few days, one unassigned request.
-- End times are computed from the service's own duration, so they always agree with
-- the catalogue.
INSERT INTO bookings (client_user_id, service_id, employee_user_id, start_time, end_time,
                      status, price, street, postal_code, city, notes)
SELECT c.id,
       s.id,
       e.id,
       TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), '08:00:00'),
       TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), '08:00:00') + INTERVAL s.duration_minutes MINUTE,
       'COMPLETED', s.price, 'Könneritzstraße 24', '01067', 'Dresden', 'Reception and three meeting rooms.'
FROM users c,
     service_offerings s,
     users e
WHERE c.email = 'vogt@example.de'
  AND s.service_key = 'office'
  AND e.email = 'maria.kowalski@example.de';

INSERT INTO bookings (client_user_id, service_id, employee_user_id, start_time, end_time,
                      status, price, street, postal_code, city, notes)
SELECT c.id,
       s.id,
       e.id,
       TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '07:30:00'),
       TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '07:30:00') + INTERVAL s.duration_minutes MINUTE,
       'CONFIRMED', s.price, 'Pfotenhauerstraße 42', '01307', 'Dresden', 'Caretaker opens the side entrance.'
FROM users c,
     service_offerings s,
     users e
WHERE c.email = 'kuehn@example.de'
  AND s.service_key = 'school'
  AND e.email = 'maria.kowalski@example.de';

INSERT INTO bookings (client_user_id, service_id, employee_user_id, start_time, end_time,
                      status, price, street, postal_code, city, notes)
SELECT c.id,
       s.id,
       NULL,
       TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), '09:00:00'),
       TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), '09:00:00') + INTERVAL s.duration_minutes MINUTE,
       'REQUESTED', s.price, 'Bautzner Straße 7', '01099', 'Dresden', 'Two cats in the flat.'
FROM users c,
     service_offerings s
WHERE c.email = 'hartmann@example.de'
  AND s.service_key = 'home';

-- ------------------------------------------------------------- website enquiries
INSERT INTO contact_requests (name, email, phone, service_id, message, status)
SELECT 'Petra Simmel', 'simmel@example.de', '0351 5550 177', s.id,
       'We are moving out of a 120 m2 office at the end of the month and need a handover clean. Can you quote?',
       'NEW'
FROM service_offerings s
WHERE s.service_key = 'deepClean';

INSERT INTO contact_requests (name, email, phone, service_id, message, status)
SELECT 'Hausverwaltung Neustadt', 'kontakt@example.de', '0351 5550 188', s.id,
       'Looking for weekly stairwell cleaning in four buildings in the Neustadt. Please send terms.',
       'READ'
FROM service_offerings s
WHERE s.service_key = 'housing';
