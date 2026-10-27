---
title: OVER and PARTITION BY — aggregates that keep every row
minutes: 15
seo-title: SQL Window Functions Explained: OVER and PARTITION BY
description: A window function computes over a set of related rows but keeps every row, unlike GROUP BY. OVER, PARTITION BY, window ORDER BY and when windows are evaluated.
question: What is a window function in SQL?
answer: A window function computes a value for each row from a set of related rows — its window — without collapsing them the way GROUP BY does. It is written as a function followed by `OVER (...)`, where `PARTITION BY` splits rows into groups and `ORDER BY` orders rows within each group. `SUM(salary) OVER (PARTITION BY dept)` puts each department's total beside every employee. MySQL supports window functions from version 8.0.
q: What is the difference between GROUP BY and PARTITION BY?
a: `GROUP BY` collapses each group to one output row, so only grouped columns and aggregates can be selected. `PARTITION BY` inside `OVER` divides rows into groups for a window function but keeps every input row, so you can show each row's own columns beside its group's total, average or rank.
q: Can you use a window function in a WHERE clause?
a: No. Window functions are evaluated after WHERE, GROUP BY and HAVING, on the rows that survived them, so WHERE cannot see their results. Compute the window function in a CTE or derived table, then filter on its alias in the outer query's WHERE clause.
q: What does OVER () with empty parentheses mean?
a: An empty `OVER ()` makes the whole result one window. `COUNT(*) OVER ()` puts the total number of rows on every row and `SUM(amount) OVER ()` the grand total, which is useful for percentages of the whole without a separate subquery.
q: Does the ORDER BY inside OVER sort the query result?
a: No. The `ORDER BY` inside `OVER` only orders rows within each window for the function's calculation. The order of the rows the query returns is decided by the query's own final `ORDER BY`, so always write one when the order matters.
q: Which MySQL version supports window functions?
a: MySQL 8.0 introduced window functions, including `ROW_NUMBER`, `RANK`, `LAG`, `LEAD` and aggregates with `OVER`. MySQL 5.7 has none, so older code emulates them with self-joins, correlated subqueries or user variables, all slower or less reliable.
---
GROUP BY answers "the total per department", but it pays for the answer with the details: once rows are grouped, each employee's own name and salary are gone. Many questions need both at once — each employee's salary *and* their department's average; each sale *and* the running total so far; each player's score *and* their rank. **Window functions** give you exactly that. They compute over a set of related rows — the row's *window* — and attach the result to every row, without collapsing anything. They are standard SQL, supported by MySQL since 8.0, and the single most asked-about advanced SQL feature in interviews. This lesson covers the `OVER` clause, partitions, ordering within a window, where window functions sit in the order of evaluation, and the named-window shorthand.

## Aggregate, but keep the rows

```text
employees
id | name  | dept  | salary
1  | Asha  | Eng   | 90000
2  | Ben   | Eng   | 70000
3  | Chen  | Sales | 50000
4  | Dev   | Sales | 40000
5  | Eva   | HR    | 45000
```

GROUP BY gives one row per department:

```sql
SELECT dept, AVG(salary) AS dept_avg FROM employees GROUP BY dept;
```

The same aggregate with `OVER` gives one row per *employee*, each carrying its department's average:

```sql
SELECT name, dept, salary,
       AVG(salary) OVER (PARTITION BY dept) AS dept_avg
FROM employees
ORDER BY dept, name;
```

```text
name | dept  | salary | dept_avg
Asha | Eng   | 90000  | 80000
Ben  | Eng   | 70000  | 80000
Eva  | HR    | 45000  | 45000
Chen | Sales | 50000  | 45000
Dev  | Sales | 40000  | 45000
```

The function is an ordinary aggregate — `SUM`, `AVG`, `COUNT`, `MIN`, `MAX` all work — and the `OVER (...)` turns it into a window function. Now `salary - dept_avg`, `salary / dept_total` and "is this the department maximum?" are each one expression on one row.

## OVER () — the whole result as one window

Empty parentheses make every row's window the entire result:

```sql
SELECT name, salary,
       SUM(salary) OVER () AS payroll,
       ROUND(100 * salary / SUM(salary) OVER (), 1) AS pct_of_payroll,
       COUNT(*) OVER () AS headcount
FROM employees
ORDER BY salary DESC, name;
```

Before window functions, the same report needed a cross join to a one-row subquery (`CROSS JOIN (SELECT SUM(salary) AS payroll FROM employees) t`). Both still work; the window version says what it means in place.

## PARTITION BY — one window per group

`PARTITION BY` splits the rows into groups, and each row's window is its own group. It takes any expressions, like GROUP BY:

```sql
SUM(amount) OVER (PARTITION BY region)                     -- per region
COUNT(*)    OVER (PARTITION BY customer_id, YEAR(order_date))  -- per customer per year
MAX(score)  OVER (PARTITION BY team)                       -- the team's best
```

