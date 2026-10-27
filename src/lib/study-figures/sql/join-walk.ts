import type { Frame, Item, Tone } from "../../walkthroughs/core.js";
import { arrow, label } from "../../lesson-figures/kit.js";
import { rowEdge, rowsTable, rowTag, type Row, type Truth, type Val } from "./kit.js";

/**
 * A join run the way the lessons explain it: the left table read one row at
 * a time, every right row whose ON condition is TRUE paired with it, and the
 * result growing under the two tables — with the outer joins' NULL-padded
 * rows added where the kind keeps them. Shared by the joins lessons' figures
 * (inner-join, left-and-right-joins, full-and-cross-joins).
 *
 * `joinPairs` is the join itself, by the definition; the figures check its
 * result against the rows their lesson prints before drawing anything.
 */

export type JoinKind = "inner" | "left" | "right" | "full";
/** A result row: the left row's index and the right row's, null where it is padded. */
export type Pair = [number | null, number | null];

export function joinPairs(L: readonly Row[], R: readonly Row[], on: (l: Row, r: Row) => Truth, kind: JoinKind): Pair[] {
  const out: Pair[] = [];
  const hitR = new Set<number>();
  L.forEach((l, i) => {
    let hit = false;
    R.forEach((r, j) => {
      if (on(l, r) === true) {
        out.push([i, j]);
        hit = true;
        hitR.add(j);
      }
    });
    if (!hit && (kind === "left" || kind === "full")) out.push([i, null]);
  });
  if (kind === "right" || kind === "full") R.forEach((_, j) => !hitR.has(j) && out.push([null, j]));
  return out;
}

export interface Side {
  title: string;
  cols: string[];
  rows: Row[];
  /** Column widths by name (defaults to the kit's sizing). */
  w?: Record<string, number>;
}

export interface WalkSpec {
  left: Side;
  right: Side;
  on: (l: Row, r: Row) => Truth;
  kind: JoinKind;
  out: { title: string; cols: string[]; value: (l: Row | null, r: Row | null, col: string) => Val; w?: Record<string, number> };
  /** The gap between the two tables. */
  gap?: number;
  intro: string;
  /** The sentence for left row i, given the right rows it matched. */
  step: (l: Row, matches: Row[]) => string;
  /** The closing sentence: the right rows nobody matched (padded in only for right/full). */
  end?: (unmatched: Row[]) => string;
}

/** The frames: intro, one per left row, and a closing one when `end` is given. */
export function joinWalk(s: WalkSpec): { frames: Frame[]; pairs: Pair[] } {
  const pairs = joinPairs(s.left.rows, s.right.rows, s.on, s.kind);
  const DX = (s.gap ?? 96) + 0;
  const show = (v: Val) => (v === null ? null : v);

  const draw = (cur: number | null, done: number, final: boolean): Item[] => {
    // What the join has produced so far, in the order it produced it.
    const rows = final ? pairs : pairs.filter(([i]) => i !== null && (i < done || i === cur));
    const matchedNow = cur === null ? [] : pairs.filter(([i, j]) => i === cur && j !== null).map(([, j]) => j as number);
    const hitR = new Set(rows.flatMap(([i, j]) => (i === null || j === null ? [] : [j])));
    const lt = rowsTable("l", s.left.title, s.left.cols, s.left.rows, {
      w: s.left.w,
      tone: (r) => (r === cur ? "accent" : r < done || final ? "muted" : "plain"),
    });
    const rx = lt.right + DX;
    const unmatchedR = final && (s.kind === "right" || s.kind === "full");
    const rt = rowsTable("r", s.right.title, s.right.cols, s.right.rows, {
      x: rx,
      w: s.right.w,
      tone: (r): Tone => (matchedNow.includes(r) ? "accent" : unmatchedR && !hitR.has(r) ? "accent" : hitR.has(r) ? "muted" : final && !hitR.has(r) ? "muted" : "plain"),
    });
    const items: Item[] = [...lt.items, ...rt.items];
    for (const [i, j] of pairs) {
      if (i === null || j === null) continue;
      if (!(final || i < done || i === cur)) continue;
      items.push(arrow(`m${i}-${j}`, rowEdge(lt, i, "right"), rowEdge(rt, j, "left"), { tone: i === cur ? "accent" : "line", head: false }));
    }
    if (cur !== null && matchedNow.length === 0) items.push(label("nm", "no match", lt.right + 6, lt.rowY(cur) + lt.h / 2, { anchor: "start", tone: "accent", size: 11, weight: 600 }));
    const top = Math.max(lt.bottom, rt.bottom) + 30;
    const ot = rowsTable(
      "o",
      final ? `${s.kind.toUpperCase()} JOIN result` : "result so far",
      s.out.cols,
      rows.map(([i, j]) => Object.fromEntries(s.out.cols.map((c) => [c, show(s.out.value(i === null ? null : s.left.rows[i]!, j === null ? null : s.right.rows[j]!, c))]))),
      {
        y: top,
        w: s.out.w,
        key: (r) => `${rows[r]![0] ?? "n"}.${rows[r]![1] ?? "n"}`,
        tone: (r) => {
          const [i, j] = rows[r]!;
          if (i === null || j === null) return "accent";
          return i === cur ? "accent" : "strong";
        },
      },
    );
    items.push(...ot.items);
    if (final)
      rows.forEach(([i, j], r) => {
        if (i === null || j === null) items.push(rowTag(`pad${i ?? "n"}.${j ?? "n"}`, ot, r, i === null ? "no left row: NULL-padded" : "no right row: NULL-padded", { tone: "accent" }));
      });
    else if (cur !== null && matchedNow.length === 0 && (s.kind === "left" || s.kind === "full"))
      items.push(rowTag(`pad${cur}.n`, ot, rows.length - 1, "kept, padded with NULL", { tone: "accent" }));
    else if (cur !== null && matchedNow.length === 0) items.push(label(`gone${cur}`, "nothing added", ot.left, ot.bottom + 18, { anchor: "start", tone: "accent", size: 11.5, mono: true }));
    return items;
  };

  const frames: Frame[] = [{ caption: s.intro, items: draw(null, 0, false) }];
  s.left.rows.forEach((l, i) => {
    const matches = pairs.filter(([a, b]) => a === i && b !== null).map(([, b]) => s.right.rows[b as number]!);
    frames.push({ caption: s.step(l, matches), items: draw(i, i, false) });
  });
  if (s.end) {
    const hit = new Set(pairs.flatMap(([i, j]) => (i === null || j === null ? [] : [j])));
    frames.push({ caption: s.end(s.right.rows.filter((_, j) => !hit.has(j))), items: draw(null, s.left.rows.length, true) });
  }
  return { frames, pairs };
}

/** A result's rows as the lesson prints them, for the check before drawing. */
export const resultRows = (pairs: readonly Pair[], L: readonly Row[], R: readonly Row[], value: WalkSpec["out"]["value"], cols: readonly string[]): Val[][] =>
  pairs.map(([i, j]) => cols.map((c) => value(i === null ? null : L[i]!, j === null ? null : R[j]!, c)));

/** Throws unless `got` equals `want` as a multiset of rows. */
export function expectRows(what: string, got: Val[][], want: Val[][]): void {
  const key = (r: Val[]) => JSON.stringify(r);
  const a = got.map(key).sort();
  const b = want.map(key).sort();
  if (a.length !== b.length || a.some((x, i) => x !== b[i])) throw new Error(`${what}: got ${JSON.stringify(got)}, the lesson prints ${JSON.stringify(want)}`);
}
