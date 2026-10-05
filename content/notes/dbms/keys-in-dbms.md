---
title: Keys in DBMS
order: 3
minutes: 11
level: beginner
updated: 2026-10-05
seo-title: Keys in DBMS: Super, Candidate, Primary and Foreign Key
description: Every key in DBMS with one worked table: super, candidate, primary, alternate, foreign, composite, surrogate and unique keys, plus integrity constraints.
question: What are keys in DBMS?
answer: A key is a set of attributes whose values identify a row in a table or link it to another table. A super key is any set that identifies rows uniquely, a candidate key is a minimal super key, the primary key is the candidate key chosen as the row's identity, and a foreign key refers to a key of another table to link the two.
q: What is the difference between a super key and a candidate key?
a: A super key is any set of attributes that uniquely identifies every row; it may contain extra attributes. A candidate key is a minimal super key: remove any attribute and it no longer identifies rows. Every candidate key is a super key, but not every super key is a candidate key.
q: What is the difference between a primary key and a unique key?
a: A table has one primary key, and its columns can never be NULL. It can have many unique keys, and in MySQL and PostgreSQL a unique column may hold several NULLs. In MySQL's InnoDB the primary key is also the clustered index that orders the table.
q: Can a foreign key be NULL?
a: Yes, unless the column is also declared NOT NULL. A NULL foreign key means the row is not linked to anything, such as a student not yet assigned to a department. Referential integrity only requires that a non-NULL foreign key value exists in the referenced table.
q: What is a composite key?
a: A composite key is a key made of two or more columns, none of which identifies a row alone. In an enrolment table, a roll number repeats across courses and a course across students, but the pair (roll_no, course_id) is unique, so it is the composite primary key.
q: What is a surrogate key?
a: A surrogate key is an artificial identifier with no business meaning, usually an auto-increment integer or a UUID, used as the primary key instead of a natural key such as an email address. It never changes and is compact, but it does not stop duplicate real-world rows on its own.
q: How many super keys does a relation have?
a: If a relation has n attributes and a single candidate key of one attribute, every set containing that attribute is a super key, so there are 2 to the power n−1. With two single-attribute candidate keys there are 2^n − 2^(n−2), counting sets that contain either.
---

A table is only useful if you can point at one row and say "that one". **Keys** are the columns that let you do it, and the columns that tie one table to another. Interviewers love this topic because the definitions sound alike (super, candidate, primary, alternate) and differ in exactly one word. This note defines each, works through one table to decide which column sets are which, and then covers the integrity constraints that keys make possible.

## The keys at a glance

| Key | Definition |
| --- | --- |
| Super key | Any set of attributes whose values are unique for every row |
| Candidate key | A minimal super key: no attribute can be removed and keep it unique |
| Primary key | The one candidate key chosen as the table's identity; never NULL |
| Alternate key | Every candidate key that was not chosen as primary |
| Foreign key | Attributes that refer to a primary or unique key of another (or the same) table |
| Composite key | Any key made of two or more attributes |
| Surrogate key | An artificial key with no business meaning, such as an auto-increment id |
| Unique key | Attributes declared UNIQUE; an enforced alternate key that may allow NULLs |

Two more words you will need in normalization: an attribute that belongs to **any** candidate key is a **prime attribute**; every other attribute is **non-prime**.

## Super key and candidate key

A **super key** is any set of attributes that no two rows can share. If {roll_no} is unique, then so is {roll_no, name}, {roll_no, name, batch} and every other set that contains roll_no: adding columns to a unique set keeps it unique. Super keys therefore come in families.

A **candidate key** is a super key with nothing extra in it: remove any one attribute and it stops being unique. "Minimal" means no proper subset is a super key; it does not mean "fewest columns". A table can have several candidate keys of different sizes.

A key is a rule about every row the table may ever hold, decided from the meaning of the data, not from the rows present today. If today's rows happen to be unique on (name, dept_id), that is a coincidence, not a key.

## Worked example: which sets are keys?

Take a student table with five attributes. The college's rules: every student has a unique roll number and a unique college email; names repeat; a department and a batch hold many students.

| roll_no | email | name | dept_id | batch |
| --- | --- | --- | --- | --- |
| 101 | asha@college.edu | Asha | CSE | 2026 |
| 102 | vikram@college.edu | Vikram | CSE | 2026 |
| 103 | asha.k@college.edu | Asha | ECE | 2027 |
| 104 | meera@college.edu | Meera | ECE | 2026 |

