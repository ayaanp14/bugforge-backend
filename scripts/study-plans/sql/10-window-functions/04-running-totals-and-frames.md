---
title: Running totals and frames — ROWS, RANGE and moving averages
minutes: 16
seo-title: SQL Running Total and Moving Average: ROWS vs RANGE Frames
description: A window frame picks which rows of the partition an aggregate sees. Running totals, moving averages, ROWS versus RANGE, the default frame and the ties trap.
question: How do you calculate a running total in SQL?
answer: Use `SUM` as a window function with an ORDER BY: `SUM(amount) OVER (ORDER BY day, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. Each row's sum covers the partition's first row through the current one. Add `PARTITION BY` to restart the total per account or customer, and order by a unique key so tied dates do not share one total.
q: What is the difference between ROWS and RANGE in a window frame?
a: `ROWS` counts physical rows, so `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` is exactly the current row and the two before it. `RANGE` works on the ORDER BY value, so the current row's frame includes every peer row with the same value, and offsets like `INTERVAL 7 DAY PRECEDING` are measured in values, not rows.
q: What is the default window frame in SQL?
a: With an ORDER BY in the window, the default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which includes the current row's ties. Without an ORDER BY, the frame is the whole partition. That default is why a running total repeats the same value on rows with equal dates.
q: How do you calculate a 7-day moving average in MySQL?
a: With one row per day and no gaps, use `AVG(value) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` and round it. When days can be missing, use a value-based frame, `RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW` on a date column, or fill the missing days first.
q: Why does my running total show the same value on two rows?
a: The rows tie on the window's ORDER BY, and the default RANGE frame treats tied rows as peers that are all included together, so each gets the total through the last of them. Add a unique tie-breaker to the ORDER BY or specify `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.
q: Which window functions ignore the frame?
a: Ranking functions (`ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE`, `PERCENT_RANK`, `CUME_DIST`) and `LAG`/`LEAD` work on the whole partition and ignore any frame clause. Aggregates used as window functions and `FIRST_VALUE`, `LAST_VALUE` and `NTH_VALUE` use the frame.
---
A running balance, a cumulative count of sign-ups, a 7-day moving average of visits, the share of the year's target reached so far — each is an aggregate over a *sliding* set of rows: everything up to this one, or the last few. Window functions express these with a **frame**: a clause inside `OVER` that says which rows of the partition, relative to the current row, the aggregate sees. Frames are where window functions get subtle, because the default frame is not what most people assume and it behaves differently when the ORDER BY has ties. This lesson covers running totals, frame syntax, `ROWS` versus `RANGE`, moving averages, the default frame and its ties trap, and which functions use frames at all.

## The running total

```sql
SELECT day, amount,
       SUM(amount) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM daily_sales
ORDER BY day;
```

```text
day        | amount | running_total
2024-03-01 | 100    | 100
2024-03-02 | 40     | 140
2024-03-03 | 60     | 200
2024-03-04 | 25     | 225
```

The window is ordered by `day`, and the frame `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` means "from the first row of the partition through this row". Each row's SUM covers a frame one row larger than the last. Add `PARTITION BY account` and the total restarts for every account — a running balance per account in one pass, where the pre-window answer was a correlated subquery summing every earlier row (quadratic work).

## Frame syntax

```text
{ROWS | RANGE} BETWEEN start AND end

start / end:
  UNBOUNDED PRECEDING     -- the partition's first row
  n PRECEDING             -- n rows (or n in value) before
  CURRENT ROW
  n FOLLOWING             -- n rows (or n in value) after
  UNBOUNDED FOLLOWING     -- the partition's last row
```

The short form `ROWS UNBOUNDED PRECEDING` means `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Some frames worth knowing by heart:

| Frame | Meaning |
| --- | --- |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | running total |
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | this row and the two before (3-row moving window) |
| `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` | centred 3-row window |
| `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` | from here to the end (remaining total) |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` | the whole partition |

The frame is clipped at the partition's edges: on the first row, "2 preceding" has no rows to include, so the frame is just the current row. A moving average's first values are therefore averages of fewer rows — be aware of it, and blank them out with `CASE WHEN ROW_NUMBER() OVER (…) >= 3 THEN … END` if the report wants only full windows.

## Moving averages

```sql
SELECT day, visits,
       ROUND(AVG(visits) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3
FROM daily_visits
ORDER BY day;
```

```text
day        | visits | moving_avg_3
2024-03-01 | 30     | 30
2024-03-02 | 60     | 45
2024-03-03 | 90     | 60
2024-03-04 | 30     | 60
2024-03-05 | 0      | 40
```

