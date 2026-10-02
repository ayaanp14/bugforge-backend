import { bandOver, finish, note, over, row, rowLabel, show, slotMid, slotX, spanOver, under, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, grid, gridCell, label } from "./kit.js";

/**
 * Sliding Window Technique: the lesson's figures (content/roadmap/
 * sliding-window.md places each with "@figure <name>"). The two kinds of
 * window, a dry run of each loop the lesson's programs run, the staircase
 * of valid starts that makes shrinking safe, the exactly-K subtraction and
 * the negative-number failure — every window, sum and count computed by
 * running the loop it shows.
 */

const S = { size: 40, gap: 6 };
const mid = (i: number) => slotMid(i, 0, S.size, S.gap);
const fmt = (v: number) => String(v).replace("-", "−");

/** Fixed windows slide one step; variable windows grow on the right and shrink on the left. */
function twoKinds(): Walkthrough {
  const arr = [2, 1, 5, 1, 3, 2];
  const K = 3;
  const AT = 1; // the window shown: indices AT..AT+K-1, about to slide one step
  const s = "abcabcbb";
  const [L, R] = [1, 3];
  const Y2 = 138;
  const items: Item[] = [
    label("t1", "Fixed size — one element in, one out", 0, -48, { anchor: "start", tone: "ink", weight: 600, size: 12.5 }),
    bandOver("w1", AT, AT + K - 1, { ...S }),
    rowLabel("l1", "arr", -10, 0, S.size),
    ...row("a", arr, { ...S, tone: (i) => (i === AT + K ? "accent" : i === AT ? "muted" : "plain") }),
    spanOver("k", AT, AT + K - 1, `k = ${K}`, { ...S, lift: 12 }),
    under("out", AT, "leaves", { ...S, tone: "ink" }),
    under("in", AT + K, "enters", { ...S }),
    label("t2", "Variable size — grow on the right, shrink on the left", 0, Y2 - 30, { anchor: "start", tone: "ink", weight: 600, size: 12.5 }),
    bandOver("w2", L, R, { ...S, y: Y2 }),
    rowLabel("l2", "s", -10, Y2, S.size),
    ...row("b", [...s], { ...S, y: Y2, tone: (i) => (i >= L && i <= R ? "accent" : i < L ? "muted" : "plain") }),
    under("L", L, "left", { ...S, y: Y2 }),
    under("R", R, "right", { ...S, y: Y2, tone: "ink" }),
    arrow("gl", { x: mid(L) + 14, y: Y2 + S.size + 30 }, { x: mid(L + 1) - 4, y: Y2 + S.size + 30 }, { tone: "accent" }),
    arrow("gr", { x: mid(R) + 22, y: Y2 + S.size + 30 }, { x: mid(R + 1) + 6, y: Y2 + S.size + 30 }, { tone: "ink" }),
  ];
  return finish({
    title: "The two kinds of sliding window",
    input: "",
    frames: [
      {
        caption: `Top: a window of fixed length k moves one step, so one element enters and one leaves, and its sum updates in O(1). Bottom: a window obeying a rule ("no repeated letter") grows by moving right and shrinks by moving left; both only ever move forwards.`,
        items,
      },
    ],
  });
}

