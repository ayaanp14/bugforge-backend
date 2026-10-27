---
title: String functions — CONCAT, SUBSTRING, TRIM and friends
minutes: 14
seo-title: MySQL String Functions: CONCAT, SUBSTRING, TRIM, REPLACE
description: MySQL string functions join, cut, clean and pad text: CONCAT, SUBSTRING, LEFT and RIGHT, TRIM, REPLACE, LPAD, LOCATE and splitting an email at its @ sign.
question: What are the most used string functions in MySQL?
answer: The everyday MySQL string functions are `CONCAT` and `CONCAT_WS` to join text, `UPPER` and `LOWER` to change case, `TRIM` to strip spaces, `SUBSTRING`, `LEFT` and `RIGHT` to cut pieces out, `REPLACE` to swap text, `LPAD` to pad, `CHAR_LENGTH` to count characters and `SUBSTRING_INDEX` to split on a delimiter. Positions start at 1, and almost every one returns NULL when an argument is NULL.
q: What is the difference between CONCAT and CONCAT_WS in MySQL?
a: `CONCAT(a, b, c)` glues its arguments together and returns NULL if any one of them is NULL. `CONCAT_WS(sep, a, b, c)` puts the separator between the arguments and skips NULL arguments instead of returning NULL, which makes it the safe choice for full names and addresses with optional parts.
q: What is the difference between LENGTH and CHAR_LENGTH in MySQL?
a: `LENGTH` counts bytes and `CHAR_LENGTH` counts characters. For plain ASCII text they agree, but in UTF-8 a letter like `é` is two bytes, so `LENGTH('café')` is 5 while `CHAR_LENGTH('café')` is 4. Use `CHAR_LENGTH` whenever you mean "how many letters".
q: How do I get the domain from an email address in SQL?
a: In MySQL, `SUBSTRING_INDEX(email, '@', -1)` returns everything after the last `@`, which is the domain, and `SUBSTRING_INDEX(email, '@', 1)` returns the part before it. Without that function, combine `SUBSTRING` with `LOCATE('@', email)` to find the position of the `@`.
q: Are SQL string positions zero-based or one-based?
a: One-based. In MySQL the first character is position 1, so `SUBSTRING('hello', 1, 2)` is `he`, and `LOCATE` returns 0 when the text is not found. A negative start in `SUBSTRING` counts from the end of the string.
q: How do I concatenate strings in PostgreSQL and SQL Server?
a: PostgreSQL and standard SQL use the `||` operator, as in `first_name || ' ' || last_name`, and both also have `CONCAT`. SQL Server uses `+` or `CONCAT`. In MySQL `||` means logical OR unless the `PIPES_AS_CONCAT` mode is on, so write `CONCAT` there.
---
Most of the text in a database was typed by people, and it arrives the way people type: names in shouting capitals, stray spaces around an email, phone numbers with and without dashes, a full name in one column when the report wants it in two. String functions are how a query cleans and reshapes that text on the way out, without changing a single stored row. This lesson covers the functions MySQL programmers use every day, the rules they share, and the places where other databases spell them differently.

## The shared rules

Three rules hold for nearly every string function, and knowing them saves a lot of surprises:

- **Positions start at 1.** The first character of `'hello'` is at position 1, not 0.
- **NULL in, NULL out.** Pass NULL to `UPPER`, `SUBSTRING`, `REPLACE` or `CONCAT` and the result is NULL. `CONCAT_WS` is the notable exception.
- **Functions return new values.** `UPPER(name)` in a SELECT changes what is printed, never what is stored. Changing data is `UPDATE`'s job, in a later module.

```sql
SELECT UPPER('sql'), SUBSTRING('hello', 1, 2), UPPER(NULL);
```

| UPPER('sql') | SUBSTRING('hello', 1, 2) | UPPER(NULL) |
| --- | --- | --- |
| SQL | he | NULL |

## Joining text: CONCAT and CONCAT_WS

`CONCAT` glues any number of arguments together. Numbers are turned into text on the way.

