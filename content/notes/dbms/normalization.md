---
title: Normalization in DBMS: 1NF to BCNF
order: 5
minutes: 15
level: intermediate
updated: 2026-10-05
seo-title: Normalization in DBMS: 1NF, 2NF, 3NF and BCNF Explained
description: Normalization in DBMS on one running example: anomalies, 1NF, 2NF, 3NF and BCNF decompositions, lossless joins, dependency preservation, 4NF, denormalizing.
question: What is normalization in DBMS?
answer: Normalization is the process of splitting a table into smaller tables, guided by functional dependencies, so that each fact is stored once. It removes insertion, update and deletion anomalies. Each normal form forbids one kind of dependency: 2NF forbids partial dependencies on a key, 3NF transitive ones, and BCNF any dependency whose determinant is not a super key. Every split must be lossless.
q: What is the difference between 3NF and BCNF?
a: 3NF allows a non-trivial dependency X → A if X is a super key or A is a prime attribute (part of some candidate key). BCNF drops the second escape: X must always be a super key. BCNF is stricter, and a relation can be in 3NF but not BCNF only when it has overlapping candidate keys.
q: What is a partial dependency?
a: A partial dependency is a non-prime attribute that depends on only part of a composite candidate key. With key (roll_no, course_id), the dependency course_id → course_title is partial. Second normal form removes partial dependencies by moving such attributes into a table keyed by the part they depend on.
q: What is a transitive dependency?
a: A transitive dependency is a non-prime attribute that depends on the key through another non-key attribute: roll_no → dept and dept → hod, so hod depends on roll_no only via dept. Third normal form removes it by moving dept and hod into a separate department table.
q: What is a lossless join decomposition?
a: Splitting R into R1 and R2 is lossless if joining them back always gives exactly R, with no extra rows. The test: the common attributes must be a super key of R1 or of R2. A lossy split creates spurious rows on the join, so you can no longer tell real facts from false ones.
q: Is BCNF always dependency preserving?
a: No. A lossless BCNF decomposition always exists, but it may lose a dependency, so that the rule can only be checked by joining tables. 3NF synthesis always gives a decomposition that is both lossless and dependency preserving, which is why designers sometimes stop at 3NF.
q: When should you denormalize a database?
a: Denormalize when measured read performance matters more than write simplicity: reporting tables, data warehouses with star schemas, stored totals such as an order's amount, or counters shown on every page. Normalize first, then add redundancy deliberately, with a plan to keep the copies consistent.
---

Normalization is the design discipline of storing each fact exactly once. A table that mixes facts about several things (students, departments, courses) repeats some facts on many rows, and repetition invites contradictions. Normalization splits such a table into smaller ones, using the [functional dependencies](/notes/dbms/functional-dependencies) among its columns, until every dependency is "a key determines a fact about that key". This note takes one table through 1NF, 2NF, 3NF and BCNF, checks that every split is lossless, and ends with 4NF and when to denormalize.

## The running example and its anomalies

A college keeps its enrolment sheet like this, one row per student with a list of courses:

| roll_no | name | dept | hod | courses (course_id, course_title, instructor, grade) |
| --- | --- | --- | --- | --- |
| 101 | Asha | CSE | Dr. Rao | CS301, DBMS, Sen, A; CS302, Operating Systems, Khan, B |
| 102 | Vikram | CSE | Dr. Rao | CS301, DBMS, Gupta, A |
| 103 | Meera | ECE | Dr. Iyer | CS301, DBMS, Sen, B |

The rules of the college, as functional dependencies:

| # | Dependency | Meaning |
| --- | --- | --- |
| FD1 | roll_no → name, dept | A student has one name and one department |
| FD2 | dept → hod | A department has one head |
| FD3 | course_id → course_title | A course code has one title |
| FD4 | roll_no, course_id → instructor, grade | A student takes a course in one instructor's section and gets one grade |
| FD5 | instructor → course_id | Each instructor teaches exactly one course (a course may have several instructors) |

