---
title: LIMIT and OFFSET — taking a slice of the result
minutes: 13
seo-title: SQL LIMIT and OFFSET in MySQL: TOP and FETCH FIRST Compared
description: MySQL LIMIT returns only the first rows of a sorted result and OFFSET skips some before them. LIMIT m, n, why it needs ORDER BY, and TOP and FETCH FIRST.
question: What do LIMIT and OFFSET do in MySQL?
answer: `LIMIT n` returns at most `n` rows of a query's result, and `OFFSET m` skips the first `m` rows before counting. They run last, after WHERE and ORDER BY, so `ORDER BY price LIMIT 3` gives the three cheapest rows. MySQL also accepts `LIMIT m, n`, offset first. Without ORDER BY, which rows you get is undefined.
q: What is the difference between LIMIT 5, 10 and LIMIT 5 OFFSET 10?
a: They are different slices. MySQL's comma form puts the offset first, so `LIMIT 5, 10` skips 5 rows and returns the next 10. `LIMIT 5 OFFSET 10` skips 10 rows and returns the next 5. The `OFFSET` form is clearer and is also what PostgreSQL and SQLite accept.
q: What is the SQL Server equivalent of LIMIT?
a: SQL Server uses `SELECT TOP (n) …` for a plain limit and `ORDER BY … OFFSET m ROWS FETCH NEXT n ROWS ONLY` for a slice. The SQL standard's form, `FETCH FIRST n ROWS ONLY`, also works in PostgreSQL, Oracle 12c and later, and Db2. MySQL supports only `LIMIT`.
q: Why use ORDER BY with LIMIT?
a: Because LIMIT takes the first rows of whatever order the result has, and without ORDER BY that order is undefined. `SELECT * FROM orders LIMIT 5` returns some five rows, not the newest or the cheapest, and they can differ between runs. Sort first to say which rows count as first.
q: What happens if OFFSET is larger than the number of rows?
a: The query returns no rows and no error. `LIMIT 10 OFFSET 500` on a 120-row result is simply empty, which is how an application knows it has paged past the end.
---
Most of the time you do not want every row a query can produce. A home page shows the five newest posts, a dashboard the ten biggest customers, an API the first page of results, and an interview question asks for "the highest salary". `LIMIT` cuts a result down to its first rows, and `OFFSET` skips some rows before the cut starts. They are small clauses, but they come with a rule people forget — they mean nothing without `ORDER BY` — and with more dialect differences than almost anything else in SQL. This lesson covers both clauses, MySQL's comma form, where they sit in the processing order, and the `TOP` and `FETCH FIRST` spellings you will meet in other databases.

## LIMIT

```sql
SELECT id, customer, total
FROM orders
ORDER BY total DESC
LIMIT 3;
```

```text
id | customer | total
14 | Ravi     | 4200
3  | Anita    | 3900
9  | Sam      | 2750
```

`LIMIT 3` keeps at most three rows. "At most": if the query only produces two rows, you get two; if it produces none, you get none. `LIMIT 0` is legal and returns no rows at all — tools sometimes use it to learn a query's column names without fetching data.

`LIMIT` is the very last step of the query. In the logical order — `FROM`, `WHERE`, `SELECT`, `ORDER BY`, `LIMIT` — the rows are filtered, computed and sorted first, and only then is the first slice taken. So `WHERE` decides which rows are candidates, `ORDER BY` decides which of them are "first", and `LIMIT` decides how many of those you keep.

## Always sort before you limit

`LIMIT` takes the first rows of the result's order. Without `ORDER BY` there is no defined order, so:

```sql
SELECT id, customer FROM orders LIMIT 3;   -- some three orders
```

returns *some* three orders. Today they may be the first three inserted; after a delete, an update or a new index, they may be three others. This is the single most common `LIMIT` bug in code review and the reason an interviewer frowns at a "top" query without a sort. And because ties are unordered too, a limited result is only reproducible when the sort is unique: `ORDER BY total DESC, id`. With two orders tied at the cut-off, `ORDER BY total DESC LIMIT 3` may return either one.

## OFFSET

`OFFSET m` skips the first `m` rows of the sorted result, then `LIMIT` counts from there:

```sql
SELECT id, customer, total
FROM orders
ORDER BY total DESC, id
LIMIT 3 OFFSET 3;      -- rows 4, 5 and 6
```

