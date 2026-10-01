---
skill: sql
level: basic
---

## sql-basic-026
topic: joins
answer: B

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 10 | 1 | 200 |
| 11 | 1 | 150 |
| 12 | 3 | 400 |
| 13 | 4 | 90 |

```sql
SELECT c.name, o.amount
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id;
```

How many rows does it return?

- A: `2 rows`
- B: `3 rows`
- C: `4 rows`
- D: `5 rows`

> An inner join returns one row for every matching pair. Orders 10 and 11 both
> match Asha and order 12 matches Meera: 3 rows. Order 13 points at a customer
> 4 that does not exist and Ravi has no orders, so neither appears.

## sql-basic-027
topic: joins
answer: C

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |
| 4 | Kabir |

Table `orders`:

| id | customer_id |
| --- | --- |
| 10 | 1 |
| 11 | 1 |
| 12 | 1 |
| 13 | 3 |
| 14 | 5 |

```sql
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
```

How many rows does it return?

- A: `4 rows`
- B: `5 rows`
- C: `6 rows`
- D: `7 rows`

> A left join keeps every customer at least once and repeats a customer once
> per matching order. Asha matches 3 orders, Meera 1, and Ravi and Kabir have
> none, so each gets one row with NULL for `o.id`: 3 + 1 + 1 + 1 = 6. Order 14
> (customer 5) has no customer, and a left join does not keep unmatched rows
> of the right-hand table.

## sql-basic-028
topic: joins
answer: B

Table `departments`:

| id | name |
| --- | --- |
| 1 | Sales |
| 2 | HR |
| 3 | IT |

Table `employees`:

| id | name | dept_id | salary |
| --- | --- | --- | --- |
| 1 | Asha | 1 | 50000 |
| 2 | Ravi | 1 | 30000 |
| 3 | Meera | 2 | 45000 |

```sql
SELECT d.name, e.name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
WHERE e.salary > 40000;
```

How many rows does it return?

- A: `1 row`
- B: `2 rows`
- C: `3 rows`
- D: `4 rows`

> The left join first produces 4 rows: Sales–Asha, Sales–Ravi, HR–Meera and
> IT with NULLs. `WHERE` then filters those rows. Ravi's 30000 fails, and for IT
> `e.salary` is NULL, so `NULL > 40000` is unknown and the row is dropped too.
> Only Sales–Asha and HR–Meera remain: a condition on the right-hand table in
> `WHERE` makes the left join behave like an inner join.

## sql-basic-029
topic: joins
answer: D

Table `departments`:

| id | name |
| --- | --- |
| 1 | Sales |
| 2 | HR |
| 3 | IT |

Table `employees`:

| id | name | dept_id | salary |
| --- | --- | --- | --- |
| 1 | Asha | 1 | 50000 |
| 2 | Ravi | 1 | 30000 |
| 3 | Meera | 2 | 45000 |

```sql
SELECT d.name, e.name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id AND e.salary > 40000;
```

Which rows does it return (in any order)?

- A: `('Sales', 'Asha'), ('HR', 'Meera')`
- B: `('Sales', 'Asha'), ('Sales', NULL), ('HR', 'Meera'), ('IT', NULL)`
- C: `('Sales', 'Asha'), ('Sales', 'Ravi'), ('HR', 'Meera'), ('IT', NULL)`
- D: `('Sales', 'Asha'), ('HR', 'Meera'), ('IT', NULL)`

> In the `ON` clause the salary test only decides which employees match; every
> department is still kept. Sales matches Asha (Ravi fails the test, and since
> Sales already has a match no extra NULL row is added), HR matches Meera, and
> IT matches nobody, so it appears once with NULL. Moving the test to `WHERE`
> would drop the IT row as well.

## sql-basic-030
topic: joins
answer: A

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |
| 4 | Kabir |

Table `orders` (`id` is its primary key):

| id | customer_id |
| --- | --- |
| 10 | 1 |
| 11 | 3 |
| 12 | 3 |

```sql
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;
```

What does the query return?

- A: `Ravi, Kabir`
- B: `Asha, Meera`
- C: `Asha, Meera, Meera`
- D: No rows: `o.id` is a primary key, so it is never NULL.

