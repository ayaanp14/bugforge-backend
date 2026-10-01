---
skill: sql
level: intermediate
---

## sql-intermediate-047
topic: window-functions
answer: C

Table `results`:

| race | runner | secs |
| --- | --- | --- |
| r1 | Asha | 50 |
| r1 | Ravi | 50 |
| r1 | Meera | 55 |
| r2 | Kiran | 61 |
| r2 | Dev | 59 |
| r2 | Nila | 59 |
| r3 | Om | 70 |

What does this query return?

```sql
SELECT COUNT(*)
FROM (
  SELECT runner, RANK() OVER (PARTITION BY race ORDER BY secs) AS rnk
  FROM results
) t
WHERE rnk = 1;
```

- A: `3`
- B: `2`
- C: `5`
- D: `1`

> RANK gives tied rows the same rank, and PARTITION BY ranks each race on its
> own. r1 has two winners on 50, r2 two on 59 and r3 one, so 5 rows have
> rnk = 1. ROW_NUMBER would give exactly one per race (3); without PARTITION
> BY only the two 50s would rank first (2).

## sql-intermediate-048
topic: window-functions
answer: A

Table `logins`:

| id | user_id | day_no |
| --- | --- | --- |
| 1 | 1 | 3 |
| 2 | 1 | 5 |
| 3 | 2 | 4 |
| 4 | 1 | 9 |
| 5 | 2 | 8 |

What does this query return?

```sql
SELECT id,
       LEAD(day_no) OVER (PARTITION BY user_id ORDER BY day_no) - day_no AS gap
FROM logins
ORDER BY id;
```

- A: `(1, 2), (2, 4), (3, 4), (4, NULL), (5, NULL)`
- B: `(1, 1), (2, 3), (3, 1), (4, NULL), (5, 1)`
- C: `(1, NULL), (2, -2), (3, NULL), (4, -4), (5, -4)`
- D: `(1, 2), (2, 4), (3, 4), (4, 0), (5, 0)`

> LEAD looks at the next row within the same user, in day_no order. User 1's
> days are 3, 5, 9 (gaps 2 and 4), user 2's are 4, 8 (gap 4). Each user's last
> login has no next row, so LEAD returns NULL and the gap is NULL. B ignores
> the partition; C is what LAG would give.

## sql-intermediate-049
topic: window-functions
answer: D

Table `t` has seven rows with `id` 1, 2, 3, 4, 5, 6 and 7. What does this query
return?

```sql
SELECT bucket, COUNT(*)
FROM (
  SELECT id, NTILE(3) OVER (ORDER BY id) AS bucket
  FROM t
) x
GROUP BY bucket
ORDER BY bucket;
```

- A: `(1, 2), (2, 2), (3, 3)`
- B: `(1, 3), (2, 3), (3, 1)`
- C: `(1, 2), (2, 3), (3, 2)`
- D: `(1, 3), (2, 2), (3, 2)`

> NTILE(n) splits the ordered rows into n buckets whose sizes differ by at most
> one, and the larger buckets come first. 7 = 3 × 2 + 1, so the one extra row
> goes to bucket 1: ids 1–3, 4–5 and 6–7.

## sql-intermediate-050
topic: window-functions
answer: B

Table `sales`:

| region | amount |
| --- | --- |
| N | 10 |
| S | 30 |
| N | 25 |
| E | 20 |
| S | 5 |
| E | 10 |

What does this query return?

```sql
SELECT region,
       SUM(amount) AS total,
       RANK() OVER (ORDER BY SUM(amount) DESC) AS pos
FROM sales
GROUP BY region
ORDER BY pos, region;
```

- A: `('N', 35, 1), ('S', 35, 2), ('E', 30, 3)`
- B: `('N', 35, 1), ('S', 35, 1), ('E', 30, 3)`
- C: `('N', 35, 1), ('S', 35, 1), ('E', 30, 2)`
- D: It fails: a window's ORDER BY cannot contain an aggregate.

