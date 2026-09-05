#!/usr/bin/env python3
"""Give every person a personalised link to the /details page.

The page needs to prove who it is talking to without anyone logging in, so
each person gets a long random token. This writes the tokens into the database
and produces one CSV to paste into the "People" tab of the details-collection
spreadsheet:

    token,name,email

That CSV is the only place names and tokens sit together. The Google Sheet's
"Responses" tab carries the token but never the name, which is what lets the
response export be handed to an analyst — see enrich.py --key token.

    python3 make_invites.py registrations.sqlite --out invites.csv
    python3 make_invites.py registrations.sqlite --out new.csv --only-missing

Existing tokens are never regenerated: a link already in someone's inbox keeps
working. --only-missing writes just the people who did not have one yet, which
is what you want when new registrations arrive.
"""

import argparse
import csv
import os
import secrets
import sqlite3
import sys

TOKEN_BYTES = 16          # 128 bits -> 22 url-safe characters; not guessable


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("db")
    ap.add_argument("--out", required=True, help="CSV to write (token, name, email)")
    ap.add_argument("--only-missing", action="store_true",
                    help="write only people who did not already have a token")
    ap.add_argument("--include-erased", action="store_true",
                    help="include people erased under the right to be forgotten (don't)")
    ap.add_argument("--vat-relevant", action="store_true",
                    help="only people whose age you actually have to document: anyone "
                         "who ever ticked under-30, plus anyone who was never asked. "
                         "People who answered 'no' every time were never claimed as "
                         "exempt, so there is nothing to evidence for them.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()

    conds = [] if args.include_erased else ["p.erased_on IS NULL"]
    if args.vat_relevant:
        # Include on a missing answer as well as a yes: the pair form never asks,
        # so those rows are unknown rather than "no", and an unknown age is
        # exactly what the documentation has to resolve.
        conds.append("EXISTS (SELECT 1 FROM registration r"
                     " WHERE r.person_id = p.person_id"
                     "   AND (r.is_young IS NULL OR r.is_young = 1))")
    where = (" WHERE " + " AND ".join(conds)) if conds else ""
    people = cur.execute(
        "SELECT p.person_id, i.token IS NOT NULL FROM person p"
        " LEFT JOIN invite i ON i.person_id = p.person_id" + where +
        " ORDER BY p.person_id").fetchall()

    created = 0
    for person_id, had_token in people:
        if had_token:
            continue
        token = secrets.token_urlsafe(TOKEN_BYTES)
        cur.execute("INSERT INTO invite (person_id, token) VALUES (?, ?)",
                    (person_id, token))
        created += 1

    # Everyone without an email is a dead end for a mail-out; report, don't guess.
    rows = cur.execute(
        "SELECT i.token, d.full_name, e.email, i.sent_at IS NOT NULL"
        "  FROM invite i"
        "  JOIN person p         ON p.person_id = i.person_id"
        "  JOIN person_identity d ON d.person_id = i.person_id"
        "  LEFT JOIN person_email e ON e.person_id = i.person_id AND e.is_primary = 1"
        + where.replace("p.erased_on", "p.erased_on") +
        " ORDER BY i.person_id").fetchall()

    if args.only_missing:
        rows = [r for r in rows if not r[3]]

    no_email = sum(1 for r in rows if not r[2])
    rows = [r for r in rows if r[2]]

    if not args.dry_run:
        with open(args.out, "w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["token", "name", "email"])
            for token, name, email, _sent in rows:
                w.writerow([token, name, email])
        os.chmod(args.out, 0o600)
        conn.commit()
    else:
        conn.rollback()

    print("%s: %d token(s) created, %d row(s) %s %s%s"
          % ("DRY RUN — nothing written" if args.dry_run else "done",
             created, len(rows),
             "would be written to" if args.dry_run else "written to", args.out,
             "" if not no_email else
             " (%d person/people skipped: no email on file)" % no_email))
    if not args.dry_run:
        print("\nPaste %s into the 'People' tab of the details spreadsheet.\n"
              "It is the one file where names and tokens sit together — delete it\n"
              "once it is pasted." % args.out)
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
