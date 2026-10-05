---
title: SQL Basics: DDL, DML, DCL and TCL
order: 6
minutes: 11
level: beginner
updated: 2026-10-05
seo-title: SQL Basics: DDL, DML, DCL and TCL Commands with Examples
description: SQL basics with results: DDL, DML, DCL and TCL commands, constraints, DELETE vs TRUNCATE vs DROP, SELECT with WHERE and ORDER BY, NULL logic and LIKE.
question: What are DDL, DML, DCL and TCL in SQL?
answer: SQL commands fall into groups. DDL (CREATE, ALTER, DROP, TRUNCATE) defines and changes the structure of tables. DML (INSERT, UPDATE, DELETE, and SELECT, sometimes listed separately as DQL) works on the rows. DCL (GRANT, REVOKE) controls who may do what. TCL (COMMIT, ROLLBACK, SAVEPOINT) groups statements into transactions that succeed or fail together.
q: What is the difference between DELETE, TRUNCATE and DROP?
a: DELETE is DML and removes chosen rows (or all, without WHERE), firing triggers and keeping the table. TRUNCATE is DDL and empties the whole table quickly, resetting AUTO_INCREMENT. DROP removes the table itself, structure and all. In MySQL, TRUNCATE and DROP commit implicitly and cannot be rolled back.
q: Why does WHERE column = NULL return no rows?
a: NULL means "unknown", so comparing anything with NULL gives UNKNOWN, not TRUE, and WHERE keeps only rows where the condition is TRUE. Use IS NULL or IS NOT NULL to test for NULL. MySQL also offers the null-safe operator <=>, which treats two NULLs as equal.
q: What is the difference between CHAR and VARCHAR?
a: CHAR(n) is fixed length: shorter values are padded with spaces to n characters (MySQL strips the trailing spaces when reading). VARCHAR(n) stores only the characters given plus a small length prefix. Use CHAR for codes that are always the same length, such as a three-letter department code, and VARCHAR for names and text.
q: What does the LIKE operator do in SQL?
a: LIKE matches a string against a pattern in which % stands for any sequence of characters, including none, and _ stands for exactly one character. name LIKE 'A%' finds names starting with A. In MySQL's default collations the match ignores case, while PostgreSQL's LIKE is case-sensitive and offers ILIKE instead.
q: Is SELECT a DML or a DQL command?
a: Both labels are used. The SQL standard groups SELECT with the data manipulation statements, and many textbooks list it under DML. Others give it its own category, DQL (data query language), because it reads data without changing it. In an interview, mention both and say which convention you follow.
---

SQL (Structured Query Language) is the standard language of relational databases. You use it to define tables, put rows into them, ask questions of them, decide who may touch them, and group changes into transactions. It is **declarative**: you describe the result you want, and the DBMS's optimizer decides how to get it. The core is standardized (ISO/IEC 9075), and every product adds its own extensions; the examples here run on MySQL 8, and the places where MySQL differs from standard SQL are pointed out.

## SQL command categories

| Category | Purpose | Commands |
| --- | --- | --- |
| DDL (data definition) | Create and change structure | CREATE, ALTER, DROP, TRUNCATE, RENAME |
| DML (data manipulation) | Change the rows | INSERT, UPDATE, DELETE |
| DQL (data query) | Read the rows | SELECT |
| DCL (data control) | Grant and take away permissions | GRANT, REVOKE |
| TCL (transaction control) | Group statements into transactions | START TRANSACTION, COMMIT, ROLLBACK, SAVEPOINT |

Two practical points. MySQL runs in **autocommit** mode by default, so each statement is its own transaction unless you begin one explicitly. And in MySQL (and Oracle) a DDL statement causes an **implicit commit**: a `CREATE` or `TRUNCATE` in the middle of a transaction commits the work before it and cannot itself be rolled back. PostgreSQL, by contrast, can roll back most DDL.

## DDL: creating and changing tables

