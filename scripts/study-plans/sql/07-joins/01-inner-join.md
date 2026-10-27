---
title: INNER JOIN — matching rows across tables
minutes: 15
seo-title: SQL INNER JOIN Explained: ON, Aliases and Row Matching
description: An SQL INNER JOIN pairs each row of one table with the matching rows of another and drops the rest. ON vs USING, aliases, one-to-many duplicates.
question: What does INNER JOIN do in SQL?
answer: An INNER JOIN combines two tables by pairing every row of the first with every row of the second that satisfies the join condition, usually written `ON a.key = b.key`. Rows with no partner on the other side are dropped from the result. One row can match several rows, so a one-to-many join returns the parent row once per child.
q: What is the difference between JOIN and INNER JOIN in MySQL?
a: There is none. In MySQL `JOIN`, `INNER JOIN` and even `CROSS JOIN` with an `ON` clause are synonyms; `INNER` is optional noise that some teams keep for readability. Standard SQL treats `CROSS JOIN` as the join without a condition, so write `JOIN … ON` for matching and `CROSS JOIN` only for a deliberate Cartesian product.
q: Why does my join return more rows than the table has?
a: Because the relationship is one-to-many. A customer with three orders matches three order rows, so the customer appears three times in the result. That is correct join behaviour, not a bug; it becomes a bug only when you then `SUM` a column of the "one" side and count it three times.
q: What does "Column 'id' in field list is ambiguous" mean?
a: Both joined tables have a column named `id`, and the query used `id` without saying which. Qualify every column with its table or alias, as in `c.id` and `o.id`. Qualifying all columns in a join, even unambiguous ones, keeps the query readable and stops it breaking when a column is added later.
q: Should I use ON or USING to join tables?
a: `USING (customer_id)` is a shorthand for `ON a.customer_id = b.customer_id` when both tables name the key identically, and it outputs the column once. `ON` works for any condition and any column names, so it is the form most code and interviews use. Avoid `NATURAL JOIN`, which joins on every shared column name silently.
q: Is a comma join the same as INNER JOIN?
a: Yes, `FROM a, b WHERE a.id = b.a_id` produces the same rows as `FROM a JOIN b ON a.id = b.a_id`. The explicit `JOIN … ON` form is preferred because the condition sits next to the table it joins, and forgetting it is visible rather than silently producing a Cartesian product.
---
A relational database splits data into tables so that each fact is stored once: a customer's name and city live in `customers`, and each order in `orders` points back to its customer by id. That design keeps data consistent — rename a customer once and every order sees the new name — but it means almost every useful question needs rows from more than one table. A **join** is how SQL puts them back together. This lesson covers the `INNER JOIN`: what it computes, how to write the condition, why aliases matter, what happens with one-to-many relationships, and the alternative spellings you will meet in other people's code.

## The data for this module

Most examples in the joins module use two small tables.

```sql
CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);

INSERT INTO customers VALUES (1, 'Asha', 'Pune'), (2, 'Ben', 'Delhi'), (3, 'Chen', 'Pune');
INSERT INTO orders VALUES
  (10, 1, '2024-01-05', 250),
  (11, 1, '2024-02-11', 100),
  (12, 2, '2024-02-20', 400),
  (13, 9, '2024-03-01', 75);
```

`orders.customer_id` is a **foreign key**: it holds the `id` of a row in `customers`. Notice the awkward cases on purpose: Chen (3) has no orders, and order 13 points at customer 9, who does not exist. Real data has both, and the kind of join you choose decides what happens to them.

## Writing an INNER JOIN

```sql
SELECT o.id AS order_id, c.name AS customer, o.amount
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
ORDER BY o.id;
```

```text
order_id | customer | amount
10       | Asha     | 250
11       | Asha     | 100
12       | Ben      | 400
```

Read it as: take each order, find every customer whose `id` equals the order's `customer_id`, and output one combined row per pair. Order 13 has no matching customer, so it disappears. Chen has no matching order, so Chen disappears too. That is the defining property of an inner join: **only rows that found a partner survive**, from both sides.

`JOIN` and `INNER JOIN` are the same thing in MySQL; the word `INNER` is optional. The `ON` clause is a boolean condition evaluated for each candidate pair — usually key equality, but any expression is allowed.

## A mental model: filter the Cartesian product

