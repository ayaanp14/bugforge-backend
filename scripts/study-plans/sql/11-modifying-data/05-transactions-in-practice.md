---
title: Transactions in practice
minutes: 14
seo-title: SQL Transactions Explained: COMMIT, ROLLBACK and SAVEPOINT
description: A transaction groups statements so all take effect or none do. START TRANSACTION, COMMIT, ROLLBACK, savepoints, MySQL autocommit and implicit commits.
question: What is a transaction in SQL?
answer: A transaction is a group of statements the database treats as one unit: either every change is made permanent with COMMIT, or every change is undone with ROLLBACK. In MySQL you open one with `START TRANSACTION` or `BEGIN`. Other sessions do not see the uncommitted changes, and a crash before COMMIT leaves the data as it was before the transaction started.
q: What is autocommit in MySQL?
a: With autocommit on, which is MySQL's default, every statement outside an explicit transaction is its own transaction and is committed as soon as it succeeds. `START TRANSACTION` suspends autocommit until the next COMMIT or ROLLBACK. `SET autocommit = 0` turns it off for the session, so changes wait for an explicit COMMIT.
q: What is a savepoint in SQL?
a: A savepoint is a named point inside a transaction. `ROLLBACK TO SAVEPOINT name` undoes only the changes made after it and keeps the transaction open, so earlier work survives and can still be committed. `RELEASE SAVEPOINT name` forgets the marker. Savepoints are how a long job retries one step without losing the rest.
q: Which statements cause an implicit commit in MySQL?
a: DDL statements such as CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE TABLE and RENAME TABLE, as well as starting a new transaction, commit whatever the current transaction has done before they run. They cannot be rolled back. PostgreSQL runs most DDL inside transactions, so the same script behaves differently there.
q: Why should transactions be kept short?
a: An open transaction holds locks on the rows it changed, keeps old row versions alive in the undo log and blocks other writers on the same rows. A transaction left open while waiting for user input or a slow network call causes lock waits, timeouts and deadlocks for everyone else. Gather input first, then open, write and commit quickly.
---
The previous lessons changed data one statement at a time. Real changes usually take several statements that only make sense together: move money out of one account **and** into another; create an order **and** its lines **and** reduce stock. If the second statement fails or the server crashes between them, the data is wrong. A **transaction** makes a group of statements all-or-nothing. This lesson is the practical side — the statements, autocommit, savepoints, the DDL that commits behind your back, and how to shape a transaction. Isolation levels, locking and MVCC, which decide what concurrent transactions see of each other, get their own module later.

## START TRANSACTION, COMMIT, ROLLBACK

```sql
START TRANSACTION;                                   -- or BEGIN
UPDATE accounts SET balance = balance - 250 WHERE id = 1;
UPDATE accounts SET balance = balance + 250 WHERE id = 2;
INSERT INTO transfers (from_id, to_id, amount) VALUES (1, 2, 250);
COMMIT;
```

