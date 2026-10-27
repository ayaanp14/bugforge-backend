---
title: Views — saved queries as tables
minutes: 14
seo-title: SQL Views Explained: CREATE VIEW and View vs Table
description: A view is a saved SELECT you query like a table. CREATE VIEW, CREATE OR REPLACE VIEW, view vs table, updatable views, CHECK OPTION and materialized views.
question: What is a view in SQL?
answer: A view is a named, stored SELECT statement that you query like a table: `CREATE VIEW active_customers AS SELECT id, name FROM customers WHERE is_active = 1;`. It stores no data of its own, so every query against it runs the underlying SELECT on the current rows. Views simplify repeated joins, hide columns from users and give applications a stable interface.
q: What is the difference between a view and a table?
a: A table stores rows on disk. A view stores only its defining query and produces rows from the base tables each time it is read, so it is always current and takes no space, but it is only as fast as its query. You can index a table but not a MySQL view, and most views cannot be inserted into.
q: What is a materialized view?
a: A materialized view stores the result of its query as real data, so reads are fast but the data is as old as its last refresh. PostgreSQL and Oracle have them, refreshed with commands such as `REFRESH MATERIALIZED VIEW`. MySQL has none, so the usual substitute is a summary table rebuilt by a scheduled job or kept current by the application.
q: Can you update data through a view in MySQL?
a: Yes, if the view is updatable: it reads one base table, or a join where only one table's columns are changed, without aggregates, DISTINCT, GROUP BY, HAVING, UNION or LIMIT. An UPDATE on such a view changes the base table. `WITH CHECK OPTION` refuses changes that would make the row disappear from the view.
q: How do you change a view's definition in MySQL?
a: Use `CREATE OR REPLACE VIEW name AS new_select;` or `ALTER VIEW name AS new_select;`, which replace the stored query in one statement without dropping permissions. The portable alternative is `DROP VIEW IF EXISTS name;` followed by `CREATE VIEW`, which works in every database.
---
Some queries get written again and again: the join that gives each order its customer's name, the filter for active accounts, the report of revenue per customer. A **view** gives such a query a name and lets everyone select from it as if it were a table. This lesson covers creating, querying, replacing and dropping views, what a view is and is not (the view vs table question), when you can write through one, `WITH CHECK OPTION`, how MySQL executes them, and materialized views in the databases that have them.

## Creating and querying a view

```sql
CREATE VIEW customer_revenue AS
SELECT c.id   AS customer_id,
       c.name,
       COUNT(o.id)               AS orders,
       COALESCE(SUM(o.total), 0) AS revenue
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;
```

Now the report is a "table":

```sql
SELECT name, revenue
FROM customer_revenue
WHERE revenue > 1000
ORDER BY revenue DESC;
```

The view's columns are the SELECT's columns, named by their aliases, so alias every expression (an unaliased `COUNT(o.id)` would become a column literally named `COUNT(o.id)`). You can also name them in the header: `CREATE VIEW customer_revenue (customer_id, name, orders, revenue) AS SELECT ...`. A view may select from tables, other views, joins, subqueries and CTEs; filters, joins and sorts you add when querying it combine with its own.

## A view stores a query, not data

Every time you select from a view, the database runs its definition against the **current** base tables. So a view is always up to date — change an order and `customer_revenue` reflects it immediately — and costs no storage, but it is only as fast as the query underneath. There is nothing to refresh and nothing to index; to speed a view up, index its base tables.

**View vs table**, the interview answer: a table holds data; a view holds a SELECT. A table's rows persist until changed; a view's rows are computed on each read. A table can be indexed; a (MySQL) view cannot. A table accepts any INSERT/UPDATE/DELETE; a view only when it is updatable. Dropping a view loses no data; dropping a table does.

## Why use views

