---
title: Checkpoint — Query patterns
minutes: 30
seo-title: SQL Query Patterns Quiz: Gaps and Islands, Pivots, Nth Highest
description: An SQL query patterns practice test: 12 questions and three queries on gaps and islands, deduplication, pivots, rolling windows, nth highest and date series.
q: How do you group consecutive dates into streaks in SQL?
a: Number each user's distinct dates with `ROW_NUMBER()` and subtract that many days from the date. Consecutive dates share the result, so grouping by user and that value gives one row per streak with its first day, last day and length.
q: Why does a ROWS frame not give a 7-day window when dates are missing?
a: A ROWS frame counts rows, not days, so `6 PRECEDING` can reach back more than six days when some days have no row, and several rows on one day each get their own frame. Aggregate to one row per day and fill the calendar first, or frame on the date with RANGE.
q: Why does COUNT(*) report 1 for an empty day after a LEFT JOIN to a calendar?
a: The LEFT JOIN keeps the calendar row and fills the data columns with NULL, so the group holds one row. `COUNT(*)` counts rows and reports 1; `COUNT(column)` from the joined table counts non-NULL values and reports 0.
---
The checkpoint for query patterns: the shapes that reporting and interview questions take once the individual clauses are known — gaps and islands, deduplication, pivots, rolling windows, the nth highest value and date series.

**How it works.** Twelve questions and three queries; 70% on the questions and every query accepted clears the module.

**Before you start**, make sure you can answer these from memory:

- Why `date − ROW_NUMBER()` is constant along a run of consecutive dates, and what a duplicate date does to it.
- How LAG with a running SUM numbers islands when "consecutive" means something other than one step.
- How to find the gaps in a sequence with LEAD.
- How to keep one row per duplicate group, and why MySQL needs a derived table to delete the rest (error 1093).
- How SUM(CASE WHEN …) pivots rows into columns, why ELSE 0 matters, and how UNION ALL unpivots.
- The difference between a ROWS frame and a RANGE frame, and why a ROWS frame is not a 7-day window over missing dates.
- Why DENSE_RANK, not RANK, finds the nth highest distinct value, and how a scalar subquery makes "none" a NULL.
- How a recursive CTE builds a calendar, the 1,000-iteration limit, and why `COUNT(o.id)` and `COALESCE` follow the LEFT JOIN.

The three queries combine the patterns the way real reports do: each student's longest attendance streak (islands, then a maximum per student), a monthly ticket report with a column per status and the empty months filled in (a month series and a pivot together), and every department's top two pay levels side by side with the gap between them (the nth highest value per group, pivoted into columns).
