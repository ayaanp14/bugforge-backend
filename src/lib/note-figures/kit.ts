import { round, textWidth, type Item, type LineTone, type TextTone, type Tone } from "../walkthroughs/core.js";
import { box, type Pt } from "../lesson-figures/kit.js";

/**
 * Layout helpers for the CS notes' figures (see index.ts) — the shapes the
 * four subjects keep drawing that the lessons' kit (../lesson-figures/kit.ts:
 * box, label, arrow, region, column, bars, chain, binaryTree, graph, grid,
 * chart) has no word for: a Gantt chart (CPU scheduling, a disk's timeline),
 * a sequence diagram (a handshake, a DNS lookup, two transactions), a UML
 * class box and its relationships (OOP), and the ER shapes (DBMS). Each
 * returns plain items in SVG user units; `finish()` shifts the union to the
 * origin. Ids are derived from the prefix so a figure can keep one between
 * frames and have it glide.
 */

export type { Pt };

/* ── Gantt chart ──────────────────────────────────────────────────── */

export interface GanttSlot {
  /** What ran: "P1", "idle". */
  who: string;
  from: number;
  to: number;
  tone?: Tone;
}

/**
 * A Gantt chart: one bar per slot along a time axis, `unit` px per time
 * unit, its name inside when it fits, and the time under every boundary
 * (each time once). Slot ids are `${prefix}${i}` by position, tick ids
 * `${prefix}t${time}` — so a chart that grows frame by frame keeps its
 * earlier bars and ticks in place.
 */
export function gantt(prefix: string, slots: readonly GanttSlot[], o: { x?: number; y?: number; unit?: number; h?: number; ticks?: boolean; size?: number } = {}): { items: Item[]; x: (t: number) => number; bottom: number } {
  const { x = 0, y = 0, unit = 26, h = 34, ticks = true } = o;
  const at = (t: number) => round(x + t * unit);
  const items: Item[] = [];
  const times = new Set<number>();
  slots.forEach((s, i) => {
    if (s.to <= s.from) throw new Error(`gantt: slot ${i} (${s.who}) runs ${s.from}–${s.to}`);
    const w = at(s.to) - at(s.from);
    const text = textWidth(s.who, o.size ?? 12) + 6 <= w ? s.who : "";
    items.push(box(`${prefix}${i}`, at(s.from), y, text, { tone: s.tone ?? (s.who === "idle" ? "muted" : "plain"), w, h, size: o.size ?? 12 }));
    times.add(s.from);
    times.add(s.to);
  });
  if (ticks) for (const t of [...times].sort((a, b) => a - b)) items.push({ k: "text", id: `${prefix}t${t}`, x: at(t), y: y + h + 11, text: String(t), tone: "faint", anchor: "middle", size: 10 });
  return { items, x: at, bottom: y + h + (ticks ? 18 : 0) };
}

/* ── Sequence diagram ─────────────────────────────────────────────── */

/**
 * The actors of a sequence diagram: a named box each, `gap` apart, with a
 * dashed lifeline `length` long under it. `xOf(i)` is actor i's lifeline;
 * `top` is where the lifelines start — draw messages below it.
 */
export function lifelines(
  prefix: string,
  names: readonly string[],
  o: { x?: number; y?: number; gap?: number; w?: number; h?: number; length: number; tone?: (i: number) => Tone | undefined; size?: number },
): { items: Item[]; xOf: (i: number) => number; top: number } {
  const { x = 0, y = 0, gap = 200, w = 96, h = 30 } = o;
  const xOf = (i: number) => x + i * gap;
  const items: Item[] = [];
  names.forEach((n, i) => {
    items.push({ k: "edge", id: `${prefix}l${i}`, x1: xOf(i), y1: y + h, x2: xOf(i), y2: y + h + o.length, tone: "faint", dashed: true });
    items.push(box(`${prefix}${i}`, xOf(i) - w / 2, y, n, { tone: o.tone?.(i) ?? "plain", w, h, size: o.size ?? 12 }));
  });
  return { items, xOf, top: y + h };
}

/**
 * One message between two lifelines: an arrow from (x1, y) to (x2, y + drop)
 * — a drop shows the time it spent on the wire — with its label above the
 * arrow's middle, clear of the line. Dashed for a reply when `dashed`.
 */
