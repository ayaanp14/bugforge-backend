---
title: Deduplication — finding, keeping and deleting duplicate rows
minutes: 15
seo-title: Remove Duplicate Rows in SQL: Find, Keep One, Delete the Rest
description: How to find duplicate rows in SQL with GROUP BY and HAVING, keep one per group with a row number, and delete the extras in MySQL without error 1093.
question: How do you remove duplicate rows in SQL?
answer: To remove duplicate rows in SQL, number the rows of each duplicate group with `ROW_NUMBER() OVER (PARTITION BY the duplicate columns ORDER BY a keeper rule)`, then delete every row whose number is above 1. To read the data without duplicates, select only the rows numbered 1 instead. A UNIQUE constraint afterwards stops new duplicates from being inserted.
q: How do you find duplicate values in a SQL table?
a: Group by the columns that define a duplicate and keep the groups with more than one row: `SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1`. To see the full duplicate rows rather than one line per group, add `COUNT(*) OVER (PARTITION BY email)` and filter on it.
q: What does MySQL error 1093 mean?
a: Error 1093, "You can't specify target table for update in FROM clause", means a DELETE or UPDATE reads the same table in a subquery. Wrap the subquery in a derived table, `SELECT id FROM (SELECT ...) AS t`, which MySQL materialises first, or use a multi-table DELETE with a self-join.
q: How do you delete duplicates but keep the row with the lowest id?
a: Delete every row for which another row has the same duplicate columns and a smaller id. In MySQL that is a self-join delete, `DELETE a FROM t a JOIN t b ON a.email = b.email AND a.id > b.id`, or a delete of the ids whose `ROW_NUMBER` ordered by id is above 1.
q: Does GROUP BY treat NULL values as duplicates?
a: Yes. GROUP BY and DISTINCT put all NULLs in one group, even though `NULL = NULL` is not true. A UNIQUE index is the opposite: MySQL allows any number of NULLs in a unique column, so it does not stop duplicate rows whose key is NULL.
---
Duplicates arrive in every real table sooner or later: a form submitted twice, an import run twice, the same customer typed as `Asha@Mail.com` and `asha@mail.com `. Dealing with them is three separate questions, and interviews ask all three: *which rows are duplicated*, *show me the data with one row per thing*, and *delete the extras*. Before any of them comes the one that decides the answer — **what makes two rows the same?**

## Decide what "the same" means

Two rows are rarely identical in every column; the `id` alone differs. Duplicates are rows equal on a chosen set of columns — the *business key*: the email, or the customer plus the product plus the day. Write that set down first; it becomes the `GROUP BY` or the `PARTITION BY` in every query below.

Then decide how dirty the key is. If emails differ only in case and stray spaces, compare a normalised form:

```sql
SELECT LOWER(TRIM(email)) AS email_key, COUNT(*) AS copies
FROM contacts
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;
```

In MySQL a plain `GROUP BY email` would already ignore case under the default case-insensitive collation (`utf8mb4_0900_ai_ci`) — but not the spaces, and not on a database whose collation is case-sensitive. `LOWER(TRIM(…))` says what you mean on every engine.

## Finding the duplicates

`GROUP BY … HAVING COUNT(*) > 1` gives one line per duplicated key — the right answer to "which emails are duplicated, and how often?". To see the duplicate *rows* themselves, with their ids and other columns, count inside a window instead so that no row is collapsed:

```sql
SELECT *
FROM (
  SELECT c.*,
         COUNT(*) OVER (PARTITION BY LOWER(TRIM(email))) AS copies
  FROM contacts AS c
) AS t
WHERE copies > 1
ORDER BY LOWER(TRIM(email)), id;
```

The older equivalent joins the table to the grouped duplicate keys (`JOIN (SELECT email … HAVING COUNT(*) > 1) d USING (email)`), or uses `EXISTS` for "another row with the same email and a different id". All three are correct; the window version reads the table once.

## Keeping one row per group

To *read* the data deduplicated, number the rows of each group in the order of preference and keep number 1:

```sql
WITH ranked AS (
  SELECT c.*,
         ROW_NUMBER() OVER (
           PARTITION BY LOWER(TRIM(email))
           ORDER BY updated_at DESC, id DESC) AS rn
  FROM contacts AS c
)
SELECT id, email, name
FROM ranked
WHERE rn = 1
ORDER BY email;
```

