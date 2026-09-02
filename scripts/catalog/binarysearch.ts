/** Binary Search — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const distinctSorted = (rng: Rng, len: [number, number], val: [number, number]) => {
  const pool = shuffle(rng, Array.from({ length: val[1] - val[0] + 1 }, (_, i) => i + val[0]));
  return pool.slice(0, ri(rng, len[0], len[1])).sort((a, b) => a - b);
};

export const BINARY_SEARCH_PROBLEMS: CatalogProblem[] = [

  // ── Binary Search ───────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      let lo = 0, hi = nums.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      return -1;
    };
    return {
      slug: "binary-search",
      title: "Binary Search",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search"],
      signature: { funcName: "search", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a sorted (ascending) array `nums` of **distinct** integers and a `target`, return the index of `target` if it exists, otherwise `-1`.\n\nYour algorithm must run in `O(log n)` time.",
        [
          { in: "nums = [-1,0,3,5,9,12], target = 9", out: "4" },
          { in: "nums = [-1,0,3,5,9,12], target = 2", out: "-1" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i], target <= 100", "All values are distinct; nums is sorted ascending."]),
      hints: [
        "Compare the middle element with the target and discard half the array.",
        "Careful with the loop condition: lo <= hi, and move past mid on each side.",
      ],
      examples: [
        { input: "[-1,0,3,5,9,12]\n9", expectedOutput: "4" },
        { input: "[-1,0,3,5,9,12]\n2", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const nums = distinctSorted(rng, [1, 30], [-100, 100]);
        const target = rng() < 0.6 ? nums[ri(rng, 0, nums.length - 1)] : ri(rng, -100, 100);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef search(nums: List[int], target: int) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1`,
        javascript: `var search = function(nums, target) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] === target) return mid;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n};`,
      },
    };
  })(),

  // ── Search Insert Position ──────────────────────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      let lo = 0, hi = nums.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    };
    return {
      slug: "search-insert-position",
      title: "Search Insert Position",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search"],
      signature: { funcName: "searchInsert", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a sorted array of **distinct** integers and a `target`, return the index of `target` if found; otherwise return the index where it **would be inserted** to keep the order.\n\nMust run in `O(log n)`.",
        [
          { in: "nums = [1,3,5,6], target = 5", out: "2" },
          { in: "nums = [1,3,5,6], target = 2", out: "1" },
          { in: "nums = [1,3,5,6], target = 7", out: "4" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i], target <= 100", "Distinct sorted values."]),
      hints: [
        "This is lower_bound: the first index whose value is >= target.",
        "Use half-open bounds [lo, hi) and shrink until they meet.",
      ],
      examples: [
        { input: "[1,3,5,6]\n5", expectedOutput: "2" },
        { input: "[1,3,5,6]\n2", expectedOutput: "1" },
        { input: "[1,3,5,6]\n7", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const nums = distinctSorted(rng, [1, 30], [-100, 100]);
        const target = rng() < 0.5 ? nums[ri(rng, 0, nums.length - 1)] : ri(rng, -100, 100);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef searchInsert(nums: List[int], target: int) -> int:\n    lo, hi = 0, len(nums)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo`,
        javascript: `var searchInsert = function(nums, target) {\n    let lo = 0, hi = nums.length;\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n};`,
      },
    };
  })(),

  // ── Sqrt(x) ─────────────────────────────────────────────────────
  (() => {
    const ref = (x: number) => {
      let r = Math.floor(Math.sqrt(x));
      while ((r + 1) * (r + 1) <= x) r++;
      while (r * r > x) r--;
      return r;
    };
    return {
      slug: "sqrt-x",
      title: "Sqrt(x)",
      difficulty: "EASY" as const,
      tags: ["Math", "Binary Search"],
      signature: { funcName: "mySqrt", params: [{ name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a non-negative integer `x`, return the **square root of `x` rounded down** to the nearest integer.\n\nDo **not** use any built-in exponent function or operator (`sqrt`, `pow`, `**`, …).",
        [
          { in: "x = 4", out: "2" },
          { in: "x = 8", out: "2", note: "√8 ≈ 2.828…, rounded down is 2." },
        ],
        ["0 <= x <= 2147483647"]),
      hints: [
        "Binary search the answer k on the condition k*k <= x.",
        "Watch for overflow in languages with fixed-size integers — compare k <= x / k instead.",
      ],
      examples: [
        { input: "4", expectedOutput: "2" },
        { input: "8", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const x = rng() < 0.3 ? ri(rng, 0, 100) : rng() < 0.5 ? ri(rng, 0, 100000) : ri(rng, 0, 2147483647);
        return { input: String(x), expectedOutput: String(ref(x)) };
      },
      solutions: {
        python: `def mySqrt(x: int) -> int:\n    lo, hi = 0, x\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if mid * mid <= x:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return hi`,
        javascript: `var mySqrt = function(x) {\n    let lo = 0, hi = x;\n    while (lo <= hi) {\n        const mid = Math.floor((lo + hi) / 2);\n        if (mid * mid <= x) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return hi;\n};`,
      },
    };
  })(),

  // ── Valid Perfect Square ────────────────────────────────────────
  (() => {
    const ref = (num: number) => {
      const r = Math.round(Math.sqrt(num));
      return r * r === num;
    };
    return {
      slug: "valid-perfect-square",
      title: "Valid Perfect Square",
      difficulty: "EASY" as const,
      tags: ["Math", "Binary Search"],
      signature: { funcName: "isPerfectSquare", params: [{ name: "num", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given a positive integer `num`, return `true` if it is a **perfect square** (an integer times itself), without using any built-in sqrt function.",
        [
          { in: "num = 16", out: "true", note: "4 × 4 = 16." },
          { in: "num = 14", out: "false" },
        ],
        ["1 <= num <= 2147483647"]),
      hints: [
        "Binary search k in [1, num] on k*k versus num.",
        "Newton's method converges even faster: k = (k + num/k) / 2.",
      ],
      examples: [
        { input: "16", expectedOutput: "true" },
        { input: "14", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.5 ? ri(rng, 1, 46340) ** 2 : ri(rng, 1, 2147483647);
        return { input: String(num), expectedOutput: bool(ref(num)) };
      },
      solutions: {
        python: `def isPerfectSquare(num: int) -> bool:\n    lo, hi = 1, num\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        sq = mid * mid\n        if sq == num:\n            return True\n        if sq < num:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return False`,
        javascript: `var isPerfectSquare = function(num) {\n    let lo = 1, hi = num;\n    while (lo <= hi) {\n        const mid = Math.floor((lo + hi) / 2);\n        const sq = mid * mid;\n        if (sq === num) return true;\n        if (sq < num) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n};`,
      },
    };
  })(),

  // ── Search in Rotated Sorted Array ──────────────────────────────
  (() => {
    const ref = (nums: number[], target: number) => nums.indexOf(target);
    return {
      slug: "search-in-rotated-sorted-array",
      title: "Search in Rotated Sorted Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search"],
      signature: { funcName: "search", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "An ascending array of **distinct** values was rotated at an unknown pivot (e.g. `[0,1,2,4,5,6,7]` → `[4,5,6,7,0,1,2]`). Given the rotated array `nums` and a `target`, return the index of `target`, or `-1` if absent.\n\nMust run in `O(log n)` time.",
        [
          { in: "nums = [4,5,6,7,0,1,2], target = 0", out: "4" },
          { in: "nums = [4,5,6,7,0,1,2], target = 3", out: "-1" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i], target <= 100", "Distinct values, rotated ascending array."]),
      hints: [
        "At any mid, at least one half of the array is properly sorted.",
        "Check whether the target lies inside the sorted half; recurse into the correct side.",
      ],
      examples: [
        { input: "[4,5,6,7,0,1,2]\n0", expectedOutput: "4" },
        { input: "[4,5,6,7,0,1,2]\n3", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const sorted = distinctSorted(rng, [1, 30], [-100, 100]);
        const k = ri(rng, 0, sorted.length - 1);
        const nums = [...sorted.slice(k), ...sorted.slice(0, k)];
        const target = rng() < 0.6 ? nums[ri(rng, 0, nums.length - 1)] : ri(rng, -100, 100);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef search(nums: List[int], target: int) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[lo] <= nums[mid]:\n            if nums[lo] <= target < nums[mid]:\n                hi = mid - 1\n            else:\n                lo = mid + 1\n        else:\n            if nums[mid] < target <= nums[hi]:\n                lo = mid + 1\n            else:\n                hi = mid - 1\n    return -1`,
        javascript: `var search = function(nums, target) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] === target) return mid;\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;\n            else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return -1;\n};`,
      },
    };
  })(),

  // ── Find Minimum in Rotated Sorted Array ────────────────────────
  (() => {
    const ref = (nums: number[]) => Math.min(...nums);
    return {
      slug: "find-minimum-in-rotated-sorted-array",
      title: "Find Minimum in Rotated Sorted Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search"],
      signature: { funcName: "findMin", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A sorted ascending array of **unique** elements was rotated between 1 and n times. Given the rotated array `nums`, return its **minimum element** in `O(log n)` time.",
        [
          { in: "nums = [3,4,5,1,2]", out: "1", note: "[1,2,3,4,5] rotated 3 times." },
          { in: "nums = [4,5,6,7,0,1,2]", out: "0" },
          { in: "nums = [11,13,15,17]", out: "11", note: "Rotated 4 times — back to sorted." },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100", "Unique values."]),
      hints: [
        "Compare nums[mid] with nums[hi]: if greater, the minimum is to the right of mid.",
        "Shrink toward the unsorted side until lo == hi.",
      ],
      examples: [
        { input: "[3,4,5,1,2]", expectedOutput: "1" },
        { input: "[4,5,6,7,0,1,2]", expectedOutput: "0" },
        { input: "[11,13,15,17]", expectedOutput: "11" },
      ],
      gen: (rng: Rng) => {
        const sorted = distinctSorted(rng, [1, 30], [-100, 100]);
        const k = ri(rng, 0, sorted.length - 1);
        const nums = [...sorted.slice(k), ...sorted.slice(0, k)];
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMin(nums: List[int]) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] > nums[hi]:\n            lo = mid + 1\n        else:\n            hi = mid\n    return nums[lo]`,
        javascript: `var findMin = function(nums) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else hi = mid;\n    }\n    return nums[lo];\n};`,
      },
    };
  })(),

  // ── Find Peak Element (unique peak) ─────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let i = 1; i < nums.length; i++) if (nums[i] > nums[best]) best = i;
      return best;
    };
    return {
      slug: "find-peak-element",
      title: "Find Peak Element",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search"],
      signature: { funcName: "findPeakElement", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **peak** element is strictly greater than its neighbors. Given an array `nums` that **strictly increases and then strictly decreases** (so it has exactly one peak), return the **index of the peak** in `O(log n)` time.\n\n(Either part may be empty: a strictly increasing or strictly decreasing array peaks at an end.)",
        [
          { in: "nums = [1,2,3,1]", out: "2", note: "3 is the peak, at index 2." },
          { in: "nums = [1,2,1,0,-1]", out: "1" },
        ],
        ["1 <= nums.length <= 30", "-1000 <= nums[i] <= 1000", "nums strictly increases then strictly decreases (exactly one peak)."]),
      hints: [
        "Compare nums[mid] with nums[mid+1]: rising means the peak is to the right.",
        "Falling means the peak is at mid or to the left.",
      ],
      examples: [
        { input: "[1,2,3,1]", expectedOutput: "2" },
        { input: "[1,2,1,0,-1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const upLen = ri(rng, 0, 15);
        const downLen = ri(rng, 0, 14);
        const peak = ri(rng, 100, 1000);
        const up: number[] = [];
        let v = peak;
        for (let i = 0; i < upLen; i++) { v -= ri(rng, 1, 8); up.push(v); }
        up.reverse();
        const down: number[] = [];
        v = peak;
        for (let i = 0; i < downLen; i++) { v -= ri(rng, 1, 8); down.push(v); }
        const nums = [...up, peak, ...down];
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findPeakElement(nums: List[int]) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] < nums[mid + 1]:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo`,
        javascript: `var findPeakElement = function(nums) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] < nums[mid + 1]) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n};`,
      },
    };
  })(),

  // ── Find First and Last Position ────────────────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      const first = nums.indexOf(target);
      const last = nums.lastIndexOf(target);
      return [first, last];
    };
    return {
      slug: "find-first-and-last-position",
      title: "Find First and Last Position of Element in Sorted Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search"],
      signature: { funcName: "searchRange", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given a non-decreasing array `nums`, find the **first and last index** of a given `target` value, returned as `[start, end]`. If the target is absent, return `[-1,-1]`.\n\nMust run in `O(log n)` time.",
        [
          { in: "nums = [5,7,7,8,8,10], target = 8", out: "[3,4]" },
          { in: "nums = [5,7,7,8,8,10], target = 6", out: "[-1,-1]" },
          { in: "nums = [], target = 0", out: "[-1,-1]" },
        ],
        ["0 <= nums.length <= 30", "-100 <= nums[i], target <= 100", "nums is sorted non-decreasing."]),
      hints: [
        "Run two binary searches: lower_bound(target) and lower_bound(target+1) - 1.",
        "If lower_bound lands outside or on a different value, the target is absent.",
      ],
      examples: [
        { input: "[5,7,7,8,8,10]\n8", expectedOutput: "[3,4]" },
        { input: "[5,7,7,8,8,10]\n6", expectedOutput: "[-1,-1]" },
        { input: "[]\n0", expectedOutput: "[-1,-1]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 0, 30) }, () => ri(rng, -20, 20)).sort((a, b) => a - b);
        const target = nums.length > 0 && rng() < 0.6 ? nums[ri(rng, 0, nums.length - 1)] : ri(rng, -20, 20);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: fmtIntArr(ref(nums, target)) };
      },
      solutions: {
        python: `from typing import List\nimport bisect\n\ndef searchRange(nums: List[int], target: int) -> List[int]:\n    lo = bisect.bisect_left(nums, target)\n    if lo == len(nums) or nums[lo] != target:\n        return [-1, -1]\n    hi = bisect.bisect_right(nums, target) - 1\n    return [lo, hi]`,
        javascript: `var searchRange = function(nums, target) {\n    function lowerBound(t) {\n        let lo = 0, hi = nums.length;\n        while (lo < hi) {\n            const mid = (lo + hi) >> 1;\n            if (nums[mid] < t) lo = mid + 1;\n            else hi = mid;\n        }\n        return lo;\n    }\n    const lo = lowerBound(target);\n    if (lo === nums.length || nums[lo] !== target) return [-1, -1];\n    return [lo, lowerBound(target + 1) - 1];\n};`,
      },
    };
  })(),

  // ── Koko Eating Bananas ─────────────────────────────────────────
  (() => {
    const ref = (piles: number[], h: number) => {
      const hours = (k: number) => piles.reduce((acc, p) => acc + Math.ceil(p / k), 0);
      let lo = 1, hi = Math.max(...piles);
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (hours(mid) <= h) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "koko-eating-bananas",
      title: "Koko Eating Bananas",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search"],
      signature: { funcName: "minEatingSpeed", params: [{ name: "piles", type: "int[]" as const }, { name: "h", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Koko has `piles[i]` bananas in the `i`-th pile and `h` hours before the guards return. Each hour she picks one pile and eats up to `k` bananas from it (a smaller pile still uses the whole hour).\n\nReturn the **minimum integer speed `k`** that lets her finish all bananas within `h` hours.",
        [
          { in: "piles = [3,6,7,11], h = 8", out: "4" },
          { in: "piles = [30,11,23,4,20], h = 5", out: "30" },
          { in: "piles = [30,11,23,4,20], h = 6", out: "23" },
        ],
        ["1 <= piles.length <= 20", "piles.length <= h <= 200", "1 <= piles[i] <= 1000"]),
      hints: [
        "For a fixed k, hours needed = Σ ceil(piles[i]/k) — monotonically decreasing in k.",
        "Binary search the smallest k whose total hours <= h.",
      ],
      examples: [
        { input: "[3,6,7,11]\n8", expectedOutput: "4" },
        { input: "[30,11,23,4,20]\n5", expectedOutput: "30" },
        { input: "[30,11,23,4,20]\n6", expectedOutput: "23" },
      ],
      gen: (rng: Rng) => {
        const piles = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 1, 1000));
        const h = ri(rng, piles.length, 200);
        return { input: `${fmtIntArr(piles)}\n${h}`, expectedOutput: String(ref(piles, h)) };
      },
      solutions: {
        python: `from typing import List\nimport math\n\ndef minEatingSpeed(piles: List[int], h: int) -> int:\n    lo, hi = 1, max(piles)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        hours = sum(math.ceil(p / mid) for p in piles)\n        if hours <= h:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var minEatingSpeed = function(piles, h) {\n    let lo = 1, hi = Math.max.apply(null, piles);\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        let hours = 0;\n        for (const p of piles) hours += Math.ceil(p / mid);\n        if (hours <= h) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n};`,
      },
    };
  })(),

  // ── Capacity To Ship Packages Within D Days ─────────────────────
  (() => {
    const ref = (weights: number[], days: number) => {
      const daysNeeded = (cap: number) => {
        let d = 1, load = 0;
        for (const w of weights) {
          if (load + w > cap) { d++; load = 0; }
          load += w;
        }
        return d;
      };
      let lo = Math.max(...weights), hi = weights.reduce((a, b) => a + b, 0);
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (daysNeeded(mid) <= days) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "capacity-to-ship-packages",
      title: "Capacity To Ship Packages Within D Days",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy"],
      signature: { funcName: "shipWithinDays", params: [{ name: "weights", type: "int[]" as const }, { name: "days", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Packages must be shipped **in order** within `days` days. Each day the ship loads consecutive packages up to its weight capacity.\n\nReturn the **least capacity** that ships everything within `days` days.",
        [
          { in: "weights = [1,2,3,4,5,6,7,8,9,10], days = 5", out: "15", note: "Days: (1,2,3,4,5), (6,7), (8), (9), (10)." },
          { in: "weights = [3,2,2,4,1,4], days = 3", out: "6" },
        ],
        ["1 <= weights.length <= 25", "1 <= days <= weights.length", "1 <= weights[i] <= 500"]),
      hints: [
        "For a fixed capacity, greedily fill each day — that gives the days needed, monotone in capacity.",
        "Binary search capacity between max(weights) and sum(weights).",
      ],
      examples: [
        { input: "[1,2,3,4,5,6,7,8,9,10]\n5", expectedOutput: "15" },
        { input: "[3,2,2,4,1,4]\n3", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const weights = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 1, 500));
        const days = ri(rng, 1, weights.length);
        return { input: `${fmtIntArr(weights)}\n${days}`, expectedOutput: String(ref(weights, days)) };
      },
      solutions: {
        python: `from typing import List\n\ndef shipWithinDays(weights: List[int], days: int) -> int:\n    def days_needed(cap: int) -> int:\n        d = 1\n        load = 0\n        for w in weights:\n            if load + w > cap:\n                d += 1\n                load = 0\n            load += w\n        return d\n\n    lo, hi = max(weights), sum(weights)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if days_needed(mid) <= days:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var shipWithinDays = function(weights, days) {\n    function daysNeeded(cap) {\n        let d = 1, load = 0;\n        for (const w of weights) {\n            if (load + w > cap) { d++; load = 0; }\n            load += w;\n        }\n        return d;\n    }\n    let lo = Math.max.apply(null, weights);\n    let hi = weights.reduce(function(a, b) { return a + b; }, 0);\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        if (daysNeeded(mid) <= days) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n};`,
      },
    };
  })(),

  // ── Single Element in a Sorted Array ────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let acc = 0;
      for (const x of nums) acc ^= x;
      return acc;
    };
    return {
      slug: "single-element-in-a-sorted-array",
      title: "Single Element in a Sorted Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search"],
      signature: { funcName: "singleNonDuplicate", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given a **sorted** array where every element appears exactly **twice**, except one element that appears once. Return that single element in `O(log n)` time and `O(1)` space.",
        [
          { in: "nums = [1,1,2,3,3,4,4,8,8]", out: "2" },
          { in: "nums = [3,3,7,7,10,11,11]", out: "10" },
        ],
        ["1 <= nums.length <= 31 (odd)", "0 <= nums[i] <= 100", "Sorted; every value twice except one."]),
      hints: [
        "Before the single element, pairs start at even indices; after it, they start at odd indices.",
        "Binary search on that parity flip.",
      ],
      examples: [
        { input: "[1,1,2,3,3,4,4,8,8]", expectedOutput: "2" },
        { input: "[3,3,7,7,10,11,11]", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const pairCount = ri(rng, 0, 15);
        const pool = shuffle(rng, Array.from({ length: 101 }, (_, i) => i));
        const vals = pool.slice(0, pairCount + 1);
        const single = vals[vals.length - 1];
        const nums = [...vals.slice(0, pairCount), ...vals.slice(0, pairCount), single].sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: String(single) };
      },
      solutions: {
        python: `from typing import List\n\ndef singleNonDuplicate(nums: List[int]) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if mid % 2 == 1:\n            mid -= 1\n        if nums[mid] == nums[mid + 1]:\n            lo = mid + 2\n        else:\n            hi = mid\n    return nums[lo]`,
        javascript: `var singleNonDuplicate = function(nums) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        let mid = (lo + hi) >> 1;\n        if (mid % 2 === 1) mid--;\n        if (nums[mid] === nums[mid + 1]) lo = mid + 2;\n        else hi = mid;\n    }\n    return nums[lo];\n};`,
      },
    };
  })(),

  // ── Arranging Coins ─────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let k = 0;
      while ((k + 1) * (k + 2) / 2 <= n) k++;
      return k;
    };
    return {
      slug: "arranging-coins",
      title: "Arranging Coins",
      difficulty: "EASY" as const,
      tags: ["Math", "Binary Search"],
      signature: { funcName: "arrangeCoins", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have `n` coins and build a staircase where the `i`-th row has exactly `i` coins. Return the number of **complete rows** you can build.",
        [
          { in: "n = 5", out: "2", note: "Rows 1 + 2 = 3 coins; the third row is incomplete." },
          { in: "n = 8", out: "3", note: "1 + 2 + 3 = 6; the fourth row is incomplete." },
        ],
        ["1 <= n <= 100000000"]),
      hints: [
        "k complete rows use k(k+1)/2 coins.",
        "Binary search (or solve the quadratic) for the largest k with k(k+1)/2 <= n.",
      ],
      examples: [
        { input: "5", expectedOutput: "2" },
        { input: "8", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.4 ? ri(rng, 1, 1000) : ri(rng, 1, 100000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def arrangeCoins(n: int) -> int:\n    lo, hi = 0, n\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if mid * (mid + 1) // 2 <= n:\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var arrangeCoins = function(n) {\n    let lo = 0, hi = n;\n    while (lo < hi) {\n        const mid = Math.floor((lo + hi + 1) / 2);\n        if (mid * (mid + 1) / 2 <= n) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n};`,
      },
    };
  })(),

];
