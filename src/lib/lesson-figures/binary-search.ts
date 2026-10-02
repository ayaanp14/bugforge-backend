import { finish, note, row, rowLabel, show, slotMid, slotX, spanOver, under, over, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "./kit.js";

/**
 * Binary Search: the lesson's figures (content/roadmap/binary-search.md places
 * each with "@figure <name>"). How fast halving shrinks a range, the
 * invariant on sorted bars (why it works, ending in a proof of absence), the
 * template finding a lower bound, both bounds at once, and the rotated array
 * — each computed by running the search it shows.
 */

/** Worst-case candidates before each look: n, then at most half of it, down to one. */
function halving(): Walkthrough {
  const n = 128;
  const left: number[] = [];
  for (let k = n; k >= 1; k = Math.floor(k / 2)) left.push(k);
  const looks = (m: number) => Math.floor(Math.log2(m)) + 1;
  const U = 3;
  const H = 20;
  const G = 7;
  const items: Item[] = [];
  left.forEach((v, i) => {
    const y = i * (H + G);
    items.push(label(`l${i}`, `look ${i + 1}`, -10, y + H / 2, { anchor: "end", size: 11, tone: "soft" }));
    items.push(box(`b${i}`, 0, y, "", { w: Math.max(3, v * U), h: H, tone: i === left.length - 1 ? "strong" : i === 0 ? "plain" : "accent" }));
    items.push(label(`v${i}`, `${v} left`, Math.max(3, v * U) + 8, y + H / 2, { anchor: "start", size: 11.5, mono: true, tone: "ink" }));
  });
  const y = left.length * (H + G) + 16;
  items.push(note("a", `n = 1,000,000 → ${looks(1e6)} looks; n = 10⁹ → ${looks(1e9)} looks`, 0, y, { size: 12.5, weight: 600 }));
  return finish({
    title: "Each look halves what is left, so the looks grow like log n",
    input: "",
    frames: [
      {
        caption: `Every comparison throws away the half that cannot hold the target. ${n} candidates are down to one after ${left.length - 1} halvings, so at most ${left.length} looks, where a scan could need ${n}. A million takes ${looks(1e6)}, a billion ${looks(1e9)}.`,
        items,
      },
    ],
  });
}

/**
 * The invariant on sorted bars with the target as a line: one comparison at
 * mid settles a whole side, because sorted order puts every bar on that side
 * on the same side of the line. The target is absent, so the run ends in an
 * empty range — which is the proof that it is not there.
 */
function invariant(): Walkthrough {
  const nums = [2, 5, 8, 12, 16, 23, 38, 56, 72];
  const target = 20;
  const n = nums.length;
  const U = 2.1;
  const W = 34;
  const G = 9;
  const x = (i: number) => i * (W + G);
  const ty = -target * U;
  const frames: Frame[] = [];

  const draw = (lo: number, hi: number, mid: number, o: { gone?: [number, number] } = {}): Item[] => {
    const items: Item[] = [];
    if (hi >= lo) items.push({ k: "band", id: "live", x: x(lo) - 5, y: -nums[n - 1] * U - 8, w: x(hi) + W - x(lo) + 10, h: nums[n - 1] * U + 14, tone: "accent" });
    nums.forEach((v, i) => {
      const h = Math.max(3, v * U);
      const out = i < lo || i > hi;
      const tone: Tone = i === mid ? "accent" : o.gone && i >= o.gone[0] && i <= o.gone[1] ? "muted" : out ? "muted" : "plain";
      // Values sit under the baseline, so none can collide with the target's line.
      items.push({ k: "cell", id: `b${i}`, x: x(i), y: -h, w: W, h, text: "", tone, size: 12 });
      items.push(label(`v${i}`, String(v), x(i) + W / 2, 12, { mono: true, size: 12, tone: out ? "faint" : "ink", weight: i === mid ? 700 : 500 }));
      items.push(label(`i${i}`, String(i), x(i) + W / 2, 28, { mono: true, size: 10.5, tone: "faint" }));
    });
    items.push({ k: "path", id: "base", pts: [[-6, 0], [x(n - 1) + W + 6, 0]], tone: "ink", width: 1.2 });
    items.push({ k: "path", id: "tl", pts: [[-6, ty], [x(n - 1) + W + 6, ty]], tone: "accent", dashed: true, width: 1.6 });
    items.push(label("ix", "index", -10, 28, { anchor: "end", size: 10.5, tone: "faint" }));
    items.push(label("vx", "value", -10, 12, { anchor: "end", size: 10.5, tone: "faint" }));
    items.push(label("tt", `target ${target}`, -10, ty, { anchor: "end", size: 11.5, weight: 600, tone: "accent" }));
    const ptrs: Array<[number, string]> = lo === hi ? [[lo, "lo = hi"]] : [[lo, "lo"], [hi, "hi"]];
    for (const [i, name] of ptrs) if (i >= 0 && i < n) items.push({ k: "ptr", id: name === "hi" ? "hi" : "lo", x: x(i) + W / 2, y: 40, label: name, tone: "accent", up: true });
    items.push(note("st", hi >= lo ? `still possible: indices ${lo}..${hi}` : `lo = ${lo} > hi = ${hi}: nothing left`, 0, 88, { size: 12.5, weight: 600 }));
    return items;
  };

  let lo = 0;
  let hi = n - 1;
  frames.push({
    caption: `The invariant: if ${target} is in the array, its index is between lo and hi. It starts true because lo and hi are the two ends. The dashed line is the target's height; sorted bars climb past it exactly once.`,
    items: draw(lo, hi, -1),
  });
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const v = nums[mid];
    if (v === target) break;
    if (v < target) {
      const gone: [number, number] = [lo, mid];
      lo = mid + 1;
      frames.push({
        caption: `mid = ${mid} holds ${v}, under the line. The bars are sorted, so every bar from index ${gone[0]} to ${mid} is at most ${v} — all under the line too. None can be the target, so lo jumps to ${lo} and the invariant still holds.`,
        items: draw(lo, hi, mid, { gone }),
      });
    } else {
      const gone: [number, number] = [mid, hi];
      hi = mid - 1;
      frames.push({
        caption: `mid = ${mid} holds ${v}, over the line, and so does every bar after it. ${gone[1] === gone[0] ? "That bar is" : `Those ${gone[1] - gone[0] + 1} bars are`} discarded: hi = mid − 1 = ${hi}. Each step drops mid itself as well, so the range always shrinks.`,
        items: draw(lo, hi, mid, { gone }),
      });
    }
  }
  frames.push({
    caption: `lo has passed hi: the range is empty. The invariant says ${target}, if present, lies in that empty range — so it is absent, proved after ${frames.length - 1} looks instead of ${n}. A range that shrinks every step must end.`,
    items: draw(lo, hi, -1),
  });
  return finish({ title: "Why binary search is right: what one comparison rules out", input: `nums = ${show(nums)}, target = ${target}`, frames });
}

