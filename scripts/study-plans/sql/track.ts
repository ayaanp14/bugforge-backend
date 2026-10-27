import type { TrackSeed } from "../dsl.js";
import foundations from "./01-foundations/module.js";
import selectingAndFiltering from "./02-selecting-and-filtering/module.js";
import sortingAndLimiting from "./03-sorting-and-limiting/module.js";
import nullsAndExpressions from "./04-nulls-and-expressions/module.js";
import functions from "./05-functions/module.js";
import aggregation from "./06-aggregation/module.js";
import joins from "./07-joins/module.js";
import subqueries from "./08-subqueries/module.js";
import setOperationsAndCtes from "./09-set-operations-and-ctes/module.js";
import windowFunctions from "./10-window-functions/module.js";
import modifyingData from "./11-modifying-data/module.js";
import schemaDesign from "./12-schema-design/module.js";
import indexesAndPerformance from "./13-indexes-and-performance/module.js";
import transactionsAndConcurrency from "./14-transactions-and-concurrency/module.js";
import queryPatterns from "./15-query-patterns/module.js";
import interviewIdioms from "./16-interview-idioms/module.js";

/**
 * The SQL study plan. The course teaches **MySQL 8** — the dialect of the
 * placement rounds and interview questions it prepares for — and its
 * exercises run on the SQL problems' engine, SQLite 3.49 as WebAssembly with
 * the MySQL layer in front (lib/sql/program.ts: why local and not Paiza, and
 * how a script maps onto the program judge's source/stdin/stdout).
 *
 * How an exercise is written:
 *
 *  - a case's `stdin` is the **setup script**: CREATE TABLE + INSERT
 *    statements that build the exercise's tables. Every case carries its own
 *    full setup (a hidden case is a different dataset — edge rows: NULLs,
 *    ties, an empty table, duplicates). Keep a setup under ~40 rows;
 *  - the `starter` is a script with a comment saying what to write (and, for
 *    a data-changing exercise, the closing SELECT already written so the
 *    learner sees the effect); the `solution` is the reference script;
 *  - `expected` is what the script prints: each result set as its column
 *    names joined by " | ", then one line a row (NULL as `NULL`, a
 *    non-integer rounded to four places with trailing zeros dropped, an empty
 *    set as a header plus `(no rows)`), result sets separated by a blank
 *    line; statements that return no rows print nothing;
 *  - the prompt names the **exact output columns (aliases) and the ORDER BY**
 *    — the comparison is text, so row order and column names are the answer.
 *    Always break ties in the prompt's ordering;
 *  - the prompt shows the setup's tables as a small Markdown table and the
 *    expected output in a ```text fence, like the other tracks' prompts.
 *
 * What the engine covers, so an exercise never relies on the gap: SELECT
 * with every clause, joins (INNER/LEFT/RIGHT/FULL/CROSS), subqueries, CTEs
 * incl. RECURSIVE, window functions with frames, UNION/INTERSECT/EXCEPT,
 * INSERT/UPDATE/DELETE, REPLACE INTO, INSERT IGNORE, CREATE/DROP TABLE,
 * VIEW, INDEX, ALTER TABLE ADD/RENAME COLUMN, constraints (PRIMARY KEY,
 * UNIQUE, NOT NULL, CHECK, DEFAULT, FOREIGN KEY — declared, but SQLite does
 * not enforce foreign keys without the PRAGMA, which is refused, so never
 * judge an FK violation), BEGIN/START TRANSACTION/COMMIT/ROLLBACK/
 * SAVEPOINT, TRUNCATE TABLE, AUTO_INCREMENT on an INT PRIMARY KEY, `/` as
 * decimal division, DIV/MOD, and the MySQL functions in
 * src/lib/sql/mysql-functions.ts (IF, IFNULL, COALESCE, CONCAT, CONCAT_WS,
 * SUBSTRING, LEFT/RIGHT, LPAD, REPLACE, UPPER/LOWER, CHAR_LENGTH, ROUND,
 * CEIL/FLOOR, ABS, MOD, YEAR/MONTH/DAY, DATEDIFF, DATE_ADD/DATE_SUB with
 * INTERVAL, DATE_FORMAT, TIMESTAMPDIFF, GROUP_CONCAT … SEPARATOR …).
 * Taught as reading and quiz only, never judged: ON DUPLICATE KEY UPDATE,
 * stored procedures, triggers, SHOW/DESCRIBE, users and GRANT, isolation
 * levels and locking behaviour, EXPLAIN's MySQL output, ENUM/SET types,
 * collations, NOW()/CURDATE() in an expected output (the clock), and
 * `LENGTH` on multibyte text (bytes in MySQL, characters in SQLite).
 *
 * Determinism: every SELECT whose rows are printed ends in an ORDER BY that
 * fixes the order completely; never print a float that is not ROUNDed or a
 * clean ratio; dates are 'YYYY-MM-DD' strings in the setup.
 *
 * The road, sixteen modules:
 *
 *   01 foundations                  — databases and tables, what SQL is, MySQL and its cousins, the first SELECT, how a query is processed
 *   02 selecting-and-filtering      — columns and aliases, expressions, WHERE, AND/OR/NOT, IN/BETWEEN/LIKE, DISTINCT
 *   03 sorting-and-limiting         — ORDER BY, multi-key sorts and ties, LIMIT/OFFSET, pagination, top-N
 *   04 nulls-and-expressions        — NULL and three-valued logic, IS NULL, COALESCE/IFNULL/NULLIF, CASE, types and CAST
 *   05 functions                    — string functions, numeric functions, dates and times, conditional functions
 *   06 aggregation                  — aggregate functions, GROUP BY, HAVING, conditional aggregation, GROUP_CONCAT, grouping pitfalls
 *   07 joins                        — inner joins, outer joins, self joins, cross joins, multi-table joins, semi and anti joins
 *   08 subqueries                   — scalar, IN and EXISTS, correlated, derived tables, NOT IN and NULL
 *   09 set-operations-and-ctes      — UNION/UNION ALL, INTERSECT/EXCEPT, CTEs, recursive CTEs
 *   10 window-functions             — OVER and PARTITION BY, ranking, LAG/LEAD, running totals and frames, top-N per group
 *   11 modifying-data               — INSERT, UPDATE, DELETE, upserts, transactions in practice
 *   12 schema-design                — CREATE TABLE and types, constraints, ALTER/DROP, normalization, relationships, views
 *   13 indexes-and-performance      — how indexes work, composite indexes, reading a plan, sargable queries, covering indexes
 *   14 transactions-and-concurrency — ACID, isolation levels, locks and deadlocks, MVCC, savepoints
 *   15 query-patterns               — gaps and islands, deduplication, pivoting, rolling windows, nth highest, date series
 *   16 interview-idioms             — the classic questions, the theory drill, the idiom sheet, the pitfalls
 */
export const sqlTrack: TrackSeed = {
  key: "sql",
  title: "SQL",
  blurb: "The language every backend, data and placement round asks for — SELECT and filtering, NULLs, functions, GROUP BY, joins, subqueries, CTEs, window functions, data changes, schema design, indexes and transactions — in MySQL 8, with every query judged in your browser's next second.",
  language: "sql",
  runtime: "MySQL 8 syntax on SQLite 3.49",
  modules: [
    foundations,
    selectingAndFiltering,
    sortingAndLimiting,
    nullsAndExpressions,
    functions,
    aggregation,
    joins,
    subqueries,
    setOperationsAndCtes,
    windowFunctions,
    modifyingData,
    schemaDesign,
    indexesAndPerformance,
    transactionsAndConcurrency,
    queryPatterns,
    interviewIdioms,
  ],
};
