#!/usr/bin/env python3
"""Import a Google Sheets registration export into the SQLite archive.

The sheet's columns have changed over the years — the old layout was

    Time  Name  Young  Email  Class  Role  Comments  Paid?  Payment amount

and the current one adds Referral, Pair ID, Pair Partner, Discount and
Amount Due in the middle. This script does not care about column order or
which columns are present: it matches headers by name (case- and
punctuation-insensitive, with synonyms) and fills in whatever it finds.
Anything it does not recognise is still kept, verbatim, in raw_sheet_row.

Re-running the same file is a no-op: each registration carries a dedupe key
built from email + class + timestamp, so a sheet that has grown since the
last import only contributes its new rows.

Usage
-----
    python3 import_sheet.py registrations.sqlite autumn-2026.csv \\
        --source-label "Registrations sheet, Autumn 2026"

    python3 import_sheet.py registrations.sqlite old/*.csv --dry-run

Options worth knowing
---------------------
    --dry-run        parse and report, write nothing
    --strict         abort on an unknown class label instead of creating a
                     placeholder course (use this once your aliases are set up)
    --season CODE    season to hang placeholder courses off
    --date-order     dmy (default) or mdy, for ambiguous 03/09/2025 timestamps
"""

import argparse
import csv
import hashlib
import json
import os
import re
import sqlite3
import sys
import unicodedata
from datetime import datetime

# --------------------------------------------------------------------------
# header handling
# --------------------------------------------------------------------------

# canonical field -> every spelling the sheet has used for it
HEADER_SYNONYMS = {
    "registered_at":  ["time", "timestamp", "date", "tidspunkt", "submitted at"],
    "name":           ["name", "full name", "navn"],
    "young":          ["young", "under 30", "young/student", "student", "under30"],
    "email":          ["email", "e-mail", "mail", "email address"],
    "class_label":    ["class", "classes", "course", "klasse", "hold"],
    "role":           ["role", "rolle", "lead/follow"],
    "comments":       ["comments", "comment", "notes", "kommentar", "bemaerkninger"],
    "referral":       ["referral", "referral source", "source", "how did you hear about us"],
    "pair_ref":       ["pair id", "pairid", "pair"],
    "pair_partner":   ["pair partner", "partner"],
    "discount":       ["discount", "rabat"],
    "amount_due":     ["amount due", "amount", "due", "price"],
    "paid":           ["paid", "has paid", "betalt"],
    "payment_amount": ["payment amount", "amount paid", "paid amount", "betaling"],
}
HEADER_LOOKUP = {}
for _canon, _spellings in HEADER_SYNONYMS.items():
    for _s in _spellings:
        HEADER_LOOKUP[_s] = _canon


def norm_header(h):
    """'Payment amount?' -> 'payment amount'."""
    h = unicodedata.normalize("NFKD", (h or ""))
    h = "".join(ch for ch in h if not unicodedata.combining(ch))
    h = h.strip().lower().rstrip("?:.*").strip()
    return re.sub(r"\s+", " ", h)


def norm_text(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def map_headers(fieldnames):
    """Returns (canonical -> column name, [unrecognised column names])."""
    mapping, unknown = {}, []
    for col in fieldnames or []:
        canon = HEADER_LOOKUP.get(norm_header(col))
        if canon and canon not in mapping:
            mapping[canon] = col
        elif canon is None and norm_header(col):
            unknown.append(col)
    return mapping, unknown


# --------------------------------------------------------------------------
# value parsing
# --------------------------------------------------------------------------

TRUE_WORDS = {"yes", "y", "true", "1", "x", "ja", "paid", "betalt", "✓", "✔", "ok"}
FALSE_WORDS = {"no", "n", "false", "0", "nej", "", "-", "unpaid"}

DATE_FORMATS_DMY = [
    "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
    "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y",
    "%d-%m-%Y %H:%M:%S", "%d-%m-%Y",
    "%d.%m.%Y %H:%M:%S", "%d.%m.%Y %H.%M.%S", "%d.%m.%Y",
]
DATE_FORMATS_MDY = [
    "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
    "%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y",
    "%m/%d/%Y %I:%M:%S %p", "%m/%d/%Y %I:%M %p",
]


def parse_bool(v):
    s = norm_text(v).lower()
    if s in TRUE_WORDS:
        return 1
    if s in FALSE_WORDS:
        return 0
    return None


def parse_dt(v, order="dmy"):
    """Google exports timestamps in whatever the sheet locale felt like."""
    s = norm_text(v)
    if not s:
        return None
    formats = DATE_FORMATS_DMY if order == "dmy" else DATE_FORMATS_MDY
    # An unambiguous first component settles d/m vs m/d on its own.
    m = re.match(r"^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})", s)
    if m:
        first, second = int(m.group(1)), int(m.group(2))
        if first > 12 >= second:
            formats = DATE_FORMATS_DMY
        elif second > 12 >= first:
            formats = DATE_FORMATS_MDY
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt).isoformat(sep=" ")
        except ValueError:
            continue
    return None


