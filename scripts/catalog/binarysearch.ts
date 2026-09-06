/** Binary Search — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

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
      editorial: explain({
        idea: "Sorted order means one comparison tells you which half of the array the target cannot be in. Look at the middle element and throw away half the search space each step, so the range collapses in `log n` comparisons instead of `n`.",
        steps: [
          "Keep an inclusive range `[lo, hi]`, initially the whole array.",
          "Take `mid = lo + (hi - lo) / 2`.",
          "If `nums[mid]` is the target, return `mid`.",
          "If it is smaller, everything at or left of `mid` is too small — set `lo = mid + 1`.",
          "Otherwise set `hi = mid - 1`. When `lo > hi` the range is empty and the target is absent.",
        ],
        why: "The invariant is that if the target exists it lies within `[lo, hi]`. Each comparison rules out `mid` and one whole side without examining them, because sortedness guarantees everything on the discarded side compares the same way. The range shrinks by at least one element per iteration and always excludes `mid`, so the loop terminates — and it halves, giving the logarithmic bound.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "With an inclusive `hi`, the loop condition must be `lo <= hi`. Using `<` skips the final single-element range.",
          "Move **past** `mid` (`mid + 1` / `mid - 1`). Assigning `lo = mid` or `hi = mid` here loops forever.",
          "Compute the midpoint as `lo + (hi - lo) / 2` rather than `(lo + hi) / 2` — the latter can overflow on large bounds, a habit worth keeping even when the constraints are small.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef search(nums: List[int], target: int) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1`,
        javascript: `var search = function(nums, target) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] === target) return mid;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n};`,
              typescript: `function search(nums: number[], target: number): number {\n    let lo = 0;\n    let hi = nums.length - 1;\n    while (lo <= hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        if (nums[mid] === target) return mid;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}`,
              java: `public static int search(int[] nums, int target) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}`,
              cpp: `int search(vector<int>& nums, int target) {\n    int lo = 0, hi = (int) nums.size() - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}`,
              c: `int search(int* nums, int numsSize, int target) {\n    int lo = 0, hi = numsSize - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}`,
              csharp: `public static int Search(int[] nums, int target)\n{\n    int lo = 0, hi = nums.Length - 1;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}`,
              go: `func search(nums []int, target int) int {\n	lo, hi := 0, len(nums)-1\n	for lo <= hi {\n		mid := lo + (hi-lo)/2\n		if nums[mid] == target {\n			return mid\n		}\n		if nums[mid] < target {\n			lo = mid + 1\n		} else {\n			hi = mid - 1\n		}\n	}\n	return -1\n}`,
              kotlin: `fun search(nums: IntArray, target: Int): Int {\n    var lo = 0\n    var hi = nums.size - 1\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        if (nums[mid] == target) return mid\n        if (nums[mid] < target) lo = mid + 1 else hi = mid - 1\n    }\n    return -1\n}`,
              swift: `func search(_ nums: [Int], _ target: Int) -> Int {\n    var lo = 0\n    var hi = nums.count - 1\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        if nums[mid] == target { return mid }\n        if nums[mid] < target { lo = mid + 1 } else { hi = mid - 1 }\n    }\n    return -1\n}`,
              rust: `fn search(nums: Vec<i32>, target: i32) -> i32 {\n    let mut lo: i32 = 0;\n    let mut hi: i32 = nums.len() as i32 - 1;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        let v = nums[mid as usize];\n        if v == target {\n            return mid;\n        }\n        if v < target {\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    -1\n}`,
              php: `function search($nums, $target) {\n    $lo = 0;\n    $hi = count($nums) - 1;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($nums[$mid] === $target) return $mid;\n        if ($nums[$mid] < $target) $lo = $mid + 1;\n        else $hi = $mid - 1;\n    }\n    return -1;\n}`,
              ruby: `def search(nums, target)\n  lo = 0\n  hi = nums.length - 1\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    return mid if nums[mid] == target\n    if nums[mid] < target\n      lo = mid + 1\n    else\n      hi = mid - 1\n    end\n  end\n  -1\nend`,
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
      editorial: explain({
        idea: "Both cases the problem asks about — \"where is it\" and \"where would it go\" — are the same query: the **first index whose value is at least the target**, the classic `lower_bound`. If the value there equals the target you found it; if not, that is exactly the insertion point. One search, no special-casing.",
        steps: [
          "Search a half-open range `[lo, hi)` with `hi = n`, so `n` itself is a legal answer (insert at the end).",
          "While `lo < hi`, take `mid = lo + (hi - lo) / 2`.",
          "If `nums[mid] < target`, then `mid` and everything left is too small — set `lo = mid + 1`.",
          "Otherwise `mid` is still a candidate — set `hi = mid`, keeping it in range.",
          "When the range is empty, `lo` is the answer.",
        ],
        why: "The invariant is that the answer always lies in `[lo, hi]`: everything below `lo` is strictly less than the target and everything at or above `hi` is at least the target. Both branches preserve it while strictly shrinking the range, so `lo` converges on the boundary between the two. Because the array is sorted and distinct, that boundary is precisely the target's index if present and its insertion point otherwise.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Use a half-open upper bound of `n`, not `n - 1` — the target may belong after the last element.",
          "With half-open bounds, `hi = mid` (not `mid - 1`), because `mid` may itself be the answer. The `lo = mid + 1` branch is what guarantees progress.",
          "The loop condition is `lo < hi` here, unlike the inclusive-range variant.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef searchInsert(nums: List[int], target: int) -> int:\n    lo, hi = 0, len(nums)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo`,
        javascript: `var searchInsert = function(nums, target) {\n    let lo = 0, hi = nums.length;\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n};`,
              typescript: `function searchInsert(nums: number[], target: number): number {\n    let lo = 0;\n    let hi = nums.length;\n    while (lo < hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              java: `public static int searchInsert(int[] nums, int target) {\n    int lo = 0, hi = nums.length;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              cpp: `int searchInsert(vector<int>& nums, int target) {\n    int lo = 0, hi = (int) nums.size();\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              c: `int searchInsert(int* nums, int numsSize, int target) {\n    int lo = 0, hi = numsSize;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              csharp: `public static int SearchInsert(int[] nums, int target)\n{\n    int lo = 0, hi = nums.Length;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < target) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              go: `func searchInsert(nums []int, target int) int {\n	lo, hi := 0, len(nums)\n	for lo < hi {\n		mid := lo + (hi-lo)/2\n		if nums[mid] < target {\n			lo = mid + 1\n		} else {\n			hi = mid\n		}\n	}\n	return lo\n}`,
              kotlin: `fun searchInsert(nums: IntArray, target: Int): Int {\n    var lo = 0\n    var hi = nums.size\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (nums[mid] < target) lo = mid + 1 else hi = mid\n    }\n    return lo\n}`,
              swift: `func searchInsert(_ nums: [Int], _ target: Int) -> Int {\n    var lo = 0\n    var hi = nums.count\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if nums[mid] < target { lo = mid + 1 } else { hi = mid }\n    }\n    return lo\n}`,
              rust: `fn searchInsert(nums: Vec<i32>, target: i32) -> i32 {\n    let mut lo = 0usize;\n    let mut hi = nums.len();\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if nums[mid] < target {\n            lo = mid + 1;\n        } else {\n            hi = mid;\n        }\n    }\n    lo as i32\n}`,
              php: `function searchInsert($nums, $target) {\n    $lo = 0;\n    $hi = count($nums);\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($nums[$mid] < $target) $lo = $mid + 1;\n        else $hi = $mid;\n    }\n    return $lo;\n}`,
              ruby: `def searchInsert(nums, target)\n  lo = 0\n  hi = nums.length\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if nums[mid] < target\n      lo = mid + 1\n    else\n      hi = mid\n    end\n  end\n  lo\nend`,
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
      editorial: explain({
        idea: "You are not searching an array — you are searching the **answer space**. The predicate `k * k <= x` is monotone: true for every `k` up to the root and false for every `k` above it. Binary searching for that boundary finds the floor of the square root without ever computing one.",
        steps: [
          "Return `x` directly for `x < 2`, since `sqrt(0) = 0` and `sqrt(1) = 1`.",
          "Search `k` in `[1, x]`, remembering the largest `k` that satisfies the predicate.",
          "For each `mid`, test `mid <= x / mid` — an overflow-free way of asking `mid * mid <= x`.",
          "If it holds, `mid` is feasible: record it and search higher. Otherwise search lower.",
          "The last recorded feasible value is the floor of the root.",
        ],
        why: "For positive integers, `mid * mid <= x` and `mid <= x / mid` (with truncating division) are exactly equivalent: if `mid * mid <= x` then `x / mid >= mid`, and if `mid * mid > x` then `x / mid <= mid - 1`. So the rewritten test decides the same predicate while never forming a product that could overflow. Monotonicity then guarantees a single crossover point, which is what the search converges on.",
        time: "O(log x)",
        space: "O(1)",
        pitfalls: [
          "`mid * mid` **overflows** 32-bit integers near the upper constraint of about 2.1 billion — compare with division instead.",
          "Handle `x = 0` before the search, or the division test divides by zero.",
          "The answer is the floor, so keep the last feasible `mid` rather than returning where the loop stops.",
          "Built-in `sqrt` is disallowed, and on large inputs floating point rounds wrongly at exact squares anyway.",
        ],
      }),
      solutions: {
        python: `def mySqrt(x: int) -> int:\n    lo, hi = 0, x\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if mid * mid <= x:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return hi`,
        javascript: `var mySqrt = function(x) {\n    let lo = 0, hi = x;\n    while (lo <= hi) {\n        const mid = Math.floor((lo + hi) / 2);\n        if (mid * mid <= x) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return hi;\n};`,
              typescript: `function mySqrt(x: number): number {\n    if (x < 2) return x;\n    let lo = 1;\n    let hi = x;\n    let best = 1;\n    while (lo <= hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        if (mid <= Math.floor(x / mid)) {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return best;\n}`,
              java: `public static int mySqrt(int x) {\n    if (x < 2) return x;\n    int lo = 1, hi = x, best = 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid <= x / mid) {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return best;\n}`,
              cpp: `int mySqrt(int x) {\n    if (x < 2) return x;\n    int lo = 1, hi = x, best = 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid <= x / mid) {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return best;\n}`,
              c: `int mySqrt(int x) {\n    if (x < 2) return x;\n    int lo = 1, hi = x, best = 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid <= x / mid) {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return best;\n}`,
              csharp: `public static int MySqrt(int x)\n{\n    if (x < 2) return x;\n    int lo = 1, hi = x, best = 1;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (mid <= x / mid)\n        {\n            best = mid;\n            lo = mid + 1;\n        }\n        else\n        {\n            hi = mid - 1;\n        }\n    }\n    return best;\n}`,
              go: `func mySqrt(x int) int {\n	if x < 2 {\n		return x\n	}\n	lo, hi, best := 1, x, 1\n	for lo <= hi {\n		mid := lo + (hi-lo)/2\n		if mid <= x/mid {\n			best = mid\n			lo = mid + 1\n		} else {\n			hi = mid - 1\n		}\n	}\n	return best\n}`,
              kotlin: `fun mySqrt(x: Int): Int {\n    if (x < 2) return x\n    var lo = 1\n    var hi = x\n    var best = 1\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        if (mid <= x / mid) {\n            best = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return best\n}`,
              swift: `func mySqrt(_ x: Int) -> Int {\n    if x < 2 { return x }\n    var lo = 1\n    var hi = x\n    var best = 1\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        if mid <= x / mid {\n            best = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return best\n}`,
              rust: `fn mySqrt(x: i32) -> i32 {\n    if x < 2 {\n        return x;\n    }\n    let mut lo = 1;\n    let mut hi = x;\n    let mut best = 1;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        if mid <= x / mid {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    best\n}`,
              php: `function mySqrt($x) {\n    if ($x < 2) return $x;\n    $lo = 1;\n    $hi = $x;\n    $best = 1;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($mid <= intdiv($x, $mid)) {\n            $best = $mid;\n            $lo = $mid + 1;\n        } else {\n            $hi = $mid - 1;\n        }\n    }\n    return $best;\n}`,
              ruby: `def mySqrt(x)\n  return x if x < 2\n  lo = 1\n  hi = x\n  best = 1\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    if mid <= x / mid\n      best = mid\n      lo = mid + 1\n    else\n      hi = mid - 1\n    end\n  end\n  best\nend`,
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
      editorial: explain({
        idea: "Same monotone answer-space search as integer square root, but the question is exact: does some integer `k` satisfy `k * k == num`? Binary search `k`, comparing without ever forming the product so nothing overflows.",
        steps: [
          "Search `k` in `[1, num]`.",
          "For each `mid`, compute the quotient `q = num / mid` and remainder `r = num % mid`.",
          "If `q == mid` and `r == 0`, then `mid * mid == num` exactly — return `true`.",
          "If `q > mid`, then `mid` is too small — search higher; otherwise search lower.",
          "An exhausted range means no such integer exists.",
        ],
        why: "`num / mid` compared against `mid` reproduces the ordering of `mid * mid` against `num` without multiplying: quotient greater than `mid` means the square is short of `num`, quotient smaller means it overshoots. Equality of the quotient plus a zero remainder is precisely divisibility with matching factors, i.e. an exact square. The comparison is monotone in `mid`, so binary search applies.",
        time: "O(log num)",
        space: "O(1)",
        pitfalls: [
          "`mid * mid` overflows a 32-bit integer for inputs near 2.1 billion — this is the whole reason for the division form.",
          "The remainder check matters: `num / mid == mid` alone is true for `num = 8, mid = 2` (`8 / 2 == 2`) even though 8 is not a square.",
          "Built-in `sqrt` is disallowed, and floating point is unreliable at this magnitude regardless.",
          "Start the range at `1`, not `0`, so the division is always safe.",
        ],
      }),
      solutions: {
        python: `def isPerfectSquare(num: int) -> bool:\n    lo, hi = 1, num\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        sq = mid * mid\n        if sq == num:\n            return True\n        if sq < num:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return False`,
        javascript: `var isPerfectSquare = function(num) {\n    let lo = 1, hi = num;\n    while (lo <= hi) {\n        const mid = Math.floor((lo + hi) / 2);\n        const sq = mid * mid;\n        if (sq === num) return true;\n        if (sq < num) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n};`,
              typescript: `function isPerfectSquare(num: number): boolean {\n    let lo = 1;\n    let hi = num;\n    while (lo <= hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        const q = Math.floor(num / mid);\n        const r = num % mid;\n        if (q === mid && r === 0) return true;\n        if (q > mid) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              java: `public static boolean isPerfectSquare(int num) {\n    int lo = 1, hi = num;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        int q = num / mid;\n        int r = num % mid;\n        if (q == mid && r == 0) return true;\n        if (q > mid) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              cpp: `bool isPerfectSquare(int num) {\n    int lo = 1, hi = num;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        int q = num / mid;\n        int r = num % mid;\n        if (q == mid && r == 0) return true;\n        if (q > mid) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              c: `bool isPerfectSquare(int num) {\n    int lo = 1, hi = num;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        int q = num / mid;\n        int r = num % mid;\n        if (q == mid && r == 0) return true;\n        if (q > mid) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              csharp: `public static bool IsPerfectSquare(int num)\n{\n    int lo = 1, hi = num;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        int q = num / mid;\n        int r = num % mid;\n        if (q == mid && r == 0) return true;\n        if (q > mid) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return false;\n}`,
              go: `func isPerfectSquare(num int) bool {\n	lo, hi := 1, num\n	for lo <= hi {\n		mid := lo + (hi-lo)/2\n		q := num / mid\n		r := num % mid\n		if q == mid && r == 0 {\n			return true\n		}\n		if q > mid {\n			lo = mid + 1\n		} else {\n			hi = mid - 1\n		}\n	}\n	return false\n}`,
              kotlin: `fun isPerfectSquare(num: Int): Boolean {\n    var lo = 1\n    var hi = num\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        val q = num / mid\n        val r = num % mid\n        if (q == mid && r == 0) return true\n        if (q > mid) lo = mid + 1 else hi = mid - 1\n    }\n    return false\n}`,
              swift: `func isPerfectSquare(_ num: Int) -> Bool {\n    var lo = 1\n    var hi = num\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        let q = num / mid\n        let r = num % mid\n        if q == mid && r == 0 { return true }\n        if q > mid { lo = mid + 1 } else { hi = mid - 1 }\n    }\n    return false\n}`,
              rust: `fn isPerfectSquare(num: i32) -> bool {\n    let mut lo = 1;\n    let mut hi = num;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        let q = num / mid;\n        let r = num % mid;\n        if q == mid && r == 0 {\n            return true;\n        }\n        if q > mid {\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    false\n}`,
              php: `function isPerfectSquare($num) {\n    $lo = 1;\n    $hi = $num;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        $q = intdiv($num, $mid);\n        $r = $num % $mid;\n        if ($q === $mid && $r === 0) return true;\n        if ($q > $mid) $lo = $mid + 1;\n        else $hi = $mid - 1;\n    }\n    return false;\n}`,
              ruby: `def isPerfectSquare(num)\n  lo = 1\n  hi = num\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    q = num / mid\n    r = num % mid\n    return true if q == mid && r == 0\n    if q > mid\n      lo = mid + 1\n    else\n      hi = mid - 1\n    end\n  end\n  false\nend`,
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
      editorial: explain({
        idea: "A rotated sorted array is two sorted runs joined end to end. Wherever you place `mid`, at least **one side of it is a clean sorted range** — and you can tell which by comparing `nums[lo]` with `nums[mid]`. Once you know the sorted side, a simple range check says whether the target lives there, and you discard the other half exactly as in ordinary binary search.",
        steps: [
          "Keep an inclusive range and compute `mid` as usual; return immediately on a hit.",
          "If `nums[lo] <= nums[mid]`, the left half is sorted.",
          "In that case, if the target lies within `[nums[lo], nums[mid])`, search left; otherwise search right.",
          "Otherwise the right half is sorted: if the target lies within `(nums[mid], nums[hi]]`, search right; otherwise search left.",
          "An empty range means the target is absent.",
        ],
        why: "The rotation point splits the array into two ascending runs, so `mid` can fall in at most one of them — the other side is therefore entirely sorted and contiguous. Comparing `nums[lo]` with `nums[mid]` identifies which, since a sorted left half must have its first element no greater than its last. On the sorted side, membership is a plain range test; if the target is not there it must be on the other side, so a half is discarded every step and the logarithmic bound survives the rotation.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "The sortedness test must be `nums[lo] <= nums[mid]`, with the equality — otherwise a two-element range misidentifies which side is sorted.",
          "The range checks are half-open at the `mid` end (`target < nums[mid]`, `target > nums[mid]`) since `mid` was already tested.",
          "The array may not be rotated at all; the same logic covers that, with the left half simply always sorted.",
          "Values are distinct here, which is what makes the comparisons unambiguous — duplicates would break this approach.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef search(nums: List[int], target: int) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[lo] <= nums[mid]:\n            if nums[lo] <= target < nums[mid]:\n                hi = mid - 1\n            else:\n                lo = mid + 1\n        else:\n            if nums[mid] < target <= nums[hi]:\n                lo = mid + 1\n            else:\n                hi = mid - 1\n    return -1`,
        javascript: `var search = function(nums, target) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] === target) return mid;\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;\n            else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return -1;\n};`,
              typescript: `function search(nums: number[], target: number): number {\n    let lo = 0;\n    let hi = nums.length - 1;\n    while (lo <= hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        if (nums[mid] === target) return mid;\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;\n            else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return -1;\n}`,
              java: `public static int search(int[] nums, int target) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;\n            else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return -1;\n}`,
              cpp: `int search(vector<int>& nums, int target) {\n    int lo = 0, hi = (int) nums.size() - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;\n            else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return -1;\n}`,
              c: `int search(int* nums, int numsSize, int target) {\n    int lo = 0, hi = numsSize - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;\n            else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return -1;\n}`,
              csharp: `public static int Search(int[] nums, int target)\n{\n    int lo = 0, hi = nums.Length - 1;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[lo] <= nums[mid])\n        {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;\n            else lo = mid + 1;\n        }\n        else\n        {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return -1;\n}`,
              go: `func search(nums []int, target int) int {\n	lo, hi := 0, len(nums)-1\n	for lo <= hi {\n		mid := lo + (hi-lo)/2\n		if nums[mid] == target {\n			return mid\n		}\n		if nums[lo] <= nums[mid] {\n			if nums[lo] <= target && target < nums[mid] {\n				hi = mid - 1\n			} else {\n				lo = mid + 1\n			}\n		} else {\n			if nums[mid] < target && target <= nums[hi] {\n				lo = mid + 1\n			} else {\n				hi = mid - 1\n			}\n		}\n	}\n	return -1\n}`,
              kotlin: `fun search(nums: IntArray, target: Int): Int {\n    var lo = 0\n    var hi = nums.size - 1\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        if (nums[mid] == target) return mid\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1 else lo = mid + 1\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1 else hi = mid - 1\n        }\n    }\n    return -1\n}`,
              swift: `func search(_ nums: [Int], _ target: Int) -> Int {\n    var lo = 0\n    var hi = nums.count - 1\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        if nums[mid] == target { return mid }\n        if nums[lo] <= nums[mid] {\n            if nums[lo] <= target && target < nums[mid] { hi = mid - 1 } else { lo = mid + 1 }\n        } else {\n            if nums[mid] < target && target <= nums[hi] { lo = mid + 1 } else { hi = mid - 1 }\n        }\n    }\n    return -1\n}`,
              rust: `fn search(nums: Vec<i32>, target: i32) -> i32 {\n    let mut lo: i32 = 0;\n    let mut hi: i32 = nums.len() as i32 - 1;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        let m = nums[mid as usize];\n        if m == target {\n            return mid;\n        }\n        let l = nums[lo as usize];\n        let h = nums[hi as usize];\n        if l <= m {\n            if l <= target && target < m {\n                hi = mid - 1;\n            } else {\n                lo = mid + 1;\n            }\n        } else {\n            if m < target && target <= h {\n                lo = mid + 1;\n            } else {\n                hi = mid - 1;\n            }\n        }\n    }\n    -1\n}`,
              php: `function search($nums, $target) {\n    $lo = 0;\n    $hi = count($nums) - 1;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($nums[$mid] === $target) return $mid;\n        if ($nums[$lo] <= $nums[$mid]) {\n            if ($nums[$lo] <= $target && $target < $nums[$mid]) $hi = $mid - 1;\n            else $lo = $mid + 1;\n        } else {\n            if ($nums[$mid] < $target && $target <= $nums[$hi]) $lo = $mid + 1;\n            else $hi = $mid - 1;\n        }\n    }\n    return -1;\n}`,
              ruby: `def search(nums, target)\n  lo = 0\n  hi = nums.length - 1\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    return mid if nums[mid] == target\n    if nums[lo] <= nums[mid]\n      if nums[lo] <= target && target < nums[mid]\n        hi = mid - 1\n      else\n        lo = mid + 1\n      end\n    else\n      if nums[mid] < target && target <= nums[hi]\n        lo = mid + 1\n      else\n        hi = mid - 1\n      end\n    end\n  end\n  -1\nend`,
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
      editorial: explain({
        idea: "The minimum is the single point where the array \"drops\" — the start of the second sorted run. Comparing `nums[mid]` against the **last** element of the current range tells you which side of that drop you are on, so you can halve the range without ever seeing the whole array.",
        steps: [
          "Keep a range `[lo, hi]` and loop while `lo < hi`.",
          "Take `mid = lo + (hi - lo) / 2`.",
          "If `nums[mid] > nums[hi]`, the drop is strictly after `mid` — set `lo = mid + 1`.",
          "Otherwise `mid` could itself be the minimum — set `hi = mid`.",
          "When the range collapses, `nums[lo]` is the minimum.",
        ],
        why: "Comparing against `nums[hi]` rather than `nums[lo]` is what makes this clean. If `nums[mid] > nums[hi]` then `mid` sits in the first (higher) run while `hi` sits in the second, so the wrap-around point lies to the right and `mid` cannot be the answer. Otherwise `mid` is already in the run containing the minimum, and the minimum is at `mid` or before it — so keeping `mid` in range is required. The invariant \"the minimum is in `[lo, hi]`\" holds throughout, and the range strictly shrinks, so `lo` lands on it. A non-rotated array simply always takes the second branch.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Compare with `nums[hi]`, not `nums[lo]`. The `lo` version needs extra cases to handle an unrotated array.",
          "Use `hi = mid`, not `mid - 1` — `mid` may be the minimum itself.",
          "The loop condition is `lo < hi`; with `<=` and `hi = mid` it never terminates.",
          "Return the value at `lo`, not the index.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findMin(nums: List[int]) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] > nums[hi]:\n            lo = mid + 1\n        else:\n            hi = mid\n    return nums[lo]`,
        javascript: `var findMin = function(nums) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else hi = mid;\n    }\n    return nums[lo];\n};`,
              typescript: `function findMin(nums: number[]): number {\n    let lo = 0;\n    let hi = nums.length - 1;\n    while (lo < hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              java: `public static int findMin(int[] nums) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              cpp: `int findMin(vector<int>& nums) {\n    int lo = 0, hi = (int) nums.size() - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              c: `int findMin(int* nums, int numsSize) {\n    int lo = 0, hi = numsSize - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              csharp: `public static int FindMin(int[] nums)\n{\n    int lo = 0, hi = nums.Length - 1;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              go: `func findMin(nums []int) int {\n	lo, hi := 0, len(nums)-1\n	for lo < hi {\n		mid := lo + (hi-lo)/2\n		if nums[mid] > nums[hi] {\n			lo = mid + 1\n		} else {\n			hi = mid\n		}\n	}\n	return nums[lo]\n}`,
              kotlin: `fun findMin(nums: IntArray): Int {\n    var lo = 0\n    var hi = nums.size - 1\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (nums[mid] > nums[hi]) lo = mid + 1 else hi = mid\n    }\n    return nums[lo]\n}`,
              swift: `func findMin(_ nums: [Int]) -> Int {\n    var lo = 0\n    var hi = nums.count - 1\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if nums[mid] > nums[hi] { lo = mid + 1 } else { hi = mid }\n    }\n    return nums[lo]\n}`,
              rust: `fn findMin(nums: Vec<i32>) -> i32 {\n    let mut lo = 0usize;\n    let mut hi = nums.len() - 1;\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if nums[mid] > nums[hi] {\n            lo = mid + 1;\n        } else {\n            hi = mid;\n        }\n    }\n    nums[lo]\n}`,
              php: `function findMin($nums) {\n    $lo = 0;\n    $hi = count($nums) - 1;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($nums[$mid] > $nums[$hi]) $lo = $mid + 1;\n        else $hi = $mid;\n    }\n    return $nums[$lo];\n}`,
              ruby: `def findMin(nums)\n  lo = 0\n  hi = nums.length - 1\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if nums[mid] > nums[hi]\n      lo = mid + 1\n    else\n      hi = mid\n    end\n  end\n  nums[lo]\nend`,
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
      editorial: explain({
        idea: "You do not need to see the whole array to find the peak — you only need to know which way the slope runs. Comparing `nums[mid]` with its right neighbour tells you that: still rising means the peak is further right, already falling means the peak is at `mid` or to its left. Halve the range on that answer alone.",
        steps: [
          "Keep a range `[lo, hi]` and loop while `lo < hi`.",
          "Take `mid = lo + (hi - lo) / 2`, which is always strictly less than `hi`, so `mid + 1` is safe to read.",
          "If `nums[mid] < nums[mid + 1]` you are on the rising side — the peak is strictly right, so `lo = mid + 1`.",
          "Otherwise you are at or past the summit — set `hi = mid`, keeping `mid` as a candidate.",
          "When the range collapses, `lo` is the peak's index.",
        ],
        why: "The array rises strictly and then falls strictly, so the comparison with the right neighbour is a clean test of which side of the summit `mid` sits on. If it is rising, every index at or left of `mid` is also below the peak, so discarding them is safe; if falling, everything right of `mid` is below `nums[mid]`, so the peak is at `mid` or earlier. The invariant \"the peak is in `[lo, hi]`\" survives both branches, and the range always shrinks.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Use `hi = mid`, not `mid - 1` — a falling comparison does not rule `mid` out.",
          "The loop must be `lo < hi`; with `lo <= hi` and `hi = mid` it never ends.",
          "`mid + 1` is only in bounds because the loop guarantees `mid < hi`; computing `mid` with the upper half would break that.",
          "A strictly increasing or strictly decreasing array is allowed — the peak is then at an end, which this handles without special cases.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findPeakElement(nums: List[int]) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] < nums[mid + 1]:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo`,
        javascript: `var findPeakElement = function(nums) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        if (nums[mid] < nums[mid + 1]) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n};`,
              typescript: `function findPeakElement(nums: number[]): number {\n    let lo = 0;\n    let hi = nums.length - 1;\n    while (lo < hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        if (nums[mid] < nums[mid + 1]) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              java: `public static int findPeakElement(int[] nums) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < nums[mid + 1]) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              cpp: `int findPeakElement(vector<int>& nums) {\n    int lo = 0, hi = (int) nums.size() - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < nums[mid + 1]) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              c: `int findPeakElement(int* nums, int numsSize) {\n    int lo = 0, hi = numsSize - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < nums[mid + 1]) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              csharp: `public static int FindPeakElement(int[] nums)\n{\n    int lo = 0, hi = nums.Length - 1;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < nums[mid + 1]) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              go: `func findPeakElement(nums []int) int {\n	lo, hi := 0, len(nums)-1\n	for lo < hi {\n		mid := lo + (hi-lo)/2\n		if nums[mid] < nums[mid+1] {\n			lo = mid + 1\n		} else {\n			hi = mid\n		}\n	}\n	return lo\n}`,
              kotlin: `fun findPeakElement(nums: IntArray): Int {\n    var lo = 0\n    var hi = nums.size - 1\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (nums[mid] < nums[mid + 1]) lo = mid + 1 else hi = mid\n    }\n    return lo\n}`,
              swift: `func findPeakElement(_ nums: [Int]) -> Int {\n    var lo = 0\n    var hi = nums.count - 1\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if nums[mid] < nums[mid + 1] { lo = mid + 1 } else { hi = mid }\n    }\n    return lo\n}`,
              rust: `fn findPeakElement(nums: Vec<i32>) -> i32 {\n    let mut lo = 0usize;\n    let mut hi = nums.len() - 1;\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if nums[mid] < nums[mid + 1] {\n            lo = mid + 1;\n        } else {\n            hi = mid;\n        }\n    }\n    lo as i32\n}`,
              php: `function findPeakElement($nums) {\n    $lo = 0;\n    $hi = count($nums) - 1;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($nums[$mid] < $nums[$mid + 1]) $lo = $mid + 1;\n        else $hi = $mid;\n    }\n    return $lo;\n}`,
              ruby: `def findPeakElement(nums)\n  lo = 0\n  hi = nums.length - 1\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if nums[mid] < nums[mid + 1]\n      lo = mid + 1\n    else\n      hi = mid\n    end\n  end\n  lo\nend`,
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
      editorial: explain({
        idea: "Express both endpoints with the same primitive. `lowerBound(v)` — the first index whose value is at least `v` — gives the **first** occurrence of the target directly, and `lowerBound(target + 1) - 1` gives the **last**, because the first index past the target's block is one step beyond its final element.",
        steps: [
          "Write `lowerBound(v)`: a half-open binary search returning the first index with `nums[index] >= v`.",
          "Compute `first = lowerBound(target)`.",
          "If `first` is past the end or `nums[first]` is not the target, the value is absent — return `[-1, -1]`.",
          "Compute `last = lowerBound(target + 1) - 1`.",
          "Return `[first, last]`.",
        ],
        why: "In a non-decreasing array all copies of a value form one contiguous block. `lowerBound(target)` lands on that block's first index, and `lowerBound(target + 1)` lands just past its last, so subtracting one gives the final occurrence. Each call is a plain logarithmic search, keeping the whole solution `O(log n)` — a linear scan outwards from a hit would degrade to `O(n)` when the array is all one value.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Check the presence of the target after the first search — `lowerBound` returns an insertion point, not a match, and may sit past the end of the array.",
          "An empty array must return `[-1, -1]`; the bounds check covers it if written before indexing.",
          "Do not scan outwards from a found index to widen the range — that is what makes the naive version linear.",
          "`lowerBound(target + 1) - 1` is only valid once the target is known to be present.",
        ],
      }),
      solutions: {
        python: `from typing import List\nimport bisect\n\ndef searchRange(nums: List[int], target: int) -> List[int]:\n    lo = bisect.bisect_left(nums, target)\n    if lo == len(nums) or nums[lo] != target:\n        return [-1, -1]\n    hi = bisect.bisect_right(nums, target) - 1\n    return [lo, hi]`,
        javascript: `var searchRange = function(nums, target) {\n    function lowerBound(t) {\n        let lo = 0, hi = nums.length;\n        while (lo < hi) {\n            const mid = (lo + hi) >> 1;\n            if (nums[mid] < t) lo = mid + 1;\n            else hi = mid;\n        }\n        return lo;\n    }\n    const lo = lowerBound(target);\n    if (lo === nums.length || nums[lo] !== target) return [-1, -1];\n    return [lo, lowerBound(target + 1) - 1];\n};`,
              typescript: `function searchRange(nums: number[], target: number): number[] {\n    function lowerBound(v: number): number {\n        let lo = 0;\n        let hi = nums.length;\n        while (lo < hi) {\n            const mid = lo + Math.floor((hi - lo) / 2);\n            if (nums[mid] < v) lo = mid + 1;\n            else hi = mid;\n        }\n        return lo;\n    }\n    const first = lowerBound(target);\n    if (first >= nums.length || nums[first] !== target) return [-1, -1];\n    return [first, lowerBound(target + 1) - 1];\n}`,
              java: `public static int[] searchRange(int[] nums, int target) {\n    int first = lowerBoundSR(nums, target);\n    if (first >= nums.length || nums[first] != target) return new int[]{-1, -1};\n    return new int[]{first, lowerBoundSR(nums, target + 1) - 1};\n}\n\nprivate static int lowerBoundSR(int[] nums, int v) {\n    int lo = 0, hi = nums.length;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < v) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              cpp: `int lowerBoundSR(vector<int>& nums, int v) {\n    int lo = 0, hi = (int) nums.size();\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < v) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}\n\nvector<int> searchRange(vector<int>& nums, int target) {\n    int first = lowerBoundSR(nums, target);\n    if (first >= (int) nums.size() || nums[first] != target) return vector<int>{-1, -1};\n    return vector<int>{first, lowerBoundSR(nums, target + 1) - 1};\n}`,
              c: `static int lowerBoundSR(int* nums, int numsSize, int v) {\n    int lo = 0, hi = numsSize;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < v) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}\n\nint* searchRange(int* nums, int numsSize, int target, int* returnSize) {\n    int* out = (int*) malloc(2 * sizeof(int));\n    *returnSize = 2;\n    int first = lowerBoundSR(nums, numsSize, target);\n    if (first >= numsSize || nums[first] != target) {\n        out[0] = -1;\n        out[1] = -1;\n        return out;\n    }\n    out[0] = first;\n    out[1] = lowerBoundSR(nums, numsSize, target + 1) - 1;\n    return out;\n}`,
              csharp: `public static int[] SearchRange(int[] nums, int target)\n{\n    int first = LowerBoundSR(nums, target);\n    if (first >= nums.Length || nums[first] != target) return new int[] { -1, -1 };\n    return new int[] { first, LowerBoundSR(nums, target + 1) - 1 };\n}\n\nprivate static int LowerBoundSR(int[] nums, int v)\n{\n    int lo = 0, hi = nums.Length;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] < v) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
              go: `func searchRange(nums []int, target int) []int {\n	lowerBound := func(v int) int {\n		lo, hi := 0, len(nums)\n		for lo < hi {\n			mid := lo + (hi-lo)/2\n			if nums[mid] < v {\n				lo = mid + 1\n			} else {\n				hi = mid\n			}\n		}\n		return lo\n	}\n	first := lowerBound(target)\n	if first >= len(nums) || nums[first] != target {\n		return []int{-1, -1}\n	}\n	return []int{first, lowerBound(target+1) - 1}\n}`,
              kotlin: `fun searchRange(nums: IntArray, target: Int): IntArray {\n    fun lowerBound(v: Int): Int {\n        var lo = 0\n        var hi = nums.size\n        while (lo < hi) {\n            val mid = lo + (hi - lo) / 2\n            if (nums[mid] < v) lo = mid + 1 else hi = mid\n        }\n        return lo\n    }\n    val first = lowerBound(target)\n    if (first >= nums.size || nums[first] != target) return intArrayOf(-1, -1)\n    return intArrayOf(first, lowerBound(target + 1) - 1)\n}`,
              swift: `func searchRange(_ nums: [Int], _ target: Int) -> [Int] {\n    func lowerBound(_ v: Int) -> Int {\n        var lo = 0\n        var hi = nums.count\n        while lo < hi {\n            let mid = lo + (hi - lo) / 2\n            if nums[mid] < v { lo = mid + 1 } else { hi = mid }\n        }\n        return lo\n    }\n    let first = lowerBound(target)\n    if first >= nums.count || nums[first] != target { return [-1, -1] }\n    return [first, lowerBound(target + 1) - 1]\n}`,
              rust: `fn searchRange(nums: Vec<i32>, target: i32) -> Vec<i32> {\n    fn lower_bound(nums: &Vec<i32>, v: i32) -> usize {\n        let mut lo = 0usize;\n        let mut hi = nums.len();\n        while lo < hi {\n            let mid = lo + (hi - lo) / 2;\n            if nums[mid] < v {\n                lo = mid + 1;\n            } else {\n                hi = mid;\n            }\n        }\n        lo\n    }\n    let first = lower_bound(&nums, target);\n    if first >= nums.len() || nums[first] != target {\n        return vec![-1, -1];\n    }\n    let last = lower_bound(&nums, target + 1) - 1;\n    vec![first as i32, last as i32]\n}`,
              php: `function searchRange($nums, $target) {\n    $first = srLowerBound($nums, $target);\n    if ($first >= count($nums) || $nums[$first] !== $target) return array(-1, -1);\n    return array($first, srLowerBound($nums, $target + 1) - 1);\n}\n\nfunction srLowerBound($nums, $v) {\n    $lo = 0;\n    $hi = count($nums);\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($nums[$mid] < $v) $lo = $mid + 1;\n        else $hi = $mid;\n    }\n    return $lo;\n}`,
              ruby: `def searchRange(nums, target)\n  lower_bound = lambda do |v|\n    lo = 0\n    hi = nums.length\n    while lo < hi\n      mid = lo + (hi - lo) / 2\n      if nums[mid] < v\n        lo = mid + 1\n      else\n        hi = mid\n      end\n    end\n    lo\n  end\n  first = lower_bound.call(target)\n  return [-1, -1] if first >= nums.length || nums[first] != target\n  [first, lower_bound.call(target + 1) - 1]\nend`,
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
      editorial: explain({
        idea: "Binary search the **answer**, not the array. The hours Koko needs at speed `k` decreases monotonically as `k` grows, so the set of workable speeds is an upward-closed range: once a speed fits in `h` hours, every faster speed does too. That boundary is exactly what binary search finds.",
        steps: [
          "The answer lies in `[1, max(piles)]` — no speed above the biggest pile helps, since each hour is capped at one pile.",
          "For a candidate `k`, compute the hours needed: `sum of ceil(piles[i] / k)`.",
          "If that total is at most `h`, `k` works — record it and try slower speeds (`hi = mid`).",
          "Otherwise `k` is too slow — try faster (`lo = mid + 1`).",
          "The range converges on the smallest workable speed.",
        ],
        why: "The feasibility predicate is monotone: raising `k` can only reduce each `ceil(piles[i] / k)` term, so total hours never increase. That gives a single true/false boundary over the candidate range, which is precisely the structure binary search needs. The upper bound of `max(piles)` is safe because at that speed every pile takes exactly one hour, the fewest possible, and `h` is guaranteed to be at least the number of piles.",
        time: "O(n log(max pile))",
        space: "O(1)",
        pitfalls: [
          "Hours per pile is a **ceiling** — a leftover partial pile still costs a whole hour. Integer division alone under-counts; use `(p + k - 1) / k`.",
          "Start the search at `1`, never `0`, or the division blows up.",
          "The feasibility test is `hours <= h`, so keep `mid` in range with `hi = mid` rather than `mid - 1`.",
          "Summing hours can grow large on big inputs — use a wide enough integer type.",
        ],
      }),
      solutions: {
        python: `from typing import List\nimport math\n\ndef minEatingSpeed(piles: List[int], h: int) -> int:\n    lo, hi = 1, max(piles)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        hours = sum(math.ceil(p / mid) for p in piles)\n        if hours <= h:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var minEatingSpeed = function(piles, h) {\n    let lo = 1, hi = Math.max.apply(null, piles);\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        let hours = 0;\n        for (const p of piles) hours += Math.ceil(p / mid);\n        if (hours <= h) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n};`,
              typescript: `function minEatingSpeed(piles: number[], h: number): number {\n    let lo = 1;\n    let hi = 1;\n    for (let i = 0; i < piles.length; i++) if (piles[i] > hi) hi = piles[i];\n    while (lo < hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        let hours = 0;\n        for (let i = 0; i < piles.length; i++) hours += Math.floor((piles[i] + mid - 1) / mid);\n        if (hours <= h) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              java: `public static int minEatingSpeed(int[] piles, int h) {\n    int lo = 1, hi = 1;\n    for (int p : piles) if (p > hi) hi = p;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        long hours = 0;\n        for (int p : piles) hours += (p + mid - 1) / mid;\n        if (hours <= h) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              cpp: `int minEatingSpeed(vector<int>& piles, int h) {\n    int lo = 1, hi = 1;\n    for (int p : piles) if (p > hi) hi = p;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        long long hours = 0;\n        for (int p : piles) hours += (p + mid - 1) / mid;\n        if (hours <= h) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              c: `int minEatingSpeed(int* piles, int pilesSize, int h) {\n    int lo = 1, hi = 1;\n    for (int i = 0; i < pilesSize; i++) if (piles[i] > hi) hi = piles[i];\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        long long hours = 0;\n        for (int i = 0; i < pilesSize; i++) hours += (piles[i] + mid - 1) / mid;\n        if (hours <= (long long) h) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              csharp: `public static int MinEatingSpeed(int[] piles, int h)\n{\n    int lo = 1, hi = 1;\n    foreach (int p in piles) if (p > hi) hi = p;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        long hours = 0;\n        foreach (int p in piles) hours += (p + mid - 1) / mid;\n        if (hours <= h) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              go: `func minEatingSpeed(piles []int, h int) int {\n	lo, hi := 1, 1\n	for _, p := range piles {\n		if p > hi {\n			hi = p\n		}\n	}\n	for lo < hi {\n		mid := lo + (hi-lo)/2\n		hours := 0\n		for _, p := range piles {\n			hours += (p + mid - 1) / mid\n		}\n		if hours <= h {\n			hi = mid\n		} else {\n			lo = mid + 1\n		}\n	}\n	return lo\n}`,
              kotlin: `fun minEatingSpeed(piles: IntArray, h: Int): Int {\n    var lo = 1\n    var hi = 1\n    for (p in piles) if (p > hi) hi = p\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        var hours = 0L\n        for (p in piles) hours += ((p + mid - 1) / mid).toLong()\n        if (hours <= h.toLong()) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
              swift: `func minEatingSpeed(_ piles: [Int], _ h: Int) -> Int {\n    var lo = 1\n    var hi = 1\n    for p in piles where p > hi { hi = p }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        var hours = 0\n        for p in piles { hours += (p + mid - 1) / mid }\n        if hours <= h { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
              rust: `fn minEatingSpeed(piles: Vec<i32>, h: i32) -> i32 {\n    let mut lo = 1;\n    let mut hi = 1;\n    for &p in piles.iter() {\n        if p > hi {\n            hi = p;\n        }\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        let mut hours: i64 = 0;\n        for &p in piles.iter() {\n            hours += ((p + mid - 1) / mid) as i64;\n        }\n        if hours <= h as i64 {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
              php: `function minEatingSpeed($piles, $h) {\n    $lo = 1;\n    $hi = 1;\n    foreach ($piles as $p) if ($p > $hi) $hi = $p;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        $hours = 0;\n        foreach ($piles as $p) $hours += intdiv($p + $mid - 1, $mid);\n        if ($hours <= $h) $hi = $mid;\n        else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
              ruby: `def minEatingSpeed(piles, h)\n  lo = 1\n  hi = piles.max\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    hours = piles.sum { |p| (p + mid - 1) / mid }\n    if hours <= h\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
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
      editorial: explain({
        idea: "Another binary search over the answer. For a fixed capacity you can compute the days needed greedily — keep loading the next package while it fits, otherwise start a new day — and that day count only falls as capacity rises. So the workable capacities form an upward-closed range, and the answer is its lower boundary.",
        steps: [
          "The capacity must be at least `max(weights)` (a package must fit on some day) and never needs to exceed `sum(weights)` (one day for everything).",
          "For a candidate capacity, sweep the packages in order, accumulating the current day's load.",
          "When adding a package would exceed the capacity, close the day, start a new one, and put the package there.",
          "If the resulting day count is at most `days`, the capacity works — search lower; otherwise search higher.",
          "The search converges on the least workable capacity.",
        ],
        why: "The greedy day count is optimal for a fixed capacity: since packages must ship in order, delaying a package that still fits can never reduce the number of days — it only pushes work later. So the greedy sweep computes the true minimum days, making the feasibility test exact. That test is monotone in capacity, which is what licenses the binary search. The lower bound of `max(weights)` matters because any smaller capacity makes the problem impossible, not merely slow.",
        time: "O(n log(sum of weights))",
        space: "O(1)",
        pitfalls: [
          "Start the range at `max(weights)`, not `1` — below that no number of days suffices and the day count is meaningless.",
          "Packages ship **in order**; you may not reorder or repack them, which is why the greedy is valid.",
          "Begin the day counter at `1`, not `0` — you are already loading the first day when the sweep starts.",
          "Keep `mid` in range on success (`hi = mid`), since it may itself be the minimum.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef shipWithinDays(weights: List[int], days: int) -> int:\n    def days_needed(cap: int) -> int:\n        d = 1\n        load = 0\n        for w in weights:\n            if load + w > cap:\n                d += 1\n                load = 0\n            load += w\n        return d\n\n    lo, hi = max(weights), sum(weights)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if days_needed(mid) <= days:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var shipWithinDays = function(weights, days) {\n    function daysNeeded(cap) {\n        let d = 1, load = 0;\n        for (const w of weights) {\n            if (load + w > cap) { d++; load = 0; }\n            load += w;\n        }\n        return d;\n    }\n    let lo = Math.max.apply(null, weights);\n    let hi = weights.reduce(function(a, b) { return a + b; }, 0);\n    while (lo < hi) {\n        const mid = (lo + hi) >> 1;\n        if (daysNeeded(mid) <= days) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n};`,
              typescript: `function shipWithinDays(weights: number[], days: number): number {\n    let lo = 0;\n    let hi = 0;\n    for (let i = 0; i < weights.length; i++) {\n        if (weights[i] > lo) lo = weights[i];\n        hi += weights[i];\n    }\n    while (lo < hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        let used = 1;\n        let load = 0;\n        for (let i = 0; i < weights.length; i++) {\n            if (load + weights[i] > mid) {\n                used++;\n                load = 0;\n            }\n            load += weights[i];\n        }\n        if (used <= days) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              java: `public static int shipWithinDays(int[] weights, int days) {\n    int lo = 0, hi = 0;\n    for (int w : weights) {\n        if (w > lo) lo = w;\n        hi += w;\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        int used = 1, load = 0;\n        for (int w : weights) {\n            if (load + w > mid) {\n                used++;\n                load = 0;\n            }\n            load += w;\n        }\n        if (used <= days) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              cpp: `int shipWithinDays(vector<int>& weights, int days) {\n    int lo = 0, hi = 0;\n    for (int w : weights) {\n        if (w > lo) lo = w;\n        hi += w;\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        int used = 1, load = 0;\n        for (int w : weights) {\n            if (load + w > mid) {\n                used++;\n                load = 0;\n            }\n            load += w;\n        }\n        if (used <= days) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              c: `int shipWithinDays(int* weights, int weightsSize, int days) {\n    int lo = 0, hi = 0;\n    for (int i = 0; i < weightsSize; i++) {\n        if (weights[i] > lo) lo = weights[i];\n        hi += weights[i];\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        int used = 1, load = 0;\n        for (int i = 0; i < weightsSize; i++) {\n            if (load + weights[i] > mid) {\n                used++;\n                load = 0;\n            }\n            load += weights[i];\n        }\n        if (used <= days) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              csharp: `public static int ShipWithinDays(int[] weights, int days)\n{\n    int lo = 0, hi = 0;\n    foreach (int w in weights)\n    {\n        if (w > lo) lo = w;\n        hi += w;\n    }\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        int used = 1, load = 0;\n        foreach (int w in weights)\n        {\n            if (load + w > mid)\n            {\n                used++;\n                load = 0;\n            }\n            load += w;\n        }\n        if (used <= days) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
              go: `func shipWithinDays(weights []int, days int) int {\n	lo, hi := 0, 0\n	for _, w := range weights {\n		if w > lo {\n			lo = w\n		}\n		hi += w\n	}\n	for lo < hi {\n		mid := lo + (hi-lo)/2\n		used, load := 1, 0\n		for _, w := range weights {\n			if load+w > mid {\n				used++\n				load = 0\n			}\n			load += w\n		}\n		if used <= days {\n			hi = mid\n		} else {\n			lo = mid + 1\n		}\n	}\n	return lo\n}`,
              kotlin: `fun shipWithinDays(weights: IntArray, days: Int): Int {\n    var lo = 0\n    var hi = 0\n    for (w in weights) {\n        if (w > lo) lo = w\n        hi += w\n    }\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        var used = 1\n        var load = 0\n        for (w in weights) {\n            if (load + w > mid) {\n                used++\n                load = 0\n            }\n            load += w\n        }\n        if (used <= days) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
              swift: `func shipWithinDays(_ weights: [Int], _ days: Int) -> Int {\n    var lo = 0\n    var hi = 0\n    for w in weights {\n        if w > lo { lo = w }\n        hi += w\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        var used = 1\n        var load = 0\n        for w in weights {\n            if load + w > mid {\n                used += 1\n                load = 0\n            }\n            load += w\n        }\n        if used <= days { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
              rust: `fn shipWithinDays(weights: Vec<i32>, days: i32) -> i32 {\n    let mut lo = 0;\n    let mut hi = 0;\n    for &w in weights.iter() {\n        if w > lo {\n            lo = w;\n        }\n        hi += w;\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        let mut used = 1;\n        let mut load = 0;\n        for &w in weights.iter() {\n            if load + w > mid {\n                used += 1;\n                load = 0;\n            }\n            load += w;\n        }\n        if used <= days {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
              php: `function shipWithinDays($weights, $days) {\n    $lo = 0;\n    $hi = 0;\n    foreach ($weights as $w) {\n        if ($w > $lo) $lo = $w;\n        $hi += $w;\n    }\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        $used = 1;\n        $load = 0;\n        foreach ($weights as $w) {\n            if ($load + $w > $mid) {\n                $used++;\n                $load = 0;\n            }\n            $load += $w;\n        }\n        if ($used <= $days) $hi = $mid;\n        else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
              ruby: `def shipWithinDays(weights, days)\n  lo = weights.max\n  hi = weights.sum\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    used = 1\n    load = 0\n    weights.each do |w|\n      if load + w > mid\n        used += 1\n        load = 0\n      end\n      load += w\n    end\n    if used <= days\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
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
      editorial: explain({
        idea: "Pairing gives the array a hidden structure. **Before** the lone element, every pair starts at an even index; **after** it, the pairing is shifted and pairs start at odd indices. That parity flip happens exactly at the single element, and a binary search can hunt for it.",
        steps: [
          "Search a range `[lo, hi]` over indices, looping while `lo < hi`.",
          "Take `mid`, and if it is odd, step it down by one so it always points at a potential pair start.",
          "If `nums[mid] == nums[mid + 1]`, the pairing is still intact here — the single element is further right, so `lo = mid + 2`.",
          "Otherwise the pairing has already broken — the single element is at `mid` or before it, so `hi = mid`.",
          "When the range collapses, `nums[lo]` is the answer.",
        ],
        why: "Left of the unique element the array is a perfect sequence of pairs on even boundaries, so `nums[even] == nums[even + 1]` holds throughout. From the unique element onwards everything shifts by one, so that equality fails. Forcing `mid` to be even makes the test a direct probe of which side of the flip you are on, and since the flip point is unique the predicate is monotone — exactly what binary search needs.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Round `mid` **down** to even before comparing; testing an odd index inverts the meaning of the result.",
          "Advance by `mid + 2` on a matched pair — skipping a whole pair is the point.",
          "Use `hi = mid` so the candidate stays in range.",
          "The array length is always odd, and both the first and last position are valid answers.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef singleNonDuplicate(nums: List[int]) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if mid % 2 == 1:\n            mid -= 1\n        if nums[mid] == nums[mid + 1]:\n            lo = mid + 2\n        else:\n            hi = mid\n    return nums[lo]`,
        javascript: `var singleNonDuplicate = function(nums) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        let mid = (lo + hi) >> 1;\n        if (mid % 2 === 1) mid--;\n        if (nums[mid] === nums[mid + 1]) lo = mid + 2;\n        else hi = mid;\n    }\n    return nums[lo];\n};`,
              typescript: `function singleNonDuplicate(nums: number[]): number {\n    let lo = 0;\n    let hi = nums.length - 1;\n    while (lo < hi) {\n        let mid = lo + Math.floor((hi - lo) / 2);\n        if (mid % 2 === 1) mid--;\n        if (nums[mid] === nums[mid + 1]) lo = mid + 2;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              java: `public static int singleNonDuplicate(int[] nums) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid % 2 == 1) mid--;\n        if (nums[mid] == nums[mid + 1]) lo = mid + 2;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              cpp: `int singleNonDuplicate(vector<int>& nums) {\n    int lo = 0, hi = (int) nums.size() - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid % 2 == 1) mid--;\n        if (nums[mid] == nums[mid + 1]) lo = mid + 2;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              c: `int singleNonDuplicate(int* nums, int numsSize) {\n    int lo = 0, hi = numsSize - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid % 2 == 1) mid--;\n        if (nums[mid] == nums[mid + 1]) lo = mid + 2;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              csharp: `public static int SingleNonDuplicate(int[] nums)\n{\n    int lo = 0, hi = nums.Length - 1;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (mid % 2 == 1) mid--;\n        if (nums[mid] == nums[mid + 1]) lo = mid + 2;\n        else hi = mid;\n    }\n    return nums[lo];\n}`,
              go: `func singleNonDuplicate(nums []int) int {\n	lo, hi := 0, len(nums)-1\n	for lo < hi {\n		mid := lo + (hi-lo)/2\n		if mid%2 == 1 {\n			mid--\n		}\n		if nums[mid] == nums[mid+1] {\n			lo = mid + 2\n		} else {\n			hi = mid\n		}\n	}\n	return nums[lo]\n}`,
              kotlin: `fun singleNonDuplicate(nums: IntArray): Int {\n    var lo = 0\n    var hi = nums.size - 1\n    while (lo < hi) {\n        var mid = lo + (hi - lo) / 2\n        if (mid % 2 == 1) mid--\n        if (nums[mid] == nums[mid + 1]) lo = mid + 2 else hi = mid\n    }\n    return nums[lo]\n}`,
              swift: `func singleNonDuplicate(_ nums: [Int]) -> Int {\n    var lo = 0\n    var hi = nums.count - 1\n    while lo < hi {\n        var mid = lo + (hi - lo) / 2\n        if mid % 2 == 1 { mid -= 1 }\n        if nums[mid] == nums[mid + 1] { lo = mid + 2 } else { hi = mid }\n    }\n    return nums[lo]\n}`,
              rust: `fn singleNonDuplicate(nums: Vec<i32>) -> i32 {\n    let mut lo = 0usize;\n    let mut hi = nums.len() - 1;\n    while lo < hi {\n        let mut mid = lo + (hi - lo) / 2;\n        if mid % 2 == 1 {\n            mid -= 1;\n        }\n        if nums[mid] == nums[mid + 1] {\n            lo = mid + 2;\n        } else {\n            hi = mid;\n        }\n    }\n    nums[lo]\n}`,
              php: `function singleNonDuplicate($nums) {\n    $lo = 0;\n    $hi = count($nums) - 1;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($mid % 2 === 1) $mid--;\n        if ($nums[$mid] === $nums[$mid + 1]) $lo = $mid + 2;\n        else $hi = $mid;\n    }\n    return $nums[$lo];\n}`,
              ruby: `def singleNonDuplicate(nums)\n  lo = 0\n  hi = nums.length - 1\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    mid -= 1 if mid % 2 == 1\n    if nums[mid] == nums[mid + 1]\n      lo = mid + 2\n    else\n      hi = mid\n    end\n  end\n  nums[lo]\nend`,
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
      editorial: explain({
        idea: "`k` complete rows consume `1 + 2 + … + k = k(k + 1) / 2` coins, and that total only grows with `k`. So the question is the largest `k` whose triangular number does not exceed `n` — a monotone predicate, and binary search finds the boundary in logarithmic time even for `n` in the hundreds of millions.",
        steps: [
          "Search `k` over `[0, n]`, tracking the best feasible value found.",
          "For each `mid`, compute the triangular number `mid * (mid + 1) / 2` in a **64-bit** type.",
          "If it is at most `n`, `mid` rows fit — record it and search higher.",
          "Otherwise search lower.",
          "Return the largest feasible `k`.",
        ],
        why: "Row `i` costs `i` coins, so the cost of `k` rows is the `k`-th triangular number — strictly increasing in `k`. That makes \"fits within `n`\" true up to some threshold and false beyond it, the single crossover binary search is built for. The closed form also solves directly via the quadratic `k = floor((sqrt(8n + 1) - 1) / 2)`, though floating point can round the wrong way at exact boundaries, which is why the integer search is the safer choice.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "`mid * (mid + 1)` **overflows 32 bits** for `mid` in the tens of thousands upward — compute it as 64-bit, or the comparison silently goes negative.",
          "Divide by two *after* multiplying (the product of consecutive integers is always even), not before.",
          "The answer counts only **complete** rows, so a partial final row does not count.",
          "Keep the last feasible `mid`; where the loop stops is not itself the answer.",
        ],
      }),
      solutions: {
        python: `def arrangeCoins(n: int) -> int:\n    lo, hi = 0, n\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if mid * (mid + 1) // 2 <= n:\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var arrangeCoins = function(n) {\n    let lo = 0, hi = n;\n    while (lo < hi) {\n        const mid = Math.floor((lo + hi + 1) / 2);\n        if (mid * (mid + 1) / 2 <= n) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n};`,
              typescript: `function arrangeCoins(n: number): number {\n    let lo = 0;\n    let hi = n;\n    let best = 0;\n    while (lo <= hi) {\n        const mid = lo + Math.floor((hi - lo) / 2);\n        const used = mid * (mid + 1) / 2;\n        if (used <= n) {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return best;\n}`,
              java: `public static int arrangeCoins(int n) {\n    long lo = 0, hi = n, best = 0;\n    while (lo <= hi) {\n        long mid = lo + (hi - lo) / 2;\n        long used = mid * (mid + 1) / 2;\n        if (used <= n) {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return (int) best;\n}`,
              cpp: `int arrangeCoins(int n) {\n    long long lo = 0, hi = n, best = 0;\n    while (lo <= hi) {\n        long long mid = lo + (hi - lo) / 2;\n        long long used = mid * (mid + 1) / 2;\n        if (used <= (long long) n) {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return (int) best;\n}`,
              c: `int arrangeCoins(int n) {\n    long long lo = 0, hi = n, best = 0;\n    while (lo <= hi) {\n        long long mid = lo + (hi - lo) / 2;\n        long long used = mid * (mid + 1) / 2;\n        if (used <= (long long) n) {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return (int) best;\n}`,
              csharp: `public static int ArrangeCoins(int n)\n{\n    long lo = 0, hi = n, best = 0;\n    while (lo <= hi)\n    {\n        long mid = lo + (hi - lo) / 2;\n        long used = mid * (mid + 1) / 2;\n        if (used <= n)\n        {\n            best = mid;\n            lo = mid + 1;\n        }\n        else\n        {\n            hi = mid - 1;\n        }\n    }\n    return (int) best;\n}`,
              go: `func arrangeCoins(n int) int {\n	lo, hi, best := 0, n, 0\n	for lo <= hi {\n		mid := lo + (hi-lo)/2\n		used := mid * (mid + 1) / 2\n		if used <= n {\n			best = mid\n			lo = mid + 1\n		} else {\n			hi = mid - 1\n		}\n	}\n	return best\n}`,
              kotlin: `fun arrangeCoins(n: Int): Int {\n    var lo = 0L\n    var hi = n.toLong()\n    var best = 0L\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        val used = mid * (mid + 1) / 2\n        if (used <= n.toLong()) {\n            best = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return best.toInt()\n}`,
              swift: `func arrangeCoins(_ n: Int) -> Int {\n    var lo = 0\n    var hi = n\n    var best = 0\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        let used = mid * (mid + 1) / 2\n        if used <= n {\n            best = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return best\n}`,
              rust: `fn arrangeCoins(n: i32) -> i32 {\n    let target = n as i64;\n    let mut lo: i64 = 0;\n    let mut hi: i64 = target;\n    let mut best: i64 = 0;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        let used = mid * (mid + 1) / 2;\n        if used <= target {\n            best = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    best as i32\n}`,
              php: `function arrangeCoins($n) {\n    $lo = 0;\n    $hi = $n;\n    $best = 0;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        $used = intdiv($mid * ($mid + 1), 2);\n        if ($used <= $n) {\n            $best = $mid;\n            $lo = $mid + 1;\n        } else {\n            $hi = $mid - 1;\n        }\n    }\n    return $best;\n}`,
              ruby: `def arrangeCoins(n)\n  lo = 0\n  hi = n\n  best = 0\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    used = mid * (mid + 1) / 2\n    if used <= n\n      best = mid\n      lo = mid + 1\n    else\n      hi = mid - 1\n    end\n  end\n  best\nend`,
      },
    };
  })(),

];
