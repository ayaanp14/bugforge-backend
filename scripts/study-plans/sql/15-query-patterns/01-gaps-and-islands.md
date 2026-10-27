---
title: Gaps and islands — finding runs and holes in ordered data
minutes: 16
seo-title: Gaps and Islands in SQL: Streaks, Runs and Missing Values
description: Gaps and islands in SQL: group consecutive rows with the row-number difference trick, flag run starts with LAG, and find missing ranges with LEAD.
question: What is the gaps and islands problem in SQL?
answer: The gaps and islands problem asks for the unbroken runs (islands) in ordered data, such as consecutive login days or sequential ids, and the holes between them (gaps). The standard solution subtracts a ROW_NUMBER from the ordered value, which stays constant along a run, then groups by that difference; LAG and LEAD find where runs start and where gaps open.
q: How do you find consecutive days in SQL?
a: Number each user's distinct dates with `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day)` and compute `DATE_SUB(day, INTERVAL rn DAY)`. Consecutive dates give the same result, so grouping by user and that value gives one row per streak, with `MIN(day)`, `MAX(day)` and `COUNT(*)`.
q: Why does subtracting ROW_NUMBER identify a run?
a: Inside a run both the value and the row number go up by exactly one per row, so their difference does not change. When a value is skipped, the value jumps by more than one while the row number still rises by one, so the difference changes and a new group begins.
q: How do you find missing numbers in a sequence in SQL?
a: Compare each value with the next one using `LEAD(n) OVER (ORDER BY n)`. Wherever the next value is more than one higher, the numbers from `n + 1` to `next - 1` are missing, which gives each gap as a start and an end in one pass.
q: What happens to the ROW_NUMBER trick when a date appears twice?
a: The duplicate gets its own row number while the date stays the same, so the difference drops by one and the run splits into two groups. Remove duplicates first with `SELECT DISTINCT` or use `DENSE_RANK()`, which gives equal dates the same number.
---
Ordered data has a shape that plain grouping cannot see. A user logged in on the 1st, 2nd and 3rd, then on the 5th: that is a three-day streak and a one-day streak, but nothing in the rows says so — the streak is a property of *neighbouring* rows. Ticket numbers 101 to 107 with 104 missing hold one hole. A sensor was on for six readings, off for two, on again. These questions are called **gaps and islands**: the islands are the unbroken runs, the gaps are the holes between them. They are among the most common "hard" SQL interview questions and they turn up constantly in real reporting — streaks, sessions, outages, sequence audits.

Two tools from the window-function module solve almost all of them: the **row-number difference** for islands, and **LAG/LEAD** for gaps and run boundaries.

## The row-number difference

Take one user's login dates, already distinct and ordered, and number them:

```sql
SELECT login_date,
       ROW_NUMBER() OVER (ORDER BY login_date) AS rn
FROM logins
WHERE user_id = 1;
```

```text
login_date | rn
2024-03-01 | 1
2024-03-02 | 2
2024-03-03 | 3
2024-03-05 | 4
2024-03-06 | 5
```

Now subtract `rn` days from each date:

```sql
SELECT login_date,
       DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (ORDER BY login_date) DAY) AS grp
FROM logins
WHERE user_id = 1;
```

```text
login_date | grp
2024-03-01 | 2024-02-29
2024-03-02 | 2024-02-29
2024-03-03 | 2024-02-29
2024-03-05 | 2024-03-01
2024-03-06 | 2024-03-01
```

Inside a run, the date and the row number both rise by one per row, so their difference is constant. At the hole (the 4th is missing), the date jumps by two while the row number still rises by one, so the difference changes. `grp` means nothing on its own — it is just a label every row of one island shares. Group by it:

```sql
WITH numbered AS (
  SELECT user_id, login_date,
         DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (
           PARTITION BY user_id ORDER BY login_date) DAY) AS grp
  FROM (SELECT DISTINCT user_id, login_date FROM logins) AS d
)
SELECT user_id,
       MIN(login_date) AS start_date,
       MAX(login_date) AS end_date,
       COUNT(*)        AS days
FROM numbered
GROUP BY user_id, grp
ORDER BY user_id, start_date;
```

Three details make this correct in general. `PARTITION BY user_id` restarts the numbering per user, so one user's streak never runs into another's. `SELECT DISTINCT` first: a user who logged in twice on the 2nd would otherwise get two row numbers for one date, and the difference would drop by one and split the streak. (`DENSE_RANK()` instead of `ROW_NUMBER()` handles duplicates too, because equal dates share a rank.) And the grouping includes `user_id` as well as `grp`, since two users can share a `grp` value by coincidence.

