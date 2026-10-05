---
title: ER Model in DBMS
order: 2
minutes: 13
level: beginner
updated: 2026-10-05
seo-title: ER Model in DBMS: Entities, Relationships, ER to Tables
description: The ER model in DBMS: entities, attribute types, relationships, cardinality, participation, weak entities, generalization and ER diagram to table rules.
question: What is the ER model in DBMS?
answer: The entity–relationship (ER) model is a conceptual design model that describes a database as entities (real-world things such as a student or a book), their attributes, and the relationships between them, with cardinality and participation constraints. It is drawn as an ER diagram before any table exists, and fixed rules then turn the diagram into relational tables.
q: What is the difference between an entity and an entity set?
a: An entity is one distinguishable thing, such as the student with roll number 101. An entity set is the collection of all entities of the same type, such as all students. The entity set is drawn as one rectangle in an ER diagram and usually becomes one table.
q: What is a weak entity in DBMS?
a: A weak entity has no key of its own and can be identified only together with its owner entity, through an identifying relationship. Copy number 3 means something only for a particular book. A weak entity's table takes the owner's key plus its own partial key as the primary key.
q: What is the difference between total and partial participation?
a: Total participation means every entity in the set must take part in the relationship, drawn as a double line: every book must have a publisher. Partial participation means some entities may not take part, drawn as a single line: a library member may have no book on loan.
q: What is cardinality in the ER model?
a: Mapping cardinality says how many entities on one side a single entity on the other side can be related to: one-to-one, one-to-many, many-to-one or many-to-many. It decides where the foreign key goes when the diagram is converted into tables.
q: How is a many-to-many relationship converted into tables?
a: It becomes a separate table whose columns are the primary keys of both entity sets, each a foreign key, plus any attributes of the relationship itself. The two foreign keys together form that table's primary key, so the same pair cannot be stored twice.
q: What is the difference between generalization and specialization?
a: Both build a superclass and subclass hierarchy. Generalization works bottom up, combining entity sets that share attributes, such as Car and Truck into Vehicle. Specialization works top down, splitting one entity set into subgroups with extra attributes, such as Employee into Engineer and Manager.
---

The entity–relationship (ER) model, introduced by Peter Chen in 1976, is how a database is designed before it is built. You describe the world the database must remember as **entities** (things), **attributes** (their properties) and **relationships** (how things are connected), together with rules such as "every book has exactly one publisher". The result, an ER diagram, is easy to discuss with people who will never write SQL, and it converts into tables by a short list of fixed rules. Interviewers ask both halves: draw or read a diagram, then turn it into tables.

## Entities and entity sets

An **entity** is a real-world object that can be told apart from all others: the student with roll number 101, the member with card number 5521. An **entity set** is the set of all entities of the same type: all students, all books. In a diagram an entity set is a rectangle, and it usually becomes one table, with each entity a row.

A **strong entity set** has a key of its own. A **weak entity set** does not, and depends on another entity set for its identity (covered below).

## Attributes

Attributes describe an entity. Each has a **domain**, the set of values it may take. The types interviewers ask about:

| Attribute type | Meaning | Example (Member) |
| --- | --- | --- |
| Simple | Cannot be divided further | `member_id` |
| Composite | Made of smaller parts | `name` = first name + last name |
| Single-valued | One value per entity | `date_of_birth` |
| Multi-valued | Several values per entity | `phone` (a member may give two numbers) |
| Derived | Computed from other attributes, not stored | `age`, from `date_of_birth` |
| Key | Uniquely identifies an entity in its set | `member_id` |
| Stored | Kept in the database (the opposite of derived) | `date_of_birth` |

An attribute can also be **null** when the value is unknown or does not apply, such as a member with no email address.

### Chen notation

@figure chen-symbols

Many tools use **crow's foot** notation instead, where the line ends show cardinality (a single bar for one, a three-pronged "crow's foot" for many) and a circle or bar shows optional or mandatory participation. The meaning is the same.

## Relationships and their degree

A **relationship** associates entities: Asha *borrows* copy 2 of a book. A **relationship set** is the set of all such associations of one kind, drawn as a diamond. A relationship can have attributes of its own: `issue_date` belongs to *borrows*, not to the member or the copy.

The **degree** of a relationship is the number of entity sets taking part:

| Degree | Example |
| --- | --- |
| Unary (recursive) | Employee *manages* Employee; each end has a **role**: manager and subordinate |
| Binary | Student *enrolls in* Course |
| Ternary | Supplier *supplies* Part to Project |

