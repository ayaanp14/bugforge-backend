/**
 * Seeds 500 complete, end-to-end problems: 20 parameterized archetype
 * families × 25 variants each. Every problem gets a professional description
 * with computed examples + constraints, hints, a typed signature, stub-only
 * starter code in all 13 languages, a Python reference solution, 3 visible
 * test cases, and 5,000 deterministic hidden cases.
 *
 *   npx tsx scripts/seed-500.ts --seed [--count 5000] [--limit 500]
 *   npx tsx scripts/seed-500.ts --validate-sample   # 13 langs × 1 variant per
 *                                                   # family + JS on all 500
 *
 * Deterministic per slug — identical suites on any DB (local or prod).
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { runBatch } from "../src/lib/batch-judge.js";
import { ALL_LANGUAGES, applyDriver, renderStub, type Language, type Signature } from "../src/lib/driver-codegen.js";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const HIDDEN_COUNT = parseInt(opt("count") ?? "5000", 10);
const LIMIT = parseInt(opt("limit") ?? "500", 10);

// ── Deterministic RNG ──────────────────────────────────────────────
function makeRng(seedStr: string) {
  let a = [...seedStr].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const ri = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

interface Case { input: string; expectedOutput: string }

const fmtIntArr = (a: number[]) => `[${a.join(",")}]`;
const fmtStrArr = (a: string[]) => `[${a.map((s) => `"${s}"`).join(",")}]`;

// ── Per-language function scaffolds ────────────────────────────────
// REDUCE: int[] -> int; loop with an accumulator statement per language.
const REDUCE: Record<Language, (fn: string, init: string, stmt: string) => string> = {
  javascript: (fn, init, stmt) => `var ${fn} = function(nums) {\n    let acc = ${init};\n    for (const x of nums) {\n        ${stmt}\n    }\n    return acc;\n};`,
  typescript: (fn, init, stmt) => `function ${fn}(nums: number[]): number {\n    let acc = ${init};\n    for (const x of nums) {\n        ${stmt}\n    }\n    return acc;\n}`,
  python: (fn, init, stmt) => `from typing import List\n\ndef ${fn}(nums: List[int]) -> int:\n    acc = ${init}\n    for x in nums:\n        ${stmt}\n    return acc`,
  java: (fn, init, stmt) => `public static int ${fn}(int[] nums) {\n    int acc = ${init};\n    for (int x : nums) {\n        ${stmt}\n    }\n    return acc;\n}`,
  cpp: (fn, init, stmt) => `int ${fn}(vector<int>& nums) {\n    int acc = ${init};\n    for (int x : nums) {\n        ${stmt}\n    }\n    return acc;\n}`,
  c: (fn, init, stmt) => `int ${fn}(int* nums, int numsSize) {\n    int acc = ${init};\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        ${stmt}\n    }\n    return acc;\n}`,
  csharp: (fn, init, stmt) => `public static int ${cap(fn)}(int[] nums)\n{\n    int acc = ${init};\n    foreach (int x in nums)\n    {\n        ${stmt}\n    }\n    return acc;\n}`,
  go: (fn, init, stmt) => `func ${fn}(nums []int) int {\n\tacc := ${init}\n\tfor _, x := range nums {\n\t\t${stmt}\n\t}\n\treturn acc\n}`,
  kotlin: (fn, init, stmt) => `fun ${fn}(nums: IntArray): Int {\n    var acc = ${init}\n    for (x in nums) {\n        ${stmt}\n    }\n    return acc\n}`,
  swift: (fn, init, stmt) => `func ${fn}(_ nums: [Int]) -> Int {\n    var acc = ${init}\n    for x in nums {\n        ${stmt}\n    }\n    return acc\n}`,
  rust: (fn, init, stmt) => `fn ${fn}(nums: Vec<i32>) -> i32 {\n    let mut acc: i32 = ${init};\n    for x in nums {\n        ${stmt}\n    }\n    acc\n}`,
  php: (fn, init, stmt) => `function ${fn}($nums) {\n    $acc = ${init};\n    foreach ($nums as $x) {\n        ${stmt}\n    }\n    return $acc;\n}`,
  ruby: (fn, init, stmt) => `def ${fn}(nums)\n  acc = ${init}\n  nums.each do |x|\n    ${stmt}\n  end\n  acc\nend`,
};

// MAP: int[] -> int[]; per-language expression (go uses a statement computing v).
const MAPPER: Record<Language, (fn: string, expr: string) => string> = {
  javascript: (fn, e) => `var ${fn} = function(nums) {\n    return nums.map((x) => ${e});\n};`,
  typescript: (fn, e) => `function ${fn}(nums: number[]): number[] {\n    return nums.map((x) => ${e});\n}`,
  python: (fn, e) => `from typing import List\n\ndef ${fn}(nums: List[int]) -> List[int]:\n    return [${e} for x in nums]`,
  java: (fn, e) => `public static int[] ${fn}(int[] nums) {\n    int[] out = new int[nums.length];\n    for (int i = 0; i < nums.length; i++) {\n        int x = nums[i];\n        out[i] = ${e};\n    }\n    return out;\n}`,
  cpp: (fn, e) => `vector<int> ${fn}(vector<int>& nums) {\n    vector<int> out;\n    for (int x : nums) {\n        out.push_back(${e});\n    }\n    return out;\n}`,
  c: (fn, e) => `int* ${fn}(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*)malloc(numsSize > 0 ? numsSize * sizeof(int) : sizeof(int));\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        out[i] = ${e};\n    }\n    *returnSize = numsSize;\n    return out;\n}`,
  csharp: (fn, e) => `public static int[] ${cap(fn)}(int[] nums)\n{\n    return nums.Select(x => ${e}).ToArray();\n}`,
  go: (fn, e) => `func ${fn}(nums []int) []int {\n\tout := []int{}\n\tfor _, x := range nums {\n\t\tv := x\n\t\t${e}\n\t\tout = append(out, v)\n\t}\n\treturn out\n}`,
  kotlin: (fn, e) => `fun ${fn}(nums: IntArray): IntArray {\n    return nums.map { x -> ${e} }.toIntArray()\n}`,
  swift: (fn, e) => `func ${fn}(_ nums: [Int]) -> [Int] {\n    return nums.map { x in ${e} }\n}`,
  rust: (fn, e) => `fn ${fn}(nums: Vec<i32>) -> Vec<i32> {\n    nums.into_iter().map(|x| ${e}).collect()\n}`,
  php: (fn, e) => `function ${fn}($nums) {\n    return array_map(fn($x) => ${e}, $nums);\n}`,
  ruby: (fn, e) => `def ${fn}(nums)\n  nums.map { |x| ${e} }\nend`,
};

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Per-language expression tables keyed by dialect quirks.
type ExprTable = Partial<Record<Language, string>> & { default: string };
const exprFor = (t: ExprTable, lang: Language) => t[lang] ?? t.default;

// ── Archetype definitions ──────────────────────────────────────────
interface ProblemSpec {
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM";
  tags: string[];
  funcName: string;
  signature: Signature;
  description: string;
  hints: string[];
  examples: Case[];
  gen: (rng: Rng) => Case;
  solution: (lang: Language) => string;
}

const SPECS: ProblemSpec[] = [];

const genNums = (rng: Rng, lo = -999, hi = 999) => {
  const len = ri(rng, 1, 30);
  return Array.from({ length: len }, () => ri(rng, lo, hi));
};

function describeArrayProblem(intro: string, examples: Case[], noun: string, constraints: string[]): string {
  const ex = examples
    .map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: ${noun} = ${e.input.replace(/\n/g, ", ")}\nOutput: ${e.expectedOutput}\n\`\`\``)
    .join("\n\n");
  return `${intro}\n\n${ex}\n\n### Constraints\n\n${constraints.map((c) => `- \`${c}\``).join("\n")}`;
}

function addSpec(spec: ProblemSpec) {
  if (SPECS.length < LIMIT) SPECS.push(spec);
}

/** Build a reduce-family archetype (int[] -> int). */
function reduceFamily(opts: {
  slugBase: string; titleTmpl: (k: number) => string; funcName: string;
  ks: number[]; difficulty: "EASY" | "MEDIUM"; tags: string[];
  intro: (k: number) => string; hints: (k: number) => string[];
  ref: (nums: number[], k: number) => number;
  init: string; stmt: (k: number) => ExprTable;
  genLo?: number; genHi?: number;
}) {
  for (const k of opts.ks) {
    const slug = `${opts.slugBase}-${k}`.replace("--", "-minus-");
    const rngEx = makeRng(slug + "-ex");
    const examples: Case[] = Array.from({ length: 2 }, () => {
      const nums = genNums(rngEx, opts.genLo, opts.genHi).slice(0, 8);
      return { input: fmtIntArr(nums), expectedOutput: String(opts.ref(nums, k)) };
    });
    addSpec({
      slug,
      title: opts.titleTmpl(k),
      difficulty: opts.difficulty,
      tags: opts.tags,
      funcName: opts.funcName,
      signature: { funcName: opts.funcName, params: [{ name: "nums", type: "int[]" }], returns: "int" },
      description: describeArrayProblem(opts.intro(k), examples, "nums", [
        "1 <= nums.length <= 30",
        `${opts.genLo ?? -999} <= nums[i] <= ${opts.genHi ?? 999}`,
      ]),
      hints: opts.hints(k),
      examples,
      gen: (rng) => {
        const nums = genNums(rng, opts.genLo, opts.genHi);
        return { input: fmtIntArr(nums), expectedOutput: String(opts.ref(nums, k)) };
      },
      solution: (lang) => REDUCE[lang](opts.funcName, opts.init, exprFor(opts.stmt(k), lang)),
    });
  }
}

