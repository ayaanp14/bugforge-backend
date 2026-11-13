import { finish, show, slotMid, slotX, type Frame, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * Binary search on the answer (scripts/study-plans/competitive-programming/
 * 04-binary-search-on-the-answer/01-searching-the-answer-space.md):
 *
 *  - halving: split [7, 2, 5, 10, 8] into k = 2 parts minimising the
 *    largest part sum. Every frame runs the real greedy check on the real
 *    mid of the real search (lo = max, hi = sum, `hi = mid` on a yes,
 *    `lo = mid + 1` on a no): the array split into the parts the check made,
 *    and the row of candidate answers 10..32 with the live range lit and
 *    every checked value marked yes or no. The answer the search lands on is
 *    held against a brute force over every split, so the figure cannot
 *    claim an optimum it did not find.
 */

const A = [7, 2, 5, 10, 8];
const K = 2;

/** The greedy check: the parts a left-to-right sweep makes under a limit (every element ≤ limit here, since limit ≥ max). */
function partsUnder(a: readonly number[], limit: number): number[][] {
  const parts: number[][] = [[]];
  let sum = 0;
  for (const x of a) {
    if (sum + x > limit) {
      parts.push([]);
      sum = 0;
    }
    parts[parts.length - 1]!.push(x);
    sum += x;
  }
  return parts;
}

/** The true optimum by trying every way to cut the array into at most k parts. */
function bruteForce(a: readonly number[], k: number): number {
  let best = Infinity;
  const n = a.length;
  for (let mask = 0; mask < 1 << (n - 1); mask++) {
    let cuts = 0;
    let sum = 0;
    let worst = 0;
    a.forEach((x, i) => {
      sum += x;
      if (i === n - 1 || mask & (1 << i)) {
        worst = Math.max(worst, sum);
        sum = 0;
        if (i < n - 1) cuts++;
      }
    });
    if (cuts + 1 <= k) best = Math.min(best, worst);
  }
  return best;
}

type Check = { lo: number; hi: number; mid: number; parts: number[][]; ok: boolean };

function halving(): Walkthrough {
  const L = Math.max(...A);
  const H = A.reduce((s, x) => s + x, 0);
  const checks: Check[] = [];
  let lo = L;
  let hi = H;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const parts = partsUnder(A, mid);
    const ok = parts.length <= K;
    checks.push({ lo, hi, mid, parts, ok });
    if (ok) hi = mid;
    else lo = mid + 1;
  }
  const answer = lo;
  if (answer !== bruteForce(A, K)) throw new Error(`halving: search found ${answer}, brute force ${bruteForce(A, K)}`);

  // Geometry: the array on top, the candidate row below it.
  const AY = 34;
  const RS = 22; // candidate cell
  const RG = 2;
  const RY = 150;
  const cand = Array.from({ length: H - L + 1 }, (_, i) => L + i);
  const ax = (H - L + 1) * (RS + RG) / 2 - (A.length * 46 - 6) / 2; // centre the array over the row

  const verdicts = new Map<number, boolean>();

  const draw = (o: { lo: number; hi: number; mid?: number; parts?: number[][]; done?: boolean }): Item[] => {
    const items: Item[] = [];
    items.push(label("at", o.parts ? `the check at X = ${o.mid ?? answer}` : "the array, k = 2", ax, 10, { anchor: "start", size: 11.5, weight: 600, tone: "soft" }));
    // The array, each part a band with its sum over it.
    let i = 0;
    (o.parts ?? [A.slice()]).forEach((part, p) => {
      const from = i;
      for (const x of part) {
        const tone: Tone = !o.parts ? "plain" : o.done ? "strong" : p % 2 === 0 ? "accent" : "plain";
        items.push(box(`a${i}`, ax + slotX(i), AY, x, { tone }));
        i++;
      }
      if (o.parts) {
        const x1 = ax + slotX(from) - 3;
        const x2 = ax + slotX(i - 1) + 40 + 3;
        items.unshift({ k: "band", id: `pb${p}`, x: x1, y: AY - 4, w: x2 - x1, h: 48, tone: "ghost" });
        items.push(label(`ps${p}`, `sum ${part.reduce((s, x) => s + x, 0)}`, (x1 + x2) / 2, AY + 62, { size: 11, mono: true, tone: "ink" }));
      }
    });
    if (o.parts && o.mid !== undefined && !o.done) {
      const ok = o.parts.length <= K;
      items.push(label("v", `${o.parts.length} parts ${ok ? "≤" : ">"} k = ${K}: ${ok ? "yes" : "no"}`, ax + A.length * 46 + 10, AY + 20, { anchor: "start", size: 12, weight: 600, tone: ok ? "accent" : "error" }));
    }
    // The candidate answers.
    items.push(label("rl", `candidate answers: lo = ${o.lo}, hi = ${o.hi}`, 0, RY - 30, { anchor: "start", size: 11.5, weight: 600, tone: "soft" }));
    cand.forEach((v, j) => {
      const inRange = v >= o.lo && v <= o.hi;
      const tone: Tone = o.done && v === answer ? "strong" : v === o.mid ? "strong" : inRange ? "accent" : "muted";
      items.push(box(`c${v}`, slotX(j, 0, RS, RG), RY, v, { w: RS, h: RS, size: 9.5, tone }));
      const seen = verdicts.get(v);
      if (seen !== undefined) items.push(label(`y${v}`, seen ? "yes" : "no", slotMid(j, 0, RS, RG), RY - 9, { size: 9, mono: true, tone: seen ? "accent" : "error" }));
    });
    if (o.mid !== undefined) items.push({ k: "ptr", id: "mid", x: slotMid(o.mid - L, 0, RS, RG), y: RY + RS + 6, label: o.done ? `answer ${o.mid}` : `mid ${o.mid}`, tone: "accent", up: true });
    return items;
  };

  const frames: Frame[] = [
    {
      caption: `No split can beat the largest element, ${L}, and one part holding everything sums to ${H}. So the answer lies in [${L}, ${H}]: ${H - L + 1} candidates, and the search will check only a handful.`,
      items: draw({ lo: L, hi: H }),
    },
  ];
  for (const c of checks) {
    const items = draw({ lo: c.lo, hi: c.hi, mid: c.mid, parts: c.parts });
    verdicts.set(c.mid, c.ok);
    const sums = c.parts.map((p) => p.reduce((s, x) => s + x, 0)).join(" and ");
    frames.push({
      caption: c.ok
        ? `mid = ${c.mid}: the sweep makes ${c.parts.length} parts (sums ${sums}), within k = ${K}. ${c.mid} works, so the answer is ${c.mid} or smaller: hi = ${c.mid}.`
        : `mid = ${c.mid}: the sweep needs ${c.parts.length} parts (sums ${sums}), more than k = ${K}. ${c.mid} fails, and so does everything below it: lo = ${c.mid + 1}.`,
      items,
    });
  }
  frames.push({
    caption: `lo and hi meet at ${answer}: ${checks.length} checks instead of ${H - L + 1}. The split ${partsUnder(A, answer).map(show).join(" + ")} has largest sum ${answer}, and no split does better.`,
    items: draw({ lo: answer, hi: answer, mid: answer, parts: partsUnder(A, answer), done: true }),
  });

  return finish({ title: "Binary search on the answer: the range of candidates halves", input: `a = ${show(A)}, k = ${K}`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  halving,
};
