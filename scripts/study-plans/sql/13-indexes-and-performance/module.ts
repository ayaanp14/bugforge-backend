import { defineModule } from "../../dsl.js";

const ORDERS_A = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (1, 7, '2024-03-02', 450),
  (2, 3, '2024-03-02', 120),
  (3, 7, '2024-01-15', 980),
  (4, 5, '2024-02-01', 300),
  (5, 7, '2024-03-02', 75),
  (6, 3, '2024-04-10', 610);
`;

const ORDERS_B = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (10, 1, '2024-05-01', 200),
  (11, 2, '2024-05-02', 330);
`;

const ORDERS_C = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (21, 7, '2023-12-31', 90),
  (22, 70, '2024-01-01', 15),
  (23, 7, '2024-06-30', 640),
  (24, 7, '2024-06-30', 640),
  (25, 17, '2024-02-02', 5),
  (26, 7, '2025-01-01', 1);
`;

const MARCH_A = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (1, 3, '2024-02-14', 250),
  (2, 3, '2024-03-02', 180),
  (3, 5, '2024-03-11', 900),
  (4, 3, '2024-03-19', 420),
  (5, 7, '2024-03-02', 60),
  (6, 3, '2024-04-01', 310),
  (7, 3, '2024-03-02', 95);
`;

const MARCH_B = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (1, 3, '2024-02-29', 10),
  (2, 4, '2024-03-15', 20),
  (3, 3, '2023-03-15', 30),
  (4, 3, '2025-03-15', 40);
`;

const MARCH_C = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (8, 3, '2024-03-31', 75),
  (9, 3, '2024-03-01', 5),
  (10, 33, '2024-03-10', 500),
  (11, 3, '2024-03-31', 12);
`;

const PLANS_A = String.raw`CREATE TABLE plan_rows (
  query_id INT,
  step INT,
  table_name VARCHAR(30),
  type VARCHAR(20),
  possible_keys VARCHAR(80),
  key_name VARCHAR(40),
  rows_examined INT,
  extra VARCHAR(120)
);
INSERT INTO plan_rows VALUES
  (1, 1, 'customers', 'ref', 'idx_city', 'idx_city', 120, 'Using index'),
  (1, 2, 'orders', 'ALL', NULL, NULL, 498211, 'Using where; Using join buffer (hash join)'),
  (2, 1, 'orders', 'range', 'idx_placed_on', 'idx_placed_on', 3100, 'Using index condition; Using filesort'),
  (3, 1, 'products', 'ALL', 'idx_category', NULL, 2400, 'Using where'),
  (3, 2, 'reviews', 'ref', 'idx_product', 'idx_product', 14, NULL),
  (4, 1, 'users', 'const', 'PRIMARY', 'PRIMARY', 1, NULL),
  (5, 1, 'events', 'index', 'idx_tenant_time', 'idx_tenant_time', 75000, 'Using index; Using filesort');
`;

const PLANS_B = String.raw`CREATE TABLE plan_rows (
  query_id INT,
  step INT,
  table_name VARCHAR(30),
  type VARCHAR(20),
  possible_keys VARCHAR(80),
  key_name VARCHAR(40),
  rows_examined INT,
  extra VARCHAR(120)
);
INSERT INTO plan_rows VALUES
  (7, 1, 'cities', 'ALL', NULL, NULL, 40, NULL),
  (7, 2, 'users', 'eq_ref', 'PRIMARY', 'PRIMARY', 1, NULL),
  (8, 1, 'logs', 'ALL', NULL, NULL, 40, 'Using where; Using temporary; Using filesort'),
  (9, 1, 'tags', 'index_merge', 'idx_a,idx_b', 'idx_a,idx_b', 30, 'Using union(idx_a,idx_b); Using where');
`;

const PLANS_C = String.raw`CREATE TABLE plan_rows (
  query_id INT,
  step INT,
  table_name VARCHAR(30),
  type VARCHAR(20),
  possible_keys VARCHAR(80),
  key_name VARCHAR(40),
  rows_examined INT,
  extra VARCHAR(120)
);
INSERT INTO plan_rows VALUES
  (1, 1, 'users', 'ref_or_null', 'idx_ref', 'idx_ref', 6, 'Using index condition'),
  (2, 1, 'users', 'system', NULL, NULL, 1, NULL),
  (2, 2, 'orders', 'ref', 'idx_user', 'idx_user', 3, NULL);
`;

const CREATED_A = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  created_at DATETIME NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (1, '2023-12-31 23:59:59', 400),
  (2, '2024-01-01 00:00:00', 150),
  (3, '2024-07-14 12:05:00', 820),
  (4, '2024-12-31 23:30:00', 99),
  (5, '2025-01-01 00:00:00', 310),
  (6, '2024-12-31 09:00:00', 45);
`;

const CREATED_B = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  created_at DATETIME NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (1, '2022-05-05 10:00:00', 10),
  (2, '2023-11-30 18:20:00', 20),
  (3, '2025-02-01 08:00:00', 30);
`;

const CREATED_C = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  created_at DATETIME NOT NULL,
  amount INT NOT NULL
);
INSERT INTO orders VALUES
  (7, '2024-02-29 00:00:00', 5),
  (3, '2024-02-29 00:00:00', 6),
  (9, '2024-12-31 23:59:59', 7),
  (1, '2024-06-01 06:30:00', 8);
`;

const SIGNUPS_A = String.raw`CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(40) NOT NULL,
  signup_date DATE NOT NULL
);
INSERT INTO users VALUES
  (1, 'admin', '2024-06-20'),
  (2, 'adm_ops', '2024-05-31'),
  (3, 'adm_billing', '2024-05-30'),
  (4, 'ravi', '2024-06-25'),
  (5, 'ad', '2024-06-29'),
  (6, 'xadmin', '2024-06-10'),
  (7, 'administrator', '2024-06-30');
`;

const SIGNUPS_B = String.raw`CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(40) NOT NULL,
  signup_date DATE NOT NULL
);
INSERT INTO users VALUES
  (1, 'meera', '2024-06-20'),
  (2, 'adm', '2023-06-30');
`;

const SIGNUPS_C = String.raw`CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(40) NOT NULL,
  signup_date DATE NOT NULL
);
INSERT INTO users VALUES
  (9, 'adm9', '2024-06-01'),
  (4, 'adm4', '2024-06-01'),
  (5, 'adm', '2024-05-31'),
  (6, 'ad_m', '2024-06-15');
`;

const COVER_A = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  status VARCHAR(12) NOT NULL,
  amount INT NOT NULL,
  notes TEXT
);
INSERT INTO orders VALUES
  (1, 4, '2024-01-09', 'paid', 300, 'gift wrap'),
  (2, 2, '2024-02-11', 'paid', 1200, NULL),
  (3, 4, '2024-03-30', 'refunded', 450, 'damaged box'),
  (4, 9, '2023-12-31', 'paid', 5000, NULL),
  (5, 2, '2024-05-05', 'paid', 300, NULL),
  (6, 9, '2024-06-18', 'paid', 750, 'call first'),
  (7, 4, '2025-01-02', 'paid', 80, NULL);
`;

const COVER_B = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  status VARCHAR(12) NOT NULL,
  amount INT NOT NULL,
  notes TEXT
);
INSERT INTO orders VALUES
  (1, 1, '2023-03-01', 'paid', 100, NULL),
  (2, 2, '2025-03-01', 'paid', 200, NULL);
`;

const COVER_C = String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  placed_on DATE NOT NULL,
  status VARCHAR(12) NOT NULL,
  amount INT NOT NULL,
  notes TEXT
);
INSERT INTO orders VALUES
  (1, 8, '2024-01-01', 'paid', 500, NULL),
  (2, 3, '2024-12-31', 'paid', 250, NULL),
  (3, 3, '2024-07-07', 'paid', 250, NULL),
  (4, 5, '2024-04-04', 'paid', 500, NULL);
`;

