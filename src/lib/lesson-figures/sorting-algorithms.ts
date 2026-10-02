import { CELL, finish, note, over, row, rowLabel, show, slotX, spanOver, treeLayout, under, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Sorting Algorithms: the lesson's figures (content/roadmap/sorting-algorithms.md
 * places each with "@figure <name>"). Insertion sort and its inversions,
 * merge sort's levels, Lomuto's partition, what a pivot choice does to the
 * depth, counting sort, stability, and the decision tree behind the
 * n log n lower bound — each computed by running the sort it shows. Values
 * keep the id of their input position, so a value glides to its new slot.
 */

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Insertion sort, one frame per element taken: larger values shift right, and each shift fixes one inversion. */
function insertion(): Walkthrough {
  const input = [5, 2, 4, 6, 1, 3];
  const n = input.length;
  let inv = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (input[i] > input[j]) inv++;
  const ids = input.map((_, i) => i);
  const frames: Frame[] = [];
  let shifts = 0;

  const draw = (upto: number, key: number, o: { shifted?: number[]; done?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    items.push({ k: "band", id: "pre", x: -4, y: -4, w: slotX(upto) + CELL + 8, h: CELL + 8, tone: o.done ? "strong" : "accent" });
    items.push(rowLabel("ln", "nums", -12, 0));
    ids.forEach((id, slot) =>
      items.push({ k: "cell", id: `v${id}`, x: slotX(slot), y: 0, w: CELL, h: CELL, text: String(input[id]), tone: o.done ? "strong" : id === key ? "accent" : o.shifted?.includes(id) ? "muted" : "plain" }),
    );
    items.push(spanOver("sp", 0, upto, o.done ? "sorted" : "sorted prefix", { tone: o.done ? "accent" : "ink" }));
    items.push(note("cnt", `shifts so far: ${shifts} · inversions in the input: ${inv}`, 0, CELL + 30, { size: 12.5, weight: 600 }));
    return items;
  };

  frames.push({
    caption: "Insertion sort grows a sorted prefix, the way most people sort a hand of cards: take the next element, shift every larger value in the prefix one place right, and drop the element into the gap. One element alone is sorted.",
    items: draw(0, -1),
  });
  for (let j = 1; j < n; j++) {
    const key = ids[j];
    let i = j - 1;
    const shifted: number[] = [];
    while (i >= 0 && input[ids[i]] > input[key]) {
      shifted.push(ids[i]);
      ids[i + 1] = ids[i];
      i--;
    }
    ids[i + 1] = key;
    shifts += shifted.length;
    const vals = shifted.map((id) => input[id]);
    frames.push({
      caption: shifted.length
        ? `Take ${input[key]}. ${vals.join(", ")} ${shifted.length === 1 ? "is" : "are"} larger, so ${shifted.length === 1 ? "it shifts" : "they shift"} one place right and ${input[key]} drops into the gap: ${plural(shifted.length, "shift")}, each fixing one pair that was out of order.`
        : `Take ${input[key]}: it is larger than everything before it, so nothing moves. On already sorted input every step is like this one, and insertion sort runs in O(n).`,
      items: draw(j, key, { shifted }),
    });
  }
  frames.push({
    caption: `Sorted with ${shifts} shifts — exactly the ${inv} inversions, pairs out of order, in the input. So the cost is O(n + inversions): close to O(n) when the data is nearly sorted, O(n²) when it is reversed.`,
    items: draw(n - 1, -1, { done: true }),
  });
  return finish({ title: "Insertion sort: each shift fixes one pair that was out of order", input: `nums = ${show(input)}`, frames });
}

/** Merge sort as levels: split until pieces have one element, then merge sorted pieces back up, one level per merge. */
function merge(): Walkthrough {
  const input = [38, 27, 43, 3, 9, 82, 10];
  const n = input.length;
  type Piece = { lo: number; hi: number; depth: number; order: number[] };
  const leaves: Piece[] = [];
  const merges: Array<{ lo: number; mid: number; hi: number; depth: number }> = [];
  const nodes: Array<{ lo: number; hi: number; depth: number }> = [];
  const split = (lo: number, hi: number, depth: number) => {
    nodes.push({ lo, hi, depth });
    if (lo >= hi) {
      leaves.push({ lo, hi, depth, order: [lo] });
      return;
    }
    const mid = lo + Math.floor((hi - lo) / 2);
    split(lo, mid, depth + 1);
    split(mid + 1, hi, depth + 1);
    merges.push({ lo, mid, hi, depth });
  };
  split(0, n - 1, 0);
  const levels = Math.max(...leaves.map((l) => l.depth));
  const DY = 62;
  const SX = 42;
  const PG = 12;
  const frames: Frame[] = [];

  // A piece at depth d is set apart from its neighbours by every split made above it, so each level keeps its columns.
  const x = (slot: number, depth: number) => slot * SX + nodes.filter((nd) => nd.depth <= depth && nd.lo > 0 && nd.lo <= slot && !nodes.some((m) => m.depth < nd.depth && m.lo === nd.lo)).length * PG;
  const draw = (pieces: Piece[], o: { fresh?: string; done?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    for (let d = 0; d <= levels; d++) items.push(label(`lv${d}`, `level ${d}`, -14, d * DY + 17, { anchor: "end", size: 10.5, tone: "faint" }));
    for (const nd of nodes) items.push({ k: "band", id: `sk${nd.lo}-${nd.hi}`, x: x(nd.lo, nd.depth) - 4, y: nd.depth * DY - 4, w: x(nd.hi, nd.depth) + 36 - x(nd.lo, nd.depth) + 8, h: 42, tone: "ghost" });
    for (const p of pieces) {
      const key = `${p.lo}-${p.hi}`;
      const fresh = o.fresh === key;
      if (fresh || o.done) items.push({ k: "band", id: "fresh", x: x(p.lo, p.depth) - 4, y: p.depth * DY - 4, w: x(p.hi, p.depth) + 36 - x(p.lo, p.depth) + 8, h: 42, tone: o.done ? "strong" : "accent" });
      p.order.forEach((id, k) =>
        items.push({ k: "cell", id: `v${id}`, x: x(p.lo + k, p.depth), y: p.depth * DY, w: 36, h: 34, text: String(input[id]), tone: o.done ? "strong" : fresh ? "accent" : "plain", size: 13 }),
      );
    }
    return items;
  };

  let pieces: Piece[] = [{ lo: 0, hi: n - 1, depth: 0, order: input.map((_, i) => i) }];
  frames.push({
    caption: "Merge sort splits the array in half, sorts each half the same way, and merges the two sorted halves into one. A piece of one element is already sorted, which is where the splitting stops.",
    items: draw(pieces),
  });
  pieces = leaves.map((l) => ({ ...l }));
  frames.push({
    caption: `Split until every piece holds one element: ${levels} levels below the top for ${n} values, about log₂ n. Nothing has been compared yet — all the work is in the merges.`,
    items: draw(pieces),
  });
  for (const m of merges) {
    const left = pieces.find((p) => p.lo === m.lo && p.hi === m.mid)!;
    const right = pieces.find((p) => p.lo === m.mid + 1 && p.hi === m.hi)!;
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < left.order.length && j < right.order.length) {
      if (input[left.order[i]] <= input[right.order[j]]) out.push(left.order[i++]);
      else out.push(right.order[j++]);
    }
    out.push(...left.order.slice(i), ...right.order.slice(j));
    pieces = pieces.filter((p) => p !== left && p !== right).concat({ lo: m.lo, hi: m.hi, depth: m.depth, order: out });
    pieces.sort((a, b) => a.lo - b.lo);
    const L = left.order.map((id) => input[id]).join(" ");
    const R = right.order.map((id) => input[id]).join(" ");
    const taken = out.map((id) => input[id]);
    frames.push({
      caption:
        out.length === 2
          ? `Merge [${L}] and [${R}]: the smaller front, ${taken[0]}, goes first, then ${taken[1]}. A sorted run of two rises one level.`
          : `Merge [${L}] and [${R}]: take the smaller of the two fronts each time — ${taken.join(", ")}. Each value is placed once, so merging ${out.length} values costs ${out.length} steps.`,
      items: draw(pieces, { fresh: `${m.lo}-${m.hi}` }),
    });
  }
  frames.push({
    caption: `Sorted. Each level of merges handles every one of the ${n} values once, and there are about log₂ n levels, so merge sort is O(n log n) on every input — at the price of an O(n) buffer for the merges.`,
    items: draw(pieces, { done: true }),
  });
  return finish({ title: "Merge sort: split down to single values, then merge sorted runs back up", input: `nums = ${show(input)}`, frames });
}

/** Lomuto partition: values smaller than the pivot collect at the front behind store, then the pivot drops in after them. */
function partition(): Walkthrough {
  const input = [7, 2, 9, 4, 1, 8, 3];
  const n = input.length;
  const ids = input.map((_, i) => i);
  const lo = 0;
  const hi = n - 1;
  const mid = lo + Math.floor((hi - lo) / 2);
  const pivotId = mid;
  const pivot = input[pivotId];
  const frames: Frame[] = [];
  const val = (slot: number) => input[ids[slot]];

  const draw = (o: { store?: number; i?: number; placed?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("ln", "a", -12, 0)];
    ids.forEach((id, slot) => {
      let tone: Tone = "plain";
      if (o.placed) tone = id === pivotId ? "strong" : val(slot) < pivot ? "accent" : "muted";
      else if (o.store !== undefined && o.i !== undefined) {
        if (slot < o.store) tone = "accent";
        else if (slot <= o.i && id !== pivotId) tone = "muted";
      }
      if (!o.placed && id === pivotId) tone = "plain";
      items.push({ k: "cell", id: `v${id}`, x: slotX(slot), y: 0, w: CELL, h: CELL, text: String(input[id]), tone });
      items.push({ k: "text", id: `ix${slot}`, x: slotX(slot) + CELL / 2, y: CELL + 11, text: String(slot), tone: "faint", size: 10 });
    });
    const pSlot = ids.indexOf(pivotId);
    items.push(over("pv", pSlot, o.placed ? "pivot, in place" : "pivot", { tone: "ink" }));
    if (o.store !== undefined && o.i !== undefined && !o.placed) {
      if (o.store > 0) items.push(spanOver("lt", 0, o.store - 1, `< ${pivot}`, { tone: "accent" }));
      if (o.i >= o.store) items.push(spanOver("ge", o.store, o.i, `≥ ${pivot}`, { tone: "ink" }));
      if (o.i === o.store) items.push(under("st", o.store, "i = store", { indexed: true }));
      else {
        items.push(under("st", o.store, "store", { indexed: true }));
        if (o.i >= 0) items.push(under("ii", o.i, "i", { indexed: true, tone: "ink" }));
      }
    }
    if (o.placed) {
      if (pSlot > 0) items.push(spanOver("lt", 0, pSlot - 1, `< ${pivot}`, { tone: "accent" }));
      items.push(spanOver("ge", pSlot + 1, n - 1, `> ${pivot}`, { tone: "ink" }));
    }
    return items;
  };

  frames.push({
    caption: `Quicksort first partitions: it picks a pivot — here the middle element, ${pivot} — and rearranges the range so that smaller values come before it and the rest after. No merge is needed afterwards.`,
    items: draw({}),
  });
  [ids[mid], ids[hi]] = [ids[hi], ids[mid]];
  frames.push({
    caption: `Park the pivot at the end by swapping it with the last element. store = 0 marks where the next smaller value goes: everything before store will be smaller than ${pivot}.`,
    items: draw({ store: 0, i: -1 }),
  });
  let store = 0;
  let quietSaid = false;
  for (let i = lo; i < hi; i++) {
    const v = val(i);
    if (v < pivot) {
      const from = i;
      const to = store;
      [ids[i], ids[store]] = [ids[store], ids[i]];
      store++;
      frames.push({
        caption:
          from === to
            ? `a[${i}] = ${v} < ${pivot}, and it is already at store, so it stays; store moves to ${store}.`
            : `a[${i}] = ${v} < ${pivot}: swap it with a[${to}] = ${input[ids[from]]}, the first value not smaller, and move store to ${store}. The front still holds only values below the pivot.`,
        items: draw({ store, i }),
      });
    } else {
      frames.push({
        caption: quietSaid
          ? `a[${i}] = ${v} is not smaller than ${pivot}: it stays, and only i moves on.`
          : `a[${i}] = ${v} is not smaller than ${pivot}: it stays where it is and only i moves on. The range always reads: smaller than the pivot | not smaller | not yet seen.`,
        items: draw({ store, i }),
      });
      quietSaid = true;
    }
  }
  [ids[store], ids[hi]] = [ids[hi], ids[store]];
  const left = ids.slice(0, store).map((id) => input[id]);
  const right = ids.slice(store + 1).map((id) => input[id]);
  frames.push({
    caption: `Swap the pivot into a[${store}]: [${left.join(" ")}] ${pivot} [${right.join(" ")}]. ${pivot} is now exactly where it belongs in the sorted array, and each side is sorted the same way, recursively.`,
    items: draw({ placed: true }),
  });
  return finish({ title: "Quicksort's partition (Lomuto): smaller values in front, then the pivot", input: `a = ${show(input)}`, frames });
}

/** Quicksort's recursion on sorted input: a middle pivot halves each range, a last-element pivot peels off one value per level. */
function pivotDepth(): Walkthrough {
  const n = 8;
  type Call = { lo: number; hi: number; depth: number };
  const run = (choose: (lo: number, hi: number) => number): Call[] => {
    const a = Array.from({ length: n }, (_, i) => i + 1);
    const calls: Call[] = [];
    const qs = (lo: number, hi: number, depth: number) => {
      if (lo >= hi) return;
      calls.push({ lo, hi, depth });
      const m = choose(lo, hi);
      [a[m], a[hi]] = [a[hi], a[m]];
      const p = a[hi];
      let st = lo;
      for (let i = lo; i < hi; i++) if (a[i] < p) [a[i], a[st++]] = [a[st], a[i]];
      [a[st], a[hi]] = [a[hi], a[st]];
      qs(lo, st - 1, depth + 1);
      qs(st + 1, hi, depth + 1);
    };
    qs(0, n - 1, 0);
    return calls;
  };
  const middle = run((lo, hi) => lo + Math.floor((hi - lo) / 2));
  const last = run((_, hi) => hi);
  const depthOf = (c: Call[]) => Math.max(...c.map((x) => x.depth)) + 1;
  const work = (c: Call[]) => c.reduce((s, x) => s + (x.hi - x.lo), 0);
  const U = 19;
  const RH = 24;
  const OX = n * U + 54;
  const items: Item[] = [];
  const chart = (calls: Call[], x0: number, id: string, title: string, tone: Tone) => {
    items.push(label(`${id}t`, title, x0, -18, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }));
    calls.forEach((c, k) =>
      items.push(box(`${id}${k}`, x0 + c.lo * U, c.depth * RH, c.hi - c.lo + 1 >= 2 ? String(c.hi - c.lo + 1) : "", { w: (c.hi - c.lo + 1) * U - 2, h: RH - 4, size: 11, tone })),
    );
    const d = depthOf(calls);
    items.push(note(`${id}n`, `${d} levels, ${work(calls)} comparisons`, x0, Math.max(depthOf(middle), depthOf(last)) * RH + 16, { size: 12, weight: 600 }));
  };
  chart(middle, 0, "m", "middle element as pivot", "accent");
  chart(last, OX, "l", "last element as pivot", "plain");
  return finish({
    title: "Why the pivot matters: the depth of quicksort on already sorted input",
    input: `sorted input 1..${n}; each bar is one partition, its width the range it scans`,
    frames: [
      {
        caption: `On sorted input a middle pivot splits each range about evenly: ${depthOf(middle)} levels of partitioning, ${work(middle)} comparisons. The last element is the largest every time, so one side is always empty: ${depthOf(last)} levels and n(n − 1)/2 = ${work(last)} comparisons — the O(n²) worst case.`,
        items,
      },
    ],
  });
}

