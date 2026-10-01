---
skill: sql
level: basic
---

## sql-basic-051
topic: aggregation
answer: A

Table `employees`:

| id | dept | bonus |
| --- | --- | --- |
| 1 | Sales | 500 |
| 2 | Sales | NULL |
| 3 | HR | 500 |
| 4 | HR | 300 |
| 5 | IT | NULL |

```sql
SELECT COUNT(*), COUNT(bonus), COUNT(DISTINCT bonus)
FROM employees;
```

What does the query return?

- A: `5, 3, 2`
- B: `5, 5, 3`
- C: `5, 3, 3`
- D: `3, 3, 2`

> `COUNT(*)` counts rows, NULLs included: 5. `COUNT(bonus)` counts only non-NULL
> values: 500, 500, 300, so 3. `COUNT(DISTINCT bonus)` counts the distinct
> non-NULL values, 500 and 300: 2. NULL is never counted as a value by
> `COUNT(column)`, with or without `DISTINCT`.

## sql-basic-052
topic: aggregation
answer: D

Table `orders`:

| id | city | amount |
| --- | --- | --- |
| 1 | Pune | 100 |
| 2 | Delhi | 250 |
| 3 | Pune | 300 |
| 4 | Agra | 50 |
| 5 | Delhi | 150 |

```sql
SELECT city, SUM(amount)
FROM orders
GROUP BY city
ORDER BY city;
```

What does the query return?

- A: `('Agra', 1), ('Delhi', 2), ('Pune', 2)`
- B: `('Agra', 50), ('Delhi', 250), ('Pune', 300)`
- C: `('Agra', 850), ('Delhi', 850), ('Pune', 850)`
- D: `('Agra', 50), ('Delhi', 400), ('Pune', 400)`

> `GROUP BY city` makes one output row per city, and `SUM(amount)` adds the
> amounts inside each group: Agra 50, Delhi 250 + 150 = 400, Pune
> 100 + 300 = 400. Option A shows counts, B the largest amount per city, and C
> the total of the whole table.

## sql-basic-053
topic: aggregation
answer: C

Table `orders`:

| id | city | amount |
| --- | --- | --- |
| 1 | Pune | 100 |
| 2 | Delhi | 400 |
| 3 | Pune | 250 |
| 4 | Agra | 300 |
| 5 | Delhi | 50 |
| 6 | Pune | 80 |

```sql
SELECT city, COUNT(*)
FROM orders
WHERE amount > 90
GROUP BY city
HAVING COUNT(*) >= 2;
```

What does the query return?

- A: `('Pune', 3)`
- B: `('Delhi', 2), ('Pune', 3)`
- C: `('Pune', 2)`
- D: `('Agra', 1), ('Delhi', 1), ('Pune', 2)`

> `WHERE` filters rows before grouping: orders 5 (50) and 6 (80) are removed.
> The remaining rows group into Pune 2, Delhi 1 and Agra 1. `HAVING` then
> filters the groups, keeping only Pune with 2. Option B ignores the `WHERE`,
> and D ignores the `HAVING`.

## sql-basic-054
topic: aggregation
answer: B

Table `employees` has columns `id`, `name` and `dept`.

```sql
SELECT dept, COUNT(*)
FROM employees
WHERE COUNT(*) > 2
GROUP BY dept;
```

What happens in MySQL 8 and PostgreSQL?

- A: It returns the departments that have more than two employees.
- B: It fails with an error: an aggregate cannot appear in `WHERE`.
- C: It returns every department, with its number of employees.
- D: It returns no rows, because `COUNT(*)` is 0 while `WHERE` runs.

> `WHERE` filters individual rows before any groups exist, so there is nothing
> for `COUNT(*)` to count there, and both databases reject the query. A
> condition on an aggregate belongs in `HAVING`, which runs after grouping:
> `GROUP BY dept HAVING COUNT(*) > 2`.

## sql-basic-055
topic: aggregation
answer: D

Table `employees`:

| id | dept | salary |
| --- | --- | --- |
| 1 | Sales | 40000 |
| 2 | Sales | 70000 |
| 3 | HR | 52000 |
| 4 | HR | 46000 |
| 5 | IT | 60000 |
| 6 | IT | 50000 |