/** Build a map-family archetype (int[] -> int[]). */
function mapFamily(opts: {
  slugBase: string; titleTmpl: (k: number) => string; funcName: string;
  ks: number[]; difficulty: "EASY" | "MEDIUM"; tags: string[];
  intro: (k: number) => string; hints: (k: number) => string[];
  ref: (nums: number[], k: number) => number[];
  expr: (k: number) => ExprTable;
  genLo?: number; genHi?: number;
}) {
  for (const k of opts.ks) {
    const slug = `${opts.slugBase}-${k}`.replace("--", "-minus-");
    const rngEx = makeRng(slug + "-ex");
    const examples: Case[] = Array.from({ length: 2 }, () => {
      const nums = genNums(rngEx, opts.genLo, opts.genHi).slice(0, 8);
      return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(opts.ref(nums, k)) };
    });
    addSpec({
      slug,
      title: opts.titleTmpl(k),
      difficulty: opts.difficulty,
      tags: opts.tags,
      funcName: opts.funcName,
      signature: { funcName: opts.funcName, params: [{ name: "nums", type: "int[]" }], returns: "int[]" },
      description: describeArrayProblem(opts.intro(k), examples, "nums", [
        "1 <= nums.length <= 30",
        `${opts.genLo ?? -999} <= nums[i] <= ${opts.genHi ?? 999}`,
      ]),
      hints: opts.hints(k),
      examples,
      gen: (rng) => {
        const nums = genNums(rng, opts.genLo, opts.genHi);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(opts.ref(nums, k)) };
      },
      solution: (lang) => MAPPER[lang](opts.funcName, exprFor(opts.expr(k), lang)),
    });
  }
}

const K25 = Array.from({ length: 25 }, (_, i) => i);       // 0..24
const K25from1 = Array.from({ length: 25 }, (_, i) => i + 1); // 1..25
const K25from2 = Array.from({ length: 25 }, (_, i) => i + 2); // 2..26

// 1. count-greater-than-K
reduceFamily({
  slugBase: "count-greater-than", titleTmpl: (k) => `Count Elements Greater Than ${k}`,
  funcName: "countGreater", ks: K25, difficulty: "EASY", tags: ["Array", "Counting"],
  intro: (k) => `Given an integer array \`nums\`, return the **number of elements strictly greater than \`${k}\`**.`,
  hints: (k) => [`Walk the array once and compare each element with ${k}.`, "A single counter is all the state you need."],
  ref: (nums, k) => nums.filter((x) => x > k).length,
  init: "0",
  stmt: (k) => ({
    default: `if (x > ${k}) acc++;`,
    php: `if ($x > ${k}) $acc++;`,
    swift: `if x > ${k} { acc += 1 }`,
    kotlin: `if (x > ${k}) acc++`,
    go: `if x > ${k} {\n\t\t\tacc++\n\t\t}`,
    rust: `if x > ${k} { acc += 1; }`,
    python: `if x > ${k}: acc += 1`,
    ruby: `acc += 1 if x > ${k}`,
  }),
});

// 2. count-less-than-K
reduceFamily({
  slugBase: "count-less-than", titleTmpl: (k) => `Count Elements Less Than ${k}`,
  funcName: "countLess", ks: K25, difficulty: "EASY", tags: ["Array", "Counting"],
  intro: (k) => `Given an integer array \`nums\`, return the **number of elements strictly less than \`${k}\`**.`,
  hints: (k) => [`Compare every element against ${k} in one pass.`, "Increment a counter when the condition holds."],
  ref: (nums, k) => nums.filter((x) => x < k).length,
  init: "0",
  stmt: (k) => ({
    default: `if (x < ${k}) acc++;`,
    php: `if ($x < ${k}) $acc++;`,
    swift: `if x < ${k} { acc += 1 }`,
    kotlin: `if (x < ${k}) acc++`,
    go: `if x < ${k} {\n\t\t\tacc++\n\t\t}`,
    rust: `if x < ${k} { acc += 1; }`,
    python: `if x < ${k}: acc += 1`,
    ruby: `acc += 1 if x < ${k}`,
  }),
});

// 3. count-divisible-by-K
reduceFamily({
  slugBase: "count-divisible-by", titleTmpl: (k) => `Count Multiples of ${k}`,
  funcName: "countDivisible", ks: K25from2, difficulty: "EASY", tags: ["Array", "Math"],
  intro: (k) => `Given an integer array \`nums\`, return **how many elements are divisible by \`${k}\`** (remainder zero).`,
  hints: (k) => [`x is divisible by ${k} exactly when x % ${k} == 0.`, "One pass, one counter."],
  ref: (nums, k) => nums.filter((x) => x % k === 0).length,
  init: "0",
  stmt: (k) => ({
    default: `if (x % ${k} == 0) acc++;`,
    javascript: `if (x % ${k} === 0) acc++;`,
    typescript: `if (x % ${k} === 0) acc++;`,
    php: `if ($x % ${k} == 0) $acc++;`,
    swift: `if x % ${k} == 0 { acc += 1 }`,
    kotlin: `if (x % ${k} == 0) acc++`,
    go: `if x%${k} == 0 {\n\t\t\tacc++\n\t\t}`,
    rust: `if x % ${k} == 0 { acc += 1; }`,
    python: `if x % ${k} == 0: acc += 1`,
    ruby: `acc += 1 if x % ${k} == 0`,
  }),
  genLo: -999, genHi: 999,
});

// 4. count-in-range [K, K+10]
reduceFamily({
  slugBase: "count-between", titleTmpl: (k) => `Count Elements Between ${k} and ${k + 10}`,
  funcName: "countBetween", ks: K25, difficulty: "MEDIUM", tags: ["Array", "Counting"],
  intro: (k) => `Given an integer array \`nums\`, return the number of elements \`x\` with \`${k} <= x <= ${k + 10}\` (inclusive).`,
  hints: () => ["Check both bounds in the same condition.", "Inclusive means <= on both sides."],
  ref: (nums, k) => nums.filter((x) => x >= k && x <= k + 10).length,
  init: "0",
  stmt: (k) => ({
    default: `if (x >= ${k} && x <= ${k + 10}) acc++;`,
    php: `if ($x >= ${k} && $x <= ${k + 10}) $acc++;`,
    swift: `if x >= ${k} && x <= ${k + 10} { acc += 1 }`,
    kotlin: `if (x in ${k}..${k + 10}) acc++`,
    go: `if x >= ${k} && x <= ${k + 10} {\n\t\t\tacc++\n\t\t}`,
    rust: `if x >= ${k} && x <= ${k + 10} { acc += 1; }`,
    python: `if ${k} <= x <= ${k + 10}: acc += 1`,
    ruby: `acc += 1 if x >= ${k} && x <= ${k + 10}`,
  }),
});

