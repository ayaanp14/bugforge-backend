import { CELL, GAP, finish, note, row, rowLabel, slotMid, slotX, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Queues and Deques: the lesson's figures (content/roadmap/queue.md places
 * each with "@figure <name>"). Why dequeuing from index 0 is O(n), the
 * circular buffer wrapping round, why a count beats head == tail, a deque
 * working both ends, and a queue made of two stacks — each generator runs
 * the real structure and records what it holds after every operation.
 */

const ptrUnder = (id: string, i: number, y: number, name: string, tone: "accent" | "ink" = "accent"): Item => ({ k: "ptr", id, x: slotMid(i), y: y + CELL + 20, label: name, tone, up: true });
const ptrOver = (id: string, i: number, y: number, name: string, tone: "accent" | "ink" = "ink"): Item => ({ k: "ptr", id, x: slotMid(i), y: y - 6, label: name, tone, up: false });

/* ── Why not a plain array ─────────────────────────────────────────── */

/** Three dequeues two ways: shift() moves every remaining element left, a head index just steps on. */
function shiftCost(): Walkthrough {
  const start = [1, 2, 3, 4, 5, 6];
  const DEQ = 3;
  const Y2 = 118;
  // Way 1: a real array whose front is removed by shifting.
  const shifted = start.map((v) => ({ id: `s${v}`, v }));
  let shiftMoves = 0;
  // Way 2: the values stay; head moves.
  let head = 0;
  const out: number[] = [];
  const frames: Frame[] = [];

  const draw = (o: { moved?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("la", "shift()", -10, 0), rowLabel("lb", "head", -10, Y2)];
    shifted.forEach((c, i) => {
      items.push(box(c.id, slotX(i), 0, c.v, { tone: o.moved ? "accent" : "plain" }));
      if (o.moved) items.push(arrow(`m${c.v}`, { x: slotMid(i + 1) - 4, y: -6 }, { x: slotMid(i) + 4, y: -6 }, { tone: "accent", bow: 14 }));
    });
    for (let i = 0; i < start.length; i++) items.push({ k: "text", id: `ia${i}`, x: slotMid(i), y: CELL + 11, text: String(i), tone: "faint", size: 10 });
    items.push(note("ca", `elements moved: ${shiftMoves}`, 0, CELL + 34, { size: 12, weight: 600, tone: shiftMoves ? "error" : "soft" }));
    items.push(...row("h", start, { y: Y2, index: true, tone: (i) => (i < head ? "muted" : i === head && out.length ? "accent" : "plain") }));
    items.push(ptrUnder("head", head, Y2, "head"));
    items.push(note("cb", `elements moved: 0 · head = ${head}`, 0, Y2 + CELL + 54, { size: 12, weight: 600, tone: "accent" }));
    items.push(note("out", out.length ? `dequeued so far: ${out.join(", ")}` : "nothing dequeued yet", 0, Y2 + CELL + 76, { size: 11.5, tone: "soft" }));
    return items;
  };

  frames.push({
    caption: `Both hold the queue ${start.join(", ")} with the front at index 0. The top one dequeues the way list.pop(0) and array.shift() do; the bottom one keeps a head index instead.`,
    items: draw({}),
  });
  for (let d = 0; d < DEQ; d++) {
    const v = shifted.shift()!;
    shiftMoves += shifted.length;
    out.push(v.v);
    head++;
    frames.push({
      caption:
        d === 0
          ? `Dequeue ${v.v}. Removing index 0 leaves a hole, so every remaining element moves one place left: ${shifted.length} moves. The head index version moves nothing — it reads slots[0] and sets head = 1.`
          : d < DEQ - 1
            ? `Dequeue ${v.v}: ${shifted.length} more moves, ${shiftMoves} so far, while head just steps to ${head}. The array's work grows with every element still waiting.`
            : `Dequeue ${v.v}: ${shiftMoves} moves so far against ${head} head steps. Serving all n items costs n(n − 1)/2 moves the first way — 5 × 10⁹ for 100,000 — and n steps the second.`,
      items: draw({ moved: true }),
    });
  }
  return finish({ title: "Dequeuing by shifting against moving a head index", input: `queue = ${start.join(", ")}; dequeue ${DEQ} times`, frames });
}

