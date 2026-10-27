---
title: Sargable queries — predicates an index can use
minutes: 15
seo-title: What Is a Sargable Query? Index-Friendly WHERE Clauses in SQL
description: A sargable predicate lets an index seek. Why YEAR(col), col + 1, leading wildcards and type conversions force a full scan in MySQL, and how to rewrite each one.
question: What is a sargable query?
answer: A sargable query (from Search ARGument ABLE) has WHERE predicates that compare a bare indexed column with a value, so the database can seek in the index instead of scanning. Wrapping the column in a function, doing arithmetic on it, a leading wildcard in LIKE, or an implicit type conversion makes the predicate non-sargable and forces the server to test every row.
q: Why is WHERE YEAR(date_column) = 2024 slow?
a: The index on date_column is sorted by the dates, not by YEAR of them, so the server must compute YEAR for every row and cannot seek. Rewrite it as a half-open range, date_column >= '2024-01-01' AND date_column < '2025-01-01', which returns the same rows and can use the index as a range scan.
q: Does LIKE use an index in MySQL?
a: A LIKE with a fixed prefix, such as LIKE 'ravi%', can use a B-tree index as a range scan, because the matches sit together in sorted order. A leading wildcard, LIKE '%ravi', cannot, since the matches are scattered throughout the index. For word search inside text use a FULLTEXT index instead.
q: Can an implicit type conversion stop MySQL from using an index?
a: Yes. If a VARCHAR column is compared with a number, as in WHERE phone = 9876543210, MySQL converts every stored string to a number before comparing, so the index on phone cannot be used. Compare with a string literal of the column's own type, '9876543210', and the index works again.
q: What is a functional index in MySQL?
a: A functional index, available since MySQL 8.0.13, indexes the result of an expression, written in double parentheses, for example CREATE INDEX idx_email_lower ON users ((LOWER(email))). A query whose WHERE uses that exact expression can then seek. It is the fix when the expression cannot be moved off the column.
q: Why use a half-open range instead of BETWEEN for dates?
a: On a DATETIME column, BETWEEN '2024-01-01' AND '2024-12-31' stops at midnight on 31 December and misses the rest of that day. A half-open range, >= '2024-01-01' AND < '2025-01-01', includes every moment of the year for DATE and DATETIME alike and never overlaps the next period.
---
You created the right index and the query still scans the whole table. Nine times out of ten the index is fine and the **predicate** is the problem: something in the `WHERE` clause hides the column from the index. A predicate an index can search on is called **sargable** — from *Search ARGument ABLE* — and writing sargable conditions is the cheapest performance fix there is: same rows, same index, no schema change. This lesson lists the patterns that break sargability, shows the rewrite for each, and explains the rule underneath them all.

## The rule

An index is sorted by the column's **stored values**. The server can seek only if it can turn your condition into "find this value, or this range of values, in that order". So:

> Leave the indexed column **bare** on one side of the comparison, and put all the computation on the other side.

`placed_on >= '2024-01-01'` — bare column, constant: sargable. `YEAR(placed_on) = 2024` — the index is not sorted by `YEAR(placed_on)`, so the server must compute it for every row: not sargable.

## Functions on the column

```sql
-- non-sargable: YEAR() on every row, type ALL
SELECT id, amount FROM orders WHERE YEAR(placed_on) = 2024;

-- sargable: a range on the bare column, type range
SELECT id, amount FROM orders
WHERE placed_on >= '2024-01-01' AND placed_on < '2025-01-01';
```

The same shape covers months and days: `MONTH(d) = 3 AND YEAR(d) = 2024` becomes `d >= '2024-03-01' AND d < '2024-04-01'`; `DATE(created_at) = '2024-06-30'` becomes `created_at >= '2024-06-30' AND created_at < '2024-07-01'`.

Prefer the **half-open** range (`>=` start, `<` next start) to `BETWEEN`. On a `DATETIME`, `BETWEEN '2024-01-01' AND '2024-12-31'` means up to `2024-12-31 00:00:00` and silently drops every order placed later that day. The half-open form is correct for `DATE` and `DATETIME` alike and never overlaps the next period.

Other common functions with sargable twins:

| Non-sargable | Sargable rewrite |
| --- | --- |
| `LEFT(sku, 3) = 'ABC'` | `sku LIKE 'ABC%'` |
| `SUBSTRING(code, 1, 2) = 'IN'` | `code LIKE 'IN%'` |
| `DATEDIFF('2024-06-30', d) <= 30` | `d >= DATE_SUB('2024-06-30', INTERVAL 30 DAY)` |
| `IFNULL(discount, 0) > 0` | `discount > 0` (NULL is never > 0 anyway) |
| `CONCAT(first, ' ', last) = 'Asha Rao'` | `first = 'Asha' AND last = 'Rao'` |

## Arithmetic on the column

Move the arithmetic to the constant side, as in algebra:

```sql
WHERE price * 1.18 > 1180          -- non-sargable
WHERE price > 1180 / 1.18          -- sargable: price > 1000

WHERE created_at + INTERVAL 7 DAY > '2024-06-30'      -- non-sargable
WHERE created_at > '2024-06-30' - INTERVAL 7 DAY      -- sargable
```

Watch the sign when you divide by a negative number, and watch the boundary: `DATEDIFF(a, d) <= 30` and `d >= a - 30 days` agree only when `d` is not after `a`. A rewrite must return **the same rows** — test it on the edge values, as the exercises do.

## LIKE and wildcards

A B-tree can serve a `LIKE` whose pattern starts with literal characters: `name LIKE 'ravi%'` is a range — every entry from `'ravi'` up to just before `'ravj'`. A **leading wildcard** cannot: `'%ravi'` and `'%ravi%'` match entries scattered all over the index.

```sql
WHERE email LIKE 'ravi%'        -- range scan on idx_email
WHERE email LIKE '%@gmail.com'  -- full scan
```

For suffix searches, store the reversed string in an indexed column, or a separate indexed `domain` column. For words inside prose, use a `FULLTEXT` index with `MATCH(body) AGAINST('index')`.

## Implicit type conversions

Comparing a column with a value of a **different type** makes MySQL convert, and if it is the column that gets converted, the index is lost:

```sql
-- phone is VARCHAR(15) with an index
WHERE phone = 9876543210        -- number: every phone converted to a number, full scan
WHERE phone = '9876543210'      -- string: index lookup
```

The same trap hides in joins: joining a `VARCHAR` column to an `INT` column, or two string columns with **different character sets or collations**, can stop the index on the inner table being used. Keep join columns the same type, length, charset and collation.

The opposite direction is harmless: an `INT` column compared with the string `'42'` converts the constant once and still uses the index.

## OR, NOT and negative conditions

- `WHERE a = 1 OR b = 2` on two different columns cannot be one seek. MySQL may use `index_merge` (union of two index scans) or scan; rewriting as `UNION` of two sargable queries is a classic fix for a hot query.
- `WHERE a = 1 OR a = 2` is fine — it is `a IN (1, 2)`, a set of seeks.
- `!=`, `NOT IN` and `NOT LIKE` usually match most of the table, so the optimizer scans regardless; that is selectivity, not syntax.
- `IS NULL` **is** sargable in MySQL — the nulls are stored in the index (`ref_or_null` when combined with `= value`).

## When the expression cannot move: functional indexes

Sometimes the expression is the real key — case-insensitive matching on a case-sensitive collation, or JSON fields. MySQL 8.0.13+ can index an expression directly:

```sql
CREATE INDEX idx_users_email_lower ON users ((LOWER(email)));
SELECT id FROM users WHERE LOWER(email) = 'asha@example.com';   -- now sargable
```

The query must use the **same expression** as the index. Before 8.0.13 the equivalent was a generated column with an index on it. PostgreSQL has had expression indexes for a long time: `CREATE INDEX ON users (lower(email));`.

## Sargable is necessary, not sufficient

A sargable predicate lets the optimizer *consider* the index. It still chooses by cost: if the range covers a large share of the table, a scan wins, and that is correct. Sargability is about not taking the choice away from it.

## Practise

Both exercises hand you a non-sargable query and ask for a sargable one that returns exactly the same rows — including the edge rows a careless rewrite gets wrong, such as an order at 23:30 on the last day of the year.