> Window functions run after GROUP BY, over the grouped rows, so they can
> order by an aggregate. N and S both total 35 and share rank 1; RANK then
> skips to 3 for E (30). C is what DENSE_RANK gives; A numbers the tie apart,
> as ROW_NUMBER would.

## sql-intermediate-051
topic: subqueries
answer: A

Table `emp`:

| id | manager_id |
| --- | --- |
| 1 | NULL |
| 2 | 1 |
| 3 | 1 |
| 4 | 2 |
| 5 | 4 |
| 6 | 4 |
| 7 | 3 |

What does this query return?

```sql
WITH RECURSIVE chain (id) AS (
  SELECT id FROM emp WHERE manager_id = 2
  UNION ALL
  SELECT e.id FROM emp e JOIN chain c ON e.manager_id = c.id
)
SELECT COUNT(*) FROM chain;
```

- A: `3`
- B: `1`
- C: `4`
- D: `6`

> The anchor finds employee 2's direct report, 4. The recursive step then adds
> the reports of each row found in the previous step: 5 and 6 (under 4), then
> nobody (5 and 6 manage no one), which ends the recursion. The chain is 4, 5,
> 6. Employee 2 is not included because the anchor selects reports of 2, not 2
> itself.

## sql-intermediate-052
topic: subqueries
answer: C

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 100 |
| 2 | 1 | 50 |
| 3 | 2 | 90 |
| 4 | 3 | 200 |
| 5 | 3 | 10 |
| 6 | 4 | 20 |

What does this query return?

```sql
WITH totals AS (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
)
SELECT customer_id
FROM totals
WHERE total > (SELECT AVG(total) FROM totals)
ORDER BY customer_id;
```

- A: `1, 2, 3`
- B: `3`
- C: `1, 3`
- D: `1, 2, 3, 4`

> The CTE has one row per customer: 150, 90, 210 and 20. The subquery averages
> those totals (470 / 4 = 117.5), and customers 1 and 3 are above it. A is what
> you get by comparing with the average single order (470 / 6 ≈ 78.3) instead.
> A CTE can be referenced more than once in the same query.

## sql-intermediate-053
topic: subqueries
answer: D

Table `customers` holds (1, 'Asha') and (2, 'Ravi') as `(id, name)`. Table
`orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 10 | 1 | 50 |
| 11 | 1 | 70 |
| 12 | 2 | 30 |

What happens when this query runs?

```sql
SELECT c.name,
       (SELECT o.amount FROM orders o WHERE o.customer_id = c.id) AS amount