Partitions do not change the number of rows and do not interact: one function may partition by department and the next by city in the same SELECT, each over the same rows. A partition of one row is perfectly fine — an HR department with one person has an average equal to that person's salary.

The comparison interviewers want, in one sentence: **GROUP BY collapses each group to one row; PARTITION BY defines groups for the window but keeps every row.**

## ORDER BY inside OVER — order within the window

Adding `ORDER BY` inside `OVER` orders the rows of each partition for the function's calculation. Ranking functions (next lesson) and `LAG`/`LEAD` require it. For an aggregate, it changes the meaning: the window becomes "from the start of the partition up to this row", which turns `SUM` into a running total:

```sql
SELECT day, amount,
       SUM(amount) OVER (ORDER BY day) AS running_total
FROM daily_sales
ORDER BY day;
```

Exactly which rows count as "up to this row" — and what happens when two rows tie on `day` — is the subject of the frames lesson. For now remember two facts:

1. `AVG(x) OVER (PARTITION BY d)` — the whole partition.
2. `AVG(x) OVER (PARTITION BY d ORDER BY t)` — a *growing* window, from the partition's first row to the current one.

Adding an ORDER BY to a window "just to be tidy" therefore changes the numbers. Leave it out when you want the whole partition.

## The window's ORDER BY does not order the output

This is the most common mistake with window functions. The ORDER BY inside `OVER` decides how the function sees the rows; it says nothing about the order the query *returns* them in. MySQL often happens to return rows in window order, because it sorted them to compute the window — and then a second window with a different ORDER BY, or a join, or a different plan reorders them. Always end with the query's own ORDER BY, and make it complete with tie-breakers:

```sql
SELECT name, dept, salary,
       RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank
FROM employees
ORDER BY dept, dept_rank, name;     -- the output order, stated
```

## When window functions are evaluated

The logical order of a SELECT, with windows added:

1. FROM and joins
2. WHERE
3. GROUP BY and aggregates
4. HAVING
5. **window functions**
6. SELECT list aliases, DISTINCT
7. ORDER BY
8. LIMIT

Three consequences follow.

**WHERE cannot use a window function** — the windows have not been computed yet. Filtering on a rank or a running total needs a CTE or derived table:

```sql
WITH ranked AS (
  SELECT name, dept, salary,
         RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank
  FROM employees
)
SELECT name, dept, salary FROM ranked WHERE dept_rank = 1 ORDER BY dept;
```

**Windows see only the rows that survived WHERE.** `WHERE dept <> 'HR'` removes HR before any window is computed, so a `COUNT(*) OVER ()` counts the rest.

**Windows can run over grouped rows.** After GROUP BY, each group is a row, and a window function can work across groups — including over an aggregate:

```sql
SELECT dept,
       SUM(salary) AS dept_payroll,
       ROUND(100 * SUM(salary) / SUM(SUM(salary)) OVER (), 1) AS pct
FROM employees
GROUP BY dept
ORDER BY dept_payroll DESC, dept;
```

`SUM(SUM(salary)) OVER ()` reads oddly but is exact: the inner SUM is the group's aggregate, the outer SUM is a window over the grouped rows.

## Named windows

When several functions share one window, name it once with a `WINDOW` clause (after HAVING, before ORDER BY):

```sql
SELECT name, dept, salary,
       AVG(salary) OVER w AS dept_avg,
       MAX(salary) OVER w AS dept_max,
       COUNT(*)    OVER w AS dept_size
FROM employees
WINDOW w AS (PARTITION BY dept)
ORDER BY dept, name;
```

A named window can also be extended: `OVER (w ORDER BY salary)` adds an ORDER BY to `w`'s partitioning. MySQL, PostgreSQL and SQLite support `WINDOW`; SQL Server added it only in 2022.

## Rounding window averages

An average over integers is rarely an integer, and different engines print different numbers of decimals. Wrap window averages in `ROUND(…, 2)` (or the precision the report needs) whenever the value is shown — the exercises always do.

## In other databases

PostgreSQL, SQL Server, Oracle and SQLite all support window functions with the same `OVER (PARTITION BY … ORDER BY …)` syntax; PostgreSQL and Oracle had them a decade before MySQL. Code written for MySQL 5.7 emulates them with correlated subqueries (`(SELECT AVG(salary) FROM employees e2 WHERE e2.dept = e.dept)`) or with user variables; the window version is clearer and usually much faster.

## Pitfalls

- Expecting the window's ORDER BY to order the output.
- Adding ORDER BY to an aggregate's window and getting running values instead of partition totals.
- Filtering on a window function in WHERE or HAVING.
- Forgetting that WHERE has already removed rows before the window sees them.
- Printing unrounded window averages.

## Key takeaways

- `function OVER (...)` computes over a window of related rows and keeps every row.
- `PARTITION BY` sets the groups; `OVER ()` is one window over the whole result.
- `ORDER BY` inside OVER orders rows for the function; for aggregates it makes a growing window.
- Windows run after WHERE, GROUP BY and HAVING — filter on them in an outer query.
- The query's own ORDER BY decides the output order; always write it.
