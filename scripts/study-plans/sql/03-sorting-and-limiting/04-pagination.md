---
title: Pagination — offset pages and keyset pages
minutes: 15
seo-title: SQL Pagination: LIMIT OFFSET vs Keyset (Seek) Pagination
description: Paginate SQL results with LIMIT and OFFSET, page = (n - 1) times size, or with keyset pagination that seeks past the last row seen. Why deep offsets are slow.
question: How do you paginate results in SQL?
answer: Sort by a unique order, then take one page at a time. Offset pagination uses `LIMIT size OFFSET (page - 1) * size`. Keyset (seek) pagination remembers the last row shown and asks for rows after it, as in `WHERE id > :last_id ORDER BY id LIMIT size`. Offset is simple and allows jumping to page 40; keyset stays fast however deep you go.
q: Why is OFFSET pagination slow for large offsets?
a: The database cannot jump to row 100,000. To return `LIMIT 20 OFFSET 100000` it has to produce and discard the first hundred thousand rows of the sorted result, so each deeper page costs more. Keyset pagination starts from an indexed position instead and reads only the rows it returns.
q: What is keyset pagination?
a: Keyset or seek pagination fetches the next page by filtering on the sort key of the last row already shown, instead of counting rows to skip: `WHERE (created_at, id) < (:last_created, :last_id) ORDER BY created_at DESC, id DESC LIMIT 20`. With an index on the sort columns, every page costs about the same.
q: Why do rows repeat or go missing between pages?
a: Either the sort is not unique, so tied rows can swap places between the two queries, or rows were inserted or deleted between page requests, shifting every offset. Ending the ORDER BY with a unique key fixes the first; keyset pagination avoids most of the second.
q: How do I calculate the OFFSET for a page number?
a: For 1-based page numbers, `OFFSET = (page - 1) * page_size`. Page 1 skips nothing, page 2 skips one page, and page 3 of a 10-row page size uses `LIMIT 10 OFFSET 20`. The number of pages is the row count divided by the page size, rounded up.
---
Every list that can grow — search results, an order history, a feed, an admin table — is shown a page at a time. Fetching ten thousand rows to display twenty wastes the database, the network and the browser, so the query itself should return just the page. SQL has no `PAGE` keyword; you build pages out of `ORDER BY` and `LIMIT`. There are two ways to do it, offset pagination and keyset pagination, and choosing between them is a favourite backend-interview question because it touches correctness, performance and API design at once. This lesson covers both, the formula for offsets, the duplicate-and-missing-rows bug, and when each approach is right.

## Offset pagination

The direct approach numbers the pages and skips the earlier ones:

```sql
-- Page 3, ten rows a page
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 10 OFFSET 20;
```

For 1-based page numbers the offset is

```text
offset = (page - 1) * page_size
```

so page 1 uses `OFFSET 0`, page 2 `OFFSET 10`, page 3 `OFFSET 20`. In application code the numbers are passed as parameters — `LIMIT ? OFFSET ?` — and validated first: a page below 1, a page size of 10,000 or a negative number should be rejected or clamped, not handed to the database.

The total number of pages is the row count divided by the page size, rounded up: 45 rows at 10 a page is 5 pages, the last holding 5 rows. Counting rows is `SELECT COUNT(*) …`, which arrives with aggregation in a later module; many applications skip the exact count and simply show "next" while the page came back full.

Offset pagination is easy to build and lets the user jump straight to page 40. It has two problems.

## Problem one: an order that is not unique

Suppose posts are sorted only by `created_at` and three posts share the timestamp at the boundary between pages 1 and 2. The database may order those three differently for the query of page 1 and the query of page 2 — they are separate queries, and ties have no defined order. One post can then appear on both pages while another appears on neither. The user never sees the second post; a test that walks every page counts one row twice.

The fix is the rule from the multi-key lesson: **end the sort with a unique key**.

```sql
ORDER BY created_at DESC, id DESC
```

Now every row has exactly one position, and the pages partition the result cleanly — as long as the data does not change.

## Problem two: data that changes, and deep pages

Between the request for page 1 and page 2, a new post arrives at the top. Every row shifts down by one, so the last row of page 1 becomes the first row of page 2 and is shown twice. A deleted row does the opposite: one row moves up into page 1 after you have already left it and is never seen. For a feed that updates constantly, offset pages are visibly wrong.

And they get slower the deeper you go. To answer `LIMIT 10 OFFSET 100000`, the database cannot jump to position 100,000 — positions only exist after sorting. It must produce the first 100,010 rows in order and throw 100,000 of them away. Page 1 is fast, page 10,000 is not, and a crawler walking every page makes the database do quadratic work in total.

## Keyset pagination

Keyset pagination, also called **seek** or **cursor** pagination, stops counting rows. Instead it remembers where the last page ended and asks for the rows after that point:

```sql
-- First page
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 10;

-- Next page: the last row shown had created_at = '2024-05-02', id = 731
SELECT id, title, created_at
FROM posts
WHERE created_at < '2024-05-02'
   OR (created_at = '2024-05-02' AND id < 731)
ORDER BY created_at DESC, id DESC
LIMIT 10;
```

The `WHERE` says "strictly after the last row in this sort order": an earlier timestamp, or the same timestamp with a smaller id. Its shape mirrors the `ORDER BY` key for key — the first key strictly past, or the first key equal and the second strictly past. Get the comparison direction from the sort direction: with `DESC` keys "after" means `<`, with `ASC` keys it means `>`.

When all keys run in the same direction, MySQL, PostgreSQL and SQLite accept a shorter **row value** comparison that means the same thing:

```sql
WHERE (created_at, id) < ('2024-05-02', 731)
```

Row values compare left to right like the sort itself. They cannot express mixed directions (`score DESC, id ASC`), so for those write the expanded `OR` form.

With an index on `(created_at, id)`, the database seeks straight to the boundary and reads ten rows, so page 10,000 costs what page 1 costs. Inserted and deleted rows no longer shift anything: the next page always starts right after the last row the user actually saw.

## What keyset pagination costs

You cannot jump to page 40, because a page is defined by the row before it — the interface becomes "next" and "previous" (or infinite scroll), and the API hands the client an opaque **cursor** holding the last row's sort values. The sort key must be unique (hence the id), and the columns must not be NULL, or the `<` comparisons silently drop rows. "Previous page" is the same query with the comparison and the sort flipped, then the page reversed for display.

## Choosing

| Situation | Use |
| --- | --- |
| Admin table, small data, "go to page 7" | Offset |
| Search results people rarely page deep into | Offset, with a maximum page |
| Feeds, timelines, infinite scroll | Keyset |
| APIs that export everything page by page | Keyset |
| Data that changes while people browse | Keyset |

Both need the same foundation: an `ORDER BY` that ends in a unique key. Without it neither approach is correct.

## Before you move on

- Offset pages: `LIMIT size OFFSET (page - 1) * size`.
- A non-unique sort makes rows repeat or vanish between pages; add the primary key.
- Deep offsets read and discard every skipped row.
- Keyset pages filter past the last row seen: `WHERE key < last OR (key = last AND id < last_id)`.
- Row values `(a, b) < (x, y)` work when every key has the same direction.