```sql
CREATE TABLE departments (
  dept_id   CHAR(3)     PRIMARY KEY,
  dept_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE students (
  id    INT         PRIMARY KEY AUTO_INCREMENT,
  name  VARCHAR(50) NOT NULL,
  dept  CHAR(3)     NOT NULL,
  marks INT         CHECK (marks BETWEEN 0 AND 100),
  city  VARCHAR(30) DEFAULT 'Pune',
  FOREIGN KEY (dept) REFERENCES departments (dept_id)
);
```

`AUTO_INCREMENT` is MySQL's way of generating ids; standard SQL (and PostgreSQL) writes `GENERATED ALWAYS AS IDENTITY`. `ALTER TABLE` changes an existing table:

```sql
ALTER TABLE students ADD COLUMN email VARCHAR(100) UNIQUE;
ALTER TABLE students MODIFY COLUMN city VARCHAR(50) DEFAULT 'Pune';  -- MySQL syntax
ALTER TABLE students RENAME COLUMN city TO home_city;                -- MySQL 8.0+
ALTER TABLE students DROP COLUMN email;
DROP TABLE IF EXISTS old_results;
```

`MODIFY COLUMN` is MySQL's form; standard SQL and PostgreSQL use `ALTER COLUMN … TYPE` and `ALTER COLUMN … SET DEFAULT`.

## Constraints

Constraints are rules declared with the table and checked by the DBMS on every change:

| Constraint | Rule | Rejected example |
| --- | --- | --- |
| NOT NULL | The column must have a value | Inserting a student with no name |
| UNIQUE | No two rows share the value (NULLs allowed) | A second row with the same email |
| PRIMARY KEY | UNIQUE and NOT NULL; one per table | Two students with id 3 |
| FOREIGN KEY | The value must exist in the referenced key (or be NULL) | dept 'CIV' when no such department exists |
| CHECK | A condition every row must satisfy | marks = 120 |
| DEFAULT | Not a rule but a value used when none is given | Omitting city stores 'Pune' |

MySQL enforces CHECK constraints from version 8.0.16; older versions parsed them and silently ignored them. The [keys note](/notes/dbms/keys-in-dbms) covers primary and foreign keys and what `ON DELETE CASCADE` does.

## DML: inserting, updating and deleting

```sql
INSERT INTO students (name, dept, marks, city) VALUES
  ('Asha',   'CSE', 91,   'Pune'),
  ('Vikram', 'CSE', 78,   'Delhi'),
  ('Meera',  'ECE', 85,   'Chennai'),
  ('Rohan',  'ME',  NULL, 'Pune'),
  ('Priya',  'ECE', 67,   'Delhi');

UPDATE students SET marks = marks + 2 WHERE dept = 'ECE';
DELETE FROM students WHERE marks IS NULL;
```

An `UPDATE` or `DELETE` without `WHERE` changes every row. MySQL's client offers a safe-updates mode that refuses such statements, and running them inside a transaction you can roll back is a good habit.

## DELETE vs TRUNCATE vs DROP

| Aspect | DELETE | TRUNCATE | DROP |
| --- | --- | --- | --- |
| Category | DML | DDL | DDL |
| Removes | Chosen rows, or all without WHERE | All rows | The table: rows, structure, indexes, constraints |
| WHERE clause | Yes | No | No |
| Rollback in MySQL | Yes, inside a transaction | No, it commits implicitly | No, it commits implicitly |
| Rollback in PostgreSQL | Yes | Yes | Yes |
| Triggers | Fires DELETE triggers per row | Does not fire them | Not applicable |
| AUTO_INCREMENT | Keeps counting | Reset to the start | Gone with the table |
| Speed on a big table | Slow: row by row, each change logged | Fast: the table is emptied as a whole | Fast |
| Referenced by a foreign key | Allowed row by row, subject to the FK action | MySQL's InnoDB refuses | Refused until the foreign key is dropped |

