---
title: Columns and aliases — naming what a query returns
minutes: 13
seo-title: SQL Column Aliases: AS, Quoted Names and Table Aliases
description: Rename result columns in SQL with AS, quote an alias that has spaces, give tables short aliases and qualify column names, and see where aliases work.
question: What is an alias in SQL?
answer: An alias is a temporary name given to a column or a table inside one query, written with `AS`: `SELECT salary * 12 AS annual_salary FROM employees AS e`. A column alias becomes the heading of the result column; a table alias is a short name used to qualify columns, as in `e.salary`. Aliases change nothing in the stored table.
q: Is the AS keyword required for an alias in SQL?
a: No. `SELECT name full_name` and `SELECT name AS full_name` mean the same in MySQL, PostgreSQL and SQL Server, and Oracle forbids `AS` before a table alias. Writing `AS` for column aliases is the readable habit, because a missing comma otherwise turns the next column into an alias without any error.
q: How do you write a column alias with spaces in MySQL?
a: Quote it with backticks, as in `` SELECT salary AS `Monthly Pay` ``. MySQL also accepts single or double quotes around an alias. Standard SQL and PostgreSQL use double quotes. Snake-case aliases such as `monthly_pay` avoid quoting entirely.
q: Can I use a column alias in the WHERE clause?
a: No. WHERE is evaluated before SELECT, so the alias does not exist yet and MySQL reports an unknown column. Repeat the expression in WHERE, or compute the alias in a subquery and filter outside it. Aliases can be used in ORDER BY, and MySQL also allows them in GROUP BY and HAVING.
q: What is a table alias used for?
a: A table alias gives a table a short name for one query, such as `FROM employees AS e`. It shortens qualified column names like `e.salary`, and it is required when the same table appears twice, as in a self join, because each copy needs its own name.
---
A query's result is a table, and its columns need names. For a plain column the name comes from the table; for anything computed it is whatever the database derives from the expression — often the expression's text, which is ugly and differs between databases. An **alias** gives a column (or a table) the name you choose for the length of one query. Aliases make results readable, make computed columns addressable, and are essential once a query reads more than one table.

## Column aliases with AS

```sql
SELECT first_name AS name,
       salary * 12 AS annual_salary
FROM employees
ORDER BY emp_id;
```

| name | annual_salary |
| --- | ---: |
| Asha | 720000 |
| Ravi | 540000 |

`AS` renames the result column. The table still has `first_name`; only this result calls it `name`. Without the alias the second column's heading would be the expression itself — `salary * 12` in MySQL — which is awkward to read and harder for application code to refer to.

Rules worth knowing:

- An alias names the **result** column; it is not stored anywhere.
- Every computed column deserves one: the client code that reads the result refers to columns by name.
- Two result columns may end up with the same name (`SELECT a.id, b.id`). SQL allows it, but most client libraries then lose one of them — alias them apart.

## AS is optional — use it anyway

```sql
SELECT first_name name, salary * 12 annual_salary FROM employees;
```

The keyword is optional in MySQL, PostgreSQL, SQLite and SQL Server. Writing it is the habit for one reason you met in the first module: a missing comma turns a column into an alias silently.

```sql
SELECT first_name last_name FROM employees;   -- one column, called last_name, holding first names
```

With `AS` everywhere, a bare word after a column stands out as the mistake it is.

## Aliases that need quoting

An alias is an identifier, so the identifier rules apply. A simple lower-case name with underscores needs nothing. A name with a space, a capital you want kept, or a keyword needs quoting:

```sql
-- MySQL
SELECT salary AS `Monthly Pay`, dept AS `group` FROM employees;
-- MySQL also accepts quotes around an alias
SELECT salary AS 'Monthly Pay' FROM employees;
-- Standard SQL, PostgreSQL
SELECT salary AS "Monthly Pay" FROM employees;
```

MySQL is unusually lenient here: in the alias position it accepts backticks, single quotes and double quotes. Elsewhere in a query single quotes always make a **string**, so `ORDER BY 'Monthly Pay'` sorts by a constant string — that is, not at all. Refer to a quoted alias with backticks in MySQL. The simplest rule: choose aliases that need no quotes — `monthly_pay` — and let the application format headings for humans.

## Table aliases

A table can have an alias too, with the same `AS`:

```sql
SELECT e.first_name, e.salary
FROM employees AS e
ORDER BY e.emp_id;
```

`e.first_name` is a **qualified** column name: table (or alias), a dot, the column. With one table it is optional. Its value shows when a query names two tables that both have, say, a `name` column:

```sql
SELECT e.name AS employee, d.name AS department
FROM employees AS e
JOIN departments AS d ON d.dept_id = e.dept_id;
```

Without the prefixes, `name` would be **ambiguous** and MySQL would refuse the query (`Column 'name' in field list is ambiguous`). Joins are a module of their own; the habit to form now is short table aliases (`e`, `d`, `o` for orders) and qualified names whenever more than one table is in play. Once a table has an alias, use it: in MySQL and most databases the original name is no longer visible in that query, so `employees.salary` after `FROM employees AS e` is an error.

Oracle does not accept `AS` before a table alias (`FROM employees e`); writing table aliases without `AS` is therefore the most portable form, and common in real code.

## Where an alias can be used

Recall the logical order of evaluation: `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `SELECT`, `ORDER BY`, `LIMIT`.

- **Table aliases** are created in `FROM`, the first step, so every clause can use them.
- **Column aliases** are created in `SELECT`. `ORDER BY` can use them in every database. `WHERE` never can. MySQL also allows them in `GROUP BY` and `HAVING`, which is convenient and not portable.

```sql
SELECT first_name, salary * 12 AS annual_salary
FROM employees
WHERE salary * 12 > 600000      -- the expression, not the alias
ORDER BY annual_salary DESC;    -- the alias is fine here
```

One more subtlety: an alias may shadow a real column name. `SELECT salary * 12 AS salary … ORDER BY salary` — which salary does `ORDER BY` mean? MySQL picks the alias. Avoid the question by never reusing a column's name for something different.

## Column names from SELECT *

`SELECT *` returns the table's own column names, in the table's order. You can mix `*` with other columns — `SELECT *, salary * 12 AS annual_salary` — which MySQL allows only when `*` comes first, unless it is qualified: `SELECT salary * 12 AS annual, e.* FROM employees AS e`. Handy for exploring; still not for code that others depend on.

## Naming conventions

Good aliases read like column names:

- lower case with underscores: `annual_salary`, `order_count`, `avg_price`;
- say what the value **is**, with its unit where useful: `price_inr`, `duration_min`;
- prefix booleans with `is_`/`has_`: `is_active`;
- keep table aliases to one or two letters, consistent across a codebase.

These are the names a dashboard, an API or a CSV export will show. Interview answers that alias every computed column look professional and are easier for the interviewer to check.

## Key takeaways

- `expr AS name` renames a result column for one query; nothing stored changes.
- `AS` is optional; write it, so a missing comma cannot hide.
- Quote an alias with spaces using backticks in MySQL (double quotes in the standard) — or choose one that needs no quotes.
- `FROM table AS t` gives a table alias; qualify columns as `t.column`, and qualify always when several tables are involved.
- Column aliases work in `ORDER BY` everywhere, never in `WHERE`; MySQL also accepts them in `GROUP BY`/`HAVING`.
