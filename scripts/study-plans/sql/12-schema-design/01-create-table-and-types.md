---
title: CREATE TABLE and data types
minutes: 15
seo-title: MySQL CREATE TABLE and Data Types: INT, VARCHAR, DECIMAL, DATE
description: How to create a MySQL table and choose column types: integers, DECIMAL vs FLOAT for money, CHAR vs VARCHAR vs TEXT, DATE vs DATETIME vs TIMESTAMP, and BOOLEAN.
question: How do you create a table in MySQL?
answer: Use `CREATE TABLE name (column type [constraints], ...);`, giving every column a name and a data type such as INT, VARCHAR(100), DECIMAL(10,2) or DATE, plus optional NOT NULL, DEFAULT and a PRIMARY KEY. `CREATE TABLE IF NOT EXISTS` skips the statement when the table is already there, and `CREATE TABLE ... AS SELECT` builds and fills a table from a query.
q: Should I use DECIMAL or FLOAT for money?
a: DECIMAL. `DECIMAL(10,2)` stores exact decimal digits, so 0.10 + 0.20 is exactly 0.30 and totals reconcile to the paisa. FLOAT and DOUBLE are binary approximations that cannot represent most decimal fractions, so sums drift by tiny amounts. Use FLOAT or DOUBLE only for measurements where approximation is acceptable.
q: What is the difference between CHAR and VARCHAR in MySQL?
a: CHAR(n) is fixed length: values are padded with spaces to n characters and the trailing spaces are removed when read. VARCHAR(n) stores only the characters given plus a one or two byte length prefix. Use CHAR for codes that are always the same length, such as a two-letter country code, and VARCHAR for everything else.
q: What is the difference between DATETIME and TIMESTAMP in MySQL?
a: DATETIME stores the date and time exactly as written, with no time zone, from year 1000 to 9999. TIMESTAMP is stored in UTC and converted to and from the session's time zone, and its range ends in January 2038. Use DATETIME for business times such as an appointment and TIMESTAMP for row creation times.
q: Does MySQL have a BOOLEAN type?
a: Not a real one. BOOLEAN and BOOL are synonyms for TINYINT(1), so TRUE is stored as 1 and FALSE as 0, and the column will accept other small integers such as 2. PostgreSQL has a true BOOLEAN type that only holds true, false or NULL.
---
The schema-design module moves from using tables to building them. This first lesson is the `CREATE TABLE` statement and the decision every column forces: its **data type**. A type decides what values a column accepts, how much space they take, how they compare and sort, and which mistakes the database catches for you. Picking well is cheap at design time and expensive to change later, when the table holds a hundred million rows. The lesson covers the syntax, MySQL's integer, decimal, string, date and boolean types with the choices interviewers ask about, AUTO_INCREMENT, and creating a table from a query.

## The statement

