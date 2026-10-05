---
title: Indexing and B+ Trees in DBMS
order: 11
minutes: 15
level: intermediate
updated: 2026-10-05
seo-title: Indexing in DBMS: B+ Tree, Clustered and Hash Index
description: Indexing in DBMS: clustered vs secondary, dense vs sparse, multilevel, B-tree vs B+ tree, B+ tree insertion with splits worked, hash and composite indexes.
question: What is indexing in DBMS?
answer: An index is an auxiliary data structure that maps values of a column (the search key) to the rows that hold them, so the DBMS can find rows without scanning the whole table. Most relational databases use B+ tree indexes, which keep keys sorted in a balanced tree and answer equality and range queries in a few page reads; hash indexes answer only equality lookups.
q: What is the difference between a clustered and a non-clustered index?
a: A clustered index decides the physical order of the rows: the table itself is stored sorted by its key, so there can be only one. A non-clustered (secondary) index is a separate structure whose entries point to the rows. In MySQL's InnoDB the primary key is the clustered index, and secondary index entries store the primary key value.
q: Why do databases use B+ trees instead of binary search trees?
a: A binary search tree node holds one key, so a million keys need about 20 levels, each a separate disk read. A B+ tree node is a whole disk page holding hundreds of keys, so the same million keys fit in about three levels. The tree stays balanced, and linked leaves make range scans fast.
q: What is the difference between a dense and a sparse index?
a: A dense index has an entry for every search-key value in the file. A sparse index has entries for only some values, typically the first key of each data block, and works only when the file is sorted on that key. Sparse indexes are smaller; dense ones can answer whether a value exists without reading the data.
q: What is the leftmost prefix rule?
a: A composite index on (a, b, c) is sorted by a, then by b within a, then by c. So it can seek on a, on a and b, or on a, b and c, but not on b or c alone. A range condition on one column also stops the columns after it being used for seeking.
q: Do indexes slow down inserts and updates?
a: Yes. Every INSERT and DELETE must also change every index on the table, and an UPDATE must change each index that contains a modified column, sometimes splitting pages. Indexes also take disk space and buffer memory. Add an index for queries that need it, not for every column.
---

Finding one student among a million by reading every row is like finding a topic in a textbook by reading every page. An **index** is the book's index for a table: a separate, sorted structure that says where each value lives. With the right index a lookup touches a handful of disk pages instead of thousands. This note covers the kinds of index, dense and sparse and multilevel indexes, then the B+ tree that almost every relational database uses, with search and insertion worked step by step, and ends with hash indexes, the cost of indexes and the leftmost-prefix rule for composite ones.

## Why indexes

Databases read and write data in **pages** (blocks) of a fixed size: 16 KB in InnoDB, 8 KB in PostgreSQL. The cost of a query is roughly the number of pages it reads. Suppose a table of 1,000,000 students fits 100 rows to a page: that is 10,000 pages, and a query by roll number without an index reads all of them.

A B+ tree with a **fan-out** (children per node) of 100 and 100 keys per leaf reaches 100 × 100 × 100 = 1,000,000 keys in three levels. A lookup then reads three index pages and one data page: 4 reads instead of 10,000. Real fan-outs are larger, often several hundred keys per 16 KB page for small keys, so three or four levels cover very large tables.

The terms: the **search key** is the column (or columns) an index is built on, which need not be a primary or candidate key. An **index entry** is a search-key value with a pointer to the row or the block holding it. **Ordered indexes** keep entries sorted (B+ trees); **hash indexes** spread them across buckets with a hash function.

## Primary, clustering and secondary indexes

| Index | Built on | Entries | Per table |
| --- | --- | --- | --- |
| Primary index | The ordering key of a file sorted on a unique key | Can be sparse: one per block | At most one |
| Clustering index | The ordering field of a file sorted on a non-unique field | One per distinct value | At most one |
| Secondary index | Any non-ordering field | Must be dense | Many |

