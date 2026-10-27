---
title: Pivoting — turning rows into columns and back
minutes: 15
seo-title: Pivot Rows to Columns in MySQL with Conditional Aggregation
description: MySQL has no PIVOT operator: turn rows into columns with SUM(CASE WHEN) or MAX(CASE WHEN), unpivot columns into rows with UNION ALL, and add totals.
question: How do you pivot rows into columns in MySQL?
answer: MySQL has no PIVOT operator, so rows become columns with conditional aggregation: group by the row label and write one aggregate per output column, such as `SUM(CASE WHEN quarter = 1 THEN amount ELSE 0 END) AS q1`. Each CASE keeps only the values that belong in that column. For text values, use MAX(CASE ...) instead of SUM.
q: How do you unpivot columns into rows in SQL?
a: Write one SELECT per column and stack them with UNION ALL: `SELECT id, 'maths' AS subject, maths AS score FROM t UNION ALL SELECT id, 'physics', physics FROM t`. Filter out NULLs if an empty cell should not become a row. SQL Server also has an UNPIVOT operator; MySQL does not.
q: Why use ELSE 0 in a pivot's CASE expression?
a: Without ELSE, the CASE returns NULL for rows that do not match, and if no row in a group matches, SUM returns NULL rather than 0. `ELSE 0` or wrapping the SUM in `COALESCE(..., 0)` makes an empty cell print 0, which is usually what a report wants.
q: Can MySQL pivot when the column values are not known in advance?
a: Not in a single static query, because the output columns of a SELECT are fixed when it is written. A dynamic pivot builds the SQL text with `GROUP_CONCAT` over the distinct values and runs it as a prepared statement, or the application pivots the grouped rows itself.
q: What is the difference between SUM(CASE) and COUNT(CASE) in a pivot?
a: `SUM(CASE WHEN cond THEN amount END)` adds the matching amounts, while `COUNT(CASE WHEN cond THEN 1 END)` counts the matching rows, because COUNT skips the NULLs the unmatched rows produce. In MySQL, `SUM(cond)` also counts matches, since a true comparison is 1.
---
A query result has a fixed set of columns and any number of rows. Reports often want the opposite shape: one row per region and a column per quarter, one row per student and a column per subject, one row per day and a column per status. Turning the values of one column into column *headers* is a **pivot**; turning columns back into rows is an **unpivot**. SQL Server and Oracle have a `PIVOT` keyword for it; MySQL does not, and does not need one, because conditional aggregation does the same job in plain SQL that runs everywhere.

## The long shape and the wide shape

Data is normally stored *long*: one row per fact.

```text
region | sale_date  | amount
North  | 2024-01-15 | 200
North  | 2024-05-02 | 150
South  | 2024-02-20 | 300
South  | 2024-11-30 | 120
```

A report wants it *wide*:

```text
region | q1  | q2  | q3 | q4
North  | 200 | 150 | 0  | 0
South  | 300 | 0   | 0  | 120
```

Long is right for storage — a new quarter is a new row, not a schema change — and wide is right for reading. A pivot is the query that goes from one to the other.

## Conditional aggregation

The pivot is a `GROUP BY` on the row label (region) with one aggregate per output column. Each aggregate looks at every row of the group but only *counts* the ones that belong in its column:

```sql
SELECT region,
       SUM(CASE WHEN QUARTER(sale_date) = 1 THEN amount ELSE 0 END) AS q1,
       SUM(CASE WHEN QUARTER(sale_date) = 2 THEN amount ELSE 0 END) AS q2,
       SUM(CASE WHEN QUARTER(sale_date) = 3 THEN amount ELSE 0 END) AS q3,
       SUM(CASE WHEN QUARTER(sale_date) = 4 THEN amount ELSE 0 END) AS q4,
       SUM(amount) AS total
FROM sales
GROUP BY region
ORDER BY region;
```

Read one column at a time: for `q1`, a row from January to March contributes its amount and every other row contributes 0. The `ELSE 0` matters. Without it, the CASE yields NULL for non-matching rows; `SUM` ignores NULLs, which is fine — until a region has *no* sale in a quarter, when every input is NULL and `SUM` returns NULL instead of 0. Either write `ELSE 0` or wrap the sum: `COALESCE(SUM(CASE … END), 0)`.

