---
title: How indexes work — B+trees, clustered and secondary
minutes: 15
seo-title: What Is a Database Index? B+Tree Indexes in MySQL Explained
description: A MySQL index is a sorted B+tree that finds rows without reading the table. How InnoDB clusters rows by primary key, and what a secondary index lookup costs.
question: What is an index in a database?
answer: A database index is a separate, sorted data structure, in MySQL's InnoDB a B+tree, that maps column values to the rows holding them. Like a book's index, it lets a query jump to matching rows in a few page reads instead of scanning the whole table. The price is disk space and extra work on every INSERT, UPDATE and DELETE.
q: What is the difference between a clustered and a non-clustered index?
a: A clustered index stores the table's rows themselves in index order, so a table can have only one; in InnoDB it is the primary key. A non-clustered (secondary) index stores the indexed values plus a pointer to the row, which in InnoDB is the primary key value, so a lookup through it searches two trees.
q: Why not index every column?
a: Every index is a second copy of its columns that must be updated on each INSERT, UPDATE and DELETE, takes disk and buffer pool memory, and gives the optimizer more plans to weigh. An index on a column no query filters, joins or sorts by is pure cost. Index the columns your real queries use.
q: Why does MySQL use a B+tree and not a binary tree?
a: Disks and memory are read in pages, and a B+tree node fills a whole 16 KB page with hundreds of keys, so the tree is only three or four levels deep even for millions of rows. A binary tree would be about twenty levels deep, one page read each. B+tree leaves are also linked, which makes range scans sequential.
q: What happens if an InnoDB table has no primary key?
a: InnoDB still clusters the rows. It uses the first UNIQUE index whose columns are all NOT NULL; if there is none, it adds a hidden 6-byte row id and clusters on that. You cannot query or join on the hidden id, so always declare an explicit primary key.
q: What is index selectivity?
a: Selectivity is the number of distinct values divided by the number of rows. A selectivity near 1, as with an email column, means an equality lookup returns very few rows and the index helps a lot. A selectivity near 0, as with a yes/no flag, means a lookup returns a large share of the table and a full scan is often cheaper.
---
A table without an index is a heap of pages. To answer `WHERE email = 'asha@example.com'` the server has to read every page and test every row — a **full table scan**. On ten rows nobody notices; on ten million rows it is the difference between a millisecond and several seconds, and it is the first thing an interviewer asks about when a query is slow. This lesson explains what an index physically is in MySQL 8's storage engine, InnoDB, how the primary key shapes the whole table, what a secondary index stores, and what every index costs.

## The book index analogy, made precise

An index is a **second copy of some columns, kept sorted**, with a way back to the full row. Because it is sorted, finding a value is a search, not a scan — the same reason you find "B+tree" in a textbook's index in seconds without reading the book.

```sql
CREATE TABLE customers (
  id          INT PRIMARY KEY,
  email       VARCHAR(120) NOT NULL,
  city        VARCHAR(60),
  signup_date DATE
);

CREATE INDEX idx_customers_city ON customers (city);
-- MySQL also accepts the same index inside ALTER TABLE:
-- ALTER TABLE customers ADD INDEX idx_customers_city (city);
```

After this, a query that filters on `city` can search `idx_customers_city` for `'Pune'`, read the handful of matching entries, and fetch just those rows. Nothing in the query text changes — `SELECT … WHERE city = 'Pune'` is the same statement with or without the index. Choosing whether to use it is the **optimizer's** job, and it only uses an index when it estimates that is cheaper than scanning.

## Why a B+tree

Storage is read in **pages** — InnoDB's default page is 16 KB — and a page read is the unit of cost, whether it comes from disk or from the buffer pool. A B+tree is built for that:

- every **node is one page** and holds hundreds of keys, so the tree is very wide and very shallow;
- the **inner nodes** hold only keys and child pointers, used to steer the search;
- the **leaf nodes** hold the entries themselves, in sorted order, and each leaf is **linked to the next**.

```text
                      [ 40 | 80 ]                    root (one page)
             /             |             \
     [10|20|30]       [50|60|70]       [90|99]       inner pages
      /  |  |  \       ...               ...
  leaf ↔ leaf ↔ leaf ↔ leaf ↔ leaf ↔ leaf ↔ leaf     linked leaf pages
```

With a few hundred keys per page, three levels address tens of millions of rows. An equality lookup is therefore **three or four page reads**, and the upper levels are almost always cached in memory. A binary tree over the same rows would be about twenty-four levels deep — twenty-four dependent reads. The linked leaves are what make a **range** cheap: `WHERE signup_date BETWEEN '2024-01-01' AND '2024-01-31'` searches down once to the first date and then walks the leaves sideways until it passes the last.

