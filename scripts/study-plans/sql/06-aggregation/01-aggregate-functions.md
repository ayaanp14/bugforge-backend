---
title: Aggregate functions — COUNT, SUM, AVG, MIN and MAX
minutes: 13
seo-title: SQL Aggregate Functions: COUNT, SUM, AVG, MIN and MAX
description: SQL aggregate functions turn many rows into one value: COUNT, SUM, AVG, MIN and MAX. How each treats NULL, COUNT DISTINCT, and what an empty table returns.
question: What are aggregate functions in SQL?
answer: Aggregate functions compute one value from many rows. The five standard ones are `COUNT` (how many), `SUM` (the total), `AVG` (the mean), `MIN` and `MAX` (the smallest and largest). Without `GROUP BY` they summarise the whole table into a single row. Every one of them except `COUNT(*)` ignores NULL values, which changes averages and counts in ways worth knowing.
q: Do SQL aggregate functions ignore NULL values?
a: Yes, all of them except `COUNT(*)`. `COUNT(col)`, `SUM`, `AVG`, `MIN` and `MAX` skip rows where the column is NULL. That means `AVG(rating)` is the average of the rows that have a rating, not of all rows; use `AVG(COALESCE(rating, 0))` if missing values should count as zero.
q: What does SUM return when there are no rows?
a: `SUM`, `AVG`, `MIN` and `MAX` return NULL when no rows match, or when every value is NULL. `COUNT` returns 0. Wrap the total in `COALESCE(SUM(amount), 0)` when a report should show 0 instead of an empty cell.
q: What is the difference between COUNT(*) and COUNT(column)?
a: `COUNT(*)` counts rows, whatever they contain. `COUNT(column)` counts the rows where that column is not NULL. On a table with 10 orders of which 3 have no coupon, `COUNT(*)` is 10 and `COUNT(coupon_code)` is 7. `COUNT(1)` is the same as `COUNT(*)`.
q: How do I count distinct values in SQL?
a: Use `COUNT(DISTINCT column)`, which counts the different non-NULL values. `COUNT(DISTINCT customer_id)` on an orders table gives the number of customers who ordered, however many orders each placed. MySQL also accepts several columns, as in `COUNT(DISTINCT city, country)`.
q: Can I use an aggregate function in a WHERE clause?
a: No. `WHERE` filters individual rows before any aggregation happens, so `WHERE SUM(amount) > 100` is an error. Filter on an aggregate with `HAVING`, which runs after grouping, or compute the aggregate in a subquery and compare against it.
---
Every query so far has returned one output row per input row, possibly filtered and sorted. Many questions are not like that. *How many orders came in? What was the revenue? What is the average rating, the cheapest product, the most recent sign-up?* Each answer is a single value computed from many rows. That is what aggregate functions do, and they are the foundation of every report, dashboard and analytics question — and of a large share of SQL interview questions. This lesson covers the five standard aggregates on a whole table; the next adds `GROUP BY` to compute them per group.

## The five aggregates

```sql
SELECT COUNT(*)     AS orders,
       SUM(amount)  AS revenue,
       AVG(amount)  AS average_order,
       MIN(amount)  AS smallest,
       MAX(amount)  AS largest
FROM orders;
```

```text
orders | revenue | average_order | smallest | largest
5 | 750 | 150 | 40 | 400
```

Five rows went in, one row came out. That is the defining property: an aggregate collapses its input rows into one value, so a query whose SELECT list holds only aggregates (and no `GROUP BY`) returns exactly **one row** — even when the table is empty.

- `COUNT` counts.
- `SUM` adds numbers.
- `AVG` is `SUM` divided by the number of values it summed.
- `MIN` and `MAX` find the smallest and largest. They also work on text (alphabetically first and last) and dates (earliest and latest): `MAX(order_date)` is the most recent order.

## Aggregates and WHERE

`WHERE` runs **before** aggregation: it decides which rows the aggregates see.

```sql
SELECT COUNT(*) AS march_orders, SUM(amount) AS march_revenue
FROM orders
WHERE order_date >= '2024-03-01' AND order_date < '2024-04-01';
```

The reverse is not allowed: an aggregate cannot appear in `WHERE`, because at that stage the rows have not been aggregated yet. `WHERE SUM(amount) > 1000` is an error; the clause for conditions on aggregates is `HAVING`, two lessons on.

## The three COUNTs

`COUNT` comes in three forms, and interviewers love the difference:

```sql
SELECT COUNT(*)                     AS all_rows,
       COUNT(coupon_code)           AS with_coupon,
       COUNT(DISTINCT customer_id)  AS customers
FROM orders;
```

