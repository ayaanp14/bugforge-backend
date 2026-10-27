import { defineModule } from "../../dsl.js";

const LOGINS_1 = String.raw`CREATE TABLE logins (user_id INT, login_date DATE);
INSERT INTO logins VALUES
  (1, '2024-03-01'), (1, '2024-03-02'), (1, '2024-03-03'),
  (1, '2024-03-05'), (1, '2024-03-06'), (1, '2024-03-07'),
  (2, '2024-03-01'), (2, '2024-03-02'), (2, '2024-03-02'),
  (2, '2024-03-03'), (2, '2024-03-04'),
  (3, '2024-03-10'), (3, '2024-03-12');
`;

const TICKETS_1 = String.raw`CREATE TABLE tickets (ticket_no INT PRIMARY KEY, subject VARCHAR(40));
INSERT INTO tickets VALUES
  (101, 'Login fails'), (102, 'Refund'), (103, 'Slow page'),
  (105, 'Typo'), (106, 'Card declined'), (110, 'Password reset');
`;

const CONTACTS_1 = String.raw`CREATE TABLE contacts (id INT PRIMARY KEY, email VARCHAR(60), name VARCHAR(30), updated_at DATE);
INSERT INTO contacts VALUES
  (1, 'asha@mail.com',    'Asha',    '2024-01-10'),
  (2, ' Asha@Mail.com',   'Asha K',  '2024-03-02'),
  (3, 'ravi@mail.com',    'Ravi',    '2024-02-01'),
  (4, 'meena@mail.com',   'Meena',   '2024-02-01'),
  (5, 'MEENA@mail.com ',  'Meena S', '2024-02-01'),
  (6, 'ravi@mail.com',    'Ravi P',  '2024-01-15');
`;

const ORDERS_DUP_1 = String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, product VARCHAR(20), ordered_on DATE);
INSERT INTO orders VALUES
  (1, 10, 'pen', '2024-04-01'),
  (2, 10, 'pen', '2024-04-01'),
  (3, 10, 'pen', '2024-04-02'),
  (4, 11, 'pen', '2024-04-01'),
  (5, 10, 'ink', '2024-04-01'),
  (6, 10, 'pen', '2024-04-01'),
  (7, 11, 'pen', '2024-04-01');
`;

const SALES_1 = String.raw`CREATE TABLE sales (id INT PRIMARY KEY, region VARCHAR(10), sale_date DATE, amount INT);
INSERT INTO sales VALUES
  (1, 'North', '2024-01-15', 200),
  (2, 'North', '2024-03-10', 100),
  (3, 'North', '2024-05-02', 150),
  (4, 'South', '2024-02-20', 300),
  (5, 'South', '2024-11-30', 120),
  (6, 'East',  '2024-07-04',  80),
  (7, 'East',  '2024-08-19',  90),
  (8, 'East',  '2024-12-01',  60);
`;

const SCORES_1 = String.raw`CREATE TABLE scores (student VARCHAR(20) PRIMARY KEY, maths INT, physics INT, chemistry INT);
INSERT INTO scores VALUES
  ('Arjun', 78, NULL, 65),
  ('Bela',  91, 88,   NULL),
  ('Chen',  70, 70,   70);
`;

const SIGNUPS_DAILY_1 = String.raw`CREATE TABLE daily_signups (day DATE PRIMARY KEY, signups INT);
INSERT INTO daily_signups VALUES
  ('2024-06-01', 10), ('2024-06-02', 14), ('2024-06-03', 9),
  ('2024-06-04', 20), ('2024-06-05', 17), ('2024-06-06', 11);
`;

const PAYMENTS_1 = String.raw`CREATE TABLE payments (id INT PRIMARY KEY, paid_on DATE, amount INT);
INSERT INTO payments VALUES
  (1, '2024-05-01', 100), (2, '2024-05-01', 50), (3, '2024-05-03', 70),
  (4, '2024-05-07', 20),  (5, '2024-05-08', 40), (6, '2024-05-09', 30),
  (7, '2024-05-15', 10);
`;

const PRODUCTS_1 = String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(30), price INT);
INSERT INTO products VALUES
  (1, 'Desk', 500), (2, 'Chair', 750), (3, 'Sofa', 750),
  (4, 'Lamp', 300), (5, 'Rug', 200), (6, 'Shelf', 300);
`;

const RESULTS_1 = String.raw`CREATE TABLE results (student VARCHAR(20), subject VARCHAR(20), score INT);
INSERT INTO results VALUES
  ('Ira', 'maths', 90), ('Jai', 'maths', 85), ('Kim', 'maths', 90), ('Lev', 'maths', 70),
  ('Ira', 'physics', 60), ('Jai', 'physics', 60),
  ('Ira', 'chemistry', 88), ('Kim', 'chemistry', 92),
  ('Lev', 'biology', 75);
`;

const ORDERS_DAILY_1 = String.raw`CREATE TABLE orders (id INT PRIMARY KEY, ordered_on DATE, amount INT);
INSERT INTO orders VALUES
  (1, '2024-03-01', 100), (2, '2024-03-01', 50),
  (3, '2024-03-03', 70),  (4, '2024-03-06', 30);
`;

const SIGNUPS_1 = String.raw`CREATE TABLE signups (user_id INT PRIMARY KEY, signed_up DATE);
INSERT INTO signups VALUES
  (1, '2023-12-30'), (2, '2024-01-05'), (3, '2024-01-20'), (4, '2024-03-31'),
  (5, '2024-04-01'), (6, '2024-04-15'), (7, '2024-06-30'), (8, '2024-07-01');
`;

const ATTENDANCE_1 = String.raw`CREATE TABLE attendance (student VARCHAR(20), day DATE);
INSERT INTO attendance VALUES
  ('Ana', '2024-09-02'), ('Ana', '2024-09-03'), ('Ana', '2024-09-04'), ('Ana', '2024-09-06'),
  ('Ben', '2024-09-02'), ('Ben', '2024-09-04'), ('Ben', '2024-09-06'),
  ('Cy',  '2024-09-03'), ('Cy',  '2024-09-04'), ('Cy',  '2024-09-04'), ('Cy', '2024-09-05'), ('Cy', '2024-09-06'),
  ('Dee', '2024-09-10'), ('Dee', '2024-09-11');
`;

const TICKETS_STATUS_1 = String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, opened_on DATE, status VARCHAR(10));
INSERT INTO tickets VALUES
  (1, '2024-01-03', 'open'),    (2, '2024-01-15', 'closed'), (3, '2024-01-20', 'closed'),
  (4, '2024-03-02', 'pending'), (5, '2024-03-09', 'open'),   (6, '2024-04-30', 'closed');
`;

const EMPLOYEES_1 = String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), dept VARCHAR(10), salary INT);
INSERT INTO employees VALUES
  (1, 'Asha', 'eng', 120), (2, 'Bo', 'eng', 120), (3, 'Cara', 'eng', 100), (4, 'Dan', 'eng', 90),
  (5, 'Eli', 'ops', 70),
  (6, 'Fay', 'sales', 80), (7, 'Gus', 'sales', 95), (8, 'Hal', 'sales', 60);
`;

