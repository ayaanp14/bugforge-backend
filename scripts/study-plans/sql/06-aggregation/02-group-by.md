---
title: GROUP BY — one summary row per group
minutes: 14
seo-title: SQL GROUP BY Explained: Grouping Rows and Multiple Columns
description: GROUP BY splits rows into groups and runs the aggregates once per group. Grouping by several columns and by expressions like the month, NULL groups and sorting.
question: What does GROUP BY do in SQL?
answer: `GROUP BY` splits the rows into groups that share the same values in the listed columns, and the aggregate functions then run once per group, giving one output row per group. `SELECT category, SUM(amount) FROM sales GROUP BY category` returns each category with its own total. Every non-aggregated column in the SELECT list should appear in the `GROUP BY`.
q: Can I GROUP BY multiple columns in SQL?
a: Yes. `GROUP BY region, product` makes one group for each distinct combination of region and product, so the result has a row per pair that actually occurs. The order of the columns in `GROUP BY` does not change the groups, only how you might choose to sort them afterwards with `ORDER BY`.
q: How do I group by month in MySQL?
a: Group by an expression that is the same for every date in a month, usually `DATE_FORMAT(order_date, '%Y-%m')`, or by two columns, `YEAR(order_date), MONTH(order_date)`. Grouping by `MONTH(order_date)` alone merges the same month from different years, which is rarely what a report means.
q: Does GROUP BY sort the results?
a: Not reliably. MySQL 5.7 and earlier sorted grouped results implicitly, but MySQL 8 removed that, and other databases never promised it. Always add an `ORDER BY` when the order of the groups matters, for example `ORDER BY total DESC, category`.
q: How does GROUP BY handle NULL values?
a: All the NULLs in a grouping column are put into one group, even though NULL is not equal to NULL in a comparison. Orders with no region therefore appear as a single row with region NULL. Use `COALESCE(region, 'unknown')` in both SELECT and GROUP BY to label it.
q: What is the difference between GROUP BY and DISTINCT?
a: `SELECT DISTINCT region FROM orders` and `SELECT region FROM orders GROUP BY region` return the same rows, and MySQL often runs them the same way. The difference is purpose: `DISTINCT` only removes duplicates, while `GROUP BY` exists to compute aggregates such as `COUNT(*)` or `SUM(amount)` for each group.
---
The previous lesson aggregated a whole table into one row. Real questions are almost always *per something*: revenue **per category**, orders **per customer**, sign-ups **per month**, average salary **per department**. `GROUP BY` is how SQL says "per". It splits the rows into groups that share a value, runs the aggregates once inside each group, and returns one row per group. Together with the aggregates it is the most used feature in analytical SQL.

## One group per value

```sql
SELECT category,
       COUNT(*)     AS orders,
       SUM(amount)  AS revenue
FROM orders
GROUP BY category
ORDER BY category;
```

Picture the rows sorted into piles, one pile per category; then `COUNT(*)` and `SUM(amount)` run on each pile separately:

```text
id | category | amount            category | orders | revenue
1  | books    | 20                books    | 2      | 55
2  | games    | 60      →         games    | 2      | 100
3  | books    | 35                toys     | 1      | 15
4  | toys     | 15
5  | games    | 40
```

Five rows in, three rows out — one per distinct category. A grouped query returns as many rows as there are groups, and a group exists only if at least one row has that value. A category with no orders does not appear at all; listing every category, including the empty ones, needs a join against a categories table (Module 7).

## The rule for the SELECT list

Once rows are grouped, each output row stands for a whole group. So everything in the `SELECT` list must have **one value per group**:

- a column listed in `GROUP BY` — it is the same for every row in the group;
- an aggregate — it computes one value from the group;
- an expression built from those two.

```sql
SELECT category, COUNT(*), MAX(amount), ROUND(AVG(amount), 2)   -- fine
FROM orders GROUP BY category;

SELECT category, customer_id, COUNT(*)                            -- which customer_id?
FROM orders GROUP BY category;
```

The second query asks for one `customer_id` per category when a category has many. Standard SQL rejects it; MySQL 8 rejects it too by default, with error 1055 — the `ONLY_FULL_GROUP_BY` rule, covered in detail in the grouping-pitfalls lesson.

## Grouping by several columns

