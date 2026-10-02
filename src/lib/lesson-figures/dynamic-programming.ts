import { and, finish, link, note, row, rowLabel, slotMid, slotX, treeLayout, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, chart, label } from "./kit.js";

/**
 * Dynamic Programming: the lesson's figures (content/roadmap/dynamic-programming.md
 * places each with "@figure <name>"). The recursion tree that repeats
 * itself, what that costs, the table that answers each question once, why
 * a transition over the last choice is complete (climbing stairs' routes
 * split by their last move), and coin change filled cell by cell beside the
 * greedy rule it beats. House Robber is the hub's walkthrough.
 */

const fmt = (n: number) => n.toLocaleString("en-GB");
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
/** 1 → once, 2 → twice, 5 → five times. */
const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${WORDS[n] ?? n} times`);

/** Fibonacci numbers, F(0) = 0. */
function fibOf(k: number): number {
  let a = 0;
  let b = 1;
  for (let i = 0; i < k; i++) [a, b] = [b, a + b];
  return a;
}

/** The plain recursion for fib(5) as its call tree: the same questions asked again and again, then a memo that answers each once. */
function fibTree(): Walkthrough {
  const N = 5;
  type Call = { id: string; n: number; kids: string[]; parent: string | null };
  const calls: Call[] = [];
  const byId = new Map<string, Call>();
  const fib = (n: number, parent: string | null): number => {
    const c: Call = { id: `c${calls.length}`, n, kids: [], parent };
    calls.push(c);
    byId.set(c.id, c);
    if (parent) byId.get(parent)?.kids.push(c.id);
    return n < 2 ? n : fib(n - 1, c.id) + fib(n - 2, c.id);
  };
  const answer = fib(N, null);
  // The memoised run over the same tree: base cases return at once, a stored n is a lookup with nothing below it.
  const memo = new Set<number>();
  const kept = new Set<string>();
  const hits = new Set<string>();
  const run = (id: string) => {
    const c = byId.get(id) as Call;
    kept.add(id);
    if (c.n < 2) return;
    if (memo.has(c.n)) {
      hits.add(id);
      return;
    }
    c.kids.forEach(run);
    memo.add(c.n);
  };
  run("c0");
  const at = treeLayout<string>("c0", (k) => byId.get(k)?.kids ?? [], { dx: 40, dy: 54 });
  const R = 16;
  const count = (n: number) => calls.filter((c) => c.n === n).length;
  const distinct = new Set(calls.map((c) => c.n)).size;
  const bottom = Math.max(...[...at.values()].map((p) => p.y)) + R;

  const draw = (o: { hot?: number[]; memo?: boolean; readout: string }): Item[] => {
    const items: Item[] = [];
    const shown = (c: Call) => !o.memo || kept.has(c.id);
    for (const c of calls) if (c.parent && shown(c)) items.push(link(`e${c.id}`, at.get(c.parent) as { x: number; y: number }, at.get(c.id) as { x: number; y: number }, R));
    for (const c of calls) {
      if (!shown(c)) continue;
      const p = at.get(c.id) as { x: number; y: number };
      const tone: Tone = o.memo ? (hits.has(c.id) ? "muted" : c.id === "c0" ? "strong" : "plain") : o.hot?.includes(c.n) ? "accent" : "plain";
      items.push({ k: "node", id: `n${c.id}`, x: p.x, y: p.y, r: R, text: `f(${c.n})`, tone, size: 11 });
      if (o.memo && hits.has(c.id)) items.push(label(`h${c.id}`, "memo", p.x, p.y + R + 10, { size: 10.5, tone: "faint" }));
    }
    items.push(note("rd", o.readout, 0, bottom + 34, { size: 12, weight: 600 }));
    return items;
  };

  const frames: Frame[] = [
    {
      caption: `fib(${N}) calls fib(${N - 1}) and fib(${N - 2}), each of those calls two more, and so on down to fib(1) and fib(0): ${calls.length} calls to answer only ${distinct} different questions.`,
      items: draw({ readout: `calls: ${calls.length}, different questions: ${distinct}` }),
    },
    {
      caption: `fib(3) is worked out ${times(count(3))}, each time from scratch, with everything beneath it. Nothing remembers that the question was answered a moment ago.`,
      items: draw({ hot: [3], readout: `fib(3) asked ${count(3)} times` }),
    },
    {
      caption: `fib(2) is worked out ${times(count(2))}. These repeats are the overlapping subproblems: the same smaller question turns up in different branches of the tree.`,
      items: draw({ hot: [2], readout: `fib(2) asked ${count(2)} times` }),
    },
    {
      caption: `At the bottom, fib(1) is called ${times(count(1))} and fib(0) ${times(count(0))}. Every call that is not a base case makes two more, so the tree grows exponentially: about 1.6 times bigger for each step up in n.`,
      items: draw({ hot: [1, 0], readout: `fib(1) × ${count(1)}, fib(0) × ${count(0)}` }),
    },
    {
      caption: `With a memo, each answer is stored the first time it is worked out. A repeated question becomes a lookup with nothing beneath it: ${kept.size} calls instead of ${calls.length}, and fib(${N}) = ${answer} either way.`,
      items: draw({ memo: true, readout: `calls with a memo: ${kept.size} = 2n − 1` }),
    },
  ];
  return finish({ title: "The recursion tree of fib(5) asks the same questions again", input: `fib(${N})`, frames });
}

/** Calls made for fib(n): plain recursion against the memoised version. */
function callGrowth(): Walkthrough {
  const plain = (n: number) => 2 * fibOf(n + 1) - 1;
  const memoised = (n: number) => (n <= 1 ? 1 : 2 * n - 1);
  // The curve goes through Binet's formula, equal to F(k) at every whole k and smooth between.
  const PHI = (1 + Math.sqrt(5)) / 2;
  const plainSmooth = (x: number) => (2 * Math.pow(PHI, x + 1)) / Math.sqrt(5) - 1;
  const X = 15;
  const c = chart("c", { w: 380, h: 190, xMax: X, yMax: 2000, xLabel: "n", yLabel: "calls to compute fib(n)", xTicks: [0, 5, 10, 15], yTicks: [0, 500, 1000, 1500, 2000] });
  const items: Item[] = [
    ...c.items,
    c.curve("p", plainSmooth, { tone: "error", steps: 60 }),
    c.curve("m", (x) => Math.max(1, 2 * x - 1), { tone: "accent", steps: 30 }),
    label("pl", `plain recursion: ${fmt(plain(X))} calls at n = ${X}`, c.px(X) - 4, c.py(plain(X)) - 14, { anchor: "end", tone: "error", size: 11 }),
    label("ml", `memoised: ${memoised(X)} calls`, c.px(X), c.py(memoised(X)) - 14, { anchor: "end", tone: "accent", size: 11 }),
  ];
  return finish({
    title: "How many calls fib(n) makes",
    input: "",
    frames: [
      {
        caption: `Plain recursion makes 2 × F(n + 1) − 1 calls: ${fmt(plain(X))} at n = ${X} and ${fmt(plain(40))} at n = 40. With a memo it makes 2n − 1, a line along the floor: ${memoised(40)} calls at n = 40.`,
        items,
      },
    ],
  });
}

/** Tabulation: dp[0..7] filled left to right, each cell reading the two before it, then the two variables that replace the table. */
function fibTable(): Walkthrough {
  const N = 7;
  const dp: Array<number | null> = Array.from({ length: N + 1 }, () => null);
  const S = 38;
  const G = 10;
  const mid = (i: number) => slotMid(i, 0, S, G);
  const frames: Frame[] = [];

  const draw = (o: { i?: number; two?: boolean; readout: string }): Item[] => {
    const i = o.i;
    const items: Item[] = [rowLabel("dl", "dp", -12, 0, S)];
    items.push(
      ...row("d", dp.map((v) => v ?? ""), {
        size: S,
        gap: G,
        index: true,
        text: (k) => (dp[k] === null ? "" : String(dp[k])),
        tone: (k) => {
          if (o.two) return k >= N - 1 ? "strong" : "muted";
          if (k === i) return "strong";
          if (i !== undefined && (k === i - 1 || k === i - 2)) return "accent";
          return dp[k] === null ? "ghost" : "plain";
        },
      }),
    );
    if (i !== undefined && i >= 2) {
      items.push(arrow("a1", { x: mid(i - 1) + 4, y: -4 }, { x: mid(i) + 5, y: -4 }, { tone: "accent", bow: -12 }));
      items.push(arrow("a2", { x: mid(i - 2), y: -4 }, { x: mid(i) - 7, y: -5 }, { tone: "accent", bow: -32 }));
    }
    if (o.two) {
      items.push({ k: "ptr", id: "pv", x: mid(N - 1), y: -6, label: "prev", tone: "accent", up: false });
      items.push({ k: "ptr", id: "cu", x: mid(N), y: -6, label: "cur", tone: "accent", up: false });
    }
    items.push(note("rd", o.readout, 0, S + 48, { size: 12, weight: 600 }));
    return items;
  };

  dp[0] = 0;
  dp[1] = 1;
  frames.push({
    caption: "Tabulation drops the recursion. One cell per question, fib(0) to fib(7); the two base cases are written in first, because they need no other cell.",
    items: draw({ readout: "dp[0] = 0, dp[1] = 1" }),
  });
  for (let i = 2; i <= N; i++) {
    const a = dp[i - 1] as number;
    const b = dp[i - 2] as number;
    dp[i] = a + b;
    const why = [
      " Both cells it reads were filled earlier: left to right is the order that has every input ready before it is needed.",
      " Nothing is repeated: each cell is computed exactly once.",
      " The recursion would have asked for these inputs again; the table just reads them.",
      ` Each cell costs one addition: ${WORDS[i - 1]} so far.`,
      " One addition per cell makes the whole table O(n) time.",
      ` The table is full and the answer is the last cell: fib(${N}) = ${a + b}.`,
    ][i - 2];
    frames.push({
      caption: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${a} + ${b} = ${dp[i]}.${why}`,
      items: draw({ i, readout: `dp[${i}] = ${a} + ${b} = ${dp[i]}` }),
    });
  }
  frames.push({
    caption: `Each cell reads only the two before it, so everything further left is never read again. Two variables, prev and cur, can stand in for the whole table: O(1) space instead of O(n).`,
    items: draw({ two: true, readout: `prev = ${dp[N - 1]}, cur = ${dp[N]}` }),
  });
  return finish({ title: "Tabulation fills fib(0) to fib(7) from the bottom up", input: `n = ${N}`, frames });
}

