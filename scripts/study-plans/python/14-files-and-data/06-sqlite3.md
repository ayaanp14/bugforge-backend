---
title: sqlite3 — a SQL database in the standard library
minutes: 14
---
Every Python installation ships a complete relational database: `sqlite3` wraps SQLite, a single-file (or in-memory) SQL engine used by browsers, phones and most desktop applications. It is the right tool when data has relationships, needs querying by several criteria, must survive a process, or is too big for memory — and it is the fastest way to learn SQL, because there is nothing to install. This lesson covers connecting, creating tables, inserting with parameters (never string formatting), querying with `fetchone`/`fetchall`/iteration, transactions and `with`, `row_factory` for dict-like rows, aggregation with `GROUP BY` and a join, and the mapping between Python and SQL types.

## Connecting and creating

```python
import sqlite3

con = sqlite3.connect(":memory:")          # or a file path: "app.db"
con.execute("""
    CREATE TABLE items (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        price_cents INTEGER NOT NULL,
        category TEXT
    )
""")
```

`connect` opens (creating if absent) a database; `":memory:"` is a throwaway one for tests and judged programs. `execute` runs one statement; `executescript` runs several separated by semicolons (schema setup). `INTEGER PRIMARY KEY` auto-assigns ids. SQLite's column types are advisory (it stores what you give it), so keep money as integer cents and dates as ISO strings.

## Inserting with parameters

```python
con.execute("INSERT INTO items (name, price_cents, category) VALUES (?, ?, ?)", ("bolt", 5, "hardware"))
con.executemany(
    "INSERT INTO items (name, price_cents, category) VALUES (?, ?, ?)",
    [("nut", 2, "hardware"), ("glue", 300, "supplies")],
)
con.commit()
```

The `?` placeholders are filled by the driver, which quotes and escapes correctly. **Never** build SQL with f-strings or `%` from values — `f"... WHERE name = '{name}'"` is the SQL-injection bug, and it also breaks on any name containing a quote. Named placeholders (`:name`, with a dict) are the alternative style. `executemany` is the fast way to insert many rows; `cursor.lastrowid` gives the id just assigned.

## Querying

```python
cur = con.execute("SELECT name, price_cents FROM items WHERE category = ? ORDER BY name", ("hardware",))
cur.fetchone()                 # ('bolt', 5) — a tuple, or None
cur.fetchall()                 # the remaining rows as a list of tuples
for name, price in con.execute("SELECT name, price_cents FROM items ORDER BY price_cents DESC"):
    ...                        # iterate the cursor directly — the idiom
(count,) = con.execute("SELECT COUNT(*) FROM items").fetchone()
```

Rows are tuples in column order; iterate the cursor to stream, `fetchall` for a small result. Always add `ORDER BY` when the order matters — without it, SQL guarantees nothing, and a judged output must be deterministic.

## Dict-like rows

```python
con.row_factory = sqlite3.Row
row = con.execute("SELECT * FROM items WHERE name = ?", ("bolt",)).fetchone()
row["price_cents"], row[1], row.keys()          # by name, by index, the column names
dict(row)
```

`sqlite3.Row` gives name access with no per-row cost; set it on the connection once.

## Transactions

```python
with con:                                       # commits on success, rolls back on an exception
    con.execute("UPDATE items SET price_cents = price_cents * 2 WHERE category = ?", ("supplies",))
    con.execute("DELETE FROM items WHERE price_cents > ?", (10_000,))
```

The connection as a context manager wraps a transaction: every statement in the block is committed together or not at all. One subtlety: `sqlite3` opens a transaction implicitly on the first modifying statement, so a rollback undoes *everything since the last commit* — including statements executed before the `with` block that were never committed. Commit the work you want to keep before starting a block that may abort. Without `commit()` (or the `with`), changes to a file database are lost when the connection closes. `con.close()` at the end — or `contextlib.closing(sqlite3.connect(...))`, since the connection's own `with` does not close it.

## Aggregation and joins

```python
con.execute("CREATE TABLE sales (item_id INTEGER REFERENCES items(id), qty INTEGER)")
for category, total in con.execute("""
    SELECT i.category, SUM(s.qty * i.price_cents) AS revenue
    FROM sales AS s JOIN items AS i ON i.id = s.item_id
    GROUP BY i.category
    ORDER BY revenue DESC, i.category
"""):
    print(category, total)
```

`GROUP BY` with `SUM`/`COUNT`/`AVG`/`MIN`/`MAX`, `JOIN … ON`, `WHERE` before grouping and `HAVING` after, `ORDER BY` with tie-breakers, `LIMIT` — the core of SQL is small, and `sqlite3` is where to practise it. A query that would be three nested Python loops over lists is one statement, and the engine chooses the algorithm.

## Types

| Python | SQLite |
| --- | --- |
| `None` | `NULL` |
| `int` | `INTEGER` |
| `float` | `REAL` |
| `str` | `TEXT` |
| `bytes` | `BLOB` |

Booleans go in as 0/1, dates as ISO strings (`date.isoformat()` in, `date.fromisoformat` out), `Decimal` as text or integer cents. The module's automatic date adapters are deprecated in 3.12; convert explicitly.

## When sqlite3 is the answer

A script that accumulates results across runs; a dataset queried by several fields; a test that needs a real database; a desktop or mobile app's storage; a prototype before a server database. It is not for many concurrent writers or for a networked service — that is PostgreSQL or MySQL, reached through a driver with the same DB-API interface (`connect`, `execute`, `?` or `%s` placeholders), so what you learn here transfers.

## Pitfalls

- SQL built from values with f-strings.
- A missing `ORDER BY` on output.
- Forgetting `commit()`/`with con:` on a file database.
- Floats for money.
- `fetchall()` on a huge result when iterating would stream.
- Assuming SQLite enforces column types (it does not, unless the table is declared `STRICT`).

## Key takeaways

- `sqlite3.connect(":memory:" | path)`; `execute`/`executemany` with `?` parameters — never string-formatted SQL.
- Query with `execute(...)` and iterate, `fetchone`, `fetchall`; `ORDER BY` for determinism; `row_factory = sqlite3.Row` for name access.
- `with con:` is a transaction: commit on success, rollback on error; `close()` separately.
- `GROUP BY`, aggregates, `JOIN` and `HAVING` replace nested loops; the engine picks the plan.
- Types are advisory: ints for money, ISO strings for dates, `None` for NULL.