```sql
SELECT CONCAT(first_name, ' ', last_name) AS full_name,
       CONCAT('#', order_id)              AS ref
FROM customers;
```

The catch is NULL: if any argument is NULL, the whole result is NULL. A customer with no middle name makes `CONCAT(first, ' ', middle, ' ', last)` vanish entirely. `CONCAT_WS` — "with separator" — takes the separator first, puts it between the arguments and **skips** NULL arguments:

```sql
SELECT CONCAT_WS(' ', 'Ada', NULL, 'Lovelace');   -- 'Ada Lovelace'
SELECT CONCAT(' ', 'Ada', NULL, 'Lovelace');      -- NULL
SELECT CONCAT_WS(', ', city, state, country)      -- 'Pune, India' when state is NULL
FROM addresses;
```

In PostgreSQL, SQLite and standard SQL the concatenation operator is `||`. In MySQL, `||` is logical OR by default, so `'a' || 'b'` is `0` — a classic surprise for people moving between databases. Write `CONCAT` in MySQL.

## Changing case and measuring

`UPPER` and `LOWER` (also spelled `UCASE`/`LCASE`) change the case of every letter. `CHAR_LENGTH` counts characters.

```sql
SELECT LOWER(email)       AS email,
       CHAR_LENGTH(name)  AS letters
FROM users;
```

`LENGTH` also exists, but it counts **bytes**. For ASCII the two agree; for `'café'` in UTF-8, `LENGTH` is 5 and `CHAR_LENGTH` is 4. When a question says "names longer than 10 characters", it means `CHAR_LENGTH`. SQL Server calls its character count `LEN` (which also ignores trailing spaces), and PostgreSQL's `LENGTH` counts characters.

## Cleaning: TRIM, LTRIM, RTRIM

`TRIM` removes spaces from both ends; `LTRIM` and `RTRIM` from one end. Spaces inside the text stay.

```sql
SELECT CONCAT('[', TRIM('  Ada Lovelace  '), ']');   -- '[Ada Lovelace]'
SELECT CONCAT('[', LTRIM('  Ada  '), ']');           -- '[Ada  ]'
```

MySQL's `TRIM` also takes a form that strips other characters — `TRIM(LEADING '0' FROM '00042')` gives `'42'`, and `TRIM(BOTH '-' FROM '--x--')` gives `'x'`. Trimming is the first step in comparing user-typed values: `' ada@x.com'` and `'ada@x.com'` are different strings until you trim them.

## Cutting pieces out

`SUBSTRING(s, start, length)` returns `length` characters starting at `start`. Leave out the length to take everything to the end; give a negative start to count from the right. `SUBSTR` and `MID` are synonyms.

```sql
SELECT SUBSTRING('2024-03-15', 1, 4)  AS yr,     -- '2024'
       SUBSTRING('2024-03-15', 6, 2)  AS mon,    -- '03'
       SUBSTRING('database', 5)       AS rest,   -- 'base'
       SUBSTRING('database', -4)      AS tail;   -- 'base'
```

`LEFT(s, n)` and `RIGHT(s, n)` take the first or last `n` characters. They read better than `SUBSTRING` when that is all you want — masking a card number is `CONCAT('**** ', RIGHT(card, 4))`.

## Finding and replacing

`LOCATE(sub, s)` returns the position of the first `sub` inside `s`, or **0** when it is not there (0 is never a valid position, which is what makes it a safe "not found"). `INSTR(s, sub)` is the same with the arguments the other way round, and `POSITION(sub IN s)` is the standard spelling.

```sql
SELECT LOCATE('@', 'ada@example.com');                      -- 4
SELECT SUBSTRING('ada@example.com', LOCATE('@', 'ada@example.com') + 1);   -- 'example.com'
```

`REPLACE(s, from, to)` swaps **every** occurrence, case-sensitively:

```sql
SELECT REPLACE('98-765-4321', '-', '');    -- '987654321'
SELECT REPLACE('a.b.c', '.', '/');         -- 'a/b/c'
```

Chaining `REPLACE` calls is the usual way to strip several characters: `REPLACE(REPLACE(phone, '-', ''), ' ', '')`.

