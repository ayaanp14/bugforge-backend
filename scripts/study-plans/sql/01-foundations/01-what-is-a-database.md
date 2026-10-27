---
title: What a database is — tables, rows and keys
minutes: 13
seo-title: What Is a Relational Database? Tables, Rows and Keys
description: A relational database stores data in tables of rows and columns, tied together by primary and foreign keys. What a DBMS does, and why not a spreadsheet.
question: What is a relational database?
answer: A relational database stores data in tables, where each row is one record and each column one attribute with a fixed type. Every table has a primary key that identifies each row uniquely, and foreign keys link rows across tables. A database management system such as MySQL stores the tables, enforces the rules and answers SQL queries.
q: What is the difference between a database and a DBMS?
a: The database is the data itself, organised as tables. The database management system (DBMS) is the software that stores those tables on disk, checks the rules declared on them, runs queries and keeps many users from corrupting each other's work. MySQL, PostgreSQL, SQLite and SQL Server are DBMSs.
q: What is a primary key?
a: A primary key is a column, or set of columns, whose value is unique and never NULL in every row of a table, so it identifies exactly one row. An `id` integer is the usual choice. The DBMS refuses an insert that would duplicate it.
q: What is a foreign key?
a: A foreign key is a column whose values must match the primary key of another table, such as `orders.customer_id` pointing at `customers.id`. It records a relationship between rows and lets the database refuse an order for a customer who does not exist.
q: Why use a database instead of a spreadsheet or a file?
a: A database enforces types and rules on every write, lets many users read and change the data at once without losing updates, survives crashes through transactions, and answers questions over millions of rows with indexes. A spreadsheet or a CSV file does none of that by itself.
---
Almost every application you have used keeps its data in a database: the bank that holds your balance, the shop that remembers your orders, the platform that records which problems you have solved. Before writing a line of SQL it pays to know what you are talking to — what a table is, what a row and a column mean, what a key is for and what the software underneath actually does. This lesson builds that picture, and the vocabulary every later lesson and every interview assumes.

## Data as tables

A **relational database** stores data in **tables**. A table has a name and a fixed list of **columns**; each column has a name and a **type**. The data itself is a set of **rows**, each row holding one value per column.

@figure table-anatomy

