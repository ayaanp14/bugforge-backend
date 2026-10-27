---
title: Derived tables — a subquery in FROM
minutes: 16
seo-title: SQL Derived Tables: Subquery in FROM and Aggregate Before Join
description: A derived table is a subquery in FROM used as a temporary table: aggregate before joining to stop fan-out, aggregates of aggregates, and alias rules.
question: What is a derived table in SQL?
answer: A derived table is a subquery written in the `FROM` clause, such as `FROM (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id) AS t`. Its result behaves like a temporary table for the rest of the query: it can be joined, filtered and aggregated again. MySQL requires every derived table to have an alias.
q: What does "Every derived table must have its own alias" mean?
a: MySQL error 1248 is raised when a subquery in `FROM` has no name. Add an alias after the closing parenthesis, as in `FROM (SELECT …) AS totals`, and refer to its columns as `totals.column`. PostgreSQL also required an alias before version 16; SQL Server always requires one.
q: How do I avoid double counting when joining two one-to-many tables?
a: Aggregate each child table in its own derived table first, grouped by the parent key, then join those one-row-per-parent results to the parent. For example, join customers to per-customer order totals and to per-customer payment totals; each customer meets at most one row from each, so nothing is multiplied.
q: What is the difference between a derived table and a CTE?
a: They compute the same thing. A CTE names the subquery up front with `WITH name AS (…)` and can be referenced several times, and recursively; a derived table is written inline where it is used and can be referenced once. MySQL 8 supports both; CTEs are usually easier to read.
q: Can a derived table refer to columns of the outer query?
a: Not ordinarily: a derived table is computed independently of the other tables in the same `FROM`. MySQL 8.0.14 added `LATERAL` derived tables, which may refer to tables listed before them, for example `JOIN LATERAL (SELECT … WHERE o.customer_id = c.id LIMIT 3) AS t`.
---
A query's result is itself a table: rows and named columns. SQL lets you use that result wherever a table can go, including in `FROM` — a **derived table** (an *inline view* in Oracle's vocabulary). It is the tool for questions that need two steps of computation: aggregate, then compare the aggregates; summarise each child table, then join the summaries; rank, then filter on the rank. This lesson covers the syntax and its alias rule, the aggregate-before-join pattern that fixes fan-out, aggregates of aggregates, finding the top row per group by joining back, and where derived tables sit next to CTEs and `LATERAL`.

## Syntax

```sql
SELECT t.customer_id, t.total
FROM (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
) AS t
WHERE t.total >= 500
ORDER BY t.total DESC, t.customer_id;
```

The inner query runs and produces a table with columns `customer_id` and `total`; the outer query treats it as a table named `t`. Three rules:

- **an alias is mandatory** in MySQL — without `AS t` you get *ERROR 1248: Every derived table must have its own alias*;
- every computed column needs a name (`SUM(amount) AS total`), or the outer query cannot refer to it sensibly;
- the inner `ORDER BY` is meaningless without a `LIMIT` — a table has no order, and MySQL ignores it. Order in the outer query.

This particular example could have used `HAVING SUM(amount) >= 500`. Derived tables earn their place when one aggregation is not enough.

## Aggregates of aggregates

"What is the average customer's total spend?" needs the total per customer first, then the average of those totals:

```sql
SELECT ROUND(AVG(t.total), 2) AS avg_customer_spend
FROM (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
) AS t;
```

`AVG(SUM(amount))` is illegal — aggregates do not nest in one query level — so the inner level sums and the outer level averages. Note this is not the same number as the average order amount: a customer with ten small orders counts once here.

Combine it with a scalar subquery and you get "customers who spend more than the average customer":

```sql
SELECT c.name, t.total
FROM customers c
JOIN (
  SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id
) AS t ON t.customer_id = c.id
WHERE t.total > (
  SELECT AVG(x.total)
  FROM (SELECT SUM(amount) AS total FROM orders GROUP BY customer_id) AS x
)
ORDER BY t.total DESC, c.name;
```

