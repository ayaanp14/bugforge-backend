---
title: ORDER BY — putting rows in order
minutes: 14
seo-title: SQL ORDER BY Explained: ASC, DESC and Where NULLs Sort
description: SQL ORDER BY sorts a query's rows ascending or descending by a column, an alias or an expression. Why rows have no order without it, and where NULLs go.
question: What does ORDER BY do in SQL?
answer: ORDER BY sorts the rows a query returns. You name one or more sort keys — a column, a SELECT alias or an expression — each ascending (`ASC`, the default) or descending (`DESC`). It runs after SELECT, so aliases work in it. Without ORDER BY a database promises no row order at all, so any output that must be ordered needs one.
q: Is ORDER BY ASC or DESC by default?
a: Ascending. `ORDER BY price` and `ORDER BY price ASC` mean the same thing: smallest numbers, earliest dates and alphabetically first strings come first. Write `DESC` after a key to reverse that key only.
q: Where do NULL values go in ORDER BY in MySQL?
a: MySQL treats NULL as lower than every value, so NULLs come first in an ascending sort and last in a descending one. PostgreSQL and Oracle do the opposite. To force NULLs last in MySQL, sort on `col IS NULL` first: `ORDER BY col IS NULL, col`.
q: Can I use a column alias in ORDER BY?
a: Yes. ORDER BY is evaluated after the SELECT list, so `SELECT price * qty AS total … ORDER BY total DESC` works in MySQL, PostgreSQL, SQLite and SQL Server. WHERE runs before SELECT, which is why the same alias fails there.
q: Why does my query return rows in a different order each time?
a: Because it has no ORDER BY. A table is a set of rows with no inherent order, and the engine returns them in whatever order its plan produces — insertion order today, index order after an index is added. Only ORDER BY guarantees an order.
q: Can I ORDER BY a column that is not in the SELECT list?
a: Yes, in a plain query: `SELECT name FROM products ORDER BY price DESC` is valid. The exception is a `SELECT DISTINCT`, where the sort key must appear in the select list, because one distinct row may stand for several rows with different values.
---
A table is a set of rows, and a set has no order. When you write `SELECT name FROM products`, the database hands back the rows in whatever order is cheapest for it — often the order they were inserted, sometimes the order of an index it happened to use, sometimes something else after the table has been updated a few times. That order is an accident of storage, not a promise. The moment the order of the rows matters to you — a price list, a leaderboard, the newest orders first, or an exercise judged line by line — the query needs an `ORDER BY` clause. This lesson covers how it works, ascending and descending keys, sorting by aliases, expressions and positions, where NULLs land, and how strings compare.

## The clause and its place

`ORDER BY` comes after `WHERE` (and, later in the course, after `GROUP BY` and `HAVING`), and before `LIMIT`:

```sql
SELECT name, price
FROM products
WHERE in_stock = 1
ORDER BY price;
```

| name | price |
| --- | ---: |
| pencil | 5 |
| notebook | 40 |
| backpack | 900 |

The keyword is followed by a **sort key**. Rows are compared on that key and put in ascending order: smallest number first, earliest date first, alphabetically first string first. `ASC` says that explicitly; it is the default, so `ORDER BY price` and `ORDER BY price ASC` are the same query.

Remember the logical order in which a query is processed: `FROM` → `WHERE` → `SELECT` → `ORDER BY` → `LIMIT`. Sorting happens **after** the select list has been computed and **after** filtering. Two consequences follow. First, `ORDER BY` only ever sorts the rows that survived `WHERE` — it cannot bring filtered rows back. Second, because the select list already exists when sorting starts, `ORDER BY` can refer to its aliases.

## Descending order

Write `DESC` after a key to reverse it:

```sql
SELECT name, price
FROM products
ORDER BY price DESC;
```

@figure sort-rows

`DESC` belongs to the one key it follows, not to the whole clause — that matters as soon as there are several keys, which is the next lesson. A common slip is writing `ORDER BY DESC price`; the direction always comes after the key.

## Sorting by an alias or an expression

Any expression can be a sort key, and so can a name from the select list:

```sql
SELECT name, price, qty, price * qty AS stock_value
FROM products
ORDER BY stock_value DESC;
```

