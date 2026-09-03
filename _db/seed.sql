-- Reference data: seasons, courses, and the sheet labels that map onto them.
-- Safe to re-run — every insert is idempotent on a natural key.
--
-- Apply with:  sqlite3 registrations.sqlite < seed.sql

-- --- seasons ---------------------------------------------------------------
-- Dates for summer and autumn come from the site's own copy at the time
-- (git history). Spring 2026 predates that copy; its start is inferred from
-- the early-bird deadline of February 15th, so 2026-02-18 is the first
-- Wednesday after it. Correct it if you remember better:
--   UPDATE season SET starts_on='...', ends_on='...' WHERE code='spring-2026';
INSERT INTO season (code, label, starts_on, ends_on, n_weeks) VALUES
  ('spring-2026', 'Spring 2026', '2026-02-18', '2026-04-15', 9),
  ('summer-2026', 'Summer 2026', '2026-05-04', '2026-06-26', 8),
  ('autumn-2026', 'Autumn 2026', '2026-09-02', '2026-10-28', 8)
ON CONFLICT(code) DO UPDATE SET
  label = excluded.label, starts_on = excluded.starts_on,
  ends_on = excluded.ends_on, n_weeks = excluded.n_weeks;

-- --- courses ---------------------------------------------------------------
-- Prices are per person for the whole run (see _data/pricing.yml). The
-- "Two Classes" bundle and the pair discount are properties of the
-- registration, not of the course, so they live in registration.amount_due_dkk.
-- Older seasons carry NULL prices deliberately: the price lists changed and a
-- wrong list price is worse than none. Revenue comes from the payments anyway.
INSERT INTO course (season_id, code, label, kind, level, weekday, start_time, venue, price_regular, price_student, starts_on, sessions)
SELECT s.season_id, v.code, v.label, v.kind, v.level, v.weekday, v.start_time, v.venue, v.price_regular, v.price_student, s.starts_on, s.n_weeks
FROM season s
JOIN (
  SELECT 'spring-2026' AS season_code, 'spring-2026-inter1' AS code, 'Intermediate 1 Spring' AS label, 'class' AS kind, 'inter1' AS level, NULL AS weekday, NULL AS start_time, NULL AS venue, NULL AS price_regular, NULL AS price_student
  UNION ALL SELECT 'spring-2026', 'spring-2026-inter2',          'Intermediate 2 Spring', 'class',    'inter2',   NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'spring-2026', 'spring-2026-improver',        'Improver Spring',       'class',    'improver', NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'spring-2026', 'spring-2026-chacha-basics',   'Basics of Chacha',      'class',    'beginner', NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'spring-2026', 'spring-2026-chacha-improver', 'Chacha improver',       'class',    'improver', NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'spring-2026', 'spring-2026-crash',           'LA-Style Crash Course', 'workshop', 'beginner', NULL, NULL, NULL, NULL, NULL

  UNION ALL SELECT 'summer-2026', 'summer-2026-inter1',   'Intermediate 1 Summer', 'class',    'inter1',   NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'summer-2026', 'summer-2026-inter2',   'Intermediate 2 Summer', 'class',    'inter2',   NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'summer-2026', 'summer-2026-improver', 'Improvers summer',      'class',    'improver', NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'summer-2026', 'summer-2026-crash',    'LA-Style Crash Course', 'workshop', 'beginner', NULL, NULL, NULL, NULL, NULL

  UNION ALL SELECT 'autumn-2026', 'autumn-2026-beginners',   'Beginners Autumn',      'class', 'beginner', 'Wednesday', '19:00', 'Inflow Studio', 800, 680
  UNION ALL SELECT 'autumn-2026', 'autumn-2026-inter1',      'Intermediate 1 Autumn', 'class', 'inter1',   'Wednesday', '20:00', 'Inflow Studio', 800, 680
  UNION ALL SELECT 'autumn-2026', 'autumn-2026-inter2',      'Intermediate 2 Autumn', 'class', 'inter2',   'Wednesday', '21:00', 'Inflow Studio', 800, 680
  UNION ALL SELECT 'autumn-2026', 'autumn-2026-crash',       'LA-Style Salsa Crash Course',        'workshop', 'beginner', NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'autumn-2026', 'autumn-2026-afternoon-2', 'LA-Style Afternoon (two workshops)', 'workshop', 'open',     NULL, NULL, NULL, NULL, NULL
  UNION ALL SELECT 'autumn-2026', 'autumn-2026-afternoon-1', 'LA-Style Afternoon (one workshop)',  'workshop', 'open',     NULL, NULL, NULL, NULL, NULL
) v ON v.season_code = s.code
ON CONFLICT(code) DO UPDATE SET
  season_id = excluded.season_id, label = excluded.label, kind = excluded.kind,
  level = excluded.level, weekday = excluded.weekday, start_time = excluded.start_time,
  venue = excluded.venue, price_regular = excluded.price_regular,
  price_student = excluded.price_student, starts_on = excluded.starts_on,
  sessions = excluded.sessions;

-- --- aliases ---------------------------------------------------------------
-- Every spelling the "Class" column has ever contained, lowercased and with
-- runs of whitespace collapsed. Note 'la-style crash course' appears twice:
-- the same workshop name ran in both spring and summer, which is exactly why
-- an alias maps to a course rather than being unique on its own. Always pass
-- --season when importing so the right one is picked.
INSERT INTO course_alias (alias, course_id)
SELECT v.alias, c.course_id
FROM course c
JOIN (
  SELECT 'intermediate 1 spring'   AS alias, 'spring-2026-inter1' AS code
  UNION ALL SELECT 'intermediate 2 spring',  'spring-2026-inter2'
  UNION ALL SELECT 'improver spring',        'spring-2026-improver'
  UNION ALL SELECT 'basics of chacha',       'spring-2026-chacha-basics'
  UNION ALL SELECT 'chacha improver',        'spring-2026-chacha-improver'
  UNION ALL SELECT 'la-style crash course',  'spring-2026-crash'

  UNION ALL SELECT 'intermediate 1 summer',  'summer-2026-inter1'
  UNION ALL SELECT 'intermediate 2 summer',  'summer-2026-inter2'
  UNION ALL SELECT 'improvers summer',       'summer-2026-improver'
  UNION ALL SELECT 'la-style crash course',  'summer-2026-crash'

  UNION ALL SELECT 'beginners autumn',                     'autumn-2026-beginners'
  UNION ALL SELECT 'beginners - wednesday 19:00',          'autumn-2026-beginners'
  UNION ALL SELECT 'intermediate 1 autumn',                'autumn-2026-inter1'
  UNION ALL SELECT 'intermediate 1 - wednesday 20:00',     'autumn-2026-inter1'
  UNION ALL SELECT 'intermediate 2 autumn',                'autumn-2026-inter2'
  UNION ALL SELECT 'intermediate 2 - wednesday 21:00',     'autumn-2026-inter2'
  UNION ALL SELECT 'la-style salsa crash course',          'autumn-2026-crash'
  UNION ALL SELECT 'la-style afternoon (two workshops)',   'autumn-2026-afternoon-2'
  UNION ALL SELECT 'la-style afternoon (one workshop)',    'autumn-2026-afternoon-1'
) v ON v.code = c.code
ON CONFLICT(alias, course_id) DO NOTHING;
