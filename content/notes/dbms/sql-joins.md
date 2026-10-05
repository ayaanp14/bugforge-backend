---
title: SQL Joins
order: 7
minutes: 12
level: beginner
updated: 2026-10-05
seo-title: SQL Joins Explained: Inner, Left, Right, Full and Self Join
description: Every SQL join on two small tables with exact results: inner, left, right, full outer, cross, self and natural joins, duplicate rows, and join vs subquery.
question: What is a join in SQL?
answer: A join combines rows from two tables into one result by matching them on a condition, usually a foreign key equal to a primary key. An inner join keeps only matching pairs; left, right and full outer joins also keep unmatched rows from one or both sides, filling the missing columns with NULL. A cross join pairs every row with every row.
q: What is the difference between INNER JOIN and LEFT JOIN?
a: An inner join returns only the rows that have a match in both tables. A left join returns every row of the left table; where a row has no match, the right table's columns come back as NULL. So a left join never returns fewer rows than the left table has.
q: Does MySQL support FULL OUTER JOIN?
a: No. MySQL has no FULL OUTER JOIN keyword. You emulate it with a LEFT JOIN, then UNION ALL with a RIGHT JOIN that keeps only the right rows with no match (WHERE the left key IS NULL). PostgreSQL, SQL Server and Oracle support FULL OUTER JOIN directly.
q: What is a self join?
a: A self join joins a table to itself, using two aliases so each copy can be named. It answers questions about rows related to other rows of the same table, such as listing each employee with their manager when manager_id refers to emp_id in the same table.
q: Why does a join return duplicate rows?
a: A join returns one row for every matching pair. If the join column is not unique on one side, a row on the other side matches several rows and appears once for each. Joining on a non-key column, or joining two child tables of the same parent, multiplies rows and inflates SUM and COUNT.
q: What is the difference between a join and a subquery?
a: A join combines columns from both tables and can repeat a row once per match. A subquery with IN or EXISTS only filters the outer table, so each outer row appears at most once. Modern optimizers often rewrite one into the other, so choose the form that states the question most clearly.
q: What is the difference between NATURAL JOIN and INNER JOIN?
a: A natural join matches on every column the two tables share by name, without an ON clause, and shows each shared column once. An inner join matches on the condition you write. Natural joins are risky: adding a same-named column such as updated_at later silently changes the join.
---

Relational design deliberately spreads facts over several tables: the employee's name in one, the department's name in another, linked by a key. A **join** puts them back together for a query. Interviewers test joins by giving two small tables and asking for the exact output, so this note runs every join type on the same two tables and shows every result row. Results are listed in a fixed order for reading; a real query needs `ORDER BY` to guarantee any order.

## The example tables

`employees` (Rohan has no department yet; `manager_id` refers to `emp_id` in the same table):

| emp_id | name | dept_id | manager_id |
| --- | --- | --- | --- |
| 1 | Asha | 10 | NULL |
| 2 | Vikram | 20 | 1 |
| 3 | Meera | 10 | 1 |
| 4 | Rohan | NULL | 2 |

`departments` (HR has no employees):

| dept_id | dept_name |
| --- | --- |
| 10 | Engineering |
| 20 | Sales |
| 30 | HR |

Every join below starts from the same matching: each employee's `dept_id` against each department's.

@figure match-rows

## Inner join

An **inner join** returns one row for each pair of rows that satisfy the join condition. Rows without a partner disappear from both sides.

```sql
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
| --- | --- |
| Asha | Engineering |
| Vikram | Sales |
| Meera | Engineering |

Rohan is missing because NULL = 10 is UNKNOWN, not TRUE, and HR is missing because no employee points to it. `JOIN` alone means `INNER JOIN`. A join whose condition is equality is an **equi-join**; one with any other comparison (`<`, `BETWEEN`) is a **theta join** or non-equi join, used for example to match a salary to a pay band.

## Left outer join

A **left join** keeps every row of the left table. Where there is no match, the right table's columns are NULL.

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
| --- | --- |
| Asha | Engineering |
| Vikram | Sales |
| Meera | Engineering |
| Rohan | NULL |

## Right outer join

A **right join** keeps every row of the right table. It is a left join with the tables swapped, and most teams write it as a left join for readability.

```sql
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
| --- | --- |
| Asha | Engineering |
| Meera | Engineering |
| Vikram | Sales |
| NULL | HR |

## Full outer join

A **full outer join** keeps every row from both sides: the matched pairs, the unmatched left rows and the unmatched right rows.