## SELECT: reading rows

After the inserts above (before the update and delete), `students` holds:

| id | name | dept | marks | city |
| --- | --- | --- | --- | --- |
| 1 | Asha | CSE | 91 | Pune |
| 2 | Vikram | CSE | 78 | Delhi |
| 3 | Meera | ECE | 85 | Chennai |
| 4 | Rohan | ME | NULL | Pune |
| 5 | Priya | ECE | 67 | Delhi |

```sql
SELECT name, marks
FROM students
WHERE dept = 'CSE'
ORDER BY marks DESC;
```

| name | marks |
| --- | --- |
| Asha | 91 |
| Vikram | 78 |

`WHERE` filters rows, `ORDER BY` sorts them (ascending by default), and without `ORDER BY` the order of rows is not guaranteed at all. `DISTINCT` removes duplicate result rows, and `LIMIT` cuts the result:

```sql
SELECT DISTINCT city FROM students ORDER BY city;          -- Chennai, Delhi, Pune
SELECT name, marks FROM students ORDER BY marks DESC LIMIT 2;          -- top two
SELECT name, marks FROM students ORDER BY marks DESC LIMIT 2 OFFSET 2; -- next two
```

| Query | Result |
| --- | --- |
| Top two | Asha 91, Meera 85 |
| Next two | Vikram 78, Priya 67 |

Rohan's NULL comes last here because MySQL sorts NULL as the smallest value: first in ascending order, last in descending. PostgreSQL does the opposite (NULLs sort as largest) and lets you write `NULLS FIRST` or `NULLS LAST`. `LIMIT` is MySQL and PostgreSQL syntax; standard SQL writes `FETCH FIRST 2 ROWS ONLY`, and SQL Server uses `TOP`.

Other filters: `marks BETWEEN 70 AND 90` is inclusive at both ends (Vikram 78, Meera 85), and `dept IN ('ECE', 'ME')` matches any value in the list (Meera, Rohan, Priya).

## NULL and three-valued logic

NULL means a value is missing or unknown. It is not zero and not an empty string, and any comparison with it gives a third truth value, **UNKNOWN**. `WHERE` keeps a row only when its condition is TRUE.

| Expression | Result |
| --- | --- |
| NULL = NULL | UNKNOWN |
| TRUE AND UNKNOWN | UNKNOWN |
| FALSE AND UNKNOWN | FALSE |
| TRUE OR UNKNOWN | TRUE |
| FALSE OR UNKNOWN | UNKNOWN |
| NOT UNKNOWN | UNKNOWN |

So Rohan's row slips through both of these complementary filters:

| Query | Rows returned |
| --- | --- |
| `WHERE marks > 80` | Asha, Meera |
| `WHERE marks <= 80` | Vikram, Priya |
| `WHERE NOT (marks > 80)` | Vikram, Priya |
| `WHERE marks = NULL` | none |
| `WHERE marks IS NULL` | Rohan |

Arithmetic with NULL gives NULL (`marks + 5` is NULL for Rohan), and `COALESCE(marks, 0)` substitutes a value for NULL. MySQL's `<=>` is a null-safe equality that returns 1 for `NULL <=> NULL`; standard SQL writes `IS NOT DISTINCT FROM`. NULL also explains the classic `NOT IN` trap with subqueries, covered in the [joins note](/notes/dbms/sql-joins).

## Pattern matching with LIKE

`LIKE` compares a string with a pattern: `%` matches any run of characters (including none) and `_` matches exactly one.

| Pattern | Meaning | Matches in students |
| --- | --- | --- |
| `'A%'` | Starts with A | Asha |
| `'%a'` | Ends with a | Asha, Meera, Priya |
| `'_e%'` | Second letter is e | Meera |
| `'%ee%'` | Contains "ee" | Meera |

