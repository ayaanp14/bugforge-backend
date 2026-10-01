/**
 * Topic walkthroughs: the step-by-step figure on every topic hub
 * (/challenges/<topic>) that shows the technique working on one small
 * example — a window sliding over a string, a queue draining level by
 * level, a table filling cell by cell.
 *
 * A walkthrough is data, not a picture: a list of frames, each a flat list
 * of primitive items (cells, nodes, edges, pointers, spans, text) in SVG
 * user units, with one sentence saying what happened in that step. The SPA
 * draws a frame as inline SVG (frontend components/challenges/
 * TopicWalkthrough.tsx) and animates between frames by item `id` — an item
 * that keeps its id glides to its new place and colour, a new one fades in —
 * and the edge writes the same sentences into the page's HTML as an ordered
 * list (services/seo.ts), so what a crawler reads is the explanation the
 * figure plays. No image file, no canvas, no animation library: a figure is
 * a few kilobytes of JSON inside the hub payload it already fetched.
 *
 * Every value drawn is computed by running the algorithm on the example —
 * the generators below call the real thing and record what it did — so a
 * caption can never claim a step the code did not take. The same rule as
 * the problem diagrams (frontend components/diagrams).
 *
 * Tones are the diagram tokens the SPA already has (components/diagrams/
 * core.tsx): ink for structure, teal for what the step is about, `strong`
 * (solid teal) for the answer, red only for a rejected candidate.
 */

/** A box's meaning: `accent` is what the step is looking at, `strong` the answer or the settled part, `muted` what is out of play. */
export type Tone = "plain" | "accent" | "strong" | "muted" | "error" | "ghost";
export type TextTone = "ink" | "soft" | "faint" | "accent" | "error";
export type LineTone = "line" | "faint" | "accent" | "error" | "ink";

export type Item =
  /** A box with centred text — an array slot, a grid square, a table cell, a stack entry. (x, y) is its top-left corner. */
  | { k: "cell"; id: string; x: number; y: number; w: number; h: number; text: string; tone?: Tone; size?: number }
  /** A circle with centred text — a graph or tree node. (x, y) is its centre. */
  | { k: "node"; id: string; x: number; y: number; r: number; text: string; tone?: Tone; size?: number }
  /** A line between two points, with an arrowhead at (x2, y2) when `arrow`; `bow` curves it (px off the chord, to its left). */
  | { k: "edge"; id: string; x1: number; y1: number; x2: number; y2: number; tone?: LineTone; arrow?: boolean; dashed?: boolean; bow?: number; label?: string }
  /** A caret whose tip is at (x, y) with a name under it (or over it when `up` is false): L, R, mid, i. */
  | { k: "ptr"; id: string; x: number; y: number; label: string; tone?: "accent" | "ink" | "error"; up?: boolean }
  /** A bracket over [x1, x2] at height y, ticks pointing down to what it spans (up when `down`), label above it. */
  | { k: "span"; id: string; x1: number; x2: number; y: number; label?: string; tone?: LineTone; down?: boolean }
  /** A line of text anchored at (x, y) — a variable's value, a row label, a running answer. */
  | { k: "text"; id: string; x: number; y: number; text: string; tone?: TextTone; anchor?: "start" | "middle" | "end"; size?: number; mono?: boolean; weight?: number }
  /** A translucent rectangle behind other items — the window, a range, a component. Draw it before what it covers. */
  | { k: "band"; id: string; x: number; y: number; w: number; h: number; tone?: Tone };

export interface Frame {
  /** What this step did and why, in one or two plain sentences (no Markdown) — read aloud, printed under the figure and written into the HTML. */
  caption: string;
  items: Item[];
}

export interface Walkthrough {
  /** What the figure shows, as a heading: "Longest substring without repeating characters, with a sliding window". */
  title: string;
  /** The example, as text: `s = "abcabcbb"`. */
  input: string;
  /** The viewBox every frame shares, so nothing jumps between frames. */
  width: number;
  height: number;
  frames: Frame[];
}

/* ── Geometry ─────────────────────────────────────────────────────── */

/** An array slot's side, and the gap between slots. */
export const CELL = 40;
export const GAP = 6;

/** The left edge of slot i in a row starting at x0. */
export const slotX = (i: number, x0 = 0, size = CELL, gap = GAP) => x0 + i * (size + gap);
/** The centre of slot i. */
export const slotMid = (i: number, x0 = 0, size = CELL, gap = GAP) => slotX(i, x0, size, gap) + size / 2;

/**
 * A row of cells: `${prefix}${i}` ids, one per value, with each slot's tone
 * from `tone(i)` and, when `index` is set, the index under it in faint mono.
 */
export function row(
  prefix: string,
  values: ReadonlyArray<string | number>,
  o: { x?: number; y?: number; size?: number; gap?: number; tone?: (i: number) => Tone | undefined; index?: boolean; text?: (i: number) => string } = {},
): Item[] {
  const { x = 0, y = 0, size = CELL, gap = GAP } = o;
  const items: Item[] = [];
  values.forEach((v, i) => {
    items.push({ k: "cell", id: `${prefix}${i}`, x: slotX(i, x, size, gap), y, w: size, h: size, text: o.text ? o.text(i) : String(v), tone: o.tone?.(i) ?? "plain" });
    if (o.index) items.push({ k: "text", id: `${prefix}i${i}`, x: slotMid(i, x, size, gap), y: y + size + 11, text: String(i), tone: "faint", size: 10 });
  });
  return items;
}

