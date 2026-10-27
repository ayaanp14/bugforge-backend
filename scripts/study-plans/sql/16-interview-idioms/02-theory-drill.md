---
title: The SQL theory drill — the questions asked without a keyboard
minutes: 18
seo-title: SQL Theory Interview Questions: WHERE vs HAVING, ACID, Keys
description: Short answers to SQL theory questions: WHERE vs HAVING, DELETE vs TRUNCATE vs DROP, UNION vs UNION ALL, keys, normal forms, indexes, ACID and ranking.
question: What SQL theory questions are asked in interviews?
answer: SQL theory interviews ask the difference between WHERE and HAVING, DELETE, TRUNCATE and DROP, UNION and UNION ALL, primary, foreign and unique keys, the first three normal forms, what an index is and when it is not used, the ACID properties, the logical order in which a query's clauses run, and RANK versus DENSE_RANK versus ROW_NUMBER. Each has a short answer an interviewer expects.
q: What is the difference between WHERE and HAVING?
a: WHERE filters individual rows before they are grouped, so it cannot use aggregate functions. HAVING filters groups after GROUP BY has formed them, so it can test aggregates such as `COUNT(*) > 1`. A condition on a plain column belongs in WHERE, where it also reduces the rows that must be grouped.
q: What is the difference between DELETE, TRUNCATE and DROP?
a: DELETE removes the rows that match a WHERE clause, one by one, and can be rolled back. TRUNCATE removes every row by recreating the table, resets AUTO_INCREMENT, fires no triggers and in MySQL commits implicitly. DROP removes the table itself, structure and data.
q: What is the logical order of execution of a SQL query?
a: FROM and JOINs first, then WHERE, GROUP BY, HAVING, the SELECT list with window functions, DISTINCT, ORDER BY, and finally LIMIT. That is why a column alias from SELECT cannot be used in WHERE but can be used in ORDER BY.
q: What is the difference between RANK, DENSE_RANK and ROW_NUMBER?
a: For the values 100, 90, 90, 80, ROW_NUMBER gives 1, 2, 3, 4, numbering every row uniquely; RANK gives 1, 2, 2, 4, sharing ties and leaving a gap; DENSE_RANK gives 1, 2, 2, 3, sharing ties with no gap.
q: What does ACID stand for?
a: Atomicity, Consistency, Isolation and Durability. A transaction happens completely or not at all, moves the database between valid states, does not see other transactions' unfinished work beyond what its isolation level allows, and once committed survives a crash.
---
Part of every SQL interview happens without a keyboard. "What is the difference between WHERE and HAVING?" "Why would you use TRUNCATE instead of DELETE?" "What does ACID mean?" These are not trick questions; they have short, standard answers, and an interviewer listens for the precise sentence and for one supporting detail that shows you have used the thing. This lesson is the drill: each question, the answer to give, and the detail that makes it convincing. The quiz and the two exercises then make you use the two answers that are easiest to get wrong.

## WHERE vs HAVING

**WHERE filters rows before grouping; HAVING filters groups after.** WHERE cannot contain an aggregate, because no groups exist yet; HAVING can. The detail: a condition on a plain column *can* be written in HAVING (MySQL allows it), but it belongs in WHERE, where it shrinks the input before the expensive grouping. A query can use both: `WHERE amount > 100` keeps the large orders, `GROUP BY customer_id`, `HAVING COUNT(*) >= 2` keeps customers with at least two of them.

## The logical order of a query

A SELECT is written in one order and evaluated in another:

```text
FROM / JOIN  →  WHERE  →  GROUP BY  →  HAVING  →  SELECT (and window functions)
             →  DISTINCT  →  ORDER BY  →  LIMIT / OFFSET
```

This explains a whole family of questions. A SELECT alias cannot be used in WHERE (WHERE runs first) but can in ORDER BY (which runs after). A window function cannot be filtered in WHERE — compute it in a subquery or CTE and filter outside. `ORDER BY` can sort by a column not in the SELECT list, except after `DISTINCT`. (MySQL bends the rule by letting HAVING see SELECT aliases; that is a MySQL extension, not the standard.) This is the *logical* order; the optimiser may physically execute things differently as long as the result is the same.

## DELETE vs TRUNCATE vs DROP

| | DELETE | TRUNCATE | DROP |
| --- | --- | --- | --- |
| Removes | matching rows | every row | the table |
| WHERE | yes | no | no |
| Rolled back | yes, in a transaction | no in MySQL (implicit commit) | no in MySQL |
| AUTO_INCREMENT | kept | reset | gone |
| Triggers | fire per row | do not fire | do not fire |
| Speed on a big table | slow, logged per row | fast | fast |

The detail: TRUNCATE is DDL in MySQL — it drops and recreates the table, which is why it is fast, resets the counter, and cannot be undone inside a transaction. It also fails on a table referenced by a foreign key. (PostgreSQL's TRUNCATE, unlike MySQL's, is transactional — a good point to mention if the interviewer works across databases.)

