import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "aggregation",
  title: "Aggregation",
  blurb: "COUNT, SUM, AVG, MIN and MAX and how they treat NULL; GROUP BY on columns and expressions; HAVING versus WHERE; conditional aggregation for counts, pivots and rates; GROUP_CONCAT; and the grouping mistakes — ONLY_FULL_GROUP_BY, the three COUNTs and averages of averages.",
  icon: "layers",
  overview: `Most questions asked of a database are not about single rows but about many at once: how many orders came in, the revenue per category, the months that beat a target, the approval rate per country, the products sold each day. Aggregation is how SQL answers them. Aggregate functions collapse rows into a value, \`GROUP BY\` does it once per group, and \`HAVING\` keeps the groups that matter. It is the heart of reporting and analytics SQL, and the topic behind a large share of interview questions — duplicates, monthly reports, pivots, "count by status".

Aggregate functions covers \`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\` and \`MAX\`, the three forms of \`COUNT\`, NULLs being skipped, and what an empty input returns. GROUP BY covers grouping by columns, by several columns and by expressions such as the month, the rule for the SELECT list, NULL groups and the logical order of a grouped query. HAVING covers filtering groups, how it differs from \`WHERE\`, and the duplicate finder. Conditional aggregation covers \`SUM(CASE …)\`, pivoting rows into columns and rates with \`AVG\`. GROUP_CONCAT covers \`DISTINCT\`, \`ORDER BY\` and \`SEPARATOR\` inside the call, the length limit and \`STRING_AGG\` elsewhere. Grouping pitfalls covers error 1055 and \`ONLY_FULL_GROUP_BY\`, \`ANY_VALUE\`, the counts, \`WHERE\` versus \`HAVING\`, averages of averages and NULL totals.

The exercises are single-table reports: an order summary, ratings with gaps, revenue per category, sign-ups per month and plan, loyal customers, duplicate emails, orders by status per month, approval rates, products sold by date, team rosters, the three counts per department and a weighted unit price. The checkpoint adds a monthly sales summary with a floor, the classic monthly transactions report and a daily product list.`,
  lessons: [
    {
      slug: "aggregate-functions",
      file: "01-aggregate-functions.md",
      exercises: [
        {
          title: "An order summary",
          prompt: `Summarise the whole \`orders\` table in one row.

| id | customer_id | amount | coupon |
| --- | --- | --- | --- |
| 1 | 10 | 120.00 | SAVE10 |
| 2 | 11 | 80.00 | NULL |
| 3 | 10 | 45.00 | NULL |
| 4 | 12 | 300.00 | WELCOME |
| 5 | 11 | 55.00 | SAVE10 |

Return \`orders\` (the number of orders), \`customers\` (how many different customers ordered), \`with_coupon\` (orders that used a coupon), \`revenue\` (the total amount), \`avg_order\` (the average amount, rounded to 2 decimals) and \`largest\` (the biggest amount). The query always returns exactly one row — also for an empty table.

\`\`\`text
orders | customers | with_coupon | revenue | avg_order | largest
5 | 3 | 3 | 600 | 120 | 300
\`\`\``,
          starter: String.raw`-- One row: orders, customers, with_coupon, revenue, avg_order (ROUND 2), largest.
SELECT *
FROM orders;
`,
          solution: String.raw`SELECT COUNT(*)                     AS orders,
       COUNT(DISTINCT customer_id)  AS customers,
       COUNT(coupon)                AS with_coupon,
       SUM(amount)                  AS revenue,
       ROUND(AVG(amount), 2)        AS avg_order,
       MAX(amount)                  AS largest
FROM orders;
`,
          hints: [
            "`COUNT(*)` counts rows, `COUNT(coupon)` only rows with a coupon, `COUNT(DISTINCT customer_id)` the different customers.",
            "A SELECT list of only aggregates, with no `GROUP BY`, returns one row — on an empty table `COUNT` is 0 and the others are NULL.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount DECIMAL(10,2), coupon VARCHAR(20));
INSERT INTO orders VALUES (1, 10, 120.00, 'SAVE10'), (2, 11, 80.00, NULL), (3, 10, 45.00, NULL), (4, 12, 300.00, 'WELCOME'), (5, 11, 55.00, 'SAVE10');`,
              expected: "orders | customers | with_coupon | revenue | avg_order | largest\n5 | 3 | 3 | 600 | 120 | 300\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount DECIMAL(10,2), coupon VARCHAR(20));
INSERT INTO orders VALUES (1, 5, 10.50, NULL), (2, 5, 20.00, NULL), (3, 5, 7.25, NULL);`,
              expected: "orders | customers | with_coupon | revenue | avg_order | largest\n3 | 1 | 0 | 37.75 | 12.58 | 20\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount DECIMAL(10,2), coupon VARCHAR(20));`,
              expected: "orders | customers | with_coupon | revenue | avg_order | largest\n0 | 0 | 0 | NULL | NULL | NULL\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Ratings with gaps",
          prompt: `Some reviews have no rating. Summarise the reviews of the product \`lamp\` only.

| id | product | rating |
| --- | --- | --- |
| 1 | lamp | 4 |
| 2 | lamp | NULL |
| 3 | desk | 2 |
| 4 | lamp | 5 |
| 5 | lamp | NULL |
| 6 | lamp | 3 |
| 7 | desk | 5 |

Return one row: \`reviews\` (all lamp reviews), \`rated\` (those with a rating), \`avg_rated\` (the average of the given ratings), \`avg_all\` (the average counting a missing rating as 0) — both averages rounded to 2 decimals — and \`lowest\` (the lowest rating given).

\`\`\`text
reviews | rated | avg_rated | avg_all | lowest
5 | 3 | 4 | 2.4 | 3
\`\`\``,
          starter: String.raw`-- Lamp reviews only: reviews, rated, avg_rated, avg_all (missing = 0), lowest.
SELECT COUNT(*) AS reviews
FROM reviews;
`,
          solution: String.raw`SELECT COUNT(*)                          AS reviews,
       COUNT(rating)                     AS rated,
       ROUND(AVG(rating), 2)             AS avg_rated,
       ROUND(AVG(COALESCE(rating, 0)), 2) AS avg_all,
       MIN(rating)                       AS lowest
FROM reviews
WHERE product = 'lamp';
`,
          hints: [
            "`WHERE product = 'lamp'` decides which rows the aggregates see.",
            "`AVG(rating)` skips NULLs; `AVG(COALESCE(rating, 0))` turns them into zeros first, so they count.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE reviews (id INT PRIMARY KEY, product VARCHAR(20), rating INT);
INSERT INTO reviews VALUES (1, 'lamp', 4), (2, 'lamp', NULL), (3, 'desk', 2), (4, 'lamp', 5), (5, 'lamp', NULL), (6, 'lamp', 3), (7, 'desk', 5);`,
              expected: "reviews | rated | avg_rated | avg_all | lowest\n5 | 3 | 4 | 2.4 | 3\n",
            },
            {
              stdin: String.raw`CREATE TABLE reviews (id INT PRIMARY KEY, product VARCHAR(20), rating INT);
INSERT INTO reviews VALUES (1, 'lamp', NULL), (2, 'lamp', NULL), (3, 'desk', 4);`,
              expected: "reviews | rated | avg_rated | avg_all | lowest\n2 | 0 | NULL | 0 | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE reviews (id INT PRIMARY KEY, product VARCHAR(20), rating INT);
INSERT INTO reviews VALUES (1, 'desk', 1), (2, 'chair', 5);`,
              expected: "reviews | rated | avg_rated | avg_all | lowest\n0 | 0 | NULL | NULL | NULL\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A column `bonus` holds 100, NULL, 200, NULL. What are `COUNT(*)`, `COUNT(bonus)` and `AVG(bonus)`?",
          options: ["4, 4 and 75", "4, 2 and 150", "2, 2 and 150", "4, 2 and 75"],
          answer: 1,
          explanation: "`COUNT(*)` counts all four rows; `COUNT(bonus)` and `AVG(bonus)` skip the NULLs, so the average is 300 / 2 = 150. Getting 75 needs `AVG(COALESCE(bonus, 0))`.",
        },
        {
          prompt: "`SELECT SUM(amount), COUNT(*) FROM orders WHERE amount > 1000000;` matches no rows. What does it return?",
          options: ["No rows", "One row: `0 | 0`", "One row: `NULL | 0`", "One row: `NULL | NULL`"],
          answer: 2,
          explanation: "An aggregate query without `GROUP BY` always returns one row. `COUNT` of nothing is 0, but `SUM` of nothing is NULL — wrap it in `COALESCE(SUM(amount), 0)` for a 0.",
        },
        {
          prompt: "What does `COUNT(DISTINCT customer_id)` count on an orders table?",
          options: ["Orders", "Orders with a customer", "Different customers who ordered", "Customers with exactly one order"],
          answer: 2,
          explanation: "`DISTINCT` inside `COUNT` counts each different non-NULL value once — the number of different customers. `COUNT(customer_id)` would be orders that have a customer.",
        },
        {
          prompt: "Why does `SELECT customer_id FROM orders WHERE SUM(amount) > 500 GROUP BY customer_id;` fail?",
          options: [
            "`SUM` only works on integer columns",
            "`WHERE` runs before aggregation, so it cannot use an aggregate; the condition belongs in `HAVING`",
            "`GROUP BY` must come before `WHERE`",
            "`customer_id` must be aggregated too",
          ],
          answer: 1,
          explanation: "`WHERE` filters individual rows before any group exists. Conditions on aggregates go in `HAVING`, after `GROUP BY`. The clause order shown is the correct one.",
        },
      ],
    },
    {
      slug: "group-by",
      file: "02-group-by.md",
      exercises: [
        {
          title: "Revenue per category",
          prompt: `Report on \`orders\` per category. Orders with no category belong to a group labelled \`uncategorised\`.

| id | category | amount |
| --- | --- | --- |
| 1 | books | 20 |
| 2 | games | 60 |
| 3 | books | 35 |
| 4 | toys | 15 |
| 5 | games | 40 |
| 6 | toys | 85 |

Return \`category\`, \`orders\`, \`revenue\` and \`avg_amount\` (rounded to 2 decimals). Order by \`revenue\` descending, then \`category\`.

\`\`\`text
category | orders | revenue | avg_amount
games | 2 | 100 | 50
toys | 2 | 100 | 50
books | 2 | 55 | 27.5
\`\`\``,
          starter: String.raw`-- category (NULL → 'uncategorised'), orders, revenue, avg_amount (ROUND 2),
-- ordered by revenue descending, then category.
SELECT category, amount
FROM orders;
`,
          solution: String.raw`SELECT COALESCE(category, 'uncategorised') AS category,
       COUNT(*)                            AS orders,
       SUM(amount)                         AS revenue,
       ROUND(AVG(amount), 2)               AS avg_amount
FROM orders
GROUP BY COALESCE(category, 'uncategorised')
ORDER BY revenue DESC, category;
`,
          hints: [
            "`GROUP BY category` gives one row per category, and the aggregates run once per group.",
            "Group by the same `COALESCE(category, 'uncategorised')` expression you select, so the NULL group carries its label.",
            "Two categories tie on revenue — the second ORDER BY key decides.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, category VARCHAR(20), amount INT);
INSERT INTO orders VALUES (1, 'books', 20), (2, 'games', 60), (3, 'books', 35), (4, 'toys', 15), (5, 'games', 40), (6, 'toys', 85);`,
              expected: "category | orders | revenue | avg_amount\ngames | 2 | 100 | 50\ntoys | 2 | 100 | 50\nbooks | 2 | 55 | 27.5\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, category VARCHAR(20), amount INT);
INSERT INTO orders VALUES (1, NULL, 30), (2, 'books', 10), (3, NULL, 5), (4, 'books', 25), (5, 'pets', 7);`,
              expected: "category | orders | revenue | avg_amount\nbooks | 2 | 35 | 17.5\nuncategorised | 2 | 35 | 17.5\npets | 1 | 7 | 7\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Sign-ups per month and plan",
          prompt: `Count sign-ups per calendar month and plan.

| id | signed_up_on | plan |
| --- | --- | --- |
| 1 | 2024-01-05 | free |
| 2 | 2024-01-20 | pro |
| 3 | 2024-01-31 | free |
| 4 | 2024-02-01 | free |
| 5 | 2024-02-14 | pro |
| 6 | 2024-02-29 | pro |
| 7 | 2023-02-10 | free |

Return \`month\` (\`2024-01\`), \`plan\` and \`signups\`. February 2023 and February 2024 are different months. Order by \`month\`, then \`plan\`.

\`\`\`text
month | plan | signups
2023-02 | free | 1
2024-01 | free | 2
2024-01 | pro | 1
2024-02 | free | 1
2024-02 | pro | 2
\`\`\``,
          starter: String.raw`-- month (DATE_FORMAT '%Y-%m'), plan, signups — ordered by month, then plan.
SELECT signed_up_on, plan
FROM signups;
`,
          solution: String.raw`SELECT DATE_FORMAT(signed_up_on, '%Y-%m') AS month,
       plan,
       COUNT(*)                           AS signups
FROM signups
GROUP BY DATE_FORMAT(signed_up_on, '%Y-%m'), plan
ORDER BY month, plan;
`,
          hints: [
            "Group by two things: the month key and the plan — each combination is a group.",
            "`DATE_FORMAT(d, '%Y-%m')` keeps the year, so the same month of two years stays apart; `MONTH(d)` would merge them.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE signups (id INT PRIMARY KEY, signed_up_on DATE, plan VARCHAR(10));
INSERT INTO signups VALUES (1, '2024-01-05', 'free'), (2, '2024-01-20', 'pro'), (3, '2024-01-31', 'free'), (4, '2024-02-01', 'free'),
  (5, '2024-02-14', 'pro'), (6, '2024-02-29', 'pro'), (7, '2023-02-10', 'free');`,
              expected: "month | plan | signups\n2023-02 | free | 1\n2024-01 | free | 2\n2024-01 | pro | 1\n2024-02 | free | 1\n2024-02 | pro | 2\n",
            },
            {
              stdin: String.raw`CREATE TABLE signups (id INT PRIMARY KEY, signed_up_on DATE, plan VARCHAR(10));
INSERT INTO signups VALUES (1, '2023-12-31', 'pro'), (2, '2024-12-01', 'pro'), (3, '2024-12-15', 'team'), (4, '2023-12-01', 'pro');`,
              expected: "month | plan | signups\n2023-12 | pro | 2\n2024-12 | pro | 1\n2024-12 | team | 1\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`orders` has 8 rows in 3 categories. How many rows does `SELECT category, COUNT(*) FROM orders GROUP BY category` return?",
          options: ["8", "3", "1", "It depends on the counts"],
          answer: 1,
          explanation: "A grouped query returns one row per group — one per distinct category, so 3. Without `GROUP BY` the aggregate would return 1 row.",
        },
        {
          prompt: "Which SELECT list is valid with `GROUP BY department` under standard SQL rules?",
          options: [
            "`department, name, COUNT(*)`",
            "`department, COUNT(*), MAX(salary)`",
            "`name, MAX(salary)`",
            "`*`",
          ],
          answer: 1,
          explanation: "Only grouping columns, aggregates and expressions of them have one value per group. `name` has many values inside a department, so any list containing it bare is ambiguous; `*` includes every column.",
        },
        {
          prompt: "A table's `region` column is NULL on four rows. How do they appear after `GROUP BY region`?",
          options: ["They are left out", "As four separate groups", "As one group with region NULL", "As part of the first group"],
          answer: 2,
          explanation: "`GROUP BY` treats all NULLs as one group, even though `NULL = NULL` is not true in a `WHERE`. Label it with `COALESCE(region, 'unknown')` in both SELECT and GROUP BY.",
        },
        {
          prompt: "Does MySQL 8 return grouped rows sorted by the grouping columns?",
          options: [
            "Yes, always",
            "No — the order is not guaranteed; write ORDER BY",
            "Only for numeric columns",
            "Only when the column has an index",
          ],
          answer: 1,
          explanation: "MySQL 5.7 and earlier sorted implicitly; MySQL 8 removed that, and the SQL standard never promised it. A result whose order matters needs an explicit `ORDER BY`, ideally with a tie-breaker.",
        },
      ],
    },
    {
      slug: "having",
      file: "03-having.md",
      exercises: [
        {
          title: "Loyal customers",
          prompt: `Find customers with **at least 3 paid orders** whose paid orders total **more than 200**. Orders with any other status do not count at all.

| id | customer_id | amount | status |
| --- | --- | --- | --- |
| 1 | 1 | 50 | paid |
| 2 | 1 | 80 | paid |
| 3 | 1 | 90 | paid |
| 4 | 2 | 300 | paid |
| 5 | 2 | 10 | refunded |
| 6 | 2 | 20 | paid |
| 7 | 3 | 100 | paid |
| 8 | 3 | 60 | paid |
| 9 | 3 | 70 | paid |
| 10 | 3 | 5 | paid |
| 11 | 4 | 10 | paid |
| 12 | 4 | 20 | paid |
| 13 | 4 | 30 | paid |

Return \`customer_id\`, \`orders\` and \`spent\`. Order by \`spent\` descending, then \`customer_id\`.

\`\`\`text
customer_id | orders | spent
3 | 4 | 235
1 | 3 | 220
\`\`\``,
          starter: String.raw`-- Paid orders only (WHERE); keep customers with >= 3 orders and total > 200 (HAVING).
-- customer_id, orders, spent — ordered by spent descending, then customer_id.
SELECT customer_id, amount, status
FROM orders;
`,
          solution: String.raw`SELECT customer_id,
       COUNT(*)    AS orders,
       SUM(amount) AS spent
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING COUNT(*) >= 3 AND SUM(amount) > 200
ORDER BY spent DESC, customer_id;
`,
          hints: [
            "The status condition is about rows — it goes in `WHERE`, before grouping.",
            "The count and total are about groups — they go in `HAVING`, after `GROUP BY`.",
            "Customer 2 has three orders but only two paid ones; customer 4 has three paid ones that total 60.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT, status VARCHAR(10));
INSERT INTO orders VALUES (1, 1, 50, 'paid'), (2, 1, 80, 'paid'), (3, 1, 90, 'paid'), (4, 2, 300, 'paid'), (5, 2, 10, 'refunded'),
  (6, 2, 20, 'paid'), (7, 3, 100, 'paid'), (8, 3, 60, 'paid'), (9, 3, 70, 'paid'), (10, 3, 5, 'paid'),
  (11, 4, 10, 'paid'), (12, 4, 20, 'paid'), (13, 4, 30, 'paid');`,
              expected: "customer_id | orders | spent\n3 | 4 | 235\n1 | 3 | 220\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT, status VARCHAR(10));
INSERT INTO orders VALUES (1, 6, 50, 'paid'), (2, 6, 100, 'paid'), (3, 6, 100, 'paid'), (4, 5, 100, 'paid'), (5, 5, 100, 'paid'),
  (6, 5, 50, 'paid'), (7, 7, 100, 'paid'), (8, 7, 50, 'paid'), (9, 7, 50, 'paid'), (10, 8, 500, 'pending'), (11, 8, 1, 'paid'), (12, 8, 1, 'paid');`,
              expected: "customer_id | orders | spent\n5 | 3 | 250\n6 | 3 | 250\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT, status VARCHAR(10));
INSERT INTO orders VALUES (1, 1, 500, 'paid'), (2, 1, 500, 'paid'), (3, 1, 500, 'refunded');`,
              expected: "customer_id | orders | spent\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Duplicate emails",
          prompt: `Find the email addresses that appear more than once in \`users\`. Addresses that differ only in case or surrounding spaces are the same address, so compare \`LOWER(TRIM(email))\`.

| id | email |
| --- | --- |
| 1 | ada@x.com |
| 2 | bob@y.com |
| 3 | \`'Ada@X.com '\` |
| 4 | cy@z.com |
| 5 | bob@y.com |
| 6 | bob@y.com |

Return \`email\` (normalised), \`copies\` and \`first_id\` (the smallest id holding it). Order by \`email\`.

\`\`\`text
email | copies | first_id
ada@x.com | 2 | 1
bob@y.com | 3 | 2
\`\`\``,
          starter: String.raw`-- Normalised email, copies, first_id — only emails that appear more than once.
-- Order by email.
SELECT email
FROM users;
`,
          solution: String.raw`SELECT LOWER(TRIM(email)) AS email,
       COUNT(*)           AS copies,
       MIN(id)            AS first_id
FROM users
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY email;
`,
          hints: [
            "Group by the value that should be unique — here the normalised email.",
            "`HAVING COUNT(*) > 1` keeps only the groups with more than one row.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(80));
INSERT INTO users VALUES (1, 'ada@x.com'), (2, 'bob@y.com'), (3, 'Ada@X.com '), (4, 'cy@z.com'), (5, 'bob@y.com'), (6, 'bob@y.com');`,
              expected: "email | copies | first_id\nada@x.com | 2 | 1\nbob@y.com | 3 | 2\n",
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(80));
INSERT INTO users VALUES (1, 'a@a.io'), (2, 'b@b.io'), (3, 'c@c.io');`,
              expected: "email | copies | first_id\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(80));
INSERT INTO users VALUES (9, ' Z@Q.IO'), (4, 'z@q.io'), (7, 'm@n.io'), (2, 'M@N.io  '), (5, 'solo@x.io');`,
              expected: "email | copies | first_id\nm@n.io | 2 | 2\nz@q.io | 2 | 4\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which query finds the customers whose **every** order is above 100?",
          options: [
            "`… WHERE amount > 100 GROUP BY customer_id`",
            "`… GROUP BY customer_id HAVING MIN(amount) > 100`",
            "`… GROUP BY customer_id HAVING SUM(amount) > 100`",
            "`… GROUP BY customer_id HAVING MAX(amount) > 100`",
          ],
          answer: 1,
          explanation: "If the smallest order of a customer is above 100, all of them are. The `WHERE` version keeps anyone with *some* order above 100 (and so does `MAX`); `SUM` tests the total.",
        },
        {
          prompt: "Which clause should hold `region <> 'test'` in a query that groups by region and filters on `SUM(amount) > 1000`?",
          options: ["`HAVING`, next to the SUM condition", "`WHERE`", "Either, and it makes no difference at all", "`ORDER BY`"],
          answer: 1,
          explanation: "The result is the same in either clause, but a condition that needs no aggregate belongs in `WHERE`: it removes the rows before grouping (less work) and says the condition is about rows. The `SUM` condition can only go in `HAVING`.",
        },
        {
          prompt: "What does this return when `orders` has 50 rows?\n\n```sql\nSELECT COUNT(*) AS n FROM orders HAVING COUNT(*) > 100;\n```",
          options: ["One row: `50`", "One row: `0`", "No rows", "An error: HAVING needs GROUP BY"],
          answer: 2,
          explanation: "Without `GROUP BY` the whole table is one group; `HAVING` discards it because 50 is not above 100, so the result is empty. `HAVING` without `GROUP BY` is legal.",
        },
        {
          prompt: "`SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id HAVING total > 500;` runs in MySQL. Where else does it work unchanged?",
          options: ["PostgreSQL", "SQL Server", "Both", "Neither — portable code writes `HAVING SUM(amount) > 500`"],
          answer: 3,
          explanation: "Using a SELECT alias in `HAVING` is a MySQL extension; standard SQL evaluates `HAVING` before the SELECT list names its columns. Repeating the aggregate works everywhere.",
        },
      ],
    },
    {
      slug: "conditional-aggregation",
      file: "04-conditional-aggregation.md",
      exercises: [
        {
          title: "Orders by status, per month",
          prompt: `Pivot \`orders\` into one row per month with a column per status.

| id | created_on | status | amount |
| --- | --- | --- | --- |
| 1 | 2024-01-03 | paid | 10 |
| 2 | 2024-01-09 | paid | 20 |
| 3 | 2024-01-15 | refunded | 30 |
| 4 | 2024-01-30 | paid | 40 |
| 5 | 2024-02-02 | pending | 50 |
| 6 | 2024-02-11 | paid | 60 |
| 7 | 2024-02-28 | pending | 70 |
| 8 | 2024-03-01 | refunded | 80 |

Return \`month\` (\`2024-01\`), \`orders\` (all orders that month), \`paid\`, \`pending\` and \`refunded\` (the count of each status, 0 when there are none). Any other status counts only in \`orders\`. Order by \`month\`.

\`\`\`text
month | orders | paid | pending | refunded
2024-01 | 4 | 3 | 0 | 1
2024-02 | 3 | 1 | 2 | 0
2024-03 | 1 | 0 | 0 | 1
\`\`\``,
          starter: String.raw`-- month, orders, paid, pending, refunded — one SUM(CASE …) per status.
-- Order by month.
SELECT DATE_FORMAT(created_on, '%Y-%m') AS month, status
FROM orders;
`,
          solution: String.raw`SELECT DATE_FORMAT(created_on, '%Y-%m') AS month,
       COUNT(*) AS orders,
       SUM(CASE WHEN status = 'paid'     THEN 1 ELSE 0 END) AS paid,
       SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded
FROM orders
GROUP BY DATE_FORMAT(created_on, '%Y-%m')
ORDER BY month;
`,
          hints: [
            "`SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` counts the paid rows of each group.",
            "Don't filter with `WHERE` — every month must stay, with zeros where a status is missing.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, created_on DATE, status VARCHAR(10), amount INT);
INSERT INTO orders VALUES (1, '2024-01-03', 'paid', 10), (2, '2024-01-09', 'paid', 20), (3, '2024-01-15', 'refunded', 30), (4, '2024-01-30', 'paid', 40),
  (5, '2024-02-02', 'pending', 50), (6, '2024-02-11', 'paid', 60), (7, '2024-02-28', 'pending', 70), (8, '2024-03-01', 'refunded', 80);`,
              expected: "month | orders | paid | pending | refunded\n2024-01 | 4 | 3 | 0 | 1\n2024-02 | 3 | 1 | 2 | 0\n2024-03 | 1 | 0 | 0 | 1\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, created_on DATE, status VARCHAR(10), amount INT);
INSERT INTO orders VALUES (1, '2023-12-31', 'cancelled', 5), (2, '2024-01-01', NULL, 5), (3, '2024-01-02', 'paid', 5), (4, '2023-12-01', 'pending', 5);`,
              expected: "month | orders | paid | pending | refunded\n2023-12 | 2 | 0 | 1 | 0\n2024-01 | 2 | 1 | 0 | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Approval rate by country",
          prompt: `Each transaction is \`approved\` or \`declined\`.

| id | country | state | amount |
| --- | --- | --- | --- |
| 1 | IN | approved | 100 |
| 2 | IN | declined | 50 |
| 3 | IN | approved | 300 |
| 4 | US | declined | 20 |
| 5 | US | approved | 80 |
| 6 | US | declined | 40 |
| 7 | DE | declined | 10 |

Return \`country\`, \`trans_count\`, \`approved_pct\` — the percentage of transactions approved, rounded to 1 decimal — and \`avg_approved\`, the average amount of the approved transactions only (rounded to 2 decimals, NULL when there are none). Order by \`approved_pct\` descending, then \`country\`.

\`\`\`text
country | trans_count | approved_pct | avg_approved
IN | 3 | 66.7 | 200
US | 3 | 33.3 | 80
DE | 1 | 0 | NULL
\`\`\``,
          starter: String.raw`-- country, trans_count, approved_pct (AVG of a 1/0 CASE × 100, ROUND 1),
-- avg_approved (AVG of a CASE with no ELSE, ROUND 2) — ordered by approved_pct desc, then country.
SELECT country, state, amount
FROM transactions;
`,
          solution: String.raw`SELECT country,
       COUNT(*) AS trans_count,
       ROUND(100 * AVG(CASE WHEN state = 'approved' THEN 1 ELSE 0 END), 1) AS approved_pct,
       ROUND(AVG(CASE WHEN state = 'approved' THEN amount END), 2)        AS avg_approved
FROM transactions
GROUP BY country
ORDER BY approved_pct DESC, country;
`,
          hints: [
            "The average of a column of 1s and 0s is the fraction of 1s — multiply by 100 for a percentage.",
            "For `avg_approved`, leave out the `ELSE`: declined rows become NULL and `AVG` skips them.",
            "The rate needs the `ELSE 0`, or every non-approved row disappears from the denominator.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE transactions (id INT PRIMARY KEY, country VARCHAR(5), state VARCHAR(10), amount INT);
INSERT INTO transactions VALUES (1, 'IN', 'approved', 100), (2, 'IN', 'declined', 50), (3, 'IN', 'approved', 300), (4, 'US', 'declined', 20),
  (5, 'US', 'approved', 80), (6, 'US', 'declined', 40), (7, 'DE', 'declined', 10);`,
              expected: "country | trans_count | approved_pct | avg_approved\nIN | 3 | 66.7 | 200\nUS | 3 | 33.3 | 80\nDE | 1 | 0 | NULL\n",
            },
            {
              stdin: String.raw`CREATE TABLE transactions (id INT PRIMARY KEY, country VARCHAR(5), state VARCHAR(10), amount INT);
INSERT INTO transactions VALUES (1, 'FR', 'approved', 10), (2, 'FR', 'declined', 30), (3, 'AU', 'declined', 7), (4, 'AU', 'approved', 5),
  (5, 'JP', 'approved', 9), (6, 'JP', 'approved', 4);`,
              expected: "country | trans_count | approved_pct | avg_approved\nJP | 2 | 100 | 6.5\nAU | 2 | 50 | 5\nFR | 2 | 50 | 10\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `COUNT(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` return for a group of 5 rows, 2 of them paid?",
          options: ["2", "5", "3", "0"],
          answer: 1,
          explanation: "`COUNT` counts non-NULL values, and 0 is not NULL, so every row is counted: 5. Either drop the `ELSE` (non-matching rows become NULL) or use `SUM` with `ELSE 0`.",
        },
        {
          prompt: "Which expression gives the fraction of orders that were refunded, per group?",
          options: [
            "`AVG(CASE WHEN status = 'refunded' THEN 1 END)`",
            "`AVG(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END)`",
            "`COUNT(status = 'refunded') / COUNT(*)`",
            "`SUM(status) / COUNT(*)`",
          ],
          answer: 1,
          explanation: "The `ELSE 0` puts every row in the average, so the result is refunded / all. Without it `AVG` sees only the 1s and returns 1. `COUNT(status = 'refunded')` counts every row with a status, true or false.",
        },
        {
          prompt: "How does MySQL pivot quarterly sales into columns `q1`…`q4`?",
          options: [
            "With the `PIVOT` operator",
            "With `crosstab()`",
            "With one `SUM(CASE WHEN QUARTER(d) = n THEN amount ELSE 0 END)` per column, grouped by the row label",
            "It cannot; pivoting needs application code",
          ],
          answer: 2,
          explanation: "MySQL has no `PIVOT` (SQL Server does) and no `crosstab` (a PostgreSQL extension). Conditional aggregates are the MySQL way and work everywhere, as long as the columns are known in advance.",
        },
        {
          prompt: "Why use `SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` instead of `WHERE status = 'paid'` with `COUNT(*)`?",
          options: [
            "It is the only way to count rows",
            "`WHERE` removes groups with no paid rows, and only counts one status per query",
            "`WHERE` cannot compare strings",
            "`COUNT(*)` ignores NULLs",
          ],
          answer: 1,
          explanation: "The conditional form keeps every group — showing 0 where nothing matched — and can count several statuses side by side in one pass. With `WHERE`, a group with no paid rows vanishes.",
        },
      ],
    },
    {
      slug: "group-concat",
      file: "05-group-concat.md",
      exercises: [
        {
          title: "Products sold by date",
          prompt: `The \`activities\` table records each sale of a product; the same product can be sold several times a day.

| sell_date | product |
| --- | --- |
| 2020-05-30 | Headphone |
| 2020-06-01 | Pencil |
| 2020-06-02 | Mask |
| 2020-05-30 | Basketball |
| 2020-06-01 | Bible |
| 2020-06-02 | Mask |
| 2020-05-30 | T-Shirt |

For each date return \`sell_date\`, \`num_sold\` (the number of **different** products sold) and \`products\` (those products, each once, in alphabetical order, joined by a comma with no space). Order by \`sell_date\`.

\`\`\`text
sell_date | num_sold | products
2020-05-30 | 3 | Basketball,Headphone,T-Shirt
2020-06-01 | 2 | Bible,Pencil
2020-06-02 | 1 | Mask
\`\`\``,
          starter: String.raw`-- sell_date, num_sold (COUNT DISTINCT), products (GROUP_CONCAT DISTINCT … ORDER BY …),
-- ordered by sell_date.
SELECT sell_date, product
FROM activities;
`,
          solution: String.raw`SELECT sell_date,
       COUNT(DISTINCT product)                                        AS num_sold,
       GROUP_CONCAT(DISTINCT product ORDER BY product SEPARATOR ',')  AS products
FROM activities
GROUP BY sell_date
ORDER BY sell_date;
`,
          hints: [
            "`COUNT(DISTINCT product)` counts each product once per day.",
            "Inside the call: `GROUP_CONCAT(DISTINCT product ORDER BY product SEPARATOR ',')` — DISTINCT, then ORDER BY, then SEPARATOR.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE activities (sell_date DATE, product VARCHAR(20));
INSERT INTO activities VALUES ('2020-05-30', 'Headphone'), ('2020-06-01', 'Pencil'), ('2020-06-02', 'Mask'), ('2020-05-30', 'Basketball'),
  ('2020-06-01', 'Bible'), ('2020-06-02', 'Mask'), ('2020-05-30', 'T-Shirt');`,
              expected: "sell_date | num_sold | products\n2020-05-30 | 3 | Basketball,Headphone,T-Shirt\n2020-06-01 | 2 | Bible,Pencil\n2020-06-02 | 1 | Mask\n",
            },
            {
              stdin: String.raw`CREATE TABLE activities (sell_date DATE, product VARCHAR(20));
INSERT INTO activities VALUES ('2021-01-01', 'pen'), ('2021-01-01', 'ink'), ('2021-01-01', 'pen'), ('2021-01-01', 'apple'), ('2020-12-31', 'zip'), ('2020-12-31', 'zip');`,
              expected: "sell_date | num_sold | products\n2020-12-31 | 1 | zip\n2021-01-01 | 3 | apple,ink,pen\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Team rosters",
          prompt: `Build one line per team from \`players\`. A player's position may be unknown (NULL).

| team | name | position |
| --- | --- | --- |
| red | Asha | GK |
| red | Ben | FW |
| blue | Cara | DF |
| red | Dev | FW |
| blue | Eli | FW |

Return \`team\`, \`roster\` — every player as \`name (position)\`, with \`?\` for an unknown position, ordered by name and separated by \`; \` — and \`positions\` — the team's different known positions in alphabetical order separated by \`/\` (NULL when none is known). Order by \`team\`.

\`\`\`text
team | roster | positions
blue | Cara (DF); Eli (FW) | DF/FW
red | Asha (GK); Ben (FW); Dev (FW) | FW/GK
\`\`\``,
          starter: String.raw`-- team, roster (GROUP_CONCAT of CONCAT(name, ' (', position, ')') …), positions (DISTINCT, '/'),
-- ordered by team.
SELECT team, name, position
FROM players;
`,
          solution: String.raw`SELECT team,
       GROUP_CONCAT(CONCAT(name, ' (', COALESCE(position, '?'), ')') ORDER BY name SEPARATOR '; ') AS roster,
       GROUP_CONCAT(DISTINCT position ORDER BY position SEPARATOR '/')                          AS positions
FROM players
GROUP BY team
ORDER BY team;
`,
          hints: [
            "`CONCAT` returns NULL when the position is NULL, and `GROUP_CONCAT` would then drop that player — `COALESCE(position, '?')` keeps them.",
            "`GROUP_CONCAT` skips NULL values, so the positions list leaves unknown ones out by itself, and is NULL when there are none.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE players (team VARCHAR(10), name VARCHAR(20), position VARCHAR(5));
INSERT INTO players VALUES ('red', 'Asha', 'GK'), ('red', 'Ben', 'FW'), ('blue', 'Cara', 'DF'), ('red', 'Dev', 'FW'), ('blue', 'Eli', 'FW');`,
              expected: "team | roster | positions\nblue | Cara (DF); Eli (FW) | DF/FW\nred | Asha (GK); Ben (FW); Dev (FW) | FW/GK\n",
            },
            {
              stdin: String.raw`CREATE TABLE players (team VARCHAR(10), name VARCHAR(20), position VARCHAR(5));
INSERT INTO players VALUES ('green', 'Zed', NULL), ('green', 'Amy', 'MF'), ('gold', 'Kim', NULL), ('green', 'Bo', 'MF');`,
              expected: "team | roster | positions\ngold | Kim (?) | NULL\ngreen | Amy (MF); Bo (MF); Zed (?) | MF\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What separator does `GROUP_CONCAT(name)` use by default?",
          options: ["`', '` (comma and space)", "`','` (comma, no space)", "`' '` (space)", "None — a separator is required"],
          answer: 1,
          explanation: "MySQL's default is a bare comma. `STRING_AGG` in PostgreSQL and SQL Server is the one that has no default and requires the separator argument.",
        },
        {
          prompt: "Which call is written correctly?",
          options: [
            "`GROUP_CONCAT(name SEPARATOR ', ' ORDER BY name)`",
            "`GROUP_CONCAT(DISTINCT name ORDER BY name SEPARATOR ', ')`",
            "`GROUP_CONCAT(ORDER BY name, DISTINCT name)`",
            "`GROUP_CONCAT(name, ', ') ORDER BY name`",
          ],
          answer: 1,
          explanation: "The order inside the call is `DISTINCT`, the expression, `ORDER BY`, then `SEPARATOR` last. An `ORDER BY` outside the call sorts the groups, not the values in each string.",
        },
        {
          prompt: "A report's `GROUP_CONCAT` of order ids stops after about 200 ids with no error. Why?",
          options: [
            "`GROUP_CONCAT` accepts at most 200 values",
            "The result is cut at `group_concat_max_len`, 1,024 characters by default, with only a warning",
            "The ids contain NULLs",
            "The query needs `DISTINCT`",
          ],
          answer: 1,
          explanation: "MySQL silently truncates the result to `group_concat_max_len` characters. Raise it with `SET SESSION group_concat_max_len = …`, or return the ids as rows.",
        },
        {
          prompt: "What is PostgreSQL's equivalent of `GROUP_CONCAT(name ORDER BY name SEPARATOR ', ')`?",
          options: [
            "`CONCAT_WS(', ', name)`",
            "`STRING_AGG(name, ', ' ORDER BY name)`",
            "`LISTAGG(name)`",
            "`ARRAY(name)`",
          ],
          answer: 1,
          explanation: "PostgreSQL uses `STRING_AGG` with the order inside the call. `CONCAT_WS` joins arguments within a row, not rows of a group; `LISTAGG` is Oracle's name.",
        },
      ],
    },
    {
      slug: "grouping-pitfalls",
      file: "06-grouping-pitfalls.md",
      exercises: [
        {
          title: "Three counts per department",
          prompt: `\`manager_id\` is NULL for an employee with no manager.

| id | department | manager_id |
| --- | --- | --- |
| 1 | eng | NULL |
| 2 | eng | 1 |
| 3 | eng | 1 |
| 4 | eng | 2 |
| 5 | ops | NULL |
| 6 | ops | 5 |
| 7 | hr | NULL |

Per department return \`department\`, \`employees\` (all of them), \`with_manager\` (those who have a manager) and \`managers\` (how many different people manage someone in it). Order by \`department\`.

\`\`\`text
department | employees | with_manager | managers
eng | 4 | 3 | 2
hr | 1 | 0 | 0
ops | 2 | 1 | 1
\`\`\``,
          starter: String.raw`-- department, employees, with_manager, managers — three different COUNTs.
-- Order by department.
SELECT department, manager_id
FROM employees;
`,
          solution: String.raw`SELECT department,
       COUNT(*)                    AS employees,
       COUNT(manager_id)           AS with_manager,
       COUNT(DISTINCT manager_id)  AS managers
FROM employees
GROUP BY department
ORDER BY department;
`,
          hints: [
            "Rows, rows with a value, different values: `COUNT(*)`, `COUNT(col)`, `COUNT(DISTINCT col)`.",
            "None of the counts needs a `WHERE` — a filter would remove the department with no managed employees.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, department VARCHAR(10), manager_id INT);
INSERT INTO employees VALUES (1, 'eng', NULL), (2, 'eng', 1), (3, 'eng', 1), (4, 'eng', 2), (5, 'ops', NULL), (6, 'ops', 5), (7, 'hr', NULL);`,
              expected: "department | employees | with_manager | managers\neng | 4 | 3 | 2\nhr | 1 | 0 | 0\nops | 2 | 1 | 1\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, department VARCHAR(10), manager_id INT);
INSERT INTO employees VALUES (1, 'sales', 9), (2, 'sales', 9), (3, 'sales', 9), (4, 'legal', NULL), (5, 'legal', NULL);`,
              expected: "department | employees | with_manager | managers\nlegal | 2 | 0 | 0\nsales | 3 | 3 | 1\n",
              hidden: true,
            },
          ],
        },
        {
          title: "A weighted unit price",
          prompt: `Each line of \`order_lines\` sells \`qty\` units at \`price\` each. The average of the \`price\` column is not the average price paid per unit, because lines sell different quantities.

| store | price | qty |
| --- | --- | --- |
| A | 10 | 1 |
| A | 20 | 9 |
| B | 5 | 4 |
| B | 5 | 6 |

Per store return \`store\`, \`line_count\` (lines sold), \`units\` (total quantity), \`avg_price\` (the plain average of \`price\`) and \`unit_price\` (total money over total units) — both rounded to 2 decimals, and \`unit_price\` NULL when the store sold no units. Order by \`store\`.

\`\`\`text
store | line_count | units | avg_price | unit_price
A | 2 | 10 | 15 | 19
B | 2 | 10 | 5 | 5
\`\`\``,
          starter: String.raw`-- store, line_count, units, avg_price (AVG, ROUND 2), unit_price (SUM(price*qty)/SUM(qty), ROUND 2).
-- Order by store.
SELECT store, price, qty
FROM order_lines;
`,
          solution: String.raw`SELECT store,
       COUNT(*)                                           AS line_count,
       SUM(qty)                                           AS units,
       ROUND(AVG(price), 2)                               AS avg_price,
       ROUND(SUM(price * qty) / NULLIF(SUM(qty), 0), 2)   AS unit_price
FROM order_lines
GROUP BY store
ORDER BY store;
`,
          hints: [
            "Weighted price = total money / total units = `SUM(price * qty) / SUM(qty)`.",
            "Guard the divisor with `NULLIF(SUM(qty), 0)` so a store with no units gives NULL.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE order_lines (store VARCHAR(5), price DECIMAL(10,2), qty INT);
INSERT INTO order_lines VALUES ('A', 10, 1), ('A', 20, 9), ('B', 5, 4), ('B', 5, 6);`,
              expected: "store | line_count | units | avg_price | unit_price\nA | 2 | 10 | 15 | 19\nB | 2 | 10 | 5 | 5\n",
            },
            {
              stdin: String.raw`CREATE TABLE order_lines (store VARCHAR(5), price DECIMAL(10,2), qty INT);
INSERT INTO order_lines VALUES ('D', 3.50, 2), ('C', 100, 0), ('D', 2.25, 4), ('D', 1.00, 1);`,
              expected: "store | line_count | units | avg_price | unit_price\nC | 1 | 0 | 100 | NULL\nD | 3 | 7 | 2.25 | 2.43\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "MySQL 8 rejects `SELECT department, name, MAX(salary) FROM employees GROUP BY department` with error 1055. Why?",
          options: [
            "`MAX` cannot be used with `GROUP BY`",
            "`name` has many values per department and the query does not say which one to show",
            "`department` must be aggregated",
            "Error 1055 means the table is empty",
          ],
          answer: 1,
          explanation: "Under `ONLY_FULL_GROUP_BY` every selected column must be grouped, aggregated or functionally dependent on the grouping. The query does not mean \"the name of the top earner\" — that needs a subquery or window function.",
        },
        {
          prompt: "Which change makes MySQL accept `SELECT d.id, d.name, COUNT(*) … GROUP BY d.id` when `id` is the primary key of `d`?",
          options: ["None — it is already accepted", "Wrap `name` in `ANY_VALUE`", "Add `name` to GROUP BY", "Turn off ONLY_FULL_GROUP_BY"],
          answer: 0,
          explanation: "Grouping by a table's primary key determines every other column of that table, and MySQL 5.7+ recognises that functional dependence. The other options would also work but are unnecessary.",
        },
        {
          prompt: "Store A made 2 sales averaging 100; store B made 198 sales averaging 50. What is the average sale across both?",
          options: ["75", "50.5", "50", "100"],
          answer: 1,
          explanation: "Total revenue is 200 + 9,900 = 10,100 over 200 sales, so 50.5. Averaging the two averages (75) weights store A's two sales like store B's 198 — carry sums and counts, then divide.",
        },
        {
          prompt: "`SELECT team, SUM(salary) + SUM(bonus) AS pay FROM staff GROUP BY team` shows NULL for a team. What is the likely cause?",
          options: [
            "The team has no salaries",
            "Every `bonus` in that team is NULL, so `SUM(bonus)` is NULL and the addition is NULL",
            "`SUM` cannot be added",
            "The team name is NULL",
          ],
          answer: 1,
          explanation: "`SUM` over only NULLs is NULL, and anything plus NULL is NULL. `COALESCE(SUM(bonus), 0)` fixes it.",
        },
      ],
    },
    {
      slug: "aggregation-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Monthly sales with a revenue floor",
          prompt: `Summarise \`sales\` per month, leaving out rows from the \`test\` region (a NULL region is a real sale and counts), and keep only months whose revenue is **at least 100**.

| id | sold_on | amount | region |
| --- | --- | --- | --- |
| 1 | 2024-01-04 | 40 | north |
| 2 | 2024-01-18 | 70 | south |
| 3 | 2024-01-20 | 500 | test |
| 4 | 2024-02-02 | 30 | north |
| 5 | 2024-02-10 | 50 | north |
| 6 | 2024-03-05 | 120 | south |
| 7 | 2024-03-25 | 15 | north |
| 8 | 2024-02-12 | 900 | test |

Return \`month\` (\`2024-01\`), \`sales\`, \`revenue\`, \`avg_sale\` (rounded to 2 decimals) and \`biggest\`. Order by \`month\`.

\`\`\`text
month | sales | revenue | avg_sale | biggest
2024-01 | 2 | 110 | 55 | 70
2024-03 | 2 | 135 | 67.5 | 120
\`\`\``,
          starter: String.raw`-- Leave out region 'test' (keep NULL regions), group by month, keep revenue >= 100.
-- month, sales, revenue, avg_sale (ROUND 2), biggest — ordered by month.
SELECT sold_on, amount, region
FROM sales;
`,
          solution: String.raw`SELECT DATE_FORMAT(sold_on, '%Y-%m') AS month,
       COUNT(*)                      AS sales,
       SUM(amount)                   AS revenue,
       ROUND(AVG(amount), 2)         AS avg_sale,
       MAX(amount)                   AS biggest
FROM sales
WHERE region <> 'test' OR region IS NULL
GROUP BY DATE_FORMAT(sold_on, '%Y-%m')
HAVING SUM(amount) >= 100
ORDER BY month;
`,
          hints: [
            "`region <> 'test'` is unknown for a NULL region, so it would drop those rows — add `OR region IS NULL`.",
            "The region rule is about rows (`WHERE`); the revenue floor is about months (`HAVING`).",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE sales (id INT PRIMARY KEY, sold_on DATE, amount DECIMAL(10,2), region VARCHAR(10));
INSERT INTO sales VALUES (1, '2024-01-04', 40, 'north'), (2, '2024-01-18', 70, 'south'), (3, '2024-01-20', 500, 'test'), (4, '2024-02-02', 30, 'north'),
  (5, '2024-02-10', 50, 'north'), (6, '2024-03-05', 120, 'south'), (7, '2024-03-25', 15, 'north'), (8, '2024-02-12', 900, 'test');`,
              expected: "month | sales | revenue | avg_sale | biggest\n2024-01 | 2 | 110 | 55 | 70\n2024-03 | 2 | 135 | 67.5 | 120\n",
            },
            {
              stdin: String.raw`CREATE TABLE sales (id INT PRIMARY KEY, sold_on DATE, amount DECIMAL(10,2), region VARCHAR(10));
INSERT INTO sales VALUES (1, '2024-05-01', 60, NULL), (2, '2024-05-09', 40, 'east'), (3, '2024-06-01', 99.5, 'east'), (4, '2024-06-02', 100, 'test');`,
              expected: "month | sales | revenue | avg_sale | biggest\n2024-05 | 2 | 100 | 50 | 60\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Monthly transactions report",
          prompt: `For each month and country, report the transactions and the approved ones.

| id | country | state | amount | trans_date |
| --- | --- | --- | --- | --- |
| 121 | US | approved | 1000 | 2018-12-18 |
| 122 | US | declined | 2000 | 2018-12-19 |
| 123 | US | approved | 2000 | 2019-01-01 |
| 124 | DE | approved | 2000 | 2019-01-07 |

Return \`month\` (\`2018-12\`), \`country\`, \`trans_count\`, \`approved_count\`, \`trans_total_amount\` and \`approved_total_amount\` (0 when nothing was approved). \`country\` may be NULL; those rows form their own group. Order by \`month\`, then \`country\`.

\`\`\`text
month | country | trans_count | approved_count | trans_total_amount | approved_total_amount
2018-12 | US | 2 | 1 | 3000 | 1000
2019-01 | DE | 1 | 1 | 2000 | 2000
2019-01 | US | 1 | 1 | 2000 | 2000
\`\`\``,
          starter: String.raw`-- month, country, trans_count, approved_count, trans_total_amount, approved_total_amount.
-- Order by month, then country.
SELECT trans_date, country, state, amount
FROM transactions;
`,
          solution: String.raw`SELECT DATE_FORMAT(trans_date, '%Y-%m') AS month,
       country,
       COUNT(*)                                                  AS trans_count,
       SUM(CASE WHEN state = 'approved' THEN 1 ELSE 0 END)       AS approved_count,
       SUM(amount)                                               AS trans_total_amount,
       SUM(CASE WHEN state = 'approved' THEN amount ELSE 0 END)  AS approved_total_amount
FROM transactions
GROUP BY DATE_FORMAT(trans_date, '%Y-%m'), country
ORDER BY month, country;
`,
          hints: [
            "Group by the month key and the country together.",
            "Two conditional aggregates: one adds 1 per approved row, the other adds its amount — both with `ELSE 0` so a month with no approvals shows 0.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE transactions (id INT PRIMARY KEY, country VARCHAR(5), state VARCHAR(10), amount INT, trans_date DATE);
INSERT INTO transactions VALUES (121, 'US', 'approved', 1000, '2018-12-18'), (122, 'US', 'declined', 2000, '2018-12-19'),
  (123, 'US', 'approved', 2000, '2019-01-01'), (124, 'DE', 'approved', 2000, '2019-01-07');`,
              expected: "month | country | trans_count | approved_count | trans_total_amount | approved_total_amount\n2018-12 | US | 2 | 1 | 3000 | 1000\n2019-01 | DE | 1 | 1 | 2000 | 2000\n2019-01 | US | 1 | 1 | 2000 | 2000\n",
            },
            {
              stdin: String.raw`CREATE TABLE transactions (id INT PRIMARY KEY, country VARCHAR(5), state VARCHAR(10), amount INT, trans_date DATE);
INSERT INTO transactions VALUES (1, NULL, 'approved', 10, '2020-01-05'), (2, NULL, 'declined', 20, '2020-01-06'),
  (3, 'IN', 'declined', 30, '2020-01-07'), (4, 'IN', 'declined', 40, '2020-02-01');`,
              expected: "month | country | trans_count | approved_count | trans_total_amount | approved_total_amount\n2020-01 | NULL | 2 | 1 | 30 | 10\n2020-01 | IN | 1 | 0 | 30 | 0\n2020-02 | IN | 1 | 0 | 40 | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Busy days and what sold",
          prompt: `From \`orders\`, list the days on which **at least two different customers** ordered.

| order_date | customer | product |
| --- | --- | --- |
| 2024-04-01 | ana | pen |
| 2024-04-01 | raj | ink |
| 2024-04-01 | ana | ink |
| 2024-04-02 | raj | pad |
| 2024-04-02 | raj | pen |
| 2024-04-03 | li | pen |
| 2024-04-03 | ana | pad |
| 2024-04-03 | raj | pad |

Return \`order_date\`, \`customers\` (different customers that day) and \`products\` (the different products, alphabetical, separated by \`, \`). Order by \`order_date\`.

\`\`\`text
order_date | customers | products
2024-04-01 | 2 | ink, pen
2024-04-03 | 3 | pad, pen
\`\`\``,
          starter: String.raw`-- order_date, customers (COUNT DISTINCT), products (GROUP_CONCAT DISTINCT, ', '),
-- only days with >= 2 different customers, ordered by order_date.
SELECT order_date, customer, product
FROM orders;
`,
          solution: String.raw`SELECT order_date,
       COUNT(DISTINCT customer)                                       AS customers,
       GROUP_CONCAT(DISTINCT product ORDER BY product SEPARATOR ', ') AS products
FROM orders
GROUP BY order_date
HAVING COUNT(DISTINCT customer) >= 2
ORDER BY order_date;
`,
          hints: [
            "\"Different customers\" is `COUNT(DISTINCT customer)` — the same customer twice is one.",
            "The two-customer rule is about the day's group, so it goes in `HAVING`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (order_date DATE, customer VARCHAR(10), product VARCHAR(10));
INSERT INTO orders VALUES ('2024-04-01', 'ana', 'pen'), ('2024-04-01', 'raj', 'ink'), ('2024-04-01', 'ana', 'ink'), ('2024-04-02', 'raj', 'pad'),
  ('2024-04-02', 'raj', 'pen'), ('2024-04-03', 'li', 'pen'), ('2024-04-03', 'ana', 'pad'), ('2024-04-03', 'raj', 'pad');`,
              expected: "order_date | customers | products\n2024-04-01 | 2 | ink, pen\n2024-04-03 | 3 | pad, pen\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (order_date DATE, customer VARCHAR(10), product VARCHAR(10));
INSERT INTO orders VALUES ('2024-05-01', 'ana', 'pen'), ('2024-05-01', 'ana', 'ink'), ('2024-05-02', 'li', 'pad');`,
              expected: "order_date | customers | products\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (order_date DATE, customer VARCHAR(10), product VARCHAR(10));
INSERT INTO orders VALUES ('2024-06-09', 'zoe', 'tape'), ('2024-06-09', 'amir', 'glue'), ('2024-06-09', 'zoe', 'glue'), ('2024-06-08', 'bo', 'clip'), ('2024-06-08', 'cy', 'clip');`,
              expected: "order_date | customers | products\n2024-06-08 | 2 | clip\n2024-06-09 | 2 | glue, tape\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A table has 10 rows; `email` is NULL in 3 and two of the remaining addresses are the same. What are `COUNT(*)`, `COUNT(email)` and `COUNT(DISTINCT email)`?",
          options: ["10, 10, 9", "10, 7, 6", "10, 7, 7", "7, 7, 6"],
          answer: 1,
          explanation: "`COUNT(*)` counts all 10 rows, `COUNT(email)` the 7 non-NULL emails, and `COUNT(DISTINCT email)` the 6 different ones (the repeated address counts once).",
        },
        {
          prompt: "What does `SELECT MAX(amount) FROM orders` return on an empty table?",
          options: ["0", "One row holding NULL", "No rows", "An error"],
          answer: 1,
          explanation: "An aggregate without `GROUP BY` always returns one row; `MAX`, `MIN`, `SUM` and `AVG` of nothing are NULL. Only `COUNT` returns 0.",
        },
        {
          prompt: "In which logical order are the clauses of a grouped query evaluated?",
          options: [
            "SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY",
            "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY",
            "FROM, GROUP BY, WHERE, HAVING, SELECT, ORDER BY",
            "FROM, WHERE, HAVING, GROUP BY, SELECT, ORDER BY",
          ],
          answer: 1,
          explanation: "Rows are read, filtered by `WHERE`, grouped, filtered as groups by `HAVING`, then the SELECT list is computed and the result sorted. That is why `WHERE` cannot use aggregates or SELECT aliases.",
        },
        {
          prompt: "Which query finds email addresses stored more than once?",
          options: [
            "`SELECT email FROM users WHERE COUNT(*) > 1 GROUP BY email`",
            "`SELECT DISTINCT email FROM users`",
            "`SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1`",
            "`SELECT email, COUNT(*) FROM users HAVING COUNT(*) > 1`",
          ],
          answer: 2,
          explanation: "Group by the value that should be unique and keep groups with more than one row. An aggregate in `WHERE` is an error, `DISTINCT` hides the duplicates, and without `GROUP BY` the whole table is one group.",
        },
        {
          prompt: "Why does `GROUP BY MONTH(order_date)` give wrong totals in a report covering 2023 and 2024?",
          options: [
            "`MONTH` returns text",
            "March 2023 and March 2024 fall into the same group",
            "GROUP BY cannot use functions",
            "It sorts months alphabetically",
          ],
          answer: 1,
          explanation: "`MONTH` returns 1–12 with no year, so the same month of different years merges. Group by `DATE_FORMAT(order_date, '%Y-%m')` or by `YEAR(…), MONTH(…)`.",
        },
        {
          prompt: "What does `SUM(CASE WHEN status = 'paid' THEN amount END)` return for a group with no paid rows?",
          options: ["0", "NULL", "The total of all amounts", "An error"],
          answer: 1,
          explanation: "With no `ELSE`, every row gives NULL and `SUM` of only NULLs is NULL. Add `ELSE 0` when the report should show 0.",
        },
        {
          prompt: "Which expression is the share of approved transactions in each group?",
          options: [
            "`AVG(CASE WHEN state = 'approved' THEN 1 ELSE 0 END)`",
            "`AVG(CASE WHEN state = 'approved' THEN 1 END)`",
            "`COUNT(state = 'approved')`",
            "`SUM(state) / COUNT(*)`",
          ],
          answer: 0,
          explanation: "The `ELSE 0` keeps every row in the average, so it equals approved / all. Without it the average is always 1; `COUNT` of a comparison counts every non-NULL comparison, true or false.",
        },
        {
          prompt: "Where does `SEPARATOR` go in a `GROUP_CONCAT` call?",
          options: ["First, before the expression", "Last, after any ORDER BY", "Outside the parentheses", "Before DISTINCT"],
          answer: 1,
          explanation: "The form is `GROUP_CONCAT([DISTINCT] expr [ORDER BY …] [SEPARATOR '…'])` — the separator always comes last.",
        },
        {
          prompt: "`WHERE region <> 'test'` is added to a sales query. What happens to rows whose region is NULL?",
          options: [
            "They are kept",
            "They are dropped, because `NULL <> 'test'` is unknown, not true",
            "They are grouped with 'test'",
            "The query fails",
          ],
          answer: 1,
          explanation: "A comparison with NULL is unknown, and `WHERE` keeps only true rows. Add `OR region IS NULL` (or compare `COALESCE(region, '')`) when NULL rows should stay.",
        },
        {
          prompt: "Under `ONLY_FULL_GROUP_BY`, which is the right fix when every row of a group holds the same `department_name` but you group by `department_id` from a table where it is not the key?",
          options: ["Turn the SQL mode off", "`ANY_VALUE(department_name)`", "`COUNT(department_name)`", "Remove the GROUP BY"],
          answer: 1,
          explanation: "`ANY_VALUE` tells MySQL that any value of the group will do — correct when they are known to be equal. Turning the mode off brings back arbitrary values silently; `COUNT` changes the meaning; removing `GROUP BY` collapses everything into one row.",
        },
        {
          prompt: "Five lines sell 1, 1, 1, 1 and 96 units at prices 10, 10, 10, 10 and 2. Which gives the average price paid per unit?",
          options: ["`AVG(price)`", "`SUM(price * qty) / SUM(qty)`", "`SUM(price) / SUM(qty)`", "`AVG(price * qty)`"],
          answer: 1,
          explanation: "Total money (40 + 192 = 232) over total units (100) is 2.32. `AVG(price)` is 8.4 because it gives each line the same weight regardless of quantity; the other two mix the wrong totals.",
        },
        {
          prompt: "A query's `COUNT(*)` per order doubled after joining `orders` to `order_lines`. Why?",
          options: [
            "COUNT counts NULLs twice",
            "The join repeats each order once per matching line, so rows are counted per line",
            "GROUP BY was evaluated twice",
            "The join removes duplicates",
          ],
          answer: 1,
          explanation: "A join multiplies rows: an order with two lines appears twice. Count `DISTINCT` order ids, or aggregate each table before joining.",
        },
      ],
    },
  ],
});