// 5. sum-in-range [K, K+10]
reduceFamily({
  slugBase: "sum-between", titleTmpl: (k) => `Sum of Elements Between ${k} and ${k + 10}`,
  funcName: "sumBetween", ks: K25, difficulty: "MEDIUM", tags: ["Array", "Math"],
  intro: (k) => `Given an integer array \`nums\`, return the **sum** of all elements \`x\` with \`${k} <= x <= ${k + 10}\` (inclusive). Return 0 when no element qualifies.`,
  hints: () => ["Accumulate only the elements inside the range.", "Start the sum at 0 so an empty selection is handled for free."],
  ref: (nums, k) => nums.filter((x) => x >= k && x <= k + 10).reduce((a, b) => a + b, 0),
  init: "0",
  stmt: (k) => ({
    default: `if (x >= ${k} && x <= ${k + 10}) acc += x;`,
    php: `if ($x >= ${k} && $x <= ${k + 10}) $acc += $x;`,
    swift: `if x >= ${k} && x <= ${k + 10} { acc += x }`,
    kotlin: `if (x in ${k}..${k + 10}) acc += x`,
    go: `if x >= ${k} && x <= ${k + 10} {\n\t\t\tacc += x\n\t\t}`,
    rust: `if x >= ${k} && x <= ${k + 10} { acc += x; }`,
    python: `if ${k} <= x <= ${k + 10}: acc += x`,
    ruby: `acc += x if x >= ${k} && x <= ${k + 10}`,
  }),
});

// 6..10: map families -----------------------------------------------
mapFamily({
  slugBase: "add-to-each", titleTmpl: (k) => `Add ${k} to Every Element`,
  funcName: "addToEach", ks: K25from1, difficulty: "EASY", tags: ["Array"],
  intro: (k) => `Given an integer array \`nums\`, return a new array where **\`${k}\` is added to every element**, keeping the original order.`,
  hints: () => ["Transform each element independently.", "The output has exactly the same length as the input."],
  ref: (nums, k) => nums.map((x) => x + k),
  expr: (k) => ({ default: `x + ${k}`, php: `$x + ${k}`, go: `v = x + ${k}` }),
});

mapFamily({
  slugBase: "subtract-from-each", titleTmpl: (k) => `Subtract ${k} from Every Element`,
  funcName: "subtractFromEach", ks: K25from1, difficulty: "EASY", tags: ["Array"],
  intro: (k) => `Given an integer array \`nums\`, return a new array where **\`${k}\` is subtracted from every element**, keeping the original order.`,
  hints: () => ["Element-wise transformation — no interaction between positions.", "Same length in, same length out."],
  ref: (nums, k) => nums.map((x) => x - k),
  expr: (k) => ({ default: `x - ${k}`, php: `$x - ${k}`, go: `v = x - ${k}` }),
});

mapFamily({
  slugBase: "multiply-each-by", titleTmpl: (k) => `Multiply Every Element by ${k}`,
  funcName: "multiplyEach", ks: K25from2, difficulty: "EASY", tags: ["Array", "Math"],
  intro: (k) => `Given an integer array \`nums\`, return a new array where **every element is multiplied by \`${k}\`**, keeping the original order.`,
  hints: () => ["A pure element-wise map.", "Watch the sign: negatives stay negative when multiplied by a positive constant."],
  ref: (nums, k) => nums.map((x) => x * k),
  expr: (k) => ({ default: `x * ${k}`, php: `$x * ${k}`, go: `v = x * ${k}` }),
});

mapFamily({
  slugBase: "modulo-each-by", titleTmpl: (k) => `Remainder of Every Element Modulo ${k}`,
  funcName: "moduloEach", ks: K25from2, difficulty: "MEDIUM", tags: ["Array", "Math"],
  intro: (k) => `Given an array \`nums\` of **non-negative** integers, return a new array holding \`nums[i] % ${k}\` for every element, in order.`,
  hints: (k) => [`Every result lies in the range 0..${k - 1}.`, "Because inputs are non-negative, % behaves identically in every language."],
  ref: (nums, k) => nums.map((x) => x % k),
  expr: (k) => ({ default: `x % ${k}`, php: `$x % ${k}`, go: `v = x % ${k}` }),
  genLo: 0, genHi: 999,
});

mapFamily({
  slugBase: "cap-at", titleTmpl: (k) => `Cap Every Element at ${k}`,
  funcName: "capAt", ks: K25from1, difficulty: "EASY", tags: ["Array"],
  intro: (k) => `Given an integer array \`nums\`, return a new array where every element **greater than \`${k}\` is replaced by \`${k}\`**; smaller elements stay unchanged.`,
  hints: (k) => [`out[i] = min(nums[i], ${k}).`, "Only the upper side is clamped — negatives pass through untouched."],
  ref: (nums, k) => nums.map((x) => Math.min(x, k)),
  expr: (k) => ({
    default: `x > ${k} ? ${k} : x`,
    php: `$x > ${k} ? ${k} : $x`,
    python: `min(x, ${k})`,
    ruby: `[x, ${k}].min`,
    kotlin: `minOf(x, ${k})`,
    swift: `min(x, ${k})`,
    rust: `if x > ${k} { ${k} } else { x }`,
    go: `if v > ${k} {\n\t\t\tv = ${k}\n\t\t}`,
    cpp: `min(x, ${k})`,
    csharp: `Math.Min(x, ${k})`,
  }),
});

// 11. floor-at (clamp min)
mapFamily({
  slugBase: "floor-at", titleTmpl: (k) => `Raise Every Element to at Least ${k - 13}`,
  funcName: "floorAt", ks: K25from1, difficulty: "EASY", tags: ["Array"],
  intro: (k) => `Given an integer array \`nums\`, return a new array where every element **smaller than \`${k - 13}\` is replaced by \`${k - 13}\`**; larger elements stay unchanged.`,
  hints: (k) => [`out[i] = max(nums[i], ${k - 13}).`, "Only the lower side is clamped."],
  ref: (nums, k) => nums.map((x) => Math.max(x, k - 13)),
  expr: (k) => {
    const m = k - 13;
    return {
      default: `x < ${m} ? ${m} : x`,
      php: `$x < ${m} ? ${m} : $x`,
      python: `max(x, ${m})`,
      ruby: `[x, ${m}].max`,
      kotlin: `maxOf(x, ${m})`,
      swift: `max(x, ${m})`,
      rust: `if x < ${m} { ${m} } else { x }`,
      go: `if v < ${m} {\n\t\t\tv = ${m}\n\t\t}`,
      cpp: `max(x, ${m})`,
      csharp: `Math.Max(x, ${m})`,
    };
  },
});

// ── Custom (non-scaffold) families ─────────────────────────────────
interface CustomFamily {
  slugBase: string; ks: number[];
  build: (k: number, slug: string) => ProblemSpec;
}

function customFamily(fam: CustomFamily) {
  for (const k of fam.ks) {
    const slug = `${fam.slugBase}-${k}`;
    addSpec(fam.build(k, slug));
  }
}

