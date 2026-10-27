---
title: Checkpoint — Subqueries
minutes: 25
seo-title: SQL Subqueries Quiz: Correlated, EXISTS and NOT IN Practice
description: Test yourself: 12 questions and three queries on SQL subqueries: scalar subqueries, IN and EXISTS, correlated subqueries, derived tables and NOT IN with NULL.
q: What does a scalar subquery return when it finds no rows?
a: NULL. Any comparison with it, such as `salary > (SELECT …)`, is then unknown, so `WHERE` keeps no rows. Wrap the subquery in `COALESCE` when a default value is wanted instead.
q: How do you compare each row with the average of its own group?
a: Use a correlated subquery that filters the inner table by the outer row's group: `WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept = e.dept)`. Or compute the per-group averages once in a derived table and join it on the group column.
q: Why must a derived table have an alias in MySQL?
a: MySQL refers to every table in `FROM` by a name, and a subquery has none of its own, so it raises error 1248, "Every derived table must have its own alias". Write `FROM (SELECT …) AS t` and use `t.column` in the outer query.
---
This checkpoint covers the whole module: scalar subqueries in `WHERE`, the select list and `HAVING`, with their zero-row and many-row behaviour; membership with `IN`, existence with `EXISTS`, multi-column `IN` and `ANY`/`ALL`; correlated subqueries for per-group comparisons and the latest row per group; derived tables for aggregates of aggregates and for joining per-parent totals without fan-out; and the `NOT IN` trap with NULL.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does a scalar subquery return for zero rows, and what does MySQL do for two?
- How do you find the second highest distinct salary, returning NULL when there is none?
- When would you choose `IN`, `EXISTS` or a join?
- What makes a subquery correlated, and why should every inner column be qualified?
- How do you return the latest row per group, and what happens with ties?
- Why must a derived table have an alias, and how does aggregating before a join prevent fan-out?
- Why does `NOT IN` return nothing when its subquery yields a NULL, and what do you write instead?

The three queries are products priced above their own category's average, customers with no order in 2024 when some orders have no customer, and the top-spending customer of each city using a derived table.
