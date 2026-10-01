---
skill: sql
level: basic
---

## sql-basic-001
topic: select-filter
answer: B

Table `products`:

| id | name | category | price |
| --- | --- | --- | --- |
| 1 | Pen | stationery | 20 |
| 2 | Notebook | stationery | 60 |
| 3 | Mouse | electronics | 450 |
| 4 | Cable | electronics | 90 |
| 5 | Stapler | stationery | 120 |

```sql
SELECT id
FROM products
WHERE category = 'electronics' OR category = 'stationery' AND price > 100
ORDER BY id;
```

Which `id` values does the query return?

- A: `3, 5`
- B: `3, 4, 5`
- C: `5`
- D: `1, 2, 3, 4, 5`

> `AND` binds tighter than `OR`, so the condition reads
> `category = 'electronics' OR (category = 'stationery' AND price > 100)`.
> Both electronics rows (3 and 4) qualify whatever their price, plus the one
> stationery row over 100 (5). Reading it left to right as `(… OR …) AND price > 100`
> would give `3, 5`; parentheses are how you get that meaning.

## sql-basic-002
topic: select-filter
answer: C

Table `orders`:

| id | amount |
| --- | --- |
| 1 | 100 |
| 2 | 250 |
| 3 | 500 |
| 4 | 499 |
| 5 | 50 |

```sql
SELECT id FROM orders WHERE amount BETWEEN 100 AND 500;
```

How many rows does it return?

- A: `2 rows`
- B: `3 rows`
- C: `4 rows`
- D: `5 rows`

> `BETWEEN` includes both ends: it means `amount >= 100 AND amount <= 500`.
> Rows 1 (100), 2 (250), 3 (500) and 4 (499) match; only row 5 (50) is outside.
> Treating one end as exclusive gives 3, both ends 2.

## sql-basic-003
topic: select-filter
answer: A

Table `students`:

| id | name | city |
| --- | --- | --- |
| 1 | Asha | Pune |
| 2 | Ravi | Delhi |
| 3 | Meera | Mumbai |
| 4 | Kabir | Pune |
| 5 | Tara | Chennai |

```sql
SELECT name
FROM students
WHERE city NOT IN ('Pune', 'Delhi')
ORDER BY id;
```

What does the query return?

- A: `Meera, Tara`
- B: `Asha, Ravi, Kabir`
- C: `Asha, Ravi, Meera, Kabir, Tara`
- D: `Ravi, Meera, Tara`

> `NOT IN ('Pune', 'Delhi')` means `city <> 'Pune' AND city <> 'Delhi'`, so
> Asha and Kabir (Pune) and Ravi (Delhi) are removed, leaving Meera and Tara.
> `Asha, Ravi, Kabir` is what `IN` returns; reading it as `<> 'Pune' OR <> 'Delhi'`
> would keep every row.

## sql-basic-004
topic: select-filter
answer: D

Table `files`:

| id | name |
| --- | --- |
| 1 | report1 |
| 2 | report12 |
| 3 | report |
| 4 | myreport2 |
| 5 | reports |

```sql
SELECT name
FROM files
WHERE name LIKE 'report_'
ORDER BY id;
```

What does the query return?

- A: `report1`
- B: `report1, report12, reports`
- C: `report1, report12, report, reports`
- D: `report1, reports`

> In `LIKE`, `_` matches exactly one character of any kind (not only digits),
> and the pattern must cover the whole value. `report1` and `reports` are
> "report" plus one character. `report12` has two extra characters, `report`
> has none, and `myreport2` does not start with "report". Option C is what
> `'report%'` would return.

## sql-basic-005
topic: select-filter
answer: B

Table `visits`:

| id | city | weekday |
| --- | --- | --- |
| 1 | Pune | Mon |
| 2 | Pune | Mon |
| 3 | Pune | Tue |
| 4 | Delhi | Mon |
| 5 | Delhi | Mon |
| 6 | Delhi | Wed |

```sql
SELECT DISTINCT city, weekday FROM visits;
```

How many rows does it return?

- A: `6 rows`
- B: `4 rows`
- C: `3 rows`
- D: `2 rows`

> `DISTINCT` applies to the whole selected row, not to the first column only.
> The distinct (city, weekday) pairs are (Pune, Mon), (Pune, Tue), (Delhi, Mon)
> and (Delhi, Wed): 4 rows. Distinct cities alone would be 2, distinct weekdays 3.

