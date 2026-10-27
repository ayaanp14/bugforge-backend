import { defineModule } from "../../dsl.js";

// ── Setup scripts (each case's stdin) ───────────────────────────────────────

const EMP = String.raw`CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(30), dept VARCHAR(20), salary INT);
`;
const AVG_1 = EMP + String.raw`INSERT INTO employees VALUES
  (1, 'Asha', 'Eng', 90000), (2, 'Ben', 'Eng', 70000), (3, 'Chen', 'Sales', 50000),
  (4, 'Dev', 'Sales', 40000), (5, 'Eva', 'HR', 45000), (6, 'Gita', 'Eng', 65000);
`;
const AVG_2 = EMP + String.raw`INSERT INTO employees VALUES (1, 'A', 'Ops', 10), (2, 'B', 'Ops', 20), (3, 'C', 'Ops', 20);
`;
const AVG_3 = EMP + String.raw`INSERT INTO employees VALUES (1, 'Solo', 'IT', 50000);
`;

const REGION = String.raw`CREATE TABLE sales (id INT PRIMARY KEY, region VARCHAR(20), rep VARCHAR(20), amount DECIMAL(10,2));
`;
const REGION_1 = REGION + String.raw`INSERT INTO sales VALUES
  (1, 'North', 'Asha', 300), (2, 'North', 'Ben', 200), (3, 'North', 'Asha', 100),
  (4, 'South', 'Chen', 250), (5, 'South', 'Dev', 250), (6, 'South', 'Eva', 500),
  (7, 'West', 'Farah', 80);
`;
const REGION_2 = REGION + String.raw`INSERT INTO sales VALUES (1, 'East', 'Kai', 10), (2, 'East', 'Lin', 20), (3, 'East', 'Kai', 0);
`;
const REGION_3 = REGION + String.raw`INSERT INTO sales VALUES (1, 'Central', 'Om', 33.5), (2, 'Central', 'Pat', 66.5);
`;

const SCORES = String.raw`CREATE TABLE scores (player VARCHAR(20) PRIMARY KEY, score INT);
`;
const SCORES_1 = SCORES + String.raw`INSERT INTO scores VALUES
  ('Eva', 80), ('Asha', 90), ('Chen', 85), ('Farah', 70), ('Ben', 90), ('Dev', 80);
`;
const SCORES_2 = SCORES + String.raw`INSERT INTO scores VALUES ('Zed', 5), ('Amy', 10);
`;
const SCORES_3 = SCORES + String.raw`INSERT INTO scores VALUES ('C', 50), ('A', 50), ('B', 50);
`;

const RANK_1 = EMP + String.raw`INSERT INTO employees VALUES
  (1, 'Asha', 'Eng', 90000), (2, 'Ben', 'Eng', 70000), (3, 'Chen', 'Sales', 50000),
  (4, 'Dev', 'Sales', 40000), (5, 'Eva', 'HR', 45000), (6, 'Farah', 'Eng', 90000), (7, 'Gita', 'Eng', 60000);
`;
const RANK_2 = EMP + String.raw`INSERT INTO employees VALUES (1, 'A', 'Ops', 30), (2, 'B', 'Ops', 20), (3, 'C', 'Ops', 20), (4, 'D', 'Ops', 10);
`;
const RANK_3 = EMP + String.raw`INSERT INTO employees VALUES (1, 'Kai', 'Legal', 70000), (2, 'Lin', 'Admin', 30000);
`;

const DAILY = String.raw`CREATE TABLE daily_sales (day DATE PRIMARY KEY, revenue INT);
`;
const DAILY_1 = DAILY + String.raw`INSERT INTO daily_sales VALUES
  ('2024-03-01', 120), ('2024-03-02', 150), ('2024-03-03', 90), ('2024-03-04', 200);
`;
const DAILY_2 = DAILY + String.raw`INSERT INTO daily_sales VALUES ('2024-06-30', 75);
`;
const DAILY_3 = DAILY + String.raw`INSERT INTO daily_sales VALUES ('2024-01-03', 5), ('2024-01-01', 10), ('2024-01-02', NULL);
`;

const GAPS = String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(20), order_date DATE);
`;
const GAPS_1 = GAPS + String.raw`INSERT INTO orders VALUES
  (1, 'Asha', '2024-01-05'), (2, 'Chen', '2024-01-01'), (3, 'Asha', '2024-03-01'),
  (4, 'Ben', '2024-02-10'), (5, 'Asha', '2024-01-20'), (6, 'Chen', '2024-01-02');
`;
const GAPS_2 = GAPS + String.raw`INSERT INTO orders VALUES (1, 'Dee', '2024-05-05'), (2, 'Dee', '2024-05-05'), (3, 'Dee', '2024-05-10');
`;
const GAPS_3 = GAPS + String.raw`INSERT INTO orders VALUES (1, 'Eli', '2024-01-02'), (2, 'Eli', '2023-12-30');
`;

const TXN = String.raw`CREATE TABLE transactions (id INT PRIMARY KEY, account VARCHAR(10), txn_date DATE, amount INT);
`;
const TXN_1 = TXN + String.raw`INSERT INTO transactions VALUES
  (1, 'A', '2024-03-01', 100), (2, 'A', '2024-03-02', -40), (3, 'B', '2024-03-01', 500),
  (4, 'A', '2024-03-02', 25), (5, 'B', '2024-03-03', -200), (6, 'A', '2024-03-05', -10);
`;
const TXN_2 = TXN + String.raw`INSERT INTO transactions VALUES (3, 'Z', '2024-07-01', 30), (1, 'Z', '2024-07-01', 10), (2, 'Z', '2024-07-01', 20);
`;
const TXN_3 = TXN + String.raw`INSERT INTO transactions VALUES (1, 'Q', '2024-01-15', 999);
`;

const VISITS = String.raw`CREATE TABLE daily_visits (day DATE PRIMARY KEY, visits INT);
`;
const VISITS_1 = VISITS + String.raw`INSERT INTO daily_visits VALUES
  ('2024-03-01', 30), ('2024-03-02', 60), ('2024-03-03', 90), ('2024-03-04', 30), ('2024-03-05', 0);
`;
const VISITS_2 = VISITS + String.raw`INSERT INTO daily_visits VALUES
  ('2024-04-04', 7), ('2024-04-01', 10), ('2024-04-02', 20), ('2024-04-03', 25);
`;
const VISITS_3 = VISITS + String.raw`INSERT INTO daily_visits VALUES ('2024-05-01', 5), ('2024-05-02', 6);
`;

const TOP_1 = EMP + String.raw`INSERT INTO employees VALUES
  (1, 'Asha', 'Eng', 90000), (2, 'Ben', 'Eng', 70000), (3, 'Chen', 'Sales', 50000),
  (4, 'Dev', 'Sales', 40000), (5, 'Eva', 'HR', 45000), (6, 'Farah', 'Eng', 90000),
  (7, 'Gita', 'Eng', 60000), (8, 'Hari', 'Sales', 30000);
`;
const TOP_2 = RANK_2;
const TOP_3 = EMP + String.raw`INSERT INTO employees VALUES (1, 'Mo', 'Design', 55000);
`;

const LATEST = String.raw`CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(20), order_date DATE, amount INT);
`;
const LATEST_1 = LATEST + String.raw`INSERT INTO orders VALUES
  (1, 'Asha', '2024-01-05', 300), (2, 'Ben', '2024-02-01', 120), (3, 'Asha', '2024-03-01', 80),
  (4, 'Chen', '2024-02-15', 50), (5, 'Ben', '2024-02-01', 200), (6, 'Asha', '2024-02-20', 40);
