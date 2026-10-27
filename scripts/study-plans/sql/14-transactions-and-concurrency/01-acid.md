---
title: Transactions and ACID
minutes: 15
seo-title: What Is ACID in Databases? Transactions in MySQL Explained
description: ACID means atomicity, consistency, isolation and durability. What each guarantees in a MySQL transaction, how InnoDB keeps it, and how COMMIT and ROLLBACK work.
question: What are ACID properties in a database?
answer: ACID names the four guarantees of a database transaction. Atomicity means all its changes happen or none do. Consistency means it moves the database from one valid state to another, respecting every constraint. Isolation means concurrent transactions do not see each other's partial work. Durability means a committed change survives a crash. MySQL's InnoDB engine provides all four.
q: What is a transaction in SQL?
a: A transaction is a group of statements the database treats as one unit of work. In MySQL it starts with START TRANSACTION or BEGIN and ends with COMMIT, which makes every change permanent, or ROLLBACK, which undoes them all. Outside an explicit transaction, MySQL's autocommit mode commits each statement on its own.
q: What is the difference between atomicity and consistency?
a: Atomicity is about the transaction as a unit: either every statement's change is kept or none is, even after a crash. Consistency is about the data's rules: the transaction must leave constraints, keys and business invariants intact. Atomicity is a mechanism the engine provides; consistency also depends on the application writing correct transactions.
q: How does InnoDB guarantee durability?
a: InnoDB writes every change to its redo log before acknowledging a COMMIT and, with the default innodb_flush_log_at_trx_commit = 1, flushes that log to disk at each commit. After a crash it replays the redo log to restore committed changes and uses the undo log to roll back transactions that never committed.
q: Does a CREATE TABLE inside a transaction get rolled back in MySQL?
a: No. In MySQL, DDL statements such as CREATE, ALTER and DROP TABLE cause an implicit commit: they commit the open transaction before they run and cannot be rolled back. PostgreSQL, by contrast, has transactional DDL, so a CREATE TABLE there is undone by ROLLBACK.
q: What is autocommit in MySQL?
a: Autocommit is the session mode, on by default, in which every statement outside an explicit transaction is committed as soon as it finishes. START TRANSACTION suspends it until the next COMMIT or ROLLBACK, and SET autocommit = 0 turns it off so statements accumulate in a transaction until you commit.
---
Moving money is the example every interview uses, because it fails so visibly without transactions. Debit ₹500 from Asha, credit ₹500 to Ravi: two `UPDATE`s. If the server crashes between them, ₹500 has vanished. If another session reads the balances between them, it sees money that exists nowhere. A **transaction** groups statements into one unit of work, and the **ACID** properties are the four promises the database makes about that unit. This lesson defines each property precisely, shows how MySQL's InnoDB engine keeps it, and covers the statements that begin and end a transaction.

## A transaction in MySQL

```sql
START TRANSACTION;                                   -- or BEGIN

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
INSERT INTO transfers (from_id, to_id, amount) VALUES (1, 2, 500);

COMMIT;                                              -- make it permanent
```

Between `START TRANSACTION` and `COMMIT`, the changes are visible to this session but not yet to others, and they can still be abandoned:

```sql
START TRANSACTION;
DELETE FROM accounts;          -- a mistake
ROLLBACK;                      -- every row is back
```

**Autocommit.** MySQL starts every session with `autocommit = 1`: a statement written outside `START TRANSACTION` is a transaction of its own, committed the moment it finishes. That is why a bare `UPDATE` in a client is permanent immediately. `SET autocommit = 0;` makes every statement join an open transaction until you `COMMIT` — common in some drivers' defaults, and a source of "my changes disappeared" when the connection closes without one.

## A is for atomicity

**All or nothing.** Either every change in the transaction is applied, or none is — whether the transaction ends with `ROLLBACK`, the client disconnects, or the server crashes halfway.

InnoDB implements it with the **undo log**: before changing a row, it records how to put the row back. `ROLLBACK` replays the undo records in reverse; crash recovery does the same for every transaction that was still open.

