# Registrations database

The Google Sheet is a good inbox and a bad archive. It is where a season fills
up — the Apps Script appends to it, you glance at it on your phone, you tick
people off as they pay. What it cannot do is tell you whether the people who
took Beginners in 2025 came back in 2026, or how far people travel to get to
Inflow Studio, because it has no idea that two rows spelling a name slightly
differently are the same person.

So: the sheet stays the intake buffer for the running season, and when the
season closes you move it in here. This directory holds the schema, the
importer, and the scripts that keep the personal data where it belongs.

**Nothing in here is published.** `_db/` is invisible to Jekyll (underscore
prefix), and `.gitignore` blocks every data file — the repository behind this
site is public, the database is not. Keep the `.sqlite` file out of the repo
entirely; see *Where to keep the file* below.

---

## Files

| | |
|---|---|
| `schema.sql` | tables, indexes and views. Run once, re-run any time to rebuild views |
| `seed.sql` | seasons, courses, and the sheet labels that map onto them. Edit this each season |
| `import_sheet.py` | CSV export of the sheet → database. Handles every column layout the sheet has had |
| `enrich.py` | merges in addresses, birthdays, phone numbers from a second CSV |
| `export_analysis.py` | writes a pseudonymised copy with no names in it |
| `forget.py` | erases one person's identity, keeps the anonymous history |

Everything is Python 3 standard library and the `sqlite3` CLI that ships with
macOS. No installs.

---

## Getting started

```bash
cd _db
sqlite3 ~/salsa/registrations.sqlite < schema.sql
sqlite3 ~/salsa/registrations.sqlite < seed.sql
```

Then export the sheet — **File → Download → Comma-separated values** — and:

```bash
python3 import_sheet.py ~/salsa/registrations.sqlite ~/Downloads/Registrations.csv \
    --season autumn-2026 --dry-run
```

`--dry-run` parses everything, prints what it would do, and writes nothing.
Read the warnings, fix what needs fixing, then run it again without the flag.

Re-running the import is always safe. Every registration carries a dedupe key
built from email + class + timestamp, so importing a sheet that has grown
since last time only picks up the new rows.

---

## The shape of it

The sheet is one flat row per person per class. The database splits that into
the things that are actually separate:

```
person ──< person_email          who they are, minus the name
   │                             (name/birthday/address live in person_identity)
   ├──< registration >── course >── season
   │         │
   │         └──< payment_allocation >── payment
   └──< attendance >── class_session
```

Four decisions worth knowing about:

**A person is not a row.** `person` is stable across seasons, matched on
lowercased email. That is what makes retention analysis possible at all. A
`person_email` table hangs off it, because people change addresses and you do
not want a new person every time they do.

**Money is its own table.** The sheet records payment per row, but one payment
routinely covers several rows: two classes for one person, or a pair paying
1280 in one MobilePay transfer. `payment` → `payment_allocation` →
`registration` models that properly, and the importer knows that when both
halves of a pair show the same 1280 it is one payment, not two. Booking it
twice would quietly inflate every revenue number you ever compute.

**Class labels get an indirection table.** `course_alias` maps whatever string
the form posted — `Beginners Autumn`, `Beginners - Wednesday 19:00` — onto a
real course. When you rename a class, you add an alias; you never rewrite
history. Aliases repeat across years, so the importer disambiguates by the
registration date (or by `--season`, which is more reliable — use it).

**Every imported row is kept verbatim.** `raw_sheet_row` stores the original
cells as JSON, including columns the importer did not recognise. Any number in
any report can be traced back to the cell it came from, and a column you add to
the sheet next year is not lost just because the importer has not been taught
about it yet.

### Views

`v_*` views are pseudonymous and safe to export; `pii_*` views have names in
them and are for your own admin.

