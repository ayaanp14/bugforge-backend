---
title: Isolation levels and read anomalies
minutes: 16
seo-title: SQL Isolation Levels Explained: Dirty, Non-Repeatable, Phantom
description: The four SQL isolation levels and the anomalies each allows: dirty, non-repeatable and phantom reads, and why MySQL and PostgreSQL pick different defaults.
question: What are the isolation levels in SQL?
answer: The SQL standard defines four transaction isolation levels: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ and SERIALIZABLE. Each forbids more read anomalies than the one before. READ UNCOMMITTED allows dirty reads, READ COMMITTED prevents them, REPEATABLE READ also prevents non-repeatable reads, and SERIALIZABLE prevents phantoms too. MySQL's InnoDB defaults to REPEATABLE READ; PostgreSQL defaults to READ COMMITTED.
q: What is a dirty read?
a: A dirty read happens when a transaction reads a value another transaction has written but not yet committed. If the writer then rolls back, the reader has acted on data that never existed. Only READ UNCOMMITTED allows dirty reads; every other level shows only committed data.
q: What is the difference between a non-repeatable read and a phantom read?
a: A non-repeatable read is the same row read twice in one transaction returning different values, because another transaction updated and committed it in between. A phantom read is the same query returning a different set of rows, because another transaction inserted or deleted matching rows. One concerns changed rows, the other new or vanished rows.
q: What is the default isolation level in MySQL?
a: REPEATABLE READ is the default for InnoDB. Plain SELECTs in a transaction read one consistent snapshot taken at the first read, so repeated reads agree, and locking reads use next-key locks that block inserts into the scanned range. PostgreSQL, Oracle and SQL Server default to READ COMMITTED instead.
q: How do I change the isolation level in MySQL?
a: Run SET TRANSACTION ISOLATION LEVEL READ COMMITTED before START TRANSACTION to change it for the next transaction only, or SET SESSION TRANSACTION ISOLATION LEVEL to change it for the connection. SELECT @@transaction_isolation shows the current level; the old tx_isolation variable was removed in MySQL 8.0.
q: What is write skew?
a: Write skew is an anomaly where two transactions read the same data, each makes a decision from it and writes to different rows, and together they break a rule neither broke alone, such as two doctors both going off call. Snapshot-based REPEATABLE READ allows it; only SERIALIZABLE or explicit locking with SELECT ... FOR UPDATE prevents it.
---
The I in ACID promises that concurrent transactions do not interfere. Taken literally that means **serializability**: the result is the same as if the transactions had run one after another in some order. Serializable execution is expensive, so databases let you choose a weaker **isolation level** that allows specific, named anomalies in exchange for concurrency. This lesson defines the anomalies with concrete schedules, gives the standard table that maps levels to anomalies — the most-asked transaction question in interviews — and explains how MySQL's and PostgreSQL's defaults actually behave.

## Schedules

A **schedule** is the interleaved order in which steps of concurrent transactions run. The examples use two sessions, T1 and T2, on this table:

```sql
CREATE TABLE accounts (id INT PRIMARY KEY, owner VARCHAR(40), balance INT);
-- id 1, Asha, 1000
```

## Dirty read

T1 reads a value T2 has **written but not committed**.

@figure dirty-read

T1 has read a balance of 0 that never existed in any committed state. If T1 refused a loan because of it, the decision was based on fiction.

## Non-repeatable read

T1 reads the **same row twice** and gets different values, because T2 updated it and **committed** in between.

@figure non-repeatable-read

Nothing uncommitted was read, yet T1's view of the world changed under it — a report that reads the balance in two places would contradict itself.

## Phantom read

T1 runs the **same query twice** and gets a different **set of rows**, because T2 inserted (or deleted) rows that match and committed.

@figure phantom-read

No row T1 had seen changed; a new one appeared. Locking the rows you read cannot stop this, because the phantom did not exist when you read — preventing it means locking the **range**, gaps included.

## The standard table

