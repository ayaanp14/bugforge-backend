import { CELL, finish, note, row, rowLabel, slotMid, slotX, spanOver, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Kadane's Algorithm: the lesson's figures (content/roadmap/kadanes-algorithm.md
 * places each with "@figure <name>"). The problem as signed bars, every
 * subarray as a triangle whose columns are Kadane's states (why it works),
 * the all-negative trap, the prefix-sum view, and the circular and product
 * variants — each computed by running the algorithm on its example.
 */

const NUMS = [-2, 1, -3, 4, -1, 2, 1, -5, 4];

/** A number as the page prints it, with a real minus sign. */
const fmt = (v: number) => (v < 0 ? `−${-v}` : String(v));
const fmtAll = (xs: readonly number[]) => `[${xs.map(fmt).join(", ")}]`;

/** Kadane over xs: cur after each index, where each run starts, and the best (sum, start, end). */
function kadane(xs: readonly number[]) {
  const cur: number[] = [xs[0]];
  const start: number[] = [0];
  let best = { sum: xs[0], start: 0, end: 0 };
  for (let i = 1; i < xs.length; i++) {
    if (cur[i - 1] < 0) {
      cur.push(xs[i]);
      start.push(i);
    } else {
      cur.push(cur[i - 1] + xs[i]);
      start.push(start[i - 1]);
    }
    if (cur[i] > best.sum) best = { sum: cur[i], start: start[i], end: i };
  }
  return { cur, start, best };
}

/** The problem: the numbers as bars above and below zero, and the stretch with the largest sum. */
function problem(): Walkthrough {
  const { best } = kadane(NUMS);
  const U = 13;
  const W = 34;
  const G = 8;
  const top = Math.max(...NUMS) * U;
  const bottom = -Math.min(...NUMS) * U;
  const x = (i: number) => i * (W + G);
  const items: Item[] = [];
  items.push({ k: "band", id: "bestband", x: x(best.start) - 5, y: -top - 6, w: x(best.end) + W - x(best.start) + 10, h: top + bottom + 12, tone: "accent" });
  NUMS.forEach((v, i) => {
    const h = Math.max(2, Math.abs(v) * U);
    const inBest = i >= best.start && i <= best.end;
    const tone: Tone = inBest ? "strong" : "plain";
    items.push({ k: "cell", id: `b${i}`, x: x(i), y: v >= 0 ? -h : 0, w: W, h, text: h >= 22 ? fmt(v) : "", tone, size: 12 });
    if (h < 22) items.push(label(`v${i}`, fmt(v), x(i) + W / 2, v >= 0 ? -h - 9 : h + 9, { mono: true, size: 11.5, tone: "ink" }));
    items.push(label(`i${i}`, String(i), x(i) + W / 2, bottom + 22, { mono: true, size: 10.5, tone: "faint" }));
  });
  items.push({ k: "path", id: "zero", pts: [[-6, 0], [x(NUMS.length - 1) + W + 6, 0]], tone: "ink", width: 1.2 });
  items.push(label("z", "0", -10, 0, { anchor: "end", mono: true, size: 11, tone: "faint" }));
  items.push(label("ix", "index", -10, bottom + 22, { anchor: "end", size: 10.5, tone: "faint" }));
  const parts = NUMS.slice(best.start, best.end + 1);
  items.push({ k: "span", id: "s", x1: x(best.start), x2: x(best.end) + W, y: -top - 16, label: `${parts.map(fmt).join(" + ").replace(/\+ −/g, "− ")} = ${best.sum}`, tone: "accent" });
  return finish({
    title: "The maximum subarray: the contiguous stretch with the largest sum",
    input: `nums = ${fmtAll(NUMS)}`,
    frames: [
      {
        caption: `The best stretch is index ${best.start} to ${best.end}, with sum ${best.sum}. It keeps the −1 inside it, because the numbers either side more than pay for it, and it stops before the −5, which nothing after it earns back.`,
        items,
      },
    ],
  });
}

/**
 * Every subarray as a cell of a triangle — start by row, end by column. Each
 * column is "every subarray ending here", and column j is column j − 1 with
 * nums[j] added to every cell, plus nums[j] alone. So the best of column j is
 * the best of column j − 1 plus nums[j], or nums[j] alone: Kadane's update.
 */
function columns(): Walkthrough {
  const n = NUMS.length;
  const { cur, start, best } = kadane(NUMS);
  const sum = (i: number, j: number) => NUMS.slice(i, j + 1).reduce((a, b) => a + b, 0);
  const W = 38;
  const H = 24;
  const G = 4;
  const cx = (j: number) => j * (W + G);
  const cy = (i: number) => i * (H + G);
  const HY = -62;
  const CY = cy(n) + 10;
  const total = (n * (n + 1)) / 2;
  const frames: Frame[] = [];

  const draw = (j: number, o: { done?: boolean } = {}): Item[] => {
    const items: Item[] = [label("lh", "nums", -10, HY + H / 2, { anchor: "end", size: 11.5 })];
    NUMS.forEach((v, c) => items.push(box(`h${c}`, cx(c), HY, fmt(v), { w: W, h: H, size: 12.5, tone: c === j && !o.done ? "accent" : "plain" })));
    NUMS.forEach((_, c) => items.push(label(`hc${c}`, `end ${c}`, cx(c) + W / 2, HY - 12, { size: 10.5, tone: "faint" })));
    for (let i = 0; i < n; i++) {
      items.push(label(`r${i}`, `from ${i}`, -10, cy(i) + H / 2, { anchor: "end", size: 10.5, tone: "faint" }));
      for (let c = i; c < n; c++) {
        let tone: Tone;
        if (j < 0) tone = i === best.start && c === best.end ? "strong" : "plain";
        else if (o.done) tone = i === best.start && c === best.end ? "strong" : i === start[c] ? "accent" : "muted";
        else if (c === j) tone = i === start[j] ? "strong" : "accent";
        else if (c === j - 1) tone = i === start[j - 1] ? "accent" : "plain";
        else tone = "muted";
        items.push(box(`t${i}-${c}`, cx(c), cy(i), fmt(sum(i, c)), { w: W, h: H, size: 12, tone }));
      }
    }
    if (j > 0 && !o.done) items.push(arrow("add", { x: cx(j - 1) + W / 2, y: HY + H + 4 }, { x: cx(j) + W / 2, y: HY + H + 4 }, { tone: "accent", bow: 10, label: `${NUMS[j] < 0 ? "−" : "+"}${Math.abs(NUMS[j])}` }));
    if (j >= 0 || o.done) {
      const upto = o.done ? n - 1 : j;
      items.push(label("lc", "cur", -10, CY + H / 2, { anchor: "end", size: 11.5, weight: 600, tone: "ink" }));
      for (let c = 0; c <= upto; c++) items.push(box(`c${c}`, cx(c), CY, fmt(cur[c]), { w: W, h: H, size: 12.5, tone: o.done ? (c === best.end ? "strong" : "plain") : c === j ? "accent" : "plain" }));
    }
    const shown = o.done ? best : j >= 0 ? kadane(NUMS.slice(0, j + 1)).best : null;
    items.push(note("st", j < 0 && !o.done ? `${total} subarrays, ${total} sums to check` : `best so far = ${shown!.sum} (from ${shown!.start} to ${shown!.end})`, 0, CY + H + 22, { weight: 600, size: 12.5 }));
    return items;
  };

  frames.push({
    caption: `Every subarray as one cell: the row is where it starts, the column where it ends, the number its sum. Brute force reads all ${total} — five billion for n = 100,000. The best is ${best.sum}, from ${best.start} to ${best.end}.`,
    items: draw(-1),
  });
  frames.push({
    caption: `Column 0 holds the subarrays that end at index 0: just ${fmt(NUMS[0])} itself. So the best sum ending at 0 is cur = ${fmt(cur[0])}, and the best so far is the same.`,
    items: draw(0),
  });
  for (let j = 1; j < n; j++) {
    const prev = cur[j - 1];
    const x = NUMS[j];
    const restart = prev < 0;
    const newBest = cur[j] > Math.max(...cur.slice(0, j));
    const caption = restart
      ? `Column ${j} is every cell of column ${j - 1} plus ${fmt(x)}, and ${fmt(x)} alone at the bottom. Column ${j - 1}'s best is ${fmt(prev)}, a negative, so adding it only hurts: the best here is ${fmt(x)} alone. cur restarts at ${j}.`
      : `Every cell of column ${j - 1} gains the same ${fmt(x)}, so its best cell stays the best: ${fmt(prev)} ${x < 0 ? "−" : "+"} ${Math.abs(x)} = ${fmt(cur[j])}, more than ${fmt(x)} alone. The run from ${start[j]} extends${newBest ? `, and ${fmt(cur[j])} is a new best` : cur[j] < 0 ? ", but its sum is now negative: a debt the next column will refuse" : x < 0 ? " and pays for the negative" : ""}.`;
    frames.push({ caption, items: draw(j) });
  }
  frames.push({
    caption: `The cur row holds each column's best, each found from the one before in O(1). Every subarray ends somewhere, so the answer is the largest of them, ${best.sum}. One pass, two variables: O(n) time, O(1) space.`,
    items: draw(n - 1, { done: true }),
  });
  return finish({ title: "Why Kadane works: each column of all subarrays is the last one plus one number", input: `nums = ${fmtAll(NUMS)}`, frames });
}

/** The shortcut that starts at 0 returns the empty subarray on an all-negative array; starting at nums[0] does not. */
function allNegative(): Walkthrough {
  const nums = [-3, -1, -2];
  const short: number[] = [];
  let c = 0;
  let bShort = 0;
  for (const x of nums) {
    c = Math.max(0, c + x);
    short.push(c);
    bShort = Math.max(bShort, c);
  }
  const right = kadane(nums);
  const Y1 = 80;
  const Y2 = 156;
  const RX = slotX(nums.length) + 10;
  const items: Item[] = [
    rowLabel("ln", "nums", -12, 0),
    ...row("n", nums.map(fmt)),
    label("t1", "cur = max(0, cur + x), best starts at 0", 0, Y1 - 14, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }),
    rowLabel("l1", "cur", -12, Y1),
    ...row("a", short.map(fmt), { y: Y1, tone: () => "muted" }),
    label("r1", `best = ${bShort}: the empty subarray`, RX, Y1 + CELL / 2, { anchor: "start", size: 12, tone: "error", weight: 600 }),
    label("t2", "cur = max(x, cur + x), both start at nums[0]", 0, Y2 - 14, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }),
    rowLabel("l2", "cur", -12, Y2),
    ...row("b", right.cur.map(fmt), { y: Y2, tone: (i) => (i === right.best.end ? "strong" : "plain") }),
    label("r2", `best = ${fmt(right.best.sum)}: nums[${right.best.end}] alone`, RX, Y2 + CELL / 2, { anchor: "start", size: 12, tone: "accent", weight: 600 }),
  ];
  return finish({
    title: "The all-negative trap: never let the run fall back to an empty 0",
    input: `nums = ${fmtAll(nums)}`,
    frames: [
      {
        caption: `Clamping the run at 0 makes every value 0, so the shortcut answers ${bShort} — the sum of no elements, which a subarray may not be. Starting both values at nums[0] keeps real sums, and the answer is ${fmt(right.best.sum)}, the least negative number.`,
        items,
      },
    ],
  });
}