Flattened to one row per student and course, the sheet becomes one wide table, R:

| roll_no | name | dept | hod | course_id | course_title | instructor | grade |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 101 | Asha | CSE | Dr. Rao | CS301 | DBMS | Sen | A |
| 101 | Asha | CSE | Dr. Rao | CS302 | Operating Systems | Khan | B |
| 102 | Vikram | CSE | Dr. Rao | CS301 | DBMS | Gupta | A |
| 103 | Meera | ECE | Dr. Iyer | CS301 | DBMS | Sen | B |

**Candidate keys.** roll_no appears on no right-hand side, so it is in every key, but its closure is only {roll_no, name, dept, hod}. Adding course_id gives everything (FD4, FD3); adding instructor also gives everything (FD5 brings course_id). name, dept, hod, course_title and grade appear only on right-hand sides, so they are in no key. The candidate keys are **{roll_no, course_id}** and **{roll_no, instructor}**; the prime attributes are roll_no, course_id and instructor.

The repetition causes three **anomalies**:

| Anomaly | In this table |
| --- | --- |
| Insertion | A new course CS303 cannot be recorded until some student enrols, because roll_no is part of every key and cannot be NULL |
| Update | When CSE gets a new head, three rows must change; miss one and the table contradicts itself |
| Deletion | If Meera leaves and her row is deleted, the fact that Dr. Iyer heads ECE disappears too |

## The normal forms at a glance

| Normal form | Condition | Removes |
| --- | --- | --- |
| 1NF | Every value is atomic; no repeating groups or lists | Lists inside cells |
| 2NF | 1NF, and no non-prime attribute depends on part of a candidate key | Partial dependencies |
| 3NF | For every non-trivial X → A: X is a super key or A is prime | Transitive dependencies |
| BCNF | For every non-trivial X → A: X is a super key | Every dependency on a non-key |
| 4NF | For every non-trivial multivalued dependency X ↠ Y: X is a super key | Independent multi-valued facts in one table |

Each form includes the ones above it: every BCNF relation is in 3NF, every 3NF relation in 2NF.

## First normal form (1NF)

A relation is in **1NF** when every attribute holds a single, indivisible value: no lists, no repeating groups such as course1, course2, course3, and no nested tables. The sheet above breaks 1NF, because one cell holds several courses. Flattening it to one row per (student, course) gives R, which is in 1NF. Atomicity is judged by how the data is used: a full name stored in one column is fine if you never query its parts.

## Second normal form (2NF)

A relation is in **2NF** when it is in 1NF and no non-prime attribute is **partially dependent** on a candidate key, that is, dependent on a proper subset of it. Only composite keys can cause this, so a 1NF table whose candidate keys are all single attributes is automatically in 2NF.

R has three partial dependencies: roll_no → name, dept, hod (roll_no is part of both keys), course_id → course_title (part of {roll_no, course_id}), and instructor → course_title through FD5 (part of {roll_no, instructor}). Move each group into a table keyed by its determinant:

| Table | Columns | Key |
| --- | --- | --- |
| Student | roll_no, name, dept, hod | roll_no |
| Course | course_id, course_title | course_id |
| Enrollment | roll_no, course_id, instructor, grade | {roll_no, course_id} and {roll_no, instructor} |

Student holds (101, Asha, CSE, Dr. Rao), (102, Vikram, CSE, Dr. Rao), (103, Meera, ECE, Dr. Iyer). Course holds (CS301, DBMS) and (CS302, Operating Systems), so CS303 can now be added before anyone enrols. Enrollment keeps the four rows (101, CS301, Sen, A), (101, CS302, Khan, B), (102, CS301, Gupta, A), (103, CS301, Sen, B). In Enrollment the only non-prime attribute is grade, and it depends on whole keys, so all three tables are in 2NF.

## Third normal form (3NF)

A relation is in **3NF** when, for every non-trivial dependency X → A, either X is a super key or A is a prime attribute. Equivalently: it is in 2NF and no non-prime attribute is **transitively dependent** on a key through another non-key attribute.

