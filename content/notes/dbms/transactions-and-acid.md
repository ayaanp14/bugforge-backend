---
title: Transactions and ACID Properties in DBMS
order: 9
minutes: 12
level: intermediate
updated: 2026-10-05
seo-title: ACID Properties in DBMS: Transactions Explained
description: What a transaction is, its states, and each ACID property on a bank transfer, with how a DBMS provides it: logs, recovery, locking, savepoints and WAL.
question: What are the ACID properties of a transaction?
answer: ACID names four guarantees a DBMS gives a transaction. Atomicity: all of its changes happen or none do. Consistency: it takes the database from one valid state to another. Isolation: concurrent transactions do not see each other's partial work. Durability: once committed, its changes survive crashes. Logs and recovery provide atomicity and durability; concurrency control provides isolation.
q: What is a transaction in DBMS?
a: A transaction is a sequence of reads and writes that the DBMS treats as one logical unit of work, such as moving money between two accounts. It either commits, making all its changes permanent, or aborts, leaving no trace. Transactions are how a database stays correct under crashes and concurrent users.
q: How does a DBMS ensure atomicity?
a: It records every change in a log before applying it, keeping the old value (undo information). If the transaction aborts, or the system crashes before it commits, the recovery manager uses the log to undo its changes. MySQL's InnoDB keeps this information in undo logs.
q: How does a DBMS ensure durability?
a: A transaction counts as committed only after its log records, including the commit record, are forced to stable storage such as disk. After a crash, the recovery manager replays (redoes) committed changes from the log even if the data pages never reached disk. This is write-ahead logging.
q: What is the difference between COMMIT and ROLLBACK?
a: COMMIT ends a transaction and makes all its changes permanent and visible to others. ROLLBACK ends it and undoes all its changes since it began, or since a named savepoint with ROLLBACK TO SAVEPOINT. After either, a new transaction starts with the next statement.
q: Which ACID property is the application's responsibility?
a: Consistency, largely. The DBMS enforces declared constraints such as keys, foreign keys and CHECK, but it cannot know business rules it was never told, such as "a transfer must not create money". The transaction's own logic must preserve them; atomicity and isolation then keep that logic safe under failures and concurrency.
q: What is write-ahead logging?
a: Write-ahead logging (WAL) is the rule that a change's log record must reach stable storage before the changed data page does, and that a transaction commits only once all its log records are stable. It lets the DBMS write data pages lazily while still being able to undo and redo any change after a crash.
---

A database is used by many people at once, and machines crash. A **transaction** is the tool that keeps data correct through both: a group of operations that the DBMS treats as one indivisible unit. Moving ₹1,000 from one account to another is two updates, and a world in which only one of them happened is a world where money vanished or appeared. This note defines transactions and their states, works each ACID property on that transfer, and explains how a DBMS actually delivers each one: logs, recovery, locking, and write-ahead logging.

## What a transaction is

A **transaction** is a sequence of operations on the database that forms one logical unit of work. In theory courses it is written with two operations: **read(X)** copies item X from the database into a local variable, and **write(X)** copies the local variable back. The transfer T1 of ₹1,000 from account A (₹5,000) to account B (₹3,000):

| Step | Operation | A in database | B in database |
| --- | --- | --- | --- |
| 1 | read(A) | 5000 | 3000 |
| 2 | A := A − 1000 | 5000 | 3000 |
| 3 | write(A) | 4000 | 3000 |
| 4 | read(B) | 4000 | 3000 |
| 5 | B := B + 1000 | 4000 | 3000 |
| 6 | write(B) | 4000 | 4000 |
| 7 | commit | 4000 | 4000 |

Between steps 3 and 6 the database holds A = 4000 and B = 3000: a total of ₹7,000 that is wrong. Every ACID property is about making sure nobody, including a crash, ever acts on that intermediate state.

## Transaction states

| State | Meaning |
| --- | --- |
| Active | The transaction is executing its reads and writes |
| Partially committed | Its last statement has executed, but its changes may still be only in memory |
| Committed | Its commit record is on stable storage; the changes are permanent |
| Failed | An error, a constraint violation, a deadlock or a crash means it cannot proceed normally |
| Aborted | It has been rolled back and the database restored to its state before the transaction |

The paths are Active → Partially committed → Committed, and Active or Partially committed → Failed → Aborted. A partially committed transaction can still fail, for example if writing its log to disk fails. After an abort the system either **restarts** the transaction (if the failure was not its own fault, such as a deadlock) or **kills** it (if its logic was wrong). Some textbooks add a final **Terminated** state reached after commit or abort.

