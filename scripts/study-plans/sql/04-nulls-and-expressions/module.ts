import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "nulls-and-expressions",
  title: "NULLs and expressions",
  blurb: "NULL as a missing value, UNKNOWN and three-valued logic, IS NULL and MySQL's NULL-safe equality, COALESCE, IFNULL and NULLIF, searched and simple CASE, data types, DIV versus decimal division, implicit conversion and CAST.",
  icon: "alert",
  overview: `Real tables have gaps, and SQL marks every gap with one thing: \`NULL\`. It is not zero and not an empty string, and it follows rules of its own — arithmetic with it gives NULL, comparisons with it give a third truth value, UNKNOWN, and \`WHERE\` keeps only rows that are TRUE. Those rules explain more wrong query results than anything else in SQL, and they are a fixture of interviews: \`NULL = NULL\`, \`NOT IN\` with a NULL, \`COUNT(*)\` versus \`COUNT(col)\`. This module teaches the rules, the tools that test for and replace NULLs, the \`CASE\` expression that lets a query make decisions, and the types and conversions every expression runs on. The examples are MySQL 8, with the spellings of SQL Server, Oracle and PostgreSQL called out where interviewers ask about them.

NULL and three-valued logic covers what NULL means, how it spreads through expressions, UNKNOWN, the truth tables for AND, OR and NOT, why rows vanish from both \`=\` and \`<>\`, and the \`NOT IN\` trap. IS NULL covers \`IS NULL\`/\`IS NOT NULL\`, the \`= NULL\` mistake, parentheses with OR, MySQL's \`<=>\`, \`IS DISTINCT FROM\` and the \`IS TRUE\` family. COALESCE, IFNULL and NULLIF covers defaults, the other databases' \`ISNULL\` and \`NVL\`, turning placeholders into NULL and guarding a division. CASE covers searched and simple forms, first-match-wins, ELSE and NULL, CASE in WHERE and ORDER BY, and MySQL's \`IF()\`. Types and CAST covers the MySQL types, DECIMAL versus FLOAT, \`/\` versus \`DIV\`, implicit conversion and \`CAST\`/\`CONVERT\`.

The exercises are queries against small tables full of gaps: line totals with missing quantities, everyone outside one department, incomplete contact details, prices that changed, display names with fallbacks, a click-through rate that never divides by zero, grade bands, an order-status board in a custom order, ticket codes sorted as numbers and boxes packed with DIV and MOD. The checkpoint adds a delivery fee with an optional discount, a contact list that treats blanks as missing, and an audit that labels every change.`,
  lessons: [
    {
      slug: "null-and-three-valued-logic",
      file: "01-null-and-three-valued-logic.md",
      exercises: [
        {
          title: "Line totals with missing data",
          prompt: `The \`order_lines\` table; some quantities and prices were never recorded:

| id | item | qty | unit_price |
| --- | --- | --- | --- |
| 1 | pen | 10 | 5 |
| 2 | lamp | NULL | 450 |
| 3 | desk | 1 | NULL |
| 4 | mug | 30 | 4 |

For every line return \`id\`, \`item\`, \`total\` (= \`qty * unit_price\`) and \`is_large\` (the comparison \`qty * unit_price > 100\`, which MySQL shows as 1 or 0), ordered by \`id\`. Do not replace the missing values — let NULL show where the answer is unknown.

\`\`\`text
id | item | total | is_large
1 | pen | 50 | 0
2 | lamp | NULL | NULL
3 | desk | NULL | NULL
4 | mug | 120 | 1
\`\`\``,
          starter: String.raw`-- id, item, total = qty * unit_price, is_large = total > 100,
-- ordered by id.
`,
          solution: String.raw`SELECT id,
       item,
       qty * unit_price AS total,
       qty * unit_price > 100 AS is_large
FROM order_lines
ORDER BY id;
`,
          hints: [
            "A comparison is an expression in MySQL — it can be a column, giving 1, 0 or NULL.",
            "You cannot reuse the alias `total` in another column of the same SELECT; write `qty * unit_price > 100` out again.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE order_lines (id INT PRIMARY KEY, item VARCHAR(40), qty INT, unit_price INT);
INSERT INTO order_lines VALUES (1, 'pen', 10, 5), (2, 'lamp', NULL, 450), (3, 'desk', 1, NULL), (4, 'mug', 30, 4);
`,
              expected: "id | item | total | is_large\n1 | pen | 50 | 0\n2 | lamp | NULL | NULL\n3 | desk | NULL | NULL\n4 | mug | 120 | 1\n",
            },
            {
              stdin: String.raw`CREATE TABLE order_lines (id INT PRIMARY KEY, item VARCHAR(40), qty INT, unit_price INT);
INSERT INTO order_lines VALUES (2, 'cap', 101, 1), (1, 'box', 0, 99);
`,
              expected: "id | item | total | is_large\n1 | box | 0 | 0\n2 | cap | 101 | 1\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE order_lines (id INT PRIMARY KEY, item VARCHAR(40), qty INT, unit_price INT);
INSERT INTO order_lines VALUES (1, 'bag', NULL, NULL), (2, 'map', 0, NULL);
`,
              expected: "id | item | total | is_large\n1 | bag | NULL | NULL\n2 | map | NULL | NULL\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Everyone outside Sales",
          prompt: `The \`employees\` table; \`dept\` is NULL for people not yet assigned:

| id | name | dept |
| --- | --- | --- |
| 1 | Asha | Sales |
| 2 | Ben | NULL |
| 3 | Chen | Support |
| 4 | Dina | Sales |
| 5 | Eli | Ops |

HR wants everyone who is **not in Sales — including people with no department**. Return \`id\`, \`name\`, \`dept\` ordered by \`id\`.

\`\`\`text
id | name | dept
2 | Ben | NULL
3 | Chen | Support
5 | Eli | Ops
\`\`\``,
          starter: String.raw`-- Everyone not in Sales, including NULL departments:
-- id, name, dept ordered by id.
`,
          solution: String.raw`SELECT id, name, dept
FROM employees
WHERE dept <> 'Sales' OR dept IS NULL
ORDER BY id;
`,
          hints: [
            "`dept <> 'Sales'` is UNKNOWN for Ben, and WHERE keeps only TRUE rows.",
            "Add the NULL case with OR: `dept IS NULL` is TRUE for him.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20));
INSERT INTO employees VALUES (1, 'Asha', 'Sales'), (2, 'Ben', NULL), (3, 'Chen', 'Support'), (4, 'Dina', 'Sales'), (5, 'Eli', 'Ops');
`,
              expected: "id | name | dept\n2 | Ben | NULL\n3 | Chen | Support\n5 | Eli | Ops\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20));
INSERT INTO employees VALUES (2, 'Kai', NULL), (1, 'Lu', NULL);
`,
              expected: "id | name | dept\n1 | Lu | NULL\n2 | Kai | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), dept VARCHAR(20));
INSERT INTO employees VALUES (1, 'Mo', 'Sales'), (2, 'Ni', 'Sales');
`,
              expected: "id | name | dept\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT NULL = NULL` return in MySQL?",
          options: ["1", "0", "NULL", "An error"],
          answer: 2,
          explanation: "Two unknown values cannot be known to be equal, so the comparison is UNKNOWN, which MySQL displays as NULL. It is not 1 (true) and not 0 (false). Use `IS NULL` to test for NULL.",
        },
        {
          prompt: "A table has 10 employees: 4 in Sales, 4 in other departments, 2 with a NULL dept. How many rows does `WHERE dept <> 'Sales'` return?",
          options: ["6", "4", "10", "2"],
          answer: 1,
          explanation: "For the 2 NULL rows the comparison is UNKNOWN, and WHERE keeps only TRUE, so only the 4 other-department rows remain. The NULL rows appear in neither `= 'Sales'` nor `<> 'Sales'`.",
        },
        {
          prompt: "What is `NULL AND FALSE`?",
          options: ["TRUE", "FALSE", "UNKNOWN", "An error"],
          answer: 1,
          explanation: "AND is false as soon as one side is false, whatever the other side is. `NULL AND TRUE`, by contrast, is UNKNOWN, because the unknown side could decide it.",
        },
        {
          prompt: "What does `SELECT id FROM t WHERE x NOT IN (1, 2, NULL)` return?",
          options: ["Rows where x is 3 or more", "Rows where x is NULL", "No rows, ever", "Every row"],
          answer: 2,
          explanation: "`NOT IN` is `x <> 1 AND x <> 2 AND x <> NULL`, and the last part is always UNKNOWN, so the AND can be FALSE or UNKNOWN but never TRUE.",
        },
        {
          prompt: "In MySQL, what is `CONCAT('Order #', NULL)`?",
          options: ["'Order #'", "'Order #NULL'", "NULL", "An error"],
          answer: 2,
          explanation: "MySQL's CONCAT returns NULL if any argument is NULL — the NULL spreads. PostgreSQL's and SQL Server's CONCAT skip NULLs instead, which would give 'Order #'.",
        },
      ],
    },
    {
      slug: "is-null",
      file: "02-is-null.md",
      exercises: [
        {
          title: "Incomplete contact details",
          prompt: `The \`customers\` table:

| id | name | email | phone |
| --- | --- | --- | --- |
| 1 | Asha | asha@mail.in | 98100 |
| 2 | Ben | NULL | 98200 |
| 3 | Chen | NULL | NULL |
| 4 | Dina | dina@mail.in | NULL |
| 5 | Eli | eli@mail.in | 98500 |
| 6 | Fay | NULL | NULL |

List every customer missing an email, a phone or both, as \`id\`, \`name\`, \`email\`, \`phone\`. Customers missing **both** come first; otherwise order by \`id\`. An empty string is a value, not a missing one.

\`\`\`text
id | name | email | phone
3 | Chen | NULL | NULL
6 | Fay | NULL | NULL
2 | Ben | NULL | 98200
4 | Dina | dina@mail.in | NULL
\`\`\``,
          starter: String.raw`-- Customers missing email or phone (or both): id, name, email, phone.
-- Missing both first, then by id.
`,
          solution: String.raw`SELECT id, name, email, phone
FROM customers
WHERE email IS NULL OR phone IS NULL
ORDER BY (email IS NULL AND phone IS NULL) DESC, id;
`,
          hints: [
            "`= NULL` never matches; test with `IS NULL`.",
            "`email IS NULL AND phone IS NULL` is 1 for the customers missing both — sort on it descending, then by id.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), email VARCHAR(60), phone VARCHAR(20));
INSERT INTO customers VALUES (1, 'Asha', 'asha@mail.in', '98100'), (2, 'Ben', NULL, '98200'), (3, 'Chen', NULL, NULL), (4, 'Dina', 'dina@mail.in', NULL), (5, 'Eli', 'eli@mail.in', '98500'), (6, 'Fay', NULL, NULL);
`,
              expected: "id | name | email | phone\n3 | Chen | NULL | NULL\n6 | Fay | NULL | NULL\n2 | Ben | NULL | 98200\n4 | Dina | dina@mail.in | NULL\n",
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), email VARCHAR(60), phone VARCHAR(20));
INSERT INTO customers VALUES (1, 'Gia', '', '111'), (2, 'Hal', 'hal@mail.in', NULL), (3, 'Ian', NULL, '555');
`,
              expected: "id | name | email | phone\n2 | Hal | hal@mail.in | NULL\n3 | Ian | NULL | 555\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(40), email VARCHAR(60), phone VARCHAR(20));
INSERT INTO customers VALUES (1, 'Jo', 'jo@mail.in', '1');
`,
              expected: "id | name | email | phone\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Prices that changed",
          prompt: `The \`price_changes\` table compares yesterday's and today's price of each product; NULL means "no price":

| sku | old_price | new_price |
| --- | --- | --- |
| A1 | 100 | 120 |
| A2 | 50 | 50 |
| A3 | NULL | 80 |
| A4 | 70 | NULL |
| A5 | NULL | NULL |
| A6 | 0 | 0 |

Return the products whose price **changed** as \`sku\`, \`old_price\`, \`new_price\`, ordered by \`sku\`. Gaining or losing a price counts as a change; NULL to NULL does not.

\`\`\`text
sku | old_price | new_price
A1 | 100 | 120
A3 | NULL | 80
A4 | 70 | NULL
\`\`\``,
          starter: String.raw`-- Products whose price changed, NULLs included:
-- sku, old_price, new_price ordered by sku.
`,
          solution: String.raw`SELECT sku, old_price, new_price
FROM price_changes
WHERE NOT (old_price <=> new_price)
ORDER BY sku;
`,
          hints: [
            "`old_price <> new_price` is UNKNOWN for A3 and A4, so they would vanish.",
            "MySQL's `<=>` is equality that treats two NULLs as equal and never returns NULL.",
            "`WHERE NOT (old_price <=> new_price)`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE price_changes (sku VARCHAR(10) PRIMARY KEY, old_price INT, new_price INT);
INSERT INTO price_changes VALUES ('A1', 100, 120), ('A2', 50, 50), ('A3', NULL, 80), ('A4', 70, NULL), ('A5', NULL, NULL), ('A6', 0, 0);
`,
              expected: "sku | old_price | new_price\nA1 | 100 | 120\nA3 | NULL | 80\nA4 | 70 | NULL\n",
            },
            {
              stdin: String.raw`CREATE TABLE price_changes (sku VARCHAR(10) PRIMARY KEY, old_price INT, new_price INT);
INSERT INTO price_changes VALUES ('B1', NULL, NULL), ('B2', 5, 5);
`,
              expected: "sku | old_price | new_price\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE price_changes (sku VARCHAR(10) PRIMARY KEY, old_price INT, new_price INT);
INSERT INTO price_changes VALUES ('C2', 0, NULL), ('C1', NULL, 0), ('C3', 9, 8);
`,
              expected: "sku | old_price | new_price\nC1 | NULL | 0\nC2 | 0 | NULL\nC3 | 9 | 8\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT * FROM customers WHERE phone = NULL` return?",
          options: ["Customers without a phone", "Every customer", "No rows, without an error", "A syntax error"],
          answer: 2,
          explanation: "`phone = NULL` is UNKNOWN for every row, so WHERE keeps none — and MySQL reports no error, which is why the bug survives. `phone IS NULL` is the test.",
        },
        {
          prompt: "What is `5 <=> NULL` in MySQL?",
          options: ["NULL", "0", "1", "An error"],
          answer: 1,
          explanation: "The NULL-safe operator never returns NULL: it is 1 when both sides are NULL or equal, and 0 otherwise. `5 = NULL` would be NULL.",
        },
        {
          prompt: "Which WHERE finds Pune customers missing a phone or an email?",
          options: [
            "`WHERE city = 'Pune' AND phone IS NULL OR email IS NULL`",
            "`WHERE city = 'Pune' AND (phone IS NULL OR email IS NULL)`",
            "`WHERE city = 'Pune' AND (phone OR email) IS NULL`",
            "`WHERE city = 'Pune' AND phone, email IS NULL`",
          ],
          answer: 1,
          explanation: "AND binds tighter than OR, so the first option also returns customers from every city whose email is NULL. The parentheses keep the city filter on both cases. The last two are not valid ways to test two columns.",
        },
        {
          prompt: "In MySQL, what does `ISNULL(discount)` return for a row whose discount is NULL?",
          options: ["NULL", "1", "0", "The second argument"],
          answer: 1,
          explanation: "MySQL's ISNULL takes one argument and returns 1 or 0, like `discount IS NULL`. SQL Server's ISNULL(a, b) is a different function — a default value, which MySQL calls IFNULL.",
        },
        {
          prompt: "A `middle_name` column holds `''` for people with no middle name. Which rows does `WHERE middle_name IS NULL` return?",
          options: ["The rows with `''`", "No rows, unless some middle names are actually NULL", "Every row", "An error, because `''` is not NULL"],
          answer: 1,
          explanation: "An empty string is a value, so IS NULL is false for it. To treat blanks as missing, test `middle_name IS NULL OR middle_name = ''` or use `NULLIF(middle_name, '')`. (Oracle, which stores '' as NULL, is the exception.)",
        },
      ],
    },
    {
      slug: "coalesce-ifnull-nullif",
      file: "03-coalesce-ifnull-nullif.md",
      exercises: [
        {
          title: "Display names with fallbacks",
          prompt: `The \`users\` table; nicknames may be NULL or left blank (\`''\`):

| id | nickname | first_name |
| --- | --- | --- |
| 1 | ace | Arun |
| 2 | NULL | Bela |
| 3 | (empty) | Chirag |
| 4 | NULL | NULL |
| 5 | (empty) | NULL |

Return \`id\` and \`display_name\`: the nickname if it is neither NULL nor empty, otherwise the first name, otherwise \`'Anonymous'\`. Order by \`id\`.

\`\`\`text
id | display_name
1 | ace
2 | Bela
3 | Chirag
4 | Anonymous
5 | Anonymous
\`\`\``,
          starter: String.raw`-- id, display_name: nickname (if not NULL or ''), else first_name,
-- else 'Anonymous'; ordered by id.
`,
          solution: String.raw`SELECT id,
       COALESCE(NULLIF(nickname, ''), first_name, 'Anonymous') AS display_name
FROM users
ORDER BY id;
`,
          hints: [
            "COALESCE returns its first non-NULL argument — but `''` is not NULL, so it would be chosen.",
            "`NULLIF(nickname, '')` turns the blank into NULL first.",
            "`COALESCE(NULLIF(nickname, ''), first_name, 'Anonymous')`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, nickname VARCHAR(30), first_name VARCHAR(30));
INSERT INTO users VALUES (1, 'ace', 'Arun'), (2, NULL, 'Bela'), (3, '', 'Chirag'), (4, NULL, NULL), (5, '', NULL);
`,
              expected: "id | display_name\n1 | ace\n2 | Bela\n3 | Chirag\n4 | Anonymous\n5 | Anonymous\n",
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, nickname VARCHAR(30), first_name VARCHAR(30));
INSERT INTO users VALUES (2, 'zed', NULL), (1, 'kay', 'Kavya');
`,
              expected: "id | display_name\n1 | kay\n2 | zed\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, nickname VARCHAR(30), first_name VARCHAR(30));
INSERT INTO users VALUES (1, '', 'Om'), (2, NULL, 'Ira'), (3, NULL, 'Pia');
`,
              expected: "id | display_name\n1 | Om\n2 | Ira\n3 | Pia\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Click-through rate without dividing by zero",
          prompt: `The \`campaigns\` table; \`clicks\` is NULL when none were recorded:

| id | name | views | clicks |
| --- | --- | --- | --- |
| 1 | spring | 200 | 30 |
| 2 | summer | 0 | 0 |
| 3 | autumn | 300 | NULL |
| 4 | winter | 150 | 50 |

Return \`name\` and \`ctr\` = clicks ÷ views, rounded to 2 decimal places, ordered by \`id\`. Treat missing clicks as 0. A campaign with 0 views (or unknown views) has no rate: its \`ctr\` is NULL. Guard the division with \`NULLIF\`.

\`\`\`text
name | ctr
spring | 0.15
summer | NULL
autumn | 0
winter | 0.33
\`\`\``,
          starter: String.raw`-- name, ctr = ROUND(clicks / views, 2); missing clicks count as 0,
-- 0 views gives NULL; ordered by id.
`,
          solution: String.raw`SELECT name,
       ROUND(COALESCE(clicks, 0) / NULLIF(views, 0), 2) AS ctr
FROM campaigns
ORDER BY id;
`,
          hints: [
            "`NULLIF(views, 0)` is NULL when views is 0, and dividing by NULL gives NULL instead of an error.",
            "Missing clicks would make the whole division NULL — replace them with `COALESCE(clicks, 0)` (or `IFNULL`).",
            "`ROUND(COALESCE(clicks, 0) / NULLIF(views, 0), 2)`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE campaigns (id INT PRIMARY KEY, name VARCHAR(30), views INT, clicks INT);
INSERT INTO campaigns VALUES (1, 'spring', 200, 30), (2, 'summer', 0, 0), (3, 'autumn', 300, NULL), (4, 'winter', 150, 50);
`,
              expected: "name | ctr\nspring | 0.15\nsummer | NULL\nautumn | 0\nwinter | 0.33\n",
            },
            {
              stdin: String.raw`CREATE TABLE campaigns (id INT PRIMARY KEY, name VARCHAR(30), views INT, clicks INT);
INSERT INTO campaigns VALUES (1, 'a', 3, 1), (2, 'b', NULL, 5), (3, 'c', 7, 7);
`,
              expected: "name | ctr\na | 0.33\nb | NULL\nc | 1\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE campaigns (id INT PRIMARY KEY, name VARCHAR(30), views INT, clicks INT);
INSERT INTO campaigns VALUES (1, 'd', 8, NULL), (2, 'e', 0, NULL), (3, 'f', 400, 1);
`,
              expected: "name | ctr\nd | 0\ne | NULL\nf | 0\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `COALESCE(NULL, NULL, 0, 5)`?",
          options: ["NULL", "0", "5", "An error"],
          answer: 1,
          explanation: "COALESCE returns the first argument that is not NULL, and 0 is a value. It does not skip zeros or look further once it finds one.",
        },
        {
          prompt: "What is `NULLIF(10, 10)`?",
          options: ["10", "0", "NULL", "1"],
          answer: 2,
          explanation: "NULLIF returns NULL when its two arguments are equal, and the first argument otherwise; `NULLIF(10, 5)` would be 10.",
        },
        {
          prompt: "Which is Oracle's two-argument equivalent of MySQL's `IFNULL(a, b)`?",
          options: ["`ISNULL(a, b)`", "`NVL(a, b)`", "`NULLIF(a, b)`", "`IIF(a, b)`"],
          answer: 1,
          explanation: "Oracle uses NVL, SQL Server uses ISNULL(a, b). NULLIF does the opposite job (turns a value into NULL), and IIF is SQL Server's two-way IF. COALESCE works in all of them.",
        },
        {
          prompt: "Why write `total / NULLIF(count, 0)` in a query that must also run on PostgreSQL?",
          options: [
            "PostgreSQL raises a division-by-zero error, while dividing by NULL gives NULL",
            "NULLIF makes the division faster",
            "It rounds the result",
            "PostgreSQL cannot divide integers otherwise",
          ],
          answer: 0,
          explanation: "MySQL returns NULL for `x / 0` in a SELECT, but PostgreSQL, SQL Server and Oracle abort the query. NULLIF turns a zero divisor into NULL, so the result is NULL everywhere.",
        },
        {
          prompt: "`SELECT salary + bonus FROM employees` returns NULL for some people. What is the usual fix when a missing bonus means no bonus?",
          options: ["`salary + NULLIF(bonus, 0)`", "`salary + COALESCE(bonus, 0)`", "`salary + bonus IS NOT NULL`", "`COALESCE(salary + bonus)`"],
          answer: 1,
          explanation: "COALESCE replaces the missing bonus with 0 before the addition. NULLIF would create more NULLs; a one-argument COALESCE returns the NULL sum unchanged; the IS NOT NULL version adds a 0/1 flag.",
        },
      ],
    },
    {
      slug: "case-expressions",
      file: "04-case-expressions.md",
      exercises: [
        {
          title: "Grade bands",
          prompt: `The \`results\` table; \`score\` is NULL for students who missed the exam:

| id | student | score |
| --- | --- | --- |
| 1 | Asha | 92 |
| 2 | Ben | 75 |
| 3 | Chen | NULL |
| 4 | Dina | 49 |
| 5 | Eli | 50 |
| 6 | Fay | 89 |

Return \`student\`, \`score\` and \`grade\`, ordered by \`id\`: \`'absent'\` when the score is NULL, \`'A'\` for 90 and above, \`'B'\` for 75–89, \`'C'\` for 50–74, \`'F'\` below 50.

\`\`\`text
student | score | grade
Asha | 92 | A
Ben | 75 | B
Chen | NULL | absent
Dina | 49 | F
Eli | 50 | C
Fay | 89 | B
\`\`\``,
          starter: String.raw`-- student, score, grade: absent / A (>= 90) / B (>= 75) / C (>= 50) / F,
-- ordered by id.
`,
          solution: String.raw`SELECT student,
       score,
       CASE
         WHEN score IS NULL THEN 'absent'
         WHEN score >= 90 THEN 'A'
         WHEN score >= 75 THEN 'B'
         WHEN score >= 50 THEN 'C'
         ELSE 'F'
       END AS grade
FROM results
ORDER BY id;
`,
          hints: [
            "A searched CASE returns the first branch whose condition is TRUE — put the highest threshold first.",
            "A NULL score fails every `>=` test and would land in the ELSE as `'F'`.",
            "Make `WHEN score IS NULL THEN 'absent'` the first branch.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE results (id INT PRIMARY KEY, student VARCHAR(40), score INT);
INSERT INTO results VALUES (1, 'Asha', 92), (2, 'Ben', 75), (3, 'Chen', NULL), (4, 'Dina', 49), (5, 'Eli', 50), (6, 'Fay', 89);
`,
              expected: "student | score | grade\nAsha | 92 | A\nBen | 75 | B\nChen | NULL | absent\nDina | 49 | F\nEli | 50 | C\nFay | 89 | B\n",
            },
            {
              stdin: String.raw`CREATE TABLE results (id INT PRIMARY KEY, student VARCHAR(40), score INT);
INSERT INTO results VALUES (3, 'Zia', 100), (1, 'Xan', 90), (2, 'Yug', 0);
`,
              expected: "student | score | grade\nXan | 90 | A\nYug | 0 | F\nZia | 100 | A\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE results (id INT PRIMARY KEY, student VARCHAR(40), score INT);
INSERT INTO results VALUES (1, 'Wes', 74), (2, 'Val', NULL);
`,
              expected: "student | score | grade\nWes | 74 | C\nVal | NULL | absent\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Order status board",
          prompt: `The \`orders\` table stores a one-letter status code:

| id | status_code |
| --- | --- |
| 1 | D |
| 2 | P |
| 3 | C |
| 4 | S |
| 5 | P |
| 6 | X |
| 7 | NULL |

Return \`id\` and \`status\`, where P → \`Pending\`, S → \`Shipped\`, D → \`Delivered\`, C → \`Cancelled\` and anything else (including NULL) → \`Unknown\`. Order the board Pending, Shipped, Delivered, Cancelled, Unknown, and by \`id\` within each status.

\`\`\`text
id | status
2 | Pending
5 | Pending
4 | Shipped
1 | Delivered
3 | Cancelled
6 | Unknown
7 | Unknown
\`\`\``,
          starter: String.raw`-- id, status (Pending/Shipped/Delivered/Cancelled/Unknown),
-- in that order of status, then by id.
`,
          solution: String.raw`SELECT id,
       CASE status_code
         WHEN 'P' THEN 'Pending'
         WHEN 'S' THEN 'Shipped'
         WHEN 'D' THEN 'Delivered'
         WHEN 'C' THEN 'Cancelled'
         ELSE 'Unknown'
       END AS status
FROM orders
ORDER BY CASE status_code
           WHEN 'P' THEN 1
           WHEN 'S' THEN 2
           WHEN 'D' THEN 3
           WHEN 'C' THEN 4
           ELSE 5
         END,
         id;
`,
          hints: [
            "A simple CASE maps each code: `CASE status_code WHEN 'P' THEN 'Pending' … ELSE 'Unknown' END`.",
            "The board order is neither alphabetical by code nor by label — sort on a second CASE that maps each code to a rank.",
            "A NULL code matches no `WHEN` (they compare with `=`), so the ELSE handles it in both CASEs.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, status_code CHAR(1));
INSERT INTO orders VALUES (1, 'D'), (2, 'P'), (3, 'C'), (4, 'S'), (5, 'P'), (6, 'X'), (7, NULL);
`,
              expected: "id | status\n2 | Pending\n5 | Pending\n4 | Shipped\n1 | Delivered\n3 | Cancelled\n6 | Unknown\n7 | Unknown\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, status_code CHAR(1));
INSERT INTO orders VALUES (3, 'S'), (1, 'S'), (2, 'D');
`,
              expected: "id | status\n1 | Shipped\n3 | Shipped\n2 | Delivered\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, status_code CHAR(1));
INSERT INTO orders VALUES (9, NULL), (4, 'C'), (8, 'Q'), (5, 'P');
`,
              expected: "id | status\n5 | Pending\n4 | Cancelled\n8 | Unknown\n9 | Unknown\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What grade does a score of 95 get?\n\n```sql\nCASE\n  WHEN score >= 50 THEN 'C'\n  WHEN score >= 75 THEN 'B'\n  WHEN score >= 90 THEN 'A'\nEND\n```",
          options: ["A", "B", "C", "NULL"],
          answer: 2,
          explanation: "CASE returns the first branch that is TRUE, and `95 >= 50` is checked first. Order range tests from the highest threshold down.",
        },
        {
          prompt: "What does `CASE WHEN qty > 10 THEN 'bulk' END` return for `qty = 3`?",
          options: ["'bulk'", "An empty string", "NULL", "An error, because ELSE is missing"],
          answer: 2,
          explanation: "A CASE without ELSE has an implicit `ELSE NULL`. It is not an error; that is exactly why unexpected values silently become NULL.",
        },
        {
          prompt: "For a row where `code` is NULL, what does `CASE code WHEN NULL THEN 'none' ELSE 'some' END` return?",
          options: ["'none'", "'some'", "NULL", "An error"],
          answer: 1,
          explanation: "A simple CASE compares with `=`, and `NULL = NULL` is UNKNOWN, so the WHEN never matches and the ELSE wins. Use the searched form `CASE WHEN code IS NULL THEN 'none' …`.",
        },
        {
          prompt: "What is `IF(NULL > 1, 'yes', 'no')` in MySQL?",
          options: ["'yes'", "'no'", "NULL", "An error"],
          answer: 1,
          explanation: "IF returns its second argument only when the condition is TRUE; for FALSE and UNKNOWN it returns the third. `CASE WHEN … THEN 'yes' ELSE 'no' END` behaves the same.",
        },
        {
          prompt: "Where can a CASE expression NOT be used?",
          options: ["In the SELECT list", "In WHERE", "In ORDER BY", "As a table name in FROM"],
          answer: 3,
          explanation: "CASE is a value-producing expression, allowed anywhere a value is — SELECT, WHERE, ORDER BY, inside functions and aggregates. It cannot name a table.",
        },
      ],
    },
    {
      slug: "types-and-cast",
      file: "05-types-and-cast.md",
      exercises: [
        {
          title: "Ticket codes sorted as numbers",
          prompt: `The \`tickets\` table stores its codes as text (\`VARCHAR\`), some with leading zeros:

| id | code |
| --- | --- |
| 1 | 9 |
| 2 | 10 |
| 3 | 100 |
| 4 | 007 |
| 5 | 25 |

Return \`code\` and \`code_num\` (the code converted to an integer with \`CAST\`), ordered by the **numeric** value, then by \`id\`.

\`\`\`text
code | code_num
007 | 7
9 | 9
10 | 10
25 | 25
100 | 100
\`\`\``,
          starter: String.raw`-- code, code_num = the code as an integer,
-- ordered by numeric value, then id.
`,
          solution: String.raw`SELECT code,
       CAST(code AS UNSIGNED) AS code_num
FROM tickets
ORDER BY CAST(code AS UNSIGNED), id;
`,
          hints: [
            "Sorted as text, `'10'` and `'100'` come before `'9'`.",
            "MySQL casts to an integer with `CAST(code AS SIGNED)` or `UNSIGNED` — not `AS INT`.",
            "Sort on the cast value (or its alias), then by id for equal values such as `'10'` and `'010'`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, code VARCHAR(10));
INSERT INTO tickets VALUES (1, '9'), (2, '10'), (3, '100'), (4, '007'), (5, '25');
`,
              expected: "code | code_num\n007 | 7\n9 | 9\n10 | 10\n25 | 25\n100 | 100\n",
            },
            {
              stdin: String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, code VARCHAR(10));
INSERT INTO tickets VALUES (1, '10'), (2, '010'), (3, '2');
`,
              expected: "code | code_num\n2 | 2\n10 | 10\n010 | 10\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, code VARCHAR(10));
INSERT INTO tickets VALUES (3, '1000'), (2, '999'), (1, '99');
`,
              expected: "code | code_num\n99 | 99\n999 | 999\n1000 | 1000\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Packing boxes",
          prompt: `The \`shipments\` table: how many \`items\` each shipment has and how many fit in one box (\`per_box\`, NULL when not decided yet):

| id | items | per_box |
| --- | --- | --- |
| 1 | 25 | 6 |
| 2 | 24 | 6 |
| 3 | 5 | 12 |
| 4 | 0 | 4 |

Return \`id\`, \`full_boxes\` (integer division with \`DIV\`), \`left_over\` (the remainder) and \`boxes_needed\` (full boxes, plus one more if anything is left over), ordered by \`id\`. When \`per_box\` is NULL every computed column is NULL.

\`\`\`text
id | full_boxes | left_over | boxes_needed
1 | 4 | 1 | 5
2 | 4 | 0 | 4
3 | 0 | 5 | 1
4 | 0 | 0 | 0
\`\`\``,
          starter: String.raw`-- id, full_boxes (DIV), left_over (remainder),
-- boxes_needed (full boxes + 1 if anything is left over); ordered by id.
`,
          solution: String.raw`SELECT id,
       items DIV per_box AS full_boxes,
       items % per_box AS left_over,
       items DIV per_box + (items % per_box > 0) AS boxes_needed
FROM shipments
ORDER BY id;
`,
          hints: [
            "`/` is decimal division in MySQL (25 / 6 is 4.1667); `DIV` keeps only the integer part.",
            "The remainder is `items % per_box` or `MOD(items, per_box)`.",
            "A comparison is 1 or 0 in MySQL, so `(items % per_box > 0)` can be added to the full boxes.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE shipments (id INT PRIMARY KEY, items INT, per_box INT);
INSERT INTO shipments VALUES (1, 25, 6), (2, 24, 6), (3, 5, 12), (4, 0, 4);
`,
              expected: "id | full_boxes | left_over | boxes_needed\n1 | 4 | 1 | 5\n2 | 4 | 0 | 4\n3 | 0 | 5 | 1\n4 | 0 | 0 | 0\n",
            },
            {
              stdin: String.raw`CREATE TABLE shipments (id INT PRIMARY KEY, items INT, per_box INT);
INSERT INTO shipments VALUES (2, 7, 3), (1, 100, 1);
`,
              expected: "id | full_boxes | left_over | boxes_needed\n1 | 100 | 0 | 100\n2 | 2 | 1 | 3\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE shipments (id INT PRIMARY KEY, items INT, per_box INT);
INSERT INTO shipments VALUES (1, 10, NULL), (2, 13, 13);
`,
              expected: "id | full_boxes | left_over | boxes_needed\n1 | NULL | NULL | NULL\n2 | 1 | 0 | 1\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `7 / 2` in MySQL, and in PostgreSQL (both operands integers)?",
          options: ["3.5000 in both", "3.5000 in MySQL, 3 in PostgreSQL", "3 in both", "3 in MySQL, 3.5 in PostgreSQL"],
          answer: 1,
          explanation: "MySQL's `/` always does decimal division; PostgreSQL, SQL Server and SQLite truncate integer ÷ integer. Use `DIV` in MySQL for integer division, and multiply by 1.0 or CAST for decimal division everywhere.",
        },
        {
          prompt: "In MySQL, what is `'10' < '9'`?",
          options: ["1 (true)", "0 (false)", "NULL", "An error"],
          answer: 0,
          explanation: "Two strings compare as strings, character by character, and `'1'` < `'9'`. If one side were the number 9, MySQL would compare numerically and the answer would be 0.",
        },
        {
          prompt: "Which is a valid MySQL cast to an integer?",
          options: ["`CAST(x AS INT)`", "`CAST(x AS SIGNED)`", "`CAST(x AS NUMBER)`", "`CAST(x AS VARCHAR)`"],
          answer: 1,
          explanation: "MySQL's integer targets are SIGNED and UNSIGNED. `AS INT` works in PostgreSQL and SQL Server but not MySQL; NUMBER is Oracle; and MySQL casts to CHAR, not VARCHAR.",
        },
        {
          prompt: "Which type should store prices in rupees and paise?",
          options: ["`FLOAT`", "`DOUBLE`", "`DECIMAL(10,2)`", "`VARCHAR(10)`"],
          answer: 2,
          explanation: "DECIMAL stores exact decimal digits, so sums never drift. FLOAT and DOUBLE are binary approximations (0.1 + 0.2 is not exactly 0.3), and text cannot be summed or compared numerically without conversion.",
        },
        {
          prompt: "What does MySQL return for `'abc' = 0`?",
          options: ["0", "1", "NULL", "An error"],
          answer: 1,
          explanation: "Comparing a string with a number converts the string to a number, and a string with no numeric prefix becomes 0 — so the comparison is true (with a warning). PostgreSQL would refuse the comparison.",
        },
      ],
    },
    {
      slug: "nulls-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Delivery fees with optional discounts",
          prompt: `The \`deliveries\` table; \`weight_kg\` is NULL when the parcel was not weighed and \`discount\` is NULL when there is none:

| id | city | weight_kg | discount |
| --- | --- | --- | --- |
| 1 | Pune | 0.5 | NULL |
| 2 | Delhi | 3 | 10 |
| 3 | Goa | NULL | 5 |
| 4 | Agra | 12 | 25 |
| 5 | Kochi | 1 | 0 |

Return \`id\`, \`fee\` and \`final_fee\`, ordered by \`id\`. The \`fee\` is 40 up to 1 kg, 80 up to 5 kg, 150 above 5 kg, and NULL for an unweighed parcel. \`final_fee\` is the fee minus the discount, a missing discount counting as 0.

\`\`\`text
id | fee | final_fee
1 | 40 | 40
2 | 80 | 70
3 | NULL | NULL
4 | 150 | 125
5 | 40 | 40
\`\`\``,
          starter: String.raw`-- id, fee (40 up to 1 kg, 80 up to 5 kg, 150 above, NULL if unweighed),
-- final_fee = fee minus the discount (missing = 0); ordered by id.
`,
          solution: String.raw`SELECT id,
       CASE
         WHEN weight_kg IS NULL THEN NULL
         WHEN weight_kg <= 1 THEN 40
         WHEN weight_kg <= 5 THEN 80
         ELSE 150
       END AS fee,
       CASE
         WHEN weight_kg IS NULL THEN NULL
         WHEN weight_kg <= 1 THEN 40
         WHEN weight_kg <= 5 THEN 80
         ELSE 150
       END - COALESCE(discount, 0) AS final_fee
FROM deliveries
ORDER BY id;
`,
          hints: [
            "Without a NULL branch, an unweighed parcel would fail every `<=` test and be charged the ELSE fee.",
            "The alias `fee` cannot be used in another column of the same SELECT — repeat the CASE.",
            "Subtract `COALESCE(discount, 0)`; a NULL fee minus anything stays NULL.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE deliveries (id INT PRIMARY KEY, city VARCHAR(30), weight_kg DECIMAL(5,2), discount INT);
INSERT INTO deliveries VALUES (1, 'Pune', 0.5, NULL), (2, 'Delhi', 3, 10), (3, 'Goa', NULL, 5), (4, 'Agra', 12, 25), (5, 'Kochi', 1, 0);
`,
              expected: "id | fee | final_fee\n1 | 40 | 40\n2 | 80 | 70\n3 | NULL | NULL\n4 | 150 | 125\n5 | 40 | 40\n",
            },
            {
              stdin: String.raw`CREATE TABLE deliveries (id INT PRIMARY KEY, city VARCHAR(30), weight_kg DECIMAL(5,2), discount INT);
INSERT INTO deliveries VALUES (2, 'Y', 5.01, 100), (1, 'X', 5, NULL);
`,
              expected: "id | fee | final_fee\n1 | 80 | 80\n2 | 150 | 50\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE deliveries (id INT PRIMARY KEY, city VARCHAR(30), weight_kg DECIMAL(5,2), discount INT);
INSERT INTO deliveries VALUES (1, 'Z', NULL, NULL), (2, 'W', 1.01, NULL);
`,
              expected: "id | fee | final_fee\n1 | NULL | NULL\n2 | 80 | 80\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Contact list, reachable first",
          prompt: `The \`contacts\` table; \`city\` and \`phone\` may be NULL or left blank (\`''\`):

| id | name | city | phone |
| --- | --- | --- | --- |
| 1 | Ravi | Pune | 9876 |
| 2 | Anu | (empty) | NULL |
| 3 | Mo | NULL | 9123 |
| 4 | Lia | Goa | NULL |

Return \`name\`, \`city\` and \`has_phone\`: the city, or \`'Unknown'\` when it is NULL or blank; and 1 if the contact has a phone that is neither NULL nor blank, else 0. List contacts with a phone first, then by \`name\`, then by \`id\`.

\`\`\`text
name | city | has_phone
Mo | Unknown | 1
Ravi | Pune | 1
Anu | Unknown | 0
Lia | Goa | 0
\`\`\``,
          starter: String.raw`-- name, city ('Unknown' if NULL or blank), has_phone (1/0, blank = none);
-- contacts with a phone first, then name, then id.
`,
          solution: String.raw`SELECT name,
       COALESCE(NULLIF(city, ''), 'Unknown') AS city,
       NULLIF(phone, '') IS NOT NULL AS has_phone
FROM contacts
ORDER BY has_phone DESC, name, id;
`,
          hints: [
            "`COALESCE(NULLIF(city, ''), 'Unknown')` treats blanks and NULLs alike.",
            "`NULLIF(phone, '') IS NOT NULL` is 1 for a real phone and 0 for NULL or blank.",
            "ORDER BY runs after SELECT, so you can sort on the alias: `ORDER BY has_phone DESC, name, id`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE contacts (id INT PRIMARY KEY, name VARCHAR(30), city VARCHAR(30), phone VARCHAR(20));
INSERT INTO contacts VALUES (1, 'Ravi', 'Pune', '9876'), (2, 'Anu', '', NULL), (3, 'Mo', NULL, '9123'), (4, 'Lia', 'Goa', NULL);
`,
              expected: "name | city | has_phone\nMo | Unknown | 1\nRavi | Pune | 1\nAnu | Unknown | 0\nLia | Goa | 0\n",
            },
            {
              stdin: String.raw`CREATE TABLE contacts (id INT PRIMARY KEY, name VARCHAR(30), city VARCHAR(30), phone VARCHAR(20));
INSERT INTO contacts VALUES (1, 'Zo', '', ''), (2, 'Al', 'Pune', '5');
`,
              expected: "name | city | has_phone\nAl | Pune | 1\nZo | Unknown | 0\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE contacts (id INT PRIMARY KEY, name VARCHAR(30), city VARCHAR(30), phone VARCHAR(20));
INSERT INTO contacts VALUES (3, 'Bo', NULL, '1'), (1, 'Bo', 'Agra', '2'), (2, 'Ab', NULL, NULL);
`,
              expected: "name | city | has_phone\nBo | Agra | 1\nBo | Unknown | 1\nAb | Unknown | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Audit labels",
          prompt: `The \`audit\` table holds a field's value before and after an edit; NULL means the field was empty:

| id | before_value | after_value |
| --- | --- | --- |
| 1 | NULL | 5 |
| 2 | 5 | NULL |
| 3 | 5 | 6 |
| 4 | 5 | 5 |
| 5 | NULL | NULL |

Return \`id\` and \`change_type\`, ordered by \`id\`: \`'added'\` when a value appeared, \`'removed'\` when it disappeared, \`'changed'\` when both exist and differ, and \`'same'\` otherwise (including NULL to NULL).

\`\`\`text
id | change_type
1 | added
2 | removed
3 | changed
4 | same
5 | same
\`\`\``,
          starter: String.raw`-- id, change_type: added / removed / changed / same; ordered by id.
`,
          solution: String.raw`SELECT id,
       CASE
         WHEN before_value IS NULL AND after_value IS NOT NULL THEN 'added'
         WHEN before_value IS NOT NULL AND after_value IS NULL THEN 'removed'
         WHEN before_value <> after_value THEN 'changed'
         ELSE 'same'
       END AS change_type
FROM audit
ORDER BY id;
`,
          hints: [
            "Handle the NULL cases with `IS NULL` / `IS NOT NULL` before comparing values.",
            "Once both sides are known to be non-NULL, `before_value <> after_value` is a plain TRUE or FALSE.",
            "NULL to NULL matches none of the first three branches, so the ELSE labels it `'same'`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE audit (id INT PRIMARY KEY, before_value INT, after_value INT);
INSERT INTO audit VALUES (1, NULL, 5), (2, 5, NULL), (3, 5, 6), (4, 5, 5), (5, NULL, NULL);
`,
              expected: "id | change_type\n1 | added\n2 | removed\n3 | changed\n4 | same\n5 | same\n",
            },
            {
              stdin: String.raw`CREATE TABLE audit (id INT PRIMARY KEY, before_value INT, after_value INT);
INSERT INTO audit VALUES (3, 0, 0), (1, 0, NULL), (2, NULL, 0);
`,
              expected: "id | change_type\n1 | removed\n2 | added\n3 | same\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE audit (id INT PRIMARY KEY, before_value INT, after_value INT);
INSERT INTO audit VALUES (1, -1, 1), (2, NULL, NULL);
`,
              expected: "id | change_type\n1 | changed\n2 | same\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `NULL OR TRUE`?",
          options: ["TRUE", "FALSE", "UNKNOWN", "NULL is not allowed in OR"],
          answer: 0,
          explanation: "OR is true as soon as one side is true, so the unknown side cannot change the answer. `NULL OR FALSE` would be UNKNOWN.",
        },
        {
          prompt: "What does `SELECT 10 + NULL` return?",
          options: ["10", "0", "NULL", "An error"],
          answer: 2,
          explanation: "Arithmetic with an unknown value is unknown. Use `10 + COALESCE(x, 0)` when a missing value should count as zero.",
        },
        {
          prompt: "Which condition is TRUE exactly for rows where `email` has no value?",
          options: ["`email = NULL`", "`email = ''`", "`email IS NULL`", "`NOT email`"],
          answer: 2,
          explanation: "`= NULL` is UNKNOWN for every row, `= ''` finds empty strings (a value), and `NOT email` converts the text to a number. IS NULL is the dedicated test.",
        },
        {
          prompt: "What does MySQL return for `NULL <=> NULL`?",
          options: ["NULL", "0", "1", "An error"],
          answer: 2,
          explanation: "`<=>` is NULL-safe equality: two NULLs count as equal, giving 1. With `=` the result would be NULL (UNKNOWN).",
        },
        {
          prompt: "A query must keep every row where `NOT (discount > 10)` — including rows whose discount is NULL. Which works?",
          options: [
            "`WHERE NOT (discount > 10)`",
            "`WHERE discount <= 10`",
            "`WHERE discount <= 10 OR discount IS NULL`",
            "`WHERE discount != 10`",
          ],
          answer: 2,
          explanation: "For a NULL discount `discount > 10` is UNKNOWN, and NOT UNKNOWN is still UNKNOWN, so the first two drop those rows. The explicit IS NULL branch keeps them. (`(discount > 10) IS NOT TRUE` also works in MySQL.)",
        },
        {
          prompt: "What is `COALESCE(NULLIF('', ''), 'n/a')`?",
          options: ["''", "'n/a'", "NULL", "An error"],
          answer: 1,
          explanation: "NULLIF turns the empty string into NULL because the two arguments are equal, and COALESCE skips that NULL to return 'n/a'.",
        },
        {
          prompt: "Which pair are both SQL Server functions?",
          options: ["`ISNULL(a, b)` and `IIF(c, a, b)`", "`IFNULL(a, b)` and `IF(c, a, b)`", "`NVL(a, b)` and `DECODE`", "`ISNULL(x)` and `<=>`"],
          answer: 0,
          explanation: "SQL Server has ISNULL(a, b) and IIF. IFNULL and IF() are MySQL, NVL and DECODE are Oracle, and one-argument ISNULL(x) and `<=>` are MySQL. COALESCE and CASE are standard everywhere.",
        },
        {
          prompt: "What does this return for `qty = NULL`?\n\n```sql\nCASE WHEN qty > 0 THEN 'in stock' ELSE 'sold out' END\n```",
          options: ["'in stock'", "'sold out'", "NULL", "An error"],
          answer: 1,
          explanation: "`NULL > 0` is UNKNOWN, not TRUE, so the WHEN is skipped and the ELSE is returned. If unknown stock should read differently, add `WHEN qty IS NULL THEN 'unknown'` first.",
        },
        {
          prompt: "What is `CASE 'x' WHEN 'a' THEN 1 WHEN 'b' THEN 2 END`?",
          options: ["0", "NULL", "An error", "3"],
          answer: 1,
          explanation: "No WHEN matches and there is no ELSE, so the implicit `ELSE NULL` applies.",
        },
        {
          prompt: "What is `17 DIV 5` and `17 % 5` in MySQL?",
          options: ["3.4 and 2", "3 and 2", "3 and 3", "4 and 2"],
          answer: 1,
          explanation: "DIV is integer division (17 / 5 = 3.4, truncated to 3) and % is the remainder (17 − 15 = 2). `17 / 5` would give 3.4000.",
        },
        {
          prompt: "A `VARCHAR` column holds `'2'`, `'10'` and `'1'`. Which ORDER BY gives 1, 2, 10?",
          options: ["`ORDER BY code`", "`ORDER BY code DESC`", "`ORDER BY CAST(code AS UNSIGNED)`", "`ORDER BY CAST(code AS CHAR)`"],
          answer: 2,
          explanation: "As text the order is '1', '10', '2'. Casting to an integer sorts by value. Casting to CHAR keeps it text.",
        },
        {
          prompt: "Why is `WHERE phone = 9876543210` risky when `phone` is a `VARCHAR` column in MySQL?",
          options: [
            "It is a syntax error",
            "MySQL converts every phone to a number to compare, which skips the index and also matches values like '09876543210'",
            "It compares only the first character",
            "It always returns no rows",
          ],
          answer: 1,
          explanation: "A string-to-number comparison is done numerically, so each stored string is converted — the index on the text cannot be used and leading zeros disappear. Quote the literal: `phone = '9876543210'`.",
        },
      ],
    },
  ],
});
