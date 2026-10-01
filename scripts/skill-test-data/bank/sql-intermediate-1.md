---
skill: sql
level: intermediate
---

## sql-intermediate-001
topic: window-functions
answer: C

Table `scores`:

| player | points |
| --- | --- |
| ana | 90 |
| ben | 85 |
| cai | 90 |
| dev | 80 |
| eli | 85 |

What does this query return?

```sql
SELECT r, d
FROM (
  SELECT player,
         RANK()       OVER (ORDER BY points DESC) AS r,
         DENSE_RANK() OVER (ORDER BY points DESC) AS d
  FROM scores
) ranked
WHERE player = 'dev';
```

- A: `(3, 3)`
- B: `(5, 5)`
- C: `(5, 3)`
- D: `(4, 3)`

> The two 90s share position 1 and the two 85s share the next one. RANK leaves
> a gap after each tie (1, 1, 3, 3, 5), so dev is 5th; DENSE_RANK does not
> skip (1, 1, 2, 2, 3), so dev is 3rd.

## sql-intermediate-002
topic: window-functions
answer: B

Table `sales`:

| id | sale_day | amount |
| --- | --- | --- |
| 1 | 1 | 10 |
| 2 | 2 | 20 |
| 3 | 2 | 5 |
| 4 | 3 | 7 |

What does this query return?

```sql
SELECT id, SUM(amount) OVER (ORDER BY sale_day) AS running
FROM sales
ORDER BY id;
```

- A: `(1, 10), (2, 30), (3, 35), (4, 42)`
- B: `(1, 10), (2, 35), (3, 35), (4, 42)`
- C: `(1, 42), (2, 42), (3, 42), (4, 42)`
- D: `(1, 10), (2, 20), (3, 5), (4, 7)`

> With an ORDER BY and no frame clause the frame is RANGE BETWEEN UNBOUNDED
> PRECEDING AND CURRENT ROW, which includes every peer of the current row
> (rows with the same sale_day). Both day-2 rows therefore see 10 + 20 + 5 = 35.
> A per-row running total needs ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
> or a unique ORDER BY such as (sale_day, id).

## sql-intermediate-003
topic: window-functions
answer: D

Table `employees`:

| id | dept | name | salary |
| --- | --- | --- | --- |
| 1 | eng | Asha | 900 |
| 2 | eng | Ravi | 950 |
| 3 | eng | Meera | 950 |
| 4 | ops | Kiran | 700 |
| 5 | ops | Dev | 650 |
| 6 | hr | Nila | 600 |

What does this query return?

```sql
SELECT name
FROM (
  SELECT name,
         ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC, id) AS rn
  FROM employees
) t
WHERE rn = 1
ORDER BY name;
```

- A: `'Ravi'`
- B: `'Kiran', 'Meera', 'Nila', 'Ravi'`
- C: `'Kiran', 'Meera', 'Nila'`
- D: `'Kiran', 'Nila', 'Ravi'`

> PARTITION BY restarts the numbering in each department, so each department
> contributes exactly one row with rn = 1. In eng, Ravi and Meera tie on 950 and
> the tie-break `id` puts Ravi (id 2) first. ROW_NUMBER never gives two rows the
> same number, so Meera is rn = 2; RANK would have returned both.

## sql-intermediate-004
topic: window-functions
answer: A

Table `readings`:

| id | temp |
| --- | --- |
| 1 | 20 |
| 2 | 23 |
| 3 | 21 |
| 4 | 21 |

What does this query return?

```sql
SELECT id, temp - LAG(temp) OVER (ORDER BY id) AS delta
FROM readings
ORDER BY id;
```

- A: `(1, NULL), (2, 3), (3, -2), (4, 0)`
- B: `(1, 0), (2, 3), (3, -2), (4, 0)`
- C: `(1, 3), (2, -2), (3, 0), (4, NULL)`
- D: `(2, 3), (3, -2), (4, 0)`