export default defineModule(import.meta.url, {
  slug: "query-patterns",
  title: "Query patterns",
  blurb: "The shapes real reports and interview questions take: gaps and islands, deduplication, pivots, rolling windows, the nth highest value, and date series that fill the missing days.",
  icon: "grid",
  overview: `Fourteen modules taught the clauses one at a time. This one teaches the *patterns* — the recurring shapes that questions take once the clauses are known, each a few lines of SQL that an experienced developer recognises from the wording of the question. Interviews are built from them, and so is most real reporting.

Gaps and islands groups consecutive rows into runs with the row-number difference, numbers islands with LAG and a running SUM when "consecutive" means something more general, and finds the holes in a sequence with LEAD. Deduplication decides what makes two rows the same, finds duplicates with GROUP BY and a windowed COUNT, keeps one row per group with ROW_NUMBER, deletes the rest without tripping MySQL's error 1093, and adds the UNIQUE constraint that stops them returning. Pivoting turns rows into columns with conditional aggregation — MySQL has no PIVOT — and back with UNION ALL. Rolling windows are moving averages and seven-day sums with window frames, and the trap that a ROWS frame counts rows, not days. The nth highest value is four ways to write the most asked SQL question, with the NULL answer done right, per group too. Date series build calendars with recursive CTEs and LEFT JOIN data onto them so that empty days count as zero.

The exercises are the reports these patterns exist for: login streaks and missing ticket numbers, the latest contact per email and a duplicate purge, quarterly sales across columns and exam scores back into rows, a moving average and a true seven-day revenue window, the third-highest price and the second-best score per subject, daily orders with the empty days and a half-year of monthly signups. The checkpoint combines them: the longest attendance streak per student, a monthly status report with the empty months filled, and each department's top two pay levels side by side.`,
  lessons: [
    {
      slug: "gaps-and-islands",
      file: "01-gaps-and-islands.md",
      exercises: [
        {
          title: "Streaks of three days or more",
          prompt: `The \`logins\` table records each day a user signed in. A user can sign in more than once on the same day, so a date can appear twice.

| user_id | login_date |
| --- | --- |
| 1 | 2024-03-01 |
| 1 | 2024-03-02 |
| 1 | 2024-03-03 |
| 1 | 2024-03-05 |
| … | … |
| 2 | 2024-03-02 |
| 2 | 2024-03-02 |

List every **streak of at least three consecutive days** for each user. Return the columns \`user_id\`, \`start_date\`, \`end_date\` and \`days\` (the number of distinct days in the streak), ordered by \`user_id\`, then \`start_date\`.

For the setup shown in the first test case the result is:

\`\`\`text
user_id | start_date | end_date | days
1 | 2024-03-01 | 2024-03-03 | 3
1 | 2024-03-05 | 2024-03-07 | 3
2 | 2024-03-01 | 2024-03-04 | 4
\`\`\``,
          starter: String.raw`-- One row per streak of 3+ consecutive days:
-- user_id, start_date, end_date, days — ordered by user_id, start_date.
SELECT user_id, login_date
FROM logins
ORDER BY user_id, login_date;
`,
          solution: String.raw`WITH days AS (
  SELECT DISTINCT user_id, login_date FROM logins
),
numbered AS (
  SELECT user_id, login_date,
         DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (
           PARTITION BY user_id ORDER BY login_date) DAY) AS grp
  FROM days
)
SELECT user_id,
       MIN(login_date) AS start_date,
       MAX(login_date) AS end_date,
       COUNT(*) AS days
FROM numbered
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id, start_date;
`,
          hints: [
            "Inside a run of consecutive dates, `login_date` minus its row number (in days) gives the same date for every row.",
            "Remove repeated dates first with `SELECT DISTINCT user_id, login_date` — a duplicate gets its own row number and splits the run.",
            "Group by `user_id` and `DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY)`, then keep `HAVING COUNT(*) >= 3`.",
          ],
          cases: [
            { stdin: LOGINS_1, expected: "user_id | start_date | end_date | days\n1 | 2024-03-01 | 2024-03-03 | 3\n1 | 2024-03-05 | 2024-03-07 | 3\n2 | 2024-03-01 | 2024-03-04 | 4\n" },
            {
              stdin: String.raw`CREATE TABLE logins (user_id INT, login_date DATE);
INSERT INTO logins VALUES
  (5, '2024-02-28'), (5, '2024-02-29'), (5, '2024-03-01'),
  (6, '2024-12-31'), (6, '2025-01-01'), (6, '2025-01-02'), (6, '2025-01-02'),
  (7, '2024-05-01'), (7, '2024-05-02');
`,
              expected: "user_id | start_date | end_date | days\n5 | 2024-02-28 | 2024-03-01 | 3\n6 | 2024-12-31 | 2025-01-02 | 3\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE logins (user_id INT, login_date DATE);
INSERT INTO logins VALUES
  (1, '2024-01-01'), (1, '2024-01-03'), (1, '2024-01-05'),
  (2, '2024-01-01'), (2, '2024-01-02'), (2, '2024-01-02');
`,
              expected: "user_id | start_date | end_date | days\n(no rows)\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Missing ticket numbers",
          prompt: `Support tickets are numbered in sequence, but some numbers were never used or were deleted.

| ticket_no | subject |
| --- | --- |
| 101 | Login fails |
| 102 | Refund |
| 103 | Slow page |
| 105 | Typo |
| 106 | Card declined |
| 110 | Password reset |

Report each **gap** between the lowest and the highest ticket number as a range: the columns \`gap_start\` and \`gap_end\` (equal when a single number is missing), ordered by \`gap_start\`.

\`\`\`text
gap_start | gap_end
104 | 104
107 | 109
\`\`\``,
          starter: String.raw`-- Each missing range of ticket numbers: gap_start, gap_end — ordered by gap_start.
SELECT ticket_no
FROM tickets
ORDER BY ticket_no;
`,
          solution: String.raw`SELECT ticket_no + 1 AS gap_start,
       next_no - 1   AS gap_end
FROM (
  SELECT ticket_no,
         LEAD(ticket_no) OVER (ORDER BY ticket_no) AS next_no
  FROM tickets
) AS t
WHERE next_no - ticket_no > 1
ORDER BY gap_start;
`,
          hints: [
            "Compare each ticket number with the next one in order.",
            "`LEAD(ticket_no) OVER (ORDER BY ticket_no)` gives the next number; a difference above 1 means numbers are missing in between.",
            "The gap runs from `ticket_no + 1` to `next_no - 1`. The last row's `next_no` is NULL, so `WHERE next_no - ticket_no > 1` drops it on its own.",
          ],
          cases: [
            { stdin: TICKETS_1, expected: "gap_start | gap_end\n104 | 104\n107 | 109\n" },
            {
              stdin: String.raw`CREATE TABLE tickets (ticket_no INT PRIMARY KEY, subject VARCHAR(40));
INSERT INTO tickets VALUES (1, 'a'), (2, 'b'), (3, 'c'), (4, 'd'), (5, 'e');
`,
              expected: "gap_start | gap_end\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE tickets (ticket_no INT PRIMARY KEY, subject VARCHAR(40));
INSERT INTO tickets VALUES (23, 'w'), (7, 'x'), (21, 'y'), (20, 'z');
`,
              expected: "gap_start | gap_end\n8 | 19\n22 | 22\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE tickets (ticket_no INT PRIMARY KEY, subject VARCHAR(40));
INSERT INTO tickets VALUES (5, 'only one');
`,
              expected: "gap_start | gap_end\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "For one user's distinct login dates 2024-03-01, 03-02, 03-03, 03-05, what does `DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (ORDER BY login_date) DAY)` give?",
          options: [
            "2024-02-29 for all four rows",
            "2024-02-29 for the first three rows and 2024-03-01 for the fourth",
            "Four different dates",
            "2024-03-01 for all four rows",
          ],
          answer: 1,
          explanation: "Along the run the date and the row number both rise by one, so the difference stays at 2024-02-29. On the 5th the date jumps by two while the row number rises by one, so the difference moves to 2024-03-01 — a new island.",
        },
        {
          prompt: "A user has two rows for 2024-03-02 inside a run of 03-01 to 03-04. What happens if you apply the row-number difference without removing duplicates?",
          options: [
            "Nothing — ROW_NUMBER skips equal dates",
            "The run splits in two, because the duplicate gets its own row number while the date stays the same",
            "The query raises an error",
            "The run is counted with five days but stays one group",
          ],
          answer: 1,
          explanation: "ROW_NUMBER numbers every row, so after the duplicate the row number is one ahead of the date and the difference drops by a day. Use `SELECT DISTINCT` first, or `DENSE_RANK()`, which gives equal dates the same number.",
        },
        {
          prompt: "When is the LAG flag plus a running `SUM` better than the row-number difference?",
          options: [
            "Never — they are always interchangeable",
            "When \"same island\" is a rule other than \"exactly one step apart\", such as a session that breaks after 30 idle minutes",
            "Only on MySQL 5.7",
            "When the table has no primary key",
          ],
          answer: 1,
          explanation: "The flag version starts a new group whenever a condition between this row and the previous one fails, and the condition can be anything a CASE can express. The difference trick only works when consecutive values differ by exactly one step.",
        },
        {
          prompt: "In the gap query `WHERE next_no - ticket_no > 1`, what happens to the last ticket, whose `LEAD` is NULL?",
          options: [
            "It produces a gap from the ticket to NULL",
            "It is dropped, because NULL minus a number is NULL and the comparison is not true",
            "The query fails",
            "It is reported as a gap of one number",
          ],
          answer: 1,
          explanation: "Arithmetic with NULL yields NULL, and `NULL > 1` is unknown, which WHERE treats as false. No special case is needed for the last row.",
        },
      ],
    },
    {
      slug: "deduplication",
      file: "02-deduplication.md",
      exercises: [
        {
          title: "The latest contact per email",
          prompt: `The \`contacts\` table was filled by several imports, so the same person appears more than once — with different capitalisation and stray spaces in the email.

| id | email | name | updated_at |
| --- | --- | --- | --- |
| 1 | asha@mail.com | Asha | 2024-01-10 |
| 2 | ␣Asha@Mail.com | Asha K | 2024-03-02 |
| 3 | ravi@mail.com | Ravi | 2024-02-01 |
| 4 | meena@mail.com | Meena | 2024-02-01 |
| 5 | MEENA@mail.com␣ | Meena S | 2024-02-01 |
| 6 | ravi@mail.com | Ravi P | 2024-01-15 |

(␣ marks a space.) Two contacts are the same person when their emails match after \`LOWER(TRIM(…))\`. Keep **one row per person**: the one with the latest \`updated_at\`, and when two share that date, the one with the higher \`id\`.

Return \`email\` (lower-cased and trimmed), \`id\` and \`name\`, ordered by \`email\`.

\`\`\`text
email | id | name
asha@mail.com | 2 | Asha K
meena@mail.com | 5 | Meena S
ravi@mail.com | 3 | Ravi
\`\`\``,
          starter: String.raw`-- One row per normalised email: the latest updated_at, ties to the higher id.
-- Columns: email (lower-cased, trimmed), id, name — ordered by email.
SELECT LOWER(TRIM(email)) AS email, id, name
FROM contacts
ORDER BY email;
`,
          solution: String.raw`WITH ranked AS (
  SELECT LOWER(TRIM(email)) AS email, id, name,
         ROW_NUMBER() OVER (
           PARTITION BY LOWER(TRIM(email))
           ORDER BY updated_at DESC, id DESC) AS rn
  FROM contacts
)
SELECT email, id, name
FROM ranked
WHERE rn = 1
ORDER BY email;
`,
          hints: [
            "Number the rows of each person with `ROW_NUMBER()` and keep number 1.",
            "Partition by `LOWER(TRIM(email))` — the normalised key — not by the raw column.",
            "The keeper rule goes in the window's ORDER BY: `ORDER BY updated_at DESC, id DESC`.",
          ],
          cases: [
            { stdin: CONTACTS_1, expected: "email | id | name\nasha@mail.com | 2 | Asha K\nmeena@mail.com | 5 | Meena S\nravi@mail.com | 3 | Ravi\n" },
            {
              stdin: String.raw`CREATE TABLE contacts (id INT PRIMARY KEY, email VARCHAR(60), name VARCHAR(30), updated_at DATE);
INSERT INTO contacts VALUES
  (1, 'zed@mail.com', 'Zed', '2024-05-01'),
  (2, 'amy@mail.com', 'Amy', '2024-05-02');
`,
              expected: "email | id | name\namy@mail.com | 2 | Amy\nzed@mail.com | 1 | Zed\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE contacts (id INT PRIMARY KEY, email VARCHAR(60), name VARCHAR(30), updated_at DATE);
INSERT INTO contacts VALUES
  (8, 'Kai@Mail.com', 'Kai A', '2024-06-01'),
  (3, 'kai@mail.com', 'Kai B', '2024-06-01'),
  (5, ' kai@mail.com ', 'Kai C', '2024-06-01'),
  (9, 'lu@mail.com', 'Lu', '2023-01-01'),
  (2, 'LU@MAIL.COM', 'Lu N', '2024-01-01');
`,
              expected: "email | id | name\nkai@mail.com | 8 | Kai A\nlu@mail.com | 2 | Lu N\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Delete the duplicate orders",
          prompt: `A checkout bug saved some orders twice. Two orders are duplicates when they have the same \`customer_id\`, \`product\` and \`ordered_on\`.

| id | customer_id | product | ordered_on |
| --- | --- | --- | --- |
| 1 | 10 | pen | 2024-04-01 |
| 2 | 10 | pen | 2024-04-01 |
| 3 | 10 | pen | 2024-04-02 |
| 4 | 11 | pen | 2024-04-01 |
| 5 | 10 | ink | 2024-04-01 |
| 6 | 10 | pen | 2024-04-01 |
| 7 | 11 | pen | 2024-04-01 |

Write a \`DELETE\` that removes every duplicate and **keeps the order with the smallest \`id\`** of each group. The starter already ends with the \`SELECT\` that shows the table afterwards; keep it.

\`\`\`text
id | customer_id | product | ordered_on
1 | 10 | pen | 2024-04-01
3 | 10 | pen | 2024-04-02
4 | 11 | pen | 2024-04-01
5 | 10 | ink | 2024-04-01
\`\`\``,
          starter: String.raw`-- Delete the duplicates (same customer_id, product, ordered_on), keeping the smallest id.

SELECT id, customer_id, product, ordered_on FROM orders ORDER BY id;
`,
          solution: String.raw`DELETE FROM orders
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY customer_id, product, ordered_on
             ORDER BY id) AS rn
    FROM orders
  ) AS numbered
  WHERE rn > 1
);

SELECT id, customer_id, product, ordered_on FROM orders ORDER BY id;
`,
          hints: [
            "Number each duplicate group's rows by `id`; every row numbered above 1 must go.",
            "`ROW_NUMBER() OVER (PARTITION BY customer_id, product, ordered_on ORDER BY id)` — then `DELETE … WHERE id IN (… WHERE rn > 1)`.",
            "On MySQL, wrap the numbered subquery in one more `SELECT id FROM (…) AS numbered`, or the server refuses with error 1093.",
          ],
          cases: [
            { stdin: ORDERS_DUP_1, expected: "id | customer_id | product | ordered_on\n1 | 10 | pen | 2024-04-01\n3 | 10 | pen | 2024-04-02\n4 | 11 | pen | 2024-04-01\n5 | 10 | ink | 2024-04-01\n" },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, product VARCHAR(20), ordered_on DATE);
INSERT INTO orders VALUES
  (1, 1, 'cup', '2024-01-01'), (2, 1, 'cup', '2024-01-02'), (3, 2, 'cup', '2024-01-01');
`,
              expected: "id | customer_id | product | ordered_on\n1 | 1 | cup | 2024-01-01\n2 | 1 | cup | 2024-01-02\n3 | 2 | cup | 2024-01-01\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, product VARCHAR(20), ordered_on DATE);
INSERT INTO orders VALUES
  (9, 4, 'mug', '2024-02-02'), (4, 4, 'mug', '2024-02-02'), (7, 4, 'mug', '2024-02-02'),
  (8, 5, 'mug', '2024-02-02'), (2, 5, 'mug', '2024-02-02');
`,
              expected: "id | customer_id | product | ordered_on\n2 | 5 | mug | 2024-02-02\n4 | 4 | mug | 2024-02-02\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which query lists each duplicated email once with its number of copies?",
          options: [
            "`SELECT DISTINCT email FROM users`",
            "`SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1`",
            "`SELECT email, COUNT(*) FROM users WHERE COUNT(*) > 1 GROUP BY email`",
            "`SELECT email FROM users ORDER BY email`",
          ],
          answer: 1,
          explanation: "GROUP BY makes one row per email and HAVING filters groups after counting. An aggregate cannot appear in WHERE, which filters rows before grouping; DISTINCT lists every email, duplicated or not.",
        },
        {
          prompt: "MySQL rejects `DELETE FROM orders WHERE id IN (SELECT id FROM orders WHERE …)` with error 1093. What is the usual fix?",
          options: [
            "Add `LIMIT 1` to the subquery",
            "Wrap the subquery in a derived table: `WHERE id IN (SELECT id FROM (SELECT … FROM orders …) AS t)`",
            "Use `TRUNCATE` instead",
            "Disable foreign-key checks",
          ],
          answer: 1,
          explanation: "MySQL will not read the table being modified in a subquery of the same statement, but it materialises a derived table first, which lifts the restriction. A multi-table `DELETE o1 FROM orders o1 JOIN orders o2 …` is the other common answer.",
        },
        {
          prompt: "`SELECT DISTINCT email, name FROM contacts` is used to deduplicate contacts whose names were typed differently ('Asha', 'Asha K'). What does it return for that person?",
          options: [
            "One row, chosen at random",
            "Two rows — DISTINCT removes only rows equal in every selected column",
            "One row with the longer name",
            "An error",
          ],
          answer: 1,
          explanation: "DISTINCT cannot choose between rows that differ. To keep one row per key, number the rows with ROW_NUMBER over the key and a keeper rule, and keep number 1.",
        },
        {
          prompt: "Rows with a NULL `phone` are grouped with `GROUP BY phone`. How many groups do three NULL-phone rows form?",
          options: ["Three — NULL is never equal to NULL", "One", "None — NULLs are skipped", "It depends on the collation"],
          answer: 1,
          explanation: "GROUP BY, DISTINCT and PARTITION BY treat all NULLs as one group, even though `NULL = NULL` is not true. Whether those rows really are duplicates is a business question — usually they are not, so exclude them.",
        },
      ],
    },
    {
      slug: "pivoting",
      file: "03-pivoting.md",
      exercises: [
        {
          title: "Quarterly sales by region",
          prompt: `The \`sales\` table holds one row per sale.

| id | region | sale_date | amount |
| --- | --- | --- | --- |
| 1 | North | 2024-01-15 | 200 |
| 2 | North | 2024-03-10 | 100 |
| 3 | North | 2024-05-02 | 150 |
| 4 | South | 2024-02-20 | 300 |
| 5 | South | 2024-11-30 | 120 |
| 6 | East | 2024-07-04 | 80 |
| 7 | East | 2024-08-19 | 90 |
| 8 | East | 2024-12-01 | 60 |

Pivot it into **one row per region** with the columns \`region\`, \`q1\`, \`q2\`, \`q3\`, \`q4\` (the sum of that quarter's amounts, **0** when there were none) and \`total\`, ordered by \`region\`. All sales are in one year.

\`\`\`text
region | q1 | q2 | q3 | q4 | total
East | 0 | 0 | 170 | 60 | 230
North | 300 | 150 | 0 | 0 | 450
South | 300 | 0 | 0 | 120 | 420
\`\`\``,
          starter: String.raw`-- One row per region: region, q1, q2, q3, q4, total (0 for an empty quarter), ordered by region.
SELECT region, QUARTER(sale_date) AS quarter, SUM(amount) AS amount
FROM sales
GROUP BY region, QUARTER(sale_date)
ORDER BY region, quarter;
`,
          solution: String.raw`SELECT region,
       SUM(CASE WHEN QUARTER(sale_date) = 1 THEN amount ELSE 0 END) AS q1,
       SUM(CASE WHEN QUARTER(sale_date) = 2 THEN amount ELSE 0 END) AS q2,
       SUM(CASE WHEN QUARTER(sale_date) = 3 THEN amount ELSE 0 END) AS q3,
       SUM(CASE WHEN QUARTER(sale_date) = 4 THEN amount ELSE 0 END) AS q4,
       SUM(amount) AS total
FROM sales
GROUP BY region
ORDER BY region;
`,
          hints: [
            "Group by `region` only; each quarter becomes its own aggregate column.",
            "`SUM(CASE WHEN QUARTER(sale_date) = 1 THEN amount ELSE 0 END) AS q1` adds only the first quarter's amounts.",
            "Without `ELSE 0`, a quarter with no sales prints NULL instead of 0.",
          ],
          cases: [
            { stdin: SALES_1, expected: "region | q1 | q2 | q3 | q4 | total\nEast | 0 | 0 | 170 | 60 | 230\nNorth | 300 | 150 | 0 | 0 | 450\nSouth | 300 | 0 | 0 | 120 | 420\n" },
            {
              stdin: String.raw`CREATE TABLE sales (id INT PRIMARY KEY, region VARCHAR(10), sale_date DATE, amount INT);
INSERT INTO sales VALUES
  (1, 'West', '2024-10-01', 40), (2, 'West', '2024-12-31', 60), (3, 'West', '2024-11-11', 5);
`,
              expected: "region | q1 | q2 | q3 | q4 | total\nWest | 0 | 0 | 0 | 105 | 105\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE sales (id INT PRIMARY KEY, region VARCHAR(10), sale_date DATE, amount INT);
INSERT INTO sales VALUES
  (1, 'B', '2024-04-01', 10), (2, 'A', '2024-06-30', 20), (3, 'A', '2024-07-01', 30),
  (4, 'C', '2024-01-01', 1),  (5, 'C', '2024-04-01', 2),  (6, 'C', '2024-07-01', 3), (7, 'C', '2024-10-01', 4);
`,
              expected: "region | q1 | q2 | q3 | q4 | total\nA | 0 | 20 | 30 | 0 | 50\nB | 0 | 10 | 0 | 0 | 10\nC | 1 | 2 | 3 | 4 | 10\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Unpivot the exam scores",
          prompt: `Exam scores arrived from a spreadsheet, one column per subject; a NULL means the student did not sit that exam.

| student | maths | physics | chemistry |
| --- | --- | --- | --- |
| Arjun | 78 | NULL | 65 |
| Bela | 91 | 88 | NULL |
| Chen | 70 | 70 | 70 |

Turn it into **one row per student and subject sat**: the columns \`student\`, \`subject\` (the text \`maths\`, \`physics\` or \`chemistry\`) and \`score\`, leaving out the NULL cells, ordered by \`student\`, then \`subject\`.

\`\`\`text
student | subject | score
Arjun | chemistry | 65
Arjun | maths | 78
Bela | maths | 91
Bela | physics | 88
Chen | chemistry | 70
Chen | maths | 70
Chen | physics | 70
\`\`\``,
          starter: String.raw`-- One row per (student, subject) with a score: student, subject, score.
-- Leave out NULL scores; order by student, subject.
SELECT student, 'maths' AS subject, maths AS score
FROM scores
ORDER BY student, subject;
`,
          solution: String.raw`SELECT student, 'maths' AS subject, maths AS score FROM scores WHERE maths IS NOT NULL
UNION ALL
SELECT student, 'physics', physics FROM scores WHERE physics IS NOT NULL
UNION ALL
SELECT student, 'chemistry', chemistry FROM scores WHERE chemistry IS NOT NULL
ORDER BY student, subject;
`,
          hints: [
            "Write one SELECT per subject column and stack them.",
            "Use `UNION ALL`, not `UNION` — Chen's three equal scores are three different rows.",
            "Each part filters its own column (`WHERE physics IS NOT NULL`), and one ORDER BY at the very end sorts the whole result.",
          ],
          cases: [
            { stdin: SCORES_1, expected: "student | subject | score\nArjun | chemistry | 65\nArjun | maths | 78\nBela | maths | 91\nBela | physics | 88\nChen | chemistry | 70\nChen | maths | 70\nChen | physics | 70\n" },
            {
              stdin: String.raw`CREATE TABLE scores (student VARCHAR(20) PRIMARY KEY, maths INT, physics INT, chemistry INT);
INSERT INTO scores VALUES ('Dev', NULL, NULL, NULL), ('Esha', NULL, 55, NULL);
`,
              expected: "student | subject | score\nEsha | physics | 55\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE scores (student VARCHAR(20) PRIMARY KEY, maths INT, physics INT, chemistry INT);
INSERT INTO scores VALUES ('Zoe', 0, 100, 40);
`,
              expected: "student | subject | score\nZoe | chemistry | 40\nZoe | maths | 0\nZoe | physics | 100\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Region West has no sale in Q2. What does `SUM(CASE WHEN QUARTER(sale_date) = 2 THEN amount END) AS q2` print for West?",
          options: ["0", "NULL", "An error", "The total of all West's sales"],
          answer: 1,
          explanation: "Without ELSE the CASE yields NULL for every West row, and SUM of only NULLs is NULL. Add `ELSE 0`, or wrap the sum in `COALESCE(…, 0)`, to print 0.",
        },
        {
          prompt: "Which aggregate is right for pivoting a text value, such as each student's grade per subject?",
          options: [
            "`SUM(CASE WHEN subject = 'maths' THEN grade END)`",
            "`MAX(CASE WHEN subject = 'maths' THEN grade END)`",
            "`COUNT(CASE WHEN subject = 'maths' THEN grade END)`",
            "`AVG(CASE WHEN subject = 'maths' THEN grade END)`",
          ],
          answer: 1,
          explanation: "With one matching row per cell, MAX (or MIN) simply picks that value out of the NULLs. SUM and AVG need numbers, and COUNT returns how many rows matched, not the value.",
        },
        {
          prompt: "Why `UNION ALL` rather than `UNION` when unpivoting columns into rows?",
          options: [
            "UNION is not supported in MySQL",
            "UNION would remove rows that happen to be identical — a student with the same score in two subjects could lose one — and it pays for a duplicate check",
            "UNION ALL sorts the result",
            "There is no difference",
          ],
          answer: 1,
          explanation: "Each unpivoted row is a distinct fact even when its values coincide with another's. In this exercise the subject label differs, so UNION would not drop rows here, but it would still sort or hash every row for nothing.",
        },
        {
          prompt: "A report needs one column per status, but new statuses are added every month. Which statement is true?",
          options: [
            "`SUM(CASE …)` adds the new columns automatically",
            "A static SELECT's columns are fixed when it is written; a dynamic pivot builds the SQL text (for example with GROUP_CONCAT) and runs it as a prepared statement, or the application pivots the rows",
            "MySQL's PIVOT operator handles it",
            "`GROUP BY WITH ROLLUP` creates the columns",
          ],
          answer: 1,
          explanation: "No dialect can return columns whose names are not known when the query is written. MySQL has no PIVOT operator; the workaround generates the column list as text.",
        },
      ],
    },
    {
      slug: "rolling-windows",
      file: "04-rolling-windows.md",
      exercises: [
        {
          title: "Three-day moving average of signups",
          prompt: `\`daily_signups\` has exactly one row per day, with no days missing.

| day | signups |
| --- | --- |
| 2024-06-01 | 10 |
| 2024-06-02 | 14 |
| 2024-06-03 | 9 |
| 2024-06-04 | 20 |
| 2024-06-05 | 17 |
| 2024-06-06 | 11 |

For each day, return \`day\`, \`signups\` and \`avg_3d\`: the average of that day and the two days before it, rounded to 2 decimal places — and **NULL** on any day that does not yet have two days before it. Order by \`day\`.

\`\`\`text
day | signups | avg_3d
2024-06-01 | 10 | NULL
2024-06-02 | 14 | NULL
2024-06-03 | 9 | 11
2024-06-04 | 20 | 14.33
2024-06-05 | 17 | 15.33
2024-06-06 | 11 | 16
\`\`\``,
          starter: String.raw`-- day, signups, avg_3d (this day and the two before, ROUND 2; NULL until there are three days), ordered by day.
SELECT day, signups,
       ROUND(AVG(signups) OVER (ORDER BY day), 2) AS avg_3d
FROM daily_signups
ORDER BY day;
`,
          solution: String.raw`SELECT day, signups,
       CASE WHEN COUNT(*) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) = 3
            THEN ROUND(AVG(signups) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2)
       END AS avg_3d
FROM daily_signups
ORDER BY day;
`,
          hints: [
            "The starter's window has no frame, so it averages everything from the first day — a running average, not a moving one.",
            "Add the frame `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`.",
            "Count the rows in the same frame with `COUNT(*) OVER (…)` and only show the average when the count is 3.",
          ],
          cases: [
            { stdin: SIGNUPS_DAILY_1, expected: "day | signups | avg_3d\n2024-06-01 | 10 | NULL\n2024-06-02 | 14 | NULL\n2024-06-03 | 9 | 11\n2024-06-04 | 20 | 14.33\n2024-06-05 | 17 | 15.33\n2024-06-06 | 11 | 16\n" },
            {
              stdin: String.raw`CREATE TABLE daily_signups (day DATE PRIMARY KEY, signups INT);
INSERT INTO daily_signups VALUES ('2024-01-01', 5), ('2024-01-02', 6);
`,
              expected: "day | signups | avg_3d\n2024-01-01 | 5 | NULL\n2024-01-02 | 6 | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE daily_signups (day DATE PRIMARY KEY, signups INT);
INSERT INTO daily_signups VALUES
  ('2024-02-28', 0), ('2024-02-29', 0), ('2024-03-01', 1), ('2024-03-02', 0);
`,
              expected: "day | signups | avg_3d\n2024-02-28 | 0 | NULL\n2024-02-29 | 0 | NULL\n2024-03-01 | 1 | 0.33\n2024-03-02 | 0 | 0.33\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Seven calendar days of revenue",
          prompt: `\`payments\` can have several rows on one day and none on others.

| id | paid_on | amount |
| --- | --- | --- |
| 1 | 2024-05-01 | 100 |
| 2 | 2024-05-01 | 50 |
| 3 | 2024-05-03 | 70 |
| 4 | 2024-05-07 | 20 |
| 5 | 2024-05-08 | 40 |
| 6 | 2024-05-09 | 30 |
| 7 | 2024-05-15 | 10 |

The starter tries a seven-day total with \`ROWS BETWEEN 6 PRECEDING\`, which counts rows, not days. Fix it. For **each date that has payments**, return \`paid_on\`, \`day_total\` (that day's sum) and \`week_total\` — the sum of all payments from six days before that date up to and including it. Order by \`paid_on\`.

\`\`\`text
paid_on | day_total | week_total
2024-05-01 | 150 | 150
2024-05-03 | 70 | 220
2024-05-07 | 20 | 240
2024-05-08 | 40 | 130
2024-05-09 | 30 | 160
2024-05-15 | 10 | 40
\`\`\``,
          starter: String.raw`-- Wrong: a ROWS frame counts rows, not calendar days. Fix it.
-- Columns: paid_on, day_total, week_total (this date and the six days before) — ordered by paid_on.
SELECT paid_on, amount AS day_total,
       SUM(amount) OVER (ORDER BY paid_on ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS week_total
FROM payments
ORDER BY paid_on;
`,
          solution: String.raw`WITH daily AS (
  SELECT paid_on, SUM(amount) AS day_total
  FROM payments
  GROUP BY paid_on
)
SELECT d.paid_on, d.day_total,
       (SELECT SUM(x.day_total)
        FROM daily AS x
        WHERE x.paid_on BETWEEN DATE_SUB(d.paid_on, INTERVAL 6 DAY) AND d.paid_on) AS week_total
FROM daily AS d
ORDER BY d.paid_on;
`,
          hints: [
            "First make one row per day: `GROUP BY paid_on` with `SUM(amount)`.",
            "The window is a date condition: `x.paid_on BETWEEN DATE_SUB(d.paid_on, INTERVAL 6 DAY) AND d.paid_on`.",
            "Use that condition in a correlated subquery (or a self-join with GROUP BY) over the daily totals.",
          ],
          cases: [
            { stdin: PAYMENTS_1, expected: "paid_on | day_total | week_total\n2024-05-01 | 150 | 150\n2024-05-03 | 70 | 220\n2024-05-07 | 20 | 240\n2024-05-08 | 40 | 130\n2024-05-09 | 30 | 160\n2024-05-15 | 10 | 40\n" },
            {
              stdin: String.raw`CREATE TABLE payments (id INT PRIMARY KEY, paid_on DATE, amount INT);
INSERT INTO payments VALUES
  (1, '2024-02-25', 5), (2, '2024-02-29', 10), (3, '2024-03-02', 20), (4, '2024-03-03', 1);
`,
              expected: "paid_on | day_total | week_total\n2024-02-25 | 5 | 5\n2024-02-29 | 10 | 15\n2024-03-02 | 20 | 35\n2024-03-03 | 1 | 31\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE payments (id INT PRIMARY KEY, paid_on DATE, amount INT);
INSERT INTO payments VALUES (1, '2024-08-15', 42);
`,
              expected: "paid_on | day_total | week_total\n2024-08-15 | 42 | 42\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` cover on a table with one row per *transaction*?",
          options: [
            "The last seven calendar days",
            "The current row and the six rows before it, however many days they span",
            "The last seven distinct dates",
            "The whole partition",
          ],
          answer: 1,
          explanation: "A ROWS frame counts physical rows. It equals seven days only when there is exactly one row per day — aggregate per day and fill missing days, or use a RANGE frame on the date.",
        },
        {
          prompt: "With `SUM(points) OVER (ORDER BY score)` and no frame clause, two rows share the same `score`. What do they show?",
          options: [
            "Different running totals, one row at a time",
            "The same total, because the default frame is RANGE … CURRENT ROW and tied rows are peers that enter together",
            "NULL",
            "An error about non-unique ordering",
          ],
          answer: 1,
          explanation: "The default frame with an ORDER BY is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Use `ROWS` or a unique tie-breaker for a strictly row-by-row total.",
        },
        {
          prompt: "Which MySQL 8 frame is a true seven-day window over a date column with gaps?",
          options: [
            "`ROWS BETWEEN 7 PRECEDING AND CURRENT ROW`",
            "`RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW`",
            "`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`",
            "`RANGE BETWEEN 6 PRECEDING AND 6 FOLLOWING`",
          ],
          answer: 1,
          explanation: "A RANGE frame with an interval includes every row whose date lies within six days before the current one, whatever the number of rows. Today plus six days back is seven days.",
        },
        {
          prompt: "Why write `NULLIF(LAG(total) OVER (ORDER BY week), 0)` in a week-over-week percentage?",
          options: [
            "To skip the first week",
            "So a previous week of zero gives NULL rather than a division error (or MySQL's NULL with a warning)",
            "To round the result",
            "It makes LAG look two rows back",
          ],
          answer: 1,
          explanation: "NULLIF(x, 0) returns NULL when x is 0, and dividing by NULL gives NULL. PostgreSQL and SQL Server raise an error on division by zero, so the guard is what makes the query portable.",
        },
      ],
    },
    {
      slug: "nth-highest-value",
      file: "05-nth-highest-value.md",
      exercises: [
        {
          title: "The third-highest distinct price",
          prompt: `Find the **third-highest distinct price** in \`products\`. Return one row with one column, \`third_price\` — and \`NULL\` when there are fewer than three distinct prices (including when the table is empty).

| id | name | price |
| --- | --- | --- |
| 1 | Desk | 500 |
| 2 | Chair | 750 |
| 3 | Sofa | 750 |
| 4 | Lamp | 300 |
| 5 | Rug | 200 |
| 6 | Shelf | 300 |

The distinct prices from the top are 750, 500, 300:

\`\`\`text
third_price
300
\`\`\``,
          starter: String.raw`-- One row, one column third_price: the third-highest DISTINCT price, NULL if there is none.
SELECT price AS third_price
FROM products
ORDER BY price DESC;
`,
          solution: String.raw`SELECT (
  SELECT DISTINCT price
  FROM products
  ORDER BY price DESC
  LIMIT 1 OFFSET 2
) AS third_price;
`,
          hints: [
            "Sort the *distinct* prices from the top and skip two of them.",
            "`SELECT DISTINCT price … ORDER BY price DESC LIMIT 1 OFFSET 2` finds it — but returns no rows when there is no third price.",
            "Put that query inside a scalar subquery, `SELECT ( … ) AS third_price`, which turns \"no row\" into NULL.",
          ],
          cases: [
            { stdin: PRODUCTS_1, expected: "third_price\n300\n" },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(30), price INT);
INSERT INTO products VALUES (1, 'A', 100), (2, 'B', 100), (3, 'C', 90);
`,
              expected: "third_price\nNULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(30), price INT);
INSERT INTO products VALUES (1, 'A', 10), (2, 'B', 40), (3, 'C', 30), (4, 'D', 20);
`,
              expected: "third_price\n20\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(30), price INT);
`,
              expected: "third_price\nNULL\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Second-best score per subject",
          prompt: `\`results\` holds exam scores (never NULL).

| student | subject | score |
| --- | --- | --- |
| Ira | maths | 90 |
| Jai | maths | 85 |
| Kim | maths | 90 |
| Lev | maths | 70 |
| Ira | physics | 60 |
| Jai | physics | 60 |
| Ira | chemistry | 88 |
| Kim | chemistry | 92 |
| Lev | biology | 75 |

For **every subject**, return \`subject\` and \`second_score\`: the second-highest *distinct* score in that subject, or \`NULL\` when the subject has only one distinct score. Order by \`subject\`.

\`\`\`text
subject | second_score
biology | NULL
chemistry | 88
maths | 85
physics | NULL
\`\`\``,
          starter: String.raw`-- Every subject with its second-highest distinct score (NULL if none): subject, second_score, ordered by subject.
SELECT subject, MAX(score) AS second_score
FROM results
GROUP BY subject
ORDER BY subject;
`,
          solution: String.raw`WITH ranked AS (
  SELECT subject, score,
         DENSE_RANK() OVER (PARTITION BY subject ORDER BY score DESC) AS rk
  FROM results
)
SELECT subject,
       MAX(CASE WHEN rk = 2 THEN score END) AS second_score
FROM ranked
GROUP BY subject
ORDER BY subject;
`,
          hints: [
            "Rank the scores within each subject with `DENSE_RANK() OVER (PARTITION BY subject ORDER BY score DESC)` — ties share a rank and leave no gap.",
            "Filtering `WHERE rk = 2` would drop the subjects that have no second score; every subject must appear.",
            "Group the ranked rows by subject and pick the rank-2 score with `MAX(CASE WHEN rk = 2 THEN score END)`, which is NULL when there is none.",
          ],
          cases: [
            { stdin: RESULTS_1, expected: "subject | second_score\nbiology | NULL\nchemistry | 88\nmaths | 85\nphysics | NULL\n" },
            {
              stdin: String.raw`CREATE TABLE results (student VARCHAR(20), subject VARCHAR(20), score INT);
INSERT INTO results VALUES
  ('A', 'art', 100), ('B', 'art', 90), ('C', 'art', 90), ('D', 'art', 80);
`,
              expected: "subject | second_score\nart | 90\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE results (student VARCHAR(20), subject VARCHAR(20), score INT);
INSERT INTO results VALUES
  ('A', 'music', 50), ('B', 'history', 61), ('C', 'history', 61), ('D', 'drama', 0);
`,
              expected: "subject | second_score\ndrama | NULL\nhistory | NULL\nmusic | NULL\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Salaries are 300, 300, 200, 100. Which function makes `WHERE rk = 2` return 200?",
          options: ["`ROW_NUMBER()`", "`RANK()`", "`DENSE_RANK()`", "Any of the three"],
          answer: 2,
          explanation: "DENSE_RANK gives 1, 1, 2, 3. RANK gives 1, 1, 3, 4 — no row has rank 2. ROW_NUMBER gives 1, 2, 3, 4, so rank 2 is the second 300.",
        },
        {
          prompt: "There is only one employee. What does `SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1` return?",
          options: ["One row with NULL", "No rows", "The only salary", "An error"],
          answer: 1,
          explanation: "OFFSET 1 skips the only row, leaving nothing. Wrapping the query in a scalar subquery, `SELECT (…) AS second`, turns that empty result into one row holding NULL.",
        },
        {
          prompt: "Why does `SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)` need no NULL wrapper?",
          options: [
            "Because MAX skips NULL salaries",
            "Because an aggregate without GROUP BY always returns exactly one row, NULL when no row qualifies",
            "Because the subquery returns NULL",
            "It does need one",
          ],
          answer: 1,
          explanation: "MAX over an empty set is NULL, and an aggregate query with no GROUP BY returns one row even when no rows pass the WHERE.",
        },
        {
          prompt: "A report must list every department with its second-highest salary, NULL where there is none. Which shape guarantees one row per department?",
          options: [
            "`… WHERE rk = 2` on the ranked rows",
            "The distinct departments LEFT JOINed to the rank-2 rows, or a GROUP BY dept with `MAX(CASE WHEN rk = 2 …)`",
            "`INNER JOIN` the departments to the rank-2 rows",
            "`LIMIT 1 OFFSET 1` per department in the main query",
          ],
          answer: 1,
          explanation: "Filtering on rank 2 drops departments that have no second value. Starting from every department (or grouping all ranked rows by department) keeps them, with NULL in place of the missing value.",
        },
      ],
    },
    {
      slug: "date-series",
      file: "06-date-series.md",
      exercises: [
        {
          title: "Daily orders with the empty days",
          prompt: `\`orders\` has no rows on days nobody ordered.

| id | ordered_on | amount |
| --- | --- | --- |
| 1 | 2024-03-01 | 100 |
| 2 | 2024-03-01 | 50 |
| 3 | 2024-03-03 | 70 |
| 4 | 2024-03-06 | 30 |

Report **every day** from the first order date to the last one, inclusive: the columns \`day\`, \`orders\` (the number of orders, 0 on an empty day) and \`revenue\` (the sum of amounts, 0 on an empty day), ordered by \`day\`. Take the first and last dates from the table — do not type them in.

\`\`\`text
day | orders | revenue
2024-03-01 | 2 | 150
2024-03-02 | 0 | 0
2024-03-03 | 1 | 70
2024-03-04 | 0 | 0
2024-03-05 | 0 | 0
2024-03-06 | 1 | 30
\`\`\``,
          starter: String.raw`-- Every day from the first to the last order date: day, orders, revenue (0 on empty days), ordered by day.
SELECT ordered_on AS day, COUNT(*) AS orders, SUM(amount) AS revenue
FROM orders
GROUP BY ordered_on
ORDER BY day;
`,
          solution: String.raw`WITH RECURSIVE bounds AS (
  SELECT MIN(ordered_on) AS first_day, MAX(ordered_on) AS last_day FROM orders
),
calendar AS (
  SELECT first_day AS day FROM bounds
  UNION ALL
  SELECT DATE_ADD(c.day, INTERVAL 1 DAY)
  FROM calendar AS c
  JOIN bounds AS b ON c.day < b.last_day
)
SELECT c.day,
       COUNT(o.id) AS orders,
       COALESCE(SUM(o.amount), 0) AS revenue
FROM calendar AS c
LEFT JOIN orders AS o ON o.ordered_on = c.day
GROUP BY c.day
ORDER BY c.day;
`,
          hints: [
            "Build the list of days with `WITH RECURSIVE`: start at `MIN(ordered_on)` and add `INTERVAL 1 DAY` while the day is before `MAX(ordered_on)`.",
            "LEFT JOIN the orders onto the calendar and group by the calendar's day, so empty days survive.",
            "On an empty day `COUNT(*)` would say 1 — count `o.id` instead, and wrap the sum in `COALESCE(…, 0)`.",
          ],
          cases: [
            { stdin: ORDERS_DAILY_1, expected: "day | orders | revenue\n2024-03-01 | 2 | 150\n2024-03-02 | 0 | 0\n2024-03-03 | 1 | 70\n2024-03-04 | 0 | 0\n2024-03-05 | 0 | 0\n2024-03-06 | 1 | 30\n" },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, ordered_on DATE, amount INT);
INSERT INTO orders VALUES (1, '2024-07-04', 12), (2, '2024-07-04', 8);
`,
              expected: "day | orders | revenue\n2024-07-04 | 2 | 20\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE orders (id INT PRIMARY KEY, ordered_on DATE, amount INT);
INSERT INTO orders VALUES (1, '2024-02-02', 5), (2, '2024-01-30', 9), (3, '2024-01-31', 0);
`,
              expected: "day | orders | revenue\n2024-01-30 | 1 | 9\n2024-01-31 | 1 | 0\n2024-02-01 | 0 | 0\n2024-02-02 | 1 | 5\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Monthly signups for the first half of 2024",
          prompt: `\`signups\` records the day each user signed up.

| user_id | signed_up |
| --- | --- |
| 1 | 2023-12-30 |
| 2 | 2024-01-05 |
| 3 | 2024-01-20 |
| 4 | 2024-03-31 |
| 5 | 2024-04-01 |
| 6 | 2024-04-15 |
| 7 | 2024-06-30 |
| 8 | 2024-07-01 |

Report **every month from January to June 2024** — six rows, even for months with no signups — with the columns \`month\` (as \`YYYY-MM\`), \`signups\` (that month's count) and \`running_total\` (signups from January up to and including that month; signups before 2024 do not count). Order by \`month\`.

\`\`\`text
month | signups | running_total
2024-01 | 2 | 2
2024-02 | 0 | 2
2024-03 | 1 | 3
2024-04 | 2 | 5
2024-05 | 0 | 5
2024-06 | 1 | 6
\`\`\``,
          starter: String.raw`-- Six rows, 2024-01 to 2024-06: month (YYYY-MM), signups, running_total — ordered by month.
SELECT DATE_FORMAT(signed_up, '%Y-%m') AS month, COUNT(*) AS signups
FROM signups
GROUP BY DATE_FORMAT(signed_up, '%Y-%m')
ORDER BY month;
`,
          solution: String.raw`WITH RECURSIVE months AS (
  SELECT DATE('2024-01-01') AS month_start
  UNION ALL
  SELECT DATE_ADD(month_start, INTERVAL 1 MONTH)
  FROM months
  WHERE month_start < '2024-06-01'
)
SELECT DATE_FORMAT(m.month_start, '%Y-%m') AS month,
       COUNT(s.user_id) AS signups,
       SUM(COUNT(s.user_id)) OVER (ORDER BY m.month_start) AS running_total
FROM months AS m
LEFT JOIN signups AS s
  ON s.signed_up >= m.month_start
 AND s.signed_up <  DATE_ADD(m.month_start, INTERVAL 1 MONTH)
GROUP BY m.month_start
ORDER BY m.month_start;
`,
          hints: [
            "Generate the six month starts with a recursive CTE: from `DATE('2024-01-01')`, add `INTERVAL 1 MONTH` while below `'2024-06-01'`.",
            "LEFT JOIN signups whose date is `>=` the month start and `<` the next month start, and count `s.user_id`.",
            "A window over the grouped rows gives the running total: `SUM(COUNT(s.user_id)) OVER (ORDER BY m.month_start)`.",
          ],
          cases: [
            { stdin: SIGNUPS_1, expected: "month | signups | running_total\n2024-01 | 2 | 2\n2024-02 | 0 | 2\n2024-03 | 1 | 3\n2024-04 | 2 | 5\n2024-05 | 0 | 5\n2024-06 | 1 | 6\n" },
            {
              stdin: String.raw`CREATE TABLE signups (user_id INT PRIMARY KEY, signed_up DATE);
`,
              expected: "month | signups | running_total\n2024-01 | 0 | 0\n2024-02 | 0 | 0\n2024-03 | 0 | 0\n2024-04 | 0 | 0\n2024-05 | 0 | 0\n2024-06 | 0 | 0\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE signups (user_id INT PRIMARY KEY, signed_up DATE);
INSERT INTO signups VALUES (1, '2024-05-01'), (2, '2024-05-31'), (3, '2024-05-15'), (4, '2025-05-10');
`,
              expected: "month | signups | running_total\n2024-01 | 0 | 0\n2024-02 | 0 | 0\n2024-03 | 0 | 0\n2024-04 | 0 | 0\n2024-05 | 3 | 3\n2024-06 | 0 | 3\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A calendar is LEFT JOINed to `orders`. On a day with no orders, what do `COUNT(*)` and `COUNT(o.id)` return?",
          options: ["0 and 0", "1 and 0", "1 and 1", "NULL and 0"],
          answer: 1,
          explanation: "The LEFT JOIN keeps the calendar row with NULLs on the order side, so the group holds one row. COUNT(*) counts it; COUNT(o.id) counts only non-NULL ids.",
        },
        {
          prompt: "What happens to a MySQL recursive CTE that would need 1,500 iterations, with default settings?",
          options: [
            "It runs to completion",
            "It stops with an error, because `cte_max_recursion_depth` defaults to 1,000",
            "It silently returns the first 1,000 rows",
            "It loops forever",
          ],
          answer: 1,
          explanation: "MySQL aborts the statement once the recursion passes the limit. Raise the session variable, or use a calendar table or a cross join of smaller series.",
        },
        {
          prompt: "A calendar is LEFT JOINed to `orders`, and `WHERE o.status = 'paid'` is added. What goes wrong?",
          options: [
            "Nothing",
            "Empty days have a NULL status, fail the WHERE and disappear — the outer join behaves like an inner join",
            "Paid orders are counted twice",
            "The query fails",
          ],
          answer: 1,
          explanation: "Conditions on the right-hand table of a LEFT JOIN belong in the ON clause: `LEFT JOIN orders o ON o.ordered_on = c.day AND o.status = 'paid'`.",
        },
        {
          prompt: "Why start a month series on the first of the month?",
          options: [
            "DATE_ADD only works on the 1st",
            "Adding a month to the 31st clamps to a shorter month's last day (Jan 31 → Feb 29), and the series then drifts to that day for every later month",
            "DATE_FORMAT needs it",
            "It is required by RECURSIVE",
          ],
          answer: 1,
          explanation: "MySQL clamps an impossible date to the month's last day, so the next step starts from the 29th. Anchoring on the 1st avoids the drift, and half-open ranges (`>=` start, `<` next start) cover each whole month.",
        },
      ],
    },
    {
      slug: "patterns-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Longest attendance streak",
          prompt: `\`attendance\` records each day a student attended; a day may have been recorded twice.

| student | day |
| --- | --- |
| Ana | 2024-09-02 |
| Ana | 2024-09-03 |
| Ana | 2024-09-04 |
| Ana | 2024-09-06 |
| Ben | 2024-09-02 |
| Ben | 2024-09-04 |
| … | … |

For each student, return \`student\` and \`longest_streak\`: the length in days of their longest run of consecutive attended days. Order by \`longest_streak\` descending, then \`student\`.

\`\`\`text
student | longest_streak
Cy | 4
Ana | 3
Dee | 2
Ben | 1
\`\`\``,
          starter: String.raw`-- student, longest_streak (longest run of consecutive days) — ordered by longest_streak DESC, student.
SELECT student, COUNT(*) AS longest_streak
FROM attendance
GROUP BY student
ORDER BY longest_streak DESC, student;
`,
          solution: String.raw`WITH days AS (
  SELECT DISTINCT student, day FROM attendance
),
islands AS (
  SELECT student,
         DATE_SUB(day, INTERVAL ROW_NUMBER() OVER (PARTITION BY student ORDER BY day) DAY) AS grp
  FROM days
),
streaks AS (
  SELECT student, COUNT(*) AS len
  FROM islands
  GROUP BY student, grp
)
SELECT student, MAX(len) AS longest_streak
FROM streaks
GROUP BY student
ORDER BY longest_streak DESC, student;
`,
          hints: [
            "First find every streak with the row-number difference on the distinct days.",
            "Count each (student, group) to get every streak's length.",
            "Then take `MAX(len)` per student.",
          ],
          cases: [
            { stdin: ATTENDANCE_1, expected: "student | longest_streak\nCy | 4\nAna | 3\nDee | 2\nBen | 1\n" },
            {
              stdin: String.raw`CREATE TABLE attendance (student VARCHAR(20), day DATE);
INSERT INTO attendance VALUES
  ('Zia', '2024-01-01'), ('Zia', '2024-01-02'), ('Zia', '2024-01-05'), ('Zia', '2024-01-06'),
  ('Yan', '2024-01-31'), ('Yan', '2024-02-01');
`,
              expected: "student | longest_streak\nYan | 2\nZia | 2\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE attendance (student VARCHAR(20), day DATE);
INSERT INTO attendance VALUES ('Solo', '2024-04-04'), ('Solo', '2024-04-04');
`,
              expected: "student | longest_streak\nSolo | 1\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Tickets per month by status",
          prompt: `\`tickets\` has a status of \`open\`, \`pending\` or \`closed\`.

| id | opened_on | status |
| --- | --- | --- |
| 1 | 2024-01-03 | open |
| 2 | 2024-01-15 | closed |
| 3 | 2024-01-20 | closed |
| 4 | 2024-03-02 | pending |
| 5 | 2024-03-09 | open |
| 6 | 2024-04-30 | closed |

Report **every month** from the month of the first ticket to the month of the last, inclusive — including months with no tickets — with the columns \`month\` (\`YYYY-MM\`), \`open\`, \`pending\`, \`closed\` (the number of tickets opened that month with that status) and \`total\`. Order by \`month\`.

\`\`\`text
month | open | pending | closed | total
2024-01 | 1 | 0 | 2 | 3
2024-02 | 0 | 0 | 0 | 0
2024-03 | 1 | 1 | 0 | 2
2024-04 | 0 | 0 | 1 | 1
\`\`\``,
          starter: String.raw`-- Every month from the first ticket's to the last's: month, open, pending, closed, total — ordered by month.
SELECT DATE_FORMAT(opened_on, '%Y-%m') AS month, status, COUNT(*) AS tickets
FROM tickets
GROUP BY DATE_FORMAT(opened_on, '%Y-%m'), status
ORDER BY month, status;
`,
          solution: String.raw`WITH RECURSIVE bounds AS (
  SELECT DATE(DATE_FORMAT(MIN(opened_on), '%Y-%m-01')) AS first_month,
         DATE(DATE_FORMAT(MAX(opened_on), '%Y-%m-01')) AS last_month
  FROM tickets
),
months AS (
  SELECT first_month AS month_start FROM bounds
  UNION ALL
  SELECT DATE_ADD(m.month_start, INTERVAL 1 MONTH)
  FROM months AS m
  JOIN bounds AS b ON m.month_start < b.last_month
)
SELECT DATE_FORMAT(m.month_start, '%Y-%m') AS month,
       COUNT(CASE WHEN t.status = 'open'    THEN 1 END) AS open,
       COUNT(CASE WHEN t.status = 'pending' THEN 1 END) AS pending,
       COUNT(CASE WHEN t.status = 'closed'  THEN 1 END) AS closed,
       COUNT(t.id) AS total
FROM months AS m
LEFT JOIN tickets AS t
  ON t.opened_on >= m.month_start
 AND t.opened_on <  DATE_ADD(m.month_start, INTERVAL 1 MONTH)
GROUP BY m.month_start
ORDER BY m.month_start;
`,
          hints: [
            "Build the month starts with a recursive CTE, from the first ticket's month (`DATE_FORMAT(MIN(opened_on), '%Y-%m-01')`) to the last's.",
            "LEFT JOIN the tickets opened within each month and group by the month start.",
            "Pivot with one `COUNT(CASE WHEN t.status = '…' THEN 1 END)` per status, and `COUNT(t.id)` for the total.",
          ],
          cases: [
            { stdin: TICKETS_STATUS_1, expected: "month | open | pending | closed | total\n2024-01 | 1 | 0 | 2 | 3\n2024-02 | 0 | 0 | 0 | 0\n2024-03 | 1 | 1 | 0 | 2\n2024-04 | 0 | 0 | 1 | 1\n" },
            {
              stdin: String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, opened_on DATE, status VARCHAR(10));
INSERT INTO tickets VALUES (1, '2024-08-08', 'pending'), (2, '2024-08-31', 'pending');
`,
              expected: "month | open | pending | closed | total\n2024-08 | 0 | 2 | 0 | 2\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE tickets (id INT PRIMARY KEY, opened_on DATE, status VARCHAR(10));
INSERT INTO tickets VALUES (1, '2023-11-20', 'closed'), (2, '2024-02-01', 'open'), (3, '2024-02-29', 'closed');
`,
              expected: "month | open | pending | closed | total\n2023-11 | 0 | 0 | 1 | 1\n2023-12 | 0 | 0 | 0 | 0\n2024-01 | 0 | 0 | 0 | 0\n2024-02 | 1 | 0 | 1 | 2\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Top two pay levels per department",
          prompt: `\`employees\`:

| id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | eng | 120 |
| 2 | Bo | eng | 120 |
| 3 | Cara | eng | 100 |
| 4 | Dan | eng | 90 |
| 5 | Eli | ops | 70 |
| 6 | Fay | sales | 80 |
| 7 | Gus | sales | 95 |
| 8 | Hal | sales | 60 |

For every department, return \`dept\`, \`top_salary\` (the highest distinct salary), \`second_salary\` (the second-highest distinct salary, NULL if none) and \`gap\` (\`top_salary - second_salary\`, NULL if there is no second). Order by \`dept\`.

\`\`\`text
dept | top_salary | second_salary | gap
eng | 120 | 100 | 20
ops | 70 | NULL | NULL
sales | 95 | 80 | 15
\`\`\``,
          starter: String.raw`-- dept, top_salary, second_salary (NULL if none), gap — ordered by dept.
SELECT dept, MAX(salary) AS top_salary
FROM employees
GROUP BY dept
ORDER BY dept;
`,
          solution: String.raw`WITH ranked AS (
  SELECT dept, salary,
         DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk
  FROM employees
),
levels AS (
  SELECT dept,
         MAX(CASE WHEN rk = 1 THEN salary END) AS top_salary,
         MAX(CASE WHEN rk = 2 THEN salary END) AS second_salary
  FROM ranked
  GROUP BY dept
)
SELECT dept, top_salary, second_salary,
       top_salary - second_salary AS gap
FROM levels
ORDER BY dept;
`,
          hints: [
            "Rank salaries within each department with `DENSE_RANK()` so ties share a level.",
            "Pivot ranks 1 and 2 into columns with `MAX(CASE WHEN rk = 1 THEN salary END)` and the same for 2, grouped by dept.",
            "The gap is a plain subtraction; it is NULL automatically when the second level is NULL.",
          ],
          cases: [
            { stdin: EMPLOYEES_1, expected: "dept | top_salary | second_salary | gap\neng | 120 | 100 | 20\nops | 70 | NULL | NULL\nsales | 95 | 80 | 15\n" },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), dept VARCHAR(10), salary INT);
INSERT INTO employees VALUES (1, 'A', 'hr', 50), (2, 'B', 'hr', 50);
`,
              expected: "dept | top_salary | second_salary | gap\nhr | 50 | NULL | NULL\n",
              hidden: true,
            },
            {
              stdin: String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(20), dept VARCHAR(10), salary INT);
INSERT INTO employees VALUES
  (1, 'A', 'it', 10), (2, 'B', 'it', 30), (3, 'C', 'it', 20), (4, 'D', 'it', 30),
  (5, 'E', 'legal', 200), (6, 'F', 'legal', 150);
`,
              expected: "dept | top_salary | second_salary | gap\nit | 30 | 20 | 10\nlegal | 200 | 150 | 50\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A sequence of order ids is 1, 2, 3, 7, 8. What does `id - ROW_NUMBER() OVER (ORDER BY id)` give?",
          options: ["0, 0, 0, 3, 3", "0, 0, 0, 4, 4", "1, 1, 1, 2, 2", "0, 1, 2, 3, 4"],
          answer: 0,
          explanation: "Row numbers are 1–5, so the differences are 0, 0, 0, 7−4 = 3 and 8−5 = 3: two islands, labelled 0 and 3.",
        },
        {
          prompt: "Which query keeps exactly one row per `email`, the most recently updated?",
          options: [
            "`SELECT DISTINCT email, name, updated_at FROM t`",
            "`SELECT * FROM (SELECT t.*, ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC, id DESC) rn FROM t) x WHERE rn = 1`",
            "`SELECT email, name, MAX(updated_at) FROM t GROUP BY email`",
            "`SELECT * FROM t GROUP BY email HAVING COUNT(*) = 1`",
          ],
          answer: 1,
          explanation: "ROW_NUMBER with a total keeper rule picks one whole row per email. DISTINCT keeps rows that differ; selecting `name` beside MAX with GROUP BY email fails under ONLY_FULL_GROUP_BY or returns an arbitrary name; HAVING COUNT(*) = 1 drops the duplicated emails entirely.",
        },
        {
          prompt: "What does MySQL error 1093 complain about?",
          options: [
            "A duplicate key",
            "A DELETE or UPDATE whose subquery reads the table being modified",
            "A missing GROUP BY column",
            "Recursion past the limit",
          ],
          answer: 1,
          explanation: "\"You can't specify target table for update in FROM clause.\" Wrap the subquery in a derived table, or use a multi-table DELETE with a self-join.",
        },
        {
          prompt: "In MySQL, what does `SUM(status = 'open')` compute over a group?",
          options: [
            "An error — booleans cannot be summed",
            "The number of rows whose status is 'open', because a true comparison is 1 and false is 0",
            "The sum of the status column",
            "1 if any row is open",
          ],
          answer: 1,
          explanation: "It is an idiomatic MySQL count of matches. It is not portable: PostgreSQL refuses to SUM a boolean and writes `COUNT(*) FILTER (WHERE status = 'open')`.",
        },
        {
          prompt: "Which keyword stacks one SELECT per column when unpivoting, keeping every row?",
          options: ["`UNION`", "`UNION ALL`", "`INTERSECT`", "`JOIN`"],
          answer: 1,
          explanation: "UNION ALL keeps every row and skips the duplicate check that UNION performs.",
        },
        {
          prompt: "Payments exist on May 1, 3 and 9 only, one row each. On May 9, which rows does `SUM(amount) OVER (ORDER BY paid_on ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` add up?",
          options: ["Only May 9", "May 3 and May 9", "May 1, May 3 and May 9", "None"],
          answer: 2,
          explanation: "Six preceding *rows* reach back to May 1, eight days earlier. A true seven-day window on May 9 covers May 3 to May 9 only.",
        },
        {
          prompt: "What does the frame `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` compute with `AVG`?",
          options: [
            "A running average",
            "A centred three-row average: the previous row, this row and the next one",
            "The average of the whole partition",
            "A two-row average",
          ],
          answer: 1,
          explanation: "Frames can extend forward as well as back. On the first and last rows the frame has only two rows.",
        },
        {
          prompt: "Salaries are 900, 800, 800, 700. What is `SELECT (SELECT DISTINCT salary FROM e ORDER BY salary DESC LIMIT 1 OFFSET 2) AS x`?",
          options: ["800", "700", "NULL", "No rows"],
          answer: 1,
          explanation: "The distinct salaries are 900, 800, 700; skipping two leaves 700. The scalar-subquery wrapper would only matter if there were fewer than three distinct values.",
        },
        {
          prompt: "Why is `RANK() = 2` wrong for the second-highest salary when two people share the top salary?",
          options: [
            "RANK is not a window function",
            "RANK leaves a gap after the tie — both top earners are 1 and the next is 3 — so no row has rank 2",
            "RANK ignores ties",
            "RANK sorts ascending",
          ],
          answer: 1,
          explanation: "DENSE_RANK assigns 1, 1, 2, so rank 2 is the next distinct value.",
        },
        {
          prompt: "Which part of a recursive CTE decides the column's type in MySQL?",
          options: ["The recursive part", "The anchor (non-recursive) SELECT", "The outer query", "The longest value produced"],
          answer: 1,
          explanation: "The anchor's types are the CTE's types. Anchoring on a bare string literal can make the column too short for later values — cast the anchor with `DATE(…)` or `CAST(… AS DATE)`.",
        },
        {
          prompt: "What is PostgreSQL's built-in replacement for a recursive date series?",
          options: ["`DATE_RANGE()`", "`generate_series(start, stop, interval)`", "`CONNECT BY LEVEL`", "`SEQUENCE()`"],
          answer: 1,
          explanation: "`generate_series` returns the series directly. Oracle traditionally uses CONNECT BY LEVEL; MySQL and SQL Server use recursive CTEs.",
        },
        {
          prompt: "A gap-filling report must count only paid orders. Where does `o.status = 'paid'` go?",
          options: [
            "In WHERE",
            "In the LEFT JOIN's ON clause",
            "In HAVING",
            "In the recursive CTE",
          ],
          answer: 1,
          explanation: "In WHERE it would reject the NULL rows of empty days and turn the outer join into an inner one. In ON it only limits which orders join.",
        },
      ],
    },
  ],
});
