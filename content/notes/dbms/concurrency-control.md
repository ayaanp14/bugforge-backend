---
title: Concurrency Control in DBMS
order: 10
minutes: 16
level: advanced
updated: 2026-10-05
seo-title: Concurrency Control in DBMS: Serializability and 2PL
description: Concurrency control in DBMS: schedules, a worked precedence graph, recoverable schedules, anomalies, isolation levels, 2PL, timestamps and deadlocks.
question: What is concurrency control in DBMS?
answer: Concurrency control is the part of a DBMS that lets many transactions run at the same time while keeping the result equal to running them one after another in some order (serializability). It prevents anomalies such as dirty reads and lost updates using locks (two-phase locking), timestamps or multiple versions of data, and it detects or prevents the deadlocks that locking can cause.
q: What is a serializable schedule?
a: A schedule is serializable if its effect on the database equals that of some serial schedule, where the same transactions run one at a time. Conflict serializability, tested with a precedence graph, is the practical form: the schedule can be turned into a serial one by swapping adjacent non-conflicting operations.
q: What is two-phase locking?
a: Two-phase locking (2PL) is a protocol in which each transaction acquires locks in a growing phase and releases them in a shrinking phase, never acquiring a lock after releasing any. It guarantees conflict-serializable schedules. Strict 2PL also holds exclusive locks until commit, which prevents cascading rollbacks.
q: What is the difference between a dirty read and a non-repeatable read?
a: A dirty read reads a value written by a transaction that has not committed and may still roll back. A non-repeatable read reads the same row twice and gets different committed values because another transaction updated it in between. READ COMMITTED prevents the first; REPEATABLE READ prevents both.
q: What is the default isolation level in MySQL?
a: InnoDB, MySQL's default storage engine, uses REPEATABLE READ by default. PostgreSQL, Oracle and SQL Server default to READ COMMITTED. You can change it per session with SET TRANSACTION ISOLATION LEVEL, for example SET TRANSACTION ISOLATION LEVEL READ COMMITTED.
q: What is the difference between wait-die and wound-wait?
a: Both prevent deadlock using transaction timestamps, where older means a smaller timestamp. In wait-die an older transaction waits for a younger one, and a younger requester is rolled back. In wound-wait an older requester rolls the younger holder back, and a younger requester waits.
q: What is a phantom read?
a: A phantom read happens when a transaction runs the same query twice and the second run returns extra or missing rows, because another transaction inserted or deleted rows matching the condition and committed in between. Only SERIALIZABLE prevents it under the SQL standard, though InnoDB's REPEATABLE READ prevents it in most cases.
---

A database serves hundreds of transactions at once. Running them strictly one after another would be correct but slow, because each spends most of its time waiting for disk, network or the user. Running them interleaved is fast, but some interleavings produce results no serial run could: lost money, wrong totals, phantom rows. **Concurrency control** decides which interleavings to allow. This note defines when a schedule is correct, works a precedence graph, lists the anomalies and the isolation levels that permit them, and covers the protocols that enforce correctness: two-phase locking, timestamp ordering and deadlock handling.

## Schedules

A **schedule** is the order in which the operations of several transactions are executed, keeping each transaction's own order. Ri(X) and Wi(X) mean transaction Ti reads or writes item X.

- A **serial schedule** runs transactions one at a time: all of T1, then all of T2. Always correct, never concurrent.
- A **concurrent** (non-serial) schedule interleaves them.
- A schedule is **serializable** if it is equivalent to some serial schedule of the same transactions. Serializability is the definition of correctness for concurrent execution.

## Conflict serializability

Two operations **conflict** if they belong to different transactions, access the same item, and at least one is a write:

| Pair on the same item | Conflict? | Why |
| --- | --- | --- |
| Ri(X), Rj(X) | No | Swapping two reads changes nothing |
| Ri(X), Wj(X) | Yes | The read sees a different value |
| Wi(X), Rj(X) | Yes | The read sees a different value |
| Wi(X), Wj(X) | Yes | The final value differs |