/** The fixed window over [2, 1, 5, 1, 3, 2] with k = 3: build once, then add the newcomer and subtract the leaver. */
function fixedSlide(): Walkthrough {
  const arr = [2, 1, 5, 1, 3, 2];
  const k = 3;
  const frames: Frame[] = [];
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  let best = sum;
  let bestStart = 0;

  const draw = (start: number, o: { leaving?: number; entering?: number; done?: boolean } = {}): Item[] => {
    const items: Item[] = [bandOver("win", start, start + k - 1, { ...S, tone: o.done ? "strong" : "accent" })];
    items.push(rowLabel("lbl", "arr", -10, 0, S.size));
    items.push(...row("c", arr, { ...S, index: true, tone: (i) => (o.done ? (i >= start && i < start + k ? "strong" : "plain") : i === o.entering ? "accent" : i === o.leaving ? "muted" : "plain") }));
    if (o.leaving !== undefined) items.push(label("lv", `−${arr[o.leaving]}`, mid(o.leaving), -14, { size: 12.5, tone: "soft", weight: 700, mono: true }));
    if (o.entering !== undefined) items.push(label("en", `+${arr[o.entering]}`, mid(o.entering), -14, { size: 12.5, tone: "accent", weight: 700, mono: true }));
    const shown = o.done ? best : sum;
    items.push(note("sum", `${o.done ? "best window" : "window"} ${start}..${start + k - 1}: sum = ${shown}`, 0, S.size + 44, { weight: 600 }));
    items.push(note("best", `best = ${best} (from index ${bestStart})`, 0, S.size + 66, { tone: "soft", size: 12 }));
    return items;
  };

  frames.push({ caption: `Build the first window once: ${arr.slice(0, k).join(" + ")} = ${sum}. That costs k additions — the only time the window is summed from scratch.`, items: draw(0) });
  for (let right = k; right < arr.length; right++) {
    const before = sum;
    sum += arr[right] - arr[right - k];
    const start = right - k + 1;
    const better = sum > best;
    if (better) {
      best = sum;
      bestStart = start;
    }
    frames.push({
      caption:
        right === k
          ? `Slide one step: ${arr[right]} enters and ${arr[right - k]} leaves, so the sum is ${before} − ${arr[right - k]} + ${arr[right]} = ${sum}. The ${k - 1} elements both windows share are never added again — the brute force would add them all over.`
          : `${arr[right]} enters, ${arr[right - k]} leaves: ${before} − ${arr[right - k]} + ${arr[right]} = ${sum}.${better ? ` That beats every window so far: best = ${best}.` : ` Not better than ${best}.`}`,
      items: draw(start, { leaving: right - k, entering: right }),
    });
  }
  frames.push({
    caption: `The best window is ${bestStart}..${bestStart + k - 1} with sum ${best}. Every window after the first cost one addition and one subtraction, whatever k is: O(n) in all, against O(n × k) for summing each window afresh.`,
    items: draw(bestStart, { done: true }),
  });
  return finish({ title: "A fixed-size window: add the newcomer, subtract the leaver", input: `arr = ${show(arr)}, k = ${k}`, frames });
}

