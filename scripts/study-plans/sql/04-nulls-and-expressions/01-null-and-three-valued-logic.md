---
title: NULL and three-valued logic
minutes: 15
seo-title: What Is NULL in SQL? Three-Valued Logic and UNKNOWN
description: NULL in SQL is a missing value, not zero or an empty string. Comparisons with NULL give UNKNOWN, WHERE keeps only TRUE, and AND, OR and NOT follow suit.
question: What is NULL in SQL?
answer: NULL is SQL's marker for a missing or unknown value. It is not zero, not an empty string and not false. Any arithmetic with NULL gives NULL, and any comparison with NULL — even `NULL = NULL` — gives UNKNOWN rather than true or false. Because WHERE keeps only rows whose condition is true, rows with NULLs silently drop out of comparisons.
q: Why does NULL = NULL not return true in SQL?
a: NULL means "unknown", and two unknown values cannot be known to be equal, so `NULL = NULL` evaluates to UNKNOWN, which MySQL shows as NULL. WHERE treats UNKNOWN like false, so `WHERE col = NULL` never matches anything. Use `col IS NULL` to test for NULL.
q: What is three-valued logic in SQL?
a: SQL conditions have three possible values: TRUE, FALSE and UNKNOWN, the result of comparing with NULL. AND is false if either side is false, OR is true if either side is true, NOT UNKNOWN is UNKNOWN, and every other combination involving UNKNOWN is UNKNOWN. WHERE, HAVING and ON keep only rows that are TRUE.
q: Why does WHERE col != 'x' skip rows where col is NULL?
a: For a NULL row, `col != 'x'` is UNKNOWN, not TRUE, so WHERE drops it. If rows with no value should count as "not x", say so: `WHERE col <> 'x' OR col IS NULL`. It is one of the most common SQL bugs in reports.
q: Is NULL the same as zero or an empty string?
a: No. Zero is a known number and `''` is a known empty string; NULL means no value at all. `0 = 0` and `'' = ''` are true, while `NULL = NULL` is UNKNOWN. Oracle is the exception that treats `''` as NULL; MySQL, PostgreSQL and SQL Server do not.
q: What is NULL + 1 in SQL?
a: NULL. Arithmetic on an unknown value has an unknown result, so `NULL + 1`, `NULL * 0` and `price * NULL` are all NULL. The same holds for most functions, including MySQL's `CONCAT`, which returns NULL if any argument is NULL.
---
Real data has gaps. A customer never gave a phone number, a product has not been priced yet, an employee has no manager because she runs the company, a sensor missed a reading. SQL represents every one of those gaps with a single marker, `NULL`, and gives it rules unlike any other value. Most surprising query results — rows that vanish from a filter, totals that come out empty, a `NOT IN` that returns nothing — trace back to those rules. This lesson explains what NULL is, how it spreads through expressions, and **three-valued logic**, the reason conditions involving NULL are neither true nor false.

## NULL is not a value

`NULL` is a marker that says "there is no value here". It is not zero, not the empty string `''`, not `false` and not the text `'NULL'`:

| Stored | Meaning |
| --- | --- |
| `0` | The discount is known: zero. |
| `''` | The middle name is known: there isn't one. |
| `NULL` | Nobody recorded the discount (or the middle name). |

That distinction matters. "Average discount" should count a known zero and ignore an unknown; "customers without a middle name" is a different list from "customers whose middle name we never asked for". A column declared `NOT NULL` can never hold the marker, which is why schema design (a later module) cares so much about which columns allow it. One dialect note interviewers like: Oracle stores an empty string as NULL, so in Oracle `''` *is* NULL. MySQL, PostgreSQL, SQL Server and SQLite keep the two apart.

## NULL spreads through expressions

If a value is unknown, anything computed from it is unknown too:

```sql
SELECT 5 + NULL      AS a,   -- NULL
       NULL * 0      AS b,   -- NULL, even times zero
       10 / NULL     AS c,   -- NULL
       CONCAT('Hi ', NULL) AS d;  -- NULL in MySQL
```

| a | b | c | d |
| --- | --- | --- | --- |
| NULL | NULL | NULL | NULL |