A schedule is **conflict serializable** if swapping adjacent non-conflicting operations can turn it into a serial schedule. The test is the **precedence graph**: one node per transaction, and an edge Ti → Tj whenever an operation of Ti conflicts with a later operation of Tj. The schedule is conflict serializable **if and only if the graph has no cycle**, and any topological order of the graph is an equivalent serial order.

## Worked example: a precedence graph

Schedule S1, with commits omitted:

| Step | T1 | T2 | T3 |
| --- | --- | --- | --- |
| 1 | R(A) | | |
| 2 | | R(B) | |
| 3 | W(A) | | |
| 4 | | | R(A) |
| 5 | | W(B) | |
| 6 | R(B) | | |
| 7 | | | W(B) |

Check every pair of operations on the same item from different transactions:

| Earlier operation | Later operation | Item | Edge |
| --- | --- | --- | --- |
| W1(A), step 3 | R3(A), step 4 | A | T1 → T3 |
| R2(B), step 2 | W3(B), step 7 | B | T2 → T3 |
| W2(B), step 5 | R1(B), step 6 | B | T2 → T1 |
| W2(B), step 5 | W3(B), step 7 | B | T2 → T3 |
| R1(B), step 6 | W3(B), step 7 | B | T1 → T3 |

R1(A) with R3(A) and R2(B) with R1(B) are pairs of reads, so they add nothing. The graph has edges T2 → T1, T1 → T3 and T2 → T3, and no cycle. S1 is conflict serializable, equivalent to the serial order **T2, T1, T3**, the only topological order here.

Now the schedule S2: R1(A), R2(A), W1(A), W2(A). R1(A) before W2(A) gives T1 → T2; R2(A) before W1(A) gives T2 → T1. That is a **cycle**, so S2 is not conflict serializable. It is the lost update: both read the same balance, and T2's write wipes out T1's.

## View serializability

Two schedules are **view equivalent** if every transaction reads the same values in both (same initial reads, same reads-from) and the same transaction makes the final write of each item. A schedule is **view serializable** if it is view equivalent to a serial one.

Every conflict-serializable schedule is view serializable, but not the reverse. S3: R1(A), W2(A), W1(A), W3(A) has edges T1 → T2 and T2 → T1, a cycle, so it is not conflict serializable. Yet it is view equivalent to T1, T2, T3: T1 reads the initial A in both, and T3 writes the final A in both. The difference comes from **blind writes** (W2 and W3 write A without reading it). Testing view serializability is NP-complete, which is why systems enforce conflict serializability.

## Recoverable and cascadeless schedules

Serializability ignores aborts. Three stronger properties handle them:

| Property | Rule | What it prevents |
| --- | --- | --- |
| Recoverable | If Tj reads a value written by Ti, Ti commits before Tj commits | A committed transaction built on a value that was rolled back |
| Cascadeless | Tj reads a value only after the transaction that wrote it has committed | Cascading rollback: one abort forcing others to abort |
| Strict | No transaction reads or overwrites a value until its writer commits or aborts | Makes undo a simple restore of the old value |

Example of a non-recoverable schedule: W1(A), R2(A), commit T2, then T1 aborts. T2 has committed using a value that never officially existed, and durability forbids undoing it. Each class contains the next: every strict schedule is cascadeless, and every cascadeless schedule is recoverable.

## Concurrency anomalies

Take account A with ₹5,000:

| Anomaly | What happens | Example |
| --- | --- | --- |
| Dirty read | Reading uncommitted data | T1 sets A = 4000; T2 reads 4000; T1 rolls back. T2 acted on a value that never existed |
| Lost update | One write overwrites another | T1 and T2 both read 5000; T1 writes 4000 (debit); T2 writes 5500 (credit). The debit is lost; A should be 4500 |
| Non-repeatable read | The same row read twice gives different values | T1 reads 5000; T2 sets A = 4000 and commits; T1 reads 4000 |
| Phantom read | The same query returns new or missing rows | T1 counts accounts above ₹1,000 and gets 2; T2 inserts one and commits; T1 counts 3 |