> `o.id` is never NULL in the `orders` table, but in a left join's result it is
> NULL for every customer that matched no order. Filtering on `o.id IS NULL`
> therefore keeps exactly the customers without orders: Ravi and Kabir.
> `IS NOT NULL` would give option C.

## sql-basic-031
topic: joins
answer: D

Table `products`:

| id | category |
| --- | --- |
| 1 | books |
| 2 | books |
| 3 | toys |

Table `promos`:

| id | category |
| --- | --- |
| 1 | books |
| 2 | books |
| 3 | books |
| 4 | games |

```sql
SELECT p.id, m.id
FROM products p
JOIN promos m ON m.category = p.category;
```

How many rows does it return?

- A: `2 rows`
- B: `3 rows`
- C: `5 rows`
- D: `6 rows`

> When the join column repeats on both sides, every matching pair is a row.
> Each of the 2 `books` products pairs with each of the 3 `books` promos:
> 2 × 3 = 6. `toys` and `games` match nothing, so they add no rows.

## sql-basic-032
topic: joins
answer: D

Table `colors`:

| id | name |
| --- | --- |
| 1 | red |
| 2 | green |
| 3 | blue |

Table `sizes`:

| id | code |
| --- | --- |
| 1 | S |
| 2 | M |
| 3 | L |
| 4 | XL |

```sql
SELECT c.name, s.code
FROM colors c, sizes s;
```

How many rows does it return?

- A: `7 rows`
- B: `4 rows`
- C: It fails with an error: the join has no condition.
- D: `12 rows`

> Listing tables with commas and no `WHERE` condition is a cross join: every row
> of `colors` is paired with every row of `sizes`, 3 × 4 = 12. It is valid SQL
> in both databases, which is why a forgotten join condition silently
> multiplies rows instead of failing.

## sql-basic-033
topic: joins
answer: B

Table `employees`:

| id | name | manager_id |
| --- | --- | --- |
| 1 | Asha | NULL |
| 2 | Ravi | 1 |
| 3 | Meera | 1 |
| 4 | Kabir | 2 |

```sql
SELECT e.name, m.name
FROM employees e
JOIN employees m ON e.manager_id = m.id
ORDER BY e.id;
```

What does the query return?

- A: `('Asha', 'Ravi'), ('Asha', 'Meera'), ('Ravi', 'Kabir')`
- B: `('Ravi', 'Asha'), ('Meera', 'Asha'), ('Kabir', 'Ravi')`
- C: `('Asha', NULL), ('Ravi', 'Asha'), ('Meera', 'Asha'), ('Kabir', 'Ravi')`

> A self join treats the table as two copies: `e` is the employee and `m` is the
> row whose `id` equals the employee's `manager_id`. Each row pairs an employee
> with their manager. Asha's `manager_id` is NULL, which matches no row, and an
> inner join drops her; only a left join would keep her with NULL (option C).

## sql-basic-034
topic: joins
answer: B

Table `students`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |

Table `enrolments`:

| student_id | course_id |
| --- | --- |
| 1 | 10 |
| 1 | 20 |
| 2 | 10 |
| 3 | 30 |

Table `courses`:

| id | title |
| --- | --- |
| 10 | SQL |
| 20 | Java |

```sql
SELECT s.name, c.title
FROM students s
JOIN enrolments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id;
```

How many rows does it return?

- A: `2 rows`
- B: `3 rows`
- C: `4 rows`
- D: `6 rows`

> The first join gives one row per enrolment (4 rows). The second inner join
> keeps only those whose course exists: Asha–SQL, Asha–Java and Ravi–SQL.
> Meera's enrolment points at course 30, which is not in `courses`, so that row
> is dropped.

## sql-basic-035
topic: joins
answer: A

Tables `customers(id, name)` and `orders(id, customer_id)`:

```sql
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
```

Which query returns the same rows as this one, whatever the data?

- A: `SELECT c.name, o.id FROM orders o RIGHT JOIN customers c ON o.customer_id = c.id`
- B: `SELECT c.name, o.id FROM orders o LEFT JOIN customers c ON o.customer_id = c.id`
- C: `SELECT c.name, o.id FROM customers c RIGHT JOIN orders o ON o.customer_id = c.id`
- D: `SELECT c.name, o.id FROM customers c JOIN orders o ON o.customer_id = c.id`

