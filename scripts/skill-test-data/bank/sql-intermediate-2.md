---
skill: sql
level: intermediate
---

## sql-intermediate-024
topic: joins
answer: B

Table `emp`:

| id | name | manager_id | salary |
| --- | --- | --- | --- |
| 1 | Asha | NULL | 900 |
| 2 | Ravi | 1 | 950 |
| 3 | Meera | 1 | 700 |
| 4 | Kiran | 2 | 960 |
| 5 | Dev | 2 | 600 |

What does this query return?

```sql
SELECT e.name
FROM emp e
JOIN emp m ON e.manager_id = m.id
WHERE e.salary > m.salary
ORDER BY e.id;
```

- A: `'Asha', 'Ravi'`
- B: `'Ravi', 'Kiran'`
- C: `'Kiran'`
- D: `'Asha', 'Ravi', 'Kiran'`

> The self join pairs each employee `e` with their own manager `m`. Ravi (950)
> out-earns Asha (900) and Kiran (960) out-earns Ravi (950); Meera and Dev do
> not. Asha has no manager, so the inner join drops her before WHERE runs.
> Option A is what you get with the join written the wrong way round
> (`m.manager_id = e.id`), which compares managers with their reports.

## sql-intermediate-025
topic: joins
answer: D

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |
| 4 | Kiran |

Table `orders`:

| id | customer_id | coupon |
| --- | --- | --- |
| 10 | 1 | NEW |
| 11 | 1 | NULL |
| 12 | 3 | NULL |

The author wanted the customers who have no orders. What does the query
actually return?

```sql
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.coupon IS NULL
ORDER BY c.id;
```

- A: `'Ravi', 'Kiran'`
- B: `'Ravi', 'Meera', 'Kiran'`
- C: `'Asha', 'Meera'`
- D: `'Asha', 'Ravi', 'Meera', 'Kiran'`

> The anti-join tests a column that is NULL for a real order too. The joined
> rows are (Asha, NEW), (Asha, NULL), (Ravi, no order), (Meera, NULL) and
> (Kiran, no order); every one except (Asha, NEW) has a NULL coupon. An
> anti-join must test a column that cannot be NULL in a matched row, such as
> `o.id IS NULL`, which would give Ravi and Kiran.

## sql-intermediate-026
topic: joins
answer: A

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |

Table `orders`:

| id | customer_id | courier_id |
| --- | --- | --- |
| 10 | 1 | 7 |
| 11 | 3 | 8 |

Table `couriers` holds two rows: (7, 'FastX') and (9, 'Slowpoke'), as
`(id, name)`. What does this query return?

```sql
SELECT c.name, k.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
JOIN couriers k ON k.id = o.courier_id
ORDER BY c.id;
```

- A: `('Asha', 'FastX')`
- B: `('Asha', 'FastX'), ('Ravi', NULL), ('Meera', NULL)`
- C: `('Asha', 'FastX'), ('Meera', NULL)`
- D: `('Asha', 'FastX'), ('Ravi', NULL)`

> Joins are applied left to right. The LEFT JOIN keeps Ravi with a NULL
> courier_id, but the following inner join needs `k.id = o.courier_id` to be
> true: NULL matches nothing, and Meera's courier 8 does not exist, so both rows
> are dropped. To keep every customer, the couriers join must be a LEFT JOIN
> too.

## sql-intermediate-027
topic: subqueries
answer: C

Table `customers` has ids 1, 2 and 3. Table `orders`:

| id | customer_id |
| --- | --- |
| 10 | 1 |
| 11 | 1 |
| 12 | 1 |
| 13 | 3 |

What do the two queries return, in order?

```sql
-- query 1
SELECT COUNT(*) FROM customers c
WHERE c.id IN (SELECT customer_id FROM orders);

-- query 2
SELECT COUNT(*) FROM customers c
JOIN orders o ON o.customer_id = c.id;
```

- A: `4` and `4`
- B: `2` and `2`
- C: `2` and `4`
- D: `4` and `2`

> IN is a semi-join: it asks only whether a matching order exists, so each
> customer is returned at most once (customers 1 and 3). The join produces one
> row per matching pair, so customer 1 appears three times: 4 rows.

