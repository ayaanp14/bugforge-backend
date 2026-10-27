---
title: CASE expressions — if-then-else in SQL
minutes: 15
seo-title: SQL CASE WHEN Explained: Simple and Searched CASE in MySQL
description: SQL CASE returns a value by condition, like if-else. Simple versus searched CASE, why the first matching WHEN wins, ELSE and NULL, and CASE in ORDER BY.
question: How does CASE WHEN work in SQL?
answer: CASE is SQL's if-then-else expression. A searched CASE checks `WHEN condition THEN result` branches from top to bottom and returns the result of the first condition that is TRUE; if none is, it returns the ELSE value, or NULL when there is no ELSE. Because it is an expression, CASE can appear in SELECT, WHERE, ORDER BY and anywhere else a value is allowed.
q: What is the difference between simple CASE and searched CASE?
a: A simple CASE compares one expression with listed values: `CASE status WHEN 'P' THEN 'Pending' … END`. A searched CASE evaluates a full condition in each branch: `CASE WHEN score >= 90 THEN 'A' … END`. Simple CASE uses `=`, so `WHEN NULL` never matches; test for NULL with a searched `WHEN col IS NULL`.
q: What does CASE return if no WHEN matches and there is no ELSE?
a: NULL. Every CASE without an ELSE has an implicit `ELSE NULL`, so unexpected values silently become NULL. Write an explicit ELSE whenever another value can appear, even if it is only `ELSE 'Unknown'`.
q: Does the order of WHEN clauses matter in SQL CASE?
a: Yes. CASE returns the result of the first WHEN that is true and ignores the rest, so overlapping conditions must go from most specific to least. With `WHEN score >= 50 THEN 'C'` before `WHEN score >= 90 THEN 'A'`, a 95 gets 'C'. Ordering ranges from high to low avoids this.
q: What is the IF function in MySQL?
a: `IF(condition, a, b)` is MySQL's shorthand for a two-branch CASE: it returns `a` when the condition is true and `b` when it is false or NULL. It is MySQL-specific; SQL Server has a similar `IIF`, and `CASE WHEN condition THEN a ELSE b END` is the portable form.
---
So far every column a query returned was a stored value or a formula applied the same way to every row. Real reports need decisions: a score becomes a grade band, a status code becomes a readable label, an order is "late" if it shipped after its promise date, a price gets a discount only for members. SQL makes decisions with the **CASE expression**, its if-then-else. CASE is one of the most important tools in the language — it powers custom sort orders (you already used it), conditional aggregation in the next modules, and pivot tables later — and its rules about order and NULL are simple but strict. This lesson covers the two forms of CASE, how branches are chosen, the ELSE default, where CASE can appear and MySQL's `IF()` shorthand.

## Searched CASE

The general form tests a condition in each branch:

```sql
SELECT student, score,
       CASE
         WHEN score >= 90 THEN 'A'
         WHEN score >= 75 THEN 'B'
         WHEN score >= 50 THEN 'C'
         ELSE 'F'
       END AS grade
FROM results;
```

```text
student | score | grade
Asha    | 92    | A
Ben     | 75    | B
Dina    | 49    | F
```

For each row the database evaluates the `WHEN` conditions **from top to bottom** and returns the `THEN` result of the **first one that is TRUE**. The remaining branches are not considered. If no condition is TRUE, the `ELSE` result is returned. The whole thing, from `CASE` to `END`, is one expression producing one value per row, so it gets an alias like any computed column.

## First match wins

Because the first true branch decides, the order of overlapping conditions is part of the logic. Ben's 75 satisfies `score >= 75` and `score >= 50`; it gets `'B'` because that branch comes first. Put the branches in the wrong order and the result is quietly wrong:

```sql
CASE
  WHEN score >= 50 THEN 'C'   -- 92 stops here
  WHEN score >= 75 THEN 'B'   -- never reached for anyone ≥ 50
  WHEN score >= 90 THEN 'A'
  ELSE 'F'
END
```

With ranges, go from the most restrictive condition to the least (high thresholds first when testing `>=`), or write each band in full (`WHEN score >= 75 AND score < 90`) so the order no longer matters. The first style is shorter; the second is easier to review.

## ELSE, and the NULL it hides

