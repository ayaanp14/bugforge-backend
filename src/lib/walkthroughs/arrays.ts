import { CELL, GAP, and, bandOver, finish, note, over, row, rowLabel, show, slotMid, slotX, spanOver, under, type Frame, type Item, type Tone, type Walkthrough } from "./core.js";

/**
 * The array and sorting topics: one small example each, run for real and
 * recorded step by step (see core.ts for the item model and reference.ts
 * for the shape every generator follows). Where a value moves — a number
 * gliding to its sorted slot, into a bucket, up a merge level — its cell is
 * keyed by its index in the input, so the page animates the move instead of
 * swapping one number for another.
 */

/** A cell anywhere: what the row() helper draws, for layouts that are not a single row. */
const box = (id: string, x: number, y: number, text: string, tone: Tone = "plain", w = CELL, h = CELL, size?: number): Item =>
  size ? { k: "cell", id, x, y, w, h, text, tone, size } : { k: "cell", id, x, y, w, h, text, tone };

/** The faint index under slot i, for rows whose cells are keyed by something other than their position. */
const indexAt = (id: string, i: number, y: number): Item => ({ k: "text", id, x: slotMid(i), y: y + CELL + 11, text: String(i), tone: "faint", size: 10 });

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const theN = (n: number, noun: string) => (n === 1 ? `the one ${noun}` : `the ${n} ${noun}s`);
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;

/* ── arrays: best time to buy and sell stock ──────────────────────── */