## sql-intermediate-028
topic: subqueries
answer: D

Table `customers` has ids 1 and 2. Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 10 | 1 | 50 |
| 11 | 1 | 25 |

What does this query return?

```sql
SELECT c.id,
       (SELECT COUNT(*)      FROM orders o WHERE o.customer_id = c.id) AS n,
       (SELECT SUM(o.amount) FROM orders o WHERE o.customer_id = c.id) AS total
FROM customers c
ORDER BY c.id;
```

- A: `(1, 2, 75), (2, 0, 0)`
- B: `(1, 2, 75), (2, NULL, NULL)`
- C: `(1, 2, 75)`
- D: `(1, 2, 75), (2, 0, NULL)`

> A scalar subquery in the select list never removes the outer row. For
> customer 2 both subqueries aggregate an empty set, which still yields one
> row: COUNT of nothing is 0, but SUM of nothing is NULL. Wrap it in
> `COALESCE(..., 0)` to report 0.

## sql-intermediate-029
topic: subqueries
answer: A

Table `pay`:

| salary |
| --- |
| 500 |
| 800 |
| 800 |
| 700 |
| 300 |

What does this query return?

```sql
WITH top_pay AS (
  SELECT MAX(salary) AS m FROM pay
)
SELECT MAX(salary)
FROM pay
WHERE salary < (SELECT m FROM top_pay);
```

- A: `700`
- B: `800`
- C: `500`
- D: `NULL`

> The CTE yields one row (800). The outer query keeps the salaries strictly
> below 800 (500, 700, 300) and takes their maximum, 700: the second-highest
> distinct salary. The duplicate 800 does not matter, because both copies are
> excluded by `<`.

## sql-intermediate-030
topic: subqueries
answer: B

Table `products`:

| id | category | price |
| --- | --- | --- |
| 1 | toys | 20 |
| 2 | toys | 35 |
| 3 | books | 15 |
| 4 | books | 40 |

What does this query return?

```sql
SELECT id
FROM products
WHERE price > ALL (SELECT price FROM products WHERE category = 'games')
ORDER BY id;
```

- A: No rows.
- B: `1, 2, 3, 4`
- C: `4`
- D: It fails: ALL needs a subquery that returns at least one row.

> There are no games, so the subquery is empty. `x > ALL (empty set)` is true
> (there is no value x fails to exceed), so every row passes. `x > ANY (empty
> set)` would be false. This catches code that assumes "greater than every
> game" implies at least one game exists.

## sql-intermediate-031
topic: nulls
answer: C

These statements run one at a time with autocommit on (the default):

```sql
CREATE TABLE users (email VARCHAR(100) UNIQUE);
INSERT INTO users (email) VALUES ('a@x.io');
INSERT INTO users (email) VALUES (NULL);
INSERT INTO users (email) VALUES (NULL);
INSERT INTO users (email) VALUES ('a@x.io');
```

How many of the four INSERTs succeed, in MySQL 8 and in PostgreSQL with
default settings?

- A: `2`
- B: `4`
- C: `3`
- D: `1`

> A UNIQUE constraint rejects two rows whose values are equal, and NULL is
> never equal to NULL, so any number of NULLs are allowed (PostgreSQL 15+ can
> opt out with `UNIQUE NULLS NOT DISTINCT`). Only the second 'a@x.io' fails.
> A PRIMARY KEY is different: its columns are NOT NULL.

## sql-intermediate-032
topic: nulls
answer: A

Table `stock`:

| sku | on_hand | reserved |
| --- | --- | --- |
| A1 | 10 | 10 |
| B2 | NULL | 3 |
| C3 | 7 | 0 |

What does this query return?

```sql
SELECT sku,
       COALESCE(NULLIF(on_hand - reserved, 0), -1) AS avail
FROM stock
ORDER BY sku;
```

- A: `('A1', -1), ('B2', -1), ('C3', 7)`
- B: `('A1', 0), ('B2', -1), ('C3', 7)`
- C: `('A1', -1), ('B2', -3), ('C3', 7)`
- D: `('A1', NULL), ('B2', NULL), ('C3', 7)`

