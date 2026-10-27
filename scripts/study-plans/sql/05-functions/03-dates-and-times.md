---
title: Dates and times — types, parts and DATE_FORMAT
minutes: 14
seo-title: MySQL Date Functions: YEAR, MONTH, DAYNAME and Formatting
description: MySQL stores dates as DATE, DATETIME and TIMESTAMP. Extract parts with YEAR, MONTH and DAYNAME, format them as text, and filter date ranges correctly.
question: How do you get the year or month from a date in MySQL?
answer: MySQL has a function for each part of a date: `YEAR(d)`, `MONTH(d)`, `DAY(d)`, `QUARTER(d)`, `DAYNAME(d)`, `MONTHNAME(d)`, and `HOUR`, `MINUTE` and `SECOND` for times. `EXTRACT(YEAR FROM d)` is the standard spelling that PostgreSQL also accepts. To turn a date into formatted text, such as `2024-03` or `Mar 2024`, use `DATE_FORMAT(d, '%Y-%m')` with format specifiers.
q: What is the difference between DATETIME and TIMESTAMP in MySQL?
a: Both hold a date and a time. `DATETIME` stores the value exactly as given and covers years 1000 to 9999. `TIMESTAMP` is converted from the session time zone to UTC when stored and back when read, and covers 1970 to 2038. Use `TIMESTAMP` for moments in time across zones, `DATETIME` for calendar values.
q: How do I filter rows for one month in MySQL?
a: Use a half-open range on the column itself: `WHERE order_date >= '2024-03-01' AND order_date < '2024-04-01'`. It catches every time on the last day, works for `DATE` and `DATETIME`, and lets MySQL use an index. `WHERE MONTH(order_date) = 3` also works but matches every year and cannot use an index on the column.
q: Why does BETWEEN miss rows on the last day of a range?
a: With a `DATETIME` column, `BETWEEN '2024-03-01' AND '2024-03-31'` compares against midnight at the start of 31 March, so an order at 14:00 that day falls outside. Use `< '2024-04-01'` as the upper bound instead, which includes the whole final day.
q: What does DATE_FORMAT do in MySQL?
a: `DATE_FORMAT(d, format)` returns the date as text laid out by specifiers: `%Y` is the four-digit year, `%m` the two-digit month, `%d` the day, `%b` the short month name, `%W` the weekday name and `%H:%i` the 24-hour time. PostgreSQL uses `TO_CHAR` and SQL Server `FORMAT` for the same job.
q: How do I get the current date in MySQL?
a: `CURDATE()` returns today's date and `NOW()` returns the current date and time, both in the session time zone. `CURRENT_DATE` and `CURRENT_TIMESTAMP` are the standard spellings. Because their value changes every time a query runs, reports usually compare a stored date against them, as in `order_date >= CURDATE() - INTERVAL 7 DAY`.
---
Almost every business question has a date in it: sales this quarter, users who signed up in March, orders placed on weekends, the busiest hour of the day. MySQL stores dates in dedicated types and offers a function for every part of them, plus one function, `DATE_FORMAT`, that lays a date out as any text you need. This lesson covers the types, reading parts out of a date, formatting, and filtering by date — including the range mistake that quietly drops a day of data. The next lesson does arithmetic with dates.

## The types

| Type | Holds | Example literal |
| --- | --- | --- |
| `DATE` | a calendar day | `'2024-03-15'` |
| `TIME` | a time of day or a duration | `'14:30:00'` |
| `DATETIME` | a day and a time, stored as given | `'2024-03-15 14:30:00'` |
| `TIMESTAMP` | a moment, stored in UTC | `'2024-03-15 14:30:00'` |
| `YEAR` | a year | `2024` |

Date literals are written as strings in **`'YYYY-MM-DD'`** form, and times as `'HH:MM:SS'`. That ISO order matters: written that way, dates sort and compare correctly even as plain text, which is why every system that stores dates as strings uses it.

`DATETIME` and `TIMESTAMP` look the same in a result but behave differently. A `TIMESTAMP` is converted from the connection's time zone to UTC when stored and back when read, so two users in different zones see the same moment in their own local time; it also only reaches January 2038. A `DATETIME` is stored and returned exactly as written. A rule of thumb: `TIMESTAMP` (or `DATETIME` in UTC by convention) for "when did this happen", `DATE` for "which day is this about" — a birthday or a due date.

## The current date and time

```sql
SELECT CURDATE(), NOW(), CURRENT_DATE, CURRENT_TIMESTAMP;
```

`CURDATE()` is today; `NOW()` is the date and time the statement started. Their value depends on the clock, so their output differs every day — this course's exercises never print them, and you will see stored dates compared with fixed literals instead. In real reports they appear in filters: `WHERE created_at >= NOW() - INTERVAL 1 DAY`.

## Taking a date apart

Each part has its own function:

```sql
SELECT YEAR('2024-03-15')      AS y,     -- 2024
       MONTH('2024-03-15')     AS m,     -- 3
       DAY('2024-03-15')       AS d,     -- 15
       QUARTER('2024-03-15')   AS q,     -- 1
       DAYNAME('2024-03-15')   AS dn,    -- 'Friday'
       MONTHNAME('2024-03-15') AS mn,    -- 'March'
       DAYOFYEAR('2024-03-15') AS doy;   -- 75
```