| Attribute set | Super key? | Candidate key? | Reason |
| --- | --- | --- | --- |
| {roll_no} | Yes | Yes | Unique by rule; a single attribute cannot be reduced |
| {email} | Yes | Yes | Unique by rule; minimal |
| {roll_no, name} | Yes | No | Contains roll_no, so name is surplus |
| {roll_no, email} | Yes | No | Each part alone is already a key |
| {name} | No | No | Two students are called Asha |
| {name, dept_id} | No | No | Unique in these four rows only; a second Asha may join CSE |
| {dept_id, batch} | No | No | CSE 2026 appears twice |

So the candidate keys are {roll_no} and {email}. We choose **roll_no as the primary key**: it is short, never NULL, and never changes, whereas a student may change an email address. **Email becomes an alternate key**, and we declare it UNIQUE so the DBMS enforces it.

How many super keys are there? A set is a super key exactly when it contains roll_no or email. Of the 2^5 = 32 subsets of the five attributes, 2^3 = 8 contain neither (they are subsets of {name, dept_id, batch}), so there are 32 − 8 = **24 super keys**. With a single one-attribute candidate key the count would be 2^4 = 16.

## Primary, alternate and unique keys

The **primary key** is the candidate key the designer picks to identify rows. The DBMS enforces two things on it: uniqueness and NOT NULL (entity integrity). A table has at most one primary key, though it may span several columns. Good primary keys are short, stable and meaningless outside the database; this is why many teams use surrogate keys.

Every other candidate key is an **alternate key**. Declaring it **UNIQUE** turns the rule into a constraint. The differences interviewers ask for:

| Aspect | Primary key | Unique key |
| --- | --- | --- |
| Per table | Exactly one (may be composite) | Any number |
| NULLs | Never allowed | Allowed; MySQL and PostgreSQL accept many NULLs, SQL Server only one |
| Index | In MySQL's InnoDB, the clustered index that orders the rows | A secondary index |
| Role | The row's identity and the usual target of foreign keys | A business rule, such as one account per email |

If an InnoDB table has no primary key, InnoDB clusters it on the first UNIQUE index whose columns are all NOT NULL, or failing that on a hidden row id it generates. Declaring a primary key yourself is better.

## Foreign keys and composite keys

A **foreign key** is a set of columns in one table (the child, or referencing table) whose values must match a primary or unique key in another table (the parent, or referenced table). It is how relationships from the ER model become tables. Facts that surprise people:

- A foreign key may be NULL (meaning "not linked") unless declared NOT NULL.
- It may repeat: many students share dept_id CSE.
- It may refer to its own table: `employee.manager_id` references `employee.emp_id`.
- The column names need not match, but the types must be compatible.

A **composite key** is any key with more than one column. In an enrolment table neither roll_no nor course_id is unique alone, but each pair appears once, so (roll_no, course_id) is the primary key, and each part is also a foreign key. If a student may repeat a course in a later semester, the key widens to (roll_no, course_id, semester).

```sql
CREATE TABLE department (
  dept_id   CHAR(3)     PRIMARY KEY,
  dept_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE student (
  roll_no INT          PRIMARY KEY,
  email   VARCHAR(100) NOT NULL UNIQUE,
  name    VARCHAR(50)  NOT NULL,
  dept_id CHAR(3),
  batch   SMALLINT     CHECK (batch BETWEEN 2000 AND 2100),
  FOREIGN KEY (dept_id) REFERENCES department (dept_id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE enrollment (
  roll_no   INT,
  course_id CHAR(5),
  grade     CHAR(2),
  PRIMARY KEY (roll_no, course_id),
  FOREIGN KEY (roll_no) REFERENCES student (roll_no) ON DELETE CASCADE
);
```

In a full schema `enrollment.course_id` would reference a `course` table the same way.

## Natural and surrogate keys

| Aspect | Natural key (roll_no, email, PAN) | Surrogate key (auto-increment id, UUID) |
| --- | --- | --- |
| Meaning | Comes from the real world | None; generated by the system |
| Stability | Can change (a new email) | Never changes |
| Size | Can be long, or several columns | Small, single column |
| Duplicates | Prevents duplicate real-world rows | Does not; keep a UNIQUE on the natural key too |
| Joins | Wide composite foreign keys | Narrow integer foreign keys |

The common practice is a surrogate primary key plus a UNIQUE constraint on the natural key, which gives you stable joins and real-world uniqueness.

