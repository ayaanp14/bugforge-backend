---
title: Locks and deadlocks
minutes: 16
seo-title: MySQL Locking and Deadlocks: Row Locks, Gap Locks, FOR UPDATE
description: How InnoDB locks rows: shared and exclusive locks, gap and next-key locks, SELECT FOR UPDATE, SKIP LOCKED, lock waits, and how deadlocks are caught and avoided.
question: What is a deadlock in a database?
answer: A deadlock is a cycle of transactions each waiting for a lock another one holds, so none can ever proceed. For example, T1 locks row A and waits for row B while T2 locks row B and waits for row A. MySQL's InnoDB detects the cycle immediately, rolls back the transaction it judges cheapest to undo with error 1213, and lets the other continue.
q: What does SELECT ... FOR UPDATE do?
a: SELECT ... FOR UPDATE is a locking read: it reads the latest committed version of the matching rows and puts exclusive locks on them until the transaction ends. Other transactions that try to update, delete or lock those rows wait. Use it when you read a value and then write based on it, such as checking a balance before a debit.
q: What is a gap lock in MySQL?
a: A gap lock locks the space between index records, not a record, so no other transaction can insert a new row into that gap. Combined with a record lock it forms a next-key lock, which InnoDB uses under REPEATABLE READ for locking reads and updates to prevent phantom rows. READ COMMITTED does not use gap locks except for foreign key and duplicate checks.
q: What is the difference between optimistic and pessimistic locking?
a: Pessimistic locking locks rows before changing them, typically with SELECT ... FOR UPDATE, assuming conflicts are likely. Optimistic locking takes no lock: it reads a version number and updates with WHERE version = the value read, and if zero rows change, someone else won and the application retries. Optimistic suits rare conflicts; pessimistic suits hot rows.
q: How do you avoid deadlocks in MySQL?
a: Make transactions touch rows in the same order everywhere, for instance always the lower account id first, keep transactions short, index the columns in WHERE clauses so statements lock fewer rows, and lock what you need up front with SELECT ... FOR UPDATE. Deadlocks can still happen, so the application should retry a transaction that fails with error 1213.
q: What is the difference between a lock wait timeout and a deadlock?
a: A deadlock is a cycle that can never resolve, so InnoDB detects it and rolls back a victim at once with error 1213. A lock wait timeout is a plain wait that lasted longer than innodb_lock_wait_timeout, 50 seconds by default, and by default rolls back only the waiting statement with error 1205, not the whole transaction.
---
MVCC lets readers and writers stay out of each other's way, but two **writers** to the same row must take turns, and some readers need to block writers too. That is the job of **locks**. Most of the time they are invisible; then one day a checkout page hangs for fifty seconds, or the logs fill with `Deadlock found when trying to get lock`. This lesson covers InnoDB's lock types, locking reads, what a lock wait and a deadlock look like, how InnoDB breaks a deadlock, and the habits that keep both rare — plus the optimistic alternative to locking at all.

## Shared and exclusive row locks

InnoDB locks **rows** (precisely: index records), not whole tables, for ordinary DML.

- A **shared (S) lock** lets the holder read the row; other transactions may also take S locks but not X.
- An **exclusive (X) lock** lets the holder change the row; nobody else can take S or X on it.

| Held \ Requested | S | X |
| --- | --- | --- |
| S | granted | waits |
| X | waits | waits |

`UPDATE` and `DELETE` take X locks on every row they change, held until `COMMIT` or `ROLLBACK`. Plain `SELECT` takes **no** locks under the default isolation levels — it reads a snapshot (the next lesson). Table-level **intention locks** (IS, IX) are taken automatically to say "this transaction holds row locks in here", so that a `LOCK TABLES` or DDL knows to wait.

## Locking reads

When you read a value in order to write based on it, a snapshot read is not enough — another transaction could change the row after you read it. Ask for a lock while reading:

```sql
START TRANSACTION;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;   -- X lock on row 1
-- application checks balance >= 500
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
COMMIT;
```

- `FOR UPDATE` takes X locks: others cannot change or lock the rows until you finish.
- `FOR SHARE` (MySQL 8; `LOCK IN SHARE MODE` before) takes S locks: others can read-lock but not change them — useful for "this parent row must still exist when I insert the child".
- `NOWAIT` fails at once instead of waiting if a row is locked.
- `SKIP LOCKED` skips locked rows — the standard way to build a job queue where several workers each grab a different pending job:

```sql
SELECT id FROM jobs
WHERE status = 'pending'
ORDER BY id
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

## Gap locks and next-key locks

Locking existing rows cannot stop a **new** row being inserted into the range you queried — the phantom problem. Under `REPEATABLE READ`, InnoDB's locking reads and updates therefore lock **gaps** too:

- a **record lock** locks one index record;
- a **gap lock** locks the open interval between two index records, so nothing can be inserted there;
- a **next-key lock** is a record lock plus the gap before it — the default for range scans under `REPEATABLE READ`;
- an **insert intention lock** is the gap-level lock an `INSERT` takes; it waits behind another transaction's gap lock.

```sql
-- REPEATABLE READ; index on age; existing ages 20, 30, 40
SELECT * FROM members WHERE age BETWEEN 25 AND 35 FOR UPDATE;
-- locks record 30 and the gaps (20, 30) and (30, 40):
-- another session's INSERT of age 27 or 33 now waits
```

An equality lookup on a **unique** index for a row that exists locks only that record — no gap. Under `READ COMMITTED`, gap locking is disabled for searches, which is one reason it has fewer deadlocks.

## Locks follow the index

InnoDB locks the index records a statement **scans**, not just the rows it finally changes. Without a usable index:

```sql
UPDATE orders SET status = 'cancelled' WHERE customer_email = 'x@y.com';
-- no index on customer_email: every row is scanned, and under
-- REPEATABLE READ every row (and gap) is locked until commit
```

One missing index can turn a one-row update into a table-wide lock. Indexing the `WHERE` columns of your updates is a concurrency fix, not just a speed fix.

## Lock waits

When a lock is unavailable, the transaction **waits**. If it waits longer than `innodb_lock_wait_timeout` (50 seconds by default), the statement fails with **error 1205**, `Lock wait timeout exceeded; try restarting transaction`. By default only that statement is rolled back, not the whole transaction (`innodb_rollback_on_timeout` changes that).

To see who blocks whom in MySQL 8, query `performance_schema.data_locks` and `performance_schema.data_lock_waits`, or the friendlier `sys.innodb_lock_waits` view, which pairs each waiting transaction with its blocker. The usual culprit is a transaction someone left open.

## Deadlocks

A **deadlock** is a cycle of waits:

@figure deadlock

Neither can ever proceed. InnoDB's **deadlock detector** (on by default, `innodb_deadlock_detect`) builds the **wait-for graph** — an edge from each waiting transaction to the transaction holding what it wants — and when a new wait closes a cycle it immediately picks a **victim**: the transaction it judges smallest, measured by the number of rows it has inserted, updated or deleted. The victim is **rolled back entirely** with **error 1213**, `Deadlock found when trying to get lock; try restarting transaction`, and the other transaction continues. `SHOW ENGINE INNODB STATUS` prints the latest detected deadlock, with both transactions' statements and locks; `innodb_print_all_deadlocks` writes every one to the error log.

Deadlocks are normal in a busy OLTP system. The rule is: **expect them, retry them, and make them rare**.

## Making deadlocks rare

- **Same order everywhere.** If every transfer locks the lower account id first, the cycle above cannot form.
- **Short transactions.** Fewer locks held for less time.
- **Good indexes.** Statements lock what they scan; scan less.
- **Lock up front.** `SELECT … FOR UPDATE` the rows you will change at the start, in order, rather than escalating midway.
- **Retry on 1213** in application code — the transaction was rolled back cleanly, so running it again is safe.
- Consider `READ COMMITTED` when gap locks cause the cycles.

## Optimistic locking: no lock at all

Pessimistic locking (`FOR UPDATE`) assumes conflict and blocks. **Optimistic locking** assumes conflict is rare: read a version number with the row, and make the write conditional on it.

```sql
SELECT id, price, version FROM products WHERE id = 7;      -- version = 3

UPDATE products
SET price = 549, version = version + 1
WHERE id = 7 AND version = 3;          -- 1 row changed: you won
-- 0 rows changed: someone updated it first — reload and retry, or tell the user
```

No lock is held while the user edits the form, and a lost update becomes impossible. ORMs implement exactly this (JPA's `@Version`, Rails' `lock_version`). Pessimistic wins for hot rows with frequent conflicts; optimistic wins for long think-times and rare conflicts.

## Practise

The exercises analyse a `lock_waits` table — a snapshot of who waits for whom, as `sys.innodb_lock_waits` would show it. The first finds pairs of transactions waiting on each other and names the victim InnoDB would choose; the second uses a recursive CTE to find every transaction caught in a cycle of any length.