- `COUNT(*)` counts **rows**. NULLs do not matter; a row is a row.
- `COUNT(expr)` counts rows where `expr` is **not NULL**.
- `COUNT(DISTINCT expr)` counts the different non-NULL values.

`COUNT(1)` is identical to `COUNT(*)` — the 1 is never NULL — and there is no performance difference in modern MySQL. A favourite trick question: "what does `COUNT(NULL)` return?" Always 0, because NULL is never counted.

## NULLs are skipped

Every aggregate except `COUNT(*)` **ignores NULL**. That is usually what you want, and occasionally a trap.

Take five reviews where two have no rating:

```text
id | rating
1 | 4
2 | NULL
3 | 5
4 | NULL
5 | 3
```

```sql
SELECT COUNT(*)           AS reviews,          -- 5
       COUNT(rating)      AS rated,            -- 3
       SUM(rating)        AS total,            -- 12
       AVG(rating)        AS avg_rated,        -- 4      (12 / 3)
       SUM(rating) / COUNT(*)       AS avg_all,           -- 2.4    (12 / 5)
       AVG(COALESCE(rating, 0))     AS avg_missing_as_0   -- 2.4
FROM reviews;
```

`AVG(rating)` is the average *of the reviews that have a rating*. Whether that or 2.4 is right depends on what a missing rating means — "not given" (skip it) or "zero stars" (count it). The query has to say which; `COALESCE` inside the aggregate is how you say the second.

## Empty input

When no rows reach the aggregates — an empty table or a `WHERE` that matches nothing — the query still returns one row:

```sql
SELECT COUNT(*) AS n, SUM(amount) AS total, AVG(amount) AS avg_amount, MAX(amount) AS biggest
FROM orders
WHERE amount > 1000000;
```

```text
n | total | avg_amount | biggest
0 | NULL | NULL | NULL
```

`COUNT` is 0, but `SUM`, `AVG`, `MIN` and `MAX` are **NULL**, not 0 — there is no total of nothing. A revenue report that prints NULL for a quiet day is usually a bug in the report; `COALESCE(SUM(amount), 0)` fixes it. The same NULL appears when every value in the column is NULL.

## AVG and integer columns

MySQL's `AVG` of an integer column returns a decimal: the average of 1, 2 and 2 is `1.6667`. PostgreSQL also returns a decimal for `AVG`. SQL Server, however, returns an **integer** average for an integer column — `AVG` of 1, 2, 2 is 1 there — which is why SQL Server queries often read `AVG(score * 1.0)` or `AVG(CAST(score AS DECIMAL(10, 2)))`. Round averages for display: `ROUND(AVG(score), 2)`.

`AVG(DISTINCT col)` and `SUM(DISTINCT col)` also exist and use each different value once. They are rarely what a question means — two orders of 100 are two orders, not one.

## Aggregating expressions

The argument of an aggregate can be any expression, evaluated per row before aggregating:

```sql
SELECT SUM(price * qty)                AS revenue,
       MAX(DATEDIFF(shipped_on, ordered_on)) AS slowest_days,
       COUNT(DISTINCT DATE(created_at))      AS active_days,
       MIN(CHAR_LENGTH(name))                AS shortest_name
FROM order_lines;
```

And an aggregate can sit inside an expression, evaluated after aggregating: `ROUND(100 * SUM(refunded) / COUNT(*), 1)` is a refund percentage, and `MAX(price) - MIN(price)` is the price range.

## Mixing aggregates with plain columns

A query that aggregates the whole table returns one row, so what should a plain column next to an aggregate show?

```sql
SELECT name, MAX(amount) FROM orders;      -- which order's name?
```

There are five names and one row. Standard SQL rejects this query, and so does MySQL in its default mode (`ONLY_FULL_GROUP_BY`, the subject of this module's last lesson). Older MySQL versions accepted it and returned the name of an *arbitrary* row — not necessarily the one with the largest amount. Finding "the order with the largest amount" is a different question, answered with `ORDER BY amount DESC LIMIT 1` or, in later modules, a subquery or window function.

## Pitfalls

- `COUNT(col)` skipping NULLs when you meant to count rows.
- `AVG` silently ignoring NULLs that should have been zeros.
- `SUM` of no rows is NULL, not 0.
- An aggregate in `WHERE` — use `HAVING`.
- A plain column next to aggregates without `GROUP BY`.
- SQL Server's integer `AVG` on integer columns.

## Key takeaways

- `COUNT`, `SUM`, `AVG`, `MIN` and `MAX` collapse many rows into one value.
- Only `COUNT(*)` counts NULLs; every other aggregate skips them.
- `COUNT(DISTINCT x)` counts different values.
- With no input rows, `COUNT` is 0 and the others are NULL.
- `WHERE` filters rows before aggregation; it cannot test an aggregate.
