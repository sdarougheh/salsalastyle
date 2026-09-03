#!/usr/bin/env python3
"""Write a pseudonymised copy of the database, safe to hand to an analyst.

The main file holds names, emails, street addresses and birthdays. This
script produces a second SQLite file that holds none of them: every person is
just their pseudonym (SLS-0042) plus the coarse attributes that analysis
actually needs — birth year, postcode, city.

What is deliberately left behind:
    person_identity      names, birthdays, phones, street addresses
    person_email         every address
    registration.comments  free text; people name their friends in it
    raw_sheet_row        the verbatim sheet rows
    payment              MobilePay references
    pii_* views

What crosses over: the v_* views, plus season and course as dimension tables.

    python3 export_analysis.py registrations.sqlite analysis.sqlite
    python3 export_analysis.py registrations.sqlite analysis.sqlite --coarse

--coarse additionally buckets birth year into five-year bands and truncates
the postcode to its first two digits. Worth it once the database is small
enough that a single 1994-born dancer in 2200 is identifiable on her own.
"""

import argparse
import os
import sqlite3
import sys

# Views copied verbatim. Anything not on this list stays behind.
SAFE_VIEWS = [
    "v_person", "v_registration", "v_season_summary", "v_course_summary",
    "v_person_season", "v_retention", "v_referral_summary", "v_payment_check",
]
SAFE_TABLES = ["season", "course"]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source")
    ap.add_argument("target")
    ap.add_argument("--coarse", action="store_true",
                    help="band birth years by 5 and cut postcodes to 2 digits")
    ap.add_argument("--force", action="store_true", help="overwrite an existing target")
    args = ap.parse_args(argv)

    if os.path.exists(args.target):
        if not args.force:
            raise SystemExit("%s already exists — pass --force to replace it" % args.target)
        os.remove(args.target)

    conn = sqlite3.connect(args.source)
    conn.execute("ATTACH DATABASE ? AS out", (args.target,))

    for table in SAFE_TABLES:
        conn.execute("CREATE TABLE out.%s AS SELECT * FROM main.%s" % (table, table))
    for view in SAFE_VIEWS:
        conn.execute("CREATE TABLE out.%s AS SELECT * FROM main.%s" % (view, view))

    if args.coarse:
        conn.execute("UPDATE out.v_person SET birth_year = (birth_year / 5) * 5,"
                     " postcode = substr(postcode, 1, 2) || 'xx'"
                     " WHERE birth_year IS NOT NULL OR postcode IS NOT NULL")
        for view in ("v_registration",):
            conn.execute("UPDATE out.%s SET age_at_season = (age_at_season / 5) * 5"
                         " WHERE age_at_season IS NOT NULL" % view)

    conn.execute("CREATE TABLE out.meta (key TEXT PRIMARY KEY, value TEXT)")
    conn.executemany("INSERT INTO out.meta (key, value) VALUES (?, ?)", [
        ("schema_version", conn.execute(
            "SELECT value FROM main.meta WHERE key = 'schema_version'").fetchone()[0]),
        ("contains_pii", "no"),
        ("exported_at", conn.execute("SELECT datetime('now')").fetchone()[0]),
        ("coarsened", "yes" if args.coarse else "no"),
        ("source", os.path.basename(args.source)),
        ("note", "Pseudonymised extract. No names, emails, addresses, birthdays "
                 "or free text. Still personal data under GDPR while the key "
                 "exists in the source file — do not publish."),
    ])
    conn.commit()

    counts = []
    for name in SAFE_TABLES + SAFE_VIEWS:
        n = conn.execute("SELECT COUNT(*) FROM out.%s" % name).fetchone()[0]
        counts.append("  %-22s %6d rows" % (name, n))
    conn.execute("DETACH DATABASE out")
    conn.close()

    print("wrote %s%s" % (args.target, " (coarsened)" if args.coarse else ""))
    print("\n".join(counts))
    return 0


if __name__ == "__main__":
    sys.exit(main())