export function message(id: string, x1: number, x2: number, y: number, text: string, o: { drop?: number; tone?: LineTone; dashed?: boolean; textTone?: TextTone; size?: number } = {}): Item[] {
  const drop = o.drop ?? 0;
  const dir = Math.sign(x2 - x1) || 1;
  const items: Item[] = [{ k: "edge", id, x1: round(x1 + dir * 2), y1: y, x2: round(x2 - dir * 3), y2: y + drop, tone: o.tone ?? "ink", arrow: true, dashed: o.dashed }];
  if (text) {
    // A sloped arrow's label rides above its midpoint, nudged towards the sender so it clears the slope.
    const mx = round((x1 + x2) / 2);
    const my = round(y + drop / 2 - 9 - Math.min(10, Math.abs(drop) / 4));
    items.push({ k: "text", id: `${id}-t`, x: mx, y: my, text, tone: o.textTone ?? (o.tone === "accent" ? "accent" : o.tone === "error" ? "error" : "ink"), anchor: "middle", size: o.size ?? 11.5, mono: true });
  }
  return items;
}

/* ── UML class diagrams ───────────────────────────────────────────── */

export interface ClassSpec {
  name: string;
  /** "interface", "abstract", "enum" — drawn as «interface» over the name. */
  stereotype?: string;
  /** "- balance: double" — visibility, name, type, as UML writes them. */
  fields?: readonly string[];
  /** "+ deposit(amount: double): void". */
  methods?: readonly string[];
}

const LINE_H = 16;

/**
 * A UML class box: the name (with its stereotype over it), then a
 * compartment of fields and one of methods, each line left-aligned in
 * mono. Width fits the longest line unless `w` is given. Returns the box
 * and the midpoints of its four sides for umlLink.
 */
export function classBox(
  prefix: string,
  spec: ClassSpec,
  o: { x?: number; y?: number; w?: number; tone?: Tone; size?: number; lineTone?: (line: string) => TextTone | undefined },
): { items: Item[]; x: number; y: number; w: number; h: number; top: Pt; bottom: Pt; left: Pt; right: Pt } {
  const { x = 0, y = 0 } = o;
  const size = o.size ?? 11;
  const fields = spec.fields ?? [];
  const methods = spec.methods ?? [];
  const longest = Math.max(textWidth(spec.name, 13, false) + 8, spec.stereotype ? textWidth(`«${spec.stereotype}»`, 10.5, false) : 0, ...[...fields, ...methods].map((l) => textWidth(l, size)));
  const w = o.w ?? Math.max(110, Math.ceil(longest + 18));
  const head = spec.stereotype ? 38 : 26;
  const fh = fields.length ? fields.length * LINE_H + 8 : 8;
  const mh = methods.length ? methods.length * LINE_H + 8 : 8;
  const h = head + fh + mh;
  const items: Item[] = [{ k: "cell", id: prefix, x, y, w, h, text: "", tone: o.tone ?? "plain" }];
  if (spec.stereotype) items.push({ k: "text", id: `${prefix}-s`, x: x + w / 2, y: y + 11, text: `«${spec.stereotype}»`, tone: "soft", anchor: "middle", size: 10.5, mono: false });
  items.push({ k: "text", id: `${prefix}-n`, x: x + w / 2, y: y + head - 13, text: spec.name, tone: o.tone === "strong" ? "ink" : "ink", anchor: "middle", size: 13, mono: false, weight: 700 });
  items.push({ k: "path", id: `${prefix}-d1`, pts: [[x, y + head], [x + w, y + head]], tone: "line", width: 1 });
  items.push({ k: "path", id: `${prefix}-d2`, pts: [[x, y + head + fh], [x + w, y + head + fh]], tone: "line", width: 1 });
  fields.forEach((f, i) => items.push({ k: "text", id: `${prefix}-f${i}`, x: x + 8, y: y + head + 4 + LINE_H / 2 + i * LINE_H, text: f, tone: o.lineTone?.(f) ?? "ink", anchor: "start", size, mono: true }));
  methods.forEach((m, i) => items.push({ k: "text", id: `${prefix}-m${i}`, x: x + 8, y: y + head + fh + 4 + LINE_H / 2 + i * LINE_H, text: m, tone: o.lineTone?.(m) ?? "ink", anchor: "start", size, mono: true }));
  return { items, x, y, w, h, top: { x: x + w / 2, y }, bottom: { x: x + w / 2, y: y + h }, left: { x, y: y + h / 2 }, right: { x: x + w, y: y + h / 2 } };
}