/* ── The circular buffer ───────────────────────────────────────────── */

/** A capacity-5 circular buffer: head and size, every index taken mod 5, so freed slots at the front are reused. */
function ring(): Walkthrough {
  const CAP = 5;
  const slots: Array<number | null> = Array(CAP).fill(null);
  let head = 0;
  let size = 0;
  type Op = { op: "enq"; x: number } | { op: "deq" };
  const ops: Op[] = [
    { op: "enq", x: 1 },
    { op: "enq", x: 2 },
    { op: "enq", x: 3 },
    { op: "deq" },
    { op: "deq" },
    { op: "enq", x: 4 },
    { op: "enq", x: 5 },
    { op: "enq", x: 6 },
    { op: "enq", x: 7 },
    { op: "enq", x: 8 },
  ];
  const frames: Frame[] = [];
  const inQueue = (i: number) => (i - head + CAP) % CAP < size;

  const draw = (o: { hot?: number; text: string; full?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("sl", "slots", -10, 0)];
    items.push(
      ...row("c", slots.map((v) => (v === null ? "" : String(v))), {
        index: true,
        tone: (i) => (slots[i] === null ? "ghost" : !inQueue(i) ? "muted" : i === o.hot ? "accent" : "plain"),
      }),
    );
    // The ring: after the last slot comes slot 0 again.
    items.push(arrow("wrap", { x: slotMid(CAP - 1), y: CELL + 50 }, { x: slotMid(0), y: CELL + 50 }, { tone: "line", bow: -30, dashed: true }));
    items.push(label("wl", "after the last slot comes slot 0", slotX(CAP) - GAP, CELL + 84, { anchor: "end", size: 10.5, tone: "faint" }));
    if (size > 0) items.push(ptrOver("front", head, 0, "front", "accent"));
    const free = (head + size) % CAP;
    if (size < CAP) items.push(ptrUnder("free", free, 0, "next free", "ink"));
    const order: number[] = [];
    for (let k = 0; k < size; k++) order.push(slots[(head + k) % CAP]!);
    items.push(note("st", `head = ${head}, size = ${size}${o.full ? " (full)" : ""}`, slotX(CAP) + 14, CELL / 2 - 10, { size: 12, weight: 600 }));
    items.push(note("qo", `queue: ${order.length ? order.join(" ") : "empty"}`, slotX(CAP) + 14, CELL / 2 + 12, { size: 12, tone: "accent", weight: 600 }));
    items.push(note("code", o.text, 0, CELL + 112, { size: 12.5, tone: "soft" }));
    return items;
  };

  frames.push({
    caption: `The queue keeps its elements still and moves its front instead. It stores head, the index of the front element, and size; the next free slot is (head + size) mod ${CAP}, so the array behaves like a ring.`,
    items: draw({ text: "empty: head = 0, size = 0" }),
  });
  let wrapped = false;
  for (const op of ops) {
    if (op.op === "enq") {
      if (size === CAP) {
        frames.push({
          caption: `enqueue ${op.x}: size = ${size} = capacity, so the queue is full and refuses it (a growing queue would copy into a bigger array, starting at head). Keeping a count is what makes full easy to tell from empty.`,
          items: draw({ text: `enqueue ${op.x}: size == capacity, refused`, full: true }),
        });
        continue;
      }
      const at = (head + size) % CAP;
      slots[at] = op.x;
      size++;
      const wraps = head + size - 1 >= CAP && !wrapped;
      if (wraps) wrapped = true;
      frames.push({
        caption: wraps
          ? `enqueue ${op.x}: (${head} + ${size - 1}) mod ${CAP} = ${at}. The index runs past the end and wraps round to slot ${at}, freed by a dequeue — nothing shifts, so the queue now occupies slots ${Array.from({ length: size }, (_, k) => (head + k) % CAP).join(", ")}, in that order.`
          : `enqueue ${op.x}: write slots[(${head} + ${size - 1}) mod ${CAP}] = slots[${at}], then size = ${size}.`,
        items: draw({ hot: at, text: `slots[(${head} + ${size - 1}) % ${CAP}] = ${op.x}` }),
      });
    } else {
      const x = slots[head]!;
      const was = head;
      head = (head + 1) % CAP;
      size--;
      frames.push({
        caption:
          was === 0
            ? `dequeue reads slots[${was}] = ${x}, moves head to ${head} and takes one from size. Nothing moves; the old ${x} stays in memory, outside the queue, until a later enqueue writes over it.`
            : `dequeue returns ${x} and head steps to ${head}. Two slots at the front are now free — the space a plain array would have wasted.`,
        items: draw({ text: `dequeue → ${x}; head = (${was} + 1) % ${CAP} = ${head}` }),
      });
    }
  }
  return finish({ title: "A circular buffer queue wrapping round", input: "capacity 5: enqueue 1, 2, 3; dequeue twice; enqueue 4 … 8", frames });
}

