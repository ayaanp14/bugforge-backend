import { CELL, and, finish, note, row, rowLabel, show, slotMid, slotX, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { slidingWindowMaximum } from "../walkthroughs/structures.js";
import { label } from "./kit.js";

/**
 * Monotonic Stack: the lesson's figures (content/roadmap/monotonic-stack.md
 * places each with "@figure <name>"). Why a pop records the *first* greater
 * value, why the double loop is O(n), the previous-smaller scan, the
 * largest rectangle in a histogram, and the monotonic deque — every one
 * runs the real scan and records what the stack did.
 */

const U = 20; // px per unit of height for bars

/** Bars standing on y = 0, one per value, each in its slot of the usual 46-unit grid, with the index under it. */
function barsOf(prefix: string, values: readonly number[], tone: (i: number) => Tone, o: { text?: boolean } = {}): Item[] {
  const items: Item[] = [];
  values.forEach((v, i) => {
    const h = Math.max(2, v * U);
    items.push({ k: "cell", id: `${prefix}${i}`, x: slotX(i), y: -h, w: CELL, h, text: o.text === false ? "" : String(v), tone: tone(i), size: 12 });
    items.push({ k: "text", id: `${prefix}i${i}`, x: slotMid(i), y: 11, text: String(i), tone: "faint", size: 10 });
  });
  return items;
}

/* ── Why each pop is the right answer ──────────────────────────────── */

/** Every pop (j popped by i) drawn as a sight line at height nums[j]: nothing between them rose above it, so i is the first greater value. */
function whyFirst(): Walkthrough {
  const nums = [5, 2, 1, 3, 6, 4];
  const n = nums.length;
  const answer: Array<number | null> = nums.map(() => null);
  const events: Array<{ j: number; i: number }> = [];
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    while (stack.length && nums[stack[stack.length - 1]] < nums[i]) events.push({ j: stack.pop()!, i });
    stack.push(i);
  }
  const left = [...stack];
  const AY = 34;
  const frames: Frame[] = [];

  const draw = (ev: { j: number; i: number | null } | null, final = false): Item[] => {
    const items: Item[] = [];
    const between = (k: number) => ev !== null && k > ev.j && (ev.i === null || k < ev.i);
    items.push(...barsOf("b", nums, (k) => (final ? "plain" : ev && k === ev.j ? "accent" : ev && k === ev.i ? "strong" : between(k) ? "muted" : "plain")));
    if (ev) {
      const y = -nums[ev.j] * U;
      const x2 = ev.i === null ? slotX(n) + 4 : slotX(ev.i) - 2;
      items.push({ k: "path", id: "sight", pts: [[slotX(ev.j) + CELL, y], [x2, y]], tone: "accent", dashed: true, width: 1.6 });
      items.push(note("sl", ev.i === null ? `along the line at ${nums[ev.j]}: no later bar rises above it` : `along the line at ${nums[ev.j]}: the first bar above it is ${nums[ev.i]}`, 0, -7 * U - 8, { size: 11.5, tone: "accent", weight: 600 }));
    }
    items.push(rowLabel("al", "next greater", -10, AY, 30));
    answer.forEach((a, k) => items.push({ k: "cell", id: `a${k}`, x: slotX(k), y: AY, w: CELL, h: 30, text: a === null ? "" : String(a), tone: a === null ? "ghost" : final ? "strong" : ev && k === ev.j ? "accent" : "plain", size: 12 }));
    return items;
  };

  frames.push({
    caption: `Draw the values as bars. When index i pops index j, the scan records nums[i] as j's next greater value. Why is it the first one? Look along a line at the height of bar j.`,
    items: draw(null),
  });
  let k = 0;
  for (const ev of events) {
    answer[ev.j] = nums[ev.i];
    const mid = nums.slice(ev.j + 1, ev.i);
    frames.push({
      caption: mid.length
        ? `${nums[ev.i]} at index ${ev.i} pops ${nums[ev.j]} (index ${ev.j}). Every bar between them — ${and(mid.map(String))} — arrived while ${nums[ev.j]} was waiting and did not pop it, so none was taller: ${nums[ev.i]} is the first value to rise above the line.`
        : `${nums[ev.i]} at index ${ev.i} pops ${nums[ev.j]}, its neighbour: nothing lies between them, so ${nums[ev.i]} is trivially the first greater value.${k === 0 ? "" : ""}`,
      items: draw(ev),
    });
    k++;
  }
  for (const j of left) answer[j] = -1;
  frames.push({
    caption: `${and(left.map((j) => String(nums[j])))} ${left.length === 1 ? "was" : "were"} never popped, so no later bar rose above ${left.length === 1 ? "it" : "them"} and −1 is right. Every answer, ${show(answer.map((a) => a ?? -1))}, was fixed at the moment its index was popped and never looked at again.`,
    items: draw({ j: left[0], i: null }),
  });
  return finish({ title: "Why a pop always finds the first greater value", input: `nums = ${show(nums)}`, frames });
}

