---
title: MVCC — how readers and writers avoid each other
minutes: 15
seo-title: What Is MVCC? Multi-Version Concurrency Control in MySQL
description: MVCC keeps old row versions so readers see a consistent snapshot without blocking writers. How InnoDB's undo log, read views and purge work, versus PostgreSQL.
question: What is MVCC in databases?
answer: MVCC, multi-version concurrency control, is the technique of keeping several versions of a row so that each transaction reads a consistent snapshot of committed data while other transactions change it. Readers never wait for writers and writers never wait for readers. MySQL's InnoDB builds old versions from its undo log; PostgreSQL stores them as separate tuples in the table.
q: How does MVCC work in InnoDB?
a: Every InnoDB row carries the id of the transaction that last changed it and a pointer to its undo record, which holds the previous version. A consistent read uses a read view listing which transactions were committed when it was created, and walks back along the undo chain until it finds a version that view may see.
q: What is a read view in MySQL?
a: A read view is the snapshot a consistent read uses: the transaction ids that were still active when it was created and the next id to be assigned. A row version is visible if its creating transaction committed before the view was made. Under REPEATABLE READ a transaction keeps one read view; under READ COMMITTED each statement gets a new one.
q: Why are long-running transactions bad for MySQL?
a: An open transaction's read view may still need old row versions, so InnoDB's purge thread cannot discard any undo record newer than the oldest active view. Undo logs grow, the history list length rises, reads slow down walking long version chains, and disk use climbs. Commit promptly, and never leave a session idle inside a transaction.
q: How is MVCC in PostgreSQL different from MySQL?
a: PostgreSQL writes a new tuple for every updated row in the table itself, marking versions with xmin and xmax transaction ids, and the old tuples stay until VACUUM removes them. InnoDB updates the row in place and keeps the old version in the undo log, which a purge thread cleans. Both give readers snapshots without locks.
---
If every write took locks that blocked readers, a busy table would spend its life waiting: a report scanning the orders table would stall every checkout, and every checkout would stall the report. Modern databases avoid that with **multi-version concurrency control (MVCC)**: a change creates a new version of the row while the old one is kept for transactions that should still see it. Readers read a **snapshot**; writers write new versions; neither waits for the other. This lesson explains how InnoDB stores versions, how a read decides which version it may see, how isolation levels map onto snapshots, and why long transactions hurt.

## The idea in one picture

@figure snapshot

T1 never waits for T2's lock and never sees T2's change: it keeps reading version 1, because version 2 did not exist — committed — when T1's snapshot was taken. T2 never waits for T1 either. Only two **writers** to the same row conflict, and they are ordered by locks.

## How InnoDB stores versions

Each row in the clustered index carries hidden system columns:

- `DB_TRX_ID` (6 bytes) — the id of the transaction that last inserted or updated it;
- `DB_ROLL_PTR` (7 bytes) — a pointer to an **undo log record** holding what the row looked like before that change;
- `DB_ROW_ID` — the hidden row id, used only when the table has no suitable key.

An `UPDATE` changes the row **in place** and writes the previous values to the undo log, linked by the roll pointer. Repeated updates form a **version chain**: newest in the table, older ones reachable record by record through the undo log. A `DELETE` does not remove the row at once; it sets a delete mark, and the row is physically removed later.

The same undo records serve two purposes: `ROLLBACK` uses them to restore rows (atomicity), and consistent reads use them to rebuild old versions (isolation).

## Read views: which version may I see?

A consistent read (any plain `SELECT` under `READ COMMITTED` or `REPEATABLE READ`) uses a **read view**, created from the state of the transaction system at that moment:

- the list of transaction ids that are **active** (started, not committed);
- the lowest active id, and the next id to be assigned.

To read a row, InnoDB compares the row's `DB_TRX_ID` with the view:

1. created by this transaction itself → visible;
2. created by a transaction that had **committed** before the view was made → visible;
3. created by a transaction still active at that time, or started after → **not visible**: follow `DB_ROLL_PTR` to the previous version and test again.

If the walk reaches a version that did not exist yet (the row was inserted after the snapshot), the row is simply absent from this reader's result. A delete-marked version that is visible means the row is deleted for this reader.

## Isolation levels are snapshot timing

MVCC is how InnoDB implements the two levels you meet most:

| Level | When the read view is created |
| --- | --- |
| `READ COMMITTED` | at the start of **every statement** — each sees the latest committed data |
| `REPEATABLE READ` | at the **first consistent read** of the transaction, then reused until commit |

That is the whole difference between them for plain reads. `START TRANSACTION WITH CONSISTENT SNAPSHOT` creates the view immediately rather than at the first read — `mysqldump --single-transaction` uses it to take a consistent backup of a live database without locking it.

Remember the boundary from the isolation lesson: MVCC covers **plain** reads. `UPDATE`, `DELETE` and `SELECT … FOR UPDATE` read the **latest committed** version and lock it, because changing an old version would lose someone's committed write.

## Purge: cleaning up old versions

Old versions cannot be kept forever. InnoDB's background **purge** threads discard undo records — and physically remove delete-marked rows — once **no read view could still need them**: when the version has been superseded by a newer one committed before the **oldest active read view** was created.

That rule is why one idle transaction can hurt a whole server:

```sql
-- session A, at 09:00
START TRANSACTION;
SELECT COUNT(*) FROM orders;      -- read view created
-- …the developer goes to lunch, the session stays open
```

Until session A ends, purge cannot remove any version newer than its view. Every update made since 09:00 leaves undo records behind; the **history list length** (shown in `SHOW ENGINE INNODB STATUS`) climbs; queries that need an old snapshot walk ever-longer chains; and the undo tablespaces grow. Monitoring old entries in `information_schema.INNODB_TRX` and killing forgotten sessions is a routine DBA task.

## PostgreSQL does it differently

PostgreSQL also uses MVCC, with a different layout:

- an `UPDATE` writes a **new tuple** in the table and marks the old one dead, using hidden `xmin`/`xmax` transaction ids on each tuple;
- old tuples stay in the table pages until **VACUUM** (usually autovacuum) reclaims them — the counterpart of InnoDB's purge;
- a table with heavy updates and lagging vacuum suffers **bloat**, the counterpart of a long undo history;
- `REPEATABLE READ` there is snapshot isolation: a concurrent update to a row you also update raises a serialization error rather than waiting and applying on the newer version as InnoDB does.

Oracle keeps old versions in undo segments, closer to InnoDB; a query that needs a version already overwritten fails with the famous "snapshot too old" error.

## What MVCC does not solve

- **Write–write conflicts** still need locks: two transactions updating the same row are serialised.
- **Lost updates** in read-modify-write code: both read version 1 and both write — use an atomic update, `FOR UPDATE` or a version column.
- **Write skew**: two snapshots, two different rows written, an invariant broken.

MVCC makes reads cheap and non-blocking; correctness for writes still comes from locks, constraints and careful transactions.

## Practise

The exercises model InnoDB's bookkeeping in tables. The first computes what each snapshot sees — the newest version of each row created by a transaction committed before the snapshot, with deleted rows left out. The second plays purge: given the oldest active snapshot, it lists the old versions no reader can still need.
