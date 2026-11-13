import { finish, note, show, type Frame, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * Bit manipulation: the lesson's figures
 * (scripts/study-plans/competitive-programming/03-bit-manipulation).
 *
 *  - mask-ops: one 8-bit mask through the five one-liners the lesson
 *    teaches — set, set, toggle, test, clear the lowest set bit — each
 *    frame's row the real result of the expression it names, the bits that
 *    changed marked.
 *  - subsets: counting a mask from 0 to 2ⁿ − 1 over nums = [3, 5, 6]; each
 *    mask's subset and sum are computed from its bits, and the masks whose
 *    sum hits the target are the answer.
 */

const W = 8;
const B = 32;
const G = 4;
const bx = (pos: number) => (W - 1 - pos) * (B + G);
const bitOf = (v: number, pos: number) => (v >>> pos) & 1;
const bin = (v: number) => Array.from({ length: W }, (_, k) => bitOf(v, W - 1 - k)).join("");
const popcount = (v: number) => bin(v).split("").filter((c) => c === "1").length;

function bitRow(prefix: string, v: number, y: number, o: { name: string; changed?: number; probe?: number }): Item[] {
  const items: Item[] = [];
  for (let pos = W - 1; pos >= 0; pos--) {
    const bit = bitOf(v, pos);
    const tone: Tone = o.changed !== undefined && bitOf(o.changed, pos) ? "strong" : pos === o.probe ? "strong" : bit ? "accent" : "plain";
    items.push(box(`${prefix}${pos}`, bx(pos), y, bit, { w: B, h: B, size: 14, tone }));
  }
  items.push({ k: "text", id: `${prefix}n`, x: -10, y: y + B / 2, text: o.name, tone: "ink", anchor: "end", size: 12.5, weight: 600, mono: true });
  items.push({ k: "text", id: `${prefix}v`, x: bx(0) + B + 12, y: y + B / 2, text: `= ${v}`, tone: "soft", anchor: "start", size: 12.5 });
  return items;
}

function maskOps(): Walkthrough {
  const steps: Array<{ expr: string; f: (x: number) => number; say: (before: number, after: number) => string; probe?: number }> = [
    { expr: "x |= 1 << 1", f: (x) => x | (1 << 1), say: (_, a) => `x |= 1 << 1 sets bit 1: OR with a mask holding only that bit turns it on and leaves the rest alone. x = ${a}.` },
    { expr: "x |= 1 << 3", f: (x) => x | (1 << 3), say: (b, a) => `x |= 1 << 3 sets bit 3, worth 8: ${b} + 8 = ${a}. The mask now holds the set {1, 3}.` },
    { expr: "x |= 1 << 5", f: (x) => x | (1 << 5), say: (_, a) => `x |= 1 << 5 adds element 5. x = ${a} = 0b${bin(a)}, the set {1, 3, 5} in one integer.` },
    { expr: "x ^= 1 << 1", f: (x) => x ^ (1 << 1), say: (b, a) => `x ^= 1 << 1 toggles bit 1: it was on, so it goes off. ${b} becomes ${a}. Toggling again would bring it back.` },
    { expr: "(x >> 3) & 1", f: (x) => x, probe: 3, say: (b) => `Testing reads, never writes: (x >> 3) & 1 = ${(b >> 3) & 1}, so 3 is in the set; (x >> 1) & 1 = ${(b >> 1) & 1}, so 1 no longer is.` },
    { expr: "x &= x - 1", f: (x) => x & (x - 1), say: (b, a) => `x &= x − 1 clears the lowest set bit: ${b} & ${b - 1} = ${a}. Repeat it until x is 0 and you have counted the set bits — popcount(${b}) = ${popcount(b)}.` },
  ];
  const frames: Frame[] = [];
  let x = 0;
  const pos: Item[] = Array.from({ length: W }, (_, p): Item => ({ k: "text", id: `p${p}`, x: bx(p) + B / 2, y: -14, text: String(p), tone: "faint", anchor: "middle", size: 10.5 }));
  frames.push({ caption: "An int is a row of bits, bit 0 on the right. As a set, bit i is on when element i is in. Start with the empty set, x = 0.", items: [...pos, ...bitRow("x", x, 0, { name: "x" }), note("e", "x = 0", 0, B + 30, { size: 12.5 })] });
  for (const s of steps) {
    const before = x;
    x = s.f(x);
    frames.push({
      caption: s.say(before, x),
      items: [...pos, ...bitRow("x", x, 0, { name: "x", changed: before ^ x, probe: s.probe }), note("e", s.expr, 0, B + 30, { size: 13, weight: 600 }), label("b", `0b${bin(x)}`, bx(0) + B + 60, B + 30, { anchor: "start", mono: true, size: 12, tone: "faint" })],
    });
  }
  return finish({ title: "A set of small numbers in one integer: set, toggle, test, clear", input: "x starts at 0", frames });
}

function subsets(): Walkthrough {
  const nums = [3, 5, 6];
  const target = 11;
  const n = nums.length;
  const RH = 30;
  const C = 26;
  const cx = (p: number) => (n - 1 - p) * (C + 8);
  const SX = n * (C + 8) + 34;
  const head: Item[] = [];
  for (let p = n - 1; p >= 0; p--) {
    head.push({ k: "text", id: `h${p}`, x: cx(p) + C / 2, y: -16, text: `bit ${p}`, tone: "faint", anchor: "middle", size: 10.5 });
    head.push({ k: "text", id: `e${p}`, x: cx(p) + C / 2, y: -34, text: String(nums[p]), tone: "accent", anchor: "middle", size: 12, weight: 600 });
  }
  head.push({ k: "text", id: "eh", x: -12, y: -34, text: "nums", tone: "accent", anchor: "end", size: 10.5, weight: 600 });
  head.push({ k: "text", id: "sh", x: SX, y: -16, text: "subset → sum", tone: "faint", anchor: "start", size: 10.5 });
  const sumOf = (mask: number) => nums.reduce((s, v, i) => s + ((mask >> i) & 1 ? v : 0), 0);
  const rowsUpTo = (last: number, done: boolean): Item[] => {
    const items: Item[] = [...head];
    for (let mask = 0; mask <= last; mask++) {
      const y = mask * RH;
      const s = sumOf(mask);
      const hit = s === target;
      items.push({ k: "text", id: `m${mask}`, x: -12, y: y + C / 2, text: String(mask), tone: "soft", anchor: "end", size: 12 });
      for (let p = n - 1; p >= 0; p--) items.push(box(`c${mask}-${p}`, cx(p), y, (mask >> p) & 1, { w: C, h: C, size: 12, tone: (mask >> p) & 1 ? (hit ? "strong" : "accent") : "plain" }));
      const set = nums.filter((_, i) => (mask >> i) & 1);
      items.push({ k: "text", id: `s${mask}`, x: SX, y: y + C / 2, text: `{${set.join(", ")}} → ${s}${hit ? "  ✓" : ""}`, tone: hit ? "accent" : mask === last && !done ? "ink" : "soft", anchor: "start", size: 12, weight: hit ? 700 : 500, mono: true });
    }
    return items;
  };
  const frames: Frame[] = [];
  const total = 1 << n;
  const hits = Array.from({ length: total }, (_, m) => m).filter((m) => sumOf(m) === target);
  frames.push({ caption: `Bit i of a mask says whether nums[i] is chosen. mask 0 has no bits on: the empty subset, sum 0. The target is ${target}.`, items: rowsUpTo(0, false) });
  for (let m = 1; m < total; m++) {
    const set = nums.filter((_, i) => (m >> i) & 1);
    const s = sumOf(m);
    const caption =
      s === target
        ? `mask ${m} = ${m.toString(2).padStart(n, "0")} in binary picks ${set.join(" and ")}: ${set.join(" + ")} = ${s}, the target. Count it.`
        : `mask ${m} = ${m.toString(2).padStart(n, "0")} in binary picks {${set.join(", ")}}, sum ${s}${s > target ? ", over the target" : ""}.`;
    frames.push({ caption, items: rowsUpTo(m, false) });
  }
  frames.push({
    caption: `Counting 0 to 2ⁿ − 1 = ${total - 1} visits every subset exactly once: ${hits.length} of ${total} hit ${target}. Cost O(2ⁿ · n), fine for n ≤ 20 — about 2×10⁷ steps.`,
    items: rowsUpTo(total - 1, true),
  });
  return finish({ title: "Every subset is one mask from 0 to 2ⁿ − 1", input: `nums = ${show(nums)}, target ${target}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "mask-ops": maskOps,
  subsets,
};
