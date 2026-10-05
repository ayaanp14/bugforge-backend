---
title: SQL GROUP BY, HAVING and Subqueries
order: 8
minutes: 12
level: intermediate
updated: 2026-10-05
seo-title: SQL GROUP BY, HAVING and Subqueries with Examples
description: SQL aggregation worked on one table: aggregates and NULLs, GROUP BY, HAVING vs WHERE, subqueries, RANK vs DENSE_RANK, and the Nth highest salary three ways.
question: What do GROUP BY and HAVING do in SQL?
answer: GROUP BY collapses rows that share the same values in the listed columns into one group, so aggregate functions such as COUNT, SUM and AVG return one value per group. HAVING then filters those groups by a condition on the aggregates, for example keeping departments whose average salary exceeds 60,000. WHERE filters individual rows before grouping; HAVING filters groups after it.
q: What is the difference between WHERE and HAVING?
a: WHERE filters rows before they are grouped and cannot use aggregate functions. HAVING filters groups after GROUP BY and can use aggregates such as COUNT(*) or AVG(salary). Put row conditions in WHERE so fewer rows reach the grouping step, and only aggregate conditions in HAVING.
q: What is the difference between COUNT(*) and COUNT(column)?
a: COUNT(*) counts rows, whatever they contain. COUNT(column) counts rows where that column is not NULL, and COUNT(DISTINCT column) counts distinct non-NULL values. On a table of seven employees where one salary is NULL, they return 7, 6 and the number of different salaries.
q: How do you find the second highest salary in SQL?
a: Three standard ways: SELECT MAX(salary) WHERE salary is below the overall MAX; SELECT DISTINCT salary ORDER BY salary DESC LIMIT 1 OFFSET 1; or DENSE_RANK() over salary descending, keeping rank 2. The DISTINCT matters: without it, a tie for the top salary makes the second row another copy of the highest.
q: What is the difference between RANK and DENSE_RANK?
a: Both give tied rows the same rank. RANK then skips numbers, so two rows tied at first are followed by rank 3. DENSE_RANK does not skip, so the next row gets rank 2. ROW_NUMBER never ties: it numbers rows 1, 2, 3 in the window's order.
q: What is a correlated subquery?
a: A correlated subquery refers to a column of the outer query, so it is logically re-evaluated for each outer row. Finding employees who earn more than their own department's average needs one, because the average depends on each row's department. Uncorrelated subqueries run once.
q: Why can't I use a column alias in WHERE?
a: WHERE is evaluated before SELECT, so the alias does not exist yet when rows are filtered. Repeat the expression, or compute it in a derived table or CTE and filter outside. Standard SQL allows SELECT aliases in ORDER BY; MySQL also accepts them in GROUP BY and HAVING.
---

Most questions asked of a database are summaries: how many students per branch, the average package per company, the top scorer in each section. SQL answers them with **aggregate functions**, **GROUP BY** and **HAVING**, and answers "compared with what?" with **subqueries** and **window functions**. This note works all of them on one small table, shows exact results (checked on MySQL 8), solves the "second highest salary" question three ways, and ends with the logical order in which SQL evaluates a query, which explains most of the errors you will meet.

## The example tables

