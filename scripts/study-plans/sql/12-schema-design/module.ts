import { defineModule } from "../../dsl.js";

/*
 * Schema exercises are judged by what the learner's schema does to data:
 * the setup script holds the source rows (a staging table, a flat sheet),
 * the learner's script creates or changes tables and fills them, and a
 * SELECT shows the result. Where the starter carries an INSERT IGNORE or a
 * closing SELECT, the learner's CREATE TABLE decides what that statement
 * produces — a missing composite key or CHECK shows up as extra rows.
 *
 * Engine facts the exercises stay inside (sql/track.ts): foreign keys are
 * declared but not enforced; ALTER TABLE runs ADD/RENAME/DROP COLUMN and
 * RENAME TO, not MODIFY/CHANGE; CREATE OR REPLACE VIEW does not run, so a
 * view is redefined with DROP VIEW IF EXISTS + CREATE VIEW; AUTO_INCREMENT
 * is recognised as `INT AUTO_INCREMENT PRIMARY KEY`; and INSERT IGNORE is
 * only ever used against UNIQUE/PRIMARY KEY/CHECK, never NOT NULL (MySQL
 * would store an implicit default there, SQLite skips the row).
 */

const rawEventsSetup = (rows: string) => String.raw`CREATE TABLE raw_events (
  title VARCHAR(100) NOT NULL,
  starts_on DATE NOT NULL,
  venue VARCHAR(50)
);
${rows}`;

const salesSetup = (rows: string) => String.raw`CREATE TABLE sales (
  id INT PRIMARY KEY,
  sale_date DATE NOT NULL,
  amount DECIMAL(8,2) NOT NULL
);
${rows}`;

const requestsSetup = (rows: string) => String.raw`CREATE TABLE enrolment_requests (
  id INT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  requested_on DATE NOT NULL
);
${rows}`;

const rawAccountsSetup = (rows: string) => String.raw`CREATE TABLE raw_accounts (
  id INT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  age INT NOT NULL
);
${rows}`;

const customersAlterSetup = (rows: string) => String.raw`CREATE TABLE customers (
  id INT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50),
  phone VARCHAR(20)
);
${rows}`;

const legacyUsersSetup = (rows: string) => String.raw`CREATE TABLE tbl_users (
  id INT PRIMARY KEY,
  username VARCHAR(30) NOT NULL,
  legacy_flag INT,
  signup_date DATE NOT NULL
);
${rows}`;

const sheetTable = String.raw`CREATE TABLE order_sheet (
  order_id INT NOT NULL,
  order_date DATE NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_name VARCHAR(50) NOT NULL,
  sku VARCHAR(10) NOT NULL,
  product_name VARCHAR(50) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  qty INT NOT NULL
);`;

const sheetSetup = (rows: string) => `${sheetTable}\n${rows}`;

const sheetWithMastersSetup = (rows: string, customers: string, products: string) => String.raw`${sheetTable}
CREATE TABLE customers (
  email VARCHAR(100) PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);
CREATE TABLE products (
  sku VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL
);
${rows}
${customers}
${products}`;

const SHEET_ROWS = "INSERT INTO order_sheet VALUES (1, '2024-05-01', 'asha@x.io', 'Asha', 'P1', 'Pen', 1.50, 10), (1, '2024-05-01', 'asha@x.io', 'Asha', 'P2', 'Pad', 3.00, 2), (2, '2024-05-03', 'ben@x.io', 'Ben', 'P1', 'Pen', 1.50, 4), (3, '2024-05-04', 'asha@x.io', 'Asha', 'P3', 'Ink', 7.25, 1), (3, '2024-05-04', 'asha@x.io', 'Asha', 'P1', 'Pen', 1.50, 5);";

const rosterRawSetup = (students: string, courses: string, raw: string) => String.raw`CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE courses (
  id INT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE
);
CREATE TABLE enrol_raw (
  student_name VARCHAR(50) NOT NULL,
  course_code VARCHAR(10) NOT NULL
);
${students}
${courses}
${raw}`;

const employeesSetup = (rows: string) => String.raw`CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  manager_name VARCHAR(50)
);
${rows}`;

const revenueSetup = (customers: string, orders: string) => String.raw`CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL
);
${customers}
${orders}`;

const bigOrdersSetup = (rows: string) => String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer VARCHAR(50) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(10) NOT NULL
);
CREATE VIEW big_orders AS
SELECT id, total FROM orders WHERE total >= 100;
${rows}`;

const loanLogSetup = (rows: string) => String.raw`CREATE TABLE loan_log (
  id INT PRIMARY KEY,
  member_email VARCHAR(100) NOT NULL,
  member_name VARCHAR(50) NOT NULL,
  isbn VARCHAR(13) NOT NULL,
  title VARCHAR(100) NOT NULL,
  borrowed_on DATE NOT NULL
);
${rows}`;

const legacyProductsSetup = (rows: string) => String.raw`CREATE TABLE products (
  id INT PRIMARY KEY,
  title VARCHAR(80) NOT NULL,
  price_cents INT NOT NULL,
  old_sku VARCHAR(10)
);
${rows}`;

const rosterSetup = (students: string, courses: string, enrolments: string) => String.raw`CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);
CREATE TABLE courses (
  id INT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE
);
CREATE TABLE enrolments (
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_on DATE NOT NULL,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students (id),
  FOREIGN KEY (course_id) REFERENCES courses (id)
);
${students}
${courses}
${enrolments}`;

export default defineModule(import.meta.url, {
  slug: "schema-design",
  title: "Schema design",
  blurb: "CREATE TABLE and choosing MySQL types; PRIMARY KEY, UNIQUE, NOT NULL, DEFAULT, CHECK and FOREIGN KEY; ALTER TABLE and DROP with safe migrations; normalization from 1NF to BCNF; one-to-many, many-to-many and self-referencing relationships; and views.",
  icon: "grid",
  overview: `Queries are only as good as the tables under them. This module is about designing those tables: choosing a type for every column, declaring the rules the database must enforce, changing a live schema without breaking it, splitting data so each fact is stored once, connecting the pieces with foreign keys, and giving repeated queries a name with views. It is also one of the most interviewed areas of SQL — primary key versus unique key, the normal forms, DELETE versus TRUNCATE versus DROP, view versus table — and the module answers each of those directly, in MySQL 8 with InnoDB and with the PostgreSQL differences that come up.