In MySQL's default collation (`utf8mb4_0900_ai_ci`, case- and accent-insensitive) `'a%'` also matches Asha; PostgreSQL's `LIKE` is case-sensitive and provides `ILIKE`. To match a literal `%` or `_`, escape it: `LIKE '50\%%'` in MySQL, or `LIKE '50!%%' ESCAPE '!'` in any SQL. A pattern that starts with `%` cannot use an ordinary index, so it scans the whole table.

## DCL and TCL

DCL hands out and withdraws privileges:

```sql
GRANT SELECT, INSERT ON college.students TO 'intern'@'localhost';
REVOKE INSERT ON college.students FROM 'intern'@'localhost';
```

TCL groups statements so that they take effect together or not at all:

```sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;      -- or ROLLBACK; to undo both
```

`SAVEPOINT name` marks a point inside a transaction that `ROLLBACK TO SAVEPOINT name` can return to. The [transactions note](/notes/dbms/transactions-and-acid) explains what COMMIT and ROLLBACK guarantee.

## Common mistakes

- Writing `= NULL` instead of `IS NULL`: the comparison is UNKNOWN and matches nothing.
- Expecting `WHERE x > 80` and `WHERE x <= 80` to cover every row: NULLs are in neither.
- Relying on row order without `ORDER BY`: it can change between runs and versions.
- Running `UPDATE` or `DELETE` without `WHERE` by accident: test the `WHERE` with a `SELECT` first.
- Assuming `TRUNCATE` can be rolled back in MySQL: it commits implicitly.
- Assuming CHECK constraints were always enforced in MySQL: only from 8.0.16.

## Interview questions

**What are the categories of SQL commands?** DDL (CREATE, ALTER, DROP, TRUNCATE) for structure, DML (INSERT, UPDATE, DELETE) and DQL (SELECT) for data, DCL (GRANT, REVOKE) for permissions and TCL (COMMIT, ROLLBACK, SAVEPOINT) for transactions.

**Why is TRUNCATE faster than DELETE?** DELETE removes rows one at a time, logging each and firing triggers. TRUNCATE empties the table as a whole, much like dropping and recreating it, so it logs far less and skips per-row work. That is also why it cannot take a WHERE clause.

**What is the difference between WHERE and HAVING?** WHERE filters rows before grouping; HAVING filters groups after GROUP BY and can use aggregates such as COUNT(*). The [aggregation note](/notes/dbms/sql-aggregation-and-subqueries) works both.

**What is the difference between a primary key and a UNIQUE constraint?** A table has one primary key, which never allows NULL. It may have many UNIQUE constraints, which in MySQL allow any number of NULLs.

**What does NULL + 10 return?** NULL. Any arithmetic with NULL gives NULL, and any comparison gives UNKNOWN; use COALESCE or IFNULL to substitute a value.

**Which rows does WHERE marks NOT BETWEEN 70 AND 90 return in the table above?** Asha (91) and Priya (67). Rohan is excluded because his marks are NULL, and NOT applied to UNKNOWN is still UNKNOWN.

**What does a DEFAULT constraint do when you insert NULL explicitly?** It does nothing; the default is used only when the column is omitted from the INSERT. Inserting NULL explicitly stores NULL, or fails if the column is NOT NULL.

**Is DDL transactional?** It depends on the DBMS. MySQL and Oracle commit implicitly around DDL statements, so they cannot be rolled back; PostgreSQL runs most DDL inside transactions and can roll it back.

Next, combine tables: [SQL Joins](/notes/dbms/sql-joins). These queries are the ground of the [SQL (Basic) skill test](/skill-tests/sql-basic).

Practise on real tables: [Scholarship Shortlist by CGPA or Hackathon Wins](/sql/scholarship-shortlist-by-cgpa-or-hackathons), [Canteen Orders Not Placed With the FEST50 Coupon](/sql/canteen-orders-without-the-fest-coupon) (the NULL trap) and the rest of the [SQL practice problems](/sql).
