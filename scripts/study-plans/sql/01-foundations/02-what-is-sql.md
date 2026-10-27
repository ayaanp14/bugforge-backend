---
title: What SQL is — a declarative language in five parts
minutes: 13
seo-title: What Is SQL? DDL, DML, DQL, DCL and TCL Explained
description: SQL is the declarative language of relational databases. Its statement families DDL, DML, DQL, DCL and TCL, and the rules for case, quotes and comments.
question: What is SQL?
answer: SQL (Structured Query Language) is the standard language for defining, querying and changing data in relational databases. It is declarative: a statement describes the result wanted, such as the names of students in Pune, and the database decides how to compute it. Statements fall into families: DDL defines tables, DML changes rows, SELECT queries them, DCL grants access and TCL controls transactions.
q: What is the difference between DDL and DML?
a: DDL (Data Definition Language) changes the structure: `CREATE`, `ALTER`, `DROP` and `TRUNCATE` act on tables, indexes and views. DML (Data Manipulation Language) changes the rows inside them: `INSERT`, `UPDATE` and `DELETE`. `SELECT` is sometimes counted as DML and sometimes as its own family, DQL.
q: Is SQL case sensitive?
a: SQL keywords are not: `SELECT`, `select` and `Select` are the same. Whether table and column names are depends on the database and the operating system, and whether `'abc' = 'ABC'` is true depends on the column's collation; MySQL's default collation says it is. Writing keywords in capitals is a convention for readability.
q: Why is SQL called a declarative language?
a: Because a query states what result is wanted rather than the steps to produce it. `SELECT name FROM students WHERE city = 'Pune'` never says whether to scan the table or use an index; the database's optimizer chooses. In an imperative language you would write the loop yourself.
q: Should strings in SQL use single or double quotes?
a: Single quotes. Standard SQL uses single quotes for string values and double quotes for identifiers. MySQL also accepts double-quoted strings by default, but PostgreSQL and SQLite treat them as column names, so `'Pune'` is the portable spelling. A quote inside a string is doubled: `'it''s'`.
---
SQL — Structured Query Language, said "S-Q-L" or "sequel" — is how you talk to a relational database. It was designed at IBM in the 1970s, standardised by ANSI and ISO from 1986, and is still the one language that MySQL, PostgreSQL, SQLite, SQL Server and Oracle all speak. Each speaks its own **dialect**, but the core you learn in this course carries across all of them. This lesson is about what kind of language SQL is, the families its statements fall into, and the small syntax rules that trip people up in their first week.

## Declarative: describe the result

Most programming languages are **imperative**: you tell the computer the steps. To find the students who live in Pune in Python you write the loop:

```python
result = []
for s in students:
    if s.city == "Pune":
        result.append(s.name)
```

SQL is **declarative**: you describe the result and the database finds the steps.

```sql
SELECT name
FROM students
WHERE city = 'Pune';
```

Nothing in that query says how to find the rows. If there is an index on `city`, the database uses it and touches only the matching rows; if not, it reads the table. If the table moves to a faster disk, gains a million rows or is split across machines, the query does not change. The part of the database that picks the method is the **optimizer**, and the method it picks is the **execution plan**. That division of labour is why a five-line query can replace fifty lines of loops — and why, later in the course, writing queries the optimizer can serve well becomes a topic of its own.

The flip side: SQL thinks in **sets of rows**, not one row at a time. A `WHERE` condition is a test applied to every row; an `UPDATE` changes every row that matches. Reasoning "for each row…" is fine for understanding, but the statement acts on the whole set at once.

## The statement families

Every SQL statement belongs to one of a few families. Interviews ask for the names, and the names help you read documentation:

| Family | Stands for | Statements | Acts on |
| --- | --- | --- | --- |
| DDL | Data Definition Language | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME` | the structure: tables, indexes, views |
| DML | Data Manipulation Language | `INSERT`, `UPDATE`, `DELETE` | the rows |
| DQL | Data Query Language | `SELECT` | reading rows |
| DCL | Data Control Language | `GRANT`, `REVOKE` | permissions |
| TCL | Transaction Control Language | `COMMIT`, `ROLLBACK`, `SAVEPOINT` | transactions |

Some books fold `SELECT` into DML; both are accepted answers. Here is one statement from each of the first three, in the order a new table meets them:

```sql
-- DDL: make the table
CREATE TABLE tasks (
  id    INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  done  INT NOT NULL DEFAULT 0
);