/**
 * The prefix-sum view: P[k] as a line, the lowest point so far as a dashed
 * staircase, and the best subarray as the largest rise above an earlier low.
 */
function prefixView(): Walkthrough {
  const n = NUMS.length;
  const P = NUMS.reduce<number[]>((p, x) => [...p, p[p.length - 1] + x], [0]);
  const { best, start } = kadane(NUMS);
  const SX = 40;
  const SY = 22;
  const lo = Math.min(...P) - 1;
  const hi = Math.max(...P) + 1;
  const px = (k: number) => k * SX;
  const py = (v: number) => (hi - v) * SY;
  const lows: number[] = [];
  const minSoFar: number[] = [];
  P.forEach((v, k) => {
    const before = k === 0 ? Infinity : minSoFar[k - 1];
    minSoFar.push(Math.min(before, v));
    if (k > 0 && v < before) lows.push(k);
  });
  const restarts = start.flatMap((s, i) => (i > 0 && s === i ? [i] : []));
  // The best rise: P[end + 1] minus the lowest P at or before the start.
  const from = best.start;
  const to = best.end + 1;

  const draw = (stage: number): Item[] => {
    const items: Item[] = [];
    items.push({ k: "path", id: "ax", pts: [[px(0) - 8, py(0)], [px(n) + 8, py(0)]], tone: "faint", width: 1 });
    items.push(label("zl", "0", px(0) - 18, py(0), { anchor: "end", mono: true, size: 10.5, tone: "faint" }));
    if (stage >= 1) {
      const F = 16;
      const pts: Array<[number, number]> = [[px(0) - 14, py(minSoFar[0]) + F]];
      minSoFar.forEach((m, k) => {
        if (k > 0 && m < minSoFar[k - 1]) pts.push([px(k) - 20, py(minSoFar[k - 1]) + F], [px(k) - 20, py(m) + F]);
      });
      pts.push([px(n) + 14, py(minSoFar[n]) + F]);
      items.push({ k: "path", id: "min", pts, tone: "accent", dashed: true, width: 1.6 });
      items.push(label("ml", "lowest so far", px(n) + 14, py(minSoFar[n]) + 7, { anchor: "end", size: 10.5, tone: "accent" }));
    }
    items.push({ k: "path", id: "line", pts: P.map((v, k) => [px(k), py(v)] as [number, number]), tone: "ink", width: 1.6 });
    if (stage >= 2) {
      items.push({ k: "path", id: "base", pts: [[px(from), py(P[from])], [px(to), py(P[from])]], tone: "accent", dashed: true, width: 1.2 });
      items.push({ k: "edge", id: "rise", x1: px(to), y1: py(P[from]), x2: px(to), y2: py(P[to]) + 13, tone: "accent", arrow: true });
      items.push(label("rl", `rise ${P[to] - P[from]}`, px(to) - 6, (py(P[from]) + py(P[to])) / 2 + 10, { anchor: "end", size: 11.5, weight: 600, tone: "accent" }));
    }
    P.forEach((v, k) => {
      const tone: Tone = stage >= 2 && (k === from || k === to) ? "strong" : stage >= 1 && lows.includes(k) ? "accent" : "plain";
      // An opaque disc under each point, so the line never shows through a tinted one.
      items.push({ k: "node", id: `pb${k}`, x: px(k), y: py(v), r: 11, text: "", tone: "plain" });
      items.push({ k: "node", id: `p${k}`, x: px(k), y: py(v), r: 11, text: fmt(v), tone, size: 10.5 });
      items.push(label(`k${k}`, String(k), px(k), py(lo) + 22, { mono: true, size: 10.5, tone: "faint" }));
    });
    items.push(label("kl", "k", px(0) - 18, py(lo) + 22, { anchor: "end", size: 10.5, tone: "faint" }));
    items.push(label("pl", "P[k]", px(0) - 18, py(P[0]) - 22, { anchor: "end", size: 11, tone: "soft", weight: 600 }));
    return items;
  };

  return finish({
    title: "The prefix-sum view: the best subarray is the largest rise above an earlier low",
    input: `nums = ${fmtAll(NUMS)}; P = ${fmtAll(P)}`,
    frames: [
      {
        caption: `P[k] is the sum of the first k numbers, drawn as a line. The sum of nums[i..j] is P[j + 1] − P[i]: how far the line climbs from point i to the later point j + 1.`,
        items: draw(0),
      },
      {
        caption: `For a fixed end, the best start is the lowest point before it. The dashed line tracks that low; it drops at k = ${lows.join(" and k = ")}, exactly the indices where Kadane restarts (${restarts.join(" and ")}).`,
        items: draw(1),
      },
      {
        caption: `The largest climb above the running low is ${P[to] - P[from]}, from P[${from}] = ${fmt(P[from])} to P[${to}] = ${fmt(P[to])}: nums[${best.start}..${best.end}] again. With prices in place of P, this is Best Time to Buy and Sell Stock.`,
        items: draw(2),
      },
    ],
  });
}

