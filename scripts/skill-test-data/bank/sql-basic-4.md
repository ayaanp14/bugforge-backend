---
skill: sql
level: basic
---

## sql-basic-076
topic: nulls
answer: D

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 200 |
| 2 | 2 | 350 |

```sql
-- Query 1
SELECT SUM(amount) FROM orders WHERE customer_id = 99;
-- Query 2
SELECT COALESCE(SUM(amount), 0) FROM orders WHERE customer_id = 99;
```

What does each query return?

- A: `0` and `0`
- B: No rows from either query
- C: `NULL` and `NULL`
- D: `NULL` and `0`

> No order belongs to customer 99. An aggregate without `GROUP BY` still returns
> one row, and `SUM` over no rows is NULL, not 0 (`COUNT` is the aggregate that
> returns 0). `COALESCE` replaces that NULL with 0, which is the usual way to
> report "nothing" as zero.

## sql-basic-077
topic: ddl-constraints
answer: A

```sql
CREATE TABLE users (
  id   INT PRIMARY KEY,
  name VARCHAR(50)
);

INSERT INTO users VALUES (1, 'Asha');
INSERT INTO users VALUES (2, 'Ravi');
INSERT INTO users VALUES (1, 'Meera');
```

The statements run one at a time with autocommit on. What does `users` hold afterwards?

- A: `(1, 'Asha'), (2, 'Ravi')`
- B: `(1, 'Meera'), (2, 'Ravi')`
- C: `(1, 'Asha'), (2, 'Ravi'), (1, 'Meera')`
- D: Nothing: the failed insert undoes the two before it.

> A primary key must be unique, so the third insert fails with a duplicate-key
> error. A plain `INSERT` never overwrites the existing row (that would take an
> explicit upsert), and with autocommit on the first two inserts were already
> committed as separate transactions, so the failure does not undo them.

## sql-basic-078
topic: ddl-constraints
answer: D

```sql
CREATE TABLE codes (
  code  VARCHAR(10) PRIMARY KEY,
  label VARCHAR(50)
);

INSERT INTO codes (code, label) VALUES (NULL, 'unknown');
```

What happens in MySQL 8 and PostgreSQL?

- A: The row is stored with a NULL `code`.
- B: The row is stored; a second NULL `code` would be rejected.
- C: The row is stored with an empty string as its `code`.
- D: The insert fails: a primary key column cannot hold NULL.

> `PRIMARY KEY` means unique and `NOT NULL`. Every row must be identifiable by
> its key, so both databases reject the insert with a not-null error. An empty
> string is a value, not NULL, and neither database substitutes one here.

## sql-basic-079
topic: ddl-constraints
answer: C

```sql
CREATE TABLE members (
  id    INT PRIMARY KEY,
  email VARCHAR(100) UNIQUE
);

INSERT INTO members VALUES (1, 'a@x.com');
INSERT INTO members VALUES (2, NULL);
INSERT INTO members VALUES (3, NULL);
INSERT INTO members VALUES (4, 'a@x.com');
```

The statements run one at a time with autocommit on. How many rows does `members` hold afterwards in MySQL 8 and PostgreSQL?

- A: `1 row`
- B: `2 rows`
- C: `3 rows`
- D: `4 rows`

> A `UNIQUE` column may hold NULL, and because NULL is not equal to NULL, two
> NULLs do not count as duplicates: rows 2 and 3 are both accepted. Row 4
> repeats `a@x.com` and is rejected. That leaves 3 rows. (Unlike a primary key,
> `UNIQUE` does not imply `NOT NULL`.)

## sql-basic-080
topic: ddl-constraints
answer: A, D

```sql
CREATE TABLE products (
  id    INT PRIMARY KEY,
  name  VARCHAR(50) NOT NULL,
  price INT
);
```

Each `INSERT` below runs on its own against the empty table. Select all that apply: which of them succeed?

- A: `INSERT INTO products VALUES (1, 'Pen', NULL)`
- B: `INSERT INTO products VALUES (2, NULL, 50)`
- C: `INSERT INTO products VALUES (NULL, 'Ink', 20)`
- D: `INSERT INTO products VALUES (3, '', 40)`

> A succeeds: `price` has no `NOT NULL`, so it may be NULL. B fails because
> `name` is `NOT NULL`. C fails because a primary key column cannot be NULL.
> D succeeds: an empty string is a real value, not NULL, so it satisfies
> `NOT NULL`.

