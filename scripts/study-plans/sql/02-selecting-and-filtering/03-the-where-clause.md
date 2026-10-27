---
title: The WHERE clause — keeping the rows you want
minutes: 14
seo-title: SQL WHERE Clause: Comparison Operators and Filtering Rows
description: The SQL WHERE clause keeps only rows whose condition is true. Comparison operators on numbers, text and dates, why NULL rows never match, and filtering early.
question: What does the WHERE clause do in SQL?
answer: The WHERE clause filters rows: it tests a condition against every row produced by FROM and keeps only the rows for which the condition is true. Rows where it is false or unknown (NULL) are dropped. It uses comparison operators such as `=`, `<>`, `<`, `>=` on numbers, text and dates, and is written after FROM and before GROUP BY and ORDER BY.
q: What is the difference between != and <> in SQL?
a: None in MySQL, PostgreSQL, SQL Server or SQLite: both mean not equal. `<>` is the SQL standard spelling and `!=` is a widely supported alternative. Neither matches NULL, so `WHERE status <> 'paid'` skips rows whose status is NULL.
q: Why does WHERE column = NULL return no rows?
a: Because any comparison with NULL gives NULL (unknown), not true, and WHERE keeps only rows where the condition is true. Test for a missing value with `IS NULL`, as in `WHERE manager_id IS NULL`, and for a present one with `IS NOT NULL`.
q: How do you filter by date in a MySQL WHERE clause?
a: Compare the date column with a date literal written as a `'YYYY-MM-DD'` string: `WHERE order_date >= '2024-03-01'`. MySQL converts the string to a date for the comparison. For a whole day on a DATETIME column, use a half-open range: `>= '2024-03-01' AND < '2024-03-02'`.
q: Is the WHERE clause case sensitive in MySQL?
a: For text comparisons it depends on the column's collation, and MySQL's default collations are case-insensitive, so `WHERE city = 'pune'` matches 'Pune'. PostgreSQL and SQLite compare case-sensitively by default. Use `LOWER(city) = 'pune'` when the behaviour must be the same everywhere.
---
Most questions you ask a table are about *some* of its rows: the orders placed this month, the employees in one department, the products under a price. `WHERE` is how a query says which. It is the most-used clause after `SELECT` and `FROM`, and the one where correctness most often slips — through a comparison with NULL, a text column compared as a number, or a date range that misses its last day. This lesson covers the comparison operators, comparing numbers, text and dates, the NULL rule, and why filtering in `WHERE` is the cheapest thing a query does.

## The shape

```sql
SELECT name, salary
FROM employees
WHERE salary >= 60000
ORDER BY salary DESC, name;
```

`WHERE` comes after `FROM` and before `ORDER BY` (and `GROUP BY`, once you meet it). Logically it runs second: `FROM` produces the rows, `WHERE` tests its **condition** against each one, and only rows where the condition is **true** move on to `SELECT`. The condition is any expression that yields true, false or unknown — usually a comparison.

## Comparison operators

| Operator | Meaning | Example |
| --- | --- | --- |
| `=` | equal | `dept = 'Sales'` |
| `<>` or `!=` | not equal | `status <> 'cancelled'` |
| `<` `>` | less / greater than | `price < 500` |
| `<=` `>=` | at most / at least | `age >= 18` |

Note the single `=`: SQL has no `==` (SQLite tolerates it; MySQL does not). `<>` is the standard spelling of "not equal" and `!=` an alternative every major database accepts.

Both sides can be expressions:

```sql
SELECT name FROM order_items WHERE price * qty > 1000;
SELECT name FROM employees WHERE salary * 12 >= 1000000;
```

Column against column works too: `WHERE shipped_on > promised_on` finds late deliveries.

## Comparing numbers, text and dates

**Numbers** compare numerically. Keep literals unquoted: `WHERE year = 2`. MySQL would convert `'2'` to a number for you, but quoting numbers hides type mistakes, and comparing a *text* column with a *number* makes MySQL convert every row's text to a number — `'12abc'` becomes 12 — and prevents an index from being used.

**Text** compares by the column's **collation** — its alphabet. `=` tests equality; `<` and `>` compare in dictionary order:

```sql
SELECT name FROM students WHERE name < 'M';    -- names before M in the alphabet
```

