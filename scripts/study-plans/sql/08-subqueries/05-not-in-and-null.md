---
title: NOT IN and NULL — the subquery trap
minutes: 15
seo-title: SQL NOT IN with NULL: Why It Returns No Rows and How to Fix It
description: NOT IN returns no rows once its subquery yields a NULL, due to three-valued logic. Why, the NOT EXISTS fix, and the tree node interview question.
question: Why does NOT IN return no rows when the subquery contains NULL?
answer: `x NOT IN (a, b, NULL)` means `x <> a AND x <> b AND x <> NULL`. Any comparison with NULL is unknown rather than true, and an `AND` containing an unknown can never be true, so `WHERE` keeps no row. A single NULL in the subquery's column therefore empties the result. `NOT EXISTS` does not have this problem.
q: How do I fix NOT IN with NULL values?
a: Prefer `NOT EXISTS (SELECT 1 FROM t WHERE t.col = outer.col)`, which asks only whether a matching row exists. If you keep `NOT IN`, filter the NULLs out inside it: `NOT IN (SELECT col FROM t WHERE col IS NOT NULL)`. A `LEFT JOIN … WHERE t.col IS NULL` anti join also works.
q: Does IN have the same problem with NULL?
a: Not for finding matches. `x IN (1, NULL)` is true when x is 1, because one true comparison makes an `OR` true. It is unknown, not false, when x matches nothing, which only matters once the result is negated, and negation is exactly what `NOT IN` does.
q: What happens when the outer value itself is NULL?
a: `NULL NOT IN (1, 2)` is unknown, so a row whose own column is NULL is never returned by `NOT IN`, while `NOT EXISTS` returns it, because no row can equal NULL. The two forms therefore disagree on NULLs in either column; decide which behaviour the question wants.
q: What does NOT IN return for an empty subquery?
a: True for every row, including a row whose value is NULL, because there is nothing to differ from: an `AND` of zero comparisons is true. `NOT EXISTS` also keeps every row when the subquery finds nothing, so for an empty subquery the two agree.
---
`NOT IN` reads like English — "customers whose id is not in the list of ordering customers" — and on clean test data it gives the right answer. Then one row with a NULL arrives in the column the subquery reads, and the query returns nothing at all, with no error. This is one of the most common SQL bugs in production and one of the most popular interview questions, because it tests whether you really understand NULL. This lesson works through why it happens, the related case of a NULL on the outer side, the three reliable alternatives, and a classic problem where the trap is built in.

## The symptom

```sql
CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen');
INSERT INTO orders VALUES (10, 1), (11, 2);

SELECT name FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);
```

```text
name
Chen
```

Correct: Chen never ordered. Now a guest checkout is stored with no customer:

```sql
INSERT INTO orders VALUES (12, NULL);
-- the same query now returns:
```

```text
name
(no rows)
```

## Why: three-valued logic

SQL comparisons have three outcomes: true, false and **unknown**. Any comparison with NULL — `3 = NULL`, `3 <> NULL`, even `NULL = NULL` — is unknown, because NULL means "no value known", and nobody can say whether an unknown value differs from 3.

`IN` and `NOT IN` against a list expand into comparisons:

```text
3 IN (1, 2, NULL)      =  3 = 1  OR  3 = 2  OR  3 = NULL
                       =  false  OR  false  OR  unknown   =  unknown
3 NOT IN (1, 2, NULL)  =  3 <> 1 AND 3 <> 2 AND 3 <> NULL
                       =  true   AND true   AND unknown   =  unknown
```

`AND` is true only if every part is true; one unknown part makes the whole unknown (unless another part is false, which makes it false). `WHERE` keeps only rows where the condition is **true**, so it discards unknown. For Chen, every row: discarded. For Asha, `1 <> 1` is false, so false — discarded as before. Nobody survives.

`IN` with a NULL in the list is mostly harmless: a match makes the `OR` true no matter what else is there. The non-matching rows are unknown rather than false, which you only notice once something negates them — and `NOT IN` is the negation.

## NULL on the outer side

The trap has a mirror image. If the outer column is NULL:

```sql
-- products.category_id is NULL for unclassified products
SELECT name FROM products
WHERE category_id NOT IN (SELECT id FROM discontinued_categories);
```

