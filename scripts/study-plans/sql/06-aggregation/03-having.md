---
title: HAVING — filtering groups
minutes: 12
seo-title: SQL HAVING Clause: Filter Groups After GROUP BY
description: HAVING filters groups after GROUP BY using aggregates such as COUNT and SUM. How it differs from WHERE, finding duplicates, and combining both in one query.
question: What is the HAVING clause in SQL?
answer: `HAVING` filters groups after `GROUP BY` has formed them, so its conditions can use aggregate functions: `GROUP BY customer_id HAVING COUNT(*) >= 3` keeps only customers with at least three orders. `WHERE` filters individual rows before grouping and cannot use aggregates. A query may use both: `WHERE` decides which rows are grouped, `HAVING` which groups are returned.
q: What is the difference between WHERE and HAVING in SQL?
a: `WHERE` filters rows before grouping and cannot contain aggregate functions; `HAVING` filters groups after grouping and usually does. A condition on a plain column, such as `status = 'paid'`, belongs in `WHERE`, where it also reduces the work. A condition on an aggregate, such as `SUM(amount) > 500`, can only go in `HAVING`.
q: How do I find duplicate values in a SQL table?
a: Group by the column that should be unique and keep groups with more than one row: `SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1`. For duplicates across several columns, group by all of them. This is one of the most common SQL interview questions.
q: Can I use HAVING without GROUP BY?
a: Yes. Without `GROUP BY` the whole table is one group, so `SELECT COUNT(*) FROM orders HAVING COUNT(*) > 100` returns one row when there are more than 100 orders and no rows otherwise. It is legal but uncommon; most uses of `HAVING` follow a `GROUP BY`.
q: Can I use a column alias in HAVING?
a: In MySQL, yes: `SELECT customer_id, SUM(amount) AS total … HAVING total > 500` works. Standard SQL, PostgreSQL and SQL Server do not allow it, because `HAVING` is evaluated before `SELECT` names its columns, so portable code repeats the aggregate: `HAVING SUM(amount) > 500`.
---
`GROUP BY` produced one row per group. Very often only some groups matter: customers with at least three orders, products that sold more than 100 units, departments whose average salary is above a threshold, email addresses that appear more than once. The condition is about the *group* — a count or a total — not about any single row, so `WHERE` cannot express it. `HAVING` can. It is the `WHERE` of groups.

## Filtering on an aggregate

```sql
SELECT customer_id, COUNT(*) AS orders, SUM(amount) AS spent
FROM orders
GROUP BY customer_id
HAVING COUNT(*) >= 3
ORDER BY spent DESC, customer_id;
```

The rows are grouped by customer, the aggregates are computed per customer, and then `HAVING` throws away every group whose count is below 3. What survives is printed.

Trying the same with `WHERE` fails:

```sql
SELECT customer_id, COUNT(*) FROM orders
WHERE COUNT(*) >= 3          -- error: invalid use of group function
GROUP BY customer_id;
```

At `WHERE` time each row is still on its own, and "the count of this row's group" does not exist yet.

## Where HAVING sits in the order of execution

@figure where-vs-having

- `WHERE` sees individual rows and decides which ones are grouped.
- `HAVING` sees finished groups, with their aggregates, and decides which are kept.

Both can appear in one query, each doing its own job:

```sql
SELECT product_id, SUM(qty) AS units
FROM order_lines
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01'   -- rows: 2024 only
GROUP BY product_id
HAVING SUM(qty) > 100                                             -- groups: best sellers
ORDER BY units DESC, product_id;
```

Read it as: *of the 2024 order lines, group by product, keep the products that sold more than 100 units*.

## The classic: finding duplicates

"Find the duplicate emails" is one of the most asked SQL questions, and it is a `GROUP BY` with a `HAVING`:

```sql
SELECT email, COUNT(*) AS copies
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;
```

Group by the value that should be unique; any group with more than one row is a duplicate. For duplicates across several columns — the same person entered twice with the same name and birth date — group by all of them: `GROUP BY first_name, last_name, birth_date HAVING COUNT(*) > 1`. When the duplicates differ in case or spacing, normalise in the grouping: `GROUP BY LOWER(TRIM(email))`.

The same shape answers "values that appear exactly once" (`HAVING COUNT(*) = 1`), "customers who ordered from at least three categories" (`HAVING COUNT(DISTINCT category) >= 3`) and "days with no failed jobs" (`HAVING SUM(status = 'failed') = 0`).

## Conditions in HAVING

`HAVING` takes any condition that has one value per group — aggregates, grouping columns, and combinations of them with `AND`, `OR` and `NOT`:

```sql
HAVING COUNT(*) >= 3 AND SUM(amount) > 500
HAVING MAX(amount) > 2 * AVG(amount)              -- a group with an outlier
HAVING MIN(order_date) >= '2024-01-01'            -- customers whose first order is this year
HAVING COUNT(DISTINCT product_id) = 1             -- customers who only ever bought one product
```

The aggregate in `HAVING` does not have to be in the SELECT list. `HAVING AVG(rating) >= 4` filters on the average even if only the names are printed.

## Put row conditions in WHERE

A condition on a grouping column works in either clause:

```sql
SELECT region, SUM(amount) FROM orders WHERE region <> 'test' GROUP BY region;
SELECT region, SUM(amount) FROM orders GROUP BY region HAVING region <> 'test';
```

The results are the same, but the first is better: it removes the rows before grouping, so less work is done, and it tells the reader the condition is about rows. The rule of thumb: **if a condition does not need an aggregate, put it in `WHERE`**. Interviewers ask "what is the difference between WHERE and HAVING?" expecting exactly this: `WHERE` filters rows before grouping and cannot use aggregates; `HAVING` filters groups after grouping and can.

Some conditions are not interchangeable at all. "Customers whose orders are all above 50" is a group property:

```sql
HAVING MIN(amount) > 50
```

`WHERE amount > 50` would instead drop the small orders and keep every customer who has *any* order above 50 — a different question with a different answer.

## Aliases in HAVING

MySQL lets `HAVING` refer to a SELECT alias:

```sql
SELECT customer_id, SUM(amount) AS spent
FROM orders
GROUP BY customer_id
HAVING spent > 500;            -- MySQL only
```

Standard SQL, PostgreSQL and SQL Server reject that, because `HAVING` is evaluated before `SELECT` names its columns. Writing the aggregate again — `HAVING SUM(amount) > 500` — works everywhere and costs nothing: the database computes it once.

## HAVING without GROUP BY

With no `GROUP BY`, the whole table is a single group, and `HAVING` decides whether its one row is returned:

```sql
SELECT COUNT(*) AS late_orders
FROM orders
WHERE shipped_on > due_on
HAVING COUNT(*) > 0;
```

This returns a row only if there are late orders. It is legal and occasionally useful in alerting queries, but rare.

## Pitfalls

- An aggregate in `WHERE` — it belongs in `HAVING`.
- Row conditions in `HAVING` that should be in `WHERE`.
- `WHERE amount > 50` when the question means "every order of the group is above 50" (`HAVING MIN(amount) > 50`).
- Relying on SELECT aliases in `HAVING` in a database that is not MySQL.
- Forgetting `ORDER BY` after filtering groups.

## Key takeaways

- `HAVING` filters groups; `WHERE` filters rows.
- Only `HAVING` can test aggregates such as `COUNT(*)` and `SUM(x)`.
- Duplicates are `GROUP BY key HAVING COUNT(*) > 1`.
- Put conditions that need no aggregate in `WHERE`.
- MySQL accepts aliases in `HAVING`; portable SQL repeats the aggregate.
