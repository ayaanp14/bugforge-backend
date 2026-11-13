import type { ExerciseCase } from "../../dsl.js";

/**
 * Module 03's cases, built from fixed arithmetic patterns when the module
 * loads (never at judge time). Answers are computed the plain way where
 * that is cheap — counting occurrences, summing every subset, comparing
 * every pair on the small cases — and BigInt carries anything past 2^53.
 */

/** "The odd one out": the values in order; the answer is the one value that occurs an odd number of times. */
export function oddOneCase(values: readonly bigint[], hidden = true): ExerciseCase {
  const count = new Map<bigint, number>();
  for (const v of values) count.set(v, (count.get(v) ?? 0) + 1);
  const odd = [...count].filter(([, c]) => c % 2 === 1);
  if (odd.length !== 1 || values.length % 2 !== 1) throw new Error("oddOneCase: exactly one value must appear an odd number of times");
  return { stdin: `${values.length}\n${values.join(" ")}\n`, expected: `${odd[0]![0]}\n`, hidden };
}

/** 1500 distinct 18-digit-ish values, the single one, then the same values in reverse order. */
export function bigPairs(pairs: number, single: bigint): bigint[] {
  const vals = Array.from({ length: pairs }, (_, i) => ((BigInt(i) * 999_999_999_989n + 7n) % 1_000_000_000_000_000_000n) + 1n);
  if (vals.includes(single) || new Set(vals).size !== pairs) throw new Error("bigPairs: values must be distinct from each other and the single");
  return [...vals, single, ...[...vals].reverse()];
}

/** "Subsets that hit the target": every subset's sum, built one element at a time (2^n sums). */
export function subsetCase(nums: readonly number[], target: number, hidden = true): ExerciseCase {
  let sums = [0];
  for (const v of nums) sums = sums.concat(sums.map((s) => s + v));
  if (nums.reduce((t, v) => t + v, 0) > Number.MAX_SAFE_INTEGER) throw new Error("subsetCase: sums past 2^53");
  const hits = sums.filter((s) => s === target).length;
  return { stdin: `${nums.length} ${target}\n${nums.join(" ")}\n`, expected: `${hits}\n`, hidden };
}

const popcount = (x: number) => {
  let c = 0;
  for (let v = x; v; v &= v - 1) c++;
  return c;
};

/** "Total Hamming distance": per bit, ones × zeros pairs differ there; checked against every pair when n is small. */
export function hammingCase(a: readonly number[], hidden = true): ExerciseCase {
  let total = 0n;
  for (let b = 0; b < 30; b++) {
    const ones = a.filter((x) => (x >> b) & 1).length;
    total += BigInt(ones) * BigInt(a.length - ones);
  }
  if (a.length <= 600) {
    let brute = 0;
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) brute += popcount(a[i]! ^ a[j]!);
    if (BigInt(brute) !== total) throw new Error("hammingCase: per-bit count disagrees with brute force");
  }
  return { stdin: `${a.length}\n${a.join(" ")}\n`, expected: `${total}\n`, hidden };
}

/** A deterministic spread of values: (i · mul + add) mod m. */
export const pattern = (n: number, mul: number, add: number, m: number) => Array.from({ length: n }, (_, i) => (i * mul + add) % m);
