---
title: INTERSECT and EXCEPT — rows in both, rows in one but not the other
minutes: 14
seo-title: SQL INTERSECT and EXCEPT in MySQL 8 with NOT EXISTS
description: INTERSECT keeps rows both queries return, EXCEPT keeps rows of the first that the second lacks. MySQL 8.0.31 syntax, NOT EXISTS emulation and the NOT IN trap.
question: What do INTERSECT and EXCEPT do in SQL?
answer: `INTERSECT` returns the distinct rows that appear in the results of both queries; `EXCEPT` returns the distinct rows of the first query that do not appear in the second. Like `UNION`, they match columns by position and compare whole rows, treating NULLs as equal. MySQL supports both from version 8.0.31; on older versions write them with `EXISTS`, `NOT EXISTS` or a join.
q: Does MySQL support INTERSECT and EXCEPT?
a: Yes, since MySQL 8.0.31, released in October 2022. Earlier MySQL versions and MariaDB before 10.3 reject them, which is why many answers and legacy code use `EXISTS`/`NOT EXISTS` or `IN`/`LEFT JOIN … IS NULL` instead. Those forms work on every version and every database.
q: What is the difference between EXCEPT and MINUS?
a: None in meaning: Oracle calls the operation `MINUS`, while the SQL standard, PostgreSQL, SQL Server, SQLite and MySQL 8.0.31+ call it `EXCEPT`. Oracle 21c accepts `EXCEPT` as well. Both return the distinct rows of the first query missing from the second.
q: Why does NOT IN return no rows when the subquery has a NULL?
a: `x NOT IN (1, NULL)` means `x <> 1 AND x <> NULL`, and `x <> NULL` is unknown, so the whole condition is never true and every row is filtered out. `NOT EXISTS` and `EXCEPT` do not have this problem, which is why they are the safe ways to write "in A but not in B".
q: Is the order of the queries important in EXCEPT?
a: Yes. `A EXCEPT B` is the rows of A missing from B, while `B EXCEPT A` is the rows of B missing from A, usually a different answer. `INTERSECT` and `UNION` are symmetric, so swapping their branches changes only the column names, which come from the first query.
q: Which runs first, INTERSECT or UNION?
a: `INTERSECT` binds tighter than `UNION` and `EXCEPT` in the SQL standard and in MySQL, PostgreSQL and SQL Server, so `A UNION B INTERSECT C` means `A UNION (B INTERSECT C)`. SQLite evaluates them left to right instead. Use parentheses or a CTE whenever you mix them.
---
`UNION` answers "rows from either query". Two more set operations finish the family: `INTERSECT` answers "rows in *both*", and `EXCEPT` answers "rows in the first but *not* the second". Students enrolled in both SQL and Python; products in the catalogue that never sold; customers who ordered last year but not this year — each is one of these two operations. MySQL only gained them in version 8.0.31, so production code and interview answers are full of the older ways to write the same thing: `EXISTS`, `NOT EXISTS` and joins. This lesson teaches both forms, and why one popular form, `NOT IN`, is a trap.

## INTERSECT

```sql
SELECT student FROM enrollments WHERE course = 'SQL'
INTERSECT
SELECT student FROM enrollments WHERE course = 'Python';
```

Each SELECT runs on its own; the result is every row that appears in both results, once. The rules are the union rules: the same number of columns, compatible types by position, names from the first branch, one ORDER BY at the end that sorts the final result.

```text
student
Asha
Kiran
```

`INTERSECT` compares *whole rows*. Intersecting `(student, city)` pairs requires the same student in the same city in both results — not just the same student. And like `UNION`, it removes duplicates: a student enrolled in SQL twice still appears once. The standard also defines `INTERSECT ALL` (keep `min(m, n)` copies of a row appearing m and n times), which MySQL 8.0.31+ and PostgreSQL support; it is rarely needed.

## EXCEPT

```sql
SELECT sku FROM products
EXCEPT
SELECT sku FROM sales;
```

Every distinct row of the first result that does not appear in the second: the products that never sold. Order matters — `sales EXCEPT products` would be "SKUs sold that are not in the catalogue", a data-quality check rather than a business question. Oracle spells it `MINUS`.

Both operations treat NULLs as equal when comparing rows, exactly like `DISTINCT`. That makes them safer than you might expect, as the NOT IN section will show.

## Precedence and mixing

When one statement mixes the operators, `INTERSECT` binds tighter than `UNION` and `EXCEPT` in the SQL standard, MySQL, PostgreSQL and SQL Server:

```sql
SELECT id FROM a
UNION
SELECT id FROM b
INTERSECT
SELECT id FROM c;          -- a UNION (b INTERSECT c)
```

SQLite reads the same statement left to right. Rather than remember, make the grouping explicit with parentheses (in MySQL) or with a CTE per step (next lesson).

## The emulation: EXISTS and NOT EXISTS

Before 8.0.31 — and in a great deal of code still running — the two operations are written as semi-joins and anti-joins. The intersection:

```sql
SELECT DISTINCT e.student
FROM enrollments e
WHERE e.course = 'SQL'
  AND EXISTS (SELECT 1
              FROM enrollments p
              WHERE p.student = e.student
                AND p.course = 'Python');
```

