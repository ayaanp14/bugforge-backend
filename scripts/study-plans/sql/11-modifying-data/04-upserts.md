---
title: Upserts — insert or update
minutes: 15
seo-title: MySQL Upsert: ON DUPLICATE KEY UPDATE, REPLACE, INSERT IGNORE
description: An upsert inserts a row or updates it if the key exists. MySQL ON DUPLICATE KEY UPDATE, REPLACE and INSERT IGNORE compared, plus ON CONFLICT and MERGE.
question: How do you do an upsert in MySQL?
answer: Use `INSERT ... ON DUPLICATE KEY UPDATE`. MySQL tries the insert, and if it would duplicate a PRIMARY KEY or UNIQUE value it updates the existing row instead, for example `INSERT INTO stock (sku, qty) VALUES ('A1', 5) ON DUPLICATE KEY UPDATE qty = qty + 5;`. `REPLACE INTO` deletes and re-inserts the row, and `INSERT IGNORE` skips duplicates without changing anything.
q: What is the difference between REPLACE and ON DUPLICATE KEY UPDATE?
a: On a duplicate key, REPLACE deletes the old row and inserts a new one, so columns you did not supply fall back to their defaults, delete triggers fire and an AUTO_INCREMENT id can change. ON DUPLICATE KEY UPDATE modifies the existing row in place and only touches the columns you name, so it can add to a counter.
q: What does INSERT IGNORE do in MySQL?
a: It inserts the rows it can and silently skips any row that would duplicate a PRIMARY KEY or UNIQUE value, leaving the existing row unchanged. In MySQL it also downgrades some other errors, such as an out-of-range value, to warnings, which can hide bad data, so check `SHOW WARNINGS` after a bulk load.
q: How do you upsert in PostgreSQL?
a: With `INSERT ... ON CONFLICT (key) DO UPDATE SET col = EXCLUDED.col`, where `EXCLUDED` is the row that failed to insert, or `ON CONFLICT DO NOTHING` to skip it. PostgreSQL 15 and later also support the standard `MERGE` statement. MySQL has no MERGE and no ON CONFLICT.
q: Why not check with SELECT and then INSERT or UPDATE?
a: Because two sessions can both run the SELECT, both see no row and both insert, which gives a duplicate or a key error. A single upsert statement, or a unique key plus handling of the duplicate, lets the database decide atomically. A select-then-write is only safe inside a transaction that locks the row or the gap.
---
Loading data from outside rarely tells you which rows are new. A product feed lists every product; a page-view batch names pages you have seen before and pages you have not. The operation you want is "insert this row, or if a row with that key already exists, update it" — an **upsert**. Standard SQL calls it `MERGE`; MySQL has three of its own tools. This lesson covers MySQL's `ON DUPLICATE KEY UPDATE`, `REPLACE INTO` and `INSERT IGNORE`, how they differ on the row that already exists, PostgreSQL's `ON CONFLICT` and `MERGE`, and the two-statement form that works everywhere.

Every one of them depends on a **PRIMARY KEY or UNIQUE constraint**: that is how the database knows a row "already exists". Without one, every upsert is just an insert.

## INSERT ... ON DUPLICATE KEY UPDATE

```sql
CREATE TABLE stock (
  sku VARCHAR(20) PRIMARY KEY,
  qty INT NOT NULL,
  updated_on DATE
);

INSERT INTO stock (sku, qty, updated_on)
VALUES ('A1', 5, '2024-05-02')
ON DUPLICATE KEY UPDATE
  qty = qty + 5,
  updated_on = '2024-05-02';
```

MySQL attempts the insert. If it succeeds, done. If it would violate the primary key or any unique index, MySQL instead runs the `UPDATE` part on the row that is in the way. Inside that part, a bare column name means the **existing** row's value, so `qty = qty + 5` adds to it. To refer to the value you tried to insert, MySQL 8.0.19 and later let you alias the new row:

```sql
INSERT INTO stock (sku, qty, updated_on)
VALUES ('A1', 5, '2024-05-02'), ('B7', 12, '2024-05-02') AS new
ON DUPLICATE KEY UPDATE
  qty = stock.qty + new.qty,
  updated_on = new.updated_on;
```

Older code writes `VALUES(qty)` for the same thing; that function is deprecated in 8.0 but you will see it everywhere. The statement's affected-row count is 1 for an insert, 2 for an update that changed something and 0 for an update that changed nothing — a common interview detail.

Because the existing row is modified in place, its id, its other columns and any rows that reference it are untouched. This is usually what "upsert" should mean.

## REPLACE INTO

```sql
REPLACE INTO stock (sku, qty, updated_on)
VALUES ('A1', 5, '2024-05-02');
```