export default defineModule(import.meta.url, {
  slug: "indexes-and-performance",
  title: "Indexes and performance",
  blurb: "B+tree indexes and InnoDB's clustered primary key, selectivity and the cost of every index, composite indexes and the leftmost prefix rule, reading MySQL's EXPLAIN and EXPLAIN ANALYZE, sargable predicates and their rewrites, and covering indexes.",
  icon: "cpu",
  overview: `Every slow query conversation ends at the same place: is there an index the query can use, and is the query written so that it can use it? This module explains indexes from the storage up, as MySQL 8's InnoDB engine builds them — pages, B+trees, a table stored as its primary key, secondary indexes that point to it — and then turns that picture into the working rules an engineer applies every day: which columns to index and in what order, how to read the plan the optimizer chose, how to write predicates an index can serve, and how to answer a query from the index alone.

How indexes work covers the B+tree and why it is shallow, the clustered primary key, what a secondary index stores, selectivity and what every index costs. Composite indexes covers the sort order of a multi-column index, the leftmost prefix rule, how a range stops a seek, sorting from an index and choosing the column order. Reading a query plan covers \`EXPLAIN\`'s columns, the access-type ladder from \`const\` to \`ALL\`, the \`Extra\` notes and \`EXPLAIN ANALYZE\`. Sargable queries covers functions, arithmetic, wildcards and type conversions on indexed columns, and functional indexes. Covering indexes covers index-only reads, the primary key carried in every secondary index, and deferred joins.

The exercise engine is SQLite behind a MySQL layer, so plans are read rather than printed; the exercises judge the rows. They create indexes and run the queries those indexes serve, measure selectivity, compute the leftmost prefix and index coverage from catalog-style tables, audit stored \`EXPLAIN\` rows, and rewrite non-sargable predicates without losing an edge row. The checkpoint removes the duplicates that block a \`UNIQUE\` index, writes an indexed monthly report and finds the indexes nobody reads.`,
  lessons: [
    {
      slug: "how-indexes-work",
      file: "01-how-indexes-work.md",
      exercises: [
        {
          title: "Index the lookup column",
          prompt: `Customer support looks up one customer's orders many times a minute. Create an index named \`idx_orders_customer\` on \`orders (customer_id)\`, then return customer **7**'s orders.

\`orders\`:

| id | customer_id | placed_on | amount |
| --- | --- | --- | --- |
| 1 | 7 | 2024-03-02 | 450 |
| 2 | 3 | 2024-03-02 | 120 |
| 3 | 7 | 2024-01-15 | 980 |
| 4 | 5 | 2024-02-01 | 300 |
| 5 | 7 | 2024-03-02 | 75 |
| 6 | 3 | 2024-04-10 | 610 |

**Output columns:** \`id\`, \`placed_on\`, \`amount\`, ordered by \`placed_on\`, then \`id\`.

\`\`\`text
id | placed_on | amount
3 | 2024-01-15 | 980
1 | 2024-03-02 | 450
5 | 2024-03-02 | 75
\`\`\``,
          starter: String.raw`-- 1. Create the index idx_orders_customer on orders (customer_id).
-- 2. Return customer 7's orders: id, placed_on, amount,
--    ordered by placed_on, then id.
`,
          solution: String.raw`CREATE INDEX idx_orders_customer ON orders (customer_id);

SELECT id, placed_on, amount
FROM orders
WHERE customer_id = 7
ORDER BY placed_on, id;
`,
          hints: [
            "`CREATE INDEX <name> ON <table> (<column>);` is its own statement; end it with `;` and write the SELECT after it.",
            "The index changes how fast the rows are found, not which rows: the SELECT is an ordinary `WHERE customer_id = 7` with a two-key `ORDER BY`.",
          ],
          cases: [
            { stdin: ORDERS_A, expected: "id | placed_on | amount\n3 | 2024-01-15 | 980\n1 | 2024-03-02 | 450\n5 | 2024-03-02 | 75\n" },
            { stdin: ORDERS_B, expected: "id | placed_on | amount\n(no rows)\n", hidden: true },
            { stdin: ORDERS_C, expected: "id | placed_on | amount\n21 | 2023-12-31 | 90\n23 | 2024-06-30 | 640\n24 | 2024-06-30 | 640\n26 | 2025-01-01 | 1\n", hidden: true },
          ],
        },
        {
          title: "Measure selectivity before indexing",
          prompt: `Before adding indexes to \`users\`, measure how selective each candidate column is. For each of \`email\`, \`country\`, \`plan\` and \`is_active\`, return its name, its number of distinct non-NULL values, and its selectivity — distinct values divided by the number of rows in the table, rounded to 4 places.

\`users\`:

| id | email | country | plan | is_active |
| --- | --- | --- | --- | --- |
| 1 | asha@example.com | IN | free | 1 |
| 2 | ravi@example.com | IN | pro | 1 |
| 3 | lee@example.com | US | free | 0 |
| 4 | meera@example.com | IN | free | 1 |
| 5 | tom@example.com | UK | team | 1 |
| 6 | ana@example.com | US | free | 1 |
| 7 | kiran@example.com | IN | pro | 0 |
| 8 | zoya@example.com | IN | free | 1 |

**Output columns:** \`column_name\`, \`distinct_values\`, \`selectivity\` — one row per column (build them with \`UNION ALL\`), ordered by \`selectivity\` descending, then \`column_name\`.

\`\`\`text
column_name | distinct_values | selectivity
email | 8 | 1
country | 3 | 0.375
plan | 3 | 0.375
is_active | 2 | 0.25
\`\`\``,
          starter: String.raw`-- One SELECT per column, glued with UNION ALL:
-- 'email' AS column_name, COUNT(DISTINCT email) AS distinct_values,
-- ROUND(COUNT(DISTINCT email) / COUNT(*), 4) AS selectivity
-- Then ORDER BY selectivity DESC, column_name.
`,
          solution: String.raw`SELECT 'email' AS column_name,
       COUNT(DISTINCT email) AS distinct_values,
       ROUND(COUNT(DISTINCT email) / COUNT(*), 4) AS selectivity
FROM users
UNION ALL
SELECT 'country', COUNT(DISTINCT country), ROUND(COUNT(DISTINCT country) / COUNT(*), 4)
FROM users
UNION ALL
SELECT 'plan', COUNT(DISTINCT plan), ROUND(COUNT(DISTINCT plan) / COUNT(*), 4)
FROM users
UNION ALL
SELECT 'is_active', COUNT(DISTINCT is_active), ROUND(COUNT(DISTINCT is_active) / COUNT(*), 4)
FROM users
ORDER BY selectivity DESC, column_name;
`,
          hints: [
            "`COUNT(DISTINCT col)` counts distinct non-NULL values; `COUNT(*)` counts rows, NULLs included — the denominator the prompt asks for.",
            "A `UNION ALL` takes its column names from the first SELECT, and its `ORDER BY` goes once, at the very end.",
            "`/` is decimal division here as in MySQL, so `3 / 8` is 0.375 without any cast.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(120), country VARCHAR(2), plan VARCHAR(10), is_active INT);
INSERT INTO users VALUES
  (1, 'asha@example.com', 'IN', 'free', 1),
  (2, 'ravi@example.com', 'IN', 'pro', 1),
  (3, 'lee@example.com', 'US', 'free', 0),
  (4, 'meera@example.com', 'IN', 'free', 1),
  (5, 'tom@example.com', 'UK', 'team', 1),
  (6, 'ana@example.com', 'US', 'free', 1),
  (7, 'kiran@example.com', 'IN', 'pro', 0),
  (8, 'zoya@example.com', 'IN', 'free', 1);
`,
              expected: "column_name | distinct_values | selectivity\nemail | 8 | 1\ncountry | 3 | 0.375\nplan | 3 | 0.375\nis_active | 2 | 0.25\n",
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(120), country VARCHAR(2), plan VARCHAR(10), is_active INT);
INSERT INTO users VALUES
  (1, 'a@x.io', NULL, 'free', 1),
  (2, 'b@x.io', 'IN', 'free', 1),
  (3, 'c@x.io', NULL, 'free', 1);
`,
              expected: "column_name | distinct_values | selectivity\nemail | 3 | 1\ncountry | 1 | 0.3333\nis_active | 1 | 0.3333\nplan | 1 | 0.3333\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(120), country VARCHAR(2), plan VARCHAR(10), is_active INT);
INSERT INTO users VALUES
  (1, 'p@x.io', 'IN', 'free', 1),
  (2, 'p@x.io', 'US', 'pro', 0),
  (3, 'q@x.io', 'UK', 'team', 1),
  (4, 'r@x.io', 'DE', 'free', 0);
`,
              expected: "column_name | distinct_values | selectivity\ncountry | 4 | 1\nemail | 3 | 0.75\nplan | 3 | 0.75\nis_active | 2 | 0.5\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In InnoDB, what is stored in the leaf pages of the clustered index?",
          options: ["Only the primary key values", "The complete rows, in primary key order", "Physical row addresses", "The secondary index entries"],
          answer: 1,
          explanation: "InnoDB stores the table **as** the B+tree on the primary key, so its leaves hold the full rows. That is why a table has exactly one clustered index and why a primary key range scan reads rows directly.",
        },
        {
          prompt: "What does an InnoDB secondary index entry use to point back to its row?",
          options: ["A physical page and slot number", "The row's primary key value", "A hash of the row", "The hidden row id, always"],
          answer: 1,
          explanation: "Secondary leaves store the indexed columns plus the primary key, so a lookup searches the clustered index by that key. The hidden 6-byte row id is used only when the table has no primary key and no unique NOT NULL index. PostgreSQL, by contrast, points at a physical tuple location.",
        },
        {
          prompt: "Why is a B+tree only three or four levels deep for millions of rows?",
          options: ["It is rebalanced into a binary tree on every insert", "Each node is a whole page holding hundreds of keys, so the fan-out is huge", "It stores only distinct values", "MySQL caps tables at four levels"],
          answer: 1,
          explanation: "With hundreds of keys per 16 KB page, each level multiplies the reachable entries by hundreds: three levels reach tens of millions. A binary tree has a fan-out of two and would need about twenty-four levels.",
        },
        {
          prompt: "Which column is the **worst** candidate for a single-column index on a 10-million-row `users` table?",
          options: ["`email` (unique)", "`phone` (almost unique)", "`is_active` (0 or 1, mostly 1)", "`username` (unique)"],
          answer: 2,
          explanation: "`is_active` has a selectivity near zero: a lookup on the common value returns most of the table, so the optimizer will scan anyway, while the index still costs every write. The other three return one row per lookup.",
        },
        {
          prompt: "Why not create an index on every column of a table?",
          options: ["MySQL allows only one index per table", "Every index must be updated on each write and takes disk and buffer-pool memory, while unused ones speed up nothing", "Indexes make SELECT slower", "Indexes change query results"],
          answer: 1,
          explanation: "Indexes speed up the reads that use them and tax every INSERT, UPDATE and DELETE. Index the columns real queries filter, join and sort on. A table may have up to 64 secondary indexes in InnoDB, so the limit is cost, not a rule.",
        },
      ],
    },
    {
      slug: "composite-indexes",
      file: "02-composite-indexes.md",
      exercises: [
        {
          title: "A customer's month, from one index",
          prompt: `The account page shows one customer's orders for one month. Create an index named \`idx_orders_cust_date\` on \`orders (customer_id, placed_on)\` — equality column first, range column second — then return customer **3**'s orders placed in **March 2024**. Write the month as a range on the bare \`placed_on\` column.

\`orders\`:

| id | customer_id | placed_on | amount |
| --- | --- | --- | --- |
| 1 | 3 | 2024-02-14 | 250 |
| 2 | 3 | 2024-03-02 | 180 |
| 3 | 5 | 2024-03-11 | 900 |
| 4 | 3 | 2024-03-19 | 420 |
| 5 | 7 | 2024-03-02 | 60 |
| 6 | 3 | 2024-04-01 | 310 |
| 7 | 3 | 2024-03-02 | 95 |

**Output columns:** \`id\`, \`placed_on\`, \`amount\`, ordered by \`placed_on\`, then \`id\`.

\`\`\`text
id | placed_on | amount
2 | 2024-03-02 | 180
7 | 2024-03-02 | 95
4 | 2024-03-19 | 420
\`\`\``,
          starter: String.raw`-- 1. CREATE INDEX idx_orders_cust_date on (customer_id, placed_on).
-- 2. Customer 3's March 2024 orders: id, placed_on, amount,
--    ordered by placed_on, then id.
`,
          solution: String.raw`CREATE INDEX idx_orders_cust_date ON orders (customer_id, placed_on);

SELECT id, placed_on, amount
FROM orders
WHERE customer_id = 3
  AND placed_on >= '2024-03-01'
  AND placed_on < '2024-04-01'
ORDER BY placed_on, id;
`,
          hints: [
            "List the index columns in order inside the parentheses: `(customer_id, placed_on)`.",
            "March is `placed_on >= '2024-03-01' AND placed_on < '2024-04-01'` — a half-open range that keeps the 31st and drops 1 April.",
          ],
          cases: [
            { stdin: MARCH_A, expected: "id | placed_on | amount\n2 | 2024-03-02 | 180\n7 | 2024-03-02 | 95\n4 | 2024-03-19 | 420\n" },
            { stdin: MARCH_B, expected: "id | placed_on | amount\n(no rows)\n", hidden: true },
            { stdin: MARCH_C, expected: "id | placed_on | amount\n9 | 2024-03-01 | 5\n8 | 2024-03-31 | 75\n11 | 2024-03-31 | 12\n", hidden: true },
          ],
        },
        {
          title: "Work out the leftmost prefix",
          prompt: `A catalog table lists each index's columns in order (\`seq\` starts at 1), and another lists the columns each query compares with **equality**. For every pair of a query and an index, compute how many leading columns of the index the query can seek on: the count of consecutive index columns, from \`seq\` 1, that all appear among the query's filter columns (0 when the first column is missing).

\`index_columns\`:

| index_name | seq | column_name |
| --- | --- | --- |
| idx_cust_date | 1 | customer_id |
| idx_cust_date | 2 | placed_on |
| idx_status_cust_date | 1 | status |
| idx_status_cust_date | 2 | customer_id |
| idx_status_cust_date | 3 | placed_on |
| idx_date | 1 | placed_on |

\`query_filters\`:

| query_id | column_name |
| --- | --- |
| 1 | customer_id |
| 2 | customer_id |
| 2 | placed_on |
| 3 | status |
| 3 | placed_on |
| 4 | placed_on |

**Output columns:** \`query_id\`, \`index_name\`, \`usable_columns\` — one row for every query in \`query_filters\` and every index in \`index_columns\`, ordered by \`query_id\`, then \`index_name\`.

\`\`\`text
query_id | index_name | usable_columns
1 | idx_cust_date | 1
1 | idx_date | 0
1 | idx_status_cust_date | 0
2 | idx_cust_date | 2
2 | idx_date | 1
2 | idx_status_cust_date | 0
3 | idx_cust_date | 0
3 | idx_date | 1
3 | idx_status_cust_date | 1
4 | idx_cust_date | 0
4 | idx_date | 1
4 | idx_status_cust_date | 0
\`\`\``,
          starter: String.raw`-- Pair every query with every index (CROSS JOIN of the DISTINCT ids/names).
-- usable_columns = (the smallest seq whose column the query does NOT filter) - 1,
-- or the index's full column count when it filters them all.
`,
          solution: String.raw`SELECT q.query_id,
       i.index_name,
       COALESCE(
         (SELECT MIN(ic.seq)
          FROM index_columns ic
          WHERE ic.index_name = i.index_name
            AND ic.column_name NOT IN (SELECT f.column_name
                                       FROM query_filters f
                                       WHERE f.query_id = q.query_id)) - 1,
         (SELECT MAX(ic.seq) FROM index_columns ic WHERE ic.index_name = i.index_name)
       ) AS usable_columns
FROM (SELECT DISTINCT query_id FROM query_filters) AS q
CROSS JOIN (SELECT DISTINCT index_name FROM index_columns) AS i
ORDER BY q.query_id, i.index_name;
`,
          hints: [
            "The prefix stops at the first index column the query does not filter, so find that column's `seq` with a correlated `MIN(seq) … WHERE column_name NOT IN (the query's columns)`.",
            "When every index column is filtered that MIN is NULL; `COALESCE` it with the index's `MAX(seq)`.",
            "Build the pairs with `(SELECT DISTINCT query_id …) q CROSS JOIN (SELECT DISTINCT index_name …) i`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE index_columns (index_name VARCHAR(40), seq INT, column_name VARCHAR(40));
INSERT INTO index_columns VALUES
  ('idx_cust_date', 1, 'customer_id'), ('idx_cust_date', 2, 'placed_on'),
  ('idx_status_cust_date', 1, 'status'), ('idx_status_cust_date', 2, 'customer_id'), ('idx_status_cust_date', 3, 'placed_on'),
  ('idx_date', 1, 'placed_on');
CREATE TABLE query_filters (query_id INT, column_name VARCHAR(40));
INSERT INTO query_filters VALUES
  (1, 'customer_id'), (2, 'customer_id'), (2, 'placed_on'),
  (3, 'status'), (3, 'placed_on'), (4, 'placed_on');
`,
              expected: "query_id | index_name | usable_columns\n1 | idx_cust_date | 1\n1 | idx_date | 0\n1 | idx_status_cust_date | 0\n2 | idx_cust_date | 2\n2 | idx_date | 1\n2 | idx_status_cust_date | 0\n3 | idx_cust_date | 0\n3 | idx_date | 1\n3 | idx_status_cust_date | 1\n4 | idx_cust_date | 0\n4 | idx_date | 1\n4 | idx_status_cust_date | 0\n",
            },
            {
              stdin: String.raw`CREATE TABLE index_columns (index_name VARCHAR(40), seq INT, column_name VARCHAR(40));
INSERT INTO index_columns VALUES
  ('idx_abc', 1, 'a'), ('idx_abc', 2, 'b'), ('idx_abc', 3, 'c');
CREATE TABLE query_filters (query_id INT, column_name VARCHAR(40));
INSERT INTO query_filters VALUES
  (10, 'a'), (10, 'c'), (11, 'c'), (11, 'b'), (11, 'a'), (12, 'b'), (12, 'c');
`,
              expected: "query_id | index_name | usable_columns\n10 | idx_abc | 1\n11 | idx_abc | 3\n12 | idx_abc | 0\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE index_columns (index_name VARCHAR(40), seq INT, column_name VARCHAR(40));
INSERT INTO index_columns VALUES
  ('idx_x', 1, 'tenant_id'), ('idx_x', 2, 'user_id'), ('idx_y', 1, 'user_id');
CREATE TABLE query_filters (query_id INT, column_name VARCHAR(40));
INSERT INTO query_filters VALUES
  (5, 'tenant_id'), (5, 'user_id'), (5, 'kind');
`,
              expected: "query_id | index_name | usable_columns\n5 | idx_x | 2\n5 | idx_y | 1\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "With an index on `(a, b, c)`, which `WHERE` clause can **not** seek on the index?",
          options: ["`a = 1`", "`a = 1 AND b = 2`", "`b = 2 AND c = 3`", "`c = 3 AND b = 2 AND a = 1`"],
          answer: 2,
          explanation: "Without `a`, the `b` and `c` values are scattered across the index, so there is no leftmost prefix to seek on. The order of conditions in the text is irrelevant, which is why the last option uses all three columns.",
        },
        {
          prompt: "Index `(customer_id, placed_on, status)`. For `WHERE customer_id = 3 AND placed_on >= '2024-03-01' AND status = 'paid'`, how many columns narrow the seek?",
          options: ["One", "Two — the range on `placed_on` stops `status` being used to seek", "Three", "None, because of the range"],
          answer: 1,
          explanation: "The seek uses `customer_id` (equality) and the range on `placed_on`; within that range `status` is not sorted, so it is only tested on each entry (index condition pushdown). Reordering to `(customer_id, status, placed_on)` lets all three narrow it.",
        },
        {
          prompt: "A table has indexes on `(user_id)` and on `(user_id, created_at)`. What should you do?",
          options: ["Keep both: each serves different queries", "Drop `(user_id)`: the composite's leading column serves every query it could", "Drop the composite: single-column indexes are faster", "Add an index on `(created_at, user_id)` too"],
          answer: 1,
          explanation: "Any query that can use `(user_id)` can use the leftmost prefix of `(user_id, created_at)`, so the single-column index is redundant and only costs writes and memory.",
        },
        {
          prompt: "Index `(customer_id, placed_on)`. Which query avoids a sort step?",
          options: ["`SELECT … ORDER BY placed_on`", "`SELECT … WHERE customer_id = 3 ORDER BY placed_on`", "`SELECT … WHERE placed_on > '2024-01-01' ORDER BY customer_id, amount`", "`SELECT … ORDER BY amount`"],
          answer: 1,
          explanation: "With `customer_id` fixed by equality, the remaining entries are already in `placed_on` order, so they stream out sorted. Across all customers the dates are not in order, and `amount` is not in the index at all.",
        },
      ],
    },
    {
      slug: "reading-a-query-plan",
      file: "03-reading-a-query-plan.md",
      exercises: [
        {
          title: "Find the full table scans",
          prompt: `\`plan_rows\` stores the \`EXPLAIN\` output of several slow queries, one row per table access. List every **full table scan** (\`type = 'ALL'\`), with a hint for the fix: \`'no candidate index'\` when \`possible_keys\` is NULL, otherwise \`'index not chosen'\`.

\`plan_rows\`:

| query_id | step | table_name | type | possible_keys | key_name | rows_examined | extra |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | customers | ref | idx_city | idx_city | 120 | Using index |
| 1 | 2 | orders | ALL | NULL | NULL | 498211 | Using where; Using join buffer (hash join) |
| 2 | 1 | orders | range | idx_placed_on | idx_placed_on | 3100 | Using index condition; Using filesort |
| 3 | 1 | products | ALL | idx_category | NULL | 2400 | Using where |
| 3 | 2 | reviews | ref | idx_product | idx_product | 14 | NULL |
| 4 | 1 | users | const | PRIMARY | PRIMARY | 1 | NULL |
| 5 | 1 | events | index | idx_tenant_time | idx_tenant_time | 75000 | Using index; Using filesort |

**Output columns:** \`query_id\`, \`table_name\`, \`rows_examined\`, \`fix_hint\`, ordered by \`rows_examined\` descending, then \`query_id\`, then \`table_name\`.

\`\`\`text
query_id | table_name | rows_examined | fix_hint
1 | orders | 498211 | no candidate index
3 | products | 2400 | index not chosen
\`\`\``,
          starter: String.raw`-- Rows with type = 'ALL'; fix_hint from possible_keys (NULL or not).
-- Order by rows_examined DESC, query_id, table_name.
`,
          solution: String.raw`SELECT query_id,
       table_name,
       rows_examined,
       CASE WHEN possible_keys IS NULL THEN 'no candidate index'
            ELSE 'index not chosen' END AS fix_hint
FROM plan_rows
WHERE type = 'ALL'
ORDER BY rows_examined DESC, query_id, table_name;
`,
          hints: [
            "`type = 'ALL'` is the full table scan; `index` is a full *index* scan and does not belong in this list.",
            "Test NULL with `possible_keys IS NULL` inside a `CASE`; `= NULL` is never true.",
          ],
          cases: [
            { stdin: PLANS_A, expected: "query_id | table_name | rows_examined | fix_hint\n1 | orders | 498211 | no candidate index\n3 | products | 2400 | index not chosen\n" },
            { stdin: PLANS_B, expected: "query_id | table_name | rows_examined | fix_hint\n7 | cities | 40 | no candidate index\n8 | logs | 40 | no candidate index\n", hidden: true },
            { stdin: PLANS_C, expected: "query_id | table_name | rows_examined | fix_hint\n(no rows)\n", hidden: true },
          ],
        },
        {
          title: "Each query's weakest step",
          prompt: `Rank every step of \`plan_rows\` on MySQL's access-type ladder — \`system\` 1, \`const\` 2, \`eq_ref\` 3, \`ref\` 4, \`ref_or_null\` 5, \`index_merge\` 6, \`range\` 7, \`index\` 8, \`ALL\` 9 — and report, for each query, the type of its **worst** step (highest rank) and whether any of its steps sorts (\`extra\` contains \`Using filesort\`). The same \`plan_rows\` table as the previous exercise; \`extra\` can be NULL.

**Output columns:** \`query_id\`, \`worst_type\`, \`needs_sort\` (\`'yes'\` or \`'no'\`), ordered by \`query_id\`.

\`\`\`text
query_id | worst_type | needs_sort
1 | ALL | no
2 | range | yes
3 | ALL | no
4 | const | no
5 | index | yes
\`\`\``,
          starter: String.raw`-- 1. Give each row a rank with CASE type WHEN 'system' THEN 1 ... END.
-- 2. Per query: the highest rank, and whether any extra LIKE '%Using filesort%'.
-- 3. Turn the highest rank back into its type name.
`,
          solution: String.raw`WITH ranked AS (
  SELECT query_id,
         type,
         CASE type
           WHEN 'system' THEN 1 WHEN 'const' THEN 2 WHEN 'eq_ref' THEN 3
           WHEN 'ref' THEN 4 WHEN 'ref_or_null' THEN 5 WHEN 'index_merge' THEN 6
           WHEN 'range' THEN 7 WHEN 'index' THEN 8 WHEN 'ALL' THEN 9
         END AS rnk,
         CASE WHEN extra LIKE '%Using filesort%' THEN 1 ELSE 0 END AS sorts
  FROM plan_rows
),
per_query AS (
  SELECT query_id, MAX(rnk) AS worst_rank, MAX(sorts) AS any_sort
  FROM ranked
  GROUP BY query_id
)
SELECT p.query_id,
       (SELECT MIN(r.type) FROM ranked r
        WHERE r.query_id = p.query_id AND r.rnk = p.worst_rank) AS worst_type,
       IF(p.any_sort = 1, 'yes', 'no') AS needs_sort
FROM per_query p
ORDER BY p.query_id;
`,
          hints: [
            "A `CASE type WHEN 'system' THEN 1 … END` column turns the ladder into numbers you can `MAX`.",
            "`extra LIKE '%Using filesort%'` is NULL when `extra` is NULL, so a `CASE WHEN … THEN 1 ELSE 0 END` counts it as no sort.",
            "Group by `query_id` for the highest rank, then look the type name back up for that rank in a correlated subquery.",
          ],
          cases: [
            { stdin: PLANS_A, expected: "query_id | worst_type | needs_sort\n1 | ALL | no\n2 | range | yes\n3 | ALL | no\n4 | const | no\n5 | index | yes\n" },
            { stdin: PLANS_B, expected: "query_id | worst_type | needs_sort\n7 | ALL | no\n8 | ALL | yes\n9 | index_merge | no\n", hidden: true },
            { stdin: PLANS_C, expected: "query_id | worst_type | needs_sort\n1 | ref_or_null | no\n2 | ref | no\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which `type` values are listed from **best** to **worst**?",
          options: ["`ALL`, `index`, `range`, `ref`, `const`", "`const`, `eq_ref`, `ref`, `range`, `index`, `ALL`", "`index`, `const`, `ref`, `ALL`, `range`", "`eq_ref`, `const`, `ALL`, `ref`, `index`"],
          answer: 1,
          explanation: "`const` reads at most one row by a unique key; `eq_ref` one row per outer row in a join; `ref` all rows for one value; `range` a slice of an index; `index` the whole index; `ALL` the whole table.",
        },
        {
          prompt: "A plan row shows `possible_keys: NULL`, `key: NULL`, `type: ALL`. What does it tell you?",
          options: ["An index exists but the optimizer found the scan cheaper", "No index matches the predicates on this table at all", "The query is covered", "Statistics are stale"],
          answer: 1,
          explanation: "`possible_keys` NULL means no index is even a candidate — either none exists on the filtered columns or the predicate hides the column, for example `YEAR(placed_on) = 2024`. When an index is listed in `possible_keys` but `key` is NULL, the optimizer considered it and preferred the scan.",
        },
        {
          prompt: "What does `Using index` in `Extra` mean?",
          options: ["An index was used to find rows, then rows were fetched", "The step is answered from the index alone — a covering index", "Index condition pushdown", "The index was used only for sorting"],
          answer: 1,
          explanation: "`Using index` means no row lookups were needed. `Using index condition` (pushdown) is a different note: it filters index entries before fetching rows, which still fetches the survivors.",
        },
        {
          prompt: "How does `EXPLAIN ANALYZE` differ from `EXPLAIN`?",
          options: ["It only formats the output as JSON", "It actually executes the query and reports real times, row counts and loops beside the estimates", "It suggests indexes to create", "It works only on PostgreSQL"],
          answer: 1,
          explanation: "MySQL 8.0.18 added `EXPLAIN ANALYZE`, which runs the statement and prints a tree with `actual time`, `rows` and `loops`. Because it executes, never use it on a slow data-changing statement in production. `FORMAT=TREE` shows the tree without running.",
        },
        {
          prompt: "Which `Extra` note means the server sorted the rows itself because no index provided the order?",
          options: ["`Using where`", "`Using filesort`", "`Using index`", "`Backward index scan`"],
          answer: 1,
          explanation: "`Using filesort` is any sort the server performs for `ORDER BY` or `GROUP BY`, in memory or on disk. `Backward index scan` is the good case: the index delivers a descending order by reading leaves backwards.",
        },
      ],
    },
    {
      slug: "sargable-queries",
      file: "04-sargable-queries.md",
      exercises: [
        {
          title: "Rewrite YEAR() as a range",
          prompt: `The yearly report runs \`SELECT id, created_at, amount FROM orders WHERE YEAR(created_at) = 2024\`, and the index on \`created_at\` is never used. Rewrite it so the bare column is compared with a range and **exactly the same rows** come back — \`created_at\` is a \`DATETIME\`, so watch the last day of the year.

\`orders\`:

| id | created_at | amount |
| --- | --- | --- |
| 1 | 2023-12-31 23:59:59 | 400 |
| 2 | 2024-01-01 00:00:00 | 150 |
| 3 | 2024-07-14 12:05:00 | 820 |
| 4 | 2024-12-31 23:30:00 | 99 |
| 5 | 2025-01-01 00:00:00 | 310 |
| 6 | 2024-12-31 09:00:00 | 45 |

**Output columns:** \`id\`, \`created_at\`, \`amount\`, ordered by \`created_at\`, then \`id\`.

\`\`\`text
id | created_at | amount
2 | 2024-01-01 00:00:00 | 150
3 | 2024-07-14 12:05:00 | 820
6 | 2024-12-31 09:00:00 | 45
4 | 2024-12-31 23:30:00 | 99
\`\`\``,
          starter: String.raw`-- The slow version, for reference (do not use YEAR() on the column):
--   SELECT id, created_at, amount FROM orders WHERE YEAR(created_at) = 2024
-- Write a half-open range on created_at instead, ordered by created_at, then id.
`,
          solution: String.raw`SELECT id, created_at, amount
FROM orders
WHERE created_at >= '2024-01-01'
  AND created_at < '2025-01-01'
ORDER BY created_at, id;
`,
          hints: [
            "Keep `created_at` bare and move the year into constants: from the first moment of 2024 up to, but not including, the first moment of 2025.",
            "`BETWEEN '2024-01-01' AND '2024-12-31'` stops at midnight on 31 December and loses order 4 — use `>=` and `<`.",
          ],
          cases: [
            { stdin: CREATED_A, expected: "id | created_at | amount\n2 | 2024-01-01 00:00:00 | 150\n3 | 2024-07-14 12:05:00 | 820\n6 | 2024-12-31 09:00:00 | 45\n4 | 2024-12-31 23:30:00 | 99\n" },
            { stdin: CREATED_B, expected: "id | created_at | amount\n(no rows)\n", hidden: true },
            { stdin: CREATED_C, expected: "id | created_at | amount\n3 | 2024-02-29 00:00:00 | 6\n7 | 2024-02-29 00:00:00 | 5\n1 | 2024-06-01 06:30:00 | 8\n9 | 2024-12-31 23:59:59 | 7\n", hidden: true },
          ],
        },
        {
          title: "A prefix and a date window, sargable",
          prompt: `The admin audit runs this query, which can use neither the index on \`username\` nor the one on \`signup_date\`:

\`\`\`sql
SELECT id, username, signup_date
FROM users
WHERE LEFT(username, 3) = 'adm'
  AND DATEDIFF('2024-06-30', signup_date) <= 30
ORDER BY signup_date, id;
\`\`\`

Rewrite both predicates so each compares the bare column, returning **the same rows**. No user signed up after 2024-06-30, and usernames are lower case.

\`users\`:

| id | username | signup_date |
| --- | --- | --- |
| 1 | admin | 2024-06-20 |
| 2 | adm_ops | 2024-05-31 |
| 3 | adm_billing | 2024-05-30 |
| 4 | ravi | 2024-06-25 |
| 5 | ad | 2024-06-29 |
| 6 | xadmin | 2024-06-10 |
| 7 | administrator | 2024-06-30 |

**Output columns:** \`id\`, \`username\`, \`signup_date\`, ordered by \`signup_date\`, then \`id\`.

\`\`\`text
id | username | signup_date
2 | adm_ops | 2024-05-31
1 | admin | 2024-06-20
7 | administrator | 2024-06-30
\`\`\``,
          starter: String.raw`-- Rewrite without LEFT() and DATEDIFF() on the columns:
--   a prefix match with LIKE, and signup_date compared with a date constant.
-- Order by signup_date, then id.
`,
          solution: String.raw`SELECT id, username, signup_date
FROM users
WHERE username LIKE 'adm%'
  AND signup_date >= DATE_SUB('2024-06-30', INTERVAL 30 DAY)
ORDER BY signup_date, id;
`,
          hints: [
            "`LEFT(username, 3) = 'adm'` is `username LIKE 'adm%'` — a fixed prefix, which a B-tree serves as a range.",
            "`DATEDIFF('2024-06-30', d) <= 30` means d is at most 30 days before 30 June, so `d >= DATE_SUB('2024-06-30', INTERVAL 30 DAY)` — 2024-05-31 itself is included.",
          ],
          cases: [
            { stdin: SIGNUPS_A, expected: "id | username | signup_date\n2 | adm_ops | 2024-05-31\n1 | admin | 2024-06-20\n7 | administrator | 2024-06-30\n" },
            { stdin: SIGNUPS_B, expected: "id | username | signup_date\n(no rows)\n", hidden: true },
            { stdin: SIGNUPS_C, expected: "id | username | signup_date\n5 | adm | 2024-05-31\n4 | adm4 | 2024-06-01\n9 | adm9 | 2024-06-01\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`orders` has an index on `placed_on`. Which predicate can use it to seek?",
          options: ["`YEAR(placed_on) = 2024`", "`DATE_FORMAT(placed_on, '%Y-%m') = '2024-03'`", "`placed_on >= '2024-03-01' AND placed_on < '2024-04-01'`", "`placed_on + INTERVAL 1 DAY > '2024-03-01'`"],
          answer: 2,
          explanation: "Only the third leaves the column bare. The others compute an expression on every row, and the index is sorted by the stored dates, not by that expression.",
        },
        {
          prompt: "`phone` is `VARCHAR(15)` with an index. Why might `WHERE phone = 9876543210` scan the table?",
          options: ["Numbers are never allowed in WHERE", "MySQL converts each stored string to a number to compare, so the index on the strings cannot be searched", "VARCHAR columns cannot be indexed", "The number is too large"],
          answer: 1,
          explanation: "Comparing a string column with a number converts the column side, row by row. Write `phone = '9876543210'`. An `INT` column compared with the string `'42'` is harmless: the constant is converted once.",
        },
        {
          prompt: "Which `LIKE` pattern can use a B-tree index on `email`?",
          options: ["`'%@gmail.com'`", "`'%ravi%'`", "`'ravi%'`", "`'_avi%'`"],
          answer: 2,
          explanation: "A fixed prefix marks a contiguous range of the sorted index. A leading `%` or `_` puts the unknown part first, so the matches are scattered everywhere.",
        },
        {
          prompt: "You must keep `WHERE LOWER(email) = ?` (the column's collation is case-sensitive). How can MySQL 8 still seek?",
          options: ["It cannot", "Create a functional index on `((LOWER(email)))`", "Add `FORCE INDEX`", "Use `LIKE` instead of `=`"],
          answer: 1,
          explanation: "MySQL 8.0.13+ indexes expressions written in double parentheses; a query using the same expression can then seek. `FORCE INDEX` cannot make a non-sargable predicate searchable — at best it forces a full index scan.",
        },
      ],
    },
    {
      slug: "covering-indexes",
      file: "05-covering-indexes.md",
      exercises: [
        {
          title: "Cover the yearly customer report",
          prompt: `The finance dashboard sums each customer's 2024 orders. Create the covering index \`idx_orders_cover\` on \`orders (customer_id, placed_on, amount)\` — every column the report touches — then write the report with a sargable date range.

\`orders\`:

| id | customer_id | placed_on | status | amount | notes |
| --- | --- | --- | --- | --- | --- |
| 1 | 4 | 2024-01-09 | paid | 300 | gift wrap |
| 2 | 2 | 2024-02-11 | paid | 1200 | NULL |
| 3 | 4 | 2024-03-30 | refunded | 450 | damaged box |
| 4 | 9 | 2023-12-31 | paid | 5000 | NULL |
| 5 | 2 | 2024-05-05 | paid | 300 | NULL |
| 6 | 9 | 2024-06-18 | paid | 750 | call first |
| 7 | 4 | 2025-01-02 | paid | 80 | NULL |

**Output columns:** \`customer_id\`, \`orders\` (the count), \`total\` (the sum of \`amount\`) — 2024 orders only, every status — ordered by \`total\` descending, then \`customer_id\`.

\`\`\`text
customer_id | orders | total
2 | 2 | 1500
4 | 2 | 750
9 | 1 | 750
\`\`\``,
          starter: String.raw`-- 1. CREATE INDEX idx_orders_cover on (customer_id, placed_on, amount).
-- 2. Per customer, 2024 only: customer_id, orders, total,
--    ordered by total DESC, then customer_id.
`,
          solution: String.raw`CREATE INDEX idx_orders_cover ON orders (customer_id, placed_on, amount);

SELECT customer_id,
       COUNT(*) AS orders,
       SUM(amount) AS total
FROM orders
WHERE placed_on >= '2024-01-01'
  AND placed_on < '2025-01-01'
GROUP BY customer_id
ORDER BY total DESC, customer_id;
`,
          hints: [
            "The report reads `customer_id`, `placed_on` and `amount` only — never `status` or `notes` — which is why those three columns cover it.",
            "Filter with `placed_on >= '2024-01-01' AND placed_on < '2025-01-01'`, then `GROUP BY customer_id`.",
            "Customers 4 and 9 tie on 750 (customer 4's refunded order still counts); `customer_id` ascending breaks the tie.",
          ],
          cases: [
            { stdin: COVER_A, expected: "customer_id | orders | total\n2 | 2 | 1500\n4 | 2 | 750\n9 | 1 | 750\n" },
            { stdin: COVER_B, expected: "customer_id | orders | total\n(no rows)\n", hidden: true },
            { stdin: COVER_C, expected: "customer_id | orders | total\n3 | 2 | 500\n5 | 1 | 500\n8 | 1 | 500\n", hidden: true },
          ],
        },
        {
          title: "Which indexes cover each query?",
          prompt: `\`index_columns\` lists the columns of each secondary index on \`users\`, whose primary key is \`id\`. \`query_columns\` lists every column each query touches. An index covers a query when every column the query touches is in the index — and, because InnoDB stores the primary key in every secondary index, \`id\` is always covered. List each query with every index that covers it, or \`'none'\`.

\`index_columns\`:

| index_name | seq | column_name |
| --- | --- | --- |
| idx_email | 1 | email |
| idx_city_signup | 1 | city |
| idx_city_signup | 2 | signup_date |
| idx_city_signup_name | 1 | city |
| idx_city_signup_name | 2 | signup_date |
| idx_city_signup_name | 3 | name |

\`query_columns\`:

| query_id | column_name |
| --- | --- |
| 1 | id |
| 1 | email |
| 2 | city |
| 2 | signup_date |
| 3 | id |
| 3 | name |
| 3 | city |
| 4 | email |
| 4 | name |

**Output columns:** \`query_id\`, \`covered_by\` — one row per covering index, or a single \`'none'\` row — ordered by \`query_id\`, then \`covered_by\`.

\`\`\`text
query_id | covered_by
1 | idx_email
2 | idx_city_signup
2 | idx_city_signup_name
3 | idx_city_signup_name
4 | none
\`\`\``,
          starter: String.raw`-- A (query, index) pair covers when NO column of the query (other than id)
-- is missing from the index: NOT EXISTS ( ... NOT IN ... ).
-- LEFT JOIN the queries to those pairs so a query with none still shows.
`,
          solution: String.raw`WITH queries AS (
  SELECT DISTINCT query_id FROM query_columns
),
covering AS (
  SELECT q.query_id, i.index_name
  FROM queries q
  CROSS JOIN (SELECT DISTINCT index_name FROM index_columns) AS i
  WHERE NOT EXISTS (
    SELECT 1
    FROM query_columns c
    WHERE c.query_id = q.query_id
      AND c.column_name <> 'id'
      AND c.column_name NOT IN (SELECT ic.column_name
                                FROM index_columns ic
                                WHERE ic.index_name = i.index_name)
  )
)
SELECT q.query_id, COALESCE(cv.index_name, 'none') AS covered_by
FROM queries q
LEFT JOIN covering cv ON cv.query_id = q.query_id
ORDER BY q.query_id, covered_by;
`,
          hints: [
            "Pair every query with every index, and keep a pair when `NOT EXISTS` a query column, other than `id`, that is `NOT IN` that index's columns.",
            "A `LEFT JOIN` from the distinct queries to the covering pairs keeps a query that has none, and `COALESCE(index_name, 'none')` labels it.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE index_columns (index_name VARCHAR(40), seq INT, column_name VARCHAR(40));
INSERT INTO index_columns VALUES
  ('idx_email', 1, 'email'),
  ('idx_city_signup', 1, 'city'), ('idx_city_signup', 2, 'signup_date'),
  ('idx_city_signup_name', 1, 'city'), ('idx_city_signup_name', 2, 'signup_date'), ('idx_city_signup_name', 3, 'name');
CREATE TABLE query_columns (query_id INT, column_name VARCHAR(40));
INSERT INTO query_columns VALUES
  (1, 'id'), (1, 'email'), (2, 'city'), (2, 'signup_date'),
  (3, 'id'), (3, 'name'), (3, 'city'), (4, 'email'), (4, 'name');
`,
              expected: "query_id | covered_by\n1 | idx_email\n2 | idx_city_signup\n2 | idx_city_signup_name\n3 | idx_city_signup_name\n4 | none\n",
            },
            {
              stdin: String.raw`CREATE TABLE index_columns (index_name VARCHAR(40), seq INT, column_name VARCHAR(40));
INSERT INTO index_columns VALUES
  ('idx_a', 1, 'email'), ('idx_b', 1, 'city'), ('idx_b', 2, 'email');
CREATE TABLE query_columns (query_id INT, column_name VARCHAR(40));
INSERT INTO query_columns VALUES
  (7, 'id'), (8, 'email'), (9, 'phone'), (9, 'id');
`,
              expected: "query_id | covered_by\n7 | idx_a\n7 | idx_b\n8 | idx_a\n8 | idx_b\n9 | none\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Index `idx_email` on `users (email)`, primary key `id`. Which query is covered?",
          options: ["`SELECT * FROM users WHERE email = ?`", "`SELECT id, email FROM users WHERE email = ?`", "`SELECT name FROM users WHERE email = ?`", "`SELECT email, city FROM users WHERE email = ?`"],
          answer: 1,
          explanation: "InnoDB secondary entries store the primary key, so `id` and `email` are both in `idx_email`. `name`, `city` and `*` need the row from the clustered index.",
        },
        {
          prompt: "What makes a covering index faster than an ordinary secondary index lookup?",
          options: ["It is stored in memory only", "It skips the per-row search in the clustered index and reads compact, adjacent entries", "It is a hash index", "It locks fewer rows"],
          answer: 1,
          explanation: "A non-covering lookup searches the clustered index once per match, landing on scattered pages. A covering read stays in the index, whose entries are smaller than rows and sit together.",
        },
        {
          prompt: "Why does `SELECT COUNT(*) FROM orders` in InnoDB often read a secondary index rather than the table?",
          options: ["Secondary indexes store a precomputed count", "Every index has one entry per row, and the narrowest one has the fewest pages to read", "The clustered index cannot be scanned", "It is a bug"],
          answer: 1,
          explanation: "Counting needs one entry per row, not the rows' contents, so the optimizer scans the smallest index. InnoDB keeps no exact stored row count, because each transaction may see a different number of rows under MVCC.",
        },
        {
          prompt: "How do you get the effect of PostgreSQL's `INCLUDE (amount)` in MySQL?",
          options: ["`CREATE INDEX … INCLUDE (amount)` works in MySQL 8 too", "Append `amount` to the end of the index key", "Create a second index on `amount`", "It is impossible in MySQL"],
          answer: 1,
          explanation: "MySQL has no `INCLUDE` clause. Adding the column as the last key column carries it in the leaves, at the cost of making it part of the sort order and the key size limit.",
        },
      ],
    },
    {
      slug: "indexes-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Clear the way for a UNIQUE index",
          prompt: `Sign-up allowed duplicate e-mail addresses until today, and \`CREATE UNIQUE INDEX\` fails while they exist. Write a script that:

1. lists the duplicated addresses — \`email\`, \`copies\` — ordered by \`email\`;
2. deletes every duplicate row except the one with the **lowest** \`id\` per address;
3. creates the unique index \`uq_users_email\` on \`users (email)\`;
4. returns the remaining users — \`id\`, \`email\` — ordered by \`id\` (this SELECT is in the starter).

MySQL refuses a \`DELETE\` whose subquery reads the table being deleted from (error 1093) unless the subquery is wrapped in a derived table — write it that way.

\`users\`:

| id | email | name |
| --- | --- | --- |
| 1 | asha@example.com | Asha |
| 2 | ravi@example.com | Ravi |
| 3 | asha@example.com | Asha R |
| 4 | lee@example.com | Lee |
| 5 | ravi@example.com | Ravi K |
| 6 | asha@example.com | A. Rao |

\`\`\`text
email | copies
asha@example.com | 3
ravi@example.com | 2

id | email
1 | asha@example.com
2 | ravi@example.com
4 | lee@example.com
\`\`\``,
          starter: String.raw`-- 1. The duplicated addresses: email, copies, ordered by email.
-- 2. DELETE all but the lowest id per email.
-- 3. CREATE UNIQUE INDEX uq_users_email ON users (email);

SELECT id, email FROM users ORDER BY id;
`,
          solution: String.raw`SELECT email, COUNT(*) AS copies
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

DELETE FROM users
WHERE id NOT IN (
  SELECT keep_id
  FROM (SELECT MIN(id) AS keep_id FROM users GROUP BY email) AS keepers
);

CREATE UNIQUE INDEX uq_users_email ON users (email);

SELECT id, email FROM users ORDER BY id;
`,
          hints: [
            "Duplicates are groups: `GROUP BY email HAVING COUNT(*) > 1`.",
            "Keep `MIN(id)` per email: `DELETE FROM users WHERE id NOT IN (SELECT keep_id FROM (SELECT MIN(id) AS keep_id FROM users GROUP BY email) AS keepers)`.",
            "The unique index succeeds only after the delete, so the statements must run in that order.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(120) NOT NULL, name VARCHAR(60));
INSERT INTO users VALUES
  (1, 'asha@example.com', 'Asha'),
  (2, 'ravi@example.com', 'Ravi'),
  (3, 'asha@example.com', 'Asha R'),
  (4, 'lee@example.com', 'Lee'),
  (5, 'ravi@example.com', 'Ravi K'),
  (6, 'asha@example.com', 'A. Rao');
`,
              expected: "email | copies\nasha@example.com | 3\nravi@example.com | 2\n\nid | email\n1 | asha@example.com\n2 | ravi@example.com\n4 | lee@example.com\n",
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(120) NOT NULL, name VARCHAR(60));
INSERT INTO users VALUES
  (3, 'x@example.com', 'X'),
  (8, 'y@example.com', 'Y');
`,
              expected: "email | copies\n(no rows)\n\nid | email\n3 | x@example.com\n8 | y@example.com\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(120) NOT NULL, name VARCHAR(60));
INSERT INTO users VALUES
  (40, 'z@example.com', 'Z1'),
  (12, 'z@example.com', 'Z2'),
  (25, 'z@example.com', 'Z3'),
  (30, 'm@example.com', 'M');
`,
              expected: "email | copies\nz@example.com | 3\n\nid | email\n12 | z@example.com\n30 | m@example.com\n",
              hidden: true,
            },
          ],
        },
        {
          title: "An indexed monthly payments report",
          prompt: `Create an index named \`idx_payments_paid_at\` on \`payments (paid_at)\`, then report **April 2024** by payment method with a sargable range on \`paid_at\` (a \`DATETIME\`).

\`payments\`:

| id | paid_at | method | amount |
| --- | --- | --- | --- |
| 1 | 2024-03-31 23:59:59 | upi | 500 |
| 2 | 2024-04-01 00:00:00 | upi | 250 |
| 3 | 2024-04-12 14:20:00 | card | 1800 |
| 4 | 2024-04-30 22:15:00 | upi | 900 |
| 5 | 2024-05-01 00:00:00 | card | 700 |
| 6 | 2024-04-18 09:00:00 | netbanking | 1150 |
| 7 | 2024-04-18 09:05:00 | card | 200 |

**Output columns:** \`method\`, \`payments\` (count), \`total\` (sum of \`amount\`), ordered by \`total\` descending, then \`method\`.

\`\`\`text
method | payments | total
card | 2 | 2000
netbanking | 1 | 1150
upi | 2 | 1150
\`\`\``,
          starter: String.raw`-- 1. CREATE INDEX idx_payments_paid_at on payments (paid_at).
-- 2. April 2024 by method: method, payments, total,
--    ordered by total DESC, then method.
`,
          solution: String.raw`CREATE INDEX idx_payments_paid_at ON payments (paid_at);

SELECT method,
       COUNT(*) AS payments,
       SUM(amount) AS total
FROM payments
WHERE paid_at >= '2024-04-01'
  AND paid_at < '2024-05-01'
GROUP BY method
ORDER BY total DESC, method;
`,
          hints: [
            "April is `paid_at >= '2024-04-01' AND paid_at < '2024-05-01'` — never `MONTH(paid_at) = 4`, and never a `BETWEEN` that ends at midnight on the 30th.",
            "Ties on `total` are broken by `method` ascending.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE payments (id INT PRIMARY KEY, paid_at DATETIME NOT NULL, method VARCHAR(12) NOT NULL, amount INT NOT NULL);
INSERT INTO payments VALUES
  (1, '2024-03-31 23:59:59', 'upi', 500),
  (2, '2024-04-01 00:00:00', 'upi', 250),
  (3, '2024-04-12 14:20:00', 'card', 1800),
  (4, '2024-04-30 22:15:00', 'upi', 900),
  (5, '2024-05-01 00:00:00', 'card', 700),
  (6, '2024-04-18 09:00:00', 'netbanking', 1150),
  (7, '2024-04-18 09:05:00', 'card', 200);
`,
              expected: "method | payments | total\ncard | 2 | 2000\nnetbanking | 1 | 1150\nupi | 2 | 1150\n",
            },
            {
              stdin: String.raw`CREATE TABLE payments (id INT PRIMARY KEY, paid_at DATETIME NOT NULL, method VARCHAR(12) NOT NULL, amount INT NOT NULL);
INSERT INTO payments VALUES
  (1, '2023-04-15 10:00:00', 'upi', 500),
  (2, '2024-05-01 00:00:00', 'card', 70);
`,
              expected: "method | payments | total\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE payments (id INT PRIMARY KEY, paid_at DATETIME NOT NULL, method VARCHAR(12) NOT NULL, amount INT NOT NULL);
INSERT INTO payments VALUES
  (1, '2024-04-30 23:59:59', 'wallet', 30),
  (2, '2024-04-30 23:59:59', 'wallet', 30),
  (3, '2024-04-01 00:00:00', 'card', 60);
`,
              expected: "method | payments | total\ncard | 1 | 60\nwallet | 2 | 60\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Indexes nobody reads",
          prompt: `Before a release, the DBA wants the indexes that cost writes and serve no reads. \`table_indexes\` lists every index; \`index_usage\` holds the read counters gathered since the last restart (an index absent from it was never read). Return every index that was never read (no usage row, or \`read_count\` 0) **and** is neither the \`PRIMARY\` key nor unique — those enforce constraints and stay.

\`table_indexes\`:

| table_name | index_name | is_unique |
| --- | --- | --- |
| orders | PRIMARY | 1 |
| orders | idx_orders_customer | 0 |
| orders | idx_orders_status | 0 |
| orders | idx_orders_customer_old | 0 |
| users | PRIMARY | 1 |
| users | uq_users_email | 1 |
| users | idx_users_city | 0 |

\`index_usage\`:

| table_name | index_name | read_count |
| --- | --- | --- |
| orders | PRIMARY | 98000 |
| orders | idx_orders_customer | 4300 |
| orders | idx_orders_status | 0 |
| users | idx_users_city | 12 |

**Output columns:** \`table_name\`, \`index_name\`, ordered by \`table_name\`, then \`index_name\`.

\`\`\`text
table_name | index_name
orders | idx_orders_customer_old
orders | idx_orders_status
\`\`\``,
          starter: String.raw`-- LEFT JOIN table_indexes to index_usage on table_name AND index_name;
-- keep reads of 0 or no usage row, not PRIMARY, not unique.
`,
          solution: String.raw`SELECT i.table_name, i.index_name
FROM table_indexes i
LEFT JOIN index_usage u
  ON u.table_name = i.table_name
 AND u.index_name = i.index_name
WHERE i.index_name <> 'PRIMARY'
  AND i.is_unique = 0
  AND COALESCE(u.read_count, 0) = 0
ORDER BY i.table_name, i.index_name;
`,
          hints: [
            "Index names repeat across tables (`PRIMARY`), so join on both `table_name` and `index_name`.",
            "An index with no usage row has a NULL `read_count` after the `LEFT JOIN`; `COALESCE(u.read_count, 0) = 0` treats it as never read.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE table_indexes (table_name VARCHAR(30), index_name VARCHAR(40), is_unique INT);
INSERT INTO table_indexes VALUES
  ('orders', 'PRIMARY', 1), ('orders', 'idx_orders_customer', 0), ('orders', 'idx_orders_status', 0),
  ('orders', 'idx_orders_customer_old', 0), ('users', 'PRIMARY', 1), ('users', 'uq_users_email', 1),
  ('users', 'idx_users_city', 0);
CREATE TABLE index_usage (table_name VARCHAR(30), index_name VARCHAR(40), read_count INT);
INSERT INTO index_usage VALUES
  ('orders', 'PRIMARY', 98000), ('orders', 'idx_orders_customer', 4300),
  ('orders', 'idx_orders_status', 0), ('users', 'idx_users_city', 12);
`,
              expected: "table_name | index_name\norders | idx_orders_customer_old\norders | idx_orders_status\n",
            },
            {
              stdin: String.raw`CREATE TABLE table_indexes (table_name VARCHAR(30), index_name VARCHAR(40), is_unique INT);
INSERT INTO table_indexes VALUES
  ('tags', 'PRIMARY', 1), ('tags', 'idx_name', 0), ('posts', 'idx_name', 0), ('posts', 'uq_slug', 1);
CREATE TABLE index_usage (table_name VARCHAR(30), index_name VARCHAR(40), read_count INT);
INSERT INTO index_usage VALUES
  ('tags', 'idx_name', 7);
`,
              expected: "table_name | index_name\nposts | idx_name\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE table_indexes (table_name VARCHAR(30), index_name VARCHAR(40), is_unique INT);
INSERT INTO table_indexes VALUES
  ('logs', 'PRIMARY', 1), ('logs', 'idx_time', 0);
CREATE TABLE index_usage (table_name VARCHAR(30), index_name VARCHAR(40), read_count INT);
INSERT INTO index_usage VALUES
  ('logs', 'PRIMARY', 0), ('logs', 'idx_time', 3);
`,
              expected: "table_name | index_name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many clustered indexes can an InnoDB table have?",
          options: ["None — InnoDB tables are heaps", "Exactly one, on the primary key (or its substitute)", "One per unique column", "Up to 64"],
          answer: 1,
          explanation: "The rows themselves are stored in the clustered index, so they can be ordered only one way. Without a primary key InnoDB clusters on the first unique NOT NULL index, or a hidden row id.",
        },
        {
          prompt: "A table is keyed by a random UUID string. What is the main cost compared with an `INT AUTO_INCREMENT` key?",
          options: ["UUIDs cannot be indexed", "Inserts land all over the clustered index, splitting pages, and every secondary index repeats the long key", "Queries return rows in random order", "Nothing — UUIDs are faster"],
          answer: 1,
          explanation: "An increasing key appends at the right edge of the B+tree; a random key inserts into the middle and splits pages. And because each secondary entry carries the primary key, a 36-character key inflates every index.",
        },
        {
          prompt: "Index `(country, city)`. Which query can seek on it?",
          options: ["`WHERE city = 'Pune'`", "`WHERE country = 'IN'`", "`WHERE city LIKE 'P%'`", "`WHERE UPPER(country) = 'IN'`"],
          answer: 1,
          explanation: "Only a filter on the leading column `country` follows the leftmost prefix. `city` alone is not a prefix, and wrapping `country` in a function hides it.",
        },
        {
          prompt: "Which composite index serves `WHERE user_id = ? AND status = ? AND created_at >= ?` best?",
          options: ["`(created_at, user_id, status)`", "`(user_id, created_at, status)`", "`(user_id, status, created_at)`", "`(status, created_at)`"],
          answer: 2,
          explanation: "Equality columns first, the range last: `(user_id, status, created_at)` seeks on all three. In the second option the range on `created_at` stops `status` from narrowing the seek.",
        },
        {
          prompt: "In `EXPLAIN`, `type: index` means…",
          options: ["An index lookup for one value", "A full scan of an index, start to end", "The query uses an index hint", "A unique index was used"],
          answer: 1,
          explanation: "`index` reads the whole index — cheaper than `ALL` when the index is narrower than the table, and often paired with `Using index` when it also covers the query, but still a full scan.",
        },
        {
          prompt: "In a two-table nested-loop plan, step 1 shows `rows: 200` and step 2 shows `rows: 50`. Roughly how many rows does the join examine in step 2?",
          options: ["50", "250", "About 10,000 — 50 per row of step 1", "200"],
          answer: 2,
          explanation: "`rows` is per lookup. Step 2 runs once for each of step 1's 200 rows, so about 200 × 50 rows are examined (before `filtered` is applied).",
        },
        {
          prompt: "Which `Extra` note is a reason to look for a better index?",
          options: ["`Using index`", "`Using index condition`", "`Using temporary; Using filesort`", "`Backward index scan`"],
          answer: 2,
          explanation: "A temporary table plus a sort means grouping or ordering is done the expensive way. The other three are signs an index is being used well.",
        },
        {
          prompt: "Which predicate is **not** sargable for an index on `created_at` (a `DATETIME`)?",
          options: ["`created_at >= '2024-06-01'`", "`created_at < '2024-07-01'`", "`DATE(created_at) = '2024-06-30'`", "`created_at >= '2024-06-30' AND created_at < '2024-07-01'`"],
          answer: 2,
          explanation: "`DATE()` is computed on every row. The last option returns the same rows as a range on the bare column.",
        },
        {
          prompt: "Why may MySQL ignore an index on `status` for `WHERE status = 'delivered'`?",
          options: ["Indexes are ignored on VARCHAR columns", "90% of rows are delivered, so a full scan is cheaper than a lookup per row", "The index must be rebuilt first", "Equality is not sargable"],
          answer: 1,
          explanation: "The optimizer chooses by cost. When a value matches most of the table, the per-row lookups into the clustered index cost more than reading the table in order.",
        },
        {
          prompt: "Index `(customer_id, placed_on)` on `orders` with primary key `id`. Is `SELECT id, placed_on FROM orders WHERE customer_id = 7` covered?",
          options: ["No — `id` is not in the index", "Yes — `id` is carried in every secondary entry", "Only if `id` is added to the index", "Only with `FORCE INDEX`"],
          answer: 1,
          explanation: "InnoDB secondary indexes store the primary key, so `customer_id`, `placed_on` and `id` are all in the index and the plan shows `Using index`.",
        },
        {
          prompt: "What does `CREATE UNIQUE INDEX uq ON users (email)` do when two rows share an email?",
          options: ["Keeps the first row and deletes the rest", "Fails with a duplicate-entry error; the duplicates must be removed first", "Creates the index and ignores duplicates", "Creates a non-unique index instead"],
          answer: 1,
          explanation: "A unique index is a constraint, and building it checks the existing rows. Find duplicates with `GROUP BY email HAVING COUNT(*) > 1` and resolve them first.",
        },
        {
          prompt: "Which tool makes an index invisible to the optimizer while still maintaining it, so you can test dropping it?",
          options: ["`DROP INDEX … TEMPORARY`", "`ALTER TABLE t ALTER INDEX idx INVISIBLE`", "`IGNORE INDEX` in every query", "`ANALYZE TABLE`"],
          answer: 1,
          explanation: "MySQL 8 invisible indexes keep the index up to date but hidden from plans; if nothing slows down, drop it, otherwise make it `VISIBLE` again instantly. `IGNORE INDEX` affects only the queries that carry the hint.",
        },
      ],
    },
  ],
});