/** A caret under slot i of a row at (x0, y) — the row's cells are `size` tall, and the index line, if any, is skipped. */
export function under(id: string, i: number, label: string, o: { x?: number; y?: number; size?: number; gap?: number; tone?: "accent" | "ink" | "error"; indexed?: boolean } = {}): Item {
  const { x = 0, y = 0, size = CELL, gap = GAP } = o;
  return { k: "ptr", id, x: slotMid(i, x, size, gap), y: y + size + (o.indexed ? 20 : 6), label, tone: o.tone ?? "accent", up: true };
}

/** A caret over slot i of a row at (x0, y), pointing down at it. */
export function over(id: string, i: number, label: string, o: { x?: number; y?: number; size?: number; gap?: number; tone?: "accent" | "ink" | "error" } = {}): Item {
  const { x = 0, y = 0, size = CELL, gap = GAP } = o;
  return { k: "ptr", id, x: slotMid(i, x, size, gap), y: y - 6, label, tone: o.tone ?? "accent", up: false };
}

/** A band behind slots [from, to] of a row at (x0, y): the window, the range. */
export function bandOver(id: string, from: number, to: number, o: { x?: number; y?: number; size?: number; gap?: number; tone?: Tone; pad?: number } = {}): Item {
  const { x = 0, y = 0, size = CELL, gap = GAP, pad = 4 } = o;
  const x1 = slotX(from, x, size, gap) - pad;
  const x2 = slotX(to, x, size, gap) + size + pad;
  return { k: "band", id, x: x1, y: y - pad, w: Math.max(0, x2 - x1), h: size + pad * 2, tone: o.tone ?? "accent" };
}

/** A bracket over slots [from, to] of a row at (x0, y), with its label above. */
export function spanOver(id: string, from: number, to: number, label: string | undefined, o: { x?: number; y?: number; size?: number; gap?: number; tone?: LineTone; lift?: number } = {}): Item {
  const { x = 0, y = 0, size = CELL, gap = GAP, lift = 10 } = o;
  return { k: "span", id, x1: slotX(from, x, size, gap) + 2, x2: slotX(to, x, size, gap) + size - 2, y: y - lift, label, tone: o.tone ?? "accent" };
}

/** A label at the left of a row, right-aligned against x — "nums", "dp", "stack". */
export function rowLabel(id: string, text: string, x: number, y: number, size = CELL): Item {
  return { k: "text", id, x, y: y + size / 2, text, tone: "soft", anchor: "end", size: 12 };
}

/** A line of text: a readout under the figure ("best = 3"), left-anchored by default. */
export function note(id: string, text: string, x: number, y: number, o: { tone?: TextTone; anchor?: "start" | "middle" | "end"; size?: number; mono?: boolean; weight?: number } = {}): Item {
  return { k: "text", id, x, y, text, tone: o.tone ?? "ink", anchor: o.anchor ?? "start", size: o.size ?? 13, mono: o.mono ?? true, weight: o.weight };
}

/** An edge between two node centres, trimmed to the circles' rims so an arrowhead lands on the edge of the target. */
export function link(id: string, a: { x: number; y: number }, b: { x: number; y: number }, r: number, o: { tone?: LineTone; arrow?: boolean; dashed?: boolean; bow?: number; label?: string; rb?: number } = {}): Item {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const rb = o.rb ?? r;
  return {
    k: "edge",
    id,
    x1: round(a.x + ux * r),
    y1: round(a.y + uy * r),
    x2: round(b.x - ux * (rb + (o.arrow ? 1 : 0))),
    y2: round(b.y - uy * (rb + (o.arrow ? 1 : 0))),
    tone: o.tone ?? "line",
    arrow: o.arrow,
    dashed: o.dashed,
    bow: o.bow,
    label: o.label,
  };
}

/** Points on a circle, starting at the top and going clockwise: a small graph's layout. */
export function ring(n: number, cx: number, cy: number, radius: number, start = -Math.PI / 2): Array<{ x: number; y: number }> {
  return Array.from({ length: n }, (_, i) => {
    const a = start + (i * 2 * Math.PI) / n;
    return { x: round(cx + radius * Math.cos(a)), y: round(cy + radius * Math.sin(a)) };
  });
}

/**
 * A tidy layout for a rooted tree given as child lists: leaves get
 * consecutive columns, a parent sits over the middle of its children, and
 * each depth is `dy` lower. Returns each node's centre.
 */