/** With only head and tail, an empty queue and a full one look the same; a count tells them apart. */
function fullEmpty(): Walkthrough {
  const CAP = 5;
  // Run one queue with head and tail only, and record the two moments head == tail.
  const slots: Array<number | null> = Array(CAP).fill(null);
  let head = 0;
  let tail = 0;
  let size = 0;
  const enq = (x: number) => {
    slots[tail] = x;
    tail = (tail + 1) % CAP;
    size++;
  };
  const deq = () => {
    head = (head + 1) % CAP;
    size--;
  };
  enq(1);
  enq(2);
  deq();
  deq();
  const empty = { slots: [...slots], head, tail, size };
  for (const x of [3, 4, 5, 6, 7]) enq(x);
  const full = { slots: [...slots], head, tail, size };
  const Y2 = 116;
  const items: Item[] = [];
  [empty, full].forEach((s, r) => {
    const y = r * Y2;
    const inQ = (i: number) => (i - s.head + CAP) % CAP < s.size;
    items.push(rowLabel(`l${r}`, r === 0 ? "empty" : "full", -10, y));
    items.push(...row(`r${r}c`, s.slots.map((v) => (v === null ? "" : String(v))), { y, tone: (i) => (s.slots[i] === null ? "ghost" : inQ(i) ? "accent" : "muted") }));
    items.push(ptrOver(`r${r}h`, s.head, y, "head", "accent"));
    items.push({ k: "ptr", id: `r${r}t`, x: slotMid(s.tail), y: y + CELL + 6, label: "tail", tone: "ink", up: true });
    items.push(note(`r${r}s`, `head = ${s.head}, tail = ${s.tail}`, slotX(CAP) + 12, y + CELL / 2 - 9, { size: 12, weight: 600 }));
    items.push(note(`r${r}n`, `size = ${s.size}`, slotX(CAP) + 12, y + CELL / 2 + 11, { size: 12, tone: "accent", weight: 600 }));
  });
  return finish({
    title: "Why a circular queue keeps a count",
    input: "",
    frames: [
      {
        caption: `Top: after enqueue 1, 2 and two dequeues, the queue is empty. Bottom: after five more enqueues, it is full. Both have head = tail = ${empty.head}; only the count tells them apart (the muted slots are stale values). Without one, you must leave a slot unused.`,
        items,
      },
    ],
  });
}

/* ── Deque ─────────────────────────────────────────────────────────── */

