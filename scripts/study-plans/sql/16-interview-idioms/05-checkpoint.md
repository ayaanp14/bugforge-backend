---
title: Final checkpoint — Interview idioms
minutes: 30
seo-title: SQL Interview Practice Test: Classic Questions and Theory Quiz
description: A final SQL interview practice test: 12 questions and three queries on the classic problems, WHERE vs HAVING, ranking, NOT IN with NULL and fan-out joins.
q: Which ranking function answers "the highest-paid employees in each department, ties included"?
a: `RANK()` or `DENSE_RANK()` partitioned by department and ordered by salary descending, keeping rank 1. Both give every tied top earner rank 1; `ROW_NUMBER()` would keep just one of them, chosen arbitrarily unless the order breaks the tie.
q: Why put a date filter in the ON clause when finding customers with no orders in a year?
a: The anti-join keeps customers whose LEFT JOIN found no matching order. A date condition in WHERE would test the NULL order date of those customers and discard them; in ON it limits which orders can match, so customers with orders only in other years are kept as having none.
q: How do you find duplicate emails case-insensitively in SQL?
a: Group by a normalised form and keep groups with more than one row: `GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1`. MySQL's default collation already ignores case, but other databases and case-sensitive collations do not, and neither ignores leading spaces.
---
The last checkpoint of the SQL plan. It covers the classic interview questions, the theory drill, the idiom sheet and the pitfalls — and, being the last one, it reaches back across the whole track: filtering, NULLs, grouping, joins, subqueries, window functions, data changes, keys and transactions.

**How it works.** Twelve questions and three queries; 70% on the questions and every query accepted clears the module. With every other module complete, that also completes the plan.

**Before you start**, make sure you can answer these from memory:

- The second highest salary two ways, and how each returns NULL when there is none.
- Why "employees earning more than their manager" is a self-join, and what happens to the employee with no manager.
- Why `NOT IN` returns nothing when the subquery holds a NULL, and the two safe alternatives.
- WHERE vs HAVING, DELETE vs TRUNCATE vs DROP, UNION vs UNION ALL — one sentence each, plus one detail.
- The logical order of a query's clauses, and why an alias cannot be used in WHERE.
- ROW_NUMBER, RANK and DENSE_RANK on the values 100, 90, 90, 80.
- Why a join to two child tables inflates sums, and how pre-aggregating fixes it.
- What each ACID property guarantees, and the leftmost-prefix rule of a composite index.

The three queries are the classics with a twist: the highest earners of each department with ties kept, the customers who placed no order in 2024 (the anti-join with its condition in the right place), and the duplicate emails once case and stray spaces are ignored.
