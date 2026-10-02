import { finish, note, show, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Bit Manipulation — the lesson's figures (content/roadmap/bit-manipulation.md
 * places each with "@figure <name>"; the popcount loop is the hub's
 * walkthrough). A number is drawn as a row of bit cells, highest bit on the
 * left as it is printed, with every value computed by the operator the
 * frame names — the 8-bit rows are the real low byte of the result, read
 * as signed where the frame says so.
 */

const W = 8; // bits per row in most figures
const B = { size: 32, gap: 4 } as const;
const bx = (pos: number, width = W) => (width - 1 - pos) * (B.size + B.gap); // bit `pos` (0 = rightmost) → x
const bmid = (pos: number, width = W) => bx(pos, width) + B.size / 2;
const bitOf = (v: number, pos: number) => (v >>> pos) & 1;
const bin = (v: number, width = W) => Array.from({ length: width }, (_, k) => bitOf(v, width - 1 - k)).join("");
/** The low `width` bits read as a signed (two's complement) number. */
const signed = (v: number, width = W) => {
  const u = v & ((1 << width) - 1);
  return u >= 1 << (width - 1) ? u - (1 << width) : u;
};
const minus = (n: number) => String(n).replace("-", "−");

/** One number as a row of bits: a name on the left, the value on the right. Cell ids `${prefix}${pos}`. */
function bitRow(prefix: string, v: number, y: number, o: { name?: string; value?: string; tone?: (pos: number, bit: number) => Tone | undefined; width?: number } = {}): Item[] {
  const width = o.width ?? W;
  const items: Item[] = [];
  for (let pos = width - 1; pos >= 0; pos--) {
    const bit = bitOf(v, pos);
    items.push(box(`${prefix}${pos}`, bx(pos, width), y, bit, { tone: o.tone?.(pos, bit) ?? (bit ? "accent" : "plain"), w: B.size, h: B.size, size: 14 }));
  }
  if (o.name !== undefined) items.push({ k: "text", id: `${prefix}n`, x: -10, y: y + B.size / 2, text: o.name, tone: "ink", anchor: "end", size: 12.5, weight: 600 });
  if (o.value !== undefined) items.push({ k: "text", id: `${prefix}v`, x: bx(0, width) + B.size + 14, y: y + B.size / 2, text: o.value, tone: "soft", anchor: "start", size: 12.5 });
  return items;
}

/** Faint bit positions over a row. */
function positions(prefix: string, y: number, width = W): Item[] {
  return Array.from({ length: width }, (_, pos): Item => ({ k: "text", id: `${prefix}${pos}`, x: bmid(pos, width), y, text: String(pos), tone: "faint", anchor: "middle", size: 10.5 }));
}

/* ── Place values ────────────────────────────────────────────────── */

/** 44 in binary: each bit is worth twice the one to its right. */
function placeValues(): Walkthrough {
  const n = 44;
  const items: Item[] = [
    label("pl", "bit", -10, -14, { anchor: "end", size: 11, tone: "faint" }),
    ...positions("p", -14),
    ...bitRow("b", n, 0, { name: "44", tone: (_, bit) => (bit ? "accent" : "plain") }),
    label("wl", "worth", -10, B.size + 16, { anchor: "end", size: 11, tone: "faint" }),
  ];
  const parts: number[] = [];
  for (let pos = W - 1; pos >= 0; pos--) {
    const worth = 2 ** pos;
    const on = bitOf(n, pos) === 1;
    if (on) parts.push(worth);
    items.push({ k: "text", id: `w${pos}`, x: bmid(pos), y: B.size + 16, text: String(worth), tone: on ? "accent" : "faint", anchor: "middle", size: 11.5, weight: on ? 600 : 500 });
  }
  items.push(note("sum", `${parts.join(" + ")} = ${parts.reduce((a, b) => a + b, 0)}`, 0, B.size + 44, { size: 13, weight: 600 }));
  items.push(note("pc", `three set bits: popcount(44) = ${bin(n).split("").filter((c) => c === "1").length}`, 0, B.size + 66, { size: 12, tone: "soft" }));
  return finish({
    title: "Binary: each bit is worth twice the bit to its right",
    input: "",
    frames: [
      {
        caption: "Bits are numbered from the right, starting at 0, and bit i is worth 2 to the power i. 44 is 32 + 8 + 4, so bits 5, 3 and 2 are set. Bit 0 alone decides odd or even, and a power of two is a single set bit.",
        items,
      },
    ],
  });
}

