import { and, finish, link, note, rowLabel, show, slotMid, slotX, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Heaps and Priority Queues: the lesson's figures
 * (content/roadmap/heap.md places each with "@figure <name>").
 *
 * A heap is an array read as a tree, so most figures draw both: the tree
 * on top, the array under it, a value keeping its id (`n7` in the tree,
 * `a7` in the array) so a swap glides in both at once. Every generator runs
 * the real sift-up, sift-down, heapify or library-style pattern on its
 * example and records what it did.
 */

const R = 17;
const S = 40;
const G = 6;

/** Centre of heap index i: depth d holds 2ᵈ slots across `width`. */
function heapPos(i: number, width: number, level: number, x0 = 0, y0 = 0): { x: number; y: number } {
  const d = Math.floor(Math.log2(i + 1));
  const p = i - (2 ** d - 1);
  return { x: x0 + (p + 0.5) * (width / 2 ** d), y: y0 + d * level };
}

const parent = (i: number) => (i - 1) >> 1;
const kidsOf = (i: number, n: number) => [2 * i + 1, 2 * i + 2].filter((c) => c < n);

/** The tree part of a heap array: edges by child index, nodes by value. */
function heapTree(a: readonly number[], o: { width: number; level: number; x0?: number; y0?: number; tone?: (i: number) => Tone; edge?: (child: number) => "line" | "accent" | "error"; r?: number; size?: number; prefix?: string }): Item[] {
  const r = o.r ?? R;
  const p = o.prefix ?? "";
  const at = (i: number) => heapPos(i, o.width, o.level, o.x0, o.y0);
  const items: Item[] = [];
  for (let i = 1; i < a.length; i++) items.push(link(`${p}e${i}`, at(parent(i)), at(i), r, { tone: o.edge?.(i) ?? "line" }));
  a.forEach((v, i) => {
    const it: Item = { k: "node", id: `${p}n${v}`, x: at(i).x, y: at(i).y, r, text: String(v), tone: o.tone?.(i) ?? "plain" };
    items.push(o.size ? { ...it, size: o.size } : it);
  });
  return items;
}

/** The array part: one cell per value (id by value) with its index under it. */
function heapArray(a: readonly number[], o: { y: number; x0?: number; tone?: (i: number) => Tone; label?: string; slots?: number }): Item[] {
  const x0 = o.x0 ?? 0;
  const items: Item[] = [];
  if (o.label) items.push(rowLabel("al", o.label, x0 - 10, o.y, S));
  a.forEach((v, i) => items.push(box(`a${v}`, slotX(i, x0, S, G), o.y, v, { tone: o.tone?.(i) ?? "plain" })));
  for (let i = 0; i < (o.slots ?? a.length); i++) items.push(note(`ix${i}`, String(i), slotMid(i, x0, S, G), o.y + S + 11, { anchor: "middle", tone: "faint", size: 10 }));
  return items;
}

/* ── How a heap is stored ─────────────────────────────────────────── */

function storage(): Walkthrough {
  const heap = [2, 5, 3, 7, 9, 6, 8];
  const n = heap.length;
  for (let i = 1; i < n; i++) if (heap[parent(i)] > heap[i]) throw new Error("storage: not a min-heap");
  const WIDTH = n * (S + G) - G;
  const LEVEL = 60;
  const AY = 2 * LEVEL + R + 44;
  const at = (i: number) => heapPos(i, WIDTH, LEVEL);
  // Each index sits on the side away from the edge up to its parent: left children on the left, right children (and the root) on the right.
  const index = (i: number): Item => (i % 2 === 1 ? label(`ti${i}`, String(i), at(i).x - R - 5, at(i).y - R + 2, { anchor: "end", tone: "faint", size: 10.5, mono: true }) : label(`ti${i}`, String(i), at(i).x + R + 5, at(i).y - R + 2, { anchor: "start", tone: "faint", size: 10.5, mono: true }));

  const draw = (o: { hot: number[]; edges: number[]; arcs: Item[]; lines: string[] }): Item[] => {
    const hot = new Set(o.hot);
    const tone = (i: number): Tone => (hot.has(i) ? "accent" : "plain");
    const items = heapTree(heap, { width: WIDTH, level: LEVEL, tone, edge: (c) => (o.edges.includes(c) ? "accent" : "line") });
    heap.forEach((_, i) => items.push(index(i)));
    items.push(...heapArray(heap, { y: AY, tone, label: "array" }));
    items.push(...o.arcs);
    o.lines.forEach((t, k) => items.push(note(`l${k}`, t, 0, AY + S + 50 + k * 20, { tone: k ? "soft" : "ink", size: 12.5, weight: k ? undefined : 600 })));
    return items;
  };

  const I = 1;
  const [c1, c2] = kidsOf(I, n);
  const J = 5;
  const P = parent(J);
  // Which root-to-leaf path to show non-decreasing: the one through the larger child each time.
  const path = [0];
  while (kidsOf(path[path.length - 1], n).length) {
    const ks = kidsOf(path[path.length - 1], n);
    path.push(ks.reduce((m, c) => (heap[c] > heap[m] ? c : m)));
  }
  const sib = [1, 2];
  return finish({
    title: "A heap is an array read as a tree",
    input: `heap = ${show(heap)}`,
    frames: [
      {
        caption: `Number the nodes level by level, left to right, and the tree fits an array with no gaps and no pointers. The children of index ${I} (value ${heap[I]}) sit at 2·${I} + 1 = ${c1} and 2·${I} + 2 = ${c2}: values ${heap[c1]} and ${heap[c2]}.`,
        items: draw({
          hot: [I, c1, c2],
          edges: [c1, c2],
          arcs: [
            arrow("u1", { x: slotMid(I, 0, S, G) + 10, y: AY - 4 }, { x: slotMid(c1, 0, S, G), y: AY - 4 }, { tone: "accent", bow: -16 }),
            arrow("u2", { x: slotMid(I, 0, S, G) - 10, y: AY - 4 }, { x: slotMid(c2, 0, S, G), y: AY - 4 }, { tone: "accent", bow: -40 }),
          ],
          lines: [`children of ${I}: ${2 * I + 1} and ${2 * I + 2}`, "children of i: 2i + 1 and 2i + 2"],
        }),
      },
      {
        caption: `Going up is the same arithmetic backwards: the parent of index ${J} (value ${heap[J]}) is (${J} − 1) / 2 = ${P}, rounded down, holding ${heap[P]}. Every move between parent and child is one calculation.`,
        items: draw({
          hot: [J, P],
          edges: [J],
          arcs: [arrow("d1", { x: slotMid(J, 0, S, G), y: AY - 4 }, { x: slotMid(P, 0, S, G) + 4, y: AY - 4 }, { tone: "accent", bow: 26 })],
          lines: [`parent of ${J}: (${J} − 1) / 2 = ${P}`, "parent of i: (i − 1) / 2, rounded down"],
        }),
      },
      {
        caption: `The heap rule orders only parents against children, so every path down never decreases — ${path.map((i) => heap[i]).join(" ≤ ")} — and the root is the minimum. Siblings are not ordered: ${heap[sib[0]]} comes before ${heap[sib[1]]}, so the array is not sorted, and keeping less order is what makes a heap cheap.`,
        items: draw({ hot: path, edges: path.slice(1), arcs: [], lines: [`a path down: ${path.map((i) => heap[i]).join(" ≤ ")}`, `siblings: ${heap[sib[0]]} before ${heap[sib[1]]}, in no order`] }),
      },
    ],
  });
}

/* ── Why sift-down swaps with the smaller child ───────────────────── */

function smallerChild(): Walkthrough {
  // The heap from the hub's figure after push(4); pop() has just moved the last value, 7, into the root.
  const start = [7, 4, 3, 5, 9, 6, 8];
  const n = start.length;
  const WIDTH = n * (S + G) - G;
  const LEVEL = 60;
  const AY = 2 * LEVEL + R + 40;
  const draw = (a: number[], o: { hot: number[]; bad?: number; bad2?: number }): Item[] => {
    const hot = new Set(o.hot);
    const tone = (i: number): Tone => (i === o.bad ? "error" : hot.has(i) ? "accent" : "plain");
    const items = heapTree(a, { width: WIDTH, level: LEVEL, tone, edge: (c) => (c === o.bad2 ? "error" : hot.has(c) && hot.has(parent(c)) ? "accent" : "line") });
    items.push(...heapArray(a, { y: AY, tone, label: "array" }));
    return items;
  };
  const [l, r] = kidsOf(0, n);
  const small = start[l] < start[r] ? l : r;
  const large = small === l ? r : l;
  const wrong = [...start];
  [wrong[0], wrong[large]] = [wrong[large], wrong[0]];
  const right = [...start];
  [right[0], right[small]] = [right[small], right[0]];
  if (!(wrong[0] > wrong[small])) throw new Error("smaller-child: the wrong swap should break the rule");
  const below = kidsOf(small, n).map((c) => right[c]);
  const stillBad = below.some((v) => v < right[small]);
  return finish({
    title: "Why sift-down swaps with the smaller child",
    input: `heap after pop() moved the last value to the root: ${show(start)}`,
    frames: [
      {
        caption: `After a pop, the last value, ${start[0]}, sits in the root, and it is larger than both of its children, ${start[l]} and ${start[r]}. It must swap with one of them — but which one?`,
        items: draw(start, { hot: [0, l, r] }),
      },
      {
        caption: `Swap with the larger child, ${start[large]}, and ${start[large]} becomes the parent of ${start[small]}. ${wrong[0]} > ${wrong[small]} breaks the heap rule at the root, so this swap is wrong.`,
        items: draw(wrong, { hot: [], bad: 0, bad2: small }),
      },
      {
        caption: `Swap with the smaller child, ${start[small]}: it is no larger than its old sibling ${start[large]}, so the rule holds at the root. Only ${right[small]}, now at index ${small}, can still be out of place${stillBad ? `, above ${and(below.map(String))}, so sift-down carries on there` : ""}.`,
        items: draw(right, { hot: [0, small, ...(stillBad ? kidsOf(small, n) : [])] }),
      },
    ],
  });
}

/* ── Why heapify is O(n) ──────────────────────────────────────────── */

const commas = (k: number) => String(k).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function heapifyCost(): Walkthrough {
  const H = 3;
  const n = 2 ** (H + 1) - 1;
  const r = 11;
  const W = 8 * 28;
  const LEVEL = 40;
  const depth = (i: number) => Math.floor(Math.log2(i + 1));
  const heightOf = (i: number) => H - depth(i);
  const sumUp = Array.from({ length: n }, (_, i) => heightOf(i)).reduce((a, b) => a + b, 0);
  const sumDown = Array.from({ length: n }, (_, i) => depth(i)).reduce((a, b) => a + b, 0);
  // The same sums for a perfect tree of 20 levels, about a million nodes.
  const BIG = 19;
  let bigUp = 0;
  let bigDown = 0;
  for (let d = 0; d <= BIG; d++) {
    bigUp += 2 ** d * (BIG - d);
    bigDown += 2 ** d * d;
  }
  const items: Item[] = [];
  const panel = (prefix: string, x0: number, cost: (i: number) => number, tone: (i: number) => Tone, title: string, total: number) => {
    const vals = Array.from({ length: n }, (_, i) => cost(i));
    // Ids by position: the numbers here are costs, not values, and repeat.
    for (let i = 1; i < n; i++) items.push(link(`${prefix}e${i}`, heapPos(parent(i), W, LEVEL, x0, 28), heapPos(i, W, LEVEL, x0, 28), r));
    vals.forEach((c, i) => {
      const p = heapPos(i, W, LEVEL, x0, 28);
      items.push({ k: "node", id: `${prefix}n${i}`, x: p.x, y: p.y, r, text: String(c), tone: tone(i), size: 11 });
    });
    items.push(label(`${prefix}t`, title, x0 + W / 2, 0, { tone: "ink", size: 12, weight: 600 }));
    items.push(label(`${prefix}s`, `at most ${total} swaps in all`, x0 + W / 2, 28 + H * LEVEL + r + 18, { tone: tone(n - 1) === "muted" ? "accent" : "soft", size: 11.5, weight: 600 }));
  };
  panel("u", 0, heightOf, (i) => (heightOf(i) === 0 ? "muted" : "plain"), "heapify: sink ≤ height", sumUp);
  panel("d", W + 50, depth, (i) => (depth(i) === H ? "accent" : "plain"), "n pushes: climb ≤ depth", sumDown);
  items.push(label("lg", "each number: the most swaps that node can make", W + 25, 28 + H * LEVEL + r + 42, { tone: "faint", size: 11 }));
  return finish({
    title: "Building a heap: heapify against one push at a time",
    input: "",
    frames: [
      {
        caption: `Heapify sinks each node at most its height, and half the nodes are leaves that never move: ${sumUp} swaps at most for ${n} nodes. Pushing one at a time lets the bottom row climb the whole tree: ${sumDown}. For about a million nodes, ${commas(bigUp)} against ${commas(bigDown)} — O(n) against O(n log n).`,
        items,
      },
    ],
  });
}

/* ── Heap sort ────────────────────────────────────────────────────── */

function heapSort(): Walkthrough {
  const input = [4, 10, 3, 5, 1, 8];
  const a = [...input];
  const n = a.length;
  const WIDTH = n * (S + G) - G;
  const LEVEL = 56;
  const AY = 2 * LEVEL + R + 40;
  const frames: Frame[] = [];
  let end = n;

  const draw = (o: { hot?: number[]; final?: boolean; label?: string }): Item[] => {
    const hot = new Set(o.hot ?? []);
    const heapPart = a.slice(0, end);
    const items = heapTree(heapPart, { width: WIDTH, level: LEVEL, tone: (i) => (hot.has(i) ? "accent" : "plain"), edge: (c) => (hot.has(c) && hot.has(parent(c)) ? "accent" : "line") });
    items.push(...heapArray(a, { y: AY, label: "array", tone: (i) => (i >= end || o.final ? "strong" : hot.has(i) ? "accent" : "plain") }));
    if (end > 0 && !o.final) items.push({ k: "span", id: "sh", x1: slotX(0, 0, S, G) + 2, x2: slotX(end - 1, 0, S, G) + S - 2, y: AY + S + 22, label: "max-heap", tone: "accent", down: true });
    if (end < n) items.push({ k: "span", id: "ss", x1: slotX(end, 0, S, G) + 2, x2: slotX(n - 1, 0, S, G) + S - 2, y: AY + S + 22, label: "sorted", tone: "ink", down: true });
    return items;
  };

  /** Sift a[i] down within a[0 .. size − 1] (max-heap); returns the indices it passed through. */
  const siftDown = (i: number, size: number): number[] => {
    const trail = [i];
    for (;;) {
      let big = i;
      for (const c of kidsOf(i, size)) if (a[c] > a[big]) big = c;
      if (big === i) return trail;
      [a[i], a[big]] = [a[big], a[i]];
      i = big;
      trail.push(i);
    }
  };

  frames.push({ caption: `The unsorted array, read as a tree. Heap sort first turns it into a max-heap in place: sift down every node that has children, from the last one, index ${Math.floor(n / 2) - 1}, back to the root.`, items: draw({}) });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    const v = a[i];
    const kids = kidsOf(i, n).map((c) => a[c]);
    const trail = siftDown(i, n);
    const moves = trail.length - 1;
    frames.push({
      caption: moves === 0 ? `Index ${i}: ${v} is already larger than its children ${and(kids.map(String))}, so it stays.` : `Index ${i}: ${v} is smaller than its larger child, ${Math.max(...kids)}, ${moves === 1 ? "so the two swap" : `so it sinks ${moves} levels, swapping each time with the larger child`}.${i === 0 ? ` The max-heap is built: ${show(a)}, with the largest value on top.` : ""}`,
      items: draw({ hot: trail }),
    });
  }
  while (end > 1) {
    const top = a[0];
    end--;
    [a[0], a[end]] = [a[end], a[0]];
    const moved = a[0];
    const trail = siftDown(0, end);
    const last = end === 1;
    frames.push({
      caption: last
        ? `Swap ${top} into index ${end}; the heap is down to one value, ${a[0]}, which is the smallest and already in place. The array is sorted, ${show(a)}, in O(n log n) with no second array.`
        : `Swap the maximum, ${top}, with the last heap slot: index ${end} is its final place. ${trail.length === 1 ? `${moved} now sits in the root and is already the largest of the ${end} values left, so it stays: the next largest is on top.` : `${moved} now sits in the root and sinks ${trail.length - 1 === 1 ? "one level" : `${trail.length - 1} levels`} within the ${end} values left, bringing the next largest, ${a[0]}, to the top.`}`,
      items: draw({ hot: last ? [] : trail, final: last }),
    });
  }
  return finish({ title: "Heap sort: build a max-heap, then move the top to the end", input: `a = ${show(input)}`, frames });
}

