---
title: The classic SQL questions — six problems every interview reuses
minutes: 18
seo-title: Classic SQL Interview Questions with Answers and Approaches
description: The classic SQL interview questions solved two ways: second highest salary, duplicate emails, out-earning a manager, three in a row, top three, never ordered.
question: What are the most common SQL interview questions?
answer: The most common SQL interview questions are the second highest salary, finding duplicate emails, employees who earn more than their managers, values that appear three times in a row, the top three salaries in each department, and customers who never placed an order. Between them they test sorting with LIMIT, GROUP BY with HAVING, self-joins, window functions, ranking per group and anti-joins.
q: How do you find employees who earn more than their managers in SQL?
a: Join the employee table to itself, once as the employee and once as the manager: `FROM employees e JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary`. The inner join leaves out employees with no manager, which is correct because they have no manager to out-earn.
q: How do you find customers who never placed an order?
a: Use an anti-join: `LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL`, or `WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)`. Avoid `NOT IN (SELECT customer_id FROM orders)` unless that column cannot be NULL, because a single NULL makes NOT IN return no rows.
q: How do you find numbers that appear at least three times consecutively in SQL?
a: Compare each row with the next two using `LEAD(num, 1)` and `LEAD(num, 2)` over the id order, and keep the rows where all three are equal, selecting DISTINCT values. Before window functions the same question was answered with a three-way self-join on `id`, `id + 1` and `id + 2`.
q: How do you get the top three salaries in each department?
a: Rank salaries within each department with `DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)` and keep ranks 1 to 3. DENSE_RANK keeps everyone tied at a level and counts levels, not people, which is what "top three salaries" usually means.
---
Most SQL interview rounds draw from a small pool of questions. The wording changes — salaries become scores, emails become usernames, customers become students — but the shapes repeat, and an interviewer who asks one of them is not testing whether you can invent the answer. They are testing whether you know it, can write it cleanly, and can talk about its edge cases. This lesson works through the six that appear most often, each with the expected answer, a second approach, and the follow-up questions they lead to.

## 1. The second highest salary

*Given an `employees` table, return the second highest salary, or NULL if there is none.* The nth-highest lesson covered this in depth; the interview version wants two things said out loud — *distinct* salaries, and NULL when there is no answer.

```sql
SELECT (
  SELECT DISTINCT salary FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS second_highest;

-- or
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

Follow-ups: the nth highest (`DENSE_RANK() … = n` under a `MAX`), per department (partition the rank), and why `RANK` fails on ties (it skips rank 2 after a tie at the top).

## 2. Duplicate emails

*Report every email address that appears in more than one row.*

```sql
SELECT email
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

This is a test of `HAVING`: the condition is on a group's count, so it cannot go in `WHERE`, which runs before grouping. The alternative is a self-join (`FROM users a JOIN users b ON a.email = b.email AND a.id < b.id`, then `SELECT DISTINCT a.email`) — correct but heavier. Follow-ups: case-insensitive matching (`GROUP BY LOWER(email)` — MySQL's default collation already ignores case, other engines do not), and "now delete the duplicates, keeping the lowest id", which is the deduplication lesson's `DELETE` with the derived-table wrapper or the self-join `DELETE`.

## 3. Earning more than their manager

*Each employee row has a `manager_id` pointing at another employee. List the employees paid more than their manager.*

```sql
SELECT e.name AS employee
FROM employees AS e
JOIN employees AS m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

A **self-join**: the same table twice under two aliases, one in the role of the employee and one as the manager. The inner join quietly drops employees with no manager (the CEO), which is right — there is nothing to compare. A correlated subquery says the same thing (`WHERE e.salary > (SELECT m.salary FROM employees m WHERE m.id = e.manager_id)`); a NULL manager makes the subquery NULL and the comparison unknown, so those rows drop out there too. Follow-ups: "show the manager's name and salary as well" (just select from `m`), "employees with no manager" (`WHERE manager_id IS NULL`), and "the whole chain of managers above someone", which needs a recursive CTE.

## 4. Three in a row

*A `logs` table has a sequential `id` and a value `num`. Find every value that appears at least three times consecutively.*

```sql
SELECT DISTINCT num AS consecutive_num
FROM (
  SELECT num,
         LEAD(num, 1) OVER (ORDER BY id) AS next1,
         LEAD(num, 2) OVER (ORDER BY id) AS next2
  FROM logs
) AS t
WHERE num = next1 AND num = next2;
```

`LEAD(num, 2)` reaches two rows ahead. A run of five equal values matches three times, hence `DISTINCT`. The pre-window answer is a three-way self-join:

```sql
SELECT DISTINCT a.num
FROM logs a
JOIN logs b ON b.id = a.id + 1 AND b.num = a.num
JOIN logs c ON c.id = a.id + 2 AND c.num = a.num;
```

The join version assumes the ids have no holes — `id + 1` must be the next row. The `LEAD` version only needs the ids to give the order, which is safer; say so. For "at least N in a row" with a large N, neither scales nicely, and the gaps-and-islands grouping is the general answer: the two-row-number difference groups each run, and `HAVING COUNT(*) >= N` keeps the long ones.

## 5. The top three salaries in each department

*Return each department's employees whose salary is among the three highest distinct salaries of that department.*

```sql
SELECT d.name AS department, e.name AS employee, e.salary
FROM (
  SELECT e.*,
         DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rk
  FROM employees AS e
) AS e
JOIN departments AS d ON d.id = e.department_id
WHERE e.rk <= 3
ORDER BY department, e.salary DESC, employee;
```

The whole question turns on the ranking function. "Top three *salaries*" means three salary levels, and everyone on those levels — `DENSE_RANK`. "Top three *earners*" with ties broken arbitrarily would be `ROW_NUMBER`; "top three, but a tie for second pushes out the third" is `RANK`. Ask which is meant, or state your choice. The pre-window answer is a correlated count: keep a row when fewer than three distinct salaries in its department are higher (`WHERE 3 > (SELECT COUNT(DISTINCT s.salary) FROM employees s WHERE s.department_id = e.department_id AND s.salary > e.salary)`). It is correct, worth knowing, and quadratic.

## 6. Customers who never ordered

*List the customers with no orders.*

```sql
SELECT c.name
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- or
SELECT c.name
FROM customers AS c
WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.id);
```

This is an **anti-join**: rows of one table with no match in another. Both forms are correct and MySQL 8 optimises them alike. The trap is the third form:

```sql
WHERE c.id NOT IN (SELECT customer_id FROM orders)   -- dangerous
```

If any `orders.customer_id` is NULL, `c.id NOT IN (…, NULL)` is never true — it is either false or unknown — and the query returns **no rows at all**. Use `NOT EXISTS` or the `LEFT JOIN`; if you write `NOT IN`, add `WHERE customer_id IS NOT NULL` inside. Interviewers ask this one partly to see whether you know that trap. A follow-up: "customers with no order *in 2024*" — the date condition belongs in the `ON` clause of the left join (or inside the `NOT EXISTS`), not in `WHERE`, or the anti-join breaks.

## How to work through any of them

The pattern of a good answer is the same each time. Restate the question with its ambiguity resolved ("distinct salaries", "ties included"). Name the shape ("self-join", "anti-join", "top-N per group"). Write the version you trust, with a full `ORDER BY`. Then mention the alternative and one edge case — NULLs, ties, an empty table, missing ids. Those last two sentences are what separate a memorised answer from an understood one, and they take ten seconds.