The per-customer totals appear twice; a CTE (a later module) would name them once. Joining a derived table works like joining any table — it needs an `ON` condition, and it can be inner or outer.

## Aggregate before you join: the fan-out fix

The joins module showed the fan-out bug: joining customers to both orders and payments multiplies the rows and inflates both sums. The cure is to reduce each child to **one row per customer** before joining:

```sql
SELECT c.name,
       COALESCE(o.orders, 0)  AS orders,
       COALESCE(o.ordered, 0) AS ordered,
       COALESCE(p.paid, 0)    AS paid
FROM customers c
LEFT JOIN (
  SELECT customer_id, COUNT(*) AS orders, SUM(amount) AS ordered
  FROM orders GROUP BY customer_id
) AS o ON o.customer_id = c.id
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS paid
  FROM payments GROUP BY customer_id
) AS p ON p.customer_id = c.id
ORDER BY c.name;
```

Each derived table has at most one row per customer, so each customer row meets at most one row from each side — no multiplication, no `DISTINCT` tricks. The left joins keep customers with no orders or no payments, and `COALESCE` reports their figures as 0. This is the standard shape for any report that combines several independent child tables: invoices and refunds, logins and purchases, commits and reviews.

## Top row per group by joining back

Correlated subqueries found the latest order per customer. A derived table does the same with one aggregation and a join:

```sql
SELECT o.customer_id, o.id AS order_id, o.order_date
FROM orders o
JOIN (
  SELECT customer_id, MAX(order_date) AS last_date
  FROM orders
  GROUP BY customer_id
) AS m ON m.customer_id = o.customer_id AND m.last_date = o.order_date
ORDER BY o.customer_id, o.id;
```

The derived table holds one row per customer with their latest date; joining back on both columns picks the orders that sit on it (ties included, as before). On large tables this "group, then join back" form is often faster than the correlated version, because the aggregation runs once.

## How MySQL runs a derived table

MySQL either **merges** a simple derived table into the outer query — as if you had written the joins directly — or **materialises** it into an internal temporary table, which it may index automatically for the join. Derived tables with `GROUP BY`, `DISTINCT`, `LIMIT` or aggregates are materialised. Since 8.0.22, MySQL can also push a condition from the outer `WHERE` down into a materialised derived table (`derived_condition_pushdown`), so filtering outside does not always mean aggregating everything first. In the past, unnecessary derived tables could be slow; in MySQL 8 the bigger concern is readability.

## LATERAL derived tables

An ordinary derived table cannot refer to the other tables in the same `FROM`: it is computed on its own. MySQL 8.0.14 added `LATERAL`, which lifts that restriction — the derived table is evaluated per row of the tables before it, like a correlated subquery that returns rows:

```sql
-- each customer's three largest orders (MySQL 8.0.14+, PostgreSQL)
SELECT c.name, t.id, t.amount
FROM customers c
JOIN LATERAL (
  SELECT o.id, o.amount
  FROM orders o
  WHERE o.customer_id = c.id
  ORDER BY o.amount DESC, o.id
  LIMIT 3
) AS t ON TRUE;
```

SQL Server's equivalent is `CROSS APPLY` / `OUTER APPLY`. Window functions usually express the same "top n per group" more simply.

## Pitfalls

- Missing alias on a derived table (MySQL error 1248).
- Unnamed computed columns inside the derived table.
- An `ORDER BY` inside a derived table expected to order the final result.
- Joining raw child tables when per-parent aggregates were needed (fan-out).
- An inner join to a derived table of aggregates silently dropping parents with no child rows.

## Key takeaways

- A derived table is a subquery in `FROM`, used like a table; MySQL requires an alias.
- Use it for two-step questions: aggregate, then aggregate or filter the aggregates.
- Aggregate each child table per parent before joining — the clean fan-out fix.
- Group-then-join-back finds the top row per group, ties included.
- `LATERAL` (MySQL 8.0.14+) lets a derived table depend on earlier tables; CTEs name subqueries for reuse.
