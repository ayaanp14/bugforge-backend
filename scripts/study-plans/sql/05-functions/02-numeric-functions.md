---
title: Numeric functions — ROUND, CEIL, FLOOR, MOD and division
minutes: 13
seo-title: MySQL ROUND, CEIL, FLOOR and TRUNCATE: Numeric Functions
description: MySQL rounds with ROUND, CEIL, FLOOR and TRUNCATE, divides with / and DIV, and takes remainders with MOD. Integer division in other databases and money types.
question: What is the difference between ROUND, CEIL, FLOOR and TRUNCATE in MySQL?
answer: All four turn a number into one with fewer decimals, in different directions. `ROUND(x, d)` goes to the nearest value with `d` decimals, halves away from zero. `CEIL` goes up to the next whole number, `FLOOR` down to the previous one, and `TRUNCATE(x, d)` simply cuts the extra digits off, which moves towards zero. For negative numbers `FLOOR` and `TRUNCATE` differ.
q: Why does 5/2 return 2 in some databases and 2.5 in MySQL?
a: MySQL's `/` always performs decimal division, so `5/2` is `2.5000`. PostgreSQL, SQL Server and SQLite divide two integers as integers and drop the fraction, giving `2`. To get a decimal answer there, make one side a decimal, as in `5 * 1.0 / 2` or `CAST(5 AS DECIMAL) / 2`.
q: How do I do integer division in MySQL?
a: Use the `DIV` operator: `7 DIV 2` is `3`. It truncates the result towards zero. `FLOOR(7 / 2)` gives the same answer for positive numbers, but for negative ones `FLOOR` rounds down while `DIV` truncates, so `-7 DIV 2` is `-3` and `FLOOR(-7 / 2)` is `-4`.
q: What does MOD do in SQL?
a: `MOD(a, b)`, also written `a % b` or `a MOD b`, returns the remainder after dividing `a` by `b`. It is used to test even and odd numbers with `MOD(n, 2) = 0`, to cycle through groups, and to find leftovers. Dividing by zero returns NULL in MySQL rather than raising an error.
q: Should I store money as FLOAT or DECIMAL?
a: Store money as `DECIMAL(p, s)`, such as `DECIMAL(10, 2)`. `FLOAT` and `DOUBLE` are binary approximations, so values like 0.1 cannot be stored exactly and sums drift by tiny amounts. `DECIMAL` stores the digits exactly, which keeps totals and comparisons right.
---
Numbers rarely leave a database exactly as they are stored. A price gets tax added and needs two decimals; an average needs rounding before anyone reads it; a count of items has to become a count of pages; a sequence number has to be sorted into one of four buckets. This lesson covers MySQL's arithmetic, the four rounding functions and how they differ, division in its decimal and integer forms, remainders, and the handful of other numeric functions that turn up in interview questions.

## Arithmetic and the decimal `/`

The operators are the usual ones: `+`, `-`, `*`, `/`, plus `DIV` and `MOD` (also `%`). Arithmetic works on columns and literals alike and follows normal precedence.

```sql
SELECT name, price, qty, price * qty AS line_total
FROM order_lines
ORDER BY name;
```

The one operator to watch is `/`. In MySQL it is **always decimal division**:

```sql
SELECT 5 / 2, 6 / 3, 1 / 3;
```

```text
5 / 2 | 6 / 3 | 1 / 3
2.5 | 2 | 0.3333
```

MySQL shows `2.5000`, `2.0000` and `0.3333` — four decimal places by default (`div_precision_increment`); this course prints numbers with trailing zeros dropped. In **PostgreSQL, SQL Server and SQLite**, dividing two integers is integer division: `5 / 2` is `2`, and `1 / 3` is `0`. That difference produces the most common wrong answer in percentage questions — a "conversion rate" of 0 for every row. The portable fix is to make one operand decimal before dividing: `100.0 * converted / visits`.

Division by zero in MySQL returns **NULL** (with a warning), not an error. PostgreSQL and SQL Server raise an error, which is why careful queries guard the divisor with `NULLIF(divisor, 0)` — the conditional-functions lesson shows the idiom.

## Integer division: DIV

`DIV` divides and drops the fraction, truncating towards zero:

```sql
SELECT 17 DIV 5, -17 DIV 5, 17 MOD 5;
```

```text
17 DIV 5 | -17 DIV 5 | 17 MOD 5
3 | -3 | 2
```

`DIV` and `MOD` go together: `a = b * (a DIV b) + MOD(a, b)`. Seventeen items in boxes of five is three full boxes and two left over.

## Remainders: MOD

`MOD(a, b)` returns what is left after dividing. The classic uses:

```sql
SELECT id FROM tickets WHERE MOD(id, 2) = 0;           -- even ids
SELECT id, MOD(id, 4) + 1 AS team FROM players;        -- round-robin teams 1..4
SELECT minutes DIV 60 AS h, MOD(minutes, 60) AS m       -- 135 → 2 h 15 m
FROM calls;
```

The result takes the sign of the dividend: `MOD(-7, 3)` is `-1`. `MOD(x, 0)` is NULL in MySQL. "Find the rows with an odd id" (`MOD(id, 2) = 1`) is a common warm-up interview question.

## Rounding: ROUND

