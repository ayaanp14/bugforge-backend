import { CELL, GAP, and, bandOver, finish, link, note, over, row, rowLabel, show, slotMid, slotX, spanOver, treeLayout, under, type Frame, type Item, type LineTone, type TextTone, type Tone, type Walkthrough } from "./core.js";

/**
 * Walkthroughs for the data-structure and recursion hubs: stack, queue,
 * monotonic stack and deque, heap, trees, trie, segment tree, Fenwick tree,
 * ordered set, recursion, divide and conquer and backtracking. Each
 * generator runs the real operation on one small example and records a
 * frame at every step it takes, so every number and caption below is
 * computed, never typed in (the rule in core.ts).
 *
 * A value that moves keeps its id across frames — a heap value swapping
 * with its parent, a task rotating through a queue, a set entry pushed
 * right by a smaller arrival — so the page glides it rather than redrawing.
 */

/* ── Local helpers ────────────────────────────────────────────────── */

/** A box at (x, y) — `row` places slots on the 46-unit grid; these are the ones that sit elsewhere (stack columns, bars, tree nodes as boxes). */
function box(id: string, x: number, y: number, w: number, h: number, text: string, tone: Tone = "plain", size?: number): Item {
  return size === undefined ? { k: "cell", id, x, y, w, h, text, tone } : { k: "cell", id, x, y, w, h, text, tone, size };
}

function dot(id: string, at: { x: number; y: number }, r: number, text: string, tone: Tone = "plain"): Item {
  return { k: "node", id, x: at.x, y: at.y, r, text, tone };
}

function line(id: string, x1: number, y1: number, x2: number, y2: number, o: { tone?: LineTone; arrow?: boolean; dashed?: boolean; bow?: number; label?: string } = {}): Item {
  const it: Item = { k: "edge", id, x1, y1, x2, y2, tone: o.tone ?? "line" };
  if (o.arrow) it.arrow = true;
  if (o.dashed) it.dashed = true;
  if (o.bow) it.bow = o.bow;
  if (o.label) it.label = o.label;
  return it;
}

/** A small centred label — an index, a node's sum, a time tick. */
const tag = (id: string, text: string, x: number, y: number, tone: TextTone = "faint", size = 10): Item => note(id, text, x, y, { anchor: "middle", tone, size });

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/* ── Stack ────────────────────────────────────────────────────────── */

/** Valid parentheses: openers are pushed, a closer must meet its partner on top, and a crossing pair is caught the moment it happens. */
export function validParentheses(): Walkthrough {
  const s = "{[()]}([)]";
  const chars = [...s];
  const partner: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const frames: Frame[] = [];
  const stack: number[] = [];
  const pairs: Array<[number, number]> = [];
  // The cup sits under the right end of the string, clear of the caret, so the figure stays narrow.
  const SX = slotX(chars.length) - CELL - 60;
  const slotY = (k: number) => 196 - k * (CELL + GAP);
  const FLOOR = 196 + CELL + 5;

  const draw = (i: number, o: { clash?: number; done?: boolean; log: string; fresh?: boolean }): Item[] => {
    const matched = new Set(pairs.flat());
    const items: Item[] = [];
    pairs.forEach(([a, b], k) => {
      const h = 9 + (b - a) * 5;
      const live = o.done || (o.fresh && k === pairs.length - 1 && b === i);
      items.push(line(`arc${a}`, slotMid(a), -3, slotMid(b), -3, { bow: -2 * h, tone: live ? "accent" : "line" }));
    });
    items.push(rowLabel("lbl", "s", -10, 0));
    items.push(
      ...row("c", chars, {
        index: true,
        tone: (j) => {
          if (o.clash !== undefined && (j === i || j === o.clash)) return "error";
          if (matched.has(j)) return o.done ? "strong" : "muted";
          if (j === i) return "accent";
          if (o.done && j > i) return "muted";
          return "plain";
        },
      }),
    );
    if (!o.done && i >= 0) items.push(under("i", i, "i", { indexed: true }));
    // The stack is a cup: entries keep the id of the index they came from, so a pop is that entry leaving.
    items.push(line("wl", SX - 5, slotY(2) - 6, SX - 5, FLOOR), line("wf", SX - 5, FLOOR, SX + CELL + 5, FLOOR), line("wr", SX + CELL + 5, slotY(2) - 6, SX + CELL + 5, FLOOR));
    items.push(tag("sl", "stack", SX + CELL / 2, FLOOR + 14, "soft", 12));
    stack.forEach((idx, k) => {
      const top = k === stack.length - 1;
      items.push(box(`st${idx}`, SX, slotY(k), CELL, CELL, chars[idx], top && o.clash !== undefined ? "error" : top && o.fresh && idx === i ? "accent" : "plain"));
    });
    if (stack.length) items.push(note("top", "← top", SX + CELL + 12, slotY(stack.length - 1) + CELL / 2, { tone: "faint", size: 11 }));
    else items.push(tag("se", "empty", SX + CELL / 2, slotY(0) + CELL / 2, "faint", 11));
    items.push(note("log", o.log, 0, 106, { tone: o.clash !== undefined ? "error" : "soft", size: 12 }));
    if (o.done) items.push(note("verdict", "valid = false", 0, 128, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `A closing bracket must close the most recent opener that is still open: last in, first out, which is exactly a stack. Read the string left to right, push every opener, and on a closer check that the top of the stack is its partner.`,
    items: draw(-1, { log: "nothing read yet" }),
  });

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const need = partner[c];
    if (need === undefined) {
      const below = stack.length ? chars[stack[stack.length - 1]] : null;
      stack.push(i);
      frames.push({
        caption: below
          ? `'${c}' at index ${i} is an opener, so it is pushed on top of '${below}'. Whatever is on top must be closed first, so '${c}' now has to be closed before '${below}' can be.`
          : `'${c}' at index ${i} is an opener, so it is pushed. It waits on the stack until its partner arrives with nothing still open above it.`,
        items: draw(i, { log: `read '${c}': opener, push`, fresh: true }),
      });
      continue;
    }
    const top = stack.length ? stack[stack.length - 1] : -1;
    if (top < 0 || chars[top] !== need) {
      const got = top < 0 ? "the stack is empty" : `the top is '${chars[top]}'`;
      frames.push({
        caption: `'${c}' at index ${i} needs '${need}', but ${got}: the pairs cross, so the string is invalid and the scan stops. Counting brackets would miss this. One pass, each character pushed and popped at most once: O(n) time and O(n) space.`,
        items: draw(i, { clash: top, done: true, log: `read '${c}': needs '${need}', top is '${top < 0 ? "-" : chars[top]}', mismatch` }),
      });
      break;
    }
    stack.pop();
    pairs.push([top, i]);
    const rest = stack.length ? chars[stack[stack.length - 1]] : null;
    frames.push({
      caption: `'${c}' at index ${i} needs '${need}', and the top of the stack is '${need}', so they match and '${need}' is popped. ${rest ? `'${rest}' is on top again, the next opener waiting to be closed.` : `The stack is empty, so "${s.slice(0, i + 1)}" is balanced on its own.`}`,
      items: draw(i, { log: `read '${c}': top '${need}' matches, pop`, fresh: true }),
    });
  }

  return finish({ title: "Valid parentheses, with a stack", input: `s = "${s}"`, frames });
}

/* ── Queue ────────────────────────────────────────────────────────── */

