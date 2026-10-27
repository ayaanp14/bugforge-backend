---
title: Self joins — a table joined to itself
minutes: 15
seo-title: SQL Self Join Explained: Employees, Managers and Row Pairs
description: A self join joins a table to itself under two aliases: employees to their managers, pairs of rows without repeats, and a day compared with the day before.
question: What is a self join in SQL?
answer: A self join is an ordinary join in which both sides are the same table, given two different aliases so that each column reference says which copy it means. It answers questions that compare rows of one table with each other, such as each employee with their manager, every pair of customers in the same city, or each day's reading with the previous day's.
q: How do you find employees who earn more than their manager?
a: Join the employees table to itself: `FROM employees e JOIN employees m ON m.id = e.manager_id`, then filter `WHERE e.salary > m.salary`. The alias `e` is the employee row and `m` is the manager row. Employees without a manager have a NULL `manager_id` and drop out of the inner join, which is correct here.
q: How do I list pairs without duplicates in a self join?
a: Join with `a.id < b.id` in addition to the matching condition. Using `<>` would return every pair twice, once as (A, B) and once as (B, A), and `=` alone would pair each row with itself. The strict less-than keeps exactly one ordering of each pair and excludes self-pairs.
q: How do I compare a row with the previous day's row in MySQL?
a: Self join on the date offset: `JOIN weather p ON w.day = DATE_ADD(p.day, INTERVAL 1 DAY)`. A day with no row the day before finds no partner, which is usually what "compared with yesterday" means. Window functions such as `LAG` compare with the previous row instead, regardless of gaps.
q: Do I need aliases for a self join?
a: Yes. A table may appear twice in a `FROM` clause only if at least one occurrence has an alias, and every column must be qualified with an alias, or MySQL reports a "Not unique table/alias" or ambiguous-column error. Choose aliases that name the role, such as `e` and `m`, not `t1` and `t2`.
---
Some questions compare rows of a single table with each other. Which employees earn more than their own manager? Which customers live in the same city? On which days was it warmer than the day before? The data needed for both sides of each comparison is in one table, so the join is a **self join**: the same table named twice, under two aliases, and joined like any other pair of tables. Nothing new is needed in SQL — only the habit of thinking of the two aliases as two different tables that happen to hold the same rows.

## Hierarchies: employees and managers

A common design stores a hierarchy in one table, each row pointing at its parent:

```sql
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT, manager_id INT);
INSERT INTO employees VALUES
  (1, 'Meera', 150000, NULL),
  (2, 'Arjun',  90000, 1),
  (3, 'Kiran', 110000, 2),
  (4, 'Leela',  70000, 2),
  (5, 'Omar',  160000, 1);
```

