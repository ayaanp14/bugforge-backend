import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "sorting-and-limiting",
  title: "Sorting and limiting",
  blurb: "ORDER BY with ASC and DESC, aliases, expressions and where NULLs sort; several keys, tie-breakers and custom orders; LIMIT and OFFSET with MySQL's comma form, TOP and FETCH FIRST; offset and keyset pagination; top-N queries and the Nth highest value.",
  icon: "list",
  overview: `A table has no order, so a query has none either until it asks for one. This module teaches the clauses that turn a set of rows into a list you can read, page through and rank: \`ORDER BY\` to sort, \`LIMIT\` and \`OFFSET\` to take a slice. They are short clauses with long consequences — almost every report, feed, leaderboard and API page is built on them, and the classic interview questions ("second highest salary", "why do rows repeat across pages", "where do NULLs sort") live here. The examples are MySQL 8, with the places where PostgreSQL, SQL Server and Oracle differ called out, because interviews ask about those too.

ORDER BY covers ascending and descending keys, sorting by aliases, expressions and positions, why aliases work there but not in \`WHERE\`, where MySQL puts NULLs and the \`col IS NULL\` idiom, and how collation changes string order. Sorting on several keys covers left-to-right comparison, per-key directions, unique tie-breakers, boolean keys and custom orders with \`CASE\` and \`FIELD\`. LIMIT and OFFSET covers the slice, the comma form, the processing order and the other dialects' \`TOP\` and \`FETCH FIRST\`. Pagination covers the offset formula, the duplicate-row bug, deep-offset cost and keyset pagination. Top-N queries covers top and bottom N, the Nth highest value with \`DISTINCT\`, returning NULL with a scalar subquery, ties at the cut-off and why per-group top-N needs more.

The exercises are queries run against small tables: a price list with a tie-breaker, hire dates with unknowns last, a class ranking on three keys, a support queue in priority order, the latest orders, a middle slice, page three of a catalogue, the page after a keyset cursor, the cheapest items in stock and the second highest salary. The checkpoint adds a leaderboard, a catalogue page with unpriced items last and the third highest distinct score.`,
  lessons: [
    {
      slug: "order-by",
      file: "01-order-by.md",
      exercises: [
        {
          title: "Price list, most expensive first",
          prompt: `The \`products\` table:

| id | name | price |
| --- | --- | --- |
| 1 | notebook | 40 |
| 2 | pencil | 5 |
| 3 | backpack | 900 |
| 4 | eraser | 5 |
| 5 | stapler | 120 |

List every product as \`name\`, \`price\`, the most expensive first. Products with the same price are listed alphabetically by name.

\`\`\`text
name | price
backpack | 900
stapler | 120
notebook | 40
eraser | 5
pencil | 5
\`\`\``,
          starter: String.raw`-- List name and price from products,
-- most expensive first, ties broken by name A to Z.
`,
          solution: String.raw`SELECT name, price
FROM products
ORDER BY price DESC, name;
`,
          hints: [
            "`DESC` reverses the order of the key it follows.",
            "A second key after a comma only decides between rows whose first key is equal: `ORDER BY price DESC, name`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO products VALUES (1, 'notebook', 40), (2, 'pencil', 5), (3, 'backpack', 900), (4, 'eraser', 5), (5, 'stapler', 120);
`,
              expected: "name | price\nbackpack | 900\nstapler | 120\nnotebook | 40\neraser | 5\npencil | 5\n",
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO products VALUES (1, 'clip', 10), (2, 'board', 10), (3, 'card', 10);
`,
              expected: "name | price\nboard | 10\ncard | 10\nclip | 10\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT);
`,
              expected: "name | price\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Hire dates, unknowns last",
          prompt: `The \`employees\` table; \`hired_on\` is NULL when the date was never recorded:

| id | name | hired_on |
| --- | --- | --- |
| 1 | Asha | 2021-03-15 |
| 2 | Ben | NULL |
| 3 | Chen | 2019-07-01 |
| 4 | Dina | 2021-03-15 |
| 5 | Eli | NULL |

List \`name\`, \`hired_on\` from the earliest hire to the latest, with the NULL dates **at the end**. Rows with the same date (or both NULL) are ordered by \`id\`.

\`\`\`text
name | hired_on
Chen | 2019-07-01
Asha | 2021-03-15
Dina | 2021-03-15
Ben | NULL
Eli | NULL
\`\`\``,
          starter: String.raw`-- List name and hired_on, earliest first,
-- NULL dates last, ties by id.
`,
          solution: String.raw`SELECT name, hired_on
FROM employees
ORDER BY hired_on IS NULL, hired_on, id;
`,
          hints: [
            "MySQL sorts NULL before every value in ascending order, so a plain `ORDER BY hired_on` puts Ben and Eli first.",
            "`hired_on IS NULL` is 0 for a date and 1 for a NULL — sort on it before the date itself.",
            "`ORDER BY hired_on IS NULL, hired_on, id`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), hired_on DATE);
INSERT INTO employees VALUES (1, 'Asha', '2021-03-15'), (2, 'Ben', NULL), (3, 'Chen', '2019-07-01'), (4, 'Dina', '2021-03-15'), (5, 'Eli', NULL);
`,
              expected: "name | hired_on\nChen | 2019-07-01\nAsha | 2021-03-15\nDina | 2021-03-15\nBen | NULL\nEli | NULL\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), hired_on DATE);
INSERT INTO employees VALUES (3, 'Xavi', NULL), (1, 'Yara', NULL);
`,
              expected: "name | hired_on\nYara | NULL\nXavi | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), hired_on DATE);
INSERT INTO employees VALUES (1, 'Pia', '2020-01-02'), (2, 'Quinn', '2019-12-31'), (3, 'Rhea', NULL);
`,
              expected: "name | hired_on\nQuinn | 2019-12-31\nPia | 2020-01-02\nRhea | NULL\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What order does `SELECT name FROM products` (no ORDER BY) return its rows in?",
          options: ["Insertion order", "Primary key order", "Alphabetical order", "No guaranteed order"],
          answer: 3,
          explanation: "A table is a set; without `ORDER BY` the engine returns rows in whatever order its plan produces. It often *looks* like insertion or key order, which is why the bug survives until an index or an update changes the plan.",
        },
        {
          prompt: "Why does this work in MySQL?\n\n```sql\nSELECT price * qty AS total FROM items ORDER BY total DESC;\n```\nwhile `WHERE total > 100` on the same query fails?",
          options: [
            "ORDER BY is evaluated after SELECT, WHERE before it",
            "Aliases only work with DESC",
            "MySQL allows aliases everywhere except WHERE by special exception",
            "WHERE needs the alias in quotes",
          ],
          answer: 0,
          explanation: "The logical order is FROM → WHERE → SELECT → ORDER BY → LIMIT. The alias is created in SELECT, so it exists by the time ORDER BY runs but not yet in WHERE. Quoting it in WHERE would compare against a string literal, not the column.",
        },
        {
          prompt: "In MySQL, `SELECT name, discount FROM products ORDER BY discount DESC` — where do rows with a NULL discount appear?",
          options: ["First", "Last", "Excluded from the result", "In insertion order among the others"],
          answer: 1,
          explanation: "MySQL treats NULL as lower than any value: first when ascending, last when descending. ORDER BY never removes rows. PostgreSQL would put them first here, which is the dialect difference interviews probe.",
        },
        {
          prompt: "A `code` column is `VARCHAR` and holds `'9'`, `'10'` and `'100'`. What does `ORDER BY code` give?",
          options: ["9, 10, 100", "10, 100, 9", "100, 10, 9", "An error"],
          answer: 1,
          explanation: "Text compares character by character: `'1'` < `'9'`, so both strings starting with 1 come before `'9'`, and `'10'` is a prefix of `'100'`. Numbers stored as text sort as text; cast them (next module) or store them as numbers.",
        },
        {
          prompt: "What does `ORDER BY 2` mean in `SELECT name, price FROM products ORDER BY 2`?",
          options: ["Sort by the constant 2 (no effect)", "Sort by the second column of the select list, price", "Return only 2 rows", "Sort by the table's second column"],
          answer: 1,
          explanation: "A bare integer in ORDER BY is a position in the select list. It is legal but fragile: reordering the select list silently changes the sort. LIMIT, not ORDER BY, restricts the number of rows.",
        },
      ],
    },
    {
      slug: "sorting-on-several-keys",
      file: "02-sorting-on-several-keys.md",
      exercises: [
        {
          title: "Class ranking",
          prompt: `The \`students\` table:

| id | name | class | score |
| --- | --- | --- | --- |
| 1 | Tara | A | 85 |
| 2 | Dev | B | 60 |
| 3 | Meera | A | 91 |
| 4 | Kiran | B | 78 |
| 5 | Arjun | A | 85 |

List \`class\`, \`name\`, \`score\`: classes in alphabetical order, within a class the highest score first, and students with the same class and score alphabetically by name.

\`\`\`text
class | name | score
A | Meera | 91
A | Arjun | 85
A | Tara | 85
B | Kiran | 78
B | Dev | 60
\`\`\``,
          starter: String.raw`-- List class, name, score: class A to Z,
-- best score first within a class, then name A to Z.
`,
          solution: String.raw`SELECT class, name, score
FROM students
ORDER BY class, score DESC, name;
`,
          hints: [
            "Three keys, compared left to right: class, then score, then name.",
            "`DESC` belongs only to the key it follows — the class and the name stay ascending.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40), class CHAR(1), score INT);
INSERT INTO students VALUES (1, 'Tara', 'A', 85), (2, 'Dev', 'B', 60), (3, 'Meera', 'A', 91), (4, 'Kiran', 'B', 78), (5, 'Arjun', 'A', 85);
`,
              expected: "class | name | score\nA | Meera | 91\nA | Arjun | 85\nA | Tara | 85\nB | Kiran | 78\nB | Dev | 60\n",
            },
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40), class CHAR(1), score INT);
INSERT INTO students VALUES (1, 'Zed', 'C', 70), (2, 'Amy', 'C', 70), (3, 'Bo', 'A', 70), (4, 'Cy', 'B', 100);
`,
              expected: "class | name | score\nA | Bo | 70\nB | Cy | 100\nC | Amy | 70\nC | Zed | 70\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(40), class CHAR(1), score INT);
INSERT INTO students VALUES (1, 'Nia', 'B', 50), (2, 'Oz', 'B', 95), (3, 'Pam', 'B', 72);
`,
              expected: "class | name | score\nB | Oz | 95\nB | Pam | 72\nB | Nia | 50\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Support queue in priority order",
          prompt: `The \`tickets\` table:

| id | title | priority | opened_on |
| --- | --- | --- | --- |
| 1 | Typo on FAQ | medium | 2024-05-03 |
| 2 | Checkout broken | high | 2024-05-04 |
| 3 | Add dark mode | low | 2024-05-01 |
| 4 | Login loop | high | 2024-05-02 |
| 5 | Slow search | medium | 2024-05-03 |
| 6 | Old ticket | urgent | 2024-04-01 |

List \`id\`, \`title\`, \`priority\` in queue order: \`high\` first, then \`medium\`, then \`low\`, then **any other value, including NULL**, last. Within a priority, the oldest \`opened_on\` first; then by \`id\`.

\`\`\`text
id | title | priority
4 | Login loop | high
2 | Checkout broken | high
1 | Typo on FAQ | medium
5 | Slow search | medium
3 | Add dark mode | low
6 | Old ticket | urgent
\`\`\``,
          starter: String.raw`-- List id, title, priority: high, medium, low, then anything else;
-- oldest opened_on first within a priority, then id.
`,
          solution: String.raw`SELECT id, title, priority
FROM tickets
ORDER BY CASE priority
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
           ELSE 4
         END,
         opened_on,
         id;
`,
          hints: [
            "Alphabetical order puts `high` < `low` < `medium` — sort on a rank instead of the text.",
            "`CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 … END` turns each value into a number you can sort on.",
            "Give the `CASE` an `ELSE 4` so unknown values and NULL go last; `FIELD` would give them 0 and put them first.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, title VARCHAR(60), priority VARCHAR(10), opened_on DATE);
INSERT INTO tickets VALUES
  (1, 'Typo on FAQ', 'medium', '2024-05-03'),
  (2, 'Checkout broken', 'high', '2024-05-04'),
  (3, 'Add dark mode', 'low', '2024-05-01'),
  (4, 'Login loop', 'high', '2024-05-02'),
  (5, 'Slow search', 'medium', '2024-05-03'),
  (6, 'Old ticket', 'urgent', '2024-04-01');
`,
              expected: "id | title | priority\n4 | Login loop | high\n2 | Checkout broken | high\n1 | Typo on FAQ | medium\n5 | Slow search | medium\n3 | Add dark mode | low\n6 | Old ticket | urgent\n",
            },
            {
              stdin: String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, title VARCHAR(60), priority VARCHAR(10), opened_on DATE);
INSERT INTO tickets VALUES
  (1, 'Untriaged', NULL, '2024-01-01'),
  (2, 'Rename button', 'low', '2024-02-01'),
  (3, 'Fix footer', 'low', '2024-01-15');
`,
              expected: "id | title | priority\n3 | Fix footer | low\n2 | Rename button | low\n1 | Untriaged | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, title VARCHAR(60), priority VARCHAR(10), opened_on DATE);
INSERT INTO tickets VALUES
  (7, 'B', 'medium', '2024-03-01'),
  (5, 'A', 'medium', '2024-03-01'),
  (9, 'C', 'high', '2024-03-09'),
  (2, 'D', NULL, '2024-01-01'),
  (3, 'E', 'later', '2023-12-01');
`,
              expected: "id | title | priority\n9 | C | high\n5 | A | medium\n7 | B | medium\n3 | E | later\n2 | D | NULL\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which rows are compared on `name` in `ORDER BY dept, salary DESC, name`?",
          options: ["Every row", "Only rows with the same dept", "Only rows with the same dept and the same salary", "Only rows with the same salary"],
          answer: 2,
          explanation: "Keys are compared left to right, and a later key only decides between rows that tie on all earlier keys. Two rows with the same salary but different departments are already ordered by dept.",
        },
        {
          prompt: "What does `ORDER BY score, name DESC` do?",
          options: ["Both keys descending", "Score ascending, name descending", "Score descending, name ascending", "It is a syntax error"],
          answer: 1,
          explanation: "`DESC` attaches to the one key it follows. To sort both descending write `ORDER BY score DESC, name DESC`.",
        },
        {
          prompt: "`ORDER BY FIELD(size, 'S', 'M', 'L')` runs on rows whose sizes are `M`, `XL` and `S`. What order do they come out in?",
          options: ["S, M, XL", "XL, S, M", "S, M, then XL anywhere", "An error, because XL is not listed"],
          answer: 1,
          explanation: "`FIELD` returns the 1-based position in the list and `0` for a value that is not listed, so `XL` gets 0 and sorts first. A `CASE` with an `ELSE` rank is the safe way to send unknown values to the end.",
        },
        {
          prompt: "Why end an ORDER BY with the primary key?",
          options: [
            "It makes the query faster",
            "It gives every row exactly one position, so the order is reproducible",
            "MySQL requires it when there are several keys",
            "It removes duplicate rows",
          ],
          answer: 1,
          explanation: "Rows tied on all keys come back in an undefined order, and SQL sorting is not stable. A unique last key removes every tie. It is not required by syntax and has nothing to do with DISTINCT.",
        },
        {
          prompt: "In MySQL, `SELECT name FROM products ORDER BY featured = 'yes' DESC, price` — what does the first key do?",
          options: [
            "Filters to featured products",
            "Puts products with `featured = 'yes'` first, since the comparison is 1 for them and 0 for others",
            "Is a syntax error; ORDER BY takes only columns",
            "Sorts the featured column alphabetically",
          ],
          answer: 1,
          explanation: "A comparison is an expression yielding 1 or 0 in MySQL, so it can be a sort key; `DESC` puts the 1s first. ORDER BY never filters rows — WHERE does.",
        },
      ],
    },
    {
      slug: "limit-and-offset",
      file: "03-limit-and-offset.md",
      exercises: [
        {
          title: "The three latest orders",
          prompt: `The \`orders\` table:

| id | customer | placed_on | total |
| --- | --- | --- | --- |
| 1 | Anita | 2024-03-01 | 500 |
| 2 | Ravi | 2024-03-04 | 1200 |
| 3 | Sam | 2024-03-02 | 90 |
| 4 | Lena | 2024-03-04 | 300 |
| 5 | Omar | 2024-02-27 | 75 |

Return the three most recent orders as \`id\`, \`customer\`, \`placed_on\`, newest first. Orders placed on the same day: the higher \`id\` first. If there are fewer than three orders, return them all.

\`\`\`text
id | customer | placed_on
4 | Lena | 2024-03-04
2 | Ravi | 2024-03-04
3 | Sam | 2024-03-02
\`\`\``,
          starter: String.raw`-- The three newest orders: id, customer, placed_on,
-- newest first, same day by higher id first.
`,
          solution: String.raw`SELECT id, customer, placed_on
FROM orders
ORDER BY placed_on DESC, id DESC
LIMIT 3;
`,
          hints: [
            "Sort first, then cut: `LIMIT` takes the first rows of the sorted result.",
            "Both keys are descending here: `ORDER BY placed_on DESC, id DESC LIMIT 3`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(40), placed_on DATE, total INT);
INSERT INTO orders VALUES (1, 'Anita', '2024-03-01', 500), (2, 'Ravi', '2024-03-04', 1200), (3, 'Sam', '2024-03-02', 90), (4, 'Lena', '2024-03-04', 300), (5, 'Omar', '2024-02-27', 75);
`,
              expected: "id | customer | placed_on\n4 | Lena | 2024-03-04\n2 | Ravi | 2024-03-04\n3 | Sam | 2024-03-02\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(40), placed_on DATE, total INT);
INSERT INTO orders VALUES (8, 'Kai', '2023-11-30', 20), (9, 'Lu', '2024-01-01', 40);
`,
              expected: "id | customer | placed_on\n9 | Lu | 2024-01-01\n8 | Kai | 2023-11-30\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(40), placed_on DATE, total INT);
`,
              expected: "id | customer | placed_on\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Rows four to six",
          prompt: `The \`products\` table:

| id | name | price |
| --- | --- | --- |
| 1 | pen | 10 |
| 2 | ruler | 25 |
| 3 | glue | 30 |
| 4 | tape | 30 |
| 5 | folder | 45 |
| 6 | marker | 15 |
| 7 | scissors | 80 |
| 8 | stapler | 120 |

Sorted by \`price\` ascending, then \`id\`, return only the **4th, 5th and 6th** rows as \`id\`, \`name\`, \`price\`. With fewer rows, return whatever exists in those positions.

\`\`\`text
id | name | price
3 | glue | 30
4 | tape | 30
5 | folder | 45
\`\`\``,
          starter: String.raw`-- Sorted by price, then id: return rows 4 to 6 only.
`,
          solution: String.raw`SELECT id, name, price
FROM products
ORDER BY price, id
LIMIT 3 OFFSET 3;
`,
          hints: [
            "Skip the first three rows, then keep three.",
            "Offsets count from zero: `OFFSET 3` starts at the fourth row.",
            "`LIMIT 3 OFFSET 3` (or MySQL's `LIMIT 3, 3`, offset first).",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO products VALUES (1, 'pen', 10), (2, 'ruler', 25), (3, 'glue', 30), (4, 'tape', 30), (5, 'folder', 45), (6, 'marker', 15), (7, 'scissors', 80), (8, 'stapler', 120);
`,
              expected: "id | name | price\n3 | glue | 30\n4 | tape | 30\n5 | folder | 45\n",
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO products VALUES (5, 'e', 50), (4, 'd', 40), (3, 'c', 30), (2, 'b', 20), (1, 'a', 10);
`,
              expected: "id | name | price\n4 | d | 40\n5 | e | 50\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO products VALUES (1, 'a', 10), (2, 'b', 20), (3, 'c', 30);
`,
              expected: "id | name | price\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO products VALUES (7, 'g', 5), (3, 'c', 5), (9, 'i', 5), (1, 'a', 5), (5, 'e', 5), (2, 'b', 5), (8, 'h', 5);
`,
              expected: "id | name | price\n5 | e | 5\n7 | g | 5\n8 | h | 5\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In MySQL, which rows does `LIMIT 10, 5` return?",
          options: ["Rows 10 to 15", "Rows 11 to 15", "Rows 6 to 15", "Rows 11 to 20"],
          answer: 1,
          explanation: "The comma form is offset first, count second: skip 10, take 5 — rows 11 to 15. It equals `LIMIT 5 OFFSET 10`. Reading it as \"10 rows then 5\" is the trap.",
        },
        {
          prompt: "What does `SELECT id FROM orders LIMIT 5` return?",
          options: ["The five oldest orders", "The five newest orders", "The five orders with the lowest id", "Some five orders, in no guaranteed order"],
          answer: 3,
          explanation: "LIMIT takes the first rows of the result's order, and without ORDER BY there is none. It may happen to return the lowest ids today and different rows tomorrow.",
        },
        {
          prompt: "A query produces 12 rows. What does adding `LIMIT 5 OFFSET 20` return?",
          options: ["An error", "The last 5 rows", "No rows", "All 12 rows"],
          answer: 2,
          explanation: "An offset past the end is not an error; the slice is simply empty. That is how a paging client learns it went past the last page.",
        },
        {
          prompt: "Which is the SQL Server way to return the first 5 rows by price?",
          options: [
            "`SELECT TOP (5) name FROM products ORDER BY price`",
            "`SELECT name FROM products ORDER BY price LIMIT 5`",
            "`SELECT name FROM products WHERE ROWNUM <= 5`",
            "`SELECT FIRST 5 name FROM products`",
          ],
          answer: 0,
          explanation: "SQL Server uses `TOP` (and `OFFSET … FETCH NEXT … ROWS ONLY` for slices); it does not support LIMIT. `ROWNUM` is old Oracle, and it is assigned before ORDER BY runs.",
        },
        {
          prompt: "Three products cost 900, one 700 and one 500. What does `SELECT DISTINCT price FROM products ORDER BY price DESC LIMIT 2` return?",
          options: ["900, 900", "900, 700", "900, 900, 900", "700, 500"],
          answer: 1,
          explanation: "DISTINCT removes duplicates before ORDER BY and LIMIT run, so the candidates are 900, 700, 500 and the first two are 900 and 700.",
        },
      ],
    },
    {
      slug: "pagination",
      file: "04-pagination.md",
      exercises: [
        {
          title: "Page three of the catalogue",
          prompt: `The \`books\` table (two books share a title):

| id | title |
| --- | --- |
| 1 | Dune |
| 2 | Emma |
| 3 | Ulysses |
| 4 | Beloved |
| 5 | Hamlet |
| 6 | Ivanhoe |
| 7 | Middlemarch |
| 8 | Dracula |
| 9 | Persuasion |
| 10 | Rebecca |
| 11 | Emma |

The catalogue lists books by \`title\`, then \`id\`, **four per page**. Return **page 3** as \`id\`, \`title\`. A page past the end is empty.

\`\`\`text
id | title
9 | Persuasion
10 | Rebecca
3 | Ulysses
\`\`\``,
          starter: String.raw`-- Books by title, then id, four a page: return page 3.
`,
          solution: String.raw`SELECT id, title
FROM books
ORDER BY title, id
LIMIT 4 OFFSET 8;
`,
          hints: [
            "The offset of page p with s rows a page is (p - 1) * s.",
            "Page 3 at four a page skips 8 rows.",
            "The `id` tie-breaker keeps the two Emmas on the right pages.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE books (id INT PRIMARY KEY, title VARCHAR(60));
INSERT INTO books VALUES (1, 'Dune'), (2, 'Emma'), (3, 'Ulysses'), (4, 'Beloved'), (5, 'Hamlet'), (6, 'Ivanhoe'), (7, 'Middlemarch'), (8, 'Dracula'), (9, 'Persuasion'), (10, 'Rebecca'), (11, 'Emma');
`,
              expected: "id | title\n9 | Persuasion\n10 | Rebecca\n3 | Ulysses\n",
            },
            {
              stdin: String.raw`CREATE TABLE books (id INT PRIMARY KEY, title VARCHAR(60));
INSERT INTO books VALUES (1, 'Dune'), (2, 'Emma'), (3, 'Ulysses'), (4, 'Beloved'), (5, 'Hamlet'), (6, 'Ivanhoe'), (7, 'Middlemarch'), (8, 'Dracula');
`,
              expected: "id | title\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE books (id INT PRIMARY KEY, title VARCHAR(60));
INSERT INTO books VALUES (12, 'Atlas'), (11, 'Atlas'), (10, 'Atlas'), (9, 'Atlas'), (8, 'Atlas'), (7, 'Atlas'), (6, 'Atlas'), (5, 'Atlas'), (4, 'Atlas'), (3, 'Atlas'), (2, 'Atlas'), (1, 'Atlas');
`,
              expected: "id | title\n9 | Atlas\n10 | Atlas\n11 | Atlas\n12 | Atlas\n",
              hidden: true,
            },
          ],
        },
        {
          title: "The page after the cursor",
          prompt: `A leaderboard is shown with **keyset pagination**: ordered by \`points\` descending, then \`id\` ascending, three rows a page. The last row the player saw had \`points = 80\` and \`id = 4\`. The \`scores\` table:

| id | player | points |
| --- | --- | --- |
| 1 | ana | 95 |
| 2 | bo | 80 |
| 3 | cy | 88 |
| 4 | dee | 80 |
| 5 | ed | 80 |
| 6 | flo | 70 |
| 7 | gus | 60 |
| 8 | hal | 80 |

Return the next page — the first three rows that come **after** (80, 4) in that order — as \`id\`, \`player\`, \`points\`. Filter on the cursor's values with \`WHERE\`; the hidden datasets hold different rows before the cursor, so a fixed \`OFFSET\` will not work.

\`\`\`text
id | player | points
5 | ed | 80
8 | hal | 80
6 | flo | 70
\`\`\``,
          starter: String.raw`-- Leaderboard: points DESC, id ASC, three a page.
-- Return the page after the row (points = 80, id = 4).
`,
          solution: String.raw`SELECT id, player, points
FROM scores
WHERE points < 80
   OR (points = 80 AND id > 4)
ORDER BY points DESC, id
LIMIT 3;
`,
          hints: [
            "\"After\" in this order means fewer points, or the same points and a larger id.",
            "The directions are mixed (points DESC, id ASC), so a row value `(points, id) < (80, 4)` does not express it — write the `OR` out.",
            "`WHERE points < 80 OR (points = 80 AND id > 4)`, then the same ORDER BY and `LIMIT 3`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE scores (id INT PRIMARY KEY, player VARCHAR(20), points INT);
INSERT INTO scores VALUES (1, 'ana', 95), (2, 'bo', 80), (3, 'cy', 88), (4, 'dee', 80), (5, 'ed', 80), (6, 'flo', 70), (7, 'gus', 60), (8, 'hal', 80);
`,
              expected: "id | player | points\n5 | ed | 80\n8 | hal | 80\n6 | flo | 70\n",
            },
            {
              stdin: String.raw`CREATE TABLE scores (id INT PRIMARY KEY, player VARCHAR(20), points INT);
INSERT INTO scores VALUES (1, 'a', 100), (4, 'd', 80), (2, 'b', 90);
`,
              expected: "id | player | points\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE scores (id INT PRIMARY KEY, player VARCHAR(20), points INT);
INSERT INTO scores VALUES (4, 'd', 80), (3, 'c', 80), (9, 'i', 75), (10, 'j', 75), (2, 'b', 80), (11, 'k', 50), (12, 'l', 40), (1, 'a', 75);
`,
              expected: "id | player | points\n1 | a | 75\n9 | i | 75\n10 | j | 75\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the OFFSET for page 5 with 20 rows a page (pages numbered from 1)?",
          options: ["100", "80", "5", "120"],
          answer: 1,
          explanation: "offset = (page − 1) × size = 4 × 20 = 80. Page 1 has offset 0. 100 would be the offset of page 6.",
        },
        {
          prompt: "A list is paginated with `ORDER BY created_at LIMIT 10 OFFSET …`, and several rows share a `created_at`. What can go wrong?",
          options: [
            "Nothing; ties keep insertion order",
            "Tied rows can swap between page queries, so one appears twice and another never",
            "MySQL refuses the query",
            "The pages come back in reverse",
          ],
          answer: 1,
          explanation: "Each page is a separate query, and ties have no defined order, so the boundary can fall differently each time. Adding a unique key (`, id`) fixes it; SQL never promises insertion order for ties.",
        },
        {
          prompt: "Why does `LIMIT 20 OFFSET 500000` get slow?",
          options: [
            "LIMIT is always slow on large tables",
            "The database must produce and discard the 500,000 rows before the page",
            "OFFSET disables every index",
            "It sorts the result twice",
          ],
          answer: 1,
          explanation: "Positions only exist after ordering, so the engine cannot jump to row 500,000; it walks there. Keyset pagination seeks to the boundary with an index instead. Indexes are still usable with OFFSET — they just do not remove the walk.",
        },
        {
          prompt: "Sorted by `created_at DESC, id DESC`, the last row shown has `created_at = '2024-05-02'` and `id = 731`. Which WHERE gives the next keyset page?",
          options: [
            "`WHERE created_at < '2024-05-02' AND id < 731`",
            "`WHERE created_at < '2024-05-02' OR (created_at = '2024-05-02' AND id < 731)`",
            "`WHERE id > 731`",
            "`WHERE created_at <= '2024-05-02'`",
          ],
          answer: 1,
          explanation: "\"After\" means an earlier timestamp, or the same timestamp with a smaller id. The AND version drops older rows that happen to have larger ids; `<=` repeats the rows of the same day already shown; `id > 731` ignores the sort entirely.",
        },
        {
          prompt: "What does keyset pagination give up compared with offset pagination?",
          options: ["Correctness when rows are inserted", "Speed on deep pages", "Jumping straight to an arbitrary page number", "The ability to sort descending"],
          answer: 2,
          explanation: "A keyset page is defined by the row before it, so \"go to page 40\" needs pages 1–39 first. It is the method that stays correct under inserts and fast on deep pages, and it sorts in either direction.",
        },
      ],
    },
    {
      slug: "top-n-queries",
      file: "05-top-n-queries.md",
      exercises: [
        {
          title: "The cheapest items in stock",
          prompt: `The \`products\` table:

| id | name | price | stock |
| --- | --- | --- | --- |
| 1 | pen | 10 | 0 |
| 2 | pencil | 5 | 12 |
| 3 | eraser | 8 | 3 |
| 4 | ruler | 12 | 7 |
| 5 | glue | 8 | 0 |
| 6 | tape | 15 | 4 |

Return the **three cheapest products that are in stock** (\`stock > 0\`) as \`name\`, \`price\`, cheapest first, equal prices by \`id\`.

\`\`\`text
name | price
pencil | 5
eraser | 8
ruler | 12
\`\`\``,
          starter: String.raw`-- The three cheapest in-stock products: name, price,
-- cheapest first, ties by id.
`,
          solution: String.raw`SELECT name, price
FROM products
WHERE stock > 0
ORDER BY price, id
LIMIT 3;
`,
          hints: [
            "Filter first: WHERE runs before ORDER BY and LIMIT.",
            "`WHERE stock > 0 ORDER BY price, id LIMIT 3`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT, stock INT);
INSERT INTO products VALUES (1, 'pen', 10, 0), (2, 'pencil', 5, 12), (3, 'eraser', 8, 3), (4, 'ruler', 12, 7), (5, 'glue', 8, 0), (6, 'tape', 15, 4);
`,
              expected: "name | price\npencil | 5\neraser | 8\nruler | 12\n",
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT, stock INT);
INSERT INTO products VALUES (4, 'dd', 5, 1), (2, 'bb', 5, 1), (3, 'cc', 5, 1), (1, 'aa', 5, 1);
`,
              expected: "name | price\naa | 5\nbb | 5\ncc | 5\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40), price INT, stock INT);
INSERT INTO products VALUES (1, 'pen', 10, 0), (2, 'pad', 3, 0);
`,
              expected: "name | price\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Second highest salary",
          prompt: `The \`employees\` table:

| id | name | salary |
| --- | --- | --- |
| 1 | Asha | 9000 |
| 2 | Ben | 9000 |
| 3 | Chen | 7000 |
| 4 | Dina | 5000 |

Return the **second highest distinct salary** in one column named \`second_highest\`. If there is no second highest salary, return a single row holding \`NULL\`.

\`\`\`text
second_highest
7000
\`\`\``,
          starter: String.raw`-- One row, one column second_highest:
-- the second highest distinct salary, or NULL.
`,
          solution: String.raw`SELECT (
  SELECT DISTINCT salary
  FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS second_highest;
`,
          hints: [
            "Without `DISTINCT`, the two 9000 salaries take the first two places.",
            "`SELECT DISTINCT salary … ORDER BY salary DESC LIMIT 1 OFFSET 1` finds it, but returns no row when there is none.",
            "Wrap that query in `SELECT ( … ) AS second_highest`: a scalar subquery that finds nothing is NULL.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT);
INSERT INTO employees VALUES (1, 'Asha', 9000), (2, 'Ben', 9000), (3, 'Chen', 7000), (4, 'Dina', 5000);
`,
              expected: "second_highest\n7000\n",
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT);
INSERT INTO employees VALUES (1, 'Asha', 9000), (2, 'Ben', 9000);
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
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(40), salary INT);
INSERT INTO employees VALUES (1, 'a', 300), (2, 'b', 100), (3, 'c', 200), (4, 'd', 200);
`,
              expected: "second_highest\n200\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Salaries are 9000, 9000, 7000. What does `SELECT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1` return?",
          options: ["7000", "9000", "NULL", "No rows"],
          answer: 1,
          explanation: "Without DISTINCT the sorted list is 9000, 9000, 7000, and the second row is the second 9000. Add DISTINCT to rank values rather than rows.",
        },
        {
          prompt: "Every employee earns 5000. What does `SELECT (SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1) AS s` return?",
          options: ["No rows", "One row: NULL", "One row: 5000", "An error"],
          answer: 1,
          explanation: "The outer SELECT without FROM always yields one row, and a scalar subquery that finds no row evaluates to NULL. The inner query alone would return no rows.",
        },
        {
          prompt: "Why is `SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET N - 1` not valid MySQL?",
          options: [
            "DISTINCT cannot be used with LIMIT",
            "MySQL's LIMIT and OFFSET take literal numbers or placeholders, not expressions",
            "OFFSET must come before LIMIT",
            "N is a reserved word",
          ],
          answer: 1,
          explanation: "MySQL allows only non-negative integer literals or `?` placeholders there, which is why the LeetCode function answer does `SET N = N - 1` first. DISTINCT with LIMIT is fine.",
        },
        {
          prompt: "Scores are 90, 85, 80, 80. What does `ORDER BY score DESC, id LIMIT 3` do with the two 80s?",
          options: [
            "Returns both, making four rows",
            "Returns exactly one of them, chosen by id",
            "Returns neither",
            "Raises an error about ties",
          ],
          answer: 1,
          explanation: "LIMIT always cuts at exactly three rows; the tie-breaker decides which 80 survives. Including ties needs `WITH TIES` (not in MySQL), a subquery or `DENSE_RANK()`.",
        },
        {
          prompt: "Which needs more than ORDER BY and LIMIT?",
          options: [
            "The five newest orders",
            "The cheapest product in stock",
            "The two best-paid employees in each department",
            "The third highest distinct price",
          ],
          answer: 2,
          explanation: "LIMIT applies once to the whole result, so it cannot keep two rows per department; that is top-N per group, solved with window functions. The others are single top-N or Nth-value queries.",
        },
      ],
    },
    {
      slug: "sorting-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Leaderboard",
          prompt: `The \`players\` table:

| id | name | points | joined_on |
| --- | --- | --- | --- |
| 1 | Asha | 120 | 2024-01-05 |
| 2 | Ben | 150 | 2024-02-01 |
| 3 | Chen | 120 | 2024-01-02 |
| 4 | Dina | 90 | 2024-01-01 |
| 5 | Eli | 150 | 2024-02-01 |
| 6 | Fay | 60 | 2023-12-30 |
| 7 | Gus | 120 | 2024-01-05 |

Return the **top five** players as \`name\`, \`points\`: most points first; on equal points, the player who joined earlier first; on the same day, the lower \`id\` first.

\`\`\`text
name | points
Ben | 150
Eli | 150
Chen | 120
Asha | 120
Gus | 120
\`\`\``,
          starter: String.raw`-- Top five players: name, points.
-- points DESC, then joined_on earliest, then id.
`,
          solution: String.raw`SELECT name, points
FROM players
ORDER BY points DESC, joined_on, id
LIMIT 5;
`,
          hints: [
            "Three keys; only the first is descending.",
            "`ORDER BY points DESC, joined_on, id LIMIT 5`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE players (id INT PRIMARY KEY, name VARCHAR(40), points INT, joined_on DATE);
INSERT INTO players VALUES (1, 'Asha', 120, '2024-01-05'), (2, 'Ben', 150, '2024-02-01'), (3, 'Chen', 120, '2024-01-02'), (4, 'Dina', 90, '2024-01-01'), (5, 'Eli', 150, '2024-02-01'), (6, 'Fay', 60, '2023-12-30'), (7, 'Gus', 120, '2024-01-05');
`,
              expected: "name | points\nBen | 150\nEli | 150\nChen | 120\nAsha | 120\nGus | 120\n",
            },
            {
              stdin: String.raw`CREATE TABLE players (id INT PRIMARY KEY, name VARCHAR(40), points INT, joined_on DATE);
INSERT INTO players VALUES (9, 'Ivo', 10, '2024-03-01'), (3, 'Cal', 10, '2024-03-01'), (5, 'Eve', 10, '2024-02-28');
`,
              expected: "name | points\nEve | 10\nCal | 10\nIvo | 10\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Catalogue page, unpriced items last",
          prompt: `The \`items\` table; \`price\` is NULL for items not priced yet:

| id | name | price |
| --- | --- | --- |
| 1 | lamp | NULL |
| 2 | desk | 4500 |
| 3 | chair | 1200 |
| 4 | mat | 300 |
| 5 | shelf | NULL |
| 6 | bin | 300 |
| 7 | rug | 2500 |

The catalogue sorts by \`price\` ascending with **NULL prices at the end**, then by \`id\`, **three items a page**. Return **page 2** as \`id\`, \`name\`, \`price\`.

\`\`\`text
id | name | price
7 | rug | 2500
2 | desk | 4500
1 | lamp | NULL
\`\`\``,
          starter: String.raw`-- Price ascending, NULL prices last, then id; three a page.
-- Return page 2: id, name, price.
`,
          solution: String.raw`SELECT id, name, price
FROM items
ORDER BY price IS NULL, price, id
LIMIT 3 OFFSET 3;
`,
          hints: [
            "MySQL sorts NULL first ascending — sort on `price IS NULL` before `price`.",
            "Page 2 at three a page skips three rows.",
            "`ORDER BY price IS NULL, price, id LIMIT 3 OFFSET 3`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE items (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO items VALUES (1, 'lamp', NULL), (2, 'desk', 4500), (3, 'chair', 1200), (4, 'mat', 300), (5, 'shelf', NULL), (6, 'bin', 300), (7, 'rug', 2500);
`,
              expected: "id | name | price\n7 | rug | 2500\n2 | desk | 4500\n1 | lamp | NULL\n",
            },
            {
              stdin: String.raw`CREATE TABLE items (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO items VALUES (1, 'a', NULL), (2, 'b', NULL), (3, 'c', 10), (4, 'd', NULL);
`,
              expected: "id | name | price\n4 | d | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE items (id INT PRIMARY KEY, name VARCHAR(40), price INT);
INSERT INTO items VALUES (1, 'a', 5), (2, 'b', NULL);
`,
              expected: "id | name | price\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Third highest distinct score",
          prompt: `The \`scores\` table:

| id | player | score |
| --- | --- | --- |
| 1 | ana | 88 |
| 2 | bo | 95 |
| 3 | cy | 88 |
| 4 | dee | 70 |
| 5 | ed | 95 |
| 6 | flo | 60 |

Return the **third highest distinct score** in one column named \`third_highest\` — a single row holding \`NULL\` when there are fewer than three distinct scores.

\`\`\`text
third_highest
70
\`\`\``,
          starter: String.raw`-- One row, one column third_highest:
-- the third highest distinct score, or NULL.
`,
          solution: String.raw`SELECT (
  SELECT DISTINCT score
  FROM scores
  ORDER BY score DESC
  LIMIT 1 OFFSET 2
) AS third_highest;
`,
          hints: [
            "Distinct scores here are 95, 88, 70, 60.",
            "Skip two, keep one — and wrap the query in `SELECT ( … ) AS third_highest` for the NULL case.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE scores (id INT PRIMARY KEY, player VARCHAR(20), score INT);
INSERT INTO scores VALUES (1, 'ana', 88), (2, 'bo', 95), (3, 'cy', 88), (4, 'dee', 70), (5, 'ed', 95), (6, 'flo', 60);
`,
              expected: "third_highest\n70\n",
            },
            {
              stdin: String.raw`CREATE TABLE scores (id INT PRIMARY KEY, player VARCHAR(20), score INT);
INSERT INTO scores VALUES (1, 'a', 50), (2, 'b', 50), (3, 'c', 40);
`,
              expected: "third_highest\nNULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE scores (id INT PRIMARY KEY, player VARCHAR(20), score INT);
INSERT INTO scores VALUES (1, 'a', 10), (2, 'b', 20), (3, 'c', 30);
`,
              expected: "third_highest\n10\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which clause runs last in the logical order of a query?",
          options: ["WHERE", "SELECT", "ORDER BY", "LIMIT"],
          answer: 3,
          explanation: "FROM → WHERE → SELECT → ORDER BY → LIMIT. The slice is taken after the rows are filtered, computed and sorted, which is why LIMIT needs ORDER BY to be meaningful.",
        },
        {
          prompt: "`ORDER BY dept DESC, name` sorts…",
          options: ["Both keys descending", "dept descending, name ascending", "dept ascending, name descending", "Only by dept"],
          answer: 1,
          explanation: "Each key has its own direction, and ascending is the default. DESC applies only to `dept`.",
        },
        {
          prompt: "In PostgreSQL, `ORDER BY bonus` (ascending) puts NULL bonuses…",
          options: ["First", "Last", "Nowhere; they are removed", "Randomly"],
          answer: 1,
          explanation: "PostgreSQL and Oracle treat NULL as larger than every value, so NULLs are last ascending — the opposite of MySQL. PostgreSQL also accepts `NULLS FIRST`/`NULLS LAST`; MySQL does not.",
        },
        {
          prompt: "What does this return in MySQL?\n\n```sql\nSELECT name FROM t ORDER BY score IS NULL, score DESC;\n```",
          options: [
            "NULL scores first, then highest score first",
            "Highest score first, NULL scores last",
            "Lowest score first, NULL scores last",
            "A syntax error",
          ],
          answer: 1,
          explanation: "`score IS NULL` is 0 for values and 1 for NULLs, so values come first; within them `score DESC` puts the highest first. (A plain `score DESC` would also put NULLs last in MySQL — the prefix makes it explicit and portable.)",
        },
        {
          prompt: "`SELECT DISTINCT name FROM employees ORDER BY hire_date` is refused by MySQL. Why?",
          options: [
            "DISTINCT cannot be combined with ORDER BY",
            "With DISTINCT, the sort key must be in the select list, since one name may have several hire dates",
            "hire_date must be indexed",
            "ORDER BY needs ASC or DESC after DISTINCT",
          ],
          answer: 1,
          explanation: "After duplicates are removed, a row may stand for several hire dates and the database cannot choose one to sort by. Without DISTINCT, sorting by an unselected column is fine.",
        },
        {
          prompt: "What does MySQL's `LIMIT 20, 10` return?",
          options: ["Rows 21–30", "Rows 11–30", "Rows 21–40", "Rows 20–30"],
          answer: 0,
          explanation: "Offset first, then count: skip 20, take 10 — rows 21 to 30, the same as `LIMIT 10 OFFSET 20`.",
        },
        {
          prompt: "Which is the standard SQL way (also PostgreSQL and Oracle 12c+) to take the first 10 rows?",
          options: ["`TOP 10`", "`FETCH FIRST 10 ROWS ONLY`", "`WHERE ROWNUM <= 10`", "`LIMIT 10` is the standard"],
          answer: 1,
          explanation: "`OFFSET … ROWS FETCH FIRST|NEXT … ROWS ONLY` is the SQL standard. `LIMIT` is a MySQL/PostgreSQL/SQLite extension, `TOP` is SQL Server, `ROWNUM` is old Oracle.",
        },
        {
          prompt: "What is the offset of page 4 at 25 rows a page?",
          options: ["100", "75", "4", "96"],
          answer: 1,
          explanation: "(4 − 1) × 25 = 75. Page 1 starts at offset 0.",
        },
        {
          prompt: "A feed uses offset pagination and new posts arrive constantly. What does a reader moving from page 1 to page 2 see?",
          options: [
            "Exactly the next ten posts",
            "Some posts from page 1 again, because new posts pushed every row down",
            "An error",
            "Only the new posts",
          ],
          answer: 1,
          explanation: "Each insert at the top shifts every offset by one, so the end of page 1 becomes the start of page 2. Keyset pagination starts after the last row actually seen and does not shift.",
        },
        {
          prompt: "Why must the ORDER BY used for keyset pagination end with a unique column?",
          options: [
            "So the WHERE condition identifies one exact boundary and no tied rows are skipped or repeated",
            "Because MySQL requires a primary key in ORDER BY",
            "To make the query use LIMIT",
            "It does not need to",
          ],
          answer: 0,
          explanation: "The cursor is the last row's sort values. If several rows share them, `> cursor` skips the unseen tied rows and `>= cursor` repeats the seen ones. A unique last key makes the boundary exact.",
        },
        {
          prompt: "Salaries are 8000, 6000, 6000, 4000. What does `SELECT DISTINCT salary FROM e ORDER BY salary DESC LIMIT 1 OFFSET 2` return?",
          options: ["6000", "4000", "NULL", "No rows"],
          answer: 1,
          explanation: "The distinct values are 8000, 6000, 4000; skipping two leaves 4000. Without DISTINCT the third row would be 6000.",
        },
        {
          prompt: "Which query returns a single NULL row when there is no second highest salary?",
          options: [
            "`SELECT DISTINCT salary FROM e ORDER BY salary DESC LIMIT 1 OFFSET 1`",
            "`SELECT (SELECT DISTINCT salary FROM e ORDER BY salary DESC LIMIT 1 OFFSET 1) AS s`",
            "`SELECT salary FROM e ORDER BY salary DESC LIMIT 2`",
            "`SELECT DISTINCT salary FROM e WHERE salary IS NULL`",
          ],
          answer: 1,
          explanation: "The outer SELECT always yields one row, and the empty scalar subquery becomes NULL. The bare query returns no rows; the others answer different questions.",
        },
      ],
    },
  ],
});