Between `START TRANSACTION` and `COMMIT`, the changes exist only for this session. `COMMIT` makes all three permanent at once; until then, other sessions still see the old balances (under InnoDB's default isolation), and a crash rolls everything back on restart. `ROLLBACK` instead of `COMMIT` discards all three:

```sql
START TRANSACTION;
DELETE FROM orders WHERE placed_on < '2020-01-01';
SELECT COUNT(*) FROM orders;      -- inside the transaction you see your own changes
ROLLBACK;                         -- … and now they never happened
```

Inside a transaction you always **read your own writes**: the SELECT above counts the orders that are left after the DELETE, even though nobody else can see that state yet. This is the basis of the "try it, look, then decide" workflow for risky changes — run the UPDATE, run a SELECT to check it, then COMMIT or ROLLBACK.

These four properties are what the acronym **ACID** names: *atomicity* (all or nothing), *consistency* (constraints hold at commit), *isolation* (concurrent transactions do not see each other's partial work) and *durability* (once committed, it survives a crash).

## Autocommit

MySQL starts every session with `autocommit = 1`: a statement run outside an explicit transaction is a transaction by itself and is committed the moment it succeeds. That is why a stray `DELETE` cannot be undone — it was already committed. `START TRANSACTION` switches autocommit off until the next COMMIT or ROLLBACK. You can also turn it off for the session:

```sql
SET autocommit = 0;
UPDATE products SET price = price * 0.9;
-- nothing is permanent until:
COMMIT;
```

Many drivers and frameworks manage this for you ("begin a transaction, run the block, commit, or roll back on an exception"). PostgreSQL also autocommits by default; Oracle does not, and its clients commit on exit.

## Savepoints

A savepoint marks a point inside a transaction you can roll back to without abandoning the whole transaction:

```sql
START TRANSACTION;
INSERT INTO orders (id, customer_id) VALUES (900, 7);
SAVEPOINT lines;
INSERT INTO order_items (order_id, sku, qty) VALUES (900, 'A1', 2);
INSERT INTO order_items (order_id, sku, qty) VALUES (900, 'Z9', 1);   -- wrong item
ROLLBACK TO SAVEPOINT lines;       -- both item rows are gone, the order stays
INSERT INTO order_items (order_id, sku, qty) VALUES (900, 'A1', 2);
COMMIT;
```

`ROLLBACK TO SAVEPOINT name` undoes everything after the savepoint and leaves the transaction open; `RELEASE SAVEPOINT name` removes the marker; a plain `ROLLBACK` still undoes the whole transaction, savepoints included. Savepoints matter in long batch jobs (retry one chunk) and are what frameworks use to implement "nested transactions".

## Errors inside a transaction

In MySQL, a statement that fails inside a transaction — a duplicate key, say — is rolled back **by itself**; the transaction stays open with the earlier statements still applied. MySQL does not roll back the whole transaction for you (a deadlock is the exception: the victim's whole transaction is rolled back). So the application must decide: on an error, issue `ROLLBACK`. In practice that is a `try/except` around the transaction in the application, or a `DECLARE ... HANDLER` in a stored procedure. PostgreSQL behaves differently and refuses every further statement in a failed transaction until you roll back — a frequent surprise when moving between the two.

## DDL commits implicitly

In MySQL, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, `TRUNCATE TABLE`, `RENAME TABLE` and `CREATE INDEX` cause an **implicit commit**: before running, they commit whatever the current transaction has done, and they cannot be rolled back.

```sql
START TRANSACTION;
UPDATE accounts SET balance = 0;
TRUNCATE TABLE audit_log;          -- implicit COMMIT here: the UPDATE is now permanent
ROLLBACK;                          -- rolls back nothing
```

PostgreSQL and SQL Server run most DDL inside transactions, so a migration that fails halfway rolls back cleanly there and does not in MySQL. Keep DDL out of data transactions in MySQL, and write migrations so each step can be re-run. (The practice engine here keeps DDL transactional like SQLite does, so the exercises never depend on either behaviour.)

## Shaping a good transaction

- **Short.** An open transaction holds row locks and keeps old versions of rows alive. Never hold one open while waiting for a user, an HTTP call or a file.
- **Complete.** Put in it everything that must succeed together and nothing else.
- **Consistent order.** When several transactions update the same tables, updating rows in the same order (by id, say) avoids most deadlocks.
- **Set-based.** One UPDATE over a thousand rows beats a thousand single-row UPDATEs inside a loop.
- **Retry-safe.** Deadlocks and lock timeouts happen under load; the application should retry the whole transaction.

## Key takeaways

- `START TRANSACTION` … `COMMIT` makes a group of changes permanent together; `ROLLBACK` undoes them all.
- Inside a transaction you read your own uncommitted writes; others do not.
- MySQL autocommits each statement unless a transaction is open.
- `SAVEPOINT` / `ROLLBACK TO SAVEPOINT` undo part of a transaction and keep it open.
- A failed statement in MySQL is undone alone; the application decides to roll back the rest.
- DDL commits implicitly in MySQL and cannot be rolled back.
