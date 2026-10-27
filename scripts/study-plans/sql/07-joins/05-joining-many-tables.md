---
title: Joining three or more tables
minutes: 16
seo-title: How to Join Multiple Tables in SQL: Junctions and Fan-Out
description: Joining three or more tables in SQL chains one join at a time. Junction tables, mixing LEFT and INNER joins, and the fan-out that double counts.
question: How do you join more than two tables in SQL?
answer: Chain the joins: each `JOIN … ON` adds one table to the rows built so far, so `FROM a JOIN b ON … JOIN c ON …` joins `c` to the combined result of `a` and `b`. Every new table needs its own condition linking it to a table already in the query. Many-to-many relationships go through a junction table, such as enrollments between students and courses.
q: Does the order of joins matter in SQL?
a: For inner joins, no: the result is the same in any order and the optimizer picks its own execution order. With outer joins the order matters, because each `LEFT JOIN` preserves the rows produced so far. A plain `JOIN` written after a `LEFT JOIN` on the optional table removes the rows the left join had kept.
q: What is a junction table?
a: A junction (bridge, link) table stores a many-to-many relationship as pairs of foreign keys, such as `enrollments(student_id, course_id)`. A student can take many courses and a course has many students. To go from students to courses you join twice: students to enrollments, then enrollments to courses.
q: Why do my sums double when I join two child tables?
a: Joining a parent to two one-to-many tables pairs every row of the first child with every row of the second, so a customer with 3 orders and 2 payments yields 6 rows and each amount is counted 2 or 3 times. Aggregate each child separately in a derived table, then join the totals.
q: How do I keep LEFT JOIN rows when joining a third table?
a: Make the third join a `LEFT JOIN` too. If a NULL-filled row from the first left join meets an inner `JOIN` whose condition uses that NULL, the condition is unknown and the row is removed. Every table hanging off an optional table must itself be left-joined.
---
Real schemas have more than two tables, and real questions cross several of them: which teacher teaches each course a student takes; how much revenue each product category made from orders placed in 2024; which customers bought from which supplier. SQL handles any number of tables with the same tool — one more `JOIN … ON` per table — but three new hazards appear once there are more than two: junction tables that must be crossed in two steps, outer joins undone by a later inner join, and the **fan-out** that silently multiplies totals. This lesson covers each.

## A chain of joins

A school schema:

```sql
CREATE TABLE students    (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE teachers    (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE courses     (id INT PRIMARY KEY, title VARCHAR(40), teacher_id INT);
CREATE TABLE enrollments (student_id INT, course_id INT, grade INT);
```

To list each student's courses with the teacher's name:

```sql
SELECT s.name AS student, c.title AS course, t.name AS teacher
FROM students s
JOIN enrollments e ON e.student_id = s.id
JOIN courses c     ON c.id = e.course_id
JOIN teachers t    ON t.id = c.teacher_id
ORDER BY s.name, c.title;
```

Read it top to bottom as a pipeline. Start with students. Join enrollments: now there is one row per (student, enrollment). Join courses: each enrollment row gains its course. Join teachers: each course row gains its teacher. Each `ON` links the new table to one already present — the query fails, or worse, cross joins, if a table is added without a condition connecting it.

For inner joins the textual order is for the reader, not the database: the optimizer reorders inner joins freely and returns the same rows. Write them in the order that tells the story, usually following the foreign keys.

## Many-to-many through a junction table

Students and courses are many-to-many: one student takes many courses, one course has many students. A relational table cannot hold a list in a column, so the relationship lives in its own table — `enrollments`, one row per (student, course) pair, often with facts about the pair (a grade, a date). Going from a student to their courses always crosses it:

```text
students ──< enrollments >── courses
```

Two joins, and the junction table's columns (here `grade`) are available along the way. Counting the students of each course is a join plus a group:

```sql
SELECT c.title AS course, COUNT(e.student_id) AS students
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title
ORDER BY students DESC, c.title;
```

## Mixing LEFT and INNER joins

