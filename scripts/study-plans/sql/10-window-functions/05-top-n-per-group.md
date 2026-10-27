---
title: Top N per group — the most asked window-function question
minutes: 14
seo-title: SQL Top N per Group: Highest Salary in Each Department
description: Rank rows within each partition in a CTE, then filter the rank outside. Choosing a ranking function for ties, the latest row per group and pre-window answers.
question: How do you get the top N rows per group in SQL?
answer: Number the rows within each group with a window function in a CTE — `ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC, id) AS rn` — and then select from the CTE `WHERE rn <= N`. The filter must be in the outer query because WHERE cannot see window functions. Use `RANK` or `DENSE_RANK` instead of `ROW_NUMBER` when tied rows should all be included.
q: How do you find the highest salary in each department?
a: For the value alone, `SELECT dept, MAX(salary) FROM employees GROUP BY dept` is enough. To get the employees who earn it, rank within each department with `RANK() OVER (PARTITION BY dept ORDER BY salary DESC)` in a CTE and keep rank 1, which returns every employee tied for the top salary.
q: How do you get the latest record for each user in SQL?
a: Number each user's rows newest first with `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC)` and keep row number 1. The id tie-breaker makes the choice deterministic when two rows share a timestamp. A join to a per-user `MAX(created_at)` also works but can return two rows on a tie.
q: Should I use ROW_NUMBER or RANK for top N per group?
a: Use `ROW_NUMBER` when you need exactly N rows per group, with a tie-breaker deciding who is in. Use `RANK` when everyone tied at the cut-off should be included, which can return more than N rows. Use `DENSE_RANK` for the top N distinct values, such as the three highest salary levels.
q: How was top N per group done before window functions?
a: With a correlated subquery counting how many rows in the same group beat the current one, `WHERE (SELECT COUNT(*) FROM t t2 WHERE t2.g = t.g AND t2.v > t.v) < N`, or with a join to a grouped MAX for N = 1. Both are slower and harder to read, and ties need extra care, which is why window functions replaced them.
---
"The top three products in each category", "the highest-paid employee in each department", "each customer's most recent order", "the two best scores per player": this shape — the best N rows *within each group* — is the single most common window-function question in interviews and one of the most common in real reporting. GROUP BY cannot answer it, because it returns one row per group and loses the other columns; `ORDER BY … LIMIT` cannot, because the limit applies to the whole result, not per group. The answer combines the last few lessons: rank within a partition, then filter the rank in an outer query. This lesson covers the pattern, choosing the ranking function for ties, the "latest row per group" variant, and the older answers you will still meet.

## The pattern

```sql
WITH ranked AS (
  SELECT dept, name, salary,
         ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC, id) AS rn
  FROM employees
)
SELECT dept, name, salary
FROM ranked
WHERE rn <= 2
ORDER BY dept, salary DESC, name;
```

Three parts:

1. **Partition** by the group (`dept`).
2. **Order** within the group by "best first" (`salary DESC`), with a tie-breaker.
3. **Filter** the rank in the outer query (`WHERE rn <= 2`).

The CTE is required, not a style choice: window functions are computed after WHERE, so `WHERE ROW_NUMBER() OVER (…) <= 2` in the same SELECT is an error. A derived table works equally well (`SELECT … FROM (SELECT …, ROW_NUMBER() … AS rn FROM employees) AS r WHERE rn <= 2`). Some databases have a shortcut — Snowflake, BigQuery and Teradata support `QUALIFY rn <= 2`, a WHERE for window functions — but MySQL, PostgreSQL and SQL Server do not.

## Ties decide the function

```text
employees
dept | name  | salary
Eng  | Asha  | 90000
Eng  | Farah | 90000
Eng  | Ben   | 70000
Eng  | Gita  | 60000
```

"Top 2 in Eng" has three defensible answers:

| Function | rn values | `<= 2` returns |
| --- | --- | --- |
| `ROW_NUMBER() … ORDER BY salary DESC, id` | 1, 2, 3, 4 | Asha, Farah — exactly two |
| `RANK()` | 1, 1, 3, 4 | Asha, Farah — two, but a third tie at 90000 would make three |
| `DENSE_RANK()` | 1, 1, 2, 3 | Asha, Farah, Ben — the top two *salary levels* |

- Exactly N rows per group (a "top 3" widget with three slots): **ROW_NUMBER** with a meaningful tie-breaker — and know the tie-breaker is choosing who is left out.
- Everyone who placed in the top N, ties included (prize winners): **RANK**. The result may have more than N rows.
- The top N distinct values (the two highest salaries and everyone earning them): **DENSE_RANK**.