Student breaks 3NF: roll_no → dept and dept → hod, where dept is not a super key and hod is not prime. That is why the CSE head was repeated. Split on dept → hod:

| Table | Columns | Key | Rows |
| --- | --- | --- | --- |
| Student | roll_no, name, dept | roll_no | (101, Asha, CSE), (102, Vikram, CSE), (103, Meera, ECE) |
| Department | dept, hod | dept | (CSE, Dr. Rao), (ECE, Dr. Iyer) |

Enrollment is already in 3NF. Its one dependency without a super-key determinant is instructor → course_id, and course_id is prime (it belongs to the key {roll_no, course_id}), which 3NF allows. The 3NF design is Student, Department, Course and Enrollment.

## Boyce–Codd normal form (BCNF)

A relation is in **BCNF** when, for every non-trivial dependency X → A, X is a super key. No exception for prime attributes.

Enrollment breaks BCNF: instructor → course_id, and instructor alone is not a super key. The redundancy is visible: "Sen teaches CS301" is stored on two rows. Split on the offending dependency, X → A becomes one table (X, A), and the original loses A:

| Table | Columns | Key | Rows |
| --- | --- | --- | --- |
| Teaches | instructor, course_id | instructor | (Sen, CS301), (Gupta, CS301), (Khan, CS302) |
| Enrollment | roll_no, instructor, grade | {roll_no, instructor} | (101, Sen, A), (101, Khan, B), (102, Gupta, A), (103, Sen, B) |

The BCNF design has five tables: Student, Department, Course, Teaches and Enrollment. Every determinant in every table is now a key.

A relation can be in 3NF but not BCNF only if it has two or more candidate keys that overlap, as {roll_no, course_id} and {roll_no, instructor} do here. That is the quick answer when an interviewer asks why 3NF is "usually enough".

## Lossless join and dependency preservation

Every decomposition must be **lossless**: joining the pieces back must give exactly the original rows. For a split of R into R1 and R2 the test is that the common attributes R1 ∩ R2 are a super key of R1 or of R2.

| Step | Common attributes | Why lossless |
| --- | --- | --- |
| R into Student + the rest (2NF) | roll_no | roll_no → name, dept, hod: key of Student |
| The rest into Course + Enrollment (2NF) | course_id | course_id → course_title: key of Course |
| Student into Student + Department (3NF) | dept | dept → hod: key of Department |
| Enrollment into Teaches + Enrollment (BCNF) | instructor | instructor → course_id: key of Teaches |

A lossy split, for contrast: break Enrollment into (roll_no, grade) and (course_id, grade). The common attribute grade determines nothing, and the join back on grade returns six rows instead of four:

| roll_no | course_id | grade | Real? |
| --- | --- | --- | --- |
| 101 | CS301 | A | Yes |
| 102 | CS301 | A | Yes |
| 101 | CS302 | B | Yes |
| 101 | CS301 | B | Spurious |
| 103 | CS302 | B | Spurious |
| 103 | CS301 | B | Yes |

A lossy join adds rows rather than dropping them; the information lost is which rows are true.

A decomposition is **dependency preserving** if every original dependency can be checked inside a single table, without joins. The 2NF and 3NF steps preserve all five dependencies. The BCNF step does not: FD4, (roll_no, course_id) → instructor, grade, now spans Teaches and Enrollment. Nothing stops inserting (101, Gupta, C) into Enrollment, which puts student 101 in CS301 a second time under another instructor; catching it needs a join or a trigger.

This trade-off is a theorem, not a flaw of this example: a lossless BCNF decomposition always exists but may not preserve dependencies, while 3NF synthesis always gives one that is both lossless and dependency preserving. Many designers stop at 3NF when they meet it. A practical middle way is to keep the 3NF Enrollment(roll_no, course_id, instructor, grade) and add a composite foreign key (instructor, course_id) referencing Teaches, so both rules are enforced by constraints.

