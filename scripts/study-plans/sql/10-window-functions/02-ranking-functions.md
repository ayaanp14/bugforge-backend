---
title: Ranking functions — ROW_NUMBER, RANK, DENSE_RANK and NTILE
minutes: 15
seo-title: SQL RANK vs DENSE RANK vs ROW NUMBER: Ties Explained
description: Row numbers are unique, RANK shares a number on ties and leaves a gap after, dense rank leaves none. Ranking per partition, tie-breakers, NTILE and percentiles.
question: What is the difference between ROW_NUMBER, RANK and DENSE_RANK?
answer: All three number rows in the order given by `OVER (ORDER BY ...)`. `ROW_NUMBER` gives every row a different number even when values tie. `RANK` gives tied rows the same number and then skips, so scores 90, 90, 80 rank 1, 1, 3. `DENSE_RANK` gives ties the same number without skipping, so they rank 1, 1, 2. They differ only when the ORDER BY values tie.
q: How do you find the second highest salary in SQL?
a: Rank the distinct salaries with `DENSE_RANK() OVER (ORDER BY salary DESC)` in a CTE and select the rows where the rank is 2. `DENSE_RANK` is right because tied top salaries share rank 1 and the next salary is still 2. Without window functions, use `SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`.
q: Is ROW_NUMBER deterministic when there are ties?
a: No. When rows tie on every ORDER BY expression, the database may number them in any order, and the order can change between runs or versions. Add a unique tie-breaker, such as the primary key, to the window's ORDER BY: `ROW_NUMBER() OVER (ORDER BY score DESC, id)`.
q: What does NTILE do in SQL?
a: `NTILE(n)` splits the ordered rows of each partition into n groups as equal in size as possible and returns each row's group number, 1 to n. With 10 rows, `NTILE(4)` makes groups of 3, 3, 2 and 2, the larger groups first. It is used for quartiles, deciles and percentile buckets.
q: When should I use RANK instead of DENSE_RANK?
a: Use `RANK` for competition-style standings, where two people tied for first mean the next person is third because two people beat them. Use `DENSE_RANK` when you mean the nth distinct value, such as the second highest salary or the top three price levels.
q: Do ranking functions need ORDER BY in the OVER clause?
a: Yes, in practice. A rank only means something in an order, and MySQL numbers rows in an unspecified order without one. `ROW_NUMBER() OVER ()` is accepted but arbitrary; `RANK` and `DENSE_RANK` without an ORDER BY give every row rank 1.
---
"Who came first?" is one of the most common questions asked of data — the top sellers, the highest-paid in each department, the latest order per customer, the second highest salary. The ranking window functions answer it. `ROW_NUMBER`, `RANK` and `DENSE_RANK` all number rows in a chosen order; they differ only in how they treat ties, and choosing the right one is a favourite interview question precisely because it is easy to get wrong silently. This lesson covers the three, how ties behave, ranking within partitions, making a ranking deterministic, and the bucketing functions `NTILE`, `PERCENT_RANK` and `CUME_DIST`.

## Three ways to number rows

```text
scores
player | score
Asha   | 90
Ben    | 90
Chen   | 85
Dev    | 80
Eva    | 80
Farah  | 70
```

```sql
SELECT player, score,
       ROW_NUMBER() OVER (ORDER BY score DESC, player) AS row_num,
       RANK()       OVER (ORDER BY score DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY score DESC) AS dense_rnk
FROM scores
ORDER BY score DESC, player;
```

```text
player | score | row_num | rnk | dense_rnk
Asha   | 90    | 1       | 1   | 1
Ben    | 90    | 2       | 1   | 1
Chen   | 85    | 3       | 3   | 2
Dev    | 80    | 4       | 4   | 3
Eva    | 80    | 5       | 4   | 3
Farah  | 70    | 6       | 6   | 4
```

- **`ROW_NUMBER()`** gives 1, 2, 3, … — every row a different number, ties broken however the ORDER BY (or the engine) decides.
- **`RANK()`** gives tied rows the same number and then *skips*: two players share 1, so the next is 3. A row's rank is one plus the number of rows strictly ahead of it — competition ranking, as in sport.
- **`DENSE_RANK()`** gives ties the same number and does *not* skip: the next distinct score is 2. A row's dense rank is the position of its value among the distinct values.

Without ties, all three are identical. Note the aliases: `rank` is a reserved word in MySQL 8 (it names the function), so `AS rank` fails — use `rnk`, `position` or `` `rank` `` in backticks.

## Choosing between them

| Question | Function |
| --- | --- |
| Number rows uniquely, pick exactly one per group, paginate | `ROW_NUMBER` |
| Standings where ties share a place and push the next one down | `RANK` |
| "The nth highest value", "top three price levels" | `DENSE_RANK` |

