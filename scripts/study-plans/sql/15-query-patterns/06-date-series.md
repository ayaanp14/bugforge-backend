---
title: Date series — calendars from recursive CTEs and filling missing days
minutes: 15
seo-title: Generate a Date Series in MySQL and Fill Missing Dates
description: Build a calendar in MySQL with a recursive CTE, LEFT JOIN your data to it so missing days show as zero, and make month series and cumulative totals.
question: How do you generate a series of dates in MySQL?
answer: MySQL has no generate_series function, so a date series comes from a recursive CTE: the anchor selects the start date, and the recursive part adds one day with `DATE_ADD(day, INTERVAL 1 DAY)` until it reaches the end date. LEFT JOIN the data to that calendar and use COALESCE to show the missing days as zero.
q: How do you fill missing dates in a SQL report?
a: Generate every date in the range, from a recursive CTE or a calendar table, and LEFT JOIN the data onto it, grouping by the calendar's date. Days with no data then appear with NULL aggregates, which `COALESCE(SUM(amount), 0)` or `COUNT(o.id)` turns into zeros.
q: What is the recursion limit for a CTE in MySQL?
a: MySQL stops a recursive CTE after 1,000 iterations by default, set by the `cte_max_recursion_depth` system variable, and raises an error rather than looping forever. A series longer than that needs the variable raised, or a calendar table, or a cross join of smaller number series.
q: Why use COUNT(o.id) and not COUNT(*) after a LEFT JOIN to a calendar?
a: A day with no orders still produces one row from the LEFT JOIN, with every order column NULL. `COUNT(*)` counts that row and reports 1, while `COUNT(o.id)` counts only non-NULL ids and correctly reports 0.
q: What is the PostgreSQL equivalent of a recursive date series?
a: PostgreSQL has `generate_series(start, stop, interval)`, for example `generate_series('2024-01-01'::date, '2024-01-31', interval '1 day')`, which returns the series directly. SQL Server uses a recursive CTE like MySQL, with `OPTION (MAXRECURSION n)` to allow more than 100 levels.
---
A report built from `GROUP BY day` has a quiet flaw: days with no data are not *zero*, they are *missing*. Ask for orders per day and a Sunday with no orders simply is not in the result. A chart then draws a straight line across it, a moving average treats the next row as the next day, and a manager reading the table never learns that Sunday was empty. Every serious daily, weekly or monthly report starts from a **date series** — one row per period, whether or not anything happened — and joins the data onto it. MySQL has no built-in series function, so this lesson builds one with a recursive CTE and shows the patterns that follow from it.

## A calendar from a recursive CTE

The recursive-CTE lesson counted from 1 to 10. A calendar is the same shape with dates:

```sql
WITH RECURSIVE calendar AS (
  SELECT DATE('2024-03-01') AS day           -- anchor: the first day
  UNION ALL
  SELECT DATE_ADD(day, INTERVAL 1 DAY)       -- recursive step: the next day
  FROM calendar
  WHERE day < '2024-03-07'                   -- stop condition
)
SELECT day FROM calendar ORDER BY day;
```

The anchor produces one row; each recursion takes the rows produced last time and adds one day, as long as the condition holds; the result is seven rows, the 1st to the 7th. The `WHERE` is checked against the *previous* row, so the last day produced is the first one that is not below the bound — here exactly `'2024-03-07'`.

Two MySQL specifics matter. First, the column's type comes from the anchor: `DATE('2024-03-01')` makes it a date. A bare string literal would make the column a short string type, and in strict mode the recursive part's longer values could be cut or rejected — the classic "Data too long for column" error in recursive CTEs. Cast the anchor (`DATE(…)` or `CAST(… AS DATE)`) to be safe. Second, MySQL stops any recursive CTE after **1,000 iterations** by default (`cte_max_recursion_depth`) and raises an error. Three years of days needs the variable raised for the session (`SET SESSION cte_max_recursion_depth = 2000;`) or a different source of rows.

The bounds rarely need to be typed in. Take them from the data:

```sql
WITH RECURSIVE bounds AS (
  SELECT MIN(ordered_on) AS first_day, MAX(ordered_on) AS last_day FROM orders
),
calendar AS (
  SELECT first_day AS day FROM bounds
  UNION ALL
  SELECT DATE_ADD(c.day, INTERVAL 1 DAY)
  FROM calendar AS c
  JOIN bounds AS b ON c.day < b.last_day
)
SELECT day FROM calendar;
```

`WITH RECURSIVE` is written once at the top, and it applies to the whole list — the first CTE does not have to be the recursive one.

## Filling the missing days

With a calendar, the report is a `LEFT JOIN` from the calendar to the data, grouped by the *calendar's* day:

```sql
WITH RECURSIVE calendar AS ( /* as above */ )
SELECT c.day,
       COUNT(o.id)                AS orders,
       COALESCE(SUM(o.amount), 0) AS revenue
FROM calendar AS c
LEFT JOIN orders AS o ON o.ordered_on = c.day
GROUP BY c.day
ORDER BY c.day;
```

Every detail here is load-bearing.

- The calendar is on the **left**. Every day survives; days with orders bring their rows along, days without bring one row of NULLs.
- **`COUNT(o.id)`, not `COUNT(*)`.** On an empty day the join still produces one row — the calendar row with NULLs on the order side. `COUNT(*)` counts that row and says 1; `COUNT(o.id)` counts only real orders and says 0. This is the most common bug in gap-filling queries, and a standard interview follow-up.
- **`COALESCE(SUM(…), 0)`.** `SUM` of no values is NULL, not 0.
- **Group by `c.day`.** `o.ordered_on` is NULL on empty days, so grouping by it would merge every empty day into one NULL group.
- If `ordered_on` were a `DATETIME`, the join would need `o.ordered_on >= c.day AND o.ordered_on < c.day + INTERVAL 1 DAY` — comparing a datetime to a date matches only midnight.

Any filter on the orders — only paid ones, only one store — belongs in the `ON` clause. Put it in `WHERE` and the NULL rows of empty days fail it, turning the left join back into an inner join and losing exactly the days you set out to keep.

## Months, weeks and other steps

The step can be any interval. A month series starts on the first of a month and adds `INTERVAL 1 MONTH`:

```sql
WITH RECURSIVE months AS (
  SELECT DATE('2024-01-01') AS month_start
  UNION ALL
  SELECT DATE_ADD(month_start, INTERVAL 1 MONTH)
  FROM months WHERE month_start < '2024-06-01'
)
SELECT DATE_FORMAT(m.month_start, '%Y-%m') AS month,
       COUNT(s.user_id) AS signups
FROM months AS m
LEFT JOIN signups AS s
  ON s.signed_up >= m.month_start
 AND s.signed_up <  DATE_ADD(m.month_start, INTERVAL 1 MONTH)
GROUP BY m.month_start
ORDER BY m.month_start;
```

Start month series on the 1st: adding a month to January 31st gives February 29th (in 2024), and the series then drifts to the 29th of every later month. Joining on a half-open range (`>=` start, `<` next start) rather than `DATE_FORMAT(s.signed_up, '%Y-%m') = …` also keeps the join sargable — an index on `signed_up` can be used.

A plain number series (`SELECT 1 AS n UNION ALL SELECT n + 1 … WHERE n < 100`) is useful in its own right: generating slots, splitting a string by position, expanding a quantity into that many rows.

## Cumulative totals over the filled series

Once every day is present, running totals and rolling windows behave. A window function over the grouped result runs after the `GROUP BY`:

```sql
SELECT c.day,
       COUNT(o.id) AS orders,
       SUM(COUNT(o.id)) OVER (ORDER BY c.day) AS orders_to_date
FROM calendar AS c
LEFT JOIN orders AS o ON o.ordered_on = c.day
GROUP BY c.day
ORDER BY c.day;
```

`SUM(COUNT(o.id)) OVER (…)` looks strange the first time: the inner `COUNT` is the group's aggregate, and the outer `SUM … OVER` is a window across the grouped rows. On an empty day the cumulative total carries forward unchanged, as it should, and a `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` frame over this result is now a true seven-day window — the fix the rolling-windows lesson promised.

## Calendar tables

Generating the series in every query is fine for reports over weeks or months. Teams that report by date constantly keep a permanent **calendar table** instead: one row per day for decades, with precomputed columns — year, quarter, month name, ISO week, weekday, `is_weekend`, `is_holiday`, fiscal period. It is filled once (by a recursive CTE, a script, or a spreadsheet import), is tiny by database standards (about 3,650 rows per decade), and turns questions like "working days between two dates" into a simple `COUNT(*) … WHERE NOT is_weekend AND NOT is_holiday`. Holidays cannot be computed by any function; a table is the only place to keep them.

## Other databases

PostgreSQL has `generate_series('2024-03-01'::date, '2024-03-07', interval '1 day')`, which replaces the recursive CTE entirely. SQL Server uses a recursive CTE like MySQL but stops at 100 levels by default; add `OPTION (MAXRECURSION 0)` (no limit) or a larger number to the statement. Oracle traditionally uses `CONNECT BY LEVEL <= n`. The LEFT JOIN, `COUNT(column)` and `COALESCE` parts are identical everywhere.

## How to say it in an interview

"Grouping by date drops days with no data, so I generate the dates with a recursive CTE — or use a calendar table — and LEFT JOIN the data onto it, counting a column from the right side and coalescing sums to zero." Mention the recursion limit and the filter-in-`ON` rule, and you have covered the follow-ups before they are asked.
