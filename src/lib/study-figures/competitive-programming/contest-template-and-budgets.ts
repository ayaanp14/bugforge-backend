import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * Fast I/O and complexity budgets: the lesson's figure
 * (scripts/study-plans/competitive-programming/01-fast-io-and-complexity).
 *
 *  - budget: six complexity classes as bars on a log scale against the
 *    ~10^8 simple operations a judge runs in one second. Each frame is one
 *    n from the lesson's table; every bar's height is log10 of the class's
 *    operation count at that n (computed, never typed), the classes over
 *    the line turn red and the slowest one still under it is the answer.
 */

/** Simple operations a judge runs in about a second — the lesson's rule of thumb. */
export const BUDGET_LOG = 8;

/** log10 of each class's operation count at n. Factorial by summing logs, so 10^6! never overflows. */
export const CLASSES: ReadonlyArray<{ name: string; lg: (n: number) => number }> = [
  { name: "n!", lg: (n) => (n > 40 ? Infinity : Array.from({ length: n }, (_, k) => Math.log10(k + 1)).reduce((a, b) => a + b, 0)) },
  { name: "2ⁿ", lg: (n) => n * Math.log10(2) },
  { name: "n³", lg: (n) => 3 * Math.log10(n) },
  { name: "n²", lg: (n) => 2 * Math.log10(n) },
  { name: "n log n", lg: (n) => Math.log10(n * Math.log2(n)) },
  { name: "n", lg: (n) => Math.log10(n) },
];

/** The n values the lesson's table is built on, one per frame. */
export const SAMPLE_N = [11, 25, 400, 10_000, 1_000_000] as const;

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (k: number) => String(k).split("").map((d) => SUP[Number(d)]).join("");
/** 6.4e7 → "6.4×10⁷"; past 10^12 the bar is clipped and says so. */
export function sci(lg: number): string {
  if (lg > 12) return `> 10${sup(12)}`;
  // Exactly 10^k has lg k up to floating error; round so 10^8 reads 1.0×10⁸, not 10.0×10⁷.
  const e = Math.floor(lg + 1e-9);
  const m = Math.pow(10, lg - e);
  return e < 3 ? String(Math.round(Math.pow(10, lg))) : `${m.toFixed(1)}×10${sup(e)}`;
}
const nText = (n: number) => (n >= 10_000 ? `10${sup(Math.round(Math.log10(n)))}` : String(n));

/** Index of the slowest class that still fits; the classes are ordered slowest first. */
export const slowestFitting = (n: number) => CLASSES.findIndex((c) => c.lg(n) <= BUDGET_LOG + 1e-9);

function budget(): Walkthrough {
  const U = 22; // px per power of ten
  const TOP = 12; // the scale's ceiling, 10^12
  const BW = 58;
  const GAP = 16;
  const bx = (i: number) => i * (BW + GAP);
  const right = bx(CLASSES.length - 1) + BW;
  const frames: Frame[] = [];

  const draw = (n: number): Item[] => {
    const best = slowestFitting(n);
    const items: Item[] = [];
    // The scale: a faint tick every two powers of ten.
    for (let p = 0; p <= TOP; p += 2) {
      items.push({ k: "path", id: `g${p}`, pts: [[-6, -p * U], [right + 6, -p * U]], tone: "faint", width: 0.8 });
      items.push(label(`gl${p}`, p === 0 ? "1" : `10${sup(p)}`, -12, -p * U, { anchor: "end", size: 10.5, tone: "faint", mono: true }));
    }
    CLASSES.forEach((c, i) => {
      const lg = c.lg(n);
      const h = Math.max(3, Math.min(lg, TOP) * U);
      const fits = lg <= BUDGET_LOG + 1e-9;
      const tone: Tone = i === best ? "strong" : fits ? "accent" : "error";
      // The count is written inside a tall bar (above it, it would sit on the 10⁸ line) and over a short one.
      const inside = h >= 40;
      items.push(box(`b${i}`, bx(i), -h, inside ? sci(lg) : "", { w: BW, h, tone, size: 10 }));
      items.push(label(`v${i}`, inside ? "" : sci(lg), bx(i) + BW / 2, -h - 10, { size: 10.5, mono: true, tone: "ink" }));
      items.push(label(`c${i}`, `O(${c.name})`, bx(i) + BW / 2, 14, { size: 11.5, mono: true, tone: i === best ? "accent" : "soft", weight: i === best ? 700 : 500 }));
    });
    items.push({ k: "path", id: "line", pts: [[-6, -BUDGET_LOG * U], [right + 6, -BUDGET_LOG * U]], tone: "ink", width: 2, dashed: true });
    items.push(label("ll", "≈ 1 second", right + 10, -BUDGET_LOG * U, { anchor: "start", size: 11, tone: "ink", weight: 600 }));
    items.push(label("n", `n = ${nText(n)}`, 0, -TOP * U - 26, { anchor: "start", size: 15, tone: "ink", weight: 700, mono: true }));
    return items;
  };

  for (const n of SAMPLE_N) {
    const best = slowestFitting(n);
    const c = CLASSES[best]!;
    const over = CLASSES[best - 1];
    const caption = over
      ? `n = ${nText(n)}: O(${c.name}) is ${sci(c.lg(n))} operations, under the 10⁸ line, while O(${over.name}) would be ${sci(over.lg(n))}. The slowest class that fits is O(${c.name}), so that is the budget.`
      : `n = ${nText(n)}: even O(${c.name}) is only ${sci(c.lg(n))} operations, so anything up to O(${c.name}) fits.`;
    frames.push({ caption, items: draw(n) });
  }
  frames.push({
    caption: `Read it the other way in a contest: the constraint on n names the slowest algorithm allowed. n ≤ ${nText(SAMPLE_N[SAMPLE_N.length - 1])} means O(n log n) or better; an O(n²) idea is over by a factor of ten thousand.`,
    items: draw(SAMPLE_N[SAMPLE_N.length - 1]),
  });
  return finish({ title: "Which complexity fits a 1-second limit?", input: "about 10⁸ simple operations per second", frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  budget,
};
