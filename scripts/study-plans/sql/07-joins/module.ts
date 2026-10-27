import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "joins",
  title: "Joins",
  blurb: "INNER JOIN and row multiplication, LEFT and RIGHT JOIN with the ON-versus-WHERE trap, FULL OUTER JOIN emulated in MySQL, CROSS JOIN grids, self joins for hierarchies and pairs, chains through junction tables with the fan-out problem, and semi and anti joins.",
  icon: "plug",
  overview: `A relational database stores each fact once and links tables by keys, so almost every real question — which customer placed this order, which teacher runs this course, which products never sold — needs rows from more than one table. Joins put them back together. This module teaches every kind of join MySQL 8 offers, the one it does not (FULL OUTER JOIN) and how to write it anyway, and the traps that make a join return plausible but wrong numbers: rows that vanish, rows that repeat, and filters in the wrong clause.

INNER JOIN covers \`JOIN … ON\`, aliases and qualified columns, the "Cartesian product, then filter" model, one-to-many row repetition, and \`USING\`, comma and \`NATURAL\` joins. LEFT and RIGHT JOIN covers NULL-filled rows, \`COUNT(col)\` versus \`COUNT(*)\`, \`COALESCE\` on sums and the classic ON-versus-WHERE trap. FULL and CROSS joins covers the \`LEFT JOIN … UNION ALL\` emulation, why \`UNION\` can lose rows, and cross-join grids that report empty cells as zero. Self joins covers managers, pairs with \`a.id < b.id\` and day-to-day comparisons with \`DATE_ADD\`. Joining many tables covers chains, junction tables, an inner join undoing a left join, and fan-out. Semi and anti joins covers \`EXISTS\`, \`IN\`, \`NOT EXISTS\`, \`LEFT JOIN … IS NULL\` and why \`NOT IN\` breaks on NULL.

Every exercise is a query judged against small datasets with the awkward rows real data has — orders for customers who do not exist, keys that are NULL, empty tables, duplicate names, ties. The checkpoint adds a department report that keeps empty departments, a same-department pairing and an anti join restricted to one term.`,
  lessons: [
    {
      slug: "inner-join",
      file: "01-inner-join.md",
      exercises: [
        {
          title: "Orders with their customers",
          prompt: `List every order together with the name and city of the customer who placed it. Orders whose customer does not exist (or is NULL) are not listed.

**Tables:** \`customers(id, name, city)\` and \`orders(id, customer_id, order_date, amount)\`.

| customers.id | name | city |
| --- | --- | --- |
| 1 | Asha | Pune |
| 2 | Ben | Delhi |
| 3 | Chen | Pune |

| orders.id | customer_id | order_date | amount |
| --- | --- | --- | --- |
| 10 | 1 | 2024-01-05 | 250 |
| 11 | 1 | 2024-02-11 | 100 |
| 12 | 2 | 2024-02-20 | 400 |
| 13 | 9 | 2024-03-01 | 75 |

**Output:** columns \`order_id\`, \`customer\`, \`city\`, \`amount\`, ordered by \`order_id\`.

\`\`\`text
order_id | customer | city | amount
10 | Asha | Pune | 250
11 | Asha | Pune | 100
12 | Ben | Delhi | 400
\`\`\``,
          starter: String.raw`-- Join orders to customers and list each order with its customer's name and city.
-- Columns: order_id, customer, city, amount — ordered by order_id.
`,
          solution: String.raw`SELECT o.id AS order_id, c.name AS customer, c.city, o.amount
FROM orders o
JOIN customers c ON c.id = o.customer_id
ORDER BY o.id;
`,
          hints: [
            "Join `orders` to `customers` with `ON c.id = o.customer_id`.",
            "Both tables have an `id` column, so qualify it (`o.id`) and alias it `order_id`.",
            "An inner join already drops order 13, whose customer 9 does not exist — no `WHERE` is needed.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Asha', 'Pune'), (2, 'Ben', 'Delhi'), (3, 'Chen', 'Pune');
INSERT INTO orders VALUES (10, 1, '2024-01-05', 250), (11, 1, '2024-02-11', 100), (12, 2, '2024-02-20', 400), (13, 9, '2024-03-01', 75);
`,
              expected: "order_id | customer | city | amount\n10 | Asha | Pune | 250\n11 | Asha | Pune | 100\n12 | Ben | Delhi | 400\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Dev', 'Mumbai'), (2, 'Esha', 'Chennai'), (4, 'Farah', 'Mumbai');
INSERT INTO orders VALUES (20, 2, '2024-05-01', 90), (21, NULL, '2024-05-02', 60), (22, 1, '2024-05-03', 30), (23, 2, '2024-05-04', 120), (24, 3, '2024-05-05', 10);
`,
              expected: "order_id | customer | city | amount\n20 | Esha | Chennai | 90\n22 | Dev | Mumbai | 30\n23 | Esha | Chennai | 120\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Gita', 'Pune');
`,
              expected: "order_id | customer | city | amount\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Revenue per city",
          prompt: `For each city, report how many orders its customers placed and their total amount. Only orders that belong to an existing customer count; cities with no orders are not listed.

**Tables:** \`customers(id, name, city)\` and \`orders(id, customer_id, order_date, amount)\`.

| customers.id | name | city |
| --- | --- | --- |
| 1 | Asha | Pune |
| 2 | Ben | Delhi |
| 3 | Chen | Pune |
| 4 | Dina | Kochi |

| orders.id | customer_id | order_date | amount |
| --- | --- | --- | --- |
| 10 | 1 | 2024-01-05 | 250 |
| 11 | 1 | 2024-02-11 | 100 |
| 12 | 2 | 2024-02-20 | 400 |
| 13 | 3 | 2024-02-25 | 50 |
| 14 | 9 | 2024-03-01 | 75 |

**Output:** columns \`city\`, \`orders\`, \`revenue\`, ordered by \`revenue\` descending, then \`city\` ascending.

\`\`\`text
city | orders | revenue
Delhi | 1 | 400
Pune | 3 | 400
\`\`\``,
          starter: String.raw`-- Join, then group by city: number of orders and total amount per city.
-- Columns: city, orders, revenue — ordered by revenue DESC, city.
`,
          solution: String.raw`SELECT c.city, COUNT(*) AS orders, SUM(o.amount) AS revenue
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.city
ORDER BY revenue DESC, c.city;
`,
          hints: [
            "Join first, then `GROUP BY c.city` — the join gives each order its customer's city.",
            "`COUNT(*)` counts the joined rows, which is one per matched order.",
            "Delhi and Pune tie on revenue; the second sort key `city` breaks the tie.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Asha', 'Pune'), (2, 'Ben', 'Delhi'), (3, 'Chen', 'Pune'), (4, 'Dina', 'Kochi');
INSERT INTO orders VALUES (10, 1, '2024-01-05', 250), (11, 1, '2024-02-11', 100), (12, 2, '2024-02-20', 400), (13, 3, '2024-02-25', 50), (14, 9, '2024-03-01', 75);
`,
              expected: "city | orders | revenue\nDelhi | 1 | 400\nPune | 3 | 400\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Arun', 'Surat'), (2, 'Bela', 'Agra'), (3, 'Cyrus', 'Surat');
INSERT INTO orders VALUES (1, 1, '2024-01-01', 10), (2, 2, '2024-01-02', 30), (3, 3, '2024-01-03', 25), (4, NULL, '2024-01-04', 500);
`,
              expected: "city | orders | revenue\nSurat | 2 | 35\nAgra | 1 | 30\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Pia', NULL), (2, 'Quinn', 'Goa');
INSERT INTO orders VALUES (1, 1, '2024-02-01', 5), (2, 2, '2024-02-02', 7);
`,
              expected: "city | orders | revenue\nGoa | 1 | 7\nNULL | 1 | 5\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`customers` has 3 rows and `orders` has 4. Customer 3 has no orders and one order points at a customer id that does not exist. How many rows does `customers JOIN orders ON orders.customer_id = customers.id` return?",
          options: ["3", "4", "2 (one per customer who has orders)", "12"],
          answer: 0,
          explanation: "Only the three orders whose customer exists find a partner, so three rows come back. The customer with no orders and the orphan order are both dropped — an inner join keeps only matched pairs. 12 would be the Cartesian product, which is what you get with no `ON` at all. \"One per customer\" is wrong: a join returns pairs, and a customer with two orders appears twice.",
        },
        {
          prompt: "`SELECT id, name, amount FROM orders JOIN customers ON customers.id = orders.customer_id;` fails in MySQL. Why?",
          options: [
            "`JOIN` needs the word `INNER`",
            "`id` exists in both tables, so the unqualified column is ambiguous",
            "The tables must be given aliases before they can be joined",
            "`ON` must compare columns with the same name",
          ],
          answer: 1,
          explanation: "MySQL reports *Column 'id' in field list is ambiguous*. Qualify it (`orders.id`). `INNER` is optional, aliases are a convenience rather than a requirement for two different tables, and `ON` can compare any columns.",
        },
        {
          prompt: "Which statement about a one-to-many join between `customers` and `orders` is true?",
          options: [
            "Each customer appears once, with their orders combined",
            "A customer appears once per matching order",
            "MySQL removes duplicate customer rows automatically",
            "Only the first matching order is joined",
          ],
          answer: 1,
          explanation: "A join outputs one row per matching pair, so a customer with three orders appears three times. Nothing is combined or de-duplicated unless you `GROUP BY` or use `DISTINCT`.",
        },
        {
          prompt: "Why is `NATURAL JOIN` usually avoided?",
          options: [
            "MySQL does not support it",
            "It joins on every column name the two tables share, so an unrelated shared column (like `id` or `created_at`) silently becomes part of the condition",
            "It is a cross join",
            "It only works with primary keys",
          ],
          answer: 1,
          explanation: "MySQL supports it, but the condition is implicit: tables that both have `id` join on `a.id = b.id`, which is meaningless for a foreign-key relationship, and adding a column later can change the result with no error. `JOIN … ON` states the condition.",
        },
      ],
    },
    {
      slug: "left-and-right-joins",
      file: "02-left-and-right-joins.md",
      exercises: [
        {
          title: "Every customer's orders and spend",
          prompt: `List **every** customer with the number of orders they placed and the total they spent. Customers with no orders show \`0\` and \`0\`. An order whose \`amount\` is NULL still counts as an order but adds nothing to the total.

**Tables:** \`customers(id, name, city)\` and \`orders(id, customer_id, order_date, amount)\`.

| customers.id | name | city |
| --- | --- | --- |
| 1 | Asha | Pune |
| 2 | Ben | Delhi |
| 3 | Chen | Pune |

| orders.id | customer_id | order_date | amount |
| --- | --- | --- | --- |
| 10 | 1 | 2024-01-05 | 250 |
| 11 | 1 | 2024-02-11 | 100 |
| 12 | 2 | 2024-02-20 | 400 |
| 13 | 9 | 2024-03-01 | 75 |

**Output:** columns \`customer\`, \`orders\`, \`spent\`, ordered by \`spent\` descending, then \`customer\` ascending.

\`\`\`text
customer | orders | spent
Ben | 1 | 400
Asha | 2 | 350
Chen | 0 | 0
\`\`\``,
          starter: String.raw`-- Every customer, with how many orders they placed and how much they spent (0 and 0 for none).
-- Columns: customer, orders, spent — ordered by spent DESC, customer.
`,
          solution: String.raw`SELECT c.name AS customer, COUNT(o.id) AS orders, COALESCE(SUM(o.amount), 0) AS spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY spent DESC, customer;
`,
          hints: [
            "Start from `customers` and `LEFT JOIN orders`, so customers without orders are kept.",
            "`COUNT(*)` would give Chen 1; count a column of the orders table, such as `o.id`. Counting `o.amount` would miss an order whose amount is NULL.",
            "`SUM` over only NULLs is NULL — wrap it in `COALESCE(…, 0)`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Asha', 'Pune'), (2, 'Ben', 'Delhi'), (3, 'Chen', 'Pune');
INSERT INTO orders VALUES (10, 1, '2024-01-05', 250), (11, 1, '2024-02-11', 100), (12, 2, '2024-02-20', 400), (13, 9, '2024-03-01', 75);
`,
              expected: "customer | orders | spent\nBen | 1 | 400\nAsha | 2 | 350\nChen | 0 | 0\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Zed', 'Pune'), (2, 'Amy', 'Delhi');
`,
              expected: "customer | orders | spent\nAmy | 0 | 0\nZed | 0 | 0\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Ravi', 'Goa'), (2, 'Sam', 'Goa');
INSERT INTO orders VALUES (1, 1, '2024-01-01', NULL), (2, 2, '2024-01-02', 20), (3, 2, '2024-01-03', NULL);
`,
              expected: "customer | orders | spent\nSam | 2 | 20\nRavi | 1 | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "This term's enrolments for every student",
          prompt: `List **every** student with the number of courses they are enrolled in for the term \`'2024-S1'\`. Students with no enrolment in that term show \`0\`. Two students can share a name; they are different students.

**Tables:** \`students(id, name)\` and \`enrollments(student_id, course_id, term)\`.

| students.id | name |
| --- | --- |
| 1 | Anu |
| 2 | Bilal |
| 3 | Chitra |

| student_id | course_id | term |
| --- | --- | --- |
| 1 | 101 | 2024-S1 |
| 1 | 102 | 2024-S1 |
| 2 | 101 | 2023-S2 |
| 3 | 103 | 2024-S1 |
| 1 | 103 | 2023-S2 |

**Output:** columns \`student\`, \`courses\`, ordered by \`student\`, then \`courses\`.

\`\`\`text
student | courses
Anu | 2
Bilal | 0
Chitra | 1
\`\`\``,
          starter: String.raw`-- Every student with their number of courses in term '2024-S1' (0 if none).
-- Columns: student, courses — ordered by student, courses.
`,
          solution: String.raw`SELECT s.name AS student, COUNT(e.course_id) AS courses
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id AND e.term = '2024-S1'
GROUP BY s.id, s.name
ORDER BY student, courses;
`,
          hints: [
            "A `WHERE e.term = '2024-S1'` removes Bilal's NULL-filled row and turns the left join into an inner join.",
            "Put the term condition in the `ON` clause: it decides which enrolments count as a match.",
            "Group by the student's id as well as the name, so two students called the same are not merged.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course_id INT, term VARCHAR(10));
INSERT INTO students VALUES (1, 'Anu'), (2, 'Bilal'), (3, 'Chitra');
INSERT INTO enrollments VALUES (1, 101, '2024-S1'), (1, 102, '2024-S1'), (2, 101, '2023-S2'), (3, 103, '2024-S1'), (1, 103, '2023-S2');
`,
              expected: "student | courses\nAnu | 2\nBilal | 0\nChitra | 1\n",
            },
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course_id INT, term VARCHAR(10));
INSERT INTO students VALUES (1, 'Xia'), (2, 'Yash');
INSERT INTO enrollments VALUES (1, 1, '2023-S1');
`,
              expected: "student | courses\nXia | 0\nYash | 0\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course_id INT, term VARCHAR(10));
INSERT INTO students VALUES (1, 'Kai'), (2, 'Kai'), (3, 'Lin');
INSERT INTO enrollments VALUES (1, 1, '2024-S1'), (2, 1, '2024-S1'), (2, 2, '2024-S1'), (3, 5, '2024-S2');
`,
              expected: "student | courses\nKai | 1\nKai | 2\nLin | 0\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "This query should list every customer with their count of paid orders, including customers with none. What does it actually return?\n\n```sql\nSELECT c.name, COUNT(o.id) AS paid\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.status = 'paid'\nGROUP BY c.id, c.name;\n```",
          options: [
            "Every customer, with 0 for those without paid orders",
            "Only customers with at least one paid order",
            "An error: `WHERE` cannot refer to the right table of a left join",
            "Every customer, but with NULL instead of 0",
          ],
          answer: 1,
          explanation: "For a customer with no orders, the left join produces a row whose `o.status` is NULL; `NULL = 'paid'` is unknown, so `WHERE` drops it — and a customer whose orders are all unpaid is dropped the same way. The outer join has become an inner join. Moving `o.status = 'paid'` into the `ON` clause fixes it. It is not an error: `WHERE` may refer to any table.",
        },
        {
          prompt: "After `customers c LEFT JOIN orders o ON o.customer_id = c.id … GROUP BY c.id`, what does `COUNT(*)` report for a customer with no orders?",
          options: ["0", "1", "NULL", "The query fails"],
          answer: 1,
          explanation: "The left join still produces one row for that customer (with NULL order columns), and `COUNT(*)` counts rows. `COUNT(o.id)` skips NULLs and gives the correct 0.",
        },
        {
          prompt: "Which query returns the same rows as `SELECT … FROM a RIGHT JOIN b ON b.a_id = a.id`?",
          options: [
            "`SELECT … FROM a LEFT JOIN b ON b.a_id = a.id`",
            "`SELECT … FROM b LEFT JOIN a ON b.a_id = a.id`",
            "`SELECT … FROM a JOIN b ON b.a_id = a.id`",
            "`SELECT … FROM b RIGHT JOIN a ON b.a_id = a.id`",
          ],
          answer: 1,
          explanation: "A right join keeps every row of the table on its right, `b`. Swapping the tables and using `LEFT JOIN` keeps every row of `b` too. The first option keeps every `a` instead, the inner join keeps neither side's unmatched rows, and the last keeps every `a`.",
        },
        {
          prompt: "You want only Pune customers, each with their orders (NULLs if none). Where does `c.city = 'Pune'` go?",
          options: [
            "In `WHERE`, because it filters the preserved (left) table",
            "In `ON`, because every condition of a left join belongs there",
            "Either; the result is the same",
            "In `HAVING`",
          ],
          answer: 0,
          explanation: "A condition on the left table decides which left rows appear at all, so it goes in `WHERE`. In `ON` it would only stop non-Pune customers from *matching* — they would still all appear, with NULL orders. Only for inner joins are `ON` and `WHERE` interchangeable.",
        },
      ],
    },
    {
      slug: "full-and-cross-joins",
      file: "03-full-and-cross-joins.md",
      exercises: [
        {
          title: "Reconcile two ledgers",
          prompt: `The bank's list of payments and the accounts team's list should match, but do not. Show every reference that appears in **either** list, with the amount on each side (NULL where a side has no record). Write it the MySQL way: MySQL has no \`FULL OUTER JOIN\`.

**Tables:** \`bank(ref, amount)\` and \`books(ref, amount)\`; \`ref\` is the primary key of each.

| bank.ref | amount |
| --- | --- |
| P1 | 100 |
| P2 | 250 |
| P4 | 80 |

| books.ref | amount |
| --- | --- |
| P1 | 100 |
| P2 | 205 |
| P3 | 60 |

**Output:** columns \`ref\`, \`bank_amount\`, \`books_amount\`, ordered by \`ref\`.

\`\`\`text
ref | bank_amount | books_amount
P1 | 100 | 100
P2 | 250 | 205
P3 | NULL | 60
P4 | 80 | NULL
\`\`\``,
          starter: String.raw`-- Every ref from either table, with both amounts (NULL where missing).
-- MySQL has no FULL OUTER JOIN: combine a LEFT JOIN with the other side's unmatched rows.
-- Columns: ref, bank_amount, books_amount — ordered by ref.
`,
          solution: String.raw`SELECT b.ref AS ref, b.amount AS bank_amount, k.amount AS books_amount
FROM bank b
LEFT JOIN books k ON k.ref = b.ref
UNION ALL
SELECT k.ref, NULL, k.amount
FROM books k
LEFT JOIN bank b ON b.ref = k.ref
WHERE b.ref IS NULL
ORDER BY ref;
`,
          hints: [
            "`bank LEFT JOIN books` gives every bank row with its books amount, or NULL.",
            "What is still missing is the books rows that matched no bank row: `books LEFT JOIN bank … WHERE b.ref IS NULL`.",
            "Join the two with `UNION ALL` (same number of columns; names come from the first SELECT) and put one `ORDER BY ref` at the end.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE bank (ref VARCHAR(10) PRIMARY KEY, amount INT);
CREATE TABLE books (ref VARCHAR(10) PRIMARY KEY, amount INT);
INSERT INTO bank VALUES ('P1', 100), ('P2', 250), ('P4', 80);
INSERT INTO books VALUES ('P1', 100), ('P2', 205), ('P3', 60);
`,
              expected: "ref | bank_amount | books_amount\nP1 | 100 | 100\nP2 | 250 | 205\nP3 | NULL | 60\nP4 | 80 | NULL\n",
            },
            {
              stdin: String.raw`CREATE TABLE bank (ref VARCHAR(10) PRIMARY KEY, amount INT);
CREATE TABLE books (ref VARCHAR(10) PRIMARY KEY, amount INT);
INSERT INTO books VALUES ('R1', 5), ('R2', 6);
`,
              expected: "ref | bank_amount | books_amount\nR1 | NULL | 5\nR2 | NULL | 6\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE bank (ref VARCHAR(10) PRIMARY KEY, amount INT);
CREATE TABLE books (ref VARCHAR(10) PRIMARY KEY, amount INT);
INSERT INTO bank VALUES ('A', 1), ('B', 2);
`,
              expected: "ref | bank_amount | books_amount\nA | 1 | NULL\nB | 2 | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE bank (ref VARCHAR(10) PRIMARY KEY, amount INT);
CREATE TABLE books (ref VARCHAR(10) PRIMARY KEY, amount INT);
INSERT INTO bank VALUES ('X1', 50), ('X2', 50);
INSERT INTO books VALUES ('X1', 50), ('X3', 50);
`,
              expected: "ref | bank_amount | books_amount\nX1 | 50 | 50\nX2 | 50 | NULL\nX3 | NULL | 50\n",
              hidden: true,
            },
          ],
        },
        {
          title: "A sales grid with zeros",
          prompt: `Report total sales for **every** combination of region and month listed in the \`regions\` and \`months\` tables — including combinations with no sales, which show \`0\`. Sales for a region or month that is not listed are ignored, and a NULL amount adds nothing.

**Tables:** \`regions(name)\`, \`months(month)\` and \`sales(id, region, month, amount)\`.

| regions.name |
| --- |
| North |
| South |

| months.month |
| --- |
| 2024-01 |
| 2024-02 |
| 2024-03 |

| sales.id | region | month | amount |
| --- | --- | --- | --- |
| 1 | North | 2024-01 | 100 |
| 2 | North | 2024-01 | 50 |
| 3 | North | 2024-03 | 70 |
| 4 | South | 2024-02 | 30 |
| 5 | East | 2024-01 | 999 |

**Output:** columns \`region\`, \`month\`, \`total\`, ordered by \`region\`, then \`month\`.

\`\`\`text
region | month | total
North | 2024-01 | 150
North | 2024-02 | 0
North | 2024-03 | 70
South | 2024-01 | 0
South | 2024-02 | 30
South | 2024-03 | 0
\`\`\``,
          starter: String.raw`-- Every (region, month) pair with its total sales, 0 where there were none.
-- Columns: region, month, total — ordered by region, month.
`,
          solution: String.raw`SELECT r.name AS region, m.month, COALESCE(SUM(s.amount), 0) AS total
FROM regions r
CROSS JOIN months m
LEFT JOIN sales s ON s.region = r.name AND s.month = m.month
GROUP BY r.name, m.month
ORDER BY region, m.month;
`,
          hints: [
            "`regions CROSS JOIN months` builds every cell of the grid, whether or not anything was sold.",
            "Attach the sales with a `LEFT JOIN` whose `ON` matches both the region and the month.",
            "Group by region and month; `COALESCE(SUM(s.amount), 0)` turns the empty cells into 0.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE regions (name VARCHAR(20));
CREATE TABLE months (month VARCHAR(7));
CREATE TABLE sales (id INT PRIMARY KEY, region VARCHAR(20), month VARCHAR(7), amount INT);
INSERT INTO regions VALUES ('North'), ('South');
INSERT INTO months VALUES ('2024-01'), ('2024-02'), ('2024-03');
INSERT INTO sales VALUES (1, 'North', '2024-01', 100), (2, 'North', '2024-01', 50), (3, 'North', '2024-03', 70), (4, 'South', '2024-02', 30), (5, 'East', '2024-01', 999);
`,
              expected: "region | month | total\nNorth | 2024-01 | 150\nNorth | 2024-02 | 0\nNorth | 2024-03 | 70\nSouth | 2024-01 | 0\nSouth | 2024-02 | 30\nSouth | 2024-03 | 0\n",
            },
            {
              stdin: String.raw`CREATE TABLE regions (name VARCHAR(20));
CREATE TABLE months (month VARCHAR(7));
CREATE TABLE sales (id INT PRIMARY KEY, region VARCHAR(20), month VARCHAR(7), amount INT);
INSERT INTO regions VALUES ('West');
INSERT INTO months VALUES ('2024-06'), ('2024-05');
`,
              expected: "region | month | total\nWest | 2024-05 | 0\nWest | 2024-06 | 0\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE regions (name VARCHAR(20));
CREATE TABLE months (month VARCHAR(7));
CREATE TABLE sales (id INT PRIMARY KEY, region VARCHAR(20), month VARCHAR(7), amount INT);
INSERT INTO regions VALUES ('B'), ('A');
INSERT INTO months VALUES ('2025-01');
INSERT INTO sales VALUES (1, 'A', '2025-01', NULL), (2, 'A', '2025-01', 5), (3, 'B', '2025-02', 9);
`,
              expected: "region | month | total\nA | 2025-01 | 5\nB | 2025-01 | 0\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE regions (name VARCHAR(20));
CREATE TABLE months (month VARCHAR(7));
CREATE TABLE sales (id INT PRIMARY KEY, region VARCHAR(20), month VARCHAR(7), amount INT);
INSERT INTO months VALUES ('2025-01');
INSERT INTO sales VALUES (1, 'A', '2025-01', 5);
`,
              expected: "region | month | total\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens when you run `SELECT * FROM a FULL OUTER JOIN b ON b.id = a.id;` on MySQL 8?",
          options: [
            "It returns matched rows plus the unmatched rows of both tables",
            "A syntax error — MySQL does not support FULL OUTER JOIN",
            "It runs as a LEFT JOIN",
            "It runs as a CROSS JOIN",
          ],
          answer: 1,
          explanation: "MySQL has no full outer join. Note the nastier variant: `a FULL JOIN b ON …` (without `OUTER`) is accepted, because `FULL` is read as an alias for `a` — it silently runs as an inner join. PostgreSQL, SQL Server and Oracle support `FULL OUTER JOIN` directly.",
        },
        {
          prompt: "Why is `… LEFT JOIN … UNION ALL … RIGHT JOIN … WHERE left_key IS NULL` preferred over `… LEFT JOIN … UNION … RIGHT JOIN …` for emulating a full outer join?",
          options: [
            "`UNION` is not supported in MySQL",
            "`UNION` removes duplicate rows, so two genuinely identical result rows would be collapsed into one",
            "`UNION ALL` sorts the result",
            "There is no difference",
          ],
          answer: 1,
          explanation: "The `UNION` version relies on duplicate removal to merge the matched rows that both halves return — and it also merges real rows that happen to be identical. Restricting the second half to unmatched rows and using `UNION ALL` is exact, and skips the de-duplication work.",
        },
        {
          prompt: "`colours` has 4 rows and `sizes` has 5. How many rows does `colours CROSS JOIN sizes` return?",
          options: ["9", "20", "5", "4"],
          answer: 1,
          explanation: "A cross join pairs every row with every row: 4 × 5 = 20. If either table were empty, the result would be empty.",
        },
        {
          prompt: "In MySQL, what does `SELECT * FROM orders JOIN customers;` (no `ON`) return?",
          options: [
            "An error: `JOIN` requires `ON`",
            "Every order paired with every customer — a Cartesian product",
            "Orders joined on columns with the same name",
            "Only the orders that have a customer",
          ],
          answer: 1,
          explanation: "In MySQL `JOIN`, `INNER JOIN` and `CROSS JOIN` are synonyms, and without a condition the result is the Cartesian product. PostgreSQL rejects a `JOIN` without `ON`; joining on shared column names is `NATURAL JOIN`.",
        },
      ],
    },
    {
      slug: "self-joins",
      file: "04-self-joins.md",
      exercises: [
        {
          title: "Out-earning the manager",
          prompt: `Find the employees who earn strictly more than their own manager.

**Table:** \`employees(id, name, salary, manager_id)\`; \`manager_id\` is the \`id\` of the employee's manager, NULL for the top.

| id | name | salary | manager_id |
| --- | --- | --- | --- |
| 1 | Meera | 150000 | NULL |
| 2 | Arjun | 90000 | 1 |
| 3 | Kiran | 110000 | 2 |
| 4 | Leela | 70000 | 2 |
| 5 | Omar | 160000 | 1 |

**Output:** columns \`employee\`, \`salary\`, \`manager\`, \`manager_salary\`, ordered by \`employee\`.

\`\`\`text
employee | salary | manager | manager_salary
Kiran | 110000 | Arjun | 90000
Omar | 160000 | Meera | 150000
\`\`\``,
          starter: String.raw`-- Employees who earn more than their manager.
-- Columns: employee, salary, manager, manager_salary — ordered by employee.
`,
          solution: String.raw`SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary
ORDER BY employee;
`,
          hints: [
            "Use the table twice: `employees e` for the employee and `employees m` for the manager.",
            "The manager row is the one whose `id` equals the employee's `manager_id`: `ON m.id = e.manager_id`.",
            "Then compare `e.salary > m.salary` in `WHERE` — strictly greater, so equal salaries do not count.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT, manager_id INT);
INSERT INTO employees VALUES (1, 'Meera', 150000, NULL), (2, 'Arjun', 90000, 1), (3, 'Kiran', 110000, 2), (4, 'Leela', 70000, 2), (5, 'Omar', 160000, 1);
`,
              expected: "employee | salary | manager | manager_salary\nKiran | 110000 | Arjun | 90000\nOmar | 160000 | Meera | 150000\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT, manager_id INT);
INSERT INTO employees VALUES (1, 'Asha', 100, NULL), (2, 'Bo', 100, 1), (3, 'Cal', 120, 1), (4, 'Dee', 500, 99);
`,
              expected: "employee | salary | manager | manager_salary\nCal | 120 | Asha | 100\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT, manager_id INT);
INSERT INTO employees VALUES (1, 'Solo', 10, NULL);
`,
              expected: "employee | salary | manager | manager_salary\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Warmer than the day before",
          prompt: `Find the days that were warmer than the **calendar** day before. A day whose previous date has no reading is not compared. The rows may be stored in any order.

**Table:** \`weather(recorded_on, temp)\`; one row per date, \`recorded_on\` is a \`DATE\`.

| recorded_on | temp |
| --- | --- |
| 2024-01-01 | 10 |
| 2024-01-02 | 12 |
| 2024-01-03 | 11 |
| 2024-01-04 | 15 |
| 2024-01-06 | 20 |
| 2024-01-07 | 25 |

**Output:** columns \`recorded_on\`, \`temp\`, \`previous_temp\`, ordered by \`recorded_on\`.

\`\`\`text
recorded_on | temp | previous_temp
2024-01-02 | 12 | 10
2024-01-04 | 15 | 11
2024-01-07 | 25 | 20
\`\`\``,
          starter: String.raw`-- Days warmer than the calendar day before.
-- Columns: recorded_on, temp, previous_temp — ordered by recorded_on.
`,
          solution: String.raw`SELECT w.recorded_on, w.temp, p.temp AS previous_temp
FROM weather w
JOIN weather p ON w.recorded_on = DATE_ADD(p.recorded_on, INTERVAL 1 DAY)
WHERE w.temp > p.temp
ORDER BY w.recorded_on;
`,
          hints: [
            "Join `weather` to itself: `w` is the day, `p` is the previous day.",
            "The partner is dated exactly one day earlier: `ON w.recorded_on = DATE_ADD(p.recorded_on, INTERVAL 1 DAY)`. 2024-01-06 has no partner because 2024-01-05 is missing.",
            "Do not subtract 1 from a date in MySQL — that is number arithmetic on 20240101, not calendar arithmetic.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE weather (recorded_on DATE PRIMARY KEY, temp INT);
INSERT INTO weather VALUES ('2024-01-01', 10), ('2024-01-02', 12), ('2024-01-03', 11), ('2024-01-04', 15), ('2024-01-06', 20), ('2024-01-07', 25);
`,
              expected: "recorded_on | temp | previous_temp\n2024-01-02 | 12 | 10\n2024-01-04 | 15 | 11\n2024-01-07 | 25 | 20\n",
            },
            {
              stdin: String.raw`CREATE TABLE weather (recorded_on DATE PRIMARY KEY, temp INT);
INSERT INTO weather VALUES ('2024-02-29', 5), ('2024-03-01', 6), ('2024-02-28', 7), ('2023-12-31', 1), ('2024-01-01', 3);
`,
              expected: "recorded_on | temp | previous_temp\n2024-01-01 | 3 | 1\n2024-03-01 | 6 | 5\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE weather (recorded_on DATE PRIMARY KEY, temp INT);
INSERT INTO weather VALUES ('2024-05-01', 30);
`,
              expected: "recorded_on | temp | previous_temp\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In `FROM employees e JOIN employees m ON … `, `e` is the employee and `m` the manager. Which `ON` condition is right?",
          options: ["`e.id = m.manager_id`", "`m.id = e.manager_id`", "`e.id = m.id`", "`e.manager_id = m.manager_id`"],
          answer: 1,
          explanation: "The manager's row is the one whose `id` is the employee's `manager_id`. `e.id = m.manager_id` swaps the roles (each row in `e` would be a manager of `m`), `e.id = m.id` pairs each row with itself, and the last pairs colleagues who share a manager.",
        },
        {
          prompt: "`customers` has three customers in Pune. How many rows does this return for Pune?\n\n```sql\nSELECT a.name, b.name\nFROM customers a\nJOIN customers b ON b.city = a.city AND a.id <> b.id;\n```",
          options: ["3", "6", "9", "1"],
          answer: 1,
          explanation: "`<>` removes the self-pairs but keeps both orderings, so each of the 3 pairs appears twice: 6 rows. Without the condition it would be 9 (every row with every row, including itself); with `a.id < b.id` it would be 3.",
        },
        {
          prompt: "Why does `FROM employees JOIN employees ON …` fail?",
          options: [
            "A table cannot be joined to itself",
            "Both occurrences have the same name, so at least one needs an alias — MySQL reports \"Not unique table/alias\"",
            "Self joins require `LEFT JOIN`",
            "Self joins need `USING`",
          ],
          answer: 1,
          explanation: "A self join is a normal join; it only needs distinct names for the two copies, and every column must then be qualified with the alias it belongs to.",
        },
      ],
    },
    {
      slug: "joining-many-tables",
      file: "05-joining-many-tables.md",
      exercises: [
        {
          title: "Student timetable",
          prompt: `List each enrolment as the student's name, the course title and the teacher's name. A course with no teacher (NULL \`teacher_id\`, or one that matches no teacher) still appears, with a NULL teacher. Enrolments in courses that do not exist are not listed, and students with no enrolments are not listed.

**Tables:** \`students(id, name)\`, \`teachers(id, name)\`, \`courses(id, title, teacher_id)\`, \`enrollments(student_id, course_id)\`.

| students.id | name |
| --- | --- |
| 1 | Anu |
| 2 | Bilal |
| 3 | Chitra |

| teachers.id | name |
| --- | --- |
| 1 | Dr Rao |
| 2 | Ms Iyer |

| courses.id | title | teacher_id |
| --- | --- | --- |
| 101 | Databases | 1 |
| 102 | Networks | 2 |
| 103 | Statistics | NULL |

| student_id | course_id |
| --- | --- |
| 1 | 101 |
| 1 | 103 |
| 2 | 102 |
| 2 | 101 |

**Output:** columns \`student\`, \`course\`, \`teacher\`, ordered by \`student\`, then \`course\`.

\`\`\`text
student | course | teacher
Anu | Databases | Dr Rao
Anu | Statistics | NULL
Bilal | Databases | Dr Rao
Bilal | Networks | Ms Iyer
\`\`\``,
          starter: String.raw`-- student -> enrollments -> courses -> teachers; a course without a teacher still appears.
-- Columns: student, course, teacher — ordered by student, course.
`,
          solution: String.raw`SELECT s.name AS student, c.title AS course, t.name AS teacher
FROM students s
JOIN enrollments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id
LEFT JOIN teachers t ON t.id = c.teacher_id
ORDER BY student, course;
`,
          hints: [
            "Chain the joins one table at a time: students → enrollments → courses → teachers, each with its own `ON`.",
            "An inner join to `teachers` drops Statistics, whose `teacher_id` is NULL.",
            "Only the last join needs to be a `LEFT JOIN`; the others should drop unenrolled students and unknown courses.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE teachers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE courses (id INT PRIMARY KEY, title VARCHAR(40), teacher_id INT);
CREATE TABLE enrollments (student_id INT, course_id INT);
INSERT INTO students VALUES (1, 'Anu'), (2, 'Bilal'), (3, 'Chitra');
INSERT INTO teachers VALUES (1, 'Dr Rao'), (2, 'Ms Iyer');
INSERT INTO courses VALUES (101, 'Databases', 1), (102, 'Networks', 2), (103, 'Statistics', NULL);
INSERT INTO enrollments VALUES (1, 101), (1, 103), (2, 102), (2, 101);
`,
              expected: "student | course | teacher\nAnu | Databases | Dr Rao\nAnu | Statistics | NULL\nBilal | Databases | Dr Rao\nBilal | Networks | Ms Iyer\n",
            },
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE teachers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE courses (id INT PRIMARY KEY, title VARCHAR(40), teacher_id INT);
CREATE TABLE enrollments (student_id INT, course_id INT);
INSERT INTO students VALUES (1, 'Zoya');
INSERT INTO teachers VALUES (1, 'Mr Das');
INSERT INTO courses VALUES (1, 'Algebra', 1), (2, 'Biology', 7);
INSERT INTO enrollments VALUES (1, 1), (1, 2), (1, 9);
`,
              expected: "student | course | teacher\nZoya | Algebra | Mr Das\nZoya | Biology | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE teachers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE courses (id INT PRIMARY KEY, title VARCHAR(40), teacher_id INT);
CREATE TABLE enrollments (student_id INT, course_id INT);
INSERT INTO students VALUES (1, 'Omi');
INSERT INTO teachers VALUES (1, 'Mr Das');
INSERT INTO courses VALUES (1, 'Algebra', 1);
`,
              expected: "student | course | teacher\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Revenue by category in 2024",
          prompt: `For orders placed in 2024, report the units sold and the revenue (\`qty × price\`) per product category. Categories with no 2024 sales are not listed.

**Tables:** \`orders(id, order_date)\`, \`order_items(order_id, product_id, qty)\`, \`products(id, name, category_id, price)\`, \`categories(id, name)\`.

| categories.id | name |
| --- | --- |
| 1 | Books |
| 2 | Games |
| 3 | Music |

| products.id | name | category_id | price |
| --- | --- | --- | --- |
| 1 | SQL Guide | 1 | 500 |
| 2 | Chess | 2 | 300 |
| 3 | Novel | 1 | 200 |
| 4 | Vinyl | 3 | 800 |

| orders.id | order_date |
| --- | --- |
| 1 | 2024-01-10 |
| 2 | 2024-03-05 |
| 3 | 2023-12-31 |
| 4 | 2024-12-31 |

| order_id | product_id | qty |
| --- | --- | --- |
| 1 | 1 | 2 |
| 1 | 2 | 1 |
| 2 | 3 | 3 |
| 3 | 4 | 5 |
| 4 | 2 | 2 |

**Output:** columns \`category\`, \`units\`, \`revenue\`, ordered by \`revenue\` descending, then \`category\`.

\`\`\`text
category | units | revenue
Books | 5 | 1600
Games | 3 | 900
\`\`\``,
          starter: String.raw`-- orders -> order_items -> products -> categories, 2024 orders only.
-- Columns: category, units, revenue — ordered by revenue DESC, category.
`,
          solution: String.raw`SELECT cat.name AS category, SUM(i.qty) AS units, SUM(i.qty * p.price) AS revenue
FROM orders o
JOIN order_items i ON i.order_id = o.id
JOIN products p ON p.id = i.product_id
JOIN categories cat ON cat.id = p.category_id
WHERE o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'
GROUP BY cat.id, cat.name
ORDER BY revenue DESC, category;
`,
          hints: [
            "Four tables, three joins: each `JOIN` links the new table to one already in the query.",
            "Filter the year on the orders table, as a range: `order_date >= '2024-01-01' AND order_date < '2025-01-01'`.",
            "Group by category; `SUM(i.qty)` is units and `SUM(i.qty * p.price)` is revenue.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE categories (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category_id INT, price INT);
CREATE TABLE orders (id INT PRIMARY KEY, order_date DATE);
CREATE TABLE order_items (order_id INT, product_id INT, qty INT);
INSERT INTO categories VALUES (1, 'Books'), (2, 'Games'), (3, 'Music');
INSERT INTO products VALUES (1, 'SQL Guide', 1, 500), (2, 'Chess', 2, 300), (3, 'Novel', 1, 200), (4, 'Vinyl', 3, 800);
INSERT INTO orders VALUES (1, '2024-01-10'), (2, '2024-03-05'), (3, '2023-12-31'), (4, '2024-12-31');
INSERT INTO order_items VALUES (1, 1, 2), (1, 2, 1), (2, 3, 3), (3, 4, 5), (4, 2, 2);
`,
              expected: "category | units | revenue\nBooks | 5 | 1600\nGames | 3 | 900\n",
            },
            {
              stdin: String.raw`CREATE TABLE categories (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category_id INT, price INT);
CREATE TABLE orders (id INT PRIMARY KEY, order_date DATE);
CREATE TABLE order_items (order_id INT, product_id INT, qty INT);
INSERT INTO categories VALUES (1, 'Toys'), (2, 'Art');
INSERT INTO products VALUES (1, 'Kite', 1, 10), (2, 'Brush', 2, 5);
INSERT INTO orders VALUES (1, '2024-06-01'), (2, '2025-01-01');
INSERT INTO order_items VALUES (1, 1, 1), (1, 2, 2), (2, 1, 9);
`,
              expected: "category | units | revenue\nArt | 2 | 10\nToys | 1 | 10\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE categories (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category_id INT, price INT);
CREATE TABLE orders (id INT PRIMARY KEY, order_date DATE);
CREATE TABLE order_items (order_id INT, product_id INT, qty INT);
INSERT INTO categories VALUES (1, 'Books');
INSERT INTO products VALUES (1, 'Atlas', 1, 40);
INSERT INTO orders VALUES (1, '2022-01-01');
INSERT INTO order_items VALUES (1, 1, 1);
`,
              expected: "category | units | revenue\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this return for a student who has no enrolments?\n\n```sql\nSELECT s.name, c.title\nFROM students s\nLEFT JOIN enrollments e ON e.student_id = s.id\nJOIN courses c ON c.id = e.course_id;\n```",
          options: [
            "One row with a NULL title",
            "No row — the inner join on `e.course_id`, which is NULL for that student, removes it",
            "An error",
            "One row per course",
          ],
          answer: 1,
          explanation: "The left join keeps the student with NULL enrolment columns, but `c.id = NULL` is unknown, so the following inner join drops the row. Everything joined through an optional table must be left-joined too.",
        },
        {
          prompt: "Customer Asha has 3 orders totalling 300 and 2 payments totalling 250. What does this report for her?\n\n```sql\nSELECT SUM(o.amount) AS ordered, SUM(p.amount) AS paid\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN payments p ON p.customer_id = c.id\nWHERE c.name = 'Asha';\n```",
          options: ["300 and 250", "600 and 750", "900 and 500", "300 and 750"],
          answer: 1,
          explanation: "Orders and payments are independent children, so the joins produce 3 × 2 = 6 rows: each order is repeated twice (600) and each payment three times (750). Aggregate each child separately before joining.",
        },
        {
          prompt: "Students and courses are many-to-many. How is that stored and queried?",
          options: [
            "A `course_ids` column in `students` holding a list",
            "A junction table such as `enrollments(student_id, course_id)`, joined from students and then to courses",
            "A `student_id` column in `courses`",
            "A cross join of students and courses",
          ],
          answer: 1,
          explanation: "A relational column holds one value, so the pairs live in their own table with one foreign key to each side. A `student_id` in `courses` would allow only one student per course; a cross join pairs everyone with everything.",
        },
        {
          prompt: "Does rearranging the order of three inner joins change the result?",
          options: [
            "Yes, the first table always determines the rows",
            "No; inner joins can be reordered freely, and the optimizer chooses its own order",
            "Only if the tables have different sizes",
            "Only in MySQL",
          ],
          answer: 1,
          explanation: "Inner joins are associative and commutative, so the same rows come back (in an unspecified order unless there is an `ORDER BY`). Outer joins are different: their order decides which rows are preserved.",
        },
      ],
    },
    {
      slug: "semi-and-anti-joins",
      file: "06-semi-and-anti-joins.md",
      exercises: [
        {
          title: "Customers with a big order",
          prompt: `List the customers who placed **at least one** order of 300 or more. Each customer appears once, however many big orders they placed.

**Tables:** \`customers(id, name)\` and \`orders(id, customer_id, amount)\`.

| customers.id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ben |
| 3 | Chen |
| 4 | Dina |

| orders.id | customer_id | amount |
| --- | --- | --- |
| 10 | 1 | 250 |
| 11 | 1 | 300 |
| 12 | 1 | 500 |
| 13 | 2 | 120 |
| 14 | 4 | 300 |
| 15 | 9 | 900 |

**Output:** columns \`id\`, \`name\`, ordered by \`id\`.

\`\`\`text
id | name
1 | Asha
4 | Dina
\`\`\``,
          starter: String.raw`-- Customers with at least one order of 300 or more, each once.
-- Columns: id, name — ordered by id.
`,
          solution: String.raw`SELECT c.id, c.name
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.amount >= 300
)
ORDER BY c.id;
`,
          hints: [
            "A plain join returns Asha twice, once per big order.",
            "`WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND …)` keeps each customer once.",
            "The amount condition goes inside the subquery: it is part of what counts as a match.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen'), (4, 'Dina');
INSERT INTO orders VALUES (10, 1, 250), (11, 1, 300), (12, 1, 500), (13, 2, 120), (14, 4, 300), (15, 9, 900);
`,
              expected: "id | name\n1 | Asha\n4 | Dina\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Xavi');
INSERT INTO orders VALUES (1, 1, 299);
`,
              expected: "id | name\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Sam'), (2, 'Sam'), (3, 'Tia');
INSERT INTO orders VALUES (1, 2, 1000), (2, 2, 400), (3, 3, 301), (4, NULL, 999);
`,
              expected: "id | name\n2 | Sam\n3 | Tia\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Products never sold",
          prompt: `List the products that appear in **no** order item. Beware: some order items have a NULL \`product_id\` (a deleted product).

**Tables:** \`products(id, name)\` and \`order_items(order_id, product_id, qty)\`.

| products.id | name |
| --- | --- |
| 1 | Pen |
| 2 | Ink |
| 3 | Paper |
| 4 | Stapler |

| order_id | product_id | qty |
| --- | --- | --- |
| 1 | 1 | 2 |
| 1 | 3 | 1 |
| 2 | 1 | 5 |

**Output:** columns \`id\`, \`name\`, ordered by \`id\`.

\`\`\`text
id | name
2 | Ink
4 | Stapler
\`\`\``,
          starter: String.raw`-- Products with no order item at all (watch out for NULL product_id values).
-- Columns: id, name — ordered by id.
`,
          solution: String.raw`SELECT p.id, p.name
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM order_items i WHERE i.product_id = p.id
)
ORDER BY p.id;
`,
          hints: [
            "This is an anti join: `NOT EXISTS (SELECT 1 FROM order_items i WHERE i.product_id = p.id)`.",
            "`LEFT JOIN order_items i ON i.product_id = p.id WHERE i.product_id IS NULL` works too.",
            "`p.id NOT IN (SELECT product_id FROM order_items)` returns nothing once a NULL `product_id` exists.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE order_items (order_id INT, product_id INT, qty INT);
INSERT INTO products VALUES (1, 'Pen'), (2, 'Ink'), (3, 'Paper'), (4, 'Stapler');
INSERT INTO order_items VALUES (1, 1, 2), (1, 3, 1), (2, 1, 5);
`,
              expected: "id | name\n2 | Ink\n4 | Stapler\n",
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE order_items (order_id INT, product_id INT, qty INT);
INSERT INTO products VALUES (1, 'Mug'), (2, 'Cap'), (3, 'Bag');
INSERT INTO order_items VALUES (1, 2, 1), (2, NULL, 3);
`,
              expected: "id | name\n1 | Mug\n3 | Bag\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE order_items (order_id INT, product_id INT, qty INT);
INSERT INTO products VALUES (1, 'Lamp'), (2, 'Desk');
`,
              expected: "id | name\n1 | Lamp\n2 | Desk\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE order_items (order_id INT, product_id INT, qty INT);
INSERT INTO products VALUES (1, 'Lamp');
INSERT INTO order_items VALUES (1, 1, 1), (2, 1, 2);
`,
              expected: "id | name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`orders.customer_id` contains the values 1, 2 and NULL. What does this return?\n\n```sql\nSELECT name FROM customers\nWHERE id NOT IN (SELECT customer_id FROM orders);\n```",
          options: [
            "The customers whose id is not 1 or 2",
            "No rows",
            "Every customer",
            "An error",
          ],
          answer: 1,
          explanation: "For customer 3 the condition is `3 <> 1 AND 3 <> 2 AND 3 <> NULL`; the last part is unknown, so the whole condition is unknown and the row is not kept. That happens for every customer. `NOT EXISTS` gives the intended answer.",
        },
        {
          prompt: "Why is `WHERE EXISTS (…)` better than a plain join for \"customers who have placed an order\"?",
          options: [
            "A join cannot reach the orders table",
            "A join returns a customer once per order, so it needs `DISTINCT`; `EXISTS` returns each customer once and can stop at the first match",
            "`EXISTS` returns the order columns too",
            "Joins are not allowed in `WHERE`",
          ],
          answer: 1,
          explanation: "A semi join's answer is the customers, not the pairs. `EXISTS` (or `IN`) states that directly and never multiplies rows. The subquery's columns are not available outside it.",
        },
        {
          prompt: "In `SELECT c.* FROM customers c LEFT JOIN shipments s ON s.customer_id = c.id WHERE ___ IS NULL`, which column should fill the blank to find customers with no shipment? `shipped_on` is NULL for shipments not yet sent.",
          options: ["`s.shipped_on`", "`s.id` (the shipments primary key)", "`c.id`", "Any column of `s`"],
          answer: 1,
          explanation: "A real shipment always has its primary key, so `s.id IS NULL` means \"no match\". `s.shipped_on IS NULL` would also keep customers whose shipment exists but is unsent. `c.id` is never NULL here.",
        },
        {
          prompt: "What does the select list inside `EXISTS (SELECT 1 FROM orders WHERE …)` do?",
          options: [
            "It decides which value is compared",
            "Nothing — `EXISTS` only checks whether any row is returned",
            "It must be `*`",
            "It limits the subquery to one row",
          ],
          answer: 1,
          explanation: "`EXISTS` is true when the subquery returns at least one row, whatever its columns. `SELECT 1`, `SELECT *` and `SELECT o.id` behave the same; `SELECT 1` is the convention that signals this.",
        },
      ],
    },
    {
      slug: "joins-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Department report",
          prompt: `Report **every** department with its number of employees and its highest salary. A department with no employees shows \`0\` and \`NULL\`. Employees with no department are ignored.

**Tables:** \`departments(id, name)\` and \`employees(id, name, dept_id, salary)\`.

| departments.id | name |
| --- | --- |
| 1 | Engineering |
| 2 | Sales |
| 3 | Legal |

| employees.id | name | dept_id | salary |
| --- | --- | --- | --- |
| 1 | Anu | 1 | 120000 |
| 2 | Ben | 1 | 95000 |
| 3 | Chen | 2 | 70000 |
| 4 | Dev | NULL | 50000 |
| 5 | Esha | 2 | 82000 |

**Output:** columns \`department\`, \`headcount\`, \`top_salary\`, ordered by \`headcount\` descending, then \`department\`.

\`\`\`text
department | headcount | top_salary
Engineering | 2 | 120000
Sales | 2 | 82000
Legal | 0 | NULL
\`\`\``,
          starter: String.raw`-- Every department with its headcount and highest salary (0 and NULL when empty).
-- Columns: department, headcount, top_salary — ordered by headcount DESC, department.
`,
          solution: String.raw`SELECT d.name AS department, COUNT(e.id) AS headcount, MAX(e.salary) AS top_salary
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.id, d.name
ORDER BY headcount DESC, department;
`,
          hints: [
            "Start from `departments` and left join `employees`, so Legal stays.",
            "Count `e.id`, not `*` and not `e.salary` — an employee whose salary is NULL is still an employee.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept_id INT, salary INT);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Legal');
INSERT INTO employees VALUES (1, 'Anu', 1, 120000), (2, 'Ben', 1, 95000), (3, 'Chen', 2, 70000), (4, 'Dev', NULL, 50000), (5, 'Esha', 2, 82000);
`,
              expected: "department | headcount | top_salary\nEngineering | 2 | 120000\nSales | 2 | 82000\nLegal | 0 | NULL\n",
            },
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept_id INT, salary INT);
INSERT INTO departments VALUES (1, 'Ops'), (2, 'HR');
`,
              expected: "department | headcount | top_salary\nHR | 0 | NULL\nOps | 0 | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept_id INT, salary INT);
INSERT INTO departments VALUES (1, 'Audit');
INSERT INTO employees VALUES (1, 'Xi', 1, NULL), (2, 'Yo', 1, 10), (3, 'Zu', 5, 99);
`,
              expected: "department | headcount | top_salary\nAudit | 2 | 10\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Colleagues in the same department",
          prompt: `List every pair of employees who work in the same department, with the department's name. Each pair appears once: \`employee_a\` is the one with the **smaller id**. Employees with no department are never paired.

**Tables:** \`departments(id, name)\` and \`employees(id, name, dept_id)\`.

| departments.id | name |
| --- | --- |
| 1 | Engineering |
| 2 | Sales |
| 3 | Legal |

| employees.id | name | dept_id |
| --- | --- | --- |
| 1 | Anu | 1 |
| 2 | Ben | 1 |
| 3 | Chen | 2 |
| 4 | Dev | NULL |
| 5 | Esha | 2 |
| 6 | Farid | 1 |
| 7 | Gia | 3 |

**Output:** columns \`department\`, \`employee_a\`, \`employee_b\`, ordered by \`department\`, \`employee_a\`, \`employee_b\`.

\`\`\`text
department | employee_a | employee_b
Engineering | Anu | Ben
Engineering | Anu | Farid
Engineering | Ben | Farid
Sales | Chen | Esha
\`\`\``,
          starter: String.raw`-- Pairs of employees in the same department, each pair once (smaller id first).
-- Columns: department, employee_a, employee_b — ordered by department, employee_a, employee_b.
`,
          solution: String.raw`SELECT d.name AS department, a.name AS employee_a, b.name AS employee_b
FROM employees a
JOIN employees b ON b.dept_id = a.dept_id AND a.id < b.id
JOIN departments d ON d.id = a.dept_id
ORDER BY department, employee_a, employee_b;
`,
          hints: [
            "Self join `employees a` to `employees b` on the same `dept_id`, with `a.id < b.id` so each pair appears once and nobody pairs with themselves.",
            "Then join `departments` for the name. NULL departments never match, so Dev needs no special handling.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept_id INT);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Legal');
INSERT INTO employees VALUES (1, 'Anu', 1), (2, 'Ben', 1), (3, 'Chen', 2), (4, 'Dev', NULL), (5, 'Esha', 2), (6, 'Farid', 1), (7, 'Gia', 3);
`,
              expected: "department | employee_a | employee_b\nEngineering | Anu | Ben\nEngineering | Anu | Farid\nEngineering | Ben | Farid\nSales | Chen | Esha\n",
            },
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept_id INT);
INSERT INTO departments VALUES (1, 'Ops');
INSERT INTO employees VALUES (1, 'Zara', 1), (2, 'Amit', 1), (3, 'Quin', NULL), (4, 'Ravi', NULL);
`,
              expected: "department | employee_a | employee_b\nOps | Zara | Amit\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept_id INT);
INSERT INTO departments VALUES (1, 'Ops'), (2, 'HR');
INSERT INTO employees VALUES (1, 'Uma', 1), (2, 'Vik', 2);
`,
              expected: "department | employee_a | employee_b\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Courses with no enrolment this term",
          prompt: `List the courses that have **no** enrolment in the term \`'2024-S2'\` (they may have enrolments in other terms). Some enrolment rows have a NULL \`course_id\`.

**Tables:** \`courses(id, title)\` and \`enrollments(student_id, course_id, term)\`.

| courses.id | title |
| --- | --- |
| 101 | Databases |
| 102 | Networks |
| 103 | Statistics |
| 104 | Compilers |

| student_id | course_id | term |
| --- | --- | --- |
| 1 | 101 | 2024-S2 |
| 2 | 101 | 2024-S1 |
| 3 | 102 | 2024-S1 |
| 1 | 103 | 2024-S2 |
| 2 | NULL | 2024-S2 |

**Output:** columns \`id\`, \`title\`, ordered by \`id\`.

\`\`\`text
id | title
102 | Networks
104 | Compilers
\`\`\``,
          starter: String.raw`-- Courses with no enrolment in term '2024-S2'.
-- Columns: id, title — ordered by id.
`,
          solution: String.raw`SELECT c.id, c.title
FROM courses c
WHERE NOT EXISTS (
  SELECT 1 FROM enrollments e
  WHERE e.course_id = c.id AND e.term = '2024-S2'
)
ORDER BY c.id;
`,
          hints: [
            "An anti join whose match condition includes the term: `NOT EXISTS (… WHERE e.course_id = c.id AND e.term = '2024-S2')`.",
            "With a left join instead, the term condition must be in `ON`, not in the outer `WHERE`; and `NOT IN` breaks on the NULL `course_id`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE courses (id INT PRIMARY KEY, title VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course_id INT, term VARCHAR(10));
INSERT INTO courses VALUES (101, 'Databases'), (102, 'Networks'), (103, 'Statistics'), (104, 'Compilers');
INSERT INTO enrollments VALUES (1, 101, '2024-S2'), (2, 101, '2024-S1'), (3, 102, '2024-S1'), (1, 103, '2024-S2'), (2, NULL, '2024-S2');
`,
              expected: "id | title\n102 | Networks\n104 | Compilers\n",
            },
            {
              stdin: String.raw`CREATE TABLE courses (id INT PRIMARY KEY, title VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course_id INT, term VARCHAR(10));
INSERT INTO courses VALUES (1, 'Ethics'), (2, 'Logic');
`,
              expected: "id | title\n1 | Ethics\n2 | Logic\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE courses (id INT PRIMARY KEY, title VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course_id INT, term VARCHAR(10));
INSERT INTO courses VALUES (1, 'Ethics');
INSERT INTO enrollments VALUES (5, 1, '2024-S2'), (6, 1, '2024-S2');
`,
              expected: "id | title\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which join keeps the unmatched rows of **both** tables?",
          options: ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"],
          answer: 2,
          explanation: "A full outer join keeps matched pairs plus the unmatched rows of each side. A left join keeps only the left side's unmatched rows; an inner join keeps none; a cross join does no matching at all.",
        },
        {
          prompt: "`a` has 5 rows and `b` has 0 rows. How many rows does `a LEFT JOIN b ON b.a_id = a.id` return?",
          options: ["0", "5", "An error", "1"],
          answer: 1,
          explanation: "Every left row appears at least once; with no partners, each appears once with NULLs for `b`'s columns. The same query as an inner join, or `a CROSS JOIN b`, returns 0.",
        },
        {
          prompt: "Every customer should appear with their 2024 order count. Which is correct?",
          options: [
            "`LEFT JOIN orders o ON o.customer_id = c.id WHERE YEAR(o.order_date) = 2024`",
            "`LEFT JOIN orders o ON o.customer_id = c.id AND o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'`",
            "`JOIN orders o ON o.customer_id = c.id AND YEAR(o.order_date) = 2024`",
            "`RIGHT JOIN orders o ON o.customer_id = c.id`",
          ],
          answer: 1,
          explanation: "The year condition decides which orders count as a match, so it belongs in `ON`. In `WHERE` it removes the NULL rows of customers without 2024 orders; the inner join drops them outright; the right join keeps orders, not customers.",
        },
        {
          prompt: "What does `COALESCE(SUM(o.amount), 0)` fix after a left join?",
          options: [
            "Duplicate rows",
            "`SUM` returning NULL for a group whose only row is the NULL-filled one",
            "The ambiguous column error",
            "Fan-out double counting",
          ],
          answer: 1,
          explanation: "`SUM` ignores NULLs and returns NULL when there is nothing else, so a customer with no orders would show NULL; `COALESCE` replaces it with 0. It does nothing about duplicates or fan-out.",
        },
        {
          prompt: "Which is the correct MySQL emulation of `bank FULL OUTER JOIN books ON books.ref = bank.ref`?",
          options: [
            "`bank LEFT JOIN books … UNION ALL books LEFT JOIN bank … WHERE bank.ref IS NULL`",
            "`bank LEFT JOIN books … UNION ALL bank RIGHT JOIN books …`",
            "`bank CROSS JOIN books`",
            "`bank JOIN books … UNION ALL books JOIN bank …`",
          ],
          answer: 0,
          explanation: "The first half keeps every bank row; the second adds only the books rows with no bank match. Option 2 without a filter lists every matched row twice; option 4 has no unmatched rows at all; a cross join is every pair.",
        },
        {
          prompt: "A cross join of 3 regions and 12 months, left-joined to `sales` and grouped by region and month, returns how many rows?",
          options: ["Only the combinations that had sales", "36", "15", "12"],
          answer: 1,
          explanation: "The cross join creates all 3 × 12 = 36 cells; the left join attaches sales without removing any cell, and grouping by the cell keeps 36 groups. That is the point of the grid pattern.",
        },
        {
          prompt: "Why does a pair query use `a.id < b.id` rather than `a.id <> b.id`?",
          options: [
            "`<>` is not valid in a join",
            "`<>` returns every pair twice, as (A, B) and (B, A); `<` keeps one ordering",
            "`<` is faster but returns the same rows",
            "`<>` pairs rows with themselves",
          ],
          answer: 1,
          explanation: "Both exclude self-pairs, but `<>` keeps both orderings of each pair. `<` keeps exactly one.",
        },
        {
          prompt: "`employees.manager_id` is NULL for the CEO. What happens to the CEO in `employees e JOIN employees m ON m.id = e.manager_id`?",
          options: [
            "Appears with a NULL manager",
            "Does not appear as `e`, because `m.id = NULL` matches nothing",
            "Appears as their own manager",
            "Causes an error",
          ],
          answer: 1,
          explanation: "A NULL key never satisfies an equality. Use `LEFT JOIN` to keep the CEO with a NULL manager. (The CEO still appears as `m` for their direct reports.)",
        },
        {
          prompt: "A query joins `customers` to both `orders` and `payments` and sums both amounts. What is the safest fix for the inflated totals?",
          options: [
            "`SUM(DISTINCT o.amount)` and `SUM(DISTINCT p.amount)`",
            "Aggregate orders and payments separately per customer (derived tables), then join the totals",
            "Change the joins to `RIGHT JOIN`",
            "Add `GROUP BY` on more columns",
          ],
          answer: 1,
          explanation: "Each customer then meets one order-total row and one payment-total row, so nothing multiplies. `SUM(DISTINCT …)` merges equal amounts from different rows and gives wrong totals; the other options leave the fan-out in place.",
        },
        {
          prompt: "Which pattern is an anti join?",
          options: [
            "`WHERE EXISTS (…)`",
            "`LEFT JOIN … WHERE right.id IS NULL`",
            "`JOIN … ON …`",
            "`CROSS JOIN`",
          ],
          answer: 1,
          explanation: "Keeping only the left rows whose right side stayed NULL returns the rows with no match — an anti join, like `NOT EXISTS`. `EXISTS` is a semi join.",
        },
        {
          prompt: "`order_items.product_id` contains a NULL. Which query still lists unsold products correctly?",
          options: [
            "`WHERE p.id NOT IN (SELECT product_id FROM order_items)`",
            "`WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.product_id = p.id)`",
            "`WHERE p.id <> ALL (SELECT product_id FROM order_items)`",
            "`JOIN order_items i ON i.product_id <> p.id`",
          ],
          answer: 1,
          explanation: "`NOT EXISTS` asks only whether a matching row exists, and NULL never matches. `NOT IN` and `<> ALL` are the same comparison and both become unknown because of the NULL. The `<>` join pairs each product with every other item.",
        },
        {
          prompt: "What does `students s LEFT JOIN enrollments e ON … JOIN courses c ON c.id = e.course_id` do to students with no enrolments?",
          options: [
            "Keeps them with NULL course columns",
            "Removes them, because the inner join to courses cannot match their NULL `course_id`",
            "Repeats them once per course",
            "Raises an error",
          ],
          answer: 1,
          explanation: "The inner join after the left join filters out the NULL-filled rows. Make the second join a `LEFT JOIN` to keep them.",
        },
      ],
    },
  ],
});
