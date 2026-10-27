---
title: Correlated subqueries — a subquery per row
minutes: 16
seo-title: SQL Correlated Subquery Explained: Per-Group Comparisons
description: A correlated subquery refers to the outer row and is evaluated for each one: salary above the department average, each customer's latest order, and scope traps.
question: What is a correlated subquery?
answer: A correlated subquery is a subquery that refers to a column of the outer query, so its result depends on the current outer row and it is logically evaluated once per row. For example, `WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept = e.dept)` compares each employee with the average of their own department rather than the whole company.
q: What is the difference between a correlated and a non-correlated subquery?
a: A non-correlated subquery does not mention the outer query, so it returns the same result for every row and runs once. A correlated subquery uses an outer column, such as `e.dept`, so its result changes from row to row and it is evaluated per outer row, although the optimizer may rewrite it into a join.
q: Are correlated subqueries slow?
a: They can be, because the subquery may run once per outer row. With an index on the correlated column, such as `employees(dept)`, each run is a quick index lookup, and MySQL 8 often decorrelates `EXISTS` and `IN` into semi joins. A correlated aggregate over a large table is the case to rewrite as a join with a derived table.
q: How do I get each customer's latest order in SQL?
a: Keep the orders whose date equals the maximum date of that customer's orders: `WHERE o.order_date = (SELECT MAX(x.order_date) FROM orders x WHERE x.customer_id = o.customer_id)`. Customers with two orders on the latest date get both rows. Window functions such as `ROW_NUMBER` are the other common answer.
q: Why does my subquery work even though the column does not exist in its table?
a: An unqualified column that the inner table lacks is resolved from the outer query, so `WHERE id IN (SELECT id FROM orders)` may silently compare the outer `id` with itself when `orders` has no `id` column. Qualify every column inside a subquery with its alias to make this mistake an error instead.
---
The subqueries so far were independent: `(SELECT AVG(salary) FROM employees)` gives the same answer whichever row is asking. Many questions need a different comparison for each row. Is this employee paid above *their department's* average? Is this order *its customer's* most recent? Does *this* product cost more than the average of *its* category? The inner query must know which outer row it is answering for, so it refers to the outer row's columns. That makes it a **correlated subquery**. This lesson covers how to write and read them, the per-group patterns they make easy, their use in the select list, how they perform, and a scope rule that produces some of the most baffling bugs in SQL.

## The data

```sql
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES
  (1, 'Asha', 'Eng',   120000),
  (2, 'Ben',  'Eng',    95000),
  (3, 'Chen', 'Sales',  70000),
  (4, 'Dina', 'Sales',  82000),
  (5, 'Esha', 'Ops',    60000);
```

Department averages: Eng 107500, Sales 76000, Ops 60000.

## Above their own department's average

```sql
SELECT e.name, e.dept, e.salary
FROM employees e
WHERE e.salary > (
  SELECT AVG(x.salary)
  FROM employees x
  WHERE x.dept = e.dept
)
ORDER BY e.dept, e.salary DESC, e.name;
```

@figure per-row-average

The inner query mentions `e.dept`, a column of the **outer** row. Conceptually the database does this for every employee: take their department, compute that department's average, compare. For Asha it computes the Eng average (107500); for Chen the Sales average (76000). Esha is alone in Ops, equal to her own average, so `>` excludes her.

Two aliases of the same table appear — `e` outside and `x` inside — exactly as in a self join. They must be different, and every column should be qualified so it is obvious which copy it comes from.

## The latest row per group

```sql
SELECT o.customer_id, o.id AS order_id, o.order_date, o.amount
FROM orders o
WHERE o.order_date = (
  SELECT MAX(x.order_date)
  FROM orders x
  WHERE x.customer_id = o.customer_id
)
ORDER BY o.customer_id, o.id;
```

For each order, the subquery finds the latest date among that customer's orders; the order is kept if it is dated on that day. This "greatest-n-per-group" pattern works for any extreme: the most expensive product per category, the first login per user, the highest score per student. Two properties to state in an interview:

- **ties are kept** — a customer with two orders on the latest date gets both rows. If exactly one is wanted, add a tie-breaker (`AND o.id = (SELECT MAX(x.id) … )`) or use `ROW_NUMBER()` from the window-functions module;
- customers with **no** orders do not appear, because there is no order row to start from.

## Correlated subqueries in the select list

A correlated scalar subquery can compute a per-row value:

```sql
SELECT c.name,
       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders,
       (SELECT MAX(o.order_date) FROM orders o WHERE o.customer_id = c.id) AS last_order
FROM customers c
ORDER BY c.name;
```

Customers with no orders get 0 and NULL — `COUNT` over no rows is 0, `MAX` is NULL — so this is an alternative to a left join with `GROUP BY`, and it never suffers from fan-out because each subquery aggregates its own table. The cost is that each subquery is a separate lookup per customer; for a handful of per-row figures over an indexed column that is fine, for a dozen it is better to aggregate once in a derived table (next lesson).

## EXISTS is usually correlated

```sql
-- departments where someone earns more than the department's head
SELECT d.name
FROM departments d
WHERE EXISTS (
  SELECT 1 FROM employees e
  WHERE e.dept_id = d.id AND e.salary > d.head_salary
);
```

An uncorrelated `EXISTS` would be true for all rows or none, which is rarely what anyone means. When you see `EXISTS`, look for the outer column inside it.

## How it actually runs

"Once per outer row" is the logical model, not necessarily the plan. MySQL 8:

- converts `IN`/`EXISTS` subqueries into semi joins and `NOT EXISTS` into antijoins;
- can turn some scalar subqueries into joins with a derived table (the `subquery_to_derived` optimizer switch, off by default);
- otherwise runs the subquery as a `DEPENDENT SUBQUERY`, once per outer row.

What makes the per-row lookups cheap is an index on the correlated column — `orders(customer_id)` or `orders(customer_id, order_date)` for the latest-order query. Without one, each evaluation scans the table, and a 100,000-row outer table means 100,000 scans. If `EXPLAIN` shows `DEPENDENT SUBQUERY` on a large table with no usable index, rewrite as a join with a derived table of per-group aggregates.

## The scope trap

Name resolution inside a subquery looks in the subquery's own tables first, then in the outer query's. That rule makes correlation possible — and it means a typo can silently correlate:

```sql
-- intended: customers who have a row in the `vip` table
SELECT name FROM customers
WHERE id IN (SELECT id FROM vip);   -- but vip's column is called customer_id
```

`vip` has no column `id`, so the inner `id` resolves to `customers.id`. The subquery becomes "for each vip row, the outer customer's id", and `id IN (id, id, …)` is true for every customer whenever `vip` is non-empty. No error, every row returned. Qualifying the inner column (`SELECT v.id FROM vip v`) turns the mistake into the error it should be. Qualify every column inside a subquery — this is the single best habit for avoiding subquery bugs.

## Correlated subquery or join?

Both can express most per-group comparisons. Guidelines:

- a per-row condition against an aggregate of related rows (above the department average, latest per customer) reads naturally as a correlated subquery;
- when the outer query also needs several columns from the related rows, a join is usually clearer;
- when the related table is large and the outer one too, aggregate once (derived table) and join.

## Pitfalls

- Reusing the same alias inside and outside, so the "correlation" refers to the inner table itself.
- Unqualified inner columns silently binding to the outer query.
- Forgetting that latest-per-group returns ties.
- A correlated aggregate over a large table with no index on the correlated column.
- Expecting groups with no rows to appear when the outer query starts from the child table.

## Key takeaways

- A correlated subquery refers to an outer column and is logically evaluated per outer row.
- It is the natural way to compare a row with an aggregate of its own group.
- `col = (SELECT MAX(col) … WHERE same group)` returns the latest row per group, ties included.
- Correlated scalar subqueries in the select list compute per-row counts without fan-out.
- Index the correlated column, and qualify every inner column to avoid accidental correlation.