/* ── Two's complement ────────────────────────────────────────────── */

/** 8-bit two's complement: the top bit is worth −128; negation is invert-and-add-one; the ordinary adder just works. */
function twosComplement(): Walkthrough {
  const frames: Frame[] = [];
  const worthRow = (y: number, hot = false): Item[] =>
    Array.from({ length: W }, (_, pos): Item => ({
      k: "text",
      id: `w${pos}`,
      x: bmid(pos),
      y,
      text: pos === W - 1 ? `−${2 ** pos}` : String(2 ** pos),
      tone: pos === W - 1 ? (hot ? "accent" : "soft") : "faint",
      anchor: "middle",
      size: 11,
      weight: pos === W - 1 ? 600 : 500,
    }));
  const sumOf = (v: number) => {
    const parts: string[] = [];
    for (let pos = W - 1; pos >= 0; pos--) if (bitOf(v, pos)) parts.push(pos === W - 1 ? `−${2 ** pos}` : String(2 ** pos));
    return parts.length ? `${parts.join(" + ").replace("+ −", "− ")} = ${minus(signed(v))}` : "0";
  };

  const x = 5;
  frames.push({
    caption: `In 8-bit two's complement the top bit is worth −128 instead of +128; the rest are as usual. ${x} has the top bit clear, so it reads the same either way: 00000101.`,
    items: [...worthRow(-14, true), ...bitRow("a", x, 0, { name: "x", value: `= ${x}` }), note("s", sumOf(x), 0, B.size + 26, { size: 12 })],
  });
  const inv = ~x & 0xff;
  frames.push({
    caption: `~x flips every bit. x and ~x have exactly one 1 in every position, so x + ~x is all ones, which is −1 — so ~x is −x − 1, here ${minus(signed(inv))}.`,
    items: [...worthRow(-14, true), ...bitRow("a", inv, 0, { name: "~x", value: `= ${minus(signed(inv))}` }), note("s", sumOf(inv), 0, B.size + 26, { size: 12 })],
  });
  const neg = (inv + 1) & 0xff;
  frames.push({
    caption: `Add 1 and you have −x: invert every bit, then add one. ${bin(neg)} is −128 + ${neg & 0x7f} = ${minus(signed(neg))}. The top bit of every negative number is 1.`,
    items: [...worthRow(-14, true), ...bitRow("a", neg, 0, { name: "−x", value: `= ${minus(signed(neg))}` }), note("s", sumOf(neg), 0, B.size + 26, { size: 12 })],
  });
  const total = x + neg;
  const Y2 = B.size + 8;
  const Y3 = 2 * (B.size + 8) + 10;
  frames.push({
    caption: `Why hardware likes it: ordinary binary addition works with no special case. ${x} + (${minus(signed(neg))}) carries all the way out of the top, the carry falls off the 8-bit word, and what is left is ${signed(total)}.`,
    items: [
      ...bitRow("a", x, 0, { name: "x", value: `= ${x}` }),
      ...bitRow("c", neg, Y2, { name: "+ (−x)", value: `= ${minus(signed(neg))}` }),
      { k: "edge", id: "rule", x1: 0, y1: Y3 - 6, x2: bx(0) + B.size, y2: Y3 - 6, tone: "ink" },
      box("carry", bx(W), Y3, (total >> W) & 1, { tone: "error", w: B.size, h: B.size, size: 14 }),
      label("carry-t", "falls off", bx(W) + B.size / 2, Y3 + B.size + 12, { tone: "error", size: 10.5 }),
      ...bitRow("r", total, Y3, { value: `= ${signed(total)}`, tone: () => "strong" }),
    ],
  });
  const rows = [-1, -128, 127];
  frames.push({
    caption: "−1 is all ones in every width, and the range is lopsided: 8 bits hold −128 to 127, a 32-bit int −2³¹ to 2³¹ − 1. Negating the smallest value overflows back to itself, which is why abs of the smallest int is still negative.",
    items: [...worthRow(-14), ...rows.flatMap((v, k) => bitRow(`e${k}`, v & 0xff, k * (B.size + 8), { name: minus(v), value: k === 0 ? "all ones" : k === 1 ? "the smallest" : "the largest" }))],
  });
  return finish({ title: "Negative numbers in two's complement", input: "8-bit integers, x = 5", frames });
}

