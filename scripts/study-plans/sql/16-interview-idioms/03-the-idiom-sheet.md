---
title: The idiom sheet — the shapes SQL questions take and the query for each
minutes: 17
seo-title: SQL Interview Cheat Sheet: Query Patterns and Idioms
description: The SQL idiom for each interview question shape: existence checks, latest row per group, top N per group, percent of total, running totals, medians and pairs.
question: What are the common SQL query patterns for interviews?
answer: The common SQL query patterns are existence and absence checks with EXISTS and anti-joins, the latest row per group, top N per group with ROW_NUMBER or DENSE_RANK, conditional aggregation, percent of total with a window SUM, running totals, comparing with the previous row using LAG, ratios guarded by NULLIF, pairs from a self-join, and median and mode. Recognising the shape from the question's wording tells you which to write.
q: How do you get the latest row for each group in SQL?
a: Number each group's rows newest first with `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, id DESC)` and keep the rows numbered 1. The older alternative joins the table to a grouped `MAX(created_at)` per key, which returns several rows when two share the latest time.
q: How do you calculate a percentage of the total in SQL?
a: Divide each value by a window sum over the whole set or its group: `100 * salary / SUM(salary) OVER (PARTITION BY dept)`. The window keeps every row while giving each one its group's total, so no join back to a grouped subquery is needed. Round the result for display.
q: How do you calculate a median in MySQL?
a: MySQL has no MEDIAN function. Number the rows in order with `ROW_NUMBER()`, count them with `COUNT(*) OVER ()`, and average the middle one or two rows: those whose number is `FLOOR((n + 1) / 2)` or `CEIL((n + 1) / 2)`. Add PARTITION BY for a median per group.
q: How do you find all pairs of rows in SQL without duplicates?
a: Self-join the table with a strict inequality on the key: `FROM players a JOIN players b ON a.id < b.id`. The inequality removes both the pair of a row with itself and the mirrored pair, so each unordered pair appears exactly once.
---
The previous modules taught the clauses; the query-patterns module taught the bigger shapes. This lesson is the compressed version for the day of the interview: a sheet of question shapes, each recognised by its wording, each with the few lines of MySQL that answer it. Fluent candidates do not invent these during the round — they recognise "latest per customer" or "share of the total" and type the idiom. Read it once slowly, then come back to it as a checklist.

## Existence and absence

*"Customers who have ordered"*, *"products never sold"*, *"users with no login this month"*.

```sql
-- has at least one
SELECT c.* FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

-- has none (anti-join)
SELECT c.* FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```

`EXISTS` stops at the first match and never duplicates the outer row, unlike an inner join to a table with many matches. For absence prefer `NOT EXISTS` or the left join over `NOT IN`, which a single NULL silently breaks.

## Latest (or first) row per group

*"Each customer's most recent order"*, *"the current price of each product"*.

```sql
SELECT * FROM (
  SELECT o.*, ROW_NUMBER() OVER (
           PARTITION BY customer_id ORDER BY created_at DESC, id DESC) AS rn
  FROM orders o
) t
WHERE rn = 1;
```

End the window's `ORDER BY` with a unique column so the winner is fixed. The pre-window idiom joins to `SELECT customer_id, MAX(created_at) … GROUP BY customer_id`; it returns two rows when two orders share the latest time.

## Top N per group

*"The three best-selling products in each category"*. Same as above with `rn <= 3`. Choose the function by the meaning of ties: `ROW_NUMBER` for exactly N rows, `DENSE_RANK` for N value levels including everyone tied, `RANK` for N places where ties consume places.

## Counting several things at once

*"For each month, how many orders were paid, refunded and cancelled?"* — conditional aggregation:

```sql
SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
       SUM(status = 'paid')     AS paid,
       SUM(status = 'refunded') AS refunded,
       COUNT(*)                 AS total
FROM orders
GROUP BY month;
```

`COUNT(CASE WHEN … THEN 1 END)` is the portable form. The same idiom gives ratios in one pass: `AVG(status = 'refunded')` is the refund rate, because the average of 0s and 1s is the share of 1s.

## Share of the total

*"Each employee's share of their department's payroll"*, *"each product's percentage of revenue"*.

```sql
SELECT dept, name, salary,
       ROUND(100 * salary / SUM(salary) OVER (PARTITION BY dept), 1) AS pct
FROM employees;
```

A window aggregate gives every row its group's total without collapsing the rows — the key difference from `GROUP BY`. `SUM(salary) OVER ()`, with an empty window, is the grand total.

