import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "functions",
  title: "Functions",
  blurb: "String functions to join, clean, cut and pad text; ROUND, CEIL, FLOOR, DIV and MOD; date types, date parts and DATE_FORMAT; date arithmetic with INTERVAL, DATEDIFF and TIMESTAMPDIFF; and IF, IFNULL, NULLIF, GREATEST and FIELD.",
  icon: "function",
  overview: `Stored data is rarely in the shape a report wants. Names arrive with stray spaces and in the wrong case, emails need splitting into a user and a domain, prices need tax and two decimals, dates need to become month keys and due dates, and a status needs a label and a sort order that is not alphabetical. MySQL's built-in functions do that reshaping inside the query, row by row, without changing a stored value. This module teaches the functions that appear in nearly every real report and interview answer, the rules they share — positions start at 1, NULL in means NULL out — and where PostgreSQL and SQL Server spell them differently.

String functions covers \`CONCAT\` and \`CONCAT_WS\`, case and \`CHAR_LENGTH\`, \`TRIM\`, \`SUBSTRING\`, \`LEFT\`/\`RIGHT\`, \`LOCATE\`, \`REPLACE\`, \`SUBSTRING_INDEX\` and \`LPAD\`. Numeric functions covers MySQL's decimal \`/\`, \`DIV\` and \`MOD\`, \`ROUND\`, \`CEIL\`, \`FLOOR\` and \`TRUNCATE\`, \`ABS\` and the money types. Dates and times covers the types, \`YEAR\`/\`MONTH\`/\`DAYNAME\`, the two weekday numberings, \`DATE_FORMAT\` and filtering a period with a half-open range. Date arithmetic covers \`DATE_ADD\` with \`INTERVAL\`, month-end clamping, \`DATEDIFF\`, \`TIMESTAMPDIFF\` and \`LAST_DAY\`. Conditional functions covers \`IF\`, \`IFNULL\`, \`NULLIF\` for safe division, \`GREATEST\`/\`LEAST\` and \`FIELD\` for custom sort orders.

The exercises are single-table queries on small, untidy datasets: display names and initials, email parts and masks, prices with tax, boxes and leftovers, month keys and weekend orders, loan due dates and late days, subscription renewals and tenure, a stock board in a custom order and click-through rates that survive zero views. The checkpoint adds a contact-card formatter, an invoice report with late fees and a carrier scorecard.`,
  lessons: [
    {
      slug: "string-functions",
      file: "01-string-functions.md",
      exercises: [
        {
          title: "Display names and initials",
          prompt: `The \`people\` table was filled in by hand, so names carry stray spaces and some are missing.

| id | first_name | last_name |
| --- | --- | --- |
| 1 | \`'  Ada '\` | \`'Lovelace'\` |
| 2 | \`'grace'\` | \`' Hopper '\` |
| 3 | \`'Alan'\` | \`'Turing'\` |

Return \`id\`, \`display\` — the trimmed last name, a comma and a space, then the trimmed first name (\`Lovelace, Ada\`), with a missing part simply left out and no separator for it — and \`initials\`, the first letter of the trimmed first and last names in capitals (\`AL\`), again skipping a missing part. Order by \`id\`.

\`\`\`text
id | display | initials
1 | Lovelace, Ada | AL
2 | Hopper, grace | GH
3 | Turing, Alan | AT
\`\`\``,
          starter: String.raw`-- id, display ("Last, First", trimmed, NULL parts skipped),
-- initials (first letters, upper case, NULL parts skipped), ordered by id.
SELECT id
FROM people
ORDER BY id;
`,
          solution: String.raw`SELECT id,
       CONCAT_WS(', ', TRIM(last_name), TRIM(first_name))                    AS display,
       UPPER(CONCAT_WS('', LEFT(TRIM(first_name), 1), LEFT(TRIM(last_name), 1))) AS initials
FROM people
ORDER BY id;
`,
          hints: [
            "`TRIM` removes the spaces at both ends; `LEFT(s, 1)` takes the first letter.",
            "`CONCAT` returns NULL when any part is NULL — `CONCAT_WS(separator, …)` skips NULL parts instead.",
            "For the initials, `CONCAT_WS('', …)` joins with an empty separator, and `UPPER` around it fixes the case.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE people (id INT PRIMARY KEY, first_name VARCHAR(40), last_name VARCHAR(40));
INSERT INTO people VALUES (1, '  Ada ', 'Lovelace'), (2, 'grace', ' Hopper '), (3, 'Alan', 'Turing');`,
              expected: "id | display | initials\n1 | Lovelace, Ada | AL\n2 | Hopper, grace | GH\n3 | Turing, Alan | AT\n",
            },
            {
              stdin: String.raw`CREATE TABLE people (id INT PRIMARY KEY, first_name VARCHAR(40), last_name VARCHAR(40));
INSERT INTO people VALUES (4, ' barbara  ', 'liskov'), (2, NULL, 'Hopper'), (7, 'Edsger', NULL);`,
              expected: "id | display | initials\n2 | Hopper | H\n4 | liskov, barbara | BL\n7 | Edsger | E\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE people (id INT PRIMARY KEY, first_name VARCHAR(40), last_name VARCHAR(40));`,
              expected: "id | display | initials\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Email parts and a masked address",
          prompt: `Split each address in \`users\` into its parts. Addresses may have spaces around them and capital letters; normalise each with \`LOWER(TRIM(email))\` first.

| id | email |
| --- | --- |
| 1 | \`' Ada@Example.com'\` |
| 2 | \`'grace@navy.mil'\` |
| 3 | \`'ALAN@example.com '\` |

Return \`id\`, \`username\` (the part before \`@\`), \`domain\` (the part after it) and \`masked\` — the username's first letter, then \`***@\`, then the domain (\`a***@example.com\`). Order by \`domain\`, then \`username\`.

\`\`\`text
id | username | domain | masked
1 | ada | example.com | a***@example.com
3 | alan | example.com | a***@example.com
2 | grace | navy.mil | g***@navy.mil
\`\`\``,
          starter: String.raw`-- id, username, domain, masked — from LOWER(TRIM(email)).
-- Order by domain, then username.
SELECT id, email
FROM users;
`,
          solution: String.raw`SELECT id,
       SUBSTRING_INDEX(LOWER(TRIM(email)), '@', 1)  AS username,
       SUBSTRING_INDEX(LOWER(TRIM(email)), '@', -1) AS domain,
       CONCAT(LEFT(LOWER(TRIM(email)), 1), '***@', SUBSTRING_INDEX(LOWER(TRIM(email)), '@', -1)) AS masked
FROM users
ORDER BY domain, username;
`,
          hints: [
            "`SUBSTRING_INDEX(s, '@', 1)` is everything before the first `@`; with `-1` it is everything after the last one.",
            "A column alias cannot be used by another expression in the same SELECT, so repeat the expression — but `ORDER BY` may use the aliases.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(80));
INSERT INTO users VALUES (1, ' Ada@Example.com'), (2, 'grace@navy.mil'), (3, 'ALAN@example.com ');`,
              expected: "id | username | domain | masked\n1 | ada | example.com | a***@example.com\n3 | alan | example.com | a***@example.com\n2 | grace | navy.mil | g***@navy.mil\n",
            },
            {
              stdin: String.raw`CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(80));
INSERT INTO users VALUES (10, 'bob@mail.uni.edu'), (11, 'Zed@A.IO'), (12, '  x@a.io');`,
              expected: "id | username | domain | masked\n12 | x | a.io | x***@a.io\n11 | zed | a.io | z***@a.io\n10 | bob | mail.uni.edu | b***@mail.uni.edu\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `CONCAT('Ada', NULL, 'Lovelace')` return in MySQL?",
          options: ["`'AdaLovelace'`", "`'Ada Lovelace'`", "`NULL`", "An error"],
          answer: 2,
          explanation: "`CONCAT` returns NULL when any argument is NULL. `CONCAT_WS` is the function that skips NULL arguments; nothing here adds a space, and nothing raises an error.",
        },
        {
          prompt: "What does `SUBSTRING_INDEX('www.mysql.com', '.', -2)` return?",
          options: ["`'www.mysql'`", "`'mysql.com'`", "`'com'`", "`'mysql'`"],
          answer: 1,
          explanation: "A negative count takes everything after the second delimiter counted from the right: `mysql.com`. A positive 2 would give `www.mysql`; `-1` would give `com`.",
        },
        {
          prompt: "A UTF-8 column holds `'café'`. What are `LENGTH` and `CHAR_LENGTH` in MySQL?",
          options: ["4 and 4", "5 and 4", "4 and 5", "5 and 5"],
          answer: 1,
          explanation: "`LENGTH` counts bytes and `é` takes two bytes in UTF-8, so 5; `CHAR_LENGTH` counts characters, so 4. For ASCII-only text the two agree.",
        },
        {
          prompt: "What does `LOCATE('z', 'hello')` return?",
          options: ["`-1`", "`0`", "`NULL`", "`6`"],
          answer: 1,
          explanation: "Positions start at 1, so 0 is never a real position and is what `LOCATE` (and `INSTR`) return for \"not found\". `-1` is what many programming languages use, not SQL.",
        },
        {
          prompt: "In MySQL with default settings, what is `'a' || 'b'`?",
          options: ["`'ab'`", "`0` — `||` is logical OR", "`'a b'`", "A syntax error"],
          answer: 1,
          explanation: "In MySQL `||` is OR unless the `PIPES_AS_CONCAT` SQL mode is on, and two non-numeric strings are both false, so the answer is 0. PostgreSQL and standard SQL use `||` for concatenation; in MySQL write `CONCAT`.",
        },
      ],
    },
    {
      slug: "numeric-functions",
      file: "02-numeric-functions.md",
      exercises: [
        {
          title: "Prices with tax",
          prompt: `Each product has a price and a tax rate in percent.

| name | price | tax_rate |
| --- | --- | --- |
| Desk | 250.00 | 18 |
| Lamp | 39.50 | 12 |
| Notebook | 4.20 | 5 |
| Chair | 120.00 | 18 |

Return \`name\`, \`price\`, \`tax\` — the tax amount rounded to 2 decimals — and \`total\` — price plus tax, computed from the unrounded tax and rounded to 2 decimals. Order by \`total\` descending, then \`name\`.

\`\`\`text
name | price | tax | total
Desk | 250 | 45 | 295
Chair | 120 | 21.6 | 141.6
Lamp | 39.5 | 4.74 | 44.24
Notebook | 4.2 | 0.21 | 4.41
\`\`\`

(Numbers print without trailing zeros here; MySQL itself would show \`45.00\`.)`,
          starter: String.raw`-- name, price, tax (ROUND to 2), total (ROUND to 2),
-- ordered by total descending, then name.
SELECT name, price
FROM products;
`,
          solution: String.raw`SELECT name,
       price,
       ROUND(price * tax_rate / 100, 2)         AS tax,
       ROUND(price + price * tax_rate / 100, 2) AS total
FROM products
ORDER BY total DESC, name;
`,
          hints: [
            "The tax is `price * tax_rate / 100`; MySQL's `/` keeps the decimals.",
            "Round once, at the end of each expression — compute the total from the unrounded tax.",
            "Break ties on total with a second ORDER BY key, `name`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE products (name VARCHAR(40), price DECIMAL(10,2), tax_rate INT);
INSERT INTO products VALUES ('Desk', 250.00, 18), ('Lamp', 39.50, 12), ('Notebook', 4.20, 5), ('Chair', 120.00, 18);`,
              expected: "name | price | tax | total\nDesk | 250 | 45 | 295\nChair | 120 | 21.6 | 141.6\nLamp | 39.5 | 4.74 | 44.24\nNotebook | 4.2 | 0.21 | 4.41\n",
            },
            {
              stdin: String.raw`CREATE TABLE products (name VARCHAR(40), price DECIMAL(10,2), tax_rate INT);
INSERT INTO products VALUES ('Pen', 10.00, 0), ('Mug', 8.99, 12), ('Cap', 10.00, 0);`,
              expected: "name | price | tax | total\nMug | 8.99 | 1.08 | 10.07\nCap | 10 | 0 | 10\nPen | 10 | 0 | 10\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Boxes and leftovers",
          prompt: `A warehouse packs \`units\` items into boxes of \`per_box\`.

| id | units | per_box |
| --- | --- | --- |
| 1 | 23 | 10 |
| 2 | 40 | 8 |
| 3 | 5 | 12 |

Return \`id\`, \`full_boxes\` (how many boxes are filled completely), \`loose\` (items left over) and \`boxes_needed\` (boxes to ship everything, the last one possibly part-full). Use \`DIV\`, \`MOD\` and \`CEIL\`. Order by \`id\`. A \`per_box\` of 0 is a data error — MySQL returns NULL for a division or remainder by zero, and so should your query, without a special case.

\`\`\`text
id | full_boxes | loose | boxes_needed
1 | 2 | 3 | 3
2 | 5 | 0 | 5
3 | 0 | 5 | 1
\`\`\``,
          starter: String.raw`-- id, full_boxes (DIV), loose (MOD), boxes_needed (CEIL), ordered by id.
SELECT id, units, per_box
FROM shipments
ORDER BY id;
`,
          solution: String.raw`SELECT id,
       units DIV per_box       AS full_boxes,
       MOD(units, per_box)     AS loose,
       CEIL(units / per_box)   AS boxes_needed
FROM shipments
ORDER BY id;
`,
          hints: [
            "`a DIV b` is the whole number of times `b` fits in `a`; `MOD(a, b)` is what is left.",
            "`units / per_box` is a decimal in MySQL, and `CEIL` rounds it up to the next whole box.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE shipments (id INT PRIMARY KEY, units INT, per_box INT);
INSERT INTO shipments VALUES (1, 23, 10), (2, 40, 8), (3, 5, 12);`,
              expected: "id | full_boxes | loose | boxes_needed\n1 | 2 | 3 | 3\n2 | 5 | 0 | 5\n3 | 0 | 5 | 1\n",
            },
            {
              stdin: String.raw`CREATE TABLE shipments (id INT PRIMARY KEY, units INT, per_box INT);
INSERT INTO shipments VALUES (3, 100, 1), (1, 0, 6), (2, 7, 0);`,
              expected: "id | full_boxes | loose | boxes_needed\n1 | 0 | 0 | 0\n2 | NULL | NULL | NULL\n3 | 100 | 0 | 100\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT 7 / 2;` return in MySQL, and in PostgreSQL?",
          options: ["3.5 in both", "3 in both", "3.5 in MySQL, 3 in PostgreSQL", "3 in MySQL, 3.5 in PostgreSQL"],
          answer: 2,
          explanation: "MySQL's `/` is always decimal division (it shows `3.5000`). PostgreSQL, SQL Server and SQLite divide two integers as integers and drop the fraction. Multiply by `1.0` first for a decimal answer there.",
        },
        {
          prompt: "What are `FLOOR(-4.2)` and `TRUNCATE(-4.2, 0)`?",
          options: ["-4 and -4", "-5 and -4", "-5 and -5", "-4 and -5"],
          answer: 1,
          explanation: "`FLOOR` always goes down, which for a negative number is away from zero: -5. `TRUNCATE` cuts the digits off, which moves towards zero: -4. For positive numbers the two agree.",
        },
        {
          prompt: "47 search results are shown 10 to a page. Which expression gives the number of pages?",
          options: ["`47 DIV 10`", "`ROUND(47 / 10)`", "`CEIL(47 / 10)`", "`MOD(47, 10)`"],
          answer: 2,
          explanation: "Five pages are needed (the fifth holds 7). `CEIL` rounds 4.7 up to 5. `DIV` gives 4 full pages, `ROUND` happens to give 5 here but gives 4 for 41 results, and `MOD` is the 7 on the last page.",
        },
        {
          prompt: "Why is money stored as `DECIMAL(10, 2)` rather than `DOUBLE`?",
          options: [
            "`DOUBLE` cannot hold numbers above a million",
            "`DECIMAL` stores the digits exactly; `DOUBLE` is a binary approximation that cannot store values like 0.1 exactly",
            "`DECIMAL` is faster for arithmetic",
            "`DOUBLE` has no negative numbers",
          ],
          answer: 1,
          explanation: "Binary floating point stores most decimal fractions approximately, so sums drift by tiny amounts and equality tests fail. `DECIMAL` is exact. `DOUBLE` has a huge range and negatives, and is usually *faster*, which is why it suits measurements.",
        },
      ],
    },
    {
      slug: "dates-and-times",
      file: "03-dates-and-times.md",
      exercises: [
        {
          title: "Month keys and readable dates",
          prompt: `Lay out each order's date three ways.

| id | order_date |
| --- | --- |
| 1 | 2024-03-05 |
| 2 | 2024-01-31 |
| 3 | 2023-12-25 |
| 4 | 2024-03-05 |

Return \`id\`, \`month_key\` (\`2024-03\`), \`pretty\` — the short weekday, two-digit day, short month and year (\`Tue 05 Mar 2024\`) — and \`quarter\`. Order by \`order_date\`, then \`id\`.

\`\`\`text
id | month_key | pretty | quarter
3 | 2023-12 | Mon 25 Dec 2023 | 4
2 | 2024-01 | Wed 31 Jan 2024 | 1
1 | 2024-03 | Tue 05 Mar 2024 | 1
4 | 2024-03 | Tue 05 Mar 2024 | 1
\`\`\``,
          starter: String.raw`-- id, month_key, pretty, quarter — DATE_FORMAT and QUARTER.
-- Order by order_date, then id.
SELECT id, order_date
FROM orders;
`,
          solution: String.raw`SELECT id,
       DATE_FORMAT(order_date, '%Y-%m')          AS month_key,
       DATE_FORMAT(order_date, '%a %d %b %Y')    AS pretty,
       QUARTER(order_date)                       AS quarter
FROM orders
ORDER BY order_date, id;
`,
          hints: [
            "`%Y` is the four-digit year and `%m` the two-digit month.",
            "`%a` is the short weekday name, `%d` the two-digit day and `%b` the short month name.",
            "Sort by the date column itself, not by the formatted text.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, order_date DATE);
INSERT INTO orders VALUES (1, '2024-03-05'), (2, '2024-01-31'), (3, '2023-12-25'), (4, '2024-03-05');`,
              expected: "id | month_key | pretty | quarter\n3 | 2023-12 | Mon 25 Dec 2023 | 4\n2 | 2024-01 | Wed 31 Jan 2024 | 1\n1 | 2024-03 | Tue 05 Mar 2024 | 1\n4 | 2024-03 | Tue 05 Mar 2024 | 1\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, order_date DATE);
INSERT INTO orders VALUES (7, '2025-07-04'), (8, '2024-02-29'), (9, '2024-10-01');`,
              expected: "id | month_key | pretty | quarter\n8 | 2024-02 | Thu 29 Feb 2024 | 1\n9 | 2024-10 | Tue 01 Oct 2024 | 4\n7 | 2025-07 | Fri 04 Jul 2025 | 3\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Weekend orders in March",
          prompt: `\`placed_at\` is a \`DATETIME\`. Find the orders placed in **March 2024** on a **Saturday or Sunday**.

| id | placed_at | amount |
| --- | --- | --- |
| 1 | 2024-03-02 10:15:00 | 40 |
| 2 | 2024-03-04 09:00:00 | 25 |
| 3 | 2024-03-31 18:30:00 | 60 |
| 4 | 2024-02-25 12:00:00 | 15 |
| 5 | 2024-04-06 11:00:00 | 30 |
| 6 | 2024-03-16 08:00:00 | 20 |

Return \`id\`, \`placed_at\` and \`day_name\` (\`Saturday\`). Select the month with a half-open range on \`placed_at\` — an order late on 31 March must be included. Order by \`placed_at\`, then \`id\`.

\`\`\`text
id | placed_at | day_name
1 | 2024-03-02 10:15:00 | Saturday
6 | 2024-03-16 08:00:00 | Saturday
3 | 2024-03-31 18:30:00 | Sunday
\`\`\``,
          starter: String.raw`-- March 2024 (>= first day, < first day of April), Saturday or Sunday.
-- id, placed_at, day_name; order by placed_at, then id.
SELECT id, placed_at
FROM orders
ORDER BY placed_at, id;
`,
          solution: String.raw`SELECT id, placed_at, DAYNAME(placed_at) AS day_name
FROM orders
WHERE placed_at >= '2024-03-01' AND placed_at < '2024-04-01'
  AND DAYOFWEEK(placed_at) IN (1, 7)
ORDER BY placed_at, id;
`,
          hints: [
            "`placed_at >= '2024-03-01' AND placed_at < '2024-04-01'` covers every moment of March, including the evening of the 31st.",
            "`DAYOFWEEK` is 1 for Sunday and 7 for Saturday.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, placed_at DATETIME, amount INT);
INSERT INTO orders VALUES (1, '2024-03-02 10:15:00', 40), (2, '2024-03-04 09:00:00', 25), (3, '2024-03-31 18:30:00', 60),
  (4, '2024-02-25 12:00:00', 15), (5, '2024-04-06 11:00:00', 30), (6, '2024-03-16 08:00:00', 20);`,
              expected: "id | placed_at | day_name\n1 | 2024-03-02 10:15:00 | Saturday\n6 | 2024-03-16 08:00:00 | Saturday\n3 | 2024-03-31 18:30:00 | Sunday\n",
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, placed_at DATETIME, amount INT);
INSERT INTO orders VALUES (1, '2024-03-31 23:59:59', 10), (2, '2024-03-01 00:00:00', 10), (3, '2024-03-09 00:00:00', 10),
  (4, '2024-04-01 00:00:00', 10), (5, '2024-03-09 00:00:00', 10), (6, '2023-03-04 12:00:00', 10);`,
              expected: "id | placed_at | day_name\n3 | 2024-03-09 00:00:00 | Saturday\n5 | 2024-03-09 00:00:00 | Saturday\n1 | 2024-03-31 23:59:59 | Sunday\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, placed_at DATETIME, amount INT);
INSERT INTO orders VALUES (1, '2024-03-04 10:00:00', 10), (2, '2024-03-06 10:00:00', 10);`,
              expected: "id | placed_at | day_name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which condition selects every row of March 2024 from a `DATETIME` column `created_at`, and can use an index on it?",
          options: [
            "`created_at BETWEEN '2024-03-01' AND '2024-03-31'`",
            "`created_at >= '2024-03-01' AND created_at < '2024-04-01'`",
            "`MONTH(created_at) = 3`",
            "`DATE_FORMAT(created_at, '%Y-%m') = '2024-03'`",
          ],
          answer: 1,
          explanation: "The half-open range includes all of 31 March and compares the bare column, so an index applies. `BETWEEN` stops at midnight starting the 31st; `MONTH(…) = 3` matches March of every year; the `DATE_FORMAT` version is correct but wraps the column in a function, which rules out the index.",
        },
        {
          prompt: "What does `DAYOFWEEK('2024-03-03')` return? (3 March 2024 was a Sunday.)",
          options: ["0", "1", "6", "7"],
          answer: 1,
          explanation: "`DAYOFWEEK` numbers Sunday as 1 through Saturday as 7. `WEEKDAY` uses a different numbering — Monday 0 through Sunday 6 — and would return 6.",
        },
        {
          prompt: "What does `DATE_FORMAT('2024-03-05 14:07:00', '%Y-%m-%d %H:%m')` return?",
          options: ["`'2024-03-05 14:07'`", "`'2024-03-05 14:03'`", "`'2024-03-05 02:07'`", "An error"],
          answer: 1,
          explanation: "`%m` is the month in `DATE_FORMAT`, so the time shows `14:03`. Minutes are `%i`. A classic slip; the function does not raise an error for it.",
        },
        {
          prompt: "Which type converts its value to UTC on storage and back to the session's time zone on reading?",
          options: ["`DATE`", "`DATETIME`", "`TIMESTAMP`", "`TIME`"],
          answer: 2,
          explanation: "`TIMESTAMP` stores a moment in UTC and converts using the connection's time zone; it also only reaches 2038. `DATETIME` stores exactly what was written, and `DATE`/`TIME` hold a day or a time of day.",
        },
      ],
    },
    {
      slug: "date-arithmetic",
      file: "04-date-arithmetic.md",
      exercises: [
        {
          title: "Library loans: due dates and days late",
          prompt: `Books are lent for 14 days. \`returned_on\` is NULL while a book is still out.

| id | borrowed_on | returned_on |
| --- | --- | --- |
| 1 | 2024-03-01 | 2024-03-10 |
| 2 | 2024-03-01 | 2024-03-20 |
| 3 | 2024-02-20 | NULL |
| 4 | 2024-02-25 | 2024-03-15 |

Return \`id\`, \`due_on\` (borrowed date plus 14 days) and \`days_late\` — days between the due date and the return, never below 0 (an early return is 0 days late), and NULL for a book not yet returned. Order by \`id\`.

\`\`\`text
id | due_on | days_late
1 | 2024-03-15 | 0
2 | 2024-03-15 | 5
3 | 2024-03-05 | NULL
4 | 2024-03-10 | 5
\`\`\``,
          starter: String.raw`-- id, due_on (DATE_ADD … INTERVAL 14 DAY), days_late (DATEDIFF, floored at 0),
-- ordered by id.
SELECT id, borrowed_on, returned_on
FROM loans
ORDER BY id;
`,
          solution: String.raw`SELECT id,
       DATE_ADD(borrowed_on, INTERVAL 14 DAY)                                AS due_on,
       GREATEST(DATEDIFF(returned_on, DATE_ADD(borrowed_on, INTERVAL 14 DAY)), 0) AS days_late
FROM loans
ORDER BY id;
`,
          hints: [
            "`DATE_ADD(borrowed_on, INTERVAL 14 DAY)` is the due date; 2024 is a leap year, which `DATE_ADD` already knows.",
            "`DATEDIFF(later, earlier)` — the return date goes first. An early return gives a negative number.",
            "`GREATEST(x, 0)` floors a value at zero, and returns NULL when `x` is NULL — exactly what an unreturned book needs.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE loans (id INT PRIMARY KEY, borrowed_on DATE, returned_on DATE);
INSERT INTO loans VALUES (1, '2024-03-01', '2024-03-10'), (2, '2024-03-01', '2024-03-20'), (3, '2024-02-20', NULL), (4, '2024-02-25', '2024-03-15');`,
              expected: "id | due_on | days_late\n1 | 2024-03-15 | 0\n2 | 2024-03-15 | 5\n3 | 2024-03-05 | NULL\n4 | 2024-03-10 | 5\n",
            },
            {
              stdin: String.raw`CREATE TABLE loans (id INT PRIMARY KEY, borrowed_on DATE, returned_on DATE);
INSERT INTO loans VALUES (5, '2023-12-25', '2024-01-10'), (6, '2024-06-01', '2024-06-15'), (7, '2023-02-20', '2023-03-07');`,
              expected: "id | due_on | days_late\n5 | 2024-01-08 | 2\n6 | 2024-06-15 | 0\n7 | 2023-03-06 | 1\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Subscriptions: renewal, tenure and month end",
          prompt: `Each subscription has a start and an end date.

| id | started_on | ended_on |
| --- | --- | --- |
| 1 | 2024-01-31 | 2024-07-15 |
| 2 | 2023-11-15 | 2024-02-14 |
| 3 | 2024-02-10 | 2024-02-29 |

Return \`id\`, \`renewal\` (the start date plus one month, MySQL-style — a 31st clamps to the end of a shorter month), \`months_active\` (whole months from start to end) and \`month_end\` (the last day of the starting month). Order by \`months_active\` descending, then \`id\`.

\`\`\`text
id | renewal | months_active | month_end
1 | 2024-02-29 | 5 | 2024-01-31
2 | 2023-12-15 | 2 | 2023-11-30
3 | 2024-03-10 | 0 | 2024-02-29
\`\`\``,
          starter: String.raw`-- id, renewal (DATE_ADD 1 MONTH), months_active (TIMESTAMPDIFF), month_end (LAST_DAY),
-- ordered by months_active descending, then id.
SELECT id, started_on, ended_on
FROM subscriptions;
`,
          solution: String.raw`SELECT id,
       DATE_ADD(started_on, INTERVAL 1 MONTH)         AS renewal,
       TIMESTAMPDIFF(MONTH, started_on, ended_on)     AS months_active,
       LAST_DAY(started_on)                           AS month_end
FROM subscriptions
ORDER BY months_active DESC, id;
`,
          hints: [
            "`TIMESTAMPDIFF(MONTH, start, end)` counts whole months only — 15 November to 14 February is 2, not 3.",
            "`TIMESTAMPDIFF` takes the unit first and then the *earlier* date, the opposite order to `DATEDIFF`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE subscriptions (id INT PRIMARY KEY, started_on DATE, ended_on DATE);
INSERT INTO subscriptions VALUES (1, '2024-01-31', '2024-07-15'), (2, '2023-11-15', '2024-02-14'), (3, '2024-02-10', '2024-02-29');`,
              expected: "id | renewal | months_active | month_end\n1 | 2024-02-29 | 5 | 2024-01-31\n2 | 2023-12-15 | 2 | 2023-11-30\n3 | 2024-03-10 | 0 | 2024-02-29\n",
            },
            {
              stdin: String.raw`CREATE TABLE subscriptions (id INT PRIMARY KEY, started_on DATE, ended_on DATE);
INSERT INTO subscriptions VALUES (8, '2024-05-31', '2024-05-31'), (4, '2023-01-31', '2024-01-31'), (5, '2023-03-15', '2024-03-15'), (6, '2024-04-30', '2024-06-29');`,
              expected: "id | renewal | months_active | month_end\n4 | 2023-02-28 | 12 | 2023-01-31\n5 | 2023-04-15 | 12 | 2023-03-31\n6 | 2024-05-30 | 1 | 2024-04-30\n8 | 2024-06-30 | 0 | 2024-05-31\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `DATE_ADD('2023-01-31', INTERVAL 1 MONTH)` return in MySQL?",
          options: ["`'2023-03-03'`", "`'2023-02-28'`", "`'2023-03-01'`", "NULL — 31 February does not exist"],
          answer: 1,
          explanation: "MySQL keeps the day number and clamps it to the last day of a shorter month, so the answer is 28 February (2023 is not a leap year). It never rolls over into March and never returns NULL for this.",
        },
        {
          prompt: "What does `DATEDIFF('2024-03-01', '2024-03-15')` return?",
          options: ["`14`", "`-14`", "`0`", "`NULL`"],
          answer: 1,
          explanation: "`DATEDIFF(a, b)` is `a − b` in days. The first date is earlier, so the result is negative. Put the later date first for a positive count.",
        },
        {
          prompt: "Someone was born on 2000-06-20. Which expression gives their age on 2024-06-19 correctly as 23?",
          options: [
            "`DATEDIFF('2024-06-19', '2000-06-20') / 365`",
            "`YEAR('2024-06-19') - YEAR('2000-06-20')`",
            "`TIMESTAMPDIFF(YEAR, '2000-06-20', '2024-06-19')`",
            "`TIMESTAMPDIFF(YEAR, '2024-06-19', '2000-06-20')`",
          ],
          answer: 2,
          explanation: "`TIMESTAMPDIFF(YEAR, start, end)` counts completed years, so 23. Subtracting years gives 24 before the birthday; dividing days by 365 drifts with leap years and is not a whole number; swapping the dates gives -23.",
        },
        {
          prompt: "Which filter finds orders from the last 30 days and can still use an index on `order_date`?",
          options: [
            "`WHERE DATEDIFF(CURDATE(), order_date) <= 30`",
            "`WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`",
            "`WHERE TIMESTAMPDIFF(DAY, order_date, CURDATE()) <= 30`",
            "All three equally",
          ],
          answer: 1,
          explanation: "Moving the arithmetic to the constant side leaves the column bare, so MySQL can range-scan an index. The other two return the same rows but wrap the column in a function, which forces every row to be computed.",
        },
      ],
    },
    {
      slug: "conditional-functions",
      file: "05-conditional-functions.md",
      exercises: [
        {
          title: "A stock board in aisle order",
          prompt: `Build a stock board for the shop floor.

| name | category | stock | reorder_level |
| --- | --- | --- | --- |
| Milk | dairy | 0 | 10 |
| Bread | bakery | 5 | NULL |
| Apples | fresh | 30 | 20 |
| Cheese | dairy | 4 | 6 |
| Bagels | bakery | 0 | 8 |

Return \`name\`, \`category\`, \`availability\` — \`in stock\` when \`stock > 0\`, otherwise \`sold out\` — and \`shortfall\`, how many units are needed to reach the reorder level, never below 0 (a missing reorder level counts as 0). Order the rows by aisle — \`fresh\`, then \`dairy\`, then \`bakery\` — and by \`name\` within an aisle.

\`\`\`text
name | category | availability | shortfall
Apples | fresh | in stock | 0
Cheese | dairy | in stock | 2
Milk | dairy | sold out | 10
Bagels | bakery | sold out | 8
Bread | bakery | in stock | 0
\`\`\``,
          starter: String.raw`-- name, category, availability (IF), shortfall (GREATEST, IFNULL),
-- ordered fresh → dairy → bakery (FIELD), then name.
SELECT name, category, stock
FROM products
ORDER BY name;
`,
          solution: String.raw`SELECT name,
       category,
       IF(stock > 0, 'in stock', 'sold out')          AS availability,
       GREATEST(IFNULL(reorder_level, 0) - stock, 0)  AS shortfall
FROM products
ORDER BY FIELD(category, 'fresh', 'dairy', 'bakery'), name;
`,
          hints: [
            "`IF(condition, a, b)` returns `a` when the condition is true and `b` otherwise — a NULL condition counts as not true.",
            "`IFNULL(reorder_level, 0) - stock` is the shortfall; `GREATEST(…, 0)` stops it going negative.",
            "`FIELD(category, 'fresh', 'dairy', 'bakery')` is 1, 2 or 3 — sort by it. A category not in the list gets 0 and comes first.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE products (name VARCHAR(40), category VARCHAR(20), stock INT, reorder_level INT);
INSERT INTO products VALUES ('Milk', 'dairy', 0, 10), ('Bread', 'bakery', 5, NULL), ('Apples', 'fresh', 30, 20), ('Cheese', 'dairy', 4, 6), ('Bagels', 'bakery', 0, 8);`,
              expected: "name | category | availability | shortfall\nApples | fresh | in stock | 0\nCheese | dairy | in stock | 2\nMilk | dairy | sold out | 10\nBagels | bakery | sold out | 8\nBread | bakery | in stock | 0\n",
            },
            {
              stdin: String.raw`CREATE TABLE products (name VARCHAR(40), category VARCHAR(20), stock INT, reorder_level INT);
INSERT INTO products VALUES ('Yogurt', 'dairy', 12, 12), ('Peas', 'frozen', NULL, 5), ('Pears', 'fresh', 2, NULL), ('Ice', 'frozen', 3, 1);`,
              expected: "name | category | availability | shortfall\nIce | frozen | in stock | 0\nPeas | frozen | sold out | NULL\nPears | fresh | in stock | 0\nYogurt | dairy | in stock | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Click-through rates that survive zero views",
          prompt: `Compute each campaign's click-through rate as a percentage.

| name | views | clicks |
| --- | --- | --- |
| spring | 450 | 37 |
| launch | 0 | 0 |
| retarget | 1200 | 96 |
| email | 800 | 20 |

Return \`name\`, \`ctr\` — \`100 * clicks / views\` rounded to 1 decimal, NULL when there are no views (guard the divisor with \`NULLIF\`) — and \`ctr_or_zero\`, the same value with NULL shown as 0. Order by \`ctr_or_zero\` descending, then \`name\`.

\`\`\`text
name | ctr | ctr_or_zero
spring | 8.2 | 8.2
retarget | 8 | 8
email | 2.5 | 2.5
launch | NULL | 0
\`\`\``,
          starter: String.raw`-- name, ctr (NULLIF guard, ROUND 1), ctr_or_zero (COALESCE),
-- ordered by ctr_or_zero descending, then name.
SELECT name, views, clicks
FROM campaigns;
`,
          solution: String.raw`SELECT name,
       ROUND(100 * clicks / NULLIF(views, 0), 1)              AS ctr,
       COALESCE(ROUND(100 * clicks / NULLIF(views, 0), 1), 0) AS ctr_or_zero
FROM campaigns
ORDER BY ctr_or_zero DESC, name;
`,
          hints: [
            "`NULLIF(views, 0)` is NULL when views is 0, and dividing by NULL gives NULL instead of an error.",
            "`COALESCE(x, 0)` shows a NULL as 0.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE campaigns (name VARCHAR(40), views INT, clicks INT);
INSERT INTO campaigns VALUES ('spring', 450, 37), ('launch', 0, 0), ('retarget', 1200, 96), ('email', 800, 20);`,
              expected: "name | ctr | ctr_or_zero\nspring | 8.2 | 8.2\nretarget | 8 | 8\nemail | 2.5 | 2.5\nlaunch | NULL | 0\n",
            },
            {
              stdin: String.raw`CREATE TABLE campaigns (name VARCHAR(40), views INT, clicks INT);
INSERT INTO campaigns VALUES ('d', 50, 0), ('c', NULL, 3), ('b', 100, 5), ('a', 200, 10);`,
              expected: "name | ctr | ctr_or_zero\na | 5 | 5\nb | 5 | 5\nc | NULL | 0\nd | 0 | 0\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `IF(NULL > 0, 'yes', 'no')` return?",
          options: ["`'yes'`", "`'no'`", "`NULL`", "An error"],
          answer: 1,
          explanation: "`NULL > 0` is unknown, which is not true, so `IF` returns its third argument. `CASE` behaves the same way, falling through to `ELSE`.",
        },
        {
          prompt: "What does `NULLIF(5, 5)` return, and `NULLIF(5, 3)`?",
          options: ["`0` and `5`", "`NULL` and `5`", "`5` and `NULL`", "`NULL` and `3`"],
          answer: 1,
          explanation: "`NULLIF(a, b)` returns NULL when the two are equal and `a` otherwise. That is what makes `x / NULLIF(y, 0)` safe.",
        },
        {
          prompt: "In MySQL, what is `GREATEST(4, NULL, 9)`?",
          options: ["`9`", "`4`", "`NULL`", "An error"],
          answer: 2,
          explanation: "MySQL's `GREATEST` and `LEAST` return NULL if any argument is NULL. PostgreSQL ignores the NULL and returns 9 — a real difference between the two. Wrap nullable columns in `COALESCE` on MySQL.",
        },
        {
          prompt: "A query ends `ORDER BY FIELD(status, 'open', 'closed')`. Where do rows with status `'pending'` appear?",
          options: ["Last", "First", "Between open and closed", "They are left out"],
          answer: 1,
          explanation: "`FIELD` returns 0 for a value not in its list, and 0 sorts before 1 and 2, so unlisted values come first. `ORDER BY` never removes rows.",
        },
        {
          prompt: "Which is the portable, standard-SQL way to replace a NULL `discount` with 0?",
          options: ["`IFNULL(discount, 0)`", "`ISNULL(discount, 0)`", "`COALESCE(discount, 0)`", "`NVL(discount, 0)`"],
          answer: 2,
          explanation: "`COALESCE` is standard and works in MySQL, PostgreSQL, SQL Server and Oracle. `IFNULL` is MySQL/SQLite, `ISNULL(a, b)` is SQL Server (MySQL's `ISNULL` takes one argument), and `NVL` is Oracle.",
        },
      ],
    },
    {
      slug: "functions-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Contact cards",
          prompt: `\`contacts.full_name\` was typed in any case with stray spaces; the first word is the first name and the last word the surname.

| id | full_name | email |
| --- | --- | --- |
| 1 | \`'  ada LOVELACE '\` | Ada@Example.COM |
| 2 | \`'grace hopper'\` | grace@NAVY.mil |
| 3 | \`'Linus'\` | linus@kernel.org |

Return \`id\`, \`first_name\` and \`last_name\` — each with a capital first letter and the rest lower case — and \`domain\`, the lower-cased part of the email after \`@\`. A one-word name is both the first and the last name. Order by \`last_name\`, then \`id\`.

\`\`\`text
id | first_name | last_name | domain
2 | Grace | Hopper | navy.mil
3 | Linus | Linus | kernel.org
1 | Ada | Lovelace | example.com
\`\`\``,
          starter: String.raw`-- id, first_name, last_name (capitalised), domain (lower case),
-- ordered by last_name, then id.
SELECT id, full_name, email
FROM contacts;
`,
          solution: String.raw`SELECT id,
       CONCAT(UPPER(LEFT(SUBSTRING_INDEX(TRIM(full_name), ' ', 1), 1)),
              LOWER(SUBSTRING(SUBSTRING_INDEX(TRIM(full_name), ' ', 1), 2)))   AS first_name,
       CONCAT(UPPER(LEFT(SUBSTRING_INDEX(TRIM(full_name), ' ', -1), 1)),
              LOWER(SUBSTRING(SUBSTRING_INDEX(TRIM(full_name), ' ', -1), 2)))  AS last_name,
       LOWER(SUBSTRING_INDEX(email, '@', -1))                                   AS domain
FROM contacts
ORDER BY last_name, id;
`,
          hints: [
            "Trim first, then `SUBSTRING_INDEX(name, ' ', 1)` is the first word and `SUBSTRING_INDEX(name, ' ', -1)` the last.",
            "Capitalise a word as `CONCAT(UPPER(LEFT(w, 1)), LOWER(SUBSTRING(w, 2)))`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE contacts (id INT PRIMARY KEY, full_name VARCHAR(60), email VARCHAR(80));
INSERT INTO contacts VALUES (1, '  ada LOVELACE ', 'Ada@Example.COM'), (2, 'grace hopper', 'grace@NAVY.mil'), (3, 'Linus', 'linus@kernel.org');`,
              expected: "id | first_name | last_name | domain\n2 | Grace | Hopper | navy.mil\n3 | Linus | Linus | kernel.org\n1 | Ada | Lovelace | example.com\n",
            },
            {
              stdin: String.raw`CREATE TABLE contacts (id INT PRIMARY KEY, full_name VARCHAR(60), email VARCHAR(80));
INSERT INTO contacts VALUES (5, 'JOHN von neumann', 'jvn@IAS.edu'), (6, 'alan  turing ', 'alan@bletchley.uk'), (7, 'ALAN KAY', 'kay@parc.com');`,
              expected: "id | first_name | last_name | domain\n7 | Alan | Kay | parc.com\n5 | John | Neumann | ias.edu\n6 | Alan | Turing | bletchley.uk\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Invoice ageing with late fees",
          prompt: `Report on invoices as of **2024-06-30**. An invoice is due \`terms_days\` after it was issued; an unpaid one (\`paid_on\` NULL) is measured up to 2024-06-30.

| id | issued_on | terms_days | paid_on | amount |
| --- | --- | --- | --- | --- |
| 1 | 2024-05-01 | 30 | NULL | 1200.00 |
| 2 | 2024-06-01 | 15 | 2024-06-10 | 500.00 |
| 3 | 2024-04-15 | 45 | 2024-06-05 | 250.00 |
| 4 | 2024-06-20 | 7 | NULL | 80.00 |

Return \`id\`, \`due_on\`, \`days_overdue\` — days from the due date to the payment date (or to 2024-06-30), never below 0 — and \`late_fee\`, 1% of the amount for every week or part-week overdue, rounded to 2 decimals. Order by \`days_overdue\` descending, then \`id\`.

\`\`\`text
id | due_on | days_overdue | late_fee
1 | 2024-05-31 | 30 | 60
3 | 2024-05-30 | 6 | 2.5
4 | 2024-06-27 | 3 | 0.8
2 | 2024-06-16 | 0 | 0
\`\`\``,
          starter: String.raw`-- As of 2024-06-30: id, due_on, days_overdue, late_fee
-- (1% per started week, ROUND 2), ordered by days_overdue descending, then id.
SELECT id, issued_on, terms_days, paid_on, amount
FROM invoices;
`,
          solution: String.raw`SELECT id,
       DATE_ADD(issued_on, INTERVAL terms_days DAY) AS due_on,
       GREATEST(DATEDIFF(COALESCE(paid_on, '2024-06-30'), DATE_ADD(issued_on, INTERVAL terms_days DAY)), 0) AS days_overdue,
       ROUND(amount * 0.01 *
             CEIL(GREATEST(DATEDIFF(COALESCE(paid_on, '2024-06-30'), DATE_ADD(issued_on, INTERVAL terms_days DAY)), 0) / 7), 2) AS late_fee
FROM invoices
ORDER BY days_overdue DESC, id;
`,
          hints: [
            "`DATE_ADD(issued_on, INTERVAL terms_days DAY)` — the interval may be a column.",
            "`COALESCE(paid_on, '2024-06-30')` is the date to measure to; `GREATEST(DATEDIFF(…), 0)` floors the days at 0.",
            "Weeks or part-weeks is `CEIL(days / 7)`; the fee is `amount * 0.01 * weeks`.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE invoices (id INT PRIMARY KEY, issued_on DATE, terms_days INT, paid_on DATE, amount DECIMAL(10,2));
INSERT INTO invoices VALUES (1, '2024-05-01', 30, NULL, 1200.00), (2, '2024-06-01', 15, '2024-06-10', 500.00),
  (3, '2024-04-15', 45, '2024-06-05', 250.00), (4, '2024-06-20', 7, NULL, 80.00);`,
              expected: "id | due_on | days_overdue | late_fee\n1 | 2024-05-31 | 30 | 60\n3 | 2024-05-30 | 6 | 2.5\n4 | 2024-06-27 | 3 | 0.8\n2 | 2024-06-16 | 0 | 0\n",
            },
            {
              stdin: String.raw`CREATE TABLE invoices (id INT PRIMARY KEY, issued_on DATE, terms_days INT, paid_on DATE, amount DECIMAL(10,2));
INSERT INTO invoices VALUES (5, '2024-06-01', 14, '2024-06-22', 99.99), (6, '2024-05-20', 10, '2024-06-14', 400.00), (7, '2024-07-01', 30, NULL, 50.00);`,
              expected: "id | due_on | days_overdue | late_fee\n6 | 2024-05-30 | 15 | 12\n5 | 2024-06-15 | 7 | 1\n7 | 2024-07-31 | 0 | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Carrier scorecard",
          prompt: `Grade each delivery carrier on its on-time rate.

| name | tier | delivered | on_time |
| --- | --- | --- | --- |
| BlueDart | express | 200 | 192 |
| Delhivery | standard | 500 | 410 |
| IndiaPost | economy | 300 | 210 |
| Ekart | standard | 0 | 0 |
| DTDC | express | 150 | 140 |

Return \`name\`, \`tier\`, \`rate\` — \`100 * on_time / delivered\` rounded to 1 decimal, NULL when nothing was delivered — and \`grade\`: \`no data\` when the rate is NULL, \`excellent\` at 95 or above, \`ok\` at 80 or above, otherwise \`poor\` (grade on the rounded rate). Order by tier — \`express\`, \`standard\`, \`economy\` — then \`name\`.

\`\`\`text
name | tier | rate | grade
BlueDart | express | 96 | excellent
DTDC | express | 93.3 | ok
Delhivery | standard | 82 | ok
Ekart | standard | NULL | no data
IndiaPost | economy | 70 | poor
\`\`\``,
          starter: String.raw`-- name, tier, rate (NULLIF guard, ROUND 1), grade (CASE),
-- ordered express → standard → economy, then name.
SELECT name, tier, delivered, on_time
FROM carriers;
`,
          solution: String.raw`SELECT name,
       tier,
       ROUND(100 * on_time / NULLIF(delivered, 0), 1) AS rate,
       CASE
         WHEN ROUND(100 * on_time / NULLIF(delivered, 0), 1) IS NULL THEN 'no data'
         WHEN ROUND(100 * on_time / NULLIF(delivered, 0), 1) >= 95 THEN 'excellent'
         WHEN ROUND(100 * on_time / NULLIF(delivered, 0), 1) >= 80 THEN 'ok'
         ELSE 'poor'
       END AS grade
FROM carriers
ORDER BY FIELD(tier, 'express', 'standard', 'economy'), name;
`,
          hints: [
            "`NULLIF(delivered, 0)` keeps a zero from becoming a division error.",
            "Test for NULL first in the `CASE` — a NULL rate fails every `>=` test and would otherwise fall through to `poor`.",
            "`FIELD(tier, 'express', 'standard', 'economy')` gives the tier order.",
          ],
          cases: [
            {
              stdin: String.raw`CREATE TABLE carriers (name VARCHAR(40), tier VARCHAR(20), delivered INT, on_time INT);
INSERT INTO carriers VALUES ('BlueDart', 'express', 200, 192), ('Delhivery', 'standard', 500, 410), ('IndiaPost', 'economy', 300, 210),
  ('Ekart', 'standard', 0, 0), ('DTDC', 'express', 150, 140);`,
              expected: "name | tier | rate | grade\nBlueDart | express | 96 | excellent\nDTDC | express | 93.3 | ok\nDelhivery | standard | 82 | ok\nEkart | standard | NULL | no data\nIndiaPost | economy | 70 | poor\n",
            },
            {
              stdin: String.raw`CREATE TABLE carriers (name VARCHAR(40), tier VARCHAR(20), delivered INT, on_time INT);
INSERT INTO carriers VALUES ('Rail', 'freight', 40, 30), ('Swift', 'economy', 100, 95), ('Steady', 'economy', 50, 40), ('Ghost', 'express', NULL, NULL);`,
              expected: "name | tier | rate | grade\nRail | freight | 75 | poor\nGhost | express | NULL | no data\nSteady | economy | 80 | ok\nSwift | economy | 95 | excellent\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `CONCAT_WS('-', '2024', NULL, '15')` return?",
          options: ["`NULL`", "`'2024--15'`", "`'2024-15'`", "`'2024-NULL-15'`"],
          answer: 2,
          explanation: "`CONCAT_WS` skips NULL arguments entirely — no value and no separator for them. Plain `CONCAT` would return NULL.",
        },
        {
          prompt: "What does `SUBSTRING('database', 5, 2)` return?",
          options: ["`'ba'`", "`'as'`", "`'ab'`", "`'se'`"],
          answer: 0,
          explanation: "Positions start at 1: d(1) a(2) t(3) a(4) b(5) a(6). Two characters from position 5 are `ba`.",
        },
        {
          prompt: "What is `-7 DIV 2` in MySQL?",
          options: ["`-4`", "`-3`", "`-3.5`", "`3`"],
          answer: 1,
          explanation: "`DIV` truncates towards zero, so -3.5 becomes -3. `FLOOR(-7 / 2)` would give -4.",
        },
        {
          prompt: "What is `ROUND(-2.5)` in MySQL (for an exact decimal value)?",
          options: ["`-2`", "`-3`", "`-2.5`", "`2`"],
          answer: 1,
          explanation: "For exact (DECIMAL) values MySQL rounds halves away from zero, so -2.5 becomes -3. For floating-point values it may round to even instead — another reason money is DECIMAL.",
        },
        {
          prompt: "What does `MOD(17, 5)` return?",
          options: ["`3`", "`2`", "`3.4`", "`12`"],
          answer: 1,
          explanation: "5 fits into 17 three times (15) with 2 left over. `17 DIV 5` is the 3; `MOD` is the remainder.",
        },
        {
          prompt: "Which expression turns a date into a key shared by every day of its month, such as `2024-03`?",
          options: ["`MONTH(d)`", "`DATE_FORMAT(d, '%Y-%m')`", "`DATE_FORMAT(d, '%m-%Y')`", "`LAST_DAY(d)`"],
          answer: 1,
          explanation: "`'%Y-%m'` gives year and month in an order that also sorts correctly. `MONTH(d)` alone merges March of every year; `'%m-%Y'` sorts badly as text; `LAST_DAY` does work as a key but is a date, not `2024-03`.",
        },
        {
          prompt: "Which numbering does `WEEKDAY(d)` use?",
          options: ["Sunday = 1 … Saturday = 7", "Monday = 0 … Sunday = 6", "Monday = 1 … Sunday = 7", "Sunday = 0 … Saturday = 6"],
          answer: 1,
          explanation: "`WEEKDAY` starts at Monday = 0. `DAYOFWEEK` is the other one, Sunday = 1 through Saturday = 7. Comparing `DAYNAME(d)` avoids mixing them up.",
        },
        {
          prompt: "What is `DATE_ADD('2024-01-31', INTERVAL 1 MONTH)`?",
          options: ["`'2024-03-02'`", "`'2024-02-29'`", "`'2024-02-28'`", "`'2024-03-01'`"],
          answer: 1,
          explanation: "MySQL clamps to the last day of the shorter month, and 2024 is a leap year, so 29 February.",
        },
        {
          prompt: "Which call returns the number of whole months from `start_date` to `end_date`?",
          options: [
            "`DATEDIFF(MONTH, start_date, end_date)`",
            "`TIMESTAMPDIFF(MONTH, start_date, end_date)`",
            "`TIMESTAMPDIFF(MONTH, end_date, start_date)`",
            "`DATEDIFF(end_date, start_date) / 30`",
          ],
          answer: 1,
          explanation: "`TIMESTAMPDIFF(unit, start, end)` counts whole units from start to end. The first option is SQL Server's syntax, the third has the dates reversed and gives a negative number, and dividing days by 30 is only approximate.",
        },
        {
          prompt: "Why write `ROUND(100 * a / NULLIF(b, 0), 1)` instead of `ROUND(100 * a / b, 1)`?",
          options: [
            "`NULLIF` makes the division faster",
            "So a zero `b` gives NULL instead of an error in databases that raise one, and the intent is explicit",
            "`NULLIF` rounds the result",
            "Without it MySQL returns infinity",
          ],
          answer: 1,
          explanation: "`NULLIF(b, 0)` turns a zero divisor into NULL, so the result is NULL. MySQL already returns NULL for division by zero, but PostgreSQL and SQL Server raise an error. It has nothing to do with speed or rounding.",
        },
        {
          prompt: "What does `IF(stock > 0, 'yes', 'no')` return when `stock` is NULL?",
          options: ["`'yes'`", "`'no'`", "`NULL`", "An error"],
          answer: 1,
          explanation: "`NULL > 0` is unknown, which is not true, so `IF` returns its third argument.",
        },
      ],
    },
  ],
});
