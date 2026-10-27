---
title: Checkpoint — Foundations
minutes: 25
seo-title: SQL Basics Quiz: Databases, SELECT and Query Order Practice
description: Test yourself: 12 questions and three queries on relational tables, keys, SQL statement families, MySQL dialects, SELECT and the order clauses run in.
q: Why can a column alias be used in ORDER BY but not in WHERE?
a: The clauses are evaluated in a logical order: FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT. WHERE runs before SELECT has created the alias, so the alias is unknown there; ORDER BY runs after, so it can use it.
q: What makes a column a good primary key?
a: Its value must be unique in every row and never NULL, and it should never change, because other tables store it as a foreign key. A surrogate integer `id` assigned by the database meets all three, which is why it is the usual choice.
q: What does `'a' || 'b'` return in MySQL?
a: It returns 0, because in MySQL's default mode `||` is the logical OR operator and both strings convert to the number 0. Use `CONCAT('a', 'b')` to join strings in MySQL; `||` concatenates in PostgreSQL, SQLite and Oracle.
---
This checkpoint covers the whole module: what a relational database is — tables, typed columns, rows without order, primary and foreign keys — and what the DBMS does; SQL as a declarative language and its statement families; MySQL beside PostgreSQL, SQLite and SQL Server; the basic `SELECT`; and the logical order in which a query's clauses are evaluated.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What are a row, a column and a table's schema, and why does a table have no row order?
- What two properties must a primary key have, and what does a foreign key point at?
- Name the five statement families and one statement from each.
- Why does `SELECT name city FROM students` run without an error, and what does it return?
- How do MySQL, SQL Server and the SQL standard each take the first three rows?
- How do you join two strings in MySQL, and what does `||` do there?
- In what order are `FROM`, `WHERE`, `SELECT`, `ORDER BY` and `LIMIT` evaluated, and what follows for aliases?
- What is wrong with `SELECT *` in application code?

The three queries are a whole table read back in a fixed order, a list of chosen columns with a literal and a computed column beside them, and a filtered list ordered by a computed alias with a tie-breaker.