/* ── Why the double loop is O(n) ───────────────────────────────────── */

/** The same pushes and pops counted two ways: per step they spike, per index there are never more than two. */
function work(): Walkthrough {
  const nums = [4, 3, 2, 1, 5, 2, 1, 6];
  const n = nums.length;
  // Run the next-greater scan and log each operation: the step it happened in, and the index it was about.
  const ops: Array<{ id: string; kind: "push" | "pop"; step: number; index: number }> = [];
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {
      const j = stack.pop()!;
      ops.push({ id: `pop${j}`, kind: "pop", step: i, index: j });
    }
    stack.push(i);
    ops.push({ id: `push${i}`, kind: "push", step: i, index: i });
  }
  const CH = 22;
  const CG = 3;
  const pushes = ops.filter((o) => o.kind === "push").length;
  const pops = ops.length - pushes;

  const draw = (by: "step" | "index"): Item[] => {
    const items: Item[] = [];
    // Order inside a column: the step's pops then its push; for an index, its push then its pop.
    for (let c = 0; c < n; c++) {
      const col = ops.filter((o) => (by === "step" ? o.step === c : o.index === c));
      if (by === "index") col.sort((a, b) => (a.kind === "push" ? -1 : 1) - (b.kind === "push" ? -1 : 1));
      col.forEach((o, k) => items.push({ k: "cell", id: o.id, x: slotX(c), y: -(k + 1) * (CH + CG), w: CELL, h: CH, text: String(nums[o.index]), tone: o.kind === "push" ? "accent" : "plain", size: 11 }));
    }
    items.push(...row("v", nums, { y: 8, tone: () => "plain" }));
    items.push(rowLabel("vl", "nums", -10, 8));
    for (let c = 0; c < n; c++) items.push({ k: "text", id: `ci${c}`, x: slotMid(c), y: 8 + CELL + 11, text: String(c), tone: "faint", size: 10 });
    items.push(note("cap", by === "step" ? "operations in each step i" : "operations on each index", 0, -6 * (CH + CG) - 14, { size: 12, weight: 600, tone: by === "step" ? "ink" : "accent", mono: false }));
    items.push({ k: "cell", id: "kpush", x: slotX(n) - 118, y: -6 * (CH + CG) - 22, w: 14, h: 14, text: "", tone: "accent" });
    items.push(label("kpl", "push", slotX(n) - 98, -6 * (CH + CG) - 15, { anchor: "start", size: 11 }));
    items.push({ k: "cell", id: "kpop", x: slotX(n) - 62, y: -6 * (CH + CG) - 22, w: 14, h: 14, text: "", tone: "plain" });
    items.push(label("kpo", "pop", slotX(n) - 42, -6 * (CH + CG) - 15, { anchor: "start", size: 11 }));
    items.push(note("tot", `${pushes} pushes + ${pops} pops = ${ops.length} ≤ 2 × ${n}`, 0, 8 + CELL + 34, { size: 12, weight: 600 }));
    return items;
  };

  const busiest = Math.max(...Array.from({ length: n }, (_, c) => ops.filter((o) => o.step === c).length));
  return finish({
    title: "Why the loop inside a loop is still O(n)",
    input: `nums = ${show(nums)}`,
    frames: [
      {
        caption: `Every push and pop of the next-greater scan, stacked over the step that made it. Most steps do one push, but the step that reads ${nums[ops.find((o) => ops.filter((p) => p.step === o.step).length === busiest)!.step]} does ${busiest} operations at once — which is what makes the inner loop look quadratic.`,
        items: draw("step"),
      },
      {
        caption: `The same ${ops.length} operations regrouped by the index they were about. Each index is pushed exactly once and popped at most once, so no column holds more than two: at most 2n operations however they bunch up. A burst of pops only uses up pops that no later step can make — O(n) amortised.`,
        items: draw("index"),
      },
    ],
  });
}

/* ── Previous smaller element ──────────────────────────────────────── */