## Isolation levels

SQL defines four isolation levels by which of three phenomena they allow:

| Isolation level | Dirty read | Non-repeatable read | Phantom read |
| --- | --- | --- | --- |
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | Prevented | Possible | Possible |
| REPEATABLE READ | Prevented | Prevented | Possible |
| SERIALIZABLE | Prevented | Prevented | Prevented |

Defaults differ: MySQL's InnoDB uses **REPEATABLE READ**; PostgreSQL, Oracle and SQL Server use **READ COMMITTED**. Implementations go beyond the table. InnoDB's REPEATABLE READ reads from a snapshot taken at the first read and uses next-key locks for locking reads, so phantoms are prevented in most cases; PostgreSQL treats READ UNCOMMITTED as READ COMMITTED.

The **lost update** is not in the standard table. SERIALIZABLE prevents it. At REPEATABLE READ, PostgreSQL aborts the second writer with a serialization error, while InnoDB lets a read-then-write in application code lose an update. Avoid it with an atomic `UPDATE accounts SET balance = balance - 1000`, or by reading with `SELECT … FOR UPDATE`, which takes the write lock up front.

Most modern systems implement isolation with **multi-version concurrency control (MVCC)**: a write creates a new version of a row, and each reader sees the versions committed as of its snapshot, so readers never block writers and writers never block readers. Writers still lock rows against each other.

## Locks: shared and exclusive

A **lock** is a transaction's right to use an item. A **shared lock (S)** permits reading; an **exclusive lock (X)** permits reading and writing.

| Requested lock | Another transaction holds S | Another transaction holds X |
| --- | --- | --- |
| S | Granted | Wait |
| X | Wait | Wait |

Locking alone does not give serializability: a transaction that unlocks A, then later locks B, can let another transaction see a mix of its old and new state. The protocol around the locks matters.

## Two-phase locking

Under **two-phase locking (2PL)**, each transaction has a **growing phase**, in which it may acquire locks but release none, then a **shrinking phase**, in which it may release locks but acquire none. The moment it acquires its last lock is its **lock point**. Every schedule 2PL allows is conflict serializable, in the order of the transactions' lock points.

| Variant | Rule | Result |
| --- | --- | --- |
| Basic 2PL | No lock acquired after any lock is released | Conflict serializable; deadlocks and cascading rollbacks possible |
| Conservative (static) 2PL | Acquire every lock before the first operation | No deadlocks; needs the read and write sets in advance |
| Strict 2PL | Hold all exclusive locks until commit or abort | Strict, cascadeless schedules; the common choice |
| Rigorous 2PL | Hold all locks, shared and exclusive, until commit or abort | Serializable in commit order |

2PL fixes the lost update, but can deadlock. If T1 and T2 both take S(A) to read the balance, then both ask to upgrade to X(A) to write it, each waits for the other forever. Taking X(A) at the first read, which is what `SELECT … FOR UPDATE` does, avoids this particular deadlock.

## Timestamp ordering

The **timestamp-ordering protocol** uses no locks. Each transaction gets a timestamp when it starts (smaller means older), and conflicting operations must happen in timestamp order. Each item X keeps R-TS(X) and W-TS(X), the largest timestamps of transactions that read and wrote it.

| Operation by T | Condition | Action |
| --- | --- | --- |
| read(X) | TS(T) < W-TS(X) | Reject: a younger transaction already overwrote X; roll T back |
| read(X) | otherwise | Allow; R-TS(X) = max(R-TS(X), TS(T)) |
| write(X) | TS(T) < R-TS(X) | Reject: a younger transaction already read the old value; roll T back |
| write(X) | TS(T) < W-TS(X) | Reject; the Thomas write rule instead ignores this obsolete write |
| write(X) | otherwise | Allow; W-TS(X) = TS(T) |