A ternary relationship is not the same as three binary ones. Knowing that a supplier supplies a part, that the supplier works for a project, and that the project uses the part does not tell you that this supplier supplies this part to this project.

## Cardinality and participation

**Mapping cardinality** says how many entities a single entity can be related to through the relationship:

| Cardinality | Meaning | Example |
| --- | --- | --- |
| One-to-one (1:1) | Each A relates to at most one B, and each B to at most one A | Department *headed by* Professor |
| One-to-many (1:N) | One A relates to many B; each B to at most one A | Publisher *publishes* Book |
| Many-to-one (N:1) | The same as 1:N read from the other side | Book *published by* Publisher |
| Many-to-many (M:N) | Each A relates to many B and each B to many A | Author *writes* Book |

**Participation** says whether every entity must take part. **Total** participation (double line) means every entity takes part at least once; it is also called an existence dependency. **Partial** participation (single line) means some may not. Cardinality is the maximum; participation is the minimum. Some books write both as a pair (min, max), so "a book has (1, 1) publisher" means total participation and at most one.

@figure cardinality

## Weak entities

A **weak entity set** has no attribute set that identifies its entities on its own. A library owns several copies of each book, numbered 1, 2, 3 within that book; "copy 2" is ambiguous until you say which book. So:

- The weak entity set (Copy) is identified through an **identifying relationship** (*has*) with its **owner** or identifying entity set (Book).
- Its own distinguishing attribute is a **partial key** or discriminator (`copy_no`).
- Its full key is the owner's key plus the partial key: (`isbn`, `copy_no`).
- It always has total participation in the identifying relationship, which is one-to-many from owner to weak entity.

@figure weak-entity

If a book is removed, its copies have no meaning left, so the copies' table usually declares `ON DELETE CASCADE` on its foreign key to the owner.

## Generalization, specialization and aggregation

The extended ER (EER) model adds three ideas for larger designs.

**Specialization** is top down: split an entity set into subclasses that have extra attributes or relationships. Employee specializes into Engineer (with `skill`) and Manager (with `budget`). **Generalization** is bottom up: combine entity sets that share attributes into a superclass, as Car and Truck generalize into Vehicle. Both produce an "is-a" hierarchy, and a subclass **inherits** all attributes and relationships of its superclass. Two constraints describe the hierarchy:

- **Disjoint** (an employee is at most one subclass) or **overlapping** (an employee may be both).
- **Total** (every employee belongs to some subclass) or **partial** (some belong to none).

**Aggregation** treats a relationship, together with its entities, as a higher-level entity so that it can take part in another relationship. Employees *work on* projects, and a manager *monitors* each employee-project assignment, not the employee or the project alone. Aggregating *works on* lets *monitors* connect Manager to the assignment.

## Worked example: a library

Requirements: publishers publish books, and every book has exactly one publisher. Each book has one or more authors, and an author may write many books. The library holds numbered copies of each book. A member may have several copies on loan at once, and a copy is with at most one member at a time. For members we store a name in two parts, phone numbers (any number of them) and a date of birth; age is shown but never stored.

The entity sets and their attributes:

| Entity set | Kind | Attributes |
| --- | --- | --- |
| Publisher | Strong | `publisher_id` (key), name, city |
| Book | Strong | `isbn` (key), title, year |
| Author | Strong | `author_id` (key), name |
| Copy | Weak, owner Book | `copy_no` (partial key), shelf |
| Member | Strong | `member_id` (key), name (composite: first, last), phone (multi-valued), date_of_birth, age (derived) |

@figure library-er

Applying the mapping rules gives seven tables:

@figure er-to-tables

| Table | Columns (PK first) | Rule applied |
| --- | --- | --- |
| publisher | `publisher_id`, name, city | Strong entity |
| book | `isbn`, title, year, `publisher_id` (FK, NOT NULL) | 1:N: FK on the N side, NOT NULL by total participation |
| author | `author_id`, name | Strong entity |
| writes | (`isbn`, `author_id`), both FKs | M:N becomes its own table |
| copy | (`isbn`, `copy_no`), shelf, `member_id` (FK, nullable), issue_date, due_date | Weak entity: owner key + partial key; *borrows* (1:N) adds its FK and attributes |
| member | `member_id`, first_name, last_name, date_of_birth | Composite name flattened; derived age left out |
| member_phone | (`member_id`, phone) | Multi-valued attribute becomes its own table |