For an unclassified product the test is `NULL NOT IN (…)`, unknown whenever the list is non-empty — so the product is never returned, even though it is certainly not in a discontinued category. `NOT EXISTS (… WHERE d.id = p.category_id)` returns it, because no row can equal NULL and so no matching row exists. Neither behaviour is wrong in itself; they answer subtly different questions, and you should choose deliberately.

## Three reliable anti joins

**NOT EXISTS** — the default choice:

```sql
SELECT c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
ORDER BY c.name;
```

It asks a yes-or-no question per customer — is there a matching order? — and a NULL `customer_id` simply never matches. No unknowns leak out.

**NOT IN with the NULLs filtered out:**

```sql
SELECT c.name
FROM customers c
WHERE c.id NOT IN (SELECT o.customer_id FROM orders o WHERE o.customer_id IS NOT NULL)
ORDER BY c.name;
```

Correct, but it relies on everyone remembering the filter every time. Declaring the column `NOT NULL` in the schema removes the risk at the source — when the data model allows it.

**LEFT JOIN … IS NULL:**

```sql
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.name;
```

Correct as long as the tested column is never NULL in a real match (the primary key is ideal).

All three agree on the outer-side NULL case too, for the same reason — they test for a matching row rather than compare against a list. MySQL 8.0.17+ plans `NOT EXISTS` and `NOT IN` as antijoins; PostgreSQL often plans `NOT IN` worse precisely because it must honour the NULL semantics. That is the second reason to default to `NOT EXISTS`.

## The empty subquery

`x NOT IN (empty)` is true for every x, including NULL — an `AND` of zero comparisons is true. So "products not in any discontinued category" correctly returns every product when nothing is discontinued. The trouble starts only when the list is non-empty and contains a NULL (or the outer value is NULL).

## A classic: classifying tree nodes

A table stores a tree as `(id, p_id)`, with `p_id` NULL for the root. Label each node `Root`, `Inner` (has a parent and children) or `Leaf` (has a parent, no children). The tempting solution:

```sql
SELECT id,
       CASE
         WHEN p_id IS NULL THEN 'Root'
         WHEN id IN (SELECT p_id FROM tree) THEN 'Inner'
         ELSE 'Leaf'
       END AS type
FROM tree
ORDER BY id;
```

This one is correct, and it is instructive to see why: `IN` with the root's NULL `p_id` in the list still finds the matches, and for leaves the unknown result just falls through to `ELSE`. Now flip the test, as many people do:

```sql
WHEN id NOT IN (SELECT p_id FROM tree) THEN 'Leaf'
ELSE 'Inner'
```

The root's NULL `p_id` is in the list, so `NOT IN` is never true, and every leaf is labelled `Inner`. Same data, same intent, one negation — wrong answer. Writing the child test as `EXISTS (SELECT 1 FROM tree c WHERE c.p_id = t.id)` makes both versions correct.

## Rules to remember

- `NOT IN (subquery)` is correct only if the subquery's column cannot be NULL **and** the outer value cannot be NULL.
- `NOT EXISTS` is correct regardless; use it by default for "has no match".
- `<> ALL (subquery)` is the same as `NOT IN` and has the same trap.
- The same three-valued logic explains why `WHERE col <> 'x'` skips rows where `col` is NULL.

## Pitfalls

- `NOT IN` on a nullable column — the query empties the day the first NULL arrives.
- Forgetting the outer side: a NULL outer value is never returned by `NOT IN`.
- Assuming `NOT (x IN …)` behaves differently — it is the same expression.
- Negating a correct `IN` test into an incorrect `NOT IN` test while refactoring.
- Testing with data that has no NULLs and concluding the query is right.

## Key takeaways

- A comparison with NULL is unknown; `WHERE` keeps only true.
- `x NOT IN (…, NULL, …)` is never true, so one NULL empties the result.
- `NOT EXISTS` (or `LEFT JOIN … IS NULL`) is the safe anti join; `NOT IN` needs `WHERE col IS NOT NULL` inside.
- `IN` survives NULLs for matching; its negation does not.
- `NOT IN` of an empty subquery is true for every row.
