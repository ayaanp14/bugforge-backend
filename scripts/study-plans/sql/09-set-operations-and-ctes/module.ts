import { defineModule } from "../../dsl.js";

// ── Setup scripts (each case's stdin) ───────────────────────────────────────

const CONTACT_TABLES = String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(50), email VARCHAR(80), city VARCHAR(30));
CREATE TABLE suppliers (id INT PRIMARY KEY, company VARCHAR(50), email VARCHAR(80), city VARCHAR(30));
`;

const MAIL_1 = CONTACT_TABLES + String.raw`INSERT INTO customers VALUES
  (1, 'Asha Rao', 'asha@mail.com', 'Pune'),
  (2, 'Ben Ortiz', 'ben@mail.com', 'Delhi'),
  (3, 'Asha Rao', 'asha@mail.com', 'Pune'),
  (4, 'Chen Li', 'chen@mail.com', 'Pune');
INSERT INTO suppliers VALUES
  (1, 'Acme Parts', 'sales@acme.io', 'Mumbai'),
  (2, 'Bolt and Co', 'hi@bolt.co', 'Pune');
`;
const MAIL_2 = CONTACT_TABLES + String.raw`INSERT INTO customers VALUES
  (1, 'Dev Shah', 'dev@shah.in', 'Surat'),
  (2, 'Eva Paul', 'eva@mail.com', 'Goa');
INSERT INTO suppliers VALUES
  (1, 'Dev Shah', 'dev@shah.in', 'Surat'),
  (2, 'Fab Tools', 'fab@tools.in', 'Goa'),
  (3, 'Fab Tools', 'fab@tools.in', 'Goa');
`;
const MAIL_3 = CONTACT_TABLES + String.raw`INSERT INTO customers VALUES
  (1, 'Zoe Ng', 'zoe@mail.com', NULL);
`;

const CITY_1 = CONTACT_TABLES + String.raw`INSERT INTO customers VALUES
  (1, 'Asha Rao', 'asha@mail.com', 'Pune'),
  (2, 'Ben Ortiz', 'ben@mail.com', 'Delhi'),
  (3, 'Chen Li', 'chen@mail.com', 'Pune'),
  (4, 'Gita Nair', 'gita@mail.com', 'Chennai');
INSERT INTO suppliers VALUES
  (1, 'Acme Parts', 'sales@acme.io', 'Mumbai'),
  (2, 'Bolt and Co', 'hi@bolt.co', 'Pune'),
  (3, 'Delta Foods', 'ops@delta.in', 'Delhi');
`;
const CITY_2 = CONTACT_TABLES + String.raw`INSERT INTO customers VALUES
  (1, 'Ira Sen', 'ira@mail.com', 'Goa'),
  (2, 'Jai Roy', 'jai@mail.com', NULL),
  (3, 'Kim Das', 'kim@mail.com', 'Goa');
INSERT INTO suppliers VALUES
  (1, 'Lumen', 'hi@lumen.in', NULL),
  (2, 'Metro Steel', 'ms@metro.in', 'Agra'),
  (3, 'Nova Paper', 'np@nova.in', 'Agra'),
  (4, 'Orbit', 'o@orbit.in', 'Goa');
`;
const CITY_3 = CONTACT_TABLES + String.raw`INSERT INTO suppliers VALUES
  (1, 'Quay Fish', 'q@quay.in', 'Kochi');
`;

const ENROLL = String.raw`CREATE TABLE enrollments (student VARCHAR(30), course VARCHAR(30));
`;
const ENROLL_1 = ENROLL + String.raw`INSERT INTO enrollments VALUES
  ('Asha', 'SQL'), ('Asha', 'Python'), ('Ben', 'SQL'), ('Kiran', 'Python'),
  ('Kiran', 'SQL'), ('Kiran', 'SQL'), ('Meera', 'Java'), ('Meera', 'Python');
`;
const ENROLL_2 = ENROLL + String.raw`INSERT INTO enrollments VALUES ('Ravi', 'SQL'), ('Sana', 'Python');
`;
const ENROLL_3 = ENROLL + String.raw`INSERT INTO enrollments VALUES
  ('Tara', 'Python'), ('Tara', 'SQL'), ('Uma', 'SQL'), ('Uma', 'Python'), ('Vik', 'Go');
`;

const SHOP = String.raw`CREATE TABLE products (sku VARCHAR(10) PRIMARY KEY, name VARCHAR(40), price DECIMAL(8,2));
CREATE TABLE sales (id INT PRIMARY KEY, sku VARCHAR(10), qty INT);
`;
const SHOP_1 = SHOP + String.raw`INSERT INTO products VALUES
  ('A1', 'Kettle', 1499.00), ('B2', 'Toaster', 1999.00), ('C3', 'Blender', 2499.00), ('D4', 'Mixer', 3299.00);
INSERT INTO sales VALUES (1, 'A1', 2), (2, 'B2', 1), (3, 'A1', 1);
`;
const SHOP_2 = SHOP + String.raw`INSERT INTO products VALUES ('P1', 'Lamp', 799.00), ('P2', 'Desk', 5499.00), ('P3', 'Chair', 2999.00);
INSERT INTO sales VALUES (1, 'P2', 1), (2, NULL, 3);
`;
const SHOP_3 = SHOP + String.raw`INSERT INTO products VALUES ('X1', 'Pen', 20.00);
INSERT INTO sales VALUES (1, 'X1', 10);
`;

const EMP = String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(30), dept VARCHAR(20), salary INT);
`;
const EMP_1 = EMP + String.raw`INSERT INTO employees VALUES
  (1, 'Asha', 'Eng', 90000), (2, 'Ben', 'Eng', 70000), (3, 'Chen', 'Sales', 50000),
  (4, 'Dev', 'Sales', 40000), (5, 'Eva', 'HR', 45000), (6, 'Farah', 'Data', 85000);
`;
const EMP_2 = EMP + String.raw`INSERT INTO employees VALUES (1, 'Ana', 'Ops', 50000), (2, 'Bo', 'Ops', 50000), (3, 'Cy', 'IT', 50000);
`;
const EMP_3 = EMP + String.raw`INSERT INTO employees VALUES (1, 'Ana', 'X', 100), (2, 'Bo', 'Y', 100), (3, 'Cy', 'Z', 40), (4, 'Di', 'Z', 20);
`;

const ORDERS = String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(30), amount DECIMAL(10,2), status VARCHAR(10));
`;
const ORDERS_1 = ORDERS + String.raw`INSERT INTO orders VALUES
  (1, 'Asha', 120, 'paid'), (2, 'Ben', 80, 'paid'), (3, 'Asha', 30, 'paid'),
  (4, 'Chen', 200, 'refunded'), (5, 'Chen', 50, 'paid'), (6, 'Ben', 70, 'paid');
