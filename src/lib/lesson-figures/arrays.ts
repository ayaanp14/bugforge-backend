import { finish, note, over, row, rowLabel, show, slotMid, slotX, spanOver, under, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, grid, gridCell, label, region } from "./kit.js";

/**
 * Arrays: the lesson's figures (content/roadmap/arrays.md places each with
 * "@figure <name>"). A data-structure lesson, so the set is how an array is
 * stored, what each operation moves, how a dynamic array grows, and the
 * one-pass patterns built on top — every value computed by running it.
 */

/** Small text in the index/address lines under a row. */
const small = (id: string, text: string, x: number, y: number, tone: "soft" | "faint" | "accent" = "faint"): Item => label(id, text, x, y, { mono: true, size: 10.5, tone });

/** Contiguous memory: the address formula, reading one index without visiting the others, and why the block cannot grow in place. */
function memoryLayout(): Walkthrough {
  const arr = [7, 1, 5, 3, 6];
  const BASE = 1000;
  const BYTES = 4;
  const READ = 3;
  const addr = (i: number) => BASE + i * BYTES;
  const S = { size: 44, gap: 6 };
  const mid = (i: number) => slotMid(i, 0, S.size, S.gap);
  const Y_IDX = S.size + 13;
  const Y_ADDR = S.size + 31;

  const draw = (o: { read?: boolean; beyond?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("lbl", "arr", -12, 0, S.size)];
    items.push(...row("c", arr, { ...S, tone: (i) => (o.read && i === READ ? "accent" : "plain") }));
    items.push(label("il", "index", -12, Y_IDX, { anchor: "end", size: 11, tone: "faint" }));
    items.push(label("al", "address", -12, Y_ADDR, { anchor: "end", size: 11, tone: "faint" }));
    const shown = o.beyond ? arr.length + 2 : arr.length;
    for (let i = 0; i < shown; i++) {
      if (i < arr.length) items.push(small(`i${i}`, String(i), mid(i), Y_IDX));
      items.push(small(`a${i}`, String(addr(i)), mid(i), Y_ADDR, o.read && i === READ ? "accent" : i < arr.length ? "soft" : "faint"));
    }
    if (o.beyond) {
      for (let i = arr.length; i < shown; i++) items.push(box(`x${i}`, slotX(i, 0, S.size, S.gap), 0, "", { tone: "muted", w: S.size, h: S.size }));
      items.push(label("xl", "used by other data", (mid(arr.length) + mid(shown - 1)) / 2, -14, { size: 11, tone: "faint" }));
    }
    if (!o.read && !o.beyond) items.push(spanOver("bytes", 0, 0, `${BYTES} bytes`, S));
    if (o.read) items.push(arrow("jump", { x: mid(0), y: -6 }, { x: mid(READ), y: -6 }, { tone: "accent", bow: -26, label: `+ ${READ} × ${BYTES}` }));
    const formula = o.read ? `arr[${READ}] is at ${BASE} + ${READ} × ${BYTES} = ${addr(READ)}` : `arr[i] is at ${BASE} + i × ${BYTES}`;
    items.push(note("f", formula, 0, S.size + 62, { weight: 600 }));
    return items;
  };

  return finish({
    title: "How an array sits in memory",
    input: `arr = ${show(arr)}, 4-byte ints starting at address ${BASE}`,
    frames: [
      {
        caption: `The elements sit side by side in one block, in index order, each taking the same ${BYTES} bytes. So the address of any element is the start of the block plus its index times ${BYTES}.`,
        items: draw({}),
      },
      {
        caption: `Reading arr[${READ}] is one multiplication and one addition: ${BASE} + ${READ} × ${BYTES} = ${addr(READ)}. Elements 0 to ${READ - 1} are never looked at, so any index costs the same — O(1). The first element is zero steps from the start, hence index 0.`,
        items: draw({ read: true }),
      },
      {
        caption: `The price: the block was sized when the array was made, and the bytes just after it, from ${addr(arr.length)} on, may belong to something else. A plain array cannot grow in place — it has a fixed length.`,
        items: draw({ beyond: true }),
      },
    ],
  });
}

