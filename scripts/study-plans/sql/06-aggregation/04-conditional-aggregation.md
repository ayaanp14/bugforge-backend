---
title: Conditional aggregation — SUM(CASE …) and pivots
minutes: 14
seo-title: SQL Conditional Aggregation: SUM CASE WHEN and Pivot Tables
description: Conditional aggregation puts a CASE inside SUM, COUNT or AVG to count several conditions in one pass: pivoting rows into columns, and rates with AVG.
question: What is conditional aggregation in SQL?
answer: Conditional aggregation puts a condition inside an aggregate, usually as `SUM(CASE WHEN condition THEN 1 ELSE 0 END)` or `COUNT(CASE WHEN condition THEN 1 END)`, so one query counts or totals several subsets at once. It turns rows into columns — paid, pending and refunded orders side by side per month — and keeps groups that a `WHERE` filter would have removed.
q: How do I count rows that match a condition in SQL?
a: Use `SUM(CASE WHEN condition THEN 1 ELSE 0 END)` or `COUNT(CASE WHEN condition THEN 1 END)`; the second works because `CASE` without `ELSE` gives NULL, which `COUNT` skips. In MySQL a comparison is already 1 or 0, so `SUM(status = 'paid')` is a shorter version that does not work in PostgreSQL or SQL Server.
q: How do I pivot rows into columns in MySQL?
a: MySQL has no `PIVOT` keyword, so write one conditional aggregate per output column: `SUM(CASE WHEN quarter = 1 THEN amount ELSE 0 END) AS q1`, then the same for `q2`, `q3` and `q4`, grouped by the row label. SQL Server has a `PIVOT` operator and PostgreSQL a `crosstab` function, but the `CASE` form works everywhere.
q: How do I calculate a percentage or rate with GROUP BY?
a: Divide a conditional count by the group's count: `ROUND(100 * SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) / COUNT(*), 1)`. `AVG(CASE WHEN … THEN 1 ELSE 0 END)` gives the same fraction directly. In PostgreSQL and SQL Server multiply by `100.0`, or integer division turns every rate into 0.
q: Why use SUM CASE instead of WHERE with GROUP BY?
a: `WHERE` removes rows before grouping, so a group with no matching rows disappears and only one condition can be counted per query. `SUM(CASE …)` keeps every group, shows a zero where nothing matched, and can count many conditions side by side in a single pass over the table.
---
`WHERE` and `GROUP BY` answer one question per query: *how many paid orders per month?* Reports usually want several answers side by side — paid, pending and refunded orders per month, in three columns, with a zero where there were none. Running three queries and gluing the results together is slow and clumsy. **Conditional aggregation** does it in one pass: put the condition *inside* the aggregate. It is the technique behind pivot tables, rates and percentages, and a large family of interview questions (monthly transaction reports, approval rates, "count by status").

## The idea: an aggregate over a CASE

An aggregate runs over the values of an expression. Make the expression 1 when a row qualifies and 0 when it does not, and `SUM` counts the qualifying rows:

```sql
SELECT DATE_FORMAT(created_on, '%Y-%m') AS month,
       COUNT(*) AS orders,
       SUM(CASE WHEN status = 'paid'     THEN 1 ELSE 0 END) AS paid,
       SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded
FROM orders
GROUP BY DATE_FORMAT(created_on, '%Y-%m')
ORDER BY month;
```

| month | orders | paid | pending | refunded |
| --- | ---: | ---: | ---: | ---: |
| 2024-01 | 4 | 3 | 0 | 1 |
| 2024-02 | 3 | 1 | 2 | 0 |

Every row of every month goes through all three `CASE`s; each row adds 1 to exactly one column. The month with no pending orders shows 0 — it did not disappear, which is what a `WHERE status = 'pending'` would have done to it.

## Three spellings of a conditional count

```sql
SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)   -- standard, everywhere
COUNT(CASE WHEN status = 'paid' THEN 1 END)        -- standard: no ELSE → NULL → not counted
SUM(status = 'paid')                               -- MySQL only: a comparison is 1 or 0
```

The `COUNT` form relies on `CASE` returning NULL when no branch matches and `COUNT(expr)` skipping NULLs. Writing `ELSE 0` there would be a bug — `COUNT` counts zeros. The MySQL shortcut is compact and common in MySQL code, but PostgreSQL rejects `SUM` of a boolean and SQL Server has no boolean expressions in that position, so use `CASE` in anything meant to travel. Note one difference: if `status` is NULL, `SUM(status = 'paid')` adds NULL (skipped), while the `CASE` form adds 0 — the totals are the same.

## Conditional sums of amounts

Return the amount instead of 1 and you get conditional totals:

```sql
SELECT customer_id,
       SUM(CASE WHEN status = 'paid'     THEN amount ELSE 0 END) AS paid_amount,
       SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS refunded_amount,
       SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)
     - SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS net
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
```

