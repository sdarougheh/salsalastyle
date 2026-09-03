-- Reference data: seasons, courses, and the sheet labels that map onto them.
-- Safe to re-run — every insert is idempotent on a natural key.
--
-- Apply with:  sqlite3 registrations.sqlite < seed.sql

-- --- seasons ---------------------------------------------------------------
INSERT INTO season (code, label, starts_on, ends_on, n_weeks) VALUES
  ('autumn-2026', 'Autumn 2026', '2026-09-02', '2026-10-28', 8)
ON CONFLICT(code) DO UPDATE SET
  label = excluded.label, starts_on = excluded.starts_on,
  ends_on = excluded.ends_on, n_weeks = excluded.n_weeks;

-- Add older seasons here as you import them, e.g.
--   ('autumn-2025', 'Autumn 2025', '2025-09-03', '2025-10-29', 8),
--   ('spring-2026', 'Spring 2026', '2026-02-04', '2026-04-01', 8);

-- --- courses ---------------------------------------------------------------
-- Prices are per person for the whole run (see _data/pricing.yml). The
-- "Two Classes" bundle and the pair discount are properties of the
-- registration, not of the course, so they live in registration.amount_due_dkk.
INSERT INTO course (season_id, code, label, kind, level, weekday, start_time, venue, price_regular, price_student, starts_on, sessions)
SELECT s.season_id, v.code, v.label, v.kind, v.level, v.weekday, v.start_time, v.venue, v.price_regular, v.price_student, s.starts_on, s.n_weeks
FROM season s
JOIN (
  SELECT 'autumn-2026' AS season_code, 'autumn-2026-beginners' AS code, 'Beginners Autumn'       AS label, 'class' AS kind, 'beginner' AS level, 'Wednesday' AS weekday, '19:00' AS start_time, 'Inflow Studio' AS venue, 800 AS price_regular, 680 AS price_student
  UNION ALL SELECT 'autumn-2026', 'autumn-2026-inter1', 'Intermediate 1 Autumn', 'class', 'inter1', 'Wednesday', '20:00', 'Inflow Studio', 800, 680
  UNION ALL SELECT 'autumn-2026', 'autumn-2026-inter2', 'Intermediate 2 Autumn', 'class', 'inter2', 'Wednesday', '21:00', 'Inflow Studio', 800, 680
) v ON v.season_code = s.code
ON CONFLICT(code) DO UPDATE SET
  season_id = excluded.season_id, label = excluded.label, kind = excluded.kind,
  level = excluded.level, weekday = excluded.weekday, start_time = excluded.start_time,
  venue = excluded.venue, price_regular = excluded.price_regular,
  price_student = excluded.price_student, starts_on = excluded.starts_on,
  sessions = excluded.sessions;

-- --- aliases ---------------------------------------------------------------
-- Every spelling the "Class" column has ever contained, lowercased and with
-- runs of whitespace collapsed. import_sheet.py looks up this table; when a
-- label is missing it creates a placeholder course and prints the INSERT you
-- should paste here instead.
INSERT INTO course_alias (alias, course_id)
SELECT v.alias, c.course_id
FROM course c
JOIN (
  SELECT 'beginners autumn'                     AS alias, 'autumn-2026-beginners' AS code
  UNION ALL SELECT 'beginners - wednesday 19:00',       'autumn-2026-beginners'
  UNION ALL SELECT 'intermediate 1 autumn',             'autumn-2026-inter1'
  UNION ALL SELECT 'intermediate 1 - wednesday 20:00',  'autumn-2026-inter1'
  UNION ALL SELECT 'intermediate 2 autumn',             'autumn-2026-inter2'
  UNION ALL SELECT 'intermediate 2 - wednesday 21:00',  'autumn-2026-inter2'
) v ON v.code = c.code
ON CONFLICT(alias, course_id) DO NOTHING;
