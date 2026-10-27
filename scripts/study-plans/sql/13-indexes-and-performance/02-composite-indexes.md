---
title: Composite indexes and the leftmost prefix
minutes: 15
seo-title: MySQL Composite Index and the Leftmost Prefix Rule
description: A composite index sorts by its first column, then the next. Which queries the leftmost prefix rule serves, why column order matters, and where a range stops.
question: What is the leftmost prefix rule for a composite index?
answer: The leftmost prefix rule says a composite (multi-column) index can be searched only through a prefix of its columns, starting from the first. An index on (a, b, c) serves filters on a, on a and b, or on a, b and c, but not a filter on b or c alone, because the entries are sorted by a first and b only within each a.
q: How should I order the columns of a composite index?
a: Put columns compared with equality first and the column used for a range or ORDER BY after them, because a range stops the seek from using later columns. Among equality columns, choose the order that lets the index serve the most queries' leftmost prefixes; selectivity matters less than prefix reuse.
q: Does an index on (a, b) make an index on (a) redundant?
a: Yes, for B-tree lookups. Any query that can use an index on a alone can use the leading column of (a, b), so the single-column index only costs writes and memory. The reverse is not true: an index on (b) is not covered by (a, b).
q: Can MySQL use a composite index when the first column is not in the WHERE clause?
a: Usually not for a seek. Since MySQL 8.0.13 the optimizer can sometimes use an index skip scan, which seeks once per distinct value of the missing leading column, but only when that column has few distinct values. It may also scan the whole index if the index covers the query, which is cheaper than the table but still a full scan.
q: Does the order of conditions in the WHERE clause matter for a composite index?
a: No. The optimizer matches conditions to index columns by column, not by their order in the text, so WHERE b = 2 AND a = 1 uses an index on (a, b) exactly as WHERE a = 1 AND b = 2 does. Only the order of columns inside the index definition matters.
---
Real queries filter on more than one column: a customer's orders in a date range, a city's users by signup date, a product's reviews by rating. One index per column is not the answer — MySQL generally searches one index per table, and intersecting two (`index_merge`) is a fallback, not a plan you design for. The tool is a **composite index**, one B+tree over several columns. This lesson explains how its entries are ordered, the leftmost prefix rule that follows from it, how a range condition changes things, and how to choose the column order.

## How the entries are sorted

A composite index sorts by its first column; among equal first values, by the second; among equal pairs, by the third — exactly like a phone book sorted by surname, then first name.

```sql
CREATE INDEX idx_orders_cust_date ON orders (customer_id, placed_on);
```

```text
idx_orders_cust_date (customer_id, placed_on) → id
  (3, 2024-02-14) → 17
  (3, 2024-03-02) → 21
  (3, 2024-03-19) → 30
  (5, 2024-01-07) → 4
  (5, 2024-03-11) → 26
  (7, 2024-03-02) → 22
```

Everything else follows from this picture. Customer 3's orders sit together, and within them the dates are in order. But the dates **across** customers are not in order — 2024-03-02 appears twice, far apart.

## The leftmost prefix rule

An index on `(a, b, c)` can be **searched** through any leftmost prefix of its columns:

| Filter | Uses the index to seek? |
| --- | --- |
| `a = 1` | yes — prefix (a) |
| `a = 1 AND b = 2` | yes — prefix (a, b) |
| `a = 1 AND b = 2 AND c = 3` | yes — all three |
| `b = 2` | no — the b values are scattered |
| `b = 2 AND c = 3` | no |
| `a = 1 AND c = 3` | partly — seeks on a, then filters c |

The last row is the subtle one: with `b` missing, the server seeks to `a = 1` and then has to examine every entry for that `a`, testing `c`. MySQL does that test inside the index rather than after fetching each row — **index condition pushdown**, shown as `Using index condition` in a plan — but it is still reading all of `a = 1`'s entries.

The order of conditions in the `WHERE` clause is irrelevant: `WHERE b = 2 AND a = 1` matches `(a, b)` just as well. Only the order **inside the index definition** matters.

