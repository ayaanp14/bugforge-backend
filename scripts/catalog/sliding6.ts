/**
 * Sliding window & two pointers problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Several originals return a 64-bit count; their constraints are tightened
 * (stated in each entry) so the true answer fits in int32.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const SLIDING6_PROBLEMS: CatalogProblem[] = [

  // ── Longest Continuous Subarray With Absolute Diff ≤ Limit (LC 1438) ──
  (() => {
    const ref = (nums: number[], limit: number) => {
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        let lo = nums[i], hi = nums[i];
        for (let j = i; j < nums.length; j++) {
          lo = Math.min(lo, nums[j]);
          hi = Math.max(hi, nums[j]);
          if (hi - lo > limit) break;
          best = Math.max(best, j - i + 1);
        }
      }
      return best;
    };
    return {
      slug: "longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit",
      title: "Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Monotonic Queue", "Ordered Set", "Amazon", "Google", "Uber"],
      signature: { funcName: "longestSubarray", params: [{ name: "nums", type: "int[]" as const }, { name: "limit", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and an integer `limit`.\n\nFind the length of the longest **non-empty contiguous** subarray in which the absolute difference between **any two** of its elements is at most `limit`. Equivalently, the subarray's largest value minus its smallest value must not exceed `limit`.\n\nA single element always qualifies, so the answer is at least `1`.",
        [
          { in: "nums = [9,3,5,8], limit = 4", out: "2", note: "`[3,5]` (difference 2) and `[5,8]` (difference 3) qualify; every window of length 3 has a spread above 4." },
          { in: "nums = [12,3,4,6,9,4], limit = 5", out: "4", note: "`[4,6,9,4]` has maximum 9 and minimum 4, a spread of exactly 5." },
          { in: "nums = [5,3,3,3,5,5,3,3], limit = 0", out: "3", note: "With `limit = 0` every element of the window must be equal; the longest run is `[3,3,3]`." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^9", "0 <= limit <= 10^9"]),
      hints: [
        "Only the window's maximum and minimum matter: the window is valid exactly when `max - min <= limit`.",
        "Shrinking a valid window keeps it valid, so you can sweep the right end forward and only ever move the left end forward when the window breaks the rule.",
        "Keep two monotonic deques — one non-increasing (front = window max) and one non-decreasing (front = window min) — so both extremes are available in O(1) as the window slides.",
      ],
      editorial: explain({
        idea: "Validity depends only on the window's extremes, and any sub-window of a valid window is valid. That monotonicity is exactly what a two-pointer sliding window needs; two monotonic deques supply the running max and min.",
        steps: [
          "Keep `left = 0` and two deques of values: `maxQ` (non-increasing) and `minQ` (non-decreasing).",
          "For each `right`, pop from the back of `maxQ` every value smaller than `nums[right]`, then push it; do the mirror image on `minQ` (pop values larger than it).",
          "While `maxQ.front - minQ.front > limit`, the window is too wide: if `nums[left]` is at the front of either deque, pop it from that front, then advance `left`.",
          "The window `[left, right]` is now valid; record `right - left + 1` if it is the best so far.",
        ],
        why: "For a fixed `right`, the smallest valid `left` never moves backwards as `right` grows (adding an element can only widen the spread), so advancing `left` monotonically visits every candidate. Each deque holds the window's elements that could still become its max (or min); an element is dropped from the back only when a newer, larger (or smaller) element makes it irrelevant for every future window, so the fronts are always the true extremes.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Pop with a strict comparison (`<` for the max deque, `>` for the min deque) so equal values are kept; otherwise removing `nums[left]` by value can drop a duplicate that is still inside the window.",
          "Shrink with a `while`, not an `if` — one new element can require several left moves.",
          "A sorted multiset (or two heaps with lazy deletion) also works in O(n log n), but the deques are simpler and linear.",
        ],
      }),
      examples: [
        { input: "[9,3,5,8]\n4", expectedOutput: "2" },
        { input: "[12,3,4,6,9,4]\n5", expectedOutput: "4" },
        { input: "[5,3,3,3,5,5,3,3]\n0", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = (rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 40), ri(rng, 40, 80)]));
        const hiV = pick(rng, [3, 12, 1000, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hiV));
        if (rng() < 0.1) nums.sort((a, b) => a - b);
        const limit = rng() < 0.08 ? pick(rng, [0, 1000000000]) : ri(rng, 0, Math.max(1, Math.floor(hiV * pick(rng, [0.05, 0.2, 0.5, 1]))));
        return { input: `${fmtIntArr(nums)}\n${limit}`, expectedOutput: String(ref(nums, limit)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def longestSubarray(nums: List[int], limit: int) -> int:
              max_q = deque()
              min_q = deque()
              left = 0
              best = 0
              for right, v in enumerate(nums):
                  while max_q and max_q[-1] < v:
                      max_q.pop()
                  max_q.append(v)
                  while min_q and min_q[-1] > v:
                      min_q.pop()
                  min_q.append(v)
                  while max_q[0] - min_q[0] > limit:
                      if max_q[0] == nums[left]:
                          max_q.popleft()
                      if min_q[0] == nums[left]:
                          min_q.popleft()
                      left += 1
                  best = max(best, right - left + 1)
              return best
        `,
        javascript: code`
          var longestSubarray = function(nums, limit) {
              var n = nums.length;
              var maxQ = new Array(n), minQ = new Array(n);
              var maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, best = 0;
              for (var right = 0; right < n; right++) {
                  var v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > limit) {
                      if (maxQ[maxH] === nums[left]) maxH++;
                      if (minQ[minH] === nums[left]) minH++;
                      left++;
                  }
                  if (right - left + 1 > best) best = right - left + 1;
              }
              return best;
          };
        `,
        typescript: code`
          function longestSubarray(nums: number[], limit: number): number {
              var n = nums.length;
              var maxQ: number[] = [], minQ: number[] = [];
              var maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, best = 0;
              for (var right = 0; right < n; right++) {
                  var v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > limit) {
                      if (maxQ[maxH] === nums[left]) maxH++;
                      if (minQ[minH] === nums[left]) minH++;
                      left++;
                  }
                  if (right - left + 1 > best) best = right - left + 1;
              }
              return best;
          }
        `,
        java: code`
          public static int longestSubarray(int[] nums, int limit) {
              int n = nums.length;
              int[] maxQ = new int[n];
              int[] minQ = new int[n];
              int maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, best = 0;
              for (int right = 0; right < n; right++) {
                  int v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > limit) {
                      if (maxQ[maxH] == nums[left]) maxH++;
                      if (minQ[minH] == nums[left]) minH++;
                      left++;
                  }
                  best = Math.max(best, right - left + 1);
              }
              return best;
          }
        `,
        cpp: code`
          int longestSubarray(vector<int>& nums, int limit) {
              int n = nums.size();
              vector<int> maxQ(n), minQ(n);
              int maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, best = 0;
              for (int right = 0; right < n; right++) {
                  int v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > limit) {
                      if (maxQ[maxH] == nums[left]) maxH++;
                      if (minQ[minH] == nums[left]) minH++;
                      left++;
                  }
                  best = max(best, right - left + 1);
              }
              return best;
          }
        `,
        c: code`
          int longestSubarray(int* nums, int numsSize, int limit) {
              int* maxQ = (int*)malloc(sizeof(int) * (numsSize + 1));
              int* minQ = (int*)malloc(sizeof(int) * (numsSize + 1));
              int maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, best = 0;
              for (int right = 0; right < numsSize; right++) {
                  int v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > limit) {
                      if (maxQ[maxH] == nums[left]) maxH++;
                      if (minQ[minH] == nums[left]) minH++;
                      left++;
                  }
                  if (right - left + 1 > best) best = right - left + 1;
              }
              free(maxQ);
              free(minQ);
              return best;
          }
        `,
        csharp: code`
          public static int LongestSubarray(int[] nums, int limit)
          {
              int n = nums.Length;
              int[] maxQ = new int[n];
              int[] minQ = new int[n];
              int maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, best = 0;
              for (int right = 0; right < n; right++)
              {
                  int v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > limit)
                  {
                      if (maxQ[maxH] == nums[left]) maxH++;
                      if (minQ[minH] == nums[left]) minH++;
                      left++;
                  }
                  best = Math.Max(best, right - left + 1);
              }
              return best;
          }
        `,
        go: code`
          func longestSubarray(nums []int, limit int) int {
              n := len(nums)
              maxQ := make([]int, n)
              minQ := make([]int, n)
              maxH, maxT, minH, minT, left, best := 0, 0, 0, 0, 0, 0
              for right := 0; right < n; right++ {
                  v := nums[right]
                  for maxT > maxH && maxQ[maxT-1] < v {
                      maxT--
                  }
                  maxQ[maxT] = v
                  maxT++
                  for minT > minH && minQ[minT-1] > v {
                      minT--
                  }
                  minQ[minT] = v
                  minT++
                  for maxQ[maxH]-minQ[minH] > limit {
                      if maxQ[maxH] == nums[left] {
                          maxH++
                      }
                      if minQ[minH] == nums[left] {
                          minH++
                      }
                      left++
                  }
                  if right-left+1 > best {
                      best = right - left + 1
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun longestSubarray(nums: IntArray, limit: Int): Int {
              val n = nums.size
              val maxQ = IntArray(n)
              val minQ = IntArray(n)
              var maxH = 0
              var maxT = 0
              var minH = 0
              var minT = 0
              var left = 0
              var best = 0
              for (right in 0 until n) {
                  val v = nums[right]
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--
                  maxQ[maxT] = v
                  maxT++
                  while (minT > minH && minQ[minT - 1] > v) minT--
                  minQ[minT] = v
                  minT++
                  while (maxQ[maxH] - minQ[minH] > limit) {
                      if (maxQ[maxH] == nums[left]) maxH++
                      if (minQ[minH] == nums[left]) minH++
                      left++
                  }
                  if (right - left + 1 > best) best = right - left + 1
              }
              return best
          }
        `,
        swift: code`
          func longestSubarray(_ nums: [Int], _ limit: Int) -> Int {
              let n = nums.count
              var maxQ = [Int](repeating: 0, count: n)
              var minQ = [Int](repeating: 0, count: n)
              var maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, best = 0
              for right in 0..<n {
                  let v = nums[right]
                  while maxT > maxH && maxQ[maxT - 1] < v { maxT -= 1 }
                  maxQ[maxT] = v
                  maxT += 1
                  while minT > minH && minQ[minT - 1] > v { minT -= 1 }
                  minQ[minT] = v
                  minT += 1
                  while maxQ[maxH] - minQ[minH] > limit {
                      if maxQ[maxH] == nums[left] { maxH += 1 }
                      if minQ[minH] == nums[left] { minH += 1 }
                      left += 1
                  }
                  best = max(best, right - left + 1)
              }
              return best
          }
        `,
        rust: code`
          fn longestSubarray(nums: Vec<i32>, limit: i32) -> i32 {
              let n = nums.len();
              let mut max_q = vec![0i32; n];
              let mut min_q = vec![0i32; n];
              let (mut max_h, mut max_t, mut min_h, mut min_t) = (0usize, 0usize, 0usize, 0usize);
              let mut left = 0usize;
              let mut best = 0usize;
              for right in 0..n {
                  let v = nums[right];
                  while max_t > max_h && max_q[max_t - 1] < v {
                      max_t -= 1;
                  }
                  max_q[max_t] = v;
                  max_t += 1;
                  while min_t > min_h && min_q[min_t - 1] > v {
                      min_t -= 1;
                  }
                  min_q[min_t] = v;
                  min_t += 1;
                  while max_q[max_h] - min_q[min_h] > limit {
                      if max_q[max_h] == nums[left] {
                          max_h += 1;
                      }
                      if min_q[min_h] == nums[left] {
                          min_h += 1;
                      }
                      left += 1;
                  }
                  if right + 1 - left > best {
                      best = right + 1 - left;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function longestSubarray($nums, $limit) {
              $n = count($nums);
              $maxQ = array_fill(0, $n, 0);
              $minQ = array_fill(0, $n, 0);
              $maxH = 0; $maxT = 0; $minH = 0; $minT = 0; $left = 0; $best = 0;
              for ($right = 0; $right < $n; $right++) {
                  $v = $nums[$right];
                  while ($maxT > $maxH && $maxQ[$maxT - 1] < $v) $maxT--;
                  $maxQ[$maxT++] = $v;
                  while ($minT > $minH && $minQ[$minT - 1] > $v) $minT--;
                  $minQ[$minT++] = $v;
                  while ($maxQ[$maxH] - $minQ[$minH] > $limit) {
                      if ($maxQ[$maxH] == $nums[$left]) $maxH++;
                      if ($minQ[$minH] == $nums[$left]) $minH++;
                      $left++;
                  }
                  if ($right - $left + 1 > $best) $best = $right - $left + 1;
              }
              return $best;
          }
        `,
        ruby: code`
          def longestSubarray(nums, limit)
            n = nums.length
            max_q = Array.new(n, 0)
            min_q = Array.new(n, 0)
            max_h = max_t = min_h = min_t = left = best = 0
            (0...n).each do |right|
              v = nums[right]
              max_t -= 1 while max_t > max_h && max_q[max_t - 1] < v
              max_q[max_t] = v
              max_t += 1
              min_t -= 1 while min_t > min_h && min_q[min_t - 1] > v
              min_q[min_t] = v
              min_t += 1
              while max_q[max_h] - min_q[min_h] > limit
                max_h += 1 if max_q[max_h] == nums[left]
                min_h += 1 if min_q[min_h] == nums[left]
                left += 1
              end
              best = right - left + 1 if right - left + 1 > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Maximum Length of Subarray With Positive Product (LC 1567) ──
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        let sign = 1;
        for (let j = i; j < nums.length; j++) {
          if (nums[j] === 0) break;
          if (nums[j] < 0) sign = -sign;
          if (sign > 0) best = Math.max(best, j - i + 1);
        }
      }
      return best;
    };
    return {
      slug: "maximum-length-of-subarray-with-positive-product",
      title: "Maximum Length of Subarray With Positive Product",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Greedy", "Amazon", "Microsoft", "Arcesium"],
      signature: { funcName: "getMaxLen", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the length of the longest **contiguous** subarray whose product of all elements is **strictly positive**.\n\nA subarray is a run of consecutive elements. If no subarray has a positive product (for example, every element is zero or negative and isolated by zeros), return `0`.\n\nYou only need the sign of the product — the values themselves can be large.",
        [
          { in: "nums = [2,-5,-1,3]", out: "4", note: "The two negatives cancel, so the whole array has product 30." },
          { in: "nums = [0,4,-1,-2,-6]", out: "3", note: "`[4,-1,-2]` has product 8. Any window containing all three negatives is negative, and the zero cannot be included." },
          { in: "nums = [-3,-7,-2,0,5]", out: "2", note: "`[-3,-7]` or `[-7,-2]`; the run of three negatives is negative." },
        ],
        ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"]),
      hints: [
        "A zero kills every subarray that contains it, so the array splits into independent zero-free segments.",
        "Inside a zero-free segment the sign of a product depends only on how many negatives it holds — an even count means positive.",
        "Scan once, tracking two lengths that end at the current index: the longest with a positive product and the longest with a negative product. A negative number swaps them (each extended by one).",
      ],
      editorial: explain({
        idea: "Track, for subarrays ending at the current index, the longest one with a positive product (`pos`) and the longest with a negative product (`neg`). Each new element updates both in O(1).",
        steps: [
          "Start with `pos = neg = 0` and `best = 0`.",
          "For a positive element: `pos = pos + 1`; `neg = neg + 1` if `neg > 0`, otherwise it stays 0 (a positive number alone cannot start a negative product).",
          "For a negative element: the new `pos` is `neg + 1` if `neg > 0` (else 0), and the new `neg` is `pos + 1` — compute both from the old values.",
          "For zero: reset `pos = neg = 0`.",
          "After each element, `best = max(best, pos)`.",
        ],
        why: "Every subarray ending at index `i` is an extension of a subarray ending at `i - 1` (or the element alone). Multiplying by a positive keeps signs, by a negative flips them, and a zero makes everything 0. So the longest positive and longest negative runs ending at `i` are determined by the two values at `i - 1`, and the answer is the best `pos` over all end positions.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Never multiply the actual values — with up to 10^5 factors of size 10^9 the product overflows every integer type. Only signs matter.",
          "On a negative element, update `pos` and `neg` simultaneously from the previous values (use a temporary).",
          "`neg + 1` is only valid when a negative run exists (`neg > 0`); otherwise the extension does not exist and the value must be 0.",
        ],
      }),
      examples: [
        { input: "[2,-5,-1,3]", expectedOutput: "4" },
        { input: "[0,4,-1,-2,-6]", expectedOutput: "3" },
        { input: "[-3,-7,-2,0,5]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 2, 6), ri(rng, 7, 30), ri(rng, 30, 80)]);
        const mode = ri(rng, 0, 4);
        const zeroP = pick(rng, [0, 0.05, 0.2, 0.5]);
        const negP = pick(rng, [0, 0.2, 0.5, 0.8, 1]);
        const big = mode === 4;
        const nums = Array.from({ length: n }, () => {
          if (rng() < zeroP) return 0;
          const mag = big ? ri(rng, 1, 1000000000) : ri(rng, 1, 9);
          return rng() < negP ? -mag : mag;
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getMaxLen(nums: List[int]) -> int:
              pos = 0
              neg = 0
              best = 0
              for v in nums:
                  if v > 0:
                      pos += 1
                      neg = neg + 1 if neg > 0 else 0
                  elif v < 0:
                      new_pos = neg + 1 if neg > 0 else 0
                      neg = pos + 1
                      pos = new_pos
                  else:
                      pos = 0
                      neg = 0
                  best = max(best, pos)
              return best
        `,
        javascript: code`
          var getMaxLen = function(nums) {
              var pos = 0, neg = 0, best = 0;
              for (var i = 0; i < nums.length; i++) {
                  var v = nums[i];
                  if (v > 0) {
                      pos = pos + 1;
                      neg = neg > 0 ? neg + 1 : 0;
                  } else if (v < 0) {
                      var np = neg > 0 ? neg + 1 : 0;
                      neg = pos + 1;
                      pos = np;
                  } else {
                      pos = 0;
                      neg = 0;
                  }
                  if (pos > best) best = pos;
              }
              return best;
          };
        `,
        typescript: code`
          function getMaxLen(nums: number[]): number {
              var pos = 0, neg = 0, best = 0;
              for (var i = 0; i < nums.length; i++) {
                  var v = nums[i];
                  if (v > 0) {
                      pos = pos + 1;
                      neg = neg > 0 ? neg + 1 : 0;
                  } else if (v < 0) {
                      var np = neg > 0 ? neg + 1 : 0;
                      neg = pos + 1;
                      pos = np;
                  } else {
                      pos = 0;
                      neg = 0;
                  }
                  if (pos > best) best = pos;
              }
              return best;
          }
        `,
        java: code`
          public static int getMaxLen(int[] nums) {
              int pos = 0, neg = 0, best = 0;
              for (int v : nums) {
                  if (v > 0) {
                      pos = pos + 1;
                      neg = neg > 0 ? neg + 1 : 0;
                  } else if (v < 0) {
                      int np = neg > 0 ? neg + 1 : 0;
                      neg = pos + 1;
                      pos = np;
                  } else {
                      pos = 0;
                      neg = 0;
                  }
                  best = Math.max(best, pos);
              }
              return best;
          }
        `,
        cpp: code`
          int getMaxLen(vector<int>& nums) {
              int pos = 0, neg = 0, best = 0;
              for (int v : nums) {
                  if (v > 0) {
                      pos = pos + 1;
                      neg = neg > 0 ? neg + 1 : 0;
                  } else if (v < 0) {
                      int np = neg > 0 ? neg + 1 : 0;
                      neg = pos + 1;
                      pos = np;
                  } else {
                      pos = 0;
                      neg = 0;
                  }
                  best = max(best, pos);
              }
              return best;
          }
        `,
        c: code`
          int getMaxLen(int* nums, int numsSize) {
              int pos = 0, neg = 0, best = 0;
              for (int i = 0; i < numsSize; i++) {
                  int v = nums[i];
                  if (v > 0) {
                      pos = pos + 1;
                      neg = neg > 0 ? neg + 1 : 0;
                  } else if (v < 0) {
                      int np = neg > 0 ? neg + 1 : 0;
                      neg = pos + 1;
                      pos = np;
                  } else {
                      pos = 0;
                      neg = 0;
                  }
                  if (pos > best) best = pos;
              }
              return best;
          }
        `,
        csharp: code`
          public static int GetMaxLen(int[] nums)
          {
              int pos = 0, neg = 0, best = 0;
              foreach (int v in nums)
              {
                  if (v > 0)
                  {
                      pos = pos + 1;
                      neg = neg > 0 ? neg + 1 : 0;
                  }
                  else if (v < 0)
                  {
                      int np = neg > 0 ? neg + 1 : 0;
                      neg = pos + 1;
                      pos = np;
                  }
                  else
                  {
                      pos = 0;
                      neg = 0;
                  }
                  best = Math.Max(best, pos);
              }
              return best;
          }
        `,
        go: code`
          func getMaxLen(nums []int) int {
              pos, neg, best := 0, 0, 0
              for _, v := range nums {
                  if v > 0 {
                      pos = pos + 1
                      if neg > 0 {
                          neg = neg + 1
                      } else {
                          neg = 0
                      }
                  } else if v < 0 {
                      np := 0
                      if neg > 0 {
                          np = neg + 1
                      }
                      neg = pos + 1
                      pos = np
                  } else {
                      pos = 0
                      neg = 0
                  }
                  if pos > best {
                      best = pos
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun getMaxLen(nums: IntArray): Int {
              var pos = 0
              var neg = 0
              var best = 0
              for (v in nums) {
                  if (v > 0) {
                      pos = pos + 1
                      neg = if (neg > 0) neg + 1 else 0
                  } else if (v < 0) {
                      val np = if (neg > 0) neg + 1 else 0
                      neg = pos + 1
                      pos = np
                  } else {
                      pos = 0
                      neg = 0
                  }
                  if (pos > best) best = pos
              }
              return best
          }
        `,
        swift: code`
          func getMaxLen(_ nums: [Int]) -> Int {
              var pos = 0, neg = 0, best = 0
              for v in nums {
                  if v > 0 {
                      pos = pos + 1
                      neg = neg > 0 ? neg + 1 : 0
                  } else if v < 0 {
                      let np = neg > 0 ? neg + 1 : 0
                      neg = pos + 1
                      pos = np
                  } else {
                      pos = 0
                      neg = 0
                  }
                  best = max(best, pos)
              }
              return best
          }
        `,
        rust: code`
          fn getMaxLen(nums: Vec<i32>) -> i32 {
              let mut pos = 0i32;
              let mut neg = 0i32;
              let mut best = 0i32;
              for &v in nums.iter() {
                  if v > 0 {
                      pos += 1;
                      neg = if neg > 0 { neg + 1 } else { 0 };
                  } else if v < 0 {
                      let np = if neg > 0 { neg + 1 } else { 0 };
                      neg = pos + 1;
                      pos = np;
                  } else {
                      pos = 0;
                      neg = 0;
                  }
                  if pos > best {
                      best = pos;
                  }
              }
              best
          }
        `,
        php: code`
          function getMaxLen($nums) {
              $pos = 0; $neg = 0; $best = 0;
              foreach ($nums as $v) {
                  if ($v > 0) {
                      $pos = $pos + 1;
                      $neg = $neg > 0 ? $neg + 1 : 0;
                  } elseif ($v < 0) {
                      $np = $neg > 0 ? $neg + 1 : 0;
                      $neg = $pos + 1;
                      $pos = $np;
                  } else {
                      $pos = 0;
                      $neg = 0;
                  }
                  if ($pos > $best) $best = $pos;
              }
              return $best;
          }
        `,
        ruby: code`
          def getMaxLen(nums)
            pos = 0
            neg = 0
            best = 0
            nums.each do |v|
              if v > 0
                pos += 1
                neg = neg > 0 ? neg + 1 : 0
              elsif v < 0
                np = neg > 0 ? neg + 1 : 0
                neg = pos + 1
                pos = np
              else
                pos = 0
                neg = 0
              end
              best = pos if pos > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Ways to Split Array Into Three Subarrays (LC 1712) ──────────
  (() => {
    const MOD = 1000000007;
    const ref = (nums: number[]) => {
      const n = nums.length;
      const pre = [0];
      for (let i = 0; i < n; i++) pre.push(pre[i] + nums[i]);
      let count = 0;
      for (let i = 1; i <= n - 2; i++) {
        for (let j = i + 1; j <= n - 1; j++) {
          const a = pre[i], b = pre[j] - pre[i], c = pre[n] - pre[j];
          if (a <= b && b <= c) count++;
        }
      }
      return count % MOD;
    };
    return {
      slug: "ways-to-split-array-into-three-subarrays",
      title: "Ways to Split Array Into Three Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "waysToSplit", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of **non-negative** integers. Cut it into three **non-empty contiguous** parts — `left`, `mid` and `right`, in that order — so that every element belongs to exactly one part.\n\nA cut is **good** when `sum(left) <= sum(mid) <= sum(right)`.\n\nReturn the number of good cuts. Two cuts are different when at least one of the two cut positions differs. Since the count can be huge, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [2,2,2]", out: "1", note: "The only cut is `[2] | [2] | [2]`, and 2 <= 2 <= 2." },
          { in: "nums = [1,3,1,2,4,1]", out: "2", note: "`[1] | [3] | [1,2,4,1]` and `[1] | [3,1] | [2,4,1]`." },
          { in: "nums = [5,1,1]", out: "0", note: "The left part alone already outweighs the middle." },
        ],
        ["3 <= nums.length <= 10^5", "0 <= nums[i] <= 10^4"]),
      hints: [
        "With prefix sums `P`, a cut after `i` elements and after `j` elements gives sums `P[i]`, `P[j] - P[i]` and `P[n] - P[j]`.",
        "For a fixed `i` the conditions become `P[j] >= 2 * P[i]` and `2 * P[j] <= P[n] + P[i]`. Because the numbers are non-negative, `P` never decreases, so the valid `j` form one contiguous range.",
        "Both ends of that range only move right as `i` grows, so two pointers (or two binary searches per `i`) count every range in total linear time. Stop once `3 * P[i] > P[n]`.",
      ],
      editorial: explain({
        idea: "Fix the end of the left part. Because every element is non-negative, prefix sums are non-decreasing, so the valid end positions of the middle part form a contiguous range whose two boundaries never move left as the left part grows.",
        steps: [
          "Build prefix sums `P` with `P[0] = 0` and `P[k]` = sum of the first `k` elements; let `total = P[n]`.",
          "For `i` from 1 to `n - 2` (left = first `i` elements): if `3 * P[i] > total`, stop — no later `i` can work.",
          "Advance `j` (starting at least at `i + 1`) while `j <= n - 1` and `P[j] < 2 * P[i]`; `j` is the first valid middle end.",
          "Advance `k` (starting at least at `j`) while `k <= n - 1` and `2 * P[k] <= total + P[i]`; `k` is one past the last valid middle end.",
          "Add `k - j` to the answer, modulo `10^9 + 7`.",
        ],
        why: "`P[j] >= 2P[i]` is `sum(mid) >= sum(left)` and `2P[j] <= total + P[i]` is `sum(right) >= sum(mid)`. Since `P` is non-decreasing, the first condition holds on a suffix of positions and the second on a prefix, so their intersection is a range `[j, k)`. Increasing `i` raises both thresholds, so both `j` and `k` only move forward — every pointer travels at most `n` steps.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "`2 * P[i]`, `3 * P[i]` and `total + P[i]` reach about 3·10^9 — use 64-bit arithmetic in fixed-width languages.",
          "The middle and right parts must be non-empty: `j` ranges over `i + 1 .. n - 1`, never `n`.",
          "Zeros make many cuts valid at once (an all-zero array of length `n` has `(n-1)(n-2)/2` good cuts), so the count needs the modulus.",
        ],
      }),
      examples: [
        { input: "[2,2,2]", expectedOutput: "1" },
        { input: "[1,3,1,2,4,1]", expectedOutput: "2" },
        { input: "[5,1,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = (rng() < 0.05 ? 3 : pick(rng, [ri(rng, 4, 8), ri(rng, 9, 30), ri(rng, 30, 60)]));
        const mode = ri(rng, 0, 4);
        let nums: number[];
        if (mode === 0) nums = Array.from({ length: n }, () => (rng() < 0.6 ? 0 : ri(rng, 0, 3)));
        else if (mode === 1) nums = Array.from({ length: n }, () => ri(rng, 0, 10));
        else if (mode === 2) nums = Array.from({ length: n }, () => ri(rng, 0, 10000));
        else if (mode === 3) nums = Array.from({ length: n }, () => pick(rng, [0, 10000, ri(rng, 9000, 10000)]));
        else nums = Array.from({ length: n }, (_, i) => (rng() < 0.15 ? 0 : i + ri(rng, 0, 3)));
        if (rng() < 0.04) nums = nums.map(() => 0);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def waysToSplit(nums: List[int]) -> int:
              MOD = 10 ** 9 + 7
              n = len(nums)
              pre = [0] * (n + 1)
              for i, v in enumerate(nums):
                  pre[i + 1] = pre[i] + v
              total = pre[n]
              ans = 0
              j = 0
              k = 0
              for i in range(1, n - 1):
                  if 3 * pre[i] > total:
                      break
                  j = max(j, i + 1)
                  while j <= n - 1 and pre[j] < 2 * pre[i]:
                      j += 1
                  k = max(k, j)
                  while k <= n - 1 and 2 * pre[k] <= total + pre[i]:
                      k += 1
                  ans += k - j
              return ans % MOD
        `,
        javascript: code`
          var waysToSplit = function(nums) {
              var MOD = 1000000007;
              var n = nums.length;
              var pre = new Array(n + 1);
              pre[0] = 0;
              for (var i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              var total = pre[n];
              var ans = 0, j = 0, k = 0;
              for (var i = 1; i <= n - 2; i++) {
                  if (3 * pre[i] > total) break;
                  if (j < i + 1) j = i + 1;
                  while (j <= n - 1 && pre[j] < 2 * pre[i]) j++;
                  if (k < j) k = j;
                  while (k <= n - 1 && 2 * pre[k] <= total + pre[i]) k++;
                  ans = (ans + k - j) % MOD;
              }
              return ans;
          };
        `,
        typescript: code`
          function waysToSplit(nums: number[]): number {
              var MOD = 1000000007;
              var n = nums.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + nums[i]);
              var total = pre[n];
              var ans = 0, j = 0, k = 0;
              for (var i = 1; i <= n - 2; i++) {
                  if (3 * pre[i] > total) break;
                  if (j < i + 1) j = i + 1;
                  while (j <= n - 1 && pre[j] < 2 * pre[i]) j++;
                  if (k < j) k = j;
                  while (k <= n - 1 && 2 * pre[k] <= total + pre[i]) k++;
                  ans = (ans + k - j) % MOD;
              }
              return ans;
          }
        `,
        java: code`
          public static int waysToSplit(int[] nums) {
              final long MOD = 1000000007L;
              int n = nums.length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              long total = pre[n];
              long ans = 0;
              int j = 0, k = 0;
              for (int i = 1; i <= n - 2; i++) {
                  if (3 * pre[i] > total) break;
                  if (j < i + 1) j = i + 1;
                  while (j <= n - 1 && pre[j] < 2 * pre[i]) j++;
                  if (k < j) k = j;
                  while (k <= n - 1 && 2 * pre[k] <= total + pre[i]) k++;
                  ans = (ans + k - j) % MOD;
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int waysToSplit(vector<int>& nums) {
              const long long MOD = 1000000007LL;
              int n = nums.size();
              vector<long long> pre(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              long long total = pre[n];
              long long ans = 0;
              int j = 0, k = 0;
              for (int i = 1; i <= n - 2; i++) {
                  if (3 * pre[i] > total) break;
                  if (j < i + 1) j = i + 1;
                  while (j <= n - 1 && pre[j] < 2 * pre[i]) j++;
                  if (k < j) k = j;
                  while (k <= n - 1 && 2 * pre[k] <= total + pre[i]) k++;
                  ans = (ans + k - j) % MOD;
              }
              return (int) ans;
          }
        `,
        c: code`
          int waysToSplit(int* nums, int numsSize) {
              const long long MOD = 1000000007LL;
              int n = numsSize;
              long long* pre = (long long*)malloc(sizeof(long long) * (n + 1));
              pre[0] = 0;
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              long long total = pre[n];
              long long ans = 0;
              int j = 0, k = 0;
              for (int i = 1; i <= n - 2; i++) {
                  if (3 * pre[i] > total) break;
                  if (j < i + 1) j = i + 1;
                  while (j <= n - 1 && pre[j] < 2 * pre[i]) j++;
                  if (k < j) k = j;
                  while (k <= n - 1 && 2 * pre[k] <= total + pre[i]) k++;
                  ans = (ans + k - j) % MOD;
              }
              free(pre);
              return (int) ans;
          }
        `,
        csharp: code`
          public static int WaysToSplit(int[] nums)
          {
              const long MOD = 1000000007L;
              int n = nums.Length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              long total = pre[n];
              long ans = 0;
              int j = 0, k = 0;
              for (int i = 1; i <= n - 2; i++)
              {
                  if (3 * pre[i] > total) break;
                  if (j < i + 1) j = i + 1;
                  while (j <= n - 1 && pre[j] < 2 * pre[i]) j++;
                  if (k < j) k = j;
                  while (k <= n - 1 && 2 * pre[k] <= total + pre[i]) k++;
                  ans = (ans + k - j) % MOD;
              }
              return (int) ans;
          }
        `,
        go: code`
          func waysToSplit(nums []int) int {
              const MOD int64 = 1000000007
              n := len(nums)
              pre := make([]int64, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + int64(nums[i])
              }
              total := pre[n]
              var ans int64 = 0
              j, k := 0, 0
              for i := 1; i <= n-2; i++ {
                  if 3*pre[i] > total {
                      break
                  }
                  if j < i+1 {
                      j = i + 1
                  }
                  for j <= n-1 && pre[j] < 2*pre[i] {
                      j++
                  }
                  if k < j {
                      k = j
                  }
                  for k <= n-1 && 2*pre[k] <= total+pre[i] {
                      k++
                  }
                  ans = (ans + int64(k-j)) % MOD
              }
              return int(ans)
          }
        `,
        kotlin: code`
          fun waysToSplit(nums: IntArray): Int {
              val MOD = 1000000007L
              val n = nums.size
              val pre = LongArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + nums[i]
              val total = pre[n]
              var ans = 0L
              var j = 0
              var k = 0
              for (i in 1..n - 2) {
                  if (3 * pre[i] > total) break
                  if (j < i + 1) j = i + 1
                  while (j <= n - 1 && pre[j] < 2 * pre[i]) j++
                  if (k < j) k = j
                  while (k <= n - 1 && 2 * pre[k] <= total + pre[i]) k++
                  ans = (ans + (k - j)) % MOD
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func waysToSplit(_ nums: [Int]) -> Int {
              let MOD = 1000000007
              let n = nums.count
              var pre = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + nums[i] }
              let total = pre[n]
              var ans = 0
              var j = 0
              var k = 0
              var i = 1
              while i <= n - 2 {
                  if 3 * pre[i] > total { break }
                  if j < i + 1 { j = i + 1 }
                  while j <= n - 1 && pre[j] < 2 * pre[i] { j += 1 }
                  if k < j { k = j }
                  while k <= n - 1 && 2 * pre[k] <= total + pre[i] { k += 1 }
                  ans = (ans + k - j) % MOD
                  i += 1
              }
              return ans
          }
        `,
        rust: code`
          fn waysToSplit(nums: Vec<i32>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let n = nums.len();
              let mut pre = vec![0i64; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + nums[i] as i64;
              }
              let total = pre[n];
              let mut ans: i64 = 0;
              let mut j = 0usize;
              let mut k = 0usize;
              for i in 1..n - 1 {
                  if 3 * pre[i] > total {
                      break;
                  }
                  if j < i + 1 {
                      j = i + 1;
                  }
                  while j <= n - 1 && pre[j] < 2 * pre[i] {
                      j += 1;
                  }
                  if k < j {
                      k = j;
                  }
                  while k <= n - 1 && 2 * pre[k] <= total + pre[i] {
                      k += 1;
                  }
                  ans = (ans + (k - j) as i64) % modulus;
              }
              ans as i32
          }
        `,
        php: code`
          function waysToSplit($nums) {
              $MOD = 1000000007;
              $n = count($nums);
              $pre = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $nums[$i];
              $total = $pre[$n];
              $ans = 0; $j = 0; $k = 0;
              for ($i = 1; $i <= $n - 2; $i++) {
                  if (3 * $pre[$i] > $total) break;
                  if ($j < $i + 1) $j = $i + 1;
                  while ($j <= $n - 1 && $pre[$j] < 2 * $pre[$i]) $j++;
                  if ($k < $j) $k = $j;
                  while ($k <= $n - 1 && 2 * $pre[$k] <= $total + $pre[$i]) $k++;
                  $ans = ($ans + $k - $j) % $MOD;
              }
              return $ans;
          }
        `,
        ruby: code`
          def waysToSplit(nums)
            mod = 1_000_000_007
            n = nums.length
            pre = Array.new(n + 1, 0)
            n.times { |i| pre[i + 1] = pre[i] + nums[i] }
            total = pre[n]
            ans = 0
            j = 0
            k = 0
            (1..n - 2).each do |i|
              break if 3 * pre[i] > total
              j = i + 1 if j < i + 1
              j += 1 while j <= n - 1 && pre[j] < 2 * pre[i]
              k = j if k < j
              k += 1 while k <= n - 1 && 2 * pre[k] <= total + pre[i]
              ans = (ans + k - j) % mod
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Minimum Moves to Make Array Complementary (LC 1674) ─────────
  (() => {
    const ref = (nums: number[], limit: number) => {
      const n = nums.length;
      let best = Infinity;
      for (let t = 2; t <= 2 * limit; t++) {
        let moves = 0;
        for (let i = 0; i < n / 2; i++) {
          const a = nums[i], b = nums[n - 1 - i];
          if (a + b === t) continue;
          if (Math.min(a, b) + 1 <= t && t <= Math.max(a, b) + limit) moves += 1;
          else moves += 2;
        }
        best = Math.min(best, moves);
      }
      return best;
    };
    return {
      slug: "minimum-moves-to-make-array-complementary",
      title: "Minimum Moves to Make Array Complementary",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "minMoves", params: [{ name: "nums", type: "int[]" as const }, { name: "limit", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` of **even** length `n` and an integer `limit`. In one move you may replace any single element of `nums` with any integer between `1` and `limit`, inclusive.\n\nThe array is **complementary** when every mirrored pair has the same sum: there is one number `T` with `nums[i] + nums[n - 1 - i] == T` for every index `i`. For example, `[1,2,3,4]` is complementary because both pairs sum to `5`.\n\nReturn the **minimum** number of moves needed to make `nums` complementary.",
        [
          { in: "nums = [2,5,3,4], limit = 5", out: "1", note: "The pairs are (2,4) with sum 6 and (5,3) with sum 8. Changing the 5 to a 3 makes both sums 6." },
          { in: "nums = [3,1,1,3], limit = 3", out: "2", note: "The pairs (3,3) and (1,1) sum to 6 and 2. One change moves (3,3) only to sums 4..6 and (1,1) only to sums 2..4, so no target is fixed by a single move; target 4 costs one move per pair, e.g. `[3,1,3,1]`." },
          { in: "nums = [4,1,6,3], limit = 6", out: "0", note: "Both pairs already sum to 7." },
        ],
        ["n == nums.length", "2 <= n <= 10^5", "1 <= nums[i] <= limit <= 10^5", "n is even"]),
      hints: [
        "Try every possible common sum `T` from `2` to `2 * limit`. For one pair `(a, b)`, how many moves does it need to reach `T`?",
        "A pair costs 0 if `a + b == T`; 1 if `T` lies in `[min(a,b) + 1, max(a,b) + limit]` (change only the bigger or only the smaller element); otherwise 2.",
        "Each pair's cost as a function of `T` is a step function with four breakpoints. Add all of them into a difference array over `T` and take the smallest prefix sum.",
      ],
      editorial: explain({
        idea: "For a fixed target sum `T`, each mirrored pair independently needs 0, 1 or 2 moves, and its cost changes only at four points. Recording those changes in a difference array lets us evaluate every `T` at once.",
        steps: [
          "Create a difference array `diff` over sums `0 .. 2 * limit + 1`.",
          "For each pair `(a, b)` with `lo = min(a, b)` and `hi = max(a, b)`: the cost starts at 2 (`diff[2] += 2`), drops to 1 from `lo + 1` (`diff[lo + 1] -= 1`), drops to 0 at exactly `a + b` (`diff[a + b] -= 1`, `diff[a + b + 1] += 1`), and returns to 2 after `hi + limit` (`diff[hi + limit + 1] += 1`).",
          "Sweep `T` from 2 to `2 * limit`, keeping a running sum of `diff`; the running sum is the total moves for that `T`.",
          "Return the smallest running sum.",
        ],
        why: "Changing one element of the pair `(a, b)` can produce any sum from `lo + 1` (replace `hi` by 1) to `hi + limit` (replace `lo` by `limit`), and two changes reach any sum in `[2, 2 * limit]`. So the per-pair cost is exactly 2 / 1 / 0 / 1 / 2 across those breakpoints, and since pairs are independent the total for a given `T` is the sum of the pair costs — which is what the prefix sum of the difference array computes.",
        time: "O(n + limit)",
        space: "O(limit)",
        pitfalls: [
          "Trying every `T` against every pair directly is O(n · limit) — up to 10^10 operations.",
          "The one-move range is `[lo + 1, hi + limit]`, built from the smaller and the larger element respectively; swapping them gives wrong bounds.",
          "The target must be reachable for every pair, so only sums `2 .. 2 * limit` are candidates.",
        ],
      }),
      examples: [
        { input: "[2,5,3,4]\n5", expectedOutput: "1" },
        { input: "[3,1,1,3]\n3", expectedOutput: "2" },
        { input: "[4,1,6,3]\n6", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const half = (rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 4), ri(rng, 5, 15), ri(rng, 15, 30)]));
        const limit = (rng() < 0.04 ? 1 : pick(rng, [2, ri(rng, 3, 6), ri(rng, 6, 40), ri(rng, 40, 200)]));
        let nums: number[];
        if (rng() < 0.25) {
          const t = ri(rng, 2, 2 * limit);
          nums = new Array(half * 2).fill(0);
          for (let i = 0; i < half; i++) {
            const a = ri(rng, Math.max(1, t - limit), Math.min(limit, t - 1));
            nums[i] = a;
            nums[2 * half - 1 - i] = t - a;
          }
          const flips = ri(rng, 0, 2);
          for (let f = 0; f < flips; f++) nums[ri(rng, 0, 2 * half - 1)] = ri(rng, 1, limit);
        } else {
          nums = Array.from({ length: half * 2 }, () => ri(rng, 1, limit));
        }
        return { input: `${fmtIntArr(nums)}\n${limit}`, expectedOutput: String(ref(nums, limit)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minMoves(nums: List[int], limit: int) -> int:
              n = len(nums)
              diff = [0] * (2 * limit + 2)
              for i in range(n // 2):
                  a = nums[i]
                  b = nums[n - 1 - i]
                  lo = min(a, b)
                  hi = max(a, b)
                  diff[2] += 2
                  diff[lo + 1] -= 1
                  diff[a + b] -= 1
                  diff[a + b + 1] += 1
                  diff[hi + limit + 1] += 1
              best = n
              cur = 0
              for t in range(2, 2 * limit + 1):
                  cur += diff[t]
                  if cur < best:
                      best = cur
              return best
        `,
        javascript: code`
          var minMoves = function(nums, limit) {
              var n = nums.length;
              var diff = new Array(2 * limit + 2).fill(0);
              for (var i = 0; i < n / 2; i++) {
                  var a = nums[i], b = nums[n - 1 - i];
                  var lo = Math.min(a, b), hi = Math.max(a, b);
                  diff[2] += 2;
                  diff[lo + 1] -= 1;
                  diff[a + b] -= 1;
                  diff[a + b + 1] += 1;
                  diff[hi + limit + 1] += 1;
              }
              var best = n, cur = 0;
              for (var t = 2; t <= 2 * limit; t++) {
                  cur += diff[t];
                  if (cur < best) best = cur;
              }
              return best;
          };
        `,
        typescript: code`
          function minMoves(nums: number[], limit: number): number {
              var n = nums.length;
              var diff: number[] = [];
              for (var s = 0; s < 2 * limit + 2; s++) diff.push(0);
              for (var i = 0; i < n / 2; i++) {
                  var a = nums[i], b = nums[n - 1 - i];
                  var lo = Math.min(a, b), hi = Math.max(a, b);
                  diff[2] += 2;
                  diff[lo + 1] -= 1;
                  diff[a + b] -= 1;
                  diff[a + b + 1] += 1;
                  diff[hi + limit + 1] += 1;
              }
              var best = n, cur = 0;
              for (var t = 2; t <= 2 * limit; t++) {
                  cur += diff[t];
                  if (cur < best) best = cur;
              }
              return best;
          }
        `,
        java: code`
          public static int minMoves(int[] nums, int limit) {
              int n = nums.length;
              int[] diff = new int[2 * limit + 2];
              for (int i = 0; i < n / 2; i++) {
                  int a = nums[i], b = nums[n - 1 - i];
                  int lo = Math.min(a, b), hi = Math.max(a, b);
                  diff[2] += 2;
                  diff[lo + 1] -= 1;
                  diff[a + b] -= 1;
                  diff[a + b + 1] += 1;
                  diff[hi + limit + 1] += 1;
              }
              int best = n, cur = 0;
              for (int t = 2; t <= 2 * limit; t++) {
                  cur += diff[t];
                  if (cur < best) best = cur;
              }
              return best;
          }
        `,
        cpp: code`
          int minMoves(vector<int>& nums, int limit) {
              int n = nums.size();
              vector<int> diff(2 * limit + 2, 0);
              for (int i = 0; i < n / 2; i++) {
                  int a = nums[i], b = nums[n - 1 - i];
                  int lo = min(a, b), hi = max(a, b);
                  diff[2] += 2;
                  diff[lo + 1] -= 1;
                  diff[a + b] -= 1;
                  diff[a + b + 1] += 1;
                  diff[hi + limit + 1] += 1;
              }
              int best = n, cur = 0;
              for (int t = 2; t <= 2 * limit; t++) {
                  cur += diff[t];
                  if (cur < best) best = cur;
              }
              return best;
          }
        `,
        c: code`
          int minMoves(int* nums, int numsSize, int limit) {
              int n = numsSize;
              int* diff = (int*)calloc(2 * limit + 2, sizeof(int));
              for (int i = 0; i < n / 2; i++) {
                  int a = nums[i], b = nums[n - 1 - i];
                  int lo = a < b ? a : b;
                  int hi = a < b ? b : a;
                  diff[2] += 2;
                  diff[lo + 1] -= 1;
                  diff[a + b] -= 1;
                  diff[a + b + 1] += 1;
                  diff[hi + limit + 1] += 1;
              }
              int best = n, cur = 0;
              for (int t = 2; t <= 2 * limit; t++) {
                  cur += diff[t];
                  if (cur < best) best = cur;
              }
              free(diff);
              return best;
          }
        `,
        csharp: code`
          public static int MinMoves(int[] nums, int limit)
          {
              int n = nums.Length;
              int[] diff = new int[2 * limit + 2];
              for (int i = 0; i < n / 2; i++)
              {
                  int a = nums[i], b = nums[n - 1 - i];
                  int lo = Math.Min(a, b), hi = Math.Max(a, b);
                  diff[2] += 2;
                  diff[lo + 1] -= 1;
                  diff[a + b] -= 1;
                  diff[a + b + 1] += 1;
                  diff[hi + limit + 1] += 1;
              }
              int best = n, cur = 0;
              for (int t = 2; t <= 2 * limit; t++)
              {
                  cur += diff[t];
                  if (cur < best) best = cur;
              }
              return best;
          }
        `,
        go: code`
          func minMoves(nums []int, limit int) int {
              n := len(nums)
              diff := make([]int, 2*limit+2)
              for i := 0; i < n/2; i++ {
                  a, b := nums[i], nums[n-1-i]
                  lo, hi := a, b
                  if lo > hi {
                      lo, hi = hi, lo
                  }
                  diff[2] += 2
                  diff[lo+1]--
                  diff[a+b]--
                  diff[a+b+1]++
                  diff[hi+limit+1]++
              }
              best, cur := n, 0
              for t := 2; t <= 2*limit; t++ {
                  cur += diff[t]
                  if cur < best {
                      best = cur
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minMoves(nums: IntArray, limit: Int): Int {
              val n = nums.size
              val diff = IntArray(2 * limit + 2)
              for (i in 0 until n / 2) {
                  val a = nums[i]
                  val b = nums[n - 1 - i]
                  val lo = minOf(a, b)
                  val hi = maxOf(a, b)
                  diff[2] += 2
                  diff[lo + 1] -= 1
                  diff[a + b] -= 1
                  diff[a + b + 1] += 1
                  diff[hi + limit + 1] += 1
              }
              var best = n
              var cur = 0
              for (t in 2..2 * limit) {
                  cur += diff[t]
                  if (cur < best) best = cur
              }
              return best
          }
        `,
        swift: code`
          func minMoves(_ nums: [Int], _ limit: Int) -> Int {
              let n = nums.count
              var diff = [Int](repeating: 0, count: 2 * limit + 2)
              for i in 0..<(n / 2) {
                  let a = nums[i], b = nums[n - 1 - i]
                  let lo = min(a, b), hi = max(a, b)
                  diff[2] += 2
                  diff[lo + 1] -= 1
                  diff[a + b] -= 1
                  diff[a + b + 1] += 1
                  diff[hi + limit + 1] += 1
              }
              var best = n, cur = 0
              for t in 2...(2 * limit) {
                  cur += diff[t]
                  if cur < best { best = cur }
              }
              return best
          }
        `,
        rust: code`
          fn minMoves(nums: Vec<i32>, limit: i32) -> i32 {
              let n = nums.len();
              let lim = limit as usize;
              let mut diff = vec![0i32; 2 * lim + 2];
              for i in 0..n / 2 {
                  let a = nums[i] as usize;
                  let b = nums[n - 1 - i] as usize;
                  let lo = if a < b { a } else { b };
                  let hi = if a < b { b } else { a };
                  diff[2] += 2;
                  diff[lo + 1] -= 1;
                  diff[a + b] -= 1;
                  diff[a + b + 1] += 1;
                  diff[hi + lim + 1] += 1;
              }
              let mut best = n as i32;
              let mut cur = 0i32;
              for t in 2..=2 * lim {
                  cur += diff[t];
                  if cur < best {
                      best = cur;
                  }
              }
              best
          }
        `,
        php: code`
          function minMoves($nums, $limit) {
              $n = count($nums);
              $diff = array_fill(0, 2 * $limit + 2, 0);
              for ($i = 0; $i < intdiv($n, 2); $i++) {
                  $a = $nums[$i];
                  $b = $nums[$n - 1 - $i];
                  $lo = $a < $b ? $a : $b;
                  $hi = $a < $b ? $b : $a;
                  $diff[2] += 2;
                  $diff[$lo + 1] -= 1;
                  $diff[$a + $b] -= 1;
                  $diff[$a + $b + 1] += 1;
                  $diff[$hi + $limit + 1] += 1;
              }
              $best = $n; $cur = 0;
              for ($t = 2; $t <= 2 * $limit; $t++) {
                  $cur += $diff[$t];
                  if ($cur < $best) $best = $cur;
              }
              return $best;
          }
        `,
        ruby: code`
          def minMoves(nums, limit)
            n = nums.length
            diff = Array.new(2 * limit + 2, 0)
            (0...n / 2).each do |i|
              a = nums[i]
              b = nums[n - 1 - i]
              lo = a < b ? a : b
              hi = a < b ? b : a
              diff[2] += 2
              diff[lo + 1] -= 1
              diff[a + b] -= 1
              diff[a + b + 1] += 1
              diff[hi + limit + 1] += 1
            end
            best = n
            cur = 0
            (2..2 * limit).each do |t|
              cur += diff[t]
              best = cur if cur < best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Count Subarrays With Median K (LC 2488) ─────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        let less = 0, has = false;
        for (let j = i; j < nums.length; j++) {
          if (nums[j] < k) less++;
          if (nums[j] === k) has = true;
          const m = j - i + 1;
          // sorted, k sits at index `less`; the median is index floor((m - 1) / 2)
          if (has && less === Math.floor((m - 1) / 2)) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-subarrays-with-median-k",
      title: "Count Subarrays With Median K",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "countSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of length `n` holding the **distinct** integers `1` to `n` (a permutation), and an integer `k` that occurs in `nums`.\n\nReturn the number of non-empty **contiguous** subarrays whose median equals `k`.\n\nThe **median** of an array is its middle element after sorting it in ascending order. When the length is even, the median is the **left** of the two middle elements — the median of `[2,3,1,4]` is `2`, and the median of `[8,4,3,5,1]` is `4`.",
        [
          { in: "nums = [2,5,1,4,3], k = 4", out: "2", note: "`[4]` and `[5,1,4]` (sorted `[1,4,5]`)." },
          { in: "nums = [4,6,2,5,1,3], k = 4", out: "5", note: "`[4]`, `[4,6]`, `[4,6,2]`, `[4,6,2,5]` and `[4,6,2,5,1]`. Adding the 3 tips the balance to the smaller side." },
          { in: "nums = [1,2], k = 1", out: "2", note: "`[1]`, and `[1,2]` whose left-middle element is 1." },
        ],
        ["n == nums.length", "1 <= n <= 10^5", "1 <= nums[i], k <= n", "The integers in `nums` are distinct."]),
      hints: [
        "A subarray can only have median `k` if it contains `k` itself.",
        "Only how each element compares to `k` matters. In a window containing `k`, let `g` be the number of elements greater than `k` and `s` the number smaller. When is `k` the (left) middle element?",
        "`k` is the median exactly when `g - s` is 0 or 1. Write `g - s` as (balance of the part left of `k`) + (balance of the part right of `k`): count the left balances in a table, then for each right extension look up how many left balances complete it to 0 or 1.",
      ],
      editorial: explain({
        idea: "Replace each element by +1 if it is greater than `k`, -1 if smaller. A window that contains `k` has median `k` exactly when the sum of these signs (its *balance*) is 0 or 1, and that balance splits into an independent left part and right part around `k`'s position.",
        steps: [
          "Find `pos`, the index of `k`.",
          "Walk left from `pos` (including the empty extension): keep a running balance of `nums[pos-1], nums[pos-2], …` and count how many left extensions produce each balance value.",
          "Walk right from `pos` (again starting with the empty extension) with its own running balance `b`.",
          "For each right extension, the windows that work pair it with a left extension of balance `-b` or `1 - b`; add both counts.",
          "Return the total.",
        ],
        why: "With distinct values, after sorting a window of length `m` that contains `k`, `k` sits at index `s` (the number of smaller elements). The left median sits at index `floor((m - 1) / 2)` with `m = s + g + 1`, and `s = floor((s + g) / 2)` holds exactly when `g = s` or `g = s + 1`. The window's balance `g - s` is the left part's balance plus the right part's balance, and every (left extension, right extension) pair is a distinct window, so the counting covers each window exactly once.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Include the empty extension on both sides — `[k]` alone, and windows where `k` is at an end.",
          "Balances run from `-n` to `n`; offset them by `n` to use an array, or use a hash map.",
          "Even length uses the **left** middle, which is why balance 1 (one more greater element) is accepted but balance -1 is not.",
        ],
      }),
      examples: [
        { input: "[2,5,1,4,3]\n4", expectedOutput: "2" },
        { input: "[4,6,2,5,1,3]\n4", expectedOutput: "5" },
        { input: "[1,2]\n1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = (rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 6), ri(rng, 7, 30), ri(rng, 30, 60)]));
        const nums = Array.from({ length: n }, (_, i) => i + 1);
        const shape = ri(rng, 0, 9);
        if (shape === 0) { /* sorted */ } else if (shape === 1) nums.reverse(); else shuffle(rng, nums);
        const k = shape === 2 ? Math.ceil(n / 2) : nums[ri(rng, 0, n - 1)];
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countSubarrays(nums: List[int], k: int) -> int:
              n = len(nums)
              pos = nums.index(k)
              cnt = [0] * (2 * n + 2)
              bal = 0
              cnt[n] = 1
              for i in range(pos - 1, -1, -1):
                  bal += 1 if nums[i] > k else -1
                  cnt[bal + n] += 1
              ans = 0
              bal = 0
              for j in range(pos, n):
                  if j > pos:
                      bal += 1 if nums[j] > k else -1
                  ans += cnt[n - bal] + cnt[n + 1 - bal]
              return ans
        `,
        javascript: code`
          var countSubarrays = function(nums, k) {
              var n = nums.length, pos = 0;
              for (var i = 0; i < n; i++) if (nums[i] === k) pos = i;
              var cnt = new Array(2 * n + 2).fill(0);
              var bal = 0;
              cnt[n] = 1;
              for (var i = pos - 1; i >= 0; i--) {
                  bal += nums[i] > k ? 1 : -1;
                  cnt[bal + n]++;
              }
              var ans = 0;
              bal = 0;
              for (var j = pos; j < n; j++) {
                  if (j > pos) bal += nums[j] > k ? 1 : -1;
                  ans += cnt[n - bal] + cnt[n + 1 - bal];
              }
              return ans;
          };
        `,
        typescript: code`
          function countSubarrays(nums: number[], k: number): number {
              var n = nums.length, pos = 0;
              for (var i = 0; i < n; i++) if (nums[i] === k) pos = i;
              var cnt: number[] = [];
              for (var t = 0; t < 2 * n + 2; t++) cnt.push(0);
              var bal = 0;
              cnt[n] = 1;
              for (var i = pos - 1; i >= 0; i--) {
                  bal += nums[i] > k ? 1 : -1;
                  cnt[bal + n]++;
              }
              var ans = 0;
              bal = 0;
              for (var j = pos; j < n; j++) {
                  if (j > pos) bal += nums[j] > k ? 1 : -1;
                  ans += cnt[n - bal] + cnt[n + 1 - bal];
              }
              return ans;
          }
        `,
        java: code`
          public static int countSubarrays(int[] nums, int k) {
              int n = nums.length, pos = 0;
              for (int i = 0; i < n; i++) if (nums[i] == k) pos = i;
              int[] cnt = new int[2 * n + 2];
              int bal = 0;
              cnt[n] = 1;
              for (int i = pos - 1; i >= 0; i--) {
                  bal += nums[i] > k ? 1 : -1;
                  cnt[bal + n]++;
              }
              long ans = 0;
              bal = 0;
              for (int j = pos; j < n; j++) {
                  if (j > pos) bal += nums[j] > k ? 1 : -1;
                  ans += cnt[n - bal] + cnt[n + 1 - bal];
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int countSubarrays(vector<int>& nums, int k) {
              int n = nums.size(), pos = 0;
              for (int i = 0; i < n; i++) if (nums[i] == k) pos = i;
              vector<int> cnt(2 * n + 2, 0);
              int bal = 0;
              cnt[n] = 1;
              for (int i = pos - 1; i >= 0; i--) {
                  bal += nums[i] > k ? 1 : -1;
                  cnt[bal + n]++;
              }
              long long ans = 0;
              bal = 0;
              for (int j = pos; j < n; j++) {
                  if (j > pos) bal += nums[j] > k ? 1 : -1;
                  ans += cnt[n - bal] + cnt[n + 1 - bal];
              }
              return (int) ans;
          }
        `,
        c: code`
          int countSubarrays(int* nums, int numsSize, int k) {
              int n = numsSize, pos = 0;
              for (int i = 0; i < n; i++) if (nums[i] == k) pos = i;
              int* cnt = (int*)calloc(2 * n + 2, sizeof(int));
              int bal = 0;
              cnt[n] = 1;
              for (int i = pos - 1; i >= 0; i--) {
                  bal += nums[i] > k ? 1 : -1;
                  cnt[bal + n]++;
              }
              long long ans = 0;
              bal = 0;
              for (int j = pos; j < n; j++) {
                  if (j > pos) bal += nums[j] > k ? 1 : -1;
                  ans += cnt[n - bal] + cnt[n + 1 - bal];
              }
              free(cnt);
              return (int) ans;
          }
        `,
        csharp: code`
          public static int CountSubarrays(int[] nums, int k)
          {
              int n = nums.Length, pos = 0;
              for (int i = 0; i < n; i++) if (nums[i] == k) pos = i;
              int[] cnt = new int[2 * n + 2];
              int bal = 0;
              cnt[n] = 1;
              for (int i = pos - 1; i >= 0; i--)
              {
                  bal += nums[i] > k ? 1 : -1;
                  cnt[bal + n]++;
              }
              long ans = 0;
              bal = 0;
              for (int j = pos; j < n; j++)
              {
                  if (j > pos) bal += nums[j] > k ? 1 : -1;
                  ans += cnt[n - bal] + cnt[n + 1 - bal];
              }
              return (int) ans;
          }
        `,
        go: code`
          func countSubarrays(nums []int, k int) int {
              n := len(nums)
              pos := 0
              for i := 0; i < n; i++ {
                  if nums[i] == k {
                      pos = i
                  }
              }
              cnt := make([]int, 2*n+2)
              bal := 0
              cnt[n] = 1
              for i := pos - 1; i >= 0; i-- {
                  if nums[i] > k {
                      bal++
                  } else {
                      bal--
                  }
                  cnt[bal+n]++
              }
              ans := 0
              bal = 0
              for j := pos; j < n; j++ {
                  if j > pos {
                      if nums[j] > k {
                          bal++
                      } else {
                          bal--
                      }
                  }
                  ans += cnt[n-bal] + cnt[n+1-bal]
              }
              return ans
          }
        `,
        kotlin: code`
          fun countSubarrays(nums: IntArray, k: Int): Int {
              val n = nums.size
              var pos = 0
              for (i in 0 until n) if (nums[i] == k) pos = i
              val cnt = IntArray(2 * n + 2)
              var bal = 0
              cnt[n] = 1
              for (i in pos - 1 downTo 0) {
                  bal += if (nums[i] > k) 1 else -1
                  cnt[bal + n]++
              }
              var ans = 0L
              bal = 0
              for (j in pos until n) {
                  if (j > pos) bal += if (nums[j] > k) 1 else -1
                  ans += (cnt[n - bal] + cnt[n + 1 - bal]).toLong()
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func countSubarrays(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              var pos = 0
              for i in 0..<n where nums[i] == k { pos = i }
              var cnt = [Int](repeating: 0, count: 2 * n + 2)
              var bal = 0
              cnt[n] = 1
              var i = pos - 1
              while i >= 0 {
                  bal += nums[i] > k ? 1 : -1
                  cnt[bal + n] += 1
                  i -= 1
              }
              var ans = 0
              bal = 0
              for j in pos..<n {
                  if j > pos { bal += nums[j] > k ? 1 : -1 }
                  ans += cnt[n - bal] + cnt[n + 1 - bal]
              }
              return ans
          }
        `,
        rust: code`
          fn countSubarrays(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let mut pos = 0usize;
              for i in 0..n {
                  if nums[i] == k {
                      pos = i;
                  }
              }
              let off = n as i64;
              let mut cnt = vec![0i64; 2 * n + 2];
              let mut bal: i64 = 0;
              cnt[n] = 1;
              let mut i = pos;
              while i > 0 {
                  i -= 1;
                  bal += if nums[i] > k { 1 } else { -1 };
                  cnt[(off + bal) as usize] += 1;
              }
              let mut ans: i64 = 0;
              bal = 0;
              for j in pos..n {
                  if j > pos {
                      bal += if nums[j] > k { 1 } else { -1 };
                  }
                  ans += cnt[(off - bal) as usize] + cnt[(off + 1 - bal) as usize];
              }
              ans as i32
          }
        `,
        php: code`
          function countSubarrays($nums, $k) {
              $n = count($nums);
              $pos = 0;
              for ($i = 0; $i < $n; $i++) if ($nums[$i] == $k) $pos = $i;
              $cnt = array_fill(0, 2 * $n + 2, 0);
              $bal = 0;
              $cnt[$n] = 1;
              for ($i = $pos - 1; $i >= 0; $i--) {
                  $bal += $nums[$i] > $k ? 1 : -1;
                  $cnt[$bal + $n]++;
              }
              $ans = 0;
              $bal = 0;
              for ($j = $pos; $j < $n; $j++) {
                  if ($j > $pos) $bal += $nums[$j] > $k ? 1 : -1;
                  $ans += $cnt[$n - $bal] + $cnt[$n + 1 - $bal];
              }
              return $ans;
          }
        `,
        ruby: code`
          def countSubarrays(nums, k)
            n = nums.length
            pos = nums.index(k)
            cnt = Array.new(2 * n + 2, 0)
            bal = 0
            cnt[n] = 1
            (pos - 1).downto(0) do |i|
              bal += nums[i] > k ? 1 : -1
              cnt[bal + n] += 1
            end
            ans = 0
            bal = 0
            (pos...n).each do |j|
              bal += (nums[j] > k ? 1 : -1) if j > pos
              ans += cnt[n - bal] + cnt[n + 1 - bal]
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Count Subarrays With Score Less Than K (LC 2302) ────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        let sum = 0;
        for (let j = i; j < nums.length; j++) {
          sum += nums[j];
          if (sum * (j - i + 1) < k) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-subarrays-with-score-less-than-k",
      title: "Count Subarrays With Score Less Than K",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Sliding Window", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "countSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **score** of an array is the sum of its elements multiplied by its length. For example, the score of `[1,2,3,4,5]` is `(1 + 2 + 3 + 4 + 5) * 5 = 75`.\n\nGiven an array `nums` of **positive** integers and an integer `k`, return the number of non-empty **contiguous** subarrays of `nums` whose score is **strictly less** than `k`.\n\n*CodeKairo note:* the original problem allows `k` up to 10^15 and returns a 64-bit count; here `nums.length` and `k` are bounded so the answer fits in a 32-bit integer. Intermediate scores can still exceed 32 bits — compute them in 64-bit.",
        [
          { in: "nums = [3,1,5,2], k = 12", out: "5", note: "The four single elements plus `[3,1]` (score 8). `[1,5]` scores exactly 12, which is not less than 12." },
          { in: "nums = [1,2,1,2], k = 7", out: "7", note: "Four singles and the three pairs (each score 6); every triple scores at least 12." },
          { in: "nums = [10], k = 10", out: "0" },
        ],
        ["1 <= nums.length <= 5 * 10^4", "1 <= nums[i] <= 10^5", "1 <= k <= 10^9"]),
      hints: [
        "All values are positive, so extending a subarray only increases its score, and shrinking it only decreases it.",
        "For each right end, the valid left ends form a suffix ending at that right end. Find the smallest valid left end.",
        "Slide a window: add `nums[right]`, then drop elements from the left while `sum * length >= k`. Every window ending at `right` that starts at or after `left` is valid, so add `right - left + 1`.",
      ],
      editorial: explain({
        idea: "Because every element is positive, the score is monotone under extension: a valid subarray stays valid when you shrink it. So for each right end there is a smallest valid left end, and it never moves backwards — a classic sliding window.",
        steps: [
          "Keep `left = 0`, a running `sum` and an answer `ans = 0`.",
          "For each `right`, add `nums[right]` to `sum`.",
          "While `sum * (right - left + 1) >= k`, subtract `nums[left]` and advance `left`.",
          "Now every subarray `[l, right]` with `left <= l <= right` has score below `k`; add `right - left + 1` to `ans`.",
        ],
        why: "If `[left, right]` has score below `k`, then any `[l, right]` with `l > left` has a smaller sum and a smaller length, so a smaller score. If `[left, right]` is too big, then `[left, right + 1]` is too big as well, so `left` never needs to move back. Each element enters and leaves the window once, and for every right end we count exactly the valid left ends.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`sum * length` can reach about 5·10^13 — use 64-bit arithmetic.",
          "The comparison is strict: a score equal to `k` does not count.",
          "When the window empties (`left > right`), the score is 0, which is below `k` because `k >= 1`, so the shrinking loop always stops.",
        ],
      }),
      examples: [
        { input: "[3,1,5,2]\n12", expectedOutput: "5" },
        { input: "[1,2,1,2]\n7", expectedOutput: "7" },
        { input: "[10]\n10", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = (rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 6), ri(rng, 7, 30), ri(rng, 30, 70)]));
        const hiV = pick(rng, [1, 3, 20, 1000, 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hiV));
        let total = 0;
        for (const v of nums) total += v;
        const fullScore = Math.min(1000000000, total * n);
        const maxV = Math.max.apply(null, nums);
        const k = rng() < 0.05
          ? pick(rng, [1, 1000000000])
          : pick(rng, [ri(rng, 1, 3 * maxV), ri(rng, 1, Math.max(1, fullScore)), ri(rng, 1, Math.max(1, Math.floor(fullScore / 4))), ri(rng, 1, Math.max(1, Math.floor(fullScore / 30)))]);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countSubarrays(nums: List[int], k: int) -> int:
              total = 0
              left = 0
              ans = 0
              for right, v in enumerate(nums):
                  total += v
                  while total * (right - left + 1) >= k:
                      total -= nums[left]
                      left += 1
                  ans += right - left + 1
              return ans
        `,
        javascript: code`
          var countSubarrays = function(nums, k) {
              var sum = 0, left = 0, ans = 0;
              for (var right = 0; right < nums.length; right++) {
                  sum += nums[right];
                  while (sum * (right - left + 1) >= k) {
                      sum -= nums[left];
                      left++;
                  }
                  ans += right - left + 1;
              }
              return ans;
          };
        `,
        typescript: code`
          function countSubarrays(nums: number[], k: number): number {
              var sum = 0, left = 0, ans = 0;
              for (var right = 0; right < nums.length; right++) {
                  sum += nums[right];
                  while (sum * (right - left + 1) >= k) {
                      sum -= nums[left];
                      left++;
                  }
                  ans += right - left + 1;
              }
              return ans;
          }
        `,
        java: code`
          public static int countSubarrays(int[] nums, int k) {
              long sum = 0, ans = 0;
              int left = 0;
              for (int right = 0; right < nums.length; right++) {
                  sum += nums[right];
                  while (sum * (right - left + 1) >= k) {
                      sum -= nums[left];
                      left++;
                  }
                  ans += right - left + 1;
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int countSubarrays(vector<int>& nums, int k) {
              long long sum = 0, ans = 0;
              int left = 0;
              for (int right = 0; right < (int) nums.size(); right++) {
                  sum += nums[right];
                  while (sum * (right - left + 1) >= k) {
                      sum -= nums[left];
                      left++;
                  }
                  ans += right - left + 1;
              }
              return (int) ans;
          }
        `,
        c: code`
          int countSubarrays(int* nums, int numsSize, int k) {
              long long sum = 0, ans = 0;
              int left = 0;
              for (int right = 0; right < numsSize; right++) {
                  sum += nums[right];
                  while (sum * (right - left + 1) >= k) {
                      sum -= nums[left];
                      left++;
                  }
                  ans += right - left + 1;
              }
              return (int) ans;
          }
        `,
        csharp: code`
          public static int CountSubarrays(int[] nums, int k)
          {
              long sum = 0, ans = 0;
              int left = 0;
              for (int right = 0; right < nums.Length; right++)
              {
                  sum += nums[right];
                  while (sum * (right - left + 1) >= k)
                  {
                      sum -= nums[left];
                      left++;
                  }
                  ans += right - left + 1;
              }
              return (int) ans;
          }
        `,
        go: code`
          func countSubarrays(nums []int, k int) int {
              var sum, ans int64
              left := 0
              for right := 0; right < len(nums); right++ {
                  sum += int64(nums[right])
                  for sum*int64(right-left+1) >= int64(k) {
                      sum -= int64(nums[left])
                      left++
                  }
                  ans += int64(right - left + 1)
              }
              return int(ans)
          }
        `,
        kotlin: code`
          fun countSubarrays(nums: IntArray, k: Int): Int {
              var sum = 0L
              var ans = 0L
              var left = 0
              for (right in nums.indices) {
                  sum += nums[right]
                  while (sum * (right - left + 1) >= k) {
                      sum -= nums[left]
                      left++
                  }
                  ans += (right - left + 1).toLong()
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func countSubarrays(_ nums: [Int], _ k: Int) -> Int {
              var sum = 0, left = 0, ans = 0
              for right in 0..<nums.count {
                  sum += nums[right]
                  while sum * (right - left + 1) >= k {
                      sum -= nums[left]
                      left += 1
                  }
                  ans += right - left + 1
              }
              return ans
          }
        `,
        rust: code`
          fn countSubarrays(nums: Vec<i32>, k: i32) -> i32 {
              let mut sum: i64 = 0;
              let mut ans: i64 = 0;
              let mut left = 0usize;
              for right in 0..nums.len() {
                  sum += nums[right] as i64;
                  while sum * ((right + 1 - left) as i64) >= k as i64 {
                      sum -= nums[left] as i64;
                      left += 1;
                  }
                  ans += (right + 1 - left) as i64;
              }
              ans as i32
          }
        `,
        php: code`
          function countSubarrays($nums, $k) {
              $sum = 0; $left = 0; $ans = 0;
              $n = count($nums);
              for ($right = 0; $right < $n; $right++) {
                  $sum += $nums[$right];
                  while ($sum * ($right - $left + 1) >= $k) {
                      $sum -= $nums[$left];
                      $left++;
                  }
                  $ans += $right - $left + 1;
              }
              return $ans;
          }
        `,
        ruby: code`
          def countSubarrays(nums, k)
            sum = 0
            left = 0
            ans = 0
            nums.each_with_index do |v, right|
              sum += v
              while sum * (right - left + 1) >= k
                sum -= nums[left]
                left += 1
              end
              ans += right - left + 1
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum Obtained of Any Permutation (LC 1589) ───────────
  (() => {
    const MOD = 1000000007;
    const permute = (arr: number[]): number[][] => {
      if (arr.length <= 1) return [arr.slice()];
      const out: number[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        for (const p of permute(rest)) out.push([arr[i]].concat(p));
      }
      return out;
    };
    const ref = (nums: number[], requests: number[][]) => {
      const n = nums.length;
      if (n <= 5) {
        // brute force over every permutation
        let best = 0;
        for (const p of permute(nums)) {
          let s = 0;
          for (const [a, b] of requests) for (let i = a; i <= b; i++) s += p[i];
          best = Math.max(best, s);
        }
        return best % MOD;
      }
      const freq = new Array(n).fill(0);
      for (const [a, b] of requests) for (let i = a; i <= b; i++) freq[i]++;
      freq.sort((x, y) => x - y);
      const v = nums.slice().sort((x, y) => x - y);
      let total = 0;
      for (let i = 0; i < n; i++) total += freq[i] * v[i];
      return total % MOD;
    };
    return {
      slug: "maximum-sum-obtained-of-any-permutation",
      title: "Maximum Sum Obtained of Any Permutation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Prefix Sum", "Amazon", "Microsoft"],
      signature: { funcName: "maxSumRangeQuery", params: [{ name: "nums", type: "int[]" as const }, { name: "requests", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and a list of `requests`, where `requests[i] = [start, end]` asks for the sum `nums[start] + nums[start + 1] + … + nums[end]` (both ends inclusive, 0-indexed).\n\nYou may first rearrange `nums` into **any permutation** you like. Return the largest possible **total** of all request sums. Since it can be very large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [3,1,4,2,5], requests = [[0,2],[1,3]]", out: "23", note: "Indices 1 and 2 are requested twice, indices 0 and 3 once, index 4 never. Placing 5 and 4 at indices 1–2 and 3 and 2 at indices 0 and 3 gives 2·(5 + 4) + 3 + 2 = 23." },
          { in: "nums = [7,1,6,2], requests = [[0,3]]", out: "16", note: "Every index is covered once, so the order does not matter." },
          { in: "nums = [10,0,10,0], requests = [[1,2],[2,3],[2,2]]", out: "40", note: "Index 2 is covered three times and index 1 or 3 once, so the two 10s go to index 2 and one of those." },
        ],
        ["n == nums.length", "1 <= n <= 10^5", "0 <= nums[i] <= 10^5", "1 <= requests.length <= 10^5", "requests[i].length == 2", "0 <= start <= end < n"]),
      hints: [
        "The total is the sum over positions of (value placed there) × (number of requests covering that position).",
        "Compute how many requests cover each index. Doing it request by request is too slow — mark each range's start and one-past-end in a difference array and take prefix sums.",
        "To maximise a sum of products, pair the largest value with the largest coverage count, the second largest with the second largest, and so on: sort both lists and multiply element-wise.",
      ],
      editorial: explain({
        idea: "Each index `i` contributes `value × freq[i]`, where `freq[i]` is how many requests cover it. Once the frequencies are known, the best permutation simply matches large values with large frequencies.",
        steps: [
          "Build a difference array: for each request `[s, e]`, add 1 at `s` and subtract 1 at `e + 1`.",
          "Take prefix sums to get `freq[i]` for every index.",
          "Sort `freq` and sort `nums`.",
          "Sum `freq[i] * nums[i]` over all `i`, reducing modulo `10^9 + 7`.",
        ],
        why: "By the rearrangement inequality, for two sequences the sum of products is largest when both are sorted in the same order: if a larger value sat on a smaller frequency while a smaller value sat on a larger one, swapping them changes the total by `(a - b)(f - g) >= 0`. Repeating such swaps reaches the sorted pairing without ever decreasing the total.",
        time: "O(n log n + m)",
        space: "O(n)",
        pitfalls: [
          "Counting coverage by looping over each range is O(n · m) — up to 10^10 steps.",
          "A single product reaches 10^10 — multiply in 64-bit before reducing.",
          "Take the modulus only at the end of each addition; the maximum must be found on the true values, which the sorted pairing guarantees.",
        ],
      }),
      examples: [
        { input: "[3,1,4,2,5]\n[[0,2],[1,3]]", expectedOutput: "23" },
        { input: "[7,1,6,2]\n[[0,3]]", expectedOutput: "16" },
        { input: "[10,0,10,0]\n[[1,2],[2,3],[2,2]]", expectedOutput: "40" },
      ],
      gen: (rng: Rng) => {
        // a few big cases push the total past the modulus
        const big = rng() < 0.03;
        const n = big ? ri(rng, 55, 60) : pick(rng, [1, ri(rng, 2, 5), ri(rng, 6, 20), ri(rng, 20, 40)]);
        const m = big ? ri(rng, 240, 260) : pick(rng, [1, ri(rng, 1, 5), ri(rng, 5, 20)]);
        const hiV = big ? 100000 : pick(rng, [1, 5, 100, 100000, 100000]);
        const nums = Array.from({ length: n }, () => (big ? ri(rng, 96000, 100000) : ri(rng, 0, hiV)));
        const requests: number[][] = [];
        for (let q = 0; q < m; q++) {
          if (big && rng() < 0.9) { requests.push([ri(rng, 0, 2), n - 1 - ri(rng, 0, 2)]); continue; }
          const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
          requests.push([Math.min(a, b), Math.max(a, b)]);
        }
        return { input: `${fmtIntArr(nums)}\n${fmtIntMat(requests)}`, expectedOutput: String(ref(nums, requests)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSumRangeQuery(nums: List[int], requests: List[List[int]]) -> int:
              MOD = 10 ** 9 + 7
              n = len(nums)
              freq = [0] * (n + 1)
              for s, e in requests:
                  freq[s] += 1
                  freq[e + 1] -= 1
              for i in range(1, n):
                  freq[i] += freq[i - 1]
              f = sorted(freq[:n])
              v = sorted(nums)
              return sum(a * b for a, b in zip(f, v)) % MOD
        `,
        javascript: code`
          var maxSumRangeQuery = function(nums, requests) {
              var MOD = 1000000007;
              var n = nums.length;
              var freq = new Array(n + 1).fill(0);
              for (var i = 0; i < requests.length; i++) {
                  freq[requests[i][0]]++;
                  freq[requests[i][1] + 1]--;
              }
              for (var i = 1; i < n; i++) freq[i] += freq[i - 1];
              var f = freq.slice(0, n).sort(function(a, b) { return a - b; });
              var v = nums.slice().sort(function(a, b) { return a - b; });
              var ans = 0;
              for (var i = 0; i < n; i++) ans = (ans + f[i] * v[i]) % MOD;
              return ans;
          };
        `,
        typescript: code`
          function maxSumRangeQuery(nums: number[], requests: number[][]): number {
              var MOD = 1000000007;
              var n = nums.length;
              var freq: number[] = [];
              for (var i = 0; i <= n; i++) freq.push(0);
              for (var i = 0; i < requests.length; i++) {
                  freq[requests[i][0]]++;
                  freq[requests[i][1] + 1]--;
              }
              for (var i = 1; i < n; i++) freq[i] += freq[i - 1];
              var f = freq.slice(0, n).sort(function (a, b) { return a - b; });
              var v = nums.slice().sort(function (a, b) { return a - b; });
              var ans = 0;
              for (var i = 0; i < n; i++) ans = (ans + f[i] * v[i]) % MOD;
              return ans;
          }
        `,
        java: code`
          public static int maxSumRangeQuery(int[] nums, int[][] requests) {
              final long MOD = 1000000007L;
              int n = nums.length;
              int[] freq = new int[n + 1];
              for (int[] r : requests) {
                  freq[r[0]]++;
                  freq[r[1] + 1]--;
              }
              for (int i = 1; i < n; i++) freq[i] += freq[i - 1];
              int[] f = Arrays.copyOf(freq, n);
              int[] v = nums.clone();
              Arrays.sort(f);
              Arrays.sort(v);
              long ans = 0;
              for (int i = 0; i < n; i++) ans = (ans + (long) f[i] * v[i]) % MOD;
              return (int) ans;
          }
        `,
        cpp: code`
          int maxSumRangeQuery(vector<int>& nums, vector<vector<int>>& requests) {
              const long long MOD = 1000000007LL;
              int n = nums.size();
              vector<int> freq(n + 1, 0);
              for (auto& r : requests) {
                  freq[r[0]]++;
                  freq[r[1] + 1]--;
              }
              for (int i = 1; i < n; i++) freq[i] += freq[i - 1];
              vector<int> f(freq.begin(), freq.begin() + n);
              vector<int> v(nums.begin(), nums.end());
              sort(f.begin(), f.end());
              sort(v.begin(), v.end());
              long long ans = 0;
              for (int i = 0; i < n; i++) ans = (ans + (long long) f[i] * v[i]) % MOD;
              return (int) ans;
          }
        `,
        c: code`
          static int cmpAsc1589(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int maxSumRangeQuery(int* nums, int numsSize, int** requests, int requestsSize, int* requestsColSize) {
              const long long MOD = 1000000007LL;
              int n = numsSize;
              int* freq = (int*)calloc(n + 1, sizeof(int));
              for (int i = 0; i < requestsSize; i++) {
                  freq[requests[i][0]]++;
                  freq[requests[i][1] + 1]--;
              }
              for (int i = 1; i < n; i++) freq[i] += freq[i - 1];
              int* v = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) v[i] = nums[i];
              qsort(freq, n, sizeof(int), cmpAsc1589);
              qsort(v, n, sizeof(int), cmpAsc1589);
              long long ans = 0;
              for (int i = 0; i < n; i++) ans = (ans + (long long) freq[i] * v[i]) % MOD;
              free(freq);
              free(v);
              return (int) ans;
          }
        `,
        csharp: code`
          public static int MaxSumRangeQuery(int[] nums, int[][] requests)
          {
              const long MOD = 1000000007L;
              int n = nums.Length;
              int[] freq = new int[n + 1];
              foreach (int[] r in requests)
              {
                  freq[r[0]]++;
                  freq[r[1] + 1]--;
              }
              for (int i = 1; i < n; i++) freq[i] += freq[i - 1];
              int[] f = new int[n];
              Array.Copy(freq, f, n);
              int[] v = (int[])nums.Clone();
              Array.Sort(f);
              Array.Sort(v);
              long ans = 0;
              for (int i = 0; i < n; i++) ans = (ans + (long) f[i] * v[i]) % MOD;
              return (int) ans;
          }
        `,
        go: code`
          func maxSumRangeQuery(nums []int, requests [][]int) int {
              const MOD = 1000000007
              n := len(nums)
              freq := make([]int, n+1)
              for _, r := range requests {
                  freq[r[0]]++
                  freq[r[1]+1]--
              }
              for i := 1; i < n; i++ {
                  freq[i] += freq[i-1]
              }
              f := make([]int, n)
              copy(f, freq[:n])
              v := make([]int, n)
              copy(v, nums)
              sort.Ints(f)
              sort.Ints(v)
              ans := int64(0)
              for i := 0; i < n; i++ {
                  ans = (ans + int64(f[i])*int64(v[i])) % MOD
              }
              return int(ans)
          }
        `,
        kotlin: code`
          fun maxSumRangeQuery(nums: IntArray, requests: Array<IntArray>): Int {
              val MOD = 1000000007L
              val n = nums.size
              val freq = IntArray(n + 1)
              for (r in requests) {
                  freq[r[0]]++
                  freq[r[1] + 1]--
              }
              for (i in 1 until n) freq[i] += freq[i - 1]
              val f = freq.copyOfRange(0, n)
              val v = nums.copyOf()
              f.sort()
              v.sort()
              var ans = 0L
              for (i in 0 until n) ans = (ans + f[i].toLong() * v[i]) % MOD
              return ans.toInt()
          }
        `,
        swift: code`
          func maxSumRangeQuery(_ nums: [Int], _ requests: [[Int]]) -> Int {
              let MOD = 1000000007
              let n = nums.count
              var freq = [Int](repeating: 0, count: n + 1)
              for r in requests {
                  freq[r[0]] += 1
                  freq[r[1] + 1] -= 1
              }
              if n > 1 {
                  for i in 1..<n { freq[i] += freq[i - 1] }
              }
              let f = Array(freq[0..<n]).sorted()
              let v = nums.sorted()
              var ans = 0
              for i in 0..<n { ans = (ans + f[i] * v[i]) % MOD }
              return ans
          }
        `,
        rust: code`
          fn maxSumRangeQuery(nums: Vec<i32>, requests: Vec<Vec<i32>>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let n = nums.len();
              let mut freq = vec![0i64; n + 1];
              for r in requests.iter() {
                  freq[r[0] as usize] += 1;
                  freq[r[1] as usize + 1] -= 1;
              }
              for i in 1..n {
                  freq[i] += freq[i - 1];
              }
              let mut f: Vec<i64> = freq[..n].to_vec();
              let mut v: Vec<i64> = nums.iter().map(|&x| x as i64).collect();
              f.sort();
              v.sort();
              let mut ans: i64 = 0;
              for i in 0..n {
                  ans = (ans + f[i] * v[i]) % modulus;
              }
              ans as i32
          }
        `,
        php: code`
          function maxSumRangeQuery($nums, $requests) {
              $MOD = 1000000007;
              $n = count($nums);
              $freq = array_fill(0, $n + 1, 0);
              foreach ($requests as $r) {
                  $freq[$r[0]]++;
                  $freq[$r[1] + 1]--;
              }
              for ($i = 1; $i < $n; $i++) $freq[$i] += $freq[$i - 1];
              $f = array_slice($freq, 0, $n);
              $v = $nums;
              sort($f);
              sort($v);
              $ans = 0;
              for ($i = 0; $i < $n; $i++) $ans = ($ans + $f[$i] * $v[$i]) % $MOD;
              return $ans;
          }
        `,
        ruby: code`
          def maxSumRangeQuery(nums, requests)
            mod = 1_000_000_007
            n = nums.length
            freq = Array.new(n + 1, 0)
            requests.each do |s, e|
              freq[s] += 1
              freq[e + 1] -= 1
            end
            (1...n).each { |i| freq[i] += freq[i - 1] }
            f = freq[0, n].sort
            v = nums.sort
            ans = 0
            n.times { |i| ans = (ans + f[i] * v[i]) % mod }
            ans
          end
        `,
      },
    };
  })(),

  // ── Shortest Subarray to be Removed to Make Array Sorted (LC 1574) ──
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      const prefOk = new Array(n + 1).fill(true); // arr[0..i-1] non-decreasing
      for (let i = 2; i <= n; i++) prefOk[i] = prefOk[i - 1] && arr[i - 2] <= arr[i - 1];
      const sufOk = new Array(n + 1).fill(true); // arr[j..n-1] non-decreasing
      for (let j = n - 2; j >= 0; j--) sufOk[j] = sufOk[j + 1] && arr[j] <= arr[j + 1];
      let best = n;
      for (let i = 0; i <= n; i++) {
        for (let j = i; j <= n; j++) {
          // remove arr[i..j-1]
          if (!prefOk[i] || !sufOk[j]) continue;
          if (i > 0 && j < n && arr[i - 1] > arr[j]) continue;
          best = Math.min(best, j - i);
        }
      }
      return best;
    };
    return {
      slug: "shortest-subarray-to-be-removed-to-make-array-sorted",
      title: "Shortest Subarray to be Removed to Make Array Sorted",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Monotonic Stack", "Amazon", "Google", "Meta"],
      signature: { funcName: "findLengthOfShortestSubarray", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `arr`, remove one **contiguous** subarray (possibly empty) so that the elements left behind, kept in their original order, are **non-decreasing**.\n\nReturn the length of the shortest subarray you can remove.",
        [
          { in: "arr = [1,3,4,12,5,3,4,6]", out: "3", note: "Remove `[12,5,3]` to keep `[1,3,4,4,6]` (removing `[4,12,5]` also works). No two elements can be removed to fix it." },
          { in: "arr = [9,7,5,3,1]", out: "4", note: "The array is strictly decreasing, so only one element can stay." },
          { in: "arr = [2,2,5]", out: "0", note: "It is already non-decreasing." },
        ],
        ["1 <= arr.length <= 10^5", "0 <= arr[i] <= 10^9"]),
      hints: [
        "What remains is a prefix of `arr` followed by a suffix of `arr`, and each of them must be non-decreasing on its own.",
        "Find the longest non-decreasing prefix `arr[0..l]` and the longest non-decreasing suffix `arr[r..n-1]`. Keeping only one of them gives the candidates `n - l - 1` and `r`.",
        "To keep part of both, walk `i` through the prefix and a pointer `j` through the suffix: advance `j` until `arr[j] >= arr[i]`; then removing `arr[i+1..j-1]` works. Both pointers only move forward.",
      ],
      editorial: explain({
        idea: "The kept elements are a prefix plus a suffix. The prefix must lie inside the longest sorted prefix, the suffix inside the longest sorted suffix, and they must join without a drop — two pointers find the best join.",
        steps: [
          "Let `l` be the last index of the longest non-decreasing prefix. If `l == n - 1`, return 0.",
          "Let `r` be the first index of the longest non-decreasing suffix.",
          "Start with `ans = min(n - l - 1, r)` (keep only the prefix, or only the suffix).",
          "Set `j = r`. For each `i` from 0 to `l`: advance `j` while `j < n` and `arr[j] < arr[i]`; then update `ans = min(ans, j - i - 1)`.",
          "Return `ans`.",
        ],
        why: "Any valid removal keeps `arr[0..i]` and `arr[j..n-1]` for some `i < j`, with both pieces sorted and `arr[i] <= arr[j]`. For a fixed `i`, the best `j` is the first suffix index whose value is at least `arr[i]` (the suffix is sorted, so all later ones also work but remove more). As `i` increases, `arr[i]` does not decrease inside the sorted prefix, so that first `j` never moves back — every `(i, j)` candidate is examined in one forward pass.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Handle the already-sorted case first; otherwise the suffix scan and the prefix overlap.",
          "Do not forget the two one-sided options (keep only the prefix or only the suffix) — the joint loop may not cover them when no join exists.",
          "\"Sorted\" means non-decreasing here, so equal neighbours are fine: compare with `<=`.",
        ],
      }),
      examples: [
        { input: "[1,3,4,12,5,3,4,6]", expectedOutput: "3" },
        { input: "[9,7,5,3,1]", expectedOutput: "4" },
        { input: "[2,2,5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = (rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 6), ri(rng, 7, 30), ri(rng, 30, 60)]));
        const hiV = pick(rng, [2, 10, 100, 1000000000]);
        const shape = ri(rng, 0, 9);
        let arr = Array.from({ length: n }, () => ri(rng, 0, hiV));
        if (shape === 0) arr.sort((a, b) => a - b);
        else if (shape === 1) arr.sort((a, b) => b - a);
        else if (shape >= 2 && shape <= 6) {
          // sorted with a disturbed middle — the interesting case
          arr.sort((a, b) => a - b);
          const a = ri(rng, 0, n - 1), b = ri(rng, a, Math.min(n - 1, a + Math.max(1, Math.floor(n / 3))));
          for (let i = a; i <= b; i++) arr[i] = ri(rng, 0, hiV);
        } else if (shape === 7) {
          const v = ri(rng, 0, hiV);
          arr = arr.map(() => v);
        }
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findLengthOfShortestSubarray(arr: List[int]) -> int:
              n = len(arr)
              l = 0
              while l + 1 < n and arr[l] <= arr[l + 1]:
                  l += 1
              if l == n - 1:
                  return 0
              r = n - 1
              while r > 0 and arr[r - 1] <= arr[r]:
                  r -= 1
              ans = min(n - l - 1, r)
              j = r
              for i in range(l + 1):
                  while j < n and arr[j] < arr[i]:
                      j += 1
                  ans = min(ans, j - i - 1)
              return ans
        `,
        javascript: code`
          var findLengthOfShortestSubarray = function(arr) {
              var n = arr.length;
              var l = 0;
              while (l + 1 < n && arr[l] <= arr[l + 1]) l++;
              if (l === n - 1) return 0;
              var r = n - 1;
              while (r > 0 && arr[r - 1] <= arr[r]) r--;
              var ans = Math.min(n - l - 1, r);
              var j = r;
              for (var i = 0; i <= l; i++) {
                  while (j < n && arr[j] < arr[i]) j++;
                  ans = Math.min(ans, j - i - 1);
              }
              return ans;
          };
        `,
        typescript: code`
          function findLengthOfShortestSubarray(arr: number[]): number {
              var n = arr.length;
              var l = 0;
              while (l + 1 < n && arr[l] <= arr[l + 1]) l++;
              if (l === n - 1) return 0;
              var r = n - 1;
              while (r > 0 && arr[r - 1] <= arr[r]) r--;
              var ans = Math.min(n - l - 1, r);
              var j = r;
              for (var i = 0; i <= l; i++) {
                  while (j < n && arr[j] < arr[i]) j++;
                  ans = Math.min(ans, j - i - 1);
              }
              return ans;
          }
        `,
        java: code`
          public static int findLengthOfShortestSubarray(int[] arr) {
              int n = arr.length;
              int l = 0;
              while (l + 1 < n && arr[l] <= arr[l + 1]) l++;
              if (l == n - 1) return 0;
              int r = n - 1;
              while (r > 0 && arr[r - 1] <= arr[r]) r--;
              int ans = Math.min(n - l - 1, r);
              int j = r;
              for (int i = 0; i <= l; i++) {
                  while (j < n && arr[j] < arr[i]) j++;
                  ans = Math.min(ans, j - i - 1);
              }
              return ans;
          }
        `,
        cpp: code`
          int findLengthOfShortestSubarray(vector<int>& arr) {
              int n = arr.size();
              int l = 0;
              while (l + 1 < n && arr[l] <= arr[l + 1]) l++;
              if (l == n - 1) return 0;
              int r = n - 1;
              while (r > 0 && arr[r - 1] <= arr[r]) r--;
              int ans = min(n - l - 1, r);
              int j = r;
              for (int i = 0; i <= l; i++) {
                  while (j < n && arr[j] < arr[i]) j++;
                  ans = min(ans, j - i - 1);
              }
              return ans;
          }
        `,
        c: code`
          int findLengthOfShortestSubarray(int* arr, int arrSize) {
              int n = arrSize;
              int l = 0;
              while (l + 1 < n && arr[l] <= arr[l + 1]) l++;
              if (l == n - 1) return 0;
              int r = n - 1;
              while (r > 0 && arr[r - 1] <= arr[r]) r--;
              int ans = n - l - 1 < r ? n - l - 1 : r;
              int j = r;
              for (int i = 0; i <= l; i++) {
                  while (j < n && arr[j] < arr[i]) j++;
                  if (j - i - 1 < ans) ans = j - i - 1;
              }
              return ans;
          }
        `,
        csharp: code`
          public static int FindLengthOfShortestSubarray(int[] arr)
          {
              int n = arr.Length;
              int l = 0;
              while (l + 1 < n && arr[l] <= arr[l + 1]) l++;
              if (l == n - 1) return 0;
              int r = n - 1;
              while (r > 0 && arr[r - 1] <= arr[r]) r--;
              int ans = Math.Min(n - l - 1, r);
              int j = r;
              for (int i = 0; i <= l; i++)
              {
                  while (j < n && arr[j] < arr[i]) j++;
                  ans = Math.Min(ans, j - i - 1);
              }
              return ans;
          }
        `,
        go: code`
          func findLengthOfShortestSubarray(arr []int) int {
              n := len(arr)
              l := 0
              for l+1 < n && arr[l] <= arr[l+1] {
                  l++
              }
              if l == n-1 {
                  return 0
              }
              r := n - 1
              for r > 0 && arr[r-1] <= arr[r] {
                  r--
              }
              ans := n - l - 1
              if r < ans {
                  ans = r
              }
              j := r
              for i := 0; i <= l; i++ {
                  for j < n && arr[j] < arr[i] {
                      j++
                  }
                  if j-i-1 < ans {
                      ans = j - i - 1
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun findLengthOfShortestSubarray(arr: IntArray): Int {
              val n = arr.size
              var l = 0
              while (l + 1 < n && arr[l] <= arr[l + 1]) l++
              if (l == n - 1) return 0
              var r = n - 1
              while (r > 0 && arr[r - 1] <= arr[r]) r--
              var ans = minOf(n - l - 1, r)
              var j = r
              for (i in 0..l) {
                  while (j < n && arr[j] < arr[i]) j++
                  ans = minOf(ans, j - i - 1)
              }
              return ans
          }
        `,
        swift: code`
          func findLengthOfShortestSubarray(_ arr: [Int]) -> Int {
              let n = arr.count
              var l = 0
              while l + 1 < n && arr[l] <= arr[l + 1] { l += 1 }
              if l == n - 1 { return 0 }
              var r = n - 1
              while r > 0 && arr[r - 1] <= arr[r] { r -= 1 }
              var ans = min(n - l - 1, r)
              var j = r
              for i in 0...l {
                  while j < n && arr[j] < arr[i] { j += 1 }
                  ans = min(ans, j - i - 1)
              }
              return ans
          }
        `,
        rust: code`
          fn findLengthOfShortestSubarray(arr: Vec<i32>) -> i32 {
              let n = arr.len();
              let mut l = 0usize;
              while l + 1 < n && arr[l] <= arr[l + 1] {
                  l += 1;
              }
              if l == n - 1 {
                  return 0;
              }
              let mut r = n - 1;
              while r > 0 && arr[r - 1] <= arr[r] {
                  r -= 1;
              }
              let mut ans = if n - l - 1 < r { n - l - 1 } else { r };
              let mut j = r;
              for i in 0..=l {
                  while j < n && arr[j] < arr[i] {
                      j += 1;
                  }
                  if j - i - 1 < ans {
                      ans = j - i - 1;
                  }
              }
              ans as i32
          }
        `,
        php: code`
          function findLengthOfShortestSubarray($arr) {
              $n = count($arr);
              $l = 0;
              while ($l + 1 < $n && $arr[$l] <= $arr[$l + 1]) $l++;
              if ($l == $n - 1) return 0;
              $r = $n - 1;
              while ($r > 0 && $arr[$r - 1] <= $arr[$r]) $r--;
              $ans = min($n - $l - 1, $r);
              $j = $r;
              for ($i = 0; $i <= $l; $i++) {
                  while ($j < $n && $arr[$j] < $arr[$i]) $j++;
                  $ans = min($ans, $j - $i - 1);
              }
              return $ans;
          }
        `,
        ruby: code`
          def findLengthOfShortestSubarray(arr)
            n = arr.length
            l = 0
            l += 1 while l + 1 < n && arr[l] <= arr[l + 1]
            return 0 if l == n - 1
            r = n - 1
            r -= 1 while r > 0 && arr[r - 1] <= arr[r]
            ans = [n - l - 1, r].min
            j = r
            (0..l).each do |i|
              j += 1 while j < n && arr[j] < arr[i]
              ans = [ans, j - i - 1].min
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Continuous Subarrays (LC 2762) ──────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        let lo = nums[i], hi = nums[i];
        for (let j = i; j < nums.length; j++) {
          lo = Math.min(lo, nums[j]);
          hi = Math.max(hi, nums[j]);
          if (hi - lo > 2) break;
          count++;
        }
      }
      return count;
    };
    return {
      slug: "continuous-subarrays",
      title: "Continuous Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Monotonic Queue", "Ordered Set", "Amazon", "Google"],
      signature: { funcName: "continuousSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A contiguous, non-empty subarray of `nums` is called **continuous** when every two of its elements differ by at most `2` — that is, `|nums[i1] - nums[i2]| <= 2` for every pair of indices `i1`, `i2` inside it.\n\nReturn the total number of continuous subarrays of `nums`.\n\n*CodeKairo note:* the original allows `nums.length` up to 10^5 and returns a 64-bit count; here the length is at most `5 * 10^4`, so the answer fits in a 32-bit integer.",
        [
          { in: "nums = [3,1,2,4,7]", out: "9", note: "Five single elements, the pairs `[3,1]`, `[1,2]`, `[2,4]`, and the triple `[3,1,2]`. Every other window has a spread of at least 3." },
          { in: "nums = [8,8,8]", out: "6", note: "All six subarrays have spread 0." },
          { in: "nums = [1,10]", out: "2" },
        ],
        ["1 <= nums.length <= 5 * 10^4", "1 <= nums[i] <= 10^9"]),
      hints: [
        "A subarray is continuous exactly when its maximum minus its minimum is at most 2.",
        "If a window is continuous, so is every window inside it. For each right end, the valid left ends form a range `[left, right]`, and `left` never moves backwards.",
        "Maintain the window's max and min with two monotonic deques; shrink from the left while `max - min > 2`, then add `right - left + 1` to the count.",
      ],
      editorial: explain({
        idea: "The condition depends only on the window's extremes and is preserved under shrinking, so a two-pointer window counts, for every right end, how many left ends work.",
        steps: [
          "Keep `left = 0`, a non-increasing deque for the maximum and a non-decreasing deque for the minimum.",
          "For each `right`, push `nums[right]` into both deques (popping from their backs any values it dominates).",
          "While the fronts differ by more than 2, remove `nums[left]` from any deque front it occupies and advance `left`.",
          "Every subarray `[l, right]` with `left <= l <= right` is continuous — add `right - left + 1`.",
        ],
        why: "Adding an element can only widen the spread, so the smallest valid `left` for `right + 1` is at least the one for `right`; the window therefore visits every right end with its smallest valid left end, and all left ends between that and `right` are valid because sub-windows of a valid window are valid. The deques keep exactly the elements that can still be a future window's maximum or minimum.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The count grows quadratically (an array of equal values has `n(n+1)/2` continuous subarrays) — accumulate it in 64-bit in fixed-width languages.",
          "Pop with strict comparisons so duplicates stay in the deques; removing by value relies on that.",
          "Because the spread allowed is only 2, a window holds at most three distinct values — a small ordered map of counts is an equally valid alternative to the deques.",
        ],
      }),
      examples: [
        { input: "[3,1,2,4,7]", expectedOutput: "9" },
        { input: "[8,8,8]", expectedOutput: "6" },
        { input: "[1,10]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 40), ri(rng, 40, 80)]);
        const mode = ri(rng, 0, 4);
        let nums: number[];
        if (mode === 0) {
          // random walk: long continuous stretches
          let cur = ri(rng, 1, 1000000000);
          nums = [];
          for (let i = 0; i < n; i++) {
            cur = Math.min(1000000000, Math.max(1, cur + ri(rng, -1, 1)));
            nums.push(cur);
          }
        } else if (mode === 1 || mode === 2) {
          const base = ri(rng, 1, pick(rng, [10, 999999990]));
          const span = pick(rng, [2, 3, 4, 6]);
          nums = Array.from({ length: n }, () => base + ri(rng, 0, span));
        } else if (mode === 3) {
          nums = Array.from({ length: n }, () => ri(rng, 1, 1000000000));
        } else {
          const v = ri(rng, 1, 1000000000);
          nums = Array.from({ length: n }, () => v);
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def continuousSubarrays(nums: List[int]) -> int:
              max_q = deque()
              min_q = deque()
              left = 0
              ans = 0
              for right, v in enumerate(nums):
                  while max_q and max_q[-1] < v:
                      max_q.pop()
                  max_q.append(v)
                  while min_q and min_q[-1] > v:
                      min_q.pop()
                  min_q.append(v)
                  while max_q[0] - min_q[0] > 2:
                      if max_q[0] == nums[left]:
                          max_q.popleft()
                      if min_q[0] == nums[left]:
                          min_q.popleft()
                      left += 1
                  ans += right - left + 1
              return ans
        `,
        javascript: code`
          var continuousSubarrays = function(nums) {
              var n = nums.length;
              var maxQ = new Array(n), minQ = new Array(n);
              var maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, ans = 0;
              for (var right = 0; right < n; right++) {
                  var v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > 2) {
                      if (maxQ[maxH] === nums[left]) maxH++;
                      if (minQ[minH] === nums[left]) minH++;
                      left++;
                  }
                  ans += right - left + 1;
              }
              return ans;
          };
        `,
        typescript: code`
          function continuousSubarrays(nums: number[]): number {
              var n = nums.length;
              var maxQ: number[] = [], minQ: number[] = [];
              var maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, ans = 0;
              for (var right = 0; right < n; right++) {
                  var v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > 2) {
                      if (maxQ[maxH] === nums[left]) maxH++;
                      if (minQ[minH] === nums[left]) minH++;
                      left++;
                  }
                  ans += right - left + 1;
              }
              return ans;
          }
        `,
        java: code`
          public static int continuousSubarrays(int[] nums) {
              int n = nums.length;
              int[] maxQ = new int[n];
              int[] minQ = new int[n];
              int maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0;
              long ans = 0;
              for (int right = 0; right < n; right++) {
                  int v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > 2) {
                      if (maxQ[maxH] == nums[left]) maxH++;
                      if (minQ[minH] == nums[left]) minH++;
                      left++;
                  }
                  ans += right - left + 1;
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int continuousSubarrays(vector<int>& nums) {
              int n = nums.size();
              vector<int> maxQ(n), minQ(n);
              int maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0;
              long long ans = 0;
              for (int right = 0; right < n; right++) {
                  int v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > 2) {
                      if (maxQ[maxH] == nums[left]) maxH++;
                      if (minQ[minH] == nums[left]) minH++;
                      left++;
                  }
                  ans += right - left + 1;
              }
              return (int) ans;
          }
        `,
        c: code`
          int continuousSubarrays(int* nums, int numsSize) {
              int* maxQ = (int*)malloc(sizeof(int) * (numsSize + 1));
              int* minQ = (int*)malloc(sizeof(int) * (numsSize + 1));
              int maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0;
              long long ans = 0;
              for (int right = 0; right < numsSize; right++) {
                  int v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > 2) {
                      if (maxQ[maxH] == nums[left]) maxH++;
                      if (minQ[minH] == nums[left]) minH++;
                      left++;
                  }
                  ans += right - left + 1;
              }
              free(maxQ);
              free(minQ);
              return (int) ans;
          }
        `,
        csharp: code`
          public static int ContinuousSubarrays(int[] nums)
          {
              int n = nums.Length;
              int[] maxQ = new int[n];
              int[] minQ = new int[n];
              int maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0;
              long ans = 0;
              for (int right = 0; right < n; right++)
              {
                  int v = nums[right];
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--;
                  maxQ[maxT++] = v;
                  while (minT > minH && minQ[minT - 1] > v) minT--;
                  minQ[minT++] = v;
                  while (maxQ[maxH] - minQ[minH] > 2)
                  {
                      if (maxQ[maxH] == nums[left]) maxH++;
                      if (minQ[minH] == nums[left]) minH++;
                      left++;
                  }
                  ans += right - left + 1;
              }
              return (int) ans;
          }
        `,
        go: code`
          func continuousSubarrays(nums []int) int {
              n := len(nums)
              maxQ := make([]int, n)
              minQ := make([]int, n)
              maxH, maxT, minH, minT, left := 0, 0, 0, 0, 0
              ans := 0
              for right := 0; right < n; right++ {
                  v := nums[right]
                  for maxT > maxH && maxQ[maxT-1] < v {
                      maxT--
                  }
                  maxQ[maxT] = v
                  maxT++
                  for minT > minH && minQ[minT-1] > v {
                      minT--
                  }
                  minQ[minT] = v
                  minT++
                  for maxQ[maxH]-minQ[minH] > 2 {
                      if maxQ[maxH] == nums[left] {
                          maxH++
                      }
                      if minQ[minH] == nums[left] {
                          minH++
                      }
                      left++
                  }
                  ans += right - left + 1
              }
              return ans
          }
        `,
        kotlin: code`
          fun continuousSubarrays(nums: IntArray): Int {
              val n = nums.size
              val maxQ = IntArray(n)
              val minQ = IntArray(n)
              var maxH = 0
              var maxT = 0
              var minH = 0
              var minT = 0
              var left = 0
              var ans = 0L
              for (right in 0 until n) {
                  val v = nums[right]
                  while (maxT > maxH && maxQ[maxT - 1] < v) maxT--
                  maxQ[maxT] = v
                  maxT++
                  while (minT > minH && minQ[minT - 1] > v) minT--
                  minQ[minT] = v
                  minT++
                  while (maxQ[maxH] - minQ[minH] > 2) {
                      if (maxQ[maxH] == nums[left]) maxH++
                      if (minQ[minH] == nums[left]) minH++
                      left++
                  }
                  ans += (right - left + 1).toLong()
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func continuousSubarrays(_ nums: [Int]) -> Int {
              let n = nums.count
              var maxQ = [Int](repeating: 0, count: n)
              var minQ = [Int](repeating: 0, count: n)
              var maxH = 0, maxT = 0, minH = 0, minT = 0, left = 0, ans = 0
              for right in 0..<n {
                  let v = nums[right]
                  while maxT > maxH && maxQ[maxT - 1] < v { maxT -= 1 }
                  maxQ[maxT] = v
                  maxT += 1
                  while minT > minH && minQ[minT - 1] > v { minT -= 1 }
                  minQ[minT] = v
                  minT += 1
                  while maxQ[maxH] - minQ[minH] > 2 {
                      if maxQ[maxH] == nums[left] { maxH += 1 }
                      if minQ[minH] == nums[left] { minH += 1 }
                      left += 1
                  }
                  ans += right - left + 1
              }
              return ans
          }
        `,
        rust: code`
          fn continuousSubarrays(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut max_q = vec![0i32; n];
              let mut min_q = vec![0i32; n];
              let (mut max_h, mut max_t, mut min_h, mut min_t) = (0usize, 0usize, 0usize, 0usize);
              let mut left = 0usize;
              let mut ans: i64 = 0;
              for right in 0..n {
                  let v = nums[right];
                  while max_t > max_h && max_q[max_t - 1] < v {
                      max_t -= 1;
                  }
                  max_q[max_t] = v;
                  max_t += 1;
                  while min_t > min_h && min_q[min_t - 1] > v {
                      min_t -= 1;
                  }
                  min_q[min_t] = v;
                  min_t += 1;
                  while max_q[max_h] - min_q[min_h] > 2 {
                      if max_q[max_h] == nums[left] {
                          max_h += 1;
                      }
                      if min_q[min_h] == nums[left] {
                          min_h += 1;
                      }
                      left += 1;
                  }
                  ans += (right + 1 - left) as i64;
              }
              ans as i32
          }
        `,
        php: code`
          function continuousSubarrays($nums) {
              $n = count($nums);
              $maxQ = array_fill(0, $n, 0);
              $minQ = array_fill(0, $n, 0);
              $maxH = 0; $maxT = 0; $minH = 0; $minT = 0; $left = 0; $ans = 0;
              for ($right = 0; $right < $n; $right++) {
                  $v = $nums[$right];
                  while ($maxT > $maxH && $maxQ[$maxT - 1] < $v) $maxT--;
                  $maxQ[$maxT++] = $v;
                  while ($minT > $minH && $minQ[$minT - 1] > $v) $minT--;
                  $minQ[$minT++] = $v;
                  while ($maxQ[$maxH] - $minQ[$minH] > 2) {
                      if ($maxQ[$maxH] == $nums[$left]) $maxH++;
                      if ($minQ[$minH] == $nums[$left]) $minH++;
                      $left++;
                  }
                  $ans += $right - $left + 1;
              }
              return $ans;
          }
        `,
        ruby: code`
          def continuousSubarrays(nums)
            n = nums.length
            max_q = Array.new(n, 0)
            min_q = Array.new(n, 0)
            max_h = max_t = min_h = min_t = left = ans = 0
            (0...n).each do |right|
              v = nums[right]
              max_t -= 1 while max_t > max_h && max_q[max_t - 1] < v
              max_q[max_t] = v
              max_t += 1
              min_t -= 1 while min_t > min_h && min_q[min_t - 1] > v
              min_q[min_t] = v
              min_t += 1
              while max_q[max_h] - min_q[min_h] > 2
                max_h += 1 if max_q[max_h] == nums[left]
                min_h += 1 if min_q[min_h] == nums[left]
                left += 1
              end
              ans += right - left + 1
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Count Subarrays Where Max Element Appears at Least K Times (LC 2962) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      const mx = Math.max.apply(null, nums);
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        let c = 0;
        for (let j = i; j < nums.length; j++) {
          if (nums[j] === mx) c++;
          if (c >= k) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-subarrays-where-max-element-appears-at-least-k-times",
      title: "Count Subarrays Where Max Element Appears at Least K Times",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "countSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and a positive integer `k`.\n\nLet `M` be the **maximum element of the whole array**. Return the number of non-empty contiguous subarrays in which `M` appears **at least `k` times**.\n\n*CodeKairo note:* the original allows `nums.length` up to 10^5 and returns a 64-bit count; here the length is at most `5 * 10^4`, so the answer fits in a 32-bit integer.",
        [
          { in: "nums = [4,1,4,2,4,3], k = 2", out: "8", note: "The maximum 4 sits at indices 0, 2 and 4. Four subarrays start at index 0 and reach index 2 or beyond; four more start at index 1 or 2 and reach index 4 or beyond." },
          { in: "nums = [3,1,3], k = 3", out: "0", note: "The maximum 3 occurs only twice in the whole array." },
          { in: "nums = [7,7,7], k = 1", out: "6", note: "Every subarray contains a 7." },
        ],
        ["1 <= nums.length <= 5 * 10^4", "1 <= nums[i] <= 10^6", "1 <= k <= 10^5"]),
      hints: [
        "The element that matters is fixed: the maximum of the entire array. Only its positions affect the answer.",
        "If a subarray `[l, r]` contains the maximum at least `k` times, then so does every subarray `[l', r]` with `l' <= l`.",
        "Sweep `right`; count occurrences of the maximum in the window and move `left` forward while the count is still at least `k`. After that, exactly `left` starting positions (0 .. left-1) give valid subarrays ending at `right`.",
      ],
      editorial: explain({
        idea: "For a fixed right end, extending to the left only adds occurrences of the maximum, so the valid left ends are a prefix `0 .. left-1`. A sliding window finds `left` for every right end in one pass.",
        steps: [
          "Compute `M = max(nums)`.",
          "Keep `left = 0` and `cnt = 0` (occurrences of `M` in `nums[left..right]`).",
          "For each `right`: if `nums[right] == M`, increment `cnt`.",
          "While `cnt >= k`: if `nums[left] == M`, decrement `cnt`; advance `left`.",
          "Add `left` to the answer — every start `0 .. left-1` still has at least `k` copies when ending at `right`.",
        ],
        why: "After the inner loop, `[left, right]` holds fewer than `k` copies of `M`, but `[left - 1, right]` held at least `k` (that is why the loop advanced past it), and so does every window starting further left. Since `left` never moves backwards — adding elements on the right only increases the count — the total work is linear.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The maximum is the global one; recomputing a window maximum solves a different problem.",
          "The answer can be quadratic in `n` — accumulate it in 64-bit in fixed-width languages.",
          "If `M` occurs fewer than `k` times overall, the loop never advances and the answer is 0, as it should be.",
        ],
      }),
      examples: [
        { input: "[4,1,4,2,4,3]\n2", expectedOutput: "8" },
        { input: "[3,1,3]\n3", expectedOutput: "0" },
        { input: "[7,7,7]\n1", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 40), ri(rng, 40, 70)]);
        const hiV = pick(rng, [3, 10, 1000, 1000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hiV));
        // plant extra copies of the maximum so k > 1 is interesting
        const mx = Math.max.apply(null, nums);
        const extra = ri(rng, 0, Math.floor(n / 3));
        for (let e = 0; e < extra; e++) nums[ri(rng, 0, n - 1)] = mx;
        let occ = 0;
        for (const v of nums) if (v === mx) occ++;
        const k = rng() < 0.12 ? pick(rng, [occ + 1, ri(rng, 1, 100000)]) : ri(rng, 1, occ);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countSubarrays(nums: List[int], k: int) -> int:
              mx = max(nums)
              cnt = 0
              left = 0
              ans = 0
              for v in nums:
                  if v == mx:
                      cnt += 1
                  while cnt >= k:
                      if nums[left] == mx:
                          cnt -= 1
                      left += 1
                  ans += left
              return ans
        `,
        javascript: code`
          var countSubarrays = function(nums, k) {
              var mx = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];
              var cnt = 0, left = 0, ans = 0;
              for (var right = 0; right < nums.length; right++) {
                  if (nums[right] === mx) cnt++;
                  while (cnt >= k) {
                      if (nums[left] === mx) cnt--;
                      left++;
                  }
                  ans += left;
              }
              return ans;
          };
        `,
        typescript: code`
          function countSubarrays(nums: number[], k: number): number {
              var mx = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > mx) mx = nums[i];
              var cnt = 0, left = 0, ans = 0;
              for (var right = 0; right < nums.length; right++) {
                  if (nums[right] === mx) cnt++;
                  while (cnt >= k) {
                      if (nums[left] === mx) cnt--;
                      left++;
                  }
                  ans += left;
              }
              return ans;
          }
        `,
        java: code`
          public static int countSubarrays(int[] nums, int k) {
              int mx = 0;
              for (int v : nums) mx = Math.max(mx, v);
              int cnt = 0, left = 0;
              long ans = 0;
              for (int right = 0; right < nums.length; right++) {
                  if (nums[right] == mx) cnt++;
                  while (cnt >= k) {
                      if (nums[left] == mx) cnt--;
                      left++;
                  }
                  ans += left;
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int countSubarrays(vector<int>& nums, int k) {
              int mx = *max_element(nums.begin(), nums.end());
              int cnt = 0, left = 0;
              long long ans = 0;
              for (int right = 0; right < (int) nums.size(); right++) {
                  if (nums[right] == mx) cnt++;
                  while (cnt >= k) {
                      if (nums[left] == mx) cnt--;
                      left++;
                  }
                  ans += left;
              }
              return (int) ans;
          }
        `,
        c: code`
          int countSubarrays(int* nums, int numsSize, int k) {
              int mx = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] > mx) mx = nums[i];
              int cnt = 0, left = 0;
              long long ans = 0;
              for (int right = 0; right < numsSize; right++) {
                  if (nums[right] == mx) cnt++;
                  while (cnt >= k) {
                      if (nums[left] == mx) cnt--;
                      left++;
                  }
                  ans += left;
              }
              return (int) ans;
          }
        `,
        csharp: code`
          public static int CountSubarrays(int[] nums, int k)
          {
              int mx = 0;
              foreach (int v in nums) mx = Math.Max(mx, v);
              int cnt = 0, left = 0;
              long ans = 0;
              for (int right = 0; right < nums.Length; right++)
              {
                  if (nums[right] == mx) cnt++;
                  while (cnt >= k)
                  {
                      if (nums[left] == mx) cnt--;
                      left++;
                  }
                  ans += left;
              }
              return (int) ans;
          }
        `,
        go: code`
          func countSubarrays(nums []int, k int) int {
              mx := 0
              for _, v := range nums {
                  if v > mx {
                      mx = v
                  }
              }
              cnt, left, ans := 0, 0, 0
              for right := 0; right < len(nums); right++ {
                  if nums[right] == mx {
                      cnt++
                  }
                  for cnt >= k {
                      if nums[left] == mx {
                          cnt--
                      }
                      left++
                  }
                  ans += left
              }
              return ans
          }
        `,
        kotlin: code`
          fun countSubarrays(nums: IntArray, k: Int): Int {
              var mx = 0
              for (v in nums) if (v > mx) mx = v
              var cnt = 0
              var left = 0
              var ans = 0L
              for (right in nums.indices) {
                  if (nums[right] == mx) cnt++
                  while (cnt >= k) {
                      if (nums[left] == mx) cnt--
                      left++
                  }
                  ans += left.toLong()
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func countSubarrays(_ nums: [Int], _ k: Int) -> Int {
              let mx = nums.max()!
              var cnt = 0, left = 0, ans = 0
              for right in 0..<nums.count {
                  if nums[right] == mx { cnt += 1 }
                  while cnt >= k {
                      if nums[left] == mx { cnt -= 1 }
                      left += 1
                  }
                  ans += left
              }
              return ans
          }
        `,
        rust: code`
          fn countSubarrays(nums: Vec<i32>, k: i32) -> i32 {
              let mx = *nums.iter().max().unwrap();
              let mut cnt = 0i32;
              let mut left = 0usize;
              let mut ans: i64 = 0;
              for right in 0..nums.len() {
                  if nums[right] == mx {
                      cnt += 1;
                  }
                  while cnt >= k {
                      if nums[left] == mx {
                          cnt -= 1;
                      }
                      left += 1;
                  }
                  ans += left as i64;
              }
              ans as i32
          }
        `,
        php: code`
          function countSubarrays($nums, $k) {
              $mx = max($nums);
              $cnt = 0; $left = 0; $ans = 0;
              $n = count($nums);
              for ($right = 0; $right < $n; $right++) {
                  if ($nums[$right] == $mx) $cnt++;
                  while ($cnt >= $k) {
                      if ($nums[$left] == $mx) $cnt--;
                      $left++;
                  }
                  $ans += $left;
              }
              return $ans;
          }
        `,
        ruby: code`
          def countSubarrays(nums, k)
            mx = nums.max
            cnt = 0
            left = 0
            ans = 0
            nums.each do |v|
              cnt += 1 if v == mx
              while cnt >= k
                cnt -= 1 if nums[left] == mx
                left += 1
              end
              ans += left
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum of Almost Unique Subarray (LC 2841) ─────────────
  (() => {
    const ref = (nums: number[], m: number, k: number) => {
      let best = 0;
      for (let i = 0; i + k <= nums.length; i++) {
        const win = nums.slice(i, i + k);
        if (new Set(win).size < m) continue;
        let s = 0;
        for (const v of win) s += v;
        best = Math.max(best, s);
      }
      return best;
    };
    return {
      slug: "maximum-sum-of-almost-unique-subarray",
      title: "Maximum Sum of Almost Unique Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "maxSum", params: [{ name: "nums", type: "int[]" as const }, { name: "m", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and two positive integers `m` and `k`.\n\nA contiguous subarray of length exactly `k` is **almost unique** when it contains at least `m` **distinct** values.\n\nReturn the maximum sum over all almost unique subarrays of length `k`. If there is none, return `0`.\n\n*CodeKairo note:* the original allows `nums[i]` up to 10^9 and returns a 64-bit sum; here `nums[i] <= 10^5`, so every window sum fits in a 32-bit integer.",
        [
          { in: "nums = [3,8,2,8,1,4], m = 3, k = 4", out: "21", note: "The windows are `[3,8,2,8]` (3 distinct, sum 21), `[8,2,8,1]` (3 distinct, sum 19) and `[2,8,1,4]` (4 distinct, sum 15)." },
          { in: "nums = [6,6,1,6,6], m = 2, k = 2", out: "7", note: "Only `[6,1]` and `[1,6]` have two distinct values." },
          { in: "nums = [4,4,4,4], m = 2, k = 3", out: "0", note: "No window has two distinct values." },
        ],
        ["1 <= nums.length <= 2 * 10^4", "1 <= m <= k <= nums.length", "1 <= nums[i] <= 10^5"]),
      hints: [
        "All candidate windows have the same length `k`, so slide one window of length `k` across the array.",
        "When the window moves one step, exactly one value enters and one leaves. Keep a running sum and a count per value.",
        "The number of distinct values is the number of keys with a positive count — update it when a count goes 0 → 1 or 1 → 0.",
      ],
      editorial: explain({
        idea: "A fixed-length sliding window with a frequency map gives each window's sum and distinct count in O(1) amortised per step.",
        steps: [
          "Walk `i` over the array, adding `nums[i]` to the running sum and incrementing its count (a count going 0 → 1 adds a distinct value).",
          "Once `i >= k`, remove `nums[i - k]`: subtract it from the sum and decrement its count (a count going 1 → 0 removes a distinct value).",
          "When `i >= k - 1`, the window `nums[i-k+1 .. i]` is complete: if it has at least `m` distinct values, update the best sum.",
          "Return the best sum (0 if no window qualified).",
        ],
        why: "Every length-`k` window is visited exactly once, and the map always reflects exactly the elements inside the current window, so its number of positive entries is the window's distinct count. Because all values are positive the empty answer 0 is below every real window sum, which is why 0 can stand for \"none\".",
        time: "O(n)",
        space: "O(k)",
        pitfalls: [
          "Recomputing the distinct count of each window from scratch is O(n · k).",
          "Delete (or ignore) keys whose count drops to 0, or the map's size overstates the distinct count.",
          "With the original 10^9 bound the sum needs 64 bits; keep the running sum in a 64-bit variable anyway.",
        ],
      }),
      examples: [
        { input: "[3,8,2,8,1,4]\n3\n4", expectedOutput: "21" },
        { input: "[6,6,1,6,6]\n2\n2", expectedOutput: "7" },
        { input: "[4,4,4,4]\n2\n3", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 30), ri(rng, 30, 60)]);
        const hiV = pick(rng, [2, 4, 10, 1000, 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hiV));
        const k = pick(rng, [1, ri(rng, 1, n), ri(rng, 1, Math.min(n, 6)), n]);
        const m = pick(rng, [1, ri(rng, 1, k), Math.min(k, ri(rng, 1, 4)), k]);
        return { input: `${fmtIntArr(nums)}\n${m}\n${k}`, expectedOutput: String(ref(nums, m, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSum(nums: List[int], m: int, k: int) -> int:
              count = {}
              total = 0
              best = 0
              for i, v in enumerate(nums):
                  total += v
                  count[v] = count.get(v, 0) + 1
                  if i >= k:
                      old = nums[i - k]
                      total -= old
                      count[old] -= 1
                      if count[old] == 0:
                          del count[old]
                  if i >= k - 1 and len(count) >= m and total > best:
                      best = total
              return best
        `,
        javascript: code`
          var maxSum = function(nums, m, k) {
              var count = new Map();
              var sum = 0, best = 0;
              for (var i = 0; i < nums.length; i++) {
                  sum += nums[i];
                  count.set(nums[i], (count.get(nums[i]) || 0) + 1);
                  if (i >= k) {
                      var old = nums[i - k];
                      sum -= old;
                      var c = count.get(old) - 1;
                      if (c === 0) count.delete(old); else count.set(old, c);
                  }
                  if (i >= k - 1 && count.size >= m && sum > best) best = sum;
              }
              return best;
          };
        `,
        typescript: code`
          function maxSum(nums: number[], m: number, k: number): number {
              var count: { [key: string]: number } = {};
              var distinct = 0, sum = 0, best = 0;
              for (var i = 0; i < nums.length; i++) {
                  var key = "" + nums[i];
                  sum += nums[i];
                  var cur = count[key];
                  if (cur === undefined || cur === 0) { distinct++; count[key] = 1; } else count[key] = cur + 1;
                  if (i >= k) {
                      var oldKey = "" + nums[i - k];
                      sum -= nums[i - k];
                      count[oldKey]--;
                      if (count[oldKey] === 0) distinct--;
                  }
                  if (i >= k - 1 && distinct >= m && sum > best) best = sum;
              }
              return best;
          }
        `,
        java: code`
          public static int maxSum(int[] nums, int m, int k) {
              Map<Integer, Integer> count = new HashMap<>();
              long sum = 0, best = 0;
              for (int i = 0; i < nums.length; i++) {
                  sum += nums[i];
                  count.merge(nums[i], 1, Integer::sum);
                  if (i >= k) {
                      int old = nums[i - k];
                      sum -= old;
                      int c = count.get(old) - 1;
                      if (c == 0) count.remove(old); else count.put(old, c);
                  }
                  if (i >= k - 1 && count.size() >= m && sum > best) best = sum;
              }
              return (int) best;
          }
        `,
        cpp: code`
          int maxSum(vector<int>& nums, int m, int k) {
              unordered_map<int, int> count;
              long long sum = 0, best = 0;
              for (int i = 0; i < (int) nums.size(); i++) {
                  sum += nums[i];
                  count[nums[i]]++;
                  if (i >= k) {
                      int old = nums[i - k];
                      sum -= old;
                      if (--count[old] == 0) count.erase(old);
                  }
                  if (i >= k - 1 && (int) count.size() >= m && sum > best) best = sum;
              }
              return (int) best;
          }
        `,
        c: code`
          static int cmpAsc2841(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int maxSum(int* nums, int numsSize, int m, int k) {
              int n = numsSize;
              int* sorted = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) sorted[i] = nums[i];
              qsort(sorted, n, sizeof(int), cmpAsc2841);
              int* id = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) {
                  int lo = 0, hi = n - 1;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (sorted[mid] < nums[i]) lo = mid + 1; else hi = mid;
                  }
                  id[i] = lo;
              }
              int* count = (int*)calloc(n, sizeof(int));
              long long sum = 0, best = 0;
              int distinct = 0;
              for (int i = 0; i < n; i++) {
                  sum += nums[i];
                  if (count[id[i]]++ == 0) distinct++;
                  if (i >= k) {
                      sum -= nums[i - k];
                      if (--count[id[i - k]] == 0) distinct--;
                  }
                  if (i >= k - 1 && distinct >= m && sum > best) best = sum;
              }
              free(sorted);
              free(id);
              free(count);
              return (int) best;
          }
        `,
        csharp: code`
          public static int MaxSum(int[] nums, int m, int k)
          {
              var count = new Dictionary<int, int>();
              long sum = 0, best = 0;
              for (int i = 0; i < nums.Length; i++)
              {
                  sum += nums[i];
                  count.TryGetValue(nums[i], out int cur);
                  count[nums[i]] = cur + 1;
                  if (i >= k)
                  {
                      int old = nums[i - k];
                      sum -= old;
                      int c = count[old] - 1;
                      if (c == 0) count.Remove(old); else count[old] = c;
                  }
                  if (i >= k - 1 && count.Count >= m && sum > best) best = sum;
              }
              return (int) best;
          }
        `,
        go: code`
          func maxSum(nums []int, m int, k int) int {
              count := map[int]int{}
              sum, best := 0, 0
              for i := 0; i < len(nums); i++ {
                  sum += nums[i]
                  count[nums[i]]++
                  if i >= k {
                      old := nums[i-k]
                      sum -= old
                      count[old]--
                      if count[old] == 0 {
                          delete(count, old)
                      }
                  }
                  if i >= k-1 && len(count) >= m && sum > best {
                      best = sum
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxSum(nums: IntArray, m: Int, k: Int): Int {
              val count = HashMap<Int, Int>()
              var sum = 0L
              var best = 0L
              for (i in nums.indices) {
                  sum += nums[i]
                  count[nums[i]] = (count[nums[i]] ?: 0) + 1
                  if (i >= k) {
                      val old = nums[i - k]
                      sum -= old
                      val c = count[old]!! - 1
                      if (c == 0) { count.remove(old) } else { count[old] = c }
                  }
                  if (i >= k - 1 && count.size >= m && sum > best) best = sum
              }
              return best.toInt()
          }
        `,
        swift: code`
          func maxSum(_ nums: [Int], _ m: Int, _ k: Int) -> Int {
              var count = [Int: Int]()
              var sum = 0, best = 0
              for i in 0..<nums.count {
                  sum += nums[i]
                  count[nums[i], default: 0] += 1
                  if i >= k {
                      let old = nums[i - k]
                      sum -= old
                      let c = count[old]! - 1
                      if c == 0 { count.removeValue(forKey: old) } else { count[old] = c }
                  }
                  if i >= k - 1 && count.count >= m && sum > best { best = sum }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn maxSum(nums: Vec<i32>, m: i32, k: i32) -> i32 {
              let k = k as usize;
              let m = m as usize;
              let mut count: HashMap<i32, i32> = HashMap::new();
              let mut sum: i64 = 0;
              let mut best: i64 = 0;
              for i in 0..nums.len() {
                  sum += nums[i] as i64;
                  *count.entry(nums[i]).or_insert(0) += 1;
                  if i >= k {
                      let old = nums[i - k];
                      sum -= old as i64;
                      let c = count[&old] - 1;
                      if c == 0 {
                          count.remove(&old);
                      } else {
                          count.insert(old, c);
                      }
                  }
                  if i + 1 >= k && count.len() >= m && sum > best {
                      best = sum;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function maxSum($nums, $m, $k) {
              $count = [];
              $sum = 0; $best = 0;
              $n = count($nums);
              for ($i = 0; $i < $n; $i++) {
                  $sum += $nums[$i];
                  $count[$nums[$i]] = (isset($count[$nums[$i]]) ? $count[$nums[$i]] : 0) + 1;
                  if ($i >= $k) {
                      $old = $nums[$i - $k];
                      $sum -= $old;
                      $count[$old]--;
                      if ($count[$old] == 0) unset($count[$old]);
                  }
                  if ($i >= $k - 1 && count($count) >= $m && $sum > $best) $best = $sum;
              }
              return $best;
          }
        `,
        ruby: code`
          def maxSum(nums, m, k)
            count = Hash.new(0)
            sum = 0
            best = 0
            nums.each_with_index do |v, i|
              sum += v
              count[v] += 1
              if i >= k
                old = nums[i - k]
                sum -= old
                count[old] -= 1
                count.delete(old) if count[old] == 0
              end
              best = sum if i >= k - 1 && count.size >= m && sum > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Count of Interesting Subarrays (LC 2845) ────────────────────
  (() => {
    const ref = (nums: number[], modulo: number, k: number) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        let c = 0;
        for (let j = i; j < nums.length; j++) {
          if (nums[j] % modulo === k) c++;
          if (c % modulo === k) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-of-interesting-subarrays",
      title: "Count of Interesting Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "countInterestingSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "modulo", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and two integers `modulo` and `k`.\n\nFor a non-empty contiguous subarray `nums[l..r]`, let `cnt` be the number of indices `i` in `[l, r]` with `nums[i] % modulo == k`. The subarray is **interesting** when `cnt % modulo == k`.\n\nReturn the number of interesting subarrays.\n\n*CodeKairo note:* the original allows `nums.length` up to 10^5 and returns a 64-bit count; here the length is at most `5 * 10^4`, so the answer fits in a 32-bit integer.",
        [
          { in: "nums = [5,2,7,4], modulo = 3, k = 1", out: "4", note: "Only 7 and 4 leave remainder 1. The interesting subarrays are those holding exactly one of them: `[7]`, `[2,7]`, `[5,2,7]` and `[4]`." },
          { in: "nums = [6,3,9], modulo = 3, k = 0", out: "1", note: "Every element qualifies, so `cnt` is the length; only the whole array has a length divisible by 3." },
          { in: "nums = [1,2,3], modulo = 5, k = 4", out: "0" },
        ],
        ["1 <= nums.length <= 5 * 10^4", "1 <= nums[i] <= 10^9", "1 <= modulo <= 10^9", "0 <= k < modulo"]),
      hints: [
        "Turn the array into 0/1 flags: 1 where `nums[i] % modulo == k`. Then `cnt` for a subarray is a difference of two prefix sums of the flags.",
        "With prefix counts `P`, the subarray `(l, r]` is interesting when `(P[r] - P[l]) % modulo == k`, i.e. `P[l] % modulo == (P[r] - k) % modulo` (taken non-negative).",
        "Sweep `r`, keeping a hash map from `P[l] % modulo` to how many earlier prefixes have it (start with `{0: 1}`); add the count of the required residue each step.",
      ],
      editorial: explain({
        idea: "This is the \"subarrays with sum ≡ k (mod m)\" pattern on 0/1 flags: count earlier prefix residues that complete the current one.",
        steps: [
          "Keep a running count `cnt` of qualifying elements seen so far and a map `seen` with `seen[0] = 1` (the empty prefix).",
          "For each element, increment `cnt` if `nums[i] % modulo == k`, then let `r = cnt % modulo`.",
          "The needed earlier residue is `(r - k + modulo) % modulo`; add `seen[needed]` to the answer.",
          "Increment `seen[r]`.",
        ],
        why: "For a subarray `(l, r]`, its count is `P[r] - P[l]`, and `(P[r] - P[l]) % modulo == k` holds exactly when `P[l] ≡ P[r] - k (mod modulo)`. Since `0 <= k < modulo`, the residue `(P[r] - k) mod modulo` is a single well-defined value, and the map holds how many prefixes `l < r` have it. Every subarray corresponds to one pair `(l, r)`, so each is counted once.",
        time: "O(n)",
        space: "O(min(n, modulo))",
        pitfalls: [
          "`k` can be 0: then subarrays with no qualifying element at all are interesting (their count 0 is ≡ 0).",
          "`modulo` can be huge, so the residues are just the counts themselves — never allocate an array of size `modulo`. Counts never exceed `n`, so an array of size `n + 1` also works.",
          "Make the needed residue non-negative before the lookup; `%` keeps the dividend's sign in most languages.",
        ],
      }),
      examples: [
        { input: "[5,2,7,4]\n3\n1", expectedOutput: "4" },
        { input: "[6,3,9]\n3\n0", expectedOutput: "1" },
        { input: "[1,2,3]\n5\n4", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 30), ri(rng, 30, 60)]);
        const big = rng() < 0.2;
        const modulo = big ? ri(rng, 1, 1000000000) : pick(rng, [1, 2, 3, ri(rng, 2, 6), ri(rng, 4, 12)]);
        const k = big ? (rng() < 0.5 ? 0 : ri(rng, 0, Math.min(modulo - 1, 3))) : ri(rng, 0, modulo - 1);
        const hitP = pick(rng, [0.1, 0.4, 0.8, 1]);
        const nums = Array.from({ length: n }, () => {
          if (rng() < hitP) {
            // a value with remainder k
            const maxT = Math.floor((1000000000 - k) / modulo);
            const t = ri(rng, k === 0 ? 1 : 0, Math.min(maxT, pick(rng, [5, 1000000])));
            return k + modulo * t;
          }
          return ri(rng, 1, pick(rng, [20, 1000000000]));
        });
        return { input: `${fmtIntArr(nums)}\n${modulo}\n${k}`, expectedOutput: String(ref(nums, modulo, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countInterestingSubarrays(nums: List[int], modulo: int, k: int) -> int:
              seen = {0: 1}
              cnt = 0
              ans = 0
              for v in nums:
                  if v % modulo == k:
                      cnt += 1
                  r = cnt % modulo
                  ans += seen.get((r - k) % modulo, 0)
                  seen[r] = seen.get(r, 0) + 1
              return ans
        `,
        javascript: code`
          var countInterestingSubarrays = function(nums, modulo, k) {
              var seen = new Map();
              seen.set(0, 1);
              var cnt = 0, ans = 0;
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] % modulo === k) cnt++;
                  var r = cnt % modulo;
                  var want = (r - k + modulo) % modulo;
                  ans += seen.get(want) || 0;
                  seen.set(r, (seen.get(r) || 0) + 1);
              }
              return ans;
          };
        `,
        typescript: code`
          function countInterestingSubarrays(nums: number[], modulo: number, k: number): number {
              var n = nums.length;
              // residues are prefix counts reduced mod modulo, so they never exceed n
              var seen: number[] = [];
              for (var t = 0; t <= n; t++) seen.push(0);
              seen[0] = 1;
              var cnt = 0, ans = 0;
              for (var i = 0; i < n; i++) {
                  if (nums[i] % modulo === k) cnt++;
                  var r = cnt % modulo;
                  var want = (r - k + modulo) % modulo;
                  if (want <= n) ans += seen[want];
                  seen[r]++;
              }
              return ans;
          }
        `,
        java: code`
          public static int countInterestingSubarrays(int[] nums, int modulo, int k) {
              int n = nums.length;
              int[] seen = new int[n + 1];
              seen[0] = 1;
              int cnt = 0;
              long ans = 0;
              for (int i = 0; i < n; i++) {
                  if (nums[i] % modulo == k) cnt++;
                  int r = cnt % modulo;
                  long want = ((long) r - k + modulo) % modulo;
                  if (want <= n) ans += seen[(int) want];
                  seen[r]++;
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int countInterestingSubarrays(vector<int>& nums, int modulo, int k) {
              int n = nums.size();
              vector<int> seen(n + 1, 0);
              seen[0] = 1;
              int cnt = 0;
              long long ans = 0;
              for (int i = 0; i < n; i++) {
                  if (nums[i] % modulo == k) cnt++;
                  int r = cnt % modulo;
                  long long want = ((long long) r - k + modulo) % modulo;
                  if (want <= n) ans += seen[want];
                  seen[r]++;
              }
              return (int) ans;
          }
        `,
        c: code`
          int countInterestingSubarrays(int* nums, int numsSize, int modulo, int k) {
              int n = numsSize;
              int* seen = (int*)calloc(n + 1, sizeof(int));
              seen[0] = 1;
              int cnt = 0;
              long long ans = 0;
              for (int i = 0; i < n; i++) {
                  if (nums[i] % modulo == k) cnt++;
                  int r = cnt % modulo;
                  long long want = ((long long) r - k + modulo) % modulo;
                  if (want <= n) ans += seen[want];
                  seen[r]++;
              }
              free(seen);
              return (int) ans;
          }
        `,
        csharp: code`
          public static int CountInterestingSubarrays(int[] nums, int modulo, int k)
          {
              int n = nums.Length;
              int[] seen = new int[n + 1];
              seen[0] = 1;
              int cnt = 0;
              long ans = 0;
              for (int i = 0; i < n; i++)
              {
                  if (nums[i] % modulo == k) cnt++;
                  int r = cnt % modulo;
                  long want = ((long) r - k + modulo) % modulo;
                  if (want <= n) ans += seen[(int) want];
                  seen[r]++;
              }
              return (int) ans;
          }
        `,
        go: code`
          func countInterestingSubarrays(nums []int, modulo int, k int) int {
              n := len(nums)
              seen := make([]int, n+1)
              seen[0] = 1
              cnt, ans := 0, 0
              for i := 0; i < n; i++ {
                  if nums[i]%modulo == k {
                      cnt++
                  }
                  r := cnt % modulo
                  want := (r - k + modulo) % modulo
                  if want <= n {
                      ans += seen[want]
                  }
                  seen[r]++
              }
              return ans
          }
        `,
        kotlin: code`
          fun countInterestingSubarrays(nums: IntArray, modulo: Int, k: Int): Int {
              val n = nums.size
              val seen = IntArray(n + 1)
              seen[0] = 1
              var cnt = 0
              var ans = 0L
              for (v in nums) {
                  if (v % modulo == k) cnt++
                  val r = cnt % modulo
                  val want = (r.toLong() - k + modulo) % modulo
                  if (want <= n) ans += seen[want.toInt()]
                  seen[r]++
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func countInterestingSubarrays(_ nums: [Int], _ modulo: Int, _ k: Int) -> Int {
              let n = nums.count
              var seen = [Int](repeating: 0, count: n + 1)
              seen[0] = 1
              var cnt = 0, ans = 0
              for v in nums {
                  if v % modulo == k { cnt += 1 }
                  let r = cnt % modulo
                  let want = (r - k + modulo) % modulo
                  if want <= n { ans += seen[want] }
                  seen[r] += 1
              }
              return ans
          }
        `,
        rust: code`
          fn countInterestingSubarrays(nums: Vec<i32>, modulo: i32, k: i32) -> i32 {
              let n = nums.len();
              let md = modulo as i64;
              let kk = k as i64;
              let mut seen = vec![0i64; n + 1];
              seen[0] = 1;
              let mut cnt: i64 = 0;
              let mut ans: i64 = 0;
              for &v in nums.iter() {
                  if (v as i64) % md == kk {
                      cnt += 1;
                  }
                  let r = cnt % md;
                  let want = (r - kk + md) % md;
                  if want <= n as i64 {
                      ans += seen[want as usize];
                  }
                  seen[r as usize] += 1;
              }
              ans as i32
          }
        `,
        php: code`
          function countInterestingSubarrays($nums, $modulo, $k) {
              $seen = [0 => 1];
              $cnt = 0; $ans = 0;
              foreach ($nums as $v) {
                  if ($v % $modulo == $k) $cnt++;
                  $r = $cnt % $modulo;
                  $want = ($r - $k + $modulo) % $modulo;
                  if (isset($seen[$want])) $ans += $seen[$want];
                  $seen[$r] = (isset($seen[$r]) ? $seen[$r] : 0) + 1;
              }
              return $ans;
          }
        `,
        ruby: code`
          def countInterestingSubarrays(nums, modulo, k)
            seen = Hash.new(0)
            seen[0] = 1
            cnt = 0
            ans = 0
            nums.each do |v|
              cnt += 1 if v % modulo == k
              r = cnt % modulo
              ans += seen[(r - k) % modulo]
              seen[r] += 1
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Count the Number of Fair Pairs (LC 2563) ────────────────────
  (() => {
    const ref = (nums: number[], lower: number, upper: number) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const s = nums[i] + nums[j];
          if (lower <= s && s <= upper) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-the-number-of-fair-pairs",
      title: "Count the Number of Fair Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Sorting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "countFairPairs", params: [{ name: "nums", type: "int[]" as const }, { name: "lower", type: "int" as const }, { name: "upper", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` of length `n` and two integers `lower` and `upper`, count the **fair pairs**.\n\nA pair of indices `(i, j)` is fair when `0 <= i < j < n` and `lower <= nums[i] + nums[j] <= upper`.\n\n*CodeKairo note:* the original allows `n` up to 10^5 and returns a 64-bit count; here `n <= 5 * 10^4`, so the answer fits in a 32-bit integer. A single pair sum can still reach `2 * 10^9`.",
        [
          { in: "nums = [2,-1,5,3,0], lower = 2, upper = 5", out: "6", note: "The pairs with sums 5 (2+3), 2 (2+0), 4 (-1+5), 2 (-1+3), 5 (5+0) and 3 (3+0)." },
          { in: "nums = [4,6,1,9], lower = 10, upper = 10", out: "2", note: "4 + 6 and 1 + 9." },
          { in: "nums = [7], lower = 0, upper = 100", out: "0", note: "A single element forms no pair." },
        ],
        ["1 <= nums.length <= 5 * 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= lower <= upper <= 10^9"]),
      hints: [
        "The count of pairs does not depend on the order of the array — only on which values exist. So you may sort it.",
        "Counting pairs with a sum inside `[lower, upper]` is (pairs with sum `<= upper`) minus (pairs with sum `<= lower - 1`).",
        "In a sorted array, count pairs with sum `<= x` with two pointers: if `a[i] + a[j] <= x`, all of `a[i+1..j]` pair with `a[i]`, so add `j - i` and move `i` right; otherwise move `j` left.",
      ],
      editorial: explain({
        idea: "Sorting does not change the set of unordered pairs, and on a sorted array \"how many pairs sum to at most `x`\" is a linear two-pointer count. The range answer is the difference of two such counts.",
        steps: [
          "Sort a copy of `nums` ascending.",
          "Define `atMost(x)`: with `i = 0`, `j = n - 1`, while `i < j`: if `a[i] + a[j] <= x`, add `j - i` (every partner of `a[i]` in `i+1..j`) and increment `i`; otherwise decrement `j`.",
          "Return `atMost(upper) - atMost(lower - 1)`.",
        ],
        why: "If `a[i] + a[j] <= x`, then `a[i] + a[t] <= x` for every `t` in `(i, j]` because the array is sorted, so all `j - i` pairs are counted at once and `a[i]` is finished. If the sum is too big, `a[j]` exceeds the limit with every remaining partner (all of them are `>= a[i]`), so `a[j]` is finished. Each step finishes one element, so each pair is classified exactly once.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Pair sums reach ±2·10^9, beyond 32-bit range — add in 64-bit.",
          "Count unordered pairs `i < j`: never pair an element with itself.",
          "Binary search per element (lower/upper bound in the suffix) also works in O(n log n); the two-pointer version avoids off-by-one errors with the bounds.",
        ],
      }),
      examples: [
        { input: "[2,-1,5,3,0]\n2\n5", expectedOutput: "6" },
        { input: "[4,6,1,9]\n10\n10", expectedOutput: "2" },
        { input: "[7]\n0\n100", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 30), ri(rng, 30, 60)]);
        const span = pick(rng, [3, 10, 1000, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, -span, span));
        const clamp = (x: number) => Math.max(-1000000000, Math.min(1000000000, x));
        let lower: number, upper: number;
        if (n >= 2 && rng() < 0.7) {
          const s1 = nums[ri(rng, 0, n - 1)] + nums[ri(rng, 0, n - 1)];
          const s2 = nums[ri(rng, 0, n - 1)] + nums[ri(rng, 0, n - 1)];
          lower = clamp(Math.min(s1, s2));
          upper = clamp(Math.max(s1, s2));
        } else {
          const a = ri(rng, -Math.min(span * 2, 1000000000), Math.min(span * 2, 1000000000));
          const b = ri(rng, -Math.min(span * 2, 1000000000), Math.min(span * 2, 1000000000));
          lower = Math.min(a, b);
          upper = Math.max(a, b);
        }
        if (rng() < 0.05) { lower = -1000000000; upper = 1000000000; }
        return { input: `${fmtIntArr(nums)}\n${lower}\n${upper}`, expectedOutput: String(ref(nums, lower, upper)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countFairPairs(nums: List[int], lower: int, upper: int) -> int:
              a = sorted(nums)

              def at_most(limit: int) -> int:
                  i = 0
                  j = len(a) - 1
                  cnt = 0
                  while i < j:
                      if a[i] + a[j] <= limit:
                          cnt += j - i
                          i += 1
                      else:
                          j -= 1
                  return cnt

              return at_most(upper) - at_most(lower - 1)
        `,
        javascript: code`
          var countFairPairs = function(nums, lower, upper) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var atMost = function(limit) {
                  var i = 0, j = a.length - 1, cnt = 0;
                  while (i < j) {
                      if (a[i] + a[j] <= limit) { cnt += j - i; i++; }
                      else j--;
                  }
                  return cnt;
              };
              return atMost(upper) - atMost(lower - 1);
          };
        `,
        typescript: code`
          function countFairPairs(nums: number[], lower: number, upper: number): number {
              var a = nums.slice().sort(function (x, y) { return x - y; });
              var atMost = function (limit: number): number {
                  var i = 0, j = a.length - 1, cnt = 0;
                  while (i < j) {
                      if (a[i] + a[j] <= limit) { cnt += j - i; i++; }
                      else j--;
                  }
                  return cnt;
              };
              return atMost(upper) - atMost(lower - 1);
          }
        `,
        java: code`
          static long fairAtMost2563(int[] a, long limit) {
              int i = 0, j = a.length - 1;
              long cnt = 0;
              while (i < j) {
                  if ((long) a[i] + a[j] <= limit) { cnt += j - i; i++; }
                  else j--;
              }
              return cnt;
          }

          public static int countFairPairs(int[] nums, int lower, int upper) {
              int[] a = nums.clone();
              Arrays.sort(a);
              return (int) (fairAtMost2563(a, upper) - fairAtMost2563(a, (long) lower - 1));
          }
        `,
        cpp: code`
          long long fairAtMost2563(const vector<int>& a, long long limit) {
              int i = 0, j = (int) a.size() - 1;
              long long cnt = 0;
              while (i < j) {
                  if ((long long) a[i] + a[j] <= limit) { cnt += j - i; i++; }
                  else j--;
              }
              return cnt;
          }

          int countFairPairs(vector<int>& nums, int lower, int upper) {
              vector<int> a(nums.begin(), nums.end());
              sort(a.begin(), a.end());
              return (int) (fairAtMost2563(a, upper) - fairAtMost2563(a, (long long) lower - 1));
          }
        `,
        c: code`
          static int cmpAsc2563(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          static long long fairAtMost2563(const int* a, int n, long long limit) {
              int i = 0, j = n - 1;
              long long cnt = 0;
              while (i < j) {
                  if ((long long) a[i] + a[j] <= limit) { cnt += j - i; i++; }
                  else j--;
              }
              return cnt;
          }

          int countFairPairs(int* nums, int numsSize, int lower, int upper) {
              int* a = (int*)malloc(sizeof(int) * numsSize);
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), cmpAsc2563);
              long long res = fairAtMost2563(a, numsSize, upper) - fairAtMost2563(a, numsSize, (long long) lower - 1);
              free(a);
              return (int) res;
          }
        `,
        csharp: code`
          static long FairAtMost2563(int[] a, long limit)
          {
              int i = 0, j = a.Length - 1;
              long cnt = 0;
              while (i < j)
              {
                  if ((long) a[i] + a[j] <= limit) { cnt += j - i; i++; }
                  else j--;
              }
              return cnt;
          }

          public static int CountFairPairs(int[] nums, int lower, int upper)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              return (int) (FairAtMost2563(a, upper) - FairAtMost2563(a, (long) lower - 1));
          }
        `,
        go: code`
          func fairAtMost2563(a []int, limit int) int {
              i, j, cnt := 0, len(a)-1, 0
              for i < j {
                  if a[i]+a[j] <= limit {
                      cnt += j - i
                      i++
                  } else {
                      j--
                  }
              }
              return cnt
          }

          func countFairPairs(nums []int, lower int, upper int) int {
              a := make([]int, len(nums))
              copy(a, nums)
              sort.Ints(a)
              return fairAtMost2563(a, upper) - fairAtMost2563(a, lower-1)
          }
        `,
        kotlin: code`
          fun fairAtMost2563(a: IntArray, limit: Long): Long {
              var i = 0
              var j = a.size - 1
              var cnt = 0L
              while (i < j) {
                  if (a[i].toLong() + a[j] <= limit) {
                      cnt += (j - i).toLong()
                      i++
                  } else {
                      j--
                  }
              }
              return cnt
          }

          fun countFairPairs(nums: IntArray, lower: Int, upper: Int): Int {
              val a = nums.copyOf()
              a.sort()
              return (fairAtMost2563(a, upper.toLong()) - fairAtMost2563(a, lower.toLong() - 1)).toInt()
          }
        `,
        swift: code`
          func fairAtMost2563(_ a: [Int], _ limit: Int) -> Int {
              var i = 0, j = a.count - 1, cnt = 0
              while i < j {
                  if a[i] + a[j] <= limit {
                      cnt += j - i
                      i += 1
                  } else {
                      j -= 1
                  }
              }
              return cnt
          }

          func countFairPairs(_ nums: [Int], _ lower: Int, _ upper: Int) -> Int {
              let a = nums.sorted()
              return fairAtMost2563(a, upper) - fairAtMost2563(a, lower - 1)
          }
        `,
        rust: code`
          fn fair_at_most_2563(a: &Vec<i64>, limit: i64) -> i64 {
              let mut cnt: i64 = 0;
              if a.len() < 2 {
                  return 0;
              }
              let mut i = 0usize;
              let mut j = a.len() - 1;
              while i < j {
                  if a[i] + a[j] <= limit {
                      cnt += (j - i) as i64;
                      i += 1;
                  } else {
                      j -= 1;
                  }
              }
              cnt
          }

          fn countFairPairs(nums: Vec<i32>, lower: i32, upper: i32) -> i32 {
              let mut a: Vec<i64> = nums.iter().map(|&x| x as i64).collect();
              a.sort();
              (fair_at_most_2563(&a, upper as i64) - fair_at_most_2563(&a, lower as i64 - 1)) as i32
          }
        `,
        php: code`
          function fairAtMost2563($a, $limit) {
              $i = 0; $j = count($a) - 1; $cnt = 0;
              while ($i < $j) {
                  if ($a[$i] + $a[$j] <= $limit) { $cnt += $j - $i; $i++; }
                  else $j--;
              }
              return $cnt;
          }

          function countFairPairs($nums, $lower, $upper) {
              $a = $nums;
              sort($a);
              return fairAtMost2563($a, $upper) - fairAtMost2563($a, $lower - 1);
          }
        `,
        ruby: code`
          def fair_at_most_2563(a, limit)
            i = 0
            j = a.length - 1
            cnt = 0
            while i < j
              if a[i] + a[j] <= limit
                cnt += j - i
                i += 1
              else
                j -= 1
              end
            end
            cnt
          end

          def countFairPairs(nums, lower, upper)
            a = nums.sort
            fair_at_most_2563(a, upper) - fair_at_most_2563(a, lower - 1)
          end
        `,
      },
    };
  })(),

  // ── K Divisible Elements Subarrays (LC 2261) ────────────────────
  (() => {
    const ref = (nums: number[], k: number, p: number) => {
      const seen = new Set<string>();
      for (let i = 0; i < nums.length; i++) {
        let cnt = 0;
        for (let j = i; j < nums.length; j++) {
          if (nums[j] % p === 0) cnt++;
          if (cnt > k) break;
          seen.add(nums.slice(i, j + 1).join(","));
        }
      }
      return seen.size;
    };
    return {
      slug: "k-divisible-elements-subarrays",
      title: "K Divisible Elements Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Trie", "Enumeration", "Amazon", "Google"],
      signature: { funcName: "countDistinct", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }, { name: "p", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and two integers `k` and `p`, return the number of **distinct** non-empty contiguous subarrays that contain **at most `k`** elements divisible by `p`.\n\nTwo subarrays are the same when they have the same length and the same values in the same order — where they occur in `nums` does not matter. For example, in `[3,1,3]` the two single-element subarrays `[3]` count once.",
        [
          { in: "nums = [4,2,3,3], k = 1, p = 2", out: "6", note: "`[4]`, `[2]`, `[2,3]`, `[2,3,3]`, `[3]` and `[3,3]`. Any subarray holding both 4 and 2 has two even elements." },
          { in: "nums = [1,1,1], k = 1, p = 5", out: "3", note: "Nothing is divisible by 5, so all subarrays qualify, but only `[1]`, `[1,1]` and `[1,1,1]` are distinct." },
          { in: "nums = [6,3,6], k = 2, p = 3", out: "4", note: "`[6]`, `[3]`, `[6,3]` and `[3,6]`; the whole array has three multiples of 3." },
        ],
        ["1 <= nums.length <= 200", "1 <= nums[i], p <= 200", "1 <= k <= nums.length"],
        "Can you solve it in O(n^2) time?"),
      hints: [
        "There are only about `n^2 / 2` subarrays. For each start index, extend the end until the count of multiples of `p` exceeds `k` — after that, longer ones fail too.",
        "The hard part is deduplication. Storing every subarray as a string costs O(n^3) in total.",
        "Insert the subarrays that start at `i` into a trie, one value per edge, while you extend them. A subarray is new exactly when its last step creates a new trie node.",
      ],
      editorial: explain({
        idea: "All subarrays starting at index `i` are prefixes of one another, so they are exactly the nodes along one path of a trie keyed by values. Counting newly created trie nodes counts distinct subarrays in O(n^2).",
        steps: [
          "Create a trie with an empty root.",
          "For each start `i`: set `node = root` and `cnt = 0`.",
          "For `j = i, i+1, …`: if `nums[j] % p == 0`, increment `cnt`; if `cnt > k`, stop extending this start.",
          "Follow (or create) the child of `node` labelled `nums[j]`. Creating it means the subarray `nums[i..j]` has never been seen — add 1 to the answer. Move `node` to that child.",
        ],
        why: "Each trie node at depth `d` stands for exactly one sequence of `d` values (the labels on its root path). Every valid subarray is inserted, and a node is created only the first time its sequence appears, so the number of created nodes equals the number of distinct valid subarrays. Stopping once `cnt > k` is safe because any extension keeps or increases the count.",
        time: "O(n^2)",
        space: "O(n^2)",
        pitfalls: [
          "Deduplicate by contents, not by position — `[3]` at index 0 and index 2 is one subarray.",
          "Joining values into a string key without a separator makes `[1,12]` collide with `[11,2]`.",
          "The divisibility count restarts for every start index.",
        ],
      }),
      examples: [
        { input: "[4,2,3,3]\n1\n2", expectedOutput: "6" },
        { input: "[1,1,1]\n1\n5", expectedOutput: "3" },
        { input: "[6,3,6]\n2\n3", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 6), ri(rng, 7, 15), ri(rng, 16, 22)]);
        const hiV = pick(rng, [2, 3, 6, 20, 200]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hiV));
        const p = pick(rng, [1, 2, 3, ri(rng, 1, 10), ri(rng, 1, 200)]);
        const k = pick(rng, [1, ri(rng, 1, n), ri(rng, 1, Math.min(n, 3)), n]);
        return { input: `${fmtIntArr(nums)}\n${k}\n${p}`, expectedOutput: String(ref(nums, k, p)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countDistinct(nums: List[int], k: int, p: int) -> int:
              children = [{}]
              ans = 0
              n = len(nums)
              for i in range(n):
                  node = 0
                  cnt = 0
                  for j in range(i, n):
                      v = nums[j]
                      if v % p == 0:
                          cnt += 1
                      if cnt > k:
                          break
                      nxt = children[node].get(v)
                      if nxt is None:
                          nxt = len(children)
                          children.append({})
                          children[node][v] = nxt
                          ans += 1
                      node = nxt
              return ans
        `,
        javascript: code`
          var countDistinct = function(nums, k, p) {
              // the whole trie in one map: key node * 201 + value -> child id
              var child = new Map();
              var nodes = 1, ans = 0;
              for (var i = 0; i < nums.length; i++) {
                  var node = 0, cnt = 0;
                  for (var j = i; j < nums.length; j++) {
                      if (nums[j] % p === 0) cnt++;
                      if (cnt > k) break;
                      var key = node * 201 + nums[j];
                      var nxt = child.get(key);
                      if (nxt === undefined) {
                          nxt = nodes++;
                          child.set(key, nxt);
                          ans++;
                      }
                      node = nxt;
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function countDistinct(nums: number[], k: number, p: number): number {
              // one map for the whole trie: key "node:value" -> child id
              var child: { [key: string]: number } = {};
              var nodes = 1, ans = 0;
              for (var i = 0; i < nums.length; i++) {
                  var node = 0, cnt = 0;
                  for (var j = i; j < nums.length; j++) {
                      if (nums[j] % p === 0) cnt++;
                      if (cnt > k) break;
                      var key = node + ":" + nums[j];
                      var nxt = child[key];
                      if (nxt === undefined) {
                          nxt = nodes++;
                          child[key] = nxt;
                          ans++;
                      }
                      node = nxt;
                  }
              }
              return ans;
          }
        `,
        java: code`
          public static int countDistinct(int[] nums, int k, int p) {
              Map<Integer, Integer> child = new HashMap<>();
              int nodes = 1, ans = 0;
              for (int i = 0; i < nums.length; i++) {
                  int node = 0, cnt = 0;
                  for (int j = i; j < nums.length; j++) {
                      if (nums[j] % p == 0) cnt++;
                      if (cnt > k) break;
                      int key = node * 201 + nums[j];
                      Integer nxt = child.get(key);
                      if (nxt == null) {
                          nxt = nodes++;
                          child.put(key, nxt);
                          ans++;
                      }
                      node = nxt;
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          int countDistinct(vector<int>& nums, int k, int p) {
              unordered_map<long long, int> child;
              int nodes = 1, ans = 0, n = nums.size();
              for (int i = 0; i < n; i++) {
                  int node = 0, cnt = 0;
                  for (int j = i; j < n; j++) {
                      if (nums[j] % p == 0) cnt++;
                      if (cnt > k) break;
                      long long key = (long long) node * 201 + nums[j];
                      auto it = child.find(key);
                      if (it == child.end()) {
                          child[key] = nodes;
                          node = nodes++;
                          ans++;
                      } else {
                          node = it->second;
                      }
                  }
              }
              return ans;
          }
        `,
        c: code`
          int countDistinct(int* nums, int numsSize, int k, int p) {
              int maxNodes = numsSize * (numsSize + 1) / 2 + 1;
              int* child = (int*)calloc((size_t) maxNodes * 201, sizeof(int));
              int nodes = 1, ans = 0;
              for (int i = 0; i < numsSize; i++) {
                  int node = 0, cnt = 0;
                  for (int j = i; j < numsSize; j++) {
                      if (nums[j] % p == 0) cnt++;
                      if (cnt > k) break;
                      int* slot = &child[(size_t) node * 201 + nums[j]];
                      if (*slot == 0) {
                          *slot = nodes++;
                          ans++;
                      }
                      node = *slot;
                  }
              }
              free(child);
              return ans;
          }
        `,
        csharp: code`
          public static int CountDistinct(int[] nums, int k, int p)
          {
              var child = new Dictionary<int, int>();
              int nodes = 1, ans = 0;
              for (int i = 0; i < nums.Length; i++)
              {
                  int node = 0, cnt = 0;
                  for (int j = i; j < nums.Length; j++)
                  {
                      if (nums[j] % p == 0) cnt++;
                      if (cnt > k) break;
                      int key = node * 201 + nums[j];
                      int nxt;
                      if (!child.TryGetValue(key, out nxt))
                      {
                          nxt = nodes++;
                          child[key] = nxt;
                          ans++;
                      }
                      node = nxt;
                  }
              }
              return ans;
          }
        `,
        go: code`
          func countDistinct(nums []int, k int, p int) int {
              child := map[int]int{}
              nodes, ans := 1, 0
              for i := 0; i < len(nums); i++ {
                  node, cnt := 0, 0
                  for j := i; j < len(nums); j++ {
                      if nums[j]%p == 0 {
                          cnt++
                      }
                      if cnt > k {
                          break
                      }
                      key := node*201 + nums[j]
                      nxt, ok := child[key]
                      if !ok {
                          nxt = nodes
                          nodes++
                          child[key] = nxt
                          ans++
                      }
                      node = nxt
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun countDistinct(nums: IntArray, k: Int, p: Int): Int {
              val child = HashMap<Int, Int>()
              var nodes = 1
              var ans = 0
              for (i in nums.indices) {
                  var node = 0
                  var cnt = 0
                  for (j in i until nums.size) {
                      if (nums[j] % p == 0) cnt++
                      if (cnt > k) break
                      val key = node * 201 + nums[j]
                      val found = child[key]
                      if (found == null) {
                          child[key] = nodes
                          node = nodes
                          nodes++
                          ans++
                      } else {
                          node = found
                      }
                  }
              }
              return ans
          }
        `,
        swift: code`
          func countDistinct(_ nums: [Int], _ k: Int, _ p: Int) -> Int {
              var child = [Int: Int]()
              var nodes = 1, ans = 0
              let n = nums.count
              for i in 0..<n {
                  var node = 0, cnt = 0
                  for j in i..<n {
                      if nums[j] % p == 0 { cnt += 1 }
                      if cnt > k { break }
                      let key = node * 201 + nums[j]
                      if let nxt = child[key] {
                          node = nxt
                      } else {
                          child[key] = nodes
                          node = nodes
                          nodes += 1
                          ans += 1
                      }
                  }
              }
              return ans
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn countDistinct(nums: Vec<i32>, k: i32, p: i32) -> i32 {
              let mut child: HashMap<i64, i64> = HashMap::new();
              let mut nodes: i64 = 1;
              let mut ans = 0i32;
              let n = nums.len();
              for i in 0..n {
                  let mut node: i64 = 0;
                  let mut cnt = 0i32;
                  for j in i..n {
                      if nums[j] % p == 0 {
                          cnt += 1;
                      }
                      if cnt > k {
                          break;
                      }
                      let key = node * 201 + nums[j] as i64;
                      if let Some(&nxt) = child.get(&key) {
                          node = nxt;
                      } else {
                          child.insert(key, nodes);
                          node = nodes;
                          nodes += 1;
                          ans += 1;
                      }
                  }
              }
              ans
          }
        `,
        php: code`
          function countDistinct($nums, $k, $p) {
              $child = [];
              $nodes = 1; $ans = 0;
              $n = count($nums);
              for ($i = 0; $i < $n; $i++) {
                  $node = 0; $cnt = 0;
                  for ($j = $i; $j < $n; $j++) {
                      if ($nums[$j] % $p == 0) $cnt++;
                      if ($cnt > $k) break;
                      $key = $node * 201 + $nums[$j];
                      if (!isset($child[$key])) {
                          $child[$key] = $nodes++;
                          $ans++;
                      }
                      $node = $child[$key];
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def countDistinct(nums, k, p)
            child = {}
            nodes = 1
            ans = 0
            n = nums.length
            (0...n).each do |i|
              node = 0
              cnt = 0
              (i...n).each do |j|
                cnt += 1 if nums[j] % p == 0
                break if cnt > k
                key = node * 201 + nums[j]
                nxt = child[key]
                if nxt.nil?
                  nxt = nodes
                  nodes += 1
                  child[key] = nxt
                  ans += 1
                end
                node = nxt
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximum White Tiles Covered by a Carpet (LC 2271) ───────────
  (() => {
    const ref = (tiles: number[][], carpetLen: number) => {
      // try every start at a tile's left end and every finish at a tile's right end
      const covered = (start: number) => {
        const end = start + carpetLen - 1;
        let s = 0;
        for (const [l, r] of tiles) s += Math.max(0, Math.min(r, end) - Math.max(l, start) + 1);
        return s;
      };
      let best = 0;
      for (const [l, r] of tiles) best = Math.max(best, covered(l), covered(r - carpetLen + 1));
      return best;
    };
    return {
      slug: "maximum-white-tiles-covered-by-a-carpet",
      title: "Maximum White Tiles Covered by a Carpet",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Sorting", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "maximumWhiteTiles", params: [{ name: "tiles", type: "int[][]" as const }, { name: "carpetLen", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A floor is a line of numbered cells. You are given `tiles`, where `tiles[i] = [l, r]` means every cell from `l` to `r` (inclusive) is **white**. The ranges do not overlap, and they are given in no particular order.\n\nYou also have one carpet that covers exactly `carpetLen` consecutive cells, and you may lay it anywhere.\n\nReturn the **maximum** number of white cells the carpet can cover.",
        [
          { in: "tiles = [[3,6],[10,12],[13,15],[20,24]], carpetLen = 8", out: "6", note: "Laying the carpet on cells 10–17 covers 10–12 and 13–15." },
          { in: "tiles = [[7,7],[1,3]], carpetLen = 5", out: "3", note: "Cells 1–5 cover the whole tile `[1,3]`." },
          { in: "tiles = [[5,20]], carpetLen = 100", out: "16" },
        ],
        ["1 <= tiles.length <= 5 * 10^4", "tiles[i].length == 2", "1 <= l <= r <= 10^9", "1 <= carpetLen <= 10^9", "The tiles are non-overlapping."]),
      hints: [
        "Some optimal placement starts exactly at the left end of a tile: sliding a carpet right until its start meets a tile's left end never loses white cells.",
        "Sort the tiles. For a carpet starting at `tiles[i].l`, the tiles it covers completely form a run `i .. j-1`, and at most one more tile `j` is covered partially.",
        "As `i` increases, `j` only moves forward. Keep prefix sums of tile lengths so the full tiles cost O(1), and add the partial overlap with tile `j`.",
      ],
      editorial: explain({
        idea: "Only placements that start at a tile's left end need checking. After sorting, the fully covered tiles for consecutive starts form a sliding window, so prefix sums plus one partial tile give each placement's coverage in O(1).",
        steps: [
          "Sort the tiles by left end and build prefix sums `pre` of their lengths `r - l + 1`.",
          "Keep a pointer `j` (never decreasing). For each `i`, let `end = tiles[i].l + carpetLen - 1` and set `j = max(j, i)`.",
          "Advance `j` while `tiles[j].r <= end` — those tiles are fully covered.",
          "Coverage is `pre[j] - pre[i]` plus, if `j < n` and `tiles[j].l <= end`, the partial `end - tiles[j].l + 1`.",
          "Return the maximum coverage.",
        ],
        why: "Take an optimal placement. If its first cell is not white, slide the carpet right one cell at a time: each step drops a non-white cell and gains one cell, so coverage never falls, until the first cell reaches a tile's left end. If its first cell is white but not a tile's left end, slide it left: each step gains a white cell and loses at most one, until the start reaches that tile's left end. Either way some optimal placement starts at a left end. For those starts the carpet's last cell grows with `i`, so the fully covered tiles form a window whose right edge only advances.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "`l + carpetLen - 1` can reach about 2·10^9 — compute it in 64-bit.",
          "The input is not sorted; sort it first.",
          "A carpet shorter than a single tile covers only part of that tile — the partial term handles it, with `j` staying at `i`.",
        ],
      }),
      examples: [
        { input: "[[3,6],[10,12],[13,15],[20,24]]\n8", expectedOutput: "6" },
        { input: "[[7,7],[1,3]]\n5", expectedOutput: "3" },
        { input: "[[5,20]]\n100", expectedOutput: "16" },
      ],
      gen: (rng: Rng) => {
        const want = rng() < 0.05 ? 1 : pick(rng, [ri(rng, 2, 5), ri(rng, 6, 15), ri(rng, 15, 30)]);
        const gapMax = pick(rng, [1, 3, 20, 1000, 30000000]);
        const lenMax = pick(rng, [1, 4, 20, 1000, 30000000]);
        const tiles: number[][] = [];
        let cur = ri(rng, 1, pick(rng, [5, 1000]));
        for (let t = 0; t < want; t++) {
          const l = cur + (t === 0 ? 0 : ri(rng, 1, gapMax));
          const r = l + ri(rng, 1, lenMax) - 1;
          if (r > 1000000000) break;
          tiles.push([l, r]);
          cur = r + 1;
        }
        if (tiles.length === 0) tiles.push([1, 1]);
        shuffle(rng, tiles);
        const spanMax = Math.max(...tiles.map((t) => t[1])) - Math.min(...tiles.map((t) => t[0])) + 1;
        const carpetLen = rng() < 0.06 ? pick(rng, [1, 1000000000]) : pick(rng, [ri(rng, 2, 6), ri(rng, 1, Math.max(1, Math.floor(spanMax / 3))), ri(rng, 1, spanMax), ri(rng, Math.max(1, Math.floor(spanMax / 3)), spanMax)]);
        return { input: `${fmtIntMat(tiles)}\n${carpetLen}`, expectedOutput: String(ref(tiles, carpetLen)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumWhiteTiles(tiles: List[List[int]], carpetLen: int) -> int:
              t = sorted(tiles)
              n = len(t)
              pre = [0] * (n + 1)
              for i in range(n):
                  pre[i + 1] = pre[i] + t[i][1] - t[i][0] + 1
              ans = 0
              j = 0
              for i in range(n):
                  end = t[i][0] + carpetLen - 1
                  j = max(j, i)
                  while j < n and t[j][1] <= end:
                      j += 1
                  cover = pre[j] - pre[i]
                  if j < n and t[j][0] <= end:
                      cover += end - t[j][0] + 1
                  ans = max(ans, cover)
              return ans
        `,
        javascript: code`
          var maximumWhiteTiles = function(tiles, carpetLen) {
              var t = tiles.slice().sort(function(a, b) { return a[0] - b[0]; });
              var n = t.length;
              var pre = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + t[i][1] - t[i][0] + 1);
              var ans = 0, j = 0;
              for (var i = 0; i < n; i++) {
                  var end = t[i][0] + carpetLen - 1;
                  if (j < i) j = i;
                  while (j < n && t[j][1] <= end) j++;
                  var cover = pre[j] - pre[i];
                  if (j < n && t[j][0] <= end) cover += end - t[j][0] + 1;
                  if (cover > ans) ans = cover;
              }
              return ans;
          };
        `,
        typescript: code`
          function maximumWhiteTiles(tiles: number[][], carpetLen: number): number {
              var t = tiles.slice().sort(function (a, b) { return a[0] - b[0]; });
              var n = t.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + t[i][1] - t[i][0] + 1);
              var ans = 0, j = 0;
              for (var i = 0; i < n; i++) {
                  var end = t[i][0] + carpetLen - 1;
                  if (j < i) j = i;
                  while (j < n && t[j][1] <= end) j++;
                  var cover = pre[j] - pre[i];
                  if (j < n && t[j][0] <= end) cover += end - t[j][0] + 1;
                  if (cover > ans) ans = cover;
              }
              return ans;
          }
        `,
        java: code`
          public static int maximumWhiteTiles(int[][] tiles, int carpetLen) {
              int[][] t = tiles.clone();
              Arrays.sort(t, (a, b) -> Integer.compare(a[0], b[0]));
              int n = t.length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + t[i][1] - t[i][0] + 1;
              long ans = 0;
              int j = 0;
              for (int i = 0; i < n; i++) {
                  long end = (long) t[i][0] + carpetLen - 1;
                  if (j < i) j = i;
                  while (j < n && t[j][1] <= end) j++;
                  long cover = pre[j] - pre[i];
                  if (j < n && t[j][0] <= end) cover += end - t[j][0] + 1;
                  ans = Math.max(ans, cover);
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int maximumWhiteTiles(vector<vector<int>>& tiles, int carpetLen) {
              vector<vector<int>> t(tiles.begin(), tiles.end());
              sort(t.begin(), t.end());
              int n = t.size();
              vector<long long> pre(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + t[i][1] - t[i][0] + 1;
              long long ans = 0;
              int j = 0;
              for (int i = 0; i < n; i++) {
                  long long end = (long long) t[i][0] + carpetLen - 1;
                  if (j < i) j = i;
                  while (j < n && t[j][1] <= end) j++;
                  long long cover = pre[j] - pre[i];
                  if (j < n && t[j][0] <= end) cover += end - t[j][0] + 1;
                  ans = max(ans, cover);
              }
              return (int) ans;
          }
        `,
        c: code`
          static int cmpTile2271(const void* a, const void* b) {
              int x = (*(int* const*)a)[0], y = (*(int* const*)b)[0];
              return (x > y) - (x < y);
          }

          int maximumWhiteTiles(int** tiles, int tilesSize, int* tilesColSize, int carpetLen) {
              int n = tilesSize;
              int** t = (int**)malloc(sizeof(int*) * n);
              for (int i = 0; i < n; i++) t[i] = tiles[i];
              qsort(t, n, sizeof(int*), cmpTile2271);
              long long* pre = (long long*)malloc(sizeof(long long) * (n + 1));
              pre[0] = 0;
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + t[i][1] - t[i][0] + 1;
              long long ans = 0;
              int j = 0;
              for (int i = 0; i < n; i++) {
                  long long end = (long long) t[i][0] + carpetLen - 1;
                  if (j < i) j = i;
                  while (j < n && t[j][1] <= end) j++;
                  long long cover = pre[j] - pre[i];
                  if (j < n && t[j][0] <= end) cover += end - t[j][0] + 1;
                  if (cover > ans) ans = cover;
              }
              free(t);
              free(pre);
              return (int) ans;
          }
        `,
        csharp: code`
          public static int MaximumWhiteTiles(int[][] tiles, int carpetLen)
          {
              int[][] t = (int[][])tiles.Clone();
              Array.Sort(t, (a, b) => a[0].CompareTo(b[0]));
              int n = t.Length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + t[i][1] - t[i][0] + 1;
              long ans = 0;
              int j = 0;
              for (int i = 0; i < n; i++)
              {
                  long end = (long) t[i][0] + carpetLen - 1;
                  if (j < i) j = i;
                  while (j < n && t[j][1] <= end) j++;
                  long cover = pre[j] - pre[i];
                  if (j < n && t[j][0] <= end) cover += end - t[j][0] + 1;
                  ans = Math.Max(ans, cover);
              }
              return (int) ans;
          }
        `,
        go: code`
          func maximumWhiteTiles(tiles [][]int, carpetLen int) int {
              n := len(tiles)
              t := make([][]int, n)
              copy(t, tiles)
              sort.Slice(t, func(a, b int) bool { return t[a][0] < t[b][0] })
              pre := make([]int, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + t[i][1] - t[i][0] + 1
              }
              ans, j := 0, 0
              for i := 0; i < n; i++ {
                  end := t[i][0] + carpetLen - 1
                  if j < i {
                      j = i
                  }
                  for j < n && t[j][1] <= end {
                      j++
                  }
                  cover := pre[j] - pre[i]
                  if j < n && t[j][0] <= end {
                      cover += end - t[j][0] + 1
                  }
                  if cover > ans {
                      ans = cover
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maximumWhiteTiles(tiles: Array<IntArray>, carpetLen: Int): Int {
              val t = tiles.sortedBy { it[0] }
              val n = t.size
              val pre = LongArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + t[i][1] - t[i][0] + 1
              var ans = 0L
              var j = 0
              for (i in 0 until n) {
                  val end = t[i][0].toLong() + carpetLen - 1
                  if (j < i) j = i
                  while (j < n && t[j][1] <= end) j++
                  var cover = pre[j] - pre[i]
                  if (j < n && t[j][0] <= end) cover += end - t[j][0] + 1
                  if (cover > ans) ans = cover
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func maximumWhiteTiles(_ tiles: [[Int]], _ carpetLen: Int) -> Int {
              let t = tiles.sorted { $0[0] < $1[0] }
              let n = t.count
              var pre = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + t[i][1] - t[i][0] + 1 }
              var ans = 0, j = 0
              for i in 0..<n {
                  let end = t[i][0] + carpetLen - 1
                  if j < i { j = i }
                  while j < n && t[j][1] <= end { j += 1 }
                  var cover = pre[j] - pre[i]
                  if j < n && t[j][0] <= end { cover += end - t[j][0] + 1 }
                  if cover > ans { ans = cover }
              }
              return ans
          }
        `,
        rust: code`
          fn maximumWhiteTiles(tiles: Vec<Vec<i32>>, carpetLen: i32) -> i32 {
              let mut t: Vec<(i64, i64)> = tiles.iter().map(|x| (x[0] as i64, x[1] as i64)).collect();
              t.sort();
              let n = t.len();
              let mut pre = vec![0i64; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + t[i].1 - t[i].0 + 1;
              }
              let mut ans: i64 = 0;
              let mut j = 0usize;
              for i in 0..n {
                  let end = t[i].0 + carpetLen as i64 - 1;
                  if j < i {
                      j = i;
                  }
                  while j < n && t[j].1 <= end {
                      j += 1;
                  }
                  let mut cover = pre[j] - pre[i];
                  if j < n && t[j].0 <= end {
                      cover += end - t[j].0 + 1;
                  }
                  if cover > ans {
                      ans = cover;
                  }
              }
              ans as i32
          }
        `,
        php: code`
          function maximumWhiteTiles($tiles, $carpetLen) {
              $t = $tiles;
              usort($t, function ($a, $b) { return $a[0] <=> $b[0]; });
              $n = count($t);
              $pre = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $t[$i][1] - $t[$i][0] + 1;
              $ans = 0; $j = 0;
              for ($i = 0; $i < $n; $i++) {
                  $end = $t[$i][0] + $carpetLen - 1;
                  if ($j < $i) $j = $i;
                  while ($j < $n && $t[$j][1] <= $end) $j++;
                  $cover = $pre[$j] - $pre[$i];
                  if ($j < $n && $t[$j][0] <= $end) $cover += $end - $t[$j][0] + 1;
                  if ($cover > $ans) $ans = $cover;
              }
              return $ans;
          }
        `,
        ruby: code`
          def maximumWhiteTiles(tiles, carpetLen)
            t = tiles.sort_by { |x| x[0] }
            n = t.length
            pre = Array.new(n + 1, 0)
            n.times { |i| pre[i + 1] = pre[i] + t[i][1] - t[i][0] + 1 }
            ans = 0
            j = 0
            n.times do |i|
              last = t[i][0] + carpetLen - 1
              j = i if j < i
              j += 1 while j < n && t[j][1] <= last
              cover = pre[j] - pre[i]
              cover += last - t[j][0] + 1 if j < n && t[j][0] <= last
              ans = cover if cover > ans
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximize Win From Two Segments (LC 2555) ────────────────────
  (() => {
    const ref = (pos: number[], k: number) => {
      const n = pos.length;
      // segments may be assumed to start at a prize; try every pair
      let best = 0;
      for (let a = 0; a < n; a++) {
        for (let b = a; b < n; b++) {
          let c = 0;
          for (const x of pos) {
            if ((pos[a] <= x && x - pos[a] <= k) || (pos[b] <= x && x - pos[b] <= k)) c++;
          }
          best = Math.max(best, c);
        }
      }
      return best;
    };
    return {
      slug: "maximize-win-from-two-segments",
      title: "Maximize Win From Two Segments",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "maximizeWin", params: [{ name: "prizePositions", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Prizes lie on the number line. `prizePositions` lists their positions in **non-decreasing** order; several prizes may share a position.\n\nYou may choose **two** segments with integer endpoints, each of length exactly `k` — a segment `[l, l + k]` collects every prize whose position lies within it, ends included. The segments may overlap, and a prize inside both is still collected once.\n\nReturn the maximum number of prizes you can collect.",
        [
          { in: "prizePositions = [1,2,2,4,7,8,8,12], k = 2", out: "6", note: "`[1,3]` collects 1, 2, 2 and `[7,9]` collects 7, 8, 8." },
          { in: "prizePositions = [3,3,3], k = 0", out: "3", note: "The single point segment `[3,3]` already holds all three prizes." },
          { in: "prizePositions = [1,5,9,13], k = 1", out: "2", note: "Each segment can reach only one prize." },
        ],
        ["1 <= prizePositions.length <= 10^5", "1 <= prizePositions[i] <= 10^9", "0 <= k <= 10^9", "prizePositions is sorted in non-decreasing order."]),
      hints: [
        "First solve it for one segment: for each right-most prize, the segment ending there holds every prize within distance `k` — a sliding window.",
        "With two segments, look for an optimal pair that does not overlap: one ends before the other starts (overlapping segments never beat shifting one of them apart).",
        "Keep `best[i]` = the most prizes one segment can collect among the first `i` prizes. When the window `[left, right]` ends at prize `right`, combine it with `best[left]`.",
      ],
      editorial: explain({
        idea: "A sliding window gives, for every right end, the best single segment ending there. Pairing it with the best segment that lies entirely to its left (a prefix maximum) covers every useful pair of segments.",
        steps: [
          "Keep `left = 0`, an answer `ans = 0` and an array `best` of length `n + 1` with `best[0] = 0`.",
          "For each `right`, advance `left` while `prizePositions[right] - prizePositions[left] > k`; the window holds `cur = right - left + 1` prizes.",
          "Update `ans = max(ans, cur + best[left])` — the second segment uses only prizes before index `left`.",
          "Set `best[right + 1] = max(best[right], cur)`.",
          "Return `ans`.",
        ],
        why: "Given any two segments, we can shrink the left one so it covers only prizes before the right one's first prize without losing anything collected (a prize in both counts once and is kept by the right one). So some optimum consists of a window `[left, right]` and a disjoint segment among prizes `0 .. left - 1`, whose best value is exactly `best[left]`. The sliding window enumerates every maximal window by its right end.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Compare differences (`pos[right] - pos[left] > k`) rather than computing `pos[left] + k`, which can overflow 32 bits.",
          "Duplicated positions are separate prizes — count indices, not distinct positions.",
          "When all prizes fit in one segment, the second contributes 0 and the answer is `n`.",
        ],
      }),
      examples: [
        { input: "[1,2,2,4,7,8,8,12]\n2", expectedOutput: "6" },
        { input: "[3,3,3]\n0", expectedOutput: "3" },
        { input: "[1,5,9,13]\n1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? 1 : pick(rng, [ri(rng, 2, 6), ri(rng, 7, 15), ri(rng, 15, 25)]);
        const step = pick(rng, [0, 1, 2, 5, 1000, 40000000]);
        const pos: number[] = [];
        let cur = ri(rng, 1, pick(rng, [3, 1000]));
        for (let i = 0; i < n; i++) {
          if (i > 0) cur += rng() < 0.3 ? 0 : ri(rng, 0, step);
          pos.push(Math.min(cur, 1000000000));
        }
        const k = rng() < 0.05 ? 1000000000 : pick(rng, [0, ri(rng, 0, 3), ri(rng, 0, Math.max(1, step * 3)), ri(rng, 0, Math.max(1, Math.floor((pos[n - 1] - pos[0]) / 2)))]);
        return { input: `${fmtIntArr(pos)}\n${k}`, expectedOutput: String(ref(pos, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximizeWin(prizePositions: List[int], k: int) -> int:
              n = len(prizePositions)
              best = [0] * (n + 1)
              ans = 0
              left = 0
              for right in range(n):
                  while prizePositions[right] - prizePositions[left] > k:
                      left += 1
                  cur = right - left + 1
                  ans = max(ans, cur + best[left])
                  best[right + 1] = max(best[right], cur)
              return ans
        `,
        javascript: code`
          var maximizeWin = function(prizePositions, k) {
              var n = prizePositions.length;
              var best = new Array(n + 1).fill(0);
              var ans = 0, left = 0;
              for (var right = 0; right < n; right++) {
                  while (prizePositions[right] - prizePositions[left] > k) left++;
                  var cur = right - left + 1;
                  if (cur + best[left] > ans) ans = cur + best[left];
                  best[right + 1] = Math.max(best[right], cur);
              }
              return ans;
          };
        `,
        typescript: code`
          function maximizeWin(prizePositions: number[], k: number): number {
              var n = prizePositions.length;
              var best: number[] = [0];
              var ans = 0, left = 0;
              for (var right = 0; right < n; right++) {
                  while (prizePositions[right] - prizePositions[left] > k) left++;
                  var cur = right - left + 1;
                  if (cur + best[left] > ans) ans = cur + best[left];
                  best.push(Math.max(best[right], cur));
              }
              return ans;
          }
        `,
        java: code`
          public static int maximizeWin(int[] prizePositions, int k) {
              int n = prizePositions.length;
              int[] best = new int[n + 1];
              int ans = 0, left = 0;
              for (int right = 0; right < n; right++) {
                  while (prizePositions[right] - prizePositions[left] > k) left++;
                  int cur = right - left + 1;
                  ans = Math.max(ans, cur + best[left]);
                  best[right + 1] = Math.max(best[right], cur);
              }
              return ans;
          }
        `,
        cpp: code`
          int maximizeWin(vector<int>& prizePositions, int k) {
              int n = prizePositions.size();
              vector<int> best(n + 1, 0);
              int ans = 0, left = 0;
              for (int right = 0; right < n; right++) {
                  while (prizePositions[right] - prizePositions[left] > k) left++;
                  int cur = right - left + 1;
                  ans = max(ans, cur + best[left]);
                  best[right + 1] = max(best[right], cur);
              }
              return ans;
          }
        `,
        c: code`
          int maximizeWin(int* prizePositions, int prizePositionsSize, int k) {
              int n = prizePositionsSize;
              int* best = (int*)calloc(n + 1, sizeof(int));
              int ans = 0, left = 0;
              for (int right = 0; right < n; right++) {
                  while (prizePositions[right] - prizePositions[left] > k) left++;
                  int cur = right - left + 1;
                  if (cur + best[left] > ans) ans = cur + best[left];
                  best[right + 1] = best[right] > cur ? best[right] : cur;
              }
              free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int MaximizeWin(int[] prizePositions, int k)
          {
              int n = prizePositions.Length;
              int[] best = new int[n + 1];
              int ans = 0, left = 0;
              for (int right = 0; right < n; right++)
              {
                  while (prizePositions[right] - prizePositions[left] > k) left++;
                  int cur = right - left + 1;
                  ans = Math.Max(ans, cur + best[left]);
                  best[right + 1] = Math.Max(best[right], cur);
              }
              return ans;
          }
        `,
        go: code`
          func maximizeWin(prizePositions []int, k int) int {
              n := len(prizePositions)
              best := make([]int, n+1)
              ans, left := 0, 0
              for right := 0; right < n; right++ {
                  for prizePositions[right]-prizePositions[left] > k {
                      left++
                  }
                  cur := right - left + 1
                  if cur+best[left] > ans {
                      ans = cur + best[left]
                  }
                  best[right+1] = best[right]
                  if cur > best[right+1] {
                      best[right+1] = cur
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maximizeWin(prizePositions: IntArray, k: Int): Int {
              val n = prizePositions.size
              val best = IntArray(n + 1)
              var ans = 0
              var left = 0
              for (right in 0 until n) {
                  while (prizePositions[right] - prizePositions[left] > k) left++
                  val cur = right - left + 1
                  ans = maxOf(ans, cur + best[left])
                  best[right + 1] = maxOf(best[right], cur)
              }
              return ans
          }
        `,
        swift: code`
          func maximizeWin(_ prizePositions: [Int], _ k: Int) -> Int {
              let n = prizePositions.count
              var best = [Int](repeating: 0, count: n + 1)
              var ans = 0, left = 0
              for right in 0..<n {
                  while prizePositions[right] - prizePositions[left] > k { left += 1 }
                  let cur = right - left + 1
                  ans = max(ans, cur + best[left])
                  best[right + 1] = max(best[right], cur)
              }
              return ans
          }
        `,
        rust: code`
          fn maximizeWin(prizePositions: Vec<i32>, k: i32) -> i32 {
              let n = prizePositions.len();
              let mut best = vec![0usize; n + 1];
              let mut ans = 0usize;
              let mut left = 0usize;
              for right in 0..n {
                  while prizePositions[right] - prizePositions[left] > k {
                      left += 1;
                  }
                  let cur = right + 1 - left;
                  if cur + best[left] > ans {
                      ans = cur + best[left];
                  }
                  best[right + 1] = if best[right] > cur { best[right] } else { cur };
              }
              ans as i32
          }
        `,
        php: code`
          function maximizeWin($prizePositions, $k) {
              $n = count($prizePositions);
              $best = array_fill(0, $n + 1, 0);
              $ans = 0; $left = 0;
              for ($right = 0; $right < $n; $right++) {
                  while ($prizePositions[$right] - $prizePositions[$left] > $k) $left++;
                  $cur = $right - $left + 1;
                  if ($cur + $best[$left] > $ans) $ans = $cur + $best[$left];
                  $best[$right + 1] = $best[$right] > $cur ? $best[$right] : $cur;
              }
              return $ans;
          }
        `,
        ruby: code`
          def maximizeWin(prizePositions, k)
            n = prizePositions.length
            best = Array.new(n + 1, 0)
            ans = 0
            left = 0
            (0...n).each do |right|
              left += 1 while prizePositions[right] - prizePositions[left] > k
              cur = right - left + 1
              ans = cur + best[left] if cur + best[left] > ans
              best[right + 1] = best[right] > cur ? best[right] : cur
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximum Fruits Harvested After at Most K Steps (LC 2106) ────
  (() => {
    const ref = (fruits: number[][], s: number, k: number) => {
      const inRange = (lo: number, hi: number) => {
        let t = 0;
        for (const [p, a] of fruits) if (lo <= p && p <= hi) t += a;
        return t;
      };
      let best = 0;
      if (k <= 400) {
        // simulate: walk a steps one way, then spend the rest going back the other way
        for (let a = 0; a <= k; a++) {
          const back = Math.max(0, k - 2 * a);
          best = Math.max(best, inRange(s - a, s + back), inRange(s - back, s + a));
        }
        return best;
      }
      // every reachable set is a range of fruits [l, r]; check its cheapest walk
      for (let l = 0; l < fruits.length; l++) {
        for (let r = l; r < fruits.length; r++) {
          const lo = Math.min(fruits[l][0], s), hi = Math.max(fruits[r][0], s);
          const steps = hi - lo + Math.min(s - lo, hi - s);
          if (steps <= k) best = Math.max(best, inRange(fruits[l][0], fruits[r][0]));
        }
      }
      return best;
    };
    return {
      slug: "maximum-fruits-harvested-after-at-most-k-steps",
      title: "Maximum Fruits Harvested After at Most K Steps",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Sliding Window", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "maxTotalFruits", params: [{ name: "fruits", type: "int[][]" as const }, { name: "startPos", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Fruit trees stand on an infinite number line. `fruits[i] = [position, amount]` says that `amount` fruits lie at `position`; the positions are **strictly increasing** and unique.\n\nYou start at `startPos` and may take **at most `k` steps**, each step moving one unit left or right. Whenever you stand on a position you collect all the fruit there (fruit is collected only once).\n\nReturn the maximum total number of fruits you can collect.",
        [
          { in: "fruits = [[1,4],[3,2],[7,5],[9,1]], startPos = 4, k = 5", out: "7", note: "Step left to 3 (1 step), then right to 7 (4 steps): 2 + 5 fruits." },
          { in: "fruits = [[0,5],[10,5]], startPos = 5, k = 5", out: "5", note: "Either tree is reachable, but not both." },
          { in: "fruits = [[2,6],[9,4]], startPos = 5, k = 2", out: "0", note: "Both trees are more than 2 steps away." },
        ],
        ["1 <= fruits.length <= 10^5", "fruits[i].length == 2", "0 <= startPos, position <= 2 * 10^5", "position values are strictly increasing", "1 <= amount <= 10^4", "0 <= k <= 2 * 10^5"]),
      hints: [
        "Whatever you do, the positions you visit form one contiguous interval `[L, R]` containing `startPos`. So the fruit you collect is a contiguous run of trees.",
        "Covering `[L, R]` from `s` takes `(R - L) + min(s - L, R - s)` steps when `L <= s <= R`: go to the nearer end first, then sweep to the other. The same formula works when both ends are on one side if you clamp `L` and `R` to include `s`.",
        "For a fixed right tree, moving the left tree right never increases the cost, so a sliding window over the trees works: grow on the right, shrink on the left while the cost exceeds `k`.",
      ],
      editorial: explain({
        idea: "The visited positions always form an interval around the start, and the cheapest way to cover a run of trees `l..r` is to reach the nearer end first and then sweep to the far end. That cost is monotone in both ends, so a sliding window over the sorted trees finds the best run.",
        steps: [
          "Define `cost(L, R) = (R - L) + min(|s - L|, |R - s|)` for tree positions `L <= R` — the fewest steps that visit both `L` and `R` starting from `s` (it also covers `L` and `R` on the same side of `s`).",
          "Keep a window of trees `[left, right]` and the sum of their fruit.",
          "For each `right`, add its fruit; then while `left <= right` and `cost(pos[left], pos[right]) > k`, remove tree `left` and advance `left`.",
          "Record the window's fruit total if it is the best so far.",
        ],
        why: "Any walk of at most `k` steps visits exactly the integer points of some interval `[L, R]` containing `s`; to visit both ends you must reach one end and then cross the whole interval, so the minimum is `(R - L) + min(s - L, R - s)`. When `L` and `R` are on the same side of `s`, the same expression reduces to the distance to the far end. For a fixed right end, raising the left end never raises the cost, and for a fixed left end raising the right end never lowers it — so the left pointer only moves forward and the window visits the best feasible run for every right end.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Going left first and going right first are both candidates — take the minimum, not just one of them.",
          "Trees entirely on one side of the start are still valid runs; make sure the cost formula handles them (it does with absolute values).",
          "If no tree is reachable the window empties and the answer stays 0.",
        ],
      }),
      examples: [
        { input: "[[1,4],[3,2],[7,5],[9,1]]\n4\n5", expectedOutput: "7" },
        { input: "[[0,5],[10,5]]\n5\n5", expectedOutput: "5" },
        { input: "[[2,6],[9,4]]\n5\n2", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const wide = rng() < 0.1;
        const P = wide ? 200000 : pick(rng, [8, 30, 120]);
        const n = Math.min(P + 1, rng() < 0.05 ? 1 : pick(rng, [ri(rng, 2, 6), ri(rng, 7, 15), ri(rng, 15, 30)]));
        const posSet = new Set<number>();
        while (posSet.size < n) posSet.add(ri(rng, 0, P));
        const positions = [...posSet].sort((a, b) => a - b);
        const amtMax = pick(rng, [1, 10, 10000]);
        const fruits = positions.map((p) => [p, ri(rng, 1, amtMax)]);
        const startPos = rng() < 0.3 ? positions[ri(rng, 0, n - 1)] : ri(rng, 0, P);
        const k = wide ? ri(rng, 0, 200000) : pick(rng, [0, ri(rng, 0, 5), ri(rng, 0, P), ri(rng, 0, 2 * P)]);
        return { input: `${fmtIntMat(fruits)}\n${startPos}\n${k}`, expectedOutput: String(ref(fruits, startPos, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxTotalFruits(fruits: List[List[int]], startPos: int, k: int) -> int:
              def cost(lo: int, hi: int) -> int:
                  return hi - lo + min(abs(startPos - lo), abs(hi - startPos))

              ans = 0
              total = 0
              left = 0
              for right in range(len(fruits)):
                  total += fruits[right][1]
                  while left <= right and cost(fruits[left][0], fruits[right][0]) > k:
                      total -= fruits[left][1]
                      left += 1
                  ans = max(ans, total)
              return ans
        `,
        javascript: code`
          var maxTotalFruits = function(fruits, startPos, k) {
              var cost = function(lo, hi) {
                  return hi - lo + Math.min(Math.abs(startPos - lo), Math.abs(hi - startPos));
              };
              var ans = 0, sum = 0, left = 0;
              for (var right = 0; right < fruits.length; right++) {
                  sum += fruits[right][1];
                  while (left <= right && cost(fruits[left][0], fruits[right][0]) > k) {
                      sum -= fruits[left][1];
                      left++;
                  }
                  if (sum > ans) ans = sum;
              }
              return ans;
          };
        `,
        typescript: code`
          function maxTotalFruits(fruits: number[][], startPos: number, k: number): number {
              var cost = function (lo: number, hi: number): number {
                  return hi - lo + Math.min(Math.abs(startPos - lo), Math.abs(hi - startPos));
              };
              var ans = 0, sum = 0, left = 0;
              for (var right = 0; right < fruits.length; right++) {
                  sum += fruits[right][1];
                  while (left <= right && cost(fruits[left][0], fruits[right][0]) > k) {
                      sum -= fruits[left][1];
                      left++;
                  }
                  if (sum > ans) ans = sum;
              }
              return ans;
          }
        `,
        java: code`
          public static int maxTotalFruits(int[][] fruits, int startPos, int k) {
              int ans = 0, sum = 0, left = 0;
              for (int right = 0; right < fruits.length; right++) {
                  sum += fruits[right][1];
                  while (left <= right) {
                      int lo = fruits[left][0], hi = fruits[right][0];
                      int cost = hi - lo + Math.min(Math.abs(startPos - lo), Math.abs(hi - startPos));
                      if (cost <= k) break;
                      sum -= fruits[left][1];
                      left++;
                  }
                  ans = Math.max(ans, sum);
              }
              return ans;
          }
        `,
        cpp: code`
          int maxTotalFruits(vector<vector<int>>& fruits, int startPos, int k) {
              int ans = 0, sum = 0, left = 0;
              for (int right = 0; right < (int) fruits.size(); right++) {
                  sum += fruits[right][1];
                  while (left <= right) {
                      int lo = fruits[left][0], hi = fruits[right][0];
                      int cost = hi - lo + min(abs(startPos - lo), abs(hi - startPos));
                      if (cost <= k) break;
                      sum -= fruits[left][1];
                      left++;
                  }
                  ans = max(ans, sum);
              }
              return ans;
          }
        `,
        c: code`
          int maxTotalFruits(int** fruits, int fruitsSize, int* fruitsColSize, int startPos, int k) {
              int ans = 0, sum = 0, left = 0;
              for (int right = 0; right < fruitsSize; right++) {
                  sum += fruits[right][1];
                  while (left <= right) {
                      int lo = fruits[left][0], hi = fruits[right][0];
                      int dl = startPos - lo, dr = hi - startPos;
                      if (dl < 0) dl = -dl;
                      if (dr < 0) dr = -dr;
                      int cost = hi - lo + (dl < dr ? dl : dr);
                      if (cost <= k) break;
                      sum -= fruits[left][1];
                      left++;
                  }
                  if (sum > ans) ans = sum;
              }
              return ans;
          }
        `,
        csharp: code`
          public static int MaxTotalFruits(int[][] fruits, int startPos, int k)
          {
              int ans = 0, sum = 0, left = 0;
              for (int right = 0; right < fruits.Length; right++)
              {
                  sum += fruits[right][1];
                  while (left <= right)
                  {
                      int lo = fruits[left][0], hi = fruits[right][0];
                      int cost = hi - lo + Math.Min(Math.Abs(startPos - lo), Math.Abs(hi - startPos));
                      if (cost <= k) break;
                      sum -= fruits[left][1];
                      left++;
                  }
                  ans = Math.Max(ans, sum);
              }
              return ans;
          }
        `,
        go: code`
          func abs2106(x int) int {
              if x < 0 {
                  return -x
              }
              return x
          }

          func maxTotalFruits(fruits [][]int, startPos int, k int) int {
              ans, sum, left := 0, 0, 0
              for right := 0; right < len(fruits); right++ {
                  sum += fruits[right][1]
                  for left <= right {
                      lo, hi := fruits[left][0], fruits[right][0]
                      d := abs2106(startPos - lo)
                      if e := abs2106(hi - startPos); e < d {
                          d = e
                      }
                      if hi-lo+d <= k {
                          break
                      }
                      sum -= fruits[left][1]
                      left++
                  }
                  if sum > ans {
                      ans = sum
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maxTotalFruits(fruits: Array<IntArray>, startPos: Int, k: Int): Int {
              var ans = 0
              var sum = 0
              var left = 0
              for (right in fruits.indices) {
                  sum += fruits[right][1]
                  while (left <= right) {
                      val lo = fruits[left][0]
                      val hi = fruits[right][0]
                      val cost = hi - lo + minOf(Math.abs(startPos - lo), Math.abs(hi - startPos))
                      if (cost <= k) break
                      sum -= fruits[left][1]
                      left++
                  }
                  if (sum > ans) ans = sum
              }
              return ans
          }
        `,
        swift: code`
          func maxTotalFruits(_ fruits: [[Int]], _ startPos: Int, _ k: Int) -> Int {
              var ans = 0, sum = 0, left = 0
              for right in 0..<fruits.count {
                  sum += fruits[right][1]
                  while left <= right {
                      let lo = fruits[left][0], hi = fruits[right][0]
                      let cost = hi - lo + min(abs(startPos - lo), abs(hi - startPos))
                      if cost <= k { break }
                      sum -= fruits[left][1]
                      left += 1
                  }
                  ans = max(ans, sum)
              }
              return ans
          }
        `,
        rust: code`
          fn maxTotalFruits(fruits: Vec<Vec<i32>>, startPos: i32, k: i32) -> i32 {
              let mut ans = 0i32;
              let mut sum = 0i32;
              let mut left = 0usize;
              for right in 0..fruits.len() {
                  sum += fruits[right][1];
                  while left <= right {
                      let lo = fruits[left][0];
                      let hi = fruits[right][0];
                      let cost = hi - lo + std::cmp::min((startPos - lo).abs(), (hi - startPos).abs());
                      if cost <= k {
                          break;
                      }
                      sum -= fruits[left][1];
                      left += 1;
                  }
                  if sum > ans {
                      ans = sum;
                  }
              }
              ans
          }
        `,
        php: code`
          function maxTotalFruits($fruits, $startPos, $k) {
              $ans = 0; $sum = 0; $left = 0;
              $n = count($fruits);
              for ($right = 0; $right < $n; $right++) {
                  $sum += $fruits[$right][1];
                  while ($left <= $right) {
                      $lo = $fruits[$left][0];
                      $hi = $fruits[$right][0];
                      $cost = $hi - $lo + min(abs($startPos - $lo), abs($hi - $startPos));
                      if ($cost <= $k) break;
                      $sum -= $fruits[$left][1];
                      $left++;
                  }
                  if ($sum > $ans) $ans = $sum;
              }
              return $ans;
          }
        `,
        ruby: code`
          def maxTotalFruits(fruits, startPos, k)
            ans = 0
            sum = 0
            left = 0
            fruits.each_with_index do |f, right|
              sum += f[1]
              while left <= right
                lo = fruits[left][0]
                hi = fruits[right][0]
                cost = hi - lo + [(startPos - lo).abs, (hi - startPos).abs].min
                break if cost <= k
                sum -= fruits[left][1]
                left += 1
              end
              ans = sum if sum > ans
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Shortest Subarray With OR at Least K II (LC 3097) ───────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let best = -1;
      for (let i = 0; i < nums.length; i++) {
        let or = 0;
        for (let j = i; j < nums.length; j++) {
          or |= nums[j];
          if (or >= k) {
            if (best === -1 || j - i + 1 < best) best = j - i + 1;
            break;
          }
        }
      }
      return best;
    };
    return {
      slug: "shortest-subarray-with-or-at-least-k-ii",
      title: "Shortest Subarray With OR at Least K II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Bit Manipulation", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "minimumSubarrayLength", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of **non-negative** integers and an integer `k`.\n\nA non-empty contiguous subarray is **special** when the bitwise OR of all its elements is at least `k`.\n\nReturn the length of the **shortest** special subarray, or `-1` if no subarray is special.",
        [
          { in: "nums = [1,4,2,8], k = 12", out: "3", note: "`[4,2,8]` has OR 14. No single element or pair reaches 12 (the best pair, `[2,8]`, gives 10)." },
          { in: "nums = [5,3], k = 8", out: "-1", note: "Even the whole array only reaches 5 | 3 = 7." },
          { in: "nums = [0,0,6], k = 0", out: "1", note: "With `k = 0` any single element works." },
        ],
        ["1 <= nums.length <= 2 * 10^5", "0 <= nums[i] <= 10^9", "0 <= k <= 10^9"]),
      hints: [
        "OR never decreases when a subarray grows. So if a window is special, every window containing it is special too.",
        "That monotonicity allows a sliding window: extend on the right, and while the window is special record its length and shrink from the left.",
        "OR cannot be \"undone\" when an element leaves. Keep, for each of the 30 bit positions, how many elements in the window have that bit set; the window's OR is the set of bits with a non-zero count.",
      ],
      editorial: explain({
        idea: "OR is monotone under extension, which makes the shortest special window findable with two pointers. Removing an element from an OR needs per-bit counters.",
        steps: [
          "Keep `cnt[b]` = number of window elements with bit `b` set, for `b = 0..30`, and `left = 0`.",
          "For each `right`, add `nums[right]`'s bits to `cnt`.",
          "While `left <= right` and the window's OR (bits with `cnt[b] > 0`) is at least `k`: record `right - left + 1`, subtract `nums[left]`'s bits, advance `left`.",
          "Return the smallest recorded length, or `-1` if none.",
        ],
        why: "For each right end, the loop shrinks the window to the shortest special window ending there (or stops at the first non-special one). Since a special window stays special when extended to the right, the shortest special window for the next right end cannot start before the current `left`, so `left` never needs to move back. The per-bit counters make the OR of the current window exact after every removal.",
        time: "O(30 · n)",
        space: "O(30)",
        pitfalls: [
          "Keeping a single running OR and \"subtracting\" with XOR or AND-NOT is wrong — another element may share the bit.",
          "`k = 0` means every non-empty subarray is special: the answer is 1.",
          "Values are below 2^30, so 30 or 31 bit counters suffice; rebuilding the OR from them is O(30) per step.",
        ],
      }),
      examples: [
        { input: "[1,4,2,8]\n12", expectedOutput: "3" },
        { input: "[5,3]\n8", expectedOutput: "-1" },
        { input: "[0,0,6]\n0", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 6), ri(rng, 7, 25), ri(rng, 25, 50)]);
        const bitsMax = pick(rng, [3, 6, 12, 30]);
        const sparse = rng() < 0.5;
        const nums = Array.from({ length: n }, () => {
          if (sparse) return rng() < 0.3 ? 0 : 1 << ri(rng, 0, bitsMax - 1);
          return Math.min(1000000000, ri(rng, 0, (1 << bitsMax) - 1));
        });
        let all = 0;
        for (const v of nums) all |= v;
        const k = rng() < 0.06 ? pick(rng, [0, 1000000000]) : rng() < 0.1 ? Math.min(1000000000, all + ri(rng, 1, 5)) : pick(rng, [all, Math.max(0, all - ri(rng, 0, Math.floor(all / 8))), ri(rng, 0, Math.min(1000000000, Math.max(all, 1)))]);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumSubarrayLength(nums: List[int], k: int) -> int:
              cnt = [0] * 31
              n = len(nums)
              best = n + 1
              left = 0

              def current() -> int:
                  v = 0
                  for b in range(31):
                      if cnt[b] > 0:
                          v |= 1 << b
                  return v

              for right in range(n):
                  x = nums[right]
                  for b in range(31):
                      if (x >> b) & 1:
                          cnt[b] += 1
                  while left <= right and current() >= k:
                      best = min(best, right - left + 1)
                      y = nums[left]
                      for b in range(31):
                          if (y >> b) & 1:
                              cnt[b] -= 1
                      left += 1
              return -1 if best > n else best
        `,
        javascript: code`
          var minimumSubarrayLength = function(nums, k) {
              var cnt = new Array(31).fill(0);
              var n = nums.length, best = n + 1, left = 0;
              var current = function() {
                  var v = 0;
                  for (var b = 0; b < 31; b++) if (cnt[b] > 0) v |= (1 << b);
                  return v;
              };
              for (var right = 0; right < n; right++) {
                  for (var b = 0; b < 31; b++) if ((nums[right] >> b) & 1) cnt[b]++;
                  while (left <= right && current() >= k) {
                      if (right - left + 1 < best) best = right - left + 1;
                      for (var c = 0; c < 31; c++) if ((nums[left] >> c) & 1) cnt[c]--;
                      left++;
                  }
              }
              return best > n ? -1 : best;
          };
        `,
        typescript: code`
          function minimumSubarrayLength(nums: number[], k: number): number {
              var cnt: number[] = [];
              for (var t = 0; t < 31; t++) cnt.push(0);
              var n = nums.length, best = n + 1, left = 0;
              var current = function (): number {
                  var v = 0;
                  for (var b = 0; b < 31; b++) if (cnt[b] > 0) v |= (1 << b);
                  return v;
              };
              for (var right = 0; right < n; right++) {
                  for (var b = 0; b < 31; b++) if ((nums[right] >> b) & 1) cnt[b]++;
                  while (left <= right && current() >= k) {
                      if (right - left + 1 < best) best = right - left + 1;
                      for (var c = 0; c < 31; c++) if ((nums[left] >> c) & 1) cnt[c]--;
                      left++;
                  }
              }
              return best > n ? -1 : best;
          }
        `,
        java: code`
          public static int minimumSubarrayLength(int[] nums, int k) {
              int[] cnt = new int[31];
              int n = nums.length, best = n + 1, left = 0;
              for (int right = 0; right < n; right++) {
                  for (int b = 0; b < 31; b++) if (((nums[right] >> b) & 1) == 1) cnt[b]++;
                  while (left <= right) {
                      int cur = 0;
                      for (int b = 0; b < 31; b++) if (cnt[b] > 0) cur |= 1 << b;
                      if (cur < k) break;
                      best = Math.min(best, right - left + 1);
                      for (int b = 0; b < 31; b++) if (((nums[left] >> b) & 1) == 1) cnt[b]--;
                      left++;
                  }
              }
              return best > n ? -1 : best;
          }
        `,
        cpp: code`
          int minimumSubarrayLength(vector<int>& nums, int k) {
              int cnt[31] = {0};
              int n = nums.size(), best = n + 1, left = 0;
              for (int right = 0; right < n; right++) {
                  for (int b = 0; b < 31; b++) if ((nums[right] >> b) & 1) cnt[b]++;
                  while (left <= right) {
                      int cur = 0;
                      for (int b = 0; b < 31; b++) if (cnt[b] > 0) cur |= 1 << b;
                      if (cur < k) break;
                      best = min(best, right - left + 1);
                      for (int b = 0; b < 31; b++) if ((nums[left] >> b) & 1) cnt[b]--;
                      left++;
                  }
              }
              return best > n ? -1 : best;
          }
        `,
        c: code`
          int minimumSubarrayLength(int* nums, int numsSize, int k) {
              int cnt[31] = {0};
              int n = numsSize, best = n + 1, left = 0;
              for (int right = 0; right < n; right++) {
                  for (int b = 0; b < 31; b++) if ((nums[right] >> b) & 1) cnt[b]++;
                  while (left <= right) {
                      int cur = 0;
                      for (int b = 0; b < 31; b++) if (cnt[b] > 0) cur |= 1 << b;
                      if (cur < k) break;
                      if (right - left + 1 < best) best = right - left + 1;
                      for (int b = 0; b < 31; b++) if ((nums[left] >> b) & 1) cnt[b]--;
                      left++;
                  }
              }
              return best > n ? -1 : best;
          }
        `,
        csharp: code`
          public static int MinimumSubarrayLength(int[] nums, int k)
          {
              int[] cnt = new int[31];
              int n = nums.Length, best = n + 1, left = 0;
              for (int right = 0; right < n; right++)
              {
                  for (int b = 0; b < 31; b++) if (((nums[right] >> b) & 1) == 1) cnt[b]++;
                  while (left <= right)
                  {
                      int cur = 0;
                      for (int b = 0; b < 31; b++) if (cnt[b] > 0) cur |= 1 << b;
                      if (cur < k) break;
                      best = Math.Min(best, right - left + 1);
                      for (int b = 0; b < 31; b++) if (((nums[left] >> b) & 1) == 1) cnt[b]--;
                      left++;
                  }
              }
              return best > n ? -1 : best;
          }
        `,
        go: code`
          func minimumSubarrayLength(nums []int, k int) int {
              cnt := make([]int, 31)
              n := len(nums)
              best, left := n+1, 0
              for right := 0; right < n; right++ {
                  for b := uint(0); b < 31; b++ {
                      if (nums[right]>>b)&1 == 1 {
                          cnt[b]++
                      }
                  }
                  for left <= right {
                      cur := 0
                      for b := uint(0); b < 31; b++ {
                          if cnt[b] > 0 {
                              cur |= 1 << b
                          }
                      }
                      if cur < k {
                          break
                      }
                      if right-left+1 < best {
                          best = right - left + 1
                      }
                      for b := uint(0); b < 31; b++ {
                          if (nums[left]>>b)&1 == 1 {
                              cnt[b]--
                          }
                      }
                      left++
                  }
              }
              if best > n {
                  return -1
              }
              return best
          }
        `,
        kotlin: code`
          fun minimumSubarrayLength(nums: IntArray, k: Int): Int {
              val cnt = IntArray(31)
              val n = nums.size
              var best = n + 1
              var left = 0
              for (right in 0 until n) {
                  for (b in 0 until 31) if (((nums[right] shr b) and 1) == 1) cnt[b]++
                  while (left <= right) {
                      var cur = 0
                      for (b in 0 until 31) if (cnt[b] > 0) cur = cur or (1 shl b)
                      if (cur < k) break
                      best = minOf(best, right - left + 1)
                      for (b in 0 until 31) if (((nums[left] shr b) and 1) == 1) cnt[b]--
                      left++
                  }
              }
              return if (best > n) -1 else best
          }
        `,
        swift: code`
          func minimumSubarrayLength(_ nums: [Int], _ k: Int) -> Int {
              var cnt = [Int](repeating: 0, count: 31)
              let n = nums.count
              var best = n + 1, left = 0
              for right in 0..<n {
                  for b in 0..<31 where (nums[right] >> b) & 1 == 1 { cnt[b] += 1 }
                  while left <= right {
                      var cur = 0
                      for b in 0..<31 where cnt[b] > 0 { cur |= 1 << b }
                      if cur < k { break }
                      best = min(best, right - left + 1)
                      for b in 0..<31 where (nums[left] >> b) & 1 == 1 { cnt[b] -= 1 }
                      left += 1
                  }
              }
              return best > n ? -1 : best
          }
        `,
        rust: code`
          fn minimumSubarrayLength(nums: Vec<i32>, k: i32) -> i32 {
              let mut cnt = [0i32; 31];
              let n = nums.len();
              let mut best = n + 1;
              let mut left = 0usize;
              for right in 0..n {
                  for b in 0..31 {
                      if (nums[right] >> b) & 1 == 1 {
                          cnt[b] += 1;
                      }
                  }
                  while left <= right {
                      let mut cur = 0i32;
                      for b in 0..31 {
                          if cnt[b] > 0 {
                              cur |= 1 << b;
                          }
                      }
                      if cur < k {
                          break;
                      }
                      if right + 1 - left < best {
                          best = right + 1 - left;
                      }
                      for b in 0..31 {
                          if (nums[left] >> b) & 1 == 1 {
                              cnt[b] -= 1;
                          }
                      }
                      left += 1;
                  }
              }
              if best > n { -1 } else { best as i32 }
          }
        `,
        php: code`
          function minimumSubarrayLength($nums, $k) {
              $cnt = array_fill(0, 31, 0);
              $n = count($nums);
              $best = $n + 1; $left = 0;
              for ($right = 0; $right < $n; $right++) {
                  for ($b = 0; $b < 31; $b++) if (($nums[$right] >> $b) & 1) $cnt[$b]++;
                  while ($left <= $right) {
                      $cur = 0;
                      for ($b = 0; $b < 31; $b++) if ($cnt[$b] > 0) $cur |= 1 << $b;
                      if ($cur < $k) break;
                      if ($right - $left + 1 < $best) $best = $right - $left + 1;
                      for ($b = 0; $b < 31; $b++) if (($nums[$left] >> $b) & 1) $cnt[$b]--;
                      $left++;
                  }
              }
              return $best > $n ? -1 : $best;
          }
        `,
        ruby: code`
          def minimumSubarrayLength(nums, k)
            cnt = Array.new(31, 0)
            n = nums.length
            best = n + 1
            left = 0
            (0...n).each do |right|
              x = nums[right]
              31.times { |b| cnt[b] += 1 if (x >> b) & 1 == 1 }
              while left <= right
                cur = 0
                31.times { |b| cur |= (1 << b) if cnt[b] > 0 }
                break if cur < k
                best = right - left + 1 if right - left + 1 < best
                y = nums[left]
                31.times { |b| cnt[b] -= 1 if (y >> b) & 1 == 1 }
                left += 1
              end
            end
            best > n ? -1 : best
          end
        `,
      },
    };
  })(),

  // ── Count Substrings That Can Be Rearranged to Contain a String I (LC 3297) ──
  (() => {
    const ref = (word1: string, word2: string) => {
      const need = new Array(26).fill(0);
      for (const ch of word2) need[ch.charCodeAt(0) - 97]++;
      let count = 0;
      for (let i = 0; i < word1.length; i++) {
        const have = new Array(26).fill(0);
        for (let j = i; j < word1.length; j++) {
          have[word1.charCodeAt(j) - 97]++;
          let ok = true;
          for (let c = 0; c < 26; c++) if (have[c] < need[c]) { ok = false; break; }
          if (ok) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-substrings-that-can-be-rearranged-to-contain-a-string-i",
      title: "Count Substrings That Can Be Rearranged to Contain a String I",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "validSubstringCount", params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given two strings `word1` and `word2` of lowercase English letters.\n\nA string `x` is **valid** if its letters can be rearranged so that `word2` is a **prefix** of the result — in other words, `x` contains every letter at least as many times as `word2` does.\n\nReturn the number of valid non-empty substrings of `word1`. Substrings at different positions count separately even if they are equal.\n\n*CodeKairo note:* the original allows `word1` up to 10^5 letters and returns a 64-bit count; here `word1.length <= 5 * 10^4`, so the answer fits in a 32-bit integer.",
        [
          { in: "word1 = \"codekairo\", word2 = \"ok\"", out: "13", note: "A valid substring must contain the `k` (index 4) and one of the two `o`s (index 1 or 8): 10 substrings start at index 0 or 1 and end at 4–8, and 3 more start at 2–4 and end at 8." },
          { in: "word1 = \"abab\", word2 = \"ab\"", out: "6", note: "All 10 substrings except the four single letters." },
          { in: "word1 = \"aab\", word2 = \"abb\"", out: "0", note: "`word1` has only one `b`." },
        ],
        ["1 <= word1.length <= 5 * 10^4", "1 <= word2.length <= 10^4", "word1 and word2 consist only of lowercase English letters."]),
      hints: [
        "Order does not matter: a substring is valid exactly when, for every letter, its count is at least that letter's count in `word2`.",
        "If a substring is valid, extending it to the right keeps it valid. So for each start there is a first end where it becomes valid, and every longer end works too.",
        "Slide a window with a counter of how many letters are still \"missing\". Whenever the window `[left, right]` is valid, all `n - right` substrings starting at `left` and ending at `right` or later are valid; count them and move `left` on.",
      ],
      editorial: explain({
        idea: "Validity only compares letter counts against `word2`'s, and it is monotone: supersets of a valid substring are valid. For each start, find the shortest valid end with a sliding window and count all its extensions at once.",
        steps: [
          "Fill `need[c]` with the letter counts of `word2` and set `missing = len(word2)` — the number of letters still owed.",
          "For each `right`, take `c = word1[right]`: if `need[c] > 0`, decrement `missing`; then decrement `need[c]` (it may go negative, meaning a surplus).",
          "While `missing == 0`: the window `[left, right]` is valid, so add `n - right`; then return `word1[left]` (increment its `need`, and if it becomes positive increment `missing`) and advance `left`.",
          "Return the total.",
        ],
        why: "`missing` is exactly how many letters of `word2` the window still lacks, counted with multiplicity, so the window is valid precisely when it is 0. For each start `left`, the first `right` at which the window becomes valid is found by this loop, and because extensions stay valid, the substrings `[left, right..n-1]` are exactly the valid ones starting at `left` — `n - right` of them. Both pointers only move forward.",
        time: "O(n + m)",
        space: "O(26)",
        pitfalls: [
          "Count every valid end for a start, not just the shortest one.",
          "The answer is quadratic in `n` in the worst case — use a 64-bit accumulator in fixed-width languages.",
          "When `word2` is longer than `word1`, nothing is valid; the window never reaches `missing == 0`.",
        ],
      }),
      examples: [
        { input: "\"codekairo\"\n\"ok\"", expectedOutput: "13" },
        { input: "\"abab\"\n\"ab\"", expectedOutput: "6" },
        { input: "\"aab\"\n\"abb\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "aabbc", "abcdefghijklmnopqrstuvwxyz"]);
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 25), ri(rng, 25, 45)]);
        const word1 = randLower(rng, n, n, alpha);
        let word2: string;
        if (rng() < 0.6) {
          // draw word2 from word1's letters so a match is likely
          const len = ri(rng, 1, Math.min(6, n));
          const chars = shuffle(rng, word1.split("")).slice(0, len);
          word2 = chars.join("");
        } else {
          word2 = randLower(rng, 1, pick(rng, [2, 4, 8]), alpha);
        }
        return { input: `"${word1}"\n"${word2}"`, expectedOutput: String(ref(word1, word2)) };
      },
      solutions: {
        python: code`
          def validSubstringCount(word1: str, word2: str) -> int:
              need = [0] * 26
              for ch in word2:
                  need[ord(ch) - 97] += 1
              missing = len(word2)
              n = len(word1)
              left = 0
              ans = 0
              for right in range(n):
                  c = ord(word1[right]) - 97
                  if need[c] > 0:
                      missing -= 1
                  need[c] -= 1
                  while missing == 0:
                      ans += n - right
                      d = ord(word1[left]) - 97
                      need[d] += 1
                      if need[d] > 0:
                          missing += 1
                      left += 1
              return ans
        `,
        javascript: code`
          var validSubstringCount = function(word1, word2) {
              var need = new Array(26).fill(0);
              for (var i = 0; i < word2.length; i++) need[word2.charCodeAt(i) - 97]++;
              var missing = word2.length, n = word1.length, left = 0, ans = 0;
              for (var right = 0; right < n; right++) {
                  var c = word1.charCodeAt(right) - 97;
                  if (need[c] > 0) missing--;
                  need[c]--;
                  while (missing === 0) {
                      ans += n - right;
                      var d = word1.charCodeAt(left) - 97;
                      need[d]++;
                      if (need[d] > 0) missing++;
                      left++;
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function validSubstringCount(word1: string, word2: string): number {
              var need: number[] = [];
              for (var t = 0; t < 26; t++) need.push(0);
              for (var i = 0; i < word2.length; i++) need[word2.charCodeAt(i) - 97]++;
              var missing = word2.length, n = word1.length, left = 0, ans = 0;
              for (var right = 0; right < n; right++) {
                  var c = word1.charCodeAt(right) - 97;
                  if (need[c] > 0) missing--;
                  need[c]--;
                  while (missing === 0) {
                      ans += n - right;
                      var d = word1.charCodeAt(left) - 97;
                      need[d]++;
                      if (need[d] > 0) missing++;
                      left++;
                  }
              }
              return ans;
          }
        `,
        java: code`
          public static int validSubstringCount(String word1, String word2) {
              int[] need = new int[26];
              for (int i = 0; i < word2.length(); i++) need[word2.charAt(i) - 'a']++;
              int missing = word2.length(), n = word1.length(), left = 0;
              long ans = 0;
              for (int right = 0; right < n; right++) {
                  int c = word1.charAt(right) - 'a';
                  if (need[c] > 0) missing--;
                  need[c]--;
                  while (missing == 0) {
                      ans += n - right;
                      int d = word1.charAt(left) - 'a';
                      need[d]++;
                      if (need[d] > 0) missing++;
                      left++;
                  }
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int validSubstringCount(string word1, string word2) {
              int need[26] = {0};
              for (char ch : word2) need[ch - 'a']++;
              int missing = word2.size(), n = word1.size(), left = 0;
              long long ans = 0;
              for (int right = 0; right < n; right++) {
                  int c = word1[right] - 'a';
                  if (need[c] > 0) missing--;
                  need[c]--;
                  while (missing == 0) {
                      ans += n - right;
                      int d = word1[left] - 'a';
                      need[d]++;
                      if (need[d] > 0) missing++;
                      left++;
                  }
              }
              return (int) ans;
          }
        `,
        c: code`
          int validSubstringCount(const char* word1, const char* word2) {
              int need[26] = {0};
              int m = 0;
              while (word2[m]) { need[word2[m] - 'a']++; m++; }
              int n = 0;
              while (word1[n]) n++;
              int missing = m, left = 0;
              long long ans = 0;
              for (int right = 0; right < n; right++) {
                  int c = word1[right] - 'a';
                  if (need[c] > 0) missing--;
                  need[c]--;
                  while (missing == 0) {
                      ans += n - right;
                      int d = word1[left] - 'a';
                      need[d]++;
                      if (need[d] > 0) missing++;
                      left++;
                  }
              }
              return (int) ans;
          }
        `,
        csharp: code`
          public static int ValidSubstringCount(string word1, string word2)
          {
              int[] need = new int[26];
              foreach (char ch in word2) need[ch - 'a']++;
              int missing = word2.Length, n = word1.Length, left = 0;
              long ans = 0;
              for (int right = 0; right < n; right++)
              {
                  int c = word1[right] - 'a';
                  if (need[c] > 0) missing--;
                  need[c]--;
                  while (missing == 0)
                  {
                      ans += n - right;
                      int d = word1[left] - 'a';
                      need[d]++;
                      if (need[d] > 0) missing++;
                      left++;
                  }
              }
              return (int) ans;
          }
        `,
        go: code`
          func validSubstringCount(word1 string, word2 string) int {
              need := make([]int, 26)
              for i := 0; i < len(word2); i++ {
                  need[word2[i]-'a']++
              }
              missing, n, left, ans := len(word2), len(word1), 0, 0
              for right := 0; right < n; right++ {
                  c := int(word1[right] - 'a')
                  if need[c] > 0 {
                      missing--
                  }
                  need[c]--
                  for missing == 0 {
                      ans += n - right
                      d := int(word1[left] - 'a')
                      need[d]++
                      if need[d] > 0 {
                          missing++
                      }
                      left++
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun validSubstringCount(word1: String, word2: String): Int {
              val need = IntArray(26)
              for (ch in word2) need[ch - 'a']++
              var missing = word2.length
              val n = word1.length
              var left = 0
              var ans = 0L
              for (right in 0 until n) {
                  val c = word1[right] - 'a'
                  if (need[c] > 0) missing--
                  need[c]--
                  while (missing == 0) {
                      ans += (n - right).toLong()
                      val d = word1[left] - 'a'
                      need[d]++
                      if (need[d] > 0) missing++
                      left++
                  }
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func validSubstringCount(_ word1: String, _ word2: String) -> Int {
              let a = Array(word1.utf8).map { Int($0) - 97 }
              var need = [Int](repeating: 0, count: 26)
              for ch in word2.utf8 { need[Int(ch) - 97] += 1 }
              var missing = word2.utf8.count
              let n = a.count
              var left = 0, ans = 0
              for right in 0..<n {
                  let c = a[right]
                  if need[c] > 0 { missing -= 1 }
                  need[c] -= 1
                  while missing == 0 {
                      ans += n - right
                      let d = a[left]
                      need[d] += 1
                      if need[d] > 0 { missing += 1 }
                      left += 1
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn validSubstringCount(word1: String, word2: String) -> i32 {
              let a = word1.as_bytes();
              let mut need = [0i32; 26];
              for &ch in word2.as_bytes() {
                  need[(ch - b'a') as usize] += 1;
              }
              let mut missing = word2.len() as i32;
              let n = a.len();
              let mut left = 0usize;
              let mut ans: i64 = 0;
              for right in 0..n {
                  let c = (a[right] - b'a') as usize;
                  if need[c] > 0 {
                      missing -= 1;
                  }
                  need[c] -= 1;
                  while missing == 0 {
                      ans += (n - right) as i64;
                      let d = (a[left] - b'a') as usize;
                      need[d] += 1;
                      if need[d] > 0 {
                          missing += 1;
                      }
                      left += 1;
                  }
              }
              ans as i32
          }
        `,
        php: code`
          function validSubstringCount($word1, $word2) {
              $need = array_fill(0, 26, 0);
              $m = strlen($word2);
              for ($i = 0; $i < $m; $i++) $need[ord($word2[$i]) - 97]++;
              $missing = $m;
              $n = strlen($word1);
              $left = 0; $ans = 0;
              for ($right = 0; $right < $n; $right++) {
                  $c = ord($word1[$right]) - 97;
                  if ($need[$c] > 0) $missing--;
                  $need[$c]--;
                  while ($missing == 0) {
                      $ans += $n - $right;
                      $d = ord($word1[$left]) - 97;
                      $need[$d]++;
                      if ($need[$d] > 0) $missing++;
                      $left++;
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def validSubstringCount(word1, word2)
            a = word1.bytes.map { |b| b - 97 }
            need = Array.new(26, 0)
            word2.each_byte { |b| need[b - 97] += 1 }
            missing = word2.length
            n = a.length
            left = 0
            ans = 0
            (0...n).each do |right|
              c = a[right]
              missing -= 1 if need[c] > 0
              need[c] -= 1
              while missing == 0
                ans += n - right
                d = a[left]
                need[d] += 1
                missing += 1 if need[d] > 0
                left += 1
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Count of Substrings Containing Every Vowel and K Consonants I (LC 3305) ──
  (() => {
    const VOWELS = "aeiou";
    const ref = (word: string, k: number) => {
      let count = 0;
      for (let i = 0; i < word.length; i++) {
        const seen = new Set<string>();
        let cons = 0;
        for (let j = i; j < word.length; j++) {
          if (VOWELS.indexOf(word[j]) >= 0) seen.add(word[j]); else cons++;
          if (cons > k) break;
          if (seen.size === 5 && cons === k) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-of-substrings-containing-every-vowel-and-k-consonants-i",
      title: "Count of Substrings Containing Every Vowel and K Consonants I",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "countOfSubstrings", params: [{ name: "word", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `word` of lowercase English letters and a non-negative integer `k`.\n\nReturn the number of substrings of `word` that contain **every** vowel (`a`, `e`, `i`, `o` and `u`) **at least once** and **exactly `k`** consonants. Substrings at different positions count separately.",
        [
          { in: "word = \"uoieax\", k = 1", out: "1", note: "Only the whole word has all five vowels and one consonant; `\"uoiea\"` has all vowels but no consonant." },
          { in: "word = \"aeiouaeiou\", k = 0", out: "21", note: "Every window of length 5 or more holds all five vowels and no consonant: 6 + 5 + 4 + 3 + 2 + 1." },
          { in: "word = \"aeixou\", k = 0", out: "0", note: "Any substring with all five vowels must include the `x`." },
        ],
        ["5 <= word.length <= 250", "word consists only of lowercase English letters.", "0 <= k <= word.length - 5"]),
      hints: [
        "\"Exactly `k` consonants\" is awkward for a sliding window, but \"at least `m` consonants\" is monotone: extending a qualifying substring keeps it qualifying.",
        "So count `atLeast(k) - atLeast(k + 1)`, where `atLeast(m)` counts substrings with all five vowels and at least `m` consonants.",
        "For `atLeast(m)`: slide `right`; while the window has all five vowels and at least `m` consonants, drop `word[left]` and advance `left`. Then every start before `left` works for this `right` — add `left`.",
      ],
      editorial: explain({
        idea: "Turn the exact count into a difference of two monotone counts. \"All vowels and at least `m` consonants\" survives extension, so for each right end the valid starts are a prefix, which a sliding window measures.",
        steps: [
          "Define `atLeast(m)`: keep vowel counts, the number of distinct vowels present, a consonant count, `left = 0` and a total.",
          "For each `right`, add `word[right]` (a vowel's count, or one more consonant).",
          "While the window has all five vowels and at least `m` consonants, remove `word[left]` and advance `left`.",
          "Add `left` to the total: the starts `0 .. left-1` all give valid substrings ending at `right`.",
          "Answer `atLeast(k) - atLeast(k + 1)`.",
        ],
        why: "A substring with exactly `k` consonants and all vowels is counted by `atLeast(k)` but not by `atLeast(k + 1)`, and every substring with more consonants is counted by both — so the difference is exactly the requested count. Inside `atLeast(m)`, the shrink loop stops at the first start that fails; every earlier start gives a superset of a valid window and is valid, and since extending to the right keeps validity, `left` never moves back.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A plain window for \"exactly `k`\" is not monotone: adding a vowel never changes the consonant count, so the valid starts for one end are not a contiguous prefix.",
          "Track **distinct** vowels: `\"aaaaa\"` has five vowels but only one distinct one.",
          "With `n <= 250` an O(n²) scan with early break is also fine; the sliding-window version is what the larger variant (n up to 2·10^5) needs.",
        ],
      }),
      examples: [
        { input: "\"uoieax\"\n1", expectedOutput: "1" },
        { input: "\"aeiouaeiou\"\n0", expectedOutput: "21" },
        { input: "\"aeixou\"\n0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 5, 10), ri(rng, 10, 25), ri(rng, 25, 50), ri(rng, 25, 50)]);
        const consonants = pick(rng, ["x", "bc", "qzt", "bcdfghjklmnpqrstvwxyz"]);
        const vowelP = pick(rng, [0.6, 0.75, 0.9, 1]);
        const chars: string[] = [];
        for (let i = 0; i < n; i++) {
          chars.push(rng() < vowelP ? VOWELS[ri(rng, 0, 4)] : consonants[ri(rng, 0, consonants.length - 1)]);
        }
        // usually plant every vowel close together so qualifying windows exist
        const plants = rng() < 0.75 ? ri(rng, 1, 2) : 0;
        for (let t = 0; t < plants; t++) {
          const block = shuffle(rng, VOWELS.split(""));
          const spread = ri(rng, 5, Math.min(n, 9));
          const at = ri(rng, 0, n - spread);
          const slots = shuffle(rng, Array.from({ length: spread }, (_, i) => at + i)).slice(0, 5);
          for (let v = 0; v < 5; v++) chars[slots[v]] = block[v];
        }
        const word = chars.join("");
        let consTotal = 0;
        for (const ch of word) if (VOWELS.indexOf(ch) < 0) consTotal++;
        const k = Math.min(n - 5, rng() < 0.3 ? 0 : ri(rng, 0, Math.max(0, Math.min(consTotal, pick(rng, [1, 2, 4, 10])))));
        return { input: `"${word}"\n${k}`, expectedOutput: String(ref(word, k)) };
      },
      solutions: {
        python: code`
          def countOfSubstrings(word: str, k: int) -> int:
              def at_least(m: int) -> int:
                  cnt = {}
                  cons = 0
                  left = 0
                  total = 0
                  for ch in word:
                      if ch in "aeiou":
                          cnt[ch] = cnt.get(ch, 0) + 1
                      else:
                          cons += 1
                      while len(cnt) == 5 and cons >= m:
                          d = word[left]
                          if d in "aeiou":
                              cnt[d] -= 1
                              if cnt[d] == 0:
                                  del cnt[d]
                          else:
                              cons -= 1
                          left += 1
                      total += left
                  return total

              return at_least(k) - at_least(k + 1)
        `,
        javascript: code`
          var countOfSubstrings = function(word, k) {
              var isVowel = function(c) {
                  return c === "a" || c === "e" || c === "i" || c === "o" || c === "u";
              };
              var atLeast = function(m) {
                  var cnt = { a: 0, e: 0, i: 0, o: 0, u: 0 };
                  var distinct = 0, cons = 0, left = 0, total = 0;
                  for (var right = 0; right < word.length; right++) {
                      var c = word[right];
                      if (isVowel(c)) { if (cnt[c]++ === 0) distinct++; } else cons++;
                      while (distinct === 5 && cons >= m) {
                          var d = word[left];
                          if (isVowel(d)) { if (--cnt[d] === 0) distinct--; } else cons--;
                          left++;
                      }
                      total += left;
                  }
                  return total;
              };
              return atLeast(k) - atLeast(k + 1);
          };
        `,
        typescript: code`
          function countOfSubstrings(word: string, k: number): number {
              var isVowel = function (c: string): boolean {
                  return c === "a" || c === "e" || c === "i" || c === "o" || c === "u";
              };
              var atLeast = function (m: number): number {
                  var cnt: { [key: string]: number } = { a: 0, e: 0, i: 0, o: 0, u: 0 };
                  var distinct = 0, cons = 0, left = 0, total = 0;
                  for (var right = 0; right < word.length; right++) {
                      var c = word.charAt(right);
                      if (isVowel(c)) { if (cnt[c]++ === 0) distinct++; } else cons++;
                      while (distinct === 5 && cons >= m) {
                          var d = word.charAt(left);
                          if (isVowel(d)) { if (--cnt[d] === 0) distinct--; } else cons--;
                          left++;
                      }
                      total += left;
                  }
                  return total;
              };
              return atLeast(k) - atLeast(k + 1);
          }
        `,
        java: code`
          static boolean isVowel3305(char c) {
              return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
          }

          static int atLeast3305(String word, int m) {
              int[] cnt = new int[26];
              int distinct = 0, cons = 0, left = 0, total = 0;
              for (int right = 0; right < word.length(); right++) {
                  char c = word.charAt(right);
                  if (isVowel3305(c)) { if (cnt[c - 'a']++ == 0) distinct++; } else cons++;
                  while (distinct == 5 && cons >= m) {
                      char d = word.charAt(left);
                      if (isVowel3305(d)) { if (--cnt[d - 'a'] == 0) distinct--; } else cons--;
                      left++;
                  }
                  total += left;
              }
              return total;
          }

          public static int countOfSubstrings(String word, int k) {
              return atLeast3305(word, k) - atLeast3305(word, k + 1);
          }
        `,
        cpp: code`
          bool isVowel3305(char c) {
              return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
          }

          int atLeast3305(const string& word, int m) {
              int cnt[26] = {0};
              int distinct = 0, cons = 0, left = 0, total = 0;
              for (int right = 0; right < (int) word.size(); right++) {
                  char c = word[right];
                  if (isVowel3305(c)) { if (cnt[c - 'a']++ == 0) distinct++; } else cons++;
                  while (distinct == 5 && cons >= m) {
                      char d = word[left];
                      if (isVowel3305(d)) { if (--cnt[d - 'a'] == 0) distinct--; } else cons--;
                      left++;
                  }
                  total += left;
              }
              return total;
          }

          int countOfSubstrings(string word, int k) {
              return atLeast3305(word, k) - atLeast3305(word, k + 1);
          }
        `,
        c: code`
          static int isVowel3305(char c) {
              return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
          }

          static int atLeast3305(const char* word, int n, int m) {
              int cnt[26] = {0};
              int distinct = 0, cons = 0, left = 0, total = 0;
              for (int right = 0; right < n; right++) {
                  char c = word[right];
                  if (isVowel3305(c)) { if (cnt[c - 'a']++ == 0) distinct++; } else cons++;
                  while (distinct == 5 && cons >= m) {
                      char d = word[left];
                      if (isVowel3305(d)) { if (--cnt[d - 'a'] == 0) distinct--; } else cons--;
                      left++;
                  }
                  total += left;
              }
              return total;
          }

          int countOfSubstrings(const char* word, int k) {
              int n = 0;
              while (word[n]) n++;
              return atLeast3305(word, n, k) - atLeast3305(word, n, k + 1);
          }
        `,
        csharp: code`
          static bool IsVowel3305(char c)
          {
              return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
          }

          static int AtLeast3305(string word, int m)
          {
              int[] cnt = new int[26];
              int distinct = 0, cons = 0, left = 0, total = 0;
              for (int right = 0; right < word.Length; right++)
              {
                  char c = word[right];
                  if (IsVowel3305(c)) { if (cnt[c - 'a']++ == 0) distinct++; } else cons++;
                  while (distinct == 5 && cons >= m)
                  {
                      char d = word[left];
                      if (IsVowel3305(d)) { if (--cnt[d - 'a'] == 0) distinct--; } else cons--;
                      left++;
                  }
                  total += left;
              }
              return total;
          }

          public static int CountOfSubstrings(string word, int k)
          {
              return AtLeast3305(word, k) - AtLeast3305(word, k + 1);
          }
        `,
        go: code`
          func isVowel3305(c byte) bool {
              return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'
          }

          func atLeast3305(word string, m int) int {
              cnt := make([]int, 26)
              distinct, cons, left, total := 0, 0, 0, 0
              for right := 0; right < len(word); right++ {
                  c := word[right]
                  if isVowel3305(c) {
                      if cnt[c-'a'] == 0 {
                          distinct++
                      }
                      cnt[c-'a']++
                  } else {
                      cons++
                  }
                  for distinct == 5 && cons >= m {
                      d := word[left]
                      if isVowel3305(d) {
                          cnt[d-'a']--
                          if cnt[d-'a'] == 0 {
                              distinct--
                          }
                      } else {
                          cons--
                      }
                      left++
                  }
                  total += left
              }
              return total
          }

          func countOfSubstrings(word string, k int) int {
              return atLeast3305(word, k) - atLeast3305(word, k+1)
          }
        `,
        kotlin: code`
          fun isVowel3305(c: Char): Boolean = c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'

          fun atLeast3305(word: String, m: Int): Int {
              val cnt = IntArray(26)
              var distinct = 0
              var cons = 0
              var left = 0
              var total = 0
              for (right in word.indices) {
                  val c = word[right]
                  if (isVowel3305(c)) {
                      if (cnt[c - 'a'] == 0) distinct++
                      cnt[c - 'a']++
                  } else {
                      cons++
                  }
                  while (distinct == 5 && cons >= m) {
                      val d = word[left]
                      if (isVowel3305(d)) {
                          cnt[d - 'a']--
                          if (cnt[d - 'a'] == 0) distinct--
                      } else {
                          cons--
                      }
                      left++
                  }
                  total += left
              }
              return total
          }

          fun countOfSubstrings(word: String, k: Int): Int {
              return atLeast3305(word, k) - atLeast3305(word, k + 1)
          }
        `,
        swift: code`
          func atLeast3305(_ w: [Int], _ isV: [Bool], _ m: Int) -> Int {
              var cnt = [Int](repeating: 0, count: 26)
              var distinct = 0, cons = 0, left = 0, total = 0
              for right in 0..<w.count {
                  let c = w[right]
                  if isV[c] {
                      if cnt[c] == 0 { distinct += 1 }
                      cnt[c] += 1
                  } else {
                      cons += 1
                  }
                  while distinct == 5 && cons >= m {
                      let d = w[left]
                      if isV[d] {
                          cnt[d] -= 1
                          if cnt[d] == 0 { distinct -= 1 }
                      } else {
                          cons -= 1
                      }
                      left += 1
                  }
                  total += left
              }
              return total
          }

          func countOfSubstrings(_ word: String, _ k: Int) -> Int {
              let w = Array(word.utf8).map { Int($0) - 97 }
              var isV = [Bool](repeating: false, count: 26)
              for v in [0, 4, 8, 14, 20] { isV[v] = true }
              return atLeast3305(w, isV, k) - atLeast3305(w, isV, k + 1)
          }
        `,
        rust: code`
          fn at_least_3305(w: &[u8], m: i32) -> i32 {
              let mut cnt = [0i32; 26];
              let mut distinct = 0;
              let mut cons = 0i32;
              let mut left = 0usize;
              let mut total = 0i32;
              let is_vowel = |c: u8| c == b'a' || c == b'e' || c == b'i' || c == b'o' || c == b'u';
              for right in 0..w.len() {
                  let c = w[right];
                  if is_vowel(c) {
                      if cnt[(c - b'a') as usize] == 0 {
                          distinct += 1;
                      }
                      cnt[(c - b'a') as usize] += 1;
                  } else {
                      cons += 1;
                  }
                  while distinct == 5 && cons >= m {
                      let d = w[left];
                      if is_vowel(d) {
                          cnt[(d - b'a') as usize] -= 1;
                          if cnt[(d - b'a') as usize] == 0 {
                              distinct -= 1;
                          }
                      } else {
                          cons -= 1;
                      }
                      left += 1;
                  }
                  total += left as i32;
              }
              total
          }

          fn countOfSubstrings(word: String, k: i32) -> i32 {
              let w = word.as_bytes();
              at_least_3305(w, k) - at_least_3305(w, k + 1)
          }
        `,
        php: code`
          function atLeast3305($word, $m) {
              $cnt = [];
              $cons = 0; $left = 0; $total = 0;
              $n = strlen($word);
              for ($right = 0; $right < $n; $right++) {
                  $c = $word[$right];
                  if (strpos("aeiou", $c) !== false) {
                      $cnt[$c] = (isset($cnt[$c]) ? $cnt[$c] : 0) + 1;
                  } else {
                      $cons++;
                  }
                  while (count($cnt) == 5 && $cons >= $m) {
                      $d = $word[$left];
                      if (strpos("aeiou", $d) !== false) {
                          $cnt[$d]--;
                          if ($cnt[$d] == 0) unset($cnt[$d]);
                      } else {
                          $cons--;
                      }
                      $left++;
                  }
                  $total += $left;
              }
              return $total;
          }

          function countOfSubstrings($word, $k) {
              return atLeast3305($word, $k) - atLeast3305($word, $k + 1);
          }
        `,
        ruby: code`
          def at_least_3305(word, m)
            cnt = Hash.new(0)
            cons = 0
            left = 0
            total = 0
            word.each_char do |c|
              if "aeiou".include?(c)
                cnt[c] += 1
              else
                cons += 1
              end
              while cnt.size == 5 && cons >= m
                d = word[left]
                if "aeiou".include?(d)
                  cnt[d] -= 1
                  cnt.delete(d) if cnt[d] == 0
                else
                  cons -= 1
                end
                left += 1
              end
              total += left
            end
            total
          end

          def countOfSubstrings(word, k)
            at_least_3305(word, k) - at_least_3305(word, k + 1)
          end
        `,
      },
    };
  })(),

  // ── Count Substrings With K-Frequency Characters I (LC 3325) ────
  (() => {
    const ref = (s: string, k: number) => {
      let count = 0;
      for (let i = 0; i < s.length; i++) {
        const cnt = new Array(26).fill(0);
        let hit = false;
        for (let j = i; j < s.length; j++) {
          const c = s.charCodeAt(j) - 97;
          cnt[c]++;
          if (cnt[c] >= k) hit = true;
          if (hit) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-substrings-with-k-frequency-characters-i",
      title: "Count Substrings With K-Frequency Characters I",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "numberOfSubstrings", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` of lowercase English letters and an integer `k`, return the number of substrings of `s` in which **at least one** character appears **at least `k` times**.\n\nSubstrings at different positions count separately even when their text is equal.",
        [
          { in: "s = \"aabab\", k = 2", out: "7", note: "`\"aa\"`, `\"aab\"`, `\"aaba\"`, `\"aabab\"`, `\"aba\"`, `\"abab\"` and `\"bab\"`." },
          { in: "s = \"codekairo\", k = 1", out: "45", note: "With `k = 1` every one of the 45 substrings qualifies." },
          { in: "s = \"abcabc\", k = 3", out: "0", note: "No letter occurs three times." },
        ],
        ["1 <= s.length <= 3000", "1 <= k <= s.length", "s consists only of lowercase English letters."]),
      hints: [
        "If a substring qualifies, extending it on either side keeps it qualifying.",
        "For each end `right`, the qualifying substrings ending there are exactly those starting before some position `left` — find that boundary.",
        "Slide a window that never qualifies: after adding `s[right]`, only that letter can have reached `k`, so remove letters from the left while its count is at least `k`. Then the starts `0 .. left-1` all qualify; add `left`.",
      ],
      editorial: explain({
        idea: "Keep the window `[left, right]` as the longest window ending at `right` in which every letter appears fewer than `k` times. Every start to the left of it gives a qualifying substring.",
        steps: [
          "Keep letter counts for the window, `left = 0` and `ans = 0`.",
          "For each `right`, increment the count of `c = s[right]`.",
          "While `count[c] >= k`, decrement the count of `s[left]` and advance `left`.",
          "Add `left` to `ans`: the substrings `s[0..right]`, …, `s[left-1..right]` all contain some letter `k` times.",
        ],
        why: "Before `s[right]` is added the window has all counts below `k`, so after adding it only `c` can reach `k`; shrinking until `c` drops below `k` restores the invariant with the smallest possible movement. At that moment `s[left-1..right]` had `c` exactly `k` times, so it — and every substring starting further left — qualifies, while `s[left..right]` does not. Since qualifying is preserved by extension, `left` never moves back, giving O(n) total.",
        time: "O(n)",
        space: "O(26)",
        pitfalls: [
          "Add `left`, not `right - left + 1`: the window itself is the non-qualifying part.",
          "Only the newly added letter can cross the threshold, so the shrink loop checks that one letter, not all 26.",
          "With `k = 1` every substring qualifies — the answer is `n(n+1)/2`.",
        ],
      }),
      examples: [
        { input: "\"aabab\"\n2", expectedOutput: "7" },
        { input: "\"codekairo\"\n1", expectedOutput: "45" },
        { input: "\"abcabc\"\n3", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcde", "abcdefghijklmnopqrstuvwxyz"]);
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 30), ri(rng, 30, 60)]);
        const s = randLower(rng, n, n, alpha);
        const k = rng() < 0.1 ? 1 : Math.min(n, pick(rng, [2, 3, ri(rng, 1, 5), ri(rng, 1, n)]));
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: code`
          def numberOfSubstrings(s: str, k: int) -> int:
              cnt = [0] * 26
              left = 0
              ans = 0
              for ch in s:
                  c = ord(ch) - 97
                  cnt[c] += 1
                  while cnt[c] >= k:
                      cnt[ord(s[left]) - 97] -= 1
                      left += 1
                  ans += left
              return ans
        `,
        javascript: code`
          var numberOfSubstrings = function(s, k) {
              var cnt = new Array(26).fill(0);
              var left = 0, ans = 0;
              for (var right = 0; right < s.length; right++) {
                  var c = s.charCodeAt(right) - 97;
                  cnt[c]++;
                  while (cnt[c] >= k) {
                      cnt[s.charCodeAt(left) - 97]--;
                      left++;
                  }
                  ans += left;
              }
              return ans;
          };
        `,
        typescript: code`
          function numberOfSubstrings(s: string, k: number): number {
              var cnt: number[] = [];
              for (var t = 0; t < 26; t++) cnt.push(0);
              var left = 0, ans = 0;
              for (var right = 0; right < s.length; right++) {
                  var c = s.charCodeAt(right) - 97;
                  cnt[c]++;
                  while (cnt[c] >= k) {
                      cnt[s.charCodeAt(left) - 97]--;
                      left++;
                  }
                  ans += left;
              }
              return ans;
          }
        `,
        java: code`
          public static int numberOfSubstrings(String s, int k) {
              int[] cnt = new int[26];
              int left = 0, ans = 0;
              for (int right = 0; right < s.length(); right++) {
                  int c = s.charAt(right) - 'a';
                  cnt[c]++;
                  while (cnt[c] >= k) {
                      cnt[s.charAt(left) - 'a']--;
                      left++;
                  }
                  ans += left;
              }
              return ans;
          }
        `,
        cpp: code`
          int numberOfSubstrings(string s, int k) {
              int cnt[26] = {0};
              int left = 0, ans = 0;
              for (int right = 0; right < (int) s.size(); right++) {
                  int c = s[right] - 'a';
                  cnt[c]++;
                  while (cnt[c] >= k) {
                      cnt[s[left] - 'a']--;
                      left++;
                  }
                  ans += left;
              }
              return ans;
          }
        `,
        c: code`
          int numberOfSubstrings(const char* s, int k) {
              int cnt[26] = {0};
              int left = 0, ans = 0;
              for (int right = 0; s[right]; right++) {
                  int c = s[right] - 'a';
                  cnt[c]++;
                  while (cnt[c] >= k) {
                      cnt[s[left] - 'a']--;
                      left++;
                  }
                  ans += left;
              }
              return ans;
          }
        `,
        csharp: code`
          public static int NumberOfSubstrings(string s, int k)
          {
              int[] cnt = new int[26];
              int left = 0, ans = 0;
              for (int right = 0; right < s.Length; right++)
              {
                  int c = s[right] - 'a';
                  cnt[c]++;
                  while (cnt[c] >= k)
                  {
                      cnt[s[left] - 'a']--;
                      left++;
                  }
                  ans += left;
              }
              return ans;
          }
        `,
        go: code`
          func numberOfSubstrings(s string, k int) int {
              cnt := make([]int, 26)
              left, ans := 0, 0
              for right := 0; right < len(s); right++ {
                  c := int(s[right] - 'a')
                  cnt[c]++
                  for cnt[c] >= k {
                      cnt[s[left]-'a']--
                      left++
                  }
                  ans += left
              }
              return ans
          }
        `,
        kotlin: code`
          fun numberOfSubstrings(s: String, k: Int): Int {
              val cnt = IntArray(26)
              var left = 0
              var ans = 0
              for (right in s.indices) {
                  val c = s[right] - 'a'
                  cnt[c]++
                  while (cnt[c] >= k) {
                      cnt[s[left] - 'a']--
                      left++
                  }
                  ans += left
              }
              return ans
          }
        `,
        swift: code`
          func numberOfSubstrings(_ s: String, _ k: Int) -> Int {
              let a = Array(s.utf8).map { Int($0) - 97 }
              var cnt = [Int](repeating: 0, count: 26)
              var left = 0, ans = 0
              for right in 0..<a.count {
                  let c = a[right]
                  cnt[c] += 1
                  while cnt[c] >= k {
                      cnt[a[left]] -= 1
                      left += 1
                  }
                  ans += left
              }
              return ans
          }
        `,
        rust: code`
          fn numberOfSubstrings(s: String, k: i32) -> i32 {
              let a = s.as_bytes();
              let mut cnt = [0i32; 26];
              let mut left = 0usize;
              let mut ans = 0i32;
              for right in 0..a.len() {
                  let c = (a[right] - b'a') as usize;
                  cnt[c] += 1;
                  while cnt[c] >= k {
                      cnt[(a[left] - b'a') as usize] -= 1;
                      left += 1;
                  }
                  ans += left as i32;
              }
              ans
          }
        `,
        php: code`
          function numberOfSubstrings($s, $k) {
              $cnt = array_fill(0, 26, 0);
              $left = 0; $ans = 0;
              $n = strlen($s);
              for ($right = 0; $right < $n; $right++) {
                  $c = ord($s[$right]) - 97;
                  $cnt[$c]++;
                  while ($cnt[$c] >= $k) {
                      $cnt[ord($s[$left]) - 97]--;
                      $left++;
                  }
                  $ans += $left;
              }
              return $ans;
          }
        `,
        ruby: code`
          def numberOfSubstrings(s, k)
            a = s.bytes.map { |b| b - 97 }
            cnt = Array.new(26, 0)
            left = 0
            ans = 0
            a.each do |c|
              cnt[c] += 1
              while cnt[c] >= k
                cnt[a[left]] -= 1
                left += 1
              end
              ans += left
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Find X-Sum of All K-Long Subarrays I (LC 3318) ──────────────
  (() => {
    const ref = (nums: number[], k: number, x: number) => {
      const out: number[] = [];
      for (let i = 0; i + k <= nums.length; i++) {
        const freq = new Map<number, number>();
        for (let j = i; j < i + k; j++) freq.set(nums[j], (freq.get(nums[j]) || 0) + 1);
        const entries = [...freq.entries()].sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));
        let s = 0;
        for (let t = 0; t < Math.min(x, entries.length); t++) s += entries[t][0] * entries[t][1];
        out.push(s);
      }
      return out;
    };
    return {
      slug: "find-x-sum-of-all-k-long-subarrays-i",
      title: "Find X-Sum of All K-Long Subarrays I",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Heap (Priority Queue)", "Amazon", "Google"],
      signature: { funcName: "findXSum", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }, { name: "x", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "The **x-sum** of an array is computed like this:\n\n1. Count how often each value occurs.\n2. Keep only the occurrences of the `x` **most frequent** values. When two values are equally frequent, the **larger** value counts as more frequent.\n3. The x-sum is the sum of the kept occurrences (each kept value times its count).\n\nIf the array has fewer than `x` distinct values, the x-sum is simply the sum of the array.\n\nGiven an array `nums` of length `n` and integers `k` and `x`, return an array `answer` of length `n - k + 1` where `answer[i]` is the x-sum of the subarray `nums[i..i + k - 1]`.",
        [
          { in: "nums = [4,4,1,2,2,3,1], k = 5, x = 2", out: "[12,8,6]", note: "Window `[4,4,1,2,2]`: 4 and 2 both appear twice, so 4·2 + 2·2 = 12. Window `[4,1,2,2,3]`: 2 appears twice, then 4 wins the tie among the singles: 4 + 4 = 8. Window `[1,2,2,3,1]`: 2·2 + 1·2 = 6." },
          { in: "nums = [5,6,5,6], k = 2, x = 2", out: "[11,11,11]", note: "Each window has two distinct values, so its x-sum is its plain sum." },
          { in: "nums = [7,3,7], k = 3, x = 1", out: "[14]" },
        ],
        ["1 <= n == nums.length <= 50", "1 <= nums[i] <= 50", "1 <= x <= k <= nums.length"]),
      hints: [
        "With `n <= 50`, recomputing each window from scratch is fast enough.",
        "For one window, count each value, then order the distinct values by (count descending, value descending).",
        "Sum `value × count` over the first `x` values in that order (or all of them if there are fewer than `x`).",
      ],
      editorial: explain({
        idea: "Directly simulate the definition for every window: count, rank by frequency with the larger value winning ties, and sum the top `x` groups.",
        steps: [
          "For each start `i` from 0 to `n - k`, count the values in `nums[i..i+k-1]`.",
          "Collect the distinct values and sort them by count descending, then by value descending.",
          "Add `value × count` for the first `min(x, distinct)` of them; that is `answer[i]`.",
        ],
        why: "The ordering (count, then value, both descending) is a strict total order on the distinct values, so \"the `x` most frequent values\" is well defined and the sort produces exactly them. Summing whole groups matches the rule that all occurrences of a kept value count.",
        time: "O((n - k + 1) · k log k)",
        space: "O(k)",
        pitfalls: [
          "Ties go to the **larger** value, not the one seen first.",
          "Add every occurrence of a kept value (`value × count`), not just the value once.",
          "For the larger variant (n up to 10^5) the window must be maintained incrementally with two ordered sets; here brute force suffices.",
        ],
      }),
      examples: [
        { input: "[4,4,1,2,2,3,1]\n5\n2", expectedOutput: "[12,8,6]" },
        { input: "[5,6,5,6]\n2\n2", expectedOutput: "[11,11,11]" },
        { input: "[7,3,7]\n3\n1", expectedOutput: "[14]" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 20), ri(rng, 20, 35)]);
        const hiV = pick(rng, [2, 4, 8, 50]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hiV));
        const k = pick(rng, [1, ri(rng, 1, n), ri(rng, 1, Math.min(n, 8)), n]);
        const x = pick(rng, [1, ri(rng, 1, k), Math.min(k, ri(rng, 1, 3)), k]);
        return { input: `${fmtIntArr(nums)}\n${k}\n${x}`, expectedOutput: fmtIntArr(ref(nums, k, x)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findXSum(nums: List[int], k: int, x: int) -> List[int]:
              res = []
              for i in range(len(nums) - k + 1):
                  cnt = {}
                  for v in nums[i:i + k]:
                      cnt[v] = cnt.get(v, 0) + 1
                  ranked = sorted(cnt.items(), key=lambda p: (-p[1], -p[0]))
                  res.append(sum(v * c for v, c in ranked[:x]))
              return res
        `,
        javascript: code`
          var findXSum = function(nums, k, x) {
              var res = [];
              for (var i = 0; i + k <= nums.length; i++) {
                  var freq = new Array(51).fill(0);
                  for (var j = i; j < i + k; j++) freq[nums[j]]++;
                  // key = count * 64 + value orders by count, then value (value < 64)
                  var keys = [];
                  for (var v = 1; v <= 50; v++) if (freq[v] > 0) keys.push(freq[v] * 64 + v);
                  keys.sort(function(a, b) { return b - a; });
                  var sum = 0;
                  for (var t = 0; t < x && t < keys.length; t++) sum += (keys[t] % 64) * Math.floor(keys[t] / 64);
                  res.push(sum);
              }
              return res;
          };
        `,
        typescript: code`
          function findXSum(nums: number[], k: number, x: number): number[] {
              var res: number[] = [];
              for (var i = 0; i + k <= nums.length; i++) {
                  var freq: number[] = [];
                  for (var t = 0; t <= 50; t++) freq.push(0);
                  for (var j = i; j < i + k; j++) freq[nums[j]]++;
                  var keys: number[] = [];
                  for (var v = 1; v <= 50; v++) if (freq[v] > 0) keys.push(freq[v] * 64 + v);
                  keys.sort(function (a, b) { return b - a; });
                  var sum = 0;
                  for (var q = 0; q < x && q < keys.length; q++) sum += (keys[q] % 64) * Math.floor(keys[q] / 64);
                  res.push(sum);
              }
              return res;
          }
        `,
        java: code`
          public static int[] findXSum(int[] nums, int k, int x) {
              int m = nums.length - k + 1;
              int[] res = new int[m];
              for (int i = 0; i < m; i++) {
                  int[] freq = new int[51];
                  for (int j = i; j < i + k; j++) freq[nums[j]]++;
                  List<Integer> keys = new ArrayList<>();
                  for (int v = 1; v <= 50; v++) if (freq[v] > 0) keys.add(freq[v] * 64 + v);
                  keys.sort(Collections.reverseOrder());
                  int sum = 0;
                  for (int t = 0; t < x && t < keys.size(); t++) sum += (keys.get(t) % 64) * (keys.get(t) / 64);
                  res[i] = sum;
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> findXSum(vector<int>& nums, int k, int x) {
              int m = nums.size() - k + 1;
              vector<int> res(m);
              for (int i = 0; i < m; i++) {
                  int freq[51] = {0};
                  for (int j = i; j < i + k; j++) freq[nums[j]]++;
                  vector<int> keys;
                  for (int v = 1; v <= 50; v++) if (freq[v] > 0) keys.push_back(freq[v] * 64 + v);
                  sort(keys.rbegin(), keys.rend());
                  int sum = 0;
                  for (int t = 0; t < x && t < (int) keys.size(); t++) sum += (keys[t] % 64) * (keys[t] / 64);
                  res[i] = sum;
              }
              return res;
          }
        `,
        c: code`
          static int cmpDesc3318(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (y > x) - (y < x);
          }

          int* findXSum(int* nums, int numsSize, int k, int x, int* returnSize) {
              int m = numsSize - k + 1;
              int* res = (int*)malloc(sizeof(int) * (m > 0 ? m : 1));
              int keys[51];
              for (int i = 0; i < m; i++) {
                  int freq[51] = {0};
                  for (int j = i; j < i + k; j++) freq[nums[j]]++;
                  int cnt = 0;
                  for (int v = 1; v <= 50; v++) if (freq[v] > 0) keys[cnt++] = freq[v] * 64 + v;
                  qsort(keys, cnt, sizeof(int), cmpDesc3318);
                  int sum = 0;
                  for (int t = 0; t < x && t < cnt; t++) sum += (keys[t] % 64) * (keys[t] / 64);
                  res[i] = sum;
              }
              *returnSize = m;
              return res;
          }
        `,
        csharp: code`
          public static int[] FindXSum(int[] nums, int k, int x)
          {
              int m = nums.Length - k + 1;
              int[] res = new int[m];
              for (int i = 0; i < m; i++)
              {
                  int[] freq = new int[51];
                  for (int j = i; j < i + k; j++) freq[nums[j]]++;
                  var keys = new List<int>();
                  for (int v = 1; v <= 50; v++) if (freq[v] > 0) keys.Add(freq[v] * 64 + v);
                  keys.Sort();
                  keys.Reverse();
                  int sum = 0;
                  for (int t = 0; t < x && t < keys.Count; t++) sum += (keys[t] % 64) * (keys[t] / 64);
                  res[i] = sum;
              }
              return res;
          }
        `,
        go: code`
          func findXSum(nums []int, k int, x int) []int {
              m := len(nums) - k + 1
              res := make([]int, m)
              for i := 0; i < m; i++ {
                  freq := make([]int, 51)
                  for j := i; j < i+k; j++ {
                      freq[nums[j]]++
                  }
                  keys := []int{}
                  for v := 1; v <= 50; v++ {
                      if freq[v] > 0 {
                          keys = append(keys, freq[v]*64+v)
                      }
                  }
                  sort.Sort(sort.Reverse(sort.IntSlice(keys)))
                  sum := 0
                  for t := 0; t < x && t < len(keys); t++ {
                      sum += (keys[t] % 64) * (keys[t] / 64)
                  }
                  res[i] = sum
              }
              return res
          }
        `,
        kotlin: code`
          fun findXSum(nums: IntArray, k: Int, x: Int): IntArray {
              val m = nums.size - k + 1
              val res = IntArray(m)
              for (i in 0 until m) {
                  val freq = IntArray(51)
                  for (j in i until i + k) freq[nums[j]]++
                  val keys = ArrayList<Int>()
                  for (v in 1..50) if (freq[v] > 0) keys.add(freq[v] * 64 + v)
                  keys.sortDescending()
                  var sum = 0
                  var t = 0
                  while (t < x && t < keys.size) {
                      sum += (keys[t] % 64) * (keys[t] / 64)
                      t++
                  }
                  res[i] = sum
              }
              return res
          }
        `,
        swift: code`
          func findXSum(_ nums: [Int], _ k: Int, _ x: Int) -> [Int] {
              let m = nums.count - k + 1
              var res = [Int]()
              for i in 0..<m {
                  var freq = [Int](repeating: 0, count: 51)
                  for j in i..<(i + k) { freq[nums[j]] += 1 }
                  var keys = [Int]()
                  for v in 1...50 where freq[v] > 0 { keys.append(freq[v] * 64 + v) }
                  keys.sort(by: >)
                  var sum = 0
                  var t = 0
                  while t < x && t < keys.count {
                      sum += (keys[t] % 64) * (keys[t] / 64)
                      t += 1
                  }
                  res.append(sum)
              }
              return res
          }
        `,
        rust: code`
          fn findXSum(nums: Vec<i32>, k: i32, x: i32) -> Vec<i32> {
              let k = k as usize;
              let x = x as usize;
              let m = nums.len() + 1 - k;
              let mut res = Vec::with_capacity(m);
              for i in 0..m {
                  let mut freq = [0i32; 51];
                  for j in i..i + k {
                      freq[nums[j] as usize] += 1;
                  }
                  let mut keys: Vec<i32> = Vec::new();
                  for v in 1..51 {
                      if freq[v] > 0 {
                          keys.push(freq[v] * 64 + v as i32);
                      }
                  }
                  keys.sort();
                  keys.reverse();
                  let mut sum = 0i32;
                  for t in 0..keys.len() {
                      if t >= x {
                          break;
                      }
                      sum += (keys[t] % 64) * (keys[t] / 64);
                  }
                  res.push(sum);
              }
              res
          }
        `,
        php: code`
          function findXSum($nums, $k, $x) {
              $m = count($nums) - $k + 1;
              $res = [];
              for ($i = 0; $i < $m; $i++) {
                  $freq = array_fill(0, 51, 0);
                  for ($j = $i; $j < $i + $k; $j++) $freq[$nums[$j]]++;
                  $keys = [];
                  for ($v = 1; $v <= 50; $v++) if ($freq[$v] > 0) $keys[] = $freq[$v] * 64 + $v;
                  rsort($keys);
                  $sum = 0;
                  for ($t = 0; $t < $x && $t < count($keys); $t++) $sum += ($keys[$t] % 64) * intdiv($keys[$t], 64);
                  $res[] = $sum;
              }
              return $res;
          }
        `,
        ruby: code`
          def findXSum(nums, k, x)
            res = []
            (0..nums.length - k).each do |i|
              cnt = Hash.new(0)
              nums[i, k].each { |v| cnt[v] += 1 }
              ranked = cnt.to_a.sort_by { |v, c| [-c, -v] }
              res << ranked.first(x).sum { |v, c| v * c }
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Minimum Positive Sum Subarray (LC 3364) ─────────────────────
  (() => {
    const ref = (nums: number[], l: number, r: number) => {
      let best = -1;
      for (let i = 0; i < nums.length; i++) {
        let s = 0;
        for (let j = i; j < nums.length; j++) {
          s += nums[j];
          const len = j - i + 1;
          if (len >= l && len <= r && s > 0 && (best === -1 || s < best)) best = s;
        }
      }
      return best;
    };
    return {
      slug: "minimum-positive-sum-subarray",
      title: "Minimum Positive Sum Subarray",
      difficulty: "EASY" as const,
      tags: ["Array", "Sliding Window", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "minimumSumSubarray", params: [{ name: "nums", type: "int[]" as const }, { name: "l", type: "int" as const }, { name: "r", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and two integers `l` and `r`.\n\nAmong all contiguous subarrays whose length is between `l` and `r` (inclusive) **and** whose sum is **strictly greater than 0**, find the smallest sum.\n\nReturn that minimum sum, or `-1` if no such subarray exists.",
        [
          { in: "nums = [5,-3,2,-1], l = 2, r = 3", out: "1", note: "The length-2 sums are 2, -1, 1 and the length-3 sums are 4, -2. The positive ones are 2, 1 and 4." },
          { in: "nums = [-4,1,-2], l = 2, r = 3", out: "-1", note: "Every subarray of length 2 or 3 has a negative sum." },
          { in: "nums = [2,2,2], l = 3, r = 3", out: "6" },
        ],
        ["1 <= nums.length <= 100", "1 <= l <= r <= nums.length", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "With `n <= 100` you can afford to look at every subarray.",
        "Prefix sums give any subarray's sum in O(1): `sum(i..j) = P[j+1] - P[i]`.",
        "For each allowed length, slide a window of that length across the array and keep the smallest sum that is still positive.",
      ],
      editorial: explain({
        idea: "Enumerate every subarray whose length lies in `[l, r]`, computing sums with prefix sums (or a fixed-length sliding window per length), and keep the smallest positive one.",
        steps: [
          "Build prefix sums `P` with `P[0] = 0`.",
          "For each length `len` from `l` to `r`, and each start `i` with `i + len <= n`, compute `s = P[i + len] - P[i]`.",
          "If `s > 0` and it is smaller than the best so far (or no best exists yet), record it.",
          "Return the best, or `-1` if nothing was recorded.",
        ],
        why: "Every subarray of an allowed length is examined exactly once, and the filter keeps precisely those with a positive sum, so the minimum over them is the answer by definition.",
        time: "O(n · (r - l + 1))",
        space: "O(n)",
        pitfalls: [
          "A sum of exactly 0 is not positive and must be skipped.",
          "Start with \"no answer\" (`-1`) rather than 0, or a real answer may never replace it.",
          "Both length bounds are inclusive.",
        ],
      }),
      examples: [
        { input: "[5,-3,2,-1]\n2\n3", expectedOutput: "1" },
        { input: "[-4,1,-2]\n2\n3", expectedOutput: "-1" },
        { input: "[2,2,2]\n3\n3", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 25), ri(rng, 25, 40)]);
        const span = pick(rng, [3, 10, 1000]);
        const bias = pick(rng, [0, 0, -1, 1]);
        const nums = Array.from({ length: n }, () => Math.max(-1000, Math.min(1000, ri(rng, -span, span) + bias * ri(rng, 0, span))));
        const a = ri(rng, 1, n), b = ri(rng, 1, n);
        const l = Math.min(a, b), r = rng() < 0.2 ? Math.min(a, b) : Math.max(a, b);
        return { input: `${fmtIntArr(nums)}\n${l}\n${r}`, expectedOutput: String(ref(nums, l, r)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumSumSubarray(nums: List[int], l: int, r: int) -> int:
              n = len(nums)
              pre = [0] * (n + 1)
              for i, v in enumerate(nums):
                  pre[i + 1] = pre[i] + v
              best = -1
              for length in range(l, r + 1):
                  for i in range(n - length + 1):
                      s = pre[i + length] - pre[i]
                      if s > 0 and (best == -1 or s < best):
                          best = s
              return best
        `,
        javascript: code`
          var minimumSumSubarray = function(nums, l, r) {
              var n = nums.length;
              var pre = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + nums[i]);
              var best = -1;
              for (var len = l; len <= r; len++) {
                  for (var i = 0; i + len <= n; i++) {
                      var s = pre[i + len] - pre[i];
                      if (s > 0 && (best === -1 || s < best)) best = s;
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function minimumSumSubarray(nums: number[], l: number, r: number): number {
              var n = nums.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + nums[i]);
              var best = -1;
              for (var len = l; len <= r; len++) {
                  for (var i = 0; i + len <= n; i++) {
                      var s = pre[i + len] - pre[i];
                      if (s > 0 && (best === -1 || s < best)) best = s;
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int minimumSumSubarray(int[] nums, int l, int r) {
              int n = nums.length;
              int[] pre = new int[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              int best = -1;
              for (int len = l; len <= r; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int s = pre[i + len] - pre[i];
                      if (s > 0 && (best == -1 || s < best)) best = s;
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int minimumSumSubarray(vector<int>& nums, int l, int r) {
              int n = nums.size();
              vector<int> pre(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              int best = -1;
              for (int len = l; len <= r; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int s = pre[i + len] - pre[i];
                      if (s > 0 && (best == -1 || s < best)) best = s;
                  }
              }
              return best;
          }
        `,
        c: code`
          int minimumSumSubarray(int* nums, int numsSize, int l, int r) {
              int n = numsSize;
              int* pre = (int*)malloc(sizeof(int) * (n + 1));
              pre[0] = 0;
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              int best = -1;
              for (int len = l; len <= r; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int s = pre[i + len] - pre[i];
                      if (s > 0 && (best == -1 || s < best)) best = s;
                  }
              }
              free(pre);
              return best;
          }
        `,
        csharp: code`
          public static int MinimumSumSubarray(int[] nums, int l, int r)
          {
              int n = nums.Length;
              int[] pre = new int[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              int best = -1;
              for (int len = l; len <= r; len++)
              {
                  for (int i = 0; i + len <= n; i++)
                  {
                      int s = pre[i + len] - pre[i];
                      if (s > 0 && (best == -1 || s < best)) best = s;
                  }
              }
              return best;
          }
        `,
        go: code`
          func minimumSumSubarray(nums []int, l int, r int) int {
              n := len(nums)
              pre := make([]int, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + nums[i]
              }
              best := -1
              for length := l; length <= r; length++ {
                  for i := 0; i+length <= n; i++ {
                      s := pre[i+length] - pre[i]
                      if s > 0 && (best == -1 || s < best) {
                          best = s
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minimumSumSubarray(nums: IntArray, l: Int, r: Int): Int {
              val n = nums.size
              val pre = IntArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + nums[i]
              var best = -1
              for (len in l..r) {
                  var i = 0
                  while (i + len <= n) {
                      val s = pre[i + len] - pre[i]
                      if (s > 0 && (best == -1 || s < best)) best = s
                      i++
                  }
              }
              return best
          }
        `,
        swift: code`
          func minimumSumSubarray(_ nums: [Int], _ l: Int, _ r: Int) -> Int {
              let n = nums.count
              var pre = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + nums[i] }
              var best = -1
              for len in l...r {
                  var i = 0
                  while i + len <= n {
                      let s = pre[i + len] - pre[i]
                      if s > 0 && (best == -1 || s < best) { best = s }
                      i += 1
                  }
              }
              return best
          }
        `,
        rust: code`
          fn minimumSumSubarray(nums: Vec<i32>, l: i32, r: i32) -> i32 {
              let n = nums.len();
              let mut pre = vec![0i32; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + nums[i];
              }
              let mut best = -1i32;
              for len in (l as usize)..=(r as usize) {
                  let mut i = 0usize;
                  while i + len <= n {
                      let s = pre[i + len] - pre[i];
                      if s > 0 && (best == -1 || s < best) {
                          best = s;
                      }
                      i += 1;
                  }
              }
              best
          }
        `,
        php: code`
          function minimumSumSubarray($nums, $l, $r) {
              $n = count($nums);
              $pre = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $nums[$i];
              $best = -1;
              for ($len = $l; $len <= $r; $len++) {
                  for ($i = 0; $i + $len <= $n; $i++) {
                      $s = $pre[$i + $len] - $pre[$i];
                      if ($s > 0 && ($best == -1 || $s < $best)) $best = $s;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def minimumSumSubarray(nums, l, r)
            n = nums.length
            pre = Array.new(n + 1, 0)
            n.times { |i| pre[i + 1] = pre[i] + nums[i] }
            best = -1
            (l..r).each do |len|
              (0..n - len).each do |i|
                s = pre[i + len] - pre[i]
                best = s if s > 0 && (best == -1 || s < best)
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Number of Smooth Descent Periods of a Stock (LC 2110) ───────
  (() => {
    const ref = (prices: number[]) => {
      let count = 0;
      for (let i = 0; i < prices.length; i++) {
        count++;
        for (let j = i + 1; j < prices.length && prices[j] === prices[j - 1] - 1; j++) count++;
      }
      return count;
    };
    return {
      slug: "number-of-smooth-descent-periods-of-a-stock",
      title: "Number of Smooth Descent Periods of a Stock",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "getDescentPeriods", params: [{ name: "prices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`prices[i]` is a stock's price on day `i`.\n\nA **smooth descent period** is a run of one or more consecutive days in which each day's price is exactly `1` lower than the previous day's. The first day of a period is unrestricted, so every single day is a smooth descent period on its own.\n\nReturn the number of smooth descent periods.\n\n*CodeKairo note:* the original allows `prices.length` up to 10^5 and returns a 64-bit count; here the length is at most `5 * 10^4`, so the answer fits in a 32-bit integer.",
        [
          { in: "prices = [5,4,3,7,6]", out: "9", note: "Five single days, `[5,4]`, `[4,3]`, `[5,4,3]` and `[7,6]`." },
          { in: "prices = [9,7,8,8]", out: "4", note: "No two neighbours differ by exactly 1 downward, so only the four single days count." },
          { in: "prices = [10]", out: "1" },
        ],
        ["1 <= prices.length <= 5 * 10^4", "1 <= prices[i] <= 10^5"]),
      hints: [
        "A period is valid exactly when every adjacent pair inside it steps down by 1, so the valid periods live inside maximal \"descending by 1\" runs.",
        "Count the periods by their last day: how many valid periods end at day `i`?",
        "If day `i` continues the run (`prices[i] == prices[i-1] - 1`) the count is one more than for day `i - 1`; otherwise it is 1. Sum these counts.",
      ],
      editorial: explain({
        idea: "Count periods by their last day. The number of valid periods ending at day `i` is the length of the descending-by-one run that ends there.",
        steps: [
          "Keep `run`, the length of the current smooth run ending at the previous day, and a total.",
          "For each day `i`: if `i > 0` and `prices[i] == prices[i-1] - 1`, increment `run`; otherwise set `run = 1`.",
          "Add `run` to the total — that many periods end at day `i` (starting at any day inside the run).",
          "Return the total.",
        ],
        why: "A period `[j, i]` is smooth exactly when every step inside it is a drop of 1, i.e. when `j` lies within the maximal smooth run ending at `i`. There are exactly `run` such start days, and summing over `i` counts each period once by its last day. Equivalently, a maximal run of length `L` contributes `L(L+1)/2`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The drop must be exactly 1 — a drop of 2 or an equal price breaks the run.",
          "Single days always count, so the answer is at least `n`.",
          "The total grows quadratically on a long run — accumulate in 64-bit in fixed-width languages.",
        ],
      }),
      examples: [
        { input: "[5,4,3,7,6]", expectedOutput: "9" },
        { input: "[9,7,8,8]", expectedOutput: "4" },
        { input: "[10]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 40), ri(rng, 40, 80)]);
        const dropP = pick(rng, [0, 0.3, 0.6, 0.85, 1]);
        const prices: number[] = [ri(rng, 1, pick(rng, [10, 100, 100000]))];
        for (let i = 1; i < n; i++) {
          const prev = prices[i - 1];
          let v: number;
          if (prev > 1 && rng() < dropP) v = prev - 1;
          else v = Math.max(1, Math.min(100000, prev + pick(rng, [0, 1, 2, -2, ri(rng, 3, 100), -ri(rng, 3, 50)])));
          prices.push(v);
        }
        return { input: fmtIntArr(prices), expectedOutput: String(ref(prices)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getDescentPeriods(prices: List[int]) -> int:
              total = 0
              run = 0
              for i, p in enumerate(prices):
                  if i > 0 and p == prices[i - 1] - 1:
                      run += 1
                  else:
                      run = 1
                  total += run
              return total
        `,
        javascript: code`
          var getDescentPeriods = function(prices) {
              var total = 0, run = 0;
              for (var i = 0; i < prices.length; i++) {
                  if (i > 0 && prices[i] === prices[i - 1] - 1) run++;
                  else run = 1;
                  total += run;
              }
              return total;
          };
        `,
        typescript: code`
          function getDescentPeriods(prices: number[]): number {
              var total = 0, run = 0;
              for (var i = 0; i < prices.length; i++) {
                  if (i > 0 && prices[i] === prices[i - 1] - 1) run++;
                  else run = 1;
                  total += run;
              }
              return total;
          }
        `,
        java: code`
          public static int getDescentPeriods(int[] prices) {
              long total = 0;
              int run = 0;
              for (int i = 0; i < prices.length; i++) {
                  if (i > 0 && prices[i] == prices[i - 1] - 1) run++;
                  else run = 1;
                  total += run;
              }
              return (int) total;
          }
        `,
        cpp: code`
          int getDescentPeriods(vector<int>& prices) {
              long long total = 0;
              int run = 0;
              for (int i = 0; i < (int) prices.size(); i++) {
                  if (i > 0 && prices[i] == prices[i - 1] - 1) run++;
                  else run = 1;
                  total += run;
              }
              return (int) total;
          }
        `,
        c: code`
          int getDescentPeriods(int* prices, int pricesSize) {
              long long total = 0;
              int run = 0;
              for (int i = 0; i < pricesSize; i++) {
                  if (i > 0 && prices[i] == prices[i - 1] - 1) run++;
                  else run = 1;
                  total += run;
              }
              return (int) total;
          }
        `,
        csharp: code`
          public static int GetDescentPeriods(int[] prices)
          {
              long total = 0;
              int run = 0;
              for (int i = 0; i < prices.Length; i++)
              {
                  if (i > 0 && prices[i] == prices[i - 1] - 1) run++;
                  else run = 1;
                  total += run;
              }
              return (int) total;
          }
        `,
        go: code`
          func getDescentPeriods(prices []int) int {
              total, run := 0, 0
              for i := 0; i < len(prices); i++ {
                  if i > 0 && prices[i] == prices[i-1]-1 {
                      run++
                  } else {
                      run = 1
                  }
                  total += run
              }
              return total
          }
        `,
        kotlin: code`
          fun getDescentPeriods(prices: IntArray): Int {
              var total = 0L
              var run = 0
              for (i in prices.indices) {
                  if (i > 0 && prices[i] == prices[i - 1] - 1) { run++ } else { run = 1 }
                  total += run.toLong()
              }
              return total.toInt()
          }
        `,
        swift: code`
          func getDescentPeriods(_ prices: [Int]) -> Int {
              var total = 0, run = 0
              for i in 0..<prices.count {
                  if i > 0 && prices[i] == prices[i - 1] - 1 { run += 1 } else { run = 1 }
                  total += run
              }
              return total
          }
        `,
        rust: code`
          fn getDescentPeriods(prices: Vec<i32>) -> i32 {
              let mut total: i64 = 0;
              let mut run: i64 = 0;
              for i in 0..prices.len() {
                  if i > 0 && prices[i] == prices[i - 1] - 1 {
                      run += 1;
                  } else {
                      run = 1;
                  }
                  total += run;
              }
              total as i32
          }
        `,
        php: code`
          function getDescentPeriods($prices) {
              $total = 0; $run = 0;
              $n = count($prices);
              for ($i = 0; $i < $n; $i++) {
                  if ($i > 0 && $prices[$i] == $prices[$i - 1] - 1) $run++;
                  else $run = 1;
                  $total += $run;
              }
              return $total;
          }
        `,
        ruby: code`
          def getDescentPeriods(prices)
            total = 0
            run = 0
            prices.each_with_index do |p, i|
              if i > 0 && p == prices[i - 1] - 1
                run += 1
              else
                run = 1
              end
              total += run
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Apply Operations to Maximize Frequency Score (LC 2968) ──────
  (() => {
    const ref = (nums: number[], k: number) => {
      // for every target value, raise/lower the closest elements first
      let best = 0;
      for (const t of nums) {
        const d = nums.map((v) => Math.abs(v - t)).sort((a, b) => a - b);
        let used = 0, cnt = 0;
        for (const x of d) {
          if (used + x > k) break;
          used += x;
          cnt++;
        }
        best = Math.max(best, cnt);
      }
      return best;
    };
    return {
      slug: "apply-operations-to-maximize-frequency-score",
      title: "Apply Operations to Maximize Frequency Score",
      difficulty: "HARD" as const,
      tags: ["Array", "Sliding Window", "Sorting", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "maxFrequencyScore", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and an integer `k`. You may perform the following operation **at most `k` times** in total: choose any index `i` and increase or decrease `nums[i]` by `1`.\n\nThe **score** of the final array is the frequency of its most frequent element.\n\nReturn the maximum score you can achieve.\n\n*CodeKairo note:* the original allows `k` up to 10^14; here `k` is a 32-bit integer (`k <= 10^9`). The cost of a window can still exceed 32 bits — compute it in 64-bit.",
        [
          { in: "nums = [7,1,3,9], k = 6", out: "3", note: "Turn 1 into 3 (2 operations) and 7 into 3 (4 operations): three 3s for exactly 6 operations." },
          { in: "nums = [5,5,2,5], k = 0", out: "3", note: "No operations are allowed; 5 already appears three times." },
          { in: "nums = [10,20], k = 9", out: "1", note: "Making the two equal needs 10 operations." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^9", "0 <= k <= 10^9"]),
      hints: [
        "Sort the array. The elements you make equal can be taken as a contiguous block of the sorted array — swapping in a closer element never costs more.",
        "For a fixed block, the cheapest common value is its median, and the cost is the sum of distances to the median. Prefix sums give it in O(1).",
        "The cost of a block grows when you extend it and shrinks when you drop its leftmost element, so slide a window: extend right, and move left forward while the cost exceeds `k`.",
      ],
      editorial: explain({
        idea: "After sorting, the best set of elements to equalise is a contiguous window, and the cheapest target for a window is its median. The window's cost is monotone, so two pointers find the longest affordable window.",
        steps: [
          "Sort `nums` and build prefix sums `P` (64-bit).",
          "Define `cost(l, r)` with `m = (l + r) / 2`: `a[m]·(m - l) - (P[m] - P[l]) + (P[r+1] - P[m+1]) - a[m]·(r - m)` — the total distance from every element of the window to its median.",
          "Keep `left = 0`. For each `right`, advance `left` while `cost(left, right) > k`.",
          "Track the maximum `right - left + 1`.",
        ],
        why: "Fix the final common value `t`. Making `c` elements equal to `t` is cheapest with the `c` elements closest to `t`, which form a contiguous block of the sorted array; and for a fixed block, the sum of absolute distances is minimised at a median. So the answer is the longest window whose median-cost is at most `k`. That cost never decreases when the window gains an element and never increases when it loses its leftmost one, which justifies moving `left` only forward.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Costs reach about 5·10^13 — prefix sums and the cost must be 64-bit.",
          "Targeting the mean instead of the median can cost more; the median is optimal for absolute differences.",
          "For an even-length window either middle element works as the median; use one consistently.",
        ],
      }),
      examples: [
        { input: "[7,1,3,9]\n6", expectedOutput: "3" },
        { input: "[5,5,2,5]\n0", expectedOutput: "3" },
        { input: "[10,20]\n9", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.04 ? 1 : pick(rng, [ri(rng, 2, 8), ri(rng, 9, 20), ri(rng, 20, 32)]);
        const hiV = pick(rng, [5, 30, 1000, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hiV));
        const k = rng() < 0.15 ? 0 : rng() < 0.05 ? 1000000000 : ri(rng, 0, Math.min(1000000000, Math.max(1, Math.floor(hiV * n * pick(rng, [0.05, 0.3, 1]) / 2))));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxFrequencyScore(nums: List[int], k: int) -> int:
              a = sorted(nums)
              n = len(a)
              pre = [0] * (n + 1)
              for i, v in enumerate(a):
                  pre[i + 1] = pre[i] + v

              def cost(l: int, r: int) -> int:
                  m = (l + r) // 2
                  return a[m] * (m - l) - (pre[m] - pre[l]) + (pre[r + 1] - pre[m + 1]) - a[m] * (r - m)

              best = 0
              left = 0
              for right in range(n):
                  while cost(left, right) > k:
                      left += 1
                  best = max(best, right - left + 1)
              return best
        `,
        javascript: code`
          var maxFrequencyScore = function(nums, k) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var n = a.length;
              var pre = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + a[i]);
              var cost = function(l, r) {
                  var m = (l + r) >> 1;
                  return a[m] * (m - l) - (pre[m] - pre[l]) + (pre[r + 1] - pre[m + 1]) - a[m] * (r - m);
              };
              var best = 0, left = 0;
              for (var right = 0; right < n; right++) {
                  while (cost(left, right) > k) left++;
                  if (right - left + 1 > best) best = right - left + 1;
              }
              return best;
          };
        `,
        typescript: code`
          function maxFrequencyScore(nums: number[], k: number): number {
              var a = nums.slice().sort(function (x, y) { return x - y; });
              var n = a.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + a[i]);
              var cost = function (l: number, r: number): number {
                  var m = (l + r) >> 1;
                  return a[m] * (m - l) - (pre[m] - pre[l]) + (pre[r + 1] - pre[m + 1]) - a[m] * (r - m);
              };
              var best = 0, left = 0;
              for (var right = 0; right < n; right++) {
                  while (cost(left, right) > k) left++;
                  if (right - left + 1 > best) best = right - left + 1;
              }
              return best;
          }
        `,
        java: code`
          public static int maxFrequencyScore(int[] nums, int k) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int n = a.length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
              int best = 0, left = 0;
              for (int right = 0; right < n; right++) {
                  while (true) {
                      int m = (left + right) / 2;
                      long cost = (long) a[m] * (m - left) - (pre[m] - pre[left]) + (pre[right + 1] - pre[m + 1]) - (long) a[m] * (right - m);
                      if (cost <= k) break;
                      left++;
                  }
                  best = Math.max(best, right - left + 1);
              }
              return best;
          }
        `,
        cpp: code`
          int maxFrequencyScore(vector<int>& nums, int k) {
              vector<int> a(nums.begin(), nums.end());
              sort(a.begin(), a.end());
              int n = a.size();
              vector<long long> pre(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
              int best = 0, left = 0;
              for (int right = 0; right < n; right++) {
                  while (true) {
                      int m = (left + right) / 2;
                      long long cost = (long long) a[m] * (m - left) - (pre[m] - pre[left]) + (pre[right + 1] - pre[m + 1]) - (long long) a[m] * (right - m);
                      if (cost <= k) break;
                      left++;
                  }
                  best = max(best, right - left + 1);
              }
              return best;
          }
        `,
        c: code`
          static int cmpAsc2968(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int maxFrequencyScore(int* nums, int numsSize, int k) {
              int n = numsSize;
              int* a = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) a[i] = nums[i];
              qsort(a, n, sizeof(int), cmpAsc2968);
              long long* pre = (long long*)malloc(sizeof(long long) * (n + 1));
              pre[0] = 0;
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
              int best = 0, left = 0;
              for (int right = 0; right < n; right++) {
                  while (1) {
                      int m = (left + right) / 2;
                      long long cost = (long long) a[m] * (m - left) - (pre[m] - pre[left]) + (pre[right + 1] - pre[m + 1]) - (long long) a[m] * (right - m);
                      if (cost <= k) break;
                      left++;
                  }
                  if (right - left + 1 > best) best = right - left + 1;
              }
              free(a);
              free(pre);
              return best;
          }
        `,
        csharp: code`
          public static int MaxFrequencyScore(int[] nums, int k)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              int n = a.Length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
              int best = 0, left = 0;
              for (int right = 0; right < n; right++)
              {
                  while (true)
                  {
                      int m = (left + right) / 2;
                      long cost = (long) a[m] * (m - left) - (pre[m] - pre[left]) + (pre[right + 1] - pre[m + 1]) - (long) a[m] * (right - m);
                      if (cost <= k) break;
                      left++;
                  }
                  best = Math.Max(best, right - left + 1);
              }
              return best;
          }
        `,
        go: code`
          func maxFrequencyScore(nums []int, k int) int {
              n := len(nums)
              a := make([]int, n)
              copy(a, nums)
              sort.Ints(a)
              pre := make([]int64, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + int64(a[i])
              }
              best, left := 0, 0
              for right := 0; right < n; right++ {
                  for {
                      m := (left + right) / 2
                      cost := int64(a[m])*int64(m-left) - (pre[m] - pre[left]) + (pre[right+1] - pre[m+1]) - int64(a[m])*int64(right-m)
                      if cost <= int64(k) {
                          break
                      }
                      left++
                  }
                  if right-left+1 > best {
                      best = right - left + 1
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxFrequencyScore(nums: IntArray, k: Int): Int {
              val a = nums.copyOf()
              a.sort()
              val n = a.size
              val pre = LongArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + a[i]
              var best = 0
              var left = 0
              for (right in 0 until n) {
                  while (true) {
                      val m = (left + right) / 2
                      val cost = a[m].toLong() * (m - left) - (pre[m] - pre[left]) + (pre[right + 1] - pre[m + 1]) - a[m].toLong() * (right - m)
                      if (cost <= k) break
                      left++
                  }
                  best = maxOf(best, right - left + 1)
              }
              return best
          }
        `,
        swift: code`
          func maxFrequencyScore(_ nums: [Int], _ k: Int) -> Int {
              let a = nums.sorted()
              let n = a.count
              var pre = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + a[i] }
              var best = 0, left = 0
              for right in 0..<n {
                  while true {
                      let m = (left + right) / 2
                      let cost = a[m] * (m - left) - (pre[m] - pre[left]) + (pre[right + 1] - pre[m + 1]) - a[m] * (right - m)
                      if cost <= k { break }
                      left += 1
                  }
                  best = max(best, right - left + 1)
              }
              return best
          }
        `,
        rust: code`
          fn maxFrequencyScore(nums: Vec<i32>, k: i32) -> i32 {
              let mut a: Vec<i64> = nums.iter().map(|&x| x as i64).collect();
              a.sort();
              let n = a.len();
              let mut pre = vec![0i64; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + a[i];
              }
              let kk = k as i64;
              let mut best = 0usize;
              let mut left = 0usize;
              for right in 0..n {
                  loop {
                      let m = (left + right) / 2;
                      let cost = a[m] * (m - left) as i64 - (pre[m] - pre[left]) + (pre[right + 1] - pre[m + 1]) - a[m] * (right - m) as i64;
                      if cost <= kk {
                          break;
                      }
                      left += 1;
                  }
                  if right + 1 - left > best {
                      best = right + 1 - left;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function maxFrequencyScore($nums, $k) {
              $a = $nums;
              sort($a);
              $n = count($a);
              $pre = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $a[$i];
              $best = 0; $left = 0;
              for ($right = 0; $right < $n; $right++) {
                  while (true) {
                      $m = intdiv($left + $right, 2);
                      $cost = $a[$m] * ($m - $left) - ($pre[$m] - $pre[$left]) + ($pre[$right + 1] - $pre[$m + 1]) - $a[$m] * ($right - $m);
                      if ($cost <= $k) break;
                      $left++;
                  }
                  if ($right - $left + 1 > $best) $best = $right - $left + 1;
              }
              return $best;
          }
        `,
        ruby: code`
          def maxFrequencyScore(nums, k)
            a = nums.sort
            n = a.length
            pre = Array.new(n + 1, 0)
            n.times { |i| pre[i + 1] = pre[i] + a[i] }
            best = 0
            left = 0
            (0...n).each do |right|
              loop do
                m = (left + right) / 2
                cost = a[m] * (m - left) - (pre[m] - pre[left]) + (pre[right + 1] - pre[m + 1]) - a[m] * (right - m)
                break if cost <= k
                left += 1
              end
              best = right - left + 1 if right - left + 1 > best
            end
            best
          end
        `,
      },
    };
  })(),

];