def parse_money(v):
    """'1.280,00 kr.' / '1280 DKK' / '640' -> float."""
    s = norm_text(v)
    if not s:
        return None
    s = re.sub(r"(?i)(dkk|kr\.?|,-)", "", s)
    s = re.sub(r"[^\d,.\-]", "", s)
    if not s or s in {"-", ".", ","}:
        return None
    if "," in s and "." in s:
        # whichever separator comes last is the decimal one
        s = s.replace(".", "").replace(",", ".") if s.rfind(",") > s.rfind(".") \
            else s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".") if re.search(r",\d{1,2}$", s) else s.replace(",", "")
    elif re.search(r"^\d{1,3}(\.\d{3})+$", s):
        s = s.replace(".", "")
    try:
        return float(s)
    except ValueError:
        return None


ROLE_MAP = {
    "lead": "lead", "leader": "lead", "leads": "lead", "fører": "lead",
    "follow": "follow", "follower": "follow", "follows": "follow",
    "either": "either", "either role": "either", "both": "either", "any": "either",
}


def parse_role(v):
    return ROLE_MAP.get(norm_text(v).lower())


def _daydiff(a, b):
    """Whole days between two 'YYYY-MM-DD' strings; large if either is unusable."""
    try:
        return (datetime.strptime(a[:10], "%Y-%m-%d")
                - datetime.strptime(b[:10], "%Y-%m-%d")).days
    except (ValueError, TypeError):
        return 10 ** 6


def norm_alias(label):
    return re.sub(r"\s+", " ", (label or "").strip().lower())


def norm_name_key(name):
    s = unicodedata.normalize("NFKD", norm_text(name).lower())
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r"[^a-z ]", "", s)