Logically, a join builds every possible pair of rows — the **Cartesian product**, 4 orders × 3 customers = 12 pairs here — and keeps the pairs where `ON` is true. The database never actually builds all twelve; it uses indexes, hash tables or sorted merges. But the model gives the right answer every time, including in the strange cases:

- a row that matches nothing produces no pair;
- a row that matches three rows produces three pairs;
- a `NULL` key matches nothing, because `NULL = 1` is not true — it is unknown, and `ON` keeps only true.

## Aliases and qualified columns

Both tables have an `id` column. Writing `SELECT id FROM orders JOIN customers ON …` fails in MySQL with *Column 'id' in field list is ambiguous*. Qualify every column: `o.id`, `c.id`. Table aliases (`orders AS o`, or just `orders o`) keep that short. Once a table has an alias, use the alias everywhere in the query — MySQL refuses `orders.id` when the table was renamed `o`.

Also alias the output columns. Two columns both called `id` or `name` in a result are confusing to read and impossible to tell apart in application code that reads columns by name.

## One-to-many: why rows repeat

```sql
SELECT c.name, o.id AS order_id, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id
ORDER BY c.name, o.id;
```

```text
name | order_id | amount
Asha | 10       | 250
Asha | 11       | 100
Ben  | 12       | 400
```

Asha appears twice because she has two orders. This is correct, and it is what makes aggregation after a join work:

```sql
SELECT c.name, COUNT(*) AS orders, SUM(o.amount) AS spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY spent DESC, c.name;
```

```text
name | orders | spent
Ben  | 1      | 400
Asha | 2      | 350
```

Group by the key (`c.id`) as well as the name: two different customers can share a name, and grouping by name alone would merge them. The danger comes when a column from the "one" side is summed after the join — summing a customer's credit limit over their order rows counts it once per order. Keep that in mind; the joining-many-tables lesson returns to it.

## Joining and filtering

`WHERE` runs after the join and filters the combined rows, so it may refer to either table:

```sql
SELECT o.id, c.name, o.amount
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE c.city = 'Pune' AND o.amount >= 200
ORDER BY o.id;
```

For an inner join it makes no difference whether a condition is placed in `ON` or in `WHERE` — the rows that survive are the same. Convention puts the relationship (`c.id = o.customer_id`) in `ON` and the filters in `WHERE`. For outer joins the placement changes the answer, which is the first trap of the next lesson.

## Other spellings you will meet

```sql
-- USING: the key has the same name in both tables
SELECT * FROM orders JOIN shipments USING (order_id);

-- Comma join: the older, implicit form
SELECT o.id, c.name FROM orders o, customers c WHERE c.id = o.customer_id;

-- NATURAL JOIN: joins on every column name the tables share
SELECT * FROM orders NATURAL JOIN customers;   -- avoid
```

`USING` is fine when the names match; it also prints the shared column once. The comma join is equivalent to an inner join, but if you forget the `WHERE` condition you silently get the Cartesian product — the explicit `JOIN … ON` makes the missing condition obvious. `NATURAL JOIN` is a trap: here both tables have `id`, so it would join `orders.id = customers.id`, which is meaningless, and adding a column later can change the result without any error.

## Conditions other than equality

Most joins are equi-joins, but the `ON` clause accepts any condition. A price band lookup is a classic **non-equi join**:

```sql
SELECT p.name, b.label
FROM products p
JOIN price_bands b ON p.price BETWEEN b.low AND b.high
ORDER BY p.name;
```

Each product finds the band whose range contains its price. If the bands overlap, a product matches two bands and appears twice — the same row-multiplication rule as before.

## Pitfalls

- Selecting an unqualified column that exists in both tables (ambiguous column error).
- Expecting unmatched rows to appear — an inner join drops them on both sides.
- Grouping by a non-unique column such as a name instead of the key.
- Summing a parent-side value after a one-to-many join and counting it repeatedly.
- `NATURAL JOIN` or a comma join without its condition.

## Key takeaways

- `JOIN … ON` pairs rows whose condition is true; rows without a partner vanish from both sides.
- Think "Cartesian product, then filter by `ON`" to predict any result.
- `NULL` keys never match, because `NULL = x` is unknown.
- One-to-many joins repeat the parent row once per child — correct, and the basis of join + `GROUP BY`.
- Alias tables, qualify every column, alias output columns, and prefer `ON` to `NATURAL`.
