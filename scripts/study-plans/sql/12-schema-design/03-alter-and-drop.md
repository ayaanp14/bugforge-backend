---
title: ALTER TABLE and DROP — changing a schema
minutes: 14
seo-title: MySQL ALTER TABLE: Add, Rename, Modify and Drop Columns
description: ALTER TABLE changes an existing table: add, rename, modify and drop columns, rename tables, add constraints later, and run schema migrations safely.
question: How do you add a column to an existing table in MySQL?
answer: Use `ALTER TABLE table_name ADD COLUMN column_name type [constraints];`, for example `ALTER TABLE customers ADD COLUMN phone VARCHAR(20);`. Existing rows get the column's DEFAULT, or NULL when there is none, so a new NOT NULL column needs a DEFAULT. MySQL also accepts `AFTER other_column` or `FIRST` to choose the column's position.
q: What is the difference between MODIFY and CHANGE in MySQL ALTER TABLE?
a: Both redefine a column. `MODIFY col new_definition` keeps the name and changes the type or constraints. `CHANGE old_name new_name definition` can also rename it, so the full definition must be repeated. `RENAME COLUMN old TO new`, available since MySQL 8.0, renames without restating the type.
q: How do you rename a table in MySQL?
a: Use `RENAME TABLE old_name TO new_name;` or `ALTER TABLE old_name RENAME TO new_name;`. RENAME TABLE can rename several tables in one atomic statement, which is how a rebuilt table is swapped in for the old one without a moment where neither exists.
q: How do you add a NOT NULL column to a table that already has rows?
a: Either give it a DEFAULT, so existing rows receive that value, or add it as nullable, fill it with an UPDATE that computes the right value per row, and then tighten it with `ALTER TABLE ... MODIFY col type NOT NULL`. The second path, add then backfill then constrain, is the standard migration pattern.
q: Is ALTER TABLE safe to run on a large production table?
a: It depends on the change. MySQL 8 performs many alterations online or instantly, such as adding a column at the end, but some changes, like a column type change, rebuild and copy the table, which takes time and I/O on a large table. Check the algorithm first, schedule heavy changes, and remember ALTER commits implicitly.
---
Schemas change as the application does: a new feature needs a column, a name turns out to be wrong, an old flag is retired. `ALTER TABLE` changes a table's structure in place, keeping its data; `DROP` removes a table (or view, or index) entirely. This lesson covers adding, renaming, redefining and dropping columns, renaming tables, adding and dropping constraints, and the migration habits — add, backfill, constrain; re-runnable scripts; one change at a time — that keep schema changes from becoming outages.

## Adding columns

```sql
ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN tier VARCHAR(10) NOT NULL DEFAULT 'basic';
ALTER TABLE customers ADD COLUMN middle_name VARCHAR(50) AFTER first_name;   -- MySQL: position
```

Existing rows receive the column's default, or NULL if it has none. That is why adding a `NOT NULL` column **without** a default fails on a non-empty table in strict mode — there is no value to give the old rows. Several changes can go in one statement, separated by commas (`ALTER TABLE t ADD COLUMN a INT, ADD COLUMN b INT;`), and MySQL then rebuilds the table at most once. `AFTER col` and `FIRST` place the column; without them it goes last. Column order has no effect on queries that name their columns, only on `SELECT *` output.

## Backfilling: add, fill, constrain

When the new column's value depends on the row, the safe sequence is three steps:

```sql
ALTER TABLE customers ADD COLUMN full_name VARCHAR(101);           -- 1. add, nullable

UPDATE customers                                                   -- 2. backfill
SET full_name = CONCAT_WS(' ', first_name, last_name);

ALTER TABLE customers MODIFY full_name VARCHAR(101) NOT NULL;      -- 3. constrain
```

Step 3 fails if step 2 missed a row, which is exactly the check you want. On a big table, step 2 runs in batches. This pattern — expand, migrate data, then contract — is how teams change schemas without downtime: the application is first changed to write both the old and new shape, data is migrated, and only then is the old column removed.

## Renaming and redefining columns

```sql
ALTER TABLE customers RENAME COLUMN phone TO phone_number;                 -- MySQL 8.0+
ALTER TABLE customers MODIFY phone_number VARCHAR(30) NOT NULL DEFAULT '';  -- new definition, same name
ALTER TABLE customers CHANGE phone_number mobile VARCHAR(30);              -- rename and redefine
```