`;
const LATEST_2 = LATEST + String.raw`INSERT INTO orders VALUES (1, 'Uma', '2024-08-08', 15);
`;
const LATEST_3 = LATEST + String.raw`INSERT INTO orders VALUES (10, 'Dee', '2024-05-01', 1), (2, 'Dee', '2024-06-01', 2);
`;

const SECOND_1 = EMP + String.raw`INSERT INTO employees VALUES
  (1, 'Asha', 'Eng', 90000), (2, 'Farah', 'Eng', 90000), (3, 'Ben', 'Eng', 70000),
  (4, 'Gita', 'Eng', 70000), (5, 'Ivan', 'Eng', 60000), (6, 'Chen', 'Sales', 50000),
  (7, 'Dev', 'Sales', 40000), (8, 'Eva', 'HR', 45000), (9, 'Kai', 'Ops', 30000), (10, 'Lin', 'Ops', 30000);
`;
const SECOND_2 = EMP + String.raw`INSERT INTO employees VALUES (1, 'Ana', 'Ops', 50000), (2, 'Bo', 'Ops', 50000), (3, 'Cy', 'IT', 40000);
`;
const SECOND_3 = EMP + String.raw`INSERT INTO employees VALUES (1, 'P', 'Data', 10), (2, 'Q', 'Data', 20), (3, 'R', 'Data', 30);
`;

const MONTHLY = String.raw`CREATE TABLE orders (id INT PRIMARY KEY, order_date DATE, amount INT);
`;
const MONTHLY_1 = MONTHLY + String.raw`INSERT INTO orders VALUES
  (1, '2024-01-04', 100), (2, '2024-01-19', 50), (3, '2024-02-02', 300), (4, '2024-03-11', 200),
  (5, '2024-03-30', 40), (6, '2024-04-15', 240);
`;
const MONTHLY_2 = MONTHLY + String.raw`INSERT INTO orders VALUES (1, '2024-07-07', 99);
`;
const MONTHLY_3 = MONTHLY + String.raw`INSERT INTO orders VALUES (1, '2024-02-14', 25), (2, '2023-12-24', 30), (3, '2024-02-29', 15);
`;

const PRODUCTS = String.raw`CREATE TABLE products (id INT PRIMARY KEY, category VARCHAR(20), name VARCHAR(30), price DECIMAL(10,2));
`;
const PRODUCTS_1 = PRODUCTS + String.raw`INSERT INTO products VALUES
  (1, 'Audio', 'Headphones', 4999), (2, 'Audio', 'Speaker', 2999), (3, 'Audio', 'Earbuds', 2999),
  (4, 'Audio', 'Cable', 299), (5, 'Video', 'TV', 39999), (6, 'Video', 'Projector', 25999),
  (7, 'Gaming', 'Console', 49999);
`;
const PRODUCTS_2 = PRODUCTS + String.raw`INSERT INTO products VALUES (1, 'Books', 'C', 100), (2, 'Books', 'B', 500), (3, 'Books', 'A', 500);
`;
const PRODUCTS_3 = PRODUCTS + String.raw`INSERT INTO products VALUES (1, 'Toys', 'Yo-yo', 49.25), (2, 'Toys', 'Kite', 99.5);
`;

export default defineModule(import.meta.url, {
  slug: "window-functions",
  title: "Window functions",
  blurb: "OVER and PARTITION BY for aggregates that keep every row, ROW_NUMBER, RANK, DENSE_RANK and NTILE with their tie rules, LAG, LEAD and FIRST_VALUE for comparing neighbours, frames with ROWS and RANGE for running totals and moving averages, and the top-N-per-group pattern.",
  icon: "grid",
  overview: `GROUP BY answers questions about groups by collapsing them; window functions answer questions about rows *in the context of* their group, and keep every row. Each employee beside their department's average, each day beside the day before, each transaction with the balance after it, each product with its rank in its category — all are one window function, written as a function followed by \`OVER (PARTITION BY … ORDER BY … frame)\`. MySQL has supported them since 8.0, and they are the feature interviewers probe most once the basics are settled, because the tie rules, the frame defaults and the order of evaluation are easy to get silently wrong.

