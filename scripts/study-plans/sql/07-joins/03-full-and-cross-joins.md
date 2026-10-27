---
title: FULL OUTER and CROSS JOIN — both sides, and every pair
minutes: 15
seo-title: FULL OUTER JOIN in MySQL: UNION Emulation and CROSS JOIN
description: MySQL has no FULL OUTER JOIN, so emulate it with a LEFT JOIN plus the unmatched rows of a RIGHT JOIN. CROSS JOIN builds every pair, like a sales grid.
question: How do you do a FULL OUTER JOIN in MySQL?
answer: MySQL does not support `FULL OUTER JOIN`, so it is emulated by combining two queries. Take `A LEFT JOIN B`, which keeps every row of A, then `UNION ALL` the rows of `A RIGHT JOIN B` where A's key is NULL, which adds the rows of B that matched nothing. The result holds matched pairs plus the unmatched rows of both tables.
q: Why not just use LEFT JOIN UNION RIGHT JOIN?
a: It usually works, but `UNION` removes duplicate rows from the whole result. If two genuinely different result rows happen to have identical values, for example two equal payments, one of them is silently lost. `UNION ALL` with the second query restricted to unmatched rows keeps duplicates and does less work.
q: What is a CROSS JOIN used for?
a: A `CROSS JOIN` returns every combination of rows from two tables, m × n rows in total. It is used to generate grids: every product in every size, every store for every day, every student for every exam. The grid is then usually left-joined to the real data so that missing combinations show as zero.
q: What happens if I forget the ON clause in a join?
a: In MySQL, `JOIN` without `ON` is a cross join, so every row is paired with every row. Two 10,000-row tables give 100 million rows, which can exhaust memory or run for minutes. PostgreSQL rejects `JOIN` without `ON`, but a comma join with a missing `WHERE` condition produces the same Cartesian product everywhere.
q: Which databases support FULL OUTER JOIN?
a: PostgreSQL, SQL Server, Oracle and SQLite since version 3.39 support `FULL [OUTER] JOIN` directly. MySQL and MariaDB do not, which is why the UNION emulation is a standard MySQL interview question.
---
`INNER JOIN` keeps matched pairs; `LEFT JOIN` also keeps the unmatched rows of one side. Two more joins complete the family. A **full outer join** keeps the unmatched rows of *both* sides — the natural tool for reconciling two lists that should agree but do not. A **cross join** has no matching at all: it pairs every row with every row, which sounds useless until you need a grid of every combination. MySQL lacks the first, so this lesson teaches the emulation every MySQL developer writes, and then the right and wrong uses of the second.

## What a full outer join returns

Take two lists of payment references: what the bank says it received, and what the accounts team recorded.

```sql
CREATE TABLE bank  (ref VARCHAR(10) PRIMARY KEY, amount INT);
CREATE TABLE books (ref VARCHAR(10) PRIMARY KEY, amount INT);
INSERT INTO bank  VALUES ('P1', 100), ('P2', 250), ('P4', 80);
INSERT INTO books VALUES ('P1', 100), ('P2', 205), ('P3', 60);
```

A full outer join on `ref` returns:

@figure full-outer

Matched references appear once with both amounts; P4 exists only at the bank; P3 only in the books. All three kinds of discrepancy are visible in one result. In PostgreSQL or SQL Server this is one clause:

```sql
-- PostgreSQL / SQL Server / SQLite 3.39+
SELECT COALESCE(b.ref, k.ref) AS ref, b.amount AS bank_amount, k.amount AS books_amount
FROM bank b
FULL OUTER JOIN books k ON k.ref = b.ref;
```

Note `COALESCE(b.ref, k.ref)`: on a books-only row, `b.ref` is NULL, so the key must be taken from whichever side has it.

## Emulating it in MySQL

MySQL 8 has no `FULL OUTER JOIN`. Worse, `FULL` is not a reserved word there: `FROM bank FULL JOIN books ON …` is read as the table `bank` with the alias `FULL`, followed by a plain inner join — it runs, and silently returns only the matched rows. `FULL OUTER JOIN` at least fails with a syntax error. The emulation splits the answer into the two parts a left join can produce:

1. every bank row, matched or not — `bank LEFT JOIN books`;
2. the books rows that matched no bank row — `books LEFT JOIN bank … WHERE bank.ref IS NULL`.

```sql
SELECT b.ref AS ref, b.amount AS bank_amount, k.amount AS books_amount
FROM bank b
LEFT JOIN books k ON k.ref = b.ref
UNION ALL
SELECT k.ref, NULL, k.amount
FROM books k
LEFT JOIN bank b ON b.ref = k.ref
WHERE b.ref IS NULL
ORDER BY ref;
```