## UNION vs UNION ALL

**UNION removes duplicate rows from the combined result; UNION ALL keeps them all.** UNION therefore sorts or hashes the whole result, so UNION ALL is faster and is the right choice whenever duplicates are impossible or wanted. Both require the same number of columns with compatible types, and take the column names from the first SELECT. INTERSECT and EXCEPT (MySQL 8.0.31+) complete the set operations.

## Keys

- A **primary key** uniquely identifies each row; it is unique and NOT NULL, and a table has at most one (possibly over several columns — a composite key). In InnoDB it is also the clustered index: the table's rows are stored in primary-key order.
- A **unique key** also forbids duplicates, but a table can have several, and in MySQL a unique column may hold many NULLs.
- A **foreign key** makes a column refer to a primary or unique key of another table; the database refuses orphans and can cascade deletes or updates (`ON DELETE CASCADE`).
- A **candidate key** is any minimal set of columns that could be the primary key; a **surrogate key** is an invented id (AUTO_INCREMENT) as opposed to a **natural key** from the data (an email, an ISBN).

## Normal forms

- **1NF**: every column holds one atomic value — no lists in a cell, no repeating groups (`phone1, phone2, phone3`).
- **2NF**: 1NF, and no column depends on only *part* of a composite key. In `order_items(order_id, product_id, product_name, qty)`, `product_name` depends on `product_id` alone — move it to `products`.
- **3NF**: 2NF, and no column depends on another non-key column. `employees(id, dept_id, dept_name)` stores `dept_name` through `dept_id` — move it to `departments`.
- **BCNF** tightens 3NF: every determinant must be a candidate key.

The detail: normalisation removes update anomalies (change a department's name in one place, not in every employee row); **denormalisation** deliberately reintroduces redundancy for read speed — reporting tables, cached counters — and accepts the cost of keeping copies in sync.

## Indexes

An index is a separate, sorted structure — a B-tree in InnoDB — that lets the database find rows by a column's value without reading the whole table. It speeds up reads that filter, join or sort on its columns and slows down writes, which must maintain it. The details interviewers probe:

- A **composite index** on `(a, b, c)` serves filters on `a`, on `a, b`, and on `a, b, c` — the *leftmost prefix* rule — but not on `b` alone.
- An index is not used when the column is wrapped in a function (`WHERE YEAR(created) = 2024`) or compared after an implicit conversion; rewrite it as a range (`created >= '2024-01-01' AND created < '2025-01-01'`) — a **sargable** condition.
- A **covering index** holds every column the query needs, so the table itself is never read.
- A **clustered** index stores the rows themselves (InnoDB's primary key); a **secondary** index stores the key plus the primary key.
- Low-selectivity columns (a yes/no flag) rarely benefit; `EXPLAIN` shows whether an index is used.

## ACID and isolation

**Atomicity**: all of a transaction's changes happen, or none. **Consistency**: it takes the database from one valid state to another — constraints hold. **Isolation**: concurrent transactions do not see each other's uncommitted work, to the degree the isolation level promises. **Durability**: once committed, the change survives a crash (InnoDB's redo log).

The four isolation levels, weakest first, are READ UNCOMMITTED (dirty reads possible), READ COMMITTED (no dirty reads, but a re-read can change), REPEATABLE READ (MySQL InnoDB's default — re-reads see the same snapshot) and SERIALIZABLE. The anomalies they prevent are dirty reads, non-repeatable reads and phantom reads.

## RANK vs DENSE_RANK vs ROW_NUMBER

For scores 100, 90, 90, 80 in descending order:

```text
score | ROW_NUMBER | RANK | DENSE_RANK
100   | 1          | 1    | 1
90    | 2          | 2    | 2
90    | 3          | 2    | 2
80    | 4          | 4    | 3
```

ROW_NUMBER is unique per row (and arbitrary between ties unless the ORDER BY breaks them); RANK shares ties and skips the following numbers, like a sports table; DENSE_RANK shares ties and skips nothing. The detail: "top three per group" questions hinge on which one is meant.

## A few more, quickly

- **CHAR vs VARCHAR**: fixed length, padded with spaces, versus variable length with a length prefix.
- **A view** is a stored query; it holds no data (MySQL has no materialised views).
- **COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col)**: rows; non-NULL values; distinct non-NULL values.
- **A correlated subquery** refers to the outer query's row and is evaluated per row.
- **INNER vs LEFT JOIN**: only matches, versus every left row with NULLs where nothing matched.
- **A stored procedure** is server-side code called with `CALL`; a **trigger** runs automatically on INSERT, UPDATE or DELETE.

Say each answer in one sentence, then add the detail. That rhythm — definition, then proof of use — is what a theory round is listening for.
