import { defineModule } from "../../dsl.js";

/** A setup script: the CREATE TABLE, then one INSERT with every row (none for an empty table). */
const setup = (create: string, table: string, rows: string[]) =>
  `${create.trim()}\n` + (rows.length ? `INSERT INTO ${table} VALUES\n  ${rows.join(",\n  ")};\n` : "");

const STAFF = `CREATE TABLE employees (
  emp_id         INT PRIMARY KEY,
  first_name     VARCHAR(40) NOT NULL,
  dept           VARCHAR(20),
  monthly_salary INT
);`;
const CATALOGUE = `CREATE TABLE products (
  product_id INT PRIMARY KEY,
  name       VARCHAR(60) NOT NULL,
  price      INT NOT NULL
);`;
const ORDER_ITEMS = `CREATE TABLE order_items (
  item_id INT PRIMARY KEY,
  name    VARCHAR(60) NOT NULL,
  price   INT NOT NULL,
  qty     INT NOT NULL
);`;
const CALLS = `CREATE TABLE calls (
  call_id      INT PRIMARY KEY,
  caller       VARCHAR(40) NOT NULL,
  duration_min INT
);`;
const EMPLOYEES = `CREATE TABLE employees (
  emp_id INT PRIMARY KEY,
  name   VARCHAR(40) NOT NULL,
  dept   VARCHAR(20),
  salary INT
);`;
const ORDERS = `CREATE TABLE orders (
  order_id   INT PRIMARY KEY,
  customer   VARCHAR(40) NOT NULL,
  order_date DATE,
  amount     INT NOT NULL
);`;
const PRODUCTS = `CREATE TABLE products (
  product_id INT PRIMARY KEY,
  name       VARCHAR(60) NOT NULL,
  category   VARCHAR(20) NOT NULL,
  price      INT NOT NULL
);`;
const CUSTOMERS = `CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  name        VARCHAR(40) NOT NULL,
  email       VARCHAR(80),
  city        VARCHAR(40)
);`;
const SALES = `CREATE TABLE orders (
  order_id    INT PRIMARY KEY,
  customer_id INT,
  product     VARCHAR(40) NOT NULL
);`;
const PRICE_LIST = `CREATE TABLE products (
  product_id   INT PRIMARY KEY,
  name         VARCHAR(60) NOT NULL,
  price        INT NOT NULL,
  discount_pct INT
);`;
const REVIEW = `CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  status   VARCHAR(20) NOT NULL,
  amount   INT NOT NULL,
  country  VARCHAR(2) NOT NULL,
  coupon   VARCHAR(20)
);`;
const ROLES = `CREATE TABLE employees (
  emp_id    INT PRIMARY KEY,
  name      VARCHAR(40) NOT NULL,
  job_title VARCHAR(60) NOT NULL,
  dept      VARCHAR(20)
);`;