/* ── The operators ───────────────────────────────────────────────── */

/** AND, OR and XOR bit by bit, then the shifts moving bits — and what fills the gap. */
function operators(): Walkthrough {
  const a = 12;
  const b = 10;
  const frames: Frame[] = [];
  const R2 = B.size + 8;
  const R3 = 2 * (B.size + 8) + 10;
  const rule: Item = { k: "edge", id: "rule", x1: 0, y1: R3 - 6, x2: bx(0) + B.size, y2: R3 - 6, tone: "ink" };
  const ops: Array<{ sym: string; f: (p: number, q: number) => number; rule: string; why: string }> = [
    { sym: "&", f: (p, q) => p & q, rule: "1 where both have a 1", why: "AND keeps a bit only where both numbers have it" },
    { sym: "|", f: (p, q) => p | q, rule: "1 where either has a 1", why: "OR sets a bit where either number has it" },
    { sym: "^", f: (p, q) => p ^ q, rule: "1 where they differ", why: "XOR sets a bit exactly where the two numbers differ" },
  ];
  for (const op of ops) {
    const r = op.f(a, b);
    frames.push({
      caption: `${op.why}, one column at a time and all ${W} columns at once: ${a} ${op.sym} ${b} = ${r}.`,
      items: [
        ...positions("p", -14),
        ...bitRow("a", a, 0, { name: "a", value: `= ${a}` }),
        ...bitRow("b", b, R2, { name: "b", value: `= ${b}` }),
        rule,
        ...bitRow("r", r, R3, { name: `a ${op.sym} b`, value: `= ${r}`, tone: (_, bit) => (bit ? "strong" : "plain") }),
        note("rl", op.rule, 0, R3 + B.size + 22, { size: 12, mono: false, tone: "soft" }),
      ],
    });
  }

  // The shifts: a before row, an after row, and an arrow for each set bit's move.
  const shift = (v: number, k: number, kind: "<<" | ">>" | ">>>", caption: (after: number) => string) => {
    const after = (kind === "<<" ? v << k : kind === ">>" ? signed(v) >> k : (v & 0xff) >>> k) & 0xff;
    const moved: Item[] = [];
    for (let pos = 0; pos < W; pos++) {
      if (!bitOf(v, pos)) continue;
      const to = kind === "<<" ? pos + k : pos - k;
      if (to < 0 || to >= W) continue;
      moved.push(arrow(`m${pos}`, { x: bmid(pos), y: B.size + 3 }, { x: bmid(to), y: R3 - 4 }, { tone: "line" }));
    }
    const filled = (pos: number) => (kind === "<<" ? pos < k : pos >= W - k);
    const gone = (pos: number) => (kind === "<<" ? pos >= W - k : pos < k);
    frames.push({
      caption: caption(after),
      items: [
        ...positions("p", -14),
        ...bitRow("a", v, 0, { name: "x", value: `= ${minus(signed(v))}`, tone: (pos, bit) => (gone(pos) ? "muted" : bit ? "accent" : "plain") }),
        ...moved,
        ...bitRow("r", after, R3, { name: `x ${kind} ${k}`, value: `= ${kind === ">>>" ? after : minus(signed(after))}`, tone: (pos, bit) => (filled(pos) ? "strong" : bit ? "accent" : "plain") }),
      ],
    });
  };
  shift(a, 1, "<<", (r) => `x << 1 moves every bit one place left and a 0 comes in at the bottom: ${a} becomes ${r}. Shifting left by k multiplies by 2 to the power k, while the result still fits.`);
  shift(a, 2, ">>", (r) => `x >> 2 moves every bit two places right; the bottom two fall off. ${a} becomes ${r}: dividing by 4 and rounding down.`);
  shift(-12 & 0xff, 2, ">>", (r) => `On a negative number >> fills the top with copies of the sign bit, so it stays negative: −12 >> 2 = ${minus(signed(r))}. It rounds towards minus infinity: −13 >> 2 is ${minus(-13 >> 2)}, where −13 / 4 truncates to ${minus(Math.trunc(-13 / 4))}.`);
  shift(-12 & 0xff, 2, ">>>", (r) => `>>> in Java and JavaScript fills the top with zeros and reads the bits as unsigned: here ${r} in 8 bits. C++ gets the same by shifting an unsigned type; Python has no fixed top to fill.`);
  return finish({ title: "The bitwise operators, one column at a time", input: "a = 12, b = 10, drawn as 8-bit integers", frames });
}

