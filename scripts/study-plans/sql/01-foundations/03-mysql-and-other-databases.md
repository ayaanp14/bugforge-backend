---
title: MySQL and its cousins — where the dialects differ
minutes: 14
seo-title: MySQL vs PostgreSQL vs SQLite vs SQL Server: SQL Dialects
description: MySQL, PostgreSQL, SQLite and SQL Server share standard SQL but differ in row limits, concatenation, quoting, auto-increment ids, NULL helpers and case rules.
question: What is the difference between MySQL and PostgreSQL?
answer: MySQL and PostgreSQL are both open-source relational database servers that speak standard SQL, but their dialects differ. MySQL concatenates with `CONCAT`, quotes names with backticks, numbers rows with `AUTO_INCREMENT` and compares text case-insensitively by default. PostgreSQL uses `||`, double quotes, identity columns and case-sensitive comparison, and is stricter about types. Core SELECT, joins and GROUP BY are the same.
q: How do you limit rows in MySQL, SQL Server and Oracle?
a: MySQL, PostgreSQL and SQLite write `LIMIT 10` at the end of the query. SQL Server writes `SELECT TOP 10 …` after SELECT, or `OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY` after ORDER BY. Oracle 12c and later, and the SQL standard, use `FETCH FIRST 10 ROWS ONLY`.
q: How do you concatenate strings in MySQL?
a: Use `CONCAT(a, b, …)`. In MySQL `||` means logical OR by default, so `'a' || 'b'` returns 0 rather than `'ab'`. PostgreSQL, SQLite and Oracle concatenate with `||`, and SQL Server uses `+` or `CONCAT`. `CONCAT` returns NULL if any argument is NULL in MySQL.
q: What is SQLite and how is it different from MySQL?
a: SQLite is an embedded database: a library linked into an application that keeps the whole database in one file, with no server process, users or network. MySQL is a client-server database for many concurrent users. SQLite also types columns loosely and has fewer built-in functions, but it reads most of the same SQL.
q: Which SQL dialect should I learn for interviews?
a: Learn one dialect well, usually MySQL or PostgreSQL, because interview questions mostly use standard SELECT, joins, GROUP BY, subqueries and window functions that both share. Then know the common differences: row limits, string concatenation, identifier quoting, auto-increment ids and NULL helper functions.
---
"Which database?" is usually answered before you arrive: the company already runs MySQL, or PostgreSQL, or SQL Server. The good news is that the SQL in this course — `SELECT`, `WHERE`, joins, `GROUP BY`, subqueries, window functions — reads almost the same on all of them. The bad news is the word *almost*. This lesson introduces the major systems, says why this course teaches MySQL 8, and walks through the differences that interviewers and real migrations run into.

## The family

| System | Kind | Typical home |
| --- | --- | --- |
| **MySQL** | open-source server (Oracle) | web applications, the LAMP stack, startups, many Indian product companies |
| **MariaDB** | fork of MySQL | Linux distributions, drop-in MySQL replacement |
| **PostgreSQL** | open-source server | modern web backends, analytics, GIS, anywhere strict types are valued |
| **SQLite** | embedded library, one file | phones, browsers, desktop apps, tests |
| **SQL Server** | commercial server (Microsoft) | enterprises on .NET and Windows |
| **Oracle Database** | commercial server | banks, telecoms, large enterprises |

All of them are **relational** and all speak **SQL**. The servers (MySQL, PostgreSQL, SQL Server, Oracle) run as their own process that applications connect to; SQLite is a library inside the application with the database in a single file — no users, no network, no setup.

## Why MySQL 8

Placement tests and interview rounds in India overwhelmingly write their SQL questions in MySQL, and most coding-practice sites judge SQL problems on it. MySQL 8 (2018 onward) added the features that modern questions need — **window functions** (`ROW_NUMBER`, `RANK`, `LAG`), **common table expressions** (`WITH`), recursive queries — so everything in this course is available there. Where PostgreSQL or SQL Server would be written differently and an interviewer might care, the lessons say so.

One note about this course itself: your exercises are judged in milliseconds by an engine that reads **MySQL syntax** and runs it on SQLite underneath. Write MySQL — `CONCAT`, `IFNULL`, `DATE_ADD(d, INTERVAL 1 DAY)`, `LIMIT` — and it is understood.

## Limiting rows

The most visible difference. To take the three most expensive products:

```sql
-- MySQL, PostgreSQL, SQLite
SELECT name, price FROM products ORDER BY price DESC LIMIT 3;

-- SQL Server
SELECT TOP 3 name, price FROM products ORDER BY price DESC;

-- Standard SQL, Oracle 12c+, PostgreSQL, SQL Server 2012+ (with OFFSET)
SELECT name, price FROM products ORDER BY price DESC
FETCH FIRST 3 ROWS ONLY;
```

`LIMIT` without `ORDER BY` returns *some* three rows — whichever the engine meets first. Always pair them.