/** The template finding the first index whose value is at least the target — a row of no … yes, read only at mid. */
function lowerBound(): Walkthrough {
  const nums = [1, 3, 3, 3, 5, 8, 8, 10];
  const target = 3;
  const n = nums.length;
  const S = { size: 38, gap: 7 };
  const CY = 64;
  const frames: Frame[] = [];
  const checked = new Map<number, boolean>();

  const draw = (lo: number, hi: number, mid: number, ans: number, o: { done?: boolean } = {}): Item[] => {
    const items: Item[] = [rowLabel("ln", "nums", -12, 0, S.size)];
    items.push(...row("c", nums, { ...S, index: true, tone: (i) => (o.done && i === ans ? "strong" : i === mid ? "accent" : i < lo || i > hi ? "muted" : "plain") }));
    items.push(rowLabel("lq", `≥ ${target}?`, -12, CY, 30));
    nums.forEach((v, i) => {
      const known = checked.has(i) || o.done;
      const yes = v >= target;
      items.push(box(`q${i}`, slotX(i, 0, S.size, S.gap), CY, known ? (yes ? "yes" : "no") : "?", { w: S.size, h: 30, size: 12, tone: !known ? "ghost" : o.done ? (i === ans ? "strong" : checked.has(i) ? (yes ? "accent" : "muted") : yes ? "plain" : "muted") : yes ? "accent" : "muted" }));
    });
    if (mid >= 0) items.push(over("mid", mid, "mid", { ...S, tone: "ink" }));
    if (!o.done) {
      if (lo === hi) items.push(under("lo", lo, "lo = hi", { ...S, y: CY - S.size + 30 }));
      else {
        if (lo < n) items.push(under("lo", lo, "lo", { ...S, y: CY - S.size + 30 }));
        if (hi >= 0) items.push(under("hi", hi, "hi", { ...S, y: CY - S.size + 30 }));
      }
    }
    items.push(note("st", o.done ? `lower bound = ${ans} (lo = ans = ${lo})` : `lo = ${lo}, hi = ${hi}${mid >= 0 ? `, mid = ${mid}` : ""}, ans = ${ans === n ? `${n} (none yet)` : ans}`, 0, CY + 30 + 44, { size: 12.5, weight: 600 }));
    return items;
  };

  let lo = 0;
  let hi = n - 1;
  let ans = n;
  frames.push({
    caption: `Ask of every index: is nums[i] ≥ ${target}? On a sorted array the answers run no, no, …, then yes to the end. The lower bound is the first yes. The search reads the answer only at mid — the rest stay unknown.`,
    items: draw(lo, hi, -1, ans),
  });
  let steps = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const yes = nums[mid] >= target;
    checked.set(mid, yes);
    steps++;
    if (yes) {
      ans = mid;
      hi = mid - 1;
      frames.push({
        caption: `mid = ${mid}: nums[${mid}] = ${nums[mid]} ≥ ${target}, a yes. It might not be the first yes, so remember it as ans = ${mid} and keep looking to the left: hi = ${hi}.`,
        items: draw(lo, hi, mid, ans),
      });
    } else {
      lo = mid + 1;
      frames.push({
        caption: `mid = ${mid}: nums[${mid}] = ${nums[mid]} < ${target}, a no — and so is everything before it. lo = mid + 1 = ${lo}.`,
        items: draw(lo, hi, mid, ans),
      });
    }
  }
  frames.push({
    caption: `The range is empty with lo = ${lo}, hi = ${hi}, and ans = ${ans}: the first ${target} is at index ${ans}, found with ${steps} looks among ${n}. Change ≥ to > and the same loop finds the upper bound.`,
    items: draw(lo, hi, -1, ans, { done: true }),
  });
  return finish({ title: "The template: find the first index where a condition turns true", input: `nums = ${show(nums)}, lower bound of ${target}`, frames });
}