// 12. first-index-of-K (int[] -> int)
customFamily({
  slugBase: "first-index-of", ks: K25,
  build: (k, slug) => {
    const fn = "firstIndexOf";
    const gen = (rng: Rng): Case => {
      const nums = genNums(rng, -30, 30);
      if (rng() < 0.6) nums[ri(rng, 0, nums.length - 1)] = k; // ensure presence often
      return { input: fmtIntArr(nums), expectedOutput: String(nums.indexOf(k)) };
    };
    const rngEx = makeRng(slug + "-ex");
    const examples = [gen(rngEx), gen(rngEx)];
    const sols: Record<Language, string> = {
      javascript: `var ${fn} = function(nums) {\n    return nums.indexOf(${k});\n};`,
      typescript: `function ${fn}(nums: number[]): number {\n    return nums.indexOf(${k});\n}`,
      python: `from typing import List\n\ndef ${fn}(nums: List[int]) -> int:\n    for i, x in enumerate(nums):\n        if x == ${k}:\n            return i\n    return -1`,
      java: `public static int ${fn}(int[] nums) {\n    for (int i = 0; i < nums.length; i++) {\n        if (nums[i] == ${k}) return i;\n    }\n    return -1;\n}`,
      cpp: `int ${fn}(vector<int>& nums) {\n    for (int i = 0; i < (int)nums.size(); i++) {\n        if (nums[i] == ${k}) return i;\n    }\n    return -1;\n}`,
      c: `int ${fn}(int* nums, int numsSize) {\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] == ${k}) return i;\n    }\n    return -1;\n}`,
      csharp: `public static int FirstIndexOf(int[] nums)\n{\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (nums[i] == ${k}) return i;\n    }\n    return -1;\n}`,
      go: `func ${fn}(nums []int) int {\n\tfor i, x := range nums {\n\t\tif x == ${k} {\n\t\t\treturn i\n\t\t}\n\t}\n\treturn -1\n}`,
      kotlin: `fun ${fn}(nums: IntArray): Int {\n    for (i in nums.indices) {\n        if (nums[i] == ${k}) return i\n    }\n    return -1\n}`,
      swift: `func ${fn}(_ nums: [Int]) -> Int {\n    for (i, x) in nums.enumerated() {\n        if x == ${k} { return i }\n    }\n    return -1\n}`,
      rust: `fn ${fn}(nums: Vec<i32>) -> i32 {\n    for (i, x) in nums.iter().enumerate() {\n        if *x == ${k} {\n            return i as i32;\n        }\n    }\n    -1\n}`,
      php: `function ${fn}($nums) {\n    foreach ($nums as $i => $x) {\n        if ($x == ${k}) return $i;\n    }\n    return -1;\n}`,
      ruby: `def ${fn}(nums)\n  nums.each_with_index do |x, i|\n    return i if x == ${k}\n  end\n  -1\nend`,
    };
    return {
      slug, title: `First Index of ${k}`, difficulty: "EASY", tags: ["Array", "Search"],
      funcName: fn,
      signature: { funcName: fn, params: [{ name: "nums", type: "int[]" }], returns: "int" },
      description: describeArrayProblem(
        `Given an integer array \`nums\`, return the **index of the first occurrence of \`${k}\`**, or \`-1\` if it does not appear.`,
        examples, "nums", ["1 <= nums.length <= 30", "-30 <= nums[i] <= 30"]),
      hints: [`Scan left to right and stop at the first match of ${k}.`, "Return -1 only after checking every element."],
      examples, gen,
      solution: (lang) => sols[lang],
    };
  },
});

// 13. contains-value-K (int[] -> bool)
customFamily({
  slugBase: "contains-value", ks: K25,
  build: (k, slug) => {
    const fn = "containsValue";
    const gen = (rng: Rng): Case => {
      const nums = genNums(rng, -30, 30);
      if (rng() < 0.5) nums[ri(rng, 0, nums.length - 1)] = k;
      return { input: fmtIntArr(nums), expectedOutput: nums.includes(k) ? "true" : "false" };
    };
    const rngEx = makeRng(slug + "-ex");
    const examples = [gen(rngEx), gen(rngEx)];
    const stmt: ExprTable = {
      default: `if (x == ${k}) return true;`,
      javascript: `if (x === ${k}) return true;`,
      typescript: `if (x === ${k}) return true;`,
      php: `if ($x == ${k}) return true;`,
      swift: `if x == ${k} { return true }`,
      kotlin: `if (x == ${k}) return true`,
      go: `if x == ${k} {\n\t\t\treturn true\n\t\t}`,
      rust: `if x == ${k} { return true; }`,
      python: `if x == ${k}: return True`,
      ruby: `return true if x == ${k}`,
    };
    const wrap: Record<Language, (s: string) => string> = {
      javascript: (s) => `var ${fn} = function(nums) {\n    for (const x of nums) {\n        ${s}\n    }\n    return false;\n};`,
      typescript: (s) => `function ${fn}(nums: number[]): boolean {\n    for (const x of nums) {\n        ${s}\n    }\n    return false;\n}`,
      python: (s) => `from typing import List\n\ndef ${fn}(nums: List[int]) -> bool:\n    for x in nums:\n        ${s}\n    return False`,
      java: (s) => `public static boolean ${fn}(int[] nums) {\n    for (int x : nums) {\n        ${s}\n    }\n    return false;\n}`,
      cpp: (s) => `bool ${fn}(vector<int>& nums) {\n    for (int x : nums) {\n        ${s}\n    }\n    return false;\n}`,
      c: (s) => `bool ${fn}(int* nums, int numsSize) {\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        ${s}\n    }\n    return false;\n}`,
      csharp: (s) => `public static bool ContainsValue(int[] nums)\n{\n    foreach (int x in nums)\n    {\n        ${s}\n    }\n    return false;\n}`,
      go: (s) => `func ${fn}(nums []int) bool {\n\tfor _, x := range nums {\n\t\t${s}\n\t}\n\treturn false\n}`,
      kotlin: (s) => `fun ${fn}(nums: IntArray): Boolean {\n    for (x in nums) {\n        ${s}\n    }\n    return false\n}`,
      swift: (s) => `func ${fn}(_ nums: [Int]) -> Bool {\n    for x in nums {\n        ${s}\n    }\n    return false\n}`,
      rust: (s) => `fn ${fn}(nums: Vec<i32>) -> bool {\n    for x in nums {\n        ${s}\n    }\n    false\n}`,
      php: (s) => `function ${fn}($nums) {\n    foreach ($nums as $x) {\n        ${s}\n    }\n    return false;\n}`,
      ruby: (s) => `def ${fn}(nums)\n  nums.each do |x|\n    ${s}\n  end\n  false\nend`,
    };
    return {
      slug, title: `Contains the Value ${k}`, difficulty: "EASY", tags: ["Array", "Search"],
      funcName: fn,
      signature: { funcName: fn, params: [{ name: "nums", type: "int[]" }], returns: "bool" },
      description: describeArrayProblem(
        `Given an integer array \`nums\`, return \`true\` if **\`${k}\` appears anywhere** in the array, and \`false\` otherwise.`,
        examples, "nums", ["1 <= nums.length <= 30", "-30 <= nums[i] <= 30"]),
      hints: ["Stop as soon as you find a match — no need to keep scanning.", "The answer for an array that never matches is false."],
      examples, gen,
      solution: (lang) => wrap[lang](exprFor(stmt, lang)),
    };
  },
});

// 14. sum-of-multiples-below-n (int -> int)
customFamily({
  slugBase: "sum-of-multiples-of", ks: K25from2,
  build: (k, slug) => {
    const fn = "sumMultiples";
    const ref = (n: number) => { let s = 0; for (let i = k; i < n; i += k) s += i; return s; };
    const gen = (rng: Rng): Case => {
      const n = ri(rng, 1, 500);
      return { input: String(n), expectedOutput: String(ref(n)) };
    };
    const rngEx = makeRng(slug + "-ex");
    const examples = [gen(rngEx), gen(rngEx)];
    const sols: Record<Language, string> = {
      javascript: `var ${fn} = function(n) {\n    let s = 0;\n    for (let i = ${k}; i < n; i += ${k}) s += i;\n    return s;\n};`,
      typescript: `function ${fn}(n: number): number {\n    let s = 0;\n    for (let i = ${k}; i < n; i += ${k}) s += i;\n    return s;\n}`,
      python: `def ${fn}(n: int) -> int:\n    return sum(range(${k}, n, ${k}))`,
      java: `public static int ${fn}(int n) {\n    int s = 0;\n    for (int i = ${k}; i < n; i += ${k}) s += i;\n    return s;\n}`,
      cpp: `int ${fn}(int n) {\n    int s = 0;\n    for (int i = ${k}; i < n; i += ${k}) s += i;\n    return s;\n}`,
      c: `int ${fn}(int n) {\n    int s = 0;\n    for (int i = ${k}; i < n; i += ${k}) s += i;\n    return s;\n}`,
      csharp: `public static int SumMultiples(int n)\n{\n    int s = 0;\n    for (int i = ${k}; i < n; i += ${k}) s += i;\n    return s;\n}`,
      go: `func ${fn}(n int) int {\n\ts := 0\n\tfor i := ${k}; i < n; i += ${k} {\n\t\ts += i\n\t}\n\treturn s\n}`,
      kotlin: `fun ${fn}(n: Int): Int {\n    var s = 0\n    var i = ${k}\n    while (i < n) {\n        s += i\n        i += ${k}\n    }\n    return s\n}`,
      swift: `func ${fn}(_ n: Int) -> Int {\n    var s = 0\n    var i = ${k}\n    while i < n {\n        s += i\n        i += ${k}\n    }\n    return s\n}`,
      rust: `fn ${fn}(n: i32) -> i32 {\n    let mut s = 0;\n    let mut i = ${k};\n    while i < n {\n        s += i;\n        i += ${k};\n    }\n    s\n}`,
      php: `function ${fn}($n) {\n    $s = 0;\n    for ($i = ${k}; $i < $n; $i += ${k}) $s += $i;\n    return $s;\n}`,
      ruby: `def ${fn}(n)\n  s = 0\n  i = ${k}\n  while i < n\n    s += i\n    i += ${k}\n  end\n  s\nend`,
    };
    const exDesc = examples.map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: n = ${e.input}\nOutput: ${e.expectedOutput}\n\`\`\``).join("\n\n");
    return {
      slug, title: `Sum of Multiples of ${k}`, difficulty: "MEDIUM", tags: ["Math", "Loops"],
      funcName: fn,
      signature: { funcName: fn, params: [{ name: "n", type: "int" }], returns: "int" },
      description: `Given an integer \`n\`, return the **sum of all positive multiples of \`${k}\` strictly below \`n\`**.\n\n${exDesc}\n\n### Constraints\n\n- \`1 <= n <= 500\``,
      hints: [`The multiples are ${k}, ${2 * k}, ${3 * k}, … while they stay below n.`, "A simple loop with a step is enough — no formula required."],
      examples, gen,
      solution: (lang) => sols[lang],
    };
  },
});

