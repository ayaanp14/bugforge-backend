import { finish, link, treeLayout, type Frame, type Item, type LineTone, type Walkthrough } from "../walkthroughs/core.js";
import { box, chart, column, label } from "./kit.js";

/**
 * Time and Space Complexity (Big-O Notation): the lesson's figures
 * (content/roadmap/big-o-notation.md places each with "@figure <name>").
 * Charts for growth (computed from the functions they plot), the loop
 * shapes counted cell by cell, a recursion tree built by running the
 * recursion, and the call stack of a real recursive sum.
 */

/** A short legend line: a stroke sample and its words. */
function legend(id: string, x: number, y: number, text: string, tone: LineTone, dashed = false): Item[] {
  return [
    { k: "path", id: `${id}-l`, pts: [[x, y], [x + 18, y]], tone, width: 2, dashed },
    label(`${id}-t`, text, x + 24, y, { anchor: "start", size: 11, tone: tone === "accent" ? "accent" : tone === "faint" || tone === "line" ? "soft" : "ink" }),
  ];
}

/** The definition: f(n) = 3n² + 5n + 20 stays under 4n² from n₀ on, so it is O(n²). */
function upperBound(): Walkthrough {
  const f = (n: number) => 3 * n * n + 5 * n + 20;
  const g = (n: number) => n * n;
  const C = 4;
  const X_MAX = 14;
  // n₀: the first whole n from which f(n) ≤ c·g(n) holds for every larger n shown.
  let n0 = X_MAX;
  for (let n = X_MAX; n >= 1; n--) {
    if (f(n) <= C * g(n)) n0 = n;
    else break;
  }
  const c = chart("c", { w: 380, h: 200, xMax: X_MAX, yMax: 800, xLabel: "n", yLabel: "operations", xTicks: [0, 2, 4, 6, 8, 10, 12, 14], yTicks: [0, 200, 400, 600, 800] });
  const base: Item[] = [...c.items, c.curve("f", f, { tone: "ink" }), c.curve("g", g, { tone: "line", dashed: true })];
  const lx = c.px(0.6);
  const frames: Frame[] = [
    {
      caption: `f(n) = 3n² + 5n + 20 is the exact count for some program. It sits above n² everywhere, so "f ≤ n²" is false — but Big-O only asks for n² times some constant, from some size on.`,
      items: [...base, ...legend("lf", lx, c.py(780), "f(n) = 3n² + 5n + 20", "ink"), ...legend("lg", lx, c.py(700), "n²", "line", true)],
    },
    {
      caption: `Take c = ${C}: from n₀ = ${n0} on, f(n) never rises above ${C}n² again, so f is O(n²). The constant swallows the 3, and the 5n + 20 matters less and less — at n = 1,000 it is under 0.2 per cent of f.`,
      items: [
        ...base,
        c.curve("cg", (n) => C * g(n), { tone: "accent" }),
        { k: "path", id: "n0", pts: [[c.px(n0), c.py(0)], [c.px(n0), c.py(C * g(n0))]], tone: "faint", dashed: true, width: 1.2 },
        label("n0t", `n₀ = ${n0}`, c.px(n0) + 6, c.py(30), { anchor: "start", size: 11, tone: "accent", weight: 600 }),
        ...legend("lf", lx, c.py(780), "f(n) = 3n² + 5n + 20", "ink"),
        ...legend("lg", lx, c.py(700), "n²", "line", true),
        ...legend("lc", lx, c.py(620), `${C}n²  (c = ${C})`, "accent"),
      ],
    },
  ];
  return finish({ title: "What f(n) = O(n²) means: under c × n² from some n on", input: "", frames });
}

