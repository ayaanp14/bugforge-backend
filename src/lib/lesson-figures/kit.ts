import { CELL, GAP, link, round, treeLayout, type Item, type LineTone, type TextTone, type Tone } from "../walkthroughs/core.js";

/**
 * Layout helpers for the roadmap lessons' figures (see index.ts), on top of
 * the walkthrough primitives in ../walkthroughs/core.ts. Each returns plain
 * items in SVG user units; `finish()` shifts the union to the origin, so a
 * figure may lay out from anywhere. Ids are `${prefix}${i}` so a value that
 * keeps its id between frames glides to its new place.
 */

export type Pt = { x: number; y: number };

/** A box anywhere: an array slot, a node of a list, a stack entry, a label chip. (x, y) is its top-left corner. */
export function box(id: string, x: number, y: number, text: string | number, o: { tone?: Tone; w?: number; h?: number; size?: number } = {}): Item {
  const it: Item = { k: "cell", id, x, y, w: o.w ?? CELL, h: o.h ?? CELL, text: String(text), tone: o.tone ?? "plain" };
  return o.size ? { ...it, size: o.size } : it;
}

/** A line of text (sans by default — a label, not a value). */
export function label(id: string, text: string, x: number, y: number, o: { tone?: TextTone; anchor?: "start" | "middle" | "end"; size?: number; mono?: boolean; weight?: number } = {}): Item {
  return { k: "text", id, x, y, text, tone: o.tone ?? "soft", anchor: o.anchor ?? "middle", size: o.size ?? 12, mono: o.mono ?? false, weight: o.weight };
}

/** A straight or bowed arrow between two points (no node rims to trim — use core's `link` between circles). */
export function arrow(id: string, a: Pt, b: Pt, o: { tone?: LineTone; dashed?: boolean; bow?: number; label?: string; head?: boolean } = {}): Item {
  return { k: "edge", id, x1: round(a.x), y1: round(a.y), x2: round(b.x), y2: round(b.y), tone: o.tone ?? "ink", arrow: o.head ?? true, dashed: o.dashed, bow: o.bow, label: o.label };
}

/** A dashed outline with a label over its top-left corner: a group, a memory region, "the window". */
export function region(id: string, x: number, y: number, w: number, h: number, text?: string, o: { tone?: Tone; labelTone?: TextTone } = {}): Item[] {
  const items: Item[] = [{ k: "band", id, x, y, w, h, tone: o.tone ?? "ghost" }];
  if (text) items.push({ k: "text", id: `${id}-t`, x: x + 2, y: y - 9, text, tone: o.labelTone ?? "soft", anchor: "start", size: 11, mono: false, weight: 600 });
  return items;
}

/**
 * A vertical stack of cells, `values[0]` at the top — a call stack, a stack
 * with its top first, a column of buckets. Cells are `w` wide.
 */
export function column(prefix: string, values: ReadonlyArray<string | number>, o: { x?: number; y?: number; w?: number; h?: number; gap?: number; tone?: (i: number) => Tone | undefined; size?: number } = {}): Item[] {
  const { x = 0, y = 0, w = CELL * 2, h = 30, gap = 4 } = o;
  return values.map((v, i) => box(`${prefix}${i}`, x, y + i * (h + gap), v, { tone: o.tone?.(i) ?? "plain", w, h, size: o.size }));
}

/**
 * Bars standing on a baseline at y = `base`, one per value, `unit` px per 1;
 * the value is written on the bar (or above it when it is too short). For
 * heights, histograms, a sort in progress.
 */
export function bars(prefix: string, values: readonly number[], o: { x?: number; base?: number; unit?: number; w?: number; gap?: number; tone?: (i: number) => Tone | undefined; values?: boolean; index?: boolean } = {}): Item[] {
  const { x = 0, base = 0, unit = 12, w = 30, gap = 6, values: show = true } = o;
  const items: Item[] = [];
  values.forEach((v, i) => {
    const h = Math.max(2, v * unit);
    const bx = x + i * (w + gap);
    const tone = o.tone?.(i) ?? "plain";
    items.push({ k: "cell", id: `${prefix}${i}`, x: bx, y: base - h, w, h, text: show && h >= 22 ? String(v) : "", tone, size: 12 });
    if (show && h < 22) items.push({ k: "text", id: `${prefix}v${i}`, x: bx + w / 2, y: base - h - 9, text: String(v), tone: "soft", anchor: "middle", size: 11 });
    if (o.index) items.push({ k: "text", id: `${prefix}i${i}`, x: bx + w / 2, y: base + 11, text: String(i), tone: "faint", anchor: "middle", size: 10 });
  });
  return items;
}

/**
 * A singly linked list: one box per value, an arrow from each to the next,
 * and the tail's arrow to a faint "null" (unless `tail` is false). Returns
 * the items and each node's box so a figure can point at one.
 */
