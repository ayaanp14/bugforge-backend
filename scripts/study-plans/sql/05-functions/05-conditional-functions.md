---
title: Conditional functions — IF, IFNULL, NULLIF, GREATEST and FIELD
minutes: 13
seo-title: MySQL IF, IFNULL, NULLIF and GREATEST: Conditional Functions
description: MySQL's IF, IFNULL, NULLIF, GREATEST, LEAST and FIELD put decisions inside an expression. Safe division with NULLIF, custom sort orders and how CASE compares.
question: What is the IF function in MySQL?
answer: `IF(condition, value_if_true, value_if_false)` is MySQL's inline conditional: it returns the second argument when the condition is true and the third otherwise, including when the condition is NULL. It is shorthand for a two-branch `CASE WHEN … THEN … ELSE … END`. `IF` is MySQL-only; `CASE` works in every database, so portable code and anything with more than two branches use `CASE`.
q: What is the difference between IFNULL and COALESCE?
a: `IFNULL(a, b)` takes exactly two arguments and returns `b` when `a` is NULL. `COALESCE(a, b, c, …)` takes any number and returns the first that is not NULL. `COALESCE` is standard SQL and works everywhere; `IFNULL` is MySQL's name, and SQL Server calls the two-argument form `ISNULL`.
q: How do I avoid division by zero in SQL?
a: Wrap the divisor in `NULLIF(divisor, 0)`. `NULLIF` returns NULL when its two arguments are equal, so dividing by it gives NULL instead of an error, and `COALESCE(x / NULLIF(y, 0), 0)` turns that NULL into 0 if needed. MySQL already returns NULL for division by zero, but PostgreSQL and SQL Server raise an error.
q: How do I sort rows in a custom order in MySQL?
a: `ORDER BY FIELD(status, 'open', 'pending', 'closed')` sorts by the position of the value in the list, so open rows come first. Values not in the list get 0 and sort before all of them. The portable version is a `CASE` expression that maps each value to a number: `ORDER BY CASE status WHEN 'open' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END`.
q: What is the difference between GREATEST and MAX in SQL?
a: `GREATEST(a, b, c)` compares several values within one row and returns the largest; `MAX(col)` is an aggregate that compares one column across many rows. `GREATEST` returns NULL in MySQL if any argument is NULL, so wrap nullable columns with `COALESCE` first. `LEAST` and `MIN` are the matching pair for the smallest.
---
The previous module introduced `CASE` and `COALESCE`, the two standard ways to make a decision inside an expression. MySQL adds a set of shorter functions for the decisions that come up constantly: pick one of two values, replace a NULL, turn a sentinel into NULL, take the larger of two columns, sort by a list. They are small, but they make up a large share of real report queries and of interview answers — "avoid division by zero" and "sort status in a custom order" are both one-function answers.

## IF: a two-way choice

`IF(cond, a, b)` returns `a` when `cond` is true and `b` otherwise.

```sql
SELECT name, stock,
       IF(stock > 0, 'in stock', 'sold out') AS availability
FROM products
ORDER BY name;
```

| name | stock | availability |
| --- | ---: | --- |
| Desk | 0 | sold out |
| Lamp | 12 | in stock |

"Otherwise" includes NULL: `IF(NULL > 0, 'yes', 'no')` returns `'no'`, because the condition is not true. That matches `CASE`, which also falls to `ELSE` when no `WHEN` is true.

`IF` is exactly a two-branch `CASE`:

```sql
IF(stock > 0, 'in stock', 'sold out')
CASE WHEN stock > 0 THEN 'in stock' ELSE 'sold out' END
```

`IF` is MySQL-only (SQL Server has a similar `IIF`); `CASE` is standard. Nesting `IF`s for three or more outcomes — `IF(a, x, IF(b, y, z))` — works but reads badly; once there is a third branch, switch to `CASE`. Do not confuse the `IF()` function with the `IF … THEN … END IF` statement of stored procedures, which is a different thing.

## IFNULL and COALESCE: replacing NULL

`IFNULL(a, b)` returns `a` unless it is NULL, in which case `b`. `COALESCE` does the same for any number of arguments and returns the first non-NULL one.

```sql
SELECT name,
       IFNULL(phone, 'no phone')               AS phone,
       COALESCE(mobile, phone, email, 'none')  AS best_contact
FROM contacts
ORDER BY name;
```

They matter most in arithmetic, where one NULL poisons the whole expression: `price - discount` is NULL for every product with no discount, and `price - IFNULL(discount, 0)` is the price. For portability prefer `COALESCE`; SQL Server's two-argument version is spelled `ISNULL(a, b)` — which in MySQL is a different, one-argument function that returns 1 or 0.