The `ORDER BY` inside `OVER` is the *keeper rule*: the most recently updated row, and if two were updated at the same moment, the higher id. Always make that rule total — end it with a unique column — or the row that survives can change between runs. This "latest row per key" query is one of the most used queries in practice; it is how a slowly-changing history becomes a current view.

`SELECT DISTINCT` is the right tool only when the rows are duplicates in *every* selected column. `SELECT DISTINCT email, name` keeps both `asha@mail.com | Asha` and `asha@mail.com | Asha K` — DISTINCT cannot choose between rows that differ.

There is also the aggregate shortcut, `SELECT email, MAX(updated_at) … GROUP BY email`, which gives the latest *timestamp* but not the rest of that row. Asking for `name` in the same query either fails under `ONLY_FULL_GROUP_BY` (the MySQL 8 default) or, with that mode off, returns a name from an arbitrary row. Join the maximum back to the table, or use `ROW_NUMBER`.

## Deleting the extras

Deleting duplicates means deleting every row that is not the keeper. The portable way names the rows to delete by id:

```sql
DELETE FROM orders
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY customer_id, product, ordered_on
             ORDER BY id) AS rn
    FROM orders
  ) AS numbered
  WHERE rn > 1
);
```

The extra level — `SELECT id FROM (…) AS numbered` — is not decoration. MySQL refuses a `DELETE` or `UPDATE` whose subquery reads the table being changed, with error 1093: *You can't specify target table 'orders' for update in FROM clause*. Wrapping the subquery in a derived table makes MySQL materialise it first, and the error goes away. (PostgreSQL and SQL Server have no such restriction, which is why this wrapper looks odd to people coming from them.)

MySQL also has a multi-table `DELETE` that does the same with a self-join, and it is the classic short answer for "keep the lowest id":

```sql
DELETE o1
FROM orders AS o1
JOIN orders AS o2
  ON  o1.customer_id = o2.customer_id
  AND o1.product     = o2.product
  AND o1.ordered_on  = o2.ordered_on
  AND o1.id > o2.id;
```

Every row that has a twin with a smaller id is deleted, so exactly the smallest id of each group survives. The `DELETE o1 FROM …` form is MySQL's (SQL Server spells it `DELETE o1 FROM … JOIN …` too; PostgreSQL uses `DELETE FROM orders o1 USING orders o2 WHERE …`). The `ROW_NUMBER` version runs everywhere and states the keeper rule more plainly, so it is the one to write when the rule is anything other than "smallest id".

Run a destructive deduplication inside a transaction, check the row count against the `SELECT` that found the duplicates, and only then `COMMIT`.

## NULLs in the key

`GROUP BY`, `DISTINCT` and `PARTITION BY` all treat NULLs as one group, so two rows with a NULL phone number count as duplicates of each other in every query above. Whether they *are* duplicates is a business question — two contacts with no phone number are usually different people. If they are not duplicates, exclude them (`WHERE phone IS NOT NULL`) or partition by a key that cannot be NULL.

## Stopping them coming back

Cleaning a table once is half the job. A `UNIQUE` constraint on the business key makes the next duplicate fail at insert time:

```sql
ALTER TABLE orders
  ADD CONSTRAINT uq_order UNIQUE (customer_id, product, ordered_on);
```

The constraint can only be added after the existing duplicates are gone. From then on, an import can use `INSERT IGNORE` to skip rows that would collide, or `INSERT … ON DUPLICATE KEY UPDATE` to update the existing row instead. Remember that a MySQL unique index allows any number of NULLs, so a nullable key column does not prevent NULL-keyed duplicates.

## How to say it in an interview

State the duplicate key and the keeper rule before writing anything: "rows are duplicates when customer, product and day match; we keep the smallest id." Then: GROUP BY with HAVING to find, `ROW_NUMBER` with `rn = 1` to read, `rn > 1` (wrapped for MySQL) or the self-join to delete, and a UNIQUE constraint so it does not happen again. Mentioning error 1093 unprompted is a strong signal that you have done this on a real MySQL server.
