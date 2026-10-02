import { CELL, GAP, and, finish, note, row, rowLabel, show, slotX, spanOver, under, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, region } from "./kit.js";

/**
 * Prefix Sum: the lesson's figures (content/roadmap/prefix-sum.md places each
 * with "@figure <name>"). The repeated work of the naive way, the ruler that
 * makes a range sum one subtraction (why it works), the hash map counting
 * subarrays, the 2D inclusion–exclusion and the difference array — each one
 * computed by running the thing it shows.
 */

const NUMS = [2, 4, 1, 3, 5, 2];

const prefixOf = (xs: readonly number[]) => xs.reduce<number[]>((p, x) => [...p, p[p.length - 1] + x], [0]);
const rangeText = (l: number, r: number) => (l === r ? `nums[${l}]` : `nums[${l}..${r}]`);
const signed = (v: number) => (v < 0 ? `−${-v}` : `+${v}`);
const minus = (v: number) => (v < 0 ? `−${-v}` : String(v));

/** Three range queries summed from scratch: the same numbers are read again and again. */
function repeats(): Walkthrough {
  const queries: Array<[number, number]> = [
    [1, 4],
    [0, 5],
    [2, 4],
  ];
  const n = NUMS.length;
  const times = NUMS.map((_, i) => queries.filter(([l, r]) => i >= l && i <= r).length);
  const read = times.reduce((a, b) => a + b, 0);
  const most = times.flatMap((t, i) => (t === Math.max(...times) ? [i] : []));
  const RX = slotX(n) + 8;
  const items: Item[] = [rowLabel("ln", "nums", -12, 0), ...row("n", NUMS, { index: true })];
  queries.forEach(([l, r], q) => {
    const y = 74 + q * 50;
    const sum = NUMS.slice(l, r + 1).reduce((a, b) => a + b, 0);
    items.push(rowLabel(`ql${q}`, `sum(${l}..${r})`, -12, y));
    for (let i = l; i <= r; i++) items.push(box(`q${q}-${i}`, slotX(i), y, NUMS[i], { tone: "accent" }));
    items.push(label(`qs${q}`, `= ${sum}, ${r - l + 1} numbers read`, RX, y + CELL / 2, { anchor: "start", size: 11.5 }));
  });
  const TY = 74 + queries.length * 50 + 18;
  items.push(rowLabel("lt", "times read", -12, TY));
  items.push(...row("t", times, { y: TY, tone: (i) => (times[i] > 1 ? "accent" : "plain") }));
  items.push(note("total", `${queries.length} queries read ${read} numbers; a prefix row reads each once`, -78, TY + CELL + 26, { size: 12, weight: 600 }));
  return finish({
    title: "Summing each range from scratch repeats the same additions",
    input: `nums = ${show(NUMS)}; queries ${queries.map(([l, r]) => `${l}..${r}`).join(", ")}`,
    frames: [
      {
        caption: `Three queries over six numbers already read ${read} numbers, and ${and(most.map((i) => `nums[${i}]`))} ${Math.max(...times)} times each. With 100,000 queries over 100,000 numbers that is up to 10¹⁰ additions, nearly all of them repeats.`,
        items,
      },
    ],
  });
}

/**
 * The numbers laid end to end like lengths on a ruler: prefix[k] is the mark
 * where the first k numbers end, and a range sum is the distance between two
 * marks — one subtraction, with prefix[0] = 0 as the ruler's start.
 */
