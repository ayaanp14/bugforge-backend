---
title: COALESCE, IFNULL and NULLIF
minutes: 14
seo-title: SQL COALESCE vs IFNULL vs NULLIF: Replacing NULL in MySQL
description: COALESCE returns its first non-NULL argument, IFNULL is MySQL's two-argument form, and NULLIF turns a value into NULL — the guard against division by zero.
question: What does COALESCE do in SQL?
answer: COALESCE returns the first of its arguments that is not NULL, or NULL if they all are. `COALESCE(nickname, first_name, 'Guest')` shows the nickname when there is one, the first name otherwise, and 'Guest' as the last resort. It is standard SQL, works in every major database, takes any number of arguments and stops evaluating at the first non-NULL one.
q: What is the difference between COALESCE and IFNULL?
a: `IFNULL(a, b)` is MySQL's two-argument shortcut for `COALESCE(a, b)`: it returns `a` unless `a` is NULL. COALESCE is standard and accepts any number of arguments. SQL Server's equivalent of IFNULL is `ISNULL(a, b)` and Oracle's is `NVL(a, b)`; COALESCE works in all of them.
q: What does NULLIF do in SQL?
a: `NULLIF(a, b)` returns NULL when `a` equals `b` and returns `a` otherwise. It turns a placeholder into a real NULL — `NULLIF(phone, '')` makes blank phones NULL — and protects divisions: `clicks / NULLIF(views, 0)` gives NULL instead of a division-by-zero error.
q: How do I avoid division by zero in SQL?
a: Divide by `NULLIF(divisor, 0)`. When the divisor is 0 it becomes NULL, and dividing by NULL gives NULL instead of failing. MySQL already returns NULL for `x / 0` in a SELECT, but PostgreSQL, SQL Server and Oracle raise an error, so NULLIF is the portable habit. Wrap the result in COALESCE if you want 0 instead of NULL.
q: How do I replace NULL with 0 in a MySQL query?
a: Use `COALESCE(col, 0)` or `IFNULL(col, 0)` in the SELECT list: `SELECT name, COALESCE(bonus, 0) AS bonus FROM employees`. This only changes what the query shows; the stored value stays NULL. Replace only where 0 really means the same as missing, since it changes averages and comparisons.
---
Knowing that NULLs spread through expressions and fall out of filters is half the story. The other half is controlling them: showing a sensible default instead of a blank, treating a missing quantity as zero in a sum, or — the opposite direction — turning a meaningless placeholder like an empty string or a zero divisor *into* NULL so it stops causing damage. Three small functions do all of this: `COALESCE`, `IFNULL` and `NULLIF`. They appear in nearly every real reporting query and in many interview answers, and their cousins in other databases (`ISNULL`, `NVL`) are a reliable source of trick questions.

## COALESCE: the first non-NULL value

`COALESCE(a, b, c, …)` looks at its arguments from left to right and returns the first one that is not NULL. If every argument is NULL, the result is NULL.

```sql
SELECT id,
       COALESCE(nickname, first_name, 'Guest') AS display_name
FROM users;
```

| id | display_name |
| ---: | --- |
| 1 | ace |
| 2 | Bela |
| 3 | Guest |

User 1 has a nickname, user 2 has only a first name, user 3 has neither. COALESCE reads like "use this, or else that, or else this default" — a chain of fallbacks of any length.

The commonest use is a default for display or arithmetic:

```sql
-- Treat a missing bonus as no bonus
SELECT name, salary + COALESCE(bonus, 0) AS total_pay
FROM employees;
```

Without COALESCE, `salary + bonus` would be NULL for everyone whose bonus was never set. Two cautions. First, the substitution exists only in the query's output; the table still holds NULL. Second, choose the default deliberately: replacing a missing test score with 0 makes the student look like they failed, and averaging those zeros drags the class average down. Sometimes NULL *is* the honest answer.

COALESCE is evaluated lazily — it stops at the first non-NULL argument — and it is standard SQL, supported by MySQL, PostgreSQL, SQL Server, Oracle and SQLite alike. When in doubt, use it.

## IFNULL: the two-argument shortcut

`IFNULL(a, b)` is MySQL's name for the two-argument case: `a` unless `a` is NULL, in which case `b`.

```sql
SELECT name, IFNULL(phone, 'no phone') AS phone
FROM customers;
```

It is exactly `COALESCE(a, b)`. Every database has its own spelling for this, and interviewers love to ask which is which:

| Database | Two-argument form | Standard form |
| --- | --- | --- |
| MySQL, SQLite | `IFNULL(a, b)` | `COALESCE(…)` |
| SQL Server | `ISNULL(a, b)` | `COALESCE(…)` |
| Oracle | `NVL(a, b)` | `COALESCE(…)` |
| PostgreSQL | — | `COALESCE(…)` |

