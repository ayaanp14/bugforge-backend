import { defineModule } from "../../dsl.js";

/** A setup script: the CREATE TABLE, then one INSERT with every row (none for an empty table). */
const setup = (create: string, table: string, rows: string[]) =>
  `${create.trim()}\n` + (rows.length ? `INSERT INTO ${table} VALUES\n  ${rows.join(",\n  ")};\n` : "");

const BOOKS = `CREATE TABLE books (
  book_id INT PRIMARY KEY,
  title   VARCHAR(100) NOT NULL,
  author  VARCHAR(60),
  year    INT
);`;
const TASKS = `CREATE TABLE tasks (
  id    INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  done  INT NOT NULL DEFAULT 0
);`;
const EMPLOYEES = `CREATE TABLE employees (
  emp_id     INT PRIMARY KEY,
  first_name VARCHAR(40) NOT NULL,
  last_name  VARCHAR(40)
);`;
const PRODUCTS = `CREATE TABLE products (
  product_id INT PRIMARY KEY,
  name       VARCHAR(60) NOT NULL,
  price      INT NOT NULL
);`;
const CUSTOMERS = `CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  name        VARCHAR(60) NOT NULL,
  email       VARCHAR(100),
  city        VARCHAR(40),
  joined      DATE
);`;
const ORDER_ITEMS = `CREATE TABLE order_items (
  item_id INT PRIMARY KEY,
  name    VARCHAR(60) NOT NULL,
  price   INT NOT NULL,
  qty     INT NOT NULL
);`;
const STUDENTS = `CREATE TABLE students (
  id    INT PRIMARY KEY,
  name  VARCHAR(60) NOT NULL,
  score INT
);`;
const COURSES = `CREATE TABLE courses (
  course_id INT PRIMARY KEY,
  code      VARCHAR(10) NOT NULL,
  title     VARCHAR(80) NOT NULL,
  credits   INT NOT NULL
);`;
const ENROLLED = `CREATE TABLE students (
  student_id INT PRIMARY KEY,
  name       VARCHAR(60) NOT NULL,
  branch     VARCHAR(10),
  credits    INT NOT NULL
);`;
const ORDERS = `CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer VARCHAR(60) NOT NULL,
  amount   INT NOT NULL,
  discount INT NOT NULL DEFAULT 0
);`;

