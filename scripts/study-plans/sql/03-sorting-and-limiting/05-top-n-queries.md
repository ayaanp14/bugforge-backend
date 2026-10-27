---
title: Top-N queries and the Nth highest value
minutes: 15
seo-title: SQL Top N Query and Second Highest Salary with LIMIT
description: Find the top N rows, the bottom N, and the Nth highest value in MySQL with ORDER BY, DISTINCT and LIMIT OFFSET, returning NULL when there is no Nth value.
question: How do you find the second highest salary in SQL?
answer: Take the distinct salaries in descending order, skip one and keep one: `SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1`. `DISTINCT` stops two people on the top salary from counting as first and second. To return NULL instead of no row when there is no second salary, wrap it as a scalar subquery: `SELECT (…) AS second_highest`.
q: How do I find the Nth highest salary in MySQL?
a: Use `SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET N - 1`, writing the offset as a literal such as `OFFSET 2` for the third highest, because MySQL does not allow expressions in LIMIT. Wrap it in `SELECT (…) AS nth` to get NULL when fewer than N distinct salaries exist.
q: Why use DISTINCT in the second highest salary query?
a: Without it, duplicates take positions. If two employees both earn the top salary of 9000, `ORDER BY salary DESC LIMIT 1 OFFSET 1` returns 9000 again. With `DISTINCT` the salaries 9000, 7000, 5000 are ranked as values, so the second highest is 7000.
q: How do I get the top 3 rows including ties in MySQL?
a: `LIMIT 3` cuts ties arbitrarily, and MySQL has no `WITH TIES`. Keep every row whose value is at least the third-highest distinct value with a subquery, or use `DENSE_RANK()` and filter on rank 3 or less. Both are covered later in the course.
q: What is the difference between top-N and top-N per group?
a: Top-N returns the N best rows of the whole result, which ORDER BY plus LIMIT handles. Top-N per group returns the N best rows inside every group, such as the two best-paid people of each department, which LIMIT cannot do because it applies once to the whole result; it needs window functions.
---
"Show me the five best-selling products." "Who are the three newest customers?" "What is the second highest salary?" Questions of this shape — the first or last few rows by some measure, or the value in one particular position — are called **top-N queries**, and they are among the most asked SQL questions in placement rounds. With `ORDER BY` and `LIMIT` you already have the tools; what this lesson adds is the details that separate a right answer from an almost-right one: duplicates, ties, empty results and what to return when the answer does not exist.

## Top N and bottom N

Sort by the measure, best first, and keep N:

```sql
-- The five most expensive products
SELECT name, price
FROM products
ORDER BY price DESC, id
LIMIT 5;

-- The three newest customers
SELECT name, joined_on
FROM customers
ORDER BY joined_on DESC, id DESC
LIMIT 3;
```

"Bottom N" is the same with the direction flipped. Combine with `WHERE` to rank only the candidates you care about — the cheapest in-stock items, the latest paid orders — because the filter runs before the sort and the limit:

```sql
SELECT name, price
FROM products
WHERE stock > 0 AND category = 'stationery'
ORDER BY price, id
LIMIT 3;
```

Remember the NULL rule when ranking a nullable column: in MySQL an ascending sort puts NULLs first, so "the three smallest discounts" could return three NULLs. Exclude them with `WHERE discount IS NOT NULL` or push them to the end with `ORDER BY discount IS NULL, discount`.

## The single top row

`LIMIT 1` gives the row holding the maximum, with all its columns:

```sql
SELECT name, salary
FROM employees
ORDER BY salary DESC, id
LIMIT 1;
```

The aggregate `MAX(salary)`, which arrives in the aggregation module, gives the top *value*; `ORDER BY … LIMIT 1` gives the top *row*, which is usually what "who earns the most" asks. If two people share the top salary, `LIMIT 1` returns one of them — the tie-breaker `id` decides which, and you should say so in an interview.

## The Nth highest value

The famous one: *write a query that returns the second highest salary*. Take the salaries, highest first, skip one, keep one:

```sql
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;
```

Why `DISTINCT`? Consider salaries 9000, 9000, 7000, 5000. Without it, the sorted list is 9000, 9000, 7000, 5000 and the second row is 9000 — the same value as the highest. The question asks for the second highest *salary*, a value, so duplicates must collapse first: 9000, 7000, 5000, and the second is 7000. `DISTINCT` runs before `ORDER BY` and `LIMIT`, which is exactly what is needed.

For the third highest, skip two: `LIMIT 1 OFFSET 2`. In general the Nth highest is `OFFSET N - 1`, but in MySQL that offset must be written as a literal number (or a prepared-statement placeholder); `OFFSET N - 1` with an expression is a syntax error. Inside a stored function, the classic LeetCode answer computes `SET N = N - 1;` first and then uses `LIMIT 1 OFFSET N`.

## Returning NULL when there is no answer

If every employee earns 9000, there is no second highest salary, and the query above returns **no rows**. Many problem statements ask for `NULL` in that case — one row whose value is NULL. The trick is to use the query as a **scalar subquery**: a query in parentheses used where a single value is expected.

```sql
SELECT (
  SELECT DISTINCT salary
  FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS second_highest;
```

| second_highest |
| --- |
| NULL |

The outer `SELECT` has no `FROM` and always produces exactly one row. Its one column is the value of the inner query — and a scalar subquery that finds no row evaluates to NULL. When a second salary does exist, the same query returns it. Subqueries get a full module later; this one pattern is worth learning now because it appears in so many interviews.

## Ties at the cut-off

`LIMIT 3` returns exactly three rows even when the fourth row has the same score as the third. Whether that is right depends on the question. "Show three products for the banner" — fine, break the tie by id. "Award a prize to the top three scores" — not fine, because the person on the fourth row tied for third and deserves one too.

MySQL has no `FETCH FIRST 3 ROWS WITH TIES`. The ways to include ties are:

- find the third-highest distinct value and keep every row at least that high — a subquery, `WHERE score >= (SELECT DISTINCT score … LIMIT 1 OFFSET 2)`;
- rank the rows with `DENSE_RANK()` and keep ranks 1 to 3 — a window function.

Both arrive later in the course. In an interview, the valuable move is noticing the tie question at all and asking which behaviour is wanted.

## Top N per group is a different problem

"The two highest-paid employees in *each* department" looks similar but cannot be done with `ORDER BY … LIMIT`, because `LIMIT` applies once to the whole result, not once per department. Sorting by `dept, salary DESC` puts each department's best at the top of its block, but cutting the blocks needs a window function (`ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)`) or a correlated subquery. Recognising that boundary is part of knowing top-N queries.

## Before you move on

- Top N: `ORDER BY measure DESC, id LIMIT n`; bottom N flips the direction.
- Filter first, and decide what NULLs should do.
- Nth highest value: `SELECT DISTINCT … ORDER BY … DESC LIMIT 1 OFFSET n-1`, with a literal offset.
- Wrap it in `SELECT (…) AS name` to get NULL instead of no rows.
- `LIMIT` cuts ties arbitrarily and works on the whole result, never per group.
