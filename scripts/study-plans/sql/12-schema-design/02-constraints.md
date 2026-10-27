---
title: Constraints — the rules a table enforces
minutes: 15
seo-title: SQL Constraints: Primary Key vs Unique Key, NOT NULL and CHECK
description: Constraints make the database refuse bad data: PRIMARY KEY, UNIQUE, NOT NULL, DEFAULT, CHECK and FOREIGN KEY in MySQL, primary vs unique key, composite keys.
question: What are constraints in SQL?
answer: Constraints are rules declared on a table that the database enforces on every insert and update: PRIMARY KEY (unique and not null, one per table), UNIQUE (no duplicates), NOT NULL (a value is required), DEFAULT (the value when none is given), CHECK (a condition every row must meet) and FOREIGN KEY (the value must exist in another table). A statement that would break one is rejected.
q: What is the difference between a primary key and a unique key?
a: A table has exactly one primary key, it can never be NULL, and in InnoDB it is the clustered index that physically orders the rows. A table can have many unique keys, and a unique column may contain NULL, in MySQL any number of NULLs, because NULL is not equal to NULL. Both reject duplicate values and both create an index.
q: What is a composite primary key?
a: A primary key made of two or more columns, declared at table level as `PRIMARY KEY (student_id, course_id)`. The combination must be unique, while each column on its own may repeat. It is the natural key of a junction table, where it also stops the same pair being stored twice.
q: Does MySQL enforce CHECK constraints?
a: Yes, since MySQL 8.0.16. Earlier versions parsed CHECK clauses and silently ignored them, so a schema copied from an old server may contain checks that were never enforced. A CHECK condition that evaluates to NULL passes, so pair it with NOT NULL when the column is required.
q: What is the difference between a natural key and a surrogate key?
a: A natural key is a real-world value that already identifies the row, such as an ISBN or an email address. A surrogate key is an artificial identifier with no meaning, usually an AUTO_INCREMENT integer. Surrogates never change and keep foreign keys small, so most schemas use one as the primary key and put a UNIQUE constraint on the natural key.
---
A data type stops a date from landing in an integer column. **Constraints** go further: they state rules about values and rows — this column is required, no two rows share this email, a quantity is never negative, every order points at a real customer — and the database rejects any statement that would break them. Rules enforced in the schema hold for every application, script and late-night manual fix that touches the table, which rules in application code cannot promise. This lesson covers the six constraints, the primary key vs unique key question, composite keys, naming, and what happens when a rule is broken.

## NOT NULL and DEFAULT

```sql
CREATE TABLE products (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(80)  NOT NULL,
  price    DECIMAL(8,2) NOT NULL,
  in_stock INT          NOT NULL DEFAULT 0,
  notes    TEXT
);
```

`NOT NULL` makes a value required. Make it the default habit: a column should allow NULL only when "unknown" or "not applicable" is a real state for it, because every nullable column brings three-valued logic into every query that touches it. `DEFAULT` supplies the value when an INSERT omits the column (remember from the INSERT lesson that an explicit NULL is not "omitted"). `NOT NULL DEFAULT 0` together give a column that is always filled without every INSERT having to mention it.

## PRIMARY KEY

The primary key identifies each row. It is **unique and NOT NULL** by definition, and a table has **one**. In InnoDB it is also the **clustered index**: rows are stored in primary-key order, and every secondary index stores the primary key to find the row. That is why a short, never-changing, ever-increasing key (an `AUTO_INCREMENT` integer) suits InnoDB, and a random UUID string as primary key spreads inserts across the whole table.

A key on one column is written inline; on several columns it is a table constraint:

```sql
CREATE TABLE enrolments (
  student_id  INT  NOT NULL,
  course_id   INT  NOT NULL,
  enrolled_on DATE NOT NULL,
  PRIMARY KEY (student_id, course_id)
);
```

This **composite key** says that the pair is unique: a student can take many courses and a course has many students, but the same student cannot be enrolled in the same course twice. The order of the columns matters for the index (it can serve lookups by `student_id` alone, not by `course_id` alone — the indexes module explains why).

