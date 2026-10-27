import { defineModule } from "../../dsl.js";

const READINGS_1 = String.raw`CREATE TABLE readings (id INT PRIMARY KEY, temp INT);
INSERT INTO readings VALUES
  (1, 21), (2, 21), (3, 21), (4, 22), (5, 21),
  (6, 23), (7, 23), (8, 23), (9, 23);
`;

const STAFF_1 = String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), salary INT, department_id INT);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Ops'), (4, 'Legal');
INSERT INTO employees VALUES
  (1, 'Asha', 120, 1), (2, 'Bo', 110, 1), (3, 'Cara', 110, 1), (4, 'Dev', 100, 1), (5, 'Eli', 90, 1),
  (6, 'Fay', 80, 2), (7, 'Gus', 80, 2),
  (8, 'Hal', 70, 3), (9, 'Ivy', 60, 3), (10, 'Jo', 50, 3), (11, 'Kay', 40, 3);
`;

const ORDERS_BIG_1 = String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO orders VALUES
  (1, 1, 150), (2, 1, 90), (3, 1, 200),
  (4, 2, 100), (5, 2, 100),
  (6, 3, 500),
  (7, 4, 99), (8, 4, 99), (9, 4, 99),
  (10, 5, 120), (11, 5, 130), (12, 5, 140);
`;

const SCORES_1 = String.raw`CREATE TABLE scores (player VARCHAR(20) PRIMARY KEY, points INT);
INSERT INTO scores VALUES
  ('Ana', 100), ('Ben', 90), ('Cid', 90), ('Dee', 80), ('Eva', 80), ('Fin', 70);
`;

const PAYROLL_1 = String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), dept VARCHAR(10), salary INT);
INSERT INTO employees VALUES
  (1, 'Asha', 'eng', 120), (2, 'Bo', 'eng', 80), (3, 'Cara', 'eng', 100),
  (4, 'Dev', 'ops', 50), (5, 'Eli', 'ops', 30), (6, 'Fay', 'ops', 20),
  (7, 'Gus', 'sales', 100);
`;

const STORE_ORDERS_1 = String.raw`CREATE TABLE orders (id INT PRIMARY KEY, store VARCHAR(10), amount INT);
INSERT INTO orders VALUES
  (1, 'A', 10), (2, 'A', 30), (3, 'A', 20),
  (4, 'B', 5), (5, 'B', 100), (6, 'B', 16), (7, 'B', 25),
  (8, 'C', 7);
`;

const FANOUT_1 = String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
CREATE TABLE payments (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Cara'), (4, 'Dev');
INSERT INTO orders VALUES (1, 1, 100), (2, 1, 50), (3, 2, 70);
INSERT INTO payments VALUES (1, 1, 60), (2, 1, 40), (3, 1, 50), (4, 3, 20);
`;

const COMPLAINTS_1 = String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE complaints (id INT PRIMARY KEY, customer_id INT, note VARCHAR(40));
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Cara'), (4, 'Dev');
INSERT INTO complaints VALUES (1, 1, 'late delivery'), (2, 3, 'broken lid'), (3, NULL, 'anonymous form');
`;

const TOP_EARNERS_1 = String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), salary INT, dept_id INT);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Ops'), (3, 'Sales'), (4, 'HR');
INSERT INTO employees VALUES
  (1, 'Bo', 120, 1), (2, 'Asha', 120, 1), (3, 'Cara', 90, 1),
  (4, 'Dev', 70, 2),
  (5, 'Eli', 80, 3), (6, 'Fay', 85, 3);
`;

const NO_ORDERS_1 = String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, ordered_on DATE);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Cara'), (4, 'Dev'), (5, 'Eli');
INSERT INTO orders VALUES
  (1, 1, '2023-12-31'), (2, 1, '2025-01-01'),
  (3, 2, '2024-06-01'),
  (4, 4, '2024-01-01'),
  (5, 5, '2024-12-31'), (6, 5, '2023-05-05');
`;

const USERS_1 = String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(60));
INSERT INTO users VALUES
  (1, 'a@x.com'), (2, 'A@x.com'), (3, ' a@x.com'), (4, 'b@x.com'),
  (5, 'c@x.com'), (6, 'C@X.COM'), (7, 'd@x.com ');
`;