/** A deque on a ring of 6: push and pop at both ends, head stepping back with (head − 1 + capacity) mod capacity. */
function deque(): Walkthrough {
  const CAP = 6;
  const slots: Array<number | null> = Array(CAP).fill(null);
  let head = 0;
  let size = 0;
  type Op = ["pushBack" | "pushFront", number] | ["popBack" | "popFront"];
  const ops: Op[] = [["pushBack", 1], ["pushBack", 2], ["pushFront", 0], ["pushFront", 9], ["popBack"], ["popFront"]];
  const frames: Frame[] = [];
  const inQueue = (i: number) => (i - head + CAP) % CAP < size;

  const draw = (o: { hot?: number; text: string }): Item[] => {
    const items: Item[] = [rowLabel("sl", "slots", -10, 0)];
    items.push(...row("c", slots.map((v) => (v === null ? "" : String(v))), { index: true, tone: (i) => (slots[i] === null ? "ghost" : !inQueue(i) ? "muted" : i === o.hot ? "accent" : "plain") }));
    if (size > 0) {
      items.push(ptrOver("front", head, 0, "front", "accent"));
      const back = (head + size - 1) % CAP;
      items.push(ptrUnder("back", back, 0, "back", "ink"));
    }
    const order: number[] = [];
    for (let k = 0; k < size; k++) order.push(slots[(head + k) % CAP]!);
    items.push(note("qo", `front → back: ${order.length ? order.join(" ") : "empty"}`, 0, CELL + 62, { size: 12.5, tone: "accent", weight: 600 }));
    items.push(note("code", o.text, 0, CELL + 84, { size: 12, tone: "soft" }));
    return items;
  };

  frames.push({ caption: `A deque is the same ring with work at both ends. It keeps head and size like the queue; the back is (head + size − 1) mod ${CAP}.`, items: draw({ text: "head = 0, size = 0" }) });
  for (const op of ops) {
    if (op[0] === "pushBack") {
      const at = (head + size) % CAP;
      slots[at] = op[1];
      size++;
      frames.push({ caption: `push_back ${op[1]} is an ordinary enqueue: write slot ${at}, add one to size.`, items: draw({ hot: at, text: `push_back ${op[1]}: slots[${at}] = ${op[1]}` }) });
    } else if (op[0] === "pushFront") {
      const was = head;
      head = (head - 1 + CAP) % CAP;
      slots[head] = op[1];
      size++;
      frames.push({
        caption:
          was === 0
            ? `push_front ${op[1]} steps head back one place. From 0 that would be −1, and % keeps the sign in C++, Java and JavaScript, so add the capacity first: (0 − 1 + ${CAP}) % ${CAP} = ${head}. The front wraps to the far end.`
            : `push_front ${op[1]}: head steps back again, to (${was} − 1 + ${CAP}) % ${CAP} = ${head}, and ${op[1]} becomes the new front.`,
        items: draw({ hot: head, text: `push_front ${op[1]}: head = (${was} - 1 + ${CAP}) % ${CAP} = ${head}` }),
      });
    } else if (op[0] === "popBack") {
      const back = (head + size - 1) % CAP;
      const x = slots[back]!;
      size--;
      frames.push({ caption: `pop_back returns ${x} from slot ${back} and only takes one from size: the back is computed from head and size, so nothing else changes.`, items: draw({ text: `pop_back → ${x}; size = ${size}` }) });
    } else {
      const x = slots[head]!;
      const was = head;
      head = (head + 1) % CAP;
      size--;
      frames.push({
        caption: `pop_front returns ${x} and moves head on, wrapping from ${was} to ${head}. All four operations are O(1), so a deque is a stack and a queue at once.`,
        items: draw({ text: `pop_front → ${x}; head = (${was} + 1) % ${CAP} = ${head}` }),
      });
    }
  }
  return finish({ title: "A deque on a ring: both ends in O(1)", input: "push_back 1, push_back 2, push_front 0, push_front 9, pop_back, pop_front", frames });
}

/* ── A queue from two stacks ───────────────────────────────────────── */