In MySQL the default collations are **case-insensitive** and ignore trailing spaces, so `WHERE city = 'pune'` also finds `'Pune'`. PostgreSQL and SQLite compare case-sensitively. Store values consistently and don't let a query's correctness depend on the difference.

**Dates** compare chronologically. Write a date literal as a string in ISO format, `'YYYY-MM-DD'`, and MySQL converts it:

```sql
SELECT order_id, order_date
FROM orders
WHERE order_date >= '2024-03-01'
ORDER BY order_date, order_id;
```

ISO strings also sort correctly *as text*, which is why the format matters: `'2024-03-01' < '2024-12-01'` is true either way, while `'01/03/2024'` versus `'12/01/2024'` would compare as text in the wrong order. Never store or compare dates in a day-first or month-first text format.

On a `DATETIME` column, `WHERE created_at = '2024-03-01'` matches only midnight. A whole day is a **half-open range**:

```sql
WHERE created_at >= '2024-03-01' AND created_at < '2024-03-02'
```

That form also handles months of any length (`>= '2024-02-01' AND < '2024-03-01'`) without knowing whether February has 28 or 29 days.

## NULL is never equal to anything

The rule that catches everyone: a comparison with `NULL` is neither true nor false — it is **unknown** (`NULL`), and `WHERE` keeps only rows where the condition is *true*.

```sql
SELECT name FROM employees WHERE manager_id = NULL;     -- always zero rows
SELECT name FROM employees WHERE manager_id IS NULL;    -- the employees with no manager
SELECT name FROM employees WHERE manager_id IS NOT NULL;
```

`= NULL` is never true, not even for rows whose value is NULL — "is this unknown value equal to that unknown value?" has no answer. `IS NULL` and `IS NOT NULL` are the tests for presence.

The same rule hides in ordinary conditions. Given three employees, one with no department:

@figure where-rows

`WHERE dept <> 'Sales'` returns **only Ravi**. For Meera, `NULL <> 'Sales'` is unknown, so she is dropped — though most people asking "who is not in Sales?" would include her. If she belongs in the answer, say so:

```sql
WHERE dept <> 'Sales' OR dept IS NULL
```

Whenever a column can be NULL, ask what the query should do with those rows — `WHERE` will quietly drop them otherwise.

## WHERE runs before SELECT

From the first module: `WHERE` cannot see select aliases, and it cannot use aggregates.

```sql
SELECT name, price * qty AS total FROM order_items WHERE total > 100;       -- error: unknown column
SELECT name FROM products WHERE price > AVG(price);                          -- error: invalid use of group function
```

Repeat the expression for the first. The second needs a subquery (`WHERE price > (SELECT AVG(price) FROM products)`), which has its own module.

## Filtering early is cheap

A row removed by `WHERE` is never computed, sorted, grouped or sent over the network. Put every row condition there, and let the database do the filtering rather than fetching everything and discarding rows in application code — a habit that turns a 10-million-row transfer into a 10-row one.

`WHERE` is also where **indexes** help. With an index on `order_date`, `WHERE order_date >= '2024-03-01'` jumps straight to the first matching entry instead of reading the table. One rule from the indexes module is worth knowing now: keep the column **bare** on one side. `WHERE YEAR(order_date) = 2024` makes the database compute `YEAR()` for every row and cannot use the index; `WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01'` can. Queries written so an index can serve them are called **sargable**.

## No rows is an answer

A `WHERE` that matches nothing returns an empty result — the column headings and no rows. That is not an error: "no orders above ₹1,00,000 this month" is a valid answer, and code that reads results must handle it. The exercises print it as `(no rows)` under the heading.

## Key takeaways

- `WHERE condition` keeps the rows where the condition is **true**; false and unknown are dropped.
- Operators: `=`, `<>`/`!=`, `<`, `>`, `<=`, `>=`; both sides can be expressions or columns.
- Text compares by collation (case-insensitive by default in MySQL); dates as `'YYYY-MM-DD'`; whole days as half-open ranges.
- A comparison with NULL is unknown: use `IS NULL` / `IS NOT NULL`, and remember `<>` silently drops NULL rows.
- `WHERE` runs before `SELECT`: no aliases, no aggregates.
- Filter in the database, early, with the column bare on one side so an index can help.