export default defineModule(import.meta.url, {
  slug: "selecting-and-filtering",
  title: "Selecting and filtering",
  blurb: "aliases for columns and tables and where they work; calculated columns with arithmetic, decimal division, DIV, MOD, ROUND and CONCAT; WHERE with comparisons on numbers, text and dates; AND, OR and NOT with precedence and three-valued logic; IN, BETWEEN and LIKE; and DISTINCT with COUNT(DISTINCT).",
  icon: "list",
  overview: `A query earns its keep by returning exactly the rows and columns a question needs, named so the reader understands them. This module covers the two halves of that. On the column side: aliases that name what a query returns, and expressions — arithmetic, rounding, text built with \`CONCAT\` — that compute new columns from stored ones. On the row side: the \`WHERE\` clause and every tool it uses, from a single comparison to conditions combined with \`AND\`, \`OR\` and \`NOT\`, lists, ranges and text patterns, and finally \`DISTINCT\` to collapse repeated rows. Along the way it meets the two habits that separate a correct query from a nearly correct one: parenthesising mixed \`AND\`/\`OR\`, and asking what happens to rows whose value is NULL.

Columns and aliases covers \`AS\`, optional \`AS\` and the missing-comma trap, quoted aliases, table aliases and qualified names, and the clauses where an alias is visible. Expressions in SELECT covers arithmetic and precedence, MySQL's decimal \`/\` beside \`DIV\` and \`MOD\` (and how PostgreSQL and SQL Server differ), \`ROUND\`/\`FLOOR\`/\`CEIL\`, \`CONCAT\`, comparisons as 1/0 values, and NULL in expressions. The WHERE clause covers the comparison operators on numbers, text and dates, half-open date ranges, \`IS NULL\`, why \`<>\` drops NULL rows, and sargable filters. AND, OR and NOT covers precedence and parentheses, De Morgan's laws and three-valued logic. IN, BETWEEN and LIKE covers lists and the \`NOT IN\` NULL trap, inclusive ranges, wildcards, escaping and case. DISTINCT covers whole-row duplicates, NULLs, \`COUNT(DISTINCT)\`, \`ORDER BY\` after \`DISTINCT\`, and \`GROUP BY\`.

The exercises rename columns and quote an alias with a space, compute line totals with GST and split durations with \`DIV\` and \`MOD\`, filter salaries and dates, fix a precedence trap and include NULL departments on purpose, combine \`IN\` with \`BETWEEN\`, match e-mail addresses with \`LIKE\`, and list and count distinct values. The checkpoint asks for a discounted price list, an order review filter that needs parentheses, a range and a NULL check, and the distinct departments matched by a pattern.`,
  lessons: [
    {
      slug: "select-columns-and-aliases",
      file: "01-select-columns-and-aliases.md",
      exercises: [
        {
          title: "Rename the columns",
          prompt: `The table \`employees\`:

| emp_id | first_name | dept | monthly_salary |
| --- | --- | --- | --- |
| 2 | Ravi | Support | 45000 |
| 1 | Asha | Sales | 60000 |
| 3 | Meera | NULL | 52000 |

Return three columns with these names: \`id\` (the \`emp_id\`), \`name\` (the \`first_name\`) and \`pay\` (the \`monthly_salary\`), ordered by \`emp_id\`.

**Output:** \`id | name | pay\`.

\`\`\`text
id | name | pay
1 | Asha | 60000
2 | Ravi | 45000
3 | Meera | 52000
\`\`\``,
          starter: String.raw`-- Return emp_id AS id, first_name AS name, monthly_salary AS pay, ordered by emp_id.
`,
          solution: String.raw`SELECT emp_id         AS id,
       first_name     AS name,
       monthly_salary AS pay
FROM employees
ORDER BY emp_id;
`,
          hints: [
            "`column AS new_name` renames a result column.",
            "Order by the real column `emp_id` (or by the alias `id` — `ORDER BY` can see aliases).",
          ],
          cases: [
            {
              stdin: setup(STAFF, "employees", ["(2, 'Ravi', 'Support', 45000)", "(1, 'Asha', 'Sales', 60000)", "(3, 'Meera', NULL, 52000)"]),
              expected: "id | name | pay\n1 | Asha | 60000\n2 | Ravi | 45000\n3 | Meera | 52000\n",
            },
            {
              stdin: setup(STAFF, "employees", ["(10, 'Kabir', 'Ops', NULL)", "(4, 'Isha', 'Sales', 75000)"]),
              expected: "id | name | pay\n4 | Isha | 75000\n10 | Kabir | NULL\n",
              hidden: true,
            },
            { stdin: setup(STAFF, "employees", []), expected: "id | name | pay\n(no rows)\n", hidden: true },
          ],
        },
        {
          title: "An alias with a space",
          prompt: `The table \`products\`:

| product_id | name | price |
| --- | --- | --- |
| 1 | Keyboard | 1500 |
| 2 | Monitor | 9000 |
| 3 | Mouse | 600 |

Return two columns headed exactly \`Product\` and \`Unit Price\` (capitals and the space included — quote the alias), most expensive first, ties by \`product_id\`. Careful: in \`ORDER BY\`, a name in single quotes is a constant string, not your column.

**Output:** \`Product | Unit Price\`.

\`\`\`text
Product | Unit Price
Monitor | 9000
Keyboard | 1500
Mouse | 600
\`\`\``,
          starter: String.raw`-- Return name AS Product and price AS 'Unit Price',
-- ordered by price descending, then product_id.
`,
          solution: String.raw`SELECT name  AS Product,
       price AS 'Unit Price'
FROM products
ORDER BY price DESC, product_id;
`,
          hints: [
            "An alias with a space must be quoted: backticks in MySQL, or quotes in the alias position.",
            "Sort by the real column `price DESC` — `ORDER BY 'Unit Price'` would sort by a constant and change nothing.",
            "Add `product_id` as the tie-breaker.",
          ],
          cases: [
            {
              stdin: setup(CATALOGUE, "products", ["(1, 'Keyboard', 1500)", "(2, 'Monitor', 9000)", "(3, 'Mouse', 600)"]),
              expected: "Product | Unit Price\nMonitor | 9000\nKeyboard | 1500\nMouse | 600\n",
            },
            {
              stdin: setup(CATALOGUE, "products", ["(9, 'Cable', 300)", "(4, 'Hub', 300)", "(7, 'Dock', 4500)", "(1, 'Pad', 250)"]),
              expected: "Product | Unit Price\nDock | 4500\nHub | 300\nCable | 300\nPad | 250\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT first_name last_name FROM employees;` return?",
          options: ["Two columns", "An error: missing comma", "One column named `last_name` holding first names", "One column named `first_name` holding last names"],
          answer: 2,
          explanation: "With `AS` optional, a name after a column is an alias. The query runs and mislabels the data — which is why writing `AS` every time makes the slip visible.",
        },
        {
          prompt: "After `FROM employees AS e`, which column reference is valid in MySQL?",
          options: ["`employees.salary`", "`e.salary`", "`AS.salary`", "`e->salary`"],
          answer: 1,
          explanation: "Once a table has an alias, the query refers to it by the alias; the original name is no longer visible in that query.",
        },
        {
          prompt: "In which clause can a column alias **never** be used?",
          options: ["ORDER BY", "WHERE", "HAVING in MySQL", "GROUP BY in MySQL"],
          answer: 1,
          explanation: "WHERE is evaluated before SELECT creates the alias. ORDER BY can use it everywhere; MySQL also accepts aliases in GROUP BY and HAVING.",
        },
        {
          prompt: "Why is `ORDER BY 'Unit Price'` a bug in MySQL?",
          options: ["Aliases cannot be ordered by", "Single quotes make it a string literal, so every row sorts by the same constant", "ORDER BY needs DESC", "It sorts alphabetically instead of numerically"],
          answer: 1,
          explanation: "Outside the alias position, single quotes always mean a string. Sorting by a constant leaves the order unspecified. Use backticks — `` ORDER BY `Unit Price` `` — or the underlying column.",
        },
        {
          prompt: "Why must columns be qualified, as in `e.name` and `d.name`, when two joined tables both have `name`?",
          options: ["For speed", "Otherwise `name` is ambiguous and the query is refused", "Qualification is required in every query", "To rename the column"],
          answer: 1,
          explanation: "MySQL reports *Column 'name' in field list is ambiguous*. The prefix says which table's column is meant; an alias then gives the two result columns different names.",
        },
      ],
    },
    {
      slug: "expressions-in-select",
      file: "02-expressions-in-select.md",
      exercises: [
        {
          title: "Line totals with GST",
          prompt: `The table \`order_items\`:

| item_id | name | price | qty |
| --- | --- | --- | --- |
| 1 | pen | 25 | 4 |
| 2 | notebook | 199 | 3 |
| 3 | bag | 1250 | 1 |

Return \`name\`, the line \`subtotal\` (\`price * qty\`), and \`with_gst\`: the subtotal plus 18% tax, rounded to 2 decimal places. Order by \`item_id\`.

**Output:** \`name | subtotal | with_gst\`. (Trailing zeros after the decimal point are not printed.)

\`\`\`text
name | subtotal | with_gst
pen | 100 | 118
notebook | 597 | 704.46
bag | 1250 | 1475
\`\`\``,
          starter: String.raw`-- Return name, price * qty AS subtotal and the subtotal with 18% GST,
-- rounded to 2 places, AS with_gst; ordered by item_id.
`,
          solution: String.raw`SELECT name,
       price * qty                AS subtotal,
       ROUND(price * qty * 1.18, 2) AS with_gst
FROM order_items
ORDER BY item_id;
`,
          hints: [
            "Adding 18% is multiplying by `1.18`.",
            "Round once, at the end: `ROUND(price * qty * 1.18, 2)`.",
          ],
          cases: [
            {
              stdin: setup(ORDER_ITEMS, "order_items", ["(1, 'pen', 25, 4)", "(2, 'notebook', 199, 3)", "(3, 'bag', 1250, 1)"]),
              expected: "name | subtotal | with_gst\npen | 100 | 118\nnotebook | 597 | 704.46\nbag | 1250 | 1475\n",
            },
            {
              stdin: setup(ORDER_ITEMS, "order_items", ["(5, 'eraser', 7, 3)", "(4, 'marker', 33, 0)", "(9, 'stapler', 349, 2)"]),
              expected: "name | subtotal | with_gst\nmarker | 0 | 0\neraser | 21 | 24.78\nstapler | 698 | 823.64\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Hours and minutes",
          prompt: `The table \`calls\` holds call lengths in minutes (NULL when the length was not recorded):

| call_id | caller | duration_min |
| --- | --- | --- |
| 1 | Asha | 135 |
| 2 | Ravi | 59 |
| 3 | Meera | 60 |

Return \`caller\`, \`hours\` (whole hours, integer division), \`minutes\` (the minutes left over) and \`label\`: the text \`<hours>h <minutes>m\`. Order by \`call_id\`. A NULL duration gives NULL in all three computed columns.

**Output:** \`caller | hours | minutes | label\`.

\`\`\`text
caller | hours | minutes | label
Asha | 2 | 15 | 2h 15m
Ravi | 0 | 59 | 0h 59m
Meera | 1 | 0 | 1h 0m
\`\`\``,
          starter: String.raw`-- Return caller, duration_min DIV 60 AS hours, duration_min MOD 60 AS minutes,
-- and CONCAT(...) AS label like '2h 15m'; ordered by call_id.
`,
          solution: String.raw`SELECT caller,
       duration_min DIV 60 AS hours,
       duration_min MOD 60 AS minutes,
       CONCAT(duration_min DIV 60, 'h ', duration_min MOD 60, 'm') AS label
FROM calls
ORDER BY call_id;
`,
          hints: [
            "`DIV` is MySQL's integer division; `/` would give 2.25.",
            "`MOD` (or `%`) gives the remainder.",
            "`CONCAT` turns numbers into text; any NULL argument makes it NULL.",
          ],
          cases: [
            {
              stdin: setup(CALLS, "calls", ["(1, 'Asha', 135)", "(2, 'Ravi', 59)", "(3, 'Meera', 60)"]),
              expected: "caller | hours | minutes | label\nAsha | 2 | 15 | 2h 15m\nRavi | 0 | 59 | 0h 59m\nMeera | 1 | 0 | 1h 0m\n",
            },
            {
              stdin: setup(CALLS, "calls", ["(7, 'Dev', NULL)", "(4, 'Isha', 0)", "(5, 'Kabir', 601)"]),
              expected: "caller | hours | minutes | label\nIsha | 0 | 0 | 0h 0m\nKabir | 10 | 1 | 10h 1m\nDev | NULL | NULL | NULL\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT 7 / 2 AS a, 7 DIV 2 AS b;` return in MySQL?",
          options: ["3 and 3", "3.5000 and 3", "3.5000 and 3.5000", "3 and 3.5000"],
          answer: 1,
          explanation: "MySQL's `/` always returns a decimal (four places of scale by default); `DIV` is integer division. In PostgreSQL, SQLite and SQL Server, `7 / 2` would be 3.",
        },
        {
          prompt: "What is `2 + 3 * 4 - 1`?",
          options: ["19", "13", "15", "20"],
          answer: 1,
          explanation: "Multiplication binds tighter: 3 * 4 = 12, then 2 + 12 - 1 = 13 from left to right.",
        },
        {
          prompt: "A row has `price = 500` and `discount = NULL`. What is `price - discount`?",
          options: ["500", "0", "NULL", "An error"],
          answer: 2,
          explanation: "Any arithmetic with NULL is NULL. Use `price - COALESCE(discount, 0)` if a missing discount means none.",
        },
        {
          prompt: "Which keeps the most precision when computing a rounded line total?",
          options: ["`ROUND(price, 2) * qty`", "`ROUND(price * qty, 2)`", "`ROUND(price) * ROUND(qty)`", "They are always equal"],
          answer: 1,
          explanation: "Round once, at the end. Rounding the price first multiplies the rounding error by the quantity.",
        },
        {
          prompt: "In MySQL, what does `SELECT 9000 > 1000 AS is_premium;` return?",
          options: ["`true`", "`1`", "`t`", "An error: comparisons are only allowed in WHERE"],
          answer: 1,
          explanation: "MySQL's booleans are numbers: a true comparison is 1, false 0, unknown NULL. PostgreSQL would print `t`; SQL Server does not allow a bare comparison in the select list.",
        },
      ],
    },
    {
      slug: "the-where-clause",
      file: "03-the-where-clause.md",
      exercises: [
        {
          title: "Well-paid employees",
          prompt: `The table \`employees\`:

| emp_id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Sales | 60000 |
| 2 | Ravi | Support | 45000 |
| 3 | Meera | Eng | 82000 |
| 4 | Kabir | Eng | NULL |

Return \`name\` and \`salary\` of employees earning **at least 60000**, highest salary first, ties by \`name\`. An employee whose salary is unknown is not included.

**Output:** \`name | salary\`.

\`\`\`text
name | salary
Meera | 82000
Asha | 60000
\`\`\``,
          starter: String.raw`-- Return name and salary where salary >= 60000,
-- ordered by salary descending, then name.
`,
          solution: String.raw`SELECT name, salary
FROM employees
WHERE salary >= 60000
ORDER BY salary DESC, name;
`,
          hints: [
            "`>=` includes the boundary: 60000 qualifies.",
            "NULL >= 60000 is unknown, so `WHERE` drops that row by itself.",
          ],
          cases: [
            {
              stdin: setup(EMPLOYEES, "employees", ["(1, 'Asha', 'Sales', 60000)", "(2, 'Ravi', 'Support', 45000)", "(3, 'Meera', 'Eng', 82000)", "(4, 'Kabir', 'Eng', NULL)"]),
              expected: "name | salary\nMeera | 82000\nAsha | 60000\n",
            },
            {
              stdin: setup(EMPLOYEES, "employees", ["(1, 'Zoya', 'Eng', 70000)", "(2, 'Arjun', 'Eng', 70000)", "(3, 'Dev', 'Ops', 59999)", "(4, 'Isha', NULL, 61000)"]),
              expected: "name | salary\nArjun | 70000\nZoya | 70000\nIsha | 61000\n",
              hidden: true,
            },
            {
              stdin: setup(EMPLOYEES, "employees", ["(1, 'Neha', 'Ops', 30000)", "(2, 'Om', 'Ops', NULL)"]),
              expected: "name | salary\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Orders before March",
          prompt: `The table \`orders\` (\`order_date\` is a DATE, NULL for an order not yet placed):

| order_id | customer | order_date | amount |
| --- | --- | --- | --- |
| 1 | Asha | 2024-02-14 | 1200 |
| 2 | Ravi | 2024-03-01 | 450 |
| 3 | Meera | 2024-01-30 | 800 |
| 4 | Dev | NULL | 300 |

Return \`order_id\`, \`customer\` and \`order_date\` for orders placed **before 1 March 2024**, oldest first, ties by \`order_id\`.

**Output:** \`order_id | customer | order_date\`.

\`\`\`text
order_id | customer | order_date
3 | Meera | 2024-01-30
1 | Asha | 2024-02-14
\`\`\``,
          starter: String.raw`-- Return order_id, customer, order_date for orders before '2024-03-01',
-- ordered by order_date, then order_id.
`,
          solution: String.raw`SELECT order_id, customer, order_date
FROM orders
WHERE order_date < '2024-03-01'
ORDER BY order_date, order_id;
`,
          hints: [
            "Write the date as a `'YYYY-MM-DD'` string.",
            "*Before* 1 March is `<`, which leaves out 1 March itself.",
            "Rows with a NULL date are dropped by the comparison on their own.",
          ],
          cases: [
            {
              stdin: setup(ORDERS, "orders", ["(1, 'Asha', '2024-02-14', 1200)", "(2, 'Ravi', '2024-03-01', 450)", "(3, 'Meera', '2024-01-30', 800)", "(4, 'Dev', NULL, 300)"]),
              expected: "order_id | customer | order_date\n3 | Meera | 2024-01-30\n1 | Asha | 2024-02-14\n",
            },
            {
              stdin: setup(ORDERS, "orders", ["(8, 'Isha', '2024-02-29', 100)", "(5, 'Om', '2024-02-29', 900)", "(6, 'Zoya', '2023-12-31', 50)", "(7, 'Arjun', '2024-12-01', 70)"]),
              expected: "order_id | customer | order_date\n6 | Zoya | 2023-12-31\n5 | Om | 2024-02-29\n8 | Isha | 2024-02-29\n",
              hidden: true,
            },
            {
              stdin: setup(ORDERS, "orders", ["(1, 'Neha', '2024-03-01', 10)", "(2, 'Kiran', NULL, 20)"]),
              expected: "order_id | customer | order_date\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many rows does `SELECT * FROM employees WHERE manager_id = NULL;` return?",
          options: ["The rows with no manager", "Zero, always", "Every row", "An error"],
          answer: 1,
          explanation: "A comparison with NULL is unknown, never true, so WHERE keeps nothing. Use `WHERE manager_id IS NULL`.",
        },
        {
          prompt: "`dept` is `'Sales'`, `'Support'` and NULL in three rows. How many does `WHERE dept <> 'Sales'` return?",
          options: ["Two", "One", "Three", "Zero"],
          answer: 1,
          explanation: "Only 'Support'. For the NULL row, `NULL <> 'Sales'` is unknown and the row is dropped. Add `OR dept IS NULL` to include it.",
        },
        {
          prompt: "Which condition selects every moment of 1 March 2024 in a `DATETIME` column `created_at`?",
          options: ["`created_at = '2024-03-01'`", "`created_at >= '2024-03-01' AND created_at < '2024-03-02'`", "`created_at <= '2024-03-01'`", "`created_at BETWEEN '2024-03-01' AND '2024-03-01'`"],
          answer: 1,
          explanation: "`'2024-03-01'` means midnight, so equality and a one-day BETWEEN only match midnight. A half-open range covers the whole day.",
        },
        {
          prompt: "Which filter can use an index on `order_date`?",
          options: ["`WHERE YEAR(order_date) = 2024`", "`WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01'`", "Both equally", "Neither"],
          answer: 1,
          explanation: "Wrapping the column in a function forces a computation on every row. Keeping the column bare and comparing with a range is sargable — the index can jump to the first match.",
        },
        {
          prompt: "With MySQL's default collation, does `WHERE city = 'pune'` match a row whose city is `'Pune'`?",
          options: ["Yes", "No", "Only with LIKE", "Only if city is indexed"],
          answer: 0,
          explanation: "MySQL's default collations are case-insensitive. PostgreSQL and SQLite compare case-sensitively and would not match.",
        },
      ],
    },
    {
      slug: "and-or-not",
      file: "04-and-or-not.md",
      exercises: [
        {
          title: "Books or games under 500",
          prompt: `The table \`products\`:

| product_id | name | category | price |
| --- | --- | --- | --- |
| 1 | SQL Primer | books | 450 |
| 2 | Chess Set | games | 899 |
| 3 | Atlas | books | 2000 |
| 4 | Card Game | games | 299 |
| 5 | Headphones | audio | 350 |

Return \`name\`, \`category\` and \`price\` of products that are **books or games** and cost **less than 500**, cheapest first, ties by \`product_id\`.

**Output:** \`name | category | price\`.

\`\`\`text
name | category | price
Card Game | games | 299
SQL Primer | books | 450
\`\`\``,
          starter: String.raw`-- Return name, category, price for books or games priced under 500,
-- ordered by price, then product_id.
`,
          solution: String.raw`SELECT name, category, price
FROM products
WHERE (category = 'books' OR category = 'games')
  AND price < 500
ORDER BY price, product_id;
`,
          hints: [
            "AND binds tighter than OR — without parentheses, every book qualifies at any price.",
            "Wrap the OR group: `(category = 'books' OR category = 'games') AND price < 500`.",
          ],
          cases: [
            {
              stdin: setup(PRODUCTS, "products", ["(1, 'SQL Primer', 'books', 450)", "(2, 'Chess Set', 'games', 899)", "(3, 'Atlas', 'books', 2000)", "(4, 'Card Game', 'games', 299)", "(5, 'Headphones', 'audio', 350)"]),
              expected: "name | category | price\nCard Game | games | 299\nSQL Primer | books | 450\n",
            },
            {
              stdin: setup(PRODUCTS, "products", ["(1, 'Novel', 'books', 500)", "(2, 'Puzzle', 'games', 120)", "(3, 'Comic', 'books', 120)", "(4, 'Speaker', 'audio', 100)", "(5, 'Encyclopedia', 'books', 5000)"]),
              expected: "name | category | price\nPuzzle | games | 120\nComic | books | 120\n",
              hidden: true,
            },
            {
              stdin: setup(PRODUCTS, "products", ["(1, 'Atlas', 'books', 2000)", "(2, 'Speaker', 'audio', 100)"]),
              expected: "name | category | price\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Everyone not in Sales",
          prompt: `The table \`employees\` (\`dept\` is NULL for someone not yet assigned):

| emp_id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Sales | 60000 |
| 2 | Ravi | Support | 45000 |
| 3 | Meera | NULL | 52000 |

Return \`name\` and \`dept\` of every employee who is **not in Sales** — and an employee with no department counts as not in Sales. Order by \`emp_id\`.

**Output:** \`name | dept\`.

\`\`\`text
name | dept
Ravi | Support
Meera | NULL
\`\`\``,
          starter: String.raw`-- Return name and dept of everyone not in 'Sales', including employees whose dept is NULL,
-- ordered by emp_id.
`,
          solution: String.raw`SELECT name, dept
FROM employees
WHERE dept <> 'Sales' OR dept IS NULL
ORDER BY emp_id;
`,
          hints: [
            "`dept <> 'Sales'` alone drops the NULL rows: NULL <> 'Sales' is unknown.",
            "`NOT dept = 'Sales'` drops them too — NOT unknown is still unknown.",
            "Add `OR dept IS NULL`.",
          ],
          cases: [
            {
              stdin: setup(EMPLOYEES, "employees", ["(1, 'Asha', 'Sales', 60000)", "(2, 'Ravi', 'Support', 45000)", "(3, 'Meera', NULL, 52000)"]),
              expected: "name | dept\nRavi | Support\nMeera | NULL\n",
            },
            {
              stdin: setup(EMPLOYEES, "employees", ["(5, 'Om', NULL, NULL)", "(2, 'Neha', 'Sales', 40000)", "(9, 'Kiran', 'Eng', 90000)", "(3, 'Tara', NULL, 30000)"]),
              expected: "name | dept\nTara | NULL\nOm | NULL\nKiran | Eng\n",
              hidden: true,
            },
            {
              stdin: setup(EMPLOYEES, "employees", ["(1, 'Asha', 'Sales', 60000)"]),
              expected: "name | dept\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How does MySQL read `WHERE a = 1 OR b = 2 AND c = 3`?",
          options: ["`(a = 1 OR b = 2) AND c = 3`", "`a = 1 OR (b = 2 AND c = 3)`", "Left to right, as written", "It is a syntax error"],
          answer: 1,
          explanation: "AND has higher precedence than OR, as multiplication has over addition. Parentheses make the intended grouping explicit.",
        },
        {
          prompt: "Which condition is true for **every** row with a non-NULL `status`?",
          options: ["`status <> 'paid' AND status <> 'refunded'`", "`status <> 'paid' OR status <> 'refunded'`", "`NOT (status = 'paid' OR status = 'refunded')`", "`status NOT IN ('paid', 'refunded')`"],
          answer: 1,
          explanation: "A status cannot be both 'paid' and 'refunded', so it always differs from at least one. The other three are De Morgan rewrites of one another: neither paid nor refunded.",
        },
        {
          prompt: "What is `FALSE AND NULL` in SQL?",
          options: ["NULL", "FALSE", "TRUE", "An error"],
          answer: 1,
          explanation: "Whatever the unknown value is, FALSE AND it is FALSE, so the result is FALSE. `TRUE AND NULL` is NULL, and `TRUE OR NULL` is TRUE.",
        },
        {
          prompt: "Rows have `dept` = 'Sales', 'Support', NULL. How many rows do `WHERE dept = 'Sales'` and `WHERE NOT dept = 'Sales'` return **together**?",
          options: ["3", "2", "1", "0"],
          answer: 1,
          explanation: "One each: 'Sales', then 'Support'. The NULL row is unknown under both, and NOT unknown is unknown — a filter and its negation do not cover a table that has NULLs.",
        },
        {
          prompt: "`NOT (a OR b)` is equivalent to:",
          options: ["`NOT a OR NOT b`", "`NOT a AND NOT b`", "`a AND b`", "`NOT a AND b`"],
          answer: 1,
          explanation: "De Morgan: negating an OR gives the AND of the negations — neither a nor b.",
        },
      ],
    },
    {
      slug: "in-between-and-like",
      file: "05-in-between-and-like.md",
      exercises: [
        {
          title: "Mid-priced books, games and music",
          prompt: `The table \`products\`:

| product_id | name | category | price |
| --- | --- | --- | --- |
| 1 | Novel | books | 300 |
| 2 | Board Game | games | 1200 |
| 3 | Vinyl | music | 800 |
| 4 | Speaker | audio | 500 |
| 5 | Comic | books | 150 |

Return \`name\`, \`category\` and \`price\` of products in the categories **books, games or music** whose price is **between 300 and 800 inclusive**, cheapest first, ties by \`product_id\`.

**Output:** \`name | category | price\`.

\`\`\`text
name | category | price
Novel | books | 300
Vinyl | music | 800
\`\`\``,
          starter: String.raw`-- Return name, category, price for categories books/games/music
-- with price from 300 to 800 inclusive; ordered by price, then product_id.
`,
          solution: String.raw`SELECT name, category, price
FROM products
WHERE category IN ('books', 'games', 'music')
  AND price BETWEEN 300 AND 800
ORDER BY price, product_id;
`,
          hints: [
            "`category IN ('books', 'games', 'music')` replaces three ORs.",
            "`BETWEEN 300 AND 800` includes both 300 and 800.",
          ],
          cases: [
            {
              stdin: setup(PRODUCTS, "products", ["(1, 'Novel', 'books', 300)", "(2, 'Board Game', 'games', 1200)", "(3, 'Vinyl', 'music', 800)", "(4, 'Speaker', 'audio', 500)", "(5, 'Comic', 'books', 150)"]),
              expected: "name | category | price\nNovel | books | 300\nVinyl | music | 800\n",
            },
            {
              stdin: setup(PRODUCTS, "products", ["(6, 'Dice', 'games', 450)", "(2, 'Poetry', 'books', 450)", "(3, 'CD', 'music', 299)", "(4, 'Album', 'music', 801)", "(5, 'Radio', 'audio', 450)"]),
              expected: "name | category | price\nPoetry | books | 450\nDice | games | 450\n",
              hidden: true,
            },
            {
              stdin: setup(PRODUCTS, "products", ["(1, 'Speaker', 'audio', 400)", "(2, 'Atlas', 'books', 2000)"]),
              expected: "name | category | price\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Gmail users named A or S",
          prompt: `The table \`customers\` (\`email\` may be NULL):

| customer_id | name | email | city |
| --- | --- | --- | --- |
| 1 | Asha | asha.rao@gmail.com | Pune |
| 2 | Ravi | ravi@yahoo.com | Chennai |
| 3 | Sameer | sameer@gmail.com | Delhi |
| 4 | Anil | anil@notgmail.com | Pune |

Return \`name\` and \`email\` of customers whose e-mail address **ends with \`@gmail.com\`** and whose name **starts with A or S**, ordered by \`name\`, ties by \`customer_id\`.

**Output:** \`name | email\`.

\`\`\`text
name | email
Asha | asha.rao@gmail.com
Sameer | sameer@gmail.com
\`\`\``,
          starter: String.raw`-- Return name and email where email ends with '@gmail.com'
-- and name starts with A or S; ordered by name, then customer_id.
`,
          solution: String.raw`SELECT name, email
FROM customers
WHERE email LIKE '%@gmail.com'
  AND (name LIKE 'A%' OR name LIKE 'S%')
ORDER BY name, customer_id;
`,
          hints: [
            "`%` matches any run of characters: `'%@gmail.com'` means *ends with*.",
            "Include the `@`, or `notgmail.com` addresses match too.",
            "Parenthesise the two name patterns joined by OR.",
          ],
          cases: [
            {
              stdin: setup(CUSTOMERS, "customers", ["(1, 'Asha', 'asha.rao@gmail.com', 'Pune')", "(2, 'Ravi', 'ravi@yahoo.com', 'Chennai')", "(3, 'Sameer', 'sameer@gmail.com', 'Delhi')", "(4, 'Anil', 'anil@notgmail.com', 'Pune')"]),
              expected: "name | email\nAsha | asha.rao@gmail.com\nSameer | sameer@gmail.com\n",
            },
            {
              stdin: setup(CUSTOMERS, "customers", ["(1, 'Sara', NULL, 'Pune')", "(2, 'Arjun', 'arjun@gmail.com.in', 'Goa')", "(3, 'Shreya', 'shreya@gmail.com', NULL)", "(4, 'Shreya', 'shreya.k@gmail.com', 'Agra')", "(5, 'Bala', 'bala@gmail.com', 'Ooty')"]),
              expected: "name | email\nShreya | shreya@gmail.com\nShreya | shreya.k@gmail.com\n",
              hidden: true,
            },
            {
              stdin: setup(CUSTOMERS, "customers", ["(1, 'Ravi', 'ravi@gmail.com', 'Pune')"]),
              expected: "name | email\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which values does `price BETWEEN 100 AND 200` match?",
          options: ["101 to 199", "100 to 199", "100 to 200, both included", "101 to 200"],
          answer: 2,
          explanation: "BETWEEN is inclusive at both ends: `price >= 100 AND price <= 200`.",
        },
        {
          prompt: "`dept_id` holds 10, 20 and 30 in three rows. What does `WHERE dept_id NOT IN (10, NULL)` return?",
          options: ["20 and 30", "30 only", "No rows", "All three"],
          answer: 2,
          explanation: "It expands to `dept_id <> 10 AND dept_id <> NULL`. The second comparison is unknown for every row, so the AND is never true — the classic NOT IN trap.",
        },
        {
          prompt: "Which strings does `LIKE '_a%'` match?",
          options: ["Strings that start with a", "Strings whose second character is a", "Strings that contain a", "Strings of exactly two characters ending in a"],
          answer: 1,
          explanation: "`_` is exactly one character, then `a`, then `%` any run. So 'Ravi' and 'Sameer' match; 'Asha' does not.",
        },
        {
          prompt: "How do you find codes that start with the literal text `50%` in MySQL?",
          options: ["`LIKE '50%'`", "`LIKE '50\\%%'`", "`LIKE '50%%'`", "`= '50%'`"],
          answer: 1,
          explanation: "The escaped `\\%` is a literal percent sign and the final `%` is the wildcard. `'50%'` alone matches anything starting with 50; `= '50%'` matches only the exact text.",
        },
        {
          prompt: "Which pattern cannot use an ordinary index on `name`?",
          options: ["`name LIKE 'Sha%'`", "`name LIKE '%sha'`", "`name = 'Shaan'`", "`name >= 'S'`"],
          answer: 1,
          explanation: "A leading wildcard means matching strings are scattered through the sorted index, so every row must be tested. A fixed prefix keeps the matches together.",
        },
      ],
    },
    {
      slug: "distinct",
      file: "06-distinct.md",
      exercises: [
        {
          title: "Cities we ship to",
          prompt: `The table \`customers\` (\`city\` may be NULL):

| customer_id | name | email | city |
| --- | --- | --- | --- |
| 1 | Asha | NULL | Pune |
| 2 | Ravi | NULL | Chennai |
| 3 | Meera | NULL | Pune |
| 4 | Dev | NULL | Pune |

Return each different \`city\` once, in alphabetical order. A missing city appears once, as \`NULL\` — and in MySQL, NULL sorts first.

**Output:** one column \`city\`.

\`\`\`text
city
Chennai
Pune
\`\`\``,
          starter: String.raw`-- Return each distinct city once, ordered by city.
`,
          solution: String.raw`SELECT DISTINCT city
FROM customers
ORDER BY city;
`,
          hints: [
            "`SELECT DISTINCT city` removes repeated rows.",
            "All NULLs collapse into one NULL row; `ORDER BY city` puts it first.",
          ],
          cases: [
            {
              stdin: setup(CUSTOMERS, "customers", ["(1, 'Asha', NULL, 'Pune')", "(2, 'Ravi', NULL, 'Chennai')", "(3, 'Meera', NULL, 'Pune')", "(4, 'Dev', NULL, 'Pune')"]),
              expected: "city\nChennai\nPune\n",
            },
            {
              stdin: setup(CUSTOMERS, "customers", ["(1, 'Om', NULL, NULL)", "(2, 'Isha', NULL, 'Delhi')", "(3, 'Tara', NULL, NULL)", "(4, 'Kiran', NULL, 'Agra')", "(5, 'Neha', NULL, 'Delhi')"]),
              expected: "city\nNULL\nAgra\nDelhi\n",
              hidden: true,
            },
            { stdin: setup(CUSTOMERS, "customers", []), expected: "city\n(no rows)\n", hidden: true },
          ],
        },
        {
          title: "Count the different",
          prompt: `The table \`orders\` (\`customer_id\` is NULL for a guest checkout):

| order_id | customer_id | product |
| --- | --- | --- |
| 1 | 7 | pen |
| 2 | 7 | ink |
| 3 | 9 | pen |
| 4 | NULL | pen |

Return one row with three counts: \`order_count\` (all orders), \`buyer_count\` (different known customers — guests are not counted) and \`product_count\` (different products).

**Output:** \`order_count | buyer_count | product_count\`.

\`\`\`text
order_count | buyer_count | product_count
4 | 2 | 2
\`\`\``,
          starter: String.raw`-- Return COUNT(*) AS order_count, the number of different customer_ids AS buyer_count,
-- and the number of different products AS product_count.
`,
          solution: String.raw`SELECT COUNT(*)                    AS order_count,
       COUNT(DISTINCT customer_id) AS buyer_count,
       COUNT(DISTINCT product)     AS product_count
FROM orders;
`,
          hints: [
            "`COUNT(*)` counts rows; `COUNT(DISTINCT col)` counts different values.",
            "`COUNT(DISTINCT customer_id)` ignores NULL, which is exactly the guest rule.",
          ],
          cases: [
            {
              stdin: setup(SALES, "orders", ["(1, 7, 'pen')", "(2, 7, 'ink')", "(3, 9, 'pen')", "(4, NULL, 'pen')"]),
              expected: "order_count | buyer_count | product_count\n4 | 2 | 2\n",
            },
            { stdin: setup(SALES, "orders", []), expected: "order_count | buyer_count | product_count\n0 | 0 | 0\n", hidden: true },
            {
              stdin: setup(SALES, "orders", ["(1, NULL, 'lamp')", "(2, NULL, 'desk')", "(3, 4, 'lamp')", "(4, 5, 'chair')", "(5, 6, 'lamp')", "(6, 4, 'desk')"]),
              expected: "order_count | buyer_count | product_count\n6 | 3 | 3\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT DISTINCT dept, job FROM employees` return?",
          options: ["Each department once", "Each (dept, job) pair once", "Each job once", "An error: DISTINCT takes one column"],
          answer: 1,
          explanation: "DISTINCT compares whole result rows. A department appears again for each different job in it.",
        },
        {
          prompt: "`city` is 'Pune', NULL, NULL, 'Pune'. What do `SELECT DISTINCT city` and `SELECT COUNT(DISTINCT city)` give?",
          options: ["2 rows; 2", "2 rows (NULL and Pune); 1", "3 rows; 3", "1 row; 1"],
          answer: 1,
          explanation: "DISTINCT collapses the NULLs into one NULL row, so two rows. COUNT(DISTINCT) ignores NULL entirely, so 1.",
        },
        {
          prompt: "What does `SELECT DISTINCT(city), name FROM customers` apply DISTINCT to?",
          options: ["city only", "name only", "the pair (city, name)", "Nothing — it is a syntax error"],
          answer: 2,
          explanation: "The parentheses only surround the expression `city`; DISTINCT always applies to the whole row. Don't write it that way.",
        },
        {
          prompt: "Why does MySQL 8 refuse `SELECT DISTINCT city FROM customers ORDER BY joined`?",
          options: ["DISTINCT cannot be sorted", "After DISTINCT merges rows, there is no single `joined` value to sort a city by", "ORDER BY must come before DISTINCT", "joined is a date"],
          answer: 1,
          explanation: "Many customers share a city, each with their own join date. With DISTINCT, ORDER BY may only use selected columns.",
        },
        {
          prompt: "A join returns duplicate rows. What is the best first step?",
          options: ["Add DISTINCT", "Find out why the join matches more rows than expected", "Add LIMIT", "Add GROUP BY on every column"],
          answer: 1,
          explanation: "DISTINCT hides the symptom but the query still does the extra work, and aggregates over the same rows would be wrong. Usually the join condition is incomplete.",
        },
      ],
    },
    {
      slug: "filtering-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A discounted price list",
          prompt: `The table \`products\` (\`discount_pct\` is NULL when no discount is set):

| product_id | name | price | discount_pct |
| --- | --- | --- | --- |
| 1 | Kettle | 1999 | 10 |
| 2 | Toaster | 2500 | 0 |
| 3 | Mixer | 4499 | 15 |

Return \`id\` (\`product_id\`), \`product\` (\`name\`), \`list_price\` (\`price\`) and \`sale_price\`: the price less its discount percentage, rounded to 2 places. A NULL discount gives a NULL \`sale_price\`. Order by \`sale_price\` descending (NULLs last, which is MySQL's descending order), ties by \`product_id\`.

**Output:** \`id | product | list_price | sale_price\`.

\`\`\`text
id | product | list_price | sale_price
3 | Mixer | 4499 | 3824.15
2 | Toaster | 2500 | 2500
1 | Kettle | 1999 | 1799.1
\`\`\``,
          starter: String.raw`-- Return product_id AS id, name AS product, price AS list_price and
-- ROUND(price * (100 - discount_pct) / 100, 2) AS sale_price,
-- ordered by sale_price descending, then product_id.
`,
          solution: String.raw`SELECT product_id AS id,
       name       AS product,
       price      AS list_price,
       ROUND(price * (100 - discount_pct) / 100, 2) AS sale_price
FROM products
ORDER BY sale_price DESC, product_id;
`,
          hints: [
            "A price less 15% is `price * (100 - 15) / 100`.",
            "`ORDER BY` can use the alias `sale_price`.",
            "Arithmetic with a NULL discount is NULL by itself — no extra handling.",
          ],
          cases: [
            {
              stdin: setup(PRICE_LIST, "products", ["(1, 'Kettle', 1999, 10)", "(2, 'Toaster', 2500, 0)", "(3, 'Mixer', 4499, 15)"]),
              expected: "id | product | list_price | sale_price\n3 | Mixer | 4499 | 3824.15\n2 | Toaster | 2500 | 2500\n1 | Kettle | 1999 | 1799.1\n",
            },
            {
              stdin: setup(PRICE_LIST, "products", ["(4, 'Iron', 1000, NULL)", "(7, 'Fan', 1200, 25)", "(5, 'Lamp', 900, 0)", "(6, 'Clock', 333, 33)"]),
              expected: "id | product | list_price | sale_price\n5 | Lamp | 900 | 900\n7 | Fan | 1200 | 900\n6 | Clock | 333 | 223.11\n4 | Iron | 1000 | NULL\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Orders to review",
          prompt: `The table \`orders\`:

| order_id | status | amount | country | coupon |
| --- | --- | --- | --- | --- |
| 1 | pending | 12000 | IN | NULL |
| 2 | pending | 3000 | US | NULL |
| 3 | shipped | 25000 | IN | NULL |
| 4 | on_hold | 15000 | IN | SAVE10 |
| 5 | on_hold | 9999 | IN | NULL |

An order needs review when **all three** hold: its status is \`pending\` or \`on_hold\`; its amount is between 10000 and 50000 inclusive **or** it ships outside India (country is not \`IN\`); and no coupon was used (\`coupon\` is NULL). Return \`order_id\`, \`status\` and \`amount\` of those orders, ordered by \`order_id\`.

**Output:** \`order_id | status | amount\`.

\`\`\`text
order_id | status | amount
1 | pending | 12000
2 | pending | 3000
\`\`\``,
          starter: String.raw`-- Return order_id, status, amount for orders that are pending/on_hold,
-- AND (amount between 10000 and 50000 OR country <> 'IN'),
-- AND have no coupon; ordered by order_id.
`,
          solution: String.raw`SELECT order_id, status, amount
FROM orders
WHERE status IN ('pending', 'on_hold')
  AND (amount BETWEEN 10000 AND 50000 OR country <> 'IN')
  AND coupon IS NULL
ORDER BY order_id;
`,
          hints: [
            "`status IN ('pending', 'on_hold')` for the first condition.",
            "Parenthesise the OR: `(amount BETWEEN 10000 AND 50000 OR country <> 'IN')`.",
            "`coupon = NULL` is never true — use `coupon IS NULL`.",
          ],
          cases: [
            {
              stdin: setup(REVIEW, "orders", ["(1, 'pending', 12000, 'IN', NULL)", "(2, 'pending', 3000, 'US', NULL)", "(3, 'shipped', 25000, 'IN', NULL)", "(4, 'on_hold', 15000, 'IN', 'SAVE10')", "(5, 'on_hold', 9999, 'IN', NULL)"]),
              expected: "order_id | status | amount\n1 | pending | 12000\n2 | pending | 3000\n",
            },
            {
              stdin: setup(REVIEW, "orders", ["(1, 'on_hold', 50000, 'IN', NULL)", "(2, 'on_hold', 50001, 'IN', NULL)", "(3, 'pending', 10000, 'IN', NULL)", "(4, 'shipped', 100, 'AE', NULL)", "(5, 'pending', 60000, 'SG', NULL)", "(6, 'pending', 20000, 'IN', 'FEST')"]),
              expected: "order_id | status | amount\n1 | on_hold | 50000\n3 | pending | 10000\n5 | pending | 60000\n",
              hidden: true,
            },
            {
              stdin: setup(REVIEW, "orders", ["(1, 'shipped', 20000, 'US', NULL)", "(2, 'pending', 500, 'IN', NULL)"]),
              expected: "order_id | status | amount\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Departments with engineers",
          prompt: `The table \`employees\` (\`dept\` may be NULL):

| emp_id | name | job_title | dept |
| --- | --- | --- | --- |
| 1 | Asha | Software Engineer | Platform |
| 2 | Ravi | Senior Engineer | Platform |
| 3 | Meera | Data Engineer | Analytics |
| 4 | Kabir | Analyst | Analytics |
| 5 | Dev | QA Engineer | NULL |

Return each **department** that has at least one employee whose \`job_title\` contains the text \`Engineer\`, once each, in alphabetical order. Leave out a NULL department.

**Output:** one column \`dept\`.

\`\`\`text
dept
Analytics
Platform
\`\`\``,
          starter: String.raw`-- Return each distinct dept (not NULL) that has a job_title containing 'Engineer',
-- ordered by dept.
`,
          solution: String.raw`SELECT DISTINCT dept
FROM employees
WHERE job_title LIKE '%Engineer%'
  AND dept IS NOT NULL
ORDER BY dept;
`,
          hints: [
            "`LIKE '%Engineer%'` means *contains*.",
            "`DISTINCT` collapses the repeated departments.",
            "`dept IS NOT NULL` removes the unassigned row.",
          ],
          cases: [
            {
              stdin: setup(ROLES, "employees", ["(1, 'Asha', 'Software Engineer', 'Platform')", "(2, 'Ravi', 'Senior Engineer', 'Platform')", "(3, 'Meera', 'Data Engineer', 'Analytics')", "(4, 'Kabir', 'Analyst', 'Analytics')", "(5, 'Dev', 'QA Engineer', NULL)"]),
              expected: "dept\nAnalytics\nPlatform\n",
            },
            {
              stdin: setup(ROLES, "employees", ["(1, 'Om', 'Engineering Manager', 'Mobile')", "(2, 'Isha', 'Designer', 'Web')", "(3, 'Tara', 'Engineer', 'Core')", "(4, 'Neha', 'Engineer II', 'Core')", "(5, 'Kiran', 'Recruiter', 'People')"]),
              expected: "dept\nCore\nMobile\n",
              hidden: true,
            },
            {
              stdin: setup(ROLES, "employees", ["(1, 'Om', 'Designer', 'Web')", "(2, 'Dev', 'QA Engineer', NULL)"]),
              expected: "dept\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which query is refused by MySQL?",
          options: ["`SELECT price * 2 AS p FROM t ORDER BY p`", "`SELECT price * 2 AS p FROM t WHERE p > 10`", "`SELECT price * 2 AS p FROM t WHERE price * 2 > 10`", "`SELECT price AS p FROM t ORDER BY price`"],
          answer: 1,
          explanation: "WHERE is evaluated before SELECT, so the alias `p` is unknown there. ORDER BY can use it; repeating the expression in WHERE works.",
        },
        {
          prompt: "In MySQL, what is `SELECT 10 / 4 AS a, 10 DIV 4 AS b, 10 % 4 AS c;`?",
          options: ["2.5000, 2, 2", "2, 2, 2", "2.5000, 2.5000, 2", "2, 2.5000, 2"],
          answer: 0,
          explanation: "`/` is decimal division in MySQL, `DIV` integer division, `%` the remainder.",
        },
        {
          prompt: "What is `CONCAT('Order-', NULL)` in MySQL?",
          options: ["`Order-`", "`Order-NULL`", "NULL", "An error"],
          answer: 2,
          explanation: "CONCAT returns NULL if any argument is NULL. `CONCAT_WS` skips NULL arguments instead.",
        },
        {
          prompt: "Which condition returns the rows whose `manager_id` is missing?",
          options: ["`manager_id = NULL`", "`manager_id IS NULL`", "`manager_id = ''`", "`NOT manager_id`"],
          answer: 1,
          explanation: "Only `IS NULL` tests for a missing value. `= NULL` is never true; an empty string is a value; `NOT manager_id` is unknown for NULL.",
        },
        {
          prompt: "What does `WHERE category = 'books' OR category = 'games' AND price < 500` return?",
          options: ["Books and games under 500", "All books, plus games under 500", "Only games under 500", "Nothing"],
          answer: 1,
          explanation: "AND binds first: `books OR (games AND price < 500)`. Parenthesise the OR group to get the intended filter.",
        },
        {
          prompt: "What is `TRUE OR NULL`?",
          options: ["TRUE", "NULL", "FALSE", "An error"],
          answer: 0,
          explanation: "TRUE OR anything is TRUE, so the unknown does not matter. `FALSE OR NULL` would be NULL.",
        },
        {
          prompt: "Which is the same as `x NOT BETWEEN 10 AND 20`?",
          options: ["`x < 10 AND x > 20`", "`x < 10 OR x > 20`", "`x <= 10 OR x >= 20`", "`x > 10 AND x < 20`"],
          answer: 1,
          explanation: "BETWEEN is `x >= 10 AND x <= 20`; by De Morgan its negation is `x < 10 OR x > 20`. The AND version can never be true.",
        },
        {
          prompt: "Which names does `LIKE 'S____'` (S and four underscores) match?",
          options: ["Every name starting with S", "Names of exactly five characters starting with S", "Names of at least five characters starting with S", "Names ending in S"],
          answer: 1,
          explanation: "Each `_` is exactly one character, so the pattern matches S plus four more: 'Sunil', 'Sagar' — not 'Sameer' or 'Sam'.",
        },
        {
          prompt: "Why might `WHERE id NOT IN (SELECT manager_id FROM employees)` suddenly return no rows?",
          options: ["The subquery returned duplicates", "One employee has a NULL manager_id", "The subquery is too large", "NOT IN needs DISTINCT"],
          answer: 1,
          explanation: "A NULL in the list makes `id <> NULL` unknown for every row, so NOT IN is never true. Filter NULLs out of the subquery or use NOT EXISTS.",
        },
        {
          prompt: "Rows have `product` = pen, pen, ink, NULL. What is `COUNT(product)`?",
          options: ["4", "3", "2", "1"],
          answer: 1,
          explanation: "`COUNT(col)` counts non-NULL values, duplicates included: pen, pen, ink. `COUNT(*)` would be 4 and `COUNT(DISTINCT product)` 2.",
        },
        {
          prompt: "Which query returns each department once?",
          options: ["`SELECT DISTINCT dept, name FROM employees`", "`SELECT DISTINCT dept FROM employees`", "`SELECT dept FROM employees LIMIT 1`", "`SELECT COUNT(DISTINCT dept) FROM employees`"],
          answer: 1,
          explanation: "DISTINCT on just `dept`. Adding `name` makes each (dept, name) pair distinct; COUNT returns a number, not the departments.",
        },
        {
          prompt: "What does MySQL do with `SELECT 100 / 0;`?",
          options: ["Returns 0", "Returns NULL (with a warning)", "Returns infinity", "Always raises an error"],
          answer: 1,
          explanation: "MySQL returns NULL for division by zero (an error only under strict settings on writes). PostgreSQL and SQL Server raise an error.",
        },
      ],
    },
  ],
});