// 15. first-n-multiples (int -> int[])
customFamily({
  slugBase: "first-multiples-of", ks: K25from2,
  build: (k, slug) => {
    const fn = "firstMultiples";
    const ref = (n: number) => Array.from({ length: n }, (_, i) => (i + 1) * k);
    const gen = (rng: Rng): Case => {
      const n = ri(rng, 1, 30);
      return { input: String(n), expectedOutput: fmtIntArr(ref(n)) };
    };
    const rngEx = makeRng(slug + "-ex");
    const examples = [gen(rngEx), gen(rngEx)];
    const sols: Record<Language, string> = {
      javascript: `var ${fn} = function(n) {\n    const out = [];\n    for (let i = 1; i <= n; i++) out.push(i * ${k});\n    return out;\n};`,
      typescript: `function ${fn}(n: number): number[] {\n    const out: number[] = [];\n    for (let i = 1; i <= n; i++) out.push(i * ${k});\n    return out;\n}`,
      python: `from typing import List\n\ndef ${fn}(n: int) -> List[int]:\n    return [i * ${k} for i in range(1, n + 1)]`,
      java: `public static int[] ${fn}(int n) {\n    int[] out = new int[n];\n    for (int i = 1; i <= n; i++) out[i - 1] = i * ${k};\n    return out;\n}`,
      cpp: `vector<int> ${fn}(int n) {\n    vector<int> out;\n    for (int i = 1; i <= n; i++) out.push_back(i * ${k});\n    return out;\n}`,
      c: `int* ${fn}(int n, int* returnSize) {\n    int* out = (int*)malloc(n * sizeof(int));\n    for (int i = 1; i <= n; i++) out[i - 1] = i * ${k};\n    *returnSize = n;\n    return out;\n}`,
      csharp: `public static int[] FirstMultiples(int n)\n{\n    var out2 = new int[n];\n    for (int i = 1; i <= n; i++) out2[i - 1] = i * ${k};\n    return out2;\n}`,
      go: `func ${fn}(n int) []int {\n\tout := []int{}\n\tfor i := 1; i <= n; i++ {\n\t\tout = append(out, i*${k})\n\t}\n\treturn out\n}`,
      kotlin: `fun ${fn}(n: Int): IntArray {\n    return IntArray(n) { (it + 1) * ${k} }\n}`,
      swift: `func ${fn}(_ n: Int) -> [Int] {\n    var out: [Int] = []\n    for i in 1...n {\n        out.append(i * ${k})\n    }\n    return out\n}`,
      rust: `fn ${fn}(n: i32) -> Vec<i32> {\n    (1..=n).map(|i| i * ${k}).collect()\n}`,
      php: `function ${fn}($n) {\n    $out = [];\n    for ($i = 1; $i <= $n; $i++) $out[] = $i * ${k};\n    return $out;\n}`,
      ruby: `def ${fn}(n)\n  (1..n).map { |i| i * ${k} }\nend`,
    };
    const exDesc = examples.map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: n = ${e.input}\nOutput: ${e.expectedOutput}\n\`\`\``).join("\n\n");
    return {
      slug, title: `First n Multiples of ${k}`, difficulty: "EASY", tags: ["Math", "Array"],
      funcName: fn,
      signature: { funcName: fn, params: [{ name: "n", type: "int" }], returns: "int[]" },
      description: `Given an integer \`n\`, return an array containing the **first \`n\` positive multiples of \`${k}\`**, in increasing order: \`[${k}, ${2 * k}, ${3 * k}, …]\`.\n\n${exDesc}\n\n### Constraints\n\n- \`1 <= n <= 30\``,
      hints: [`The i-th multiple (1-indexed) is i × ${k}.`, "Build the array position by position."],
      examples, gen,
      solution: (lang) => sols[lang],
    };
  },
});

