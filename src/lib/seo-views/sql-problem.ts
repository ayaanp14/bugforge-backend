/**
 * The SQL workbench's first screen as data (2026-10-14): what
 * SqlDescriptionPane and the editor show a visitor, in their order — the
 * number beside the h1, the difficulty, the topics, the statement (safe
 * HTML, as ReactMarkdown renders it: paragraphs, inline code, bold), every
 * table's schema with its primary key and note, every example's input tables
 * and expected output (the first ten rows of each, as DataTable caps them,
 * with the count it hides), the ordering rule, and the starter query the
 * editor opens with. Built in services/seo.ts sqlProblemHead from the page
 * payload it has already loaded (services/sql-problems sqlProblemPage — the
 * same object GET /api/sql/:slug answers, so the view and the app draw the
 * same rows); drawn by frontend lib/seo/views/api/sql-problem.ts. The
 * registry and the reasons: index.ts.
 */
import { markdownToHtml } from "../markdown-html.js";
import type { SqlProblemPage } from "../../services/sql-problems.js";

type Cell = string | number | null;

export interface SqlProblemViewTable {
  columns: string[];
  rows: Cell[][];
  /** Rows DataTable folds behind its "N more rows" button (cap 10), 0 for none. */
  more: number;
  /** Rows the reference really returned, when more than were sent (DataTable's note), else null. */
  beyond: number | null;
}

export interface SqlProblemView {
  kind: "sql-problem";
  number: number;
  title: string;
  /** EASY | MEDIUM | HARD, as the payload carries it. */
  difficulty: string;
  topics: string[];
  /** The statement as safe HTML (markdownToHtml). */
  statement: string;
  schemas: Array<{ name: string; columns: Array<{ name: string; type: string; values: string | null }>; enumColumn: boolean; primaryKey: string[]; note: string | null }>;
  examples: Array<{ input: Array<{ name: string } & SqlProblemViewTable>; output: SqlProblemViewTable }>;
  ordered: boolean;
  starter: string;
  /** The neighbours' slugs (SqlHeader's arrows: a link, or a disabled glyph at either end). */
  prev: string | null;
  next: string | null;
}

/** DataTable's default cap for an example's tables (components/sql/DataTable). */
const EXAMPLE_CAP = 10;

function capped(columns: string[], rows: Cell[][], totalRows?: number): SqlProblemViewTable {
  return {
    columns,
    rows: rows.slice(0, EXAMPLE_CAP),
    more: Math.max(0, rows.length - EXAMPLE_CAP),
    beyond: typeof totalRows === "number" && totalRows > rows.length ? totalRows : null,
  };
}

export function sqlProblemView(page: SqlProblemPage): SqlProblemView {
  return {
    kind: "sql-problem",
    number: page.number,
    title: page.title,
    difficulty: page.difficulty,
    topics: page.topics,
    statement: markdownToHtml(page.description, 12_000, { under: 1 }),
    schemas: page.tables.map((t) => ({
      name: t.name,
      columns: t.columns.map((c) => ({ name: c.name, type: c.type, values: c.values?.length ? c.values.join(", ") : null })),
      enumColumn: t.columns.some((c) => c.type === "enum" && Boolean(c.values?.length)),
      primaryKey: t.primaryKey ?? [],
      note: t.note ? markdownToHtml(t.note, 4_000, { under: 1 }) : null,
    })),
    examples: page.examples.map((ex) => ({
      input: Object.entries(ex.input).map(([name, t]) => ({ name, ...capped(t.columns, t.rows) })),
      output: capped(ex.output.columns, ex.output.rows, ex.output.totalRows),
    })),
    ordered: page.ordered,
    starter: page.starter,
    prev: page.prev?.slug ?? null,
    next: page.next?.slug ?? null,
  };
}