> `A LEFT JOIN B` keeps every row of A; `B RIGHT JOIN A` also keeps every row of
> A, the table named on the right. So option A keeps every customer, just like
> the original. B and C both keep every order instead (and drop customers with
> no orders), and D drops customers with no orders.

## sql-basic-036
topic: joins
answer: B, D, E

Table `authors`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |

Table `books`:

| id | author_id |
| --- | --- |
| 1 | 1 |
| 2 | 1 |
| 3 | 2 |

Select all that apply: which of these queries return exactly 3 rows?

- A: `SELECT a.name FROM authors a LEFT JOIN books b ON b.author_id = a.id`
- B: `SELECT a.name FROM authors a JOIN books b ON b.author_id = a.id`
- C: `SELECT a.name FROM authors a CROSS JOIN books b`
- D: `SELECT a.name FROM authors a RIGHT JOIN books b ON b.author_id = a.id`
- E: `SELECT DISTINCT a.name FROM authors a LEFT JOIN books b ON b.author_id = a.id`

> A: Asha twice, Ravi once and Meera once with NULLs: 4 rows. B: one row per
> book, since every book has an author: 3. C: 3 × 3 = 9. D: keeps every book,
> each matching one author: 3. E: the left join's 4 rows reduced to the
> distinct names Asha, Ravi, Meera: 3.

## sql-basic-037
topic: joins
answer: A

Table `parts`:

| id | code |
| --- | --- |
| 1 | A |
| 2 | NULL |
| 3 | B |

Table `labels`:

| code | label |
| --- | --- |
| A | alpha |
| NULL | none |
| C | gamma |

```sql
SELECT p.id, l.label
FROM parts p
JOIN labels l ON l.code = p.code;
```

How many rows does it return?

- A: `1 row`
- B: `2 rows`
- C: `3 rows`
- D: `9 rows`

> A join condition must be true for a pair to match, and `NULL = NULL` is
> unknown, not true, so part 2 does not match the label with a NULL code. Only
> part 1 matches (`A`); part 3 (`B`) has no label. Two rows would mean NULLs
> matched each other, and 3 rows is what a left join would return.

## sql-basic-038
topic: joins
answer: A

Table `products`:

| id | name |
| --- | --- |
| 1 | Pen |
| 2 | Ink |
| 3 | Pad |

Table `reviews`:

| id | product_id | stars |
| --- | --- | --- |
| 100 | 1 | 5 |
| 101 | 1 | 3 |
| 102 | 3 | 4 |

```sql
SELECT p.name, r.stars
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id;
```

Which rows does it return (in any order)?

- A: `('Pen', 5), ('Pen', 3), ('Ink', NULL), ('Pad', 4)`
- B: `('Pen', 5), ('Pen', 3), ('Pad', 4)`
- C: `('Pen', 5), ('Ink', NULL), ('Pad', 4)`
- D: `('Pen', 5), ('Pen', 3), ('Ink', 0), ('Pad', 4)`

> A left join repeats a product once per matching review (Pen has two) and keeps
> a product with no review once, filling the right-hand columns with NULL, not
> with 0. Option B is the inner join; option C wrongly keeps one row per product.

## sql-basic-039
topic: joins
answer: D

Tables `customers(id, name)` and `orders(id, customer_id, amount)`:

```sql
SELECT id, name
FROM customers c
JOIN orders o ON o.customer_id = c.id;
```

What happens in MySQL 8 and PostgreSQL?

- A: It returns each customer's `id`, because `customers` is listed first.
- B: It returns each order's `id`, because `orders` is the joined table.
- C: It returns both `id` columns side by side.
- D: It fails with an error, because the column `id` is ambiguous.

> Both tables have an `id` column, so an unqualified `id` could mean either and
> both databases reject the query as ambiguous. `name` is fine because only
> `customers` has it. Write `c.id` or `o.id` to say which one you mean.

## sql-basic-040
topic: joins
answer: C

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |

Table `orders`:

| id | customer_id |
| --- | --- |
| 10 | 1 |
| 11 | 1 |
| 12 | 3 |
| 13 | 4 |
| 14 | NULL |

```sql
SELECT o.id, c.name
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id;
```

How many rows does it return?