/** The common classes, added one curve at a time. */
function classes(): Walkthrough {
  const X_MAX = 16;
  const Y_MAX = 50;
  const c = chart("c", { w: 380, h: 220, xMax: X_MAX, yMax: Y_MAX, xLabel: "n (input size)", yLabel: "operations", xTicks: [0, 4, 8, 12, 16], yTicks: [0, 10, 20, 30, 40, 50] });
  const lg = (n: number) => (n <= 1 ? 0 : Math.log2(n));
  const list: Array<{ id: string; name: string; f: (n: number) => number; caption: string }> = [
    { id: "k1", name: "1", f: () => 1, caption: "O(1), constant: reading arr[i] or an average hash lookup costs the same at any size. The flat line along the bottom." },
    { id: "lg", name: "log n", f: lg, caption: "O(log n), logarithmic: a loop that halves, as in binary search. Doubling n adds one step; a billion items need about 30." },
    { id: "ln", name: "n", f: (n) => n, caption: "O(n), linear: one pass — a sum, a maximum, a running minimum. Doubling n doubles the work; about 10⁸ steps fit in a second." },
    { id: "nl", name: "n log n", f: (n) => n * lg(n), caption: "O(n log n): sorting. Slightly more than double when n doubles, and comfortable up to about 10⁶ items." },
    { id: "sq", name: "n²", f: (n) => n * n, caption: "O(n²), quadratic: every pair, two nested loops. Doubling n quadruples the work, so about 10⁴ items is the limit." },
    { id: "ex", name: "2ⁿ", f: (n) => 2 ** n, caption: "O(2ⁿ), exponential: every subset. One more item doubles the work — it leaves the chart before n = 6 and tops out near n = 25." },
  ];
  const frames: Frame[] = [];
  list.forEach((cl, k) => {
    const items: Item[] = [...c.items];
    list.slice(0, k + 1).forEach((d, j) => {
      const current = j === k;
      items.push(c.curve(d.id, d.f, { tone: current ? "accent" : "line", width: current ? 2.4 : 1.6, steps: 64 }));
      // The label sits where the curve leaves the chart, or at its right end.
      let x = X_MAX;
      for (let v = 0; v <= X_MAX; v += 0.05) if (d.f(v) >= Y_MAX) { x = v; break; }
      const y = Math.min(d.f(x), Y_MAX);
      const out = y >= Y_MAX;
      items.push(label(`${d.id}-t`, d.name, out ? c.px(x) : c.px(x) + 6, out ? c.py(Y_MAX) - 9 : c.py(y), { anchor: out ? "middle" : "start", size: 11.5, tone: current ? "accent" : "soft", weight: current ? 600 : 500 }));
    });
    frames.push({ caption: cl.caption, items });
  });
  return finish({ title: "The common complexity classes, side by side", input: "", frames });
}

/** Two nested loops over n against the loop where j starts after i: a square of runs and a triangle half its size. */
function pairTriangle(): Walkthrough {
  const frames: Frame[] = [];
  const SIDE = 168;
  for (const n of [6, 12]) {
    const step = SIDE / n;
    const cell = step - (n > 8 ? 1.5 : 3);
    const items: Item[] = [];
    const GX = SIDE + 56;
    let square = 0;
    let tri = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        square++;
        items.push(box(`q${n}-${i}-${j}`, j * step, i * step, "", { tone: "accent", w: cell, h: cell }));
        const inTri = j > i;
        if (inTri) tri++;
        items.push(box(`t${n}-${i}-${j}`, GX + j * step, i * step, "", { tone: inTri ? "accent" : "ghost", w: cell, h: cell }));
      }
    items.push(label("h1", "j from 0 to n − 1", SIDE / 2, -30, { size: 11.5, tone: "ink", weight: 600, mono: false }));
    items.push(label("h2", "j from i + 1 to n − 1", GX + SIDE / 2, -30, { size: 11.5, tone: "ink", weight: 600, mono: false }));
    items.push(label("ax1", "j →", 0, -12, { anchor: "start", size: 10.5, tone: "faint" }));
    items.push(label("ax2", "j →", GX, -12, { anchor: "start", size: 10.5, tone: "faint" }));
    items.push(label("ay", "i ↓", -8, step / 2, { anchor: "end", size: 10.5, tone: "faint" }));
    items.push(label("c1", `${square} runs`, SIDE / 2, SIDE + 18, { size: 12.5, tone: "ink", weight: 600, mono: true }));
    items.push(label("c2", `${tri} runs`, GX + SIDE / 2, SIDE + 18, { size: 12.5, tone: "ink", weight: 600, mono: true }));
    frames.push({
      caption:
        n === 6
          ? `Each square is one run of the inner body, for n = ${n}. Both loops run n times: n² = ${square} runs. Starting j after i skips the diagonal and below: n(n − 1)/2 = ${tri}, a little under half.`
          : `Double n to ${n}: the square grows to ${square} runs and the triangle to ${tri} — both about four times bigger. The half changes how long one run takes, never the shape of the growth: both are O(n²).`,
      items,
    });
  }
  return finish({ title: "Nested loops: a square of runs, and the triangle of pairs", input: "", frames });
}