/** Inserting into the middle: every later element shifts one place right, last first, before the new value fits. */
function insertShift(): Walkthrough {
  const start = [7, 1, 5, 3, 6];
  const AT = 1;
  const VALUE = 9;
  const CAP = start.length + 1;
  const S = { size: 42, gap: 8 };
  const mid = (i: number) => slotMid(i, 0, S.size, S.gap);
  type Slot = { id: string; v: number } | null;
  const slots: Slot[] = [...start.map((v, k) => ({ id: `v${k}`, v })), null];
  const frames: Frame[] = [];
  let moves = 0;

  const draw = (o: { moved?: number; placed?: boolean; plan?: boolean } = {}): Item[] => {
    const items: Item[] = [rowLabel("lbl", "arr", -12, 0, S.size)];
    for (let i = 0; i < CAP; i++) items.push(box(`s${i}`, slotX(i, 0, S.size, S.gap), 0, "", { tone: "ghost", w: S.size, h: S.size }));
    slots.forEach((c, i) => {
      if (!c) return;
      const tone = c.id === "new" ? "strong" : i === o.moved ? "accent" : "plain";
      items.push(box(c.id, slotX(i, 0, S.size, S.gap), 0, c.v, { tone, w: S.size, h: S.size }));
    });
    for (let i = 0; i < CAP; i++) items.push(small(`i${i}`, String(i), mid(i), S.size + 13));
    if (o.moved !== undefined) items.push(arrow("mv", { x: mid(o.moved - 1) + 6, y: -6 }, { x: mid(o.moved) - 2, y: -6 }, { tone: "accent", bow: -16 }));
    if (o.plan) {
      items.push(spanOver("must", AT, start.length - 1, `${start.length - AT} values must move`, { ...S, lift: 12 }));
      items.push(under("ins", AT, `insert ${VALUE} here`, { ...S, y: 13 }));
    }
    items.push(note("cnt", `values moved: ${moves}`, 0, S.size + 62, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `To put ${VALUE} at index ${AT}, the block must stay unbroken and in order, so everything from index ${AT} onwards has to move one place right first — into the spare slot at the end.`,
    items: draw({ plan: true }),
  });
  for (let i = start.length; i > AT; i--) {
    slots[i] = slots[i - 1];
    slots[i - 1] = null;
    moves++;
    const v = slots[i]!.v;
    frames.push({
      caption:
        i === start.length
          ? `Start from the back: ${v} moves from index ${i - 1} to ${i}. Moving the front first would overwrite a value before it had been copied.`
          : `${v} moves from index ${i - 1} to ${i}, into the slot the previous move just emptied.${i === AT + 1 ? ` Index ${AT} is free now.` : ""}`,
      items: draw({ moved: i }),
    });
  }
  slots[AT] = { id: "new", v: VALUE };
  frames.push({
    caption: `${VALUE} goes into index ${AT}: ${moves} values moved for one insert. Inserting at index i moves n − i values, so the front costs O(n) and the end costs nothing. Deleting is the mirror image, shifting left.`,
    items: draw({ placed: true }),
  });
  return finish({ title: `Inserting into the middle of an array`, input: `arr = ${show(start)}, insert ${VALUE} at index ${AT}`, frames });
}

/** A dynamic array appending eight values: the block doubles when full, and the copies add up to fewer than the appends. */
function dynamicGrowth(): Walkthrough {
  const values = [5, 3, 8, 1, 9, 2, 7, 4];
  const S = { size: 40, gap: 6 };
  const mid = (i: number) => slotMid(i, 0, S.size, S.gap);
  const data: number[] = [];
  let cap = 1;
  let copies = 0;
  const frames: Frame[] = [];

  const draw = (o: { copied: number; added: number[] }): Item[] => {
    const items: Item[] = [];
    const w = cap * (S.size + S.gap) - S.gap;
    items.push(...region("blk", -5, -5, w + 10, S.size + 10, `block of ${cap}`, { labelTone: "soft" }));
    for (let i = 0; i < cap; i++) items.push(box(`s${i}`, slotX(i, 0, S.size, S.gap), 0, "", { tone: "ghost", w: S.size, h: S.size }));
    data.forEach((v, i) => items.push(box(`v${i}`, slotX(i, 0, S.size, S.gap), 0, v, { tone: o.added.includes(i) ? "strong" : i < o.copied ? "accent" : "plain", w: S.size, h: S.size })));
    for (let i = 0; i < cap; i++) items.push(small(`i${i}`, String(i), mid(i), S.size + 14));
    items.push(note("sz", `size ${data.length}, capacity ${cap}`, 0, S.size + 46, { tone: "soft", size: 12 }));
    items.push(note("cost", `appends ${data.length} · values copied ${copies}`, 0, S.size + 68, { weight: 600 }));
    return items;
  };

  values.forEach((v, k) => {
    let copied = 0;
    if (data.length === cap) {
      copied = data.length;
      copies += copied;
      cap *= 2;
    }
    data.push(v);
    if (k >= 5 && k < values.length - 1) return; // the last three appends fit, so they share one frame
    const added = k === values.length - 1 ? [5, 6, 7] : [k];
    let caption: string;
    if (k === 0) caption = `The first append: ${v} goes into a block with room for one. A dynamic array keeps a size (slots in use) and a capacity (slots in the block).`;
    else if (copied) caption = `Appending ${v} finds the block full. A block twice as big (${cap}) is allocated, the ${copied} value${copied === 1 ? "" : "s"} already stored ${copied === 1 ? "is" : "are"} copied across, and ${v} goes in after ${copied === 1 ? "it" : "them"}.`;
    else if (k < values.length - 1) caption = `${v} fits in the spare slot: no copying at all. Most appends are like this — one write, O(1).`;
    else caption = `The last three appends fit without copying. ${values.length} appends cost ${copies} copies in all, 1 + 2 + 4. Because the block doubles, the copies always total less than 2n, so n appends are O(n) work: amortised O(1) each.`;
    frames.push({ caption, items: draw({ copied, added }) });
  });
  return finish({ title: "How a dynamic array grows when it is full", input: `append ${values.join(", ")} to an empty array`, frames });
}

/**
 * Best Time to Buy and Sell Stock as a triangle of every (buy, sell) pair
 * and its profit. Within one sell column every cell subtracts from the same
 * price, so only the row with the cheapest earlier price can win — one
 * candidate per column instead of the whole column.
 */
function cheapestBuy(): Walkthrough {
  const prices = [7, 1, 5, 3, 6, 4];
  const n = prices.length;
  const G = { w: 38, h: 30, gap: 4, x: 0, y: 0 };
  // Row b = buy day (0..n-2), column s = sell day (1..n-1); a cell exists when b < s.
  const rows = prices.slice(0, -1).map((_, b) => prices.slice(1).map((_, c) => (b < c + 1 ? String(prices[c + 1] - prices[b]).replace("-", "−") : "")));
  const keep = new Map<number, number>(); // sell day -> the buy day the pass would use
  const frames: Frame[] = [];

  const draw = (current: number | null, final = false): Item[] => {
    const bestCell = final ? [...keep.entries()].reduce((a, e) => (prices[e[0]] - prices[e[1]] > prices[a[0]] - prices[a[1]] ? e : a)) : null;
    const tone = (b: number, c: number) => {
      const s = c + 1;
      if (b >= s) return "ghost" as const;
      if (bestCell && s === bestCell[0] && b === bestCell[1]) return "strong" as const;
      if (!keep.has(s)) return "plain" as const;
      if (keep.get(s) !== b) return "muted" as const;
      return s === current ? ("accent" as const) : ("plain" as const);
    };
    const items = grid("g", rows, {
      ...G,
      tone,
      rowLabels: prices.slice(0, -1).map((p) => `buy at ${p}`),
      colLabels: prices.slice(1).map((p) => String(p)),
      size: 12.5,
    }).filter((it) => !(it.k === "cell" && it.tone === "ghost"));
    items.push(label("ch", "sell at →", gridCell(0, 0, G).x - 8, -10, { anchor: "end", size: 11, tone: "faint" }));
    const kept = [...keep.values()].length;
    items.push(note("cnt", `candidates kept: ${kept} of ${(n * (n - 1)) / 2} pairs`, 0, gridCell(n - 2, 0, G).y + G.h + 24, { tone: "soft", size: 12 }));
    return items;
  };

  frames.push({
    caption: `Each cell is one trade: buy on the row's day, sell on the column's later day, profit written in. Trying every pair means all ${(n * (n - 1)) / 2} cells — about n²/2, five billion when n = 100,000.`,
    items: draw(null),
  });
  let minDay = 0;
  for (let s = 1; s < n; s++) {
    keep.set(s, minDay);
    const col = s;
    const others = s - 1;
    frames.push({
      caption:
        others === 0
          ? `Selling at ${prices[s]} (day ${s}) has only one possible buy day, at ${prices[minDay]}. Keep it.`
          : `Every cell in the "sell at ${prices[col]}" column subtracts from the same ${prices[col]}, so the row with the cheapest earlier price, ${prices[minDay]}, wins. The other ${others} can never be the answer.`,
      items: draw(s),
    });
    if (prices[s] < prices[minDay]) minDay = s;
  }
  const best = Math.max(...[...keep.entries()].map(([s, b]) => prices[s] - prices[b]));
  frames.push({
    caption: `One kept cell per column, and the best of them, ${best}, is the answer. The cheapest earlier price is exactly what a running minimum holds when the pass reaches each day — n candidates instead of n²/2.`,
    items: draw(null, true),
  });
  return finish({ title: "Why the cheapest earlier day is the only buy worth checking", input: `prices = ${show(prices)}`, frames });
}

/** Product of Array Except Self: the left products fill the answer, then a single running product sweeps in from the right. */
function leftRight(): Walkthrough {
  const nums = [1, 2, 3, 4];
  const n = nums.length;
  const S = { size: 44, gap: 10 };
  const mid = (i: number) => slotMid(i, 0, S.size, S.gap);
  const Y_ANS = 110;
  const answer = new Array<number>(n).fill(1);
  const frames: Frame[] = [];

  const draw = (o: { i?: number; pass: "idea" | "left" | "right" | "done"; right?: number; ideaAt?: number }): Item[] => {
    const items: Item[] = [rowLabel("ln", "nums", -12, 0, S.size), rowLabel("la", "answer", -12, Y_ANS, S.size)];
    items.push(...row("n", nums, { ...S, tone: (k) => (o.pass === "idea" && k === o.ideaAt ? "accent" : "plain") }));
    for (let k = 0; k < n; k++) items.push(small(`ni${k}`, String(k), mid(k), S.size + 13));
    const filled = (k: number) => (o.pass === "left" ? k <= (o.i ?? 0) : o.pass === "right" ? true : o.pass === "done");
    items.push(
      ...row("a", answer, {
        ...S,
        y: Y_ANS,
        text: (k) => (o.pass === "idea" ? (k === o.ideaAt ? String(answer[k]) : "") : String(answer[k])),
        tone: (k) => {
          if (o.pass === "done") return "strong";
          if (o.pass === "idea") return k === o.ideaAt ? "strong" : "ghost";
          if (k === o.i) return "accent";
          if (o.pass === "right" && k > (o.i ?? n)) return "strong";
          return filled(k) ? "plain" : "ghost";
        },
      }),
    );
    if (o.pass === "idea" && o.ideaAt !== undefined) {
      const at = o.ideaAt;
      const leftP = nums.slice(0, at).reduce((a, b) => a * b, 1);
      const rightP = nums.slice(at + 1).reduce((a, b) => a * b, 1);
      items.push(spanOver("sl", 0, at - 1, `left: ${nums.slice(0, at).join(" × ")} = ${leftP}`, { ...S, lift: 12 }));
      items.push(spanOver("sr", at + 1, n - 1, `right: ${rightP}`, { ...S, lift: 12 }));
      items.push(arrow("down", { x: mid(at), y: S.size + 24 }, { x: mid(at), y: Y_ANS - 6 }, { tone: "accent", label: `${leftP} × ${rightP}` }));
    }
    if (o.pass === "left" && o.i !== undefined && o.i > 0) {
      items.push(arrow("fromN", { x: mid(o.i - 1) + 8, y: S.size + 22 }, { x: mid(o.i) - 8, y: Y_ANS - 6 }, { tone: "accent", label: `× ${nums[o.i - 1]}` }));
      items.push(arrow("fromA", { x: mid(o.i - 1) + 4, y: Y_ANS + S.size + 6 }, { x: mid(o.i) - 4, y: Y_ANS + S.size + 6 }, { tone: "ink", bow: 14 }));
    }
    if ((o.pass === "right" || o.pass === "done") && o.right !== undefined) {
      const at = o.pass === "done" ? 0 : (o.i ?? 0);
      items.push(under("rv", at, `right = ${o.right}`, { ...S, y: Y_ANS, tone: o.pass === "done" ? "ink" : "accent" }));
    }
    items.push(label("ph", o.pass === "idea" ? "the idea" : o.pass === "left" ? "pass 1: left to right" : o.pass === "right" ? "pass 2: right to left" : "done", -12 - 40, -26, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }));
    return items;
  };

  const IDEA = 2;
  const ideaAnswer = nums.filter((_, k) => k !== IDEA).reduce((a, b) => a * b, 1);
  answer[IDEA] = ideaAnswer;
  frames.push({
    caption: `The product of everything except index ${IDEA} splits in two: everything to its left times everything to its right. Both halves are running products, and one pass can build each.`,
    items: draw({ pass: "idea", ideaAt: IDEA }),
  });
  answer.fill(1);
  for (let i = 1; i < n; i++) {
    const before = answer[i - 1];
    answer[i] = answer[i - 1] * nums[i - 1];
    frames.push({
      caption:
        i === 1
          ? `Pass 1 stores left products in answer itself. answer[0] = 1, since nothing is left of index 0; then answer[1] = answer[0] × nums[0] = ${before} × ${nums[0]} = ${answer[1]}.`
          : `answer[${i}] = answer[${i - 1}] × nums[${i - 1}] = ${before} × ${nums[i - 1]} = ${answer[i]}: the product of everything left of index ${i}, from one multiplication.`,
      items: draw({ pass: "left", i }),
    });
  }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    const leftP = answer[i];
    const r = right;
    answer[i] *= right;
    right *= nums[i];
    frames.push({
      caption:
        i === n - 1
          ? `Pass 2 walks back with one variable, right, the product of everything after i — 1 at the end. answer[${i}] = ${leftP} × ${r} = ${answer[i]}, then right picks up nums[${i}] and becomes ${right}.`
          : `answer[${i}] = ${leftP} (left) × ${r} (right) = ${answer[i]}, and right becomes ${r} × ${nums[i]} = ${right}.${i === 0 ? "" : ""}`,
      items: draw({ pass: "right", i, right: r }),
    });
  }
  frames.push({
    caption: `answer = ${show(answer)}: two passes of n steps, no division, and only one extra variable besides the output. A zero in nums needs no special case — it simply sits in the left or right product.`,
    items: draw({ pass: "done", right }),
  });
  return finish({ title: "Product of array except self, with left and right passes", input: `nums = ${show(nums)}`, frames });
}