```sql
SELECT dept
FROM employees
GROUP BY dept
HAVING AVG(salary) > 50000
ORDER BY dept;
```

What does the query return?

- A: `HR, IT, Sales`
- B: `Sales`
- C: `HR`
- D: `IT, Sales`

> `HAVING` tests each group's average: Sales (40000 + 70000) / 2 = 55000, HR
> (52000 + 46000) / 2 = 49000, IT (60000 + 50000) / 2 = 55000. Sales and IT pass.
> Option A is every department with at least one salary above 50000, which is
> what a row-level test would give.

## sql-basic-056
topic: aggregation
answer: A

Table `orders`:

| id | amount |
| --- | --- |
| 1 | 120 |
| 2 | 340 |
| 3 | 75 |

```sql
SELECT COUNT(*) FROM orders WHERE amount > 1000;
```

What does the query return?

- A: One row containing `0`.
- B: No rows.
- C: One row containing `NULL`.
- D: It fails with an error, because no row matches.

> An aggregate without `GROUP BY` always returns exactly one row, even when no
> input row survives the `WHERE`. For `COUNT` that row holds 0; it is the other
> aggregates, such as `SUM` and `MAX`, that return NULL over no rows.

## sql-basic-057
topic: aggregation
answer: A, C

Table `orders`:

| id | city | amount |
| --- | --- | --- |
| 1 | Pune | 100 |
| 2 | Delhi | 200 |
| 3 | Pune | 300 |
| 4 | Agra | 400 |
| 5 | Delhi | 500 |

Select all that apply: which of these queries return exactly one row?

- A: `SELECT COUNT(*) FROM orders`
- B: `SELECT city, COUNT(*) FROM orders GROUP BY city`
- C: `SELECT MAX(amount) FROM orders WHERE amount > 1000`
- D: `SELECT city FROM orders GROUP BY city HAVING COUNT(*) > 1`

> A: an aggregate without `GROUP BY` returns one row (5). B: one row per city,
> 3 rows. C: no order is over 1000, but an aggregate without `GROUP BY` still
> returns one row, holding NULL. D: Pune and Delhi each have two orders, so
> 2 rows.

## sql-basic-058
topic: aggregation
answer: D

Table `employees`:

| id | dept | salary |
| --- | --- | --- |
| 1 | Sales | 40000 |
| 2 | Sales | 70000 |
| 3 | Sales | 55000 |
| 4 | HR | 45000 |

```sql
SELECT dept, MIN(salary), MAX(salary)
FROM employees
GROUP BY dept
ORDER BY dept;
```

What does the query return?

- A: `('HR', 40000, 70000), ('Sales', 40000, 70000)`
- B: `('Sales', 40000, 70000)`
- C: `('HR', NULL, 45000), ('Sales', 40000, 70000)`
- D: `('HR', 45000, 45000), ('Sales', 40000, 70000)`

> `MIN` and `MAX` are computed within each group. HR's group has a single
> salary, which is both its minimum and its maximum: 45000. A one-row group is
> still a group, so HR is not dropped. Option A takes the minimum and maximum
> of the whole table.

## sql-basic-059
topic: aggregation
answer: B

Table `visits`:

| id | page | user_id |
| --- | --- | --- |
| 1 | home | 7 |
| 2 | home | 7 |
| 3 | home | 9 |
| 4 | cart | 7 |
| 5 | cart | 8 |
| 6 | cart | 9 |

```sql
SELECT page, COUNT(DISTINCT user_id)
FROM visits
GROUP BY page
ORDER BY page;
```

What does the query return?

- A: `('cart', 3), ('home', 3)`
- B: `('cart', 3), ('home', 2)`
- C: `('cart', 1), ('home', 1)`

> Within each page, `COUNT(DISTINCT user_id)` counts different users: cart was
> visited by users 7, 8 and 9 (3), home by 7 and 9 (2; user 7's second visit is
> not counted again). `COUNT(*)` would give 3 for both pages.

## sql-basic-060
topic: aggregation
answer: C

Table `sales`:

