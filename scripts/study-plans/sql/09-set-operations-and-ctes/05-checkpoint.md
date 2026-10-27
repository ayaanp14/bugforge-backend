---
title: Checkpoint — Set operations and CTEs
minutes: 25
seo-title: SQL CTE and UNION Quiz: Set Operations Practice Test
description: Test yourself: 12 questions and three queries on UNION and UNION ALL, INTERSECT, EXCEPT, NOT EXISTS, the NOT IN null trap, chained CTEs and recursive CTEs.
q: Why can NOT IN return no rows at all?
a: If the subquery or list contains a NULL, `x NOT IN (...)` includes the comparison `x <> NULL`, which is unknown, so the condition is never true and every row is filtered out. `NOT EXISTS` and `EXCEPT` give the expected rows.
q: When should I use UNION instead of UNION ALL?
a: Use `UNION` only when the question asks for distinct rows from either source, such as every city you deal with. Otherwise use `UNION ALL`: it keeps rows that merely look alike, such as two equal sales, and skips the cost of the duplicate check.
q: How do you fill missing dates in a MySQL report?
a: Generate every date with a recursive CTE, `DATE_ADD(day, INTERVAL 1 DAY)` until the last date, then LEFT JOIN the data to it and use `COALESCE(SUM(amount), 0)`, so a day with no rows shows 0 instead of disappearing.
---
This checkpoint covers the whole module: stacking results with `UNION` and `UNION ALL`, the column rules and sorting the combined result, rows in both and rows in one with `INTERSECT` and `EXCEPT`, their `EXISTS`/`NOT EXISTS` and `LEFT JOIN … IS NULL` equivalents, the `NOT IN` null trap, naming steps with common table expressions, and walking hierarchies and generating series with `WITH RECURSIVE`.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What three rules must the SELECTs of a union satisfy, and where do the result's column names come from?
- When does `UNION` give a wrong answer that `UNION ALL` would not?
- What is `A EXCEPT B` if A is `{1, 2, 3}` and B is `{2, NULL}` — and what does `NOT IN` give for the same data?
- How do you write "rows in A but not in B" on a MySQL version without `EXCEPT`?
- In a chain of CTEs, which CTEs can each one read?
- What are the anchor and the recursive member, and when does a recursive CTE stop?
- Why does a path column in a MySQL recursive CTE need a `CAST` in the anchor?

The three queries are a date-filled daily revenue report built on a recursive date series, an activity count across two tables combined with `UNION ALL` inside a CTE, and the size of every manager's whole team — direct and indirect reports — from a recursive CTE grouped in the outer query.
