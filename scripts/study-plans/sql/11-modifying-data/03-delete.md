---
title: DELETE, TRUNCATE and DROP
minutes: 14
seo-title: DELETE vs TRUNCATE vs DROP in SQL: Removing Rows and Tables
description: DELETE removes the rows a WHERE picks, TRUNCATE empties a table fast and DROP removes the table itself. How each behaves, plus subqueries and soft deletes.
question: What is the difference between DELETE, TRUNCATE and DROP?
answer: DELETE removes rows one by one, can take a WHERE clause, is logged per row and can be rolled back inside a transaction. TRUNCATE empties the whole table at once by recreating it, takes no WHERE, resets AUTO_INCREMENT and in MySQL commits implicitly. DROP removes the table itself, its structure, indexes and data, so later queries fail with "table doesn't exist".
q: Can you roll back a TRUNCATE in MySQL?
a: No. In MySQL, TRUNCATE TABLE is a DDL statement that causes an implicit commit, so it cannot be undone by ROLLBACK and it also commits whatever the open transaction had done before it. DELETE without a WHERE removes the same rows and can be rolled back. PostgreSQL is different: its TRUNCATE is transactional.
q: How do I delete rows that have no match in another table?
a: Use `NOT EXISTS`: `DELETE FROM orders WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = orders.customer_id);`. It removes orders whose customer is missing, including orders with a NULL customer_id. Avoid `NOT IN` when the subquery's column can contain NULL: one NULL makes the condition unknown for every row, so nothing is deleted.
q: What is a soft delete?
a: Marking a row as deleted instead of removing it, usually with a `deleted_at` DATETIME column that is NULL for live rows. Queries filter on `deleted_at IS NULL`. It keeps history, makes undo trivial and keeps references valid, at the cost of every query remembering the filter and the table growing.
q: Does DELETE reset AUTO_INCREMENT in MySQL?
a: No. After `DELETE FROM t`, InnoDB's counter keeps its value, so the next insert continues from where it was. `TRUNCATE TABLE t` resets the counter to its starting value because it recreates the table. Either way, ids are labels and should never be assumed to be consecutive.
---
Removing data comes in three sizes. `DELETE` removes chosen rows. `TRUNCATE TABLE` removes every row at once. `DROP TABLE` removes the table itself. Interviewers ask about the three together more than almost any other DML question, and production incidents come from confusing them. This lesson covers DELETE with WHERE, deleting by a condition on another table (subqueries, MySQL's multi-table DELETE), what referencing rows do when their parent goes, the comparison of DELETE, TRUNCATE and DROP, and the soft-delete pattern many applications use instead.

## DELETE with WHERE

```sql
DELETE FROM sessions
WHERE expires_on < '2024-06-01';
```

`DELETE FROM` takes a table and a WHERE; every row the WHERE matches is removed, whole — there is no "delete a column" (that is `UPDATE ... SET col = NULL` or `ALTER TABLE ... DROP COLUMN`). Like UPDATE, a DELETE without a WHERE affects every row:

```sql
DELETE FROM sessions;          -- the table is now empty, but it still exists
```

The same safety habits apply: run the WHERE as `SELECT COUNT(*)` first, and wrap important deletes in a transaction. DELETE is fully transactional in InnoDB — each removed row is written to the undo log, so `ROLLBACK` brings them all back — which is also why deleting millions of rows in one statement is slow and holds locks for a long time. Large purges are done in batches (`DELETE ... WHERE ... LIMIT 10000`, repeated; MySQL allows `LIMIT` on a single-table DELETE).

## Deleting by a condition on another table

"Delete the orders whose customer no longer exists" needs another table in the condition. The portable tool is a subquery:

```sql
DELETE FROM orders
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = orders.customer_id
);
```

`NOT EXISTS` is true when the inner query finds no row, which includes orders whose `customer_id` is NULL (no customer equals NULL). The tempting `NOT IN` version has the trap from the subqueries module:

```sql
DELETE FROM orders WHERE customer_id NOT IN (SELECT id FROM customers);
```

If `customers.id` could ever be NULL, `x NOT IN (..., NULL)` is unknown for every row and the statement deletes nothing; and an order with a NULL `customer_id` is never deleted either, because `NULL NOT IN (...)` is unknown. Prefer `NOT EXISTS` for anti-joins in DML.

The positive form uses `IN` or `EXISTS`:

```sql
DELETE FROM order_items
WHERE order_id IN (SELECT id FROM orders WHERE status = 'cancelled');
```

MySQL also has a **multi-table DELETE** with a join, naming the table to delete from before `FROM`:

```sql
DELETE oi
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'cancelled';
```

PostgreSQL writes it `DELETE FROM order_items oi USING orders o WHERE o.id = oi.order_id AND o.status = 'cancelled';`. As with UPDATE, MySQL refuses a DELETE whose subquery reads the same table it deletes from (error 1093); use a join or a derived table.

## What happens to rows that point at a deleted row

If `order_items.order_id` is a foreign key to `orders.id`, deleting an order that still has items is governed by the key's `ON DELETE` action:

| Action | Deleting the parent… |
| --- | --- |
| `RESTRICT` / `NO ACTION` (default) | is refused while children exist |
| `CASCADE` | deletes the children too |
| `SET NULL` | keeps the children, their key becomes NULL |

InnoDB enforces these. `CASCADE` is convenient and dangerous: one DELETE on a customer can remove orders, items and payments several levels down. The schema-design module covers declaring them. (The practice engine here declares foreign keys but does not enforce them, so the exercises delete children explicitly — which is also what you do when the key is `RESTRICT`.)

## DELETE vs TRUNCATE vs DROP

```sql
DELETE FROM logs;          -- remove every row, one at a time
TRUNCATE TABLE logs;       -- empty the table in one step
DROP TABLE logs;           -- remove the table altogether
```

| | DELETE | TRUNCATE | DROP |
| --- | --- | --- | --- |
| Kind | DML | DDL | DDL |
| WHERE | yes | no — all rows | n/a |
| Speed on a big table | slow (per row, logged) | fast (recreates the table) | fast |
| Rollback in MySQL | yes, in a transaction | no — implicit commit | no — implicit commit |
| AUTO_INCREMENT | kept | reset | gone with the table |
| Triggers | `ON DELETE` triggers fire | do not fire | do not fire |
| Structure, indexes, grants | kept | kept | removed |
| Referenced by a foreign key | allowed row by row | refused in InnoDB | refused |

The short version for an interview: DELETE removes **rows** (filtered, logged, undoable), TRUNCATE removes **all rows** (fast, not undoable in MySQL, counter reset), DROP removes **the table**. In PostgreSQL, TRUNCATE and DROP are transactional and can be rolled back; in MySQL and Oracle they commit implicitly. `DROP TABLE IF EXISTS t` avoids an error when the table is absent, which migration scripts rely on.

## Soft deletes

Many applications never physically delete business rows. They add a column and filter on it:

```sql
ALTER TABLE customers ADD COLUMN deleted_at DATETIME NULL;

UPDATE customers SET deleted_at = '2024-05-02 10:15:00' WHERE id = 17;   -- "delete"
SELECT id, name FROM customers WHERE deleted_at IS NULL;                   -- live rows
```

The benefits are an audit trail, an easy undo and references that never dangle. The costs are that every query must remember the filter (a view over the live rows helps), unique constraints must allow a deleted twin, and the table grows forever. Data-protection rules may still require a real delete of personal data.

## Pitfalls

- A DELETE without a WHERE, or with a WHERE that was never tested as a SELECT.
- `NOT IN` against a nullable column — use `NOT EXISTS`.
- TRUNCATE inside a transaction in MySQL, expecting ROLLBACK to undo it.
- Forgetting cascades: a small delete removing far more than intended.
- One enormous DELETE on a busy table instead of batches.

## Key takeaways

- `DELETE FROM t WHERE ...;` removes whole rows; without WHERE, all of them.
- Use `NOT EXISTS` / `EXISTS` (or MySQL's `DELETE t FROM t JOIN ...`) to delete by another table.
- `ON DELETE RESTRICT | CASCADE | SET NULL` decides what happens to children.
- DELETE is logged and undoable; TRUNCATE empties fast, resets the counter and commits in MySQL; DROP removes the table.
- Soft deletes mark rows instead of removing them.