`employees` (Neha's salary is not yet set):

| emp_id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Engineering | 90000 |
| 2 | Vikram | Engineering | 75000 |
| 3 | Meera | Engineering | 90000 |
| 4 | Rohan | Sales | 60000 |
| 5 | Priya | Sales | 65000 |
| 6 | Kabir | HR | 50000 |
| 7 | Neha | HR | NULL |

`departments`: Engineering in Bengaluru, Sales in Mumbai, HR in Mumbai, and Legal in Delhi (Legal has no employees).

## Aggregate functions and NULLs

An aggregate function turns many rows into one value. Every aggregate except `COUNT(*)` **ignores NULLs**:

| Expression | Result | Why |
| --- | --- | --- |
| `COUNT(*)` | 7 | Counts rows |
| `COUNT(salary)` | 6 | Neha's NULL is skipped |
| `COUNT(DISTINCT salary)` | 5 | 90000 appears twice |
| `SUM(salary)` | 430000 | NULL skipped |
| `AVG(salary)` | 71666.6667 | 430000 / 6, not / 7 |
| `AVG(COALESCE(salary, 0))` | 61428.5714 | 430000 / 7, treating NULL as 0 |
| `MIN(salary)`, `MAX(salary)` | 50000, 90000 | NULL skipped |

Whether NULL should count as zero is a business decision, and `AVG` silently decides it for you. Two edge cases: over zero rows `COUNT` returns 0 but `SUM`, `AVG`, `MIN` and `MAX` return NULL. MySQL prints the average of integers with four decimal places.

## GROUP BY

`GROUP BY` splits the rows into groups with equal values in the listed columns, and each aggregate is computed per group:

```sql
SELECT dept,
       COUNT(*)      AS staff,
       COUNT(salary) AS paid,
       SUM(salary)   AS total,
       AVG(salary)   AS avg_salary
FROM employees
GROUP BY dept
ORDER BY dept;
```

| dept | staff | paid | total | avg_salary |
| --- | --- | --- | --- | --- |
| Engineering | 3 | 3 | 255000 | 85000.0000 |
| HR | 2 | 1 | 50000 | 50000.0000 |
| Sales | 2 | 2 | 125000 | 62500.0000 |

The rule: every column in the `SELECT` list must either appear in `GROUP BY` or be inside an aggregate. `SELECT dept, name, MAX(salary) … GROUP BY dept` is ambiguous (which name?), and MySQL 8, whose default `sql_mode` includes `ONLY_FULL_GROUP_BY`, rejects it with error 1055. Older MySQL versions returned an arbitrary name, which is why old answers online sometimes "work". All NULLs in a grouping column form one group.

## HAVING vs WHERE

`HAVING` filters groups, so it can test aggregates:

```sql
SELECT dept, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept
HAVING AVG(salary) > 60000;
```

Result: Engineering 85000.0000 and Sales 62500.0000; HR (50000) is dropped. Combining both filters shows the order in which they run:

```sql
SELECT dept, COUNT(*) AS high_earners
FROM employees
WHERE salary > 60000
GROUP BY dept
HAVING COUNT(*) >= 2;
```

`WHERE` first keeps the rows with salary over 60000 (Asha, Vikram, Meera and Priya; Rohan's 60000 is not greater, and Neha's NULL is UNKNOWN). Grouping gives Engineering 3 and Sales 1, and `HAVING` keeps only **Engineering, 3**.

| Aspect | WHERE | HAVING |
| --- | --- | --- |
| Filters | Individual rows | Groups |
| Runs | Before GROUP BY | After GROUP BY |
| Aggregates allowed | No | Yes |
| Without GROUP BY | Normal use | Treats the whole result as one group |

## Subqueries

A **subquery** is a query inside another query. It can return one value, a list, or a table.

**Scalar subquery** (one value): employees paid more than the company average of 71666.67.

```sql
SELECT name, salary FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```

Result: Asha 90000, Vikram 75000, Meera 90000.

**IN subquery** (a list): employees in Mumbai departments. `WHERE dept IN (SELECT dept FROM departments WHERE city = 'Mumbai')` returns Rohan, Priya, Kabir and Neha.

**EXISTS** (is there at least one row?): departments with someone earning over 80000.

```sql
SELECT d.dept FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e
              WHERE e.dept = d.dept AND e.salary > 80000);
```

Result: Engineering. With `NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept = d.dept)` the result is Legal, the department with no employees. `EXISTS` only checks whether a row exists, so `SELECT 1` is the convention. Prefer `NOT EXISTS` to `NOT IN` whenever the subquery's column can be NULL; the [joins note](/notes/dbms/sql-joins) shows `NOT IN` returning nothing because of one NULL.

**Correlated subquery** (refers to the outer row): employees who earn more than their own department's average.

```sql
SELECT e.name, e.dept, e.salary
FROM employees e
WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept = e.dept);
```

| name | dept | salary |
| --- | --- | --- |
| Asha | Engineering | 90000 |
| Meera | Engineering | 90000 |
| Priya | Sales | 65000 |

Engineering's average is 85000, Sales's 62500 and HR's 50000 (NULL ignored). Kabir's 50000 is not greater than 50000, and Neha's NULL compares as UNKNOWN. Changing `>` to `=` and `AVG` to `MAX` gives the top earners per department: Asha and Meera (tied), Priya and Kabir.

## Window functions

A **window function** computes a value for each row from a set of related rows (its window) without collapsing them the way `GROUP BY` does. `OVER (PARTITION BY … ORDER BY …)` defines the window. MySQL supports them from version 8.0.

The three ranking functions differ only on ties:

```sql
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC, emp_id) AS row_num,
       RANK()       OVER (ORDER BY salary DESC)         AS rnk,
       DENSE_RANK() OVER (ORDER BY salary DESC)         AS dense_rnk
FROM employees
WHERE salary IS NOT NULL;
```

| name | salary | row_num | rnk | dense_rnk |
| --- | --- | --- | --- | --- |
| Asha | 90000 | 1 | 1 | 1 |
| Meera | 90000 | 2 | 1 | 1 |
| Vikram | 75000 | 3 | 3 | 2 |
| Priya | 65000 | 4 | 4 | 3 |
| Rohan | 60000 | 5 | 5 | 4 |
| Kabir | 50000 | 6 | 6 | 5 |

`ROW_NUMBER` never ties (`emp_id` breaks the tie so the numbering is repeatable), `RANK` leaves a gap after a tie (1, 1, 3), and `DENSE_RANK` does not (1, 1, 2). Had Neha's row been included, MySQL would place the NULL last in descending order with rank 7 and dense rank 6.

`PARTITION BY` restarts the window for each group. `RANK() OVER (PARTITION BY dept ORDER BY salary DESC)` ranks Asha and Meera 1 and Vikram 3 in Engineering, Priya 1 and Rohan 2 in Sales, and Kabir 1 in HR. To keep exactly one top earner per department, number the rows and filter in an outer query, because window functions cannot appear in `WHERE`:

```sql
SELECT dept, name, salary
FROM (SELECT dept, name, salary,
             ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC, emp_id) AS rn
      FROM employees) t
WHERE rn = 1;
```

Result: Engineering Asha 90000, HR Kabir 50000, Sales Priya 65000. Ordinary aggregates also work as windows: `AVG(salary) OVER (PARTITION BY dept)` puts each department's average beside every row (85000 on each Engineering row).

## Second and Nth highest salary, three ways

The salaries in descending order are 90000, 90000, 75000, 65000, 60000, 50000 and NULL, so the second highest *distinct* salary is **75000**.

```sql
-- 1. MAX below the MAX
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- 2. Sort distinct salaries and skip one
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- 3. DENSE_RANK
SELECT DISTINCT salary
FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
      FROM employees
      WHERE salary IS NOT NULL) t
WHERE rnk = 2;
```

All three return 75000. How they generalize to the Nth highest:

| Method | Nth highest | Ties | When no Nth value exists |
| --- | --- | --- | --- |
| MAX below MAX | Needs N−1 nested subqueries; fine for N = 2 only | Handled | Returns one row holding NULL |
| `LIMIT 1 OFFSET N−1` | Easy | Handled only with DISTINCT; without it this query returns 90000 | Returns no rows |
| `DENSE_RANK` with `rnk = N` | Easy; also works per department with PARTITION BY | Handled | Returns no rows |

`RANK` would be wrong in method 3: after the tie at 90000 it jumps to rank 3, and no row has rank 2. A fourth classic uses a correlated count: keep the salary that exactly N−1 distinct salaries exceed, `WHERE N - 1 = (SELECT COUNT(DISTINCT x.salary) FROM employees x WHERE x.salary > e.salary)`. MySQL does not accept an expression such as `N - 1` directly after `OFFSET`, so for a variable N use a prepared statement or the `DENSE_RANK` form.

## Logical order of SQL clauses

You write `SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT`, but the DBMS evaluates the clauses in a different logical order:

| Step | Clause | What happens |
| --- | --- | --- |
| 1 | FROM and JOIN … ON | Build the working set of rows |
| 2 | WHERE | Keep rows whose condition is TRUE |
| 3 | GROUP BY | Form groups |
| 4 | HAVING | Keep groups whose condition is TRUE |
| 5 | SELECT | Compute expressions, aggregates, window functions and aliases |
| 6 | DISTINCT | Remove duplicate rows |
| 7 | ORDER BY | Sort |
| 8 | LIMIT and OFFSET | Cut the result |

This order explains the rules: `WHERE` cannot use aggregates (groups do not exist yet) or SELECT aliases (they do not exist yet); window functions see only rows that survived `WHERE` and `HAVING`; `ORDER BY` can use aliases because it runs after `SELECT`. The optimizer may physically reorder work, but never in a way that changes this result.

## Common mistakes

- Expecting `AVG` to count NULLs as zero: it ignores them.
- Selecting a column that is neither grouped nor aggregated: an error under `ONLY_FULL_GROUP_BY`, a random value in old MySQL.
- Filtering an aggregate in `WHERE` instead of `HAVING`.
- Using a window function in `WHERE`: compute it in a derived table and filter outside.
- Forgetting `DISTINCT` in the `LIMIT … OFFSET` answer to the second highest salary.
- Using `RANK` where `DENSE_RANK` is meant for "Nth highest".

## Interview questions

**What does SELECT COUNT(*) FROM employees GROUP BY dept return for an empty table?** No rows. With no rows there are no groups, whereas `SELECT COUNT(*) FROM employees` without `GROUP BY` returns one row holding 0.

**Can you use HAVING without GROUP BY?** Yes. The whole result is then one group, so `SELECT COUNT(*) FROM employees HAVING COUNT(*) > 5` returns one row (7) or none.

**What is the difference between a correlated and a non-correlated subquery?** A non-correlated subquery does not refer to the outer query and is evaluated once. A correlated one refers to the outer row and is logically evaluated per outer row, though optimizers often turn it into a join.

**IN or EXISTS: which should you use?** They give the same result for positive tests, and optimizers often run both as a semi-join. For negative tests use NOT EXISTS, because NOT IN returns nothing if the subquery yields a NULL.

**How do you find the highest-paid employee in each department?** Either a correlated subquery comparing salary with the department's MAX, which returns all tied employees, or ROW_NUMBER (or RANK) partitioned by department and filtered to 1 in an outer query.

**Write a query for departments with more than one employee.** `SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 1`. Here it returns Engineering 3, HR 2 and Sales 2.

**What is the difference between GROUP BY and a window function's PARTITION BY?** GROUP BY returns one row per group. PARTITION BY keeps every row and attaches the per-group value to each, so you can show a salary beside its department average.

**In what order is a SELECT statement evaluated?** FROM and joins, WHERE, GROUP BY, HAVING, SELECT (including window functions), DISTINCT, ORDER BY, LIMIT. Most "unknown column" and "invalid use of group function" errors follow from this order.

Next, make several statements succeed or fail together: [Transactions and ACID Properties in DBMS](/notes/dbms/transactions-and-acid). Window functions and subqueries are examined in the [SQL (Intermediate) skill test](/skill-tests/sql-intermediate).

Practise on real tables: [Second-Best Innings in the College Cup](/sql/second-best-innings-score) (the "second highest" problem), [Quiz Team Standings With Shared Places](/sql/quiz-team-standings-with-ties) (DENSE_RANK) and [Students Who Attended Every Fest Workshop](/sql/students-who-attended-every-fest-workshop) (HAVING with a subquery).