If no branch is TRUE and there is no `ELSE`, CASE returns **NULL**. That default is convenient and dangerous: a new status code that nobody anticipated becomes a NULL label instead of an error. Write an explicit ELSE whenever any other value is possible, even `ELSE 'Unknown'`.

NULL inputs need their own branch. A condition like `score >= 90` is UNKNOWN for a NULL score — not TRUE — so a NULL falls through every comparison to the ELSE. In the grade query above, a student with no score would get `'F'`, which is a lie. Test for NULL **first**:

```sql
CASE
  WHEN score IS NULL THEN 'absent'
  WHEN score >= 90 THEN 'A'
  WHEN score >= 75 THEN 'B'
  WHEN score >= 50 THEN 'C'
  ELSE 'F'
END AS grade
```

## Simple CASE

When every branch compares the same expression with a constant, the **simple** form is shorter:

```sql
SELECT id,
       CASE status_code
         WHEN 'P' THEN 'Pending'
         WHEN 'S' THEN 'Shipped'
         WHEN 'D' THEN 'Delivered'
         WHEN 'C' THEN 'Cancelled'
         ELSE 'Unknown'
       END AS status
FROM orders;
```

`CASE status_code WHEN 'P' …` means `CASE WHEN status_code = 'P' …`. It uses `=`, so the three-valued rules apply: `WHEN NULL` can never match (since `NULL = NULL` is UNKNOWN), and a NULL `status_code` falls through to the ELSE. If NULL needs its own label, switch to the searched form with `WHEN status_code IS NULL`. Simple CASE can only test equality; anything with `<`, `LIKE`, `IN`, `AND` or `IS` needs the searched form.

## The result type

All branches of a CASE should produce the same type. Mixing them — `THEN 1` in one branch, `THEN 'none'` in another — makes the database pick a common type, usually a string in MySQL, so the column stops sorting numerically. PostgreSQL refuses outright to mix integer and text branches. Keep branch results consistent, and give every branch a result even if it is NULL (`THEN NULL` is allowed).

## CASE anywhere a value is allowed

CASE is an expression, not a statement, so it can go anywhere a value can:

```sql
-- In ORDER BY: a custom order (as in the sorting module)
ORDER BY CASE status_code WHEN 'P' THEN 1 WHEN 'S' THEN 2 ELSE 3 END, id

-- In WHERE: a condition that depends on another column
WHERE amount > CASE WHEN customer_type = 'business' THEN 10000 ELSE 2000 END

-- Inside arithmetic: a member discount
SELECT price * CASE WHEN is_member = 1 THEN 0.9 ELSE 1 END AS charged
FROM orders;

-- Inside another function
SELECT COALESCE(CASE WHEN qty > 0 THEN 'in stock' END, 'sold out') AS availability
FROM products;
```

One restriction catches people: a SELECT alias cannot be used in another column of the same SELECT, nor in WHERE. If two columns depend on the same CASE, repeat the expression (or, later, compute it once in a subquery or CTE). In ORDER BY you can refer to the alias directly, since ORDER BY runs after SELECT — `ORDER BY grade` works.

In the coming modules CASE gets even more useful inside aggregates: `SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)` totals only the paid orders in a single pass, the basis of pivot-style reports.

## MySQL's IF()

For a single condition with two outcomes MySQL has a function shorthand:

```sql
SELECT name, IF(stock > 0, 'in stock', 'sold out') AS availability
FROM products;
```

`IF(cond, a, b)` returns `a` when the condition is TRUE and `b` when it is FALSE **or UNKNOWN** — so a NULL stock gives `'sold out'`, the same as `CASE WHEN stock > 0 THEN … ELSE … END`. IF is MySQL-only (SQL Server's `IIF` is similar); prefer CASE in answers that should be portable, and do not confuse `IF()` the function with the `IF … THEN … END IF` statement of stored procedures.

## Before you move on

- Searched CASE: the first `WHEN` that is TRUE wins; order overlapping conditions carefully.
- No ELSE means `ELSE NULL`; write one whenever other values are possible.
- NULL inputs fail every comparison, so test `IS NULL` first.
- Simple CASE compares with `=`: `WHEN NULL` never matches.
- CASE is an expression: SELECT, WHERE, ORDER BY, inside functions; `IF(c, a, b)` is MySQL's two-way shorthand.
