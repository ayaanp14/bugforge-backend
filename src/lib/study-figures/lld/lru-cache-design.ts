import { finish, type Frame, type Item, type Tone } from "../../walkthroughs/core.js";
import type { Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec } from "../../note-figures/kit.js";

/**
 * LRU cache (scripts/study-plans/lld/02-lru-cache):
 *
 *  - lru-classes: LRUCache and its Node, the map's values being the list's
 *    nodes, then the two pointers that make unlinking O(1);
 *  - lru-run: the first exercise's fourth case (capacity 3) run through the
 *    map + doubly linked list the reference solution implements; the list
 *    after each command, the evicted node marked — the printed lines are
 *    checked against the case's expected output.
 */

/* ── Classes ──────────────────────────────────────────────────────── */

const CACHE: ClassSpec = { name: "LRUCache", fields: ["- capacity: int", "- map: Map<String, Node>", "- head, tail: Node"], methods: ["+ get(key): String", "+ put(key, value): String", "- unlink(n)", "- addFirst(n)"] };
const NODE: ClassSpec = { name: "Node", fields: ["+ key: String", "+ value: String", "+ prev: Node", "+ next: Node"] };

function lruClasses(): Walkthrough {
  const SIZE = 10.5;
  const cache0 = classBox("c", CACHE, { size: SIZE });
  const nodeX = cache0.w + 120;
  const nodeY = 20;
  const draw = (n: number): Item[] => {
    const cache = classBox("cache", CACHE, { size: SIZE, tone: n === 0 ? "accent" : "plain", lineTone: n === 2 ? (l) => (/unlink|addFirst/.test(l) ? "accent" : undefined) : undefined });
    const items: Item[] = [...cache.items];
    if (n === 0) return items;
    const node = classBox("node", NODE, { x: nodeX, y: nodeY, size: SIZE, tone: n === 1 ? "accent" : "plain", lineTone: n === 2 ? (l) => (/prev|next/.test(l) ? "accent" : undefined) : undefined });
    const tone = n === 1 ? "accent" : "ink";
    items.push(
      ...node.items,
      ...umlLink("map", { x: cache.x + cache.w, y: cache.y + 50 }, { x: nodeX, y: nodeY + 30 }, "associates", { tone }),
      label("map-t", "map values", cache.x + cache.w + 58, cache.y + 34, { size: 10.5, tone: n === 1 ? "accent" : "soft" }),
      ...umlLink("sen", { x: cache.x + cache.w, y: cache.y + 66 }, { x: nodeX, y: nodeY + 62 }, "associates", { tone }),
      label("sen-t", "head, tail", cache.x + cache.w + 58, cache.y + 86, { size: 10.5, tone: n === 1 ? "accent" : "soft" }),
    );
    // prev and next point back at Node: a loop on its right side.
    const x = nodeX + node.w;
    const y1 = nodeY + node.h - 44;
    const y2 = nodeY + node.h - 14;
    const t2 = n === 2 ? "accent" : "ink";
    items.push(
      { k: "path", id: "self", pts: [[x, y1], [x + 30, y1], [x + 30, y2], [x + 4, y2]], tone: t2, width: 1.3 },
      { k: "path", id: "self-h", pts: [[x + 9, y2 - 4], [x + 2, y2], [x + 9, y2 + 4]], tone: t2, width: 1.3 },
      label("self-t", "2", x + 38, (y1 + y2) / 2 + 4, { anchor: "start", size: 10.5, mono: true, tone: n === 2 ? "accent" : "soft" }),
    );
    return items;
  };
  const frames: Frame[] = [
    { caption: "One class faces the caller: get and put, a fixed capacity, a HashMap from key to node, and the two sentinel nodes that bound the list.", items: draw(0) },
    { caption: "The map's values are the list's own Node objects. A lookup lands on the node, and head.next is always the most recent entry, tail.prev the least.", items: draw(1) },
    { caption: "Each Node points both ways. unlink rewires its two neighbours and addFirst puts it after head — six pointer writes, whatever the cache's size.", items: draw(2) },
  ];
  return finish({ title: "An LRU cache is a map of nodes plus a doubly linked list", input: "", frames });
}