Read it the way the database does: one row is one **record** (one student), one column is one **attribute** (every student's city). The column list and the types are the table's **schema**; the rows are its **data**. The schema changes rarely and deliberately; rows are inserted, updated and deleted all day.

Three properties matter more than they first appear:

- **Every value in a column has the column's type.** `year` is an integer, `city` is text. The database refuses `'second'` in `year` (or, in a lax mode, converts it) — a spreadsheet cell would accept anything.
- **Rows have no inherent order.** A table is a *set* of rows, not a list. The order you see when you read a table is whatever the engine found convenient; if order matters you ask for it with `ORDER BY`, every time.
- **Columns are named, not numbered.** A query says `city`, never "the fourth column".

The word *relational* comes from mathematics: a table is a *relation*, a set of tuples that share a heading. You do not need the theory, but it explains the habits — sets have no duplicates and no order, and SQL behaves accordingly unless you ask otherwise.

## Keys identify rows

If two students are both called Ravi and both live in Chennai, how do you update one of them? You need a column whose value is different in every row. That is a **key**.

The **primary key** is the key a table chooses as its identity. It must be **unique** (no two rows share a value) and **never NULL** (every row has one). The usual choice is an integer `id` that the database assigns itself:

```sql
CREATE TABLE students (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  city VARCHAR(40)
);
```

Do not worry about the syntax yet — `CREATE TABLE` gets a module of its own. Notice the shape: a name and a type per column, plus rules (`PRIMARY KEY`, `NOT NULL`) that the database will check on every insert. A natural value such as an email address can also be a key; a separate number is preferred because names and emails change, and a key that changes has to change everywhere it is referenced.

## Foreign keys relate tables

Real data is spread across several tables, each about one kind of thing. An order belongs to a customer, so the `orders` table stores the customer's key:

@figure foreign-key

`orders.customer_id` is a **foreign key**: its values must be values of `customers.id`. The customer's name is stored **once**, in `customers`; an order only points at it. Change Asha's name and every one of her orders is up to date, because none of them copied it. That is the core idea of relational design — store each fact once and connect facts by keys — and joins, later in the course, are how a query follows those pointers back.

Declared as a constraint, the foreign key lets the database refuse an order for customer 99 when no customer 99 exists, and refuse to delete a customer who still has orders.

## What the DBMS does

The tables are the **database**. The software that keeps them is the **database management system** (DBMS) — MySQL, PostgreSQL, SQLite, SQL Server, Oracle. People say "the database" for both; interviewers sometimes check that you know the difference. The DBMS:

- **stores** the tables on disk in pages and caches the hot ones in memory;
- **enforces** the schema — types, `NOT NULL`, `UNIQUE`, primary and foreign keys, `CHECK` rules — on every write;
- **answers queries**: you describe the rows you want and it works out how to find them, using **indexes** (sorted lookup structures) so it does not read every row;
- **runs transactions**: a group of changes either all happen or none do, even if the power fails halfway;
- **handles concurrency**: hundreds of connections read and write at once without seeing each other's half-finished work;
- **controls access**: users, passwords and permissions on each table.

Most DBMSs are **servers**: a program running on a machine, which your application connects to over the network. SQLite is the exception — a library inside your program that keeps the whole database in one file.

## Why not a spreadsheet or a file?

A spreadsheet looks like a table and a CSV file holds rows, so why the extra machinery? Because the machinery is the point:

| Need | Spreadsheet / CSV | Database |
| --- | --- | --- |
| A wrong type in a column | accepted silently | refused |
| Two people editing at once | last save wins | both changes kept, conflicts locked |
| Crash in the middle of a change | half-written file | rolled back |
| Find one row among 10 million | read everything | index lookup |
| The same customer in 500 orders | copied 500 times | stored once, referenced |
| Who may read salaries | whoever has the file | per-user permissions |

A spreadsheet is fine for one person and a few thousand rows. The moment data is shared, large or valuable, those rows of the table become requirements.

## Relational and the rest

Relational databases are not the only kind. **Document stores** (MongoDB) keep JSON-like documents; **key-value stores** (Redis) map keys to values in memory; **wide-column**, **graph** and **time-series** databases each optimise one access pattern. They are often grouped as "NoSQL". They trade the relational model's guarantees — a fixed schema, joins, multi-row transactions — for scale or flexibility in one direction. Relational databases remain the default for business data, and SQL is the language nearly all of them share; several NoSQL systems have added SQL-like query languages because people know it.

## A first look at a table

In every exercise of this course the tables are built for you by a **setup script**, shown as the exercise's input, and your SQL runs against them. The simplest question you can ask a table is "show me everything":

```sql
SELECT * FROM students ORDER BY id;
```

| id | name | year | city |
| ---: | --- | ---: | --- |
| 1 | Asha | 2 | Pune |
| 2 | Ravi | 1 | Chennai |
| 3 | Meera | 3 | Pune |

`*` means every column, `FROM students` names the table, and `ORDER BY id` fixes the order of the rows — remember, a table has none of its own. The other question you can ask right away is how many rows there are:

```sql
SELECT COUNT(*) AS total FROM students;
```

| total |
| ---: |
| 3 |

`COUNT(*)` counts rows and `AS total` names the result column. Both are explained properly later; for now they let you look at data.

## Key takeaways

- A relational database stores **tables**; a table has typed, named **columns** and a set of **rows** with **no inherent order**.
- A **primary key** identifies each row: unique and never NULL. A **foreign key** points at another table's primary key and records a relationship.
- Store each fact once and connect facts by keys.
- The **DBMS** (MySQL, PostgreSQL, SQLite…) stores data, enforces rules, answers queries with indexes, runs transactions and handles many users at once.
- `SELECT * FROM t ORDER BY id` shows a whole table; `ORDER BY` is how you get an order.
