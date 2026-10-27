/** Shapes shared by the SQL engine, its worker and the judge (lib/sql/*). Import-free so the worker loads nothing else. */

export type Cell = string | number | null;

export interface ResultSet {
  columns: string[];
  /** At most the job's `maxRows`. */
  rows: Cell[][];
  /** Rows the query produced (counted up to 100,000). */
  totalRows: number;
  truncated: boolean;
  /** The query's own time inside the engine. */
  ms: number;
}

/** `setup` marks a script job's dataset that failed to load (lib/sql/program.ts reports it apart from the learner's statements). */
export type QueryOutcome = { ok: true; result: ResultSet } | { ok: false; error: string; setup?: true };

export interface SqlJob {
  id: number;
  /** CREATE TABLE statements. */
  schema: string;
  /** One INSERT script per dataset; each runs on a fresh database. */
  datasets: string[];
  /** Run in order on every dataset. */
  queries: string[];
  maxRows: number;
  /**
   * A study-plan script (lib/sql/program.ts): statements that return no
   * columns (INSERT, UPDATE, CREATE …) run instead of being refused, the
   * first failing statement ends the dataset's run, and a dataset whose
   * setup fails is reported as that dataset's one outcome rather than
   * failing the whole job — the setup is the learner's own input on Run.
   */
  script?: boolean;
}

export type SqlJobReply = { id: number; results: QueryOutcome[][]; error?: undefined } | { id: number; error: string; results?: undefined };