/** One pass that remembers the cheapest day so far and the best profit: selling on day i can only beat the best by buying at that cheapest day. */
function buyAndSellStock(): Walkthrough {
  const prices = [7, 1, 5, 3, 6, 4];
  const frames: Frame[] = [];
  let min = -1;
  let best = 0;
  let buy = -1;
  let sell = -1;
  const NY = CELL + 62;

  const draw = (i: number, o: { answer?: boolean; today?: string } = {}): Item[] => {
    const lo = o.answer ? buy : min;
    const hi = o.answer ? sell : i;
    const items: Item[] = [];
    if (lo >= 0 && hi > lo) items.push(bandOver("hold", lo, hi, { tone: o.answer ? "strong" : "accent" }));
    items.push(rowLabel("lbl", "price", -10, 0));
    items.push(
      ...row("p", prices, {
        index: true,
        tone: (k) => (o.answer ? (k === buy || k === sell ? "strong" : "plain") : k === i || k === min ? "accent" : k < i ? "muted" : "plain"),
      }),
    );
    if (lo >= 0) items.push(under("min", lo, o.answer ? "buy" : "min", { indexed: true }));
    if (hi >= 0) items.push(over("day", hi, o.answer ? "sell" : "i", { tone: "ink" }));
    items.push(note("cheap", `cheapest so far: ${min >= 0 ? `${prices[min]} (day ${min})` : "—"}`, 0, NY, { tone: "soft", size: 12 }));
    items.push(note("today", o.answer ? `trade: ${o.today}` : `sell today: ${o.today ?? "—"}`, 0, NY + 20, { tone: "soft", size: 12 }));
    items.push(note("best", `best profit: ${best}${best ? ` (buy day ${buy}, sell day ${sell})` : ""}`, 0, NY + 42, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `Selling on day i earns prices[i] minus the cheapest price before it. So one pass only has to remember two numbers: the cheapest price so far and the best profit so far.`,
    items: draw(-1),
  });
  let explained = false;
  prices.forEach((p, i) => {
    if (min < 0) {
      min = i;
      frames.push({ caption: `Day ${i} costs ${p}. Nothing came before it, so ${p} is the cheapest price so far and there is nothing to sell yet.`, items: draw(i) });
      return;
    }
    if (p < prices[min]) {
      const old = prices[min];
      min = i;
      frames.push({
        caption: `Day ${i} costs ${p}, below the old cheapest ${old}, so day ${i} becomes the day to buy. Selling on the day you buy earns nothing, and the best profit stays ${best}.`,
        items: draw(i, { today: `${p} − ${p} = 0` }),
      });
      return;
    }
    const gain = p - prices[min];
    const grew = gain > best;
    if (grew) {
      best = gain;
      buy = min;
      sell = i;
    }
    const why = explained ? "" : ` Earlier days other than the cheapest can be forgotten: none of them is a better day to buy.`;
    explained = true;
    frames.push({
      caption: grew
        ? `Day ${i} costs ${p}. Buying at the cheapest earlier price (${prices[min]}, day ${min}) and selling today earns ${p} − ${prices[min]} = ${gain}, so best = ${gain}.${why}`
        : `Day ${i} costs ${p}: selling today would earn ${gain}, less than the best ${best}, and ${p} is not below ${prices[min]}, so neither number changes.${why}`,
      items: draw(i, { today: `${p} − ${prices[min]} = ${gain}` }),
    });
  });
  frames.push({
    caption: `The best trade is to buy on day ${buy} at ${prices[buy]} and sell on day ${sell} at ${prices[sell]}, a profit of ${best}. Each day was looked at once with two numbers kept, so it is O(n) time and O(1) space.`,
    items: draw(prices.length - 1, { answer: true, today: `${prices[sell]} − ${prices[buy]} = ${best}` }),
  });
  return finish({ title: "Best time to buy and sell stock, with one pass and a running minimum", input: `prices = ${show(prices)}`, frames });
}

/* ── two pointers: pair with a target sum ─────────────────────────── */

/** Sorted input, a pointer at each end: a sum too big rules out the right number for good, a sum too small the left one. */
function pairWithTargetSum(): Walkthrough {
  const nums = [1, 2, 4, 6, 8, 11, 15];
  const target = 14;
  const n = nums.length;
  const frames: Frame[] = [];
  const pairs = (l: number, r: number) => ((r - l + 1) * (r - l)) / 2;
  const total = pairs(0, n - 1);
  const NY = CELL + 62;

  const draw = (l: number, r: number, o: { sum?: boolean; found?: boolean } = {}): Item[] => {
    const items: Item[] = [bandOver("live", l, r, { tone: o.found ? "strong" : "accent" })];
    items.push(rowLabel("lbl", "nums", -10, 0));
    items.push(...row("c", nums, { index: true, tone: (k) => (k < l || k > r ? "muted" : (k === l || k === r) && o.found ? "strong" : (k === l || k === r) && o.sum ? "accent" : "plain") }));
    items.push(under("L", l, "left", { indexed: true }));
    items.push(over("R", r, "right", { tone: "ink" }));
    const s = nums[l] + nums[r];
    items.push(note("sum", o.sum ? `${nums[l]} + ${nums[r]} = ${s}${s > target ? ` > ${target}` : s < target ? ` < ${target}` : ", the target"}` : `target = ${target}`, 0, NY, { weight: 600 }));
    items.push(note("left", `pairs still possible: ${pairs(l, r)} of ${total}`, 0, NY + 22, { tone: "soft", size: 12 }));
    return items;
  };

  let l = 0;
  let r = n - 1;
  let steps = 0;
  frames.push({
    caption: `The array is sorted, so left starts at the smallest number and right at the largest. All ${total} pairs are still possible, and each comparison will rule out a whole group of them at once.`,
    items: draw(l, r),
  });
  let moved = "";
  while (l < r) {
    const s = nums[l] + nums[r];
    steps++;
    if (s === target) break;
    if (s > target) {
      frames.push({
        caption: `${moved}${nums[l]} + ${nums[r]} = ${s} is more than ${target}. ${nums[l]} is the smallest number left, so ${nums[r]} is too big with any partner: no pair can use it, and right steps left.`,
        items: draw(l, r, { sum: true }),
      });
      const gone = r - l;
      r--;
      moved = `right moves to ${nums[r]}, ruling out ${gone} pairs at once. `;
    } else {
      frames.push({
        caption: `${moved}${nums[l]} + ${nums[r]} = ${s} is less than ${target}. ${nums[r]} is the largest number left, so ${nums[l]} is too small with any partner, and left steps right.`,
        items: draw(l, r, { sum: true }),
      });
      const gone = r - l;
      l++;
      moved = `left moves to ${nums[l]}, ruling out ${gone} pairs at once. `;
    }
  }
  if (l >= r) throw new Error("two-pointers example has no pair");
  frames.push({
    caption: `${moved}${nums[l]} + ${nums[r]} = ${target}: found, at indices ${l} and ${r}. Every step threw one number out for good, so it took ${steps} comparisons instead of ${total} — O(n) time, O(1) space.`,
    items: draw(l, r, { sum: true, found: true }),
  });
  return finish({ title: "Pair with a target sum in a sorted array, with two pointers", input: `nums = ${show(nums)}, target = ${target}`, frames });
}

/* ── prefix sum: build once, answer a range in one subtraction ────── */

/** prefix[k] is the sum of the first k numbers; a range [l, r] is prefix[r + 1] − prefix[l]. */
function rangeSumWithPrefix(): Walkthrough {
  const nums = [2, 4, 1, 3, 5, 2];
  const n = nums.length;
  const ql = 1;
  const qr = 4;
  const prefix: number[] = [0];
  const frames: Frame[] = [];
  // prefix[k] is drawn under the boundary before nums[k]: half a slot to the left.
  const PX = -(CELL + GAP) / 2;
  const PY = 84;
  const LX = PX - 10;
  const NY = PY + CELL + 42;

  const draw = (o: { cover?: number; query?: boolean; answer?: boolean; text: string }): Item[] => {
    const items: Item[] = [];
    if (o.cover !== undefined && o.cover > 0) items.push(bandOver("cov", 0, o.cover - 1));
    if (o.query) items.push(bandOver("cov", ql, qr, { tone: o.answer ? "strong" : "accent" }));
    items.push(rowLabel("ln", "nums", LX, 0));
    items.push(
      ...row("n", nums, {
        index: true,
        tone: (k) => (o.query ? (k >= ql && k <= qr ? (o.answer ? "strong" : "accent") : "plain") : o.cover !== undefined && k === o.cover - 1 ? "accent" : "plain"),
      }),
    );
    if (o.query) {
      items.push(spanOver("sR", 0, qr, `prefix[${qr + 1}] = ${prefix[qr + 1]}`));
      if (ql > 0) items.push(spanOver("sL", 0, ql - 1, `prefix[${ql}] = ${prefix[ql]}`, { lift: 34, tone: "ink" }));
    }
    items.push(rowLabel("lp", "prefix", LX, PY));
    items.push(
      ...row(
        "p",
        Array.from({ length: n + 1 }, (_, k) => (k < prefix.length ? String(prefix[k]) : "")),
        {
          x: PX,
          y: PY,
          index: true,
          tone: (k) =>
            k >= prefix.length ? "ghost" : o.query ? (k === ql || k === qr + 1 ? "accent" : "plain") : o.cover !== undefined && (k === o.cover || k === o.cover - 1) ? "accent" : "plain",
        },
      ),
    );
    items.push(note("readout", o.text, 0, NY, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `prefix[k] will hold the sum of the first k numbers, so the row is one longer than nums and starts with prefix[0] = 0, the empty sum. Each entry sits under the boundary where its numbers end.`,
    items: draw({ cover: 0, text: "prefix[0] = 0" }),
  });
  for (let k = 1; k <= n; k++) {
    const a = prefix[k - 1];
    const b = nums[k - 1];
    prefix.push(a + b);
    const sum = `prefix[${k}] = prefix[${k - 1}] + nums[${k - 1}] = ${a} + ${b} = ${a + b}`;
    frames.push({
      caption:
        k === 1
          ? `${sum}. Each entry is the one before it plus one more number, so no stretch is ever added up twice.`
          : k === n
            ? `${sum}, the total of all ${n} numbers. The whole row took ${n} additions: O(n), paid once.`
            : `${sum}, the same as ${nums.slice(0, k).join(" + ")} without adding those again.`,
      items: draw({ cover: k, text: `prefix[${k}] = ${a} + ${b} = ${a + b}` }),
    });
  }
  const ans = prefix[qr + 1] - prefix[ql];
  frames.push({
    caption: `Now the sum of nums[${ql}..${qr}]. prefix[${qr + 1}] covers indices 0 to ${qr} and prefix[${ql}] covers ${ql === 1 ? "index 0 alone" : `indices 0 to ${ql - 1}`}, so taking one from the other leaves exactly indices ${ql} to ${qr}.`,
    items: draw({ query: true, text: `sum(${ql}..${qr}) = prefix[${qr + 1}] − prefix[${ql}]` }),
  });
  frames.push({
    caption: `${prefix[qr + 1]} − ${prefix[ql]} = ${ans}, the same as ${nums.slice(ql, qr + 1).join(" + ")}. Any range now costs one subtraction, O(1), after the O(n) build, instead of up to n additions per query.`,
    items: draw({ query: true, answer: true, text: `sum(${ql}..${qr}) = ${prefix[qr + 1]} − ${prefix[ql]} = ${ans}` }),
  });
  return finish({ title: "Range sums in O(1), with a prefix-sum array", input: `nums = ${show(nums)}; query: sum of nums[${ql}..${qr}]`, frames });
}

/* ── binary search ────────────────────────────────────────────────── */

/** lo..hi always brackets where the target could be; each look at mid throws half of it away. */
function binarySearchWalk(): Walkthrough {
  const nums = [2, 5, 8, 12, 16, 23, 38, 56, 72];
  const target = 8;
  const n = nums.length;
  const frames: Frame[] = [];
  const NY = CELL + 62;

  const draw = (lo: number, hi: number, mid: number, o: { found?: boolean; text: string }): Item[] => {
    const items: Item[] = [];
    if (hi >= lo) items.push(bandOver("live", lo, hi));
    items.push(rowLabel("lbl", "nums", -10, 0));
    items.push(...row("c", nums, { index: true, tone: (k) => (k < lo || k > hi ? "muted" : k === mid ? (o.found ? "strong" : "accent") : "plain") }));
    if (lo === hi) items.push(under("lo", lo, "lo = hi", { indexed: true }));
    else {
      items.push(under("lo", lo, "lo", { indexed: true }));
      items.push(under("hi", hi, "hi", { indexed: true }));
    }
    if (mid >= 0) items.push(over("mid", mid, "mid", { tone: "ink" }));
    items.push(note("state", `lo = ${lo}, hi = ${hi}${mid >= 0 ? `, mid = ${mid}` : ""}`, 0, NY, { tone: "soft", size: 12 }));
    items.push(note("cmp", o.text, 0, NY + 22, { weight: 600 }));
    return items;
  };

  let lo = 0;
  let hi = n - 1;
  let steps = 0;
  frames.push({
    caption: `The array is sorted, so if ${target} is anywhere it lies between lo and hi, which start at the two ends. Each step looks at the middle and throws away the half that cannot hold it.`,
    items: draw(lo, hi, -1, { text: `target = ${target}` }),
  });
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const at = `mid = (${lo} + ${hi}) / 2 = ${mid}${(lo + hi) % 2 ? ", rounded down," : ""}`;
    const v = nums[mid];
    steps++;
    if (v === target) {
      frames.push({
        caption: `${at} and nums[${mid}] = ${v}: found at index ${mid} after ${steps} comparisons. Halving the range each time needs at most ${Math.floor(Math.log2(n)) + 1} looks for ${n} numbers: O(log n), where a scan could need ${n}.`,
        items: draw(lo, hi, mid, { found: true, text: `nums[${mid}] = ${v}, the target` }),
      });
      break;
    }
    if (v > target) {
      frames.push({
        caption: `${at} and nums[${mid}] = ${v} is more than ${target}. Everything from index ${mid} on is at least ${v}, so the target can only be to the left.`,
        items: draw(lo, hi, mid, { text: `nums[${mid}] = ${v} > ${target}` }),
      });
      const gone = hi - mid + 1;
      hi = mid - 1;
      frames.push({
        caption: `hi moves to mid − 1 = ${hi}, so ${gone} numbers leave the search in one step; ${plural(hi - lo + 1, "number")} remain between lo and hi.`,
        items: draw(lo, hi, -1, { text: `still possible: ${show(nums.slice(lo, hi + 1))}` }),
      });
    } else {
      frames.push({
        caption: `${at} and nums[${mid}] = ${v} is less than ${target}. Everything up to index ${mid} is at most ${v}, so the target can only be to the right.`,
        items: draw(lo, hi, mid, { text: `nums[${mid}] = ${v} < ${target}` }),
      });
      const gone = mid - lo + 1;
      lo = mid + 1;
      frames.push({
        caption: `lo moves to mid + 1 = ${lo}, discarding ${plural(gone, "number")} at once; ${plural(hi - lo + 1, "number")} remain between lo and hi.`,
        items: draw(lo, hi, -1, { text: `still possible: ${show(nums.slice(lo, hi + 1))}` }),
      });
    }
  }
  return finish({ title: "Finding a number in a sorted array, with binary search", input: `nums = ${show(nums)}, target = ${target}`, frames });
}

/* ── sorting: minimum difference via neighbours ───────────────────── */

/** After sorting, the closest pair is always two neighbours, so n − 1 comparisons replace n(n − 1)/2. */
function minimumDifferenceBySorting(): Walkthrough {
  const nums = [19, 4, 27, 11, 8, 33];
  const n = nums.length;
  const order = nums.map((_, i) => i).sort((a, b) => nums[a] - nums[b]);
  const posOf = new Map(order.map((orig, pos) => [orig, pos] as const));
  const sorted = order.map((i) => nums[i]);
  const totalPairs = (n * (n - 1)) / 2;
  const gaps: number[] = [];
  let best = Infinity;
  let bestAt = -1;
  let said = false;
  const frames: Frame[] = [];
  const NY = CELL + 50;

  const draw = (o: { sorted: boolean; at?: number; answer?: boolean; text: string }): Item[] => {
    const items: Item[] = [];
    const at = o.answer ? bestAt : o.at;
    if (at !== undefined) items.push(bandOver("pair", at, at + 1, { tone: o.answer ? "strong" : "accent" }));
    items.push(rowLabel("lbl", o.sorted ? "sorted" : "nums", -10, 0));
    nums.forEach((v, orig) => {
      const pos = o.sorted ? (posOf.get(orig) as number) : orig;
      const tone: Tone = at !== undefined && (pos === at || pos === at + 1) ? (o.answer ? "strong" : "accent") : "plain";
      items.push(box(`v${orig}`, slotX(pos), 0, String(v), tone));
    });
    if (at !== undefined) items.push(spanOver("span", at, at + 1, `${sorted[at + 1]} − ${sorted[at]} = ${sorted[at + 1] - sorted[at]}`));
    gaps.forEach((g, k) =>
      items.push({ k: "text", id: `g${k}`, x: slotX(k + 1) - GAP / 2, y: CELL + 13, text: String(g), tone: k === bestAt ? "accent" : "faint", size: 11, anchor: "middle", weight: 600 }),
    );
    items.push(note("readout", o.text, 0, NY, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `The smallest difference between two of these ${n} numbers could hide in any of the ${totalPairs} pairs, and checking every pair is O(n²). Sorting first changes that.`,
    items: draw({ sorted: false, text: `pairs to check: ${totalPairs}` }),
  });
  frames.push({
    caption: `Sorted, in O(n log n). Now each number's closest partner is right next to it: anything further along is past that neighbour, so it is at least as far away. Only ${n - 1} neighbouring pairs are left to check.`,
    items: draw({ sorted: true, text: `pairs to check: ${n - 1}` }),
  });
  for (let k = 0; k + 1 < n; k++) {
    const a = sorted[k];
    const b = sorted[k + 1];
    const d = b - a;
    gaps.push(d);
    const prev = best;
    if (d < best) {
      best = d;
      bestAt = k;
    }
    const why = !said && k > 0 && d >= prev ? ` Any pair further apart spans two or more of these gaps, so the smallest gap is the answer.` : "";
    if (why) said = true;
    frames.push({
      caption:
        k === 0
          ? `${a} and ${b} are the first neighbours: ${b} − ${a} = ${d}, the best so far. The gap is written under the space between them.`
          : d < prev
            ? `${a} and ${b} differ by ${d}, smaller than ${prev}, so the best becomes ${d}.`
            : `${a} and ${b} differ by ${d}, not below the best ${best}, which stays.${why}`,
      items: draw({ sorted: true, at: k, text: `best = ${best} (${sorted[bestAt]} and ${sorted[bestAt + 1]})` }),
    });
  }
  frames.push({
    caption: `The smallest difference is ${best}, between ${sorted[bestAt]} and ${sorted[bestAt + 1]}. Sorting cost O(n log n) and the scan ${n - 1} comparisons, so O(n log n) in all, against ${totalPairs} checks unsorted.`,
    items: draw({ sorted: true, answer: true, text: `answer = ${best}` }),
  });
  return finish({ title: "Minimum difference between two numbers, by sorting first", input: `nums = ${show(nums)}`, frames });
}

/* ── counting sort ────────────────────────────────────────────────── */

/** Small whole numbers: count each value, then write each value out as many times as it was counted. */
function countingSortWalk(): Walkthrough {
  const nums = [4, 1, 3, 1, 0, 4];
  const n = nums.length;
  const K = Math.max(...nums) + 1;
  const count: number[] = Array.from({ length: K }, () => 0);
  const out: number[] = [];
  const written = new Set<number>();
  const FIRST_SEEN = ["still without comparing anything", "found straight from its value", "its counter picked by the value alone"];
  let seen = 0;
  const frames: Frame[] = [];
  const CY = 100;
  const OY = 204;

  const draw = (o: { i?: number; v?: number; fresh?: number[]; done?: boolean }): Item[] => {
    const writing = o.i === undefined && (o.v !== undefined || o.done);
    const items: Item[] = [];
    items.push(rowLabel("ln", "nums", -10, 0));
    items.push(...row("n", nums, { index: true, tone: (k) => (writing ? "muted" : o.i === undefined ? "plain" : k === o.i ? "accent" : k < o.i ? "muted" : "plain") }));
    if (o.i !== undefined) items.push(under("i", o.i, "i", { indexed: true }));
    items.push(rowLabel("lc", "count", -10, CY));
    items.push({ k: "text", id: "lv", x: -10, y: CY + CELL + 11, text: "value", tone: "faint", anchor: "end", size: 10 });
    items.push(...row("c", count, { y: CY, index: true, tone: (k) => (k === o.v ? "accent" : writing && written.has(k) ? "muted" : "plain") }));
    if (o.v !== undefined && o.i === undefined) items.push(under("v", o.v, "v", { y: CY, indexed: true }));
    items.push(rowLabel("lo", "output", -10, OY));
    items.push(
      ...row(
        "o",
        nums.map(() => ""),
        { y: OY, index: true, text: (k) => (k < out.length ? String(out[k]) : ""), tone: (k) => (k >= out.length ? "ghost" : o.done ? "strong" : o.fresh?.includes(k) ? "accent" : "plain") },
      ),
    );
    return items;
  };

  frames.push({
    caption: `Every value lies between 0 and ${K - 1}, so instead of comparing numbers, keep one counter per possible value: ${K} counters, all starting at 0.`,
    items: draw({}),
  });
  nums.forEach((v, i) => {
    count[v]++;
    frames.push({
      caption:
        i === 0
          ? `nums[0] = ${v}, so count[${v}] goes up to 1. The value itself is the index of its counter, so no other number is looked at.`
          : count[v] > 1
            ? `nums[${i}] = ${v} again, so count[${v}] becomes ${count[v]}: a repeat only raises its counter.`
            : `nums[${i}] = ${v}, so count[${v}] goes up to 1, ${FIRST_SEEN[seen++ % FIRST_SEEN.length]}.`,
      items: draw({ i, v }),
    });
  });
  const skipped: number[] = [];
  let first = true;
  for (let v = 0; v < K; v++) {
    const c = count[v];
    if (c === 0) {
      skipped.push(v);
      continue;
    }
    const start = out.length;
    for (let j = 0; j < c; j++) out.push(v);
    const fresh = Array.from({ length: c }, (_, j) => start + j);
    const what = c === 1 ? `one ${v} into output[${start}]` : `${c} copies of ${v} into output[${start}..${start + c - 1}]`;
    const skip = skipped.length ? ` count[${skipped.join("], count[")}] ${skipped.length > 1 ? "are" : "is"} 0, so ${and(skipped.map(String))} ${skipped.length > 1 ? "are" : "is"} skipped.` : "";
    frames.push({
      caption: first
        ? `Now walk the counters from the smallest value up. count[${v}] = ${c}, so write ${what}; going in value order is what makes the output sorted.${skip}`
        : `count[${v}] = ${c}, so write ${what}.${skip}`,
      items: draw({ v, fresh }),
    });
    written.add(v);
    skipped.length = 0;
    first = false;
  }
  frames.push({
    caption: `The output ${show(out)} is sorted without comparing two numbers. One pass to count and one over the ${K} counters to write: O(n + k) time for n = ${n} numbers whose values span k = ${K}.`,
    items: draw({ done: true }),
  });
  return finish({ title: "Sorting small whole numbers, with counting sort", input: `nums = ${show(nums)} (values 0 to ${K - 1})`, frames });
}

/* ── bucket sort ──────────────────────────────────────────────────── */

/** Spread the values over buckets by range, sort each small bucket, read them back in order. */
function bucketSortWalk(): Walkthrough {
  const nums = [29, 3, 41, 17, 22, 8, 12];
  const n = nums.length;
  const W = 10;
  const B = Math.floor(Math.max(...nums) / W) + 1;
  const frames: Frame[] = [];
  const BS = 64;
  const BX = (slotX(n) - GAP - ((B - 1) * BS + CELL)) / 2;
  const BY = 112;
  const bx = (b: number) => BX + b * BS;
  const by = (s: number) => BY + s * (CELL + GAP);
  const range = (b: number) => `${b * W}–${b * W + W - 1}`;
  // Where each number (by input index) is drawn; y = -1 means its output slot.
  const where = nums.map((_, i) => ({ x: slotX(i), y: 0 }));
  // The bucket area is sized for the deepest bucket the run will make.
  const depth = Math.max(2, ...Array.from({ length: B }, (_, b) => nums.filter((v) => Math.floor(v / W) === b).length));

  const draw = (o: { hot?: number[]; bucket?: number; done?: boolean }): Item[] => {
    const items: Item[] = [];
    const oy = BY + depth * (CELL + GAP) + 34;
    for (let b = 0; b < B; b++) {
      items.push({ k: "band", id: `bk${b}`, x: bx(b) - 6, y: BY - 6, w: CELL + 12, h: depth * (CELL + GAP) - GAP + 12, tone: b === o.bucket ? "accent" : "plain" });
      items.push({ k: "text", id: `bl${b}`, x: bx(b) + CELL / 2, y: BY - 18, text: range(b), tone: b === o.bucket ? "accent" : "soft", anchor: "middle", size: 11 });
    }
    items.push(rowLabel("ln", "nums", -10, 0));
    items.push(rowLabel("lb", "buckets", -10, BY));
    items.push(rowLabel("lo", "output", -10, oy));
    nums.forEach((_, i) => items.push(box(`in${i}`, slotX(i), 0, "", "ghost")));
    nums.forEach((_, j) => items.push(box(`out${j}`, slotX(j), oy, "", "ghost")));
    nums.forEach((v, i) => items.push(box(`v${i}`, where[i].x, where[i].y === -1 ? oy : where[i].y, String(v), o.done ? "strong" : o.hot?.includes(i) ? "accent" : "plain")));
    return items;
  };

  frames.push({
    caption: `All ${n} numbers lie in 0..${B * W - 1}, so split that range into ${B} buckets of width ${W}; a number's bucket is its value divided by ${W}, rounded down. The buckets are already in order, so only what is inside each needs sorting.`,
    items: draw({}),
  });
  const into: number[][] = Array.from({ length: B }, () => []);
  let joined = 0;
  nums.forEach((v, i) => {
    const b = Math.floor(v / W);
    const prev = into[b].length ? nums[into[b][into[b].length - 1]] : undefined;
    into[b].push(i);
    where[i] = { x: bx(b), y: by(into[b].length - 1) };
    frames.push({
      caption:
        i === 0
          ? `${v} goes to bucket ${v} / ${W} = ${b}, which holds ${range(b)}. Its value alone says where it goes: nothing is compared.`
          : prev !== undefined
            ? joined++ === 0
              ? `${v} also falls in ${range(b)}, so it lands under ${prev} in bucket ${b}; inside a bucket the order is still arrival order.`
              : `${v} also falls in ${range(b)}, so it joins ${prev} in bucket ${b}.`
            : `${v} goes to bucket ${v} / ${W} = ${b}, which holds ${range(b)}.`,
      items: draw({ hot: [i], bucket: b }),
    });
  });
  const changed: string[] = [];
  const kept: number[] = [];
  const empty: number[] = [];
  const moved: number[] = [];
  into.forEach((q, b) => {
    if (q.length === 0) return void empty.push(b);
    const s = [...q].sort((x, y) => nums[x] - nums[y]);
    if (s.some((x, k) => x !== q[k])) {
      changed.push(`${show(q.map((x) => nums[x]))} becomes ${show(s.map((x) => nums[x]))}`);
      s.forEach((x, k) => {
        if (x !== q[k]) moved.push(x);
        where[x] = { x: bx(b), y: by(k) };
      });
      into[b] = s;
    } else if (q.length > 1) kept.push(b);
  });
  const extra = [
    kept.length ? `bucket ${and(kept.map(String))} ${kept.length > 1 ? "were" : "was"} already in order` : "",
    empty.length ? `bucket ${and(empty.map(String))} ${empty.length > 1 ? "are" : "is"} empty` : "",
  ].filter(Boolean);
  frames.push({
    caption: `Each bucket is sorted on its own: ${and(changed)}${extra.length ? `, while ${and(extra)}` : ""}. Buckets are small, so this is cheap.`,
    items: draw({ hot: moved }),
  });
  const result: number[] = [];
  into.forEach((q) => q.forEach((i) => {
    where[i] = { x: slotX(result.length), y: -1 };
    result.push(nums[i]);
  }));
  frames.push({
    caption: `Reading the buckets left to right gives ${show(result)}, sorted, because every number in a bucket is below every number in the next. With values spread evenly over k buckets this is O(n + k) on average.`,
    items: draw({ done: true }),
  });
  return finish({ title: "Sorting numbers in a known range, with bucket sort", input: `nums = ${show(nums)} (buckets of width ${W})`, frames });
}

/* ── merge sort ───────────────────────────────────────────────────── */

/** Halve until single numbers, then merge pairs of sorted pieces back up by always taking the smaller front number. */
function mergeSortWalk(): Walkthrough {
  const nums = [38, 27, 43, 3, 9, 82, 10, 19];
  const n = nums.length;
  const LEVELS = Math.log2(n);
  const E = 16;
  const LY = 66;
  const frames: Frame[] = [];
  const widthAt = (L: number) => n * (CELL + GAP) - GAP + (2 ** L - 1) * E;
  const pos = (L: number, j: number) => ({ x: (widthAt(LEVELS) - widthAt(L)) / 2 + j * (CELL + GAP) + Math.floor(j / (n >> L)) * E, y: L * LY });
  // Where each input number (by index) sits now: a level and a slot on it.
  const at = nums.map((_, i) => ({ L: 0, j: i }));
  let opened = 0;

  /**
   * Outlines show the road a number still has to travel (every level above
   * it) and, right after a merge, the slots the merged numbers just left —
   * not the whole tree, which turned the figure into a grid of dashes.
   * Each column holds exactly one number at a time: a split keeps a number's
   * column and a merge only reorders within its group's columns.
   */
  const draw = (hot: Set<number>, o: { answer?: boolean; merged?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    const level: number[] = [];
    at.forEach((p) => (level[p.j] = p.L));
    const hotCols = new Set([...hot].map((i) => at[i].j));
    for (let L = 0; L <= opened; L++) {
      for (let j = 0; j < n; j++) {
        if (L < level[j] || (o.merged && hotCols.has(j) && L === level[j] + 1)) {
          const p = pos(L, j);
          items.push(box(`g${L}_${j}`, p.x, p.y, "", "ghost"));
        }
      }
    }
    nums.forEach((v, i) => {
      const p = pos(at[i].L, at[i].j);
      items.push(box(`v${i}`, p.x, p.y, String(v), o.answer ? "strong" : hot.has(i) ? "accent" : "plain"));
    });
    return items;
  };
  /** The numbers of one group on level L, in slot order (as input indices). */
  const group = (L: number, g: number) => {
    const size = n >> L;
    return nums.map((_, i) => i).filter((i) => at[i].L === L && Math.floor(at[i].j / size) === g).sort((a, b) => at[a].j - at[b].j);
  };
  const values = (ids: number[]) => ids.map((i) => nums[i]);

  frames.push({
    caption: `Merge sort halves the array until every piece holds one number, then merges the pieces back together in order. One number on its own is already sorted, which is what the merging builds on.`,
    items: draw(new Set()),
  });
  for (let L = 1; L <= LEVELS; L++) {
    at.forEach((p) => (p.L = L));
    opened = L;
    const groups = Array.from({ length: 2 ** L }, (_, g) => show(values(group(L, g))));
    frames.push({
      caption:
        L === 1
          ? `Split into two halves of ${n >> 1}: ${and(groups)}. Splitting compares nothing; it only decides which pieces get merged later.`
          : L < LEVELS
            ? `Split each half again: ${and(groups)}.`
            : `And again, down to ${n} single numbers. That took ${LEVELS} levels of halving (log2 ${n} = ${LEVELS}), and every one-number piece counts as sorted.`,
      items: draw(new Set(nums.map((_, i) => i))),
    });
  }
  /** Merge groups 2g and 2g + 1 of level L + 1 into group g of level L, recording each take. */
  const merge = (L: number, g: number) => {
    const a = group(L + 1, 2 * g);
    const b = group(L + 1, 2 * g + 1);
    const res: number[] = [];
    const takes: string[] = [];
    let i = 0;
    let j = 0;
    let cmp = 0;
    while (i < a.length && j < b.length) {
      cmp++;
      if (nums[a[i]] <= nums[b[j]]) {
        takes.push(`${nums[a[i]]} ${nums[a[i]] === nums[b[j]] ? "=" : "<"} ${nums[b[j]]}, take ${nums[a[i]]}`);
        res.push(a[i++]);
      } else {
        takes.push(`${nums[b[j]]} < ${nums[a[i]]}, take ${nums[b[j]]}`);
        res.push(b[j++]);
      }
    }
    const rest = [...a.slice(i), ...b.slice(j)];
    res.push(...rest);
    const size = n >> L;
    res.forEach((id, k) => (at[id] = { L, j: g * size + k }));
    return { a: values(a), b: values(b), res, takes, rest: values(rest), cmp };
  };

  for (let L = LEVELS - 1; L >= 0; L--) {
    const groups = 2 ** L;
    if (n >> L === 2) {
      // Pairs: one comparison each, all in one step.
      const done = Array.from({ length: groups }, (_, g) => merge(L, g));
      frames.push({
        caption: `Merge back up, always taking the smaller front number. A pair costs one comparison: ${and(done.map((m) => `${show(m.a)} and ${show(m.b)} give ${show(values(m.res))}`))}.`,
        items: draw(new Set(done.flatMap((m) => m.res)), { merged: true }),
      });
      continue;
    }
    for (let g = 0; g < groups; g++) {
      const m = merge(L, g);
      const tail = m.rest.length ? `; then ${and(m.rest.map(String))} ${m.rest.length > 1 ? "are" : "is"} left and copied` : "";
      if (L === 0) {
        frames.push({
          caption: `The last merge interleaves ${show(m.a)} and ${show(m.b)} into ${show(values(m.res))} with ${m.cmp} comparisons. Each of the ${LEVELS} levels handles all ${n} numbers once: O(n log n) time, plus O(n) space to merge into.`,
          items: draw(new Set(m.res), { answer: true, merged: true }),
        });
      } else {
        frames.push({
          caption: `Merge ${show(m.a)} with ${show(m.b)} by comparing their fronts: ${m.takes.join("; ")}${tail}. ${m.res.length} numbers, ${m.cmp} comparisons.`,
          items: draw(new Set(m.res), { merged: true }),
        });
      }
    }
  }
  return finish({ title: "Sorting an array, with merge sort", input: `nums = ${show(nums)}`, frames });
}

/* ── quickselect ──────────────────────────────────────────────────── */

/** Partition around a pivot; the pivot lands where it belongs in sorted order, and only the side holding index k − 1 is kept. */
function quickselectWalk(): Walkthrough {
  const start = [9, 4, 7, 1, 8, 3, 2, 6];
  const k = 4;
  const goal = k - 1;
  const n = start.length;
  const arr = start.map((v, id) => ({ v, id }));
  const frames: Frame[] = [];
  const NY = CELL + 64;

  const draw = (lo: number, hi: number, o: { pivot?: number; split?: number; answer?: boolean; text: string }): Item[] => {
    const items: Item[] = [bandOver("live", lo, hi, { tone: o.answer ? "strong" : "accent" })];
    items.push(rowLabel("lbl", "nums", -10, 0));
    arr.forEach((e, p) => {
      const tone: Tone = o.answer && p === goal ? "strong" : p < lo || p > hi ? "muted" : p === o.pivot ? "accent" : "plain";
      items.push(box(`v${e.id}`, slotX(p), 0, String(e.v), tone));
      items.push(indexAt(`ix${p}`, p, 0));
    });
    if (o.pivot !== undefined) items.push(over("pivot", o.pivot, "pivot", { tone: "ink" }));
    if (o.split !== undefined) {
      const pv = arr[o.split].v;
      if (o.split > lo) items.push(spanOver("lt", lo, o.split - 1, `< ${pv}`));
      if (o.split < hi) items.push(spanOver("gt", o.split + 1, hi, `> ${pv}`, { tone: "ink" }));
    }
    items.push(under("goal", goal, ordinal(k), { indexed: true, tone: "ink" }));
    items.push(note("range", `range = ${lo}..${hi}`, 0, NY, { tone: "soft", size: 12 }));
    items.push(note("readout", o.text, 0, NY + 22, { weight: 600 }));
    return items;
  };
  const partition = (lo: number, hi: number) => {
    const pv = arr[hi].v;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (arr[j].v < pv) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    return i;
  };

  let lo = 0;
  let hi = n - 1;
  frames.push({
    caption: `The ${ordinal(k)} smallest number is the one that would sit at index ${goal} if the array were sorted. Quickselect sorts only enough to find it: partition around a pivot, then keep the one side that can hold index ${goal}.`,
    items: draw(lo, hi, { text: `looking for index ${goal}` }),
  });
  let rounds = 0;
  for (;;) {
    const pv = arr[hi].v;
    frames.push({
      caption:
        rounds === 0
          ? `Partition ${lo}..${hi} around its last number, ${pv}: everything smaller moves to its left and everything larger to its right, in one pass.`
          : `Only ${lo}..${hi} is left. Partition it the same way, around its last number, ${pv}.`,
      items: draw(lo, hi, { pivot: hi, text: `pivot = ${pv}` }),
    });
    rounds++;
    const p = partition(lo, hi);
    const smaller = p - lo;
    const larger = hi - p;
    if (p === goal) {
      frames.push({
        caption: `${pv} lands at index ${p}, the very index we wanted, so ${pv} is the ${ordinal(k)} smallest. Each round kept one side only, about n + n/2 + n/4 + … ≈ 2n steps: O(n) on average, O(n²) if every pivot is the worst.`,
        items: draw(lo, hi, { pivot: p, split: p, answer: true, text: `answer = ${pv}` }),
      });
      break;
    }
    frames.push({
      caption:
        p > goal
          ? `${pv} lands at index ${p}, its place in sorted order, with ${plural(smaller, "smaller number")} before it. Index ${goal} is to its left, so ${theN(larger, "larger number")} on its right ${larger === 1 ? "is" : "are"} dropped without being sorted.`
          : `${pv} lands at index ${p}, its place in sorted order. Index ${goal} is to its right, so only ${p + 1}..${hi} can hold the answer and ${theN(smaller, "smaller number")} on its left ${smaller === 1 ? "is" : "are"} dropped.`,
      items: draw(lo, hi, { pivot: p, split: p, text: `${pv} is at index ${p}; keep ${p > goal ? `${lo}..${p - 1}` : `${p + 1}..${hi}`}` }),
    });
    if (p > goal) hi = p - 1;
    else lo = p + 1;
  }
  return finish({ title: "The k-th smallest number, with quickselect", input: `nums = ${show(start)}, k = ${k}`, frames });
}

/* ── intervals: merge overlapping ─────────────────────────────────── */

/** Sort by start, then sweep: an interval that starts before the current end extends it, one that starts after closes it. */
function mergeIntervalsWalk(): Walkthrough {
  const input: Array<[number, number]> = [[2, 6], [8, 10], [1, 3], [15, 18], [9, 12]];
  const U = 24;
  const LANE = 32;
  const BH = 24;
  const X = (v: number) => v * U;
  const order = input.map((_, i) => i).sort((a, b) => input[a][0] - input[b][0] || input[a][1] - input[b][1]);
  const MY = input.length * LANE + 18;
  const AY = MY + BH + 24;
  const top = Math.max(...input.map((iv) => iv[1])) + 1;
  const fmt = (iv: readonly [number, number]) => `[${iv[0]}, ${iv[1]}]`;
  const frames: Frame[] = [];

  const draw = (o: { sorted: boolean; cur?: number; done: Set<number>; merged: Array<[number, number]>; open?: boolean; end?: number; answer?: boolean }): Item[] => {
    const items: Item[] = [];
    if (o.end !== undefined) {
      items.push({ k: "edge", id: "end", x1: X(o.end), y1: -6, x2: X(o.end), y2: MY + BH + 6, tone: "accent", dashed: true });
      items.push({ k: "text", id: "endl", x: X(o.end), y: -16, text: `end = ${o.end}`, tone: "accent", anchor: "middle", size: 11 });
    }
    items.push(rowLabel("li", o.sorted ? "by start" : "input", -10, 0, BH));
    input.forEach((iv, i) => {
      const lane = o.sorted ? order.indexOf(i) : i;
      const tone: Tone = i === o.cur ? "accent" : o.done.has(i) ? "muted" : "plain";
      items.push(box(`b${i}`, X(iv[0]), lane * LANE, `${iv[0]}–${iv[1]}`, tone, (iv[1] - iv[0]) * U, BH, 12));
    });
    items.push(rowLabel("lm", "merged", -10, MY, BH));
    o.merged.forEach((iv, k) => {
      const tone: Tone = o.answer ? "strong" : k === o.merged.length - 1 && o.open ? "accent" : "strong";
      items.push(box(`m${k}`, X(iv[0]), MY, `${iv[0]}–${iv[1]}`, tone, (iv[1] - iv[0]) * U, BH, 12));
    });
    items.push({ k: "edge", id: "axis", x1: X(0), y1: AY, x2: X(top), y2: AY, tone: "line" });
    for (let v = 0; v <= top; v++) {
      items.push({ k: "edge", id: `t${v}`, x1: X(v), y1: AY, x2: X(v), y2: AY + 4, tone: "line" });
      items.push({ k: "text", id: `n${v}`, x: X(v), y: AY + 14, text: String(v), tone: "faint", anchor: "middle", size: 10 });
    }
    return items;
  };

  const done = new Set<number>();
  const merged: Array<[number, number]> = [];
  frames.push({
    caption: `Each interval is a bar on the number line, in the order given. Two intervals overlap when one starts before the other ends, but in this order overlapping bars can sit far apart in the list.`,
    items: draw({ sorted: false, done, merged }),
  });
  frames.push({
    caption: `Sort by start: ${order.map((i) => fmt(input[i])).join(", ")}. Now anything that overlaps the interval being built comes straight after it, so one sweep from left to right finds every merge.`,
    items: draw({ sorted: true, done, merged }),
  });
  order.forEach((i, step) => {
    const [s, e] = input[i];
    if (step === 0) {
      merged.push([s, e]);
      frames.push({
        caption: `The sweep opens the first merged interval with ${fmt(input[i])}. Its end, ${e}, is what the next start gets compared with.`,
        items: draw({ sorted: true, cur: i, done, merged, open: true, end: e }),
      });
    } else {
      const last = merged[merged.length - 1];
      const end = last[1];
      if (s <= end) {
        last[1] = Math.max(end, e);
        frames.push({
          caption:
            e > end
              ? `${fmt(input[i])} starts at ${s}, not past the end ${end}, so it overlaps: the merged interval grows to ${fmt(last)}, its end now max(${end}, ${e}) = ${last[1]}.`
              : `${fmt(input[i])} starts at ${s}, not past the end ${end}, and finishes inside it, so it is absorbed and the end stays ${end}.`,
          items: draw({ sorted: true, cur: i, done, merged, open: true, end: last[1] }),
        });
      } else {
        const closed = fmt(last);
        merged.push([s, e]);
        frames.push({
          caption: `${fmt(input[i])} starts at ${s}, past the end ${end}. Starts only grow from here, so nothing later can reach back: ${closed} is final, and a new merged interval opens at ${fmt(input[i])}.`,
          items: draw({ sorted: true, cur: i, done, merged, open: true, end: e }),
        });
      }
    }
    done.add(i);
  });
  frames.push({
    caption: `The sweep ends with ${and(merged.map(fmt))}: ${input.length} intervals merged into ${merged.length}. Sorting is O(n log n) and the sweep O(n), so O(n log n) in all.`,
    items: draw({ sorted: true, done, merged, answer: true }),
  });
  return finish({ title: "Merging overlapping intervals, with a sort and one sweep", input: `intervals = [${input.map(fmt).join(", ")}]`, frames });
}

/* ── greedy: jump game ────────────────────────────────────────────── */

/** Scan left to right keeping the farthest index reachable; the end is reachable exactly when the scan never falls behind it. */
function jumpGameWalk(): Walkthrough {
  const nums = [1, 3, 0, 0, 2, 0, 1];
  const n = nums.length;
  const last = n - 1;
  let reach = 0;
  const jumps: Array<[number, number]> = [];
  const frames: Frame[] = [];
  const NY = CELL + 62;
  const arc = (id: string, a: number, b: number): Item => ({ k: "edge", id, x1: slotMid(a), y1: -4, x2: slotMid(b), y2: -4, tone: "accent", arrow: true, bow: -(10 + 9 * (b - a)) });

  const draw = (i: number, o: { jump?: [number, number]; path?: number[]; text: string }): Item[] => {
    const items: Item[] = [bandOver("reach", 0, Math.min(reach, last), { tone: o.path ? "strong" : "accent" })];
    items.push(rowLabel("lbl", "nums", -10, 0));
    items.push(...row("c", nums, { index: true, tone: (k) => (o.path ? (o.path.includes(k) ? "strong" : "plain") : k > reach ? "ghost" : k === i ? "accent" : "plain") }));
    if (o.jump) items.push(arc("jump", o.jump[0], o.jump[1]));
    if (o.path) o.path.slice(1).forEach((b, k) => items.push(arc(`p${k}`, o.path![k], b)));
    if (i >= 0) items.push(under("i", i, "i", { indexed: true }));
    items.push(note("rv", `reach = ${reach}`, 0, NY, { weight: 600 }));
    items.push(note("readout", o.text, 0, NY + 22, { tone: "soft", size: 12 }));
    return items;
  };

  frames.push({
    caption: `reach is the farthest index known to be reachable. It starts at 0, where we stand; every index up to reach can be landed on, and nothing past it is known to be reachable yet.`,
    items: draw(-1, { text: `goal: index ${last}` }),
  });
  let ok = false;
  let zeros = 0;
  for (let i = 0; i < n; i++) {
    if (i > reach) {
      frames.push({
        caption: `Index ${i} is past reach = ${reach}: no jump from anything reachable lands here, so the end cannot be reached and the answer is false.`,
        items: draw(i, { text: `${i} > reach` }),
      });
      break;
    }
    const to = i + nums[i];
    const old = reach;
    if (to > reach) {
      reach = to;
      jumps.push([i, Math.min(to, last)]);
    }
    const jump: [number, number] | undefined = nums[i] > 0 ? [i, Math.min(to, last)] : undefined;
    const text = `reach = max(${old}, ${i} + ${nums[i]}) = ${reach}`;
    let caption: string;
    if (reach >= last) {
      caption = `From index ${i} a jump of ${nums[i]} lands at ${to}${to > last ? `, beyond the last index ${last}` : `, the last index`}, so reach = ${reach} covers the end and the scan can stop.`;
      ok = true;
    } else if (reach > old) {
      caption =
        i === 0
          ? `From index 0 a jump of up to ${nums[i]} lands as far as ${to}, so reach = ${reach}. Shorter jumps land inside the stretch already covered, which is why only the farthest point matters.`
          : `Index ${i} is within reach, and from it a jump of ${nums[i]} lands at ${to}, so reach grows to ${reach}: every index from 0 to ${reach} is now reachable.`;
    } else if (nums[i] === 0) {
      caption =
        zeros++ === 0
          ? `nums[${i}] = 0 goes nowhere, but that is no trap: reach is already ${reach}, so index ${i + 1} is still reachable and the scan carries on.`
          : `nums[${i}] = 0 adds nothing either, since ${i} + 0 = ${i} is behind reach = ${reach}; a zero only traps the scan when reach stops at it.`;
    } else {
      caption = `From index ${i} a jump of ${nums[i]} only lands at ${to}, not past reach = ${reach}, so reach stays.`;
    }
    frames.push({ caption, items: draw(i, { jump, text }) });
    if (ok) break;
  }
  if (ok) {
    const path = [last];
    let cur = last;
    while (cur > 0) {
      const from = jumps.find(([, to]) => to >= cur)![0];
      path.unshift(from);
      cur = from;
    }
    frames.push({
      caption: `The end is reachable, so the answer is true: ${path.join(" → ")} works, using the jumps that pushed reach forward. Had i ever passed reach, it would be false. One pass and one number kept: O(n) time, O(1) space.`,
      items: draw(-1, { path, text: `path: ${path.join(" → ")}` }),
    });
  }
  return finish({ title: "Jump game, with a greedy farthest-reach scan", input: `nums = ${show(nums)}`, frames });
}

/* ── enumeration: every pair i < j ────────────────────────────────── */

/** Two nested loops try each pair once; a grid with one cell per pair shows the whole search space being covered. */
function pairEnumeration(): Walkthrough {
  const nums = [2, 7, 4, 5, 3];
  const k = 3;
  const n = nums.length;
  const total = (n * (n - 1)) / 2;
  const GY = CELL + 64;
  const checked = new Map<string, boolean>();
  const hits: string[] = [];
  const frames: Frame[] = [];

  const draw = (ci: number, cj: number, o: { answer?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    items.push(rowLabel("ln", "nums", -10, 0));
    items.push(...row("n", nums, { index: true, tone: (x) => (!o.answer && (x === ci || x === cj) ? "accent" : "plain") }));
    if (ci >= 0) {
      items.push(under("i", ci, "i", { indexed: true }));
      items.push(over("j", cj, "j", { tone: "ink" }));
    }
    for (let i = 0; i < n - 1; i++) {
      const y = GY + i * (CELL + GAP);
      items.push({ k: "text", id: `ri${i}`, x: -10, y: y + CELL / 2, text: `i = ${i}`, tone: i === ci && !o.answer ? "accent" : "soft", anchor: "end", size: 11 });
      for (let j = i + 1; j < n; j++) {
        const key = `${i},${j}`;
        const ok = checked.get(key);
        const cur = i === ci && j === cj && !o.answer;
        const tone: Tone = ok === undefined ? "ghost" : cur ? "accent" : ok ? "strong" : "muted";
        items.push(box(`g${i}_${j}`, slotX(j), y, ok === undefined ? "" : String(nums[i] + nums[j]), tone));
      }
    }
    items.push(note("count", `count = ${hits.length}, checked ${checked.size} of ${total}`, 0, GY + (n - 1) * (CELL + GAP) + 12, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `Count the pairs whose sum is divisible by ${k} by trying every pair i < j: i fixes the first number and j runs over everything after it. With ${n} numbers that is ${n} × ${n - 1} / 2 = ${total} pairs, one cell each in the grid.`,
    items: draw(-1, -1),
  });
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = nums[i] + nums[j];
      const ok = s % k === 0;
      checked.set(`${i},${j}`, ok);
      if (ok) hits.push(`(${nums[i]}, ${nums[j]})`);
      const lead = j === i + 1 && i > 0 ? `i moves on to ${i} and j restarts just after it. ` : "";
      frames.push({
        caption: ok
          ? `${lead}i = ${i}, j = ${j}: ${nums[i]} + ${nums[j]} = ${s}, which is divisible by ${k}, so this pair counts and count = ${hits.length}.`
          : `${lead}i = ${i}, j = ${j}: ${nums[i]} + ${nums[j]} = ${s} leaves remainder ${s % k} when divided by ${k}, so it does not count.`,
        items: draw(i, j),
      });
    }
  }
  frames.push({
    caption: `All ${total} pairs are checked, and ${hits.length} have a sum divisible by ${k}: ${and(hits)}. Two nested loops make it O(n²) time — fine for small inputs, and the baseline any faster idea must beat.`,
    items: draw(-1, -1, { answer: true }),
  });
  return finish({ title: `Pairs whose sum is divisible by k, with brute-force enumeration`, input: `nums = ${show(nums)}, k = ${k}`, frames });
}

/* ── counting: valid anagram ──────────────────────────────────────── */

/** One counter per letter: s counts up, t counts down, and anagrams leave every counter at 0. */
function anagramCounting(): Walkthrough {
  const s = "loop";
  const t = "pool";
  const letters = [...new Set([...s, ...t])].sort();
  const count = new Map<string, number>(letters.map((c) => [c, 0]));
  const TY = 92;
  const CY = 206;
  const frames: Frame[] = [];

  const draw = (o: { si?: number; ti?: number; letter?: string; answer?: boolean }): Item[] => {
    const items: Item[] = [];
    items.push(rowLabel("ls", "s", -10, 0));
    items.push(...row("s", [...s], { index: true, tone: (k) => (o.ti !== undefined || o.answer ? "muted" : o.si === undefined ? "plain" : k === o.si ? "accent" : k < o.si ? "muted" : "plain") }));
    items.push(rowLabel("lt", "t", -10, TY));
    items.push(...row("t", [...t], { y: TY, index: true, tone: (k) => (o.answer ? "muted" : o.ti === undefined ? "plain" : k === o.ti ? "accent" : k < o.ti ? "muted" : "plain") }));
    // One caret: it walks s, then drops to t.
    if (o.si !== undefined) items.push(under("i", o.si, "i", { indexed: true }));
    if (o.ti !== undefined) items.push(under("i", o.ti, "i", { y: TY, indexed: true }));
    items.push(rowLabel("lc", "count", -10, CY));
    letters.forEach((c, k) => {
      items.push({ k: "text", id: `h${c}`, x: slotMid(k), y: CY - 12, text: c, tone: c === o.letter ? "accent" : "soft", anchor: "middle", size: 12 });
      items.push(box(`c${c}`, slotX(k), CY, String(count.get(c)), o.answer ? "strong" : c === o.letter ? "accent" : "plain"));
    });
    return items;
  };

  frames.push({
    caption: `"${s}" and "${t}" both have ${s.length} letters, so they are anagrams exactly when each letter appears equally often in both. Keep one counter per letter: s adds one, t takes one away, and every counter must end at 0.`,
    items: draw({}),
  });
  [...s].forEach((c, i) => {
    const v = (count.get(c) ?? 0) + 1;
    count.set(c, v);
    frames.push({
      caption: v > 1 ? `s[${i}] = '${c}' again, so count[${c}] rises to ${v}: t will need ${v} of them to match.` : i === 0
          ? `s[${i}] = '${c}', so count[${c}] goes up to 1: one '${c}' that t will have to match.`
          : `s[${i}] = '${c}', so count[${c}] goes up to 1.`,
      items: draw({ si: i, letter: c }),
    });
  });
  let ok = true;
  [...t].forEach((c, j) => {
    if (!ok) return;
    const v = (count.get(c) ?? 0) - 1;
    count.set(c, v);
    if (v < 0) ok = false;
    frames.push({
      caption:
        v < 0
          ? `t[${j}] = '${c}' takes count[${c}] below 0: t has more '${c}' than s, so they cannot be anagrams.`
          : j === 0
            ? `Now t takes letters back: t[0] = '${c}', so count[${c}] drops to ${v}. A counter going below 0 would mean t has a letter s lacks, and the answer would be false at once.`
            : v > 0
              ? `t[${j}] = '${c}', so count[${c}] drops to ${v}: s still has ${v} more '${c}' than t so far.`
              : `t[${j}] = '${c}', so count[${c}] drops to 0: s and t have used the same number of '${c}'.`,
      items: draw({ ti: j, letter: c }),
    });
  });
  if (ok) {
    frames.push({
      caption: `Every counter is back to 0, so "${t}" uses exactly the letters of "${s}": they are anagrams. Two passes over n letters and at most 26 counters: O(n) time, O(1) extra space.`,
      items: draw({ answer: true }),
    });
  }
  return finish({ title: "Valid anagram, with a letter-count table", input: `s = "${s}", t = "${t}"`, frames });
}

/* ── hash table: two sum ──────────────────────────────────────────── */

/** For each number, look up its partner (target − value) in a map of what came before, then store the number itself. */
function twoSumHash(): Walkthrough {
  const nums = [7, 3, 9, 4, 12, 2];
  const target = 14;
  const map = new Map<number, number>();
  const entries: number[] = [];
  const frames: Frame[] = [];
  const MY = CELL + 78;
  const NY = MY + 2 * CELL + 26;

  const draw = (i: number, o: { stored?: number; found?: [number, number]; text: string }): Item[] => {
    const items: Item[] = [];
    const f = o.found;
    items.push(rowLabel("ln", "nums", -10, 0));
    items.push(...row("n", nums, { index: true, tone: (k) => (f ? (k === f[0] || k === f[1] ? "strong" : "plain") : k === i ? "accent" : k < i ? "muted" : "plain") }));
    if (i >= 0) items.push(under("i", i, "i", { indexed: true }));
    items.push(note("mt", "map: value → index", 0, MY - 16, { tone: "soft", size: 12 }));
    items.push(rowLabel("mk", "value", -10, MY));
    items.push(rowLabel("mv", "index", -10, MY + CELL));
    if (!entries.length) items.push(note("me", "empty", 6, MY + CELL / 2, { tone: "faint", size: 12 }));
    entries.forEach((idx, col) => {
      const tone: Tone = f && idx === f[0] ? "strong" : idx === o.stored ? "accent" : "plain";
      items.push(box(`k${idx}`, slotX(col), MY, String(nums[idx]), tone));
      items.push(box(`x${idx}`, slotX(col), MY + CELL, String(idx), tone));
    });
    items.push(note("readout", o.text, 0, NY, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `For each number, the partner it needs is ${target} − nums[i]. A map from value to index answers "seen it before?" in O(1), so a single pass is enough; the map starts empty.`,
    items: draw(-1, { text: `target = ${target}` }),
  });
  for (let i = 0; i < nums.length; i++) {
    const v = nums[i];
    const need = target - v;
    const j = map.get(need);
    if (j !== undefined) {
      frames.push({
        caption: `nums[${i}] = ${v} needs ${target} − ${v} = ${need}, and the map says ${need} is at index ${j}: the answer is [${j}, ${i}]. One lookup and one store per number make it O(n) time and O(n) space, against O(n²) for every pair.`,
        items: draw(i, { found: [j, i], text: `need ${need}: map[${need}] = ${j}` }),
      });
      break;
    }
    const empty = entries.length === 0;
    map.set(v, i);
    entries.push(i);
    frames.push({
      caption: empty
        ? `nums[${i}] = ${v} needs ${target} − ${v} = ${need}. The map is still empty — looking before storing is what stops ${v} pairing with itself — so store ${v} → ${i}.`
        : entries.length === 2
          ? `nums[${i}] = ${v} needs ${need}, which is not in the map, so no earlier number pairs with it. Store ${v} → ${i} for the numbers still to come.`
          : `nums[${i}] = ${v} needs ${need}: not in the map either, so store ${v} → ${i}.`,
      items: draw(i, { stored: i, text: `need ${target} − ${v} = ${need}: not in map` }),
    });
  }
  return finish({ title: "Two Sum, with a hash map from value to index", input: `nums = ${show(nums)}, target = ${target}`, frames });
}

export const WALKTHROUGHS: Record<string, () => Walkthrough> = {
  arrays: buyAndSellStock,
  "two-pointers": pairWithTargetSum,
  "prefix-sum": rangeSumWithPrefix,
  "binary-search": binarySearchWalk,
  sorting: minimumDifferenceBySorting,
  "counting-sort": countingSortWalk,
  "bucket-sort": bucketSortWalk,
  "merge-sort": mergeSortWalk,
  quickselect: quickselectWalk,
  intervals: mergeIntervalsWalk,
  greedy: jumpGameWalk,
  enumeration: pairEnumeration,
  counting: anagramCounting,
  "hash-table": twoSumHash,
};
