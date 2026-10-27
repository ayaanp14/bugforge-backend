---
title: Checkpoint — Modifying data
minutes: 25
seo-title: SQL INSERT, UPDATE and DELETE Quiz: Data Changes Practice Test
description: Test yourself: 12 questions and three scripts on INSERT, UPDATE, DELETE, TRUNCATE vs DROP, MySQL upserts, INSERT IGNORE, transactions and savepoints.
q: What is the difference between DELETE and TRUNCATE?
a: DELETE removes the rows a WHERE picks, one at a time, logs each and can be rolled back. TRUNCATE removes every row at once by recreating the table, takes no WHERE, resets AUTO_INCREMENT and in MySQL commits implicitly, so ROLLBACK cannot undo it.
q: What does REPLACE INTO do to columns you did not list?
a: It sets them to their defaults. On a duplicate key REPLACE deletes the old row and inserts the new one, so any column missing from its column list starts fresh, which is why it is wrong for counters and partial updates.
q: Why is NOT EXISTS safer than NOT IN in a DELETE?
a: If the subquery's column contains a NULL, `x NOT IN (...)` is unknown for every row and nothing is deleted, and rows whose own value is NULL are never matched. NOT EXISTS is simply true or false per row, so it behaves as intended.
---
This checkpoint covers the whole module: `INSERT` with a column list, multi-row values, defaults and `INSERT ... SELECT`; `UPDATE` with expressions, `CASE` and values from another table; `DELETE` with subqueries, the difference between DELETE, TRUNCATE and DROP, and soft deletes; upserts with `ON DUPLICATE KEY UPDATE`, `REPLACE`, `INSERT IGNORE` and the two-step form; and transactions with `COMMIT`, `ROLLBACK` and savepoints.

**How it works.** Twelve questions and three scripts. You need 70% on the questions and every script accepted to clear the module. You can retake it as often as you like; your best score counts. Each script changes data and ends with the SELECT that shows the result — the closing SELECT is already in the starter.

**Before you start**, make sure you can answer these from memory:

- What does a column left out of an INSERT receive, and does an explicit NULL give you the default?
- How do you copy rows from one table into another, and how are the columns matched?
- What does an UPDATE with a CASE and no ELSE do to the rows no branch matches?
- How do you update one table from another in portable SQL, and how does MySQL spell it with a join?
- DELETE, TRUNCATE, DROP: which takes a WHERE, which can be rolled back in MySQL, which resets AUTO_INCREMENT?
- On a duplicate key, what do `ON DUPLICATE KEY UPDATE`, `REPLACE` and `INSERT IGNORE` each do to the existing row?
- What does `ROLLBACK TO SAVEPOINT` undo, and what state is the transaction in afterwards?

The three scripts are a deduplicating import with `INSERT IGNORE`, a month-end close that updates, archives and deletes inside one transaction, and a stock sync that updates the products a delivery mentions and inserts the ones it introduces.