`ROUND(x, d)` rounds to `d` decimal places; `ROUND(x)` rounds to a whole number. Halves go away from zero for exact decimal values: `ROUND(2.5)` is 3 and `ROUND(-2.5)` is -3.

```sql
SELECT ROUND(3.14159, 2), ROUND(2.5), ROUND(-2.5), ROUND(19.999, 1);
```

```text
ROUND(3.14159, 2) | ROUND(2.5) | ROUND(-2.5) | ROUND(19.999, 1)
3.14 | 3 | -3 | 20
```

A negative `d` rounds to the left of the decimal point in MySQL: `ROUND(1234, -2)` is 1200. Two more facts worth knowing for interviews:

- On `FLOAT`/`DOUBLE` columns, MySQL rounds halves to the nearest even value and binary representation can make `ROUND(1.005, 2)` give `1.00`. On `DECIMAL` columns rounding is exact. This is one of the reasons money is stored as `DECIMAL`.
- Round **at the end**. Rounding each line and then summing gives a different total from summing and then rounding, and the second is what an invoice means.

## Up, down and cut: CEIL, FLOOR, TRUNCATE

`CEIL` (or `CEILING`) moves up to the next whole number, `FLOOR` down to the previous one, and `TRUNCATE(x, d)` cuts after `d` decimals without rounding:

```sql
SELECT CEIL(4.1), FLOOR(4.9), CEIL(-4.1), FLOOR(-4.1), TRUNCATE(4.789, 1), TRUNCATE(-4.789, 1);
```

```text
CEIL(4.1) | FLOOR(4.9) | CEIL(-4.1) | FLOOR(-4.1) | TRUNCATE(4.789, 1) | TRUNCATE(-4.789, 1)
5 | 4 | -4 | -5 | 4.7 | -4.7
```

For negative numbers, `FLOOR` goes further from zero and `TRUNCATE` goes towards it — `FLOOR(-4.1)` is -5, `TRUNCATE(-4.1, 0)` is -4. PostgreSQL calls `TRUNCATE` `TRUNC`; SQL Server uses `ROUND(x, d, 1)`.

`CEIL` is the function for "how many containers": 23 results at 10 a page need `CEIL(23 / 10)` = 3 pages. `FLOOR` is the function for buckets: `FLOOR(age / 10) * 10` turns 37 into the 30s.

```sql
SELECT name, age, FLOOR(age / 10) * 10 AS decade
FROM members
ORDER BY age;
```

```text
name | age | decade
Ravi | 19 | 10
Mia | 30 | 30
Sam | 37 | 30
```

## The rest of the toolbox

```sql
SELECT ABS(-12),          -- 12: distance regardless of sign
       SIGN(-12),         -- -1, 0 or 1
       POWER(2, 10),      -- 1024 (also POW)
       SQRT(144),         -- 12
       GREATEST(3, 9, 4), -- 9: the largest argument
       LEAST(3, 9, 4);    -- 3: the smallest argument
```

`ABS` is the usual way to measure a difference without caring about direction — "orders whose amount differs from the quote by more than 5" is `ABS(amount - quote) > 5`. `GREATEST` and `LEAST` compare across *columns in one row*, unlike `MAX` and `MIN`, which compare one column across *rows* (next module). They return NULL if any argument is NULL. MySQL also has `FORMAT(x, d)`, which returns *text* with thousands separators — `FORMAT(1234567.891, 2)` is `'1,234,567.89'` — handy for display, useless for further arithmetic or sorting.

## Types: INT, DECIMAL, FLOAT

The type of a column decides what arithmetic can do with it:

- `INT` and `BIGINT` hold whole numbers exactly.
- `DECIMAL(p, s)` holds exactly `p` digits, `s` of them after the point. `DECIMAL(10, 2)` stores up to 99,999,999.99 exactly. Use it for money.
- `FLOAT` and `DOUBLE` are binary approximations: fast, wide-ranging, and unable to store 0.1 exactly. Use them for measurements, never for amounts that must add up to the cent.

`CAST(x AS DECIMAL(10, 2))` converts and rounds to two places in MySQL; `CAST(x AS SIGNED)` converts to an integer. Strings that look like numbers are converted automatically in arithmetic (`'3' + 4` is 7), which is convenient and also how a typo in a numeric column hides — `'12abc' + 0` is 12, with a warning.

## Pitfalls

- Integer division in PostgreSQL, SQL Server and SQLite: multiply by `1.0` first when the answer should have a fraction.
- Rounding too early and summing rounded values.
- `FLOOR` and `TRUNCATE` disagree on negatives.
- Storing money in `FLOAT`.
- Using `FORMAT` and then trying to sort or add the result — it is text.
- `GREATEST`/`LEAST` return NULL when any argument is NULL.

## Key takeaways

- MySQL's `/` is decimal; `DIV` is integer division and `MOD` the remainder.
- `ROUND` to the nearest, `CEIL` up, `FLOOR` down, `TRUNCATE` towards zero.
- `CEIL(n / size)` counts containers; `FLOOR(x / w) * w` builds buckets.
- `ABS`, `POWER`, `SQRT`, `GREATEST` and `LEAST` cover most of the rest.
- Money is `DECIMAL`; round once, at the end.
