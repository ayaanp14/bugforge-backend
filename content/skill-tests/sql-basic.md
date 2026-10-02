---
updated: 2026-10-03
question: What does the SQL (Basic) skill test cover?
answer: It certifies that you can read a SQL query and say exactly what it returns. Each multiple-choice question gives small tables and a query covering SELECT and filtering, joins, GROUP BY and aggregates, subqueries, NULL handling, UNION, or table constraints, with a few on indexes and normal forms. There is no coding section, and every question is written so MySQL 8 and PostgreSQL agree on the answer.
q: Do I write any SQL in the SQL (Basic) test?
a: No. Every question gives you the tables and a finished query, then asks which rows come back, in what order, how many, or whether the statement fails. There is no editor and no coding section: reading a query exactly is the skill being certified, so your time goes into tracing rather than typing.
q: Is the SQL test based on MySQL or PostgreSQL?
a: Both. Questions are written so that MySQL 8 and PostgreSQL give the same answer, and where the two genuinely differ a question either avoids the difference or names the database it means. If you learned SQL on SQL Server, Oracle or SQLite the core carries over, but get used to MySQL and PostgreSQL syntax such as LIMIT.
q: Are window functions or transactions part of the Basic test?
a: No. The Basic test stays with SELECT, joins, grouping, subqueries, NULL handling, UNION, constraints, and a few questions on indexes and normal forms. Window functions, recursive queries, isolation levels and index design are examined in the SQL (Intermediate) test.
q: How much database theory is in the Basic test?
a: A little, next to a lot of query reading. Expect questions on what primary keys, UNIQUE, NOT NULL, DEFAULT and foreign keys allow or refuse, what an index is for and what it costs, and the first two normal forms with the update problems they prevent. Definitions alone are rarely enough; the questions put them to work on a table.
q: What is the best way to practise for the SQL Basic test?
a: Build tiny tables of four or five rows that include a repeated key, a row with no match in the other table and a NULL, then predict a query's result on paper before running it. Those three ingredients produce most surprising results, and checking every prediction against a real database is how the habit of exact reading forms.
---

SQL (Basic) is a reading test. Every question gives you one or two small tables and a query, and asks exactly what comes back: which rows, in what order, how many of them, or whether the database refuses the statement. There is nothing to type. What it certifies is that you can predict a database's answer before you run the query, which is most of what writing correct SQL takes.

The questions use SQL that MySQL 8 and PostgreSQL run identically. Where the two genuinely disagree, a question avoids the difference or says which one it means, so you never have to guess a dialect. If you want the harder material — window functions, recursive queries, transactions and index design — that is the [SQL (Intermediate) test](/skill-tests/sql-intermediate).

## What the questions cover

- **SELECT and filtering.** WHERE with AND, OR and NOT and how they bind, ranges with BETWEEN, lists with IN, patterns with LIKE and its two wildcards, DISTINCT, computed columns, sorting on several keys, and LIMIT with OFFSET.
- **Joins.** Inner, left, cross and self joins, joins across three tables, and the number of rows a join produces when keys repeat or have no partner.
- **Aggregation and GROUP BY.** COUNT, SUM, AVG, MIN and MAX, grouping on one or more columns, and the difference between filtering rows with WHERE and filtering groups with HAVING.
- **Subqueries.** IN and EXISTS, a subquery that produces a single value, and simple common table expressions written with WITH.
- **NULL handling.** Why a comparison with NULL is neither true nor false, IS NULL, COALESCE, and how aggregates, grouping and DISTINCT treat missing values.
- **Set operations.** UNION against UNION ALL, and the rules for stacking two result sets.
- **Tables and constraints.** Primary keys, UNIQUE, NOT NULL, DEFAULT and foreign keys, and what each one lets in or refuses.
- **Indexes.** What an index speeds up and what it costs.
- **Normalization.** First and second normal form, and the update problems that a badly split table causes.

For the theory behind the last few, the [OS, DBMS & Networks MCQs](/aptitude/os-dbms-networks) cover keys, constraints and normal forms in a quicker format.

## Read a query in the order the database runs it

A query is written SELECT first, but it is evaluated in a different order: FROM and the joins build a set of rows, WHERE removes some of them, GROUP BY folds what is left into groups, HAVING removes groups, SELECT computes the output columns, DISTINCT drops duplicates, ORDER BY sorts, and LIMIT cuts. Many surprising results come from losing track of that order, so trace a query in it rather than in the order its clauses are written.

On paper that means a short routine. Write out the joined rows first, one line per pair, including the rows an outer join pads with NULLs. Strike through what WHERE removes. Draw a box round each group and compute its aggregates. Only then look at the select list, the sort and the limit. It is slower than reading the query once, and it is the difference between a near guess and a certain answer, especially on questions that ask how many rows come back.

## Habits that keep you accurate

- **Check whether the order is defined.** Without ORDER BY a database may return rows in any order, so such questions ask for a count or for the rows in any order. With ORDER BY, look at every key and its direction, and at what breaks a tie.
- **Treat NULL as unknown, not as zero or empty.** Ask of every condition what it does when one side is NULL, and of every aggregate whether it skips NULLs or counts them.
- **Count pairs, not rows, in a join.** A join returns every matching pair, so a key that appears twice on each side produces four rows.
- **Decide "it fails" from the rules.** A few options say the statement is refused. Some queries that look unusual are valid, and some that look natural are not; settle it from what the clause allows rather than from habit.
- **Judge every option of a "select all" question.** Only the exact set of correct options scores.

## How to prepare

Work with a real database if you can: MySQL 8 or PostgreSQL on your own machine both work, and running the same query on each is a good check that you are not leaning on one product's habits. Make tiny tables of your own — four or five rows, with a repeated key, a row that has no partner, and a NULL somewhere — and predict every query's result before you run it. When a prediction is wrong, work out which step of the evaluation order you skipped.

Practise the constraints by trying to break them: insert a duplicate key, a NULL into a NOT NULL column, a child row with no parent, and see what the database says. For the normal-form and key questions, the [OS, DBMS & Networks](/aptitude/os-dbms-networks) set has short theory questions with explanations. When the Basic material feels routine, the [Intermediate test](/skill-tests/sql-intermediate) adds window functions, correlated and recursive subqueries, index design, BCNF and transaction isolation.

## Sample question
topic: joins
answer: B

Table `customers`:

| id | name | city |
| --- | --- | --- |
| 1 | Anil | Pune |
| 2 | Bina | Delhi |
| 3 | Chetan | Pune |
| 4 | Divya | Jaipur |

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 10 | 1 | 300 |
| 11 | 3 | 200 |
| 12 | 1 | 100 |
| 13 | 2 | 250 |

```sql
SELECT c.city, SUM(o.amount) AS total
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.city
ORDER BY total DESC;
```

What does the query return?

- A: `('Pune', 600), ('Delhi', 250), ('Jaipur', NULL)`
- B: `('Pune', 600), ('Delhi', 250)`
- C: `('Pune', 500), ('Delhi', 250)`
- D: `('Pune', 600), ('Delhi', 250), ('Jaipur', 0)`

> The inner join pairs every order with its customer: (Pune, 300) and
> (Pune, 100) for Anil, (Pune, 200) for Chetan and (Delhi, 250) for Bina.
> Divya has no orders, so she produces no row at all. Grouping by city then
> adds Anil's and Chetan's orders together: Pune 600, Delhi 250. Jaipur would
> appear only with a LEFT JOIN, with a total of NULL (or 0 inside COALESCE).
> 500 is what you would get if a join matched each customer to just one
> order; it returns every matching pair.