/** Writing answers into the array you are still reading: Build Array from Permutation in place reads a value it has already overwritten. */
function overwriteTrap(): Walkthrough {
  const start = [0, 2, 1, 5, 3, 4];
  const expected = start.map((v) => start[v]);
  const nums = [...start];
  const n = start.length;
  const S = { size: 40, gap: 8 };
  const mid = (i: number) => slotMid(i, 0, S.size, S.gap);
  const Y = 96;
  const frames: Frame[] = [];

  const draw = (o: { i?: number; wrong?: number; read?: number; changed: Set<number>; fix?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("le", "wanted", -12, 0, S.size)];
    items.push(...row("e", expected, { ...S, tone: (k) => (k === o.wrong ? "accent" : "plain") }));
    items.push(rowLabel("ln", o.fix ? "ans" : "nums", -12, Y, S.size));
    const shown = o.fix ? expected : nums;
    items.push(
      ...row("n", shown, {
        ...S,
        y: Y,
        // The slot being written is the subject; in the failing step, so is the overwritten slot it reads.
        tone: (k) => (o.fix ? "strong" : k === o.wrong ? "error" : k === o.i || (o.wrong !== undefined && k === o.read) ? "accent" : o.changed.has(k) ? "muted" : "plain"),
      }),
    );
    for (let k = 0; k < n; k++) items.push(small(`ni${k}`, String(k), mid(k), Y + S.size + 13));
    if (o.read !== undefined && o.i !== undefined && o.read !== o.i) items.push(arrow("rd", { x: mid(o.read) + (o.read < o.i ? 6 : -6), y: Y - 6 }, { x: mid(o.i) + (o.read < o.i ? -6 : 6), y: Y - 6 }, { tone: o.wrong !== undefined ? "error" : "accent", bow: o.read < o.i ? -18 : 18 }));
    if (o.i !== undefined && !o.fix) items.push(under("ip", o.i, "i", { ...S, y: Y, indexed: true, tone: "ink" }));
    return items;
  };

  frames.push({
    caption: `Build Array from Permutation asks for ans[i] = nums[nums[i]]. The top row is the right answer, computed from an untouched copy. Now try writing each answer straight back into nums.`,
    items: draw({ changed: new Set() }),
  });
  const changed = new Set<number>();
  for (let i = 0; i < n; i++) {
    const idx = nums[i];
    const got = nums[idx];
    const ok = got === expected[i];
    nums[i] = got;
    if (!ok) {
      frames.push({
        caption: `i = ${i}: nums[${i}] is ${idx}, so it reads nums[${idx}] — but that slot was overwritten at step ${idx} and now holds ${got}, not ${start[idx]}. The answer here should be ${expected[i]}: the in-place write destroyed a value still needed.`,
        items: draw({ i, read: idx, wrong: i, changed }),
      });
      break;
    }
    changed.add(i);
    frames.push({
      caption:
        i === 0
          ? `i = 0: nums[0] is ${idx}, so ans[0] = nums[${idx}] = ${got}. That is right, and writing it back into nums[0] changes nothing yet.`
          : `i = ${i}: nums[${i}] is ${idx}, and nums[${idx}] is ${got}, which matches. But writing ${got} over index ${i} erases the ${start[i]} that sat there — and a later index may look it up.`,
      items: draw({ i, read: idx, changed }),
    });
  }
  frames.push({
    caption: `The fix is to never read a slot you have written: fill a second array ans (O(n) space), or keep both numbers in one slot with nums[i] += n × (nums[nums[i]] % n), then divide every slot by n (O(1) space).`,
    items: draw({ changed: new Set(), fix: true }),
  });
  return finish({ title: "Editing in place: overwriting a value still needed", input: `nums = ${show(start)}, ans[i] = nums[nums[i]]`, frames });
}