/**
 * UML relationships. `from` is the subclass / the implementer / the whole /
 * the user; `to` is the parent / the interface / the part / the thing used.
 *
 *  - inherits:   solid line, hollow triangle at `to`
 *  - implements: dashed line, hollow triangle at `to`
 *  - composes:   solid line, filled diamond at `from` (the part dies with the whole)
 *  - aggregates: solid line, hollow diamond at `from` (the part lives on its own)
 *  - associates: solid line, open arrowhead at `to` (navigable that way)
 *  - depends:    dashed line, arrowhead at `to`
 *
 * `label` names the association ("owns", "1..*"), drawn on the line.
 */
export type UmlKind = "inherits" | "implements" | "composes" | "aggregates" | "associates" | "depends";

export function umlLink(id: string, from: Pt, to: Pt, kind: UmlKind, o: { tone?: LineTone; label?: string } = {}): Item[] {
  const tone = o.tone ?? "ink";
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular, for the markers' width.
  const px = -uy;
  const py = ux;
  const pt = (p: Pt, along: number, across: number): [number, number] => [round(p.x + ux * along + px * across), round(p.y + uy * along + py * across)];
  const items: Item[] = [];
  let a: Pt = from;
  let b: Pt = to;
  if (kind === "inherits" || kind === "implements") {
    const L = 12;
    const W = 7;
    items.push({ k: "path", id: `${id}-m`, pts: [[round(to.x), round(to.y)], pt(to, -L, W), pt(to, -L, -W)], closed: true, fill: "plain", tone, width: 1.3 });
    b = { x: to.x - ux * L, y: to.y - uy * L };
  } else if (kind === "composes" || kind === "aggregates") {
    const L = 20;
    const W = 6;
    const diamond: Array<[number, number]> = [[round(from.x), round(from.y)], pt(from, L / 2, W), pt(from, L, 0), pt(from, L / 2, -W)];
    items.push(kind === "composes" ? { k: "path", id: `${id}-m`, pts: diamond, closed: true, solid: true, tone, width: 1.3 } : { k: "path", id: `${id}-m`, pts: diamond, closed: true, fill: "plain", tone, width: 1.3 });
    a = { x: from.x + ux * L, y: from.y + uy * L };
  }
  const arrowHead = kind === "associates" || kind === "depends";
  items.unshift({ k: "edge", id, x1: round(a.x), y1: round(a.y), x2: round(b.x), y2: round(b.y), tone, arrow: arrowHead, dashed: kind === "implements" || kind === "depends", label: o.label });
  return items;
}

/* ── ER diagrams ──────────────────────────────────────────────────── */

/** A closed polygon approximating an ellipse centred on (cx, cy): an ER attribute's oval. */
export function oval(id: string, cx: number, cy: number, rx: number, ry: number, o: { tone?: LineTone; fill?: Tone; dashed?: boolean; steps?: number } = {}): Item {
  const steps = o.steps ?? 28;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    pts.push([round(cx + rx * Math.cos(a)), round(cy + ry * Math.sin(a))]);
  }
  return { k: "path", id, pts, closed: true, fill: o.fill ?? "plain", tone: o.tone ?? "line", dashed: o.dashed, width: 1.3 };
}

/** A diamond centred on (cx, cy), `w` across and `h` tall: an ER relationship, a decision. */
export function diamond(id: string, cx: number, cy: number, w: number, h: number, o: { tone?: LineTone; fill?: Tone; solid?: boolean } = {}): Item {
  return { k: "path", id, pts: [[cx, round(cy - h / 2)], [round(cx + w / 2), cy], [cx, round(cy + h / 2)], [round(cx - w / 2), cy]], closed: true, fill: o.solid ? undefined : (o.fill ?? "plain"), solid: o.solid, tone: o.tone ?? "ink", width: 1.3 };
}

/** An ER entity: a box with its name (a weak entity gets a second box inside the first). Returns the box's centre and size for lines. */
export function entity(id: string, cx: number, cy: number, name: string, o: { w?: number; h?: number; weak?: boolean; tone?: Tone } = {}): { items: Item[]; mid: Pt; w: number; h: number } {
  const w = o.w ?? Math.max(96, Math.ceil(textWidth(name, 13, false) + 28));
  const h = o.h ?? 36;
  const items: Item[] = [{ k: "cell", id, x: round(cx - w / 2), y: round(cy - h / 2), w, h, text: o.weak ? "" : name, tone: o.tone ?? "plain", size: 13 }];
  if (o.weak) {
    items.push({ k: "cell", id: `${id}-in`, x: round(cx - w / 2 + 4), y: round(cy - h / 2 + 4), w: w - 8, h: h - 8, text: name, tone: o.tone ?? "plain", size: 13 });
  }
  return { items, mid: { x: cx, y: cy }, w, h };
}

