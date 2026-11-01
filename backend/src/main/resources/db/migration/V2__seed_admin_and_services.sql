-- =============================================================================
-- Reference data the application cannot start usefully without: one administrator
-- and the service catalogue.
--
-- The admin account is seeded here rather than created in Java at startup, so the
-- account is part of the schema's history and cannot be re-created with a different
-- password by a redeploy.
--
-- !! The password below is public: it is in the repository. It exists so the
-- !! dashboard can be opened once. Change it at the first sign-in
-- !! (POST /api/v1/users/me/change-password), or before the API is ever reachable
-- !! from outside localhost.
-- !!   email:    admin@glanzwerk.de
-- !!   password: Glanzwerk!2026
--
-- The prices and durations are PLACEHOLDERS, in the same spirit as the invented
-- figures in the frontend's `core/company.ts`. They are plausible starting prices
-- for Dresden, not quotes. Replace them from the dashboard before the booking form
-- is shown to a customer.
--
-- `service_key` matches the key in the Angular catalogue (core/service-catalog.ts),
-- which owns the marketing copy, images and SEO pages. The names here are the short
-- labels the booking form and the dashboard show, nothing more.
-- =============================================================================

INSERT INTO users (name, email, password, phone, role, is_active)
VALUES ('Glanzwerk Administration',
        'admin@glanzwerk.de',
        '$2a$10$Y1KLt.5wpD4TvAxMpIUkN.kdM185uknj4ZKQ1FKT1ByCvS6em80X2',
        NULL,
        'ADMIN',
        TRUE);

INSERT INTO service_offerings (service_key, name_de, name_en, price, duration_minutes, is_active)
VALUES ('maintenance', 'Unterhaltsreinigung', 'Maintenance Cleaning', 180.00, 180, TRUE),
       ('office', 'Büroreinigung', 'Office Cleaning', 150.00, 150, TRUE),
       ('school', 'Schul- und Kita-Reinigung', 'School & Daycare Cleaning', 220.00, 240, TRUE),
       ('medical', 'Praxis- und Pflegeheimreinigung', 'Medical Practice & Care Home Cleaning', 260.00, 180, TRUE),
       ('publicSector', 'Öffentliche Einrichtungen', 'Public Sector Cleaning', 240.00, 240, TRUE),
       ('industrial', 'Industriereinigung', 'Industrial Cleaning', 320.00, 300, TRUE),
       ('housing', 'Treppenhausreinigung', 'Stairwell Cleaning', 90.00, 90, TRUE),
       ('glass', 'Glas- und Fensterreinigung', 'Glass & Window Cleaning', 140.00, 120, TRUE),
       ('deepClean', 'Grundreinigung und Bauendreinigung', 'Deep & Post-Construction Cleaning', 450.00, 480, TRUE),
       ('winter', 'Winterdienst', 'Winter Service', 110.00, 60, TRUE),
       ('gardening', 'Garten- und Grünpflege', 'Gardening & Grounds Care', 160.00, 180, TRUE),
       ('facility', 'Hausmeisterservice', 'Caretaker Service', 130.00, 120, TRUE),
       ('home', 'Haushaltsreinigung', 'Home Cleaning', 95.00, 120, TRUE);
