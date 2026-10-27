---
title: Rolling windows — moving averages, sliding sums and period-over-period
minutes: 16
seo-title: SQL Moving Average and Rolling Sum with Window Frames
description: A rolling 7-day average in SQL with ROWS BETWEEN 6 PRECEDING, why ROWS breaks on missing dates, RANGE with INTERVAL, and week-over-week change with LAG.
question: How do you calculate a moving average in SQL?
answer: A moving average in SQL is a window function with a frame: `AVG(value) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` averages each row with the six rows before it. That counts rows, not days, so it is a 7-day average only when there is exactly one row per day; otherwise fill the missing days first or use a RANGE frame on the date.
q: What is the difference between ROWS and RANGE in a window frame?
a: ROWS counts physical rows: `2 PRECEDING` means the two rows before this one, whatever their values. RANGE works on the ORDER BY value: rows whose value lies within the stated distance are included, and rows with equal values are always in the frame together. RANGE is what a calendar window needs.
q: How do you calculate a rolling 7-day sum with missing dates?
a: Either build a calendar of every day with a recursive CTE, LEFT JOIN the data to it so missing days become zeros, and use `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`, or use a frame on the date itself: `RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW` in MySQL 8. A correlated subquery over the date range also works.
q: How do you calculate week-over-week change in SQL?
a: Aggregate to one row per week, then compare each week with the previous one using `LAG(total) OVER (ORDER BY week)`. The change is `total - LAG(total)`, and the percentage is `100 * (total - prev) / NULLIF(prev, 0)`, which returns NULL instead of failing when the previous week was zero.
q: Why does a moving average look wrong for the first rows?
a: The first rows have fewer rows before them than the window asks for, so the average covers a shorter span, such as one day instead of seven. Report NULL for those rows by checking `COUNT(*) OVER` the same frame, or start the report once the window is full.
---
A daily figure is noisy: sales spike on a Saturday, a holiday empties a Wednesday. A **rolling window** smooths it by summarising, for each row, the rows around it — the last seven days, the last three readings. The window-function module introduced frames; this lesson is about using them for the questions reports actually ask, and about the trap that catches most first attempts: a frame counts *rows*, and dates are not rows.

## The basic moving average

Given one row per day, a three-day moving average is an `AVG` over a frame of the current row and the two before it:

```sql
SELECT day, signups,
       ROUND(AVG(signups) OVER (
         ORDER BY day
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS avg_3d
FROM daily_signups
ORDER BY day;
```

The frame is evaluated for every row: on the 5th it covers the 3rd, 4th and 5th; on the 6th, the 4th, 5th and 6th. `ROWS 2 PRECEDING` is shorthand for the same frame. `SUM` in place of `AVG` gives a rolling total; `MAX` a rolling peak. The `ORDER BY` inside `OVER` decides what "preceding" means and is independent of the query's final `ORDER BY` — write both.

Add `PARTITION BY` when there are several series, so one store's window never borrows rows from the next store:

```sql
SUM(amount) OVER (PARTITION BY store_id ORDER BY day
                  ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
```

Frames can also look forward (`BETWEEN 1 PRECEDING AND 1 FOLLOWING` is a centred three-point average) and can be unbounded (`UNBOUNDED PRECEDING AND CURRENT ROW` is the running total from the earlier module).

## The incomplete first window

On the first day, the frame has only one row; on the second, two. The average is computed anyway, over the rows that exist, so the first values of a "3-day average" are really 1- and 2-day averages. A report should usually say so by printing NULL until the window is full. Count the rows in the same frame and test it:

```sql
SELECT day, signups,
       CASE WHEN COUNT(*) OVER w = 3
            THEN ROUND(AVG(signups) OVER w, 2) END AS avg_3d
FROM daily_signups
WINDOW w AS (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
ORDER BY day;
```

The `WINDOW` clause names a window once so two functions can share it — MySQL 8, PostgreSQL and SQLite all support it; SQL Server added it only in 2022. Writing the `OVER (…)` out twice is equally correct.

## Rows are not days

Now the trap. Suppose a shop has no payments on some days, and several payments on others:

```text
paid_on    | amount
2024-05-01 | 100
2024-05-01 | 50
2024-05-03 | 70
2024-05-09 | 30
```

`SUM(amount) OVER (ORDER BY paid_on ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` is not a seven-day sum here. On the 9th it adds the 9th's row and up to six rows before it — reaching back to the 1st, eight days earlier — and on the 1st the two payments get *different* sums, because each is a separate row. "Seven rows" equals "seven days" only when there is exactly one row per day. There are three fixes, and an interviewer will be pleased to hear all three named.

**First, aggregate to one row per day.** Always the first step for daily reports: `GROUP BY paid_on` with `SUM(amount)`. That solves the several-rows-per-day half.

**Second, fill the missing days.** Join the daily totals onto a calendar of every date (the date-series lesson builds one with a recursive CTE), with `COALESCE(total, 0)` for the empty days. Now there is exactly one row per day and the `ROWS` frame is a true seven-day window.

**Third, frame on the date instead of the row.** MySQL 8 supports a `RANGE` frame with an interval when the window is ordered by a date:

```sql
SUM(day_total) OVER (
  ORDER BY paid_on
  RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW)
```

`RANGE` includes every row whose `paid_on` is within six days before the current one, however many rows that is, so gaps no longer matter. PostgreSQL writes the interval as `INTERVAL '6 days'`; SQL Server supports `RANGE` only with `UNBOUNDED` or `CURRENT ROW` bounds, so there you fill the calendar or use the subquery below. (The exercises on this site run on an engine that does not take the interval form, so they use the other approaches.)

The portable fallback is a correlated subquery or self-join that states the window as a date condition:

```sql
WITH daily AS (
  SELECT paid_on, SUM(amount) AS day_total
  FROM payments GROUP BY paid_on
)
SELECT d.paid_on, d.day_total,
       (SELECT SUM(x.day_total) FROM daily AS x
        WHERE x.paid_on BETWEEN DATE_SUB(d.paid_on, INTERVAL 6 DAY) AND d.paid_on)
         AS week_total
FROM daily AS d
ORDER BY d.paid_on;
```

It reads naturally and runs everywhere. Its cost is one lookup per output row, which an index on the date makes cheap; the window version reads the data once.

## ROWS versus RANGE with ties

`RANGE` matters even without dates. With `ORDER BY score` and no explicit frame, the default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, and under `RANGE` all rows with an equal `score` are *peers* that enter the frame together. A running `SUM(…) OVER (ORDER BY score)` therefore jumps by the whole tie at once and prints the same total on every tied row. If you want a strictly row-by-row running total, either say `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` or make the order unique by adding a tie-breaker column. This default surprises many people, which is why interviewers ask about it.

## Period over period

"How did this week compare with last week?" is a rolling comparison of two buckets, not a frame. Aggregate to one row per period, then reach back one row with `LAG`:

```sql
WITH weekly AS (
  SELECT YEARWEEK(order_date, 3) AS yw, SUM(amount) AS total
  FROM orders GROUP BY YEARWEEK(order_date, 3)
)
SELECT yw, total,
       total - LAG(total) OVER (ORDER BY yw) AS change_abs,
       ROUND(100 * (total - LAG(total) OVER (ORDER BY yw))
             / NULLIF(LAG(total) OVER (ORDER BY yw), 0), 1) AS change_pct
FROM weekly
ORDER BY yw;
```

The first week has no previous week, so both columns are NULL. `NULLIF(prev, 0)` turns a zero denominator into NULL, so a week after an empty week gives NULL rather than a division error (MySQL would return NULL for division by zero anyway, with a warning; PostgreSQL and SQL Server raise an error). The same shape answers month-over-month and year-over-year, with `LAG(total, 12)` over monthly rows for "same month last year" — provided no month is missing, which is the calendar problem again.

## How to say it in an interview

"A moving average is AVG over a ROWS frame — but a ROWS frame counts rows, so first I aggregate to one row per day and fill missing days from a calendar, or I use a RANGE frame on the date." Mention the incomplete first window and how you would report it, and use `LAG` with `NULLIF` for period-over-period change. Those three sentences cover nearly every rolling-window question.
