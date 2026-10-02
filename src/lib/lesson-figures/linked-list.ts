import { CELL, finish, note, row, rowLabel, slotMid, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "./kit.js";

/**
 * Linked Lists: the lesson's figures (content/roadmap/linked-list.md places
 * each with "@figure <name>"). How a list sits in memory, what an insert at
 * the front costs against an array, every pointer write of insert, delete,
 * the dummy head, reversal and merging, and both of Floyd's phases — each
 * one run on real nodes (an array of `next` indices) and recorded, so the
 * arrows drawn are the pointers the code holds at that step.
 */

/* ── Local layout: nodes in a row, arrows between slots ────────────── */

const W = 44;
const H = 36;
const GAP = 30;
const PITCH = W + GAP;

/** Left edge of a node slot in a row starting at x0 (slot −1 is where a leading "null" sits). */
const nx = (slot: number, x0 = 0) => x0 + slot * PITCH;

function nodeAt(id: string, slot: number, y: number, v: string | number, tone: Tone = "plain", x0 = 0): Item {
  return box(id, nx(slot, x0), y, v, { tone, w: W, h: H });
}

/** The next pointer of the node in slot a, drawn to slot b of the same row — rightwards or, once turned round, leftwards. */
function hop(id: string, a: number, b: number, y: number, o: { tone?: LineTone; x0?: number; bow?: number; dashed?: boolean } = {}): Item {
  const x0 = o.x0 ?? 0;
  const cy = y + H / 2;
  const right = b > a;
  const from = { x: right ? nx(a, x0) + W + 2 : nx(a, x0) - 2, y: cy };
  const to = { x: right ? nx(b, x0) - 3 : nx(b, x0) + W + 3, y: cy };
  return arrow(id, from, to, { tone: o.tone ?? "ink", bow: o.bow, dashed: o.dashed });
}

/** "null" at the right end of a row (in slot `slot`), or at its left end (slot −1) when `left`. Returns the item and its centre for a pointer. */
function nul(id: string, slot: number, y: number, o: { x0?: number; left?: boolean } = {}): { item: Item; cx: number } {
  const x0 = o.x0 ?? 0;
  if (o.left) {
    const right = nx(slot, x0) + W;
    return { item: { k: "text", id, x: right, y: y + H / 2, text: "null", tone: "faint", anchor: "end", size: 12 }, cx: right - 13 };
  }
  const left = nx(slot, x0);
  return { item: { k: "text", id, x: left, y: y + H / 2, text: "null", tone: "faint", anchor: "start", size: 12 }, cx: left + 13 };
}

/** A pointer variable under (or over) the point x of a row at y. */
function ptr(id: string, x: number, y: number, name: string, o: { tone?: "accent" | "ink" | "error"; over?: boolean } = {}): Item {
  return o.over
    ? { k: "ptr", id, x, y: y - 6, label: name, tone: o.tone ?? "accent", up: false }
    : { k: "ptr", id, x, y: y + H + 6, label: name, tone: o.tone ?? "accent", up: true };
}

const cx = (slot: number, x0 = 0) => nx(slot, x0) + W / 2;

/** A list as the program prints it: 1 → 2 → 3 → null. */
const arrows = (vals: ReadonlyArray<string | number>) => [...vals.map(String), "null"].join(" → ");

/* ── How it is stored ──────────────────────────────────────────────── */

/** An array's one block against a list's scattered nodes, each a value and a next pointer. */
function layout(): Walkthrough {
  const values = [3, 8, 1, 6];
  const items: Item[] = [];
  items.push(label("ta", "Array: one block of memory", 0, -26, { anchor: "start", tone: "ink", weight: 600, size: 12.5 }));
  items.push(...row("a", values, { index: true }));
  items.push(note("addr", "address of arr[i] = start + i × size", slotMid(values.length) + 4, CELL / 2, { tone: "soft", size: 11.5 }));

  const Y = 118;
  items.push(label("tl", "Linked list: nodes anywhere, joined by pointers", 0, Y - 40, { anchor: "start", tone: "ink", weight: 600, size: 12.5 }));
  // Where each node happens to have been allocated: anywhere, in no order.
  const at = [
    { x: 0, y: Y },
    { x: 118, y: Y + 64 },
    { x: 236, y: Y + 4 },
    { x: 352, y: Y + 60 },
  ];
  const VW = 34;
  const NW = 22;
  values.forEach((v, i) => {
    const p = at[i];
    items.push(box(`v${i}`, p.x, p.y, v, { w: VW, h: H }));
    items.push(box(`p${i}`, p.x + VW, p.y, "•", { w: NW, h: H, size: 13 }));
    const from = { x: p.x + VW + NW + 2, y: p.y + H / 2 };
    if (i + 1 < values.length) {
      const q = at[i + 1];
      items.push(arrow(`e${i}`, from, { x: q.x - 3, y: q.y + H / 2 }, { tone: "ink" }));
    } else {
      items.push(arrow(`e${i}`, from, { x: from.x + 24, y: from.y }, { tone: "ink" }));
      items.push({ k: "text", id: "null", x: from.x + 28, y: from.y, text: "null", tone: "faint", anchor: "start", size: 12 });
    }
  });
  items.push(ptr("head", at[0].x + VW / 2, at[0].y, "head", { over: true, tone: "accent" }));
  items.push(label("lv", "val", at[0].x + VW / 2, at[0].y + H + 11, { size: 10.5, tone: "faint" }));
  items.push(label("ln", "next", at[0].x + VW + NW / 2, at[0].y + H + 11, { size: 10.5, tone: "faint" }));
  return finish({
    title: "How an array and a linked list sit in memory",
    input: "",
    frames: [
      {
        caption: `The array keeps ${values.join(", ")} side by side, so the address of any arr[i] is one multiplication away. The list keeps each value in its own node wherever memory was free; each node's next pointer says which node follows, the list is just a pointer to the first one (head), and the last points to null.`,
        items,
      },
    ],
  });
}

/** Putting a value at the front: the array shifts every element, the list rewrites two pointers. */
function frontInsert(): Walkthrough {
  const start = [3, 8, 1, 6];
  const NEW = 0;
  const cap = start.length + 1;
  const LY = 124;
  const frames: Frame[] = [];

  // The array, run for real: slots[] and the writes it took.
  const slots: Array<number | null> = [...start, null];
  let arrayWrites = 0;
  const shifted: number[] = [];
  // The list, as next indices: node k holds start[k]; node `start.length` is the new one.
  const vals = [...start, NEW];
  const nextOf: Array<number | null> = start.map((_, k) => (k + 1 < start.length ? k + 1 : null));
  nextOf.push(null);
  let head = 0;
  let listWrites = 0;
  const fresh = start.length;

  // Which element sits in each array slot, by identity (k = its index in `start`, -1 = the new value).
  let owner: number[] = start.map((_, k) => k);

  const draw = (o: { shift?: boolean; wrote?: boolean; linkFresh?: boolean; moved?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("al", "array", -10, 0)];
    for (let s = 0; s < cap; s++) items.push(box(`slot${s}`, s * 46, 0, "", { tone: "ghost" }));
    owner.forEach((k, s) => {
      if (k === -2) return;
      const v = k === -1 ? NEW : start[k];
      items.push(box(k === -1 ? "anew" : `a${k}`, s * 46, 0, v, { tone: k === -1 ? "strong" : o.shift ? "accent" : "plain" }));
    });
    for (let s = 0; s < cap; s++) items.push({ k: "text", id: `ai${s}`, x: s * 46 + CELL / 2, y: CELL + 11, text: String(s), tone: "faint", size: 10 });
    if (o.shift) shifted.forEach((k) => items.push(arrow(`m${k}`, { x: (k * 46) + CELL / 2, y: -4 }, { x: (k + 1) * 46 + CELL / 2 - 2, y: -4 }, { tone: "accent", bow: -16 })));
    items.push(note("aw", `array writes: ${arrayWrites}`, 0, CELL + 34, { tone: arrayWrites ? "ink" : "soft", size: 12, weight: 600 }));

    items.push(rowLabel("ll", "list", -10, LY, H));
    const order: number[] = [];
    for (let c: number | null = head; c !== null; c = nextOf[c]) order.push(c);
    const inLine = o.moved;
    order.forEach((k, pos) => {
      if (k === fresh && !inLine) return;
      const slot = inLine ? pos : pos + 1;
      items.push(box(`n${k}`, nx(slot), LY, vals[k], { tone: k === fresh ? "strong" : "plain", w: W, h: H }));
    });
    if (!inLine) items.push(box(`n${fresh}`, nx(0), LY + 58, NEW, { tone: "accent", w: W, h: H }));
    // Arrows: between real nodes in order, the fresh node's own pointer when it has one, and null.
    const slotOf = (k: number) => (inLine ? order.indexOf(k) : k === fresh ? 0 : order.indexOf(k) + 1);
    order.forEach((k) => {
      const nk = nextOf[k];
      if (k === fresh) {
        if (nk === null) return;
        if (inLine) items.push(hop(`e${k}`, slotOf(k), slotOf(nk), LY, { tone: o.linkFresh ? "accent" : "ink" }));
        else items.push(arrow(`e${k}`, { x: nx(0) + W + 2, y: LY + 58 + H / 2 }, { x: nx(1) - 3, y: LY + H / 2 + 6 }, { tone: "accent" }));
        return;
      }
      if (nk === null) items.push(hop(`e${k}`, slotOf(k), slotOf(k) + 1, LY));
      else items.push(hop(`e${k}`, slotOf(k), slotOf(nk), LY));
    });
    if (!order.includes(fresh) && nextOf[fresh] !== null) {
      items.push(arrow(`e${fresh}`, { x: nx(0) + W + 2, y: LY + 58 + H / 2 }, { x: nx(1) - 3, y: LY + H / 2 + 6 }, { tone: "accent" }));
    }
    const lastSlot = inLine ? order.length : order.length + (order.includes(fresh) ? 0 : 1);
    items.push(nul("lnull", lastSlot, LY).item);
    const headSlot = slotOf(head);
    items.push(ptr("head", cx(headSlot), LY, "head", { over: true, tone: "accent" }));
    items.push(note("lw", `list writes: ${listWrites}`, 0, LY + 58 + H + 24, { tone: listWrites ? "ink" : "soft", size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `Both hold ${start.join(", ")}, and ${NEW} must go in front. The array has one spare slot at the end; the new list node has been allocated but nothing points to it yet.`,
    items: draw({}),
  });

  // Array: shift every element one place right, from the back.
  for (let s = start.length - 1; s >= 0; s--) {
    slots[s + 1] = slots[s];
    arrayWrites++;
    shifted.push(s);
  }
  owner = [-2, ...start.map((_, k) => k)];
  frames.push({
    caption: `The array cannot put ${NEW} anywhere but index 0, and index 0 is taken, so every element moves one place right, starting from the back: ${arrayWrites} writes before the new value is even stored.`,
    items: draw({ shift: true }),
  });
  slots[0] = NEW;
  arrayWrites++;
  owner = [-1, ...start.map((_, k) => k)];
  frames.push({
    caption: `Now ${NEW} goes into index 0: ${arrayWrites} writes for ${start.length} elements. With n elements it is n + 1, so 100,000 inserts at the front cost about 5 × 10⁹ moves.`,
    items: draw({ wrote: true }),
  });

  // List: fresh.next = head, then head = fresh.
  nextOf[fresh] = head;
  listWrites++;
  frames.push({
    caption: `The list first points the new node at the current first node: fresh.next = head. Nothing else changes, and the old list is still intact behind it.`,
    items: draw({ linkFresh: true }),
  });
  head = fresh;
  listWrites++;
  const order: number[] = [];
  for (let c: number | null = head; c !== null; c = nextOf[c]) order.push(vals[c]);
  frames.push({
    caption: `Then head = fresh, and the list reads ${arrows(order)}. ${listWrites} pointer writes, the same for 4 nodes or 4 million: inserting at the front of a list is O(1), where the array paid O(n).`,
    items: draw({ moved: true, linkFresh: true }),
  });

  return finish({ title: "Putting a value at the front of an array and of a list", input: `${start.join(", ")}; insert ${NEW} at the front`, frames });
}

/* ── Insert and delete ─────────────────────────────────────────────── */

/** Insert after a node you hold (two writes, in the right order), then delete the node after prev (one write). */
function insertDelete(): Walkthrough {
  const vals = [1, 2, 4, 5, 3]; // node 4 (value 3) is the new one
  const nextOf: Array<number | null> = [1, 2, 3, null, null];
  const FRESH = 4;
  const AFTER = 1; // insert after the node holding 2
  const frames: Frame[] = [];
  const DROP = 62;

  const orderOf = () => {
    const o: number[] = [];
    for (let c: number | null = 0; c !== null; c = nextOf[c]) o.push(c);
    return o;
  };

  /**
   * `slots` fixes where each node is drawn (x slot, dropped below the row or
   * not); arrows follow nextOf. `hot` names the arrow just written.
   */
  const draw = (o: { slots: Map<number, { slot: number; low?: boolean }>; hot?: number; tones?: Map<number, Tone>; ptrs: Array<{ id: string; node: number; name: string; tone?: "accent" | "ink" }>; text: string; bow?: number }): Item[] => {
    const items: Item[] = [];
    const yOf = (k: number) => (o.slots.get(k)!.low ? DROP : 0);
    for (const [k, p] of o.slots) items.push(box(`n${k}`, nx(p.slot), yOf(k), vals[k], { tone: o.tones?.get(k) ?? "plain", w: W, h: H }));
    let tail = -1;
    for (const [k, p] of o.slots) {
      const nk = nextOf[k];
      const tone: LineTone = o.hot === k ? "accent" : "ink";
      if (nk === null) {
        if (!p.low) {
          tail = Math.max(tail, p.slot);
          items.push(hop(`e${k}`, p.slot, p.slot + 1, 0, { tone }));
        }
        continue;
      }
      const q = o.slots.get(nk)!;
      if (!p.low && !q.low) items.push(hop(`e${k}`, p.slot, q.slot, 0, { tone, bow: q.slot - p.slot > 1 ? (o.bow ?? -46) : undefined }));
      else if (p.low) items.push(arrow(`e${k}`, { x: nx(p.slot) + W + 2, y: DROP + H / 2 }, { x: nx(q.slot) + 6, y: H + 3 }, { tone }));
      else items.push(arrow(`e${k}`, { x: nx(p.slot) + W - 6, y: H + 3 }, { x: nx(q.slot) + 4, y: DROP - 3 }, { tone }));
    }
    items.push(nul("null", tail + 1, 0).item);
    for (const p of o.ptrs) items.push(ptr(p.id, cx(o.slots.get(p.node)!.slot), 0, p.name, { over: true, tone: p.tone ?? "accent" }));
    items.push(note("code", o.text, 0, DROP + H + 26, { size: 12.5, weight: 600 }));
    return items;
  };

  type Place = { slot: number; low?: boolean };
  const inRow = () => new Map<number, Place>(orderOf().map((k, i) => [k, { slot: i }]));
  // Before: the new node waits under the gap it will fill.
  const before = inRow();
  before.set(FRESH, { slot: 2, low: true });
  const shifted = new Map<number, Place>([...before].map(([k, p]) => [k, k === FRESH || p.slot < 2 ? p : { slot: p.slot + 1 }]));
  frames.push({
    caption: `The list is ${arrows(orderOf().map((k) => vals[k]))}, and a new node holding ${vals[FRESH]} must go after the node holding ${vals[AFTER]}, which the pointer node points at. The new node exists, but nothing points to it yet.`,
    items: draw({ slots: shifted, ptrs: [{ id: "node", node: AFTER, name: "node" }], tones: new Map([[FRESH, "accent"]]), text: "fresh = new Node(3)" }),
  });

  nextOf[FRESH] = nextOf[AFTER];
  frames.push({
    caption: `First connect the new node to what follows: fresh.next = node.next, so ${vals[FRESH]} points at ${vals[nextOf[FRESH]!]}. Done the other way round, node.next = fresh would erase the only pointer to ${vals[nextOf[AFTER]!]} → ${vals[nextOf[nextOf[AFTER]!]!]}, and the rest of the list would be lost.`,
    items: draw({ slots: shifted, hot: FRESH, ptrs: [{ id: "node", node: AFTER, name: "node" }], tones: new Map([[FRESH, "accent"]]), text: "fresh.next = node.next" }),
  });

  nextOf[AFTER] = FRESH;
  frames.push({
    caption: `Then node.next = fresh: ${vals[AFTER]} now points at ${vals[FRESH]}. Two pointer writes, and no other node was touched, so inserting after a node you hold is O(1) however long the list is.`,
    items: draw({ slots: shifted, hot: AFTER, ptrs: [{ id: "node", node: AFTER, name: "node" }], tones: new Map([[FRESH, "accent"]]), text: "node.next = fresh" }),
  });

  const after = inRow();
  frames.push({
    caption: `Redrawn in order, the list is ${arrows(orderOf().map((k) => vals[k]))}. Nothing moved in memory: only the arrows changed, which is the whole point of a linked list.`,
    items: draw({ slots: after, tones: new Map([[FRESH, "strong"]]), ptrs: [], text: `list: ${arrows(orderOf().map((k) => vals[k]))}` }),
  });

  // Delete the node after prev (prev = the new node, victim = 4).
  const PREV = FRESH;
  const victim = nextOf[PREV]!;
  frames.push({
    caption: `To delete ${vals[victim]}, the node before it must be pointed past it, and a node does not know who points at it. So you hold prev, the node before the one to delete.`,
    items: draw({ slots: after, tones: new Map([[victim, "accent"]]), ptrs: [{ id: "prev", node: PREV, name: "prev" }], text: "delete the node after prev" }),
  });
  nextOf[PREV] = nextOf[victim];
  const skipping = new Map(after);
  frames.push({
    caption: `prev.next = prev.next.next: one write, and ${vals[PREV]} points straight at ${vals[nextOf[PREV]!]}. The ${vals[victim]} node is no longer reachable from head; in C++ you delete it, and the other three languages free it once nothing refers to it.`,
    items: draw({ slots: skipping, hot: PREV, tones: new Map([[victim, "muted"]]), ptrs: [{ id: "prev", node: PREV, name: "prev" }], text: "prev.next = prev.next.next" }).filter((it) => it.id !== `e${victim}`),
  });
  const done = inRow();
  frames.push({
    caption: `The list is ${arrows(orderOf().map((k) => vals[k]))}. Insert took two writes and delete one; the catch is finding the place, since reaching the i-th node means following i pointers from head.`,
    items: draw({ slots: done, ptrs: [], text: `list: ${arrows(orderOf().map((k) => vals[k]))}` }),
  });

  return finish({ title: "Inserting after a node and deleting the node after prev", input: `list = ${arrows([1, 2, 4, 5])}; insert 3 after 2, then delete 4`, frames });
}

/** Remove every node holding a value, with a dummy head so the first node is not a special case. */
function dummyHead(): Walkthrough {
  const values = [7, 7, 3, 7, 5];
  const TARGET = 7;
  // Node 0 is the dummy; nodes 1..n hold the values.
  const vals: Array<string | number> = ["D", ...values];
  const nextOf: Array<number | null> = vals.map((_, k) => (k + 1 < vals.length ? k + 1 : null));
  const frames: Frame[] = [];
  const DROP = 56;
  let gone: { node: number; slot: number } | null = null;
  const removed: number[] = [];
  let lastRemoved = false;

  const order = () => {
    const o: number[] = [];
    for (let c: number | null = 0; c !== null; c = nextOf[c]) o.push(c);
    return o;
  };
  const real = () => order().slice(1).map((k) => vals[k]);

  const draw = (prev: number, o: { hot?: boolean; done?: boolean; text: string }): Item[] => {
    const items: Item[] = [];
    const ord = order();
    ord.forEach((k, slot) => {
      const tone: Tone = k === 0 ? "muted" : o.done ? "strong" : k === nextOf[prev] ? "accent" : "plain";
      items.push(box(`n${k}`, nx(slot), 0, vals[k], { tone, w: W, h: H }));
      items.push(hop(`e${k}`, slot, slot + 1, 0, { tone: o.hot && k === prev ? "accent" : "ink" }));
    });
    items.push(nul("null", ord.length, 0).item);
    items.push(label("dl", "dummy", cx(0), -12, { size: 10.5, tone: "faint" }));
    if (gone) items.push(box(`n${gone.node}`, nx(gone.slot), DROP, vals[gone.node], { tone: "error", w: W, h: H }));
    if (!o.done) items.push(ptr("prev", cx(ord.indexOf(prev)), 0, "prev", { tone: "accent" }));
    items.push(note("code", o.text, 0, DROP + H + 24, { size: 12.5, weight: 600 }));
    return items;
  };

  let prev = 0;
  frames.push({
    caption: `Remove every ${TARGET} from ${arrows(values)}. A dummy node D goes in front, so even the first real node has a node before it, and every deletion is the same move: unlink the node after prev.`,
    items: draw(prev, { text: "dummy.next = head; prev = dummy" }),
  });
  while (nextOf[prev] !== null) {
    const nxt = nextOf[prev]!;
    if (vals[nxt] === TARGET) {
      const slot = order().indexOf(nxt);
      nextOf[prev] = nextOf[nxt];
      gone = { node: nxt, slot };
      removed.push(nxt);
      const first = removed.length === 1;
      const after = nextOf[prev] === null ? "null" : String(vals[nextOf[prev]!]);
      frames.push({
        caption: first
          ? `prev.next holds ${TARGET}, so it is unlinked: prev.next = prev.next.next. That was the list's first node, yet the code is the same as anywhere else, because prev is the dummy. prev does not move.`
          : lastRemoved
            ? `This is why prev did not move: the node that slid into prev.next had not been checked, and it holds ${TARGET} too. It is unlinked the same way.`
            : `prev.next holds ${TARGET}, so it is unlinked: ${vals[prev]} now points straight at ${after}. Again prev stays where it is.`,
        items: draw(prev, { hot: true, text: "prev.next = prev.next.next" }),
      });
      gone = null;
      lastRemoved = true;
      continue;
    }
    lastRemoved = false;
    prev = nxt;
    frames.push({
      caption: `prev.next holds ${vals[nxt]}, which stays, so prev moves on to it. The list is now ${arrows(real())} from the dummy's next.`,
      items: draw(prev, { text: "prev = prev.next" }),
    });
  }
  frames.push({
    caption: `prev.next is null, so the loop ends and the answer is dummy.next: ${arrows(real())}. ${removed.length} nodes unlinked in one pass, with no if for the head: O(n) time, O(1) space.`,
    items: draw(prev, { done: true, text: `return dummy.next: ${arrows(real())}` }),
  });

  return finish({ title: "Removing every 7 with a dummy head", input: `list = ${arrows(values)}, remove ${TARGET}`, frames });
}

/* ── Reversal ──────────────────────────────────────────────────────── */

/** Reverse 1..5 in place with prev, cur and next; the reversed part and the untouched rest are always two separate lists. */
function reverse(): Walkthrough {
  const vals = [1, 2, 3, 4, 5];
  const n = vals.length;
  const nextOf: Array<number | null> = vals.map((_, i) => (i + 1 < n ? i + 1 : null));
  const turned = new Set<number>();
  const frames: Frame[] = [];
  const lnull = nul("lnull", -1, 0, { left: true });
  const rnull = nul("rnull", n, 0);

  const walk = (from: number | null) => {
    const out: number[] = [];
    for (let c = from; c !== null; c = nextOf[c]) out.push(vals[c]);
    return out;
  };

  /** `rev` heads the reversed part, `rest` the untouched one; pointers are drawn where they are. */
  const draw = (p: { prev: number | null; cur: number | null; next?: number | null }, rev: number | null, rest: number | null, o: { hot?: number; done?: boolean }): Item[] => {
    const items: Item[] = [];
    const revNodes = [...turned].sort((a, b) => a - b);
    if (revNodes.length) items.push(...region("rb", nx(revNodes[0]) - 7, -7, nx(revNodes[revNodes.length - 1]) + W + 7 - (nx(revNodes[0]) - 7), H + 14, o.done ? "reversed: the whole list" : "reversed", { tone: "strong", labelTone: "accent" }));
    const restNodes = vals.map((_, i) => i).filter((i) => !turned.has(i));
    if (restNodes.length) items.push(...region("ub", nx(restNodes[0]) - 7, -7, nx(restNodes[restNodes.length - 1]) + W + 7 - (nx(restNodes[0]) - 7), H + 14, "not yet turned"));
    vals.forEach((v, i) => items.push(nodeAt(`n${i}`, i, 0, v, o.done ? "strong" : i === p.cur || i === o.hot ? "accent" : "plain")));
    items.push(lnull.item, rnull.item);
    vals.forEach((_, i) => {
      const nk = nextOf[i];
      const tone: LineTone = i === o.hot ? "accent" : "ink";
      if (nk === null) {
        if (turned.has(i)) items.push(arrow(`e${i}`, { x: nx(i) - 2, y: H / 2 }, { x: nx(-1) + W + 3, y: H / 2 }, { tone }));
        else items.push(hop(`e${i}`, i, i + 1, 0, { tone }));
      } else items.push(hop(`e${i}`, i, nk, 0, { tone }));
    });
    const at = (k: number | null | undefined, side: "l" | "r") => (k === null || k === undefined ? (side === "l" ? lnull.cx : rnull.cx) : cx(k));
    items.push(ptr("prev", at(p.prev, "l"), 0, "prev", { tone: "ink" }));
    items.push(ptr("cur", at(p.cur, "r"), 0, "cur", { tone: "accent" }));
    if (p.next !== undefined) items.push(ptr("next", at(p.next, "r"), 0, "next", { tone: "ink" }));
    items.push(note("r1", `reversed: ${arrows(walk(rev))}`, -GAP, H + 52, { size: 12, tone: "accent", weight: 600 }));
    items.push(note("r2", `rest:     ${arrows(walk(rest))}`, -GAP, H + 72, { size: 12, tone: "soft" }));
    return items;
  };

  let prev: number | null = null;
  let cur: number | null = 0;
  frames.push({
    caption: `Every arrow has to point the other way, without making new nodes. prev starts at null, because the first node will become the last; cur starts at the head. The reversed part is empty and the rest is the whole list.`,
    items: draw({ prev, cur }, null, 0, {}),
  });
  while (cur !== null) {
    const next: number | null = nextOf[cur];
    nextOf[cur] = prev;
    turned.add(cur);
    const was = cur;
    frames.push({
      caption:
        prev === null
          ? `Step 1: save next = ${next === null ? "null" : vals[next]} first, because the next line overwrites the only pointer to it. Then cur.next = prev turns ${vals[was]}'s arrow round to null, and prev and cur each step one node on.`
          : next === null
            ? `Step ${was + 1}: next is null, the end of the list. ${vals[was]}'s arrow turns round to ${vals[prev]}, and after stepping on, cur is null: every node has been turned.`
            : `Step ${was + 1}: save next = ${vals[next]}, turn ${vals[was]}'s arrow round to ${vals[prev]}, step on. Each step moves one node from the front of the rest to the front of the reversed part.`,
      items: draw({ prev, cur, next }, was, next, { hot: was }),
    });
    prev = was;
    cur = next;
  }
  frames.push({
    caption: `cur is null, so prev heads the whole list, reversed: ${arrows(walk(prev))}. Why it is correct: at every step the reversed part and the rest were two whole lists, and each step moved one node across. One pass, three pointers: O(n) time, O(1) space.`,
    items: draw({ prev, cur }, prev, null, { done: true }),
  });

  return finish({ title: "Reversing a linked list with prev, cur and next", input: `list = ${arrows(vals)}`, frames });
}

/* ── Fast and slow pointers ────────────────────────────────────────── */

/** The middle node: slow moves one node, fast two, on a list of 5 and a list of 6 side by side. */
function middle(): Walkthrough {
  const lists = [
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5, 6],
  ];
  const ROW = 140;
  const state = lists.map(() => ({ slow: 0, fast: 0 as number | null, done: false, steps: 0 }));
  const frames: Frame[] = [];

  const draw = (): Item[] => {
    const items: Item[] = [];
    lists.forEach((vals, r) => {
      const y = r * ROW;
      const s = state[r];
      vals.forEach((v, i) => {
        items.push(nodeAt(`l${r}n${i}`, i, y, v, s.done && i === s.slow ? "strong" : i === s.slow || i === s.fast ? "accent" : "plain"));
        items.push(hop(`l${r}e${i}`, i, i + 1, y));
      });
      const end = nul(`l${r}null`, vals.length, y);
      items.push(end.item);
      items.push(ptr(`l${r}slow`, cx(s.slow), y, "slow", { tone: "accent" }));
      items.push(ptr(`l${r}fast`, s.fast === null ? end.cx : cx(s.fast), y, "fast", { over: true, tone: "ink" }));
      const why =
        s.fast === null
          ? `fast stepped off the end → stop: middle = ${vals[s.slow]} (the second of two)`
          : s.done
            ? `fast is on the last node → stop: middle = ${vals[s.slow]}`
            : `fast and fast.next exist → step`;
      items.push(note(`l${r}why`, why, 0, y + H + 42, { size: 11.5, tone: s.done ? "accent" : "soft", weight: s.done ? 600 : undefined }));
    });
    return items;
  };

  /** The same loop with fast starting at head.next: where slow stops on a list of n nodes. */
  const firstMiddle = (n: number) => {
    let s = 0;
    let f = 1;
    while (f < n && f + 1 < n) {
      s += 1;
      f += 2;
    }
    return s;
  };
  const canStep = (r: number) => {
    const f = state[r].fast;
    return f !== null && f + 1 < lists[r].length;
  };
  frames.push({
    caption: "Both pointers start at the head. On every step slow moves one node and fast moves two, while fast and fast.next both exist; when fast cannot move on, it has covered the list and slow has covered half of it.",
    items: draw(),
  });
  for (let step = 1; state.some((s) => !s.done); step++) {
    const moved: number[] = [];
    state.forEach((s, r) => {
      if (s.done) return;
      if (!canStep(r)) {
        s.done = true;
        return;
      }
      s.slow += 1;
      const f = s.fast! + 2;
      s.fast = f < lists[r].length ? f : null;
      s.steps = step;
      moved.push(r);
      if (!canStep(r)) s.done = true;
    });
    if (!moved.length) break;
    const odd = state[0];
    const even = state[1];
    let caption: string;
    if (moved.length === 2 && !odd.done && !even.done) caption = `Step ${step}: slow is on ${lists[0][odd.slow]} in both lists and fast on ${lists[0][odd.fast!]}: fast has gone twice as far.`;
    else if (moved.length === 2) caption = `Step ${step}: on 5 nodes fast lands on the last node, so fast.next is null and the loop stops with slow on ${lists[0][odd.slow]}, the middle. On 6 nodes fast.next is ${lists[1][even.fast! + 1]}, so that loop goes on.`;
    else caption = `Step ${step}: on 6 nodes fast steps off the end to null and the loop stops with slow on ${lists[1][even.slow]}: an even list has two middles and this returns the second. Start fast at head.next to get the first one, ${lists[1][firstMiddle(lists[1].length)]}.`;
    frames.push({ caption, items: draw() });
  }
  return finish({ title: "Finding the middle node with slow and fast pointers", input: "lists 1 → … → 5 and 1 → … → 6", frames });
}

/** Floyd's two phases on a list whose tail links back: slow and fast meet in the loop, then a pointer from the head meets one from the meeting point at the loop's start. */
function floyd(): Walkthrough {
  const names = ["1", "2", "3", "4", "5", "6"];
  const nextOf = [1, 2, 3, 4, 5, 2];
  const R = 18;
  const pos = [
    { x: 0, y: 80 },
    { x: 74, y: 80 },
    { x: 154, y: 80 },
    { x: 222, y: 16 },
    { x: 290, y: 80 },
    { x: 222, y: 144 },
  ];
  // The shape, computed: walk until a node repeats.
  const seenAt = new Map<number, number>();
  let c = 0;
  let steps = 0;
  while (!seenAt.has(c)) {
    seenAt.set(c, steps++);
    c = nextOf[c];
  }
  const mu = seenAt.get(c)!;
  const L = steps - mu;
  const entry = c;
  const loopPos = (k: number) => (seenAt.get(k)! >= mu ? seenAt.get(k)! - mu : -1);
  const frames: Frame[] = [];

  const draw = (p: Array<{ id: string; at: number; name: string; over?: boolean; tone?: "accent" | "ink" }>, o: { hot?: number; text: string; start?: boolean }): Item[] => {
    const items: Item[] = [];
    names.forEach((_, a) => {
      const b = nextOf[a];
      items.push({ k: "edge", id: `e${a}`, ...line(pos[a], pos[b], R), tone: "line", arrow: true });
    });
    names.forEach((nm, i) => items.push({ k: "node", id: `n${i}`, x: pos[i].x, y: pos[i].y, r: R, text: nm, tone: o.start && i === entry ? "strong" : i === o.hot ? "strong" : p.some((q) => q.at === i) ? "accent" : "plain" }));
    for (const q of p) items.push({ k: "ptr", id: q.id, x: pos[q.at].x, y: q.over ? pos[q.at].y - R - 4 : pos[q.at].y + R + 4, label: q.name, tone: q.tone ?? "accent", up: !q.over });
    items.push(label("tail", `tail: μ = ${mu} nodes`, (pos[0].x + pos[mu - 1].x) / 2, pos[0].y + R + 40, { size: 11, tone: "faint" }));
    items.push(label("loop", `loop: L = ${L}`, pos[3].x, (pos[3].y + pos[5].y) / 2, { size: 11, tone: "faint" }));
    items.push(note("code", o.text, -R, pos[5].y + R + 36, { size: 12, weight: 600 }));
    return items;
  };

  let slow = 0;
  let fast = 0;
  frames.push({
    caption: `Node 6 links back to node 3, so a walk never reaches null. Phase 1: slow moves one node a step and fast two. If the list ended, fast would reach null; here it goes round the loop.`,
    items: draw([{ id: "slow", at: slow, name: "slow" }, { id: "fast", at: fast, name: "fast", over: true, tone: "ink" }], { text: "phase 1: slow += 1, fast += 2" }),
  });
  let k = 0;
  for (;;) {
    slow = nextOf[slow];
    fast = nextOf[nextOf[fast]];
    k++;
    const inLoop = loopPos(slow) >= 0;
    const gap = inLoop ? (loopPos(slow) - loopPos(fast) + L) % L : null;
    const met = slow === fast;
    const ptrs = [{ id: "slow", at: slow, name: "slow" }, { id: "fast", at: fast, name: "fast", over: true, tone: "ink" as const }];
    if (met) {
      frames.push({
        caption: `Step ${k}: they meet at ${names[slow]}. Inside the loop the gap from fast round to slow shrank by exactly one each step, and a whole number that drops by one cannot jump over zero. So they must meet, within one lap of slow entering the loop.`,
        items: draw(ptrs, { hot: slow, text: `met after k = ${k} steps of slow` }),
      });
      break;
    }
    frames.push({
      caption: inLoop
        ? `Step ${k}: slow is on ${names[slow]}, fast on ${names[fast]}. Going round, fast is ${gap} ${gap === 1 ? "node" : "nodes"} behind slow, and each step closes that gap by one: slow gains one node, fast two.`
        : `Step ${k}: slow is on ${names[slow]}, still in the tail; fast is already on ${names[fast]}, inside the loop.`,
      items: draw(ptrs, { text: inLoop ? `fast is ${gap} behind slow` : "slow not in the loop yet" }),
    });
  }
  const meet = slow;
  let a = 0;
  let b = meet;
  frames.push({
    caption: `Phase 2 finds where the loop starts. slow made k = ${k} moves and fast ${2 * k}; the extra ${k} were whole laps, so k is a multiple of L = ${L}. Put a back at the head and b at the meeting point, and move both one node at a time.`,
    items: draw([{ id: "pa", at: a, name: "a" }, { id: "pb", at: b, name: "b", over: true, tone: "ink" }], { text: "phase 2: a = head, b = meeting point" }),
  });
  let t = 0;
  while (a !== b) {
    a = nextOf[a];
    b = nextOf[b];
    t++;
    frames.push({
      caption:
        a === b
          ? `After μ = ${t} steps both are on ${names[a]}, the first node of the loop. a walked the tail; b walked μ steps on from a point k − μ past the entrance, k steps in all, which is whole laps, so it is back at the entrance too.`
          : `a moves to ${names[a]}, b to ${names[b]}. Both are ${mu - t} ${mu - t === 1 ? "step" : "steps"} from the loop's first node.`,
      items: draw([{ id: "pa", at: a, name: "a" }, { id: "pb", at: b, name: "b", over: true, tone: "ink" }], { hot: a === b ? a : undefined, start: a === b, text: a === b ? `cycle starts at ${names[a]}` : `a and b: ${t} ${t === 1 ? "step" : "steps"} each` }),
    });
  }
  return finish({ title: "Floyd's cycle detection, then the start of the cycle", input: "1 → 2 → 3 → 4 → 5 → 6 → back to 3", frames });
}

/** An edge between two node centres, trimmed to the rims (the arrowhead lands on the target's edge). */
function line(a: { x: number; y: number }, b: { x: number; y: number }, r: number): { x1: number; y1: number; x2: number; y2: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x1: Math.round(a.x + (dx / len) * r), y1: Math.round(a.y + (dy / len) * r), x2: Math.round(b.x - (dx / len) * (r + 1)), y2: Math.round(b.y - (dy / len) * (r + 1)) };
}

/* ── Merging ───────────────────────────────────────────────────────── */

/** Merge two sorted lists by re-linking: the smaller front node moves behind tail, and the leftover run is attached with one write. */
function merge(): Walkthrough {
  const A = [1, 4, 5];
  const B = [2, 3, 6, 8];
  type N = { id: string; v: number; from: "a" | "b"; at: number };
  const lists: Record<"a" | "b", N[]> = {
    a: A.map((v, i) => ({ id: `a${i}`, v, from: "a", at: i })),
    b: B.map((v, i) => ({ id: `b${i}`, v, from: "b", at: i })),
  };
  const MW = 36;
  const MP = MW + 20;
  const RowY = { a: 0, b: 72 };
  const RY = 152;
  const mx = (slot: number) => slot * MP;
  const front = { a: 0, b: 0 };
  const taken: N[] = [];
  let attached: "a" | "b" | null = null;
  const frames: Frame[] = [];
  const mbox = (id: string, x: number, y: number, v: string | number, tone: Tone) => box(id, x, y, v, { tone, w: MW, h: H });
  const link = (id: string, slot: number, y: number, tone: LineTone = "ink") => arrow(id, { x: mx(slot) + MW + 2, y: y + H / 2 }, { x: mx(slot + 1) - 3, y: y + H / 2 }, { tone });

  /** `hot` is the arrow just written into the merged row (its slot), drawn in teal. */
  const draw = (o: { hot?: number; text: string; done?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("la", "a", -10, RowY.a, H), rowLabel("lb", "b", -10, RowY.b, H), rowLabel("lr", "merged", -10, RY, H)];
    (["a", "b"] as const).forEach((key) => {
      if (attached === key && !o.done) items.push(note(`emp${key}`, "its rest is now linked into merged", mx(1), RowY[key] + H / 2, { tone: "faint", size: 12 }));
      if (attached === key || o.done) return;
      const left = lists[key].slice(front[key]);
      left.forEach((n, j) => {
        items.push(mbox(n.id, mx(n.at + 1), RowY[key], n.v, j === 0 ? "accent" : "plain"));
        if (j + 1 < left.length) items.push(link(`e${n.id}`, n.at + 1, RowY[key]));
      });
      if (left.length) items.push({ k: "ptr", id: `p${key}`, x: mx(left[0].at + 1) + MW / 2, y: RowY[key] + H + 4, label: key, tone: "ink", up: true });
      else items.push(note(`emp${key}`, "empty", mx(1), RowY[key] + H / 2, { tone: "faint", size: 12 }));
    });
    // The merged row: the dummy, every node taken, and — once attached — the run it now leads to.
    const chain = attached ? [...taken, ...lists[attached].slice(front[attached])] : taken;
    items.push(mbox("dummy", mx(0), RY, "D", "muted"));
    chain.forEach((n, j) => {
      items.push(mbox(n.id, mx(j + 1), RY, n.v, o.done ? "strong" : j + 1 === o.hot || j >= taken.length ? "accent" : "plain"));
      items.push(link(j === 0 ? "ed" : `e${chain[j - 1].id}`, j, RY, j + 1 === o.hot ? "accent" : "ink"));
    });
    if (!o.done) items.push({ k: "ptr", id: "tail", x: mx(taken.length) + MW / 2, y: RY + H + 4, label: "tail", tone: "accent", up: true });
    items.push(note("code", o.text, 0, RY + H + 46, { size: 12.5, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `Two sorted lists, ${arrows(A)} and ${arrows(B)}. The merged list starts at a dummy node D, and tail marks its last node. No new nodes are made: the existing ones are re-linked.`,
    items: draw({ text: "tail = dummy" }),
  });
  while (front.a < A.length && front.b < B.length) {
    const fromA = A[front.a] <= B[front.b];
    const key = fromA ? "a" : "b";
    const n = lists[key][front[key]];
    const other = fromA ? B[front.b] : A[front.a];
    taken.push(n);
    front[key]++;
    frames.push({
      caption:
        taken.length === 1
          ? `Compare the two front nodes: ${n.v} is smaller than ${other}, so tail.next = that node, tail moves onto it and ${key} moves on. Thanks to the dummy, the first node taken needs no special case.`
          : `${n.v} against ${other}: ${n.v} is ${fromA && n.v === other ? "equal, and a wins ties," : "smaller,"} so it is linked after tail and ${key} moves on.`,
      items: draw({ hot: taken.length, text: `${n.v} ${fromA ? "≤" : "<"} ${other}: tail.next = ${key}` }),
    });
  }
  attached = front.a < A.length ? "a" : "b";
  const emptied = attached === "a" ? "b" : "a";
  const rest = lists[attached].slice(front[attached]).map((n) => n.v);
  frames.push({
    caption: `${emptied} is empty. The rest of ${attached}, ${rest.join(" → ")}, is already sorted and already linked, so one write attaches all of it: tail.next = ${attached}. An array merge would copy each element.`,
    items: draw({ hot: taken.length + 1, text: `tail.next = ${attached}  (one write)` }),
  });
  const all = [...taken.map((n) => n.v), ...rest];
  frames.push({
    caption: `dummy.next is the merged list, ${arrows(all)}: O(n + m) time and O(1) extra space. Taking from a on a tie keeps equal values in their original order, and this loop is the merge step of merge sort on lists.`,
    items: draw({ done: true, text: "return dummy.next" }),
  });
  return finish({ title: "Merging two sorted lists by re-linking nodes", input: `a = ${arrows(A)}, b = ${arrows(B)}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  layout,
  "front-insert": frontInsert,
  "insert-delete": insertDelete,
  "dummy-head": dummyHead,
  reverse,
  middle,
  floyd,
  merge,
};
