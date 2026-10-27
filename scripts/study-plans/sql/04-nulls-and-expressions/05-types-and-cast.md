---
title: Data types, implicit conversion and CAST
minutes: 15
seo-title: SQL CAST and CONVERT in MySQL: Data Types and Type Conversion
description: MySQL data types for numbers, text and dates, how implicit conversion compares strings and numbers, DIV versus decimal division, and CAST and CONVERT.
question: How do you convert a data type in SQL?
answer: Use `CAST(expression AS type)`, the standard form, or MySQL's `CONVERT(expression, type)`. In MySQL the target types include `SIGNED` and `UNSIGNED` for integers, `DECIMAL(p, s)`, `CHAR`, `DATE`, `DATETIME` and `DOUBLE`. `CAST('42' AS SIGNED)` turns text into the number 42, so it sorts and compares as a number instead of as a string.
q: What is the difference between CAST and CONVERT in MySQL?
a: For changing a type they do the same job: `CAST(x AS SIGNED)` and `CONVERT(x, SIGNED)` give the same result. CAST is standard SQL and portable; CONVERT is MySQL's own spelling and also has a `CONVERT(x USING utf8mb4)` form for changing a string's character set. SQL Server's CONVERT takes its arguments in the opposite order.
q: Why do numbers stored as text sort wrongly in SQL?
a: Text sorts character by character, so `'10'` comes before `'9'` because `'1'` is less than `'9'`. Sort on the numeric value instead with `ORDER BY CAST(code AS SIGNED)`, or better, store numbers in a numeric column so the problem never arises.
q: Does dividing two integers in MySQL give an integer?
a: No. MySQL's `/` always returns a decimal, so `7 / 2` is `3.5000`, shown to four decimal places by default. For integer division use `DIV`: `7 DIV 2` is 3. PostgreSQL, SQL Server and SQLite truncate `7 / 2` to 3 when both operands are integers, a frequent cause of wrong averages.
q: What is the difference between DECIMAL and FLOAT in MySQL?
a: DECIMAL stores exact decimal numbers with a fixed precision and scale, so `DECIMAL(10,2)` holds money to the paisa or cent with no rounding error. FLOAT and DOUBLE are binary floating point: fast and wide-ranging, but `0.1 + 0.2` is not exactly `0.3`. Use DECIMAL for money and quantities that must add up exactly.
---
Every value in SQL has a type: an integer, an exact decimal, a string, a date. Most of the time you do not think about it, because the database converts between types for you — compare a number column with `'100'` and MySQL quietly treats the string as a number. Those quiet conversions are where surprises live: numbers stored as text sort as text, `'abc' = 0` is true in MySQL, `7 / 2` gives `3.5` in MySQL but `3` in PostgreSQL. This lesson covers the main MySQL types, the rules of implicit conversion, integer and decimal arithmetic, and explicit conversion with `CAST` and `CONVERT`. Choosing types for a new table is covered in the schema-design module; here the focus is what happens to values inside a query.

## The main MySQL types

| Family | Types | Notes |
| --- | --- | --- |
| Integer | `TINYINT`, `SMALLINT`, `INT`, `BIGINT` | `INT` is 32-bit (±2.1 billion); `BIGINT` for ids that can grow past that |
| Exact decimal | `DECIMAL(p, s)` | `p` digits in all, `s` after the point: `DECIMAL(10,2)` holds up to 99,999,999.99 |
| Floating point | `FLOAT`, `DOUBLE` | Approximate binary fractions |
| Text | `CHAR(n)`, `VARCHAR(n)`, `TEXT` | `CHAR` pads to a fixed length, `VARCHAR` stores what it is given |
| Date and time | `DATE`, `DATETIME`, `TIMESTAMP`, `TIME` | Literals are written `'2024-05-03'` and `'2024-05-03 14:30:00'` |
| Boolean | `BOOLEAN` | An alias for `TINYINT(1)`: `TRUE` is 1, `FALSE` is 0 |

That last row explains something you have already used: in MySQL a comparison like `price > 100` *is* a number, 1 or 0, which is why it can be selected, summed and sorted on.

## DECIMAL versus FLOAT

Floating-point types store binary fractions, and most decimal fractions have no exact binary form — the same reason `0.1 + 0.2` is not exactly `0.3` in JavaScript or Python. MySQL's `DOUBLE` arithmetic carries the same tiny errors, and summing thousands of such values drifts. `DECIMAL` stores decimal digits exactly. The rule is simple and interviewers expect it: **money and anything that must add up exactly goes in `DECIMAL`**; `FLOAT`/`DOUBLE` are for measurements where a tiny relative error is fine.

## Arithmetic: `/` and DIV

MySQL's division operator always produces a decimal result:

```sql
SELECT 7 / 2    AS a,   -- 3.5000
       6 / 3    AS b,   -- 2.0000
       7 DIV 2  AS c,   -- 3   (integer division, truncated toward zero)
       7 % 2    AS d,   -- 1   (remainder; MOD(7, 2) is the same)
       -7 DIV 2 AS e;   -- -3
```

MySQL shows four decimal places for `/` by default (`div_precision_increment`). For integer division use `DIV`, and for the remainder `%` or `MOD()`. Division by zero gives NULL in a MySQL SELECT, as the previous lesson noted.

Other databases differ in exactly the place that causes bugs: in **PostgreSQL, SQL Server and SQLite, an integer divided by an integer is an integer**. `7 / 2` is `3` there, and `SUM(passed) / COUNT(*)` is `0` for any pass rate below 100%. The portable fix is to make one side non-integer — `SUM(passed) * 1.0 / COUNT(*)` or a `CAST(… AS DECIMAL(10,4))` — which is harmless in MySQL and correct everywhere.

## Implicit conversion

When an operator gets two different types, MySQL converts one of them. The rules worth knowing:

- **Arithmetic converts strings to numbers.** `'10' + 5` is `15`. A string that does not start with a number becomes `0` (`'abc' + 1` is `1`), and one with a numeric prefix keeps the prefix (`'12abc' + 0` is `12`), each with a warning.
- **A comparison between a string and a number compares numerically.** `'10' = 10` is true, `'abc' = 0` is true, and `'1e1' = 10` is true. This is MySQL-specific — PostgreSQL refuses to compare text with an integer without a cast, and SQLite compares a literal number with literal text by type (any number is less than any text).
- **A comparison between two strings compares as strings**, by collation: `'10' < '9'` is true.
- **Dates compare correctly with `'YYYY-MM-DD'` strings**, because MySQL converts the string to a date: `WHERE order_date >= '2024-01-01'` is the normal way to write a date filter.

Implicit conversion is convenient in quick queries and risky in real ones. Comparing an indexed `VARCHAR` column with a number, for example `WHERE phone = 9876543210`, forces MySQL to convert every phone to a number, which defeats the index and matches `'09876543210'` too. Match the column's type in your literals: `WHERE phone = '9876543210'`.

## CAST and CONVERT

When you need a conversion, say so. The standard form is `CAST(expr AS type)`; MySQL also accepts `CONVERT(expr, type)`:

```sql
SELECT CAST('42' AS SIGNED)          AS n,    -- 42
       CAST('007' AS UNSIGNED)       AS m,    -- 7
       CAST(42 AS CHAR)              AS s,    -- '42'
       CAST('2024-05-03' AS DATE)    AS d,    -- 2024-05-03
       CAST(1234.5678 AS DECIMAL(6,2)) AS x,  -- 1234.57
       CONVERT('15', SIGNED)         AS y;    -- 15
```

MySQL's integer target types are `SIGNED` and `UNSIGNED` (optionally followed by `INTEGER`) — `CAST(x AS INT)`, which PostgreSQL and SQL Server accept, is a syntax error in MySQL. Other targets: `DECIMAL(p, s)`, `CHAR` or `CHAR(n)`, `DATE`, `DATETIME`, `TIME`, `DOUBLE`, `FLOAT` and `JSON`. You cannot cast to `VARCHAR` in MySQL — use `CHAR`.

Some details differ by database and appear in quizzes. Casting a fractional number to an integer **rounds** in MySQL (`CAST(3.7 AS SIGNED)` is 4), while SQLite and `int()`-style conversions in programming languages **truncate**; casting the *string* `'3.7'` in MySQL keeps only the integer prefix, 3. SQL Server's `CONVERT(type, expr)` takes its arguments in the opposite order to MySQL's, and adds a style number for date formats.

## The everyday uses

**Sorting numbers stored as text.** Ticket codes, house numbers and imported spreadsheet columns often arrive as `VARCHAR`. Sort them by value:

```sql
SELECT code
FROM tickets
ORDER BY CAST(code AS UNSIGNED), id;
```

**Forcing decimal division** in code that must run on several databases: `CAST(passed AS DECIMAL(10,4)) / total`.

**Comparing a text column numerically**, when you cannot change the schema: `WHERE CAST(zip AS UNSIGNED) BETWEEN 400001 AND 400099`. It works, but it cannot use an index on `zip` — the real fix is the right column type.

## Before you move on

- `DECIMAL` is exact; `FLOAT`/`DOUBLE` are approximate — money goes in `DECIMAL`.
- MySQL's `/` is decimal division; `DIV` is integer division, `%`/`MOD` the remainder; other databases truncate `int / int`.
- MySQL converts strings to numbers in arithmetic and in string-to-number comparisons; two strings compare as text.
- `CAST(x AS SIGNED | UNSIGNED | DECIMAL(p,s) | CHAR | DATE)`; MySQL also has `CONVERT(x, type)`.
- Match literal types to column types to avoid silent conversions.