/** A grid stored row by row: cell (r, c) of an m × n grid is position r × n + c of one long row. */
function rowMajor(): Walkthrough {
  const R = 3;
  const C = 4;
  const letters = "abcdefghijkl".split("");
  const cells = Array.from({ length: R }, (_, r) => letters.slice(r * C, r * C + C));
  const AT: [number, number] = [1, 2];
  const flatAt = AT[0] * C + AT[1];
  const G = { w: 42, h: 34, gap: 4, x: 0, y: 0 };
  const S = { size: 30, gap: 4 };
  const Y_FLAT = R * (G.h + G.gap) + 64;
  const items: Item[] = grid("g", cells, {
    ...G,
    tone: (r, c) => (r === AT[0] && c === AT[1] ? "accent" : "plain"),
    rowLabels: Array.from({ length: R }, (_, r) => `row ${r}`),
    colLabels: Array.from({ length: C }, (_, c) => `col ${c}`),
  });
  items.push(rowLabel("fl", "memory", -10, Y_FLAT, S.size));
  items.push(...row("f", letters, { ...S, y: Y_FLAT, tone: (k) => (k === flatAt ? "accent" : "plain") }));
  for (let k = 0; k < letters.length; k++) items.push(small(`fi${k}`, String(k), slotMid(k, 0, S.size, S.gap), Y_FLAT + S.size + 12));
  for (let r = 0; r < R; r++) items.push(spanOver(`sp${r}`, r * C, r * C + C - 1, `row ${r}`, { ...S, y: Y_FLAT, lift: 8 }));
  const src = gridCell(AT[0], AT[1], G);
  // The formula sits right of the grid and the arrow drops from it, so it crosses no cell.
  const fx = gridCell(0, C - 1, G).x + G.w + 22;
  items.push(note("fx", `grid[${AT[0]}][${AT[1]}] → ${AT[0]} × ${C} + ${AT[1]} = ${flatAt}`, fx, src.mid.y, { weight: 600, size: 12.5 }));
  const target = slotMid(flatAt, 0, S.size, S.gap);
  items.push(arrow("map", { x: Math.max(target, fx + 24), y: src.mid.y + 14 }, { x: target, y: Y_FLAT - 26 }, { tone: "accent" }));
  return finish({
    title: "A two-dimensional array laid out row by row",
    input: "",
    frames: [
      {
        caption: `A ${R} × ${C} grid stored in row-major order: row 0, then row 1, then row 2, in one block. Cell (r, c) sits at position r × ${C} + c, so grid[${AT[0]}][${AT[1]}] is position ${flatAt}. Looping row by row reads memory in order.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "memory-layout": memoryLayout,
  "insert-shift": insertShift,
  "dynamic-growth": dynamicGrowth,
  "cheapest-buy": cheapestBuy,
  "left-right": leftRight,
  "overwrite-trap": overwriteTrap,
  "row-major": rowMajor,
};
