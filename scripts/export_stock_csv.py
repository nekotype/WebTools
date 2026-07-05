#!/usr/bin/env python3
"""Export stock closes for the app's target dates as CSV.

Usage:
  python3 scripts/export_stock_csv.py 7203
  python3 scripts/export_stock_csv.py 7203 -o 7203.csv
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

STOCK_DATES = [
    "2010-12-01",
    "2011-12-01",
    "2012-12-03",
    "2013-12-02",
    "2014-12-01",
    "2015-12-01",
    "2016-12-01",
    "2017-12-01",
    "2018-12-03",
    "2019-12-02",
    "2020-12-01",
    "2021-12-01",
    "2022-12-01",
    "2023-12-01",
    "2024-12-02",
    "2025-12-01",
]

DATE_ROW_RE = re.compile(
    r"(?P<no>\d+)\s+"
    r"(?P<day>\d{1,2})\s+"
    r"(?P<month>[A-Za-z]{3})\s+"
    r"(?P<year>\d{4})\s+"
    r"(?P<open>[\d.,]+)\s+"
    r"(?P<high>[\d.,]+)\s+"
    r"(?P<low>[\d.,]+)\s+"
    r"(?P<close>[\d.,]+)"
)
CODE_RE = re.compile(r"^(?:\d{4}|\d{3}[A-Z]|\d{4}[A-Z])$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export Web Tools stock prices to CSV.")
    parser.add_argument("code", help="Stock code such as 7203 or 285A")
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output CSV path. Defaults to stock-<code>.csv in the current directory.",
    )
    return parser.parse_args()


def normalize_code(value: str) -> str:
    normalized = re.sub(r"[^0-9A-Z]", "", value.strip().upper())
    return normalized if CODE_RE.match(normalized) else ""


def build_csv_rows(code: str) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []

    for iso_date in STOCK_DATES:
        close = fetch_stock_close(code, iso_date)
        rows.append((format_japanese_date(iso_date), close or "データなし"))

    return rows


def fetch_stock_close(code: str, target_date: str) -> str:
    history = fetch_stock_history(code, target_date)
    return history.get(target_date, "")


def fetch_stock_history(code: str, target_date: str) -> dict[str, str]:
    symbol = f"{code.lower()}.jp"
    compact_date = target_date.replace("-", "")
    url = f"https://r.jina.ai/http://stooq.com/q/d/?s={symbol}&i=d&f={compact_date}&t={compact_date}"
    last_error: Exception | None = None

    for attempt in range(3):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "Accept": "text/plain",
                    "User-Agent": "Mozilla/5.0",
                },
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                raw_text = response.read().decode("utf-8", "replace")
            if "No data for " in raw_text:
                raise RuntimeError(f"No stock data available for {code}")
            return parse_stooq_history(raw_text)
        except (urllib.error.URLError, RuntimeError, TimeoutError) as error:
            last_error = error
            if attempt < 2:
                time.sleep(0.3 * (attempt + 1))

    raise RuntimeError(f"Failed to fetch stock history for {code}") from last_error


def parse_stooq_history(raw_text: str) -> dict[str, str]:
    history: dict[str, str] = {}

    for match in DATE_ROW_RE.finditer(raw_text):
        month = month_name_to_number(match.group("month"))
        iso_date = f"{match.group('year')}-{month}-{match.group('day').zfill(2)}"
        close = match.group("close")
        if close and close != "0":
            history[iso_date] = close

    if not history:
        raise RuntimeError("Historical price rows were not found")

    return history


def format_japanese_date(iso_date: str) -> str:
    year, month, day = iso_date.split("-")
    return f"{year}年{month}月{day}日"


def month_name_to_number(value: str) -> str:
    month_map = {
        "Jan": "01",
        "Feb": "02",
        "Mar": "03",
        "Apr": "04",
        "May": "05",
        "Jun": "06",
        "Jul": "07",
        "Aug": "08",
        "Sep": "09",
        "Oct": "10",
        "Nov": "11",
        "Dec": "12",
    }

    month = month_map.get(value)
    if month is None:
        raise RuntimeError(f"Unexpected month: {value}")
    return month


def write_csv(rows: list[tuple[str, str]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["日付", "終値"])
        writer.writerows(rows)


def main() -> int:
    args = parse_args()
    code = normalize_code(args.code)
    if not code:
        print("Enter a valid stock code such as 7203 or 285A.", file=sys.stderr)
        return 1

    output_path = Path(args.output) if args.output else Path(f"stock-{code}.csv")
    rows = build_csv_rows(code)
    write_csv(rows, output_path)
    print(output_path.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
