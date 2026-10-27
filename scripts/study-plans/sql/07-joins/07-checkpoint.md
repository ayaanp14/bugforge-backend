---
title: Checkpoint — Joins
minutes: 25
seo-title: SQL Joins Quiz: INNER, LEFT, Self and Anti Join Practice Test
description: Test yourself: 12 questions and three queries on SQL joins: INNER and LEFT JOIN, ON vs WHERE, full outer join in MySQL, self joins, fan-out and anti joins.
q: Where does a filter on the right table go in a LEFT JOIN?
a: In the `ON` clause, when it decides which right rows count as a match. In `WHERE`, a condition such as `o.status = 'paid'` rejects the NULL-filled rows of unmatched left rows and turns the left join into an inner join.
q: How do you emulate FULL OUTER JOIN in MySQL?
a: Write `A LEFT JOIN B`, then `UNION ALL` the rows of `B LEFT JOIN A` where A's key is NULL. The first part keeps every A row; the second adds the B rows that matched nothing. `UNION ALL` keeps genuine duplicate rows that plain `UNION` would remove.
q: Why does NOT IN fail when the subquery returns NULL?
a: `x NOT IN (…, NULL)` includes the comparison `x <> NULL`, which is unknown, so the whole condition can never be true and no rows are returned. `NOT EXISTS` and `LEFT JOIN … IS NULL` do not have this problem.
---
This checkpoint covers the whole module: inner joins and how rows multiply in one-to-many relationships, left and right joins with counting and the ON-versus-WHERE rule, the full outer join and its MySQL emulation, cross joins for grids, self joins for hierarchies, pairs and day-to-day comparisons, chains of joins through junction tables with the fan-out problem, and semi and anti joins.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What happens to a row with no partner in an inner join, a left join and a full outer join?
- Why is `COUNT(o.id)` right and `COUNT(*)` wrong after a left join?
- Where does a condition on the optional table go, and what happens if it is in `WHERE`?
- How do you write a full outer join in MySQL, and why `UNION ALL` rather than `UNION`?
- In a self join for pairs, what does `a.id < b.id` prevent?
- Why does an inner join after a left join undo it?
- What is fan-out, and how do you avoid double counting across two child tables?
- Why is `NOT EXISTS` safer than `NOT IN` for an anti join?

The three queries are a department report that keeps empty departments, a self join pairing employees in the same department, and an anti join for courses with no enrolments in one term.
