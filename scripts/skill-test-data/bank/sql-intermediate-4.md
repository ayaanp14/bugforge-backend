---
skill: sql
level: intermediate
---

## sql-intermediate-069
topic: window-functions
answer: D

Table `daily`:

| id | visits |
| --- | --- |
| 1 | 4 |
| 2 | 6 |
| 3 | 2 |
| 4 | 8 |

What does this query return?

```sql
SELECT id,
       SUM(visits) OVER (ORDER BY id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS two_day
FROM daily
ORDER BY id;
```

- A: `(1, 4), (2, 10), (3, 12), (4, 20)`
- B: `(1, NULL), (2, 10), (3, 8), (4, 10)`
- C: `(1, 10), (2, 8), (3, 10), (4, 8)`
- D: `(1, 4), (2, 10), (3, 8), (4, 10)`

> The frame is the previous row and the current one: 4, 4 + 6, 6 + 2, 2 + 8.
> For the first row the frame simply has one row in it; the sum is not NULL.
> A is the default running total, and C uses the following row instead of the
> preceding one.

## sql-intermediate-070
topic: window-functions
answer: B

Table `products`:

| id | category | price |
| --- | --- | --- |
| 1 | toys | 20 |
| 2 | books | 15 |
| 3 | toys | 35 |
| 4 | games | 50 |
| 5 | toys | 10 |

What does this query return?

```sql
SELECT id, COUNT(*) OVER () AS n
FROM products
WHERE price >= 15
ORDER BY id;
```

- A: `(1, 5), (2, 5), (3, 5), (4, 5)`
- B: `(1, 4), (2, 4), (3, 4), (4, 4)`
- C: `(1, 1), (2, 2), (3, 3), (4, 4)`
- D: `(1, 2), (2, 1), (3, 2), (4, 1)`

> An empty OVER () makes the window the entire result set, but the window is
> built after WHERE has removed id 5, so every row sees 4. This is the usual
> way to return a total count alongside each row of a filtered page. C would
> need an ORDER BY in the window; D a PARTITION BY category.

## sql-intermediate-071
topic: window-functions
answer: C

Table `products`:

| id | category | price |
| --- | --- | --- |
| 1 | pens | 50 |
| 2 | pens | 50 |
| 3 | pens | 40 |
| 4 | pens | 30 |
| 5 | inks | 20 |
| 6 | inks | 10 |
| 7 | inks | 10 |

What does this query return?

```sql
SELECT COUNT(*)
FROM (
  SELECT id,
         DENSE_RANK() OVER (PARTITION BY category ORDER BY price DESC) AS dr
  FROM products
) t
WHERE dr <= 2;
```

- A: `4`
- B: `5`
- C: `6`
- D: `7`

> DENSE_RANK numbers distinct prices without gaps. pens: 50, 50 → 1, 40 → 2,
> 30 → 3, so three rows pass. inks: 20 → 1, 10, 10 → 2, so all three pass.
> RANK would give pens 1, 1, 3, 4 (only two pass, total 5) and ROW_NUMBER two
> per category (4).

## sql-intermediate-072
topic: subqueries
answer: A

Table `orders`:

| id | customer_id | day_no |
| --- | --- | --- |
| 1 | 1 | 5 |
| 2 | 1 | 9 |
| 3 | 2 | 3 |
| 4 | 2 | 3 |
| 5 | 3 | 7 |

What does this query return?

```sql
SELECT o.id
FROM orders o
WHERE o.day_no = (SELECT MAX(o2.day_no)
                  FROM orders o2
                  WHERE o2.customer_id = o.customer_id)
ORDER BY o.id;
```

- A: `2, 3, 4, 5`
- B: `2, 3, 5`
- C: `2`
- D: It fails: the subquery returns one value per customer.

> For each outer row the correlated subquery returns one value, that
> customer's latest day. Customer 2's two orders both sit on that day, so both
> are returned: "latest order per customer" written this way returns ties. C is
> the uncorrelated version (the overall maximum, 9).

## sql-intermediate-073
topic: subqueries
answer: A, B

Which of these queries return exactly the same rows as the query below, for
any data in the two tables, NULLs included? Select all that apply.

```sql
SELECT c.* FROM customers c
WHERE c.id IN (SELECT customer_id FROM orders);
```

- A: `SELECT c.* FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)`
- B: `SELECT c.* FROM customers c WHERE c.id = ANY (SELECT customer_id FROM orders)`
- C: `SELECT c.* FROM customers c JOIN orders o ON o.customer_id = c.id`
- D: `SELECT c.* FROM customers c WHERE c.id = (SELECT customer_id FROM orders)`

