/**
 * Bit manipulation and number theory, second wave — the XOR tricks and
 * base-conversion questions that Amazon, Google and Microsoft use as warm-ups,
 * plus the arithmetic-without-operators classics.
 * Company names ride in `tags`.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const randArr = (rng: Rng, n: number, lo: number, hi: number) =>
  Array.from({ length: n }, () => ri(rng, lo, hi));

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const randStr = (rng: Rng, lo: number, hi: number, alphabet = LOWER) =>
  Array.from({ length: ri(rng, lo, hi) }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");

const popcount = (x: number) => {
  let count = 0;
  let v = x >>> 0;
  while (v > 0) {
    count += v & 1;
    v >>>= 1;
  }
  return count;
};

export const BITS2_PROBLEMS: CatalogProblem[] = [

  // ── Single Number II ────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let answer = 0;
      for (let bit = 0; bit < 32; bit++) {
        let ones = 0;
        for (let i = 0; i < nums.length; i++) ones += (nums[i] >> bit) & 1;
        if (ones % 3 !== 0) answer |= 1 << bit;
      }
      return answer | 0;
    };
    return {
      slug: "single-number-ii",
      title: "Single Number II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Bit Manipulation", "Amazon", "Google", "Microsoft", "Bloomberg"],
      signature: { funcName: "singleNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` where every element appears **exactly three times** except for one, which appears once, find that single element.\n\nSolve it in linear time using constant extra space.",
        [
          { in: "nums = [2,2,3,2]", out: "3" },
          { in: "nums = [0,1,0,1,0,1,99]", out: "99" },
          { in: "nums = [-2,-2,1,1,-3,1,-3,-3,-4,-2]", out: "-4" },
        ],
        ["1 <= nums.length <= 40", "-1000000 <= nums[i] <= 1000000", "Every element appears three times except one, which appears once."]),
      hints: [
        "XOR alone does not work — it cancels pairs, not triples.",
        "Look at each of the 32 bit positions independently and count how many numbers have that bit set.",
        "That count is a multiple of 3 plus the loner's bit, so `count % 3` recovers the answer bit by bit; sign-extend for negatives.",
      ],
      examples: [
        { input: "[2,2,3,2]", expectedOutput: "3" },
        { input: "[0,1,0,1,0,1,99]", expectedOutput: "99" },
        { input: "[-2,-2,1,1,-3,1,-3,-3,-4,-2]", expectedOutput: "-4" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 20 : 1000000;
        const triples = ri(rng, 0, 13);
        const values: number[] = [];
        for (let i = 0; i < triples; i++) {
          const v = ri(rng, -hi, hi);
          values.push(v, v, v);
        }
        values.push(ri(rng, -hi, hi));
        const nums = shuffle(rng, values);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def singleNumber(nums) -> int:\n    answer = 0\n    for bit in range(32):\n        ones = sum((x >> bit) & 1 for x in nums)\n        if ones % 3:\n            answer |= 1 << bit\n    if answer >= (1 << 31):\n        answer -= 1 << 32\n    return answer`,
        javascript: `var singleNumber = function(nums) {\n    let answer = 0;\n    for (let bit = 0; bit < 32; bit++) {\n        let ones = 0;\n        for (let i = 0; i < nums.length; i++) ones += (nums[i] >> bit) & 1;\n        if (ones % 3 !== 0) answer |= 1 << bit;\n    }\n    return answer | 0;\n};`,
              typescript: `function singleNumber(nums: number[]): number {\n    var answer = 0;\n    for (var bit = 0; bit < 32; bit++) {\n        var ones = 0;\n        for (var i = 0; i < nums.length; i++) ones += (nums[i] >> bit) & 1;\n        if (ones % 3 !== 0) answer |= 1 << bit;\n    }\n    return answer | 0;\n}`,
              java: `public static int singleNumber(int[] nums) {\n    int answer = 0;\n    for (int bit = 0; bit < 32; bit++) {\n        int ones = 0;\n        for (int x : nums) ones += (x >> bit) & 1;\n        if (ones % 3 != 0) answer |= 1 << bit;\n    }\n    return answer;\n}`,
              cpp: `int singleNumber(vector<int>& nums) {\n    int answer = 0;\n    for (int bit = 0; bit < 32; bit++) {\n        int ones = 0;\n        for (int x : nums) ones += (x >> bit) & 1;\n        if (ones % 3 != 0) answer |= 1 << bit;\n    }\n    return answer;\n}`,
              c: `int singleNumber(int* nums, int numsSize) {\n    unsigned int answer = 0;\n    for (int bit = 0; bit < 32; bit++) {\n        int ones = 0;\n        for (int i = 0; i < numsSize; i++) ones += (int) (((unsigned int) nums[i] >> bit) & 1u);\n        if (ones % 3 != 0) answer |= 1u << bit;\n    }\n    return (int) answer;\n}`,
              csharp: `public static int SingleNumber(int[] nums)\n{\n    int answer = 0;\n    for (int bit = 0; bit < 32; bit++)\n    {\n        int ones = 0;\n        foreach (int x in nums) ones += (x >> bit) & 1;\n        if (ones % 3 != 0) answer |= 1 << bit;\n    }\n    return answer;\n}`,
              go: `func singleNumber(nums []int) int {\n	answer := 0\n	for bit := 0; bit < 32; bit++ {\n		ones := 0\n		for _, x := range nums {\n			ones += (x >> uint(bit)) & 1\n		}\n		if ones%3 != 0 {\n			answer |= 1 << uint(bit)\n		}\n	}\n	if answer >= (1 << 31) {\n		answer -= 1 << 32\n	}\n	return answer\n}`,
              kotlin: `fun singleNumber(nums: IntArray): Int {\n    var answer = 0\n    for (bit in 0 until 32) {\n        var ones = 0\n        for (x in nums) ones += (x shr bit) and 1\n        if (ones % 3 != 0) answer = answer or (1 shl bit)\n    }\n    return answer\n}`,
              swift: `func singleNumber(_ nums: [Int]) -> Int {\n    var answer: Int32 = 0\n    for bit in 0..<32 {\n        var ones = 0\n        for x in nums {\n            ones += Int((Int32(truncatingIfNeeded: x) >> Int32(bit)) & 1)\n        }\n        if ones % 3 != 0 {\n            answer |= Int32(bitPattern: UInt32(1) << UInt32(bit))\n        }\n    }\n    return Int(answer)\n}`,
              rust: `fn singleNumber(nums: Vec<i32>) -> i32 {\n    let mut answer: u32 = 0;\n    for bit in 0..32 {\n        let mut ones = 0;\n        for x in nums.iter() {\n            ones += ((*x >> bit) & 1) as i32;\n        }\n        if ones % 3 != 0 {\n            answer |= 1u32 << bit;\n        }\n    }\n    answer as i32\n}`,
              php: `function singleNumber($nums) {\n    $answer = 0;\n    for ($bit = 0; $bit < 32; $bit++) {\n        $ones = 0;\n        foreach ($nums as $x) $ones += ($x >> $bit) & 1;\n        if ($ones % 3 !== 0) $answer |= 1 << $bit;\n    }\n    if ($answer >= (1 << 31)) $answer -= 1 << 32;\n    return $answer;\n}`,
              ruby: `def singleNumber(nums)\n  answer = 0\n  (0...32).each do |bit|\n    ones = nums.map { |x| (x >> bit) & 1 }.sum\n    answer |= 1 << bit if ones % 3 != 0\n  end\n  answer -= 1 << 32 if answer >= (1 << 31)\n  answer\nend`,
      },
    };
  })(),

  // ── Single Number III ───────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let xorAll = 0;
      for (let i = 0; i < nums.length; i++) xorAll ^= nums[i];
      const lowBit = xorAll & -xorAll;
      let a = 0, b = 0;
      for (let i = 0; i < nums.length; i++) {
        if ((nums[i] & lowBit) !== 0) a ^= nums[i];
        else b ^= nums[i];
      }
      return a < b ? [a, b] : [b, a];
    };
    return {
      slug: "single-number-iii",
      title: "Single Number III",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Bit Manipulation", "Amazon", "Google", "Meta"],
      signature: { funcName: "singleNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "In an integer array `nums`, exactly **two** elements appear only once and all the others appear exactly twice.\n\nFind the two loners and return them sorted in ascending order. Aim for linear time and constant extra space.",
        [
          { in: "nums = [1,2,1,3,2,5]", out: "[3,5]" },
          { in: "nums = [-1,0]", out: "[-1,0]" },
          { in: "nums = [0,1]", out: "[0,1]" },
        ],
        ["2 <= nums.length <= 40", "-1000000 <= nums[i] <= 1000000", "Exactly two elements appear once; every other element appears twice."]),
      hints: [
        "XOR everything: the pairs cancel and you are left with `a ^ b`.",
        "Since `a != b`, that XOR has at least one set bit — pick the lowest one with `x & -x`.",
        "That bit splits the array into two groups, each containing exactly one loner; XOR each group separately.",
      ],
      examples: [
        { input: "[1,2,1,3,2,5]", expectedOutput: "[3,5]" },
        { input: "[-1,0]", expectedOutput: "[-1,0]" },
        { input: "[0,1]", expectedOutput: "[0,1]" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 30 : 1000000;
        const used = new Set<number>();
        const draw = () => {
          let v = ri(rng, -hi, hi);
          while (used.has(v)) v = ri(rng, -hi, hi);
          used.add(v);
          return v;
        };
        const values: number[] = [];
        const pairs = ri(rng, 0, 19);
        for (let i = 0; i < pairs; i++) {
          const v = draw();
          values.push(v, v);
        }
        values.push(draw(), draw());
        const nums = shuffle(rng, values);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def singleNumber(nums):\n    xor_all = 0\n    for x in nums:\n        xor_all ^= x\n    low_bit = xor_all & -xor_all\n    a = b = 0\n    for x in nums:\n        if x & low_bit:\n            a ^= x\n        else:\n            b ^= x\n    return [a, b] if a < b else [b, a]`,
        javascript: `var singleNumber = function(nums) {\n    let xorAll = 0;\n    for (let i = 0; i < nums.length; i++) xorAll ^= nums[i];\n    const lowBit = xorAll & -xorAll;\n    let a = 0, b = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if ((nums[i] & lowBit) !== 0) a ^= nums[i];\n        else b ^= nums[i];\n    }\n    return a < b ? [a, b] : [b, a];\n};`,
              typescript: `function singleNumber(nums: number[]): number[] {\n    var xorAll = 0;\n    for (var i = 0; i < nums.length; i++) xorAll ^= nums[i];\n    var lowBit = xorAll & -xorAll;\n    var a = 0;\n    var b = 0;\n    for (var j = 0; j < nums.length; j++) {\n        if ((nums[j] & lowBit) !== 0) a ^= nums[j];\n        else b ^= nums[j];\n    }\n    return a < b ? [a, b] : [b, a];\n}`,
              java: `public static int[] singleNumber(int[] nums) {\n    int xorAll = 0;\n    for (int x : nums) xorAll ^= x;\n    int lowBit = xorAll & -xorAll;\n    int a = 0, b = 0;\n    for (int x : nums) {\n        if ((x & lowBit) != 0) a ^= x;\n        else b ^= x;\n    }\n    return a < b ? new int[]{a, b} : new int[]{b, a};\n}`,
              cpp: `vector<int> singleNumber(vector<int>& nums) {\n    int xorAll = 0;\n    for (int x : nums) xorAll ^= x;\n    int lowBit = xorAll & -xorAll;\n    int a = 0, b = 0;\n    for (int x : nums) {\n        if ((x & lowBit) != 0) a ^= x;\n        else b ^= x;\n    }\n    if (a < b) return vector<int>{a, b};\n    return vector<int>{b, a};\n}`,
              c: `int* singleNumber(int* nums, int numsSize, int* returnSize) {\n    int xorAll = 0;\n    for (int i = 0; i < numsSize; i++) xorAll ^= nums[i];\n    int lowBit = xorAll & -xorAll;\n    int a = 0, b = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if ((nums[i] & lowBit) != 0) a ^= nums[i];\n        else b ^= nums[i];\n    }\n    int* out = (int*) malloc(2 * sizeof(int));\n    out[0] = a < b ? a : b;\n    out[1] = a < b ? b : a;\n    *returnSize = 2;\n    return out;\n}`,
              csharp: `public static int[] SingleNumber(int[] nums)\n{\n    int xorAll = 0;\n    foreach (int x in nums) xorAll ^= x;\n    int lowBit = xorAll & -xorAll;\n    int a = 0, b = 0;\n    foreach (int x in nums)\n    {\n        if ((x & lowBit) != 0) a ^= x;\n        else b ^= x;\n    }\n    return a < b ? new int[] { a, b } : new int[] { b, a };\n}`,
              go: `func singleNumber(nums []int) []int {\n	xorAll := 0\n	for _, x := range nums {\n		xorAll ^= x\n	}\n	lowBit := xorAll & -xorAll\n	a, b := 0, 0\n	for _, x := range nums {\n		if x&lowBit != 0 {\n			a ^= x\n		} else {\n			b ^= x\n		}\n	}\n	if a < b {\n		return []int{a, b}\n	}\n	return []int{b, a}\n}`,
              kotlin: `fun singleNumber(nums: IntArray): IntArray {\n    var xorAll = 0\n    for (x in nums) xorAll = xorAll xor x\n    val lowBit = xorAll and (-xorAll)\n    var a = 0\n    var b = 0\n    for (x in nums) {\n        if ((x and lowBit) != 0) a = a xor x else b = b xor x\n    }\n    return if (a < b) intArrayOf(a, b) else intArrayOf(b, a)\n}`,
              swift: `func singleNumber(_ nums: [Int]) -> [Int] {\n    var xorAll = 0\n    for x in nums { xorAll ^= x }\n    let lowBit = xorAll & (-xorAll)\n    var a = 0\n    var b = 0\n    for x in nums {\n        if (x & lowBit) != 0 { a ^= x } else { b ^= x }\n    }\n    return a < b ? [a, b] : [b, a]\n}`,
              rust: `fn singleNumber(nums: Vec<i32>) -> Vec<i32> {\n    let mut xor_all = 0i32;\n    for x in nums.iter() {\n        xor_all ^= *x;\n    }\n    let low_bit = xor_all & xor_all.wrapping_neg();\n    let mut a = 0i32;\n    let mut b = 0i32;\n    for x in nums.iter() {\n        if (*x & low_bit) != 0 {\n            a ^= *x;\n        } else {\n            b ^= *x;\n        }\n    }\n    if a < b { vec![a, b] } else { vec![b, a] }\n}`,
              php: `function singleNumber($nums) {\n    $xorAll = 0;\n    foreach ($nums as $x) $xorAll ^= $x;\n    $lowBit = $xorAll & -$xorAll;\n    $a = 0;\n    $b = 0;\n    foreach ($nums as $x) {\n        if (($x & $lowBit) !== 0) $a ^= $x;\n        else $b ^= $x;\n    }\n    return $a < $b ? array($a, $b) : array($b, $a);\n}`,
              ruby: `def singleNumber(nums)\n  xor_all = 0\n  nums.each { |x| xor_all ^= x }\n  low_bit = xor_all & -xor_all\n  a = 0\n  b = 0\n  nums.each do |x|\n    if (x & low_bit) != 0\n      a ^= x\n    else\n      b ^= x\n    end\n  end\n  a < b ? [a, b] : [b, a]\nend`,
      },
    };
  })(),

  // ── Number of 1 Bits ────────────────────────────────────────────
  (() => {
    return {
      slug: "number-of-1-bits",
      title: "Number of 1 Bits",
      difficulty: "EASY" as const,
      tags: ["Divide and Conquer", "Bit Manipulation", "Amazon", "Microsoft", "Apple", "Google"],
      signature: { funcName: "hammingWeight", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Write a function that takes a non-negative integer `n` and returns the number of `1` bits in its binary representation — its **Hamming weight**.",
        [
          { in: "n = 11", out: "3", note: "11 is 1011 in binary." },
          { in: "n = 128", out: "1" },
          { in: "n = 0", out: "0" },
        ],
        ["0 <= n <= 2147483647"],
        "If this function is called many times, how would you optimise it?"),
      hints: [
        "Test the lowest bit with `n & 1`, then shift right, until nothing is left.",
        "`n & (n - 1)` clears the lowest set bit, so a loop over that runs once per 1 bit instead of once per bit.",
        "Use a logical (unsigned) shift so the loop terminates.",
      ],
      examples: [
        { input: "11", expectedOutput: "3" },
        { input: "128", expectedOutput: "1" },
        { input: "0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.3 ? ri(rng, 0, 255) : ri(rng, 0, 2147483647);
        return { input: String(n), expectedOutput: String(popcount(n)) };
      },
      solutions: {
        python: `def hammingWeight(n: int) -> int:\n    count = 0\n    while n:\n        n &= n - 1\n        count += 1\n    return count`,
        javascript: `var hammingWeight = function(n) {\n    let count = 0;\n    let v = n >>> 0;\n    while (v > 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n};`,
              typescript: `function hammingWeight(n: number): number {\n    var count = 0;\n    var v = n >>> 0;\n    while (v > 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              java: `public static int hammingWeight(int n) {\n    int count = 0;\n    int v = n;\n    while (v != 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              cpp: `int hammingWeight(int n) {\n    unsigned int v = (unsigned int) n;\n    int count = 0;\n    while (v) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              c: `int hammingWeight(int n) {\n    unsigned int v = (unsigned int) n;\n    int count = 0;\n    while (v) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              csharp: `public static int HammingWeight(int n)\n{\n    uint v = (uint) n;\n    int count = 0;\n    while (v != 0)\n    {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              go: `func hammingWeight(n int) int {\n	count := 0\n	v := n\n	for v != 0 {\n		v &= v - 1\n		count++\n	}\n	return count\n}`,
              kotlin: `fun hammingWeight(n: Int): Int {\n    var count = 0\n    var v = n\n    while (v != 0) {\n        v = v and (v - 1)\n        count++\n    }\n    return count\n}`,
              swift: `func hammingWeight(_ n: Int) -> Int {\n    var count = 0\n    var v = n\n    while v != 0 {\n        v &= v - 1\n        count += 1\n    }\n    return count\n}`,
              rust: `fn hammingWeight(n: i32) -> i32 {\n    let mut v = n as u32;\n    let mut count = 0;\n    while v != 0 {\n        v &= v - 1;\n        count += 1;\n    }\n    count\n}`,
              php: `function hammingWeight($n) {\n    $count = 0;\n    $v = $n;\n    while ($v != 0) {\n        $v &= $v - 1;\n        $count++;\n    }\n    return $count;\n}`,
              ruby: `def hammingWeight(n)\n  count = 0\n  v = n\n  while v != 0\n    v &= v - 1\n    count += 1\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Counting Bits ───────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const out: number[] = [0];
      for (let i = 1; i <= n; i++) out.push(out[i >> 1] + (i & 1));
      return out;
    };
    return {
      slug: "counting-bits",
      title: "Counting Bits",
      difficulty: "EASY" as const,
      tags: ["Dynamic Programming", "Bit Manipulation", "Amazon", "Google", "Apple", "Meta"],
      signature: { funcName: "countBits", params: [{ name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer `n`, return an array `out` of length `n + 1` where `out[i]` is the number of `1` bits in the binary representation of `i`.",
        [
          { in: "n = 2", out: "[0,1,1]" },
          { in: "n = 5", out: "[0,1,1,2,1,2]" },
          { in: "n = 0", out: "[0]" },
        ],
        ["0 <= n <= 40"],
        "Can you do it in a single pass, in O(n) time and without any built-in popcount?"),
      hints: [
        "Counting the bits of every number independently is O(n log n) — you can do better.",
        "`i` and `i >> 1` differ only by the lowest bit of `i`.",
        "So `out[i] = out[i >> 1] + (i & 1)`, filling the array left to right.",
      ],
      examples: [
        { input: "2", expectedOutput: "[0,1,1]" },
        { input: "5", expectedOutput: "[0,1,1,2,1,2]" },
        { input: "0", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 40);
        return { input: String(n), expectedOutput: fmtIntArr(ref(n)) };
      },
      solutions: {
        python: `def countBits(n: int):\n    out = [0] * (n + 1)\n    for i in range(1, n + 1):\n        out[i] = out[i >> 1] + (i & 1)\n    return out`,
        javascript: `var countBits = function(n) {\n    const out = [0];\n    for (let i = 1; i <= n; i++) out.push(out[i >> 1] + (i & 1));\n    return out;\n};`,
              typescript: `function countBits(n: number): number[] {\n    var out: number[] = [0];\n    for (var i = 1; i <= n; i++) out.push(out[i >> 1] + (i & 1));\n    return out;\n}`,
              java: `public static int[] countBits(int n) {\n    int[] out = new int[n + 1];\n    for (int i = 1; i <= n; i++) out[i] = out[i >> 1] + (i & 1);\n    return out;\n}`,
              cpp: `vector<int> countBits(int n) {\n    vector<int> out(n + 1, 0);\n    for (int i = 1; i <= n; i++) out[i] = out[i >> 1] + (i & 1);\n    return out;\n}`,
              c: `int* countBits(int n, int* returnSize) {\n    int* out = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 1; i <= n; i++) out[i] = out[i >> 1] + (i & 1);\n    *returnSize = n + 1;\n    return out;\n}`,
              csharp: `public static int[] CountBits(int n)\n{\n    int[] out_ = new int[n + 1];\n    for (int i = 1; i <= n; i++) out_[i] = out_[i >> 1] + (i & 1);\n    return out_;\n}`,
              go: `func countBits(n int) []int {\n	out := make([]int, n+1)\n	for i := 1; i <= n; i++ {\n		out[i] = out[i>>1] + (i & 1)\n	}\n	return out\n}`,
              kotlin: `fun countBits(n: Int): IntArray {\n    val out = IntArray(n + 1)\n    for (i in 1..n) out[i] = out[i shr 1] + (i and 1)\n    return out\n}`,
              swift: `func countBits(_ n: Int) -> [Int] {\n    var out = [Int](repeating: 0, count: n + 1)\n    if n >= 1 {\n        for i in 1...n {\n            out[i] = out[i >> 1] + (i & 1)\n        }\n    }\n    return out\n}`,
              rust: `fn countBits(n: i32) -> Vec<i32> {\n    let size = (n + 1) as usize;\n    let mut out = vec![0i32; size];\n    for i in 1..size {\n        out[i] = out[i >> 1] + ((i as i32) & 1);\n    }\n    out\n}`,
              php: `function countBits($n) {\n    $out = array_fill(0, $n + 1, 0);\n    for ($i = 1; $i <= $n; $i++) {\n        $out[$i] = $out[$i >> 1] + ($i & 1);\n    }\n    return $out;\n}`,
              ruby: `def countBits(n)\n  out = Array.new(n + 1, 0)\n  (1..n).each { |i| out[i] = out[i >> 1] + (i & 1) }\n  out\nend`,
      },
    };
  })(),

  // ── Hamming Distance ────────────────────────────────────────────
  (() => {
    const ref = (x: number, y: number) => popcount((x ^ y) >>> 0);
    return {
      slug: "hamming-distance",
      title: "Hamming Distance",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Amazon", "Meta", "Adobe"],
      signature: { funcName: "hammingDistance", params: [{ name: "x", type: "int" as const }, { name: "y", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **Hamming distance** between two integers is the number of bit positions at which they differ.\n\nGiven two non-negative integers `x` and `y`, return their Hamming distance.",
        [
          { in: "x = 1, y = 4", out: "2", note: "0001 versus 0100 — two positions differ." },
          { in: "x = 3, y = 1", out: "1" },
          { in: "x = 0, y = 0", out: "0" },
        ],
        ["0 <= x, y <= 2147483647"]),
      hints: [
        "XOR sets exactly the bits where the two numbers disagree.",
        "So the answer is the number of 1 bits in `x ^ y`.",
        "Count those with a shift loop or repeated `v & (v - 1)`.",
      ],
      examples: [
        { input: "1\n4", expectedOutput: "2" },
        { input: "3\n1", expectedOutput: "1" },
        { input: "0\n0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const small = rng() < 0.4;
        const x = small ? ri(rng, 0, 255) : ri(rng, 0, 2147483647);
        const y = small ? ri(rng, 0, 255) : ri(rng, 0, 2147483647);
        return { input: `${x}\n${y}`, expectedOutput: String(ref(x, y)) };
      },
      solutions: {
        python: `def hammingDistance(x: int, y: int) -> int:\n    return bin(x ^ y).count("1")`,
        javascript: `var hammingDistance = function(x, y) {\n    let v = (x ^ y) >>> 0;\n    let count = 0;\n    while (v > 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n};`,
              typescript: `function hammingDistance(x: number, y: number): number {\n    var v = (x ^ y) >>> 0;\n    var count = 0;\n    while (v > 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              java: `public static int hammingDistance(int x, int y) {\n    int v = x ^ y;\n    int count = 0;\n    while (v != 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              cpp: `int hammingDistance(int x, int y) {\n    unsigned int v = (unsigned int) (x ^ y);\n    int count = 0;\n    while (v) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              c: `int hammingDistance(int x, int y) {\n    unsigned int v = (unsigned int) (x ^ y);\n    int count = 0;\n    while (v) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              csharp: `public static int HammingDistance(int x, int y)\n{\n    uint v = (uint) (x ^ y);\n    int count = 0;\n    while (v != 0)\n    {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              go: `func hammingDistance(x int, y int) int {\n	v := x ^ y\n	count := 0\n	for v != 0 {\n		v &= v - 1\n		count++\n	}\n	return count\n}`,
              kotlin: `fun hammingDistance(x: Int, y: Int): Int {\n    var v = x xor y\n    var count = 0\n    while (v != 0) {\n        v = v and (v - 1)\n        count++\n    }\n    return count\n}`,
              swift: `func hammingDistance(_ x: Int, _ y: Int) -> Int {\n    var v = x ^ y\n    var count = 0\n    while v != 0 {\n        v &= v - 1\n        count += 1\n    }\n    return count\n}`,
              rust: `fn hammingDistance(x: i32, y: i32) -> i32 {\n    let mut v = (x ^ y) as u32;\n    let mut count = 0;\n    while v != 0 {\n        v &= v - 1;\n        count += 1;\n    }\n    count\n}`,
              php: `function hammingDistance($x, $y) {\n    $v = $x ^ $y;\n    $count = 0;\n    while ($v != 0) {\n        $v &= $v - 1;\n        $count++;\n    }\n    return $count;\n}`,
              ruby: `def hammingDistance(x, y)\n  v = x ^ y\n  count = 0\n  while v != 0\n    v &= v - 1\n    count += 1\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Total Hamming Distance ──────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let total = 0;
      for (let bit = 0; bit < 31; bit++) {
        let ones = 0;
        for (let i = 0; i < nums.length; i++) ones += (nums[i] >> bit) & 1;
        total += ones * (nums.length - ones);
      }
      return total;
    };
    return {
      slug: "total-hamming-distance",
      title: "Total Hamming Distance",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Bit Manipulation", "Amazon", "Meta", "Google"],
      signature: { funcName: "totalHammingDistance", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the sum of the Hamming distances between **all pairs** of its elements.",
        [
          { in: "nums = [4,14,2]", out: "6", note: "The three pairwise distances are 2, 2 and 2." },
          { in: "nums = [4,14,4]", out: "4" },
          { in: "nums = [0]", out: "0" },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 1000000000", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Comparing every pair is O(n²) — count by bit position instead.",
        "For one bit position, let `k` be how many numbers have it set.",
        "Every set/unset pairing contributes 1, so that position adds `k * (n - k)` to the total.",
      ],
      examples: [
        { input: "[4,14,2]", expectedOutput: "6" },
        { input: "[4,14,4]", expectedOutput: "4" },
        { input: "[0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.5 ? 64 : 1000000000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def totalHammingDistance(nums) -> int:\n    total = 0\n    n = len(nums)\n    for bit in range(31):\n        ones = sum((x >> bit) & 1 for x in nums)\n        total += ones * (n - ones)\n    return total`,
        javascript: `var totalHammingDistance = function(nums) {\n    let total = 0;\n    for (let bit = 0; bit < 31; bit++) {\n        let ones = 0;\n        for (let i = 0; i < nums.length; i++) ones += (nums[i] >> bit) & 1;\n        total += ones * (nums.length - ones);\n    }\n    return total;\n};`,
              typescript: `function totalHammingDistance(nums: number[]): number {\n    var total = 0;\n    for (var bit = 0; bit < 31; bit++) {\n        var ones = 0;\n        for (var i = 0; i < nums.length; i++) ones += (nums[i] >> bit) & 1;\n        total += ones * (nums.length - ones);\n    }\n    return total;\n}`,
              java: `public static int totalHammingDistance(int[] nums) {\n    int total = 0;\n    int n = nums.length;\n    for (int bit = 0; bit < 31; bit++) {\n        int ones = 0;\n        for (int x : nums) ones += (x >> bit) & 1;\n        total += ones * (n - ones);\n    }\n    return total;\n}`,
              cpp: `int totalHammingDistance(vector<int>& nums) {\n    int total = 0;\n    int n = (int) nums.size();\n    for (int bit = 0; bit < 31; bit++) {\n        int ones = 0;\n        for (int x : nums) ones += (x >> bit) & 1;\n        total += ones * (n - ones);\n    }\n    return total;\n}`,
              c: `int totalHammingDistance(int* nums, int numsSize) {\n    int total = 0;\n    for (int bit = 0; bit < 31; bit++) {\n        int ones = 0;\n        for (int i = 0; i < numsSize; i++) ones += (nums[i] >> bit) & 1;\n        total += ones * (numsSize - ones);\n    }\n    return total;\n}`,
              csharp: `public static int TotalHammingDistance(int[] nums)\n{\n    int total = 0;\n    int n = nums.Length;\n    for (int bit = 0; bit < 31; bit++)\n    {\n        int ones = 0;\n        foreach (int x in nums) ones += (x >> bit) & 1;\n        total += ones * (n - ones);\n    }\n    return total;\n}`,
              go: `func totalHammingDistance(nums []int) int {\n	total := 0\n	n := len(nums)\n	for bit := 0; bit < 31; bit++ {\n		ones := 0\n		for _, x := range nums {\n			ones += (x >> uint(bit)) & 1\n		}\n		total += ones * (n - ones)\n	}\n	return total\n}`,
              kotlin: `fun totalHammingDistance(nums: IntArray): Int {\n    var total = 0\n    val n = nums.size\n    for (bit in 0 until 31) {\n        var ones = 0\n        for (x in nums) ones += (x shr bit) and 1\n        total += ones * (n - ones)\n    }\n    return total\n}`,
              swift: `func totalHammingDistance(_ nums: [Int]) -> Int {\n    var total = 0\n    let n = nums.count\n    for bit in 0..<31 {\n        var ones = 0\n        for x in nums { ones += (x >> bit) & 1 }\n        total += ones * (n - ones)\n    }\n    return total\n}`,
              rust: `fn totalHammingDistance(nums: Vec<i32>) -> i32 {\n    let mut total = 0i32;\n    let n = nums.len() as i32;\n    for bit in 0..31 {\n        let mut ones = 0i32;\n        for x in nums.iter() {\n            ones += (*x >> bit) & 1;\n        }\n        total += ones * (n - ones);\n    }\n    total\n}`,
              php: `function totalHammingDistance($nums) {\n    $total = 0;\n    $n = count($nums);\n    for ($bit = 0; $bit < 31; $bit++) {\n        $ones = 0;\n        foreach ($nums as $x) $ones += ($x >> $bit) & 1;\n        $total += $ones * ($n - $ones);\n    }\n    return $total;\n}`,
              ruby: `def totalHammingDistance(nums)\n  total = 0\n  n = nums.length\n  (0...31).each do |bit|\n    ones = nums.map { |x| (x >> bit) & 1 }.sum\n    total += ones * (n - ones)\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Power of Four ───────────────────────────────────────────────
  (() => {
    const ref = (n: number) => n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0;
    return {
      slug: "power-of-four",
      title: "Power of Four",
      difficulty: "EASY" as const,
      tags: ["Math", "Bit Manipulation", "Recursion", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "isPowerOfFour", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer `n`, return `true` if it is a power of four — that is, if `n == 4^x` for some integer `x >= 0`.",
        [
          { in: "n = 16", out: "true" },
          { in: "n = 5", out: "false" },
          { in: "n = 1", out: "true" },
        ],
        ["-2147483648 <= n <= 2147483647"],
        "Can you decide it without any loop or recursion?"),
      hints: [
        "A power of four is first of all a power of two: positive with exactly one set bit, which `n & (n - 1) == 0` tests.",
        "Among powers of two, the powers of four are the ones whose single bit sits at an **even** position.",
        "Mask with `0x55555555`, which has all the even-position bits set.",
      ],
      examples: [
        { input: "16", expectedOutput: "true" },
        { input: "5", expectedOutput: "false" },
        { input: "1", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        let n: number;
        if (roll < 0.3) n = Math.pow(4, ri(rng, 0, 15));
        else if (roll < 0.5) n = Math.pow(2, ri(rng, 0, 30));
        else n = ri(rng, -2147483648, 2147483647);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isPowerOfFour(n: int) -> bool:\n    return n > 0 and (n & (n - 1)) == 0 and (n & 0x55555555) != 0`,
        javascript: `var isPowerOfFour = function(n) {\n    return n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0;\n};`,
              typescript: `function isPowerOfFour(n: number): boolean {\n    return n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0;\n}`,
              java: `public static boolean isPowerOfFour(int n) {\n    return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;\n}`,
              cpp: `bool isPowerOfFour(int n) {\n    return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;\n}`,
              c: `bool isPowerOfFour(int n) {\n    return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;\n}`,
              csharp: `public static bool IsPowerOfFour(int n)\n{\n    return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;\n}`,
              go: `func isPowerOfFour(n int) bool {\n	return n > 0 && n&(n-1) == 0 && n&0x55555555 != 0\n}`,
              kotlin: `fun isPowerOfFour(n: Int): Boolean {\n    return n > 0 && (n and (n - 1)) == 0 && (n and 0x55555555) != 0\n}`,
              swift: `func isPowerOfFour(_ n: Int) -> Bool {\n    return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0\n}`,
              rust: `fn isPowerOfFour(n: i32) -> bool {\n    n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0\n}`,
              php: `function isPowerOfFour($n) {\n    return $n > 0 && ($n & ($n - 1)) === 0 && ($n & 0x55555555) !== 0;\n}`,
              ruby: `def isPowerOfFour(n)\n  n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0\nend`,
      },
    };
  })(),

  // ── Bitwise AND of Numbers Range ────────────────────────────────
  (() => {
    const ref = (left: number, right: number) => {
      let shift = 0;
      let a = left, b = right;
      while (a !== b) {
        a = Math.floor(a / 2);
        b = Math.floor(b / 2);
        shift++;
      }
      return a * Math.pow(2, shift);
    };
    return {
      slug: "bitwise-and-of-numbers-range",
      title: "Bitwise AND of Numbers Range",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "rangeBitwiseAnd", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given two integers `left` and `right` with `left <= right`, return the bitwise AND of every number in the inclusive range `[left, right]`.",
        [
          { in: "left = 5, right = 7", out: "4" },
          { in: "left = 0, right = 0", out: "0" },
          { in: "left = 1, right = 2147483647", out: "0" },
        ],
        ["0 <= left <= right <= 2147483647", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Any bit that changes anywhere in the range gets ANDed with a 0 somewhere, so it ends up 0.",
        "Only the **common binary prefix** of `left` and `right` survives.",
        "Shift both right until they match, then shift the result back by the same amount.",
      ],
      examples: [
        { input: "5\n7", expectedOutput: "4" },
        { input: "0\n0", expectedOutput: "0" },
        { input: "1\n2147483647", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 1000 : 2147483647;
        const left = ri(rng, 0, hi);
        const right = rng() < 0.3 ? left : ri(rng, left, hi);
        return { input: `${left}\n${right}`, expectedOutput: String(ref(left, right)) };
      },
      solutions: {
        python: `def rangeBitwiseAnd(left: int, right: int) -> int:\n    shift = 0\n    while left != right:\n        left >>= 1\n        right >>= 1\n        shift += 1\n    return left << shift`,
        javascript: `var rangeBitwiseAnd = function(left, right) {\n    let shift = 0;\n    let a = left, b = right;\n    while (a !== b) {\n        a = Math.floor(a / 2);\n        b = Math.floor(b / 2);\n        shift++;\n    }\n    return a * Math.pow(2, shift);\n};`,
              typescript: `function rangeBitwiseAnd(left: number, right: number): number {\n    var shift = 0;\n    var a = left;\n    var b = right;\n    while (a !== b) {\n        a = Math.floor(a / 2);\n        b = Math.floor(b / 2);\n        shift++;\n    }\n    return a * Math.pow(2, shift);\n}`,
              java: `public static int rangeBitwiseAnd(int left, int right) {\n    int shift = 0;\n    int a = left, b = right;\n    while (a != b) {\n        a >>>= 1;\n        b >>>= 1;\n        shift++;\n    }\n    return a << shift;\n}`,
              cpp: `int rangeBitwiseAnd(int left, int right) {\n    int shift = 0;\n    unsigned int a = (unsigned int) left, b = (unsigned int) right;\n    while (a != b) {\n        a >>= 1;\n        b >>= 1;\n        shift++;\n    }\n    return (int) (a << shift);\n}`,
              c: `int rangeBitwiseAnd(int left, int right) {\n    int shift = 0;\n    unsigned int a = (unsigned int) left, b = (unsigned int) right;\n    while (a != b) {\n        a >>= 1;\n        b >>= 1;\n        shift++;\n    }\n    return (int) (a << shift);\n}`,
              csharp: `public static int RangeBitwiseAnd(int left, int right)\n{\n    int shift = 0;\n    uint a = (uint) left, b = (uint) right;\n    while (a != b)\n    {\n        a >>= 1;\n        b >>= 1;\n        shift++;\n    }\n    return (int) (a << shift);\n}`,
              go: `func rangeBitwiseAnd(left int, right int) int {\n	shift := 0\n	a, b := left, right\n	for a != b {\n		a >>= 1\n		b >>= 1\n		shift++\n	}\n	return a << uint(shift)\n}`,
              kotlin: `fun rangeBitwiseAnd(left: Int, right: Int): Int {\n    var shift = 0\n    var a = left\n    var b = right\n    while (a != b) {\n        a = a ushr 1\n        b = b ushr 1\n        shift++\n    }\n    return a shl shift\n}`,
              swift: `func rangeBitwiseAnd(_ left: Int, _ right: Int) -> Int {\n    var shift = 0\n    var a = left\n    var b = right\n    while a != b {\n        a >>= 1\n        b >>= 1\n        shift += 1\n    }\n    return a << shift\n}`,
              rust: `fn rangeBitwiseAnd(left: i32, right: i32) -> i32 {\n    let mut shift = 0;\n    let mut a = left as u32;\n    let mut b = right as u32;\n    while a != b {\n        a >>= 1;\n        b >>= 1;\n        shift += 1;\n    }\n    (a << shift) as i32\n}`,
              php: `function rangeBitwiseAnd($left, $right) {\n    $shift = 0;\n    $a = $left;\n    $b = $right;\n    while ($a !== $b) {\n        $a >>= 1;\n        $b >>= 1;\n        $shift++;\n    }\n    return $a << $shift;\n}`,
              ruby: `def rangeBitwiseAnd(left, right)\n  shift = 0\n  a = left\n  b = right\n  while a != b\n    a >>= 1\n    b >>= 1\n    shift += 1\n  end\n  a << shift\nend`,
      },
    };
  })(),

  // ── Sum of Two Integers ─────────────────────────────────────────
  (() => {
    const ref = (a: number, b: number) => {
      let x = a | 0, y = b | 0;
      while (y !== 0) {
        const carry = (x & y) << 1;
        x = (x ^ y) | 0;
        y = carry | 0;
      }
      return x | 0;
    };
    return {
      slug: "sum-of-two-integers",
      title: "Sum of Two Integers",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Bit Manipulation", "Amazon", "Microsoft", "Apple", "Bloomberg"],
      signature: { funcName: "getSum", params: [{ name: "a", type: "int" as const }, { name: "b", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given two integers `a` and `b`, return their sum **without using the operators `+` or `-`**.",
        [
          { in: "a = 1, b = 2", out: "3" },
          { in: "a = 2, b = 3", out: "5" },
          { in: "a = -1, b = 1", out: "0" },
        ],
        ["-1000 <= a, b <= 1000"]),
      hints: [
        "`a ^ b` adds the bits while ignoring every carry.",
        "`(a & b) << 1` is exactly the carry that was ignored.",
        "Loop, feeding the carry back in, until it becomes zero — and keep the arithmetic inside 32 bits so negatives work.",
      ],
      examples: [
        { input: "1\n2", expectedOutput: "3" },
        { input: "2\n3", expectedOutput: "5" },
        { input: "-1\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const a = ri(rng, -1000, 1000);
        const b = ri(rng, -1000, 1000);
        return { input: `${a}\n${b}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: `def getSum(a: int, b: int) -> int:\n    mask = 0xFFFFFFFF\n    x, y = a & mask, b & mask\n    while y:\n        carry = ((x & y) << 1) & mask\n        x = (x ^ y) & mask\n        y = carry\n    return x if x <= 0x7FFFFFFF else ~(x ^ mask)`,
        javascript: `var getSum = function(a, b) {\n    let x = a | 0, y = b | 0;\n    while (y !== 0) {\n        const carry = (x & y) << 1;\n        x = (x ^ y) | 0;\n        y = carry | 0;\n    }\n    return x | 0;\n};`,
              typescript: `function getSum(a: number, b: number): number {\n    var x = a | 0;\n    var y = b | 0;\n    while (y !== 0) {\n        var carry = (x & y) << 1;\n        x = (x ^ y) | 0;\n        y = carry | 0;\n    }\n    return x | 0;\n}`,
              java: `public static int getSum(int a, int b) {\n    int x = a, y = b;\n    while (y != 0) {\n        int carry = (x & y) << 1;\n        x = x ^ y;\n        y = carry;\n    }\n    return x;\n}`,
              cpp: `int getSum(int a, int b) {\n    unsigned int x = (unsigned int) a, y = (unsigned int) b;\n    while (y != 0) {\n        unsigned int carry = (x & y) << 1;\n        x = x ^ y;\n        y = carry;\n    }\n    return (int) x;\n}`,
              c: `int getSum(int a, int b) {\n    unsigned int x = (unsigned int) a, y = (unsigned int) b;\n    while (y != 0) {\n        unsigned int carry = (x & y) << 1;\n        x = x ^ y;\n        y = carry;\n    }\n    return (int) x;\n}`,
              csharp: `public static int GetSum(int a, int b)\n{\n    uint x = (uint) a, y = (uint) b;\n    while (y != 0)\n    {\n        uint carry = (x & y) << 1;\n        x = x ^ y;\n        y = carry;\n    }\n    return (int) x;\n}`,
              go: `func getSum(a int, b int) int {\n	x, y := uint32(a), uint32(b)\n	for y != 0 {\n		carry := (x & y) << 1\n		x = x ^ y\n		y = carry\n	}\n	return int(int32(x))\n}`,
              kotlin: `fun getSum(a: Int, b: Int): Int {\n    var x = a\n    var y = b\n    while (y != 0) {\n        val carry = (x and y) shl 1\n        x = x xor y\n        y = carry\n    }\n    return x\n}`,
              swift: `func getSum(_ a: Int, _ b: Int) -> Int {\n    var x = Int32(truncatingIfNeeded: a)\n    var y = Int32(truncatingIfNeeded: b)\n    while y != 0 {\n        let carry = Int32(bitPattern: UInt32(bitPattern: x & y) << 1)\n        x = x ^ y\n        y = carry\n    }\n    return Int(x)\n}`,
              rust: `fn getSum(a: i32, b: i32) -> i32 {\n    let mut x = a as u32;\n    let mut y = b as u32;\n    while y != 0 {\n        let carry = (x & y) << 1;\n        x = x ^ y;\n        y = carry;\n    }\n    x as i32\n}`,
              php: `function getSum($a, $b) {\n    $mask = 0xFFFFFFFF;\n    $x = $a & $mask;\n    $y = $b & $mask;\n    while ($y != 0) {\n        $carry = (($x & $y) << 1) & $mask;\n        $x = ($x ^ $y) & $mask;\n        $y = $carry;\n    }\n    return $x <= 0x7FFFFFFF ? $x : $x - 0x100000000;\n}`,
              ruby: `def getSum(a, b)\n  mask = 0xFFFFFFFF\n  x = a & mask\n  y = b & mask\n  while y != 0\n    carry = ((x & y) << 1) & mask\n    x = (x ^ y) & mask\n    y = carry\n  end\n  x <= 0x7FFFFFFF ? x : x - 0x100000000\nend`,
      },
    };
  })(),

  // ── Maximum XOR of Two Numbers in an Array ──────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      let mask = 0;
      for (let bit = 31; bit >= 0; bit--) {
        mask = mask | (1 << bit);
        const prefixes = new Set<number>();
        for (let i = 0; i < nums.length; i++) prefixes.add((nums[i] & mask) >>> 0);
        const candidate = (best | (1 << bit)) >>> 0;
        let found = false;
        prefixes.forEach((p) => {
          if (prefixes.has((candidate ^ p) >>> 0)) found = true;
        });
        if (found) best = candidate;
      }
      return best | 0;
    };
    return {
      slug: "maximum-xor-of-two-numbers-in-an-array",
      title: "Maximum XOR of Two Numbers in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Trie", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "findMaximumXOR", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the maximum value of `nums[i] XOR nums[j]` over all pairs of indices `0 <= i <= j < n`.",
        [
          { in: "nums = [3,10,5,25,2,8]", out: "28", note: "5 XOR 25 = 28." },
          { in: "nums = [14,70,53,83,49,91,36,80,92,51,66,70]", out: "127" },
          { in: "nums = [0]", out: "0" },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 1000000000"],
        "The O(n²) scan is easy. Can you get O(32n) with a bit trie or a prefix hash set?"),
      hints: [
        "Build the answer one bit at a time, from the most significant bit down.",
        "Keep the prefixes of every number under a growing mask in a hash set.",
        "If two prefixes `p` and `q` satisfy `p ^ q == candidate`, that bit is achievable — a set lookup for `candidate ^ p` decides it.",
      ],
      examples: [
        { input: "[3,10,5,25,2,8]", expectedOutput: "28" },
        { input: "[14,70,53,83,49,91,36,80,92,51,66,70]", expectedOutput: "127" },
        { input: "[0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.5 ? 128 : 1000000000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findMaximumXOR(nums) -> int:\n    best = 0\n    mask = 0\n    for bit in range(31, -1, -1):\n        mask |= 1 << bit\n        prefixes = {x & mask for x in nums}\n        candidate = best | (1 << bit)\n        if any((candidate ^ p) in prefixes for p in prefixes):\n            best = candidate\n    return best`,
        javascript: `var findMaximumXOR = function(nums) {\n    let best = 0;\n    let mask = 0;\n    for (let bit = 31; bit >= 0; bit--) {\n        mask = mask | (1 << bit);\n        const prefixes = new Set();\n        for (let i = 0; i < nums.length; i++) prefixes.add((nums[i] & mask) >>> 0);\n        const candidate = (best | (1 << bit)) >>> 0;\n        let found = false;\n        prefixes.forEach(function(p) {\n            if (prefixes.has((candidate ^ p) >>> 0)) found = true;\n        });\n        if (found) best = candidate;\n    }\n    return best | 0;\n};`,
              typescript: `function findMaximumXOR(nums: number[]): number {\n    var best = 0;\n    var mask = 0;\n    for (var bit = 30; bit >= 0; bit--) {\n        mask = mask | (1 << bit);\n        var prefixes: { [key: string]: boolean } = {};\n        for (var i = 0; i < nums.length; i++) prefixes[String(nums[i] & mask)] = true;\n        var candidate = best | (1 << bit);\n        var found = false;\n        for (var j = 0; j < nums.length; j++) {\n            var p = nums[j] & mask;\n            if (prefixes[String(candidate ^ p)] === true) {\n                found = true;\n                break;\n            }\n        }\n        if (found) best = candidate;\n    }\n    return best;\n}`,
              java: `public static int findMaximumXOR(int[] nums) {\n    int best = 0, mask = 0;\n    for (int bit = 30; bit >= 0; bit--) {\n        mask |= 1 << bit;\n        Set<Integer> prefixes = new HashSet<>();\n        for (int x : nums) prefixes.add(x & mask);\n        int candidate = best | (1 << bit);\n        for (int p : prefixes) {\n            if (prefixes.contains(candidate ^ p)) {\n                best = candidate;\n                break;\n            }\n        }\n    }\n    return best;\n}`,
              cpp: `int findMaximumXOR(vector<int>& nums) {\n    int best = 0, mask = 0;\n    for (int bit = 30; bit >= 0; bit--) {\n        mask |= 1 << bit;\n        unordered_set<int> prefixes;\n        for (int x : nums) prefixes.insert(x & mask);\n        int candidate = best | (1 << bit);\n        for (int p : prefixes) {\n            if (prefixes.count(candidate ^ p) > 0) {\n                best = candidate;\n                break;\n            }\n        }\n    }\n    return best;\n}`,
              c: `int findMaximumXOR(int* nums, int numsSize) {\n    int best = 0;\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize; j++) {\n            int value = nums[i] ^ nums[j];\n            if (value > best) best = value;\n        }\n    }\n    return best;\n}`,
              csharp: `public static int FindMaximumXOR(int[] nums)\n{\n    int best = 0, mask = 0;\n    for (int bit = 30; bit >= 0; bit--)\n    {\n        mask |= 1 << bit;\n        var prefixes = new HashSet<int>();\n        foreach (int x in nums) prefixes.Add(x & mask);\n        int candidate = best | (1 << bit);\n        foreach (int p in prefixes)\n        {\n            if (prefixes.Contains(candidate ^ p))\n            {\n                best = candidate;\n                break;\n            }\n        }\n    }\n    return best;\n}`,
              go: `func findMaximumXOR(nums []int) int {\n	best, mask := 0, 0\n	for bit := 30; bit >= 0; bit-- {\n		mask |= 1 << uint(bit)\n		prefixes := map[int]bool{}\n		for _, x := range nums {\n			prefixes[x&mask] = true\n		}\n		candidate := best | (1 << uint(bit))\n		for p := range prefixes {\n			if prefixes[candidate^p] {\n				best = candidate\n				break\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun findMaximumXOR(nums: IntArray): Int {\n    var best = 0\n    var mask = 0\n    for (bit in 30 downTo 0) {\n        mask = mask or (1 shl bit)\n        val prefixes = HashSet<Int>()\n        for (x in nums) prefixes.add(x and mask)\n        val candidate = best or (1 shl bit)\n        for (p in prefixes) {\n            if (prefixes.contains(candidate xor p)) {\n                best = candidate\n                break\n            }\n        }\n    }\n    return best\n}`,
              swift: `func findMaximumXOR(_ nums: [Int]) -> Int {\n    var best = 0\n    var mask = 0\n    var bit = 30\n    while bit >= 0 {\n        mask |= (1 << bit)\n        var prefixes = Set<Int>()\n        for x in nums { prefixes.insert(x & mask) }\n        let candidate = best | (1 << bit)\n        for p in prefixes {\n            if prefixes.contains(candidate ^ p) {\n                best = candidate\n                break\n            }\n        }\n        bit -= 1\n    }\n    return best\n}`,
              rust: `use std::collections::HashSet;\n\nfn findMaximumXOR(nums: Vec<i32>) -> i32 {\n    let mut best = 0i32;\n    let mut mask = 0i32;\n    for bit in (0..31).rev() {\n        mask |= 1 << bit;\n        let mut prefixes: HashSet<i32> = HashSet::new();\n        for x in nums.iter() {\n            prefixes.insert(*x & mask);\n        }\n        let candidate = best | (1 << bit);\n        for p in prefixes.iter() {\n            if prefixes.contains(&(candidate ^ *p)) {\n                best = candidate;\n                break;\n            }\n        }\n    }\n    best\n}`,
              php: `function findMaximumXOR($nums) {\n    $best = 0;\n    $mask = 0;\n    for ($bit = 30; $bit >= 0; $bit--) {\n        $mask |= 1 << $bit;\n        $prefixes = array();\n        foreach ($nums as $x) $prefixes[$x & $mask] = true;\n        $candidate = $best | (1 << $bit);\n        foreach ($prefixes as $p => $ignored) {\n            if (isset($prefixes[$candidate ^ $p])) {\n                $best = $candidate;\n                break;\n            }\n        }\n    }\n    return $best;\n}`,
              ruby: `def findMaximumXOR(nums)\n  best = 0\n  mask = 0\n  30.downto(0) do |bit|\n    mask |= 1 << bit\n    prefixes = {}\n    nums.each { |x| prefixes[x & mask] = true }\n    candidate = best | (1 << bit)\n    prefixes.each_key do |p|\n      if prefixes[candidate ^ p]\n        best = candidate\n        break\n      end\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Number Complement ───────────────────────────────────────────
  (() => {
    const ref = (num: number) => {
      let mask = 0;
      let v = num;
      while (v > 0) {
        mask = (mask << 1) | 1;
        v = Math.floor(v / 2);
      }
      if (num === 0) return 1;
      return (mask ^ num) >>> 0;
    };
    return {
      slug: "number-complement",
      title: "Number Complement",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Amazon", "Adobe", "Apple"],
      signature: { funcName: "findComplement", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **complement** of an integer is what you get by flipping every bit in its binary representation, **without** any leading zeros.\n\nGiven a positive integer `num`, return its complement.",
        [
          { in: "num = 5", out: "2", note: "101 flips to 010, which is 2." },
          { in: "num = 1", out: "0" },
          { in: "num = 7", out: "0" },
        ],
        ["1 <= num <= 2147483646"]),
      hints: [
        "The trick is not flipping the 32 bits — it is knowing where to stop.",
        "Build a mask of all 1s that is exactly as wide as `num`'s binary representation.",
        "Then the answer is `mask ^ num`.",
      ],
      examples: [
        { input: "5", expectedOutput: "2" },
        { input: "1", expectedOutput: "0" },
        { input: "7", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.4 ? ri(rng, 1, 255) : ri(rng, 1, 2147483646);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def findComplement(num: int) -> int:\n    mask = 0\n    v = num\n    while v:\n        mask = (mask << 1) | 1\n        v >>= 1\n    return mask ^ num`,
        javascript: `var findComplement = function(num) {\n    let mask = 0;\n    let v = num;\n    while (v > 0) {\n        mask = (mask << 1) | 1;\n        v = Math.floor(v / 2);\n    }\n    return (mask ^ num) >>> 0;\n};`,
              typescript: `function findComplement(num: number): number {\n    var mask = 0;\n    var v = num;\n    while (v > 0) {\n        mask = mask * 2 + 1;\n        v = Math.floor(v / 2);\n    }\n    return mask - num;\n}`,
              java: `public static int findComplement(int num) {\n    long mask = 0;\n    long v = num;\n    while (v > 0) {\n        mask = mask * 2 + 1;\n        v /= 2;\n    }\n    return (int) (mask - num);\n}`,
              cpp: `int findComplement(int num) {\n    long long mask = 0;\n    long long v = num;\n    while (v > 0) {\n        mask = mask * 2 + 1;\n        v /= 2;\n    }\n    return (int) (mask - num);\n}`,
              c: `int findComplement(int num) {\n    long long mask = 0;\n    long long v = num;\n    while (v > 0) {\n        mask = mask * 2 + 1;\n        v /= 2;\n    }\n    return (int) (mask - num);\n}`,
              csharp: `public static int FindComplement(int num)\n{\n    long mask = 0;\n    long v = num;\n    while (v > 0)\n    {\n        mask = mask * 2 + 1;\n        v /= 2;\n    }\n    return (int) (mask - num);\n}`,
              go: `func findComplement(num int) int {\n	mask := 0\n	v := num\n	for v > 0 {\n		mask = mask*2 + 1\n		v /= 2\n	}\n	return mask - num\n}`,
              kotlin: `fun findComplement(num: Int): Int {\n    var mask = 0L\n    var v = num.toLong()\n    while (v > 0) {\n        mask = mask * 2 + 1\n        v /= 2\n    }\n    return (mask - num).toInt()\n}`,
              swift: `func findComplement(_ num: Int) -> Int {\n    var mask = 0\n    var v = num\n    while v > 0 {\n        mask = mask * 2 + 1\n        v /= 2\n    }\n    return mask - num\n}`,
              rust: `fn findComplement(num: i32) -> i32 {\n    let mut mask: i64 = 0;\n    let mut v: i64 = num as i64;\n    while v > 0 {\n        mask = mask * 2 + 1;\n        v /= 2;\n    }\n    (mask - num as i64) as i32\n}`,
              php: `function findComplement($num) {\n    $mask = 0;\n    $v = $num;\n    while ($v > 0) {\n        $mask = $mask * 2 + 1;\n        $v = intdiv($v, 2);\n    }\n    return $mask - $num;\n}`,
              ruby: `def findComplement(num)\n  mask = 0\n  v = num\n  while v > 0\n    mask = mask * 2 + 1\n    v /= 2\n  end\n  mask - num\nend`,
      },
    };
  })(),

  // ── Binary Gap ──────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let best = 0;
      let last = -1;
      let index = 0;
      let v = n;
      while (v > 0) {
        if (v % 2 === 1) {
          if (last >= 0 && index - last > best) best = index - last;
          last = index;
        }
        v = Math.floor(v / 2);
        index++;
      }
      return best;
    };
    return {
      slug: "binary-gap",
      title: "Binary Gap",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Amazon", "Google"],
      signature: { funcName: "binaryGap", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a positive integer `n`, return the longest distance between any two **adjacent** `1` bits in its binary representation. If there are fewer than two `1` bits, return `0`.\n\nTwo `1` bits are adjacent when only `0` bits lie between them; the distance is the difference of their positions.",
        [
          { in: "n = 22", out: "2", note: "10110 — the gaps are 2 and 1." },
          { in: "n = 8", out: "0", note: "1000 has a single 1 bit." },
          { in: "n = 5", out: "2" },
        ],
        ["1 <= n <= 1000000000"]),
      hints: [
        "Walk the bits from least significant to most significant, tracking the position of the previous `1`.",
        "On each new `1`, the distance is the current position minus that remembered one.",
        "Keep the maximum; a number with one set bit never records a distance, so it returns 0.",
      ],
      examples: [
        { input: "22", expectedOutput: "2" },
        { input: "8", expectedOutput: "0" },
        { input: "5", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.4 ? ri(rng, 1, 255) : ri(rng, 1, 1000000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def binaryGap(n: int) -> int:\n    best = 0\n    last = -1\n    index = 0\n    while n:\n        if n & 1:\n            if last >= 0:\n                best = max(best, index - last)\n            last = index\n        n >>= 1\n        index += 1\n    return best`,
        javascript: `var binaryGap = function(n) {\n    let best = 0;\n    let last = -1;\n    let index = 0;\n    let v = n;\n    while (v > 0) {\n        if (v % 2 === 1) {\n            if (last >= 0 && index - last > best) best = index - last;\n            last = index;\n        }\n        v = Math.floor(v / 2);\n        index++;\n    }\n    return best;\n};`,
              typescript: `function binaryGap(n: number): number {\n    var best = 0;\n    var last = -1;\n    var index = 0;\n    var v = n;\n    while (v > 0) {\n        if (v % 2 === 1) {\n            if (last >= 0 && index - last > best) best = index - last;\n            last = index;\n        }\n        v = Math.floor(v / 2);\n        index++;\n    }\n    return best;\n}`,
              java: `public static int binaryGap(int n) {\n    int best = 0, last = -1, index = 0, v = n;\n    while (v > 0) {\n        if ((v & 1) == 1) {\n            if (last >= 0) best = Math.max(best, index - last);\n            last = index;\n        }\n        v >>= 1;\n        index++;\n    }\n    return best;\n}`,
              cpp: `int binaryGap(int n) {\n    int best = 0, last = -1, index = 0, v = n;\n    while (v > 0) {\n        if (v & 1) {\n            if (last >= 0) best = max(best, index - last);\n            last = index;\n        }\n        v >>= 1;\n        index++;\n    }\n    return best;\n}`,
              c: `int binaryGap(int n) {\n    int best = 0, last = -1, index = 0, v = n;\n    while (v > 0) {\n        if (v & 1) {\n            if (last >= 0 && index - last > best) best = index - last;\n            last = index;\n        }\n        v >>= 1;\n        index++;\n    }\n    return best;\n}`,
              csharp: `public static int BinaryGap(int n)\n{\n    int best = 0, last = -1, index = 0, v = n;\n    while (v > 0)\n    {\n        if ((v & 1) == 1)\n        {\n            if (last >= 0) best = Math.Max(best, index - last);\n            last = index;\n        }\n        v >>= 1;\n        index++;\n    }\n    return best;\n}`,
              go: `func binaryGap(n int) int {\n	best, last, index, v := 0, -1, 0, n\n	for v > 0 {\n		if v&1 == 1 {\n			if last >= 0 && index-last > best {\n				best = index - last\n			}\n			last = index\n		}\n		v >>= 1\n		index++\n	}\n	return best\n}`,
              kotlin: `fun binaryGap(n: Int): Int {\n    var best = 0\n    var last = -1\n    var index = 0\n    var v = n\n    while (v > 0) {\n        if (v and 1 == 1) {\n            if (last >= 0 && index - last > best) best = index - last\n            last = index\n        }\n        v = v shr 1\n        index++\n    }\n    return best\n}`,
              swift: `func binaryGap(_ n: Int) -> Int {\n    var best = 0\n    var last = -1\n    var index = 0\n    var v = n\n    while v > 0 {\n        if v & 1 == 1 {\n            if last >= 0 && index - last > best { best = index - last }\n            last = index\n        }\n        v >>= 1\n        index += 1\n    }\n    return best\n}`,
              rust: `fn binaryGap(n: i32) -> i32 {\n    let mut best = 0;\n    let mut last = -1i32;\n    let mut index = 0i32;\n    let mut v = n;\n    while v > 0 {\n        if v & 1 == 1 {\n            if last >= 0 && index - last > best {\n                best = index - last;\n            }\n            last = index;\n        }\n        v >>= 1;\n        index += 1;\n    }\n    best\n}`,
              php: `function binaryGap($n) {\n    $best = 0;\n    $last = -1;\n    $index = 0;\n    $v = $n;\n    while ($v > 0) {\n        if ($v & 1) {\n            if ($last >= 0 && $index - $last > $best) $best = $index - $last;\n            $last = $index;\n        }\n        $v >>= 1;\n        $index++;\n    }\n    return $best;\n}`,
              ruby: `def binaryGap(n)\n  best = 0\n  last = -1\n  index = 0\n  v = n\n  while v > 0\n    if v & 1 == 1\n      best = index - last if last >= 0 && index - last > best\n      last = index\n    end\n    v >>= 1\n    index += 1\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Prime Number of Set Bits in Binary Representation ───────────
  (() => {
    const isPrime = (x: number) => {
      if (x < 2) return false;
      for (let d = 2; d * d <= x; d++) {
        if (x % d === 0) return false;
      }
      return true;
    };
    const ref = (left: number, right: number) => {
      let count = 0;
      for (let v = left; v <= right; v++) {
        if (isPrime(popcount(v))) count++;
      }
      return count;
    };
    return {
      slug: "prime-number-of-set-bits",
      title: "Prime Number of Set Bits in Binary Representation",
      difficulty: "EASY" as const,
      tags: ["Math", "Bit Manipulation", "Amazon", "Adobe"],
      signature: { funcName: "countPrimeSetBits", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given two integers `left` and `right`, return the count of numbers in the inclusive range `[left, right]` whose number of set bits is a **prime number**.",
        [
          { in: "left = 6, right = 10", out: "4", note: "6, 9 and 10 have two set bits; 7 has three." },
          { in: "left = 10, right = 15", out: "5" },
          { in: "left = 1, right = 1", out: "0" },
        ],
        ["1 <= left <= right <= 20000", "right - left <= 200"]),
      hints: [
        "Count the set bits of each number in the range.",
        "That count is small — under 20 — so the primality test is trivial.",
        "You can even hard-code the set of primes below 20 and check membership.",
      ],
      examples: [
        { input: "6\n10", expectedOutput: "4" },
        { input: "10\n15", expectedOutput: "5" },
        { input: "1\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const left = ri(rng, 1, 20000);
        const right = Math.min(20000, left + ri(rng, 0, 200));
        return { input: `${left}\n${right}`, expectedOutput: String(ref(left, right)) };
      },
      solutions: {
        python: `def countPrimeSetBits(left: int, right: int) -> int:\n    primes = {2, 3, 5, 7, 11, 13, 17, 19}\n    return sum(1 for v in range(left, right + 1) if bin(v).count("1") in primes)`,
        javascript: `var countPrimeSetBits = function(left, right) {\n    const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19]);\n    let count = 0;\n    for (let v = left; v <= right; v++) {\n        let bits = 0;\n        let x = v;\n        while (x > 0) {\n            bits += x & 1;\n            x >>>= 1;\n        }\n        if (primes.has(bits)) count++;\n    }\n    return count;\n};`,
              typescript: `function countPrimeSetBits(left: number, right: number): number {\n    var primes: { [key: string]: boolean } = { "2": true, "3": true, "5": true, "7": true, "11": true, "13": true, "17": true, "19": true };\n    var count = 0;\n    for (var v = left; v <= right; v++) {\n        var bits = 0;\n        var x = v;\n        while (x > 0) {\n            bits += x & 1;\n            x >>>= 1;\n        }\n        if (primes[String(bits)] === true) count++;\n    }\n    return count;\n}`,
              java: `public static int countPrimeSetBits(int left, int right) {\n    Set<Integer> primes = new HashSet<>(Arrays.asList(2, 3, 5, 7, 11, 13, 17, 19));\n    int count = 0;\n    for (int v = left; v <= right; v++) {\n        if (primes.contains(Integer.bitCount(v))) count++;\n    }\n    return count;\n}`,
              cpp: `int countPrimeSetBits(int left, int right) {\n    unordered_set<int> primes = {2, 3, 5, 7, 11, 13, 17, 19};\n    int count = 0;\n    for (int v = left; v <= right; v++) {\n        int bits = 0;\n        unsigned int x = (unsigned int) v;\n        while (x) {\n            bits += (int) (x & 1u);\n            x >>= 1;\n        }\n        if (primes.count(bits) > 0) count++;\n    }\n    return count;\n}`,
              c: `int countPrimeSetBits(int left, int right) {\n    int primes[20];\n    for (int i = 0; i < 20; i++) primes[i] = 0;\n    primes[2] = primes[3] = primes[5] = primes[7] = 1;\n    primes[11] = primes[13] = primes[17] = primes[19] = 1;\n    int count = 0;\n    for (int v = left; v <= right; v++) {\n        int bits = 0;\n        unsigned int x = (unsigned int) v;\n        while (x) {\n            bits += (int) (x & 1u);\n            x >>= 1;\n        }\n        if (bits < 20 && primes[bits]) count++;\n    }\n    return count;\n}`,
              csharp: `public static int CountPrimeSetBits(int left, int right)\n{\n    var primes = new HashSet<int> { 2, 3, 5, 7, 11, 13, 17, 19 };\n    int count = 0;\n    for (int v = left; v <= right; v++)\n    {\n        int bits = 0;\n        uint x = (uint) v;\n        while (x != 0)\n        {\n            bits += (int) (x & 1u);\n            x >>= 1;\n        }\n        if (primes.Contains(bits)) count++;\n    }\n    return count;\n}`,
              go: `func countPrimeSetBits(left int, right int) int {\n	primes := map[int]bool{2: true, 3: true, 5: true, 7: true, 11: true, 13: true, 17: true, 19: true}\n	count := 0\n	for v := left; v <= right; v++ {\n		bits := 0\n		x := v\n		for x > 0 {\n			bits += x & 1\n			x >>= 1\n		}\n		if primes[bits] {\n			count++\n		}\n	}\n	return count\n}`,
              kotlin: `fun countPrimeSetBits(left: Int, right: Int): Int {\n    val primes = hashSetOf(2, 3, 5, 7, 11, 13, 17, 19)\n    var count = 0\n    for (v in left..right) {\n        var bits = 0\n        var x = v\n        while (x > 0) {\n            bits += x and 1\n            x = x shr 1\n        }\n        if (primes.contains(bits)) count++\n    }\n    return count\n}`,
              swift: `func countPrimeSetBits(_ left: Int, _ right: Int) -> Int {\n    let primes: Set<Int> = [2, 3, 5, 7, 11, 13, 17, 19]\n    var count = 0\n    for v in left...right {\n        var bits = 0\n        var x = v\n        while x > 0 {\n            bits += x & 1\n            x >>= 1\n        }\n        if primes.contains(bits) { count += 1 }\n    }\n    return count\n}`,
              rust: `fn countPrimeSetBits(left: i32, right: i32) -> i32 {\n    let primes = [2, 3, 5, 7, 11, 13, 17, 19];\n    let mut count = 0;\n    for v in left..=right {\n        let mut bits = 0;\n        let mut x = v;\n        while x > 0 {\n            bits += x & 1;\n            x >>= 1;\n        }\n        if primes.contains(&bits) {\n            count += 1;\n        }\n    }\n    count\n}`,
              php: `function countPrimeSetBits($left, $right) {\n    $primes = array(2 => true, 3 => true, 5 => true, 7 => true, 11 => true, 13 => true, 17 => true, 19 => true);\n    $count = 0;\n    for ($v = $left; $v <= $right; $v++) {\n        $bits = 0;\n        $x = $v;\n        while ($x > 0) {\n            $bits += $x & 1;\n            $x >>= 1;\n        }\n        if (isset($primes[$bits])) $count++;\n    }\n    return $count;\n}`,
              ruby: `def countPrimeSetBits(left, right)\n  primes = { 2 => true, 3 => true, 5 => true, 7 => true, 11 => true, 13 => true, 17 => true, 19 => true }\n  count = 0\n  (left..right).each do |v|\n    bits = 0\n    x = v\n    while x > 0\n      bits += x & 1\n      x >>= 1\n    end\n    count += 1 if primes[bits]\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Convert a Number to Hexadecimal ─────────────────────────────
  (() => {
    const ref = (num: number) => {
      if (num === 0) return "0";
      const digits = "0123456789abcdef";
      let v = num < 0 ? num + 4294967296 : num;
      let out = "";
      while (v > 0) {
        out = digits[v % 16] + out;
        v = Math.floor(v / 16);
      }
      return out;
    };
    return {
      slug: "convert-a-number-to-hexadecimal",
      title: "Convert a Number to Hexadecimal",
      difficulty: "EASY" as const,
      tags: ["Math", "Bit Manipulation", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "toHex", params: [{ name: "num", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Given a 32-bit integer `num`, return its hexadecimal representation as a lowercase string.\n\nNegative numbers use **two's complement**. The result must not have leading zeros, except that zero itself is `\"0\"`. Do not use any built-in conversion function.",
        [
          { in: "num = 26", out: "1a" },
          { in: "num = -1", out: "ffffffff" },
          { in: "num = 0", out: "0" },
        ],
        ["-2147483648 <= num <= 2147483647"]),
      hints: [
        "Work on the unsigned 32-bit value: for a negative `num`, that is `num + 2^32`.",
        "Repeatedly take the low four bits and map them through `\"0123456789abcdef\"`.",
        "Build the string from the least significant digit, so prepend rather than append.",
      ],
      examples: [
        { input: "26", expectedOutput: "1a" },
        { input: "-1", expectedOutput: "ffffffff" },
        { input: "0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        const num = roll < 0.15 ? 0 : roll < 0.5 ? ri(rng, -1000, 1000) : ri(rng, -2147483648, 2147483647);
        return { input: String(num), expectedOutput: ref(num) };
      },
      solutions: {
        python: `def toHex(num: int) -> str:\n    if num == 0:\n        return "0"\n    digits = "0123456789abcdef"\n    v = num if num > 0 else num + (1 << 32)\n    out = ""\n    while v:\n        out = digits[v % 16] + out\n        v //= 16\n    return out`,
        javascript: `var toHex = function(num) {\n    if (num === 0) return "0";\n    const digits = "0123456789abcdef";\n    let v = num < 0 ? num + 4294967296 : num;\n    let out = "";\n    while (v > 0) {\n        out = digits.charAt(v % 16) + out;\n        v = Math.floor(v / 16);\n    }\n    return out;\n};`,
              typescript: `function toHex(num: number): string {\n    if (num === 0) return "0";\n    var digits = "0123456789abcdef";\n    var v = num < 0 ? num + 4294967296 : num;\n    var out = "";\n    while (v > 0) {\n        out = digits.charAt(v % 16) + out;\n        v = Math.floor(v / 16);\n    }\n    return out;\n}`,
              java: `public static String toHex(int num) {\n    if (num == 0) return "0";\n    String digits = "0123456789abcdef";\n    long v = num < 0 ? (long) num + 4294967296L : (long) num;\n    StringBuilder out = new StringBuilder();\n    while (v > 0) {\n        out.insert(0, digits.charAt((int) (v % 16)));\n        v /= 16;\n    }\n    return out.toString();\n}`,
              cpp: `string toHex(int num) {\n    if (num == 0) return "0";\n    string digits = "0123456789abcdef";\n    long long v = num < 0 ? (long long) num + 4294967296LL : (long long) num;\n    string out;\n    while (v > 0) {\n        out = string(1, digits[(int) (v % 16)]) + out;\n        v /= 16;\n    }\n    return out;\n}`,
              c: `char* toHex(int num) {\n    const char* digits = "0123456789abcdef";\n    char* out = (char*) malloc(16);\n    if (num == 0) {\n        strcpy(out, "0");\n        return out;\n    }\n    long long v = num < 0 ? (long long) num + 4294967296LL : (long long) num;\n    char buf[16];\n    int len = 0;\n    while (v > 0) {\n        buf[len++] = digits[(int) (v % 16)];\n        v /= 16;\n    }\n    for (int i = 0; i < len; i++) out[i] = buf[len - 1 - i];\n    out[len] = '\\0';\n    return out;\n}`,
              csharp: `public static string ToHex(int num)\n{\n    if (num == 0) return "0";\n    string digits = "0123456789abcdef";\n    long v = num < 0 ? (long) num + 4294967296L : (long) num;\n    var out_ = new List<char>();\n    while (v > 0)\n    {\n        out_.Insert(0, digits[(int) (v % 16)]);\n        v /= 16;\n    }\n    return new string(out_.ToArray());\n}`,
              go: `func toHex(num int) string {\n	if num == 0 {\n		return "0"\n	}\n	digits := "0123456789abcdef"\n	v := num\n	if v < 0 {\n		v += 4294967296\n	}\n	out := ""\n	for v > 0 {\n		out = string(digits[v%16]) + out\n		v /= 16\n	}\n	return out\n}`,
              kotlin: `fun toHex(num: Int): String {\n    if (num == 0) return "0"\n    val digits = "0123456789abcdef"\n    var v = if (num < 0) num.toLong() + 4294967296L else num.toLong()\n    val out = StringBuilder()\n    while (v > 0) {\n        out.insert(0, digits[(v % 16).toInt()])\n        v /= 16\n    }\n    return out.toString()\n}`,
              swift: `func toHex(_ num: Int) -> String {\n    if num == 0 { return "0" }\n    let digits = Array("0123456789abcdef")\n    var v = num < 0 ? num + 4294967296 : num\n    var out: [Character] = []\n    while v > 0 {\n        out.insert(digits[v % 16], at: 0)\n        v /= 16\n    }\n    return String(out)\n}`,
              rust: `fn toHex(num: i32) -> String {\n    if num == 0 {\n        return String::from("0");\n    }\n    let digits: Vec<char> = "0123456789abcdef".chars().collect();\n    let mut v: i64 = if num < 0 { num as i64 + 4294967296 } else { num as i64 };\n    let mut out: Vec<char> = Vec::new();\n    while v > 0 {\n        out.push(digits[(v % 16) as usize]);\n        v /= 16;\n    }\n    out.reverse();\n    out.into_iter().collect()\n}`,
              php: `function toHex($num) {\n    if ($num === 0) return "0";\n    $digits = "0123456789abcdef";\n    $v = $num < 0 ? $num + 4294967296 : $num;\n    $out = "";\n    while ($v > 0) {\n        $out = $digits[$v % 16] . $out;\n        $v = intdiv($v, 16);\n    }\n    return $out;\n}`,
              ruby: `def toHex(num)\n  return "0" if num == 0\n  digits = "0123456789abcdef"\n  v = num < 0 ? num + 4294967296 : num\n  out = ""\n  while v > 0\n    out = digits[v % 16] + out\n    v /= 16\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Base 7 ──────────────────────────────────────────────────────
  (() => {
    const ref = (num: number) => {
      if (num === 0) return "0";
      const negative = num < 0;
      let v = Math.abs(num);
      let out = "";
      while (v > 0) {
        out = String(v % 7) + out;
        v = Math.floor(v / 7);
      }
      return negative ? "-" + out : out;
    };
    return {
      slug: "base-7",
      title: "Base 7",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "Adobe"],
      signature: { funcName: "convertToBase7", params: [{ name: "num", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Given an integer `num`, return its base-7 representation as a string.",
        [
          { in: "num = 100", out: "202" },
          { in: "num = -7", out: "-10" },
          { in: "num = 0", out: "0" },
        ],
        ["-10000000 <= num <= 10000000"]),
      hints: [
        "Handle zero up front — the loop below would produce an empty string for it.",
        "Take the absolute value, then repeatedly divide by 7, prepending each remainder.",
        "Re-attach the minus sign at the end for negative inputs.",
      ],
      examples: [
        { input: "100", expectedOutput: "202" },
        { input: "-7", expectedOutput: "-10" },
        { input: "0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        const num = roll < 0.1 ? 0 : roll < 0.5 ? ri(rng, -500, 500) : ri(rng, -10000000, 10000000);
        return { input: String(num), expectedOutput: ref(num) };
      },
      solutions: {
        python: `def convertToBase7(num: int) -> str:\n    if num == 0:\n        return "0"\n    negative = num < 0\n    v = abs(num)\n    out = ""\n    while v:\n        out = str(v % 7) + out\n        v //= 7\n    return "-" + out if negative else out`,
        javascript: `var convertToBase7 = function(num) {\n    if (num === 0) return "0";\n    const negative = num < 0;\n    let v = Math.abs(num);\n    let out = "";\n    while (v > 0) {\n        out = String(v % 7) + out;\n        v = Math.floor(v / 7);\n    }\n    return negative ? "-" + out : out;\n};`,
              typescript: `function convertToBase7(num: number): string {\n    if (num === 0) return "0";\n    var negative = num < 0;\n    var v = Math.abs(num);\n    var out = "";\n    while (v > 0) {\n        out = String(v % 7) + out;\n        v = Math.floor(v / 7);\n    }\n    return negative ? "-" + out : out;\n}`,
              java: `public static String convertToBase7(int num) {\n    if (num == 0) return "0";\n    boolean negative = num < 0;\n    long v = Math.abs((long) num);\n    StringBuilder out = new StringBuilder();\n    while (v > 0) {\n        out.insert(0, (char) ('0' + (int) (v % 7)));\n        v /= 7;\n    }\n    return negative ? "-" + out.toString() : out.toString();\n}`,
              cpp: `string convertToBase7(int num) {\n    if (num == 0) return "0";\n    bool negative = num < 0;\n    long long v = num < 0 ? -(long long) num : (long long) num;\n    string out;\n    while (v > 0) {\n        out = string(1, (char) ('0' + (int) (v % 7))) + out;\n        v /= 7;\n    }\n    return negative ? "-" + out : out;\n}`,
              c: `char* convertToBase7(int num) {\n    char* out = (char*) malloc(32);\n    if (num == 0) {\n        strcpy(out, "0");\n        return out;\n    }\n    int negative = num < 0;\n    long long v = num < 0 ? -(long long) num : (long long) num;\n    char buf[32];\n    int len = 0;\n    while (v > 0) {\n        buf[len++] = (char) ('0' + (int) (v % 7));\n        v /= 7;\n    }\n    int m = 0;\n    if (negative) out[m++] = '-';\n    for (int i = 0; i < len; i++) out[m++] = buf[len - 1 - i];\n    out[m] = '\\0';\n    return out;\n}`,
              csharp: `public static string ConvertToBase7(int num)\n{\n    if (num == 0) return "0";\n    bool negative = num < 0;\n    long v = Math.Abs((long) num);\n    var out_ = new List<char>();\n    while (v > 0)\n    {\n        out_.Insert(0, (char) ('0' + (int) (v % 7)));\n        v /= 7;\n    }\n    string text = new string(out_.ToArray());\n    return negative ? "-" + text : text;\n}`,
              go: `func convertToBase7(num int) string {\n	if num == 0 {\n		return "0"\n	}\n	negative := num < 0\n	v := num\n	if v < 0 {\n		v = -v\n	}\n	out := ""\n	for v > 0 {\n		out = strconv.Itoa(v%7) + out\n		v /= 7\n	}\n	if negative {\n		return "-" + out\n	}\n	return out\n}`,
              kotlin: `fun convertToBase7(num: Int): String {\n    if (num == 0) return "0"\n    val negative = num < 0\n    var v = Math.abs(num.toLong())\n    val out = StringBuilder()\n    while (v > 0) {\n        out.insert(0, ('0' + (v % 7).toInt()))\n        v /= 7\n    }\n    return if (negative) "-" + out.toString() else out.toString()\n}`,
              swift: `func convertToBase7(_ num: Int) -> String {\n    if num == 0 { return "0" }\n    let negative = num < 0\n    var v = abs(num)\n    var out = ""\n    while v > 0 {\n        out = String(v % 7) + out\n        v /= 7\n    }\n    return negative ? "-" + out : out\n}`,
              rust: `fn convertToBase7(num: i32) -> String {\n    if num == 0 {\n        return String::from("0");\n    }\n    let negative = num < 0;\n    let mut v: i64 = (num as i64).abs();\n    let mut out = String::new();\n    while v > 0 {\n        out.insert(0, std::char::from_digit((v % 7) as u32, 10).unwrap());\n        v /= 7;\n    }\n    if negative {\n        format!("-{}", out)\n    } else {\n        out\n    }\n}`,
              php: `function convertToBase7($num) {\n    if ($num === 0) return "0";\n    $negative = $num < 0;\n    $v = abs($num);\n    $out = "";\n    while ($v > 0) {\n        $out = strval($v % 7) . $out;\n        $v = intdiv($v, 7);\n    }\n    return $negative ? "-" . $out : $out;\n}`,
              ruby: `def convertToBase7(num)\n  return "0" if num == 0\n  negative = num < 0\n  v = num.abs\n  out = ""\n  while v > 0\n    out = (v % 7).to_s + out\n    v /= 7\n  end\n  negative ? "-" + out : out\nend`,
      },
    };
  })(),

  // ── Nim Game ────────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => n % 4 !== 0;
    return {
      slug: "nim-game",
      title: "Nim Game",
      difficulty: "EASY" as const,
      tags: ["Math", "Brainteaser", "Game Theory", "Amazon", "Adobe", "Bloomberg"],
      signature: { funcName: "canWinNim", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You and a friend take turns removing **1, 2 or 3** stones from a heap of `n` stones. You move first, and whoever removes the last stone wins.\n\nAssuming both of you play optimally, return `true` if you can win.",
        [
          { in: "n = 4", out: "false", note: "Whatever you take, your friend can clear the rest." },
          { in: "n = 1", out: "true" },
          { in: "n = 2", out: "true" },
        ],
        ["1 <= n <= 1000000000"]),
      hints: [
        "Work out small cases by hand: 1, 2 and 3 are wins; 4 is a loss.",
        "From 5, 6 or 7 you can always hand your opponent exactly 4.",
        "The losing positions are precisely the multiples of 4.",
      ],
      examples: [
        { input: "4", expectedOutput: "false" },
        { input: "1", expectedOutput: "true" },
        { input: "2", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.4 ? ri(rng, 1, 40) : ri(rng, 1, 1000000000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def canWinNim(n: int) -> bool:\n    return n % 4 != 0`,
        javascript: `var canWinNim = function(n) {\n    return n % 4 !== 0;\n};`,
              typescript: `function canWinNim(n: number): boolean {\n    return n % 4 !== 0;\n}`,
              java: `public static boolean canWinNim(int n) {\n    return n % 4 != 0;\n}`,
              cpp: `bool canWinNim(int n) {\n    return n % 4 != 0;\n}`,
              c: `bool canWinNim(int n) {\n    return n % 4 != 0;\n}`,
              csharp: `public static bool CanWinNim(int n)\n{\n    return n % 4 != 0;\n}`,
              go: `func canWinNim(n int) bool {\n	return n%4 != 0\n}`,
              kotlin: `fun canWinNim(n: Int): Boolean {\n    return n % 4 != 0\n}`,
              swift: `func canWinNim(_ n: Int) -> Bool {\n    return n % 4 != 0\n}`,
              rust: `fn canWinNim(n: i32) -> bool {\n    n % 4 != 0\n}`,
              php: `function canWinNim($n) {\n    return $n % 4 !== 0;\n}`,
              ruby: `def canWinNim(n)\n  n % 4 != 0\nend`,
      },
    };
  })(),

  // ── Gray Code ───────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const total = Math.pow(2, n);
      const out: number[] = [];
      for (let i = 0; i < total; i++) out.push(i ^ (i >> 1));
      return out;
    };
    return {
      slug: "gray-code",
      title: "Gray Code",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Backtracking", "Bit Manipulation", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "grayCode", params: [{ name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "An **n-bit gray code sequence** is a permutation of `0 … 2^n - 1` that starts at `0`, where consecutive entries differ in exactly one bit — and so do the first and the last entry.\n\nGiven `n`, return the standard reflected gray code sequence.",
        [
          { in: "n = 2", out: "[0,1,3,2]" },
          { in: "n = 1", out: "[0,1]" },
          { in: "n = 0", out: "[0]" },
        ],
        ["0 <= n <= 5"]),
      hints: [
        "There is a closed form: the i-th entry of the standard sequence is `i XOR (i >> 1)`.",
        "Check it: consecutive `i` differ in a run of low bits, and the XOR collapses that to a single bit flip.",
        "The reflect-and-prefix construction produces exactly the same list.",
      ],
      examples: [
        { input: "2", expectedOutput: "[0,1,3,2]" },
        { input: "1", expectedOutput: "[0,1]" },
        { input: "0", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 5);
        return { input: String(n), expectedOutput: fmtIntArr(ref(n)) };
      },
      solutions: {
        python: `def grayCode(n: int):\n    return [i ^ (i >> 1) for i in range(1 << n)]`,
        javascript: `var grayCode = function(n) {\n    const total = Math.pow(2, n);\n    const out = [];\n    for (let i = 0; i < total; i++) out.push(i ^ (i >> 1));\n    return out;\n};`,
              typescript: `function grayCode(n: number): number[] {\n    var total = 1;\n    for (var k = 0; k < n; k++) total *= 2;\n    var out: number[] = [];\n    for (var i = 0; i < total; i++) out.push(i ^ (i >> 1));\n    return out;\n}`,
              java: `public static int[] grayCode(int n) {\n    int total = 1 << n;\n    int[] out = new int[total];\n    for (int i = 0; i < total; i++) out[i] = i ^ (i >> 1);\n    return out;\n}`,
              cpp: `vector<int> grayCode(int n) {\n    int total = 1 << n;\n    vector<int> out(total);\n    for (int i = 0; i < total; i++) out[i] = i ^ (i >> 1);\n    return out;\n}`,
              c: `int* grayCode(int n, int* returnSize) {\n    int total = 1 << n;\n    int* out = (int*) malloc((size_t) total * sizeof(int));\n    for (int i = 0; i < total; i++) out[i] = i ^ (i >> 1);\n    *returnSize = total;\n    return out;\n}`,
              csharp: `public static int[] GrayCode(int n)\n{\n    int total = 1 << n;\n    int[] out_ = new int[total];\n    for (int i = 0; i < total; i++) out_[i] = i ^ (i >> 1);\n    return out_;\n}`,
              go: `func grayCode(n int) []int {\n	total := 1 << uint(n)\n	out := make([]int, total)\n	for i := 0; i < total; i++ {\n		out[i] = i ^ (i >> 1)\n	}\n	return out\n}`,
              kotlin: `fun grayCode(n: Int): IntArray {\n    val total = 1 shl n\n    val out = IntArray(total)\n    for (i in 0 until total) out[i] = i xor (i shr 1)\n    return out\n}`,
              swift: `func grayCode(_ n: Int) -> [Int] {\n    let total = 1 << n\n    var out = [Int](repeating: 0, count: total)\n    for i in 0..<total {\n        out[i] = i ^ (i >> 1)\n    }\n    return out\n}`,
              rust: `fn grayCode(n: i32) -> Vec<i32> {\n    let total = 1i32 << n;\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..total {\n        out.push(i ^ (i >> 1));\n    }\n    out\n}`,
              php: `function grayCode($n) {\n    $total = 1 << $n;\n    $out = array();\n    for ($i = 0; $i < $total; $i++) {\n        $out[] = $i ^ ($i >> 1);\n    }\n    return $out;\n}`,
              ruby: `def grayCode(n)\n  total = 1 << n\n  (0...total).map { |i| i ^ (i >> 1) }\nend`,
      },
    };
  })(),

  // ── Minimum Flips to Make a OR b Equal to c ─────────────────────
  (() => {
    const ref = (a: number, b: number, c: number) => {
      let flips = 0;
      for (let bit = 0; bit < 31; bit++) {
        const ab = (a >> bit) & 1;
        const bb = (b >> bit) & 1;
        const cb = (c >> bit) & 1;
        if (cb === 0) flips += ab + bb;
        else if (ab === 0 && bb === 0) flips += 1;
      }
      return flips;
    };
    return {
      slug: "minimum-flips-to-make-a-or-b-equal-to-c",
      title: "Minimum Flips to Make a OR b Equal to c",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Amazon", "Google", "Adobe"],
      signature: { funcName: "minFlips", params: [{ name: "a", type: "int" as const }, { name: "b", type: "int" as const }, { name: "c", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given three non-negative integers `a`, `b` and `c`, return the minimum number of bit flips — each flip changes one bit of `a` or of `b` — needed to make `(a OR b) == c`.",
        [
          { in: "a = 2, b = 6, c = 5", out: "3" },
          { in: "a = 4, b = 2, c = 7", out: "1" },
          { in: "a = 1, b = 2, c = 3", out: "0" },
        ],
        ["0 <= a, b, c <= 1000000000"]),
      hints: [
        "Handle each bit position on its own — flips at different positions never interact.",
        "If the target bit of `c` is 0, every set bit among `a` and `b` at that position must be cleared: 0, 1 or 2 flips.",
        "If it is 1, you need at least one set bit there — that costs a flip only when both are 0.",
      ],
      examples: [
        { input: "2\n6\n5", expectedOutput: "3" },
        { input: "4\n2\n7", expectedOutput: "1" },
        { input: "1\n2\n3", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 64 : 1000000000;
        const a = ri(rng, 0, hi);
        const b = ri(rng, 0, hi);
        const c = ri(rng, 0, hi);
        return { input: `${a}\n${b}\n${c}`, expectedOutput: String(ref(a, b, c)) };
      },
      solutions: {
        python: `def minFlips(a: int, b: int, c: int) -> int:\n    flips = 0\n    for bit in range(31):\n        ab = (a >> bit) & 1\n        bb = (b >> bit) & 1\n        cb = (c >> bit) & 1\n        if cb == 0:\n            flips += ab + bb\n        elif ab == 0 and bb == 0:\n            flips += 1\n    return flips`,
        javascript: `var minFlips = function(a, b, c) {\n    let flips = 0;\n    for (let bit = 0; bit < 31; bit++) {\n        const ab = (a >> bit) & 1;\n        const bb = (b >> bit) & 1;\n        const cb = (c >> bit) & 1;\n        if (cb === 0) flips += ab + bb;\n        else if (ab === 0 && bb === 0) flips += 1;\n    }\n    return flips;\n};`,
              typescript: `function minFlips(a: number, b: number, c: number): number {\n    var flips = 0;\n    for (var bit = 0; bit < 31; bit++) {\n        var ab = (a >> bit) & 1;\n        var bb = (b >> bit) & 1;\n        var cb = (c >> bit) & 1;\n        if (cb === 0) flips += ab + bb;\n        else if (ab === 0 && bb === 0) flips += 1;\n    }\n    return flips;\n}`,
              java: `public static int minFlips(int a, int b, int c) {\n    int flips = 0;\n    for (int bit = 0; bit < 31; bit++) {\n        int ab = (a >> bit) & 1;\n        int bb = (b >> bit) & 1;\n        int cb = (c >> bit) & 1;\n        if (cb == 0) flips += ab + bb;\n        else if (ab == 0 && bb == 0) flips += 1;\n    }\n    return flips;\n}`,
              cpp: `int minFlips(int a, int b, int c) {\n    int flips = 0;\n    for (int bit = 0; bit < 31; bit++) {\n        int ab = (a >> bit) & 1;\n        int bb = (b >> bit) & 1;\n        int cb = (c >> bit) & 1;\n        if (cb == 0) flips += ab + bb;\n        else if (ab == 0 && bb == 0) flips += 1;\n    }\n    return flips;\n}`,
              c: `int minFlips(int a, int b, int c) {\n    int flips = 0;\n    for (int bit = 0; bit < 31; bit++) {\n        int ab = (a >> bit) & 1;\n        int bb = (b >> bit) & 1;\n        int cb = (c >> bit) & 1;\n        if (cb == 0) flips += ab + bb;\n        else if (ab == 0 && bb == 0) flips += 1;\n    }\n    return flips;\n}`,
              csharp: `public static int MinFlips(int a, int b, int c)\n{\n    int flips = 0;\n    for (int bit = 0; bit < 31; bit++)\n    {\n        int ab = (a >> bit) & 1;\n        int bb = (b >> bit) & 1;\n        int cb = (c >> bit) & 1;\n        if (cb == 0) flips += ab + bb;\n        else if (ab == 0 && bb == 0) flips += 1;\n    }\n    return flips;\n}`,
              go: `func minFlips(a int, b int, c int) int {\n	flips := 0\n	for bit := 0; bit < 31; bit++ {\n		ab := (a >> uint(bit)) & 1\n		bb := (b >> uint(bit)) & 1\n		cb := (c >> uint(bit)) & 1\n		if cb == 0 {\n			flips += ab + bb\n		} else if ab == 0 && bb == 0 {\n			flips++\n		}\n	}\n	return flips\n}`,
              kotlin: `fun minFlips(a: Int, b: Int, c: Int): Int {\n    var flips = 0\n    for (bit in 0 until 31) {\n        val ab = (a shr bit) and 1\n        val bb = (b shr bit) and 1\n        val cb = (c shr bit) and 1\n        if (cb == 0) flips += ab + bb\n        else if (ab == 0 && bb == 0) flips += 1\n    }\n    return flips\n}`,
              swift: `func minFlips(_ a: Int, _ b: Int, _ c: Int) -> Int {\n    var flips = 0\n    for bit in 0..<31 {\n        let ab = (a >> bit) & 1\n        let bb = (b >> bit) & 1\n        let cb = (c >> bit) & 1\n        if cb == 0 { flips += ab + bb }\n        else if ab == 0 && bb == 0 { flips += 1 }\n    }\n    return flips\n}`,
              rust: `fn minFlips(a: i32, b: i32, c: i32) -> i32 {\n    let mut flips = 0;\n    for bit in 0..31 {\n        let ab = (a >> bit) & 1;\n        let bb = (b >> bit) & 1;\n        let cb = (c >> bit) & 1;\n        if cb == 0 {\n            flips += ab + bb;\n        } else if ab == 0 && bb == 0 {\n            flips += 1;\n        }\n    }\n    flips\n}`,
              php: `function minFlips($a, $b, $c) {\n    $flips = 0;\n    for ($bit = 0; $bit < 31; $bit++) {\n        $ab = ($a >> $bit) & 1;\n        $bb = ($b >> $bit) & 1;\n        $cb = ($c >> $bit) & 1;\n        if ($cb === 0) $flips += $ab + $bb;\n        else if ($ab === 0 && $bb === 0) $flips += 1;\n    }\n    return $flips;\n}`,
              ruby: `def minFlips(a, b, c)\n  flips = 0\n  (0...31).each do |bit|\n    ab = (a >> bit) & 1\n    bb = (b >> bit) & 1\n    cb = (c >> bit) & 1\n    if cb == 0\n      flips += ab + bb\n    elsif ab == 0 && bb == 0\n      flips += 1\n    end\n  end\n  flips\nend`,
      },
    };
  })(),

  // ── XOR Operation in an Array ───────────────────────────────────
  (() => {
    const ref = (n: number, start: number) => {
      let out = 0;
      for (let i = 0; i < n; i++) out ^= start + 2 * i;
      return out;
    };
    return {
      slug: "xor-operation-in-an-array",
      title: "XOR Operation in an Array",
      difficulty: "EASY" as const,
      tags: ["Math", "Bit Manipulation", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "xorOperation", params: [{ name: "n", type: "int" as const }, { name: "start", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given integers `n` and `start`. Define an array `nums` of length `n` by `nums[i] = start + 2 * i`.\n\nReturn the bitwise XOR of every element of `nums`.",
        [
          { in: "n = 5, start = 0", out: "8", note: "The array is [0,2,4,6,8]." },
          { in: "n = 4, start = 3", out: "8" },
          { in: "n = 1, start = 7", out: "7" },
        ],
        ["1 <= n <= 50", "0 <= start <= 1000"]),
      hints: [
        "The array is never actually needed — generate the values on the fly.",
        "XOR them into a running accumulator initialised to 0.",
        "The closed form uses the fact that all the terms share the same lowest bit.",
      ],
      examples: [
        { input: "5\n0", expectedOutput: "8" },
        { input: "4\n3", expectedOutput: "8" },
        { input: "1\n7", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const start = ri(rng, 0, 1000);
        return { input: `${n}\n${start}`, expectedOutput: String(ref(n, start)) };
      },
      solutions: {
        python: `def xorOperation(n: int, start: int) -> int:\n    out = 0\n    for i in range(n):\n        out ^= start + 2 * i\n    return out`,
        javascript: `var xorOperation = function(n, start) {\n    let out = 0;\n    for (let i = 0; i < n; i++) out ^= start + 2 * i;\n    return out;\n};`,
              typescript: `function xorOperation(n: number, start: number): number {\n    var out = 0;\n    for (var i = 0; i < n; i++) out ^= start + 2 * i;\n    return out;\n}`,
              java: `public static int xorOperation(int n, int start) {\n    int out = 0;\n    for (int i = 0; i < n; i++) out ^= start + 2 * i;\n    return out;\n}`,
              cpp: `int xorOperation(int n, int start) {\n    int out = 0;\n    for (int i = 0; i < n; i++) out ^= start + 2 * i;\n    return out;\n}`,
              c: `int xorOperation(int n, int start) {\n    int out = 0;\n    for (int i = 0; i < n; i++) out ^= start + 2 * i;\n    return out;\n}`,
              csharp: `public static int XorOperation(int n, int start)\n{\n    int out_ = 0;\n    for (int i = 0; i < n; i++) out_ ^= start + 2 * i;\n    return out_;\n}`,
              go: `func xorOperation(n int, start int) int {\n	out := 0\n	for i := 0; i < n; i++ {\n		out ^= start + 2*i\n	}\n	return out\n}`,
              kotlin: `fun xorOperation(n: Int, start: Int): Int {\n    var out = 0\n    for (i in 0 until n) out = out xor (start + 2 * i)\n    return out\n}`,
              swift: `func xorOperation(_ n: Int, _ start: Int) -> Int {\n    var out = 0\n    for i in 0..<n { out ^= start + 2 * i }\n    return out\n}`,
              rust: `fn xorOperation(n: i32, start: i32) -> i32 {\n    let mut out = 0;\n    for i in 0..n {\n        out ^= start + 2 * i;\n    }\n    out\n}`,
              php: `function xorOperation($n, $start) {\n    $out = 0;\n    for ($i = 0; $i < $n; $i++) $out ^= $start + 2 * $i;\n    return $out;\n}`,
              ruby: `def xorOperation(n, start)\n  out = 0\n  (0...n).each { |i| out ^= start + 2 * i }\n  out\nend`,
      },
    };
  })(),

  // ── Decode XORed Array ──────────────────────────────────────────
  (() => {
    const ref = (encoded: number[], first: number) => {
      const out: number[] = [first];
      for (let i = 0; i < encoded.length; i++) out.push(out[i] ^ encoded[i]);
      return out;
    };
    return {
      slug: "decode-xored-array",
      title: "Decode XORed Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Bit Manipulation", "Amazon", "Adobe"],
      signature: { funcName: "decode", params: [{ name: "encoded", type: "int[]" as const }, { name: "first", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "An array `arr` of `n` non-negative integers was encoded into an array `encoded` of length `n - 1` with `encoded[i] = arr[i] XOR arr[i + 1]`.\n\nGiven `encoded` and the value `first` — that is, `arr[0]` — recover and return the original array `arr`.",
        [
          { in: "encoded = [1,2,3], first = 1", out: "[1,0,2,1]" },
          { in: "encoded = [6,2,7,3], first = 4", out: "[4,2,0,7,4]" },
          { in: "encoded = [5], first = 3", out: "[3,6]" },
        ],
        ["1 <= encoded.length <= 39", "0 <= encoded[i], first <= 1000000"]),
      hints: [
        "XOR is its own inverse: from `x ^ y = z` and `x` you recover `y = x ^ z`.",
        "So `arr[i + 1] = arr[i] XOR encoded[i]`.",
        "Start from `first` and walk forward once.",
      ],
      examples: [
        { input: "[1,2,3]\n1", expectedOutput: "[1,0,2,1]" },
        { input: "[6,2,7,3]\n4", expectedOutput: "[4,2,0,7,4]" },
        { input: "[5]\n3", expectedOutput: "[3,6]" },
      ],
      gen: (rng: Rng) => {
        const encoded = randArr(rng, ri(rng, 1, 39), 0, rng() < 0.5 ? 32 : 1000000);
        const first = ri(rng, 0, rng() < 0.5 ? 32 : 1000000);
        return { input: `${fmtIntArr(encoded)}\n${first}`, expectedOutput: fmtIntArr(ref(encoded, first)) };
      },
      solutions: {
        python: `def decode(encoded, first: int):\n    out = [first]\n    for x in encoded:\n        out.append(out[-1] ^ x)\n    return out`,
        javascript: `var decode = function(encoded, first) {\n    const out = [first];\n    for (let i = 0; i < encoded.length; i++) out.push(out[i] ^ encoded[i]);\n    return out;\n};`,
              typescript: `function decode(encoded: number[], first: number): number[] {\n    var out: number[] = [first];\n    for (var i = 0; i < encoded.length; i++) out.push(out[i] ^ encoded[i]);\n    return out;\n}`,
              java: `public static int[] decode(int[] encoded, int first) {\n    int[] out = new int[encoded.length + 1];\n    out[0] = first;\n    for (int i = 0; i < encoded.length; i++) out[i + 1] = out[i] ^ encoded[i];\n    return out;\n}`,
              cpp: `vector<int> decode(vector<int>& encoded, int first) {\n    vector<int> out(encoded.size() + 1);\n    out[0] = first;\n    for (size_t i = 0; i < encoded.size(); i++) out[i + 1] = out[i] ^ encoded[i];\n    return out;\n}`,
              c: `int* decode(int* encoded, int encodedSize, int first, int* returnSize) {\n    int* out = (int*) malloc((size_t) (encodedSize + 1) * sizeof(int));\n    out[0] = first;\n    for (int i = 0; i < encodedSize; i++) out[i + 1] = out[i] ^ encoded[i];\n    *returnSize = encodedSize + 1;\n    return out;\n}`,
              csharp: `public static int[] Decode(int[] encoded, int first)\n{\n    int[] out_ = new int[encoded.Length + 1];\n    out_[0] = first;\n    for (int i = 0; i < encoded.Length; i++) out_[i + 1] = out_[i] ^ encoded[i];\n    return out_;\n}`,
              go: `func decode(encoded []int, first int) []int {\n	out := make([]int, len(encoded)+1)\n	out[0] = first\n	for i := 0; i < len(encoded); i++ {\n		out[i+1] = out[i] ^ encoded[i]\n	}\n	return out\n}`,
              kotlin: `fun decode(encoded: IntArray, first: Int): IntArray {\n    val out = IntArray(encoded.size + 1)\n    out[0] = first\n    for (i in encoded.indices) out[i + 1] = out[i] xor encoded[i]\n    return out\n}`,
              swift: `func decode(_ encoded: [Int], _ first: Int) -> [Int] {\n    var out = [Int](repeating: 0, count: encoded.count + 1)\n    out[0] = first\n    for i in 0..<encoded.count {\n        out[i + 1] = out[i] ^ encoded[i]\n    }\n    return out\n}`,
              rust: `fn decode(encoded: Vec<i32>, first: i32) -> Vec<i32> {\n    let mut out = vec![0i32; encoded.len() + 1];\n    out[0] = first;\n    for i in 0..encoded.len() {\n        out[i + 1] = out[i] ^ encoded[i];\n    }\n    out\n}`,
              php: `function decode($encoded, $first) {\n    $out = array($first);\n    for ($i = 0; $i < count($encoded); $i++) {\n        $out[] = $out[$i] ^ $encoded[$i];\n    }\n    return $out;\n}`,
              ruby: `def decode(encoded, first)\n  out = [first]\n  encoded.each_with_index { |x, i| out.push(out[i] ^ x) }\n  out\nend`,
      },
    };
  })(),

  // ── Sort Integers by The Power Value ────────────────────────────
  (() => {
    const power = (x: number) => {
      let steps = 0;
      let v = x;
      while (v !== 1) {
        v = v % 2 === 0 ? v / 2 : 3 * v + 1;
        steps++;
      }
      return steps;
    };
    const ref = (lo: number, hi: number, k: number) => {
      const values: number[] = [];
      for (let v = lo; v <= hi; v++) values.push(v);
      values.sort((a, b) => {
        const pa = power(a), pb = power(b);
        return pa !== pb ? pa - pb : a - b;
      });
      return values[k - 1];
    };
    return {
      slug: "sort-integers-by-the-power-value",
      title: "Sort Integers by The Power Value",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Memoization", "Sorting", "Amazon", "Google"],
      signature: { funcName: "getKth", params: [{ name: "lo", type: "int" as const }, { name: "hi", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **power** of an integer `x` is the number of steps needed to reach 1 under the rule: if `x` is even, halve it; if `x` is odd, replace it with `3x + 1`.\n\nSort the integers in the range `[lo, hi]` by increasing power, breaking ties by the value itself, and return the `k`-th value of that ordering (1-indexed).",
        [
          { in: "lo = 12, hi = 15, k = 2", out: "13", note: "The powers are 9, 9, 6 and 17, so the order is 13, 12, 15, 14." },
          { in: "lo = 7, hi = 11, k = 4", out: "7" },
          { in: "lo = 1, hi = 1, k = 1", out: "1" },
        ],
        ["1 <= lo <= hi <= 20000", "hi - lo <= 40", "1 <= k <= hi - lo + 1"]),
      hints: [
        "Compute each value's power by simulating the Collatz steps — the sequence always terminates in this range.",
        "Then sort by (power, value) and index into the result.",
        "Memoising the powers pays off when the same values recur across queries.",
      ],
      examples: [
        { input: "12\n15\n2", expectedOutput: "13" },
        { input: "7\n11\n4", expectedOutput: "7" },
        { input: "1\n1\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const lo = ri(rng, 1, 20000);
        const hi = Math.min(20000, lo + ri(rng, 0, 40));
        const k = ri(rng, 1, hi - lo + 1);
        return { input: `${lo}\n${hi}\n${k}`, expectedOutput: String(ref(lo, hi, k)) };
      },
      solutions: {
        python: `def getKth(lo: int, hi: int, k: int) -> int:\n    def power(x):\n        steps = 0\n        while x != 1:\n            x = x // 2 if x % 2 == 0 else 3 * x + 1\n            steps += 1\n        return steps\n\n    return sorted(range(lo, hi + 1), key=lambda v: (power(v), v))[k - 1]`,
        javascript: `var getKth = function(lo, hi, k) {\n    const power = function(x) {\n        let steps = 0;\n        let v = x;\n        while (v !== 1) {\n            v = v % 2 === 0 ? v / 2 : 3 * v + 1;\n            steps++;\n        }\n        return steps;\n    };\n    const values = [];\n    for (let v = lo; v <= hi; v++) values.push(v);\n    values.sort(function(a, b) {\n        const pa = power(a), pb = power(b);\n        return pa !== pb ? pa - pb : a - b;\n    });\n    return values[k - 1];\n};`,
              typescript: `function collatzPower(x: number): number {\n    var steps = 0;\n    var v = x;\n    while (v !== 1) {\n        v = v % 2 === 0 ? v / 2 : 3 * v + 1;\n        steps++;\n    }\n    return steps;\n}\n\nfunction getKth(lo: number, hi: number, k: number): number {\n    var values: number[] = [];\n    for (var v = lo; v <= hi; v++) values.push(v);\n    values.sort(function (a, b) {\n        var pa = collatzPower(a);\n        var pb = collatzPower(b);\n        return pa !== pb ? pa - pb : a - b;\n    });\n    return values[k - 1];\n}`,
              java: `private static int collatzPower(int x) {\n    int steps = 0;\n    long v = x;\n    while (v != 1) {\n        v = v % 2 == 0 ? v / 2 : 3 * v + 1;\n        steps++;\n    }\n    return steps;\n}\n\npublic static int getKth(int lo, int hi, int k) {\n    Integer[] values = new Integer[hi - lo + 1];\n    for (int i = 0; i < values.length; i++) values[i] = lo + i;\n    Arrays.sort(values, (a, b) -> {\n        int pa = collatzPower(a), pb = collatzPower(b);\n        return pa != pb ? pa - pb : a - b;\n    });\n    return values[k - 1];\n}`,
              cpp: `static int collatzPower(int x) {\n    int steps = 0;\n    long long v = x;\n    while (v != 1) {\n        v = v % 2 == 0 ? v / 2 : 3 * v + 1;\n        steps++;\n    }\n    return steps;\n}\n\nint getKth(int lo, int hi, int k) {\n    vector<int> values;\n    for (int v = lo; v <= hi; v++) values.push_back(v);\n    sort(values.begin(), values.end(), [](int a, int b) {\n        int pa = collatzPower(a), pb = collatzPower(b);\n        if (pa != pb) return pa < pb;\n        return a < b;\n    });\n    return values[k - 1];\n}`,
              c: `static int collatzPower(int x) {\n    int steps = 0;\n    long long v = x;\n    while (v != 1) {\n        v = v % 2 == 0 ? v / 2 : 3 * v + 1;\n        steps++;\n    }\n    return steps;\n}\n\nstatic int cmpPower(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    int px = collatzPower(x);\n    int py = collatzPower(y);\n    if (px != py) return px - py;\n    return (x > y) - (x < y);\n}\n\nint getKth(int lo, int hi, int k) {\n    int n = hi - lo + 1;\n    int* values = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) values[i] = lo + i;\n    qsort(values, n, sizeof(int), cmpPower);\n    int answer = values[k - 1];\n    free(values);\n    return answer;\n}`,
              csharp: `private static int CollatzPower(int x)\n{\n    int steps = 0;\n    long v = x;\n    while (v != 1)\n    {\n        v = v % 2 == 0 ? v / 2 : 3 * v + 1;\n        steps++;\n    }\n    return steps;\n}\n\npublic static int GetKth(int lo, int hi, int k)\n{\n    var values = new List<int>();\n    for (int v = lo; v <= hi; v++) values.Add(v);\n    values.Sort((a, b) =>\n    {\n        int pa = CollatzPower(a), pb = CollatzPower(b);\n        if (pa != pb) return pa.CompareTo(pb);\n        return a.CompareTo(b);\n    });\n    return values[k - 1];\n}`,
              go: `func collatzPower(x int) int {\n	steps := 0\n	v := x\n	for v != 1 {\n		if v%2 == 0 {\n			v /= 2\n		} else {\n			v = 3*v + 1\n		}\n		steps++\n	}\n	return steps\n}\n\nfunc getKth(lo int, hi int, k int) int {\n	values := []int{}\n	for v := lo; v <= hi; v++ {\n		values = append(values, v)\n	}\n	sort.Slice(values, func(a, b int) bool {\n		pa, pb := collatzPower(values[a]), collatzPower(values[b])\n		if pa != pb {\n			return pa < pb\n		}\n		return values[a] < values[b]\n	})\n	return values[k-1]\n}`,
              kotlin: `fun collatzPower(x: Int): Int {\n    var steps = 0\n    var v = x.toLong()\n    while (v != 1L) {\n        v = if (v % 2 == 0L) v / 2 else 3 * v + 1\n        steps++\n    }\n    return steps\n}\n\nfun getKth(lo: Int, hi: Int, k: Int): Int {\n    val values = (lo..hi).toMutableList()\n    val sorted = values.sortedWith(Comparator { a, b ->\n        val pa = collatzPower(a)\n        val pb = collatzPower(b)\n        if (pa != pb) pa - pb else a - b\n    })\n    return sorted[k - 1]\n}`,
              swift: `func collatzPower(_ x: Int) -> Int {\n    var steps = 0\n    var v = x\n    while v != 1 {\n        v = v % 2 == 0 ? v / 2 : 3 * v + 1\n        steps += 1\n    }\n    return steps\n}\n\nfunc getKth(_ lo: Int, _ hi: Int, _ k: Int) -> Int {\n    let values = Array(lo...hi)\n    let sorted = values.sorted { a, b in\n        let pa = collatzPower(a)\n        let pb = collatzPower(b)\n        if pa != pb { return pa < pb }\n        return a < b\n    }\n    return sorted[k - 1]\n}`,
              rust: `fn collatz_power(x: i32) -> i32 {\n    let mut steps = 0;\n    let mut v: i64 = x as i64;\n    while v != 1 {\n        v = if v % 2 == 0 { v / 2 } else { 3 * v + 1 };\n        steps += 1;\n    }\n    steps\n}\n\nfn getKth(lo: i32, hi: i32, k: i32) -> i32 {\n    let mut values: Vec<i32> = (lo..=hi).collect();\n    values.sort_by(|a, b| {\n        let pa = collatz_power(*a);\n        let pb = collatz_power(*b);\n        if pa != pb {\n            pa.cmp(&pb)\n        } else {\n            a.cmp(b)\n        }\n    });\n    values[(k - 1) as usize]\n}`,
              php: `function collatzPower($x) {\n    $steps = 0;\n    $v = $x;\n    while ($v != 1) {\n        $v = $v % 2 === 0 ? intdiv($v, 2) : 3 * $v + 1;\n        $steps++;\n    }\n    return $steps;\n}\n\nfunction getKth($lo, $hi, $k) {\n    $values = range($lo, $hi);\n    usort($values, function($a, $b) {\n        $pa = collatzPower($a);\n        $pb = collatzPower($b);\n        if ($pa !== $pb) return $pa - $pb;\n        return $a - $b;\n    });\n    return $values[$k - 1];\n}`,
              ruby: `def collatz_power(x)\n  steps = 0\n  v = x\n  while v != 1\n    v = v.even? ? v / 2 : 3 * v + 1\n    steps += 1\n  end\n  steps\nend\n\ndef getKth(lo, hi, k)\n  (lo..hi).to_a.sort_by { |v| [collatz_power(v), v] }[k - 1]\nend`,
      },
    };
  })(),

  // ── Maximum Product of Word Lengths ─────────────────────────────
  (() => {
    const ref = (words: string[]) => {
      const masks: number[] = [];
      for (let i = 0; i < words.length; i++) {
        let mask = 0;
        for (let j = 0; j < words[i].length; j++) mask |= 1 << (words[i].charCodeAt(j) - 97);
        masks.push(mask);
      }
      let best = 0;
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
          if ((masks[i] & masks[j]) === 0) {
            const product = words[i].length * words[j].length;
            if (product > best) best = product;
          }
        }
      }
      return best;
    };
    return {
      slug: "maximum-product-of-word-lengths",
      title: "Maximum Product of Word Lengths",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Bit Manipulation", "Amazon", "Google", "Meta"],
      signature: { funcName: "maxProduct", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of strings `words`, return the maximum value of `length(words[i]) * length(words[j])` over pairs that share **no common letter**. If no such pair exists, return `0`.",
        [
          { in: 'words = ["abcw","baz","foo","bar","xtfn","abcdef"]', out: "16", note: '"abcw" and "xtfn" share nothing.' },
          { in: 'words = ["a","ab","abc","d","cd","bcd","abcd"]', out: "4" },
          { in: 'words = ["a","aa","aaa"]', out: "0" },
        ],
        ["1 <= words.length <= 20", "1 <= words[i].length <= 10", "words[i] consists of lowercase English letters."]),
      hints: [
        "Comparing letter sets directly is slow — encode each word as a 26-bit mask instead.",
        "Two words share a letter exactly when the AND of their masks is non-zero.",
        "Then the pairwise scan is a couple of integer operations per pair.",
      ],
      examples: [
        { input: '["abcw","baz","foo","bar","xtfn","abcdef"]', expectedOutput: "16" },
        { input: '["a","ab","abc","d","cd","bcd","abcd"]', expectedOutput: "4" },
        { input: '["a","aa","aaa"]', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.6 ? "abcdef" : LOWER;
        const words = Array.from({ length: ri(rng, 1, 20) }, () => randStr(rng, 1, 10, alphabet));
        return { input: fmtStrArr(words), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: `def maxProduct(words) -> int:\n    masks = []\n    for w in words:\n        mask = 0\n        for ch in w:\n            mask |= 1 << (ord(ch) - 97)\n        masks.append(mask)\n    best = 0\n    for i in range(len(words)):\n        for j in range(i + 1, len(words)):\n            if masks[i] & masks[j] == 0:\n                best = max(best, len(words[i]) * len(words[j]))\n    return best`,
        javascript: `var maxProduct = function(words) {\n    const masks = [];\n    for (let i = 0; i < words.length; i++) {\n        let mask = 0;\n        for (let j = 0; j < words[i].length; j++) mask |= 1 << (words[i].charCodeAt(j) - 97);\n        masks.push(mask);\n    }\n    let best = 0;\n    for (let i = 0; i < words.length; i++) {\n        for (let j = i + 1; j < words.length; j++) {\n            if ((masks[i] & masks[j]) === 0) {\n                const product = words[i].length * words[j].length;\n                if (product > best) best = product;\n            }\n        }\n    }\n    return best;\n};`,
              typescript: `function maxProduct(words: string[]): number {\n    var masks: number[] = [];\n    for (var i = 0; i < words.length; i++) {\n        var mask = 0;\n        for (var j = 0; j < words[i].length; j++) mask |= 1 << (words[i].charCodeAt(j) - 97);\n        masks.push(mask);\n    }\n    var best = 0;\n    for (var a = 0; a < words.length; a++) {\n        for (var b = a + 1; b < words.length; b++) {\n            if ((masks[a] & masks[b]) === 0) {\n                var product = words[a].length * words[b].length;\n                if (product > best) best = product;\n            }\n        }\n    }\n    return best;\n}`,
              java: `public static int maxProduct(String[] words) {\n    int[] masks = new int[words.length];\n    for (int i = 0; i < words.length; i++) {\n        int mask = 0;\n        for (int j = 0; j < words[i].length(); j++) mask |= 1 << (words[i].charAt(j) - 'a');\n        masks[i] = mask;\n    }\n    int best = 0;\n    for (int i = 0; i < words.length; i++) {\n        for (int j = i + 1; j < words.length; j++) {\n            if ((masks[i] & masks[j]) == 0) {\n                best = Math.max(best, words[i].length() * words[j].length());\n            }\n        }\n    }\n    return best;\n}`,
              cpp: `int maxProduct(vector<string>& words) {\n    vector<int> masks(words.size(), 0);\n    for (size_t i = 0; i < words.size(); i++) {\n        int mask = 0;\n        for (char c : words[i]) mask |= 1 << (c - 'a');\n        masks[i] = mask;\n    }\n    int best = 0;\n    for (size_t i = 0; i < words.size(); i++) {\n        for (size_t j = i + 1; j < words.size(); j++) {\n            if ((masks[i] & masks[j]) == 0) {\n                int product = (int) (words[i].size() * words[j].size());\n                if (product > best) best = product;\n            }\n        }\n    }\n    return best;\n}`,
              c: `int maxProduct(char** words, int wordsSize) {\n    int* masks = (int*) calloc((size_t) (wordsSize > 0 ? wordsSize : 1), sizeof(int));\n    int* lengths = (int*) calloc((size_t) (wordsSize > 0 ? wordsSize : 1), sizeof(int));\n    for (int i = 0; i < wordsSize; i++) {\n        int mask = 0;\n        int len = (int) strlen(words[i]);\n        for (int j = 0; j < len; j++) mask |= 1 << (words[i][j] - 'a');\n        masks[i] = mask;\n        lengths[i] = len;\n    }\n    int best = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        for (int j = i + 1; j < wordsSize; j++) {\n            if ((masks[i] & masks[j]) == 0) {\n                int product = lengths[i] * lengths[j];\n                if (product > best) best = product;\n            }\n        }\n    }\n    free(masks);\n    free(lengths);\n    return best;\n}`,
              csharp: `public static int MaxProduct(string[] words)\n{\n    int[] masks = new int[words.Length];\n    for (int i = 0; i < words.Length; i++)\n    {\n        int mask = 0;\n        foreach (char c in words[i]) mask |= 1 << (c - 'a');\n        masks[i] = mask;\n    }\n    int best = 0;\n    for (int i = 0; i < words.Length; i++)\n    {\n        for (int j = i + 1; j < words.Length; j++)\n        {\n            if ((masks[i] & masks[j]) == 0)\n            {\n                best = Math.Max(best, words[i].Length * words[j].Length);\n            }\n        }\n    }\n    return best;\n}`,
              go: `func maxProduct(words []string) int {\n	masks := make([]int, len(words))\n	for i, w := range words {\n		mask := 0\n		for j := 0; j < len(w); j++ {\n			mask |= 1 << uint(w[j]-'a')\n		}\n		masks[i] = mask\n	}\n	best := 0\n	for i := 0; i < len(words); i++ {\n		for j := i + 1; j < len(words); j++ {\n			if masks[i]&masks[j] == 0 {\n				product := len(words[i]) * len(words[j])\n				if product > best {\n					best = product\n				}\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxProduct(words: Array<String>): Int {\n    val masks = IntArray(words.size)\n    for (i in words.indices) {\n        var mask = 0\n        for (c in words[i]) mask = mask or (1 shl (c - 'a'))\n        masks[i] = mask\n    }\n    var best = 0\n    for (i in words.indices) {\n        for (j in i + 1 until words.size) {\n            if ((masks[i] and masks[j]) == 0) {\n                val product = words[i].length * words[j].length\n                if (product > best) best = product\n            }\n        }\n    }\n    return best\n}`,
              swift: `func maxProduct(_ words: [String]) -> Int {\n    var masks = [Int](repeating: 0, count: words.count)\n    var lengths = [Int](repeating: 0, count: words.count)\n    for i in 0..<words.count {\n        var mask = 0\n        var len = 0\n        for c in words[i].unicodeScalars {\n            mask |= 1 << (Int(c.value) - 97)\n            len += 1\n        }\n        masks[i] = mask\n        lengths[i] = len\n    }\n    var best = 0\n    for i in 0..<words.count {\n        for j in (i + 1)..<max(words.count, i + 1) where j < words.count {\n            if masks[i] & masks[j] == 0 {\n                let product = lengths[i] * lengths[j]\n                if product > best { best = product }\n            }\n        }\n    }\n    return best\n}`,
              rust: `fn maxProduct(words: Vec<String>) -> i32 {\n    let mut masks: Vec<i32> = Vec::new();\n    let mut lengths: Vec<i32> = Vec::new();\n    for w in words.iter() {\n        let mut mask = 0i32;\n        for c in w.bytes() {\n            mask |= 1 << (c - b'a');\n        }\n        masks.push(mask);\n        lengths.push(w.len() as i32);\n    }\n    let mut best = 0i32;\n    for i in 0..words.len() {\n        for j in (i + 1)..words.len() {\n            if masks[i] & masks[j] == 0 {\n                let product = lengths[i] * lengths[j];\n                if product > best {\n                    best = product;\n                }\n            }\n        }\n    }\n    best\n}`,
              php: `function maxProduct($words) {\n    $masks = array();\n    foreach ($words as $w) {\n        $mask = 0;\n        $len = strlen($w);\n        for ($j = 0; $j < $len; $j++) $mask |= 1 << (ord($w[$j]) - 97);\n        $masks[] = $mask;\n    }\n    $best = 0;\n    $n = count($words);\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = $i + 1; $j < $n; $j++) {\n            if (($masks[$i] & $masks[$j]) === 0) {\n                $product = strlen($words[$i]) * strlen($words[$j]);\n                if ($product > $best) $best = $product;\n            }\n        }\n    }\n    return $best;\n}`,
              ruby: `def maxProduct(words)\n  masks = words.map do |w|\n    mask = 0\n    w.each_byte { |b| mask |= 1 << (b - 97) }\n    mask\n  end\n  best = 0\n  (0...words.length).each do |i|\n    ((i + 1)...words.length).each do |j|\n      if masks[i] & masks[j] == 0\n        product = words[i].length * words[j].length\n        best = product if product > best\n      end\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Binary Number with Alternating Bits ─────────────────────────
  (() => {
    const ref = (n: number) => {
      let v = n;
      let prev = v % 2;
      v = Math.floor(v / 2);
      while (v > 0) {
        const cur = v % 2;
        if (cur === prev) return false;
        prev = cur;
        v = Math.floor(v / 2);
      }
      return true;
    };
    return {
      slug: "binary-number-with-alternating-bits",
      title: "Binary Number with Alternating Bits",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Amazon", "Adobe"],
      signature: { funcName: "hasAlternatingBits", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given a positive integer `n`, return `true` if its binary representation has **strictly alternating** bits — no two adjacent bits are the same.",
        [
          { in: "n = 5", out: "true", note: "101 alternates." },
          { in: "n = 7", out: "false", note: "111 does not." },
          { in: "n = 11", out: "false" },
        ],
        ["1 <= n <= 2147483647"]),
      hints: [
        "Walk the bits from the bottom, comparing each with the previous one.",
        "A slicker test: `n ^ (n >> 1)` is all 1s exactly when the bits alternate.",
        "And a value `x` is all 1s exactly when `x & (x + 1) == 0`.",
      ],
      examples: [
        { input: "5", expectedOutput: "true" },
        { input: "7", expectedOutput: "false" },
        { input: "11", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        let n: number;
        if (roll < 0.3) {
          // Build a genuine alternating pattern so "true" appears often enough.
          const bits = ri(rng, 1, 30);
          n = 0;
          for (let i = 0; i < bits; i++) n = n * 2 + (i % 2 === 0 ? 1 : 0);
        } else {
          n = ri(rng, 1, roll < 0.6 ? 255 : 2147483647);
        }
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def hasAlternatingBits(n: int) -> bool:\n    x = n ^ (n >> 1)\n    return x & (x + 1) == 0`,
        javascript: `var hasAlternatingBits = function(n) {\n    let v = n;\n    let prev = v % 2;\n    v = Math.floor(v / 2);\n    while (v > 0) {\n        const cur = v % 2;\n        if (cur === prev) return false;\n        prev = cur;\n        v = Math.floor(v / 2);\n    }\n    return true;\n};`,
              typescript: `function hasAlternatingBits(n: number): boolean {\n    var v = n;\n    var prev = v % 2;\n    v = Math.floor(v / 2);\n    while (v > 0) {\n        var cur = v % 2;\n        if (cur === prev) return false;\n        prev = cur;\n        v = Math.floor(v / 2);\n    }\n    return true;\n}`,
              java: `public static boolean hasAlternatingBits(int n) {\n    long x = (long) n ^ ((long) n >> 1);\n    return (x & (x + 1)) == 0;\n}`,
              cpp: `bool hasAlternatingBits(int n) {\n    long long x = (long long) n ^ ((long long) n >> 1);\n    return (x & (x + 1)) == 0;\n}`,
              c: `bool hasAlternatingBits(int n) {\n    long long x = (long long) n ^ ((long long) n >> 1);\n    return (x & (x + 1)) == 0;\n}`,
              csharp: `public static bool HasAlternatingBits(int n)\n{\n    long x = (long) n ^ ((long) n >> 1);\n    return (x & (x + 1)) == 0;\n}`,
              go: `func hasAlternatingBits(n int) bool {\n	x := n ^ (n >> 1)\n	return x&(x+1) == 0\n}`,
              kotlin: `fun hasAlternatingBits(n: Int): Boolean {\n    val x = n.toLong() xor (n.toLong() shr 1)\n    return (x and (x + 1)) == 0L\n}`,
              swift: `func hasAlternatingBits(_ n: Int) -> Bool {\n    let x = n ^ (n >> 1)\n    return (x & (x + 1)) == 0\n}`,
              rust: `fn hasAlternatingBits(n: i32) -> bool {\n    let v = n as i64;\n    let x = v ^ (v >> 1);\n    (x & (x + 1)) == 0\n}`,
              php: `function hasAlternatingBits($n) {\n    $x = $n ^ ($n >> 1);\n    return ($x & ($x + 1)) === 0;\n}`,
              ruby: `def hasAlternatingBits(n)\n  x = n ^ (n >> 1)\n  (x & (x + 1)) == 0\nend`,
      },
    };
  })(),

  // ── Concatenation of Consecutive Binary Numbers ─────────────────
  (() => {
    const ref = (n: number) => {
      const MOD = 1000000007;
      let answer = 0;
      let width = 0;
      for (let i = 1; i <= n; i++) {
        if ((i & (i - 1)) === 0) width++;
        answer = (answer * Math.pow(2, width) + i) % MOD;
      }
      return answer;
    };
    return {
      slug: "concatenation-of-consecutive-binary-numbers",
      title: "Concatenation of Consecutive Binary Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Bit Manipulation", "Simulation", "Amazon", "Google"],
      signature: { funcName: "concatenatedBinary", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, concatenate the binary representations of `1` through `n` into one binary string and return its decimal value **modulo `10^9 + 7`**.",
        [
          { in: "n = 1", out: "1" },
          { in: "n = 3", out: "27", note: '"1" + "10" + "11" = "11011" = 27.' },
          { in: "n = 12", out: "505379714" },
        ],
        ["1 <= n <= 300"]),
      hints: [
        "Building the string explicitly overflows fast — keep a running value modulo `10^9 + 7` instead.",
        "Appending `i` means shifting the accumulator left by the bit width of `i`, then adding `i`.",
        "The width only grows when `i` is a power of two, which `i & (i - 1) == 0` detects.",
      ],
      examples: [
        { input: "1", expectedOutput: "1" },
        { input: "3", expectedOutput: "27" },
        { input: "12", expectedOutput: "505379714" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 300);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def concatenatedBinary(n: int) -> int:\n    MOD = 1000000007\n    answer = 0\n    width = 0\n    for i in range(1, n + 1):\n        if i & (i - 1) == 0:\n            width += 1\n        answer = ((answer << width) + i) % MOD\n    return answer`,
        javascript: `var concatenatedBinary = function(n) {\n    const MOD = 1000000007;\n    let answer = 0;\n    let width = 0;\n    for (let i = 1; i <= n; i++) {\n        if ((i & (i - 1)) === 0) width++;\n        answer = (answer * Math.pow(2, width) + i) % MOD;\n    }\n    return answer;\n};`,
              typescript: `function concatenatedBinary(n: number): number {\n    var MOD = 1000000007;\n    var answer = 0;\n    var width = 0;\n    for (var i = 1; i <= n; i++) {\n        if ((i & (i - 1)) === 0) width++;\n        answer = (answer * Math.pow(2, width) + i) % MOD;\n    }\n    return answer;\n}`,
              java: `public static int concatenatedBinary(int n) {\n    final long MOD = 1000000007L;\n    long answer = 0;\n    int width = 0;\n    for (int i = 1; i <= n; i++) {\n        if ((i & (i - 1)) == 0) width++;\n        answer = ((answer << width) + i) % MOD;\n    }\n    return (int) answer;\n}`,
              cpp: `int concatenatedBinary(int n) {\n    const long long MOD = 1000000007LL;\n    long long answer = 0;\n    int width = 0;\n    for (int i = 1; i <= n; i++) {\n        if ((i & (i - 1)) == 0) width++;\n        answer = ((answer << width) + i) % MOD;\n    }\n    return (int) answer;\n}`,
              c: `int concatenatedBinary(int n) {\n    const long long MOD = 1000000007LL;\n    long long answer = 0;\n    int width = 0;\n    for (int i = 1; i <= n; i++) {\n        if ((i & (i - 1)) == 0) width++;\n        answer = ((answer << width) + i) % MOD;\n    }\n    return (int) answer;\n}`,
              csharp: `public static int ConcatenatedBinary(int n)\n{\n    const long MOD = 1000000007L;\n    long answer = 0;\n    int width = 0;\n    for (int i = 1; i <= n; i++)\n    {\n        if ((i & (i - 1)) == 0) width++;\n        answer = ((answer << width) + i) % MOD;\n    }\n    return (int) answer;\n}`,
              go: `func concatenatedBinary(n int) int {\n	const MOD = 1000000007\n	answer := 0\n	width := uint(0)\n	for i := 1; i <= n; i++ {\n		if i&(i-1) == 0 {\n			width++\n		}\n		answer = ((answer << width) + i) % MOD\n	}\n	return answer\n}`,
              kotlin: `fun concatenatedBinary(n: Int): Int {\n    val MOD = 1000000007L\n    var answer = 0L\n    var width = 0\n    for (i in 1..n) {\n        if (i and (i - 1) == 0) width++\n        answer = ((answer shl width) + i) % MOD\n    }\n    return answer.toInt()\n}`,
              swift: `func concatenatedBinary(_ n: Int) -> Int {\n    let MOD = 1000000007\n    var answer = 0\n    var width = 0\n    for i in 1...max(n, 1) where i <= n {\n        if i & (i - 1) == 0 { width += 1 }\n        answer = ((answer << width) + i) % MOD\n    }\n    return answer\n}`,
              rust: `fn concatenatedBinary(n: i32) -> i32 {\n    let md: i64 = 1000000007;\n    let mut answer: i64 = 0;\n    let mut width = 0;\n    for i in 1..=n {\n        if i & (i - 1) == 0 {\n            width += 1;\n        }\n        answer = ((answer << width) + i as i64) % md;\n    }\n    answer as i32\n}`,
              php: `function concatenatedBinary($n) {\n    $MOD = 1000000007;\n    $answer = 0;\n    $width = 0;\n    for ($i = 1; $i <= $n; $i++) {\n        if (($i & ($i - 1)) === 0) $width++;\n        $answer = (($answer << $width) + $i) % $MOD;\n    }\n    return $answer;\n}`,
              ruby: `def concatenatedBinary(n)\n  mod = 1000000007\n  answer = 0\n  width = 0\n  (1..n).each do |i|\n    width += 1 if i & (i - 1) == 0\n    answer = ((answer << width) + i) % mod\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Divide Two Integers ─────────────────────────────────────────
  (() => {
    const ref = (dividend: number, divisor: number) => {
      if (dividend === -2147483648 && divisor === -1) return 2147483647;
      const negative = (dividend < 0) !== (divisor < 0);
      let a = Math.abs(dividend);
      const b = Math.abs(divisor);
      let quotient = 0;
      for (let shift = 31; shift >= 0; shift--) {
        const scaled = b * Math.pow(2, shift);
        if (scaled <= a) {
          a -= scaled;
          quotient += Math.pow(2, shift);
        }
      }
      return negative ? -quotient : quotient;
    };
    return {
      slug: "divide-two-integers",
      title: "Divide Two Integers",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Bit Manipulation", "Amazon", "Microsoft", "Meta", "Apple"],
      signature: { funcName: "divide", params: [{ name: "dividend", type: "int" as const }, { name: "divisor", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Divide two integers **without using multiplication, division or the modulo operator**, and return the quotient truncated toward zero.\n\nIf the result overflows a signed 32-bit integer, return `2147483647`.",
        [
          { in: "dividend = 10, divisor = 3", out: "3" },
          { in: "dividend = 7, divisor = -3", out: "-2" },
          { in: "dividend = -2147483648, divisor = -1", out: "2147483647", note: "The true answer overflows." },
        ],
        ["-2147483648 <= dividend, divisor <= 2147483647", "divisor != 0"]),
      hints: [
        "Work with magnitudes and re-apply the sign at the end.",
        "Subtracting the divisor one at a time is far too slow — subtract `divisor << shift` instead, largest shift first.",
        "Only one input overflows: `-2^31 / -1`. Handle it up front, and use 64-bit intermediates so the shifts do not wrap.",
      ],
      examples: [
        { input: "10\n3", expectedOutput: "3" },
        { input: "7\n-3", expectedOutput: "-2" },
        { input: "-2147483648\n-1", expectedOutput: "2147483647" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        let dividend: number;
        let divisor: number;
        if (roll < 0.15) {
          dividend = -2147483648;
          divisor = rng() < 0.5 ? -1 : ri(rng, -100, -1);
        } else if (roll < 0.5) {
          dividend = ri(rng, -1000, 1000);
          divisor = ri(rng, 1, 50) * (rng() < 0.5 ? -1 : 1);
        } else {
          dividend = ri(rng, -2147483648, 2147483647);
          divisor = ri(rng, 1, 2147483647) * (rng() < 0.5 ? -1 : 1);
        }
        return { input: `${dividend}\n${divisor}`, expectedOutput: String(ref(dividend, divisor)) };
      },
      solutions: {
        python: `def divide(dividend: int, divisor: int) -> int:\n    if dividend == -2147483648 and divisor == -1:\n        return 2147483647\n    negative = (dividend < 0) != (divisor < 0)\n    a, b = abs(dividend), abs(divisor)\n    quotient = 0\n    for shift in range(31, -1, -1):\n        if (b << shift) <= a:\n            a -= b << shift\n            quotient += 1 << shift\n    return -quotient if negative else quotient`,
        javascript: `var divide = function(dividend, divisor) {\n    if (dividend === -2147483648 && divisor === -1) return 2147483647;\n    const negative = (dividend < 0) !== (divisor < 0);\n    let a = Math.abs(dividend);\n    const b = Math.abs(divisor);\n    let quotient = 0;\n    for (let shift = 31; shift >= 0; shift--) {\n        const scaled = b * Math.pow(2, shift);\n        if (scaled <= a) {\n            a -= scaled;\n            quotient += Math.pow(2, shift);\n        }\n    }\n    return negative ? -quotient : quotient;\n};`,
              typescript: `function divide(dividend: number, divisor: number): number {\n    if (dividend === -2147483648 && divisor === -1) return 2147483647;\n    var negative = (dividend < 0) !== (divisor < 0);\n    var a = Math.abs(dividend);\n    var b = Math.abs(divisor);\n    var quotient = 0;\n    for (var shift = 31; shift >= 0; shift--) {\n        var scaled = b * Math.pow(2, shift);\n        if (scaled <= a) {\n            a -= scaled;\n            quotient += Math.pow(2, shift);\n        }\n    }\n    return negative ? -quotient : quotient;\n}`,
              java: `public static int divide(int dividend, int divisor) {\n    if (dividend == -2147483648 && divisor == -1) return 2147483647;\n    boolean negative = (dividend < 0) != (divisor < 0);\n    long a = Math.abs((long) dividend);\n    long b = Math.abs((long) divisor);\n    long quotient = 0;\n    for (int shift = 31; shift >= 0; shift--) {\n        if ((b << shift) <= a) {\n            a -= b << shift;\n            quotient += 1L << shift;\n        }\n    }\n    return (int) (negative ? -quotient : quotient);\n}`,
              cpp: `int divide(int dividend, int divisor) {\n    if (dividend == -2147483648 && divisor == -1) return 2147483647;\n    bool negative = (dividend < 0) != (divisor < 0);\n    long long a = dividend < 0 ? -(long long) dividend : (long long) dividend;\n    long long b = divisor < 0 ? -(long long) divisor : (long long) divisor;\n    long long quotient = 0;\n    for (int shift = 31; shift >= 0; shift--) {\n        if ((b << shift) <= a) {\n            a -= b << shift;\n            quotient += 1LL << shift;\n        }\n    }\n    return (int) (negative ? -quotient : quotient);\n}`,
              c: `int divide(int dividend, int divisor) {\n    if (dividend == -2147483648 && divisor == -1) return 2147483647;\n    int negative = (dividend < 0) != (divisor < 0);\n    long long a = dividend < 0 ? -(long long) dividend : (long long) dividend;\n    long long b = divisor < 0 ? -(long long) divisor : (long long) divisor;\n    long long quotient = 0;\n    for (int shift = 31; shift >= 0; shift--) {\n        if ((b << shift) <= a) {\n            a -= b << shift;\n            quotient += 1LL << shift;\n        }\n    }\n    return (int) (negative ? -quotient : quotient);\n}`,
              csharp: `public static int Divide(int dividend, int divisor)\n{\n    if (dividend == -2147483648 && divisor == -1) return 2147483647;\n    bool negative = (dividend < 0) != (divisor < 0);\n    long a = Math.Abs((long) dividend);\n    long b = Math.Abs((long) divisor);\n    long quotient = 0;\n    for (int shift = 31; shift >= 0; shift--)\n    {\n        if ((b << shift) <= a)\n        {\n            a -= b << shift;\n            quotient += 1L << shift;\n        }\n    }\n    return (int) (negative ? -quotient : quotient);\n}`,
              go: `func divide(dividend int, divisor int) int {\n	if dividend == -2147483648 && divisor == -1 {\n		return 2147483647\n	}\n	negative := (dividend < 0) != (divisor < 0)\n	a := dividend\n	if a < 0 {\n		a = -a\n	}\n	b := divisor\n	if b < 0 {\n		b = -b\n	}\n	quotient := 0\n	for shift := 31; shift >= 0; shift-- {\n		if (b << uint(shift)) <= a {\n			a -= b << uint(shift)\n			quotient += 1 << uint(shift)\n		}\n	}\n	if negative {\n		return -quotient\n	}\n	return quotient\n}`,
              kotlin: `fun divide(dividend: Int, divisor: Int): Int {\n    if (dividend == -2147483648 && divisor == -1) return 2147483647\n    val negative = (dividend < 0) != (divisor < 0)\n    var a = Math.abs(dividend.toLong())\n    val b = Math.abs(divisor.toLong())\n    var quotient = 0L\n    for (shift in 31 downTo 0) {\n        if ((b shl shift) <= a) {\n            a -= b shl shift\n            quotient += 1L shl shift\n        }\n    }\n    return (if (negative) -quotient else quotient).toInt()\n}`,
              swift: `func divide(_ dividend: Int, _ divisor: Int) -> Int {\n    if dividend == -2147483648 && divisor == -1 { return 2147483647 }\n    let negative = (dividend < 0) != (divisor < 0)\n    var a = abs(dividend)\n    let b = abs(divisor)\n    var quotient = 0\n    var shift = 31\n    while shift >= 0 {\n        if (b << shift) <= a {\n            a -= b << shift\n            quotient += 1 << shift\n        }\n        shift -= 1\n    }\n    return negative ? -quotient : quotient\n}`,
              rust: `fn divide(dividend: i32, divisor: i32) -> i32 {\n    if dividend == -2147483648 && divisor == -1 {\n        return 2147483647;\n    }\n    let negative = (dividend < 0) != (divisor < 0);\n    let mut a = (dividend as i64).abs();\n    let b = (divisor as i64).abs();\n    let mut quotient: i64 = 0;\n    for shift in (0..32).rev() {\n        if (b << shift) <= a {\n            a -= b << shift;\n            quotient += 1i64 << shift;\n        }\n    }\n    (if negative { -quotient } else { quotient }) as i32\n}`,
              php: `function divide($dividend, $divisor) {\n    if ($dividend === -2147483648 && $divisor === -1) return 2147483647;\n    $negative = ($dividend < 0) !== ($divisor < 0);\n    $a = abs($dividend);\n    $b = abs($divisor);\n    $quotient = 0;\n    for ($shift = 31; $shift >= 0; $shift--) {\n        if (($b << $shift) <= $a) {\n            $a -= $b << $shift;\n            $quotient += 1 << $shift;\n        }\n    }\n    return $negative ? -$quotient : $quotient;\n}`,
              ruby: `def divide(dividend, divisor)\n  return 2147483647 if dividend == -2147483648 && divisor == -1\n  negative = (dividend < 0) != (divisor < 0)\n  a = dividend.abs\n  b = divisor.abs\n  quotient = 0\n  31.downto(0) do |shift|\n    if (b << shift) <= a\n      a -= b << shift\n      quotient += 1 << shift\n    end\n  end\n  negative ? -quotient : quotient\nend`,
      },
    };
  })(),

  // ── Minimum Bit Flips to Convert Number ─────────────────────────
  (() => {
    const ref = (start: number, goal: number) => popcount((start ^ goal) >>> 0);
    return {
      slug: "minimum-bit-flips-to-convert-number",
      title: "Minimum Bit Flips to Convert Number",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Amazon", "Adobe"],
      signature: { funcName: "minBitFlips", params: [{ name: "start", type: "int" as const }, { name: "goal", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A **bit flip** changes a single bit of a number's binary representation from `0` to `1` or from `1` to `0`.\n\nGiven two non-negative integers `start` and `goal`, return the minimum number of bit flips that turn `start` into `goal`.",
        [
          { in: "start = 10, goal = 7", out: "3" },
          { in: "start = 3, goal = 4", out: "3" },
          { in: "start = 8, goal = 8", out: "0" },
        ],
        ["0 <= start, goal <= 1000000000"]),
      hints: [
        "Each differing bit needs exactly one flip, and identical bits need none.",
        "`start ^ goal` marks precisely the differing positions.",
        "So the answer is the popcount of that XOR.",
      ],
      examples: [
        { input: "10\n7", expectedOutput: "3" },
        { input: "3\n4", expectedOutput: "3" },
        { input: "8\n8", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 64 : 1000000000;
        const start = ri(rng, 0, hi);
        const goal = rng() < 0.15 ? start : ri(rng, 0, hi);
        return { input: `${start}\n${goal}`, expectedOutput: String(ref(start, goal)) };
      },
      solutions: {
        python: `def minBitFlips(start: int, goal: int) -> int:\n    return bin(start ^ goal).count("1")`,
        javascript: `var minBitFlips = function(start, goal) {\n    let v = (start ^ goal) >>> 0;\n    let count = 0;\n    while (v > 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n};`,
              typescript: `function minBitFlips(start: number, goal: number): number {\n    var v = (start ^ goal) >>> 0;\n    var count = 0;\n    while (v > 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              java: `public static int minBitFlips(int start, int goal) {\n    int v = start ^ goal;\n    int count = 0;\n    while (v != 0) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              cpp: `int minBitFlips(int start, int goal) {\n    unsigned int v = (unsigned int) (start ^ goal);\n    int count = 0;\n    while (v) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              c: `int minBitFlips(int start, int goal) {\n    unsigned int v = (unsigned int) (start ^ goal);\n    int count = 0;\n    while (v) {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              csharp: `public static int MinBitFlips(int start, int goal)\n{\n    uint v = (uint) (start ^ goal);\n    int count = 0;\n    while (v != 0)\n    {\n        v &= v - 1;\n        count++;\n    }\n    return count;\n}`,
              go: `func minBitFlips(start int, goal int) int {\n	v := start ^ goal\n	count := 0\n	for v != 0 {\n		v &= v - 1\n		count++\n	}\n	return count\n}`,
              kotlin: `fun minBitFlips(start: Int, goal: Int): Int {\n    var v = start xor goal\n    var count = 0\n    while (v != 0) {\n        v = v and (v - 1)\n        count++\n    }\n    return count\n}`,
              swift: `func minBitFlips(_ start: Int, _ goal: Int) -> Int {\n    var v = start ^ goal\n    var count = 0\n    while v != 0 {\n        v &= v - 1\n        count += 1\n    }\n    return count\n}`,
              rust: `fn minBitFlips(start: i32, goal: i32) -> i32 {\n    let mut v = (start ^ goal) as u32;\n    let mut count = 0;\n    while v != 0 {\n        v &= v - 1;\n        count += 1;\n    }\n    count\n}`,
              php: `function minBitFlips($start, $goal) {\n    $v = $start ^ $goal;\n    $count = 0;\n    while ($v != 0) {\n        $v &= $v - 1;\n        $count++;\n    }\n    return $count;\n}`,
              ruby: `def minBitFlips(start, goal)\n  v = start ^ goal\n  count = 0\n  while v != 0\n    v &= v - 1\n    count += 1\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Find the Difference ─────────────────────────────────────────
  (() => {
    const ref = (s: string, t: string) => {
      let code = 0;
      for (let i = 0; i < s.length; i++) code ^= s.charCodeAt(i);
      for (let i = 0; i < t.length; i++) code ^= t.charCodeAt(i);
      return String.fromCharCode(code);
    };
    return {
      slug: "find-the-difference",
      title: "Find the Difference",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Bit Manipulation", "Sorting", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "findTheDifference", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "string" as const },
      description: describe(
        "String `t` is generated by shuffling string `s` and then inserting one extra letter at a random position.\n\nReturn that added letter.",
        [
          { in: 's = "abcd", t = "abcde"', out: "e" },
          { in: 's = "", t = "y"', out: "y" },
          { in: 's = "a", t = "aa"', out: "a" },
        ],
        ["0 <= s.length <= 39", "t.length == s.length + 1", "Both consist of lowercase English letters."]),
      hints: [
        "Counting letters in both strings and finding the surplus works and is easy to read.",
        "Slicker: XOR the character codes of every letter in both strings.",
        "Each shared letter cancels itself out, leaving only the inserted one.",
      ],
      examples: [
        { input: '"abcd"\n"abcde"', expectedOutput: "e" },
        { input: '""\n"y"', expectedOutput: "y" },
        { input: '"a"\n"aa"', expectedOutput: "a" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.6 ? "abcde" : LOWER;
        const s = randStr(rng, 0, 39, alphabet);
        const extra = alphabet[ri(rng, 0, alphabet.length - 1)];
        const chars = shuffle(rng, s.split(""));
        const at = ri(rng, 0, chars.length);
        chars.splice(at, 0, extra);
        const t = chars.join("");
        return { input: `"${s}"\n"${t}"`, expectedOutput: ref(s, t) };
      },
      solutions: {
        python: `def findTheDifference(s: str, t: str) -> str:\n    code = 0\n    for ch in s:\n        code ^= ord(ch)\n    for ch in t:\n        code ^= ord(ch)\n    return chr(code)`,
        javascript: `var findTheDifference = function(s, t) {\n    let code = 0;\n    for (let i = 0; i < s.length; i++) code ^= s.charCodeAt(i);\n    for (let i = 0; i < t.length; i++) code ^= t.charCodeAt(i);\n    return String.fromCharCode(code);\n};`,
              typescript: `function findTheDifference(s: string, t: string): string {\n    var code = 0;\n    for (var i = 0; i < s.length; i++) code ^= s.charCodeAt(i);\n    for (var j = 0; j < t.length; j++) code ^= t.charCodeAt(j);\n    return String.fromCharCode(code);\n}`,
              java: `public static String findTheDifference(String s, String t) {\n    int code = 0;\n    for (int i = 0; i < s.length(); i++) code ^= s.charAt(i);\n    for (int i = 0; i < t.length(); i++) code ^= t.charAt(i);\n    return String.valueOf((char) code);\n}`,
              cpp: `string findTheDifference(string s, string t) {\n    int code = 0;\n    for (char c : s) code ^= c;\n    for (char c : t) code ^= c;\n    return string(1, (char) code);\n}`,
              c: `char* findTheDifference(const char* s, const char* t) {\n    int code = 0;\n    for (int i = 0; s[i] != '\\0'; i++) code ^= s[i];\n    for (int i = 0; t[i] != '\\0'; i++) code ^= t[i];\n    char* out = (char*) malloc(2);\n    out[0] = (char) code;\n    out[1] = '\\0';\n    return out;\n}`,
              csharp: `public static string FindTheDifference(string s, string t)\n{\n    int code = 0;\n    foreach (char c in s) code ^= c;\n    foreach (char c in t) code ^= c;\n    return ((char) code).ToString();\n}`,
              go: `func findTheDifference(s string, t string) string {\n	code := 0\n	for i := 0; i < len(s); i++ {\n		code ^= int(s[i])\n	}\n	for i := 0; i < len(t); i++ {\n		code ^= int(t[i])\n	}\n	return string(rune(code))\n}`,
              kotlin: `fun findTheDifference(s: String, t: String): String {\n    var code = 0\n    for (c in s) code = code xor c.toInt()\n    for (c in t) code = code xor c.toInt()\n    return code.toChar().toString()\n}`,
              swift: `func findTheDifference(_ s: String, _ t: String) -> String {\n    var code: UInt32 = 0\n    for c in s.unicodeScalars { code ^= c.value }\n    for c in t.unicodeScalars { code ^= c.value }\n    return String(UnicodeScalar(code)!)\n}`,
              rust: `fn findTheDifference(s: String, t: String) -> String {\n    let mut code: u8 = 0;\n    for c in s.bytes() {\n        code ^= c;\n    }\n    for c in t.bytes() {\n        code ^= c;\n    }\n    (code as char).to_string()\n}`,
              php: `function findTheDifference($s, $t) {\n    $code = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) $code ^= ord($s[$i]);\n    $m = strlen($t);\n    for ($i = 0; $i < $m; $i++) $code ^= ord($t[$i]);\n    return chr($code);\n}`,
              ruby: `def findTheDifference(s, t)\n  code = 0\n  s.each_byte { |b| code ^= b }\n  t.each_byte { |b| code ^= b }\n  code.chr\nend`,
      },
    };
  })(),

  // ── Count the Number of Consistent Strings ──────────────────────
  (() => {
    const ref = (allowed: string, words: string[]) => {
      let mask = 0;
      for (let i = 0; i < allowed.length; i++) mask |= 1 << (allowed.charCodeAt(i) - 97);
      let count = 0;
      for (let i = 0; i < words.length; i++) {
        let wordMask = 0;
        for (let j = 0; j < words[i].length; j++) wordMask |= 1 << (words[i].charCodeAt(j) - 97);
        if ((wordMask & ~mask) === 0) count++;
      }
      return count;
    };
    return {
      slug: "count-the-number-of-consistent-strings",
      title: "Count the Number of Consistent Strings",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "String", "Bit Manipulation", "Counting", "Amazon", "Adobe"],
      signature: { funcName: "countConsistentStrings", params: [{ name: "allowed", type: "string" as const }, { name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `allowed` of **distinct** characters and an array of strings `words`. A string is **consistent** if every one of its characters appears in `allowed`.\n\nReturn the number of consistent strings in `words`.",
        [
          { in: 'allowed = "ab", words = ["ad","bd","aaab","baa","badab"]', out: "2", note: '"aaab" and "baa" use only a and b.' },
          { in: 'allowed = "abc", words = ["a","b","c","ab","ac","bc","abc"]', out: "7" },
          { in: 'allowed = "cad", words = ["cc","acd","b","ba","bac","bad","ac","d"]', out: "4" },
        ],
        ["1 <= words.length <= 20", "1 <= allowed.length <= 26", "1 <= words[i].length <= 10", "All characters of allowed are distinct lowercase letters."]),
      hints: [
        "Turn `allowed` into a 26-bit mask once.",
        "Turn each word into its own mask and check that it introduces no bit outside the allowed mask.",
        "`wordMask & ~allowedMask == 0` is exactly that test.",
      ],
      examples: [
        { input: '"ab"\n["ad","bd","aaab","baa","badab"]', expectedOutput: "2" },
        { input: '"abc"\n["a","b","c","ab","ac","bc","abc"]', expectedOutput: "7" },
        { input: '"cad"\n["cc","acd","b","ba","bac","bad","ac","d"]', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const pool = "abcdef";
        const size = ri(rng, 1, pool.length);
        const allowed = shuffle(rng, pool.split("")).slice(0, size).join("");
        const words = Array.from({ length: ri(rng, 1, 20) }, () => randStr(rng, 1, 10, pool));
        return { input: `"${allowed}"\n${fmtStrArr(words)}`, expectedOutput: String(ref(allowed, words)) };
      },
      solutions: {
        python: `def countConsistentStrings(allowed: str, words) -> int:\n    mask = 0\n    for ch in allowed:\n        mask |= 1 << (ord(ch) - 97)\n    count = 0\n    for w in words:\n        word_mask = 0\n        for ch in w:\n            word_mask |= 1 << (ord(ch) - 97)\n        if word_mask & ~mask == 0:\n            count += 1\n    return count`,
        javascript: `var countConsistentStrings = function(allowed, words) {\n    let mask = 0;\n    for (let i = 0; i < allowed.length; i++) mask |= 1 << (allowed.charCodeAt(i) - 97);\n    let count = 0;\n    for (let i = 0; i < words.length; i++) {\n        let wordMask = 0;\n        for (let j = 0; j < words[i].length; j++) wordMask |= 1 << (words[i].charCodeAt(j) - 97);\n        if ((wordMask & ~mask) === 0) count++;\n    }\n    return count;\n};`,
              typescript: `function countConsistentStrings(allowed: string, words: string[]): number {\n    var mask = 0;\n    for (var i = 0; i < allowed.length; i++) mask |= 1 << (allowed.charCodeAt(i) - 97);\n    var count = 0;\n    for (var j = 0; j < words.length; j++) {\n        var wordMask = 0;\n        for (var m = 0; m < words[j].length; m++) wordMask |= 1 << (words[j].charCodeAt(m) - 97);\n        if ((wordMask & ~mask) === 0) count++;\n    }\n    return count;\n}`,
              java: `public static int countConsistentStrings(String allowed, String[] words) {\n    int mask = 0;\n    for (int i = 0; i < allowed.length(); i++) mask |= 1 << (allowed.charAt(i) - 'a');\n    int count = 0;\n    for (String w : words) {\n        int wordMask = 0;\n        for (int i = 0; i < w.length(); i++) wordMask |= 1 << (w.charAt(i) - 'a');\n        if ((wordMask & ~mask) == 0) count++;\n    }\n    return count;\n}`,
              cpp: `int countConsistentStrings(string allowed, vector<string>& words) {\n    int mask = 0;\n    for (char c : allowed) mask |= 1 << (c - 'a');\n    int count = 0;\n    for (const string& w : words) {\n        int wordMask = 0;\n        for (char c : w) wordMask |= 1 << (c - 'a');\n        if ((wordMask & ~mask) == 0) count++;\n    }\n    return count;\n}`,
              c: `int countConsistentStrings(const char* allowed, char** words, int wordsSize) {\n    int mask = 0;\n    for (int i = 0; allowed[i] != '\\0'; i++) mask |= 1 << (allowed[i] - 'a');\n    int count = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        int wordMask = 0;\n        for (int j = 0; words[i][j] != '\\0'; j++) wordMask |= 1 << (words[i][j] - 'a');\n        if ((wordMask & ~mask) == 0) count++;\n    }\n    return count;\n}`,
              csharp: `public static int CountConsistentStrings(string allowed, string[] words)\n{\n    int mask = 0;\n    foreach (char c in allowed) mask |= 1 << (c - 'a');\n    int count = 0;\n    foreach (string w in words)\n    {\n        int wordMask = 0;\n        foreach (char c in w) wordMask |= 1 << (c - 'a');\n        if ((wordMask & ~mask) == 0) count++;\n    }\n    return count;\n}`,
              go: `func countConsistentStrings(allowed string, words []string) int {\n	mask := 0\n	for i := 0; i < len(allowed); i++ {\n		mask |= 1 << uint(allowed[i]-'a')\n	}\n	count := 0\n	for _, w := range words {\n		wordMask := 0\n		for i := 0; i < len(w); i++ {\n			wordMask |= 1 << uint(w[i]-'a')\n		}\n		if wordMask&^mask == 0 {\n			count++\n		}\n	}\n	return count\n}`,
              kotlin: `fun countConsistentStrings(allowed: String, words: Array<String>): Int {\n    var mask = 0\n    for (c in allowed) mask = mask or (1 shl (c - 'a'))\n    var count = 0\n    for (w in words) {\n        var wordMask = 0\n        for (c in w) wordMask = wordMask or (1 shl (c - 'a'))\n        if ((wordMask and mask.inv()) == 0) count++\n    }\n    return count\n}`,
              swift: `func countConsistentStrings(_ allowed: String, _ words: [String]) -> Int {\n    var mask = 0\n    for c in allowed.unicodeScalars { mask |= 1 << (Int(c.value) - 97) }\n    var count = 0\n    for w in words {\n        var wordMask = 0\n        for c in w.unicodeScalars { wordMask |= 1 << (Int(c.value) - 97) }\n        if wordMask & ~mask == 0 { count += 1 }\n    }\n    return count\n}`,
              rust: `fn countConsistentStrings(allowed: String, words: Vec<String>) -> i32 {\n    let mut mask = 0i32;\n    for c in allowed.bytes() {\n        mask |= 1 << (c - b'a');\n    }\n    let mut count = 0;\n    for w in words.iter() {\n        let mut word_mask = 0i32;\n        for c in w.bytes() {\n            word_mask |= 1 << (c - b'a');\n        }\n        if word_mask & !mask == 0 {\n            count += 1;\n        }\n    }\n    count\n}`,
              php: `function countConsistentStrings($allowed, $words) {\n    $mask = 0;\n    $n = strlen($allowed);\n    for ($i = 0; $i < $n; $i++) $mask |= 1 << (ord($allowed[$i]) - 97);\n    $count = 0;\n    foreach ($words as $w) {\n        $wordMask = 0;\n        $m = strlen($w);\n        for ($i = 0; $i < $m; $i++) $wordMask |= 1 << (ord($w[$i]) - 97);\n        if (($wordMask & ~$mask) === 0) $count++;\n    }\n    return $count;\n}`,
              ruby: `def countConsistentStrings(allowed, words)\n  mask = 0\n  allowed.each_byte { |b| mask |= 1 << (b - 97) }\n  count = 0\n  words.each do |w|\n    word_mask = 0\n    w.each_byte { |b| word_mask |= 1 << (b - 97) }\n    count += 1 if word_mask & ~mask == 0\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Count Triplets That Can Form Two Arrays of Equal XOR ────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      const prefix: number[] = [0];
      for (let i = 0; i < n; i++) prefix.push(prefix[i] ^ arr[i]);
      let count = 0;
      for (let i = 0; i < n; i++) {
        for (let k = i + 1; k < n; k++) {
          if (prefix[i] === prefix[k + 1]) count += k - i;
        }
      }
      return count;
    };
    return {
      slug: "count-triplets-that-can-form-two-arrays-of-equal-xor",
      title: "Count Triplets That Can Form Two Arrays of Equal XOR",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Bit Manipulation", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "countTriplets", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `arr`, count the triples `(i, j, k)` with `0 <= i < j <= k < arr.length` such that\n\n- `a = arr[i] XOR arr[i+1] XOR … XOR arr[j-1]`\n- `b = arr[j] XOR arr[j+1] XOR … XOR arr[k]`\n\nand `a == b`.",
        [
          { in: "arr = [2,3,1,6,7]", out: "4" },
          { in: "arr = [1,1,1,1,1]", out: "10" },
          { in: "arr = [5]", out: "0" },
        ],
        ["1 <= arr.length <= 40", "1 <= arr[i] <= 100000000"]),
      hints: [
        "`a == b` is the same as `a XOR b == 0`, which is the XOR of the whole span from `i` to `k`.",
        "With prefix XORs, that condition becomes `prefix[i] == prefix[k + 1]` — and `j` drops out entirely.",
        "For each such `(i, k)` pair, any `j` in `(i, k]` works, so it contributes `k - i` triples.",
      ],
      examples: [
        { input: "[2,3,1,6,7]", expectedOutput: "4" },
        { input: "[1,1,1,1,1]", expectedOutput: "10" },
        { input: "[5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const arr = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.6 ? 8 : 100000000);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `def countTriplets(arr) -> int:\n    n = len(arr)\n    prefix = [0] * (n + 1)\n    for i in range(n):\n        prefix[i + 1] = prefix[i] ^ arr[i]\n    count = 0\n    for i in range(n):\n        for k in range(i + 1, n):\n            if prefix[i] == prefix[k + 1]:\n                count += k - i\n    return count`,
        javascript: `var countTriplets = function(arr) {\n    const n = arr.length;\n    const prefix = [0];\n    for (let i = 0; i < n; i++) prefix.push(prefix[i] ^ arr[i]);\n    let count = 0;\n    for (let i = 0; i < n; i++) {\n        for (let k = i + 1; k < n; k++) {\n            if (prefix[i] === prefix[k + 1]) count += k - i;\n        }\n    }\n    return count;\n};`,
              typescript: `function countTriplets(arr: number[]): number {\n    var n = arr.length;\n    var prefix: number[] = [0];\n    for (var i = 0; i < n; i++) prefix.push(prefix[i] ^ arr[i]);\n    var count = 0;\n    for (var a = 0; a < n; a++) {\n        for (var k = a + 1; k < n; k++) {\n            if (prefix[a] === prefix[k + 1]) count += k - a;\n        }\n    }\n    return count;\n}`,
              java: `public static int countTriplets(int[] arr) {\n    int n = arr.length;\n    int[] prefix = new int[n + 1];\n    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] ^ arr[i];\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int k = i + 1; k < n; k++) {\n            if (prefix[i] == prefix[k + 1]) count += k - i;\n        }\n    }\n    return count;\n}`,
              cpp: `int countTriplets(vector<int>& arr) {\n    int n = (int) arr.size();\n    vector<int> prefix(n + 1, 0);\n    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] ^ arr[i];\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int k = i + 1; k < n; k++) {\n            if (prefix[i] == prefix[k + 1]) count += k - i;\n        }\n    }\n    return count;\n}`,
              c: `int countTriplets(int* arr, int arrSize) {\n    int n = arrSize;\n    int* prefix = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] ^ arr[i];\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int k = i + 1; k < n; k++) {\n            if (prefix[i] == prefix[k + 1]) count += k - i;\n        }\n    }\n    free(prefix);\n    return count;\n}`,
              csharp: `public static int CountTriplets(int[] arr)\n{\n    int n = arr.Length;\n    int[] prefix = new int[n + 1];\n    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] ^ arr[i];\n    int count = 0;\n    for (int i = 0; i < n; i++)\n    {\n        for (int k = i + 1; k < n; k++)\n        {\n            if (prefix[i] == prefix[k + 1]) count += k - i;\n        }\n    }\n    return count;\n}`,
              go: `func countTriplets(arr []int) int {\n	n := len(arr)\n	prefix := make([]int, n+1)\n	for i := 0; i < n; i++ {\n		prefix[i+1] = prefix[i] ^ arr[i]\n	}\n	count := 0\n	for i := 0; i < n; i++ {\n		for k := i + 1; k < n; k++ {\n			if prefix[i] == prefix[k+1] {\n				count += k - i\n			}\n		}\n	}\n	return count\n}`,
              kotlin: `fun countTriplets(arr: IntArray): Int {\n    val n = arr.size\n    val prefix = IntArray(n + 1)\n    for (i in 0 until n) prefix[i + 1] = prefix[i] xor arr[i]\n    var count = 0\n    for (i in 0 until n) {\n        for (k in i + 1 until n) {\n            if (prefix[i] == prefix[k + 1]) count += k - i\n        }\n    }\n    return count\n}`,
              swift: `func countTriplets(_ arr: [Int]) -> Int {\n    let n = arr.count\n    var prefix = [Int](repeating: 0, count: n + 1)\n    for i in 0..<n { prefix[i + 1] = prefix[i] ^ arr[i] }\n    var count = 0\n    for i in 0..<n {\n        var k = i + 1\n        while k < n {\n            if prefix[i] == prefix[k + 1] { count += k - i }\n            k += 1\n        }\n    }\n    return count\n}`,
              rust: `fn countTriplets(arr: Vec<i32>) -> i32 {\n    let n = arr.len();\n    let mut prefix = vec![0i32; n + 1];\n    for i in 0..n {\n        prefix[i + 1] = prefix[i] ^ arr[i];\n    }\n    let mut count = 0i32;\n    for i in 0..n {\n        for k in (i + 1)..n {\n            if prefix[i] == prefix[k + 1] {\n                count += (k - i) as i32;\n            }\n        }\n    }\n    count\n}`,
              php: `function countTriplets($arr) {\n    $n = count($arr);\n    $prefix = array_fill(0, $n + 1, 0);\n    for ($i = 0; $i < $n; $i++) $prefix[$i + 1] = $prefix[$i] ^ $arr[$i];\n    $count = 0;\n    for ($i = 0; $i < $n; $i++) {\n        for ($k = $i + 1; $k < $n; $k++) {\n            if ($prefix[$i] === $prefix[$k + 1]) $count += $k - $i;\n        }\n    }\n    return $count;\n}`,
              ruby: `def countTriplets(arr)\n  n = arr.length\n  prefix = Array.new(n + 1, 0)\n  (0...n).each { |i| prefix[i + 1] = prefix[i] ^ arr[i] }\n  count = 0\n  (0...n).each do |i|\n    ((i + 1)...n).each do |k|\n      count += k - i if prefix[i] == prefix[k + 1]\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Bulb Switcher ───────────────────────────────────────────────
  (() => {
    const ref = (n: number) => Math.floor(Math.sqrt(n));
    return {
      slug: "bulb-switcher",
      title: "Bulb Switcher",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Brainteaser", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "bulbSwitch", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "There are `n` bulbs, all off. You do `n` rounds:\n\n- round 1 toggles every bulb;\n- round 2 toggles every 2nd bulb;\n- round `i` toggles every `i`-th bulb;\n- round `n` toggles only the last bulb.\n\nReturn how many bulbs are on after `n` rounds.",
        [
          { in: "n = 3", out: "1", note: "Only bulb 1 stays on." },
          { in: "n = 0", out: "0" },
          { in: "n = 1", out: "1" },
        ],
        ["0 <= n <= 1000000000"]),
      hints: [
        "Bulb `k` is toggled once per divisor of `k`, so it ends up on exactly when `k` has an odd number of divisors.",
        "Divisors normally pair up — except when the two halves of a pair coincide.",
        "That happens only for perfect squares, so the answer is `floor(sqrt(n))`.",
      ],
      examples: [
        { input: "3", expectedOutput: "1" },
        { input: "0", expectedOutput: "0" },
        { input: "1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        const n = roll < 0.3 ? ri(rng, 0, 100) : roll < 0.6 ? Math.pow(ri(rng, 0, 1000), 2) : ri(rng, 0, 1000000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `import math\n\ndef bulbSwitch(n: int) -> int:\n    return math.isqrt(n)`,
        javascript: `var bulbSwitch = function(n) {\n    let root = Math.floor(Math.sqrt(n));\n    while ((root + 1) * (root + 1) <= n) root++;\n    while (root * root > n) root--;\n    return root;\n};`,
              typescript: `function bulbSwitch(n: number): number {\n    var root = Math.floor(Math.sqrt(n));\n    while ((root + 1) * (root + 1) <= n) root++;\n    while (root > 0 && root * root > n) root--;\n    return root;\n}`,
              java: `public static int bulbSwitch(int n) {\n    long root = (long) Math.sqrt((double) n);\n    while ((root + 1) * (root + 1) <= n) root++;\n    while (root > 0 && root * root > n) root--;\n    return (int) root;\n}`,
              cpp: `int bulbSwitch(int n) {\n    long long root = (long long) sqrt((double) n);\n    while ((root + 1) * (root + 1) <= n) root++;\n    while (root > 0 && root * root > n) root--;\n    return (int) root;\n}`,
              c: `int bulbSwitch(int n) {\n    long long root = 0;\n    while ((root + 1) * (root + 1) <= (long long) n) root++;\n    return (int) root;\n}`,
              csharp: `public static int BulbSwitch(int n)\n{\n    long root = (long) Math.Sqrt((double) n);\n    while ((root + 1) * (root + 1) <= n) root++;\n    while (root > 0 && root * root > n) root--;\n    return (int) root;\n}`,
              go: `func bulbSwitch(n int) int {\n	root := int(math.Sqrt(float64(n)))\n	for (root+1)*(root+1) <= n {\n		root++\n	}\n	for root > 0 && root*root > n {\n		root--\n	}\n	return root\n}`,
              kotlin: `fun bulbSwitch(n: Int): Int {\n    var root = Math.sqrt(n.toDouble()).toLong()\n    while ((root + 1) * (root + 1) <= n) root++\n    while (root > 0 && root * root > n) root--\n    return root.toInt()\n}`,
              swift: `func bulbSwitch(_ n: Int) -> Int {\n    var root = Int(Double(n).squareRoot())\n    while (root + 1) * (root + 1) <= n { root += 1 }\n    while root > 0 && root * root > n { root -= 1 }\n    return root\n}`,
              rust: `fn bulbSwitch(n: i32) -> i32 {\n    let target = n as i64;\n    let mut root = (target as f64).sqrt() as i64;\n    while (root + 1) * (root + 1) <= target {\n        root += 1;\n    }\n    while root > 0 && root * root > target {\n        root -= 1;\n    }\n    root as i32\n}`,
              php: `function bulbSwitch($n) {\n    $root = (int) sqrt($n);\n    while (($root + 1) * ($root + 1) <= $n) $root++;\n    while ($root > 0 && $root * $root > $n) $root--;\n    return $root;\n}`,
              ruby: `def bulbSwitch(n)\n  root = Math.sqrt(n).to_i\n  root += 1 while (root + 1) * (root + 1) <= n\n  root -= 1 while root > 0 && root * root > n\n  root\nend`,
      },
    };
  })(),

  // ── Nth Digit ───────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let remaining = n;
      let digits = 1;
      let count = 9;
      let start = 1;
      while (remaining > digits * count) {
        remaining -= digits * count;
        digits++;
        count *= 10;
        start *= 10;
      }
      const value = start + Math.floor((remaining - 1) / digits);
      const text = String(value);
      return Number(text[(remaining - 1) % digits]);
    };
    return {
      slug: "nth-digit",
      title: "Nth Digit",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Binary Search", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "findNthDigit", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Consider the infinite sequence formed by writing the positive integers one after another: `123456789101112…`\n\nGiven an integer `n`, return the `n`-th digit of that sequence (1-indexed).",
        [
          { in: "n = 3", out: "3" },
          { in: "n = 11", out: "0", note: "The 11th digit falls inside 10." },
          { in: "n = 1000000000", out: "1" },
        ],
        ["1 <= n <= 2147483647"]),
      hints: [
        "There are 9 one-digit numbers, 90 two-digit numbers, 900 three-digit numbers, and so on.",
        "Subtract those blocks from `n` until it lands inside the block of `d`-digit numbers.",
        "Then integer division pinpoints the number and the remainder pinpoints the digit inside it — use 64-bit arithmetic so the block sizes do not overflow.",
      ],
      examples: [
        { input: "3", expectedOutput: "3" },
        { input: "11", expectedOutput: "0" },
        { input: "1000000000", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        const n = roll < 0.3 ? ri(rng, 1, 200) : roll < 0.6 ? ri(rng, 1, 1000000) : ri(rng, 1, 2147483647);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def findNthDigit(n: int) -> int:\n    digits = 1\n    count = 9\n    start = 1\n    while n > digits * count:\n        n -= digits * count\n        digits += 1\n        count *= 10\n        start *= 10\n    value = start + (n - 1) // digits\n    return int(str(value)[(n - 1) % digits])`,
        javascript: `var findNthDigit = function(n) {\n    let remaining = n;\n    let digits = 1;\n    let count = 9;\n    let start = 1;\n    while (remaining > digits * count) {\n        remaining -= digits * count;\n        digits++;\n        count *= 10;\n        start *= 10;\n    }\n    const value = start + Math.floor((remaining - 1) / digits);\n    const text = String(value);\n    return Number(text.charAt((remaining - 1) % digits));\n};`,
              typescript: `function findNthDigit(n: number): number {\n    var remaining = n;\n    var digits = 1;\n    var count = 9;\n    var start = 1;\n    while (remaining > digits * count) {\n        remaining -= digits * count;\n        digits++;\n        count *= 10;\n        start *= 10;\n    }\n    var value = start + Math.floor((remaining - 1) / digits);\n    var text = String(value);\n    return Number(text.charAt((remaining - 1) % digits));\n}`,
              java: `public static int findNthDigit(int n) {\n    long remaining = n;\n    long digits = 1;\n    long count = 9;\n    long start = 1;\n    while (remaining > digits * count) {\n        remaining -= digits * count;\n        digits++;\n        count *= 10;\n        start *= 10;\n    }\n    long value = start + (remaining - 1) / digits;\n    String text = String.valueOf(value);\n    return text.charAt((int) ((remaining - 1) % digits)) - '0';\n}`,
              cpp: `int findNthDigit(int n) {\n    long long remaining = n, digits = 1, count = 9, start = 1;\n    while (remaining > digits * count) {\n        remaining -= digits * count;\n        digits++;\n        count *= 10;\n        start *= 10;\n    }\n    long long value = start + (remaining - 1) / digits;\n    string text = to_string(value);\n    return text[(int) ((remaining - 1) % digits)] - '0';\n}`,
              c: `int findNthDigit(int n) {\n    long long remaining = n, digits = 1, count = 9, start = 1;\n    while (remaining > digits * count) {\n        remaining -= digits * count;\n        digits++;\n        count *= 10;\n        start *= 10;\n    }\n    long long value = start + (remaining - 1) / digits;\n    char text[32];\n    sprintf(text, "%lld", value);\n    return text[(int) ((remaining - 1) % digits)] - '0';\n}`,
              csharp: `public static int FindNthDigit(int n)\n{\n    long remaining = n, digits = 1, count = 9, start = 1;\n    while (remaining > digits * count)\n    {\n        remaining -= digits * count;\n        digits++;\n        count *= 10;\n        start *= 10;\n    }\n    long value = start + (remaining - 1) / digits;\n    string text = value.ToString();\n    return text[(int) ((remaining - 1) % digits)] - '0';\n}`,
              go: `func findNthDigit(n int) int {\n	remaining, digits, count, start := n, 1, 9, 1\n	for remaining > digits*count {\n		remaining -= digits * count\n		digits++\n		count *= 10\n		start *= 10\n	}\n	value := start + (remaining-1)/digits\n	text := strconv.Itoa(value)\n	return int(text[(remaining-1)%digits] - '0')\n}`,
              kotlin: `fun findNthDigit(n: Int): Int {\n    var remaining = n.toLong()\n    var digits = 1L\n    var count = 9L\n    var start = 1L\n    while (remaining > digits * count) {\n        remaining -= digits * count\n        digits++\n        count *= 10\n        start *= 10\n    }\n    val value = start + (remaining - 1) / digits\n    val text = value.toString()\n    return text[((remaining - 1) % digits).toInt()] - '0'\n}`,
              swift: `func findNthDigit(_ n: Int) -> Int {\n    var remaining = n\n    var digits = 1\n    var count = 9\n    var start = 1\n    while remaining > digits * count {\n        remaining -= digits * count\n        digits += 1\n        count *= 10\n        start *= 10\n    }\n    let value = start + (remaining - 1) / digits\n    let text = Array(String(value).unicodeScalars)\n    return Int(text[(remaining - 1) % digits].value) - 48\n}`,
              rust: `fn findNthDigit(n: i32) -> i32 {\n    let mut remaining: i64 = n as i64;\n    let mut digits: i64 = 1;\n    let mut count: i64 = 9;\n    let mut start: i64 = 1;\n    while remaining > digits * count {\n        remaining -= digits * count;\n        digits += 1;\n        count *= 10;\n        start *= 10;\n    }\n    let value = start + (remaining - 1) / digits;\n    let text: Vec<u8> = value.to_string().into_bytes();\n    (text[((remaining - 1) % digits) as usize] - b'0') as i32\n}`,
              php: `function findNthDigit($n) {\n    $remaining = $n;\n    $digits = 1;\n    $count = 9;\n    $start = 1;\n    while ($remaining > $digits * $count) {\n        $remaining -= $digits * $count;\n        $digits++;\n        $count *= 10;\n        $start *= 10;\n    }\n    $value = $start + intdiv($remaining - 1, $digits);\n    $text = strval($value);\n    return intval($text[($remaining - 1) % $digits]);\n}`,
              ruby: `def findNthDigit(n)\n  remaining = n\n  digits = 1\n  count = 9\n  start = 1\n  while remaining > digits * count\n    remaining -= digits * count\n    digits += 1\n    count *= 10\n    start *= 10\n  end\n  value = start + (remaining - 1) / digits\n  value.to_s[(remaining - 1) % digits].to_i\nend`,
      },
    };
  })(),

  // ── Rotate Function ─────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let total = 0;
      let current = 0;
      for (let i = 0; i < n; i++) {
        total += nums[i];
        current += i * nums[i];
      }
      let best = current;
      for (let k = 1; k < n; k++) {
        current = current + total - n * nums[n - k];
        if (current > best) best = current;
      }
      return best;
    };
    return {
      slug: "rotate-function",
      title: "Rotate Function",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "maxRotateFunction", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` of length `n`. Let `arrK` be `nums` rotated clockwise by `k` positions, and define\n\n`F(k) = 0 * arrK[0] + 1 * arrK[1] + … + (n - 1) * arrK[n - 1]`\n\nReturn the maximum of `F(0) … F(n - 1)`.",
        [
          { in: "nums = [4,3,2,6]", out: "26", note: "F(3) = 0*6 + 1*4 + 2*3 + 3*2 = 26." },
          { in: "nums = [100]", out: "0" },
          { in: "nums = [1,2]", out: "2" },
        ],
        ["1 <= nums.length <= 40", "-100 <= nums[i] <= 100", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Computing every `F(k)` from scratch is O(n²) — relate consecutive values instead.",
        "Rotating by one adds the whole sum once and drops one element's full `n * value` contribution.",
        "So `F(k) = F(k - 1) + sum - n * nums[n - k]`.",
      ],
      examples: [
        { input: "[4,3,2,6]", expectedOutput: "26" },
        { input: "[100]", expectedOutput: "0" },
        { input: "[1,2]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), -100, 100);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def maxRotateFunction(nums) -> int:\n    n = len(nums)\n    total = sum(nums)\n    current = sum(i * x for i, x in enumerate(nums))\n    best = current\n    for k in range(1, n):\n        current = current + total - n * nums[n - k]\n        best = max(best, current)\n    return best`,
        javascript: `var maxRotateFunction = function(nums) {\n    const n = nums.length;\n    let total = 0;\n    let current = 0;\n    for (let i = 0; i < n; i++) {\n        total += nums[i];\n        current += i * nums[i];\n    }\n    let best = current;\n    for (let k = 1; k < n; k++) {\n        current = current + total - n * nums[n - k];\n        if (current > best) best = current;\n    }\n    return best;\n};`,
              typescript: `function maxRotateFunction(nums: number[]): number {\n    var n = nums.length;\n    var total = 0;\n    var current = 0;\n    for (var i = 0; i < n; i++) {\n        total += nums[i];\n        current += i * nums[i];\n    }\n    var best = current;\n    for (var k = 1; k < n; k++) {\n        current = current + total - n * nums[n - k];\n        if (current > best) best = current;\n    }\n    return best;\n}`,
              java: `public static int maxRotateFunction(int[] nums) {\n    int n = nums.length;\n    int total = 0, current = 0;\n    for (int i = 0; i < n; i++) {\n        total += nums[i];\n        current += i * nums[i];\n    }\n    int best = current;\n    for (int k = 1; k < n; k++) {\n        current = current + total - n * nums[n - k];\n        best = Math.max(best, current);\n    }\n    return best;\n}`,
              cpp: `int maxRotateFunction(vector<int>& nums) {\n    int n = (int) nums.size();\n    int total = 0, current = 0;\n    for (int i = 0; i < n; i++) {\n        total += nums[i];\n        current += i * nums[i];\n    }\n    int best = current;\n    for (int k = 1; k < n; k++) {\n        current = current + total - n * nums[n - k];\n        best = max(best, current);\n    }\n    return best;\n}`,
              c: `int maxRotateFunction(int* nums, int numsSize) {\n    int n = numsSize;\n    int total = 0, current = 0;\n    for (int i = 0; i < n; i++) {\n        total += nums[i];\n        current += i * nums[i];\n    }\n    int best = current;\n    for (int k = 1; k < n; k++) {\n        current = current + total - n * nums[n - k];\n        if (current > best) best = current;\n    }\n    return best;\n}`,
              csharp: `public static int MaxRotateFunction(int[] nums)\n{\n    int n = nums.Length;\n    int total = 0, current = 0;\n    for (int i = 0; i < n; i++)\n    {\n        total += nums[i];\n        current += i * nums[i];\n    }\n    int best = current;\n    for (int k = 1; k < n; k++)\n    {\n        current = current + total - n * nums[n - k];\n        best = Math.Max(best, current);\n    }\n    return best;\n}`,
              go: `func maxRotateFunction(nums []int) int {\n	n := len(nums)\n	total, current := 0, 0\n	for i := 0; i < n; i++ {\n		total += nums[i]\n		current += i * nums[i]\n	}\n	best := current\n	for k := 1; k < n; k++ {\n		current = current + total - n*nums[n-k]\n		if current > best {\n			best = current\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxRotateFunction(nums: IntArray): Int {\n    val n = nums.size\n    var total = 0\n    var current = 0\n    for (i in 0 until n) {\n        total += nums[i]\n        current += i * nums[i]\n    }\n    var best = current\n    for (k in 1 until n) {\n        current = current + total - n * nums[n - k]\n        if (current > best) best = current\n    }\n    return best\n}`,
              swift: `func maxRotateFunction(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var total = 0\n    var current = 0\n    for i in 0..<n {\n        total += nums[i]\n        current += i * nums[i]\n    }\n    var best = current\n    var k = 1\n    while k < n {\n        current = current + total - n * nums[n - k]\n        if current > best { best = current }\n        k += 1\n    }\n    return best\n}`,
              rust: `fn maxRotateFunction(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut total = 0i32;\n    let mut current = 0i32;\n    for i in 0..n {\n        total += nums[i];\n        current += (i as i32) * nums[i];\n    }\n    let mut best = current;\n    for k in 1..n {\n        current = current + total - (n as i32) * nums[n - k];\n        if current > best {\n            best = current;\n        }\n    }\n    best\n}`,
              php: `function maxRotateFunction($nums) {\n    $n = count($nums);\n    $total = 0;\n    $current = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $total += $nums[$i];\n        $current += $i * $nums[$i];\n    }\n    $best = $current;\n    for ($k = 1; $k < $n; $k++) {\n        $current = $current + $total - $n * $nums[$n - $k];\n        if ($current > $best) $best = $current;\n    }\n    return $best;\n}`,
              ruby: `def maxRotateFunction(nums)\n  n = nums.length\n  total = nums.sum\n  current = nums.each_with_index.map { |x, i| i * x }.sum\n  best = current\n  (1...n).each do |k|\n    current = current + total - n * nums[n - k]\n    best = current if current > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Sum of All Subset XOR Totals ────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let orAll = 0;
      for (let i = 0; i < nums.length; i++) orAll |= nums[i];
      return orAll * Math.pow(2, nums.length - 1);
    };
    return {
      slug: "sum-of-all-subset-xor-totals",
      title: "Sum of All Subset XOR Totals",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Backtracking", "Bit Manipulation", "Combinatorics", "Amazon", "Adobe"],
      signature: { funcName: "subsetXORSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **XOR total** of an array is the bitwise XOR of all its elements; the empty array has XOR total `0`.\n\nGiven an array `nums`, return the sum of the XOR totals over **every** subset of `nums`. Subsets with the same elements at different indices are counted separately.",
        [
          { in: "nums = [1,3]", out: "6", note: "The subsets give 0, 1, 3 and 2." },
          { in: "nums = [5,1,6]", out: "28" },
          { in: "nums = [3,4,5,6,7,8]", out: "480" },
        ],
        ["1 <= nums.length <= 20", "1 <= nums[i] <= 20"],
        "Enumerating all 2^n subsets works for n ≤ 20. Can you find the closed form?"),
      hints: [
        "Enumerating the `2^n` subsets is fine here, but look at one bit position at a time.",
        "If any element has a given bit set, exactly half of all subsets end up with that bit set in their XOR.",
        "So the answer is `(nums[0] | nums[1] | … ) * 2^(n-1)`.",
      ],
      examples: [
        { input: "[1,3]", expectedOutput: "6" },
        { input: "[5,1,6]", expectedOutput: "28" },
        { input: "[3,4,5,6,7,8]", expectedOutput: "480" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 20), 1, 20);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def subsetXORSum(nums) -> int:\n    or_all = 0\n    for x in nums:\n        or_all |= x\n    return or_all << (len(nums) - 1)`,
        javascript: `var subsetXORSum = function(nums) {\n    let orAll = 0;\n    for (let i = 0; i < nums.length; i++) orAll |= nums[i];\n    return orAll * Math.pow(2, nums.length - 1);\n};`,
              typescript: `function subsetXORSum(nums: number[]): number {\n    var orAll = 0;\n    for (var i = 0; i < nums.length; i++) orAll |= nums[i];\n    return orAll * Math.pow(2, nums.length - 1);\n}`,
              java: `public static int subsetXORSum(int[] nums) {\n    int orAll = 0;\n    for (int x : nums) orAll |= x;\n    return orAll << (nums.length - 1);\n}`,
              cpp: `int subsetXORSum(vector<int>& nums) {\n    int orAll = 0;\n    for (int x : nums) orAll |= x;\n    return orAll << ((int) nums.size() - 1);\n}`,
              c: `int subsetXORSum(int* nums, int numsSize) {\n    int orAll = 0;\n    for (int i = 0; i < numsSize; i++) orAll |= nums[i];\n    return orAll << (numsSize - 1);\n}`,
              csharp: `public static int SubsetXORSum(int[] nums)\n{\n    int orAll = 0;\n    foreach (int x in nums) orAll |= x;\n    return orAll << (nums.Length - 1);\n}`,
              go: `func subsetXORSum(nums []int) int {\n	orAll := 0\n	for _, x := range nums {\n		orAll |= x\n	}\n	return orAll << uint(len(nums)-1)\n}`,
              kotlin: `fun subsetXORSum(nums: IntArray): Int {\n    var orAll = 0\n    for (x in nums) orAll = orAll or x\n    return orAll shl (nums.size - 1)\n}`,
              swift: `func subsetXORSum(_ nums: [Int]) -> Int {\n    var orAll = 0\n    for x in nums { orAll |= x }\n    return orAll << (nums.count - 1)\n}`,
              rust: `fn subsetXORSum(nums: Vec<i32>) -> i32 {\n    let mut or_all = 0i32;\n    for x in nums.iter() {\n        or_all |= *x;\n    }\n    or_all << (nums.len() - 1)\n}`,
              php: `function subsetXORSum($nums) {\n    $orAll = 0;\n    foreach ($nums as $x) $orAll |= $x;\n    return $orAll << (count($nums) - 1);\n}`,
              ruby: `def subsetXORSum(nums)\n  or_all = 0\n  nums.each { |x| or_all |= x }\n  or_all << (nums.length - 1)\nend`,
      },
    };
  })(),

  // ── Water Bottles ───────────────────────────────────────────────
  (() => {
    const ref = (numBottles: number, numExchange: number) => {
      let drunk = numBottles;
      let empty = numBottles;
      while (empty >= numExchange) {
        const fresh = Math.floor(empty / numExchange);
        drunk += fresh;
        empty = empty - fresh * numExchange + fresh;
      }
      return drunk;
    };
    return {
      slug: "water-bottles",
      title: "Water Bottles",
      difficulty: "EASY" as const,
      tags: ["Math", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "numWaterBottles", params: [{ name: "numBottles", type: "int" as const }, { name: "numExchange", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have `numBottles` full water bottles. You can trade `numExchange` **empty** bottles for one full bottle.\n\nDrinking a full bottle turns it into an empty one. Return the maximum number of bottles you can drink.",
        [
          { in: "numBottles = 9, numExchange = 3", out: "13" },
          { in: "numBottles = 15, numExchange = 4", out: "19" },
          { in: "numBottles = 5, numExchange = 5", out: "6" },
        ],
        ["1 <= numBottles <= 100000", "2 <= numExchange <= 100"]),
      hints: [
        "Track two numbers: how many you have drunk, and how many empties you hold.",
        "Each exchange converts `numExchange` empties into one full bottle — which becomes one more empty after you drink it.",
        "Loop while you still hold enough empties to trade.",
      ],
      examples: [
        { input: "9\n3", expectedOutput: "13" },
        { input: "15\n4", expectedOutput: "19" },
        { input: "5\n5", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const numBottles = ri(rng, 1, rng() < 0.5 ? 100 : 100000);
        const numExchange = ri(rng, 2, 100);
        return { input: `${numBottles}\n${numExchange}`, expectedOutput: String(ref(numBottles, numExchange)) };
      },
      solutions: {
        python: `def numWaterBottles(numBottles: int, numExchange: int) -> int:\n    drunk = numBottles\n    empty = numBottles\n    while empty >= numExchange:\n        fresh = empty // numExchange\n        drunk += fresh\n        empty = empty - fresh * numExchange + fresh\n    return drunk`,
        javascript: `var numWaterBottles = function(numBottles, numExchange) {\n    let drunk = numBottles;\n    let empty = numBottles;\n    while (empty >= numExchange) {\n        const fresh = Math.floor(empty / numExchange);\n        drunk += fresh;\n        empty = empty - fresh * numExchange + fresh;\n    }\n    return drunk;\n};`,
              typescript: `function numWaterBottles(numBottles: number, numExchange: number): number {\n    var drunk = numBottles;\n    var empty = numBottles;\n    while (empty >= numExchange) {\n        var fresh = Math.floor(empty / numExchange);\n        drunk += fresh;\n        empty = empty - fresh * numExchange + fresh;\n    }\n    return drunk;\n}`,
              java: `public static int numWaterBottles(int numBottles, int numExchange) {\n    int drunk = numBottles, empty = numBottles;\n    while (empty >= numExchange) {\n        int fresh = empty / numExchange;\n        drunk += fresh;\n        empty = empty - fresh * numExchange + fresh;\n    }\n    return drunk;\n}`,
              cpp: `int numWaterBottles(int numBottles, int numExchange) {\n    int drunk = numBottles, empty = numBottles;\n    while (empty >= numExchange) {\n        int fresh = empty / numExchange;\n        drunk += fresh;\n        empty = empty - fresh * numExchange + fresh;\n    }\n    return drunk;\n}`,
              c: `int numWaterBottles(int numBottles, int numExchange) {\n    int drunk = numBottles, empty = numBottles;\n    while (empty >= numExchange) {\n        int fresh = empty / numExchange;\n        drunk += fresh;\n        empty = empty - fresh * numExchange + fresh;\n    }\n    return drunk;\n}`,
              csharp: `public static int NumWaterBottles(int numBottles, int numExchange)\n{\n    int drunk = numBottles, empty = numBottles;\n    while (empty >= numExchange)\n    {\n        int fresh = empty / numExchange;\n        drunk += fresh;\n        empty = empty - fresh * numExchange + fresh;\n    }\n    return drunk;\n}`,
              go: `func numWaterBottles(numBottles int, numExchange int) int {\n	drunk, empty := numBottles, numBottles\n	for empty >= numExchange {\n		fresh := empty / numExchange\n		drunk += fresh\n		empty = empty - fresh*numExchange + fresh\n	}\n	return drunk\n}`,
              kotlin: `fun numWaterBottles(numBottles: Int, numExchange: Int): Int {\n    var drunk = numBottles\n    var empty = numBottles\n    while (empty >= numExchange) {\n        val fresh = empty / numExchange\n        drunk += fresh\n        empty = empty - fresh * numExchange + fresh\n    }\n    return drunk\n}`,
              swift: `func numWaterBottles(_ numBottles: Int, _ numExchange: Int) -> Int {\n    var drunk = numBottles\n    var empty = numBottles\n    while empty >= numExchange {\n        let fresh = empty / numExchange\n        drunk += fresh\n        empty = empty - fresh * numExchange + fresh\n    }\n    return drunk\n}`,
              rust: `fn numWaterBottles(numBottles: i32, numExchange: i32) -> i32 {\n    let mut drunk = numBottles;\n    let mut empty = numBottles;\n    while empty >= numExchange {\n        let fresh = empty / numExchange;\n        drunk += fresh;\n        empty = empty - fresh * numExchange + fresh;\n    }\n    drunk\n}`,
              php: `function numWaterBottles($numBottles, $numExchange) {\n    $drunk = $numBottles;\n    $empty = $numBottles;\n    while ($empty >= $numExchange) {\n        $fresh = intdiv($empty, $numExchange);\n        $drunk += $fresh;\n        $empty = $empty - $fresh * $numExchange + $fresh;\n    }\n    return $drunk;\n}`,
              ruby: `def numWaterBottles(numBottles, numExchange)\n  drunk = numBottles\n  empty = numBottles\n  while empty >= numExchange\n    fresh = empty / numExchange\n    drunk += fresh\n    empty = empty - fresh * numExchange + fresh\n  end\n  drunk\nend`,
      },
    };
  })(),

  // ── Count Odd Numbers in an Interval Range ──────────────────────
  (() => {
    const ref = (low: number, high: number) => {
      const count = Math.floor((high - low) / 2);
      return low % 2 === 1 || high % 2 === 1 ? count + 1 : count;
    };
    return {
      slug: "count-odd-numbers-in-an-interval-range",
      title: "Count Odd Numbers in an Interval Range",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "Adobe"],
      signature: { funcName: "countOdds", params: [{ name: "low", type: "int" as const }, { name: "high", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given two non-negative integers `low` and `high`, return the count of **odd** numbers in the inclusive range `[low, high]`.",
        [
          { in: "low = 3, high = 7", out: "3", note: "3, 5 and 7." },
          { in: "low = 8, high = 10", out: "1" },
          { in: "low = 2, high = 2", out: "0" },
        ],
        ["0 <= low <= high <= 1000000000"]),
      hints: [
        "Half the numbers in a long range are odd — the question is how the endpoints round.",
        "`(high - low) / 2` counts the complete pairs.",
        "Add one more whenever either endpoint is itself odd.",
      ],
      examples: [
        { input: "3\n7", expectedOutput: "3" },
        { input: "8\n10", expectedOutput: "1" },
        { input: "2\n2", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 100 : 1000000000;
        const low = ri(rng, 0, hi);
        const high = ri(rng, low, hi);
        return { input: `${low}\n${high}`, expectedOutput: String(ref(low, high)) };
      },
      solutions: {
        python: `def countOdds(low: int, high: int) -> int:\n    count = (high - low) // 2\n    return count + 1 if low % 2 == 1 or high % 2 == 1 else count`,
        javascript: `var countOdds = function(low, high) {\n    const count = Math.floor((high - low) / 2);\n    return low % 2 === 1 || high % 2 === 1 ? count + 1 : count;\n};`,
              typescript: `function countOdds(low: number, high: number): number {\n    var count = Math.floor((high - low) / 2);\n    return low % 2 === 1 || high % 2 === 1 ? count + 1 : count;\n}`,
              java: `public static int countOdds(int low, int high) {\n    int count = (high - low) / 2;\n    return (low % 2 == 1 || high % 2 == 1) ? count + 1 : count;\n}`,
              cpp: `int countOdds(int low, int high) {\n    int count = (high - low) / 2;\n    return (low % 2 == 1 || high % 2 == 1) ? count + 1 : count;\n}`,
              c: `int countOdds(int low, int high) {\n    int count = (high - low) / 2;\n    return (low % 2 == 1 || high % 2 == 1) ? count + 1 : count;\n}`,
              csharp: `public static int CountOdds(int low, int high)\n{\n    int count = (high - low) / 2;\n    return (low % 2 == 1 || high % 2 == 1) ? count + 1 : count;\n}`,
              go: `func countOdds(low int, high int) int {\n	count := (high - low) / 2\n	if low%2 == 1 || high%2 == 1 {\n		return count + 1\n	}\n	return count\n}`,
              kotlin: `fun countOdds(low: Int, high: Int): Int {\n    val count = (high - low) / 2\n    return if (low % 2 == 1 || high % 2 == 1) count + 1 else count\n}`,
              swift: `func countOdds(_ low: Int, _ high: Int) -> Int {\n    let count = (high - low) / 2\n    return (low % 2 == 1 || high % 2 == 1) ? count + 1 : count\n}`,
              rust: `fn countOdds(low: i32, high: i32) -> i32 {\n    let count = (high - low) / 2;\n    if low % 2 == 1 || high % 2 == 1 { count + 1 } else { count }\n}`,
              php: `function countOdds($low, $high) {\n    $count = intdiv($high - $low, 2);\n    return ($low % 2 === 1 || $high % 2 === 1) ? $count + 1 : $count;\n}`,
              ruby: `def countOdds(low, high)\n  count = (high - low) / 2\n  (low % 2 == 1 || high % 2 == 1) ? count + 1 : count\nend`,
      },
    };
  })(),
];