/** Lower and upper bound side by side: the copies of the target sit between them; an absent target makes them equal. */
function bounds(): Walkthrough {
  const nums = [1, 3, 3, 3, 5, 8, 8, 10];
  const n = nums.length;
  const first = (p: (v: number) => boolean) => {
    const i = nums.findIndex(p);
    return i < 0 ? n : i;
  };
  const S = { size: 38, gap: 7 };
  const Y1 = 74;
  const Y2 = 128;

  const draw = (t: number): Item[] => {
    const lb = first((v) => v >= t);
    const ub = first((v) => v > t);
    const items: Item[] = [rowLabel("ln", "nums", -12, 0, S.size)];
    items.push(...row("c", nums, { ...S, index: true, tone: (i) => (i >= lb && i < ub ? "strong" : "plain") }));
    if (ub > lb) items.push(spanOver("cp", lb, ub - 1, `${ub - lb} copies of ${t}`, { ...S, tone: "accent" }));
    const cond = (y: number, id: string, text: string, p: (v: number) => boolean, at: number) => {
      items.push(rowLabel(`row-${id}`, text, -12, y, 28));
      nums.forEach((v, i) => items.push(box(`${id}${i}`, slotX(i, 0, S.size, S.gap), y, p(v) ? "yes" : "no", { w: S.size, h: 28, size: 11.5, tone: i === at ? "accent" : p(v) ? "plain" : "muted" })));
    };
    cond(Y1, "a", `≥ ${t}`, (v) => v >= t, lb);
    cond(Y2, "b", `> ${t}`, (v) => v > t, ub);
    const px = (i: number) => slotMid(i, 0, S.size, S.gap);
    const endX = px(n - 1) + S.size + S.gap;
    items.push({ k: "ptr", id: "lb", x: lb < n ? px(lb) : endX, y: Y2 + 34, label: `lower ${lb}`, tone: "accent", up: true });
    if (ub !== lb) items.push({ k: "ptr", id: "ub", x: ub < n ? px(ub) : endX, y: Y2 + 34, label: `upper ${ub}`, tone: "ink", up: true });
    items.push(
      note(
        "r",
        ub > lb ? `first ${lb}, last ${ub} − 1 = ${ub - 1}, count ${ub} − ${lb} = ${ub - lb}` : `both bounds = ${lb}: absent, insert at ${lb}`,
        0,
        Y2 + 82,
        { size: 12.5, weight: 600 },
      ),
    );
    return items;
  };

  return finish({
    title: "Lower bound and upper bound: two searches answer first, last and count",
    input: `nums = ${show(nums)}`,
    frames: [
      {
        caption: `Lower bound is the first yes to ≥ 3, upper bound the first yes to > 3. Every copy of 3 sits between them, so first = lower, last = upper − 1 and the count is upper − lower: two O(log n) searches, however many copies.`,
        items: draw(3),
      },
      {
        caption: `For 4, which is absent, the two rows agree: both bounds are 4, the slot where 4 would have to be inserted to keep the array sorted. That is Search Insert Position.`,
        items: draw(4),
      },
    ],
  });
}

