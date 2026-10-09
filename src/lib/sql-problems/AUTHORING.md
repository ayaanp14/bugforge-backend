# Writing a SQL problem

SQL problems are LeetCode-style database questions: a schema and some data,
and the learner writes one `SELECT` that returns the asked-for result. They are
TypeScript specs in `src/lib/sql-problems/<topic>.ts` (`SqlProblemSpec` in
`types.ts`), listed by `index.ts`, served at `/sql/<slug>`, public and indexed.
`joins.ts` → `employees-earning-more-than-their-manager` is the reference
problem: read it before writing one.

The gate (real engine, offline):

```
npx tsx scripts/sql-problems.ts --validate --only <slug>[,<slug>…]
npx tsx scripts/sql-problems.ts --show <slug>       # the first example's tables and output
npx tsx scripts/sql-mysql-check.ts --only <slug>    # the same queries on real MySQL 8 (needs .env sourced)
```

A new file can be gated before `index.ts` lists it — `--validate --file
src/lib/sql-problems/<file>.ts` (and `sql-mysql-check.ts --file …`, which uses
a scratch database named after the file, so different files can be checked at
once; never the same file twice at once). That is how the twenty
`world-*.ts` industry sets were written in parallel.

```
```

A problem is done when `--validate` passes for it.

## The engine — write MySQL

Learners write **MySQL**; the judge runs SQLite 3.49 (WebAssembly) behind a
compatibility layer (`src/lib/sql/dialect.ts`, `src/lib/sql/mysql-functions.ts`).
Write every `solution` and `alternatives` query in plain MySQL 8 — they run
through the same layer, so the gate proves the layer handles them. Supported:

- SELECT, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT/OFFSET (and `LIMIT a, b`), DISTINCT, aliases, backtick names;
- INNER/LEFT/RIGHT/FULL/CROSS joins, self joins, subqueries (scalar, IN, EXISTS, correlated), CTEs (`WITH`, `WITH RECURSIVE`), UNION/UNION ALL/INTERSECT/EXCEPT;
- window functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD, FIRST_VALUE, LAST_VALUE, SUM/AVG/COUNT/MIN/MAX OVER (PARTITION BY … ORDER BY … ROWS/RANGE …);
- `/` is decimal division like MySQL (5/2 = 2.5); `DIV` is integer division; ROUND, ABS, MOD, POW/POWER, CEIL/CEILING, FLOOR, SQRT, LN/LOG/LOG2/LOG10, EXP, SIGN, TRUNCATE;
- IF, IFNULL, COALESCE, NULLIF, CASE, ISNULL, GREATEST, LEAST, `<=>`;
- strings: CONCAT (NULL if any argument is NULL, like MySQL), CONCAT_WS, LENGTH, CHAR_LENGTH, UPPER/LOWER/UCASE/LCASE, LEFT, RIGHT, SUBSTRING/SUBSTR, TRIM, REPLACE, LOCATE, INSTR, LPAD/RPAD, REVERSE, REPEAT, SUBSTRING_INDEX, LIKE, REGEXP (JavaScript regex syntax, case-insensitive; MySQL string escapes are honoured, so `'\\.'` is the regex `\.` as in MySQL — `[.]` reads the same everywhere), GROUP_CONCAT([DISTINCT] x [ORDER BY …] [SEPARATOR '…']);
- dates stored as 'YYYY-MM-DD' / 'YYYY-MM-DD HH:MM:SS' text: YEAR, MONTH, DAY, DAYOFWEEK, WEEKDAY, DAYNAME, MONTHNAME, QUARTER, HOUR/MINUTE/SECOND, LAST_DAY, DATEDIFF, DATE_ADD/DATE_SUB(d, INTERVAL n DAY|WEEK|MONTH|QUARTER|YEAR|HOUR|MINUTE|SECOND), ADDDATE/SUBDATE(d, n), TIMESTAMPDIFF(unit, a, b), DATE_FORMAT, CAST(x AS DATE), date comparisons as text ('2024-01-05' < '2024-02-01' works because the format is fixed), BETWEEN.

**Avoid** (they differ between MySQL and SQLite, or are not supported): string comparisons that rely on case-insensitive collation (`'abc' = 'ABC'` is false here — design data so case never decides), `DATE_ADD` written as `d + INTERVAL 1 DAY` (write `DATE_ADD(d, INTERVAL 1 DAY)`), `STR_TO_DATE`, `WEEK()`, `YEARWEEK()`, `CONVERT`, user variables (`@x := …`), stored functions, `PIVOT`, `QUALIFY`, `ANY_VALUE`, selecting a non-aggregated column under GROUP BY.