## NULLIF: turning a value into NULL

`NULLIF(a, b)` returns NULL when `a = b`, and `a` otherwise. It sounds backwards until you see its two jobs.

**Safe division.** Dividing by `NULLIF(d, 0)` divides by NULL instead of zero, which gives NULL rather than an error:

```sql
SELECT campaign,
       ROUND(100 * clicks / NULLIF(views, 0), 1) AS ctr
FROM campaigns
ORDER BY campaign;
```

MySQL returns NULL for a division by zero anyway, but PostgreSQL and SQL Server raise an error and stop the query, so the `NULLIF` guard is the habit worth having everywhere. Wrap the whole expression in `COALESCE(…, 0)` if a zero is wanted instead of NULL.

**Cleaning sentinels.** Old data often stores "unknown" as an empty string, 0 or `'N/A'`. `NULLIF(col, '')` turns those into real NULLs, so `COALESCE`, `COUNT(col)` and `AVG(col)` treat them as missing:

```sql
SELECT COALESCE(NULLIF(TRIM(nickname), ''), name) AS shown_name
FROM users;
```

## GREATEST and LEAST: across columns

`GREATEST(a, b, …)` returns the largest of its arguments and `LEAST` the smallest. They work *within one row*, across columns or expressions, which is what separates them from the aggregates `MAX` and `MIN` (next module), which work down a column across rows.

```sql
SELECT player,
       GREATEST(round1, round2, round3) AS best_round,
       LEAST(round1, round2, round3)    AS worst_round,
       GREATEST(price - discount, 0)    AS charged      -- never below zero
FROM scores
ORDER BY player;
```

`GREATEST(x, 0)` is the standard way to **clamp** a value at a floor, and `LEAST(x, 100)` at a ceiling. Combine them for a range: `LEAST(GREATEST(score, 0), 100)`.

The NULL rule differs between databases. In MySQL, if **any** argument is NULL the result is NULL; PostgreSQL ignores NULL arguments instead. On MySQL, wrap nullable columns: `GREATEST(COALESCE(a, 0), COALESCE(b, 0))`.

## FIELD: position in a list

`FIELD(x, v1, v2, v3, …)` returns the position of `x` in the list — 1 for `v1`, 2 for `v2` — and **0** when `x` is not there. Its main use is sorting in an order that is neither alphabetical nor numeric:

```sql
SELECT id, status
FROM tickets
ORDER BY FIELD(status, 'urgent', 'open', 'waiting', 'closed'), id;
```

Statuses outside the list get 0 and come **first**. To put unknown values last, sort by `FIELD(…) = 0` first — false (0) sorts before true (1) — or list them explicitly. The portable spelling is a `CASE` that maps each value to a number:

```sql
ORDER BY CASE status WHEN 'urgent' THEN 1 WHEN 'open' THEN 2
                     WHEN 'waiting' THEN 3 ELSE 4 END, id
```

## Choosing between them

| Need | MySQL shorthand | Portable form |
| --- | --- | --- |
| two outcomes | `IF(c, a, b)` | `CASE WHEN c THEN a ELSE b END` |
| three or more outcomes | — | `CASE` |
| replace NULL | `IFNULL(a, b)` | `COALESCE(a, b)` |
| make a value NULL | `NULLIF(a, b)` | `NULLIF(a, b)` (standard) |
| largest/smallest in a row | `GREATEST`, `LEAST` | same in PostgreSQL and Oracle; SQL Server 2022+ |
| custom sort | `FIELD(x, …)` | `CASE x WHEN … THEN 1 … END` |

Use the shorthand when it reads better and the code will only run on MySQL; use `CASE` and `COALESCE` when portability or an interviewer's preference for standard SQL matters.

## Pitfalls

- `IF` treats a NULL condition as false — make sure that is what you mean.
- Nesting `IF` three deep instead of writing a `CASE`.
- `ISNULL(a, b)` is SQL Server; MySQL's `ISNULL(a)` takes one argument and returns 1 or 0.
- `GREATEST`/`LEAST` return NULL in MySQL if any argument is NULL.
- `FIELD` returns 0 for unlisted values, which sorts them first.
- Dividing by a column that can be zero without `NULLIF`.

## Key takeaways

- `IF(c, a, b)` is a two-branch `CASE`; use `CASE` for anything more.
- `IFNULL`/`COALESCE` replace NULLs; `NULLIF` creates them — safe division and sentinel cleanup.
- `GREATEST`/`LEAST` work across columns and clamp values.
- `FIELD` gives a custom sort order; a `CASE` mapping does the same portably.
