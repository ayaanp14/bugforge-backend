---
title: Expressions in SELECT — arithmetic, text and computed columns
minutes: 14
seo-title: SQL Calculated Columns: Arithmetic, DIV, MOD and CONCAT
description: Compute new columns in a SQL SELECT: arithmetic and precedence, decimal division versus DIV, MOD, ROUND, CONCAT for text, and what NULL does to an expression.
question: How do you create a calculated column in SQL?
answer: Write an expression in the SELECT list and give it an alias: `SELECT name, price * qty AS line_total FROM order_items`. The database evaluates the expression for every row, using the row's column values, and returns the result as a new column. Expressions can use arithmetic, functions such as `ROUND` and `CONCAT`, and literals; the stored table does not change.
q: What is the difference between / and DIV in MySQL?
a: In MySQL `/` is decimal division, so `7 / 2` is 3.5000, and `DIV` is integer division that discards the fraction, so `7 DIV 2` is 3. PostgreSQL, SQLite and SQL Server instead do integer division when both operands of `/` are integers.
q: How do you get the remainder of a division in SQL?
a: Use `MOD(a, b)`, or the operator form `a % b` or `a MOD b` in MySQL. `MOD(17, 5)` is 2. Combined with `DIV`, it splits a quantity into units, such as `minutes DIV 60` hours and `minutes MOD 60` minutes.
q: What happens when you do arithmetic with NULL in SQL?
a: The result is NULL. NULL means an unknown value, so `price * NULL`, `NULL + 1` and `CONCAT('a', NULL)` are all NULL. Use `COALESCE(column, 0)` or `IFNULL` to substitute a value when a missing number should count as zero.
q: How do you round a number in a MySQL query?
a: Use `ROUND(x, d)` to round to `d` decimal places, as in `ROUND(price * 1.18, 2)`. `ROUND(x)` rounds to a whole number, and halves of exact values round away from zero. `FLOOR` and `CEIL` round down and up, and `TRUNCATE(x, d)` cuts off digits without rounding.
---
A select list is not limited to stored columns. Any **expression** — arithmetic on columns, a function call, a piece of text built from several columns — can stand there, and the database evaluates it once for every row. Calculated columns are how a query turns raw data into the numbers a report needs: line totals, prices with tax, ages, durations, labels. This lesson covers the arithmetic operators and their precedence, MySQL's division rules (an interview favourite), rounding, building text with `CONCAT`, and the one rule that catches everyone: anything combined with NULL is NULL.

## Arithmetic on columns

```sql
SELECT name,
       price,
       qty,
       price * qty AS line_total,
       price * qty - discount AS net
FROM order_items
ORDER BY item_id;
```

For each row, the database substitutes that row's values and computes. The operators are the familiar ones: `+`, `-`, `*`, `/`, plus `DIV` and `%`/`MOD` below. Unary minus works too: `-price`.

**Precedence** follows mathematics — `*`, `/`, `DIV` and `%` bind tighter than `+` and `-`, and operators of equal rank go left to right:

```sql
SELECT 2 + 3 * 4   AS a,    -- 14
       (2 + 3) * 4 AS b,    -- 20
       10 - 4 - 3  AS c;    -- 3, not 9
```

When in doubt, parenthesise. A reader should not need to remember the table.

## Division: / versus DIV

This is where dialects disagree, and where interview questions like to probe.

```sql
SELECT 7 / 2     AS decimal_div,   -- MySQL: 3.5000
       7 DIV 2   AS integer_div,   -- 3
       -7 DIV 2  AS neg_div,       -- -3 (truncates toward zero)
       7 % 2     AS remainder,     -- 1
       MOD(7, 2) AS remainder2;    -- 1
```

- In **MySQL**, `/` always produces a decimal result, even for two integers. By default it shows four extra digits of scale, which is why `7 / 2` prints as `3.5000`.
- `DIV` is MySQL's **integer division**: it discards the fraction.
- In **PostgreSQL, SQLite and SQL Server**, `/` between two integers is integer division: `7 / 2` is `3`. To get 3.5 there you write `7.0 / 2` or cast. A query that computes a percentage as `passed / total * 100` returns 0 for every row on those systems — and the right answer on MySQL.
- Division by zero returns **NULL** in MySQL (with a warning), and raises an error in PostgreSQL and SQL Server.

Remainders: `MOD(a, b)`, `a % b` and `a MOD b` are the same in MySQL. Together with `DIV` they split a quantity into units:

```sql
SELECT duration_min,
       duration_min DIV 60 AS hours,
       duration_min MOD 60 AS minutes
FROM calls;
```

```text
duration_min | hours | minutes
135 | 2 | 15
59 | 0 | 59
```