## sql-basic-006
topic: select-filter
answer: C

Table `employees`:

| id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Sales | 50000 |
| 2 | Ravi | HR | 40000 |
| 3 | Meera | Sales | 70000 |
| 4 | Kabir | HR | 45000 |
| 5 | Tara | Sales | 60000 |

```sql
SELECT name FROM employees ORDER BY dept, salary DESC;
```

In what order are the names returned?

- A: `Ravi, Kabir, Asha, Tara, Meera`
- B: `Meera, Tara, Asha, Kabir, Ravi`
- C: `Kabir, Ravi, Meera, Tara, Asha`
- D: `Asha, Tara, Meera, Ravi, Kabir`

> Each sort key has its own direction, and `DESC` applies only to `salary`.
> Rows are sorted by `dept` ascending first (HR before Sales), then within each
> department by salary from highest to lowest: HR gives Kabir (45000), Ravi
> (40000); Sales gives Meera, Tara, Asha.

## sql-basic-007
topic: select-filter
answer: D

Table `scores`:

| id | player | points |
| --- | --- | --- |
| 1 | Asha | 82 |
| 2 | Ravi | 95 |
| 3 | Meera | 77 |
| 4 | Kabir | 88 |
| 5 | Tara | 91 |

```sql
SELECT player
FROM scores
ORDER BY points DESC
LIMIT 2 OFFSET 1;
```

What does the query return?

- A: `Ravi, Tara`
- B: `Kabir, Asha`
- C: `Asha, Kabir`
- D: `Tara, Kabir`

> Sorted by points descending the players are Ravi (95), Tara (91), Kabir (88),
> Asha (82), Meera (77). `OFFSET 1` skips the first row and `LIMIT 2` takes the
> next two: Tara and Kabir. `OFFSET n` is the number of rows skipped, so
> `OFFSET 1` skips one row, not two.

## sql-basic-008
topic: select-filter
answer: A

Table `tickets`:

| id | status | priority |
| --- | --- | --- |
| 1 | open | high |
| 2 | closed | high |
| 3 | open | low |
| 4 | closed | low |
| 5 | pending | high |

```sql
SELECT id
FROM tickets
WHERE NOT (status = 'open' OR priority = 'low')
ORDER BY id;
```

Which `id` values does it return?

- A: `2, 5`
- B: `1, 2, 4, 5`
- C: `2, 4, 5`
- D: `1, 3, 4`

> `NOT (a OR b)` is `NOT a AND NOT b`: the ticket must be not open and not low
> priority. Ticket 2 (closed, high) and ticket 5 (pending, high) pass; 1 and 3
> are open and 4 is low. `1, 2, 4, 5` is the mistaken `NOT a OR NOT b`, and
> `1, 3, 4` is the condition without the `NOT`.

## sql-basic-009
topic: select-filter
answer: C

Table `contacts`:

| id | email |
| --- | --- |
| 1 | asha@mail.com |
| 2 | ravi@gmail.com |
| 3 | meera@mail.org |
| 4 | kabir@mail |
| 5 | tara@mailbox.com |

```sql
SELECT id
FROM contacts
WHERE email LIKE '%@mail.%'
ORDER BY id;
```

Which `id` values does it return?

- A: `1, 3, 4, 5`
- B: `1, 2, 3`
- C: `1, 3`
- D: `1, 2, 3, 4, 5`

> Only `%` and `_` are wildcards in `LIKE`; `@` and `.` are matched literally.
> The value must contain the exact text `@mail.` somewhere. Rows 1 and 3 do.
> Row 2 has a `g` between `@` and `mail`, row 4 has no dot after `mail`, and
> row 5 continues with `box`. `1, 3, 4, 5` is what `'%@mail%'` would return.

## sql-basic-010
topic: select-filter
answer: A

Table `orders`:

| id | amount |
| --- | --- |
| 1 | 120 |
| 2 | 300 |
| 3 | 480 |
| 4 | 600 |

```sql
SELECT id FROM orders WHERE amount BETWEEN 500 AND 100;
```

How many rows does it return in MySQL 8 and PostgreSQL?

- A: `0 rows`
- B: `1 row`
- C: `3 rows`
- D: It fails with an error.

