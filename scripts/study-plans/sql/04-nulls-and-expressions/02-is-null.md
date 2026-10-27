---
title: IS NULL, IS NOT NULL and NULL-safe equality
minutes: 13
seo-title: SQL IS NULL vs = NULL: IS NOT NULL and NULL-Safe Equality
description: Test for NULL in SQL with IS NULL and IS NOT NULL, never = NULL. MySQL NULL-safe equality, IS DISTINCT FROM elsewhere, and finding changed values.
question: How do you check for NULL in SQL?
answer: Use `IS NULL` or `IS NOT NULL`: `WHERE phone IS NULL` finds rows with no phone. These are the only comparisons that return plain true or false for a NULL. Writing `phone = NULL` is a mistake that matches no rows, because any comparison with NULL is UNKNOWN. MySQL also offers `<=>`, an equality that treats two NULLs as equal.
q: What is the difference between = NULL and IS NULL?
a: `col = NULL` compares with an unknown value, so it is UNKNOWN for every row and `WHERE col = NULL` returns nothing, without an error. `col IS NULL` is a dedicated test that is TRUE when the column holds no value and FALSE otherwise. Always use `IS NULL`.
q: What does the <=> operator do in MySQL?
a: `<=>` is MySQL's NULL-safe equality. It behaves like `=` for ordinary values but returns 1 when both sides are NULL and 0 when only one side is, never NULL. `NOT (a <=> b)` therefore finds rows where two nullable columns differ, NULLs included.
q: What is IS DISTINCT FROM in SQL?
a: `a IS DISTINCT FROM b` is the SQL standard's NULL-safe inequality: true when the values differ or exactly one is NULL, false when they are equal or both NULL. PostgreSQL, SQL Server 2022 and SQLite support it; MySQL does not, and writes `NOT (a <=> b)` instead.
q: Does IS NULL find empty strings?
a: No. An empty string `''` is a value, so `col IS NULL` is false for it. To treat blanks as missing, test both: `WHERE col IS NULL OR col = ''`, or convert blanks first with `NULLIF(col, '')`. Oracle is the exception, since it stores `''` as NULL.
---
The previous lesson showed that `= NULL` is never true. So how *do* you find the rows where a value is missing? SQL has a dedicated predicate for exactly that, `IS NULL`, and its opposite, `IS NOT NULL`. They are the most used NULL tools in everyday SQL, and the quickest way to fail an interview question is to write `= NULL` instead. This lesson covers both predicates, combining them with other conditions, MySQL's NULL-safe equality operator `<=>`, the standard's `IS DISTINCT FROM`, the `IS TRUE` family, and the classic "which values changed" query.

## IS NULL and IS NOT NULL

```sql
-- Customers who never gave a phone number
SELECT id, name
FROM customers
WHERE phone IS NULL;

-- Customers we can call
SELECT id, name, phone
FROM customers
WHERE phone IS NOT NULL;
```

Unlike a comparison, `IS NULL` never returns UNKNOWN: it is TRUE when the expression has no value and FALSE when it has one. Together, `IS NULL` and `IS NOT NULL` split a table cleanly into two parts with no row left over — which `=` and `<>` cannot do.

Both predicates work on any expression, not just a column. Because NULL spreads through arithmetic, `qty * unit_price IS NULL` is true when either factor is missing, and `CONCAT(first_name, last_name) IS NULL` is true when either name is (in MySQL).

`IS NOT NULL` is also how you *exclude* missing values before ranking or comparing:

```sql
-- The three smallest real discounts (NULLs would otherwise sort first)
SELECT name, discount
FROM products
WHERE discount IS NOT NULL
ORDER BY discount, id
LIMIT 3;
```

## The `= NULL` mistake

```sql
SELECT id FROM customers WHERE phone = NULL;     -- always empty
SELECT id FROM customers WHERE phone != NULL;    -- also always empty
```

Neither statement is an error. MySQL runs them happily and returns no rows, because the condition is UNKNOWN for every row. That silence is what makes the bug dangerous: a report built on `= NULL` looks fine and is simply missing data. The same mistake hides in an `UPDATE … WHERE col = NULL` that updates nothing. Make `IS NULL` a reflex.

(SQL Server has a legacy setting, `ANSI_NULLS OFF`, under which `= NULL` worked; it is deprecated, and nothing in MySQL behaves that way.)