`;
const ORDERS_2 = ORDERS + String.raw`INSERT INTO orders VALUES (1, 'Zed', 99.5, 'paid'), (2, 'Zed', 0.5, 'paid'), (3, 'Yan', 10, 'pending');
`;
const ORDERS_3 = ORDERS + String.raw`INSERT INTO orders VALUES (1, 'A', 10, 'paid'), (2, 'B', 20, 'paid'), (3, 'C', 30, 'paid'), (4, 'D', 40, 'refunded');
`;

const ORG = String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(30), manager_id INT);
`;
const ORG_1 = ORG + String.raw`INSERT INTO employees VALUES
  (1, 'Meera', NULL), (2, 'Arjun', 1), (3, 'Divya', 1), (4, 'Kabir', 2),
  (5, 'Leela', 4), (6, 'Anil', 3), (7, 'Zara', 3);
`;
const ORG_2 = ORG + String.raw`INSERT INTO employees VALUES (1, 'Solo', NULL);
`;
const ORG_3 = ORG + String.raw`INSERT INTO employees VALUES (1, 'Ana', NULL), (2, 'Bo', NULL), (3, 'Cy', 2), (4, 'Di', 3);
`;

const CAT = String.raw`CREATE TABLE categories (id INT PRIMARY KEY, name VARCHAR(40), parent_id INT);
`;
const CAT_1 = CAT + String.raw`INSERT INTO categories VALUES
  (1, 'Electronics', NULL), (2, 'Phones', 1), (3, 'Laptops', 1), (4, 'Android', 2),
  (5, 'iPhone', 2), (6, 'Books', NULL), (7, 'Fiction', 6);
`;
const CAT_2 = CAT + String.raw`INSERT INTO categories VALUES
  (1, 'A', NULL), (2, 'Very long category name', 1), (3, 'Even longer subcategory', 2);
`;
const CAT_3 = CAT + String.raw`INSERT INTO categories VALUES (1, 'Misc', NULL);
`;

const DAILY = String.raw`CREATE TABLE sales (id INT PRIMARY KEY, sale_date DATE, amount INT);
`;
const DAILY_1 = DAILY + String.raw`INSERT INTO sales VALUES
  (1, '2024-03-01', 100), (2, '2024-03-01', 50), (3, '2024-03-03', 70), (4, '2024-03-05', 20);
`;
const DAILY_2 = DAILY + String.raw`INSERT INTO sales VALUES (1, '2024-12-31', 10), (2, '2024-12-31', 5);
`;
const DAILY_3 = DAILY + String.raw`INSERT INTO sales VALUES (1, '2024-02-28', 10), (2, '2024-03-01', 30);
`;

const FEED = String.raw`CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(30));
CREATE TABLE posts (id INT PRIMARY KEY, user_id INT);
CREATE TABLE comments (id INT PRIMARY KEY, user_id INT);
`;
const FEED_1 = FEED + String.raw`INSERT INTO users VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen'), (4, 'Dev');
INSERT INTO posts VALUES (1, 1), (2, 1), (3, 2);
INSERT INTO comments VALUES (1, 2), (2, 2), (3, 1), (4, 3);
`;
const FEED_2 = FEED + String.raw`INSERT INTO users VALUES (1, 'Ola'), (2, 'Pia');
INSERT INTO posts VALUES (1, 2), (2, 2);
`;
const FEED_3 = FEED + String.raw`INSERT INTO users VALUES (1, 'Raj');
INSERT INTO posts VALUES (1, 1), (2, 1);
INSERT INTO comments VALUES (1, 1);
`;

const TEAM_1 = ORG + String.raw`INSERT INTO employees VALUES
  (1, 'Meera', NULL), (2, 'Arjun', 1), (3, 'Divya', 1), (4, 'Kabir', 2), (5, 'Leela', 4), (6, 'Anil', 3);
`;
const TEAM_2 = ORG + String.raw`INSERT INTO employees VALUES (1, 'Solo', NULL);
`;
const TEAM_3 = ORG + String.raw`INSERT INTO employees VALUES (1, 'Boss', NULL), (2, 'Ann', 1), (3, 'Bea', 1), (4, 'Cal', 1);
`;