A rolled-back transaction restarts with a new timestamp. The protocol guarantees conflict serializability and is deadlock-free, since nobody waits, but long transactions can starve, and schedules are recoverable only if commits are handled carefully. With the Thomas write rule it also accepts some view-serializable schedules such as S3.

## Deadlock handling

A **deadlock** is a set of transactions each waiting for a lock held by another in the set. Systems handle it in three ways:

- **Detection**: keep a **wait-for graph** (Ti → Tj when Ti waits for a lock Tj holds); a cycle is a deadlock, and one victim is rolled back. InnoDB checks at once by default and rolls back the transaction it judges smallest, by rows changed.
- **Timeout**: give up after waiting too long (InnoDB's `innodb_lock_wait_timeout`, 50 seconds by default).
- **Prevention** with timestamps: wait-die and wound-wait, which let waits run in one direction only, so no cycle can form.

With T1 older (timestamp 5) and T2 younger (timestamp 10):

| Situation | Wait-die (non-preemptive) | Wound-wait (preemptive) |
| --- | --- | --- |
| T1 (older) requests a lock T2 holds | T1 waits | T1 wounds T2: T2 is rolled back |
| T2 (younger) requests a lock T1 holds | T2 dies: rolled back | T2 waits |

In both schemes the rolled-back transaction restarts with its **original** timestamp, so it eventually becomes the oldest and cannot starve. Wait-die can kill a young transaction repeatedly; wound-wait usually causes fewer rollbacks.

## Common mistakes

- Drawing a precedence edge for two reads: only read-write, write-read and write-write pairs conflict.
- Drawing edges from the later operation to the earlier: the edge follows time.
- Saying 2PL prevents deadlocks: it guarantees serializability, and deadlocks remain possible.
- Saying serializable means "serial": the transactions still interleave.
- Assuming REPEATABLE READ prevents lost updates everywhere: InnoDB allows them for read-then-write.
- Confusing timestamp restarts: timestamp ordering restarts with a new timestamp; wait-die and wound-wait keep the old one.

## Interview questions

**What is the difference between conflict and view serializability?** Conflict serializability requires reordering by swaps of non-conflicting operations and is tested with a precedence graph in polynomial time. View serializability only requires the same reads and final writes; it is a larger class, differing through blind writes, and testing it is NP-complete.

**How do you check whether a schedule is conflict serializable?** Build the precedence graph with an edge Ti → Tj for each conflicting pair where Ti's operation comes first. If there is no cycle, it is conflict serializable, and a topological sort gives the equivalent serial order.

**Why does strict 2PL hold exclusive locks until commit?** So that no other transaction can read or overwrite uncommitted data. That makes schedules strict, so an abort never forces other transactions to roll back.

**Which anomalies does each isolation level prevent?** READ COMMITTED prevents dirty reads, REPEATABLE READ also prevents non-repeatable reads, and SERIALIZABLE also prevents phantoms. READ UNCOMMITTED prevents none of the three.

**How do databases detect deadlocks?** They maintain a wait-for graph and look for cycles, either on every wait or periodically, then roll back a victim, usually the transaction cheapest to undo. Lock wait timeouts are a fallback.

**What is MVCC and why is it used?** Multi-version concurrency control keeps several committed versions of a row so each reader sees a consistent snapshot. Readers and writers do not block each other, which suits read-heavy workloads; InnoDB and PostgreSQL both use it.

**What is a cascading rollback and how do you avoid it?** When one transaction aborts, others that read its uncommitted writes must abort too, and so on. Cascadeless schedules, produced by strict 2PL, avoid it by letting transactions read only committed data.

**Explain wait-die and wound-wait.** Both give every transaction a timestamp. In wait-die, older transactions wait and younger ones requesting an older one's lock are rolled back; in wound-wait, older transactions pre-empt younger holders and younger ones wait.

Next, how a database finds rows quickly: [Indexing and B+ Trees in DBMS](/notes/dbms/indexing-and-b-plus-trees). Isolation and transactions are examined in the [SQL (Intermediate) skill test](/skill-tests/sql-intermediate).