/** Longest substring without repeats, exactly as the lesson's program runs it: grow by one, shrink until the newcomer's count is 1. */
function growShrink(): Walkthrough {
  const s = "abcabcbb";
  const chars = [...s];
  const count = new Map<string, number>();
  const frames: Frame[] = [];
  let left = 0;
  let bestLen = 0;
  let bestLeft = 0;

  const draw = (right: number, o: { dropped?: [number, number]; done?: boolean } = {}): Item[] => {
    const [wl, wr] = o.done ? [bestLeft, bestLeft + bestLen - 1] : [left, right];
    const items: Item[] = [bandOver("win", wl, wr, { ...S, tone: o.done ? "strong" : "accent" })];
    items.push(rowLabel("lbl", "s", -10, 0, S.size));
    const dropped = (i: number) => o.dropped !== undefined && i >= o.dropped[0] && i < o.dropped[1];
    items.push(
      ...row("c", chars, {
        ...S,
        index: true,
        tone: (i) => (o.done ? (i >= wl && i <= wr ? "strong" : "plain") : dropped(i) ? "error" : i >= wl && i <= wr ? "accent" : i < wl ? "muted" : "plain"),
      }),
    );
    if (!o.done) {
      items.push(under("L", wl, "left", { ...S, indexed: true }));
      items.push(over("R", right, "right", { ...S, tone: "ink" }));
    }
    const state = [...count.entries()].filter(([, v]) => v > 0).sort().map(([c, v]) => `${c}×${v}`).join("  ");
    items.push(note("cnt", `count: ${state || "—"}`, 0, S.size + 58, { tone: "soft", size: 12 }));
    items.push(note("best", `longest: ${bestLen} ("${s.slice(bestLeft, bestLeft + bestLen)}")`, 0, S.size + 80, { weight: 600 }));
    return items;
  };

  chars.forEach((ch, right) => {
    count.set(ch, (count.get(ch) ?? 0) + 1);
    const from = left;
    while (count.get(ch)! > 1) {
      count.set(chars[left], count.get(chars[left])! - 1);
      left++;
    }
    const len = right - left + 1;
    const better = len > bestLen;
    if (better) {
      bestLen = len;
      bestLeft = left;
    }
    const drops = chars.slice(from, left).map((c) => `'${c}'`);
    const firstDrop = !frames.some((f) => f.caption.includes("Only the newcomer"));
    let caption: string;
    if (right === 0) caption = `right = 0: '${ch}' enters, its count is 1, and the window "${ch}" is valid. The count map is the window's state: how many times each letter is inside.`;
    else if (!drops.length) caption = `right = ${right}: '${ch}' enters with count 1 — still no repeat. The window "${s.slice(left, right + 1)}" has length ${len}${better ? ", the longest yet" : ""}.`;
    else if (firstDrop)
      caption = `right = ${right}: '${ch}' now appears twice. Only the newcomer can be the repeat, so drop from the left until its count is 1: ${drops.join(", ")} goes. The window "${s.slice(left, right + 1)}" has length ${len}.`;
    else if (drops.length === 1) caption = `right = ${right}: '${ch}' appears twice again, and its first copy is at the left edge: drop ${drops[0]}. The window "${s.slice(left, right + 1)}" has length ${len}.`;
    else
      caption = `right = ${right}: '${ch}' appears twice, but its first copy is not at the left edge, so ${drops.join(" and ")} both go before its count is 1. The window "${s.slice(left, right + 1)}" has length ${len}.`;
    frames.push({ caption, items: draw(right, { dropped: drops.length ? [from, left] : undefined }) });
  });
  frames.push({
    caption: `The longest is ${bestLen}, "${s.slice(bestLeft, bestLeft + bestLen)}". right moved ${chars.length} times and left moved ${left} times, each element entering once and leaving at most once: O(n), despite the loop inside the loop.`,
    items: draw(chars.length - 1, { done: true }),
  });
  return finish({ title: "Grow, then shrink: the longest substring without a repeat", input: `s = "${s}"`, frames });
}

/**
 * Every window of "abcabcbb" as a cell, start by row and right end by
 * column: the valid ones in each column form one block, and the block's top
 * (the best start for that right) only ever moves down — so left may be
 * carried forward.
 */