| view | |
|---|---|
| `v_registration` | the workhorse — one row per registration, joined to person, course, season, money |
| `v_season_summary` | headline numbers per season |
| `v_course_summary` | per class: headcount, lead/follow balance, mean age |
| `v_person_season` | one row per person per season, the base for cohort work |
| `v_retention` | did each person come back the following season? |
| `v_referral_summary` | which campaign brought people in, and what they paid |
| `v_payment_check` | run this after every import: rows whose money does not add up |
| `pii_roster` | names and emails for one class — for actually emailing people |
| `pii_unpaid` | who still owes you money |

---

## Adding a season

Three small edits to `seed.sql`, then re-run it (it is idempotent):

1. a row in the `season` insert — `('spring-2027', 'Spring 2027', '2027-02-03', '2027-03-31', 8)`
2. one row per class in the `course` insert
3. one alias per spelling the form uses, in the `course_alias` insert

Do this *before* importing that season's sheet. If you forget, the importer
creates a placeholder course named `unmapped-…`, warns you, and prints the
exact `UNION ALL SELECT` line to paste into `seed.sql`. Once your aliases are
complete, pass `--strict` to turn unknown labels into an error instead.

---

## Merging in addresses and birthdays

The registration form never asked for these. When you collect them some other
way, put them in a CSV keyed on email:

```csv
email,date_of_birth,street,postcode,city,phone
anna@example.com,17/03/1994,Nørrebrogade 12 2.th,2200,København N,+4512345678
```

```bash
python3 enrich.py ~/salsa/registrations.sqlite details.csv --dry-run
```

Column names are matched loosely (`Postnummer`, `DOB`, `Adresse` all work) and
dates are read in several formats. Existing values are kept unless you pass
`--overwrite`; unmatched rows are reported and skipped.

Note where things land. The street address, phone and full date of birth go
into `person_identity`, which never leaves the machine. The postcode, city and
**birth year** go onto `person`, where analysis can reach them. That split is
the whole point: age brackets and catchment areas are what you actually want
to know, and neither of them needs a birthday or a house number.

---

## The analysis copy

```bash
python3 export_analysis.py ~/salsa/registrations.sqlite ~/salsa/analysis.sqlite --force
```

This writes a second file containing the `v_*` views plus the season and course
tables, and nothing else. No names, no emails, no street addresses, no
birthdays, no free-text comments, no raw sheet rows, no MobilePay references.
People are `SLS-0042`, with a birth year and a postcode.

**That is the file to hand to an analyst — including me.** Point Claude at
`analysis.sqlite` and everything in this README's view list still works;
point it at `registrations.sqlite` and you have disclosed your students' names
and addresses to a third party for no analytical gain.

`--coarse` goes further: birth years get banded into fives and postcodes cut to
two digits (`22xx`). Use it for anything that travels further than your own
laptop. In a class of twenty, "born 1994, postcode 2200, Beginners, Autumn
2026" is one specific person even without her name on it.

---

## GDPR, honestly

Not legal advice — but this is a small dance school, and the shape of the
answer is not complicated.

**Do you need a separate database for the names? No.** You are the data
controller. You are allowed to hold your students' names and contact details:
you need them to run the classes (Art. 6(1)(b), contract) and to keep your
books (Art. 6(1)(c), the Danish `bogføringslov`). Splitting names into a
separate file is *pseudonymisation*, which the regulation names as an
appropriate safeguard (Art. 32(1)(a)) and rewards, but never mandates. And it
does not take the data out of scope: while you still hold the key that maps
`SLS-0042` back to a name, both files are personal data (Recital 26).

**The reason to split is who else sees it.** Your privacy policy says you share
data only with the service providers needed to deliver your classes. An AI
assistant reading your database is not on that list, and putting it there
properly means a processor agreement, a transfer assessment, and a line in the
policy — all for a capability you get anyway from the pseudonymised copy. So
the rule is simply: I get `analysis.sqlite`, you keep `registrations.sqlite`.
The schema is built so that boundary is a script, not a promise.

**Adding addresses and birthdays is new processing, and it needs three things
you do not have yet.**