## Atomicity

**All or nothing.** Either every operation of the transaction is reflected in the database, or none is.

Suppose the server crashes after step 3. Without atomicity the database would restart with A = 4000 and B = 3000, and ₹1,000 would be gone. With it, the recovery manager finds that T1 never committed and **undoes** its write, restoring A to 5000.

How: before changing a value, the DBMS logs the old value. Rollback and crash recovery replay these undo records backwards. MySQL's InnoDB keeps them in **undo logs** (which also serve its multi-version reads).

## Consistency

**Valid state to valid state.** If the database satisfies its rules before the transaction, it satisfies them afterwards. For the transfer, the rule is that A + B is the same before and after (₹8,000), and that no balance goes negative.

How: the DBMS enforces declared constraints (primary and foreign keys, NOT NULL, CHECK) and rejects a statement that would break one. Rules it was never told, such as "transfers conserve money", are kept by the transaction's own logic. Consistency is therefore the one property shared with the application; atomicity and isolation make sure that correct logic stays correct despite crashes and concurrency.

## Isolation

**Concurrent transactions do not see each other's partial work.** The result of running transactions concurrently must equal the result of running them one after another in some order.

Suppose T2 computes the bank's total, A + B, and runs between steps 3 and 6 of T1. It reads A = 4000 and B = 3000 and reports ₹7,000, a total that never existed in any committed state.

How: **concurrency control**. Locking makes T2 wait for T1's locks; multi-version concurrency control (MVCC), used by InnoDB and PostgreSQL, gives T2 a snapshot of committed data so it reads A = 5000 and B = 3000. Full isolation (serializability) costs throughput, so SQL offers weaker **isolation levels** that allow some anomalies. The [concurrency control note](/notes/dbms/concurrency-control) covers schedules, locks and isolation levels.

## Durability

**Committed means permanent.** Once the user is told the transfer succeeded, it survives a power cut, a crash or a restart.

Suppose the server crashes a moment after T1 commits, before the changed pages have been written from memory to disk. On restart, the recovery manager finds T1's commit record in the log and **redoes** its writes, so A = 4000 and B = 4000.

How: the commit is acknowledged only after the transaction's log records are **forced** to stable storage. In InnoDB this is the redo log, flushed at every commit by default (`innodb_flush_log_at_trx_commit = 1`); the settings 0 and 2 trade up to about a second of committed transactions on a crash for speed. Durability on one machine does not protect against losing the disk itself; that needs replicas and backups.

| Property | Guarantee | Without it | Provided by |
| --- | --- | --- | --- |
| Atomicity | All or nothing | Half a transfer after a crash | Undo logging, rollback, recovery |
| Consistency | Rules hold before and after | Negative balances, orphan rows | Constraints plus correct transaction logic |
| Isolation | No partial work seen by others | Wrong totals, lost updates | Locking, MVCC, isolation levels |
| Durability | Commits survive crashes | A "successful" transfer disappears | Redo logging, forced log at commit, recovery |

## COMMIT, ROLLBACK and SAVEPOINT

```sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 1000 WHERE id = 'A';
SAVEPOINT after_debit;
UPDATE accounts SET balance = balance + 1000 WHERE id = 'B';
ROLLBACK TO SAVEPOINT after_debit;   -- undoes only the credit to B
COMMIT;                              -- A = 4000, B = 3000
```

`COMMIT` makes the changes permanent. `ROLLBACK` undoes everything since `START TRANSACTION`. `SAVEPOINT name` marks a point inside the transaction, and `ROLLBACK TO SAVEPOINT name` undoes only the work after it while the transaction stays open. The example deliberately commits half a transfer to show that a savepoint gives you partial rollback, and that keeping the result consistent is your job.

Three MySQL behaviours worth knowing:

- **Autocommit** is on by default, so each statement outside `START TRANSACTION` is a transaction of its own.
- **A failing statement does not abort the transaction.** If the second `UPDATE` breaks a CHECK constraint, InnoDB undoes that statement only; the first stays in place until you `ROLLBACK` or `COMMIT`. Applications must roll back on error themselves. A deadlock, by contrast, rolls back the whole transaction.
- **DDL commits implicitly**, so a `CREATE TABLE` or `TRUNCATE` inside a transaction commits what came before it.

## Write-ahead logging and recovery

The **log** is a sequential file of records describing every change. For T1:

```text
<T1 start>
<T1, A, 5000, 4000>      transaction, item, old value, new value
<T1, B, 3000, 4000>
<T1 commit>
```