`RENAME COLUMN` changes only the name. `MODIFY` replaces the column's whole definition — type, nullability, default — so anything you leave out is lost (forgetting `NOT NULL` in a MODIFY makes the column nullable again). `CHANGE` is the older form that renames and redefines at once, requiring the full definition. Narrowing a type (`VARCHAR(100)` to `VARCHAR(20)`, `BIGINT` to `INT`) fails in strict mode if existing data does not fit — check with a query such as `SELECT MAX(CHAR_LENGTH(col))` first. PostgreSQL spells these `ALTER COLUMN col TYPE ...`, `ALTER COLUMN col SET NOT NULL` and `RENAME COLUMN`. (In this course's practice engine, `ADD COLUMN`, `RENAME COLUMN`, `DROP COLUMN` and `RENAME TO` run; `MODIFY` and `CHANGE` are for reading.)

## Dropping columns

```sql
ALTER TABLE customers DROP COLUMN legacy_flag;
```

The column and its data are gone; there is no undo except a backup. Before dropping, make sure nothing reads it — views, reports, other services. A safer rollout first stops the application from using the column, waits a release, then drops it. MySQL also drops any index that consisted only of that column.

## Renaming tables

```sql
ALTER TABLE tbl_users RENAME TO users;
RENAME TABLE users TO users_old, users_new TO users;     -- MySQL: several, atomically
```

`RENAME TABLE` can rename several tables in one atomic step, which is how a table rebuilt offline (`users_new`) replaces the live one: there is no instant at which `users` does not exist. Foreign keys follow the renamed table; views that name the old table do not and must be recreated.

## Constraints and indexes after the fact

```sql
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers (id);
ALTER TABLE order_lines ADD CONSTRAINT chk_qty CHECK (qty > 0);
ALTER TABLE users DROP INDEX uq_users_email;
ALTER TABLE orders DROP FOREIGN KEY fk_orders_customer;
ALTER TABLE users ADD INDEX ix_users_created (created_at);
```

Adding a constraint validates the existing rows: a UNIQUE fails if duplicates already exist, a CHECK if any row breaks it. So clean the data first — find duplicates with `GROUP BY email HAVING COUNT(*) > 1`, fix or remove them, then add the constraint.

## DROP TABLE, DROP VIEW, DROP INDEX

```sql
DROP TABLE IF EXISTS staging_import;
DROP VIEW IF EXISTS v_active_users;
DROP INDEX ix_users_created ON users;
```

`DROP TABLE` removes the structure, data, indexes and triggers of a table. Recall the comparison from the DELETE lesson: DELETE removes rows, TRUNCATE removes all rows and keeps the table, DROP removes the table. InnoDB refuses to drop a table that another table's foreign key references until the key is dropped. `IF EXISTS` makes the statement safe to re-run.

## How ALTER behaves on a live table

In MySQL, every `ALTER TABLE` commits any open transaction implicitly and briefly takes a metadata lock on the table. Beyond that, the cost depends on the change: MySQL 8 adds a column at the end **instantly** (`ALGORITHM=INSTANT`, a metadata change only), many index changes run **in place** while reads and writes continue, and some changes — a column type change, a new primary key — **copy** the whole table, which on a large table takes a long time and doubles its disk use. You can ask for an algorithm and get an error instead of a surprise: `ALTER TABLE t ADD COLUMN c INT, ALGORITHM=INSTANT;`. Very large tables are often changed with online schema-change tools that build a copy in the background and swap it in with `RENAME TABLE`.

## Migration habits

- Keep schema changes in versioned scripts (migrations) run in order, never as hand edits on production.
- Make each script re-runnable or guarded: `IF EXISTS`, `IF NOT EXISTS`.
- One logical change per migration; add, backfill, then constrain.
- Never drop or rename what running code still reads.
- Test the migration on a copy of production-sized data to learn how long it takes.

## Key takeaways

- `ADD COLUMN` gives old rows the default or NULL; a NOT NULL column needs a default or a backfill.
- Add nullable → backfill with UPDATE → `MODIFY ... NOT NULL` is the standard migration.
- `RENAME COLUMN` renames; `MODIFY` redefines (restate everything); `CHANGE` does both.
- `DROP COLUMN` and `DROP TABLE` destroy data; `IF EXISTS` keeps scripts re-runnable.
- `RENAME TABLE a TO b, c TO a` swaps tables atomically.
- Adding a constraint validates existing rows; clean the data first.