> LAG(temp) is the previous row's temp in id order. The first row has no
> previous row, so LAG returns NULL (its default when no third argument is
> given) and 20 - NULL is NULL; the row itself is still returned. Option C is
> what LEAD would give.

## sql-intermediate-005
topic: subqueries
answer: B

Table `staff`:

| id | dept | salary |
| --- | --- | --- |
| 1 | A | 100 |
| 2 | A | 200 |
| 3 | A | 300 |
| 4 | B | 400 |
| 5 | B | 400 |
| 6 | C | 50 |

What does this query return?

```sql
SELECT s.id
FROM staff s
WHERE s.salary > (SELECT AVG(s2.salary)
                  FROM staff s2
                  WHERE s2.dept = s.dept)
ORDER BY s.id;
```

- A: `3, 4, 5`
- B: `3`
- C: `2, 3, 4, 5, 6`
- D: It fails: the subquery returns more than one row.

> The subquery is correlated: for each outer row it averages only that row's
> department, so it returns one value per outer row. Department A averages 200
> (only 300 is above it), department B averages 400 and department C averages
> 50, and nobody in B or C is strictly above their average. Option A compares
> against the overall average (241.67); option C is what `>=` would return.

## sql-intermediate-006
topic: subqueries
answer: C

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 10 | 1 | 50 |
| 11 | 1 | 20 |
| 12 | 3 | NULL |

What does this query return?

```sql
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT NULL FROM orders o WHERE o.customer_id = c.id)
ORDER BY c.id;
```

- A: No rows: the subquery selects only `NULL`.
- B: `'Asha'`
- C: `'Asha', 'Meera'`
- D: `'Asha', 'Asha', 'Meera'`

> EXISTS is true when the subquery produces at least one row; what the select
> list contains (NULL, 1, *) is irrelevant, and so is the NULL amount on
> Meera's order. It is a semi-join: Asha appears once however many orders she
> has, unlike a JOIN.

## sql-intermediate-007
topic: joins
answer: D

Tables `a`, `b` and `c` each have one column `k`:

| a.k |
| --- |
| 1 |
| 1 |
| 2 |
| 3 |

| b.k |
| --- |
| 1 |
| 1 |
| 1 |
| 2 |
| 4 |

| c.k |
| --- |
| 1 |
| 2 |
| 2 |

What does this query return?

```sql
SELECT COUNT(*)
FROM a
JOIN b ON b.k = a.k
JOIN c ON c.k = a.k;
```

- A: `2`
- B: `5`
- C: `7`
- D: `8`

> A join pairs every matching row with every other matching row, so duplicates
> multiply. For k = 1: 2 (a) × 3 (b) × 1 (c) = 6 rows. For k = 2: 1 × 1 × 2 = 2
> rows. k = 3 and k = 4 are each missing from at least one table, so they add
> nothing. 6 + 2 = 8.

## sql-intermediate-008
topic: joins
answer: A

Table `customers`:

| id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ravi |
| 3 | Meera |

Table `orders`:

| id | customer_id | status |
| --- | --- | --- |
| 10 | 1 | paid |
| 11 | 1 | open |
| 12 | 2 | open |

What does this query return?

```sql
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'
ORDER BY c.id;
```

- A: `('Asha', 10), ('Ravi', NULL), ('Meera', NULL)`
- B: `('Asha', 10)`
- C: `('Asha', 10), ('Asha', NULL), ('Ravi', NULL), ('Meera', NULL)`
- D: `('Asha', 10), ('Ravi', 12), ('Meera', NULL)`

> A condition in the ON clause of a LEFT JOIN only decides which right-hand
> rows match; every customer is kept, with NULLs when nothing matched. Ravi's
> only order is open, so he gets NULL, and Asha's open order simply does not
> match (it adds no extra row). Putting `o.status = 'paid'` in WHERE instead
> would discard the NULL rows and return only Asha (option B).

