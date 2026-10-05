import type { Cell } from "../sql/types.js";

/**
 * A SQL problem as authored (src/lib/sql-problems/<topic>.ts; the guide is
 * src/lib/sql-problems/AUTHORING.md, the gate `npx tsx scripts/sql-problems.ts
 * --validate`). Problems are code, not seeded rows: each carries a generator
 * for its hidden datasets, so it ships in the API image and goes live with a
 * deploy — like the roadmap lessons, nothing to seed.
 *
 * The truth rule of every judge on the platform holds: expected results are
 * computed, never typed — the reference `solution` runs on every dataset, and
 * the gate proves each `alternatives` query returns the same result on all of
 * them, so a problem with an ambiguous statement (ties, NULLs, order) fails
 * the gate instead of failing learners.
 */

export type SqlDifficulty = "EASY" | "MEDIUM" | "HARD";

/** MySQL column types as the statement shows them; each maps to a SQLite affinity (lib/sql-problems/build.ts). */
export type ColumnType = "int" | "bigint" | "decimal" | "varchar" | "char" | "date" | "datetime" | "enum" | "bool";

export interface ColumnSpec {
  name: string;
  type: ColumnType;
  /** The allowed values of an enum column, shown in the schema table. */
  values?: string[];
}

export interface TableSpec {
  name: string;
  columns: ColumnSpec[];
  /** Column names forming the primary key (shown, and enforced so generated data cannot break it). */
  primaryKey?: string[];
  /** One or two sentences under the schema table: what a row is, what a column means. */
  note?: string;
}

/** One dataset: rows per table, cells in the table's column order. */
export type Dataset = Record<string, Cell[][]>;

export type Rng = () => number;

export interface SqlProblemSpec {
  slug: string;
  title: string;
  difficulty: SqlDifficulty;
  /** From SQL_TOPICS (lib/sql-problems/index.ts). */
  topics: string[];
  /** Markdown: the task only — tables, examples and outputs are drawn from the data. No "# " heading. */
  description: string;
  tables: TableSpec[];
  /** One to three visible datasets; their outputs (from the solution) are the statement's examples. */
  examples: Dataset[];
  /** One hidden dataset per call; deterministic for a given rng. */
  gen: (rng: Rng) => Dataset;
  /** Hidden datasets per submission (default 30). */
  hiddenCount?: number;
  /** The reference query, in MySQL (it runs through lib/sql/dialect like a learner's). */
  solution: string;
  /** Other correct queries (other approaches, other functions): the gate requires each to agree on every dataset. */
  alternatives?: string[];
  /** True when the statement fixes the row order ("ordered by …"); otherwise rows compare as a multiset. */
  ordered?: boolean;
  hints: string[];
  /** Markdown walkthrough of the approach (the solution and alternatives are appended by the page). */
  editorial: string;
}
