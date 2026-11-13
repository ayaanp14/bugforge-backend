import type { ExerciseCase } from "../../dsl.js";

/**
 * The large hidden cases of module 01, built from fixed arithmetic patterns
 * when the module loads (never at judge time), with the expected answers
 * computed here in JavaScript — BigInt wherever a value passes 2^53 — and
 * then proved again by the reference solutions under `--validate --run`.
 */

/** "Sum and maximum": n, then the values; the answer is "<sum> <max>". */
export function sumMaxCase(values: readonly number[], hidden = true): ExerciseCase {
  const sum = values.reduce((s, v) => s + BigInt(v), 0n);
  const max = values.reduce((m, v) => (v > m ? v : m), -Infinity);
  return { stdin: `${values.length}\n${values.join(" ")}\n`, expected: `${sum} ${max}\n`, hidden };
}

/** Pairs 1 ≤ i < j ≤ n with (i + j) divisible by k, by residue classes. */
export function pairsDivisible(n: bigint, k: bigint): bigint {
  const cnt = (r: bigint) => n / k + (r >= 1n && r <= n % k ? 1n : 0n);
  const c2 = (x: bigint) => (x * (x - 1n)) / 2n;
  let total = c2(cnt(0n));
  for (let r = 1n; r < k - r; r++) total += cnt(r) * cnt(k - r);
  if (k % 2n === 0n) total += c2(cnt(k / 2n));
  return total;
}

/** The same count by trying every pair — only for the small cases, to check the formula above. */
export function pairsDivisibleBrute(n: number, k: number): number {
  let c = 0;
  for (let i = 1; i <= n; i++) for (let j = i + 1; j <= n; j++) if ((i + j) % k === 0) c++;
  return c;
}

export function pairsCase(n: number, k: number, hidden = true): ExerciseCase {
  const want = pairsDivisible(BigInt(n), BigInt(k));
  if (n <= 2000 && BigInt(pairsDivisibleBrute(n, k)) !== want) throw new Error(`pairsDivisible(${n}, ${k}) disagrees with brute force`);
  return { stdin: `${n} ${k}\n`, expected: `${want}\n`, hidden };
}

/** "At most x": the array, then q queries; each answer is how many values are ≤ x. */
export function atMostCase(a: readonly number[], qs: readonly number[], hidden = true): ExerciseCase {
  const sorted = [...a].sort((x, y) => x - y);
  const upper = (x: number) => {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid]! <= x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return { stdin: `${a.length} ${qs.length}\n${a.join(" ")}\n${qs.join("\n")}\n`, expected: qs.map(upper).join("\n") + "\n", hidden };
}

/** A deterministic spread of values: (i · mul + add) mod m, shifted by `shift`. */
export const pattern = (n: number, mul: number, add: number, m: number, shift = 0) => Array.from({ length: n }, (_, i) => ((i * mul + add) % m) + shift);