## Ratios that cannot divide by zero

*"Conversion rate per campaign"*.

```sql
SELECT campaign,
       ROUND(100 * SUM(converted) / NULLIF(COUNT(*), 0), 2) AS conversion_pct
FROM visits GROUP BY campaign;
```

`NULLIF(x, 0)` turns a zero denominator into NULL. In MySQL `/` is always decimal division; in PostgreSQL and SQL Server, integer divided by integer truncates — multiply by `1.0` there.

## Running totals and moving windows

*"Cumulative revenue by day"*, *"7-day moving average"*.

```sql
SUM(amount) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
AVG(amount) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
```

Say `ROWS` explicitly — the default frame is `RANGE`, which treats tied dates as one step — and remember that a ROWS frame is a 7-*day* window only with one row per day.

## Compare with the previous row

*"Day-over-day change"*, *"time since the user's previous visit"*, *"rows where the value went up"*.

```sql
SELECT day, revenue,
       revenue - LAG(revenue) OVER (ORDER BY day) AS change_abs,
       DATEDIFF(day, LAG(day) OVER (ORDER BY day)) AS days_since
FROM daily;
```

`LAG(x, n, default)` reaches n rows back, with a default instead of NULL at the start; `LEAD` reaches forward. To filter on the result ("days where revenue fell"), compute it in a CTE and filter outside — a window function cannot appear in `WHERE`.

## Pairs and combinations

*"All possible matches between teams"*, *"pairs of users who share a city"*.

```sql
SELECT a.name, b.name
FROM teams a JOIN teams b ON a.id < b.id;
```

`a.id < b.id` removes self-pairs and mirrored duplicates in one condition; `<>` would list every pair twice. Add `AND a.city = b.city` for pairs that share something.

## Median and mode

MySQL has no `MEDIAN`. Number the rows and average the middle one or two:

```sql
WITH r AS (
  SELECT store, amount,
         ROW_NUMBER() OVER (PARTITION BY store ORDER BY amount) AS rn,
         COUNT(*)     OVER (PARTITION BY store)                 AS n
  FROM orders
)
SELECT store, ROUND(AVG(amount), 2) AS median_amount
FROM r
WHERE rn IN (FLOOR((n + 1) / 2), CEIL((n + 1) / 2))
GROUP BY store;
```

For an odd `n` both expressions name the same middle row; for an even `n` they name the two middle rows, and `AVG` takes their mean. PostgreSQL has `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount)`. The **mode** — the most frequent value — is `GROUP BY value ORDER BY COUNT(*) DESC, value LIMIT 1`, with the tie-breaker stated.

## Distinct counts and lists

*"How many different products did each customer buy?"* is `COUNT(DISTINCT product_id)` grouped by customer. *"List them"* is `GROUP_CONCAT(DISTINCT name ORDER BY name SEPARATOR ', ')` in MySQL (`STRING_AGG` in PostgreSQL and SQL Server). GROUP_CONCAT's result is cut at `group_concat_max_len`, 1,024 bytes by default — worth a sentence if the list can be long.

## Hierarchies and sequences

*"Everyone who reports to Asha, at any depth"*, *"the numbers 1 to 100"*, *"every date in March"* — recursive CTEs:

```sql
WITH RECURSIVE reports AS (
  SELECT id, name, 1 AS depth FROM employees WHERE manager_id = 7
  UNION ALL
  SELECT e.id, e.name, r.depth + 1
  FROM employees e JOIN reports r ON e.manager_id = r.id
)
SELECT * FROM reports;
```

## Bucketing

*"Orders by size band"*, *"users by age group"* — a `CASE` in both the SELECT and the GROUP BY (MySQL lets you group by the alias):

```sql
SELECT CASE WHEN amount < 100 THEN 'small'
            WHEN amount < 500 THEN 'medium'
            ELSE 'large' END AS band,
       COUNT(*) AS orders
FROM orders GROUP BY band;
```

Order the bands deliberately — alphabetical order (`large, medium, small`) is rarely what the reader wants; `ORDER BY MIN(amount)` sorts them by size.

## Using the sheet

When a question arrives, find its shape in the wording: "each … latest" is a ROW_NUMBER, "never" is an anti-join, "share" is a window sum, "compared with the previous" is LAG, "in a row" is LEAD or gaps and islands, "for every day, even empty ones" is a calendar. Then write the idiom, add the full ORDER BY, and mention the edge — ties, NULLs, empty groups — that the idiom handles or does not.
