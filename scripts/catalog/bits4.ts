/**
 * Bit-manipulation problems — wave 4.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" bit set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs in
 * src/lib/judge0.ts reads `<ident>=` as a named argument).
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 * JavaScript's bitwise operators are 32-bit and signed, so anything wider is
 * done with arithmetic instead; several problems cap their inputs so every
 * language's `int` holds the answer.
 */

import { bool, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const BITS4_PROBLEMS: CatalogProblem[] = [

  // ── Find the K-or of an Array (LC 2917) ─────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let out = 0;
      for (let b = 0; b < 31; b++) {
        let c = 0;
        for (const x of nums) { if ((Math.floor(x / Math.pow(2, b)) % 2) === 1) c++; }
        if (c >= k) out += Math.pow(2, b);
      }
      return out;
    };
    return {
      slug: "find-the-k-or-of-an-array",
      title: "Find the K-or of an Array",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Array", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "findKOr", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **K-or** of an array is the number whose bit `i` is set exactly when at least `k` elements of `nums` have bit `i` set.\n\nReturn the K-or of `nums`.",
        [
          { in: "nums = [7,12,9,8,9,15], k = 4", out: "9", note: "Bit 0 is set in 7, 9, 9 and 15 — four elements — and bit 3 is set in 12, 9, 8, 9 and 15. No other bit reaches four." },
          { in: "nums = [2,12,1,11,4,5], k = 6", out: "0", note: "No bit is set in all six numbers." },
          { in: "nums = [10,8,5,9,11,6,8], k = 1", out: "15", note: "With k = 1 the K-or is the plain OR of everything." },
        ],
        ["1 <= nums.length <= 50", "0 <= nums[i] < 2^31", "1 <= k <= nums.length"]),
      hints: [
        "Decide each bit independently — the bits never interact.",
        "For bit `i`, count how many elements have it set and compare with `k`.",
        "31 bits times 50 elements is a tiny amount of work.",
      ],
      editorial: explain({
        idea: "The definition is per-bit, so handle one bit at a time: count the elements that have it, and set it in the answer when the count reaches `k`.",
        steps: [
          "Loop `b` from `0` to `30`.",
          "Count the elements whose bit `b` is set.",
          "If that count is at least `k`, add `2^b` to the answer.",
        ],
        why: "Bits of the answer are defined independently of one another, so no interaction or carry logic is needed — the loop is a direct transcription of the definition.",
        time: "O(31 · n)",
        space: "O(1)",
        pitfalls: [
          "Values reach `2^31 - 1`, so bit 30 matters and bit 31 does not exist for a signed `int`.",
          "In JavaScript `1 << 31` is negative — build the answer by adding powers of two instead of shifting into the sign bit.",
          "`k = 1` reduces to the ordinary OR, which is a useful sanity check.",
        ],
      }),
      examples: [
        { input: "[7,12,9,8,9,15]\n4", expectedOutput: "9" },
        { input: "[2,12,1,11,4,5]\n6", expectedOutput: "0" },
        { input: "[10,8,5,9,11,6,8]\n1", expectedOutput: "15" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const hi = rng() < 0.6 ? 31 : 2000000000;
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findKOr(nums: List[int], k: int) -> int:\n    out = 0\n    for b in range(31):\n        if sum(1 for x in nums if (x >> b) & 1) >= k:\n            out |= 1 << b\n    return out`,
        javascript: `var findKOr = function(nums, k) {\n    var out = 0;\n    for (var b = 0; b < 31; b++) {\n        var c = 0;\n        for (var i = 0; i < nums.length; i++) {\n            if (Math.floor(nums[i] / Math.pow(2, b)) % 2 === 1) c++;\n        }\n        if (c >= k) out += Math.pow(2, b);\n    }\n    return out;\n};`,
        typescript: `function findKOr(nums: number[], k: number): number {\n    var out = 0;\n    for (var b = 0; b < 31; b++) {\n        var c = 0;\n        for (var i = 0; i < nums.length; i++) {\n            if (Math.floor(nums[i] / Math.pow(2, b)) % 2 === 1) c++;\n        }\n        if (c >= k) out += Math.pow(2, b);\n    }\n    return out;\n}`,
        java: `public static int findKOr(int[] nums, int k) {\n    int out = 0;\n    for (int b = 0; b < 31; b++) {\n        int c = 0;\n        for (int x : nums) {\n            if (((x >> b) & 1) == 1) c++;\n        }\n        if (c >= k) out |= 1 << b;\n    }\n    return out;\n}`,
        cpp: `int findKOr(vector<int>& nums, int k) {\n    int out = 0;\n    for (int b = 0; b < 31; b++) {\n        int c = 0;\n        for (int x : nums) {\n            if ((x >> b) & 1) c++;\n        }\n        if (c >= k) out |= 1 << b;\n    }\n    return out;\n}`,
        c: `int findKOr(int* nums, int numsSize, int k) {\n    int out = 0;\n    for (int b = 0; b < 31; b++) {\n        int c = 0;\n        for (int i = 0; i < numsSize; i++) {\n            if ((nums[i] >> b) & 1) c++;\n        }\n        if (c >= k) out |= 1 << b;\n    }\n    return out;\n}`,
        csharp: `public static int FindKOr(int[] nums, int k)\n{\n    int out_ = 0;\n    for (int b = 0; b < 31; b++)\n    {\n        int c = 0;\n        foreach (int x in nums)\n        {\n            if (((x >> b) & 1) == 1) c++;\n        }\n        if (c >= k) out_ |= 1 << b;\n    }\n    return out_;\n}`,
        go: `func findKOr(nums []int, k int) int {\n\tout := 0\n\tfor b := 0; b < 31; b++ {\n\t\tc := 0\n\t\tfor _, x := range nums {\n\t\t\tif (x>>uint(b))&1 == 1 {\n\t\t\t\tc++\n\t\t\t}\n\t\t}\n\t\tif c >= k {\n\t\t\tout |= 1 << uint(b)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findKOr(nums: IntArray, k: Int): Int {\n    var out = 0\n    for (b in 0 until 31) {\n        var c = 0\n        for (x in nums) {\n            if ((x shr b) and 1 == 1) c++\n        }\n        if (c >= k) out = out or (1 shl b)\n    }\n    return out\n}`,
        swift: `func findKOr(_ nums: [Int], _ k: Int) -> Int {\n    var out = 0\n    for b in 0..<31 {\n        var c = 0\n        for x in nums where (x >> b) & 1 == 1 { c += 1 }\n        if c >= k { out |= 1 << b }\n    }\n    return out\n}`,
        rust: `fn findKOr(nums: Vec<i32>, k: i32) -> i32 {\n    let mut out = 0i32;\n    for b in 0..31 {\n        let mut c = 0i32;\n        for &x in nums.iter() {\n            if (x >> b) & 1 == 1 {\n                c += 1;\n            }\n        }\n        if c >= k {\n            out |= 1 << b;\n        }\n    }\n    out\n}`,
        php: `function findKOr($nums, $k) {\n    $out = 0;\n    for ($b = 0; $b < 31; $b++) {\n        $c = 0;\n        foreach ($nums as $x) {\n            if (($x >> $b) & 1) $c++;\n        }\n        if ($c >= $k) $out |= 1 << $b;\n    }\n    return $out;\n}`,
        ruby: `def findKOr(nums, k)\n  out = 0\n  (0...31).each do |b|\n    c = nums.count { |x| (x >> b) & 1 == 1 }\n    out |= 1 << b if c >= k\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Complement of Base 10 Integer (LC 1009) ─────────────────────
  (() => {
    const ref = (n: number) => {
      if (n === 0) return 1;
      let mask = 1;
      while (mask <= n) mask *= 2;
      return mask - 1 - n;
    };
    return {
      slug: "complement-of-base-10-integer",
      title: "Complement of Base 10 Integer",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Math", "TCS", "Wipro", "Accenture"],
      signature: { funcName: "bitwiseComplement", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **complement** of a number flips every bit of its binary representation, ignoring leading zeros. The complement of `5` (binary `101`) is `2` (binary `010`).\n\nGiven a non-negative integer `n`, return its complement.",
        [
          { in: "n = 5", out: "2", note: "101 flips to 010." },
          { in: "n = 7", out: "0", note: "111 flips to 000." },
          { in: "n = 0", out: "1", note: "0 is written as the single bit 0, which flips to 1." },
        ],
        ["0 <= n < 1000000000"]),
      hints: [
        "Build the all-ones mask with the same number of bits as `n`.",
        "Then the complement is `mask - n`, since `mask` has a 1 wherever `n` has a bit position at all.",
        "`n = 0` is the special case — its complement is 1.",
      ],
      editorial: explain({
        idea: "Flipping every bit of an `L`-bit number is the same as subtracting it from the `L`-bit all-ones value, because each bit position independently goes from `b` to `1 - b`.",
        steps: [
          "Handle `n == 0` separately, returning `1`.",
          "Find the smallest power of two strictly greater than `n`; call it `mask`.",
          "Return `mask - 1 - n`, since `mask - 1` is the all-ones value of the right width.",
        ],
        why: "If `n` has `L` significant bits then `mask - 1 = 2^L - 1` is exactly `L` ones, and `(2^L - 1) - n` flips each of those bits. Ignoring leading zeros is precisely what choosing `L` from `n` itself achieves.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Using `~n` flips the full machine word and yields a negative number.",
          "`n = 0` has no set bits, so the mask loop must be guarded or it returns 0 instead of 1.",
          "In JavaScript, doubling past 2^31 stays exact as a double, but `1 << 31` would go negative.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "2" },
        { input: "7", expectedOutput: "0" },
        { input: "0", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 0, 100) : ri(rng, 0, 999999999);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def bitwiseComplement(n: int) -> int:\n    if n == 0:\n        return 1\n    mask = 1\n    while mask <= n:\n        mask <<= 1\n    return mask - 1 - n`,
        javascript: `var bitwiseComplement = function(n) {\n    if (n === 0) return 1;\n    var mask = 1;\n    while (mask <= n) mask *= 2;\n    return mask - 1 - n;\n};`,
        typescript: `function bitwiseComplement(n: number): number {\n    if (n === 0) return 1;\n    var mask = 1;\n    while (mask <= n) mask *= 2;\n    return mask - 1 - n;\n}`,
        java: `public static int bitwiseComplement(int n) {\n    if (n == 0) return 1;\n    long mask = 1;\n    while (mask <= n) mask <<= 1;\n    return (int) (mask - 1 - n);\n}`,
        cpp: `int bitwiseComplement(int n) {\n    if (n == 0) return 1;\n    long long mask = 1;\n    while (mask <= n) mask <<= 1;\n    return (int) (mask - 1 - n);\n}`,
        c: `int bitwiseComplement(int n) {\n    if (n == 0) return 1;\n    long long mask = 1;\n    while (mask <= n) mask <<= 1;\n    return (int) (mask - 1 - n);\n}`,
        csharp: `public static int BitwiseComplement(int n)\n{\n    if (n == 0) return 1;\n    long mask = 1;\n    while (mask <= n) mask <<= 1;\n    return (int) (mask - 1 - n);\n}`,
        go: `func bitwiseComplement(n int) int {\n\tif n == 0 {\n\t\treturn 1\n\t}\n\tmask := 1\n\tfor mask <= n {\n\t\tmask <<= 1\n\t}\n\treturn mask - 1 - n\n}`,
        kotlin: `fun bitwiseComplement(n: Int): Int {\n    if (n == 0) return 1\n    var mask = 1L\n    while (mask <= n) mask = mask shl 1\n    return (mask - 1 - n).toInt()\n}`,
        swift: `func bitwiseComplement(_ n: Int) -> Int {\n    if n == 0 { return 1 }\n    var mask = 1\n    while mask <= n { mask <<= 1 }\n    return mask - 1 - n\n}`,
        rust: `fn bitwiseComplement(n: i32) -> i32 {\n    if n == 0 {\n        return 1;\n    }\n    let mut mask: i64 = 1;\n    while mask <= n as i64 {\n        mask <<= 1;\n    }\n    (mask - 1 - n as i64) as i32\n}`,
        php: `function bitwiseComplement($n) {\n    if ($n === 0) return 1;\n    $mask = 1;\n    while ($mask <= $n) $mask <<= 1;\n    return $mask - 1 - $n;\n}`,
        ruby: `def bitwiseComplement(n)\n  return 1 if n == 0\n  mask = 1\n  mask <<= 1 while mask <= n\n  mask - 1 - n\nend`,
      },
    };
  })(),

  // ── Maximum Strong Pair XOR I (LC 2932) ─────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums.length; j++) {
          const a = nums[i], b = nums[j];
          if (Math.abs(a - b) <= Math.min(a, b)) {
            const x = a ^ b;
            if (x > best) best = x;
          }
        }
      }
      return best;
    };
    return {
      slug: "maximum-strong-pair-xor-i",
      title: "Maximum Strong Pair XOR I",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Array", "Trie", "Amazon", "Adobe", "Zoho"],
      signature: { funcName: "maximumStrongPairXor", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A pair `(x, y)` is a **strong pair** when `|x - y| <= min(x, y)`. The two elements may be the same element of `nums` picked twice.\n\nReturn the maximum XOR over all strong pairs of values drawn from `nums`.",
        [
          { in: "nums = [1,2,3,4,5]", out: "7", note: "(3, 4) is strong because |3 - 4| = 1 is at most 3, and 3 XOR 4 = 7." },
          { in: "nums = [10,100]", out: "0", note: "The only strong pairs are an element with itself, and x XOR x is 0." },
          { in: "nums = [5,6,25,30]", out: "7", note: "(25, 30) gives 7 and is strong since |25 - 30| = 5 is at most 25." },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 100"]),
      hints: [
        "At these limits the double loop over all ordered pairs is entirely adequate.",
        "Rewriting the condition as `max(x, y) <= 2 * min(x, y)` makes it easier to reason about.",
        "The scalable version sorts the values and sweeps a window, feeding a binary trie.",
      ],
      editorial: explain({
        idea: "Check every pair directly. The strong-pair test is a single comparison, and the XOR of a qualifying pair is a candidate answer.",
        steps: [
          "Loop over every ordered pair `(i, j)`, including `i == j`.",
          "Keep the pair when `|nums[i] - nums[j]| <= min(nums[i], nums[j])`.",
          "Track the maximum XOR seen.",
        ],
        why: "Allowing `i == j` guarantees the answer is at least 0, and checking every pair is exhaustive. The condition is equivalent to `max <= 2 · min`, which is why sorting turns it into a sliding window in the harder version of this problem.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "Forgetting that an element may pair with itself makes the answer undefined when no other pair is strong.",
          "Testing `|x - y| <= x` rather than against the minimum accepts pairs that are not strong.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]", expectedOutput: "7" },
        { input: "[10,100]", expectedOutput: "0" },
        { input: "[5,6,25,30]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, 100));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumStrongPairXor(nums: List[int]) -> int:\n    best = 0\n    for a in nums:\n        for b in nums:\n            if abs(a - b) <= min(a, b):\n                best = max(best, a ^ b)\n    return best`,
        javascript: `var maximumStrongPairXor = function(nums) {\n    var best = 0;\n    for (var i = 0; i < nums.length; i++) {\n        for (var j = 0; j < nums.length; j++) {\n            var a = nums[i], b = nums[j];\n            if (Math.abs(a - b) <= Math.min(a, b)) {\n                var x = a ^ b;\n                if (x > best) best = x;\n            }\n        }\n    }\n    return best;\n};`,
        typescript: `function maximumStrongPairXor(nums: number[]): number {\n    var best = 0;\n    for (var i = 0; i < nums.length; i++) {\n        for (var j = 0; j < nums.length; j++) {\n            var a = nums[i], b = nums[j];\n            if (Math.abs(a - b) <= Math.min(a, b)) {\n                var x = a ^ b;\n                if (x > best) best = x;\n            }\n        }\n    }\n    return best;\n}`,
        java: `public static int maximumStrongPairXor(int[] nums) {\n    int best = 0;\n    for (int a : nums) {\n        for (int b : nums) {\n            if (Math.abs(a - b) <= Math.min(a, b)) best = Math.max(best, a ^ b);\n        }\n    }\n    return best;\n}`,
        cpp: `int maximumStrongPairXor(vector<int>& nums) {\n    int best = 0;\n    for (int a : nums) {\n        for (int b : nums) {\n            if (abs(a - b) <= min(a, b)) best = max(best, a ^ b);\n        }\n    }\n    return best;\n}`,
        c: `int maximumStrongPairXor(int* nums, int numsSize) {\n    int best = 0;\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = 0; j < numsSize; j++) {\n            int a = nums[i], b = nums[j];\n            int diff = a - b;\n            if (diff < 0) diff = -diff;\n            int lo = a < b ? a : b;\n            if (diff <= lo) {\n                int x = a ^ b;\n                if (x > best) best = x;\n            }\n        }\n    }\n    return best;\n}`,
        csharp: `public static int MaximumStrongPairXor(int[] nums)\n{\n    int best = 0;\n    foreach (int a in nums)\n    {\n        foreach (int b in nums)\n        {\n            if (Math.Abs(a - b) <= Math.Min(a, b)) best = Math.Max(best, a ^ b);\n        }\n    }\n    return best;\n}`,
        go: `func maximumStrongPairXor(nums []int) int {\n\tbest := 0\n\tfor _, a := range nums {\n\t\tfor _, b := range nums {\n\t\t\tdiff := a - b\n\t\t\tif diff < 0 {\n\t\t\t\tdiff = -diff\n\t\t\t}\n\t\t\tlo := a\n\t\t\tif b < a {\n\t\t\t\tlo = b\n\t\t\t}\n\t\t\tif diff <= lo {\n\t\t\t\tif x := a ^ b; x > best {\n\t\t\t\t\tbest = x\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumStrongPairXor(nums: IntArray): Int {\n    var best = 0\n    for (a in nums) {\n        for (b in nums) {\n            if (Math.abs(a - b) <= minOf(a, b)) best = maxOf(best, a xor b)\n        }\n    }\n    return best\n}`,
        swift: `func maximumStrongPairXor(_ nums: [Int]) -> Int {\n    var best = 0\n    for a in nums {\n        for b in nums where abs(a - b) <= min(a, b) {\n            best = max(best, a ^ b)\n        }\n    }\n    return best\n}`,
        rust: `fn maximumStrongPairXor(nums: Vec<i32>) -> i32 {\n    let mut best = 0i32;\n    for &a in nums.iter() {\n        for &b in nums.iter() {\n            if (a - b).abs() <= a.min(b) {\n                let x = a ^ b;\n                if x > best {\n                    best = x;\n                }\n            }\n        }\n    }\n    best\n}`,
        php: `function maximumStrongPairXor($nums) {\n    $best = 0;\n    foreach ($nums as $a) {\n        foreach ($nums as $b) {\n            if (abs($a - $b) <= min($a, $b)) {\n                $x = $a ^ $b;\n                if ($x > $best) $best = $x;\n            }\n        }\n    }\n    return $best;\n}`,
        ruby: `def maximumStrongPairXor(nums)\n  best = 0\n  nums.each do |a|\n    nums.each do |b|\n      best = [best, a ^ b].max if (a - b).abs <= [a, b].min\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Bitwise XOR of All Pairings (LC 2425) ───────────────────────
  (() => {
    const ref = (nums1: number[], nums2: number[]) => {
      let out = 0;
      if (nums2.length % 2 === 1) { for (const x of nums1) out ^= x; }
      if (nums1.length % 2 === 1) { for (const x of nums2) out ^= x; }
      return out;
    };
    return {
      slug: "bitwise-xor-of-all-pairings",
      title: "Bitwise XOR of All Pairings",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Brainteaser", "Amazon", "Google", "Adobe"],
      signature: { funcName: "xorAllNums", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Form every pair `(nums1[i], nums2[j])` and XOR the two values. Collect all `nums1.length * nums2.length` results into a list.\n\nReturn the XOR of everything in that list.",
        [
          { in: "nums1 = [2,1,3], nums2 = [10,2,5,0]", out: "13", note: "Twelve pairings whose XORs cancel down to 13." },
          { in: "nums1 = [1,2], nums2 = [3,4]", out: "0", note: "Both lengths are even, so everything cancels." },
          { in: "nums1 = [7], nums2 = [3,5]", out: "6", note: "7 XOR 3 = 4 and 7 XOR 5 = 2, and 4 XOR 2 = 6." },
        ],
        ["1 <= nums1.length, nums2.length <= 100000", "0 <= values <= 1000000000"]),
      hints: [
        "Building the list is `O(n·m)` and far too slow. Count how many times each element is XOR-ed in.",
        "`nums1[i]` appears in exactly `nums2.length` pairings, and XOR-ing a value an even number of times cancels it.",
        "So `nums1` contributes only when `nums2.length` is odd, and vice versa.",
      ],
      editorial: explain({
        idea: "XOR is its own inverse, so a value that appears an even number of times contributes nothing. Each element of `nums1` appears once per element of `nums2`, which reduces the whole computation to two parity checks.",
        steps: [
          "If `nums2.length` is odd, XOR every element of `nums1` into the answer.",
          "If `nums1.length` is odd, XOR every element of `nums2` into the answer.",
          "Return the accumulated value.",
        ],
        why: "`nums1[i]` occurs in exactly `m = nums2.length` pairings. XOR-ing it `m` times gives `nums1[i]` when `m` is odd and `0` when `m` is even, because `x ^ x = 0`. The same argument applies to `nums2` with `n = nums1.length`.",
        time: "O(n + m)",
        space: "O(1)",
        pitfalls: [
          "Materialising the pairings is `10^10` operations at the stated limits.",
          "Both conditions can hold at once — when both lengths are odd, both arrays contribute.",
          "Neither holding is also fine; the answer is then 0.",
        ],
      }),
      examples: [
        { input: "[2,1,3]\n[10,2,5,0]", expectedOutput: "13" },
        { input: "[1,2]\n[3,4]", expectedOutput: "0" },
        { input: "[7]\n[3,5]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 20 : 1000000000;
        const nums1 = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 0, hi));
        const nums2 = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 0, hi));
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}`, expectedOutput: String(ref(nums1, nums2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef xorAllNums(nums1: List[int], nums2: List[int]) -> int:\n    out = 0\n    if len(nums2) % 2 == 1:\n        for x in nums1:\n            out ^= x\n    if len(nums1) % 2 == 1:\n        for x in nums2:\n            out ^= x\n    return out`,
        javascript: `var xorAllNums = function(nums1, nums2) {\n    var out = 0;\n    if (nums2.length % 2 === 1) {\n        for (var i = 0; i < nums1.length; i++) out ^= nums1[i];\n    }\n    if (nums1.length % 2 === 1) {\n        for (var j = 0; j < nums2.length; j++) out ^= nums2[j];\n    }\n    return out;\n};`,
        typescript: `function xorAllNums(nums1: number[], nums2: number[]): number {\n    var out = 0;\n    if (nums2.length % 2 === 1) {\n        for (var i = 0; i < nums1.length; i++) out ^= nums1[i];\n    }\n    if (nums1.length % 2 === 1) {\n        for (var j = 0; j < nums2.length; j++) out ^= nums2[j];\n    }\n    return out;\n}`,
        java: `public static int xorAllNums(int[] nums1, int[] nums2) {\n    int out = 0;\n    if (nums2.length % 2 == 1) {\n        for (int x : nums1) out ^= x;\n    }\n    if (nums1.length % 2 == 1) {\n        for (int x : nums2) out ^= x;\n    }\n    return out;\n}`,
        cpp: `int xorAllNums(vector<int>& nums1, vector<int>& nums2) {\n    int out = 0;\n    if (nums2.size() % 2 == 1) {\n        for (int x : nums1) out ^= x;\n    }\n    if (nums1.size() % 2 == 1) {\n        for (int x : nums2) out ^= x;\n    }\n    return out;\n}`,
        c: `int xorAllNums(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int out = 0;\n    if (nums2Size % 2 == 1) {\n        for (int i = 0; i < nums1Size; i++) out ^= nums1[i];\n    }\n    if (nums1Size % 2 == 1) {\n        for (int i = 0; i < nums2Size; i++) out ^= nums2[i];\n    }\n    return out;\n}`,
        csharp: `public static int XorAllNums(int[] nums1, int[] nums2)\n{\n    int out_ = 0;\n    if (nums2.Length % 2 == 1)\n    {\n        foreach (int x in nums1) out_ ^= x;\n    }\n    if (nums1.Length % 2 == 1)\n    {\n        foreach (int x in nums2) out_ ^= x;\n    }\n    return out_;\n}`,
        go: `func xorAllNums(nums1 []int, nums2 []int) int {\n\tout := 0\n\tif len(nums2)%2 == 1 {\n\t\tfor _, x := range nums1 {\n\t\t\tout ^= x\n\t\t}\n\t}\n\tif len(nums1)%2 == 1 {\n\t\tfor _, x := range nums2 {\n\t\t\tout ^= x\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun xorAllNums(nums1: IntArray, nums2: IntArray): Int {\n    var out = 0\n    if (nums2.size % 2 == 1) {\n        for (x in nums1) out = out xor x\n    }\n    if (nums1.size % 2 == 1) {\n        for (x in nums2) out = out xor x\n    }\n    return out\n}`,
        swift: `func xorAllNums(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    var out = 0\n    if nums2.count % 2 == 1 {\n        for x in nums1 { out ^= x }\n    }\n    if nums1.count % 2 == 1 {\n        for x in nums2 { out ^= x }\n    }\n    return out\n}`,
        rust: `fn xorAllNums(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    let mut out = 0i32;\n    if nums2.len() % 2 == 1 {\n        for &x in nums1.iter() {\n            out ^= x;\n        }\n    }\n    if nums1.len() % 2 == 1 {\n        for &x in nums2.iter() {\n            out ^= x;\n        }\n    }\n    out\n}`,
        php: `function xorAllNums($nums1, $nums2) {\n    $out = 0;\n    if (count($nums2) % 2 === 1) {\n        foreach ($nums1 as $x) $out ^= $x;\n    }\n    if (count($nums1) % 2 === 1) {\n        foreach ($nums2 as $x) $out ^= $x;\n    }\n    return $out;\n}`,
        ruby: `def xorAllNums(nums1, nums2)\n  out = 0\n  nums1.each { |x| out ^= x } if nums2.length.odd?\n  nums2.each { |x| out ^= x } if nums1.length.odd?\n  out\nend`,
      },
    };
  })(),

  // ── Find The Original Array of Prefix Xor (LC 2433) ─────────────
  (() => {
    const ref = (pref: number[]) => {
      const out = [pref[0]];
      for (let i = 1; i < pref.length; i++) out.push(pref[i] ^ pref[i - 1]);
      return out;
    };
    return {
      slug: "find-the-original-array-of-prefix-xor",
      title: "Find The Original Array of Prefix Xor",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Prefix Sum", "Amazon", "Google", "Adobe"],
      signature: { funcName: "findArray", params: [{ name: "pref", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given `pref`, where `pref[i]` is the XOR of `arr[0] … arr[i]` for some hidden array `arr` of the same length.\n\nReconstruct and return `arr`. The answer is unique.",
        [
          { in: "pref = [5,2,0,3,1]", out: "[5,7,2,3,2]", note: "5 = 5, 5 XOR 7 = 2, 2 XOR 2 = 0, 0 XOR 3 = 3, 3 XOR 2 = 1." },
          { in: "pref = [13]", out: "[13]" },
          { in: "pref = [0,0,0]", out: "[0,0,0]" },
        ],
        ["1 <= pref.length <= 100000", "0 <= pref[i] <= 1000000"]),
      hints: [
        "`pref[i] = pref[i-1] XOR arr[i]` by definition.",
        "XOR is its own inverse, so XOR both sides by `pref[i-1]`.",
        "That gives `arr[i] = pref[i] XOR pref[i-1]`, with `arr[0] = pref[0]`.",
      ],
      editorial: explain({
        idea: "The prefix relation inverts directly because XOR undoes itself: knowing consecutive prefixes recovers the element between them.",
        steps: [
          "Set `arr[0] = pref[0]`.",
          "For each later `i`, set `arr[i] = pref[i] ^ pref[i-1]`.",
        ],
        why: "From `pref[i] = pref[i-1] ^ arr[i]`, XOR-ing both sides by `pref[i-1]` gives `pref[i] ^ pref[i-1] = arr[i]`, since `x ^ x = 0` and `x ^ 0 = x`. The reconstruction is therefore forced, which is why the answer is unique.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Using subtraction instead of XOR — the relation is not additive.",
          "Overwriting `pref` in place is fine only if you read `pref[i-1]` before writing `pref[i]`.",
        ],
      }),
      examples: [
        { input: "[5,2,0,3,1]", expectedOutput: "[5,7,2,3,2]" },
        { input: "[13]", expectedOutput: "[13]" },
        { input: "[0,0,0]", expectedOutput: "[0,0,0]" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 15 : 1000000;
        const pref = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(pref), expectedOutput: fmtIntArr(ref(pref)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findArray(pref: List[int]) -> List[int]:\n    return [pref[0]] + [pref[i] ^ pref[i - 1] for i in range(1, len(pref))]`,
        javascript: `var findArray = function(pref) {\n    var out = [pref[0]];\n    for (var i = 1; i < pref.length; i++) out.push(pref[i] ^ pref[i - 1]);\n    return out;\n};`,
        typescript: `function findArray(pref: number[]): number[] {\n    var out: number[] = [pref[0]];\n    for (var i = 1; i < pref.length; i++) out.push(pref[i] ^ pref[i - 1]);\n    return out;\n}`,
        java: `public static int[] findArray(int[] pref) {\n    int n = pref.length;\n    int[] out = new int[n];\n    out[0] = pref[0];\n    for (int i = 1; i < n; i++) out[i] = pref[i] ^ pref[i - 1];\n    return out;\n}`,
        cpp: `vector<int> findArray(vector<int>& pref) {\n    int n = (int) pref.size();\n    vector<int> out(n);\n    out[0] = pref[0];\n    for (int i = 1; i < n; i++) out[i] = pref[i] ^ pref[i - 1];\n    return out;\n}`,
        c: `int* findArray(int* pref, int prefSize, int* returnSize) {\n    int* out = (int*) malloc((size_t) prefSize * sizeof(int));\n    out[0] = pref[0];\n    for (int i = 1; i < prefSize; i++) out[i] = pref[i] ^ pref[i - 1];\n    *returnSize = prefSize;\n    return out;\n}`,
        csharp: `public static int[] FindArray(int[] pref)\n{\n    int n = pref.Length;\n    int[] out_ = new int[n];\n    out_[0] = pref[0];\n    for (int i = 1; i < n; i++) out_[i] = pref[i] ^ pref[i - 1];\n    return out_;\n}`,
        go: `func findArray(pref []int) []int {\n\tn := len(pref)\n\tout := make([]int, n)\n\tout[0] = pref[0]\n\tfor i := 1; i < n; i++ {\n\t\tout[i] = pref[i] ^ pref[i-1]\n\t}\n\treturn out\n}`,
        kotlin: `fun findArray(pref: IntArray): IntArray {\n    val n = pref.size\n    val out = IntArray(n)\n    out[0] = pref[0]\n    for (i in 1 until n) out[i] = pref[i] xor pref[i - 1]\n    return out\n}`,
        swift: `func findArray(_ pref: [Int]) -> [Int] {\n    var out = [Int](repeating: 0, count: pref.count)\n    out[0] = pref[0]\n    for i in 1..<max(pref.count, 1) where i < pref.count {\n        out[i] = pref[i] ^ pref[i - 1]\n    }\n    return out\n}`,
        rust: `fn findArray(pref: Vec<i32>) -> Vec<i32> {\n    let n = pref.len();\n    let mut out = vec![0i32; n];\n    out[0] = pref[0];\n    for i in 1..n {\n        out[i] = pref[i] ^ pref[i - 1];\n    }\n    out\n}`,
        php: `function findArray($pref) {\n    $out = array($pref[0]);\n    for ($i = 1; $i < count($pref); $i++) $out[] = $pref[$i] ^ $pref[$i - 1];\n    return $out;\n}`,
        ruby: `def findArray(pref)\n  out = [pref[0]]\n  (1...pref.length).each { |i| out << (pref[i] ^ pref[i - 1]) }\n  out\nend`,
      },
    };
  })(),

  // ── Minimum Number of Operations to Make Array XOR Equal to K (LC 2997) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      let x = 0;
      for (const v of nums) x ^= v;
      let diff = x ^ k, count = 0;
      while (diff > 0) { count += diff & 1; diff >>= 1; }
      return count;
    };
    return {
      slug: "minimum-number-of-operations-to-make-array-xor-equal-to-k",
      title: "Minimum Number of Operations to Make Array XOR Equal to K",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "minOperationsXor", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "In one operation you may flip any single bit of any single element of `nums` — including a leading zero bit.\n\nReturn the minimum number of operations after which the XOR of the whole array equals `k`.",
        [
          { in: "nums = [2,1,3,4], k = 1", out: "2", note: "The array XORs to 4; turning that into 1 takes two bit flips." },
          { in: "nums = [2,0,2,0], k = 0", out: "0", note: "The array already XORs to 0." },
          { in: "nums = [7], k = 7", out: "0" },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i] <= 1000000", "0 <= k <= 1000000"]),
      hints: [
        "Flipping bit `b` of any element flips bit `b` of the array's XOR — it does not matter which element you pick.",
        "So the question is only how many bits differ between the current XOR and `k`.",
        "That count is the popcount of `xor ^ k`.",
      ],
      editorial: explain({
        idea: "One bit flip anywhere toggles exactly one bit of the overall XOR, so each differing bit costs exactly one operation and no operation fixes two bits at once.",
        steps: [
          "XOR all of `nums` into a single value `x`.",
          "Compute `x ^ k`, whose set bits are exactly the positions where `x` and `k` disagree.",
          "Return the number of set bits in it.",
        ],
        why: "XOR is bitwise and associative, so flipping bit `b` of some element flips bit `b` of the total and leaves every other bit alone. Reaching `k` therefore requires exactly one flip per differing bit, and that many suffice.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Trying to decide *which* element to modify is wasted effort — any element works.",
          "Counting the bits of `x` or of `k` rather than of their XOR answers a different question.",
        ],
      }),
      examples: [
        { input: "[2,1,3,4]\n1", expectedOutput: "2" },
        { input: "[2,0,2,0]\n0", expectedOutput: "0" },
        { input: "[7]\n7", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 15 : 1000000;
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, hi));
        const k = ri(rng, 0, hi);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minOperationsXor(nums: List[int], k: int) -> int:\n    x = 0\n    for v in nums:\n        x ^= v\n    return bin(x ^ k).count("1")`,
        javascript: `var minOperationsXor = function(nums, k) {\n    var x = 0;\n    for (var i = 0; i < nums.length; i++) x ^= nums[i];\n    var diff = x ^ k, count = 0;\n    while (diff > 0) {\n        count += diff & 1;\n        diff >>= 1;\n    }\n    return count;\n};`,
        typescript: `function minOperationsXor(nums: number[], k: number): number {\n    var x = 0;\n    for (var i = 0; i < nums.length; i++) x ^= nums[i];\n    var diff = x ^ k, count = 0;\n    while (diff > 0) {\n        count += diff & 1;\n        diff >>= 1;\n    }\n    return count;\n}`,
        java: `public static int minOperationsXor(int[] nums, int k) {\n    int x = 0;\n    for (int v : nums) x ^= v;\n    return Integer.bitCount(x ^ k);\n}`,
        cpp: `int minOperationsXor(vector<int>& nums, int k) {\n    int x = 0;\n    for (int v : nums) x ^= v;\n    return __builtin_popcount((unsigned) (x ^ k));\n}`,
        c: `int minOperationsXor(int* nums, int numsSize, int k) {\n    int x = 0;\n    for (int i = 0; i < numsSize; i++) x ^= nums[i];\n    int diff = x ^ k, count = 0;\n    while (diff > 0) {\n        count += diff & 1;\n        diff >>= 1;\n    }\n    return count;\n}`,
        csharp: `public static int MinOperationsXor(int[] nums, int k)\n{\n    int x = 0;\n    foreach (int v in nums) x ^= v;\n    int diff = x ^ k, count = 0;\n    while (diff > 0)\n    {\n        count += diff & 1;\n        diff >>= 1;\n    }\n    return count;\n}`,
        go: `func minOperationsXor(nums []int, k int) int {\n\tx := 0\n\tfor _, v := range nums {\n\t\tx ^= v\n\t}\n\treturn bits.OnesCount(uint(x ^ k))\n}`,
        kotlin: `fun minOperationsXor(nums: IntArray, k: Int): Int {\n    var x = 0\n    for (v in nums) x = x xor v\n    return Integer.bitCount(x xor k)\n}`,
        swift: `func minOperationsXor(_ nums: [Int], _ k: Int) -> Int {\n    var x = 0\n    for v in nums { x ^= v }\n    return (x ^ k).nonzeroBitCount\n}`,
        rust: `fn minOperationsXor(nums: Vec<i32>, k: i32) -> i32 {\n    let mut x = 0i32;\n    for &v in nums.iter() {\n        x ^= v;\n    }\n    ((x ^ k) as u32).count_ones() as i32\n}`,
        php: `function minOperationsXor($nums, $k) {\n    $x = 0;\n    foreach ($nums as $v) $x ^= $v;\n    $diff = $x ^ $k;\n    $count = 0;\n    while ($diff > 0) {\n        $count += $diff & 1;\n        $diff >>= 1;\n    }\n    return $count;\n}`,
        ruby: `def minOperationsXor(nums, k)\n  x = 0\n  nums.each { |v| x ^= v }\n  (x ^ k).to_s(2).count("1")\nend`,
      },
    };
  })(),

  // ── Longest Subarray With Maximum Bitwise AND (LC 2419) ─────────
  (() => {
    const ref = (nums: number[]) => {
      let best = nums[0];
      for (const x of nums) { if (x > best) best = x; }
      let run = 0, longest = 0;
      for (const x of nums) {
        run = x === best ? run + 1 : 0;
        if (run > longest) longest = run;
      }
      return longest;
    };
    return {
      slug: "longest-subarray-with-maximum-bitwise-and",
      title: "Longest Subarray With Maximum Bitwise AND",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Brainteaser", "Amazon", "Google", "Uber"],
      signature: { funcName: "longestSubarrayAnd", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Among all subarrays of `nums`, consider those whose bitwise AND is as large as possible.\n\nReturn the length of the longest such subarray.",
        [
          { in: "nums = [1,2,3,3,2,2]", out: "2", note: "The largest achievable AND is 3, reached only by the run [3,3]." },
          { in: "nums = [1,2,3,4]", out: "1", note: "The maximum AND is 4, from the single element." },
          { in: "nums = [5,5,5]", out: "3" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000"]),
      hints: [
        "ANDing more numbers can never increase the result — each extra operand can only clear bits.",
        "So the largest possible AND is the array's maximum element, achieved by a subarray of equal maxima.",
        "The answer is the longest run of the maximum value.",
      ],
      editorial: explain({
        idea: "Bitwise AND is monotone downward: `a & b <= min(a, b)`. So no subarray can beat the single largest element, and a subarray achieves that value only if every element equals it.",
        steps: [
          "Find the maximum value `m` in `nums`.",
          "Scan for the longest run of consecutive elements equal to `m`.",
          "Return that run length.",
        ],
        why: "For any subarray, its AND is at most its minimum, which is at most the global maximum — so the best achievable value is `m`. A subarray whose AND equals `m` must have every element at least `m` bitwise, and since `m` is the maximum, every element must equal `m` exactly.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Trying to compute ANDs over sliding windows is both slow and unnecessary.",
          "Counting all occurrences of the maximum rather than the longest **consecutive** run overcounts.",
        ],
      }),
      examples: [
        { input: "[1,2,3,3,2,2]", expectedOutput: "2" },
        { input: "[1,2,3,4]", expectedOutput: "1" },
        { input: "[5,5,5]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 5 : 1000000;
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef longestSubarrayAnd(nums: List[int]) -> int:\n    best = max(nums)\n    run = longest = 0\n    for x in nums:\n        run = run + 1 if x == best else 0\n        longest = max(longest, run)\n    return longest`,
        javascript: `var longestSubarrayAnd = function(nums) {\n    var best = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] > best) best = nums[i];\n    }\n    var run = 0, longest = 0;\n    for (var j = 0; j < nums.length; j++) {\n        run = nums[j] === best ? run + 1 : 0;\n        if (run > longest) longest = run;\n    }\n    return longest;\n};`,
        typescript: `function longestSubarrayAnd(nums: number[]): number {\n    var best = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] > best) best = nums[i];\n    }\n    var run = 0, longest = 0;\n    for (var j = 0; j < nums.length; j++) {\n        run = nums[j] === best ? run + 1 : 0;\n        if (run > longest) longest = run;\n    }\n    return longest;\n}`,
        java: `public static int longestSubarrayAnd(int[] nums) {\n    int best = nums[0];\n    for (int x : nums) best = Math.max(best, x);\n    int run = 0, longest = 0;\n    for (int x : nums) {\n        run = x == best ? run + 1 : 0;\n        longest = Math.max(longest, run);\n    }\n    return longest;\n}`,
        cpp: `int longestSubarrayAnd(vector<int>& nums) {\n    int best = *max_element(nums.begin(), nums.end());\n    int run = 0, longest = 0;\n    for (int x : nums) {\n        run = x == best ? run + 1 : 0;\n        longest = max(longest, run);\n    }\n    return longest;\n}`,
        c: `int longestSubarrayAnd(int* nums, int numsSize) {\n    int best = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] > best) best = nums[i];\n    }\n    int run = 0, longest = 0;\n    for (int i = 0; i < numsSize; i++) {\n        run = nums[i] == best ? run + 1 : 0;\n        if (run > longest) longest = run;\n    }\n    return longest;\n}`,
        csharp: `public static int LongestSubarrayAnd(int[] nums)\n{\n    int best = nums.Max();\n    int run = 0, longest = 0;\n    foreach (int x in nums)\n    {\n        run = x == best ? run + 1 : 0;\n        if (run > longest) longest = run;\n    }\n    return longest;\n}`,
        go: `func longestSubarrayAnd(nums []int) int {\n\tbest := nums[0]\n\tfor _, x := range nums {\n\t\tif x > best {\n\t\t\tbest = x\n\t\t}\n\t}\n\trun, longest := 0, 0\n\tfor _, x := range nums {\n\t\tif x == best {\n\t\t\trun++\n\t\t} else {\n\t\t\trun = 0\n\t\t}\n\t\tif run > longest {\n\t\t\tlongest = run\n\t\t}\n\t}\n\treturn longest\n}`,
        kotlin: `fun longestSubarrayAnd(nums: IntArray): Int {\n    val best = nums.max()!!\n    var run = 0\n    var longest = 0\n    for (x in nums) {\n        run = if (x == best) run + 1 else 0\n        if (run > longest) longest = run\n    }\n    return longest\n}`,
        swift: `func longestSubarrayAnd(_ nums: [Int]) -> Int {\n    let best = nums.max()!\n    var run = 0\n    var longest = 0\n    for x in nums {\n        run = x == best ? run + 1 : 0\n        if run > longest { longest = run }\n    }\n    return longest\n}`,
        rust: `fn longestSubarrayAnd(nums: Vec<i32>) -> i32 {\n    let best = *nums.iter().max().unwrap();\n    let mut run = 0i32;\n    let mut longest = 0i32;\n    for &x in nums.iter() {\n        run = if x == best { run + 1 } else { 0 };\n        if run > longest {\n            longest = run;\n        }\n    }\n    longest\n}`,
        php: `function longestSubarrayAnd($nums) {\n    $best = max($nums);\n    $run = 0;\n    $longest = 0;\n    foreach ($nums as $x) {\n        $run = $x === $best ? $run + 1 : 0;\n        if ($run > $longest) $longest = $run;\n    }\n    return $longest;\n}`,
        ruby: `def longestSubarrayAnd(nums)\n  best = nums.max\n  run = 0\n  longest = 0\n  nums.each do |x|\n    run = x == best ? run + 1 : 0\n    longest = run if run > longest\n  end\n  longest\nend`,
      },
    };
  })(),

  // ── Maximum XOR After Operations (LC 2317) ──────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let out = 0;
      for (const x of nums) out |= x;
      return out;
    };
    return {
      slug: "maximum-xor-after-operations",
      title: "Maximum XOR After Operations",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Brainteaser", "Amazon", "Google", "Meta"],
      signature: { funcName: "maximumXOR", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You may repeat this operation any number of times: pick an index `i` and any non-negative `x`, and replace `nums[i]` with `nums[i] AND (nums[i] XOR x)`.\n\nReturn the maximum possible XOR of the whole array afterwards.",
        [
          { in: "nums = [3,2,4,6]", out: "7", note: "Bits 0, 1 and 2 each appear somewhere, and the operations can leave each of them in an odd number of elements — giving 7." },
          { in: "nums = [1,2,3,9,2]", out: "11", note: "The OR of the array is 11." },
          { in: "nums = [8]", out: "8" },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i] <= 100000000"]),
      hints: [
        "Work out what the operation can actually do to a single element.",
        "`nums[i] AND (nums[i] XOR x)` can clear any subset of the bits that `nums[i]` already has — and can never set a new one.",
        "So each bit that appears anywhere can be made to appear an odd number of times, and no other bit can appear at all.",
      ],
      editorial: explain({
        idea: "The operation is exactly 'clear any subset of this element's set bits'. So the reachable XOR values are precisely those whose set bits are a subset of the array's OR — and the OR itself is reachable, so it is the maximum.",
        steps: [
          "Return the bitwise OR of every element.",
        ],
        why: "For a bit `b` set in the OR, some element has it; clear `b` from every other element that has it, leaving exactly one, so the XOR has `b` set. A bit absent from every element can never be created, since the operation only clears. Doing this for all bits simultaneously is consistent because the choices per bit are independent.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Trying to simulate operations is hopeless — the insight is that the operation is a masked clear.",
          "XOR-ing the array gives a value that is usually far below the achievable maximum.",
        ],
      }),
      examples: [
        { input: "[3,2,4,6]", expectedOutput: "7" },
        { input: "[1,2,3,9,2]", expectedOutput: "11" },
        { input: "[8]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 20 : 100000000;
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumXOR(nums: List[int]) -> int:\n    out = 0\n    for x in nums:\n        out |= x\n    return out`,
        javascript: `var maximumXOR = function(nums) {\n    var out = 0;\n    for (var i = 0; i < nums.length; i++) out |= nums[i];\n    return out;\n};`,
        typescript: `function maximumXOR(nums: number[]): number {\n    var out = 0;\n    for (var i = 0; i < nums.length; i++) out |= nums[i];\n    return out;\n}`,
        java: `public static int maximumXOR(int[] nums) {\n    int out = 0;\n    for (int x : nums) out |= x;\n    return out;\n}`,
        cpp: `int maximumXOR(vector<int>& nums) {\n    int out = 0;\n    for (int x : nums) out |= x;\n    return out;\n}`,
        c: `int maximumXOR(int* nums, int numsSize) {\n    int out = 0;\n    for (int i = 0; i < numsSize; i++) out |= nums[i];\n    return out;\n}`,
        csharp: `public static int MaximumXOR(int[] nums)\n{\n    int out_ = 0;\n    foreach (int x in nums) out_ |= x;\n    return out_;\n}`,
        go: `func maximumXOR(nums []int) int {\n\tout := 0\n\tfor _, x := range nums {\n\t\tout |= x\n\t}\n\treturn out\n}`,
        kotlin: `fun maximumXOR(nums: IntArray): Int {\n    var out = 0\n    for (x in nums) out = out or x\n    return out\n}`,
        swift: `func maximumXOR(_ nums: [Int]) -> Int {\n    var out = 0\n    for x in nums { out |= x }\n    return out\n}`,
        rust: `fn maximumXOR(nums: Vec<i32>) -> i32 {\n    let mut out = 0i32;\n    for &x in nums.iter() {\n        out |= x;\n    }\n    out\n}`,
        php: `function maximumXOR($nums) {\n    $out = 0;\n    foreach ($nums as $x) $out |= $x;\n    return $out;\n}`,
        ruby: `def maximumXOR(nums)\n  nums.reduce(0) { |acc, x| acc | x }\nend`,
      },
    };
  })(),

  // ── Find the XOR Beauty of Array (LC 2527) ──────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let out = 0;
      for (const x of nums) out ^= x;
      return out;
    };
    return {
      slug: "find-the-xor-beauty-of-array",
      title: "Find the Xor-Beauty of Array",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Math", "Brainteaser", "Amazon", "Google"],
      signature: { funcName: "xorBeauty", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **effective value** of an ordered triple `(i, j, k)` is `((nums[i] OR nums[j]) AND nums[k])`. Indices may repeat.\n\nThe **xor-beauty** of the array is the XOR of the effective values over all `n³` triples. Return it.",
        [
          { in: "nums = [1,4]", out: "5", note: "The eight triples XOR down to 5, which is also 1 XOR 4." },
          { in: "nums = [15,45,20,2,34,35,5,44,32,30]", out: "34" },
          { in: "nums = [7]", out: "7" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000"]),
      hints: [
        "Work one bit at a time and count how many triples have that bit set in their effective value.",
        "For a fixed bit, let `c` be how many elements have it. The count of triples is `c(2n - c)`… work out its parity.",
        "That parity turns out to match the parity of `c` itself, which means the answer is simply the XOR of the array.",
      ],
      editorial: explain({
        idea: "Count, per bit, how many triples contribute it — then only the parity of that count matters, because XOR cancels in pairs. The parity works out to the parity of the number of elements carrying the bit, so the whole expression collapses to the XOR of the array.",
        steps: [
          "Return the XOR of every element of `nums`.",
        ],
        why: "Fix a bit and let `c` be the number of elements that have it. A triple contributes that bit when `nums[k]` has it and at least one of `nums[i]`, `nums[j]` does — that is `c · (n² - (n - c)²) = c · c · (2n - c)`. Modulo 2 this reduces to `c`, since `c·c ≡ c` and `2n - c ≡ c`. So the bit survives exactly when an odd number of elements carry it, which is the definition of XOR.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Enumerating triples is `10^15` operations at the stated limits.",
          "The result is not the OR — the parity argument is what makes it the XOR.",
        ],
      }),
      examples: [
        { input: "[1,4]", expectedOutput: "5" },
        { input: "[15,45,20,2,34,35,5,44,32,30]", expectedOutput: "34" },
        { input: "[7]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 50 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef xorBeauty(nums: List[int]) -> int:\n    out = 0\n    for x in nums:\n        out ^= x\n    return out`,
        javascript: `var xorBeauty = function(nums) {\n    var out = 0;\n    for (var i = 0; i < nums.length; i++) out ^= nums[i];\n    return out;\n};`,
        typescript: `function xorBeauty(nums: number[]): number {\n    var out = 0;\n    for (var i = 0; i < nums.length; i++) out ^= nums[i];\n    return out;\n}`,
        java: `public static int xorBeauty(int[] nums) {\n    int out = 0;\n    for (int x : nums) out ^= x;\n    return out;\n}`,
        cpp: `int xorBeauty(vector<int>& nums) {\n    int out = 0;\n    for (int x : nums) out ^= x;\n    return out;\n}`,
        c: `int xorBeauty(int* nums, int numsSize) {\n    int out = 0;\n    for (int i = 0; i < numsSize; i++) out ^= nums[i];\n    return out;\n}`,
        csharp: `public static int XorBeauty(int[] nums)\n{\n    int out_ = 0;\n    foreach (int x in nums) out_ ^= x;\n    return out_;\n}`,
        go: `func xorBeauty(nums []int) int {\n\tout := 0\n\tfor _, x := range nums {\n\t\tout ^= x\n\t}\n\treturn out\n}`,
        kotlin: `fun xorBeauty(nums: IntArray): Int {\n    var out = 0\n    for (x in nums) out = out xor x\n    return out\n}`,
        swift: `func xorBeauty(_ nums: [Int]) -> Int {\n    var out = 0\n    for x in nums { out ^= x }\n    return out\n}`,
        rust: `fn xorBeauty(nums: Vec<i32>) -> i32 {\n    let mut out = 0i32;\n    for &x in nums.iter() {\n        out ^= x;\n    }\n    out\n}`,
        php: `function xorBeauty($nums) {\n    $out = 0;\n    foreach ($nums as $x) $out ^= $x;\n    return $out;\n}`,
        ruby: `def xorBeauty(nums)\n  nums.reduce(0) { |acc, x| acc ^ x }\nend`,
      },
    };
  })(),

  // ── Shortest Subarray With OR at Least K I (LC 3095) ────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let best = -1;
      for (let i = 0; i < nums.length; i++) {
        let acc = 0;
        for (let j = i; j < nums.length; j++) {
          acc |= nums[j];
          if (acc >= k) {
            if (best < 0 || j - i + 1 < best) best = j - i + 1;
            break;
          }
        }
      }
      return best;
    };
    return {
      slug: "shortest-subarray-with-or-at-least-k-i",
      title: "Shortest Subarray With OR at Least K I",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Array", "Sliding Window", "Amazon", "Adobe", "Zoho"],
      signature: { funcName: "minimumSubarrayLength", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **special** when the bitwise OR of its elements is at least `k`.\n\nReturn the length of the shortest special subarray, or `-1` if none exists.",
        [
          { in: "nums = [1,2,3], k = 2", out: "1", note: "The single element 2 already reaches 2." },
          { in: "nums = [2,1,8], k = 10", out: "3", note: "Only the whole array ORs to 11." },
          { in: "nums = [1,2], k = 0", out: "1", note: "Any subarray ORs to at least 0." },
        ],
        ["1 <= nums.length <= 50", "0 <= nums[i] < 64", "0 <= k < 64"]),
      hints: [
        "OR only grows as a subarray is extended, so for a fixed start the first index that reaches `k` is the best one.",
        "That makes the double loop with an early `break` exhaustive and cheap.",
        "`k = 0` is satisfied by any single element.",
      ],
      editorial: explain({
        idea: "Bitwise OR is monotone under extension — adding elements can only set more bits. So for each starting index, extend until the running OR reaches `k` and stop; that is the shortest special subarray starting there.",
        steps: [
          "For each start `i`, reset the running OR to 0.",
          "Extend `j` from `i`, OR-ing in `nums[j]`.",
          "The moment the running OR reaches `k`, record `j - i + 1` and break.",
          "Return the smallest length recorded, or `-1`.",
        ],
        why: "Because OR never decreases as the window grows, once a start reaches `k` no longer window from that start can be shorter — so breaking is safe and every candidate minimum is examined.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "Not resetting the accumulator between starts leaks bits from earlier windows.",
          "`k = 0` must return 1, not 0 — the subarray has to be non-empty.",
          "A true sliding window needs per-bit counters, since OR cannot be undone by removing an element.",
        ],
      }),
      examples: [
        { input: "[1,2,3]\n2", expectedOutput: "1" },
        { input: "[2,1,8]\n10", expectedOutput: "3" },
        { input: "[1,2]\n0", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 0, 63));
        const k = ri(rng, 0, 63);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumSubarrayLength(nums: List[int], k: int) -> int:\n    best = -1\n    for i in range(len(nums)):\n        acc = 0\n        for j in range(i, len(nums)):\n            acc |= nums[j]\n            if acc >= k:\n                if best < 0 or j - i + 1 < best:\n                    best = j - i + 1\n                break\n    return best`,
        javascript: `var minimumSubarrayLength = function(nums, k) {\n    var best = -1;\n    for (var i = 0; i < nums.length; i++) {\n        var acc = 0;\n        for (var j = i; j < nums.length; j++) {\n            acc |= nums[j];\n            if (acc >= k) {\n                if (best < 0 || j - i + 1 < best) best = j - i + 1;\n                break;\n            }\n        }\n    }\n    return best;\n};`,
        typescript: `function minimumSubarrayLength(nums: number[], k: number): number {\n    var best = -1;\n    for (var i = 0; i < nums.length; i++) {\n        var acc = 0;\n        for (var j = i; j < nums.length; j++) {\n            acc |= nums[j];\n            if (acc >= k) {\n                if (best < 0 || j - i + 1 < best) best = j - i + 1;\n                break;\n            }\n        }\n    }\n    return best;\n}`,
        java: `public static int minimumSubarrayLength(int[] nums, int k) {\n    int best = -1;\n    for (int i = 0; i < nums.length; i++) {\n        int acc = 0;\n        for (int j = i; j < nums.length; j++) {\n            acc |= nums[j];\n            if (acc >= k) {\n                if (best < 0 || j - i + 1 < best) best = j - i + 1;\n                break;\n            }\n        }\n    }\n    return best;\n}`,
        cpp: `int minimumSubarrayLength(vector<int>& nums, int k) {\n    int best = -1;\n    int n = (int) nums.size();\n    for (int i = 0; i < n; i++) {\n        int acc = 0;\n        for (int j = i; j < n; j++) {\n            acc |= nums[j];\n            if (acc >= k) {\n                if (best < 0 || j - i + 1 < best) best = j - i + 1;\n                break;\n            }\n        }\n    }\n    return best;\n}`,
        c: `int minimumSubarrayLength(int* nums, int numsSize, int k) {\n    int best = -1;\n    for (int i = 0; i < numsSize; i++) {\n        int acc = 0;\n        for (int j = i; j < numsSize; j++) {\n            acc |= nums[j];\n            if (acc >= k) {\n                if (best < 0 || j - i + 1 < best) best = j - i + 1;\n                break;\n            }\n        }\n    }\n    return best;\n}`,
        csharp: `public static int MinimumSubarrayLength(int[] nums, int k)\n{\n    int best = -1;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        int acc = 0;\n        for (int j = i; j < nums.Length; j++)\n        {\n            acc |= nums[j];\n            if (acc >= k)\n            {\n                if (best < 0 || j - i + 1 < best) best = j - i + 1;\n                break;\n            }\n        }\n    }\n    return best;\n}`,
        go: `func minimumSubarrayLength(nums []int, k int) int {\n\tbest := -1\n\tfor i := 0; i < len(nums); i++ {\n\t\tacc := 0\n\t\tfor j := i; j < len(nums); j++ {\n\t\t\tacc |= nums[j]\n\t\t\tif acc >= k {\n\t\t\t\tif best < 0 || j-i+1 < best {\n\t\t\t\t\tbest = j - i + 1\n\t\t\t\t}\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minimumSubarrayLength(nums: IntArray, k: Int): Int {\n    var best = -1\n    for (i in nums.indices) {\n        var acc = 0\n        for (j in i until nums.size) {\n            acc = acc or nums[j]\n            if (acc >= k) {\n                if (best < 0 || j - i + 1 < best) best = j - i + 1\n                break\n            }\n        }\n    }\n    return best\n}`,
        swift: `func minimumSubarrayLength(_ nums: [Int], _ k: Int) -> Int {\n    var best = -1\n    for i in 0..<nums.count {\n        var acc = 0\n        for j in i..<nums.count {\n            acc |= nums[j]\n            if acc >= k {\n                if best < 0 || j - i + 1 < best { best = j - i + 1 }\n                break\n            }\n        }\n    }\n    return best\n}`,
        rust: `fn minimumSubarrayLength(nums: Vec<i32>, k: i32) -> i32 {\n    let mut best = -1i32;\n    for i in 0..nums.len() {\n        let mut acc = 0i32;\n        for j in i..nums.len() {\n            acc |= nums[j];\n            if acc >= k {\n                let len = (j + 1 - i) as i32;\n                if best < 0 || len < best {\n                    best = len;\n                }\n                break;\n            }\n        }\n    }\n    best\n}`,
        php: `function minimumSubarrayLength($nums, $k) {\n    $best = -1;\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        $acc = 0;\n        for ($j = $i; $j < $n; $j++) {\n            $acc |= $nums[$j];\n            if ($acc >= $k) {\n                if ($best < 0 || $j - $i + 1 < $best) $best = $j - $i + 1;\n                break;\n            }\n        }\n    }\n    return $best;\n}`,
        ruby: `def minimumSubarrayLength(nums, k)\n  best = -1\n  (0...nums.length).each do |i|\n    acc = 0\n    (i...nums.length).each do |j|\n      acc |= nums[j]\n      if acc >= k\n        best = j - i + 1 if best < 0 || j - i + 1 < best\n        break\n      end\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Smallest Number With All Set Bits (LC 3370) ─────────────────
  (() => {
    const ref = (n: number) => {
      let v = 1;
      while (v < n) v = v * 2 + 1;
      return v;
    };
    return {
      slug: "smallest-number-with-all-set-bits",
      title: "Smallest Number With All Set Bits",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Math", "TCS", "Capgemini", "Amazon"],
      signature: { funcName: "smallestNumber", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Return the smallest number `x` that is at least `n` and whose binary representation is **all ones** — that is, `x` is `1`, `3`, `7`, `15`, `31`, and so on.",
        [
          { in: "n = 5", out: "7", note: "7 is 111 in binary and is the smallest all-ones value at or above 5." },
          { in: "n = 10", out: "15" },
          { in: "n = 3", out: "3", note: "3 is already all ones." },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "The all-ones numbers are exactly `2^k - 1`.",
        "Start at 1 and repeatedly append a one bit — `v = 2v + 1` — until you reach or pass `n`.",
        "No search is needed; there are only about ten such values in range.",
      ],
      editorial: explain({
        idea: "All-ones numbers form the sequence `1, 3, 7, 15, …`, each obtained from the previous by appending a one bit. Walk the sequence until it reaches `n`.",
        steps: [
          "Start `v` at 1.",
          "While `v < n`, replace `v` with `2v + 1`.",
          "Return `v`.",
        ],
        why: "`2v + 1` shifts the binary form left and sets the new low bit, so the sequence enumerates `2^k - 1` in increasing order. The first term at or above `n` is therefore the smallest such value.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Starting at 0 never escapes — `2 * 0 + 1 = 1` works, but `v = 0` with `v *= 2` would not.",
          "Rounding `n` up to a power of two gives `8` for `n = 5`, which is not all ones.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "7" },
        { input: "10", expectedOutput: "15" },
        { input: "3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def smallestNumber(n: int) -> int:\n    v = 1\n    while v < n:\n        v = v * 2 + 1\n    return v`,
        javascript: `var smallestNumber = function(n) {\n    var v = 1;\n    while (v < n) v = v * 2 + 1;\n    return v;\n};`,
        typescript: `function smallestNumber(n: number): number {\n    var v = 1;\n    while (v < n) v = v * 2 + 1;\n    return v;\n}`,
        java: `public static int smallestNumber(int n) {\n    int v = 1;\n    while (v < n) v = v * 2 + 1;\n    return v;\n}`,
        cpp: `int smallestNumber(int n) {\n    int v = 1;\n    while (v < n) v = v * 2 + 1;\n    return v;\n}`,
        c: `int smallestNumber(int n) {\n    int v = 1;\n    while (v < n) v = v * 2 + 1;\n    return v;\n}`,
        csharp: `public static int SmallestNumber(int n)\n{\n    int v = 1;\n    while (v < n) v = v * 2 + 1;\n    return v;\n}`,
        go: `func smallestNumber(n int) int {\n\tv := 1\n\tfor v < n {\n\t\tv = v*2 + 1\n\t}\n\treturn v\n}`,
        kotlin: `fun smallestNumber(n: Int): Int {\n    var v = 1\n    while (v < n) v = v * 2 + 1\n    return v\n}`,
        swift: `func smallestNumber(_ n: Int) -> Int {\n    var v = 1\n    while v < n { v = v * 2 + 1 }\n    return v\n}`,
        rust: `fn smallestNumber(n: i32) -> i32 {\n    let mut v = 1;\n    while v < n {\n        v = v * 2 + 1;\n    }\n    v\n}`,
        php: `function smallestNumber($n) {\n    $v = 1;\n    while ($v < $n) $v = $v * 2 + 1;\n    return $v;\n}`,
        ruby: `def smallestNumber(n)\n  v = 1\n  v = v * 2 + 1 while v < n\n  v\nend`,
      },
    };
  })(),

  // ── Binary Watch (LC 401) ───────────────────────────────────────
  (() => {
    const bits = (x: number) => { let c = 0; while (x > 0) { c += x & 1; x >>= 1; } return c; };
    const ref = (turnedOn: number) => {
      const out: string[] = [];
      for (let h = 0; h < 12; h++) {
        for (let m = 0; m < 60; m++) {
          if (bits(h) + bits(m) === turnedOn) out.push(String(h) + ":" + (m < 10 ? "0" + String(m) : String(m)));
        }
      }
      return out;
    };
    return {
      slug: "binary-watch",
      title: "Binary Watch",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Backtracking", "Enumeration", "Amazon", "Adobe", "Oracle"],
      signature: { funcName: "readBinaryWatch", params: [{ name: "turnedOn", type: "int" as const }], returns: "string[]" as const },
      description: describe(
        "A binary watch shows the hour with 4 LEDs (values 1, 2, 4, 8) and the minute with 6 LEDs (values 1, 2, 4, 8, 16, 32). Hours run from `0` to `11` and minutes from `0` to `59`.\n\nGiven the number of LEDs that are lit, return every time the watch could be showing, formatted as `\"H:MM\"` — the hour without a leading zero and the minute always two digits.\n\nList the times in increasing order of hour, then of minute.",
        [
          { in: "turnedOn = 1", out: '["0:01","0:02","0:04","0:08","0:16","0:32","1:00","2:00","4:00","8:00"]', note: "Exactly one LED is lit, so either one minute bit or one hour bit." },
          { in: "turnedOn = 9", out: "[]", note: "No valid time lights nine LEDs." },
          { in: "turnedOn = 0", out: '["0:00"]' },
        ],
        ["0 <= turnedOn <= 10"]),
      hints: [
        "There are only 12 × 60 = 720 possible times — just try them all.",
        "For each, count the set bits of the hour and the minute and compare with `turnedOn`.",
        "The minute needs zero padding to two digits; the hour does not.",
      ],
      editorial: explain({
        idea: "The search space is tiny, so enumerate every legal time and keep the ones whose total popcount matches.",
        steps: [
          "Loop `h` from 0 to 11 and `m` from 0 to 59.",
          "If `popcount(h) + popcount(m) == turnedOn`, format the time and collect it.",
          "The nested loop order already yields hour-then-minute ordering.",
        ],
        why: "Every reachable display corresponds to exactly one `(h, m)` pair, and the lit LEDs are exactly the set bits of the two numbers — so the popcount sum is the number of lit LEDs.",
        time: "O(720)",
        space: "O(output)",
        pitfalls: [
          "Forgetting to zero-pad the minute produces `\"1:0\"` instead of `\"1:00\"`.",
          "Padding the hour as well produces `\"01:00\"`, which the format does not use.",
          "Enumerating LED subsets instead of times is more work and risks duplicates.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: '["0:01","0:02","0:04","0:08","0:16","0:32","1:00","2:00","4:00","8:00"]' },
        { input: "9", expectedOutput: "[]" },
        { input: "0", expectedOutput: '["0:00"]' },
      ],
      gen: (rng: Rng) => {
        const turnedOn = ri(rng, 0, 10);
        return { input: String(turnedOn), expectedOutput: fmtStrArr(ref(turnedOn)) };
      },
      solutions: {
        python: `from typing import List\n\ndef readBinaryWatch(turnedOn: int) -> List[str]:\n    out = []\n    for h in range(12):\n        for m in range(60):\n            if bin(h).count("1") + bin(m).count("1") == turnedOn:\n                out.append("{}:{:02d}".format(h, m))\n    return out`,
        javascript: `var readBinaryWatch = function(turnedOn) {\n    var bits = function(x) {\n        var c = 0;\n        while (x > 0) { c += x & 1; x >>= 1; }\n        return c;\n    };\n    var out = [];\n    for (var h = 0; h < 12; h++) {\n        for (var m = 0; m < 60; m++) {\n            if (bits(h) + bits(m) === turnedOn) {\n                out.push(String(h) + ":" + (m < 10 ? "0" + String(m) : String(m)));\n            }\n        }\n    }\n    return out;\n};`,
        typescript: `function readBinaryWatch(turnedOn: number): string[] {\n    var bits = function(x: number): number {\n        var c = 0;\n        while (x > 0) { c += x & 1; x >>= 1; }\n        return c;\n    };\n    var out: string[] = [];\n    for (var h = 0; h < 12; h++) {\n        for (var m = 0; m < 60; m++) {\n            if (bits(h) + bits(m) === turnedOn) {\n                out.push(String(h) + ":" + (m < 10 ? "0" + String(m) : String(m)));\n            }\n        }\n    }\n    return out;\n}`,
        java: `public static String[] readBinaryWatch(int turnedOn) {\n    List<String> out = new ArrayList<>();\n    for (int h = 0; h < 12; h++) {\n        for (int m = 0; m < 60; m++) {\n            if (Integer.bitCount(h) + Integer.bitCount(m) == turnedOn) {\n                out.add(h + ":" + (m < 10 ? "0" + m : String.valueOf(m)));\n            }\n        }\n    }\n    return out.toArray(new String[0]);\n}`,
        cpp: `vector<string> readBinaryWatch(int turnedOn) {\n    vector<string> out;\n    for (int h = 0; h < 12; h++) {\n        for (int m = 0; m < 60; m++) {\n            if (__builtin_popcount((unsigned) h) + __builtin_popcount((unsigned) m) == turnedOn) {\n                string mm = to_string(m);\n                if (m < 10) mm = "0" + mm;\n                out.push_back(to_string(h) + ":" + mm);\n            }\n        }\n    }\n    return out;\n}`,
        c: `static int bitsWatch(int x) {\n    int c = 0;\n    while (x > 0) { c += x & 1; x >>= 1; }\n    return c;\n}\n\nchar** readBinaryWatch(int turnedOn, int* returnSize) {\n    char** out = (char**) malloc(720 * sizeof(char*));\n    int m2 = 0;\n    for (int h = 0; h < 12; h++) {\n        for (int m = 0; m < 60; m++) {\n            if (bitsWatch(h) + bitsWatch(m) == turnedOn) {\n                char* s = (char*) malloc(8);\n                sprintf(s, "%d:%02d", h, m);\n                out[m2++] = s;\n            }\n        }\n    }\n    *returnSize = m2;\n    return out;\n}`,
        csharp: `public static string[] ReadBinaryWatch(int turnedOn)\n{\n    var out_ = new List<string>();\n    for (int h = 0; h < 12; h++)\n    {\n        for (int m = 0; m < 60; m++)\n        {\n            int c = 0;\n            int a = h;\n            while (a > 0) { c += a & 1; a >>= 1; }\n            int b = m;\n            while (b > 0) { c += b & 1; b >>= 1; }\n            if (c == turnedOn) out_.Add(h + ":" + m.ToString("00"));\n        }\n    }\n    return out_.ToArray();\n}`,
        go: `func readBinaryWatch(turnedOn int) []string {\n\tout := []string{}\n\tfor h := 0; h < 12; h++ {\n\t\tfor m := 0; m < 60; m++ {\n\t\t\tif bits.OnesCount(uint(h))+bits.OnesCount(uint(m)) == turnedOn {\n\t\t\t\tout = append(out, fmt.Sprintf("%d:%02d", h, m))\n\t\t\t}\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun readBinaryWatch(turnedOn: Int): Array<String> {\n    val out = ArrayList<String>()\n    for (h in 0 until 12) {\n        for (m in 0 until 60) {\n            if (Integer.bitCount(h) + Integer.bitCount(m) == turnedOn) {\n                val mm = if (m < 10) "0" + m else m.toString()\n                out.add("" + h + ":" + mm)\n            }\n        }\n    }\n    return out.toTypedArray()\n}`,
        swift: `func readBinaryWatch(_ turnedOn: Int) -> [String] {\n    var out: [String] = []\n    for h in 0..<12 {\n        for m in 0..<60 {\n            if h.nonzeroBitCount + m.nonzeroBitCount == turnedOn {\n                let mm = m < 10 ? "0\\(m)" : "\\(m)"\n                out.append("\\(h):" + mm)\n            }\n        }\n    }\n    return out\n}`,
        rust: `fn readBinaryWatch(turnedOn: i32) -> Vec<String> {\n    let mut out: Vec<String> = Vec::new();\n    for h in 0..12u32 {\n        for m in 0..60u32 {\n            if (h.count_ones() + m.count_ones()) as i32 == turnedOn {\n                out.push(format!("{}:{:02}", h, m));\n            }\n        }\n    }\n    out\n}`,
        php: `function readBinaryWatch($turnedOn) {\n    $bits = function($x) {\n        $c = 0;\n        while ($x > 0) { $c += $x & 1; $x >>= 1; }\n        return $c;\n    };\n    $out = array();\n    for ($h = 0; $h < 12; $h++) {\n        for ($m = 0; $m < 60; $m++) {\n            if ($bits($h) + $bits($m) === $turnedOn) {\n                $out[] = $h . ":" . str_pad(strval($m), 2, "0", STR_PAD_LEFT);\n            }\n        }\n    }\n    return $out;\n}`,
        ruby: `def readBinaryWatch(turnedOn)\n  out = []\n  (0...12).each do |h|\n    (0...60).each do |m|\n      if h.to_s(2).count("1") + m.to_s(2).count("1") == turnedOn\n        out << format("%d:%02d", h, m)\n      end\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Flip String to Monotone Increasing (LC 926) ─────────────────
  (() => {
    const ref = (s: string) => {
      let ones = 0, flips = 0;
      for (let i = 0; i < s.length; i++) {
        if (s.charAt(i) === "1") ones++;
        else { flips = Math.min(flips + 1, ones); }
      }
      return flips;
    };
    return {
      slug: "flip-string-to-monotone-increasing",
      title: "Flip String to Monotone Increasing",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Bit Manipulation", "Amazon", "Google", "Meta"],
      signature: { funcName: "minFlipsMonoIncr", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A binary string is **monotone increasing** when it consists of some number of `0`s followed by some number of `1`s — either part may be empty.\n\nOne flip changes a `0` to a `1` or a `1` to a `0`. Return the minimum number of flips that makes `s` monotone increasing.",
        [
          { in: 's = "00110"', out: "1", note: "Flipping the last 0 to a 1 gives \"00111\"." },
          { in: 's = "010110"', out: "2", note: '"011111" or "000111" both take two flips.' },
          { in: 's = "00011000"', out: "2", note: 'Flipping the two 1s gives "00000000".' },
        ],
        ["1 <= s.length <= 100000", "s[i] is '0' or '1'."]),
      hints: [
        "Sweep left to right and keep two numbers: how many `1`s you have seen, and the best cost so far.",
        "At a `0` you either flip it to a `1` (cost `flips + 1`) or flip every `1` before it to a `0` (cost `ones`).",
        "Take the smaller of those two.",
      ],
      editorial: explain({
        idea: "Scan once. At each `0`, the prefix must end either in `1`s — meaning this `0` gets flipped — or in `0`s, meaning all earlier `1`s get flipped. Keeping both running quantities makes the decision local.",
        steps: [
          "Track `ones`, the number of `1`s seen so far, and `flips`, the minimum cost for the prefix.",
          "On a `1`, increment `ones` and leave `flips` alone — a trailing `1` is always free.",
          "On a `0`, set `flips = min(flips + 1, ones)`.",
          "Return `flips`.",
        ],
        why: "`flips + 1` is the cost of keeping the prefix's shape and flipping this `0` up; `ones` is the cost of making the whole prefix `0`s. Every monotone target is one of these two shapes at each position, so the minimum of the two is the optimum for that prefix.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting the `1`s before each `0` separately is `O(n²)`.",
          "Incrementing `flips` on a `1` is wrong — a `1` never needs flipping if everything after it is a `1`.",
          "Both parts of the result may be empty, so an all-`0` or all-`1` string costs nothing.",
        ],
      }),
      examples: [
        { input: '"00110"', expectedOutput: "1" },
        { input: '"010110"', expectedOutput: "2" },
        { input: '"00011000"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const p = pick(rng, [0.3, 0.5, 0.7]);
        const s = Array.from({ length: n }, () => (rng() < p ? "1" : "0")).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minFlipsMonoIncr(s: str) -> int:\n    ones = flips = 0\n    for c in s:\n        if c == "1":\n            ones += 1\n        else:\n            flips = min(flips + 1, ones)\n    return flips`,
        javascript: `var minFlipsMonoIncr = function(s) {\n    var ones = 0, flips = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "1") ones++;\n        else flips = Math.min(flips + 1, ones);\n    }\n    return flips;\n};`,
        typescript: `function minFlipsMonoIncr(s: string): number {\n    var ones = 0, flips = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "1") ones++;\n        else flips = Math.min(flips + 1, ones);\n    }\n    return flips;\n}`,
        java: `public static int minFlipsMonoIncr(String s) {\n    int ones = 0, flips = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '1') ones++;\n        else flips = Math.min(flips + 1, ones);\n    }\n    return flips;\n}`,
        cpp: `int minFlipsMonoIncr(string s) {\n    int ones = 0, flips = 0;\n    for (char c : s) {\n        if (c == '1') ones++;\n        else flips = min(flips + 1, ones);\n    }\n    return flips;\n}`,
        c: `int minFlipsMonoIncr(char* s) {\n    int ones = 0, flips = 0;\n    for (int i = 0; s[i]; i++) {\n        if (s[i] == '1') ones++;\n        else {\n            int cand = flips + 1;\n            flips = cand < ones ? cand : ones;\n        }\n    }\n    return flips;\n}`,
        csharp: `public static int MinFlipsMonoIncr(string s)\n{\n    int ones = 0, flips = 0;\n    foreach (char c in s)\n    {\n        if (c == '1') ones++;\n        else flips = Math.Min(flips + 1, ones);\n    }\n    return flips;\n}`,
        go: `func minFlipsMonoIncr(s string) int {\n\tones, flips := 0, 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == \'1\' {\n\t\t\tones++\n\t\t} else {\n\t\t\tif flips+1 < ones {\n\t\t\t\tflips = flips + 1\n\t\t\t} else {\n\t\t\t\tflips = ones\n\t\t\t}\n\t\t}\n\t}\n\treturn flips\n}`,
        kotlin: `fun minFlipsMonoIncr(s: String): Int {\n    var ones = 0\n    var flips = 0\n    for (c in s) {\n        if (c == \'1\') ones++\n        else flips = minOf(flips + 1, ones)\n    }\n    return flips\n}`,
        swift: `func minFlipsMonoIncr(_ s: String) -> Int {\n    var ones = 0\n    var flips = 0\n    for c in s {\n        if c == "1" { ones += 1 }\n        else { flips = min(flips + 1, ones) }\n    }\n    return flips\n}`,
        rust: `fn minFlipsMonoIncr(s: String) -> i32 {\n    let mut ones = 0i32;\n    let mut flips = 0i32;\n    for &c in s.as_bytes() {\n        if c == b\'1\' {\n            ones += 1;\n        } else {\n            flips = (flips + 1).min(ones);\n        }\n    }\n    flips\n}`,
        php: `function minFlipsMonoIncr($s) {\n    $ones = 0;\n    $flips = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === "1") $ones++;\n        else $flips = min($flips + 1, $ones);\n    }\n    return $flips;\n}`,
        ruby: `def minFlipsMonoIncr(s)\n  ones = 0\n  flips = 0\n  s.each_char do |c|\n    if c == "1"\n      ones += 1\n    else\n      flips = [flips + 1, ones].min\n    end\n  end\n  flips\nend`,
      },
    };
  })(),

  // ── Minimize XOR (LC 2429) ──────────────────────────────────────
  (() => {
    const ref = (num1: number, num2: number) => {
      let need = 0, t = num2;
      while (t > 0) { need += t & 1; t >>= 1; }
      let x = 0;
      for (let b = 30; b >= 0 && need > 0; b--) {
        if ((num1 >> b) & 1) { x |= 1 << b; need--; }
      }
      for (let b = 0; b <= 30 && need > 0; b++) {
        if (((x >> b) & 1) === 0) { x |= 1 << b; need--; }
      }
      return x;
    };
    return {
      slug: "minimize-xor",
      title: "Minimize XOR",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Greedy", "Amazon", "Google", "Samsung"],
      signature: { funcName: "minimizeXor", params: [{ name: "num1", type: "int" as const }, { name: "num2", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Return the integer `x` such that `x` has the **same number of set bits** as `num2` and `x XOR num1` is as small as possible.\n\nThe answer is unique.",
        [
          { in: "num1 = 3, num2 = 5", out: "3", note: "5 has two set bits, and 3 also has two — making the XOR zero." },
          { in: "num1 = 1, num2 = 12", out: "3", note: "12 has two set bits; 3 keeps num1's bit 0 and adds the cheapest extra bit." },
          { in: "num1 = 25, num2 = 72", out: "24", note: "72 has two set bits, and 24 shares num1's two highest bits." },
        ],
        ["1 <= num1, num2 <= 1000000000"]),
      hints: [
        "XOR is smallest when `x` agrees with `num1` on the highest bits.",
        "So spend the budget of set bits on `num1`'s bits from the top down.",
        "If bits are left over, add them at the lowest free positions, where they cost the least.",
      ],
      editorial: explain({
        idea: "Two greedy passes. First reuse `num1`'s set bits from the most significant downward, because matching a high bit removes the largest possible contribution to the XOR. Then, if the budget is not exhausted, set the lowest free bits, which add the smallest possible contribution.",
        steps: [
          "Count the set bits of `num2`; call it `need`.",
          "Walk `b` from 30 down to 0: if `num1` has bit `b` and `need > 0`, set it in `x` and decrement `need`.",
          "Walk `b` from 0 upward: if `x` does not yet have bit `b` and `need > 0`, set it and decrement `need`.",
          "Return `x`.",
        ],
        why: "Matching `num1`'s bit `b` saves `2^b` from the XOR, so the savings are maximised by taking the highest matches first. Any bit set where `num1` has none adds `2^b`, so those should be as low as possible. The two passes never conflict because the second only considers positions the first left clear.",
        time: "O(31)",
        space: "O(1)",
        pitfalls: [
          "Running out of budget mid-way is expected — the loops must stop when `need` hits zero.",
          "Setting leftover bits from the top down maximises the XOR instead of minimising it.",
          "`num2`'s value beyond its popcount is irrelevant; only the count matters.",
        ],
      }),
      examples: [
        { input: "3\n5", expectedOutput: "3" },
        { input: "1\n12", expectedOutput: "3" },
        { input: "25\n72", expectedOutput: "24" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 60 : 1000000000;
        const num1 = ri(rng, 1, hi);
        const num2 = ri(rng, 1, hi);
        return { input: `${num1}\n${num2}`, expectedOutput: String(ref(num1, num2)) };
      },
      solutions: {
        python: `def minimizeXor(num1: int, num2: int) -> int:\n    need = bin(num2).count("1")\n    x = 0\n    for b in range(30, -1, -1):\n        if need == 0:\n            break\n        if (num1 >> b) & 1:\n            x |= 1 << b\n            need -= 1\n    for b in range(31):\n        if need == 0:\n            break\n        if not ((x >> b) & 1):\n            x |= 1 << b\n            need -= 1\n    return x`,
        javascript: `var minimizeXor = function(num1, num2) {\n    var need = 0, t = num2;\n    while (t > 0) { need += t & 1; t >>= 1; }\n    var x = 0;\n    for (var b = 30; b >= 0 && need > 0; b--) {\n        if ((num1 >> b) & 1) { x |= 1 << b; need--; }\n    }\n    for (var c = 0; c <= 30 && need > 0; c++) {\n        if (((x >> c) & 1) === 0) { x |= 1 << c; need--; }\n    }\n    return x;\n};`,
        typescript: `function minimizeXor(num1: number, num2: number): number {\n    var need = 0, t = num2;\n    while (t > 0) { need += t & 1; t >>= 1; }\n    var x = 0;\n    for (var b = 30; b >= 0 && need > 0; b--) {\n        if ((num1 >> b) & 1) { x |= 1 << b; need--; }\n    }\n    for (var c = 0; c <= 30 && need > 0; c++) {\n        if (((x >> c) & 1) === 0) { x |= 1 << c; need--; }\n    }\n    return x;\n}`,
        java: `public static int minimizeXor(int num1, int num2) {\n    int need = Integer.bitCount(num2);\n    int x = 0;\n    for (int b = 30; b >= 0 && need > 0; b--) {\n        if (((num1 >> b) & 1) == 1) { x |= 1 << b; need--; }\n    }\n    for (int b = 0; b <= 30 && need > 0; b++) {\n        if (((x >> b) & 1) == 0) { x |= 1 << b; need--; }\n    }\n    return x;\n}`,
        cpp: `int minimizeXor(int num1, int num2) {\n    int need = __builtin_popcount((unsigned) num2);\n    int x = 0;\n    for (int b = 30; b >= 0 && need > 0; b--) {\n        if ((num1 >> b) & 1) { x |= 1 << b; need--; }\n    }\n    for (int b = 0; b <= 30 && need > 0; b++) {\n        if (!((x >> b) & 1)) { x |= 1 << b; need--; }\n    }\n    return x;\n}`,
        c: `int minimizeXor(int num1, int num2) {\n    int need = 0, t = num2;\n    while (t > 0) { need += t & 1; t >>= 1; }\n    int x = 0;\n    for (int b = 30; b >= 0 && need > 0; b--) {\n        if ((num1 >> b) & 1) { x |= 1 << b; need--; }\n    }\n    for (int b = 0; b <= 30 && need > 0; b++) {\n        if (!((x >> b) & 1)) { x |= 1 << b; need--; }\n    }\n    return x;\n}`,
        csharp: `public static int MinimizeXor(int num1, int num2)\n{\n    int need = 0, t = num2;\n    while (t > 0) { need += t & 1; t >>= 1; }\n    int x = 0;\n    for (int b = 30; b >= 0 && need > 0; b--)\n    {\n        if (((num1 >> b) & 1) == 1) { x |= 1 << b; need--; }\n    }\n    for (int b = 0; b <= 30 && need > 0; b++)\n    {\n        if (((x >> b) & 1) == 0) { x |= 1 << b; need--; }\n    }\n    return x;\n}`,
        go: `func minimizeXor(num1 int, num2 int) int {\n\tneed := bits.OnesCount(uint(num2))\n\tx := 0\n\tfor b := 30; b >= 0 && need > 0; b-- {\n\t\tif (num1>>uint(b))&1 == 1 {\n\t\t\tx |= 1 << uint(b)\n\t\t\tneed--\n\t\t}\n\t}\n\tfor b := 0; b <= 30 && need > 0; b++ {\n\t\tif (x>>uint(b))&1 == 0 {\n\t\t\tx |= 1 << uint(b)\n\t\t\tneed--\n\t\t}\n\t}\n\treturn x\n}`,
        kotlin: `fun minimizeXor(num1: Int, num2: Int): Int {\n    var need = Integer.bitCount(num2)\n    var x = 0\n    var b = 30\n    while (b >= 0 && need > 0) {\n        if ((num1 shr b) and 1 == 1) {\n            x = x or (1 shl b)\n            need--\n        }\n        b--\n    }\n    var c = 0\n    while (c <= 30 && need > 0) {\n        if ((x shr c) and 1 == 0) {\n            x = x or (1 shl c)\n            need--\n        }\n        c++\n    }\n    return x\n}`,
        swift: `func minimizeXor(_ num1: Int, _ num2: Int) -> Int {\n    var need = num2.nonzeroBitCount\n    var x = 0\n    var b = 30\n    while b >= 0 && need > 0 {\n        if (num1 >> b) & 1 == 1 {\n            x |= 1 << b\n            need -= 1\n        }\n        b -= 1\n    }\n    var c = 0\n    while c <= 30 && need > 0 {\n        if (x >> c) & 1 == 0 {\n            x |= 1 << c\n            need -= 1\n        }\n        c += 1\n    }\n    return x\n}`,
        rust: `fn minimizeXor(num1: i32, num2: i32) -> i32 {\n    let mut need = (num2 as u32).count_ones() as i32;\n    let mut x = 0i32;\n    let mut b = 30i32;\n    while b >= 0 && need > 0 {\n        if (num1 >> b) & 1 == 1 {\n            x |= 1 << b;\n            need -= 1;\n        }\n        b -= 1;\n    }\n    let mut c = 0i32;\n    while c <= 30 && need > 0 {\n        if (x >> c) & 1 == 0 {\n            x |= 1 << c;\n            need -= 1;\n        }\n        c += 1;\n    }\n    x\n}`,
        php: `function minimizeXor($num1, $num2) {\n    $need = 0;\n    $t = $num2;\n    while ($t > 0) { $need += $t & 1; $t >>= 1; }\n    $x = 0;\n    for ($b = 30; $b >= 0 && $need > 0; $b--) {\n        if (($num1 >> $b) & 1) { $x |= 1 << $b; $need--; }\n    }\n    for ($c = 0; $c <= 30 && $need > 0; $c++) {\n        if ((($x >> $c) & 1) === 0) { $x |= 1 << $c; $need--; }\n    }\n    return $x;\n}`,
        ruby: `def minimizeXor(num1, num2)\n  need = num2.to_s(2).count("1")\n  x = 0\n  b = 30\n  while b >= 0 && need > 0\n    if (num1 >> b) & 1 == 1\n      x |= 1 << b\n      need -= 1\n    end\n    b -= 1\n  end\n  c = 0\n  while c <= 30 && need > 0\n    if (x >> c) & 1 == 0\n      x |= 1 << c\n      need -= 1\n    end\n    c += 1\n  end\n  x\nend`,
      },
    };
  })(),

  // ── Decode XORed Permutation (LC 1734) ──────────────────────────
  (() => {
    const ref = (encoded: number[]) => {
      const n = encoded.length + 1;
      let total = 0;
      for (let v = 1; v <= n; v++) total ^= v;
      let odd = 0;
      for (let i = 1; i < encoded.length; i += 2) odd ^= encoded[i];
      const perm = [total ^ odd];
      for (let i = 0; i < encoded.length; i++) perm.push(perm[i] ^ encoded[i]);
      return perm;
    };
    return {
      slug: "decode-xored-permutation",
      title: "Decode XORed Permutation",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Brainteaser", "Amazon", "Google", "Uber"],
      signature: { funcName: "decodePermutation", params: [{ name: "encoded", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "A hidden array `perm` is a permutation of the first `n` positive integers, where `n` is **odd**. It was encoded as `encoded[i] = perm[i] XOR perm[i + 1]`, giving an array of length `n - 1`.\n\nGiven `encoded`, return `perm`. The answer is unique.",
        [
          { in: "encoded = [3,1]", out: "[1,2,3]", note: "1 XOR 2 = 3 and 2 XOR 3 = 1." },
          { in: "encoded = [6,5,4,6]", out: "[2,4,1,5,3]" },
          { in: "encoded = []", out: "[1]", note: "With n = 1 there is nothing to encode." },
        ],
        ["3 <= n <= 100000", "n is odd", "encoded.length == n - 1", "The input always comes from a valid permutation."]),
      hints: [
        "Once you know `perm[0]`, the rest unrolls: `perm[i+1] = perm[i] XOR encoded[i]`.",
        "The XOR of the whole permutation is the XOR of `1 … n`, which you can compute directly.",
        "The XOR of `encoded` at **odd** indices telescopes to `perm[1] XOR perm[2] XOR … XOR perm[n-1]`.",
      ],
      editorial: explain({
        idea: "Recovering `perm[0]` is the whole problem, and two XOR identities give it. The total XOR of the permutation is known from `n`, and the odd-indexed entries of `encoded` pair up the remaining elements exactly once each.",
        steps: [
          "Compute `total = 1 XOR 2 XOR … XOR n`.",
          "Compute `odd = encoded[1] XOR encoded[3] XOR …`, which equals `perm[1] XOR … XOR perm[n-1]`.",
          "Then `perm[0] = total XOR odd`.",
          "Unroll the rest with `perm[i+1] = perm[i] XOR encoded[i]`.",
        ],
        why: "`encoded[1] = perm[1] ^ perm[2]`, `encoded[3] = perm[3] ^ perm[4]`, and so on — because `n` is odd there are `(n-1)/2` such pairs covering indices `1 … n-1` exactly once. XOR-ing the total by that value cancels everything except `perm[0]`.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Using the **even** indices of `encoded` double counts and gives the wrong seed.",
          "The trick relies on `n` being odd; with an even `n` the pairing does not cover the tail cleanly.",
          "Trying every possible `perm[0]` is `O(n²)` and times out.",
        ],
      }),
      examples: [
        { input: "[3,1]", expectedOutput: "[1,2,3]" },
        { input: "[6,5,4,6]", expectedOutput: "[2,4,1,5,3]" },
        { input: "[]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = 2 * ri(rng, 1, 25) + 1;
        const perm = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        const encoded: number[] = [];
        for (let i = 0; i + 1 < n; i++) encoded.push(perm[i] ^ perm[i + 1]);
        return { input: fmtIntArr(encoded), expectedOutput: fmtIntArr(ref(encoded)) };
      },
      solutions: {
        python: `from typing import List\n\ndef decodePermutation(encoded: List[int]) -> List[int]:\n    n = len(encoded) + 1\n    total = 0\n    for v in range(1, n + 1):\n        total ^= v\n    odd = 0\n    for i in range(1, len(encoded), 2):\n        odd ^= encoded[i]\n    perm = [total ^ odd]\n    for e in encoded:\n        perm.append(perm[-1] ^ e)\n    return perm`,
        javascript: `var decodePermutation = function(encoded) {\n    var n = encoded.length + 1;\n    var total = 0;\n    for (var v = 1; v <= n; v++) total ^= v;\n    var odd = 0;\n    for (var i = 1; i < encoded.length; i += 2) odd ^= encoded[i];\n    var perm = [total ^ odd];\n    for (var j = 0; j < encoded.length; j++) perm.push(perm[j] ^ encoded[j]);\n    return perm;\n};`,
        typescript: `function decodePermutation(encoded: number[]): number[] {\n    var n = encoded.length + 1;\n    var total = 0;\n    for (var v = 1; v <= n; v++) total ^= v;\n    var odd = 0;\n    for (var i = 1; i < encoded.length; i += 2) odd ^= encoded[i];\n    var perm: number[] = [total ^ odd];\n    for (var j = 0; j < encoded.length; j++) perm.push(perm[j] ^ encoded[j]);\n    return perm;\n}`,
        java: `public static int[] decodePermutation(int[] encoded) {\n    int n = encoded.length + 1;\n    int total = 0;\n    for (int v = 1; v <= n; v++) total ^= v;\n    int odd = 0;\n    for (int i = 1; i < encoded.length; i += 2) odd ^= encoded[i];\n    int[] perm = new int[n];\n    perm[0] = total ^ odd;\n    for (int i = 0; i < encoded.length; i++) perm[i + 1] = perm[i] ^ encoded[i];\n    return perm;\n}`,
        cpp: `vector<int> decodePermutation(vector<int>& encoded) {\n    int n = (int) encoded.size() + 1;\n    int total = 0;\n    for (int v = 1; v <= n; v++) total ^= v;\n    int odd = 0;\n    for (size_t i = 1; i < encoded.size(); i += 2) odd ^= encoded[i];\n    vector<int> perm(n);\n    perm[0] = total ^ odd;\n    for (size_t i = 0; i < encoded.size(); i++) perm[i + 1] = perm[i] ^ encoded[i];\n    return perm;\n}`,
        c: `int* decodePermutation(int* encoded, int encodedSize, int* returnSize) {\n    int n = encodedSize + 1;\n    int total = 0;\n    for (int v = 1; v <= n; v++) total ^= v;\n    int odd = 0;\n    for (int i = 1; i < encodedSize; i += 2) odd ^= encoded[i];\n    int* perm = (int*) malloc((size_t) n * sizeof(int));\n    perm[0] = total ^ odd;\n    for (int i = 0; i < encodedSize; i++) perm[i + 1] = perm[i] ^ encoded[i];\n    *returnSize = n;\n    return perm;\n}`,
        csharp: `public static int[] DecodePermutation(int[] encoded)\n{\n    int n = encoded.Length + 1;\n    int total = 0;\n    for (int v = 1; v <= n; v++) total ^= v;\n    int odd = 0;\n    for (int i = 1; i < encoded.Length; i += 2) odd ^= encoded[i];\n    int[] perm = new int[n];\n    perm[0] = total ^ odd;\n    for (int i = 0; i < encoded.Length; i++) perm[i + 1] = perm[i] ^ encoded[i];\n    return perm;\n}`,
        go: `func decodePermutation(encoded []int) []int {\n\tn := len(encoded) + 1\n\ttotal := 0\n\tfor v := 1; v <= n; v++ {\n\t\ttotal ^= v\n\t}\n\todd := 0\n\tfor i := 1; i < len(encoded); i += 2 {\n\t\todd ^= encoded[i]\n\t}\n\tperm := make([]int, n)\n\tperm[0] = total ^ odd\n\tfor i := 0; i < len(encoded); i++ {\n\t\tperm[i+1] = perm[i] ^ encoded[i]\n\t}\n\treturn perm\n}`,
        kotlin: `fun decodePermutation(encoded: IntArray): IntArray {\n    val n = encoded.size + 1\n    var total = 0\n    for (v in 1..n) total = total xor v\n    var odd = 0\n    var i = 1\n    while (i < encoded.size) {\n        odd = odd xor encoded[i]\n        i += 2\n    }\n    val perm = IntArray(n)\n    perm[0] = total xor odd\n    for (j in encoded.indices) perm[j + 1] = perm[j] xor encoded[j]\n    return perm\n}`,
        swift: `func decodePermutation(_ encoded: [Int]) -> [Int] {\n    let n = encoded.count + 1\n    var total = 0\n    for v in 1...n { total ^= v }\n    var odd = 0\n    var i = 1\n    while i < encoded.count {\n        odd ^= encoded[i]\n        i += 2\n    }\n    var perm = [Int](repeating: 0, count: n)\n    perm[0] = total ^ odd\n    for j in 0..<encoded.count { perm[j + 1] = perm[j] ^ encoded[j] }\n    return perm\n}`,
        rust: `fn decodePermutation(encoded: Vec<i32>) -> Vec<i32> {\n    let n = encoded.len() + 1;\n    let mut total = 0i32;\n    for v in 1..=(n as i32) {\n        total ^= v;\n    }\n    let mut odd = 0i32;\n    let mut i = 1usize;\n    while i < encoded.len() {\n        odd ^= encoded[i];\n        i += 2;\n    }\n    let mut perm = vec![0i32; n];\n    perm[0] = total ^ odd;\n    for j in 0..encoded.len() {\n        perm[j + 1] = perm[j] ^ encoded[j];\n    }\n    perm\n}`,
        php: `function decodePermutation($encoded) {\n    $n = count($encoded) + 1;\n    $total = 0;\n    for ($v = 1; $v <= $n; $v++) $total ^= $v;\n    $odd = 0;\n    for ($i = 1; $i < count($encoded); $i += 2) $odd ^= $encoded[$i];\n    $perm = array($total ^ $odd);\n    for ($j = 0; $j < count($encoded); $j++) $perm[] = $perm[$j] ^ $encoded[$j];\n    return $perm;\n}`,
        ruby: `def decodePermutation(encoded)\n  n = encoded.length + 1\n  total = 0\n  (1..n).each { |v| total ^= v }\n  odd = 0\n  i = 1\n  while i < encoded.length\n    odd ^= encoded[i]\n    i += 2\n  end\n  perm = [total ^ odd]\n  encoded.each_with_index { |e, j| perm << (perm[j] ^ e) }\n  perm\nend`,
      },
    };
  })(),

  // ── XOR Queries of a Subarray (LC 1310) ─────────────────────────
  (() => {
    const ref = (arr: number[], queries: number[][]) => {
      const pref = [0];
      for (let i = 0; i < arr.length; i++) pref.push(pref[i] ^ arr[i]);
      return queries.map((q) => pref[q[1] + 1] ^ pref[q[0]]);
    };
    return {
      slug: "xor-queries-of-a-subarray",
      title: "XOR Queries of a Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Prefix Sum", "Amazon", "Google", "Adobe"],
      signature: { funcName: "xorQueries", params: [{ name: "arr", type: "int[]" as const }, { name: "queries", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "For each query `[left, right]`, compute the XOR of `arr[left] … arr[right]` inclusive.\n\nReturn the answers in query order.",
        [
          { in: "arr = [1,3,4,8], queries = [[0,1],[1,2],[0,3],[3,3]]", out: "[2,7,14,8]", note: "1 XOR 3 = 2, 3 XOR 4 = 7, all four XOR to 14, and the last element alone is 8." },
          { in: "arr = [4,8,2,10], queries = [[2,3],[1,3],[0,0],[0,3]]", out: "[8,0,4,4]" },
          { in: "arr = [5], queries = [[0,0]]", out: "[5]" },
        ],
        ["1 <= arr.length <= 30000", "1 <= queries.length <= 30000", "0 <= left <= right < arr.length", "1 <= arr[i] <= 1000000000"]),
      hints: [
        "Answering each query with its own loop is `O(n)` per query, which is too slow.",
        "Build prefix XORs: `pref[i]` is the XOR of the first `i` elements.",
        "Then the range XOR is `pref[right + 1] XOR pref[left]`, because the shared prefix cancels.",
      ],
      editorial: explain({
        idea: "XOR has the same telescoping property as addition, with XOR playing the role of both plus and minus. So a prefix-XOR array answers any range in constant time.",
        steps: [
          "Build `pref` of length `n + 1` with `pref[0] = 0` and `pref[i+1] = pref[i] ^ arr[i]`.",
          "For a query `[l, r]`, return `pref[r + 1] ^ pref[l]`.",
        ],
        why: "`pref[r+1] = arr[0] ^ … ^ arr[r]` and `pref[l] = arr[0] ^ … ^ arr[l-1]`. XOR-ing them cancels the shared prefix, because every element in it appears twice and `x ^ x = 0`, leaving exactly `arr[l] ^ … ^ arr[r]`.",
        time: "O(n + q)",
        space: "O(n)",
        pitfalls: [
          "Off-by-one: the range ends at `r` inclusive, so the prefix index is `r + 1`.",
          "Using subtraction instead of XOR breaks the cancellation.",
        ],
      }),
      examples: [
        { input: "[1,3,4,8]\n[[0,1],[1,2],[0,3],[3,3]]", expectedOutput: "[2,7,14,8]" },
        { input: "[4,8,2,10]\n[[2,3],[1,3],[0,0],[0,3]]", expectedOutput: "[8,0,4,4]" },
        { input: "[5]\n[[0,0]]", expectedOutput: "[5]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hi = rng() < 0.5 ? 20 : 1000000000;
        const arr = Array.from({ length: n }, () => ri(rng, 1, hi));
        const queries = Array.from({ length: ri(rng, 1, 10) }, () => {
          const l = ri(rng, 0, n - 1);
          const r = ri(rng, l, n - 1);
          return [l, r];
        });
        return { input: `${fmtIntArr(arr)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(arr, queries)) };
      },
      solutions: {
        python: `from typing import List\n\ndef xorQueries(arr: List[int], queries: List[List[int]]) -> List[int]:\n    pref = [0]\n    for x in arr:\n        pref.append(pref[-1] ^ x)\n    return [pref[r + 1] ^ pref[l] for l, r in queries]`,
        javascript: `var xorQueries = function(arr, queries) {\n    var pref = [0];\n    for (var i = 0; i < arr.length; i++) pref.push(pref[i] ^ arr[i]);\n    var out = [];\n    for (var j = 0; j < queries.length; j++) {\n        out.push(pref[queries[j][1] + 1] ^ pref[queries[j][0]]);\n    }\n    return out;\n};`,
        typescript: `function xorQueries(arr: number[], queries: number[][]): number[] {\n    var pref: number[] = [0];\n    for (var i = 0; i < arr.length; i++) pref.push(pref[i] ^ arr[i]);\n    var out: number[] = [];\n    for (var j = 0; j < queries.length; j++) {\n        out.push(pref[queries[j][1] + 1] ^ pref[queries[j][0]]);\n    }\n    return out;\n}`,
        java: `public static int[] xorQueries(int[] arr, int[][] queries) {\n    int n = arr.length;\n    int[] pref = new int[n + 1];\n    for (int i = 0; i < n; i++) pref[i + 1] = pref[i] ^ arr[i];\n    int[] out = new int[queries.length];\n    for (int j = 0; j < queries.length; j++) {\n        out[j] = pref[queries[j][1] + 1] ^ pref[queries[j][0]];\n    }\n    return out;\n}`,
        cpp: `vector<int> xorQueries(vector<int>& arr, vector<vector<int>>& queries) {\n    int n = (int) arr.size();\n    vector<int> pref(n + 1, 0);\n    for (int i = 0; i < n; i++) pref[i + 1] = pref[i] ^ arr[i];\n    vector<int> out;\n    for (auto& q : queries) out.push_back(pref[q[1] + 1] ^ pref[q[0]]);\n    return out;\n}`,
        c: `int* xorQueries(int* arr, int arrSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {\n    int* pref = (int*) calloc((size_t) arrSize + 1, sizeof(int));\n    for (int i = 0; i < arrSize; i++) pref[i + 1] = pref[i] ^ arr[i];\n    int* out = (int*) malloc((size_t) queriesSize * sizeof(int));\n    for (int j = 0; j < queriesSize; j++) {\n        out[j] = pref[queries[j][1] + 1] ^ pref[queries[j][0]];\n    }\n    free(pref);\n    *returnSize = queriesSize;\n    return out;\n}`,
        csharp: `public static int[] XorQueries(int[] arr, int[][] queries)\n{\n    int n = arr.Length;\n    int[] pref = new int[n + 1];\n    for (int i = 0; i < n; i++) pref[i + 1] = pref[i] ^ arr[i];\n    int[] out_ = new int[queries.Length];\n    for (int j = 0; j < queries.Length; j++)\n    {\n        out_[j] = pref[queries[j][1] + 1] ^ pref[queries[j][0]];\n    }\n    return out_;\n}`,
        go: `func xorQueries(arr []int, queries [][]int) []int {\n\tn := len(arr)\n\tpref := make([]int, n+1)\n\tfor i := 0; i < n; i++ {\n\t\tpref[i+1] = pref[i] ^ arr[i]\n\t}\n\tout := make([]int, len(queries))\n\tfor j, q := range queries {\n\t\tout[j] = pref[q[1]+1] ^ pref[q[0]]\n\t}\n\treturn out\n}`,
        kotlin: `fun xorQueries(arr: IntArray, queries: Array<IntArray>): IntArray {\n    val n = arr.size\n    val pref = IntArray(n + 1)\n    for (i in 0 until n) pref[i + 1] = pref[i] xor arr[i]\n    val out = IntArray(queries.size)\n    for (j in queries.indices) out[j] = pref[queries[j][1] + 1] xor pref[queries[j][0]]\n    return out\n}`,
        swift: `func xorQueries(_ arr: [Int], _ queries: [[Int]]) -> [Int] {\n    var pref = [Int](repeating: 0, count: arr.count + 1)\n    for i in 0..<arr.count { pref[i + 1] = pref[i] ^ arr[i] }\n    return queries.map { pref[$0[1] + 1] ^ pref[$0[0]] }\n}`,
        rust: `fn xorQueries(arr: Vec<i32>, queries: Vec<Vec<i32>>) -> Vec<i32> {\n    let n = arr.len();\n    let mut pref = vec![0i32; n + 1];\n    for i in 0..n {\n        pref[i + 1] = pref[i] ^ arr[i];\n    }\n    queries.iter().map(|q| pref[(q[1] + 1) as usize] ^ pref[q[0] as usize]).collect()\n}`,
        php: `function xorQueries($arr, $queries) {\n    $pref = array(0);\n    for ($i = 0; $i < count($arr); $i++) $pref[] = $pref[$i] ^ $arr[$i];\n    $out = array();\n    foreach ($queries as $q) $out[] = $pref[$q[1] + 1] ^ $pref[$q[0]];\n    return $out;\n}`,
        ruby: `def xorQueries(arr, queries)\n  pref = [0]\n  arr.each_with_index { |x, i| pref << (pref[i] ^ x) }\n  queries.map { |q| pref[q[1] + 1] ^ pref[q[0]] }\nend`,
      },
    };
  })(),

  // ── Count Number of Maximum Bitwise-OR Subsets (LC 2044) ────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (const x of nums) best |= x;
      const n = nums.length;
      let count = 0;
      for (let mask = 1; mask < (1 << n); mask++) {
        let acc = 0;
        for (let i = 0; i < n; i++) { if ((mask >> i) & 1) acc |= nums[i]; }
        if (acc === best) count++;
      }
      return count;
    };
    return {
      slug: "count-number-of-maximum-bitwise-or-subsets",
      title: "Count Number of Maximum Bitwise-OR Subsets",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Backtracking", "Enumeration", "Amazon", "Google", "Samsung"],
      signature: { funcName: "countMaxOrSubsets", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Return the number of **non-empty** subsets of `nums` whose bitwise OR is the maximum achievable.\n\nTwo subsets are different when they use different index sets, even if the values coincide.",
        [
          { in: "nums = [3,1]", out: "2", note: "The maximum OR is 3, reached by {3} and {3,1}." },
          { in: "nums = [2,2,2]", out: "7", note: "Every non-empty subset ORs to 2." },
          { in: "nums = [3,2,1,5]", out: "6" },
        ],
        ["1 <= nums.length <= 16", "1 <= nums[i] <= 100000"]),
      hints: [
        "OR only grows, so the maximum is the OR of the whole array.",
        "With at most 16 elements there are fewer than 65536 subsets — just enumerate them.",
        "A bitmask over the indices is the cleanest way to enumerate.",
      ],
      editorial: explain({
        idea: "The best OR is the OR of everything, since adding elements never clears a bit. Counting the subsets that reach it is then a brute-force enumeration over the `2^n - 1` non-empty index masks.",
        steps: [
          "Compute `best`, the OR of all elements.",
          "For each mask from `1` to `2^n - 1`, OR together the selected elements.",
          "Count the masks whose OR equals `best`.",
        ],
        why: "Bitwise OR is monotone under adding elements, so no subset can exceed the full-array OR, and the full array itself attains it. With `n <= 16` the enumeration is at most about a million operations.",
        time: "O(2^n · n)",
        space: "O(1)",
        pitfalls: [
          "Starting the mask at 0 counts the empty subset, which the statement excludes.",
          "`1 << n` with `n = 16` is fine, but the loop bound must be exclusive.",
          "Recomputing the OR from scratch per mask is fine here; the `O(2^n)` refinement carries it incrementally.",
        ],
      }),
      examples: [
        { input: "[3,1]", expectedOutput: "2" },
        { input: "[2,2,2]", expectedOutput: "7" },
        { input: "[3,2,1,5]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const hi = rng() < 0.6 ? 12 : 100000;
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countMaxOrSubsets(nums: List[int]) -> int:\n    best = 0\n    for x in nums:\n        best |= x\n    n = len(nums)\n    count = 0\n    for mask in range(1, 1 << n):\n        acc = 0\n        for i in range(n):\n            if (mask >> i) & 1:\n                acc |= nums[i]\n        if acc == best:\n            count += 1\n    return count`,
        javascript: `var countMaxOrSubsets = function(nums) {\n    var best = 0;\n    for (var i = 0; i < nums.length; i++) best |= nums[i];\n    var n = nums.length, count = 0;\n    for (var mask = 1; mask < (1 << n); mask++) {\n        var acc = 0;\n        for (var j = 0; j < n; j++) {\n            if ((mask >> j) & 1) acc |= nums[j];\n        }\n        if (acc === best) count++;\n    }\n    return count;\n};`,
        typescript: `function countMaxOrSubsets(nums: number[]): number {\n    var best = 0;\n    for (var i = 0; i < nums.length; i++) best |= nums[i];\n    var n = nums.length, count = 0;\n    for (var mask = 1; mask < (1 << n); mask++) {\n        var acc = 0;\n        for (var j = 0; j < n; j++) {\n            if ((mask >> j) & 1) acc |= nums[j];\n        }\n        if (acc === best) count++;\n    }\n    return count;\n}`,
        java: `public static int countMaxOrSubsets(int[] nums) {\n    int best = 0;\n    for (int x : nums) best |= x;\n    int n = nums.length, count = 0;\n    for (int mask = 1; mask < (1 << n); mask++) {\n        int acc = 0;\n        for (int i = 0; i < n; i++) {\n            if (((mask >> i) & 1) == 1) acc |= nums[i];\n        }\n        if (acc == best) count++;\n    }\n    return count;\n}`,
        cpp: `int countMaxOrSubsets(vector<int>& nums) {\n    int best = 0;\n    for (int x : nums) best |= x;\n    int n = (int) nums.size(), count = 0;\n    for (int mask = 1; mask < (1 << n); mask++) {\n        int acc = 0;\n        for (int i = 0; i < n; i++) {\n            if ((mask >> i) & 1) acc |= nums[i];\n        }\n        if (acc == best) count++;\n    }\n    return count;\n}`,
        c: `int countMaxOrSubsets(int* nums, int numsSize) {\n    int best = 0;\n    for (int i = 0; i < numsSize; i++) best |= nums[i];\n    int count = 0;\n    for (int mask = 1; mask < (1 << numsSize); mask++) {\n        int acc = 0;\n        for (int i = 0; i < numsSize; i++) {\n            if ((mask >> i) & 1) acc |= nums[i];\n        }\n        if (acc == best) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountMaxOrSubsets(int[] nums)\n{\n    int best = 0;\n    foreach (int x in nums) best |= x;\n    int n = nums.Length, count = 0;\n    for (int mask = 1; mask < (1 << n); mask++)\n    {\n        int acc = 0;\n        for (int i = 0; i < n; i++)\n        {\n            if (((mask >> i) & 1) == 1) acc |= nums[i];\n        }\n        if (acc == best) count++;\n    }\n    return count;\n}`,
        go: `func countMaxOrSubsets(nums []int) int {\n\tbest := 0\n\tfor _, x := range nums {\n\t\tbest |= x\n\t}\n\tn := len(nums)\n\tcount := 0\n\tfor mask := 1; mask < (1 << uint(n)); mask++ {\n\t\tacc := 0\n\t\tfor i := 0; i < n; i++ {\n\t\t\tif (mask>>uint(i))&1 == 1 {\n\t\t\t\tacc |= nums[i]\n\t\t\t}\n\t\t}\n\t\tif acc == best {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countMaxOrSubsets(nums: IntArray): Int {\n    var best = 0\n    for (x in nums) best = best or x\n    val n = nums.size\n    var count = 0\n    for (mask in 1 until (1 shl n)) {\n        var acc = 0\n        for (i in 0 until n) {\n            if ((mask shr i) and 1 == 1) acc = acc or nums[i]\n        }\n        if (acc == best) count++\n    }\n    return count\n}`,
        swift: `func countMaxOrSubsets(_ nums: [Int]) -> Int {\n    var best = 0\n    for x in nums { best |= x }\n    let n = nums.count\n    var count = 0\n    for mask in 1..<(1 << n) {\n        var acc = 0\n        for i in 0..<n where (mask >> i) & 1 == 1 { acc |= nums[i] }\n        if acc == best { count += 1 }\n    }\n    return count\n}`,
        rust: `fn countMaxOrSubsets(nums: Vec<i32>) -> i32 {\n    let mut best = 0i32;\n    for &x in nums.iter() {\n        best |= x;\n    }\n    let n = nums.len();\n    let mut count = 0i32;\n    for mask in 1..(1usize << n) {\n        let mut acc = 0i32;\n        for i in 0..n {\n            if (mask >> i) & 1 == 1 {\n                acc |= nums[i];\n            }\n        }\n        if acc == best {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function countMaxOrSubsets($nums) {\n    $best = 0;\n    foreach ($nums as $x) $best |= $x;\n    $n = count($nums);\n    $count = 0;\n    for ($mask = 1; $mask < (1 << $n); $mask++) {\n        $acc = 0;\n        for ($i = 0; $i < $n; $i++) {\n            if (($mask >> $i) & 1) $acc |= $nums[$i];\n        }\n        if ($acc === $best) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countMaxOrSubsets(nums)\n  best = nums.reduce(0) { |a, x| a | x }\n  n = nums.length\n  count = 0\n  (1...(1 << n)).each do |mask|\n    acc = 0\n    (0...n).each { |i| acc |= nums[i] if (mask >> i) & 1 == 1 }\n    count += 1 if acc == best\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Maximum XOR for Each Query (LC 1829) ────────────────────────
  (() => {
    const ref = (nums: number[], maximumBit: number) => {
      const mask = Math.pow(2, maximumBit) - 1;
      let total = 0;
      for (const x of nums) total ^= x;
      const out: number[] = [];
      for (let i = nums.length - 1; i >= 0; i--) {
        out.push(total ^ mask);
        total ^= nums[i];
      }
      return out;
    };
    return {
      slug: "maximum-xor-for-each-query",
      title: "Maximum XOR for Each Query",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Prefix Sum", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "getMaximumXor", params: [{ name: "nums", type: "int[]" as const }, { name: "maximumBit", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Every element of `nums` is smaller than `2^maximumBit`. Repeat until the array is empty: choose the non-negative `k < 2^maximumBit` that maximises the XOR of `k` with all remaining elements, record `k`, then remove the **last** element.\n\nReturn the recorded values in order.",
        [
          { in: "nums = [0,1,1,3], maximumBit = 2", out: "[0,3,2,3]", note: "The array XORs to 3, so the first k is 3 XOR 3 = 0." },
          { in: "nums = [2,3,4,7], maximumBit = 3", out: "[5,2,6,5]" },
          { in: "nums = [0,1,2,2,5,7], maximumBit = 3", out: "[4,3,6,4,6,7]" },
        ],
        ["1 <= nums.length <= 100000", "1 <= maximumBit <= 20", "0 <= nums[i] < 2^maximumBit"]),
      hints: [
        "For a fixed XOR total `t`, the `k` that maximises `t XOR k` within `maximumBit` bits is `t XOR mask`, where `mask = 2^maximumBit - 1`.",
        "That gives `mask` itself as the maximised value — the answer is the `k`, not the maximum.",
        "Removing the last element just XORs it out of the running total, so one backward sweep suffices.",
      ],
      editorial: explain({
        idea: "Flipping every bit of the running XOR gives the all-ones value, which is the largest possible within `maximumBit` bits. So the answer for a given state is `total XOR mask`, and removals are handled by XOR-ing the departing element out.",
        steps: [
          "Set `mask = 2^maximumBit - 1` and compute `total`, the XOR of all elements.",
          "Sweep `i` from the last index down to 0: record `total ^ mask`, then XOR `nums[i]` out of `total`.",
          "Return the recorded values in the order they were produced.",
        ],
        why: "`t ^ k` is maximised over `k < 2^b` by choosing `k` so the result is all ones, which forces `k = t ^ mask` — and that `k` is in range because `t` is. Removing the last element is undone by XOR-ing it again, since XOR is its own inverse.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Returning the maximised XOR value (always `mask`) instead of the `k` that achieves it.",
          "Sweeping forwards removes the wrong elements — the array shrinks from the back.",
          "`1 << 20` is safe in every target language, but building the mask with `Math.pow` avoids any doubt in JavaScript.",
        ],
      }),
      examples: [
        { input: "[0,1,1,3]\n2", expectedOutput: "[0,3,2,3]" },
        { input: "[2,3,4,7]\n3", expectedOutput: "[5,2,6,5]" },
        { input: "[0,1,2,2,5,7]\n3", expectedOutput: "[4,3,6,4,6,7]" },
      ],
      gen: (rng: Rng) => {
        const maximumBit = ri(rng, 1, 12);
        const cap = Math.pow(2, maximumBit);
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, cap - 1));
        return { input: `${fmtIntArr(nums)}\n${maximumBit}`, expectedOutput: fmtIntArr(ref(nums, maximumBit)) };
      },
      solutions: {
        python: `from typing import List\n\ndef getMaximumXor(nums: List[int], maximumBit: int) -> List[int]:\n    mask = (1 << maximumBit) - 1\n    total = 0\n    for x in nums:\n        total ^= x\n    out = []\n    for i in range(len(nums) - 1, -1, -1):\n        out.append(total ^ mask)\n        total ^= nums[i]\n    return out`,
        javascript: `var getMaximumXor = function(nums, maximumBit) {\n    var mask = Math.pow(2, maximumBit) - 1;\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) total ^= nums[i];\n    var out = [];\n    for (var j = nums.length - 1; j >= 0; j--) {\n        out.push(total ^ mask);\n        total ^= nums[j];\n    }\n    return out;\n};`,
        typescript: `function getMaximumXor(nums: number[], maximumBit: number): number[] {\n    var mask = Math.pow(2, maximumBit) - 1;\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) total ^= nums[i];\n    var out: number[] = [];\n    for (var j = nums.length - 1; j >= 0; j--) {\n        out.push(total ^ mask);\n        total ^= nums[j];\n    }\n    return out;\n}`,
        java: `public static int[] getMaximumXor(int[] nums, int maximumBit) {\n    int mask = (1 << maximumBit) - 1;\n    int total = 0;\n    for (int x : nums) total ^= x;\n    int n = nums.length;\n    int[] out = new int[n];\n    for (int i = 0; i < n; i++) {\n        out[i] = total ^ mask;\n        total ^= nums[n - 1 - i];\n    }\n    return out;\n}`,
        cpp: `vector<int> getMaximumXor(vector<int>& nums, int maximumBit) {\n    int mask = (1 << maximumBit) - 1;\n    int total = 0;\n    for (int x : nums) total ^= x;\n    vector<int> out;\n    for (int i = (int) nums.size() - 1; i >= 0; i--) {\n        out.push_back(total ^ mask);\n        total ^= nums[i];\n    }\n    return out;\n}`,
        c: `int* getMaximumXor(int* nums, int numsSize, int maximumBit, int* returnSize) {\n    int mask = (1 << maximumBit) - 1;\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) total ^= nums[i];\n    int* out = (int*) malloc((size_t) numsSize * sizeof(int));\n    int m = 0;\n    for (int i = numsSize - 1; i >= 0; i--) {\n        out[m++] = total ^ mask;\n        total ^= nums[i];\n    }\n    *returnSize = numsSize;\n    return out;\n}`,
        csharp: `public static int[] GetMaximumXor(int[] nums, int maximumBit)\n{\n    int mask = (1 << maximumBit) - 1;\n    int total = 0;\n    foreach (int x in nums) total ^= x;\n    int n = nums.Length;\n    int[] out_ = new int[n];\n    for (int i = 0; i < n; i++)\n    {\n        out_[i] = total ^ mask;\n        total ^= nums[n - 1 - i];\n    }\n    return out_;\n}`,
        go: `func getMaximumXor(nums []int, maximumBit int) []int {\n\tmask := (1 << uint(maximumBit)) - 1\n\ttotal := 0\n\tfor _, x := range nums {\n\t\ttotal ^= x\n\t}\n\tout := make([]int, 0, len(nums))\n\tfor i := len(nums) - 1; i >= 0; i-- {\n\t\tout = append(out, total^mask)\n\t\ttotal ^= nums[i]\n\t}\n\treturn out\n}`,
        kotlin: `fun getMaximumXor(nums: IntArray, maximumBit: Int): IntArray {\n    val mask = (1 shl maximumBit) - 1\n    var total = 0\n    for (x in nums) total = total xor x\n    val n = nums.size\n    val out = IntArray(n)\n    for (i in 0 until n) {\n        out[i] = total xor mask\n        total = total xor nums[n - 1 - i]\n    }\n    return out\n}`,
        swift: `func getMaximumXor(_ nums: [Int], _ maximumBit: Int) -> [Int] {\n    let mask = (1 << maximumBit) - 1\n    var total = 0\n    for x in nums { total ^= x }\n    var out: [Int] = []\n    var i = nums.count - 1\n    while i >= 0 {\n        out.append(total ^ mask)\n        total ^= nums[i]\n        i -= 1\n    }\n    return out\n}`,
        rust: `fn getMaximumXor(nums: Vec<i32>, maximumBit: i32) -> Vec<i32> {\n    let mask = (1i32 << maximumBit) - 1;\n    let mut total = 0i32;\n    for &x in nums.iter() {\n        total ^= x;\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for i in (0..nums.len()).rev() {\n        out.push(total ^ mask);\n        total ^= nums[i];\n    }\n    out\n}`,
        php: `function getMaximumXor($nums, $maximumBit) {\n    $mask = (1 << $maximumBit) - 1;\n    $total = 0;\n    foreach ($nums as $x) $total ^= $x;\n    $out = array();\n    for ($i = count($nums) - 1; $i >= 0; $i--) {\n        $out[] = $total ^ $mask;\n        $total ^= $nums[$i];\n    }\n    return $out;\n}`,
        ruby: `def getMaximumXor(nums, maximumBit)\n  mask = (1 << maximumBit) - 1\n  total = nums.reduce(0) { |a, x| a ^ x }\n  out = []\n  (nums.length - 1).downto(0) do |i|\n    out << (total ^ mask)\n    total ^= nums[i]\n  end\n  out\nend`,
      },
    };
  })(),

  // ── UTF-8 Validation (LC 393) ───────────────────────────────────
  (() => {
    const ref = (data: number[]) => {
      let i = 0;
      while (i < data.length) {
        const b = data[i] & 255;
        let len: number;
        if ((b & 128) === 0) len = 1;
        else if ((b & 224) === 192) len = 2;
        else if ((b & 240) === 224) len = 3;
        else if ((b & 248) === 240) len = 4;
        else return false;
        if (i + len > data.length) return false;
        for (let j = 1; j < len; j++) {
          if (((data[i + j] & 255) & 192) !== 128) return false;
        }
        i += len;
      }
      return true;
    };
    return {
      slug: "utf-8-validation",
      title: "UTF-8 Validation",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Amazon", "Google", "Meta"],
      signature: { funcName: "validUtf8", params: [{ name: "data", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Each entry of `data` holds one byte in its low 8 bits. A UTF-8 character is 1 to 4 bytes long:\n\n- one byte starts with `0`;\n- a `k`-byte character starts with `k` ones then a zero, and each following byte starts with `10`.\n\nReturn `true` if `data` is a valid UTF-8 encoding.",
        [
          { in: "data = [197,130,1]", out: "true", note: "11000101 10000010 is a two-byte character, then 00000001 is a one-byte character." },
          { in: "data = [235,140,4]", out: "false", note: "11101011 announces three bytes, but the third starts with 00." },
          { in: "data = [240,162,138,147]", out: "true", note: "A four-byte character." },
        ],
        ["1 <= data.length <= 20000", "0 <= data[i] <= 255"]),
      hints: [
        "Only the low 8 bits matter — mask each entry with 255 before inspecting it.",
        "The leading byte's high bits give the character length: `0xxxxxxx` is 1, `110xxxxx` is 2, `1110xxxx` is 3, `11110xxx` is 4.",
        "Every continuation byte must match `10xxxxxx`, which is `(b & 0xC0) == 0x80`.",
      ],
      editorial: explain({
        idea: "Walk the bytes as a sequence of characters. Each leading byte declares how many continuation bytes follow, and the format of those is fixed, so validation is a scan with a small state machine.",
        steps: [
          "Mask the current byte with 255 and classify its high bits to get the character length, rejecting any other pattern.",
          "Reject if the declared length runs past the end of the array.",
          "Check that each of the following `len - 1` bytes matches `10xxxxxx`.",
          "Advance by `len` and repeat until the array is consumed.",
        ],
        why: "The encoding is self-delimiting: the leading byte alone determines the character's length, so a greedy left-to-right scan never has to backtrack. Any byte that is neither a valid leader nor consumed as a continuation makes the whole sequence invalid.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`10xxxxxx` is never a valid leader, so a stray continuation byte must be rejected.",
          "`11111xxx` declares five or more bytes and is invalid — the length classification must fall through to a rejection.",
          "Forgetting to mask with 255 lets higher bits of the integer interfere in languages where the value is stored wider.",
        ],
      }),
      examples: [
        { input: "[197,130,1]", expectedOutput: "true" },
        { input: "[235,140,4]", expectedOutput: "false" },
        { input: "[240,162,138,147]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.5) {
          const data: number[] = [];
          for (let t = ri(rng, 1, 6); t > 0; t--) {
            const len = ri(rng, 1, 4);
            if (len === 1) data.push(ri(rng, 0, 127));
            else {
              const lead = [0, 0, 192, 224, 240][len] + ri(rng, 0, len === 2 ? 31 : len === 3 ? 15 : 7);
              data.push(lead);
              for (let j = 1; j < len; j++) data.push(128 + ri(rng, 0, 63));
            }
          }
          if (rng() < 0.35 && data.length > 0) data[ri(rng, 0, data.length - 1)] = ri(rng, 0, 255);
          return { input: fmtIntArr(data), expectedOutput: bool(ref(data)) };
        }
        const data = Array.from({ length: ri(rng, 1, 12) }, () => ri(rng, 0, 255));
        return { input: fmtIntArr(data), expectedOutput: bool(ref(data)) };
      },
      solutions: {
        python: `from typing import List\n\ndef validUtf8(data: List[int]) -> bool:\n    i = 0\n    while i < len(data):\n        b = data[i] & 255\n        if b & 128 == 0:\n            length = 1\n        elif b & 224 == 192:\n            length = 2\n        elif b & 240 == 224:\n            length = 3\n        elif b & 248 == 240:\n            length = 4\n        else:\n            return False\n        if i + length > len(data):\n            return False\n        for j in range(1, length):\n            if (data[i + j] & 255) & 192 != 128:\n                return False\n        i += length\n    return True`,
        javascript: `var validUtf8 = function(data) {\n    var i = 0;\n    while (i < data.length) {\n        var b = data[i] & 255;\n        var len;\n        if ((b & 128) === 0) len = 1;\n        else if ((b & 224) === 192) len = 2;\n        else if ((b & 240) === 224) len = 3;\n        else if ((b & 248) === 240) len = 4;\n        else return false;\n        if (i + len > data.length) return false;\n        for (var j = 1; j < len; j++) {\n            if (((data[i + j] & 255) & 192) !== 128) return false;\n        }\n        i += len;\n    }\n    return true;\n};`,
        typescript: `function validUtf8(data: number[]): boolean {\n    var i = 0;\n    while (i < data.length) {\n        var b = data[i] & 255;\n        var len: number;\n        if ((b & 128) === 0) len = 1;\n        else if ((b & 224) === 192) len = 2;\n        else if ((b & 240) === 224) len = 3;\n        else if ((b & 248) === 240) len = 4;\n        else return false;\n        if (i + len > data.length) return false;\n        for (var j = 1; j < len; j++) {\n            if (((data[i + j] & 255) & 192) !== 128) return false;\n        }\n        i += len;\n    }\n    return true;\n}`,
        java: `public static boolean validUtf8(int[] data) {\n    int i = 0;\n    while (i < data.length) {\n        int b = data[i] & 255;\n        int len;\n        if ((b & 128) == 0) len = 1;\n        else if ((b & 224) == 192) len = 2;\n        else if ((b & 240) == 224) len = 3;\n        else if ((b & 248) == 240) len = 4;\n        else return false;\n        if (i + len > data.length) return false;\n        for (int j = 1; j < len; j++) {\n            if (((data[i + j] & 255) & 192) != 128) return false;\n        }\n        i += len;\n    }\n    return true;\n}`,
        cpp: `bool validUtf8(vector<int>& data) {\n    int i = 0;\n    int n = (int) data.size();\n    while (i < n) {\n        int b = data[i] & 255;\n        int len;\n        if ((b & 128) == 0) len = 1;\n        else if ((b & 224) == 192) len = 2;\n        else if ((b & 240) == 224) len = 3;\n        else if ((b & 248) == 240) len = 4;\n        else return false;\n        if (i + len > n) return false;\n        for (int j = 1; j < len; j++) {\n            if (((data[i + j] & 255) & 192) != 128) return false;\n        }\n        i += len;\n    }\n    return true;\n}`,
        c: `bool validUtf8(int* data, int dataSize) {\n    int i = 0;\n    while (i < dataSize) {\n        int b = data[i] & 255;\n        int len;\n        if ((b & 128) == 0) len = 1;\n        else if ((b & 224) == 192) len = 2;\n        else if ((b & 240) == 224) len = 3;\n        else if ((b & 248) == 240) len = 4;\n        else return false;\n        if (i + len > dataSize) return false;\n        for (int j = 1; j < len; j++) {\n            if (((data[i + j] & 255) & 192) != 128) return false;\n        }\n        i += len;\n    }\n    return true;\n}`,
        csharp: `public static bool ValidUtf8(int[] data)\n{\n    int i = 0;\n    while (i < data.Length)\n    {\n        int b = data[i] & 255;\n        int len;\n        if ((b & 128) == 0) len = 1;\n        else if ((b & 224) == 192) len = 2;\n        else if ((b & 240) == 224) len = 3;\n        else if ((b & 248) == 240) len = 4;\n        else return false;\n        if (i + len > data.Length) return false;\n        for (int j = 1; j < len; j++)\n        {\n            if (((data[i + j] & 255) & 192) != 128) return false;\n        }\n        i += len;\n    }\n    return true;\n}`,
        go: `func validUtf8(data []int) bool {\n\ti := 0\n\tfor i < len(data) {\n\t\tb := data[i] & 255\n\t\tvar length int\n\t\tif b&128 == 0 {\n\t\t\tlength = 1\n\t\t} else if b&224 == 192 {\n\t\t\tlength = 2\n\t\t} else if b&240 == 224 {\n\t\t\tlength = 3\n\t\t} else if b&248 == 240 {\n\t\t\tlength = 4\n\t\t} else {\n\t\t\treturn false\n\t\t}\n\t\tif i+length > len(data) {\n\t\t\treturn false\n\t\t}\n\t\tfor j := 1; j < length; j++ {\n\t\t\tif (data[i+j]&255)&192 != 128 {\n\t\t\t\treturn false\n\t\t\t}\n\t\t}\n\t\ti += length\n\t}\n\treturn true\n}`,
        kotlin: `fun validUtf8(data: IntArray): Boolean {\n    var i = 0\n    while (i < data.size) {\n        val b = data[i] and 255\n        val len = when {\n            b and 128 == 0 -> 1\n            b and 224 == 192 -> 2\n            b and 240 == 224 -> 3\n            b and 248 == 240 -> 4\n            else -> return false\n        }\n        if (i + len > data.size) return false\n        for (j in 1 until len) {\n            if ((data[i + j] and 255) and 192 != 128) return false\n        }\n        i += len\n    }\n    return true\n}`,
        swift: `func validUtf8(_ data: [Int]) -> Bool {\n    var i = 0\n    while i < data.count {\n        let b = data[i] & 255\n        var len = 0\n        if b & 128 == 0 { len = 1 }\n        else if b & 224 == 192 { len = 2 }\n        else if b & 240 == 224 { len = 3 }\n        else if b & 248 == 240 { len = 4 }\n        else { return false }\n        if i + len > data.count { return false }\n        for j in 1..<max(len, 1) where j < len {\n            if (data[i + j] & 255) & 192 != 128 { return false }\n        }\n        i += len\n    }\n    return true\n}`,
        rust: `fn validUtf8(data: Vec<i32>) -> bool {\n    let mut i = 0usize;\n    while i < data.len() {\n        let b = data[i] & 255;\n        let len: usize;\n        if b & 128 == 0 {\n            len = 1;\n        } else if b & 224 == 192 {\n            len = 2;\n        } else if b & 240 == 224 {\n            len = 3;\n        } else if b & 248 == 240 {\n            len = 4;\n        } else {\n            return false;\n        }\n        if i + len > data.len() {\n            return false;\n        }\n        for j in 1..len {\n            if (data[i + j] & 255) & 192 != 128 {\n                return false;\n            }\n        }\n        i += len;\n    }\n    true\n}`,
        php: `function validUtf8($data) {\n    $i = 0;\n    $n = count($data);\n    while ($i < $n) {\n        $b = $data[$i] & 255;\n        if (($b & 128) === 0) $len = 1;\n        else if (($b & 224) === 192) $len = 2;\n        else if (($b & 240) === 224) $len = 3;\n        else if (($b & 248) === 240) $len = 4;\n        else return false;\n        if ($i + $len > $n) return false;\n        for ($j = 1; $j < $len; $j++) {\n            if ((($data[$i + $j] & 255) & 192) !== 128) return false;\n        }\n        $i += $len;\n    }\n    return true;\n}`,
        ruby: `def validUtf8(data)\n  i = 0\n  while i < data.length\n    b = data[i] & 255\n    len = if b & 128 == 0 then 1\n          elsif b & 224 == 192 then 2\n          elsif b & 240 == 224 then 3\n          elsif b & 248 == 240 then 4\n          else return false\n          end\n    return false if i + len > data.length\n    (1...len).each do |j|\n      return false if (data[i + j] & 255) & 192 != 128\n    end\n    i += len\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Longest Nice Subarray (LC 2401) ─────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let used = 0, left = 0, best = 0;
      for (let right = 0; right < nums.length; right++) {
        while ((used & nums[right]) !== 0) { used ^= nums[left]; left++; }
        used |= nums[right];
        if (right - left + 1 > best) best = right - left + 1;
      }
      return best;
    };
    return {
      slug: "longest-nice-subarray",
      title: "Longest Nice Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Sliding Window", "Amazon", "Google", "Uber"],
      signature: { funcName: "longestNiceSubarray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **nice** when every pair of its elements has a bitwise AND of `0` — that is, no two elements share a set bit.\n\nReturn the length of the longest nice subarray. A single element is always nice.",
        [
          { in: "nums = [1,3,8,48,10]", out: "3", note: "[3,8,48] uses disjoint bit sets." },
          { in: "nums = [3,1,5,11,13]", out: "1", note: "Every adjacent pair shares a bit." },
          { in: "nums = [1,2,4,8]", out: "4" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000"]),
      hints: [
        "Pairwise disjoint bits is the same as saying the OR of the window has exactly as many bits as the elements contribute — no overlap.",
        "Keep a running OR of the window. A new element fits exactly when `used AND nums[right]` is zero.",
        "When it does not fit, drop elements from the left, XOR-ing each out of the running OR.",
      ],
      editorial: explain({
        idea: "Because the elements in a nice window have disjoint bits, their OR doubles as an exact record of which bits are taken — and XOR removes an element's bits cleanly, since no other element shares them.",
        steps: [
          "Sweep `right` across the array keeping `used`, the OR of the current window.",
          "While `used & nums[right]` is non-zero, remove `nums[left]` with `used ^= nums[left]` and advance `left`.",
          "OR `nums[right]` into `used` and record the window length.",
        ],
        why: "Within a nice window every bit belongs to at most one element, so `used` is a disjoint union and `used ^ nums[left]` removes exactly that element's bits. The window is nice precisely when each new element's bits are free, which the AND test checks in constant time.",
        time: "O(n) — each index enters and leaves once",
        space: "O(1)",
        pitfalls: [
          "Using `used -= nums[left]` happens to work only because the bits are disjoint; XOR states the intent and survives a refactor.",
          "Checking only adjacent pairs is not enough — the condition is over **every** pair in the window.",
          "The answer is at least 1, since a lone element has no pairs to violate the rule.",
        ],
      }),
      examples: [
        { input: "[1,3,8,48,10]", expectedOutput: "3" },
        { input: "[3,1,5,11,13]", expectedOutput: "1" },
        { input: "[1,2,4,8]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = Array.from({ length: n }, () => (rng() < 0.5 ? Math.pow(2, ri(rng, 0, 9)) : ri(rng, 1, 1000)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef longestNiceSubarray(nums: List[int]) -> int:\n    used = left = best = 0\n    for right, x in enumerate(nums):\n        while used & x:\n            used ^= nums[left]\n            left += 1\n        used |= x\n        best = max(best, right - left + 1)\n    return best`,
        javascript: `var longestNiceSubarray = function(nums) {\n    var used = 0, left = 0, best = 0;\n    for (var right = 0; right < nums.length; right++) {\n        while ((used & nums[right]) !== 0) {\n            used ^= nums[left];\n            left++;\n        }\n        used |= nums[right];\n        if (right - left + 1 > best) best = right - left + 1;\n    }\n    return best;\n};`,
        typescript: `function longestNiceSubarray(nums: number[]): number {\n    var used = 0, left = 0, best = 0;\n    for (var right = 0; right < nums.length; right++) {\n        while ((used & nums[right]) !== 0) {\n            used ^= nums[left];\n            left++;\n        }\n        used |= nums[right];\n        if (right - left + 1 > best) best = right - left + 1;\n    }\n    return best;\n}`,
        java: `public static int longestNiceSubarray(int[] nums) {\n    int used = 0, left = 0, best = 0;\n    for (int right = 0; right < nums.length; right++) {\n        while ((used & nums[right]) != 0) {\n            used ^= nums[left];\n            left++;\n        }\n        used |= nums[right];\n        best = Math.max(best, right - left + 1);\n    }\n    return best;\n}`,
        cpp: `int longestNiceSubarray(vector<int>& nums) {\n    int used = 0, left = 0, best = 0;\n    for (int right = 0; right < (int) nums.size(); right++) {\n        while (used & nums[right]) {\n            used ^= nums[left];\n            left++;\n        }\n        used |= nums[right];\n        best = max(best, right - left + 1);\n    }\n    return best;\n}`,
        c: `int longestNiceSubarray(int* nums, int numsSize) {\n    int used = 0, left = 0, best = 0;\n    for (int right = 0; right < numsSize; right++) {\n        while (used & nums[right]) {\n            used ^= nums[left];\n            left++;\n        }\n        used |= nums[right];\n        if (right - left + 1 > best) best = right - left + 1;\n    }\n    return best;\n}`,
        csharp: `public static int LongestNiceSubarray(int[] nums)\n{\n    int used = 0, left = 0, best = 0;\n    for (int right = 0; right < nums.Length; right++)\n    {\n        while ((used & nums[right]) != 0)\n        {\n            used ^= nums[left];\n            left++;\n        }\n        used |= nums[right];\n        if (right - left + 1 > best) best = right - left + 1;\n    }\n    return best;\n}`,
        go: `func longestNiceSubarray(nums []int) int {\n\tused, left, best := 0, 0, 0\n\tfor right := 0; right < len(nums); right++ {\n\t\tfor used&nums[right] != 0 {\n\t\t\tused ^= nums[left]\n\t\t\tleft++\n\t\t}\n\t\tused |= nums[right]\n\t\tif right-left+1 > best {\n\t\t\tbest = right - left + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun longestNiceSubarray(nums: IntArray): Int {\n    var used = 0\n    var left = 0\n    var best = 0\n    for (right in nums.indices) {\n        while (used and nums[right] != 0) {\n            used = used xor nums[left]\n            left++\n        }\n        used = used or nums[right]\n        if (right - left + 1 > best) best = right - left + 1\n    }\n    return best\n}`,
        swift: `func longestNiceSubarray(_ nums: [Int]) -> Int {\n    var used = 0\n    var left = 0\n    var best = 0\n    for right in 0..<nums.count {\n        while used & nums[right] != 0 {\n            used ^= nums[left]\n            left += 1\n        }\n        used |= nums[right]\n        if right - left + 1 > best { best = right - left + 1 }\n    }\n    return best\n}`,
        rust: `fn longestNiceSubarray(nums: Vec<i32>) -> i32 {\n    let mut used = 0i32;\n    let mut left = 0usize;\n    let mut best = 0i32;\n    for right in 0..nums.len() {\n        while used & nums[right] != 0 {\n            used ^= nums[left];\n            left += 1;\n        }\n        used |= nums[right];\n        let len = (right + 1 - left) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function longestNiceSubarray($nums) {\n    $used = 0;\n    $left = 0;\n    $best = 0;\n    for ($right = 0; $right < count($nums); $right++) {\n        while (($used & $nums[$right]) !== 0) {\n            $used ^= $nums[$left];\n            $left++;\n        }\n        $used |= $nums[$right];\n        if ($right - $left + 1 > $best) $best = $right - $left + 1;\n    }\n    return $best;\n}`,
        ruby: `def longestNiceSubarray(nums)\n  used = 0\n  left = 0\n  best = 0\n  nums.each_with_index do |x, right|\n    while used & x != 0\n      used ^= nums[left]\n      left += 1\n    end\n    used |= x\n    best = right - left + 1 if right - left + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find the Longest Substring Containing Vowels in Even Counts (LC 1371) ──
  (() => {
    const ref = (s: string) => {
      const first: Record<string, number> = { "0": -1 };
      let state = 0, best = 0;
      for (let i = 0; i < s.length; i++) {
        const idx = "aeiou".indexOf(s.charAt(i));
        if (idx >= 0) state ^= 1 << idx;
        const key = String(state);
        if (first[key] === undefined) first[key] = i;
        else if (i - first[key] > best) best = i - first[key];
      }
      return best;
    };
    return {
      slug: "find-the-longest-substring-containing-vowels-in-even-counts",
      title: "Find the Longest Substring Containing Vowels in Even Counts",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Hash Table", "String", "Prefix Sum", "Amazon", "Google", "Meta"],
      signature: { funcName: "findTheLongestSubstring", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Return the length of the longest substring of `s` in which each of the five vowels `a`, `e`, `i`, `o` and `u` appears an **even** number of times. Zero counts as even.",
        [
          { in: 's = "eleetminicoworoep"', out: "13", note: '"leetminicowor" has two e\'s, two o\'s and two i\'s.' },
          { in: 's = "leetcodeisgreat"', out: "5", note: '"leetc" has two e\'s and no other vowel.' },
          { in: 's = "bcbcbc"', out: "6", note: "No vowels at all, so the whole string qualifies." },
        ],
        ["1 <= s.length <= 100000", "s consists of lowercase English letters."]),
      hints: [
        "Only the **parity** of each vowel count matters, which is five bits of state.",
        "A substring has all-even vowel counts exactly when the parity state at its two ends is the same.",
        "So record the first index at which each of the 32 states appears and measure the widest repeat.",
      ],
      editorial: explain({
        idea: "Track a 5-bit parity mask over the vowels. Two positions with the same mask bracket a substring where every vowel appeared an even number of times, so the answer is the widest gap between equal masks.",
        steps: [
          "Start with state `0` recorded at index `-1`, standing for the empty prefix.",
          "Sweep the string, toggling the bit for each vowel encountered.",
          "If the current state has not been seen, record its index; otherwise the candidate length is `i - first[state]`.",
          "Return the largest candidate.",
        ],
        why: "The parity mask is the XOR of the vowel indicators seen so far. Equal masks at positions `i < j` mean every vowel toggled an even number of times in between. Keeping only the first occurrence of each state maximises the distance, and seeding state `0` at `-1` lets the answer start at index 0.",
        time: "O(n)",
        space: "O(32)",
        pitfalls: [
          "Overwriting the stored index gives the shortest such substring, not the longest.",
          "Forgetting the `-1` seed misses substrings that begin at the start of the string.",
          "Non-vowel characters leave the state untouched, which is what makes an all-consonant string fully qualify.",
        ],
      }),
      examples: [
        { input: '"eleetminicoworoep"', expectedOutput: "13" },
        { input: '"leetcodeisgreat"', expectedOutput: "5" },
        { input: '"bcbcbc"', expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "aeioubc" : "abcdefghijklmnop";
        const s = randLower(rng, 1, 60, alphabet);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def findTheLongestSubstring(s: str) -> int:\n    first = {0: -1}\n    state = 0\n    best = 0\n    for i, c in enumerate(s):\n        idx = "aeiou".find(c)\n        if idx >= 0:\n            state ^= 1 << idx\n        if state in first:\n            best = max(best, i - first[state])\n        else:\n            first[state] = i\n    return best`,
        javascript: `var findTheLongestSubstring = function(s) {\n    var first = {};\n    first["0"] = -1;\n    var state = 0, best = 0;\n    for (var i = 0; i < s.length; i++) {\n        var idx = "aeiou".indexOf(s.charAt(i));\n        if (idx >= 0) state ^= 1 << idx;\n        var key = String(state);\n        if (first[key] === undefined) first[key] = i;\n        else if (i - first[key] > best) best = i - first[key];\n    }\n    return best;\n};`,
        typescript: `function findTheLongestSubstring(s: string): number {\n    var first: { [key: string]: number } = {};\n    first["0"] = -1;\n    var state = 0, best = 0;\n    for (var i = 0; i < s.length; i++) {\n        var idx = "aeiou".indexOf(s.charAt(i));\n        if (idx >= 0) state ^= 1 << idx;\n        var key = String(state);\n        if (first[key] === undefined) first[key] = i;\n        else if (i - first[key] > best) best = i - first[key];\n    }\n    return best;\n}`,
        java: `public static int findTheLongestSubstring(String s) {\n    int[] first = new int[32];\n    Arrays.fill(first, -2);\n    first[0] = -1;\n    int state = 0, best = 0;\n    String vowels = "aeiou";\n    for (int i = 0; i < s.length(); i++) {\n        int idx = vowels.indexOf(s.charAt(i));\n        if (idx >= 0) state ^= 1 << idx;\n        if (first[state] == -2) first[state] = i;\n        else best = Math.max(best, i - first[state]);\n    }\n    return best;\n}`,
        cpp: `int findTheLongestSubstring(string s) {\n    vector<int> first(32, -2);\n    first[0] = -1;\n    int state = 0, best = 0;\n    string vowels = "aeiou";\n    for (int i = 0; i < (int) s.size(); i++) {\n        size_t idx = vowels.find(s[i]);\n        if (idx != string::npos) state ^= 1 << (int) idx;\n        if (first[state] == -2) first[state] = i;\n        else best = max(best, i - first[state]);\n    }\n    return best;\n}`,
        c: `int findTheLongestSubstring(char* s) {\n    int first[32];\n    for (int i = 0; i < 32; i++) first[i] = -2;\n    first[0] = -1;\n    int state = 0, best = 0;\n    const char* vowels = "aeiou";\n    for (int i = 0; s[i]; i++) {\n        int idx = -1;\n        for (int v = 0; v < 5; v++) {\n            if (vowels[v] == s[i]) { idx = v; break; }\n        }\n        if (idx >= 0) state ^= 1 << idx;\n        if (first[state] == -2) first[state] = i;\n        else if (i - first[state] > best) best = i - first[state];\n    }\n    return best;\n}`,
        csharp: `public static int FindTheLongestSubstring(string s)\n{\n    int[] first = new int[32];\n    for (int i = 0; i < 32; i++) first[i] = -2;\n    first[0] = -1;\n    int state = 0, best = 0;\n    string vowels = "aeiou";\n    for (int i = 0; i < s.Length; i++)\n    {\n        int idx = vowels.IndexOf(s[i]);\n        if (idx >= 0) state ^= 1 << idx;\n        if (first[state] == -2) first[state] = i;\n        else if (i - first[state] > best) best = i - first[state];\n    }\n    return best;\n}`,
        go: `func findTheLongestSubstring(s string) int {\n\tfirst := make([]int, 32)\n\tfor i := range first {\n\t\tfirst[i] = -2\n\t}\n\tfirst[0] = -1\n\tstate, best := 0, 0\n\tfor i := 0; i < len(s); i++ {\n\t\tidx := strings.IndexByte("aeiou", s[i])\n\t\tif idx >= 0 {\n\t\t\tstate ^= 1 << uint(idx)\n\t\t}\n\t\tif first[state] == -2 {\n\t\t\tfirst[state] = i\n\t\t} else if i-first[state] > best {\n\t\t\tbest = i - first[state]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findTheLongestSubstring(s: String): Int {\n    val first = IntArray(32) { -2 }\n    first[0] = -1\n    var state = 0\n    var best = 0\n    for (i in s.indices) {\n        val idx = "aeiou".indexOf(s[i])\n        if (idx >= 0) state = state xor (1 shl idx)\n        if (first[state] == -2) first[state] = i\n        else if (i - first[state] > best) best = i - first[state]\n    }\n    return best\n}`,
        swift: `func findTheLongestSubstring(_ s: String) -> Int {\n    var first = [Int](repeating: -2, count: 32)\n    first[0] = -1\n    var state = 0\n    var best = 0\n    let vowels: [Character] = ["a", "e", "i", "o", "u"]\n    let a = Array(s)\n    for i in 0..<a.count {\n        if let idx = vowels.firstIndex(of: a[i]) {\n            state ^= 1 << idx\n        }\n        if first[state] == -2 { first[state] = i }\n        else if i - first[state] > best { best = i - first[state] }\n    }\n    return best\n}`,
        rust: `fn findTheLongestSubstring(s: String) -> i32 {\n    let mut first = [-2i32; 32];\n    first[0] = -1;\n    let mut state = 0usize;\n    let mut best = 0i32;\n    let vowels = b"aeiou";\n    for (i, &c) in s.as_bytes().iter().enumerate() {\n        if let Some(idx) = vowels.iter().position(|&v| v == c) {\n            state ^= 1 << idx;\n        }\n        let idx32 = i as i32;\n        if first[state] == -2 {\n            first[state] = idx32;\n        } else if idx32 - first[state] > best {\n            best = idx32 - first[state];\n        }\n    }\n    best\n}`,
        php: `function findTheLongestSubstring($s) {\n    $first = array_fill(0, 32, -2);\n    $first[0] = -1;\n    $state = 0;\n    $best = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $idx = strpos("aeiou", $s[$i]);\n        if ($idx !== false) $state ^= 1 << $idx;\n        if ($first[$state] === -2) $first[$state] = $i;\n        else if ($i - $first[$state] > $best) $best = $i - $first[$state];\n    }\n    return $best;\n}`,
        ruby: `def findTheLongestSubstring(s)\n  first = Array.new(32, -2)\n  first[0] = -1\n  state = 0\n  best = 0\n  s.each_char.with_index do |c, i|\n    idx = "aeiou".index(c)\n    state ^= 1 << idx if idx\n    if first[state] == -2\n      first[state] = i\n    elsif i - first[state] > best\n      best = i - first[state]\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Bitwise ORs of Subarrays (LC 898) ───────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const seen: Record<string, boolean> = {};
      let cur: number[] = [];
      for (const x of arr) {
        const next: number[] = [];
        const local: Record<string, boolean> = {};
        const add = (v: number) => {
          const k = String(v);
          if (local[k] !== true) { local[k] = true; next.push(v); }
          seen[k] = true;
        };
        add(x);
        for (const v of cur) add(v | x);
        cur = next;
      }
      return Object.keys(seen).length;
    };
    return {
      slug: "bitwise-ors-of-subarrays",
      title: "Bitwise ORs of Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Dynamic Programming", "Google", "Amazon", "Meta"],
      signature: { funcName: "subarrayBitwiseORs", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Compute the bitwise OR of every contiguous non-empty subarray of `arr`.\n\nReturn how many **distinct** values appear among those results.",
        [
          { in: "arr = [0]", out: "1", note: "The only subarray ORs to 0." },
          { in: "arr = [1,1,2]", out: "3", note: "The distinct results are 1, 2 and 3." },
          { in: "arr = [1,2,4]", out: "6", note: "1, 2, 3, 4, 6 and 7." },
        ],
        ["1 <= arr.length <= 5000", "0 <= arr[i] <= 1000000000"]),
      hints: [
        "Enumerating all subarrays is `O(n²)` values — too many at the upper limit.",
        "Track the set of ORs of subarrays **ending** at the current index.",
        "That set stays small — at most about 30 values — because each new element can only add bits.",
      ],
      editorial: explain({
        idea: "Carry forward the set of ORs of subarrays ending at each position. Extending every one of them by the next element, plus the element alone, gives the next position's set — and that set can only be about 30 values wide, because ORs along a fixed right endpoint form a chain that only ever gains bits.",
        steps: [
          "Keep `cur`, the distinct ORs of subarrays ending at the previous index, starting empty.",
          "For each element `x`, build the next set as `{x} ∪ {v | x : v in cur}`, deduplicated.",
          "Add every value produced to a global result set.",
          "Return the global set's size.",
        ],
        why: "Fixing the right endpoint and extending leftwards produces a non-decreasing chain of ORs, and each strict increase sets at least one new bit — so at most 30 distinct values survive per position. That keeps the total work near `O(n · 30)` instead of `O(n²)`.",
        time: "O(n · 30)",
        space: "O(number of distinct ORs)",
        pitfalls: [
          "Failing to deduplicate `cur` lets it grow linearly and the solution degrades to `O(n²)`.",
          "Forgetting the single-element subarray `{x}` misses values that no extension produces.",
          "The global set can hold many values; it is `cur` that stays small, not the answer.",
        ],
      }),
      examples: [
        { input: "[0]", expectedOutput: "1" },
        { input: "[1,1,2]", expectedOutput: "3" },
        { input: "[1,2,4]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 16 : 1000000000;
        const arr = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef subarrayBitwiseORs(arr: List[int]) -> int:\n    seen = set()\n    cur = set()\n    for x in arr:\n        cur = {x} | {v | x for v in cur}\n        seen |= cur\n    return len(seen)`,
        javascript: `var subarrayBitwiseORs = function(arr) {\n    var seen = {}, cur = [];\n    for (var i = 0; i < arr.length; i++) {\n        var x = arr[i];\n        var next = [], local = {};\n        var add = function(v) {\n            var k = String(v);\n            if (local[k] !== true) { local[k] = true; next.push(v); }\n            seen[k] = true;\n        };\n        add(x);\n        for (var j = 0; j < cur.length; j++) add(cur[j] | x);\n        cur = next;\n    }\n    return Object.keys(seen).length;\n};`,
        typescript: `function subarrayBitwiseORs(arr: number[]): number {\n    var seen: { [key: string]: boolean } = {}, cur: number[] = [];\n    for (var i = 0; i < arr.length; i++) {\n        var x = arr[i];\n        var next: number[] = [], local: { [key: string]: boolean } = {};\n        var add = function(v: number) {\n            var k = String(v);\n            if (local[k] !== true) { local[k] = true; next.push(v); }\n            seen[k] = true;\n        };\n        add(x);\n        for (var j = 0; j < cur.length; j++) add(cur[j] | x);\n        cur = next;\n    }\n    return Object.keys(seen).length;\n}`,
        java: `public static int subarrayBitwiseORs(int[] arr) {\n    Set<Integer> seen = new HashSet<>();\n    Set<Integer> cur = new HashSet<>();\n    for (int x : arr) {\n        Set<Integer> next = new HashSet<>();\n        next.add(x);\n        for (int v : cur) next.add(v | x);\n        cur = next;\n        seen.addAll(cur);\n    }\n    return seen.size();\n}`,
        cpp: `int subarrayBitwiseORs(vector<int>& arr) {\n    unordered_set<int> seen, cur;\n    for (int x : arr) {\n        unordered_set<int> next;\n        next.insert(x);\n        for (int v : cur) next.insert(v | x);\n        cur = next;\n        for (int v : cur) seen.insert(v);\n    }\n    return (int) seen.size();\n}`,
        c: `int subarrayBitwiseORs(int* arr, int arrSize) {\n    int cap = arrSize * 32 + 8;\n    int* seen = (int*) malloc((size_t) cap * sizeof(int));\n    int sc = 0;\n    int* cur = (int*) malloc(64 * sizeof(int));\n    int* next = (int*) malloc(64 * sizeof(int));\n    int cc = 0;\n    for (int i = 0; i < arrSize; i++) {\n        int nc = 0;\n        next[nc++] = arr[i];\n        for (int j = 0; j < cc; j++) {\n            int v = cur[j] | arr[i];\n            int dup = 0;\n            for (int t = 0; t < nc; t++) {\n                if (next[t] == v) { dup = 1; break; }\n            }\n            if (!dup && nc < 64) next[nc++] = v;\n        }\n        for (int t = 0; t < nc; t++) {\n            int dup = 0;\n            for (int u = 0; u < sc; u++) {\n                if (seen[u] == next[t]) { dup = 1; break; }\n            }\n            if (!dup) seen[sc++] = next[t];\n            cur[t] = next[t];\n        }\n        cc = nc;\n    }\n    free(seen);\n    free(cur);\n    free(next);\n    return sc;\n}`,
        csharp: `public static int SubarrayBitwiseORs(int[] arr)\n{\n    var seen = new HashSet<int>();\n    var cur = new HashSet<int>();\n    foreach (int x in arr)\n    {\n        var next = new HashSet<int>();\n        next.Add(x);\n        foreach (int v in cur) next.Add(v | x);\n        cur = next;\n        foreach (int v in cur) seen.Add(v);\n    }\n    return seen.Count;\n}`,
        go: `func subarrayBitwiseORs(arr []int) int {\n\tseen := map[int]bool{}\n\tcur := map[int]bool{}\n\tfor _, x := range arr {\n\t\tnext := map[int]bool{x: true}\n\t\tfor v := range cur {\n\t\t\tnext[v|x] = true\n\t\t}\n\t\tcur = next\n\t\tfor v := range cur {\n\t\t\tseen[v] = true\n\t\t}\n\t}\n\treturn len(seen)\n}`,
        kotlin: `fun subarrayBitwiseORs(arr: IntArray): Int {\n    val seen = HashSet<Int>()\n    var cur = HashSet<Int>()\n    for (x in arr) {\n        val next = HashSet<Int>()\n        next.add(x)\n        for (v in cur) next.add(v or x)\n        cur = next\n        seen.addAll(cur)\n    }\n    return seen.size\n}`,
        swift: `func subarrayBitwiseORs(_ arr: [Int]) -> Int {\n    var seen = Set<Int>()\n    var cur = Set<Int>()\n    for x in arr {\n        var next = Set<Int>()\n        next.insert(x)\n        for v in cur { next.insert(v | x) }\n        cur = next\n        seen.formUnion(cur)\n    }\n    return seen.count\n}`,
        rust: `fn subarrayBitwiseORs(arr: Vec<i32>) -> i32 {\n    let mut seen: std::collections::HashSet<i32> = std::collections::HashSet::new();\n    let mut cur: std::collections::HashSet<i32> = std::collections::HashSet::new();\n    for &x in arr.iter() {\n        let mut next: std::collections::HashSet<i32> = std::collections::HashSet::new();\n        next.insert(x);\n        for &v in cur.iter() {\n            next.insert(v | x);\n        }\n        cur = next;\n        for &v in cur.iter() {\n            seen.insert(v);\n        }\n    }\n    seen.len() as i32\n}`,
        php: `function subarrayBitwiseORs($arr) {\n    $seen = array();\n    $cur = array();\n    foreach ($arr as $x) {\n        $next = array($x => true);\n        foreach ($cur as $v => $ignored) $next[$v | $x] = true;\n        $cur = $next;\n        foreach ($cur as $v => $ignored) $seen[$v] = true;\n    }\n    return count($seen);\n}`,
        ruby: `def subarrayBitwiseORs(arr)\n  seen = {}\n  cur = {}\n  arr.each do |x|\n    nxt = { x => true }\n    cur.each_key { |v| nxt[v | x] = true }\n    cur = nxt\n    cur.each_key { |v| seen[v] = true }\n  end\n  seen.size\nend`,
      },
    };
  })(),

  // ── Number of Wonderful Substrings (LC 1915) ────────────────────
  (() => {
    const ref = (word: string) => {
      const count = new Array(1024).fill(0);
      count[0] = 1;
      let state = 0, total = 0;
      for (let i = 0; i < word.length; i++) {
        state ^= 1 << (word.charCodeAt(i) - 97);
        total += count[state];
        for (let b = 0; b < 10; b++) total += count[state ^ (1 << b)];
        count[state]++;
      }
      return total;
    };
    return {
      slug: "number-of-wonderful-substrings",
      title: "Number of Wonderful Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Hash Table", "String", "Prefix Sum", "Amazon", "Google", "Meta"],
      signature: { funcName: "wonderfulSubstrings", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A string is **wonderful** if at most one of its letters occurs an odd number of times. The letters are drawn from `a` through `j`.\n\nReturn the number of wonderful non-empty substrings of `word`. Substrings at different positions count separately.",
        [
          { in: 'word = "aba"', out: "4", note: 'The wonderful substrings are "a", "b", "a" and "aba".' },
          { in: 'word = "aabb"', out: "9" },
          { in: 'word = "he"', out: "2", note: "Each single character is wonderful; \"he\" has two odd counts." },
        ],
        ["1 <= word.length <= 1000", "word consists of letters from a to j."]),
      hints: [
        "Only the parity of each letter matters, and there are ten letters — so the state is a 10-bit mask.",
        "A substring is wonderful when the XOR of the two end states has at most one set bit.",
        "Tally how often each of the 1024 states has occurred, then for each prefix add the tally of the same state plus the tallies of the ten states one bit away.",
      ],
      editorial: explain({
        idea: "Track a 10-bit parity mask. A substring's letter parities are the XOR of the masks at its ends, so 'at most one odd letter' means that XOR is zero or a single bit — eleven possibilities to look up per position.",
        steps: [
          "Keep `count[1024]`, seeded with `count[0] = 1` for the empty prefix.",
          "Sweep the string, toggling the bit of each letter into `state`.",
          "Add `count[state]` (zero odd letters) and `count[state ^ (1 << b)]` for each of the ten bits (exactly one odd letter).",
          "Increment `count[state]` and continue.",
        ],
        why: "For a substring ending at the current index and starting after an earlier prefix, the parity pattern is `state ^ earlierState`. That has at most one set bit exactly when `earlierState` equals `state` or differs from it in one position — which is precisely the eleven lookups.",
        time: "O(n · 10)",
        space: "O(1024)",
        pitfalls: [
          "Omitting the `count[0] = 1` seed drops every substring that starts at index 0.",
          "Incrementing `count[state]` before the lookups counts the current prefix against itself.",
          "At LeetCode's real length limit the answer exceeds 32 bits; this version caps the length so it fits.",
        ],
      }),
      examples: [
        { input: '"aba"', expectedOutput: "4" },
        { input: '"aabb"', expectedOutput: "9" },
        { input: '"he"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "abc" : "abcdefghij";
        const word = randLower(rng, 1, 60, alphabet);
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: `def wonderfulSubstrings(word: str) -> int:\n    count = [0] * 1024\n    count[0] = 1\n    state = 0\n    total = 0\n    for ch in word:\n        state ^= 1 << (ord(ch) - 97)\n        total += count[state]\n        for b in range(10):\n            total += count[state ^ (1 << b)]\n        count[state] += 1\n    return total`,
        javascript: `var wonderfulSubstrings = function(word) {\n    var count = [];\n    for (var t = 0; t < 1024; t++) count.push(0);\n    count[0] = 1;\n    var state = 0, total = 0;\n    for (var i = 0; i < word.length; i++) {\n        state ^= 1 << (word.charCodeAt(i) - 97);\n        total += count[state];\n        for (var b = 0; b < 10; b++) total += count[state ^ (1 << b)];\n        count[state]++;\n    }\n    return total;\n};`,
        typescript: `function wonderfulSubstrings(word: string): number {\n    var count: number[] = [];\n    for (var t = 0; t < 1024; t++) count.push(0);\n    count[0] = 1;\n    var state = 0, total = 0;\n    for (var i = 0; i < word.length; i++) {\n        state ^= 1 << (word.charCodeAt(i) - 97);\n        total += count[state];\n        for (var b = 0; b < 10; b++) total += count[state ^ (1 << b)];\n        count[state]++;\n    }\n    return total;\n}`,
        java: `public static int wonderfulSubstrings(String word) {\n    int[] count = new int[1024];\n    count[0] = 1;\n    int state = 0;\n    long total = 0;\n    for (int i = 0; i < word.length(); i++) {\n        state ^= 1 << (word.charAt(i) - 'a');\n        total += count[state];\n        for (int b = 0; b < 10; b++) total += count[state ^ (1 << b)];\n        count[state]++;\n    }\n    return (int) total;\n}`,
        cpp: `int wonderfulSubstrings(string word) {\n    vector<int> count(1024, 0);\n    count[0] = 1;\n    int state = 0;\n    long long total = 0;\n    for (char c : word) {\n        state ^= 1 << (c - 'a');\n        total += count[state];\n        for (int b = 0; b < 10; b++) total += count[state ^ (1 << b)];\n        count[state]++;\n    }\n    return (int) total;\n}`,
        c: `int wonderfulSubstrings(char* word) {\n    int count[1024];\n    memset(count, 0, sizeof(count));\n    count[0] = 1;\n    int state = 0;\n    long long total = 0;\n    for (int i = 0; word[i]; i++) {\n        state ^= 1 << (word[i] - 'a');\n        total += count[state];\n        for (int b = 0; b < 10; b++) total += count[state ^ (1 << b)];\n        count[state]++;\n    }\n    return (int) total;\n}`,
        csharp: `public static int WonderfulSubstrings(string word)\n{\n    int[] count = new int[1024];\n    count[0] = 1;\n    int state = 0;\n    long total = 0;\n    foreach (char c in word)\n    {\n        state ^= 1 << (c - 'a');\n        total += count[state];\n        for (int b = 0; b < 10; b++) total += count[state ^ (1 << b)];\n        count[state]++;\n    }\n    return (int) total;\n}`,
        go: `func wonderfulSubstrings(word string) int {\n\tcount := make([]int, 1024)\n\tcount[0] = 1\n\tstate := 0\n\ttotal := 0\n\tfor i := 0; i < len(word); i++ {\n\t\tstate ^= 1 << uint(word[i]-\'a\')\n\t\ttotal += count[state]\n\t\tfor b := 0; b < 10; b++ {\n\t\t\ttotal += count[state^(1<<uint(b))]\n\t\t}\n\t\tcount[state]++\n\t}\n\treturn total\n}`,
        kotlin: `fun wonderfulSubstrings(word: String): Int {\n    val count = IntArray(1024)\n    count[0] = 1\n    var state = 0\n    var total = 0L\n    for (c in word) {\n        state = state xor (1 shl (c - \'a\'))\n        total += count[state]\n        for (b in 0 until 10) total += count[state xor (1 shl b)]\n        count[state]++\n    }\n    return total.toInt()\n}`,
        swift: `func wonderfulSubstrings(_ word: String) -> Int {\n    var count = [Int](repeating: 0, count: 1024)\n    count[0] = 1\n    var state = 0\n    var total = 0\n    for c in word.utf8 {\n        state ^= 1 << (Int(c) - 97)\n        total += count[state]\n        for b in 0..<10 { total += count[state ^ (1 << b)] }\n        count[state] += 1\n    }\n    return total\n}`,
        rust: `fn wonderfulSubstrings(word: String) -> i32 {\n    let mut count = vec![0i64; 1024];\n    count[0] = 1;\n    let mut state = 0usize;\n    let mut total: i64 = 0;\n    for &c in word.as_bytes() {\n        state ^= 1 << (c - b\'a\');\n        total += count[state];\n        for b in 0..10 {\n            total += count[state ^ (1 << b)];\n        }\n        count[state] += 1;\n    }\n    total as i32\n}`,
        php: `function wonderfulSubstrings($word) {\n    $count = array_fill(0, 1024, 0);\n    $count[0] = 1;\n    $state = 0;\n    $total = 0;\n    for ($i = 0; $i < strlen($word); $i++) {\n        $state ^= 1 << (ord($word[$i]) - 97);\n        $total += $count[$state];\n        for ($b = 0; $b < 10; $b++) $total += $count[$state ^ (1 << $b)];\n        $count[$state]++;\n    }\n    return $total;\n}`,
        ruby: `def wonderfulSubstrings(word)\n  count = Array.new(1024, 0)\n  count[0] = 1\n  state = 0\n  total = 0\n  word.each_byte do |c|\n    state ^= 1 << (c - 97)\n    total += count[state]\n    (0...10).each { |b| total += count[state ^ (1 << b)] }\n    count[state] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Minimum Array End (LC 3133) ─────────────────────────────────
  (() => {
    const ref = (n: number, x: number) => {
      let result = x;
      let rest = n - 1;
      let bit = 0;
      while (rest > 0) {
        if (((x >> bit) & 1) === 0) {
          if (rest & 1) result |= 1 << bit;
          rest >>= 1;
        }
        bit++;
      }
      return result;
    };
    return {
      slug: "minimum-array-end",
      title: "Minimum Array End",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Greedy", "Amazon", "Google", "Adobe"],
      signature: { funcName: "minEnd", params: [{ name: "n", type: "int" as const }, { name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Build a **strictly increasing** array of `n` positive integers whose bitwise AND is exactly `x`.\n\nReturn the smallest possible value of the last element.",
        [
          { in: "n = 3, x = 4", out: "6", note: "The array [4,5,6] has AND 4 and ends at 6." },
          { in: "n = 2, x = 7", out: "15", note: "[7,15] is the cheapest pair whose AND is 7." },
          { in: "n = 1, x = 9", out: "9", note: "A single element is its own AND." },
        ],
        ["1 <= n <= 1000", "1 <= x <= 1000"]),
      hints: [
        "Every element must contain all of `x`'s set bits, so the elements are `x` with extra bits added in the positions where `x` is zero.",
        "Those free positions can be filled independently, which makes the `n` smallest valid values correspond to the numbers `0, 1, …, n - 1` written into the free slots.",
        "So spread the binary digits of `n - 1` into `x`'s zero positions, from the low end upward.",
      ],
      editorial: explain({
        idea: "A value has AND-compatible bits exactly when it is a superset of `x`. The valid values in increasing order are obtained by writing `0, 1, 2, …` into the zero positions of `x`, so the `n`-th one embeds `n - 1`.",
        steps: [
          "Start with `result = x` and `rest = n - 1`.",
          "Walk bit positions upward. When `x` has a zero at that position, consume the lowest remaining bit of `rest` and set it in `result` if it is 1.",
          "Stop once `rest` is exhausted.",
        ],
        why: "Every element must be a superset of `x`, and the AND of all of them is `x` as long as each free bit is zero in at least one element — which holds because the first element is `x` itself. Ordering the supersets by the value packed into the free slots is exactly ordering them numerically, so the `n`-th is the one holding `n - 1`.",
        time: "O(log n + log x)",
        space: "O(1)",
        pitfalls: [
          "Using `n` instead of `n - 1` overshoots by one element.",
          "Writing the spare bits into positions where `x` already has ones would not increase the count of distinct values.",
          "At LeetCode's real limits the answer needs 64 bits; this version caps `n` and `x` so it fits in `int`.",
        ],
      }),
      examples: [
        { input: "3\n4", expectedOutput: "6" },
        { input: "2\n7", expectedOutput: "15" },
        { input: "1\n9", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        const x = ri(rng, 1, 1000);
        return { input: `${n}\n${x}`, expectedOutput: String(ref(n, x)) };
      },
      solutions: {
        python: `def minEnd(n: int, x: int) -> int:\n    result = x\n    rest = n - 1\n    bit = 0\n    while rest > 0:\n        if not ((x >> bit) & 1):\n            if rest & 1:\n                result |= 1 << bit\n            rest >>= 1\n        bit += 1\n    return result`,
        javascript: `var minEnd = function(n, x) {\n    var result = x;\n    var rest = n - 1;\n    var bit = 0;\n    while (rest > 0) {\n        if (((x >> bit) & 1) === 0) {\n            if (rest & 1) result |= 1 << bit;\n            rest >>= 1;\n        }\n        bit++;\n    }\n    return result;\n};`,
        typescript: `function minEnd(n: number, x: number): number {\n    var result = x;\n    var rest = n - 1;\n    var bit = 0;\n    while (rest > 0) {\n        if (((x >> bit) & 1) === 0) {\n            if (rest & 1) result |= 1 << bit;\n            rest >>= 1;\n        }\n        bit++;\n    }\n    return result;\n}`,
        java: `public static int minEnd(int n, int x) {\n    int result = x;\n    int rest = n - 1;\n    int bit = 0;\n    while (rest > 0) {\n        if (((x >> bit) & 1) == 0) {\n            if ((rest & 1) == 1) result |= 1 << bit;\n            rest >>= 1;\n        }\n        bit++;\n    }\n    return result;\n}`,
        cpp: `int minEnd(int n, int x) {\n    int result = x;\n    int rest = n - 1;\n    int bit = 0;\n    while (rest > 0) {\n        if (((x >> bit) & 1) == 0) {\n            if (rest & 1) result |= 1 << bit;\n            rest >>= 1;\n        }\n        bit++;\n    }\n    return result;\n}`,
        c: `int minEnd(int n, int x) {\n    int result = x;\n    int rest = n - 1;\n    int bit = 0;\n    while (rest > 0) {\n        if (((x >> bit) & 1) == 0) {\n            if (rest & 1) result |= 1 << bit;\n            rest >>= 1;\n        }\n        bit++;\n    }\n    return result;\n}`,
        csharp: `public static int MinEnd(int n, int x)\n{\n    int result = x;\n    int rest = n - 1;\n    int bit = 0;\n    while (rest > 0)\n    {\n        if (((x >> bit) & 1) == 0)\n        {\n            if ((rest & 1) == 1) result |= 1 << bit;\n            rest >>= 1;\n        }\n        bit++;\n    }\n    return result;\n}`,
        go: `func minEnd(n int, x int) int {\n\tresult := x\n\trest := n - 1\n\tbit := uint(0)\n\tfor rest > 0 {\n\t\tif (x>>bit)&1 == 0 {\n\t\t\tif rest&1 == 1 {\n\t\t\t\tresult |= 1 << bit\n\t\t\t}\n\t\t\trest >>= 1\n\t\t}\n\t\tbit++\n\t}\n\treturn result\n}`,
        kotlin: `fun minEnd(n: Int, x: Int): Int {\n    var result = x\n    var rest = n - 1\n    var bit = 0\n    while (rest > 0) {\n        if ((x shr bit) and 1 == 0) {\n            if (rest and 1 == 1) result = result or (1 shl bit)\n            rest = rest shr 1\n        }\n        bit++\n    }\n    return result\n}`,
        swift: `func minEnd(_ n: Int, _ x: Int) -> Int {\n    var result = x\n    var rest = n - 1\n    var bit = 0\n    while rest > 0 {\n        if (x >> bit) & 1 == 0 {\n            if rest & 1 == 1 { result |= 1 << bit }\n            rest >>= 1\n        }\n        bit += 1\n    }\n    return result\n}`,
        rust: `fn minEnd(n: i32, x: i32) -> i32 {\n    let mut result = x;\n    let mut rest = n - 1;\n    let mut bit = 0;\n    while rest > 0 {\n        if (x >> bit) & 1 == 0 {\n            if rest & 1 == 1 {\n                result |= 1 << bit;\n            }\n            rest >>= 1;\n        }\n        bit += 1;\n    }\n    result\n}`,
        php: `function minEnd($n, $x) {\n    $result = $x;\n    $rest = $n - 1;\n    $bit = 0;\n    while ($rest > 0) {\n        if ((($x >> $bit) & 1) === 0) {\n            if ($rest & 1) $result |= 1 << $bit;\n            $rest >>= 1;\n        }\n        $bit++;\n    }\n    return $result;\n}`,
        ruby: `def minEnd(n, x)\n  result = x\n  rest = n - 1\n  bit = 0\n  while rest > 0\n    if (x >> bit) & 1 == 0\n      result |= 1 << bit if rest & 1 == 1\n      rest >>= 1\n    end\n    bit += 1\n  end\n  result\nend`,
      },
    };
  })(),

  // ── Maximum OR (LC 2680) ────────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const pre = new Array(n + 1).fill(0);
      const suf = new Array(n + 1).fill(0);
      for (let i = 0; i < n; i++) pre[i + 1] = pre[i] | nums[i];
      for (let i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] | nums[i];
      let best = 0;
      for (let i = 0; i < n; i++) {
        const boosted = nums[i] * Math.pow(2, k);
        const cand = pre[i] | boosted | suf[i + 1];
        if (cand > best) best = cand;
      }
      return best;
    };
    return {
      slug: "maximum-or",
      title: "Maximum OR",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Array", "Greedy", "Prefix Sum", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "maximumOr", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You may apply at most `k` operations; each doubles one element of `nums`. The same element may be doubled more than once.\n\nReturn the maximum possible bitwise OR of the final array.",
        [
          { in: "nums = [12,9], k = 1", out: "30", note: "Doubling 9 to 18 gives 12 OR 18 = 30." },
          { in: "nums = [8,1,2], k = 2", out: "35", note: "Doubling 8 twice gives 32, and 32 OR 1 OR 2 = 35." },
          { in: "nums = [7], k = 0", out: "7" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 1000", "0 <= k <= 5"]),
      hints: [
        "Spending all `k` doublings on a **single** element is always at least as good as splitting them.",
        "So try each element as the one that gets all `k` doublings.",
        "Prefix and suffix ORs let you evaluate each choice in constant time.",
      ],
      editorial: explain({
        idea: "Concentrating the budget is optimal, so there are only `n` candidates. Prefix and suffix ORs make each candidate a constant-time expression.",
        steps: [
          "Build `pre[i]`, the OR of the first `i` elements, and `suf[i]`, the OR of the elements from `i` onward.",
          "For each index `i`, the candidate is `pre[i] | (nums[i] * 2^k) | suf[i+1]`.",
          "Return the largest candidate.",
        ],
        why: "Doubling shifts an element's bits left. Splitting the budget across two elements shifts each less far, and the highest bit reachable — which dominates the OR — is maximised by giving every doubling to one element. Since the best element is not known in advance, all `n` are tried.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Splitting the doublings between elements can only lower the top bit reached.",
          "Recomputing the OR of the other elements per candidate is `O(n²)`; the prefix and suffix arrays remove that.",
          "At LeetCode's real limits the answer needs 64 bits; this version caps the values so it fits in `int`.",
        ],
      }),
      examples: [
        { input: "[12,9]\n1", expectedOutput: "30" },
        { input: "[8,1,2]\n2", expectedOutput: "35" },
        { input: "[7]\n0", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 1, 1000));
        const k = ri(rng, 0, 5);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumOr(nums: List[int], k: int) -> int:\n    n = len(nums)\n    pre = [0] * (n + 1)\n    suf = [0] * (n + 1)\n    for i in range(n):\n        pre[i + 1] = pre[i] | nums[i]\n    for i in range(n - 1, -1, -1):\n        suf[i] = suf[i + 1] | nums[i]\n    best = 0\n    for i in range(n):\n        best = max(best, pre[i] | (nums[i] << k) | suf[i + 1])\n    return best`,
        javascript: `var maximumOr = function(nums, k) {\n    var n = nums.length;\n    var pre = [], suf = [];\n    for (var t = 0; t <= n; t++) { pre.push(0); suf.push(0); }\n    for (var i = 0; i < n; i++) pre[i + 1] = pre[i] | nums[i];\n    for (var j = n - 1; j >= 0; j--) suf[j] = suf[j + 1] | nums[j];\n    var best = 0;\n    for (var m = 0; m < n; m++) {\n        var cand = pre[m] | (nums[m] * Math.pow(2, k)) | suf[m + 1];\n        if (cand > best) best = cand;\n    }\n    return best;\n};`,
        typescript: `function maximumOr(nums: number[], k: number): number {\n    var n = nums.length;\n    var pre: number[] = [], suf: number[] = [];\n    for (var t = 0; t <= n; t++) { pre.push(0); suf.push(0); }\n    for (var i = 0; i < n; i++) pre[i + 1] = pre[i] | nums[i];\n    for (var j = n - 1; j >= 0; j--) suf[j] = suf[j + 1] | nums[j];\n    var best = 0;\n    for (var m = 0; m < n; m++) {\n        var cand = pre[m] | (nums[m] * Math.pow(2, k)) | suf[m + 1];\n        if (cand > best) best = cand;\n    }\n    return best;\n}`,
        java: `public static int maximumOr(int[] nums, int k) {\n    int n = nums.length;\n    int[] pre = new int[n + 1];\n    int[] suf = new int[n + 1];\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] | nums[i];\n    for (int i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] | nums[i];\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        int cand = pre[i] | (nums[i] << k) | suf[i + 1];\n        if (cand > best) best = cand;\n    }\n    return best;\n}`,
        cpp: `int maximumOr(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    vector<int> pre(n + 1, 0), suf(n + 1, 0);\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] | nums[i];\n    for (int i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] | nums[i];\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        int cand = pre[i] | (nums[i] << k) | suf[i + 1];\n        if (cand > best) best = cand;\n    }\n    return best;\n}`,
        c: `int maximumOr(int* nums, int numsSize, int k) {\n    int n = numsSize;\n    int* pre = (int*) calloc((size_t) n + 1, sizeof(int));\n    int* suf = (int*) calloc((size_t) n + 1, sizeof(int));\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] | nums[i];\n    for (int i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] | nums[i];\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        int cand = pre[i] | (nums[i] << k) | suf[i + 1];\n        if (cand > best) best = cand;\n    }\n    free(pre);\n    free(suf);\n    return best;\n}`,
        csharp: `public static int MaximumOr(int[] nums, int k)\n{\n    int n = nums.Length;\n    int[] pre = new int[n + 1];\n    int[] suf = new int[n + 1];\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] | nums[i];\n    for (int i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] | nums[i];\n    int best = 0;\n    for (int i = 0; i < n; i++)\n    {\n        int cand = pre[i] | (nums[i] << k) | suf[i + 1];\n        if (cand > best) best = cand;\n    }\n    return best;\n}`,
        go: `func maximumOr(nums []int, k int) int {\n\tn := len(nums)\n\tpre := make([]int, n+1)\n\tsuf := make([]int, n+1)\n\tfor i := 0; i < n; i++ {\n\t\tpre[i+1] = pre[i] | nums[i]\n\t}\n\tfor i := n - 1; i >= 0; i-- {\n\t\tsuf[i] = suf[i+1] | nums[i]\n\t}\n\tbest := 0\n\tfor i := 0; i < n; i++ {\n\t\tcand := pre[i] | (nums[i] << uint(k)) | suf[i+1]\n\t\tif cand > best {\n\t\t\tbest = cand\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumOr(nums: IntArray, k: Int): Int {\n    val n = nums.size\n    val pre = IntArray(n + 1)\n    val suf = IntArray(n + 1)\n    for (i in 0 until n) pre[i + 1] = pre[i] or nums[i]\n    for (i in n - 1 downTo 0) suf[i] = suf[i + 1] or nums[i]\n    var best = 0\n    for (i in 0 until n) {\n        val cand = pre[i] or (nums[i] shl k) or suf[i + 1]\n        if (cand > best) best = cand\n    }\n    return best\n}`,
        swift: `func maximumOr(_ nums: [Int], _ k: Int) -> Int {\n    let n = nums.count\n    var pre = [Int](repeating: 0, count: n + 1)\n    var suf = [Int](repeating: 0, count: n + 1)\n    for i in 0..<n { pre[i + 1] = pre[i] | nums[i] }\n    var i = n - 1\n    while i >= 0 {\n        suf[i] = suf[i + 1] | nums[i]\n        i -= 1\n    }\n    var best = 0\n    for j in 0..<n {\n        let cand = pre[j] | (nums[j] << k) | suf[j + 1]\n        if cand > best { best = cand }\n    }\n    return best\n}`,
        rust: `fn maximumOr(nums: Vec<i32>, k: i32) -> i32 {\n    let n = nums.len();\n    let mut pre = vec![0i32; n + 1];\n    let mut suf = vec![0i32; n + 1];\n    for i in 0..n {\n        pre[i + 1] = pre[i] | nums[i];\n    }\n    for i in (0..n).rev() {\n        suf[i] = suf[i + 1] | nums[i];\n    }\n    let mut best = 0i32;\n    for i in 0..n {\n        let cand = pre[i] | (nums[i] << k) | suf[i + 1];\n        if cand > best {\n            best = cand;\n        }\n    }\n    best\n}`,
        php: `function maximumOr($nums, $k) {\n    $n = count($nums);\n    $pre = array_fill(0, $n + 1, 0);\n    $suf = array_fill(0, $n + 1, 0);\n    for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] | $nums[$i];\n    for ($i = $n - 1; $i >= 0; $i--) $suf[$i] = $suf[$i + 1] | $nums[$i];\n    $best = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $cand = $pre[$i] | ($nums[$i] << $k) | $suf[$i + 1];\n        if ($cand > $best) $best = $cand;\n    }\n    return $best;\n}`,
        ruby: `def maximumOr(nums, k)\n  n = nums.length\n  pre = Array.new(n + 1, 0)\n  suf = Array.new(n + 1, 0)\n  (0...n).each { |i| pre[i + 1] = pre[i] | nums[i] }\n  (n - 1).downto(0) { |i| suf[i] = suf[i + 1] | nums[i] }\n  best = 0\n  (0...n).each do |i|\n    cand = pre[i] | (nums[i] << k) | suf[i + 1]\n    best = cand if cand > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum One Bit Operations to Make Integers Zero (LC 1611) ──
  (() => {
    const ref = (n: number) => {
      let ans = 0, v = n;
      while (v > 0) { ans ^= v; v = Math.floor(v / 2); }
      return ans;
    };
    return {
      slug: "minimum-one-bit-operations-to-make-integers-zero",
      title: "Minimum One Bit Operations to Make Integers Zero",
      difficulty: "HARD" as const,
      tags: ["Bit Manipulation", "Math", "Dynamic Programming", "Google", "Amazon", "Apple"],
      signature: { funcName: "minimumOneBitOperations", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Two operations transform a binary number:\n\n1. flip the rightmost bit (bit 0);\n2. flip bit `i + 1` **only if** bit `i` is `1` and bits `i - 1 … 0` are all `0`.\n\nReturn the minimum number of operations that turns `n` into `0`.",
        [
          { in: "n = 3", out: "2", note: "11 → 01 → 00." },
          { in: "n = 6", out: "4", note: "110 → 010 → 011 → 001 → 000." },
          { in: "n = 0", out: "0" },
        ],
        ["0 <= n <= 1000000000"]),
      hints: [
        "The reachable states form a Gray-code ordering — each operation moves to an adjacent code word.",
        "So the answer is the **position** of `n` in the standard reflected Gray code.",
        "Converting a Gray code back to its index is the running XOR of the value's successive right shifts.",
      ],
      editorial: explain({
        idea: "The two operations are exactly the moves of the standard reflected binary (Gray) code: from a value you may step to the code word before or after it. So the minimum number of operations to reach 0 is the index of `n` in that code, and the Gray-to-binary conversion computes it directly.",
        steps: [
          "Start with `ans = 0`.",
          "While `n > 0`, XOR `n` into `ans` and shift `n` right by one.",
          "Return `ans`.",
        ],
        why: "The Gray code of an index `i` is `i ^ (i >> 1)`, and the inverse is `i = g ^ (g >> 1) ^ (g >> 2) ^ …` — precisely the running XOR of shifts. Since the operations move one step along the code, the distance from `n` to the code word `0` is its index.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "A breadth-first search over states is exponential and cannot reach `10^9`.",
          "The recursive formula `f(n) = 2^k - f(n - 2^(k-1))`… is equivalent but far easier to get wrong than the XOR-of-shifts form.",
          "Use an unsigned or arithmetic shift, not a sign-propagating one; `n` is non-negative so either works here.",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "2" },
        { input: "6", expectedOutput: "4" },
        { input: "0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 0, 200) : ri(rng, 0, 1000000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def minimumOneBitOperations(n: int) -> int:\n    ans = 0\n    while n > 0:\n        ans ^= n\n        n >>= 1\n    return ans`,
        javascript: `var minimumOneBitOperations = function(n) {\n    var ans = 0, v = n;\n    while (v > 0) {\n        ans ^= v;\n        v = Math.floor(v / 2);\n    }\n    return ans;\n};`,
        typescript: `function minimumOneBitOperations(n: number): number {\n    var ans = 0, v = n;\n    while (v > 0) {\n        ans ^= v;\n        v = Math.floor(v / 2);\n    }\n    return ans;\n}`,
        java: `public static int minimumOneBitOperations(int n) {\n    int ans = 0;\n    while (n > 0) {\n        ans ^= n;\n        n >>>= 1;\n    }\n    return ans;\n}`,
        cpp: `int minimumOneBitOperations(int n) {\n    int ans = 0;\n    unsigned int v = (unsigned int) n;\n    while (v > 0) {\n        ans ^= (int) v;\n        v >>= 1;\n    }\n    return ans;\n}`,
        c: `int minimumOneBitOperations(int n) {\n    int ans = 0;\n    unsigned int v = (unsigned int) n;\n    while (v > 0) {\n        ans ^= (int) v;\n        v >>= 1;\n    }\n    return ans;\n}`,
        csharp: `public static int MinimumOneBitOperations(int n)\n{\n    int ans = 0;\n    while (n > 0)\n    {\n        ans ^= n;\n        n >>= 1;\n    }\n    return ans;\n}`,
        go: `func minimumOneBitOperations(n int) int {\n\tans := 0\n\tv := n\n\tfor v > 0 {\n\t\tans ^= v\n\t\tv >>= 1\n\t}\n\treturn ans\n}`,
        kotlin: `fun minimumOneBitOperations(n: Int): Int {\n    var ans = 0\n    var v = n\n    while (v > 0) {\n        ans = ans xor v\n        v = v shr 1\n    }\n    return ans\n}`,
        swift: `func minimumOneBitOperations(_ n: Int) -> Int {\n    var ans = 0\n    var v = n\n    while v > 0 {\n        ans ^= v\n        v >>= 1\n    }\n    return ans\n}`,
        rust: `fn minimumOneBitOperations(n: i32) -> i32 {\n    let mut ans = 0i32;\n    let mut v = n;\n    while v > 0 {\n        ans ^= v;\n        v >>= 1;\n    }\n    ans\n}`,
        php: `function minimumOneBitOperations($n) {\n    $ans = 0;\n    $v = $n;\n    while ($v > 0) {\n        $ans ^= $v;\n        $v >>= 1;\n    }\n    return $ans;\n}`,
        ruby: `def minimumOneBitOperations(n)\n  ans = 0\n  v = n\n  while v > 0\n    ans ^= v\n    v >>= 1\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Find Subarray With Bitwise OR Closest to K (LC 3171) ────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let best = Infinity;
      let cur: number[] = [];
      for (const x of nums) {
        const next: number[] = [];
        const seen: Record<string, boolean> = {};
        const add = (v: number) => {
          const s = String(v);
          if (seen[s] !== true) {
            seen[s] = true;
            next.push(v);
            const d = Math.abs(v - k);
            if (d < best) best = d;
          }
        };
        add(x);
        for (const v of cur) add(v | x);
        cur = next;
      }
      return best;
    };
    return {
      slug: "find-subarray-with-bitwise-or-closest-to-k",
      title: "Find Subarray With Bitwise OR Closest to K",
      difficulty: "HARD" as const,
      tags: ["Bit Manipulation", "Array", "Binary Search", "Segment Tree", "Google", "Amazon", "Meta"],
      signature: { funcName: "minimumDifference", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Over all non-empty subarrays of `nums`, minimise `|(bitwise OR of the subarray) - k|`.\n\nReturn that minimum value.",
        [
          { in: "nums = [1,2,4,5], k = 3", out: "0", note: "The subarray [1,2] ORs to exactly 3." },
          { in: "nums = [1,3,1,3], k = 2", out: "1", note: "The reachable ORs are 1 and 3, both one away from 2." },
          { in: "nums = [1], k = 10", out: "9" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000", "1 <= k <= 1000000000"]),
      hints: [
        "There are `O(n²)` subarrays but far fewer distinct ORs — track the ORs of subarrays **ending** at each index.",
        "That set has at most about 30 members, because extending leftwards only ever adds bits.",
        "Evaluate `|value - k|` for every value the set ever holds.",
      ],
      editorial: explain({
        idea: "Fix the right endpoint. The ORs of subarrays ending there form a chain that only gains bits as the window grows leftwards, so at most about 30 distinct values exist per endpoint. Carrying that set forward makes an exhaustive search linear.",
        steps: [
          "Keep `cur`, the distinct ORs of subarrays ending at the previous index.",
          "For each new element `x`, the next set is `{x} ∪ {v | x : v in cur}`, deduplicated.",
          "Evaluate `|value - k|` for every value produced and keep the minimum.",
        ],
        why: "Every subarray is counted, because each one has a right endpoint and appears in that endpoint's set. The set stays small because along a fixed right endpoint the OR is non-decreasing and every strict increase sets a new bit, of which there are at most 30.",
        time: "O(n · 30)",
        space: "O(30)",
        pitfalls: [
          "Skipping the deduplication lets `cur` grow linearly and the solution becomes `O(n²)`.",
          "Forgetting the singleton `{x}` misses subarrays of length 1.",
          "The answer can be 0, so the running minimum must start above any achievable value rather than at 0.",
        ],
      }),
      examples: [
        { input: "[1,2,4,5]\n3", expectedOutput: "0" },
        { input: "[1,3,1,3]\n2", expectedOutput: "1" },
        { input: "[1]\n10", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 30 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 1, hi));
        const k = ri(rng, 1, hi);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumDifference(nums: List[int], k: int) -> int:\n    best = float("inf")\n    cur = set()\n    for x in nums:\n        cur = {x} | {v | x for v in cur}\n        for v in cur:\n            best = min(best, abs(v - k))\n    return int(best)`,
        javascript: `var minimumDifference = function(nums, k) {\n    var best = Infinity;\n    var cur = [];\n    for (var i = 0; i < nums.length; i++) {\n        var x = nums[i];\n        var next = [], seen = {};\n        var add = function(v) {\n            var s = String(v);\n            if (seen[s] !== true) {\n                seen[s] = true;\n                next.push(v);\n                var d = Math.abs(v - k);\n                if (d < best) best = d;\n            }\n        };\n        add(x);\n        for (var j = 0; j < cur.length; j++) add(cur[j] | x);\n        cur = next;\n    }\n    return best;\n};`,
        typescript: `function minimumDifference(nums: number[], k: number): number {\n    var best = Infinity;\n    var cur: number[] = [];\n    for (var i = 0; i < nums.length; i++) {\n        var x = nums[i];\n        var next: number[] = [], seen: { [key: string]: boolean } = {};\n        var add = function(v: number) {\n            var s = String(v);\n            if (seen[s] !== true) {\n                seen[s] = true;\n                next.push(v);\n                var d = Math.abs(v - k);\n                if (d < best) best = d;\n            }\n        };\n        add(x);\n        for (var j = 0; j < cur.length; j++) add(cur[j] | x);\n        cur = next;\n    }\n    return best;\n}`,
        java: `public static int minimumDifference(int[] nums, int k) {\n    long best = Long.MAX_VALUE;\n    Set<Integer> cur = new HashSet<>();\n    for (int x : nums) {\n        Set<Integer> next = new HashSet<>();\n        next.add(x);\n        for (int v : cur) next.add(v | x);\n        cur = next;\n        for (int v : cur) best = Math.min(best, Math.abs((long) v - k));\n    }\n    return (int) best;\n}`,
        cpp: `int minimumDifference(vector<int>& nums, int k) {\n    long long best = LLONG_MAX;\n    unordered_set<int> cur;\n    for (int x : nums) {\n        unordered_set<int> next;\n        next.insert(x);\n        for (int v : cur) next.insert(v | x);\n        cur = next;\n        for (int v : cur) best = min(best, llabs((long long) v - k));\n    }\n    return (int) best;\n}`,
        c: `int minimumDifference(int* nums, int numsSize, int k) {\n    long long best = 9223372036854775807LL;\n    int cur[64], next[64];\n    int cc = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int nc = 0;\n        next[nc++] = nums[i];\n        for (int j = 0; j < cc; j++) {\n            int v = cur[j] | nums[i];\n            int dup = 0;\n            for (int t = 0; t < nc; t++) {\n                if (next[t] == v) { dup = 1; break; }\n            }\n            if (!dup && nc < 64) next[nc++] = v;\n        }\n        for (int t = 0; t < nc; t++) {\n            long long d = (long long) next[t] - k;\n            if (d < 0) d = -d;\n            if (d < best) best = d;\n            cur[t] = next[t];\n        }\n        cc = nc;\n    }\n    return (int) best;\n}`,
        csharp: `public static int MinimumDifference(int[] nums, int k)\n{\n    long best = long.MaxValue;\n    var cur = new HashSet<int>();\n    foreach (int x in nums)\n    {\n        var next = new HashSet<int>();\n        next.Add(x);\n        foreach (int v in cur) next.Add(v | x);\n        cur = next;\n        foreach (int v in cur) best = Math.Min(best, Math.Abs((long) v - k));\n    }\n    return (int) best;\n}`,
        go: `func minimumDifference(nums []int, k int) int {\n\tbest := math.MaxInt64\n\tcur := map[int]bool{}\n\tfor _, x := range nums {\n\t\tnext := map[int]bool{x: true}\n\t\tfor v := range cur {\n\t\t\tnext[v|x] = true\n\t\t}\n\t\tcur = next\n\t\tfor v := range cur {\n\t\t\td := v - k\n\t\t\tif d < 0 {\n\t\t\t\td = -d\n\t\t\t}\n\t\t\tif d < best {\n\t\t\t\tbest = d\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minimumDifference(nums: IntArray, k: Int): Int {\n    var best = Long.MAX_VALUE\n    var cur = HashSet<Int>()\n    for (x in nums) {\n        val next = HashSet<Int>()\n        next.add(x)\n        for (v in cur) next.add(v or x)\n        cur = next\n        for (v in cur) {\n            val d = Math.abs(v.toLong() - k)\n            if (d < best) best = d\n        }\n    }\n    return best.toInt()\n}`,
        swift: `func minimumDifference(_ nums: [Int], _ k: Int) -> Int {\n    var best = Int.max\n    var cur = Set<Int>()\n    for x in nums {\n        var next = Set<Int>()\n        next.insert(x)\n        for v in cur { next.insert(v | x) }\n        cur = next\n        for v in cur {\n            let d = abs(v - k)\n            if d < best { best = d }\n        }\n    }\n    return best\n}`,
        rust: `fn minimumDifference(nums: Vec<i32>, k: i32) -> i32 {\n    let mut best: i64 = std::i64::MAX;\n    let mut cur: std::collections::HashSet<i32> = std::collections::HashSet::new();\n    for &x in nums.iter() {\n        let mut next: std::collections::HashSet<i32> = std::collections::HashSet::new();\n        next.insert(x);\n        for &v in cur.iter() {\n            next.insert(v | x);\n        }\n        cur = next;\n        for &v in cur.iter() {\n            let d = (v as i64 - k as i64).abs();\n            if d < best {\n                best = d;\n            }\n        }\n    }\n    best as i32\n}`,
        php: `function minimumDifference($nums, $k) {\n    $best = PHP_INT_MAX;\n    $cur = array();\n    foreach ($nums as $x) {\n        $next = array($x => true);\n        foreach ($cur as $v => $ignored) $next[$v | $x] = true;\n        $cur = $next;\n        foreach ($cur as $v => $ignored) {\n            $d = abs($v - $k);\n            if ($d < $best) $best = $d;\n        }\n    }\n    return $best;\n}`,
        ruby: `def minimumDifference(nums, k)\n  best = Float::INFINITY\n  cur = {}\n  nums.each do |x|\n    nxt = { x => true }\n    cur.each_key { |v| nxt[v | x] = true }\n    cur = nxt\n    cur.each_key do |v|\n      d = (v - k).abs\n      best = d if d < best\n    end\n  end\n  best.to_i\nend`,
      },
    };
  })(),

  // ── Maximum AND Sum of Array (LC 2172) ──────────────────────────
  (() => {
    const ref = (nums: number[], numSlots: number) => {
      const pow3 = [1];
      for (let i = 1; i <= numSlots; i++) pow3.push(pow3[i - 1] * 3);
      const total = pow3[numSlots];
      const dp = new Array(total).fill(0);
      let best = 0;
      for (let mask = 0; mask < total; mask++) {
        let placed = 0, t = mask;
        for (let s = 0; s < numSlots; s++) { placed += t % 3; t = Math.floor(t / 3); }
        if (placed >= nums.length) { if (dp[mask] > best) best = dp[mask]; continue; }
        const x = nums[placed];
        for (let s = 0; s < numSlots; s++) {
          if (Math.floor(mask / pow3[s]) % 3 >= 2) continue;
          const next = mask + pow3[s];
          const val = dp[mask] + (x & (s + 1));
          if (val > dp[next]) dp[next] = val;
        }
      }
      return best;
    };
    return {
      slug: "maximum-and-sum-of-array",
      title: "Maximum AND Sum of Array",
      difficulty: "HARD" as const,
      tags: ["Bit Manipulation", "Dynamic Programming", "Bitmask", "Google", "Amazon", "Meta"],
      signature: { funcName: "maximumANDSum", params: [{ name: "nums", type: "int[]" as const }, { name: "numSlots", type: "int" as const }], returns: "int" as const },
      description: describe(
        "There are `numSlots` slots numbered `1` through `numSlots`, and each slot may hold **at most two** numbers. Every element of `nums` must be placed in some slot.\n\nThe **AND sum** is the sum of `number AND slotNumber` over every placement. Return the maximum achievable AND sum.",
        [
          { in: "nums = [1,2,3,4,5,6], numSlots = 3", out: "9", note: "Placing them as [1,4], [2,6], [3,5] gives 1+0 + 2+2 + 3+1 = 9." },
          { in: "nums = [1,3,10,4,7,1], numSlots = 9", out: "24" },
          { in: "nums = [8], numSlots = 1", out: "0", note: "8 AND 1 is 0." },
        ],
        ["1 <= numSlots <= 9", "1 <= nums.length <= 2 * numSlots", "1 <= nums[i] <= 15"]),
      hints: [
        "Each slot has three possible states — empty, one number, two numbers — so the whole configuration fits in a base-3 counter over at most nine slots.",
        "Place the numbers in a fixed order; the number of items already placed is determined by the state.",
        "That makes a DP over `3^numSlots` states, each trying `numSlots` destinations.",
      ],
      editorial: explain({
        idea: "The numbers are interchangeable in the sense that only *which* slot each lands in matters, so process them in a fixed order and let the state record how full each slot is. A base-3 digit per slot captures that in a single integer.",
        steps: [
          "Encode the configuration as a base-3 number with one digit per slot, counting `0`, `1` or `2` occupants.",
          "The digit sum of a state is how many numbers are already placed, which identifies the next number to place.",
          "From each reachable state, try every slot that is not full, adding `nums[placed] & (slot + 1)` to the score.",
          "The answer is the best score over states where every number has been placed.",
        ],
        why: "Processing the numbers in a fixed order removes the ordering redundancy without losing any assignment, because a placement is fully described by the multiset of slot choices. States only ever grow, so a single forward sweep in increasing state order is a valid topological order.",
        time: "O(3^numSlots · numSlots)",
        space: "O(3^numSlots)",
        pitfalls: [
          "A bitmask over `2 * numSlots` slot *positions* also works but doubles the state space for no gain.",
          "Slots are numbered from 1, so the AND uses `slotIndex + 1`.",
          "Reading the best answer only from the final full state is wrong when `nums` is shorter than `2 * numSlots` — collect it from every state where all numbers are placed.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6]\n3", expectedOutput: "9" },
        { input: "[1,3,10,4,7,1]\n9", expectedOutput: "24" },
        { input: "[8]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const numSlots = ri(rng, 1, 6);
        const nums = Array.from({ length: ri(rng, 1, 2 * numSlots) }, () => ri(rng, 1, 15));
        return { input: `${fmtIntArr(nums)}\n${numSlots}`, expectedOutput: String(ref(nums, numSlots)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumANDSum(nums: List[int], numSlots: int) -> int:\n    pow3 = [1]\n    for i in range(numSlots):\n        pow3.append(pow3[-1] * 3)\n    total = pow3[numSlots]\n    dp = [0] * total\n    best = 0\n    for mask in range(total):\n        placed = 0\n        t = mask\n        for _ in range(numSlots):\n            placed += t % 3\n            t //= 3\n        if placed >= len(nums):\n            best = max(best, dp[mask])\n            continue\n        x = nums[placed]\n        for s in range(numSlots):\n            if (mask // pow3[s]) % 3 >= 2:\n                continue\n            nxt = mask + pow3[s]\n            dp[nxt] = max(dp[nxt], dp[mask] + (x & (s + 1)))\n    return best`,
        javascript: `var maximumANDSum = function(nums, numSlots) {\n    var pow3 = [1];\n    for (var i = 1; i <= numSlots; i++) pow3.push(pow3[i - 1] * 3);\n    var total = pow3[numSlots];\n    var dp = [];\n    for (var t = 0; t < total; t++) dp.push(0);\n    var best = 0;\n    for (var mask = 0; mask < total; mask++) {\n        var placed = 0, v = mask;\n        for (var s = 0; s < numSlots; s++) { placed += v % 3; v = Math.floor(v / 3); }\n        if (placed >= nums.length) {\n            if (dp[mask] > best) best = dp[mask];\n            continue;\n        }\n        var x = nums[placed];\n        for (var j = 0; j < numSlots; j++) {\n            if (Math.floor(mask / pow3[j]) % 3 >= 2) continue;\n            var next = mask + pow3[j];\n            var val = dp[mask] + (x & (j + 1));\n            if (val > dp[next]) dp[next] = val;\n        }\n    }\n    return best;\n};`,
        typescript: `function maximumANDSum(nums: number[], numSlots: number): number {\n    var pow3: number[] = [1];\n    for (var i = 1; i <= numSlots; i++) pow3.push(pow3[i - 1] * 3);\n    var total = pow3[numSlots];\n    var dp: number[] = [];\n    for (var t = 0; t < total; t++) dp.push(0);\n    var best = 0;\n    for (var mask = 0; mask < total; mask++) {\n        var placed = 0, v = mask;\n        for (var s = 0; s < numSlots; s++) { placed += v % 3; v = Math.floor(v / 3); }\n        if (placed >= nums.length) {\n            if (dp[mask] > best) best = dp[mask];\n            continue;\n        }\n        var x = nums[placed];\n        for (var j = 0; j < numSlots; j++) {\n            if (Math.floor(mask / pow3[j]) % 3 >= 2) continue;\n            var next = mask + pow3[j];\n            var val = dp[mask] + (x & (j + 1));\n            if (val > dp[next]) dp[next] = val;\n        }\n    }\n    return best;\n}`,
        java: `public static int maximumANDSum(int[] nums, int numSlots) {\n    int[] pow3 = new int[numSlots + 1];\n    pow3[0] = 1;\n    for (int i = 1; i <= numSlots; i++) pow3[i] = pow3[i - 1] * 3;\n    int total = pow3[numSlots];\n    int[] dp = new int[total];\n    int best = 0;\n    for (int mask = 0; mask < total; mask++) {\n        int placed = 0, v = mask;\n        for (int s = 0; s < numSlots; s++) { placed += v % 3; v /= 3; }\n        if (placed >= nums.length) {\n            best = Math.max(best, dp[mask]);\n            continue;\n        }\n        int x = nums[placed];\n        for (int s = 0; s < numSlots; s++) {\n            if ((mask / pow3[s]) % 3 >= 2) continue;\n            int next = mask + pow3[s];\n            dp[next] = Math.max(dp[next], dp[mask] + (x & (s + 1)));\n        }\n    }\n    return best;\n}`,
        cpp: `int maximumANDSum(vector<int>& nums, int numSlots) {\n    vector<int> pow3(numSlots + 1, 1);\n    for (int i = 1; i <= numSlots; i++) pow3[i] = pow3[i - 1] * 3;\n    int total = pow3[numSlots];\n    vector<int> dp(total, 0);\n    int best = 0;\n    for (int mask = 0; mask < total; mask++) {\n        int placed = 0, v = mask;\n        for (int s = 0; s < numSlots; s++) { placed += v % 3; v /= 3; }\n        if (placed >= (int) nums.size()) {\n            best = max(best, dp[mask]);\n            continue;\n        }\n        int x = nums[placed];\n        for (int s = 0; s < numSlots; s++) {\n            if ((mask / pow3[s]) % 3 >= 2) continue;\n            int next = mask + pow3[s];\n            dp[next] = max(dp[next], dp[mask] + (x & (s + 1)));\n        }\n    }\n    return best;\n}`,
        c: `int maximumANDSum(int* nums, int numsSize, int numSlots) {\n    int pow3[12];\n    pow3[0] = 1;\n    for (int i = 1; i <= numSlots; i++) pow3[i] = pow3[i - 1] * 3;\n    int total = pow3[numSlots];\n    int* dp = (int*) calloc((size_t) total, sizeof(int));\n    int best = 0;\n    for (int mask = 0; mask < total; mask++) {\n        int placed = 0, v = mask;\n        for (int s = 0; s < numSlots; s++) { placed += v % 3; v /= 3; }\n        if (placed >= numsSize) {\n            if (dp[mask] > best) best = dp[mask];\n            continue;\n        }\n        int x = nums[placed];\n        for (int s = 0; s < numSlots; s++) {\n            if ((mask / pow3[s]) % 3 >= 2) continue;\n            int next = mask + pow3[s];\n            int val = dp[mask] + (x & (s + 1));\n            if (val > dp[next]) dp[next] = val;\n        }\n    }\n    free(dp);\n    return best;\n}`,
        csharp: `public static int MaximumANDSum(int[] nums, int numSlots)\n{\n    int[] pow3 = new int[numSlots + 1];\n    pow3[0] = 1;\n    for (int i = 1; i <= numSlots; i++) pow3[i] = pow3[i - 1] * 3;\n    int total = pow3[numSlots];\n    int[] dp = new int[total];\n    int best = 0;\n    for (int mask = 0; mask < total; mask++)\n    {\n        int placed = 0, v = mask;\n        for (int s = 0; s < numSlots; s++) { placed += v % 3; v /= 3; }\n        if (placed >= nums.Length)\n        {\n            if (dp[mask] > best) best = dp[mask];\n            continue;\n        }\n        int x = nums[placed];\n        for (int s = 0; s < numSlots; s++)\n        {\n            if ((mask / pow3[s]) % 3 >= 2) continue;\n            int next = mask + pow3[s];\n            int val = dp[mask] + (x & (s + 1));\n            if (val > dp[next]) dp[next] = val;\n        }\n    }\n    return best;\n}`,
        go: `func maximumANDSum(nums []int, numSlots int) int {\n\tpow3 := make([]int, numSlots+1)\n\tpow3[0] = 1\n\tfor i := 1; i <= numSlots; i++ {\n\t\tpow3[i] = pow3[i-1] * 3\n\t}\n\ttotal := pow3[numSlots]\n\tdp := make([]int, total)\n\tbest := 0\n\tfor mask := 0; mask < total; mask++ {\n\t\tplaced, v := 0, mask\n\t\tfor s := 0; s < numSlots; s++ {\n\t\t\tplaced += v % 3\n\t\t\tv /= 3\n\t\t}\n\t\tif placed >= len(nums) {\n\t\t\tif dp[mask] > best {\n\t\t\t\tbest = dp[mask]\n\t\t\t}\n\t\t\tcontinue\n\t\t}\n\t\tx := nums[placed]\n\t\tfor s := 0; s < numSlots; s++ {\n\t\t\tif (mask/pow3[s])%3 >= 2 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tnext := mask + pow3[s]\n\t\t\tval := dp[mask] + (x & (s + 1))\n\t\t\tif val > dp[next] {\n\t\t\t\tdp[next] = val\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumANDSum(nums: IntArray, numSlots: Int): Int {\n    val pow3 = IntArray(numSlots + 1)\n    pow3[0] = 1\n    for (i in 1..numSlots) pow3[i] = pow3[i - 1] * 3\n    val total = pow3[numSlots]\n    val dp = IntArray(total)\n    var best = 0\n    for (mask in 0 until total) {\n        var placed = 0\n        var v = mask\n        for (s in 0 until numSlots) {\n            placed += v % 3\n            v /= 3\n        }\n        if (placed >= nums.size) {\n            if (dp[mask] > best) best = dp[mask]\n            continue\n        }\n        val x = nums[placed]\n        for (s in 0 until numSlots) {\n            if ((mask / pow3[s]) % 3 >= 2) continue\n            val next = mask + pow3[s]\n            val value = dp[mask] + (x and (s + 1))\n            if (value > dp[next]) dp[next] = value\n        }\n    }\n    return best\n}`,
        swift: `func maximumANDSum(_ nums: [Int], _ numSlots: Int) -> Int {\n    var pow3 = [Int](repeating: 1, count: numSlots + 1)\n    for i in 1...numSlots { pow3[i] = pow3[i - 1] * 3 }\n    let total = pow3[numSlots]\n    var dp = [Int](repeating: 0, count: total)\n    var best = 0\n    for mask in 0..<total {\n        var placed = 0\n        var v = mask\n        for _ in 0..<numSlots {\n            placed += v % 3\n            v /= 3\n        }\n        if placed >= nums.count {\n            if dp[mask] > best { best = dp[mask] }\n            continue\n        }\n        let x = nums[placed]\n        for s in 0..<numSlots {\n            if (mask / pow3[s]) % 3 >= 2 { continue }\n            let next = mask + pow3[s]\n            let value = dp[mask] + (x & (s + 1))\n            if value > dp[next] { dp[next] = value }\n        }\n    }\n    return best\n}`,
        rust: `fn maximumANDSum(nums: Vec<i32>, numSlots: i32) -> i32 {\n    let slots = numSlots as usize;\n    let mut pow3 = vec![1usize; slots + 1];\n    for i in 1..=slots {\n        pow3[i] = pow3[i - 1] * 3;\n    }\n    let total = pow3[slots];\n    let mut dp = vec![0i32; total];\n    let mut best = 0i32;\n    for mask in 0..total {\n        let mut placed = 0usize;\n        let mut v = mask;\n        for _ in 0..slots {\n            placed += v % 3;\n            v /= 3;\n        }\n        if placed >= nums.len() {\n            if dp[mask] > best {\n                best = dp[mask];\n            }\n            continue;\n        }\n        let x = nums[placed];\n        for s in 0..slots {\n            if (mask / pow3[s]) % 3 >= 2 {\n                continue;\n            }\n            let next = mask + pow3[s];\n            let value = dp[mask] + (x & (s as i32 + 1));\n            if value > dp[next] {\n                dp[next] = value;\n            }\n        }\n    }\n    best\n}`,
        php: `function maximumANDSum($nums, $numSlots) {\n    $pow3 = array(1);\n    for ($i = 1; $i <= $numSlots; $i++) $pow3[] = $pow3[$i - 1] * 3;\n    $total = $pow3[$numSlots];\n    $dp = array_fill(0, $total, 0);\n    $best = 0;\n    for ($mask = 0; $mask < $total; $mask++) {\n        $placed = 0;\n        $v = $mask;\n        for ($s = 0; $s < $numSlots; $s++) { $placed += $v % 3; $v = intdiv($v, 3); }\n        if ($placed >= count($nums)) {\n            if ($dp[$mask] > $best) $best = $dp[$mask];\n            continue;\n        }\n        $x = $nums[$placed];\n        for ($s = 0; $s < $numSlots; $s++) {\n            if (intdiv($mask, $pow3[$s]) % 3 >= 2) continue;\n            $next = $mask + $pow3[$s];\n            $val = $dp[$mask] + ($x & ($s + 1));\n            if ($val > $dp[$next]) $dp[$next] = $val;\n        }\n    }\n    return $best;\n}`,
        ruby: `def maximumANDSum(nums, numSlots)\n  pow3 = [1]\n  (1..numSlots).each { |i| pow3 << pow3[i - 1] * 3 }\n  total = pow3[numSlots]\n  dp = Array.new(total, 0)\n  best = 0\n  (0...total).each do |mask|\n    placed = 0\n    v = mask\n    numSlots.times do\n      placed += v % 3\n      v /= 3\n    end\n    if placed >= nums.length\n      best = dp[mask] if dp[mask] > best\n      next\n    end\n    x = nums[placed]\n    (0...numSlots).each do |s|\n      next if (mask / pow3[s]) % 3 >= 2\n      nxt = mask + pow3[s]\n      val = dp[mask] + (x & (s + 1))\n      dp[nxt] = val if val > dp[nxt]\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count the Number of Square-Free Subsets (LC 2572) ───────────
  (() => {
    const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
    const maskOf = (v: number) => {
      let m = 0;
      for (let i = 0; i < PRIMES.length; i++) {
        const p = PRIMES[i];
        if (v % p === 0) {
          if (v % (p * p) === 0) return -1;
          m |= 1 << i;
        }
      }
      return m;
    };
    const ref = (nums: number[]) => {
      const MOD = 1000000007;
      const dp = new Array(1024).fill(0);
      dp[0] = 1;
      for (const v of nums) {
        const m = maskOf(v);
        if (m < 0) continue;
        for (let s = 1023; s >= 0; s--) {
          if (dp[s] === 0) continue;
          if ((s & m) !== 0) continue;
          dp[s | m] = (dp[s | m] + dp[s]) % MOD;
        }
      }
      let total = 0;
      for (let s = 0; s < 1024; s++) total = (total + dp[s]) % MOD;
      return (total - 1 + MOD) % MOD;
    };
    return {
      slug: "count-the-number-of-square-free-subsets",
      title: "Count the Number of Square-Free Subsets",
      difficulty: "HARD" as const,
      tags: ["Bit Manipulation", "Dynamic Programming", "Bitmask", "Math", "Google", "Amazon", "Uber"],
      signature: { funcName: "squareFreeSubsets", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A number is **square-free** when no perfect square above 1 divides it. A subset of `nums` is square-free when the product of its elements is square-free.\n\nReturn the number of non-empty square-free subsets, modulo `10^9 + 7`. Subsets are distinguished by the indices they use.",
        [
          { in: "nums = [3,4,4,5]", out: "3", note: "The square-free subsets are {3}, {5} and {3,5} — 4 is divisible by 4." },
          { in: "nums = [1]", out: "1", note: "1 is square-free." },
          { in: "nums = [2,3,6]", out: "4", note: "{2}, {3}, {6} and {2,3}; pairing 6 with either factor repeats a prime." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 30"]),
      hints: [
        "Values are at most 30, so only the ten primes below 30 can appear — encode each value as a 10-bit prime mask.",
        "A value divisible by a square (4, 8, 9, 12, …) can never be used at all.",
        "A subset is square-free exactly when the chosen masks are pairwise disjoint, which is a subset-sum DP over 1024 states.",
      ],
      editorial: explain({
        idea: "A product is square-free precisely when no prime repeats, so each usable value becomes a set of primes and a valid subset is a collection of pairwise-disjoint sets. Counting those is a DP over the 1024 possible prime sets.",
        steps: [
          "For each value, build its prime mask, marking it unusable if any prime appears squared.",
          "Keep `dp[mask]`, the number of subsets whose combined prime set is exactly `mask`, seeded with `dp[0] = 1` for the empty subset.",
          "For each usable value, iterate the states downward and add `dp[s]` into `dp[s | m]` whenever `s` and `m` are disjoint.",
          "Sum all states and subtract 1 for the empty subset.",
        ],
        why: "Iterating the states in decreasing order is what stops a value from being used twice within one pass. The value `1` has an empty mask, so `dp[s] += dp[s]` doubles every count — exactly right, since each `1` may independently be included or left out.",
        time: "O(n · 1024)",
        space: "O(1024)",
        pitfalls: [
          "Forgetting to subtract the empty subset overcounts by one.",
          "Treating `1` as unusable loses the factor of `2^(number of ones)`.",
          "Iterating states upward lets a single element be chosen more than once.",
        ],
      }),
      examples: [
        { input: "[3,4,4,5]", expectedOutput: "3" },
        { input: "[1]", expectedOutput: "1" },
        { input: "[2,3,6]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 1, 30));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef squareFreeSubsets(nums: List[int]) -> int:\n    MOD = 1000000007\n    primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\n\n    def mask_of(v: int) -> int:\n        m = 0\n        for i, p in enumerate(primes):\n            if v % p == 0:\n                if v % (p * p) == 0:\n                    return -1\n                m |= 1 << i\n        return m\n\n    dp = [0] * 1024\n    dp[0] = 1\n    for v in nums:\n        m = mask_of(v)\n        if m < 0:\n            continue\n        for s in range(1023, -1, -1):\n            if dp[s] and not (s & m):\n                dp[s | m] = (dp[s | m] + dp[s]) % MOD\n    return (sum(dp) - 1) % MOD`,
        javascript: `var squareFreeSubsets = function(nums) {\n    var MOD = 1000000007;\n    var primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];\n    var maskOf = function(v) {\n        var m = 0;\n        for (var i = 0; i < primes.length; i++) {\n            var p = primes[i];\n            if (v % p === 0) {\n                if (v % (p * p) === 0) return -1;\n                m |= 1 << i;\n            }\n        }\n        return m;\n    };\n    var dp = [];\n    for (var t = 0; t < 1024; t++) dp.push(0);\n    dp[0] = 1;\n    for (var j = 0; j < nums.length; j++) {\n        var m = maskOf(nums[j]);\n        if (m < 0) continue;\n        for (var s = 1023; s >= 0; s--) {\n            if (dp[s] === 0) continue;\n            if ((s & m) !== 0) continue;\n            dp[s | m] = (dp[s | m] + dp[s]) % MOD;\n        }\n    }\n    var total = 0;\n    for (var u = 0; u < 1024; u++) total = (total + dp[u]) % MOD;\n    return (total - 1 + MOD) % MOD;\n};`,
        typescript: `function squareFreeSubsets(nums: number[]): number {\n    var MOD = 1000000007;\n    var primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];\n    var maskOf = function(v: number): number {\n        var m = 0;\n        for (var i = 0; i < primes.length; i++) {\n            var p = primes[i];\n            if (v % p === 0) {\n                if (v % (p * p) === 0) return -1;\n                m |= 1 << i;\n            }\n        }\n        return m;\n    };\n    var dp: number[] = [];\n    for (var t = 0; t < 1024; t++) dp.push(0);\n    dp[0] = 1;\n    for (var j = 0; j < nums.length; j++) {\n        var m = maskOf(nums[j]);\n        if (m < 0) continue;\n        for (var s = 1023; s >= 0; s--) {\n            if (dp[s] === 0) continue;\n            if ((s & m) !== 0) continue;\n            dp[s | m] = (dp[s | m] + dp[s]) % MOD;\n        }\n    }\n    var total = 0;\n    for (var u = 0; u < 1024; u++) total = (total + dp[u]) % MOD;\n    return (total - 1 + MOD) % MOD;\n}`,
        java: `public static int squareFreeSubsets(int[] nums) {\n    final long MOD = 1000000007L;\n    int[] primes = { 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 };\n    long[] dp = new long[1024];\n    dp[0] = 1;\n    for (int v : nums) {\n        int m = 0;\n        boolean ok = true;\n        for (int i = 0; i < 10 && ok; i++) {\n            int p = primes[i];\n            if (v % p == 0) {\n                if (v % (p * p) == 0) ok = false;\n                else m |= 1 << i;\n            }\n        }\n        if (!ok) continue;\n        for (int s = 1023; s >= 0; s--) {\n            if (dp[s] == 0 || (s & m) != 0) continue;\n            dp[s | m] = (dp[s | m] + dp[s]) % MOD;\n        }\n    }\n    long total = 0;\n    for (long v : dp) total = (total + v) % MOD;\n    return (int) ((total - 1 + MOD) % MOD);\n}`,
        cpp: `int squareFreeSubsets(vector<int>& nums) {\n    const long long MOD = 1000000007LL;\n    int primes[10] = { 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 };\n    vector<long long> dp(1024, 0);\n    dp[0] = 1;\n    for (int v : nums) {\n        int m = 0;\n        bool ok = true;\n        for (int i = 0; i < 10 && ok; i++) {\n            int p = primes[i];\n            if (v % p == 0) {\n                if (v % (p * p) == 0) ok = false;\n                else m |= 1 << i;\n            }\n        }\n        if (!ok) continue;\n        for (int s = 1023; s >= 0; s--) {\n            if (dp[s] == 0 || (s & m) != 0) continue;\n            dp[s | m] = (dp[s | m] + dp[s]) % MOD;\n        }\n    }\n    long long total = 0;\n    for (long long v : dp) total = (total + v) % MOD;\n    return (int) ((total - 1 + MOD) % MOD);\n}`,
        c: `int squareFreeSubsets(int* nums, int numsSize) {\n    const long long MOD = 1000000007LL;\n    int primes[10] = { 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 };\n    long long* dp = (long long*) calloc(1024, sizeof(long long));\n    dp[0] = 1;\n    for (int j = 0; j < numsSize; j++) {\n        int v = nums[j];\n        int m = 0, ok = 1;\n        for (int i = 0; i < 10 && ok; i++) {\n            int p = primes[i];\n            if (v % p == 0) {\n                if (v % (p * p) == 0) ok = 0;\n                else m |= 1 << i;\n            }\n        }\n        if (!ok) continue;\n        for (int s = 1023; s >= 0; s--) {\n            if (dp[s] == 0 || (s & m) != 0) continue;\n            dp[s | m] = (dp[s | m] + dp[s]) % MOD;\n        }\n    }\n    long long total = 0;\n    for (int s = 0; s < 1024; s++) total = (total + dp[s]) % MOD;\n    free(dp);\n    return (int) ((total - 1 + MOD) % MOD);\n}`,
        csharp: `public static int SquareFreeSubsets(int[] nums)\n{\n    const long MOD = 1000000007L;\n    int[] primes = { 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 };\n    long[] dp = new long[1024];\n    dp[0] = 1;\n    foreach (int v in nums)\n    {\n        int m = 0;\n        bool ok = true;\n        for (int i = 0; i < 10 && ok; i++)\n        {\n            int p = primes[i];\n            if (v % p == 0)\n            {\n                if (v % (p * p) == 0) ok = false;\n                else m |= 1 << i;\n            }\n        }\n        if (!ok) continue;\n        for (int s = 1023; s >= 0; s--)\n        {\n            if (dp[s] == 0 || (s & m) != 0) continue;\n            dp[s | m] = (dp[s | m] + dp[s]) % MOD;\n        }\n    }\n    long total = 0;\n    foreach (long v in dp) total = (total + v) % MOD;\n    return (int) ((total - 1 + MOD) % MOD);\n}`,
        go: `func squareFreeSubsets(nums []int) int {\n\tconst mod = 1000000007\n\tprimes := []int{2, 3, 5, 7, 11, 13, 17, 19, 23, 29}\n\tdp := make([]int, 1024)\n\tdp[0] = 1\n\tfor _, v := range nums {\n\t\tm, ok := 0, true\n\t\tfor i := 0; i < 10 && ok; i++ {\n\t\t\tp := primes[i]\n\t\t\tif v%p == 0 {\n\t\t\t\tif v%(p*p) == 0 {\n\t\t\t\t\tok = false\n\t\t\t\t} else {\n\t\t\t\t\tm |= 1 << uint(i)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tif !ok {\n\t\t\tcontinue\n\t\t}\n\t\tfor s := 1023; s >= 0; s-- {\n\t\t\tif dp[s] == 0 || s&m != 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tdp[s|m] = (dp[s|m] + dp[s]) % mod\n\t\t}\n\t}\n\ttotal := 0\n\tfor _, v := range dp {\n\t\ttotal = (total + v) % mod\n\t}\n\treturn (total - 1 + mod) % mod\n}`,
        kotlin: `fun squareFreeSubsets(nums: IntArray): Int {\n    val mod = 1000000007L\n    val primes = intArrayOf(2, 3, 5, 7, 11, 13, 17, 19, 23, 29)\n    val dp = LongArray(1024)\n    dp[0] = 1\n    for (v in nums) {\n        var m = 0\n        var ok = true\n        var i = 0\n        while (i < 10 && ok) {\n            val p = primes[i]\n            if (v % p == 0) {\n                if (v % (p * p) == 0) ok = false\n                else m = m or (1 shl i)\n            }\n            i++\n        }\n        if (!ok) continue\n        for (s in 1023 downTo 0) {\n            if (dp[s] == 0L || (s and m) != 0) continue\n            dp[s or m] = (dp[s or m] + dp[s]) % mod\n        }\n    }\n    var total = 0L\n    for (v in dp) total = (total + v) % mod\n    return ((total - 1 + mod) % mod).toInt()\n}`,
        swift: `func squareFreeSubsets(_ nums: [Int]) -> Int {\n    let mod = 1000000007\n    let primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\n    var dp = [Int](repeating: 0, count: 1024)\n    dp[0] = 1\n    for v in nums {\n        var m = 0\n        var ok = true\n        for i in 0..<10 where ok {\n            let p = primes[i]\n            if v % p == 0 {\n                if v % (p * p) == 0 { ok = false }\n                else { m |= 1 << i }\n            }\n        }\n        if !ok { continue }\n        var s = 1023\n        while s >= 0 {\n            if dp[s] != 0 && (s & m) == 0 {\n                dp[s | m] = (dp[s | m] + dp[s]) % mod\n            }\n            s -= 1\n        }\n    }\n    var total = 0\n    for v in dp { total = (total + v) % mod }\n    return (total - 1 + mod) % mod\n}`,
        rust: `fn squareFreeSubsets(nums: Vec<i32>) -> i32 {\n    let md: i64 = 1000000007;\n    let primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];\n    let mut dp = vec![0i64; 1024];\n    dp[0] = 1;\n    for &v in nums.iter() {\n        let mut m = 0usize;\n        let mut ok = true;\n        for i in 0..10 {\n            if !ok {\n                break;\n            }\n            let p = primes[i];\n            if v % p == 0 {\n                if v % (p * p) == 0 {\n                    ok = false;\n                } else {\n                    m |= 1 << i;\n                }\n            }\n        }\n        if !ok {\n            continue;\n        }\n        for s in (0..1024usize).rev() {\n            if dp[s] == 0 || (s & m) != 0 {\n                continue;\n            }\n            dp[s | m] = (dp[s | m] + dp[s]) % md;\n        }\n    }\n    let mut total: i64 = 0;\n    for v in dp.iter() {\n        total = (total + v) % md;\n    }\n    ((total - 1 + md) % md) as i32\n}`,
        php: `function squareFreeSubsets($nums) {\n    $mod = 1000000007;\n    $primes = array(2, 3, 5, 7, 11, 13, 17, 19, 23, 29);\n    $dp = array_fill(0, 1024, 0);\n    $dp[0] = 1;\n    foreach ($nums as $v) {\n        $m = 0;\n        $ok = true;\n        for ($i = 0; $i < 10 && $ok; $i++) {\n            $p = $primes[$i];\n            if ($v % $p === 0) {\n                if ($v % ($p * $p) === 0) $ok = false;\n                else $m |= 1 << $i;\n            }\n        }\n        if (!$ok) continue;\n        for ($s = 1023; $s >= 0; $s--) {\n            if ($dp[$s] === 0 || ($s & $m) !== 0) continue;\n            $dp[$s | $m] = ($dp[$s | $m] + $dp[$s]) % $mod;\n        }\n    }\n    $total = 0;\n    foreach ($dp as $v) $total = ($total + $v) % $mod;\n    return ($total - 1 + $mod) % $mod;\n}`,
        ruby: `def squareFreeSubsets(nums)\n  mod = 1000000007\n  primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\n  dp = Array.new(1024, 0)\n  dp[0] = 1\n  nums.each do |v|\n    m = 0\n    ok = true\n    primes.each_with_index do |p, i|\n      next unless v % p == 0\n      if v % (p * p) == 0\n        ok = false\n        break\n      end\n      m |= 1 << i\n    end\n    next unless ok\n    1023.downto(0) do |s|\n      next if dp[s] == 0 || (s & m) != 0\n      dp[s | m] = (dp[s | m] + dp[s]) % mod\n    end\n  end\n  (dp.sum - 1) % mod\nend`,
      },
    };
  })(),

  // ── Shortest Path Visiting All Nodes (LC 847) ───────────────────
  (() => {
    const ref = (graph: number[][]) => {
      const n = graph.length;
      const full = (1 << n) - 1;
      const size = full + 1;
      const seen = new Array(n * size).fill(false);
      let queue: number[] = [];
      for (let i = 0; i < n; i++) {
        const state = i * size + (1 << i);
        seen[state] = true;
        queue.push(state);
      }
      let steps = 0;
      while (queue.length > 0) {
        const next: number[] = [];
        for (const state of queue) {
          const node = Math.floor(state / size);
          const mask = state % size;
          if (mask === full) return steps;
          for (const nb of graph[node]) {
            const nm = mask | (1 << nb);
            const ns = nb * size + nm;
            if (!seen[ns]) { seen[ns] = true; next.push(ns); }
          }
        }
        queue = next;
        steps++;
      }
      return -1;
    };
    return {
      slug: "shortest-path-visiting-all-nodes",
      title: "Shortest Path Visiting All Nodes",
      difficulty: "HARD" as const,
      tags: ["Bit Manipulation", "Breadth-First Search", "Graph", "Bitmask", "Google", "Amazon", "Meta"],
      signature: { funcName: "shortestPathLength", params: [{ name: "graph", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a connected undirected graph as adjacency lists: `graph[i]` lists the neighbours of node `i`.\n\nReturn the length of the shortest walk that visits **every** node. You may start and stop at any node, and you may revisit nodes and edges freely.",
        [
          { in: "graph = [[1,2,3],[0],[0],[0]]", out: "4", note: "A star: one route is 1 → 0 → 2 → 0 → 3, four edges." },
          { in: "graph = [[1],[0,2,4],[1,3,4],[2],[1,2]]", out: "4", note: "0 → 1 → 4 → 2 → 3." },
          { in: "graph = [[1],[0]]", out: "1" },
        ],
        ["2 <= graph.length <= 12", "0 <= graph[i][j] < graph.length", "The graph is connected and has no self-loops."]),
      hints: [
        "Revisiting is allowed, so the usual 'visited node' bookkeeping does not apply — what matters is which nodes have been **covered** so far.",
        "A state is therefore a pair: the current node and a bitmask of covered nodes.",
        "Breadth-first search over those `n · 2^n` states finds the shortest walk, seeded with every node as a possible start.",
      ],
      editorial: explain({
        idea: "Expand the state from 'where am I' to 'where am I, and what have I covered'. Every edge traversal costs 1, so a breadth-first search over the expanded graph gives the shortest walk directly.",
        steps: [
          "Encode a state as `(node, mask)`, where `mask` has bit `v` set when node `v` has been visited.",
          "Seed the queue with `(i, 1 << i)` for every node `i` — the walk may start anywhere.",
          "Expand a state by moving to each neighbour and setting its bit in the mask.",
          "The first state whose mask is all ones is at the answer's distance.",
        ],
        why: "The expanded graph has `n · 2^n` states and every edge has weight 1, so breadth-first search is exact. Seeding all starts at distance 0 is what lets the search find the best starting point without trying them one at a time. Revisits are harmless because a repeated `(node, mask)` is pruned and any genuinely new coverage produces a new state.",
        time: "O(n² · 2^n)",
        space: "O(n · 2^n)",
        pitfalls: [
          "Marking nodes rather than states visited prevents the legal revisits the problem depends on.",
          "Starting from a single node gives the shortest walk from that node, not the global shortest.",
          "Checking for completion when a state is dequeued — not when it is enqueued — keeps the distance bookkeeping simple.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[0],[0],[0]]", expectedOutput: "4" },
        { input: "[[1],[0,2,4],[1,3,4],[2],[1,2]]", expectedOutput: "4" },
        { input: "[[1],[0]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 8);
        const adj: number[][] = Array.from({ length: n }, () => []);
        const link = (a: number, b: number) => {
          if (adj[a].indexOf(b) < 0) { adj[a].push(b); adj[b].push(a); }
        };
        for (let v = 1; v < n; v++) link(v, ri(rng, 0, v - 1));
        for (let extra = ri(rng, 0, n); extra > 0; extra--) {
          const a = ri(rng, 0, n - 1);
          let b = ri(rng, 0, n - 1);
          while (b === a) b = ri(rng, 0, n - 1);
          link(a, b);
        }
        for (const row of adj) row.sort((x, y) => x - y);
        return { input: fmtIntMat(adj), expectedOutput: String(ref(adj)) };
      },
      solutions: {
        python: `from collections import deque\nfrom typing import List\n\ndef shortestPathLength(graph: List[List[int]]) -> int:\n    n = len(graph)\n    full = (1 << n) - 1\n    seen = set()\n    queue = deque()\n    for i in range(n):\n        queue.append((i, 1 << i, 0))\n        seen.add((i, 1 << i))\n    while queue:\n        node, mask, steps = queue.popleft()\n        if mask == full:\n            return steps\n        for nb in graph[node]:\n            nm = mask | (1 << nb)\n            if (nb, nm) not in seen:\n                seen.add((nb, nm))\n                queue.append((nb, nm, steps + 1))\n    return -1`,
        javascript: `var shortestPathLength = function(graph) {\n    var n = graph.length;\n    var full = (1 << n) - 1;\n    var size = full + 1;\n    var seen = [];\n    for (var t = 0; t < n * size; t++) seen.push(false);\n    var queue = [];\n    for (var i = 0; i < n; i++) {\n        var state = i * size + (1 << i);\n        seen[state] = true;\n        queue.push(state);\n    }\n    var steps = 0;\n    while (queue.length > 0) {\n        var next = [];\n        for (var q = 0; q < queue.length; q++) {\n            var s = queue[q];\n            var node = Math.floor(s / size);\n            var mask = s % size;\n            if (mask === full) return steps;\n            for (var e = 0; e < graph[node].length; e++) {\n                var nb = graph[node][e];\n                var ns = nb * size + (mask | (1 << nb));\n                if (!seen[ns]) { seen[ns] = true; next.push(ns); }\n            }\n        }\n        queue = next;\n        steps++;\n    }\n    return -1;\n};`,
        typescript: `function shortestPathLength(graph: number[][]): number {\n    var n = graph.length;\n    var full = (1 << n) - 1;\n    var size = full + 1;\n    var seen: boolean[] = [];\n    for (var t = 0; t < n * size; t++) seen.push(false);\n    var queue: number[] = [];\n    for (var i = 0; i < n; i++) {\n        var state = i * size + (1 << i);\n        seen[state] = true;\n        queue.push(state);\n    }\n    var steps = 0;\n    while (queue.length > 0) {\n        var next: number[] = [];\n        for (var q = 0; q < queue.length; q++) {\n            var s = queue[q];\n            var node = Math.floor(s / size);\n            var mask = s % size;\n            if (mask === full) return steps;\n            for (var e = 0; e < graph[node].length; e++) {\n                var nb = graph[node][e];\n                var ns = nb * size + (mask | (1 << nb));\n                if (!seen[ns]) { seen[ns] = true; next.push(ns); }\n            }\n        }\n        queue = next;\n        steps++;\n    }\n    return -1;\n}`,
        java: `public static int shortestPathLength(int[][] graph) {\n    int n = graph.length;\n    int full = (1 << n) - 1;\n    int size = full + 1;\n    boolean[] seen = new boolean[n * size];\n    Deque<Integer> queue = new ArrayDeque<>();\n    for (int i = 0; i < n; i++) {\n        int state = i * size + (1 << i);\n        seen[state] = true;\n        queue.add(state);\n    }\n    int steps = 0;\n    while (!queue.isEmpty()) {\n        int levelSize = queue.size();\n        for (int c = 0; c < levelSize; c++) {\n            int s = queue.poll();\n            int node = s / size;\n            int mask = s % size;\n            if (mask == full) return steps;\n            for (int nb : graph[node]) {\n                int ns = nb * size + (mask | (1 << nb));\n                if (!seen[ns]) { seen[ns] = true; queue.add(ns); }\n            }\n        }\n        steps++;\n    }\n    return -1;\n}`,
        cpp: `int shortestPathLength(vector<vector<int>>& graph) {\n    int n = (int) graph.size();\n    int full = (1 << n) - 1;\n    int size = full + 1;\n    vector<bool> seen(n * size, false);\n    queue<int> q;\n    for (int i = 0; i < n; i++) {\n        int state = i * size + (1 << i);\n        seen[state] = true;\n        q.push(state);\n    }\n    int steps = 0;\n    while (!q.empty()) {\n        int levelSize = (int) q.size();\n        for (int c = 0; c < levelSize; c++) {\n            int s = q.front();\n            q.pop();\n            int node = s / size;\n            int mask = s % size;\n            if (mask == full) return steps;\n            for (int nb : graph[node]) {\n                int ns = nb * size + (mask | (1 << nb));\n                if (!seen[ns]) { seen[ns] = true; q.push(ns); }\n            }\n        }\n        steps++;\n    }\n    return -1;\n}`,
        c: `int shortestPathLength(int** graph, int graphSize, int* graphColSize) {\n    int n = graphSize;\n    int full = (1 << n) - 1;\n    int size = full + 1;\n    int totalStates = n * size;\n    int* seen = (int*) calloc((size_t) totalStates, sizeof(int));\n    int* queue = (int*) malloc((size_t) totalStates * sizeof(int));\n    int head = 0, tail = 0;\n    for (int i = 0; i < n; i++) {\n        int state = i * size + (1 << i);\n        seen[state] = 1;\n        queue[tail++] = state;\n    }\n    int steps = 0;\n    while (head < tail) {\n        int levelEnd = tail;\n        while (head < levelEnd) {\n            int s = queue[head++];\n            int node = s / size;\n            int mask = s % size;\n            if (mask == full) {\n                free(seen);\n                free(queue);\n                return steps;\n            }\n            for (int e = 0; e < graphColSize[node]; e++) {\n                int nb = graph[node][e];\n                int ns = nb * size + (mask | (1 << nb));\n                if (!seen[ns]) { seen[ns] = 1; queue[tail++] = ns; }\n            }\n        }\n        steps++;\n    }\n    free(seen);\n    free(queue);\n    return -1;\n}`,
        csharp: `public static int ShortestPathLength(int[][] graph)\n{\n    int n = graph.Length;\n    int full = (1 << n) - 1;\n    int size = full + 1;\n    bool[] seen = new bool[n * size];\n    var queue = new Queue<int>();\n    for (int i = 0; i < n; i++)\n    {\n        int state = i * size + (1 << i);\n        seen[state] = true;\n        queue.Enqueue(state);\n    }\n    int steps = 0;\n    while (queue.Count > 0)\n    {\n        int levelSize = queue.Count;\n        for (int c = 0; c < levelSize; c++)\n        {\n            int s = queue.Dequeue();\n            int node = s / size;\n            int mask = s % size;\n            if (mask == full) return steps;\n            foreach (int nb in graph[node])\n            {\n                int ns = nb * size + (mask | (1 << nb));\n                if (!seen[ns]) { seen[ns] = true; queue.Enqueue(ns); }\n            }\n        }\n        steps++;\n    }\n    return -1;\n}`,
        go: `func shortestPathLength(graph [][]int) int {\n\tn := len(graph)\n\tfull := (1 << uint(n)) - 1\n\tsize := full + 1\n\tseen := make([]bool, n*size)\n\tqueue := []int{}\n\tfor i := 0; i < n; i++ {\n\t\tstate := i*size + (1 << uint(i))\n\t\tseen[state] = true\n\t\tqueue = append(queue, state)\n\t}\n\tsteps := 0\n\tfor len(queue) > 0 {\n\t\tnext := []int{}\n\t\tfor _, s := range queue {\n\t\t\tnode := s / size\n\t\t\tmask := s % size\n\t\t\tif mask == full {\n\t\t\t\treturn steps\n\t\t\t}\n\t\t\tfor _, nb := range graph[node] {\n\t\t\t\tns := nb*size + (mask | (1 << uint(nb)))\n\t\t\t\tif !seen[ns] {\n\t\t\t\t\tseen[ns] = true\n\t\t\t\t\tnext = append(next, ns)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tqueue = next\n\t\tsteps++\n\t}\n\treturn -1\n}`,
        kotlin: `fun shortestPathLength(graph: Array<IntArray>): Int {\n    val n = graph.size\n    val full = (1 shl n) - 1\n    val size = full + 1\n    val seen = BooleanArray(n * size)\n    var queue = ArrayList<Int>()\n    for (i in 0 until n) {\n        val state = i * size + (1 shl i)\n        seen[state] = true\n        queue.add(state)\n    }\n    var steps = 0\n    while (queue.isNotEmpty()) {\n        val next = ArrayList<Int>()\n        for (s in queue) {\n            val node = s / size\n            val mask = s % size\n            if (mask == full) return steps\n            for (nb in graph[node]) {\n                val ns = nb * size + (mask or (1 shl nb))\n                if (!seen[ns]) {\n                    seen[ns] = true\n                    next.add(ns)\n                }\n            }\n        }\n        queue = next\n        steps++\n    }\n    return -1\n}`,
        swift: `func shortestPathLength(_ graph: [[Int]]) -> Int {\n    let n = graph.count\n    let full = (1 << n) - 1\n    let size = full + 1\n    var seen = [Bool](repeating: false, count: n * size)\n    var queue: [Int] = []\n    for i in 0..<n {\n        let state = i * size + (1 << i)\n        seen[state] = true\n        queue.append(state)\n    }\n    var steps = 0\n    while !queue.isEmpty {\n        var next: [Int] = []\n        for s in queue {\n            let node = s / size\n            let mask = s % size\n            if mask == full { return steps }\n            for nb in graph[node] {\n                let ns = nb * size + (mask | (1 << nb))\n                if !seen[ns] {\n                    seen[ns] = true\n                    next.append(ns)\n                }\n            }\n        }\n        queue = next\n        steps += 1\n    }\n    return -1\n}`,
        rust: `fn shortestPathLength(graph: Vec<Vec<i32>>) -> i32 {\n    let n = graph.len();\n    let full = (1usize << n) - 1;\n    let size = full + 1;\n    let mut seen = vec![false; n * size];\n    let mut queue: Vec<usize> = Vec::new();\n    for i in 0..n {\n        let state = i * size + (1 << i);\n        seen[state] = true;\n        queue.push(state);\n    }\n    let mut steps = 0i32;\n    while !queue.is_empty() {\n        let mut next: Vec<usize> = Vec::new();\n        for &s in queue.iter() {\n            let node = s / size;\n            let mask = s % size;\n            if mask == full {\n                return steps;\n            }\n            for &nb in graph[node].iter() {\n                let nb = nb as usize;\n                let ns = nb * size + (mask | (1 << nb));\n                if !seen[ns] {\n                    seen[ns] = true;\n                    next.push(ns);\n                }\n            }\n        }\n        queue = next;\n        steps += 1;\n    }\n    -1\n}`,
        php: `function shortestPathLength($graph) {\n    $n = count($graph);\n    $full = (1 << $n) - 1;\n    $size = $full + 1;\n    $seen = array_fill(0, $n * $size, false);\n    $queue = array();\n    for ($i = 0; $i < $n; $i++) {\n        $state = $i * $size + (1 << $i);\n        $seen[$state] = true;\n        $queue[] = $state;\n    }\n    $steps = 0;\n    while (count($queue) > 0) {\n        $next = array();\n        foreach ($queue as $s) {\n            $node = intdiv($s, $size);\n            $mask = $s % $size;\n            if ($mask === $full) return $steps;\n            foreach ($graph[$node] as $nb) {\n                $ns = $nb * $size + ($mask | (1 << $nb));\n                if (!$seen[$ns]) { $seen[$ns] = true; $next[] = $ns; }\n            }\n        }\n        $queue = $next;\n        $steps++;\n    }\n    return -1;\n}`,
        ruby: `def shortestPathLength(graph)\n  n = graph.length\n  full = (1 << n) - 1\n  size = full + 1\n  seen = Array.new(n * size, false)\n  queue = []\n  (0...n).each do |i|\n    state = i * size + (1 << i)\n    seen[state] = true\n    queue << state\n  end\n  steps = 0\n  until queue.empty?\n    nxt = []\n    queue.each do |s|\n      node = s / size\n      mask = s % size\n      return steps if mask == full\n      graph[node].each do |nb|\n        ns = nb * size + (mask | (1 << nb))\n        unless seen[ns]\n          seen[ns] = true\n          nxt << ns\n        end\n      end\n    end\n    queue = nxt\n    steps += 1\n  end\n  -1\nend`,
      },
    };
  })(),
];