## sql-intermediate-009
topic: nulls
answer: D

Table `products`:

| id |
| --- |
| 1 |
| 2 |
| 3 |
| 4 |

Table `discontinued`:

| product_id |
| --- |
| 2 |
| NULL |

What does this query return?

```sql
SELECT COUNT(*)
FROM products
WHERE id NOT IN (SELECT product_id FROM discontinued);
```

- A: `3`
- B: `2`
- C: `4`
- D: `0`

> `id NOT IN (2, NULL)` means `id <> 2 AND id <> NULL`. The second comparison is
> UNKNOWN for every id, so the whole condition is FALSE for id 2 and UNKNOWN for
> the rest; WHERE keeps only TRUE rows, so nothing qualifies. NOT EXISTS (or
> filtering the NULLs out of the subquery) gives the intended 3.

## sql-intermediate-010
topic: nulls
answer: C

Table `tickets`:

| id | assignee |
| --- | --- |
| 1 | ravi |
| 2 | NULL |
| 3 | asha |
| 4 | ravi |
| 5 | NULL |

What does this query return?

```sql
SELECT COUNT(*), COUNT(assignee), COUNT(DISTINCT assignee)
FROM tickets;
```

- A: `(5, 5, 3)`
- B: `(5, 3, 3)`
- C: `(5, 3, 2)`
- D: `(3, 3, 2)`

> COUNT(*) counts rows (5). COUNT(assignee) counts non-NULL values (3).
> COUNT(DISTINCT assignee) counts distinct non-NULL values, ravi and asha (2);
> NULL is never counted as a value.

## sql-intermediate-011
topic: nulls
answer: B

Table `items`:

| id | discount |
| --- | --- |
| 1 | 5 |
| 2 | 15 |
| 3 | NULL |
| 4 | 10 |
| 5 | NULL |

What does this query return?

```sql
SELECT (SELECT COUNT(*) FROM items WHERE discount > 10)
     + (SELECT COUNT(*) FROM items WHERE NOT (discount > 10)) AS total;
```

- A: `5`
- B: `3`
- C: `2`
- D: `1`

> For the NULL rows `discount > 10` is UNKNOWN, and NOT UNKNOWN is still
> UNKNOWN, so those rows satisfy neither filter. The first count is 1 (id 2),
> the second is 2 (ids 1 and 4): 3, not 5. A predicate and its negation do not
> together cover the table when the column holds NULLs.

## sql-intermediate-012
topic: aggregation
answer: A

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 100 |
| 2 | 1 | 50 |
| 3 | 2 | 300 |
| 4 | 3 | 40 |
| 5 | 3 | 60 |
| 6 | 3 | 20 |

What does this query return?

```sql
SELECT customer_id
FROM orders
GROUP BY customer_id
HAVING COUNT(*) >= 2 AND SUM(amount) > 100
ORDER BY customer_id;
```

- A: `1, 3`
- B: `1, 2, 3`
- C: `1`
- D: `3`

> HAVING filters groups after aggregation. Customer 1 has 2 orders totalling
> 150, customer 2 has 1 order (300), customer 3 has 3 orders totalling 120.
> Both conditions must hold, which rules out customer 2 only. Option B is what
> OR would give.

## sql-intermediate-013
topic: aggregation
answer: D

Table `payments`:

| id | method | amount |
| --- | --- | --- |
| 1 | card | 100 |
| 2 | upi | 40 |
| 3 | card | 60 |
| 4 | cash | 30 |
| 5 | upi | 20 |

What does this query return?

```sql
SELECT SUM(CASE WHEN method = 'card' THEN amount ELSE 0 END)  AS card_total,
       COUNT(CASE WHEN method = 'upi' THEN 1 END)             AS upi_count,
       COUNT(CASE WHEN method = 'upi' THEN 1 ELSE 0 END)      AS upi_else_zero
FROM payments;
```

