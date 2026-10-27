---
title: Checkpoint — Selecting and filtering
minutes: 25
seo-title: SQL WHERE Quiz: Aliases, AND/OR, IN, BETWEEN, LIKE Practice
description: Test yourself: 12 questions and three queries on SQL aliases, calculated columns, WHERE, AND/OR precedence, IN, BETWEEN, LIKE wildcards and DISTINCT.
q: Why does `WHERE category = 'books' OR category = 'games' AND price < 500` return expensive books?
a: Because AND binds tighter than OR, so it reads as `category = 'books' OR (category = 'games' AND price < 500)`: every book qualifies whatever its price. Parenthesise the OR group: `(category = 'books' OR category = 'games') AND price < 500`.
q: What does `SELECT 7 / 2, 7 DIV 2` return in MySQL?
a: 3.5000 and 3. MySQL's `/` is always decimal division and `DIV` is integer division. PostgreSQL, SQLite and SQL Server would return 3 for `7 / 2`, because there `/` between two integers truncates.
q: Why can a NOT IN list containing NULL return nothing?
a: `x NOT IN (1, NULL)` expands to `x <> 1 AND x <> NULL`. The comparison with NULL is unknown for every row, so the AND is never true and WHERE keeps no rows. The same happens with a NOT IN subquery that returns a NULL.
---
This checkpoint covers the whole module: column and table aliases and where they may be used; calculated columns with arithmetic, decimal division and `DIV`, `MOD`, `ROUND` and `CONCAT`; the `WHERE` clause with comparisons on numbers, text and dates; `AND`, `OR` and `NOT` with precedence and three-valued logic; `IN`, `BETWEEN` and `LIKE`; and `DISTINCT` with `COUNT(DISTINCT …)`.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Where may a column alias be used, and why not in `WHERE`?
- What do `7 / 2`, `7 DIV 2` and `7 % 2` return in MySQL, and what does `NULL + 1` return?
- Why does `WHERE dept <> 'Sales'` leave out the rows whose `dept` is NULL, and how do you include them?
- Which binds first, `AND` or `OR`, and where do the parentheses go?
- Is `BETWEEN` inclusive, and why is it risky on a `DATETIME` column?
- What do `%` and `_` match in `LIKE`, and how do you search for a literal `%`?
- What happens to `NOT IN` when its list contains NULL?
- How do `COUNT(*)`, `COUNT(col)` and `COUNT(DISTINCT col)` differ?

The three queries are a price list with renamed and calculated columns, a filtered order list that needs parentheses, a range and a NULL check, and a set of distinct values found with a `LIKE` pattern.
