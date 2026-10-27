import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "subqueries",
  title: "Subqueries",
  blurb: "Scalar subqueries and the second-highest salary, IN and EXISTS with multi-column IN and ANY/ALL, correlated subqueries for per-group comparisons and the latest row per group, derived tables that aggregate before joining, and why NOT IN returns nothing when a NULL appears.",
  icon: "layers",
  overview: `A subquery is a query inside another query, and it is how SQL answers questions that need a computed value, list or table before the main question can be asked: who earns more than the average, which customers bought a book, which order is each customer's latest, which customers spend more than the average customer. MySQL 8 accepts a subquery almost anywhere an expression or a table can go, and the optimizer turns many of them into joins — but the meaning, the NULL behaviour and the errors are yours to get right, and interviews test exactly those.

Scalar subqueries covers one-value subqueries in \`WHERE\`, the select list and \`HAVING\`, NULL for no rows, MySQL's "Subquery returns more than 1 row", and the second-highest-salary problem. IN and EXISTS covers membership and existence tests, chaining them across tables, "both A and B" questions, multi-column \`IN\`, and \`ANY\`/\`ALL\`. Correlated subqueries covers subqueries that read the outer row: per-department comparisons, the latest row per group with its ties, per-row counts in the select list, how MySQL runs them and the scope rule that silently correlates a typo. Derived tables covers subqueries in \`FROM\`, the alias rule, aggregates of aggregates, aggregating each child before joining, and \`LATERAL\`. NOT IN and NULL covers three-valued logic, the outer-side NULL, the safe anti joins and the tree-node classification problem.

Every exercise is a query judged on small datasets with the rows that break careless solutions — NULL keys, NULL values, duplicate rows, ties and empty tables. The checkpoint adds products above their category's average, customers with no order in a year, and the top spender of each city.`,
  lessons: [
    {
      slug: "scalar-subqueries",
      file: "01-scalar-subqueries.md",
      exercises: [
        {
          title: "Above the company average",
          prompt: `List the employees whose salary is above the average salary of all employees, with how far above it they are. Employees with a NULL salary are not counted in the average (that is how \`AVG\` behaves) and are never listed.

**Table:** \`employees(id, name, dept, salary)\`.

| id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Eng | 120000 |
| 2 | Ben | Eng | 95000 |
| 3 | Chen | Sales | 70000 |
| 4 | Dina | Sales | 82000 |
| 5 | Esha | Ops | 60000 |

**Output:** columns \`name\`, \`salary\`, \`above_by\` (salary minus the average, \`ROUND\`ed to 2 places), ordered by \`salary\` descending, then \`name\`.

\`\`\`text
name | salary | above_by
Asha | 120000 | 34600
Ben | 95000 | 9600
\`\`\``,
          starter: String.raw`-- Employees paid above the company-wide average, and by how much.
-- Columns: name, salary, above_by (ROUND to 2) — ordered by salary DESC, name.
`,
          solution: String.raw`SELECT name, salary, ROUND(salary - (SELECT AVG(salary) FROM employees), 2) AS above_by
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC, name;
`,
          hints: [
            "`WHERE salary > AVG(salary)` is not allowed — `WHERE` runs before any aggregate exists.",
            "Compute the average in a scalar subquery: `(SELECT AVG(salary) FROM employees)`, and use it both in `WHERE` and in the `above_by` expression.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES (1, 'Asha', 'Eng', 120000), (2, 'Ben', 'Eng', 95000), (3, 'Chen', 'Sales', 70000), (4, 'Dina', 'Sales', 82000), (5, 'Esha', 'Ops', 60000);
`,
              expected: "name | salary | above_by\nAsha | 120000 | 34600\nBen | 95000 | 9600\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES (1, 'Arif', 'x', 10), (2, 'Bina', 'x', 20), (3, 'Cara', 'y', 20), (4, 'Dhruv', 'y', 5);
`,
              expected: "name | salary | above_by\nBina | 20 | 6.25\nCara | 20 | 6.25\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES (1, 'Pia', 'x', 50), (2, 'Quinn', 'x', 50);
`,
              expected: "name | salary | above_by\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES (1, 'Kai', 'x', NULL), (2, 'Lin', 'x', 30), (3, 'Mo', 'x', 10);
`,
              expected: "name | salary | above_by\nLin | 30 | 10\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Second highest salary",
          prompt: `Return the second highest **distinct** salary as a single row. If there is no second distinct salary (one distinct salary, or no employees at all), return one row holding NULL.

**Table:** \`employees(id, name, salary)\`.

| id | name | salary |
| --- | --- | --- |
| 1 | Asha | 120000 |
| 2 | Ben | 95000 |
| 3 | Chen | 70000 |
| 4 | Dina | 82000 |
| 5 | Esha | 60000 |

**Output:** one column \`second_highest\`, one row.

\`\`\`text
second_highest
95000
\`\`\``,
          starter: String.raw`-- The second highest distinct salary, or NULL if there is none. Always exactly one row.
-- Column: second_highest
`,
          solution: String.raw`SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
`,
          hints: [
            "The answer is the largest salary that is smaller than the largest salary.",
            "`MAX(salary) … WHERE salary < (SELECT MAX(salary) FROM employees)` skips every copy of the top salary.",
            "An aggregate with no `GROUP BY` always returns one row — NULL when no row passed the `WHERE`. `ORDER BY … LIMIT 1 OFFSET 1` alone returns no row at all.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT);
INSERT INTO employees VALUES (1, 'Asha', 120000), (2, 'Ben', 95000), (3, 'Chen', 70000), (4, 'Dina', 82000), (5, 'Esha', 60000);
`,
              expected: "second_highest\n95000\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT);
INSERT INTO employees VALUES (1, 'A', 100), (2, 'B', 100), (3, 'C', 90), (4, 'D', 90);
`,
              expected: "second_highest\n90\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT);
INSERT INTO employees VALUES (1, 'A', 100), (2, 'B', 100);
`,
              expected: "second_highest\nNULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT);
`,
              expected: "second_highest\nNULL\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why does `SELECT name FROM employees WHERE salary > AVG(salary);` fail?",
          options: [
            "`AVG` needs a `GROUP BY`",
            "`WHERE` filters rows before aggregation, so an aggregate cannot appear there; compute it in a subquery",
            "`AVG` cannot be compared with an integer",
            "`salary` must be qualified",
          ],
          answer: 1,
          explanation: "MySQL reports *Invalid use of group function*. `WHERE` sees one row at a time, before any aggregate is computed. `WHERE salary > (SELECT AVG(salary) FROM employees)` computes the average first. `HAVING` can use aggregates, but it filters groups, not individual employees.",
        },
        {
          prompt: "`SELECT name FROM employees WHERE salary = (SELECT salary FROM employees WHERE dept = 'Eng');` — Eng has two employees. What does MySQL do?",
          options: [
            "Compares with the first Eng salary",
            "Raises error 1242: Subquery returns more than 1 row",
            "Treats `=` as `IN`",
            "Returns no rows",
          ],
          answer: 1,
          explanation: "A subquery used with `=` must be scalar, and MySQL checks at run time. Use `IN` for a list, or make the subquery return one value (`MAX`, a unique key, `LIMIT 1`). Some engines, SQLite among them, quietly take the first row — do not rely on it.",
        },
        {
          prompt: "Every employee earns 50000. What does this return?\n\n```sql\nSELECT MAX(salary) AS second_highest\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);\n```",
          options: ["No rows", "One row: NULL", "One row: 50000", "An error"],
          answer: 1,
          explanation: "No row passes `salary < 50000`, and an aggregate without `GROUP BY` over no rows returns one row whose `MAX` is NULL. That is exactly the expected \"no second highest\" answer.",
        },
        {
          prompt: "What is the value of `(SELECT salary FROM employees WHERE id = 999)` when no employee has id 999?",
          options: ["0", "NULL", "An empty string", "An error"],
          answer: 1,
          explanation: "A scalar subquery that finds no rows evaluates to NULL. Wrap it in `COALESCE(…, 0)` if a default is needed.",
        },
      ],
    },
    {
      slug: "in-and-exists",
      file: "02-in-and-exists.md",
      exercises: [
        {
          title: "Customers who bought a book",
          prompt: `List the customers who bought at least one product in the category \`'Books'\`, each once.

**Tables:** \`customers(id, name)\`, \`orders(id, customer_id)\`, \`order_items(order_id, product_id)\`, \`products(id, name, category)\`.

| customers.id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ben |
| 3 | Chen |
| 4 | Dina |

| products.id | name | category |
| --- | --- | --- |
| 1 | SQL Guide | Books |
| 2 | Chess | Games |
| 3 | Novel | Books |

| orders.id | customer_id |
| --- | --- |
| 10 | 1 |
| 11 | 1 |
| 12 | 2 |
| 13 | 3 |
| 14 | 4 |

| order_id | product_id |
| --- | --- |
| 10 | 1 |
| 10 | 3 |
| 11 | 1 |
| 12 | 2 |
| 13 | 3 |
| 14 | 2 |

**Output:** columns \`id\`, \`name\`, ordered by \`name\`, then \`id\`.

\`\`\`text
id | name
1 | Asha
3 | Chen
\`\`\``,
          starter: String.raw`-- Customers with at least one Books item in any of their orders, each once.
-- Columns: id, name — ordered by name, id.
`,
          solution: String.raw`SELECT c.id, c.name
FROM customers c
WHERE c.id IN (
  SELECT o.customer_id
  FROM orders o
  WHERE o.id IN (
    SELECT i.order_id
    FROM order_items i
    WHERE i.product_id IN (SELECT p.id FROM products p WHERE p.category = 'Books')
  )
)
ORDER BY c.name, c.id;
`,
          hints: [
            "Work from the inside out: the ids of Books products, then the orders containing them, then the customers who placed those orders.",
            "Each step is an `IN (subquery)` returning one column; duplicates inside do not matter.",
            "A join would list Asha three times (two Books items in one order, one in another) — `IN` lists her once.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT);
CREATE TABLE order_items (order_id INT, product_id INT);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen'), (4, 'Dina');
INSERT INTO products VALUES (1, 'SQL Guide', 'Books'), (2, 'Chess', 'Games'), (3, 'Novel', 'Books');
INSERT INTO orders VALUES (10, 1), (11, 1), (12, 2), (13, 3), (14, 4);
INSERT INTO order_items VALUES (10, 1), (10, 3), (11, 1), (12, 2), (13, 3), (14, 2);
`,
              expected: "id | name\n1 | Asha\n3 | Chen\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT);
CREATE TABLE order_items (order_id INT, product_id INT);
INSERT INTO customers VALUES (1, 'Sam'), (2, 'Sam'), (3, 'Ali');
INSERT INTO products VALUES (1, 'Atlas', 'Books');
INSERT INTO orders VALUES (1, 2), (2, 3), (3, NULL);
INSERT INTO order_items VALUES (1, 1), (3, 1), (2, 7);
`,
              expected: "id | name\n2 | Sam\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category VARCHAR(20));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT);
CREATE TABLE order_items (order_id INT, product_id INT);
INSERT INTO customers VALUES (1, 'Uma');
INSERT INTO products VALUES (1, 'Chess', 'Games');
INSERT INTO orders VALUES (1, 1);
INSERT INTO order_items VALUES (1, 1);
`,
              expected: "id | name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Enrolled in both SQL and Python",
          prompt: `List the students enrolled in **both** \`'SQL'\` and \`'Python'\`. The enrolment table may contain the same (student, course) row twice.

**Tables:** \`students(id, name)\` and \`enrollments(student_id, course)\`.

| students.id | name |
| --- | --- |
| 1 | Anu |
| 2 | Bilal |
| 3 | Chitra |
| 4 | Dev |

| student_id | course |
| --- | --- |
| 1 | SQL |
| 1 | Python |
| 2 | SQL |
| 3 | Python |
| 3 | SQL |
| 3 | Java |
| 4 | Python |

**Output:** one column \`student\`, ordered by \`student\`.

\`\`\`text
student
Anu
Chitra
\`\`\``,
          starter: String.raw`-- Students enrolled in both 'SQL' and 'Python'.
-- Column: student — ordered by student.
`,
          solution: String.raw`SELECT s.name AS student
FROM students s
WHERE s.id IN (SELECT e.student_id FROM enrollments e WHERE e.course = 'SQL')
  AND s.id IN (SELECT e.student_id FROM enrollments e WHERE e.course = 'Python')
ORDER BY student;
`,
          hints: [
            "`WHERE course = 'SQL' AND course = 'Python'` is never true for one row — each row holds one course.",
            "Use one membership test per course, joined with `AND`.",
            "Counting rows per student would be fooled by a duplicated enrolment; two `IN` tests are not.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course VARCHAR(20));
INSERT INTO students VALUES (1, 'Anu'), (2, 'Bilal'), (3, 'Chitra'), (4, 'Dev');
INSERT INTO enrollments VALUES (1, 'SQL'), (1, 'Python'), (2, 'SQL'), (3, 'Python'), (3, 'SQL'), (3, 'Java'), (4, 'Python');
`,
              expected: "student\nAnu\nChitra\n",
            },
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course VARCHAR(20));
INSERT INTO students VALUES (1, 'Xu'), (2, 'Yan');
INSERT INTO enrollments VALUES (1, 'SQL'), (1, 'SQL'), (2, 'SQL'), (2, 'Python'), (2, 'Python');
`,
              expected: "student\nYan\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE enrollments (student_id INT, course VARCHAR(20));
INSERT INTO students VALUES (1, 'Zia');
INSERT INTO enrollments VALUES (1, 'Python'), (2, 'SQL');
`,
              expected: "student\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens with `WHERE id IN (SELECT customer_id, amount FROM orders)`?",
          options: [
            "It matches on either column",
            "An error: the subquery after `IN` must return one column (MySQL: \"Operand should contain 1 column(s)\")",
            "It matches on the first column only",
            "It matches on both columns",
          ],
          answer: 1,
          explanation: "A single value can only be compared with a one-column list. To match on two columns, put a row on the left too: `(id, amount) IN (SELECT customer_id, amount …)`.",
        },
        {
          prompt: "In MySQL 8, which is generally true of `IN (subquery)` and `EXISTS`?",
          options: [
            "`EXISTS` is always much faster",
            "`IN` is always much faster",
            "The optimizer usually turns both into the same semi-join plan, so choose by readability",
            "`IN` cannot use indexes",
          ],
          answer: 2,
          explanation: "The \"EXISTS is faster\" rule comes from MySQL 5.5 and earlier, which ran `IN` subqueries row by row. MySQL 5.6+ and 8 apply semi-join strategies to both.",
        },
        {
          prompt: "Which condition is equivalent to `x IN (SELECT y FROM t)`?",
          options: ["`x = ALL (SELECT y FROM t)`", "`x = ANY (SELECT y FROM t)`", "`x > ANY (SELECT y FROM t)`", "`x <> ALL (SELECT y FROM t)`"],
          answer: 1,
          explanation: "`= ANY` is true when x equals at least one value — the definition of `IN`. `<> ALL` is `NOT IN`, and `= ALL` requires every value to equal x.",
        },
        {
          prompt: "`SELECT name FROM employees WHERE salary > ALL (SELECT salary FROM employees WHERE dept = 'Legal');` — there are no Legal employees. What is returned?",
          options: ["No rows", "Every employee with a non-NULL salary", "An error", "Only the highest-paid employee"],
          answer: 1,
          explanation: "`> ALL` of an empty set is true: there is no value to fail against. Compare `salary > (SELECT MAX(salary) … )`, which compares with NULL and returns no rows — the two forms differ exactly here.",
        },
      ],
    },
    {
      slug: "correlated-subqueries",
      file: "03-correlated-subqueries.md",
      exercises: [
        {
          title: "Above their department's average",
          prompt: `List the employees who earn more than the average salary **of their own department**. Employees with no department (NULL \`dept\`) are not compared and never listed.

**Table:** \`employees(id, name, dept, salary)\`.

| id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Eng | 120000 |
| 2 | Ben | Eng | 95000 |
| 3 | Farid | Eng | 101000 |
| 4 | Gopal | Eng | 110000 |
| 5 | Chen | Sales | 70000 |
| 6 | Dina | Sales | 82000 |
| 7 | Esha | Ops | 60000 |

**Output:** columns \`name\`, \`dept\`, \`salary\`, ordered by \`dept\`, then \`salary\` descending, then \`name\`.

\`\`\`text
name | dept | salary
Asha | Eng | 120000
Gopal | Eng | 110000
Dina | Sales | 82000
\`\`\``,
          starter: String.raw`-- Employees paid above the average of their own department.
-- Columns: name, dept, salary — ordered by dept, salary DESC, name.
`,
          solution: String.raw`SELECT e.name, e.dept, e.salary
FROM employees e
WHERE e.salary > (
  SELECT AVG(x.salary)
  FROM employees x
  WHERE x.dept = e.dept
)
ORDER BY e.dept, e.salary DESC, e.name;
`,
          hints: [
            "The comparison value differs per row: the average of the employee's own department.",
            "Use a second alias inside: `(SELECT AVG(x.salary) FROM employees x WHERE x.dept = e.dept)` — `e.dept` comes from the outer row.",
            "For a NULL `dept`, `x.dept = e.dept` matches nothing, the average is NULL and the comparison is never true — exactly what the prompt asks.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES (1, 'Asha', 'Eng', 120000), (2, 'Ben', 'Eng', 95000), (3, 'Farid', 'Eng', 101000), (4, 'Gopal', 'Eng', 110000), (5, 'Chen', 'Sales', 70000), (6, 'Dina', 'Sales', 82000), (7, 'Esha', 'Ops', 60000);
`,
              expected: "name | dept | salary\nAsha | Eng | 120000\nGopal | Eng | 110000\nDina | Sales | 82000\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES (1, 'Amar', NULL, 100), (2, 'Bea', NULL, 50), (3, 'Cleo', 'Lab', 10), (4, 'Dax', 'Lab', 30);
`,
              expected: "name | dept | salary\nDax | Lab | 30\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20), salary INT);
INSERT INTO employees VALUES (1, 'Ema', 'Ops', 40), (2, 'Fin', 'Ops', 40), (3, 'Gus', 'Art', 7);
`,
              expected: "name | dept | salary\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Each customer's latest order",
          prompt: `For each customer, list their most recent order. If several orders share the latest date, list them all. Customers with no orders are not listed, and orders without a known customer are ignored.

**Tables:** \`customers(id, name)\` and \`orders(id, customer_id, order_date, amount)\`.

| customers.id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ben |
| 3 | Chen |

| orders.id | customer_id | order_date | amount |
| --- | --- | --- | --- |
| 10 | 1 | 2024-01-05 | 250 |
| 11 | 1 | 2024-02-11 | 100 |
| 12 | 2 | 2024-02-20 | 400 |
| 13 | 2 | 2024-02-20 | 50 |
| 14 | 2 | 2024-01-01 | 999 |

**Output:** columns \`customer\`, \`order_id\`, \`order_date\`, \`amount\`, ordered by \`customer\`, then \`order_id\`.

\`\`\`text
customer | order_id | order_date | amount
Asha | 11 | 2024-02-11 | 100
Ben | 12 | 2024-02-20 | 400
Ben | 13 | 2024-02-20 | 50
\`\`\``,
          starter: String.raw`-- Each customer's most recent order(s); ties on the date are all listed.
-- Columns: customer, order_id, order_date, amount — ordered by customer, order_id.
`,
          solution: String.raw`SELECT c.name AS customer, o.id AS order_id, o.order_date, o.amount
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.order_date = (
  SELECT MAX(x.order_date)
  FROM orders x
  WHERE x.customer_id = o.customer_id
)
ORDER BY customer, order_id;
`,
          hints: [
            "An order is the latest if its date equals the maximum date of that same customer's orders.",
            "`WHERE o.order_date = (SELECT MAX(x.order_date) FROM orders x WHERE x.customer_id = o.customer_id)` — a correlated subquery.",
            "Join `customers` for the name; that join also drops orders whose customer is unknown.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen');
INSERT INTO orders VALUES (10, 1, '2024-01-05', 250), (11, 1, '2024-02-11', 100), (12, 2, '2024-02-20', 400), (13, 2, '2024-02-20', 50), (14, 2, '2024-01-01', 999);
`,
              expected: "customer | order_id | order_date | amount\nAsha | 11 | 2024-02-11 | 100\nBen | 12 | 2024-02-20 | 400\nBen | 13 | 2024-02-20 | 50\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Kai');
INSERT INTO orders VALUES (1, 1, '2023-12-31', 5), (2, NULL, '2024-06-01', 7), (3, 1, '2023-01-01', 9);
`,
              expected: "customer | order_id | order_date | amount\nKai | 1 | 2023-12-31 | 5\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, amount INT);
INSERT INTO customers VALUES (1, 'Lea'), (2, 'Max');
`,
              expected: "customer | order_id | order_date | amount\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What makes a subquery *correlated*?",
          options: [
            "It appears in the `WHERE` clause",
            "It refers to a column of the outer query, so its result depends on the current outer row",
            "It uses an aggregate",
            "It joins two tables",
          ],
          answer: 1,
          explanation: "An independent subquery gives the same answer for every row and can run once; a correlated one mentions an outer column (`e.dept`) and is logically evaluated per row. Where it appears and what it computes do not matter.",
        },
        {
          prompt: "`vip` has a column `customer_id` but no column `id`. What does this return?\n\n```sql\nSELECT name FROM customers\nWHERE id IN (SELECT id FROM vip);\n```",
          options: [
            "An error: unknown column `id`",
            "Every customer, as long as `vip` has at least one row",
            "Only the VIP customers",
            "No rows",
          ],
          answer: 1,
          explanation: "The inner `id` is not found in `vip`, so it resolves to the outer `customers.id`. The subquery returns the current customer's own id once per vip row, and `id IN (id, …)` is true. Qualifying it (`SELECT v.id FROM vip v`) would have raised the error.",
        },
        {
          prompt: "A \"latest order per customer\" query uses `WHERE o.order_date = (SELECT MAX(x.order_date) FROM orders x WHERE x.customer_id = o.customer_id)`. A customer has two orders on their latest date. What is returned for them?",
          options: ["The order with the lower id", "Both orders", "Neither", "An error"],
          answer: 1,
          explanation: "Both rows satisfy the condition. To keep exactly one, add a tie-breaker (for example the highest id among them) or use `ROW_NUMBER()`.",
        },
        {
          prompt: "Which index helps most for `WHERE o.order_date = (SELECT MAX(x.order_date) FROM orders x WHERE x.customer_id = o.customer_id)`?",
          options: [
            "An index on `orders(order_date)` alone",
            "An index on `orders(customer_id, order_date)`",
            "An index on `customers(name)`",
            "No index can help a subquery",
          ],
          answer: 1,
          explanation: "Each evaluation looks up one customer's orders and wants their maximum date; a composite index on `(customer_id, order_date)` answers that by reading the last entry for the customer.",
        },
      ],
    },
    {
      slug: "derived-tables",
      file: "04-derived-tables.md",
      exercises: [
        {
          title: "Above the average customer",
          prompt: `Find the customers whose total spend is greater than the **average customer's** total spend. A customer's total is the sum of their orders; only customers who exist and have at least one order take part (in the average and in the list). Orders of unknown customers are ignored entirely.

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
| 11 | 1 | 100 |
| 12 | 2 | 400 |
| 13 | 3 | 50 |
| 14 | 3 | 30 |
| 15 | 9 | 600 |

Totals: Asha 350, Ben 400, Chen 80; the average customer spends 276.67.

**Output:** columns \`customer\`, \`total\`, ordered by \`total\` descending, then \`customer\`.

\`\`\`text
customer | total
Ben | 400
Asha | 350
\`\`\``,
          starter: String.raw`-- Customers whose total spend beats the average customer's total spend.
-- Columns: customer, total — ordered by total DESC, customer.
`,
          solution: String.raw`SELECT c.name AS customer, t.total
FROM customers c
JOIN (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
) AS t ON t.customer_id = c.id
WHERE t.total > (
  SELECT AVG(x.total)
  FROM (
    SELECT o.customer_id, SUM(o.amount) AS total
    FROM orders o
    JOIN customers k ON k.id = o.customer_id
    GROUP BY o.customer_id
  ) AS x
)
ORDER BY t.total DESC, customer;
`,
          hints: [
            "First compute each customer's total in a derived table: `(SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id) AS t`.",
            "`AVG(SUM(amount))` is not allowed — average the totals of a second derived table instead.",
            "The average must leave out customer 9, who does not exist: join the orders to `customers` inside that derived table.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen'), (4, 'Dina');
INSERT INTO orders VALUES (10, 1, 250), (11, 1, 100), (12, 2, 400), (13, 3, 50), (14, 3, 30), (15, 9, 600);
`,
              expected: "customer | total\nBen | 400\nAsha | 350\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Abe'), (2, 'Bo');
INSERT INTO orders VALUES (1, 1, 10), (2, 2, 10);
`,
              expected: "customer | total\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Ola'), (2, 'Ali'), (3, 'Uma');
INSERT INTO orders VALUES (1, 1, 100), (2, 2, 100), (3, 3, 10), (4, NULL, 1000);
`,
              expected: "customer | total\nAli | 100\nOla | 100\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Orders and payments without double counting",
          prompt: `For **every** customer, report the total they ordered, the total they paid, and what they still owe (\`ordered − paid\`). A customer with no orders or no payments shows \`0\` for that side. Joining both tables directly would multiply the rows — aggregate first.

**Tables:** \`customers(id, name)\`, \`orders(id, customer_id, amount)\`, \`payments(id, customer_id, amount)\`.

| customers.id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ben |
| 3 | Chen |

| orders.id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 100 |
| 2 | 1 | 150 |
| 3 | 1 | 50 |
| 4 | 2 | 400 |

| payments.id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 200 |
| 2 | 1 | 50 |
| 3 | 3 | 30 |

**Output:** columns \`customer\`, \`ordered\`, \`paid\`, \`due\`, ordered by \`customer\`, then \`due\`.

\`\`\`text
customer | ordered | paid | due
Asha | 300 | 250 | 50
Ben | 400 | 0 | 400
Chen | 0 | 30 | -30
\`\`\``,
          starter: String.raw`-- Every customer with ordered, paid and due — without the fan-out of joining both child tables.
-- Columns: customer, ordered, paid, due — ordered by customer, due.
`,
          solution: String.raw`SELECT c.name AS customer,
       COALESCE(o.ordered, 0) AS ordered,
       COALESCE(p.paid, 0) AS paid,
       COALESCE(o.ordered, 0) - COALESCE(p.paid, 0) AS due
FROM customers c
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS ordered FROM orders GROUP BY customer_id
) AS o ON o.customer_id = c.id
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS paid FROM payments GROUP BY customer_id
) AS p ON p.customer_id = c.id
ORDER BY customer, due;
`,
          hints: [
            "Joining customers to orders and payments directly gives Asha 3 × 2 = 6 rows and inflates both sums.",
            "Reduce each child to one row per customer first: `(SELECT customer_id, SUM(amount) AS ordered FROM orders GROUP BY customer_id) AS o`, and the same for payments.",
            "Left join both derived tables to `customers` and `COALESCE` the missing sides to 0 before subtracting. `SUM(DISTINCT …)` is not a fix — equal amounts would merge.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
CREATE TABLE payments (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen');
INSERT INTO orders VALUES (1, 1, 100), (2, 1, 150), (3, 1, 50), (4, 2, 400);
INSERT INTO payments VALUES (1, 1, 200), (2, 1, 50), (3, 3, 30);
`,
              expected: "customer | ordered | paid | due\nAsha | 300 | 250 | 50\nBen | 400 | 0 | 400\nChen | 0 | 30 | -30\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
CREATE TABLE payments (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Zed');
`,
              expected: "customer | ordered | paid | due\nZed | 0 | 0 | 0\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
CREATE TABLE payments (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Ira'), (2, 'Ira');
INSERT INTO orders VALUES (1, 1, 50), (2, 1, 50), (3, 2, 20);
INSERT INTO payments VALUES (1, 1, 50), (2, 1, 50), (3, 1, 50);
`,
              expected: "customer | ordered | paid | due\nIra | 100 | 150 | -50\nIra | 20 | 0 | 20\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does MySQL say about `SELECT * FROM (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id);`?",
          options: [
            "It runs normally",
            "Error 1248: Every derived table must have its own alias",
            "Error: `SUM` is not allowed in a subquery",
            "It ignores the subquery",
          ],
          answer: 1,
          explanation: "A subquery in `FROM` needs a name: `… GROUP BY customer_id) AS t`. The aggregate inside is fine.",
        },
        {
          prompt: "How do you compute the average of each customer's total spend?",
          options: [
            "`SELECT AVG(SUM(amount)) FROM orders GROUP BY customer_id`",
            "`SELECT AVG(t.total) FROM (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id) AS t`",
            "`SELECT AVG(amount) FROM orders`",
            "`SELECT SUM(amount) / COUNT(*) FROM orders`",
          ],
          answer: 1,
          explanation: "Aggregates do not nest in one level, so the totals are computed in a derived table and averaged outside. `AVG(amount)` and `SUM/COUNT(*)` are the average *order*, which weights a customer by how many orders they placed.",
        },
        {
          prompt: "An `ORDER BY total DESC` is written inside a derived table, and the outer query has none. What order does the final result have?",
          options: [
            "Descending by total",
            "No guaranteed order — a derived table is a set, and MySQL may ignore an inner ORDER BY without LIMIT",
            "Ascending by total",
            "The order of the primary key",
          ],
          answer: 1,
          explanation: "Only the outermost `ORDER BY` decides the result's order. An inner `ORDER BY` matters only together with `LIMIT` (for example, \"the top three\").",
        },
        {
          prompt: "What does `LATERAL` (MySQL 8.0.14+) allow a derived table to do?",
          options: [
            "Have no alias",
            "Refer to columns of tables listed before it in the same `FROM`, so it is evaluated per row of those tables",
            "Be updated",
            "Be used twice",
          ],
          answer: 1,
          explanation: "An ordinary derived table is computed independently. A lateral one can say `WHERE o.customer_id = c.id`, for example to take each customer's top three orders. SQL Server spells it `CROSS APPLY`.",
        },
      ],
    },
    {
      slug: "not-in-and-null",
      file: "05-not-in-and-null.md",
      exercises: [
        {
          title: "Employees who manage nobody",
          prompt: `List the employees who are nobody's manager. The top of the hierarchy has a NULL \`manager_id\` — so \`id NOT IN (SELECT manager_id FROM employees)\` returns nothing here.

**Table:** \`employees(id, name, manager_id)\`.

| id | name | manager_id |
| --- | --- | --- |
| 1 | Meera | NULL |
| 2 | Arjun | 1 |
| 3 | Kiran | 2 |
| 4 | Leela | 2 |
| 5 | Omar | 1 |

**Output:** columns \`id\`, \`name\`, ordered by \`id\`.

\`\`\`text
id | name
3 | Kiran
4 | Leela
5 | Omar
\`\`\``,
          starter: String.raw`-- Employees whom no other employee reports to (careful: manager_id has a NULL).
-- Columns: id, name — ordered by id.
`,
          solution: String.raw`SELECT e.id, e.name
FROM employees e
WHERE NOT EXISTS (
  SELECT 1 FROM employees r WHERE r.manager_id = e.id
)
ORDER BY e.id;
`,
          hints: [
            "`NOT IN` compares with every value, including Meera's NULL, and `x <> NULL` is unknown — so no row passes.",
            "Ask instead whether a report exists: `NOT EXISTS (SELECT 1 FROM employees r WHERE r.manager_id = e.id)`.",
            "Filtering the NULLs out (`WHERE manager_id IS NOT NULL` inside the subquery) also fixes `NOT IN`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), manager_id INT);
INSERT INTO employees VALUES (1, 'Meera', NULL), (2, 'Arjun', 1), (3, 'Kiran', 2), (4, 'Leela', 2), (5, 'Omar', 1);
`,
              expected: "id | name\n3 | Kiran\n4 | Leela\n5 | Omar\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), manager_id INT);
INSERT INTO employees VALUES (1, 'Solo', NULL);
`,
              expected: "id | name\n1 | Solo\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), manager_id INT);
INSERT INTO employees VALUES (1, 'Ana', NULL), (2, 'Bea', 1), (3, 'Cy', 7);
`,
              expected: "id | name\n2 | Bea\n3 | Cy\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), manager_id INT);
INSERT INTO employees VALUES (1, 'Xi', 2), (2, 'Yu', 1);
`,
              expected: "id | name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Classify the tree nodes",
          prompt: `A tree is stored as \`tree(id, p_id)\`, where \`p_id\` is the parent's id and NULL for the root. Label every node: \`Root\` if it has no parent, \`Inner\` if it has a parent and at least one child, \`Leaf\` otherwise.

**Table:** \`tree(id, p_id)\`.

| id | p_id |
| --- | --- |
| 1 | NULL |
| 2 | 1 |
| 3 | 1 |
| 4 | 2 |
| 5 | 2 |

**Output:** columns \`id\`, \`type\`, ordered by \`id\`.

\`\`\`text
id | type
1 | Root
2 | Inner
3 | Leaf
4 | Leaf
5 | Leaf
\`\`\``,
          starter: String.raw`-- Label each node Root, Inner or Leaf (the root's p_id is NULL).
-- Columns: id, type — ordered by id.
`,
          solution: String.raw`SELECT t.id,
       CASE
         WHEN t.p_id IS NULL THEN 'Root'
         WHEN EXISTS (SELECT 1 FROM tree c WHERE c.p_id = t.id) THEN 'Inner'
         ELSE 'Leaf'
       END AS type
FROM tree t
ORDER BY t.id;
`,
          hints: [
            "Use `CASE`: test for the root first (`p_id IS NULL`), then whether the node has a child.",
            "\"Has a child\" is `EXISTS (SELECT 1 FROM tree c WHERE c.p_id = t.id)`.",
            "A test written as `id NOT IN (SELECT p_id FROM tree)` is never true, because the root's NULL `p_id` is in that list.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE tree (id INT PRIMARY KEY, p_id INT);
INSERT INTO tree VALUES (1, NULL), (2, 1), (3, 1), (4, 2), (5, 2);
`,
              expected: "id | type\n1 | Root\n2 | Inner\n3 | Leaf\n4 | Leaf\n5 | Leaf\n",
            },
            {
              stdin: String.raw`CREATE TABLE tree (id INT PRIMARY KEY, p_id INT);
INSERT INTO tree VALUES (1, NULL);
`,
              expected: "id | type\n1 | Root\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE tree (id INT PRIMARY KEY, p_id INT);
INSERT INTO tree VALUES (3, 2), (1, NULL), (2, 1), (4, 3), (5, 1);
`,
              expected: "id | type\n1 | Root\n2 | Inner\n3 | Inner\n4 | Leaf\n5 | Leaf\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the value of `3 NOT IN (1, 2, NULL)`?",
          options: ["TRUE", "FALSE", "UNKNOWN (NULL)", "An error"],
          answer: 2,
          explanation: "It expands to `3 <> 1 AND 3 <> 2 AND 3 <> NULL` = true AND true AND unknown = unknown. `WHERE` keeps only true, so the row is discarded.",
        },
        {
          prompt: "What is the value of `1 IN (1, NULL)`?",
          options: ["TRUE", "FALSE", "UNKNOWN (NULL)", "An error"],
          answer: 0,
          explanation: "`1 = 1 OR 1 = NULL` = true OR unknown = true. A NULL in the list does not stop `IN` from finding a match; it only makes non-matches unknown instead of false.",
        },
        {
          prompt: "`products.category_id` is NULL for some products. Which query returns those products as \"not in a discontinued category\"?",
          options: [
            "`WHERE category_id NOT IN (SELECT id FROM discontinued)`",
            "`WHERE NOT EXISTS (SELECT 1 FROM discontinued d WHERE d.id = p.category_id)`",
            "Both",
            "Neither",
          ],
          answer: 1,
          explanation: "`NULL NOT IN (…)` is unknown for a non-empty list, so `NOT IN` never returns them. `NOT EXISTS` finds no row equal to NULL and keeps them. (If `discontinued` were empty, both would.)",
        },
        {
          prompt: "Which change makes `WHERE c.id NOT IN (SELECT o.customer_id FROM orders o)` safe when `customer_id` can be NULL?",
          options: [
            "Add `DISTINCT` inside the subquery",
            "Add `WHERE o.customer_id IS NOT NULL` inside the subquery",
            "Write `NOT (c.id IN (…))`",
            "Use `<> ALL` instead",
          ],
          answer: 1,
          explanation: "Removing the NULLs from the list removes the unknown comparison. `DISTINCT` keeps one NULL; `NOT (x IN …)` and `<> ALL` are the same expression as `NOT IN`.",
        },
        {
          prompt: "What does `x NOT IN (SELECT y FROM t)` return when `t` is empty?",
          options: ["TRUE for every row", "FALSE for every row", "UNKNOWN for every row", "TRUE except where x is NULL"],
          answer: 0,
          explanation: "There is nothing to compare with, and an empty `AND` is true — even when x is NULL. The trap needs a NULL in a non-empty list (or a NULL x with a non-empty list).",
        },
      ],
    },
    {
      slug: "subqueries-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Priced above their category average",
          prompt: `List the products priced above the average price of their **own** category.

**Table:** \`products(id, name, category, price)\`.

| id | name | category | price |
| --- | --- | --- | --- |
| 1 | Atlas | Books | 40 |
| 2 | Novel | Books | 15 |
| 3 | Guide | Books | 30 |
| 4 | Chess | Games | 25 |
| 5 | Go | Games | 35 |
| 6 | Dice | Games | 5 |
| 7 | Vinyl | Music | 20 |

**Output:** columns \`product\`, \`category\`, \`price\`, ordered by \`category\`, then \`price\` descending, then \`product\`.

\`\`\`text
product | category | price
Atlas | Books | 40
Guide | Books | 30
Go | Games | 35
Chess | Games | 25
\`\`\``,
          starter: String.raw`-- Products priced above the average price of their own category.
-- Columns: product, category, price — ordered by category, price DESC, product.
`,
          solution: String.raw`SELECT p.name AS product, p.category, p.price
FROM products p
WHERE p.price > (
  SELECT AVG(x.price) FROM products x WHERE x.category = p.category
)
ORDER BY p.category, p.price DESC, product;
`,
          hints: [
            "A correlated subquery: `(SELECT AVG(x.price) FROM products x WHERE x.category = p.category)`.",
            "A derived table of per-category averages joined on `category` works too.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category VARCHAR(20), price INT);
INSERT INTO products VALUES (1, 'Atlas', 'Books', 40), (2, 'Novel', 'Books', 15), (3, 'Guide', 'Books', 30), (4, 'Chess', 'Games', 25), (5, 'Go', 'Games', 35), (6, 'Dice', 'Games', 5), (7, 'Vinyl', 'Music', 20);
`,
              expected: "product | category | price\nAtlas | Books | 40\nGuide | Books | 30\nGo | Games | 35\nChess | Games | 25\n",
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category VARCHAR(20), price INT);
INSERT INTO products VALUES (1, 'Bolt', 'Parts', 10), (2, 'Axle', 'Parts', 10), (3, 'Cog', 'Parts', 1);
`,
              expected: "product | category | price\nAxle | Parts | 10\nBolt | Parts | 10\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), category VARCHAR(20), price INT);
INSERT INTO products VALUES (1, 'Kite', 'Toys', 12), (2, 'Lamp', 'Home', 30);
`,
              expected: "product | category | price\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "No order in 2024",
          prompt: `List the customers who placed **no** order dated in 2024 (orders in other years do not count). Some orders have no customer (NULL \`customer_id\`).

**Tables:** \`customers(id, name)\` and \`orders(id, customer_id, order_date)\`.

| customers.id | name |
| --- | --- |
| 1 | Asha |
| 2 | Ben |
| 3 | Chen |
| 4 | Dina |

| orders.id | customer_id | order_date |
| --- | --- | --- |
| 10 | 1 | 2024-03-01 |
| 11 | 2 | 2023-12-31 |
| 12 | 2 | 2025-01-01 |
| 13 | NULL | 2024-05-05 |
| 14 | 4 | 2024-12-31 |

**Output:** columns \`id\`, \`name\`, ordered by \`id\`.

\`\`\`text
id | name
2 | Ben
3 | Chen
\`\`\``,
          starter: String.raw`-- Customers with no order dated in 2024 (careful with the NULL customer_id).
-- Columns: id, name — ordered by id.
`,
          solution: String.raw`SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.id
    AND o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'
)
ORDER BY c.id;
`,
          hints: [
            "The year is part of what counts as a match, so it goes inside the subquery.",
            "Order 13 has a NULL customer and a 2024 date — `NOT IN` over 2024 orders' customer ids would return nothing.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen'), (4, 'Dina');
INSERT INTO orders VALUES (10, 1, '2024-03-01'), (11, 2, '2023-12-31'), (12, 2, '2025-01-01'), (13, NULL, '2024-05-05'), (14, 4, '2024-12-31');
`,
              expected: "id | name\n2 | Ben\n3 | Chen\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE);
INSERT INTO customers VALUES (1, 'Rhea'), (2, 'Sid');
`,
              expected: "id | name\n1 | Rhea\n2 | Sid\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE);
INSERT INTO customers VALUES (1, 'Rhea');
INSERT INTO orders VALUES (1, 1, '2024-01-01'), (2, NULL, '2024-02-02');
`,
              expected: "id | name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Top spender in each city",
          prompt: `For each city, find the customer (or customers, if tied) with the highest total spend. Only customers with at least one order take part; customers with no city are ignored, and orders of unknown customers are ignored.

**Tables:** \`customers(id, name, city)\` and \`orders(id, customer_id, amount)\`.

| customers.id | name | city |
| --- | --- | --- |
| 1 | Asha | Pune |
| 2 | Ben | Delhi |
| 3 | Chen | Pune |
| 4 | Dina | Delhi |
| 5 | Eli | Kochi |

| orders.id | customer_id | amount |
| --- | --- | --- |
| 1 | 1 | 200 |
| 2 | 1 | 100 |
| 3 | 3 | 250 |
| 4 | 2 | 90 |
| 5 | 4 | 60 |
| 6 | 4 | 30 |
| 7 | 9 | 1000 |

**Output:** columns \`city\`, \`customer\`, \`total\`, ordered by \`city\`, then \`customer\`.

\`\`\`text
city | customer | total
Delhi | Ben | 90
Delhi | Dina | 90
Pune | Asha | 300
\`\`\``,
          starter: String.raw`-- The highest-spending customer(s) of each city.
-- Columns: city, customer, total — ordered by city, customer.
`,
          solution: String.raw`SELECT t.city, t.name AS customer, t.total
FROM (
  SELECT c.id, c.name, c.city, SUM(o.amount) AS total
  FROM customers c
  JOIN orders o ON o.customer_id = c.id
  GROUP BY c.id, c.name, c.city
) AS t
JOIN (
  SELECT x.city, MAX(x.total) AS top
  FROM (
    SELECT c.city, SUM(o.amount) AS total
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id, c.city
  ) AS x
  GROUP BY x.city
) AS m ON m.city = t.city AND m.top = t.total
ORDER BY t.city, customer;
`,
          hints: [
            "Step 1: a derived table of each customer's total, with their city.",
            "Step 2: from those totals, the maximum per city — another derived table grouped by city.",
            "Join the two on city and total; ties stay, and a NULL city matches nothing.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Asha', 'Pune'), (2, 'Ben', 'Delhi'), (3, 'Chen', 'Pune'), (4, 'Dina', 'Delhi'), (5, 'Eli', 'Kochi');
INSERT INTO orders VALUES (1, 1, 200), (2, 1, 100), (3, 3, 250), (4, 2, 90), (5, 4, 60), (6, 4, 30), (7, 9, 1000);
`,
              expected: "city | customer | total\nDelhi | Ben | 90\nDelhi | Dina | 90\nPune | Asha | 300\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Ann', NULL), (2, 'Bob', 'Goa');
INSERT INTO orders VALUES (1, 1, 500), (2, 2, 5);
`,
              expected: "city | customer | total\nGoa | Bob | 5\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), city VARCHAR(40));
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);
INSERT INTO customers VALUES (1, 'Cara', 'Agra'), (2, 'Dev', 'Agra');
INSERT INTO orders VALUES (1, 2, 40), (2, 2, 5), (3, 1, 44);
`,
              expected: "city | customer | total\nAgra | Dev | 45\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Where may a scalar subquery appear?",
          options: [
            "Only in `WHERE`",
            "Anywhere a single value may: `WHERE`, the select list, `HAVING`, inside expressions",
            "Only in `FROM`",
            "Only after `IN`",
          ],
          answer: 1,
          explanation: "A scalar subquery is an expression whose value is one value. A subquery in `FROM` is a derived table, and one after `IN` may return many rows.",
        },
        {
          prompt: "Which query returns the second highest distinct salary, or NULL when there is none?",
          options: [
            "`SELECT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1`",
            "`SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)`",
            "`SELECT MAX(salary) - 1 FROM employees`",
            "`SELECT MIN(salary) FROM employees`",
          ],
          answer: 1,
          explanation: "The `MAX … <` form skips every copy of the top salary and returns NULL (one row) when nothing is left. The `LIMIT` form returns a duplicate of the top when it is tied, and no row at all when there is no second salary.",
        },
        {
          prompt: "A subquery used with `=` returns two rows in MySQL. What happens?",
          options: [
            "The first row is used",
            "Error 1242: Subquery returns more than 1 row",
            "The comparison is false",
            "The comparison is NULL",
          ],
          answer: 1,
          explanation: "MySQL checks scalar subqueries at run time. Make the subquery return one value, or use `IN` if a list was intended.",
        },
        {
          prompt: "Which is the clearest way to find students enrolled in both 'SQL' and 'Python'?",
          options: [
            "`… JOIN enrollments e … WHERE e.course = 'SQL' AND e.course = 'Python'`",
            "`WHERE id IN (… course = 'SQL') AND id IN (… course = 'Python')`",
            "`WHERE id IN (… course IN ('SQL', 'Python'))`",
            "`WHERE EXISTS (SELECT 1 FROM enrollments)`",
          ],
          answer: 1,
          explanation: "Two membership tests, one per course. One row cannot hold both courses, `course IN (…)` means \"either\", and an uncorrelated `EXISTS` is true for everyone.",
        },
        {
          prompt: "What does `EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)` check?",
          options: [
            "Whether the subquery returns the value 1",
            "Whether at least one order of customer `c` exists",
            "Whether customer `c` has exactly one order",
            "Whether `orders` has any row at all",
          ],
          answer: 1,
          explanation: "`EXISTS` is true when the subquery returns any row; the select list is irrelevant. The correlation `o.customer_id = c.id` ties it to the current customer.",
        },
        {
          prompt: "Which subquery is correlated?",
          options: [
            "`(SELECT AVG(salary) FROM employees)`",
            "`(SELECT AVG(x.salary) FROM employees x WHERE x.dept = e.dept)`",
            "`(SELECT MAX(order_date) FROM orders)`",
            "`(SELECT id FROM products WHERE category = 'Books')`",
          ],
          answer: 1,
          explanation: "It refers to `e.dept`, a column of the outer query, so its value changes per outer row. The others mention only their own tables.",
        },
        {
          prompt: "Why qualify every column inside a subquery, as in `SELECT v.customer_id FROM vip v`?",
          options: [
            "MySQL requires it",
            "An unqualified column missing from the inner table silently resolves to the outer query, turning a typo into a wrong answer instead of an error",
            "It makes the subquery faster",
            "It avoids the NOT IN trap",
          ],
          answer: 1,
          explanation: "Name resolution looks inside first, then outside. Qualified names make a missing column an error.",
        },
        {
          prompt: "Customers have orders and payments. Which approach gives correct totals of both per customer?",
          options: [
            "Join customers, orders and payments, then `SUM` both",
            "Join per-customer aggregates of orders and of payments, each computed in its own derived table",
            "`SUM(DISTINCT o.amount)` and `SUM(DISTINCT p.amount)` over the three-way join",
            "`COUNT(*)` instead of `SUM`",
          ],
          answer: 1,
          explanation: "Each derived table has one row per customer, so nothing multiplies. The direct join fans out, and `SUM(DISTINCT …)` merges different rows with equal amounts.",
        },
        {
          prompt: "What is wrong with `SELECT * FROM (SELECT dept, AVG(salary) FROM employees GROUP BY dept);` in MySQL?",
          options: [
            "Nothing",
            "The derived table has no alias (error 1248), and its computed column has no name",
            "`AVG` cannot be used in a subquery",
            "`GROUP BY` is not allowed in a subquery",
          ],
          answer: 1,
          explanation: "Write `(SELECT dept, AVG(salary) AS avg_salary FROM employees GROUP BY dept) AS d` and refer to `d.avg_salary` outside.",
        },
        {
          prompt: "`orders.customer_id` contains a NULL. What does `WHERE c.id NOT IN (SELECT customer_id FROM orders)` return?",
          options: ["The customers without orders", "No rows", "Every customer", "An error"],
          answer: 1,
          explanation: "Every `NOT IN` test includes `c.id <> NULL`, which is unknown, so no row's condition is true. Use `NOT EXISTS` or filter out the NULLs inside.",
        },
        {
          prompt: "Which anti join is correct whatever NULLs the linking column holds?",
          options: [
            "`WHERE x NOT IN (SELECT y FROM t)`",
            "`WHERE NOT EXISTS (SELECT 1 FROM t WHERE t.y = outer.x)`",
            "`WHERE x <> ALL (SELECT y FROM t)`",
            "`WHERE NOT (x IN (SELECT y FROM t))`",
          ],
          answer: 1,
          explanation: "`NOT EXISTS` asks whether a matching row exists; NULL never matches, so no unknown leaks into the result. The other three are all the same `NOT IN` comparison.",
        },
        {
          prompt: "In the tree-node problem, why is `WHEN id NOT IN (SELECT p_id FROM tree) THEN 'Leaf'` wrong?",
          options: [
            "`CASE` cannot contain a subquery",
            "The root's `p_id` is NULL, so `NOT IN` is never true and no node is ever labelled Leaf",
            "It labels the root as Leaf",
            "It is correct",
          ],
          answer: 1,
          explanation: "The list of parent ids contains the root's NULL, so `id NOT IN (…)` is unknown for every node that is not a parent, and `CASE` falls through. `NOT EXISTS (SELECT 1 FROM tree c WHERE c.p_id = t.id)` is correct.",
        },
      ],
    },
  ],
});
