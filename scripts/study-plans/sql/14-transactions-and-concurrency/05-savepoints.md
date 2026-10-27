---
title: Savepoints — partial rollback inside a transaction
minutes: 13
seo-title: SQL SAVEPOINT and ROLLBACK TO SAVEPOINT in MySQL
description: A savepoint marks a point inside a transaction you can roll back to without abandoning it. SAVEPOINT, ROLLBACK TO and RELEASE in MySQL, nesting rules and uses.
question: What is a savepoint in SQL?
answer: A savepoint is a named marker inside a transaction. ROLLBACK TO SAVEPOINT name undoes every change made after that marker while keeping the earlier changes and leaving the transaction open, so it can continue and later COMMIT. In MySQL you create one with SAVEPOINT name and remove it with RELEASE SAVEPOINT name; COMMIT and ROLLBACK discard all savepoints.
q: What is the difference between ROLLBACK and ROLLBACK TO SAVEPOINT?
a: ROLLBACK undoes the entire transaction and ends it. ROLLBACK TO SAVEPOINT name undoes only the changes made after that savepoint, keeps everything before it, and leaves the transaction open for more statements. The savepoint itself survives, so you can roll back to it again.
q: What happens to later savepoints when you roll back to an earlier one?
a: They are deleted. Savepoints form a stack: rolling back to savepoint a discards every savepoint created after a, along with the changes made after a. Savepoint a itself remains. RELEASE SAVEPOINT a also removes a and every savepoint created after it, but keeps their changes.
q: Does ROLLBACK TO SAVEPOINT release locks in MySQL?
a: Mostly not. InnoDB undoes the changed rows but keeps the row locks taken after the savepoint until the transaction ends; only locks on rows inserted after the savepoint go away with the undo. Other sessions may therefore still wait on those rows until you COMMIT or ROLLBACK.
q: How are savepoints used for nested transactions?
a: Databases do not nest real transactions, so frameworks emulate them with savepoints. When code that already runs in a transaction starts an inner one, the framework issues SAVEPOINT, then RELEASE SAVEPOINT on success or ROLLBACK TO SAVEPOINT on failure, so the inner work can fail without losing the outer work.
---
A transaction is all or nothing — until it is not convenient to be. A batch import where one record out of hundreds is bad, a checkout where the optional gift-wrap step fails, a framework that lets one service method call another inside the same transaction: in each case you want to undo **part** of the work and keep going. **Savepoints** give a transaction internal checkpoints. This lesson covers the three statements, how savepoints stack, how they interact with locks and errors in MySQL and PostgreSQL, and where they are used for real.

## The three statements

```sql
START TRANSACTION;

INSERT INTO order_lines (order_id, sku, qty) VALUES (501, 'PEN-BLK', 10);
SAVEPOINT after_pens;

INSERT INTO order_lines (order_id, sku, qty) VALUES (501, 'INK-BLU', 500);   -- wrong quantity
ROLLBACK TO SAVEPOINT after_pens;      -- undo the ink line only

INSERT INTO order_lines (order_id, sku, qty) VALUES (501, 'INK-BLU', 5);
COMMIT;                                -- pens and 5 ink cartridges are saved
```

- `SAVEPOINT name` marks the current point. Reusing a name moves the mark: the old savepoint of that name is replaced.
- `ROLLBACK TO [SAVEPOINT] name` undoes every change made after the mark. The transaction stays open, and the savepoint stays too, so you can roll back to it again.
- `RELEASE SAVEPOINT name` removes the mark and keeps the changes. It is bookkeeping, not a commit: nothing is durable until the transaction's `COMMIT`.

`COMMIT` and a full `ROLLBACK` end the transaction and delete every savepoint.

## Savepoints stack

Savepoints form a stack in the order they were created:

```sql
START TRANSACTION;
UPDATE stock SET qty = qty - 1 WHERE sku = 'A';    -- change 1
SAVEPOINT s1;
UPDATE stock SET qty = qty - 1 WHERE sku = 'B';    -- change 2
SAVEPOINT s2;
UPDATE stock SET qty = qty - 1 WHERE sku = 'C';    -- change 3

ROLLBACK TO SAVEPOINT s1;   -- undoes changes 2 and 3; s2 no longer exists
-- ROLLBACK TO SAVEPOINT s2;   would now fail: SAVEPOINT s2 does not exist
COMMIT;                     -- keeps change 1 only
```

Rolling back to an earlier savepoint destroys every later one. `RELEASE SAVEPOINT s1` would likewise remove `s1` and `s2` — but keep all three changes.

## A rollback to a savepoint is not a full rollback

Three behaviours to know for MySQL's InnoDB:

- **Locks are kept.** Row locks taken after the savepoint stay until the transaction ends, even though the changes are undone (locks on rows *inserted* after the savepoint disappear with the undo). Another session waiting on those rows keeps waiting.
- **The transaction is still yours to finish.** Forgetting the final `COMMIT` loses everything, including the work before the savepoint.
- **Implicit commits erase savepoints.** A DDL statement such as `CREATE TABLE` commits the transaction and with it every savepoint.

## Savepoints and errors

How an error inside a transaction behaves is where MySQL and PostgreSQL differ most, and where savepoints matter most.

**MySQL.** A failing statement — a duplicate key, a `CHECK` violation — is rolled back on its own; the transaction stays open with its earlier changes, and the application decides what to do next. A savepoint lets you undo a whole *group* of statements that turned out wrong, not just the last one.

**PostgreSQL.** Any error **aborts** the transaction: every further statement fails with `current transaction is aborted, commands ignored until end of transaction block`. The only ways out are `ROLLBACK`, or `ROLLBACK TO SAVEPOINT` if one was set before the error. That is why PostgreSQL drivers offer an "autosave" mode that silently sets a savepoint before each statement, and why bulk loaders there set one per record:

```sql
-- PostgreSQL, per-record recovery
BEGIN;
SAVEPOINT rec;
INSERT INTO customers VALUES (…);      -- fails on a duplicate
ROLLBACK TO SAVEPOINT rec;             -- the transaction is usable again
SAVEPOINT rec;
INSERT INTO customers VALUES (…);      -- the next record
…
COMMIT;
```

## Where savepoints are used

- **Nested transactions in frameworks.** Databases do not nest transactions. When a service method marked transactional calls another inside an existing transaction with "nested" propagation — Spring's `Propagation.NESTED`, Django's nested `atomic()` blocks, SQLAlchemy's `begin_nested()` — the framework issues `SAVEPOINT`, then `RELEASE SAVEPOINT` on success or `ROLLBACK TO SAVEPOINT` on an exception. The inner failure is contained; the outer work survives.
- **Batch jobs.** Process records in a transaction, setting a savepoint before each chunk; a bad chunk is rolled back and logged without losing the good ones.
- **Optional steps.** Apply a coupon or reserve a gift wrap after a savepoint; if the step is refused, roll back to it and complete the order without it.
- **Testing.** Test suites wrap each test in a transaction, and savepoints let a test that itself uses transactions run inside it.

## Cost and limits

Savepoints are cheap — a marker in the undo log — but not free: a transaction with thousands of open savepoints carries their bookkeeping until it ends, so release the ones you are done with in long loops. And a savepoint never shortens a transaction: everything from `START TRANSACTION` onward still holds its locks and its read view until the end.

## Practise

Both exercises are scripts with a mistake in the middle that a savepoint undoes. The first fixes one wrong order line without losing the good ones; the second applies stock adjustments behind savepoints, rolls back to an earlier one — discarding the later savepoint with it — and records the adjustments that survived.
