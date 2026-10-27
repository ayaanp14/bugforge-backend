---
title: Checkpoint — Sorting and limiting
minutes: 25
seo-title: SQL ORDER BY and LIMIT Quiz: Sorting and Pagination Practice
description: Test yourself: 12 questions and three queries on SQL ORDER BY, multi-column sorts, NULL ordering, LIMIT and OFFSET, pagination and the Nth highest value.
q: What does MySQL's LIMIT 10, 20 return?
a: Twenty rows, starting with the eleventh. In the comma form the first number is the offset and the second the count, so it equals `LIMIT 20 OFFSET 10`.
q: Why do rows repeat between pages of an offset-paginated list?
a: Because the ORDER BY is not unique, so rows tied on the sort key can change places between the query for one page and the next, or because rows were inserted between requests. End the sort with the primary key, and use keyset pagination for data that changes.
q: How do you put NULLs last in an ascending MySQL sort?
a: Sort on `col IS NULL` first: `ORDER BY col IS NULL, col`. The expression is 0 for values and 1 for NULLs, so real values come first, in ascending order, and NULLs follow.
---
This checkpoint covers the whole module: `ORDER BY` with `ASC` and `DESC`, sorting by aliases, expressions and positions, where NULLs sort in MySQL and in other databases, multi-key sorts and tie-breakers, custom orders with `CASE`, `LIMIT` and `OFFSET` (and MySQL's comma form), `TOP` and `FETCH FIRST` in other dialects, offset and keyset pagination, and top-N and Nth-highest queries.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why does a query without `ORDER BY` have no guaranteed row order, and why does `LIMIT` need one?
- In `ORDER BY a, b DESC`, which keys are descending?
- Where does MySQL put NULLs in an ascending sort, and how do you move them to the end?
- Why can an alias appear in `ORDER BY` but not in `WHERE`?
- What do `LIMIT 5 OFFSET 10` and `LIMIT 5, 10` return?
- What is the offset of page `p` with `s` rows a page, and why do deep offsets get slow?
- How does keyset pagination find the next page?
- Why does the second-highest-salary query need `DISTINCT`, and how do you make it return NULL?

The three queries are a leaderboard sorted on several keys with a tie-breaker, a page from the middle of a catalogue with NULL prices sent to the end, and the third highest distinct score — NULL when there is none.