/** Counting sort: count each key, turn the counts into starting slots, and place every value at its key's next slot. */
function counting(): Walkthrough {
  const input = [3, 1, 4, 1, 0, 3, 1, 2];
  const n = input.length;
  const k = Math.max(...input) + 1;
  const count = new Array<number>(k).fill(0);
  for (const v of input) count[v]++;
  const start: number[] = [];
  count.reduce((s, c, v) => ((start[v] = s), s + c), 0);
  const slot: number[] = [];
  const next = [...start];
  input.forEach((v, i) => (slot[i] = next[v]++));
  const CY = 92;
  const SY = 150;
  const OY = 226;
  const frames: Frame[] = [];

  const draw = (stage: number): Item[] => {
    const items: Item[] = [rowLabel("li", "input", -12, 0), rowLabel("lo", "output", -12, OY)];
    input.forEach((v, i) => {
      const placed = stage >= 3;
      items.push({ k: "cell", id: `in${i}`, x: slotX(placed ? slot[i] : i), y: placed ? OY : 0, w: CELL, h: CELL, text: String(v), tone: v === 1 ? "accent" : placed ? "strong" : "plain" });
      if (placed) items.push(label(`fr${i}`, `#${i}`, slotX(slot[i]) + CELL / 2, OY + CELL + 11, { mono: true, size: 10.5, tone: v === 1 ? "accent" : "faint" }));
      else items.push(label(`ii${i}`, `#${i}`, slotX(i) + CELL / 2, CELL + 11, { mono: true, size: 10.5, tone: "faint" }));
    });
    for (let s = 0; s < n; s++) {
      if (stage < 3) items.push(box(`o${s}`, slotX(s), OY, "", { tone: "ghost" }));
      else items.push(box(`e${s}`, slotX(s), 0, "", { tone: "ghost" }));
    }
    if (stage >= 1) {
      items.push(rowLabel("lc", "count", -12, CY, 32));
      for (let v = 0; v < k; v++) {
        items.push(label(`key${v}`, `key ${v}`, slotX(v) + CELL / 2, CY - 10, { size: 10.5, tone: "faint" }));
        items.push(box(`c${v}`, slotX(v), CY, count[v], { h: 32, tone: stage === 1 ? "accent" : "plain" }));
      }
    }
    if (stage >= 2) {
      items.push(rowLabel("ls", "starts at", -12, SY, 32));
      for (let v = 0; v < k; v++) items.push(box(`s${v}`, slotX(v), SY, start[v], { h: 32, tone: stage === 2 ? "accent" : "plain" }));
    }
    return items;
  };

  frames.push({
    caption: `Counting sort never compares two values. The keys here are small integers, 0 to ${k - 1}, so they can be used directly as array indices.`,
    items: draw(0),
  });
  frames.push({
    caption: `One pass counts how often each key occurs: ${count.map((c, v) => `${c} × ${v}`).join(", ")}. That is O(n) work into an array of k = ${k} counters.`,
    items: draw(1),
  });
  frames.push({
    caption: `A running total of the counts gives the slot where each key's first copy goes: key v starts after every smaller key. These are prefix sums, ${show(start)}.`,
    items: draw(2),
  });
  frames.push({
    caption: `Walk the input left to right and put each value at its key's next free slot. The three 1s (#1, #3, #6) land in their input order, so this version is stable — what radix sort needs. O(n + k) in all.`,
    items: draw(3),
  });
  return finish({ title: "Counting sort: count the keys, then place each value directly", input: `nums = ${show(input)}`, frames });
}

