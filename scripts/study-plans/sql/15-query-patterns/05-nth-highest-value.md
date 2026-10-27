---
title: The nth highest value — LIMIT OFFSET, DENSE_RANK and the NULL answer
minutes: 15
seo-title: Find the Nth Highest Salary in SQL: Four Ways
description: The nth highest value in SQL with LIMIT and OFFSET, a dense rank, a correlated COUNT or MAX below MAX, and returning NULL when there are fewer than n values.
question: How do you find the nth highest salary in SQL?
answer: To find the nth highest salary in SQL, sort the distinct salaries in descending order and skip n minus 1 of them: `SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET n-1`. Wrap it in a scalar subquery so that fewer than n salaries returns NULL instead of no rows. DENSE_RANK() = n gives the same answer and extends to each group.
q: How do you find the second highest salary in SQL?
a: The shortest answer is `SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`, which returns NULL when every salary is equal. The general answer is a scalar subquery with `SELECT DISTINCT salary ... ORDER BY salary DESC LIMIT 1 OFFSET 1`.
q: Why use DENSE_RANK and not RANK for the nth highest value?
a: RANK leaves gaps after ties: two salaries tied at the top are both rank 1 and the next is rank 3, so no row has rank 2. DENSE_RANK gives the next distinct value rank 2, so `DENSE_RANK() = n` always means the nth highest distinct value.
q: How do you return NULL when there is no nth highest value?
a: Put the query inside a scalar subquery: `SELECT (SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2) AS third`. A scalar subquery that finds no row evaluates to NULL, so the outer SELECT still returns one row. `MAX` over the filtered rows also returns NULL on no rows.
q: How do you find the nth highest value in each group?
a: Rank inside each group with `DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC)` and keep rank n. To list groups that have no nth value too, start from the distinct groups and LEFT JOIN the ranked rows on the group and `rk = n`.
---
"Find the second highest salary" may be the most asked SQL interview question there is, and its general form — the nth highest value, overall or per group — is a good test of three things at once: sorting with `LIMIT`/`OFFSET`, ranking functions, and what a query returns when the answer does not exist. That last part is where most answers fail. This lesson shows four ways to write it, which one to reach for, and how to make it return `NULL` correctly.

## Pin down the question

Before writing, settle two points, because the sample data in an interview is usually chosen to test them:

1. **Distinct values or rows?** With salaries 300, 300, 200, is the second highest 300 (the second row) or 200 (the second distinct value)? Almost always the second *distinct* value — 200. Say that you are assuming it.
2. **What if there is none?** With one employee, or everyone on the same salary, there is no second highest. The usual requirement is a single row holding `NULL`, not an empty result.

## Way 1: LIMIT and OFFSET

Sort the distinct values descending and skip `n − 1` of them:

```sql
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;          -- second highest; MySQL also accepts LIMIT 1, 1
```

This returns the right value when it exists and *no rows* when it does not. To turn "no rows" into a row with `NULL`, make it a scalar subquery:

```sql
SELECT (
  SELECT DISTINCT salary
  FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS second_highest;
```

A scalar subquery that finds nothing evaluates to `NULL`, and the outer `SELECT` without a `FROM` always produces exactly one row. This wrapper is the detail interviewers look for.

`OFFSET` must be a literal in MySQL — `LIMIT 1 OFFSET N - 1` with a variable is not allowed in a plain query. Inside a stored function you compute `SET n = n - 1;` first and then write `LIMIT 1 OFFSET n`, which MySQL accepts for routine variables. SQL Server spells the clause `ORDER BY salary DESC OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY`; PostgreSQL accepts `LIMIT 1 OFFSET 1` like MySQL.

## Way 2: DENSE_RANK

Rank the salaries, then keep rank `n`:

```sql
SELECT MAX(salary) AS third_highest
FROM (
  SELECT salary,
         DENSE_RANK() OVER (ORDER BY salary DESC) AS rk
  FROM employees
) AS ranked
WHERE rk = 3;
```

`DENSE_RANK` gives equal salaries the same rank and leaves no gaps: 300, 300, 200, 100 are ranked 1, 1, 2, 3. `RANK` would give 1, 1, 3, 4 — there would be no rank 2 at all, and asking for the second highest would wrongly return nothing. `ROW_NUMBER` would number the two 300s as 1 and 2, and "rank 2" would be 300, the row answer rather than the distinct one. The comparison of the three ranking functions on tied data is a theory question in its own right; this query is where it matters.

The outer `MAX` does two jobs: it collapses the tied rows of rank 3 into one value, and, like every aggregate without `GROUP BY`, it returns one row with `NULL` when no row has rank 3. So this version needs no scalar-subquery wrapper.

## Way 3: a correlated count

Before window functions, the nth highest value was "the salary that exactly `n − 1` distinct salaries are greater than":

```sql
SELECT DISTINCT e.salary
FROM employees AS e
WHERE 2 = (                 -- n - 1 = 2, so the third highest
  SELECT COUNT(DISTINCT x.salary)
  FROM employees AS x
  WHERE x.salary > e.salary
);
```

It is correct and portable, and it is worth recognising, but the subquery runs once per row — quadratic on a large table without an index. Mention it as the classic alternative and prefer one of the others.

## Way 4: MAX below MAX

For the second highest only, the shortest correct answer is:

```sql
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

The inner query finds the top; the outer finds the largest value strictly below it — automatically distinct, and `NULL` when nothing is below. It does not generalise well (the third highest needs another nesting level), but for "second highest" it is the answer many interviewers expect first.

## Per group

"The second highest salary in each department" partitions the ranking:

```sql
SELECT dept, salary
FROM (
  SELECT dept, salary,
         DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk
  FROM employees
) AS ranked
WHERE rk = 2
GROUP BY dept, salary
ORDER BY dept;
```

`GROUP BY dept, salary` removes repeats when two people share the second salary (a `SELECT DISTINCT` does the same). A department with a single distinct salary simply does not appear. If the report must list *every* department, with `NULL` where there is no second salary, start from the departments and outer-join:

```sql
SELECT d.dept, r.salary AS second_salary
FROM (SELECT DISTINCT dept FROM employees) AS d
LEFT JOIN (
  SELECT DISTINCT dept, salary
  FROM (SELECT dept, salary,
               DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk
        FROM employees) AS x
  WHERE rk = 2
) AS r ON r.dept = d.dept
ORDER BY d.dept;
```

This "start from the full list of groups, then LEFT JOIN the answers" shape is the per-group version of the scalar-subquery wrapper: it guarantees one row per group whether or not an answer exists. A correlated scalar subquery per department — `(SELECT DISTINCT salary … WHERE dept = d.dept ORDER BY salary DESC LIMIT 1 OFFSET 1)` — does the same in MySQL and PostgreSQL.

## NULL salaries

`ORDER BY salary DESC` puts `NULL` last in MySQL (NULL sorts as the smallest value), and `DENSE_RANK` ranks NULLs too — last in descending order. If the column can be NULL, decide whether an unknown salary is a value at all; usually it is not, and a `WHERE salary IS NOT NULL` keeps it from becoming "the fourth highest". `MAX` and `COUNT(DISTINCT …)` ignore NULLs by themselves.

## How to say it in an interview

"I'll take the nth highest *distinct* value, and return NULL if there isn't one." Then write `DENSE_RANK() … WHERE rk = n` under a `MAX`, or the `LIMIT 1 OFFSET n−1` inside a scalar subquery, and explain why `RANK` and `ROW_NUMBER` give the wrong answer on ties. For the per-group version, partition the rank, and LEFT JOIN from the list of groups if every group must appear.