export default defineModule(import.meta.url, {
  slug: "foundations",
  title: "Foundations",
  blurb: "what a relational database is — tables, typed columns, rows without order, primary and foreign keys; SQL as a declarative language and its statement families; MySQL beside PostgreSQL, SQLite and SQL Server; the first SELECT; and the logical order a query's clauses run in.",
  icon: "disk",
  overview: `Before the first query it pays to know what you are talking to. A relational database keeps data in tables — named, typed columns and a set of rows with no order of their own — and ties tables together with keys: a primary key that identifies each row, foreign keys that point at another table's rows so each fact is stored once. The database management system underneath stores those tables, checks every write against their rules, answers queries through indexes, runs transactions and keeps many users out of each other's way. SQL is the language for all of it: declarative, so a statement describes the rows it wants and the optimizer decides how to find them.

What a database is covers tables, rows and columns, schema and data, primary and foreign keys, the DBMS's jobs and why a spreadsheet is not one. What SQL is covers declarative versus imperative, the statement families DDL, DML, DQL, DCL and TCL, statements and scripts, case, quotes and comments. MySQL and other databases covers the family — MySQL, MariaDB, PostgreSQL, SQLite, SQL Server, Oracle — and the seams between their dialects: \`LIMIT\` versus \`TOP\` versus \`FETCH FIRST\`, \`CONCAT\` versus \`||\`, quoting, auto-numbered ids, NULL helpers, dates and case-insensitive comparison. Your first SELECT covers choosing columns, \`SELECT *\` and its costs, \`ORDER BY\` for a dependable order, \`SELECT\` without a table and literals beside columns. How a query runs covers the logical order of the clauses — FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT — what it means for aliases, and the parser, optimizer and executor behind it.

The course teaches MySQL 8, and every exercise is a query judged against tables that a setup script builds — the input you see beside the editor. The exercises read whole tables in a fixed order, count rows, insert a row and read the result, run two statements as one script, build full names with \`CONCAT\`, take a top three with \`LIMIT\`, choose and reorder columns, and filter on an expression while sorting by its alias. The checkpoint asks for a table read back in order, a report with literal and computed columns, and a filtered list sorted on a computed value with a tie-breaker.`,
  lessons: [
    {
      slug: "what-is-a-database",
      file: "01-what-is-a-database.md",
      exercises: [
        {
          title: "Show the whole table",
          prompt: `The table \`books\` holds a small library catalogue:

| book_id | title | author | year |
| --- | --- | --- | --- |
| 3 | Clean Code | Robert Martin | 2008 |
| 1 | The Pragmatic Programmer | Andy Hunt | 1999 |
| 2 | Refactoring | Martin Fowler | 1999 |

Return **every column** of every book, ordered by \`book_id\` ascending. The rows were inserted out of order, so the order must come from your query.

**Output:** the columns \`book_id | title | author | year\`, one row a book, by \`book_id\`.

\`\`\`text
book_id | title | author | year
1 | The Pragmatic Programmer | Andy Hunt | 1999
2 | Refactoring | Martin Fowler | 1999
3 | Clean Code | Robert Martin | 2008
\`\`\``,
          starter: String.raw`-- Return every column of books, ordered by book_id.
`,
          solution: String.raw`SELECT *
FROM books
ORDER BY book_id;
`,
          hints: [
            "`*` stands for every column, in the table's own order.",
            "A table has no row order of its own — end the query with `ORDER BY book_id`.",
          ],
          cases: [
            {
              stdin: setup(BOOKS, "books", ["(3, 'Clean Code', 'Robert Martin', 2008)", "(1, 'The Pragmatic Programmer', 'Andy Hunt', 1999)", "(2, 'Refactoring', 'Martin Fowler', 1999)"]),
              expected: "book_id | title | author | year\n1 | The Pragmatic Programmer | Andy Hunt | 1999\n2 | Refactoring | Martin Fowler | 1999\n3 | Clean Code | Robert Martin | 2008\n",
            },
            {
              stdin: setup(BOOKS, "books", ["(20, 'Database Internals', 'Alex Petrov', 2019)", "(7, 'SQL Antipatterns', NULL, NULL)", "(11, 'Designing Data-Intensive Applications', 'Martin Kleppmann', 2017)", "(8, 'Learning SQL', 'Alan Beaulieu', 2020)"]),
              expected: "book_id | title | author | year\n7 | SQL Antipatterns | NULL | NULL\n8 | Learning SQL | Alan Beaulieu | 2020\n11 | Designing Data-Intensive Applications | Martin Kleppmann | 2017\n20 | Database Internals | Alex Petrov | 2019\n",
              hidden: true,
            },
            {
              stdin: setup(BOOKS, "books", []),
              expected: "book_id | title | author | year\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Count the rows",
          prompt: `Using the same \`books\` table, return how many books the catalogue holds, as one column named \`total_books\`.

| book_id | title | author | year |
| --- | --- | --- | --- |
| 3 | Clean Code | Robert Martin | 2008 |
| 1 | The Pragmatic Programmer | Andy Hunt | 1999 |
| 2 | Refactoring | Martin Fowler | 1999 |

**Output:** one row, one column \`total_books\`.

\`\`\`text
total_books
3
\`\`\``,
          starter: String.raw`-- Return the number of rows in books, as total_books.
`,
          solution: String.raw`SELECT COUNT(*) AS total_books
FROM books;
`,
          hints: [
            "`COUNT(*)` counts rows.",
            "Name the result column with `AS total_books`.",
            "A count always returns exactly one row — 0 for an empty table — so no `ORDER BY` is needed.",
          ],
          cases: [
            {
              stdin: setup(BOOKS, "books", ["(3, 'Clean Code', 'Robert Martin', 2008)", "(1, 'The Pragmatic Programmer', 'Andy Hunt', 1999)", "(2, 'Refactoring', 'Martin Fowler', 1999)"]),
              expected: "total_books\n3\n",
            },
            { stdin: setup(BOOKS, "books", []), expected: "total_books\n0\n", hidden: true },
            {
              stdin: setup(BOOKS, "books", ["(1, 'A', NULL, NULL)", "(2, 'B', NULL, NULL)", "(3, 'C', 'X', 2001)", "(4, 'D', NULL, 1990)", "(5, 'E', 'Y', NULL)", "(6, 'F', 'Z', 2024)", "(7, 'G', NULL, NULL)"]),
              expected: "total_books\n7\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In a relational table, what does one **row** represent?",
          options: ["One attribute shared by every record", "One record — for example one student", "The table's schema", "One index entry"],
          answer: 1,
          explanation: "A row is one record with a value for each column. A column is one attribute across all records; the schema is the column list and types.",
        },
        {
          prompt: "Which two properties must a **primary key** have?",
          options: ["Unique and indexed", "Unique and never NULL", "Numeric and auto-incremented", "Not NULL and pointing at another table"],
          answer: 1,
          explanation: "A primary key identifies exactly one row, so its value must be unique and present in every row. It is usually an auto-numbered integer, but it need not be; pointing at another table is what a foreign key does.",
        },
        {
          prompt: "`orders.customer_id` holds values of `customers.id`. What is `orders.customer_id`?",
          options: ["A primary key", "A foreign key", "An index", "A duplicate of the customer's data"],
          answer: 1,
          explanation: "A foreign key refers to another table's primary key. It stores the relationship, not a copy of the customer's details — those stay in `customers`, stored once.",
        },
        {
          prompt: "You run `SELECT * FROM students` twice and get the rows in the same order. What does SQL guarantee about the order next time?",
          options: ["The same order, always", "Insertion order", "Primary-key order", "Nothing — only `ORDER BY` fixes an order"],
          answer: 3,
          explanation: "A table is a set of rows with no inherent order. The engine returns rows in whatever order is cheapest, which can change after inserts, deletes or a new index. Only `ORDER BY` guarantees one.",
        },
        {
          prompt: "Which job belongs to the **DBMS** rather than to the data?",
          options: ["Holding the students' names", "Refusing an insert that duplicates a primary key", "Being a table", "Having columns"],
          answer: 1,
          explanation: "The database is the data; the DBMS is the software that stores it, enforces constraints, runs queries and transactions, and manages concurrent users.",
        },
      ],
    },
    {
      slug: "what-is-sql",
      file: "02-what-is-sql.md",
      exercises: [
        {
          title: "Add a task, then read the list",
          prompt: `The table \`tasks\` holds a to-do list (\`done\` is 1 for finished, 0 for open):

| id | title | done |
| --- | --- | --- |
| 1 | Buy milk | 1 |
| 2 | Call Ravi | 0 |

Write a script of **two statements**: first insert a task with \`id\` 100, title \`Review notes\` and \`done\` 0; then return \`id\`, \`title\` and \`done\` for every task, ordered by \`id\`.

**Output:** the second statement's result (an \`INSERT\` prints nothing).

\`\`\`text
id | title | done
1 | Buy milk | 1
2 | Call Ravi | 0
100 | Review notes | 0
\`\`\``,
          starter: String.raw`-- 1. Insert the task (100, 'Review notes', 0) into tasks.
-- 2. Return id, title, done for every task, ordered by id.
`,
          solution: String.raw`INSERT INTO tasks (id, title, done) VALUES (100, 'Review notes', 0);

SELECT id, title, done
FROM tasks
ORDER BY id;
`,
          hints: [
            "`INSERT INTO tasks (id, title, done) VALUES (…);` — strings in single quotes, numbers bare.",
            "End the insert with a semicolon, then write the `SELECT`.",
            "Order by `id` so the new row lands at the end.",
          ],
          cases: [
            {
              stdin: setup(TASKS, "tasks", ["(1, 'Buy milk', 1)", "(2, 'Call Ravi', 0)"]),
              expected: "id | title | done\n1 | Buy milk | 1\n2 | Call Ravi | 0\n100 | Review notes | 0\n",
            },
            { stdin: setup(TASKS, "tasks", []), expected: "id | title | done\n100 | Review notes | 0\n", hidden: true },
            {
              stdin: setup(TASKS, "tasks", ["(150, 'Pay rent', 0)", "(7, 'Book tickets', 1)", "(99, 'Water plants', 0)"]),
              expected: "id | title | done\n7 | Book tickets | 1\n99 | Water plants | 0\n100 | Review notes | 0\n150 | Pay rent | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Two queries, two results",
          prompt: `Using the \`tasks\` table, write a script of **two SELECTs**: the first returns the number of tasks as \`total_tasks\`; the second returns every task's \`title\`, ordered alphabetically by \`title\`.

| id | title | done |
| --- | --- | --- |
| 1 | Pay rent | 1 |
| 2 | Call Ravi | 0 |
| 3 | Buy milk | 0 |

**Output:** both result sets, in order, separated by a blank line.

\`\`\`text
total_tasks
3

title
Buy milk
Call Ravi
Pay rent
\`\`\``,
          starter: String.raw`-- 1. Return the number of tasks as total_tasks.
-- 2. Return every title, in alphabetical order.
`,
          solution: String.raw`SELECT COUNT(*) AS total_tasks
FROM tasks;

SELECT title
FROM tasks
ORDER BY title;
`,
          hints: [
            "Each `SELECT` prints its own result; separate the statements with `;`.",
            "`COUNT(*) AS total_tasks` for the first; `ORDER BY title` for the second.",
          ],
          cases: [
            {
              stdin: setup(TASKS, "tasks", ["(1, 'Pay rent', 1)", "(2, 'Call Ravi', 0)", "(3, 'Buy milk', 0)"]),
              expected: "total_tasks\n3\n\ntitle\nBuy milk\nCall Ravi\nPay rent\n",
            },
            { stdin: setup(TASKS, "tasks", []), expected: "total_tasks\n0\n\ntitle\n(no rows)\n", hidden: true },
            {
              stdin: setup(TASKS, "tasks", ["(4, 'Water plants', 0)", "(5, 'Book tickets', 1)", "(6, 'Book tickets', 0)", "(9, 'Answer mail', 1)"]),
              expected: "total_tasks\n4\n\ntitle\nAnswer mail\nBook tickets\nBook tickets\nWater plants\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is SQL called **declarative**?",
          options: ["Because every statement starts with a keyword", "Because a query describes the result and the database chooses how to compute it", "Because tables must be declared before use", "Because it has no loops or variables at all"],
          answer: 1,
          explanation: "`SELECT name FROM students WHERE city = 'Pune'` never says whether to scan or use an index — the optimizer decides. That is the meaning of declarative. Declaring tables is DDL, a different idea.",
        },
        {
          prompt: "`CREATE`, `ALTER` and `DROP` belong to which family?",
          options: ["DML", "DDL", "DCL", "TCL"],
          answer: 1,
          explanation: "Data Definition Language changes the structure — tables, indexes, views. DML (`INSERT`/`UPDATE`/`DELETE`) changes rows, DCL (`GRANT`/`REVOKE`) permissions, TCL (`COMMIT`/`ROLLBACK`) transactions.",
        },
        {
          prompt: "Which is the **portable** way to write the string Pune in a condition?",
          options: ["`city = \"Pune\"`", "`city = 'Pune'`", "`` city = `Pune` ``", "`city = Pune`"],
          answer: 1,
          explanation: "Strings take single quotes in standard SQL and every major database. MySQL also accepts double-quoted strings by default, but PostgreSQL and SQLite read `\"Pune\"` as a column name; backticks quote identifiers in MySQL; a bare word is a column name.",
        },
        {
          prompt: "How do you write the text *it's* as a SQL string literal in standard SQL?",
          options: ["`'it's'`", "`'it''s'`", "`\"it\"s\"`", "`it's`"],
          answer: 1,
          explanation: "A single quote inside a single-quoted string is doubled. `'it's'` ends the string after *it*; MySQL also accepts a backslash escape (`'it\\'s'`), but other databases do not.",
        },
        {
          prompt: "Which statement about case is true in MySQL?",
          options: ["`select` and `SELECT` are different keywords", "Keywords are case-insensitive; text comparison follows the column's collation", "Column names are case-sensitive on every system", "String comparison is always case-sensitive"],
          answer: 1,
          explanation: "Keywords never depend on case. Column names in MySQL are case-insensitive; table names follow the file system. Whether `'pune' = 'Pune'` is true depends on the collation — MySQL's defaults are case-insensitive.",
        },
      ],
    },
    {
      slug: "mysql-and-other-databases",
      file: "03-mysql-and-other-databases.md",
      exercises: [
        {
          title: "Full names with CONCAT",
          prompt: `The table \`employees\`:

| emp_id | first_name | last_name |
| --- | --- | --- |
| 1 | Asha | Rao |
| 2 | Vikram | Singh |
| 3 | Leela | Iyer |

Return each employee's full name — first name, one space, last name — as \`full_name\`, ordered by \`emp_id\`. Use MySQL's spelling (in MySQL \`||\` is not concatenation). If a last name is missing, MySQL's \`CONCAT\` returns \`NULL\` — let it.

**Output:** one column \`full_name\`, by \`emp_id\`.

\`\`\`text
full_name
Asha Rao
Vikram Singh
Leela Iyer
\`\`\``,
          starter: String.raw`-- Return CONCAT of first_name, a space and last_name as full_name, ordered by emp_id.
`,
          solution: String.raw`SELECT CONCAT(first_name, ' ', last_name) AS full_name
FROM employees
ORDER BY emp_id;
`,
          hints: [
            "`CONCAT(a, b, c)` joins any number of strings; the space is the literal `' '`.",
            "Name the column with `AS full_name` and order by `emp_id`.",
            "Any NULL argument makes `CONCAT` return NULL — that is the expected output for a missing last name.",
          ],
          cases: [
            {
              stdin: setup(EMPLOYEES, "employees", ["(1, 'Asha', 'Rao')", "(2, 'Vikram', 'Singh')", "(3, 'Leela', 'Iyer')"]),
              expected: "full_name\nAsha Rao\nVikram Singh\nLeela Iyer\n",
            },
            {
              stdin: setup(EMPLOYEES, "employees", ["(12, 'Kiran', NULL)", "(5, 'Neha', 'Joshi')", "(9, 'Arjun', 'Menon')"]),
              expected: "full_name\nNeha Joshi\nArjun Menon\nNULL\n",
              hidden: true,
            },
            { stdin: setup(EMPLOYEES, "employees", []), expected: "full_name\n(no rows)\n", hidden: true },
          ],
        },
        {
          title: "Top three with LIMIT",
          prompt: `The table \`products\`:

| product_id | name | price |
| --- | --- | --- |
| 1 | Keyboard | 1500 |
| 2 | Monitor | 9000 |
| 3 | Mouse | 600 |
| 4 | Webcam | 2500 |
| 5 | Headset | 2500 |

Return the \`name\` and \`price\` of the three most expensive products — the MySQL way. When two products cost the same, the smaller \`product_id\` comes first.

**Output:** \`name | price\`, at most three rows, by \`price\` descending then \`product_id\`.

\`\`\`text
name | price
Monitor | 9000
Webcam | 2500
Headset | 2500
\`\`\``,
          starter: String.raw`-- Return name and price of the three most expensive products
-- (ties broken by product_id), using MySQL's LIMIT.
`,
          solution: String.raw`SELECT name, price
FROM products
ORDER BY price DESC, product_id
LIMIT 3;
`,
          hints: [
            "Sort first: `ORDER BY price DESC`, then `product_id` to break ties.",
            "`LIMIT 3` goes last and keeps the first three rows of the sorted result.",
            "A table with fewer than three rows simply returns all of them.",
          ],
          cases: [
            {
              stdin: setup(PRODUCTS, "products", ["(1, 'Keyboard', 1500)", "(2, 'Monitor', 9000)", "(3, 'Mouse', 600)", "(4, 'Webcam', 2500)", "(5, 'Headset', 2500)"]),
              expected: "name | price\nMonitor | 9000\nWebcam | 2500\nHeadset | 2500\n",
            },
            {
              stdin: setup(PRODUCTS, "products", ["(8, 'Cable', 200)", "(3, 'Hub', 900)"]),
              expected: "name | price\nHub | 900\nCable | 200\n",
              hidden: true,
            },
            {
              stdin: setup(PRODUCTS, "products", ["(9, 'Stand', 700)", "(4, 'Lamp', 700)", "(6, 'Mat', 700)", "(2, 'Pad', 700)", "(1, 'Pen', 50)"]),
              expected: "name | price\nPad | 700\nLamp | 700\nMat | 700\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In MySQL (default mode), what does `SELECT 'Asha' || 'Rao';` return?",
          options: ["`AshaRao`", "`Asha Rao`", "`0`", "An error"],
          answer: 2,
          explanation: "In MySQL `||` is logical OR. Both strings convert to the number 0, and 0 OR 0 is 0. PostgreSQL, SQLite and Oracle would return `AshaRao`; in MySQL use `CONCAT`.",
        },
        {
          prompt: "Which takes the first five rows in **SQL Server**?",
          options: ["`SELECT … LIMIT 5`", "`SELECT TOP 5 …`", "`SELECT FIRST 5 …`", "`SELECT … ROWNUM 5`"],
          answer: 1,
          explanation: "SQL Server writes `TOP n` after `SELECT` (or `OFFSET … FETCH NEXT n ROWS ONLY`). `LIMIT` is MySQL/PostgreSQL/SQLite; the standard and Oracle 12c+ use `FETCH FIRST n ROWS ONLY`.",
        },
        {
          prompt: "What makes **SQLite** different from MySQL and PostgreSQL?",
          options: ["It does not support SQL", "It is an embedded library with the database in one file, no server process", "It only runs in browsers", "It cannot hold more than one table"],
          answer: 1,
          explanation: "SQLite is linked into the application and keeps the whole database in a single file — no server, users or network. It reads most of the same SQL and holds many tables.",
        },
        {
          prompt: "With MySQL 8's default collation, what is `'Pune' = 'pune'`?",
          options: ["1 (true)", "0 (false)", "NULL", "An error"],
          answer: 0,
          explanation: "MySQL's default collations are case-insensitive, so the comparison is true. PostgreSQL and SQLite compare case-sensitively by default and would say false — one reason a query can change its answer when moved.",
        },
        {
          prompt: "Which NULL helper works in **every** major database?",
          options: ["`IFNULL`", "`ISNULL`", "`NVL`", "`COALESCE`"],
          answer: 3,
          explanation: "`COALESCE` is standard SQL. `IFNULL` is MySQL/SQLite, `ISNULL` SQL Server, `NVL` Oracle.",
        },
      ],
    },
    {
      slug: "your-first-select",
      file: "04-your-first-select.md",
      exercises: [
        {
          title: "Choose the columns",
          prompt: `The table \`customers\`:

| customer_id | name | email | city | joined |
| --- | --- | --- | --- | --- |
| 1 | Asha | asha@example.com | Pune | 2023-04-01 |
| 2 | Ravi | ravi@example.com | Chennai | 2023-06-15 |
| 3 | Meera | NULL | Pune | 2024-01-09 |

Return only each customer's \`name\` and \`city\`, in that order, ordered by \`customer_id\`.

**Output:** \`name | city\`, by \`customer_id\`.

\`\`\`text
name | city
Asha | Pune
Ravi | Chennai
Meera | Pune
\`\`\``,
          starter: String.raw`-- Return name and city from customers, ordered by customer_id.
`,
          solution: String.raw`SELECT name, city
FROM customers
ORDER BY customer_id;
`,
          hints: [
            "List the two columns after `SELECT`, separated by a comma.",
            "You can order by `customer_id` even though you do not select it.",
          ],
          cases: [
            {
              stdin: setup(CUSTOMERS, "customers", ["(1, 'Asha', 'asha@example.com', 'Pune', '2023-04-01')", "(2, 'Ravi', 'ravi@example.com', 'Chennai', '2023-06-15')", "(3, 'Meera', NULL, 'Pune', '2024-01-09')"]),
              expected: "name | city\nAsha | Pune\nRavi | Chennai\nMeera | Pune\n",
            },
            {
              stdin: setup(CUSTOMERS, "customers", ["(30, 'Zoya', 'zoya@example.com', NULL, '2024-02-02')", "(4, 'Dev', 'dev@example.com', 'Delhi', '2022-11-30')"]),
              expected: "name | city\nDev | Delhi\nZoya | NULL\n",
              hidden: true,
            },
            { stdin: setup(CUSTOMERS, "customers", []), expected: "name | city\n(no rows)\n", hidden: true },
          ],
        },
        {
          title: "Your column order, plus a label",
          prompt: `Using \`customers\`, return three columns in this order: \`city\`, \`name\`, and a column \`kind\` that is the text \`customer\` on every row. Order the rows by \`name\`; two customers can share a name, so break ties by \`customer_id\`.

| customer_id | name | email | city | joined |
| --- | --- | --- | --- | --- |
| 1 | Ravi | ravi@example.com | Chennai | 2023-06-15 |
| 2 | Asha | asha@example.com | Pune | 2023-04-01 |
| 3 | Meera | NULL | Pune | 2024-01-09 |

**Output:** \`city | name | kind\`, by \`name\` then \`customer_id\`.

\`\`\`text
city | name | kind
Pune | Asha | customer
Pune | Meera | customer
Chennai | Ravi | customer
\`\`\``,
          starter: String.raw`-- Return city, name and the literal 'customer' AS kind,
-- ordered by name, then customer_id.
`,
          solution: String.raw`SELECT city, name, 'customer' AS kind
FROM customers
ORDER BY name, customer_id;
`,
          hints: [
            "The select list sets the column order — it need not follow the table's.",
            "A string literal in the select list repeats on every row; give it a name with `AS kind`.",
            "`ORDER BY name, customer_id` — the second key only matters when names tie.",
          ],
          cases: [
            {
              stdin: setup(CUSTOMERS, "customers", ["(1, 'Ravi', 'ravi@example.com', 'Chennai', '2023-06-15')", "(2, 'Asha', 'asha@example.com', 'Pune', '2023-04-01')", "(3, 'Meera', NULL, 'Pune', '2024-01-09')"]),
              expected: "city | name | kind\nPune | Asha | customer\nPune | Meera | customer\nChennai | Ravi | customer\n",
            },
            {
              stdin: setup(CUSTOMERS, "customers", ["(9, 'Asha', NULL, 'Delhi', '2024-03-03')", "(2, 'Asha', 'asha@example.com', 'Pune', '2023-04-01')", "(5, 'Kabir', NULL, NULL, '2023-08-08')"]),
              expected: "city | name | kind\nPune | Asha | customer\nDelhi | Asha | customer\nNULL | Kabir | customer\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT name city FROM students;` return?",
          options: ["Two columns, name and city", "A syntax error", "One column called `city` holding the names", "One column called `name` holding the cities"],
          answer: 2,
          explanation: "Without a comma, `city` is read as an alias for `name`. The query runs and returns names under the heading `city` — a silent bug, worse than an error.",
        },
        {
          prompt: "Which is **not** a reason to avoid `SELECT *` in application code?",
          options: ["It reads columns nobody uses", "The result changes shape when the table's columns change", "It hides which data the query needs", "It returns the rows in a random order"],
          answer: 3,
          explanation: "Row order has nothing to do with `*` — without `ORDER BY` every query's order is unspecified. The other three are the real costs of `SELECT *`.",
        },
        {
          prompt: "What does `SELECT 2 + 3 AS total;` return in MySQL?",
          options: ["An error: no table", "One row with total = 5", "Five rows", "The string `2 + 3`"],
          answer: 1,
          explanation: "A `SELECT` without `FROM` computes one row from its expressions. Oracle needs `FROM dual`; MySQL accepts both forms.",
        },
        {
          prompt: "Can a query order by a column it does not select, as in `SELECT name FROM students ORDER BY year`?",
          options: ["No, ORDER BY may only use selected columns", "Yes", "Only with `DESC`", "Only if `year` is the primary key"],
          answer: 1,
          explanation: "The rows still carry every column when they are sorted; the select list only decides what is shown. The exception is after `DISTINCT` or `GROUP BY`.",
        },
      ],
    },
    {
      slug: "how-a-query-runs",
      file: "05-how-a-query-runs.md",
      exercises: [
        {
          title: "Filter on an expression, sort by its alias",
          prompt: `The table \`order_items\`:

| item_id | name | price | qty |
| --- | --- | --- | --- |
| 1 | pen | 10 | 5 |
| 2 | lamp | 60 | 2 |
| 3 | desk | 150 | 1 |
| 4 | ink | 40 | 3 |

Return \`name\` and the line total \`price * qty\` as \`line_total\`, only for lines whose total is **at least 100**, ordered by \`line_total\` descending, ties by \`item_id\`. Remember which clauses can see the alias.

**Output:** \`name | line_total\`.

\`\`\`text
name | line_total
desk | 150
lamp | 120
ink | 120
\`\`\``,
          starter: String.raw`-- Return name and price * qty AS line_total for lines totalling at least 100,
-- ordered by line_total descending, then item_id.
`,
          solution: String.raw`SELECT name, price * qty AS line_total
FROM order_items
WHERE price * qty >= 100
ORDER BY line_total DESC, item_id;
`,
          hints: [
            "`WHERE` runs before `SELECT`, so the alias does not exist there — repeat `price * qty`.",
            "`ORDER BY` runs after `SELECT`, so `ORDER BY line_total DESC` works.",
            "Add `item_id` as the second sort key for the ties.",
          ],
          cases: [
            {
              stdin: setup(ORDER_ITEMS, "order_items", ["(1, 'pen', 10, 5)", "(2, 'lamp', 60, 2)", "(3, 'desk', 150, 1)", "(4, 'ink', 40, 3)"]),
              expected: "name | line_total\ndesk | 150\nlamp | 120\nink | 120\n",
            },
            {
              stdin: setup(ORDER_ITEMS, "order_items", ["(1, 'clip', 2, 10)", "(2, 'tape', 30, 3)", "(3, 'glue', 99, 1)"]),
              expected: "name | line_total\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: setup(ORDER_ITEMS, "order_items", ["(7, 'chair', 100, 1)", "(3, 'shelf', 50, 2)", "(5, 'board', 25, 8)", "(9, 'clip', 1, 99)"]),
              expected: "name | line_total\nboard | 200\nshelf | 100\nchair | 100\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Sort by a column you do not show",
          prompt: `The table \`students\`:

| id | name | score |
| --- | --- | --- |
| 1 | Asha | 72 |
| 2 | Ravi | 91 |
| 3 | Meera | 85 |

Return only the students' \`name\`, ordered by \`score\` from highest to lowest; students with equal scores in alphabetical order of \`name\`. A missing score (NULL) counts as the lowest, which is where MySQL puts NULLs in a descending sort.

**Output:** one column \`name\`.

\`\`\`text
name
Ravi
Meera
Asha
\`\`\``,
          starter: String.raw`-- Return name only, ordered by score descending, then name.
`,
          solution: String.raw`SELECT name
FROM students
ORDER BY score DESC, name;
`,
          hints: [
            "`ORDER BY` can use `score` even though only `name` is selected.",
            "`ORDER BY score DESC, name` — the second key breaks ties.",
          ],
          cases: [
            {
              stdin: setup(STUDENTS, "students", ["(1, 'Asha', 72)", "(2, 'Ravi', 91)", "(3, 'Meera', 85)"]),
              expected: "name\nRavi\nMeera\nAsha\n",
            },
            {
              stdin: setup(STUDENTS, "students", ["(1, 'Zara', 80)", "(2, 'Anil', 80)", "(3, 'Kiran', NULL)", "(4, 'Bina', 95)", "(5, 'Mohan', 80)"]),
              expected: "name\nBina\nAnil\nMohan\nZara\nKiran\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the **logical** order of these clauses?",
          options: ["SELECT, FROM, WHERE, ORDER BY", "FROM, WHERE, SELECT, ORDER BY", "FROM, SELECT, WHERE, ORDER BY", "WHERE, FROM, SELECT, ORDER BY"],
          answer: 1,
          explanation: "Rows are assembled (FROM), filtered (WHERE), shaped (SELECT), then sorted (ORDER BY). The written order starts with SELECT, which is why the two are easy to confuse.",
        },
        {
          prompt: "Why does `SELECT price * qty AS total FROM items WHERE total > 100;` fail?",
          options: ["`total` is a reserved word", "WHERE is evaluated before SELECT, so the alias does not exist yet", "Aliases need quotes", "Arithmetic is not allowed in SELECT"],
          answer: 1,
          explanation: "The alias is created at the SELECT step, after WHERE has filtered. Repeat the expression in WHERE, or filter on the alias in an outer query.",
        },
        {
          prompt: "Given `SELECT name FROM t ORDER BY score DESC LIMIT 2`, what happens first?",
          options: ["Two rows are taken, then sorted", "The rows are sorted, then the first two are kept", "LIMIT and ORDER BY run in the order written", "It depends on the table's insertion order"],
          answer: 1,
          explanation: "LIMIT is the last logical step, so it slices the sorted result — which is why ORDER BY + LIMIT means top-N. (A plan may stop early using an index, but the answer is the same.)",
        },
        {
          prompt: "Which component chooses whether to use an index for a query?",
          options: ["The parser", "The optimizer", "The client", "The WHERE clause"],
          answer: 1,
          explanation: "The parser checks syntax, the resolver checks names, and the optimizer builds the execution plan — index or scan, join order, sort or not — from statistics. `EXPLAIN` shows its choice.",
        },
        {
          prompt: "Why can't `WHERE price > AVG(price)` work?",
          options: ["AVG needs a GROUP BY", "WHERE decides about one row at a time, before any aggregate exists", "AVG cannot be compared with a column", "It works in MySQL"],
          answer: 1,
          explanation: "WHERE runs at step 2, row by row; aggregates are computed later. MySQL answers *Invalid use of group function*. Compare with a subquery instead, or use HAVING for conditions on groups.",
        },
      ],
    },
    {
      slug: "foundations-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Read the catalogue in order",
          prompt: `The table \`courses\`:

| course_id | code | title | credits |
| --- | --- | --- | --- |
| 30 | CS301 | Databases | 4 |
| 10 | CS101 | Programming | 3 |
| 20 | CS201 | Data Structures | 4 |

Return every column of every course, ordered by \`course_id\`.

**Output:** \`course_id | code | title | credits\`.

\`\`\`text
course_id | code | title | credits
10 | CS101 | Programming | 3
20 | CS201 | Data Structures | 4
30 | CS301 | Databases | 4
\`\`\``,
          starter: String.raw`-- Return every column of courses, ordered by course_id.
`,
          solution: String.raw`SELECT *
FROM courses
ORDER BY course_id;
`,
          hints: ["`SELECT *` with `ORDER BY course_id`."],
          cases: [
            {
              stdin: setup(COURSES, "courses", ["(30, 'CS301', 'Databases', 4)", "(10, 'CS101', 'Programming', 3)", "(20, 'CS201', 'Data Structures', 4)"]),
              expected: "course_id | code | title | credits\n10 | CS101 | Programming | 3\n20 | CS201 | Data Structures | 4\n30 | CS301 | Databases | 4\n",
            },
            { stdin: setup(COURSES, "courses", []), expected: "course_id | code | title | credits\n(no rows)\n", hidden: true },
            {
              stdin: setup(COURSES, "courses", ["(5, 'MA101', 'Calculus', 4)", "(2, 'HS101', 'Communication', 2)"]),
              expected: "course_id | code | title | credits\n2 | HS101 | Communication | 2\n5 | MA101 | Calculus | 4\n",
              hidden: true,
            },
          ],
        },
        {
          title: "A report row per student",
          prompt: `The table \`students\`:

| student_id | name | branch | credits |
| --- | --- | --- | --- |
| 2 | Ravi | ECE | 18 |
| 1 | Asha | CSE | 20 |

Return, in this order: \`student_id\`, \`name\`, the contact hours \`credits * 15\` as \`contact_hours\`, and the text \`active\` as \`status\`. Order by \`student_id\`.

**Output:** \`student_id | name | contact_hours | status\`.

\`\`\`text
student_id | name | contact_hours | status
1 | Asha | 300 | active
2 | Ravi | 270 | active
\`\`\``,
          starter: String.raw`-- Return student_id, name, credits * 15 AS contact_hours and 'active' AS status,
-- ordered by student_id.
`,
          solution: String.raw`SELECT student_id,
       name,
       credits * 15 AS contact_hours,
       'active' AS status
FROM students
ORDER BY student_id;
`,
          hints: [
            "Columns, an expression and a literal can sit side by side in the select list.",
            "Name the computed columns with `AS`.",
          ],
          cases: [
            {
              stdin: setup(ENROLLED, "students", ["(2, 'Ravi', 'ECE', 18)", "(1, 'Asha', 'CSE', 20)"]),
              expected: "student_id | name | contact_hours | status\n1 | Asha | 300 | active\n2 | Ravi | 270 | active\n",
            },
            {
              stdin: setup(ENROLLED, "students", ["(7, 'Meera', NULL, 0)", "(4, 'Kabir', 'ME', 24)", "(5, 'Isha', 'CSE', 21)"]),
              expected: "student_id | name | contact_hours | status\n4 | Kabir | 360 | active\n5 | Isha | 315 | active\n7 | Meera | 0 | active\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Big orders first",
          prompt: `The table \`orders\`:

| order_id | customer | amount | discount |
| --- | --- | --- | --- |
| 1 | Asha | 1200 | 200 |
| 2 | Ravi | 450 | 0 |
| 3 | Meera | 800 | 100 |
| 4 | Dev | 1100 | 100 |

Return \`order_id\`, \`customer\` and the net amount \`amount - discount\` as \`net\`, only for orders whose net is **greater than 500**, ordered by \`net\` descending, ties by \`order_id\`.

**Output:** \`order_id | customer | net\`.

\`\`\`text
order_id | customer | net
1 | Asha | 1000
4 | Dev | 1000
3 | Meera | 700
\`\`\``,
          starter: String.raw`-- Return order_id, customer and amount - discount AS net for orders with net > 500,
-- ordered by net descending, then order_id.
`,
          solution: String.raw`SELECT order_id, customer, amount - discount AS net
FROM orders
WHERE amount - discount > 500
ORDER BY net DESC, order_id;
`,
          hints: [
            "Repeat `amount - discount` in `WHERE` — the alias is not visible there.",
            "`ORDER BY net DESC, order_id` may use the alias.",
            "Strictly greater than 500: an order netting exactly 500 is left out.",
          ],
          cases: [
            {
              stdin: setup(ORDERS, "orders", ["(1, 'Asha', 1200, 200)", "(2, 'Ravi', 450, 0)", "(3, 'Meera', 800, 100)", "(4, 'Dev', 1100, 100)"]),
              expected: "order_id | customer | net\n1 | Asha | 1000\n4 | Dev | 1000\n3 | Meera | 700\n",
            },
            {
              stdin: setup(ORDERS, "orders", ["(1, 'Asha', 600, 100)", "(2, 'Ravi', 501, 0)", "(3, 'Meera', 900, 400)"]),
              expected: "order_id | customer | net\n2 | Ravi | 501\n",
              hidden: true,
            },
            {
              stdin: setup(ORDERS, "orders", ["(1, 'Asha', 300, 0)", "(2, 'Ravi', 500, 0)"]),
              expected: "order_id | customer | net\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which statement about a relational table is true?",
          options: ["Its rows are stored and returned in insertion order", "Each column has a name and a type, and the rows form a set with no order", "Each row may have a different set of columns", "Columns are addressed by number"],
          answer: 1,
          explanation: "A table has a fixed list of typed, named columns, and its rows are a set — no inherent order. Order comes only from `ORDER BY`.",
        },
        {
          prompt: "Why is a surrogate integer `id` usually preferred as a primary key over an email address?",
          options: ["Integers are always faster to type", "An email can change, and a key that changes must change everywhere it is referenced", "Emails cannot be unique", "MySQL does not allow text keys"],
          answer: 1,
          explanation: "Foreign keys copy the primary key's value. If that value changes, every reference must change too. A meaningless id never needs to. Text keys are allowed, and emails can be unique.",
        },
        {
          prompt: "Which family does `GRANT SELECT ON orders TO analyst;` belong to?",
          options: ["DDL", "DML", "DCL", "TCL"],
          answer: 2,
          explanation: "Data Control Language manages permissions: `GRANT` and `REVOKE`.",
        },
        {
          prompt: "Which is MySQL's way to name a column called `order` (a keyword)?",
          options: ["`'order'`", "`` `order` ``", "`[order]`", "`(order)`"],
          answer: 1,
          explanation: "MySQL quotes identifiers with backticks. Single quotes make a string; square brackets are SQL Server; the standard uses double quotes.",
        },
        {
          prompt: "What does this return?\n\n```sql\nSELECT 'SQL' AS lang, 10 + 5 AS n;\n```",
          options: ["An error: no FROM", "`lang | n` then `SQL | 15`", "`lang | n` then `SQL | 10 + 5`", "Nothing"],
          answer: 1,
          explanation: "A SELECT without FROM computes one row from its literals and expressions; `10 + 5` is evaluated.",
        },
        {
          prompt: "A colleague writes `SELECT title, year, FROM books;`. What happens?",
          options: ["Two columns are returned", "A syntax error near FROM", "An empty result", "A third, empty column"],
          answer: 1,
          explanation: "The trailing comma after `year` leaves the parser expecting another column, so it fails at `FROM`. The mistake is just before the quoted fragment.",
        },
        {
          prompt: "Which spelling joins first and last names in **MySQL**?",
          options: ["`first_name || ' ' || last_name`", "`first_name + ' ' + last_name`", "`CONCAT(first_name, ' ', last_name)`", "`JOIN(first_name, last_name)`"],
          answer: 2,
          explanation: "`CONCAT` is MySQL's concatenation. `||` is OR in MySQL (concatenation in PostgreSQL/SQLite/Oracle); `+` is SQL Server's.",
        },
        {
          prompt: "Which query takes the three cheapest products in the **SQL standard** form?",
          options: ["`SELECT TOP 3 * FROM products ORDER BY price`", "`SELECT * FROM products ORDER BY price FETCH FIRST 3 ROWS ONLY`", "`SELECT * FROM products LIMIT 3`", "`SELECT * FROM products WHERE ROWNUM <= 3`"],
          answer: 1,
          explanation: "`FETCH FIRST n ROWS ONLY` is the standard (Oracle 12c+, PostgreSQL, SQL Server with OFFSET). `TOP` is SQL Server, `LIMIT` MySQL/PostgreSQL/SQLite — and the `LIMIT` option has no ORDER BY, so it is not the cheapest three anyway.",
        },
        {
          prompt: "In which clause can a select-list alias be used in every major database?",
          options: ["WHERE", "ORDER BY", "FROM", "JOIN … ON"],
          answer: 1,
          explanation: "ORDER BY is evaluated after SELECT. WHERE, FROM and ON run before the alias exists. (MySQL also accepts aliases in GROUP BY and HAVING; that is not portable.)",
        },
        {
          prompt: "What does this return for rows (name, score) = (Asha, 70), (Ravi, 90), (Meera, 70)?\n\n```sql\nSELECT name FROM students ORDER BY score DESC, name LIMIT 2;\n```",
          options: ["Ravi, Asha", "Ravi, Meera", "Asha, Meera", "Ravi only"],
          answer: 0,
          explanation: "Sorted by score descending: Ravi (90), then the 70s in name order — Asha, Meera. LIMIT 2 keeps Ravi and Asha.",
        },
        {
          prompt: "What does the query **optimizer** produce?",
          options: ["The parse tree", "An execution plan", "The result rows", "The table's statistics"],
          answer: 1,
          explanation: "The optimizer chooses how to run the query — indexes, join order, algorithms — and outputs a plan, using statistics as its input. The executor then runs the plan to produce rows.",
        },
        {
          prompt: "Which is the best description of a **foreign key**?",
          options: ["A key imported from another database", "A column whose values must match a primary key in another table", "A second primary key", "An index on a text column"],
          answer: 1,
          explanation: "A foreign key references another table's primary key, recording a relationship and letting the database refuse references to rows that do not exist.",
        },
      ],
    },
  ],
});