The classic: **the second highest salary**. With salaries 100, 100, 90, `RANK` gives 1, 1, 3 — no row has rank 2, and the answer comes out empty. `ROW_NUMBER` gives 1, 2, 3 and returns 100 — the same as the highest. Only `DENSE_RANK` gives 1, 1, 2 and returns 90:

```sql
WITH ranked AS (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS dr
  FROM employees
)
SELECT DISTINCT salary FROM ranked WHERE dr = 2;
```

(The pre-window answer is still worth knowing: `SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`. It also handles "no second salary" by returning NULL.)

## Ranking within partitions

`PARTITION BY` restarts the numbering in every group:

```sql
SELECT dept, name, salary,
       DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank
FROM employees
ORDER BY dept, dept_rank, name;
```

```text
dept  | name  | salary | dept_rank
Eng   | Asha  | 90000  | 1
Eng   | Farah | 90000  | 1
Eng   | Ben   | 70000  | 2
Sales | Chen  | 50000  | 1
Sales | Dev   | 40000  | 2
```

Each department is ranked on its own. This is the building block of "top N per group", which has its own lesson.

## Making the ranking deterministic

`ROW_NUMBER` must give tied rows *different* numbers, and if the ORDER BY does not decide which gets which, the engine does — arbitrarily, and not necessarily the same way twice. A query that picks "row number 1" per customer can then return a different row tomorrow from the same data. Always finish a `ROW_NUMBER` ordering with a unique column:

```sql
ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC)
```

`RANK` and `DENSE_RANK` are deterministic by definition — ties get the same number — so they need no tie-breaker for the numbers themselves. But the *output order* of tied rows still needs one in the final ORDER BY.

## Bucketing: NTILE

`NTILE(n)` deals the ordered rows of each partition into `n` buckets as evenly as possible and returns the bucket number:

```sql
SELECT name, salary,
       NTILE(4) OVER (ORDER BY salary DESC, name) AS quartile
FROM employees
ORDER BY salary DESC, name;
```

With 10 rows and 4 buckets, the sizes are 3, 3, 2, 2 — the remainder goes to the first buckets. NTILE does not respect ties: two equal salaries can land in different quartiles if the boundary falls between them, so give it a tie-breaker like ROW_NUMBER. Uses: quartiles of customers by spend, deciles of response time, splitting work into n batches.

## Relative rank: PERCENT_RANK and CUME_DIST

Two functions express position as a fraction:

- `PERCENT_RANK()` = `(rank - 1) / (rows in partition - 1)`, from 0 for the first row to 1 for the last; ties share a value. A single-row partition gives 0.
- `CUME_DIST()` = (rows at or before this one, ties included) / (rows in partition), from just above 0 up to 1. "What fraction of employees earn at most this much?"

```sql
SELECT name, salary,
       ROUND(PERCENT_RANK() OVER (ORDER BY salary), 2) AS pct_rank,
       ROUND(CUME_DIST()   OVER (ORDER BY salary), 2) AS cume
FROM employees
ORDER BY salary, name;
```

Round both when you print them — they are fractions.

## Ranking after grouping

Like every window function, rankings run after GROUP BY, so you can rank aggregates directly:

```sql
SELECT customer_id,
       SUM(amount) AS spend,
       RANK() OVER (ORDER BY SUM(amount) DESC) AS spend_rank
FROM orders
GROUP BY customer_id
ORDER BY spend_rank, customer_id;
```

And, because they run *before* the final ORDER BY and LIMIT, you can rank everything and then show only a page — though for a simple "top 10 overall", `ORDER BY … LIMIT 10` is simpler and faster. Ranking functions earn their place when there are partitions or ties to respect.

## In other databases

The four functions and their tie rules are standard SQL and identical in PostgreSQL, SQL Server, Oracle and SQLite. SQL Server and Oracle also allow `ROW_NUMBER` to drive pagination in older code (`WHERE rn BETWEEN 11 AND 20`); MySQL and PostgreSQL would use `LIMIT … OFFSET`. In MySQL 5.7 rankings were faked with user variables (`@rn := @rn + 1`), a trick whose evaluation order MySQL never guaranteed and which 8.0 deprecates.

## Pitfalls

- `RANK` where `DENSE_RANK` was meant, so "rank 2" does not exist after a tie.
- `ROW_NUMBER` without a unique tie-breaker, picking a different row each run.
- Aliasing a column `rank` without backticks.
- Filtering on a rank in WHERE instead of an outer query.
- Expecting NTILE buckets to keep ties together.

## Key takeaways

- `ROW_NUMBER`: unique numbers. `RANK`: ties share, then gaps. `DENSE_RANK`: ties share, no gaps.
- The nth highest value is a `DENSE_RANK` question.
- `PARTITION BY` restarts ranking per group.
- Give `ROW_NUMBER` a unique tie-breaker so it is deterministic.
- `NTILE(n)` makes n near-equal buckets; `PERCENT_RANK` and `CUME_DIST` give position as a fraction.
