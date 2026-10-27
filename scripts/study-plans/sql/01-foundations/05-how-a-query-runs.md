---
title: How a query runs — the logical order of the clauses
minutes: 14
seo-title: SQL Order of Execution: FROM, WHERE, SELECT, ORDER BY
description: SQL runs a query's clauses in a logical order, FROM and WHERE before SELECT, ORDER BY near the end, which explains alias errors. Plus the optimizer and plans.
question: What is the order of execution of a SQL query?
answer: A SQL query is evaluated logically in this order: FROM (and joins), WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, then LIMIT. It is written in a different order, starting with SELECT. The logical order explains why a column alias defined in SELECT cannot be used in WHERE but can be used in ORDER BY. The optimizer may physically do the work in any order that gives the same result.
q: Why can't I use a column alias in the WHERE clause?
a: Because WHERE is evaluated before SELECT, so when the rows are being filtered the alias does not exist yet. Repeat the expression in WHERE, as in `WHERE price * qty > 100`, or wrap the query in a subquery or CTE and filter on the alias outside it. MySQL does allow aliases in HAVING and ORDER BY.
q: What is the difference between the logical and physical order of a query?
a: The logical order (FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT) defines what result the query means. The physical order is what the engine actually does, chosen by the optimizer: it may read an index already sorted to skip ORDER BY, or stop early for a LIMIT, as long as the result is the same.
q: What does the query optimizer do?
a: The optimizer turns a parsed query into an execution plan: it decides which indexes to use, the order to join tables, which join algorithm to apply and whether to sort, estimating the cost of each choice from statistics about the data. `EXPLAIN` shows the plan it chose.
q: Can ORDER BY use a column that is not in the SELECT list?
a: Yes, in an ordinary query: `SELECT name FROM students ORDER BY year` is valid because ORDER BY can still see every column of the rows. The exception is a query with DISTINCT or GROUP BY, where ORDER BY may only use what survives those steps.
---
You write a query in the order SQL's grammar demands — `SELECT` first, then `FROM`, then the rest. The database does not evaluate it in that order. Knowing the order it does use, the **logical order of execution**, is one of the most useful things in SQL: it explains a whole class of errors ("unknown column" for an alias you just defined), it tells you where each condition belongs, and it is a favourite interview question. This lesson also follows a query through the database — parser, optimizer, executor — so that "the database decides how" stops being magic.

## Written order and logical order

The clauses of a full `SELECT` are written in this order:

```sql
SELECT   DISTINCT columns, expressions
FROM     tables and joins
WHERE    row conditions
GROUP BY grouping columns
HAVING   group conditions
ORDER BY sort keys
LIMIT    count;
```

They are evaluated, logically, in this one:

| Step | Clause | What it does |
| --- | --- | --- |
| 1 | `FROM` / `JOIN` | assemble the input rows from the tables |
| 2 | `WHERE` | keep the rows whose condition is true |
| 3 | `GROUP BY` | collapse the rows into groups |
| 4 | `HAVING` | keep the groups whose condition is true |
| 5 | `SELECT` | compute the output columns and their aliases |
| 6 | `DISTINCT` | drop duplicate output rows |
| 7 | `ORDER BY` | sort the output |
| 8 | `LIMIT` / `OFFSET` | keep a slice of the sorted rows |

Read it as a pipeline: each step takes the previous step's rows and hands its own on. `GROUP BY` and `HAVING` are the subject of the aggregation module; the rest you can use already.

## Consequence 1: aliases do not exist in WHERE

```sql
SELECT name, price * qty AS line_total
FROM order_items
WHERE line_total > 100;          -- error: Unknown column 'line_total' in 'where clause'
```

`WHERE` is step 2; the alias `line_total` is created in step 5. When the rows are being filtered there is no such column. Repeat the expression instead:

```sql
SELECT name, price * qty AS line_total
FROM order_items
WHERE price * qty > 100;
```

The database computes the product once per row either way; repeating it costs nothing. (Later modules show the other fix — compute the alias in a subquery or a CTE, then filter on it outside.)

## Consequence 2: aliases do exist in ORDER BY

```sql
SELECT name, price * qty AS line_total
FROM order_items
WHERE price * qty > 100
ORDER BY line_total DESC;
```