// 16. custom fizzbuzz variants (int -> string[])
const FIZZ_VARIANTS: Array<[number, number, string, string]> = [
  [3, 5, "Fizz", "Buzz"], [2, 7, "Ping", "Pong"], [3, 4, "Tic", "Tac"], [2, 3, "Foo", "Bar"],
  [4, 6, "Zip", "Zap"], [5, 7, "High", "Five"], [3, 7, "Boom", "Clap"], [2, 5, "Even", "Penta"],
  [4, 9, "Quad", "Nine"], [6, 8, "Hex", "Oct"], [2, 9, "Duo", "Nona"], [5, 6, "Penta", "Hexa"],
  [3, 8, "Tri", "Octo"], [4, 5, "Four", "Five"], [7, 9, "Lucky", "Cloud"], [2, 11, "Two", "Eleven"],
  [3, 11, "Three", "Eleven"], [4, 7, "Four", "Seven"], [5, 9, "Five", "Nine"], [6, 7, "Six", "Seven"],
  [2, 13, "Bin", "Ace"], [3, 13, "Tri", "Ace"], [5, 11, "Penta", "Ace"], [4, 11, "Quad", "Ace"], [6, 11, "Hexa", "Ace"],
];
FIZZ_VARIANTS.forEach(([d1, d2, w1, w2], idx) => {
  const slug = `word-count-game-${idx + 1}`;
  const fn = "wordGame";
  const ref = (n: number) => {
    const out: string[] = [];
    for (let i = 1; i <= n; i++) {
      if (i % (d1 * d2) === 0) out.push(w1 + w2);
      else if (i % d1 === 0) out.push(w1);
      else if (i % d2 === 0) out.push(w2);
      else out.push(String(i));
    }
    return out;
  };
  const gen = (rng: Rng): Case => {
    const n = ri(rng, 1, 15);
    return { input: String(n), expectedOutput: fmtStrArr(ref(n)) };
  };
  const rngEx = makeRng(slug + "-ex");
  const examples = [gen(rngEx), gen(rngEx)];
  const both = d1 * d2;
  const sols: Record<Language, string> = {
    javascript: `var ${fn} = function(n) {\n    const out = [];\n    for (let i = 1; i <= n; i++) {\n        if (i % ${both} === 0) out.push("${w1}${w2}");\n        else if (i % ${d1} === 0) out.push("${w1}");\n        else if (i % ${d2} === 0) out.push("${w2}");\n        else out.push(String(i));\n    }\n    return out;\n};`,
    typescript: `function ${fn}(n: number): string[] {\n    const out: string[] = [];\n    for (let i = 1; i <= n; i++) {\n        if (i % ${both} === 0) out.push("${w1}${w2}");\n        else if (i % ${d1} === 0) out.push("${w1}");\n        else if (i % ${d2} === 0) out.push("${w2}");\n        else out.push(String(i));\n    }\n    return out;\n}`,
    python: `from typing import List\n\ndef ${fn}(n: int) -> List[str]:\n    out = []\n    for i in range(1, n + 1):\n        if i % ${both} == 0:\n            out.append("${w1}${w2}")\n        elif i % ${d1} == 0:\n            out.append("${w1}")\n        elif i % ${d2} == 0:\n            out.append("${w2}")\n        else:\n            out.append(str(i))\n    return out`,
    java: `public static String[] ${fn}(int n) {\n    String[] out = new String[n];\n    for (int i = 1; i <= n; i++) {\n        if (i % ${both} == 0) out[i - 1] = "${w1}${w2}";\n        else if (i % ${d1} == 0) out[i - 1] = "${w1}";\n        else if (i % ${d2} == 0) out[i - 1] = "${w2}";\n        else out[i - 1] = String.valueOf(i);\n    }\n    return out;\n}`,
    cpp: `vector<string> ${fn}(int n) {\n    vector<string> out;\n    for (int i = 1; i <= n; i++) {\n        if (i % ${both} == 0) out.push_back("${w1}${w2}");\n        else if (i % ${d1} == 0) out.push_back("${w1}");\n        else if (i % ${d2} == 0) out.push_back("${w2}");\n        else out.push_back(to_string(i));\n    }\n    return out;\n}`,
    c: `char** ${fn}(int n, int* returnSize) {\n    char** out = (char**)malloc(n * sizeof(char*));\n    for (int i = 1; i <= n; i++) {\n        char* item = (char*)malloc(20);\n        if (i % ${both} == 0) strcpy(item, "${w1}${w2}");\n        else if (i % ${d1} == 0) strcpy(item, "${w1}");\n        else if (i % ${d2} == 0) strcpy(item, "${w2}");\n        else sprintf(item, "%d", i);\n        out[i - 1] = item;\n    }\n    *returnSize = n;\n    return out;\n}`,
    csharp: `public static string[] WordGame(int n)\n{\n    var out2 = new string[n];\n    for (int i = 1; i <= n; i++)\n    {\n        if (i % ${both} == 0) out2[i - 1] = "${w1}${w2}";\n        else if (i % ${d1} == 0) out2[i - 1] = "${w1}";\n        else if (i % ${d2} == 0) out2[i - 1] = "${w2}";\n        else out2[i - 1] = i.ToString();\n    }\n    return out2;\n}`,
    go: `func ${fn}(n int) []string {\n\tout := []string{}\n\tfor i := 1; i <= n; i++ {\n\t\tif i%${both} == 0 {\n\t\t\tout = append(out, "${w1}${w2}")\n\t\t} else if i%${d1} == 0 {\n\t\t\tout = append(out, "${w1}")\n\t\t} else if i%${d2} == 0 {\n\t\t\tout = append(out, "${w2}")\n\t\t} else {\n\t\t\tout = append(out, strconv.Itoa(i))\n\t\t}\n\t}\n\treturn out\n}`,
    kotlin: `fun ${fn}(n: Int): Array<String> {\n    return Array(n) { idx ->\n        val i = idx + 1\n        when {\n            i % ${both} == 0 -> "${w1}${w2}"\n            i % ${d1} == 0 -> "${w1}"\n            i % ${d2} == 0 -> "${w2}"\n            else -> i.toString()\n        }\n    }\n}`,
    swift: `func ${fn}(_ n: Int) -> [String] {\n    var out: [String] = []\n    for i in 1...n {\n        if i % ${both} == 0 { out.append("${w1}${w2}") }\n        else if i % ${d1} == 0 { out.append("${w1}") }\n        else if i % ${d2} == 0 { out.append("${w2}") }\n        else { out.append(String(i)) }\n    }\n    return out\n}`,
    rust: `fn ${fn}(n: i32) -> Vec<String> {\n    let mut out = Vec::new();\n    for i in 1..=n {\n        if i % ${both} == 0 {\n            out.push("${w1}${w2}".to_string());\n        } else if i % ${d1} == 0 {\n            out.push("${w1}".to_string());\n        } else if i % ${d2} == 0 {\n            out.push("${w2}".to_string());\n        } else {\n            out.push(i.to_string());\n        }\n    }\n    out\n}`,
    php: `function ${fn}($n) {\n    $out = [];\n    for ($i = 1; $i <= $n; $i++) {\n        if ($i % ${both} == 0) $out[] = "${w1}${w2}";\n        elseif ($i % ${d1} == 0) $out[] = "${w1}";\n        elseif ($i % ${d2} == 0) $out[] = "${w2}";\n        else $out[] = strval($i);\n    }\n    return $out;\n}`,
    ruby: `def ${fn}(n)\n  (1..n).map do |i|\n    if i % ${both} == 0\n      "${w1}${w2}"\n    elsif i % ${d1} == 0\n      "${w1}"\n    elsif i % ${d2} == 0\n      "${w2}"\n    else\n      i.to_s\n    end\n  end\nend`,
  };
  const exDesc = examples.map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: n = ${e.input}\nOutput: ${e.expectedOutput}\n\`\`\``).join("\n\n");
  addSpec({
    slug, title: `${w1}${w2} Counting Game`, difficulty: "EASY", tags: ["Math", "String"],
    funcName: fn,
    signature: { funcName: fn, params: [{ name: "n", type: "int" }], returns: "string[]" },
    description: `Count from 1 to \`n\`, building a string array (1-indexed) where position \`i\` holds:\n\n- \`"${w1}${w2}"\` if \`i\` is divisible by both **${d1} and ${d2}**\n- \`"${w1}"\` if \`i\` is divisible by **${d1}**\n- \`"${w2}"\` if \`i\` is divisible by **${d2}**\n- the number itself (as a string) otherwise\n\n${exDesc}\n\n### Constraints\n\n- \`1 <= n <= 15\``,
    hints: [`Check divisibility by ${d1 * d2} first, or "${w1}" will shadow "${w1}${w2}".`, "Convert plain numbers with your language's to-string."],
    examples, gen,
    solution: (lang) => sols[lang],
  });
});

// 17. count-char-C (string -> int)
const LETTERS = "abcdefghijklmnopqrstuvwxy".split(""); // 25 letters
customFamily({
  slugBase: "count-letter", ks: K25,
  build: (kIdx, _slugIgnored) => {
    const C = LETTERS[kIdx];
    const slug = `count-letter-${C}`;
    const fn = "countLetter";
    const genStr = (rng: Rng) => Array.from({ length: ri(rng, 1, 60) }, () => LETTERS[ri(rng, 0, 24)]).join("");
    const gen = (rng: Rng): Case => {
      const s = genStr(rng);
      return { input: `"${s}"`, expectedOutput: String([...s].filter((c) => c === C).length) };
    };
    const rngEx = makeRng(slug + "-ex");
    const examples = [gen(rngEx), gen(rngEx)];
    const sols: Record<Language, string> = {
      javascript: `var ${fn} = function(s) {\n    let acc = 0;\n    for (const ch of s) if (ch === "${C}") acc++;\n    return acc;\n};`,
      typescript: `function ${fn}(s: string): number {\n    let acc = 0;\n    for (const ch of s) if (ch === "${C}") acc++;\n    return acc;\n}`,
      python: `def ${fn}(s: str) -> int:\n    return s.count("${C}")`,
      java: `public static int ${fn}(String s) {\n    int acc = 0;\n    for (char ch : s.toCharArray()) if (ch == '${C}') acc++;\n    return acc;\n}`,
      cpp: `int ${fn}(string s) {\n    int acc = 0;\n    for (char ch : s) if (ch == '${C}') acc++;\n    return acc;\n}`,
      c: `int ${fn}(const char* s) {\n    int acc = 0;\n    for (int i = 0; s[i]; i++) if (s[i] == '${C}') acc++;\n    return acc;\n}`,
      csharp: `public static int CountLetter(string s)\n{\n    int acc = 0;\n    foreach (char ch in s) if (ch == '${C}') acc++;\n    return acc;\n}`,
      go: `func ${fn}(s string) int {\n\tacc := 0\n\tfor _, ch := range s {\n\t\tif ch == '${C}' {\n\t\t\tacc++\n\t\t}\n\t}\n\treturn acc\n}`,
      kotlin: `fun ${fn}(s: String): Int {\n    return s.count { it == '${C}' }\n}`,
      swift: `func ${fn}(_ s: String) -> Int {\n    var acc = 0\n    for ch in s {\n        if ch == "${C}" { acc += 1 }\n    }\n    return acc\n}`,
      rust: `fn ${fn}(s: String) -> i32 {\n    s.chars().filter(|c| *c == '${C}').count() as i32\n}`,
      php: `function ${fn}($s) {\n    return substr_count($s, "${C}");\n}`,
      ruby: `def ${fn}(s)\n  s.count("${C}")\nend`,
    };
    const exDesc = examples.map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: s = ${e.input}\nOutput: ${e.expectedOutput}\n\`\`\``).join("\n\n");
    return {
      slug, title: `Count the Letter "${C}"`, difficulty: "EASY", tags: ["String", "Counting"],
      funcName: fn,
      signature: { funcName: fn, params: [{ name: "s", type: "string" }], returns: "int" },
      description: `Given a lowercase string \`s\`, return **how many times the letter \`"${C}"\` appears** in it.\n\n${exDesc}\n\n### Constraints\n\n- \`1 <= s.length <= 60\`\n- \`s\` consists of lowercase English letters.`,
      hints: [`Scan character by character, comparing against "${C}".`, "Most languages also have a built-in count/filter that does this in one line."],
      examples, gen,
      solution: (lang) => sols[lang],
    };
  },
});

