---
title: Date arithmetic — INTERVAL, DATEDIFF and TIMESTAMPDIFF
minutes: 14
seo-title: MySQL Date Arithmetic: INTERVAL, DATEDIFF and TIMESTAMPDIFF
description: Add and subtract time in MySQL with INTERVAL, count days with DATEDIFF, months and years with TIMESTAMPDIFF, and find the first and last day of a month.
question: How do you find the difference between two dates in MySQL?
answer: `DATEDIFF(later, earlier)` returns the number of days between two dates, ignoring any time part, and is negative when the first date is earlier. For other units use `TIMESTAMPDIFF(unit, start, end)` — note the reversed order — with `MINUTE`, `HOUR`, `DAY`, `MONTH` or `YEAR`; it counts only whole units, so it is the right tool for ages and tenure.
q: How do I add days or months to a date in MySQL?
a: Use `DATE_ADD(d, INTERVAL n unit)` or the shorter `d + INTERVAL n unit`, where the unit is `DAY`, `WEEK`, `MONTH`, `YEAR`, `HOUR` or `MINUTE`. `DATE_SUB` and `- INTERVAL` subtract. Adding a month to 31 January gives the last day of February, because MySQL clamps the day to the end of a shorter month.
q: How do I calculate someone's age in years in SQL?
a: In MySQL use `TIMESTAMPDIFF(YEAR, birth_date, on_date)`, which counts only completed years, so a birthday later in the year is not counted early. Dividing `DATEDIFF` by 365 is wrong around birthdays and leap years. PostgreSQL uses `EXTRACT(YEAR FROM AGE(on_date, birth_date))`.
q: How do I get the first and last day of the month in MySQL?
a: `LAST_DAY(d)` returns the last day of the date's month, taking leap years into account. For the first day, use `DATE_FORMAT(d, '%Y-%m-01')`, or subtract the day number with `DATE_SUB(d, INTERVAL DAY(d) - 1 DAY)`. The first day of the next month is `LAST_DAY(d) + INTERVAL 1 DAY`.
q: What is the difference between DATEDIFF in MySQL and SQL Server?
a: MySQL's `DATEDIFF(end, start)` takes two dates and always returns days. SQL Server's `DATEDIFF(unit, start, end)` takes the unit first and the dates in the opposite order, and counts boundaries crossed, so `DATEDIFF(year, '2023-12-31', '2024-01-01')` is 1 there. MySQL's `TIMESTAMPDIFF` is the closer match to SQL Server's version.
---
Reading parts out of a date answers "when". Arithmetic answers "how long" and "by when": the due date of a loan, the number of days an invoice is overdue, a subscription's renewal, a customer's tenure in months, the users who came back within seven days. MySQL gives you three tools — `INTERVAL` to move a date, `DATEDIFF` to count days, and `TIMESTAMPDIFF` to count any unit — and one helper, `LAST_DAY`, for the month edges that make calendar arithmetic awkward.

## Moving a date: DATE_ADD and INTERVAL

`DATE_ADD(d, INTERVAL n unit)` returns the date moved forward by `n` units; `DATE_SUB` moves it back. The units are `SECOND`, `MINUTE`, `HOUR`, `DAY`, `WEEK`, `MONTH`, `QUARTER` and `YEAR`.

```sql
SELECT DATE_ADD('2024-03-15', INTERVAL 10 DAY)    AS plus_10_days,   -- '2024-03-25'
       DATE_SUB('2024-03-15', INTERVAL 2 WEEK)    AS minus_2_weeks,  -- '2024-03-01'
       DATE_ADD('2024-03-15', INTERVAL 1 YEAR)    AS next_year,      -- '2025-03-15'
       DATE_ADD('2024-03-15 23:30:00', INTERVAL 45 MINUTE) AS later; -- '2024-03-16 00:15:00'
```

MySQL also accepts the operator form: `order_date + INTERVAL 30 DAY` and `order_date - INTERVAL 1 MONTH` mean the same thing and read well inside a `WHERE`. A negative amount moves the other way, so `DATE_ADD(d, INTERVAL -7 DAY)` is a week earlier.

Adding to a `DATE` gives a `DATE`; adding hours or minutes, or adding to a `DATETIME`, gives a `DATETIME`. Never add a bare number to a date: `'2024-03-15' + 1` is not the 16th — MySQL turns the string into the number 2024 and adds 1. Always say `INTERVAL`.

## Months are not all the same length

Adding days is simple arithmetic. Adding months is calendar arithmetic, because a month has 28 to 31 days. MySQL's rule: keep the day number, and if the target month is too short, **clamp to its last day**.

```sql
SELECT DATE_ADD('2024-01-31', INTERVAL 1 MONTH) AS a,   -- '2024-02-29' (leap year)
       DATE_ADD('2023-01-31', INTERVAL 1 MONTH) AS b,   -- '2023-02-28'
       DATE_ADD('2024-02-29', INTERVAL 1 YEAR)  AS c,   -- '2025-02-28'
       DATE_ADD('2024-03-31', INTERVAL -1 MONTH) AS d;  -- '2024-02-29'
```

A consequence worth remembering: adding one month twice is not always adding two months. `'2024-01-31'` plus one month is `'2024-02-29'`, plus another is `'2024-03-29'` — but plus two months at once is `'2024-03-31'`. Billing systems compute every renewal from the original start date for this reason, not from the previous renewal.