Use `ELSE 0` here rather than leaving it out: without it a customer with no refunds gets `NULL` for `refunded_amount`, and `net` becomes NULL too, because any arithmetic with NULL is NULL.

## Pivoting rows into columns

Turning the values of one column into separate output columns is called a **pivot**. Quarterly sales stored one row per sale become one row per product with a column per quarter:

```sql
SELECT product,
       SUM(CASE WHEN QUARTER(sold_on) = 1 THEN amount ELSE 0 END) AS q1,
       SUM(CASE WHEN QUARTER(sold_on) = 2 THEN amount ELSE 0 END) AS q2,
       SUM(CASE WHEN QUARTER(sold_on) = 3 THEN amount ELSE 0 END) AS q3,
       SUM(CASE WHEN QUARTER(sold_on) = 4 THEN amount ELSE 0 END) AS q4
FROM sales
WHERE sold_on >= '2024-01-01' AND sold_on < '2025-01-01'
GROUP BY product
ORDER BY product;
```

The rows of the output are the `GROUP BY`; the columns are the `CASE`s. MySQL has no `PIVOT` keyword (SQL Server does, and PostgreSQL has `crosstab` in an extension), so this pattern *is* how MySQL pivots — and it works on every database. Its limitation is that the columns must be known when the query is written; a pivot over values that change needs the query built by application code.

`MAX(CASE WHEN … THEN value END)` is the pivot form for *non-numeric* values — for example turning key/value rows (`attribute = 'color'`, `value = 'red'`) into one row per item with a column per attribute. Each group has at most one matching row, and `MAX` just picks it out of the NULLs.

## Rates and percentages

A rate is a conditional count divided by a count:

```sql
SELECT country,
       COUNT(*) AS trans_count,
       SUM(CASE WHEN state = 'approved' THEN 1 ELSE 0 END)  AS approved_count,
       ROUND(100 * SUM(CASE WHEN state = 'approved' THEN 1 ELSE 0 END) / COUNT(*), 1) AS approval_pct
FROM transactions
GROUP BY country
ORDER BY country;
```

`AVG` does the division for you: the average of a column of 1s and 0s is the fraction of 1s.

```sql
ROUND(100 * AVG(CASE WHEN state = 'approved' THEN 1 ELSE 0 END), 1) AS approval_pct
ROUND(AVG(rating >= 4), 2)                                          -- MySQL: share of good ratings
```

Two cautions. In PostgreSQL and SQL Server integer division turns `SUM(…) / COUNT(*)` into 0 — write `100.0 *`. And `AVG(CASE WHEN … THEN 1 END)` without `ELSE 0` averages only the 1s and always returns 1; the `ELSE 0` is what puts the non-matching rows in the denominator.

## Conditional MIN, MAX and DISTINCT counts

Any aggregate takes a `CASE`:

```sql
SELECT customer_id,
       MIN(CASE WHEN status = 'paid' THEN created_on END)            AS first_paid,
       MAX(CASE WHEN status = 'refunded' THEN created_on END)        AS last_refund,
       COUNT(DISTINCT CASE WHEN status = 'paid' THEN product_id END) AS products_bought
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
```

Here the absence of `ELSE` is deliberate: non-matching rows give NULL, and `MIN`, `MAX` and `COUNT(DISTINCT …)` skip NULLs. A customer with no refunds gets NULL for `last_refund`, which is the honest answer.

## Filtering on conditional aggregates

Conditional aggregates work in `HAVING` like any other:

```sql
SELECT customer_id
FROM orders
GROUP BY customer_id
HAVING SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) = 0     -- never refunded
   AND COUNT(*) >= 2
ORDER BY customer_id;
```

"Customers who bought A but never B" is the same shape: `HAVING SUM(CASE WHEN product = 'A' THEN 1 ELSE 0 END) > 0 AND SUM(CASE WHEN product = 'B' THEN 1 ELSE 0 END) = 0`.

Standard SQL also defines a `FILTER` clause — `COUNT(*) FILTER (WHERE status = 'paid')` — that PostgreSQL and SQLite support. MySQL does not, so in MySQL the `CASE` form is the way.

## Pitfalls

- `COUNT(CASE WHEN … THEN 1 ELSE 0 END)` counts every row — drop the `ELSE` or use `SUM`.
- `AVG(CASE WHEN … THEN 1 END)` without `ELSE 0` is always 1.
- Conditional sums without `ELSE 0` turning totals into NULL.
- Integer division in rates outside MySQL.
- Using `WHERE` for one condition when every group should stay.

## Key takeaways

- `SUM(CASE WHEN cond THEN 1 ELSE 0 END)` counts matching rows inside each group.
- Several conditional aggregates side by side pivot rows into columns.
- `AVG` over a 1/0 `CASE` is a rate; multiply by 100 for a percentage.
- `MIN`/`MAX`/`COUNT(DISTINCT)` over a `CASE` with no `ELSE` pick from the matching rows only.
- MySQL's `SUM(cond)` shortcut is not portable; `CASE` is.
