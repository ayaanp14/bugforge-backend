---
title: UNION and UNION ALL — stacking result sets
minutes: 14
seo-title: SQL UNION vs UNION ALL: Combining Query Results in MySQL
description: UNION stacks the rows of two SELECTs and removes duplicates; UNION ALL keeps every row and is faster. Column rules, sorting the result and tagging rows.
question: What is the difference between UNION and UNION ALL in SQL?
answer: Both stack the rows of two or more SELECT statements into one result with the first SELECT's column names. `UNION` removes duplicate rows from the combined result, which costs a sort or hash over everything; `UNION ALL` keeps every row, duplicates included, and simply appends. Use `UNION ALL` unless you actually need duplicates removed — it is faster and never hides rows by accident.
q: Do the columns in a UNION need the same names?
a: No. They need the same number of columns, and each position should hold compatible types; the names come from the first SELECT. Alias the columns in the first SELECT to name the result, because aliases in the later SELECTs are ignored.
q: How do you use ORDER BY with UNION?
a: Write one ORDER BY at the very end; it sorts the combined result, not the last SELECT. Order by the column names or aliases of the first SELECT. To order or limit one branch on its own, MySQL lets you wrap that SELECT in parentheses with its own ORDER BY and LIMIT.
q: Does UNION treat NULL values as duplicates?
a: Yes. For removing duplicates, two NULLs in the same column count as equal, so `UNION` keeps one row where several rows are identical including their NULLs. This differs from `=` in a WHERE clause, where NULL equals nothing.
q: Is UNION ALL faster than UNION?
a: Usually, yes. `UNION ALL` appends rows as they come, while `UNION` must compare every row against every other to remove duplicates, typically with a temporary table, a sort or a hash. On large results that extra work is the whole difference, so prefer `UNION ALL` when duplicates are impossible or wanted.
q: How do I tell which table a row came from after a UNION?
a: Add a constant column to each SELECT, such as `'customer' AS kind` in the first and `'supplier'` in the second. The literal travels with each row, so the combined result says where every row came from and you can filter or group on it.
---
Joins put tables side by side: each output row is wider because it carries columns from several tables. Set operations go the other way — they put result sets *on top of each other*. The rows of one query and the rows of another become one taller result. `UNION` and `UNION ALL` are the set operations every SQL dialect has had for decades, and they answer a whole family of everyday questions: one mailing list from customers and suppliers, one activity feed from posts and comments, one report from this year's table and the archive table. This lesson covers how a union is formed, the column rules, the difference between `UNION` and `UNION ALL`, sorting the combined result, and the patterns that use them.

## Stacking two queries

```sql
SELECT name, email FROM customers
UNION ALL
SELECT company, email FROM suppliers;
```

Each SELECT runs on its own, with its own FROM, WHERE, GROUP BY and HAVING. Then the second result's rows are appended under the first's. The combined result has the *first* SELECT's column names — here `name` and `email`, even for the rows that came from `suppliers.company`.

| name | email |
| --- | --- |
| Asha Rao | asha@mail.com |
| Ben Ortiz | ben@mail.com |
| Acme Parts | sales@acme.io |
| Bolt & Co | hi@bolt.co |

Three rules make a union legal:

1. **The same number of columns** in every SELECT. MySQL refuses `SELECT a, b … UNION SELECT c …` with "The used SELECT statements have a different number of columns".
2. **Compatible types by position.** The first column of each SELECT becomes one output column, so it should hold the same kind of value. MySQL will quietly convert mismatches (a number under a string column becomes text), which is rarely what you meant.
3. **Names come from the first SELECT.** Aliases in later branches are allowed but ignored. Put the meaningful names on the first branch.

Matching is by *position*, never by name. `SELECT name, email … UNION ALL SELECT email, company …` is legal and wrong: e-mail addresses end up under `name`. When the branches come from tables with different column orders, list the columns explicitly in each branch — never `SELECT *` in a union.

## UNION removes duplicates, UNION ALL keeps them

```sql
SELECT city FROM customers
UNION
SELECT city FROM suppliers;
```

`UNION` (short for `UNION DISTINCT`) returns each distinct row once across the *whole* combined result — duplicates within one branch are removed too, not just duplicates between branches. If three customers live in Pune and one supplier does, Pune appears once.

@figure union-dedup

`UNION ALL` keeps every row:

```sql
SELECT city FROM customers
UNION ALL
SELECT city FROM suppliers;      -- Pune appears four times
```

Which to use is a question about meaning first, cost second:

- When the branches cannot overlap (rows tagged with a different constant, disjoint date ranges, two different tables of events), the duplicate check finds nothing and only costs time. Use `UNION ALL`.
- When you are counting or summing afterwards, `UNION` is usually a bug: two genuinely separate sales of the same amount on the same day look like duplicates and one is thrown away.
- When the question is "the set of distinct values from either source" — every city we deal with, every e-mail to send one message to — `UNION` is exactly right.

