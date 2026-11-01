-- =============================================================================
-- Everything a fresh database needs to be usable: one administrator, the service
-- catalogue, and invented operations data so the dashboard is not empty.
--
-- The administrator and the thirteen services are REFERENCE data — the API cannot
-- start usefully without them. Everything from "demo operations" down is invented
-- and should be deleted before the first production deployment.
--
-- !! The admin password below is public: it is in the repository. It exists so the
-- !! dashboard can be opened once. Change it at the first sign-in
-- !! (POST /api/v1/users/me/change-password), or before the API is ever reachable
-- !! from outside localhost.
-- !!   email:    admin@glanzwerk.de
-- !!   password: Glanzwerk!2026
-- !!
-- !! The demo client password is public in the same way:
-- !!   vogt@example.de / Kundin!2026   (and the two other @example.de clients)
--
-- The service durations are PLACEHOLDERS, in the same spirit as the invented figures
-- in the frontend's `core/company.ts`. They are plausible starting figures for
-- Dresden, not quotes — and they no longer decide how long an appointment is, since
-- every appointment is one fixed slot.
--
-- `service_key` matches the key in the Angular catalogue (core/service-catalog.ts),
-- which owns the marketing copy, images and SEO pages. The names here are the short
-- labels the booking form and the dashboard show, nothing more. A key in one and not
-- the other degrades to showing the server's plain name.
-- =============================================================================

-- ------------------------------------------------------- administrator (reference)
--
-- Seeded here rather than created in Java at startup, so the account is part of the
-- schema's history and cannot be re-created with a different password by a redeploy.
INSERT INTO users (name, email, password, phone, role, is_active)
VALUES ('Glanzwerk Administration',
        'admin@glanzwerk.de',
        '$2a$10$Y1KLt.5wpD4TvAxMpIUkN.kdM185uknj4ZKQ1FKT1ByCvS6em80X2',
        NULL,
        'ADMIN',
        TRUE);

-- --------------------------------------------------- service catalogue (reference)
--
-- The thirteen services, in commercial priority order: recurring contract work
-- first. The same order and the same keys as `SERVICES` in the Angular catalogue.
INSERT INTO service_offerings (service_key, name_de, name_en, duration_minutes, is_active)
VALUES ('maintenance', 'Unterhaltsreinigung', 'Maintenance Cleaning', 180, TRUE),
       ('office', 'Büroreinigung', 'Office Cleaning', 150, TRUE),
       ('school', 'Schul- und Kita-Reinigung', 'School & Daycare Cleaning', 240, TRUE),
       ('medical', 'Praxis- und Pflegeheimreinigung', 'Medical Practice & Care Home Cleaning', 180, TRUE),
       ('publicSector', 'Öffentliche Einrichtungen', 'Public Sector Cleaning', 240, TRUE),
       ('industrial', 'Industriereinigung', 'Industrial Cleaning', 300, TRUE),
       ('housing', 'Treppenhausreinigung', 'Stairwell Cleaning', 90, TRUE),
       ('glass', 'Glas- und Fensterreinigung', 'Glass & Window Cleaning', 120, TRUE),
       ('deepClean', 'Grundreinigung und Bauendreinigung', 'Deep & Post-Construction Cleaning', 480, TRUE),
       ('winter', 'Winterdienst', 'Winter Service', 60, TRUE),
       ('gardening', 'Garten- und Grünpflege', 'Gardening & Grounds Care', 180, TRUE),
       ('facility', 'Hausmeisterservice', 'Caretaker Service', 120, TRUE),
       ('home', 'Haushaltsreinigung', 'Home Cleaning', 120, TRUE);

-- =============================================================================
-- DEMO OPERATIONS — delete everything below before production.
--
-- Invented staff, clients, appointments and enquiries, so the dashboard has
-- something to show on a fresh database. The names, the @example.de addresses and
-- the 0351 5550 numbers are not real and are not meant to look real. This replaces
-- the hard-coded demo arrays the Angular admin area used to ship with — the same
-- data, but now behind a login, where client records belong.
--
-- To remove it: `DELETE FROM appointments; DELETE FROM contact_requests;
-- DELETE FROM employee_skills; DELETE FROM employees;` and delete the @example.de
-- users. Dates are relative to the migration run, so the calendar is never empty
-- whenever the database happens to be created.
-- =============================================================================

-- ------------------------------------------------------------------ demo employees
--
-- Employee records, not accounts: no password, no way to sign in. Sabine is seeded
-- ON_LEAVE so that state is visible in the dashboard.
INSERT INTO employees (name, email, phone, job_role, status, weekly_hours, hired_on, is_active)
VALUES ('Maria Kowalski', 'maria.kowalski@example.de', '0351 5550 201',
        'SUPERVISOR', 'ACTIVE', 40, DATE_SUB(CURRENT_DATE, INTERVAL 3 YEAR), TRUE),
       ('Tomas Richter', 'tomas.richter@example.de', '0351 5550 202',
        'CLEANER', 'ACTIVE', 35, DATE_SUB(CURRENT_DATE, INTERVAL 18 MONTH), TRUE),
       ('Sabine Lehmann', 'sabine.lehmann@example.de', '0351 5550 203',
        'CLEANER', 'ON_LEAVE', 20, DATE_SUB(CURRENT_DATE, INTERVAL 8 MONTH), TRUE);