/** The halving loop for n = 100: each run cuts i in half, so the bars shrink to nothing in seven runs. */
function halving(): Walkthrough {
  const START = 100;
  const UNIT = 3.6;
  const ROW = 30;
  const H = 22;
  const runs: number[] = [];
  for (let i = START; i > 0; i = Math.floor(i / 2)) runs.push(i);
  const frames: Frame[] = [];
  const draw = (upto: number, done = false): Item[] => {
    const items: Item[] = [];
    runs.slice(0, upto + 1).forEach((v, k) => {
      const w = Math.max(3, v * UNIT);
      const inside = w >= 34;
      items.push(box(`b${k}`, 0, k * ROW, inside ? v : "", { tone: k === upto && !done ? "accent" : done ? "strong" : "plain", w, h: H, size: 12 }));
      if (!inside) items.push(label(`v${k}`, String(v), w + 8, k * ROW + H / 2, { anchor: "start", size: 12, tone: "ink", mono: true }));
      items.push(label(`r${k}`, `run ${k + 1}`, -10, k * ROW + H / 2, { anchor: "end", size: 11, tone: "faint" }));
    });
    items.push(label("cnt", done ? `i = 0: the loop stops after ${runs.length} runs` : `i = ${runs[upto]}`, 0, runs.length * ROW + 14, { anchor: "start", size: 12.5, tone: "ink", weight: 600, mono: true }));
    // Reserve the width of the first bar in every frame, so nothing rescales.
    items.push({ k: "path", id: "ruler", pts: [[0, -10], [START * UNIT, -10]], tone: "faint", width: 1 });
    items.push(label("rl", `n = ${START}`, START * UNIT, -22, { anchor: "end", size: 10.5, tone: "faint" }));
    return items;
  };
  frames.push({ caption: `The loop starts with i = ${START}, runs its body once and sets i to ${runs[1]}. The bar is i: the work left to halve.`, items: draw(0) });
  for (let k = 1; k < runs.length; k++) {
    frames.push({
      caption:
        k === 1
          ? `Run 2 sees i = ${runs[1]} and halves it to ${runs[2]}. Each run removes half of what is left, not a fixed amount.`
          : k === runs.length - 1
            ? `Run ${k + 1}: i = ${runs[k]}, and halving it gives 0, so the test i > 0 fails and the loop ends.`
            : `Run ${k + 1}: i = ${runs[k]}, halved (rounding down) to ${Math.floor(runs[k] / 2)}.`,
      items: draw(k),
    });
  }
  frames.push({
    caption: `${runs.length} runs for n = ${START}, and log₂ ${START} ≈ ${Math.log2(START).toFixed(1)}. A million needs 20 runs and a billion 30: that is O(log n), and why an O(log n) step inside an O(n) loop costs so little.`,
    items: draw(runs.length - 1, true),
  });
  return finish({ title: "A loop that halves runs about log₂ n times", input: `for (i = ${START}; i > 0; i /= 2)`, frames });
}

