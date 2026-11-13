import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { binaryTree, box, label } from "../../lesson-figures/kit.js";

/**
 * Segment trees and Fenwick trees (competitive-programming track, module 10).
 *
 *  - segment-tree: a sum tree over A, built by combining children; a point
 *    update a[3] = 9 climbs leaf → root one node per frame, then a query for
 *    [1, 6] runs the real recursion and shows the partial nodes it visits and
 *    the whole nodes it collects.
 *  - fenwick: the same array as a Fenwick tree, each cell drawn as the bar of
 *    positions it covers (i & -i of them, ending at i); add(3, +7) climbs with
 *    i += i & -i and sum(7) descends with i -= i & -i, values from the tree.
 */

const A = [5, 3, 7, 2, 6, 1, 4, 8];
const N = A.length;

/* ── Segment tree ─────────────────────────────────────────── */

/** Heap-indexed sum tree: t[1] the root, t[v]'s children 2v and 2v + 1, leaves t[N..2N-1] (N is a power of two). */
function build(a: readonly number[]): number[] {
  const t = new Array<number>(2 * N).fill(0);
  a.forEach((x, i) => (t[N + i] = x));
  for (let v = N - 1; v >= 1; v--) t[v] = t[2 * v]! + t[2 * v + 1]!;
  return t;
}
const rangeOf = (v: number): [number, number] => {
  let lo = v;
  let hi = v;
  while (lo < N) {
    lo = 2 * lo;
    hi = 2 * hi + 1;
  }
  return [lo - N, hi - N];
};
const rangeText = (v: number) => {
  const [lo, hi] = rangeOf(v);
  return lo === hi ? `[${lo}]` : `[${lo}..${hi}]`;
};

/** The recursive query, recording what it visits: partial nodes split, whole nodes are taken. */
function query(t: readonly number[], l: number, r: number) {
  const partial: number[] = [];
  const whole: number[] = [];
  const go = (v: number): number => {
    const [lo, hi] = rangeOf(v);
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) {
      whole.push(v);
      return t[v]!;
    }
    partial.push(v);
    return go(2 * v) + go(2 * v + 1);
  };
  return { sum: go(1), partial, whole };
}

function segmentTree(): Walkthrough {
  const POS = 3;
  const VAL = 9;
  const before = build(A);
  const after = build(A.map((x, i) => (i === POS ? VAL : x)));
  const path: number[] = [];
  for (let v = N + POS; v >= 1; v >>= 1) path.push(v);
  const Q: [number, number] = [1, 6];
  const q = query(after, Q[0], Q[1]);
  const brute = A.map((x, i) => (i === POS ? VAL : x)).slice(Q[0], Q[1] + 1).reduce((s, x) => s + x, 0);
  if (q.sum !== brute) throw new Error(`segment tree query ${q.sum} != ${brute}`);

  const draw = (t: readonly number[], tone: (v: number) => Tone, extra: Item[] = []): Item[] => {
    const level = t.slice(1, 2 * N);
    const tree = binaryTree("s", level, { dx: 50, dy: 62, r: 18, tone: (i) => tone(i + 1) });
    const items = [...tree.items];
    for (let i = 0; i < N; i++) {
      const p = tree.pos.get(N - 1 + i)!;
      items.push(label(`si${i}`, `a${i}`, p.x, p.y + 32, { tone: "faint", size: 11, mono: true }));
    }
    return [...items, ...extra];
  };
  const readout = (text: string): Item => ({ k: "text", id: "readout", x: 0, y: -30, text, tone: "accent", anchor: "start", size: 13, mono: true, weight: 600 });

  const frames = [
    {
      caption: `Each node stores the sum of its range. The leaves are a = [${A.join(", ")}]; each parent adds its two children, and the root holds ${before[1]}, the whole array.`,
      items: draw(before, (v) => (v === 1 ? "strong" : "plain"), [readout(`root = sum a0..a7 = ${before[1]}`)]),
    },
    ...path.map((v, k) => {
      const done = new Set(path.slice(0, k + 1));
      const t = after.map((x, u) => (done.has(u) ? x : before[u]!));
      const caption =
        k === 0
          ? `Point update a${POS} = ${VAL}: the leaf changes from ${A[POS]} to ${VAL}. Only its ancestors cover position ${POS}, one per level.`
          : `Recompute node ${rangeText(v)} from its children: ${t[2 * v]} + ${t[2 * v + 1]} = ${t[v]}.${v === 1 ? ` ${path.length} nodes changed in all — O(log n).` : ""}`;
      return { caption, items: draw(t, (u) => (u === v ? "accent" : done.has(u) ? "strong" : "plain"), [readout(`update: ${path.length} nodes, leaf to root`)]) };
    }),
    {
      caption: `Query sum of a${Q[0]}..a${Q[1]}. The recursion splits the nodes that are only partly inside — ${q.partial.map(rangeText).join(", ")} — and stops at nodes fully inside or fully outside.`,
      items: draw(after, (u) => (q.partial.includes(u) ? "accent" : "plain"), [readout(`query [${Q[0]}, ${Q[1]}]: split ${q.partial.length} nodes`)]),
    },
    {
      caption: `The whole nodes it collects tile the range exactly: ${q.whole.map((v) => `${rangeText(v)} = ${after[v]}`).join(", ")}. Their sum is ${q.sum}, from ${q.whole.length} nodes instead of ${Q[1] - Q[0] + 1} leaves.`,
      items: draw(after, (u) => (q.whole.includes(u) ? "strong" : q.partial.includes(u) ? "accent" : "muted"), [readout(`sum = ${q.whole.map((v) => after[v]).join(" + ")} = ${q.sum}`)]),
    },
  ];
  return finish({ title: "A segment tree: a point update climbs, a range query collects", input: `a = [${A.join(", ")}]`, frames });
}