**Write-ahead logging (WAL)** has two rules:

1. Before a changed data page is written to disk, the log records for its changes must be on stable storage. This keeps undo possible.
2. A transaction is committed only when all its log records, up to and including the commit record, are on stable storage. This keeps redo possible.

Writing the log is cheap because it is sequential, so the DBMS can keep data pages in memory and write them back lazily. Real systems allow uncommitted changes to reach disk (called **steal**) and do not force pages to disk at commit (**no-force**), so recovery needs both undo and redo:

| Crash after | Is T1's commit record on disk? | Recovery | Final state |
| --- | --- | --- | --- |
| The A record | No | Undo T1: A back to 5000 | A 5000, B 3000 |
| The B record | No | Undo in reverse: B back to 3000, then A to 5000 | A 5000, B 3000 |
| The commit record | Yes | Redo T1: A = 4000, B = 4000 | A 4000, B 4000 |

Recovery redoes committed transactions and undoes uncommitted ones. To avoid scanning the whole log, the DBMS writes periodic **checkpoints** recording which transactions were active and which pages were dirty, and recovery starts from the last one. ARIES, published at IBM in 1992, is the standard recovery algorithm built on these ideas, with analysis, redo and undo passes. Older textbooks also describe **deferred update** (nothing reaches the database before commit, so recovery needs only redo) and **immediate update** (changes may reach it early, so recovery needs undo and redo).

## Shadow paging

**Shadow paging** achieves atomicity and durability without a log of changes. The database is a set of pages found through a page table. When a transaction starts, the current page table is copied; the original becomes the **shadow page table** and is never modified. Each page the transaction writes is copied to a new location, and only the new table points to it.

- **Commit**: flush the modified pages and the new page table, then atomically switch the single pointer that names the current page table.
- **Abort or crash**: discard the new pages; the shadow table still describes the old, consistent database.

It makes recovery trivial, but it scatters related pages across the disk, leaves old pages to garbage-collect, makes every commit write a page table, and is hard to combine with concurrent transactions. That is why mainstream relational systems use WAL; the copy-on-write idea survives in some storage engines and file systems.

## Common mistakes

- Saying the DBMS alone guarantees consistency: it enforces declared constraints; business invariants are the transaction's job.
- Assuming an error inside a MySQL transaction rolls it back: only the failing statement is undone.
- Equating "committed" with "written to the data files": it means the log is on stable storage.
- Thinking isolation means transactions run one at a time: they run concurrently, with results equivalent to some serial order.
- Treating durability as backup: it covers crashes, not a destroyed disk.

## Interview questions

**Explain ACID with an example.** Use a transfer of ₹1,000 from A to B. Atomicity: both updates or neither. Consistency: the total is conserved and no balance goes negative. Isolation: a concurrent report never sees money in flight. Durability: once confirmed, the transfer survives a crash.

**Which component of a DBMS provides each property?** The recovery manager, through the log, provides atomicity and durability. The concurrency control manager provides isolation. Integrity constraints and the application's transaction logic provide consistency.

**What are the states of a transaction?** Active, partially committed, committed, failed and aborted, with terminated in some books. A transaction can fail from the active or partially committed state, and an aborted one is either restarted or killed.

**What is a savepoint?** A named point inside a transaction. ROLLBACK TO SAVEPOINT undoes the work done after it without ending the transaction, which is useful for retrying one step of a long transaction.

**Why does a DBMS need both undo and redo during recovery?** Because the buffer manager may write uncommitted changes to disk (so they must be undone) and need not write committed changes before acknowledging the commit (so they must be redone). Undo restores atomicity; redo restores durability.

**What is a checkpoint?** A point at which the DBMS records the active transactions and flushes or notes the dirty pages, so recovery can start from it rather than from the beginning of the log. It bounds restart time.

**What is the difference between WAL and shadow paging?** WAL updates pages in place and logs every change so it can undo and redo. Shadow paging never overwrites a page, writing copies and switching a page-table pointer at commit; it needs no undo or redo but fragments data and handles concurrency poorly.

**Does autocommit mean every statement is durable?** Yes, with the default log-flush setting: under autocommit each statement commits on its own, so its changes are durable once it returns. It also means a multi-statement change has no atomicity unless you wrap it in START TRANSACTION and COMMIT.

Next, what happens when many transactions run at once: [Concurrency Control in DBMS](/notes/dbms/concurrency-control). Transactions and isolation appear in the [SQL (Intermediate) skill test](/skill-tests/sql-intermediate).