List several columns and a group is each distinct **combination**:

```sql
SELECT region, category, SUM(amount) AS revenue
FROM orders
GROUP BY region, category
ORDER BY region, category;
```

```text
region | category | revenue
north | books | 20
north | games | 100
south | books | 35
south | toys | 15
```

Only combinations that occur are returned — there is no `north, toys` row because no such order exists. The order of columns inside `GROUP BY` does not change the groups; `ORDER BY` decides how they are printed.

## Grouping by an expression

You can group by any expression, which is how dates are rolled up into periods:

```sql
SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
       COUNT(*)                         AS orders,
       SUM(amount)                      AS revenue
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;
```

MySQL also lets you name the alias in `GROUP BY` — `GROUP BY month` — which saves repeating the expression. PostgreSQL allows that too; SQL Server does not, so portable code repeats the expression. Other useful groupings:

```sql
GROUP BY YEAR(order_date), MONTH(order_date)   -- year and month as numbers
GROUP BY DAYNAME(order_date)                    -- sales by weekday, every week together
GROUP BY FLOOR(age / 10) * 10                   -- age bands: 20, 30, 40…
GROUP BY amount >= 100                          -- two groups: 0 (small) and 1 (large)
GROUP BY LOWER(TRIM(email))                     -- addresses that differ only in case/spaces
```

Grouping by `MONTH(order_date)` alone puts March 2023 and March 2024 in the same group — sometimes intended (seasonality), usually a bug.

## WHERE before GROUP BY

`WHERE` filters rows **before** they are grouped, so it changes what each group contains:

```sql
SELECT category, COUNT(*) AS big_orders
FROM orders
WHERE amount >= 50
GROUP BY category
ORDER BY category;
```

Categories with no order of at least 50 disappear entirely, because none of their rows reaches the grouping. That is often what you want; when it is not — "every category, with its count of big orders, zero included" — use conditional aggregation (two lessons on) instead of `WHERE`.

The logical order of a grouped query is worth memorising, since many interview questions test it:

1. `FROM` — the rows
2. `WHERE` — keep some rows
3. `GROUP BY` — form groups
4. `HAVING` — keep some groups (next lesson)
5. `SELECT` — compute the output columns
6. `ORDER BY` — sort
7. `LIMIT` — cut

## Sorting groups

MySQL 5.7 and earlier sorted the result of `GROUP BY` by the grouping columns as a side effect; MySQL 8 does not, and no other database promises it. Always write `ORDER BY`. You can sort by an aggregate, which is how "top" questions are answered:

```sql
SELECT customer_id, SUM(amount) AS spent
FROM orders
GROUP BY customer_id
ORDER BY spent DESC, customer_id
LIMIT 3;
```

The second sort key breaks ties, so the top three is the same list every time.

## NULL forms one group

`GROUP BY` puts **all NULLs together in one group**, even though `NULL = NULL` is not true in a `WHERE`. Orders with no region come out as one row with region NULL:

```sql
SELECT COALESCE(region, 'unknown') AS region, COUNT(*) AS orders
FROM orders
GROUP BY COALESCE(region, 'unknown')
ORDER BY region;
```

Labelling the NULL group makes a report readable; leaving it out silently is a common way for totals not to add up.

## GROUP BY versus DISTINCT

With no aggregates, `GROUP BY` returns the distinct combinations, exactly like `SELECT DISTINCT`:

```sql
SELECT DISTINCT region FROM orders;
SELECT region FROM orders GROUP BY region;      -- same rows
```

Use `DISTINCT` to say "unique values" and `GROUP BY` when you compute something per group. Readers expect it that way round.

## Pitfalls

- A plain column in SELECT that is not in `GROUP BY`.
- Expecting groups with no rows to appear.
- Grouping by `MONTH(d)` when the report spans years.
- Relying on `GROUP BY` to sort.
- Filtering with `WHERE` when every group should still appear.
- Forgetting that NULLs form their own group.

## Key takeaways

- `GROUP BY` returns one row per distinct value (or combination) of its columns.
- Select only grouping columns, aggregates, and expressions of them.
- Group by expressions like `DATE_FORMAT(d, '%Y-%m')` to roll dates into periods.
- `WHERE` runs before grouping; `ORDER BY` after — always write it.
- All NULLs fall into one group.