function validStarts(): Walkthrough {
  const s = "abcabcbb";
  const n = s.length;
  const distinct = (a: number, b: number) => new Set(s.slice(a, b + 1)).size === b - a + 1;
  const G = { w: 30, h: 26, gap: 3, x: 0, y: 0 };
  const L: number[] = [];
  for (let r = 0; r < n; r++) {
    let st = r;
    while (st > 0 && distinct(st - 1, r)) st--;
    L.push(st);
  }
  const longest = Math.max(...L.map((st, r) => r - st + 1));
  const firstBest = L.findIndex((st, r) => r - st + 1 === longest);
  const total = (n * (n + 1)) / 2;
  const validCount = L.reduce((a, st, r) => a + (r - st + 1), 0);
  const rows = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => (b >= a && distinct(a, b) ? String(b - a + 1) : "")));

  const draw = (mode: "all" | "column" | "stair" | "answer"): Item[] => {
    const COL = 6;
    const items = grid("g", rows, {
      ...G,
      size: 11.5,
      tone: (a, b) => {
        if (b < a) return "ghost";
        const ok = distinct(a, b);
        if (mode === "column" && b !== COL) return ok ? "plain" : "muted";
        if (mode === "stair" && a === L[b]) return "strong";
        if (mode === "answer") return b === firstBest && a >= L[b] ? "strong" : ok ? "plain" : "muted";
        return ok ? "accent" : "muted";
      },
      rowLabels: [...s].map((c, a) => `${a} ${c}`),
      colLabels: [...s].map((c, b) => `${c}`),
    }).filter((it) => !(it.k === "cell" && it.tone === "ghost"));
    items.push(label("ax1", "right end →", gridCell(0, n - 1, G).x + G.w, -26, { anchor: "end", size: 10.5, tone: "faint" }));
    items.push(label("ax2", "start ↓", -8, -26, { anchor: "end", size: 10.5, tone: "faint" }));
    if (mode === "column") {
      const top = gridCell(L[6], 6, G);
      const bottom = gridCell(6, 6, G);
      items.push({ k: "band", id: "colband", x: top.x - 3, y: top.y - 3, w: G.w + 6, h: bottom.y + G.h - top.y + 6, tone: "accent" });
    }
    items.push(note("cnt", mode === "all" ? `windows: ${total}, of which ${validCount} have no repeat` : mode === "answer" ? `longest: ${longest}, at right = ${firstBest} ("${s.slice(L[firstBest], firstBest + 1)}")` : `best start per right: ${L.join(", ")}`, 0, gridCell(n - 1, 0, G).y + G.h + 24, { weight: 600, size: 12 }));
    return items;
  };

  return finish({
    title: "Why shrinking is safe: the best start never moves back",
    input: `s = "${s}"`,
    frames: [
      {
        caption: `Each cell is one window: start by row, right end by column, its length written in when it has no repeated letter (teal). The brute force checks all ${total} windows.`,
        items: draw("all"),
      },
      {
        caption: `The rule is monotone: a window with no repeat stays repeat-free when shrunk, and one with a repeat keeps it when grown. So down each column the valid windows form one block, ending at the diagonal — here the column for right = 6.`,
        items: draw("column"),
      },
      {
        caption: `The top of each block is the best start for that right end, and as right moves on it never moves up: ${L.join(", ")}. So left can be carried forward instead of restarting — at most n moves in all.`,
        items: draw("stair"),
      },
      {
        caption: `The answer is the tallest block, length ${longest}, first at right = ${firstBest}. The loop walks only the staircase — about 2n steps — and never looks at the ${total - validCount} broken windows above it.`,
        items: draw("answer"),
      },
    ],
  });
}