## Integrity constraints

Integrity constraints are rules the DBMS checks on every insert, update and delete:

| Constraint | Rule | Declared with |
| --- | --- | --- |
| Domain | Every value comes from its attribute's domain (type, range, format) | Data types, NOT NULL, CHECK, DEFAULT |
| Key | No two rows share a key value | PRIMARY KEY, UNIQUE |
| Entity integrity | No part of a primary key is NULL | PRIMARY KEY |
| Referential integrity | Every non-NULL foreign key value exists in the referenced key | FOREIGN KEY |

MySQL parsed but ignored CHECK constraints before version 8.0.16; from 8.0.16 it enforces them.

### What happens on delete

Referential integrity can be broken from the child side (inserting a student with dept_id 'CIV' when no such department exists, which is simply rejected) or from the parent side (deleting a department that students still reference). For the parent side, the foreign key's **referential action** decides. Suppose department ECE is deleted while students 103 and 104 reference it:

| Action | Result |
| --- | --- |
| RESTRICT or NO ACTION | The delete fails with an error; nothing changes |
| CASCADE | ECE is deleted, and so are students 103 and 104 |
| SET NULL | ECE is deleted; 103 and 104 keep their rows with dept_id NULL (the column must be nullable) |
| SET DEFAULT | ECE is deleted; their dept_id becomes the column default (standard SQL; MySQL's InnoDB rejects this action) |

`ON UPDATE` takes the same actions when the parent key value changes; `ON UPDATE CASCADE` copies a renamed key into every child. With no action written, MySQL uses NO ACTION, which in MySQL is the same as RESTRICT. In standard SQL the two differ slightly: RESTRICT checks at once, while NO ACTION checks at the end of the statement (PostgreSQL can defer it to commit).

Choose by meaning. Enrolments are meaningless without their student, so CASCADE fits. Students should survive a department being merged away, so SET NULL fits. Financial records referencing a customer usually use RESTRICT, because deleting history by accident is worse than an error.

## Common mistakes

- Calling a candidate key "the key with the fewest columns": minimal means no removable attribute, not smallest.
- Deciding keys from sample rows: rows can disprove a key, never prove one.
- Saying a foreign key must be unique or NOT NULL: it may repeat and may be NULL.
- Saying a unique key allows exactly one NULL everywhere: that is SQL Server's rule, not MySQL's or PostgreSQL's.
- Forgetting that every candidate key is also a super key.
- Using CASCADE everywhere: one delete can silently remove thousands of rows.

## Interview questions

**What is the difference between a super key, a candidate key and a primary key?** A super key is any uniquely identifying set of attributes. A candidate key is a super key with no removable attribute. The primary key is the candidate key chosen to identify rows, and it cannot be NULL.

**Can a table have more than one primary key?** No. It has at most one primary key, which may be composite. It can have several candidate keys; the ones not chosen are alternate keys, usually declared UNIQUE.

**Can a table have no primary key?** SQL allows it, but the table then accepts duplicate rows and nothing can reference it reliably. InnoDB still clusters it, on the first NOT NULL unique index or a hidden generated row id.

**What is referential integrity?** Every non-NULL foreign key value must match an existing value of the referenced key. The DBMS rejects child rows that break it and applies the foreign key's ON DELETE or ON UPDATE action when a parent row changes.

**What is the difference between ON DELETE CASCADE and ON DELETE SET NULL?** CASCADE deletes the child rows along with the parent. SET NULL keeps the child rows and sets their foreign key to NULL, which requires the column to be nullable.

**What is a prime attribute?** An attribute that is part of at least one candidate key. In the student example, roll_no and email are prime and the rest are non-prime; 2NF and 3NF are defined in these terms.

**Relation R(A, B, C, D) has candidate key A only. How many super keys does it have?** Every subset that contains A is a super key, and there are 2^3 = 8 such subsets. They are A, AB, AC, AD, ABC, ABD, ACD and ABCD.

**Why prefer a surrogate key? Why not always?** It is short, stable and makes joins cheap, and it does not leak business data into other tables. But it does not stop the same real-world entity being inserted twice, so you keep a UNIQUE constraint on the natural key as well.

Next, the rules that decide which columns determine which: [Functional Dependencies in DBMS](/notes/dbms/functional-dependencies). Practise keys and constraints in the [SQL (Basic) skill test](/skill-tests/sql-basic).
