"""Turn an untrusted pasted/uploaded spreadsheet (CSV text) into clean feedback rows.

Spreadsheets are user input: validate aggressively, default politely, and
report every fix-up so the caller can show receipts to the user.
"""
from __future__ import annotations

import csv
import io
from datetime import datetime

from django.utils import timezone

MAX_ROWS = 500
MAX_BODY = 2000

FIELD_ALIASES = {
    "message_id": ("id", "message_id", "msg_id", "ticket", "ticket id", "ref", "case id"),
    "ts": ("timestamp", "time", "datetime", "date", "created", "created_at", "when"),
    "source": ("source", "channel", "via"),
    "rider": ("rider", "rider_id", "rider id", "name", "user", "customer", "passenger", "from"),
    "route": ("route", "corridor", "trip", "lane"),
    "star_rating": ("star_rating", "star rating", "stars", "rating", "star"),
    "body": ("message", "body", "text", "feedback", "complaint", "description", "content", "review", "comment"),
}

SOURCE_ALIASES = {
    "chat": "app_chat",
    "app": "app_chat",
    "app chat": "app_chat",
    "in-app": "app_chat",
    "mail": "email",
    "e-mail": "email",
    "play store": "playstore",
    "google play": "playstore",
    "app store": "playstore",
    "x": "twitter",
    "tweet": "twitter",
    "x (twitter)": "twitter",
}

_TS_FORMATS = (
    "%Y-%m-%d %H:%M",
    "%Y-%m-%dT%H:%M",
    "%d/%m/%Y %H:%M",
    "%d-%m-%Y %H:%M",
    "%Y/%m/%d %H:%M",
    "%Y-%m-%d",
)


def _canon_headers(fieldnames) -> dict[str, str]:
    """Map raw CSV headers to canonical keys via aliases (first match wins)."""
    mapping: dict[str, str] = {}
    for raw in fieldnames or []:
        norm = (raw or "").strip().lstrip("﻿").lower()
        for canon, aliases in FIELD_ALIASES.items():
            if norm == canon or norm in aliases:
                mapping.setdefault(canon, raw)
    return mapping


def _parse_ts(value: str):
    value = (value or "").strip()
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value)
        return timezone.make_aware(dt) if timezone.is_naive(dt) else dt
    except ValueError:
        pass
    for fmt in _TS_FORMATS:
        try:
            return timezone.make_aware(datetime.strptime(value, fmt))
        except ValueError:
            continue
    return None


def _normalize_record(raw: dict, warnings: list[str], line: int) -> dict | None:
    """One spreadsheet row -> one clean feedback row (None if unusable)."""
    body = (raw.get("body") or "").strip()
    if not body:
        warnings.append(f"row {line}: skipped — no message text")
        return None
    if len(body) > MAX_BODY:
        warnings.append(f"row {line}: message truncated to {MAX_BODY} chars")
        body = body[:MAX_BODY]

    raw_ts = (raw.get("ts") or "").strip()
    ts = _parse_ts(raw_ts)
    if ts is None:
        if raw_ts:
            warnings.append(f"row {line}: couldn't read timestamp '{raw_ts[:30]}' — stamped as now")
        ts = timezone.now()

    source = (raw.get("source") or "").strip().lower()[:24]
    source = SOURCE_ALIASES.get(source, source or "app_chat")

    star_raw = (raw.get("star_rating") or "").strip()
    star = None
    if star_raw:
        try:
            star = int(star_raw)
            if not 1 <= star <= 5:
                warnings.append(f"row {line}: star rating '{star_raw[:8]}' out of range — ignored")
                star = None
        except ValueError:
            warnings.append(f"row {line}: couldn't read star rating '{star_raw[:12]}' — ignored")

    return {
        "message_id": (raw.get("message_id") or "").strip()[:24],
        "ts": ts,
        "source": source,
        "rider": (raw.get("rider") or "").strip()[:64] or "Anonymous rider",
        "route": (raw.get("route") or "").strip()[:80],
        "star_rating": star,
        "body": body,
    }


def _finalize(records, warnings: list[str]):
    """Assign/dupe ids and cap the batch. records = [(raw_dict, line_no)]."""
    rows, seen, dropped = [], set(), 0
    for raw, line in records[:MAX_ROWS]:
        row = _normalize_record(raw, warnings, line)
        if row is None:
            dropped += 1
            continue
        mid = row["message_id"] or f"C-{line}"
        if mid in seen:
            base, n = mid, 2
            while mid in seen:
                mid = f"{base}-{n}"
                n += 1
            warnings.append(f"row {line}: duplicate id '{base}' — renamed '{mid}'")
        seen.add(mid)
        row["message_id"] = mid
        rows.append(row)
    if len(records) > MAX_ROWS:
        warnings.append(
            f"spreadsheet has {len(records)} rows — only the first {MAX_ROWS} were imported"
        )
    return rows, dropped


def parse_feedback_csv(text: str):
    """CSV text -> (rows, warnings, dropped).

    Raises ValueError only when the shape is unrecognizable at all
    (empty file, or no header that can act as the message column).
    """
    reader = csv.reader(io.StringIO(text), skipinitialspace=True)
    raw_lines = [ln for ln in reader if any(cell.strip() for cell in ln)]
    if not raw_lines:
        raise ValueError("empty spreadsheet — nothing to import")

    mapping = _canon_headers(raw_lines[0])
    if "body" not in mapping:
        raise ValueError(
            "couldn't find a message column. Expected a header row containing one of: "
            + ", ".join(FIELD_ALIASES["body"])
        )
    idx = {canon: raw_lines[0].index(raw_name) for canon, raw_name in mapping.items()}

    records = []
    extra_cell_rows = []
    for line, cells in enumerate(raw_lines[1:], start=2):
        if len(cells) > len(raw_lines[0]):
            extra_cell_rows.append(line)
        records.append(
            ({canon: (cells[i] if i < len(cells) else "") for canon, i in idx.items()}, line)
        )

    warnings: list[str] = []
    for line in extra_cell_rows[:5]:
        warnings.append(
            f"row {line}: more cells than the header — extra cells ignored "
            "(missing quotes around the message text?)"
        )
    if len(extra_cell_rows) > 5:
        warnings.append(f"…same issue on {len(extra_cell_rows) - 5} more rows")

    rows, dropped = _finalize(records, warnings)
    return rows, warnings, dropped