On 03-01 the frame is one row (30); on 03-02 two rows (30, 60 → 45); from 03-03 on, always three. `ROUND` matters: averages are rarely whole, and engines print different numbers of decimals. A moving SUM, MIN or MAX works the same way — "the highest price in the last five trades" is `MAX(price) OVER (ORDER BY traded_at, id ROWS BETWEEN 4 PRECEDING AND CURRENT ROW)`.

## ROWS versus RANGE

`ROWS` counts physical rows in the window's order. `RANGE` works on the *value* of the ORDER BY expression:

- `RANGE … CURRENT ROW` includes every **peer** — every row with the same ORDER BY value as the current row.
- `RANGE BETWEEN 5 PRECEDING AND CURRENT ROW` with `ORDER BY price` includes rows whose price is within 5 of the current row's price, however many rows that is.
- On a date column, MySQL accepts intervals: `RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW` is a true 7-*day* window even when some days have no rows (where `ROWS BETWEEN 6 PRECEDING` would reach back seven *rows*, possibly two weeks).

`RANGE` with a numeric or interval offset needs exactly one ORDER BY expression of a numeric or date type. PostgreSQL 11+ supports offsets too; SQL Server's RANGE accepts only `UNBOUNDED` and `CURRENT ROW`. There is also `GROUPS` (PostgreSQL, SQLite; not MySQL), which counts groups of peers.

## The default frame and the ties trap

If you write an ORDER BY in the window and no frame, the frame is:

```text
RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
```

That is a running total — *including all peers of the current row*. With a unique ORDER BY it is the same as the ROWS version. With ties, it is not:

```text
id | day        | amount | SUM … OVER (ORDER BY day) | ROWS UNBOUNDED PRECEDING (ORDER BY day, id)
1  | 2024-03-01 | 100    | 100                       | 100
2  | 2024-03-02 | 40     | 190                       | 140
3  | 2024-03-02 | 50     | 190                       | 190
4  | 2024-03-03 | 10     | 200                       | 200
```

Rows 2 and 3 share a day, so under the default RANGE frame each one's frame includes the other: both show 190. Sometimes that is exactly right — "total as of the end of each day". When you want a balance after each *transaction*, add a unique tie-breaker and use ROWS. Write the frame explicitly whenever you care; readers should not have to remember the default.

Without an ORDER BY in the window, the default frame is the entire partition, which is why `SUM(x) OVER (PARTITION BY g)` is the group total.

The same default explains the `LAST_VALUE` surprise from the previous lesson: with an ORDER BY, the frame ends at the current row's last peer, so the "last value" in the frame is (a peer of) the current row. Use `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` for the partition's real last value.

## Which functions use the frame

- **Use it:** aggregates as window functions (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`, …), `FIRST_VALUE`, `LAST_VALUE`, `NTH_VALUE`.
- **Ignore it:** `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE`, `PERCENT_RANK`, `CUME_DIST`, `LAG`, `LEAD` — they always work on the whole ordered partition. MySQL accepts a frame clause on them and silently ignores it.

## Running totals on top of aggregates

Frames apply after GROUP BY like every window, so a cumulative monthly total is a running SUM over a grouped query:

```sql
SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
       SUM(amount) AS revenue,
       SUM(SUM(amount)) OVER (ORDER BY DATE_FORMAT(order_date, '%Y-%m')
                              ROWS UNBOUNDED PRECEDING) AS cumulative
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;
```

And a running *count* of flags numbers groups: `SUM(is_new_session) OVER (PARTITION BY user_id ORDER BY ts, id ROWS UNBOUNDED PRECEDING)` gives each event its session number — the core of the gaps-and-islands patterns later in the course.

## Percent of running total

Combine a running sum with a whole-partition sum to show progress towards a total:

```sql
SELECT day, amount,
       ROUND(100 * SUM(amount) OVER (ORDER BY day ROWS UNBOUNDED PRECEDING)
                 / SUM(amount) OVER (), 1) AS pct_done
FROM daily_sales
ORDER BY day;
```

Two windows, two different frames, one row each — exactly the kind of report that once took three subqueries.

## Pitfalls

- Relying on the default frame and getting equal running totals on tied rows.
- `ROWS n PRECEDING` used as "n days" when days can be missing.
- Forgetting that early rows of a moving average cover fewer rows.
- Unrounded moving averages.
- Expecting a frame clause to change ROW_NUMBER, RANK or LAG.

## Key takeaways

- A frame chooses which rows of the partition an aggregate sees, relative to the current row.
- Running total: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` with a unique ORDER BY.
- Moving window: `ROWS BETWEEN n PRECEDING AND CURRENT ROW`; round averages.
- `ROWS` counts rows; `RANGE` uses values and includes peers; `RANGE INTERVAL n DAY` is a true day window.
- With ORDER BY the default frame is RANGE up to the current row (ties included); without it, the whole partition.