- **Simplicity** — a complex join written once, correctly, and reused; reports and analysts select from `customer_revenue` instead of re-deriving it.
- **Security** — grant a reporting user access to a view that leaves out salary or personal columns, and no access to the base table.
- **A stable interface** — when a table is split or renamed, a view with the old name and shape keeps old queries working while they are migrated.
- **Consistency** — "active customer" defined once in `active_customers`, instead of five slightly different WHERE clauses.

The cost: views on views on views become slow and hard to reason about, because every layer is expanded at query time. Keep them shallow.

## Changing and removing views

```sql
CREATE OR REPLACE VIEW active_customers AS
SELECT id, name, email FROM customers WHERE is_active = 1 AND deleted_at IS NULL;

ALTER VIEW active_customers AS SELECT ...;     -- same effect in MySQL

DROP VIEW IF EXISTS active_customers;
```

`CREATE OR REPLACE VIEW` (MySQL, PostgreSQL, Oracle) swaps the definition in one statement. The portable form, which every database accepts and which this course's practice engine runs, is `DROP VIEW IF EXISTS` followed by `CREATE VIEW`. A view is bound to its base tables by name: drop or rename a table and the view fails when next queried ("references invalid table"). PostgreSQL additionally refuses `CREATE OR REPLACE` if the new definition removes or retypes existing columns.

One MySQL detail: `SELECT *` in a view definition is expanded to the column list **when the view is created**, so a column added to the table later does not appear in the view until it is recreated. Name the columns.

## Writing through a view

Some views are **updatable**: an INSERT, UPDATE or DELETE on the view is applied to the base table. In MySQL a view is updatable when each of its rows maps to exactly one row of one base table — no aggregates, `DISTINCT`, `GROUP BY`, `HAVING`, `UNION`, `LIMIT` or subquery in the select list. A join view can be updated as long as one statement changes columns of only one of its tables.

```sql
CREATE VIEW cheap_products AS
SELECT id, name, price FROM products WHERE price < 10
WITH CHECK OPTION;

UPDATE cheap_products SET price = 8 WHERE id = 3;    -- fine: still under 10
UPDATE cheap_products SET price = 25 WHERE id = 3;   -- refused by CHECK OPTION
```

Without `WITH CHECK OPTION`, the second update would succeed and the row would vanish from the view — a confusing result. The option makes the view's WHERE a rule for writes through it. Updatable views are used to give restricted writers a filtered slice of a table; most views in practice are read-only reports.

## How MySQL runs a view

MySQL executes a view one of two ways. With the **MERGE** algorithm, it splices the view's definition into your query, so your WHERE is applied to the base tables directly and indexes are used as if you had written the join yourself. With **TEMPTABLE**, it first materializes the view's whole result into a temporary table and then applies your query to that — necessary for views with aggregates, `DISTINCT` or `UNION`, and slower, since your filter cannot reach the base tables' indexes. `EXPLAIN` shows which happened. The practical rule: a view that aggregates a large table is recomputed in full every time it is queried.

## Materialized views

A **materialized view** stores its result as real rows, refreshed on demand or on a schedule. PostgreSQL has `CREATE MATERIALIZED VIEW ...` and `REFRESH MATERIALIZED VIEW [CONCURRENTLY] ...`; Oracle and SQL Server (indexed views) have their own. Reads are as fast as a table, at the price of staleness between refreshes. MySQL has no materialized views; the substitute is a summary table rebuilt by a scheduled job (`CREATE TABLE ... AS SELECT` into a new table and `RENAME TABLE` to swap it in) or maintained by the application.

## Key takeaways

- `CREATE VIEW v AS SELECT ...` names a query; alias every column.
- A view stores the query, not rows: always current, no storage, as fast as its query, no indexes of its own.
- Use views for reuse, security, stable interfaces and one definition of a business rule; keep them shallow.
- `CREATE OR REPLACE VIEW` / `ALTER VIEW` in MySQL; `DROP VIEW IF EXISTS` + `CREATE VIEW` everywhere.
- Simple single-table views are updatable; `WITH CHECK OPTION` keeps writes inside the view.
- Materialized views store results (PostgreSQL, Oracle); MySQL uses summary tables instead.
