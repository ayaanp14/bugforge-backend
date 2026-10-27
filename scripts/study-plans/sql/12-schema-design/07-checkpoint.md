---
title: Checkpoint — Schema design
minutes: 25
seo-title: SQL Schema Design Quiz: Keys, Normal Forms and Views Practice
description: Test yourself: 12 questions and three scripts on CREATE TABLE, data types, constraints, ALTER TABLE, normalization from 1NF to BCNF, foreign keys and views.
q: What is the difference between a primary key and a unique key?
a: A table has one primary key, which is never NULL and in InnoDB is the clustered index ordering the rows. It can have many unique keys, which also reject duplicates but may hold NULLs, any number of them in MySQL.
q: Which normal form does a partial dependency break?
a: Second normal form. A partial dependency is a non-key column that depends on only part of a composite key, such as a product name in an order-lines table keyed by order and product. Moving it to a products table fixes it.
q: Does a view store data?
a: No. A view stores its SELECT, and each read runs that query on the current base tables, so it is always up to date and takes no space. A materialized view, available in PostgreSQL and Oracle but not MySQL, is the kind that stores its result.
---
This checkpoint covers the whole module: `CREATE TABLE` and choosing types (integers, `DECIMAL` for money, `VARCHAR` and `CHAR`, `DATE`, `DATETIME` and `TIMESTAMP`, `BOOLEAN`), `CREATE TABLE ... AS SELECT`; the constraints `NOT NULL`, `DEFAULT`, `PRIMARY KEY`, `UNIQUE`, `CHECK` and `FOREIGN KEY`; `ALTER TABLE` and `DROP`; normalization from 1NF to BCNF; one-to-many, many-to-many and self-referencing relationships with their `ON DELETE` actions; and views.

**How it works.** Twelve questions and three scripts. You need 70% on the questions and every script accepted to clear the module. You can retake it as often as you like; your best score counts. Each script builds or changes a schema and ends with the SELECT that shows the result.

**Before you start**, make sure you can answer these from memory:

- Why is money stored as `DECIMAL` and not `FLOAT`, and what does `BOOLEAN` really mean in MySQL?
- What does `CREATE TABLE ... AS SELECT` copy, and what does it leave behind?
- Primary key vs unique key: how many per table, and which may hold NULL?
- How do you add a NOT NULL column to a table that already has rows?
- What do 1NF, 2NF, 3NF and BCNF each forbid?
- Where does the foreign key go in a one-to-many relationship, and how is many-to-many stored?
- What is the difference between a view and a table, and how do you change a view's definition?

The three scripts are a library schema built from a flat loan log, a migration that adds, backfills and renames columns, and a reporting view over a many-to-many relationship.