Two honest notes on this design. First, foreign keys cannot enforce "every book has at least one author" (total participation on the M:N side); that needs application logic or a trigger. Second, because most copies sit on the shelf, `member_id`, `issue_date` and `due_date` in `copy` are usually null; a separate `loan(isbn, copy_no, member_id, issue_date, due_date)` table keyed by (`isbn`, `copy_no`) is an equally correct mapping that avoids the nulls.

## Converting an ER diagram to tables

| ER construct | Becomes |
| --- | --- |
| Strong entity set | A table; its key becomes the primary key |
| Composite attribute | Only its component parts become columns |
| Multi-valued attribute | A separate table (owner key, value) with both as the primary key |
| Derived attribute | Nothing stored; compute it in a query or view |
| Weak entity set | A table with the owner's key as a foreign key; primary key = owner key + partial key |
| 1:1 relationship | A foreign key on either side, declared UNIQUE (prefer the side with total participation) |
| 1:N relationship | A foreign key on the N side, plus the relationship's attributes |
| M:N relationship | A new table holding both keys as foreign keys, together its primary key |
| Ternary relationship | A new table holding the keys of all three entity sets |
| Specialization | One of three layouts (below) |

For Employee specialized into Engineer and Manager, the three layouts are: a table per entity set, where `engineer(emp_id, skill)` and `manager(emp_id, budget)` reference `employee(emp_id, name, salary)` (always works, needs joins); tables for the subclasses only, each repeating name and salary (only when the specialization is total, and best when it is disjoint); or one `employee` table with a `type` column and nullable `skill` and `budget` (no joins, many nulls).

A favourite question asks for the **minimum number of tables** for two strong entity sets E1 and E2 joined by one binary relationship R, with no multi-valued attributes:

| Cardinality of R | Participation | Minimum tables |
| --- | --- | --- |
| 1:1 | Total on both sides | 1 (merge everything) |
| 1:1 | Partial on at least one side | 2 |
| 1:N | Any | 2 (R folds into the N side) |
| M:N | Any | 3 (R needs its own table) |

## Common mistakes

- Putting the foreign key of a 1:N relationship on the "one" side: it goes on the "many" side, or one row would need many values.
- Storing a multi-valued attribute as a comma-separated column: it breaks first normal form; give it its own table.
- Giving a weak entity's table only its partial key as the primary key: `copy_no` alone repeats for every book.
- Storing derived attributes such as age: they go stale; compute them.
- Reading cardinality as participation: 1:N limits the maximum; whether every entity must take part is a separate rule.
- Replacing a ternary relationship with three binary ones: the combined fact is lost.

## Interview questions

**What is an ER diagram used for?** It is a conceptual design of the database, made before tables exist. It captures entities, attributes, relationships and constraints in a form non-programmers can check, and it maps to a relational schema by fixed rules.

**What are the types of attributes?** Simple and composite, single-valued and multi-valued, stored and derived, plus key attributes. A multi-valued attribute becomes a separate table, a composite one is flattened into its parts, and a derived one is not stored.

**What is a weak entity? Give an example.** An entity set without a key of its own, identified through its owner by an identifying relationship. A copy of a book, a dependent of an employee, or an instalment of a loan; the key is the owner's key plus the partial key.

**What is the difference between total and partial participation?** Total means every entity must take part in the relationship (double line), partial means it need not (single line). Total participation on the N side of a 1:N relationship becomes a NOT NULL foreign key.

**How do you convert a 1:N and an M:N relationship into tables?** For 1:N, add the "one" side's key as a foreign key on the "many" side. For M:N, create a new table with both keys as foreign keys, together forming its primary key, plus any relationship attributes.

**What is aggregation in the ER model?** Treating a relationship and its entities as one higher-level entity so it can take part in another relationship. It models facts about an association itself, such as a manager monitoring an employee's work on a project.

**What is a recursive relationship?** A relationship between an entity set and itself, such as Employee *manages* Employee. The two ends get role names, and in tables it becomes a foreign key referencing the same table, such as `manager_id` referencing `emp_id`.

**Can a relationship have attributes?** Yes. An attribute that describes the association rather than either entity belongs to the relationship, such as the issue date of a loan or the grade in an enrolment. For an M:N relationship it becomes a column of the relationship's table.

Next, the keys that make those tables work: [Keys in DBMS](/notes/dbms/keys-in-dbms). Then test your design reading with the [SQL (Basic) skill test](/skill-tests/sql-basic).
