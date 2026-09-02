/** Arrays & basic problem solving — hand-authored classics. */

import { bool, describe, fmtIntArr, makeRng, pick, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const genArr = (rng: Rng, len: [number, number], val: [number, number]) =>
  Array.from({ length: ri(rng, len[0], len[1]) }, () => ri(rng, val[0], val[1]));

export const ARRAY_PROBLEMS: CatalogProblem[] = [

  // ── Best Time to Buy and Sell Stock ─────────────────────────────
  (() => {
    const ref = (prices: number[]) => {
      let min = Infinity, best = 0;
      for (const p of prices) { min = Math.min(min, p); best = Math.max(best, p - min); }
      return best;
    };
    return {
      slug: "best-time-to-buy-and-sell-stock",
      title: "Best Time to Buy and Sell Stock",
      difficulty: "EASY" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "maxProfit", params: [{ name: "prices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`.\n\nYou want to maximize profit by choosing **one day to buy** and a **later day to sell**. Return the maximum profit; if no profit is possible, return `0`.",
        [
          { in: "prices = [7,1,5,3,6,4]", out: "5", note: "Buy on day 2 (price 1), sell on day 5 (price 6): 6 - 1 = 5." },
          { in: "prices = [7,6,4,3,1]", out: "0", note: "Prices only fall — no profitable transaction exists." },
        ],
        ["1 <= prices.length <= 30", "0 <= prices[i] <= 1000"]),
      hints: [
        "Track the lowest price seen so far while scanning left to right.",
        "At each day, the best sale ending here is price - minSoFar.",
      ],
      examples: [
        { input: "[7,1,5,3,6,4]", expectedOutput: "5" },
        { input: "[7,6,4,3,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const prices = genArr(rng, [1, 30], [0, 1000]);
        return { input: fmtIntArr(prices), expectedOutput: String(ref(prices)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxProfit(prices: List[int]) -> int:\n    lo = float("inf")\n    best = 0\n    for p in prices:\n        lo = min(lo, p)\n        best = max(best, p - lo)\n    return best`,
        javascript: `var maxProfit = function(prices) {\n    let lo = Infinity, best = 0;\n    for (const p of prices) {\n        lo = Math.min(lo, p);\n        best = Math.max(best, p - lo);\n    }\n    return best;\n};`,
      },
    };
  })(),

  // ── Product of Array Except Self ────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length, out = new Array(n).fill(1);
      let acc = 1;
      for (let i = 0; i < n; i++) { out[i] = acc; acc *= nums[i]; }
      acc = 1;
      for (let i = n - 1; i >= 0; i--) { out[i] *= acc; acc *= nums[i]; }
      return out;
    };
    return {
      slug: "product-of-array-except-self",
      title: "Product of Array Except Self",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum"],
      signature: { funcName: "productExceptSelf", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums`, return an array `answer` where `answer[i]` is the **product of every element of `nums` except `nums[i]`**.\n\nYou must solve it **without using division** and in `O(n)` time.",
        [
          { in: "nums = [1,2,3,4]", out: "[24,12,8,6]" },
          { in: "nums = [-1,1,0,-3,3]", out: "[0,0,9,0,0]" },
        ],
        ["2 <= nums.length <= 10", "-4 <= nums[i] <= 4"],
        "can you do it in O(1) extra space (the output array does not count)?"),
      hints: [
        "answer[i] equals (product of everything to the left of i) × (product of everything to the right).",
        "Two sweeps: one accumulating prefix products, one accumulating suffix products into the same output.",
      ],
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]" },
        { input: "[-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [2, 10], [-4, 4]);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef productExceptSelf(nums: List[int]) -> List[int]:\n    n = len(nums)\n    out = [1] * n\n    acc = 1\n    for i in range(n):\n        out[i] = acc\n        acc *= nums[i]\n    acc = 1\n    for i in range(n - 1, -1, -1):\n        out[i] *= acc\n        acc *= nums[i]\n    return out`,
        javascript: `var productExceptSelf = function(nums) {\n    const n = nums.length;\n    const out = new Array(n).fill(1);\n    let acc = 1;\n    for (let i = 0; i < n; i++) {\n        out[i] = acc;\n        acc *= nums[i];\n    }\n    acc = 1;\n    for (let i = n - 1; i >= 0; i--) {\n        out[i] *= acc;\n        acc *= nums[i];\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Move Zeroes ─────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => [...nums.filter((x) => x !== 0), ...nums.filter((x) => x === 0)];
    return {
      slug: "move-zeroes",
      title: "Move Zeroes",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers"],
      signature: { funcName: "moveZeroes", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums`, move all `0`s to the **end** while keeping the relative order of the non-zero elements, then return the array.\n\nDo this **in place** with O(1) extra memory, then return `nums`.",
        [
          { in: "nums = [0,1,0,3,12]", out: "[1,3,12,0,0]" },
          { in: "nums = [0]", out: "[0]" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100"]),
      hints: [
        "Keep a write pointer for where the next non-zero belongs.",
        "After copying every non-zero forward, fill the rest with zeros.",
      ],
      examples: [
        { input: "[0,1,0,3,12]", expectedOutput: "[1,3,12,0,0]" },
        { input: "[0]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-100, 100]).map((x) => (Math.abs(x) < 25 ? 0 : x));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef moveZeroes(nums: List[int]) -> List[int]:\n    w = 0\n    for x in nums:\n        if x != 0:\n            nums[w] = x\n            w += 1\n    for i in range(w, len(nums)):\n        nums[i] = 0\n    return nums`,
        javascript: `var moveZeroes = function(nums) {\n    let w = 0;\n    for (const x of nums) {\n        if (x !== 0) nums[w++] = x;\n    }\n    while (w < nums.length) nums[w++] = 0;\n    return nums;\n};`,
      },
    };
  })(),

  // ── Remove Duplicates from Sorted Array ─────────────────────────
  (() => {
    const ref = (nums: number[]) => nums.filter((x, i) => i === 0 || x !== nums[i - 1]);
    return {
      slug: "remove-duplicates-from-sorted-array",
      title: "Remove Duplicates from Sorted Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers"],
      signature: { funcName: "removeDuplicates", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` sorted in **non-decreasing order**, remove the duplicates so each unique element appears **once**, keeping the order. Return the resulting array.",
        [
          { in: "nums = [1,1,2]", out: "[1,2]" },
          { in: "nums = [0,0,1,1,1,2,2,3,3,4]", out: "[0,1,2,3,4]" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100", "nums is sorted in non-decreasing order"]),
      hints: [
        "Because the array is sorted, duplicates sit next to each other.",
        "Compare each element with the previous one — keep it only when it differs.",
      ],
      examples: [
        { input: "[1,1,2]", expectedOutput: "[1,2]" },
        { input: "[0,0,1,1,1,2,2,3,3,4]", expectedOutput: "[0,1,2,3,4]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-100, 100]).sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef removeDuplicates(nums: List[int]) -> List[int]:\n    out = []\n    for x in nums:\n        if not out or out[-1] != x:\n            out.append(x)\n    return out`,
        javascript: `var removeDuplicates = function(nums) {\n    const out = [];\n    for (const x of nums) {\n        if (out.length === 0 || out[out.length - 1] !== x) out.push(x);\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Rotate Array ────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length, s = k % n;
      return [...nums.slice(n - s), ...nums.slice(0, n - s)];
    };
    return {
      slug: "rotate-array",
      title: "Rotate Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Two Pointers"],
      signature: { funcName: "rotate", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums`, rotate the array to the **right** by `k` steps (`k` is non-negative) and return the result.",
        [
          { in: "nums = [1,2,3,4,5,6,7], k = 3", out: "[5,6,7,1,2,3,4]", note: "Rotate right 3 times: [7,1,…], [6,7,1,…], [5,6,7,1,2,3,4]." },
          { in: "nums = [-1,-100,3,99], k = 2", out: "[3,99,-1,-100]" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100", "0 <= k <= 100"],
        "the classic in-place trick reverses the whole array, then each half."),
      hints: [
        "k can exceed the length — reduce it with k % n first.",
        "The last k % n elements move to the front, everything else shifts right.",
      ],
      examples: [
        { input: "[1,2,3,4,5,6,7]\n3", expectedOutput: "[5,6,7,1,2,3,4]" },
        { input: "[-1,-100,3,99]\n2", expectedOutput: "[3,99,-1,-100]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-100, 100]);
        const k = ri(rng, 0, 100);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef rotate(nums: List[int], k: int) -> List[int]:\n    n = len(nums)\n    s = k % n\n    return nums[n - s:] + nums[:n - s]`,
        javascript: `var rotate = function(nums, k) {\n    const n = nums.length;\n    const s = k % n;\n    return nums.slice(n - s).concat(nums.slice(0, n - s));\n};`,
      },
    };
  })(),

  // ── Majority Element ────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const c = new Map<number, number>();
      for (const x of nums) c.set(x, (c.get(x) ?? 0) + 1);
      for (const [v, n] of c) if (n > nums.length / 2) return v;
      return -1;
    };
    return {
      slug: "majority-element",
      title: "Majority Element",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Divide and Conquer"],
      signature: { funcName: "majorityElement", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` of size `n`, return the **majority element** — the element that appears **more than `n / 2` times**. It always exists in the input.",
        [
          { in: "nums = [3,2,3]", out: "3" },
          { in: "nums = [2,2,1,1,1,2,2]", out: "2" },
        ],
        ["1 <= nums.length <= 31", "-100 <= nums[i] <= 100", "The majority element always exists."],
        "Boyer–Moore voting solves it in O(n) time and O(1) space."),
      hints: [
        "Counting occurrences with a hash map works in one pass.",
        "Boyer–Moore: keep a candidate and a counter; matching elements vote up, others vote down.",
      ],
      examples: [
        { input: "[3,2,3]", expectedOutput: "3" },
        { input: "[2,2,1,1,1,2,2]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 15);
        const major = ri(rng, -100, 100);
        const others = Array.from({ length: n }, () => ri(rng, -100, 100));
        const nums = shuffle(rng, [...Array.from({ length: n + 1 }, () => major), ...others]);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef majorityElement(nums: List[int]) -> int:\n    count = 0\n    cand = nums[0]\n    for x in nums:\n        if count == 0:\n            cand = x\n        count += 1 if x == cand else -1\n    return cand`,
        javascript: `var majorityElement = function(nums) {\n    let count = 0, cand = nums[0];\n    for (const x of nums) {\n        if (count === 0) cand = x;\n        count += x === cand ? 1 : -1;\n    }\n    return cand;\n};`,
      },
    };
  })(),

  // ── Missing Number ──────────────────────────────────────────────
  (() => {
    return {
      slug: "missing-number",
      title: "Missing Number",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Bit Manipulation"],
      signature: { funcName: "missingNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` containing `n` **distinct** numbers taken from the range `[0, n]`, return the one number in the range that is **missing**.",
        [
          { in: "nums = [3,0,1]", out: "2", note: "n = 3, so the range is [0,3]; 2 is absent." },
          { in: "nums = [9,6,4,2,3,5,7,0,1]", out: "8" },
        ],
        ["1 <= nums.length <= 30", "All numbers are distinct and within [0, nums.length]"],
        "can you do it with O(1) extra space using arithmetic or XOR?"),
      hints: [
        "The sum 0+1+…+n is n(n+1)/2 — compare it with the actual sum.",
        "XOR of everything in [0,n] with everything in nums leaves exactly the missing number.",
      ],
      examples: [
        { input: "[3,0,1]", expectedOutput: "2" },
        { input: "[9,6,4,2,3,5,7,0,1]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const missing = ri(rng, 0, n);
        const nums = shuffle(rng, Array.from({ length: n + 1 }, (_, i) => i).filter((x) => x !== missing));
        return { input: fmtIntArr(nums), expectedOutput: String(missing) };
      },
      solutions: {
        python: `from typing import List\n\ndef missingNumber(nums: List[int]) -> int:\n    n = len(nums)\n    return n * (n + 1) // 2 - sum(nums)`,
        javascript: `var missingNumber = function(nums) {\n    const n = nums.length;\n    return (n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0);\n};`,
      },
    };
  })(),

  // ── Find All Numbers Disappeared in an Array ────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const present = new Set(nums);
      const out: number[] = [];
      for (let i = 1; i <= nums.length; i++) if (!present.has(i)) out.push(i);
      return out;
    };
    return {
      slug: "find-all-numbers-disappeared",
      title: "Find All Numbers Disappeared in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table"],
      signature: { funcName: "findDisappeared", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `nums` of `n` integers where `nums[i]` is in the range `[1, n]`, return all the numbers in `[1, n]` that **do not appear** in `nums`, in **increasing order**.",
        [
          { in: "nums = [4,3,2,7,8,2,3,1]", out: "[5,6]" },
          { in: "nums = [1,1]", out: "[2]" },
        ],
        ["1 <= nums.length <= 30", "1 <= nums[i] <= nums.length"]),
      hints: [
        "Mark which values 1..n you have seen, then collect the unseen ones.",
        "The classic O(1)-space trick negates nums[|x|-1] to mark presence.",
      ],
      examples: [
        { input: "[4,3,2,7,8,2,3,1]", expectedOutput: "[5,6]" },
        { input: "[1,1]", expectedOutput: "[2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, n));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findDisappeared(nums: List[int]) -> List[int]:\n    present = set(nums)\n    return [i for i in range(1, len(nums) + 1) if i not in present]`,
        javascript: `var findDisappeared = function(nums) {\n    const present = new Set(nums);\n    const out = [];\n    for (let i = 1; i <= nums.length; i++) {\n        if (!present.has(i)) out.push(i);\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Single Number ───────────────────────────────────────────────
  (() => {
    return {
      slug: "single-number",
      title: "Single Number",
      difficulty: "EASY" as const,
      tags: ["Array", "Bit Manipulation"],
      signature: { funcName: "singleNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given a non-empty array `nums` where **every element appears twice except for one**, find that single one.\n\nYour solution should run in linear time and use only constant extra space.",
        [
          { in: "nums = [2,2,1]", out: "1" },
          { in: "nums = [4,1,2,1,2]", out: "4" },
        ],
        ["1 <= nums.length <= 29 (odd)", "-100 <= nums[i] <= 100", "Every element appears twice except one."]),
      hints: [
        "x XOR x = 0, and XOR is order-independent.",
        "XOR the whole array together — the pairs cancel and the single survives.",
      ],
      examples: [
        { input: "[2,2,1]", expectedOutput: "1" },
        { input: "[4,1,2,1,2]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const pairCount = ri(rng, 0, 14);
        const pool = shuffle(rng, Array.from({ length: 201 }, (_, i) => i - 100));
        const pairs = pool.slice(0, pairCount);
        const single = pool[pairCount];
        const nums = shuffle(rng, [...pairs, ...pairs, single]);
        return { input: fmtIntArr(nums), expectedOutput: String(single) };
      },
      solutions: {
        python: `from typing import List\n\ndef singleNumber(nums: List[int]) -> int:\n    acc = 0\n    for x in nums:\n        acc ^= x\n    return acc`,
        javascript: `var singleNumber = function(nums) {\n    let acc = 0;\n    for (const x of nums) acc ^= x;\n    return acc;\n};`,
      },
    };
  })(),

  // ── Maximum Product Subarray ────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = nums[0], hi = nums[0], lo = nums[0];
      for (let i = 1; i < nums.length; i++) {
        const x = nums[i];
        const a = x, b = hi * x, c = lo * x;
        hi = Math.max(a, b, c);
        lo = Math.min(a, b, c);
        best = Math.max(best, hi);
      }
      return best;
    };
    return {
      slug: "maximum-product-subarray",
      title: "Maximum Product Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "maxProduct", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, find a **contiguous non-empty subarray** with the largest product and return that product.",
        [
          { in: "nums = [2,3,-2,4]", out: "6", note: "[2,3] has the largest product, 6." },
          { in: "nums = [-2,0,-1]", out: "0", note: "The answer cannot be 2 because [-2,-1] is not contiguous." },
        ],
        ["1 <= nums.length <= 12", "-5 <= nums[i] <= 5"]),
      hints: [
        "A negative number flips the sign — the smallest product so far can become the largest.",
        "Track both the maximum AND minimum product ending at each position.",
      ],
      examples: [
        { input: "[2,3,-2,4]", expectedOutput: "6" },
        { input: "[-2,0,-1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 12], [-5, 5]);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxProduct(nums: List[int]) -> int:\n    best = hi = lo = nums[0]\n    for x in nums[1:]:\n        cands = (x, hi * x, lo * x)\n        hi = max(cands)\n        lo = min(cands)\n        best = max(best, hi)\n    return best`,
        javascript: `var maxProduct = function(nums) {\n    let best = nums[0], hi = nums[0], lo = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        const x = nums[i];\n        const a = x, b = hi * x, c = lo * x;\n        hi = Math.max(a, b, c);\n        lo = Math.min(a, b, c);\n        best = Math.max(best, hi);\n    }\n    return best;\n};`,
      },
    };
  })(),

  // ── Subarray Sum Equals K ───────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const seen = new Map<number, number>([[0, 1]]);
      let sum = 0, count = 0;
      for (const x of nums) {
        sum += x;
        count += seen.get(sum - k) ?? 0;
        seen.set(sum, (seen.get(sum) ?? 0) + 1);
      }
      return count;
    };
    return {
      slug: "subarray-sum-equals-k",
      title: "Subarray Sum Equals K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum"],
      signature: { funcName: "subarraySum", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return the **number of contiguous subarrays whose sum equals `k`**.",
        [
          { in: "nums = [1,1,1], k = 2", out: "2" },
          { in: "nums = [1,2,3], k = 3", out: "2" },
        ],
        ["1 <= nums.length <= 30", "-50 <= nums[i] <= 50", "-100 <= k <= 100"]),
      hints: [
        "A subarray sum is a difference of two prefix sums.",
        "Count how many earlier prefixes equal currentPrefix - k using a hash map.",
      ],
      examples: [
        { input: "[1,1,1]\n2", expectedOutput: "2" },
        { input: "[1,2,3]\n3", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-50, 50]);
        const k = ri(rng, -100, 100);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef subarraySum(nums: List[int], k: int) -> int:\n    seen = {0: 1}\n    total = 0\n    count = 0\n    for x in nums:\n        total += x\n        count += seen.get(total - k, 0)\n        seen[total] = seen.get(total, 0) + 1\n    return count`,
        javascript: `var subarraySum = function(nums, k) {\n    const seen = new Map([[0, 1]]);\n    let sum = 0, count = 0;\n    for (const x of nums) {\n        sum += x;\n        count += seen.get(sum - k) || 0;\n        seen.set(sum, (seen.get(sum) || 0) + 1);\n    }\n    return count;\n};`,
      },
    };
  })(),

  // ── Longest Consecutive Sequence ────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = new Set(nums);
      let best = 0;
      for (const x of s) {
        if (!s.has(x - 1)) {
          let len = 1;
          while (s.has(x + len)) len++;
          best = Math.max(best, len);
        }
      }
      return best;
    };
    return {
      slug: "longest-consecutive-sequence",
      title: "Longest Consecutive Sequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Union Find"],
      signature: { funcName: "longestConsecutive", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an unsorted array `nums`, return the length of the **longest run of consecutive integers** (the elements can appear anywhere in the array).\n\nYour algorithm should run in `O(n)` time.",
        [
          { in: "nums = [100,4,200,1,3,2]", out: "4", note: "The longest run is [1,2,3,4]." },
          { in: "nums = [0,3,7,2,5,8,4,6,0,1]", out: "9" },
        ],
        ["0 <= nums.length <= 30", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Put everything in a set for O(1) membership checks.",
        "Only start counting from numbers that begin a run (x-1 is absent).",
      ],
      examples: [
        { input: "[100,4,200,1,3,2]", expectedOutput: "4" },
        { input: "[0,3,7,2,5,8,4,6,0,1]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [0, 30], [-40, 40]);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef longestConsecutive(nums: List[int]) -> int:\n    s = set(nums)\n    best = 0\n    for x in s:\n        if x - 1 not in s:\n            length = 1\n            while x + length in s:\n                length += 1\n            best = max(best, length)\n    return best`,
        javascript: `var longestConsecutive = function(nums) {\n    const s = new Set(nums);\n    let best = 0;\n    for (const x of s) {\n        if (!s.has(x - 1)) {\n            let len = 1;\n            while (s.has(x + len)) len++;\n            best = Math.max(best, len);\n        }\n    }\n    return best;\n};`,
      },
    };
  })(),

  // ── Find the Duplicate Number ───────────────────────────────────
  (() => {
    return {
      slug: "find-the-duplicate-number",
      title: "Find the Duplicate Number",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search"],
      signature: { funcName: "findDuplicate", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` of `n + 1` integers where each integer is in `[1, n]`, exactly **one value is repeated** (possibly more than twice). Return that repeated number **without modifying the array** and using only constant extra space.",
        [
          { in: "nums = [1,3,4,2,2]", out: "2" },
          { in: "nums = [3,1,3,4,2]", out: "3" },
        ],
        ["2 <= nums.length <= 31", "1 <= nums[i] <= nums.length - 1", "Exactly one value repeats."]),
      hints: [
        "Treat nums[i] as a pointer i → nums[i]; the repeat creates a cycle.",
        "Floyd's tortoise-and-hare cycle detection finds the cycle entry — that's the duplicate.",
      ],
      examples: [
        { input: "[1,3,4,2,2]", expectedOutput: "2" },
        { input: "[3,1,3,4,2]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const dup = ri(rng, 1, n);
        const base = Array.from({ length: n }, (_, i) => i + 1);
        const nums = shuffle(rng, [...base, dup]);
        return { input: fmtIntArr(nums), expectedOutput: String(dup) };
      },
      solutions: {
        python: `from typing import List\n\ndef findDuplicate(nums: List[int]) -> int:\n    slow = nums[0]\n    fast = nums[nums[0]]\n    while slow != fast:\n        slow = nums[slow]\n        fast = nums[nums[fast]]\n    slow = 0\n    while slow != fast:\n        slow = nums[slow]\n        fast = nums[fast]\n    return slow`,
        javascript: `var findDuplicate = function(nums) {\n    let slow = nums[0];\n    let fast = nums[nums[0]];\n    while (slow !== fast) {\n        slow = nums[slow];\n        fast = nums[nums[fast]];\n    }\n    slow = 0;\n    while (slow !== fast) {\n        slow = nums[slow];\n        fast = nums[fast];\n    }\n    return slow;\n};`,
      },
    };
  })(),

  // ── Merge Sorted Array ──────────────────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => [...a, ...b].sort((x, y) => x - y);
    return {
      slug: "merge-sorted-array",
      title: "Merge Sorted Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Sorting"],
      signature: { funcName: "merge", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given two integer arrays `nums1` and `nums2`, both sorted in **non-decreasing order**. Merge them into a single array sorted in non-decreasing order and return it.",
        [
          { in: "nums1 = [1,2,3], nums2 = [2,5,6]", out: "[1,2,2,3,5,6]" },
          { in: "nums1 = [1], nums2 = []", out: "[1]" },
        ],
        ["0 <= nums1.length, nums2.length <= 30", "-100 <= values <= 100", "Both inputs are sorted."]),
      hints: [
        "Walk both arrays with one pointer each, always taking the smaller front element.",
        "When one array runs out, append the rest of the other.",
      ],
      examples: [
        { input: "[1,2,3]\n[2,5,6]", expectedOutput: "[1,2,2,3,5,6]" },
        { input: "[1]\n[]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const a = genArr(rng, [0, 30], [-100, 100]).sort((x, y) => x - y);
        const b = genArr(rng, [0, 30], [-100, 100]).sort((x, y) => x - y);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: `from typing import List\n\ndef merge(nums1: List[int], nums2: List[int]) -> List[int]:\n    out = []\n    i = j = 0\n    while i < len(nums1) and j < len(nums2):\n        if nums1[i] <= nums2[j]:\n            out.append(nums1[i]); i += 1\n        else:\n            out.append(nums2[j]); j += 1\n    out.extend(nums1[i:])\n    out.extend(nums2[j:])\n    return out`,
        javascript: `var merge = function(nums1, nums2) {\n    const out = [];\n    let i = 0, j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] <= nums2[j]) out.push(nums1[i++]);\n        else out.push(nums2[j++]);\n    }\n    while (i < nums1.length) out.push(nums1[i++]);\n    while (j < nums2.length) out.push(nums2[j++]);\n    return out;\n};`,
      },
    };
  })(),

  // ── First Missing Positive ──────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = new Set(nums);
      let i = 1;
      while (s.has(i)) i++;
      return i;
    };
    return {
      slug: "first-missing-positive",
      title: "First Missing Positive",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table"],
      signature: { funcName: "firstMissingPositive", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an unsorted integer array `nums`, return the **smallest positive integer** that is not present.\n\nAn `O(n)` time, `O(1)` extra-space solution exists (index marking).",
        [
          { in: "nums = [1,2,0]", out: "3" },
          { in: "nums = [3,4,-1,1]", out: "2" },
          { in: "nums = [7,8,9,11,12]", out: "1" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100"]),
      hints: [
        "The answer is always between 1 and n+1 inclusive.",
        "Try to place each value v at index v-1, then scan for the first index where nums[i] != i+1.",
      ],
      examples: [
        { input: "[1,2,0]", expectedOutput: "3" },
        { input: "[3,4,-1,1]", expectedOutput: "2" },
        { input: "[7,8,9,11,12]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-15, 35]);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef firstMissingPositive(nums: List[int]) -> int:\n    s = set(nums)\n    i = 1\n    while i in s:\n        i += 1\n    return i`,
        javascript: `var firstMissingPositive = function(nums) {\n    const s = new Set(nums);\n    let i = 1;\n    while (s.has(i)) i++;\n    return i;\n};`,
      },
    };
  })(),

  // ── Trapping Rain Water ─────────────────────────────────────────
  (() => {
    const ref = (h: number[]) => {
      let l = 0, r = h.length - 1, lm = 0, rm = 0, water = 0;
      while (l < r) {
        if (h[l] < h[r]) {
          lm = Math.max(lm, h[l]);
          water += lm - h[l];
          l++;
        } else {
          rm = Math.max(rm, h[r]);
          water += rm - h[r];
          r--;
        }
      }
      return water;
    };
    return {
      slug: "trapping-rain-water",
      title: "Trapping Rain Water",
      difficulty: "HARD" as const,
      tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
      signature: { funcName: "trap", params: [{ name: "height", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute **how much water it can trap** after raining.",
        [
          { in: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", out: "6" },
          { in: "height = [4,2,0,3,2,5]", out: "9" },
        ],
        ["1 <= height.length <= 30", "0 <= height[i] <= 100"]),
      hints: [
        "Water above position i is min(maxLeft, maxRight) - height[i].",
        "Two pointers moving inward, tracking the running max from each side, gives O(n)/O(1).",
      ],
      examples: [
        { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6" },
        { input: "[4,2,0,3,2,5]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const h = genArr(rng, [1, 30], [0, 100]);
        return { input: fmtIntArr(h), expectedOutput: String(ref(h)) };
      },
      solutions: {
        python: `from typing import List\n\ndef trap(height: List[int]) -> int:\n    l, r = 0, len(height) - 1\n    lm = rm = water = 0\n    while l < r:\n        if height[l] < height[r]:\n            lm = max(lm, height[l])\n            water += lm - height[l]\n            l += 1\n        else:\n            rm = max(rm, height[r])\n            water += rm - height[r]\n            r -= 1\n    return water`,
        javascript: `var trap = function(height) {\n    let l = 0, r = height.length - 1;\n    let lm = 0, rm = 0, water = 0;\n    while (l < r) {\n        if (height[l] < height[r]) {\n            lm = Math.max(lm, height[l]);\n            water += lm - height[l];\n            l++;\n        } else {\n            rm = Math.max(rm, height[r]);\n            water += rm - height[r];\n            r--;\n        }\n    }\n    return water;\n};`,
      },
    };
  })(),

];
