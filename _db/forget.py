#!/usr/bin/env python3
"""Erase one person's identity while keeping the record they belong to.

GDPR Article 17 gives someone the right to have their personal data deleted;
Danish bookkeeping law says you must keep the accounting record for five
years, and you would rather not lose a season out of your own statistics
either. Those pull in different directions, and the way to satisfy both is to
delete what identifies the person and keep what does not.

So this removes the name, email, birthday, phone and address, scrubs the free
text and the raw imported rows, and leaves behind an anonymous SLS-0042 who
took the Beginners class in Autumn 2025 and paid 680 kroner. If you need to
go further and drop the accounting rows too, pass --purge.

    python3 forget.py registrations.sqlite --email anna@example.com
    python3 forget.py registrations.sqlite --pseudonym SLS-0042 --dry-run
"""

import argparse
import json
import sqlite3
import sys


def resolve(conn, args):
    if args.email:
        row = conn.execute("SELECT person_id FROM person_email WHERE email = ?",
                           (args.email.strip().lower(),)).fetchone()
    else:
        row = conn.execute("SELECT person_id FROM person WHERE pseudonym = ?",
                           (args.pseudonym.strip(),)).fetchone()
    if not row:
        raise SystemExit("no such person")
    return row[0]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("db")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--email")
    g.add_argument("--pseudonym")
    ap.add_argument("--purge", action="store_true",
                    help="also delete the registrations and payments themselves")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA foreign_keys = ON")
    person_id = resolve(conn, args)

    ident = conn.execute("SELECT full_name FROM person_identity WHERE person_id = ?",
                         (person_id,)).fetchone()
    name = ident[0] if ident else None
    pseudonym = conn.execute("SELECT pseudonym FROM person WHERE person_id = ?",
                             (person_id,)).fetchone()[0]
    n_regs = conn.execute("SELECT COUNT(*) FROM registration WHERE person_id = ?",
                          (person_id,)).fetchone()[0]

    conn.execute("DELETE FROM person_identity WHERE person_id = ?", (person_id,))
    conn.execute("DELETE FROM person_email WHERE person_id = ?", (person_id,))
    conn.execute("DELETE FROM consent WHERE person_id = ?", (person_id,))
    conn.execute("UPDATE person SET birth_year = NULL, postcode = NULL, city = NULL,"
                 " erased_on = date('now'), updated_at = datetime('now')"
                 " WHERE person_id = ?", (person_id,))
    conn.execute("UPDATE registration SET comments = NULL WHERE person_id = ?", (person_id,))
    conn.execute(
        "DELETE FROM raw_sheet_row WHERE raw_row_id IN"
        " (SELECT raw_row_id FROM registration WHERE person_id = ? AND raw_row_id IS NOT NULL)",
        (person_id,))

    # Their name also sits in other people's rows: "Pair Partner" on the other
    # half of a couple, and whatever anyone wrote in Comments.
    redacted = 0
    if name:
        for raw_id, payload in conn.execute(
                "SELECT raw_row_id, payload_json FROM raw_sheet_row").fetchall():
            if name.lower() in payload.lower():
                data = json.loads(payload)
                data = dict((k, ("(erased)" if isinstance(v, str) and name.lower() in v.lower()
                                 else v)) for k, v in data.items())
                conn.execute("UPDATE raw_sheet_row SET payload_json = ? WHERE raw_row_id = ?",
                             (json.dumps(data, ensure_ascii=False, sort_keys=True), raw_id))
                redacted += 1
        for reg_id, comment in conn.execute(
                "SELECT registration_id, comments FROM registration"
                " WHERE comments IS NOT NULL").fetchall():
            if name.lower() in comment.lower():
                conn.execute("UPDATE registration SET comments = NULL WHERE registration_id = ?",
                             (reg_id,))
                redacted += 1

    if args.purge:
        conn.execute("DELETE FROM payment WHERE paid_by_person_id = ?", (person_id,))
        conn.execute("DELETE FROM registration WHERE person_id = ?", (person_id,))
        conn.execute("DELETE FROM person WHERE person_id = ?", (person_id,))

    if args.dry_run:
        conn.rollback()
    else:
        conn.commit()
    conn.close()

    print("%s: erased the identity behind %s (%d registration%s%s), "
          "redacted %d other row%s mentioning them."
          % ("DRY RUN — nothing written" if args.dry_run else "done",
             pseudonym, n_regs, "" if n_regs == 1 else "s",
             ", and purged them" if args.purge else ", kept as anonymous history",
             redacted, "" if redacted == 1 else "s"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