- A: `3 rows`
- B: `4 rows`
- C: `5 rows`
- D: `6 rows`

> Here `orders` is the left table, so every order is kept, and since each order
> matches at most one customer (`customers.id` is unique) each appears exactly
> once: 5 rows. Orders 13 and 14 get NULL for the name. Ravi has no orders, but
> he is in the right-hand table, so a left join does not add him.

## sql-basic-041
topic: joins
answer: C

Tables `customers(id, name)` and `orders(id, customer_id, amount)`:

```sql
-- Query 1
SELECT c.name, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id AND o.amount > 100;

-- Query 2
SELECT c.name, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.amount > 100;
```

How do the results of the two queries compare?

- A: Query 1 returns more rows: customers with no large order are kept with NULLs.
- B: Query 2 returns more rows: its WHERE filters before the join.
- C: They return the same rows, whatever the data.
- D: Query 1 fails: ON may only compare the join columns.

> For an inner join, a condition in `ON` and the same condition in `WHERE` both
> remove the pairs that fail it, so the results are identical. The placement
> only matters for outer joins, where `ON` decides what matches while the
> unmatched row is still kept (option A describes a left join).

## sql-basic-042
topic: subqueries
answer: C

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |
| 4 | Kabir |

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 10 | 1 | 500 |
| 11 | 3 | 120 |
| 12 | 1 | 300 |
| 13 | 2 | 60 |

```sql
SELECT name
FROM customers
WHERE id IN (SELECT customer_id FROM orders WHERE amount > 100)
ORDER BY id;
```

What does the query return?

- A: `Asha, Asha, Meera`
- B: `Asha, Ravi, Meera`
- C: `Asha, Meera`
- D: `Ravi, Kabir`

> The subquery returns the customer ids 1, 3, 1. `IN` only asks whether each
> customer's id is in that list, so a customer is returned once no matter how
> many orders match: Asha and Meera. A join would have repeated Asha.
> Ravi's only order is 60, so he is not in the list.

## sql-basic-043
topic: subqueries
answer: D

Table `employees`:

| id | name | salary |
| --- | --- | --- |
| 1 | Asha | 30000 |
| 2 | Ravi | 40000 |
| 3 | Meera | 50000 |
| 4 | Kabir | 60000 |
| 5 | Tara | 70000 |

```sql
SELECT name
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY id;
```

What does the query return?

- A: `Meera, Kabir, Tara`
- B: `Tara`
- C: `Asha, Ravi`
- D: `Kabir, Tara`

> The scalar subquery returns one value, the average salary: 250000 / 5 = 50000.
> The outer query keeps salaries strictly greater than that, 60000 and 70000.
> Meera earns exactly the average, so `>` excludes her; `>=` would include her.

## sql-basic-044
topic: subqueries
answer: C

Table `departments`:

| id | name | city |
| --- | --- | --- |
| 1 | Sales | Pune |
| 2 | HR | Delhi |
| 3 | IT | Pune |

Table `employees`:

| id | name | dept_id |
| --- | --- | --- |
| 1 | Asha | 1 |
| 2 | Ravi | 2 |
| 3 | Meera | 3 |

```sql
SELECT name
FROM employees
WHERE dept_id = (SELECT id FROM departments WHERE city = 'Pune');
```

What happens in MySQL 8 and PostgreSQL?

- A: `Asha`
- B: `Asha, Meera`
- C: It fails with an error: the subquery returns more than one row.
- D: It returns no rows, because no employee matches both departments.

> A subquery used with `=` must return at most one value. Two departments are in
> Pune, so the subquery returns 1 and 3, and both databases raise an error
> rather than picking one. `dept_id IN (SELECT …)` is how to accept several
> values; it would return Asha and Meera.

## sql-basic-045
topic: subqueries
answer: A

Table `departments`:

| id | name |
| --- | --- |
| 1 | Sales |
| 2 | HR |
| 3 | IT |

Table `employees`:

| id | name | dept_id |
| --- | --- | --- |
| 1 | Asha | 1 |
| 2 | Ravi | 1 |
| 3 | Meera | 3 |

```sql
SELECT d.name
FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id)
ORDER BY d.id;
```

What does the query return?