## Splitting on a delimiter: SUBSTRING_INDEX

`SUBSTRING_INDEX(s, delim, n)` is MySQL's most useful splitting tool. With a positive `n` it returns everything **before** the n-th delimiter; with a negative `n`, everything **after** the n-th delimiter counting from the right.

```sql
SELECT SUBSTRING_INDEX('ada@example.com', '@', 1)    AS user_part,   -- 'ada'
       SUBSTRING_INDEX('ada@example.com', '@', -1)   AS domain,      -- 'example.com'
       SUBSTRING_INDEX('www.mysql.com', '.', 2)      AS first_two,   -- 'www.mysql'
       SUBSTRING_INDEX('www.mysql.com', '.', -2)     AS last_two;    -- 'mysql.com'
```

To get the *middle* piece, nest two calls: `SUBSTRING_INDEX(SUBSTRING_INDEX('a,b,c', ',', 2), ',', -1)` is `'b'`. PostgreSQL has `SPLIT_PART(s, delim, n)` for this, and SQL Server combines `CHARINDEX` with `SUBSTRING`.

## Padding and repeating

`LPAD(s, len, fill)` pads on the left until the text is `len` characters long; `RPAD` pads on the right. If the text is already longer, both **cut** it to `len`.

```sql
SELECT LPAD(42, 6, '0');       -- '000042'
SELECT RPAD('ab', 5, '.');     -- 'ab...'
SELECT LPAD('abcdef', 3, '*'); -- 'abc'  (truncated, not padded)
SELECT REPEAT('-', 5);         -- '-----'
SELECT REVERSE('stressed');    -- 'desserts'
```

Zero-padded codes like `INV-000042` are `CONCAT('INV-', LPAD(id, 6, '0'))`.

## Putting them together

Real cleanup chains functions from the inside out. Here is a display name built from untidy input: trim, take the first letter as an initial, and put the surname in capitals.

```sql
SELECT CONCAT(UPPER(LEFT(TRIM(first_name), 1)), '. ', UPPER(TRIM(last_name))) AS display
FROM people
ORDER BY display;
```

| display |
| --- |
| A. LOVELACE |
| G. HOPPER |

Read a nested expression from the innermost call outwards: `TRIM(first_name)`, then `LEFT(…, 1)`, then `UPPER(…)`. When a chain grows past three or four levels, give each step a name with a CTE (Module 9) or do the work once when the data is loaded.

## Functions in WHERE

String functions work in `WHERE` too: `WHERE LOWER(email) LIKE '%@gmail.com'`, `WHERE CHAR_LENGTH(code) <> 6`. One cost to remember for later: wrapping a column in a function usually stops MySQL from using an index on that column, because the index stores the raw values, not `LOWER(email)`. Module 13 calls such a condition *non-sargable* and shows how to avoid it.

Also note that case sensitivity of `=` depends on the column's **collation**. MySQL's default collations are case-insensitive, so `'ADA' = 'ada'` is true there, while PostgreSQL compares case-sensitively. Normalising with `LOWER` on both sides behaves the same everywhere.

## Pitfalls

- `CONCAT` with a NULL argument returns NULL — use `CONCAT_WS` or wrap the column in `COALESCE(col, '')`.
- `||` is OR in MySQL, not concatenation.
- `LENGTH` counts bytes; `CHAR_LENGTH` counts characters.
- Positions are 1-based, and `LOCATE` returns 0 for "not found".
- `REPLACE` is case-sensitive even under a case-insensitive collation.
- `LPAD`/`RPAD` cut text longer than the target length.

## Key takeaways

- `CONCAT` joins; `CONCAT_WS` joins with a separator and skips NULLs.
- `TRIM`, `UPPER`, `LOWER` normalise; `CHAR_LENGTH` measures.
- `SUBSTRING`, `LEFT`, `RIGHT` cut by position; `LOCATE` finds; `REPLACE` swaps every match.
- `SUBSTRING_INDEX` splits on a delimiter from either end.
- `LPAD` builds fixed-width codes; functions change the output, never the stored data.