/** Minimum Size Subarray Sum: grow until the sum reaches the target, then record and shrink while it still does. */
function shortestWindow(): Walkthrough {
  const nums = [2, 3, 1, 2, 4, 3];
  const target = 7;
  const frames: Frame[] = [];
  let left = 0;
  let sum = 0;
  let bestLen = 0;
  let bestStart = -1;

  const draw = (l: number, r: number, o: { recorded?: boolean; done?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    if (o.done) items.push(bandOver("win", bestStart, bestStart + bestLen - 1, { ...S, tone: "strong" }));
    else if (r >= l) items.push(bandOver("win", l, r, { ...S, tone: "accent" }));
    items.push(rowLabel("lbl", "nums", -10, 0, S.size));
    items.push(
      ...row("c", nums, {
        ...S,
        index: true,
        tone: (i) => (o.done ? (i >= bestStart && i < bestStart + bestLen ? "strong" : "plain") : i >= l && i <= r ? "accent" : i < l ? "muted" : "plain"),
      }),
    );
    if (!o.done) {
      items.push(under("L", l, "left", { ...S, indexed: true }));
      items.push(over("R", r, "right", { ...S, tone: "ink" }));
    }
    const winSum = o.done ? nums.slice(bestStart, bestStart + bestLen).reduce((a, b) => a + b, 0) : nums.slice(l, r + 1).reduce((a, b) => a + b, 0);
    items.push(note("sum", `sum = ${winSum}${winSum >= target ? ` ≥ ${target}` : ` < ${target}`}`, 0, S.size + 58, { weight: 600 }));
    items.push(note("best", `shortest so far: ${bestLen ? `${bestLen} (${bestStart}..${bestStart + bestLen - 1})` : "none"}`, 0, S.size + 80, { tone: "soft", size: 12 }));
    return items;
  };

  let pendingGrow: number[] = [];
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    pendingGrow.push(right);
    while (sum >= target) {
      const len = right - left + 1;
      const better = bestLen === 0 || len < bestLen;
      if (better) {
        bestLen = len;
        bestStart = left;
      }
      const grew = pendingGrow.map((i) => nums[i]);
      const lead = grew.length > 1 ? `Grow until the sum reaches ${target}: ${grew.join(", ")} enter, sum ${sum}.` : grew.length === 1 ? `${grew[0]} enters: sum ${sum}.` : `Still ${sum} ≥ ${target}.`;
      frames.push({
        caption: `${lead} Valid, so record length ${len}${better ? " — the shortest yet" : `, no shorter than ${bestLen}`}, then drop ${nums[left]} from the left to try a shorter window.`,
        items: draw(left, right, { recorded: true }),
      });
      pendingGrow = [];
      sum -= nums[left];
      left++;
    }
  }
  frames.push({
    caption: `After the last drop the sum is ${sum} < ${target} and right has reached the end. The shortest window is ${bestStart}..${bestStart + bestLen - 1}, length ${bestLen}: every start that had a valid window got its shortest one recorded.`,
    items: draw(left, nums.length - 1, { done: true }),
  });
  return finish({ title: "The shortest window: record and shrink while it is still valid", input: `nums = ${show(nums)}, target = ${target}`, frames });
}

/** Exactly K distinct = at most K − at most (K − 1): two monotone counts, each adding right − left + 1 per step. */
function exactlyK(): Walkthrough {
  const nums = [1, 2, 1, 2, 3];
  const K = 2;
  const Y2 = 96;
  const X_SUM = slotX(nums.length, 0, S.size, S.gap) + 14;
  const run = (k: number) => {
    const lefts: number[] = [];
    const cnt = new Map<number, number>();
    let left = 0;
    nums.forEach((v, r) => {
      cnt.set(v, (cnt.get(v) ?? 0) + 1);
      while (cnt.size > k) {
        const u = nums[left];
        cnt.set(u, cnt.get(u)! - 1);
        if (cnt.get(u) === 0) cnt.delete(u);
        left++;
      }
      lefts.push(left);
    });
    return lefts;
  };
  const lk = run(K);
  const lk1 = run(K - 1);
  const adds = (lefts: number[]) => lefts.map((l, r) => r - l + 1);
  const a = adds(lk);
  const b = adds(lk1);
  const sumTo = (xs: number[], r: number) => xs.slice(0, r + 1).reduce((p, q) => p + q, 0);
  const frames: Frame[] = [];

  const draw = (r: number, done = false): Item[] => {
    const items: Item[] = [];
    const lane = (id: string, y: number, l: number, name: string, xs: number[]) => {
      if (!done) items.push(bandOver(`${id}w`, l, r, { ...S, y }));
      items.push(label(`${id}n`, name, 0, y - 16, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }));
      items.push(...row(`${id}c`, nums, { ...S, y, tone: (i) => (!done && i >= l && i <= r ? "accent" : "plain") }));
      const parts = xs.slice(0, r + 1);
      items.push(note(`${id}s`, done ? `${parts.join(" + ")} = ${sumTo(xs, r)}` : `+${xs[r]} → ${sumTo(xs, r)}`, X_SUM, y + S.size / 2, { weight: 600, size: 12.5, tone: done ? "ink" : "accent" }));
    };
    lane("a", 0, lk[r], `at most ${K} distinct`, a);
    lane("b", Y2, lk1[r], `at most ${K - 1} distinct`, b);
    if (done) items.push(note("ex", `exactly ${K} = ${sumTo(a, r)} − ${sumTo(b, r)} = ${sumTo(a, r) - sumTo(b, r)}`, 0, Y2 + S.size + 30, { weight: 700, size: 13 }));
    return items;
  };

  nums.forEach((_, r) => {
    frames.push({
      caption:
        r === 0
          ? `"At most ${K} distinct" is monotone, so a window counts it: after shrinking, every start from left to right gives a valid subarray ending at right — right − left + 1 of them. The same loop runs for at most ${K - 1}.`
          : `right = ${r}: at most ${K} keeps ${lk[r]}..${r} and adds ${a[r]}; at most ${K - 1} keeps ${lk1[r]}..${r} and adds ${b[r]}.${lk[r] > lk[r - 1] ? ` A third distinct value forced the first window to shrink.` : ""}`,
      items: draw(r),
    });
  });
  const last = nums.length - 1;
  frames.push({
    caption: `A subarray with at most ${K} distinct values has either exactly ${K} or at most ${K - 1}, never both, so subtracting leaves exactly ${K}: ${sumTo(a, last)} − ${sumTo(b, last)} = ${sumTo(a, last) - sumTo(b, last)} subarrays. "Exactly" is not monotone; the two "at most" counts are.`,
    items: draw(last, true),
  });
  return finish({ title: "Counting exactly K: at most K minus at most K − 1", input: `nums = ${show(nums)}, K = ${K}`, frames });
}

