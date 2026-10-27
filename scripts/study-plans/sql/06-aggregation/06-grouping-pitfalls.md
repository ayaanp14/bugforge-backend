---
title: Grouping pitfalls — ONLY_FULL_GROUP_BY, COUNT and averages
minutes: 14
seo-title: MySQL Error 1055 ONLY FULL GROUP BY and Grouping Mistakes
description: Why MySQL raises error 1055 under ONLY FULL GROUP BY, plus the other grouping mistakes: the three COUNTs, WHERE versus HAVING and averages of averages.
question: What does the ONLY_FULL_GROUP_BY error mean in MySQL?
answer: Error 1055, "Expression of SELECT list is not in GROUP BY clause and contains nonaggregated column", means the query selects a column that can have several values inside one group without saying which one to show. Since MySQL 5.7 the `ONLY_FULL_GROUP_BY` mode rejects such queries. Fix it by adding the column to `GROUP BY`, wrapping it in an aggregate, or using `ANY_VALUE` when any value really will do.
q: How do I fix "isn't in GROUP BY" in MySQL?
a: Decide what the column should show for each group. If it identifies the group, add it to `GROUP BY`. If it needs one value from many, use an aggregate such as `MAX(col)`. If every row of the group has the same value but MySQL cannot prove it, wrap it in `ANY_VALUE(col)`. Turning the SQL mode off hides the error and returns arbitrary values.
q: Why is the average of averages wrong in SQL?
a: An average of group averages gives every group the same weight, however many rows it has. A store with 2 sales and a store with 200 count equally, so the result is not the overall average. Compute the overall figure from totals instead, `SUM(amount) / COUNT(*)`, or `SUM(price * qty) / SUM(qty)` for a weighted price.
q: Does COUNT(*) count NULL values?
a: `COUNT(*)` counts rows, so a row whose columns are all NULL still counts once. `COUNT(column)` counts only the rows where that column is not NULL, and `COUNT(DISTINCT column)` counts different non-NULL values. Choosing the wrong one is a common cause of reports that disagree.
q: Why does my SUM double after adding a join?
a: A join repeats each row of one table once for every matching row of the other, so values from the "one" side are counted several times when you `SUM` or `COUNT` them. Aggregate each table on its own before joining, or count with `COUNT(DISTINCT id)`. Joins are covered in the next module.
---
`GROUP BY` is short to write and easy to get subtly wrong. A query can run without an error, return a plausible number, and still answer a different question from the one asked — the total that counts NULLs it should not, the average that weights a tiny group like a large one, the column whose value was picked at random. This lesson collects the mistakes that show up again and again in code review and in interviews, and the rule that MySQL itself enforces to stop the worst of them.

## ONLY_FULL_GROUP_BY and error 1055

Consider this query:

```sql
SELECT department, name, MAX(salary)
FROM employees
GROUP BY department;
```

Each output row is a department. `MAX(salary)` has one value per department, but `name` has many — which name should appear? Many people expect "the name of the highest-paid employee". SQL makes no such promise.

Older MySQL versions accepted the query and returned the name from **some** row of the group — whichever the engine met first. The result looked right on small test data and was wrong in production. Since MySQL 5.7.5 the `ONLY_FULL_GROUP_BY` SQL mode is on by default, and the query fails:

```text
ERROR 1055 (42000): Expression #2 of SELECT list is not in GROUP BY clause and
contains nonaggregated column 'shop.employees.name' which is not functionally
dependent on columns in GROUP BY clause; this is incompatible with sql_mode=only_full_group_by
```

PostgreSQL, SQL Server and Oracle have always rejected it. The rule is the one from the GROUP BY lesson: every selected column must be in `GROUP BY`, inside an aggregate, or **functionally dependent** on the grouping columns.

## Fixing it — by deciding what you meant

There are four legitimate fixes, each answering a different intention:

```sql
-- 1. The column identifies the group: group by it too.
SELECT department, name, MAX(salary) FROM employees GROUP BY department, name;

-- 2. You want one value from many: say which, with an aggregate.
SELECT department, MIN(name) AS first_name_alphabetically, MAX(salary) FROM employees GROUP BY department;

-- 3. Every row of the group has the same value: ANY_VALUE tells MySQL so.
SELECT department_id, ANY_VALUE(department_name) AS department_name, COUNT(*)
FROM employees GROUP BY department_id;

-- 4. You wanted "the row with the max": that is not a GROUP BY question.
--    It needs a subquery or a window function (Modules 8 and 10).
```

**Functional dependence** is MySQL being clever: if you group by a table's primary key, every other column of that table is determined by it, so MySQL accepts `SELECT id, name, email, COUNT(*) … GROUP BY id`. PostgreSQL does the same. `ANY_VALUE` covers the cases MySQL cannot prove — it is an explicit "I know these are all equal".

