---
title: Your first SELECT — columns, tables and order
minutes: 13
seo-title: SQL SELECT Statement Basics: SELECT, FROM and SELECT All
description: How the SQL SELECT statement reads a table: naming columns, selecting every column and why to avoid it in code, SELECT without FROM, and ORDER BY.
question: How do you write a basic SQL SELECT query?
answer: A basic SELECT names the columns to return and the table to read them from: `SELECT name, city FROM students;`. Use `*` for every column, separate column names with commas, and add `ORDER BY` with a column when the order of the rows matters, because a table has no order of its own. The result is itself a table of rows and columns.
q: What does SELECT * mean in SQL?
a: `SELECT *` returns every column of the table, in the order the table defines them. It is handy for exploring data, but application code should list the columns it needs, because `*` fetches unused data and changes silently when someone adds, drops or reorders a column.
q: Can you SELECT without a FROM clause?
a: Yes, in MySQL, PostgreSQL, SQLite and SQL Server: `SELECT 2 + 3 AS total;` returns one row computed from literals. Oracle requires `FROM dual`, and MySQL also accepts `FROM DUAL`. It is useful for testing an expression or a function.
q: Why does my SELECT return rows in a different order each time?
a: Because a table has no inherent order and SQL guarantees none without `ORDER BY`. The engine returns rows in whatever order is cheapest, which can change after inserts, deletes or a new index. Add `ORDER BY` with enough columns to break every tie.
q: Does the order of columns in SELECT matter?
a: It decides the order of the columns in the result and nothing else. `SELECT city, name` and `SELECT name, city` return the same rows with the columns swapped, and neither has to follow the order in which the table declares them.
---
Every question you will ever ask a database starts with the same word. `SELECT` reads rows from tables and returns a result — itself a small table of rows and columns. This lesson writes the simplest useful queries: picking columns, taking all of them, computing a value with no table at all, and asking for a dependable order. Everything else in SQL is added on top of this shape.

## The shape of a SELECT

```sql
SELECT name, city
FROM students;
```

Two clauses: `SELECT` lists **what** to return — here two columns — and `FROM` names **where** to read it. The result has exactly the columns you listed, in the order you listed them, and one row for each row of the table:

```text
name | city
Asha | Pune
Ravi | Chennai
Meera | Pune
```

The columns are separated by **commas**, and a missing or extra comma is the commonest first error:

```sql
SELECT name city FROM students;    -- no comma: one column "name", renamed to "city"!
SELECT name, city, FROM students;  -- trailing comma: syntax error
```

The first is worse than an error: it runs. A name after an expression with no comma is read as an **alias** (the next module explains them), so the result has one column called `city` holding names.

## Picking and ordering columns

You may list any of the table's columns, in any order, and the same column more than once:

```sql
SELECT city, name FROM students;
SELECT name, name, year FROM students;
```

The table's own column order is irrelevant to the result. A table with forty columns is routinely queried for three of them — and reading fewer columns is less work for the database and the network.

## SELECT *

The star means **every column, in the table's order**:

```sql
SELECT * FROM students;
```

```text
id | name | year | city
1 | Asha | 2 | Pune
2 | Ravi | 1 | Chennai
3 | Meera | 3 | Pune
```

Use it to explore a table you do not know. Avoid it in code that other code depends on:

- it reads columns nobody uses, which costs I/O and network, and prevents some index-only plans;
- when a column is added, dropped or reordered, the result changes shape and code that reads columns by position breaks;
- it hides intent — a reviewer cannot see which data the query needs.

Interviewers like asking "what is wrong with `SELECT *`?" — those three points are the answer.

## Ordering the rows

A table is a set; it has **no row order**. If you run `SELECT * FROM students` twice you will probably see the same order, because the engine happens to read the rows the same way — but nothing promises it, and after a few deletes and inserts, or with a new index, the order changes. When order matters, say so:

```sql
SELECT name, year FROM students ORDER BY name;
```

```text
name | year
Asha | 2
Meera | 3
Ravi | 1
```

`ORDER BY` comes **after** `FROM` (and after `WHERE`, once there is one). It sorts ascending by default — numbers small to large, text A to Z, dates old to new; add `DESC` for descending:

```sql
SELECT name, year FROM students ORDER BY year DESC;
```

You may order by a column you did not select, and by several columns — the second breaks ties in the first:

```sql
SELECT name FROM students ORDER BY city, name;
```

Module 3 covers sorting in depth. For now, one rule that every exercise in the course relies on: **if the output is printed or compared, the query ends in an `ORDER BY` that fixes the order completely** — ordering by the primary key is the simplest way to guarantee that.

## SELECT without a table

`SELECT` can compute values from nothing:

```sql
SELECT 2 + 3 AS total, 'hello' AS greeting;
```

```text
total | greeting
5 | hello
```

One row, computed from literals. It is the quickest way to try out an expression or a function. MySQL, PostgreSQL, SQLite and SQL Server accept it as written; Oracle needs a table and supplies the one-row dummy table `DUAL` (`SELECT 2 + 3 FROM dual`), which MySQL also accepts for compatibility.

## Mixing columns and values

A select list can hold any mix of columns, literals and expressions:

```sql
SELECT name, 'student' AS role, year + 1 AS next_year
FROM students
ORDER BY id;
```

```text
name | role | next_year
Asha | student | 3
Ravi | student | 2
Meera | student | 4
```

The literal `'student'` is repeated on every row; `year + 1` is computed per row. The stored data is untouched — `SELECT` only reads. Expressions get a lesson of their own in the next module.

## Qualified names

A column can be written with its table in front:

```sql
SELECT students.name, students.city FROM students;
```

With one table it changes nothing. With two tables in a join, both of which might have a `name` column, the prefix is how you say which one you mean — and a short **table alias** (`FROM students AS s`, then `s.name`) keeps it readable. You will meet that in the joins module.

## Formatting habits

Write a clause per line, keywords in capitals, a column per line once there are more than three or four:

```sql
SELECT id,
       name,
       city
FROM   students
ORDER  BY id;
```

The database does not care. Your colleagues, your future self and your interviewer do, and the clause-per-line layout makes the next lesson's subject — the order in which clauses run — easy to see.

## Reading an error

Typical first-week errors and what they mean:

- `Unknown column 'nmae' in 'field list'` — a typo in a column name, or a column of another table.
- `Table 'school.student' doesn't exist` — the table name is wrong (`students`, plural).
- `You have an error in your SQL syntax … near 'FROM students'` — usually a trailing comma or a missing one just before the quoted text.

The quoted fragment is where the parser gave up; the mistake is usually just **before** it.

## Key takeaways

- `SELECT columns FROM table` returns those columns for every row; the result is a table.
- Separate columns with commas; a missing comma silently turns the next name into an alias.
- `SELECT *` is for exploring; list columns in code.
- Rows have **no order** without `ORDER BY`; `DESC` reverses; a second column breaks ties.
- `SELECT` can compute from literals with no table; Oracle needs `FROM dual`.
- Literals and expressions can sit beside columns; `SELECT` never changes the data.