export default defineModule(import.meta.url, {
  slug: "set-operations-and-ctes",
  title: "Set operations and CTEs",
  blurb: "UNION and UNION ALL for stacking results, INTERSECT and EXCEPT with their NOT EXISTS and anti-join equivalents, the NOT IN null trap, common table expressions for naming the steps of a query, and recursive CTEs for org charts, category paths and date series.",
  icon: "layers",
  overview: `Joins put tables side by side; set operations put result sets on top of each other, and common table expressions put the steps of a query in order. This module covers both. \`UNION\`, \`INTERSECT\` and \`EXCEPT\` answer "rows from either", "rows in both" and "rows in one but not the other" — questions that come up whenever two tables hold the same kind of thing — and \`WITH\` turns a query that would nest three subqueries deep into a list of named steps that reads top to bottom. \`WITH RECURSIVE\` then lets SQL follow a link as many times as the data needs, which is how a relational database walks a hierarchy.

UNION and UNION ALL covers the column rules (count, types by position, names from the first SELECT), why \`UNION\` removes duplicates and what that costs, tagging rows with a constant, sorting the combined result and aggregating over a union. INTERSECT and EXCEPT covers both operations in MySQL 8.0.31+, their portable forms with \`EXISTS\`, \`NOT EXISTS\` and \`LEFT JOIN … IS NULL\`, and the \`NOT IN\` trap that returns no rows when the list holds a NULL. Common table expressions covers the syntax, chaining, reusing one result twice, and how CTEs compare to derived tables, views and temporary tables. Recursive CTEs covers the anchor and recursive members, walking down and up an org chart, building category paths, generating number and date series, and keeping recursion bounded.

The exercises are queries judged on real tables: a deduplicated mailing list and contact counts per city, students in two courses and products that never sold (with a NULL waiting in the data), departments above the company average and each customer's share of revenue, an org chart by level and full category paths. The checkpoint adds a daily revenue report with the missing days filled in, an activity count across two tables, and every manager's whole team size.`,
  lessons: [
    {
      slug: "union-and-union-all",
      file: "01-union-and-union-all.md",
      exercises: [
        {
          title: "A deduplicated mailing list",
          prompt: `Marketing wants one mailing list of everyone in \`customers\` and \`suppliers\`. An import loaded some customers twice, so each distinct contact must appear **once**.

| customers: id | name | email | city |
| --- | --- | --- | --- |
| 1 | Asha Rao | asha@mail.com | Pune |
| 2 | Ben Ortiz | ben@mail.com | Delhi |
| 3 | Asha Rao | asha@mail.com | Pune |
| 4 | Chen Li | chen@mail.com | Pune |

| suppliers: id | company | email | city |
| --- | --- | --- | --- |
| 1 | Acme Parts | sales@acme.io | Mumbai |
| 2 | Bolt and Co | hi@bolt.co | Pune |

Return the columns \`contact\` (a customer's \`name\` or a supplier's \`company\`), \`email\` and \`kind\` (\`'customer'\` or \`'supplier'\`), each distinct row once, ordered by \`contact\`, then \`kind\`.

\`\`\`text
contact | email | kind
Acme Parts | sales@acme.io | supplier
Asha Rao | asha@mail.com | customer
Ben Ortiz | ben@mail.com | customer
Bolt and Co | hi@bolt.co | supplier
Chen Li | chen@mail.com | customer
\`\`\`

Someone who is both a customer and a supplier appears twice — once per \`kind\`.`,
          starter: String.raw`-- Combine customers and suppliers into: contact | email | kind
-- each distinct row once, ORDER BY contact, kind.
`,
          solution: String.raw`SELECT name AS contact, email, 'customer' AS kind FROM customers
UNION
SELECT company, email, 'supplier' FROM suppliers
ORDER BY contact, kind;
`,
          hints: [
            "Give each SELECT a constant third column, `'customer'` and `'supplier'`, and put the aliases on the first SELECT.",
            "`UNION` (not `UNION ALL`) removes the duplicated Asha Rao row; the different `kind` keeps a person who is both.",
            "One `ORDER BY contact, kind` after the last SELECT sorts the combined result.",
          ],
          cases: [
            {
              stdin: MAIL_1,
              expected: "contact | email | kind\nAcme Parts | sales@acme.io | supplier\nAsha Rao | asha@mail.com | customer\nBen Ortiz | ben@mail.com | customer\nBolt and Co | hi@bolt.co | supplier\nChen Li | chen@mail.com | customer\n",
            },
            {
              stdin: MAIL_2,
              expected: "contact | email | kind\nDev Shah | dev@shah.in | customer\nDev Shah | dev@shah.in | supplier\nEva Paul | eva@mail.com | customer\nFab Tools | fab@tools.in | supplier\n",
              hidden: true,
            },
            { stdin: MAIL_3, expected: "contact | email | kind\nZoe Ng | zoe@mail.com | customer\n", hidden: true },
          ],
        },
        {
          title: "Contacts per city",
          prompt: `Count every contact — customers and suppliers together — per city. Every row is a real contact here, so nothing may be collapsed; rows whose \`city\` is NULL are left out.

| customers: id | name | email | city |
| --- | --- | --- | --- |
| 1 | Asha Rao | asha@mail.com | Pune |
| 2 | Ben Ortiz | ben@mail.com | Delhi |
| 3 | Chen Li | chen@mail.com | Pune |
| 4 | Gita Nair | gita@mail.com | Chennai |

| suppliers: id | company | email | city |
| --- | --- | --- | --- |
| 1 | Acme Parts | sales@acme.io | Mumbai |
| 2 | Bolt and Co | hi@bolt.co | Pune |
| 3 | Delta Foods | ops@delta.in | Delhi |

Return \`city\` and \`contacts\`, ordered by \`contacts\` descending, then \`city\`.

\`\`\`text
city | contacts
Pune | 3
Delhi | 2
Chennai | 1
Mumbai | 1
\`\`\``,
          starter: String.raw`-- Stack the cities of both tables, then count per city: city | contacts
-- (NULL cities left out), ORDER BY contacts DESC, city.
`,
          solution: String.raw`SELECT city, COUNT(*) AS contacts
FROM (
  SELECT city FROM customers
  UNION ALL
  SELECT city FROM suppliers
) AS everyone
WHERE city IS NOT NULL
GROUP BY city
ORDER BY contacts DESC, city;
`,
          hints: [
            "Union the two `city` columns inside a derived table (it needs an alias), then `GROUP BY city` outside it.",
            "`UNION` would keep Pune only once before the count — the stack must be `UNION ALL`.",
            "Filter out `city IS NULL` either in each branch or in the outer WHERE.",
          ],
          cases: [
            { stdin: CITY_1, expected: "city | contacts\nPune | 3\nDelhi | 2\nChennai | 1\nMumbai | 1\n" },
            { stdin: CITY_2, expected: "city | contacts\nGoa | 3\nAgra | 2\n", hidden: true },
            { stdin: CITY_3, expected: "city | contacts\nKochi | 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which column names does this result have?\n\n```sql\nSELECT name, email FROM customers\nUNION ALL\nSELECT company AS name2, email AS mail FROM suppliers;\n```",
          options: ["`name`, `email`", "`name2`, `mail`", "`name`, `mail`", "It is an error: the names differ"],
          answer: 0,
          explanation: "A union takes its column names from the first SELECT; aliases in later branches are ignored. Different names are not an error — columns are matched by position, which is also why listing them in a different order silently mixes them up.",
        },
        {
          prompt: "`customers.city` holds Pune, Pune, Delhi and `suppliers.city` holds Pune. How many rows does `SELECT city FROM customers UNION SELECT city FROM suppliers` return?",
          options: ["4", "3", "2", "1"],
          answer: 2,
          explanation: "`UNION` removes duplicates across the whole combined result, including duplicates within one branch: Pune and Delhi, two rows. `UNION ALL` would return all 4.",
        },
        {
          prompt: "You sum the `amount` of `sales_2023 UNION sales_2024` (both with columns `day, amount`) and the total is lower than expected. Why?",
          options: [
            "UNION skips NULL amounts",
            "UNION removed rows that were identical, such as two equal sales on the same day",
            "UNION sorts the rows and drops the last one",
            "SUM cannot read a union",
          ],
          answer: 1,
          explanation: "Two genuine sales with the same day and amount are duplicate *rows*, and `UNION` keeps one. When every row is real data, use `UNION ALL`. NULLs are not skipped by a union, and a union can be summed through a derived table.",
        },
        {
          prompt: "Where does an ORDER BY written after the last SELECT of a union apply?",
          options: ["To the last SELECT only", "To the whole combined result", "To the first SELECT only", "Nowhere — it is ignored"],
          answer: 1,
          explanation: "A trailing ORDER BY (and LIMIT) sorts the combined result, using the first SELECT's column names. To sort or limit one branch alone, MySQL needs that SELECT in parentheses with its own LIMIT.",
        },
        {
          prompt: "Why is `UNION ALL` usually faster than `UNION`?",
          options: [
            "It uses indexes and UNION does not",
            "It skips the duplicate-removal pass over the combined rows",
            "It runs the branches in parallel",
            "It returns fewer rows",
          ],
          answer: 1,
          explanation: "`UNION` has to remember every row emitted (MySQL uses a temporary table with a unique key) and check each new one against it. `UNION ALL` just appends. It returns as many rows or more, never fewer.",
        },
      ],
    },
    {
      slug: "intersect-and-except",
      file: "02-intersect-and-except.md",
      exercises: [
        {
          title: "Students in both courses",
          prompt: `Find the students enrolled in **both** \`'SQL'\` and \`'Python'\`. A student may appear more than once for the same course.

| enrollments: student | course |
| --- | --- |
| Asha | SQL |
| Asha | Python |
| Ben | SQL |
| Kiran | Python |
| Kiran | SQL |
| Kiran | SQL |
| Meera | Java |
| Meera | Python |

Return one column, \`student\`, each student once, ordered by \`student\`.

\`\`\`text
student
Asha
Kiran
\`\`\`

\`INTERSECT\`, \`EXISTS\` and \`GROUP BY … HAVING\` all work — try more than one.`,
          starter: String.raw`-- Students enrolled in both 'SQL' and 'Python': student
-- each once, ORDER BY student.
`,
          solution: String.raw`SELECT student FROM enrollments WHERE course = 'SQL'
INTERSECT
SELECT student FROM enrollments WHERE course = 'Python'
ORDER BY student;
`,
          hints: [
            "Two SELECTs — one for each course — and the operation that keeps rows present in both.",
            "`INTERSECT` removes duplicates for you; with `EXISTS` you need `SELECT DISTINCT`.",
          ],
          cases: [
            { stdin: ENROLL_1, expected: "student\nAsha\nKiran\n" },
            { stdin: ENROLL_2, expected: "student\n(no rows)\n", hidden: true },
            { stdin: ENROLL_3, expected: "student\nTara\nUma\n", hidden: true },
          ],
        },
        {
          title: "Products that never sold",
          prompt: `List the products with no row in \`sales\`. The \`sales.sku\` column is nullable — a till sometimes records a sale without a SKU.

| products: sku | name | price |
| --- | --- | --- |
| A1 | Kettle | 1499.00 |
| B2 | Toaster | 1999.00 |
| C3 | Blender | 2499.00 |
| D4 | Mixer | 3299.00 |

| sales: id | sku | qty |
| --- | --- | --- |
| 1 | A1 | 2 |
| 2 | B2 | 1 |
| 3 | A1 | 1 |

Return \`sku\` and \`name\`, ordered by \`sku\`.

\`\`\`text
sku | name
C3 | Blender
D4 | Mixer
\`\`\`

Make sure your query still works when \`sales\` contains a row whose \`sku\` is NULL.`,
          starter: String.raw`-- Products with no sale: sku | name, ORDER BY sku.
-- Careful: sales.sku can be NULL.
`,
          solution: String.raw`SELECT p.sku, p.name
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM sales s WHERE s.sku = p.sku)
ORDER BY p.sku;
`,
          hints: [
            "This is an anti-join: keep a product when no sale matches it.",
            "`NOT IN (SELECT sku FROM sales)` returns no rows at all once a NULL sku is in the subquery.",
            "`NOT EXISTS (SELECT 1 FROM sales s WHERE s.sku = p.sku)` or a `LEFT JOIN … WHERE s.sku IS NULL` are safe.",
          ],
          cases: [
            { stdin: SHOP_1, expected: "sku | name\nC3 | Blender\nD4 | Mixer\n" },
            { stdin: SHOP_2, expected: "sku | name\nP1 | Lamp\nP3 | Chair\n", hidden: true },
            { stdin: SHOP_3, expected: "sku | name\n(no rows)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`a.id` holds 1, 2, 3 and `b.id` holds 2, NULL. What does `SELECT id FROM a WHERE id NOT IN (SELECT id FROM b)` return?",
          options: ["1 and 3", "1, 3 and NULL", "No rows", "An error"],
          answer: 2,
          explanation: "`id NOT IN (2, NULL)` means `id <> 2 AND id <> NULL`; the second comparison is unknown, so the condition is never true. `NOT EXISTS` or `SELECT id FROM a EXCEPT SELECT id FROM b` return 1 and 3.",
        },
        {
          prompt: "Which MySQL version first accepts `INTERSECT` and `EXCEPT`?",
          options: ["5.7", "8.0.0", "8.0.31", "They are not supported; MySQL only has UNION"],
          answer: 2,
          explanation: "MySQL 8.0.31 (October 2022) added both. Earlier versions, including the first 8.0 releases, only have UNION — which is why the EXISTS forms are so common.",
        },
        {
          prompt: "Which query returns the same rows as `SELECT sku FROM products EXCEPT SELECT sku FROM sales` when `sku` is never NULL?",
          options: [
            "`SELECT p.sku FROM products p JOIN sales s ON s.sku = p.sku`",
            "`SELECT p.sku FROM products p LEFT JOIN sales s ON s.sku = p.sku WHERE s.sku IS NULL`",
            "`SELECT p.sku FROM products p LEFT JOIN sales s ON s.sku = p.sku WHERE p.sku IS NULL`",
            "`SELECT sku FROM sales WHERE sku NOT IN (SELECT sku FROM products)`",
          ],
          answer: 1,
          explanation: "The LEFT JOIN keeps every product and fills sales columns with NULL where nothing matched; testing the right table's join column for NULL keeps exactly the unmatched products. The inner join gives the sold ones, testing `p.sku` finds nothing, and the last query reverses the direction.",
        },
        {
          prompt: "Why might `SELECT e.student FROM enrollments e WHERE e.course = 'SQL' AND EXISTS (…Python…)` return more rows than the equivalent `INTERSECT`?",
          options: [
            "EXISTS ignores the WHERE clause",
            "EXISTS keeps the outer table's duplicate rows, while INTERSECT returns distinct rows",
            "INTERSECT drops students with NULL courses",
            "It cannot — they always return the same rows",
          ],
          answer: 1,
          explanation: "A student enrolled in SQL twice passes the EXISTS test twice. INTERSECT, like UNION, returns distinct rows. Add DISTINCT to the EXISTS form to match.",
        },
        {
          prompt: "Oracle's name for `EXCEPT` is…",
          options: ["`DIFFERENCE`", "`MINUS`", "`SUBTRACT`", "`NOT UNION`"],
          answer: 1,
          explanation: "Oracle has long used `MINUS`; Oracle 21c also accepts `EXCEPT`. The SQL standard, PostgreSQL, SQL Server, SQLite and MySQL 8.0.31+ use `EXCEPT`.",
        },
      ],
    },
    {
      slug: "common-table-expressions",
      file: "03-common-table-expressions.md",
      exercises: [
        {
          title: "Departments above the company average",
          prompt: `Which departments pay more on average than the company as a whole, and by how much?

| employees: id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Eng | 90000 |
| 2 | Ben | Eng | 70000 |
| 3 | Chen | Sales | 50000 |
| 4 | Dev | Sales | 40000 |
| 5 | Eva | HR | 45000 |
| 6 | Farah | Data | 85000 |

Return \`dept\`, \`avg_salary\` (the department's average, \`ROUND\`ed to 2 places) and \`above_company\` (department average minus the average of every employee, \`ROUND\`ed to 2 places), only for departments whose average is strictly greater than the company average. Order by \`above_company\` descending, then \`dept\`.

\`\`\`text
dept | avg_salary | above_company
Data | 85000 | 21666.67
Eng | 80000 | 16666.67
\`\`\`

Write it as two CTEs: one row per department, and one row for the company.`,
          starter: String.raw`-- WITH dept_avg AS (...), company AS (...)
-- dept | avg_salary | above_company, ORDER BY above_company DESC, dept.
`,
          solution: String.raw`WITH dept_avg AS (
  SELECT dept, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY dept
),
company AS (
  SELECT AVG(salary) AS avg_salary FROM employees
)
SELECT d.dept,
       ROUND(d.avg_salary, 2) AS avg_salary,
       ROUND(d.avg_salary - c.avg_salary, 2) AS above_company
FROM dept_avg d
CROSS JOIN company c
WHERE d.avg_salary > c.avg_salary
ORDER BY above_company DESC, d.dept;
`,
          hints: [
            "`company` has one row, so `CROSS JOIN company` puts the company average beside every department.",
            "Compare the unrounded averages in WHERE and round only in the SELECT list.",
            "The company average is over employees, not the average of the department averages.",
          ],
          cases: [
            { stdin: EMP_1, expected: "dept | avg_salary | above_company\nData | 85000 | 21666.67\nEng | 80000 | 16666.67\n" },
            { stdin: EMP_2, expected: "dept | avg_salary | above_company\n(no rows)\n", hidden: true },
            { stdin: EMP_3, expected: "dept | avg_salary | above_company\nX | 100 | 35\nY | 100 | 35\n", hidden: true },
          ],
        },
        {
          title: "Each customer's share of revenue",
          prompt: `Using only orders whose \`status\` is \`'paid'\`, show each customer's paid total and its share of all paid revenue.

| orders: id | customer | amount | status |
| --- | --- | --- | --- |
| 1 | Asha | 120 | paid |
| 2 | Ben | 80 | paid |
| 3 | Asha | 30 | paid |
| 4 | Chen | 200 | refunded |
| 5 | Chen | 50 | paid |
| 6 | Ben | 70 | paid |

Return \`customer\`, \`total\` (sum of their paid amounts) and \`pct\` (\`100 * total / all paid revenue\`, \`ROUND\`ed to 1 place). Customers with no paid order do not appear. Order by \`total\` descending, then \`customer\`.

\`\`\`text
customer | total | pct
Asha | 150 | 42.9
Ben | 150 | 42.9
Chen | 50 | 14.3
\`\`\``,
          starter: String.raw`-- Chain CTEs: paid orders -> totals per customer -> grand total.
-- customer | total | pct, ORDER BY total DESC, customer.
`,
          solution: String.raw`WITH paid AS (
  SELECT customer, amount FROM orders WHERE status = 'paid'
),
totals AS (
  SELECT customer, SUM(amount) AS total FROM paid GROUP BY customer
),
grand AS (
  SELECT SUM(total) AS grand_total FROM totals
)
SELECT t.customer, t.total, ROUND(100 * t.total / g.grand_total, 1) AS pct
FROM totals t
CROSS JOIN grand g
ORDER BY t.total DESC, t.customer;
`,
          hints: [
            "Three steps: filter to paid, sum per customer, sum the sums.",
            "Each CTE may read the ones above it; the final SELECT joins `totals` to the one-row `grand`.",
            "Multiply by 100 before dividing, and round only the final percentage.",
          ],
          cases: [
            { stdin: ORDERS_1, expected: "customer | total | pct\nAsha | 150 | 42.9\nBen | 150 | 42.9\nChen | 50 | 14.3\n" },
            { stdin: ORDERS_2, expected: "customer | total | pct\nZed | 100 | 100\n", hidden: true },
            { stdin: ORDERS_3, expected: "customer | total | pct\nC | 30 | 50\nB | 20 | 33.3\nA | 10 | 16.7\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is wrong with this statement?\n\n```sql\nWITH a AS (SELECT 1 AS x)\nWITH b AS (SELECT x + 1 AS y FROM a)\nSELECT y FROM b;\n```",
          options: [
            "Nothing",
            "`WITH` is written once; further CTEs follow after commas",
            "A CTE cannot read another CTE",
            "CTEs must be named with a column list",
          ],
          answer: 1,
          explanation: "The form is `WITH a AS (…), b AS (…) SELECT …`. `b` may read `a` because `a` is defined before it. Column lists are optional.",
        },
        {
          prompt: "A CTE is defined in one SELECT. Can the next statement in the same session read it?",
          options: ["Yes, until the session ends", "Yes, until the next COMMIT", "No — it exists only for the statement that defines it", "Only if it was materialized"],
          answer: 2,
          explanation: "A CTE is part of one statement. To keep a result for several statements use a temporary table; to keep a definition use a view.",
        },
        {
          prompt: "What can a CTE do that a derived table (a subquery in FROM) cannot?",
          options: [
            "Use GROUP BY",
            "Be referenced more than once in the statement without being written out again",
            "Be joined to another table",
            "Use an index",
          ],
          answer: 1,
          explanation: "A derived table is written where it is used, so using it twice means repeating it. A CTE is named once and referenced as often as needed — including from itself, with RECURSIVE. Both can group and be joined.",
        },
        {
          prompt: "Is a query rewritten with CTEs faster than the same query with derived tables in MySQL?",
          options: [
            "Always — CTEs are cached",
            "Never — CTEs are always materialized",
            "Not by itself: MySQL usually merges a CTE like a derived table, and may materialize one that is referenced several times",
            "Only on MySQL 5.7",
          ],
          answer: 2,
          explanation: "CTEs are mainly about readability. The optimizer merges a single-use CTE into the outer query, so the plan is often identical. MySQL 5.7 has no CTEs at all. The \"CTEs are slow\" folklore comes from PostgreSQL before version 12, which always materialized them.",
        },
      ],
    },
    {
      slug: "recursive-ctes",
      file: "04-recursive-ctes.md",
      exercises: [
        {
          title: "The org chart by level",
          prompt: `List everyone in the company with their level: 0 for anyone with no manager, 1 for their direct reports, and so on down.

| employees: id | name | manager_id |
| --- | --- | --- |
| 1 | Meera | NULL |
| 2 | Arjun | 1 |
| 3 | Divya | 1 |
| 4 | Kabir | 2 |
| 5 | Leela | 4 |
| 6 | Anil | 3 |
| 7 | Zara | 3 |

Return \`name\` and \`depth\`, ordered by \`depth\`, then \`name\`.

\`\`\`text
name | depth
Meera | 0
Arjun | 1
Divya | 1
Anil | 2
Kabir | 2
Zara | 2
Leela | 3
\`\`\`

A company may have more than one person without a manager; each starts a tree at depth 0. The depth of the chart is not fixed — use a recursive CTE.`,
          starter: String.raw`-- WITH RECURSIVE org AS ( anchor UNION ALL recursive member )
-- name | depth, ORDER BY depth, name.
`,
          solution: String.raw`WITH RECURSIVE org AS (
  SELECT id, name, 0 AS depth
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, org.depth + 1
  FROM employees e
  JOIN org ON e.manager_id = org.id
)
SELECT name, depth FROM org ORDER BY depth, name;
`,
          hints: [
            "The anchor is everyone with `manager_id IS NULL`, at depth 0.",
            "The recursive member joins `employees e` to the CTE on `e.manager_id = org.id` and adds 1 to the depth.",
            "The recursion stops by itself when a round finds no employees under the previous round's people.",
          ],
          cases: [
            { stdin: ORG_1, expected: "name | depth\nMeera | 0\nArjun | 1\nDivya | 1\nAnil | 2\nKabir | 2\nZara | 2\nLeela | 3\n" },
            { stdin: ORG_2, expected: "name | depth\nSolo | 0\n", hidden: true },
            { stdin: ORG_3, expected: "name | depth\nAna | 0\nBo | 0\nCy | 1\nDi | 2\n", hidden: true },
          ],
        },
        {
          title: "Full category paths",
          prompt: `Show every category with its full path from the top, the names joined by \`' > '\`.

| categories: id | name | parent_id |
| --- | --- | --- |
| 1 | Electronics | NULL |
| 2 | Phones | 1 |
| 3 | Laptops | 1 |
| 4 | Android | 2 |
| 5 | iPhone | 2 |
| 6 | Books | NULL |
| 7 | Fiction | 6 |

Return \`id\` and \`path\`, ordered by \`path\`.

\`\`\`text
id | path
6 | Books
7 | Books > Fiction
1 | Electronics
3 | Electronics > Laptops
2 | Electronics > Phones
4 | Electronics > Phones > Android
5 | Electronics > Phones > iPhone
\`\`\`

In MySQL, cast the anchor's path wide enough (\`CAST(name AS CHAR(200))\`) so longer paths built later are not cut off.`,
          starter: String.raw`-- WITH RECURSIVE tree AS (...) building path with CONCAT(parent path, ' > ', name)
-- id | path, ORDER BY path.
`,
          solution: String.raw`WITH RECURSIVE tree AS (
  SELECT id, CAST(name AS CHAR(200)) AS path
  FROM categories
  WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, CONCAT(t.path, ' > ', c.name)
  FROM categories c
  JOIN tree t ON c.parent_id = t.id
)
SELECT id, path FROM tree ORDER BY path;
`,
          hints: [
            "The anchor is the top-level categories, their path just their name.",
            "Each round joins children on `c.parent_id = t.id` and extends the parent's path with `CONCAT(t.path, ' > ', c.name)`.",
            "Sorting by the path places every child straight after its parent.",
          ],
          cases: [
            {
              stdin: CAT_1,
              expected: "id | path\n6 | Books\n7 | Books > Fiction\n1 | Electronics\n3 | Electronics > Laptops\n2 | Electronics > Phones\n4 | Electronics > Phones > Android\n5 | Electronics > Phones > iPhone\n",
            },
            {
              stdin: CAT_2,
              expected: "id | path\n1 | A\n2 | A > Very long category name\n3 | A > Very long category name > Even longer subcategory\n",
              hidden: true,
            },
            { stdin: CAT_3, expected: "id | path\n1 | Misc\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In a recursive CTE, what does the recursive member's reference to the CTE contain on each round?",
          options: [
            "Every row produced so far",
            "Only the rows produced by the previous round",
            "Only the anchor's rows",
            "The base table",
          ],
          answer: 1,
          explanation: "Each round sees just the previous round's new rows; the final result is the union of all rounds. That is why a counter `n + 1 … WHERE n < 5` advances one step per round instead of multiplying rows.",
        },
        {
          prompt: "When does `WITH RECURSIVE` stop producing rounds?",
          options: [
            "After 100 rounds",
            "When a round produces no rows",
            "When the anchor returns NULL",
            "When the final ORDER BY is reached",
          ],
          answer: 1,
          explanation: "An empty round ends the recursion. MySQL also aborts a runaway query at `cte_max_recursion_depth` (1000 by default) as a safety net — the query should stop well before it, by a counter, a depth limit or running out of children.",
        },
        {
          prompt: "A MySQL recursive CTE builds `path` starting from `name` in the anchor, and long paths come out cut short. What fixes it?",
          options: [
            "Use UNION instead of UNION ALL",
            "Cast the anchor's column wider, e.g. `CAST(name AS CHAR(200))`",
            "Add ORDER BY to the recursive member",
            "Use `||` instead of CONCAT",
          ],
          answer: 1,
          explanation: "The anchor decides each column's type, so a path typed from a short root name is too narrow for longer values. `||` is logical OR in MySQL by default, and ORDER BY is not allowed in the recursive member.",
        },
        {
          prompt: "Which of these is allowed in the recursive member of a MySQL recursive CTE?",
          options: ["`GROUP BY`", "`SUM(...)`", "A join to another table", "`ROW_NUMBER() OVER (...)`"],
          answer: 2,
          explanation: "Joins are how recursion walks a hierarchy. Aggregates, GROUP BY, window functions, ORDER BY and DISTINCT are not allowed in the recursive member — aggregate in the outer query instead.",
        },
        {
          prompt: "What happens if the `employees` data contains a cycle (A manages B, B manages A) and you walk it with a recursive join and `UNION ALL`?",
          options: [
            "The query stops at the cycle automatically",
            "Rows repeat round after round until MySQL's recursion limit aborts the query",
            "MySQL returns only the anchor",
            "The cycle rows are skipped",
          ],
          answer: 1,
          explanation: "With UNION ALL nothing notices a repeat; every round produces rows again. Guard with a depth limit or a visited-path check, or use UNION so already-produced rows are dropped.",
        },
      ],
    },
    {
      slug: "ctes-checkpoint",
      file: "05-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Daily revenue with every day shown",
          prompt: `The \`sales\` table has a row per sale. Report revenue for **every** day from the earliest sale date to the latest, including days with no sales (revenue 0).

| sales: id | sale_date | amount |
| --- | --- | --- |
| 1 | 2024-03-01 | 100 |
| 2 | 2024-03-01 | 50 |
| 3 | 2024-03-03 | 70 |
| 4 | 2024-03-05 | 20 |

Return \`day\` and \`revenue\`, ordered by \`day\`.

\`\`\`text
day | revenue
2024-03-01 | 150
2024-03-02 | 0
2024-03-03 | 70
2024-03-04 | 0
2024-03-05 | 20
\`\`\`

Generate the days with a recursive CTE and \`DATE_ADD(day, INTERVAL 1 DAY)\`; the table always has at least one sale.`,
          starter: String.raw`-- WITH RECURSIVE days AS (first sale date, then + 1 day until the last)
-- LEFT JOIN sales; day | revenue, ORDER BY day.
`,
          solution: String.raw`WITH RECURSIVE days AS (
  SELECT MIN(sale_date) AS day FROM sales
  UNION ALL
  SELECT DATE_ADD(day, INTERVAL 1 DAY)
  FROM days
  WHERE day < (SELECT MAX(sale_date) FROM sales)
)
SELECT d.day, COALESCE(SUM(s.amount), 0) AS revenue
FROM days d
LEFT JOIN sales s ON s.sale_date = d.day
GROUP BY d.day
ORDER BY d.day;
`,
          hints: [
            "Anchor: `SELECT MIN(sale_date) AS day FROM sales`; recursive member: the next day while `day` is before the last sale date.",
            "LEFT JOIN `sales` to the days so empty days survive, then group by the day.",
            "`SUM` over no rows is NULL — wrap it in `COALESCE(…, 0)`.",
          ],
          cases: [
            { stdin: DAILY_1, expected: "day | revenue\n2024-03-01 | 150\n2024-03-02 | 0\n2024-03-03 | 70\n2024-03-04 | 0\n2024-03-05 | 20\n" },
            { stdin: DAILY_2, expected: "day | revenue\n2024-12-31 | 15\n", hidden: true },
            { stdin: DAILY_3, expected: "day | revenue\n2024-02-28 | 10\n2024-02-29 | 0\n2024-03-01 | 30\n", hidden: true },
          ],
        },
        {
          title: "Activity across posts and comments",
          prompt: `Count each user's activity: the number of their posts plus the number of their comments. Users with no activity show 0.

| users: id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ben |
| 3 | Chen |
| 4 | Dev |

| posts: id | user_id |
| --- | --- |
| 1 | 1 |
| 2 | 1 |
| 3 | 2 |

| comments: id | user_id |
| --- | --- |
| 1 | 2 |
| 2 | 2 |
| 3 | 1 |
| 4 | 3 |

Return \`name\` and \`activity\`, ordered by \`activity\` descending, then \`name\`.

\`\`\`text
name | activity
Asha | 3
Ben | 3
Chen | 1
Dev | 0
\`\`\``,
          starter: String.raw`-- WITH actions AS (posts' user_ids stacked with comments' user_ids)
-- name | activity, ORDER BY activity DESC, name.
`,
          solution: String.raw`WITH actions AS (
  SELECT user_id FROM posts
  UNION ALL
  SELECT user_id FROM comments
)
SELECT u.name, COUNT(a.user_id) AS activity
FROM users u
LEFT JOIN actions a ON a.user_id = u.id
GROUP BY u.id, u.name
ORDER BY activity DESC, u.name;
`,
          hints: [
            "Stack the `user_id` of every post and every comment in a CTE — with `UNION ALL`, or a user's second post disappears.",
            "LEFT JOIN users to the CTE so users with no activity stay.",
            "`COUNT(a.user_id)` counts matches only; `COUNT(*)` would give the inactive users 1.",
          ],
          cases: [
            { stdin: FEED_1, expected: "name | activity\nAsha | 3\nBen | 3\nChen | 1\nDev | 0\n" },
            { stdin: FEED_2, expected: "name | activity\nPia | 2\nOla | 0\n", hidden: true },
            { stdin: FEED_3, expected: "name | activity\nRaj | 3\n", hidden: true },
          ],
        },
        {
          title: "Every manager's whole team",
          prompt: `For each employee who manages anyone, count everyone below them — direct reports, their reports, and so on.

| employees: id | name | manager_id |
| --- | --- | --- |
| 1 | Meera | NULL |
| 2 | Arjun | 1 |
| 3 | Divya | 1 |
| 4 | Kabir | 2 |
| 5 | Leela | 4 |
| 6 | Anil | 3 |

Return \`name\` and \`team_size\`, ordered by \`team_size\` descending, then \`name\`. People who manage no one do not appear.

\`\`\`text
name | team_size
Meera | 5
Arjun | 2
Divya | 1
Kabir | 1
\`\`\``,
          starter: String.raw`-- Recursive CTE of (boss, person) pairs at any depth, then group by boss.
-- name | team_size, ORDER BY team_size DESC, name.
`,
          solution: String.raw`WITH RECURSIVE reports AS (
  SELECT manager_id AS boss, id AS person
  FROM employees
  WHERE manager_id IS NOT NULL
  UNION ALL
  SELECT r.boss, e.id
  FROM reports r
  JOIN employees e ON e.manager_id = r.person
)
SELECT m.name, COUNT(*) AS team_size
FROM reports r
JOIN employees m ON m.id = r.boss
GROUP BY r.boss, m.name
ORDER BY team_size DESC, m.name;
`,
          hints: [
            "Anchor: one `(boss, person)` row per direct report — `manager_id` and `id`.",
            "Recursive member: for each pair, the people whose manager is `person`, keeping the same `boss`.",
            "Aggregates are not allowed inside the recursion: group the pairs by boss in the outer query and join for the name.",
          ],
          cases: [
            { stdin: TEAM_1, expected: "name | team_size\nMeera | 5\nArjun | 2\nDivya | 1\nKabir | 1\n" },
            { stdin: TEAM_2, expected: "name | team_size\n(no rows)\n", hidden: true },
            { stdin: TEAM_3, expected: "name | team_size\nBoss | 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which statement is refused?",
          options: [
            "`SELECT a, b FROM t1 UNION SELECT c, d FROM t2`",
            "`SELECT a, b FROM t1 UNION SELECT c FROM t2`",
            "`SELECT a FROM t1 UNION ALL SELECT c FROM t2 ORDER BY a`",
            "`SELECT a FROM t1 UNION SELECT 'x'`",
          ],
          answer: 1,
          explanation: "Every SELECT of a union needs the same number of columns. Different names are fine (the first SELECT names the result), a trailing ORDER BY sorts the whole result, and a SELECT with no FROM is a valid branch.",
        },
        {
          prompt: "A union's branches are tagged with `'post'` and `'comment'` in a `kind` column. What changes if you switch `UNION ALL` to `UNION`?",
          options: [
            "Nothing is removed between the branches, but identical rows *within* one branch are now collapsed",
            "Nothing at all, ever",
            "The kind column is dropped",
            "The result is sorted by kind",
          ],
          answer: 0,
          explanation: "The tag makes rows of different branches different, so nothing is removed *between* branches — but two identical rows inside one branch are still collapsed by UNION. UNION does not promise any order.",
        },
        {
          prompt: "`SELECT x FROM a EXCEPT SELECT x FROM b` — `a.x` is {1, 1, 2, 3}, `b.x` is {3}. What is returned?",
          options: ["1, 1, 2", "1, 2", "2", "3"],
          answer: 1,
          explanation: "EXCEPT returns the *distinct* rows of the first result not found in the second: 1 and 2. (`EXCEPT ALL`, where supported, would keep both 1s.)",
        },
        {
          prompt: "Which way of writing \"customers with no orders\" returns no rows at all if `orders.customer_id` contains a NULL?",
          options: [
            "`WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)`",
            "`LEFT JOIN orders o ON o.customer_id = c.id WHERE o.customer_id IS NULL`",
            "`WHERE c.id NOT IN (SELECT customer_id FROM orders)`",
            "`SELECT id FROM customers EXCEPT SELECT customer_id FROM orders`",
          ],
          answer: 2,
          explanation: "NOT IN compares with `<>` against every value, and `<> NULL` is unknown, so no row passes. The other three are unaffected by a NULL in `orders.customer_id`.",
        },
        {
          prompt: "Which is the correct way to emulate `A INTERSECT B` on a single `id` column in MySQL 5.7?",
          options: [
            "`SELECT DISTINCT id FROM A WHERE id IN (SELECT id FROM B)`",
            "`SELECT id FROM A UNION SELECT id FROM B`",
            "`SELECT id FROM A WHERE id NOT IN (SELECT id FROM B)`",
            "`SELECT id FROM A CROSS JOIN B`",
          ],
          answer: 0,
          explanation: "A semi-join (IN or EXISTS) keeps A's rows that have a match in B; DISTINCT matches INTERSECT's duplicate removal. UNION is \"either\", NOT IN is the difference, and a cross join pairs every row with every row.",
        },
        {
          prompt: "In `WITH a AS (…), b AS (…), c AS (…) SELECT …`, which CTEs can `b` read?",
          options: ["`a` only", "`a` and `c`", "`c` only", "None — CTEs cannot read each other"],
          answer: 0,
          explanation: "A CTE can read the CTEs defined before it in the same WITH list. The final SELECT can read all three.",
        },
        {
          prompt: "Why would you choose a temporary table over a CTE?",
          options: [
            "A CTE cannot contain joins",
            "The intermediate result must be read by several separate statements, or needs its own index",
            "Temporary tables are always faster",
            "CTEs cannot be used with GROUP BY",
          ],
          answer: 1,
          explanation: "A CTE lives for one statement and has no indexes of its own; a temporary table lasts for the session, can be indexed and read many times. CTEs can join and group freely.",
        },
        {
          prompt: "What does this return?\n\n```sql\nWITH RECURSIVE s AS (\n  SELECT 2 AS n\n  UNION ALL\n  SELECT n * 2 FROM s WHERE n < 20\n)\nSELECT COUNT(*) FROM s;\n```",
          options: ["4", "5", "10", "It never stops"],
          answer: 1,
          explanation: "Rounds: 2, 4, 8, 16, 32. From 32 the condition `n < 20` fails, so that round is empty. 32 itself was produced from 16 (which passed), so five rows.",
        },
        {
          prompt: "In the anchor of an org-chart recursive CTE, which condition selects the top of the hierarchy?",
          options: ["`WHERE manager_id = 0`", "`WHERE manager_id IS NULL`", "`WHERE manager_id = NULL`", "`WHERE id = manager_id`"],
          answer: 1,
          explanation: "The person with no manager has `manager_id` NULL, and NULL is tested with `IS NULL` — `= NULL` is never true.",
        },
        {
          prompt: "To fill missing days in a daily report, you generate dates with a recursive CTE. How do you join the data?",
          options: [
            "`INNER JOIN sales` on the date",
            "`LEFT JOIN sales` from the dates, then `COALESCE(SUM(amount), 0)`",
            "`RIGHT JOIN` the dates to sales",
            "`UNION ALL` the dates with sales",
          ],
          answer: 1,
          explanation: "The dates must all survive, so they are the preserved side of a LEFT JOIN; a day with no sales then has NULL amounts, and `SUM` of nothing is NULL until COALESCE makes it 0. An inner join would drop the empty days again.",
        },
        {
          prompt: "Which operation binds tightest in MySQL and standard SQL when mixed without parentheses?",
          options: ["UNION", "EXCEPT", "INTERSECT", "They all bind equally, left to right"],
          answer: 2,
          explanation: "INTERSECT binds tighter than UNION and EXCEPT, so `A UNION B INTERSECT C` is `A UNION (B INTERSECT C)`. SQLite is the exception, evaluating left to right — parentheses or CTEs avoid the question.",
        },
        {
          prompt: "Where does the aggregation go when you want the total size of each manager's subtree?",
          options: [
            "Inside the recursive member, with GROUP BY boss",
            "In the anchor",
            "In the outer query that reads the recursive CTE",
            "It cannot be done in SQL",
          ],
          answer: 2,
          explanation: "The recursive member may not aggregate. Let the CTE produce one row per (boss, person) pair at every depth and group them outside.",
        },
      ],
    },
  ],
});
