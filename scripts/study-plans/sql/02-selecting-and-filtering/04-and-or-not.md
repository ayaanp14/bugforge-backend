---
title: AND, OR and NOT — combining conditions
minutes: 14
seo-title: SQL AND, OR and NOT: Operator Precedence and Parentheses
description: Combine SQL WHERE conditions with AND, OR and NOT: why AND binds tighter than OR, where parentheses go, De Morgan, and how NULL changes the truth tables.
question: How do AND and OR work together in a SQL WHERE clause?
answer: AND keeps a row only when both conditions are true; OR keeps it when at least one is. AND has higher precedence than OR, so `a OR b AND c` means `a OR (b AND c)`. Mixing them without parentheses is the most common filtering bug, so wrap each OR group in parentheses, as in `(cat = 'books' OR cat = 'games') AND price < 500`.
q: Which is evaluated first in SQL, AND or OR?
a: AND. NOT binds tightest, then AND, then OR, just as multiplication binds tighter than addition. `WHERE x = 1 OR y = 2 AND z = 3` is read as `x = 1 OR (y = 2 AND z = 3)`. Parentheses override the order and make the intent clear to a reader.
q: How does NOT work with NULL in SQL?
a: `NOT` of unknown is still unknown, so a row whose column is NULL fails both `WHERE dept = 'Sales'` and `WHERE NOT dept = 'Sales'`. To include such rows, add `OR dept IS NULL` explicitly.
q: What does TRUE AND NULL return in SQL?
a: NULL, meaning unknown: the result depends on the unknown value. But `FALSE AND NULL` is FALSE and `TRUE OR NULL` is TRUE, because those results do not depend on the unknown value. WHERE keeps only rows where the whole condition is TRUE.
q: What are De Morgan's laws in SQL?
a: They rewrite a negated combination: `NOT (a AND b)` equals `NOT a OR NOT b`, and `NOT (a OR b)` equals `NOT a AND NOT b`. So `NOT (status = 'paid' OR status = 'refunded')` is `status <> 'paid' AND status <> 'refunded'`.
---
Real questions have more than one condition: books *or* games, under ₹500, *and* in stock, *not* discontinued. SQL combines conditions with three logical operators — `AND`, `OR` and `NOT`. They are simple on their own and dangerous together, because of **precedence** (which one binds first) and because SQL logic has a third truth value, **unknown**, that the familiar truth tables leave out. This lesson covers all three operators, the parentheses rule, rewriting negations, and the three-valued truth tables that decide what NULL rows do.

## AND: both must hold

```sql
SELECT name, price, stock
FROM products
WHERE price < 500 AND stock > 0
ORDER BY name;
```

A row survives only if **every** `AND`ed condition is true. Each `AND` narrows the result. The order you write them in does not matter to the answer — `stock > 0 AND price < 500` is the same filter — and the optimizer chooses which to check first.

## OR: at least one must hold

```sql
SELECT name, category
FROM products
WHERE category = 'books' OR category = 'games'
ORDER BY name;
```

A row survives if **any** `OR`ed condition is true. Each `OR` widens the result. (A list of alternatives on one column reads better as `category IN ('books', 'games')` — the next lesson.)

## NOT: negate

```sql
SELECT name FROM products WHERE NOT discontinued;           -- discontinued is 0/1
SELECT name FROM products WHERE NOT (price > 1000);         -- same as price <= 1000
SELECT name FROM products WHERE category NOT IN ('books');  -- NOT also combines with IN, BETWEEN, LIKE
```

`NOT` flips true to false and false to true. In MySQL a 0/1 column can be tested directly (`WHERE discontinued`, `WHERE NOT discontinued`) because MySQL's booleans are numbers. For simple comparisons, prefer the direct operator: `price <= 1000` reads better than `NOT (price > 1000)`.

## Precedence: AND before OR

The precedence, tightest first: comparisons, then `NOT`, then `AND`, then `OR`. Just as `2 + 3 * 4` multiplies first, `a OR b AND c` evaluates `AND` first. Consider: *books or games, priced under 500*.

```sql
-- WRONG
SELECT name, category, price
FROM products
WHERE category = 'books' OR category = 'games' AND price < 500;
```

That is read as

```sql
WHERE category = 'books' OR (category = 'games' AND price < 500)
```

