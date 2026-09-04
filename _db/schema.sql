-- Salsa LA-Style — registrations database (SQLite)
--
-- Design goal: the Google Sheet stays the intake buffer for the running
-- season; this file is the durable, queryable archive. Everything that can
-- identify a person is confined to `person_identity` and to two free-text
-- columns, so a pseudonymised copy can be exported with one script and shared
-- with an analyst (human or AI) without handing over the names.
--
--   PII lives ONLY in:  person_identity (all columns)
--                       registration.comments      (free text, may name people)
--                       raw_sheet_row.payload_json (verbatim sheet row)
--   Everything else is pseudonymous: a person is `SLS-0042`, plus birth year,
--   postcode and city — coarse enough to analyse, blunt enough to share.
--
-- Apply with:  sqlite3 registrations.sqlite < schema.sql

PRAGMA foreign_keys = ON;
-- Deliberately NOT WAL. WAL is faster, but it leaves -wal and -shm files
-- beside the database, and a sync client that uploads the .sqlite without its
-- matching -wal uploads a corrupt copy. In rollback-journal mode a cleanly
-- closed database is one self-contained file, which is what you want in
-- Google Drive. At this size the speed difference is unmeasurable.
PRAGMA journal_mode = DELETE;

-- ---------------------------------------------------------------------------
-- meta
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meta (
  key        TEXT PRIMARY KEY,
  value      TEXT
);
INSERT OR REPLACE INTO meta (key, value) VALUES
  ('schema_version', '1'),
  ('contains_pii',   'yes');

-- ---------------------------------------------------------------------------
-- people
-- ---------------------------------------------------------------------------