## Joining strings

```sql
-- MySQL
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM employees;

-- PostgreSQL, SQLite, Oracle
SELECT first_name || ' ' || last_name AS full_name FROM employees;

-- SQL Server
SELECT first_name + ' ' + last_name AS full_name FROM employees;
```

The trap: in MySQL `||` is the **logical OR** operator (unless the server runs in `PIPES_AS_CONCAT` mode), so `'Asha' || 'Rao'` evaluates both strings as numbers and returns `0`. In MySQL, always use `CONCAT`. It returns `NULL` if any argument is `NULL`; `CONCAT_WS(' ', a, b)` ("with separator") skips NULLs.

## Quoting names

```sql
SELECT `order`, `full name` FROM `my table`;      -- MySQL: backticks
SELECT "order", "full name" FROM "my table";      -- standard, PostgreSQL, SQLite
SELECT [order], [full name] FROM [my table];      -- SQL Server (also accepts double quotes)
```

Better still, never need quoting: no spaces, no keywords as names.

## Auto-numbered ids

```sql
-- MySQL
CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(100));

-- PostgreSQL (modern)
CREATE TABLE users (id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, email TEXT);
-- PostgreSQL (older): id SERIAL PRIMARY KEY

-- SQL Server
CREATE TABLE users (id INT IDENTITY(1,1) PRIMARY KEY, email NVARCHAR(100));

-- SQLite
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT);
```

## NULL helpers and conditionals

| Need | MySQL | PostgreSQL | SQL Server | Oracle |
| --- | --- | --- | --- | --- |
| first non-NULL | `COALESCE`, `IFNULL` | `COALESCE` | `COALESCE`, `ISNULL` | `COALESCE`, `NVL` |
| inline if | `IF(c, a, b)`, `CASE` | `CASE` | `IIF(c, a, b)`, `CASE` | `CASE`, `DECODE` |

`COALESCE` and `CASE` are standard and work everywhere — prefer them when portability matters.

## Dates

Date arithmetic is the least portable corner of SQL:

```sql
-- MySQL
SELECT DATE_ADD('2024-03-01', INTERVAL 7 DAY), DATEDIFF('2024-03-08', '2024-03-01');
-- PostgreSQL
SELECT DATE '2024-03-01' + INTERVAL '7 days', DATE '2024-03-08' - DATE '2024-03-01';
-- SQL Server
SELECT DATEADD(day, 7, '2024-03-01'), DATEDIFF(day, '2024-03-01', '2024-03-08');
```

Note that SQL Server's `DATEDIFF` takes the unit first and the dates in the opposite order to MySQL's.

## Case and comparison

MySQL's default collation (`utf8mb4_0900_ai_ci` in MySQL 8) is **case- and accent-insensitive**: `'Pune' = 'pune'` is true, and so is `'café' = 'cafe'`. PostgreSQL and SQLite compare text **case-sensitively** by default, so the same `WHERE` returns different rows. A query moved between them can quietly change its answer — normalise case with `LOWER()` when it matters.

## Types and strictness

MySQL historically converted bad input instead of refusing it — `'12abc'` into an `INT` column became 12 with a warning. Since 5.7 the default **strict mode** refuses such inserts, but comparisons still convert: `WHERE id = '7'` works. PostgreSQL refuses to compare an integer with text without a cast. SQLite goes the other way: a column's type is only a preference, and it will store text in an `INT` column. MySQL has no real boolean type — `BOOLEAN` is `TINYINT(1)`, and `TRUE` is `1` — while PostgreSQL has a true `boolean`.

## What is the same

Everything the next fifteen modules spend most of their time on:

```sql
SELECT c.name, COUNT(*) AS orders, SUM(o.amount) AS spent
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
WHERE o.amount > 0
GROUP BY c.name
HAVING COUNT(*) >= 2
ORDER BY spent DESC;
```

That query runs unchanged on MySQL, PostgreSQL, SQLite, SQL Server and Oracle. Joins, grouping, subqueries, CTEs, window functions, `CASE`, `COALESCE`, `IN`, `BETWEEN`, `LIKE`, `UNION` — the core is the standard, and the standard is most of SQL.

## Key takeaways

- MySQL, PostgreSQL, SQL Server and Oracle are **servers**; SQLite is an **embedded** one-file library. All speak SQL.
- This course writes **MySQL 8**: window functions and CTEs included.
- Row limits: `LIMIT` (MySQL/PostgreSQL/SQLite), `TOP` (SQL Server), `FETCH FIRST` (standard/Oracle).
- Concatenate with `CONCAT` in MySQL — `||` is OR there.
- Quote names with backticks in MySQL, double quotes in the standard; auto ids are `AUTO_INCREMENT`, `IDENTITY` or `SERIAL`.
- MySQL compares text case-insensitively by default; PostgreSQL and SQLite do not.
- Prefer standard forms (`COALESCE`, `CASE`) when the query must travel.
