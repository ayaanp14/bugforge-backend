---
title: Relationships and foreign keys
minutes: 15
seo-title: One-to-Many and Many-to-Many Relationships in SQL
description: How tables relate: one-to-one, one-to-many and many-to-many with a junction table, self-referencing keys, and FOREIGN KEY actions such as ON DELETE CASCADE.
question: How do you model a many-to-many relationship in SQL?
answer: With a junction table, also called a bridge or associative table, that holds a foreign key to each side, such as `enrolments(student_id, course_id)` between students and courses. Its primary key is the pair, so a student cannot be enrolled in the same course twice, and attributes of the relationship itself, such as the enrolment date or a grade, become columns of the junction table.
q: Where does the foreign key go in a one-to-many relationship?
a: On the "many" side. Each order belongs to one customer and a customer has many orders, so `orders` gets a `customer_id` column referencing `customers.id`. Putting a list of order ids on the customer row would break first normal form, and a column per order is impossible to bound.
q: What does ON DELETE CASCADE do?
a: It makes deleting a parent row automatically delete the child rows that reference it, for example deleting a customer deletes their orders. The alternatives are RESTRICT or NO ACTION, which refuse the delete while children exist and are the default, and SET NULL, which keeps the children and clears their foreign key.
q: How do you model a one-to-one relationship?
a: Put a foreign key on one table and make it UNIQUE, or share the primary key, as in `user_profiles(user_id PRIMARY KEY REFERENCES users(id))`. One-to-one tables are used to split rarely used or sensitive columns off a main table, or to model an optional extension of an entity.
q: What is a self-referencing foreign key?
a: A foreign key that points at the same table, such as `employees.manager_id` referencing `employees.id`. It models hierarchies: employees and managers, categories and subcategories, comments and replies. The top of the hierarchy has a NULL reference, and the tree is read with a self join or a recursive CTE.
---
Normalization splits data into tables; **relationships** are how the pieces connect again. A relationship is stored as a column in one table holding the key of a row in another — a **foreign key** — and the foreign-key constraint makes the database guarantee that the reference is valid. This lesson covers the three cardinalities (one-to-one, one-to-many, many-to-many), where the key goes in each, self-referencing tables, what `ON DELETE` and `ON UPDATE` actions do, and how to read a relationship back with joins.

## One-to-many

The most common shape. A customer has many orders; each order has one customer. The key goes on the **many** side:

```sql
CREATE TABLE customers (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL
);

CREATE TABLE orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on   DATE NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers (id)
);
```

Every order row names its customer. The reverse — a list of order ids in the customer row — would be a repeating group, breaking 1NF. `NOT NULL` on `customer_id` makes the relationship **mandatory** (an order must have a customer); a nullable foreign key makes it **optional** (a ticket may or may not have an assignee). Cardinality and optionality are the two questions to ask of every relationship.

Reading it back is a join, and a LEFT JOIN when the "one" side may have no children:

```sql
SELECT c.name, COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;
```

## Many-to-many

A student takes many courses; a course has many students. Neither table can hold the other's key, so a third table — a **junction** (bridge, associative, link) table — holds one row per pairing:

```sql
CREATE TABLE students (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(80) NOT NULL);
CREATE TABLE courses  (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(10) NOT NULL UNIQUE);

CREATE TABLE enrolments (
  student_id  INT  NOT NULL,
  course_id   INT  NOT NULL,
  enrolled_on DATE NOT NULL,
  grade       CHAR(2),
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students (id),
  FOREIGN KEY (course_id)  REFERENCES courses (id)
);
```

The composite primary key stops a duplicate pairing and indexes lookups by student; add an index on `course_id` for lookups the other way. Facts about the **pairing** itself — when the student enrolled, the grade — belong in the junction table, because they depend on both keys. A many-to-many relationship is really two one-to-many relationships meeting at the junction. Reading it back is two joins:

```sql
SELECT s.name, c.code
FROM enrolments e
JOIN students s ON s.id = e.student_id
JOIN courses  c ON c.id = e.course_id
ORDER BY s.name, c.code;
```

## One-to-one

Each user has at most one profile. Model it with a foreign key that is also unique — most simply, by making the child's primary key the foreign key:

```sql
CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,
  bio     TEXT,
  avatar  VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

Why not just put the columns in `users`? One-to-one splits are used for columns that are large or rarely read (kept off the hot table), for sensitive data with different access rules, and for optional extensions (only some users are sellers, so `seller_details` exists only for them). Without one of those reasons, one table is simpler.

## Self-referencing relationships

A foreign key can point at its own table, which models a hierarchy:

```sql
CREATE TABLE employees (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80) NOT NULL,
  manager_id INT,
  FOREIGN KEY (manager_id) REFERENCES employees (id)
);
```

The head of the company has `manager_id` NULL. One level is read with a self join (`LEFT JOIN employees m ON m.id = e.manager_id`); the whole tree with a recursive CTE, as in the CTE module. Categories with subcategories, threaded comments and bill-of-materials parts are the same shape.

## Foreign key actions

When a referenced row is deleted or its key changes, the constraint's actions decide what happens to the rows that reference it:

```sql
FOREIGN KEY (customer_id) REFERENCES customers (id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE
```

| Action | On the parent's delete or key change |
| --- | --- |
| `RESTRICT` / `NO ACTION` | refused while children reference it (the default) |
| `CASCADE` | the change follows: children deleted, or their key updated |
| `SET NULL` | children kept, their foreign key set to NULL (column must be nullable) |
| `SET DEFAULT` | parsed by MySQL but rejected by InnoDB |

Choose per relationship. Order lines belong to their order: `ON DELETE CASCADE`. Orders are financial records that must be kept: `RESTRICT`, so a customer with orders cannot be deleted by accident. A ticket's assignee leaves: `SET NULL`. `ON UPDATE CASCADE` matters only if keys change, which surrogate keys never do.

Facts about InnoDB foreign keys interviewers like: both columns must have compatible types (an `INT` cannot reference a `BIGINT UNSIGNED`); the referenced column must be indexed, usually the primary key; InnoDB adds an index on the referencing column if none exists; and `SET FOREIGN_KEY_CHECKS = 0` turns checking off for a session, which bulk loads use and which can leave orphans behind. The practice engine here accepts the declarations but does not enforce them, so these exercises keep references valid themselves.

## Polymorphic references: a warning

A `comments` table with `target_type` ('post' or 'photo') and `target_id` cannot have a foreign key — the id points into different tables depending on the type — so the database cannot keep it valid. Prefer one nullable foreign key per possible parent (`post_id`, `photo_id`, with a CHECK that exactly one is set), or a junction table per parent type.

## Key takeaways

- One-to-many: the foreign key goes on the many side; NOT NULL makes it mandatory.
- Many-to-many: a junction table with a composite primary key and the pairing's own attributes.
- One-to-one: a unique foreign key, often the child's primary key; use it for a reason.
- Self-references model hierarchies; the root has NULL.
- `ON DELETE RESTRICT | CASCADE | SET NULL` per relationship; RESTRICT is the default.
- Polymorphic id columns cannot be foreign keys; avoid them.
