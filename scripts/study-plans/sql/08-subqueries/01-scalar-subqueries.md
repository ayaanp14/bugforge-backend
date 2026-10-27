---
title: Scalar subqueries — a query that returns one value
minutes: 15
seo-title: SQL Scalar Subquery: Above-Average and Second Highest Salary
description: A scalar subquery returns one value that can stand in any expression: compare with the average, compute a share of the total, or find the second highest salary.
question: What is a scalar subquery in SQL?
answer: A scalar subquery is a `SELECT` in parentheses that returns exactly one row with one column, so it can be used anywhere a single value can: in `WHERE`, in the select list, in `HAVING` or inside an expression. If it returns no rows its value is NULL; if it returns more than one row, MySQL stops with the error "Subquery returns more than 1 row".
q: How do I find employees who earn more than the average salary?
a: Compare each row with a scalar subquery: `SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)`. An aggregate cannot appear directly in `WHERE`, because `WHERE` runs before grouping, so the average is computed in its own query and its single value is used in the comparison.
q: How do you find the second highest salary in SQL?
a: Take the largest salary that is smaller than the largest: `SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`. Duplicates of the top salary are skipped automatically, and when there is no second distinct salary the `MAX` of no rows is NULL, which is what the classic interview question expects.
q: What does "Subquery returns more than 1 row" mean in MySQL?
a: A subquery used as a single value, for example after `=` or `>`, produced several rows. Make it return one row with an aggregate, a more selective `WHERE` or `LIMIT 1`, or, if a list was meant, change the operator to `IN`. Error 1242 is raised at run time, so a query can work on test data and fail later.
q: Can a subquery be used in the SELECT list?
a: Yes, as long as it is scalar. `SELECT name, salary, (SELECT AVG(salary) FROM employees) AS company_avg FROM employees` shows the same average on every row. A subquery in the select list may also refer to the current outer row, which makes it a correlated subquery evaluated per row.
---
Some questions need a number computed from the whole table before any single row can be judged. Who earns more than the average? What share of total revenue is each product? Which order was the largest? `WHERE salary > AVG(salary)` looks right but is illegal — `WHERE` filters rows before any aggregate exists. The fix is to compute the number in its own query and drop its result into the outer one. A query nested inside another is a **subquery**; one that returns a single value is a **scalar subquery**, and it is the simplest kind. This lesson covers where scalar subqueries may appear, what happens when they return zero or several rows, and the classic "second highest" problem.

## The data

```sql
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES
  (1, 'Asha',  'Eng',   120000),
  (2, 'Ben',   'Eng',    95000),
  (3, 'Chen',  'Sales',  70000),
  (4, 'Dina',  'Sales',  82000),
  (5, 'Esha',  'Ops',    60000);
```

The average salary is 427000 / 5 = 85400.

## A subquery in WHERE

```sql
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC, name;
```

| name | salary |
| --- | ---: |
| Asha | 120000 |
| Ben | 95000 |

The parenthesised query runs once, produces the single value 85400, and the outer `WHERE` compares every row with it. A scalar subquery is just an expression — the database treats `(SELECT AVG(salary) FROM employees)` the way it would treat the literal `85400`, except that it stays right when the data changes.

The inner query is **independent** (non-correlated): it does not mention the outer row, so MySQL evaluates it once and caches the value. The next lessons cover subqueries that do depend on the outer row.

## A subquery in the select list

```sql
SELECT name, salary,
       salary - (SELECT AVG(salary) FROM employees) AS vs_average,
       ROUND(100 * salary / (SELECT SUM(salary) FROM employees), 1) AS pct_of_payroll
FROM employees
ORDER BY salary DESC, name;
```

| name | salary | vs_average | pct_of_payroll |
| --- | ---: | ---: | ---: |
| Asha | 120000 | 34600 | 28.1 |
| Ben | 95000 | 9600 | 22.2 |
| Dina | 82000 | -3400 | 19.2 |
| Chen | 70000 | -15400 | 16.4 |
| Esha | 60000 | -25400 | 14.1 |

Each scalar subquery is used inside arithmetic like any number. This "share of the total" shape is common in reports. (Window functions, later in the course, write it as `SUM(salary) OVER ()` without a second read of the table.)