`ORDER BY` is step 7, after `SELECT` has named its columns, so the alias is visible. This holds in every major database. (MySQL is also lenient enough to accept select aliases in `GROUP BY` and `HAVING`; PostgreSQL accepts them in `GROUP BY` but not `HAVING`; SQL Server accepts neither. Portable code repeats the expression there too.)

## Consequence 3: ORDER BY can see columns you did not select

`ORDER BY` runs after `SELECT`, yet it may sort by a column that is not in the select list:

```sql
SELECT name FROM students ORDER BY year DESC, name;
```

That works because, logically, the rows still carry all their columns until the very end — the select list decides what is *shown*. The exception: after `DISTINCT` or `GROUP BY` the original rows have been merged, so `ORDER BY` may only use what survived.

## Consequence 4: LIMIT is last

`LIMIT 3` takes the first three rows **of the sorted result**. It does not take three rows and then sort them. That is why `ORDER BY … LIMIT` answers "top three", and why `LIMIT` without `ORDER BY` answers "any three".

## Consequence 5: WHERE sees rows, not results

`WHERE` decides about one input row at a time, before anything is computed across rows. A condition such as "the price is above the average price" cannot be written as `WHERE price > AVG(price)` — at step 2 there is no average yet. Aggregates belong to `HAVING` (about groups) or to a subquery. You will meet both; the error message `Invalid use of group function` means exactly this.

## A worked trace

```sql
SELECT name, price * qty AS line_total
FROM order_items
WHERE price * qty >= 100
ORDER BY line_total DESC, item_id;
```

with

```text
item_id | name | price | qty
1 | pen | 10 | 5
2 | lamp | 60 | 2
3 | desk | 150 | 1
4 | ink | 40 | 3
```

1. `FROM` — the four rows.
2. `WHERE price * qty >= 100` — pen gives 50, dropped; lamp 120, desk 150, ink 120 kept.
3. `SELECT` — each kept row becomes `(name, line_total)`, but still remembers its `item_id`.
4. `ORDER BY line_total DESC, item_id` — desk 150; then lamp and ink tie on 120, and `item_id` puts lamp (2) before ink (4).

```text
name | line_total
desk | 150
lamp | 120
ink | 120
```

## What the database actually does

The logical order defines **what the answer is**. How the engine computes it is a separate matter, decided per query:

1. **Parser.** The text is checked against the grammar and turned into a tree. Syntax errors come from here.
2. **Resolver.** Names are looked up: does `order_items` exist, does it have a `qty` column, are the types compatible? "Unknown column" errors come from here.
3. **Optimizer.** The tree is turned into an **execution plan**. The optimizer considers alternatives — scan the table or use an index, which table to read first in a join, hash join or nested loop, sort now or read an index that is already sorted — and estimates the cost of each from **statistics** about the data (row counts, how many distinct values a column has). It picks the cheapest.
4. **Executor.** The plan runs, reading pages from memory or disk, and rows stream back to the client.

The plan is allowed to do things in any order as long as the result is the one the logical order defines. With an index on `price`, `ORDER BY price LIMIT 5` can read five index entries and stop — no sort at all, and the `LIMIT` effectively runs first. A condition in `WHERE` on an indexed column can become an index lookup instead of a filter over every row.

You can ask to see the plan:

```sql
EXPLAIN SELECT name FROM students WHERE city = 'Pune';
```

MySQL answers with a row per table: which index it would use (`key`), how many rows it expects to examine (`rows`), and notes such as `Using where` or `Using filesort`. Reading plans is the subject of the indexes module; for now it is enough to know they exist and that the optimizer, not the order you wrote the clauses in, decides the work.

## Where each condition belongs

The logical order also settles a design question: put a row condition in `WHERE`, as early as possible. Rows removed at step 2 are never grouped, computed, sorted or sent. Filtering is the cheapest thing a query does, and the optimizer is best at it.

## Key takeaways

- Written order starts with `SELECT`; the logical order is **FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT**.
- A select **alias cannot be used in WHERE** (it does not exist yet) but **can be used in ORDER BY**.
- `ORDER BY` may sort by unselected columns, except after `DISTINCT`/`GROUP BY`.
- `LIMIT` slices the sorted result; `WHERE` cannot use aggregates.
- Parser → resolver → optimizer → executor; the optimizer picks a plan from statistics, and `EXPLAIN` shows it.
- The plan may reorder work freely as long as the result matches the logical order.
