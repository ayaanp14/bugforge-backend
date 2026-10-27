---
title: Reading a query plan with EXPLAIN
minutes: 16
seo-title: How to Read MySQL EXPLAIN: type, key, rows and Extra
description: MySQL EXPLAIN shows how a query runs: the access type from const to ALL, the chosen index, estimated rows, Extra notes like Using filesort, and EXPLAIN ANALYZE.
question: How do you read MySQL EXPLAIN output?
answer: Read MySQL EXPLAIN one row per table access, in join order. The type column says how rows are found, from const and eq_ref (one row by key) through ref and range down to index and ALL (full scans). The key column is the index chosen, rows is the estimated number examined, and Extra flags extra work such as Using filesort or Using temporary.
q: What does type ALL mean in MySQL EXPLAIN?
a: type ALL is a full table scan: the server reads every row of that table and tests the WHERE condition on each. On a small table it is fine; on a large one, or as the inner table of a join, it is usually the cause of a slow query. Look for a missing index or a predicate that cannot use one.
q: What is the difference between EXPLAIN and EXPLAIN ANALYZE?
a: EXPLAIN only plans the query and shows the optimizer's estimates without running it. EXPLAIN ANALYZE, added in MySQL 8.0.18, actually runs the query and prints the plan as a tree with real timings, actual row counts and loop counts beside the estimates, so you can see where the estimate was wrong. Do not run it on a slow data-changing statement in production.
q: What does Using filesort mean?
a: Using filesort means MySQL must sort the rows itself for ORDER BY or GROUP BY because no index delivers them in the needed order. Despite the name it happens in memory when the data fits the sort buffer. It is cheap for a few rows and costly for many; an index whose prefix matches the filter and then the sort columns removes it.
q: What does Using index mean in the Extra column?
a: Using index means the query is answered from the index alone, a covering index, without reading the table's rows. It is one of the best things to see in a plan. Do not confuse it with Using index condition, which means index condition pushdown is filtering entries inside the index before rows are fetched.
q: Why does MySQL not use my index?
a: The optimizer estimated a different plan was cheaper, or could not use the index at all. Common causes are a function or type conversion on the column, a leading wildcard in LIKE, a filter missing the composite index's first column, low selectivity so a scan is cheaper, or stale statistics, which ANALYZE TABLE refreshes.
---
An index you created is a hope; a **query plan** is the server telling you what it will actually do. Every performance conversation — in a code review, an incident or an interview — ends with "what does `EXPLAIN` say?". This lesson teaches MySQL 8's plan output column by column, the access-type ladder you should know by heart, the `Extra` notes that signal trouble, and `EXPLAIN ANALYZE`, which runs the query and shows the real numbers.

The exercise engine here is SQLite, whose `EXPLAIN QUERY PLAN` looks nothing like MySQL's, so this lesson is reading: the plans below are MySQL's, and the exercises analyse plan rows stored in a table.

## Asking for a plan

Put `EXPLAIN` in front of a `SELECT` (or an `UPDATE`, `DELETE`, `INSERT … SELECT`). The query is planned, not run.

```sql
EXPLAIN
SELECT o.id, o.amount
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE c.city = 'Pune'
ORDER BY o.amount DESC;
```

```text
+----+-------------+-------+------+-----------------------+----------------------+---------+----------+------+----------+----------------------------------------------+
| id | select_type | table | type | possible_keys         | key                  | key_len | ref      | rows | filtered | Extra                                        |
+----+-------------+-------+------+-----------------------+----------------------+---------+----------+------+----------+----------------------------------------------+
|  1 | SIMPLE      | c     | ref  | PRIMARY,idx_city      | idx_city             | 243     | const    |  120 |   100.00 | Using index; Using temporary; Using filesort |
|  1 | SIMPLE      | o     | ref  | idx_orders_customer   | idx_orders_customer  | 4       | shop.c.id|    9 |   100.00 | NULL                                         |
+----+-------------+-------+------+-----------------------+----------------------+---------+----------+------+----------+----------------------------------------------+
```

One row per table access, listed in the **join order** the optimizer chose: here it starts from the Pune customers and, for each, looks up their orders.

## The columns

- **id** and **select_type** — which `SELECT` the row belongs to: `SIMPLE` for a query without subqueries or unions, `PRIMARY` for the outer one, `SUBQUERY`, `DERIVED` (a derived table in `FROM`), `UNION`.
- **table** — the table or alias accessed in this step.
- **type** — *how* rows are found. The most important column; see the ladder below.
- **possible_keys** — indexes that could apply. `NULL` here means no index matches the predicates at all.
- **key** — the index actually chosen, or `NULL` for none.
- **key_len** — how many bytes of the index key are used: on a composite index, a short `key_len` tells you only the first column was used to seek.
- **ref** — what the key is compared with: `const` for a literal, `db.table.column` for a join column.
- **rows** — the **estimated** number of rows examined in this step, per lookup. For a nested-loop join, multiply the steps' `rows` (and `filtered`) to estimate the total work.
- **filtered** — the estimated percentage of those rows that survive the remaining conditions.
- **Extra** — everything else, and often the most revealing part.