/**
 * Why "add the last choices" is right: every route to step 4 ends with a
 * one-step or a two-step move, never both, and stripping that move leaves
 * exactly the routes to step 3 or to step 2.
 */
function lastMove(): Walkthrough {
  const TOP = 4;
  const routesTo = (n: number): number[][] => (n === 0 ? [[]] : [...routesTo(n - 1).map((r) => [...r, 1]), ...(n >= 2 ? routesTo(n - 2).map((r) => [...r, 2]) : [])]);
  const ways = [1, 1];
  for (let i = 2; i <= TOP; i++) ways.push(ways[i - 1] + ways[i - 2]);
  const all = routesTo(TOP).sort((a, b) => a.join("").localeCompare(b.join("")));
  const key = (r: number[]) => r.join("");
  const one = all.filter((r) => r[r.length - 1] === 1);
  const two = all.filter((r) => r[r.length - 1] === 2);
  const U = 38;
  const H = 28;
  const STEP = H + 8;
  const frames: Frame[] = [];

  const bar = (r: number[], y: number, o: { lastTone?: Tone; strip?: boolean }): Item[] => {
    const items: Item[] = [];
    let at = 0;
    r.forEach((s, j) => {
      const last = j === r.length - 1;
      const tone: Tone = last ? (o.strip ? "muted" : (o.lastTone ?? "plain")) : "plain";
      items.push({ k: "cell", id: `r${key(r)}s${j}`, x: at * U, y, w: s * U - 4, h: H, text: String(s), tone, size: 13 });
      at += s;
    });
    return items;
  };

  // Frame 1: every route, one under another.
  const f1: Item[] = [label("t", `every route to step ${TOP}, in steps of 1 or 2`, 0, -20, { anchor: "start", tone: "soft", weight: 600 })];
  all.forEach((r, i) => f1.push(...bar(r, i * STEP, {})));
  f1.push(note("rd", `ways[${TOP}] = ${all.length}`, 0, all.length * STEP + 22, { size: 12, weight: 600 }));
  frames.push({ caption: `There are ${all.length} ways to climb ${TOP} steps taking 1 or 2 at a time. Listing them works here, but the list grows about 1.6 times with every extra step, so listing cannot be how we count.`, items: f1 });

  // Groups by last move.
  const GAP = 34;
  const yTwo = one.length * STEP + GAP;
  const grouped = (strip: boolean): Item[] => {
    const items: Item[] = [
      label("ga", "last move: 1 step", 0, -20, { anchor: "start", tone: "accent", weight: 600 }),
      label("gb", "last move: 2 steps", 0, yTwo - 20, { anchor: "start", tone: "accent", weight: 600 }),
    ];
    one.forEach((r, i) => items.push(...bar(r, i * STEP, { lastTone: "accent", strip })));
    two.forEach((r, i) => items.push(...bar(r, yTwo + i * STEP, { lastTone: "accent", strip })));
    if (strip) {
      items.push(label("ca", `${one.length} routes to step ${TOP - 1} = ways[${TOP - 1}]`, TOP * U + 14, ((one.length - 1) * STEP) / 2 + H / 2, { anchor: "start", tone: "ink", size: 12 }));
      items.push(label("cb", `${two.length} routes to step ${TOP - 2} = ways[${TOP - 2}]`, TOP * U + 14, yTwo + ((two.length - 1) * STEP) / 2 + H / 2, { anchor: "start", tone: "ink", size: 12 }));
      items.push(note("rd", `ways[${TOP}] = ways[${TOP - 1}] + ways[${TOP - 2}] = ${ways[TOP - 1]} + ${ways[TOP - 2]} = ${ways[TOP]}`, 0, yTwo + two.length * STEP + 22, { size: 12, weight: 600 }));
    } else {
      items.push(note("rd", `${one.length} + ${two.length} = ${all.length}`, 0, yTwo + two.length * STEP + 22, { size: 12, weight: 600 }));
    }
    return items;
  };
  frames.push({
    caption: `Sort the routes by their last move. Every route ends with exactly one of the two moves, so the groups never overlap and nothing is left out: the total is the sum of the two groups.`,
    items: grouped(false),
  });
  frames.push({
    caption: `Strip the last move. What is left in the top group is every route to step ${TOP - 1}, and in the bottom group every route to step ${TOP - 2}: questions already answered, so ways[i] = ways[i − 1] + ways[i − 2].`,
    items: grouped(true),
  });
  return finish({ title: "Why the climbing-stairs transition adds two smaller answers", input: `n = ${TOP}, steps of 1 or 2`, frames });
}