> `IN (subquery)` is defined as `= ANY (subquery)`. EXISTS gives the same rows
> too: where IN finds no match it yields FALSE or UNKNOWN (NULLs in orders), and
> both drop the row just as EXISTS's FALSE does. Only *NOT* IN and NOT EXISTS
> differ. C repeats a customer once per order. D fails as soon as orders holds
> more than one row.

## sql-intermediate-074
topic: subqueries
answer: D

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 60 |
| 2 | 1 | 40 |
| 3 | 2 | 99 |
| 4 | 3 | 150 |
| 5 | 4 | 30 |
| 6 | 4 | 20 |

What does this query return?

```sql
WITH totals AS (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
),
big AS (
  SELECT customer_id, total
  FROM totals
  WHERE total >= 100
)
SELECT COUNT(*), SUM(total)
FROM big;
```

- A: `(1, 150)`
- B: `(4, 399)`
- C: It fails: a CTE cannot refer to another CTE in the same WITH.
- D: `(2, 250)`

> A later CTE may read an earlier one in the same WITH. totals is 100, 99, 150
> and 50; big keeps customers 1 (exactly 100) and 3 (150). A is what you get by
> filtering single orders instead of totals; B ignores the filter.

## sql-intermediate-075
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

What does this query return?

```sql
SELECT c.name, COUNT(*) AS a, COUNT(o.id) AS b
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;
```

- A: `('Asha', 2, 2), ('Ravi', 0, 0), ('Meera', 1, 1)`
- B: `('Asha', 2, 2), ('Ravi', 1, 1), ('Meera', 1, 1)`
- C: `('Asha', 2, 2), ('Ravi', 1, 0), ('Meera', 1, 1)`
- D: `('Asha', 2, 2), ('Meera', 1, 1)`

> The LEFT JOIN keeps Ravi as one row whose order columns are NULL. COUNT(*)
> counts that row (1); COUNT(o.id) counts non-NULL order ids (0). Counting the
> children of an outer join needs COUNT of a right-hand column.

## sql-intermediate-076
topic: joins
answer: B

Table `users` holds (1, 'Asha') and (2, 'Ravi') as `(id, name)`.

Table `emails`:

| user_id | addr |
| --- | --- |
| 1 | a1 |
| 1 | a2 |
| 2 | r1 |

Table `phones`:

| user_id | num |
| --- | --- |
| 1 | p1 |
| 1 | p2 |
| 1 | p3 |

What does this query return?

```sql
SELECT u.name, COUNT(e.addr) AS emails, COUNT(p.num) AS phones
FROM users u
LEFT JOIN emails e ON e.user_id = u.id
LEFT JOIN phones p ON p.user_id = u.id
GROUP BY u.id, u.name
ORDER BY u.id;
```

- A: `('Asha', 2, 3), ('Ravi', 1, 0)`
- B: `('Asha', 6, 6), ('Ravi', 1, 0)`
- C: `('Asha', 6, 6), ('Ravi', 1, 1)`
- D: `('Asha', 5, 5), ('Ravi', 1, 0)`

> Two independent one-to-many joins multiply: Asha's 2 emails × 3 phones give
> 6 joined rows, and each row has a non-NULL email and phone. Ravi has one
> email and no phone: one row with a NULL phone. Use COUNT(DISTINCT ...) or
> aggregate each child table separately to get 2 and 3.

## sql-intermediate-077
topic: nulls
answer: A

In SQL's three-valued logic, which expression evaluates to TRUE?

- A: `TRUE OR NULL`
- B: `NULL = NULL`
- C: `FALSE AND NULL`
- D: `NOT (NULL <> 1)`

> Treat NULL as "unknown". TRUE OR anything is TRUE, so the unknown side does
> not matter. FALSE AND anything is FALSE (not TRUE). `NULL = NULL` and
> `NULL <> 1` are UNKNOWN, and NOT UNKNOWN is still UNKNOWN.

## sql-intermediate-078
topic: nulls
answer: D

Table `reviews`:

| id | stars |
| --- | --- |
| 1 | 4 |
| 2 | NULL |
| 3 | 2 |
| 4 | NULL |

Which values does this query return (ignore how many decimal places are
displayed)?

```sql
SELECT AVG(stars), AVG(COALESCE(stars, 0))
FROM reviews;
```

- A: `(1.5, 1.5)`
- B: `(3, 3)`
- C: `(NULL, 1.5)`
- D: `(3, 1.5)`

