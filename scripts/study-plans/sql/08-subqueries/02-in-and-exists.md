---
title: IN and EXISTS — testing membership with a subquery
minutes: 15
seo-title: SQL IN vs EXISTS Subquery: Membership, ANY and ALL in MySQL
description: IN tests whether a value is in the list a subquery returns; EXISTS tests whether a subquery finds any row. When to use each, chaining them, and ANY and ALL.
question: What is the difference between IN and EXISTS in SQL?
answer: `x IN (subquery)` compares a value with the list of values a subquery returns and is true if any of them equals it. `EXISTS (subquery)` ignores values and is true if the subquery returns at least one row, usually because the subquery refers to the outer row. Both keep each outer row once; they differ mainly when NULLs appear and in how naturally they express the condition.
q: Is EXISTS faster than IN?
a: In MySQL 8 usually neither, because the optimizer rewrites both `IN (subquery)` and `EXISTS` into the same semi-join strategies. The old advice that `EXISTS` beats `IN` dates from MySQL 5.5 and earlier, which ran `IN` subqueries row by row. Choose the form that reads best and check `EXPLAIN` when it matters.
q: How do I find rows that match two conditions on another table, such as students in both SQL and Python?
a: Use two membership tests joined with `AND`: `WHERE id IN (SELECT student_id FROM enrollments WHERE course = 'SQL') AND id IN (SELECT student_id FROM enrollments WHERE course = 'Python')`. A single `WHERE course = 'SQL' AND course = 'Python'` on one row is never true, because one row holds one course.
q: What do ANY and ALL do in SQL?
a: They compare a value with every value a subquery returns. `x > ANY (subquery)` is true if x is greater than at least one value, and `x > ALL (subquery)` if it is greater than every value. `= ANY` is the same as `IN`. MySQL, PostgreSQL and SQL Server support them; SQLite does not, so they are rewritten with `MIN` or `MAX`.
q: Can IN compare more than one column?
a: Yes. MySQL supports row constructors: `WHERE (customer_id, order_date) IN (SELECT customer_id, MAX(order_date) FROM orders GROUP BY customer_id)` matches on both columns together. The subquery must return the same number of columns as the row on the left.
---
The previous module's semi-join lesson used `EXISTS` and `IN` to ask "does this row have a match?". This lesson looks at them as subquery operators in their own right. `IN` asks whether a value belongs to a *set of values* produced by a query; `EXISTS` asks whether a query produces *any row at all*. Between them they answer most "which rows relate to something over there?" questions — customers who bought from a category, students enrolled in two particular courses, products in a promotion list — and they keep each outer row exactly once, which is what separates them from a join. The quantified comparisons `ANY` and `ALL`, which interviews sometimes ask about, round the lesson off.

## IN with a list and with a subquery

`IN` with a literal list is familiar from filtering:

```sql
SELECT name FROM products WHERE category IN ('Books', 'Music');
```

Replace the list with a query and the list is computed:

```sql
SELECT c.id, c.name
FROM customers c
WHERE c.id IN (SELECT o.customer_id FROM orders o WHERE o.amount >= 300)
ORDER BY c.id;
```

The subquery must return exactly **one column**. It may return any number of rows, including zero (then `IN` is false for every row) and duplicates (which change nothing — membership is membership). Each customer is kept once, no matter how many qualifying orders match.

`IN (subquery)` is the natural choice when the link between the tables is a single column and the subquery reads as a self-contained list: "customers whose id is among the ids of big orders".

## Chaining IN through several tables

Membership tests nest. Customers who bought anything in the Books category, through orders, order items and products:

```sql
SELECT c.id, c.name
FROM customers c
WHERE c.id IN (
  SELECT o.customer_id
  FROM orders o
  WHERE o.id IN (
    SELECT i.order_id
    FROM order_items i
    WHERE i.product_id IN (SELECT p.id FROM products p WHERE p.category = 'Books')
  )
)
ORDER BY c.id;
```

Read it from the inside out: the ids of Books products → the orders containing them → the customers who placed those orders. The same question as a join needs `DISTINCT`, because a customer with two Books items in three orders would appear six times. Deep nesting gets hard to read; a single semi-join with joins inside is often clearer:

```sql
WHERE c.id IN (
  SELECT o.customer_id
  FROM orders o
  JOIN order_items i ON i.order_id = o.id
  JOIN products p    ON p.id = i.product_id
  WHERE p.category = 'Books'
)
```