## A subquery in HAVING

Departments whose average salary is above the company average compare a group's aggregate with the table's aggregate:

```sql
SELECT dept, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept
HAVING AVG(salary) > (SELECT AVG(salary) FROM employees)
ORDER BY dept;
```

| dept | avg_salary |
| --- | ---: |
| Eng | 107500 |

`HAVING` filters groups after aggregation, and the subquery provides the threshold.

## Zero rows: NULL

If a scalar subquery returns no rows, its value is `NULL`:

```sql
SELECT (SELECT salary FROM employees WHERE dept = 'Legal') AS legal_salary;
```

| legal_salary |
| --- |
| NULL |

And `salary > NULL` is unknown, so a `WHERE` comparing against an empty subquery keeps nothing. Usually that is the right behaviour; when it is not, wrap the subquery in `COALESCE(…, 0)`.

## More than one row: an error

```sql
SELECT name FROM employees
WHERE salary = (SELECT salary FROM employees WHERE dept = 'Eng');
-- MySQL: ERROR 1242 (21000): Subquery returns more than 1 row
```

Eng has two salaries, and `=` compares with one value. MySQL raises the error when it happens, at run time — so a query that returned one row during testing can start failing in production when a second matching row appears. Make a scalar subquery scalar *by construction*: an aggregate (`MAX`, `AVG`, `COUNT`), a filter on a unique key, or `LIMIT 1` with an `ORDER BY`. If a list was meant, use `IN` — the next lesson.

Not every engine is this strict: SQLite, including the practice engine these exercises run on, quietly uses the first row instead of failing. Write scalar subqueries so that the question never arises; that is what interviews and MySQL expect.

## The second highest salary

A favourite interview question: return the second highest *distinct* salary, or NULL if there is none.

```sql
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

| second_highest |
| ---: |
| 95000 |

The subquery finds the top salary; the outer query takes the largest salary below it. Duplicates of the top are excluded automatically because they are not *less than* it. If every employee earns the same, no row passes the `WHERE`, and `MAX` of nothing is `NULL` — an aggregate without `GROUP BY` always returns exactly one row. That NULL row is part of the expected answer, and it is why the `MAX` form beats a plain `ORDER BY salary DESC LIMIT 1 OFFSET 1`, which returns *no row* when there is no second salary and returns a duplicate of the top when the top is tied.

The `LIMIT` version can be made correct by wrapping it as a scalar subquery and de-duplicating:

```sql
SELECT (
  SELECT DISTINCT salary FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS second_highest;
```

An outer `SELECT` with no `FROM` returns one row, and the empty subquery becomes NULL. This version generalises to the *n*th highest by changing the offset; the `MAX … <` version does not.

## Subqueries and readability

A scalar subquery is evaluated once when it is independent, so performance is rarely a concern. The cost is readability: three nested levels of parentheses are hard to follow. Indent the inner query, alias every computed column, and when the same subquery appears twice consider a CTE (a later module), which names it once.

## In other databases

PostgreSQL and SQL Server behave like MySQL: an error for more than one row ("more than one row returned by a subquery used as an expression" in PostgreSQL), NULL for none. SQL Server writes the `LIMIT … OFFSET` form as `OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY`, or `TOP`.

## Pitfalls

- Writing an aggregate directly in `WHERE` instead of a subquery.
- A "scalar" subquery that can return several rows.
- Forgetting that an empty subquery is NULL and that comparisons with NULL keep nothing.
- `LIMIT 1 OFFSET 1` without `DISTINCT`, or without wrapping, for "second highest".
- Integer division surprises in other databases when computing shares (`salary / total` is 0 in SQL Server for integers; MySQL's `/` is decimal).

## Key takeaways

- A scalar subquery returns one row and one column and can be used wherever a value can.
- Use it for comparisons with a table-wide aggregate, shares of a total, and thresholds in `HAVING`.
- No rows → NULL; more than one row → MySQL error 1242.
- Second highest: `MAX(salary) WHERE salary < (SELECT MAX(salary) …)`, NULL when absent.
- Independent subqueries run once; keep them readable with indentation and aliases.