> AVG skips NULLs, so it averages 4 and 2 over 2 values: 3. COALESCE turns the
> NULLs into 0 first, so the second average is 6 over 4 rows: 1.5. Whether a
> missing rating should count as zero is a business decision the query has to
> make explicitly.

## sql-intermediate-079
topic: aggregation
answer: C

Table `orders`:

| id | customer_id | status |
| --- | --- | --- |
| 1 | 1 | paid |
| 2 | 1 | refunded |
| 3 | 2 | paid |
| 4 | 2 | paid |
| 5 | 3 | refunded |
| 6 | 4 | paid |

What does this query return?

```sql
SELECT customer_id
FROM orders
GROUP BY customer_id
HAVING SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) = 0
ORDER BY customer_id;
```

- A: `1, 2, 4`
- B: `1, 3`
- C: `2, 4`
- D: `3`

> The CASE counts each customer's refunds and HAVING keeps the groups with
> none: customers 2 and 4. Filtering rows first with
> `WHERE status <> 'refunded'` would answer a different question ("customers
> with at least one non-refunded order") and return 1, 2, 4.

## sql-intermediate-080
topic: aggregation
answer: B

Table `payments`:

| id | amount |
| --- | --- |
| 1 | 10 |
| 2 | 10 |
| 3 | 20 |
| 4 | 30 |

What does this query return?

```sql
SELECT SUM(amount), SUM(DISTINCT amount), COUNT(DISTINCT amount)
FROM payments;
```

- A: `(70, 70, 4)`
- B: `(70, 60, 3)`
- C: `(70, 50, 2)`
- D: `(60, 60, 3)`

> DISTINCT inside an aggregate removes duplicate values before aggregating:
> the distinct amounts are 10, 20 and 30, which sum to 60. It keeps one copy
> of a repeated value; it does not drop repeated values altogether (that would
> be C).

## sql-intermediate-081
topic: indexes
answer: A

`orders` has 10 million rows and a B-tree index on `is_archived`; 95% of the
rows have `is_archived = 0`. Why might the optimizer ignore the index for this
query?

```sql
SELECT * FROM orders WHERE is_archived = 0;
```

- A: Fetching 95% of the rows via index lookups costs more than one sequential scan.
- B: An index on an integer column cannot be used with `=`.
- C: An index is never used on a column with fewer than ten distinct values.
- D: The index is used only if the query also has `ORDER BY is_archived`.

> Each index hit needs a separate fetch of the row, in index order rather
> than storage order. When a predicate matches most of the table, reading the
> whole table sequentially is cheaper, and cost-based optimizers choose it.
> The same index is useful for `is_archived = 1`, which matches 5%.

## sql-intermediate-082
topic: indexes
answer: D

Table `t` has a B-tree index on `(a, b)`. Which query can read its rows from
the index already in the requested order, with no separate sort step?

- A: `SELECT a, b FROM t ORDER BY b`
- B: `SELECT a, b FROM t WHERE a > 5 ORDER BY b`
- C: `SELECT a, b FROM t ORDER BY b, a`
- D: `SELECT a, b FROM t WHERE a = 5 ORDER BY b`

> Index entries are sorted by a, then by b within each a. With `a = 5` the
> matching entries are one run that is already sorted by b. Ordering by b
> alone across many a values (A, B) or by (b, a) (C) does not follow the index
> order, so the rows must be sorted.

## sql-intermediate-083
topic: normalization
answer: C

Relation `R(A, B, C, D)` has the functional dependencies `A → B` and `C → D`
(and only those they imply). What is its candidate key?

- A: `{A}`
- B: `{A, B, C, D}`
- C: `{A, C}`
- D: `{B, D}`

> The closure of {A, C} is {A, B, C, D}, so it is a key, and neither A alone
> ({A, B}) nor C alone ({C, D}) is. Nothing determines A or C, so every key
> must contain both. {A, B, C, D} is a superkey but not minimal, and {B, D}
> determines nothing.

## sql-intermediate-084
topic: normalization
answer: B

`R(A, B, C)` has the functional dependency `B → C` (and only those it
implies). It is decomposed into `R1(A, B)` and `R2(B, C)`. Which statement is
correct?

- A: It is lossy: joining R1 and R2 can produce rows that were not in R.
- B: It is lossless: the shared column B is a key of R2.
- C: It is lossless only if A is copied into R2 as well.
- D: It is lossy: B → C can no longer be enforced.

> A binary decomposition is lossless when the common attributes determine all
> of one side. R1 ∩ R2 = {B} and B → C, so B is a key of R2 and each R1 row
> joins with exactly one R2 row. The dependency B → C lives entirely in R2, so
> it is preserved and enforceable there too.

## sql-intermediate-085
topic: transactions
answer: D

A transfer's `COMMIT` returns success, and one second later the database
server loses power. After the restart, the transfer is still there. Which
ACID property guarantees that?

- A: Atomicity
- B: Consistency
- C: Isolation
- D: Durability

> Durability means a committed transaction survives crashes; engines achieve
> it by writing the change to a log on stable storage before COMMIT returns.
> Atomicity is all-or-nothing within a transaction, consistency is keeping
> constraints true, and isolation is concurrent transactions not interfering.

## sql-intermediate-086
topic: transactions
answer: A

`accounts` holds one row, `(id 1, balance 500)`. A session with autocommit on
(the default in MySQL and PostgreSQL) runs, without starting a transaction:

```sql
UPDATE accounts SET balance = 0 WHERE id = 1;
ROLLBACK;
SELECT balance FROM accounts WHERE id = 1;
```

What does the SELECT return?

- A: `0`
- B: `500`
- C: `NULL`
- D: It fails: ROLLBACK without START TRANSACTION is an error.

> With autocommit on, each statement outside an explicit transaction is its own
> transaction and commits as soon as it succeeds. By the time ROLLBACK runs
> there is nothing to undo; it is a no-op (PostgreSQL only prints a warning).
> To be able to roll back, start the transaction before the UPDATE.

## sql-intermediate-087
topic: transactions
answer: C

Several services update account rows inside transactions and occasionally
fail with deadlock errors. Which practice most directly prevents the lock
cycles?

- A: Run every transaction at READ UNCOMMITTED.
- B: Turn autocommit off for every session.
- C: Lock and update rows in one agreed order, such as ascending id.
- D: Make transactions longer so that fewer of them start.

> A deadlock is a cycle: T1 holds X and waits for Y while T2 holds Y and waits
> for X. If every transaction acquires its locks in the same order, no such
> cycle can form. Isolation levels do not change the locks writes take, and
> longer transactions hold their locks longer, which makes deadlocks more
> likely.

## sql-intermediate-088
topic: set-operations
answer: B

In standard SQL, table `a(x)` holds the rows 1, 1, 2, 3, 3 and table `b(x)`
holds 1, 3, 3, 3, 4. How many rows does this return?

```sql
SELECT x FROM a
INTERSECT
SELECT x FROM b;
```

- A: `3`
- B: `2`
- C: `8`
- D: `4`

> INTERSECT (without ALL) returns each distinct row present in both inputs
> once: 1 and 3. INTERSECT ALL would keep the smaller count of each value (one
> 1 and two 3s: 3 rows). D counts a's rows that have a match, and C is the row
> count of an inner join on x.

## sql-intermediate-089
topic: ddl-constraints
answer: A

```sql
CREATE TABLE teams (id INT PRIMARY KEY);
CREATE TABLE players (
  id INT PRIMARY KEY,
  team_id INT,
  FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
);
```

`teams` holds ids 1 and 2. `players` holds (10, 1), (11, 1) and (12, 2) as
`(id, team_id)`. What does the SELECT return?

```sql
DELETE FROM teams WHERE id = 1;
SELECT id, team_id FROM players ORDER BY id;
```

- A: `(10, NULL), (11, NULL), (12, 2)`
- B: `(12, 2)`
- C: `(10, 1), (11, 1), (12, 2)`
- D: The DELETE fails because players still reference team 1.

> ON DELETE SET NULL keeps the child rows and sets their foreign key to NULL
> (the column must be nullable). B is what ON DELETE CASCADE would do, and D
> is the default NO ACTION / RESTRICT behaviour. C cannot happen: the foreign
> key is enforced, so no player may point at a deleted team.

## sql-intermediate-090
topic: ddl-constraints
answer: D

These statements run one at a time with autocommit on, in MySQL 8 (8.0.16 or
later) or PostgreSQL:

```sql
CREATE TABLE items (
  id INT PRIMARY KEY,
  qty INT CHECK (qty > 0)
);
INSERT INTO items VALUES (1, 5);
INSERT INTO items VALUES (2, NULL);
INSERT INTO items VALUES (3, 0);
```

How many rows does `items` hold afterwards?

- A: `1`
- B: `3`
- C: `0`
- D: `2`

> A CHECK constraint rejects a row only when its condition is FALSE. For
> qty = NULL, `NULL > 0` is UNKNOWN, so the row is accepted; qty = 0 makes it
> FALSE and that INSERT fails. Add NOT NULL if the column must have a value.