What not to do: turn the mode off (`SET sql_mode = …` without `ONLY_FULL_GROUP_BY`). The error goes away and the arbitrary values come back. If an interviewer asks why the query fails, the expected answer is "the column is ambiguous within the group", followed by one of the fixes above.

## COUNT(*), COUNT(col), COUNT(DISTINCT col)

Three counts, three questions:

```sql
SELECT department,
       COUNT(*)                    AS employees,        -- rows
       COUNT(manager_id)           AS with_manager,     -- rows where manager_id is not NULL
       COUNT(DISTINCT manager_id)  AS managers          -- different managers
FROM employees
GROUP BY department
ORDER BY department;
```

A report showing "employees per department" with `COUNT(manager_id)` silently drops the department head who has no manager. A report of "customers who ordered" with `COUNT(*)` on the orders table counts orders, not customers — that one is `COUNT(DISTINCT customer_id)`. Before writing a count, say the noun out loud: *rows*, *rows that have a value*, or *different values*.

## WHERE versus HAVING, once more

Both filter, at different moments, and swapping them changes the answer:

```sql
-- Customers with at least one order over 100:
SELECT customer_id FROM orders WHERE amount > 100 GROUP BY customer_id;

-- Customers whose total is over 100:
SELECT customer_id FROM orders GROUP BY customer_id HAVING SUM(amount) > 100;

-- Customers whose every order is over 100:
SELECT customer_id FROM orders GROUP BY customer_id HAVING MIN(amount) > 100;
```

Three similar-sounding questions, three different queries. Also remember that `WHERE` removes rows before counting, so `WHERE status = 'paid' … COUNT(*)` counts paid orders only, and customers with no paid order vanish. If they should appear with a 0, move the condition into a conditional aggregate.

## The average of averages

A chain has two stores:

```text
store | sales | revenue
A | 2 | 200        (average sale 100)
B | 198 | 9900     (average sale 50)
```

The average sale across the chain is total revenue over total sales: 10100 / 200 = 50.5. The average of the two store averages is (100 + 50) / 2 = 75 — wrong, because it gives store A's two sales the same weight as store B's 198.

```sql
-- Wrong: averages per store, then averaged again in a report or a subquery.
-- Right: aggregate the totals.
SELECT SUM(revenue) / SUM(sales) AS avg_sale FROM store_totals;
```

The same mistake appears as an average of percentages and an average of ratios. A *weighted* figure — average price per unit across lines with different quantities — is `SUM(price * qty) / SUM(qty)`, not `AVG(price)`. When combining groups, carry **sums and counts**, never averages, and divide at the end.

## NULL sums and the missing zero

`SUM` over no rows, or over only NULLs, is NULL. In a grouped query that happens when a conditional sum has no matching rows and no `ELSE 0`, or when the summed column is NULL throughout a group:

```sql
SELECT team, COALESCE(SUM(bonus), 0) AS bonus_total
FROM staff
GROUP BY team
ORDER BY team;
```

Arithmetic with that NULL then turns everything it touches into NULL — `salary_total + bonus_total` is NULL for a team without bonuses. `COALESCE` the aggregate, not just the column.

## Counting after a join

A preview of the next module, because it is the most expensive grouping bug in practice. Joining orders to their order lines repeats each order once per line; summing `orders.shipping_fee` after that join counts the fee several times, and `COUNT(*)` counts lines, not orders. The fixes are to aggregate each table **before** joining, or to count `DISTINCT` keys. When a total looks too large, check whether a join has multiplied the rows.

## The checklist

Before trusting a grouped result, ask:

1. Is every selected column grouped, aggregated or dependent on the key?
2. Does each count count the right noun?
3. Should this condition run before grouping (`WHERE`) or after (`HAVING`)?
4. Am I averaging averages, or carrying sums and counts?
5. Can a group's aggregate be NULL, and should it read 0?
6. Is there an `ORDER BY` with a tie-breaker?

## Pitfalls

- Disabling `ONLY_FULL_GROUP_BY` instead of fixing the query.
- Expecting a non-grouped column to come from the row with the `MAX`.
- `COUNT(col)` where `COUNT(*)` was meant, and the reverse.
- Averages of averages and of percentages.
- Uncoalesced NULL aggregates poisoning later arithmetic.

## Key takeaways

- Error 1055 means a selected column is ambiguous within a group — group it, aggregate it, or use `ANY_VALUE`.
- Grouping by a primary key makes the table's other columns legal to select.
- `COUNT(*)`, `COUNT(col)` and `COUNT(DISTINCT col)` answer different questions.
- Combine groups with sums and counts, then divide.
- `COALESCE(SUM(x), 0)` where a missing total should read zero.