Search cost grows with the logarithm of the table, so doubling the table adds a fraction of a level. That is why "add an index" turns an O(n) scan into roughly O(log n) work.

## The clustered index: the table *is* the primary key

In InnoDB the table is not a heap with an index beside it. **The table is stored as a B+tree on the primary key** — the clustered index — and its leaf pages hold the complete rows.

```text
clustered index (PRIMARY) on customers.id
  leaf: id=1 | asha@…  | Pune   | 2024-01-04
        id=2 | ravi@…  | Delhi  | 2024-01-09
        id=3 | meera@… | Pune   | 2024-02-11
```

Consequences worth saying out loud in an interview:

- a table has **exactly one** clustered index, because rows can be physically ordered only one way;
- a lookup or range on the primary key reads the rows directly — the fastest access there is;
- if you declare no primary key, InnoDB uses the first `UNIQUE` index whose columns are all `NOT NULL`, and failing that it invents a **hidden 6-byte row id** — so always declare one;
- a short, ever-increasing key (an `INT AUTO_INCREMENT`) appends new rows at the right edge of the tree; a random key such as a UUID string inserts into the middle, splits pages and leaves them half full.

## Secondary indexes store the primary key

Every other index is a **secondary** (non-clustered) index. Its leaves hold the indexed column values **plus the primary key** of the row — not a physical address.

```text
idx_customers_city (secondary)
  leaf: Delhi → id 2
        Pune  → id 1
        Pune  → id 3
```

So `SELECT * FROM customers WHERE city = 'Pune'` is two searches: one down `idx_customers_city` to collect ids 1 and 3, then one down the clustered index **per id** to fetch each full row. If the filter matches a few rows, that is cheap. If it matches a third of the table, those per-row lookups jump all over the clustered index and a plain scan wins — which is why the optimizer sometimes ignores an index you created. Two useful corollaries:

- a long primary key makes **every** secondary index bigger, because each entry repeats it;
- a query that needs only the indexed columns and the primary key never visits the clustered index at all — a **covering** index, the subject of a later lesson.

PostgreSQL differs here: its tables are heaps, every index (including the primary key's) points at a physical tuple location, and there is no clustered index maintained automatically (`CLUSTER` reorders once).

## Selectivity decides whether an index helps

An index pays off when a lookup returns a **small fraction** of the table. The measure is **selectivity**: distinct values divided by rows.

```sql
SELECT COUNT(DISTINCT email)   / COUNT(*) AS email_selectivity,    -- ≈ 1.0
       COUNT(DISTINCT city)    / COUNT(*) AS city_selectivity,     -- maybe 0.01
       COUNT(DISTINCT is_active) / COUNT(*) AS active_selectivity  -- 2 / rows ≈ 0
FROM customers;
```

`email` is ideal. `city` helps when the cities are many and evenly spread. `is_active` (two values) rarely helps on its own: half the table matches, and the optimizer will scan. The server keeps estimates of these counts — the **cardinality** shown by `SHOW INDEX`, refreshed by `ANALYZE TABLE` — and plans from them, not from your intentions.

## What an index costs

Indexes are not free, and "why not index every column?" is a classic question. Each index:

- is **written on every change**: an `INSERT` adds an entry to every index, a `DELETE` removes one from each, an `UPDATE` of an indexed column moves its entry;
- takes **disk and buffer pool memory**, crowding out data pages you would rather keep cached;
- gives the optimizer **more plans to weigh**, and occasionally a worse one;
- can be **redundant**: an index on `(customer_id)` is covered by one on `(customer_id, placed_on)`.

A `UNIQUE` index is also a **constraint**: the server refuses a duplicate, so it must check the index before every insert. And it cannot be created while duplicates exist — finding them first is a practical skill you will use in the checkpoint.

## Other kinds of index in MySQL

- **B-tree** — the default for InnoDB, and what "index" means unless stated otherwise.
- **FULLTEXT** — word search with `MATCH … AGAINST`, for prose columns where `LIKE '%word%'` cannot use a B-tree.
- **SPATIAL** — R-tree indexes on geometry columns.
- **Hash** — only for `MEMORY` tables; InnoDB builds an internal *adaptive hash index* over hot B-tree pages by itself.
- **Functional indexes** (MySQL 8.0.13+) — an index on an expression, written with double parentheses: `CREATE INDEX idx_year ON orders ((YEAR(placed_on)));`.
- **Invisible indexes** (8.0) — `ALTER TABLE t ALTER INDEX idx INVISIBLE` hides one from the optimizer while it is still maintained, so you can test dropping it safely.

## Practise

The exercises run on SQLite behind a MySQL layer, so they judge the rows your queries return, not the plan. You will create an index and run the lookup it serves, and then measure the selectivity of candidate columns — the number you should look at before creating any index.