`manager_id` is a foreign key into the same table. To show each employee next to their manager's name, join `employees` as `e` (the employee) to `employees` as `m` (the manager):

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON m.id = e.manager_id
ORDER BY e.name;
```

@figure manager-links

Read the `ON` clause out loud: "the manager row is the one whose id equals the employee's `manager_id`". Getting that direction backwards (`e.id = m.manager_id`) is the classic mistake: it swaps the roles and lists each manager under their report's name.

Meera is missing: her `manager_id` is NULL, which matches nothing. If the report must list everyone, use a left join and label the top:

```sql
SELECT e.name AS employee, COALESCE(m.name, '(none)') AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.name;
```

## Comparing a row with its partner

Once the two rows sit side by side, any comparison is a `WHERE` clause. The interview classic — employees who earn more than their manager:

```sql
SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary
ORDER BY e.name;
```

| employee | salary | manager | manager_salary |
| --- | ---: | --- | ---: |
| Kiran | 110000 | Arjun | 90000 |
| Omar | 160000 | Meera | 150000 |

The same shape answers "employees hired before their manager", "products cheaper than the product they replaced" or "tasks due before the task they depend on".

Counting through a self join works too — the number of direct reports per manager:

```sql
SELECT m.name AS manager, COUNT(e.id) AS reports
FROM employees m
LEFT JOIN employees e ON e.manager_id = m.id
GROUP BY m.id, m.name
ORDER BY reports DESC, m.name;
```

Here `m` is on the left because every employee is a potential manager, and the left join gives zero to the people who manage nobody.

## Going up more than one level

Each extra level of the hierarchy is one more alias:

```sql
SELECT e.name AS employee, m.name AS manager, g.name AS managers_manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
LEFT JOIN employees g ON g.id = m.manager_id
ORDER BY e.name;
```

That works for a fixed depth. A hierarchy of unknown depth — "everyone under Meera, however far down" — needs a recursive CTE, which comes in a later module.

## Pairs of rows

Customers in the same city:

```sql
SELECT a.name AS customer_a, b.name AS customer_b, a.city
FROM customers a
JOIN customers b ON b.city = a.city AND a.id < b.id
ORDER BY a.city, customer_a, customer_b;
```

Why `a.id < b.id`? Without it, every customer matches themselves (same city, after all), and every real pair appears twice, as (Asha, Chen) and (Chen, Asha). `a.id <> b.id` removes the self-pairs but keeps both orderings. The strict `<` keeps exactly one ordering of each pair. A city with *n* customers gives *n(n − 1)/2* pairs. Customers whose city is NULL never pair, because `NULL = NULL` is not true.

The same trick finds duplicate records — two rows with the same email but different ids:

```sql
SELECT a.id AS keep_id, b.id AS duplicate_id, a.email
FROM users a
JOIN users b ON b.email = a.email AND a.id < b.id
ORDER BY a.email, b.id;
```

## Comparing with the previous day

Daily readings, one row per date — on which days was it warmer than the day before?

```sql
SELECT w.day, w.temp, p.temp AS previous_temp
FROM weather w
JOIN weather p ON w.day = DATE_ADD(p.day, INTERVAL 1 DAY)
WHERE w.temp > p.temp
ORDER BY w.day;
```

The partner of each row is the row dated exactly one day earlier. If a date is missing from the table, the day after the gap has no partner and drops out — "the day before" is a calendar fact, not "the previous row". Comparing by subtracting dates (`w.day - 1`) does not work in MySQL: arithmetic on a `DATE` treats it as the number 20240102, so subtracting 1 from 20240101 gives 20240100, not December 31st. Use `DATE_ADD`/`DATE_SUB` or `DATEDIFF(w.day, p.day) = 1`. In PostgreSQL, `p.day + 1` on a `date` is correct, and in SQL Server the function is `DATEADD(day, 1, p.day)`.

Window functions (`LAG`) compare with the previous *row* instead and are often simpler; they come in a later module. Self joins remain the answer when the partner is defined by a condition rather than by position, and interviewers still ask for them.

## Performance note

A self join is executed like any join: the database looks up partners using indexes on the join columns. An index on `manager_id`, or on `(city)`, keeps a large self join fast. A pair query with only `a.id < b.id` and no equality condition is close to a cross join — *n²/2* rows — so make sure an equality narrows it down.

## Pitfalls

- Reversing the `ON` direction and swapping the roles of the two aliases.
- Forgetting the top of the hierarchy, whose parent key is NULL.
- Pair queries without `a.id < b.id`: self-pairs and every pair twice.
- Date arithmetic with `- 1` in MySQL instead of `DATE_ADD` or `DATEDIFF`.
- Aliases like `t1`/`t2` that hide which row plays which role.

## Key takeaways

- A self join names one table twice with two aliases and joins them like two tables.
- Name the aliases by role (`e`, `m`) and read `ON` aloud to check the direction.
- Use `LEFT JOIN` when rows with no partner (the top manager) must stay.
- `a.id < b.id` produces each pair once and never a row with itself.
- For "the day before", join on `DATE_ADD(p.day, INTERVAL 1 DAY)`; gaps in dates are respected.