/** Round-robin scheduling: the front task runs one quantum and, if unfinished, rejoins at the back. */
export function roundRobin(): Walkthrough {
  const tasks: Array<[string, number]> = [["A", 3], ["B", 5], ["C", 2], ["D", 4]];
  const QUANTUM = 2;
  const U = 26;
  const W = 48;
  const QY = 0;
  const GY = 92;
  const DY = 178;
  const left = new Map(tasks);
  let queue = tasks.map(([n]) => n);
  let clock = 0;
  const slices: Array<{ name: string; from: number; to: number }> = [];
  const done: Array<{ name: string; at: number }> = [];
  const frames: Frame[] = [];

  const draw = (fresh?: string, final = false): Item[] => {
    const items: Item[] = [];
    items.push(rowLabel("ql", "queue", -10, QY));
    queue.forEach((n, i) => items.push(box(`q${n}`, slotX(i, 0, W), QY, W, CELL, `${n}:${left.get(n)}`, n === fresh ? "accent" : "plain")));
    if (queue.length) items.push(tag("front", "front", slotMid(0, 0, W), QY + CELL + 12));
    else items.push(note("qe", "empty", 0, QY + CELL / 2, { tone: "faint", size: 12 }));
    items.push(rowLabel("gl", "CPU", -10, GY, 32));
    slices.forEach((sl, k) => items.push(box(`g${k}`, sl.from * U, GY, (sl.to - sl.from) * U - 2, 32, sl.name, k === slices.length - 1 && !final ? "accent" : "plain", 13)));
    const ticks = [...new Set([0, ...slices.map((sl) => sl.to)])];
    ticks.forEach((t) => items.push(tag(`tk${t}`, String(t), t * U, GY + 32 + 12)));
    items.push(rowLabel("dl", "done", -10, DY));
    if (!done.length) items.push(note("dn", "none yet", 0, DY + CELL / 2, { tone: "faint", size: 12 }));
    done.forEach((d, i) => {
      items.push(box(`q${d.name}`, slotX(i, 0, W), DY, W, CELL, d.name, "strong"));
      items.push(tag(`at${d.name}`, `t=${d.at}`, slotMid(i, 0, W), DY + CELL + 12, "soft"));
    });
    items.push(note("clock", `clock = ${clock} · quantum = ${QUANTUM}`, 0, DY + CELL + 38, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `Round robin shares one processor fairly: each task runs for at most ${QUANTUM} time units, then goes to the back of the line. A queue is that line (take from the front, add at the back), so the order of turns falls straight out of first in, first out.`,
    items: draw(),
  });

  while (queue.length) {
    const [name, ...rest] = queue;
    const need = left.get(name)!;
    const run = Math.min(QUANTUM, need);
    const from = clock;
    clock += run;
    slices.push({ name, from, to: clock });
    left.set(name, need - run);
    const short = run < QUANTUM ? `, needing only ${run} of its ${QUANTUM},` : "";
    if (need - run > 0) {
      queue = [...rest, name];
      frames.push({
        caption: rest.length
          ? `${name} runs from t=${from} to t=${clock} and still needs ${need - run}, so it goes to the back of the queue behind ${and(rest)}. It will not run again until ${rest.length === 1 ? `${rest[0]} has` : "each of them has"} had a turn.`
          : `${name} runs from t=${from} to t=${clock} and still needs ${need - run}; nobody else is waiting, so it goes straight back in at the front.`,
        items: draw(name),
      });
      continue;
    }
    queue = rest;
    done.push({ name, at: clock });
    if (queue.length) {
      frames.push({
        caption: `${name} runs from t=${from} to t=${clock}${short} and is finished, so it leaves the queue for good. ${queue[0]} is now at the front and runs next.`,
        items: draw(),
      });
    } else {
      frames.push({
        caption: `${name} runs its last ${run === 1 ? "unit" : `${run} units`}, t=${from} to t=${clock}, and the queue is empty: ${and(done.map((d) => `${d.name} finished at ${d.at}`))}. Each turn is one O(1) dequeue plus at most one enqueue, so the schedule costs O(turns), ${slices.length} here.`,
        items: draw(undefined, true),
      });
    }
  }

  return finish({ title: "Round-robin scheduling, with a queue", input: `tasks = ${tasks.map(([n, t]) => `${n}:${t}`).join(", ")}; quantum = ${QUANTUM}`, frames });
}

/* ── Monotonic stack ──────────────────────────────────────────────── */

/** Next greater element: indices wait on a stack whose values decrease, and each new value answers every smaller one it pops. */
export function nextGreaterElement(): Walkthrough {
  const nums = [2, 1, 5, 6, 2, 3];
  const ans: Array<number | null> = nums.map(() => null);
  const stack: number[] = [];
  const arcs: Array<[number, number]> = [];
  const AY = 102;
  const SY = 186;
  const frames: Frame[] = [];

  const draw = (i: number, o: { popped?: number[]; final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    const hot = new Set(o.popped ?? []);
    arcs.forEach(([j, t]) => items.push(line(`arc${j}`, slotMid(j) + 5, -3, slotMid(t) - 5, -3, { bow: -(16 + 8 * (t - j)), arrow: true, tone: o.final || hot.has(j) ? "accent" : "line" })));
    items.push(rowLabel("nl", "nums", -10, 0));
    items.push(...row("v", nums, { index: true, tone: (j) => (o.final ? "plain" : j === i ? "accent" : ans[j] !== null ? "muted" : "plain") }));
    if (i >= 0 && !o.final) items.push(under("i", i, "i", { indexed: true }));
    items.push(rowLabel("al", "answer", -10, AY));
    nums.forEach((_, j) => {
      const a = ans[j];
      items.push(box(`a${j}`, slotX(j), AY, CELL, CELL, a === null ? "" : String(a), a === null ? "ghost" : o.final ? "strong" : hot.has(j) ? "accent" : "plain"));
    });
    items.push(rowLabel("sl", "stack", -10, SY));
    stack.forEach((idx, k) => {
      items.push(box(`s${idx}`, slotX(k), SY, CELL, CELL, String(nums[idx]), idx === i ? "accent" : "plain"));
      items.push(tag(`si${idx}`, `i=${idx}`, slotMid(k), SY + CELL + 11));
    });
    if (stack.length) items.push(over("top", stack.length - 1, "top", { y: SY, tone: "ink" }));
    else items.push(note("se", "empty", 0, SY + CELL / 2, { tone: "faint", size: 12 }));
    return items;
  };

  frames.push({
    caption: `For each number, find the first larger number to its right. A stack holds the indices still waiting for an answer; their values only decrease from bottom to top, because a larger arrival would already have answered any smaller one below it.`,
    items: draw(-1),
  });

  nums.forEach((v, i) => {
    const popped: number[] = [];
    while (stack.length && nums[stack[stack.length - 1]] < v) {
      const j = stack.pop()!;
      ans[j] = v;
      arcs.push([j, i]);
      popped.push(j);
    }
    const below = stack.length ? stack[stack.length - 1] : -1;
    stack.push(i);
    let caption: string;
    if (popped.length) {
      const vals = popped.map((j) => String(nums[j]));
      caption = `${v} at index ${i} is larger than ${and(vals)} on the stack, so ${v} is the next greater element for ${popped.length === 1 ? `${vals[0]}, which is popped` : "each of them, and they are popped"}. ${below >= 0 ? `${nums[below]} is larger than ${v}, so popping stops there and` : "The stack is now empty, so"} index ${i} is pushed.`;
    } else if (below < 0) {
      caption = `${v} at index ${i} has nothing before it to answer, so index ${i} is simply pushed to wait for something larger.`;
    } else {
      caption = `${v} at index ${i} is not larger than ${nums[below]} on top, so it answers nobody and is pushed to wait too. The waiting values ${show(stack.map((j) => nums[j]))} still decrease from bottom to top.`;
    }
    frames.push({ caption, items: draw(i, { popped }) });
  });

  const leftover = [...stack];
  for (const j of leftover) ans[j] = -1;
  stack.length = 0;
  frames.push({
    caption: `Indices ${and(leftover.map(String))} (values ${and(leftover.map((j) => String(nums[j])))}) never met a larger number, so their answer is -1: the result is ${show(ans.map((a) => a ?? -1))}. Each index was pushed once and popped at most once, so the scan is O(n), not the O(n²) of checking every pair.`,
    items: draw(-1, { final: true }),
  });

  return finish({ title: "Next greater element, with a monotonic stack", input: `nums = ${show(nums)}`, frames });
}

/* ── Monotonic queue ──────────────────────────────────────────────── */

/** Sliding window maximum: a deque of indices with decreasing values; the front is the maximum and leaves once it slides out. */
export function slidingWindowMaximum(): Walkthrough {
  const nums = [1, 3, -1, -3, 5, 3, 6, 7];
  const k = 3;
  const dq: number[] = [];
  const out: Array<number | null> = nums.map(() => null);
  const MY = 72;
  const DY = 152;
  const frames: Frame[] = [];

  const draw = (i: number, o: { final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    const lo = Math.max(0, i - k + 1);
    if (i >= 0 && !o.final) {
      items.push(bandOver("win", lo, i));
      items.push(spanOver("ws", lo, i, "window", { lift: 8 }));
    }
    items.push(rowLabel("nl", "nums", -10, 0));
    items.push(...row("v", nums, { index: true, tone: (j) => (o.final ? "plain" : j === i ? "accent" : i >= 0 && j < lo ? "muted" : "plain") }));
    items.push(rowLabel("ml", "max", -10, MY));
    out.forEach((m, j) => {
      if (m !== null) items.push(box(`m${j}`, slotX(j), MY, CELL, CELL, String(m), o.final ? "strong" : j === i ? "accent" : "plain"));
    });
    if (out.every((m) => m === null)) items.push(note("mn", "none until the window is full", 0, MY + CELL / 2, { tone: "faint", size: 12 }));
    items.push(rowLabel("dl", "deque", -10, DY));
    dq.forEach((idx, p) => {
      items.push(box(`d${idx}`, slotX(p), DY, CELL, CELL, String(nums[idx]), idx === i && !o.final ? "accent" : "plain"));
      items.push(tag(`di${idx}`, `i=${idx}`, slotMid(p), DY + CELL + 11));
    });
    if (dq.length) items.push(over("front", 0, "front", { y: DY, tone: "ink" }));
    else items.push(note("de", "empty", 0, DY + CELL / 2, { tone: "faint", size: 12 }));
    return items;
  };

  frames.push({
    caption: `Every window of ${k} needs its maximum. A deque holds indices whose values decrease from front to back, so the front is always the window's maximum; a value smaller than a newer one can never be a maximum again, so it is dropped from the back.`,
    items: draw(-1),
  });

  nums.forEach((v, i) => {
    let gone: number | null = null;
    if (dq.length && dq[0] <= i - k) gone = dq.shift()!;
    const popped: number[] = [];
    while (dq.length && nums[dq[dq.length - 1]] <= v) popped.push(dq.pop()!);
    const waitsBehind = dq.length ? dq[dq.length - 1] : -1;
    dq.push(i);
    if (i >= k - 1) out[i] = nums[dq[0]];
    let caption = `${v} enters the window at index ${i}.`;
    if (gone !== null) caption += ` Index ${gone} (${nums[gone]}) has slid out of the window, so it leaves from the front.`;
    if (popped.length) {
      const vals = popped.map((j) => String(nums[j]));
      caption += ` ${and(vals)} ${plural(popped.length, "is", "are")} no larger and will leave the window before ${v} does, so ${plural(popped.length, "it is", "they are")} dropped from the back.`;
    } else if (waitsBehind >= 0) {
      caption += ` It is smaller than ${nums[waitsBehind]}, so it waits at the back in case the larger values slide out first.`;
    }
    caption += i >= k - 1 ? ` The front, ${out[i]}, is the maximum of ${show(nums.slice(i - k + 1, i + 1))}.` : ` The window is not full yet.`;
    frames.push({ caption, items: draw(i) });
  });

  const maxima = out.filter((m): m is number => m !== null);
  frames.push({
    caption: `Every window has its maximum: ${show(maxima)}. Each index joins the deque once and leaves at most once, from the front or the back, so the pass is O(n), where rescanning every window would be O(n·k).`,
    items: draw(nums.length - 1, { final: true }),
  });

  return finish({ title: "Sliding window maximum, with a monotonic deque", input: `nums = ${show(nums)}, k = ${k}`, frames });
}

/* ── Heap ─────────────────────────────────────────────────────────── */

/** A binary min-heap as a tree and as its array: push sifts up, pop moves the last value to the root and sifts it down. */
export function binaryHeap(): Walkthrough {
  const heap = [2, 5, 3, 7, 9, 6, 8];
  const initial = [...heap];
  const PUSH = 4;
  const R = 17;
  const LEVEL = 60;
  const WIDTH = 8 * (CELL + GAP);
  const AX = (WIDTH - (8 * (CELL + GAP) - GAP)) / 2;
  const AY = 3 * LEVEL + 42;
  const POPPED = { x: WIDTH + 40, y: 0 };
  const parent = (i: number) => (i - 1) >> 1;
  const pos = (i: number) => {
    const d = Math.floor(Math.log2(i + 1));
    const p = i - (2 ** d - 1);
    return { x: (p + 0.5) * (WIDTH / 2 ** d), y: d * LEVEL };
  };
  let popped: number | null = null;
  const frames: Frame[] = [];

  const draw = (o: { hot?: number[]; edges?: number[]; readout: string; final?: boolean }): Item[] => {
    const items: Item[] = [];
    const hot = new Set(o.hot ?? []);
    for (let i = 1; i < heap.length; i++) items.push(link(`e${i}`, pos(parent(i)), pos(i), R, { tone: o.edges?.includes(i) ? "accent" : "line" }));
    const toneAt = (i: number): Tone => (o.final && i === 0 ? "strong" : hot.has(i) ? "accent" : "plain");
    heap.forEach((v, i) => items.push(dot(`n${v}`, pos(i), R, String(v), toneAt(i))));
    items.push(rowLabel("al", "array", AX - 10, AY));
    heap.forEach((v, i) => {
      items.push(box(`a${v}`, slotX(i, AX), AY, CELL, CELL, String(v), toneAt(i)));
      items.push(tag(`ix${i}`, String(i), slotMid(i, AX), AY + CELL + 11));
    });
    if (popped !== null) {
      items.push(dot(`n${popped}`, POPPED, R, String(popped), "strong"));
      items.push(tag("pl", "popped", POPPED.x, POPPED.y + R + 12, "soft", 11));
      items.push(box(`a${popped}`, slotX(8, AX) + 20, AY, CELL, CELL, String(popped), "strong"));
    }
    items.push(note("ro", o.readout, AX, AY + CELL + 36, { tone: "soft", size: 12 }));
    return items;
  };

  frames.push({
    caption: `A min-heap keeps every parent no larger than its children, so the minimum is always at the root. It lives in a plain array: the children of index i sit at 2i + 1 and 2i + 2, and the tree is just a way of reading that array.`,
    items: draw({ readout: "children of i: 2i + 1 and 2i + 2" }),
  });

  // push: append at the end, then sift up while the parent is larger.
  heap.push(PUSH);
  let i = heap.length - 1;
  frames.push({
    caption: `push(${PUSH}) puts ${PUSH} in the next free slot, index ${i}, so the tree stays complete. Its parent is index (${i} − 1) / 2 = ${parent(i)}, holding ${heap[parent(i)]}, and ${PUSH} < ${heap[parent(i)]} breaks the heap rule there.`,
    items: draw({ hot: [i, parent(i)], edges: [i], readout: `parent of ${i} = (${i} - 1) / 2 = ${parent(i)}` }),
  });
  let swaps = 0;
  while (i > 0 && heap[parent(i)] > heap[i]) {
    const p = parent(i);
    const was = heap[p];
    [heap[p], heap[i]] = [heap[i], heap[p]];
    swaps++;
    const from = i;
    i = p;
    const up = i > 0 ? heap[parent(i)] : null;
    const goesOn = up !== null && up > heap[i];
    frames.push({
      caption:
        `${PUSH} and ${was} swap, so ${PUSH} rises to index ${i} and ${was} drops to index ${from}. ` +
        (up === null
          ? `${PUSH} is at the root, the new minimum, after ${swaps} ${plural(swaps, "swap", "swaps")}.`
          : goesOn
            ? `Its new parent ${up} is still larger, so it keeps climbing.`
            : `Its new parent ${up} is smaller, so sift-up stops: the heap rule holds again after ${swaps} ${plural(swaps, "swap", "swaps")}, at most one per level.`),
      items: draw({ hot: goesOn ? [i, parent(i)] : [i], edges: goesOn ? [i] : [], readout: up === null ? `index ${i} is the root` : `parent of ${i} = (${i} - 1) / 2 = ${parent(i)}` }),
    });
  }

  // pop: the root leaves, the last value takes its place and sifts down to its smaller child.
  const top = heap[0];
  const last = heap.pop()!;
  heap[0] = last;
  popped = top;
  const kidsOf = (j: number) => [2 * j + 1, 2 * j + 2].filter((c) => c < heap.length);
  frames.push({
    caption: `pop() takes the minimum, ${top}, from the root. The last value, ${last}, moves into the root so the tree stays complete, but ${last} is larger than its children ${and(kidsOf(0).map((c) => String(heap[c])))}, so it must sift down.`,
    items: draw({ hot: [0, ...kidsOf(0)], edges: kidsOf(0), readout: `children of 0: ${kidsOf(0).join(" and ")}` }),
  });
  i = 0;
  for (;;) {
    const kids = kidsOf(i);
    let m = i;
    for (const c of kids) if (heap[c] < heap[m]) m = c;
    if (m === i) break;
    const small = heap[m];
    const other = kids.filter((c) => c !== m).map((c) => heap[c]);
    [heap[i], heap[m]] = [heap[m], heap[i]];
    const at = m;
    const next = kidsOf(at);
    const stops = next.every((c) => heap[c] >= heap[at]);
    const why = `${last} swaps with its smaller child, ${small}${other.length ? ` (not ${other[0]})` : ""}, so ${small} rises and ${last} drops to index ${at}.`;
    if (stops) {
      frames.push({
        caption: `${why} ${next.length ? `Its children are all larger` : `Index ${at} has no children inside the heap`}, so it stops and the minimum ${heap[0]} is on top. Push and pop each walk one root-to-leaf path: O(log n), and reading the minimum is O(1).`,
        items: draw({ hot: [at], readout: `heap = ${show(heap)}`, final: true }),
      });
      break;
    }
    frames.push({
      caption: `${why} Its new children are ${and(next.map((c) => String(heap[c])))}, and one is smaller, so it keeps sinking.`,
      items: draw({ hot: [at, ...next], edges: next, readout: `children of ${at}: ${next.join(" and ")}` }),
    });
    i = at;
  }

  return finish({ title: "Keeping the minimum on top, with a binary heap", input: `heap = ${show(initial)}; push(${PUSH}); pop()`, frames });
}

/* ── Trees ────────────────────────────────────────────────────────── */

/** A binary search tree read in order — left subtree, node, right subtree — comes out sorted. */
export function bstInorder(): Walkthrough {
  const values = [5, 3, 8, 1, 4, 7, 9, 2];
  type N = { v: number; l?: N; r?: N; depth: number };
  const root: N = { v: values[0], depth: 0 };
  for (const v of values.slice(1)) {
    let at = root;
    for (;;) {
      const side = v < at.v ? "l" : "r";
      const next = at[side];
      if (!next) {
        at[side] = { v, depth: at.depth + 1 };
        break;
      }
      at = next;
    }
  }
  const all: N[] = [];
  const collect = (nd: N | undefined) => {
    if (!nd) return;
    collect(nd.l);
    all.push(nd);
    collect(nd.r);
  };
  collect(root);
  const subtree = (nd: N | undefined): number[] => (nd ? [...subtree(nd.l), nd.v, ...subtree(nd.r)] : []);
  const R = 17;
  const DX = CELL + GAP;
  const DY = 58;
  // x is the in-order rank, so the output row lines up under the tree.
  const at = new Map(all.map((nd, k) => [nd.v, { x: k * DX, y: nd.depth * DY }]));
  const parentOf = new Map<number, N>();
  for (const nd of all) for (const c of [nd.l, nd.r]) if (c) parentOf.set(c.v, nd);
  const depth = Math.max(...all.map((nd) => nd.depth));
  const OY = depth * DY + 44;
  const out: number[] = [];
  const frames: Frame[] = [];

  const draw = (cur: N | null, path: N[], final = false): Item[] => {
    const items: Item[] = [];
    const onPath = new Set([...path, ...(cur ? [cur] : [])].map((nd) => nd.v));
    for (const nd of all) {
      const p = parentOf.get(nd.v);
      if (p) items.push(link(`e${nd.v}`, at.get(p.v)!, at.get(nd.v)!, R, { tone: onPath.has(nd.v) && onPath.has(p.v) ? "accent" : "line" }));
    }
    for (const nd of all) {
      const tone: Tone = final ? "plain" : cur && nd.v === cur.v ? "accent" : out.includes(nd.v) ? "muted" : "plain";
      items.push(dot(`n${nd.v}`, at.get(nd.v)!, R, String(nd.v), tone));
    }
    items.push(rowLabel("ol", "output", -CELL / 2 - 10, OY));
    out.forEach((v, k) => items.push(box(`o${v}`, slotX(k, -CELL / 2), OY, CELL, CELL, String(v), final ? "strong" : cur && v === cur.v ? "accent" : "plain")));
    if (!out.length) items.push(note("oe", "empty", -CELL / 2, OY + CELL / 2, { tone: "faint", size: 12 }));
    const calls = [...path, ...(cur ? [cur] : [])].map((nd) => nd.v);
    items.push(note("cs", calls.length ? `call stack: ${calls.join(" → ")}` : "call stack: empty", -CELL / 2, OY + CELL + 24, { tone: "soft", size: 12 }));
    return items;
  };

  frames.push({
    caption: `In a binary search tree every value in a node's left subtree is smaller and every value in its right subtree is larger. In-order traversal visits left subtree, node, right subtree, so it should write the values out in sorted order.`,
    items: draw(null, []),
  });

  const visit = (nd: N, path: N[]) => {
    if (nd.l) visit(nd.l, [...path, nd]);
    out.push(nd.v);
    const first = out.length === 1;
    const lead = first ? `The calls go left from the root as far as they can: ${[...path, nd].map((p) => p.v).join(" → ")}. ` : "";
    const leftPart = nd.l ? `${nd.v}'s left subtree (${and(subtree(nd.l).map(String))}) is finished, so ${nd.v} is written next` : `${nd.v} has no left child, so it is written ${first ? "first, the smallest value" : "next"}`;
    // Who resumes when this call returns: the nearest caller that came down its left side.
    const chain = [...path, nd];
    let waiting: N | null = null;
    for (let j = chain.length - 2; j >= 0; j--) {
      if (chain[j].l === chain[j + 1]) {
        waiting = chain[j];
        break;
      }
    }
    const nextPart = nd.r
      ? `then the traversal moves into its right subtree at ${nd.r.v}`
      : waiting
        ? `with no right child, the calls unwind to ${waiting.v}, which was waiting for its left side`
        : `with no right child and no call waiting, the traversal is over`;
    frames.push({ caption: `${lead}${leftPart}; ${nextPart}.`, items: draw(nd, path) });
    if (nd.r) visit(nd.r, [...path, nd]);
  };
  visit(root, []);

  frames.push({
    caption: `The output ${show(out)} is sorted, because each node was written after everything smaller than it (its left subtree) and before everything larger. Each node is visited once: O(n) time, with a call stack no deeper than the tree's height.`,
    items: draw(null, [], true),
  });

  return finish({ title: "Sorted order from a binary search tree, with in-order traversal", input: `insert ${values.join(", ")} into a BST, then traverse in order`, frames });
}

/* ── Trie ─────────────────────────────────────────────────────────── */

/** A trie: words share the nodes of their common prefix, an end mark says where a word stops, and a prefix query is one walk down. */
export function trie(): Walkthrough {
  const words = ["car", "cat", "cart", "dog"];
  const query = "ca";
  const R = 17;
  // Node = the prefix it spells; children are the next letters, in order.
  const kids = new Map<string, string[]>([["", []]]);
  for (const w of words) {
    for (let d = 1; d <= w.length; d++) {
      const p = w.slice(0, d);
      if (!kids.has(p)) {
        kids.set(p, []);
        kids.get(w.slice(0, d - 1))!.push(p);
      }
    }
  }
  for (const list of kids.values()) list.sort();
  const at = treeLayout<string>("", (p) => kids.get(p) ?? [], { dx: 88, dy: 58 });
  const minX = Math.min(...[...at.values()].map((p) => p.x));
  const maxX = Math.max(...[...at.values()].map((p) => p.x));
  const SX = maxX + 70;
  const id = (p: string) => `t${p}`;
  const present = new Set<string>([""]);
  const ends = new Set<string>();
  const frames: Frame[] = [];

  const draw = (o: { path?: string[]; strong?: string[]; muted?: string[]; current?: string; done?: number; lines: string[] }): Item[] => {
    const items: Item[] = [];
    const path = new Set(o.path ?? []);
    const strong = new Set(o.strong ?? []);
    const muted = new Set(o.muted ?? []);
    for (const p of present) {
      if (p === "") continue;
      const parent = p.slice(0, -1);
      items.push(link(`e${p}`, at.get(parent)!, at.get(p)!, R, { tone: path.has(p) || strong.has(p) ? "accent" : "line" }));
    }
    for (const w of ends) items.push(dot(`r${w}`, at.get(w)!, R + 5, "", "ghost"));
    for (const p of present) {
      const tone: Tone = strong.has(p) ? "strong" : path.has(p) ? "accent" : muted.has(p) ? "muted" : "plain";
      items.push(dot(id(p), at.get(p)!, R, p === "" ? "" : p[p.length - 1], tone));
    }
    items.push(tag("root", "root", at.get("")!.x, at.get("")!.y - R - 10, "soft", 11));
    for (const w of ends) {
      const pt = at.get(w)!;
      const leftSide = pt.x <= minX;
      items.push(note(`w${w}`, w, pt.x + (leftSide ? -(R + 10) : R + 10), pt.y, { anchor: leftSide ? "end" : "start", tone: strong.has(w) ? "accent" : "soft", size: 11 }));
    }
    items.push(note("wh", "words", SX, 0, { tone: "soft", size: 12, mono: false, weight: 600 }));
    words.forEach((w, k) => items.push(note(`L${k}`, `"${w}"`, SX, 22 + k * 20, { tone: w === o.current ? "accent" : k < (o.done ?? 0) ? "ink" : "faint", size: 12, weight: w === o.current ? 600 : undefined })));
    o.lines.forEach((t, k) => items.push(note(`q${k}`, t, SX, 22 + words.length * 20 + 18 + k * 20, { tone: k === 0 ? "soft" : "ink", size: 12, weight: k === 0 ? undefined : 600 })));
    return items;
  };

  frames.push({
    caption: `A trie stores words letter by letter along paths from the root, so words with the same beginning share their first nodes. Each node also records whether a word ends there, because a word can be the prefix of a longer one.`,
    items: draw({ lines: [] }),
  });

  words.forEach((w, k) => {
    const prefixes = [...w].map((_, d) => w.slice(0, d + 1));
    const shared = prefixes.filter((p) => present.has(p));
    const fresh = prefixes.filter((p) => !present.has(p));
    const earlier = shared.length ? words.slice(0, k).find((x) => x.startsWith(shared[shared.length - 1])) : undefined;
    for (const p of fresh) present.add(p);
    ends.add(w);
    const letters = (ps: string[]) => and(ps.map((p) => p[p.length - 1]));
    let caption: string;
    if (k === 0) {
      caption = `Insert "${w}": the trie is empty, so ${letters(fresh)} become a chain of new nodes from the root, and ${w[w.length - 1]} is marked as the end of a word.`;
    } else if (!shared.length) {
      caption = `Insert "${w}": no stored word starts with ${w[0]}, so ${letters(fresh)} are all new, a separate branch from the root, and ${w[w.length - 1]} is marked as an end. A trie only shares what words really have in common.`;
    } else if (words.slice(0, k).includes(shared[shared.length - 1])) {
      const host = shared[shared.length - 1];
      const last = host[host.length - 1];
      caption = `Insert "${w}": ${letters(shared)} already exist, because "${host}" is a prefix of "${w}", so only ${letters(fresh)} is new, hung below ${last}. ${last} keeps its own end mark, so "${host}" and "${w}" are both words.`;
    } else {
      caption = `Insert "${w}": the walk reuses ${letters(shared)} from "${earlier}", since they share the prefix "${shared[shared.length - 1]}", then adds ${letters(fresh)} and marks ${plural(fresh.length, "it", "the last")} as the end of a word.`;
    }
    frames.push({
      caption,
      items: draw({ path: prefixes, current: w, done: k, lines: [`insert "${w}"`, `reuse ${shared.length ? shared.map((p) => p[p.length - 1]).join(" ") : "nothing"}, add ${fresh.map((p) => p[p.length - 1]).join(" ")}`] }),
    });
  });

  const qPath = [...query].map((_, d) => query.slice(0, d + 1));
  const under = [...present].filter((p) => p.startsWith(query));
  const outside = [...present].filter((p) => p !== "" && !p.startsWith(query) && !query.startsWith(p));
  const found = words.filter((w) => w.startsWith(query)).sort();
  frames.push({
    caption: `To find the words starting with "${query}", walk from the root: ${qPath.map((p) => p[p.length - 1]).join(", then ")}, ${query.length} steps however many words are stored. That node has no end mark, so "${query}" is not a word itself, but everything below it starts with "${query}".`,
    items: draw({ path: qPath, done: words.length, lines: [`prefix "${query}"`, `walk ${[...query].join(" → ")}: found`] }),
  });
  frames.push({
    caption: `Collecting every end mark below that node gives ${and(found.map((w) => `"${w}"`))}, and the "d" branch is never touched. Inserting or walking a word of length L costs O(L); listing the matches costs the size of that one subtree.`,
    items: draw({ path: [...qPath, ...under].filter((p) => !found.includes(p)), strong: found, muted: outside, done: words.length, lines: [`prefix "${query}"`, `→ ${found.join(", ")}`] }),
  });

  return finish({ title: "Prefix search over words, with a trie", input: `insert ${words.map((w) => `"${w}"`).join(", ")}; find words starting with "${query}"`, frames });
}

/* ── Segment tree ─────────────────────────────────────────────────── */

/** A sum segment tree: built bottom-up, then a range query takes whole nodes inside the range and skips those outside. */
export function segmentTree(): Walkthrough {
  const a = [2, 5, 1, 4, 3, 6];
  const [ql, qr] = [1, 4];
  type S = { key: string; l: number; r: number; sum: number; kids: S[]; depth: number; height: number };
  const nodes = new Map<string, S>();
  const build = (l: number, r: number, depth: number): S => {
    const key = `${l}-${r}`;
    let s: S;
    if (l === r) s = { key, l, r, sum: a[l], kids: [], depth, height: 0 };
    else {
      const mid = (l + r) >> 1;
      const kids = [build(l, mid, depth + 1), build(mid + 1, r, depth + 1)];
      s = { key, l, r, sum: kids[0].sum + kids[1].sum, kids, depth, height: 1 + Math.max(...kids.map((c) => c.height)) };
    }
    nodes.set(key, s);
    return s;
  };
  const root = build(0, a.length - 1, 0);
  const DX = 64;
  const DY = 72;
  const at = treeLayout(root.key, (k) => nodes.get(k)!.kids.map((c) => c.key), { dx: DX, dy: DY });
  const maxDepth = Math.max(...[...nodes.values()].map((s) => s.depth));
  const AY = maxDepth * DY + 36;
  const NW = 46;
  const NH = 28;
  const all = [...nodes.values()];
  const range = (s: S) => `[${s.l},${s.r}]`;
  const frames: Frame[] = [];

  const draw = (o: { built: number; tone?: (s: S) => Tone | undefined; band?: Tone; lines: string[] }): Item[] => {
    const items: Item[] = [];
    if (o.band) {
      const x1 = at.get(`${ql}-${ql}`)!.x - CELL / 2 - 4;
      const x2 = at.get(`${qr}-${qr}`)!.x + CELL / 2 + 4;
      items.push({ k: "band", id: "qb", x: x1, y: AY - 4, w: x2 - x1, h: CELL + 8, tone: o.band });
    }
    for (const s of all) {
      const p = at.get(s.key)!;
      for (const c of s.kids) {
        const q = at.get(c.key)!;
        items.push(line(`e${c.key}`, p.x, p.y + NH / 2, q.x, q.y - NH / 2 - 17));
      }
      if (!s.kids.length) items.push(line(`d${s.key}`, p.x, p.y + NH / 2 + 2, p.x, AY - 6, { tone: "faint", dashed: true }));
    }
    for (const s of all) {
      const p = at.get(s.key)!;
      const filled = s.height <= o.built;
      const tone = o.tone?.(s) ?? (!filled ? "ghost" : s.height === o.built ? "accent" : "plain");
      items.push(box(`s${s.key}`, p.x - NW / 2, p.y - NH / 2, NW, NH, filled ? String(s.sum) : "", tone, 13));
      items.push(tag(`r${s.key}`, range(s), p.x, p.y - NH / 2 - 9));
    }
    items.push(rowLabel("al", "a", at.get("0-0")!.x - CELL / 2 - 10, AY));
    a.forEach((v, i) => {
      const x = at.get(`${i}-${i}`)!.x;
      items.push(box(`a${i}`, x - CELL / 2, AY, CELL, CELL, String(v), o.band === "strong" && i >= ql && i <= qr ? "strong" : "plain"));
      items.push(tag(`ai${i}`, String(i), x, AY + CELL + 11));
    });
    o.lines.forEach((t, k) => items.push(note(`ro${k}`, t, at.get("0-0")!.x - CELL / 2, AY + CELL + 34 + k * 20, { tone: k === 0 ? "soft" : "ink", size: 12, weight: k === 0 ? undefined : 600 })));
    return items;
  };

  frames.push({
    caption: `A segment tree cuts the array in half again and again: the root covers a[0..${a.length - 1}], each node's range is split at its middle between two children, and a leaf is a single index. Every node will hold the sum of its range.`,
    items: draw({ built: -1, lines: ["each node: sum of its range"] }),
  });
  const maxH = root.height;
  for (let h = 0; h <= maxH; h++) {
    const level = all.filter((s) => s.height === h);
    const sums = level.map((s) => `${range(s)} = ${s.kids.map((c) => c.sum).join(" + ")} = ${s.sum}`);
    let caption: string;
    if (h === 0) caption = `The leaves copy the array: leaf [i,i] holds a[i]. Each node above will be the sum of its two children, so the tree fills from the bottom up and never rereads the array.`;
    else if (h === maxH) caption = `The root is ${root.kids.map((c) => c.sum).join(" + ")} = ${root.sum}, the sum of the whole array. Building touched each of the ${all.length} nodes once, so it is O(n).`;
    else caption = h === 1 ? `One level up, each node adds its two children: ${and(sums)}.` : `Another level up, the same rule again: ${and(sums)}.`;
    frames.push({ caption, items: draw({ built: h, lines: [h === 0 ? "leaf [i,i] = a[i]" : "node = left child + right child", ...(h === 0 ? [] : [sums.join(" · ").length <= 60 ? sums.join(" · ") : `${sums.length} nodes filled`])] }) });
  }

  // The query, recorded node by node, then shown one depth at a time.
  const verdict = new Map<string, "in" | "out" | "part">();
  const query = (s: S) => {
    if (s.r < ql || s.l > qr) verdict.set(s.key, "out");
    else if (ql <= s.l && s.r <= qr) verdict.set(s.key, "in");
    else {
      verdict.set(s.key, "part");
      s.kids.forEach(query);
    }
  };
  query(root);
  const taken = all.filter((s) => verdict.get(s.key) === "in").sort((x, y) => x.l - y.l);
  const total = taken.reduce((t, s) => t + s.sum, 0);
  const queryTone = (upTo: number) => (s: S): Tone | undefined => {
    const v = verdict.get(s.key);
    if (!v || s.depth > upTo) return "plain";
    return v === "in" ? "strong" : v === "out" ? "muted" : "accent";
  };
  let running: S[] = [];
  for (let d = 0; d <= maxDepth; d++) {
    const here = all.filter((s) => s.depth === d && verdict.has(s.key)).sort((x, y) => x.l - y.l);
    if (!here.length) break;
    running = [...running, ...here.filter((s) => verdict.get(s.key) === "in")].sort((x, y) => x.l - y.l);
    const ins = here.filter((s) => verdict.get(s.key) === "in");
    const outs = here.filter((s) => verdict.get(s.key) === "out");
    const parts = here.filter((s) => verdict.get(s.key) === "part");
    const says: string[] = [];
    if (ins.length)
      says.push(
        `${and(ins.map((s) => `${range(s)} (${s.sum})`))} ${plural(ins.length, "lies", "lie")} inside [${ql},${qr}], so ${plural(ins.length, "its sum is", "their sums are")} taken whole${ins.some((s) => s.kids.length) ? ", and nothing below is visited" : ""}`,
      );
    if (parts.length) says.push(`${and(parts.map(range))} only partly ${plural(parts.length, "overlaps", "overlap")}, so the query goes into ${plural(parts.length, "its", "their")} children`);
    if (outs.length) says.push(`${and(outs.map(range))} ${plural(outs.length, "is", "are")} outside the range and skipped`);
    const caption =
      d === 0
        ? `Query sum(${ql}, ${qr}). The root's range ${range(root)} only partly overlaps [${ql},${qr}], so its ${root.sum} cannot be used as it is, and the query asks both children.`
        : `Depth ${d}: ${says.join("; ")}.`;
    frames.push({
      caption,
      items: draw({ built: maxH, tone: queryTone(d), band: "accent", lines: [`query [${ql},${qr}]`, running.length ? `sum = ${running.map((s) => s.sum).join(" + ")}` : "sum = 0"] }),
    });
  }
  frames.push({
    caption: `sum(${ql}, ${qr}) = ${taken.map((s) => s.sum).join(" + ")} = ${total}, from ${taken.length} nodes. At each depth at most two nodes straddle an end of the range, so a query visits O(log n) nodes, and an update changes one leaf and its O(log n) ancestors.`,
    items: draw({ built: maxH, tone: (s) => (verdict.get(s.key) === "in" ? "strong" : "muted"), band: "strong", lines: [`query [${ql},${qr}]`, `sum = ${taken.map((s) => s.sum).join(" + ")} = ${total}`] }),
  });

  return finish({ title: "Range sum queries, with a segment tree", input: `a = ${show(a)}; sum(${ql}, ${qr})`, frames });
}

/* ── Binary indexed (Fenwick) tree ────────────────────────────────── */

/** A Fenwick tree: t[i] sums a block of length i & −i ending at i; an update climbs i += i & −i, a prefix sum descends i −= i & −i. */
export function fenwickTree(): Walkthrough {
  const a = [0, 3, 2, -1, 6, 5, 4, -3, 3]; // 1-indexed: a[0] is unused
  const n = a.length - 1;
  const original = a.slice(1); // the input as given, before the update changes a[3]
  const UPD = { at: 3, by: 2 };
  const QUERY = 7;
  const low = (i: number) => i & -i;
  const t = a.map(() => 0);
  const sumOf = (from: number, to: number) => a.slice(from, to + 1).reduce((s, v) => s + v, 0);
  const lengths = [1, 2, 4, 8].filter((L) => L <= n);
  const BY = (L: number) => 76 + lengths.indexOf(L) * 40;
  const RY = BY(lengths[lengths.length - 1]) + 32 + 22;
  const bin = (i: number) => i.toString(2).padStart(4, "0");
  const shown = new Set<number>();
  const frames: Frame[] = [];

  const draw = (o: { cur?: number; taken?: number[]; changed?: number; lines: string[]; final?: boolean }): Item[] => {
    const items: Item[] = [];
    // The band is what the current block covers; at the end, the whole prefix the query added up.
    if (o.final) items.push(bandOver("cov", 0, QUERY - 1, { tone: "strong" }));
    else if (o.cur !== undefined) items.push(bandOver("cov", o.cur - low(o.cur), o.cur - 1));
    items.push(rowLabel("al", "a", -10, 0));
    for (let i = 1; i <= n; i++) {
      items.push(box(`a${i}`, slotX(i - 1), 0, CELL, CELL, String(a[i]), i === o.changed ? "accent" : "plain"));
      items.push(tag(`ai${i}`, String(i), slotMid(i - 1), CELL + 11));
    }
    if (o.cur !== undefined && !o.final) items.push(over("i", o.cur - 1, "i", { tone: "ink" }));
    lengths.forEach((L) => items.push(rowLabel(`ll${L}`, `len ${L}`, -10, BY(L), 32)));
    const taken = new Set(o.taken ?? []);
    for (const i of shown) {
      const L = low(i);
      const x = slotX(i - L);
      const tone: Tone = i === o.cur && !o.final ? "accent" : taken.has(i) ? "strong" : "plain";
      items.push(box(`t${i}`, x, BY(L), slotX(i - 1) + CELL - x, 32, `t${i}=${t[i]}`, tone, 11));
    }
    o.lines.forEach((s, k) => items.push(note(`ro${k}`, s, 0, RY + k * 20, { tone: k === 0 ? "soft" : "ink", size: 12, weight: k === 0 ? undefined : 600 })));
    return items;
  };

  frames.push({
    caption: `A Fenwick tree keeps, at each index i, the sum of the last i & -i values of a up to i, where i & -i is the value of i's lowest set bit. So 6 = 0110 covers two values, 4 = 0100 covers four, and each odd index covers just itself.`,
    items: draw({ lines: ["t[i] = a[i - (i & -i) + 1] + ... + a[i]"] }),
  });

  for (const L of lengths) {
    const idx: number[] = [];
    for (let i = 1; i <= n; i++) if (low(i) === L) idx.push(i);
    for (const i of idx) {
      t[i] = sumOf(i - L + 1, i);
      shown.add(i);
    }
    if (L === 4) continue; // lengths 4 and 8 are shown together
    const caption =
      L === 1
        ? `The odd indices ${and(idx.map(String))} have lowest bit 1, so each of their blocks holds a single value: t[i] = a[i].`
        : L === 2
          ? `${and(idx.map((i) => `${i} = ${bin(i)}`))} have lowest bit 2, so their blocks hold two values: ${and(idx.map((i) => `t[${i}] = a[${i - 1}] + a[${i}] = ${t[i]}`))}.`
          : `t[4] covers a[1..4] = ${t[4]}, and t[8] covers all ${n} values, ${t[8]}. The blocks nest like the marks on a ruler, so any prefix of a is a few of them laid end to end.`;
    frames.push({ caption, items: draw({ lines: [`blocks of length ${L === 8 ? "4 and 8" : L}`, ...(L === 8 ? [`t[4] = ${t[4]} · t[8] = ${t[8]}`] : [])] }) });
  }

  // Update: every block that contains index UPD.at changes; they are found by adding the lowest bit.
  a[UPD.at] += UPD.by;
  let i = UPD.at;
  let hops = 0;
  while (i <= n) {
    t[i] += UPD.by;
    hops++;
    const next = i + low(i);
    const caption =
      hops === 1
        ? `Update a[${i}] += ${UPD.by}. Every block containing index ${i} must change; the first is t[${i}] itself, now ${t[i]}. Adding the lowest bit, ${i} + ${low(i)} = ${next}, jumps to the next block that contains it.`
        : next > n
          ? `i = ${i}: t[${i}] covers a[${i - low(i) + 1}..${i}] and becomes ${t[i]}. ${i} + ${low(i)} = ${next} is past the end, so the update stops after ${hops} blocks, one per bit: O(log n).`
          : `i = ${i}: t[${i}] covers a[${i - low(i) + 1}..${i}], which includes index ${UPD.at}, so it becomes ${t[i]}. Next, ${i} + ${low(i)} = ${next}.`;
    frames.push({ caption, items: draw({ cur: i, changed: UPD.at, lines: [`i = ${i} (${bin(i)}), i & -i = ${low(i)}, next i = ${next}`, `t[${i}] += ${UPD.by}`] }) });
    i = next;
  }

  // Prefix sum: take a block, then drop the lowest bit to land on the block that ends just before it.
  i = QUERY;
  const taken: number[] = [];
  let total = 0;
  while (i > 0) {
    total += t[i];
    taken.push(i);
    const next = i - low(i);
    const parts = taken.map((j) => t[j]).join(" + ");
    const last = next === 0;
    const caption =
      taken.length === 1
        ? `Now the prefix sum a[1..${QUERY}]. Start at i = ${i}: t[${i}] covers a[${i - low(i) + 1}..${i}], so take ${t[i]}. Removing the lowest bit, ${i} - ${low(i)} = ${next}, moves to the block that ends just before it.`
        : last
          ? `i = ${i}: take t[${i}] = ${t[i]}, and ${i} - ${low(i)} = 0 ends the walk: sum(1..${QUERY}) = ${parts} = ${total}, from ${taken.length} blocks. Both walks take O(log n) steps, one per set bit, against O(n) for a plain array.`
          : `i = ${i}: t[${i}] covers a[${i - low(i) + 1}..${i}], so take ${t[i]} (running total ${total}). Then ${i} - ${low(i)} = ${next}.`;
    frames.push({
      caption,
      items: draw({ cur: i, taken: [...taken], lines: [`i = ${i} (${bin(i)}), i & -i = ${low(i)}, next i = ${next}`, `sum = ${parts}${last ? ` = ${total}` : ""}`], final: last }),
    });
    i = next;
  }

  return finish({ title: "Prefix sums with updates, with a Fenwick tree", input: `a[1..${n}] = ${show(original)}; a[${UPD.at}] += ${UPD.by}; sum(1..${QUERY})`, frames });
}

/* ── Ordered set ──────────────────────────────────────────────────── */

/** Closest earlier value: a sorted set gives each arrival its floor and ceiling, the only two candidates. */
export function orderedSet(): Walkthrough {
  const nums = [7, 2, 9, 4, 12, 8];
  const set: number[] = [];
  let best = Infinity;
  let pair: [number, number] | null = null;
  const SY = 104;
  const frames: Frame[] = [];

  const draw = (i: number, o: { floor?: number; ceil?: number; lines: string[]; final?: boolean }): Item[] => {
    const items: Item[] = [];
    const inPair = (v: number) => o.final && pair !== null && pair.includes(v);
    items.push(rowLabel("nl", "nums", -10, 0));
    items.push(...row("v", nums, { index: true, tone: (j) => (inPair(nums[j]) ? "strong" : o.final ? "plain" : j === i ? "accent" : j < i ? "muted" : "plain") }));
    if (i >= 0 && !o.final) items.push(under("i", i, "i", { indexed: true }));
    items.push(rowLabel("sl", "sorted", -10, SY));
    set.forEach((v, p) => items.push(box(`s${v}`, slotX(p), SY, CELL, CELL, String(v), inPair(v) ? "strong" : !o.final && v === nums[i] ? "accent" : "plain")));
    if (!set.length) items.push(note("se", "empty", 0, SY + CELL / 2, { tone: "faint", size: 12 }));
    if (o.floor !== undefined) items.push(under("fl", set.indexOf(o.floor), "floor", { y: SY, tone: "ink" }));
    if (o.ceil !== undefined) items.push(under("ce", set.indexOf(o.ceil), "ceiling", { y: SY, tone: "ink" }));
    o.lines.forEach((t, k) => items.push(note(`ro${k}`, t, 0, SY + CELL + 48 + k * 20, { tone: k === 0 ? "soft" : "ink", size: 12, weight: k === 0 ? undefined : 600 })));
    return items;
  };

  frames.push({
    caption: `Values arrive one at a time, and for each we want the closest value seen before it. Keep the earlier values in a sorted set (a balanced tree): the closest one is either the floor, the largest value below, or the ceiling, the smallest above.`,
    items: draw(-1, { lines: ["closest so far: none"] }),
  });

  nums.forEach((x, i) => {
    // Lower bound by binary search: the first position whose value is >= x.
    let lo = 0;
    let hi = set.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (set[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    const ceil = lo < set.length ? set[lo] : undefined;
    const floor = lo > 0 ? set[lo - 1] : undefined;
    const before = best;
    for (const c of [floor, ceil]) {
      if (c !== undefined && Math.abs(x - c) < best) {
        best = Math.abs(x - c);
        pair = [c, x];
      }
    }
    const searched = show(set);
    set.splice(lo, 0, x);
    const diffs = [floor !== undefined ? `|${x} - ${floor}| = ${x - floor}` : "no floor", ceil !== undefined ? `|${x} - ${ceil}| = ${ceil - x}` : "no ceiling"].join(" · ");
    const bestLine = pair ? `closest so far: ${best} (${pair[1]} and ${pair[0]})` : "closest so far: none";
    let caption: string;
    if (floor === undefined && ceil === undefined) caption = `${x} arrives to an empty set, so there is nothing to compare it with yet; it is simply inserted.`;
    else {
      const fl = floor !== undefined ? `the floor ${floor}, ${x - floor} below` : "no floor";
      const ce = ceil !== undefined ? `the ceiling ${ceil}, ${ceil - x} above` : "no ceiling";
      const verdict = before === Infinity ? `That is the first gap: ${best}.` : best < before ? `That beats the best so far: ${best}.` : `The best stays ${best}.`;
      caption = `${x} arrives. A binary search in ${searched} finds ${fl} and ${ce}; nothing further out can be closer. ${verdict} ${x} is inserted ${floor === undefined ? "at the front" : ceil === undefined ? "at the back" : "between them"}.`;
    }
    frames.push({ caption, items: draw(i, { floor, ceil, lines: [diffs, bestLine] }) });
  });

  const [p0, p1] = pair!;
  frames.push({
    caption: `The smallest gap between a value and any earlier one is ${best}, between ${p1} and ${p0}. Each arrival costs one O(log n) search and one O(log n) insertion, so all n cost O(n log n), against O(n²) for comparing every pair.`,
    items: draw(nums.length - 1, { final: true, lines: ["answer", `minimum difference = ${best} (${p1} and ${p0})`] }),
  });

  return finish({ title: "Closest earlier value, with an ordered set", input: `nums = ${show(nums)}`, frames });
}

/* ── Recursion ────────────────────────────────────────────────────── */

/** power(x, n) by halving: each call waits on the call stack for a smaller one, and results flow back up as the stack unwinds. */
export function recursivePower(): Walkthrough {
  const X = 2;
  const N = 10;
  // SVG collapses leading spaces, so the body's indent is an x offset (CODE_INDENT), not text.
  const CODE = ["power(x, n):", "if n == 0: return 1", "h = power(x, n // 2)", "return h * h if n is even else h * h * x"];
  const CODE_INDENT = 16;
  type Call = { n: number; h?: number; ret?: number; returned?: boolean };
  type Ev = { kind: "call" | "base" | "return"; n: number; value?: number; h?: number };
  const events: Ev[] = [];
  const power = (x: number, n: number): number => {
    if (n === 0) {
      events.push({ kind: "base", n, value: 1 });
      return 1;
    }
    events.push({ kind: "call", n });
    const h = power(x, Math.floor(n / 2));
    const r = n % 2 === 0 ? h * h : h * h * x;
    events.push({ kind: "return", n, value: r, h });
    return r;
  };
  const answer = power(X, N);

  const CW = 140;
  const CH = 32;
  const STEP = 50;
  const RES_Y = 76;
  const callY = (d: number) => RES_Y + (d + 1) * STEP;
  const stack: Call[] = [];
  let gone: { depth: number; value: number } | null = null;
  const frames: Frame[] = [];

  const stateOf = (c: Call): string => {
    if (c.returned) return `returned ${c.ret}`;
    if (c.n === 0) return "n = 0: base case, returns 1";
    if (c.h === undefined) return `n = ${c.n}: waits for power(${X}, ${Math.floor(c.n / 2)})`;
    return c.n % 2 === 0 ? `h = ${c.h}; n even: ${c.h} * ${c.h} = ${c.ret}` : `h = ${c.h}; n odd: ${c.h} * ${c.h} * ${X} = ${c.ret}`;
  };

  const draw = (codeLine: number, done = false): Item[] => {
    const items: Item[] = [];
    CODE.forEach((s, k) => items.push(note(`code${k}`, s, k === 0 ? 0 : CODE_INDENT, 6 + k * 16, { tone: k === codeLine ? "accent" : "faint", size: 12, weight: k === codeLine ? 600 : undefined })));
    items.push(box("res", 0, RES_Y, CW, CH, `answer = ${done ? answer : "?"}`, done ? "strong" : "plain", 13));
    // The live call is the deepest one that has not returned: the one pushed, or the caller just resumed.
    let live = stack.length - 1;
    while (live >= 0 && stack[live].returned) live--;
    stack.forEach((c, d) => {
      const y = callY(d);
      const above = d === 0 ? RES_Y + CH : callY(d - 1) + CH;
      items.push(line(`ca${d}`, 22, above, 22, y - 1, { arrow: true }));
      const top = d === live;
      items.push(box(`c${d}`, 0, y, CW, CH, `power(${X}, ${c.n})`, c.returned ? "muted" : top ? "accent" : "plain", 13));
      items.push(note(`st${d}`, stateOf(c), CW + 50, y + CH / 2, { tone: c.returned ? "faint" : top ? "ink" : "soft", size: 12 }));
    });
    if (gone) {
      const fromY = callY(gone.depth) + CH / 2;
      const toY = gone.depth === 0 ? RES_Y + CH / 2 : callY(gone.depth - 1) + CH / 2;
      items.push(line(`rt${gone.depth}`, CW, fromY, CW, toY, { arrow: true, bow: 34, tone: "accent", label: String(gone.value) }));
    }
    return items;
  };

  // A call that returned is drawn once more, faded, with its value on the arrow back to its caller; the next step removes it.
  const dropReturned = () => {
    while (stack.length && stack[stack.length - 1].returned) stack.pop();
  };
  const calls = events.filter((ev) => ev.kind !== "return").length;
  events.forEach((ev, k) => {
    dropReturned();
    gone = null;
    if (ev.kind === "call") {
      stack.push({ n: ev.n });
      const caption =
        k === 0
          ? `power(${X}, ${N}) computes ${X} to the ${N}th by halving: with h = power(x, n // 2), the answer is h * h, times one more x when n is odd. The first call cannot finish until power(${X}, ${Math.floor(ev.n / 2)}) answers, so it waits on the call stack.`
          : `power(${X}, ${ev.n}) is pushed on top and asks for power(${X}, ${Math.floor(ev.n / 2)}). Each call keeps its own n, so ${stack.length - 1 === 1 ? "the call below it still remembers where it was" : `the ${stack.length - 1} calls below it still remember where they were`}; n halves every time, so the stack grows like log n.`;
      frames.push({ caption, items: draw(2) });
    } else if (ev.kind === "base") {
      stack.push({ n: 0, ret: ev.value });
      frames.push({
        caption: `power(${X}, 0) hits the base case and returns ${ev.value} without calling anything: this is what stops the recursion. The stack is ${stack.length} calls deep, its deepest point.`,
        items: draw(1),
      });
    } else {
      const child = stack[stack.length - 1];
      const me = stack[stack.length - 2];
      child.returned = true;
      me.h = ev.h;
      me.ret = ev.value;
      gone = { depth: stack.length - 1, value: child.ret! };
      frames.push({
        caption: `power(${X}, ${child.n}) is popped and passes ${child.ret} back up. power(${X}, ${me.n}) resumes with h = ${ev.h}; n = ${me.n} is ${me.n % 2 === 0 ? `even, so it returns ${ev.h} * ${ev.h}` : `odd, so it returns ${ev.h} * ${ev.h} * ${X}`} = ${ev.value}.`,
        items: draw(3),
      });
    }
  });
  dropReturned();
  stack[0].returned = true;
  gone = { depth: 0, value: answer };
  frames.push({
    caption: `power(${X}, ${N}) passes ${answer} back to its caller and the stack empties. It took ${calls} calls where a loop would multiply ${N} times: O(log n) calls and O(log n) stack space, because n halves on every call.`,
    items: draw(-1, true),
  });

  return finish({ title: "Fast power by halving, with recursion", input: `power(${X}, ${N})`, frames });
}

/* ── Divide and conquer ───────────────────────────────────────────── */

/** Maximum subarray by divide and conquer: best of the left half, the right half, and the best sum crossing the middle. */
export function maxSubarrayDivideAndConquer(): Walkthrough {
  const a = [-2, 1, -3, 4, -1, 2, 1, -5];
  type Seg = { l: number; r: number; depth: number; best: number; lo: number; hi: number; kids: Seg[]; cross?: { sum: number; lo: number; hi: number; suffix: number[]; prefix: number[] } };
  const segs: Seg[] = [];
  const solve = (l: number, r: number, depth: number): Seg => {
    if (l === r) {
      const s: Seg = { l, r, depth, best: a[l], lo: l, hi: l, kids: [] };
      segs.push(s);
      return s;
    }
    const mid = (l + r) >> 1;
    const left = solve(l, mid, depth + 1);
    const right = solve(mid + 1, r, depth + 1);
    // Best sum ending at mid (walking left) plus best sum starting at mid + 1 (walking right).
    const suffix: number[] = [];
    let run = 0;
    let bestL = -Infinity;
    let lo = mid;
    for (let i = mid; i >= l; i--) {
      run += a[i];
      suffix[i - l] = run;
      if (run > bestL) {
        bestL = run;
        lo = i;
      }
    }
    const prefix: number[] = [];
    run = 0;
    let bestR = -Infinity;
    let hi = mid + 1;
    for (let i = mid + 1; i <= r; i++) {
      run += a[i];
      prefix[i - mid - 1] = run;
      if (run > bestR) {
        bestR = run;
        hi = i;
      }
    }
    const cross = { sum: bestL + bestR, lo, hi, suffix, prefix };
    const options: Array<[number, number, number]> = [[left.best, left.lo, left.hi], [right.best, right.lo, right.hi], [cross.sum, lo, hi]];
    const [best, blo, bhi] = options.reduce((m, o) => (o[0] > m[0] ? o : m));
    const s: Seg = { l, r, depth, best, lo: blo, hi: bhi, kids: [left, right], cross };
    segs.push(s);
    return s;
  };
  const root = solve(0, a.length - 1, 0);
  const levels = Math.max(...segs.map((s) => s.depth));
  const barY = (d: number) => -(levels - d) * 42;
  const SUMY = CELL + 30;
  const frames: Frame[] = [];

  const draw = (o: { solved: number; hot?: number; scan?: boolean; final?: boolean; bare?: boolean }): Item[] => {
    const items: Item[] = [];
    const rc = root.cross!;
    const mid = (root.l + root.r) >> 1;
    if (o.scan || o.final) items.push(bandOver("xb", o.final ? root.lo : rc.lo, o.final ? root.hi : rc.hi, { tone: o.final ? "strong" : "accent" }));
    // The middle runs through the gaps between the lower pieces, starting under the whole-array bar so it never crosses its number.
    if (o.scan || o.final) items.push(line("mid", slotX(mid + 1) - GAP / 2, barY(1) - 4, slotX(mid + 1) - GAP / 2, SUMY + 10, { tone: "faint", dashed: true }));
    if (!o.bare) {
      const names = ["whole", "halves", "pairs"];
      for (let d = 0; d < levels; d++) items.push(rowLabel(`bl${d}`, names[d] ?? `level ${d}`, -10, barY(d), 32));
    }
    for (const s of segs) {
      if (s.depth === levels || o.bare) continue;
      const x = slotX(s.l);
      const shown = s.depth >= o.solved;
      const tone: Tone = o.final && s === root ? "strong" : o.scan && s === root ? "accent" : !shown ? "ghost" : s.depth === o.hot ? "accent" : "plain";
      items.push(box(`b${s.l}-${s.r}`, x, barY(s.depth), slotX(s.r) + CELL - x, 32, shown ? String(s.best) : o.scan && s === root ? "?" : "", tone, 13));
    }
    items.push(rowLabel("al", "a", -10, 0));
    items.push(...row("v", a, { index: true, tone: (i) => (o.final && i >= root.lo && i <= root.hi ? "strong" : o.hot === levels ? "accent" : "plain") }));
    if (o.scan) {
      items.push(rowLabel("sl", "sums", -10, SUMY - CELL / 2 + 2, CELL - 4));
      rc.suffix.forEach((v, k) => items.push(tag(`x${k}`, String(v), slotMid(root.l + k), SUMY, k + root.l === rc.lo ? "accent" : "soft", 12)));
      rc.prefix.forEach((v, k) => items.push(tag(`x${mid + 1 + k}`, String(v), slotMid(mid + 1 + k), SUMY, mid + 1 + k === rc.hi ? "accent" : "soft", 12)));
      items.push(tag("sa", "← suffix from the middle", slotMid(1) + (CELL + GAP) / 2, SUMY + 18, "faint", 10));
      items.push(tag("sb", "prefix from the middle →", slotMid(5) + (CELL + GAP) / 2, SUMY + 18, "faint", 10));
    }
    return items;
  };

  frames.push({
    caption: `The best subarray lies wholly in the left half, wholly in the right half, or crosses the middle. The first two are the same problem on half the array, so solve them recursively, then compare them with the best sum that crosses.`,
    items: draw({ solved: levels + 1, bare: true }),
  });
  frames.push({
    caption: `Split the array in half, then each half in half again, until every piece is a single element: ${levels} levels of splitting for ${a.length} values, ${segs.length} pieces in all, each one waiting for an answer.`,
    items: draw({ solved: levels + 1 }),
  });
  frames.push({
    caption: `A single element is its own best subarray, so the ${a.length} pieces at the bottom are already solved. From here on everything is combining two answers into one on the way back up.`,
    items: draw({ solved: levels + 1, hot: levels }),
  });
  for (let d = levels - 1; d >= 1; d--) {
    const here = segs.filter((s) => s.depth === d).sort((x, y) => x.l - y.l);
    const parts = here.map((s) => `${show(a.slice(s.l, s.r + 1))} → max(${s.kids[0].best}, ${s.kids[1].best}, cross ${s.cross!.sum}) = ${s.best}`);
    frames.push({
      caption:
        d === levels - 1
          ? `Pairs combine, each taking the largest of its left best, its right best and its crossing sum: ${and(parts)}.`
          : `${d === 1 ? "The two halves" : "The pieces one level up"} combine the same way: ${and(parts)}.`,
      items: draw({ solved: d, hot: d }),
    });
  }
  const rc = root.cross!;
  const mid = (root.l + root.r) >> 1;
  const bestSuffix = rc.suffix[rc.lo - root.l];
  const bestPrefix = rc.prefix[rc.hi - mid - 1];
  frames.push({
    caption: `For the whole array the halves give ${root.kids[0].best} and ${root.kids[1].best}. A crossing subarray must contain a[${mid}] and a[${mid + 1}]: summing leftwards from the middle the best is ${bestSuffix} (from index ${rc.lo}), and rightwards ${bestPrefix} (up to index ${rc.hi}).`,
    items: draw({ solved: 1, scan: true }),
  });
  frames.push({
    caption: `So the answer is max(${root.kids[0].best}, ${root.kids[1].best}, ${bestSuffix} + ${bestPrefix}) = ${root.best}, for ${show(a.slice(root.lo, root.hi + 1))}, which crosses the middle where neither half could see it. Each level does O(n) crossing work over log n levels: O(n log n).`,
    items: draw({ solved: 0, final: true }),
  });

  return finish({ title: "Maximum subarray sum, with divide and conquer", input: `nums = ${show(a)}`, frames });
}

/* ── Backtracking ─────────────────────────────────────────────────── */

/** Subsets that sum to a target: choose, recurse, undo — and cut a branch the moment its sum overshoots. */
export function subsetSumBacktracking(): Walkthrough {
  const nums = [1, 2, 3, 4];
  const target = 5;
  type Ev = { kind: "choose" | "found" | "prune"; path: number[]; sum: number; skipped: number[] };
  const events: Ev[] = [];
  const kids = new Map<string, string[]>([["", []]]);
  const sums = new Map<string, number>([["", 0]]);
  const key = (p: number[]) => p.join(",");
  const dfs = (start: number, path: number[], sum: number) => {
    for (let j = start; j < nums.length; j++) {
      const next = [...path, nums[j]];
      const s = sum + nums[j];
      kids.get(key(path))!.push(key(next));
      kids.set(key(next), []);
      sums.set(key(next), s);
      if (s > target) {
        // Sorted input: every later number overshoots too, so the loop stops here.
        events.push({ kind: "prune", path: next, sum: s, skipped: nums.slice(j + 1) });
        break;
      }
      if (s === target) {
        events.push({ kind: "found", path: next, sum: s, skipped: [] });
        continue;
      }
      events.push({ kind: "choose", path: next, sum: s, skipped: [] });
      dfs(j + 1, next, s);
    }
  };
  dfs(0, [], 0);

  // A node is a partial subset, labelled with its running sum; the edge into it is the number it added.
  const R = 16;
  const at = treeLayout<string>("", (k) => kids.get(k) ?? [], { dx: 56, dy: 66 });
  const depth = Math.max(...[...at.values()].map((p) => p.depth));
  const minX = Math.min(...[...at.values()].map((p) => p.x));
  const RY = depth * 66 + 42;
  const seen = new Set<string>([""]);
  const status = new Map<string, "found" | "pruned">();
  const found: number[][] = [];
  const frames: Frame[] = [];

  const draw = (current: number[], lines: string[], final = false): Item[] => {
    const items: Item[] = [];
    const onPath = new Set(current.map((_, d) => key(current.slice(0, d + 1))).concat(""));
    for (const k of seen) {
      if (k === "") continue;
      const parent = k.includes(",") ? k.slice(0, k.lastIndexOf(",")) : "";
      const st = status.get(k);
      const added = k.slice(k.lastIndexOf(",") + 1);
      items.push(link(`e${k}`, at.get(parent)!, at.get(k)!, R, { tone: st === "pruned" ? "error" : (!final && onPath.has(k)) || st === "found" ? "accent" : "line", dashed: st === "pruned", label: `+${added}` }));
    }
    for (const k of seen) {
      const st = status.get(k);
      const tone: Tone = st === "found" ? "strong" : st === "pruned" ? "error" : !final && onPath.has(k) ? "accent" : final ? "plain" : "muted";
      items.push(dot(`n${k || "root"}`, at.get(k)!, R, String(sums.get(k)), tone));
    }
    items.push(tag("rl", "sum", at.get("")!.x, at.get("")!.y - R - 9, "soft", 11));
    lines.forEach((t, k) => items.push(note(`ro${k}`, t, minX - R, RY + k * 20, { tone: k === 0 ? "soft" : "ink", size: 12, weight: k === 0 ? undefined : 600 })));
    return items;
  };
  const foundLine = () => `found: ${found.length ? found.map((f) => show(f)).join(", ") : "none yet"}`;

  frames.push({
    caption: `Find every subset of ${show(nums)} that sums to ${target}. Backtracking builds a subset one choice at a time (each node shows its sum, each edge the number added): pick a larger number, recurse, undo, try the next, and abandon a branch once its sum passes ${target}.`,
    items: draw([], ["path: [] · sum: 0", foundLine()]),
  });

  let current: number[] = [];
  events.forEach((ev, k) => {
    const parentPath = ev.path.slice(0, -1);
    let common = 0;
    while (common < current.length && common < parentPath.length && current[common] === parentPath[common]) common++;
    const undone = current.slice(common).reverse();
    const undo = undone.length ? `Undo ${and(undone.map(String))}, then ` : "";
    const x = ev.path[ev.path.length - 1];
    const pick = undone.length ? "try" : "Try";
    const choose = undone.length ? "choose" : "Choose";
    seen.add(key(ev.path));
    let caption: string;
    let lines: string[];
    if (ev.kind === "prune") {
      status.set(key(ev.path), "pruned");
      current = parentPath;
      caption = `${undo}${pick} ${x}: the sum would be ${ev.sum}, more than ${target}, so the branch is cut without going in. The numbers are sorted, so ${ev.skipped.length ? `${and(ev.skipped.map(String))} would overshoot too and ${plural(ev.skipped.length, "is", "are")} skipped as well` : "there is nothing larger left to try"}.`;
      lines = [`path: ${show(parentPath)} + ${x} → sum ${ev.sum} > ${target}, cut`, foundLine()];
    } else if (ev.kind === "found") {
      status.set(key(ev.path), "found");
      found.push(ev.path);
      current = ev.path;
      caption = `${undo}${choose} ${x}: ${show(ev.path)} sums to exactly ${target}, so it is recorded as an answer. Adding anything more would overshoot, so the search backs up from here.`;
      lines = [`path: ${show(ev.path)} · sum: ${ev.sum}`, foundLine()];
    } else {
      current = ev.path;
      const dead = (kids.get(key(ev.path)) ?? []).length === 0;
      if (dead && k === events.length - 1) {
        frames.push({
          caption: `${undo}${choose} ${x}: the sum is ${ev.sum}, but no larger number is left, so the branch ends without an answer. The search is done: ${and(found.map((f) => show(f)))} sum to ${target}. Pruning cut ${[...status.values()].filter((s) => s === "pruned").length} branches early; the worst case is still O(2^n) subsets.`,
          items: draw([], [`path: ${show(ev.path)} · sum: ${ev.sum}, dead end`, foundLine()], true),
        });
        return;
      }
      caption = dead
        ? `${undo}${choose} ${x}: the sum is ${ev.sum}, but no larger number is left to add, so this branch ends without an answer.`
        : `${undo}${choose} ${x}: the path is ${show(ev.path)} with sum ${ev.sum}, still below ${target}, so the search goes deeper with the numbers after ${x}.`;
      lines = [`path: ${show(ev.path)} · sum: ${ev.sum}`, foundLine()];
    }
    frames.push({ caption, items: draw(current, lines) });
  });

  return finish({ title: "Subsets that sum to a target, with backtracking", input: `nums = ${show(nums)}, target = ${target}`, frames });
}

/* ── Registry ─────────────────────────────────────────────────────── */

export const WALKTHROUGHS: Record<string, () => Walkthrough> = {
  stack: validParentheses,
  queue: roundRobin,
  "monotonic-stack": nextGreaterElement,
  "monotonic-queue": slidingWindowMaximum,
  heap: binaryHeap,
  trees: bstInorder,
  trie,
  "segment-tree": segmentTree,
  "binary-indexed-tree": fenwickTree,
  "ordered-set": orderedSet,
  recursion: recursivePower,
  "divide-and-conquer": maxSubarrayDivideAndConquer,
  backtracking: subsetSumBacktracking,
};
