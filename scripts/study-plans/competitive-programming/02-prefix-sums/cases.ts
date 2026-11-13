import type { ExerciseCase } from "../../dsl.js";

/**
 * Module 02's cases, built from fixed arithmetic patterns when the module
 * loads (never at judge time). Every expected answer is computed here the
 * slow, obvious way — summing each range, applying each update element by
 * element — so it checks the reference solutions' prefix sums instead of
 * repeating them. Totals are bounded below 2^53 (checked), so numbers are exact.
 */

/** Every total here is bounded by the sum of the absolute values; under 2^53 plain numbers are exact. */
const safe = (bound: number) => {
  if (bound > Number.MAX_SAFE_INTEGER) throw new Error("a case total could pass 2^53 — use BigInt");
};

/** A deterministic spread of values: (i · mul + add) mod m, shifted by `shift`. */
export const pattern = (n: number, mul: number, add: number, m: number, shift = 0) => Array.from({ length: n }, (_, i) => ((i * mul + add) % m) + shift);

/** Queries as 1-indexed [l, r] pairs inside 1..n, from two patterns. */
export function rangesOf(n: number, q: number, mulA: number, mulB: number): Array<[number, number]> {
  const xs = pattern(q, mulA, 3, n, 1);
  const ys = pattern(q, mulB, 11, n, 1);
  return xs.map((x, i) => [Math.min(x, ys[i]!), Math.max(x, ys[i]!)]);
}

/** "Range sum queries": the array, then each [l, r]; each answer summed directly. */
export function rangeSumCase(a: readonly number[], qs: ReadonlyArray<[number, number]>, hidden = true): ExerciseCase {
  safe(a.reduce((t, v) => t + Math.abs(v), 0));
  const answers = qs.map(([l, r]) => {
    let s = 0;
    for (let i = l; i <= r; i++) s += a[i - 1]!;
    return String(s);
  });
  return { stdin: `${a.length} ${qs.length}\n${a.join(" ")}\n${qs.map(([l, r]) => `${l} ${r}`).join("\n")}\n`, expected: answers.join("\n") + "\n", hidden };
}

/** "Range additions": n zeros, then each update "l r v" applied element by element. */
export function rangeAddCase(n: number, ups: ReadonlyArray<[number, number, number]>, hidden = true): ExerciseCase {
  safe(ups.reduce((t, [, , v]) => t + Math.abs(v), 0));
  const arr = new Array<number>(n + 1).fill(0);
  for (const [l, r, v] of ups) for (let i = l; i <= r; i++) arr[i]! += v;
  return { stdin: `${n} ${ups.length}\n${ups.map((u) => u.join(" ")).join("\n")}\n`, expected: arr.slice(1).join(" ") + "\n", hidden };
}

/** Updates as 1-indexed [l, r, v] inside 1..n, from patterns. */
export function updatesOf(n: number, m: number, vMod: number, vShift: number): Array<[number, number, number]> {
  return rangesOf(n, m, 7919, 104_729).map(([l, r], i) => [l, r, ((i * 31 + 7) % vMod) + vShift]);
}

/** "Peak occupancy": bookings "s e p" over hours 1..10^6; the busiest hour by brute force over the hours touched. */
export function peakCase(bookings: ReadonlyArray<[number, number, number]>, hidden = true): ExerciseCase {
  // Only the hours where a booking starts can be the first hour of a peak, so check those directly.
  const candidates = [...new Set(bookings.map(([s]) => s))].sort((x, y) => x - y);
  // At most a few thousand bookings of 10^9 people: totals stay far below 2^53, so plain numbers are exact.
  if (bookings.reduce((t, [, , p]) => t + p, 0) > Number.MAX_SAFE_INTEGER) throw new Error("peakCase: totals past 2^53");
  let best = -1;
  let at = 0;
  for (const h of candidates) {
    let here = 0;
    for (const [s, e, p] of bookings) if (s <= h && h <= e) here += p;
    if (here > best) {
      best = here;
      at = h;
    }
  }
  return { stdin: `${bookings.length}\n${bookings.map((b) => b.join(" ")).join("\n")}\n`, expected: `${best} ${at}\n`, hidden };
}