/* ── Why the lowest-bit tricks work ──────────────────────────────── */

/** n − 1 flips everything up to the lowest set bit; −x flips everything above it. AND splits x at that bit. */
function lowestBit(): Walkthrough {
  const x = 44;
  const low = x & -x;
  const lowPos = Math.log2(low);
  const frames: Frame[] = [];
  const R2 = B.size + 8;
  const R3 = 2 * (B.size + 8) + 10;
  const below = (pos: number) => pos <= lowPos;
  const band = (id: string, y1: number, y2: number, upTo: boolean): Item => {
    const from = upTo ? lowPos : W - 1;
    const to = upTo ? 0 : lowPos + 1;
    return { k: "band", id, x: bx(from) - 4, y: y1 - 4, w: bx(to) + B.size - bx(from) + 8, h: y2 - y1 + 8, tone: "accent" };
  };
  const rule: Item = { k: "edge", id: "rule", x1: 0, y1: R3 - 6, x2: bx(0) + B.size, y2: R3 - 6, tone: "ink" };

  frames.push({
    caption: `x = ${x} = ${bin(x)}. Its lowest set bit is bit ${lowPos}, worth ${low}. Everything below it is 0 — and both tricks are about what happens at and below that bit.`,
    items: [...positions("p", -14), ...bitRow("x", x, 0, { name: "x", value: `= ${x}`, tone: (pos, bit) => (pos === lowPos ? "strong" : bit ? "accent" : "plain") })],
  });
  const xm = x - 1;
  frames.push({
    caption: `Subtracting 1 has to borrow from the lowest 1: that bit becomes 0 and every 0 below it becomes 1 (shaded). The bits above it do not change.`,
    items: [
      ...positions("p", -14),
      band("bd", 0, R2 + B.size, true),
      ...bitRow("x", x, 0, { name: "x", value: `= ${x}` }),
      ...bitRow("y", xm, R2, { name: "x − 1", value: `= ${xm}`, tone: (pos, bit) => (below(pos) ? "strong" : bit ? "accent" : "plain") }),
    ],
  });
  const cleared = x & xm;
  frames.push({
    caption: `AND keeps the bits where x and x − 1 agree — everything above — and clears the shaded part, where they disagree in every position. x & (x − 1) = ${cleared}: x without its lowest set bit.`,
    items: [
      ...positions("p", -14),
      band("bd", 0, R3 + B.size, true),
      ...bitRow("x", x, 0, { name: "x", value: `= ${x}` }),
      ...bitRow("y", xm, R2, { name: "x − 1", value: `= ${xm}` }),
      rule,
      ...bitRow("r", cleared, R3, { name: "x & (x − 1)", value: `= ${cleared}`, tone: (_, bit) => (bit ? "strong" : "plain") }),
    ],
  });
  const inv = ~x & 0xff;
  const neg = -x & 0xff;
  frames.push({
    caption: `Now −x, which is ~x + 1. Inverting turns the trailing 0s into 1s and the lowest set bit into 0; adding 1 carries through those 1s and stops at that 0. So −x matches x at and below the lowest set bit, and is its opposite above.`,
    items: [
      ...positions("p", -14),
      band("bd", 0, R3 + B.size, true),
      ...bitRow("x", x, 0, { name: "x", value: `= ${x}` }),
      ...bitRow("y", inv, R2, { name: "~x", value: `= ${minus(signed(inv))}` }),
      ...bitRow("r", neg, R3, { name: "−x = ~x + 1", value: `= ${minus(signed(neg))}`, tone: (pos, bit) => (below(pos) && bit ? "strong" : bit ? "accent" : "plain") }),
    ],
  });
  const iso = x & neg;
  frames.push({
    caption: `AND x with −x: above the lowest set bit they are opposites, so every bit there clears; at and below it they agree. x & −x = ${iso}, the lowest set bit on its own.`,
    items: [
      ...positions("p", -14),
      band("bd", 0, R3 + B.size, false),
      ...bitRow("x", x, 0, { name: "x", value: `= ${x}` }),
      ...bitRow("y", neg, R2, { name: "−x", value: `= ${minus(signed(neg))}` }),
      rule,
      ...bitRow("r", iso, R3, { name: "x & −x", value: `= ${iso}`, tone: (_, bit) => (bit ? "strong" : "plain") }),
    ],
  });
  if (cleared + iso !== x) throw new Error("the two halves do not add back up");
  frames.push({
    caption: `The two tricks split x at the same bit: x & (x − 1) = ${cleared} is everything above it, x & −x = ${iso} is the bit itself, and ${cleared} + ${iso} = ${x}. Popcount and the power-of-two test use the first; Fenwick trees use the second.`,
    items: [
      ...positions("p", -14),
      ...bitRow("y", cleared, 0, { name: "x & (x − 1)", value: `= ${cleared}`, tone: (_, bit) => (bit ? "accent" : "plain") }),
      ...bitRow("r", iso, R2, { name: "x & −x", value: `= ${iso}`, tone: (_, bit) => (bit ? "strong" : "plain") }),
      rule,
      ...bitRow("x", x, R3, { name: "together", value: `= ${x}`, tone: (pos, bit) => (pos === lowPos ? "strong" : bit ? "accent" : "plain") }),
    ],
  });
  return finish({ title: "Why x & (x − 1) and x & −x work", input: `x = ${x}`, frames });
}