One MySQL subtlety interviewers probe: when a single statement inside a transaction fails — a duplicate key, say — InnoDB rolls back **that statement**, not the whole transaction. The transaction stays open, and it is your code's job to decide whether to `ROLLBACK` or carry on. (A deadlock is different: it rolls back the entire transaction.) PostgreSQL is stricter: after any error the transaction is aborted and refuses further statements until `ROLLBACK`.

## C is for consistency

**Valid state to valid state.** A transaction starts from data that satisfies every rule and must leave data that does — primary and unique keys, `NOT NULL`, `CHECK` constraints (enforced since MySQL 8.0.16), foreign keys, and the business invariants no constraint can express, such as "the sum of all balances does not change during a transfer".

Consistency is the odd one out: the database enforces the declared constraints, but only the application can make sure each transaction is a correct transformation. If your transfer debits ₹500 and credits ₹50, ACID will faithfully and durably preserve the bug. Atomicity and isolation exist largely so that correct transactions stay correct under crashes and concurrency.

```sql
CREATE TABLE accounts (
  id      INT PRIMARY KEY,
  owner   VARCHAR(40) NOT NULL,
  balance INT NOT NULL CHECK (balance >= 0)
);
-- a debit that would overdraw now fails, and with it, if the
-- application rolls back, the whole transfer
```

## I is for isolation

**Concurrent transactions do not see each other's partial work.** Ideally each transaction behaves as if it ran alone. In practice, perfect isolation (serializability) costs throughput, so SQL defines **isolation levels** that allow certain anomalies in exchange for speed. InnoDB's default is `REPEATABLE READ`; PostgreSQL's and SQL Server's is `READ COMMITTED`. InnoDB implements isolation with **MVCC** (multi-version concurrency control: readers see a snapshot built from undo records) and **locks** for writers. Both get a lesson of their own in this module.

## D is for durability

**Committed means committed.** Once `COMMIT` returns, the change survives a crash, a power cut or a restart.

InnoDB uses **write-ahead logging**: each change is written to the **redo log** before the data pages themselves, and at commit the log is flushed to disk. Data pages are written back to the tablespace later, in the background. After a crash, recovery replays the redo log to redo committed work and the undo log to remove uncommitted work. The **doublewrite buffer** protects against a page being half-written during a crash.

The setting behind the promise is `innodb_flush_log_at_trx_commit`:

| Value | At each commit | Can lose on a crash |
| --- | --- | --- |
| `1` (default) | write and flush the redo log | nothing committed |
| `2` | write to the OS, flush about once a second | about a second, on an OS crash or power loss |
| `0` | nothing; write and flush about once a second | about a second, even if only mysqld crashes |

Teams sometimes trade durability for write speed with `2`; knowing exactly what is traded is the point. With replication, `sync_binlog = 1` gives the binary log the same promise.

## DDL commits implicitly in MySQL

A trap for anyone coming from PostgreSQL: in MySQL, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, `TRUNCATE TABLE`, `CREATE INDEX` and similar statements cause an **implicit commit** — they commit the open transaction before running, and they cannot be rolled back.

```sql
START TRANSACTION;
UPDATE accounts SET balance = 0 WHERE id = 1;
CREATE TABLE audit_copy (id INT);    -- implicit COMMIT: the UPDATE is now permanent
ROLLBACK;                            -- undoes nothing
```

PostgreSQL has **transactional DDL**, so the same script there rolls back both the update and the new table. Migration tools rely on that in PostgreSQL and cannot in MySQL.

## Keep transactions short

A transaction holds locks on the rows it changed until it ends, and an old open transaction stops InnoDB from discarding old row versions (you will see why in the MVCC lesson). So:

- do the slow work — calling a payment API, rendering a page, waiting for a user — **outside** the transaction;
- touch rows in a consistent order across code paths;
- commit as soon as the unit of work is complete.

## Practise

The exercise engine runs one connection, so isolation cannot be shown here, but atomic units of work can. The first exercise moves money between two accounts inside a transaction and records the transfer; the second places an order, its items and the stock movements as one unit.
