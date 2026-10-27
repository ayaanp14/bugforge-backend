---
title: UPDATE — changing rows
minutes: 14
seo-title: SQL UPDATE Statement: SET, WHERE, CASE and Joins in MySQL
description: UPDATE changes values in the rows a WHERE clause picks: computing from old values, CASE for several rules at once, values from another table and safe habits.
question: How do you update data in SQL?
answer: Use `UPDATE table SET col = value WHERE condition;`. SET can assign several columns and use the row's current values, as in `price = price * 1.1`; WHERE picks which rows change, and without it every row in the table is updated. Values can come from a CASE expression or from a subquery on another table, and MySQL also allows UPDATE with a JOIN.
q: What happens if you run UPDATE without a WHERE clause?
a: Every row in the table is changed. There is no confirmation and, under autocommit, no undo. Before running an UPDATE, run the same WHERE as a SELECT to see the rows it touches, or do the work inside a transaction so a mistake can be rolled back. MySQL's `sql_safe_updates` option refuses keyless updates.
q: How do you update a table using values from another table in MySQL?
a: MySQL allows a multi-table UPDATE: `UPDATE products p JOIN price_changes c ON c.sku = p.sku SET p.price = c.new_price;`. The portable form is a correlated subquery in SET with a matching WHERE, and PostgreSQL writes `UPDATE products SET price = c.new_price FROM price_changes c WHERE c.sku = products.sku`.
q: Can one UPDATE apply different changes to different rows?
a: Yes, with a CASE expression in SET: `SET price = CASE WHEN category = 'books' THEN price * 1.1 WHEN category = 'toys' THEN price - 5 ELSE price END`. Keep the ELSE that returns the current value, or rows that match no branch become NULL, and restrict the WHERE to the rows any branch should change.
q: Does MySQL evaluate UPDATE SET assignments left to right?
a: Yes, and this differs from standard SQL. In a single-table MySQL UPDATE, a later assignment sees the value an earlier one just wrote, so `SET a = a + 1, b = a` gives b the new a. PostgreSQL and SQLite evaluate every right-hand side against the old row, so b gets the old a.
---
`UPDATE` changes values in rows that already exist. It is the statement with the largest blast radius in everyday SQL: one missing line turns "fix this customer's email" into "every customer now has this email". This lesson covers the shape of an UPDATE, how SET can compute from the row's own values, `CASE` for several rules in one pass, taking new values from another table (portable subqueries, MySQL's multi-table UPDATE and PostgreSQL's `UPDATE ... FROM`), and the habits that keep updates safe.

## SET and WHERE

```sql
UPDATE customers
SET email = 'ada@example.com',
    updated_on = '2024-05-02'
WHERE id = 17;
```

`SET` lists one or more `column = expression` pairs separated by commas; `WHERE` chooses the rows. Every row the WHERE matches gets every assignment; rows it does not match are untouched. The WHERE is the same clause you know from SELECT — comparisons, `IN`, `BETWEEN`, `LIKE`, subqueries, `IS NULL` — and it obeys the same three-valued logic, so a row where the condition is NULL is **not** updated.

Leave the WHERE out and the UPDATE applies to every row:

```sql
UPDATE customers SET email = 'ada@example.com';   -- every customer. Oops.
```

There is no "are you sure?". Two habits prevent this. First, write the WHERE as a SELECT, run it, look at the rows, then turn it into the UPDATE. Second, for anything that matters, run it inside a transaction (`START TRANSACTION; UPDATE ...; SELECT ...;` then `COMMIT` or `ROLLBACK`). MySQL's client has a `--safe-updates` mode (`SET sql_safe_updates = 1`) that refuses an UPDATE or DELETE whose WHERE does not use a key.

## Computing from the old value

The right-hand side of an assignment is an expression evaluated per row, and it can read the row's current values:

```sql
UPDATE products SET price = ROUND(price * 1.10, 2) WHERE category = 'books';
UPDATE accounts SET balance = balance - 250 WHERE id = 1;
UPDATE users SET login_count = login_count + 1, last_login = '2024-05-02' WHERE id = 9;
```