**MySQL traps the real-MySQL gate has caught:** reserved words as table, CTE or
column names (`Lead`, `Match`, `Show`, `cascade`, `change`, `rank`, `window` —
pick `SalesLead`, `T20Match`, `Performance`, or backtick them); subtracting two
`ROW_NUMBER()`s (unsigned in MySQL — `up - down` overflows when negative; write
`up <= down + 1 AND down <= up + 1`); `GROUP BY YEAR(d), MONTH(d)` with a
`CONCAT` of them selected (ONLY_FULL_GROUP_BY — group by the alias or build it in
a derived table); `>= ALL (subquery)` (not supported here — write `NOT EXISTS`);
an unrounded AVG or ratio, and a rounded one whose exact value can sit on a .5.

Supported since 2026-10-09 (the layer was fixed rather than the problems):
`a DIV b` truncates whatever the operand types (`TIMESTAMPDIFF(…) DIV 60`,
a decimal column), `a MOD b` as an operator, `GROUP_CONCAT(DISTINCT x ORDER BY …
SEPARATOR '; ')`, and `LIKE 'a\_%'` with MySQL's default backslash escape.

## Spec fields

| Field | Rule |
| --- | --- |
| `slug` | lower-case-hyphenated, unique, the URL. |
| `title` | ≤ 70 characters, unique. |
| `difficulty` | `EASY`, `MEDIUM`, `HARD` — calibrated like LeetCode's database problems. |
| `topics` | One or more of `Basics`, `Joins`, `Aggregation`, `Subqueries`, `Window Functions`, `Strings`, `Dates`, `Conditional Logic`. |
| `description` | Markdown, ≥ 25 words: the scenario in a sentence or two, then exactly what to return — which columns **with their exact names**, how ties and NULLs are treated, and the order ("in any order" or "ordered by …"). No `# ` heading; don't repeat the tables (they are drawn from `tables`) or the examples (drawn from `examples`). Use `**bold**` for the key condition. |
| `tables` | Each table: `name` (PascalCase or snake_case identifier), `columns` (`name`, `type`: `int`, `decimal`, `varchar`, `char`, `date`, `datetime`, `enum` (+ `values`), `bool`), `primaryKey`, `note` (what a row is; what a non-obvious column means). |
| `examples` | One to three datasets: `{ TableName: [[cell, cell, …], …] }`, cells in column order (`number`, `string`, `null`; booleans as 0/1; dates as 'YYYY-MM-DD'). Every table appears in every example (use `[]` for empty). The first example's answer must be non-empty and should show the interesting cases (a tie, a NULL, a row that must be excluded) in 4–10 rows a table. The expected output is computed from `solution` — never typed. |
| `gen` | `(rng) => Dataset` — one hidden dataset per call, from the helpers in `kit.ts` (`ri`, `pick`, `chance`, `sample`, `shuffle`, `maybeNull`, `roundTo`, `dateBetween`, `addDays`, `atTime`, `names`, `FIRST_NAMES`, `DEPARTMENTS`, `CITIES`, `PRODUCTS`). Deterministic for the rng (never `Math.random`/`Date.now`). Respect primary keys and foreign-key sense. Small: 0–30 rows a table. Cover the edges on purpose: empty tables, ties, NULLs, duplicates, the boundary of every condition (equal values for `>`), a single row. |
| `hiddenCount` | Optional, default 30 (15–60). |
| `solution` | The reference query in MySQL. Make the answer **deterministic** — the gate reruns it with every table's rows stored in reverse order and fails if the answer changes (ties broken explicitly, LIMIT only after a full ORDER BY, no bare columns under GROUP BY). |
| `alternatives` | One to three other correct queries using a different approach (join vs subquery, window vs correlated subquery, IF vs CASE). The gate requires them to agree with `solution` on every dataset — this is what catches an ambiguous statement. |
| `ordered` | `true` only when the description fixes the order; then the solution has an ORDER BY and rows are compared in order. Otherwise rows compare as a multiset. |
| `hints` | Two to five, each a step towards the idea without giving the query. |
| `editorial` | Markdown, ≥ 80 words: the idea, why it is correct (ties, NULLs), and the cost; mention the alternative approaches. The page appends the solution and the alternatives as code, so don't paste the query again. |

## Originality

Write every problem in your own words, with your own scenario, table names,
column names and data. The *concepts* are classic (second-highest value,
consecutive rows, department top earners, anti joins), but never copy the text,
schema or examples of LeetCode, HackerRank or any other site. Prefer scenarios
an Indian student recognises (a college, a canteen, a food-delivery app, a
cricket league, a train booking) alongside general business ones, and names from
`kit.ts`.