In everyday database language the two words are **clustered** and **non-clustered**. A clustered index determines how the rows are physically ordered, so a table can have only one. In MySQL's InnoDB the table *is* a B+ tree on the primary key, with whole rows in its leaves. A **secondary index** in InnoDB stores (indexed value, primary key) in its leaves, so finding a row through it takes two tree walks: the secondary index to get the primary key, then the clustered index to get the row. If the secondary index already contains every column the query needs, the second walk is skipped; such an index is **covering** for that query, and `EXPLAIN` shows "Using index".

## Dense and sparse indexes

Take a data file sorted on roll_no, three records to a block: block 1 holds 101–103, block 2 holds 104–106, block 3 holds 107–109.

| Index | Entries | Finding 105 |
| --- | --- | --- |
| Dense | 101, 102, 103, …, 109: nine entries, each pointing to its record | Find entry 105, follow its pointer |
| Sparse | 101 (block 1), 104 (block 2), 107 (block 3): three entries | Find the largest entry not greater than 105, which is 104; read block 2 and scan to 105 |

A sparse index is smaller, but it needs the file sorted on the search key, which is why only a primary or clustering index can be sparse. A secondary index must be dense, because the rows are not in its order.

## Multilevel indexes

An index on a large table is itself large. If an inner index has 10,000 entries and 100 fit in a block, it spans 100 blocks, and binary search over them costs about ⌈log₂ 100⌉ = 7 block reads. Build a sparse **outer index** on the inner index, one entry per inner block: 100 entries, one block. Now a lookup reads the outer block, one inner block and the data block: 3 reads. Repeating the idea until the top level fits in one block gives a **multilevel index**. A B+ tree is a multilevel index that stays balanced automatically as rows are inserted and deleted.

## B-tree vs B+ tree

| Aspect | B-tree | B+ tree |
| --- | --- | --- |
| Data pointers | In every node | Only in the leaves |
| Internal keys | Each key appears once in the tree | Internal keys are copies used as signposts; every key is in a leaf |
| Leaves | Not linked | Linked in key order |
| Search ends | At any level | Always at a leaf |
| Range query | Walks up and down the tree | Find the first leaf, then follow the links |
| Fan-out | Lower, since internal nodes carry data pointers | Higher, so the tree is shorter |
| Deletion | Can remove from an internal node, which is more complex | Always removes from a leaf |

When a database's documentation says "B-tree index", it almost always means a B+ tree: InnoDB and PostgreSQL both use B+ trees.

## B+ tree structure

This note uses a B+ tree of **order 4**: a node has at most 4 children and therefore at most 3 keys. Textbooks define "order" differently (maximum children, maximum keys, or minimum keys), so in an exam, state your convention. The rules:

- Every leaf is at the same depth: the tree is always **balanced**.
- An internal node with k keys has k + 1 children. Keys in child i are at least key i−1 and less than key i.
- Every node except the root is at least half full: internal nodes have 2 to 4 children, leaves 2 to 3 keys.
- Leaves hold every key (with its row or row pointer) and are linked left to right.

**Splitting conventions used below.** A leaf that overflows to 4 keys splits into two leaves of 2 keys each, and the first key of the right leaf is **copied** up into the parent (it must stay in the leaf too). An internal node that overflows to 4 keys keeps the first 2, **moves** the third up to its parent, and gives the fourth to a new right node.

## Worked example: inserting into a B+ tree

Insert 10, 20, 30, 40, 50, 15, 25, 35, 45, 55 into an empty order-4 B+ tree:

| Insert | Leaf it goes to | What happens | Tree afterwards (root; leaves) |
| --- | --- | --- | --- |
| 10, 20, 30 | The root, which is a leaf | Fits | [10 20 30] |
| 40 | [10 20 30] | 4 keys: split into [10 20] and [30 40]; copy 30 up into a new root | [30]; [10 20] [30 40] |
| 50 | [30 40] (50 ≥ 30) | Fits | [30]; [10 20] [30 40 50] |
| 15 | [10 20] | Fits | [30]; [10 15 20] [30 40 50] |
| 25 | [10 15 20] | 4 keys: split into [10 15] and [20 25]; copy 20 up | [20 30]; [10 15] [20 25] [30 40 50] |
| 35 | [30 40 50] | 4 keys: split into [30 35] and [40 50]; copy 40 up | [20 30 40]; [10 15] [20 25] [30 35] [40 50] |
| 45 | [40 50] | Fits | [20 30 40]; … [40 45 50] |
| 55 | [40 45 50] | 4 keys: split into [40 45] and [50 55]; copy 50 up. The root becomes [20 30 40 50], 4 keys: split into [20 30] and [50], move 40 up into a new root | See below |

The final tree has three levels:

```text
                     [40]
                 /          \
          [20  30]            [50]
         /   |    \          /    \
  [10 15] [20 25] [30 35] [40 45] [50 55]

  leaves linked: [10 15] -> [20 25] -> [30 35] -> [40 45] -> [50 55]
```

Check it against the rules: every leaf is at depth 3 and holds 2 or 3 keys, every internal node has 2 to 4 children (the root may have as few as 2), and 40 and 50 appear both as signposts and in leaves, because leaf splits copy keys up while the internal split moved 40 out of its node. The tree grew taller only when the root split, which is why a B+ tree is always balanced.

## Searching

**Point lookup for 35**: at the root [40], 35 < 40, so go to the first child. At [20 30], 35 ≥ 30, so go to the third child. Leaf [30 35] contains 35: found in 3 page reads. A search for 22 follows root, then the second child of [20 30], reaching leaf [20 25] and finding 22 absent.

**Range query, keys from 22 to 42**: descend as for 22 to leaf [20 25], output 25, then follow the leaf links: [30 35] gives 30 and 35, [40 45] gives 40, and 45 is above 42, so stop. Result: 25, 30, 35, 40. The links are what make B+ trees good at `BETWEEN`, `>` and `ORDER BY`.

**Deletion** mirrors insertion: remove the key from its leaf; if the leaf falls below half full, borrow a key from a sibling or merge with it, and fix the parent's signposts. Merges can cascade up and shrink the tree by one level. Search, insertion and deletion each cost O(log n) page reads, where the base of the logarithm is the fan-out.

## Hash indexes

A **hash index** applies a hash function to the search key and stores the entry in the resulting bucket. An equality lookup (`WHERE email = '…'`) costs about one bucket read on average, independent of table size. But hashing destroys order, so a hash index cannot answer ranges, `ORDER BY` or prefix searches such as `LIKE 'abc%'`. Collisions go into overflow chains, and dynamic schemes (extendible and linear hashing) grow the table without rehashing everything.

In practice: MySQL's MEMORY engine supports explicit hash indexes; InnoDB uses B+ trees and builds an internal adaptive hash index over frequently used pages on its own; PostgreSQL offers `CREATE INDEX … USING hash`.

| Aspect | B+ tree index | Hash index |
| --- | --- | --- |
| Equality lookup | O(log n) page reads | About one bucket read |
| Range and ORDER BY | Yes | No |
| Prefix match | Yes, for `LIKE 'abc%'` | No |
| Typical use | Default for almost everything | Exact-match lookups, in-memory tables |

## The cost of an index

Indexes are not free:

- **Writes**: every `INSERT` and `DELETE` updates every index on the table, and an `UPDATE` updates each index containing a changed column, sometimes splitting pages.
- **Space**: each index is another tree on disk and competes for the buffer pool in memory.
- **Choice**: the optimizer may ignore an index that matches a large fraction of rows (low selectivity, such as a yes/no column), because a sequential scan is cheaper than thousands of random lookups.

