---
title: Semi joins and anti joins — "has a match" and "has none"
minutes: 15
seo-title: SQL Anti Join and Semi Join: EXISTS, NOT EXISTS and NOT IN
description: A semi join keeps rows that have at least one match and an anti join keeps rows with none. EXISTS, NOT EXISTS, LEFT JOIN IS NULL and the NOT IN trap.
question: What is an anti join in SQL?
answer: An anti join returns the rows of one table that have no matching row in another, such as customers who never placed an order. SQL has no ANTI JOIN keyword; it is written as `WHERE NOT EXISTS (correlated subquery)`, as a `LEFT JOIN` followed by `WHERE right_key IS NULL`, or as `NOT IN`, which breaks when the subquery returns a NULL.
q: What is a semi join?
a: A semi join returns each row of the first table that has at least one match in the second, once, without any of the second table's columns. It is written with `EXISTS` or `IN`. A plain `JOIN` is not a semi join, because a row with three matches appears three times.
q: Is NOT EXISTS faster than LEFT JOIN IS NULL?
a: In MySQL 8.0.17 and later, both are usually turned into the same antijoin plan, so they perform alike. `NOT EXISTS` states the intent directly and cannot be broken by a NULL, so it is the safer default. Check the plan with `EXPLAIN` when it matters.
q: Why does NOT IN return no rows?
a: Because the subquery returned at least one NULL. `x NOT IN (1, NULL)` means `x <> 1 AND x <> NULL`, and `x <> NULL` is unknown, so the whole condition is never true. Use `NOT EXISTS`, or add `WHERE column IS NOT NULL` inside the subquery.
q: Which column should I check for NULL after a LEFT JOIN anti join?
a: Check a column of the right table that can never be NULL in a real row, ideally its primary key or the join column itself. Testing a nullable column such as `shipped_on` would also keep rows that matched but have an empty value there.
---
Two questions come up constantly and look like joins but are not quite: "which customers have placed *at least one* order?" and "which customers have placed *no* orders?". The answer lists customers only — no order columns, and each customer once. The first is a **semi join**, the second an **anti join**. SQL has no keyword for either; you write them with `EXISTS`, `IN`, or a left join, and the choice matters for duplicates and, in the anti-join case, for correctness when NULLs are around. Anti joins in particular are among the most asked SQL interview questions.

## Why a plain join is not a semi join

```sql
SELECT c.id, c.name
FROM customers c
JOIN orders o ON o.customer_id = c.id
ORDER BY c.id;
```

```text
id | name
1  | Asha
1  | Asha
2  | Ben
```

Asha has two orders, so she appears twice. The join answers "list the (customer, order) pairs", and the question was "list the customers". `SELECT DISTINCT c.id, c.name` removes the repeats, but it does so by building all the pairs first and then sorting or hashing them away — wasted work when a customer has thousands of orders.

## Semi join with EXISTS

```sql
SELECT c.id, c.name
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY c.id;
```

```text
id | name
1  | Asha
2  | Ben
```

`EXISTS (subquery)` is true if the subquery returns at least one row. The subquery refers to `c.id` from the outer query — it is **correlated**, evaluated for each customer (the subqueries module covers correlation in depth). The `SELECT 1` is a convention: `EXISTS` looks only at whether a row exists, so the select list is ignored; `SELECT *` or `SELECT o.id` would do the same. The database can stop at the first matching order — it never needs the rest.

Extra conditions on the matching row go inside:

```sql
-- customers with at least one order of 300 or more
SELECT c.id, c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.amount >= 300)
ORDER BY c.id;
```

## Semi join with IN

```sql
SELECT c.id, c.name
FROM customers c
WHERE c.id IN (SELECT o.customer_id FROM orders o)
ORDER BY c.id;
```

Same result. `IN` compares one value against the set the subquery returns; duplicates in that set do not duplicate the output. `IN` reads naturally when the link is a single column and the subquery stands alone. `EXISTS` is more flexible: it can correlate on several columns and add any condition. MySQL 8 turns both into a semi-join plan, so choose by readability.

## Anti join, three ways

Customers with no orders.

**NOT EXISTS** — the recommended form:

```sql
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
ORDER BY c.id;
```

**LEFT JOIN … IS NULL** — keep every customer, then keep only those whose order side stayed empty:

```sql
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;
```

The `WHERE` clause here is the deliberate exception to the outer-joins lesson's rule: it filters on the right table precisely to keep the NULL-filled rows. Test a column that is never NULL in a real match — the right table's primary key, or the join column itself. Testing `o.amount IS NULL` would also return customers who have an order whose amount happens to be NULL.

**NOT IN** — the one to be careful with:

```sql
SELECT c.id, c.name
FROM customers c
WHERE c.id NOT IN (SELECT o.customer_id FROM orders o)
ORDER BY c.id;
```

This returns the right answer only while `orders.customer_id` contains no NULL. Insert a single order with `customer_id` NULL — a guest checkout, say — and the query returns **no rows at all**. The reason is three-valued logic: `3 NOT IN (1, 2, NULL)` expands to `3 <> 1 AND 3 <> 2 AND 3 <> NULL`, and `3 <> NULL` is unknown, which makes the whole `AND` unknown, and `WHERE` keeps only true. The final lesson of the subqueries module is devoted to this trap. For now: prefer `NOT EXISTS` for anti joins, and if you write `NOT IN`, add `WHERE o.customer_id IS NOT NULL` inside.

## Anti join with a condition

"Customers with no order in 2024" — the date condition is part of what counts as a match, so it goes **inside** the `NOT EXISTS`, or into the `ON` of the left join:

```sql
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.id
    AND o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'
)
ORDER BY c.id;

SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'
WHERE o.id IS NULL
ORDER BY c.id;
```

Putting the date range in the outer `WHERE` of the left-join version would be contradictory — `o.order_date` is NULL on exactly the rows `o.id IS NULL` keeps — and the query would return nothing.

## How MySQL runs them

MySQL 8 recognises `IN` and `EXISTS` subqueries as semi joins and, since 8.0.17, `NOT IN` and `NOT EXISTS` as antijoins, choosing among strategies (first match, materialisation, duplicate weedout) by cost. An index on the inner join column — `orders(customer_id)` — is what makes any of them fast. PostgreSQL and SQL Server likewise plan `NOT EXISTS` and `LEFT JOIN … IS NULL` as anti joins; `NOT IN` is often planned worse, precisely because of its NULL semantics. In interviews, say you would write `NOT EXISTS` and explain why `NOT IN` is fragile.

## Pitfalls

- A plain join where a semi join was meant, then `DISTINCT` to hide the duplicates.
- `NOT IN` against a column that can contain NULL.
- Testing a nullable right-side column in the `LEFT JOIN … IS NULL` pattern.
- An anti join's extra condition placed in the outer `WHERE` instead of inside the subquery or the `ON`.
- Selecting columns of the inner table in a semi join — there is no single matching row to take them from.

## Key takeaways

- Semi join: rows with at least one match, each once — `EXISTS` or `IN`.
- Anti join: rows with no match — `NOT EXISTS`, or `LEFT JOIN … WHERE right_key IS NULL`.
- `NOT IN` returns nothing as soon as the subquery yields a NULL.
- Conditions on what counts as a match go inside the subquery or into `ON`.
- MySQL 8 plans all of these as semi- and antijoins; index the inner join column.