FROM customers c
ORDER BY c.id;
```

- A: It returns `('Asha', 50), ('Ravi', 30)`.
- B: It returns `('Asha', 50), ('Asha', 70), ('Ravi', 30)`.
- C: It returns `('Asha', NULL), ('Ravi', 30)`.
- D: It fails: the subquery returns more than one row for Asha.

> A subquery used as a value must return at most one row. For Asha it returns
> two, and both MySQL and PostgreSQL raise an error rather than pick one or
> multiply rows. Aggregate it (SUM, MAX) or move the table into a join if you
> want one row per order.

## sql-intermediate-054
topic: joins
answer: B

Table `orders`:

| id | amount |
| --- | --- |
| 1 | 100 |
| 2 | 50 |

Table `order_items`:

| order_id | sku |
| --- | --- |
| 1 | a |
| 1 | b |
| 1 | c |
| 2 | a |

What does this query return?

```sql
SELECT SUM(o.amount)
FROM orders o
JOIN order_items i ON i.order_id = o.id;
```

- A: `150`
- B: `350`
- C: `450`
- D: `600`

> The join produces one row per item, and each row carries its order's amount.
> Order 1 appears three times (300) and order 2 once (50), so the sum is 350,
> not the true 150. Aggregate the child table first (or don't join it) before
> summing a parent column.

## sql-intermediate-055
topic: joins
answer: C

Table `people`:

| id | city |
| --- | --- |
| 1 | Pune |
| 2 | Pune |
| 3 | Delhi |
| 4 | Pune |
| 5 | Delhi |

What does this query return?

```sql
SELECT COUNT(*)
FROM people a
JOIN people b ON a.city = b.city AND a.id < b.id;
```

- A: `8`
- B: `13`
- C: `4`
- D: `2`

> The self join pairs people in the same city, and `a.id < b.id` keeps each
> unordered pair once and drops pairing someone with themselves. Pune has 3
> people (3 pairs), Delhi 2 (1 pair). With `<>` each pair would appear twice
> (8); with no id condition every self-pairing is kept too (9 + 4 = 13).

## sql-intermediate-056
topic: joins
answer: A

Table `scores`:

| name | score |
| --- | --- |
| Asha | 72 |
| Ravi | 75 |
| Meera | 90 |
| Kiran | 40 |

Table `grades`:

| lo | hi | grade |
| --- | --- | --- |
| 0 | 50 | F |
| 50 | 75 | C |
| 75 | 90 | B |
| 90 | 100 | A |

What does this query return?

```sql
SELECT COUNT(*)
FROM scores s
JOIN grades g ON s.score BETWEEN g.lo AND g.hi;
```

- A: `6`
- B: `4`
- C: `5`
- D: `8`

> BETWEEN includes both ends, and the bands share their endpoints. 75 falls in
> both C (50–75) and B (75–90), and 90 in both B and A, so Ravi and Meera each
> match two bands; Asha and Kiran match one. A non-equi join returns every
> matching pair, so 1 + 2 + 2 + 1 = 6.

## sql-intermediate-057
topic: nulls
answer: B

Table `tasks`:

| id | status |
| --- | --- |
| 1 | done |
| 2 | NULL |
| 3 | open |
| 4 | NULL |

What does this query return?

```sql
SELECT id,
       CASE WHEN status = NULL  THEN 'none'
            WHEN status IS NULL THEN 'missing'
            ELSE status
       END AS label
FROM tasks
ORDER BY id;
```

- A: `(1, 'done'), (2, 'none'), (3, 'open'), (4, 'none')`
- B: `(1, 'done'), (2, 'missing'), (3, 'open'), (4, 'missing')`
- C: `(1, 'done'), (2, NULL), (3, 'open'), (4, NULL)`
- D: It fails: `= NULL` is a syntax error.

> `status = NULL` is valid SQL but always evaluates to UNKNOWN, never TRUE, so
> the first branch can never be taken. The NULL rows fall through to
> `IS NULL`, which is the correct test.

## sql-intermediate-058
topic: nulls
answer: D

Table `invoice_lines`:

| id | price | tax |
| --- | --- | --- |
| 1 | 100 | 18 |
| 2 | 50 | NULL |
| 3 | NULL | 5 |
| 4 | 20 | 2 |

What does this query return?

```sql
SELECT SUM(price + tax), SUM(price) + SUM(tax)
FROM invoice_lines;
```

- A: `(195, 195)`
- B: `(140, 140)`
- C: `(NULL, 195)`
- D: `(140, 195)`

> `price + tax` is NULL whenever either side is NULL, so rows 2 and 3
> contribute nothing to the first sum: 118 + 22 = 140. In the second
> expression each SUM skips its own NULLs first: 170 + 25 = 195. SUM ignores
> NULL inputs rather than returning NULL.

## sql-intermediate-059
topic: nulls
answer: A

Table `signups`:

| id | source |
| --- | --- |
| 1 | ads |
| 2 | NULL |
| 3 | ads |
| 4 | NULL |
| 5 | blog |

What does this query return?

```sql
SELECT (SELECT COUNT(*)
        FROM (SELECT source FROM signups GROUP BY source) g) AS group_rows,
       (SELECT COUNT(DISTINCT source) FROM signups)       AS distinct_sources;
