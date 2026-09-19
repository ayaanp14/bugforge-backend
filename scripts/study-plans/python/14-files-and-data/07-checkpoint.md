---
title: Checkpoint — Files and data formats
minutes: 25
---
This checkpoint covers the whole module: `open` with modes, encodings and `with`, line iteration and buffered writes, `pathlib` for building, querying and listing paths, CSV with `DictReader`/`DictWriter` and the quoting rules, JSON with custom encoders, decoders and dataclass round trips, bytes with `struct`, byte order, `base64` and `hashlib`, and `sqlite3` with parameters, transactions and aggregation.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why state `encoding="utf-8"` on every text `open`, and what does `"w"` do to an existing file?
- What is `Path("a") / "b.tar.gz"` `.suffix`, and how do you get both suffixes?
- Why does `csv` need `newline=""`, and what type is every field it reads?
- How do you serialise a `date` or a `set` with `json.dumps`?
- What does `struct.pack("<I", 1)` produce, and what would `">I"` give?
- Why must SQL never be built with an f-string, and what does `with con:` guarantee?
- Why add `ORDER BY` to a query whose output is printed?

The three programs are a CSV-to-JSON converter that writes a file and reads it back, a binary record store written with `struct` and verified with a SHA-256 digest, and an in-memory `sqlite3` report built from lines of input with a grouped, ordered query.