`REPLACE` has the same syntax as `INSERT` (single row, many rows or `REPLACE ... SELECT`), but on a duplicate key it **deletes the old row and inserts the new one**. The consequences:

- columns you did not list get their defaults, not their old values — `REPLACE INTO stock (sku, qty)` would set `updated_on` to NULL;
- you cannot add to the old value; the new row simply wins;
- `ON DELETE` triggers fire and, with real foreign keys, `ON DELETE CASCADE` can remove child rows;
- an AUTO_INCREMENT id on the replaced row changes if the duplicate was on a different unique column.

REPLACE fits when the incoming row is the complete truth — a nightly feed that carries every column of a lookup table. It is wrong for counters and for rows other tables point to.

## INSERT IGNORE

```sql
INSERT IGNORE INTO subscribers (email, name)
VALUES ('ada@example.com', 'Ada'), ('alan@example.com', 'Alan');
```

`INSERT IGNORE` inserts the rows it can and **skips** any row that would duplicate a key, leaving the existing row exactly as it was. It is the "insert if absent" half of an upsert: deduplicating an import, recording that something happened at least once, filling a junction table. In MySQL, `IGNORE` also turns some other errors — a value out of range, a NULL forced into a NOT NULL column in a multi-row insert — into warnings with an adjusted value, which can quietly store junk. After a bulk `INSERT IGNORE`, check `SHOW WARNINGS`. Which duplicate survives is decided by order: the first row inserted wins, so give an `INSERT IGNORE ... SELECT` an `ORDER BY` when it matters.

## The portable two-step: UPDATE, then INSERT the rest

Every SQL database can upsert from a staging table in two statements: update the rows that exist, then insert the ones that do not.

```sql
-- page_views(path PRIMARY KEY, views); today(path, hits) is the new batch
UPDATE page_views
SET views = views + (SELECT t.hits FROM today t WHERE t.path = page_views.path)
WHERE path IN (SELECT path FROM today);

INSERT INTO page_views (path, views)
SELECT t.path, t.hits
FROM today t
WHERE NOT EXISTS (SELECT 1 FROM page_views p WHERE p.path = t.path);
```

The order matters: update first, so that rows inserted in step two are not updated again. Run both inside one transaction so no other session sees the half-done state. The set-based form — the whole batch in two statements — is far faster than a loop doing one upsert per row.

## PostgreSQL and the standard

PostgreSQL's equivalent of `ON DUPLICATE KEY UPDATE` names the conflicting key and refers to the rejected row as `EXCLUDED`:

```sql
INSERT INTO stock (sku, qty) VALUES ('A1', 5)
ON CONFLICT (sku) DO UPDATE SET qty = stock.qty + EXCLUDED.qty;

INSERT INTO subscribers (email, name) VALUES ('ada@example.com', 'Ada')
ON CONFLICT (email) DO NOTHING;          -- PostgreSQL's INSERT IGNORE
```

SQL Server, Oracle and PostgreSQL 15+ also implement the standard `MERGE`:

```sql
MERGE INTO stock s
USING feed f ON s.sku = f.sku
WHEN MATCHED THEN UPDATE SET qty = f.qty
WHEN NOT MATCHED THEN INSERT (sku, qty) VALUES (f.sku, f.qty);
```

MySQL supports neither `ON CONFLICT` nor `MERGE`. In an interview, say which database you mean.

## Why not SELECT, then decide?

The intuitive version — `SELECT` the key, then `INSERT` if no row came back or `UPDATE` if one did — has a race. Two sessions run the SELECT at the same moment, both see nothing, both INSERT; one fails with a duplicate-key error, or, with no unique key, you now have two rows. A single upsert statement lets the database check and write atomically under the key's lock. If you must decide in the application, the unique key is still your safety net: catch the duplicate-key error and retry as an update.

## In the practice engine

The engine here runs `REPLACE INTO`, `INSERT IGNORE` and the two-step form, which is what the exercises judge. `ON DUPLICATE KEY UPDATE`, `ON CONFLICT` and `MERGE` are for reading — learn their shape and the differences above, which is what interviews ask about.

## Key takeaways

- An upsert needs a PRIMARY KEY or UNIQUE constraint to detect "already exists".
- `ON DUPLICATE KEY UPDATE` updates the existing row in place; `new.col` (or `VALUES(col)`) is the attempted value.
- `REPLACE` deletes and re-inserts: unlisted columns reset, triggers and cascades fire.
- `INSERT IGNORE` skips duplicates and keeps the existing row; watch its warnings.
- PostgreSQL: `ON CONFLICT ... DO UPDATE / DO NOTHING` with `EXCLUDED`; elsewhere `MERGE`.
- Portable: UPDATE the matches, then INSERT the rest with `NOT EXISTS`, in one transaction.