CREATE TABLE and types covers integer sizes, \`DECIMAL\` versus \`FLOAT\` for money, \`CHAR\`, \`VARCHAR\` and \`TEXT\`, \`DATE\`, \`DATETIME\` and \`TIMESTAMP\`, MySQL's \`BOOLEAN\`, \`ENUM\` and \`JSON\`, AUTO_INCREMENT and \`CREATE TABLE ... AS SELECT\`. Constraints covers \`NOT NULL\`, \`DEFAULT\`, primary and composite keys, \`UNIQUE\`, natural and surrogate keys, \`CHECK\` and foreign keys. ALTER and DROP covers adding, renaming, redefining and dropping columns, renaming tables, adding constraints later, and the add-backfill-constrain migration. Normalization covers anomalies, functional dependencies and 1NF, 2NF, 3NF and BCNF on a worked example, and when to denormalize. Relationships covers one-to-one, one-to-many, many-to-many, self-references and \`ON DELETE\` actions. Views covers creating and replacing them, view versus table, updatable views, \`WITH CHECK OPTION\` and materialized views.

The exercises build and change real schemas and prove them with data: an events table whose defaults fill imported rows, a daily summary made with \`CREATE TABLE ... AS SELECT\`, a composite key and a CHECK that filter messy imports, a column added and backfilled, a legacy table cleaned up, a flat order sheet decomposed into third normal form, a many-to-many enrolment table, a manager hierarchy, a live revenue view and a redefined view. The checkpoint adds a library schema built from a loan log, a price-column migration and a course roster view.`,
  lessons: [
    {
      slug: "create-table-and-types",
      file: "01-create-table-and-types.md",
      exercises: [
        {
          title: "Create the events table",
          prompt: `Write the \`CREATE TABLE\` for \`events\` so that the import already in the starter works and fills in what the raw data lacks:

| column | type and rules |
| --- | --- |
| \`id\` | integer, numbered automatically (\`INT AUTO_INCREMENT PRIMARY KEY\`) |
| \`title\` | up to 100 characters, required |
| \`starts_on\` | a date, required |
| \`capacity\` | integer, required, default 50 |
| \`status\` | up to 10 characters, required, default \`'draft'\` |

The starter then copies \`raw_events(title, starts_on, venue)\` into it, ordered by \`starts_on\` then \`title\`, and prints \`id, title, starts_on, capacity, status\` ordered by \`id\`. Leave those two statements as they are.

\`raw_events\`: (Data Meetup, 2024-07-12, Hall A), (SQL Workshop, 2024-06-20, Lab 2), (Hack Night, 2024-07-12, Hall B).

\`\`\`text
id | title | starts_on | capacity | status
1 | SQL Workshop | 2024-06-20 | 50 | draft
2 | Data Meetup | 2024-07-12 | 50 | draft
3 | Hack Night | 2024-07-12 | 50 | draft
\`\`\``,
          starter: String.raw`-- CREATE TABLE events ( ... );


INSERT INTO events (title, starts_on)
SELECT title, starts_on
FROM raw_events
ORDER BY starts_on, title;

SELECT id, title, starts_on, capacity, status
FROM events
ORDER BY id;
`,
          solution: String.raw`CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  starts_on DATE NOT NULL,
  capacity INT NOT NULL DEFAULT 50,
  status VARCHAR(10) NOT NULL DEFAULT 'draft'
);

INSERT INTO events (title, starts_on)
SELECT title, starts_on
FROM raw_events
ORDER BY starts_on, title;

SELECT id, title, starts_on, capacity, status
FROM events
ORDER BY id;
`,
          hints: [
            "Each column is `name TYPE modifiers`, separated by commas: `capacity INT NOT NULL DEFAULT 50`.",
            "Write the id as `id INT AUTO_INCREMENT PRIMARY KEY` so every inserted row is numbered 1, 2, 3, … in insertion order.",
          ],
          cases: [
            {
              stdin: rawEventsSetup("INSERT INTO raw_events VALUES ('Data Meetup', '2024-07-12', 'Hall A'), ('SQL Workshop', '2024-06-20', 'Lab 2'), ('Hack Night', '2024-07-12', 'Hall B');"),
              expected: "id | title | starts_on | capacity | status\n1 | SQL Workshop | 2024-06-20 | 50 | draft\n2 | Data Meetup | 2024-07-12 | 50 | draft\n3 | Hack Night | 2024-07-12 | 50 | draft\n",
            },
            {
              stdin: rawEventsSetup(""),
              expected: "id | title | starts_on | capacity | status\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: rawEventsSetup("INSERT INTO raw_events VALUES ('Demo Day', '2024-12-01', NULL), ('Kickoff', '2024-01-08', 'Main hall');"),
              expected: "id | title | starts_on | capacity | status\n1 | Kickoff | 2024-01-08 | 50 | draft\n2 | Demo Day | 2024-12-01 | 50 | draft\n",
              hidden: true,
            },
          ],
        },
        {
          title: "A daily summary with CREATE TABLE AS SELECT",
          prompt: `Create a table \`daily_totals\` from \`sales\` with one \`CREATE TABLE ... AS SELECT\`. It has one row per \`sale_date\` and the columns:

- \`sale_date\`;
- \`orders\` — the number of sales that day;
- \`revenue\` — the sum of \`amount\`;
- \`avg_order\` — the average amount, rounded to 2 places.

Then print the whole table: \`sale_date, orders, revenue, avg_order\`, ordered by \`sale_date\`.

\`sales(id, sale_date, amount)\`: (1, 2024-05-01, 12.50), (2, 2024-05-01, 7.25), (3, 2024-05-02, 40.00), (4, 2024-05-01, 30.00), (5, 2024-05-03, 9.99).

\`\`\`text
sale_date | orders | revenue | avg_order
2024-05-01 | 3 | 49.75 | 16.58
2024-05-02 | 1 | 40 | 40
2024-05-03 | 1 | 9.99 | 9.99
\`\`\``,
          starter: String.raw`-- CREATE TABLE daily_totals AS SELECT ...


SELECT sale_date, orders, revenue, avg_order
FROM daily_totals
ORDER BY sale_date;
`,
          solution: String.raw`CREATE TABLE daily_totals AS
SELECT sale_date,
       COUNT(*) AS orders,
       SUM(amount) AS revenue,
       ROUND(AVG(amount), 2) AS avg_order
FROM sales
GROUP BY sale_date;

SELECT sale_date, orders, revenue, avg_order
FROM daily_totals
ORDER BY sale_date;
`,
          hints: [
            "The new table's column names are the SELECT's aliases — alias every aggregate.",
            "`CREATE TABLE daily_totals AS SELECT sale_date, COUNT(*) AS orders, ... FROM sales GROUP BY sale_date;`",
          ],
          cases: [
            {
              stdin: salesSetup("INSERT INTO sales VALUES (1, '2024-05-01', 12.50), (2, '2024-05-01', 7.25), (3, '2024-05-02', 40.00), (4, '2024-05-01', 30.00), (5, '2024-05-03', 9.99);"),
              expected: "sale_date | orders | revenue | avg_order\n2024-05-01 | 3 | 49.75 | 16.58\n2024-05-02 | 1 | 40 | 40\n2024-05-03 | 1 | 9.99 | 9.99\n",
            },
            {
              stdin: salesSetup(""),
              expected: "sale_date | orders | revenue | avg_order\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: salesSetup("INSERT INTO sales VALUES (7, '2024-06-10', 10.00), (8, '2024-06-10', 20.00), (9, '2024-06-09', 5.50), (10, '2024-06-10', 0.00);"),
              expected: "sale_date | orders | revenue | avg_order\n2024-06-09 | 1 | 5.5 | 5.5\n2024-06-10 | 3 | 30 | 10\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which type should store a product price such as 1299.99?",
          options: ["`FLOAT`", "`DOUBLE`", "`DECIMAL(10,2)`", "`VARCHAR(10)`"],
          answer: 2,
          explanation: "DECIMAL stores exact decimal digits, so sums reconcile. FLOAT/DOUBLE are binary approximations (0.1 + 0.2 ≠ 0.3); a string cannot be summed or compared numerically.",
        },
        {
          prompt: "What is MySQL's `BOOLEAN` type?",
          options: [
            "A true boolean that accepts only TRUE, FALSE and NULL",
            "An alias for `TINYINT(1)` — TRUE is 1, FALSE is 0, and other small integers are accepted",
            "An alias for `BIT(1)`",
            "A one-character string 'Y'/'N'",
          ],
          answer: 1,
          explanation: "MySQL maps BOOLEAN to TINYINT(1). PostgreSQL is the one with a real BOOLEAN type.",
        },
        {
          prompt: "A column must hold appointment times that mean \"10:00 in Mumbai\" regardless of the server's time zone, including dates in 2045. Which type fits?",
          options: ["`TIMESTAMP`", "`DATETIME`", "`DATE`", "`YEAR`"],
          answer: 1,
          explanation: "DATETIME stores the value as written, with no time-zone conversion, through year 9999. TIMESTAMP converts via UTC and ends in January 2038.",
        },
        {
          prompt: "What does `CREATE TABLE copy AS SELECT * FROM orders;` copy?",
          options: [
            "Columns, rows, primary key and indexes",
            "Columns and rows, but not the primary key, indexes, defaults or foreign keys",
            "Only the structure, no rows",
            "Only the primary key",
          ],
          answer: 1,
          explanation: "CTAS creates columns from the query and fills them. `CREATE TABLE copy LIKE orders` is the form that copies structure and indexes without rows.",
        },
        {
          prompt: "What is the difference between `CHAR(10)` and `VARCHAR(10)`?",
          options: [
            "CHAR holds up to 10 bytes, VARCHAR up to 10 characters",
            "CHAR is fixed length and pads with spaces; VARCHAR stores only the characters given plus a length prefix",
            "VARCHAR cannot be indexed",
            "There is no difference in MySQL",
          ],
          answer: 1,
          explanation: "Both count characters. CHAR suits fixed-length codes; VARCHAR suits text of varying length.",
        },
      ],
    },
    {
      slug: "constraints",
      file: "02-constraints.md",
      exercises: [
        {
          title: "A composite key keeps enrolments unique",
          prompt: `Create the \`enrolments\` table so that a student can be enrolled in many courses and a course can have many students, but the **same student–course pair** can be stored only once:

- \`student_id\` integer, required;
- \`course_id\` integer, required;
- \`enrolled_on\` date, required;
- a **composite primary key** on \`(student_id, course_id)\`.

The starter then loads \`enrolment_requests\` with \`INSERT IGNORE\` in request order — a repeated pair is skipped by your key, so the earliest request wins — and prints \`student_id, course_id, enrolled_on\` ordered by \`student_id\`, \`course_id\`. Leave those statements as they are.

\`enrolment_requests(id, student_id, course_id, requested_on)\`:

| id | student_id | course_id | requested_on |
| --- | --- | --- | --- |
| 1 | 1 | 10 | 2024-01-05 |
| 2 | 1 | 11 | 2024-01-06 |
| 3 | 2 | 10 | 2024-01-06 |
| 4 | 1 | 10 | 2024-01-09 |
| 5 | 3 | 12 | 2024-01-10 |
| 6 | 2 | 10 | 2024-01-11 |

\`\`\`text
student_id | course_id | enrolled_on
1 | 10 | 2024-01-05
1 | 11 | 2024-01-06
2 | 10 | 2024-01-06
3 | 12 | 2024-01-10
\`\`\``,
          starter: String.raw`-- CREATE TABLE enrolments ( ... );


INSERT IGNORE INTO enrolments (student_id, course_id, enrolled_on)
SELECT student_id, course_id, requested_on
FROM enrolment_requests
ORDER BY id;

SELECT student_id, course_id, enrolled_on
FROM enrolments
ORDER BY student_id, course_id;
`,
          solution: String.raw`CREATE TABLE enrolments (
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_on DATE NOT NULL,
  PRIMARY KEY (student_id, course_id)
);

INSERT IGNORE INTO enrolments (student_id, course_id, enrolled_on)
SELECT student_id, course_id, requested_on
FROM enrolment_requests
ORDER BY id;

SELECT student_id, course_id, enrolled_on
FROM enrolments
ORDER BY student_id, course_id;
`,
          hints: [
            "A key on several columns is a table constraint after the columns: `PRIMARY KEY (student_id, course_id)`.",
            "A primary key on `student_id` alone would allow each student only one course; no key at all would keep the duplicates.",
          ],
          cases: [
            {
              stdin: requestsSetup("INSERT INTO enrolment_requests VALUES (1, 1, 10, '2024-01-05'), (2, 1, 11, '2024-01-06'), (3, 2, 10, '2024-01-06'), (4, 1, 10, '2024-01-09'), (5, 3, 12, '2024-01-10'), (6, 2, 10, '2024-01-11');"),
              expected: "student_id | course_id | enrolled_on\n1 | 10 | 2024-01-05\n1 | 11 | 2024-01-06\n2 | 10 | 2024-01-06\n3 | 12 | 2024-01-10\n",
            },
            {
              stdin: requestsSetup("INSERT INTO enrolment_requests VALUES (1, 5, 20, '2024-02-01'), (2, 5, 20, '2024-02-02'), (3, 5, 20, '2024-02-03');"),
              expected: "student_id | course_id | enrolled_on\n5 | 20 | 2024-02-01\n",
              hidden: true,
            },
            {
              stdin: requestsSetup("INSERT INTO enrolment_requests VALUES (1, 7, 30, '2024-03-01'), (2, 8, 30, '2024-03-01'), (3, 7, 31, '2024-03-02'), (4, 8, 31, '2024-03-02');"),
              expected: "student_id | course_id | enrolled_on\n7 | 30 | 2024-03-01\n7 | 31 | 2024-03-02\n8 | 30 | 2024-03-01\n8 | 31 | 2024-03-02\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Let UNIQUE and CHECK filter an import",
          prompt: `Create the \`accounts\` table so its own rules reject the bad rows of an import:

- \`id\` integer primary key;
- \`email\` up to 100 characters, required, **unique**;
- \`age\` integer, required, with a **CHECK** that it is at least 13.

The starter then copies \`raw_accounts\` with \`INSERT IGNORE\` in id order — rows that break your UNIQUE or CHECK are skipped, so for a repeated email the lowest id wins — and prints \`id, email, age\` ordered by \`id\`. Leave those statements as they are.

\`raw_accounts(id, email, age)\`: (1, ana@x.io, 20), (2, bo@x.io, 12), (3, ana@x.io, 30), (4, cy@x.io, 13), (5, di@x.io, 45).

\`\`\`text
id | email | age
1 | ana@x.io | 20
4 | cy@x.io | 13
5 | di@x.io | 45
\`\`\``,
          starter: String.raw`-- CREATE TABLE accounts ( ... );


INSERT IGNORE INTO accounts (id, email, age)
SELECT id, email, age
FROM raw_accounts
ORDER BY id;

SELECT id, email, age
FROM accounts
ORDER BY id;
`,
          solution: String.raw`CREATE TABLE accounts (
  id INT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  age INT NOT NULL,
  CONSTRAINT chk_accounts_age CHECK (age >= 13)
);

INSERT IGNORE INTO accounts (id, email, age)
SELECT id, email, age
FROM raw_accounts
ORDER BY id;

SELECT id, email, age
FROM accounts
ORDER BY id;
`,
          hints: [
            "`email VARCHAR(100) NOT NULL UNIQUE` declares the unique rule inline.",
            "A CHECK can go on the column (`age INT NOT NULL CHECK (age >= 13)`) or as a named table constraint.",
            "\"At least 13\" includes 13: use `>=`.",
          ],
          cases: [
            {
              stdin: rawAccountsSetup("INSERT INTO raw_accounts VALUES (1, 'ana@x.io', 20), (2, 'bo@x.io', 12), (3, 'ana@x.io', 30), (4, 'cy@x.io', 13), (5, 'di@x.io', 45);"),
              expected: "id | email | age\n1 | ana@x.io | 20\n4 | cy@x.io | 13\n5 | di@x.io | 45\n",
            },
            {
              stdin: rawAccountsSetup("INSERT INTO raw_accounts VALUES (8, 'eli@x.io', 9), (3, 'eli@x.io', 15), (5, 'fay@x.io', 13), (9, 'fay@x.io', 60);"),
              expected: "id | email | age\n3 | eli@x.io | 15\n5 | fay@x.io | 13\n",
              hidden: true,
            },
            {
              stdin: rawAccountsSetup("INSERT INTO raw_accounts VALUES (1, 'kid@x.io', 10), (2, 'tot@x.io', 3);"),
              expected: "id | email | age\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which statement about primary keys and unique keys is true in MySQL?",
          options: [
            "A table can have several primary keys and one unique key",
            "A unique column may hold NULLs (any number of them); a primary key column never can",
            "A unique key does not create an index",
            "Only a unique key can be referenced by a foreign key",
          ],
          answer: 1,
          explanation: "One primary key per table, never NULL, the clustered index in InnoDB. Many unique keys, each with an index, NULLs allowed because NULL ≠ NULL.",
        },
        {
          prompt: "`qty INT CHECK (qty > 0)` — which value is accepted by the check?",
          options: ["0", "-1", "NULL", "None of them"],
          answer: 2,
          explanation: "`NULL > 0` is unknown, and a CHECK fails only when the condition is false. Add NOT NULL to require a value.",
        },
        {
          prompt: "Before which MySQL version were CHECK constraints parsed but silently ignored?",
          options: ["5.5", "8.0.16", "8.4", "They have always been enforced"],
          answer: 1,
          explanation: "Enforcement arrived in MySQL 8.0.16. Older servers accepted the syntax and enforced nothing.",
        },
        {
          prompt: "A `users` table uses `id INT AUTO_INCREMENT PRIMARY KEY` and `email ... UNIQUE`. What is this design called and why is it common?",
          options: [
            "A composite key; it saves space",
            "A surrogate primary key plus a unique natural key; references stay small and stable while duplicates are still refused",
            "A natural primary key; emails never change",
            "Denormalization; it avoids joins",
          ],
          answer: 1,
          explanation: "The surrogate id never changes and keeps foreign keys short; the UNIQUE constraint still enforces the real-world rule.",
        },
        {
          prompt: "How do you stop the same (student, course) pair from being stored twice in a junction table?",
          options: [
            "`UNIQUE` on `student_id` and `UNIQUE` on `course_id`",
            "A composite `PRIMARY KEY (student_id, course_id)` (or `UNIQUE (student_id, course_id)`)",
            "A CHECK constraint",
            "An AUTO_INCREMENT id",
          ],
          answer: 1,
          explanation: "The pair must be unique, not each column — separate UNIQUEs would allow each student only one course and each course only one student.",
        },
      ],
    },
    {
      slug: "alter-and-drop",
      file: "03-alter-and-drop.md",
      exercises: [
        {
          title: "Add, backfill and rename",
          prompt: `Change \`customers\` in three steps:

1. add a column \`full_name\` (up to 101 characters);
2. backfill it with the first and last name separated by one space — a customer with no last name gets just the first name (use \`CONCAT_WS\`, which skips NULLs; \`CONCAT\` would return NULL);
3. rename \`phone\` to \`phone_number\`.

Then print \`id, full_name, phone_number\`, ordered by \`id\`.

| id | first_name | last_name | phone |
| --- | --- | --- | --- |
| 1 | Asha | Rao | 98200 11111 |
| 2 | Ben | NULL | NULL |
| 3 | Chen | Li | 98200 33333 |

\`\`\`text
id | full_name | phone_number
1 | Asha Rao | 98200 11111
2 | Ben | NULL
3 | Chen Li | 98200 33333
\`\`\``,
          starter: String.raw`-- 1. ADD COLUMN   2. UPDATE (backfill)   3. RENAME COLUMN


SELECT id, full_name, phone_number
FROM customers
ORDER BY id;
`,
          solution: String.raw`ALTER TABLE customers ADD COLUMN full_name VARCHAR(101);

UPDATE customers
SET full_name = CONCAT_WS(' ', first_name, last_name);

ALTER TABLE customers RENAME COLUMN phone TO phone_number;

SELECT id, full_name, phone_number
FROM customers
ORDER BY id;
`,
          hints: [
            "`ALTER TABLE customers ADD COLUMN full_name VARCHAR(101);` — the new column starts NULL on every row.",
            "`CONCAT_WS(' ', first_name, last_name)` puts the separator only between non-NULL values.",
            "`ALTER TABLE customers RENAME COLUMN phone TO phone_number;`",
          ],
          cases: [
            {
              stdin: customersAlterSetup("INSERT INTO customers VALUES (1, 'Asha', 'Rao', '98200 11111'), (2, 'Ben', NULL, NULL), (3, 'Chen', 'Li', '98200 33333');"),
              expected: "id | full_name | phone_number\n1 | Asha Rao | 98200 11111\n2 | Ben | NULL\n3 | Chen Li | 98200 33333\n",
            },
            {
              stdin: customersAlterSetup(""),
              expected: "id | full_name | phone_number\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: customersAlterSetup("INSERT INTO customers VALUES (9, 'Dev', 'Shah', NULL), (4, 'Eve', NULL, '91234 56789');"),
              expected: "id | full_name | phone_number\n4 | Eve | 91234 56789\n9 | Dev Shah | NULL\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Clean up a legacy table",
          prompt: `The old \`tbl_users\` table needs tidying. In order:

1. drop the unused column \`legacy_flag\`;
2. rename the table to \`users\`;
3. add a column \`status\` (up to 10 characters, required, default \`'active'\`);
4. set \`status\` to \`'dormant'\` for users who signed up **before 2023-01-01**.

Then print every column of \`users\` with \`SELECT *\`, ordered by \`id\` — the columns are \`id, username, signup_date, status\` in that order.

| id | username | legacy_flag | signup_date |
| --- | --- | --- | --- |
| 1 | asha | 1 | 2022-03-10 |
| 2 | ben | 0 | 2023-05-01 |
| 3 | chen | NULL | 2022-12-31 |

\`\`\`text
id | username | signup_date | status
1 | asha | 2022-03-10 | dormant
2 | ben | 2023-05-01 | active
3 | chen | 2022-12-31 | dormant
\`\`\``,
          starter: String.raw`-- 1. DROP COLUMN   2. RENAME TO   3. ADD COLUMN   4. UPDATE


SELECT * FROM users ORDER BY id;
`,
          solution: String.raw`ALTER TABLE tbl_users DROP COLUMN legacy_flag;
ALTER TABLE tbl_users RENAME TO users;
ALTER TABLE users ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'active';

UPDATE users
SET status = 'dormant'
WHERE signup_date < '2023-01-01';

SELECT * FROM users ORDER BY id;
`,
          hints: [
            "`ALTER TABLE tbl_users DROP COLUMN legacy_flag;` then `ALTER TABLE tbl_users RENAME TO users;` — after the rename, use the new name.",
            "A NOT NULL column can be added to a table with rows because the DEFAULT gives the old rows a value.",
          ],
          cases: [
            {
              stdin: legacyUsersSetup("INSERT INTO tbl_users VALUES (1, 'asha', 1, '2022-03-10'), (2, 'ben', 0, '2023-05-01'), (3, 'chen', NULL, '2022-12-31');"),
              expected: "id | username | signup_date | status\n1 | asha | 2022-03-10 | dormant\n2 | ben | 2023-05-01 | active\n3 | chen | 2022-12-31 | dormant\n",
            },
            {
              stdin: legacyUsersSetup("INSERT INTO tbl_users VALUES (5, 'dev', 1, '2023-01-01'), (6, 'eve', 1, '2024-02-29');"),
              expected: "id | username | signup_date | status\n5 | dev | 2023-01-01 | active\n6 | eve | 2024-02-29 | active\n",
              hidden: true,
            },
            {
              stdin: legacyUsersSetup(""),
              expected: "id | username | signup_date | status\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`ALTER TABLE orders ADD COLUMN channel VARCHAR(10) NOT NULL;` fails on a table with rows (strict mode). Why?",
          options: [
            "VARCHAR columns cannot be added later",
            "The existing rows would need a value and the column has no DEFAULT",
            "NOT NULL can only be declared in CREATE TABLE",
            "ADD COLUMN requires AFTER",
          ],
          answer: 1,
          explanation: "Old rows get the default or NULL. With NOT NULL and no default there is nothing to give them. Add a DEFAULT, or add it nullable, backfill, then MODIFY to NOT NULL.",
        },
        {
          prompt: "What does `ALTER TABLE products MODIFY price DECIMAL(12,2);` do if `price` was `DECIMAL(10,2) NOT NULL DEFAULT 0`?",
          options: [
            "Widens the type and keeps NOT NULL and the default",
            "Widens the type; the column becomes nullable with no default, because MODIFY replaces the whole definition",
            "Fails: MODIFY cannot change types",
            "Renames the column",
          ],
          answer: 1,
          explanation: "MODIFY restates the column from scratch; anything omitted is dropped. Repeat `NOT NULL DEFAULT 0` to keep them.",
        },
        {
          prompt: "Which MySQL statement swaps a rebuilt table in for the live one with no moment where the name is missing?",
          options: [
            "`DROP TABLE users; ALTER TABLE users_new RENAME TO users;`",
            "`RENAME TABLE users TO users_old, users_new TO users;`",
            "`TRUNCATE TABLE users; INSERT INTO users SELECT * FROM users_new;`",
            "`ALTER TABLE users REPLACE users_new;`",
          ],
          answer: 1,
          explanation: "RENAME TABLE with several pairs is atomic. The DROP-then-rename version leaves a gap, and the TRUNCATE version is slow and not atomic in MySQL.",
        },
        {
          prompt: "You need to add `UNIQUE (email)` to a table that already contains duplicate emails. What happens?",
          options: [
            "MySQL keeps the first duplicate and deletes the rest",
            "The ALTER fails; find and fix the duplicates first (e.g. GROUP BY email HAVING COUNT(*) > 1)",
            "The constraint is added and applies only to new rows",
            "The duplicates are set to NULL",
          ],
          answer: 1,
          explanation: "Adding a constraint validates the existing rows. Clean the data, then add the constraint.",
        },
        {
          prompt: "What does `RENAME COLUMN` change in MySQL 8?",
          options: ["Only the column's name", "The name and the type", "The column's position", "The table's name"],
          answer: 0,
          explanation: "RENAME COLUMN keeps the definition. CHANGE renames and redefines (full definition required); MODIFY redefines without renaming.",
        },
      ],
    },
    {
      slug: "normalization",
      file: "04-normalization.md",
      exercises: [
        {
          title: "Pull customers and products out of a flat sheet",
          prompt: `\`order_sheet\` is an export with one row per order line, repeating every customer's and product's details:

| order_id | order_date | customer_email | customer_name | sku | product_name | unit_price | qty |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2024-05-01 | asha@x.io | Asha | P1 | Pen | 1.50 | 10 |
| 1 | 2024-05-01 | asha@x.io | Asha | P2 | Pad | 3.00 | 2 |
| 2 | 2024-05-03 | ben@x.io | Ben | P1 | Pen | 1.50 | 4 |
| 3 | 2024-05-04 | asha@x.io | Asha | P3 | Ink | 7.25 | 1 |
| 3 | 2024-05-04 | asha@x.io | Asha | P1 | Pen | 1.50 | 5 |

Store each customer and each product once:

- \`customers(email VARCHAR(100) PRIMARY KEY, name VARCHAR(50) NOT NULL)\`;
- \`products(sku VARCHAR(10) PRIMARY KEY, name VARCHAR(50) NOT NULL, unit_price DECIMAL(8,2) NOT NULL)\`.

Create both and fill them from the sheet with \`INSERT ... SELECT DISTINCT\`. Then print \`email, name\` from customers ordered by \`email\`, and \`sku, name, unit_price\` from products ordered by \`sku\`.

\`\`\`text
email | name
asha@x.io | Asha
ben@x.io | Ben

sku | name | unit_price
P1 | Pen | 1.5
P2 | Pad | 3
P3 | Ink | 7.25
\`\`\``,
          starter: String.raw`-- Create customers and products, then fill them from order_sheet.


SELECT email, name FROM customers ORDER BY email;

SELECT sku, name, unit_price FROM products ORDER BY sku;
`,
          solution: String.raw`CREATE TABLE customers (
  email VARCHAR(100) PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);
CREATE TABLE products (
  sku VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL
);

INSERT INTO customers (email, name)
SELECT DISTINCT customer_email, customer_name
FROM order_sheet;

INSERT INTO products (sku, name, unit_price)
SELECT DISTINCT sku, product_name, unit_price
FROM order_sheet;

SELECT email, name FROM customers ORDER BY email;

SELECT sku, name, unit_price FROM products ORDER BY sku;
`,
          hints: [
            "`customer_email → customer_name` and `sku → product_name, unit_price` are the dependencies that say these facts belong in their own tables.",
            "`INSERT INTO customers (email, name) SELECT DISTINCT customer_email, customer_name FROM order_sheet;` — DISTINCT keeps one row per customer.",
          ],
          cases: [
            { stdin: sheetSetup(SHEET_ROWS), expected: "email | name\nasha@x.io | Asha\nben@x.io | Ben\n\nsku | name | unit_price\nP1 | Pen | 1.5\nP2 | Pad | 3\nP3 | Ink | 7.25\n" },
            {
              stdin: sheetSetup(""),
              expected: "email | name\n(no rows)\n\nsku | name | unit_price\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: sheetSetup("INSERT INTO order_sheet VALUES (7, '2024-06-01', 'zoe@x.io', 'Zoe', 'K9', 'Kite', 12.00, 1), (8, '2024-06-02', 'max@x.io', 'Max', 'K9', 'Kite', 12.00, 2), (8, '2024-06-02', 'max@x.io', 'Max', 'B1', 'Ball', 4.40, 3);"),
              expected: "email | name\nmax@x.io | Max\nzoe@x.io | Zoe\n\nsku | name | unit_price\nB1 | Ball | 4.4\nK9 | Kite | 12\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Finish the decomposition and rebuild the report",
          prompt: `\`customers\` and \`products\` already exist (as in the previous exercise). Finish moving \`order_sheet\` into third normal form:

- \`orders(order_id INT PRIMARY KEY, order_date DATE NOT NULL, customer_email VARCHAR(100) NOT NULL)\` — one row per order;
- \`order_lines(order_id INT NOT NULL, sku VARCHAR(10) NOT NULL, qty INT NOT NULL, unit_price DECIMAL(8,2) NOT NULL, PRIMARY KEY (order_id, sku))\` — one row per line, keeping the price paid on that order.

Create and fill both from the sheet. The starter's first SELECT counts their rows — keep it. Then write the report from the **new** tables (not from \`order_sheet\`): per order, \`order_id, order_date, customer\` (the customer's name from \`customers\`), \`items\` (total quantity) and \`total\` (sum of qty × unit_price), ordered by \`order_id\`.

\`\`\`text
order_rows | line_rows
3 | 5

order_id | order_date | customer | items | total
1 | 2024-05-01 | Asha | 12 | 21
2 | 2024-05-03 | Ben | 4 | 6
3 | 2024-05-04 | Asha | 6 | 14.75
\`\`\``,
          starter: String.raw`-- Create and fill orders and order_lines from order_sheet.


SELECT (SELECT COUNT(*) FROM orders) AS order_rows,
       (SELECT COUNT(*) FROM order_lines) AS line_rows;

-- The report: order_id, order_date, customer, items, total
`,
          solution: String.raw`CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  order_date DATE NOT NULL,
  customer_email VARCHAR(100) NOT NULL
);
CREATE TABLE order_lines (
  order_id INT NOT NULL,
  sku VARCHAR(10) NOT NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  PRIMARY KEY (order_id, sku)
);

INSERT INTO orders (order_id, order_date, customer_email)
SELECT DISTINCT order_id, order_date, customer_email
FROM order_sheet;

INSERT INTO order_lines (order_id, sku, qty, unit_price)
SELECT order_id, sku, qty, unit_price
FROM order_sheet;

SELECT (SELECT COUNT(*) FROM orders) AS order_rows,
       (SELECT COUNT(*) FROM order_lines) AS line_rows;

SELECT o.order_id,
       o.order_date,
       c.name AS customer,
       SUM(l.qty) AS items,
       SUM(l.qty * l.unit_price) AS total
FROM orders o
JOIN customers c ON c.email = o.customer_email
JOIN order_lines l ON l.order_id = o.order_id
GROUP BY o.order_id, o.order_date, c.name
ORDER BY o.order_id;
`,
          hints: [
            "`order_id → order_date, customer_email`, so orders take `SELECT DISTINCT order_id, order_date, customer_email`.",
            "Every sheet row is one order line; the line keeps `unit_price` because the price paid on an order is its own fact.",
            "The report joins orders → customers (by email) and orders → order_lines, then GROUP BY the order.",
          ],
          cases: [
            {
              stdin: sheetWithMastersSetup(
                SHEET_ROWS,
                "INSERT INTO customers VALUES ('asha@x.io', 'Asha'), ('ben@x.io', 'Ben');",
                "INSERT INTO products VALUES ('P1', 'Pen', 1.50), ('P2', 'Pad', 3.00), ('P3', 'Ink', 7.25);",
              ),
              expected: "order_rows | line_rows\n3 | 5\n\norder_id | order_date | customer | items | total\n1 | 2024-05-01 | Asha | 12 | 21\n2 | 2024-05-03 | Ben | 4 | 6\n3 | 2024-05-04 | Asha | 6 | 14.75\n",
            },
            {
              stdin: sheetWithMastersSetup(
                "INSERT INTO order_sheet VALUES (8, '2024-06-02', 'max@x.io', 'Max', 'K9', 'Kite', 12.00, 2), (7, '2024-06-01', 'zoe@x.io', 'Zoe', 'K9', 'Kite', 12.00, 1), (8, '2024-06-02', 'max@x.io', 'Max', 'B1', 'Ball', 4.40, 3);",
                "INSERT INTO customers VALUES ('zoe@x.io', 'Zoe'), ('max@x.io', 'Max');",
                "INSERT INTO products VALUES ('K9', 'Kite', 12.00), ('B1', 'Ball', 4.40);",
              ),
              expected: "order_rows | line_rows\n2 | 3\n\norder_id | order_date | customer | items | total\n7 | 2024-06-01 | Zoe | 1 | 12\n8 | 2024-06-02 | Max | 5 | 37.2\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A customer moves city, and her city must be changed on 40 order rows; one is missed. Which anomaly is this?",
          options: ["Insert anomaly", "Update anomaly", "Delete anomaly", "Phantom read"],
          answer: 1,
          explanation: "The same fact stored many times must be updated everywhere, and a missed copy leaves the data contradicting itself.",
        },
        {
          prompt: "`order_lines(order_id, product_id, product_name, qty)` has primary key `(order_id, product_id)`. Which normal form does `product_name` break?",
          options: ["1NF", "2NF", "3NF only", "None"],
          answer: 1,
          explanation: "`product_name` depends on `product_id` alone — part of the composite key. That partial dependency is what 2NF forbids.",
        },
        {
          prompt: "`employees(id PK, dept_id, dept_name)` — `dept_name` depends on `dept_id`. Which normal form is broken?",
          options: ["1NF", "2NF", "3NF", "None"],
          answer: 2,
          explanation: "The key is a single column, so 2NF holds, but `id → dept_id → dept_name` is a transitive dependency between non-key columns, which 3NF forbids.",
        },
        {
          prompt: "A `tags` column holds `'sql,mysql,joins'`. Which normal form does that break, and what is the fix?",
          options: [
            "3NF; move tags to another database",
            "1NF; store one row per tag in a separate table (e.g. `post_tags(post_id, tag)`)",
            "BCNF; add an index",
            "None; lists are atomic strings",
          ],
          answer: 1,
          explanation: "A list in a cell is not atomic: it cannot be indexed, joined or constrained per tag.",
        },
        {
          prompt: "What does BCNF require that 3NF does not?",
          options: [
            "No NULLs",
            "Every determinant of a functional dependency is a candidate key, with no exception for prime attributes",
            "A surrogate key in every table",
            "No composite keys",
          ],
          answer: 1,
          explanation: "3NF allows X → Y when Y is part of a candidate key; BCNF does not. They differ only with overlapping candidate keys.",
        },
      ],
    },
    {
      slug: "relationships",
      file: "05-relationships.md",
      exercises: [
        {
          title: "Build a many-to-many",
          prompt: `Students take many courses and courses have many students. \`enrol_raw(student_name, course_code)\` lists enrolments by name — and may name the same pairing twice.

1. Create the junction table \`enrolments(student_id INT NOT NULL, course_id INT NOT NULL)\` with a composite primary key on the pair and foreign keys to \`students(id)\` and \`courses(id)\`.
2. Fill it from \`enrol_raw\`, translating names to ids with joins, each pairing once.
3. Print every course with its number of students — including courses nobody takes — as \`code, students\`, ordered by \`students\` descending, then \`code\`.

\`students(id, name)\`: (1, Asha), (2, Ben), (3, Chen). \`courses(id, code)\`: (1, DB101), (2, OS201), (3, NET301).
\`enrol_raw\`: (Asha, DB101), (Ben, DB101), (Asha, OS201), (Chen, DB101), (Ben, OS201).

\`\`\`text
code | students
DB101 | 3
OS201 | 2
NET301 | 0
\`\`\``,
          starter: String.raw`-- 1. CREATE TABLE enrolments ( ... );
-- 2. Fill it from enrol_raw.
-- 3. code, students for every course.
`,
          solution: String.raw`CREATE TABLE enrolments (
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students (id),
  FOREIGN KEY (course_id) REFERENCES courses (id)
);

INSERT INTO enrolments (student_id, course_id)
SELECT DISTINCT s.id, c.id
FROM enrol_raw r
JOIN students s ON s.name = r.student_name
JOIN courses c ON c.code = r.course_code;

SELECT c.code, COUNT(e.student_id) AS students
FROM courses c
LEFT JOIN enrolments e ON e.course_id = c.id
GROUP BY c.id, c.code
ORDER BY students DESC, c.code;
`,
          hints: [
            "Declare the key and the references after the columns: `PRIMARY KEY (student_id, course_id), FOREIGN KEY (student_id) REFERENCES students (id), ...`.",
            "Join `enrol_raw` to `students` by name and `courses` by code; `SELECT DISTINCT` (or `INSERT IGNORE`) keeps one row per pairing.",
            "Courses with no students need `courses LEFT JOIN enrolments` and `COUNT(e.student_id)`, which counts 0 for them.",
          ],
          cases: [
            {
              stdin: rosterRawSetup(
                "INSERT INTO students VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen');",
                "INSERT INTO courses VALUES (1, 'DB101'), (2, 'OS201'), (3, 'NET301');",
                "INSERT INTO enrol_raw VALUES ('Asha', 'DB101'), ('Ben', 'DB101'), ('Asha', 'OS201'), ('Chen', 'DB101'), ('Ben', 'OS201');",
              ),
              expected: "code | students\nDB101 | 3\nOS201 | 2\nNET301 | 0\n",
            },
            {
              stdin: rosterRawSetup(
                "INSERT INTO students VALUES (1, 'Asha'), (2, 'Ben');",
                "INSERT INTO courses VALUES (1, 'DB101'), (2, 'AI500');",
                "INSERT INTO enrol_raw VALUES ('Asha', 'AI500'), ('Asha', 'AI500'), ('Ben', 'DB101'), ('Ben', 'AI500'), ('Ben', 'DB101');",
              ),
              expected: "code | students\nAI500 | 2\nDB101 | 1\n",
              hidden: true,
            },
            {
              stdin: rosterRawSetup(
                "INSERT INTO students VALUES (4, 'Dev');",
                "INSERT INTO courses VALUES (5, 'ZZ900'), (6, 'AA100');",
                "",
              ),
              expected: "code | students\nAA100 | 0\nZZ900 | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Managers: a self-referencing key",
          prompt: `\`employees\` stores each manager by **name**. Replace that with a self-referencing key:

1. add a column \`manager_id INT\`;
2. fill it with the manager's \`id\`. MySQL refuses an UPDATE whose subquery reads the table being updated (error 1093), so first copy \`id, name\` into a helper table with \`CREATE TABLE emp_lookup AS SELECT ...\`, update from it, then drop it;
3. drop the column \`manager_name\`.

Then print \`SELECT * FROM employees ORDER BY id\` (columns \`id, name, manager_id\`), and each employee with their manager's name as \`employee, manager\` (NULL for the top), ordered by the employee's \`id\`.

| id | name | manager_name |
| --- | --- | --- |
| 1 | Meera | NULL |
| 2 | Ravi | Meera |
| 3 | Sana | Meera |
| 4 | Tom | Ravi |

\`\`\`text
id | name | manager_id
1 | Meera | NULL
2 | Ravi | 1
3 | Sana | 1
4 | Tom | 2

employee | manager
Meera | NULL
Ravi | Meera
Sana | Meera
Tom | Ravi
\`\`\``,
          starter: String.raw`-- 1. ADD COLUMN manager_id
-- 2. CREATE TABLE emp_lookup AS ...; UPDATE ...; DROP TABLE emp_lookup;
-- 3. DROP COLUMN manager_name


SELECT * FROM employees ORDER BY id;

-- employee, manager
`,
          solution: String.raw`ALTER TABLE employees ADD COLUMN manager_id INT;

CREATE TABLE emp_lookup AS SELECT id, name FROM employees;

UPDATE employees
SET manager_id = (SELECT l.id FROM emp_lookup l WHERE l.name = employees.manager_name)
WHERE manager_name IS NOT NULL;

DROP TABLE emp_lookup;

ALTER TABLE employees DROP COLUMN manager_name;

SELECT * FROM employees ORDER BY id;

SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;
`,
          hints: [
            "The helper table is a snapshot: `CREATE TABLE emp_lookup AS SELECT id, name FROM employees;`.",
            "`SET manager_id = (SELECT l.id FROM emp_lookup l WHERE l.name = employees.manager_name)`.",
            "Read the hierarchy with a self join: `employees e LEFT JOIN employees m ON m.id = e.manager_id` — LEFT keeps the person with no manager.",
          ],
          cases: [
            {
              stdin: employeesSetup("INSERT INTO employees VALUES (1, 'Meera', NULL), (2, 'Ravi', 'Meera'), (3, 'Sana', 'Meera'), (4, 'Tom', 'Ravi');"),
              expected: "id | name | manager_id\n1 | Meera | NULL\n2 | Ravi | 1\n3 | Sana | 1\n4 | Tom | 2\n\nemployee | manager\nMeera | NULL\nRavi | Meera\nSana | Meera\nTom | Ravi\n",
            },
            {
              stdin: employeesSetup("INSERT INTO employees VALUES (1, 'Uma', 'Zed'), (2, 'Vik', 'Uma'), (3, 'Zed', NULL), (4, 'Wen', NULL);"),
              expected: "id | name | manager_id\n1 | Uma | 3\n2 | Vik | 1\n3 | Zed | NULL\n4 | Wen | NULL\n\nemployee | manager\nUma | Zed\nVik | Uma\nZed | NULL\nWen | NULL\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Each order belongs to one customer; a customer places many orders. Where does the foreign key go?",
          options: [
            "`customers.order_id`",
            "`orders.customer_id`",
            "In a junction table `customer_orders`",
            "On both tables",
          ],
          answer: 1,
          explanation: "One-to-many puts the key on the many side. A list of order ids on the customer would break 1NF.",
        },
        {
          prompt: "Where does a student's grade in a particular course belong?",
          options: [
            "In `students`",
            "In `courses`",
            "In the junction table `enrolments(student_id, course_id, grade)`",
            "In a separate `grades` table with only a grade column",
          ],
          answer: 2,
          explanation: "The grade depends on both the student and the course — the pairing — so it is an attribute of the junction row.",
        },
        {
          prompt: "`order_items.order_id` references `orders.id` with `ON DELETE CASCADE`. What does `DELETE FROM orders WHERE id = 7` do?",
          options: [
            "Fails while order 7 has items",
            "Deletes order 7 and its items",
            "Deletes order 7 and sets its items' order_id to NULL",
            "Deletes nothing",
          ],
          answer: 1,
          explanation: "CASCADE propagates the delete to the children. RESTRICT/NO ACTION, the default, would refuse; SET NULL would orphan them deliberately.",
        },
        {
          prompt: "How is a one-to-one relationship between `users` and `user_profiles` usually enforced?",
          options: [
            "A foreign key in `user_profiles` that is also its primary key (or UNIQUE)",
            "A junction table",
            "A CHECK constraint",
            "It cannot be enforced",
          ],
          answer: 0,
          explanation: "A unique foreign key allows at most one profile per user; making it the primary key does that and identifies the row.",
        },
        {
          prompt: "`comments(target_type, target_id)` points at posts or photos depending on `target_type`. What is the problem?",
          options: [
            "Nothing; it is the recommended design",
            "`target_id` cannot be a foreign key, so the database cannot keep references valid",
            "It breaks 1NF",
            "It needs a composite primary key",
          ],
          answer: 1,
          explanation: "A foreign key references one table. Polymorphic ids leave integrity to the application; nullable `post_id`/`photo_id` columns with a CHECK are the enforceable alternative.",
        },
      ],
    },
    {
      slug: "views",
      file: "06-views.md",
      exercises: [
        {
          title: "A live revenue view",
          prompt: `Create a view \`customer_revenue\` with the columns \`customer_id, name, orders, revenue\`: every customer, the number of their orders, and the sum of their order totals (0, not NULL, for a customer with no orders).

The starter then records a new order of 50.00 for customer 1 and selects from the view — because a view runs its query on every read, the new order must show up. Leave those statements as they are; the result is \`name, orders, revenue\` ordered by \`revenue\` descending, then \`name\`.

\`customers(id, name)\`: (1, Asha), (2, Ben), (3, Chen).
\`orders(id, customer_id, total)\`: (10, 1, 120.00), (11, 2, 80.50), (12, 1, 30.00).

\`\`\`text
name | orders | revenue
Asha | 3 | 200
Ben | 1 | 80.5
Chen | 0 | 0
\`\`\``,
          starter: String.raw`-- CREATE VIEW customer_revenue AS ...


INSERT INTO orders (id, customer_id, total) VALUES (1000, 1, 50.00);

SELECT name, orders, revenue
FROM customer_revenue
ORDER BY revenue DESC, name;
`,
          solution: String.raw`CREATE VIEW customer_revenue AS
SELECT c.id AS customer_id,
       c.name,
       COUNT(o.id) AS orders,
       COALESCE(SUM(o.total), 0) AS revenue
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;

INSERT INTO orders (id, customer_id, total) VALUES (1000, 1, 50.00);

SELECT name, orders, revenue
FROM customer_revenue
ORDER BY revenue DESC, name;
`,
          hints: [
            "`customers LEFT JOIN orders` keeps customers with no orders; `COUNT(o.id)` gives them 0.",
            "`SUM` over no rows is NULL — wrap it in `COALESCE(..., 0)`.",
            "A table made with CREATE TABLE ... AS SELECT would be a snapshot and miss the new order; a view will not.",
          ],
          cases: [
            {
              stdin: revenueSetup(
                "INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen');",
                "INSERT INTO orders VALUES (10, 1, 120.00), (11, 2, 80.50), (12, 1, 30.00);",
              ),
              expected: "name | orders | revenue\nAsha | 3 | 200\nBen | 1 | 80.5\nChen | 0 | 0\n",
            },
            {
              stdin: revenueSetup(
                "INSERT INTO customers VALUES (1, 'Zed'), (2, 'Amy'), (3, 'Bob');",
                "INSERT INTO orders VALUES (20, 2, 25.00), (21, 2, 25.00), (22, 3, 50.00);",
              ),
              expected: "name | orders | revenue\nAmy | 2 | 50\nBob | 1 | 50\nZed | 1 | 50\n",
              hidden: true,
            },
            {
              stdin: revenueSetup("INSERT INTO customers VALUES (1, 'Solo'), (2, 'Idle');", ""),
              expected: "name | orders | revenue\nSolo | 1 | 50\nIdle | 0 | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Redefine a view",
          prompt: `The setup already has a view \`big_orders\` showing \`id, total\` of orders of 100 or more. The business changed the rule: it should now show \`id, customer, total\` (in that order) of every order of **50 or more** that is **not cancelled**.

MySQL would do this with \`CREATE OR REPLACE VIEW\`; write the portable form, \`DROP VIEW IF EXISTS\` followed by \`CREATE VIEW\`. The starter's SELECT then reads the view, ordered by \`total\` descending, then \`id\`.

\`orders(id, customer, total, status)\`:

| id | customer | total | status |
| --- | --- | --- | --- |
| 1 | Asha | 120.00 | paid |
| 2 | Ben | 55.00 | paid |
| 3 | Chen | 75.00 | cancelled |
| 4 | Dev | 50.00 | pending |
| 5 | Eve | 20.00 | paid |

\`\`\`text
id | customer | total
1 | Asha | 120
2 | Ben | 55
4 | Dev | 50
\`\`\``,
          starter: String.raw`-- Redefine big_orders.


SELECT * FROM big_orders ORDER BY total DESC, id;
`,
          solution: String.raw`DROP VIEW IF EXISTS big_orders;

CREATE VIEW big_orders AS
SELECT id, customer, total
FROM orders
WHERE total >= 50
  AND status <> 'cancelled';

SELECT * FROM big_orders ORDER BY total DESC, id;
`,
          hints: [
            "`DROP VIEW IF EXISTS big_orders;` removes only the stored query — no data is lost.",
            "\"50 or more\" is `total >= 50`; \"not cancelled\" is `status <> 'cancelled'`.",
          ],
          cases: [
            {
              stdin: bigOrdersSetup("INSERT INTO orders VALUES (1, 'Asha', 120.00, 'paid'), (2, 'Ben', 55.00, 'paid'), (3, 'Chen', 75.00, 'cancelled'), (4, 'Dev', 50.00, 'pending'), (5, 'Eve', 20.00, 'paid');"),
              expected: "id | customer | total\n1 | Asha | 120\n2 | Ben | 55\n4 | Dev | 50\n",
            },
            {
              stdin: bigOrdersSetup("INSERT INTO orders VALUES (6, 'Fay', 49.99, 'paid'), (7, 'Gus', 300.00, 'cancelled');"),
              expected: "id | customer | total\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: bigOrdersSetup("INSERT INTO orders VALUES (9, 'Hal', 80.00, 'paid'), (8, 'Ivy', 80.00, 'shipped'), (10, 'Jay', 150.00, 'refunded');"),
              expected: "id | customer | total\n10 | Jay | 150\n8 | Ivy | 80\n9 | Hal | 80\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does a (non-materialized) view store?",
          options: [
            "A copy of the rows its query returned when it was created",
            "Its SELECT statement; rows are computed from the base tables on every read",
            "An index on the base tables",
            "Nothing at all — it is deleted after use",
          ],
          answer: 1,
          explanation: "A view is a named query. That is why it is always current and takes no storage, and why it is only as fast as its query.",
        },
        {
          prompt: "Which is the portable way to change a view's definition in every major database?",
          options: [
            "`ALTER TABLE v ...`",
            "`DROP VIEW IF EXISTS v;` then `CREATE VIEW v AS ...`",
            "`UPDATE VIEW v ...`",
            "`REFRESH VIEW v`",
          ],
          answer: 1,
          explanation: "`CREATE OR REPLACE VIEW` and `ALTER VIEW` exist in MySQL (and OR REPLACE in PostgreSQL/Oracle), but DROP + CREATE works everywhere.",
        },
        {
          prompt: "`CREATE VIEW cheap AS SELECT id, price FROM products WHERE price < 10 WITH CHECK OPTION;` — what does `UPDATE cheap SET price = 25 WHERE id = 3` do?",
          options: [
            "Updates the product to 25 and it disappears from the view",
            "Is refused, because the new row would no longer satisfy the view's WHERE",
            "Updates only the view, not the table",
            "Fails because views are read-only",
          ],
          answer: 1,
          explanation: "WITH CHECK OPTION makes the view's condition a rule for writes through it. Without it, the update would succeed and the row would vanish from the view.",
        },
        {
          prompt: "Which view can MySQL update through?",
          options: [
            "`SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id`",
            "`SELECT DISTINCT city FROM customers`",
            "`SELECT id, name, email FROM customers WHERE is_active = 1`",
            "`SELECT id FROM a UNION SELECT id FROM b`",
          ],
          answer: 2,
          explanation: "Each row of a simple single-table filter maps to one base row. Aggregates, DISTINCT and UNION make a view read-only.",
        },
        {
          prompt: "MySQL has no materialized views. What is the usual substitute?",
          options: [
            "An ordinary view",
            "A summary table rebuilt on a schedule (or maintained by the application)",
            "A temporary table",
            "An index",
          ],
          answer: 1,
          explanation: "A summary table stores precomputed results like a materialized view, refreshed by a job — e.g. CTAS into a new table and RENAME TABLE to swap it in.",
        },
      ],
    },
    {
      slug: "schema-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A library schema from a loan log",
          prompt: `\`loan_log(id, member_email, member_name, isbn, title, borrowed_on)\` is a flat record of every loan. Normalize it into three tables:

- \`members(id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(100) NOT NULL UNIQUE, name VARCHAR(50) NOT NULL)\`;
- \`books(isbn VARCHAR(13) PRIMARY KEY, title VARCHAR(100) NOT NULL)\`;
- \`loans(member_id INT NOT NULL, isbn VARCHAR(13) NOT NULL, borrowed_on DATE NOT NULL)\` with a primary key on all three columns and foreign keys to \`members\` and \`books\`.

Fill \`members\` in **email order** (so ids are numbered alphabetically by email), then \`books\`, then \`loans\` (translating emails to member ids with a join). Print the members as \`id, email\` ordered by \`id\`, then each member's loan count as \`name, loans\` ordered by \`loans\` descending, then \`name\`.

| id | member_email | member_name | isbn | title | borrowed_on |
| --- | --- | --- | --- | --- | --- |
| 1 | ravi@lib.io | Ravi | 9780132350884 | Clean Code | 2024-03-01 |
| 2 | asha@lib.io | Asha | 9780596007126 | Head First Design Patterns | 2024-03-02 |
| 3 | ravi@lib.io | Ravi | 9780596007126 | Head First Design Patterns | 2024-03-10 |
| 4 | meera@lib.io | Meera | 9780132350884 | Clean Code | 2024-03-12 |
| 5 | ravi@lib.io | Ravi | 9780132350884 | Clean Code | 2024-04-01 |

\`\`\`text
id | email
1 | asha@lib.io
2 | meera@lib.io
3 | ravi@lib.io

name | loans
Ravi | 3
Asha | 1
Meera | 1
\`\`\``,
          starter: String.raw`-- Create members, books and loans; fill them from loan_log.


SELECT id, email FROM members ORDER BY id;

-- name, loans
`,
          solution: String.raw`CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL
);
CREATE TABLE books (
  isbn VARCHAR(13) PRIMARY KEY,
  title VARCHAR(100) NOT NULL
);
CREATE TABLE loans (
  member_id INT NOT NULL,
  isbn VARCHAR(13) NOT NULL,
  borrowed_on DATE NOT NULL,
  PRIMARY KEY (member_id, isbn, borrowed_on),
  FOREIGN KEY (member_id) REFERENCES members (id),
  FOREIGN KEY (isbn) REFERENCES books (isbn)
);

INSERT INTO members (email, name)
SELECT DISTINCT member_email, member_name
FROM loan_log
ORDER BY member_email;

INSERT INTO books (isbn, title)
SELECT DISTINCT isbn, title
FROM loan_log;

INSERT INTO loans (member_id, isbn, borrowed_on)
SELECT m.id, l.isbn, l.borrowed_on
FROM loan_log l
JOIN members m ON m.email = l.member_email;

SELECT id, email FROM members ORDER BY id;

SELECT m.name, COUNT(*) AS loans
FROM members m
JOIN loans l ON l.member_id = m.id
GROUP BY m.id, m.name
ORDER BY loans DESC, m.name;
`,
          hints: [
            "`id INT AUTO_INCREMENT PRIMARY KEY` numbers rows in insertion order, so insert members with `ORDER BY member_email`.",
            "`INSERT INTO loans ... SELECT m.id, l.isbn, l.borrowed_on FROM loan_log l JOIN members m ON m.email = l.member_email`.",
            "The report joins members to loans and groups by member.",
          ],
          cases: [
            {
              stdin: loanLogSetup("INSERT INTO loan_log VALUES (1, 'ravi@lib.io', 'Ravi', '9780132350884', 'Clean Code', '2024-03-01'), (2, 'asha@lib.io', 'Asha', '9780596007126', 'Head First Design Patterns', '2024-03-02'), (3, 'ravi@lib.io', 'Ravi', '9780596007126', 'Head First Design Patterns', '2024-03-10'), (4, 'meera@lib.io', 'Meera', '9780132350884', 'Clean Code', '2024-03-12'), (5, 'ravi@lib.io', 'Ravi', '9780132350884', 'Clean Code', '2024-04-01');"),
              expected: "id | email\n1 | asha@lib.io\n2 | meera@lib.io\n3 | ravi@lib.io\n\nname | loans\nRavi | 3\nAsha | 1\nMeera | 1\n",
            },
            {
              stdin: loanLogSetup("INSERT INTO loan_log VALUES (1, 'zoe@lib.io', 'Zoe', '9781449373320', 'Designing Data-Intensive Applications', '2024-05-01'), (2, 'zoe@lib.io', 'Zoe', '9781491950357', 'Building Microservices', '2024-05-03'), (3, 'ali@lib.io', 'Ali', '9781449373320', 'Designing Data-Intensive Applications', '2024-05-20'), (4, 'ali@lib.io', 'Ali', '9781491950357', 'Building Microservices', '2024-05-21');"),
              expected: "id | email\n1 | ali@lib.io\n2 | zoe@lib.io\n\nname | loans\nAli | 2\nZoe | 2\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Migrate the price column",
          prompt: `\`products\` stores prices as integer cents and carries a dead column. Migrate it, in order:

1. add \`price DECIMAL(10,2)\`;
2. backfill it as \`price_cents / 100\`;
3. drop \`price_cents\`;
4. rename \`title\` to \`name\`;
5. drop \`old_sku\`;
6. add \`currency CHAR(3) NOT NULL DEFAULT 'INR'\`.

Then print \`SELECT * FROM products ORDER BY id\` — the columns are \`id, name, price, currency\`.

| id | title | price_cents | old_sku |
| --- | --- | --- | --- |
| 1 | Pen | 150 | X1 |
| 2 | Notebook | 1999 | X2 |
| 3 | Bag | 120000 | NULL |

\`\`\`text
id | name | price | currency
1 | Pen | 1.5 | INR
2 | Notebook | 19.99 | INR
3 | Bag | 1200 | INR
\`\`\``,
          starter: String.raw`-- Six ALTER/UPDATE steps.


SELECT * FROM products ORDER BY id;
`,
          solution: String.raw`ALTER TABLE products ADD COLUMN price DECIMAL(10,2);
UPDATE products SET price = price_cents / 100;
ALTER TABLE products DROP COLUMN price_cents;
ALTER TABLE products RENAME COLUMN title TO name;
ALTER TABLE products DROP COLUMN old_sku;
ALTER TABLE products ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'INR';

SELECT * FROM products ORDER BY id;
`,
          hints: [
            "Add, backfill, then drop the old column — the backfill needs `price_cents` to still exist.",
            "In MySQL `/` is decimal division, so `1999 / 100` is 19.99.",
            "The NOT NULL `currency` column can be added to a table with rows because of its DEFAULT.",
          ],
          cases: [
            {
              stdin: legacyProductsSetup("INSERT INTO products VALUES (1, 'Pen', 150, 'X1'), (2, 'Notebook', 1999, 'X2'), (3, 'Bag', 120000, NULL);"),
              expected: "id | name | price | currency\n1 | Pen | 1.5 | INR\n2 | Notebook | 19.99 | INR\n3 | Bag | 1200 | INR\n",
            },
            {
              stdin: legacyProductsSetup("INSERT INTO products VALUES (7, 'Sticker', 5, NULL), (4, 'Lamp', 0, 'L4');"),
              expected: "id | name | price | currency\n4 | Lamp | 0 | INR\n7 | Sticker | 0.05 | INR\n",
              hidden: true,
            },
          ],
        },
        {
          title: "A course roster view",
          prompt: `Create a view \`course_roster\` with the columns \`code, student, enrolled_on\` — one row per enrolment, joining \`enrolments\` to \`courses\` and \`students\`.

The starter then enrols Ben (student 2) in course 1 and reads the view twice: the roster of course \`DB101\` as \`student\` ordered by name, and the number of students per course as \`code, students\` ordered by \`code\`. Leave those statements as they are.

\`students\`: (1, Asha), (2, Ben), (3, Chen). \`courses\`: (1, DB101), (2, OS201).
\`enrolments(student_id, course_id, enrolled_on)\`: (1, 1, 2024-01-10), (3, 1, 2024-01-12), (1, 2, 2024-01-15), (2, 2, 2024-01-20).

\`\`\`text
student
Asha
Ben
Chen

code | students
DB101 | 3
OS201 | 2
\`\`\``,
          starter: String.raw`-- CREATE VIEW course_roster AS ...


INSERT INTO enrolments (student_id, course_id, enrolled_on) VALUES (2, 1, '2024-02-01');

SELECT student FROM course_roster WHERE code = 'DB101' ORDER BY student;

SELECT code, COUNT(*) AS students FROM course_roster GROUP BY code ORDER BY code;
`,
          solution: String.raw`CREATE VIEW course_roster AS
SELECT c.code, s.name AS student, e.enrolled_on
FROM enrolments e
JOIN courses c ON c.id = e.course_id
JOIN students s ON s.id = e.student_id;

INSERT INTO enrolments (student_id, course_id, enrolled_on) VALUES (2, 1, '2024-02-01');

SELECT student FROM course_roster WHERE code = 'DB101' ORDER BY student;

SELECT code, COUNT(*) AS students FROM course_roster GROUP BY code ORDER BY code;
`,
          hints: [
            "The junction table sits in the middle: `enrolments e JOIN courses c ON c.id = e.course_id JOIN students s ON s.id = e.student_id`.",
            "Alias the name column `student` — the starter's SELECTs read it by that name.",
          ],
          cases: [
            {
              stdin: rosterSetup(
                "INSERT INTO students VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen');",
                "INSERT INTO courses VALUES (1, 'DB101'), (2, 'OS201');",
                "INSERT INTO enrolments VALUES (1, 1, '2024-01-10'), (3, 1, '2024-01-12'), (1, 2, '2024-01-15'), (2, 2, '2024-01-20');",
              ),
              expected: "student\nAsha\nBen\nChen\n\ncode | students\nDB101 | 3\nOS201 | 2\n",
            },
            {
              stdin: rosterSetup(
                "INSERT INTO students VALUES (1, 'Zara'), (2, 'Ben'), (4, 'Amir');",
                "INSERT INTO courses VALUES (1, 'DB101'), (3, 'AI500');",
                "INSERT INTO enrolments VALUES (4, 3, '2024-03-01');",
              ),
              expected: "student\nBen\n\ncode | students\nAI500 | 1\nDB101 | 1\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which type is right for an account balance in rupees and paise?",
          options: ["`FLOAT`", "`DOUBLE`", "`DECIMAL(12,2)`", "`INT`"],
          answer: 2,
          explanation: "DECIMAL is exact. (Integer paise in a BIGINT is the other correct design; a plain INT of rupees loses the paise.)",
        },
        {
          prompt: "How many primary keys and unique keys can a MySQL table have?",
          options: [
            "One primary key; any number of unique keys",
            "Any number of each",
            "One of each",
            "One primary key; no unique keys alongside it",
          ],
          answer: 0,
          explanation: "Exactly one primary key (possibly composite); unique keys are unlimited in practice.",
        },
        {
          prompt: "Which DDL statement keeps the table but removes all its rows?",
          options: ["`DROP TABLE t`", "`TRUNCATE TABLE t`", "`ALTER TABLE t DROP COLUMN c`", "`DROP VIEW t`"],
          answer: 1,
          explanation: "TRUNCATE empties the table and keeps its structure; DROP removes the table itself.",
        },
        {
          prompt: "What is the safe way to add a required column whose value differs per existing row?",
          options: [
            "Add it NOT NULL with no default",
            "Add it nullable, backfill it with UPDATE, then MODIFY it to NOT NULL",
            "Drop and recreate the table",
            "Add it with DEFAULT NULL NOT NULL",
          ],
          answer: 1,
          explanation: "Add → backfill → constrain. The final MODIFY also proves the backfill missed no row.",
        },
        {
          prompt: "What does `CHECK (age >= 18)` do with a row whose age is NULL?",
          options: ["Rejects it", "Accepts it", "Sets age to 18", "Converts it to 0"],
          answer: 1,
          explanation: "The condition is unknown, and only a false condition violates a CHECK. Add NOT NULL to require a value.",
        },
        {
          prompt: "`enrolments(student_id, course_id, student_name)` with key `(student_id, course_id)`. Which normal form is broken?",
          options: ["1NF", "2NF", "3NF only", "BCNF only"],
          answer: 1,
          explanation: "`student_name` depends on `student_id` alone, part of the composite key — a partial dependency.",
        },
        {
          prompt: "The rule \"every non-key column depends on the key, the whole key, and nothing but the key\" summarises which normal forms?",
          options: ["1NF only", "1NF to 3NF", "BCNF and 4NF", "5NF"],
          answer: 1,
          explanation: "\"The key\" (1NF, a key exists and values are atomic), \"the whole key\" (2NF), \"nothing but the key\" (3NF).",
        },
        {
          prompt: "Where is a many-to-many relationship between `authors` and `books` stored?",
          options: [
            "`books.author_id`",
            "`authors.book_ids` as a comma-separated list",
            "A junction table `book_authors(book_id, author_id)` with a composite key",
            "It cannot be stored relationally",
          ],
          answer: 2,
          explanation: "Each side is one-to-many with the junction table, whose composite key prevents duplicate pairings.",
        },
        {
          prompt: "Which `ON DELETE` action keeps the child rows but clears their reference to a deleted parent?",
          options: ["`CASCADE`", "`RESTRICT`", "`SET NULL`", "`NO ACTION`"],
          answer: 2,
          explanation: "SET NULL needs a nullable foreign-key column. CASCADE deletes children; RESTRICT/NO ACTION refuse the delete.",
        },
        {
          prompt: "Which statement about views is true?",
          options: [
            "A view is refreshed nightly",
            "A view can be indexed like a table in MySQL",
            "Selecting from a view runs its query against the current base tables",
            "Dropping a view deletes the base tables' rows",
          ],
          answer: 2,
          explanation: "A view stores only its query, so it is always current; dropping it loses no data and it has no indexes of its own.",
        },
        {
          prompt: "A table's id is `INT` and the business expects billions of events. What is the risk and the fix?",
          options: [
            "No risk; INT is unlimited",
            "INT tops out near 2.1 billion (4.29 billion unsigned); use BIGINT from the start",
            "Use VARCHAR ids instead",
            "Use DECIMAL ids",
          ],
          answer: 1,
          explanation: "Running out of INT ids stops inserts; widening a huge table later is a long migration. BIGINT costs 4 more bytes per row.",
        },
        {
          prompt: "In MySQL, why can't `UPDATE employees SET manager_id = (SELECT id FROM employees m WHERE m.name = employees.manager_name)` run?",
          options: [
            "Self-references are not allowed in MySQL",
            "MySQL refuses an UPDATE whose subquery reads the table being updated (error 1093); use a join, a derived table or a helper table",
            "The subquery returns more than one column",
            "manager_id must be declared NOT NULL first",
          ],
          answer: 1,
          explanation: "Error 1093: you can't specify the target table for update in FROM. A multi-table UPDATE with a self join, or a copied helper table, avoids it.",
        },
      ],
    },
  ],
});
