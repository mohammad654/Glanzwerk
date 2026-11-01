-- ============================================================================
-- Gives the demo data a schedulable employee for every service.
--
-- V3's skill spread left three services uncovered: `industrial`, which nobody was
-- trained for at all, and `home` and `deepClean`, which only Sabine was — and she is
-- seeded ON_LEAVE to show that state. The availability rules then correctly offered
-- no days at all for those three, so a demo client picking "Haushaltsreinigung" was
-- told nothing was free for weeks and had no way to tell a working system from a
-- broken one.
--
-- The fix is to widen one active cleaner's qualifications rather than to put Sabine
-- back on duty, which keeps ON_LEAVE demonstrated and makes every service bookable.
--
-- `INSERT ... SELECT` with a `NOT EXISTS` guard rather than a plain insert: the
-- composite primary key on (employee_id, service_id) would otherwise fail on a
-- database where these rows happen to exist already.
-- ============================================================================

INSERT INTO employee_skills (employee_id, service_id)
SELECT e.id, s.id
FROM employees e
         JOIN service_offerings s ON s.service_key IN ('home', 'deepClean', 'industrial')
WHERE e.email = 'tomas.richter@example.de'
  AND NOT EXISTS (SELECT 1
                  FROM employee_skills k
                  WHERE k.employee_id = e.id
                    AND k.service_id = s.id);