## UNIQUE

```sql
CREATE TABLE users (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  email    VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(30)  NOT NULL,
  phone    VARCHAR(20),
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_phone UNIQUE (phone)
);
```

`UNIQUE` forbids two rows with the same value (or the same combination, for `UNIQUE (a, b)`). Unlike the primary key, a table can have many, and a unique column **may be NULL** — and since NULL is not equal to NULL, MySQL and PostgreSQL allow any number of NULLs in a unique column (SQL Server allows one). So `phone` above may be missing for many users but never shared.

**Primary key vs unique key** — the interview answer in one breath: both reject duplicates and both build an index; a table has exactly one primary key but any number of unique keys; the primary key can never be NULL, a unique key can hold NULLs; in InnoDB the primary key is the clustered index that orders the table, a unique key is a secondary index; foreign keys normally reference the primary key.

## Natural and surrogate keys

An email address, an ISBN or a vehicle number is a **natural key**: the real world already guarantees it is unique. An `AUTO_INCREMENT` id is a **surrogate key**: meaningless, but stable. Natural keys change (people change email), can be long (every foreign key repeats them) and are sometimes less unique than promised. The common design is a surrogate primary key plus a UNIQUE constraint on the natural key — the database still refuses duplicates, and references stay small and permanent.

## CHECK

```sql
CREATE TABLE order_lines (
  order_id INT NOT NULL,
  line_no  INT NOT NULL,
  qty      INT NOT NULL CHECK (qty > 0),
  discount DECIMAL(4,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (order_id, line_no),
  CONSTRAINT chk_discount CHECK (discount BETWEEN 0 AND 0.5)
);
```

A `CHECK` constraint is a condition every row must satisfy. MySQL **enforces** them only since **8.0.16**; earlier versions accepted the syntax and ignored it, a fact that still trips teams on old servers. A check that evaluates to NULL passes — `CHECK (qty > 0)` lets a NULL qty through — so pair it with `NOT NULL` for required columns. Checks can compare columns of the same row (`CHECK (ends_on >= starts_on)`) but cannot query other tables.

## FOREIGN KEY

```sql
CREATE TABLE orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on   DATE NOT NULL,
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);
```

A foreign key says every `customer_id` must exist as a `customers.id`: InnoDB refuses an order for a missing customer and refuses deleting a customer who still has orders (or cascades, per the `ON DELETE` action). It is the subject of the relationships lesson. InnoDB requires an index on the referencing column and creates one if needed. (The practice engine here accepts foreign-key declarations but does not enforce them, so exercises never depend on a refusal.)

## Naming constraints and what a violation looks like

`CONSTRAINT name` before a constraint gives it a name you choose (`uq_users_email`, `chk_discount`, `fk_orders_customer`); unnamed ones get generated names. Named constraints make error messages readable and can be dropped by name in a migration (`ALTER TABLE users DROP INDEX uq_users_phone`, `ALTER TABLE order_lines DROP CHECK chk_discount`).

A statement that breaks a constraint fails with an error and changes nothing:

```text
ERROR 1062 (23000): Duplicate entry 'ada@example.com' for key 'users.email'
ERROR 1048 (23000): Column 'name' cannot be null
ERROR 3819 (HY000): Check constraint 'chk_discount' is violated.
ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails
```

Applications catch these — a duplicate-key error on signup becomes "that email is already registered" — rather than checking first and racing. And `INSERT IGNORE` turns duplicate and check violations into skipped rows, which is a quick way to load data through the table's rules.

## Key takeaways

- `NOT NULL` by default; `DEFAULT` fills omitted columns.
- One `PRIMARY KEY` per table: unique, never NULL, the clustered index in InnoDB; composite keys are declared at table level.
- `UNIQUE`: many per table, NULLs allowed (many of them in MySQL).
- Surrogate primary key plus UNIQUE natural key is the common design.
- `CHECK` is enforced from MySQL 8.0.16; NULL passes a check.
- `FOREIGN KEY ... REFERENCES` keeps references valid; name constraints so errors and migrations read well.