export function treeLayout<K extends string | number>(root: K, children: (k: K) => readonly K[], o: { dx?: number; dy?: number; x?: number; y?: number } = {}): Map<K, { x: number; y: number; depth: number }> {
  const { dx = 48, dy = 64, x = 0, y = 0 } = o;
  const at = new Map<K, { x: number; y: number; depth: number }>();
  let next = 0;
  const place = (k: K, depth: number): number => {
    const kids = children(k);
    let col: number;
    if (kids.length === 0) col = next++;
    else {
      const cols = kids.map((c) => place(c, depth + 1));
      col = (cols[0] + cols[cols.length - 1]) / 2;
    }
    at.set(k, { x: x + col * dx, y: y + depth * dy, depth });
    return col;
  };
  place(root, 0);
  return at;
}

export const round = (n: number) => Math.round(n * 10) / 10;

/* ── Bounds and finishing ─────────────────────────────────────────── */

/** Width of a text run, by the same estimate the SPA's diagrams use (JetBrains Mono advances 0.6 em; Gilroy averages ~0.56). */
export const textWidth = (s: string, size: number, mono = true) => s.length * size * (mono ? 0.6 : 0.56);

/** An item's extent, generously: what the viewBox must hold for it to be fully visible. */
export function boundsOf(it: Item): { x1: number; y1: number; x2: number; y2: number } {
  switch (it.k) {
    case "cell":
    case "band":
      return { x1: it.x, y1: it.y, x2: it.x + it.w, y2: it.y + it.h };
    case "node":
      return { x1: it.x - it.r, y1: it.y - it.r, x2: it.x + it.r, y2: it.y + it.r };
    case "edge": {
      const lw = it.label ? textWidth(it.label, 11) / 2 + 4 : 0;
      const mx = (it.x1 + it.x2) / 2;
      const my = (it.y1 + it.y2) / 2;
      const bow = Math.abs(it.bow ?? 0);
      return {
        x1: Math.min(it.x1, it.x2, mx - lw) - bow / 2,
        y1: Math.min(it.y1, it.y2, my - 8) - bow / 2,
        x2: Math.max(it.x1, it.x2, mx + lw) + bow / 2,
        y2: Math.max(it.y1, it.y2, my + 8) + bow / 2,
      };
    }
    case "ptr": {
      const lw = Math.max(9, textWidth(it.label, 11) / 2 + 2);
      return it.up === false ? { x1: it.x - lw, y1: it.y - 22, x2: it.x + lw, y2: it.y } : { x1: it.x - lw, y1: it.y, x2: it.x + lw, y2: it.y + 22 };
    }
    case "span": {
      const lw = it.label ? textWidth(it.label, 10.5, false) / 2 + 2 : 0;
      const mx = (it.x1 + it.x2) / 2;
      return it.down
        ? { x1: Math.min(it.x1, mx - lw), y1: it.y - 6, x2: Math.max(it.x2, mx + lw), y2: it.y + (it.label ? 16 : 6) }
        : { x1: Math.min(it.x1, mx - lw), y1: it.y - (it.label ? 16 : 1), x2: Math.max(it.x2, mx + lw), y2: it.y + 6 };
    }
    case "text": {
      const size = it.size ?? 13;
      const w = textWidth(it.text, size, it.mono ?? true);
      const x1 = it.anchor === "end" ? it.x - w : it.anchor === "middle" ? it.x - w / 2 : it.x;
      return { x1, y1: it.y - size * 0.7, x2: x1 + w, y2: it.y + size * 0.7 };
    }
  }
}

/**
 * The finished walkthrough: every frame's items shifted so the union of all
 * frames starts at (pad, pad), and the shared viewBox sized to hold them.
 * Generators may lay out from any origin (negative offsets included).
 */
export function finish(w: { title: string; input: string; frames: Frame[] }, pad = 12): Walkthrough {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const f of w.frames) {
    for (const it of f.items) {
      const b = boundsOf(it);
      x1 = Math.min(x1, b.x1);
      y1 = Math.min(y1, b.y1);
      x2 = Math.max(x2, b.x2);
      y2 = Math.max(y2, b.y2);
    }
  }
  if (!Number.isFinite(x1)) return { ...w, width: 0, height: 0 };
  const dx = pad - x1;
  const dy = pad - y1;
  const frames = w.frames.map((f) => ({ caption: f.caption, items: f.items.map((it) => shift(it, dx, dy)) }));
  return { title: w.title, input: w.input, width: Math.ceil(x2 - x1 + pad * 2), height: Math.ceil(y2 - y1 + pad * 2), frames };
}

function shift(it: Item, dx: number, dy: number): Item {
  switch (it.k) {
    case "edge":
      return { ...it, x1: round(it.x1 + dx), y1: round(it.y1 + dy), x2: round(it.x2 + dx), y2: round(it.y2 + dy) };
    case "span":
      return { ...it, x1: round(it.x1 + dx), x2: round(it.x2 + dx), y: round(it.y + dy) };
    default:
      return { ...it, x: round(it.x + dx), y: round(it.y + dy) };
  }
}

/** A short list as prose: "a, b and c". */
export function and(xs: readonly string[]): string {
  return xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : (xs[0] ?? "");
}

/** An array as the statement would print it: [2, 1, 5]. */
export const show = (xs: ReadonlyArray<string | number>) => `[${xs.join(", ")}]`;