— every book, at any price, plus the cheap games. A ₹2,000 book slips through. The fix is parentheses around the `OR` group:

```sql
-- RIGHT
SELECT name, category, price
FROM products
WHERE (category = 'books' OR category = 'games') AND price < 500
ORDER BY name;
```

This is the single most common filtering bug, and it is invisible in testing whenever the data happens to have no expensive books. The rule: **whenever `AND` and `OR` appear in one condition, parenthesise every `OR` group**, even when precedence would have done the right thing — a reader should not have to work it out.

## Rewriting negations: De Morgan

Negating a combination swaps `AND` and `OR`:

- `NOT (a AND b)` is `NOT a OR NOT b`
- `NOT (a OR b)` is `NOT a AND NOT b`

So "orders that are neither paid nor refunded":

```sql
WHERE NOT (status = 'paid' OR status = 'refunded')
-- equals
WHERE status <> 'paid' AND status <> 'refunded'
-- equals
WHERE status NOT IN ('paid', 'refunded')
```

A classic slip is writing `status <> 'paid' OR status <> 'refunded'`, which is true for *every* row — anything that is `'paid'` is not `'refunded'`. When a negated condition looks odd, rewrite it with De Morgan and read it aloud.

## Three-valued logic

SQL conditions can be **true**, **false** or **unknown**. Unknown comes from NULL: `dept = 'Sales'` is unknown when `dept` is NULL. The operators extend to it with one principle — if the answer would be the same whatever the unknown value turned out to be, use that answer; otherwise the result is unknown.

| `a` | `b` | `a AND b` | `a OR b` |
| --- | --- | --- | --- |
| true | unknown | unknown | true |
| false | unknown | false | unknown |
| unknown | unknown | unknown | unknown |

and `NOT unknown` is `unknown`. `false AND anything` is false, `true OR anything` is true; the rest stays unknown. `WHERE` keeps a row only when the whole condition is **true**, so unknown behaves like false at the end — but not in the middle, and that is where the surprises live.

## NOT does not rescue NULL rows

Take

| emp_id | name | dept |
| ---: | --- | --- |
| 1 | Asha | Sales |
| 2 | Ravi | Support |
| 3 | Meera | NULL |

- `WHERE dept = 'Sales'` → Asha.
- `WHERE NOT dept = 'Sales'` → Ravi only.

Meera is in **neither** answer. For her the comparison is unknown, and `NOT unknown` is unknown. A filter and its negation do not always add up to the whole table — whenever NULLs are possible. To put Meera with the "not Sales" group, say so:

```sql
WHERE dept <> 'Sales' OR dept IS NULL
```

The same thing happens with `NOT IN` and a NULL inside the list, which the next lesson shows; it is one of the most-asked SQL interview traps.

## Readable compound conditions

Long conditions get one condition per line, `AND`/`OR` leading, and parentheses aligned:

```sql
SELECT order_id, status, amount, country
FROM orders
WHERE status = 'pending'
  AND (amount > 10000 OR country <> 'IN')
  AND created_on >= '2024-01-01'
ORDER BY order_id;
```

Leading operators make it easy to comment a line out while debugging, and the parentheses show at a glance which conditions are alternatives.

## Short-circuiting is not guaranteed

In C or Java, `a && b` never evaluates `b` when `a` is false. SQL makes no such promise: the optimizer may evaluate the conditions in any order. Do not write `WHERE qty <> 0 AND total / qty > 10` expecting the first condition to protect the second — in MySQL the division by zero yields NULL anyway, but in other databases it can raise an error. Make each condition safe on its own (here, `NULLIF(qty, 0)` in the divisor, which the NULLs module covers).

## Key takeaways

- `AND`: every condition true. `OR`: at least one. `NOT`: flips true and false.
- Precedence: `NOT` > `AND` > `OR`. **Parenthesise every OR group** that sits next to an `AND`.
- De Morgan: `NOT (a OR b)` = `NOT a AND NOT b`; `x <> 1 OR x <> 2` is always true.
- Three-valued logic: `false AND unknown` is false, `true OR unknown` is true, everything else with unknown is unknown; `WHERE` keeps only true.
- A condition and its `NOT` both drop NULL rows — add `OR col IS NULL` when they belong.
- Don't rely on evaluation order between conditions.
