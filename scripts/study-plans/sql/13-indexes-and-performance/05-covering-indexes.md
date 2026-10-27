---
title: Covering indexes and index-only reads
minutes: 14
seo-title: What Is a Covering Index? Index-Only Queries in MySQL
description: A covering index holds every column a query needs, so MySQL answers from the index alone with Using index. How InnoDB's primary key helps, and the trade-offs.
question: What is a covering index?
answer: A covering index is an index that contains every column a query reads, in its WHERE, SELECT, JOIN, GROUP BY and ORDER BY clauses, so the database answers the query from the index alone without fetching the table's rows. In MySQL EXPLAIN it shows as Using index in the Extra column. In InnoDB the primary key is included in every secondary index automatically.
q: Why is a covering index faster?
a: A secondary index lookup in InnoDB normally needs a second search in the clustered index for each matching row to fetch the other columns. When the index covers the query, those per-row lookups disappear, and the index entries are also smaller and packed more densely than full rows, so fewer pages are read.
q: Does SELECT * prevent a covering index?
a: Almost always. SELECT * needs every column of the table, so only the clustered index, which holds the whole row, can answer it. Listing just the columns you need is what makes a covering index possible, and it also sends less data to the client.
q: Is the primary key part of a secondary index in MySQL?
a: Yes, in InnoDB. Every secondary index entry stores the row's primary key value as its pointer back to the row. So an index on (email) covers SELECT id, email FROM users WHERE email = ... when id is the primary key, without adding id to the index.
q: Does MySQL support INCLUDE columns like PostgreSQL and SQL Server?
a: No. PostgreSQL 11+ and SQL Server let an index carry extra non-key columns with INCLUDE, stored only in the leaves. In MySQL you get the same effect by appending those columns to the end of the index key, which also makes them part of the sort order and the size limit.
---
The last lesson made the server *able* to use an index. This one makes it use the index **instead of** the table. Recall from the first lesson that an InnoDB secondary index lookup is two searches: down the secondary index to find primary keys, then down the clustered index once per key to fetch the row. If the index already holds every column the query needs, the second search is pointless — the server can answer from the index alone. Such an index **covers** the query, and the plan says so with `Using index`. This is one of the highest-leverage tricks in query tuning, and a favourite follow-up question after "what is a clustered index?".

## Two lookups, or one

```sql
CREATE TABLE orders (
  id          INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on   DATE NOT NULL,
  status      VARCHAR(12) NOT NULL,
  amount      INT NOT NULL,
  notes       TEXT
);
CREATE INDEX idx_orders_customer ON orders (customer_id);
```

```sql
SELECT placed_on, amount FROM orders WHERE customer_id = 7;
```

With `idx_orders_customer`, the server finds customer 7's entries — each holding `customer_id` and `id` — and then, for **each** one, searches the clustered index to read `placed_on` and `amount`. Forty orders, forty extra searches, landing on pages scattered around the table.

Now extend the index:

```sql
CREATE INDEX idx_orders_cust_date_amt ON orders (customer_id, placed_on, amount);
```

Every column the query touches — `customer_id` in the `WHERE`, `placed_on` and `amount` in the `SELECT` — is in the index. The server reads customer 7's entries, which sit next to each other, and is done:

| table | type | key | rows | Extra |
| --- | --- | --- | ---: | --- |
| orders | ref | idx_orders_cust_date_amt | 40 | Using index |

## The primary key comes along for free

Because InnoDB secondary entries store the primary key, the key is **always covered**:

```sql
CREATE INDEX idx_users_email ON users (email);

SELECT id FROM users WHERE email = 'asha@example.com';          -- covered
SELECT id, email FROM users WHERE email LIKE 'asha%';           -- covered
SELECT id, email, name FROM users WHERE email = 'asha@…';       -- not: name is missing
```

That also explains why `COUNT(*)` on an InnoDB table often scans the **smallest secondary index** rather than the table: every index has one entry per row, and a narrow index has the fewest pages.

## What "every column" means

A query is covered only if the index contains the columns used **anywhere** in it for that table:

- the `SELECT` list (so `SELECT *` defeats it — list the columns you need);
- the `WHERE` clause;
- `JOIN … ON` conditions;
- `GROUP BY`, `ORDER BY`, `HAVING`, and the arguments of aggregates.

```sql
-- index (customer_id, placed_on, amount)
SELECT customer_id, COUNT(*) AS orders, SUM(amount) AS total
FROM orders
WHERE placed_on >= '2024-01-01'
GROUP BY customer_id;
```

Every column is in the index, so the query is covered. Note that `placed_on` is the second column and the filter has no `customer_id` equality, so this is not a seek: the plan is `type: index` — a full scan of the index — but still `Using index`. Scanning a compact index is much cheaper than scanning the table, especially when the table has wide columns like `notes`. If the date filter is the common case, an index starting with `placed_on` would make it a range instead.

## Covering helps sorting too

When the index order matches the `ORDER BY` *and* covers the columns, the server streams rows in order straight from the leaves — no lookups and no filesort:

```sql
-- index (customer_id, placed_on, amount)
SELECT placed_on, amount
FROM orders
WHERE customer_id = 7
ORDER BY placed_on DESC
LIMIT 5;
```

With `LIMIT 5`, it reads five index entries and stops. This "latest N for one key" pattern — a user's recent orders, a thread's newest posts — is exactly where a covering composite index shines.

## Deferred joins: covering the expensive part

When the final rows need wide columns, a covering index can still do the hard work of choosing *which* rows:

```sql
SELECT o.*
FROM orders o
JOIN (
  SELECT id FROM orders
  WHERE customer_id = 7
  ORDER BY placed_on DESC
  LIMIT 20 OFFSET 2000
) page ON page.id = o.id
ORDER BY o.placed_on DESC;
```

The inner query is covered by `(customer_id, placed_on)` (plus the implicit `id`), skips 2,000 entries in the index cheaply, and only 20 full rows are fetched. This **deferred join** is the standard fix for deep `OFFSET` pagination when keyset pagination is not possible.

## The trade-offs

A covering index is a wider index, with all the costs of the first lesson multiplied:

- **bigger** — more pages, more memory, more I/O on writes;
- **more write work** — updating any of its columns moves the entry, so covering a frequently updated column is expensive;
- **limits** — at most 16 columns and a key-size cap; `TEXT`/`BLOB` columns can only be prefix-indexed, and a prefix never covers.

Cover the few hot queries that matter, not every query. MySQL has no `INCLUDE` clause: where PostgreSQL 11+ writes `CREATE INDEX … (customer_id) INCLUDE (amount)`, MySQL appends `amount` to the key. PostgreSQL also needs its visibility map to be current for an `Index Only Scan` to skip the heap — one reason `VACUUM` matters there.

## Practise

The first exercise builds a covering index and runs the per-customer report it serves. The second decides coverage in SQL: given each index's columns and the columns each query touches, list which indexes cover each query — remembering that InnoDB adds the primary key to every secondary index.
