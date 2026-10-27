---
title: GROUP_CONCAT — a group's values as one string
minutes: 12
seo-title: Concatenate Grouped Values in MySQL: Separator and Order By
description: MySQL's group concat function joins a group's values into one string with DISTINCT, ORDER BY and SEPARATOR. The 1024-character limit, NULLs and other databases.
question: What does GROUP_CONCAT do in MySQL?
answer: `GROUP_CONCAT` is an aggregate function that joins the values of a group into one string, separated by commas by default. `GROUP_CONCAT(DISTINCT product ORDER BY product SEPARATOR ', ')` lists each group's different products in alphabetical order. It skips NULLs, and its result is cut at 1,024 characters unless `group_concat_max_len` is raised. PostgreSQL and SQL Server call it `STRING_AGG`.
q: How do I change the separator in GROUP_CONCAT?
a: Add `SEPARATOR` as the last part inside the parentheses: `GROUP_CONCAT(name SEPARATOR '; ')`. The default is a comma with no space. `SEPARATOR ''` joins the values with nothing between them, which is handy for building codes or initials.
q: How do I sort the values inside GROUP_CONCAT?
a: Put `ORDER BY` inside the function call, before any `SEPARATOR`: `GROUP_CONCAT(name ORDER BY name SEPARATOR ', ')`. Without it the order of the values is whatever order MySQL read the rows in, which can change. The query's outer `ORDER BY` sorts the groups, not the values within one string.
q: Why is my GROUP_CONCAT result cut off?
a: MySQL limits the result to `group_concat_max_len` characters, 1,024 by default, and silently truncates anything longer with only a warning. Raise it for the session with `SET SESSION group_concat_max_len = 100000;` before the query. Long lists are often better returned as rows anyway.
q: What is the equivalent of GROUP_CONCAT in PostgreSQL and SQL Server?
a: Both use `STRING_AGG(value, separator)`. In PostgreSQL the order goes inside, `STRING_AGG(name, ', ' ORDER BY name)`; SQL Server 2017 and later use `STRING_AGG(name, ', ') WITHIN GROUP (ORDER BY name)`. Oracle's version is `LISTAGG`. None of them has a default separator, so it must always be given.
---
Aggregates so far have returned numbers: a count, a total, an average. Sometimes the answer a report wants is the **list** itself: the products in each order, the skills of each candidate, the days a user was active, the tags on a post. `GROUP_CONCAT` is MySQL's aggregate for that — it joins a group's values into a single string. It is also behind a well-known interview question: *for each date, the number of different products sold and their names in alphabetical order*.

## The basics

```sql
SELECT order_id,
       GROUP_CONCAT(product) AS products
FROM order_lines
GROUP BY order_id
ORDER BY order_id;
```

```text
order_id | products
1 | pen,ink,paper
2 | stapler
```

Like every aggregate, `GROUP_CONCAT` returns one value per group. The values are joined with a **comma and no space** by default, and their order inside the string is not guaranteed — `pen,ink,paper` is just the order the rows were read in.

## The full form

```sql
GROUP_CONCAT([DISTINCT] expr [ORDER BY sort_expr [ASC|DESC]] [SEPARATOR 'text'])
```

All three options go **inside** the parentheses, in that order:

```sql
SELECT order_id,
       GROUP_CONCAT(DISTINCT product ORDER BY product SEPARATOR ', ') AS products
FROM order_lines
GROUP BY order_id
ORDER BY order_id;
```

```text
order_id | products
1 | ink, paper, pen
2 | stapler
```

- `DISTINCT` drops repeated values within the group, so an order with two lines of `pen` lists it once.
- `ORDER BY` sorts the values inside the string. It is independent of the query's own `ORDER BY`, which sorts the groups. Always write it when the output is compared or shown to people — the stored order is not an order.
- `SEPARATOR` sets the text between values. `SEPARATOR ''` joins with nothing.

The `ORDER BY` inside can sort by a different column from the one listed — `GROUP_CONCAT(product ORDER BY added_at)` lists products in the order they were added — and by several keys, `ORDER BY qty DESC, product`.

## The interview classic: products sold by date

Given a table of `(sell_date, product)` rows with repeats, return for each date the number of **different** products and their names, sorted, comma-separated:

```sql
SELECT sell_date,
       COUNT(DISTINCT product)                                   AS num_sold,
       GROUP_CONCAT(DISTINCT product ORDER BY product SEPARATOR ',') AS products
FROM activities
GROUP BY sell_date
ORDER BY sell_date;
```

```text
sell_date | num_sold | products
2020-05-30 | 3 | Basketball,Headphone,T-shirt
2020-06-01 | 2 | Bible,Pencil
2020-06-02 | 1 | Mask
```

Three things make it right: `DISTINCT` in both functions (a product sold twice on one day counts once), `ORDER BY` inside `GROUP_CONCAT`, and `ORDER BY sell_date` for the rows.

## Concatenating expressions

The argument can be any expression, so each item can be built from several columns:

```sql
SELECT customer_id,
       GROUP_CONCAT(CONCAT(product, ' x', qty) ORDER BY product SEPARATOR '; ') AS basket
FROM order_lines
GROUP BY customer_id
ORDER BY customer_id;
```

```text
customer_id | basket
7 | ink x2; pen x1
```

MySQL also accepts several arguments — `GROUP_CONCAT(product, ':', qty)` concatenates them per row — but the `CONCAT` form is clearer and behaves the same.

## NULLs

`GROUP_CONCAT` skips NULL values, like the other aggregates. If every value in a group is NULL — or the group's item expression is NULL for every row, as happens when `CONCAT` meets a NULL column — the result is NULL rather than an empty string. A group of *no* rows never exists in `GROUP BY`, so that case only appears in a whole-table `GROUP_CONCAT` with a `WHERE` that matches nothing.

```sql
SELECT team, COALESCE(GROUP_CONCAT(nickname ORDER BY nickname), '(none)') AS nicknames
FROM players
GROUP BY team
ORDER BY team;
```

## The length limit

The result of `GROUP_CONCAT` is capped at `group_concat_max_len` characters, **1,024 by default**. Longer results are cut silently — MySQL only raises a warning that applications rarely read. A list of a thousand order ids will come back as roughly the first two hundred. The fix is a session setting before the query:

```sql
SET SESSION group_concat_max_len = 1000000;
```

That limit is also a hint about design: `GROUP_CONCAT` is for short, human-readable lists in reports. When a program needs the items, return them as rows and let the program group them.

## Not a substitute for rows

A comma-separated list is convenient to read and awkward to use: you cannot join to it, index it or filter it reliably (`WHERE products LIKE '%pen%'` also matches `pencil`). Store data as rows, one value per row — the first rule of normalisation (Module 12) — and use `GROUP_CONCAT` only at the very end of a query, to present the result. The reverse operation, splitting a stored comma list back into rows, is much harder in MySQL than avoiding the list in the first place.

## Other databases

| Database | Function |
| --- | --- |
| MySQL, MariaDB, SQLite | `GROUP_CONCAT(x ORDER BY x SEPARATOR ', ')` (SQLite: `GROUP_CONCAT(x, ', ')`) |
| PostgreSQL | `STRING_AGG(x, ', ' ORDER BY x)` |
| SQL Server 2017+ | `STRING_AGG(x, ', ') WITHIN GROUP (ORDER BY x)` |
| Oracle | `LISTAGG(x, ', ') WITHIN GROUP (ORDER BY x)` |

`STRING_AGG` has no default separator — it must be given — and has no `DISTINCT` in SQL Server, where you de-duplicate in a subquery first. PostgreSQL also has `ARRAY_AGG`, which builds a real array rather than a string.

## Pitfalls

- No `ORDER BY` inside the call, so the list's order changes between runs.
- Putting `SEPARATOR` before `ORDER BY` — it must come last.
- Forgetting `DISTINCT` when the same value appears on several rows.
- Silent truncation at 1,024 characters.
- Storing comma-separated lists instead of rows.

## Key takeaways

- `GROUP_CONCAT` joins a group's values into one string, comma-separated by default.
- `DISTINCT`, `ORDER BY` and `SEPARATOR` go inside the call, in that order.
- NULLs are skipped; an all-NULL group gives NULL.
- Results are cut at `group_concat_max_len` (1,024) characters.
- PostgreSQL and SQL Server spell it `STRING_AGG`; Oracle `LISTAGG`.
