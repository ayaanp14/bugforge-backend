---
title: Checkpoint — Window functions
minutes: 25
seo-title: SQL Window Functions Quiz: RANK, LAG and Frames Practice
description: Test yourself: 12 questions and three queries on OVER and PARTITION BY, row numbers and ranks, LAG and LEAD, frames, running totals and top N per group.
q: Why can't I filter on ROW_NUMBER in the WHERE clause?
a: Window functions are evaluated after WHERE, GROUP BY and HAVING, so WHERE runs before the row numbers exist. Compute the window function in a CTE or derived table and filter on its alias in the outer query.
q: Which ranking function finds the second highest salary?
a: `DENSE_RANK() OVER (ORDER BY salary DESC)`, keeping rank 2. Ties at the top share rank 1 and the next distinct salary is 2; with `RANK` the next salary after a tie could be 3, and with `ROW_NUMBER` rank 2 could be a second copy of the top salary.
q: Why does SUM OVER ORDER BY give the same running total on two rows?
a: The two rows tie on the window's ORDER BY, and the default frame, `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, includes all peers of the current row. Add a unique tie-breaker and use a `ROWS` frame for a per-row total.
---
This checkpoint covers the whole module: window functions with `OVER`, partitions and the whole-result window `OVER ()`, where windows sit in the order of evaluation, `ROW_NUMBER`, `RANK`, `DENSE_RANK` and `NTILE` and how they treat ties, `LAG`, `LEAD` and `FIRST_VALUE`, frames with `ROWS` and `RANGE`, running totals and moving averages, and the top-N-per-group pattern.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What is the difference between `GROUP BY dept` and `PARTITION BY dept`?
- For scores 90, 90, 80, what do `ROW_NUMBER`, `RANK` and `DENSE_RANK` give?
- Why can a window function not appear in WHERE, and how do you filter on one?
- What does `LAG(x, 1, 0)` return on a partition's first row, and on a row whose previous `x` is NULL?
- What is the default frame when a window has an ORDER BY, and what does it do with ties?
- Which frame gives a 3-row moving average, and why must its result be rounded?
- When does top N per group need `RANK` rather than `ROW_NUMBER`?

The three queries are the second-highest salary in every department (ties included), month-over-month revenue growth computed with `LAG` over a monthly aggregate, and each product's rank and gap to the leader of its category.
