---
title: LEFT and RIGHT JOIN — keeping the rows without a match
minutes: 16
seo-title: SQL LEFT JOIN vs RIGHT JOIN: Outer Joins and ON vs WHERE
description: A LEFT JOIN keeps every row of the left table and fills NULLs where no match exists. RIGHT JOIN mirrors it; filtering in ON vs WHERE changes the answer.
question: What is the difference between LEFT JOIN and INNER JOIN?
answer: An INNER JOIN returns only rows that found a match in both tables. A LEFT JOIN (LEFT OUTER JOIN) returns every row of the left table, matched or not; where the right table has no matching row, its columns come back as NULL. Use a LEFT JOIN whenever rows without a partner, such as customers with no orders, must still appear.
q: Why does my LEFT JOIN behave like an INNER JOIN?
a: A condition on the right table was put in `WHERE`. For unmatched rows the right table's columns are NULL, so `WHERE o.status = 'paid'` is unknown and removes them, undoing the outer join. Move the condition into the `ON` clause, as in `LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'`.
q: Should I use COUNT(*) or COUNT(column) after a LEFT JOIN?
a: Count a column of the right table, such as `COUNT(o.id)`. An unmatched left row still produces one result row, so `COUNT(*)` counts it as 1. `COUNT(o.id)` skips NULLs and correctly returns 0 for a customer with no orders.
q: Is RIGHT JOIN ever necessary?
a: No. `A RIGHT JOIN B` returns exactly the rows of `B LEFT JOIN A`, so any right join can be rewritten by swapping the tables. Most teams write only left joins so that the table whose rows are all kept is always the first one named, which makes queries easier to read.
q: Is LEFT OUTER JOIN the same as LEFT JOIN?
a: Yes. `OUTER` is optional in MySQL, PostgreSQL and SQL Server, so `LEFT JOIN` and `LEFT OUTER JOIN` are identical, as are `RIGHT JOIN` and `RIGHT OUTER JOIN`. The word only signals that unmatched rows are kept.
---
An inner join answers "which pairs match?". Many real questions are different: *every* customer and how much each spent, including the ones who spent nothing; every product and its last sale, if any; every student and their grade, blank if not yet graded. Dropping the unmatched rows would give a wrong report — the customers who never ordered are often exactly the ones the business wants to see. **Outer joins** keep them. This lesson covers `LEFT JOIN`, its mirror `RIGHT JOIN`, counting and summing after an outer join, and the most common outer-join bug in interviews and production code: a condition in the wrong clause.

## LEFT JOIN

```sql
SELECT c.name, o.id AS order_id, o.amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
ORDER BY c.name, o.id;
```

With the module's data (Asha has orders 10 and 11, Ben has 12, Chen has none, order 13 belongs to a missing customer 9):

```text
name | order_id | amount
Asha | 10       | 250
Asha | 11       | 100
Ben  | 12       | 400
Chen | NULL     | NULL
```

The rule: **every row of the left table appears at least once**. A left row with matches appears once per match, exactly as in an inner join. A left row with no match appears once, with every column of the right table set to `NULL`. Order 13 is still gone — it is on the right side, and the right side keeps only matched rows.

"Left" simply means the table written before `LEFT JOIN`. Choosing it is choosing whose rows are guaranteed: here, customers.

## RIGHT JOIN is the same thing backwards

```sql
SELECT c.name, o.id AS order_id
FROM customers c
RIGHT JOIN orders o ON o.customer_id = c.id
ORDER BY o.id;
```

```text
name | order_id
Asha | 10
Asha | 11
Ben  | 12
NULL | 13
```

Now every order is kept and the orphan order 13 shows a `NULL` name. `A RIGHT JOIN B` equals `B LEFT JOIN A`, so it never adds expressive power. Most style guides write only left joins — the preserved table is then always the one in `FROM`, which you can see at a glance. You should still read right joins fluently, because they appear in legacy code and interview questions.

## Counting after an outer join

```sql
SELECT c.name,
       COUNT(*)    AS wrong_count,
       COUNT(o.id) AS orders,
       COALESCE(SUM(o.amount), 0) AS spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