/** With a negative number the shrink rule never fires: the window misses [4]. */
function negativeFail(): Walkthrough {
  const nums = [-1, 4];
  const target = 4;
  // The shortest-window loop, as the lesson's program runs it.
  let left = 0;
  let sum = 0;
  let found = 0;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      found = right - left + 1;
      sum -= nums[left];
      left++;
    }
  }
  const answerAt = nums.findIndex((v) => v >= target);
  const NX = slotX(nums.length, 0, S.size, S.gap) + 18;
  const base = (tone: (i: number) => "accent" | "strong" | "error" | "plain"): Item[] => [rowLabel("lbl", "nums", -10, 0, S.size), ...row("c", nums.map(fmt), { ...S, index: true, tone })];
  return finish({
    title: "Where the window fails: a negative number",
    input: `nums = [${nums.map(fmt).join(", ")}], target = ${target}`,
    frames: [
      {
        caption: `The window grows to the whole array and its sum is ${fmt(sum)} < ${target}. The shrink loop only runs once the sum reaches the target, so it never runs, and the program reports ${found ? `a length of ${found}` : "that no subarray reaches 4"}.`,
        items: [bandOver("win", 0, nums.length - 1, { ...S }), ...base(() => "accent"), note("s1", `sum = ${fmt(nums.reduce((p, q) => p + q, 0))} < ${target}`, NX, S.size / 2 - 10, { weight: 600 }), note("s2", "shrink never runs", NX, S.size / 2 + 12, { tone: "soft", size: 12 })],
      },
      {
        caption: `Yet [${nums[answerAt]}] alone reaches ${target}. Dropping ${fmt(nums[0])} would raise the sum — the one move the shrink rule never makes, because it assumes removing an element can only lower it. With negatives, use prefix sums.`,
        items: [bandOver("win", answerAt, answerAt, { ...S, tone: "strong" }), ...base((i) => (i === answerAt ? "strong" : "error")), note("s1", `[${nums[answerAt]}]: sum = ${nums[answerAt]} ≥ ${target}`, NX, S.size / 2 - 10, { weight: 600 }), note("s2", "missed by the window", NX, S.size / 2 + 12, { tone: "soft", size: 12 })],
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "two-kinds": twoKinds,
  "fixed-slide": fixedSlide,
  "grow-shrink": growShrink,
  "valid-starts": validStarts,
  "shortest-window": shortestWindow,
  "exactly-k": exactlyK,
  "negative-fail": negativeFail,
};