```sql
SELECT e.name, d.dept_name
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.dept_id;   -- PostgreSQL, SQL Server, Oracle
```

| name | dept_name |
| --- | --- |
| Asha | Engineering |
| Vikram | Sales |
| Meera | Engineering |
| Rohan | NULL |
| NULL | HR |

**MySQL has no FULL OUTER JOIN.** Emulate it with a left join plus the right join's unmatched rows:

```sql
SELECT e.name, d.dept_name
FROM employees e LEFT JOIN departments d ON e.dept_id = d.dept_id
UNION ALL
SELECT e.name, d.dept_name
FROM employees e RIGHT JOIN departments d ON e.dept_id = d.dept_id
WHERE e.emp_id IS NULL;
```

The often-quoted version, `LEFT JOIN … UNION … RIGHT JOIN`, gives the same five rows here, but `UNION` removes duplicates, so it would also collapse genuinely repeated result rows (two employees with the same name in the same department). `UNION ALL` with the `IS NULL` filter does not.

## Cross join

A **cross join** is the Cartesian product: every row of one table paired with every row of the other, with no condition. Four employees and three departments give 4 × 3 = 12 rows.

```sql
SELECT e.name, d.dept_name
FROM employees e
CROSS JOIN departments d;
```

@figure cross-grid

Writing `FROM employees, departments` with no `WHERE` produces the same product, which is how accidental cross joins happen. Cross joins are useful for generating combinations, such as every size with every colour.

## Self join

