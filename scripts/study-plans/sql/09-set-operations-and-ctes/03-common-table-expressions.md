---
title: Common table expressions — naming the steps of a query
minutes: 15
seo-title: SQL CTE Explained: WITH Clause in MySQL 8 With Examples
description: A common table expression names a subquery with WITH so the main query reads it like a table. Chaining CTEs, reuse, and CTEs versus subqueries and views.
question: What is a CTE in SQL?
answer: A common table expression (CTE) is a named, temporary result set defined with a `WITH` clause at the start of a statement and read by the query after it as if it were a table. It exists only for that one statement. CTEs let you split a long query into named steps, reuse one intermediate result several times, and, with `WITH RECURSIVE`, walk hierarchies. MySQL supports them from version 8.0.
q: What is the difference between a CTE and a subquery?
a: They compute the same things; a CTE gives the subquery a name and moves it to the top of the statement. That makes long queries read top to bottom, lets later CTEs and the main query refer to it more than once, and allows recursion. A derived table in FROM must be repeated in full to be used twice.
q: What is the difference between a CTE and a temporary table?
a: A CTE lives only inside the one statement that defines it and is never stored as an object; a temporary table is created with `CREATE TEMPORARY TABLE`, lasts for the session, can be indexed and can be read by many statements. Use a CTE for structure inside a query and a temporary table to reuse a result across queries.
q: Can you use multiple CTEs in one query?
a: Yes. Write `WITH` once and separate the definitions with commas: `WITH a AS (...), b AS (...) SELECT ...`. Each CTE can read the ones defined before it, so a chain of CTEs works like a pipeline of named steps, and the final SELECT can read any of them.
q: Are CTEs faster than subqueries?
a: Not by themselves. MySQL usually merges a CTE into the outer query exactly like a derived table, so the plan is often identical. When a CTE is referenced more than once, MySQL may materialize it once and reuse it, which can save work. Choose CTEs for readability and measure when speed matters.
q: Does MySQL 5.7 support the WITH clause?
a: No. Common table expressions, including recursive ones, arrived in MySQL 8.0. On MySQL 5.7 the same query must be written with derived tables in FROM, repeated wherever the result is needed, or with a temporary table created first.
---
A query that answers a real business question is rarely one SELECT. "Which departments pay above the company average, and by how much?" needs the average per department, the company average, and then a comparison — three steps. Written with derived tables, the steps nest inside one another and the query reads inside out. A **common table expression** (CTE) gives each step a name at the top of the statement, so the query reads top to bottom like a recipe. CTEs are standard SQL, supported by MySQL since 8.0, and the shape most interviewers expect a multi-step answer in. This lesson covers the syntax, chaining, reuse, how CTEs compare to subqueries, views and temporary tables, and the habits that keep them readable.

## The syntax

```sql
WITH dept_avg AS (
  SELECT dept, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY dept
)
SELECT dept, ROUND(avg_salary, 2) AS avg_salary
FROM dept_avg
WHERE avg_salary > 60000
ORDER BY avg_salary DESC, dept;
```

`WITH name AS ( query )` defines the CTE; the statement that follows reads `name` exactly like a table — in FROM, in a join, in a subquery. The CTE exists only for this one statement: the next query cannot see `dept_avg`, and nothing is stored.

You can name the columns in a list instead of with aliases inside:

```sql
WITH dept_avg (dept, avg_salary) AS (
  SELECT dept, AVG(salary) FROM employees GROUP BY dept
)
SELECT * FROM dept_avg;
```

Both are fine; the inner aliases keep each name beside its expression and are the more common style.

## Chaining CTEs

Write `WITH` once and separate the definitions with commas. Each CTE may read every CTE defined *before* it:

```sql
WITH dept_avg AS (
  SELECT dept, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY dept
),
company AS (
  SELECT AVG(salary) AS avg_salary FROM employees
)
SELECT d.dept,
       ROUND(d.avg_salary, 2) AS avg_salary,
       ROUND(d.avg_salary - c.avg_salary, 2) AS above_company
FROM dept_avg d
CROSS JOIN company c
WHERE d.avg_salary > c.avg_salary
ORDER BY above_company DESC, d.dept;
```

`company` has exactly one row, so the cross join attaches the company average to every department row — a common, deliberate use of CROSS JOIN. Read the statement top to bottom: averages per department, the company average, then the comparison. Each step can be tested alone by running its SELECT, which is the most practical benefit of the style.

A longer pipeline follows the same pattern: clean the raw rows, aggregate them, rank or filter, then present.