/* ── Fenwick tree ─────────────────────────────────────────── */

const lowbit = (i: number) => i & -i;

function fenwick(): Walkthrough {
  // 1-indexed: f[i] = a[i - lowbit(i) + 1 .. i].
  const f = new Array<number>(N + 1).fill(0);
  const add = (i: number, x: number, trace?: number[]) => {
    for (; i <= N; i += lowbit(i)) {
      trace?.push(i);
      f[i] += x;
    }
  };
  A.forEach((x, i) => add(i + 1, x));
  const before = f.slice();
  const ADD_AT = 3;
  const ADD = 7;
  const climb: number[] = [];
  add(ADD_AT, ADD, climb);
  const after = f.slice();
  const SUM_TO = 7;
  const descent: number[] = [];
  let total = 0;
  for (let i = SUM_TO; i > 0; i -= lowbit(i)) {
    descent.push(i);
    total += after[i]!;
  }
  const brute = A.map((x, i) => (i + 1 === ADD_AT ? x + ADD : x)).slice(0, SUM_TO).reduce((s, x) => s + x, 0);
  if (total !== brute) throw new Error(`fenwick sum ${total} != ${brute}`);

  const W = 52;
  const G = 6;
  const BH = 30;
  const levelOf = (i: number) => Math.log2(lowbit(i));
  const TOP = 3; // log2(8)
  const x = (pos: number) => (pos - 1) * (W + G);
  const draw = (vals: readonly number[], tone: (i: number) => Tone, read: string): Item[] => {
    const items: Item[] = [];
    for (let i = 1; i <= N; i++) {
      const lb = lowbit(i);
      const y = (TOP - levelOf(i)) * (BH + 10);
      const w = lb * (W + G) - G;
      items.push(box(`f${i}`, x(i - lb + 1), y, lb === 1 ? vals[i]! : `f${i} = ${vals[i]}`, { tone: tone(i), w, h: BH, size: 12 }));
    }
    const ay = (TOP + 1) * (BH + 10) + 8;
    for (let p = 1; p <= N; p++) {
      items.push(label(`p${p}`, String(p), x(p) + W / 2, ay, { tone: "soft", size: 12, mono: true, weight: 600 }));
      items.push(label(`b${p}`, p.toString(2).padStart(4, "0"), x(p) + W / 2, ay + 16, { tone: "faint", size: 10, mono: true }));
    }
    items.push({ k: "text", id: "readout", x: 0, y: ay + 40, text: read, tone: "accent", anchor: "start", size: 13, mono: true, weight: 600 });
    return items;
  };

  const frames = [
    {
      caption: `Each cell i covers the i & -i positions ending at i: cell 6 (110 in binary) covers 5..6, cell 8 covers 1..8. Odd cells hold one value; the bars are the tree.`,
      items: draw(before, () => "plain", "f[i] = a[i - (i & -i) + 1 .. i]"),
    },
    ...climb.map((i, k) => {
      const done = new Set(climb.slice(0, k + 1));
      const vals = before.map((v, j) => (done.has(j) ? after[j]! : v));
      const next = i + lowbit(i);
      return {
        caption: `add(${ADD_AT}, +${ADD}) at i = ${i}: f${i} becomes ${before[i]} + ${ADD} = ${after[i]}. Then i += i & -i = ${lowbit(i)} gives ${next}${next > N ? `, past n = ${N}: done after ${climb.length} cells` : ""}.`,
        items: draw(vals, (j) => (j === i ? "accent" : done.has(j) ? "strong" : "plain"), `climb: i += i & -i  →  ${climb.slice(0, k + 1).join(" → ")}`),
      };
    }),
    ...descent.map((i, k) => {
      const got = descent.slice(0, k + 1);
      const next = i - lowbit(i);
      return {
        caption: `sum(${SUM_TO}) at i = ${i}: take f${i} = ${after[i]}, which covers ${i - lowbit(i) + 1 === i ? `position ${i}` : `${i - lowbit(i) + 1}..${i}`}. Then i -= i & -i gives ${next}${next === 0 ? `: the cells tile 1..${SUM_TO} and the prefix sum is ${total}` : ""}.`,
        items: draw(after, (j) => (j === i ? "accent" : got.includes(j) ? "strong" : "muted"), `sum(${SUM_TO}) = ${got.map((j) => after[j]).join(" + ")}${next === 0 ? ` = ${total}` : " + …"}`),
      };
    }),
  ];
  return finish({ title: "A Fenwick tree: add climbs with i += i & -i, sum descends with i -= i & -i", input: `a = [${A.join(", ")}] (positions 1..8)`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "segment-tree": segmentTree,
  fenwick,
};
