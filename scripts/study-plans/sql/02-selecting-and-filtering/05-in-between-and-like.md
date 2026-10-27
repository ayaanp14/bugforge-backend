---
title: IN, BETWEEN and LIKE — lists, ranges and patterns
minutes: 15
seo-title: SQL IN, BETWEEN and LIKE Operators with Wildcards
description: Filter SQL rows by a list with IN, an inclusive range with BETWEEN and a text pattern with LIKE wildcards, plus the NOT IN NULL trap and escaping.
question: What do IN, BETWEEN and LIKE do in SQL?
answer: They are shorthand conditions for the WHERE clause. `IN (a, b, c)` is true when a value equals any item in the list. `BETWEEN low AND high` is true for values in the range, both ends included. `LIKE` matches text against a pattern in which `%` stands for any run of characters and `_` for exactly one character, as in `name LIKE 'A%'`.
q: Is BETWEEN inclusive in SQL?
a: Yes. `x BETWEEN 10 AND 20` means `x >= 10 AND x <= 20`, so both 10 and 20 match. The low value must come first: `BETWEEN 20 AND 10` matches nothing. On DATETIME columns an inclusive end date misses most of the last day, so use a half-open range there.
q: Why does NOT IN return no rows when the list contains NULL?
a: `x NOT IN (1, NULL)` means `x <> 1 AND x <> NULL`, and `x <> NULL` is unknown, so the whole condition is never true and no rows are returned. This bites with `NOT IN (SELECT …)` when the subquery can return a NULL; filter NULLs out of the subquery or use `NOT EXISTS`.
q: What is the difference between % and _ in SQL LIKE?
a: `%` matches any sequence of characters, including none, and `_` matches exactly one character. `'A%'` matches every string starting with A, while `'A_'` matches only two-character strings starting with A. `'%an%'` finds an anywhere in the string.
q: How do you search for a literal % or _ with LIKE?
a: Escape it. In MySQL a backslash escapes by default, as in `LIKE '50\%'`, and any database accepts an explicit escape character with `ESCAPE`, as in `LIKE '50!%' ESCAPE '!'`. Without escaping, `%` and `_` are wildcards.
q: Is LIKE case sensitive in MySQL?
a: Not with MySQL's default case-insensitive collations, so `name LIKE 'a%'` matches 'Asha'. Use a case-sensitive or binary collation to change that. PostgreSQL's LIKE is case-sensitive and it offers ILIKE for the insensitive form.
---
Three conditions come up so often that SQL gives them their own syntax. `IN` tests a value against a **list**, `BETWEEN` against a **range**, and `LIKE` against a text **pattern**. Each could be written with `=`, `>=` and `OR`, but the shorthand is shorter, clearer and, for `LIKE`, impossible to replace otherwise. Each also has a trap: `NOT IN` with a NULL, `BETWEEN` on timestamps, and wildcards that need escaping.

## IN: one of a list

```sql
SELECT name, category
FROM products
WHERE category IN ('books', 'games', 'music')
ORDER BY name;
```

`x IN (a, b, c)` is exactly `x = a OR x = b OR x = c`, written once. The list can hold numbers, strings or dates — of the column's type — and can be as long as you need:

```sql
WHERE order_id IN (101, 205, 317)
WHERE status NOT IN ('cancelled', 'refunded')
```

`NOT IN` is the negation: `x <> a AND x <> b AND …`. The list can also be a **subquery** — `WHERE customer_id IN (SELECT customer_id FROM orders)` — which is the subqueries module's business, and the reason the next section matters.

### The NOT IN NULL trap

Expand `NOT IN` with a NULL in the list:

```sql
WHERE dept_id NOT IN (10, NULL)
-- means
WHERE dept_id <> 10 AND dept_id <> NULL
```

`dept_id <> NULL` is unknown for every row, and `anything AND unknown` is never true. The query returns **no rows at all**, silently. Nobody writes a literal NULL in a list on purpose, but `NOT IN (SELECT manager_id FROM employees)` returns NULL whenever one employee has no manager — and the query that worked yesterday returns nothing today. This is one of the most-asked SQL interview questions. The fixes come in the subqueries module (`NOT EXISTS`, or filtering the NULLs out); the thing to remember now is that **`NOT IN` and NULLs do not mix**.

`IN` itself is tolerant: `dept_id IN (10, NULL)` is `dept_id = 10 OR dept_id = NULL`, which is true for 10 and unknown otherwise — the NULL in the list just never matches. And a NULL on the left (`NULL IN (…)`) is unknown, so such a row is excluded by both `IN` and `NOT IN`.