`balance = balance - 250` is a single atomic read-modify-write inside the database; doing the same with a SELECT in the application followed by an UPDATE with the computed number is a classic lost-update bug when two requests race.

One MySQL quirk is an interview favourite. In a single-table UPDATE, MySQL evaluates assignments **left to right**, and later ones see earlier results:

```sql
-- a = 1, b = 0 before
UPDATE t SET a = a + 1, b = a;
-- MySQL:            a = 2, b = 2
-- PostgreSQL/SQLite: a = 2, b = 1   (standard: every right side reads the old row)
```

Do not write code that depends on either behaviour; if you need the old value, compute both sides from the original columns.

## Several rules in one pass with CASE

When different rows need different changes, a `CASE` expression in SET does it in one statement and one scan:

```sql
UPDATE products
SET price = CASE
              WHEN category = 'books' THEN ROUND(price * 1.10, 2)
              WHEN category = 'toys'  THEN price - 5
              ELSE price
            END
WHERE category IN ('books', 'toys');
```

The `ELSE price` matters: a CASE with no matching branch and no ELSE returns NULL, and the column would become NULL. The WHERE restricts the statement to rows that some branch changes, so the others are not even rewritten. Running two separate UPDATEs would also work, but if the rules can overlap (a row in both sets) the order of the statements silently changes the result; one CASE states the rule once.

## Values from another table

Often the new values live in another table — a price list from a supplier, corrections from a spreadsheet loaded into a staging table. The portable way is a **correlated subquery** in SET plus a WHERE that limits the update to rows with a match:

```sql
UPDATE products
SET price = (SELECT c.new_price FROM price_changes c WHERE c.sku = products.sku)
WHERE sku IN (SELECT sku FROM price_changes);
```

Without the WHERE, every product with no row in `price_changes` would get NULL from the subquery. The subquery must return at most one row per product, or the statement fails ("Subquery returns more than 1 row").

MySQL also has a **multi-table UPDATE** that joins directly:

```sql
UPDATE products p
JOIN price_changes c ON c.sku = p.sku
SET p.price = c.new_price,
    p.updated = 1;
```

Only rows with a match are touched, which is what the WHERE did above. PostgreSQL spells the same thing `UPDATE products SET price = c.new_price FROM price_changes c WHERE c.sku = products.sku;`. A related MySQL restriction: you cannot update a table and select from **the same table** in a subquery of that statement (error 1093, "You can't specify target table for update in FROM clause"); wrap the inner query in a derived table or use a join.

## Rows matched, rows changed

MySQL reports two numbers after an UPDATE: rows **matched** by the WHERE and rows **changed**. Setting a column to the value it already holds matches the row but does not change it. Drivers usually return "affected rows", which by default means changed rows — so an UPDATE that reports 0 affected rows may still have found the row. Do not use the affected count alone to decide whether a row exists.

MySQL additionally allows `ORDER BY` and `LIMIT` on a single-table UPDATE (`UPDATE jobs SET claimed_by = 7 WHERE claimed_by IS NULL ORDER BY id LIMIT 1;`), handy for work queues; it is not standard SQL and the practice engine here does not run it.

## Pitfalls

- A missing or wrong WHERE — test it as a SELECT first.
- A CASE without `ELSE column`, which NULLs the unmatched rows.
- A subquery in SET without the matching WHERE, which NULLs every row with no match.
- Read-then-write in the application instead of `col = col + n`.
- Relying on MySQL's left-to-right SET evaluation.
- Updating a primary key that other tables point to; change the surrogate design instead.

## Key takeaways

- `UPDATE t SET a = x, b = y WHERE ...;` — the WHERE decides which rows, and leaving it out means all of them.
- Right-hand sides can use the row's current values: `qty = qty - 1` is atomic.
- `CASE ... ELSE col END` applies several rules in one pass.
- From another table: a correlated subquery plus a WHERE (portable), `UPDATE ... JOIN` (MySQL), `UPDATE ... FROM` (PostgreSQL).
- Matched is not changed; affected-row counts count changes.
