---
title: Checkpoint — Indexes and performance
minutes: 25
seo-title: SQL Indexing Quiz: B+Trees, EXPLAIN and Sargable Queries
description: Test yourself: 12 questions and three SQL tasks on MySQL indexes, clustered keys, composite index order, EXPLAIN, sargable rewrites and covering indexes.
q: What is the difference between a clustered and a secondary index in InnoDB?
a: The clustered index is the table itself, a B+tree on the primary key whose leaves hold the full rows, so there is exactly one. A secondary index holds its columns plus the primary key, so a lookup through it finds the key and then searches the clustered index for the row unless the index covers the query.
q: Why can an index on (a, b) not serve WHERE b = 5?
a: The entries are sorted by a first and by b only within each value of a, so the b = 5 entries are scattered across the whole index. The leftmost prefix rule allows a seek on a, or on a and b, but not on b alone; MySQL can only scan the index or, sometimes, use a skip scan.
q: How do you find the rows that stop a UNIQUE index being created?
a: Group by the column, or the columns, the index will cover and keep the groups with more than one row: SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1. Resolve those duplicates first, then CREATE UNIQUE INDEX succeeds.
---
This checkpoint covers the whole module: what an index is and why it is a B+tree, InnoDB's clustered primary key and the secondary indexes that point to it, selectivity and the cost of every index, composite indexes and the leftmost prefix rule, how a range stops a seek, reading MySQL's `EXPLAIN` and `EXPLAIN ANALYZE`, sargable predicates and their rewrites, and covering indexes.

**How it works.** Twelve questions and three SQL tasks. You need 70% on the questions and every task accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why is a B+tree three or four levels deep for millions of rows, and what do its linked leaves make cheap?
- What does an InnoDB secondary index store as its pointer to the row, and what follows from that?
- Which of `WHERE a = 1`, `WHERE b = 2` and `WHERE a = 1 AND c = 3` can seek on an index on `(a, b, c)`, and how far?
- Why do equality columns go before the range column in a composite index?
- Put `ALL`, `const`, `range`, `ref`, `index` and `eq_ref` in order from best to worst.
- What do `Using index`, `Using index condition`, `Using filesort` and `Using temporary` mean?
- Rewrite `WHERE YEAR(d) = 2024` and `WHERE LEFT(code, 2) = 'IN'` so an index can be used.
- Why does `SELECT *` almost never use a covering index?

The three tasks are practical maintenance work: remove the duplicate rows that block a `UNIQUE` index, create it and show what remains; build an index for a monthly payments report and write the report with a sargable date range; and find the indexes a usage log says are never read, the ones a DBA would consider dropping.