## The access-type ladder

From best to worst — memorise the order:

| type | Meaning |
| --- | --- |
| `system` / `const` | at most one matching row, found by a primary key or unique index compared with a constant; read once |
| `eq_ref` | in a join, exactly one row per row of the previous table, through a primary key or unique `NOT NULL` index |
| `ref` | all rows matching one value of a non-unique index (or a prefix of a unique one) |
| `ref_or_null` | like `ref`, plus the `IS NULL` rows |
| `index_merge` | several indexes searched and their results combined |
| `range` | a range of one index: `<`, `>`, `BETWEEN`, `IN (…)`, `LIKE 'abc%'` |
| `index` | the **whole index** read from start to end — a full scan, but of the smaller structure |
| `ALL` | the **whole table** read — a full table scan |

`ALL` on a big table is the usual culprit. `index` is better only because the index is smaller than the table; it is still reading everything. Seeing `ALL` on the **inner** table of a join is the worst case: the whole table read once per outer row. MySQL 8.0.18 and later replace that with a hash join, shown as `Using join buffer (hash join)` — better, but still a sign an index on the join column is missing.

## Extra: what to look for

Good signs:

- `Using index` — a **covering index**: the step is answered from the index alone, never touching the rows.
- `Using index condition` — **index condition pushdown**: part of the `WHERE` is tested on index entries before rows are fetched.
- `Using index for skip scan`, `Backward index scan` — the index is used in a less obvious way.

Warning signs:

- `Using filesort` — the rows are sorted for `ORDER BY`/`GROUP BY` because no index delivers that order. Not a file necessarily; it is any sort the server performs. Cheap on fifty rows, expensive on five million.
- `Using temporary` — an internal temporary table is built, typically for a `GROUP BY` or `DISTINCT` on columns from different tables, or a `UNION`.
- `Using where` with `type = ALL` — every row is read and most are thrown away.
- `Using join buffer` — a join without a usable index on the inner table.

Neutral: `Using where` on its own just means a condition is checked after the access method.

## A slow query, diagnosed

```sql
EXPLAIN SELECT * FROM orders WHERE YEAR(placed_on) = 2024 ORDER BY amount;
```

```text
| table  | type | possible_keys | key  | rows   | filtered | Extra                       |
| orders | ALL  | NULL          | NULL | 498211 |   100.00 | Using where; Using filesort |
```

Read it left to right: full table scan (`ALL`), no candidate index (`possible_keys` `NULL` — even though `placed_on` is indexed, because the column is wrapped in a function), half a million rows examined, and then a sort. The fix is a predicate the index can use — `placed_on >= '2024-01-01' AND placed_on < '2025-01-01'` — after which the plan shows `type: range`, `key: idx_orders_placed_on` and far fewer `rows`. The next lesson is about exactly that rewrite.

## EXPLAIN ANALYZE: the real numbers

`EXPLAIN` shows estimates. `EXPLAIN ANALYZE` (MySQL 8.0.18+) **runs** the query and prints the plan as a tree, each node with the estimate *and* what happened:

```text
-> Sort: o.amount DESC  (actual time=4.21..4.30 rows=1083 loops=1)
    -> Nested loop inner join  (cost=520.4 rows=1080) (actual time=0.09..3.62 rows=1083 loops=1)
        -> Covering index lookup on c using idx_city (city='Pune')  (cost=12.3 rows=120) (actual time=0.05..0.11 rows=118 loops=1)
        -> Index lookup on o using idx_orders_customer (customer_id=c.id)  (cost=3.1 rows=9) (actual time=0.02..0.03 rows=9.2 loops=118)
```

Read it from the most indented line outwards. `actual time=first..last` is milliseconds to the first and last row, `rows` is per loop, and `loops` is how many times the node ran — `rows=9.2 loops=118` is about 1,083 rows in total. The biggest gap between estimated and actual rows is where the optimizer was misled, usually by stale statistics (`ANALYZE TABLE orders;` refreshes them). Since `EXPLAIN ANALYZE` really executes the statement, never point it at a slow `DELETE` on production. `EXPLAIN FORMAT=TREE` gives the same tree without running it, and `FORMAT=JSON` adds the cost model's figures.

PostgreSQL's equivalents are `EXPLAIN` and `EXPLAIN (ANALYZE, BUFFERS)`, with node names such as `Seq Scan`, `Index Scan`, `Index Only Scan` and `Bitmap Heap Scan` in place of MySQL's `type` column.

## Practise

Both exercises work on plan rows stored as data — the columns of MySQL's `EXPLAIN` in a table. The first lists the full table scans, biggest first. The second ranks each step's access type on the ladder and reports each query's weakest step and whether it sorts.
