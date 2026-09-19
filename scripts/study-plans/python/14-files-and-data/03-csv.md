---
title: CSV — reader, writer, DictReader and the quoting rules
minutes: 13
---
Comma-separated values look simple enough to split by hand, and every hand-written CSV parser breaks on the first field that contains a comma, a quote or a newline. The `csv` module handles the quoting rules, the dialects (tab-separated, semicolons, Excel's conventions) and the line-ending trap, and its `DictReader`/`DictWriter` map rows to dictionaries keyed by the header. This lesson covers reading rows as lists and as dicts, writing with the correct `newline=""`, delimiters and quoting, computing over columns with the right conversions, reading from stdin and strings, and the cases CSV cannot represent.

## Reading

```python
import csv

with open("sales.csv", newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    header = next(reader)                       # the first row, as a list of strings
    for row in reader:                          # each row: a list of strings
        name, qty, price = row
```

Every field is a *string* — `"3"` and `"2.50"` must be converted. `newline=""` on open is required by the module: it leaves line endings to `csv`, which knows that a quoted field may contain one. The reader handles `"a, b"` (a quoted field with a comma), `"say ""hi"""` (a doubled quote inside a quoted field), and empty fields.

## DictReader and DictWriter

```python
with open("sales.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):               # header row → keys
        total += int(row["qty"]) * float(row["price"])

with open("out.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "total"])
    writer.writeheader()
    writer.writerow({"name": "ada", "total": 12.5})
    writer.writerows(rows)                     # an iterable of dicts
```

`DictReader` takes the first row as field names (or `fieldnames=` when the file has no header) and yields one dict per row in file order; missing trailing fields are `None`, extra ones go under `restkey`. `DictWriter` needs `fieldnames` to fix the column order and raises on a dict with an unknown key (`extrasaction="ignore"` to drop). Rows by name survive column reordering; rows by position do not.

## Writing

```python
with open("out.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "note"])
    writer.writerow(["ada", "says, \"hi\""])   # quoted and escaped automatically: "says, ""hi"""
```

The writer quotes only fields that need it (`QUOTE_MINIMAL`); `quoting=csv.QUOTE_ALL` quotes everything, `QUOTE_NONNUMERIC` quotes strings and leaves numbers bare (and makes the *reader* convert unquoted fields to floats). Values are converted with `str()`, so `None` becomes an empty string.

## Delimiters and dialects

```python
csv.reader(f, delimiter="\t")                   # TSV
csv.reader(f, delimiter=";")                    # European Excel
csv.reader(f, dialect="excel-tab")
csv.Sniffer().sniff(sample).delimiter           # guess from a sample
```

A dialect bundles delimiter, quote character, escaping and line terminator; `excel` is the default and matches what spreadsheets produce. When a file has a header you know, prefer stating the delimiter to sniffing it.

## From stdin and from strings

```python
import sys
for row in csv.reader(sys.stdin):               # stdin is a file object; no newline= needed for reading
    ...

import io
rows = list(csv.reader(io.StringIO("a,b\n1,2\n")))      # [['a', 'b'], ['1', '2']]
text = "x,y\n"
csv.reader(text.splitlines())                             # any iterable of lines works
```

The reader accepts any iterable of strings, which is what makes it testable with a list and usable on the judge with `sys.stdin`.

## Computing over columns

```python
from collections import defaultdict
totals = defaultdict(float)
for row in csv.DictReader(f):
    totals[row["region"]] += int(row["qty"]) * float(row["price"])
for region in sorted(totals):
    print(f"{region},{totals[region]:.2f}")
```

Convert at the edge (`int`, `float`, `Decimal` for money, `date.fromisoformat` for dates), validate with `try`/`except ValueError` per row (Module 5), aggregate with the collections of Module 7, and format the output with fixed decimals. A CSV of a few hundred thousand rows is fine to stream this way; larger analyses move to `pandas`, which reads the same files with `read_csv`.

## Headers that vary

Real files arrive with columns in different orders, with extra columns, or with a header that differs in case or spacing from what the code expects. `DictReader` absorbs order changes; for the rest, normalise the header once — `reader.fieldnames = [h.strip().lower() for h in reader.fieldnames]` — and check that the required names are present before the loop, raising a clear error naming the missing column. A row count and a bad-row count printed at the end turn a silent partial import into a visible one.

## What CSV cannot do

There is no type information — everything is text until you convert it; there is no standard for dates, booleans or nulls (an empty field could be any of them); nested data does not fit; and encodings are unspecified (a file from Excel may be Windows-1252 or UTF-8 with a byte-order mark — `encoding="utf-8-sig"` strips the mark). For structured, typed or nested data, JSON (next lesson) is the better exchange format; CSV's strength is that every spreadsheet and database can produce and consume it.

## Pitfalls

- Splitting on commas by hand.
- Forgetting `newline=""` on the file used for writing (blank lines between rows on Windows).
- Treating fields as numbers without converting.
- A `DictWriter` without `fieldnames`, or with a row containing an unexpected key.
- Reading an Excel export as `utf-8` and getting `﻿` in the first header.
- Assuming an empty field means zero.

## Key takeaways

- `csv.reader`/`writer` for rows as lists, `DictReader`/`DictWriter` for rows as dicts keyed by the header.
- Open with `newline=""` and an encoding; every field read is a string — convert at the edge.
- The writer quotes and escapes for you; `delimiter=` and dialects handle TSV and semicolons.
- The reader takes any iterable of lines: files, `sys.stdin`, `StringIO`, lists.
- CSV carries no types or nesting; JSON for structured data, `pandas` for large analyses.