That works because the alias `stock_value` exists by the time the sort runs. The same alias in `WHERE stock_value > 100` fails, because `WHERE` runs before `SELECT` — a classic interview question about the logical processing order. You can also sort by the expression itself, written out again, even if it is not selected:

```sql
SELECT name
FROM products
ORDER BY price * qty DESC;
```

Sorting on a column you do not display is perfectly legal in an ordinary query: `SELECT name FROM employees ORDER BY hire_date` lists names oldest-hire first. The one exception is `SELECT DISTINCT`: there the sort key must be in the select list, because after duplicates are removed one output row may stand for several input rows with different `hire_date` values, and the database cannot tell which one to sort by. MySQL refuses such a query with an error mentioning the select list; PostgreSQL does too.

## Sorting by position

`ORDER BY 2` means "by the second column of the select list":

```sql
SELECT name, price FROM products ORDER BY 2 DESC;
```

It is short, and you will see it in quick ad-hoc queries and in some interview answers. It is also fragile: add a column to the front of the select list and the query silently sorts by something else. In code that lives longer than a minute, name the column or alias instead.

## Where NULLs go

A `NULL` is "no value", so where should it sort? The standard leaves it to the vendor, and the vendors disagree — which is exactly why interviewers ask.

| Database | `ASC` | `DESC` |
| --- | --- | --- |
| MySQL, SQLite, SQL Server | NULLs first | NULLs last |
| PostgreSQL, Oracle | NULLs last | NULLs first |

MySQL behaves as if NULL were smaller than every value:

```sql
SELECT name, discount FROM products ORDER BY discount;
```

| name | discount |
| --- | ---: |
| pencil | NULL |
| backpack | 5 |
| notebook | 10 |

PostgreSQL and Oracle let you say what you want with `NULLS FIRST` / `NULLS LAST`. MySQL has no such syntax, so the MySQL idiom is to sort on a second, hidden key first: the expression `discount IS NULL`, which is `0` for a real value and `1` for a NULL.

```sql
-- MySQL: real discounts ascending, NULLs at the end
SELECT name, discount
FROM products
ORDER BY discount IS NULL, discount;
```

| name | discount |
| --- | ---: |
| backpack | 5 |
| notebook | 10 |
| pencil | NULL |

The rows are sorted by the first key (`0` before `1`, so values before NULLs), and within each group by `discount`. That pattern — prefix a boolean key to move a class of rows to one end — comes back in the next lesson for custom orders.

## How strings and dates compare

Numbers compare as numbers. Strings compare character by character according to the column's **collation** — the rules for which characters sort before which. MySQL 8's default collation (`utf8mb4_0900_ai_ci`) is case-insensitive and accent-insensitive, so `'apple'`, `'Apple'` and `'APPLE'` sort as equals. SQLite and PostgreSQL's common defaults compare by code point, where every uppercase letter comes before every lowercase one, so `'Zebra'` sorts before `'apple'`. If an interview asks why the same `ORDER BY name` returns a different order on two databases, collation is the answer.

Two traps follow from comparing strings as strings. A number stored in a text column sorts as text: `'10'` comes before `'9'`, because `'1'` is less than `'9'`. And a date stored as text sorts correctly only in `'YYYY-MM-DD'` form, where text order and time order agree — `'03/01/2024'` style dates do not. Real `DATE` columns, the ones you should use, sort by time.

## Ties and determinism

When two rows have the same sort key, `ORDER BY` says nothing about which comes first. The database may return them in either order, and the order can change between runs. If a printed result must be exactly reproducible — and every judged exercise in this course is — break the tie with another key, ideally one that is unique such as the primary key:

```sql
SELECT name, price
FROM products
ORDER BY price DESC, id;
```

The next lesson is about exactly that: sorting on several keys.

## Before you move on

- Without `ORDER BY`, row order is undefined; never rely on insertion order.
- `ASC` is the default; `DESC` applies to the one key it follows.
- `ORDER BY` runs after `SELECT`, so aliases work there but not in `WHERE`.
- MySQL puts NULLs first ascending and last descending; `ORDER BY col IS NULL, col` moves them to the end.
- Collation decides how strings compare, and text numbers sort as text.
