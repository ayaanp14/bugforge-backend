/** Two Pointers & Sliding Window — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, ri, randLower, shuffle, type CatalogProblem, type Rng } from "./types.js";

const genArr = (rng: Rng, len: [number, number], val: [number, number]) =>
  Array.from({ length: ri(rng, len[0], len[1]) }, () => ri(rng, val[0], val[1]));

export const TWO_POINTER_PROBLEMS: CatalogProblem[] = [

  // ── Two Sum II — Input Array Is Sorted ──────────────────────────
  (() => {
    const ref = (numbers: number[], target: number) => {
      let l = 0, r = numbers.length - 1;
      while (l < r) {
        const sum = numbers[l] + numbers[r];
        if (sum === target) return [l + 1, r + 1];
        if (sum < target) l++;
        else r--;
      }
      return [-1, -1];
    };
    return {
      slug: "two-sum-ii-input-array-is-sorted",
      title: "Two Sum II - Input Array Is Sorted",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search"],
      signature: { funcName: "twoSum", params: [{ name: "numbers", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given a **1-indexed** array `numbers` sorted in non-decreasing order, find two numbers that add up to `target` and return their indices `[index1, index2]` with `index1 < index2`.\n\nThe tests are constructed so that there is **exactly one solution**. Your solution must use only constant extra space.",
        [
          { in: "numbers = [2,7,11,15], target = 9", out: "[1,2]", note: "2 + 7 = 9." },
          { in: "numbers = [2,3,4], target = 6", out: "[1,3]" },
        ],
        ["2 <= numbers.length <= 25", "-500 <= numbers[i] <= 500", "numbers is sorted; exactly one solution exists."]),
      hints: [
        "One pointer at each end: the sum tells you which pointer to move.",
        "Sum too small → move left pointer right; too big → move right pointer left.",
      ],
      examples: [
        { input: "[2,7,11,15]\n9", expectedOutput: "[1,2]" },
        { input: "[2,3,4]\n6", expectedOutput: "[1,3]" },
      ],
      gen: (rng: Rng) => {
        for (let attempt = 0; attempt < 60; attempt++) {
          const pool = shuffle(rng, Array.from({ length: 1001 }, (_, i) => i - 500));
          const nums = pool.slice(0, ri(rng, 2, 25)).sort((a, b) => a - b);
          const sums = new Map<number, number>();
          for (let i = 0; i < nums.length; i++) {
            for (let j = i + 1; j < nums.length; j++) {
              sums.set(nums[i] + nums[j], (sums.get(nums[i] + nums[j]) || 0) + 1);
            }
          }
          const unique = [...sums.entries()].filter(([, c]) => c === 1).map(([t]) => t);
          if (unique.length > 0) {
            const target = unique[ri(rng, 0, unique.length - 1)];
            return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: fmtIntArr(ref(nums, target)) };
          }
        }
        return { input: "[2,7,11,15]\n9", expectedOutput: "[1,2]" };
      },
      solutions: {
        python: `from typing import List\n\ndef twoSum(numbers: List[int], target: int) -> List[int]:\n    l, r = 0, len(numbers) - 1\n    while l < r:\n        s = numbers[l] + numbers[r]\n        if s == target:\n            return [l + 1, r + 1]\n        if s < target:\n            l += 1\n        else:\n            r -= 1\n    return [-1, -1]`,
        javascript: `var twoSum = function(numbers, target) {\n    let l = 0, r = numbers.length - 1;\n    while (l < r) {\n        const sum = numbers[l] + numbers[r];\n        if (sum === target) return [l + 1, r + 1];\n        if (sum < target) l++;\n        else r--;\n    }\n    return [-1, -1];\n};`,
      },
    };
  })(),

  // ── Container With Most Water ───────────────────────────────────
  (() => {
    const ref = (height: number[]) => {
      let l = 0, r = height.length - 1, best = 0;
      while (l < r) {
        best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
        if (height[l] < height[r]) l++;
        else r--;
      }
      return best;
    };
    return {
      slug: "container-with-most-water",
      title: "Container With Most Water",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Greedy"],
      signature: { funcName: "maxArea", params: [{ name: "height", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `height` of length `n`; the `i`-th vertical line goes from `(i, 0)` to `(i, height[i])`. Find two lines that, with the x-axis, form a container holding the **most water**, and return that maximum amount.\n\nThe container may not be slanted.",
        [
          { in: "height = [1,8,6,2,5,4,8,3,7]", out: "49", note: "Lines at index 1 and 8: min(8,7) × 7 = 49." },
          { in: "height = [1,1]", out: "1" },
        ],
        ["2 <= height.length <= 30", "0 <= height[i] <= 100"]),
      hints: [
        "Area = min(h[l], h[r]) × (r - l).",
        "Moving the taller side inward can never help — always move the shorter one.",
      ],
      examples: [
        { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49" },
        { input: "[1,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const h = genArr(rng, [2, 30], [0, 100]);
        return { input: fmtIntArr(h), expectedOutput: String(ref(h)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxArea(height: List[int]) -> int:\n    l, r = 0, len(height) - 1\n    best = 0\n    while l < r:\n        best = max(best, min(height[l], height[r]) * (r - l))\n        if height[l] < height[r]:\n            l += 1\n        else:\n            r -= 1\n    return best`,
        javascript: `var maxArea = function(height) {\n    let l = 0, r = height.length - 1, best = 0;\n    while (l < r) {\n        best = Math.max(best, Math.min(height[l], height[r]) * (r - l));\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return best;\n};`,
      },
    };
  })(),

  // ── Is Subsequence ──────────────────────────────────────────────
  (() => {
    const ref = (s: string, t: string) => {
      let i = 0;
      for (const ch of t) if (i < s.length && s[i] === ch) i++;
      return i === s.length;
    };
    return {
      slug: "is-subsequence",
      title: "Is Subsequence",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "Dynamic Programming"],
      signature: { funcName: "isSubsequence", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given two strings `s` and `t`, return `true` if `s` is a **subsequence** of `t` — obtainable from `t` by deleting some (possibly zero) characters without changing the order of the rest.",
        [
          { in: 's = "abc", t = "ahbgdc"', out: "true" },
          { in: 's = "axc", t = "ahbgdc"', out: "false" },
        ],
        ["0 <= s.length <= 10", "0 <= t.length <= 30", "Lowercase English letters."]),
      hints: [
        "Walk through t once, advancing a pointer into s on every match.",
        "s is a subsequence exactly when the s-pointer reaches the end.",
      ],
      examples: [
        { input: '"abc"\n"ahbgdc"', expectedOutput: "true" },
        { input: '"axc"\n"ahbgdc"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const t = randLower(rng, 0, 30, "abcd");
        let s: string;
        if (rng() < 0.5 && t.length > 0) {
          s = [...t].filter(() => rng() < 0.3).slice(0, 10).join("");
        } else {
          s = randLower(rng, 0, 10, "abcd");
        }
        return { input: `"${s}"\n"${t}"`, expectedOutput: bool(ref(s, t)) };
      },
      solutions: {
        python: `def isSubsequence(s: str, t: str) -> bool:\n    i = 0\n    for ch in t:\n        if i < len(s) and s[i] == ch:\n            i += 1\n    return i == len(s)`,
        javascript: `var isSubsequence = function(s, t) {\n    let i = 0;\n    for (const ch of t) {\n        if (i < s.length && s[i] === ch) i++;\n    }\n    return i === s.length;\n};`,
      },
    };
  })(),

  // ── Valid Palindrome II ─────────────────────────────────────────
  (() => {
    const isPal = (s: string, l: number, r: number) => {
      while (l < r) {
        if (s[l] !== s[r]) return false;
        l++; r--;
      }
      return true;
    };
    const ref = (s: string) => {
      let l = 0, r = s.length - 1;
      while (l < r) {
        if (s[l] !== s[r]) return isPal(s, l + 1, r) || isPal(s, l, r - 1);
        l++; r--;
      }
      return true;
    };
    return {
      slug: "valid-palindrome-ii",
      title: "Valid Palindrome II",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "Greedy"],
      signature: { funcName: "validPalindrome", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given a string `s`, return `true` if it can be a palindrome after deleting **at most one** character.",
        [
          { in: 's = "aba"', out: "true" },
          { in: 's = "abca"', out: "true", note: 'Delete the "c".' },
          { in: 's = "abc"', out: "false" },
        ],
        ["1 <= s.length <= 40", "Lowercase English letters."]),
      hints: [
        "Two pointers as in a normal palindrome check.",
        "On the first mismatch, you get one chance: skip the left char OR the right char, then require a perfect palindrome.",
      ],
      examples: [
        { input: '"aba"', expectedOutput: "true" },
        { input: '"abca"', expectedOutput: "true" },
        { input: '"abc"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        let s: string;
        if (rng() < 0.6) {
          const half = randLower(rng, 1, 15, "abc");
          const core = half + (rng() < 0.5 ? "z" : "") + [...half].reverse().join("");
          const pos = ri(rng, 0, core.length);
          s = rng() < 0.7 ? core.slice(0, pos) + "abc"[ri(rng, 0, 2)] + core.slice(pos) : core;
        } else {
          s = randLower(rng, 1, 40, "abc");
        }
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def validPalindrome(s: str) -> bool:\n    def is_pal(l: int, r: int) -> bool:\n        while l < r:\n            if s[l] != s[r]:\n                return False\n            l += 1\n            r -= 1\n        return True\n\n    l, r = 0, len(s) - 1\n    while l < r:\n        if s[l] != s[r]:\n            return is_pal(l + 1, r) or is_pal(l, r - 1)\n        l += 1\n        r -= 1\n    return True`,
        javascript: `var validPalindrome = function(s) {\n    function isPal(l, r) {\n        while (l < r) {\n            if (s[l] !== s[r]) return false;\n            l++; r--;\n        }\n        return true;\n    }\n    let l = 0, r = s.length - 1;\n    while (l < r) {\n        if (s[l] !== s[r]) return isPal(l + 1, r) || isPal(l, r - 1);\n        l++; r--;\n    }\n    return true;\n};`,
      },
    };
  })(),

  // ── Minimum Size Subarray Sum ───────────────────────────────────
  (() => {
    const ref = (target: number, nums: number[]) => {
      let l = 0, sum = 0, best = Infinity;
      for (let r = 0; r < nums.length; r++) {
        sum += nums[r];
        while (sum >= target) {
          best = Math.min(best, r - l + 1);
          sum -= nums[l++];
        }
      }
      return best === Infinity ? 0 : best;
    };
    return {
      slug: "minimum-size-subarray-sum",
      title: "Minimum Size Subarray Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Prefix Sum"],
      signature: { funcName: "minSubArrayLen", params: [{ name: "target", type: "int" as const }, { name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of **positive** integers `nums` and a positive integer `target`, return the **minimal length** of a contiguous subarray whose sum is `>= target`. If none exists, return `0`.",
        [
          { in: "target = 7, nums = [2,3,1,2,4,3]", out: "2", note: "[4,3] has the minimal length." },
          { in: "target = 11, nums = [1,1,1,1,1,1,1,1]", out: "0" },
        ],
        ["1 <= target <= 200", "1 <= nums.length <= 30", "1 <= nums[i] <= 50"]),
      hints: [
        "All values are positive, so growing the window only increases the sum — a sliding window works.",
        "Shrink from the left while the window sum still meets the target.",
      ],
      examples: [
        { input: "7\n[2,3,1,2,4,3]", expectedOutput: "2" },
        { input: "11\n[1,1,1,1,1,1,1,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [1, 50]);
        const target = ri(rng, 1, 200);
        return { input: `${target}\n${fmtIntArr(nums)}`, expectedOutput: String(ref(target, nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minSubArrayLen(target: int, nums: List[int]) -> int:\n    l = 0\n    total = 0\n    best = float("inf")\n    for r, x in enumerate(nums):\n        total += x\n        while total >= target:\n            best = min(best, r - l + 1)\n            total -= nums[l]\n            l += 1\n    return 0 if best == float("inf") else best`,
        javascript: `var minSubArrayLen = function(target, nums) {\n    let l = 0, sum = 0, best = Infinity;\n    for (let r = 0; r < nums.length; r++) {\n        sum += nums[r];\n        while (sum >= target) {\n            best = Math.min(best, r - l + 1);\n            sum -= nums[l++];\n        }\n    }\n    return best === Infinity ? 0 : best;\n};`,
      },
    };
  })(),

  // ── Max Consecutive Ones III ────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let l = 0, zeros = 0, best = 0;
      for (let r = 0; r < nums.length; r++) {
        if (nums[r] === 0) zeros++;
        while (zeros > k) {
          if (nums[l] === 0) zeros--;
          l++;
        }
        best = Math.max(best, r - l + 1);
      }
      return best;
    };
    return {
      slug: "max-consecutive-ones-iii",
      title: "Max Consecutive Ones III",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Binary Search"],
      signature: { funcName: "longestOnes", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a binary array `nums` and an integer `k`, return the maximum number of consecutive `1`s you can obtain if you may flip **at most `k`** zeros.",
        [
          { in: "nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2", out: "6", note: "Flip the two zeros before the last group." },
          { in: "nums = [0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1], k = 3", out: "10" },
        ],
        ["1 <= nums.length <= 40", "nums[i] is 0 or 1", "0 <= k <= nums.length"]),
      hints: [
        "Maintain a window containing at most k zeros.",
        "When a new zero pushes the count over k, advance the left edge past a zero.",
      ],
      examples: [
        { input: "[1,1,1,0,0,0,1,1,1,1,0]\n2", expectedOutput: "6" },
        { input: "[0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1]\n3", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => (rng() < 0.6 ? 1 : 0));
        const k = ri(rng, 0, 6);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef longestOnes(nums: List[int], k: int) -> int:\n    l = 0\n    zeros = 0\n    best = 0\n    for r, x in enumerate(nums):\n        if x == 0:\n            zeros += 1\n        while zeros > k:\n            if nums[l] == 0:\n                zeros -= 1\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var longestOnes = function(nums, k) {\n    let l = 0, zeros = 0, best = 0;\n    for (let r = 0; r < nums.length; r++) {\n        if (nums[r] === 0) zeros++;\n        while (zeros > k) {\n            if (nums[l] === 0) zeros--;\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n};`,
      },
    };
  })(),

  // ── Fruit Into Baskets ──────────────────────────────────────────
  (() => {
    const ref = (fruits: number[]) => {
      const count = new Map<number, number>();
      let l = 0, best = 0;
      for (let r = 0; r < fruits.length; r++) {
        count.set(fruits[r], (count.get(fruits[r]) || 0) + 1);
        while (count.size > 2) {
          const f = fruits[l];
          count.set(f, count.get(f)! - 1);
          if (count.get(f) === 0) count.delete(f);
          l++;
        }
        best = Math.max(best, r - l + 1);
      }
      return best;
    };
    return {
      slug: "fruit-into-baskets",
      title: "Fruit Into Baskets",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Hash Table"],
      signature: { funcName: "totalFruit", params: [{ name: "fruits", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are visiting a row of fruit trees; `fruits[i]` is the **type** of fruit the `i`-th tree produces. You have **two baskets**, each holding only one type. Starting from any tree and moving right, you pick one fruit per tree until a tree forces a third type.\n\nReturn the **maximum number of fruits** you can pick.",
        [
          { in: "fruits = [1,2,1]", out: "3" },
          { in: "fruits = [0,1,2,2]", out: "3", note: "Pick from trees [1,2,2]." },
          { in: "fruits = [1,2,3,2,2]", out: "4", note: "Pick from trees [2,3,2,2]." },
        ],
        ["1 <= fruits.length <= 40", "0 <= fruits[i] <= 6"]),
      hints: [
        "This is 'longest subarray with at most 2 distinct values' in disguise.",
        "Track type counts in the window; shrink while there are 3 distinct types.",
      ],
      examples: [
        { input: "[1,2,1]", expectedOutput: "3" },
        { input: "[0,1,2,2]", expectedOutput: "3" },
        { input: "[1,2,3,2,2]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const fruits = genArr(rng, [1, 40], [0, 6]);
        return { input: fmtIntArr(fruits), expectedOutput: String(ref(fruits)) };
      },
      solutions: {
        python: `from typing import List\n\ndef totalFruit(fruits: List[int]) -> int:\n    count = {}\n    l = 0\n    best = 0\n    for r, f in enumerate(fruits):\n        count[f] = count.get(f, 0) + 1\n        while len(count) > 2:\n            g = fruits[l]\n            count[g] -= 1\n            if count[g] == 0:\n                del count[g]\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var totalFruit = function(fruits) {\n    const count = new Map();\n    let l = 0, best = 0;\n    for (let r = 0; r < fruits.length; r++) {\n        count.set(fruits[r], (count.get(fruits[r]) || 0) + 1);\n        while (count.size > 2) {\n            const f = fruits[l];\n            count.set(f, count.get(f) - 1);\n            if (count.get(f) === 0) count.delete(f);\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n};`,
      },
    };
  })(),

  // ── Sort Colors ─────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => [...nums].sort((a, b) => a - b);
    return {
      slug: "sort-colors",
      title: "Sort Colors",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting"],
      signature: { funcName: "sortColors", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `nums` with `n` objects colored red (`0`), white (`1`), or blue (`2`), sort them **in place** so that objects of the same color are adjacent, in the order red, white, blue, and return the array.\n\nSolve it **without** the library sort — ideally in one pass with constant extra space (the Dutch National Flag algorithm).",
        [
          { in: "nums = [2,0,2,1,1,0]", out: "[0,0,1,1,2,2]" },
          { in: "nums = [2,0,1]", out: "[0,1,2]" },
        ],
        ["1 <= nums.length <= 30", "nums[i] is 0, 1, or 2."]),
      hints: [
        "Three regions: 0s on the left, 2s on the right, 1s in the middle.",
        "Pointers low/mid/high — swap 0s to low, 2s to high, walk past 1s.",
      ],
      examples: [
        { input: "[2,0,2,1,1,0]", expectedOutput: "[0,0,1,1,2,2]" },
        { input: "[2,0,1]", expectedOutput: "[0,1,2]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [0, 2]);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sortColors(nums: List[int]) -> List[int]:\n    low, mid, high = 0, 0, len(nums) - 1\n    while mid <= high:\n        if nums[mid] == 0:\n            nums[low], nums[mid] = nums[mid], nums[low]\n            low += 1\n            mid += 1\n        elif nums[mid] == 2:\n            nums[mid], nums[high] = nums[high], nums[mid]\n            high -= 1\n        else:\n            mid += 1\n    return nums`,
        javascript: `var sortColors = function(nums) {\n    let low = 0, mid = 0, high = nums.length - 1;\n    while (mid <= high) {\n        if (nums[mid] === 0) {\n            const t = nums[low]; nums[low] = nums[mid]; nums[mid] = t;\n            low++; mid++;\n        } else if (nums[mid] === 2) {\n            const t = nums[mid]; nums[mid] = nums[high]; nums[high] = t;\n            high--;\n        } else {\n            mid++;\n        }\n    }\n    return nums;\n};`,
      },
    };
  })(),

  // ── Squares of a Sorted Array ───────────────────────────────────
  (() => {
    const ref = (nums: number[]) => nums.map((x) => x * x).sort((a, b) => a - b);
    return {
      slug: "squares-of-a-sorted-array",
      title: "Squares of a Sorted Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Sorting"],
      signature: { funcName: "sortedSquares", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` sorted in non-decreasing order, return an array of the **squares of each number**, also sorted in non-decreasing order.\n\nThe follow-up asks for an `O(n)` solution — squaring then sorting is `O(n log n)`.",
        [
          { in: "nums = [-4,-1,0,3,10]", out: "[0,1,9,16,100]" },
          { in: "nums = [-7,-3,2,3,11]", out: "[4,9,9,49,121]" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100", "nums is sorted non-decreasing."]),
      hints: [
        "The largest square is at one of the two ends of the array.",
        "Fill the output from the back using two pointers at the ends.",
      ],
      examples: [
        { input: "[-4,-1,0,3,10]", expectedOutput: "[0,1,9,16,100]" },
        { input: "[-7,-3,2,3,11]", expectedOutput: "[4,9,9,49,121]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-100, 100]).sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sortedSquares(nums: List[int]) -> List[int]:\n    n = len(nums)\n    out = [0] * n\n    l, r = 0, n - 1\n    for i in range(n - 1, -1, -1):\n        if abs(nums[l]) > abs(nums[r]):\n            out[i] = nums[l] * nums[l]\n            l += 1\n        else:\n            out[i] = nums[r] * nums[r]\n            r -= 1\n    return out`,
        javascript: `var sortedSquares = function(nums) {\n    const n = nums.length;\n    const out = new Array(n);\n    let l = 0, r = n - 1;\n    for (let i = n - 1; i >= 0; i--) {\n        if (Math.abs(nums[l]) > Math.abs(nums[r])) {\n            out[i] = nums[l] * nums[l];\n            l++;\n        } else {\n            out[i] = nums[r] * nums[r];\n            r--;\n        }\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Backspace String Compare ────────────────────────────────────
  (() => {
    const build = (s: string) => {
      const st: string[] = [];
      for (const ch of s) {
        if (ch === "#") st.pop();
        else st.push(ch);
      }
      return st.join("");
    };
    const ref = (s: string, t: string) => build(s) === build(t);
    const genStr = (rng: Rng) => Array.from({ length: ri(rng, 1, 20) }, () => (rng() < 0.3 ? "#" : "abc"[ri(rng, 0, 2)])).join("");
    return {
      slug: "backspace-string-compare",
      title: "Backspace String Compare",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "Stack"],
      signature: { funcName: "backspaceCompare", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given two strings `s` and `t`, return `true` if they are equal when both are typed into empty text editors, where `#` means **backspace**.\n\nBackspacing an empty editor leaves it empty.",
        [
          { in: 's = "ab#c", t = "ad#c"', out: "true", note: 'Both become "ac".' },
          { in: 's = "ab##", t = "c#d#"', out: "true", note: 'Both become "".' },
          { in: 's = "a#c", t = "b"', out: "false" },
        ],
        ["1 <= s.length, t.length <= 20", "Lowercase letters and '#'."]),
      hints: [
        "A stack simulates typing directly.",
        "The O(1)-space version walks both strings backwards, counting pending backspaces.",
      ],
      examples: [
        { input: '"ab#c"\n"ad#c"', expectedOutput: "true" },
        { input: '"ab##"\n"c#d#"', expectedOutput: "true" },
        { input: '"a#c"\n"b"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const s = genStr(rng);
        const t = rng() < 0.35 ? s + (rng() < 0.5 ? "x#" : "") : genStr(rng);
        return { input: `"${s}"\n"${t}"`, expectedOutput: bool(ref(s, t)) };
      },
      solutions: {
        python: `def backspaceCompare(s: str, t: str) -> bool:\n    def build(x: str) -> str:\n        st = []\n        for ch in x:\n            if ch == "#":\n                if st:\n                    st.pop()\n            else:\n                st.append(ch)\n        return "".join(st)\n\n    return build(s) == build(t)`,
        javascript: `var backspaceCompare = function(s, t) {\n    function build(x) {\n        const st = [];\n        for (const ch of x) {\n            if (ch === "#") st.pop();\n            else st.push(ch);\n        }\n        return st.join("");\n    }\n    return build(s) === build(t);\n};`,
      },
    };
  })(),

  // ── Permutation in String ───────────────────────────────────────
  (() => {
    const ref = (s1: string, s2: string) => {
      if (s1.length > s2.length) return false;
      const need = new Array(26).fill(0);
      const have = new Array(26).fill(0);
      for (const ch of s1) need[ch.charCodeAt(0) - 97]++;
      for (let i = 0; i < s2.length; i++) {
        have[s2.charCodeAt(i) - 97]++;
        if (i >= s1.length) have[s2.charCodeAt(i - s1.length) - 97]--;
        if (i >= s1.length - 1 && need.every((n, j) => n === have[j])) return true;
      }
      return false;
    };
    return {
      slug: "permutation-in-string",
      title: "Permutation in String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Hash Table"],
      signature: { funcName: "checkInclusion", params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given two strings `s1` and `s2`, return `true` if `s2` contains a **permutation of `s1`** as a substring.",
        [
          { in: 's1 = "ab", s2 = "eidbaooo"', out: "true", note: '"ba" is a permutation of "ab".' },
          { in: 's1 = "ab", s2 = "eidboaoo"', out: "false" },
        ],
        ["1 <= s1.length <= 6", "1 <= s2.length <= 40", "Lowercase English letters."]),
      hints: [
        "A permutation match is a frequency-count match over a window of length |s1|.",
        "Slide the window over s2, updating counts incrementally.",
      ],
      examples: [
        { input: '"ab"\n"eidbaooo"', expectedOutput: "true" },
        { input: '"ab"\n"eidboaoo"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const s1 = randLower(rng, 1, 6, "abc");
        const s2 = randLower(rng, 1, 40, "abc");
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: bool(ref(s1, s2)) };
      },
      solutions: {
        python: `def checkInclusion(s1: str, s2: str) -> bool:\n    if len(s1) > len(s2):\n        return False\n    need = [0] * 26\n    have = [0] * 26\n    for ch in s1:\n        need[ord(ch) - 97] += 1\n    for i, ch in enumerate(s2):\n        have[ord(ch) - 97] += 1\n        if i >= len(s1):\n            have[ord(s2[i - len(s1)]) - 97] -= 1\n        if i >= len(s1) - 1 and have == need:\n            return True\n    return False`,
        javascript: `var checkInclusion = function(s1, s2) {\n    if (s1.length > s2.length) return false;\n    const need = new Array(26).fill(0);\n    const have = new Array(26).fill(0);\n    for (const ch of s1) need[ch.charCodeAt(0) - 97]++;\n    for (let i = 0; i < s2.length; i++) {\n        have[s2.charCodeAt(i) - 97]++;\n        if (i >= s1.length) have[s2.charCodeAt(i - s1.length) - 97]--;\n        if (i >= s1.length - 1) {\n            let ok = true;\n            for (let j = 0; j < 26; j++) {\n                if (need[j] !== have[j]) { ok = false; break; }\n            }\n            if (ok) return true;\n        }\n    }\n    return false;\n};`,
      },
    };
  })(),

  // ── Sliding Window Maximum ──────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const out: number[] = [];
      const dq: number[] = [];
      for (let i = 0; i < nums.length; i++) {
        while (dq.length > 0 && dq[0] <= i - k) dq.shift();
        while (dq.length > 0 && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
        dq.push(i);
        if (i >= k - 1) out.push(nums[dq[0]]);
      }
      return out;
    };
    return {
      slug: "sliding-window-maximum",
      title: "Sliding Window Maximum",
      difficulty: "HARD" as const,
      tags: ["Array", "Sliding Window", "Monotonic Queue", "Heap"],
      signature: { funcName: "maxSlidingWindow", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an array `nums` and a window of size `k` sliding from left to right, one position at a time. Return an array of the **maximum of each window**.",
        [
          { in: "nums = [1,3,-1,-3,5,3,6,7], k = 3", out: "[3,3,5,5,6,7]" },
          { in: "nums = [1], k = 1", out: "[1]" },
        ],
        ["1 <= nums.length <= 40", "-100 <= nums[i] <= 100", "1 <= k <= nums.length"]),
      hints: [
        "A monotonic decreasing deque of indices keeps the window max at its front.",
        "Pop smaller elements from the back before pushing; drop the front when it leaves the window.",
      ],
      examples: [
        { input: "[1,3,-1,-3,5,3,6,7]\n3", expectedOutput: "[3,3,5,5,6,7]" },
        { input: "[1]\n1", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 40], [-100, 100]);
        const k = ri(rng, 1, nums.length);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef maxSlidingWindow(nums: List[int], k: int) -> List[int]:\n    out = []\n    dq = deque()\n    for i, x in enumerate(nums):\n        while dq and dq[0] <= i - k:\n            dq.popleft()\n        while dq and nums[dq[-1]] <= x:\n            dq.pop()\n        dq.append(i)\n        if i >= k - 1:\n            out.append(nums[dq[0]])\n    return out`,
        javascript: `var maxSlidingWindow = function(nums, k) {\n    const out = [];\n    const dq = [];\n    let head = 0;\n    for (let i = 0; i < nums.length; i++) {\n        while (dq.length > head && dq[head] <= i - k) head++;\n        while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();\n        dq.push(i);\n        if (i >= k - 1) out.push(nums[dq[head]]);\n    }\n    return out;\n};`,
      },
    };
  })(),

];