A **self join** joins a table to itself through two aliases. To list each employee with their manager's name, treat one copy as employees (`e`) and the other as managers (`m`):

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;
```

| employee | manager |
| --- | --- |
| Asha | NULL |
| Vikram | Asha |
| Meera | Asha |
| Rohan | Vikram |

@figure self-join

Another self join finds pairs of colleagues in the same department: `ON e.dept_id = m.dept_id AND e.emp_id < m.emp_id` returns the single pair (Asha, Meera); the `<` stops each pair appearing twice and a person pairing with themselves.

## Natural join and USING

A **natural join** joins on every column the two tables share by name and shows each shared column once:

```sql
SELECT * FROM employees NATURAL JOIN departments;
```

| dept_id | emp_id | name | manager_id | dept_name |
| --- | --- | --- | --- | --- |
| 10 | 1 | Asha | NULL | Engineering |
| 20 | 2 | Vikram | 1 | Sales |
| 10 | 3 | Meera | 1 | Engineering |

It is an inner join on `dept_id`, the only shared name. MySQL puts the shared column first. `JOIN departments USING (dept_id)` gives the same result while naming the column explicitly, whereas `ON e.dept_id = d.dept_id` with `SELECT *` shows `dept_id` twice. The danger of `NATURAL JOIN` is that it trusts names: if `departments` had a `name` column, the join would also require `employees.name = departments.name` and return nothing. Prefer `ON` or `USING` in real code.

## Duplicate rows: joining on non-key columns

A join returns one row per matching pair. When the join column is unique on one side (a key), each row on the other side matches at most once. When it is not unique on either side, rows multiply. Add a table of bonuses, where a department may have several:

| dept_id | amount |
| --- | --- |
| 10 | 5000 |
| 10 | 2000 |
| 20 | 3000 |

For each value of the join column, the join returns (matching left rows) × (matching right rows):

@figure fan-out

| name | amount |
| --- | --- |
| Asha | 5000 |
| Asha | 2000 |
| Vikram | 3000 |
| Meera | 5000 |
| Meera | 2000 |

This **fan-out** is the most common cause of wrong totals: join an order to its items and to its payments at once, and each item is repeated once per payment, so `SUM(item_price)` comes out too large. Aggregate each child table in a subquery first, then join the totals.

## Where to put a filter in an outer join

A condition in `ON` decides which rows match; a condition in `WHERE` filters the result afterwards. For an outer join the two differ:

| Query | Result |
| --- | --- |
| `LEFT JOIN departments d ON e.dept_id = d.dept_id WHERE d.dept_name = 'Sales'` | Vikram, Sales (one row: the NULL rows fail WHERE, so it behaves like an inner join) |
| `LEFT JOIN departments d ON e.dept_id = d.dept_id AND d.dept_name = 'Sales'` | All four employees; only Vikram has Sales, the other three get NULL |

## Join vs subquery

Some questions can be written either way, and the choice changes duplicates and NULL handling:

| Question | Join form | Subquery form | Note |
| --- | --- | --- | --- |
| Departments that have employees (semi-join) | `JOIN employees` gives Engineering, Engineering, Sales | `WHERE EXISTS (…)` or `IN (…)` gives Engineering, Sales | The join repeats a department once per employee; add `DISTINCT` |
| Departments with no employees (anti-join) | `LEFT JOIN employees e … WHERE e.emp_id IS NULL` gives HR | `WHERE NOT EXISTS (…)` gives HR | Both correct |
| The same, with NOT IN | none | `WHERE dept_id NOT IN (SELECT dept_id FROM employees)` gives no rows | Rohan's NULL makes every NOT IN test UNKNOWN |

The last row is a classic trap. `30 NOT IN (10, 20, 10, NULL)` expands to `30 <> 10 AND 30 <> 20 AND 30 <> 10 AND 30 <> NULL`, and the last test is UNKNOWN, so HR is not returned. Use `NOT EXISTS`, or filter `WHERE dept_id IS NOT NULL` inside the subquery.

On performance, modern optimizers (MySQL 8 included) turn many `IN` and `EXISTS` subqueries into semi-joins, so the two forms often run the same plan. Use a join when you need columns from both tables, and `EXISTS` when you only need to test for a match.

## Join types at a glance

| Join | Keeps | Rows here |
| --- | --- | --- |
| INNER | Matched pairs only | 3 |
| LEFT | All left rows, NULLs for missing right | 4 |
| RIGHT | All right rows, NULLs for missing left | 4 |
| FULL OUTER | All rows from both sides | 5 |
| CROSS | Every combination | 12 |
| SELF (left) | Each employee with their manager | 4 |
| NATURAL | Matched on all same-named columns | 3 |

## Common mistakes

- Forgetting that NULL never equals anything, so rows with NULL keys drop out of inner joins.
- Filtering the right table in `WHERE` after a left join, which silently turns it into an inner join.
- Summing after a join that fans out, which double-counts.
- Using `NOT IN` against a column that can hold NULL.
- Writing `LEFT JOIN … UNION … RIGHT JOIN` for a full join and losing genuine duplicates.
- Using `NATURAL JOIN` in production code that can later gain same-named columns.

## Interview questions

**What is the difference between LEFT JOIN and RIGHT JOIN?** A left join keeps all rows of the table before the keyword and a right join all rows of the table after it. `A LEFT JOIN B` returns the same rows as `B RIGHT JOIN A`; only the column order differs.

**If table A has 4 rows and B has 3, what is the minimum and maximum size of A INNER JOIN B? Of A LEFT JOIN B?** An inner join returns between 0 and 12 rows. A left join returns at least 4 rows (every row of A appears) and at most 12.

**How do you find employees who have no department?** `SELECT name FROM employees WHERE dept_id IS NULL` if NULL means unassigned. To also catch department ids that do not exist in `departments`, left join and keep rows where `d.dept_id IS NULL`.

**How do you write a full outer join in MySQL?** A left join, then `UNION ALL` with a right join filtered to rows where the left table's key is NULL. Using plain `UNION` removes duplicate rows that may be genuine.

**What is a self join? Give a use.** A table joined to itself under two aliases. It finds each employee's manager, pairs of rows in the same group, or consecutive events in a log table.

**Why can NOT IN return no rows when you expect some?** If the subquery returns a NULL, every `x NOT IN (…)` test becomes UNKNOWN, and WHERE drops UNKNOWN rows. NOT EXISTS does not have this problem.

**How does a database execute a join?** With a nested-loop join (for each outer row, look up matches, ideally through an index), a hash join (build a hash table on the smaller input, probe it with the other) or a sort-merge join (sort both inputs on the key and merge). MySQL 8.0.18 and later can use hash joins; PostgreSQL implements all three.

**Is a cross join ever useful?** Yes: generating every combination (dates × stores for a report with zero-filled days, sizes × colours) or joining to a one-row table of parameters. Accidental cross joins come from a forgotten join condition.

Next, summarize rows with grouping and subqueries: [SQL GROUP BY, HAVING and Subqueries](/notes/dbms/sql-aggregation-and-subqueries). Joins are the heart of the [SQL (Basic) skill test](/skill-tests/sql-basic).

Practise joins on real tables: [Employees Earning More Than Their Manager](/sql/employees-earning-more-than-their-manager) (a self join), [Hostel Students Who Never Ordered From the Canteen](/sql/hostel-students-who-never-ordered-from-the-canteen) (an anti join) and [Mock Test Sittings for Every Learner and Track](/sql/mock-test-sittings-for-every-learner-and-track) (a cross join with a left join).