## sql-basic-081
topic: ddl-constraints
answer: B

```sql
CREATE TABLE tasks (
  id       INT PRIMARY KEY,
  title    VARCHAR(100) NOT NULL,
  status   VARCHAR(20) DEFAULT 'open',
  priority INT
);

INSERT INTO tasks (id, title) VALUES (1, 'Write report');

SELECT status, priority FROM tasks WHERE id = 1;
```

What does the `SELECT` return?

- A: `(NULL, NULL)`
- B: `('open', NULL)`
- C: `('open', 0)`
- D: `('', 0)`

> A column left out of the `INSERT` gets its default. `status` declares
> `DEFAULT 'open'`. `priority` declares none, and a nullable column with no
> declared default defaults to NULL, not to 0.

## sql-basic-082
topic: ddl-constraints
answer: C

```sql
CREATE TABLE tasks (
  id       INT PRIMARY KEY,
  title    VARCHAR(100) NOT NULL,
  status   VARCHAR(20) DEFAULT 'open',
  priority INT
);

INSERT INTO tasks (id, title, status) VALUES (2, 'Fix bug', NULL);

SELECT status FROM tasks WHERE id = 2;
```

What does the `SELECT` return?

- A: `'open'`
- B: `''`
- C: `NULL`
- D: The insert fails: a column with a DEFAULT cannot be set to NULL.

> A default is used only when the column is left out of the `INSERT` (or given
> the keyword `DEFAULT`). Here `status` is listed and explicitly given NULL, and
> the column allows NULL, so NULL is stored. To get `'open'`, omit the column.

## sql-basic-083
topic: ddl-constraints
answer: D

```sql
CREATE TABLE departments (
  id   INT PRIMARY KEY,
  name VARCHAR(50)
);

CREATE TABLE employees (
  id      INT PRIMARY KEY,
  name    VARCHAR(50),
  dept_id INT,
  FOREIGN KEY (dept_id) REFERENCES departments (id)
);
```

`departments` holds `(1, 'Sales')` and `(2, 'HR')`; `employees` is empty. Which of these inserts fails?

- A: `INSERT INTO employees VALUES (10, 'Asha', 1)`
- B: `INSERT INTO employees VALUES (11, 'Ravi', NULL)`
- C: `INSERT INTO employees VALUES (12, 'Kabir', 2)`
- D: `INSERT INTO employees VALUES (13, 'Meera', 3)`

> A foreign key value must match an existing key in the referenced table, and no
> department has id 3, so D is rejected. A NULL foreign key is allowed: it means
> "no department" and is not checked, so B succeeds. (In MySQL this needs the
> default InnoDB engine, which enforces foreign keys.)

## sql-basic-084
topic: ddl-constraints
answer: B

```sql
CREATE TABLE departments (
  id   INT PRIMARY KEY,
  name VARCHAR(50)
);

CREATE TABLE employees (
  id      INT PRIMARY KEY,
  name    VARCHAR(50),
  dept_id INT,
  FOREIGN KEY (dept_id) REFERENCES departments (id)
);
```

`departments` holds `(1, 'Sales')` and `(2, 'HR')`; `employees` holds `(10, 'Asha', 1)`. Then:

```sql
DELETE FROM departments WHERE id = 1;
```

What happens?

- A: Department 1 and Asha's row are both deleted.
- B: The delete fails: Asha's row still refers to department 1.
- C: Department 1 is deleted, and Asha's `dept_id` is set to NULL.
- D: Department 1 is deleted and Asha's `dept_id` stays 1.

> With no `ON DELETE` clause, the foreign key refuses to delete a parent row that
> child rows still refer to, so the statement fails and nothing changes.
> Deleting the children too needs `ON DELETE CASCADE` (option A), and clearing
> the reference needs `ON DELETE SET NULL` (option C). Option D would leave a
> broken reference, which is what the constraint exists to prevent.

## sql-basic-085
topic: ddl-constraints
answer: A

```sql
CREATE TABLE orders (
  id       INT PRIMARY KEY,
  customer VARCHAR(50)
);

CREATE TABLE order_items (
  id       INT PRIMARY KEY,
  order_id INT,
  FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);
```

`orders` holds `(1, 'Asha')` and `(2, 'Ravi')`; `order_items` holds `(10, 1)`, `(11, 1)` and `(12, 2)`. Then:

```sql
DELETE FROM orders WHERE id = 1;
SELECT COUNT(*) FROM order_items;
```

What does the `SELECT` return?

- A: `1`
- B: `0`
- C: `3`
- D: The `DELETE` fails, because order 1 still has items.

> `ON DELETE CASCADE` deletes the child rows along with their parent, so removing
> order 1 also removes items 10 and 11. Item 12 belongs to order 2 and stays:
> one row. Without `CASCADE` the delete would have been refused (option D).

## sql-basic-086
topic: ddl-constraints
answer: B

```sql
CREATE TABLE enrolments (
  student_id INT,
  course_id  INT,
  PRIMARY KEY (student_id, course_id)
);

INSERT INTO enrolments VALUES (1, 10);
INSERT INTO enrolments VALUES (1, 20);
INSERT INTO enrolments VALUES (2, 10);
INSERT INTO enrolments VALUES (1, 10);
```

The statements run one at a time with autocommit on. How many rows does `enrolments` hold afterwards?

- A: `4 rows`
- B: `3 rows`
- C: `2 rows`
- D: `1 row`

> A composite primary key requires the combination of its columns to be unique,
> not each column on its own. Student 1 may appear twice and course 10 may
> appear twice; only the fourth insert repeats an existing pair, (1, 10), and
> fails. Three rows remain.

## sql-basic-087
topic: normalization
answer: C

Table `order_items`, whose primary key is (`order_id`, `product_id`):

| order_id | product_id | quantity | product_name |
| --- | --- | --- | --- |
| 1 | 10 | 2 | Gel pen |
| 2 | 10 | 1 | Gel pen |
| 3 | 10 | 4 | Gel pen |

Product 10 is renamed, so its name has to be changed in every row that mentions it. What is this problem called, and what removes it?

- A: A deletion anomaly; declare `product_name` as NOT NULL in this table.
- B: An insert anomaly; add an index on the `product_name` column.
- C: An update anomaly; store `product_name` once, in a `products` table.
- D: An update anomaly; add `product_name` to the table's primary key.

> Repeating a fact in many rows means one change must be made in many places,
> and missing one leaves the product with two names: an update anomaly. The cure
> is normalization: `product_name` depends only on `product_id`, so it belongs
> in a `products` table with one row per product. Adding it to the key (D) keeps
> the repetition.

## sql-basic-088
topic: indexes
answer: B

The `customers` table has two million rows. An index is created on its `email` column, and the application then runs this query:

```sql
SELECT * FROM customers WHERE email = 'asha@mail.com';
```

What does the index change?

- A: Every query on `customers` now runs faster, whatever it filters on.
- B: The database can find the matching rows without reading every row.
- C: The query's result is saved and returned from memory on the next run.
- D: No two customers can now share the same email address.

> An index is a sorted lookup structure on the column, so the database can jump
> to the rows with that email instead of scanning all two million. It changes
> how fast the rows are found, never which rows the query returns, and it only
> helps queries that search on `email`. Only a `UNIQUE` index or constraint
> would forbid duplicates, and an index is not a result cache.

## sql-basic-089
topic: indexes
answer: A

A table gets three more indexes on different columns. Which work becomes slower because of them?

- A: Inserting a new row into the table.
- B: A `SELECT` that filters on one of the newly indexed columns.
- C: A `SELECT` that looks up a single row by its primary key.
- D: None: an index only ever makes statements faster.

> Every index is a separate structure that must be kept in step with the table,
> so each `INSERT` (and each `UPDATE` or `DELETE` touching indexed columns) does
> extra work for every index, and the indexes take extra storage. Reads that
> filter on an indexed column can get faster; a primary-key lookup is unaffected.

## sql-basic-090
topic: indexes
answer: B, C

```sql
CREATE TABLE accounts (
  id       INT PRIMARY KEY,
  username VARCHAR(30) UNIQUE,
  city     VARCHAR(30) NOT NULL,
  plan     VARCHAR(10) DEFAULT 'free'
);
```

Select all that apply: for which columns does this statement create an index automatically, in both MySQL 8 and PostgreSQL?

- A: `city`
- B: `id`
- C: `username`
- D: `plan`

> Both databases enforce `PRIMARY KEY` and `UNIQUE` constraints with an index,
> so `id` and `username` get one automatically. `NOT NULL` and `DEFAULT` are
> checks on values and create no index; `city` and `plan` are indexed only if
> you create an index yourself.