The `total` column is just another aggregate over the same group; it costs nothing extra. If you want a total *row* as well, MySQL has `GROUP BY region WITH ROLLUP`, which adds a row with `region` NULL holding the column totals. PostgreSQL and SQL Server write `GROUP BY ROLLUP (region)`. Alternatively, `UNION ALL` a second query without the `GROUP BY` — it works everywhere and lets you label the row `'Total'`.

The data does not have to be grouped by a column it holds directly — `QUARTER(sale_date)` is computed per row inside the CASE. That makes conditional aggregation a natural fit for date reports: by month (`MONTH(d) = 1`), by weekday, by hour.

## Counting instead of summing

Many pivots count rows rather than add amounts — tickets per status per month:

```sql
SELECT DATE_FORMAT(opened_on, '%Y-%m') AS month,
       COUNT(CASE WHEN status = 'open'   THEN 1 END) AS open_count,
       COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed_count,
       COUNT(*) AS total
FROM tickets
GROUP BY DATE_FORMAT(opened_on, '%Y-%m')
ORDER BY month;
```

`COUNT(expr)` counts non-NULL values, and a CASE without ELSE is NULL when it does not match, so each `COUNT` counts only its rows. MySQL offers a shorter spelling: a comparison is `1` when true and `0` when false, so `SUM(status = 'open')` counts the open tickets. It is idiomatic MySQL and reads well, but it is not portable — PostgreSQL has a real boolean type and refuses to `SUM` it (there you write `COUNT(*) FILTER (WHERE status = 'open')`, PostgreSQL's own conditional-aggregate syntax).

## Pivoting text

When the cell is a value rather than a number to add — each student's grade per subject — use `MAX` (or `MIN`) around a CASE with no ELSE:

```sql
SELECT student,
       MAX(CASE WHEN subject = 'maths'   THEN grade END) AS maths,
       MAX(CASE WHEN subject = 'physics' THEN grade END) AS physics
FROM grades
GROUP BY student
ORDER BY student;
```

There is one matching row per (student, subject), so `MAX` simply picks it out of the NULLs; a missing subject prints NULL, which is honest. If there could be several rows per cell, decide which one you want — the latest, the highest — before relying on `MAX`.

## Unpivoting

The reverse direction appears when data arrives wide, as from a spreadsheet: one row per student with a column per subject. Normalising it back into rows is a stack of SELECTs, one per column:

```sql
SELECT student, 'maths' AS subject, maths AS score FROM scores
UNION ALL
SELECT student, 'physics', physics FROM scores
UNION ALL
SELECT student, 'chemistry', chemistry FROM scores
ORDER BY student, subject;
```

`UNION ALL`, not `UNION`: a student with the same score in two subjects must keep both rows, and `UNION` would also pay for a needless duplicate check. The column names come from the first SELECT. Add `WHERE maths IS NOT NULL` (and so on) to each part if an empty cell should not become a row. SQL Server and Oracle have an `UNPIVOT` operator; MySQL 8 can also unpivot with a `CROSS JOIN` to a derived table of the column names plus a CASE, but `UNION ALL` is the version everyone reads instantly.

## When the columns are not known in advance

A SELECT's output columns are fixed when the query is written. A pivot over "every status that exists" — values you do not know in advance — cannot be written as one static query in any SQL dialect. The MySQL workaround builds the query text itself:

```sql
SELECT GROUP_CONCAT(DISTINCT
         CONCAT('SUM(status = ''', status, ''') AS `', status, '`'))
INTO @cols FROM tickets;
SET @sql = CONCAT('SELECT month, ', @cols, ' FROM … GROUP BY month');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
```

That is a stored-procedure technique, worth recognising in an interview; in practice most teams return the long, grouped rows and let the application or the reporting tool pivot them. PostgreSQL's `crosstab` function (from the `tablefunc` extension) has the same limitation — it still needs the output column list.

## How to say it in an interview

"MySQL has no PIVOT, so I group by the row label and write one conditional aggregate per column — SUM of a CASE for amounts, COUNT of a CASE for counts, MAX of a CASE for text — with ELSE 0 so empty cells print zero." For the reverse, "UNION ALL one SELECT per column." If asked about unknown columns, say the column list must be known when the query is written, and describe the prepared-statement workaround.
