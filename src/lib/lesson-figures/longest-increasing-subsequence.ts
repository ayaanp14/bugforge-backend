import { and, finish, note, row, rowLabel, show, slotMid, slotX, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, label } from "./kit.js";

/**
 * Longest Increasing Subsequence: the lesson's figures
 * (content/roadmap/longest-increasing-subsequence.md places each with
 * "@figure <name>"). The three ways of picking from one array, the O(n²)
 * table with its parent links, the tails array dealt like patience piles,
 * why tails stays sorted (the real subsequence behind every tail), the one
 * comparison that separates strict from non-decreasing, and the envelope
 * tie-break. Every number is computed by running the method shown.
 */

const NUMS = [5, 2, 8, 6, 3, 6, 9, 7, 1];

/** The O(n²) table with parent links, exactly as the lesson's first program fills it (first j that reaches the best). */
function quadratic(nums: readonly number[]) {
  const dp = nums.map(() => 1);
  const parent = nums.map(() => -1);
  for (let i = 0; i < nums.length; i++)
    for (let j = 0; j < i; j++)
      if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        parent[i] = j;
      }
  let end = 0;
  dp.forEach((v, i) => {
    if (v > dp[end]) end = i;
  });
  const chain: number[] = [];
  for (let i = end; i !== -1; i = parent[i]) chain.unshift(i);
  return { dp, parent, end, chain };
}

/** One step of the tails method: tails holds indices, `strict` searches for the first tail ≥ x, otherwise the first tail > x. */
function place(nums: readonly number[], tails: number[], i: number, strict = true): { pos: number; append: boolean; replaced: number | null } {
  const x = nums[i];
  let lo = 0;
  let hi = tails.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (strict ? nums[tails[m]] < x : nums[tails[m]] <= x) lo = m + 1;
    else hi = m;
  }
  const append = lo === tails.length;
  const replaced = append ? null : tails[lo];
  tails[lo] = i;
  return { pos: lo, append, replaced };
}

/** Subsequence against subarray against the greedy guess, on one array. */
function picks(): Walkthrough {
  const nums = NUMS;
  const { chain } = quadratic(nums);
  // Longest increasing run, by one scan.
  let runStart = 0;
  let best = { from: 0, to: 0 };
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] <= nums[i - 1]) runStart = i;
    if (i - runStart > best.to - best.from) best = { from: runStart, to: i };
  }
  // Greedy: take the next value whenever it beats the last one taken.
  const greedy: number[] = [0];
  for (let i = 1; i < nums.length; i++) if (nums[i] > nums[greedy[greedy.length - 1]]) greedy.push(i);
  const S = 36;
  const G = 8;
  const mid = (i: number) => slotMid(i, 0, S, G);
  const hops = (ids: number[], tone: "accent" | "error"): Item[] =>
    ids.slice(1).map((to, k) => arrow(`h${k}`, { x: mid(ids[k]) + 3, y: -4 }, { x: mid(to) - 3, y: -4 }, { tone, bow: -(8 + (to - ids[k]) * 7) }));
  const base = (tone: (i: number) => Tone, extra: Item[], readout: string, readTone: "ink" | "error" = "ink"): Item[] => [
    rowLabel("l", "nums", -12, 0, S),
    ...extra,
    ...row("n", nums, { size: S, gap: G, index: true, tone }),
    note("rd", readout, 0, S + 44, { size: 12, weight: 600, tone: readTone }),
  ];
  const run = nums.slice(best.from, best.to + 1);
  const frames: Frame[] = [
    {
      caption: `A subsequence keeps the original order but may skip elements. Picking indices ${and(chain.map(String))} gives ${chain.map((i) => nums[i]).join(" < ")}: an increasing subsequence of length ${chain.length}, and no five values work.`,
      items: base((i) => (chain.includes(i) ? "strong" : "plain"), hops(chain, "accent"), `${chain.map((i) => nums[i]).join(", ")}: length ${chain.length}`),
    },
    {
      caption: `A subarray may not skip anything. The longest increasing run is ${show(run)}, length ${run.length}, and one left-to-right scan finds it. A subsequence has 2ⁿ choices instead, which is why it needs more than a scan.`,
      items: base((i) => (i >= best.from && i <= best.to ? "accent" : "plain"), [{ k: "band", id: "run", x: slotX(best.from, 0, S, G) - 4, y: -4, w: (best.to - best.from + 1) * (S + G) - G + 8, h: S + 8, tone: "accent" }], `subarray ${show(run)}: length ${run.length}`),
    },
    {
      caption: `Greedy takes each value that beats the last one taken: ${greedy.map((i) => nums[i]).join(", ")}, length ${greedy.length}. Taking the 8 shut out the 6 and the 7 after it. Whether to take a value depends on what comes later.`,
      items: base((i) => (greedy.includes(i) ? "error" : "plain"), hops(greedy, "error"), `greedy: ${greedy.map((i) => nums[i]).join(", ")}, length ${greedy.length}`, "error"),
    },
  ];
  return finish({ title: "A subsequence, a subarray and a greedy guess on one array", input: `nums = ${show(nums)}`, frames });
}