/** Maximum circular subarray: the best straight run, the smallest middle, and the wrap that keeps everything but that middle. */
function circular(): Walkthrough {
  const nums = [5, -3, -2, 6, -8, 4, 3];
  const n = nums.length;
  const max = kadane(nums).best;
  const neg = kadane(nums.map((v) => -v)).best;
  const min = { sum: -neg.sum, start: neg.start, end: neg.end };
  const total = nums.reduce((a, b) => a + b, 0);
  const wrap = total - min.sum;
  const answer = max.sum < 0 ? max.sum : Math.max(max.sum, wrap);
  const back = (y: number, tone: "accent" | "ink"): Item =>
    arrow("wrap", { x: slotMid(n - 1), y: y + CELL + 22 }, { x: slotMid(0), y: y + CELL + 22 }, { tone, bow: -26 });

  const draw = (stage: number): Item[] => {
    const items: Item[] = [rowLabel("ln", "nums", -12, 0)];
    const tone = (i: number): Tone => {
      if (stage === 0) return i >= max.start && i <= max.end ? "strong" : "plain";
      if (stage === 1) return i >= min.start && i <= min.end ? "accent" : "plain";
      return i >= min.start && i <= min.end ? "muted" : "strong";
    };
    items.push(...row("n", nums.map(fmt), { index: true, tone }));
    if (stage === 0) items.push(spanOver("s", max.start, max.end, `straight: ${nums.slice(max.start, max.end + 1).map(fmt).join(" + ")} = ${max.sum}`));
    if (stage === 1) items.push(spanOver("s", min.start, min.end, `smallest middle = ${fmt(min.sum)}`, { tone: "ink" }));
    if (stage === 2) {
      items.push(spanOver("s", min.start, min.end, "left out", { tone: "ink" }));
      items.push(back(0, "accent"));
    } else items.push(back(0, "ink"));
    items.push(note("r1", `total = ${total}`, 0, CELL + 80, { size: 12.5, tone: "soft" }));
    items.push(note("r2", stage === 0 ? `ordinary Kadane: best = ${max.sum}` : stage === 1 ? `Kadane with min: smallest = ${fmt(min.sum)}` : `wrap = ${total} − (${fmt(min.sum)}) = ${wrap}`, 0, CELL + 102, { weight: 600 }));
    return items;
  };

  return finish({
    title: "Maximum circular subarray: everything except the smallest middle",
    input: `nums = ${fmtAll(nums)} (the end wraps round to the start)`,
    frames: [
      {
        caption: `A best subarray either stays inside the array or wraps past the end. The first kind is ordinary Kadane: here ${nums.slice(max.start, max.end + 1).map(fmt).join(" + ")} = ${max.sum}.`,
        items: draw(0),
      },
      {
        caption: `A wrapping subarray keeps both ends and leaves out a middle stretch, so the best one leaves out the middle with the smallest sum. Kadane with min in place of max finds it in the same pass: ${fmt(min.sum)}.`,
        items: draw(1),
      },
      {
        caption: `Everything else is the wrapping run, worth total − smallest = ${total} − (${fmt(min.sum)}) = ${wrap}, more than ${max.sum}. Answer ${answer}. If every number were negative, the smallest middle would be the whole array, so then use the ordinary maximum.`,
        items: draw(2),
      },
    ],
  });
}

