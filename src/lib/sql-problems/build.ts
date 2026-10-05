import { quoteIdent, sqlLiteral } from "../sql/dialect.js";
import { makeRng } from "./kit.js";
import type { ColumnType, Dataset, SqlProblemSpec, TableSpec } from "./types.js";

/**
 * A problem's spec → what the SQL engine runs: the CREATE TABLE script, and
 * one INSERT script per dataset. Built once per problem per process.
 */

const AFFINITY: Record<ColumnType, string> = {
  int: "INTEGER",
  bigint: "INTEGER",
  bool: "INTEGER",
  decimal: "REAL",
  varchar: "TEXT",
  char: "TEXT",
  enum: "TEXT",
  date: "TEXT",
  datetime: "TEXT",
};

export function schemaSql(tables: TableSpec[]): string {
  return tables
    .map((t) => {
      const cols = t.columns.map((c) => `${quoteIdent(c.name)} ${AFFINITY[c.type]}`);
      if (t.primaryKey?.length) cols.push(`PRIMARY KEY (${t.primaryKey.map(quoteIdent).join(", ")})`);
      return `CREATE TABLE ${quoteIdent(t.name)} (${cols.join(", ")});`;
    })
    .join("\n");
}

/** INSERT statements for one dataset; tables missing from it stay empty. Throws on a row of the wrong width. */
export function datasetSql(tables: TableSpec[], data: Dataset): string {
  const out: string[] = [];
  for (const t of tables) {
    const rows = data[t.name] ?? [];
    if (!rows.length) continue;
    for (const r of rows) {
      if (r.length !== t.columns.length) throw new Error(`table ${t.name}: a row has ${r.length} cells, the table ${t.columns.length} columns`);
    }
    // Chunks keep each statement well under SQLite's statement-size limit.
    for (let i = 0; i < rows.length; i += 200) {
      const values = rows.slice(i, i + 200).map((r) => `(${r.map((v) => sqlLiteral(v)).join(", ")})`).join(", ");
      out.push(`INSERT INTO ${quoteIdent(t.name)} (${t.columns.map((c) => quoteIdent(c.name)).join(", ")}) VALUES ${values};`);
    }
  }
  return out.join("\n");
}

export const DEFAULT_HIDDEN = 30;

export interface BuiltProblem {
  schema: string;
  /** Visible datasets first, then hidden ones. */
  data: Dataset[];
  scripts: string[];
  visible: number;
}

const built = new Map<string, BuiltProblem>();

/** The problem's datasets — the examples, then `hiddenCount` generated from an rng seeded by the slug. */
export function buildProblem(spec: SqlProblemSpec): BuiltProblem {
  const hit = built.get(spec.slug);
  if (hit) return hit;
  const rng = makeRng(`sql:${spec.slug}`);
  const hidden = Array.from({ length: spec.hiddenCount ?? DEFAULT_HIDDEN }, () => spec.gen(rng));
  const data = [...spec.examples, ...hidden];
  const result: BuiltProblem = {
    schema: schemaSql(spec.tables),
    data,
    scripts: data.map((d) => datasetSql(spec.tables, d)),
    visible: spec.examples.length,
  };
  built.set(spec.slug, result);
  return result;
}

/** The starter a learner's editor opens with. */
export const starterQuery = (spec: SqlProblemSpec): string => `-- Write your MySQL query below\n`;