## Combining with other conditions

`IS NULL` usually appears inside a larger condition, and the three-valued rules decide how it combines. The pattern you met in the previous lesson keeps NULL rows on purpose:

```sql
-- Everyone not in Sales, including people with no department
WHERE dept <> 'Sales' OR dept IS NULL
```

For a NULL dept the first part is UNKNOWN and the second TRUE, and `UNKNOWN OR TRUE` is TRUE. Mind the parentheses when you mix `AND` and `OR`, because `AND` binds tighter:

```sql
-- Wrong: means  city = 'Pune' AND phone IS NULL,  OR  email IS NULL (any city)
WHERE city = 'Pune' AND phone IS NULL OR email IS NULL

-- Right: Pune customers missing a phone or an email
WHERE city = 'Pune' AND (phone IS NULL OR email IS NULL)
```

`IS NULL` also makes a good sort key. In MySQL `col IS NULL` is `1` or `0`, which is how `ORDER BY col IS NULL, col` pushed NULLs to the end in the sorting module; `ORDER BY (email IS NULL AND phone IS NULL) DESC` puts customers missing both at the top.

## NULL-safe equality: `<=>`

Sometimes you want two NULLs to count as equal — when comparing an old and a new version of a row, for instance. MySQL has an operator for it, `<=>`, sometimes called the spaceship operator:

| a | b | `a = b` | `a <=> b` |
| --- | --- | --- | --- |
| 5 | 5 | 1 | 1 |
| 5 | 6 | 0 | 0 |
| 5 | NULL | NULL | 0 |
| NULL | NULL | NULL | 1 |

`<=>` never returns NULL. That makes "did this value change?" a one-liner:

```sql
-- Products whose price changed, where NULL → 80 and 70 → NULL both count as changes
SELECT sku, old_price, new_price
FROM price_changes
WHERE NOT (old_price <=> new_price);
```

With plain `<>`, the rows that went from NULL to a price, or from a price to NULL, would vanish (`NULL <> 80` is UNKNOWN). Without `<=>` you would need the long form:

```sql
WHERE old_price <> new_price
   OR (old_price IS NULL AND new_price IS NOT NULL)
   OR (old_price IS NOT NULL AND new_price IS NULL)
```

`col <=> NULL` is also a valid, if unusual, way of writing `col IS NULL`.

## The standard spelling: IS DISTINCT FROM

The SQL standard expresses the same idea in words: `a IS DISTINCT FROM b` (NULL-safe "not equal") and `a IS NOT DISTINCT FROM b` (NULL-safe "equal"). PostgreSQL, SQLite and SQL Server 2022 support them; MySQL does not, and uses `<=>`. In an interview, naming both shows you know the problem rather than one vendor's syntax.

## MySQL's ISNULL() and the IS TRUE family

MySQL has a function form, `ISNULL(expr)`, returning `1` when the expression is NULL and `0` otherwise — the same as `expr IS NULL`. Do not confuse it with SQL Server's `ISNULL(a, b)`, which takes two arguments and means "a, or b if a is NULL" (MySQL calls that `IFNULL`, next lesson). Same name, different function — a favourite trick question.

The standard also lets you test a condition's truth value directly: `cond IS TRUE`, `IS FALSE`, `IS UNKNOWN`, and their `IS NOT` forms. They never return UNKNOWN themselves:

```sql
SELECT (NULL > 1) IS UNKNOWN,   -- 1
       (NULL > 1) IS NOT TRUE,  -- 1
       (5 > 1) IS TRUE;         -- 1
```

`WHERE (discount > 10) IS NOT TRUE` keeps rows where the discount is 10 or less *and* rows where it is NULL — the honest complement of `WHERE discount > 10`. MySQL supports all of these; they are rare in practice but show up in theory questions.

## Before you move on

- Test for missing values with `IS NULL` / `IS NOT NULL`, never `= NULL`.
- `IS NULL` is never UNKNOWN, so it splits rows cleanly.
- Parenthesise `OR` when you mix it with `AND`.
- MySQL's `<=>` is NULL-safe equality; `NOT (a <=> b)` finds changed values.
- The standard spells it `IS [NOT] DISTINCT FROM`; MySQL's `ISNULL(x)` is not SQL Server's `ISNULL(a, b)`.