Now suppose some courses have no teacher yet (`teacher_id` is NULL) and the timetable must still show them. The fourth join must be a left join:

```sql
SELECT s.name AS student, c.title AS course, t.name AS teacher
FROM students s
JOIN enrollments e ON e.student_id = s.id
JOIN courses c     ON c.id = e.course_id
LEFT JOIN teachers t ON t.id = c.teacher_id
ORDER BY s.name, c.title;
```

The opposite mistake is the one that hides in long queries. Start from students with a left join, so that students with no enrollments appear — and then add courses with a plain `JOIN`:

```sql
SELECT s.name, c.title
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id      -- removes the unenrolled students again
ORDER BY s.name, c.title;
```

For an unenrolled student the left join produced a row with `e.course_id` NULL; the inner join's condition `c.id = NULL` is unknown, and the row is dropped. The rule: **once a table is optional, everything joined through it must be left-joined too.** Change the last join to `LEFT JOIN` and the unenrolled students come back with a NULL course.

(Standard SQL also allows nesting — `LEFT JOIN (enrollments e JOIN courses c ON …) ON e.student_id = s.id` — which means "the enrollment-with-course pairs, optionally". It is correct but rarely written; a chain of left joins is easier to read.)

## Fan-out: when joins multiply totals

Each one-to-many join multiplies rows. With one child table that is expected. With two *independent* child tables it is a bug:

```sql
-- Customer 1 has 3 orders (total 300) and 2 payments (total 250).
SELECT c.name, SUM(o.amount) AS ordered, SUM(p.amount) AS paid
FROM customers c
LEFT JOIN orders o   ON o.customer_id = c.id
LEFT JOIN payments p ON p.customer_id = c.id
GROUP BY c.id, c.name;
```

```text
name | ordered | paid
Asha | 600     | 750
```

Orders and payments are not related to each other, so every order row was paired with every payment row: 3 × 2 = 6 rows. Each order was counted twice (once per payment) and each payment three times. The query runs without error and the numbers look plausible — which is why this bug survives code review.

Fixes, best first:

- **aggregate each child first, then join the totals** — a derived table per child (the subqueries module shows it), so each customer meets at most one order-total row and one payment-total row;
- for counts, `COUNT(DISTINCT o.id)` undoes the multiplication, but there is no safe `SUM(DISTINCT …)` — two different orders of 100 would collapse into one;
- run two separate queries.

Fan-out is not limited to two children. Joining `orders` to `order_items` and then summing `orders.shipping_fee` counts the fee once per item. Before summing a column, ask which table it lives in and whether the joins after that table can repeat its rows.

## Filtering in a long join

Filters still go in `WHERE` when they apply to a table that must match anyway:

```sql
SELECT cat.name AS category, SUM(i.qty * p.price) AS revenue
FROM orders o
JOIN order_items i ON i.order_id = o.id
JOIN products p    ON p.id = i.product_id
JOIN categories cat ON cat.id = p.category_id
WHERE o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'
GROUP BY cat.id, cat.name
ORDER BY revenue DESC, category;
```

The date range is written as a half-open interval on the raw column rather than `YEAR(o.order_date) = 2024`; both return the same rows, but the first can use an index on `order_date` (the indexes module explains why). If a category with no 2024 sales must still appear, start from categories and left-join the rest — and then the date filter belongs in the `ON` of the orders join, for the reason in the outer-joins lesson.

## Pitfalls

- A table added without a condition linking it to the rest (a cross join).
- An inner join after a left join on the optional side.
- Summing across two independent one-to-many joins (fan-out).
- `SUM(DISTINCT …)` as a fan-out fix — it merges equal values from different rows.
- Grouping by a name instead of a key when several tables have names.

## Key takeaways

- Each `JOIN … ON` adds one table to the rows built so far; read the chain as a pipeline.
- Inner join order does not change the result; outer join order does.
- Many-to-many relationships go through a junction table and need two joins.
- Everything joined through an optional table must be left-joined.
- Two independent child tables multiply each other's rows; aggregate each before joining.
