---
title: Checkpoint — Aggregation
minutes: 25
seo-title: SQL GROUP BY Quiz: Aggregates, HAVING and Pivot Practice Test
description: Test yourself: 12 questions and three queries on COUNT, SUM and AVG with NULLs, GROUP BY, HAVING, conditional aggregation, group concat and grouping mistakes.
q: What is the difference between COUNT(*) and COUNT(col)?
a: `COUNT(*)` counts rows, whatever they contain; `COUNT(col)` counts only the rows where `col` is not NULL. `COUNT(DISTINCT col)` goes further and counts the different non-NULL values. Say which noun you are counting before choosing one.
q: When does a condition go in WHERE and when in HAVING?
a: A condition on individual rows that needs no aggregate goes in `WHERE`, which runs before grouping and reduces the work. A condition on a group, using `COUNT`, `SUM`, `MIN` or another aggregate, can only go in `HAVING`, which runs after grouping.
q: How do you count several statuses per group in one query?
a: Use one conditional aggregate per status, such as `SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid`, side by side in the SELECT list with a `GROUP BY` on the row label. Every group stays in the result, and a status with no rows shows 0.
---
This checkpoint covers the whole module: the aggregate functions and how they treat NULL and empty input; `GROUP BY` on columns and expressions; `HAVING` and how it differs from `WHERE`; conditional aggregation with `SUM(CASE …)` for counts, pivots and rates; `GROUP_CONCAT` with `DISTINCT`, `ORDER BY` and `SEPARATOR`; and the grouping mistakes — `ONLY_FULL_GROUP_BY`, the three `COUNT`s, and averages of averages.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What do `COUNT(*)`, `COUNT(col)` and `COUNT(DISTINCT col)` each count?
- What do `SUM` and `COUNT` return when no rows match?
- What may appear in the SELECT list of a grouped query, and what does error 1055 mean?
- In what order do `WHERE`, `GROUP BY`, `HAVING`, `SELECT` and `ORDER BY` run?
- How do you find values that appear more than once in a column?
- Why does `COUNT(CASE WHEN … THEN 1 ELSE 0 END)` count every row?
- Where do `DISTINCT`, `ORDER BY` and `SEPARATOR` go in a `GROUP_CONCAT` call?
- Why is an average of averages usually wrong, and what do you compute instead?

The three queries are a monthly sales summary with a revenue floor, a transaction report with approved counts and amounts per month and country, and a daily product list with distinct counts and sorted names.
