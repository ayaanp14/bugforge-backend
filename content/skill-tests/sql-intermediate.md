---
updated: 2026-10-03
question: What does the SQL (Intermediate) skill test cover?
answer: It certifies SQL at the level a developer or analyst uses it at work. Multiple-choice questions examine window functions, correlated and recursive subqueries, joins and aggregation in harder combinations, NULL logic, set operations, constraints, index design, normalization up to BCNF, and transactions and isolation levels. Most give tables and a query and ask exactly what it returns; there is no coding section.
q: Which window functions should I know for the SQL Intermediate test?
a: The ranking functions ROW_NUMBER, RANK, DENSE_RANK and NTILE; the offset functions LAG and LEAD; FIRST_VALUE and LAST_VALUE; and ordinary aggregates such as SUM, COUNT and AVG used with OVER. Beyond the names, know how PARTITION BY and ORDER BY shape each window, and how a frame clause decides which rows a calculation can see.
q: Are the transaction questions about MySQL or PostgreSQL behaviour?
a: Mostly about the SQL standard: the four isolation levels, the anomalies each one permits, ACID, savepoints, lost updates and deadlocks. Where the outcome depends on how an engine implements it, the question names MySQL's InnoDB or PostgreSQL and assumes their default settings, so you are never asked to guess a configuration.
q: How much database design theory is in the Intermediate test?
a: A real share. Functional dependencies, candidate keys and the normal forms up to Boyce–Codd sit beside the query-reading questions, along with how a B-tree index is chosen for a query. They are asked through small scenarios, such as a relation with its dependencies or a query with a candidate index, rather than as definitions to recite.
q: Does the test cover stored procedures, triggers or JSON columns?
a: No. It does not examine stored procedures, triggers, user-defined functions or vendor extensions such as JSON operators. It stays with standard queries, schema constraints, indexes, normalization and transactions: the SQL that relational databases share, and the part that carries over whichever one you use at work.
---

SQL (Intermediate) examines the part of SQL that separates a query that runs from a query that is right. It assumes everything in the [SQL (Basic) test](/skill-tests/sql-basic) — filtering, joins, grouping, simple subqueries — and goes on to window functions, correlated and recursive queries, NULL logic in full, and the design underneath every query: indexes, normal forms and transactions.

The format stays the same as Basic: most questions give one or two small tables and a query and ask exactly what it returns, and there is nothing to type. The design questions describe a schema, a workload or two sessions running side by side and ask what follows. Everything is written so MySQL 8 and PostgreSQL agree on the answer; where they cannot, the question says which database, version or standard it means.

## The ground it covers

- **Window functions.** Ranking with ties, running and moving totals, comparing a row with the one before or after it, and splitting rows into buckets — with PARTITION BY, ORDER BY and frame clauses deciding what each calculation sees.
- **Subqueries and CTEs.** Correlated subqueries, EXISTS set against IN, comparisons with ANY and ALL, CTEs that build on each other, and recursive CTEs that walk a hierarchy or generate a series.
- **Joins.** Joins beyond equality on a key — self-joins, ranges, several outer joins in a chain — and what a join does to the row counts an aggregate later sees.
- **Aggregation.** Conditional aggregation with CASE, the different forms of COUNT, and HAVING conditions that combine several aggregates.
- **NULL handling.** Three-valued logic wherever it appears — filters, CASE, subqueries, constraints — and the tools for it, COALESCE and NULLIF.
- **Set operations.** UNION, INTERSECT and EXCEPT, and how duplicates and NULLs behave in each.
- **Tables and constraints.** Referential actions on foreign keys and CHECK constraints, and what each does to the rows around it.
- **Indexes and performance.** How a B-tree index is ordered and what that lets the engine do — seek, scan a range, return rows already sorted, answer from the index alone — and what each index costs on writes.
- **Normalization.** Functional dependencies, candidate keys, second and third normal form, BCNF, the anomalies each removes, and whether a decomposition loses information.
- **Transactions and isolation.** ACID, savepoints, the isolation levels and the anomalies each allows, lost updates, and how deadlocks arise.

## Working a window-function question

Window functions are evaluated late: after FROM, WHERE, GROUP BY and HAVING have done their work, and before ORDER BY and LIMIT. So a window only ever sees rows that survived the filters, and it can be computed over grouped results. With that in mind, every window question can be worked the same way on paper.

Split the rows into their partitions, or treat the whole result as one if there is no PARTITION BY. Sort each partition by the window's ORDER BY and note any ties, because several window functions treat tied rows as a block. Then, for each row, mark which rows its frame includes and compute. When the query wraps the window in an outer query, finish the inner result completely before reading the outer one. The [OS, DBMS & Networks MCQs](/aptitude/os-dbms-networks) cover the theory side; for window functions, a dozen queries written and run against a real database teach more than any summary.

## Design questions: indexes, normal forms and transactions

Three of the topics ask why a schema or a workload behaves as it does rather than what a query prints. They are still exact questions with one defensible answer.

- **Indexes.** Typically you have a query and an index, or must choose one, and reason from how the index is ordered: a composite index is sorted by its first column, then the second within it, and so on. Practise by running EXPLAIN on queries of your own in MySQL or PostgreSQL and predicting the plan before you look.
- **Normal forms.** Most questions give a relation with its functional dependencies, or rows that reveal them. Find the candidate keys first, by computing which attribute sets determine everything; most normal-form questions are settled once the keys are known.
- **Transactions.** Many questions set two sessions side by side and fix the order their statements run in. Open two connections to a local database and replay such schedules yourself at different isolation levels; seeing a blocked statement wait is worth more than any table of anomalies.

## Preparing for the paper

Read the Basic material back first if any of it is shaky: a slip in a plain join or a NULL comparison costs the same mark here as a hard window question. Then work the advanced topics against a real MySQL 8 or PostgreSQL installation, ideally both, because the paper keeps to their common ground. A good practice set is small: a ranking with ties in it, a running total, a comparison of each row with the previous one, a recursive walk down a hierarchy, and streaks of consecutive days like the sample below. For the theory, the [OS, DBMS & Networks](/aptitude/os-dbms-networks) questions on keys, normal forms and transactions are a quick daily drill.

## Sample question
topic: window-functions
answer: C

Table `logins` holds the numbered days on which one user signed in, each day at most once:

| day_no |
| --- |
| 1 |
| 2 |
| 4 |
| 5 |
| 6 |
| 7 |
| 9 |

```sql
SELECT COUNT(*) AS streaks, MAX(len) AS longest
FROM (
  SELECT grp, COUNT(*) AS len
  FROM (
    SELECT day_no - ROW_NUMBER() OVER (ORDER BY day_no) AS grp
    FROM logins
  ) t
  GROUP BY grp
) s;
```

What does the query return?

- A: `(2, 4)`
- B: `(1, 7)`
- C: `(3, 4)`
- D: `(7, 1)`

> Inside a run of consecutive days, `day_no` and the row number rise
> together, so their difference stays the same; each missing day raises it by
> one. The differences are 0 and 0 for days 1–2, 1 for each of days 4–7, and
> 2 for day 9: three groups, the longest four days long. `(2, 4)` counts the
> gaps instead of the runs, `(1, 7)` assumes the difference is equal on every
> row, and `(7, 1)` that it differs on every row. This is the gaps-and-islands
> pattern; if a day could appear twice, take the distinct days first, or the
> duplicate would split its run.