- A: `(160, 2, 2)`
- B: `(250, 2, 5)`
- C: `(160, 5, 5)`
- D: `(160, 2, 5)`

> card_total adds only the card amounts: 100 + 60 = 160. A CASE without ELSE
> yields NULL for non-matching rows and COUNT skips NULLs, so upi_count is 2.
> With ELSE 0 every row produces a non-NULL value (0 is a value), so COUNT
> counts all 5 rows; conditional counting needs either no ELSE or SUM instead.

## sql-intermediate-014
topic: indexes
answer: A, D

Table `events` has a B-tree index on `(tenant_id, kind, created_at)`, so its
entries are sorted by tenant_id, then kind, then created_at. For which
predicates are all the matching index entries guaranteed to sit in one
contiguous range of the index, so the engine can seek to the first one and
read until the last? Select all that apply.

- A: `WHERE tenant_id = 7 AND kind = 'login'`
- B: `WHERE kind = 'login'`
- C: `WHERE tenant_id = 7 AND created_at > '2024-01-01'`
- D: `WHERE tenant_id = 7 AND kind = 'login' AND created_at > '2024-01-01'`
- E: `WHERE tenant_id > 7 AND kind = 'login'`

> A contiguous range needs equality on a leftmost prefix of the index columns,
> optionally followed by a range on the next column. A and D qualify. B skips
> the leading column, so 'login' entries are scattered across every tenant. C
> skips `kind`: within tenant 7 the recent entries of each kind are separate
> runs. In E the range is on the first column, so `kind` cannot narrow it
> further.

## sql-intermediate-015
topic: indexes
answer: C

`orders.created_at` is a TIMESTAMP column with a plain B-tree index on it.
Which predicate returns exactly the orders placed in 2024 *and* lets the
engine use that index for a range scan?

- A: `WHERE EXTRACT(YEAR FROM created_at) = 2024`
- B: `WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'`
- C: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`
- D: `WHERE CAST(created_at AS DATE) BETWEEN '2024-01-01' AND '2024-12-31'`

> A and D wrap the indexed column in an expression, so a plain index on
> created_at cannot be searched by range (it would need an expression index).
> B can use the index but is wrong: '2024-12-31' means midnight, so orders later
> on 31 December are missed. C compares the bare column with a half-open range,
> which is both correct and index-friendly.

## sql-intermediate-016
topic: normalization
answer: B

`order_items(order_id, product_id, quantity, product_name)` has the primary
key `(order_id, product_id)`. Every column holds a single value, and each
product has exactly one name. Which statement is correct?

- A: It violates 1NF.
- B: It is in 1NF but violates 2NF.
- C: It is in 2NF but violates 3NF.
- D: It is already in BCNF.

> product_name depends on product_id alone, which is only part of the
> composite key: a partial dependency, which is exactly what 2NF forbids.
> quantity depends on the whole key and is fine. The fix is a separate
> `products(product_id, product_name)` table.

## sql-intermediate-017
topic: normalization
answer: B, C

Relation `r` currently holds:

| a | b | c |
| --- | --- | --- |
| 1 | x | 10 |
| 1 | x | 20 |
| 2 | y | 30 |
| 3 | x | 40 |

Which functional dependencies does this data violate? Select all that apply.

- A: `a → b`
- B: `b → a`
- C: `a → c`
- D: `c → b`

> X → Y is violated when two rows agree on X but differ on Y. b = x appears
> with a = 1 and a = 3, so b → a fails; a = 1 appears with c = 10 and c = 20,
> so a → c fails. a → b holds (1 always pairs with x) and c → b holds (every c
> is different). Data can only disprove a dependency; whether a → b truly holds
> is a fact about the domain, not this instance.

## sql-intermediate-018
topic: transactions
answer: B, C

Per the SQL standard, which of these phenomena can still occur at the READ
COMMITTED isolation level? Select all that apply.

- A: Dirty read
- B: Non-repeatable read
- C: Phantom read

> The standard defines each level by the phenomena it rules out. READ COMMITTED
> rules out only dirty reads. Non-repeatable reads are ruled out from
> REPEATABLE READ up, and phantoms only at SERIALIZABLE. (Real engines often
> do better than the standard requires, which is why the question says "per
> the SQL standard".)

## sql-intermediate-019
topic: transactions
answer: A

Transaction T1 reads the balance of account 7 and gets 500. Transaction T2
then updates account 7 to 300 and commits. T1, still open, reads account 7
again and gets 300. Which phenomenon is this?

- A: A non-repeatable read
- B: A dirty read
- C: A phantom read
- D: A lost update

> The same row, read twice in one transaction, returned different committed
> values: a non-repeatable read. It is not dirty, because T2 had committed. A
> phantom concerns rows appearing in or vanishing from a predicate's result
> set, and a lost update needs two writers overwriting each other.

## sql-intermediate-020
topic: transactions
answer: C

Table `log(n INT)` starts empty. A session runs:

```sql
START TRANSACTION;
INSERT INTO log (n) VALUES (1);
SAVEPOINT s1;
INSERT INTO log (n) VALUES (2);
ROLLBACK TO SAVEPOINT s1;
INSERT INTO log (n) VALUES (3);
COMMIT;