## Rounding

Money and averages need a fixed number of decimal places:

```sql
SELECT ROUND(1234.5678, 2) AS r2,    -- 1234.57
       ROUND(1234.5678)    AS r0,    -- 1235
       ROUND(1234.5678, -2) AS r_2,  -- 1200
       FLOOR(4.7) AS f,              -- 4
       CEIL(4.2)  AS c,              -- 5
       TRUNCATE(4.78, 1) AS t;       -- 4.7
```

`ROUND(x, d)` rounds to `d` places; a negative `d` rounds to tens, hundreds. For exact values (integers and `DECIMAL` columns) MySQL rounds halves away from zero: `ROUND(2.5)` is 3. `FLOOR` goes down, `CEIL` (or `CEILING`) up, and `TRUNCATE` cuts digits off without rounding.

Round in the **last** step. `ROUND(price, 2) * qty` multiplies an already-rounded price and accumulates error; `ROUND(price * qty, 2)` rounds once.

A note on types: store money as `DECIMAL(10,2)` (exact) or as integer paise/cents — never as `FLOAT`, whose binary fractions make `0.1 + 0.2` slightly more than `0.3`.

## Building text

In MySQL, text is joined with `CONCAT`:

```sql
SELECT CONCAT(first_name, ' ', last_name) AS full_name,
       CONCAT(name, ' (', city, ')')      AS label,
       CONCAT('EMP-', emp_id)             AS code
FROM employees;
```

```text
full_name | label | code
Asha Rao | Asha (Pune) | EMP-1
```

Numbers passed to `CONCAT` are converted to text. `CONCAT_WS(sep, a, b, …)` joins with a separator and skips NULL arguments: `CONCAT_WS(', ', city, state, country)`. Remember from the first module that `||` is **not** concatenation in MySQL. The functions module covers `UPPER`, `SUBSTRING`, `LPAD` and the rest.

## Literals

A literal in the select list repeats on every row:

```sql
SELECT name, 'INR' AS currency, 18 AS gst_rate, price * 18 / 100 AS gst
FROM products;
```

Literals are useful as labels, as constant columns that a later `UNION` needs, and in expressions. Numeric literals can be integers (`18`), decimals (`0.18`) or scientific (`1.8e-1`, a floating-point value); text literals take single quotes.

## Comparisons are expressions too

A comparison produces a value. In MySQL it is `1` (true), `0` (false) or `NULL` (unknown):

```sql
SELECT name, price, price > 1000 AS is_premium FROM products;
```

```text
name | price | is_premium
Monitor | 9000 | 1
Mouse | 600 | 0
```

That is how MySQL represents booleans — `TRUE` is just `1`. PostgreSQL would print `t`/`f`; SQL Server does not allow a bare comparison in the select list at all (you write `CASE WHEN price > 1000 THEN 1 ELSE 0 END`). The same comparisons are what `WHERE` uses to filter, in the next lesson.

## NULL poisons expressions

`NULL` means "no value / unknown". Any arithmetic or concatenation that involves it returns `NULL`:

```sql
SELECT 100 + NULL      AS a,   -- NULL
       NULL * 0        AS b,   -- NULL (not 0)
       CONCAT('x', NULL) AS c; -- NULL
```

So a row whose `discount` is NULL has a NULL `price - discount`. When a missing number should count as zero, substitute it:

```sql
SELECT name, price - COALESCE(discount, 0) AS net FROM products;
```

`COALESCE(a, b, …)` returns its first non-NULL argument (`IFNULL(a, b)` is MySQL's two-argument version). NULLs get a whole module later; for now, recognise the symptom — a computed column that is unexpectedly NULL — and the cure.

## Expressions everywhere

Expressions are not special to `SELECT`. The same syntax works in `WHERE` (`WHERE price * qty > 100`), `ORDER BY` (`ORDER BY price * qty DESC`), `GROUP BY` and inside aggregates (`SUM(price * qty)`). Only the alias is clause-specific.

## Key takeaways

- Any expression can be a result column; give it an alias. It is computed per row and stores nothing.
- `*`, `/`, `DIV`, `%` bind tighter than `+`, `-`; parenthesise for clarity.
- MySQL's `/` is **decimal** division (`7 / 2` = 3.5); `DIV` is integer division; elsewhere `/` on integers truncates. Division by zero is NULL in MySQL.
- `ROUND(x, d)`, `FLOOR`, `CEIL`, `TRUNCATE`; round in the last step; money in `DECIMAL`.
- Join text with `CONCAT` / `CONCAT_WS`; comparisons yield 1, 0 or NULL.
- Anything combined with NULL is NULL — `COALESCE(col, 0)` substitutes a value.
