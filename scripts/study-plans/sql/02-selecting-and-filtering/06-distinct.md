---
title: DISTINCT — removing duplicate rows
minutes: 13
seo-title: SQL SELECT DISTINCT: Unique Values, Multiple Columns, COUNT
description: SELECT DISTINCT removes duplicate result rows across every selected column. How it treats NULL, DISTINCT on several columns, COUNT DISTINCT and GROUP BY.
question: What does SELECT DISTINCT do in SQL?
answer: `SELECT DISTINCT` removes duplicate rows from a query's result, so each combination of the selected columns appears only once. It applies to the whole row, not to the first column: `SELECT DISTINCT city, country` returns each city-and-country pair once. NULLs count as equal for this purpose, so all NULLs collapse into one row. It runs after WHERE and SELECT and before ORDER BY.
q: Does DISTINCT apply to all columns or just one?
a: To all the selected columns together. `SELECT DISTINCT dept, job` keeps one row per distinct pair, so the same department appears again for each different job. There is no syntax to make DISTINCT apply to only one column of several; for one row per department, group by it or use a window function.
q: What is the difference between COUNT(*) and COUNT(DISTINCT column)?
a: `COUNT(*)` counts rows, including duplicates and NULLs. `COUNT(DISTINCT column)` counts the different non-NULL values in that column. `COUNT(column)` sits between them: it counts rows where the column is not NULL, duplicates included.
q: How does DISTINCT treat NULL values?
a: All NULLs are treated as one value, so a column holding NULL in several rows contributes a single NULL row to a DISTINCT result. That is the one place SQL treats NULLs as equal; `NULL = NULL` in a WHERE clause is still unknown. `COUNT(DISTINCT col)` ignores NULLs altogether.
q: What is the difference between DISTINCT and GROUP BY?
a: For simply removing duplicates they return the same rows, and MySQL often runs them the same way. GROUP BY exists to compute aggregates per group, such as `COUNT(*)` or `SUM(amount)`; DISTINCT only removes duplicate output rows. Use DISTINCT to list unique values and GROUP BY to summarise.
---
A query returns one result row for every input row that survives `WHERE`. Often that means repetition: list the cities your customers live in and Pune appears forty times. `DISTINCT` collapses identical result rows into one. It is simple to write and easy to misread — it applies to the **whole row**, it treats NULLs as equal, and it is sometimes used to paper over a query that produces duplicates by mistake. This lesson covers all of that, plus `COUNT(DISTINCT …)` and how `DISTINCT` relates to `GROUP BY`.

## One row per value

```sql
SELECT city FROM customers ORDER BY city;
```

```text
city
Chennai
Pune
Pune
Pune
```

```sql
SELECT DISTINCT city FROM customers ORDER BY city;
```

```text
city
Chennai
Pune
```

`DISTINCT` goes right after `SELECT` and removes **duplicate result rows**. In the logical order it runs after `SELECT` has computed the columns and before `ORDER BY` sorts them. The opposite, `SELECT ALL`, is the default and is never written.

## DISTINCT applies to the whole row

`DISTINCT` is not a function of the first column; it compares entire result rows:

```sql
SELECT DISTINCT city, country FROM customers ORDER BY country, city;
```

returns each **(city, country) pair** once. Pune, India appears once however many customers live there; if another country also had a Pune, that pair would be a second row. A common mistake is writing `SELECT DISTINCT city, name` and expecting one row per city — every different name makes a different row, so the duplicates come back.

The parenthesised form is misleading:

```sql
SELECT DISTINCT(city), name FROM customers;
```

looks as if it applies to `city` only. It does not: the parentheses just surround the expression `city`, and `DISTINCT` still applies to `(city, name)`. Never write it that way. (PostgreSQL has `DISTINCT ON (col)` for "one row per value of col", which MySQL lacks; there you would use `GROUP BY` or a window function, both later in the course.)

## DISTINCT on expressions

`DISTINCT` compares the **computed** columns, so you can de-duplicate a derived value:

```sql
SELECT DISTINCT YEAR(order_date) AS order_year
FROM orders
ORDER BY order_year;
```

```text
order_year
2023
2024
```

## NULLs collapse into one

For `DISTINCT`, two NULLs count as the same value — the one place in SQL where NULLs are treated as equal. A column with NULL in five rows contributes a single NULL row:

```sql
SELECT DISTINCT dept FROM employees ORDER BY dept;
```

```text
dept
NULL
Sales
Support
```

In MySQL, NULL sorts **first** in ascending order (and last in descending), which is why it heads the list. PostgreSQL and Oracle do the opposite by default — NULLs last ascending — and offer `NULLS FIRST`/`NULLS LAST` to choose; MySQL does not have that syntax.

## Counting distinct values

How many different cities do customers come from? `COUNT(DISTINCT col)`:

```sql
SELECT COUNT(*)             AS customers,
       COUNT(city)          AS with_city,
       COUNT(DISTINCT city) AS cities
FROM customers;
```

```text
customers | with_city | cities
6 | 5 | 2
```

Three different counts, three different questions:

- `COUNT(*)` — rows, duplicates and NULLs included;
- `COUNT(city)` — rows where `city` is not NULL;
- `COUNT(DISTINCT city)` — different non-NULL values. NULL is **not** counted, even though `SELECT DISTINCT city` shows it as a row.

That last difference — `SELECT DISTINCT` shows one NULL row, `COUNT(DISTINCT)` ignores NULL — is a favourite interview "what does this return?". MySQL also accepts several columns, `COUNT(DISTINCT city, country)`, counting distinct pairs that have no NULL in them; that form is not standard.

## DISTINCT and ORDER BY

Because `DISTINCT` merges rows, `ORDER BY` after it may only use what survived — the selected columns (or expressions of them):

```sql
SELECT DISTINCT city FROM customers ORDER BY joined;   -- refused
```

Which `joined` should Pune be sorted by, when forty customers in Pune joined on forty dates? MySQL 8 refuses the query (`Expression #1 of ORDER BY clause is not in SELECT list`), as do PostgreSQL and SQL Server. Order by a selected column, or use `GROUP BY city ORDER BY MIN(joined)` to say which date you mean.

## DISTINCT versus GROUP BY

These return the same rows:

```sql
SELECT DISTINCT city FROM customers;
SELECT city FROM customers GROUP BY city;
```

and MySQL usually runs them the same way — by sorting or hashing the values. The difference is purpose. `GROUP BY` exists to **compute something per group** (`COUNT(*)`, `SUM(amount)`); `DISTINCT` only removes duplicate output rows. Use `DISTINCT` to list unique values, `GROUP BY` to summarise; the aggregation module takes `GROUP BY` from there.

## DISTINCT is not free, and not a fix

Removing duplicates means sorting or hashing the whole result — on a large result that is real work and memory. It is worth it when the question is "which different values?". It is a smell when it is added because "the query returned duplicates": usually a join matched more rows than intended, and `DISTINCT` hides the symptom while the query still does the extra work and may hide wrong totals. When you reach for `DISTINCT` to fix a result, first ask **why** the duplicates are there.

Another subtle case: `DISTINCT` is applied **before** `LIMIT`, so `SELECT DISTINCT city … ORDER BY city LIMIT 3` gives three *different* cities.

## Key takeaways

- `SELECT DISTINCT` removes duplicate result rows; it runs after `SELECT`, before `ORDER BY` and `LIMIT`.
- It applies to **all** selected columns together; `DISTINCT(col)` is just `DISTINCT col`.
- NULLs collapse into one row; MySQL sorts NULL first ascending.
- `COUNT(*)` rows, `COUNT(col)` non-NULL values, `COUNT(DISTINCT col)` different non-NULL values.
- After `DISTINCT`, `ORDER BY` may only use selected columns.
- Same rows as `GROUP BY` on those columns; `GROUP BY` is for aggregates.
- Don't use `DISTINCT` to hide duplicates a join created — find the cause.