Index the columns that appear in frequent `WHERE`, `JOIN` and `ORDER BY` clauses, check with `EXPLAIN`, and drop indexes nothing uses.

## Composite indexes and the leftmost-prefix rule

A **composite index** covers several columns, for example `CREATE INDEX idx ON employees (dept, city, salary)`. Its entries are sorted by dept, then by city within each dept, then by salary within each (dept, city), like names in a phone book sorted by surname then first name. So it can only seek on a **leftmost prefix** of its columns:

| Condition | How the index is used |
| --- | --- |
| `dept = 'CSE'` | Seeks on dept |
| `dept = 'CSE' AND city = 'Pune'` | Seeks on dept and city |
| `dept = 'CSE' AND city = 'Pune' AND salary > 50000` | Seeks on all three, a range on the last |
| `city = 'Pune' AND dept = 'CSE'` | Same as the second row: the order of conditions in WHERE does not matter |
| `city = 'Pune'` | Cannot seek: city is not a leftmost prefix |
| `dept = 'CSE' AND salary > 50000` | Seeks on dept only; salary is filtered inside that range |
| `dept = 'CSE' AND city > 'M' AND salary = 50000` | Seeks on dept and the city range; the range stops salary being used for seeking |
| `ORDER BY dept, city` | Reads rows already in order, with no sort |

MySQL 8.0.13 and later can sometimes use a **skip scan** for a condition on a non-leading column, but do not design around it. Put equality columns first and the range column last, and prefer the more selective equality column first when queries use both.

## Common mistakes

- Thinking a table can have several clustered indexes: it is stored in one order only.
- Indexing every column: writes slow down and most of the indexes are never used.
- Expecting an index on (a, b) to help `WHERE b = …`: it is not a leftmost prefix.
- Using a hash index for range queries or sorting: hashing destroys order.
- Forgetting that leaf splits copy the key up while internal splits move it.
- Wrapping an indexed column in a function, such as `WHERE YEAR(joined) = 2025`: the B+ tree is sorted on the column, not the function, so the index cannot seek.

## Interview questions

**What is an index and why does it speed up queries?** A sorted (or hashed) structure from search-key values to rows. It replaces a full scan of every page with a walk down a tree of a few levels, so a lookup reads a few pages instead of thousands.

**What is the difference between a B-tree and a B+ tree?** A B-tree stores data pointers in every node; a B+ tree stores them only in linked leaves and uses internal keys purely as signposts. B+ trees have higher fan-out, shorter height and fast range scans, which is why databases use them.

**What is the difference between a primary and a secondary index?** A primary index is built on the key the file is sorted by and can be sparse; there is one per file. A secondary index is built on any other column, must be dense and can be added many times.

**What is a covering index?** An index that contains every column a query needs, so the query is answered from the index alone without reading the table rows. In InnoDB, a secondary index on (dept, salary) covers `SELECT salary FROM employees WHERE dept = 'CSE'`.

**When will a database not use an index?** When the condition is not on a leftmost prefix, when the column is wrapped in a function or compared with an implicit type conversion, when a `LIKE` pattern starts with `%`, or when so many rows match that a scan is cheaper.

**What is the height of a B+ tree with fan-out 100 holding a million keys?** About three levels, since 100³ = 1,000,000. Each lookup reads one page per level, so three index pages plus the row's page.

**What happens when a B+ tree node overflows?** It splits in two. A leaf copies its new right half's first key up to the parent; an internal node moves its middle key up. If the root splits, a new root is created and the tree grows by one level.

**Why should the primary key of an InnoDB table be short?** Every secondary index stores the primary key in each entry, so a long primary key makes every index larger. A short, increasing key such as an auto-increment integer also appends to the end of the clustered index instead of splitting pages in the middle.

Next, the databases that are not relational at all: [SQL vs NoSQL Databases](/notes/dbms/sql-vs-nosql). Index design is examined in the [SQL (Intermediate) skill test](/skill-tests/sql-intermediate).
