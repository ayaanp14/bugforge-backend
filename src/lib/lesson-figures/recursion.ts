import { finish, link, note, treeLayout, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Recursion — the lesson's figures (content/roadmap/recursion.md places each
 * with "@figure <name>"; fast power is the hub's walkthrough). Each one runs
 * the recursive function it shows and records what happened: frames pushed
 * and popped, the calls of a recursion tree, the order a decision tree is
 * explored in. A call keeps its id from frame to frame, so the stack grows
 * and shrinks in place and a pruned tree visibly loses its branches.
 */

/* ── The call stack ──────────────────────────────────────────────── */

/** factorial(4): five frames pushed on the way down, popped one by one on the way up as each multiplication finishes. */
function callStack(): Walkthrough {
  const N = 4;
  const H = 30;
  const GAP = 6;
  const BW = 300;
  const yOf = (depth: number) => -(depth + 1) * (H + GAP); // depth 0 = main, at the bottom
  const frames: Frame[] = [];
  type Call = { n: number; text: string; tone: Tone };

  const draw = (stack: Call[], o: { ret?: { from: number; value: number } } = {}): Item[] => {
    const items: Item[] = [box("main", 0, yOf(0), "main", { tone: "muted", w: BW, h: H, size: 12 })];
    stack.forEach((c, k) => items.push(box(`f${c.n}`, 0, yOf(k + 1), c.text, { tone: c.tone, w: BW, h: H, size: 12 })));
    if (stack.length) items.push({ k: "text", id: "top", x: BW + 12, y: yOf(stack.length) + H / 2, text: "← top", tone: "accent", anchor: "start", size: 11.5, weight: 600, mono: false });
    if (o.ret) {
      const fromY = yOf(o.ret.from) + H / 2;
      items.push(arrow("ret", { x: -10, y: fromY - 2 }, { x: -10, y: fromY + H + GAP - 2 }, { tone: "accent", bow: 16 }));
      items.push({ k: "text", id: "ret-t", x: -26, y: fromY + (H + GAP) / 2, text: `returns ${o.ret.value}`, tone: "accent", anchor: "end", size: 11.5, weight: 600, mono: false });
    }
    items.push(note("depth", `frames on the stack: ${stack.length}`, 0, yOf(0) + H + 22, { size: 12, tone: "soft" }));
    return items;
  };

  // Run factorial(N) as an explicit trace of pushes and pops.
  const stack: Call[] = [];
  const waiting = (n: number): Call => ({ n, text: `factorial(${n})   n = ${n}   waiting for f(${n - 1})`, tone: "plain" });
  for (let n = N; n >= 0; n--) {
    if (stack.length) stack[stack.length - 1] = waiting(stack[stack.length - 1].n);
    if (n === 0) {
      stack.push({ n, text: `factorial(0)   base case: return 1`, tone: "strong" });
      frames.push({ caption: "factorial(0) is the base case: it answers 1 at once and calls nothing. This is the deepest point — five frames, each holding its own n, all running the same code.", items: draw(stack) });
    } else {
      stack.push({ n, text: `factorial(${n})   n = ${n}   calls f(${n - 1})`, tone: "accent" });
      frames.push({
        caption: n === N ? `factorial(${N}) starts: a new frame is pushed with n = ${N}. It cannot multiply yet — it needs factorial(${N - 1}) first.` : `factorial(${n}) is pushed on top. The frames below it are paused mid-line, each waiting for the call above it to return.`,
        items: draw(stack),
      });
    }
  }
  let value = 1;
  while (stack.length > 1) {
    const done = stack.pop()!;
    const top = stack[stack.length - 1];
    const sub = value;
    value = top.n * sub;
    stack[stack.length - 1] = { n: top.n, text: `factorial(${top.n})   returns ${top.n} × ${sub} = ${value}`, tone: "accent" };
    frames.push({
      caption: `factorial(${done.n}) returns ${sub} and its frame is popped. factorial(${top.n}) resumes exactly where it paused and does its multiplication: ${top.n} × ${sub} = ${value}.`,
      items: draw(stack, { ret: { from: stack.length + 1, value: sub } }),
    });
  }
  stack.pop();
  frames.push({
    caption: `factorial(${N}) returns ${value} to main. The work happened on the way back up, and the stack was ${N + 1} frames tall at its highest: the memory of a recursion is its depth, O(n) here.`,
    items: draw(stack, { ret: { from: 1, value } }),
  });
  return finish({ title: "The call stack while factorial(4) runs", input: "factorial(4)", frames });
}

/* ── Recursion is induction ──────────────────────────────────────── */

/** The leap of faith as a ladder: the base case is right, and each step is right if the one below is — so every rung is. */
function induction(): Walkthrough {
  const N = 5;
  const H = 30;
  const GAP = 16;
  const BW = 200;
  const yOf = (k: number) => -k * (H + GAP);
  const fact = (k: number): number => (k === 0 ? 1 : k * fact(k - 1));
  const frames: Frame[] = [];

  const draw = (proved: number, current: number): Item[] => {
    const items: Item[] = [];
    for (let k = 0; k <= N; k++) {
      const text = k === 0 ? "f(0) = 1" : `f(${k}) = ${k} × f(${k - 1})${k <= proved ? ` = ${fact(k)}` : ""}`;
      items.push(box(`r${k}`, 0, yOf(k), text, { tone: k === current ? "accent" : k <= proved ? "strong" : "plain", w: BW, h: H, size: 12 }));
      if (k > 0) items.push(arrow(`s${k}`, { x: BW + 16, y: yOf(k - 1) + 4 }, { x: BW + 16, y: yOf(k) + H - 4 }, { tone: k <= proved ? "accent" : "faint", bow: -14 }));
    }
    items.push({ k: "text", id: "key", x: 0, y: yOf(N) - 16, text: "f(n) is factorial(n)", tone: "soft", anchor: "start", size: 11, mono: false });
    items.push({ k: "text", id: "lbl", x: BW + 34, y: yOf(N) + H / 2, text: "each step:", tone: "soft", anchor: "start", size: 11, weight: 600, mono: false });
    items.push({ k: "text", id: "lbl2", x: BW + 34, y: yOf(N) + H / 2 + 16, text: "if the rung below", tone: "soft", anchor: "start", size: 11, mono: false });
    items.push({ k: "text", id: "lbl3", x: BW + 34, y: yOf(N) + H / 2 + 32, text: "is right, so is this", tone: "soft", anchor: "start", size: 11, mono: false });
    return items;
  };

  frames.push({
    caption: "To trust a recursive function, check two things. The base case: factorial(0) returns 1, and 0! is 1 — true without any other call.",
    items: draw(0, 0),
  });
  for (let k = 1; k <= N; k++) {
    frames.push({
      caption:
        k === 1
          ? `The step, once: assume factorial(0) is right. Then factorial(1) returns 1 × factorial(0) = 1 × 1 = 1, which is 1!. You never trace inside the smaller call — you only use that it is right.`
          : `The same step again: factorial(${k - 1}) is right (${fact(k - 1)}), so factorial(${k}) returns ${k} × ${fact(k - 1)} = ${fact(k)}, which is ${k}!. ${k === N ? "Correctness climbs one rung at a time, to every n — this is proof by induction." : ""}`.trim(),
      items: draw(k, k),
    });
  }
  return finish({ title: "Why the leap of faith is safe: recursion is induction", input: "", frames });
}

/* ── Fibonacci's recursion tree ──────────────────────────────────── */

/** Naive fib(5) as a tree of calls, its repeated subtrees, and the much smaller tree memoisation leaves. */
function fibTree(): Walkthrough {
  const N = 5;
  type Node = { id: string; n: number; kids: string[]; hit?: boolean };
  const R = 17;
  const frames: Frame[] = [];

  // The naive tree: every call, in the order the calls are made; ids are paths so the memoised tree can reuse them.
  const naive = new Map<string, Node>();
  const order: string[] = [];
  const build = (n: number, id: string) => {
    const node: Node = { id, n, kids: [] };
    naive.set(id, node);
    order.push(id);
    if (n >= 2) {
      build(n - 1, `${id}L`);
      build(n - 2, `${id}R`);
      node.kids = [`${id}L`, `${id}R`];
    }
  };
  build(N, "r");
  // A call is repeated when an earlier call (in call order) already computed the same n.
  const firstFor = new Map<number, string>();
  const repeatRoot = new Set<string>();
  for (const id of order) {
    const n = naive.get(id)!.n;
    if (n >= 2 && firstFor.has(n)) repeatRoot.add(id);
    else if (!firstFor.has(n)) firstFor.set(n, id);
  }
  const inRepeat = (id: string) => [...repeatRoot].some((r) => id.startsWith(r));

  // The memoised run: the same calls, but a value already in the memo returns at once.
  const memoTree = new Map<string, Node>();
  const memo = new Map<number, number>();
  let memoCalls = 0;
  const run = (n: number, id: string): number => {
    memoCalls++;
    const node: Node = { id, n, kids: [] };
    memoTree.set(id, node);
    if (memo.has(n)) {
      node.hit = true;
      return memo.get(n)!;
    }
    let v: number;
    if (n < 2) v = n;
    else {
      v = run(n - 1, `${id}L`) + run(n - 2, `${id}R`);
      node.kids = [`${id}L`, `${id}R`];
    }
    memo.set(n, v);
    return v;
  };
  const answer = run(N, "r");

  const draw = (tree: Map<string, Node>, tone: (node: Node) => Tone, edgeTone: (child: Node) => LineTone, readout: string): Item[] => {
    const at = treeLayout<string>("r", (id) => tree.get(id)!.kids, { dx: 42, dy: 56 });
    const items: Item[] = [];
    for (const [id, p] of at) for (const c of tree.get(id)!.kids) items.push(link(`e${c}`, p, at.get(c)!, R, { tone: edgeTone(tree.get(c)!) }));
    for (const [id, p] of at) {
      const node = tree.get(id)!;
      items.push({ k: "node", id: `n${id}`, x: p.x, y: p.y, r: R, text: `f(${node.n})`, tone: tone(node), size: 11 });
    }
    items.push(note("calls", readout, -8, -36, { size: 12.5, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `fib(n) = fib(n − 1) + fib(n − 2) makes two calls per call, so the calls form a tree. fib(${N}) makes ${naive.size} calls — and the tree roughly multiplies by 1.6 every time n grows by one.`,
    items: draw(naive, (node) => (node.n < 2 ? "muted" : "plain"), () => "line", `naive fib(${N}): ${naive.size} calls`),
  });
  const wasted = [...naive.keys()].filter(inRepeat).length;
  const times = (k: number) => [...naive.values()].filter((x) => x.n === k).length;
  const word = (c: number) => (c === 2 ? "twice" : c === 3 ? "three times" : `${c} times`);
  // Calls naive fib(30) makes: calls(n) = calls(n − 1) + calls(n − 2) + 1, calls(0) = calls(1) = 1.
  const callsFor = (m: number) => {
    let a = 1;
    let b = 1;
    for (let k = 2; k <= m; k++) [a, b] = [b, a + b + 1];
    return m === 0 ? a : b;
  };
  frames.push({
    caption: `The shaded subtrees recompute values the tree has already found: fib(3) is computed ${word(times(3))} and fib(2) ${word(times(2))}. ${wasted} of the ${naive.size} calls are repeats; fib(30) makes ${callsFor(30).toLocaleString("en-GB")} calls for 31 different values.`,
    items: draw(naive, (node) => (inRepeat(node.id) ? "accent" : node.n < 2 ? "muted" : "plain"), (c) => (inRepeat(c.id) ? "accent" : "line"), `naive fib(${N}): ${naive.size} calls`),
  });
  frames.push({
    caption: `Memoised, the first fib(k) stores its value and every later call for it returns at once (strong). The repeated subtrees vanish: ${memoCalls} calls instead of ${naive.size}, and fib(${N}) = ${answer}. Linear, not exponential — the first step of dynamic programming.`,
    items: draw(memoTree, (node) => (node.hit ? "strong" : node.n < 2 ? "muted" : "plain"), () => "line", `memoised fib(${N}): ${memoCalls} calls`),
  });
  return finish({ title: "Fibonacci's recursion tree, and memoisation pruning it", input: `fib(${N})`, frames });
}

/* ── Compute the half once ───────────────────────────────────────── */

/** power(x, 8) with the half computed once (a chain) against power(x, n/2) × power(x, n/2) (a full tree). */
function powerTwice(): Walkthrough {
  const N = 8;
  const R = 12;
  // Once: one child per call.
  const chain: number[] = [];
  for (let n = N; ; n = Math.floor(n / 2)) {
    chain.push(n);
    if (n === 0) break;
  }
  // Twice: two children per call, until n = 0.
  type T = { id: string; n: number; kids: string[] };
  const tree = new Map<string, T>();
  const grow = (n: number, id: string) => {
    const t: T = { id, n, kids: [] };
    tree.set(id, t);
    if (n > 0) {
      grow(Math.floor(n / 2), `${id}a`);
      grow(Math.floor(n / 2), `${id}b`);
      t.kids = [`${id}a`, `${id}b`];
    }
  };
  grow(N, "t");
  const DY = 50;
  const TX = 100;
  const items: Item[] = [];
  chain.forEach((n, k) => {
    if (k > 0) items.push(link(`ce${k}`, { x: 0, y: (k - 1) * DY }, { x: 0, y: k * DY }, R, { tone: "accent" }));
  });
  chain.forEach((n, k) => items.push({ k: "node", id: `c${k}`, x: 0, y: k * DY, r: R, text: String(n), tone: "accent", size: 11 }));
  const at = treeLayout<string>("t", (id) => tree.get(id)!.kids, { dx: 24, dy: DY, x: TX });
  for (const [id, p] of at) for (const c of tree.get(id)!.kids) items.push(link(`te${c}`, p, at.get(c)!, R, { tone: "line" }));
  for (const [id, p] of at) items.push({ k: "node", id: `t${id}`, x: p.x, y: p.y, r: R, text: String(tree.get(id)!.n), tone: tree.get(id)!.n === 0 ? "muted" : "plain", size: 11 });
  const xs = [...at.values()].map((p) => p.x);
  const treeMid = (Math.min(...xs) + Math.max(...xs)) / 2;
  items.push(label("cl", "h = power(x, n/2), once", 0, -42, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
  items.push(label("cl2", `${chain.length} calls`, 0, -24, { anchor: "start", tone: "accent", size: 11.5 }));
  items.push(label("tl", "power(x, n/2) × power(x, n/2)", treeMid, -42, { tone: "error", size: 11.5, weight: 600 }));
  items.push(label("tl2", `${tree.size} calls`, treeMid, -24, { tone: "error", size: 11.5 }));
  return finish({
    title: "Compute the half once: a chain of calls, not a tree",
    input: `power(x, ${N}); each node is the n of one call`,
    frames: [
      {
        caption: `Storing the half and squaring it makes one call per level: ${chain.length} calls for n = ${N}, about log₂ n. Calling power(x, n/2) twice doubles the calls at every level while halving n — ${tree.size} calls, which is O(n) again, billions for n = 10⁹.`,
        items,
      },
    ],
  });
}

/* ── Every subset: the decision tree ─────────────────────────────── */

/** The include/exclude recursion over [1, 2, 3], one frame per subset printed, with the path that built it lit up. */
function subsetsTree(): Walkthrough {
  const nums = [1, 2, 3];
  const n = nums.length;
  const BW = 44;
  const BH = 24;
  type D = { id: string; set: number[]; depth: number; kids: string[] };
  const tree = new Map<string, D>();
  const leaves: string[] = [];
  const printed: number[][] = [];
  // Run the lesson's recursion: leave nums[i] out first, then put it in.
  const go = (i: number, current: number[], id: string) => {
    const d: D = { id, set: [...current], depth: i, kids: [] };
    tree.set(id, d);
    if (i === n) {
      leaves.push(id);
      printed.push([...current]);
      return;
    }
    d.kids = [`${id}0`, `${id}1`];
    go(i + 1, current, `${id}0`);
    current.push(nums[i]);
    go(i + 1, current, `${id}1`);
    current.pop();
  };
  go(0, [], "s");
  const at = treeLayout<string>("s", (id) => tree.get(id)!.kids, { dx: BW + 6, dy: 58 });
  const text = (d: D) => (d.set.length ? d.set.join(",") : "{ }");
  const frames: Frame[] = [];

  const draw = (path: Set<string>, done: Set<string>, current: string | null): Item[] => {
    const items: Item[] = [];
    for (const [id, p] of at)
      for (const c of tree.get(id)!.kids) {
        const q = at.get(c)!;
        const tone: LineTone = path.has(c) ? "accent" : "line";
        items.push({ k: "edge", id: `e${c}`, x1: p.x, y1: p.y + BH / 2, x2: q.x, y2: q.y - BH / 2, tone, dashed: c.endsWith("0") });
      }
    for (const [id, p] of at) {
      const d = tree.get(id)!;
      const tone: Tone = id === current ? "strong" : path.has(id) ? "accent" : done.has(id) ? "muted" : "plain";
      items.push(box(`n${id}`, p.x - BW / 2, p.y - BH / 2, text(d), { tone, w: BW, h: BH, size: 11.5 }));
    }
    const right = Math.max(...[...at.values()].map((p) => p.x)) + BW / 2 + 12;
    for (let i = 0; i < n; i++) items.push({ k: "text", id: `lv${i}`, x: right, y: i * 58 + 29, text: `decide ${nums[i]}`, tone: "faint", anchor: "start", size: 10.5, mono: false });
    items.push({ k: "text", id: "lg", x: right, y: n * 58, text: "leaves", tone: "faint", anchor: "start", size: 10.5, mono: false });
    return items;
  };

  frames.push({
    caption: `Each level decides one element: the dashed edge leaves it out, the solid edge puts it in. ${n} elements, ${n} levels, and 2 to the power ${n} = ${leaves.length} leaves — one per subset. No fixed number of loops could do this for any n.`,
    items: draw(new Set(), new Set(), null),
  });
  const done = new Set<string>();
  leaves.forEach((leaf, k) => {
    const path = new Set<string>();
    for (let i = 1; i <= leaf.length; i++) path.add(leaf.slice(0, i));
    const prevLeaf = k > 0 ? leaves[k - 1] : "";
    let common = 0;
    while (common < leaf.length && leaf[common] === prevLeaf[common]) common++;
    const undone = k > 0 ? prevLeaf.length - common : 0;
    frames.push({
      caption:
        k === 0
          ? `The first call goes down the "out" edges to a leaf: every element decided, nothing chosen, so it prints ${JSON.stringify(printed[k]).replace(/,/g, ", ")}. The stack is ${n + 1} calls deep — O(n) space.`
          : `Back up ${undone} level${undone === 1 ? "" : "s"}${k === 1 ? " (each return undoes its choice with a pop)" : ""}, then down the other edge: ${JSON.stringify(printed[k]).replace(/,/g, ", ")} is printed.${k === leaves.length - 1 ? ` All ${leaves.length} subsets, each exactly once: O(n × 2ⁿ) time.` : ""}`,
      items: draw(path, new Set(done), leaf),
    });
    for (const id of path) done.add(id);
  });
  return finish({ title: "Every subset: one recursive call per decision", input: `nums = [${nums.join(", ")}]`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "call-stack": callStack,
  induction,
  "fib-tree": fibTree,
  "power-twice": powerTwice,
  "subsets-tree": subsetsTree,
};
