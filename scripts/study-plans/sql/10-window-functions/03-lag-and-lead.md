---
title: LAG and LEAD — comparing a row with its neighbours
minutes: 14
seo-title: SQL LAG and LEAD Functions: Previous and Next Row in MySQL
description: LAG reads a value from an earlier row and LEAD from a later one, in the window order. Day-over-day change, gaps between events, defaults and first values.
question: What do LAG and LEAD do in SQL?
answer: `LAG(expr, n, default)` returns the value of `expr` from the row n positions before the current row, and `LEAD` from the row n positions after, in the order given by `OVER (PARTITION BY ... ORDER BY ...)`. n defaults to 1, and the default value, NULL unless given, is returned when no such row exists. They compute changes between consecutive rows without a self-join.
q: How do you calculate the difference from the previous row in SQL?
a: Subtract `LAG(value) OVER (ORDER BY day)` from `value`. The first row has no previous row, so LAG returns NULL and the difference is NULL; pass a default such as `LAG(value, 1, 0)` if the report needs a number. Add `PARTITION BY` to restart the comparison for each customer or product.
q: How do I calculate month over month growth in MySQL?
a: Aggregate revenue per month in a CTE, then use `LAG(revenue) OVER (ORDER BY month)` to put the previous month beside each one and compute `ROUND(100 * (revenue - prev) / prev, 1)`. The first month and a previous month of zero should give NULL rather than an error or a misleading number.
q: What is the difference between LAG and FIRST_VALUE?
a: `LAG` looks a fixed number of rows back from the current row, so its reference moves with every row. `FIRST_VALUE` returns the value from the first row of the window frame, which with the default frame is the first row of the partition, so every row compares with the same starting point.
q: How did people do LAG before MySQL 8?
a: With a self-join on the previous key, such as `t.day = DATE_ADD(prev.day, INTERVAL 1 DAY)`, or with a correlated subquery that selects the latest earlier row. Both are longer and slower, and the join only works when the keys are consecutive. Window functions arrived in MySQL 8.0.
---
Some questions are about change: how much did revenue move since yesterday, how many days passed between a customer's orders, did this reading go up or down. Each compares a row with the row *before* or *after* it in some order. Before window functions this took a self-join — join the table to itself on "the previous day" — which breaks the moment a day is missing. `LAG` and `LEAD` read a neighbouring row's value directly. This lesson covers both, their offset and default arguments, partitioning so comparisons stay inside one customer or product, the patterns they enable (change, growth, gaps, sessions) and their relatives `FIRST_VALUE`, `LAST_VALUE` and `NTH_VALUE`.

## The previous and the next row

```sql
SELECT day, revenue,
       LAG(revenue)  OVER (ORDER BY day) AS prev_revenue,
       LEAD(revenue) OVER (ORDER BY day) AS next_revenue
FROM daily_sales
ORDER BY day;
```

@figure lag-lead

`LAG(expr)` is `expr` evaluated on the previous row of the window's order; `LEAD(expr)` on the next. The first row has no previous row and the last no next one, so those cells are NULL. The window's `ORDER BY` is what "previous" means — it is required, and it should be unique (a tie on `day` would leave which row is "previous" up to the engine).

## Offset and default

The full form is `LAG(expr, offset, default)`:

```sql
LAG(revenue, 7)      OVER (ORDER BY day)   -- the value a week earlier (7 rows back)
LAG(revenue, 1, 0)   OVER (ORDER BY day)   -- 0 instead of NULL on the first row
LEAD(status, 2, 'none') OVER (ORDER BY step)
```

`offset` counts *rows*, not days. `LAG(revenue, 7)` is "a week ago" only if there is exactly one row per day with no gaps — fill the gaps first (the recursive date series from the last module) or compare on dates with a join.

The default replaces the NULL produced by a missing row only. If the previous row exists and its value is NULL, LAG returns that NULL; the default does not apply.

## Change and growth

```sql
SELECT day, revenue,
       revenue - LAG(revenue) OVER (ORDER BY day) AS change,
       ROUND(100 * (revenue - LAG(revenue) OVER (ORDER BY day))
                 / LAG(revenue) OVER (ORDER BY day), 1) AS growth_pct
FROM daily_sales
ORDER BY day;
```

Repeating the window three times is noisy; a named window or a CTE that computes `prev_revenue` once reads better:

```sql
WITH s AS (
  SELECT day, revenue, LAG(revenue) OVER (ORDER BY day) AS prev
  FROM daily_sales
)
SELECT day, revenue,
       revenue - prev AS change,
       ROUND(100 * (revenue - prev) / NULLIF(prev, 0), 1) AS growth_pct
FROM s
ORDER BY day;
```