/** Coin change, coins 1, 3, 4 and amount 6: each cell tries every last coin, then the walk back, then greedy's three coins. */
function coinTable(): Walkthrough {
  const coins = [1, 3, 4];
  const amount = 6;
  const INF = amount + 1;
  const dp: Array<number | null> = Array.from({ length: amount + 1 }, () => null);
  const S = 40;
  const G = 12;
  const mid = (i: number) => slotMid(i, 0, S, G);
  // Each coin's arc lands on its own spot along the cell's top edge, so three arcs into one cell stay apart.
  const land = (a: number, k: number) => slotX(a, 0, S, G) + 6 + k * 14;
  const frames: Frame[] = [];

  type Arc = { from: number; to: number; coin: number; tone: "accent" | "line" | "error"; below?: boolean; walk?: boolean };
  const draw = (o: { a?: number; arcs?: Arc[]; hot?: number[]; best?: number[]; readout: string; readout2?: string }): Item[] => {
    const items: Item[] = [rowLabel("dl", "dp", -12, 0, S)];
    items.push(
      ...row("d", dp.map((v) => v ?? ""), {
        size: S,
        gap: G,
        index: true,
        text: (k) => (dp[k] === null ? "" : dp[k] === INF ? "∞" : String(dp[k])),
        tone: (k) => (o.best?.includes(k) ? "strong" : k === o.a ? "strong" : o.hot?.includes(k) ? "accent" : dp[k] === null ? "ghost" : "plain"),
      }),
    );
    for (const arc of o.arcs ?? []) {
      const k = coins.indexOf(arc.coin);
      const chord = (arc.to - arc.from) * (S + G);
      // Longer arcs rise higher, so the three arcs into one cell (and their +c labels) never sit on each other.
      if (arc.below) items.push(arrow(`g${arc.from}-${arc.to}`, { x: mid(arc.from), y: S + 24 }, { x: land(arc.to, k), y: S + 24 }, { tone: arc.tone, bow: 10 + chord * 0.15, label: `+${arc.coin}` }));
      else items.push(arrow(arc.walk ? `w${arc.from}` : `c${arc.coin}`, { x: mid(arc.from), y: -4 }, { x: land(arc.to, k), y: -4 }, { tone: arc.tone, bow: -(10 + chord * 0.3), label: `+${arc.coin}` }));
    }
    const low = o.readout2 ? S + 80 : S + 46;
    items.push(note("rd", o.readout, 0, low, { size: 12, weight: 600 }));
    if (o.readout2) items.push(note("rd2", o.readout2, 0, low + 22, { size: 12, weight: 600, tone: "error" }));
    return items;
  };
  const or = (xs: readonly (string | number)[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}` : String(xs[0]));

  dp[0] = 0;
  frames.push({
    caption: `dp[a] is the fewest coins that make amount a exactly, and dp[0] = 0 needs no coin. Every other cell tries each coin c as the last one: an arc from a − c, labelled +c, adds that coin to the best for what is left.`,
    items: draw({ a: 0, readout: "dp[0] = 0" }),
  });
  for (let a = 1; a <= amount; a++) {
    const usable = coins.filter((c) => c <= a);
    const options = usable.map((c) => (dp[a - c] as number) + 1);
    const bestVal = Math.min(...options);
    dp[a] = bestVal;
    const winner = usable[options.indexOf(bestVal)];
    const arcs: Arc[] = usable.map((c) => ({ from: a - c, to: a, coin: c, tone: c === winner ? "accent" : "line" }));
    const list = usable.map((c) => `dp[${a - c}]`).join(", ");
    const vals = usable.map((c) => dp[a - c]).join(", ");
    const readout = usable.length > 1 ? `dp[${a}] = 1 + min(${list}) = 1 + min(${vals}) = ${bestVal}` : `dp[${a}] = 1 + dp[${a - usable[0]}] = ${bestVal}`;
    const caption =
      usable.length === 1
        ? `Amount ${a}: only coin 1 fits, so the last coin is a 1 on top of the best for amount ${a - 1}: dp[${a}] = ${dp[a - 1]} + 1 = ${bestVal}.`
        : `Amount ${a}: the last coin could be ${or(usable)}. On top of the best for ${and(usable.map((c) => String(a - c)))} they make ${and(options.map(String))} coins; the fewest is ${bestVal}${a === amount ? ", the answer" : ""}.`;
    frames.push({ caption, items: draw({ a, arcs, hot: usable.map((c) => a - c), readout }) });
  }
  // Walk back: a coin c with dp[a − c] = dp[a] − 1 is a valid last coin.
  const used: number[] = [];
  const path: number[] = [amount];
  for (let a = amount; a > 0; ) {
    const c = coins.find((x) => x <= a && dp[a - x] === (dp[a] as number) - 1) as number;
    used.push(c);
    a -= c;
    path.push(a);
  }
  const walkArcs: Arc[] = used.map((c, i) => ({ from: path[i + 1], to: path[i], coin: c, tone: "accent", walk: true }));
  frames.push({
    caption: `To find which coins, walk back: at ${amount}, a coin c is a valid last coin when dp[${amount} − c] = dp[${amount}] − 1. Coin ${used[0]} works, and repeating from ${path[1]} gives ${used.join(" + ")} = ${amount}.`,
    items: draw({ arcs: walkArcs, best: path, readout: `${amount} = ${used.join(" + ")}: ${used.length} coins` }),
  });
  // Greedy: largest coin that fits, never reconsidered.
  const greedy: number[] = [];
  const gPath = [amount];
  for (let left = amount, i = coins.length - 1; i >= 0; i--) {
    while (coins[i] <= left) {
      greedy.push(coins[i]);
      left -= coins[i];
      gPath.push(left);
    }
  }
  const gArcs: Arc[] = greedy.map((c, i) => ({ from: gPath[i + 1], to: gPath[i], coin: c, tone: "error", below: true }));
  frames.push({
    caption: `Greedy takes the largest coin that fits, ${greedy.join(", then ")}: ${greedy.length} coins. Its first choice looked best and was wrong. The table compared every last coin against exact answers and never committed to one.`,
    items: draw({ arcs: [...walkArcs, ...gArcs], best: path, readout: `table: ${used.join(" + ")} (${used.length} coins)`, readout2: `largest coin first: ${greedy.join(" + ")} (${greedy.length} coins)` }),
  });
  return finish({ title: "Fewest coins for every amount up to 6", input: `coins = [${coins.join(", ")}], amount = ${amount}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "fib-tree": fibTree,
  "call-growth": callGrowth,
  "fib-table": fibTable,
  "last-move": lastMove,
  "coin-table": coinTable,
};
