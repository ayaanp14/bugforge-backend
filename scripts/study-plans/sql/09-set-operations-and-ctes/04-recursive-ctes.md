---
title: Recursive CTEs — hierarchies, paths and number series
minutes: 16
seo-title: Recursive CTE in MySQL: Org Charts, Trees and Date Series
description: WITH RECURSIVE runs an anchor query, then repeats a recursive step until it returns no rows. Walk org charts and category trees, build paths and generate dates.
question: How does a recursive CTE work in SQL?
answer: A recursive CTE, written `WITH RECURSIVE`, has an anchor query and a recursive query joined by `UNION ALL`. The anchor produces the starting rows; the recursive query reads only the rows produced in the previous round and produces the next ones; the engine repeats until a round returns no rows. The union of every round is the result. It is how SQL walks trees such as org charts and generates series.
q: What is the anchor member of a recursive CTE?
a: The anchor member is the SELECT before `UNION ALL` that does not refer to the CTE itself. It runs once and supplies the starting rows, such as the employee with no manager or the first date of a range. Its column types also fix the types of the CTE's columns in MySQL.
q: How do you stop infinite recursion in a recursive CTE?
a: Give the recursive member a condition that eventually returns no rows, such as `WHERE n < 100` or a join that runs out of children. For data that may contain cycles, carry a depth or path column and stop when it grows too large or when the path already contains the next id. MySQL also stops at `cte_max_recursion_depth`, 1000 by default.
q: Why is my recursive CTE path truncated in MySQL?
a: In MySQL the anchor member decides each column's type, so a path built from a short name in the anchor gets a short string type, and longer values from later rounds are cut or raise "Data too long". Cast the anchor's column wide enough, for example `CAST(name AS CHAR(200))`.
q: How do you find all subordinates of a manager in SQL?
a: Use a recursive CTE whose anchor selects the manager's direct reports and whose recursive member joins `employees` to the CTE on `e.manager_id = cte.id`. Each round adds the next level down, and the union of all rounds is every direct and indirect subordinate. A depth column counts the levels.
q: Can a recursive CTE use GROUP BY or aggregates?
a: Not in the recursive member. MySQL, like the SQL standard, forbids aggregate functions, window functions, GROUP BY, ORDER BY and DISTINCT in the recursive SELECT, because each round must see only the previous round's rows. Aggregate in the final query that reads the CTE instead.
---
Some data refers to itself. An employee row has a `manager_id` that is another employee's `id`; a category has a `parent_id` that is another category; a flight connects to more flights. Ordinary SQL can follow such a link a fixed number of times — one self-join per level — but not "as many times as the data needs". A **recursive CTE** can. It repeats a query over its own output until nothing new appears, which is how SQL walks an org chart of unknown depth, builds the full path of a category, finds every part inside an assembly, or simply generates the numbers 1 to 100 or every date in a month. This lesson covers how the repetition works, the classic hierarchy queries, building paths, generating series, and how to keep recursion bounded.

## The shape

```sql
WITH RECURSIVE nums AS (
  SELECT 1 AS n                 -- anchor member
  UNION ALL
  SELECT n + 1 FROM nums        -- recursive member
  WHERE n < 5
)
SELECT n FROM nums ORDER BY n;
```

| n |
| ---: |
| 1 |
| 2 |
| 3 |
| 4 |
| 5 |

Evaluation goes in rounds:

1. The **anchor** runs once. Its rows (`n = 1`) are the first round, and they go into the result.
2. The **recursive member** runs with `nums` meaning *only the previous round's rows*. From `n = 1` it makes `n = 2` — round two.
3. Step 2 repeats on each new round: 2 makes 3, 3 makes 4, 4 makes 5. From 5, `WHERE n < 5` filters everything out — the round is empty and recursion stops.
4. The result is the union of all rounds.

In MySQL the word `RECURSIVE` is required if any CTE in the `WITH` list refers to itself (PostgreSQL requires it too; SQL Server and Oracle have no keyword and detect self-reference). The two members are joined with `UNION ALL`; plain `UNION` is allowed and removes rows already produced, which can stop a cycle but costs a duplicate check every round.

The recursive member may not use aggregates, window functions, `GROUP BY`, `ORDER BY`, `DISTINCT` or `LIMIT` in MySQL (`LIMIT` is allowed from 8.0.19), and must refer to the CTE exactly once, in its FROM clause — not in a subquery. All of these exist to keep the "one round at a time" model well defined. Aggregate in the final SELECT instead.

## Walking down an org chart

**`employees`**

| id | name | manager_id |
| ---: | --- | ---: |
| 1 | Meera | NULL |
| 2 | Arjun | 1 |
| 3 | Divya | 1 |
| 4 | Kabir | 2 |
| 5 | Leela | 4 |

Everyone under the CEO, with their level:

```sql
WITH RECURSIVE org AS (
  SELECT id, name, 0 AS depth
  FROM employees
  WHERE manager_id IS NULL                  -- the top
  UNION ALL
  SELECT e.id, e.name, org.depth + 1
  FROM employees e
  JOIN org ON e.manager_id = org.id         -- the previous level's people are managers
)
SELECT name, depth FROM org ORDER BY depth, name;
```

@figure org-rounds

Round one is Meera. Round two joins employees whose `manager_id` is Meera's id: Arjun and Divya. Round three finds Kabir under Arjun; round four Leela under Kabir; round five finds no one under Leela and stops. The join *is* the stopping condition: leaves have no children.