function ruler(): Walkthrough {
  const prefix = prefixOf(NUMS);
  const n = NUMS.length;
  const U = 26;
  const H = 36;
  const mx = (k: number) => prefix[k] * U;
  const frames: Frame[] = [];

  const draw = (q?: [number, number], o: { answer?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    NUMS.forEach((v, i) =>
      items.push(box(`s${i}`, mx(i) + 1, 0, v, { w: v * U - 2, h: H, tone: q && i >= q[0] && i <= q[1] ? (o.answer ? "strong" : "accent") : "plain" })),
    );
    for (let k = 0; k <= n; k++) {
      const used = q && (k === q[0] || k === q[1] + 1);
      items.push({ k: "path", id: `tk${k}`, pts: [[mx(k), -4], [mx(k), H + 10]], tone: used ? "accent" : "ink", width: used ? 2 : 1.2 });
      items.push(label(`pv${k}`, String(prefix[k]), mx(k), H + 22, { mono: true, size: 12.5, tone: used ? "accent" : "ink", weight: 600 }));
      items.push(label(`pk${k}`, `[${k}]`, mx(k), H + 38, { mono: true, size: 10.5, tone: "faint" }));
    }
    items.push(label("lp", "prefix", -12, H + 22, { anchor: "end", size: 11.5 }));
    items.push(label("lk", "k", -12, H + 38, { anchor: "end", size: 10.5, tone: "faint" }));
    if (q) {
      const [l, r] = q;
      items.push({ k: "span", id: "big", x1: 0, x2: mx(r + 1), y: -14, label: `prefix[${r + 1}] = ${prefix[r + 1]}`, tone: "ink" });
      if (l > 0) items.push({ k: "span", id: "small", x1: 0, x2: mx(l), y: -40, label: `prefix[${l}] = ${prefix[l]}`, tone: "ink" });
      const ans = prefix[r + 1] - prefix[l];
      items.push({ k: "span", id: "ans", x1: mx(l), x2: mx(r + 1), y: H + 52, down: true, label: `sum(${l}..${r}) = ${prefix[r + 1]} − ${prefix[l]} = ${ans}`, tone: "accent" });
    }
    return items;
  };

  frames.push({
    caption: "Lay the numbers end to end like lengths on a ruler. prefix[k] is the mark where the first k numbers end, so prefix[0] = 0 is where the ruler starts and prefix[6] = 17 is where it ends.",
    items: draw(),
  });
  const queries: Array<[number, number]> = [
    [1, 4],
    [0, 5],
    [3, 3],
  ];
  for (const [l, r] of queries) {
    const ans = prefix[r + 1] - prefix[l];
    const check = NUMS.slice(l, r + 1).join(" + ");
    const caption =
      l > 0 && r > l
        ? `prefix[${r + 1}] measures from 0 to mark ${r + 1}, prefix[${l}] from 0 to mark ${l}. Both start at the same 0, so their difference is exactly the stretch between the two marks: ${prefix[r + 1]} − ${prefix[l]} = ${ans}, which is ${check}.`
        : l === 0
          ? `A range that starts at index 0 subtracts prefix[0] = 0, the start of the ruler: ${prefix[r + 1]} − 0 = ${ans}. That empty first slot is why no range needs a special case.`
          : `One number is the distance between two neighbouring marks: ${prefix[r + 1]} − ${prefix[l]} = ${ans}, nums[${l}] itself. Any range costs two lookups and one subtraction: O(1).`;
    frames.push({ caption, items: draw([l, r], { answer: l === r }) });
  }
  return finish({ title: "Why a range sum is one subtraction: marks on a ruler", input: `nums = ${show(NUMS)}`, frames });
}

/**
 * Subarray Sum Equals K: one pass with the running prefix and a map from
 * prefix value to how often it has appeared. A match for prefix − k is the
 * start of a subarray that ends here and sums to k.
 */
function hashCount(): Walkthrough {
  const nums = [2, -1, 2, 1, -2, 3];
  const k = 3;
  const n = nums.length;
  const prefix = prefixOf(nums);
  const PX = -(CELL + GAP) / 2;
  const PY = 92;
  const MX = slotX(n) + 30;
  const frames: Frame[] = [];
  const seen = new Map<number, number>([[0, 1]]);
  const order: number[] = [0];
  let count = 0;

  const draw = (i: number, o: { need?: number; matches?: number[]; text: string; text2?: string; all?: Array<[number, number]> }): Item[] => {
    const items: Item[] = [rowLabel("ln", "nums", PX - 10, 0), ...row("n", nums.map(minus), { index: true, tone: (j) => (j === i ? "accent" : "plain") })];
    items.push(rowLabel("lp", "prefix", PX - 10, PY));
    items.push(
      ...row(
        "p",
        prefix.map((p, j) => (j <= i + 1 ? String(p) : "")),
        { x: PX, y: PY, index: true, tone: (j) => (j > i + 1 ? "ghost" : j === i + 1 && i >= 0 ? "accent" : o.matches?.includes(j) ? "strong" : "plain") },
      ),
    );
    (o.matches ?? []).forEach((p, m) => items.push(spanOver(`f${m}`, p, i, `${rangeText(p, i)} = ${k}`, { lift: 12 + m * 22, tone: "accent" })));
    (o.all ?? []).forEach(([a, b], m) => items.push(spanOver(`f${m}`, a, b, rangeText(a, b), { lift: 12 + m * 22, tone: "accent" })));
    items.push(label("mh", "prefix → times", MX, -10, { anchor: "start", size: 11, weight: 600 }));
    order.forEach((key, m) =>
      items.push(box(`m${key}`, MX, 4 + m * 34, `${minus(key)} → ${seen.get(key)}`, { w: 82, h: 28, size: 12.5, tone: key === o.need && (o.matches?.length ?? 0) > 0 ? "strong" : key === prefix[i + 1] && i >= 0 && !o.all ? "accent" : "plain" })),
    );
    items.push(note("r1", o.text, PX, PY + CELL + 44, { size: 12 }));
    items.push(note("r2", o.text2 ?? `count = ${count}`, PX, PY + CELL + 66, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `A subarray ending at i sums to k = ${k} exactly when some earlier prefix equals prefix − ${k}. So walk once and keep a map of how often each prefix value has appeared, starting with the empty prefix: 0 → 1.`,
    items: draw(-1, { text: `k = ${k}; the map starts with prefix[0] = 0` }),
  });
  const found: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const p = prefix[i + 1];
    const need = p - k;
    const times = seen.get(need) ?? 0;
    const matches = prefix.slice(0, i + 1).flatMap((v, j) => (v === need ? [j] : []));
    count += times;
    seen.set(p, (seen.get(p) ?? 0) + 1);
    if (!order.includes(p)) order.push(p);
    matches.forEach((j) => found.push([j, i]));
    const look = `prefix = ${minus(p)}; look up ${minus(p)} − ${k} = ${minus(need)}`;
    let caption: string;
    if (!times) {
      caption =
        seen.get(p)! > 1
          ? `nums[${i}] = ${minus(nums[i])} brings the prefix back to ${minus(p)}. No earlier prefix equals ${minus(need)}, so nothing ends here; the map now holds ${minus(p)} twice, and both copies will count later.`
          : `nums[${i}] = ${minus(nums[i])} makes the prefix ${minus(p)}. No earlier prefix equals ${minus(p)} − ${k} = ${minus(need)}, so no subarray ending here sums to ${k}. Record ${minus(p)} only after the lookup.`;
    } else if (times === 1) {
      caption = `prefix = ${minus(p)}, and ${minus(need)} was seen once${matches[0] === 0 ? " — the empty prefix" : `, after index ${matches[0] - 1}`}. So ${rangeText(matches[0], i)} = ${nums.slice(matches[0], i + 1).map(minus).join(" + ").replace(/\+ −/g, "− ")} sums to ${k}: count becomes ${count}.`;
    } else {
      caption = `prefix = ${minus(p)}, and ${minus(need)} was seen ${times} times, so ${times} subarrays end here: ${matches.map((j) => rangeText(j, i)).join(" and ")}. Adding the stored count, not 1, is what catches both. count = ${count}.`;
    }
    frames.push({ caption, items: draw(i, { need, matches, text: `${look}: seen ${times} time${times === 1 ? "" : "s"}` }) });
  }
  frames.push({
    caption: `${count} subarrays in one pass: O(n) time and O(n) space for the map, against O(n²) for every pair of ends. Negative numbers do no harm, because nothing here assumes a sum only grows.`,
    items: draw(n - 1, { all: found, text: `found: ${found.map(([a, b]) => `${a}..${b}`).join(", ")}`, text2: `count = ${count}` }),
  });
  return finish({ title: "Subarray Sum Equals K, with prefix sums and a hash map", input: `nums = ${show(nums)}, k = ${k}`, frames });
}

/** 2D prefix sums: a rectangle is the big corner block, minus two strips, plus the corner both strips removed. */
function rectangles(): Walkthrough {
  const grid = [
    [3, 0, 1, 4],
    [5, 6, 3, 2],
    [1, 2, 0, 1],
  ];
  const m = grid.length;
  const w = grid[0].length;
  const P = Array.from({ length: m + 1 }, () => new Array<number>(w + 1).fill(0));
  for (let i = 0; i < m; i++) for (let j = 0; j < w; j++) P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
  const [r1, c1, r2, c2] = [1, 1, 2, 2];
  const S = 42;
  const G = 5;
  const cx = (j: number) => j * (S + G);
  const cy = (i: number) => i * (S + G);
  const big = P[r2 + 1][c2 + 1];
  const top = P[r1][c2 + 1];
  const left = P[r2 + 1][c1];
  const corner = P[r1][c1];
  const ans = big - top - left + corner;
  const inWant = (i: number, j: number) => i >= r1 && i <= r2 && j >= c1 && j <= c2;
  const inTop = (i: number, j: number) => i < r1 && j <= c2;
  const inLeft = (i: number, j: number) => j < c1 && i <= r2;
  const outline = (id: string, a: number, b: number, c: number, d: number, text: string): Item[] =>
    region(id, cx(b) - 4, cy(a) - 4, cx(d) + S - cx(b) + 8, cy(c) + S - cy(a) + 8, text, { labelTone: "ink" });
  const NX = cx(w) + 22;

  const draw = (stage: number): Item[] => {
    const tone = (i: number, j: number): Tone => {
      if (stage === 0) return inWant(i, j) ? "accent" : "plain";
      if (stage === 1) return i <= r2 && j <= c2 ? "accent" : "plain";
      if (stage === 2) return inTop(i, j) && inLeft(i, j) ? "ghost" : inTop(i, j) || inLeft(i, j) ? "muted" : inWant(i, j) ? "accent" : "plain";
      return inWant(i, j) ? "strong" : inTop(i, j) || inLeft(i, j) ? "muted" : "plain";
    };
    const items: Item[] = [];
    grid.forEach((rw, i) => rw.forEach((v, j) => items.push(box(`g${i}-${j}`, cx(j), cy(i), v, { w: S, h: S, tone: tone(i, j) }))));
    grid.forEach((_, i) => items.push(label(`ri${i}`, `row ${i}`, -10, cy(i) + S / 2, { anchor: "end", size: 10.5, tone: "faint" })));
    grid[0].forEach((_, j) => items.push(label(`ci${j}`, `col ${j}`, cx(j) + S / 2, cy(m) + 6, { size: 10.5, tone: "faint" })));
    if (stage === 0) items.push(...outline("o", r1, c1, r2, c2, ""));
    if (stage === 1) items.push(...outline("o", 0, 0, r2, c2, `P[${r2 + 1}][${c2 + 1}] = ${big}`));
    if (stage === 2) {
      items.push(label("cn", "taken away twice", cx(0) + S / 2, -26, { size: 11, tone: "ink", weight: 600 }));
      items.push({ k: "edge", id: "ca", x1: cx(0) + S / 2, y1: -18, x2: cx(0) + S / 2, y2: -3, tone: "ink", arrow: true });
    }
    const lines = [
      `P[${r2 + 1}][${c2 + 1}] = ${big}`,
      stage >= 2 ? `− P[${r1}][${c2 + 1}] = ${top}` : "",
      stage >= 2 ? `− P[${r2 + 1}][${c1}] = ${left}` : "",
      stage >= 3 ? `+ P[${r1}][${c1}] = ${corner}` : "",
    ];
    if (stage >= 1) lines.forEach((t, k) => t && items.push(note(`f${k}`, t, NX, 12 + k * 22, { size: 12.5, tone: k === 3 || (stage === 2 && k > 0) ? "accent" : "ink" })));
    items.push(note("sum", stage === 0 ? `want = rows ${r1}–${r2}, cols ${c1}–${c2}` : stage === 1 ? `= ${big} so far` : stage === 2 ? `= ${big - top - left} so far` : `= ${ans}`, NX, 12 + 4 * 22 + 6, { weight: 600 }));
    return items;
  };

  const wantCells = grid.slice(r1, r2 + 1).flatMap((rw) => rw.slice(c1, c2 + 1));
  return finish({
    title: "Any rectangle's sum from four corners of the 2D prefix table",
    input: `grid = [${grid.map((r) => show(r)).join(", ")}]; rows ${r1}–${r2}, cols ${c1}–${c2}`,
    frames: [
      {
        caption: `P[i][j] holds the sum of the block above and left of row i, column j, with an extra row and column of zeroes. The goal is the rectangle of rows ${r1}–${r2} and columns ${c1}–${c2}.`,
        items: draw(0),
      },
      {
        caption: `Start with the whole block from the top-left corner down to the rectangle's bottom-right: P[${r2 + 1}][${c2 + 1}] = ${big}. It holds the rectangle plus everything above it and to its left.`,
        items: draw(1),
      },
      {
        caption: `Take away the strip above, P[${r1}][${c2 + 1}] = ${top}, and the strip to the left, P[${r2 + 1}][${c1}] = ${left}. The top-left corner block sits in both strips, so it has now been taken away twice.`,
        items: draw(2),
      },
      {
        caption: `Add the corner back once, P[${r1}][${c1}] = ${corner}: ${big} − ${top} − ${left} + ${corner} = ${ans}, which is ${wantCells.join(" + ")}. Four lookups answer any rectangle in O(1).`,
        items: draw(3),
      },
    ],
  });
}

/** A difference array: each range update writes two cells, and one running sum at the end applies them all. */
function difference(): Walkthrough {
  const n = 6;
  const updates: Array<[number, number, number]> = [
    [1, 3, 2],
    [2, 5, 3],
    [0, 1, -1],
  ];
  const diff = new Array<number>(n + 1).fill(0);
  const AY = 112;
  const frames: Frame[] = [];

  const draw = (o: { touched?: number[]; upd?: [number, number, number]; arr?: number[]; at?: number; done?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("ld", "diff", -12, 0)];
    items.push(...row("d", diff.map((v) => (v === 0 ? "0" : minus(v))), { index: true, tone: (i) => (o.touched?.includes(i) ? "accent" : o.at !== undefined && i === o.at ? "accent" : o.at !== undefined && i < o.at ? "muted" : "plain") }));
    if (o.upd) {
      const [l, r, v] = o.upd;
      items.push(spanOver("u", l, r, `${signed(v)} to every element ${l}..${r}`, { y: AY, lift: 12, tone: "ink" }));
    }
    items.push(rowLabel("la", "arr", -12, AY));
    const arr = o.arr ?? [];
    items.push(...row("a", Array.from({ length: n }, (_, i) => (i < arr.length ? minus(arr[i]) : "")), { y: AY, index: true, tone: (i) => (i >= arr.length ? "ghost" : o.done ? "strong" : i === arr.length - 1 ? "accent" : "plain") }));
    if (o.at !== undefined && !o.done) items.push(under("run", o.at, "i", { y: AY, indexed: true, tone: "ink" }));
    items.push(note("ups", `updates: ${updates.slice(0, frames.length).map(([l, r, v]) => `${signed(v)} on ${l}..${r}`).join(", ") || "none yet"}`, 0, AY + CELL + 64, { size: 12, tone: "soft" }));
    return items;
  };

  frames.push({
    caption: `To add v to every element from l to r, write +v where the change starts and −v just after it ends. diff has n + 1 = ${n + 1} slots, so a range that ends at the last index still has a slot to stop in.`,
    items: draw({}),
  });
  for (const [l, r, v] of updates) {
    diff[l] += v;
    diff[r + 1] -= v;
    frames.push({
      caption: `Add ${minus(v)} to indices ${l}..${r}: diff[${l}] ${v < 0 ? "−=" : "+="} ${Math.abs(v)} and diff[${r + 1}] ${v < 0 ? "+=" : "−="} ${Math.abs(v)}. Two writes, O(1), however long the range is.${diff[l] !== v ? ` diff[${l}] already held a change, so the two simply add up.` : ""}`,
      items: draw({ touched: [l, r + 1], upd: [l, r, v] }),
    });
  }
  const arr: number[] = [];
  let run = 0;
  for (let i = 0; i < n; i++) {
    run += diff[i];
    arr.push(run);
    const starts = updates.filter(([l]) => l === i);
    const ends = updates.filter(([, r]) => r + 1 === i);
    const name = ([l, r, v]: [number, number, number]) => `the ${signed(v)} on ${l}..${r}`;
    const step = `arr[${i}] = ${i === 0 ? "" : `${minus(arr[i - 1])} ${diff[i] < 0 ? "−" : "+"} ${Math.abs(diff[i])} = `}${minus(run)}`;
    let caption: string;
    if (i === 0) caption = `Now one running sum over diff. ${step}: ${starts.map(name).join(" and ")} starts here, and the running sum carries it to every later index until something cancels it.`;
    else if (starts.length && ends.length)
      caption = `${step}: ${starts.map(name).join(" and ")} starts and ${ends.map(name).join(" and ")} ends, so diff[${i}] = ${diff[i]} is ${[...starts.map(([, , v]) => signed(v)), ...ends.map(([, , v]) => signed(-v))].join(" and ")} netted together.`;
    else if (ends.length) caption = `${step}: ${ends.map(name).join(" and ")} ends here, cancelled by the ${signed(diff[i])} written at diff[${i}].`;
    else if (starts.length) caption = `${step}: ${starts.map(name).join(" and ")} starts here and carries forward from now on.`;
    else if (i === n - 1)
      caption = `${step}, nothing changes here. diff[${n}] = ${minus(diff[n])} would cancel an update one step past the end: that slot is never read, it only gave the last update somewhere to stop.`;
    else caption = `${step}: no update starts or stops at index ${i}, so the running value carries straight over.`;
    frames.push({ caption, items: draw({ arr: [...arr], at: i }) });
  }
  frames.push({
    caption: `arr = ${show(arr.map(minus))}. ${updates.length} updates cost ${updates.length * 2} writes plus one O(n) pass, where updating each range element by element costs up to n per update: O(n + q) instead of O(n × q).`,
    items: draw({ arr, done: true }),
  });
  return finish({ title: "Range updates in O(1) each, with a difference array", input: `n = ${n}; ${updates.map(([l, r, v]) => `${signed(v)} on ${l}..${r}`).join(", ")}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  repeats,
  ruler,
  "hash-count": hashCount,
  rectangles,
  difference,
};