/** The O(n²) table: dp[i] = 1 + the best dp[j] over earlier, smaller values, with the parent link it extends. */
function quadraticTable(): Walkthrough {
  const nums = NUMS;
  const n = nums.length;
  const { dp, parent, end, chain } = quadratic(nums);
  const S = 36;
  const G = 8;
  const DY = 84;
  const mid = (i: number) => slotMid(i, 0, S, G);
  const frames: Frame[] = [];

  const draw = (o: { upto: number; i?: number; final?: boolean; readout: string }): Item[] => {
    const i = o.i;
    const cands = i === undefined ? [] : nums.map((_, j) => j).filter((j) => j < i && nums[j] < nums[i]);
    const items: Item[] = [rowLabel("nl", "nums", -12, 0, S), rowLabel("dl", "dp", -12, DY, S)];
    // Parent links of every filled cell, as arcs over the array: each says "extends the subsequence ending here".
    for (let k = 0; k <= o.upto; k++) {
      if (parent[k] === -1) continue;
      const onChain = o.final && chain.includes(k);
      const tone = onChain || k === i ? "accent" : "line";
      items.push(arrow(`p${k}`, { x: mid(parent[k]) + 2, y: -4 }, { x: mid(k) - 2, y: -4 }, { tone, bow: -(8 + (k - parent[k]) * 7) }));
    }
    items.push(
      ...row("n", nums, {
        size: S,
        gap: G,
        index: true,
        tone: (k) => (o.final ? (chain.includes(k) ? "strong" : "plain") : k === i ? "strong" : cands.includes(k) ? "accent" : "plain"),
      }),
    );
    items.push(
      ...row("d", nums, {
        y: DY,
        size: S,
        gap: G,
        text: (k) => (k <= o.upto ? String(dp[k]) : ""),
        tone: (k) => (o.final ? (k === end ? "strong" : "plain") : k > o.upto ? "ghost" : k === i ? "strong" : cands.includes(k) ? "accent" : "plain"),
      }),
    );
    items.push(note("rd", o.readout, 0, DY + S + 30, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `dp[i] is the length of the longest increasing subsequence that ends exactly at index i. Nothing comes before ${nums[0]}, and nothing before ${nums[1]} is smaller, so dp[0] = dp[1] = 1: each value alone.`,
    items: draw({ upto: 1, readout: "dp[0] = 1, dp[1] = 1" }),
  });
  for (let i = 2; i < n; i++) {
    const cands = nums.map((_, j) => j).filter((j) => j < i && nums[j] < nums[i]);
    const equal = nums.slice(0, i).includes(nums[i]);
    let caption: string;
    if (!cands.length) caption = `Nothing before ${nums[i]} is smaller, so it starts a subsequence of its own: dp[${i}] = 1. It is the last cell, but nowhere near the answer — the longest can end anywhere.`;
    else {
      const j = parent[i];
      const ties = cands.filter((k) => dp[k] === dp[j]).length;
      caption =
        `${nums[i]} can follow any earlier, smaller value: ${and(cands.map((k) => String(nums[k])))}. The best dp among them is ${dp[j]}` +
        (ties > 1 ? `, first reached at index ${j}` : `, at index ${j}`) +
        `, so dp[${i}] = ${dp[j]} + 1 = ${dp[i]}, and the arc records index ${j} as the parent.`;
      if (equal) caption += ` The earlier ${nums[i]} is equal, not smaller, so it cannot come first.`;
    }
    const readout = cands.length ? `dp[${i}] = 1 + dp[${parent[i]}] = ${dp[i]}` : `dp[${i}] = 1`;
    frames.push({ caption, items: draw({ upto: i, i, readout }) });
  }
  frames.push({
    caption: `The answer is the largest dp, ${dp[end]} at index ${end}. Following the parent arcs back gives indices ${chain.slice().reverse().join(" → ")}, values ${chain.map((k) => nums[k]).reverse().join(", ")}; reversed, the LIS is ${chain.map((k) => nums[k]).join(", ")}.`,
    items: draw({ upto: n - 1, final: true, readout: `LIS = ${chain.map((k) => nums[k]).join(", ")} (length ${dp[end]})` }),
  });
  return finish({ title: "The O(n²) table: the longest subsequence ending at each index", input: `nums = ${show(nums)}`, frames });
}

/**
 * The tails method dealt like patience piles: each value lands on the
 * leftmost slot whose tail is not smaller, pushing the old tail down into
 * its pile, and remembers the tail to its left as its parent.
 */
function patience(): Walkthrough {
  const nums = NUMS;
  const n = nums.length;
  const S = 34;
  const G = 8;
  const PS = 40;
  const PG = 18;
  const PY = 96;
  const H = 34;
  const piles: number[][] = []; // piles[k][0] is the current tail (an index)
  const parent = nums.map(() => -1);
  const tails: number[] = [];
  const frames: Frame[] = [];
  const pileX = (k: number) => k * (PS + PG);
  const where = (i: number): { x: number; y: number } | null => {
    for (let k = 0; k < piles.length; k++) {
      const d = piles[k].indexOf(i);
      if (d >= 0) return { x: pileX(k), y: PY + d * (H + 6) };
    }
    return null;
  };

  const draw = (o: { dealt: number; now?: number; pos?: number; append?: boolean; chain?: number[]; readout: string }): Item[] => {
    const items: Item[] = [rowLabel("nl", "nums", -12, 0, S), rowLabel("tl", "tails", -12, PY, H)];
    // The array: values still to deal sit in it; dealt ones leave a faint trace.
    nums.forEach((v, i) => {
      if (i >= o.dealt) items.push({ k: "cell", id: `k${i}`, x: slotX(i, 0, S, G), y: 0, w: S, h: S, text: String(v), tone: i === o.dealt ? "accent" : "plain" });
      else items.push({ k: "cell", id: `n${i}`, x: slotX(i, 0, S, G), y: 0, w: S, h: S, text: String(v), tone: "muted" });
      items.push({ k: "text", id: `i${i}`, x: slotMid(i, 0, S, G), y: S + 11, text: String(i), tone: "faint", anchor: "middle", size: 10 });
    });
    // Parent arrows: from a current tail to the card it extends, one pile to the left (buried cards keep theirs, undrawn, for the walk back).
    for (let i = 0; i < o.dealt; i++) {
      if (parent[i] === -1) continue;
      const isTail = piles.some((p) => p[0] === i);
      if (o.chain ? !o.chain.includes(i) : !isTail) continue;
      const a = where(i);
      const b = where(parent[i]);
      if (!a || !b) continue;
      const hot = o.chain ? true : i === o.now;
      items.push(arrow(`a${i}`, { x: a.x - 2, y: a.y + H / 2 }, { x: b.x + PS + 2, y: b.y + H / 2 }, { tone: hot ? "accent" : "line" }));
    }
    piles.forEach((pile, k) =>
      pile.forEach((i, d) => {
        const tone: Tone = o.chain ? (o.chain.includes(i) ? "strong" : d === 0 ? "plain" : "muted") : i === o.now ? "strong" : d === 0 ? "accent" : "muted";
        items.push({ k: "cell", id: `k${i}`, x: pileX(k), y: PY + d * (H + 6), w: PS, h: H, text: String(nums[i]), tone });
      }),
    );
    for (let k = 0; k < Math.max(piles.length, 1); k++) items.push({ k: "text", id: `pk${k}`, x: pileX(k) + PS / 2, y: PY - 12, text: `len ${k + 1}`, tone: "faint", anchor: "middle", size: 10.5 });
    items.push(note("rd", o.readout, 0, PY + 3 * (H + 6) + 20, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: "tails[k] will hold the smallest value that ends any increasing subsequence of length k + 1. Each value goes to the first slot whose tail is not smaller than it; a new slot opens when every tail is smaller.",
    items: draw({ dealt: 0, readout: "tails = []" }),
  });
  let searched = 0;
  for (let i = 0; i < n; i++) {
    const before = tails.map((t) => nums[t]);
    const { pos, append, replaced } = place(nums, tails, i);
    parent[i] = pos > 0 ? tails[pos - 1] : -1;
    if (append) piles.push([i]);
    else piles[pos].unshift(i);
    const x = nums[i];
    const after = tails.map((t) => nums[t]);
    let caption: string;
    if (append && pos === 0) caption = `${x} is the first value: it opens slot 0, an increasing subsequence of length 1 ending in ${x}.`;
    else if (append) caption = `${x} is larger than every tail ${show(before)}, so it extends the longest subsequence: a new slot opens and the length becomes ${after.length}. Its arrow points at ${nums[parent[i]]}, the tail it extends.`;
    else
      caption =
        `${x}: the first tail not smaller than it is ${nums[replaced as number]} in slot ${pos}${searched++ === 0 ? ", found by binary search because tails is sorted" : ""}. ${x} takes its place` +
        (pos > 0 ? `, extending the length-${pos} subsequence that ends in ${nums[parent[i]]}: same length, smaller tail.` : `: a length-1 subsequence can now end in ${x}.`) +
        (i === n - 1 && pos === 0 && parent[tails[1]] === replaced ? ` The ${nums[replaced as number]} is buried, but ${nums[tails[1]]} still points at it, so no subsequence is lost.` : "");
    const readout = `tails = ${show(after)}`;
    frames.push({ caption, items: draw({ dealt: i + 1, now: i, pos, append, readout }) });
  }
  const chain: number[] = [];
  for (let i = tails[tails.length - 1]; i !== -1; i = parent[i]) chain.unshift(i);
  frames.push({
    caption: `${tails.length} slots, so the LIS has length ${tails.length}. The tails ${show(tails.map((t) => nums[t]))} are not an answer — the ${nums[tails[0]]} comes last in the array — but the arrows are: from the last slot back, ${chain.map((i) => nums[i]).reverse().join(" → ")}, so ${chain.map((i) => nums[i]).join(", ")}.`,
    items: draw({ dealt: n, chain, readout: `length ${tails.length}, one LIS ${chain.map((i) => nums[i]).join(", ")}` }),
  });
  return finish({ title: "The tails array, dealt like patience piles", input: `nums = ${show(nums)}`, frames });
}

/** Why tails is sorted: behind every tail is a real subsequence of its length, and the one behind a longer tail contains a shorter one ending lower. */
function whySorted(): Walkthrough {
  const nums = NUMS;
  const tails: number[] = [];
  const parent = nums.map(() => -1);
  nums.forEach((_, i) => {
    const { pos } = place(nums, tails, i);
    parent[i] = pos > 0 ? tails[pos - 1] : -1;
  });
  const witness = tails.map((t) => {
    const c: number[] = [];
    for (let i = t; i !== -1; i = parent[i]) c.unshift(i);
    return c;
  });
  const S = 30;
  const G = 6;
  const RY = 46;
  const frames: Frame[] = [];
  const L = tails.length;

  const draw = (o: { drop?: number; across?: boolean }): Item[] => {
    const items: Item[] = [];
    nums.forEach((_, i) => items.push({ k: "text", id: `ix${i}`, x: slotMid(i, 0, S, G), y: -12, text: String(i), tone: "faint", anchor: "middle", size: 10 }));
    witness.forEach((w, k) => {
      const y = k * RY;
      items.push(rowLabel(`r${k}`, `len ${k + 1}`, -12, y, S));
      items.push(
        ...row(`w${k}-`, nums, {
          y,
          size: S,
          gap: G,
          tone: (i) => {
            const last = w[w.length - 1];
            if (o.across) return i === last ? "strong" : "ghost";
            if (o.drop !== undefined && k === o.drop) return i === last ? "muted" : w.includes(i) ? "accent" : "ghost";
            if (o.drop !== undefined && k === o.drop - 1) return i === last ? "strong" : w.includes(i) ? "plain" : "ghost";
            return w.includes(i) ? (i === last ? "strong" : "accent") : "ghost";
          },
          text: (i) => (o.across ? (i === w[w.length - 1] ? String(nums[i]) : "") : w.includes(i) ? String(nums[i]) : ""),
        }),
      );
      items.push(label(`t${k}`, `tails[${k}] = ${nums[tails[k]]}`, slotX(nums.length, 0, S, G) + 8, y + S / 2, { anchor: "start", tone: o.across ? "accent" : "soft", size: 12 }));
    });
    // Read down the tails in slot order: an arrow that has to point left is a step back in the array.
    if (o.across)
      tails.slice(1).forEach((t, k) => {
        const from = tails[k];
        const back = t < from;
        items.push(arrow(`z${k}`, { x: slotMid(from, 0, S, G), y: k * RY + S + 1 }, { x: slotMid(t, 0, S, G), y: (k + 1) * RY - 1 }, { tone: back ? "error" : "accent" }));
      });
    return items;
  };

  frames.push({
    caption: `Behind every tail is a real increasing subsequence of its length, found by following the parent arrows: ${witness.map((w) => show(w.map((i) => nums[i]))).join(", ")}. Each one ends in its slot's tail.`,
    items: draw({}),
  });
  const k = L - 1;
  const w = witness[k];
  const cut = w.slice(0, -1).map((i) => nums[i]);
  frames.push({
    caption: `Drop the last value of the length-${L} subsequence: ${show(cut)} is increasing, has length ${L - 1} and ends in ${cut[cut.length - 1]}, below ${nums[tails[k]]}. tails[${k - 1}] is the smallest such end, so tails[${k - 1}] ≤ ${cut[cut.length - 1]} < tails[${k}]. The same argument works for every slot, so tails is always strictly sorted.`,
    items: draw({ drop: k }),
  });
  frames.push({
    caption: `Read in slot order, the tails ${show(tails.map((t) => nums[t]))} come from different subsequences: the ${nums[tails[0]]} sits at index ${tails[0]}, after the others, so the first step goes backwards. Their count is the LIS length; their values are not a subsequence.`,
    items: draw({ across: true }),
  });
  return finish({ title: "Why the tails array is always sorted", input: `nums = ${show(nums)}`, frames });
}

/** Strict against non-decreasing: the same deal with "first tail ≥ x" and with "first tail > x". */
function equalValues(): Walkthrough {
  const nums = [1, 2, 2, 2, 3];
  const S = 36;
  const G = 8;
  const Y1 = 84;
  const Y2 = 170;
  const strict: number[] = [];
  const loose: number[] = [];
  const frames: Frame[] = [];

  const draw = (o: { now?: number; ps?: number; pl?: number; readout?: string }): Item[] => {
    const items: Item[] = [rowLabel("nl", "nums", -12, 0, S)];
    items.push(...row("n", nums, { size: S, gap: G, tone: (i) => (i === o.now ? "accent" : o.now !== undefined && i < o.now ? "muted" : "plain") }));
    items.push(label("h1", "strictly increasing: first tail ≥ x", 0, Y1 - 24, { anchor: "start", tone: "soft", weight: 600 }));
    items.push(label("h2", "non-decreasing: first tail > x", 0, Y2 - 24, { anchor: "start", tone: "soft", weight: 600 }));
    items.push(rowLabel("sl", "tails", -12, Y1, S), rowLabel("ll", "tails", -12, Y2, S));
    const slots = (prefix: string, t: number[], y: number, hot?: number): Item[] =>
      Array.from({ length: nums.length }, (_, k) => ({
        k: "cell" as const,
        id: `${prefix}${k}`,
        x: slotX(k, 0, S, G),
        y,
        w: S,
        h: S,
        text: k < t.length ? String(nums[t[k]]) : "",
        tone: (k === hot ? "strong" : k < t.length ? "plain" : "ghost") as Tone,
      }));
    items.push(...slots("s", strict, Y1, o.ps), ...slots("l", loose, Y2, o.pl));
    items.push(label("sn", `length ${strict.length}`, slotX(nums.length, 0, S, G) + 6, Y1 + S / 2, { anchor: "start", tone: "accent", weight: 600 }));
    items.push(label("ln", `length ${loose.length}`, slotX(nums.length, 0, S, G) + 6, Y2 + S / 2, { anchor: "start", tone: "accent", weight: 600 }));
    return items;
  };

  frames.push({
    caption: "Both versions deal the same values; they differ only in which tail the search stops at when x equals a tail. Strict stops at an equal tail and replaces it; non-decreasing goes past it.",
    items: draw({}),
  });
  const seen = new Map<number, number>();
  nums.forEach((x, i) => {
    const a = place(nums, strict, i, true);
    const b = place(nums, loose, i, false);
    const rep = (seen.get(x) ?? 0) + 1;
    seen.set(x, rep);
    let caption: string;
    if (a.append && b.append) caption = `x = ${x} (index ${i}) is larger than every tail in both rows, so both append it: ${strict.length === loose.length ? `length ${strict.length}` : `lengths ${strict.length} and ${loose.length}`}.`;
    else
      caption =
        rep === 2
          ? `The second 2. Strict: the first tail ≥ 2 is the 2 in slot ${a.pos}, so it is replaced by an equal value and nothing grows. Non-decreasing: no tail is > 2, so it appends: length ${loose.length}.`
          : `The third 2 does the same: strict replaces its 2 again and stays at length ${strict.length}, while non-decreasing chains it on, length ${loose.length}.`;
    frames.push({ caption, items: draw({ now: i, ps: a.pos, pl: b.pos }) });
  });
  frames.push({
    caption: `Strictly increasing gives ${strict.length} (1, 2, 3); non-decreasing gives ${loose.length}, every value. In code that is lower_bound against upper_bound, bisect_left against bisect_right, or < against ≤ in the O(n²) table.`,
    items: draw({}),
  });
  return finish({ title: "Equal values: strictly increasing against non-decreasing", input: `nums = ${show(nums)}`, frames });
}

/** Russian doll envelopes: sort by width, break ties by height descending, then a strict LIS of the heights. */
function envelopes(): Walkthrough {
  type Env = [number, number];
  const env: Env[] = [
    [2, 2],
    [1, 1],
    [3, 4],
    [2, 3],
  ];
  const U = 20;
  const S = 30;
  const X0 = 14;
  const PITCH = 3 * U + 22;
  const BASE = 4 * U;
  const HY = BASE + 34;
  const frames: Frame[] = [];
  const sorted = (desc: boolean) => [...env].sort((a, b) => a[0] - b[0] || (desc ? b[1] - a[1] : a[1] - b[1]));
  const fits = (a: Env, b: Env) => a[0] < b[0] && a[1] < b[1];
  const key = (e: Env) => `${e[0]}x${e[1]}`;
  const name = (e: Env) => `${e[0]}×${e[1]}`;

  const draw = (list: Env[], pick: number[], o: { bad?: number[]; nest?: boolean; readout: string; error?: boolean }): Item[] => {
    const items: Item[] = [{ k: "text", id: "hl", x: X0 - 12, y: HY + S / 2, text: "heights", tone: "soft", anchor: "end", size: 12 }];
    const chain = pick.map((i) => list[i]);
    const outer = chain[chain.length - 1];
    const ox = X0 + list.indexOf(outer) * PITCH;
    const centre = { x: ox + (outer[0] * U) / 2, y: BASE - (outer[1] * U) / 2 };
    // In the nested frame the chain is drawn largest first, so each smaller envelope sits on top of the one holding it.
    const order = o.nest ? [...list.keys()].filter((i) => !pick.includes(i)).concat([...pick].reverse()) : [...list.keys()];
    for (const i of order) {
      const [w, h] = list[i];
      const x = X0 + i * PITCH;
      const tone: Tone = o.bad?.includes(i) ? "error" : pick.includes(i) ? "accent" : "plain";
      const nested = o.nest && pick.includes(i);
      items.push({ k: "cell", id: `e${key(list[i])}`, x: nested ? centre.x - (w * U) / 2 : x, y: nested ? centre.y - (h * U) / 2 : BASE - h * U, w: w * U, h: h * U, text: "", tone });
      if (!nested) items.push({ k: "text", id: `el${key(list[i])}`, x: x + (w * U) / 2, y: BASE + 12, text: name(list[i]), tone: "soft", anchor: "middle", size: 11 });
    }
    list.forEach(([w, h], i) => {
      const x = X0 + i * PITCH;
      items.push({ k: "cell", id: `h${key(list[i])}`, x: x + (w * U) / 2 - S / 2, y: HY, w: S, h: S, text: String(h), tone: o.bad?.includes(i) ? "error" : pick.includes(i) ? "strong" : "plain" });
    });
    items.push(note("rd", o.readout, 0, HY + S + 26, { size: 12, weight: 600, tone: o.error ? "error" : "ink" }));
    return items;
  };

  const up = sorted(false);
  const upPick = quadratic(up.map((e) => e[1])).chain;
  const bad = upPick.filter((p, k) => k > 0 && !fits(up[upPick[k - 1]], up[p])).flatMap((p) => [upPick[upPick.indexOf(p) - 1], p]);
  const dn = sorted(true);
  const dnPick = quadratic(dn.map((e) => e[1])).chain;
  const dnValid = dnPick.every((p, k) => k === 0 || fits(dn[dnPick[k - 1]], dn[p]));
  if (!bad.length || !dnValid) throw new Error("envelopes: the example no longer shows the tie-break");
  frames.push({
    caption: `An envelope fits inside another only if it is both narrower and shorter. Sort by width and take the LIS of the heights: with equal widths ordered by height ascending, the heights are ${show(up.map((e) => e[1]))} and the LIS is ${upPick.length}.`,
    items: draw(up, upPick, { readout: `LIS of heights: ${upPick.length}` }),
  });
  frames.push({
    caption: `But ${and(bad.map((i) => name(up[i])))} have the same width, so neither fits inside the other. Ascending heights within one width let the LIS chain two of them: ${upPick.length} is too many.`,
    items: draw(up, upPick, { bad, readout: `${and(bad.map((i) => name(up[i])))}: same width`, error: true }),
  });
  frames.push({
    caption: `Sort equal widths by height descending instead: the heights become ${show(dn.map((e) => e[1]))}. Within one width they now fall, so a strictly increasing run takes at most one of them, and the LIS is ${dnPick.length}.`,
    items: draw(dn, dnPick, { readout: `LIS of heights: ${dnPick.length}` }),
  });
  frames.push({
    caption: `The chain ${and(dnPick.map((i) => name(dn[i])))} really nests, each narrower and shorter than the next. Sorting costs O(n log n) and the tails method another O(n log n).`,
    items: draw(dn, dnPick, { nest: true, readout: `${dnPick.length} envelopes nest` }),
  });
  return finish({ title: "Russian doll envelopes: sort, then a strict LIS of the heights", input: `envelopes = [${env.map((e) => `[${e[0]}, ${e[1]}]`).join(", ")}]`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  picks,
  "quadratic-table": quadraticTable,
  patience,
  "why-sorted": whySorted,
  "equal-values": equalValues,
  envelopes,
};