-- The pseudonymous half of a person. Safe to export.
CREATE TABLE IF NOT EXISTS person (
  person_id      INTEGER PRIMARY KEY,
  pseudonym      TEXT    NOT NULL UNIQUE,   -- 'SLS-0042', stable across exports
  birth_year     INTEGER,                   -- coarsened from date_of_birth
  postcode       TEXT,                      -- 4-digit DK postcode, no street
  city           TEXT,
  country        TEXT,
  -- When the address was given, not when they lived there. SKAT wants an
  -- address to identify the participant, not the one they had during the
  -- class, so we ask once and stamp it — which keeps the catchment analysis
  -- honest about what it is measuring, and lets a history accumulate from
  -- here without anyone being asked to remember where they used to live.
  address_recorded_on TEXT,
  first_seen_on  TEXT,                      -- date of earliest registration
  erased_on      TEXT,                      -- set by forget.py; identity is gone
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The identifying half. NEVER exported, never shown to an analyst.
CREATE TABLE IF NOT EXISTS person_identity (
  person_id      INTEGER PRIMARY KEY REFERENCES person(person_id) ON DELETE CASCADE,
  -- Two names, deliberately. `full_name` is what they typed when they signed
  -- up and what you know them as — "anders", "Vale", whatever was in the box.
  -- `legal_name` is what they confirmed or corrected on the details form, and
  -- it is the one SKAT's documentation requirement means. Neither replaces the
  -- other: the first is how you find them in a class list, the second is what
  -- proves who they are.
  full_name      TEXT NOT NULL,
  legal_name     TEXT,
  date_of_birth  TEXT,                      -- 'YYYY-MM-DD'
  phone          TEXT,
  street         TEXT,                      -- street + number only; postcode lives on `person`
  notes          TEXT
);

-- One person can accumulate several addresses over the years.
CREATE TABLE IF NOT EXISTS person_email (
  person_id      INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  email          TEXT    NOT NULL,          -- always stored lowercased
  is_primary     INTEGER NOT NULL DEFAULT 0,
  first_seen_on  TEXT,
  PRIMARY KEY (person_id, email)
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_person_email_unique ON person_email(email);

-- Marketing / photo consent, kept apart from the registration itself so that
-- withdrawing consent never touches the accounting record.
CREATE TABLE IF NOT EXISTS consent (
  person_id      INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  kind           TEXT    NOT NULL,          -- 'email_marketing' | 'photo' | ...
  granted        INTEGER NOT NULL,
  recorded_on    TEXT,
  source         TEXT,
  PRIMARY KEY (person_id, kind)
);

-- One personalised link per person for the /details page, which collects the
-- date of birth needed to document the under-30 VAT exemption. The token is
-- the only thing protecting that page, so it is generated with secrets.
-- `Responses` in the Google Sheet joins back to here on the token alone,
-- which is why the response export carries no names.
CREATE TABLE IF NOT EXISTS invite (
  person_id      INTEGER PRIMARY KEY REFERENCES person(person_id) ON DELETE CASCADE,
  token          TEXT NOT NULL UNIQUE,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at        TEXT,
  completed_at   TEXT
);

-- ---------------------------------------------------------------------------
-- what we sell
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS season (
  season_id      INTEGER PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,      -- 'autumn-2026'
  label          TEXT NOT NULL,             -- 'Autumn 2026'
  starts_on      TEXT,
  ends_on        TEXT,
  n_weeks        INTEGER
);

-- A single sellable thing inside a season: one weekly class, one workshop,
-- one social. `label` is what the registration form called it.
CREATE TABLE IF NOT EXISTS course (
  course_id      INTEGER PRIMARY KEY,
  season_id      INTEGER REFERENCES season(season_id),
  code           TEXT NOT NULL UNIQUE,      -- 'autumn-2026-beginners'
  label          TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'class'
                   CHECK (kind IN ('class','workshop','dropin','social','other')),
  level          TEXT,                      -- matches _data/kinds.yml: beginner, inter1, ...
  weekday        TEXT,
  start_time     TEXT,
  venue          TEXT,
  price_regular  INTEGER,                   -- DKK per person for the whole run
  price_student  INTEGER,
  starts_on      TEXT,
  sessions       INTEGER
);

-- The drift absorber. The sheet stores whatever string the form posted
-- ("Beginners Autumn", "Beginners - Autumn 2025", "Salsa Turn Patterns Workshop");
-- every one of those spellings maps here to a real course. Import failures on
-- a renamed class are fixed by adding a row here, not by editing history.
-- The same label ("Beginners Autumn") is reused every year, so an alias is not
-- unique on its own: it maps to one course per season, and the importer picks
-- the season the registration date falls in (or the one you pass with
-- --season). PRIMARY KEY is the pair, not the alias.
CREATE TABLE IF NOT EXISTS course_alias (
  alias          TEXT    NOT NULL,          -- lowercased, whitespace-collapsed
  course_id      INTEGER NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
  PRIMARY KEY (alias, course_id)
);
CREATE INDEX IF NOT EXISTS ix_course_alias_alias ON course_alias(alias);

-- ---------------------------------------------------------------------------
-- registrations
-- ---------------------------------------------------------------------------

-- A "With a Friend" couple: one payment, two registrations.
CREATE TABLE IF NOT EXISTS pair (
  pair_id           INTEGER PRIMARY KEY,
  external_ref      TEXT UNIQUE,            -- 'P-A1B2C3' from the sheet
  discount_label    TEXT,
  total_amount_dkk  REAL,
  created_at        TEXT
);

CREATE TABLE IF NOT EXISTS registration (
  registration_id INTEGER PRIMARY KEY,
  person_id       INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  course_id       INTEGER REFERENCES course(course_id),
  registered_at   TEXT NOT NULL,            -- ISO 8601
  role            TEXT CHECK (role IS NULL OR role IN ('lead','follow','either')),
  is_young        INTEGER,                  -- under 30 / student rate; NULL = not asked
  form            TEXT CHECK (form IS NULL OR form IN
                    ('season','beginner','friend','workshop','dropin','manual')),
  referral        TEXT,                     -- campaign tag from window.SLSReferral
  pair_id         INTEGER REFERENCES pair(pair_id),
  discount_label  TEXT,
  amount_due_dkk  REAL,
  marked_paid     INTEGER,                  -- what the sheet's "Paid?" cell said,
                                            -- kept apart from the payment rows
  status          TEXT NOT NULL DEFAULT 'registered'
                    CHECK (status IN ('registered','cancelled','waitlist','noshow')),
  comments        TEXT,                     -- PII RISK: free text, often names people
  dedupe_key      TEXT NOT NULL UNIQUE,     -- makes re-importing the same sheet a no-op
  raw_row_id      INTEGER REFERENCES raw_sheet_row(raw_row_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ix_registration_person ON registration(person_id);
CREATE INDEX IF NOT EXISTS ix_registration_course ON registration(course_id);
CREATE INDEX IF NOT EXISTS ix_registration_pair   ON registration(pair_id);

-- ---------------------------------------------------------------------------
-- money
-- ---------------------------------------------------------------------------

-- Kept separate from `registration` because one payment routinely covers
-- several registrations: two classes for one person, or one pair paying 1280
-- in a single MobilePay transfer.
CREATE TABLE IF NOT EXISTS payment (
  payment_id        INTEGER PRIMARY KEY,
  paid_by_person_id INTEGER REFERENCES person(person_id) ON DELETE SET NULL,
  paid_on           TEXT,
  amount_dkk        REAL NOT NULL,
  method            TEXT,                   -- 'mobilepay' | 'bank' | 'cash' | 'other'
  reference         TEXT,                   -- MobilePay reference / pair id
  note              TEXT
);

CREATE TABLE IF NOT EXISTS payment_allocation (
  payment_id      INTEGER NOT NULL REFERENCES payment(payment_id) ON DELETE CASCADE,
  registration_id INTEGER NOT NULL REFERENCES registration(registration_id) ON DELETE CASCADE,
  amount_dkk      REAL NOT NULL,
  PRIMARY KEY (payment_id, registration_id)
);

-- ---------------------------------------------------------------------------
-- attendance (empty until you start taking a register — the schema is here so
-- retention analysis has somewhere to land)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS class_session (
  session_id     INTEGER PRIMARY KEY,
  course_id      INTEGER NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
  held_on        TEXT NOT NULL,
  note           TEXT,
  UNIQUE (course_id, held_on)
);

CREATE TABLE IF NOT EXISTS attendance (
  session_id     INTEGER NOT NULL REFERENCES class_session(session_id) ON DELETE CASCADE,
  person_id      INTEGER NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  attended       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (session_id, person_id)
);

-- ---------------------------------------------------------------------------
-- provenance — every imported row is kept verbatim so any number in a report
-- can be traced back to the cell it came from
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS import_batch (
  batch_id       INTEGER PRIMARY KEY,
  source_file    TEXT NOT NULL,
  source_label   TEXT,
  layout         TEXT,                      -- which sheet column set was detected
  imported_at    TEXT NOT NULL DEFAULT (datetime('now')),
  n_rows         INTEGER,
  n_inserted     INTEGER,
  n_skipped      INTEGER,
  notes          TEXT
);

CREATE TABLE IF NOT EXISTS raw_sheet_row (
  raw_row_id     INTEGER PRIMARY KEY,
  batch_id       INTEGER NOT NULL REFERENCES import_batch(batch_id) ON DELETE CASCADE,
  row_number     INTEGER,
  row_hash       TEXT NOT NULL,
  payload_json   TEXT NOT NULL,             -- PII RISK: the raw row, names and all
  UNIQUE (batch_id, row_number)
);

-- ===========================================================================
-- views
--
--   v_*    pseudonymous. Safe to export, safe to hand to an analyst.
--   pii_*  contain names/emails. For your own admin use only.
-- ===========================================================================

DROP VIEW IF EXISTS v_person;
CREATE VIEW v_person AS
SELECT p.person_id,
       p.pseudonym,
       p.birth_year,
       p.postcode,
       p.city,
       p.country,
       p.address_recorded_on,
       p.first_seen_on,
       (p.erased_on IS NOT NULL) AS is_erased
FROM person p;

DROP VIEW IF EXISTS v_registration;
CREATE VIEW v_registration AS
SELECT r.registration_id,
       p.pseudonym,
       r.person_id,
       s.code            AS season_code,
       s.label           AS season_label,
       s.starts_on       AS season_starts_on,
       c.code            AS course_code,
       c.label           AS course_label,
       c.kind            AS course_kind,
       c.level           AS course_level,
       c.price_regular,
       c.price_student,
       r.registered_at,
       date(r.registered_at)                         AS registered_on,
       CAST(julianday(s.starts_on) - julianday(r.registered_at) AS INTEGER)
                                                     AS days_before_season,
       r.role,
       r.is_young,
       r.form,
       r.referral,
       r.pair_id IS NOT NULL                         AS is_pair,
       r.discount_label,
       r.amount_due_dkk,
       r.status,
       r.marked_paid,
       CASE WHEN p.birth_year IS NULL THEN NULL
            ELSE CAST(strftime('%Y', COALESCE(s.starts_on, r.registered_at)) AS INTEGER) - p.birth_year
       END                                           AS age_at_season,
       (r.comments IS NOT NULL AND trim(r.comments) <> '') AS has_comment,
       length(COALESCE(r.comments, ''))              AS comment_length,
       -- What the price list says this should have cost, so the old sheets —
       -- which had no "Amount Due" column at all — are still comparable.
       CASE WHEN r.is_young = 1 THEN c.price_student ELSE c.price_regular END
                                                     AS list_price_dkk,
       COALESCE(pay.paid_dkk, 0)                     AS paid_dkk,
       CASE WHEN r.amount_due_dkk IS NULL THEN NULL
            ELSE r.amount_due_dkk - COALESCE(pay.paid_dkk, 0)
       END                                           AS outstanding_dkk
FROM registration r
JOIN person p        ON p.person_id = r.person_id
LEFT JOIN course c   ON c.course_id = r.course_id
LEFT JOIN season s   ON s.season_id = c.season_id
LEFT JOIN (SELECT registration_id, SUM(amount_dkk) AS paid_dkk
           FROM payment_allocation GROUP BY registration_id) pay
       ON pay.registration_id = r.registration_id;

-- Headline numbers per season.
DROP VIEW IF EXISTS v_season_summary;
CREATE VIEW v_season_summary AS
SELECT season_code,
       season_label,
       COUNT(*)                                   AS registrations,
       COUNT(DISTINCT person_id)                  AS people,
       SUM(role = 'lead')                         AS leads,
       SUM(role = 'follow')                       AS follows,
       SUM(role = 'either')                       AS either,
       SUM(is_young = 1)                          AS under_30,
       SUM(is_pair)                               AS pair_signups,
       ROUND(SUM(amount_due_dkk), 2)              AS due_dkk,
       ROUND(SUM(list_price_dkk), 2)              AS list_price_dkk,
       ROUND(SUM(paid_dkk), 2)                    AS paid_dkk,
       ROUND(SUM(COALESCE(outstanding_dkk, 0)), 2) AS outstanding_dkk
FROM v_registration
WHERE status <> 'cancelled'
GROUP BY season_code, season_label;

DROP VIEW IF EXISTS v_course_summary;
CREATE VIEW v_course_summary AS
SELECT season_code, course_code, course_label, course_kind, course_level,
       COUNT(*)                       AS registrations,
       SUM(role = 'lead')             AS leads,
       SUM(role = 'follow')           AS follows,
       SUM(role = 'either')           AS either,
       ROUND(AVG(age_at_season), 1)   AS mean_age,
       ROUND(SUM(paid_dkk), 2)        AS paid_dkk
FROM v_registration
WHERE status <> 'cancelled'
GROUP BY season_code, course_code, course_label, course_kind, course_level;

-- One row per person per season: the base for retention / cohort work.
DROP VIEW IF EXISTS v_person_season;
CREATE VIEW v_person_season AS
SELECT person_id, pseudonym, season_code, season_label, season_starts_on,
       COUNT(*)                 AS courses,
       MIN(registered_at)       AS first_registered_at,
       SUM(paid_dkk)            AS paid_dkk
FROM v_registration
WHERE status <> 'cancelled' AND season_code IS NOT NULL
GROUP BY person_id, pseudonym, season_code, season_label, season_starts_on;

-- Did each person come back the following season?
DROP VIEW IF EXISTS v_retention;
CREATE VIEW v_retention AS
SELECT ps.person_id,
       ps.pseudonym,
       ps.season_code,
       ps.season_starts_on,
       (SELECT MIN(nxt.season_starts_on)
          FROM v_person_season nxt
         WHERE nxt.person_id = ps.person_id
           AND nxt.season_starts_on > ps.season_starts_on)      AS next_season_starts_on,
       EXISTS (SELECT 1 FROM v_person_season nxt
                WHERE nxt.person_id = ps.person_id
                  AND nxt.season_starts_on > ps.season_starts_on) AS returned,
       (SELECT COUNT(*) FROM v_person_season a WHERE a.person_id = ps.person_id) AS seasons_total
FROM v_person_season ps;

-- Which campaign brought people in, and what did they end up paying?
DROP VIEW IF EXISTS v_referral_summary;
CREATE VIEW v_referral_summary AS
SELECT season_code,
       COALESCE(NULLIF(trim(referral), ''), '(none)') AS referral,
       COUNT(*)                        AS registrations,
       COUNT(DISTINCT person_id)       AS people,
       ROUND(SUM(paid_dkk), 2)         AS paid_dkk
FROM v_registration
WHERE status <> 'cancelled'
GROUP BY season_code, referral;

-- Sanity check after an import: rows whose money does not add up.
DROP VIEW IF EXISTS v_payment_check;
CREATE VIEW v_payment_check AS
SELECT registration_id, pseudonym, season_code, course_label,
       amount_due_dkk, list_price_dkk, paid_dkk, outstanding_dkk, marked_paid,
       CASE
         WHEN paid_dkk = 0 AND marked_paid = 1             THEN 'marked paid, but the money sits on another of their rows'
         WHEN paid_dkk = 0 AND COALESCE(amount_due_dkk, 0) = 0 THEN 'unpaid'
         WHEN paid_dkk = 0                                THEN 'unpaid'
         WHEN amount_due_dkk IS NULL                      THEN 'paid, no amount due on the sheet'
         WHEN abs(outstanding_dkk) < 0.01                 THEN 'settled'
         WHEN outstanding_dkk < 0                         THEN 'overpaid — check for a double-counted pair payment'
         ELSE 'partially paid'
       END AS verdict
FROM v_registration
WHERE status <> 'cancelled';

-- How the details collection is going. No names — just how many people are
-- still missing the date of birth the VAT exemption rests on.
DROP VIEW IF EXISTS v_details_progress;
CREATE VIEW v_details_progress AS
SELECT COUNT(*)                                                  AS people,
       SUM(i.token IS NOT NULL)                                  AS invited,
       SUM(i.sent_at IS NOT NULL)                                AS emailed,
       SUM(i.completed_at IS NOT NULL)                           AS answered,
       SUM(p.birth_year IS NOT NULL)                             AS have_birth_year,
       SUM(p.postcode IS NOT NULL)                               AS have_postcode
FROM person p LEFT JOIN invite i ON i.person_id = p.person_id
WHERE p.erased_on IS NULL;

-- --- PII views: your own admin, never exported --------------------------

DROP VIEW IF EXISTS pii_roster;
CREATE VIEW pii_roster AS
SELECT s.code AS season_code, c.label AS course_label,
       i.full_name, i.legal_name, e.email, r.role, r.is_young,
       r.amount_due_dkk, r.status, r.comments
FROM registration r
JOIN person_identity i ON i.person_id = r.person_id
LEFT JOIN person_email e ON e.person_id = r.person_id AND e.is_primary = 1
LEFT JOIN course c ON c.course_id = r.course_id
LEFT JOIN season s ON s.season_id = c.season_id;

DROP VIEW IF EXISTS pii_unpaid;
CREATE VIEW pii_unpaid AS
SELECT s.code AS season_code, c.label AS course_label,
       i.full_name, e.email, v.amount_due_dkk, v.paid_dkk, v.outstanding_dkk
FROM v_registration v
JOIN registration r     ON r.registration_id = v.registration_id
JOIN person_identity i  ON i.person_id = r.person_id
LEFT JOIN person_email e ON e.person_id = r.person_id AND e.is_primary = 1
LEFT JOIN course c ON c.course_id = r.course_id
LEFT JOIN season s ON s.season_id = c.season_id
WHERE v.outstanding_dkk > 0.01 AND v.status <> 'cancelled';