## Counting days: DATEDIFF

`DATEDIFF(a, b)` returns `a − b` in days. The later date goes **first** for a positive answer, and any time part is ignored.

```sql
SELECT DATEDIFF('2024-03-15', '2024-03-01') AS a,          -- 14
       DATEDIFF('2024-03-01', '2024-03-15') AS b,          -- -14
       DATEDIFF('2024-03-01', '2024-02-01') AS c,          -- 29 (leap February)
       DATEDIFF('2024-03-02 00:01:00', '2024-03-01 23:59:00') AS d;   -- 1
```

The last line shows what "ignores the time" means: two minutes apart, but on different days, so the answer is 1. `DATEDIFF` counts calendar days, which is usually what a business question means by "days late".

A typical use is an overdue report:

```sql
SELECT id, due_date, returned_on,
       DATEDIFF(returned_on, due_date) AS days_late
FROM loans
WHERE returned_on > due_date
ORDER BY days_late DESC, id;
```

## Counting any unit: TIMESTAMPDIFF

`TIMESTAMPDIFF(unit, start, end)` returns `end − start` in the given unit, counting **whole** units only. Note the argument order is the opposite of `DATEDIFF`: start first, end second.

```sql
SELECT TIMESTAMPDIFF(MINUTE, '2024-03-15 09:00:00', '2024-03-15 10:45:00') AS mins,  -- 105
       TIMESTAMPDIFF(HOUR,   '2024-03-15 09:00:00', '2024-03-15 10:45:00') AS hrs,   -- 1
       TIMESTAMPDIFF(MONTH,  '2024-01-15', '2024-03-14') AS months_a,               -- 1
       TIMESTAMPDIFF(MONTH,  '2024-01-15', '2024-03-15') AS months_b,               -- 2
       TIMESTAMPDIFF(YEAR,   '2000-06-20', '2024-06-19') AS age;                    -- 23
```

"Whole units" is exactly the rule for ages and tenure: someone born on 20 June 2000 is still 23 on 19 June 2024. Dividing `DATEDIFF` by 365 gets birthdays wrong and drifts with leap years; `TIMESTAMPDIFF(YEAR, …)` does not.

## Month edges: LAST_DAY and the first of the month

`LAST_DAY(d)` returns the last day of `d`'s month, leap years included. The first day of a month has no dedicated MySQL function, but two idioms give it:

```sql
SELECT LAST_DAY('2024-02-10')                        AS month_end,     -- '2024-02-29'
       DATE_FORMAT('2024-02-10', '%Y-%m-01')         AS month_start,   -- '2024-02-01'
       DATE_SUB('2024-02-10', INTERVAL DAY('2024-02-10') - 1 DAY) AS also_start,
       DATE_ADD(LAST_DAY('2024-02-10'), INTERVAL 1 DAY) AS next_month; -- '2024-03-01'
```

`DAY(LAST_DAY(d))` is the number of days in the month — a common building block for "average per day this month" and for checking leap years.

## Rolling windows

Arithmetic with `INTERVAL` is how relative periods are written. Against a fixed reporting date:

```sql
-- orders in the 7 days up to and including 2024-03-15
SELECT id, order_date
FROM orders
WHERE order_date >  DATE_SUB('2024-03-15', INTERVAL 7 DAY)
  AND order_date <= '2024-03-15'
ORDER BY order_date, id;
```

In production the fixed date is usually `CURDATE()`. Notice the filter keeps the column bare and moves the arithmetic to the constant side — `order_date > CURDATE() - INTERVAL 7 DAY` can use an index, while `DATEDIFF(CURDATE(), order_date) < 7` cannot.

## Other databases

Interviewers often ask how this looks elsewhere:

- **PostgreSQL**: `d + INTERVAL '10 days'`, `d2 - d1` gives an integer number of days for `DATE` values, and `AGE(end, start)` returns an interval of years, months and days.
- **SQL Server**: `DATEADD(day, 10, d)` and `DATEDIFF(day, start, end)` — the unit first, then start, then end. It counts *boundaries crossed*, so `DATEDIFF(year, '2023-12-31', '2024-01-01')` is 1, unlike MySQL's `TIMESTAMPDIFF(YEAR, …)`, which is 0.
- **Standard SQL** has `INTERVAL` literals too; the MySQL `INTERVAL n UNIT` form is close to it.

## Pitfalls

- `DATEDIFF(later, earlier)` but `TIMESTAMPDIFF(unit, earlier, later)` — opposite orders.
- Adding a bare number to a date instead of an `INTERVAL`.
- Expecting `'2024-01-31' + INTERVAL 1 MONTH` to be in March.
- Ages from `DATEDIFF / 365`.
- Putting the column inside the function in a filter when the arithmetic could move to the constant.

## Key takeaways

- `DATE_ADD(d, INTERVAL n unit)`, `DATE_SUB`, or `d ± INTERVAL n unit` move a date.
- Month arithmetic clamps to the end of a shorter month.
- `DATEDIFF(a, b)` is calendar days `a − b`; `TIMESTAMPDIFF(unit, start, end)` counts whole units.
- `LAST_DAY(d)` is the month's end; `DATE_FORMAT(d, '%Y-%m-01')` its start.
- Keep the column bare in filters and do the arithmetic on the constant.
