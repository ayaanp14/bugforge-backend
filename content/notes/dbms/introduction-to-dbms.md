---
title: Introduction to DBMS
order: 1
minutes: 11
level: beginner
updated: 2026-10-05
seo-title: What is DBMS? Introduction, Architecture and Types
description: What a DBMS is and why it beats a file system: data models, the three-schema architecture, data independence, database users and types of databases.
question: What is a DBMS?
answer: A DBMS (database management system) is software that stores data in a database and lets many users and programs define, query, update and protect it. It takes care of storage, concurrent access, crash recovery, integrity rules and security so that applications do not have to. MySQL, PostgreSQL, Oracle Database, SQL Server and MongoDB are examples.
q: What is the difference between a database and a DBMS?
a: A database is the organized collection of related data itself, such as a college's student and course records. A DBMS is the software that creates, stores and manages that data and answers queries on it. The two together, with the applications that use them, make up a database system.
q: What is the difference between DBMS and RDBMS?
a: An RDBMS is a DBMS built on the relational model: data sits in tables of rows and columns, tables are linked by keys, and SQL is the query language. DBMS is the wider term and also covers hierarchical, network, document and other non-relational systems. MySQL and PostgreSQL are RDBMSs; MongoDB is a DBMS but not an RDBMS.
q: What are the three levels of DBMS architecture?
a: The ANSI/SPARC architecture has an internal level (how data is physically stored: files, pages, indexes), a conceptual level (the logical structure of the whole database: tables, relationships, constraints) and an external level (the views each user or application sees). Mappings between the levels give data independence.
q: What is data independence in DBMS?
a: Data independence is the ability to change the schema at one level without changing the level above it. Physical data independence lets you add an index or move files without touching the tables; logical data independence lets you add a column or split a table without rewriting applications that read through views.
q: What does a database administrator do?
a: A DBA is responsible for the whole database system. The DBA defines and changes the schema and storage structures, grants and revokes access, plans backups and recovery, monitors performance and disk space, and applies upgrades. In small teams developers often share these duties.
q: Why use a DBMS instead of files?
a: A file system stores bytes but knows nothing about what they mean. A DBMS removes duplicated and inconsistent data, answers new questions with a query instead of a new program, enforces integrity rules, keeps concurrent users from overwriting each other, recovers after crashes and controls who may see what.
---

A database is an organized collection of related data: a college's students, courses and marks, or a bank's customers, accounts and transfers. A database management system (DBMS) is the software that stores that data and lets many people and programs use it at the same time without corrupting it. It decides how the bytes sit on disk, answers questions written in a query language such as SQL, enforces the rules the data must follow, and brings the data back to a correct state after a crash. Almost every application you use keeps its state in one.

## What a DBMS does

The definition to say in an interview: **a DBMS is a collection of programs that lets users define, create, query, update and administer a database**. Behind that sentence sit the services every DBMS provides:

- **Data definition**: a data definition language (DDL) to describe tables, columns, types and constraints.
- **Data manipulation**: a data manipulation language (DML) to insert, update, delete and read rows.
- **Query processing**: an optimizer that turns a declarative query ("what I want") into an efficient plan ("which index, which join order").
- **Transaction management**: a group of operations happens completely or not at all, even across a crash.
- **Concurrency control**: many users read and write at once, and each sees a consistent picture.
- **Recovery**: logs and backups restore the database after a power failure or a lost disk.
- **Security and integrity**: users get only the access they are granted, and constraints reject invalid data.

Keep three terms apart. The **database** is the data. The **DBMS** is the software. The **database system** is both together with the applications that use them. The DBMS also keeps **metadata**, data about the data (table definitions, column types, constraints, users and privileges), in a system catalog or data dictionary; in MySQL you can read it through `INFORMATION_SCHEMA`.

## DBMS vs file system

Before databases, every program kept its records in files of its own format. Picture a college where the accounts office and the exam cell each keep their own file of students. That arrangement fails in predictable ways, and each failure became a feature of the DBMS.