> `x BETWEEN a AND b` means `x >= a AND x <= b`, in that order. With the larger
> bound first no value can be both at least 500 and at most 100, so nothing
> matches, and neither database swaps the bounds for you or raises an error.
> `BETWEEN 100 AND 500` would return the 3 rows 1, 2 and 3.

## sql-basic-011
topic: select-filter
answer: D

Table `products`:

| id | name | price |
| --- | --- | --- |
| 1 | Pen | 20 |
| 2 | Lamp | 900 |
| 3 | Bag | 650 |
| 4 | Mug | 150 |

Which query returns the names of the two most expensive products, and runs on both MySQL 8 and PostgreSQL?

- A: `SELECT name FROM products ORDER BY price LIMIT 2`
- B: `SELECT name FROM products LIMIT 2 ORDER BY price DESC`
- C: `SELECT TOP 2 name FROM products ORDER BY price DESC`
- D: `SELECT name FROM products ORDER BY price DESC LIMIT 2`

> Sort from highest price down, then keep the first two rows: Lamp and Bag.
> `LIMIT` must come after `ORDER BY`, so B is a syntax error; `TOP` is SQL
> Server syntax that neither database accepts; and A sorts ascending, returning
> the two cheapest products.

## sql-basic-012
topic: select-filter
answer: B, D

Table `items`:

| id | qty |
| --- | --- |
| 1 | 5 |
| 2 | 10 |
| 3 | 15 |
| 4 | 20 |

Each option is the `WHERE` clause of `SELECT id FROM items`. Select all that apply: which make the query return exactly the ids 2 and 3?

- A: `WHERE qty > 10 AND qty < 15`
- B: `WHERE qty BETWEEN 10 AND 15`
- C: `WHERE qty >= 10 OR qty <= 15`
- D: `WHERE qty IN (10, 15)`

> `BETWEEN 10 AND 15` is inclusive, so it keeps 10 and 15 (ids 2 and 3), and
> `IN (10, 15)` matches those two values exactly. The strict comparisons in A
> exclude both 10 and 15, so A returns nothing. C uses `OR`: every number is
> either at least 10 or at most 15, so C returns all four rows.

## sql-basic-013
topic: select-filter
answer: C

Table `order_lines`:

| id | qty | unit_price |
| --- | --- | --- |
| 1 | 2 | 50 |
| 2 | 5 | 30 |
| 3 | 1 | 200 |
| 4 | 4 | 25 |

```sql
SELECT id, qty * unit_price AS total
FROM order_lines
WHERE total >= 150;
```

What happens in MySQL 8 and PostgreSQL?

- A: `(2, 150), (3, 200)`
- B: `(3, 200)`
- C: It fails with an error: `total` is not visible in the `WHERE` clause.
- D: It returns no rows, because `total` is still NULL when `WHERE` runs.

> `WHERE` is evaluated before the `SELECT` list, so an alias defined in the
> `SELECT` list does not exist there yet. Both databases reject the query
> (MySQL: unknown column 'total' in 'where clause'; PostgreSQL: column "total"
> does not exist). Repeating the expression, `WHERE qty * unit_price >= 150`,
> would return `(2, 150), (3, 200)`.

## sql-basic-014
topic: select-filter
answer: B

Table `order_lines`:

| id | qty | unit_price |
| --- | --- | --- |
| 1 | 2 | 50 |
| 2 | 5 | 30 |
| 3 | 1 | 200 |
| 4 | 4 | 25 |

```sql
SELECT id, qty * unit_price AS total
FROM order_lines
ORDER BY total DESC, id;
```

In what order are the `id` values returned?

- A: `3, 2, 4, 1`
- B: `3, 2, 1, 4`
- C: `1, 4, 2, 3`
- D: `1, 2, 3, 4`

> Unlike `WHERE`, `ORDER BY` runs after the `SELECT` list and may use its
> aliases. The totals are 100, 150, 200 and 100. Sorted descending: 200 (id 3),
> 150 (id 2), then the tie at 100 is broken by `id` ascending, giving 1 before 4.

## sql-basic-015
topic: select-filter
answer: A

Table `sales`:

| id | region | amount |
| --- | --- | --- |
| 1 | north | 300 |
| 2 | south | 500 |
| 3 | north | 200 |
| 4 | east | 500 |
| 5 | west | 100 |