/** Naive Fibonacci's recursion tree, its repeated calls, and the same tree with a memo cutting every repeat off. */
function fibTree(): Walkthrough {
  const N = 5;
  type Node = { id: string; k: number; kids: string[] };
  const nodes = new Map<string, Node>();
  const build = (id: string, k: number) => {
    const node: Node = { id, k, kids: [] };
    nodes.set(id, node);
    if (k >= 2) {
      node.kids = [`${id}L`, `${id}R`];
      build(`${id}L`, k - 1);
      build(`${id}R`, k - 2);
    }
  };
  build("r", N);
  const pos = treeLayout<string>("r", (id) => nodes.get(id)!.kids, { dx: 40, dy: 54 });
  const order: string[] = [];
  const walk = (id: string) => {
    order.push(id);
    nodes.get(id)!.kids.forEach(walk);
  };
  walk("r");
  // Repeats in the naive tree: every call after the first one for the same k.
  const firstFor = new Map<number, string>();
  const repeat = new Set<string>();
  for (const id of order) {
    const k = nodes.get(id)!.k;
    if (firstFor.has(k)) repeat.add(id);
    else firstFor.set(k, id);
  }
  // With a memo: run the recursion in call order; a call for a k already finished returns at once.
  const done = new Set<number>();
  const called = new Set<string>();
  const hits = new Set<string>();
  const memo = (id: string) => {
    called.add(id);
    const node = nodes.get(id)!;
    if (node.k < 2) return;
    if (done.has(node.k)) {
      hits.add(id);
      return;
    }
    node.kids.forEach(memo);
    done.add(node.k);
  };
  memo("r");
  const R = 16;
  const draw = (mode: "plain" | "repeats" | "memo"): Item[] => {
    const items: Item[] = [];
    for (const n of nodes.values())
      for (const kid of n.kids) {
        const off = mode === "memo" && !called.has(kid);
        items.push(link(`e${kid}`, pos.get(n.id)!, pos.get(kid)!, R, { tone: off ? "faint" : "line" }));
      }
    for (const n of nodes.values()) {
      const p = pos.get(n.id)!;
      const tone = mode === "repeats" ? (repeat.has(n.id) ? "accent" : "plain") : mode === "memo" ? (!called.has(n.id) ? "muted" : hits.has(n.id) ? "accent" : "plain") : "plain";
      items.push({ k: "node", id: n.id, x: p.x, y: p.y, r: R, text: String(n.k), tone, size: 12.5 });
    }
    return items;
  };
  const total = nodes.size;
  const countK = (k: number) => [...nodes.values()].filter((n) => n.k === k).length;
  // fib(50) by both rules, for the caption: naive calls are 2·fib(51) − 1, memo calls 2·50 − 1.
  let a = 0;
  let b = 1;
  for (let i = 0; i < 51; i++) [a, b] = [b, a + b];
  const naive50 = 2 * a - 1;
  return finish({
    title: `The recursion tree of naive fib(${N}), and the same calls with a memo`,
    input: "fib(n) = fib(n − 1) + fib(n − 2), with fib(0) = 0 and fib(1) = 1",
    frames: [
      { caption: `Each circle is one call fib(k), and every call above 1 makes two more. fib(${N}) makes ${total} calls in all; each extra level roughly doubles the tree.`, items: draw("plain") },
      {
        caption: `The highlighted calls repeat work already done: fib(3) is computed ${countK(3)} times and fib(2) ${countK(2)} times. At n = 50 the tree has about ${(naive50 / 1e10).toFixed(0)} × 10¹⁰ calls — exponential, quoted as O(2ⁿ).`,
        items: draw("repeats"),
      },
      {
        caption: `Store each answer the first time and a repeat returns at once (highlighted); the greyed subtrees are never called. ${called.size} calls instead of ${total}, and 99 for fib(50): O(n). That is dynamic programming.`,
        items: draw("memo"),
      },
    ],
  });
}

/** A recursive array sum: one stack frame per pending call, so the memory is the depth. */
function callStack(): Walkthrough {
  const arr = [3, 1, 4, 1, 5];
  const n = arr.length;
  const frames: Frame[] = [];
  const W = 184;
  const H = 30;
  // Run the recursion and record the stack after each push and each return.
  type Entry = { i: number; result?: number };
  const stack: Entry[] = [];
  const snaps: Array<{ stack: Entry[]; event: string; returned?: { i: number; v: number } }> = [];
  const sum = (i: number): number => {
    stack.push({ i });
    snaps.push({ stack: stack.map((e) => ({ ...e })), event: "push" });
    const v = i === n ? 0 : arr[i] + sum(i + 1);
    stack.pop();
    snaps.push({ stack: stack.map((e) => ({ ...e })), event: "return", returned: { i, v } });
    return v;
  };
  const total = sum(0);
  const maxDepth = Math.max(...snaps.map((s) => s.stack.length));
  const draw = (st: Entry[], o: { returned?: { i: number; v: number } } = {}): Item[] => {
    // A frame whose callee has just returned shows the sum it can now finish.
    const text = (e: Entry) =>
      e.i === n ? `sum(${e.i}) = 0 (base case)` : o.returned && o.returned.i === e.i + 1 ? `sum(${e.i}): ${arr[e.i]} + ${o.returned.v} = ${arr[e.i] + o.returned.v}` : `sum(${e.i}): ${arr[e.i]} + sum(${e.i + 1}) …`;
    // Newest frame on top: column() puts values[0] first.
    const shown = [...st].reverse();
    const items: Item[] = column("f", shown.map(text), { w: W, h: H, gap: 4, tone: (k) => (k === 0 ? "accent" : "plain"), size: 12 }).map((it, k) => ({ ...it, id: `fr${shown[k].i}`, y: (maxDepth - st.length + k) * (H + 4) }));
    items.push(label("base", "bottom of the stack", W / 2, maxDepth * (H + 4) + 10, { size: 10.5, tone: "faint" }));
    if (st.length) {
      items.push(label("dep", `depth ${st.length}`, W + 16, (maxDepth - st.length) * (H + 4) + H / 2, { anchor: "start", size: 12, tone: "accent", weight: 600, mono: true }));
      if (o.returned) items.push(label("ret", `sum(${o.returned.i}) returned ${o.returned.v}`, W + 16, (maxDepth - st.length) * (H + 4) + H / 2 + 22, { anchor: "start", size: 11, tone: "soft", mono: true }));
    } else items.push(label("res", `empty — sum(0) returned ${total}`, W / 2, maxDepth * (H + 4) - H / 2, { size: 12.5, tone: "ink", weight: 600, mono: true }));
    return items;
  };
  const pushes = snaps.filter((s) => s.event === "push");
  frames.push({ caption: `sum(i) returns arr[i] + sum(i + 1). Calling sum(0) puts one frame on the call stack — its parameter, its local values and where to return to.`, items: draw(pushes[0].stack) });
  frames.push({ caption: `sum(0) cannot finish until sum(1) does, so both frames stay. Every pending call keeps its frame: the stack grows by one per level of recursion.`, items: draw(pushes[2].stack) });
  frames.push({
    caption: `At the base case the stack is ${maxDepth} frames deep — n + 1 for n = ${n}. The recursion allocates no array, yet uses O(n) memory; the loop version uses O(1).`,
    items: draw(pushes[pushes.length - 1].stack),
  });
  const firstReturns = snaps.filter((s) => s.event === "return");
  const mid = firstReturns[2];
  const r = mid.returned!;
  frames.push({
    caption: `Returns unwind from the top. sum(${r.i}) handed back ${r.v} and its frame is gone, so sum(${r.i - 1}) can finish with ${arr[r.i - 1]} + ${r.v} = ${arr[r.i - 1] + r.v} and pop off in turn.`,
    items: draw(mid.stack, { returned: r }),
  });
  frames.push({
    caption: `All frames are gone and sum(0) = ${total}. Depth is a hard limit as well as a cost: Python stops at 1,000 frames by default, and a recursion 10⁵ deep can crash in any language.`,
    items: draw([], { returned: firstReturns[firstReturns.length - 1].returned }),
  });
  return finish({ title: "Recursion uses memory: one stack frame per pending call", input: `arr = [${arr.join(", ")}], sum(i) = arr[i] + sum(i + 1)`, frames });
}

