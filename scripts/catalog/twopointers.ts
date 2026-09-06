/** Two Pointers & Sliding Window — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

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
      editorial: explain({
        idea: "Sortedness turns the pair search into a single sweep. Start with the widest possible pair — first and last — and note that its sum is an extreme. If the sum is too small the only way to grow it is to raise the left value; if too big, the only way to shrink it is to lower the right. Each comparison discards a whole row of candidates.",
        steps: [
          "Put `l` at the first index and `r` at the last.",
          "Compute `numbers[l] + numbers[r]`.",
          "If it equals the target, return `[l + 1, r + 1]` — the problem is 1-indexed.",
          "If the sum is below the target, move `l` right; if above, move `r` left.",
          "The guaranteed unique solution is always reached before the pointers cross.",
        ],
        why: "Think of the candidate pairs as a grid. When the sum at `(l, r)` is too small, every pair `(l, r')` with `r' < r` is smaller still — the array is sorted — so the entire column below `r` for that `l` can be discarded, which is exactly what advancing `l` does. The symmetric argument covers the too-big case. Nothing that could be the answer is ever skipped, and each step retires one index, giving a linear sweep in constant space.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The indices are **1-based** — return `l + 1` and `r + 1`, not the raw offsets.",
          "A hash map also finds the pair but costs `O(n)` extra space, which the problem forbids.",
          "Move exactly one pointer per step; moving both can step over the unique solution.",
          "Values may be negative, but sortedness is all this argument needs.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef twoSum(numbers: List[int], target: int) -> List[int]:\n    l, r = 0, len(numbers) - 1\n    while l < r:\n        s = numbers[l] + numbers[r]\n        if s == target:\n            return [l + 1, r + 1]\n        if s < target:\n            l += 1\n        else:\n            r -= 1\n    return [-1, -1]`,
        javascript: `var twoSum = function(numbers, target) {\n    let l = 0, r = numbers.length - 1;\n    while (l < r) {\n        const sum = numbers[l] + numbers[r];\n        if (sum === target) return [l + 1, r + 1];\n        if (sum < target) l++;\n        else r--;\n    }\n    return [-1, -1];\n};`,
              typescript: `function twoSum(numbers: number[], target: number): number[] {\n    let l = 0;\n    let r = numbers.length - 1;\n    while (l < r) {\n        const sum = numbers[l] + numbers[r];\n        if (sum === target) return [l + 1, r + 1];\n        if (sum < target) l++;\n        else r--;\n    }\n    return [-1, -1];\n}`,
              java: `public static int[] twoSum(int[] numbers, int target) {\n    int l = 0, r = numbers.length - 1;\n    while (l < r) {\n        int sum = numbers[l] + numbers[r];\n        if (sum == target) return new int[]{l + 1, r + 1};\n        if (sum < target) l++;\n        else r--;\n    }\n    return new int[]{-1, -1};\n}`,
              cpp: `vector<int> twoSum(vector<int>& numbers, int target) {\n    int l = 0, r = (int) numbers.size() - 1;\n    while (l < r) {\n        int sum = numbers[l] + numbers[r];\n        if (sum == target) return vector<int>{l + 1, r + 1};\n        if (sum < target) l++;\n        else r--;\n    }\n    return vector<int>{-1, -1};\n}`,
              c: `int* twoSum(int* numbers, int numbersSize, int target, int* returnSize) {\n    int* out = (int*) malloc(2 * sizeof(int));\n    *returnSize = 2;\n    out[0] = -1;\n    out[1] = -1;\n    int l = 0, r = numbersSize - 1;\n    while (l < r) {\n        int sum = numbers[l] + numbers[r];\n        if (sum == target) {\n            out[0] = l + 1;\n            out[1] = r + 1;\n            break;\n        }\n        if (sum < target) l++;\n        else r--;\n    }\n    return out;\n}`,
              csharp: `public static int[] TwoSum(int[] numbers, int target)\n{\n    int l = 0, r = numbers.Length - 1;\n    while (l < r)\n    {\n        int sum = numbers[l] + numbers[r];\n        if (sum == target) return new int[] { l + 1, r + 1 };\n        if (sum < target) l++;\n        else r--;\n    }\n    return new int[] { -1, -1 };\n}`,
              go: `func twoSum(numbers []int, target int) []int {\n	l, r := 0, len(numbers)-1\n	for l < r {\n		sum := numbers[l] + numbers[r]\n		if sum == target {\n			return []int{l + 1, r + 1}\n		}\n		if sum < target {\n			l++\n		} else {\n			r--\n		}\n	}\n	return []int{-1, -1}\n}`,
              kotlin: `fun twoSum(numbers: IntArray, target: Int): IntArray {\n    var l = 0\n    var r = numbers.size - 1\n    while (l < r) {\n        val sum = numbers[l] + numbers[r]\n        if (sum == target) return intArrayOf(l + 1, r + 1)\n        if (sum < target) l++ else r--\n    }\n    return intArrayOf(-1, -1)\n}`,
              swift: `func twoSum(_ numbers: [Int], _ target: Int) -> [Int] {\n    var l = 0\n    var r = numbers.count - 1\n    while l < r {\n        let sum = numbers[l] + numbers[r]\n        if sum == target { return [l + 1, r + 1] }\n        if sum < target { l += 1 } else { r -= 1 }\n    }\n    return [-1, -1]\n}`,
              rust: `fn twoSum(numbers: Vec<i32>, target: i32) -> Vec<i32> {\n    let mut l = 0usize;\n    let mut r = numbers.len() - 1;\n    while l < r {\n        let sum = numbers[l] + numbers[r];\n        if sum == target {\n            return vec![(l + 1) as i32, (r + 1) as i32];\n        }\n        if sum < target {\n            l += 1;\n        } else {\n            r -= 1;\n        }\n    }\n    vec![-1, -1]\n}`,
              php: `function twoSum($numbers, $target) {\n    $l = 0;\n    $r = count($numbers) - 1;\n    while ($l < $r) {\n        $sum = $numbers[$l] + $numbers[$r];\n        if ($sum === $target) return array($l + 1, $r + 1);\n        if ($sum < $target) $l++;\n        else $r--;\n    }\n    return array(-1, -1);\n}`,
              ruby: `def twoSum(numbers, target)\n  l = 0\n  r = numbers.length - 1\n  while l < r\n    sum = numbers[l] + numbers[r]\n    return [l + 1, r + 1] if sum == target\n    if sum < target\n      l += 1\n    else\n      r -= 1\n    end\n  end\n  [-1, -1]\nend`,
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
      editorial: explain({
        idea: "The area of a container is `min(height[l], height[r]) * (r - l)` — bounded by the **shorter** wall. Start at the widest pair and always move the shorter wall inward. Moving the taller one is provably pointless, so a single sweep finds the maximum.",
        steps: [
          "Put `l` at the first line and `r` at the last, and track the best area seen.",
          "Compute `min(height[l], height[r]) * (r - l)` and update the best.",
          "Move whichever pointer refers to the **shorter** line inward.",
          "Stop when the pointers meet.",
        ],
        why: "Suppose `height[l] < height[r]`. Any container using `l` with a closer right wall has width strictly less than `r - l` and height still capped by `height[l]`, so its area is strictly smaller — every pair involving `l` other than the current one is already beaten. Discarding `l` therefore loses nothing, and by symmetry the same holds for `r` when it is shorter. Each step retires one index, so all candidates that could win are examined in linear time.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Move the **shorter** side. Moving the taller one can skip the optimum, since the shorter side keeps capping the height.",
          "The height is the `min` of the two walls, not the max or the sum.",
          "When the two walls are equal it does not matter which you move — the same argument rules out both.",
          "Width is the index distance `r - l`, not `r - l + 1`.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef maxArea(height: List[int]) -> int:\n    l, r = 0, len(height) - 1\n    best = 0\n    while l < r:\n        best = max(best, min(height[l], height[r]) * (r - l))\n        if height[l] < height[r]:\n            l += 1\n        else:\n            r -= 1\n    return best`,
        javascript: `var maxArea = function(height) {\n    let l = 0, r = height.length - 1, best = 0;\n    while (l < r) {\n        best = Math.max(best, Math.min(height[l], height[r]) * (r - l));\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return best;\n};`,
              typescript: `function maxArea(height: number[]): number {\n    let l = 0;\n    let r = height.length - 1;\n    let best = 0;\n    while (l < r) {\n        const h = Math.min(height[l], height[r]);\n        const area = h * (r - l);\n        if (area > best) best = area;\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return best;\n}`,
              java: `public static int maxArea(int[] height) {\n    int l = 0, r = height.length - 1, best = 0;\n    while (l < r) {\n        int h = Math.min(height[l], height[r]);\n        int area = h * (r - l);\n        if (area > best) best = area;\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return best;\n}`,
              cpp: `int maxArea(vector<int>& height) {\n    int l = 0, r = (int) height.size() - 1, best = 0;\n    while (l < r) {\n        int h = min(height[l], height[r]);\n        int area = h * (r - l);\n        if (area > best) best = area;\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return best;\n}`,
              c: `int maxArea(int* height, int heightSize) {\n    int l = 0, r = heightSize - 1, best = 0;\n    while (l < r) {\n        int h = height[l] < height[r] ? height[l] : height[r];\n        int area = h * (r - l);\n        if (area > best) best = area;\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return best;\n}`,
              csharp: `public static int MaxArea(int[] height)\n{\n    int l = 0, r = height.Length - 1, best = 0;\n    while (l < r)\n    {\n        int h = Math.Min(height[l], height[r]);\n        int area = h * (r - l);\n        if (area > best) best = area;\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return best;\n}`,
              go: `func maxArea(height []int) int {\n	l, r, best := 0, len(height)-1, 0\n	for l < r {\n		h := height[l]\n		if height[r] < h {\n			h = height[r]\n		}\n		area := h * (r - l)\n		if area > best {\n			best = area\n		}\n		if height[l] < height[r] {\n			l++\n		} else {\n			r--\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxArea(height: IntArray): Int {\n    var l = 0\n    var r = height.size - 1\n    var best = 0\n    while (l < r) {\n        val h = minOf(height[l], height[r])\n        val area = h * (r - l)\n        if (area > best) best = area\n        if (height[l] < height[r]) l++ else r--\n    }\n    return best\n}`,
              swift: `func maxArea(_ height: [Int]) -> Int {\n    var l = 0\n    var r = height.count - 1\n    var best = 0\n    while l < r {\n        let h = min(height[l], height[r])\n        let area = h * (r - l)\n        if area > best { best = area }\n        if height[l] < height[r] { l += 1 } else { r -= 1 }\n    }\n    return best\n}`,
              rust: `fn maxArea(height: Vec<i32>) -> i32 {\n    let mut l = 0usize;\n    let mut r = height.len() - 1;\n    let mut best = 0;\n    while l < r {\n        let h = if height[l] < height[r] { height[l] } else { height[r] };\n        let area = h * ((r - l) as i32);\n        if area > best {\n            best = area;\n        }\n        if height[l] < height[r] {\n            l += 1;\n        } else {\n            r -= 1;\n        }\n    }\n    best\n}`,
              php: `function maxArea($height) {\n    $l = 0;\n    $r = count($height) - 1;\n    $best = 0;\n    while ($l < $r) {\n        $h = min($height[$l], $height[$r]);\n        $area = $h * ($r - $l);\n        if ($area > $best) $best = $area;\n        if ($height[$l] < $height[$r]) $l++;\n        else $r--;\n    }\n    return $best;\n}`,
              ruby: `def maxArea(height)\n  l = 0\n  r = height.length - 1\n  best = 0\n  while l < r\n    h = [height[l], height[r]].min\n    area = h * (r - l)\n    best = area if area > best\n    if height[l] < height[r]\n      l += 1\n    else\n      r -= 1\n    end\n  end\n  best\nend`,
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
      editorial: explain({
        idea: "A subsequence keeps order but allows gaps, so matching is greedy: walk `t` once and, whenever the current character is the one you are waiting for in `s`, consume it. Taking the **earliest** possible match is always safe, so no backtracking is ever needed.",
        steps: [
          "Keep an index `i` into `s`, starting at zero.",
          "Scan `t` from left to right.",
          "If `i` is still in range and `t`'s current character equals `s[i]`, advance `i`.",
          "After the scan, `s` is a subsequence exactly when `i` reached the end of `s`.",
        ],
        why: "Matching `s[i]` at the earliest opportunity is optimal by an exchange argument: if some valid embedding matches `s[i]` later, moving that match earlier still leaves every subsequent character of `s` available — the remaining suffix of `t` is only larger. So greedy never forfeits a match that exists, meaning failure to consume all of `s` proves no embedding exists at all.",
        time: "O(|t|)",
        space: "O(1)",
        pitfalls: [
          "Guard `i` against running past the end of `s` before comparing, or the last matches read out of bounds.",
          "An empty `s` is a subsequence of anything — the check `i == |s|` handles it with no special case.",
          "Do not advance `i` on a mismatch; only `t` moves unconditionally.",
          "Never restart the scan on a mismatch — that is the `O(n·m)` trap this greedy avoids.",
        ],
      }),
      solutions: {
        python: `def isSubsequence(s: str, t: str) -> bool:\n    i = 0\n    for ch in t:\n        if i < len(s) and s[i] == ch:\n            i += 1\n    return i == len(s)`,
        javascript: `var isSubsequence = function(s, t) {\n    let i = 0;\n    for (const ch of t) {\n        if (i < s.length && s[i] === ch) i++;\n    }\n    return i === s.length;\n};`,
              typescript: `function isSubsequence(s: string, t: string): boolean {\n    let i = 0;\n    for (let j = 0; j < t.length; j++) {\n        if (i < s.length && s[i] === t[j]) i++;\n    }\n    return i === s.length;\n}`,
              java: `public static boolean isSubsequence(String s, String t) {\n    int i = 0;\n    for (int j = 0; j < t.length(); j++) {\n        if (i < s.length() && s.charAt(i) == t.charAt(j)) i++;\n    }\n    return i == s.length();\n}`,
              cpp: `bool isSubsequence(string s, string t) {\n    size_t i = 0;\n    for (size_t j = 0; j < t.size(); j++) {\n        if (i < s.size() && s[i] == t[j]) i++;\n    }\n    return i == s.size();\n}`,
              c: `bool isSubsequence(const char* s, const char* t) {\n    int sl = (int) strlen(s);\n    int tl = (int) strlen(t);\n    int i = 0;\n    for (int j = 0; j < tl; j++) {\n        if (i < sl && s[i] == t[j]) i++;\n    }\n    return i == sl;\n}`,
              csharp: `public static bool IsSubsequence(string s, string t)\n{\n    int i = 0;\n    for (int j = 0; j < t.Length; j++)\n    {\n        if (i < s.Length && s[i] == t[j]) i++;\n    }\n    return i == s.Length;\n}`,
              go: `func isSubsequence(s string, t string) bool {\n	i := 0\n	for j := 0; j < len(t); j++ {\n		if i < len(s) && s[i] == t[j] {\n			i++\n		}\n	}\n	return i == len(s)\n}`,
              kotlin: `fun isSubsequence(s: String, t: String): Boolean {\n    var i = 0\n    for (j in t.indices) {\n        if (i < s.length && s[i] == t[j]) i++\n    }\n    return i == s.length\n}`,
              swift: `func isSubsequence(_ s: String, _ t: String) -> Bool {\n    let sc = Array(s)\n    let tc = Array(t)\n    var i = 0\n    for j in 0..<tc.count {\n        if i < sc.count && sc[i] == tc[j] { i += 1 }\n    }\n    return i == sc.count\n}`,
              rust: `fn isSubsequence(s: String, t: String) -> bool {\n    let sb: Vec<u8> = s.bytes().collect();\n    let tb: Vec<u8> = t.bytes().collect();\n    let mut i = 0;\n    for j in 0..tb.len() {\n        if i < sb.len() && sb[i] == tb[j] {\n            i += 1;\n        }\n    }\n    i == sb.len()\n}`,
              php: `function isSubsequence($s, $t) {\n    $i = 0;\n    $sl = strlen($s);\n    $tl = strlen($t);\n    for ($j = 0; $j < $tl; $j++) {\n        if ($i < $sl && $s[$i] === $t[$j]) $i++;\n    }\n    return $i === $sl;\n}`,
              ruby: `def isSubsequence(s, t)\n  i = 0\n  t.each_char do |ch|\n    i += 1 if i < s.length && s[i] == ch\n  end\n  i == s.length\nend`,
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
      editorial: explain({
        idea: "Run the ordinary two-pointer palindrome check. It either finishes cleanly — already a palindrome, zero deletions used — or it hits the **first** mismatch. At that point exactly one deletion is allowed, and only two candidates make sense: drop the left character or drop the right one. Test both as plain palindrome checks.",
        steps: [
          "Walk `l` from the front and `r` from the back while the characters match.",
          "If they always match, return `true`.",
          "On the first mismatch, check whether `s[l+1 .. r]` is a palindrome, or `s[l .. r-1]` is.",
          "Return `true` if either holds — that is the single allowed deletion.",
          "Otherwise return `false`.",
        ],
        why: "Everything outside the current window has already been matched in pairs, so it cannot be improved by a deletion — a deletion there would only unbalance the pairing. At the mismatch, the two characters cannot both stay, so any valid solution must remove one of them; there is no third option. Since only one deletion is permitted, both branches reduce to an exact palindrome check with no budget left, which is why the recursion never goes deeper than one level.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Both branches must be tried — dropping only the left character misses cases like `\"cbbcc\"` where the right one is the culprit.",
          "The helper checks a **plain** palindrome with no remaining budget; allowing another deletion solves a different problem.",
          "Only the first mismatch matters; continuing the scan past it conflates independent decisions.",
          "Single characters and empty ranges are palindromes, which the loop bounds already handle.",
        ],
      }),
      solutions: {
        python: `def validPalindrome(s: str) -> bool:\n    def is_pal(l: int, r: int) -> bool:\n        while l < r:\n            if s[l] != s[r]:\n                return False\n            l += 1\n            r -= 1\n        return True\n\n    l, r = 0, len(s) - 1\n    while l < r:\n        if s[l] != s[r]:\n            return is_pal(l + 1, r) or is_pal(l, r - 1)\n        l += 1\n        r -= 1\n    return True`,
        javascript: `var validPalindrome = function(s) {\n    function isPal(l, r) {\n        while (l < r) {\n            if (s[l] !== s[r]) return false;\n            l++; r--;\n        }\n        return true;\n    }\n    let l = 0, r = s.length - 1;\n    while (l < r) {\n        if (s[l] !== s[r]) return isPal(l + 1, r) || isPal(l, r - 1);\n        l++; r--;\n    }\n    return true;\n};`,
              typescript: `function validPalindrome(s: string): boolean {\n    function isPal(lo: number, hi: number): boolean {\n        while (lo < hi) {\n            if (s[lo] !== s[hi]) return false;\n            lo++;\n            hi--;\n        }\n        return true;\n    }\n    let l = 0;\n    let r = s.length - 1;\n    while (l < r) {\n        if (s[l] !== s[r]) return isPal(l + 1, r) || isPal(l, r - 1);\n        l++;\n        r--;\n    }\n    return true;\n}`,
              java: `public static boolean validPalindrome(String s) {\n    int l = 0, r = s.length() - 1;\n    while (l < r) {\n        if (s.charAt(l) != s.charAt(r)) return isPalVP(s, l + 1, r) || isPalVP(s, l, r - 1);\n        l++;\n        r--;\n    }\n    return true;\n}\n\nprivate static boolean isPalVP(String s, int lo, int hi) {\n    while (lo < hi) {\n        if (s.charAt(lo) != s.charAt(hi)) return false;\n        lo++;\n        hi--;\n    }\n    return true;\n}`,
              cpp: `bool isPalVP(const string& s, int lo, int hi) {\n    while (lo < hi) {\n        if (s[lo] != s[hi]) return false;\n        lo++;\n        hi--;\n    }\n    return true;\n}\n\nbool validPalindrome(string s) {\n    int l = 0, r = (int) s.size() - 1;\n    while (l < r) {\n        if (s[l] != s[r]) return isPalVP(s, l + 1, r) || isPalVP(s, l, r - 1);\n        l++;\n        r--;\n    }\n    return true;\n}`,
              c: `static bool isPalVP(const char* s, int lo, int hi) {\n    while (lo < hi) {\n        if (s[lo] != s[hi]) return false;\n        lo++;\n        hi--;\n    }\n    return true;\n}\n\nbool validPalindrome(const char* s) {\n    int l = 0, r = (int) strlen(s) - 1;\n    while (l < r) {\n        if (s[l] != s[r]) return isPalVP(s, l + 1, r) || isPalVP(s, l, r - 1);\n        l++;\n        r--;\n    }\n    return true;\n}`,
              csharp: `public static bool ValidPalindrome(string s)\n{\n    int l = 0, r = s.Length - 1;\n    while (l < r)\n    {\n        if (s[l] != s[r]) return IsPalVP(s, l + 1, r) || IsPalVP(s, l, r - 1);\n        l++;\n        r--;\n    }\n    return true;\n}\n\nprivate static bool IsPalVP(string s, int lo, int hi)\n{\n    while (lo < hi)\n    {\n        if (s[lo] != s[hi]) return false;\n        lo++;\n        hi--;\n    }\n    return true;\n}`,
              go: `func validPalindrome(s string) bool {\n	isPal := func(lo int, hi int) bool {\n		for lo < hi {\n			if s[lo] != s[hi] {\n				return false\n			}\n			lo++\n			hi--\n		}\n		return true\n	}\n	l, r := 0, len(s)-1\n	for l < r {\n		if s[l] != s[r] {\n			return isPal(l+1, r) || isPal(l, r-1)\n		}\n		l++\n		r--\n	}\n	return true\n}`,
              kotlin: `fun validPalindrome(s: String): Boolean {\n    fun isPal(start: Int, end: Int): Boolean {\n        var lo = start\n        var hi = end\n        while (lo < hi) {\n            if (s[lo] != s[hi]) return false\n            lo++\n            hi--\n        }\n        return true\n    }\n    var l = 0\n    var r = s.length - 1\n    while (l < r) {\n        if (s[l] != s[r]) return isPal(l + 1, r) || isPal(l, r - 1)\n        l++\n        r--\n    }\n    return true\n}`,
              swift: `func validPalindrome(_ s: String) -> Bool {\n    let c = Array(s)\n    func isPal(_ start: Int, _ end: Int) -> Bool {\n        var lo = start\n        var hi = end\n        while lo < hi {\n            if c[lo] != c[hi] { return false }\n            lo += 1\n            hi -= 1\n        }\n        return true\n    }\n    var l = 0\n    var r = c.count - 1\n    while l < r {\n        if c[l] != c[r] { return isPal(l + 1, r) || isPal(l, r - 1) }\n        l += 1\n        r -= 1\n    }\n    return true\n}`,
              rust: `fn validPalindrome(s: String) -> bool {\n    fn is_pal(b: &Vec<u8>, mut lo: usize, mut hi: usize) -> bool {\n        while lo < hi {\n            if b[lo] != b[hi] {\n                return false;\n            }\n            lo += 1;\n            hi -= 1;\n        }\n        true\n    }\n    let b: Vec<u8> = s.bytes().collect();\n    let mut l = 0usize;\n    let mut r = b.len() - 1;\n    while l < r {\n        if b[l] != b[r] {\n            return is_pal(&b, l + 1, r) || is_pal(&b, l, r - 1);\n        }\n        l += 1;\n        r -= 1;\n    }\n    true\n}`,
              php: `function validPalindrome($s) {\n    $l = 0;\n    $r = strlen($s) - 1;\n    while ($l < $r) {\n        if ($s[$l] !== $s[$r]) return vpIsPal($s, $l + 1, $r) || vpIsPal($s, $l, $r - 1);\n        $l++;\n        $r--;\n    }\n    return true;\n}\n\nfunction vpIsPal($s, $lo, $hi) {\n    while ($lo < $hi) {\n        if ($s[$lo] !== $s[$hi]) return false;\n        $lo++;\n        $hi--;\n    }\n    return true;\n}`,
              ruby: `def validPalindrome(s)\n  is_pal = lambda do |lo, hi|\n    while lo < hi\n      return false if s[lo] != s[hi]\n      lo += 1\n      hi -= 1\n    end\n    true\n  end\n  l = 0\n  r = s.length - 1\n  while l < r\n    if s[l] != s[r]\n      return is_pal.call(l + 1, r) || is_pal.call(l, r - 1)\n    end\n    l += 1\n    r -= 1\n  end\n  true\nend`,
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
      editorial: explain({
        idea: "All values are **positive**, which is what makes a sliding window valid: extending the window strictly increases the sum and shrinking it strictly decreases it. So grow the window until it reaches the target, then shrink from the left as far as it still qualifies, recording the length each time.",
        steps: [
          "Keep a left edge `l`, a running `sum`, and the best length found (start it at infinity).",
          "Advance the right edge `r`, adding `nums[r]` to `sum`.",
          "While `sum >= target`, record the window length `r - l + 1` and then remove `nums[l]`, advancing `l`.",
          "Continue to the end of the array.",
          "Return the best length, or `0` if the window never qualified.",
        ],
        why: "Positivity gives monotonicity, so for each right edge there is a single leftmost `l` at which the window still meets the target — and the inner loop walks exactly to it. Every candidate subarray is therefore represented by the shortest window ending at some `r`, and the minimum over those is the global minimum. Each index enters and leaves the window once, so despite the nested loop the sweep is linear.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The condition is `>= target`, not `==` — an exact hit is not required.",
          "Shrink inside a `while`, not an `if`; one long value can allow several left advances at once.",
          "Return `0` when no window qualifies, not the infinite sentinel.",
          "This window relies on all values being positive. With negatives the monotonicity fails and prefix sums are needed instead.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef minSubArrayLen(target: int, nums: List[int]) -> int:\n    l = 0\n    total = 0\n    best = float("inf")\n    for r, x in enumerate(nums):\n        total += x\n        while total >= target:\n            best = min(best, r - l + 1)\n            total -= nums[l]\n            l += 1\n    return 0 if best == float("inf") else best`,
        javascript: `var minSubArrayLen = function(target, nums) {\n    let l = 0, sum = 0, best = Infinity;\n    for (let r = 0; r < nums.length; r++) {\n        sum += nums[r];\n        while (sum >= target) {\n            best = Math.min(best, r - l + 1);\n            sum -= nums[l++];\n        }\n    }\n    return best === Infinity ? 0 : best;\n};`,
              typescript: `function minSubArrayLen(target: number, nums: number[]): number {\n    let l = 0;\n    let sum = 0;\n    let best = nums.length + 1;\n    for (let r = 0; r < nums.length; r++) {\n        sum += nums[r];\n        while (sum >= target) {\n            if (r - l + 1 < best) best = r - l + 1;\n            sum -= nums[l];\n            l++;\n        }\n    }\n    return best === nums.length + 1 ? 0 : best;\n}`,
              java: `public static int minSubArrayLen(int target, int[] nums) {\n    int l = 0, sum = 0, best = nums.length + 1;\n    for (int r = 0; r < nums.length; r++) {\n        sum += nums[r];\n        while (sum >= target) {\n            if (r - l + 1 < best) best = r - l + 1;\n            sum -= nums[l];\n            l++;\n        }\n    }\n    return best == nums.length + 1 ? 0 : best;\n}`,
              cpp: `int minSubArrayLen(int target, vector<int>& nums) {\n    int n = (int) nums.size();\n    int l = 0, sum = 0, best = n + 1;\n    for (int r = 0; r < n; r++) {\n        sum += nums[r];\n        while (sum >= target) {\n            if (r - l + 1 < best) best = r - l + 1;\n            sum -= nums[l];\n            l++;\n        }\n    }\n    return best == n + 1 ? 0 : best;\n}`,
              c: `int minSubArrayLen(int target, int* nums, int numsSize) {\n    int l = 0, sum = 0, best = numsSize + 1;\n    for (int r = 0; r < numsSize; r++) {\n        sum += nums[r];\n        while (sum >= target) {\n            if (r - l + 1 < best) best = r - l + 1;\n            sum -= nums[l];\n            l++;\n        }\n    }\n    return best == numsSize + 1 ? 0 : best;\n}`,
              csharp: `public static int MinSubArrayLen(int target, int[] nums)\n{\n    int l = 0, sum = 0, best = nums.Length + 1;\n    for (int r = 0; r < nums.Length; r++)\n    {\n        sum += nums[r];\n        while (sum >= target)\n        {\n            if (r - l + 1 < best) best = r - l + 1;\n            sum -= nums[l];\n            l++;\n        }\n    }\n    return best == nums.Length + 1 ? 0 : best;\n}`,
              go: `func minSubArrayLen(target int, nums []int) int {\n	n := len(nums)\n	l, sum, best := 0, 0, n+1\n	for r := 0; r < n; r++ {\n		sum += nums[r]\n		for sum >= target {\n			if r-l+1 < best {\n				best = r - l + 1\n			}\n			sum -= nums[l]\n			l++\n		}\n	}\n	if best == n+1 {\n		return 0\n	}\n	return best\n}`,
              kotlin: `fun minSubArrayLen(target: Int, nums: IntArray): Int {\n    val n = nums.size\n    var l = 0\n    var sum = 0\n    var best = n + 1\n    for (r in 0 until n) {\n        sum += nums[r]\n        while (sum >= target) {\n            if (r - l + 1 < best) best = r - l + 1\n            sum -= nums[l]\n            l++\n        }\n    }\n    return if (best == n + 1) 0 else best\n}`,
              swift: `func minSubArrayLen(_ target: Int, _ nums: [Int]) -> Int {\n    let n = nums.count\n    var l = 0\n    var sum = 0\n    var best = n + 1\n    for r in 0..<n {\n        sum += nums[r]\n        while sum >= target {\n            if r - l + 1 < best { best = r - l + 1 }\n            sum -= nums[l]\n            l += 1\n        }\n    }\n    return best == n + 1 ? 0 : best\n}`,
              rust: `fn minSubArrayLen(target: i32, nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut l = 0usize;\n    let mut sum = 0;\n    let mut best = n + 1;\n    for r in 0..n {\n        sum += nums[r];\n        while sum >= target {\n            if r - l + 1 < best {\n                best = r - l + 1;\n            }\n            sum -= nums[l];\n            l += 1;\n        }\n    }\n    if best == n + 1 { 0 } else { best as i32 }\n}`,
              php: `function minSubArrayLen($target, $nums) {\n    $n = count($nums);\n    $l = 0;\n    $sum = 0;\n    $best = $n + 1;\n    for ($r = 0; $r < $n; $r++) {\n        $sum += $nums[$r];\n        while ($sum >= $target) {\n            if ($r - $l + 1 < $best) $best = $r - $l + 1;\n            $sum -= $nums[$l];\n            $l++;\n        }\n    }\n    return $best === $n + 1 ? 0 : $best;\n}`,
              ruby: `def minSubArrayLen(target, nums)\n  n = nums.length\n  l = 0\n  sum = 0\n  best = n + 1\n  (0...n).each do |r|\n    sum += nums[r]\n    while sum >= target\n      best = r - l + 1 if r - l + 1 < best\n      sum -= nums[l]\n      l += 1\n    end\n  end\n  best == n + 1 ? 0 : best\nend`,
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
      editorial: explain({
        idea: "\"Flip at most `k` zeros\" is the same as \"find the longest window containing at most `k` zeros\" — you never need to decide *which* zeros to flip, only how many the window holds. Slide a window that maintains that invariant and track its largest size.",
        steps: [
          "Keep a left edge `l` and a count of zeros inside the window.",
          "Advance the right edge `r`, incrementing the zero count when `nums[r]` is `0`.",
          "While the count exceeds `k`, advance `l`, decrementing the count as it passes a zero.",
          "After restoring the invariant, update the best with `r - l + 1`.",
          "The largest window seen is the answer.",
        ],
        why: "Once the window holds at most `k` zeros, flipping exactly those zeros makes the whole window ones, so its length is achievable. Conversely any achievable run of ones corresponds to a window with at most `k` zeros, so the two quantities coincide and maximising one maximises the other. The window never needs to shrink except to restore the invariant, and each index enters and leaves once, keeping the sweep linear.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Measure the window **after** restoring the invariant, or you record lengths that use too many flips.",
          "Only decrement the zero count when the element leaving is actually a zero.",
          "`k = 0` is legal and reduces to the longest existing run of ones.",
          "The window length is `r - l + 1`, and the answer is the maximum over all valid windows.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef longestOnes(nums: List[int], k: int) -> int:\n    l = 0\n    zeros = 0\n    best = 0\n    for r, x in enumerate(nums):\n        if x == 0:\n            zeros += 1\n        while zeros > k:\n            if nums[l] == 0:\n                zeros -= 1\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var longestOnes = function(nums, k) {\n    let l = 0, zeros = 0, best = 0;\n    for (let r = 0; r < nums.length; r++) {\n        if (nums[r] === 0) zeros++;\n        while (zeros > k) {\n            if (nums[l] === 0) zeros--;\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n};`,
              typescript: `function longestOnes(nums: number[], k: number): number {\n    let l = 0;\n    let zeros = 0;\n    let best = 0;\n    for (let r = 0; r < nums.length; r++) {\n        if (nums[r] === 0) zeros++;\n        while (zeros > k) {\n            if (nums[l] === 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              java: `public static int longestOnes(int[] nums, int k) {\n    int l = 0, zeros = 0, best = 0;\n    for (int r = 0; r < nums.length; r++) {\n        if (nums[r] == 0) zeros++;\n        while (zeros > k) {\n            if (nums[l] == 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              cpp: `int longestOnes(vector<int>& nums, int k) {\n    int l = 0, zeros = 0, best = 0;\n    for (int r = 0; r < (int) nums.size(); r++) {\n        if (nums[r] == 0) zeros++;\n        while (zeros > k) {\n            if (nums[l] == 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              c: `int longestOnes(int* nums, int numsSize, int k) {\n    int l = 0, zeros = 0, best = 0;\n    for (int r = 0; r < numsSize; r++) {\n        if (nums[r] == 0) zeros++;\n        while (zeros > k) {\n            if (nums[l] == 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              csharp: `public static int LongestOnes(int[] nums, int k)\n{\n    int l = 0, zeros = 0, best = 0;\n    for (int r = 0; r < nums.Length; r++)\n    {\n        if (nums[r] == 0) zeros++;\n        while (zeros > k)\n        {\n            if (nums[l] == 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              go: `func longestOnes(nums []int, k int) int {\n	l, zeros, best := 0, 0, 0\n	for r := 0; r < len(nums); r++ {\n		if nums[r] == 0 {\n			zeros++\n		}\n		for zeros > k {\n			if nums[l] == 0 {\n				zeros--\n			}\n			l++\n		}\n		if r-l+1 > best {\n			best = r - l + 1\n		}\n	}\n	return best\n}`,
              kotlin: `fun longestOnes(nums: IntArray, k: Int): Int {\n    var l = 0\n    var zeros = 0\n    var best = 0\n    for (r in nums.indices) {\n        if (nums[r] == 0) zeros++\n        while (zeros > k) {\n            if (nums[l] == 0) zeros--\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
              swift: `func longestOnes(_ nums: [Int], _ k: Int) -> Int {\n    var l = 0\n    var zeros = 0\n    var best = 0\n    for r in 0..<nums.count {\n        if nums[r] == 0 { zeros += 1 }\n        while zeros > k {\n            if nums[l] == 0 { zeros -= 1 }\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,

        rust: `fn longestOnes(nums: Vec<i32>, k: i32) -> i32 {\n    let mut l = 0usize;\n    let mut zeros = 0;\n    let mut best = 0;\n    for r in 0..nums.len() {\n        if nums[r] == 0 {\n            zeros += 1;\n        }\n        while zeros > k {\n            if nums[l] == 0 {\n                zeros -= 1;\n            }\n            l += 1;\n        }\n        // \`l\` can reach \`r + 1\` (an empty window when k == 0), so compute the\n        // length as \`r + 1 - l\` — \`r - l\` would underflow usize first.\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
              php: `function longestOnes($nums, $k) {\n    $l = 0;\n    $zeros = 0;\n    $best = 0;\n    $n = count($nums);\n    for ($r = 0; $r < $n; $r++) {\n        if ($nums[$r] === 0) $zeros++;\n        while ($zeros > $k) {\n            if ($nums[$l] === 0) $zeros--;\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
              ruby: `def longestOnes(nums, k)\n  l = 0\n  zeros = 0\n  best = 0\n  (0...nums.length).each do |r|\n    zeros += 1 if nums[r] == 0\n    while zeros > k\n      zeros -= 1 if nums[l] == 0\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
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
      editorial: explain({
        idea: "Strip away the story and this is \"longest contiguous subarray containing at most **two distinct** values\". Two baskets means two allowed types; picking until a third appears means the window must stay within that limit. Slide a window, keeping a count per type, and shrink whenever a third type sneaks in.",
        steps: [
          "Keep a frequency table for the types inside the window plus a count of how many distinct types it holds.",
          "Advance the right edge; if the incoming type was absent, the distinct count grows.",
          "While the distinct count exceeds two, advance the left edge, decrementing that type's frequency and lowering the distinct count when it hits zero.",
          "Record the window length once the invariant holds again.",
          "The largest such window is the answer.",
        ],
        why: "Every valid picking run is a contiguous block with at most two types, and every such block is a valid run — so the two maxima coincide. The window only shrinks to restore the invariant, never speculatively, so for each right edge it holds the longest valid block ending there; taking the maximum over all right edges covers every candidate. Each index enters and leaves once, keeping it linear despite the inner loop.",
        time: "O(n)",
        space: "O(1) — at most three types are ever tracked",
        pitfalls: [
          "Decrement the distinct count only when a type's frequency actually reaches zero, not on every removal.",
          "Measure the window after restoring the invariant, or you count runs that need three baskets.",
          "You may start at any tree, which is exactly what makes this a subarray problem rather than a prefix one.",
          "Fewer than two distinct types in the whole array is fine — the answer is then the entire array.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef totalFruit(fruits: List[int]) -> int:\n    count = {}\n    l = 0\n    best = 0\n    for r, f in enumerate(fruits):\n        count[f] = count.get(f, 0) + 1\n        while len(count) > 2:\n            g = fruits[l]\n            count[g] -= 1\n            if count[g] == 0:\n                del count[g]\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var totalFruit = function(fruits) {\n    const count = new Map();\n    let l = 0, best = 0;\n    for (let r = 0; r < fruits.length; r++) {\n        count.set(fruits[r], (count.get(fruits[r]) || 0) + 1);\n        while (count.size > 2) {\n            const f = fruits[l];\n            count.set(f, count.get(f) - 1);\n            if (count.get(f) === 0) count.delete(f);\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n};`,
              typescript: `function totalFruit(fruits: number[]): number {\n    const count: { [t: number]: number } = {};\n    let distinct = 0;\n    let l = 0;\n    let best = 0;\n    for (let r = 0; r < fruits.length; r++) {\n        const t = fruits[r];\n        if (count[t] === undefined || count[t] === 0) distinct++;\n        count[t] = (count[t] === undefined ? 0 : count[t]) + 1;\n        while (distinct > 2) {\n            const u = fruits[l];\n            count[u]--;\n            if (count[u] === 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              java: `public static int totalFruit(int[] fruits) {\n    int[] count = new int[64];\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < fruits.length; r++) {\n        if (count[fruits[r]] == 0) distinct++;\n        count[fruits[r]]++;\n        while (distinct > 2) {\n            count[fruits[l]]--;\n            if (count[fruits[l]] == 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              cpp: `int totalFruit(vector<int>& fruits) {\n    vector<int> count(64, 0);\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < (int) fruits.size(); r++) {\n        if (count[fruits[r]] == 0) distinct++;\n        count[fruits[r]]++;\n        while (distinct > 2) {\n            count[fruits[l]]--;\n            if (count[fruits[l]] == 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              c: `int totalFruit(int* fruits, int fruitsSize) {\n    int count[64];\n    for (int i = 0; i < 64; i++) count[i] = 0;\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < fruitsSize; r++) {\n        if (count[fruits[r]] == 0) distinct++;\n        count[fruits[r]]++;\n        while (distinct > 2) {\n            count[fruits[l]]--;\n            if (count[fruits[l]] == 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              csharp: `public static int TotalFruit(int[] fruits)\n{\n    int[] count = new int[64];\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < fruits.Length; r++)\n    {\n        if (count[fruits[r]] == 0) distinct++;\n        count[fruits[r]]++;\n        while (distinct > 2)\n        {\n            count[fruits[l]]--;\n            if (count[fruits[l]] == 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              go: `func totalFruit(fruits []int) int {\n	count := make([]int, 64)\n	distinct, l, best := 0, 0, 0\n	for r := 0; r < len(fruits); r++ {\n		if count[fruits[r]] == 0 {\n			distinct++\n		}\n		count[fruits[r]]++\n		for distinct > 2 {\n			count[fruits[l]]--\n			if count[fruits[l]] == 0 {\n				distinct--\n			}\n			l++\n		}\n		if r-l+1 > best {\n			best = r - l + 1\n		}\n	}\n	return best\n}`,
              kotlin: `fun totalFruit(fruits: IntArray): Int {\n    val count = IntArray(64)\n    var distinct = 0\n    var l = 0\n    var best = 0\n    for (r in fruits.indices) {\n        if (count[fruits[r]] == 0) distinct++\n        count[fruits[r]]++\n        while (distinct > 2) {\n            count[fruits[l]]--\n            if (count[fruits[l]] == 0) distinct--\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
              swift: `func totalFruit(_ fruits: [Int]) -> Int {\n    var count = [Int](repeating: 0, count: 64)\n    var distinct = 0\n    var l = 0\n    var best = 0\n    for r in 0..<fruits.count {\n        if count[fruits[r]] == 0 { distinct += 1 }\n        count[fruits[r]] += 1\n        while distinct > 2 {\n            count[fruits[l]] -= 1\n            if count[fruits[l]] == 0 { distinct -= 1 }\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
              rust: `fn totalFruit(fruits: Vec<i32>) -> i32 {\n    let mut count = vec![0i32; 64];\n    let mut distinct = 0;\n    let mut l = 0usize;\n    let mut best = 0;\n    for r in 0..fruits.len() {\n        let t = fruits[r] as usize;\n        if count[t] == 0 {\n            distinct += 1;\n        }\n        count[t] += 1;\n        while distinct > 2 {\n            let u = fruits[l] as usize;\n            count[u] -= 1;\n            if count[u] == 0 {\n                distinct -= 1;\n            }\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
              php: `function totalFruit($fruits) {\n    $count = array_fill(0, 64, 0);\n    $distinct = 0;\n    $l = 0;\n    $best = 0;\n    $n = count($fruits);\n    for ($r = 0; $r < $n; $r++) {\n        if ($count[$fruits[$r]] === 0) $distinct++;\n        $count[$fruits[$r]]++;\n        while ($distinct > 2) {\n            $count[$fruits[$l]]--;\n            if ($count[$fruits[$l]] === 0) $distinct--;\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
              ruby: `def totalFruit(fruits)\n  count = Array.new(64, 0)\n  distinct = 0\n  l = 0\n  best = 0\n  (0...fruits.length).each do |r|\n    distinct += 1 if count[fruits[r]] == 0\n    count[fruits[r]] += 1\n    while distinct > 2\n      count[fruits[l]] -= 1\n      distinct -= 1 if count[fruits[l]] == 0\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
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
      editorial: explain({
        idea: "With only three possible values you can sort in a single pass using the **Dutch National Flag** partition. Maintain three regions — settled `0`s at the front, settled `2`s at the back, and `1`s in between — and grow them with one scanning pointer and two boundaries.",
        steps: [
          "Keep `low` (end of the zeros region), `mid` (the scanner) and `high` (start of the twos region).",
          "While `mid <= high`, look at `nums[mid]`.",
          "If it is `0`, swap it into the zeros region: swap with `low`, then advance **both** `low` and `mid`.",
          "If it is `1`, it already belongs in the middle — just advance `mid`.",
          "If it is `2`, swap it back to `high` and decrement `high`, **without** advancing `mid` — the value swapped in is unexamined.",
        ],
        why: "The invariant is that everything before `low` is `0`, everything between `low` and `mid` is `1`, and everything after `high` is `2`. Each branch restores it while shrinking the unexamined region `[mid, high]`. The asymmetry is the crux: a swap with `low` brings back a value already known to be `1` (or `mid == low`), so it is safe to step over, whereas a swap with `high` brings back something never inspected, which must be re-examined.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Do **not** advance `mid` after swapping with `high` — the incoming value is unclassified and skipping it leaves the array unsorted.",
          "The loop condition is `mid <= high`, inclusive; stopping at `<` leaves the final element unplaced.",
          "Counting the three values and rewriting the array also works and is arguably simpler, but takes two passes.",
          "In languages with unsigned indices, `high` can fall below zero — keep the indices signed.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef sortColors(nums: List[int]) -> List[int]:\n    low, mid, high = 0, 0, len(nums) - 1\n    while mid <= high:\n        if nums[mid] == 0:\n            nums[low], nums[mid] = nums[mid], nums[low]\n            low += 1\n            mid += 1\n        elif nums[mid] == 2:\n            nums[mid], nums[high] = nums[high], nums[mid]\n            high -= 1\n        else:\n            mid += 1\n    return nums`,
        javascript: `var sortColors = function(nums) {\n    let low = 0, mid = 0, high = nums.length - 1;\n    while (mid <= high) {\n        if (nums[mid] === 0) {\n            const t = nums[low]; nums[low] = nums[mid]; nums[mid] = t;\n            low++; mid++;\n        } else if (nums[mid] === 2) {\n            const t = nums[mid]; nums[mid] = nums[high]; nums[high] = t;\n            high--;\n        } else {\n            mid++;\n        }\n    }\n    return nums;\n};`,
              typescript: `function sortColors(nums: number[]): number[] {\n    let low = 0;\n    let mid = 0;\n    let high = nums.length - 1;\n    while (mid <= high) {\n        if (nums[mid] === 0) {\n            const t = nums[low];\n            nums[low] = nums[mid];\n            nums[mid] = t;\n            low++;\n            mid++;\n        } else if (nums[mid] === 1) {\n            mid++;\n        } else {\n            const t = nums[high];\n            nums[high] = nums[mid];\n            nums[mid] = t;\n            high--;\n        }\n    }\n    return nums;\n}`,
              java: `public static int[] sortColors(int[] nums) {\n    int low = 0, mid = 0, high = nums.length - 1;\n    while (mid <= high) {\n        if (nums[mid] == 0) {\n            int t = nums[low];\n            nums[low] = nums[mid];\n            nums[mid] = t;\n            low++;\n            mid++;\n        } else if (nums[mid] == 1) {\n            mid++;\n        } else {\n            int t = nums[high];\n            nums[high] = nums[mid];\n            nums[mid] = t;\n            high--;\n        }\n    }\n    return nums;\n}`,
              cpp: `vector<int> sortColors(vector<int>& nums) {\n    int low = 0, mid = 0, high = (int) nums.size() - 1;\n    while (mid <= high) {\n        if (nums[mid] == 0) {\n            swap(nums[low], nums[mid]);\n            low++;\n            mid++;\n        } else if (nums[mid] == 1) {\n            mid++;\n        } else {\n            swap(nums[mid], nums[high]);\n            high--;\n        }\n    }\n    return nums;\n}`,
              c: `int* sortColors(int* nums, int numsSize, int* returnSize) {\n    int low = 0, mid = 0, high = numsSize - 1;\n    while (mid <= high) {\n        if (nums[mid] == 0) {\n            int t = nums[low];\n            nums[low] = nums[mid];\n            nums[mid] = t;\n            low++;\n            mid++;\n        } else if (nums[mid] == 1) {\n            mid++;\n        } else {\n            int t = nums[high];\n            nums[high] = nums[mid];\n            nums[mid] = t;\n            high--;\n        }\n    }\n    *returnSize = numsSize;\n    return nums;\n}`,
              csharp: `public static int[] SortColors(int[] nums)\n{\n    int low = 0, mid = 0, high = nums.Length - 1;\n    while (mid <= high)\n    {\n        if (nums[mid] == 0)\n        {\n            int t = nums[low];\n            nums[low] = nums[mid];\n            nums[mid] = t;\n            low++;\n            mid++;\n        }\n        else if (nums[mid] == 1)\n        {\n            mid++;\n        }\n        else\n        {\n            int t = nums[high];\n            nums[high] = nums[mid];\n            nums[mid] = t;\n            high--;\n        }\n    }\n    return nums;\n}`,
              go: `func sortColors(nums []int) []int {\n	low, mid, high := 0, 0, len(nums)-1\n	for mid <= high {\n		if nums[mid] == 0 {\n			nums[low], nums[mid] = nums[mid], nums[low]\n			low++\n			mid++\n		} else if nums[mid] == 1 {\n			mid++\n		} else {\n			nums[mid], nums[high] = nums[high], nums[mid]\n			high--\n		}\n	}\n	return nums\n}`,
              kotlin: `fun sortColors(nums: IntArray): IntArray {\n    var low = 0\n    var mid = 0\n    var high = nums.size - 1\n    while (mid <= high) {\n        when {\n            nums[mid] == 0 -> {\n                val t = nums[low]\n                nums[low] = nums[mid]\n                nums[mid] = t\n                low++\n                mid++\n            }\n            nums[mid] == 1 -> mid++\n            else -> {\n                val t = nums[high]\n                nums[high] = nums[mid]\n                nums[mid] = t\n                high--\n            }\n        }\n    }\n    return nums\n}`,
              swift: `func sortColors(_ nums: [Int]) -> [Int] {\n    var a = nums\n    var low = 0\n    var mid = 0\n    var high = a.count - 1\n    while mid <= high {\n        if a[mid] == 0 {\n            a.swapAt(low, mid)\n            low += 1\n            mid += 1\n        } else if a[mid] == 1 {\n            mid += 1\n        } else {\n            a.swapAt(mid, high)\n            high -= 1\n        }\n    }\n    return a\n}`,
              rust: `fn sortColors(nums: Vec<i32>) -> Vec<i32> {\n    let mut a = nums;\n    let mut low: i32 = 0;\n    let mut mid: i32 = 0;\n    let mut high: i32 = a.len() as i32 - 1;\n    while mid <= high {\n        let v = a[mid as usize];\n        if v == 0 {\n            a.swap(low as usize, mid as usize);\n            low += 1;\n            mid += 1;\n        } else if v == 1 {\n            mid += 1;\n        } else {\n            a.swap(mid as usize, high as usize);\n            high -= 1;\n        }\n    }\n    a\n}`,
              php: `function sortColors($nums) {\n    $low = 0;\n    $mid = 0;\n    $high = count($nums) - 1;\n    while ($mid <= $high) {\n        if ($nums[$mid] === 0) {\n            $t = $nums[$low];\n            $nums[$low] = $nums[$mid];\n            $nums[$mid] = $t;\n            $low++;\n            $mid++;\n        } elseif ($nums[$mid] === 1) {\n            $mid++;\n        } else {\n            $t = $nums[$high];\n            $nums[$high] = $nums[$mid];\n            $nums[$mid] = $t;\n            $high--;\n        }\n    }\n    return $nums;\n}`,
              ruby: `def sortColors(nums)\n  low = 0\n  mid = 0\n  high = nums.length - 1\n  while mid <= high\n    if nums[mid] == 0\n      nums[low], nums[mid] = nums[mid], nums[low]\n      low += 1\n      mid += 1\n    elsif nums[mid] == 1\n      mid += 1\n    else\n      nums[mid], nums[high] = nums[high], nums[mid]\n      high -= 1\n    end\n  end\n  nums\nend`,
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
      editorial: explain({
        idea: "Squaring destroys the sorted order only because negatives flip: the largest square is always at one **end** of the array, never in the middle. So compare the two ends, take the bigger square, and write it into the back of the output — filling the result right to left keeps everything ordered without a sort.",
        steps: [
          "Put `l` at the first index and `r` at the last, and allocate an output array of the same length.",
          "Fill the output from the last position backwards.",
          "Compare `nums[l] * nums[l]` with `nums[r] * nums[r]`.",
          "Write the larger into the current output slot and move that pointer inward.",
          "Continue until every slot is filled.",
        ],
        why: "The array is sorted, so absolute values decrease towards the middle from both ends and the maximum absolute value — hence the maximum square — is at `l` or `r`. Taking it and shrinking the range leaves a smaller instance of the same problem, so filling the output from the back places each value in its correct final slot. That is one pass, beating the `O(n log n)` of squaring and re-sorting.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Fill the output **backwards**. Writing forwards from the ends produces a descending array.",
          "Compare squares (or absolute values), not the raw values — `-4` beats `3`.",
          "Move only the pointer whose square you consumed.",
          "On a tie either side may be taken; the resulting array is the same.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef sortedSquares(nums: List[int]) -> List[int]:\n    n = len(nums)\n    out = [0] * n\n    l, r = 0, n - 1\n    for i in range(n - 1, -1, -1):\n        if abs(nums[l]) > abs(nums[r]):\n            out[i] = nums[l] * nums[l]\n            l += 1\n        else:\n            out[i] = nums[r] * nums[r]\n            r -= 1\n    return out`,
        javascript: `var sortedSquares = function(nums) {\n    const n = nums.length;\n    const out = new Array(n);\n    let l = 0, r = n - 1;\n    for (let i = n - 1; i >= 0; i--) {\n        if (Math.abs(nums[l]) > Math.abs(nums[r])) {\n            out[i] = nums[l] * nums[l];\n            l++;\n        } else {\n            out[i] = nums[r] * nums[r];\n            r--;\n        }\n    }\n    return out;\n};`,
              typescript: `function sortedSquares(nums: number[]): number[] {\n    const n = nums.length;\n    const out: number[] = [];\n    for (let i = 0; i < n; i++) out.push(0);\n    let l = 0;\n    let r = n - 1;\n    for (let i = n - 1; i >= 0; i--) {\n        const a = nums[l] * nums[l];\n        const b = nums[r] * nums[r];\n        if (a > b) {\n            out[i] = a;\n            l++;\n        } else {\n            out[i] = b;\n            r--;\n        }\n    }\n    return out;\n}`,
              java: `public static int[] sortedSquares(int[] nums) {\n    int n = nums.length;\n    int[] out = new int[n];\n    int l = 0, r = n - 1;\n    for (int i = n - 1; i >= 0; i--) {\n        int a = nums[l] * nums[l];\n        int b = nums[r] * nums[r];\n        if (a > b) {\n            out[i] = a;\n            l++;\n        } else {\n            out[i] = b;\n            r--;\n        }\n    }\n    return out;\n}`,
              cpp: `vector<int> sortedSquares(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<int> out(n, 0);\n    int l = 0, r = n - 1;\n    for (int i = n - 1; i >= 0; i--) {\n        int a = nums[l] * nums[l];\n        int b = nums[r] * nums[r];\n        if (a > b) {\n            out[i] = a;\n            l++;\n        } else {\n            out[i] = b;\n            r--;\n        }\n    }\n    return out;\n}`,
              c: `int* sortedSquares(int* nums, int numsSize, int* returnSize) {\n    int n = numsSize;\n    int* out = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int l = 0, r = n - 1;\n    for (int i = n - 1; i >= 0; i--) {\n        int a = nums[l] * nums[l];\n        int b = nums[r] * nums[r];\n        if (a > b) {\n            out[i] = a;\n            l++;\n        } else {\n            out[i] = b;\n            r--;\n        }\n    }\n    *returnSize = n;\n    return out;\n}`,
              csharp: `public static int[] SortedSquares(int[] nums)\n{\n    int n = nums.Length;\n    int[] res = new int[n];\n    int l = 0, r = n - 1;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        int a = nums[l] * nums[l];\n        int b = nums[r] * nums[r];\n        if (a > b)\n        {\n            res[i] = a;\n            l++;\n        }\n        else\n        {\n            res[i] = b;\n            r--;\n        }\n    }\n    return res;\n}`,
              go: `func sortedSquares(nums []int) []int {\n	n := len(nums)\n	out := make([]int, n)\n	l, r := 0, n-1\n	for i := n - 1; i >= 0; i-- {\n		a := nums[l] * nums[l]\n		b := nums[r] * nums[r]\n		if a > b {\n			out[i] = a\n			l++\n		} else {\n			out[i] = b\n			r--\n		}\n	}\n	return out\n}`,
              kotlin: `fun sortedSquares(nums: IntArray): IntArray {\n    val n = nums.size\n    val out = IntArray(n)\n    var l = 0\n    var r = n - 1\n    for (i in n - 1 downTo 0) {\n        val a = nums[l] * nums[l]\n        val b = nums[r] * nums[r]\n        if (a > b) {\n            out[i] = a\n            l++\n        } else {\n            out[i] = b\n            r--\n        }\n    }\n    return out\n}`,
              swift: `func sortedSquares(_ nums: [Int]) -> [Int] {\n    let n = nums.count\n    var out = [Int](repeating: 0, count: n)\n    var l = 0\n    var r = n - 1\n    var i = n - 1\n    while i >= 0 {\n        let a = nums[l] * nums[l]\n        let b = nums[r] * nums[r]\n        if a > b {\n            out[i] = a\n            l += 1\n        } else {\n            out[i] = b\n            r -= 1\n        }\n        i -= 1\n    }\n    return out\n}`,
              rust: `fn sortedSquares(nums: Vec<i32>) -> Vec<i32> {\n    let n = nums.len();\n    let mut out = vec![0i32; n];\n    let mut l: i32 = 0;\n    let mut r: i32 = n as i32 - 1;\n    let mut i: i32 = n as i32 - 1;\n    while i >= 0 {\n        let a = nums[l as usize] * nums[l as usize];\n        let b = nums[r as usize] * nums[r as usize];\n        if a > b {\n            out[i as usize] = a;\n            l += 1;\n        } else {\n            out[i as usize] = b;\n            r -= 1;\n        }\n        i -= 1;\n    }\n    out\n}`,
              php: `function sortedSquares($nums) {\n    $n = count($nums);\n    $out = array_fill(0, $n, 0);\n    $l = 0;\n    $r = $n - 1;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $a = $nums[$l] * $nums[$l];\n        $b = $nums[$r] * $nums[$r];\n        if ($a > $b) {\n            $out[$i] = $a;\n            $l++;\n        } else {\n            $out[$i] = $b;\n            $r--;\n        }\n    }\n    return $out;\n}`,
              ruby: `def sortedSquares(nums)\n  n = nums.length\n  out = Array.new(n, 0)\n  l = 0\n  r = n - 1\n  (n - 1).downto(0) do |i|\n    a = nums[l] * nums[l]\n    b = nums[r] * nums[r]\n    if a > b\n      out[i] = a\n      l += 1\n    else\n      out[i] = b\n      r -= 1\n    end\n  end\n  out\nend`,
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
      editorial: explain({
        idea: "Scanning forwards is awkward because a backspace refers to something already typed. Scanning **backwards** fixes that: when you meet a `#` you know it will consume the next real character to the left, so carry a counter of pending deletions and skip that many characters. Walk both strings backwards in step and compare the surviving characters.",
        steps: [
          "Put `i` at the end of `s` and `j` at the end of `t`.",
          "Advance `i` leftwards to the next surviving character: a `#` increments a skip counter, and a normal character is discarded (decrementing the counter) while the counter is positive.",
          "Do the same for `j` in `t`.",
          "If both landed on a character, they must match; if only one did, the strings differ in length after editing — return `false`.",
          "Step both pointers past the compared characters and repeat until both are exhausted.",
        ],
        why: "Reading right to left makes each `#` refer to characters not yet visited, so the effect of every backspace is known before its victim is reached — no lookahead or rewriting is needed. The surviving characters emerge in reverse order of the final text, so comparing them pairwise is exactly comparing the two edited strings. Building both strings with a stack is equally correct and easier to write, at the cost of `O(n)` extra space.",
        time: "O(|s| + |t|)",
        space: "O(1)",
        pitfalls: [
          "The loop must continue while **either** pointer still has characters — stopping when one runs out misses a length mismatch.",
          "Backspacing an empty editor is a no-op, which the counter handles by simply never going negative.",
          "Consecutive `#`s stack up; the skip counter must accumulate rather than being a boolean.",
          "After comparing a pair, move both pointers on — leaving one in place re-compares the same character.",
        ],
      }),
      solutions: {
        python: `def backspaceCompare(s: str, t: str) -> bool:\n    def build(x: str) -> str:\n        st = []\n        for ch in x:\n            if ch == "#":\n                if st:\n                    st.pop()\n            else:\n                st.append(ch)\n        return "".join(st)\n\n    return build(s) == build(t)`,
        javascript: `var backspaceCompare = function(s, t) {\n    function build(x) {\n        const st = [];\n        for (const ch of x) {\n            if (ch === "#") st.pop();\n            else st.push(ch);\n        }\n        return st.join("");\n    }\n    return build(s) === build(t);\n};`,
              typescript: `function backspaceCompare(s: string, t: string): boolean {\n    let i = s.length - 1;\n    let j = t.length - 1;\n    while (i >= 0 || j >= 0) {\n        let skip = 0;\n        while (i >= 0) {\n            if (s[i] === "#") {\n                skip++;\n                i--;\n            } else if (skip > 0) {\n                skip--;\n                i--;\n            } else break;\n        }\n        skip = 0;\n        while (j >= 0) {\n            if (t[j] === "#") {\n                skip++;\n                j--;\n            } else if (skip > 0) {\n                skip--;\n                j--;\n            } else break;\n        }\n        if (i >= 0 && j >= 0) {\n            if (s[i] !== t[j]) return false;\n        } else if (i >= 0 || j >= 0) {\n            return false;\n        }\n        i--;\n        j--;\n    }\n    return true;\n}`,
              java: `public static boolean backspaceCompare(String s, String t) {\n    int i = s.length() - 1, j = t.length() - 1;\n    while (i >= 0 || j >= 0) {\n        int skip = 0;\n        while (i >= 0) {\n            if (s.charAt(i) == '#') {\n                skip++;\n                i--;\n            } else if (skip > 0) {\n                skip--;\n                i--;\n            } else break;\n        }\n        skip = 0;\n        while (j >= 0) {\n            if (t.charAt(j) == '#') {\n                skip++;\n                j--;\n            } else if (skip > 0) {\n                skip--;\n                j--;\n            } else break;\n        }\n        if (i >= 0 && j >= 0) {\n            if (s.charAt(i) != t.charAt(j)) return false;\n        } else if (i >= 0 || j >= 0) {\n            return false;\n        }\n        i--;\n        j--;\n    }\n    return true;\n}`,
              cpp: `bool backspaceCompare(string s, string t) {\n    int i = (int) s.size() - 1, j = (int) t.size() - 1;\n    while (i >= 0 || j >= 0) {\n        int skip = 0;\n        while (i >= 0) {\n            if (s[i] == '#') {\n                skip++;\n                i--;\n            } else if (skip > 0) {\n                skip--;\n                i--;\n            } else break;\n        }\n        skip = 0;\n        while (j >= 0) {\n            if (t[j] == '#') {\n                skip++;\n                j--;\n            } else if (skip > 0) {\n                skip--;\n                j--;\n            } else break;\n        }\n        if (i >= 0 && j >= 0) {\n            if (s[i] != t[j]) return false;\n        } else if (i >= 0 || j >= 0) {\n            return false;\n        }\n        i--;\n        j--;\n    }\n    return true;\n}`,
              c: `bool backspaceCompare(const char* s, const char* t) {\n    int i = (int) strlen(s) - 1;\n    int j = (int) strlen(t) - 1;\n    while (i >= 0 || j >= 0) {\n        int skip = 0;\n        while (i >= 0) {\n            if (s[i] == '#') {\n                skip++;\n                i--;\n            } else if (skip > 0) {\n                skip--;\n                i--;\n            } else break;\n        }\n        skip = 0;\n        while (j >= 0) {\n            if (t[j] == '#') {\n                skip++;\n                j--;\n            } else if (skip > 0) {\n                skip--;\n                j--;\n            } else break;\n        }\n        if (i >= 0 && j >= 0) {\n            if (s[i] != t[j]) return false;\n        } else if (i >= 0 || j >= 0) {\n            return false;\n        }\n        i--;\n        j--;\n    }\n    return true;\n}`,
              csharp: `public static bool BackspaceCompare(string s, string t)\n{\n    int i = s.Length - 1, j = t.Length - 1;\n    while (i >= 0 || j >= 0)\n    {\n        int skip = 0;\n        while (i >= 0)\n        {\n            if (s[i] == '#') { skip++; i--; }\n            else if (skip > 0) { skip--; i--; }\n            else break;\n        }\n        skip = 0;\n        while (j >= 0)\n        {\n            if (t[j] == '#') { skip++; j--; }\n            else if (skip > 0) { skip--; j--; }\n            else break;\n        }\n        if (i >= 0 && j >= 0)\n        {\n            if (s[i] != t[j]) return false;\n        }\n        else if (i >= 0 || j >= 0)\n        {\n            return false;\n        }\n        i--;\n        j--;\n    }\n    return true;\n}`,
              go: `func backspaceCompare(s string, t string) bool {\n	i := len(s) - 1\n	j := len(t) - 1\n	for i >= 0 || j >= 0 {\n		skip := 0\n		for i >= 0 {\n			if s[i] == '#' {\n				skip++\n				i--\n			} else if skip > 0 {\n				skip--\n				i--\n			} else {\n				break\n			}\n		}\n		skip = 0\n		for j >= 0 {\n			if t[j] == '#' {\n				skip++\n				j--\n			} else if skip > 0 {\n				skip--\n				j--\n			} else {\n				break\n			}\n		}\n		if i >= 0 && j >= 0 {\n			if s[i] != t[j] {\n				return false\n			}\n		} else if i >= 0 || j >= 0 {\n			return false\n		}\n		i--\n		j--\n	}\n	return true\n}`,
              kotlin: `fun backspaceCompare(s: String, t: String): Boolean {\n    var i = s.length - 1\n    var j = t.length - 1\n    while (i >= 0 || j >= 0) {\n        var skip = 0\n        while (i >= 0) {\n            if (s[i] == '#') {\n                skip++\n                i--\n            } else if (skip > 0) {\n                skip--\n                i--\n            } else break\n        }\n        skip = 0\n        while (j >= 0) {\n            if (t[j] == '#') {\n                skip++\n                j--\n            } else if (skip > 0) {\n                skip--\n                j--\n            } else break\n        }\n        if (i >= 0 && j >= 0) {\n            if (s[i] != t[j]) return false\n        } else if (i >= 0 || j >= 0) {\n            return false\n        }\n        i--\n        j--\n    }\n    return true\n}`,
              swift: `func backspaceCompare(_ s: String, _ t: String) -> Bool {\n    let a = Array(s)\n    let b = Array(t)\n    var i = a.count - 1\n    var j = b.count - 1\n    while i >= 0 || j >= 0 {\n        var skip = 0\n        while i >= 0 {\n            if a[i] == "#" {\n                skip += 1\n                i -= 1\n            } else if skip > 0 {\n                skip -= 1\n                i -= 1\n            } else { break }\n        }\n        skip = 0\n        while j >= 0 {\n            if b[j] == "#" {\n                skip += 1\n                j -= 1\n            } else if skip > 0 {\n                skip -= 1\n                j -= 1\n            } else { break }\n        }\n        if i >= 0 && j >= 0 {\n            if a[i] != b[j] { return false }\n        } else if i >= 0 || j >= 0 {\n            return false\n        }\n        i -= 1\n        j -= 1\n    }\n    return true\n}`,
              rust: `fn backspaceCompare(s: String, t: String) -> bool {\n    let a: Vec<u8> = s.bytes().collect();\n    let b: Vec<u8> = t.bytes().collect();\n    let mut i: i32 = a.len() as i32 - 1;\n    let mut j: i32 = b.len() as i32 - 1;\n    while i >= 0 || j >= 0 {\n        let mut skip = 0;\n        while i >= 0 {\n            if a[i as usize] == b'#' {\n                skip += 1;\n                i -= 1;\n            } else if skip > 0 {\n                skip -= 1;\n                i -= 1;\n            } else {\n                break;\n            }\n        }\n        skip = 0;\n        while j >= 0 {\n            if b[j as usize] == b'#' {\n                skip += 1;\n                j -= 1;\n            } else if skip > 0 {\n                skip -= 1;\n                j -= 1;\n            } else {\n                break;\n            }\n        }\n        if i >= 0 && j >= 0 {\n            if a[i as usize] != b[j as usize] {\n                return false;\n            }\n        } else if i >= 0 || j >= 0 {\n            return false;\n        }\n        i -= 1;\n        j -= 1;\n    }\n    true\n}`,
              php: `function backspaceCompare($s, $t) {\n    $i = strlen($s) - 1;\n    $j = strlen($t) - 1;\n    while ($i >= 0 || $j >= 0) {\n        $skip = 0;\n        while ($i >= 0) {\n            if ($s[$i] === '#') { $skip++; $i--; }\n            elseif ($skip > 0) { $skip--; $i--; }\n            else break;\n        }\n        $skip = 0;\n        while ($j >= 0) {\n            if ($t[$j] === '#') { $skip++; $j--; }\n            elseif ($skip > 0) { $skip--; $j--; }\n            else break;\n        }\n        if ($i >= 0 && $j >= 0) {\n            if ($s[$i] !== $t[$j]) return false;\n        } elseif ($i >= 0 || $j >= 0) {\n            return false;\n        }\n        $i--;\n        $j--;\n    }\n    return true;\n}`,
              ruby: `def backspaceCompare(s, t)\n  i = s.length - 1\n  j = t.length - 1\n  while i >= 0 || j >= 0\n    skip = 0\n    while i >= 0\n      if s[i] == '#'\n        skip += 1\n        i -= 1\n      elsif skip > 0\n        skip -= 1\n        i -= 1\n      else\n        break\n      end\n    end\n    skip = 0\n    while j >= 0\n      if t[j] == '#'\n        skip += 1\n        j -= 1\n      elsif skip > 0\n        skip -= 1\n        j -= 1\n      else\n        break\n      end\n    end\n    if i >= 0 && j >= 0\n      return false if s[i] != t[j]\n    elsif i >= 0 || j >= 0\n      return false\n    end\n    i -= 1\n    j -= 1\n  end\n  true\nend`,
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
      editorial: explain({
        idea: "A permutation of `s1` is any arrangement of exactly its letters, so a substring is a permutation precisely when it has the **same length and the same letter frequencies**. Slide a fixed-width window of length `|s1|` across `s2` and compare frequency tables.",
        steps: [
          "Return `false` immediately if `s1` is longer than `s2`.",
          "Build a 26-slot frequency table for `s1`, and one for the first window of `s2`.",
          "Compare the tables; a match means a permutation was found.",
          "Slide the window one character right: add the entering character and remove the leaving one.",
          "Repeat to the end of `s2`.",
        ],
        why: "Two strings of equal length are permutations of one another exactly when their multisets of characters agree, and a 26-slot count is that multiset. Updating incrementally is what keeps this linear — each slide touches only two counters instead of rebuilding the whole table, so the total work is `O(|s2| · 26)` rather than `O(|s2| · |s1|)`.",
        time: "O(|s2| · 26)",
        space: "O(1)",
        pitfalls: [
          "The window is **fixed width**; growing and shrinking it as in a variable window solves a different problem.",
          "Guard the length check first, otherwise the first window runs off the end of `s2`.",
          "Remove the character leaving the window as well as adding the one entering — forgetting the removal turns counts into cumulative totals.",
          "Compare full tables (or maintain a running count of matching slots); comparing only the entering character is not enough.",
        ],
      }),
      solutions: {
        python: `def checkInclusion(s1: str, s2: str) -> bool:\n    if len(s1) > len(s2):\n        return False\n    need = [0] * 26\n    have = [0] * 26\n    for ch in s1:\n        need[ord(ch) - 97] += 1\n    for i, ch in enumerate(s2):\n        have[ord(ch) - 97] += 1\n        if i >= len(s1):\n            have[ord(s2[i - len(s1)]) - 97] -= 1\n        if i >= len(s1) - 1 and have == need:\n            return True\n    return False`,
        javascript: `var checkInclusion = function(s1, s2) {\n    if (s1.length > s2.length) return false;\n    const need = new Array(26).fill(0);\n    const have = new Array(26).fill(0);\n    for (const ch of s1) need[ch.charCodeAt(0) - 97]++;\n    for (let i = 0; i < s2.length; i++) {\n        have[s2.charCodeAt(i) - 97]++;\n        if (i >= s1.length) have[s2.charCodeAt(i - s1.length) - 97]--;\n        if (i >= s1.length - 1) {\n            let ok = true;\n            for (let j = 0; j < 26; j++) {\n                if (need[j] !== have[j]) { ok = false; break; }\n            }\n            if (ok) return true;\n        }\n    }\n    return false;\n};`,
              typescript: `function checkInclusion(s1: string, s2: string): boolean {\n    const n1 = s1.length;\n    const n2 = s2.length;\n    if (n1 > n2) return false;\n    const need: number[] = [];\n    const have: number[] = [];\n    for (let i = 0; i < 26; i++) {\n        need.push(0);\n        have.push(0);\n    }\n    for (let i = 0; i < n1; i++) need[s1.charCodeAt(i) - 97]++;\n    for (let i = 0; i < n2; i++) {\n        have[s2.charCodeAt(i) - 97]++;\n        if (i >= n1) have[s2.charCodeAt(i - n1) - 97]--;\n        if (i >= n1 - 1) {\n            let same = true;\n            for (let c = 0; c < 26; c++) {\n                if (need[c] !== have[c]) {\n                    same = false;\n                    break;\n                }\n            }\n            if (same) return true;\n        }\n    }\n    return false;\n}`,
              java: `public static boolean checkInclusion(String s1, String s2) {\n    int n1 = s1.length(), n2 = s2.length();\n    if (n1 > n2) return false;\n    int[] need = new int[26];\n    int[] have = new int[26];\n    for (int i = 0; i < n1; i++) need[s1.charAt(i) - 'a']++;\n    for (int i = 0; i < n2; i++) {\n        have[s2.charAt(i) - 'a']++;\n        if (i >= n1) have[s2.charAt(i - n1) - 'a']--;\n        if (i >= n1 - 1 && Arrays.equals(need, have)) return true;\n    }\n    return false;\n}`,
              cpp: `bool checkInclusion(string s1, string s2) {\n    int n1 = (int) s1.size(), n2 = (int) s2.size();\n    if (n1 > n2) return false;\n    vector<int> need(26, 0), have(26, 0);\n    for (int i = 0; i < n1; i++) need[s1[i] - 'a']++;\n    for (int i = 0; i < n2; i++) {\n        have[s2[i] - 'a']++;\n        if (i >= n1) have[s2[i - n1] - 'a']--;\n        if (i >= n1 - 1 && need == have) return true;\n    }\n    return false;\n}`,
              c: `bool checkInclusion(const char* s1, const char* s2) {\n    int n1 = (int) strlen(s1);\n    int n2 = (int) strlen(s2);\n    if (n1 > n2) return false;\n    int need[26], have[26];\n    for (int i = 0; i < 26; i++) {\n        need[i] = 0;\n        have[i] = 0;\n    }\n    for (int i = 0; i < n1; i++) need[s1[i] - 'a']++;\n    for (int i = 0; i < n2; i++) {\n        have[s2[i] - 'a']++;\n        if (i >= n1) have[s2[i - n1] - 'a']--;\n        if (i >= n1 - 1) {\n            int same = 1;\n            for (int c = 0; c < 26; c++) {\n                if (need[c] != have[c]) {\n                    same = 0;\n                    break;\n                }\n            }\n            if (same) return true;\n        }\n    }\n    return false;\n}`,
              csharp: `public static bool CheckInclusion(string s1, string s2)\n{\n    int n1 = s1.Length, n2 = s2.Length;\n    if (n1 > n2) return false;\n    int[] need = new int[26];\n    int[] have = new int[26];\n    for (int i = 0; i < n1; i++) need[s1[i] - 'a']++;\n    for (int i = 0; i < n2; i++)\n    {\n        have[s2[i] - 'a']++;\n        if (i >= n1) have[s2[i - n1] - 'a']--;\n        if (i >= n1 - 1)\n        {\n            bool same = true;\n            for (int c = 0; c < 26; c++)\n            {\n                if (need[c] != have[c]) { same = false; break; }\n            }\n            if (same) return true;\n        }\n    }\n    return false;\n}`,
              go: `func checkInclusion(s1 string, s2 string) bool {\n	n1, n2 := len(s1), len(s2)\n	if n1 > n2 {\n		return false\n	}\n	need := make([]int, 26)\n	have := make([]int, 26)\n	for i := 0; i < n1; i++ {\n		need[s1[i]-'a']++\n	}\n	for i := 0; i < n2; i++ {\n		have[s2[i]-'a']++\n		if i >= n1 {\n			have[s2[i-n1]-'a']--\n		}\n		if i >= n1-1 {\n			same := true\n			for c := 0; c < 26; c++ {\n				if need[c] != have[c] {\n					same = false\n					break\n				}\n			}\n			if same {\n				return true\n			}\n		}\n	}\n	return false\n}`,
              kotlin: `fun checkInclusion(s1: String, s2: String): Boolean {\n    val n1 = s1.length\n    val n2 = s2.length\n    if (n1 > n2) return false\n    val need = IntArray(26)\n    val have = IntArray(26)\n    for (i in 0 until n1) need[s1[i] - 'a']++\n    for (i in 0 until n2) {\n        have[s2[i] - 'a']++\n        if (i >= n1) have[s2[i - n1] - 'a']--\n        if (i >= n1 - 1 && need.contentEquals(have)) return true\n    }\n    return false\n}`,
              swift: `func checkInclusion(_ s1: String, _ s2: String) -> Bool {\n    let a = Array(s1.unicodeScalars).map { Int($0.value) - 97 }\n    let b = Array(s2.unicodeScalars).map { Int($0.value) - 97 }\n    let n1 = a.count\n    let n2 = b.count\n    if n1 > n2 { return false }\n    var need = [Int](repeating: 0, count: 26)\n    var have = [Int](repeating: 0, count: 26)\n    for i in 0..<n1 { need[a[i]] += 1 }\n    for i in 0..<n2 {\n        have[b[i]] += 1\n        if i >= n1 { have[b[i - n1]] -= 1 }\n        if i >= n1 - 1 && need == have { return true }\n    }\n    return false\n}`,
              rust: `fn checkInclusion(s1: String, s2: String) -> bool {\n    let a: Vec<usize> = s1.bytes().map(|b| (b - b'a') as usize).collect();\n    let b: Vec<usize> = s2.bytes().map(|b| (b - b'a') as usize).collect();\n    let n1 = a.len();\n    let n2 = b.len();\n    if n1 > n2 {\n        return false;\n    }\n    let mut need = [0i32; 26];\n    let mut have = [0i32; 26];\n    for i in 0..n1 {\n        need[a[i]] += 1;\n    }\n    for i in 0..n2 {\n        have[b[i]] += 1;\n        if i >= n1 {\n            have[b[i - n1]] -= 1;\n        }\n        if i + 1 >= n1 && need == have {\n            return true;\n        }\n    }\n    false\n}`,
              php: `function checkInclusion($s1, $s2) {\n    $n1 = strlen($s1);\n    $n2 = strlen($s2);\n    if ($n1 > $n2) return false;\n    $need = array_fill(0, 26, 0);\n    $have = array_fill(0, 26, 0);\n    for ($i = 0; $i < $n1; $i++) $need[ord($s1[$i]) - 97]++;\n    for ($i = 0; $i < $n2; $i++) {\n        $have[ord($s2[$i]) - 97]++;\n        if ($i >= $n1) $have[ord($s2[$i - $n1]) - 97]--;\n        if ($i >= $n1 - 1 && $need === $have) return true;\n    }\n    return false;\n}`,
              ruby: `def checkInclusion(s1, s2)\n  n1 = s1.length\n  n2 = s2.length\n  return false if n1 > n2\n  need = Array.new(26, 0)\n  have = Array.new(26, 0)\n  (0...n1).each { |i| need[s1[i].ord - 97] += 1 }\n  (0...n2).each do |i|\n    have[s2[i].ord - 97] += 1\n    have[s2[i - n1].ord - 97] -= 1 if i >= n1\n    return true if i >= n1 - 1 && need == have\n  end\n  false\nend`,
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
      editorial: explain({
        idea: "Rescanning each window is `O(n·k)`. The fix is a **monotonic deque** holding indices whose values decrease from front to back: the front is always the current window's maximum, and any element smaller than a newer one can be discarded forever, because the newer element is both larger and stays in the window longer.",
        steps: [
          "Keep a deque of indices, values decreasing from front to back.",
          "Before pushing `i`, pop from the **back** while the value there is less than or equal to `nums[i]` — those can never be a maximum again.",
          "Push `i` at the back.",
          "Pop from the **front** if that index has fallen out of the window (`front <= i - k`).",
          "Once `i >= k - 1`, the value at the front index is that window's maximum — record it.",
        ],
        why: "The discard rule is the heart of it: if `j < i` and `nums[j] <= nums[i]`, then any window containing `j` and `i` is dominated by `i`, and `j` expires first — so `j` is permanently useless. What remains is a strictly decreasing sequence, whose front is by definition the largest still in range. Each index is pushed once and popped at most once, so despite the inner loops the total work is linear.",
        time: "O(n)",
        space: "O(k)",
        pitfalls: [
          "The deque stores **indices**, not values — you need positions to know when an element leaves the window.",
          "Pop equal values from the back too (`<=`); keeping them is harmless for correctness but wastes space.",
          "Evict the stale front by index (`front <= i - k`), not by comparing values.",
          "Only start recording once the first full window has formed at `i == k - 1`.",
        ],
      }),
      solutions: {
        python: `from typing import List\nfrom collections import deque\n\ndef maxSlidingWindow(nums: List[int], k: int) -> List[int]:\n    out = []\n    dq = deque()\n    for i, x in enumerate(nums):\n        while dq and dq[0] <= i - k:\n            dq.popleft()\n        while dq and nums[dq[-1]] <= x:\n            dq.pop()\n        dq.append(i)\n        if i >= k - 1:\n            out.append(nums[dq[0]])\n    return out`,
        javascript: `var maxSlidingWindow = function(nums, k) {\n    const out = [];\n    const dq = [];\n    let head = 0;\n    for (let i = 0; i < nums.length; i++) {\n        while (dq.length > head && dq[head] <= i - k) head++;\n        while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();\n        dq.push(i);\n        if (i >= k - 1) out.push(nums[dq[head]]);\n    }\n    return out;\n};`,
              typescript: `function maxSlidingWindow(nums: number[], k: number): number[] {\n    const out: number[] = [];\n    const dq: number[] = [];\n    let head = 0;\n    for (let i = 0; i < nums.length; i++) {\n        while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();\n        dq.push(i);\n        if (dq[head] <= i - k) head++;\n        if (i >= k - 1) out.push(nums[dq[head]]);\n    }\n    return out;\n}`,
              java: `public static int[] maxSlidingWindow(int[] nums, int k) {\n    int n = nums.length;\n    int[] dq = new int[n];\n    int head = 0, tail = 0;\n    List<Integer> out = new ArrayList<>();\n    for (int i = 0; i < n; i++) {\n        while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--;\n        dq[tail++] = i;\n        if (dq[head] <= i - k) head++;\n        if (i >= k - 1) out.add(nums[dq[head]]);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    vector<int> dq(n);\n    int head = 0, tail = 0;\n    vector<int> out;\n    for (int i = 0; i < n; i++) {\n        while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--;\n        dq[tail++] = i;\n        if (dq[head] <= i - k) head++;\n        if (i >= k - 1) out.push_back(nums[dq[head]]);\n    }\n    return out;\n}`,
              c: `int* maxSlidingWindow(int* nums, int numsSize, int k, int* returnSize) {\n    int n = numsSize;\n    int* dq = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int head = 0, tail = 0;\n    int* out = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--;\n        dq[tail++] = i;\n        if (dq[head] <= i - k) head++;\n        if (i >= k - 1) out[count++] = nums[dq[head]];\n    }\n    free(dq);\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static int[] MaxSlidingWindow(int[] nums, int k)\n{\n    int n = nums.Length;\n    int[] dq = new int[n];\n    int head = 0, tail = 0;\n    var res = new List<int>();\n    for (int i = 0; i < n; i++)\n    {\n        while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--;\n        dq[tail++] = i;\n        if (dq[head] <= i - k) head++;\n        if (i >= k - 1) res.Add(nums[dq[head]]);\n    }\n    return res.ToArray();\n}`,
              go: `func maxSlidingWindow(nums []int, k int) []int {\n	n := len(nums)\n	dq := make([]int, n)\n	head, tail := 0, 0\n	out := []int{}\n	for i := 0; i < n; i++ {\n		for tail > head && nums[dq[tail-1]] <= nums[i] {\n			tail--\n		}\n		dq[tail] = i\n		tail++\n		if dq[head] <= i-k {\n			head++\n		}\n		if i >= k-1 {\n			out = append(out, nums[dq[head]])\n		}\n	}\n	return out\n}`,
              kotlin: `fun maxSlidingWindow(nums: IntArray, k: Int): IntArray {\n    val n = nums.size\n    val dq = IntArray(n)\n    var head = 0\n    var tail = 0\n    val out = mutableListOf<Int>()\n    for (i in 0 until n) {\n        while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--\n        dq[tail++] = i\n        if (dq[head] <= i - k) head++\n        if (i >= k - 1) out.add(nums[dq[head]])\n    }\n    return out.toIntArray()\n}`,
              swift: `func maxSlidingWindow(_ nums: [Int], _ k: Int) -> [Int] {\n    let n = nums.count\n    var dq = [Int](repeating: 0, count: n)\n    var head = 0\n    var tail = 0\n    var out: [Int] = []\n    for i in 0..<n {\n        while tail > head && nums[dq[tail - 1]] <= nums[i] { tail -= 1 }\n        dq[tail] = i\n        tail += 1\n        if dq[head] <= i - k { head += 1 }\n        if i >= k - 1 { out.append(nums[dq[head]]) }\n    }\n    return out\n}`,
              rust: `fn maxSlidingWindow(nums: Vec<i32>, k: i32) -> Vec<i32> {\n    let n = nums.len();\n    let k = k as usize;\n    let mut dq: Vec<usize> = vec![0; n];\n    let mut head = 0usize;\n    let mut tail = 0usize;\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..n {\n        while tail > head && nums[dq[tail - 1]] <= nums[i] {\n            tail -= 1;\n        }\n        dq[tail] = i;\n        tail += 1;\n        if i >= k && dq[head] + k <= i {\n            head += 1;\n        }\n        if i + 1 >= k {\n            out.push(nums[dq[head]]);\n        }\n    }\n    out\n}`,
              php: `function maxSlidingWindow($nums, $k) {\n    $n = count($nums);\n    $dq = array_fill(0, max($n, 1), 0);\n    $head = 0;\n    $tail = 0;\n    $out = array();\n    for ($i = 0; $i < $n; $i++) {\n        while ($tail > $head && $nums[$dq[$tail - 1]] <= $nums[$i]) $tail--;\n        $dq[$tail] = $i;\n        $tail++;\n        if ($dq[$head] <= $i - $k) $head++;\n        if ($i >= $k - 1) $out[] = $nums[$dq[$head]];\n    }\n    return $out;\n}`,
              ruby: `def maxSlidingWindow(nums, k)\n  n = nums.length\n  dq = Array.new(n, 0)\n  head = 0\n  tail = 0\n  out = []\n  (0...n).each do |i|\n    tail -= 1 while tail > head && nums[dq[tail - 1]] <= nums[i]\n    dq[tail] = i\n    tail += 1\n    head += 1 if dq[head] <= i - k\n    out.push(nums[dq[head]]) if i >= k - 1\n  end\n  out\nend`,
      },
    };
  })(),

];