```sql
SELECT DISTINCT amount
FROM sales
ORDER BY amount DESC
LIMIT 2;
```

What does the query return?

- A: `500, 300`
- B: `500, 500`
- C: `100, 200`
- D: `500`

> Duplicates are removed before the rows are limited: the distinct amounts are
> 500, 300, 200 and 100, sorted descending, and the first two are kept.
> Without `DISTINCT` the answer would be `500, 500`; limiting first and then
> removing duplicates would leave only `500`, but that is not the order SQL uses.

## sql-basic-016
topic: select-filter
answer: D

Table `products`:

| id | code |
| --- | --- |
| 1 | ab-100 |
| 2 | ab-200 |
| 3 | xab-300 |
| 4 | ab |
| 5 | cd-100 |

```sql
SELECT id
FROM products
WHERE code NOT LIKE 'ab%'
ORDER BY id;
```

Which `id` values does it return?

- A: `3, 4, 5`
- B: `5`
- C: `1, 2, 4`
- D: `3, 5`

> `'ab%'` matches values that start with "ab"; `%` matches any number of
> characters, including none, so `ab` itself (row 4) matches. Rows 1, 2 and 4
> match and `NOT LIKE` returns the rest: 3 and 5. `xab-300` contains "ab" but
> does not start with it.

## sql-basic-017
topic: set-operations
answer: B

Table `team_a`:

| name |
| --- |
| Asha |
| Ravi |
| Meera |

Table `team_b`:

| name |
| --- |
| Ravi |
| Kabir |
| Meera |
| Tara |

```sql
-- Query 1
SELECT name FROM team_a UNION SELECT name FROM team_b;
-- Query 2
SELECT name FROM team_a UNION ALL SELECT name FROM team_b;
```

How many rows do query 1 and query 2 return?

- A: `7 and 5`
- B: `5 and 7`
- C: `2 and 7`
- D: `5 and 5`

> `UNION` removes duplicate rows from the combined result: Ravi and Meera are in
> both tables, so there are 5 distinct names. `UNION ALL` keeps every row,
> 3 + 4 = 7. Two rows would be the names common to both, which is an
> intersection, not a union.

## sql-basic-018
topic: set-operations
answer: C

Table `a`:

| x |
| --- |
| 1 |
| 1 |
| 2 |

Table `b`:

| x |
| --- |
| 2 |
| 3 |

```sql
SELECT x FROM a
UNION
SELECT x FROM b;
```

How many rows does it return?

- A: `5 rows`
- B: `4 rows`
- C: `3 rows`
- D: `1 row`

> `UNION` returns the distinct rows of the whole result. That removes the 2
> shared between the tables and also the duplicate 1 inside table `a`, leaving
> 1, 2 and 3. `UNION ALL` would return 5 rows; removing only the duplicates
> shared between the two inputs would give 4.

## sql-basic-019
topic: set-operations
answer: D

Table `customers` has columns `id` and `name`; table `suppliers` has columns `id` and `company`.

```sql
SELECT id, name FROM customers
UNION
SELECT id FROM suppliers;
```

What happens in MySQL 8 and PostgreSQL?

- A: It returns the customers, plus each supplier with NULL as its `name`.
- B: It returns one `id` column holding every customer and supplier id.
- C: It returns only the customer rows, since the second SELECT does not fit.
- D: It fails: the two SELECTs return different numbers of columns.

> Every SELECT in a `UNION` must return the same number of columns (with
> compatible types). Two columns against one is an error in both databases;
> nothing is padded with NULL. Add a column to the second SELECT (for example
> `SELECT id, company FROM suppliers`) to make it valid.

## sql-basic-020
topic: set-operations
answer: B

Table `customers` has a column `name`; table `suppliers` has a column `company`. Both are text columns.

```sql
SELECT name AS contact FROM customers
UNION ALL
SELECT company FROM suppliers;
```

What is the result column called?

- A: `company`
- B: `contact`
- C: `name`
- D: The query fails, because the column names do not match.

> A set operation takes its column names from the first SELECT, including any
> alias it gives: here `contact`. The SELECTs only have to agree on the number
> of columns and compatible types; their column names may differ.