/** An ER relationship: a diamond with its verb inside (an identifying one, for a weak entity, gets a second diamond). */
export function relation(id: string, cx: number, cy: number, verb: string, o: { w?: number; h?: number; identifying?: boolean; tone?: LineTone } = {}): { items: Item[]; mid: Pt; w: number; h: number } {
  const w = o.w ?? Math.max(84, Math.ceil(textWidth(verb, 12, false) * 1.7 + 24));
  const h = o.h ?? 44;
  const items: Item[] = [diamond(id, cx, cy, w, h, { tone: o.tone })];
  if (o.identifying) items.push(diamond(`${id}-in`, cx, cy, w - 14, h - 10, { tone: o.tone }));
  items.push({ k: "text", id: `${id}-t`, x: cx, y: cy, text: verb, tone: "ink", anchor: "middle", size: 12, mono: false, weight: 600 });
  return { items, mid: { x: cx, y: cy }, w, h };
}

/**
 * An ER attribute: an oval with its name. A key attribute is underlined, a
 * derived one dashed, a multivalued one a double oval.
 */
export function attribute(id: string, cx: number, cy: number, name: string, o: { key?: boolean; derived?: boolean; multivalued?: boolean; rx?: number; ry?: number; tone?: LineTone } = {}): { items: Item[]; mid: Pt; rx: number; ry: number } {
  const rx = o.rx ?? Math.max(36, Math.ceil(textWidth(name, 11.5) / 2 + 14));
  const ry = o.ry ?? 15;
  const items: Item[] = [oval(id, cx, cy, rx, ry, { dashed: o.derived, tone: o.tone })];
  if (o.multivalued) items.push(oval(`${id}-in`, cx, cy, rx - 4, ry - 4, { tone: o.tone }));
  items.push({ k: "text", id: `${id}-t`, x: cx, y: cy, text: name, tone: "ink", anchor: "middle", size: 11.5, mono: true });
  if (o.key) {
    const half = textWidth(name, 11.5) / 2;
    items.push({ k: "path", id: `${id}-u`, pts: [[round(cx - half), cy + 8], [round(cx + half), cy + 8]], tone: "ink", width: 1.1 });
  }
  return { items, mid: { x: cx, y: cy }, rx, ry };
}

/** The point where the line from an oval's centre towards `p` leaves it — so an attribute's line starts at its rim. */
export function ovalRim(c: Pt, rx: number, ry: number, p: Pt): Pt {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const t = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) || 1);
  return { x: round(c.x + dx * t), y: round(c.y + dy * t) };
}

/** The point where the line from a box's centre towards `p` leaves it (an entity's rim). */
export function boxRim(c: Pt, w: number, h: number, p: Pt): Pt {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const t = Math.min(dx ? w / 2 / Math.abs(dx) : Infinity, dy ? h / 2 / Math.abs(dy) : Infinity);
  return Number.isFinite(t) ? { x: round(c.x + dx * t), y: round(c.y + dy * t) } : c;
}

/** The point where the line from a diamond's centre towards `p` leaves it (a relationship's rim). */
export function diamondRim(c: Pt, w: number, h: number, p: Pt): Pt {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const t = 1 / (Math.abs(dx) / (w / 2) + Math.abs(dy) / (h / 2) || 1);
  return { x: round(c.x + dx * t), y: round(c.y + dy * t) };
}

/* ── Text ─────────────────────────────────────────────────────────── */

/**
 * Lines of text one under the other, left-aligned (code, a header's
 * fields, a log): ids `${prefix}${i}`. Mono by default. A line's leading
 * spaces become an x offset of one mono advance each — SVG collapses
 * whitespace, so indented code would otherwise draw flush left.
 */
export function lines(prefix: string, texts: readonly string[], x: number, y: number, o: { size?: number; gap?: number; mono?: boolean; tone?: (i: number) => TextTone | undefined; weight?: number } = {}): Item[] {
  const size = o.size ?? 12;
  const gap = o.gap ?? Math.round(size * 1.45);
  const mono = o.mono ?? true;
  return texts.map((t, i) => {
    const indent = mono ? t.length - t.trimStart().length : 0;
    return { k: "text", id: `${prefix}${i}`, x: round(x + textWidth(" ".repeat(indent), size)), y: y + i * gap, text: indent ? t.trimStart() : t, tone: o.tone?.(i) ?? "ink", anchor: "start", size, mono, weight: o.weight };
  });
}
