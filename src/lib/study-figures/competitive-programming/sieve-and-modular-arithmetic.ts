import { finish, slotX, type Frame, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * Number theory for contests (scripts/study-plans/competitive-programming/
 * 06-number-theory/01-sieve-and-modular-arithmetic.md):
 *
 *  - sieve: the Sieve of Eratosthenes on 1..30, run for real — each prime p
 *    crosses out p², p² + p, … and the sweep stops once p² passes 30. The
 *    primes left standing are checked against trial division.
 *  - modpow: 3^13 mod 1000 by repeated squaring — the exponent's bits read
 *    from the lowest, the base squared every step and multiplied into the
 *    result on a 1 bit. The result is checked against BigInt's own power.
 */

const N = 30;
const COLS = 10;
const S = 40;
const G = 6;
const cellAt = (v: number) => ({ x: slotX((v - 1) % COLS, 0, S, G), y: Math.floor((v - 1) / COLS) * (S + G) });
const isPrime = (x: number) => {
  if (x < 2) return false;
  for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
  return true;
};

function sieve(): Walkthrough {
  const crossed = new Set<number>([1]);
  const primes = new Set<number>();
  const frames: Frame[] = [];
  const draw = (o: { p?: number; fresh?: Set<number>; done?: boolean }): Item[] => {
    const items: Item[] = [];
    for (let v = 1; v <= N; v++) {
      const { x, y } = cellAt(v);
      const tone: Tone =
        v === o.p ? "strong" : o.fresh?.has(v) ? "error" : crossed.has(v) ? "muted" : primes.has(v) || o.done ? "strong" : "plain";
      items.push(box(`n${v}`, x, y, v, { tone }));
    }
    const rows = Math.ceil(N / COLS);
    items.push(label("st", o.done ? `primes ≤ ${N}: ${[...primes].length}` : o.p ? `p = ${o.p}: cross out ${o.p}², ${o.p}² + ${o.p}, …` : "is_composite[] all false", 0, rows * (S + G) + 14, { anchor: "start", size: 12, weight: 600, tone: o.done ? "accent" : "soft" }));
    return items;
  };

  frames.push({ caption: `Write 1 to ${N}. 1 is not prime; every other number starts unmarked. The first unmarked number is the next prime.`, items: draw({}) });
  for (let p = 2; p * p <= N; p++) {
    if (crossed.has(p)) continue;
    const fresh = new Set<number>();
    let again = 0;
    for (let m = p * p; m <= N; m += p) {
      if (crossed.has(m)) again++;
      else fresh.add(m);
    }
    primes.add(p);
    frames.push({
      caption: `${p} is unmarked, so it is prime. Cross out its multiples from ${p * p} = ${p}×${p}: ${[...fresh].join(", ")}${again ? ` (${again} already crossed by a smaller prime)` : ""}. Smaller multiples of ${p} have a smaller prime factor and are gone already.`,
      items: draw({ p, fresh }),
    });
    for (const m of fresh) crossed.add(m);
  }
  const next = [...Array(N).keys()].map((i) => i + 1).find((v) => v > Math.max(...primes) && !crossed.has(v))!;
  for (let v = 2; v <= N; v++) if (!crossed.has(v)) primes.add(v);
  const truth = [...Array(N).keys()].map((i) => i + 1).filter(isPrime);
  if (truth.join() !== [...primes].sort((a, b) => a - b).join()) throw new Error("sieve: disagrees with trial division");
  frames.push({
    caption: `The next prime, ${next}, has ${next}² = ${next * next} > ${N}: every composite up to ${N} has a prime factor ≤ √${N} and is crossed. The ${truth.length} numbers left are the primes. In all, O(n log log n).`,
    items: draw({ done: true }),
  });
  return finish({ title: "The Sieve of Eratosthenes on 1..30", input: `n = ${N}`, frames });
}

function modpow(): Walkthrough {
  const B = 3;
  const E = 13;
  const M = 1000;
  type Step = { e: number; bit: number; base: number; result: number; nextBase: number };
  const steps: Step[] = [];
  let base = B % M;
  let result = 1 % M;
  let e = E;
  while (e > 0) {
    const bit = e & 1;
    if (bit) result = (result * base) % M;
    const nextBase = (base * base) % M;
    steps.push({ e, bit, base, result, nextBase });
    base = nextBase;
    e >>= 1;
  }
  if (BigInt(result) !== BigInt(B) ** BigInt(E) % BigInt(M)) throw new Error("modpow: wrong");

  const W = [96, 46, 110, 150];
  const xs = W.map((_, i) => W.slice(0, i).reduce((s, w) => s + w + 4, 0));
  const H = 30;
  const head = ["e (binary)", "bit", "result", "base"];
  const draw = (upto: number, done = false): Item[] => {
    const items: Item[] = [];
    head.forEach((h, c) => items.push(label(`h${c}`, h, xs[c]! + W[c]! / 2, 10, { size: 11, weight: 600, tone: "soft" })));
    items.push(box("r0c0", xs[0]!, 24, "start", { w: W[0], h: H, size: 12, tone: "muted" }));
    items.push(box("r0c1", xs[1]!, 24, "–", { w: W[1], h: H, size: 12, tone: "muted" }));
    items.push(box("r0c2", xs[2]!, 24, "1", { w: W[2], h: H, size: 12, tone: "plain" }));
    items.push(box("r0c3", xs[3]!, 24, String(B), { w: W[3], h: H, size: 12, tone: "plain" }));
    steps.slice(0, upto).forEach((s, i) => {
      const y = 24 + (i + 1) * (H + 4);
      const cur = i === upto - 1 && !done;
      items.push(box(`r${i + 1}c0`, xs[0]!, y, s.e.toString(2), { w: W[0], h: H, size: 12, tone: cur ? "accent" : "plain" }));
      items.push(box(`r${i + 1}c1`, xs[1]!, y, s.bit, { w: W[1], h: H, size: 12, tone: s.bit ? "accent" : "muted" }));
      items.push(box(`r${i + 1}c2`, xs[2]!, y, s.bit ? `${steps[i - 1]?.result ?? 1}·${s.base} → ${s.result}` : String(s.result), { w: W[2], h: H, size: 11, tone: done && i === steps.length - 1 ? "strong" : s.bit && cur ? "strong" : "plain" }));
      items.push(box(`r${i + 1}c3`, xs[3]!, y, `${s.base}² mod ${M} = ${s.nextBase}`, { w: W[3], h: H, size: 11, tone: cur ? "accent" : "plain" }));
    });
    // Reserve every row so the viewBox holds still.
    const bottom = 24 + (steps.length + 1) * (H + 4) + 4;
    items.push({ k: "path", id: "floor", pts: [[0, bottom], [0.1, bottom]], tone: "faint", width: 0.1 });
    return items;
  };

  const frames: Frame[] = [
    {
      caption: `${B}^${E} mod ${M} without ${E} multiplications. ${E} in binary is ${E.toString(2)}, so ${B}^${E} = ${E.toString(2).split("").reverse().map((b, i) => (b === "1" ? `${B}^${1 << i}` : null)).filter(Boolean).join(" · ")}. Start with result 1 and base ${B}.`,
      items: draw(0),
    },
  ];
  steps.forEach((s, i) => {
    frames.push({
      caption: s.bit
        ? `Lowest bit of ${s.e.toString(2)} is 1: multiply the result by the base, ${steps[i - 1]?.result ?? 1} · ${s.base} mod ${M} = ${s.result}. Then square the base (${s.nextBase}) and shift the exponent right.`
        : `Lowest bit of ${s.e.toString(2)} is 0: the result stays ${s.result}. Square the base to ${s.nextBase} and shift the exponent right.`,
      items: draw(i + 1),
    });
  });
  frames.push({
    caption: `The exponent is 0: ${B}^${E} mod ${M} = ${result}, in ${steps.length} squarings, one per bit — O(log e). Reduce after every product, so each one is below ${M}² and never overflows.`,
    items: draw(steps.length, true),
  });
  return finish({ title: "Modular exponentiation by squaring", input: `${B}^${E} mod ${M}`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  sieve,
  modpow,
};