export function chain(
  prefix: string,
  values: ReadonlyArray<string | number>,
  o: { x?: number; y?: number; w?: number; h?: number; gap?: number; tone?: (i: number) => Tone | undefined; edgeTone?: (i: number) => LineTone | undefined; tail?: string | false } = {},
): { items: Item[]; at: (i: number) => { x: number; y: number; w: number; h: number; mid: Pt } } {
  const { x = 0, y = 0, w = 44, h = 36, gap = 30 } = o;
  const at = (i: number) => ({ x: x + i * (w + gap), y, w, h, mid: { x: x + i * (w + gap) + w / 2, y: y + h / 2 } });
  const items: Item[] = [];
  values.forEach((v, i) => {
    const b = at(i);
    items.push(box(`${prefix}${i}`, b.x, b.y, v, { tone: o.tone?.(i) ?? "plain", w, h }));
    const last = i === values.length - 1;
    if (!last || o.tail !== false) items.push(arrow(`${prefix}a${i}`, { x: b.x + w + 2, y: b.mid.y }, { x: b.x + w + gap - 3, y: b.mid.y }, { tone: o.edgeTone?.(i) ?? "ink" }));
  });
  if (o.tail !== false && values.length) {
    const end = at(values.length);
    items.push({ k: "text", id: `${prefix}null`, x: end.x, y: end.mid.y, text: o.tail ?? "null", tone: "faint", anchor: "start", size: 12 });
  }
  return { items, at };
}

/**
 * A binary tree from level-order values (`null` = no node there, the usual
 * [3, 9, 20, null, null, 15, 7] form), laid out tidily: leaves in columns,
 * parents centred over their children. Node ids are `${prefix}${index}` by
 * level-order index; edge ids `${prefix}e${child index}`.
 */
export function binaryTree(
  prefix: string,
  level: ReadonlyArray<string | number | null>,
  o: { x?: number; y?: number; dx?: number; dy?: number; r?: number; tone?: (i: number) => Tone | undefined; edgeTone?: (child: number) => LineTone | undefined; size?: number } = {},
): { items: Item[]; pos: Map<number, Pt>; children: (i: number) => number[] } {
  const { r = 17, dx = 44, dy = 58 } = o;
  // Level order with gaps: the children of the k-th present node are the next two slots.
  const kids = new Map<number, [number | null, number | null]>();
  let next = 1;
  for (let i = 0; i < level.length && next < level.length; i++) {
    if (level[i] === null) continue;
    const l = next < level.length && level[next] !== null ? next : null;
    const rr = next + 1 < level.length && level[next + 1] !== null ? next + 1 : null;
    kids.set(i, [l, rr]);
    next += 2;
  }
  const children = (i: number) => (kids.get(i) ?? [null, null]).filter((c): c is number => c !== null);
  // A lone child still leans to its side: give it a phantom sibling column.
  const at = treeLayout<number>(0, children, { dx, dy, x: o.x ?? 0, y: o.y ?? 0 });
  for (const [l, rr] of kids.values()) {
    if (l !== null && rr === null) shiftSubtree(l, -dx / 2);
    if (rr !== null && l === null) shiftSubtree(rr, dx / 2);
  }
  function shiftSubtree(i: number, by: number) {
    const q = at.get(i);
    if (q) at.set(i, { ...q, x: q.x + by });
    for (const c of children(i)) shiftSubtree(c, by);
  }
  const items: Item[] = [];
  const pos = new Map<number, Pt>();
  for (const [i, p] of at) pos.set(i, { x: round(p.x), y: round(p.y) });
  for (const [i] of at) for (const c of children(i)) items.push(link(`${prefix}e${c}`, pos.get(i)!, pos.get(c)!, r, { tone: o.edgeTone?.(c) ?? "line" }));
  for (const [i, p] of pos) {
    const node: Item = { k: "node", id: `${prefix}${i}`, x: p.x, y: p.y, r, text: String(level[i]), tone: o.tone?.(i) ?? "plain" };
    items.push(o.size ? { ...node, size: o.size } : node);
  }
  return { items, pos, children };
}

/**
 * A graph from node names, their centres and edges [a, b, weight?]: edges
 * first so nodes sit on top. Edge ids `${prefix}e${a}-${b}`, node ids
 * `${prefix}${i}`; `directed` draws arrowheads, a weight is the edge's label.
 */
export function graph(
  prefix: string,
  names: readonly string[],
  pos: readonly Pt[],
  edges: ReadonlyArray<readonly [number, number, (number | string)?]>,
  o: { r?: number; directed?: boolean; tone?: (i: number) => Tone | undefined; edgeTone?: (e: number) => LineTone | undefined; bow?: (e: number) => number | undefined; dashed?: (e: number) => boolean | undefined; size?: number } = {},
): Item[] {
  const { r = 18 } = o;
  const items: Item[] = [];
  edges.forEach(([a, b, wgt], e) =>
    items.push(link(`${prefix}e${a}-${b}`, pos[a], pos[b], r, { tone: o.edgeTone?.(e) ?? "line", arrow: o.directed, bow: o.bow?.(e), dashed: o.dashed?.(e), label: wgt === undefined ? undefined : String(wgt) })),
  );
  names.forEach((n, i) => {
    const node: Item = { k: "node", id: `${prefix}${i}`, x: pos[i].x, y: pos[i].y, r, text: n, tone: o.tone?.(i) ?? "plain" };
    items.push(o.size ? { ...node, size: o.size } : node);
  });
  return items;
}

