#!/usr/bin/env python3
"""Merge extra details — addresses, birthdays, phone numbers — into people
who are already in the database.

The registration form never asked for these, so they arrive later from
somewhere else: a signup sheet at the studio, a spreadsheet you filled in by
hand, an export from somewhere. Give this script a CSV keyed on email (or on
the pseudonym, if you are working from an export), and it fills in the gaps.

    email,date_of_birth,street,postcode,city,phone
    anna@example.com,1994-03-17,Nørrebrogade 12 2.th,2200,København N,+4512345678

Recognised columns (all optional except the key):
    email | pseudonym        which person this row is about
    full_name                corrects a misspelling from the sheet
    date_of_birth            YYYY-MM-DD, DD/MM/YYYY or DD.MM.YYYY
    phone, street            stored in person_identity (never exported)
    postcode, city, country  stored on person (coarse, safe to export)
    consent_email_marketing  yes/no
    consent_photo            yes/no
    notes                    free text, treated as identifying

By default existing values are kept; pass --overwrite to replace them.
Rows whose person cannot be found are reported and left alone.

    python3 enrich.py registrations.sqlite details.csv
    python3 enrich.py registrations.sqlite details.csv --dry-run
"""

import argparse
import csv
import os
import re
import sqlite3
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_sheet import norm_header, norm_text, parse_bool  # noqa: E402

FIELD_SYNONYMS = {
    "email":         ["email", "e-mail", "mail"],
    "pseudonym":     ["pseudonym", "id", "person id", "person_id"],
    "full_name":     ["full name", "name", "navn"],
    "date_of_birth": ["date of birth", "dob", "birthday", "birth date", "fodselsdag", "født"],
    "phone":         ["phone", "mobile", "telefon", "tlf"],
    "street":        ["street", "address", "adresse", "street address", "vej"],
    "postcode":      ["postcode", "post code", "zip", "postnummer", "postnr"],
    "city":          ["city", "town", "by"],
    "country":       ["country", "land"],
    "notes":         ["notes", "note", "kommentar"],
    "consent_email_marketing": ["consent email marketing", "newsletter", "marketing consent"],
    "consent_photo": ["consent photo", "photo consent", "photos"],
}
LOOKUP = {}
for _c, _ss in FIELD_SYNONYMS.items():
    for _s in _ss:
        LOOKUP[_s] = _c

IDENTITY_FIELDS = ("full_name", "date_of_birth", "phone", "street", "notes")
PERSON_FIELDS = ("postcode", "city", "country")
DOB_FORMATS = ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%Y/%m/%d"]


def parse_dob(v):
    s = norm_text(v)
    if not s:
        return None
    for fmt in DOB_FORMATS:
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def find_person(conn, rec):
    if rec.get("email"):
        row = conn.execute("SELECT person_id FROM person_email WHERE email = ?",
                           (rec["email"].lower(),)).fetchone()
        if row:
            return row[0]
    if rec.get("pseudonym"):
        row = conn.execute("SELECT person_id FROM person WHERE pseudonym = ?",
                           (rec["pseudonym"],)).fetchone()
        if row:
            return row[0]
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("db")
    ap.add_argument("csv_file")
    ap.add_argument("--overwrite", action="store_true",
                    help="replace values that are already filled in")
    ap.add_argument("--encoding", default="utf-8-sig")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA foreign_keys = ON")

    with open(args.csv_file, "r", encoding=args.encoding, newline="") as fh:
        reader = csv.DictReader(fh)
        cols = {}
        for col in reader.fieldnames or []:
            canon = LOOKUP.get(norm_header(col))
            if canon and canon not in cols:
                cols[canon] = col
        if "email" not in cols and "pseudonym" not in cols:
            raise SystemExit("need an 'email' or 'pseudonym' column to match on.\n"
                             "Headers seen: %s" % reader.fieldnames)
        rows = list(reader)

    updated, unmatched, unchanged = 0, [], 0
    for row in rows:
        rec = {k: norm_text(row.get(v)) for k, v in cols.items()}
        person_id = find_person(conn, rec)
        if not person_id:
            unmatched.append(rec.get("email") or rec.get("pseudonym") or "(blank)")
            continue
        if conn.execute("SELECT erased_on FROM person WHERE person_id = ?",
                        (person_id,)).fetchone()[0]:
            unmatched.append("%s — erased under the right to be forgotten, skipped"
                             % (rec.get("email") or rec.get("pseudonym")))
            continue

        if rec.get("date_of_birth"):
            dob = parse_dob(rec["date_of_birth"])
            if dob is None:
                print("  ! could not read date of birth %r for %s"
                      % (rec["date_of_birth"], rec.get("email") or rec.get("pseudonym")))
            rec["date_of_birth"] = dob

        touched = False
        for field in IDENTITY_FIELDS:
            value = rec.get(field)
            if not value:
                continue
            clause = "" if args.overwrite else \
                " AND (%s IS NULL OR trim(%s) = '')" % (field, field)
            cur = conn.execute("UPDATE person_identity SET %s = ? WHERE person_id = ?%s"
                               % (field, clause), (value, person_id))
            touched = touched or cur.rowcount > 0

        for field in PERSON_FIELDS:
            value = rec.get(field)
            if not value:
                continue
            if field == "postcode":
                value = re.sub(r"\s+", "", value)
            clause = "" if args.overwrite else \
                " AND (%s IS NULL OR trim(%s) = '')" % (field, field)
            cur = conn.execute("UPDATE person SET %s = ? WHERE person_id = ?%s"
                               % (field, clause), (value, person_id))
            touched = touched or cur.rowcount > 0

        # birth_year is the coarse copy that analysis actually uses
        dob = conn.execute("SELECT date_of_birth FROM person_identity WHERE person_id = ?",
                           (person_id,)).fetchone()[0]
        if dob and len(dob) >= 4:
            conn.execute("UPDATE person SET birth_year = ? WHERE person_id = ?",
                         (int(dob[:4]), person_id))

        for field, kind in (("consent_email_marketing", "email_marketing"),
                            ("consent_photo", "photo")):
            if rec.get(field):
                granted = parse_bool(rec[field])
                if granted is not None:
                    conn.execute(
                        "INSERT INTO consent (person_id, kind, granted, recorded_on, source)"
                        " VALUES (?, ?, ?, date('now'), ?)"
                        " ON CONFLICT(person_id, kind) DO UPDATE SET"
                        " granted = excluded.granted, recorded_on = excluded.recorded_on,"
                        " source = excluded.source",
                        (person_id, kind, granted, os.path.basename(args.csv_file)))
                    touched = True

        conn.execute("UPDATE person SET updated_at = datetime('now') WHERE person_id = ?",
                     (person_id,))
        if touched:
            updated += 1
        else:
            unchanged += 1

    if args.dry_run:
        conn.rollback()
    else:
        conn.commit()

    if unmatched:
        print("no match for %d row(s):" % len(unmatched))
        for u in unmatched:
            print("  - %s" % u)
    print("%s: %d of %d rows updated, %d already complete, %d unmatched."
          % ("DRY RUN — nothing written" if args.dry_run else "done",
             updated, len(rows), unchanged, len(unmatched)))
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