```

```text
name | wrong_count | orders | spent
Asha | 2           | 2      | 350
Ben  | 1           | 1      | 400
Chen | 1           | 0      | 0
```

Chen's group has one row — the NULL-filled one — so `COUNT(*)` says 1. `COUNT(o.id)` counts non-NULL values and says 0, which is the truth. Count a right-side column that is never NULL in a real match (its primary key is ideal). `SUM` over nothing but NULLs is `NULL`, not 0; `COALESCE(SUM(o.amount), 0)` turns it into a number for the report.

## The trap: ON versus WHERE

Suppose the report should count only orders from February 2024, but still list every customer.

```sql
-- Wrong: the filter is in WHERE
SELECT c.name, COUNT(o.id) AS feb_orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.order_date >= '2024-02-01' AND o.order_date < '2024-03-01'
GROUP BY c.id, c.name
ORDER BY c.name;
```

```text
name | feb_orders
Asha | 1
Ben  | 1
```

Chen vanished. The join produced Chen's NULL-filled row as promised — and then `WHERE` evaluated `NULL >= '2024-02-01'`, which is unknown, and discarded it. Any `WHERE` condition on a right-table column that rejects `NULL` turns the left join back into an inner join.

```sql
-- Right: the filter is part of the match
SELECT c.name, COUNT(o.id) AS feb_orders
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.order_date >= '2024-02-01' AND o.order_date < '2024-03-01'
GROUP BY c.id, c.name
ORDER BY c.name;
```

```text
name | feb_orders
Asha | 1
Ben  | 1
Chen | 0
```

The rule to memorise:

- a condition on the **right (optional) table** that decides *which rows count as a match* belongs in `ON`;
- a condition on the **left (preserved) table** that decides *which left rows appear at all* belongs in `WHERE` — putting it in `ON` does not filter the left table, it only stops those left rows from matching, and they still appear with NULLs.

```sql
-- Only Pune customers, each with their orders (or NULLs)
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE c.city = 'Pune'
ORDER BY c.name, o.id;
```

There is one deliberate exception: `WHERE o.id IS NULL` after a left join keeps *only* the unmatched rows. That is the anti-join pattern, covered in the semi- and anti-joins lesson.

## Chaining outer joins

Left joins chain left to right: each one keeps every row produced so far.

```sql
SELECT c.name, o.id AS order_id, s.shipped_on
FROM customers c
LEFT JOIN orders o    ON o.customer_id = c.id
LEFT JOIN shipments s ON s.order_id = o.id
ORDER BY c.name, o.id;
```

Chen still appears (NULL order, NULL shipment), and an order with no shipment appears with a NULL date. If the second join were an inner `JOIN`, its condition `s.order_id = o.id` would fail for Chen's NULL order, and Chen would disappear — one inner join after a left join quietly undoes it. The joining-many-tables lesson works through that case.

## Telling a real NULL from a missing match

If a right-table column can itself be NULL — a `shipped_on` that is NULL for an order not yet shipped — then a NULL in the result is ambiguous: no matching row, or a matching row with an empty value? Test the right table's primary key instead: `s.id IS NULL` means no match, because a real row always has its key.

## In other databases

`LEFT [OUTER] JOIN` and `RIGHT [OUTER] JOIN` are standard and behave identically in PostgreSQL, SQL Server, Oracle and SQLite. Oracle's legacy `(+)` syntax (`WHERE c.id = o.customer_id(+)`) is the same left join in old code. The ON-versus-WHERE behaviour is part of the standard, so the trap exists everywhere.

## Pitfalls

- Filtering the optional table in `WHERE` and losing the unmatched rows.
- `COUNT(*)` after a left join counting the NULL row as 1.
- `SUM` returning NULL for "nothing" instead of 0.
- An inner join chained after a left join.
- Testing a nullable right-side column to detect "no match".

## Key takeaways

- `LEFT JOIN` keeps every left row; unmatched rows get NULLs for the right table's columns.
- `A RIGHT JOIN B` = `B LEFT JOIN A`; prefer writing left joins.
- Count a right-side key (`COUNT(o.id)`), and `COALESCE` sums to 0.
- Conditions on the optional table go in `ON`; conditions on the preserved table go in `WHERE`.
- Detect "no match" with the right table's primary key being NULL.