def slugify(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-") or "course"


# --------------------------------------------------------------------------
# database helpers
# --------------------------------------------------------------------------

class Importer(object):
    def __init__(self, conn, args):
        self.conn = conn
        self.args = args
        self.warnings = []
        self.sensitive = []
        self.new_aliases = []      # (alias, course_code) suggested for seed.sql
        self.stats = {"rows": 0, "inserted": 0, "skipped": 0,
                      "people_created": 0, "courses_created": 0, "payments": 0}

    def warn(self, msg, sensitive=False):
        """Warnings that quote a name go to a log file next to the database
        rather than to the terminal, so an import can be run in front of
        someone who is not supposed to see the names."""
        if sensitive:
            self.sensitive.append(msg)
        else:
            self.warnings.append(msg)

    # -- people ------------------------------------------------------------
    def resolve_person(self, name, email, seen_on):
        cur = self.conn.cursor()
        email = norm_text(email).lower() or None
        name = norm_text(name)

        person_id = None
        if email:
            row = cur.execute(
                "SELECT person_id FROM person_email WHERE email = ?", (email,)
            ).fetchone()
            if row:
                person_id = row[0]
        if person_id is None and name:
            # No email (a hand-typed row): fall back to an exact normalised name.
            for pid, full in cur.execute(
                "SELECT person_id, full_name FROM person_identity"
            ).fetchall():
                if norm_name_key(full) == norm_name_key(name):
                    person_id = pid
                    self.warn("matched '%s' to an existing person by name "
                              "(no email on the row)" % name, sensitive=True)
                    break

        if person_id is None:
            cur.execute(
                "INSERT INTO person (pseudonym, first_seen_on) VALUES (?, ?)",
                ("pending-%s" % os.urandom(8).hex(), seen_on),
            )
            person_id = cur.lastrowid
            cur.execute("UPDATE person SET pseudonym = ? WHERE person_id = ?",
                        ("SLS-%04d" % person_id, person_id))
            cur.execute(
                "INSERT INTO person_identity (person_id, full_name) VALUES (?, ?)",
                (person_id, name or "(unknown)"),
            )
            self.stats["people_created"] += 1
        else:
            cur.execute(
                "UPDATE person SET first_seen_on = MIN(COALESCE(first_seen_on, ?), ?),"
                " updated_at = datetime('now') WHERE person_id = ?",
                (seen_on, seen_on, person_id),
            )
            existing = cur.execute(
                "SELECT full_name FROM person_identity WHERE person_id = ?", (person_id,)
            ).fetchone()
            if name and existing and norm_name_key(existing[0]) != norm_name_key(name):
                self.warn("'%s' also registered as '%s' — kept the first spelling (person %d)"
                          % (existing[0], name, person_id), sensitive=True)

        if email:
            cur.execute(
                "INSERT OR IGNORE INTO person_email (person_id, email, is_primary, first_seen_on)"
                " VALUES (?, ?, 0, ?)", (person_id, email, seen_on))
            cur.execute(
                "UPDATE person_email SET is_primary = 1 WHERE person_id = ? AND email = ?"
                " AND NOT EXISTS (SELECT 1 FROM person_email WHERE person_id = ? AND is_primary = 1)",
                (person_id, email, person_id))
        return person_id

    # -- courses -----------------------------------------------------------
    def resolve_courses(self, label, when):
        """A cell may hold one label or several joined with ', '."""
        label = norm_text(label)
        if not label:
            return []
        hit = self.lookup_course(label, when)
        if hit:
            return [hit]
        parts = [p for p in (norm_text(x) for x in label.split(",")) if p]
        if len(parts) > 1:
            found = [self.lookup_course(p, when) for p in parts]
            if all(f is not None for f in found):
                return found
            return [self.ensure_course(p) for p in parts]
        return [self.ensure_course(label)]

    def lookup_course(self, label, when):
        """Aliases repeat across seasons, so a label alone is ambiguous. Narrow
        it with --season if given, otherwise with the registration date."""
        alias = norm_alias(label)
        rows = self.conn.execute(
            "SELECT c.course_id, s.code, s.starts_on, s.ends_on"
            "  FROM course_alias a"
            "  JOIN course c ON c.course_id = a.course_id"
            "  LEFT JOIN season s ON s.season_id = c.season_id"
            " WHERE a.alias = ?"
            " UNION"
            " SELECT c.course_id, s.code, s.starts_on, s.ends_on"
            "  FROM course c LEFT JOIN season s ON s.season_id = c.season_id"
            " WHERE lower(c.label) = ?", (alias, alias)).fetchall()
        if not rows:
            return None
        if self.args.season:
            scoped = [r for r in rows if r[1] == self.args.season]
            if scoped:
                rows = scoped
            elif len(rows) > 1:
                self.warn("label %r has no course in season %s — falling back to the "
                          "registration date" % (label, self.args.season))
        if len(rows) == 1:
            return rows[0][0]

        # The registration belongs to the earliest season that had not yet
        # finished when it came in; failing that, the nearest season by start.
        day = (when or "")[:10]

        def rank(r):
            ends, starts = r[3] or "9999-12-31", r[2] or "9999-12-31"
            return (0 if ends >= day else 1, ends if ends >= day else "",
                    abs(_daydiff(starts, day)))

        rows = sorted(rows, key=rank)
        self.warn("label %r matches %d seasons — assigned the %s row to %s "
                  "(pass --season to be explicit)"
                  % (label, len(rows), day, rows[0][1]))
        return rows[0][0]

    def ensure_course(self, label):
        if self.args.strict:
            raise SystemExit(
                "unknown class label %r.\n"
                "Add it to course_alias in seed.sql (or drop --strict to let the\n"
                "importer create a placeholder course you can tidy up afterwards)."
                % label)
        cur = self.conn.cursor()
        season_id = None
        if self.args.season:
            row = cur.execute("SELECT season_id FROM season WHERE code = ?",
                              (self.args.season,)).fetchone()
            if not row:
                raise SystemExit("no season with code %r — add it to seed.sql first"
                                 % self.args.season)
            season_id = row[0]
        code = "unmapped-%s" % slugify(label)
        row = cur.execute("SELECT course_id FROM course WHERE code = ?", (code,)).fetchone()
        if row:
            course_id = row[0]
        else:
            cur.execute(
                "INSERT INTO course (season_id, code, label, kind) VALUES (?, ?, ?, 'other')",
                (season_id, code, label))
            course_id = cur.lastrowid
            self.stats["courses_created"] += 1
            self.warn("created placeholder course %r for the unknown label %r" % (code, label))
        cur.execute("INSERT OR IGNORE INTO course_alias (alias, course_id) VALUES (?, ?)",
                    (norm_alias(label), course_id))
        self.new_aliases.append((norm_alias(label), code))
        return course_id

    # -- pairs -------------------------------------------------------------
    def resolve_pair(self, ref, discount, amount_due, created_at):
        ref = norm_text(ref)
        if not ref:
            return None
        cur = self.conn.cursor()
        row = cur.execute("SELECT pair_id FROM pair WHERE external_ref = ?", (ref,)).fetchone()
        if row:
            return row[0]
        total = amount_due * 2 if amount_due else None
        cur.execute(
            "INSERT INTO pair (external_ref, discount_label, total_amount_dkk, created_at)"
            " VALUES (?, ?, ?, ?)", (ref, norm_text(discount) or None, total, created_at))
        return cur.lastrowid


# --------------------------------------------------------------------------
# the import itself
# --------------------------------------------------------------------------

def read_rows(path, encoding):
    with open(path, "r", encoding=encoding, newline="") as fh:
        sample = fh.read(8192)
        fh.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
        except csv.Error:
            dialect = csv.excel
        reader = csv.DictReader(fh, dialect=dialect)
        return reader.fieldnames, [r for r in reader]


def parse_row(raw, cols, order):
    def get(field):
        col = cols.get(field)
        return raw.get(col) if col else None

    return {
        "registered_at": parse_dt(get("registered_at"), order),
        "name": norm_text(get("name")),
        "email": norm_text(get("email")).lower(),
        "young": parse_bool(get("young")) if cols.get("young") else None,
        "class_label": norm_text(get("class_label")),
        "role": parse_role(get("role")),
        "comments": norm_text(get("comments")) or None,
        "referral": norm_text(get("referral")) or None,
        "pair_ref": norm_text(get("pair_ref")) or None,
        "discount": norm_text(get("discount")) or None,
        "amount_due": parse_money(get("amount_due")),
        "paid": parse_bool(get("paid")) if cols.get("paid") else None,
        # The "Paid?" cell doubles as a status marker: a single-class drop-in
        # gets "Drop-in" written into it rather than Yes.
        "paid_note": norm_text(get("paid")) or None,
        "payment_amount": parse_money(get("payment_amount")),
    }


def infer_form(rec):
    if (rec.get("paid_note") or "").lower().startswith("drop"):
        return "dropin"
    if rec["pair_ref"]:
        return "friend"
    if not rec["email"] and not rec["registered_at"]:
        return "manual"
    return "season"


def import_file(imp, path, source_label):
    conn, args = imp.conn, imp.args
    fieldnames, raws = read_rows(path, args.encoding)
    cols, unknown = map_headers(fieldnames)

    missing = [f for f in ("registered_at", "name", "class_label") if f not in cols]
    if missing:
        raise SystemExit("%s: could not find column(s) %s.\nHeaders seen: %s"
                         % (path, ", ".join(missing), fieldnames))
    if unknown:
        imp.warn("%s: ignored unrecognised column(s) %s (kept verbatim in raw_sheet_row)"
                 % (os.path.basename(path), ", ".join(unknown)))

    layout = " | ".join(sorted(cols))
    cur = conn.cursor()
    cur.execute("INSERT INTO import_batch (source_file, source_label, layout, n_rows)"
                " VALUES (?, ?, ?, ?)",
                (os.path.abspath(path), source_label or os.path.basename(path),
                 layout, len(raws)))
    batch_id = cur.lastrowid

    inserted, skipped = 0, 0
    # registration ids by pair ref, so pair payments can be settled afterwards
    pair_rows = {}

    for i, raw in enumerate(raws, start=2):          # row 1 is the header
        if not any(norm_text(v) for v in raw.values()):
            continue
        imp.stats["rows"] += 1
        rec = parse_row(raw, cols, args.date_order)

        if not rec["registered_at"]:
            imp.warn("%s row %d: unreadable timestamp %r — row skipped"
                     % (os.path.basename(path), i, raw.get(cols["registered_at"])))
            skipped += 1
            continue
        if not rec["email"] and not rec["name"]:
            imp.warn("%s row %d: no name and no email — row skipped" % (os.path.basename(path), i))
            skipped += 1
            continue

        payload = json.dumps(raw, ensure_ascii=False, sort_keys=True)
        row_hash = hashlib.sha1(payload.encode("utf-8")).hexdigest()
        cur.execute("INSERT INTO raw_sheet_row (batch_id, row_number, row_hash, payload_json)"
                    " VALUES (?, ?, ?, ?)", (batch_id, i, row_hash, payload))
        raw_row_id = cur.lastrowid

        seen_on = rec["registered_at"][:10]
        person_id = imp.resolve_person(rec["name"], rec["email"], seen_on)
        course_ids = imp.resolve_courses(rec["class_label"], rec["registered_at"]) or [None]
        pair_id = imp.resolve_pair(rec["pair_ref"], rec["discount"],
                                   rec["amount_due"], rec["registered_at"])
        form = args.form or infer_form(rec)

        # A bundle in one cell ("Beginners Autumn, Intermediate 1 Autumn") is
        # one registration per class, with the money split evenly between them.
        n = len(course_ids)
        due = (rec["amount_due"] / n) if rec["amount_due"] is not None else None
        paid_amt = (rec["payment_amount"] / n) if rec["payment_amount"] is not None else None

        for course_id in course_ids:
            key_src = "%s|%s|%s" % (rec["email"] or norm_name_key(rec["name"]),
                                    course_id, rec["registered_at"])
            dedupe_key = hashlib.sha1(key_src.encode("utf-8")).hexdigest()
            if cur.execute("SELECT 1 FROM registration WHERE dedupe_key = ?",
                           (dedupe_key,)).fetchone():
                skipped += 1
                continue
            cur.execute(
                "INSERT INTO registration (person_id, course_id, registered_at, role,"
                " is_young, form, referral, pair_id, discount_label, amount_due_dkk,"
                " marked_paid, comments, dedupe_key, raw_row_id)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (person_id, course_id, rec["registered_at"], rec["role"], rec["young"],
                 form, rec["referral"], pair_id, rec["discount"], due,
                 rec["paid"], rec["comments"], dedupe_key, raw_row_id))
            reg_id = cur.lastrowid
            inserted += 1

            settled = rec["paid"] == 1 or (paid_amt or 0) > 0
            amount = paid_amt if paid_amt is not None else (due if settled else None)
            if settled and amount:
                if pair_id:
                    pair_rows.setdefault(pair_id, []).append((reg_id, person_id, amount))
                else:
                    record_payment(imp, [(reg_id, amount)], person_id,
                                   rec["registered_at"], rec["pair_ref"])

    settle_pairs(imp, pair_rows)
    spread_bundle_payments(imp)

    conn.execute("UPDATE import_batch SET n_inserted = ?, n_skipped = ? WHERE batch_id = ?",
                 (inserted, skipped, batch_id))
    imp.stats["inserted"] += inserted
    imp.stats["skipped"] += skipped
    return inserted, skipped