> NULLIF(a, b) returns NULL when a = b, otherwise a. A1: 10 - 10 = 0, so
> NULLIF gives NULL and COALESCE replaces it with -1. B2: NULL - 3 is NULL
> (NULL is not treated as 0), NULLIF passes NULL through, and COALESCE gives
> -1. C3: 7 is kept.

## sql-intermediate-033
topic: aggregation
answer: D

Table `visits`:

| user_id | page |
| --- | --- |
| 1 | home |
| 1 | home |
| 2 | home |
| 1 | cart |
| 3 | cart |
| 3 | cart |
| 4 | cart |

What does this query return?

```sql
SELECT page, COUNT(*) AS hits, COUNT(DISTINCT user_id) AS visitors
FROM visits
GROUP BY page
ORDER BY page;
```

- A: `('cart', 4, 4), ('home', 3, 3)`
- B: `('cart', 3, 3), ('home', 2, 2)`
- C: `('cart', 7, 4), ('home', 7, 4)`
- D: `('cart', 4, 3), ('home', 3, 2)`

> Both aggregates run per page. cart has 4 rows from users 1, 3, 3, 4, which
> are 3 distinct users; home has 3 rows from users 1, 1, 2, which are 2
> distinct users. COUNT(*) counts duplicate rows; only DISTINCT collapses them.

## sql-intermediate-034
topic: aggregation
answer: C

Table `orders(id, customer_id, amount)` has no rows. What do the two queries
return?

```sql
-- query 1
SELECT COUNT(*), SUM(amount) FROM orders;

-- query 2
SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id;
```

- A: Query 1 returns one row `(0, 0)`; query 2 returns no rows.
- B: Query 1 returns no rows; query 2 returns no rows.
- C: Query 1 returns one row `(0, NULL)`; query 2 returns no rows.
- D: Query 1 returns one row `(0, NULL)`; query 2 returns one row `(NULL, 0)`.

> An aggregate without GROUP BY treats the whole input as one group, even when
> it is empty, so it always returns exactly one row: COUNT is 0 and SUM is
> NULL. With GROUP BY there is one output row per group, and an empty table has
> no groups.

## sql-intermediate-035
topic: indexes
answer: D

This query runs thousands of times a second:

```sql
SELECT email
FROM users
WHERE country = ?
ORDER BY created_at DESC
LIMIT 20;
```

Which single B-tree index lets the engine seek straight to that country's
entries, read them already in created_at order, and return email without
visiting the table rows?

- A: `(country, email)`
- B: `(created_at, country, email)`
- C: `(email, country, created_at)`
- D: `(country, created_at, email)`

> Equality column first (seek to the country), then the sort column (entries
> are already in created_at order within that country, read backwards for
> DESC), then the selected column so the index covers the query. A covers the
> query but needs a sort. B is in created_at order but has to skip over every
> other country. C starts with a column the query does not filter on.

## sql-intermediate-036
topic: indexes
answer: A

A team adds five new secondary indexes to a busy `orders` table to speed up
reports. What happens to the cost of inserting one row into `orders`?

- A: It does more work: each of the indexes must also get an entry for the new row.
- B: It is unchanged: indexes are rebuilt only when table statistics are refreshed.
- C: It gets cheaper: the engine uses the indexes to find where the row belongs.
- D: It is unchanged unless the new indexes are declared UNIQUE.

> Every index is a separate structure kept in step with the table on each
> INSERT, DELETE and on any UPDATE that changes its columns. Reads that use
> them get faster; writes pay for every index. UNIQUE indexes add a duplicate
> check on top, but plain ones still cost maintenance.

## sql-intermediate-037
topic: normalization
answer: B

`employees(emp_id, name, dept_id, dept_name)` has the primary key `emp_id`
(its only candidate key). Each department id has exactly one name. What is the
highest normal form the table satisfies?

- A: `1NF`
- B: `2NF`
- C: `3NF`
- D: `BCNF`

> With a single-column key there can be no partial dependency, so it is in
> 2NF. But dept_name depends on dept_id, a non-key column: emp_id → dept_id →
> dept_name is a transitive dependency, which 3NF forbids. Move departments
> into their own table.

