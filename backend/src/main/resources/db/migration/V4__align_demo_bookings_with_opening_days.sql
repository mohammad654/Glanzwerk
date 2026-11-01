-- ============================================================================
-- Moves any booking that landed on a closed day onto the next working day.
--
-- `V3` dates its demo bookings relative to the migration run
-- (`DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY)`), which lands on whatever weekday that
-- happens to be — so roughly one database in seven got a booking on a Sunday. The
-- API's own rules (`glanzwerk.booking.open-days`, Monday–Saturday) then refused to
-- let an administrator edit it: "We do not work on that day." Seed data that the
-- application will not accept reads as a dashboard bug, so it is corrected here.
--
-- A new migration rather than a change to V3: V3 has already been applied, and
-- editing it would change its checksum and fail `validate-on-migrate` on every
-- existing database. On a fresh database V3 still writes the row and this corrects
-- it a moment later; on an existing one this is the only statement that runs.
--
-- The condition makes it a no-op when nothing is misdated, so it is safe whichever
-- weekday V3 happened to pick. Both ends shift together, which keeps the duration
-- and the `end_time > start_time` constraint intact.
-- ============================================================================

UPDATE bookings
SET start_time = start_time + INTERVAL 1 DAY,
    end_time   = end_time + INTERVAL 1 DAY
-- MySQL's DAYOFWEEK: 1 = Sunday. Saturday is a working day here, so only Sunday moves.
WHERE DAYOFWEEK(start_time) = 1;
