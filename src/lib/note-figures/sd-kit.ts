import type { Item, LineTone, TextTone, Tone } from "../walkthroughs/core.js";
import { box, label, type Pt } from "../lesson-figures/kit.js";
import { oval } from "./kit.js";

/**
 * Shapes the System Design notes share (content/notes/system-design, the
 * `points` subject whose figures loop with no controls — lib/cs-notes.ts).
 *
 * Those figures are mostly traffic: a request leaving a client, passing a
 * load balancer, landing on a server, a cache or a database. The renderer
 * glides an item that keeps its id between frames (frontend
 * walkthrough-svg), so a `packet` with one id per request, placed at the
 * next stop in each frame, is a request moving — on a loop it reads as
 * traffic flowing. The convention the modules use is a pipeline: in frame t
 * request t+1 waits at the start, request t is one stop on, and so on, so
 * every frame moves every packet one stop and no frame is idle.
 */

export type { Pt };

export interface NodeBox {
  items: Item[];
  /** The box's centre, and the middles of its four sides — where an arrow starts or lands. */
  mid: Pt;
  left: Pt;
  right: Pt;
  top: Pt;
  bottom: Pt;
}

const sides = (x: number, y: number, w: number, h: number) => ({
  mid: { x: x + w / 2, y: y + h / 2 },
  left: { x, y: y + h / 2 },
  right: { x: x + w, y: y + h / 2 },
  top: { x: x + w / 2, y },
  bottom: { x: x + w / 2, y: y + h },
});

/**
 * A component as a labelled box — a client, a server, a load balancer, a
 * gateway, a queue. (x, y) is its top-left corner; `sub` is a line of small
 * text under it (its state, a count).
 */
export function service(id: string, x: number, y: number, name: string, o: { w?: number; h?: number; tone?: Tone; size?: number; sub?: string; subTone?: TextTone } = {}): NodeBox {
  const w = o.w ?? 104;
  const h = o.h ?? 38;
  const items: Item[] = [box(id, x, y, name, { w, h, tone: o.tone ?? "plain", size: o.size ?? 12 })];
  if (o.sub !== undefined) items.push(label(`${id}-sub`, o.sub, x + w / 2, y + h + 13, { tone: o.subTone ?? "soft", size: 11 }));
  return { items, ...sides(x, y, w, h) };
}

/**
 * A database as a cylinder: a box for the body under an ellipse for the lid.
 * (x, y) is the top-left of the body; the lid rises `lid` above it.
 */
export function database(id: string, x: number, y: number, name: string, o: { w?: number; h?: number; tone?: Tone; size?: number; sub?: string; subTone?: TextTone; lid?: number } = {}): NodeBox {
  const w = o.w ?? 96;
  const h = o.h ?? 40;
  const lid = o.lid ?? 6;
  const tone = o.tone ?? "plain";
  const items: Item[] = [
    box(id, x, y, name, { w, h, tone, size: o.size ?? 12 }),
    oval(`${id}-lid`, x + w / 2, y, w / 2, lid, { fill: tone === "strong" || tone === "accent" ? tone : "plain", tone: tone === "muted" ? "faint" : "line" }),
  ];
  if (o.sub !== undefined) items.push(label(`${id}-sub`, o.sub, x + w / 2, y + h + 13, { tone: o.subTone ?? "soft", size: 11 }));
  return { items, ...sides(x, y - lid, w, h + lid) };
}

/**
 * A request, a message or a token in flight: a small circle at `p` with a
 * short tag (a number, a letter). Keep its id across frames and move `p`, and
 * it glides there.
 */
export function packet(id: string, p: Pt, o: { text?: string | number; tone?: Tone; r?: number } = {}): Item {
  return { k: "node", id, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, r: o.r ?? 10, text: String(o.text ?? ""), tone: o.tone ?? "accent", size: 10 };
}

/** The point `t` of the way from a to b (0 = a, 1 = b): where a packet sits on a wire. */
export const along = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** A wire between two components, arrowhead at `b` unless `head` is false. */
export function wire(id: string, a: Pt, b: Pt, o: { tone?: LineTone; dashed?: boolean; label?: string; head?: boolean; bow?: number } = {}): Item {
  return { k: "edge", id, x1: Math.round(a.x * 10) / 10, y1: Math.round(a.y * 10) / 10, x2: Math.round(b.x * 10) / 10, y2: Math.round(b.y * 10) / 10, tone: o.tone ?? "line", arrow: o.head ?? true, dashed: o.dashed, label: o.label, bow: o.bow };
}