## sql-intermediate-038
topic: normalization
answer: B

Table `orders`:

| order_id | customer | phone | amount |
| --- | --- | --- | --- |
| 101 | Asha | 98200 11111 | 500 |
| 102 | Asha | 98200 11111 | 250 |
| 103 | Ravi | 98200 22222 | 900 |

Order 103 is cancelled and deleted. Ravi's phone number is now recorded
nowhere. Which anomaly is this?

- A: An update anomaly
- B: A deletion anomaly
- C: An insertion anomaly
- D: A lost update

> Customer facts live only inside order rows, so deleting a customer's last
> order deletes the customer too: a deletion anomaly. An update anomaly would
> be changing Asha's phone on one row but not the other; an insertion anomaly
> would be being unable to record a customer before they order. A separate
> customers table removes all three.

## sql-intermediate-039
topic: transactions
answer: C

T2 changes a product's price from 100 to 80 but has not committed. T1 reads
the product and sees 80. T2 then rolls back. Per the SQL standard, at which
isolation levels is T1 allowed to have seen 80?

- A: At READ UNCOMMITTED and READ COMMITTED
- B: At every level below SERIALIZABLE
- C: Only at READ UNCOMMITTED
- D: At no level: the standard never allows reading uncommitted data

> T1 read data that was never committed: a dirty read. READ UNCOMMITTED is the
> only standard level that permits it; READ COMMITTED and above rule it out.
> (PostgreSQL goes further and treats READ UNCOMMITTED as READ COMMITTED.)

## sql-intermediate-040
topic: transactions
answer: D

Two transactions, each opened with `START TRANSACTION` and not yet committed,
run at the same time in MySQL InnoDB or PostgreSQL with default settings:

```sql
-- T1
UPDATE accounts SET balance = balance - 10 WHERE id = 1;
UPDATE accounts SET balance = balance + 10 WHERE id = 2;

-- T2
UPDATE accounts SET balance = balance - 5 WHERE id = 2;
UPDATE accounts SET balance = balance + 5 WHERE id = 1;
```

Both first UPDATEs succeed; then each transaction runs its second UPDATE.
What happens?

- A: Both wait until a lock timeout expires, then both fail.
- B: Each second UPDATE silently skips the row that is locked.
- C: Both transactions are rolled back automatically.
- D: The engine detects the cycle and fails one with a deadlock error.

> T1 holds row 1 and waits for row 2; T2 holds row 2 and waits for row 1.
> Neither can proceed, so both engines detect the deadlock and abort one
> transaction (the victim) with a deadlock error, which releases its locks so
> the other can finish. The application should retry the victim; touching
> rows in a consistent order avoids the cycle.

## sql-intermediate-041
topic: joins
answer: A

Tables `t1` and `t2` each have one column `k`:

| t1.k |
| --- |
| 1 |
| 2 |
| NULL |
| NULL |

| t2.k |
| --- |
| 1 |
| NULL |
| NULL |
| 3 |

What does this query return?

```sql
SELECT COUNT(*)
FROM t1
JOIN t2 ON t1.k = t2.k;
```

- A: `1`
- B: `3`
- C: `5`
- D: `0`

> A join keeps a pair only when the ON condition is true. `NULL = NULL` is
> UNKNOWN, so NULL keys never match each other; only 1 = 1 does. Joining on
> NULLs needs `IS NOT DISTINCT FROM` (PostgreSQL) or `<=>` (MySQL).

## sql-intermediate-042
topic: window-functions
answer: C

Table `staff`:

| id | dept | salary |
| --- | --- | --- |
| 1 | A | 10 |
| 2 | A | 20 |
| 3 | B | 5 |
| 4 | A | 30 |
| 5 | B | 15 |

What does this query return?

```sql
SELECT id,
       SUM(salary) OVER (PARTITION BY dept)          AS dept_total,
       SUM(salary) OVER (PARTITION BY dept ORDER BY id) AS so_far
FROM staff
ORDER BY id;
```