```

- A: `(3, 2)`
- B: `(4, 2)`
- C: `(2, 2)`
- D: `(3, 3)`

> GROUP BY puts all NULLs into one group, so there are three groups: ads, blog
> and NULL. COUNT(DISTINCT source) counts only non-NULL values: ads and blog.

## sql-intermediate-060
topic: aggregation
answer: C

Table `attendance`:

| student | status |
| --- | --- |
| s1 | present |
| s1 | absent |
| s1 | present |
| s2 | absent |
| s2 | absent |
| s3 | present |

What does this query return?

```sql
SELECT student,
       SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS p,
       SUM(CASE WHEN status = 'absent'  THEN 1 END)        AS a
FROM attendance
GROUP BY student
ORDER BY student;
```

- A: `('s1', 2, 1), ('s2', 0, 2), ('s3', 1, 0)`
- B: `('s1', 2, 1), ('s2', 0, 2)`
- C: `('s1', 2, 1), ('s2', 0, 2), ('s3', 1, NULL)`
- D: `('s1', 2, 1), ('s2', NULL, 2), ('s3', 1, NULL)`

> With ELSE 0 every row contributes a number, so s2's `p` is 0. Without ELSE a
> non-matching row contributes NULL; s3 has no absent rows, so `a` sums only
> NULLs, and SUM over no non-NULL values is NULL, not 0. The group itself is
> still returned.

## sql-intermediate-061
topic: aggregation
answer: D

Table `purchases`:

| customer_id | category |
| --- | --- |
| 1 | books |
| 1 | toys |
| 1 | books |
| 2 | books |
| 2 | books |
| 3 | toys |
| 3 | games |
| 3 | books |

What does this query return?

```sql
SELECT customer_id
FROM purchases
GROUP BY customer_id
HAVING COUNT(DISTINCT category) >= 2
ORDER BY customer_id;
```

- A: `1, 2, 3`
- B: `3`
- C: `1`
- D: `1, 3`

> Customer 1 bought in 2 distinct categories, customer 2 in 1 (two rows, both
> books), customer 3 in 3. HAVING can test any aggregate, including
> COUNT(DISTINCT ...); plain COUNT(*) would also have let customer 2 through.

## sql-intermediate-062
topic: indexes
answer: B

`customers` has a B-tree index on `last_name`. Which predicate can never be
narrowed to a range of that index, whatever the database or collation, so the
engine must examine every row (or every index entry)?

- A: `last_name = 'Shah'`
- B: `last_name LIKE '%Shah'`
- C: `last_name IN ('Shah', 'Rao')`
- D: `last_name BETWEEN 'R' AND 'T'`

> A B-tree is ordered by the value from its first character. With a leading
> wildcard the matching names can start with anything, so there is no range to
> seek to. Equality, IN lists (several seeks) and BETWEEN (one range) all map
> to ranges of the index.

## sql-intermediate-063
topic: indexes
answer: A

This query is frequent and slow:

```sql
SELECT * FROM orders
WHERE customer_id = ? AND created_at >= ?;
```

Which index serves it best?

- A: `(customer_id, created_at)`
- B: `(created_at, customer_id)`
- C: Two single-column indexes, one on customer_id and one on created_at
- D: Any of these: column order in a composite index does not matter

> Put equality columns first and the range column last. With
> (customer_id, created_at) the matches are one contiguous slice: this
> customer, from the given date on. With (created_at, customer_id) the range
> comes first, so the scan covers every customer's recent orders and filters
> customer_id along the way. Two separate indexes can at best be combined,
> which is more work than one seek.

## sql-intermediate-064
topic: indexes
answer: C

`orders` has an index on `status` and no index on `amount`. Why does this query
still read the whole table?

```sql
SELECT * FROM orders
WHERE status = 'failed' OR amount > 10000;
```

- A: OR always prevents a query from using any index.
- B: An index is ignored whenever WHERE has more than one condition.
- C: Rows with amount over 10000 can have any status, and only a full scan finds them.
- D: The index can be used only when status is the last condition in WHERE.

> With OR, a row qualifies through either branch. The status index finds the
> failed rows, but the `amount > 10000` rows can be anywhere and nothing indexes
> them, so the engine has to scan everything anyway. With an index on amount
> too, the engine could combine two index lookups (an index merge or bitmap OR).

## sql-intermediate-065
topic: normalization
answer: B

`teaching(student, course, instructor)`: each instructor teaches exactly one
course, and a student takes a given course from one instructor. So
`(student, course) → instructor` and `instructor → course`, and the candidate
keys are `(student, course)` and `(student, instructor)`. Which statement is
correct?

- A: It is in BCNF.
- B: It is in 3NF but not in BCNF.
- C: It is in 1NF but violates 2NF.
- D: It is in 2NF but violates 3NF.

> BCNF requires every determinant to be a superkey; `instructor` determines
> course but is not a superkey, so it is not in BCNF. 3NF also accepts a
> dependency whose right-hand side is a prime attribute (part of some candidate
> key), and course is prime, so it is in 3NF. Every attribute is prime, so no
> 2NF or 3NF violation is possible.

## sql-intermediate-066
topic: normalization
answer: A

`contacts(id, name, phones)` stores values like `'98200 11111, 98200 22222'`
in `phones`. Which normal form does this break, and what is the usual fix?

- A: 1NF; keep phones in a separate table, one row per phone.
- B: 2NF; move name into its own table keyed by id.
- C: 3NF; add a phone_count column to check the list.
- D: BCNF; make phones part of the primary key.

> 1NF requires atomic values: one value per column per row. A comma-separated
> list cannot be indexed, joined or constrained per phone. The fix is a
> `contact_phones(contact_id, phone)` table with one row per number.

## sql-intermediate-067
topic: transactions
answer: D

T1 runs `SELECT COUNT(*) FROM orders WHERE status = 'new'` and gets 4. T2
inserts a new order with status 'new' and commits. T1 runs the same count
again in the same transaction and gets 5. Per the SQL standard, what is the
lowest isolation level at which this cannot happen?

- A: READ UNCOMMITTED
- B: READ COMMITTED
- C: REPEATABLE READ
- D: SERIALIZABLE

> A row that newly matches the predicate appeared: a phantom read. Per the
> standard, REPEATABLE READ only protects rows already read from changing;
> only SERIALIZABLE rules out phantoms. (PostgreSQL's REPEATABLE READ happens
> to prevent this too, which is why the question names the standard.)

## sql-intermediate-068
topic: transactions
answer: A, B

Two sessions each run this at the same time for account 1 (balance 100),
each in its own transaction at READ COMMITTED:

```sql
SELECT balance FROM accounts WHERE id = 1;          -- reads 100
-- the application computes 100 + 10
UPDATE accounts SET balance = 110 WHERE id = 1;
COMMIT;
```

The final balance is 110, not 120. Which changes prevent this lost update?
Select all that apply.

- A: Read the balance with `SELECT balance FROM accounts WHERE id = 1 FOR UPDATE`.
- B: Replace both statements with `UPDATE accounts SET balance = balance + 10 WHERE id = 1`.
- C: Run both sessions at READ UNCOMMITTED so each sees the other's write.
- D: Commit right after the SELECT and do the UPDATE in a new transaction.

> FOR UPDATE locks the row, so the second session's SELECT waits until the first
> commits and then reads 110. A single `balance = balance + 10` lets the
> database do the read and the write atomically; the second UPDATE waits for
> the row lock and adds to 110. C does not help, because both sessions can
> still read 100 before either writes, and D widens the gap between read and
> write.