Note the clash: in MySQL `ISNULL(x)` takes **one** argument and returns 1 or 0, while in SQL Server `ISNULL(a, b)` takes two and returns a value. Writing `COALESCE` avoids the whole question.

## NULLIF: turning a value into NULL

`NULLIF(a, b)` goes the other way. It returns NULL when `a = b`, and `a` otherwise:

```sql
SELECT NULLIF(5, 5),    -- NULL
       NULLIF(5, 3),    -- 5
       NULLIF('', ''),  -- NULL
       NULLIF(NULL, 1); -- NULL (a was already NULL)
```

Why would you *want* a NULL? Because many systems store placeholders that mean "missing" — an empty string from a web form, `0` or `-1` for "not measured", `'N/A'` typed by hand. NULLIF turns them into a real NULL, so the NULL rules (and the COALESCE defaults) apply to them too:

```sql
-- Blank nicknames should fall back to the first name as well
SELECT COALESCE(NULLIF(nickname, ''), first_name, 'Guest') AS display_name
FROM users;
```

Read it inside out: an empty nickname becomes NULL, and then COALESCE skips it. The `COALESCE(NULLIF(x, ''), default)` combination is one of the most useful idioms in SQL.

## Guarding a division with NULLIF

The other classic use of NULLIF is protecting a division:

```sql
SELECT name,
       ROUND(clicks / NULLIF(views, 0), 2) AS ctr
FROM campaigns;
```

When `views` is 0, `NULLIF(views, 0)` is NULL, and `clicks / NULL` is NULL — a campaign with no views has no click-through rate, rather than an infinite one. How much this matters depends on the database:

- **MySQL** returns NULL for `x / 0` in a SELECT (with a warning), so the guard is not strictly needed there — but data-changing statements in strict mode can raise an error instead.
- **PostgreSQL, SQL Server and Oracle** raise a *division by zero* error that aborts the whole query.

So `/ NULLIF(d, 0)` is the portable habit, and writing it shows an interviewer you have been bitten before. If the report should show 0 instead of NULL, wrap the whole thing: `COALESCE(clicks / NULLIF(views, 0), 0)`. And if the numerator might be NULL as well — clicks never recorded — decide what that means: `COALESCE(clicks, 0) / NULLIF(views, 0)` treats it as zero clicks.

## Mixing types

The result of COALESCE takes a type that can hold all of its arguments. Mixing a number with a string makes the result a string in MySQL, which then sorts as text:

```sql
SELECT COALESCE(score, 'absent') AS score FROM results;  -- a string column now
```

That is fine for display and bad for sorting or arithmetic. Keep the arguments of one type where you can, and use a separate column or a `CASE` expression (next lesson) when a numeric column needs a text label.

## Outside the SELECT list

Like every function, these work anywhere an expression is allowed. In `ORDER BY`, COALESCE decides where NULLs sort by giving them a stand-in value:

```sql
-- Products without a discount sort as if their discount were 0
SELECT name, discount
FROM products
ORDER BY COALESCE(discount, 0) DESC, id;
```

In `WHERE`, it folds the NULL case into a comparison. `WHERE COALESCE(dept, '') <> 'Sales'` keeps employees with no department, because their NULL becomes `''`, which is not `'Sales'` — a shorter spelling of `dept <> 'Sales' OR dept IS NULL`. Shorter is not always better here: wrapping a column in a function stops MySQL from using an index on that column for the comparison, so on a large table the explicit `OR … IS NULL` form is usually the faster one. The indexes module comes back to this rule, which has a name: keep predicates *sargable*.

## COALESCE is a CASE in disguise

The standard defines COALESCE as shorthand for a CASE expression, which the next lesson teaches:

```sql
COALESCE(a, b, c)
-- means
CASE WHEN a IS NOT NULL THEN a
     WHEN b IS NOT NULL THEN b
     ELSE c
END
```

and `NULLIF(a, b)` as `CASE WHEN a = b THEN NULL ELSE a END`. Knowing the expansion helps when a rule is more complicated than "first non-NULL" — a CASE can test any condition, not only NULL — and it answers the interview question "how would you write COALESCE without COALESCE?".

## Before you move on

- `COALESCE(a, b, …)` returns the first non-NULL argument; it is standard everywhere.
- `IFNULL(a, b)` is MySQL's two-argument form; SQL Server says `ISNULL`, Oracle `NVL`.
- `NULLIF(a, b)` returns NULL when the two are equal — it turns placeholders into NULL.
- `COALESCE(NULLIF(x, ''), default)` treats blanks as missing.
- Divide by `NULLIF(d, 0)` to avoid division-by-zero errors outside MySQL.