- A: `(1, 80, 10), (2, 80, 30), (3, 80, 5), (4, 80, 60), (5, 80, 20)`
- B: `(1, 60, 10), (2, 60, 30), (3, 20, 35), (4, 60, 65), (5, 20, 80)`
- C: `(1, 60, 10), (2, 60, 30), (3, 20, 5), (4, 60, 60), (5, 20, 20)`
- D: `(1, 10, 10), (2, 30, 30), (3, 5, 5), (4, 60, 60), (5, 20, 20)`

> Without ORDER BY the frame is the whole partition, so every A row gets
> 10 + 20 + 30 = 60 and every B row 5 + 15 = 20. With ORDER BY id the frame
> runs from the partition's first row to the current one, and it restarts in
> each department: A gives 10, 30, 60 and B gives 5, 20.

## sql-intermediate-043
topic: window-functions
answer: B

Why does this query fail in both MySQL 8 and PostgreSQL?

```sql
SELECT id, title
FROM posts
WHERE ROW_NUMBER() OVER (ORDER BY created_at DESC, id) <= 10;
```

- A: ROW_NUMBER() is allowed only in a window that has a PARTITION BY.
- B: Window functions are evaluated after WHERE, so WHERE cannot use them.
- C: A window's ORDER BY may name only one column.
- D: Window functions may appear only in the query's final ORDER BY.

> Logically, FROM, WHERE, GROUP BY and HAVING run before window functions are
> computed, so a window function is allowed only in the select list and ORDER
> BY. Compute it in a derived table or CTE and filter on it in the outer query.

## sql-intermediate-044
topic: aggregation
answer: D

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 80 |
| 2 | 1 | 30 |
| 3 | 2 | 120 |
| 4 | 2 | 10 |
| 5 | 3 | 60 |

What does this query return?

```sql
SELECT customer_id, SUM(amount)
FROM orders
WHERE amount > 50
GROUP BY customer_id
ORDER BY customer_id;
```

- A: `(1, 110), (2, 130), (3, 60)`
- B: `(1, 110), (2, 130)`
- C: `(1, 80), (2, 120)`
- D: `(1, 80), (2, 120), (3, 60)`

> WHERE filters rows before they are grouped, so the 30 and the 10 are never
> summed: only 80, 120 and 60 survive, one per customer. Filtering the totals
> instead (`HAVING SUM(amount) > 50`) would keep the full sums, as in A.

## sql-intermediate-045
topic: ddl-constraints
answer: A

```sql
CREATE TABLE authors (id INT PRIMARY KEY);
CREATE TABLE books (
  id INT PRIMARY KEY,
  author_id INT,
  FOREIGN KEY (author_id) REFERENCES authors (id) ON DELETE CASCADE
);
CREATE TABLE reviews (
  id INT PRIMARY KEY,
  book_id INT,
  FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);
```

`authors` holds ids 1 and 2. `books` holds (10, 1), (11, 1) and (12, 2) as
`(id, author_id)`. `reviews` holds (100, 10), (101, 10) and (102, 12) as
`(id, book_id)`. What does the SELECT return?

```sql
DELETE FROM authors WHERE id = 1;
SELECT (SELECT COUNT(*) FROM books), (SELECT COUNT(*) FROM reviews);
```

- A: `(1, 1)`
- B: `(1, 3)`
- C: `(3, 3)`
- D: The DELETE fails because books still reference author 1.

> Deleting author 1 cascades to books 10 and 11, and deleting those books
> cascades again to reviews 100 and 101. Cascades follow the whole chain, so
> only book 12 and its review 102 remain. Without ON DELETE CASCADE (the
> default is NO ACTION) the DELETE would fail, as in D.

## sql-intermediate-046
topic: set-operations
answer: C

In standard SQL, table `p(x)` holds the rows 1, 1, 2, 3 and NULL, and table
`q(x)` holds 2 and NULL. How many rows does this return?

```sql
SELECT x FROM p
EXCEPT
SELECT x FROM q;
```

- A: `3`
- B: `4`
- C: `2`
- D: `1`

> EXCEPT (without ALL) returns distinct rows, so the two 1s become one. Set
> operations also treat NULLs as duplicates of each other, unlike `=`, so q's
> NULL removes p's NULL. The result is 1 and 3. EXCEPT ALL would keep both 1s.