/**
 * Stability, as the lines from each record's old position to its new one:
 * in a stable sort the lines of equal keys never cross. Sorting by name and
 * then stably by score leaves each score's group in name order.
 */
function stability(): Walkthrough {
  const students: Array<[string, number]> = [
    ["Ravi", 82],
    ["Asha", 91],
    ["Meena", 82],
    ["Kiran", 75],
    ["Dev", 91],
    ["Anil", 82],
  ];
  const tie = 82;
  const byScore = (list: Array<[string, number]>) => list.slice().sort((a, b) => b[1] - a[1]);
  const byName = (list: Array<[string, number]>) => list.slice().sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const W = 96;
  const H = 28;
  const G = 6;
  const RX = 220;
  const y = (i: number) => i * (H + G);

  const draw = (before: Array<[string, number]>, after: Array<[string, number]>, titles: [string, string]): Item[] => {
    const items: Item[] = [
      label("tb", titles[0], W / 2, -16, { size: 11.5, weight: 600, tone: "ink" }),
      label("ta", titles[1], RX + W / 2, -16, { size: 11.5, weight: 600, tone: "ink" }),
    ];
    before.forEach(([name, score], i) => {
      const j = after.findIndex(([n2]) => n2 === name);
      const isTie = score === tie;
      items.push(arrow(`ln${name}`, { x: W + 4, y: y(i) + H / 2 }, { x: RX - 4, y: y(j) + H / 2 }, { tone: isTie ? "accent" : "line", head: true }));
      items.push(box(`b${name}`, 0, y(i), `${name} ${score}`, { w: W, h: H, size: 12, tone: isTie ? "accent" : "plain" }));
    });
    after.forEach(([name, score], j) => items.push(box(`a${name}`, RX, y(j), `${name} ${score}`, { w: W, h: H, size: 12, tone: score === tie ? "accent" : "plain" })));
    return items;
  };

  const s1 = byScore(students);
  const names = byName(students);
  const s2 = byScore(names);
  const tieNames = (list: Array<[string, number]>) => list.filter(([, s]) => s === tie).map(([n]) => n).join(", ");
  return finish({
    title: "Stable sorting: equal keys keep their order, so the lines never cross",
    input: students.map(([n, s]) => `${n} ${s}`).join(", "),
    frames: [
      {
        caption: `A stable sort by score, highest first. The three students on ${tie} come out as ${tieNames(s1)} — their input order — and their lines never cross. An unstable sort may cross them.`,
        items: draw(students, s1, ["input", "stable, by score"]),
      },
      {
        caption: `To list equal scores alphabetically with two sorts, sort by the secondary key first: by name. The ${tie}s are now ${tieNames(names)}.`,
        items: draw(students, names, ["input", "by name"]),
      },
      {
        caption: `Then sort stably by score, the main key. Within each score the name order survives, because a stable sort never reorders equals: ${tieNames(s2)}. Spreadsheets sort by several columns this way.`,
        items: draw(names, s2, ["by name", "then stably by score"]),
      },
    ],
  });
}