/** Copies paid by n appends: doubling stays under 2n, adding ten slots grows like n². */
function amortised(): Walkthrough {
  const N = 200;
  const Y_MAX = 2000;
  const run = (doubling: boolean) => {
    let cap = doubling ? 1 : 10;
    let size = 0;
    let copies = 0;
    const pts: Array<[number, number]> = [[0, 0]];
    for (let i = 0; i < N; i++) {
      if (size === cap) {
        pts.push([i, copies]);
        copies += size;
        pts.push([i, copies]);
        cap = doubling ? cap * 2 : cap + 10;
      }
      size++;
    }
    pts.push([N, copies]);
    return { pts, copies };
  };
  const dbl = run(true);
  const add = run(false);
  const c = chart("c", { w: 380, h: 210, xMax: N, yMax: Y_MAX, xLabel: "appends", yLabel: "values copied in total", xTicks: [0, 50, 100, 150, 200], yTicks: [0, 500, 1000, 1500, 2000] });
  const toSvg = (pts: Array<[number, number]>): Array<[number, number]> => pts.map(([x, y]) => [c.px(x), c.py(y)]);
  const items: Item[] = [
    ...c.items,
    c.curve("two", (n) => 2 * n, { tone: "faint", dashed: true, width: 1.4 }),
    label("twol", "2n", c.px(N) + 6, c.py(2 * N), { anchor: "start", size: 11, tone: "faint" }),
    { k: "path", id: "add", pts: toSvg(add.pts), tone: "error", width: 2 },
    { k: "path", id: "dbl", pts: toSvg(dbl.pts), tone: "accent", width: 2 },
    label("addl", `grow by 10 slots: ${add.copies.toLocaleString("en-GB")} copies`, c.px(N) - 4, c.py(add.copies) - 12, { anchor: "end", size: 11, tone: "error", weight: 600 }),
    label("dbll", `double: ${dbl.copies} copies`, c.px(N) - 4, c.py(dbl.copies) - 32, { anchor: "end", size: 11, tone: "accent", weight: 600 }),
  ];
  return finish({
    title: "Copies paid for n appends: doubling against adding ten slots",
    input: "",
    frames: [
      {
        caption: `Doubling copies in jumps that get rarer as they get bigger, and the total stays under 2n — ${dbl.copies} copies for ${N} appends, so each append is amortised O(1). Growing by a fixed 10 slots copies ${add.copies.toLocaleString("en-GB")}: about n²/20, O(n) per append.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "upper-bound": upperBound,
  classes,
  "pair-triangle": pairTriangle,
  halving,
  "fib-tree": fibTree,
  "call-stack": callStack,
  amortised,
};