/* ── XOR cancels pairs ───────────────────────────────────────────── */

/** Single Number: the running XOR of [4, 1, 2, 1, 2], then the same terms regrouped so the pairs visibly cancel. */
function xorCancel(): Walkthrough {
  const nums = [4, 1, 2, 1, 2];
  const width = 3;
  const A = { size: 34, gap: 6 };
  const R1 = A.size + 26;
  const R2 = R1 + B.size + 10;
  const frames: Frame[] = [];

  const arr = (seen: number, order: number[] = nums.map((_, i) => i), tone?: (i: number) => Tone): Item[] =>
    order.map((i, slot) => box(`n${i}`, slot * (A.size + A.gap), 0, nums[i], { tone: tone ? tone(i) : i < seen - 1 ? "muted" : i === seen - 1 ? "accent" : "plain", w: A.size, h: A.size, size: 14 }));
  const rows = (v: number | null, before: number, run: number): Item[] => [
    ...(v === null ? [] : bitRow("v", v, R1, { name: "value", value: `= ${v}`, width })),
    ...bitRow("x", run, R2, { name: "running", value: `= ${run}`, width, tone: (pos, bit) => (v !== null && bitOf(before ^ run, pos) ? "strong" : bit ? "accent" : "plain") }),
  ];

  let run = 0;
  frames.push({ caption: "Every value appears twice except one. Start a running XOR at 0 and fold each value in; the strong bits in each step are the ones that flipped.", items: [...arr(0), ...rows(null, 0, run)] });
  nums.forEach((v, i) => {
    const before = run;
    run ^= v;
    frames.push({
      caption: `${before} ^ ${v} = ${run}: the bits where ${v} has a 1 flip. ${i === nums.length - 1 ? `Both 1s and both 2s are in now, and the running value has landed on ${run}.` : nums.indexOf(v) < i ? `This is the second ${v}, so its bits flip back.` : "The running value holds the XOR of everything so far."}`,
      items: [...arr(i + 1), ...rows(v, before, run)],
    });
  });
  // Regroup: the same terms in another order give the same XOR.
  const order = nums.map((_, i) => i).sort((p, q) => nums.filter((x) => x === nums[p]).length - nums.filter((x) => x === nums[q]).length || nums[p] - nums[q] || p - q);
  const pairs: Item[] = [];
  for (let s = 0; s < order.length; s++) {
    const v = nums[order[s]];
    if (s + 1 < order.length && nums[order[s + 1]] === v) {
      pairs.push({ k: "span", id: `pr${v}`, x1: s * (A.size + A.gap) + 2, x2: (s + 1) * (A.size + A.gap) + A.size - 2, y: A.size + 14, label: `${v} ^ ${v} = 0`, tone: "accent", down: true });
      s++;
    }
  }
  const single = nums.reduce((p, q) => p ^ q, 0);
  frames.push({
    caption: `Why it works: XOR is commutative and associative, so any order gives the same result. Regroup the terms and each pair is x ^ x = 0, and 0 ^ ${single} = ${single}. No sorting is ever done — the algebra does the grouping.`,
    items: [...arr(0, order, (i) => (nums[i] === single ? "strong" : "muted")), ...pairs, ...bitRow("x", single, R2, { name: "running", value: `= ${single}`, width, tone: (_, bit) => (bit ? "strong" : "plain") })],
  });
  return finish({ title: "XOR finds the single number: pairs cancel", input: `nums = ${show(nums)}`, frames });
}