```sql
CREATE TABLE customers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  full_name   VARCHAR(100) NOT NULL,
  country     CHAR(2)      NOT NULL DEFAULT 'IN',
  credit      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  born_on     DATE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Each column is a name, a type and optional modifiers: `NOT NULL`, `DEFAULT value`, `PRIMARY KEY`, `UNIQUE`, `AUTO_INCREMENT`, `CHECK (...)`. Table-level constraints (a composite primary key, a foreign key) go after the columns. Conventions that pay off: lowercase `snake_case` names, singular or plural tables but consistently, `id` for the surrogate key and `<table>_id` for references to it, dates named `..._on` or `..._at`.

Two variants you will use constantly:

```sql
CREATE TABLE IF NOT EXISTS customers (...);   -- no error if it already exists
DROP TABLE IF EXISTS customers;               -- no error if it does not
```

In MySQL a table also has a storage engine (`ENGINE=InnoDB`, the default, with transactions and foreign keys) and a character set (`DEFAULT CHARSET=utf8mb4`, the default since 8.0, which stores any Unicode including emoji). You see them in `SHOW CREATE TABLE` output; you rarely need to write them.

## Integers

| Type | Bytes | Signed range |
| --- | --- | --- |
| `TINYINT` | 1 | −128 … 127 |
| `SMALLINT` | 2 | −32,768 … 32,767 |
| `INT` | 4 | about ±2.1 billion |
| `BIGINT` | 8 | about ±9.2 × 10^18 |

`UNSIGNED` doubles the positive range and forbids negatives (`INT UNSIGNED` reaches about 4.29 billion). Choose the smallest type that will comfortably hold the values for the life of the table — but for ids of tables that grow without limit (events, logs, orders on a large site) choose `BIGINT`: running out of `INT` ids is a real outage, and widening the column on a huge table is a long migration. The number in `INT(11)` is a display width, deprecated and meaningless for storage; ignore it.

## Exact and approximate numbers

```sql
price     DECIMAL(10,2)   -- up to 99,999,999.99, exact
latitude  DOUBLE          -- approximate, 15–17 significant digits
```

`DECIMAL(p, s)` (also `NUMERIC`) stores exactly `p` digits, `s` of them after the point. It is the type for **money** and anything else that must add up exactly. `FLOAT` and `DOUBLE` are binary floating point: fast and compact, but 0.1 has no exact binary form, so `0.1 + 0.2` is `0.30000000000000004` and a column of prices summed in DOUBLE will not reconcile. Use them for measurements and scientific values. The interview answer: money is `DECIMAL`, never `FLOAT`. (A common alternative is storing integer paise or cents in a `BIGINT`.)

## Strings

| Type | Use |
| --- | --- |
| `CHAR(n)` | fixed length, padded: country codes, fixed-format codes |
| `VARCHAR(n)` | variable length up to n characters: names, emails, titles |
| `TEXT` (and `MEDIUMTEXT`, `LONGTEXT`) | long text: descriptions, comments, articles |

`n` counts **characters**, not bytes, so `VARCHAR(100)` in utf8mb4 may take up to 400 bytes. `CHAR` pads with spaces and strips them on read. `TEXT` columns live partly off the row, cannot take a plain `DEFAULT` before 8.0.13 and can be indexed only by a prefix, so prefer `VARCHAR` for anything you will filter, sort or join on. Pick limits that reflect real rules — an email address is at most 254 characters, so `VARCHAR(255)` is the classic choice. In strict mode MySQL rejects a string longer than the column; non-strict mode silently truncates, one reason strict mode is the default.

Comparison and sorting of strings follow the column's **collation**. MySQL's default (`utf8mb4_0900_ai_ci`) is case- and accent-insensitive, so `'ADA' = 'ada'` is true and a UNIQUE email column rejects both. PostgreSQL compares case-sensitively by default — a classic surprise when moving an application.

## Dates and times

| Type | Holds | Notes |
| --- | --- | --- |
| `DATE` | `'2024-05-02'` | a calendar day |
| `TIME` | `'14:30:00'` | a time of day or a duration |
| `DATETIME` | `'2024-05-02 14:30:00'` | as written, no time zone, years 1000–9999 |
| `TIMESTAMP` | same shape | stored in UTC, converted per session time zone, ends 2038-01-19 |
| `YEAR` | `2024` | a year |

Use `DATE` when there is no time (birthdays, due dates) — not a string, so comparisons, ranges and date functions work. Between `DATETIME` and `TIMESTAMP`: `TIMESTAMP` is convenient for "when was this row written" because it converts time zones and can default to `CURRENT_TIMESTAMP` and update itself with `ON UPDATE CURRENT_TIMESTAMP`; `DATETIME` suits times that mean a wall-clock value (a meeting at 10:00 in Mumbai) and dates past 2038. Many teams store everything in UTC `DATETIME` and convert in the application. Both accept fractional seconds, `DATETIME(3)` for milliseconds.

## Booleans, ENUM and JSON

MySQL has no true boolean type. `BOOLEAN` is an alias for `TINYINT(1)`; `TRUE` and `FALSE` are 1 and 0, and nothing stops a 2 from being stored. Name boolean columns as questions (`is_active`, `has_paid`).

`ENUM('draft', 'published', 'archived')` stores one of a fixed list of strings compactly. It reads well, but adding a value means an `ALTER TABLE`, the values sort by their position in the list rather than alphabetically, and it is MySQL-specific; a small lookup table or a `VARCHAR` with a `CHECK` constraint is the portable alternative. `JSON` stores validated JSON documents with functions to query them — useful for genuinely variable attributes, a smell when used to avoid designing columns.

## AUTO_INCREMENT

```sql
id INT AUTO_INCREMENT PRIMARY KEY
```

An `AUTO_INCREMENT` column must be a key, and there is at most one per table. InnoDB hands out increasing numbers, never reuses one, and leaves gaps after rollbacks and deletes. PostgreSQL uses `GENERATED ALWAYS AS IDENTITY` (or the older `SERIAL`); SQL Server uses `IDENTITY(1,1)`. Write the modifiers in the order shown above — `INT AUTO_INCREMENT PRIMARY KEY` — which is also the form the practice engine recognises.

## Creating a table from a query

```sql
CREATE TABLE daily_totals AS
SELECT sale_date, COUNT(*) AS orders, SUM(amount) AS revenue
FROM sales
GROUP BY sale_date;
```

`CREATE TABLE ... AS SELECT` (CTAS) creates a table whose columns are the query's columns, named by their aliases, and fills it with the result. It copies **no** primary key, indexes, defaults or foreign keys, so it suits snapshots, reports and scratch tables. `CREATE TABLE new_t LIKE old_t` does the opposite: copies the structure with its indexes, and no rows.

## Key takeaways

- `CREATE TABLE t (col TYPE modifiers, ...)`; `IF NOT EXISTS` / `DROP TABLE IF EXISTS` for re-runnable scripts.
- Smallest integer that fits for life; `BIGINT` for ids that grow without limit.
- Money in `DECIMAL(p, s)`, never `FLOAT`/`DOUBLE`.
- `VARCHAR(n)` for most text, `CHAR(n)` for fixed codes, `TEXT` for long content; collation decides case sensitivity.
- `DATE` for days, `DATETIME` for wall-clock times, `TIMESTAMP` (UTC, ends 2038) for row times.
- `BOOLEAN` is `TINYINT(1)`; `ENUM` and `JSON` exist but have costs.
- CTAS copies data and column types, not keys or indexes.