1. *A purpose and a legal basis.* Contract performance does not obviously
   cover a home address — you do not post anything to anyone. Catchment
   analysis is a legitimate interest (Art. 6(1)(f)) and defensible, but it is a
   different basis from the one you are relying on now, and it comes with a
   right to object.
2. *An update to `privacy.md`.* Section 2 currently says you collect "Name,
   email address, age, and student status". If you start storing street
   addresses and dates of birth, that sentence becomes untrue, which is an
   Art. 13 transparency problem regardless of how good your intentions are.
   Same for Section 3's list of purposes.
3. *Data minimisation (Art. 5(1)(c)).* You want age brackets, not birthdays,
   and neighbourhoods, not house numbers. The schema already coarsens both —
   consider whether you need to store the precise version at all. If you only
   ever ask for a birth year and a postcode, most of this section stops
   applying to you.

**Two things in the current policy are worth fixing while you are here.**
Section 5 says registration data is kept "indefinitely", which is hard to
defend under Art. 5(1)(e) — pick a number instead (say: erase identities three
years after someone's last registration, keep the pseudonymous rows for
statistics, keep payment records five years for the bookkeeping law). And
Art. 30(5)'s exemption for organisations under 250 people does not apply when
processing is regular rather than occasional, which yours is — so a one-page
record of processing activities is worth writing.

**Security (Art. 32).** A SQLite file in Google Drive is a reasonable place for
this as long as the Drive account has two-factor authentication on it and the
file is not in a shared folder. If you would rather it were encrypted at rest,
keep it in an encrypted disk image and let Drive sync that instead.

### When someone asks to be deleted

```bash
python3 forget.py ~/salsa/registrations.sqlite --email anna@example.com --dry-run
```

This deletes the name, email, birthday, phone and address, blanks the free-text
comments, drops the raw imported rows, and redacts the person's name from
anyone else's row that mentions it — leaving an anonymous `SLS-0042` who took
Beginners in Autumn 2025 and paid 680 kroner. Your statistics survive; the
person is gone from the file. That is the standard way to satisfy Art. 17
without breaking Art. 5(1)(e) or your bookkeeping obligations.

`--purge` also deletes the registrations and payments, which you should only do
once the five-year bookkeeping window has passed.

---

## Where to keep the file

Not in this repository. `~/salsa/registrations.sqlite` or similar, and let
Google Drive or Dropbox hold a **snapshot**, not the live file. SQLite plus a
syncing folder is a known way to corrupt a database: the sync client copies the
file mid-write, or two machines write to it at once, and the WAL and the
database disagree.

The safe pattern is a one-line backup that produces a clean, self-contained
copy:

```bash
sqlite3 ~/salsa/registrations.sqlite "VACUUM INTO '~/Google Drive/salsa/registrations-$(date +%F).sqlite'"
```

Run it after every import. Drive gets an ordinary file that is never open, you
keep versioned copies for free, and nothing is ever half-written.

---

## Useful queries

```sql
-- Did last season's beginners come back?
SELECT season_code, COUNT(*) AS people, SUM(returned) AS returned,
       ROUND(100.0 * SUM(returned) / COUNT(*), 1) AS pct
FROM v_retention GROUP BY season_code;

-- Lead/follow balance per class — the number that decides whether to
-- advertise at men or women next season.
SELECT course_label, leads, follows, either FROM v_course_summary
WHERE season_code = 'autumn-2026';

-- How early do people sign up?
SELECT course_label, ROUND(AVG(days_before_season), 1) AS mean_days_early
FROM v_registration WHERE season_code = 'autumn-2026' GROUP BY course_label;

-- Where do students come from?
SELECT postcode, city, COUNT(*) FROM v_person
WHERE postcode IS NOT NULL GROUP BY postcode, city ORDER BY 3 DESC;

-- Anything that does not add up after an import.
SELECT * FROM v_payment_check WHERE verdict NOT IN ('settled', 'unpaid');
```