```sql
WITH paid AS (               -- step 1: the rows that count
  SELECT customer_id, amount FROM orders WHERE status = 'paid'
),
totals AS (                  -- step 2: one row per customer
  SELECT customer_id, SUM(amount) AS total FROM paid GROUP BY customer_id
),
grand AS (                   -- step 3: one number
  SELECT SUM(total) AS grand_total FROM totals
)
SELECT t.customer_id,
       t.total,
       ROUND(100 * t.total / g.grand_total, 1) AS pct
FROM totals t CROSS JOIN grand g
ORDER BY t.total DESC, t.customer_id;
```

## Reusing one CTE

A derived table is written where it is used; to use the same result twice you must write it twice. A CTE is written once and referenced as often as needed:

```sql
WITH monthly AS (
  SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, SUM(amount) AS revenue
  FROM orders
  GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT cur.month, cur.revenue, prev.revenue AS prev_revenue
FROM monthly cur
LEFT JOIN monthly prev
  ON prev.month = DATE_FORMAT(DATE_SUB(CONCAT(cur.month, '-01'), INTERVAL 1 MONTH), '%Y-%m')
ORDER BY cur.month;
```

Here `monthly` is joined to itself to put each month beside the previous one. (The window-functions module does this more simply with `LAG`; the self-join of a CTE is the classic pre-window answer and still common.) When a CTE is referenced more than once, MySQL may *materialize* it — compute it once into an internal temporary table — rather than repeat the work.

## CTEs versus subqueries, views and temporary tables

| | Lives for | Reusable in the statement | Stored | Indexable |
| --- | --- | --- | --- | --- |
| Derived table (subquery in FROM) | the statement | no — repeat it | no | no |
| CTE | the statement | yes, by name | no | no |
| View | until dropped | yes, in any statement | the definition only | no (uses base indexes) |
| Temporary table | the session | yes, in any statement | the rows | yes |

**Performance.** A CTE is not automatically faster or slower than the equivalent derived table. MySQL's optimizer usually *merges* a CTE referenced once into the outer query, so predicates are pushed down and indexes on the base tables are used exactly as if you had written one flat query. A CTE referenced several times may be materialized once. PostgreSQL before version 12 always materialized CTEs (an "optimization fence" — filters outside did not reach inside), which is the origin of the folklore that CTEs are slow; since 12 it inlines them too, unless you write `AS MATERIALIZED`. SQL Server never materializes a CTE: it re-expands it every time it is referenced, so a CTE used three times may run three times.

**When to use which.** CTEs for structure inside one query. A view when many queries need the same definition. A temporary table when a heavy intermediate result is read by several statements or needs an index.

## Rules worth knowing

- **Scope.** A CTE is visible to the statement it belongs to, including subqueries inside it. CTEs defined inside a subquery are visible only there.
- **Names shadow tables.** A CTE named `orders` hides the real `orders` table for that statement. Avoid it; it confuses every reader.
- **Not in the CTE's own body.** A plain CTE cannot refer to itself — that is what `WITH RECURSIVE` (next lesson) is for.
- **With data changes.** In MySQL, `WITH` may precede `UPDATE` and `DELETE` (and the SELECT part of `INSERT … SELECT`), so the same named steps can drive a change. PostgreSQL goes further, with data-modifying CTEs (`WITH moved AS (DELETE … RETURNING *) INSERT …`); MySQL has no equivalent.
- **ORDER BY inside a CTE is not an order.** The final SELECT decides the row order; always end with an ORDER BY that fixes it completely.

## Readability habits

Name each CTE after what its rows *are* (`dept_avg`, `paid_orders`, `first_purchase`), not `t1`, `cte2`. Keep each step to one idea: filter, or aggregate, or join — not all three. Put a short comment on the step whose purpose is not obvious from its name. In an interview, building the answer as a chain of CTEs lets you talk through each step and test it, and it is far easier to fix one step than to unpick a five-level nested subquery.

## Pitfalls

- Expecting a CTE to persist into the next statement.
- Referring to a later CTE from an earlier one — order of definition matters.
- Assuming the CTE's ORDER BY orders the result.
- Assuming a CTE is cached or faster without checking the plan.
- Writing `WITH` twice instead of one `WITH` with commas.

## Key takeaways

- `WITH name AS (query)` names a result set for one statement; the main query reads it like a table.
- Chain CTEs with commas; each can read the ones defined before it, so a query becomes a list of named steps.
- A CTE can be referenced several times, which a derived table cannot without being repeated.
- CTEs are about readability: MySQL usually merges them like derived tables, and may materialize one used repeatedly.
- Use views for definitions shared across queries and temporary tables for results shared across statements.
