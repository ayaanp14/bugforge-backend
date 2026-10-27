---
title: Sorting on several keys, ties and custom orders
minutes: 14
seo-title: SQL ORDER BY Multiple Columns: Tie-Breakers and Custom Order
description: ORDER BY with several columns sorts by the first key and breaks ties with the next. Mixed ASC and DESC, deterministic tie-breakers, and custom orders with CASE.
question: How does ORDER BY with multiple columns work in SQL?
answer: With several sort keys, `ORDER BY a, b` sorts every row by `a` first, and only rows with equal `a` are compared on `b`; a third key breaks the ties left after that. Each key takes its own direction, so `ORDER BY class ASC, score DESC` lists each class's best score first. End with a unique key to make the order fully deterministic.
q: Does DESC apply to all columns in ORDER BY?
a: No. `DESC` applies only to the key it follows. In `ORDER BY score, name DESC` the score is ascending and only the name is descending; to sort both descending you write `ORDER BY score DESC, name DESC`.
q: How do I sort by a custom order in MySQL?
a: Map each value to a rank and sort on the rank: `ORDER BY CASE status WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`. MySQL also offers `ORDER BY FIELD(status, 'high', 'medium', 'low')`, which returns a value's position in the list and 0 for anything not listed.
q: Why do I need a tie-breaker in ORDER BY?
a: Rows with equal sort keys may come back in any order, and that order can change between runs or after an index is added. Adding a unique column such as the primary key as the last key makes every row's position fixed, which pagination, reports and tests all rely on.
q: Is SQL ORDER BY a stable sort?
a: SQL makes no stability promise. Rows that tie on every sort key are not guaranteed to keep insertion order or any other order, so you cannot rely on an earlier sort surviving a later one. Spell out every key you care about in one ORDER BY.
---
Real orderings almost always have more than one rule. A class list is sorted by class, then within each class by score, best first, then by name when two students share a score. A support queue shows urgent tickets first, then the oldest. A leaderboard ranks by points, then by who reached them first. SQL expresses each of those with one `ORDER BY` clause holding several **sort keys**, each with its own direction. This lesson covers how the keys combine, mixing ascending and descending, why the last key should be unique, and how to sort by an order that is not alphabetical or numeric — the custom order.

## Keys are compared left to right

```sql
SELECT class, name, score
FROM students
ORDER BY class, score DESC, name;
```

The database compares two rows on the first key, `class`. If they differ, that decides their order and the other keys are never looked at. Only when the classes are equal does it compare `score` (descending), and only if those are equal too does it compare `name`.

```text
class | name  | score
A     | Meera | 91
A     | Arjun | 85
A     | Tara  | 85
B     | Kiran | 78
B     | Dev   | 60
```

Arjun and Tara share a class and a score, so the third key, `name`, puts Arjun first. Kiran's 78 sorts below Meera's 91 not because of the score but because class `B` comes after class `A`: a later key never overrides an earlier one. That is what people mean by "sort by class, then by score": a dictionary-style, lexicographic comparison.

## Each key has its own direction

`ASC` and `DESC` attach to the key they follow. In `ORDER BY class, score DESC, name` the class and the name are ascending and only the score is descending. A very common bug is writing `ORDER BY score, name DESC` while meaning "both descending" — that sorts scores from lowest to highest. To reverse both:

```sql
ORDER BY score DESC, name DESC
```

Mixing directions is normal: "newest first, then alphabetical" is `ORDER BY created_at DESC, title`.

## Make the last key unique

Two rows that tie on every key may come back in either order. The database is free to choose, and the choice can change from one run to the next — when the table grows, when the plan switches to an index, when a parallel scan finishes in a different order. SQL also makes no promise that sorting is **stable**: you cannot sort by name in one step and rely on that order surviving a later sort by score.

So if the order matters, finish with a key that no two rows share, usually the primary key:

```sql
SELECT id, name, points
FROM players
ORDER BY points DESC, id;
```

Now every row has exactly one place. This is not pedantry. Pagination (two lessons ahead) skips and repeats rows when the order is not unique, test output flips between runs, and a "first come, first served" ranking is only fair if the tie-breaker says who came first — a `joined_at` timestamp, then the id in case two players joined in the same second.

## Sorting on computed keys

A key can be any expression, which lets you sort on facts the table does not store directly:

```sql
-- Longest titles first, then alphabetical
SELECT title
FROM books
ORDER BY CHAR_LENGTH(title) DESC, title;

-- Biggest discount in money, not in percent
SELECT name, price, discount_pct
FROM products
ORDER BY price * discount_pct / 100 DESC, id;
```

Boolean expressions are especially useful. In MySQL a comparison yields `1` for true and `0` for false, so sorting on a condition moves the matching rows to one end:

```sql
-- Featured products first (featured = 'yes' gives 1), then by price
SELECT name, featured, price
FROM products
ORDER BY featured = 'yes' DESC, price;
```

You saw the same trick with `ORDER BY col IS NULL, col` for NULLs-last in the previous lesson.

## Custom orders with CASE

Statuses, priorities, sizes and weekdays have a natural order that is neither alphabetical nor numeric. Alphabetically, `high` < `low` < `medium`, which no one wants. The portable fix is to map each value to a rank with a `CASE` expression and sort on the rank:

```sql
SELECT id, title, priority
FROM tickets
ORDER BY CASE priority
           WHEN 'high'   THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low'    THEN 3
           ELSE 4
         END,
         id;
```

```text
id | title           | priority
2  | Checkout broken | high
5  | Refund stuck    | high
1  | Typo on FAQ     | medium
4  | Dark mode       | low
```

`CASE` gets a full lesson in the next module; for now read it as "if `priority` is `'high'` the key is 1, if `'medium'` it is 2", and so on. The `ELSE 4` sends unexpected values, including NULL, to the end instead of the front — without it they would get NULL, which MySQL sorts first.

MySQL has a shorthand: `FIELD(value, 'a', 'b', 'c')` returns the position of `value` in the list (1, 2, 3) and `0` when it is not there.

```sql
ORDER BY FIELD(priority, 'high', 'medium', 'low'), id
```

Beware the `0`: an unlisted value sorts **before** `high`. If the data can hold other values, use `CASE` with an `ELSE`, or list the order backwards and sort `DESC`. `FIELD` is MySQL-only; `CASE` works everywhere, which is why interview answers usually use it. A third option, when the order is real data rather than presentation, is to store a rank column (or a lookup table with one) and sort on that.

## Sorting rows of a few groups

A multi-key sort is also how you make a report readable before you know `GROUP BY`. Sorting by department, then by salary descending, lays out each department as a block with its best-paid people at the top:

```sql
SELECT dept, name, salary
FROM employees
ORDER BY dept, salary DESC, name;
```

Picking just the top row of each block is a different problem — "top-N per group" — and needs window functions, which come later in the course. Sorting only arranges rows; it never removes them.

## Before you move on

- Keys compare left to right; a later key only breaks ties left by the earlier ones.
- `ASC`/`DESC` belong to one key each.
- SQL sorting is not stable; end with a unique key when order matters.
- Expressions and boolean conditions make good keys.
- Custom orders: `CASE` with an `ELSE`, or MySQL's `FIELD` (unlisted values give 0 and sort first).