// 18. replace-char-C-with-# (string -> string)
customFamily({
  slugBase: "replace-letter", ks: K25,
  build: (kIdx) => {
    const C = LETTERS[kIdx];
    const slug = `replace-letter-${C}`;
    const fn = "replaceLetter";
    const genStr = (rng: Rng) => Array.from({ length: ri(rng, 1, 60) }, () => LETTERS[ri(rng, 0, 24)]).join("");
    const gen = (rng: Rng): Case => {
      const s = genStr(rng);
      return { input: `"${s}"`, expectedOutput: s.split(C).join("#") };
    };
    const rngEx = makeRng(slug + "-ex");
    const examples = [gen(rngEx), gen(rngEx)];
    const sols: Record<Language, string> = {
      javascript: `var ${fn} = function(s) {\n    return s.split("${C}").join("#");\n};`,
      typescript: `function ${fn}(s: string): string {\n    return s.split("${C}").join("#");\n}`,
      python: `def ${fn}(s: str) -> str:\n    return s.replace("${C}", "#")`,
      java: `public static String ${fn}(String s) {\n    return s.replace('${C}', '#');\n}`,
      cpp: `string ${fn}(string s) {\n    for (char& ch : s) {\n        if (ch == '${C}') ch = '#';\n    }\n    return s;\n}`,
      c: `char* ${fn}(const char* s) {\n    int len = strlen(s);\n    char* out = (char*)malloc(len + 1);\n    for (int i = 0; i <= len; i++) {\n        out[i] = (s[i] == '${C}') ? '#' : s[i];\n    }\n    return out;\n}`,
      csharp: `public static string ReplaceLetter(string s)\n{\n    return s.Replace('${C}', '#');\n}`,
      go: `func ${fn}(s string) string {\n\treturn strings.ReplaceAll(s, "${C}", "#")\n}`,
      kotlin: `fun ${fn}(s: String): String {\n    return s.replace('${C}', '#')\n}`,
      swift: `func ${fn}(_ s: String) -> String {\n    return s.replacingOccurrences(of: "${C}", with: "#")\n}`,
      rust: `fn ${fn}(s: String) -> String {\n    s.replace('${C}', "#")\n}`,
      php: `function ${fn}($s) {\n    return str_replace("${C}", "#", $s);\n}`,
      ruby: `def ${fn}(s)\n  s.gsub("${C}", "#")\nend`,
    };
    const exDesc = examples.map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: s = ${e.input}\nOutput: ${e.expectedOutput}\n\`\`\``).join("\n\n");
    return {
      slug, title: `Replace the Letter "${C}"`, difficulty: "EASY", tags: ["String"],
      funcName: fn,
      signature: { funcName: fn, params: [{ name: "s", type: "string" }], returns: "string" },
      description: `Given a lowercase string \`s\`, return a copy where **every occurrence of \`"${C}"\` is replaced with \`"#"\`**.\n\n${exDesc}\n\n### Constraints\n\n- \`1 <= s.length <= 60\`\n- \`s\` consists of lowercase English letters.`,
      hints: ["Every language has a replace built-in — or walk the characters and rebuild.", "Characters other than the target stay exactly as they are."],
      examples, gen,
      solution: (lang) => sols[lang],
    };
  },
});

// 19. repeat-word-K-times (string -> string[])
customFamily({
  slugBase: "repeat-word", ks: K25from1,
  build: (k, slug) => {
    const fn = "repeatWord";
    const genStr = (rng: Rng) => Array.from({ length: ri(rng, 1, 10) }, () => LETTERS[ri(rng, 0, 24)]).join("");
    const gen = (rng: Rng): Case => {
      const s = genStr(rng);
      return { input: `"${s}"`, expectedOutput: fmtStrArr(Array.from({ length: k }, () => s)) };
    };
    const rngEx = makeRng(slug + "-ex");
    const examples = [gen(rngEx), gen(rngEx)];
    const sols: Record<Language, string> = {
      javascript: `var ${fn} = function(s) {\n    return new Array(${k}).fill(s);\n};`,
      typescript: `function ${fn}(s: string): string[] {\n    const out: string[] = [];\n    for (let i = 0; i < ${k}; i++) out.push(s);\n    return out;\n}`,
      python: `from typing import List\n\ndef ${fn}(s: str) -> List[str]:\n    return [s] * ${k}`,
      java: `public static String[] ${fn}(String s) {\n    String[] out = new String[${k}];\n    for (int i = 0; i < ${k}; i++) out[i] = s;\n    return out;\n}`,
      cpp: `vector<string> ${fn}(string s) {\n    return vector<string>(${k}, s);\n}`,
      c: `char** ${fn}(const char* s, int* returnSize) {\n    char** out = (char**)malloc(${k} * sizeof(char*));\n    for (int i = 0; i < ${k}; i++) {\n        out[i] = (char*)malloc(strlen(s) + 1);\n        strcpy(out[i], s);\n    }\n    *returnSize = ${k};\n    return out;\n}`,
      csharp: `public static string[] RepeatWord(string s)\n{\n    var out2 = new string[${k}];\n    for (int i = 0; i < ${k}; i++) out2[i] = s;\n    return out2;\n}`,
      go: `func ${fn}(s string) []string {\n\tout := []string{}\n\tfor i := 0; i < ${k}; i++ {\n\t\tout = append(out, s)\n\t}\n\treturn out\n}`,
      kotlin: `fun ${fn}(s: String): Array<String> {\n    return Array(${k}) { s }\n}`,
      swift: `func ${fn}(_ s: String) -> [String] {\n    return Array(repeating: s, count: ${k})\n}`,
      rust: `fn ${fn}(s: String) -> Vec<String> {\n    vec![s; ${k}]\n}`,
      php: `function ${fn}($s) {\n    return array_fill(0, ${k}, $s);\n}`,
      ruby: `def ${fn}(s)\n  [s] * ${k}\nend`,
    };
    const exDesc = examples.map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: s = ${e.input}\nOutput: ${e.expectedOutput}\n\`\`\``).join("\n\n");
    return {
      slug, title: `Repeat the Word ${k} Time${k === 1 ? "" : "s"}`, difficulty: "EASY", tags: ["String", "Array"],
      funcName: fn,
      signature: { funcName: fn, params: [{ name: "s", type: "string" }], returns: "string[]" },
      description: `Given a lowercase word \`s\`, return an array containing \`s\` **exactly ${k} time${k === 1 ? "" : "s"}**.\n\n${exDesc}\n\n### Constraints\n\n- \`1 <= s.length <= 10\`\n- \`s\` consists of lowercase English letters.`,
      hints: ["Fill an array of the fixed size with the same value.", "Many languages have a one-line fill/repeat builtin."],
      examples, gen,
      solution: (lang) => sols[lang],
    };
  },
});