def spread_bundle_payments(imp):
    """Two classes is two rows but one transfer. The sheet carries the whole
    amount on one row and writes 0 on the other, which would otherwise credit
    the entire 1440 to whichever class they happened to type it into. Where a
    person has several registrations in one season, all marked paid, and
    exactly one payment between them, spread that payment evenly across them.

    Only when every course in the group is the same kind. A season class and a
    crash course in the same season are not a bundle — they are two different
    prices, and splitting 1000 DKK evenly across them would move 400 DKK of
    class income onto a workshop. Those are left exactly as the sheet had
    them, and show up in v_payment_check."""
    cur = imp.conn.cursor()
    groups = cur.execute(
        "SELECT r.person_id, c.season_id, GROUP_CONCAT(r.registration_id),"
        "       COUNT(DISTINCT c.kind)"
        "  FROM registration r JOIN course c ON c.course_id = r.course_id"
        " WHERE r.marked_paid = 1 AND r.pair_id IS NULL"
        " GROUP BY r.person_id, c.season_id HAVING COUNT(*) > 1").fetchall()
    spread, mixed = 0, 0
    for _person_id, _season_id, ids, n_kinds in groups:
        reg_ids = [int(x) for x in ids.split(",")]
        if n_kinds > 1:
            mixed += 1
            continue
        allocated = dict((r, cur.execute(
            "SELECT COALESCE(SUM(amount_dkk), 0) FROM payment_allocation"
            " WHERE registration_id = ?", (r,)).fetchone()[0]) for r in reg_ids)
        if all(v > 0 for v in allocated.values()):
            continue                                   # each row paid separately
        payments = [row[0] for row in cur.execute(
            "SELECT DISTINCT payment_id FROM payment_allocation WHERE registration_id IN (%s)"
            % ",".join("?" * len(reg_ids)), reg_ids).fetchall()]
        if len(payments) != 1:
            if payments:
                imp.warn("%d registrations in one season share %d payments — left as "
                         "imported, check them in v_payment_check"
                         % (len(reg_ids), len(payments)))
            continue
        payment_id = payments[0]
        amount = cur.execute("SELECT amount_dkk FROM payment WHERE payment_id = ?",
                             (payment_id,)).fetchone()[0]
        share = round(amount / float(len(reg_ids)), 2)
        cur.execute("DELETE FROM payment_allocation WHERE payment_id = ?", (payment_id,))
        for r in reg_ids:
            cur.execute("INSERT INTO payment_allocation (payment_id, registration_id,"
                        " amount_dkk) VALUES (?, ?, ?)", (payment_id, r, share))
        spread += 1
    if spread:
        imp.warn("spread %d bundle payment(s) across the classes they actually cover, "
                 "so per-course revenue is not credited to one class alone" % spread)
    if mixed:
        imp.warn("left %d payment(s) alone that cover both a class and a workshop in "
                 "one season — the split between them is not evenly divided and the "
                 "sheet does not say what it was. Per-course revenue for those is "
                 "credited wherever the amount was typed; see v_payment_check." % mixed)