/* ── The top k with a min-heap of size k ──────────────────────────── */

const ordinal = (k: number) => `${k}${k % 10 === 1 && k % 100 !== 11 ? "st" : k % 10 === 2 && k % 100 !== 12 ? "nd" : k % 10 === 3 && k % 100 !== 13 ? "rd" : "th"}`;

class MinHeap {
  data: number[] = [];
  push(v: number) {
    const d = this.data;
    d.push(v);
    let i = d.length - 1;
    while (i > 0 && d[parent(i)] > d[i]) {
      [d[parent(i)], d[i]] = [d[i], d[parent(i)]];
      i = parent(i);
    }
  }
  pop(): number {
    const d = this.data;
    const top = d[0];
    const last = d.pop()!;
    if (d.length) d[0] = last;
    let i = 0;
    for (;;) {
      let m = i;
      for (const c of kidsOf(i, d.length)) if (d[c] < d[m]) m = c;
      if (m === i) break;
      [d[i], d[m]] = [d[m], d[i]];
      i = m;
    }
    return top;
  }
}

function topK(): Walkthrough {
  const nums = [3, 1, 9, 4, 7, 2, 8, 6];
  const K = 3;
  const SS = 34;
  const SG = 4;
  const rowW = nums.length * (SS + SG) - SG;
  const TW = 150;
  const TX = rowW / 2 - TW / 2;
  const TY = SS + 66;
  const EY = TY + 60 + R + 40;
  const heap = new MinHeap();
  const evicted: number[] = [];
  const frames: Frame[] = [];

  const draw = (cur: number, o: { gone?: number; final?: boolean; first?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("sl", "stream", -10, 0, SS)];
    nums.forEach((v, i) => items.push(box(`s${i}`, slotX(i, 0, SS, SG), 0, v, { w: SS, h: SS, tone: i === cur || (o.first && i < cur) ? "accent" : i < cur ? "muted" : "plain", size: 13 })));
    if (!o.final) items.push({ k: "ptr", id: "cur", x: slotMid(cur, 0, SS, SG), y: SS + 6, label: "now", tone: "ink", up: true });
    items.push(...heapTree(heap.data, { width: TW, level: 60, x0: TX, y0: TY, tone: (i) => (o.final ? "strong" : i === 0 ? "accent" : "plain") }));
    items.push(label("hl", `min-heap, size ${K}`, TX + TW + 16, TY, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
    items.push(label("hr", "root = weakest kept", TX + TW + 16, TY + 18, { anchor: "start", tone: "accent", size: 11 }));
    items.push(rowLabel("el", "evicted", -10, EY, SS));
    evicted.forEach((v, k) => items.push(box(`x${v}`, slotX(k, 0, SS, SG), EY, v, { w: SS, h: SS, tone: v === o.gone ? "error" : "muted", size: 13 })));
    return items;
  };

  for (let i = 0; i < K; i++) heap.push(nums[i]);
  frames.push({
    caption: `The first ${K} values fill a min-heap. Its root, ${heap.data[0]}, is the smallest of them — the weakest member of the top ${K} so far, and the one any better value should push out.`,
    items: draw(K - 1, { first: true }),
  });
  for (let i = K; i < nums.length; i++) {
    const v = nums[i];
    heap.push(v);
    const gone = heap.pop();
    evicted.push(gone);
    frames.push({
      caption:
        gone === v
          ? `Push ${v}: it is itself the smallest of the k + 1 = ${K + 1} values, so the pop takes it straight back out — ${v} cannot be in the top ${K}.`
          : `Push ${v}: that makes k + 1 = ${K + 1} values, one too many, so the root — the smallest, ${gone} — is popped and evicted. The new weakest member is ${heap.data[0]}.`,
      items: draw(i, { gone }),
    });
  }
  const kept = [...heap.data].sort((a, b) => a - b);
  frames.push({
    caption: `The stream is done: the heap holds ${and(kept.map(String))}, the ${K} largest, and its root ${heap.data[0]} is the ${ordinal(K)} largest. Each value cost a push and a pop on a heap of size ${K}: O(n log k) time and O(k) memory.`,
    items: draw(nums.length - 1, { final: true }),
  });
  return finish({ title: "The k largest values with a min-heap of size k", input: `nums = ${show(nums)}, k = ${K}`, frames });
}

/* ── Two heaps for a running median ───────────────────────────────── */

function twoHeaps(): Walkthrough {
  const stream = [5, 15, 1, 3, 8, 7, 9, 10];
  const SS = 34;
  const SG = 4;
  const rowW = stream.length * (SS + SG) - SG;
  const DIV = rowW / 2;
  const GY = SS + 70;
  const low: number[] = [];
  const high: number[] = [];
  const frames: Frame[] = [];
  const takeMax = (h: number[]) => h.splice(h.indexOf(Math.max(...h)), 1)[0];
  const takeMin = (h: number[]) => h.splice(h.indexOf(Math.min(...h)), 1)[0];
  const median = () => (low.length > high.length ? Math.max(...low) : (Math.max(...low) + Math.min(...high)) / 2);

  const draw = (cur: number): Item[] => {
    const items: Item[] = [rowLabel("sl", "stream", -10, 0, SS)];
    stream.forEach((v, i) => items.push(box(`s${i}`, slotX(i, 0, SS, SG), 0, v, { w: SS, h: SS, tone: i === cur ? "accent" : i < cur ? "muted" : "plain", size: 13 })));
    // Each half drawn in order with its top beside the divide; a heap only ever shows its top.
    const lo = [...low].sort((a, b) => a - b);
    const hi = [...high].sort((a, b) => a - b);
    lo.forEach((v, j) => items.push(box(`v${v}`, DIV - 8 - (lo.length - j) * (SS + SG) + SG, GY, v, { w: SS, h: SS, tone: j === lo.length - 1 ? "accent" : "plain", size: 13 })));
    hi.forEach((v, j) => items.push(box(`v${v}`, DIV + 8 + j * (SS + SG), GY, v, { w: SS, h: SS, tone: j === 0 ? "accent" : "plain", size: 13 })));
    items.push({ k: "edge", id: "div", x1: DIV, y1: GY - 26, x2: DIV, y2: GY + SS + 10, tone: "ink", dashed: true });
    items.push(label("ll", "low: max-heap", DIV - 8, GY - 16, { anchor: "end", tone: "soft", size: 11.5, weight: 600 }));
    items.push(label("hl", "high: min-heap", DIV + 8, GY - 16, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
    const m = median();
    const text = low.length > high.length ? `median = top of low = ${m.toFixed(1)}` : `median = (${Math.max(...low)} + ${Math.min(...high)}) / 2 = ${m.toFixed(1)}`;
    items.push(note("md", text, DIV, GY + SS + 30, { anchor: "middle", size: 13, weight: 600 }));
    return items;
  };

  stream.forEach((x, i) => {
    low.push(x);
    const up = takeMax(low);
    high.push(up);
    let back: number | null = null;
    if (high.length > low.length) {
      back = takeMin(high);
      low.push(back);
    }
    const m = median().toFixed(1);
    let caption: string;
    if (back === null) caption = `Add ${x}: it goes into low, and low's largest, ${up}, moves up to high. The halves are the same size, so the median is the average of the two tops, ${m}.`;
    else if (back === up) caption = `Add ${x}: into low, up to high as low's largest, and straight back down because high may not outgrow low. low holds one value more, so the median is its top, ${m}.`;
    else caption = `Add ${x}: it goes into low, and low's largest, ${up}, moves up to high. high now holds more, so its smallest, ${back}, comes back down. The median is low's top, ${m}.`;
    if (i === 0) caption = `low is a max-heap holding the smaller half, high a min-heap holding the larger half; only their tops are ever read. ${caption}`;
    if (i === stream.length - 1) caption += " Each add was a constant number of pushes and pops: O(log n).";
    frames.push({ caption, items: draw(i) });
  });
  return finish({ title: "A running median with two heaps", input: `stream = ${show(stream)}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  storage,
  "smaller-child": smallerChild,
  "heapify-cost": heapifyCost,
  "heap-sort": heapSort,
  "top-k": topK,
  "two-heaps": twoHeaps,
};