-- DML: put rows in, change them
INSERT INTO tasks (id, title) VALUES (1, 'Buy milk'), (2, 'Call Ravi');
UPDATE tasks SET done = 1 WHERE id = 1;

-- DQL: read them back
SELECT id, title, done FROM tasks ORDER BY id;
```

```text
id | title | done
1 | Buy milk | 1
2 | Call Ravi | 0
```

Most of this course is DQL — `SELECT` is where the depth is. DML and DDL get their own modules later, and TCL appears with transactions.

## Statements and scripts

A **statement** is one complete command. Statements end with a **semicolon**; the semicolon separates them when several are sent together as a **script**. In the exercises your answer is such a script — usually one `SELECT`, sometimes an `INSERT` followed by the `SELECT` that shows its effect. Each `SELECT` prints its result: the column names joined by ` | `, then one line a row. A statement that returns no rows (an `INSERT`, an `UPDATE`) prints nothing.

Whitespace and line breaks do not matter. These are the same statement:

```sql
SELECT id, title FROM tasks WHERE done = 0;

SELECT id,
       title
FROM   tasks
WHERE  done = 0;
```

The second form — one clause per line, keywords aligned — is how real code is written. It makes the clauses easy to find and the diff easy to read.

## Case

**Keywords are not case sensitive.** `SELECT`, `select` and `SeLeCt` are the same keyword. The convention is capitals for keywords and lower case for names, so the structure stands out; this course follows it.

**Names** (tables and columns) depend on the database. In MySQL, column names are never case sensitive, and table names follow the file system unless configured otherwise — case sensitive on Linux, not on Windows. PostgreSQL folds unquoted names to lower case. The safe habit: name everything in lower case with underscores (`order_items`, `created_at`) and spell it the same way everywhere.

**Values** are another matter. Whether `'pune' = 'Pune'` is true depends on the column's **collation** — the rules for comparing text. MySQL's default collations are case-insensitive, so it is true there; PostgreSQL compares case-sensitively by default, so it is false. When case matters to the answer, don't rely on either: store data consistently.

## Quotes

- **Strings** go in **single quotes**: `'Pune'`, `'2024-03-01'`. A single quote inside a string is written twice: `'it''s'`. MySQL also accepts a backslash escape, `'it\'s'`, which other databases do not.
- **Identifiers** that need quoting — a name with a space, or one that clashes with a keyword — use **backticks** in MySQL (`` `order` ``, `` `full name` ``) and **double quotes** in standard SQL and PostgreSQL (`"order"`).
- MySQL also accepts **double-quoted strings** by default. Don't use them: in PostgreSQL and SQLite `"Pune"` means a *column* called Pune, and the query fails or, worse, compares a column with itself.
- **Numbers** are never quoted: `WHERE year = 2`, not `WHERE year = '2'`. MySQL would convert the string, but the habit hides type mistakes.

## Comments

```sql
-- a line comment: two dashes and a space, to the end of the line
# MySQL also takes a hash for a line comment
/* a block comment
   can span lines */
SELECT title FROM tasks;  -- after a statement too
```

Use `--` for portability; `#` is MySQL only. In this course the starter of every exercise is a comment describing the task — a script with nothing but comments has no statement, which is why running it says to write a query first.

## SQL is a standard with dialects

The ISO standard defines the core — `SELECT`, joins, `GROUP BY`, subqueries, window functions, transactions — and each database implements most of it plus extensions of its own. String concatenation, limiting rows, auto-numbered ids, date arithmetic and the names of many functions differ. The next lesson walks through the differences interviewers ask about. The rule for now: learn one dialect properly (this course uses MySQL 8) and know where the seams are.

## Key takeaways

- SQL is **declarative**: describe the result; the **optimizer** chooses the method.
- It works on **sets of rows**: a condition tests every row, a change hits every matching row.
- Families: **DDL** (structure), **DML** (rows), **DQL** (`SELECT`), **DCL** (permissions), **TCL** (transactions).
- Statements end with `;`; whitespace is free; keywords are case-insensitive; names are best kept lower case.
- Strings in **single quotes** (double an inner quote); identifiers in backticks in MySQL; comments with `--` or `/* */`.