def record_payment(imp, allocations, person_id, paid_on, reference):
    total = sum(a for _, a in allocations)
    cur = imp.conn.cursor()
    cur.execute("INSERT INTO payment (paid_by_person_id, paid_on, amount_dkk, method,"
                " reference, note) VALUES (?, ?, ?, NULL, ?, 'imported from sheet')",
                (person_id, paid_on[:10] if paid_on else None, total, reference))
    pid = cur.lastrowid
    for reg_id, amount in allocations:
        cur.execute("INSERT INTO payment_allocation (payment_id, registration_id, amount_dkk)"
                    " VALUES (?, ?, ?)", (pid, reg_id, amount))
    imp.stats["payments"] += 1


def settle_pairs(imp, pair_rows):
    """A pair pays 1280 once. The sheet sometimes records that on one row and
    sometimes on both — booking it twice would inflate revenue, so identical
    amounts on both halves of a pair are collapsed into a single payment."""
    for pair_id, entries in pair_rows.items():
        ref = imp.conn.execute("SELECT external_ref FROM pair WHERE pair_id = ?",
                               (pair_id,)).fetchone()
        ref = ref[0] if ref else None
        amounts = [a for _, _, a in entries]
        due_total = imp.conn.execute(
            "SELECT SUM(COALESCE(amount_due_dkk, 0)) FROM registration WHERE pair_id = ?",
            (pair_id,)).fetchone()[0] or 0
        collapse = (len(entries) == 2
                    and abs(amounts[0] - amounts[1]) < 0.01
                    and amounts[0] > (due_total / 2) + 0.01)
        if collapse:
            share = amounts[0] / 2.0
            record_payment(imp, [(r, share) for r, _, _ in entries],
                           entries[0][1], None, ref)
            imp.warn("pair %s: the same %.0f DKK appears on both rows — booked once, "
                     "split across the two registrations" % (ref, amounts[0]))
        else:
            for reg_id, person_id, amount in entries:
                record_payment(imp, [(reg_id, amount)], person_id, None, ref)