/* ── Subsets as bitmasks ─────────────────────────────────────────── */

/** Every mask from 0 to 2ⁿ − 1 and the subset it stands for: one mask per subset, no subset missed. */
function subsetMasks(): Walkthrough {
  const nums = [1, 2, 3];
  const n = nums.length;
  const RH = 30;
  const C = { size: 26, gap: 10 };
  const items: Item[] = [];
  const cx = (pos: number) => (n - 1 - pos) * (C.size + C.gap);
  for (let pos = n - 1; pos >= 0; pos--) items.push({ k: "text", id: `h${pos}`, x: cx(pos) + C.size / 2, y: -16, text: `bit ${pos}`, tone: "faint", anchor: "middle", size: 10.5 });
  for (let pos = n - 1; pos >= 0; pos--) items.push({ k: "text", id: `e${pos}`, x: cx(pos) + C.size / 2, y: -34, text: String(nums[pos]), tone: "accent", anchor: "middle", size: 12, weight: 600 });
  items.push({ k: "text", id: "eh", x: -12, y: -34, text: "element", tone: "accent", anchor: "end", size: 10.5, weight: 600 });
  items.push({ k: "text", id: "mh", x: -12, y: -16, text: "mask", tone: "faint", anchor: "end", size: 10.5 });
  const SX = n * (C.size + C.gap) + 34;
  items.push({ k: "text", id: "sh", x: SX, y: -16, text: "subset", tone: "faint", anchor: "start", size: 10.5 });
  for (let mask = 0; mask < 1 << n; mask++) {
    const y = mask * RH;
    const subset = nums.filter((_, i) => (mask >> i) & 1);
    const C2 = { size: 24, gap: 4 };
    items.push({ k: "text", id: `m${mask}`, x: -12, y: y + C.size / 2, text: String(mask), tone: "soft", anchor: "end", size: 12 });
    for (let pos = n - 1; pos >= 0; pos--) items.push(box(`c${mask}-${pos}`, cx(pos), y, (mask >> pos) & 1, { tone: (mask >> pos) & 1 ? "accent" : "plain", w: C.size, h: C.size, size: 12 }));
    items.push({ k: "text", id: `a${mask}`, x: SX - 18, y: y + C.size / 2, text: "→", tone: "faint", anchor: "middle", size: 12 });
    subset.forEach((v, k) => items.push(box(`s${mask}-${k}`, SX + k * (C2.size + C2.gap), y + 1, v, { tone: "strong", w: C2.size, h: C2.size, size: 12 })));
    if (!subset.length) items.push({ k: "text", id: `s${mask}-e`, x: SX, y: y + C.size / 2, text: "{ }", tone: "faint", anchor: "start", size: 12 });
  }
  return finish({
    title: "Each mask from 0 to 2ⁿ − 1 is one subset",
    input: `nums = ${show(nums)}`,
    frames: [
      {
        caption: `Bit i of the mask says whether nums[i] is in — the element over each column. Counting from 0 to ${(1 << n) - 1} runs through every pattern of ${n} bits exactly once, so it lists all ${1 << n} subsets, each once — no recursion, no visited set. Testing bit i is (mask >> i) & 1.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "place-values": placeValues,
  "twos-complement": twosComplement,
  operators,
  "lowest-bit": lowestBit,
  "xor-cancel": xorCancel,
  "subset-masks": subsetMasks,
};