`NULLIF(prev, 0)` turns a zero previous value into NULL, so the division deliberately gives NULL. MySQL's SELECT would return NULL with a warning anyway, but PostgreSQL and SQL Server raise a division-by-zero error, so the habit travels. The first row's change is NULL, which is correct — there is nothing to compare with.

Month-over-month growth is the same query over a monthly aggregate: group by `DATE_FORMAT(order_date, '%Y-%m')` in a CTE, then LAG over the months. Window functions run after GROUP BY, so you can even write `LAG(SUM(amount)) OVER (ORDER BY …)` in the grouped query itself.

## Partitioning: neighbours within a group

Without `PARTITION BY`, the "previous row" of a customer's first order is someone else's last order. Partition to keep each comparison inside its group:

```sql
SELECT customer, order_date,
       LAG(order_date) OVER (PARTITION BY customer ORDER BY order_date, id) AS prev_order,
       DATEDIFF(order_date,
                LAG(order_date) OVER (PARTITION BY customer ORDER BY order_date, id)) AS days_since_prev
FROM orders
ORDER BY customer, order_date, id;
```

Each customer's first order has `prev_order` NULL and `days_since_prev` NULL. `DATEDIFF(a, b)` in MySQL is `a - b` in days, so the later date goes first.

## Patterns built on LAG and LEAD

- **Gaps between events.** `DATEDIFF(day, LAG(day) …)` per user — churn analysis, "customers who came back after 30 days".
- **Streak and session boundaries.** Mark a row as the start of a new session when the gap since the previous event exceeds 30 minutes: `CASE WHEN TIMESTAMPDIFF(MINUTE, LAG(ts) OVER w, ts) > 30 OR LAG(ts) OVER w IS NULL THEN 1 ELSE 0 END`, then a running SUM of those flags numbers the sessions (frames lesson, and gaps-and-islands in the patterns module).
- **Status changes.** Keep the rows where `status <> LAG(status) OVER (PARTITION BY ticket ORDER BY changed_at)` — each transition once.
- **Duration of each state.** `LEAD(changed_at) OVER (PARTITION BY ticket ORDER BY changed_at)` is when this state ended; subtract to get how long it lasted. The last state's end is NULL — still open.
- **Increasing values.** `WHERE temperature > prev_temperature` in an outer query finds the days warmer than the day before — a classic interview exercise, best answered by comparing *dates* (`DATEDIFF(day, prev_day) = 1`) as well as values when days can be missing.

## FIRST_VALUE, LAST_VALUE and NTH_VALUE

These return a value from a fixed position *in the window frame* rather than relative to the current row:

```sql
SELECT dept, name, salary,
       FIRST_VALUE(name) OVER (PARTITION BY dept ORDER BY salary DESC, name) AS top_earner,
       salary - FIRST_VALUE(salary) OVER (PARTITION BY dept ORDER BY salary DESC, name) AS gap_to_top
FROM employees
ORDER BY dept, salary DESC, name;
```

`FIRST_VALUE` with the default frame is the first row of the partition — what you usually want. `LAST_VALUE` is the trap: with an ORDER BY, the default frame ends at the *current row* (and its ties), so `LAST_VALUE` returns the current row's own value, not the partition's last. Either reverse the order and use `FIRST_VALUE`, or extend the frame: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`. The frames lesson explains why. `NTH_VALUE(expr, n)` returns the nth row's value in the frame — NULL until the frame has n rows.

## In other databases

`LAG`, `LEAD`, `FIRST_VALUE`, `LAST_VALUE` and `NTH_VALUE` are standard and behave identically in PostgreSQL, SQL Server (2012+), Oracle and SQLite. SQL Server's `DATEDIFF(day, start, end)` takes the unit first and subtracts the other way round from MySQL's `DATEDIFF(end, start)` — a frequent porting bug. Oracle and recent SQL Server versions also support `IGNORE NULLS` on LAG/LEAD (skip NULL values when looking back); MySQL parses `RESPECT NULLS` but does not implement `IGNORE NULLS`.

## Pitfalls

- A non-unique window ORDER BY, making "previous" ambiguous.
- Forgetting PARTITION BY, so one customer's first row compares with another's last.
- Using a row offset as a time offset when days can be missing.
- Dividing by a previous value of 0 — use `NULLIF`.
- `LAST_VALUE` with the default frame returning the current row.

## Key takeaways

- `LAG(expr, n, default)` reads n rows back, `LEAD` n rows ahead, in the window's order.
- Missing neighbours give NULL or the default; the first change in a series is NULL.
- Partition to keep comparisons inside one entity; order uniquely.
- Change, growth, gaps, sessions and state durations are all LAG/LEAD patterns.
- `FIRST_VALUE` reads the frame's first row; `LAST_VALUE` needs a full frame to mean the partition's last.