/** inbox takes every enqueue; a dequeue pops outbox, refilling it from inbox (reversed) only when it is empty. */
function twoStacks(): Walkthrough {
  const inbox: number[] = [];
  const outbox: number[] = [];
  const served: number[] = [];
  let moves = 0;
  const frames: Frame[] = [];
  const H = 32;
  const BW = 48;
  const FLOOR = 5 * (H + 4) + 6;
  const IX = 0;
  const OX = 128;
  const stackItems = (vals: number[], x: number, hot: Set<number>): Item[] =>
    vals.map((v, k) => box(`v${v}`, x, FLOOR - (k + 1) * (H + 4) + 4, v, { tone: hot.has(v) ? "accent" : "plain", w: BW, h: H }));
  const walls = (id: string, x: number, name: string): Item[] => [
    arrow(`${id}l`, { x: x - 6, y: FLOOR - 5 * (H + 4) - 4 }, { x: x - 6, y: FLOOR + 4 }, { tone: "line", head: false }),
    arrow(`${id}f`, { x: x - 6, y: FLOOR + 4 }, { x: x + BW + 6, y: FLOOR + 4 }, { tone: "line", head: false }),
    arrow(`${id}r`, { x: x + BW + 6, y: FLOOR - 5 * (H + 4) - 4 }, { x: x + BW + 6, y: FLOOR + 4 }, { tone: "line", head: false }),
    label(`${id}n`, name, x + BW / 2, FLOOR + 18, { size: 11.5, weight: 600 }),
  ];

  const draw = (o: { hot?: number[]; text: string; poured?: boolean }): Item[] => {
    const hot = new Set(o.hot ?? []);
    const items: Item[] = [...walls("wi", IX, "inbox"), ...walls("wo", OX, "outbox"), ...stackItems(inbox, IX, hot), ...stackItems(outbox, OX, hot)];
    if (o.poured) items.push(arrow("pour", { x: IX + BW + 12, y: FLOOR - 3 * (H + 4) }, { x: OX - 12, y: FLOOR - 3 * (H + 4) }, { tone: "accent", bow: -18 }));
    const RX = OX + BW + 30;
    items.push(note("served", `dequeued: ${served.length ? served.join(" ") : "none yet"}`, RX, FLOOR - 5 * (H + 4) + 8, { size: 12.5, tone: "accent", weight: 600 }));
    items.push(note("moves", `items moved: ${moves}`, RX, FLOOR - 5 * (H + 4) + 32, { size: 12, weight: 600 }));
    items.push(note("code", o.text, RX, FLOOR - 5 * (H + 4) + 56, { size: 11.5, tone: "soft" }));
    return items;
  };

  const enqueue = (xs: number[]) => {
    inbox.push(...xs);
    frames.push({
      caption:
        served.length === 0
          ? `enqueue ${xs.join(", ")}: each is pushed onto the inbox, so the newest, ${xs[xs.length - 1]}, is on top — the wrong end for a queue, which must serve ${inbox[0]} first.`
          : `enqueue ${xs.join(", ")} onto the inbox. The outbox still holds older items, and they must leave first, so it is left alone.`,
      items: draw({ hot: xs, text: `inbox.push: ${xs.join(", ")}` }),
    });
  };
  let explained = false; // the "no refill yet" point is made once, on the first pop that shows it
  const dequeue = () => {
    if (outbox.length === 0) {
      const poured: number[] = [];
      while (inbox.length) {
        const v = inbox.pop()!;
        outbox.push(v);
        poured.push(v);
        moves++;
      }
      frames.push({
        caption: `dequeue finds the outbox empty, so it pops every item off the inbox and pushes it onto the outbox: ${poured.length} moves. Reversing the pile puts the oldest item, ${outbox[outbox.length - 1]}, on top.`,
        items: draw({ hot: poured, poured: true, text: "outbox empty: pour the inbox in" }),
      });
    }
    const v = outbox.pop()!;
    served.push(v);
    const left = outbox.length;
    let caption: string;
    if (served.length === 1) caption = `Now the outbox pops ${v}, the first item enqueued: two reversals make first in, first out.`;
    else if (left === 0 && inbox.length === 0)
      caption = `${v} leaves and both stacks are empty: ${served.length} items out in the order they went in, and ${moves} moves in all. Each item is pushed and popped at most twice, so any n operations cost O(n): O(1) amortised each.`;
    else if (inbox.length && !explained) {
      explained = true;
      caption = `The outbox is not empty, so ${v} is popped straight off it with no moves, even though ${inbox.join(" and ")} wait in the inbox. Refilling only when the outbox is empty is what stops newer items jumping the line.`;
    } else caption = `${v} comes straight off the outbox too: ${served.length} items out, in arrival order, for ${moves} moves so far.`;
    frames.push({
      caption,
      items: draw({ text: `outbox.pop() → ${v}` }),
    });
  };

  enqueue([1, 2, 3]);
  dequeue();
  enqueue([4, 5]);
  dequeue();
  dequeue();
  dequeue();
  dequeue();
  return finish({ title: "A queue made of two stacks", input: "enqueue 1, 2, 3; dequeue; enqueue 4, 5; dequeue four times", frames });
}


export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "shift-cost": shiftCost,
  ring,
  "full-empty": fullEmpty,
  deque,
  "two-stacks": twoStacks,
};