The duplicates the inner join produces do not matter — `IN` only asks about membership.

## "Both" and "either" questions

Students enrolled in **both** SQL and Python:

```sql
SELECT s.name
FROM students s
WHERE s.id IN (SELECT e.student_id FROM enrollments e WHERE e.course = 'SQL')
  AND s.id IN (SELECT e.student_id FROM enrollments e WHERE e.course = 'Python')
ORDER BY s.name;
```

A beginner writes `WHERE e.course = 'SQL' AND e.course = 'Python'` on a join — which is never true, because a single enrollment row holds one course. Two independent membership tests, one per condition, express "both". "Either" is `OR` between them (or a single `IN` with `course IN ('SQL', 'Python')`), and "SQL but not Python" is `IN … AND NOT IN …` — with the NULL caution of the last lesson in this module.

Another way to say "both" is grouping: `GROUP BY student_id HAVING COUNT(DISTINCT course) = 2` over the enrollments filtered to the two courses. It scales better to "all five of these courses".

## EXISTS

```sql
SELECT d.name
FROM departments d
WHERE EXISTS (
  SELECT 1 FROM employees e
  WHERE e.dept_id = d.id AND e.salary >= 100000
)
ORDER BY d.name;
```

`EXISTS` is true when the subquery returns at least one row; the select list inside does not matter. Because a subquery that does not mention the outer row returns the same thing for every outer row, an `EXISTS` is almost always **correlated** — `e.dept_id = d.id` ties it to the current department. The next lesson explains correlated subqueries properly; here it is enough to read the query as "departments for which some high earner exists".

`EXISTS` is the better fit when:

- the link involves several columns, or extra conditions on the matching row;
- the question is about existence rather than about a list of values;
- NULLs may appear in the linking column (`NOT EXISTS` is safe where `NOT IN` is not).

## Multi-column IN

MySQL supports comparing a tuple with a subquery's rows:

```sql
-- each customer's most recent order(s)
SELECT o.*
FROM orders o
WHERE (o.customer_id, o.order_date) IN (
  SELECT customer_id, MAX(order_date) FROM orders GROUP BY customer_id
)
ORDER BY o.customer_id, o.id;
```

The pair on the left must match a row of the subquery on both columns at once. PostgreSQL supports it too; SQL Server does not, and uses `EXISTS` with both conditions instead.

## ANY, SOME and ALL

MySQL also offers quantified comparisons against a subquery:

```sql
-- earns more than everyone in Sales
SELECT name FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept = 'Sales');

-- earns more than at least one person in Sales
SELECT name FROM employees
WHERE salary > ANY (SELECT salary FROM employees WHERE dept = 'Sales');
```

`SOME` is a synonym for `ANY`. `= ANY (…)` is exactly `IN (…)`, and `<> ALL (…)` is exactly `NOT IN (…)` — including its NULL problem. `> ALL` is usually written `> (SELECT MAX(…))` and `> ANY` as `> (SELECT MIN(…))`, which is clearer and works everywhere, but the two forms differ at the edges: `> ALL` of an **empty** subquery is true (there is no value to fail against), while `> (SELECT MAX(…))` of an empty set compares with NULL and is never true. Interviewers occasionally probe exactly that. SQLite has no `ANY`/`ALL`, so the exercises here use `MIN`/`MAX`.

## IN versus a join, in short

| Need | Use |
| --- | --- |
| Columns from both tables | `JOIN` |
| Rows of A that have a match in B, each once | `IN` or `EXISTS` |
| Rows of A with no match in B | `NOT EXISTS` |
| A value compared with every value of a set | `> ALL`, or `> (SELECT MAX …)` |

## Pitfalls

- A subquery after `IN` that returns two columns (error: "Operand should contain 1 column").
- Testing two values of one column on a single row ("both" questions).
- Using a join plus `DISTINCT` where a membership test was meant.
- `<> ALL` and `NOT IN` against a nullable column.
- Assuming `> ALL (empty)` behaves like `> MAX(empty)`.

## Key takeaways

- `IN (subquery)` tests a value against a one-column list; duplicates in the list do not matter.
- `EXISTS (subquery)` tests whether any row exists, usually correlated to the outer row.
- Both keep each outer row once; MySQL 8 plans both as semi joins.
- "Both A and B" is two membership tests, not one row with two values.
- `= ANY` is `IN`, `<> ALL` is `NOT IN`, and `> ALL (empty)` is true.