- A: `Sales, IT`
- B: `Sales, Sales, IT`
- C: `HR`
- D: `Sales, HR, IT`

> The subquery is correlated: it runs for each department and `EXISTS` is true
> if it finds at least one employee there. Sales (two employees) and IT (one)
> qualify; HR has none. Each department is returned once, because `EXISTS` only
> tests whether a row exists; it never repeats the outer row.

## sql-basic-046
topic: subqueries
answer: D

Table `projects`:

| id | name |
| --- | --- |
| 1 | Apollo |
| 2 | Borealis |
| 3 | Comet |
| 4 | Delta |

Table `tasks`:

| id | project_id |
| --- | --- |
| 1 | 2 |
| 2 | 2 |
| 3 | 4 |

```sql
SELECT p.name
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id)
ORDER BY p.id;
```

What does the query return?

- A: `Borealis, Delta`
- B: No rows: `tasks` is not empty, so NOT EXISTS is false for every project.
- C: `Apollo, Borealis, Comet, Delta`
- D: `Apollo, Comet`

> The subquery is correlated on `p.id`, so it asks, for each project, whether
> that project has any task. Borealis and Delta do; Apollo and Comet do not, so
> `NOT EXISTS` keeps those two. `Borealis, Delta` is what `EXISTS` would return.

## sql-basic-047
topic: subqueries
answer: D

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |
| 4 | Kabir |

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 10 | 2 | 1500 |
| 11 | 3 | 200 |

```sql
SELECT name
FROM customers
WHERE EXISTS (SELECT 1 FROM orders WHERE amount > 1000);
```

How many rows does it return?

- A: `0 rows`
- B: `1 row`
- C: `2 rows`
- D: `4 rows`

> The subquery never refers to the outer `customers` row, so it gives the same
> answer for every customer: an order over 1000 exists, so `EXISTS` is true each
> time and all 4 customers are returned. To get only Ravi the subquery must be
> correlated, e.g. `AND orders.customer_id = customers.id`.

## sql-basic-048
topic: subqueries
answer: A

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |
| 4 | Kabir |

Table `orders`:

| id | customer_id |
| --- | --- |
| 10 | 2 |
| 11 | 2 |
| 12 | 2 |
| 13 | 4 |

```sql
SELECT c.name,
       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS n
FROM customers c
ORDER BY c.id;
```

What does the query return?

- A: `('Asha', 0), ('Ravi', 3), ('Meera', 0), ('Kabir', 1)`
- B: `('Ravi', 3), ('Kabir', 1)`
- C: `('Asha', NULL), ('Ravi', 3), ('Meera', NULL), ('Kabir', 1)`
- D: `('Asha', 4), ('Ravi', 4), ('Meera', 4), ('Kabir', 4)`

> A subquery in the `SELECT` list does not filter: every customer is returned,
> and the correlated subquery counts that customer's orders. `COUNT(*)` over no
> rows is 0, not NULL, so Asha and Meera show 0. Option D is what an
> uncorrelated `SELECT COUNT(*) FROM orders` would give.

## sql-basic-049
topic: subqueries
answer: C

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 100 |
| 2 | 1 | 250 |
| 3 | 2 | 300 |
| 4 | 3 | 50 |
| 5 | 3 | 200 |

```sql
WITH totals AS (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
)
SELECT MAX(total) FROM totals;
```

What value does it return?

- A: `250`
- B: `300`
- C: `350`
- D: `900`

> The CTE `totals` is a named result: one row per customer with their total,
> 350 (customer 1), 300 (customer 2) and 250 (customer 3). The outer query takes
> the largest of those, 350. 300 is the largest single order and 900 the total
> of all orders.

## sql-basic-050
topic: subqueries
answer: B

Tables `customers(id, name)` and `orders(id, customer_id)`. `orders` holds many rows, and one customer can have several orders.

Which query lists every customer who has at least one order, each exactly once?

- A: `SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id`
- B: `SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders)`
- C: `SELECT name FROM customers WHERE id = (SELECT customer_id FROM orders)`
- D: `SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id`

> `IN` tests membership, so each customer row is returned once however many of
> its orders are in the list. The join in A repeats a customer once per order.
> C fails as soon as the subquery returns more than one row. D also includes
> customers with no orders, and repeats the others.