SELECT n FROM log ORDER BY n;
```

What does the final SELECT return?

- A: `1, 2, 3`
- B: `3`
- C: `1, 3`
- D: `1`

> ROLLBACK TO SAVEPOINT undoes only the work done after the savepoint (the
> insert of 2) and leaves the transaction open. The insert of 3 then joins the
> same transaction, and COMMIT makes 1 and 3 permanent.

## sql-intermediate-021
topic: set-operations
answer: D

Table `jan_logins`:

| user_id |
| --- |
| 1 |
| 1 |
| 2 |
| 3 |

Table `feb_logins`:

| user_id |
| --- |
| 2 |
| 3 |
| 3 |
| 4 |

What does this query return?

```sql
SELECT COUNT(*)
FROM (
  SELECT user_id FROM jan_logins
  UNION
  SELECT user_id FROM feb_logins
) u;
```

- A: `8`
- B: `5`
- C: `2`
- D: `4`

> UNION removes all duplicate rows from the combined result, including
> duplicates that came from the same input, leaving 1, 2, 3, 4. UNION ALL would
> keep all 8 rows.

## sql-intermediate-022
topic: subqueries
answer: B

What does this query return?

```sql
WITH RECURSIVE n (x) AS (
  SELECT 1
  UNION ALL
  SELECT x + 2 FROM n WHERE x < 7
)
SELECT SUM(x) FROM n;
```

- A: `9`
- B: `16`
- C: `25`
- D: `7`

> The anchor produces 1. Each step adds 2 to the rows produced by the previous
> step while x < 7: 1 → 3 → 5 → 7. From 7 the condition is false, the step
> produces no rows and the recursion stops. The rows are 1, 3, 5, 7, and
> 7 is included because it was produced from 5, which passed the test.

## sql-intermediate-023
topic: window-functions
answer: A

Table `prices`:

| id | price |
| --- | --- |
| 1 | 30 |
| 2 | 10 |
| 3 | 20 |

What does this query return?

```sql
SELECT id, LAST_VALUE(price) OVER (ORDER BY id) AS lv
FROM prices
ORDER BY id;
```

- A: `(1, 30), (2, 10), (3, 20)`
- B: `(1, 20), (2, 20), (3, 20)`
- C: `(1, 30), (2, 30), (3, 30)`
- D: `(1, 10), (2, 20), (3, NULL)`

> With ORDER BY and no frame clause the frame ends at the current row (and its
> peers; ids are unique, so there are none). The last value in that frame is
> the current row's own price. To get the partition's last value, write
> `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.
