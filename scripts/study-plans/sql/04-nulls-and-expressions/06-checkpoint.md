---
title: Checkpoint — NULLs and expressions
minutes: 25
seo-title: SQL NULL Quiz: IS NULL, COALESCE, CASE and CAST Practice Test
description: Test yourself: 12 questions and three queries on SQL NULL and three-valued logic, IS NULL, COALESCE, IFNULL, NULLIF, CASE expressions, DIV and CAST.
q: Why does WHERE dept <> 'Sales' leave out employees with no department?
a: For a NULL department the comparison is UNKNOWN, and WHERE keeps only rows whose condition is TRUE. Add the NULL case explicitly: `WHERE dept <> 'Sales' OR dept IS NULL`.
q: What does COALESCE(NULLIF(x, ''), 'none') return for an empty string?
a: `'none'`. NULLIF turns the empty string into NULL, and COALESCE then skips that NULL and returns the next argument, so blanks and NULLs both get the default.
q: Why should a CASE that maps NULLs test IS NULL first?
a: Every comparison with NULL is UNKNOWN, so a NULL input skips every comparison branch and lands in the ELSE. A `WHEN col IS NULL` branch at the top gives it its own result.
---
This checkpoint covers the whole module: what NULL means, how it spreads through arithmetic and comparisons, three-valued logic in `WHERE`, `AND`, `OR`, `NOT` and `NOT IN`, `IS NULL` and `IS NOT NULL`, MySQL's NULL-safe `<=>`, `COALESCE`, `IFNULL` and `NULLIF`, searched and simple `CASE`, MySQL's `IF()`, the main data types, `/` versus `DIV`, implicit conversion, and `CAST`/`CONVERT`.

**How it works.** Twelve questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What are `NULL = NULL`, `NULL + 1` and `NULL OR TRUE`?
- Why does `WHERE col <> 'x'` drop NULL rows, and how do you keep them?
- Why does `NOT IN (1, 2, NULL)` never match anything?
- What is the difference between `IS NULL`, `= NULL` and `<=>`?
- What do `COALESCE`, `IFNULL` and `NULLIF` return, and what are SQL Server's and Oracle's names for `IFNULL`?
- In a searched `CASE`, which branch wins, and what is returned when none matches?
- What is `7 / 2` in MySQL, and in PostgreSQL? What is `7 DIV 2`?
- How do you sort a `VARCHAR` column of numbers by value?

The three queries are a delivery fee computed with `CASE` and reduced by a discount that may be missing, a contact list that treats blank cities as unknown and lists reachable contacts first, and an audit that labels each change as added, removed, changed or the same.