/**
 * The comparison lower bound: insertion sort on three values a, b, c drawn as
 * the tree of questions it asks. Each of the 3! orders is a different leaf,
 * so some leaf is at least log₂ 6 deep.
 */
function decisionTree(): Walkthrough {
  const syms = ["a", "b", "c"];
  const perms: number[][] = [];
  const permute = (rest: number[], acc: number[]) => (rest.length ? rest.forEach((v, i) => permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, v])) : perms.push(acc));
  permute([0, 1, 2], []);
  type Node = { q?: string; yes?: string; no?: string; leaf?: string };
  const nodes = new Map<string, Node>();
  for (const p of perms) {
    const value = (s: string) => p[syms.indexOf(s)];
    const arr = [...syms];
    let path = "";
    for (let j = 1; j < arr.length; j++) {
      const key = arr[j];
      let i = j - 1;
      for (;;) {
        if (i < 0) break;
        const q = `${key} < ${arr[i]}?`;
        const yes = value(key) < value(arr[i]);
        const node = nodes.get(path) ?? {};
        node.q = q;
        const next = `${path}${yes ? "Y" : "N"}`;
        if (yes) node.yes = next;
        else node.no = next;
        nodes.set(path, node);
        path = next;
        if (!yes) break;
        arr[i + 1] = arr[i];
        i--;
      }
      arr[i + 1] = key;
    }
    nodes.set(path, { leaf: arr.join(" < ") });
  }
  const children = (k: string) => {
    const nd = nodes.get(k)!;
    return [nd.yes, nd.no].filter((c): c is string => !!c);
  };
  const at = treeLayout("", children, { dx: 84, dy: 78 });
  const depth = Math.max(...[...at.values()].map((p) => p.depth));
  const leaves = [...nodes.values()].filter((nd) => nd.leaf).length;
  const items: Item[] = [];
  const BW = 76;
  const BH = 28;
  for (const [k, p] of at) {
    for (const c of children(k)) {
      const q = at.get(c)!;
      items.push(arrow(`e${c}`, { x: p.x, y: p.y + BH / 2 + 1 }, { x: q.x, y: q.y - BH / 2 - 2 }, { tone: "line", label: c.endsWith("Y") ? "yes" : "no" }));
    }
  }
  for (const [k, p] of at) {
    const nd = nodes.get(k)!;
    items.push(box(`n${k || "root"}`, p.x - BW / 2, p.y - BH / 2, nd.leaf ?? nd.q!, { w: BW, h: BH, size: 11, tone: nd.leaf ? "accent" : "plain" }));
  }
  return finish({
    title: "Why no comparison sort beats n log n: the tree of questions",
    input: "insertion sort on three distinct values a, b, c",
    frames: [
      {
        caption: `Every comparison is a yes-or-no question, so a sort's run is a path down a tree, and each of the 3! = ${leaves} possible orders needs its own leaf. A tree with ${leaves} leaves is at least ${Math.ceil(Math.log2(leaves))} deep — this one is ${depth}. For n values, n! leaves force about n log₂ n comparisons.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  insertion,
  merge,
  partition,
  "pivot-depth": pivotDepth,
  counting,
  stability,
  "decision-tree": decisionTree,
};
