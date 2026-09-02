/**
 * Seeds every problem with a large hidden test-case suite (Submit-only —
 * /api/run executes visible cases exclusively).
 *
 *   npx tsx scripts/seed-hidden-cases.ts --seed [--count 5000]
 *
 * Deterministic (seeded RNG), so re-running — locally or against the
 * production DB — produces identical suites. Existing hidden cases are
 * replaced; visible cases are untouched. Expected outputs are computed by
 * reference implementations here and cross-checked by
 * `upgrade-problems.ts --validate`, which runs every language's solution
 * against ALL cases in the DB.
 *
 * Sizing rule: keep each problem's totals under ~450KB raw input and ~250KB
 * raw output, so every suite fits ONE engine run per submit even on Wandbox
 * (probed: ~800KB request-body cap, ~145KB stdout cap with ~3:1 worst-case
 * compression for gzip-language drivers).
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const args = process.argv.slice(2);
const COUNT = (() => {
  const i = args.indexOf("--count");
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 5000;
})();

// ── Deterministic RNG (mulberry32) ─────────────────────────────────
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const shuffle = <T,>(rng: Rng, arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

interface Case { input: string; expectedOutput: string; }
type Generator = (rng: Rng) => Case;

// ── Per-problem generators ─────────────────────────────────────────

const genTwoSum: Generator = (rng) => {
  for (;;) {
    const len = randInt(rng, 2, 30);
    const pool = new Set<number>();
    while (pool.size < len) pool.add(randInt(rng, -1000, 1000));
    const nums = shuffle(rng, [...pool]);
    const i = randInt(rng, 0, len - 2);
    const j = randInt(rng, i + 1, len - 1);
    const target = nums[i] + nums[j];
    let pairs = 0;
    for (let a = 0; a < len; a++) {
      for (let b = a + 1; b < len; b++) {
        if (nums[a] + nums[b] === target) pairs++;
      }
    }
    if (pairs !== 1) continue; // constraint: exactly one valid answer
    const [lo, hi] = i < j ? [i, j] : [j, i];
    return { input: `[${nums.join(",")}]\n${target}`, expectedOutput: `[${lo},${hi}]` };
  }
};

const genBinarySearch: Generator = (rng) => {
  const len = randInt(rng, 1, 30);
  const pool = new Set<number>();
  while (pool.size < len) pool.add(randInt(rng, -9999, 9999));
  const nums = [...pool].sort((a, b) => a - b);
  let target: number;
  let expected: number;
  if (rng() < 0.5) {
    const idx = randInt(rng, 0, len - 1);
    target = nums[idx];
    expected = idx;
  } else {
    do { target = randInt(rng, -9999, 9999); } while (pool.has(target));
    expected = -1;
  }
  return { input: `[${nums.join(",")}]\n${target}`, expectedOutput: String(expected) };
};

const genClimbingStairs: Generator = (rng) => {
  const n = randInt(rng, 1, 45);
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; }
  return { input: String(n), expectedOutput: String(b) };
};

const genContainsDuplicate: Generator = (rng) => {
  const len = randInt(rng, 1, 30);
  const pool = new Set<number>();
  while (pool.size < len) pool.add(randInt(rng, -9999, 9999));
  const nums = shuffle(rng, [...pool]);
  const forceDupe = len > 1 && rng() < 0.5;
  if (forceDupe) nums[randInt(rng, 1, len - 1)] = nums[0];
  const hasDupe = new Set(nums).size !== nums.length;
  return { input: `[${nums.join(",")}]`, expectedOutput: hasDupe ? "true" : "false" };
};

const genFizzBuzz: Generator = (rng) => {
  const n = randInt(rng, 1, 15);
  const out: string[] = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) out.push("FizzBuzz");
    else if (i % 3 === 0) out.push("Fizz");
    else if (i % 5 === 0) out.push("Buzz");
    else out.push(String(i));
  }
  return { input: String(n), expectedOutput: `[${out.map((s) => `"${s}"`).join(",")}]` };
};

const genMaxSubArray: Generator = (rng) => {
  const len = randInt(rng, 1, 35);
  const nums = Array.from({ length: len }, () => randInt(rng, -1000, 1000));
  let best = nums[0], current = nums[0];
  for (let i = 1; i < len; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return { input: `[${nums.join(",")}]`, expectedOutput: String(best) };
};

const genPalindromeNumber: Generator = (rng) => {
  let x: number;
  const kind = rng();
  if (kind < 0.4) {
    // build a guaranteed palindrome
    const half = String(randInt(rng, 1, 99999));
    const mid = rng() < 0.5 ? String(randInt(rng, 0, 9)) : "";
    x = parseInt(half + mid + [...half].reverse().join(""), 10);
    if (x > 2147483647) x = 121;
  } else if (kind < 0.8) {
    x = randInt(rng, 0, 2147483647);
  } else {
    x = -randInt(rng, 1, 2147483647);
  }
  let isPal = false;
  if (x >= 0) {
    const s = String(x);
    isPal = s === [...s].reverse().join("");
  }
  return { input: String(x), expectedOutput: isPal ? "true" : "false" };
};

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const genReverseString: Generator = (rng) => {
  const len = randInt(rng, 0, 20);
  const chars = Array.from({ length: len }, () => CHARS[randInt(rng, 0, CHARS.length - 1)]);
  const fmt = (a: string[]) => `[${a.map((c) => `"${c}"`).join(",")}]`;
  return { input: fmt(chars), expectedOutput: fmt([...chars].reverse()) };
};

const genValidAnagram: Generator = (rng) => {
  const len = randInt(rng, 1, 60);
  const s = Array.from({ length: len }, () => CHARS[randInt(rng, 0, 25)]);
  let t: string[];
  if (rng() < 0.5) {
    t = shuffle(rng, [...s]);
  } else {
    t = [...s];
    if (rng() < 0.5 || len < 2) t.push(CHARS[randInt(rng, 0, 25)]);
    else t[randInt(rng, 0, len - 1)] = CHARS[randInt(rng, 0, 25)];
    t = shuffle(rng, t);
  }
  const isAnagram = [...s].sort().join("") === [...t].sort().join("");
  return {
    input: `"${s.join("")}"\n"${t.join("")}"`,
    expectedOutput: isAnagram ? "true" : "false",
  };
};

const genValidParentheses: Generator = (rng) => {
  const OPEN = ["(", "[", "{"];
  const CLOSE: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  // build a valid string
  const pieces: string[] = [];
  const stack: string[] = [];
  const targetLen = randInt(rng, 1, 40) * 2;
  while (pieces.length < targetLen) {
    if (stack.length > 0 && (rng() < 0.5 || pieces.length + stack.length >= targetLen)) {
      pieces.push(CLOSE[stack.pop()!]);
    } else {
      const o = OPEN[randInt(rng, 0, 2)];
      stack.push(o);
      pieces.push(o);
    }
  }
  while (stack.length > 0) pieces.push(CLOSE[stack.pop()!]);
  let str = pieces.join("");
  if (rng() < 0.5) {
    // corrupt it: swap one char for a random bracket or drop one
    const all = "()[]{}";
    const chars = [...str];
    if (rng() < 0.5) chars[randInt(rng, 0, chars.length - 1)] = all[randInt(rng, 0, 5)];
    else chars.splice(randInt(rng, 0, chars.length - 1), 1);
    str = chars.join("");
  }
  // judge validity with a stack
  const st: string[] = [];
  let valid = true;
  for (const ch of str) {
    if (ch === "(" || ch === "[" || ch === "{") st.push(ch);
    else if (st.length === 0 || CLOSE[st.pop()!] !== ch) { valid = false; break; }
  }
  if (valid && st.length > 0) valid = false;
  return { input: `"${str}"`, expectedOutput: valid ? "true" : "false" };
};

const GENERATORS: Record<string, Generator> = {
  "two-sum": genTwoSum,
  "binary-search": genBinarySearch,
  "climbing-stairs": genClimbingStairs,
  "contains-duplicate": genContainsDuplicate,
  "fizz-buzz": genFizzBuzz,
  "maximum-subarray": genMaxSubArray,
  "palindrome-number": genPalindromeNumber,
  "reverse-string": genReverseString,
  "valid-anagram": genValidAnagram,
  "valid-parentheses": genValidParentheses,
};

// ── Seeding ────────────────────────────────────────────────────────
(async () => {
  if (!args.includes("--seed")) {
    console.log("usage: tsx scripts/seed-hidden-cases.ts --seed [--count 5000]");
    await prisma.$disconnect();
    return;
  }

  for (const [slug, generate] of Object.entries(GENERATORS)) {
    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: { testCases: { orderBy: { orderIndex: "asc" } } },
    });
    if (!problem) {
      console.log(`MISSING: ${slug}`);
      continue;
    }
    const visible = problem.testCases.filter((tc) => !tc.isHidden);
    const startIndex = visible.length > 0 ? Math.max(...visible.map((tc) => tc.orderIndex)) + 1 : 0;

    // One fixed RNG seed per slug → identical suites on every run/DB
    const rng = makeRng([...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
    const cases: Case[] = [];
    const seen = new Set(visible.map((tc) => tc.input));
    while (cases.length < COUNT) {
      const c = generate(rng);
      // avoid duplicating a visible case's input (hidden dupes are fine)
      if (seen.has(c.input) && cases.length < COUNT - 100) continue;
      cases.push(c);
    }

    await prisma.$transaction([
      prisma.testCase.deleteMany({ where: { problemId: problem.id, isHidden: true } }),
      prisma.testCase.createMany({
        data: cases.map((c, i) => ({
          problemId: problem.id,
          input: c.input,
          expectedOutput: c.expectedOutput,
          isHidden: true,
          orderIndex: startIndex + i,
        })),
      }),
    ]);
    const inputBytes = cases.reduce((s, c) => s + c.input.length, 0);
    const outputBytes = cases.reduce((s, c) => s + c.expectedOutput.length, 0);
    console.log(`${slug}: ${visible.length} visible + ${cases.length} hidden (in ~${Math.round(inputBytes / 1024)}KB, out ~${Math.round(outputBytes / 1024)}KB)`);
  }
  await prisma.$disconnect();
})();