And the difference:

```sql
SELECT p.sku
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM sales s WHERE s.sku = p.sku);
```

The correlated subquery asks, per outer row, "is there a matching row over there?" `EXISTS` keeps the row when the answer is yes, `NOT EXISTS` when it is no. The optimizer turns both into a semi-join or anti-join that stops at the first match. Two details matter:

- **Duplicates.** `INTERSECT` and `EXCEPT` return distinct rows; the EXISTS forms return the outer table's rows as they are. Add `DISTINCT` if the outer side can repeat (a student enrolled in SQL twice).
- **Multi-column rows.** Compare every column in the correlation: `WHERE s.sku = p.sku AND s.store = p.store`. A NULL in a compared column never matches with `=` — where `EXCEPT` would call two NULL rows equal, NOT EXISTS keeps the row. Usually that difference does not arise, because keys are not NULL.

The same anti-join is often written as a LEFT JOIN that finds no partner:

```sql
SELECT p.sku
FROM products p
LEFT JOIN sales s ON s.sku = p.sku
WHERE s.sku IS NULL;
```

The LEFT JOIN keeps every product and fills the sales columns with NULL when no sale matches; `WHERE s.sku IS NULL` keeps exactly those. It returns one row per product only because unmatched products produce a single NULL-extended row — matched products produce one row per sale and are then all filtered out. Test the *join column* (or a NOT NULL column) of the right table for NULL, never a nullable column such as an amount.

An intersection can also be written as an inner join — `SELECT DISTINCT a.student FROM enrollments a JOIN enrollments b ON b.student = a.student WHERE a.course = 'SQL' AND b.course = 'Python'` — or with `GROUP BY student HAVING COUNT(DISTINCT course) = 2` over `WHERE course IN ('SQL', 'Python')`. The last form generalises nicely: "enrolled in all of these five courses" is `= 5`.

## The NOT IN trap

The tempting third way to write "never sold":

```sql
SELECT sku FROM products
WHERE sku NOT IN (SELECT sku FROM sales);
```

It works — until one row in `sales` has `sku` NULL. Then it returns *nothing*. `x NOT IN (a, b, NULL)` expands to `x <> a AND x <> b AND x <> NULL`; the last comparison is unknown, so the conjunction is never true, so no row passes. No error, no warning, an empty result that looks plausible on a busy day.

```text
sales.sku: 'A1', 'B2', NULL
NOT IN     → (no rows)
NOT EXISTS → C3, D4
EXCEPT     → C3, D4
```

Defences, in order of preference: use `NOT EXISTS` or `EXCEPT`; or filter the subquery (`WHERE sku IS NOT NULL`); or make the column `NOT NULL` in the schema so the case cannot arise. Interviewers ask this exact question, and "NOT IN with a NULL returns no rows" is the answer they are waiting for. (`IN` is not affected the same way: `x IN (a, NULL)` is true when `x = a`, and merely unknown otherwise, which filters the same as false.)

## Choosing a form

| Need | Modern | Portable |
| --- | --- | --- |
| rows in both | `INTERSECT` | `EXISTS`, inner join + `DISTINCT` |
| rows in A not B | `EXCEPT` | `NOT EXISTS`, `LEFT JOIN … IS NULL` |
| whole-row comparison with NULLs equal | `INTERSECT` / `EXCEPT` | `NOT EXISTS` with `<=>` per column |

`INTERSECT` and `EXCEPT` read best when both sides are naturally "a list of the same kind of thing". When you need columns from the outer table that the other side does not have — the product's *name*, not just its SKU — the EXISTS forms are simpler, because a set operation can only return columns both sides have. You can also combine them: compute the SKUs with `EXCEPT` in a CTE, then join back to `products` for the names.

On performance, modern optimizers usually turn NOT EXISTS and LEFT JOIN … IS NULL into the same anti-join plan; `EXCEPT` may instead build a temporary table of the second result. Measure on real data when it matters (the indexes module shows how).

## In other databases

PostgreSQL, SQL Server and SQLite have had `INTERSECT` and `EXCEPT` for years; Oracle uses `MINUS` (and accepts `EXCEPT` from 21c). SQL Server's `EXCEPT` and `INTERSECT` have no `ALL` form; PostgreSQL's do. The NOT IN null trap is identical in every one of them, because it comes from three-valued logic, not from any product.

## Pitfalls

- `NOT IN` against a subquery whose column can be NULL.
- Swapping the branches of `EXCEPT`.
- Forgetting that the EXISTS forms keep duplicates the set operations would remove.
- Testing a nullable column for NULL after a LEFT JOIN anti-join.
- Mixing operators without parentheses and relying on precedence.

## Key takeaways

- `INTERSECT` keeps distinct rows present in both results; `EXCEPT` keeps distinct rows of the first missing from the second.
- MySQL has both from 8.0.31; `EXISTS`, `NOT EXISTS` and `LEFT JOIN … IS NULL` express them on any version.
- Set operations compare whole rows by position and treat NULLs as equal.
- `NOT IN` returns no rows if the list contains a NULL — prefer `NOT EXISTS` or `EXCEPT`.
- Use a set operation for "same kind of list"; use EXISTS when you need the outer table's other columns.
