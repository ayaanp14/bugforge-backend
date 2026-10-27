---
title: Checkpoint — Functions
minutes: 25
seo-title: MySQL Functions Quiz: String, Date and Numeric Practice Test
description: Test yourself: 11 questions and three queries on MySQL string functions, ROUND and MOD, date formatting, INTERVAL, DATEDIFF, TIMESTAMPDIFF, IF and NULLIF.
q: What does CONCAT return when one argument is NULL?
a: In MySQL `CONCAT` returns NULL if any argument is NULL, so a missing middle name erases the whole full name. `CONCAT_WS(' ', first, middle, last)` skips NULL arguments, and wrapping a column in `COALESCE(col, '')` is the other fix.
q: What is the argument order of DATEDIFF and TIMESTAMPDIFF?
a: `DATEDIFF(later, earlier)` puts the later date first and returns days. `TIMESTAMPDIFF(unit, earlier, later)` puts the unit first and then the start date, so the order of the dates is reversed. Mixing them up flips the sign of the answer.
q: Why use NULLIF in a division?
a: `x / NULLIF(y, 0)` divides by NULL instead of zero when `y` is 0, so the result is NULL rather than an error in PostgreSQL and SQL Server. MySQL returns NULL for division by zero anyway, but the guard keeps a query portable and makes the intent visible.
---
This checkpoint covers the whole module: string functions for joining, cleaning, cutting and padding text; numeric functions for rounding, integer division and remainders; date types, date parts and `DATE_FORMAT`; date arithmetic with `INTERVAL`, `DATEDIFF`, `TIMESTAMPDIFF` and `LAST_DAY`; and the conditional functions `IF`, `IFNULL`, `NULLIF`, `GREATEST`, `LEAST` and `FIELD`.

**How it works.** Eleven questions and three queries. You need 70% on the questions and every query accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What does `CONCAT` return when one argument is NULL, and what does `CONCAT_WS` do instead?
- What do `SUBSTRING_INDEX(s, '@', 1)` and `SUBSTRING_INDEX(s, '@', -1)` return for an email address?
- What is `-7 DIV 2`, and how do `FLOOR`, `CEIL`, `ROUND` and `TRUNCATE` differ for negative numbers?
- Why is `5 / 2` equal to 2 in PostgreSQL and 2.5 in MySQL?
- Which weekday is 1 in `DAYOFWEEK`, and which is 0 in `WEEKDAY`?
- What is `'2024-01-31' + INTERVAL 1 MONTH`?
- What is the argument order of `DATEDIFF`, and of `TIMESTAMPDIFF`?
- Why is a half-open range better than `BETWEEN` for a month of `DATETIME` values?
- What do `NULLIF(x, 0)` and `FIELD(status, …)` return, and what are they used for?

The three queries are a contact-card formatter that cleans names and splits emails, an invoice report that computes due dates, days overdue and a rounded late fee, and a shipment board with labels, a safe on-time rate and a custom sort order.