export default defineModule(import.meta.url, {
  slug: "interview-idioms",
  title: "Interview idioms",
  blurb: "The six classic SQL interview questions solved two ways, the theory drill from WHERE vs HAVING to ACID, the idiom sheet of question shapes and their queries, and the twelve pitfalls that quietly fail a query.",
  icon: "trophy",
  overview: `Fifteen modules taught SQL. This one teaches the SQL round: the questions interviewers actually ask, the answers they listen for, and the habits that turn a query that runs into a query that is right.

It opens with the six classics every interview reuses — the second highest salary, duplicate emails, employees earning more than their manager, values three times in a row, the top three salaries per department and customers who never ordered — each with the expected answer, a second approach and the follow-ups it leads to. The theory drill is the part of the round without a keyboard: WHERE vs HAVING, the logical order of a query, DELETE vs TRUNCATE vs DROP, UNION vs UNION ALL, keys, normal forms, indexes, ACID and isolation, and ROW_NUMBER vs RANK vs DENSE_RANK, each as a one-sentence answer and the detail that proves you have used it. The idiom sheet maps question wording to query shape — existence and absence, latest per group, top N per group, conditional counts, share of the total, safe ratios, running totals, previous-row comparisons, pairs, median and mode, hierarchies, buckets. The pitfalls lesson is the checklist of twelve mistakes that return a wrong answer instead of an error: \`= NULL\`, NOT IN with a NULL, a LEFT JOIN undone by WHERE, fan-out sums, COUNT and AVG with NULLs, ungrouped columns, aliases in WHERE, integer division elsewhere, BETWEEN on datetimes, missing ORDER BY, and UNION eating rows.

The exercises are the classics written your own way and the theory made concrete: three readings in a row and the top three pay levels per department, WHERE and HAVING in one query and the three ranking functions side by side, share of payroll and a median per store, and two broken queries to fix — a fan-out join and a NOT IN that a single NULL empties. The final checkpoint sets the highest earners with ties kept, the customers with no order in a given year, and duplicate emails once case and spaces are ignored — and, with the other fifteen modules, completes the plan.`,
  lessons: [
    {
      slug: "classic-sql-questions",
      file: "01-classic-sql-questions.md",
      exercises: [
        {
          title: "Three readings in a row",
          prompt: `A thermometer writes one row per reading; \`id\` gives the order, but some ids were skipped when a reading failed.

| id | temp |
| --- | --- |
| 1 | 21 |
| 2 | 21 |
| 3 | 21 |
| 4 | 22 |
| 5 | 21 |
| 6 | 23 |
| 7 | 23 |
| 8 | 23 |
| 9 | 23 |

Find every temperature that was recorded **at least three times in a row** (consecutive in \`id\` order). Return one column, \`repeated_value\`, each value once, ordered by \`repeated_value\`.

\`\`\`text
repeated_value
21
23
\`\`\``,
          starter: String.raw`-- Each temperature seen at least three times in a row (by id order): repeated_value, ordered.
SELECT DISTINCT temp AS repeated_value
FROM readings
ORDER BY repeated_value;
`,
          solution: String.raw`SELECT DISTINCT temp AS repeated_value
FROM (
  SELECT temp,
         LEAD(temp, 1) OVER (ORDER BY id) AS next1,
         LEAD(temp, 2) OVER (ORDER BY id) AS next2
  FROM readings
) AS t
WHERE temp = next1 AND temp = next2
ORDER BY repeated_value;
`,
          hints: [
            "Look at each reading together with the next two readings in id order.",
            "`LEAD(temp, 1)` and `LEAD(temp, 2)` over `ORDER BY id` give them — the ids may have holes, so do not join on `id + 1`.",
            "Keep the rows where all three are equal, and use DISTINCT: a run of four matches twice.",
          ],
          cases: [
            { stdin: READINGS_1, expected: "repeated_value\n21\n23\n" },
            {
              stdin: String.raw`CREATE TABLE readings (id INT PRIMARY KEY, temp INT);
INSERT INTO readings VALUES (1, 5), (2, 5), (5, 5), (6, 6), (9, 6);
`,
              expected: "repeated_value\n5\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE readings (id INT PRIMARY KEY, temp INT);
INSERT INTO readings VALUES (1, 1), (2, 2), (3, 1), (4, 2), (5, 2);
`,
              expected: "repeated_value\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE readings (id INT PRIMARY KEY, temp INT);
INSERT INTO readings VALUES (1, 7), (2, 7);
`,
              expected: "repeated_value\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Top three pay levels per department",
          prompt: `Two tables: \`departments(id, name)\` and \`employees(id, name, salary, department_id)\`.

| department | employees (salary) |
| --- | --- |
| Engineering | Asha 120, Bo 110, Cara 110, Dev 100, Eli 90 |
| Sales | Fay 80, Gus 80 |
| Ops | Hal 70, Ivy 60, Jo 50, Kay 40 |
| Legal | — |

List every employee whose salary is among the **three highest distinct salaries of their department** — everyone on a tied level included. Return \`department\` (the department's name), \`employee\` and \`salary\`, ordered by \`department\`, then \`salary\` descending, then \`employee\`.

\`\`\`text
department | employee | salary
Engineering | Asha | 120
Engineering | Bo | 110
Engineering | Cara | 110
Engineering | Dev | 100
Ops | Hal | 70
Ops | Ivy | 60
Ops | Jo | 50
Sales | Fay | 80
Sales | Gus | 80
\`\`\``,
          starter: String.raw`-- department, employee, salary for the top three distinct salary levels of each department.
-- Order by department, salary DESC, employee.
SELECT d.name AS department, e.name AS employee, e.salary
FROM employees AS e
JOIN departments AS d ON d.id = e.department_id
ORDER BY department, e.salary DESC, employee;
`,
          solution: String.raw`SELECT d.name AS department, e.name AS employee, e.salary
FROM (
  SELECT emp.*,
         DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rk
  FROM employees AS emp
) AS e
JOIN departments AS d ON d.id = e.department_id
WHERE e.rk <= 3
ORDER BY department, e.salary DESC, employee;
`,
          hints: [
            "Rank the salaries inside each department; keep ranks 1 to 3.",
            "\"Three highest distinct salaries\" with ties included is `DENSE_RANK()`, not `ROW_NUMBER()` or `RANK()`.",
            "Rank in a derived table — `DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)` — then join the department names and filter `rk <= 3` outside.",
          ],
          cases: [
            { stdin: STAFF_1, expected: "department | employee | salary\nEngineering | Asha | 120\nEngineering | Bo | 110\nEngineering | Cara | 110\nEngineering | Dev | 100\nOps | Hal | 70\nOps | Ivy | 60\nOps | Jo | 50\nSales | Fay | 80\nSales | Gus | 80\n" },
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), salary INT, department_id INT);
INSERT INTO departments VALUES (7, 'Research');
INSERT INTO employees VALUES (1, 'Zed', 300, 7), (2, 'Amy', 200, 7);
`,
              expected: "department | employee | salary\nResearch | Zed | 300\nResearch | Amy | 200\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), salary INT, department_id INT);
INSERT INTO departments VALUES (1, 'Support'), (2, 'Admin');
INSERT INTO employees VALUES
  (1, 'Pia', 50, 1), (2, 'Quin', 50, 1), (3, 'Raj', 40, 1), (4, 'Sam', 30, 1), (5, 'Tess', 30, 1), (6, 'Uma', 20, 1),
  (7, 'Vic', 10, 2), (8, 'Wen', 10, 2), (9, 'Xia', 10, 2), (10, 'Yul', 10, 2);
`,
              expected: "department | employee | salary\nAdmin | Vic | 10\nAdmin | Wen | 10\nAdmin | Xia | 10\nAdmin | Yul | 10\nSupport | Pia | 50\nSupport | Quin | 50\nSupport | Raj | 40\nSupport | Sam | 30\nSupport | Tess | 30\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In \"employees who earn more than their manager\", what happens to the CEO, whose `manager_id` is NULL, in `FROM employees e JOIN employees m ON e.manager_id = m.id`?",
          options: [
            "The CEO is compared with themself",
            "The CEO is left out — the inner join finds no manager row, and there is no one to out-earn",
            "The query fails",
            "The CEO always appears",
          ],
          answer: 1,
          explanation: "`NULL = m.id` is never true, so the inner join drops the row. That is the right result: an employee with no manager cannot earn more than their manager.",
        },
        {
          prompt: "Why is `WHERE id NOT IN (SELECT customer_id FROM orders)` risky for \"customers who never ordered\"?",
          options: [
            "NOT IN is slower than IN",
            "If any `orders.customer_id` is NULL, the condition is never true and the query returns no rows",
            "NOT IN cannot be used with subqueries",
            "It returns duplicate customers",
          ],
          answer: 1,
          explanation: "`id NOT IN (…, NULL)` includes `id <> NULL`, which is unknown. NOT EXISTS and LEFT JOIN … IS NULL are safe.",
        },
        {
          prompt: "Why does the self-join answer to \"three in a row\" (`b.id = a.id + 1`, `c.id = a.id + 2`) fail when ids have holes?",
          options: [
            "It does not fail",
            "It treats rows as consecutive only when their ids differ by exactly one, so a run across a skipped id is missed",
            "It counts every run twice",
            "Self-joins cannot compare the same column",
          ],
          answer: 1,
          explanation: "`LEAD(…) OVER (ORDER BY id)` uses the *next row in order*, whatever its id, so it handles holes. The join version needs gap-free ids.",
        },
        {
          prompt: "Which query finds email addresses that appear more than once?",
          options: [
            "`SELECT email FROM users WHERE COUNT(*) > 1 GROUP BY email`",
            "`SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1`",
            "`SELECT DISTINCT email FROM users`",
            "`SELECT email, COUNT(*) FROM users`",
          ],
          answer: 1,
          explanation: "The count is a property of the group, so the filter belongs in HAVING. An aggregate in WHERE is an error, and the last option selects a non-grouped column with an aggregate.",
        },
      ],
    },
    {
      slug: "theory-drill",
      file: "02-theory-drill.md",
      exercises: [
        {
          title: "Big spenders: WHERE then HAVING",
          prompt: `\`orders(id, customer_id, amount)\`:

| id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 150 |
| 2 | 1 | 90 |
| 3 | 1 | 200 |
| 4 | 2 | 100 |
| 5 | 2 | 100 |
| 6 | 3 | 500 |
| 7–9 | 4 | 99 each |
| 10 | 5 | 120 |
| 11 | 5 | 130 |
| 12 | 5 | 140 |

A *big order* is one of **100 or more**. Find the customers with **at least two big orders**, and for each return \`customer_id\`, \`big_orders\` (how many big orders) and \`big_total\` (the sum of their big orders only). Order by \`big_total\` descending, then \`customer_id\`.

Use WHERE for the row condition and HAVING for the group condition.

\`\`\`text
customer_id | big_orders | big_total
5 | 3 | 390
1 | 2 | 350
2 | 2 | 200
\`\`\``,
          starter: String.raw`-- Customers with at least two orders of 100 or more:
-- customer_id, big_orders, big_total (big orders only) — ordered by big_total DESC, customer_id.
SELECT customer_id, COUNT(*) AS big_orders, SUM(amount) AS big_total
FROM orders
GROUP BY customer_id
ORDER BY big_total DESC, customer_id;
`,
          solution: String.raw`SELECT customer_id, COUNT(*) AS big_orders, SUM(amount) AS big_total
FROM orders
WHERE amount >= 100
GROUP BY customer_id
HAVING COUNT(*) >= 2
ORDER BY big_total DESC, customer_id;
`,
          hints: [
            "Which condition is about a single row, and which is about a whole customer?",
            "`WHERE amount >= 100` removes the small orders before grouping, so the count and the sum see only big ones.",
            "Then `HAVING COUNT(*) >= 2` keeps the customers with two or more.",
          ],
          cases: [
            { stdin: ORDERS_BIG_1, expected: "customer_id | big_orders | big_total\n5 | 3 | 390\n1 | 2 | 350\n2 | 2 | 200\n" },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO orders VALUES (1, 1, 99), (2, 1, 500), (3, 2, 100);
`,
              expected: "customer_id | big_orders | big_total\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO orders VALUES (1, 9, 100), (2, 9, 200), (3, 4, 150), (4, 4, 150), (5, 4, 10);
`,
              expected: "customer_id | big_orders | big_total\n4 | 2 | 300\n9 | 2 | 300\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Three ranking functions side by side",
          prompt: `\`scores(player, points)\`:

| player | points |
| --- | --- |
| Ana | 100 |
| Ben | 90 |
| Cid | 90 |
| Dee | 80 |
| Eva | 80 |
| Fin | 70 |

Return every player with \`player\`, \`points\` and three rankings by points, highest first: \`row_num\` (\`ROW_NUMBER\`, ties broken by \`player\` alphabetically), \`rnk\` (\`RANK\`) and \`dense_rnk\` (\`DENSE_RANK\`). Order the result by \`points\` descending, then \`player\`.

\`\`\`text
player | points | row_num | rnk | dense_rnk
Ana | 100 | 1 | 1 | 1
Ben | 90 | 2 | 2 | 2
Cid | 90 | 3 | 2 | 2
Dee | 80 | 4 | 4 | 3
Eva | 80 | 5 | 4 | 3
Fin | 70 | 6 | 6 | 4
\`\`\``,
          starter: String.raw`-- player, points, row_num, rnk, dense_rnk — ordered by points DESC, player.
SELECT player, points
FROM scores
ORDER BY points DESC, player;
`,
          solution: String.raw`SELECT player, points,
       ROW_NUMBER() OVER (ORDER BY points DESC, player) AS row_num,
       RANK()       OVER (ORDER BY points DESC)         AS rnk,
       DENSE_RANK() OVER (ORDER BY points DESC)         AS dense_rnk
FROM scores
ORDER BY points DESC, player;
`,
          hints: [
            "Each ranking is its own window function with `OVER (ORDER BY points DESC)`.",
            "Only `ROW_NUMBER` needs the tie-breaker inside its window: `ORDER BY points DESC, player`.",
            "Ties share a number in `RANK` and `DENSE_RANK`; only `RANK` skips numbers after them.",
          ],
          cases: [
            { stdin: SCORES_1, expected: "player | points | row_num | rnk | dense_rnk\nAna | 100 | 1 | 1 | 1\nBen | 90 | 2 | 2 | 2\nCid | 90 | 3 | 2 | 2\nDee | 80 | 4 | 4 | 3\nEva | 80 | 5 | 4 | 3\nFin | 70 | 6 | 6 | 4\n" },
            {
              stdin: String.raw`CREATE TABLE scores (player VARCHAR(20) PRIMARY KEY, points INT);
INSERT INTO scores VALUES ('Zoe', 5), ('Max', 5), ('Lia', 5);
`,
              expected: "player | points | row_num | rnk | dense_rnk\nLia | 5 | 1 | 1 | 1\nMax | 5 | 2 | 1 | 1\nZoe | 5 | 3 | 1 | 1\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE scores (player VARCHAR(20) PRIMARY KEY, points INT);
INSERT INTO scores VALUES ('Kai', 10), ('Jo', 30), ('Ida', 20), ('Hu', 30);
`,
              expected: "player | points | row_num | rnk | dense_rnk\nHu | 30 | 1 | 1 | 1\nJo | 30 | 2 | 1 | 1\nIda | 20 | 3 | 3 | 2\nKai | 10 | 4 | 4 | 3\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In which logical order are these clauses evaluated?",
          options: [
            "SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY",
            "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT",
            "FROM → GROUP BY → WHERE → SELECT → HAVING → ORDER BY",
            "WHERE → FROM → SELECT → GROUP BY → ORDER BY → HAVING",
          ],
          answer: 1,
          explanation: "That is why a SELECT alias cannot be used in WHERE but can be used in ORDER BY, and why a window function, computed with the SELECT list, cannot be filtered in WHERE.",
        },
        {
          prompt: "Which statement is true of `TRUNCATE TABLE orders` in MySQL?",
          options: [
            "It takes a WHERE clause",
            "It removes every row, resets AUTO_INCREMENT, fires no DELETE triggers, and commits implicitly — it cannot be rolled back",
            "It removes the table definition",
            "It is slower than DELETE on a large table",
          ],
          answer: 1,
          explanation: "TRUNCATE is DDL in MySQL: it recreates the table. DELETE removes matching rows one by one and can be rolled back; DROP removes the table itself.",
        },
        {
          prompt: "A table `order_items(order_id, product_id, product_name, qty)` has the key `(order_id, product_id)`. Which normal form does `product_name` break?",
          options: ["1NF", "2NF — it depends on only part of the composite key", "3NF only", "None"],
          answer: 1,
          explanation: "`product_name` is determined by `product_id` alone, a partial dependency on the key. Moving it to a `products` table fixes it. 3NF is about a non-key column depending on another non-key column.",
        },
        {
          prompt: "A composite index exists on `(last_name, first_name, city)`. Which filter can use it?",
          options: [
            "`WHERE first_name = 'Ana'`",
            "`WHERE city = 'Pune'`",
            "`WHERE last_name = 'Rao' AND first_name = 'Ana'`",
            "`WHERE first_name = 'Ana' AND city = 'Pune'`",
          ],
          answer: 2,
          explanation: "The leftmost-prefix rule: the index serves `last_name`, `last_name + first_name`, and all three. A filter that skips the first column cannot seek on it.",
        },
        {
          prompt: "Which ACID property guarantees that a committed transfer is still there after a power cut?",
          options: ["Atomicity", "Consistency", "Isolation", "Durability"],
          answer: 3,
          explanation: "Durability: once committed, changes survive a crash — InnoDB writes them to its redo log before acknowledging the commit. Atomicity is all-or-nothing; isolation is about concurrent transactions; consistency is about constraints holding.",
        },
      ],
    },
    {
      slug: "the-idiom-sheet",
      file: "03-the-idiom-sheet.md",
      exercises: [
        {
          title: "Share of department payroll",
          prompt: `\`employees(id, name, dept, salary)\`:

| id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | eng | 120 |
| 2 | Bo | eng | 80 |
| 3 | Cara | eng | 100 |
| 4 | Dev | ops | 50 |
| 5 | Eli | ops | 30 |
| 6 | Fay | ops | 20 |
| 7 | Gus | sales | 100 |

For every employee, return \`dept\`, \`name\`, \`salary\` and \`pct\`: their salary as a percentage of their department's total salary, rounded to 1 decimal place. Order by \`dept\`, then \`salary\` descending, then \`name\`.

\`\`\`text
dept | name | salary | pct
eng | Asha | 120 | 40
eng | Cara | 100 | 33.3
eng | Bo | 80 | 26.7
ops | Dev | 50 | 50
ops | Eli | 30 | 30
ops | Fay | 20 | 20
sales | Gus | 100 | 100
\`\`\``,
          starter: String.raw`-- dept, name, salary, pct (share of the department's payroll, ROUND 1) — ordered by dept, salary DESC, name.
SELECT dept, name, salary
FROM employees
ORDER BY dept, salary DESC, name;
`,
          solution: String.raw`SELECT dept, name, salary,
       ROUND(100 * salary / SUM(salary) OVER (PARTITION BY dept), 1) AS pct
FROM employees
ORDER BY dept, salary DESC, name;
`,
          hints: [
            "Each row needs its department's total without the rows being collapsed — a window aggregate, not GROUP BY.",
            "`SUM(salary) OVER (PARTITION BY dept)` is the department total on every row.",
            "`ROUND(100 * salary / SUM(salary) OVER (PARTITION BY dept), 1)`.",
          ],
          cases: [
            { stdin: PAYROLL_1, expected: "dept | name | salary | pct\neng | Asha | 120 | 40\neng | Cara | 100 | 33.3\neng | Bo | 80 | 26.7\nops | Dev | 50 | 50\nops | Eli | 30 | 30\nops | Fay | 20 | 20\nsales | Gus | 100 | 100\n" },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), dept VARCHAR(10), salary INT);
INSERT INTO employees VALUES (1, 'Uno', 'r', 1), (2, 'Dos', 'r', 1), (3, 'Tres', 'r', 1);
`,
              expected: "dept | name | salary | pct\nr | Dos | 1 | 33.3\nr | Tres | 1 | 33.3\nr | Uno | 1 | 33.3\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), dept VARCHAR(10), salary INT);
INSERT INTO employees VALUES (1, 'Kim', 'qa', 70), (2, 'Lee', 'qa', 70), (3, 'Moe', 'qa', 60), (4, 'Ned', 'hr', 45);
`,
              expected: "dept | name | salary | pct\nhr | Ned | 45 | 100\nqa | Kim | 70 | 35\nqa | Lee | 70 | 35\nqa | Moe | 60 | 30\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Median order value per store",
          prompt: `\`orders(id, store, amount)\`:

| id | store | amount |
| --- | --- | --- |
| 1 | A | 10 |
| 2 | A | 30 |
| 3 | A | 20 |
| 4 | B | 5 |
| 5 | B | 100 |
| 6 | B | 16 |
| 7 | B | 25 |
| 8 | C | 7 |

MySQL has no \`MEDIAN\` function. For each store return \`store\` and \`median_amount\` — the middle amount when the store has an odd number of orders, the mean of the two middle amounts when it has an even number — rounded to 2 decimal places. Order by \`store\`.

\`\`\`text
store | median_amount
A | 20
B | 20.5
C | 7
\`\`\``,
          starter: String.raw`-- store, median_amount (ROUND 2), ordered by store.
SELECT store, ROUND(AVG(amount), 2) AS median_amount
FROM orders
GROUP BY store
ORDER BY store;
`,
          solution: String.raw`WITH ranked AS (
  SELECT store, amount,
         ROW_NUMBER() OVER (PARTITION BY store ORDER BY amount) AS rn,
         COUNT(*)     OVER (PARTITION BY store)                 AS n
  FROM orders
)
SELECT store, ROUND(AVG(amount), 2) AS median_amount
FROM ranked
WHERE rn IN (FLOOR((n + 1) / 2), CEIL((n + 1) / 2))
GROUP BY store
ORDER BY store;
`,
          hints: [
            "Number each store's amounts in order and count them, both with window functions.",
            "The middle row numbers are `FLOOR((n + 1) / 2)` and `CEIL((n + 1) / 2)` — the same row when n is odd, the two middle rows when n is even.",
            "Keep those rows and `AVG` them per store.",
          ],
          cases: [
            { stdin: STORE_ORDERS_1, expected: "store | median_amount\nA | 20\nB | 20.5\nC | 7\n" },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, store VARCHAR(10), amount INT);
INSERT INTO orders VALUES (1, 'X', 4), (2, 'X', 4), (3, 'X', 9), (4, 'X', 1), (5, 'X', 4), (6, 'X', 8);
`,
              expected: "store | median_amount\nX | 4\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, store VARCHAR(10), amount INT);
INSERT INTO orders VALUES (1, 'P', 1), (2, 'P', 2), (3, 'Q', 10), (4, 'Q', 11);
`,
              expected: "store | median_amount\nP | 1.5\nQ | 10.5\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which question is an anti-join?",
          options: [
            "Each customer's latest order",
            "Products that have never been sold",
            "Each product's share of revenue",
            "Monthly revenue",
          ],
          answer: 1,
          explanation: "\"Never\" means rows with no match in another table: `NOT EXISTS`, or `LEFT JOIN … WHERE right.id IS NULL`.",
        },
        {
          prompt: "Why does `FROM teams a JOIN teams b ON a.id < b.id` list each pair once?",
          options: [
            "Because JOIN removes duplicates",
            "The strict inequality drops a team paired with itself and keeps only one of (A, B) and (B, A)",
            "Because ids are unique",
            "It lists each pair twice",
          ],
          answer: 1,
          explanation: "With `<>` both (A, B) and (B, A) would appear; with `<` only the ordering where the first id is smaller survives.",
        },
        {
          prompt: "In MySQL, what does `AVG(status = 'refunded')` return over a group of orders?",
          options: [
            "An error",
            "The share of orders that were refunded, as a fraction between 0 and 1",
            "The number of refunded orders",
            "1 if any order was refunded",
          ],
          answer: 1,
          explanation: "A comparison is 1 or 0 in MySQL, and the average of 0s and 1s is the proportion of 1s. `SUM(…)` of the same expression would be the count.",
        },
        {
          prompt: "Which is the portable way to give each row its group's total while keeping every row?",
          options: [
            "`GROUP BY` the group column",
            "`SUM(x) OVER (PARTITION BY g)`",
            "`SUM(x) GROUP BY g HAVING …`",
            "`DISTINCT SUM(x)`",
          ],
          answer: 1,
          explanation: "A window aggregate attaches the group total to every row; GROUP BY collapses the rows into one per group.",
        },
      ],
    },
    {
      slug: "sql-pitfalls",
      file: "04-sql-pitfalls.md",
      exercises: [
        {
          title: "Fix the fan-out",
          prompt: `Three tables: \`customers(id, name)\`, \`orders(id, customer_id, amount)\` and \`payments(id, customer_id, amount)\`.

| customer | orders | payments |
| --- | --- | --- |
| Asha | 100, 50 | 60, 40, 50 |
| Ben | 70 | — |
| Cara | — | 20 |
| Dev | — | — |

The starter joins both child tables to the customers and sums — and reports Asha as having ordered 450 and paid 300. Fix it. For every customer return \`name\`, \`ordered\` (the sum of their orders) and \`paid\` (the sum of their payments), **0** where there are none, ordered by \`name\`.

\`\`\`text
name | ordered | paid
Asha | 150 | 150
Ben | 70 | 0
Cara | 0 | 20
Dev | 0 | 0
\`\`\``,
          starter: String.raw`-- Wrong: joining both tables multiplies the rows. Fix it.
-- name, ordered, paid (0 when none) — ordered by name.
SELECT c.name,
       COALESCE(SUM(o.amount), 0) AS ordered,
       COALESCE(SUM(p.amount), 0) AS paid
FROM customers AS c
LEFT JOIN orders   AS o ON o.customer_id = c.id
LEFT JOIN payments AS p ON p.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
`,
          solution: String.raw`SELECT c.name,
       COALESCE(o.total, 0) AS ordered,
       COALESCE(p.total, 0) AS paid
FROM customers AS c
LEFT JOIN (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id) AS o
       ON o.customer_id = c.id
LEFT JOIN (SELECT customer_id, SUM(amount) AS total FROM payments GROUP BY customer_id) AS p
       ON p.customer_id = c.id
ORDER BY c.name;
`,
          hints: [
            "Asha has 2 orders and 3 payments, so the double join gives her 6 rows: each order is counted three times, each payment twice.",
            "Make each child table one row per customer before joining: `SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id`.",
            "LEFT JOIN both summaries to customers and `COALESCE(…, 0)` the missing totals.",
          ],
          cases: [
            { stdin: FANOUT_1, expected: "name | ordered | paid\nAsha | 150 | 150\nBen | 70 | 0\nCara | 0 | 20\nDev | 0 | 0\n" },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
CREATE TABLE payments (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Ola'), (2, 'Pat');
INSERT INTO orders VALUES (1, 1, 30), (2, 1, 30), (3, 2, 5);
INSERT INTO payments VALUES (1, 1, 25), (2, 1, 35), (3, 2, 5), (4, 2, 1);
`,
              expected: "name | ordered | paid\nOla | 60 | 60\nPat | 5 | 6\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
CREATE TABLE payments (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Quy');
`,
              expected: "name | ordered | paid\nQuy | 0 | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Customers without a complaint",
          prompt: `\`customers(id, name)\` and \`complaints(id, customer_id, note)\`. A complaint sent through the anonymous form has a NULL \`customer_id\`.

| customers | complaints (customer_id, note) |
| --- | --- |
| 1 Asha | 1, late delivery |
| 2 Ben | 3, broken lid |
| 3 Cara | NULL, anonymous form |
| 4 Dev | |

The starter uses \`NOT IN\` and returns no rows at all. Fix it so it lists the customers who have **no complaint**: one column, \`name\`, ordered by \`name\`.

\`\`\`text
name
Ben
Dev
\`\`\``,
          starter: String.raw`-- Wrong: returns nothing when a complaint has a NULL customer_id. Fix it.
-- name of every customer with no complaint, ordered by name.
SELECT name
FROM customers
WHERE id NOT IN (SELECT customer_id FROM complaints)
ORDER BY name;
`,
          solution: String.raw`SELECT c.name
FROM customers AS c
WHERE NOT EXISTS (
  SELECT 1 FROM complaints AS x WHERE x.customer_id = c.id
)
ORDER BY c.name;
`,
          hints: [
            "`id NOT IN (1, 3, NULL)` means `id <> 1 AND id <> 3 AND id <> NULL` — and the last part is never true.",
            "Ask instead whether a matching complaint exists: `WHERE NOT EXISTS (SELECT 1 FROM complaints x WHERE x.customer_id = c.id)`.",
            "A `LEFT JOIN complaints … WHERE x.id IS NULL` works too, as does filtering `customer_id IS NOT NULL` inside the NOT IN.",
          ],
          cases: [
            { stdin: COMPLAINTS_1, expected: "name\nBen\nDev\n" },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE complaints (id INT PRIMARY KEY, customer_id INT, note VARCHAR(40));
INSERT INTO customers VALUES (1, 'Rui'), (2, 'Sol');
`,
              expected: "name\nRui\nSol\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE complaints (id INT PRIMARY KEY, customer_id INT, note VARCHAR(40));
INSERT INTO customers VALUES (1, 'Tam'), (2, 'Ulf');
INSERT INTO complaints VALUES (1, 2, 'x'), (2, 1, 'y'), (3, 1, 'z');
`,
              expected: "name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT * FROM employees WHERE manager_id = NULL` return?",
          options: ["The employees with no manager", "No rows", "Every row", "An error"],
          answer: 1,
          explanation: "Any comparison with NULL is unknown, and WHERE keeps only true. Write `IS NULL` (or MySQL's NULL-safe `<=>`).",
        },
        {
          prompt: "`SELECT c.name, COUNT(o.id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid' GROUP BY c.name` — which customers are missing from the result?",
          options: [
            "None",
            "Customers with no paid order, because their NULL or other status fails the WHERE",
            "Customers with more than one order",
            "Customers with a NULL name",
          ],
          answer: 1,
          explanation: "The WHERE turns the outer join into an inner join. Move `o.status = 'paid'` into the ON clause to keep every customer with a count of 0.",
        },
        {
          prompt: "Scores are 80, NULL and 100. What is `AVG(score)`?",
          options: ["60", "90", "NULL", "180"],
          answer: 1,
          explanation: "Aggregates skip NULLs, so the average is (80 + 100) / 2. If a missing score should count as 0, write `AVG(COALESCE(score, 0))`.",
        },
        {
          prompt: "Which filter returns every row from March 2024 of a DATETIME column `created_at`, and can use an index on it?",
          options: [
            "`WHERE MONTH(created_at) = 3`",
            "`WHERE created_at BETWEEN '2024-03-01' AND '2024-03-31'`",
            "`WHERE created_at >= '2024-03-01' AND created_at < '2024-04-01'`",
            "`WHERE DATE_FORMAT(created_at, '%Y-%m') = '2024-03'`",
          ],
          answer: 2,
          explanation: "The half-open range includes the whole of March 31 and is sargable. BETWEEN stops at 31 March 00:00:00; the function-wrapped forms read every row, and MONTH() matches March of every year.",
        },
        {
          prompt: "In PostgreSQL, what is `100 * 3 / 4` when all three are integers, and in MySQL?",
          options: [
            "75 in both",
            "75 in PostgreSQL, 75.0000 in MySQL — but `3 / 4 * 100` would be 0 in PostgreSQL and 75.0000 in MySQL",
            "0 in both",
            "An error in PostgreSQL",
          ],
          answer: 1,
          explanation: "PostgreSQL truncates integer division, so the order of operations decides whether a percentage survives. MySQL's `/` always returns a decimal. Writing `100.0 * …` is safe everywhere.",
        },
      ],
    },
    {
      slug: "interview-checkpoint",
      file: "05-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Highest earners per department, ties kept",
          prompt: `\`departments(id, name)\` and \`employees(id, name, salary, dept_id)\`:

| department | employees (salary) |
| --- | --- |
| Engineering | Bo 120, Asha 120, Cara 90 |
| Ops | Dev 70 |
| Sales | Eli 80, Fay 85 |
| HR | — |

List the **highest-paid employee(s) of each department** — every employee tied for the top salary. Return \`department\`, \`employee\` and \`salary\`, ordered by \`department\`, then \`employee\`.

\`\`\`text
department | employee | salary
Engineering | Asha | 120
Engineering | Bo | 120
Ops | Dev | 70
Sales | Fay | 85
\`\`\``,
          starter: String.raw`-- department, employee, salary for everyone on their department's top salary — ordered by department, employee.
SELECT d.name AS department, e.name AS employee, MAX(e.salary) AS salary
FROM employees AS e
JOIN departments AS d ON d.id = e.dept_id
GROUP BY d.name
ORDER BY department, employee;
`,
          solution: String.raw`SELECT d.name AS department, e.name AS employee, e.salary
FROM (
  SELECT emp.*,
         RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rk
  FROM employees AS emp
) AS e
JOIN departments AS d ON d.id = e.dept_id
WHERE e.rk = 1
ORDER BY department, employee;
`,
          hints: [
            "The starter selects a name that is not grouped — MySQL would refuse it or pick an arbitrary name.",
            "Rank inside each department with `RANK()` (or `DENSE_RANK()`) ordered by salary descending; ties at the top all get 1.",
            "Alternatively compare each salary with `(SELECT MAX(salary) FROM employees x WHERE x.dept_id = e.dept_id)`.",
          ],
          cases: [
            { stdin: TOP_EARNERS_1, expected: "department | employee | salary\nEngineering | Asha | 120\nEngineering | Bo | 120\nOps | Dev | 70\nSales | Fay | 85\n" },
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), salary INT, dept_id INT);
INSERT INTO departments VALUES (1, 'Lab');
INSERT INTO employees VALUES (1, 'Gil', 40, 1), (2, 'Hana', 40, 1), (3, 'Ian', 40, 1);
`,
              expected: "department | employee | salary\nLab | Gil | 40\nLab | Hana | 40\nLab | Ian | 40\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), salary INT, dept_id INT);
INSERT INTO departments VALUES (1, 'Design'), (2, 'Data');
INSERT INTO employees VALUES (1, 'Jin', 55, 2), (2, 'Kit', 65, 2), (3, 'Lou', 90, 1), (4, 'Mo', 10, 1);
`,
              expected: "department | employee | salary\nData | Kit | 65\nDesign | Lou | 90\n",
              hidden: true,
            },
          ],
        },
        {
          title: "No orders in 2024",
          prompt: `\`customers(id, name)\` and \`orders(id, customer_id, ordered_on)\`:

| customer | order dates |
| --- | --- |
| Asha | 2023-12-31, 2025-01-01 |
| Ben | 2024-06-01 |
| Cara | — |
| Dev | 2024-01-01 |
| Eli | 2024-12-31, 2023-05-05 |

The starter tries an anti-join but returns nothing. Fix it: list the customers who placed **no order dated in 2024** (including those who never ordered at all). One column, \`name\`, ordered by \`name\`.

\`\`\`text
name
Asha
Cara
\`\`\``,
          starter: String.raw`-- Wrong: the date condition is in the wrong place. Fix it.
-- name of every customer with no order in 2024, ordered by name.
SELECT c.name
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.ordered_on >= '2024-01-01' AND o.ordered_on < '2025-01-01'
  AND o.id IS NULL
ORDER BY c.name;
`,
          solution: String.raw`SELECT c.name
FROM customers AS c
LEFT JOIN orders AS o
  ON  o.customer_id = c.id
  AND o.ordered_on >= '2024-01-01'
  AND o.ordered_on <  '2025-01-01'
WHERE o.id IS NULL
ORDER BY c.name;
`,
          hints: [
            "An unmatched row has a NULL `ordered_on`, which can never pass a date condition in WHERE — so the WHERE removes exactly the rows the anti-join keeps.",
            "Move the date range into the LEFT JOIN's ON clause, so it limits which orders can match.",
            "Keep only `o.id IS NULL` in WHERE. `NOT EXISTS` with the date range inside the subquery is the other correct answer.",
          ],
          cases: [
            { stdin: NO_ORDERS_1, expected: "name\nAsha\nCara\n" },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, ordered_on DATE);
INSERT INTO customers VALUES (1, 'Nia'), (2, 'Oto');
`,
              expected: "name\nNia\nOto\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, ordered_on DATE);
INSERT INTO customers VALUES (1, 'Pam'), (2, 'Rex');
INSERT INTO orders VALUES (1, 1, '2024-03-03'), (2, 2, '2024-02-29'), (3, 2, '2022-01-01');
`,
              expected: "name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Duplicate emails, any case",
          prompt: `\`users(id, email)\` was filled by hand, so the same address appears with different capitals and stray spaces.

| id | email |
| --- | --- |
| 1 | a@x.com |
| 2 | A@x.com |
| 3 | ␣a@x.com |
| 4 | b@x.com |
| 5 | c@x.com |
| 6 | C@X.COM |
| 7 | d@x.com␣ |

(␣ marks a space.) Report every address that appears **more than once** once case and surrounding spaces are ignored: the columns \`email\` (lower-cased and trimmed) and \`copies\`, ordered by \`copies\` descending, then \`email\`.

\`\`\`text
email | copies
a@x.com | 3
c@x.com | 2
\`\`\``,
          starter: String.raw`-- email (lower-cased, trimmed), copies — duplicated addresses only, ordered by copies DESC, email.
SELECT email, COUNT(*) AS copies
FROM users
GROUP BY email
ORDER BY copies DESC, email;
`,
          solution: String.raw`SELECT LOWER(TRIM(email)) AS email, COUNT(*) AS copies
FROM users
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY copies DESC, email;
`,
          hints: [
            "Group by the normalised address, not the raw column.",
            "`GROUP BY LOWER(TRIM(email))` — and select the same expression.",
            "Keep only duplicated groups with `HAVING COUNT(*) > 1`.",
          ],
          cases: [
            { stdin: USERS_1, expected: "email | copies\na@x.com | 3\nc@x.com | 2\n" },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(60));
INSERT INTO users VALUES (1, 'p@q.com'), (2, 'r@q.com');
`,
              expected: "email | copies\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(60));
INSERT INTO users VALUES (1, 'Z@q.com'), (2, 'z@q.com'), (3, 'y@q.com'), (4, 'Y@Q.com ');
`,
              expected: "email | copies\ny@q.com | 2\nz@q.com | 2\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which query returns NULL — not an empty result — when there is no second highest salary?",
          options: [
            "`SELECT DISTINCT salary FROM e ORDER BY salary DESC LIMIT 1 OFFSET 1`",
            "`SELECT MAX(salary) FROM e WHERE salary < (SELECT MAX(salary) FROM e)`",
            "`SELECT salary FROM e ORDER BY salary DESC LIMIT 2`",
            "`SELECT salary FROM e WHERE salary = 2`",
          ],
          answer: 1,
          explanation: "An aggregate without GROUP BY always returns one row, NULL when nothing qualifies. The LIMIT/OFFSET form needs a scalar-subquery wrapper to do the same.",
        },
        {
          prompt: "Where should `COUNT(*) >= 2` go in a query that groups orders by customer?",
          options: ["WHERE", "HAVING", "ON", "ORDER BY"],
          answer: 1,
          explanation: "It tests a group, which exists only after GROUP BY. WHERE filters individual rows before grouping and cannot contain aggregates.",
        },
        {
          prompt: "For the points 50, 40, 40, 30 (highest first), what does `RANK()` give?",
          options: ["1, 2, 3, 4", "1, 2, 2, 3", "1, 2, 2, 4", "1, 1, 2, 3"],
          answer: 2,
          explanation: "RANK shares the tie at 2 and skips 3. DENSE_RANK would give 1, 2, 2, 3; ROW_NUMBER 1, 2, 3, 4.",
        },
        {
          prompt: "Which is true of `UNION` compared with `UNION ALL`?",
          options: [
            "UNION keeps duplicates; UNION ALL removes them",
            "UNION removes duplicate rows from the combined result, which costs a sort or hash; UNION ALL keeps every row",
            "They are identical in MySQL",
            "UNION ALL requires the same column names",
          ],
          answer: 1,
          explanation: "Prefer UNION ALL unless removing duplicates is the point — it is faster and never merges two genuine facts into one.",
        },
        {
          prompt: "Why can `SELECT name AS n FROM t WHERE n = 'Ana'` fail?",
          options: [
            "Aliases must be quoted",
            "WHERE is evaluated before the SELECT list, so the alias does not exist yet",
            "`n` is a reserved word",
            "Aliases only work with GROUP BY",
          ],
          answer: 1,
          explanation: "The logical order is FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. ORDER BY can use the alias; WHERE cannot.",
        },
        {
          prompt: "`orders` has 2 rows for a customer and `payments` has 3. After `customers LEFT JOIN orders LEFT JOIN payments`, how many rows does that customer have?",
          options: ["2", "3", "5", "6"],
          answer: 3,
          explanation: "Each order row pairs with each payment row: 2 × 3 = 6. That fan-out is why sums over the result are inflated — aggregate each child first.",
        },
        {
          prompt: "`complaints.customer_id` contains a NULL. What does `WHERE id NOT IN (SELECT customer_id FROM complaints)` return?",
          options: ["Customers without a complaint", "No rows", "Every customer", "An error"],
          answer: 1,
          explanation: "`id <> NULL` is unknown, so the NOT IN can never be true. Use NOT EXISTS or a LEFT JOIN with IS NULL.",
        },
        {
          prompt: "Which statement removes every row of a table but cannot be rolled back in MySQL, and resets AUTO_INCREMENT?",
          options: ["`DELETE FROM t`", "`TRUNCATE TABLE t`", "`DROP TABLE t`", "`DELETE FROM t WHERE 1 = 1`"],
          answer: 1,
          explanation: "TRUNCATE is DDL in MySQL: it recreates the table and commits implicitly. DELETE is transactional and keeps the counter; DROP removes the table itself.",
        },
        {
          prompt: "Which isolation level is InnoDB's default?",
          options: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"],
          answer: 2,
          explanation: "MySQL InnoDB defaults to REPEATABLE READ; PostgreSQL and SQL Server default to READ COMMITTED.",
        },
        {
          prompt: "A table `employees(id, dept_id, dept_name)` with key `id` stores the department's name in every row. Which normal form does it break?",
          options: ["1NF", "2NF", "3NF — `dept_name` depends on `dept_id`, a non-key column", "None"],
          answer: 2,
          explanation: "A transitive dependency (id → dept_id → dept_name) breaks 3NF. The key is a single column, so there is no partial dependency for 2NF to forbid.",
        },
        {
          prompt: "Why is `WHERE YEAR(created_at) = 2024` slower than `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'` on an indexed column?",
          options: [
            "YEAR() is not a MySQL function",
            "Wrapping the column in a function makes the condition non-sargable, so the index cannot be used to seek",
            "The range form returns fewer rows",
            "There is no difference",
          ],
          answer: 1,
          explanation: "The index is sorted by `created_at`, not by `YEAR(created_at)`. A range on the bare column lets the optimiser seek to the first matching row.",
        },
        {
          prompt: "Which ranking function should a \"top three earners per team, exactly three rows each\" question use?",
          options: ["`RANK()`", "`DENSE_RANK()`", "`ROW_NUMBER()` with a tie-breaker in its ORDER BY", "`NTILE(3)`"],
          answer: 2,
          explanation: "Only ROW_NUMBER guarantees exactly N rows; a unique tie-breaker makes the choice between tied rows deterministic. RANK and DENSE_RANK can return more rows when there are ties.",
        },
      ],
    },
  ],
});