/** Maximum product subarray: carry the largest and the smallest product ending here; a negative factor swaps their roles. */
function product(): Walkthrough {
  const nums = [2, 3, -2, 4, -1];
  const n = nums.length;
  const his: number[] = [nums[0]];
  const los: number[] = [nums[0]];
  const from: Array<{ hi: "hi" | "lo" | "x"; lo: "hi" | "lo" | "x" }> = [{ hi: "x", lo: "x" }];
  let best = nums[0];
  const bests = [best];
  for (let i = 1; i < n; i++) {
    const x = nums[i];
    let h = his[i - 1];
    let l = los[i - 1];
    let hs: "hi" | "lo" = "hi";
    let ls: "hi" | "lo" = "lo";
    if (x < 0) {
      [h, l] = [l, h];
      [hs, ls] = [ls, hs];
    }
    const nh = Math.max(x, h * x);
    const nl = Math.min(x, l * x);
    his.push(nh);
    los.push(nl);
    from.push({ hi: nh === h * x ? hs : "x", lo: nl === l * x ? ls : "x" });
    best = Math.max(best, nh);
    bests.push(best);
  }
  const HY = 74;
  const LY = 140;
  const SG = 30;
  const frames: Frame[] = [];

  const draw = (i: number, done = false): Item[] => {
    const R = { gap: SG };
    const items: Item[] = [rowLabel("ln", "nums", -12, 0), ...row("n", nums.map(fmt), { ...R, index: true, tone: (k) => (k === i && !done ? "accent" : "plain") })];
    items.push(rowLabel("lh", "hi", -12, HY), rowLabel("ll", "lo", -12, LY));
    items.push(...row("h", his.map((v, k) => (k <= i ? fmt(v) : "")), { ...R, y: HY, tone: (k) => (k > i ? "ghost" : done && his[k] === best ? "strong" : k === i && !done ? "accent" : "plain") }));
    items.push(...row("l", los.map((v, k) => (k <= i ? fmt(v) : "")), { ...R, y: LY, tone: (k) => (k > i ? "ghost" : k === i && !done ? "accent" : "plain") }));
    if (i > 0 && !done) {
      const f = from[i];
      const yOf = (r: "hi" | "lo") => (r === "hi" ? HY : LY) + CELL / 2;
      const x1 = slotX(i - 1, 0, CELL, SG) + CELL + 3;
      const x2 = slotX(i, 0, CELL, SG) - 3;
      if (f.hi !== "x") items.push(arrow("ah", { x: x1, y: yOf(f.hi) }, { x: x2, y: HY + CELL / 2 + (f.hi === "lo" ? 8 : 0) }, { tone: f.hi === "lo" ? "accent" : "ink" }));
      if (f.lo !== "x") items.push(arrow("al", { x: x1, y: yOf(f.lo) }, { x: x2, y: LY + CELL / 2 - (f.lo === "hi" ? 8 : 0) }, { tone: f.lo === "hi" ? "accent" : "ink" }));
    }
    items.push(note("b", `best = ${fmt(bests[i])}`, 0, LY + CELL + 30, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `hi is the largest product of a subarray ending here, lo the smallest. Both start at ${nums[0]}. Two values are needed because a negative factor can turn the smallest product into the largest.`,
    items: draw(0),
  });
  for (let i = 1; i < n; i++) {
    const x = nums[i];
    const ph = his[i - 1];
    const pl = los[i - 1];
    const more = his[i] > bests[i - 1] ? ` ${fmt(his[i])} is a new best.` : "";
    const caption =
      x < 0
        ? `${fmt(x)} is negative, so the old lo now makes the largest product and the old hi the smallest: hi = max(${fmt(x)}, ${fmt(pl)} × ${fmt(x)}) = ${fmt(his[i])}, lo = min(${fmt(x)}, ${fmt(ph)} × ${fmt(x)}) = ${fmt(los[i])}.${more}`
        : `${fmt(x)} is positive, so each keeps its role: hi = max(${fmt(x)}, ${fmt(ph)} × ${fmt(x)}) = ${fmt(his[i])}, lo = min(${fmt(x)}, ${fmt(pl)} × ${fmt(x)}) = ${fmt(los[i])}.${more}`;
    frames.push({ caption, items: draw(i) });
  }
  frames.push({
    caption: `The best product is ${fmt(best)}: lo carried ${fmt(los[n - 2])} until the last negative flipped it. With only hi, that product would have been thrown away, and the answer would be wrong.`,
    items: draw(n - 1, true),
  });
  return finish({ title: "Maximum product subarray: carry the largest and the smallest", input: `nums = ${fmtAll(nums)}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  problem,
  columns,
  "all-negative": allNegative,
  "prefix-view": prefixView,
  circular,
  product,
};