/** Previous smaller: pop everything not smaller than the new value, then the top is its answer; push it. */
function prevSmaller(): Walkthrough {
  const arr = [4, 5, 2, 10, 8];
  const answer: Array<number | null> = arr.map(() => null);
  const stack: number[] = [];
  const AY = 92;
  const SY = 174;
  const frames: Frame[] = [];

  const draw = (i: number, o: { popped?: number[]; done?: boolean } = {}): Item[] => {
    const items: Item[] = [rowLabel("al", "arr", -10, 0)];
    items.push(...row("v", arr, { index: true, tone: (j) => (o.done ? "plain" : j === i ? "accent" : o.popped?.includes(j) ? "muted" : "plain") }));
    if (i >= 0 && !o.done) items.push({ k: "ptr", id: "i", x: slotMid(i), y: CELL + 20, label: "i", tone: "accent", up: true });
    items.push(rowLabel("ansl", "answer", -10, AY));
    answer.forEach((a, j) => items.push({ k: "cell", id: `a${j}`, x: slotX(j), y: AY, w: CELL, h: CELL, text: a === null ? "" : String(a), tone: a === null ? "ghost" : o.done ? "strong" : j === i ? "accent" : "plain" }));
    items.push(rowLabel("sl", "stack", -10, SY));
    stack.forEach((idx, k) => items.push({ k: "cell", id: `s${idx}`, x: slotX(k), y: SY, w: CELL, h: CELL, text: String(arr[idx]), tone: idx === i && !o.done ? "accent" : "plain" }));
    if (stack.length) items.push({ k: "ptr", id: "top", x: slotMid(stack.length - 1), y: SY - 6, label: "top", tone: "ink", up: false });
    else items.push(note("se", "empty", 0, SY + CELL / 2, { tone: "faint", size: 12 }));
    return items;
  };

  frames.push({
    caption: "For each element, the nearest value to its left that is smaller. Scan left to right; this time the answer for the current element is read from the stack, not handed to the popped ones.",
    items: draw(-1),
  });
  arr.forEach((v, i) => {
    const popped: number[] = [];
    while (stack.length && arr[stack[stack.length - 1]] >= v) popped.push(stack.pop()!);
    answer[i] = stack.length ? arr[stack[stack.length - 1]] : -1;
    const top = stack.length ? arr[stack[stack.length - 1]] : null;
    stack.push(i);
    let caption: string;
    if (popped.length)
      caption = `${v} pops ${and(popped.map((j) => String(arr[j])))}: ${popped.length === 1 ? "it is" : "they are"} no smaller than ${v} and further away, so for any later element ${v} is always the better candidate — ${popped.length === 1 ? "it is" : "they are"} dominated and can go. ${top === null ? "The stack is empty, so the answer is −1." : `The top is now ${top}, the answer.`}`;
    else if (top === null) caption = `${v} has nothing to its left, so its answer is −1; push it.`;
    else caption = `${top} on top is smaller than ${v}, so nothing is popped and ${top} is the answer. Push ${v}: the stack, ${show(stack.map((j) => arr[j]))}, increases from bottom to top.`;
    frames.push({ caption, items: draw(i, { popped }) });
  });
  frames.push({
    caption: `The answers are ${show(answer.map((a) => a ?? -1))}. Popping on >= keeps the stack strictly increasing, so its top is always the nearest smaller candidate. Each index is pushed once and popped at most once: O(n).`,
    items: draw(-1, { done: true }),
  });
  return finish({ title: "Previous smaller element, read from the top", input: `arr = ${show(arr)}`, frames });
}

/* ── Largest rectangle in a histogram ──────────────────────────────── */