Offsets count from zero: `OFFSET 0` skips nothing, `OFFSET 3` starts at the fourth row. An offset past the end is not an error — the result is simply empty. In MySQL an `OFFSET` must come with a `LIMIT`; to skip rows and keep "all the rest", the documented trick is a huge limit such as `LIMIT 18446744073709551615 OFFSET 10`. That need is rare.

## MySQL's comma form

MySQL also accepts two numbers separated by a comma:

```sql
LIMIT 3, 5     -- skip 3, then take 5   (the same as LIMIT 5 OFFSET 3)
```

The comma form puts the **offset first** and the count second, the opposite of the reading order of `LIMIT 5 OFFSET 3`. It is everywhere in older PHP tutorials and an easy point for a trick question: `LIMIT 10, 20` returns twenty rows, starting with the eleventh. SQLite accepts it with the same meaning; PostgreSQL does not. Prefer `LIMIT … OFFSET …` in anything you write — the words say which number is which.

One more MySQL detail: the numbers must be literal non-negative integers or `?` placeholders in a prepared statement. `LIMIT 2 + 1` and `LIMIT (SELECT …)` are syntax errors in MySQL, though some other engines accept expressions there.

## The other spellings

`LIMIT` is not in the SQL standard, and every database family has its own way to say it. You will see all of them in interviews:

| Database | First 5 rows | Rows 11–15 |
| --- | --- | --- |
| MySQL, SQLite | `LIMIT 5` | `LIMIT 5 OFFSET 10` |
| PostgreSQL | `LIMIT 5` or `FETCH FIRST 5 ROWS ONLY` | `OFFSET 10 LIMIT 5` |
| SQL Server | `SELECT TOP (5) …` | `OFFSET 10 ROWS FETCH NEXT 5 ROWS ONLY` |
| Oracle 12c+ | `FETCH FIRST 5 ROWS ONLY` | `OFFSET 10 ROWS FETCH NEXT 5 ROWS ONLY` |
| Older Oracle | `WHERE ROWNUM <= 5` (in a subquery) | nested `ROWNUM` subqueries |

The standard form, `OFFSET … ROWS FETCH FIRST|NEXT … ROWS ONLY`, also offers `FETCH FIRST 3 ROWS WITH TIES`, which keeps any extra rows tied with the last one — PostgreSQL 13+, Oracle and SQL Server's `TOP (3) WITH TIES` support it, MySQL does not. In MySQL, "top three including ties" needs a subquery or a window function, both later in the course. The Oracle `ROWNUM` trap is worth knowing: `ROWNUM` is assigned *before* `ORDER BY`, so `WHERE ROWNUM <= 5 ORDER BY salary DESC` sorts five arbitrary rows instead of finding the top five.

## LIMIT with WHERE and DISTINCT

Because `LIMIT` is last, it applies to whatever the rest of the query produced:

```sql
-- The three cheapest products that are in stock
SELECT name, price
FROM products
WHERE stock > 0
ORDER BY price, id
LIMIT 3;

-- The three highest distinct prices
SELECT DISTINCT price
FROM products
ORDER BY price DESC
LIMIT 3;
```

In the second query, duplicates are removed **before** the limit: if three products cost 900, the result is still three different prices. That ordering — distinct, then sort, then limit — is the heart of the classic "Nth highest salary" question in the top-N lesson.

## LIMIT is not a performance switch by itself

`LIMIT 10` can make a query cheap: if an index already delivers rows in the `ORDER BY` order, the database reads ten rows and stops. Without such an index it must find and sort every matching row before it can know which ten come first, so `ORDER BY` + `LIMIT 10` on a million unindexed rows still sorts a million rows. And `OFFSET 100000` reads and throws away a hundred thousand rows before returning anything. The next lesson, on pagination, is about what to do instead.

## Before you move on

- `LIMIT n` keeps at most `n` rows; `OFFSET m` skips `m` first; both run last.
- Always pair them with an `ORDER BY` whose last key is unique.
- MySQL's `LIMIT m, n` is offset first, count second.
- SQL Server uses `TOP` and `OFFSET … FETCH`; the standard and Oracle use `FETCH FIRST n ROWS ONLY`.
- `DISTINCT` happens before `LIMIT`.