-- Qualifications. Maria covers the commercial contracts; Tomas the residential,
-- seasonal and industrial work; Sabine the household side.
--
-- Every one of the thirteen services must have at least one ACTIVE member of staff
-- trained for it, or the availability rules correctly offer no days at all for it
-- and the demo reads as broken. Tomas therefore carries `home`, `deepClean` and
-- `industrial` as well — widening an active cleaner rather than putting Sabine back
-- on duty, which keeps ON_LEAVE demonstrated.
INSERT INTO employee_skills (employee_id, service_id)
SELECT e.id, s.id
FROM employees e
         JOIN service_offerings s
              ON s.service_key IN ('maintenance', 'office', 'school', 'medical', 'publicSector')
WHERE e.email = 'maria.kowalski@example.de';

INSERT INTO employee_skills (employee_id, service_id)
SELECT e.id, s.id
FROM employees e
         JOIN service_offerings s
              ON s.service_key IN ('housing', 'glass', 'winter', 'facility', 'gardening',
                                   'home', 'deepClean', 'industrial')
WHERE e.email = 'tomas.richter@example.de';

INSERT INTO employee_skills (employee_id, service_id)
SELECT e.id, s.id
FROM employees e
         JOIN service_offerings s ON s.service_key IN ('home', 'deepClean')
WHERE e.email = 'sabine.lehmann@example.de';

-- -------------------------------------------------------------- demo clients
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

-- ----------------------------------------------------------- demo appointments
-- One finished visit, one confirmed visit in the next few days, one unassigned
-- request.
--
-- End times are computed from the service's own duration rather than from the
-- one-hour slot: these three keep the lengths they were given before appointments
-- became a fixed slot, and they normalise to one slot the first time anyone edits
-- them. Deliberate — a record of what was actually arranged is better than
-- rewriting history.
INSERT INTO appointments (client_user_id, service_id, employee_id, start_time, end_time,
                          status, street, postal_code, city, notes)
SELECT c.id,
       s.id,
       e.id,
       TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), '08:00:00'),
       TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), '08:00:00') + INTERVAL s.duration_minutes MINUTE,
       'COMPLETED', 'Könneritzstraße 24', '01067', 'Dresden', 'Reception and three meeting rooms.'
FROM users c,
     service_offerings s,
     employees e
WHERE c.email = 'vogt@example.de'
  AND s.service_key = 'office'
  AND e.email = 'maria.kowalski@example.de';

INSERT INTO appointments (client_user_id, service_id, employee_id, start_time, end_time,
                          status, street, postal_code, city, notes)
SELECT c.id,
       s.id,
       e.id,
       TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '07:30:00'),
       TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '07:30:00') + INTERVAL s.duration_minutes MINUTE,
       'CONFIRMED', 'Pfotenhauerstraße 42', '01307', 'Dresden', 'Caretaker opens the side entrance.'
FROM users c,
     service_offerings s,
     employees e
WHERE c.email = 'kuehn@example.de'
  AND s.service_key = 'school'
  AND e.email = 'maria.kowalski@example.de';

INSERT INTO appointments (client_user_id, service_id, employee_id, start_time, end_time,
                          status, street, postal_code, city, notes)
SELECT c.id,
       s.id,
       NULL,
       TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), '09:00:00'),
       TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), '09:00:00') + INTERVAL s.duration_minutes MINUTE,
       'REQUESTED', 'Bautzner Straße 7', '01099', 'Dresden', 'Two cats in the flat.'
FROM users c,
     service_offerings s
WHERE c.email = 'hartmann@example.de'
  AND s.service_key = 'home';

-- The dates above are relative to the migration run, so roughly one database in
-- seven put a visit on a Sunday — which the API's own opening-day rules then refused
-- to let an administrator edit ("We do not work on that day"). Seed data the
-- application will not accept reads as a dashboard bug, so any Sunday is moved on to
-- the Monday. Both ends shift together, which keeps the duration and the
-- `end_time > start_time` constraint intact, and the condition makes this a no-op
-- whenever nothing is misdated.
UPDATE appointments
-- MariaDB's DAYOFWEEK: 1 = Sunday. Saturday is a working day here, so only Sunday moves.
SET start_time = start_time + INTERVAL 1 DAY,
    end_time   = end_time + INTERVAL 1 DAY
WHERE DAYOFWEEK(start_time) = 1;

-- --------------------------------------------------------- demo website enquiries
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