/* ── The run ──────────────────────────────────────────────────────── */

type Op = { op: "PUT"; key: string; value: string } | { op: "GET"; key: string };

const CAPACITY = 3;
const OPS: Op[] = [
  { op: "PUT", key: "1", value: "A" },
  { op: "PUT", key: "2", value: "B" },
  { op: "PUT", key: "3", value: "C" },
  { op: "GET", key: "1" },
  { op: "GET", key: "2" },
  { op: "PUT", key: "4", value: "D" },
  { op: "GET", key: "3" },
  { op: "PUT", key: "5", value: "E" },
];
/** The exercise's fourth case prints these for the eight commands. */
const PRINTED = ["stored 1", "stored 2", "stored 3", "A", "B", "stored 4, evicted 3", "miss", "stored 5, evicted 1"];

interface LNode {
  key: string;
  value: string;
  prev: LNode | null;
  next: LNode | null;
}

class Lru {
  readonly map = new Map<string, LNode>();
  readonly head: LNode = { key: "H", value: "", prev: null, next: null };
  readonly tail: LNode = { key: "T", value: "", prev: null, next: null };
  constructor(readonly capacity: number) {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  private unlink(n: LNode) {
    n.prev!.next = n.next;
    n.next!.prev = n.prev;
  }
  private addFirst(n: LNode) {
    n.prev = this.head;
    n.next = this.head.next;
    this.head.next!.prev = n;
    this.head.next = n;
  }
  get(key: string): string | null {
    const n = this.map.get(key);
    if (!n) return null;
    this.unlink(n);
    this.addFirst(n);
    return n.value;
  }
  put(key: string, value: string): { evicted: LNode | null; updated: boolean } {
    const found = this.map.get(key);
    if (found) {
      found.value = value;
      this.unlink(found);
      this.addFirst(found);
      return { evicted: null, updated: true };
    }
    let evicted: LNode | null = null;
    if (this.map.size === this.capacity) {
      evicted = this.tail.prev!;
      this.unlink(evicted);
      this.map.delete(evicted.key);
    }
    const n: LNode = { key, value, prev: null, next: null };
    this.addFirst(n);
    this.map.set(key, n);
    return { evicted, updated: false };
  }
  order(): LNode[] {
    const out: LNode[] = [];
    for (let n = this.head.next!; n !== this.tail; n = n.next!) out.push(n);
    return out;
  }
}

const W = 50;
const H = 32;
const G = 30;

function lruRun(): Walkthrough {
  const cache = new Lru(CAPACITY);
  const xOf = (i: number) => i * (W + G);

  const draw = (hot: string | null, hotTone: Tone, evicted: LNode | null, cmd: string, line: string, lineTone: "accent" | "error" | "soft"): Item[] => {
    const nodes = cache.order();
    const row: Array<{ id: string; text: string; tone: Tone }> = [
      { id: "nH", text: "head", tone: "muted" },
      ...nodes.map((n) => ({ id: `n${n.key}`, text: `${n.key}:${n.value}`, tone: (n.key === hot ? hotTone : "plain") as Tone })),
      { id: "nT", text: "tail", tone: "muted" },
    ];
    const items: Item[] = [];
    row.forEach((n, i) => items.push(box(n.id, xOf(i), 0, n.text, { w: W, h: H, tone: n.tone, size: 12 })));
    for (let i = 0; i + 1 < row.length; i++) {
      const a = row[i]!;
      const b = row[i + 1]!;
      items.push({ k: "edge", id: `nx-${a.id}-${b.id}`, x1: xOf(i) + W, y1: 10, x2: xOf(i + 1), y2: 10, tone: "line", arrow: true });
      items.push({ k: "edge", id: `pv-${b.id}-${a.id}`, x1: xOf(i + 1), y1: H - 10, x2: xOf(i) + W, y2: H - 10, tone: "line", arrow: true });
    }
    // The evicted node drops out under the tail, in red, for the frame it leaves in.
    const evX = xOf(CAPACITY + 1);
    if (evicted) items.push(box(`n${evicted.key}`, evX, H + 22, `${evicted.key}:${evicted.value}`, { w: W, h: H, tone: "error", size: 12 }), label("ev-t", "evicted", evX + W / 2, H + 22 + H + 14, { tone: "error", size: 11 }));
    items.push(label("mru", nodes.length > 1 ? "most recent" : "only entry", xOf(1) + W / 2, -12, { size: 11 }));
    if (nodes.length > 1) items.push(label("lru", "least recent", xOf(nodes.length) + W / 2, -12, { size: 11 }));
    const keys = [...cache.map.keys()].sort();
    items.push({ k: "text", id: "map", x: 0, y: H + 34, text: `map: {${keys.join(", ")}}  size ${keys.length}/${CAPACITY}`, tone: "soft", anchor: "start", size: 12, mono: true });
    items.push({ k: "text", id: "cmd", x: 0, y: H + 62, text: cmd, tone: "ink", anchor: "start", size: 12, mono: true });
    items.push({ k: "text", id: "out", x: 0, y: H + 84, text: `→ ${line}`, tone: lineTone, anchor: "start", size: 12, mono: true, weight: 600 });
    return items;
  };

  const frames: Frame[] = [];
  const printed: string[] = [];
  for (const o of OPS) {
    if (o.op === "GET") {
      const before = cache.order().map((n) => n.key);
      const v = cache.get(o.key);
      const line = v ?? "miss";
      printed.push(line);
      const caption =
        v === null
          ? `GET ${o.key} misses: key ${o.key} was evicted earlier. No node is touched, so the order stays ${cache.order().map((n) => n.key).join(", ")}.`
          : `GET ${o.key} is a hit. The map hands over node ${o.key}, which unlinks itself from position ${before.indexOf(o.key) + 1} and goes after head: the order is now ${cache.order().map((n) => n.key).join(", ")}.`;
      frames.push({ caption, items: draw(v === null ? null : o.key, "accent", null, `GET ${o.key}`, line, v === null ? "soft" : "accent") });
    } else {
      const r = cache.put(o.key, o.value);
      const line = r.updated ? `updated ${o.key}` : `stored ${o.key}${r.evicted ? `, evicted ${r.evicted.key}` : ""}`;
      printed.push(line);
      const caption = r.evicted
        ? `PUT ${o.key} finds the cache full, so the node before tail goes first: key ${r.evicted.key}, the least recently used, leaves the list and the map. Then ${o.key} goes in after head.`
        : `PUT ${o.key} adds a new node after head, so the newest key is always the most recent. The cache holds ${cache.map.size} of ${CAPACITY}.`;
      frames.push({ caption, items: draw(o.key, "strong", r.evicted, `PUT ${o.key} ${o.value}`, line, r.evicted ? "error" : "accent") });
    }
  }
  if (printed.join("\n") !== PRINTED.join("\n")) throw new Error(`lru-run: the model printed ${JSON.stringify(printed)}`);
  // Three PUTs into a cache with room read alike; keep their captions apart.
  frames[0]!.caption = "PUT 1 into an empty cache: a node goes after head and into the map. head and tail are sentinels, never removed, so no null checks.";
  frames[1]!.caption = "PUT 2 goes in after head too, pushing 1 one place towards the tail. Newest first, oldest last: the list is the order of use.";
  return finish({ title: "LRU cache, capacity 3: hits move to the front, the tail is evicted", input: "PUT 1 A, PUT 2 B, PUT 3 C, GET 1, GET 2, PUT 4 D, GET 3, PUT 5 E", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "lru-classes": lruClasses,
  "lru-run": lruRun,
};