In an interview, say which one you chose and why; the question is often deliberately ambiguous to see whether you notice ties.

## The latest row per group

The most common variant in production code: each customer's most recent order, each sensor's latest reading, each ticket's current status.

```sql
WITH latest AS (
  SELECT customer_id, id AS order_id, order_date, amount,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC) AS rn
  FROM orders
)
SELECT customer_id, order_id, order_date, amount
FROM latest
WHERE rn = 1
ORDER BY customer_id;
```

`ROW_NUMBER` is right here — "the" latest order is one row — and `id DESC` decides between two orders on the same date (the later-inserted one). The first row per group is the same query with `ASC`: each customer's *first* order, the classic start of a cohort analysis.

## Top N per group with the group's other facts

Because the window keeps every row, the ranked CTE can carry anything else you need — the group's size, its total, the gap to the leader — computed in the same pass:

```sql
WITH ranked AS (
  SELECT category, product, revenue,
         DENSE_RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS rnk,
         SUM(revenue) OVER (PARTITION BY category) AS category_revenue
  FROM product_sales
)
SELECT category, product, revenue,
       ROUND(100 * revenue / category_revenue, 1) AS pct_of_category
FROM ranked
WHERE rnk <= 3
ORDER BY category, rnk, product;
```

Compute everything that needs the whole partition *before* filtering; after `WHERE rnk <= 3`, the other rows are gone.

If the ranking is over an aggregate — the top two customers by spend in each city — group first, then rank in the same SELECT or the next CTE:

```sql
WITH spend AS (
  SELECT city, customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY city, customer_id
),
ranked AS (
  SELECT city, customer_id, total,
         RANK() OVER (PARTITION BY city ORDER BY total DESC) AS rnk
  FROM spend
)
SELECT city, customer_id, total FROM ranked WHERE rnk <= 2 ORDER BY city, rnk, customer_id;
```

## Before window functions

You will meet these in older code and in "solve it without window functions" follow-ups.

**N = 1 with a join to the group maximum:**

```sql
SELECT e.dept, e.name, e.salary
FROM employees e
JOIN (SELECT dept, MAX(salary) AS top FROM employees GROUP BY dept) m
  ON m.dept = e.dept AND m.top = e.salary
ORDER BY e.dept, e.name;
```

This returns every employee tied at the top — RANK semantics.

**Any N with a correlated count:**

```sql
SELECT e.dept, e.name, e.salary
FROM employees e
WHERE (SELECT COUNT(*)
       FROM employees e2
       WHERE e2.dept = e.dept AND e2.salary > e.salary) < 2
ORDER BY e.dept, e.salary DESC, e.name;
```

"Fewer than two people in my department earn more than me" — again RANK semantics (ties pass together). Counting `COUNT(DISTINCT e2.salary)` instead gives DENSE_RANK semantics. The subquery runs once per row, so it is quadratic per group without a good index; the window version sorts once.

**MySQL 5.7 user variables** (`@rn := IF(@dept = dept, @rn + 1, 1)`) also appear in old answers. Their evaluation order was never guaranteed, and MySQL 8 deprecates setting variables inside expressions — replace them with ROW_NUMBER whenever you touch such code.

## Performance notes

The window approach reads the rows once and sorts them by `(group, order)` — an index on exactly those columns, such as `(dept, salary)` or `(customer_id, order_date, id)`, lets MySQL skip the sort. For "latest row per group" on a huge table with few groups, a per-group lookup (`LATERAL` join in MySQL 8.0.14+ and PostgreSQL, `CROSS APPLY` in SQL Server) that reads one index entry per group can beat ranking every row. Measure before reaching for it.

## Pitfalls

- Filtering the rank in the same SELECT's WHERE.
- `ROW_NUMBER` without a tie-breaker — a different "top" row each run.
- Choosing ROW_NUMBER when ties should all be included, or RANK when exactly N are needed.
- Computing a group total after filtering to the top N.
- Forgetting the final ORDER BY — the CTE's window order is not the output order.

## Key takeaways

- Top N per group = rank in a partition (CTE or derived table), then `WHERE rank <= N` outside.
- ROW_NUMBER for exactly N, RANK for ties included, DENSE_RANK for the top N values.
- Latest or first row per group = `ROW_NUMBER() … ORDER BY date DESC, id DESC` and `rn = 1`.
- Carry partition totals in the CTE before filtering.
- The pre-window answers are a join to a grouped MAX (N = 1) and a correlated count.