# --------------------------------------------------------------------------

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("db")
    ap.add_argument("csv_files", nargs="+")
    ap.add_argument("--source-label", default=None,
                    help="human label stored on the import batch")
    ap.add_argument("--form", default=None,
                    choices=["season", "beginner", "friend", "workshop", "manual"],
                    help="override the registration source (default: inferred per row)")
    ap.add_argument("--season", default=None,
                    help="season this sheet belongs to (e.g. autumn-2025): resolves "
                         "labels reused across years and hosts placeholder courses")
    ap.add_argument("--date-order", default="dmy", choices=["dmy", "mdy"])
    ap.add_argument("--encoding", default="utf-8-sig")
    ap.add_argument("--strict", action="store_true",
                    help="fail on an unknown class label instead of guessing")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    if not os.path.exists(args.db):
        raise SystemExit("%s does not exist — create it with:\n"
                         "  sqlite3 %s < schema.sql && sqlite3 %s < seed.sql"
                         % (args.db, args.db, args.db))

    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA foreign_keys = ON")
    imp = Importer(conn, args)

    try:
        for path in args.csv_files:
            ins, skip = import_file(imp, path, args.source_label)
            print("%-40s %4d inserted, %4d already present" % (os.path.basename(path), ins, skip))
        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()
    except Exception:
        conn.rollback()
        raise

    if imp.warnings:
        print("\nwarnings (%d):" % len(imp.warnings))
        for w in imp.warnings:
            print("  - %s" % w)

    if imp.sensitive:
        log = os.path.join(os.path.dirname(os.path.abspath(args.db)), "import-warnings.log")
        with open(log, "a", encoding="utf-8") as fh:
            fh.write("# %s  %s\n" % (datetime.now().isoformat(timespec="seconds"),
                                     ", ".join(os.path.basename(f) for f in args.csv_files)))
            for w in imp.sensitive:
                fh.write("  - %s\n" % w)
        print("\n%d warning(s) quote a person by name and were written to\n  %s\n"
              "  (read it yourself — these are the rows where two spellings of a name,\n"
              "   or a row with no email, may have been merged into one person)."
              % (len(imp.sensitive), log))

    if imp.new_aliases:
        print("\nPaste into the alias block of seed.sql once you have decided which\n"
              "real course each of these belongs to:")
        for alias, code in sorted(set(imp.new_aliases)):
            print("  UNION ALL SELECT %-40s, %r" % ("'%s'" % alias, code))

    print("\n%s: %d rows read, %d registrations inserted, %d skipped, "
          "%d people created, %d courses created, %d payments recorded."
          % ("DRY RUN — nothing written" if args.dry_run else "done",
             imp.stats["rows"], imp.stats["inserted"], imp.stats["skipped"],
             imp.stats["people_created"], imp.stats["courses_created"],
             imp.stats["payments"]))
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