## Fourth normal form, briefly

A **multivalued dependency** X ↠ Y says that the set of Y values for an X value is independent of the other attributes. Suppose a separate table lists each course's instructors and recommended textbooks, which have nothing to do with each other:

| course_id | instructor | textbook |
| --- | --- | --- |
| CS301 | Sen | Korth |
| CS301 | Sen | Navathe |
| CS301 | Gupta | Korth |
| CS301 | Gupta | Navathe |

The only key is all three columns and there are no non-trivial functional dependencies, so the table is in BCNF. Yet adding a third textbook needs two new rows, one per instructor. course_id ↠ instructor and course_id ↠ textbook hold with course_id not a super key, so it breaks **4NF**. Split it into (course_id, instructor) and (course_id, textbook), which is lossless. Fifth normal form deals with join dependencies that are not implied by keys, and rarely comes up in practice.

## When to denormalize

Normalization optimizes for correct writes; every split adds a join to some read. **Denormalization** deliberately reintroduces redundancy where reads dominate:

- Reporting and analytics, where data warehouses use star schemas with wide, repeated dimension columns.
- Derived values read constantly: an order's total, a post's like count, a user's solved count.
- Hot pages where a join on every request costs more than keeping a copy in sync.

The price is the anomalies you removed: the copy must be updated in the same transaction, by a trigger, or by a job that tolerates brief staleness. Normalize first, measure, then denormalize the specific paths that need it.

## Common mistakes

- Defining 2NF with the primary key only: partial dependencies on any candidate key count.
- Calling Enrollment "not in 3NF" because of instructor → course_id: course_id is prime, so 3NF allows it; only BCNF forbids it.
- Splitting on a dependency without checking the join is lossless: the common columns must be a key of one side.
- Assuming BCNF is always the goal: it can cost dependency preservation.
- Thinking a lossy join loses rows: it produces extra, spurious rows.
- Normalizing "for performance": normalization improves integrity; it often makes reads slower.

## Interview questions

**Why do we normalize a database?** To remove redundancy and the insertion, update and deletion anomalies it causes. Each fact is stored once, so it can be changed in one place and cannot contradict itself.

**Explain 1NF, 2NF and 3NF with an example.** 1NF: atomic values, one course per row. 2NF: no non-key attribute depends on part of a composite key, so course_title moves to Course. 3NF: no non-key attribute depends on another non-key attribute, so hod moves from Student to Department.

**What is the difference between 3NF and BCNF? Give a relation in 3NF but not BCNF.** BCNF requires every determinant to be a super key; 3NF also allows a dependency whose right side is prime. Enrollment(roll_no, course_id, instructor, grade) with instructor → course_id is in 3NF but not BCNF.

**How do you test whether a decomposition is lossless?** For two pieces, check that their common attributes functionally determine all of one piece, that is, form a super key of R1 or of R2. If neither holds, the natural join can create spurious rows.

**What is dependency preservation and why does it matter?** Every original dependency can be checked within one decomposed table. If one is lost, enforcing it needs a join on every insert or update, which is expensive, so the rule usually goes unenforced.

**Is a relation with only two attributes always in BCNF?** Yes. Any non-trivial dependency between two attributes A → B makes A a super key, because A then determines both attributes.

**What is a multivalued dependency? Which normal form handles it?** X ↠ Y means the set of Y values for each X is independent of the remaining attributes, as with a course's instructors and its textbooks. 4NF requires the determinant of every non-trivial multivalued dependency to be a super key.

**When would you not normalize fully?** When read performance on a measured hot path needs fewer joins, in data warehouses, or when BCNF would lose a dependency you must enforce. The redundancy is then maintained deliberately.

Next, write the tables you designed in SQL: [SQL Basics: DDL, DML, DCL and TCL](/notes/dbms/sql-basics). Normal forms are examined in the [SQL (Intermediate) skill test](/skill-tests/sql-intermediate).