| Aspect | File system | DBMS |
| --- | --- | --- |
| Redundancy | The same student stored in many files | Stored once, shared by every application |
| Consistency | An address changed in one file goes stale in the others | One copy, so one update |
| Access | A new program for every new question | Ad hoc queries in SQL |
| Format | Each file in its own layout (data isolation) | One schema, described in the catalog |
| Integrity rules | Buried in application code | Declared as constraints and enforced centrally |
| Atomicity | A crash mid-update leaves half-written data | Transactions are all or nothing |
| Concurrent access | Two programs can overwrite each other's changes | Locking or versioning keeps users apart |
| Security | Permissions on whole files only | Access per table, column or view, per user |
| Recovery | Manual copies | Logging, backups and point-in-time recovery |

A file system is still the right tool for some jobs: a small single-user tool, logs that are only appended and read in order, or large media files (a database usually stores the video's path, not the video).

## Data models

A **data model** is the set of concepts used to describe a database's structure: what kinds of things exist, how they relate, and which rules they obey.

| Model | Structure | Example systems |
| --- | --- | --- |
| Hierarchical | Records in a tree; each child has one parent | IBM IMS |
| Network | Records linked as a graph; a child may have several parents | CODASYL systems such as IDMS |
| Relational | Tables (relations) of rows and columns, linked by keys | MySQL, PostgreSQL, Oracle |
| Entity–relationship | Entities, attributes and relationships; a design model | Drawn on paper and in design tools |
| Object-relational | Tables extended with user-defined types and inheritance | PostgreSQL |
| NoSQL models | Documents, key-value pairs, wide columns, graphs | MongoDB, Redis, Cassandra, Neo4j |

Models are also grouped by how close they sit to the user. **Conceptual** models (the ER model) describe data the way people think about it. **Representational** or logical models (the relational model) describe what the DBMS implements. **Physical** models describe files, pages and record layouts. The relational model, proposed by E. F. Codd in 1970, became the standard for business data because tables are simple, its query languages are declarative, and its theory of keys, dependencies and normal forms is exact.

## The three-schema architecture

A **schema** is the description of a database, its design. An **instance** (or state) is the data stored in it at one moment. The schema changes rarely; the instance changes with every insert. The ANSI/SPARC **three-schema architecture** describes one database at three levels:

| Level | Also called | Describes | Example |
| --- | --- | --- | --- |
| External | View level | What one user or application sees | The exam cell sees roll number, name and marks only |
| Conceptual | Logical level | The whole database: entities, attributes, relationships, constraints | Tables `student`, `course`, `enrollment` with their keys |
| Internal | Physical level | How data is stored: files, pages, record layout, indexes | Rows in 16 KB pages; a B+ tree index on `roll_no` |

The DBMS keeps two **mappings**: external/conceptual (how a view is computed from the tables) and conceptual/internal (how each table is stored). A query on a view is translated through both mappings down to page reads. There can be many external schemas, but there is exactly one conceptual schema and one internal schema.

## Data independence

Data independence is the payoff of the three levels: the schema at one level can change without changing the schema at the level above, because only the mapping between them changes.

- **Physical data independence**: change the internal schema without changing the conceptual schema. Adding an index, moving a table to a faster disk, compressing pages or changing the file organization leaves every table definition and every query untouched.
- **Logical data independence**: change the conceptual schema without changing the external schemas or the programs written against them. Adding a column, or splitting `student` into two tables and redefining the old view as their join, leaves applications that read through the view working.

Logical data independence is harder to achieve. Applications depend on the logical structure (table and column names, which table holds what), while almost nothing depends on how pages are laid out. Every relational DBMS gives you physical independence; logical independence holds only as far as views can hide a change.

## Database users and the DBA

| User | How they use the database |
| --- | --- |
| Naive or end users | Through forms and apps, never seeing SQL: a student checking results, a bank clerk |
| Application programmers | Write the programs those users run, using SQL through a driver or an ORM |
| Sophisticated users | Query directly: analysts and data scientists writing SQL |
| Specialized users | Build non-standard applications: CAD data, maps, scientific stores |
| Database designers | Choose the tables, keys and constraints before data arrives |
| Database administrator | Runs and protects the whole system |

The **DBA**'s duties are a standard interview list: defining the schema and storage structures, changing them as needs evolve, granting and revoking authorization, planning backups and recovery, monitoring performance and disk space, tuning indexes and queries, and applying upgrades and security patches.

## Types of databases and architectures

| Type | What it means | Examples |
| --- | --- | --- |
| Relational | Tables, SQL, ACID transactions | MySQL, PostgreSQL, Oracle, SQL Server |
| NoSQL | Non-relational models built for scale or flexible schemas | MongoDB, Redis, Cassandra, Neo4j |
| Centralized | All data at one site | A single MySQL server |
| Distributed | Data spread over many machines, seen as one database | Google Spanner, CockroachDB, Cassandra |
| OLTP | Many short read-write transactions | Banking, ticket booking, orders |
| OLAP or data warehouse | Large read-mostly analytical queries over history | Snowflake, Amazon Redshift, BigQuery |
| In-memory | Data held in RAM for speed | Redis, SAP HANA |
| Time-series | Measurements indexed by time | InfluxDB, TimescaleDB |

The labels overlap: PostgreSQL is relational, centralized by default and mostly used for OLTP, while a warehouse is relational but tuned for OLAP.

Applications reach a database in one of three arrangements. In a **one-tier** setup the user works on the database directly, as a DBA does at a console or an app does with an embedded SQLite file. In a **two-tier** (client-server) setup the client program talks straight to the database server. In a **three-tier** setup the client talks to an application server, which alone talks to the database; this is how web applications work, and it keeps database credentials and business rules off the user's device.

## Common mistakes

- Calling MySQL "a database": it is a DBMS that manages many databases.
- Describing the three levels as three databases: they are three descriptions of one database.
- Swapping the two independences: adding an index is physical, adding a column is logical.
- Using "schema" and "instance" as synonyms: the schema is the design, the instance is today's data.
- Claiming a DBMS is always faster than files: it is safer and more general, but a plain file can be faster for one fixed access pattern.

## Interview questions

**What is a DBMS? Name its main functions.** A DBMS is software for defining, storing, querying and administering a database. Its main functions are data definition, data manipulation, query optimization, transaction management, concurrency control, recovery, and security with integrity enforcement.

**What problems of file-based systems does a DBMS solve?** Redundancy and inconsistency, difficulty of answering new questions, data isolated in different formats, integrity rules hidden in code, partial updates after a crash, concurrent programs overwriting each other, and coarse security. Each maps to a DBMS feature: one shared schema, SQL, constraints, transactions, concurrency control and access control.

**Explain the three-schema architecture.** It describes one database at the internal (physical storage), conceptual (logical structure of the whole database) and external (per-user views) levels. The DBMS maps between adjacent levels, so a change at one level is absorbed by a mapping instead of reaching the users.

**What is the difference between physical and logical data independence? Which is harder?** Physical independence means changing storage without changing tables; logical independence means changing tables without changing applications or views. Logical independence is harder, because programs depend on table and column names but not on page layouts.

**What is the difference between a schema and an instance?** The schema is the structure: table names, columns, types and constraints. The instance is the data present at a given moment. The schema is sometimes called the intension and the instance the extension.

**What is a data dictionary?** It is the system catalog: metadata describing every table, column, type, index, constraint, user and privilege. The DBMS reads it to check and plan every query; in MySQL it is exposed through `INFORMATION_SCHEMA`.

**What are DDL and DML?** DDL (`CREATE`, `ALTER`, `DROP`) defines the structure, and DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) works on the rows. The [SQL basics note](/notes/dbms/sql-basics) covers them with DCL and TCL.

**What is the difference between two-tier and three-tier architecture?** In two-tier, the client connects to the database directly. In three-tier, an application server sits between them, holding business logic and the database connection, which improves security and lets each tier scale on its own.

Next, learn to design a database before building it: [ER Model in DBMS](/notes/dbms/er-model). To check the basics, try the [SQL (Basic) skill test](/skill-tests/sql-basic).
