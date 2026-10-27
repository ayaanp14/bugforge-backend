---
title: Checkpoint — Transactions and concurrency
minutes: 25
seo-title: SQL Transactions Quiz: ACID, Isolation Levels and Locking
description: Test yourself: 12 questions and three SQL tasks on ACID, isolation levels and their anomalies, InnoDB locks and deadlocks, MVCC snapshots and savepoints.
q: Which anomalies does each SQL isolation level allow?
a: READ UNCOMMITTED allows dirty reads, non-repeatable reads and phantoms. READ COMMITTED prevents dirty reads but allows the other two. REPEATABLE READ also prevents non-repeatable reads and, by the standard, allows phantoms, although InnoDB blocks them for locking reads with next-key locks. SERIALIZABLE prevents all three.
q: How does optimistic locking detect a conflicting update?
a: Each row carries a version number. The application reads it, then updates with WHERE id = ? AND version = the value read, incrementing the version in the same statement. If another transaction changed the row first, the version no longer matches, the update changes zero rows, and the application reloads and retries.
q: What does MySQL do when it detects a deadlock?
a: InnoDB rolls back one transaction of the cycle, the one it judges smallest by rows inserted, updated or deleted, with error 1213, and the other transactions continue. The application should retry the rolled-back transaction, which is safe because none of its changes were kept.
---
This checkpoint covers the whole module: transactions and the four ACID properties with the InnoDB machinery behind each, autocommit and implicit commits, the isolation levels and the dirty, non-repeatable and phantom reads they allow, lost updates and write skew, shared and exclusive row locks, locking reads, gap and next-key locks, lock waits and deadlocks, optimistic locking, MVCC with undo logs, read views and purge, and savepoints.

**How it works.** Twelve questions and three SQL tasks. You need 70% on the questions and every task accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does each letter of ACID guarantee, and which InnoDB log provides atomicity and which durability?
- Why does `CREATE TABLE` inside a MySQL transaction make a later `ROLLBACK` useless?
- Draw the isolation-level table: four levels, three anomalies.
- What is InnoDB's default isolation level, and PostgreSQL's?
- What do `SELECT … FOR UPDATE`, `FOR SHARE` and `SKIP LOCKED` do?
- What is a next-key lock, and which anomaly does it prevent?
- How does InnoDB break a deadlock, and what should the application do about it?
- When does a `REPEATABLE READ` transaction create its read view, and why does a forgotten open transaction grow the undo history?
- What happens to later savepoints when you roll back to an earlier one?

The three tasks: a transfer that also charges a fee, where the fee is undone with a savepoint before the commit; an optimistic-locking update in which a stale second writer changes nothing; and a lock-wait report that ranks the blocking transactions by how many sessions wait on them and for how long.
