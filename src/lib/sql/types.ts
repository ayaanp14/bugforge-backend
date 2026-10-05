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

export type QueryOutcome = { ok: true; result: ResultSet } | { ok: false; error: string };

export interface SqlJob {
  id: number;
  /** CREATE TABLE statements. */
  schema: string;
  /** One INSERT script per dataset; each runs on a fresh database. */
  datasets: string[];
  /** Run in order on every dataset. */
  queries: string[];
  maxRows: number;
}

export type SqlJobReply = { id: number; results: QueryOutcome[][]; error?: undefined } | { id: number; error: string; results?: undefined };