To start lower — everyone under Arjun — change only the anchor: `WHERE id = 2`. To include only the subordinates and not Arjun himself, anchor on `WHERE manager_id = 2` with depth 1.

## Walking up: a person's chain of command

Reverse the join to climb from one employee to the top:

```sql
WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 0 AS steps FROM employees WHERE id = 5
  UNION ALL
  SELECT m.id, m.name, m.manager_id, chain.steps + 1
  FROM employees m
  JOIN chain ON m.id = chain.manager_id
)
SELECT name, steps FROM chain ORDER BY steps;
```

This returns Leela, Kabir, Arjun, Meera — and stops when Meera's `manager_id` is NULL, since `m.id = NULL` matches nothing.

## Building a path

To show where a node sits — `Electronics > Phones > Android` — carry a string column and extend it each round:

```sql
WITH RECURSIVE tree AS (
  SELECT id, name, CAST(name AS CHAR(200)) AS path
  FROM categories
  WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, CONCAT(t.path, ' > ', c.name)
  FROM categories c
  JOIN tree t ON c.parent_id = t.id
)
SELECT path FROM tree ORDER BY path;
```

The `CAST` matters in MySQL. The anchor decides each column's type: without it, `path` would be typed as wide as the longest *root* name, and a longer path built later is truncated (or rejected with "Data too long for column" in strict mode). Casting to `CHAR(200)` — or any width that fits the deepest path — avoids it. PostgreSQL has a similar rule and wants the types of both members to match exactly. Sorting by the path puts every child right after its parent, which displays a tree as an indented list.

## Generating series

A recursive CTE with no table at all is a generator. Numbers:

```sql
WITH RECURSIVE seq AS (
  SELECT 1 AS n UNION ALL SELECT n + 1 FROM seq WHERE n < 100
)
SELECT n FROM seq;
```

Dates — the standard fix for reports with missing days:

```sql
WITH RECURSIVE days AS (
  SELECT '2024-03-01' AS day
  UNION ALL
  SELECT DATE_ADD(day, INTERVAL 1 DAY) FROM days WHERE day < '2024-03-07'
)
SELECT d.day, COALESCE(SUM(s.amount), 0) AS revenue
FROM days d
LEFT JOIN sales s ON s.sale_date = d.day
GROUP BY d.day
ORDER BY d.day;
```

A plain `GROUP BY sale_date` over `sales` skips a day with no sales; the date series provides every day, and the LEFT JOIN with `COALESCE` turns an empty day into 0. PostgreSQL has `generate_series()` for this; MySQL has no such function, so the recursive CTE is the idiom. Bound the series by reading the range from the data — `SELECT MIN(sale_date) …` in the anchor, `WHERE day < (SELECT MAX(sale_date) FROM sales)` in the recursive member.

## Keeping recursion bounded

A recursive member that never runs out of rows would run forever. MySQL protects you with `cte_max_recursion_depth` (default 1000 rounds) and `max_execution_time`, but the query should stop on its own:

- **Counters** stop at a limit: `WHERE n < 100`.
- **Joins down a tree** stop at the leaves — but only if the data really is a tree. A cycle (A manages B, B manages A, by a data-entry mistake) loops forever.
- **Guard against cycles** by carrying a depth and stopping at a sane maximum (`WHERE org.depth < 20`), or by carrying the path of ids and refusing to revisit: `WHERE FIND_IN_SET(e.id, org.id_path) = 0`. PostgreSQL 14 adds a `CYCLE` clause for this.
- **Use UNION instead of UNION ALL** when rows can be regenerated — such as walking a graph that has several routes to one node — so already-seen rows are dropped.

## Recursion for aggregates

Because aggregates are not allowed inside, total-over-a-subtree questions — "how many people work under each manager, at any depth" — are answered in two steps: the recursive CTE produces one row per (manager, subordinate) pair, and the outer query groups:

```sql
WITH RECURSIVE reports AS (
  SELECT manager_id AS boss, id AS person FROM employees WHERE manager_id IS NOT NULL
  UNION ALL
  SELECT r.boss, e.id
  FROM reports r
  JOIN employees e ON e.manager_id = r.person
)
SELECT boss, COUNT(*) AS team_size FROM reports GROUP BY boss ORDER BY boss;
```

The anchor pairs each manager with each direct report; each round extends every pair one level further down. Grouping by boss counts all of them.

## In other databases

PostgreSQL and SQLite use `WITH RECURSIVE` exactly as MySQL does. SQL Server writes plain `WITH` and limits depth with `OPTION (MAXRECURSION n)` (default 100). Oracle accepts recursive `WITH` and also has its older `CONNECT BY PRIOR` syntax, which you may still meet in legacy code.

## Pitfalls

- Forgetting `RECURSIVE`, or the stopping condition.
- An anchor column too narrow for the values built in later rounds.
- Cycles in data that "should" be a tree.
- Aggregating inside the recursive member instead of in the final query.
- Relying on the CTE's row order instead of an outer ORDER BY.

## Key takeaways

- `WITH RECURSIVE` = anchor `UNION ALL` recursive member; each round reads only the previous round's rows; recursion stops at an empty round.
- Join on `child.parent_id = cte.id` to walk down a tree, the other way round to walk up.
- Carry a depth column for levels and a `CAST(… AS CHAR(n))` path column for readable paths.
- Generate number and date series to fill gaps before a LEFT JOIN.
- Keep recursion bounded: counters, depth limits and cycle checks; aggregate outside the CTE.