Two corollaries interviewers like:

- an index on `(a)` is **redundant** next to one on `(a, b)` — drop it;
- an index on `(b)` is **not** redundant next to `(a, b)` — it serves queries the composite cannot.

## A range stops the seek

Once a column is compared with a **range** (`<`, `>`, `BETWEEN`, `LIKE 'abc%'`), the columns after it can no longer narrow the seek, because within a range of `a` values the `b` values are not sorted.

```sql
-- index (customer_id, placed_on, status)

WHERE customer_id = 3 AND placed_on >= '2024-03-01' AND status = 'paid'
-- seek: customer_id = 3, placed_on from 2024-03-01 onwards (two columns)
-- status: tested on each entry in that range, not used to seek
```

The rule of thumb that falls out: **equality columns first, then the one range column.** If the query above is common, `(customer_id, status, placed_on)` serves it fully — two equalities, then the range — and reads only the matching entries.

## Sorting comes for free — when the prefix fits

Because the entries are already in order, a composite index can also satisfy `ORDER BY` without a sort step:

```sql
SELECT id, placed_on, amount
FROM orders
WHERE customer_id = 3
ORDER BY placed_on;          -- index (customer_id, placed_on): no filesort
```

The equality on `customer_id` fixes the first column, and the remaining entries come out ordered by `placed_on`. `ORDER BY placed_on DESC` works too: InnoDB reads the leaves backwards (`Backward index scan` in the plan). MySQL 8 also supports **descending index columns**, `(customer_id, placed_on DESC)`, which matter when one query sorts the columns in mixed directions, such as `ORDER BY a ASC, b DESC`.

Remove the equality and the order breaks: `ORDER BY placed_on` alone across all customers cannot read this index in order, so the server sorts (`Using filesort`).

## Choosing the column order

There is no single rule, but these questions settle almost every case:

1. **Which columns are compared with equality?** They go first.
2. **Which column is the range or the sort?** It goes last among the useful columns.
3. **Which prefixes do other queries need?** Order the equality columns so that the index's prefixes serve as many queries as possible — one well-ordered index often replaces three.
4. **Only then, selectivity.** Putting the most selective column first is common advice, but prefix reuse matters more: an index on `(country, city)` serves "all of India" and "Pune, India"; `(city, country)` serves only the second.

```sql
-- queries:  WHERE tenant_id = ? AND created_at >= ?
--           WHERE tenant_id = ? AND user_id = ?
--           WHERE tenant_id = ?
-- one index for the first and third, one for the second:
CREATE INDEX idx_events_tenant_time ON events (tenant_id, created_at);
CREATE INDEX idx_events_tenant_user ON events (tenant_id, user_id);
```

## Skip scan: the exception, not the plan

MySQL 8.0.13 added the **index skip scan**: with an index on `(gender, birth_date)` and a filter on `birth_date` alone, the optimizer may seek once for each distinct `gender` value and range-scan inside each. It only pays off when the skipped leading column has very few distinct values, and it shows as `Using index for skip scan`. Design for the leftmost prefix; treat a skip scan as a happy accident. PostgreSQL 18 added a similar skip scan for B-tree indexes; older PostgreSQL versions could scan a multicolumn index for a non-leading column, but much less efficiently.

## Limits worth knowing

- An InnoDB index can have at most **16 columns**, and its key size is capped (3,072 bytes with the default row format) — long `VARCHAR`s can need a **prefix index**, `INDEX (title(40))`, which cannot cover a query or serve `ORDER BY title`.
- Every secondary entry also carries the **primary key**, so `(a, b)` on a table keyed by `id` is effectively `(a, b, id)` — which is why `WHERE a = 1 ORDER BY id` can avoid a sort.
- More columns mean a bigger index and more write work. Add a column because a query needs it, not in case one might.

## Practise

The first exercise creates a composite index and runs the customer-and-date-range query it is built for. The second works the leftmost prefix rule out in SQL: given each index's columns in order and each query's equality filters, compute how many leading columns each index can seek on.