| id | region | sale_year |
| --- | --- | --- |
| 1 | north | 2023 |
| 2 | north | 2024 |
| 3 | north | 2023 |
| 4 | south | 2023 |
| 5 | south | 2023 |
| 6 | east | 2024 |

```sql
SELECT region, sale_year, COUNT(*)
FROM sales
GROUP BY region, sale_year;
```

How many rows does it return?

- A: `2 rows`
- B: `3 rows`
- C: `4 rows`
- D: `6 rows`

> Grouping by two columns makes one group per distinct combination:
> (north, 2023), (north, 2024), (south, 2023) and (east, 2024). That is 4 rows.
> Grouping by region alone would give 3 and by year alone 2.

## sql-basic-061
topic: aggregation
answer: A

Table `orders`:

| id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 300 |
| 2 | 2 | 150 |
| 3 | 1 | 250 |
| 4 | 3 | 500 |
| 5 | 2 | 200 |
| 6 | 4 | 100 |

```sql
SELECT customer_id
FROM orders
GROUP BY customer_id
HAVING SUM(amount) >= 350
ORDER BY customer_id;
```

Which `customer_id` values does it return?

- A: `1, 2, 3`
- B: `1, 3`
- C: `3`
- D: `1, 2, 3, 4`

> The totals per customer are 1: 550, 2: 350, 3: 500, 4: 100. `HAVING` keeps the
> groups whose total is at least 350, and `>=` includes customer 2's exactly
> 350. Option C tests single orders (only order 4 is at least 350) instead of
> each customer's total.

## sql-basic-062
topic: aggregation
answer: C

Table `order_lines`:

| id | order_id | qty | price |
| --- | --- | --- | --- |
| 1 | 100 | 2 | 50 |
| 2 | 100 | 1 | 30 |
| 3 | 101 | 3 | 20 |

```sql
SELECT order_id, SUM(qty * price)
FROM order_lines
GROUP BY order_id
ORDER BY order_id;
```

What does the query return?

- A: `(100, 240), (101, 60)`
- B: `(100, 3), (101, 3)`
- C: `(100, 130), (101, 60)`
- D: `(100, 80), (101, 20)`

> The expression is computed for each row first and the results are summed per
> order: order 100 is 2 × 50 + 1 × 30 = 130, order 101 is 3 × 20 = 60. Option A
> multiplies the sums instead, (2 + 1) × (50 + 30) = 240, which is a different
> calculation.

## sql-basic-063
topic: aggregation
answer: B

Table `scores`:

| id | points |
| --- | --- |
| 1 | 7 |
| 2 | 8 |
| 3 | 9 |
| 4 | 10 |

`points` is an integer column.

```sql
SELECT AVG(points) FROM scores;
```

Ignoring how many decimal places are displayed, what value does it return in MySQL 8 and PostgreSQL?

- A: `8`
- B: `8.5`
- C: `9`
- D: `34`

> `AVG` of an integer column returns an exact decimal result in both databases,
> not an integer: 34 / 4 = 8.5 (MySQL shows `8.5000`, PostgreSQL
> `8.5000000000000000`). The fraction is neither truncated to 8 nor rounded to 9;
> 34 is the `SUM`.

## sql-basic-064
topic: aggregation
answer: D

Table `orders`:

| id | customer | amount |
| --- | --- | --- |
| 1 | Asha | 300 |
| 2 | Ravi | 500 |
| 3 | Asha | 400 |
| 4 | Meera | 200 |
| 5 | Ravi | 100 |

```sql
SELECT customer, SUM(amount) AS total
FROM orders
GROUP BY customer
ORDER BY total DESC
LIMIT 1;
```

What does the query return?

- A: `('Ravi', 500)`
- B: `('Meera', 200)`
- C: `('Ravi', 600)`
- D: `('Asha', 700)`

> Grouping gives the totals Asha 700, Ravi 600 and Meera 200. Sorting by the
> total descending and keeping one row returns Asha. Ravi has the largest single
> order (500), but the query ranks customers by their sum, not by any one order.

## sql-basic-065
topic: aggregation
answer: C

Table `employees`:

| id | name | salary |
| --- | --- | --- |
| 1 | Asha | 50000 |
| 2 | Ravi | 70000 |
| 3 | Meera | 70000 |
| 4 | Kabir | 60000 |
| 5 | Tara | 40000 |

```sql
SELECT MAX(salary)
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

What value does it return?

- A: `40000`
- B: `50000`
- C: `60000`
- D: `70000`

> The inner query returns the top salary, 70000. `WHERE salary < 70000` removes
> both rows that earn 70000, leaving 50000, 60000 and 40000, and their maximum
> is 60000: the second-highest distinct salary. Taking "the second row" of a
> sorted list would give 70000 again because of the tie.

## sql-basic-066
topic: aggregation
answer: A

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

```sql
SELECT c.name, COUNT(o.id)
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;
```

What does the query return?

- A: `('Asha', 2), ('Ravi', 0), ('Meera', 1)`
- B: `('Asha', 2), ('Ravi', 1), ('Meera', 1)`
- C: `('Asha', 2), ('Meera', 1)`
- D: `('Asha', 2), ('Ravi', NULL), ('Meera', 1)`

> The left join keeps Ravi as one row whose `o.id` is NULL. `COUNT(o.id)` skips
> NULLs, so his group counts 0, and `COUNT` never returns NULL. `COUNT(*)` would
> count that row and report 1 for Ravi (option B), which is why counting a
> right-hand column is the usual way to count matches in a left join.

## sql-basic-067
topic: nulls
answer: A

Table `employees`:

| id | name | manager_id |
| --- | --- | --- |
| 1 | Asha | NULL |
| 2 | Ravi | 1 |
| 3 | Meera | NULL |
| 4 | Kabir | 2 |

```sql
-- Query 1
SELECT name FROM employees WHERE manager_id = NULL;
-- Query 2
SELECT name FROM employees WHERE manager_id <> NULL;
```

How many rows do query 1 and query 2 return?

- A: `0 and 0`
- B: `2 and 2`
- C: `2 and 0`
- D: `0 and 2`

> Any comparison with NULL using `=` or `<>` gives unknown, never true, and
> `WHERE` keeps only rows where the condition is true. So both queries return
> nothing, for every row, NULL or not. `IS NULL` and `IS NOT NULL` are the tests
> that would return 2 rows each.

## sql-basic-068
topic: nulls
answer: D

Table `tasks`:

| id | status |
| --- | --- |
| 1 | done |
| 2 | NULL |
| 3 | open |
| 4 | open |
| 5 | NULL |

```sql
SELECT id
FROM tasks
WHERE status <> 'done'
ORDER BY id;
```

Which `id` values does it return?

- A: `2, 3, 4, 5`
- B: `1`
- C: `2, 5`
- D: `3, 4`

> For rows 2 and 5, `NULL <> 'done'` is unknown, not true, so `WHERE` drops them
> along with row 1. Only 3 and 4 remain. To include the NULL rows you have to
> ask for them: `WHERE status <> 'done' OR status IS NULL`.

## sql-basic-069
topic: nulls
answer: B

Table `products`:

| id | discount |
| --- | --- |
| 1 | 10 |
| 2 | NULL |
| 3 | 0 |
| 4 | NULL |
| 5 | 25 |

```sql
SELECT id
FROM products
WHERE NOT (discount > 5)
ORDER BY id;
```

Which `id` values does it return?

- A: `2, 3, 4`
- B: `3`
- C: `1, 5`
- D: `2, 4`

> For rows 2 and 4, `discount > 5` is unknown, and `NOT` unknown is still
> unknown, so those rows are not kept. Row 3 (0 > 5 is false, so `NOT` makes it
> true) is the only match. Option A assumes NULL counts as "not greater than 5";
> option C is the condition without `NOT`.

## sql-basic-070
topic: nulls
answer: C

Table `contacts` (`mobile` and `landline` are text columns):

| id | mobile | landline |
| --- | --- | --- |
| 1 | 98200 | 2201 |
| 2 | NULL | 2202 |
| 3 | NULL | NULL |

```sql
SELECT id, COALESCE(mobile, landline, 'none')
FROM contacts
ORDER BY id;
```

What does the query return?

- A: `(1, '2201'), (2, '2202'), (3, 'none')`
- B: `(1, '98200'), (2, NULL), (3, 'none')`
- C: `(1, '98200'), (2, '2202'), (3, 'none')`
- D: `(1, '98200'), (2, '2202'), (3, NULL)`

> `COALESCE` returns its first argument that is not NULL, reading left to right.
> Row 1 has a mobile, so the landline is never looked at. Row 2 falls through to
> its landline. Row 3 has neither, so it gets the literal `'none'`.

## sql-basic-071
topic: nulls
answer: D

Table `ratings`:

| id | stars |
| --- | --- |
| 1 | 4 |
| 2 | NULL |
| 3 | 2 |
| 4 | NULL |
| 5 | 3 |

```sql
SELECT AVG(stars) FROM ratings;
```

Ignoring how many decimal places are displayed, what value does it return?

- A: `NULL`
- B: `1.8`
- C: `9`
- D: `3`

> `AVG` ignores NULLs entirely: it averages the three non-NULL values,
> (4 + 2 + 3) / 3 = 3. It does not count the NULL rows as zeros (that would be
> 9 / 5 = 1.8, which `AVG(COALESCE(stars, 0))` returns), and a NULL input does
> not make the whole result NULL.

## sql-basic-072
topic: nulls
answer: A

Table `order_lines`:

| id | price | tax |
| --- | --- | --- |
| 1 | 100 | 18 |
| 2 | 200 | NULL |
| 3 | 50 | 9 |

```sql
SELECT SUM(price + tax) FROM order_lines;
```

What value does it return?

- A: `177`
- B: `377`
- C: `NULL`

> `price + tax` is computed per row first: 118, NULL (any arithmetic with NULL
> is NULL) and 59. `SUM` then skips the NULL and adds the rest: 177. Getting 377
> would need the missing tax treated as 0, as in `SUM(price + COALESCE(tax, 0))`;
> a NULL input never turns `SUM` itself into NULL.

## sql-basic-073
topic: nulls
answer: B

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
| 11 | NULL |

```sql
SELECT name
FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);
```

What does the query return?

- A: `Ravi, Meera`
- B: No rows.
- C: `Asha`
- D: It fails with an error: the subquery returns a NULL.

> `id NOT IN (1, NULL)` means `id <> 1 AND id <> NULL`. The second part is
> unknown for every id, so the whole condition is never true: for Ravi and Meera
> it is unknown, and for Asha it is false. No rows come back. `NOT EXISTS`, or
> filtering the NULLs out of the subquery, returns Ravi and Meera.

## sql-basic-074
topic: nulls
answer: B

Table `employees`:

| id | dept |
| --- | --- |
| 1 | Sales |
| 2 | NULL |
| 3 | HR |
| 4 | NULL |
| 5 | Sales |

```sql
SELECT dept, COUNT(*)
FROM employees
GROUP BY dept;
```

How many rows does it return?

- A: `2 rows`
- B: `3 rows`
- C: `4 rows`
- D: `5 rows`

> `GROUP BY` puts all NULLs into one group, so the groups are Sales (2), HR (1)
> and NULL (2): 3 rows. The NULL rows are neither dropped (2 rows) nor kept as
> separate groups of one (4 rows).

## sql-basic-075
topic: nulls
answer: C

Table `customers`:

| id | city |
| --- | --- |
| 1 | Pune |
| 2 | NULL |
| 3 | Delhi |
| 4 | NULL |
| 5 | Pune |

```sql
-- Query 1
SELECT DISTINCT city FROM customers;
-- Query 2
SELECT COUNT(DISTINCT city) FROM customers;
```

How many rows does query 1 return, and what number does query 2 return?

- A: 2 rows, and the number 2
- B: 3 rows, and the number 3
- C: 3 rows, and the number 2
- D: 4 rows, and the number 2

> `DISTINCT` keeps one copy of each value and treats all NULLs as one value, so
> query 1 returns Pune, Delhi and a single NULL row: 3 rows. `COUNT(DISTINCT city)`
> counts only non-NULL values, so query 2 counts Pune and Delhi: 2.