OVER and PARTITION BY covers aggregates as window functions, \`OVER ()\` for the whole result, partitions, what an ORDER BY inside the window changes, where windows sit in the order of evaluation (after WHERE, GROUP BY and HAVING — so filtering on one needs an outer query), windows over grouped rows and named windows. Ranking functions covers \`ROW_NUMBER\`, \`RANK\`, \`DENSE_RANK\`, their behaviour on ties, the second-highest-salary question, deterministic tie-breakers, \`NTILE\`, \`PERCENT_RANK\` and \`CUME_DIST\`. LAG and LEAD covers offsets and defaults, change and growth, gaps between events, partitioned comparisons and \`FIRST_VALUE\`/\`LAST_VALUE\`/\`NTH_VALUE\`. Running totals and frames covers frame syntax, \`ROWS\` versus \`RANGE\`, moving averages, the default frame and its ties trap. Top N per group puts it together: rank in a CTE, filter outside, and choose the ranking function by what ties should mean.

The exercises are queries judged on real tables: each salary against its department average, each rep's share of their region, three rankings side by side and a per-department rank, day-over-day change and the days between a customer's orders, a running balance per account and a 3-day moving average, the top two salary levels per department and each customer's latest order. The checkpoint adds the second-highest salary in every department, month-over-month growth, and each product's rank and gap to its category leader.`,
  lessons: [
    {
      slug: "over-and-partition-by",
      file: "01-over-and-partition-by.md",
      exercises: [
        {
          title: "Salary against the department average",
          prompt: `Show every employee beside their department's average salary, and how far above or below it they are.

| employees: id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Eng | 90000 |
| 2 | Ben | Eng | 70000 |
| 3 | Chen | Sales | 50000 |
| 4 | Dev | Sales | 40000 |
| 5 | Eva | HR | 45000 |
| 6 | Gita | Eng | 65000 |

Return \`name\`, \`dept\`, \`salary\`, \`dept_avg\` (the department's average, \`ROUND\`ed to 2 places) and \`diff\` (salary minus the department average, \`ROUND\`ed to 2 places). Order by \`dept\`, then \`name\`.

\`\`\`text
name | dept | salary | dept_avg | diff
Asha | Eng | 90000 | 75000 | 15000
Ben | Eng | 70000 | 75000 | -5000
Gita | Eng | 65000 | 75000 | -10000
Eva | HR | 45000 | 45000 | 0
Chen | Sales | 50000 | 45000 | 5000
Dev | Sales | 40000 | 45000 | -5000
\`\`\`

Every employee keeps their own row — use a window, not GROUP BY.`,
          starter: String.raw`-- AVG(salary) OVER (PARTITION BY ...) beside every row
-- name | dept | salary | dept_avg | diff, ORDER BY dept, name.
`,
          solution: String.raw`SELECT name, dept, salary,
       ROUND(AVG(salary) OVER (PARTITION BY dept), 2) AS dept_avg,
       ROUND(salary - AVG(salary) OVER (PARTITION BY dept), 2) AS diff
FROM employees
ORDER BY dept, name;
`,
          hints: [
            "`AVG(salary) OVER (PARTITION BY dept)` gives each row its department's average without collapsing the rows.",
            "Do not put an ORDER BY inside the window — that would turn the average into a running one.",
            "Subtract the unrounded average and round the difference.",
          ],
          cases: [
            {
              stdin: AVG_1,
              expected: "name | dept | salary | dept_avg | diff\nAsha | Eng | 90000 | 75000 | 15000\nBen | Eng | 70000 | 75000 | -5000\nGita | Eng | 65000 | 75000 | -10000\nEva | HR | 45000 | 45000 | 0\nChen | Sales | 50000 | 45000 | 5000\nDev | Sales | 40000 | 45000 | -5000\n",
            },
            { stdin: AVG_2, expected: "name | dept | salary | dept_avg | diff\nA | Ops | 10 | 16.67 | -6.67\nB | Ops | 20 | 16.67 | 3.33\nC | Ops | 20 | 16.67 | 3.33\n", hidden: true },
            { stdin: AVG_3, expected: "name | dept | salary | dept_avg | diff\nSolo | IT | 50000 | 50000 | 0\n", hidden: true },
          ],
        },
        {
          title: "Each rep's share of the region",
          prompt: `\`sales\` has one row per sale. For each rep, show their total, their region's total, and their share of it.

| sales: id | region | rep | amount |
| --- | --- | --- | --- |
| 1 | North | Asha | 300 |
| 2 | North | Ben | 200 |
| 3 | North | Asha | 100 |
| 4 | South | Chen | 250 |
| 5 | South | Dev | 250 |
| 6 | South | Eva | 500 |
| 7 | West | Farah | 80 |

Return \`region\`, \`rep\`, \`total\` (the rep's sum), \`region_total\` (the region's sum) and \`pct_of_region\` (\`100 * total / region_total\`, \`ROUND\`ed to 1 place). Order by \`region\`, then \`total\` descending, then \`rep\`.

\`\`\`text
region | rep | total | region_total | pct_of_region
North | Asha | 400 | 600 | 66.7
North | Ben | 200 | 600 | 33.3
South | Eva | 500 | 1000 | 50
South | Chen | 250 | 1000 | 25
South | Dev | 250 | 1000 | 25
West | Farah | 80 | 80 | 100
\`\`\``,
          starter: String.raw`-- GROUP BY region, rep, then a window over the grouped rows for the region total.
-- region | rep | total | region_total | pct_of_region, ORDER BY region, total DESC, rep.
`,
          solution: String.raw`SELECT region, rep,
       SUM(amount) AS total,
       SUM(SUM(amount)) OVER (PARTITION BY region) AS region_total,
       ROUND(100 * SUM(amount) / SUM(SUM(amount)) OVER (PARTITION BY region), 1) AS pct_of_region
FROM sales
GROUP BY region, rep
ORDER BY region, total DESC, rep;
`,
          hints: [
            "Group by `region, rep` first: each rep becomes one row with `SUM(amount)`.",
            "Window functions run after GROUP BY, so `SUM(SUM(amount)) OVER (PARTITION BY region)` sums the reps' totals per region.",
            "A CTE with the per-rep totals and a plain `SUM(total) OVER (PARTITION BY region)` outside works too.",
          ],
          cases: [
            {
              stdin: REGION_1,
              expected: "region | rep | total | region_total | pct_of_region\nNorth | Asha | 400 | 600 | 66.7\nNorth | Ben | 200 | 600 | 33.3\nSouth | Eva | 500 | 1000 | 50\nSouth | Chen | 250 | 1000 | 25\nSouth | Dev | 250 | 1000 | 25\nWest | Farah | 80 | 80 | 100\n",
            },
            { stdin: REGION_2, expected: "region | rep | total | region_total | pct_of_region\nEast | Lin | 20 | 30 | 66.7\nEast | Kai | 10 | 30 | 33.3\n", hidden: true },
            { stdin: REGION_3, expected: "region | rep | total | region_total | pct_of_region\nCentral | Pat | 66.5 | 100 | 66.5\nCentral | Om | 33.5 | 100 | 33.5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`employees` has 5 rows in 3 departments. How many rows does this return?\n\n```sql\nSELECT dept, AVG(salary) OVER (PARTITION BY dept) FROM employees;\n```",
          options: ["3", "5", "1", "15"],
          answer: 1,
          explanation: "A window function keeps every input row: 5 rows, each with its department's average. `GROUP BY dept` would return 3. Add DISTINCT if you want one row per department from the window version.",
        },
        {
          prompt: "Why is this query refused?\n\n```sql\nSELECT name, RANK() OVER (ORDER BY salary DESC) AS r\nFROM employees\nWHERE RANK() OVER (ORDER BY salary DESC) <= 3;\n```",
          options: [
            "RANK needs PARTITION BY",
            "Window functions are evaluated after WHERE, so WHERE cannot use them",
            "The alias r must be used instead",
            "RANK cannot be used with DESC",
          ],
          answer: 1,
          explanation: "WHERE runs before window functions are computed. Compute the rank in a CTE or derived table and filter on it outside. Using the alias in WHERE fails for the same reason; PARTITION BY is optional.",
        },
        {
          prompt: "What changes when you add `ORDER BY day` inside `SUM(amount) OVER (PARTITION BY store)`?",
          options: [
            "Nothing — it only sorts the output",
            "The sum becomes a running total from the partition's first row to the current row",
            "The query's rows are returned sorted by day",
            "It is an error: aggregates cannot be ordered",
          ],
          answer: 1,
          explanation: "With an ORDER BY, the default frame becomes \"from the start of the partition up to the current row\", so SUM turns into a running total. The output order is still decided only by the query's own ORDER BY.",
        },
        {
          prompt: "What does `COUNT(*) OVER ()` put on each row?",
          options: [
            "1",
            "The row's position",
            "The total number of rows in the result (after WHERE)",
            "The number of rows in the table, ignoring WHERE",
          ],
          answer: 2,
          explanation: "Empty `OVER ()` is one window over all rows that reached the window stage — after WHERE, GROUP BY and HAVING. Rows filtered out by WHERE are not counted.",
        },
        {
          prompt: "Which query puts each department's payroll as a percentage of the company's beside the department?",
          options: [
            "`SELECT dept, SUM(salary) * 100 / SUM(salary) FROM employees GROUP BY dept`",
            "`SELECT dept, 100 * SUM(salary) / SUM(SUM(salary)) OVER () FROM employees GROUP BY dept`",
            "`SELECT dept, 100 * salary / SUM(salary) OVER () FROM employees GROUP BY dept`",
            "`SELECT dept, 100 * SUM(salary) OVER (PARTITION BY dept) FROM employees GROUP BY dept`",
          ],
          answer: 1,
          explanation: "After GROUP BY each department is a row; `SUM(SUM(salary)) OVER ()` sums those group totals across all rows. The first option divides each group by itself (always 100), and the others mix ungrouped columns or never divide by the company total.",
        },
      ],
    },
    {
      slug: "ranking-functions",
      file: "02-ranking-functions.md",
      exercises: [
        {
          title: "Three rankings side by side",
          prompt: `Rank the players by score, highest first, in the three standard ways.

| scores: player | score |
| --- | --- |
| Eva | 80 |
| Asha | 90 |
| Chen | 85 |
| Farah | 70 |
| Ben | 90 |
| Dev | 80 |

Return \`player\`, \`score\`, \`row_num\` (\`ROW_NUMBER\` by score descending, ties broken by \`player\`), \`rnk\` (\`RANK\` by score descending) and \`dense_rnk\` (\`DENSE_RANK\` by score descending). Order by \`score\` descending, then \`player\`.

\`\`\`text
player | score | row_num | rnk | dense_rnk
Asha | 90 | 1 | 1 | 1
Ben | 90 | 2 | 1 | 1
Chen | 85 | 3 | 3 | 2
Dev | 80 | 4 | 4 | 3
Eva | 80 | 5 | 4 | 3
Farah | 70 | 6 | 6 | 4
\`\`\``,
          starter: String.raw`-- ROW_NUMBER, RANK and DENSE_RANK over score DESC
-- player | score | row_num | rnk | dense_rnk, ORDER BY score DESC, player.
`,
          solution: String.raw`SELECT player, score,
       ROW_NUMBER() OVER (ORDER BY score DESC, player) AS row_num,
       RANK() OVER (ORDER BY score DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY score DESC) AS dense_rnk
FROM scores
ORDER BY score DESC, player;
`,
          hints: [
            "Each function gets its own `OVER (ORDER BY score DESC …)`.",
            "Only `ROW_NUMBER` needs the `player` tie-breaker inside its window — the other two give ties the same number anyway.",
            "Don't alias a column `rank`: it is a reserved word in MySQL 8.",
          ],
          cases: [
            {
              stdin: SCORES_1,
              expected: "player | score | row_num | rnk | dense_rnk\nAsha | 90 | 1 | 1 | 1\nBen | 90 | 2 | 1 | 1\nChen | 85 | 3 | 3 | 2\nDev | 80 | 4 | 4 | 3\nEva | 80 | 5 | 4 | 3\nFarah | 70 | 6 | 6 | 4\n",
            },
            { stdin: SCORES_2, expected: "player | score | row_num | rnk | dense_rnk\nAmy | 10 | 1 | 1 | 1\nZed | 5 | 2 | 2 | 2\n", hidden: true },
            { stdin: SCORES_3, expected: "player | score | row_num | rnk | dense_rnk\nA | 50 | 1 | 1 | 1\nB | 50 | 2 | 1 | 1\nC | 50 | 3 | 1 | 1\n", hidden: true },
          ],
        },
        {
          title: "Rank within each department",
          prompt: `Rank employees by salary within their own department, highest first, so that equal salaries share a rank and the next salary gets the next number.

| employees: id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Eng | 90000 |
| 2 | Ben | Eng | 70000 |
| 3 | Chen | Sales | 50000 |
| 4 | Dev | Sales | 40000 |
| 5 | Eva | HR | 45000 |
| 6 | Farah | Eng | 90000 |
| 7 | Gita | Eng | 60000 |

Return \`dept\`, \`name\`, \`salary\` and \`dept_rank\`. Order by \`dept\`, \`dept_rank\`, then \`name\`.

\`\`\`text
dept | name | salary | dept_rank
Eng | Asha | 90000 | 1
Eng | Farah | 90000 | 1
Eng | Ben | 70000 | 2
Eng | Gita | 60000 | 3
HR | Eva | 45000 | 1
Sales | Chen | 50000 | 1
Sales | Dev | 40000 | 2
\`\`\``,
          starter: String.raw`-- A ranking that restarts per department, ties share a number, no gaps.
-- dept | name | salary | dept_rank, ORDER BY dept, dept_rank, name.
`,
          solution: String.raw`SELECT dept, name, salary,
       DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank
FROM employees
ORDER BY dept, dept_rank, name;
`,
          hints: [
            "`PARTITION BY dept` restarts the numbering for every department.",
            "Ties share a rank and the next salary is the next number: that is `DENSE_RANK`, not `RANK`.",
          ],
          cases: [
            {
              stdin: RANK_1,
              expected: "dept | name | salary | dept_rank\nEng | Asha | 90000 | 1\nEng | Farah | 90000 | 1\nEng | Ben | 70000 | 2\nEng | Gita | 60000 | 3\nHR | Eva | 45000 | 1\nSales | Chen | 50000 | 1\nSales | Dev | 40000 | 2\n",
            },
            { stdin: RANK_2, expected: "dept | name | salary | dept_rank\nOps | A | 30 | 1\nOps | B | 20 | 2\nOps | C | 20 | 2\nOps | D | 10 | 3\n", hidden: true },
            { stdin: RANK_3, expected: "dept | name | salary | dept_rank\nAdmin | Lin | 30000 | 1\nLegal | Kai | 70000 | 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Salaries are 100, 100, 90, 80. What does `RANK() OVER (ORDER BY salary DESC)` give the 90?",
          options: ["2", "3", "1", "4"],
          answer: 1,
          explanation: "RANK gives tied rows the same number and then skips: 1, 1, 3, 4. DENSE_RANK would give the 90 rank 2; ROW_NUMBER would give 3 but number the two 100s 1 and 2.",
        },
        {
          prompt: "Which function correctly finds the second highest *distinct* salary when the top salary is shared?",
          options: ["`ROW_NUMBER`", "`RANK`", "`DENSE_RANK`", "`NTILE(2)`"],
          answer: 2,
          explanation: "With 100, 100, 90, DENSE_RANK gives 1, 1, 2, so rank 2 is 90. RANK gives 1, 1, 3 — no rank 2 at all — and ROW_NUMBER's row 2 is the second 100. NTILE splits rows into halves, not distinct values.",
        },
        {
          prompt: "Why add `id` to `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC)`?",
          options: [
            "ROW_NUMBER requires at least two ORDER BY columns",
            "Without a unique tie-breaker, two orders on the same date can be numbered either way, so row 1 is not deterministic",
            "It makes the query use an index",
            "It sorts the output by id",
          ],
          answer: 1,
          explanation: "ROW_NUMBER must give tied rows different numbers; if the ORDER BY does not decide, the engine does, arbitrarily. A unique column makes the choice repeatable. It does not order the output — the final ORDER BY does.",
        },
        {
          prompt: "`NTILE(4)` over 10 ordered rows produces groups of which sizes?",
          options: ["3, 3, 2, 2", "2, 2, 3, 3", "2, 2, 2, 4", "3, 3, 3, 1"],
          answer: 0,
          explanation: "NTILE makes the groups as equal as possible and gives the remainder to the first groups: 10 = 4 × 2 + 2, so the first two groups get one extra row.",
        },
      ],
    },
    {
      slug: "lag-and-lead",
      file: "03-lag-and-lead.md",
      exercises: [
        {
          title: "Day-over-day change",
          prompt: `Show each day's revenue beside the previous day's and the change between them.

| daily_sales: day | revenue |
| --- | --- |
| 2024-03-01 | 120 |
| 2024-03-02 | 150 |
| 2024-03-03 | 90 |
| 2024-03-04 | 200 |

Return \`day\`, \`revenue\`, \`prev_revenue\` (the revenue of the previous row by day; NULL for the first) and \`change\` (\`revenue - prev_revenue\`). Order by \`day\`.

\`\`\`text
day | revenue | prev_revenue | change
2024-03-01 | 120 | NULL | NULL
2024-03-02 | 150 | 120 | 30
2024-03-03 | 90 | 150 | -60
2024-03-04 | 200 | 90 | 110
\`\`\`

A day's revenue can be NULL (not yet reported); then its change is NULL, and so is the next day's change.`,
          starter: String.raw`-- LAG(revenue) OVER (ORDER BY day)
-- day | revenue | prev_revenue | change, ORDER BY day.
`,
          solution: String.raw`SELECT day, revenue,
       LAG(revenue) OVER (ORDER BY day) AS prev_revenue,
       revenue - LAG(revenue) OVER (ORDER BY day) AS change
FROM daily_sales
ORDER BY day;
`,
          hints: [
            "`LAG(revenue) OVER (ORDER BY day)` is the previous day's revenue; the first row has none, so it is NULL.",
            "Any arithmetic with NULL is NULL, so `change` needs no special case.",
          ],
          cases: [
            {
              stdin: DAILY_1,
              expected: "day | revenue | prev_revenue | change\n2024-03-01 | 120 | NULL | NULL\n2024-03-02 | 150 | 120 | 30\n2024-03-03 | 90 | 150 | -60\n2024-03-04 | 200 | 90 | 110\n",
            },
            { stdin: DAILY_2, expected: "day | revenue | prev_revenue | change\n2024-06-30 | 75 | NULL | NULL\n", hidden: true },
            {
              stdin: DAILY_3,
              expected: "day | revenue | prev_revenue | change\n2024-01-01 | 10 | NULL | NULL\n2024-01-02 | NULL | 10 | NULL\n2024-01-03 | 5 | NULL | NULL\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Days between a customer's orders",
          prompt: `For each order, show how many days passed since the same customer's previous order, and the date of their next one.

| orders: id | customer | order_date |
| --- | --- | --- |
| 1 | Asha | 2024-01-05 |
| 2 | Chen | 2024-01-01 |
| 3 | Asha | 2024-03-01 |
| 4 | Ben | 2024-02-10 |
| 5 | Asha | 2024-01-20 |
| 6 | Chen | 2024-01-02 |

Return \`customer\`, \`order_date\`, \`days_since_prev\` (days since that customer's previous order, NULL for their first) and \`next_order\` (the date of their next order, NULL for their last). A customer's orders are in \`order_date\` order, then \`id\`. Order the result by \`customer\`, \`order_date\`, then \`id\`.

\`\`\`text
customer | order_date | days_since_prev | next_order
Asha | 2024-01-05 | NULL | 2024-01-20
Asha | 2024-01-20 | 15 | 2024-03-01
Asha | 2024-03-01 | 41 | NULL
Ben | 2024-02-10 | NULL | NULL
Chen | 2024-01-01 | NULL | 2024-01-02
Chen | 2024-01-02 | 1 | NULL
\`\`\``,
          starter: String.raw`-- LAG and LEAD partitioned by customer; DATEDIFF(later, earlier) for days.
-- customer | order_date | days_since_prev | next_order, ORDER BY customer, order_date, id.
`,
          solution: String.raw`SELECT customer, order_date,
       DATEDIFF(order_date, LAG(order_date) OVER w) AS days_since_prev,
       LEAD(order_date) OVER w AS next_order
FROM orders
WINDOW w AS (PARTITION BY customer ORDER BY order_date, id)
ORDER BY customer, order_date, id;
`,
          hints: [
            "Partition by `customer` so a customer's first order does not look back at someone else's.",
            "`DATEDIFF(order_date, LAG(order_date) OVER (…))` — MySQL's DATEDIFF is later minus earlier, in days.",
            "Both functions share one window; a `WINDOW w AS (…)` clause saves writing it twice.",
          ],
          cases: [
            {
              stdin: GAPS_1,
              expected: "customer | order_date | days_since_prev | next_order\nAsha | 2024-01-05 | NULL | 2024-01-20\nAsha | 2024-01-20 | 15 | 2024-03-01\nAsha | 2024-03-01 | 41 | NULL\nBen | 2024-02-10 | NULL | NULL\nChen | 2024-01-01 | NULL | 2024-01-02\nChen | 2024-01-02 | 1 | NULL\n",
            },
            {
              stdin: GAPS_2,
              expected: "customer | order_date | days_since_prev | next_order\nDee | 2024-05-05 | NULL | 2024-05-05\nDee | 2024-05-05 | 0 | 2024-05-10\nDee | 2024-05-10 | 5 | NULL\n",
              hidden: true,
            },
            { stdin: GAPS_3, expected: "customer | order_date | days_since_prev | next_order\nEli | 2023-12-30 | NULL | 2024-01-02\nEli | 2024-01-02 | 3 | NULL\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `LAG(revenue, 1, 0) OVER (ORDER BY day)` return on a row whose previous row's revenue is NULL?",
          options: ["0", "NULL", "The current row's revenue", "An error"],
          answer: 1,
          explanation: "The default (0) replaces only a *missing* row, such as the first row's. Here the previous row exists, and its value is NULL, so LAG returns NULL.",
        },
        {
          prompt: "Days are stored one row per day, but some days are missing. What does `LAG(visits, 7) OVER (ORDER BY day)` return?",
          options: [
            "The visits exactly seven calendar days earlier",
            "The visits seven rows earlier, which may be more than seven days ago",
            "NULL whenever a day is missing",
            "The average of the last seven days",
          ],
          answer: 1,
          explanation: "The offset counts rows, not days. Fill the missing days first, or compare by date with a join or a RANGE frame.",
        },
        {
          prompt: "You compute `days_since_prev` with `LAG(order_date) OVER (ORDER BY order_date)` and no PARTITION BY. What goes wrong?",
          options: [
            "Nothing",
            "Each customer's first order is compared with another customer's previous order",
            "LAG returns only NULLs",
            "The query is refused",
          ],
          answer: 1,
          explanation: "Without a partition, \"previous\" means the previous row in the whole table. `PARTITION BY customer` keeps each comparison inside one customer, and their first order gets NULL.",
        },
        {
          prompt: "With `OVER (PARTITION BY dept ORDER BY salary DESC)` and the default frame, what does `LAST_VALUE(name)` return?",
          options: [
            "The lowest-paid name in the department",
            "The current row's name (or that of its last salary tie)",
            "The highest-paid name",
            "NULL",
          ],
          answer: 1,
          explanation: "With an ORDER BY, the default frame ends at the current row and its peers, so the frame's last row is (a tie of) the current row. Use `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, or reverse the order and use FIRST_VALUE.",
        },
      ],
    },
    {
      slug: "running-totals-and-frames",
      file: "04-running-totals-and-frames.md",
      exercises: [
        {
          title: "A running balance per account",
          prompt: `Show the balance of each account after every transaction. Transactions on the same date are applied in \`id\` order, so each gets its own balance.

| transactions: id | account | txn_date | amount |
| --- | --- | --- | --- |
| 1 | A | 2024-03-01 | 100 |
| 2 | A | 2024-03-02 | -40 |
| 3 | B | 2024-03-01 | 500 |
| 4 | A | 2024-03-02 | 25 |
| 5 | B | 2024-03-03 | -200 |
| 6 | A | 2024-03-05 | -10 |

Return \`account\`, \`txn_date\`, \`amount\` and \`balance\` (the sum of the account's amounts up to and including this transaction). Order by \`account\`, \`txn_date\`, then \`id\`.

\`\`\`text
account | txn_date | amount | balance
A | 2024-03-01 | 100 | 100
A | 2024-03-02 | -40 | 60
A | 2024-03-02 | 25 | 85
A | 2024-03-05 | -10 | 75
B | 2024-03-01 | 500 | 500
B | 2024-03-03 | -200 | 300
\`\`\`

Note the two transactions on 2024-03-02: each has its own balance.`,
          starter: String.raw`-- SUM(amount) OVER (PARTITION BY account ORDER BY ... ROWS ...)
-- account | txn_date | amount | balance, ORDER BY account, txn_date, id.
`,
          solution: String.raw`SELECT account, txn_date, amount,
       SUM(amount) OVER (PARTITION BY account ORDER BY txn_date, id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance
FROM transactions
ORDER BY account, txn_date, id;
`,
          hints: [
            "Partition by `account` so each balance starts from zero.",
            "With only `ORDER BY txn_date`, the default RANGE frame gives both 2024-03-02 rows the same total — order by `txn_date, id`.",
            "State the frame: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.",
          ],
          cases: [
            {
              stdin: TXN_1,
              expected: "account | txn_date | amount | balance\nA | 2024-03-01 | 100 | 100\nA | 2024-03-02 | -40 | 60\nA | 2024-03-02 | 25 | 85\nA | 2024-03-05 | -10 | 75\nB | 2024-03-01 | 500 | 500\nB | 2024-03-03 | -200 | 300\n",
            },
            { stdin: TXN_2, expected: "account | txn_date | amount | balance\nZ | 2024-07-01 | 10 | 10\nZ | 2024-07-01 | 20 | 30\nZ | 2024-07-01 | 30 | 60\n", hidden: true },
            { stdin: TXN_3, expected: "account | txn_date | amount | balance\nQ | 2024-01-15 | 999 | 999\n", hidden: true },
          ],
        },
        {
          title: "A 3-day moving average",
          prompt: `Smooth the daily visit counts with a moving average over the current day and the two before it. There is one row per day; the first two days average over the rows that exist.

| daily_visits: day | visits |
| --- | --- |
| 2024-03-01 | 30 |
| 2024-03-02 | 60 |
| 2024-03-03 | 90 |
| 2024-03-04 | 30 |
| 2024-03-05 | 0 |

Return \`day\`, \`visits\` and \`moving_avg_3\` (\`ROUND\`ed to 2 places). Order by \`day\`.

\`\`\`text
day | visits | moving_avg_3
2024-03-01 | 30 | 30
2024-03-02 | 60 | 45
2024-03-03 | 90 | 60
2024-03-04 | 30 | 60
2024-03-05 | 0 | 40
\`\`\``,
          starter: String.raw`-- AVG(visits) OVER (ORDER BY day ROWS BETWEEN ... AND CURRENT ROW)
-- day | visits | moving_avg_3, ORDER BY day.
`,
          solution: String.raw`SELECT day, visits,
       ROUND(AVG(visits) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3
FROM daily_visits
ORDER BY day;
`,
          hints: [
            "The frame is the current row and the two before it: `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`.",
            "At the start of the data the frame is clipped, so day one averages one row and day two averages two.",
            "Round the average to 2 places.",
          ],
          cases: [
            {
              stdin: VISITS_1,
              expected: "day | visits | moving_avg_3\n2024-03-01 | 30 | 30\n2024-03-02 | 60 | 45\n2024-03-03 | 90 | 60\n2024-03-04 | 30 | 60\n2024-03-05 | 0 | 40\n",
            },
            { stdin: VISITS_2, expected: "day | visits | moving_avg_3\n2024-04-01 | 10 | 10\n2024-04-02 | 20 | 15\n2024-04-03 | 25 | 18.33\n2024-04-04 | 7 | 17.33\n", hidden: true },
            { stdin: VISITS_3, expected: "day | visits | moving_avg_3\n2024-05-01 | 5 | 5\n2024-05-02 | 6 | 5.5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the default frame of `SUM(x) OVER (ORDER BY d)`?",
          options: [
            "`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`",
            "`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`",
            "`ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`",
            "`RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING`",
          ],
          answer: 1,
          explanation: "With an ORDER BY and no frame, the frame is RANGE from the partition's start to the current row *including its peers*. Without an ORDER BY it is the whole partition.",
        },
        {
          prompt: "Rows: (d=1, x=10), (d=2, x=5), (d=2, x=7). What does `SUM(x) OVER (ORDER BY d)` give the two d=2 rows?",
          options: ["15 and 22", "22 and 22", "15 and 15", "5 and 7"],
          answer: 1,
          explanation: "The default RANGE frame includes every peer of the current row, so both d=2 rows see 10 + 5 + 7 = 22. A ROWS frame with a tie-breaker would give 15 and 22.",
        },
        {
          prompt: "Which frame is a true 7-day window on a `day DATE` column even when days are missing?",
          options: [
            "`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`",
            "`RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW`",
            "`ROWS BETWEEN 7 PRECEDING AND CURRENT ROW`",
            "`RANGE BETWEEN 6 PRECEDING AND 6 FOLLOWING`",
          ],
          answer: 1,
          explanation: "RANGE measures by value, so an interval offset on a date covers calendar days whatever the number of rows. ROWS counts rows, which spans more than a week when days are missing.",
        },
        {
          prompt: "Which function is *not* affected by a frame clause?",
          options: ["`SUM`", "`FIRST_VALUE`", "`ROW_NUMBER`", "`AVG`"],
          answer: 2,
          explanation: "Ranking functions and LAG/LEAD always work on the whole ordered partition; MySQL accepts a frame on them and ignores it. Aggregates and FIRST_VALUE/LAST_VALUE/NTH_VALUE use the frame.",
        },
        {
          prompt: "A 3-row moving average uses `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`. What does the partition's first row get?",
          options: ["NULL", "Its own value — the frame is clipped to one row", "0", "The average of the first three rows"],
          answer: 1,
          explanation: "A frame never extends past the partition's edges, so the first row averages only itself and the second averages two rows. Blank them out explicitly if the report wants full windows only.",
        },
      ],
    },
    {
      slug: "top-n-per-group",
      file: "05-top-n-per-group.md",
      exercises: [
        {
          title: "The top two salary levels per department",
          prompt: `For each department, list every employee whose salary is one of the department's **two highest distinct salaries** — so everyone tied at a level is included.

| employees: id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Eng | 90000 |
| 2 | Ben | Eng | 70000 |
| 3 | Chen | Sales | 50000 |
| 4 | Dev | Sales | 40000 |
| 5 | Eva | HR | 45000 |
| 6 | Farah | Eng | 90000 |
| 7 | Gita | Eng | 60000 |
| 8 | Hari | Sales | 30000 |

Return \`dept\`, \`name\` and \`salary\`. Order by \`dept\`, \`salary\` descending, then \`name\`.

\`\`\`text
dept | name | salary
Eng | Asha | 90000
Eng | Farah | 90000
Eng | Ben | 70000
HR | Eva | 45000
Sales | Chen | 50000
Sales | Dev | 40000
\`\`\``,
          starter: String.raw`-- Rank in a CTE, filter outside.
-- dept | name | salary, ORDER BY dept, salary DESC, name.
`,
          solution: String.raw`WITH ranked AS (
  SELECT dept, name, salary,
         DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS lvl
  FROM employees
)
SELECT dept, name, salary
FROM ranked
WHERE lvl <= 2
ORDER BY dept, salary DESC, name;
`,
          hints: [
            "\"Two highest distinct salaries\" is the dense rank of the salary within the department.",
            "WHERE cannot see a window function — compute the rank in a CTE and filter it in the outer query.",
            "With `RANK`, Ben would rank 3 behind the two 90000s and be left out.",
          ],
          cases: [
            { stdin: TOP_1, expected: "dept | name | salary\nEng | Asha | 90000\nEng | Farah | 90000\nEng | Ben | 70000\nHR | Eva | 45000\nSales | Chen | 50000\nSales | Dev | 40000\n" },
            { stdin: TOP_2, expected: "dept | name | salary\nOps | A | 30\nOps | B | 20\nOps | C | 20\n", hidden: true },
            { stdin: TOP_3, expected: "dept | name | salary\nDesign | Mo | 55000\n", hidden: true },
          ],
        },
        {
          title: "Each customer's latest order",
          prompt: `Show each customer's most recent order. When a customer has two orders on the same latest date, the one with the higher \`id\` counts as the latest.

| orders: id | customer | order_date | amount |
| --- | --- | --- | --- |
| 1 | Asha | 2024-01-05 | 300 |
| 2 | Ben | 2024-02-01 | 120 |
| 3 | Asha | 2024-03-01 | 80 |
| 4 | Chen | 2024-02-15 | 50 |
| 5 | Ben | 2024-02-01 | 200 |
| 6 | Asha | 2024-02-20 | 40 |

Return \`customer\`, \`order_id\`, \`order_date\` and \`amount\` — exactly one row per customer. Order by \`customer\`.

\`\`\`text
customer | order_id | order_date | amount
Asha | 3 | 2024-03-01 | 80
Ben | 5 | 2024-02-01 | 200
Chen | 4 | 2024-02-15 | 50
\`\`\``,
          starter: String.raw`-- ROW_NUMBER per customer, newest first, keep row 1.
-- customer | order_id | order_date | amount, ORDER BY customer.
`,
          solution: String.raw`WITH latest AS (
  SELECT customer, id AS order_id, order_date, amount,
         ROW_NUMBER() OVER (PARTITION BY customer ORDER BY order_date DESC, id DESC) AS rn
  FROM orders
)
SELECT customer, order_id, order_date, amount
FROM latest
WHERE rn = 1
ORDER BY customer;
`,
          hints: [
            "Exactly one row per customer means `ROW_NUMBER`, not `RANK`.",
            "Order each customer's rows by `order_date DESC, id DESC` so the tie on Ben's date is decided by id.",
            "Keep `rn = 1` in the outer query.",
          ],
          cases: [
            { stdin: LATEST_1, expected: "customer | order_id | order_date | amount\nAsha | 3 | 2024-03-01 | 80\nBen | 5 | 2024-02-01 | 200\nChen | 4 | 2024-02-15 | 50\n" },
            { stdin: LATEST_2, expected: "customer | order_id | order_date | amount\nUma | 1 | 2024-08-08 | 15\n", hidden: true },
            { stdin: LATEST_3, expected: "customer | order_id | order_date | amount\nDee | 2 | 2024-06-01 | 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Eng salaries are 90, 90, 90, 70. Which ranking makes `WHERE r <= 2` return exactly two Eng employees?",
          options: ["`RANK()`", "`DENSE_RANK()`", "`ROW_NUMBER()` with a tie-breaker", "Any of them"],
          answer: 2,
          explanation: "ROW_NUMBER numbers 1, 2, 3, 4, so exactly two pass (the tie-breaker decides which). RANK gives 1, 1, 1, 4 — three pass. DENSE_RANK gives 1, 1, 1, 2 — all four pass.",
        },
        {
          prompt: "Why does the top-N-per-group pattern need a CTE or derived table?",
          options: [
            "PARTITION BY only works inside a CTE",
            "The rank must be filtered, and WHERE runs before window functions are computed",
            "CTEs are faster",
            "ROW_NUMBER cannot appear in a SELECT list",
          ],
          answer: 1,
          explanation: "The window is computed after WHERE, so the filter on its value has to happen one level up. Some warehouses offer `QUALIFY` for this; MySQL does not.",
        },
        {
          prompt: "This pre-window query returns the highest-paid employees per department. What does it do when two people share the top salary?\n\n```sql\nSELECT e.dept, e.name, e.salary\nFROM employees e\nJOIN (SELECT dept, MAX(salary) AS top FROM employees GROUP BY dept) m\n  ON m.dept = e.dept AND m.top = e.salary;\n```",
          options: ["Returns one of them at random", "Returns both", "Returns neither", "Raises an error"],
          answer: 1,
          explanation: "Both rows match the department's MAX, so both are returned — the same result as RANK() = 1. For exactly one per department you need a tie-breaker, which ROW_NUMBER expresses directly.",
        },
        {
          prompt: "You need each category's top 3 products *and* each product's share of its category's revenue. Where should the category total be computed?",
          options: [
            "After filtering to the top 3, with SUM over the remaining rows",
            "In the same CTE as the rank, before the filter, with `SUM(revenue) OVER (PARTITION BY category)`",
            "In the final ORDER BY",
            "It cannot be done in one query",
          ],
          answer: 1,
          explanation: "Once the outer WHERE keeps only the top 3, the other products' revenue is gone, so a total computed afterwards would be the top 3's total. Compute every whole-partition value beside the rank first.",
        },
      ],
    },
    {
      slug: "windows-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "The second-highest salary in every department",
          prompt: `For each department, list the employees paid the department's **second-highest distinct salary**. Departments with only one distinct salary do not appear.

| employees: id | name | dept | salary |
| --- | --- | --- | --- |
| 1 | Asha | Eng | 90000 |
| 2 | Farah | Eng | 90000 |
| 3 | Ben | Eng | 70000 |
| 4 | Gita | Eng | 70000 |
| 5 | Ivan | Eng | 60000 |
| 6 | Chen | Sales | 50000 |
| 7 | Dev | Sales | 40000 |
| 8 | Eva | HR | 45000 |
| 9 | Kai | Ops | 30000 |
| 10 | Lin | Ops | 30000 |

Return \`dept\`, \`name\` and \`salary\`. Order by \`dept\`, then \`name\`.

\`\`\`text
dept | name | salary
Eng | Ben | 70000
Eng | Gita | 70000
Sales | Dev | 40000
\`\`\``,
          starter: String.raw`-- Rank salaries per department in a CTE, keep the second level.
-- dept | name | salary, ORDER BY dept, name.
`,
          solution: String.raw`WITH ranked AS (
  SELECT dept, name, salary,
         DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS lvl
  FROM employees
)
SELECT dept, name, salary
FROM ranked
WHERE lvl = 2
ORDER BY dept, name;
`,
          hints: [
            "\"Second-highest distinct salary\" is a dense rank of 2 within the department.",
            "With `RANK`, Eng's 70000 would rank 3 (two people share 1) and Eng would vanish.",
            "Filter the rank in the outer query.",
          ],
          cases: [
            { stdin: SECOND_1, expected: "dept | name | salary\nEng | Ben | 70000\nEng | Gita | 70000\nSales | Dev | 40000\n" },
            { stdin: SECOND_2, expected: "dept | name | salary\n(no rows)\n", hidden: true },
            { stdin: SECOND_3, expected: "dept | name | salary\nData | Q | 20\n", hidden: true },
          ],
        },
        {
          title: "Month-over-month growth",
          prompt: `Report revenue per month and its growth over the previous month that had orders.

| orders: id | order_date | amount |
| --- | --- | --- |
| 1 | 2024-01-04 | 100 |
| 2 | 2024-01-19 | 50 |
| 3 | 2024-02-02 | 300 |
| 4 | 2024-03-11 | 200 |
| 5 | 2024-03-30 | 40 |
| 6 | 2024-04-15 | 240 |

Return \`month\` (\`DATE_FORMAT(order_date, '%Y-%m')\`), \`revenue\` (the month's sum), \`prev_revenue\` (the previous listed month's revenue, NULL for the first) and \`growth_pct\` (\`100 * (revenue - prev_revenue) / prev_revenue\`, \`ROUND\`ed to 1 place). Order by \`month\`.

\`\`\`text
month | revenue | prev_revenue | growth_pct
2024-01 | 150 | NULL | NULL
2024-02 | 300 | 150 | 100
2024-03 | 240 | 300 | -20
2024-04 | 240 | 240 | 0
\`\`\``,
          starter: String.raw`-- Monthly totals in a CTE, then LAG over the months.
-- month | revenue | prev_revenue | growth_pct, ORDER BY month.
`,
          solution: String.raw`WITH monthly AS (
  SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, SUM(amount) AS revenue
  FROM orders
  GROUP BY DATE_FORMAT(order_date, '%Y-%m')
),
compared AS (
  SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_revenue
  FROM monthly
)
SELECT month, revenue, prev_revenue,
       ROUND(100 * (revenue - prev_revenue) / prev_revenue, 1) AS growth_pct
FROM compared
ORDER BY month;
`,
          hints: [
            "Group by the formatted month first; `'YYYY-MM'` strings sort in calendar order.",
            "`LAG(revenue) OVER (ORDER BY month)` over the monthly rows is the previous month's revenue.",
            "Compute the growth from the unrounded values in an outer query, and round once.",
          ],
          cases: [
            {
              stdin: MONTHLY_1,
              expected: "month | revenue | prev_revenue | growth_pct\n2024-01 | 150 | NULL | NULL\n2024-02 | 300 | 150 | 100\n2024-03 | 240 | 300 | -20\n2024-04 | 240 | 240 | 0\n",
            },
            { stdin: MONTHLY_2, expected: "month | revenue | prev_revenue | growth_pct\n2024-07 | 99 | NULL | NULL\n", hidden: true },
            { stdin: MONTHLY_3, expected: "month | revenue | prev_revenue | growth_pct\n2023-12 | 30 | NULL | NULL\n2024-02 | 40 | 30 | 33.3\n", hidden: true },
          ],
        },
        {
          title: "Rank and gap to the category leader",
          prompt: `Rank each product by price within its category (most expensive first, ties sharing a rank and leaving a gap after), and show how far below the category's most expensive product it is.

| products: id | category | name | price |
| --- | --- | --- | --- |
| 1 | Audio | Headphones | 4999 |
| 2 | Audio | Speaker | 2999 |
| 3 | Audio | Earbuds | 2999 |
| 4 | Audio | Cable | 299 |
| 5 | Video | TV | 39999 |
| 6 | Video | Projector | 25999 |
| 7 | Gaming | Console | 49999 |

Return \`category\`, \`name\`, \`price\`, \`price_rank\` and \`gap_to_top\` (the category's highest price minus this price). Order by \`category\`, \`price_rank\`, then \`name\`.

\`\`\`text
category | name | price | price_rank | gap_to_top
Audio | Headphones | 4999 | 1 | 0
Audio | Earbuds | 2999 | 2 | 2000
Audio | Speaker | 2999 | 2 | 2000
Audio | Cable | 299 | 4 | 4700
Gaming | Console | 49999 | 1 | 0
Video | TV | 39999 | 1 | 0
Video | Projector | 25999 | 2 | 14000
\`\`\``,
          starter: String.raw`-- RANK for the position, FIRST_VALUE (or MAX) over the category for the leader's price.
-- category | name | price | price_rank | gap_to_top, ORDER BY category, price_rank, name.
`,
          solution: String.raw`SELECT category, name, price,
       RANK() OVER w AS price_rank,
       FIRST_VALUE(price) OVER w - price AS gap_to_top
FROM products
WINDOW w AS (PARTITION BY category ORDER BY price DESC)
ORDER BY category, price_rank, name;
`,
          hints: [
            "Ties share a rank and leave a gap after: that is `RANK` (Cable is 4th, not 3rd).",
            "`FIRST_VALUE(price)` over the same descending window is the leader's price; `MAX(price) OVER (PARTITION BY category)` works too.",
            "A `WINDOW w AS (…)` clause lets both functions share the window.",
          ],
          cases: [
            {
              stdin: PRODUCTS_1,
              expected: "category | name | price | price_rank | gap_to_top\nAudio | Headphones | 4999 | 1 | 0\nAudio | Earbuds | 2999 | 2 | 2000\nAudio | Speaker | 2999 | 2 | 2000\nAudio | Cable | 299 | 4 | 4700\nGaming | Console | 49999 | 1 | 0\nVideo | TV | 39999 | 1 | 0\nVideo | Projector | 25999 | 2 | 14000\n",
            },
            { stdin: PRODUCTS_2, expected: "category | name | price | price_rank | gap_to_top\nBooks | A | 500 | 1 | 0\nBooks | B | 500 | 1 | 0\nBooks | C | 100 | 3 | 400\n", hidden: true },
            { stdin: PRODUCTS_3, expected: "category | name | price | price_rank | gap_to_top\nToys | Kite | 99.5 | 1 | 0\nToys | Yo-yo | 49.25 | 2 | 50.25\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which statement about `PARTITION BY` is true?",
          options: [
            "It collapses each partition to one row, like GROUP BY",
            "It divides rows into groups for the window function but keeps every row",
            "It sorts the output by the partition columns",
            "It can only be used with ranking functions",
          ],
          answer: 1,
          explanation: "PARTITION BY defines each row's window and never removes rows. It does not order the output, and it works with aggregates, ranking and offset functions alike.",
        },
        {
          prompt: "Scores 70, 80, 80, 90 ranked `ORDER BY score DESC`. Which gives 1, 2, 2, 3?",
          options: ["`ROW_NUMBER`", "`RANK`", "`DENSE_RANK`", "`NTILE(3)`"],
          answer: 2,
          explanation: "DENSE_RANK gives ties the same number without gaps. RANK would give 1, 2, 2, 4; ROW_NUMBER 1, 2, 3, 4; NTILE(3) buckets 1, 1, 2, 3.",
        },
        {
          prompt: "In which order are these evaluated?",
          options: [
            "WHERE → window functions → GROUP BY → ORDER BY",
            "WHERE → GROUP BY → HAVING → window functions → ORDER BY",
            "Window functions → WHERE → GROUP BY → ORDER BY",
            "GROUP BY → WHERE → window functions → ORDER BY",
          ],
          answer: 1,
          explanation: "Windows are computed on the rows left after WHERE, GROUP BY and HAVING, before the final ORDER BY and LIMIT. That is why WHERE cannot use them and why they can run over aggregates.",
        },
        {
          prompt: "Does the ORDER BY inside OVER decide the order of the query's output?",
          options: [
            "Yes, always",
            "Only when there is no PARTITION BY",
            "No — only the query's own ORDER BY guarantees an output order",
            "Only for ROW_NUMBER",
          ],
          answer: 2,
          explanation: "The window's ORDER BY orders rows for the function. Rows may come out in that order by coincidence of the plan, but another window or a join can change it; write the final ORDER BY.",
        },
        {
          prompt: "What does `LEAD(order_date) OVER (PARTITION BY customer ORDER BY order_date, id)` return on a customer's last order?",
          options: ["The same date", "The next customer's first order date", "NULL", "An error"],
          answer: 2,
          explanation: "There is no next row inside the partition, so LEAD returns its default, which is NULL unless a third argument gives one.",
        },
        {
          prompt: "How do you compute month-over-month change on a table of individual orders?",
          options: [
            "`LAG(amount) OVER (ORDER BY order_date)` on the orders",
            "Group by month in a CTE, then `LAG(revenue) OVER (ORDER BY month)` over the monthly rows",
            "`SUM(amount) OVER (PARTITION BY month)`",
            "A self-join on `order_date - 30`",
          ],
          answer: 1,
          explanation: "LAG over raw orders compares individual orders, not months. Aggregate to one row per month first; then the previous row is the previous month.",
        },
        {
          prompt: "Which frame turns `SUM(amount)` into a per-row running total that is correct even when dates tie (ordered by `day, id`)?",
          options: [
            "No frame (the default)",
            "`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`",
            "`RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING`",
            "`ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING`",
          ],
          answer: 1,
          explanation: "A ROWS frame counts physical rows, so each row's total stops at that row. The default RANGE frame would include tied peers, and the other two are a remaining total and a centred 3-row sum.",
        },
        {
          prompt: "`AVG(visits) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)` on visits 10, 20, 30, 40 — what is the value on the last row?",
          options: ["25", "30", "40", "35"],
          answer: 1,
          explanation: "The frame is the last row and the two before it: (20 + 30 + 40) / 3 = 30.",
        },
        {
          prompt: "Which pattern returns each user's latest login, exactly one row per user?",
          options: [
            "`RANK() OVER (PARTITION BY user_id ORDER BY login_at DESC)` and keep rank 1",
            "`ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_at DESC, id DESC)` and keep 1",
            "`MAX(login_at) OVER ()`",
            "`ORDER BY login_at DESC LIMIT 1`",
          ],
          answer: 1,
          explanation: "ROW_NUMBER with a unique tie-breaker gives exactly one row 1 per user. RANK can return two rows for a user with two logins at the same time; `OVER ()` is a single global maximum; LIMIT 1 returns one row overall.",
        },
        {
          prompt: "Why must a window average be wrapped in `ROUND` before it is printed in a report?",
          options: [
            "AVG over a window returns text",
            "Averages are rarely whole numbers, and engines print different numbers of decimal places",
            "MySQL refuses unrounded window averages",
            "ROUND makes the window faster",
          ],
          answer: 1,
          explanation: "An average of integers is usually a fraction, and MySQL, PostgreSQL and others display a different scale. Rounding to the precision the report needs makes the output exact and comparable.",
        },
        {
          prompt: "What does `FIRST_VALUE(price) OVER (PARTITION BY category ORDER BY price DESC)` give each row?",
          options: [
            "The row's own price",
            "The highest price in the row's category",
            "The lowest price in the category",
            "The previous row's price",
          ],
          answer: 1,
          explanation: "With a descending order, the first row of the partition is the most expensive one, and the default frame always starts at the partition's first row. LAG would give the previous row's price.",
        },
        {
          prompt: "Which needs window functions rather than GROUP BY alone?",
          options: [
            "Total revenue per region",
            "The number of orders per customer",
            "Each order listed with its customer's total spend beside it",
            "The highest salary per department (the value only)",
          ],
          answer: 2,
          explanation: "Keeping each order row while showing a per-customer total is exactly what a window does: `SUM(amount) OVER (PARTITION BY customer_id)`. The others are one row per group, which GROUP BY returns directly.",
        },
      ],
    },
  ],
});