// 20. count-words-longer-than-K (string[] -> int)
customFamily({
  slugBase: "count-words-longer-than", ks: K25,
  build: (k, slug) => {
    const fn = "countLongWords";
    const genWords = (rng: Rng) => Array.from({ length: ri(rng, 1, 15) }, () => Array.from({ length: ri(rng, 1, 30) }, () => LETTERS[ri(rng, 0, 24)]).join(""));
    const gen = (rng: Rng): Case => {
      const words = genWords(rng);
      return { input: fmtStrArr(words), expectedOutput: String(words.filter((w) => w.length > k).length) };
    };
    const rngEx = makeRng(slug + "-ex");
    const examples = [gen(rngEx), gen(rngEx)];
    const sols: Record<Language, string> = {
      javascript: `var ${fn} = function(words) {\n    return words.filter((w) => w.length > ${k}).length;\n};`,
      typescript: `function ${fn}(words: string[]): number {\n    return words.filter((w) => w.length > ${k}).length;\n}`,
      python: `from typing import List\n\ndef ${fn}(words: List[str]) -> int:\n    return sum(1 for w in words if len(w) > ${k})`,
      java: `public static int ${fn}(String[] words) {\n    int acc = 0;\n    for (String w : words) if (w.length() > ${k}) acc++;\n    return acc;\n}`,
      cpp: `int ${fn}(vector<string>& words) {\n    int acc = 0;\n    for (const string& w : words) if ((int)w.size() > ${k}) acc++;\n    return acc;\n}`,
      c: `int ${fn}(char** words, int wordsSize) {\n    int acc = 0;\n    for (int i = 0; i < wordsSize; i++) if ((int)strlen(words[i]) > ${k}) acc++;\n    return acc;\n}`,
      csharp: `public static int CountLongWords(string[] words)\n{\n    return words.Count(w => w.Length > ${k});\n}`,
      go: `func ${fn}(words []string) int {\n\tacc := 0\n\tfor _, w := range words {\n\t\tif len(w) > ${k} {\n\t\t\tacc++\n\t\t}\n\t}\n\treturn acc\n}`,
      kotlin: `fun ${fn}(words: Array<String>): Int {\n    return words.count { it.length > ${k} }\n}`,
      swift: `func ${fn}(_ words: [String]) -> Int {\n    return words.filter { $0.count > ${k} }.count\n}`,
      rust: `fn ${fn}(words: Vec<String>) -> i32 {\n    words.iter().filter(|w| w.len() > ${k}).count() as i32\n}`,
      php: `function ${fn}($words) {\n    $acc = 0;\n    foreach ($words as $w) {\n        if (strlen($w) > ${k}) $acc++;\n    }\n    return $acc;\n}`,
      ruby: `def ${fn}(words)\n  words.count { |w| w.length > ${k} }\nend`,
    };
    const exDesc = examples.map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: words = ${e.input}\nOutput: ${e.expectedOutput}\n\`\`\``).join("\n\n");
    return {
      slug, title: `Count Words Longer Than ${k}`, difficulty: "MEDIUM", tags: ["String", "Array", "Counting"],
      funcName: fn,
      signature: { funcName: fn, params: [{ name: "words", type: "string[]" }], returns: "int" },
      description: `Given an array of lowercase words, return **how many words have strictly more than \`${k}\` characters**.\n\n${exDesc}\n\n### Constraints\n\n- \`1 <= words.length <= 15\`\n- \`1 <= words[i].length <= 30\``,
      hints: ["Compare each word's length against the threshold.", "Strictly greater — a word of exactly that length does not count."],
      examples, gen,
      solution: (lang) => sols[lang],
    };
  },
});

// ── Seeding ────────────────────────────────────────────────────────
async function seed() {
  console.log(`Seeding ${SPECS.length} problems × (${3} visible + ${HIDDEN_COUNT} hidden) cases…`);
  let done = 0;
  for (const spec of SPECS) {
    const starterCode = Object.fromEntries(ALL_LANGUAGES.map((lang) => [lang, renderStub(lang, spec.signature)]));
    const problem = await prisma.problem.upsert({
      where: { slug: spec.slug },
      update: {
        title: spec.title, description: spec.description, difficulty: spec.difficulty,
        tags: spec.tags, hints: spec.hints, starterCode, signature: spec.signature as object,
        referenceSolution: spec.solution("python"), referenceLanguage: "python", isPublished: true,
      },
      create: {
        slug: spec.slug, title: spec.title, description: spec.description, difficulty: spec.difficulty,
        tags: spec.tags, hints: spec.hints, starterCode, signature: spec.signature as object,
        referenceSolution: spec.solution("python"), referenceLanguage: "python", isPublished: true,
        timeLimitMs: 2000, memoryLimitMb: 256,
      },
    });

    await prisma.testCase.deleteMany({ where: { problemId: problem.id } });
    const rows: Array<{ problemId: string; input: string; expectedOutput: string; isHidden: boolean; orderIndex: number }> = [];
    spec.examples.slice(0, 3).forEach((ex, i) => rows.push({ problemId: problem.id, input: ex.input, expectedOutput: ex.expectedOutput, isHidden: false, orderIndex: i }));
    const rng = makeRng(spec.slug);
    for (let i = 0; i < HIDDEN_COUNT; i++) {
      const c = spec.gen(rng);
      rows.push({ problemId: problem.id, input: c.input, expectedOutput: c.expectedOutput, isHidden: true, orderIndex: spec.examples.length + i });
    }
    for (let i = 0; i < rows.length; i += 2000) {
      await prisma.testCase.createMany({ data: rows.slice(i, i + 2000) });
    }
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${SPECS.length} seeded (latest: ${spec.slug})`);
  }
  console.log(`Done: ${done} problems.`);
}

// ── Sample validation: all 13 langs on 1 variant/family + JS everywhere ──
async function validateSample() {
  const bySlugBase = new Map<string, ProblemSpec[]>();
  for (const s of SPECS) {
    const base = s.slug.replace(/-[^-]+$/, "");
    if (!bySlugBase.has(base)) bySlugBase.set(base, []);
    bySlugBase.get(base)!.push(s);
  }
  let pass = 0, fail = 0;
  const failures: string[] = [];

  async function checkOne(spec: ProblemSpec, lang: Language) {
    const problem = await prisma.problem.findUnique({
      where: { slug: spec.slug },
      include: { testCases: { orderBy: { orderIndex: "asc" } } },
    });
    if (!problem || problem.testCases.length === 0) { console.log(`SKIP ${spec.slug}`); return; }
    try {
      const r = await runBatch(
        applyDriver(lang, spec.signature, spec.solution(lang)), lang,
        problem.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
        { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb }
      );
      const passed = r.perCase.filter((x) => x.passed).length;
      if (passed === problem.testCases.length) {
        pass++;
      } else {
        fail++;
        const bad = r.perCase.find((x) => !x.passed)!;
        const msg = `FAIL ${spec.slug} [${lang}]: ${passed}/${problem.testCases.length} — ${bad.status}: ${(bad.compile_output || bad.stderr || "").slice(0, 120)}`;
        failures.push(msg);
        console.log(msg);
      }
    } catch (e) {
      fail++;
      const msg = `FAIL ${spec.slug} [${lang}] threw: ${(e as Error).message}`;
      failures.push(msg);
      console.log(msg);
    }
  }

  console.log(`Phase 1: all 13 languages × first variant of each of ${bySlugBase.size} families`);
  for (const [base, specs] of bySlugBase) {
    for (const lang of ALL_LANGUAGES) {
      await checkOne(specs[0], lang);
    }
    console.log(`  family ${base}: done (${pass} pass, ${fail} fail so far)`);
  }

  console.log(`Phase 2: javascript × all ${SPECS.length} problems`);
  let i = 0;
  for (const spec of SPECS) {
    await checkOne(spec, "javascript");
    if (++i % 50 === 0) console.log(`  ${i}/${SPECS.length} (${pass} pass, ${fail} fail)`);
  }

  console.log(`\n== ${pass} passed, ${fail} failed`);
  if (failures.length) process.exitCode = 1;
}

(async () => {
  console.log(`Generated ${SPECS.length} problem specs.`);
  if (flag("seed")) await seed();
  if (flag("validate-sample")) await validateSample();
  if (!flag("seed") && !flag("validate-sample")) {
    console.log("usage: tsx scripts/seed-500.ts --seed [--count 5000] [--limit 500] | --validate-sample");
  }
  await prisma.$disconnect();
})();
