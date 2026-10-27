---
title: SQL pitfalls — the twelve mistakes that fail interview queries
minutes: 17
seo-title: Common SQL Mistakes: NOT IN with NULL, Fan-Out Joins and More
description: The SQL mistakes interviewers look for: NOT IN with NULL, = NULL, a LEFT JOIN undone by WHERE, fan-out joins that double count, and a missing ORDER BY.
question: What are the most common SQL mistakes?
answer: The most common SQL mistakes are comparing with `= NULL` instead of `IS NULL`, using NOT IN against a column that contains NULL, turning a LEFT JOIN into an inner join with a WHERE condition, summing after a join that multiplies rows, confusing COUNT(*) with COUNT(column), selecting columns that are not grouped, and relying on row order without ORDER BY. Each returns a wrong answer rather than an error.
q: Why does NOT IN return no rows when the subquery contains NULL?
a: `x NOT IN (1, 2, NULL)` means `x <> 1 AND x <> 2 AND x <> NULL`, and `x <> NULL` is unknown, so the whole condition can never be true. Use NOT EXISTS, a LEFT JOIN with IS NULL, or filter the NULLs out inside the subquery.
q: Why does a WHERE condition turn a LEFT JOIN into an inner join?
a: Rows with no match on the right carry NULL in every right-hand column, and a condition such as `WHERE o.status = 'paid'` is unknown for NULL, so those rows are discarded. Put conditions on the right-hand table in the ON clause to keep the unmatched rows.
q: Why are my SUM totals too high after joining two tables?
a: Joining a parent to two child tables, or summing a parent column after joining a child, repeats each row once per match, so its values are added several times. Aggregate each child table in its own subquery first, then join the one-row-per-key results.
q: What is ONLY_FULL_GROUP_BY in MySQL?
a: It is an SQL mode, on by default since MySQL 5.7, that rejects a query selecting a column that is neither in the GROUP BY nor inside an aggregate nor functionally dependent on the grouped columns. Without it, MySQL returns a value from an arbitrary row of each group.
---
SQL rarely fails loudly. A wrong query usually runs, returns a plausible-looking table, and is simply wrong — too many rows, too few, a total that is double what it should be. Interviewers know which mistakes produce those quiet failures, and many questions are built to trigger one. This lesson is the checklist: twelve mistakes, why each happens, and the fix. Read your query against it before you say "done".

## 1. `= NULL`

```sql
WHERE manager_id = NULL      -- always unknown: returns nothing
WHERE manager_id IS NULL     -- right
```

Any comparison with NULL is unknown, and WHERE keeps only true. The same goes for `<> NULL`. MySQL's NULL-safe `<=>` operator treats two NULLs as equal, when that is what you want.

## 2. NOT IN against a column with NULLs

```sql
SELECT name FROM customers
WHERE id NOT IN (SELECT customer_id FROM complaints);
```

If one complaint has a NULL `customer_id`, this returns **no rows**. `id NOT IN (3, 5, NULL)` expands to `id <> 3 AND id <> 5 AND id <> NULL`; the last part is unknown, so the conjunction is never true. Use `NOT EXISTS (SELECT 1 FROM complaints c WHERE c.customer_id = customers.id)`, or a LEFT JOIN with `IS NULL`. `IN` has no such problem — a NULL in the list just never matches.

## 3. The LEFT JOIN undone by WHERE

```sql
SELECT c.name, COUNT(o.id)
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid'            -- drops customers without paid orders
GROUP BY c.name;
```

Customers with no orders have `o.status` NULL, which fails the WHERE. The LEFT JOIN is now an inner join and the zero rows are gone. Move the condition into the join: `LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'`. The rule: conditions on the *outer* (preserved) table go in WHERE; conditions on the *optional* table go in ON.

## 4. Fan-out: summing after a join that multiplies rows

A customer has two orders and three payments. Joining both to the customer gives 2 × 3 = 6 rows, and every order amount is counted three times, every payment twice:

```sql
-- wrong
SELECT c.name, SUM(o.amount) AS ordered, SUM(p.amount) AS paid
FROM customers c
LEFT JOIN orders o   ON o.customer_id = c.id
LEFT JOIN payments p ON p.customer_id = c.id
GROUP BY c.name;
```

Aggregate each child *before* joining, so each side contributes one row per customer:

```sql
SELECT c.name,
       COALESCE(o.total, 0) AS ordered,
       COALESCE(p.total, 0) AS paid
FROM customers c
LEFT JOIN (SELECT customer_id, SUM(amount) AS total FROM orders   GROUP BY customer_id) o
       ON o.customer_id = c.id
LEFT JOIN (SELECT customer_id, SUM(amount) AS total FROM payments GROUP BY customer_id) p
       ON p.customer_id = c.id;
```

Correlated scalar subqueries in the SELECT list also work. The same fan-out bites when summing a parent's column (an order's shipping fee) after joining its items. `COUNT(DISTINCT …)` can hide it for counts but not for sums.

## 5. COUNT(*) versus COUNT(column)

`COUNT(*)` counts rows; `COUNT(col)` counts non-NULL values of `col`; `COUNT(DISTINCT col)` counts distinct non-NULL values. After a LEFT JOIN, `COUNT(*)` counts an unmatched row as 1 — count a column from the right-hand table to get 0.

## 6. AVG and SUM skip NULLs

`AVG(score)` over 80, NULL, 100 is 90, not 60: the NULL row is not in the denominator. If a missing score should count as zero, say so with `AVG(COALESCE(score, 0))`. And `SUM` over no rows, or only NULLs, is NULL, not 0 — wrap it in `COALESCE` for display.

## 7. Selecting columns that are not grouped

```sql
SELECT dept, name, MAX(salary) FROM employees GROUP BY dept;
```

Which `name`? Under `ONLY_FULL_GROUP_BY` (on by default since MySQL 5.7) the query is refused; with the mode off, MySQL returns a name from an arbitrary row — usually *not* the top earner. Every selected column must be grouped, aggregated or functionally dependent on the group key. For "the row with the maximum", use ROW_NUMBER or join back to the maximum.

## 8. An alias or a window function in WHERE

WHERE runs before SELECT, so `WHERE total > 100` with `total` defined in the SELECT list fails, and `WHERE ROW_NUMBER() OVER (…) = 1` is not allowed. Repeat the expression, or compute it in a CTE or derived table and filter outside. HAVING can test an aggregate directly.

## 9. Integer division (in other databases)

In MySQL, `/` always returns a decimal: `7 / 2` is `3.5000`, and `DIV` is integer division. In PostgreSQL and SQL Server, `7 / 2` is `3` — integer divided by integer truncates — so `100 * paid / total` for a percentage silently returns whole numbers or 0. Write `100.0 * paid / total` to be safe across engines, and say why.

## 10. Dates as text and BETWEEN on datetimes

`WHERE created_at BETWEEN '2024-03-01' AND '2024-03-31'` on a DATETIME column stops at `2024-03-31 00:00:00` and misses the last day. Use a half-open range: `created_at >= '2024-03-01' AND created_at < '2024-04-01'`. The same form keeps the condition sargable — `WHERE MONTH(created_at) = 3` reads every row and ignores any index (and matches March of every year).

## 11. No ORDER BY, or an incomplete one

A table has no order; without `ORDER BY` the database returns rows in whatever order is cheapest, which can change with an index, a new MySQL version or the data size. `ORDER BY` inside a subquery or view is not a promise about the outer result either. `LIMIT` without `ORDER BY` picks arbitrary rows. And an `ORDER BY score DESC` with ties leaves the tied rows' order undefined — add a unique tie-breaker (`, id`) whenever the order matters.

## 12. UNION removing rows you meant to keep

`UNION` removes duplicates across the whole combined result — including duplicates *within* one side. When two rows really are two facts (two payments of 100 on one day), `UNION` merges them into one. Use `UNION ALL` unless removing duplicates is the point.

## Three more to keep in mind

- **Case and collation.** MySQL's default collation is case-insensitive, so `WHERE name = 'asha'` matches `'Asha'` — on PostgreSQL it does not. Trailing spaces are also ignored in many MySQL comparisons.
- **`DISTINCT` as a bandage.** If a join produced duplicates, `SELECT DISTINCT` hides the symptom; find the join that fanned out instead, because the sums are still wrong.
- **`OR` precedence.** `WHERE a = 1 OR a = 2 AND b = 3` means `a = 1 OR (a = 2 AND b = 3)`. Parenthesise every mix of AND and OR.

## The habit

Before saying a query is finished, run it mentally against three small inputs: one with a NULL in every nullable column, one with a tie, and one with an empty group or no matching rows. Most of the twelve mistakes show up on one of those three, and saying "let me check NULLs and ties" aloud is itself a point in your favour.