## BETWEEN: an inclusive range

```sql
SELECT name, price
FROM products
WHERE price BETWEEN 500 AND 1000
ORDER BY price, name;
```

`x BETWEEN low AND high` is `x >= low AND x <= high` — **both ends included**. A product priced exactly 500 or exactly 1000 is in. Points to remember:

- The low end comes first. `BETWEEN 1000 AND 500` is `x >= 1000 AND x <= 500`, which matches nothing.
- `NOT BETWEEN low AND high` is `x < low OR x > high`.
- It works on text and dates as well as numbers: `name BETWEEN 'A' AND 'M'` — though note that `'Mohan'` is *after* `'M'` and so excluded; the upper end of a text range is easy to get wrong.

Dates in `DATE` columns are fine:

```sql
WHERE order_date BETWEEN '2024-03-01' AND '2024-03-31'
```

On a `DATETIME` column, though, `'2024-03-31'` means midnight at the start of the 31st, so almost the whole last day is missed. For timestamps use the half-open range from the previous lesson: `>= '2024-03-01' AND < '2024-04-01'`. Many teams simply avoid `BETWEEN` for time for that reason.

## LIKE: text patterns

```sql
SELECT name, email
FROM customers
WHERE email LIKE '%@gmail.com'
ORDER BY name;
```

`LIKE` compares text against a **pattern** with two wildcards:

| Wildcard | Matches | Example | Matches |
| --- | --- | --- | --- |
| `%` | any run of characters, including none | `'A%'` | Asha, Arjun, A |
| `_` | exactly one character | `'_at'` | cat, bat — not at, not chat |

Common shapes:

```sql
WHERE name LIKE 'S%'        -- starts with S
WHERE name LIKE '%a'        -- ends with a
WHERE name LIKE '%an%'      -- contains "an"
WHERE code LIKE 'CS___'     -- CS followed by exactly three characters
WHERE name LIKE '_a%'       -- second letter is a
WHERE phone NOT LIKE '+91%' -- not an Indian number
```

Without a wildcard, `LIKE 'Pune'` is just an equality test — use `=`.

**Case.** With MySQL's default collations `LIKE` is case-insensitive: `'a%'` matches `Asha`. PostgreSQL's `LIKE` is case-sensitive and adds `ILIKE` for the insensitive form; SQLite's is insensitive for ASCII letters.

**Escaping.** To find a literal `%` or `_` — a discount code like `50%OFF`, a file name with an underscore — escape it. MySQL treats backslash as the escape character by default; any database accepts an explicit one:

```sql
WHERE code LIKE '50\%%'                 -- MySQL: starts with "50%"
WHERE code LIKE '50!%%' ESCAPE '!'      -- portable
WHERE file_name LIKE '%\_v2%'           -- contains "_v2"
```

An unescaped `_` in a pattern is a common silent bug: `LIKE 'user_1%'` also matches `userA1`.

**NULL.** `NULL LIKE 'a%'` is unknown, so NULL values match neither `LIKE` nor `NOT LIKE`.

### LIKE and indexes

A pattern with a fixed **prefix** — `'Sha%'` — can use an index on the column, because matching strings sit together in sorted order. A **leading wildcard** — `'%sha'`, `'%sha%'` — cannot: the database must test every row. For searching words inside long text, databases offer **full-text search** (MySQL's `MATCH … AGAINST` on a `FULLTEXT` index), which this course mentions but does not judge.

## Putting them together

```sql
SELECT product_id, name, category, price
FROM products
WHERE category IN ('books', 'games')
  AND price BETWEEN 200 AND 800
  AND name NOT LIKE '%(used)%'
ORDER BY price DESC, product_id;
```

Each is an ordinary condition and combines with `AND`, `OR` and `NOT` under the rules of the previous lesson — `IN` and `BETWEEN` bind like comparisons, tighter than `NOT`, `AND` and `OR`.

## Key takeaways

- `x IN (a, b, c)` = `x = a OR x = b OR x = c`; `NOT IN` = all `<>` joined by `AND`.
- **`NOT IN` with a NULL in the list returns no rows** — watch subqueries that can return NULL.
- `BETWEEN low AND high` includes both ends; low first; use half-open ranges for timestamps.
- `LIKE`: `%` any run (even empty), `_` exactly one character; case-insensitive by default in MySQL.
- Escape a literal `%`/`_` with `\` in MySQL or `ESCAPE '!'` anywhere.
- NULL matches none of `IN`, `NOT IN`, `LIKE`, `NOT LIKE`; leading `%` defeats an index.