/**
 * A table of cells — a matrix, a DP table, a grid of pairs — with optional
 * faint row and column headers. Cell ids `${prefix}${r}-${c}`.
 */
export function grid(
  prefix: string,
  rows: ReadonlyArray<ReadonlyArray<string | number>>,
  o: { x?: number; y?: number; w?: number; h?: number; gap?: number; tone?: (r: number, c: number) => Tone | undefined; text?: (r: number, c: number) => string; rowLabels?: readonly string[]; colLabels?: readonly string[]; size?: number } = {},
): Item[] {
  const { x = 0, y = 0, w = 36, h = 36, gap = 4 } = o;
  const items: Item[] = [];
  rows.forEach((row, r) =>
    row.forEach((v, c) => items.push(box(`${prefix}${r}-${c}`, x + c * (w + gap), y + r * (h + gap), o.text ? o.text(r, c) : v, { tone: o.tone?.(r, c) ?? "plain", w, h, size: o.size ?? 13 }))),
  );
  o.rowLabels?.forEach((t, r) => items.push({ k: "text", id: `${prefix}r${r}`, x: x - 8, y: y + r * (h + gap) + h / 2, text: t, tone: "faint", anchor: "end", size: 11 }));
  o.colLabels?.forEach((t, c) => items.push({ k: "text", id: `${prefix}c${c}`, x: x + c * (w + gap) + w / 2, y: y - 10, text: t, tone: "faint", anchor: "middle", size: 11 }));
  return items;
}

/** Where cell (r, c) of a grid() with the same options sits. */
export function gridCell(r: number, c: number, o: { x?: number; y?: number; w?: number; h?: number; gap?: number } = {}): { x: number; y: number; w: number; h: number; mid: Pt } {
  const { x = 0, y = 0, w = 36, h = 36, gap = 4 } = o;
  const cx = x + c * (w + gap);
  const cy = y + r * (h + gap);
  return { x: cx, y: cy, w, h, mid: { x: cx + w / 2, y: cy + h / 2 } };
}

/**
 * Axes for a small chart: the origin at (x, y + h), `xMax`/`yMax` in data
 * units, labels on both axes. `px`/`py` map data to SVG units, and `curve`
 * samples a function into a path — growth rates, a cost curve.
 */
export function chart(prefix: string, o: { x?: number; y?: number; w: number; h: number; xMax: number; yMax: number; xLabel?: string; yLabel?: string; xTicks?: readonly number[]; yTicks?: readonly number[] }) {
  const { x = 0, y = 0, w, h, xMax, yMax } = o;
  const px = (v: number) => round(x + (v / xMax) * w);
  const py = (v: number) => round(y + h - (Math.min(v, yMax) / yMax) * h);
  const items: Item[] = [
    { k: "path", id: `${prefix}ax`, pts: [[x, y], [x, y + h], [x + w, y + h]], tone: "ink", width: 1.2 },
  ];
  if (o.xLabel) items.push({ k: "text", id: `${prefix}xl`, x: x + w, y: y + h + 26, text: o.xLabel, tone: "soft", anchor: "end", size: 11, mono: false, weight: 600 });
  if (o.yLabel) items.push({ k: "text", id: `${prefix}yl`, x: x, y: y - 12, text: o.yLabel, tone: "soft", anchor: "start", size: 11, mono: false, weight: 600 });
  o.xTicks?.forEach((t, i) => items.push({ k: "text", id: `${prefix}xt${i}`, x: px(t), y: y + h + 11, text: String(t), tone: "faint", anchor: "middle", size: 10 }));
  o.yTicks?.forEach((t, i) => items.push({ k: "text", id: `${prefix}yt${i}`, x: x - 6, y: py(t), text: String(t), tone: "faint", anchor: "end", size: 10 }));
  const curve = (id: string, f: (v: number) => number, c: { tone?: LineTone; dashed?: boolean; from?: number; to?: number; steps?: number; width?: number } = {}): Item => {
    const from = c.from ?? 0;
    const to = c.to ?? xMax;
    const steps = c.steps ?? 40;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
      const v = from + ((to - from) * i) / steps;
      const fy = f(v);
      pts.push([px(v), py(fy)]);
      if (fy >= yMax) break;
    }
    return { k: "path", id, pts, tone: c.tone ?? "accent", dashed: c.dashed, width: c.width ?? 2 };
  };
  return { items, px, py, curve };
}

export { CELL, GAP };