## sql-basic-021
topic: set-operations
answer: A

Table `north`:

| city | sales |
| --- | --- |
| Pune | 40 |
| Agra | 90 |

Table `south`:

| city | sales |
| --- | --- |
| Kochi | 70 |
| Madurai | 20 |

```sql
SELECT city, sales FROM north
UNION ALL
SELECT city, sales FROM south
ORDER BY sales DESC;
```

In what order are the cities returned?

- A: `Agra, Kochi, Pune, Madurai`
- B: `Agra, Pune, Kochi, Madurai`
- C: `Madurai, Pune, Kochi, Agra`
- D: It fails: each SELECT needs its own ORDER BY.

> An `ORDER BY` after the last SELECT sorts the whole combined result, not just
> the last SELECT. All four rows are sorted by sales descending: Agra 90,
> Kochi 70, Pune 40, Madurai 20. Option B sorts each table separately.

## sql-basic-022
topic: set-operations
answer: B

Table `a`:

| x |
| --- |
| 1 |
| NULL |

Table `b`:

| x |
| --- |
| NULL |
| 2 |

```sql
SELECT x FROM a
UNION
SELECT x FROM b;
```

How many rows does it return?

- A: `2 rows`
- B: `3 rows`
- C: `4 rows`
- D: It fails with an error, because NULL cannot be compared.

> When `UNION` (like `DISTINCT`) removes duplicates, two NULLs count as the
> same value, so the two NULL rows collapse into one: the result is 1, NULL
> and 2. NULLs are not dropped (that would be 2 rows), and they are not kept
> apart as if unequal (that would be 4).

## sql-basic-023
topic: set-operations
answer: C, E

Table `t1`:

| n |
| --- |
| 1 |
| 2 |
| 2 |

Table `t2`:

| n |
| --- |
| 2 |
| 3 |

Select all that apply: which of these queries return exactly 4 rows?

- A: `SELECT n FROM t1 UNION SELECT n FROM t2`
- B: `SELECT n FROM t1 UNION ALL SELECT n FROM t2`
- C: `SELECT DISTINCT n FROM t1 UNION ALL SELECT n FROM t2`
- D: `SELECT n FROM t1 UNION ALL SELECT DISTINCT n FROM t2`
- E: `SELECT n FROM t1 UNION ALL SELECT n FROM t2 WHERE n > 2`

> A: `UNION` removes all duplicates, giving 1, 2, 3 (3 rows). B: all 5 rows.
> C: `DISTINCT` applies to the first SELECT only, giving 1, 2, and `UNION ALL`
> adds 2, 3: 4 rows. D: 3 rows from `t1` plus the 2 distinct rows of `t2`: 5.
> E: the `WHERE` belongs to the second SELECT only, so `t2` contributes just 3,
> and the three `t1` rows make 4.

## sql-basic-024
topic: normalization
answer: A

Table `students`:

| id | name | phones |
| --- | --- | --- |
| 1 | Asha | 9820011111, 9820022222 |
| 2 | Ravi | 9930033333 |

The `phones` column stores every phone number of a student as one comma-separated list. Which is the lowest normal form this design fails?

- A: First normal form (1NF)
- B: Second normal form (2NF)
- C: Third normal form (3NF)
- D: Boyce-Codd normal form (BCNF)

> 1NF requires every column value to be atomic, a single value. A list packed
> into one cell is not: you cannot look up, index or constrain one phone number
> without parsing the text. Every higher normal form assumes 1NF, so 1NF is the
> first one it fails. The fix is a separate table with one row per phone number.

## sql-basic-025
topic: normalization
answer: C

Table `order_items`, whose primary key is (`order_id`, `product_id`):

| order_id | product_id | quantity | product_name |
| --- | --- | --- | --- |
| 1 | 10 | 2 | Pen |
| 1 | 11 | 1 | Ink |
| 2 | 10 | 5 | Pen |

The table is in 1NF. Which column keeps it out of 2NF?

- A: `quantity`
- B: `quantity` and `product_name`
- C: `product_name`
- D: None: the table is already in 2NF.

> 2NF requires every non-key column to depend on the whole primary key.
> `product_name` depends on `product_id` alone (product 10 is "Pen" in every
> order), which is a partial dependency. `quantity` needs both parts of the key:
> it is how many of that product are in that order.