So a line total `qty * unit_price` is NULL whenever either factor is missing, and a full name built with `CONCAT(first_name, ' ', last_name)` is NULL for everyone without a last name. (PostgreSQL's `||` behaves the same; `CONCAT` in PostgreSQL and SQL Server skips NULLs instead — one of the dialect differences that bites when queries move between databases.) The functions in the next lessons exist largely to stop this spread on purpose.

## Comparisons give UNKNOWN

What is `NULL = 5`? The left side is unknown, so whether it equals 5 is unknown. SQL's answer is neither TRUE nor FALSE but a third truth value, **UNKNOWN**. MySQL displays UNKNOWN as `NULL`, because its booleans are numbers (`1` true, `0` false) and the unknown one is NULL:

```sql
SELECT 5 = 5     AS t,     -- 1
       5 = 6     AS f,     -- 0
       NULL = 5  AS u1,    -- NULL (unknown)
       NULL = NULL AS u2,  -- NULL — not 1!
       NULL <> 5 AS u3;    -- NULL
```

`NULL = NULL` being unknown is the rule people find strangest, and it follows directly: two unknown values cannot be known to be equal. Every comparison operator — `=`, `<>`, `!=`, `<`, `>`, `<=`, `>=`, `BETWEEN`, `LIKE`, `IN` — returns UNKNOWN when a NULL is involved in the comparison it makes.

## WHERE keeps only TRUE

A `WHERE` clause keeps a row when its condition is **TRUE**. FALSE and UNKNOWN are both thrown away. That one sentence explains most NULL surprises:

```sql
SELECT name FROM employees WHERE dept = 'Sales';    -- NULL-dept rows: unknown → dropped
SELECT name FROM employees WHERE dept <> 'Sales';   -- NULL-dept rows: unknown → dropped too!
```

Run both and add up the rows: employees with no department appear in neither. They are not "Sales" and not "not Sales", as far as SQL can tell. If the business meaning is "everyone except Sales, including people with no department", write the NULL case out:

```sql
SELECT name
FROM employees
WHERE dept <> 'Sales' OR dept IS NULL;
```

`IS NULL` is the one test that answers a plain yes or no about NULL — it gets its own lesson next. For now remember that `dept = NULL` is not a test at all: it is UNKNOWN for every row, so `WHERE dept = NULL` returns nothing, silently.

## The three-valued truth tables

When conditions are combined, UNKNOWN combines by a simple principle: **if the known parts already decide the answer, the unknown part does not matter; otherwise the answer is unknown.**

`AND` is false as soon as one side is false, and `OR` is true as soon as one side is true:

@figure truth-tables

And `NOT UNKNOWN` is UNKNOWN — negating an unknown fact does not make it known. That is why wrapping a condition in `NOT` never brings NULL rows back:

```sql
-- Neither of these returns rows whose discount is NULL
SELECT name FROM products WHERE discount > 10;
SELECT name FROM products WHERE NOT (discount > 10);
```

In MySQL you can see the tables directly: `SELECT NULL AND 0, NULL OR 1, NULL AND 1, NOT NULL` returns `0, 1, NULL, NULL`.

## The NOT IN trap

`IN` is a chain of `=` joined with `OR`, so `x IN (1, 2, NULL)` means `x = 1 OR x = 2 OR x = NULL`. For `x = 1` that is TRUE (one TRUE in an OR decides it). For `x = 3` it is `FALSE OR FALSE OR UNKNOWN` = UNKNOWN.

`NOT IN` flips it into a chain of `<>` joined with `AND`: `x <> 1 AND x <> 2 AND x <> NULL`. The last part is always UNKNOWN, so the whole condition can never be TRUE:

```sql
SELECT id FROM orders WHERE customer_id NOT IN (1, 2, NULL);   -- no rows, ever
```

With literal lists you would rarely write that NULL, but it arrives the moment the list comes from a subquery over a nullable column — the famous "NOT IN returns nothing" bug, which the subqueries module covers properly.

## Where else NULL behaves differently

Some parts of SQL treat NULLs as *alike* rather than unknown — a practical exception to the comparison rule:

- `DISTINCT` keeps one NULL, treating all NULLs as duplicates of each other.
- `ORDER BY` puts all NULLs together (first ascending in MySQL, as you saw).
- `GROUP BY` (later) puts all NULLs in one group.
- Aggregates such as `SUM` and `AVG` skip NULLs; `COUNT(col)` counts only non-NULL values while `COUNT(*)` counts rows.

Knowing which rule applies where — "unknown" in comparisons, "the same" in grouping and sorting — is the whole skill.

## Before you move on

- NULL means "no value"; it is not 0, `''` or false.
- Arithmetic and most functions with a NULL input give NULL.
- Every comparison with NULL, including `NULL = NULL`, gives UNKNOWN.
- WHERE keeps only TRUE rows, so NULL rows fall out of both `=` and `<>`.
- AND with FALSE is FALSE, OR with TRUE is TRUE, everything else touching UNKNOWN stays UNKNOWN.