/** An increasing stack of bars; each pop measures the widest rectangle in which the popped bar is the shortest. */
function histogram(): Walkthrough {
  const heights = [2, 1, 5, 6, 2, 3];
  const n = heights.length;
  const SY = 40;
  const stack: number[] = [];
  const measured = new Set<number>();
  let best = 0;
  let bestRect: { l: number; r: number; h: number } | null = null;
  const frames: Frame[] = [];

  const draw = (i: number, o: { rect?: { l: number; r: number; h: number; area: number }; done?: boolean; text: string }): Item[] => {
    const items: Item[] = [];
    const inRect = (k: number, r?: { l: number; r: number } | null) => !!r && k >= r.l && k <= r.r;
    items.push(...barsOf("b", heights, (k) => (o.done ? (inRect(k, bestRect) ? "accent" : "plain") : inRect(k, o.rect) ? "accent" : measured.has(k) ? "muted" : "plain")));
    // The sentinel: a height-0 bar after the last one, drawn as a dashed slot.
    items.push({ k: "cell", id: "sent", x: slotX(n), y: -6, w: CELL, h: 6, text: "", tone: "ghost" });
    items.push({ k: "text", id: "senti", x: slotMid(n), y: 11, text: String(n), tone: "faint", size: 10 });
    const r = o.rect ?? (o.done && bestRect ? { ...bestRect, area: best } : undefined);
    if (r) {
      const x1 = slotX(r.l) - 3;
      const x2 = slotX(r.r) + CELL + 3;
      const y = -r.h * U;
      const tallest = Math.max(...heights.slice(r.l, r.r + 1));
      items.push({ k: "path", id: "rect", pts: [[x1, 0], [x1, y], [x2, y], [x2, 0]], closed: true, fill: o.done ? "strong" : "accent", tone: "accent", width: 2 });
      items.push(label("ra", `${r.h} × ${r.r - r.l + 1} = ${r.area}`, (x1 + x2) / 2, -tallest * U - 11, { size: 11.5, tone: "accent", weight: 600 }));
    }
    if (i >= 0 && !o.done) items.push({ k: "ptr", id: "i", x: slotMid(i), y: 20, label: "i", tone: "accent", up: true });
    items.push(rowLabel("sl", "stack", -10, SY + 18, 30));
    stack.forEach((idx, k) => items.push({ k: "cell", id: `s${idx}`, x: slotX(k), y: SY + 18, w: CELL, h: 30, text: `${heights[idx]}`, tone: "plain", size: 12 }));
    if (!stack.length) items.push(note("se", "empty", 0, SY + 33, { tone: "faint", size: 12 }));
    items.push(note("best", `best = ${best}`, 0, SY + 74, { size: 12.5, weight: 600, tone: "accent" }));
    items.push(note("code", o.text, 92, SY + 74, { size: 12, tone: "soft" }));
    return items;
  };

  frames.push({
    caption: `The best rectangle's height is the height of its shortest bar. So for each bar, find the widest rectangle in which it is the shortest: it stretches left to the previous smaller bar and right to the next smaller one. An increasing stack finds both.`,
    items: draw(-1, { text: "stack of bar heights, increasing" }),
  });
  // Steps that only push are shown together; a push that follows pops is told in the last pop's caption.
  let quiet: number[] = [];
  const flushQuiet = () => {
    if (!quiet.length) return;
    const hs = quiet.map((k) => heights[k]);
    const onEmpty = quiet[0] === 0;
    frames.push({
      caption: onEmpty
        ? `Bar 0 (height ${hs[0]}) is pushed. A bar waits on the stack until a shorter one arrives, because until then its rectangle can still grow to the right.`
        : `${and(hs.map(String))} ${hs.length === 1 ? "is" : "are each"} taller than the top, so nothing is popped and ${hs.length === 1 ? "it is" : "they are"} pushed: the heights on the stack, ${show(stack.map((k) => heights[k]))}, still increase from bottom to top.`,
      items: draw(quiet[quiet.length - 1], { text: `push ${and(hs.map(String))}` }),
    });
    quiet = [];
  };
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i];
    let popped = 0;
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      flushQuiet();
      const bar = stack.pop()!;
      measured.add(bar);
      popped++;
      const leftB = stack.length ? stack[stack.length - 1] : -1;
      const width = i - leftB - 1;
      const area = heights[bar] * width;
      const improved = area > best;
      if (improved) {
        best = area;
        bestRect = { l: leftB + 1, r: i - 1, h: heights[bar] };
      }
      const last = !(stack.length && heights[stack[stack.length - 1]] >= h);
      const why = i === n ? `The height-0 sentinel at index ${n} pops the bar of height ${heights[bar]}` : `${h} at index ${i} is not taller than ${heights[bar]} on top, so it pops it`;
      const then = last && i < n ? ` Then ${h} is pushed.` : "";
      frames.push({
        caption: `${why}. That bar's rectangle ends just before index ${i} and starts just after ${leftB === -1 ? "the left edge, since nothing is left below it" : `index ${leftB}, the bar now on top`}: ${heights[bar]} × ${width} = ${area}${improved ? `, the best so far` : ""}.${then}`,
        items: draw(i, { rect: { l: leftB + 1, r: i - 1, h: heights[bar], area }, text: `left = ${leftB}, width = ${i} − ${leftB < 0 ? `(${leftB})` : leftB} − 1 = ${width}` }),
      });
    }
    if (i < n) {
      stack.push(i);
      if (!popped) quiet.push(i);
    }
  }
  frames.push({
    caption: `Every bar was measured exactly once, when it was popped, so the whole scan is O(n). The largest rectangle has area ${best}: height ${bestRect!.h} across indices ${bestRect!.l} to ${bestRect!.r}.`,
    items: draw(-1, { done: true, text: `answer: ${best}` }),
  });
  return finish({ title: "Largest rectangle in a histogram with an increasing stack", input: `heights = ${show(heights)}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "why-first": whyFirst,
  work,
  "prev-smaller": prevSmaller,
  histogram,
  // The monotonic-queue hub's walkthrough, shown in the lesson's deque section.
  "window-max": slidingWindowMaximum,
};