For a `DATETIME`, `HOUR`, `MINUTE` and `SECOND` read the time, and `DATE(dt)` drops the time to leave the day: `DATE('2024-03-15 14:30:00')` is `'2024-03-15'`.

Weekdays come in two numberings, and mixing them up is a classic bug:

- `DAYOFWEEK(d)` is 1 for **Sunday** through 7 for Saturday (the ODBC standard).
- `WEEKDAY(d)` is 0 for **Monday** through 6 for Sunday.

So weekends are `DAYOFWEEK(d) IN (1, 7)` or `WEEKDAY(d) >= 5`. When in doubt, compare `DAYNAME(d)` with `'Saturday'` — slower to type, impossible to misread.

The standard SQL spelling is `EXTRACT(part FROM d)` — `EXTRACT(YEAR FROM d)`, `EXTRACT(MONTH FROM d)` — which MySQL and PostgreSQL both accept. SQL Server uses `YEAR(d)`, `MONTH(d)` and `DATEPART(weekday, d)`.

## Formatting: DATE_FORMAT

`DATE_FORMAT(d, format)` returns text, laid out by `%` specifiers. The ones you will use most:

| Specifier | Meaning | For 2024-03-05 14:07 |
| --- | --- | --- |
| `%Y` | four-digit year | `2024` |
| `%y` | two-digit year | `24` |
| `%m` | month, two digits | `03` |
| `%c` | month, no padding | `3` |
| `%M` / `%b` | month name / short | `March` / `Mar` |
| `%d` / `%e` | day, two digits / no padding | `05` / `5` |
| `%W` / `%a` | weekday name / short | `Tuesday` / `Tue` |
| `%H` / `%i` / `%s` | hour (24h), minutes, seconds | `14` / `07` / `00` |
| `%h` / `%p` | hour (12h), AM or PM | `02` / `PM` |

```sql
SELECT DATE_FORMAT('2024-03-05', '%Y-%m')        AS month_key,   -- '2024-03'
       DATE_FORMAT('2024-03-05', '%d %b %Y')     AS pretty,      -- '05 Mar 2024'
       DATE_FORMAT('2024-03-05 14:07:00', '%h:%i %p') AS clock;  -- '02:07 PM'
```

`DATE_FORMAT(d, '%Y-%m')` is the standard way to turn a date into a *month key* — a value every date in the same month shares, ideal for grouping by month in the next module. Note `%i` is minutes; `%m` is the month, a mistake everyone makes once.

The result of `DATE_FORMAT` is text. Sorting by `'%d %b %Y'` text sorts "01 Apr" before "05 Mar"; sort by the date column itself and only *display* the formatted value. PostgreSQL's equivalent is `TO_CHAR(d, 'YYYY-MM')` and SQL Server's `FORMAT(d, 'yyyy-MM')`. Going the other way, from text to a date, MySQL has `STR_TO_DATE('15/03/2024', '%d/%m/%Y')`.

## Filtering by date

Comparison operators work on dates as you would expect:

```sql
SELECT id, order_date
FROM orders
WHERE order_date >= '2024-03-01' AND order_date < '2024-04-01'
ORDER BY order_date, id;
```

That pattern — **greater than or equal to the first day, less than the first day of the next period** — is the reliable way to ask for a month, a quarter or a year. It is called a half-open range, and it has three advantages:

1. It works for `DATE` and `DATETIME` alike. `BETWEEN '2024-03-01' AND '2024-03-31'` on a `DATETIME` stops at midnight *starting* 31 March and silently drops every order placed later that day.
2. It never needs to know how many days a month has.
3. It compares the column itself, so an index on `order_date` can be used (Module 13).

The alternative, `WHERE YEAR(order_date) = 2024 AND MONTH(order_date) = 3`, gives the same rows and reads naturally, but wraps the column in functions, which rules out the index. For a small table it does not matter; for a large one it is the difference between a lookup and a scan. Function-based filters are the right tool when the question is about a *part* regardless of the period — "all orders ever placed on a Sunday" is `WHERE DAYNAME(order_date) = 'Sunday'`, and there is no range for that.

## Dates stored as text

Old schemas sometimes store dates in `VARCHAR` columns. If they are in `'YYYY-MM-DD'` form, comparisons and sorting still work, and MySQL's date functions accept them. If they are in `'15/03/2024'` form, nothing sorts correctly — convert them once with `STR_TO_DATE` into a real `DATE` column. A date type also rejects impossible values like `'2024-02-30'`, which a text column accepts without complaint.

## Pitfalls

- `BETWEEN` with a `DATETIME` column drops the last day after midnight.
- `DAYOFWEEK` starts at Sunday = 1; `WEEKDAY` starts at Monday = 0.
- `%m` is the month and `%i` the minutes in `DATE_FORMAT`.
- Sorting by formatted text instead of by the date.
- Printing `NOW()` and expecting the same output tomorrow.
- `TIMESTAMP` values shift with the session time zone; `DATETIME` values do not.

## Key takeaways

- Literals are `'YYYY-MM-DD'` and `'YYYY-MM-DD HH:MM:SS'`.
- `YEAR`, `MONTH`, `DAY`, `QUARTER`, `DAYNAME`, `HOUR` read the parts; `DATE()` drops the time.
- `DATE_FORMAT(d, '%Y-%m')` builds month keys; the result is text.
- Filter periods with `>= start AND < next_start`.
- `CURDATE()` and `NOW()` read the clock and belong in filters, not in judged output.