How `UNION ALL` works (the set-operations module covers it fully): the two `SELECT`s must return the same number of columns, the result takes its column names from the first one, the rows of the second are appended, and an `ORDER BY` at the end sorts the combined result. The second part's rows have no bank side, so it writes `NULL` for `bank_amount` explicitly.

The second query is often written `RIGHT JOIN` instead, which is the same thing with the tables in the original order:

```sql
SELECT b.ref, b.amount, k.amount FROM bank b LEFT JOIN books k ON k.ref = b.ref
UNION ALL
SELECT k.ref, b.amount, k.amount FROM bank b RIGHT JOIN books k ON k.ref = b.ref
WHERE b.ref IS NULL;
```

### Why UNION ALL and not UNION

You will often see the shorter version: `… LEFT JOIN … UNION … RIGHT JOIN …` with no `WHERE`. The matched rows appear in both halves, and `UNION` (which removes duplicate rows) collapses them. That works only if every genuine result row is distinct. If the joined data can contain two identical rows — two line items with the same product and quantity, say — `UNION` deletes one of them, and nothing warns you. The `UNION ALL … WHERE key IS NULL` form is exact and avoids the duplicate-removal sort. Interviewers like candidates who know the difference.

## CROSS JOIN: every pair

```sql
CREATE TABLE sizes   (label VARCHAR(4), position INT);
CREATE TABLE colours (name VARCHAR(10));
INSERT INTO sizes   VALUES ('S', 1), ('M', 2), ('L', 3);
INSERT INTO colours VALUES ('black'), ('white');

SELECT c.name AS colour, s.label AS size
FROM colours c
CROSS JOIN sizes s
ORDER BY c.name, s.position;
```

@figure cross-grid

Two colours × three sizes = six rows. There is no `ON`: every combination is the point. If either table is empty, the product is empty.

## The grid pattern

The most useful cross join builds the frame of a report so that missing combinations show up as zeros instead of vanishing. Sales by region and month, where some regions sold nothing in some months:

```sql
SELECT r.name AS region, m.month, COALESCE(SUM(s.amount), 0) AS total
FROM regions r
CROSS JOIN months m
LEFT JOIN sales s ON s.region = r.name AND s.month = m.month
GROUP BY r.name, m.month
ORDER BY r.name, m.month;
```

The cross join produces every (region, month) cell; the left join attaches the sales that belong in each cell, using both conditions in `ON`; cells with no sales keep one NULL row, and `COALESCE(SUM(…), 0)` reports 0. Without the grid, a `GROUP BY` over `sales` alone can only report combinations that occurred — a chart built from it would silently skip the empty months.

## Accidental cross joins

The dangerous cross join is the one nobody asked for.

```sql
SELECT o.id, c.name FROM orders o, customers c;       -- forgot the WHERE
SELECT o.id, c.name FROM orders o JOIN customers c;   -- MySQL: forgot the ON
```

Both pair every order with every customer. On ten-thousand-row tables that is a hundred million rows. In MySQL, `JOIN`, `INNER JOIN` and `CROSS JOIN` are interchangeable, and any of them without `ON` is a Cartesian product; PostgreSQL refuses `JOIN` without `ON`, but the comma form is accepted everywhere. A result with suspiciously many rows, or each row repeated once per row of another table, is the symptom.

A join whose `ON` condition is true too often has the same effect in miniature — joining orders to customers on `city` instead of on the id pairs each order with every customer in the same city.

## Pitfalls

- Writing `FULL OUTER JOIN` in MySQL (a syntax error) or `FULL JOIN` (an inner join in disguise).
- Emulating it with `UNION` when real rows can be identical.
- Forgetting `COALESCE(a.key, b.key)` and showing NULL keys for one-sided rows.
- Putting the grid's filter on the sales table in `WHERE` instead of `ON` (the previous lesson's trap).
- A join with no condition, or a condition that is not a key.

## Key takeaways

- A full outer join keeps matched pairs and the unmatched rows of both sides; MySQL emulates it with `LEFT JOIN … UNION ALL …` the other side's unmatched rows.
- `UNION ALL` plus `WHERE key IS NULL` is exact; plain `UNION` can delete real duplicates.
- `CROSS JOIN` returns m × n rows: every combination.
- Cross join the dimensions, then left join the facts, to report every cell including the empty ones.
- In MySQL a `JOIN` without `ON` is a cross join — check row counts when a result looks too big.