The cost difference is real. `UNION ALL` streams rows through. `UNION` must remember every row it has emitted (MySQL builds a temporary table with a unique key) and check each new row against it. On a few thousand rows nobody notices; on millions it is the difference between a query that streams and one that spills to disk. Interviewers like this question because the answer has both halves: *semantics* (duplicates) and *cost* (the dedup pass).

For deduplication, NULLs count as equal: two rows `('Pune', NULL)` are duplicates to `UNION` even though `NULL = NULL` is not true in a WHERE clause. `DISTINCT` and `GROUP BY` behave the same way.

## Tagging where a row came from

Once rows are stacked, you can no longer tell which table each came from — unless you say so. Add a constant column:

```sql
SELECT name AS contact, email, 'customer' AS kind FROM customers
UNION ALL
SELECT company, email, 'supplier' FROM suppliers;
```

| contact | email | kind |
| --- | --- | --- |
| Asha Rao | asha@mail.com | customer |
| Acme Parts | sales@acme.io | supplier |

The literal is just another column, so it obeys the same rules: same position in every branch, name from the first. A tag also makes `UNION` and `UNION ALL` give the same answer whenever the tags differ, since no row of one branch can equal a row of the other — another reason `UNION ALL` is the default choice for tagged unions.

## Sorting and limiting the combined result

An ORDER BY after the last SELECT sorts the *whole* union, not the last branch:

```sql
SELECT name AS contact, 'customer' AS kind FROM customers
UNION ALL
SELECT company, 'supplier' FROM suppliers
ORDER BY contact, kind
LIMIT 10;
```

Order by the result's column names — the first branch's names or aliases. Most engines also accept a column position (`ORDER BY 1`), but an expression over the original tables (`ORDER BY customers.name`) is refused: after the union, `customers` no longer exists, only the combined result does.

To sort or limit *one branch* — the three newest posts plus the three newest comments — MySQL lets you parenthesise each SELECT:

```sql
(SELECT id, created_at, 'post' AS kind FROM posts ORDER BY created_at DESC LIMIT 3)
UNION ALL
(SELECT id, created_at, 'comment' FROM comments ORDER BY created_at DESC LIMIT 3)
ORDER BY created_at DESC;
```

Without the LIMIT, an ORDER BY inside a branch is meaningless — the union is free to reorder — and MySQL ignores it. (This course's in-browser engine does not accept parenthesised branches; the same effect is written with a CTE or derived table per branch, which the next lessons cover.)

## Aggregating over a union

A union is a result set, so it can be a derived table. To count all activity per user across two tables, union first, then group:

```sql
SELECT user_id, COUNT(*) AS actions
FROM (
  SELECT user_id FROM posts
  UNION ALL
  SELECT user_id FROM comments
) AS activity
GROUP BY user_id
ORDER BY actions DESC, user_id;
```

`UNION ALL` is essential here: with `UNION`, a user's second post would be "a duplicate" of their first (both rows are just `user_id = 7`) and the count would be wrong. MySQL requires the alias (`AS activity`) on the derived table.

## Patterns that use a union

- **Combining similar tables.** Current and archived orders, per-region tables, a legacy table beside its replacement.
- **Turning columns into rows.** A table with `phone_home`, `phone_work`, `phone_mobile` becomes one row per number with three branches: `SELECT id, 'home', phone_home … UNION ALL SELECT id, 'work', phone_work …` (an unpivot, used again in the patterns module).
- **Adding a totals row.** `SELECT region, SUM(amount) … GROUP BY region UNION ALL SELECT 'Total', SUM(amount) FROM sales`. MySQL also has `GROUP BY … WITH ROLLUP` for this; the union version works everywhere and lets you control the label.
- **Replacing an OR across two indexed columns.** `WHERE a = 1 OR b = 2` can stop an index being used; two branches each using its own index, joined by `UNION`, sometimes run far faster. Here `UNION` (not ALL) is needed, because a row matching both conditions would otherwise appear twice.

## In other databases

PostgreSQL, SQL Server, Oracle and SQLite all have `UNION` and `UNION ALL` with the same meaning and the same column rules. Oracle is strict about types and refuses a mismatch MySQL would convert. SQL Server has no `LIMIT`; it uses `TOP` or `OFFSET … FETCH` on the final query. The duplicate-versus-cost answer is identical everywhere.

## Pitfalls

- Using `UNION` where duplicates are real data, then wondering why a sum is short.
- Matching columns by name instead of position — the second branch's columns land under the wrong headings without an error.
- Putting the aliases on the second branch and wondering why the result uses the first branch's raw names.
- Ordering by a table-qualified column after a union.
- Forgetting the alias on a derived table that wraps a union.

## Key takeaways

- A union stacks rows: same column count, compatible types by position, names from the first SELECT.
- `UNION` removes duplicates across the whole result (NULLs count as equal); `UNION ALL` keeps every row and is cheaper.
- Default to `UNION ALL`; reach for `UNION` when "distinct values from either source" is the actual question.
- One ORDER BY at the end sorts the combined result; tag rows with a constant column to keep their origin.
- Wrap a union in a derived table to group or count across both sources.