/** A rotated sorted array drawn as bars: two climbing ramps with one drop. */
function rampBars(nums: readonly number[], tone: (i: number) => Tone, o: { values?: boolean } = {}): Item[] {
  const W = 36;
  const G = 9;
  const items: Item[] = [];
  nums.forEach((v, i) => {
    const h = 12 + v * 15;
    const x = i * (W + G);
    // Values under the baseline, clear of any line drawn across the bars.
    items.push({ k: "cell", id: `b${i}`, x, y: -h, w: W, h, text: "", tone: tone(i), size: 12 });
    if (o.values !== false) items.push(label(`v${i}`, String(v), x + W / 2, 12, { mono: true, size: 12, tone: "ink" }));
    items.push(label(`i${i}`, String(i), x + W / 2, 28, { mono: true, size: 10.5, tone: "faint" }));
  });
  items.push({ k: "path", id: "base", pts: [[-6, 0], [nums.length * (W + G) - G + 6, 0]], tone: "ink", width: 1.2 });
  items.push(label("vx", "value", -10, 12, { anchor: "end", size: 10.5, tone: "faint" }));
  items.push(label("ix", "index", -10, 28, { anchor: "end", size: 10.5, tone: "faint" }));
  return items;
}
const rampX = (i: number) => i * 45;
const rampMid = (i: number) => rampX(i) + 18;