| Isolation level | Dirty read | Non-repeatable read | Phantom read |
| --- | --- | --- | --- |
| `READ UNCOMMITTED` | possible | possible | possible |
| `READ COMMITTED` | prevented | possible | possible |
| `REPEATABLE READ` | prevented | prevented | possible (by the standard) |
| `SERIALIZABLE` | prevented | prevented | prevented |

Learn it row by row: each level forbids one more anomaly than the one above. "Possible" means the standard allows it; a particular engine may do better.

## Setting the level in MySQL

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;          -- the next transaction only
START TRANSACTION;
-- …
COMMIT;

SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ; -- this connection from now on
SELECT @@transaction_isolation;                          -- 'REPEATABLE-READ'
```

The server-wide default comes from the `transaction_isolation` system variable. (`tx_isolation` was its name until MySQL 5.7 and is gone in 8.0.)

## How InnoDB actually behaves

**`READ UNCOMMITTED`** reads the newest version of every row, committed or not. Almost never used.

**`READ COMMITTED`** gives every **statement** a fresh snapshot of committed data: no dirty reads, but two statements in one transaction can disagree. Locking reads and updates lock only the rows they touch (no gap locks), so concurrency is higher. Many teams running MySQL with row-based replication choose it.

**`REPEATABLE READ`** — the **InnoDB default** — takes one snapshot at the transaction's **first read** and uses it for every plain `SELECT` until commit. Repeated reads agree, and a repeated plain `SELECT` does not see phantoms either, because it reads the same snapshot. Locking statements (`SELECT … FOR UPDATE`, `UPDATE`, `DELETE`) work differently: they read the **latest committed** row versions and take **next-key locks** — locks on the index records *and the gaps between them* — so no other transaction can insert into the scanned range until commit. That is how InnoDB closes the phantom hole the standard leaves open for this level, for locking reads.

The mix has a famous edge: within one `REPEATABLE READ` transaction, a plain `SELECT` may say a row does not exist while an `UPDATE` of it succeeds, because the update reads the latest version, not the snapshot.

**`SERIALIZABLE`** in InnoDB is `REPEATABLE READ` plus one rule: when autocommit is off, every plain `SELECT` becomes `SELECT … FOR SHARE`, so reads take shared locks and conflicting writers wait. Correct, and much more prone to waits and deadlocks.

## PostgreSQL, for comparison

- The default is **`READ COMMITTED`**, as in Oracle and SQL Server.
- `READ UNCOMMITTED` behaves as `READ COMMITTED`: PostgreSQL never shows dirty data.
- `REPEATABLE READ` is **snapshot isolation**: no phantoms at all, and if two transactions update the same row the second fails with a serialization error that the application must retry — where InnoDB would let it overwrite the newer version.
- `SERIALIZABLE` uses **serializable snapshot isolation (SSI)**: no read locks, but it detects dangerous patterns and aborts one transaction.

## Beyond the table: lost updates and write skew

The three classic anomalies are not the whole story. Two more come up in system-design interviews:

- **Lost update**: T1 and T2 both read a stock of 10, both write `10 - 1`, and one sale disappears. Fix it with an atomic `UPDATE … SET stock = stock - 1`, a locking read (`SELECT … FOR UPDATE`), or a version check (optimistic locking, next lesson).
- **Write skew**: two doctors are on call; each transaction checks "at least one other doctor is on call" and takes itself off. Each read was valid, they wrote different rows, and now nobody is on call. Snapshot isolation allows it; `SERIALIZABLE` or locking the rows you based the decision on prevents it.

## Choosing a level

Most applications run fine on their database's default and use **explicit locking or atomic updates** for the few places that need stronger guarantees — a seat booking, a balance check. Raise the level for a whole workload only when you understand the extra waits and retries it brings.

## Practise

Concurrency cannot run on a single connection, but schedules can be stored and analysed. Both exercises read a `schedule` table — one row per step: which transaction, what action, which row, which value — and detect anomalies in SQL: the first finds dirty reads, the second non-repeatable reads.
