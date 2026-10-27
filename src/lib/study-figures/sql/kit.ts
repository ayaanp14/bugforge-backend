import { textWidth, type Item, type Tone } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * The SQL study plan's figure kit: tables of rows, and SQL's own value rules
 * so a figure computes what it draws (lib/study-figures/index.ts).
 *
 * A table's cells are keyed by the row's *key*, not its position — `${p}${key}-${c}`
 * — so between frames a row that is sorted, filtered, grouped or limited
 * keeps its id and glides to its new place (the walkthrough player animates
 * by id), and a row that leaves fades out. The header keeps `${p}H${c}`.
 */

export type Val = string | number | null;
export type Row = Record<string, Val>;

/** A value as a result prints it. */
export const show = (v: Val): string => (v === null ? "NULL" : String(v));

/* ── Three-valued logic ───────────────────────────────────────────── */

/** TRUE, FALSE or UNKNOWN (null). */
export type Truth = boolean | null;

/** SQL's comparison: a NULL on either side is UNKNOWN. */
export function cmp(a: Val, op: "=" | "<>" | "<" | "<=" | ">" | ">=", b: Val): Truth {
  if (a === null || b === null) return null;
  switch (op) {
    case "=":
      return a === b;
    case "<>":
      return a !== b;
    case "<":
      return a < b;
    case "<=":
      return a <= b;
    case ">":
      return a > b;
    case ">=":
      return a >= b;
  }
}
export const and3 = (a: Truth, b: Truth): Truth => (a === false || b === false ? false : a === null || b === null ? null : true);
export const or3 = (a: Truth, b: Truth): Truth => (a === true || b === true ? true : a === null || b === null ? null : false);
export const not3 = (a: Truth): Truth => (a === null ? null : !a);
export const showTruth = (t: Truth): string => (t === null ? "UNKNOWN" : t ? "TRUE" : "FALSE");

/** MySQL's ORDER BY on one key: NULL first ascending, last descending. */
export function sqlCompare(a: Val, b: Val): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a < b ? -1 : 1;
}

/* ── Tables ───────────────────────────────────────────────────────── */

export interface Col {
  name: string;
  /** Width in units; by default sized to the widest of the header and the values. */
  w?: number;
}

export interface TableOpts {
  x?: number;
  y?: number;
  /** Row height. */
  h?: number;
  /** A row's key (default its index) — what its cell ids follow between frames. */
  key?: (r: number) => string | number;
  /** A row's slot (default its index): where it is drawn — lets a frame leave gaps or reorder without changing keys. */
  slot?: (r: number) => number;
  tone?: (r: number, c: number) => Tone | undefined;
  /** No title line: the header sits at y. */
  untitled?: boolean;
  size?: number;
}

export interface Table {
  items: Item[];
  colX: number[];
  colW: number[];
  /** The top of slot s. */
  rowY: (s: number) => number;
  h: number;
  left: number;
  right: number;
  /** The bottom of the last drawn slot. */
  bottom: number;
}

const CELL_PAD = 16;
const GAP = 3;

/** Column widths sized to the widest of the header and the values (mono 12 px). */
export function widths(cols: readonly Col[], rows: ReadonlyArray<ReadonlyArray<string>>, size = 12): number[] {
  return cols.map((c, i) => c.w ?? Math.ceil(Math.max(textWidth(c.name, 11), ...rows.map((r) => textWidth(r[i] ?? "", size))) + CELL_PAD));
}

/**
 * A table: a bold title, faint column names, then one box per value. Cell
 * ids are `${p}${key(r)}-${c}`; header ids `${p}H${c}`; the title `${p}T`.
 */
export function table(p: string, title: string, cols: readonly Col[], rows: ReadonlyArray<ReadonlyArray<string>>, o: TableOpts = {}): Table {
  const { x = 0, y = 0, h = 26, size = 12 } = o;
  const colW = widths(cols, rows, size);
  const colX: number[] = [];
  let cx = x;
  for (const w of colW) {
    colX.push(cx);
    cx += w + GAP;
  }
  const head = o.untitled ? y : y + 22;
  const rowY = (s: number) => head + 14 + s * (h + GAP);
  const items: Item[] = [];
  if (!o.untitled) items.push(label(`${p}T`, title, x, y, { anchor: "start", tone: "ink", weight: 700, size: 12.5 }));
  cols.forEach((c, i) => items.push(label(`${p}H${i}`, c.name, colX[i]! + colW[i]! / 2, head + 4, { tone: "soft", size: 11, mono: true })));
  let last = -1;
  rows.forEach((row, r) => {
    const s = o.slot ? o.slot(r) : r;
    last = Math.max(last, s);
    const k = o.key ? o.key(r) : r;
    row.forEach((v, c) => items.push(box(`${p}${k}-${c}`, colX[c]!, rowY(s), v, { w: colW[c]!, h, size, tone: o.tone?.(r, c) ?? "plain" })));
  });
  return { items, colX, colW, rowY, h, left: x, right: cx - GAP, bottom: last < 0 ? head + 14 : rowY(last) + h };
}

/** A table straight from row objects: the named columns, values shown as a result prints them. */
export function rowsTable(p: string, title: string, cols: readonly string[], rows: readonly Row[], o: TableOpts & { w?: Record<string, number> } = {}): Table {
  return table(
    p,
    title,
    cols.map((name) => ({ name, w: o.w?.[name] })),
    rows.map((r) => cols.map((c) => show(r[c] ?? null))),
    o,
  );
}

/** A tag to the right of a table's row: "TRUE — kept", "no match". */
export function rowTag(id: string, t: Table, slot: number, text: string, o: { tone?: "accent" | "soft" | "faint" | "error" | "ink"; dx?: number; weight?: number } = {}): Item {
  return label(id, text, t.right + (o.dx ?? 12), t.rowY(slot) + t.h / 2, { anchor: "start", tone: o.tone ?? "soft", size: 11.5, mono: true, weight: o.weight });
}

/** The midpoint of a row's right (or left) edge — where a matching line starts. */
export const rowEdge = (t: Table, slot: number, side: "left" | "right"): { x: number; y: number } => ({ x: side === "right" ? t.right + 3 : t.left - 3, y: t.rowY(slot) + t.h / 2 });

/** A line of SQL under or over a figure, mono and ink. */
export const sqlLine = (id: string, text: string, x: number, y: number, o: { tone?: "ink" | "accent" | "soft" | "faint"; weight?: number } = {}): Item =>
  label(id, text, x, y, { anchor: "start", tone: o.tone ?? "ink", size: 12, mono: true, weight: o.weight });
