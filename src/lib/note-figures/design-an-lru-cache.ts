import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { classBox, lifelines, message, umlLink } from "./kit.js";

/**
 * Design an LRU Cache: the note's figures
 * (content/notes/low-level-design/design-an-lru-cache.md). Every figure is
 * drawn from one LRU model run here — a hash map plus a doubly linked list
 * with head and tail sentinels, the design the note's programs implement —
 * and the run's printed lines are checked against the note's output fence:
 *
 *  - lru-classes: LRUCache, DoublyLinkedList and Node, one class a frame;
 *  - lru-run: the note's ten operations at capacity 3, the list and the
 *    map after each, evictions marked;
 *  - lru-move-to-front: get(3) as pointer surgery, every arrow drawn from
 *    the model's own prev/next fields;
 *  - lru-put-sequence: put(4, D) on a full cache as a sequence diagram,
 *    the calls recorded as the model makes them.
 */

/* ── The model ────────────────────────────────────────────────────── */

interface LNode {
  key: number;
  value: string;
  prev: LNode | null;
  next: LNode | null;
}

type Call = { to: "map" | "list"; text: string; reply?: string };

class Lru {
  readonly map = new Map<number, LNode>();
  readonly head: LNode = { key: -1, value: "H", prev: null, next: null };
  readonly tail: LNode = { key: -2, value: "T", prev: null, next: null };
  calls: Call[] = [];
  constructor(readonly capacity: number) {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  private remove(n: LNode) {
    n.prev!.next = n.next;
    n.next!.prev = n.prev;
  }
  private addFirst(n: LNode) {
    n.prev = this.head;
    n.next = this.head.next;
    this.head.next!.prev = n;
    this.head.next = n;
  }
  get(key: number): string | null {
    const n = this.map.get(key) ?? null;
    this.calls.push({ to: "map", text: `get(${key})`, reply: n ? `node ${key}` : "null" });
    if (!n) return null;
    this.remove(n);
    this.addFirst(n);
    return n.value;
  }
  /** Returns the evicted key, if any. */
  put(key: number, value: string): number | null {
    const found = this.map.get(key);
    this.calls.push({ to: "map", text: `get(${key})`, reply: found ? `node ${key}` : "null" });
    if (found) {
      found.value = value;
      this.remove(found);
      this.addFirst(found);
      return null;
    }
    let evicted: number | null = null;
    if (this.map.size === this.capacity) {
      const last = this.tail.prev!;
      this.remove(last);
      this.calls.push({ to: "list", text: "removeLast()", reply: `node ${last.key}` });
      this.map.delete(last.key);
      this.calls.push({ to: "map", text: `remove(${last.key})` });
      evicted = last.key;
    }
    const n: LNode = { key, value, prev: null, next: null };
    this.addFirst(n);
    this.calls.push({ to: "list", text: `addFirst(node ${key})` });
    this.map.set(key, n);
    this.calls.push({ to: "map", text: `put(${key}, node)` });
    return evicted;
  }
  /** Keys from most to least recently used. */
  order(): LNode[] {
    const out: LNode[] = [];
    for (let n = this.head.next!; n !== this.tail; n = n.next!) out.push(n);
    return out;
  }
}

type Op = { kind: "get"; key: number } | { kind: "put"; key: number; value: string };
const OPS: Op[] = [
  { kind: "put", key: 1, value: "A" },
  { kind: "put", key: 2, value: "B" },
  { kind: "put", key: 3, value: "C" },
  { kind: "get", key: 1 },
  { kind: "put", key: 4, value: "D" },
  { kind: "get", key: 2 },
  { kind: "get", key: 3 },
  { kind: "put", key: 1, value: "Z" },
  { kind: "put", key: 5, value: "E" },
  { kind: "get", key: 4 },
];

/** The note's output fence, line for line. */
const LRU_OUTPUT = [
  "put(1, A)",
  "put(2, B)",
  "put(3, C)",
  "get(1) = A",
  "put(4, D) evicts 2",
  "get(2) = miss",
  "get(3) = C",
  "put(1, Z)",
  "put(5, E) evicts 4",
  "get(4) = miss",
  "order (most to least recent): 5 1 3",
];

function runOps() {
  const cache = new Lru(3);
  const steps: Array<{ line: string; order: Array<{ key: number; value: string }>; evicted: number | null; hit: boolean | null; key: number }> = [];
  for (const op of OPS) {
    let line: string;
    let evicted: number | null = null;
    let hit: boolean | null = null;
    if (op.kind === "get") {
      const v = cache.get(op.key);
      hit = v !== null;
      line = `get(${op.key}) = ${v ?? "miss"}`;
    } else {
      evicted = cache.put(op.key, op.value);
      line = `put(${op.key}, ${op.value})${evicted !== null ? ` evicts ${evicted}` : ""}`;
    }
    steps.push({ line, order: cache.order().map((n) => ({ key: n.key, value: n.value })), evicted, hit, key: op.key });
  }
  const out = [...steps.map((s) => s.line), `order (most to least recent): ${cache.order().map((n) => n.key).join(" ")}`];
  if (out.join("\n") !== LRU_OUTPUT.join("\n")) throw new Error(`lru: the model printed ${JSON.stringify(out)}`);
  return steps;
}

/* ── Class diagram ────────────────────────────────────────────────── */

function lruClasses(): Walkthrough {
  const cache = classBox("cache", { name: "LRUCache", fields: ["- capacity: int", "- map: Map<int, Node>", "- list: DoublyLinkedList"], methods: ["+ get(key): V?", "+ put(key, value)"] }, { x: 0, y: 0 });
  const list = classBox("list", { name: "DoublyLinkedList", fields: ["- head: Node", "- tail: Node"], methods: ["+ addFirst(n)", "+ remove(n)", "+ removeLast(): Node"] }, { x: cache.w + 64, y: 0 });
  const node = classBox("node", { name: "Node", fields: ["+ key: int", "+ value: V", "+ prev: Node", "+ next: Node"] }, { x: list.x, y: Math.max(cache.h, list.h) + 60, w: list.w });
  const lit = (b: typeof cache, spec: Parameters<typeof classBox>[1]) => classBox(b.items[0]!.id, spec, { x: b.x, y: b.y, w: b.w, tone: "accent" }).items;
  const listLink = (tone: "ink" | "accent") => [...umlLink("cl", { x: cache.right.x, y: 13 }, { x: list.x, y: 13 }, "composes", { tone }), label("cl-n", "1", list.x - 10, 3, { size: 10.5, mono: true })];
  const nodeLink = (tone: "ink" | "accent") => [
    ...umlLink("ln", list.bottom, node.top, "composes", { tone }),
    label("ln-n", "0..*", node.top.x + 20, node.y - 12, { size: 10.5, mono: true }),
    ...umlLink("mn", cache.bottom, { x: node.x, y: node.y + 30 }, "associates", { tone }),
    label("mn-t", "map values", (cache.bottom.x + node.x) / 2 - 30, (cache.bottom.y + node.y + 30) / 2 + 6, { size: 10.5 }),
  ];
  const self = (tone: "ink" | "accent"): Item[] => {
    const x = node.x + node.w;
    const y1 = node.y + node.h - 40;
    const y2 = node.y + node.h - 14;
    return [
      { k: "path", id: "self", pts: [[x, y1], [x + 34, y1], [x + 34, y2], [x + 4, y2]], tone, width: 1.3 },
      { k: "path", id: "self-h", pts: [[x + 9, y2 - 4], [x + 2, y2], [x + 9, y2 + 4]], tone, width: 1.3 },
      label("self-t", "prev, next", x + 40, (y1 + y2) / 2 + 4, { anchor: "start", size: 10.5, tone: tone === "accent" ? "accent" : "soft" }),
    ];
  };
  const nodeSpec = { name: "Node", fields: ["+ key: int", "+ value: V", "+ prev: Node", "+ next: Node"] };
  const listSpec = { name: "DoublyLinkedList", fields: ["- head: Node", "- tail: Node"], methods: ["+ addFirst(n)", "+ remove(n)", "+ removeLast(): Node"] };
  const frames: Frame[] = [
    { caption: "LRUCache is the class callers see: get and put, a fixed capacity, and two members that between them make both operations O(1).", items: lit(cache, { name: "LRUCache", fields: ["- capacity: int", "- map: Map<int, Node>", "- list: DoublyLinkedList"], methods: ["+ get(key): V?", "+ put(key, value)"] }) },
    { caption: "The cache owns a DoublyLinkedList that keeps entries in recency order: most recent after head, least recent before tail.", items: [...cache.items, ...lit(list, listSpec), ...listLink("accent")] },
    { caption: "The list is made of Nodes, and the map's values are those same Node objects, so a key lookup lands directly on its place in the list.", items: [...cache.items, ...list.items, ...listLink("ink"), ...lit(node, nodeSpec), ...nodeLink("accent")] },
    { caption: "Each Node points both ways. With prev and next, a node found through the map unlinks itself in O(1), with no walk from the head.", items: [...cache.items, ...list.items, ...listLink("ink"), ...node.items, ...nodeLink("ink"), ...self("accent")] },
  ];
  return finish({ title: "LRU cache classes: a map of nodes plus a doubly linked list", input: "", frames });
}

/* ── The run ──────────────────────────────────────────────────────── */

const CW = 46;
const CH = 32;
const CG = 30;

/** H ⇄ nodes ⇄ T on one row: next arrows above the middle, prev arrows below. */
function listRow(nodes: Array<{ id: string; text: string; tone?: "plain" | "accent" | "strong" | "muted" | "error"; x: number; y: number }>, edgeTone: (a: string, b: string) => "line" | "accent" = () => "line"): Item[] {
  const items: Item[] = [];
  nodes.forEach((n) => items.push(box(n.id, n.x, n.y, n.text, { w: CW, h: CH, tone: n.tone ?? "plain", size: 12 })));
  for (let i = 0; i + 1 < nodes.length; i++) {
    const a = nodes[i]!;
    const b = nodes[i + 1]!;
    const tone = edgeTone(a.id, b.id);
    items.push({ k: "edge", id: `nx-${a.id}-${b.id}`, x1: a.x + CW, y1: a.y + 10, x2: b.x, y2: b.y + 10, tone, arrow: true });
    items.push({ k: "edge", id: `pv-${b.id}-${a.id}`, x1: b.x, y1: b.y + CH - 10, x2: a.x + CW, y2: a.y + CH - 10, tone, arrow: true });
  }
  return items;
}

function lruRun(): Walkthrough {
  const steps = runOps();
  const LY = 34;
  const MY = LY + CH + 58;
  const xAt = (i: number) => i * (CW + CG);
  const frames: Frame[] = steps.map((s, k) => {
    const nodes = [
      { id: "H", text: "head", x: xAt(0), y: LY, tone: "muted" as const },
      ...s.order.map((n, i) => ({ id: `n${n.key}`, text: `${n.key}:${n.value}`, x: xAt(i + 1), y: LY, tone: n.key === s.key && s.hit !== false ? ("accent" as const) : ("plain" as const) })),
      { id: "T", text: "tail", x: xAt(s.order.length + 1), y: LY, tone: "muted" as const },
    ];
    const items: Item[] = [label("op", s.line, 0, 6, { anchor: "start", size: 13, mono: true, weight: 700, tone: s.evicted !== null || s.hit === false ? "error" : "accent" })];
    items.push(label("dir", "most recent → least recent", xAt(5) + CW, 6, { anchor: "end", size: 10.5, tone: "faint" }));
    items.push(...listRow(nodes));
    if (s.evicted !== null) {
      items.push(box(`n${s.evicted}`, xAt(5) + 6, LY + CH + 8, `${s.evicted}`, { w: CW, h: CH, tone: "error", size: 12 }));
      items.push(label("ev", "evicted", xAt(5) + 6 + CW / 2, LY + CH + 54, { size: 11, tone: "error", weight: 600 }));
    }
    const keys = s.order.map((n) => n.key).sort((a, b) => a - b);
    items.push(label("map", "map", 0, MY + CH / 2 + 4, { anchor: "start", size: 11.5, weight: 600, tone: "soft" }));
    keys.forEach((key, i) => {
      const x = 46 + i * (CW + 10);
      items.push(box(`k${key}`, x, MY, key, { w: CW, h: CH, tone: key === s.key && s.hit !== false ? "accent" : "plain", size: 12 }));
      const at = s.order.findIndex((n) => n.key === key);
      items.push({ k: "edge", id: `kp${key}`, x1: x + CW / 2, y1: MY, x2: xAt(at + 1) + CW / 2, y2: LY + CH + 2, tone: key === s.key && s.hit !== false ? "accent" : "faint", arrow: true, dashed: true });
    });
    const order = s.order.map((n) => n.key).join(", ");
    const prev = k > 0 ? steps[k - 1]!.order.length : 0;
    const caption =
      s.evicted !== null
        ? `${s.line}: the cache was full, so the node just before tail, key ${s.evicted}, was unlinked and its key removed from the map. Key ${s.key} goes in at the front; order is now ${order}.`
        : s.hit === false
          ? `${s.line}: key ${s.key} is not in the map, so get returns a miss in O(1) and the order stays ${order}. A miss never reorders anything.`
          : s.hit
            ? `${s.line}: the map finds node ${s.key} in O(1), and the node is moved to the front because it was just used. Order: ${order}.`
            : s.order.length > prev
              ? `${s.line}: a new node is linked in right after head and its key goes in the map. ${s.order.length} of 3 slots used; order ${order}.`
              : `${s.line}: key ${s.key} is already cached, so its value is replaced and its node moves to the front. No eviction; order ${order}.`;
    return { caption, items };
  });
  return finish({ title: "An LRU cache of capacity 3, running ten operations", input: "put 1, 2, 3 · get 1 · put 4 · get 2 · get 3 · put 1 · put 5 · get 4", frames });
}

/* ── Move to front ────────────────────────────────────────────────── */

function lruMoveToFront(): Walkthrough {
  // The state just before the run's get(3): order 4, 1, 3.
  const cache = new Lru(3);
  for (const op of OPS.slice(0, 6)) {
    if (op.kind === "get") cache.get(op.key);
    else cache.put(op.key, op.value);
  }
  if (cache.order().map((n) => n.key).join(",") !== "4,1,3") throw new Error("lru-move-to-front: expected 4,1,3");
  const n3 = cache.map.get(3)!;
  const label3 = (n: LNode) => (n === cache.head ? "head" : n === cache.tail ? "tail" : `${n.key}:${n.value}`);
  const LY = 30;
  const xAt = (i: number) => i * (CW + CG);

  // Draws whatever the pointers say: every node at `pos`, an arrow for each non-null next (above) and prev (below).
  const draw = (pos: Map<LNode, { x: number; y: number }>, lit: Set<string>, note: string): Item[] => {
    const items: Item[] = [label("op", note, 0, 4, { anchor: "start", size: 12.5, mono: true, weight: 700, tone: "accent" })];
    const id = (n: LNode) => (n === cache.head ? "H" : n === cache.tail ? "T" : `n${n.key}`);
    for (const [n, p] of pos) items.push(box(id(n), p.x, p.y, label3(n), { w: CW, h: CH, tone: n === n3 ? "accent" : n === cache.head || n === cache.tail ? "muted" : "plain", size: 12 }));
    for (const [n, p] of pos) {
      const right = (q: { x: number; y: number }, up: number) => (q.x > p.x ? { x: p.x + CW, y: p.y + up } : { x: p.x, y: p.y + up });
      if (n.next) {
        const q = pos.get(n.next)!;
        const a = right(q, 10);
        const b = q.x > p.x ? { x: q.x, y: q.y + 10 } : { x: q.x + CW, y: q.y + 10 };
        const key = `${id(n)}.next`;
        items.push({ k: "edge", id: `nx-${id(n)}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, tone: lit.has(key) ? "accent" : "line", arrow: true });
      }
      if (n.prev) {
        const q = pos.get(n.prev)!;
        const a = q.x < p.x ? { x: p.x, y: p.y + CH - 10 } : { x: p.x + CW, y: p.y + CH - 10 };
        const b = q.x < p.x ? { x: q.x + CW, y: q.y + CH - 10 } : { x: q.x, y: q.y + CH - 10 };
        const key = `${id(n)}.prev`;
        items.push({ k: "edge", id: `pv-${id(n)}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, tone: lit.has(key) ? "accent" : "line", arrow: true });
      }
    }
    return items;
  };
  const rowPos = (lifted?: { node: LNode; x: number }, hole = -1) => {
    const pos = new Map<LNode, { x: number; y: number }>();
    let i = 0;
    for (let n: LNode | null = cache.head; n; n = n.next) {
      if (lifted && n === lifted.node) continue;
      if (i === hole) i++;
      pos.set(n, { x: xAt(i++), y: LY });
      if (n === cache.tail) break;
    }
    if (lifted) pos.set(lifted.node, { x: lifted.x, y: LY + CH + 46 });
    return pos;
  };

  const frames: Frame[] = [];
  frames.push({ caption: "Before get(3) the order is 4, 1, 3, so key 3 is the least recently used. The map hands us node 3 directly: no search through the list.", items: draw(rowPos(), new Set(), "get(3): map → node 3") });
  // Unlink: the two neighbours stop pointing at node 3.
  const prevOf3 = n3.prev!;
  const nextOf3 = n3.next!;
  const liftAt = xAt(3);
  prevOf3.next = nextOf3;
  nextOf3.prev = prevOf3;
  const pos1 = rowPos({ node: n3, x: liftAt });
  // Node 3's own pointers are about to be overwritten; draw it detached.
  const keepPrev = n3.prev;
  const keepNext = n3.next;
  n3.prev = null;
  n3.next = null;
  frames.push({ caption: `Unlink: ${label3(prevOf3)}.next now points at ${label3(nextOf3)} and ${label3(nextOf3)}.prev back at ${label3(prevOf3)}. Two pointer writes, and node 3 is out of the list.`, items: draw(pos1, new Set([`n${prevOf3.key}.next`, "T.prev"]), "remove(node 3)") });
  n3.prev = keepPrev;
  n3.next = keepNext;
  // Link in after head.
  const first = cache.head.next!;
  n3.prev = cache.head;
  n3.next = first;
  first.prev = n3;
  cache.head.next = n3;
  frames.push({ caption: `Insert after head: node 3 points to head and ${label3(first)}, then head.next and ${label3(first)}.prev point at node 3. Four pointer writes.`, items: draw(rowPos({ node: n3, x: xAt(1) }, 1), new Set(["n3.next", "n3.prev", "H.next", `n${first.key}.prev`]), "addFirst(node 3)") });
  const order = cache.order().map((n) => n.key).join(", ");
  if (order !== "3,4,1".split(",").join(", ")) throw new Error(`lru-move-to-front: order ${order}`);
  frames.push({ caption: `Done: the order is ${order} and get returns C. Six pointer writes in all, the same count for any list length, which is why get is O(1).`, items: draw(rowPos(), new Set(), "get(3) = C") });
  return finish({ title: "Moving a node to the front in O(1)", input: "order 4, 1, 3; then get(3)", frames });
}

/* ── put on a full cache ──────────────────────────────────────────── */

function lruPutSequence(): Walkthrough {
  const cache = new Lru(3);
  for (const op of OPS.slice(0, 4)) {
    if (op.kind === "get") cache.get(op.key);
    else cache.put(op.key, op.value);
  }
  cache.calls = [];
  const evicted = cache.put(4, "D");
  if (evicted !== 2) throw new Error(`lru-put-sequence: evicted ${evicted}`);
  const who = { client: 0, cache: 1, map: 2, list: 3 } as const;
  type Msg = { from: number; to: number; text: string; reply?: boolean };
  const msgs: Msg[] = [{ from: who.client, to: who.cache, text: "put(4, D)" }];
  for (const c of cache.calls) {
    msgs.push({ from: who.cache, to: who[c.to], text: c.text });
    if (c.reply) msgs.push({ from: who[c.to], to: who.cache, text: c.reply, reply: true });
  }
  const ll = lifelines("ll", ["Client", "cache: LRUCache", "map: HashMap", "list: DLL"], { gap: 132, w: 116, length: msgs.length * 30 + 12, size: 11 });
  const why: Record<string, string> = {
    "put(4, D)": "The client calls put(4, D) on a cache holding 1, 3, 2 in that order, with all three slots used.",
    "get(4)": "The cache first asks the map whether key 4 is already present, since a present key is updated in place.",
    null: "The map answers null: 4 is a new key, and the cache is full, so something must be evicted first.",
    "removeLast()": "The cache asks the list for its least recently used node, the one just before the tail sentinel.",
    "node 2": "The list unlinks node 2 and hands it back. The node carries its key, which is why a Node stores key as well as value.",
    "remove(2)": "With the key from the node, the cache deletes 2 from the map. Map and list now agree again.",
    "addFirst(node 4)": "A new node for 4 is linked in right after head, the most recently used position.",
    "put(4, node)": "Last, the map records key 4 against its node. Every step was O(1), so put is O(1).",
  };
  const frames: Frame[] = msgs.map((_, k) => {
    const items: Item[] = [...ll.items];
    msgs.slice(0, k + 1).forEach((m, i) => items.push(...message(`m${i}`, ll.xOf(m.from), ll.xOf(m.to), ll.top + 22 + i * 30, m.text, { tone: i === k ? "accent" : "ink", dashed: m.reply })));
    const caption = why[msgs[k]!.text];
    if (!caption) throw new Error(`lru-put-sequence: no caption for ${msgs[k]!.text}`);
    return { caption, items };
  });
  return finish({ title: "put(4, D) on a full cache, call by call", input: "capacity 3, order 1, 3, 2", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "lru-classes": lruClasses,
  "lru-run": lruRun,
  "lru-move-to-front": lruMoveToFront,
  "lru-put-sequence": lruPutSequence,
};