/** Search in a rotated sorted array: one half around mid is always sorted, and a sorted stretch says exactly what it holds. */
function rotated(): Walkthrough {
  const nums = [4, 5, 6, 7, 0, 1, 2];
  const target = 0;
  const n = nums.length;
  const top = -(12 + Math.max(...nums) * 15);
  const frames: Frame[] = [];

  const draw = (lo: number, hi: number, mid: number, o: { sorted?: [number, number]; found?: boolean; text: string }): Item[] => {
    const items: Item[] = [];
    if (o.sorted) {
      const [a, b] = o.sorted;
      items.push({ k: "band", id: "sb", x: rampX(a) - 4, y: top - 6, w: rampX(b) + 36 - rampX(a) + 8, h: -top + 10, tone: "accent" });
      items.push({ k: "span", id: "ss", x1: rampX(a), x2: rampX(b) + 36, y: top - 14, label: `sorted: ${nums[a]} to ${nums[b]}`, tone: "accent" });
    }
    items.push(...rampBars(nums, (i) => (i === mid ? (o.found ? "strong" : "accent") : i < lo || i > hi ? "muted" : "plain")));
    if (lo === hi) items.push({ k: "ptr", id: "lo", x: rampMid(lo), y: 40, label: "lo = hi", tone: "accent", up: true });
    else if (lo <= hi) {
      items.push({ k: "ptr", id: "lo", x: rampMid(lo), y: 40, label: "lo", tone: "accent", up: true });
      items.push({ k: "ptr", id: "hi", x: rampMid(hi), y: 40, label: "hi", tone: "accent", up: true });
    }
    items.push(note("t", o.text, 0, 88, { size: 12.5, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `A sorted array cut and swapped: two climbing ramps with one drop between them. The whole array is not sorted, but cut it anywhere and at least one side of the cut has no drop in it — that side is sorted.`,
    items: draw(0, n - 1, -1, { text: `target = ${target}` }),
  });
  let lo = 0;
  let hi = n - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) {
      frames.push({
        caption: `mid = ${mid} holds ${nums[mid]}: found at index ${mid} in ${frames.length} looks. Each look discarded half the range, so a rotated array still costs O(log n).`,
        items: draw(lo, hi, mid, { found: true, text: `nums[${mid}] = ${target}: found` }),
      });
      break;
    }
    const leftSorted = nums[lo] <= nums[mid];
    const [a, b] = leftSorted ? [lo, mid] : [mid, hi];
    const inside = leftSorted ? nums[lo] <= target && target < nums[mid] : nums[mid] < target && target <= nums[hi];
    const before = { lo, hi };
    if (leftSorted) {
      if (inside) hi = mid - 1;
      else lo = mid + 1;
    } else if (inside) lo = mid + 1;
    else hi = mid - 1;
    frames.push({
      caption: `mid = ${mid} holds ${nums[mid]}. nums[lo] = ${nums[before.lo]} ≤ ${nums[mid]}${leftSorted ? "" : " is false"}, so ${leftSorted ? `lo..mid` : `mid..hi`} is the sorted side and holds exactly the values ${nums[a]} to ${nums[b]}. ${target} is ${inside ? "inside" : "not inside"}, so ${inside === leftSorted ? `search left: hi = ${hi}` : `search right: lo = ${lo}`}.`,
      items: draw(lo, hi, mid, { sorted: [a, b], text: `${target} in ${nums[a]}..${nums[b]}? ${inside ? "yes" : "no"}` }),
    });
  }
  return finish({ title: "Search in a rotated sorted array: trust the half that is sorted", input: `nums = ${show(nums)}, target = ${target}`, frames });
}

/** The minimum of a rotated array is the first index whose value is at most the last one — the template's condition. */
function rotatedMin(): Walkthrough {
  const nums = [4, 5, 6, 7, 0, 1, 2];
  const n = nums.length;
  const last = nums[n - 1];
  const min = nums.findIndex((v) => v <= last);
  const ly = -(12 + last * 15);
  const S = 36;
  const items: Item[] = [...rampBars(nums, (i) => (i === min ? "strong" : nums[i] <= last ? "accent" : "plain"))];
  items.push({ k: "path", id: "ll", pts: [[-6, ly], [rampX(n - 1) + S + 6, ly]], tone: "accent", dashed: true, width: 1.6 });
  items.push(label("lt", `last = ${last}`, -10, ly, { anchor: "end", size: 11.5, weight: 600, tone: "accent" }));
  items.push(label("lq", `≤ ${last}?`, -10, 57, { anchor: "end", size: 11.5, tone: "soft" }));
  nums.forEach((v, i) => items.push(box(`q${i}`, rampX(i), 44, v <= last ? "yes" : "no", { w: S, h: 26, size: 11.5, tone: i === min ? "strong" : v <= last ? "accent" : "muted" })));
  items.push(note("r", `first yes = index ${min}: the minimum, ${nums[min]}`, 0, 96, { size: 12.5, weight: 600 }));
  return finish({
    title: "Finding the rotation point: the first value at most the last one",
    input: `nums = ${show(nums)}`,
    frames: [
      {
        caption: `Every value of the left ramp is above the last value, ${last}; every value of the right ramp is at most ${last}. So "nums[i] ≤ ${last}?" is no, …, no, then yes to the end, and the template's first yes, index ${min}, is the minimum.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  halving,
  invariant,
  "lower-bound": lowerBound,
  bounds,
  rotated,
  "rotated-min": rotatedMin,
};