The same trick works on integers — `id - ROW_NUMBER() OVER (ORDER BY id)` — and on anything you can count in steps. For "consecutive rows where the status was `down`", number all rows and number the `down` rows separately; the difference of the two row numbers is constant within each run of `down`:

```sql
SELECT reading_no, status,
       ROW_NUMBER() OVER (ORDER BY reading_no)
     - ROW_NUMBER() OVER (PARTITION BY status ORDER BY reading_no) AS grp
FROM readings;
```

Group by `status, grp` and every run of equal statuses becomes one row, even when the reading numbers have no holes at all. That two-row-number version is the general form; the date version is the special case where the value itself counts in steps.

## Flagging run starts with LAG

The other approach marks where each island *starts* and then counts the starts with a running sum. A row starts a new island when the previous row is not its immediate predecessor:

```sql
WITH flagged AS (
  SELECT user_id, login_date,
         CASE WHEN DATEDIFF(login_date,
                LAG(login_date) OVER (PARTITION BY user_id ORDER BY login_date)) = 1
              THEN 0 ELSE 1 END AS is_start
  FROM (SELECT DISTINCT user_id, login_date FROM logins) AS d
),
islands AS (
  SELECT user_id, login_date,
         SUM(is_start) OVER (PARTITION BY user_id ORDER BY login_date) AS island_no
  FROM flagged
)
SELECT user_id, island_no, MIN(login_date) AS start_date, COUNT(*) AS days
FROM islands
GROUP BY user_id, island_no
ORDER BY user_id, island_no;
```

The first row of each user has no previous row, `LAG` returns NULL, `DATEDIFF` returns NULL, the comparison is not true, and the `ELSE 1` makes it a start — exactly right. The running `SUM` turns the flags into island numbers 1, 2, 3…

This version is longer, but it generalises better: the "same island" rule can be anything you can write in a `CASE`. Sessions that break after 30 idle minutes, prices that stay within 5% of the previous one, a status that has not changed — all are "start a new group when the condition between this row and the last one fails". Interviewers like seeing both versions, and like hearing which one you would choose when the rule is not "exactly one more".

## Finding the gaps

Gaps are the space between one island's end and the next island's start. With `LEAD`, compare each value with the next one:

```sql
SELECT ticket_no + 1 AS gap_start,
       next_no - 1   AS gap_end
FROM (
  SELECT ticket_no,
         LEAD(ticket_no) OVER (ORDER BY ticket_no) AS next_no
  FROM tickets
) AS t
WHERE next_no - ticket_no > 1
ORDER BY gap_start;
```

For tickets 101, 102, 103, 105, 106, 110 this returns `104 | 104` and `107 | 109`. The last row's `next_no` is NULL, the subtraction is NULL, and the `WHERE` drops it — no special case needed. If the sequence must also start at a known value (say every batch begins at 1), a hole before the first row is a separate question: compare `MIN(ticket_no)` with the expected start.

Before window functions, the classic answer was a self-join or `NOT EXISTS`: "values `n` where `n + 1` does not exist, and `n` is not the maximum" give the gap starts, and a correlated `MIN` of the larger values gives each gap's end. It still works and is worth recognising in older code, but it reads each row several times where `LEAD` reads it once.

## The longest streak

A frequent follow-up asks for each user's *longest* streak. Build the islands as a CTE, then rank them:

```sql
WITH islands AS ( /* user_id, start_date, end_date, days — as above */ ),
ranked AS (
  SELECT islands.*,
         ROW_NUMBER() OVER (PARTITION BY user_id
                            ORDER BY days DESC, start_date) AS rk
  FROM islands
)
SELECT user_id, start_date, end_date, days
FROM ranked
WHERE rk = 1;
```

The `start_date` in the ordering is the tie-breaker the question should specify — "if two streaks are equally long, report the earliest". Saying it aloud is part of the answer.

## In other databases

The pattern is portable; only the date arithmetic changes. PostgreSQL subtracts an integer from a date directly (`login_date - rn::int`, or `login_date - rn * INTERVAL '1 day'`), and SQL Server writes `DATEADD(day, -rn, login_date)`. MySQL's `DATE_SUB(d, INTERVAL n DAY)` accepts the window function inside the interval expression, as above. `LAG`, `LEAD`, `ROW_NUMBER` and `DENSE_RANK` behave the same in all of them (MySQL from 8.0; on 5.7 these problems were solved with user variables, a technique worth recognising in legacy code but not writing anew).

## How to say it in an interview

Name the pattern first: "This is gaps and islands." Then say which version you are writing and why: the row-number difference when consecutive means "exactly one step apart", the LAG flag and running sum when the rule is more general. Mention duplicates before you are asked — they are the usual hidden test — and finish with the ordering and the tie-breaker. That is the whole problem, and it is one most candidates find hard only because they have not seen the trick.
