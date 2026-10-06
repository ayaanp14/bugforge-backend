/**
 * Bit manipulation, bitmask DP and binary-trie problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * The judge has no 64-bit types, so the originals that return a 64-bit count
 * (Number of Excellent Pairs, Count Prefix and Suffix Pairs II, Number of
 * Subarrays With AND Value of K) state tightened lengths that keep the answer
 * inside int32, and Maximum Xor Product takes `a, b < 2^30`. Bitmask searches
 * (exponential by nature) run on small generated instances, several of them
 * with a capped `hiddenCount`, so 5,000 cases fit the 15-second budget in
 * Python and Ruby.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** The modulus of the counting problems; the references reduce BigInt results with it. */
const MOD = 1000000007;

/** A random value in [0, hi] drawn from a size class so small and huge values both appear. */
const randVal = (rng: Rng, hi: number) => {
  const cap = pick(rng, [Math.min(hi, 7), Math.min(hi, 63), Math.min(hi, 1000), hi]);
  return ri(rng, 0, cap);
};

export const BITS6_PROBLEMS: CatalogProblem[] = [

  // ── Find XOR Sum of All Pairs Bitwise AND (LC 1835) ─────────────
  (() => {
    const ref = (arr1: number[], arr2: number[]) => {
      let x = 0;
      for (const a of arr1) for (const b of arr2) x ^= a & b;
      return x;
    };
    return {
      slug: "find-xor-sum-of-all-pairs-bitwise-and",
      title: "Find XOR Sum of All Pairs Bitwise AND",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Bit Manipulation", "Google", "Amazon"],
      signature: { funcName: "getXORSum", params: [{ name: "arr1", type: "int[]" as const }, { name: "arr2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **XOR sum** of a list is the bitwise XOR of all its elements (a one-element list's XOR sum is that element).\n\nYou are given two non-negative integer arrays `arr1` and `arr2`. Form the list that holds `arr1[i] AND arr2[j]` for **every** pair `(i, j)` with `0 <= i < arr1.length` and `0 <= j < arr2.length`.\n\nReturn the XOR sum of that list.",
        [
          { in: "arr1 = [3,5], arr2 = [6]", out: "6", note: "The list is `[3 AND 6, 5 AND 6] = [2,4]`, and `2 XOR 4 = 6`." },
          { in: "arr1 = [12], arr2 = [4]", out: "4" },
          { in: "arr1 = [1,2,3], arr2 = [6,5]", out: "0", note: "The list is `[0,1,2,0,2,1]`; every value appears twice, so the XOR sum is 0." },
        ],
        ["1 <= arr1.length, arr2.length <= 10^5", "0 <= arr1[i], arr2[j] <= 10^9"]),
      hints: [
        "There are up to 10^10 pairs, so the list can never be built.",
        "Look at one bit position at a time: AND and XOR both work bit by bit.",
        "AND distributes over XOR: `(a1 AND b) XOR (a2 AND b) = (a1 XOR a2) AND b`. Apply it to both arrays.",
      ],
      editorial: explain({
        idea: "AND distributes over XOR exactly like multiplication over addition in arithmetic mod 2, so the XOR of all pairwise ANDs collapses to `XOR(arr1) AND XOR(arr2)`.",
        steps: [
          "Compute `x`, the XOR of every element of `arr1`.",
          "Compute `y`, the XOR of every element of `arr2`.",
          "Return `x AND y`.",
        ],
        why: "Fix one bit. In that bit, AND is multiplication and XOR is addition modulo 2. The XOR over all pairs is then the sum over i and j of `a_i * b_j` mod 2, which factors as `(sum of a_i) * (sum of b_j)` mod 2 — the bit of `XOR(arr1)` times the bit of `XOR(arr2)`. Every bit behaves independently, so the identity holds for whole numbers.",
        time: "O(n + m)",
        space: "O(1)",
        pitfalls: [
          "The double loop is correct but does up to 10^10 operations.",
          "XOR the arrays first and AND once at the end — ANDing element by element and then XORing is a different expression.",
          "The result is below 2^30, so no wide integers are needed.",
        ],
      }),
      examples: [
        { input: "[3,5]\n[6]", expectedOutput: "6" },
        { input: "[12]\n[4]", expectedOutput: "4" },
        { input: "[1,2,3]\n[6,5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = pick(rng, [7, 255, 1000000000]);
        const n = pick(rng, [1, ri(rng, 1, 5), ri(rng, 1, 30)]);
        const m = pick(rng, [1, ri(rng, 1, 5), ri(rng, 1, 30)]);
        const arr1 = Array.from({ length: n }, () => randVal(rng, hi));
        const arr2 = Array.from({ length: m }, () => randVal(rng, hi));
        return { input: `${fmtIntArr(arr1)}\n${fmtIntArr(arr2)}`, expectedOutput: String(ref(arr1, arr2)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getXORSum(arr1: List[int], arr2: List[int]) -> int:
              x = 0
              for v in arr1:
                  x ^= v
              y = 0
              for v in arr2:
                  y ^= v
              return x & y
        `,
        javascript: code`
          var getXORSum = function(arr1, arr2) {
              var x = 0, y = 0;
              for (var i = 0; i < arr1.length; i++) x ^= arr1[i];
              for (var j = 0; j < arr2.length; j++) y ^= arr2[j];
              return x & y;
          };
        `,
        typescript: code`
          function getXORSum(arr1: number[], arr2: number[]): number {
              var x = 0, y = 0;
              for (var i = 0; i < arr1.length; i++) x ^= arr1[i];
              for (var j = 0; j < arr2.length; j++) y ^= arr2[j];
              return x & y;
          }
        `,
        java: code`
          public static int getXORSum(int[] arr1, int[] arr2) {
              int x = 0, y = 0;
              for (int v : arr1) x ^= v;
              for (int v : arr2) y ^= v;
              return x & y;
          }
        `,
        cpp: code`
          int getXORSum(vector<int>& arr1, vector<int>& arr2) {
              int x = 0, y = 0;
              for (int v : arr1) x ^= v;
              for (int v : arr2) y ^= v;
              return x & y;
          }
        `,
        c: code`
          int getXORSum(int* arr1, int arr1Size, int* arr2, int arr2Size) {
              int x = 0, y = 0;
              for (int i = 0; i < arr1Size; i++) x ^= arr1[i];
              for (int j = 0; j < arr2Size; j++) y ^= arr2[j];
              return x & y;
          }
        `,
        csharp: code`
          public static int GetXORSum(int[] arr1, int[] arr2)
          {
              int x = 0, y = 0;
              foreach (int v in arr1) x ^= v;
              foreach (int v in arr2) y ^= v;
              return x & y;
          }
        `,
        go: code`
          func getXORSum(arr1 []int, arr2 []int) int {
          	x, y := 0, 0
          	for _, v := range arr1 {
          		x ^= v
          	}
          	for _, v := range arr2 {
          		y ^= v
          	}
          	return x & y
          }
        `,
        kotlin: code`
          fun getXORSum(arr1: IntArray, arr2: IntArray): Int {
              var x = 0
              var y = 0
              for (v in arr1) x = x xor v
              for (v in arr2) y = y xor v
              return x and y
          }
        `,
        swift: code`
          func getXORSum(_ arr1: [Int], _ arr2: [Int]) -> Int {
              var x = 0
              var y = 0
              for v in arr1 { x ^= v }
              for v in arr2 { y ^= v }
              return x & y
          }
        `,
        rust: code`
          fn getXORSum(arr1: Vec<i32>, arr2: Vec<i32>) -> i32 {
              let mut x = 0;
              let mut y = 0;
              for &v in arr1.iter() {
                  x ^= v;
              }
              for &v in arr2.iter() {
                  y ^= v;
              }
              x & y
          }
        `,
        php: code`
          function getXORSum($arr1, $arr2) {
              $x = 0;
              $y = 0;
              foreach ($arr1 as $v) $x ^= $v;
              foreach ($arr2 as $v) $y ^= $v;
              return $x & $y;
          }
        `,
        ruby: code`
          def getXORSum(arr1, arr2)
            x = 0
            arr1.each { |v| x ^= v }
            y = 0
            arr2.each { |v| y ^= v }
            x & y
          end
        `,
      },
    };
  })(),

  // ── Largest Combination With Bitwise AND Greater Than Zero (LC 2275) ──
  (() => {
    const ref = (c: number[]) => {
      if (c.length <= 10) {
        let best = 0;
        for (let mask = 1; mask < 1 << c.length; mask++) {
          let and = -1, size = 0;
          for (let i = 0; i < c.length; i++) if (mask >> i & 1) { and &= c[i]; size++; }
          if (and > 0 && size > best) best = size;
        }
        return best;
      }
      let best = 0;
      for (let b = 0; b < 25; b++) {
        let cnt = 0;
        for (const v of c) if (v >> b & 1) cnt++;
        best = Math.max(best, cnt);
      }
      return best;
    };
    return {
      slug: "largest-combination-with-bitwise-and-greater-than-zero",
      title: "Largest Combination With Bitwise AND Greater Than Zero",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Counting", "Amazon", "Microsoft"],
      signature: { funcName: "largestCombination", params: [{ name: "candidates", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array of positive integers `candidates`. A **combination** is any non-empty selection of elements of `candidates`, each element used at most once; its bitwise AND is the AND of every selected element.\n\nReturn the size of the **largest** combination whose bitwise AND is **greater than 0**.",
        [
          { in: "candidates = [5,3,6]", out: "2", note: "Any two of them share a bit (`5 AND 3 = 1`), but `5 AND 3 AND 6 = 0`." },
          { in: "candidates = [8,8]", out: "2" },
          { in: "candidates = [1,2,4]", out: "1", note: "No two values share a bit, so only single elements qualify." },
        ],
        ["1 <= candidates.length <= 10^5", "1 <= candidates[i] <= 10^7"]),
      hints: [
        "When is an AND greater than zero? Some bit must survive in every selected element.",
        "Fix a bit position. Which elements can join a combination that keeps that bit?",
        "For every bit, count the candidates that have it set; the answer is the largest count.",
      ],
      editorial: explain({
        idea: "An AND is positive exactly when at least one bit is set in every chosen element, so the best combination is \"all candidates that have bit b\" for the best bit b.",
        steps: [
          "For each bit position b from 0 to 23 (10^7 < 2^24), count how many candidates have bit b set.",
          "Return the largest of those counts.",
        ],
        why: "If a combination's AND is positive, some bit b survives, so every member has bit b and the combination is no larger than the count for b. Conversely, taking every candidate with bit b gives an AND that still has bit b, so that count is achievable. The answer is therefore the maximum count over bits.",
        time: "O(24 · n)",
        space: "O(1)",
        pitfalls: [
          "Enumerating combinations is exponential — the per-bit view removes the search entirely.",
          "The surviving bits of the best combination need not be the highest bit of any element.",
          "Every candidate is positive, so the answer is always at least 1.",
        ],
      }),
      examples: [
        { input: "[5,3,6]", expectedOutput: "2" },
        { input: "[8,8]", expectedOutput: "2" },
        { input: "[1,2,4]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 10), ri(rng, 1, 40)]);
        const hi = pick(rng, [15, 255, 10000000]);
        const c = Array.from({ length: n }, () => Math.max(1, randVal(rng, hi)));
        return { input: fmtIntArr(c), expectedOutput: String(ref(c)) };
      },
      solutions: {
        python: code`
          from typing import List

          def largestCombination(candidates: List[int]) -> int:
              best = 0
              for b in range(24):
                  cnt = 0
                  for v in candidates:
                      cnt += (v >> b) & 1
                  if cnt > best:
                      best = cnt
              return best
        `,
        javascript: code`
          var largestCombination = function(candidates) {
              var best = 0;
              for (var b = 0; b < 24; b++) {
                  var cnt = 0;
                  for (var i = 0; i < candidates.length; i++) cnt += (candidates[i] >> b) & 1;
                  if (cnt > best) best = cnt;
              }
              return best;
          };
        `,
        typescript: code`
          function largestCombination(candidates: number[]): number {
              var best = 0;
              for (var b = 0; b < 24; b++) {
                  var cnt = 0;
                  for (var i = 0; i < candidates.length; i++) cnt += (candidates[i] >> b) & 1;
                  if (cnt > best) best = cnt;
              }
              return best;
          }
        `,
        java: code`
          public static int largestCombination(int[] candidates) {
              int best = 0;
              for (int b = 0; b < 24; b++) {
                  int cnt = 0;
                  for (int v : candidates) cnt += (v >> b) & 1;
                  best = Math.max(best, cnt);
              }
              return best;
          }
        `,
        cpp: code`
          int largestCombination(vector<int>& candidates) {
              int best = 0;
              for (int b = 0; b < 24; b++) {
                  int cnt = 0;
                  for (int v : candidates) cnt += (v >> b) & 1;
                  best = max(best, cnt);
              }
              return best;
          }
        `,
        c: code`
          int largestCombination(int* candidates, int candidatesSize) {
              int best = 0;
              for (int b = 0; b < 24; b++) {
                  int cnt = 0;
                  for (int i = 0; i < candidatesSize; i++) cnt += (candidates[i] >> b) & 1;
                  if (cnt > best) best = cnt;
              }
              return best;
          }
        `,
        csharp: code`
          public static int LargestCombination(int[] candidates)
          {
              int best = 0;
              for (int b = 0; b < 24; b++)
              {
                  int cnt = 0;
                  foreach (int v in candidates) cnt += (v >> b) & 1;
                  best = Math.Max(best, cnt);
              }
              return best;
          }
        `,
        go: code`
          func largestCombination(candidates []int) int {
          	best := 0
          	for b := uint(0); b < 24; b++ {
          		cnt := 0
          		for _, v := range candidates {
          			cnt += (v >> b) & 1
          		}
          		if cnt > best {
          			best = cnt
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun largestCombination(candidates: IntArray): Int {
              var best = 0
              for (b in 0 until 24) {
                  var cnt = 0
                  for (v in candidates) cnt += (v shr b) and 1
                  if (cnt > best) best = cnt
              }
              return best
          }
        `,
        swift: code`
          func largestCombination(_ candidates: [Int]) -> Int {
              var best = 0
              for b in 0..<24 {
                  var cnt = 0
                  for v in candidates { cnt += (v >> b) & 1 }
                  if cnt > best { best = cnt }
              }
              return best
          }
        `,
        rust: code`
          fn largestCombination(candidates: Vec<i32>) -> i32 {
              let mut best = 0;
              for b in 0..24 {
                  let mut cnt = 0;
                  for &v in candidates.iter() {
                      cnt += (v >> b) & 1;
                  }
                  if cnt > best {
                      best = cnt;
                  }
              }
              best
          }
        `,
        php: code`
          function largestCombination($candidates) {
              $best = 0;
              for ($b = 0; $b < 24; $b++) {
                  $cnt = 0;
                  foreach ($candidates as $v) $cnt += ($v >> $b) & 1;
                  if ($cnt > $best) $best = $cnt;
              }
              return $best;
          }
        `,
        ruby: code`
          def largestCombination(candidates)
            best = 0
            24.times do |b|
              cnt = 0
              candidates.each { |v| cnt += (v >> b) & 1 }
              best = cnt if cnt > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Count Pairs With XOR in a Range (LC 1803) ───────────────────
  (() => {
    const ref = (nums: number[], low: number, high: number) => {
      let c = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const x = nums[i] ^ nums[j];
          if (x >= low && x <= high) c++;
        }
      }
      return c;
    };
    return {
      slug: "count-pairs-with-xor-in-a-range",
      title: "Count Pairs With XOR in a Range",
      difficulty: "HARD" as const,
      tags: ["Array", "Bit Manipulation", "Trie", "Amazon", "Google"],
      signature: {
        funcName: "countPairs",
        params: [{ name: "nums", type: "int[]" as const }, { name: "low", type: "int" as const }, { name: "high", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given an integer array `nums` and two integers `low` and `high`, a **nice pair** is a pair of indices `(i, j)` with `0 <= i < j < nums.length` such that `low <= (nums[i] XOR nums[j]) <= high`.\n\nReturn the number of nice pairs.",
        [
          { in: "nums = [5,1,2,6], low = 3, high = 7", out: "6", note: "The six XORs are 4, 7, 3, 3, 7 and 4 — all inside `[3, 7]`." },
          { in: "nums = [9,8,4,2,1], low = 5, high = 14", out: "8", note: "Only `9 XOR 8 = 1` and `2 XOR 1 = 3` fall below 5." },
          { in: "nums = [7], low = 1, high = 5", out: "0" },
        ],
        ["1 <= nums.length <= 2 * 10^4", "1 <= nums[i] <= 2 * 10^4", "1 <= low <= high <= 2 * 10^4"]),
      hints: [
        "Counting pairs with XOR in `[low, high]` equals (pairs with XOR `< high + 1`) minus (pairs with XOR `< low`).",
        "To count earlier numbers `y` with `x XOR y < limit`, walk a binary trie of the earlier numbers from the top bit, following `limit`'s bits.",
        "Where `limit` has a 1, every `y` that makes this XOR bit 0 is already smaller — add that whole subtree's count, then continue down the branch that makes the bit 1.",
      ],
      editorial: explain({
        idea: "Turn the range into two \"strictly less than\" counts and answer each with a binary trie that stores how many inserted numbers pass through every node.",
        steps: [
          "Keep a binary trie over 15 bits (values stay below 2^15) where each node stores how many inserted numbers pass through it.",
          "For each `x` in order, add `below(x, high + 1) - below(x, low)` to the answer, then insert `x`.",
          "`below(x, limit)` walks from bit 14 to bit 0. Let `xb` be x's bit. If `limit` has a 1 there, every number on the `xb` child makes the XOR bit 0 and is smaller — add that child's count — and continue into the `1 - xb` child. If `limit` has a 0, continue into the `xb` child. Stop when the child is missing.",
        ],
        why: "Two numbers compare by their first differing bit from the top. Along the walk the XOR so far equals `limit`'s prefix; at a 1-bit of `limit`, choosing XOR bit 0 makes the XOR smaller regardless of the lower bits, so the whole subtree counts, while XOR bit 1 keeps it tied. At a 0-bit of `limit` the XOR bit must be 0 to stay tied. Reaching the bottom while tied means XOR equals `limit`, which is not counted. Inserting after querying counts each pair once.",
        time: "O(n · 15)",
        space: "O(n · 15)",
        pitfalls: [
          "Use `high + 1` and `low` as the two strict limits; mixing inclusive and exclusive bounds is the usual off-by-one.",
          "Query before inserting, or a number pairs with itself.",
          "The trie must cover 15 bits: `high + 1` can be 20,001, above 2^14.",
        ],
      }),
      examples: [
        { input: "[5,1,2,6]\n3\n7", expectedOutput: "6" },
        { input: "[9,8,4,2,1]\n5\n14", expectedOutput: "8" },
        { input: "[7]\n1\n5", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 5), ri(rng, 6, 20), ri(rng, 20, 40)]);
        const hi = pick(rng, [15, 300, 20000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        const span = pick(rng, [hi, 20000]);
        let low = ri(rng, 1, Math.min(20000, span));
        let high = ri(rng, 1, Math.min(20000, span));
        if (low > high) { const t = low; low = high; high = t; }
        return { input: `${fmtIntArr(nums)}\n${low}\n${high}`, expectedOutput: String(ref(nums, low, high)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countPairs(nums: List[int], low: int, high: int) -> int:
              size = len(nums) * 15 + 2
              ch = [0] * (size * 2)
              cnt = [0] * size

              def below(x, limit):
                  node = 0
                  res = 0
                  for b in range(14, -1, -1):
                      xb = (x >> b) & 1
                      if (limit >> b) & 1:
                          same = ch[node * 2 + xb]
                          if same:
                              res += cnt[same]
                          node = ch[node * 2 + (xb ^ 1)]
                      else:
                          node = ch[node * 2 + xb]
                      if not node:
                          return res
                  return res

              nodes = 1
              total = 0
              for v in nums:
                  total += below(v, high + 1) - below(v, low)
                  node = 0
                  for b in range(14, -1, -1):
                      bit = (v >> b) & 1
                      if not ch[node * 2 + bit]:
                          ch[node * 2 + bit] = nodes
                          nodes += 1
                      node = ch[node * 2 + bit]
                      cnt[node] += 1
              return total
        `,
        javascript: code`
          var countPairs = function(nums, low, high) {
              var size = nums.length * 15 + 2;
              var ch = new Int32Array(size * 2);
              var cnt = new Int32Array(size);
              var nodes = 1;
              function below(x, limit) {
                  var node = 0, res = 0;
                  for (var b = 14; b >= 0; b--) {
                      var xb = (x >> b) & 1;
                      if ((limit >> b) & 1) {
                          var same = ch[node * 2 + xb];
                          if (same) res += cnt[same];
                          node = ch[node * 2 + (xb ^ 1)];
                      } else {
                          node = ch[node * 2 + xb];
                      }
                      if (!node) return res;
                  }
                  return res;
              }
              var total = 0;
              for (var i = 0; i < nums.length; i++) {
                  total += below(nums[i], high + 1) - below(nums[i], low);
                  var node = 0;
                  for (var b = 14; b >= 0; b--) {
                      var bit = (nums[i] >> b) & 1;
                      if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                      node = ch[node * 2 + bit];
                      cnt[node]++;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function countPairs(nums: number[], low: number, high: number): number {
              var size = nums.length * 15 + 2;
              var ch: number[] = [];
              var cnt: number[] = [];
              for (var i = 0; i < size; i++) { ch.push(0); ch.push(0); cnt.push(0); }
              var nodes = 1;
              var below = function(x: number, limit: number): number {
                  var node = 0, res = 0;
                  for (var b = 14; b >= 0; b--) {
                      var xb = (x >> b) & 1;
                      if ((limit >> b) & 1) {
                          var same = ch[node * 2 + xb];
                          if (same) res += cnt[same];
                          node = ch[node * 2 + (xb ^ 1)];
                      } else {
                          node = ch[node * 2 + xb];
                      }
                      if (!node) return res;
                  }
                  return res;
              };
              var total = 0;
              for (var k = 0; k < nums.length; k++) {
                  total += below(nums[k], high + 1) - below(nums[k], low);
                  var cur = 0;
                  for (var b2 = 14; b2 >= 0; b2--) {
                      var bit = (nums[k] >> b2) & 1;
                      if (!ch[cur * 2 + bit]) ch[cur * 2 + bit] = nodes++;
                      cur = ch[cur * 2 + bit];
                      cnt[cur]++;
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int countPairs(int[] nums, int low, int high) {
              int size = nums.length * 15 + 2;
              int[] ch = new int[size * 2];
              int[] cnt = new int[size];
              int nodes = 1;
              int total = 0;
              for (int v : nums) {
                  total += cpxBelow(ch, cnt, v, high + 1) - cpxBelow(ch, cnt, v, low);
                  int node = 0;
                  for (int b = 14; b >= 0; b--) {
                      int bit = (v >> b) & 1;
                      if (ch[node * 2 + bit] == 0) ch[node * 2 + bit] = nodes++;
                      node = ch[node * 2 + bit];
                      cnt[node]++;
                  }
              }
              return total;
          }

          static int cpxBelow(int[] ch, int[] cnt, int x, int limit) {
              int node = 0, res = 0;
              for (int b = 14; b >= 0; b--) {
                  int xb = (x >> b) & 1;
                  if (((limit >> b) & 1) == 1) {
                      int same = ch[node * 2 + xb];
                      if (same != 0) res += cnt[same];
                      node = ch[node * 2 + (xb ^ 1)];
                  } else {
                      node = ch[node * 2 + xb];
                  }
                  if (node == 0) return res;
              }
              return res;
          }
        `,
        cpp: code`
          static int cpxBelow(const vector<int>& ch, const vector<int>& cnt, int x, int limit) {
              int node = 0, res = 0;
              for (int b = 14; b >= 0; b--) {
                  int xb = (x >> b) & 1;
                  if ((limit >> b) & 1) {
                      int same = ch[node * 2 + xb];
                      if (same) res += cnt[same];
                      node = ch[node * 2 + (xb ^ 1)];
                  } else {
                      node = ch[node * 2 + xb];
                  }
                  if (!node) return res;
              }
              return res;
          }

          int countPairs(vector<int>& nums, int low, int high) {
              int size = (int)nums.size() * 15 + 2;
              vector<int> ch(size * 2, 0), cnt(size, 0);
              int nodes = 1, total = 0;
              for (int v : nums) {
                  total += cpxBelow(ch, cnt, v, high + 1) - cpxBelow(ch, cnt, v, low);
                  int node = 0;
                  for (int b = 14; b >= 0; b--) {
                      int bit = (v >> b) & 1;
                      if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                      node = ch[node * 2 + bit];
                      cnt[node]++;
                  }
              }
              return total;
          }
        `,
        c: code`
          static int cpxBelow(const int* ch, const int* cnt, int x, int limit) {
              int node = 0, res = 0;
              for (int b = 14; b >= 0; b--) {
                  int xb = (x >> b) & 1;
                  if ((limit >> b) & 1) {
                      int same = ch[node * 2 + xb];
                      if (same) res += cnt[same];
                      node = ch[node * 2 + (xb ^ 1)];
                  } else {
                      node = ch[node * 2 + xb];
                  }
                  if (!node) return res;
              }
              return res;
          }

          int countPairs(int* nums, int numsSize, int low, int high) {
              int size = numsSize * 15 + 2;
              int* ch = (int*) calloc((size_t)size * 2, sizeof(int));
              int* cnt = (int*) calloc((size_t)size, sizeof(int));
              int nodes = 1, total = 0;
              for (int i = 0; i < numsSize; i++) {
                  total += cpxBelow(ch, cnt, nums[i], high + 1) - cpxBelow(ch, cnt, nums[i], low);
                  int node = 0;
                  for (int b = 14; b >= 0; b--) {
                      int bit = (nums[i] >> b) & 1;
                      if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                      node = ch[node * 2 + bit];
                      cnt[node]++;
                  }
              }
              free(ch);
              free(cnt);
              return total;
          }
        `,
        csharp: code`
          public static int CountPairs(int[] nums, int low, int high)
          {
              int size = nums.Length * 15 + 2;
              int[] ch = new int[size * 2];
              int[] cnt = new int[size];
              int nodes = 1, total = 0;
              foreach (int v in nums)
              {
                  total += CpxBelow(ch, cnt, v, high + 1) - CpxBelow(ch, cnt, v, low);
                  int node = 0;
                  for (int b = 14; b >= 0; b--)
                  {
                      int bit = (v >> b) & 1;
                      if (ch[node * 2 + bit] == 0) ch[node * 2 + bit] = nodes++;
                      node = ch[node * 2 + bit];
                      cnt[node]++;
                  }
              }
              return total;
          }

          static int CpxBelow(int[] ch, int[] cnt, int x, int limit)
          {
              int node = 0, res = 0;
              for (int b = 14; b >= 0; b--)
              {
                  int xb = (x >> b) & 1;
                  if (((limit >> b) & 1) == 1)
                  {
                      int same = ch[node * 2 + xb];
                      if (same != 0) res += cnt[same];
                      node = ch[node * 2 + (xb ^ 1)];
                  }
                  else
                  {
                      node = ch[node * 2 + xb];
                  }
                  if (node == 0) return res;
              }
              return res;
          }
        `,
        go: code`
          func cpxBelow(ch []int, cnt []int, x int, limit int) int {
          	node, res := 0, 0
          	for b := uint(15); b > 0; b-- {
          		xb := (x >> (b - 1)) & 1
          		if (limit>>(b-1))&1 == 1 {
          			same := ch[node*2+xb]
          			if same != 0 {
          				res += cnt[same]
          			}
          			node = ch[node*2+(xb^1)]
          		} else {
          			node = ch[node*2+xb]
          		}
          		if node == 0 {
          			return res
          		}
          	}
          	return res
          }

          func countPairs(nums []int, low int, high int) int {
          	size := len(nums)*15 + 2
          	ch := make([]int, size*2)
          	cnt := make([]int, size)
          	nodes, total := 1, 0
          	for _, v := range nums {
          		total += cpxBelow(ch, cnt, v, high+1) - cpxBelow(ch, cnt, v, low)
          		node := 0
          		for b := uint(15); b > 0; b-- {
          			bit := (v >> (b - 1)) & 1
          			if ch[node*2+bit] == 0 {
          				ch[node*2+bit] = nodes
          				nodes++
          			}
          			node = ch[node*2+bit]
          			cnt[node]++
          		}
          	}
          	return total
          }
        `,
        kotlin: code`
          fun countPairs(nums: IntArray, low: Int, high: Int): Int {
              val size = nums.size * 15 + 2
              val ch = IntArray(size * 2)
              val cnt = IntArray(size)
              fun below(x: Int, limit: Int): Int {
                  var node = 0
                  var res = 0
                  for (b in 14 downTo 0) {
                      val xb = (x shr b) and 1
                      if (((limit shr b) and 1) == 1) {
                          val same = ch[node * 2 + xb]
                          if (same != 0) res += cnt[same]
                          node = ch[node * 2 + (xb xor 1)]
                      } else {
                          node = ch[node * 2 + xb]
                      }
                      if (node == 0) return res
                  }
                  return res
              }
              var nodes = 1
              var total = 0
              for (v in nums) {
                  total += below(v, high + 1) - below(v, low)
                  var node = 0
                  for (b in 14 downTo 0) {
                      val bit = (v shr b) and 1
                      if (ch[node * 2 + bit] == 0) {
                          ch[node * 2 + bit] = nodes
                          nodes++
                      }
                      node = ch[node * 2 + bit]
                      cnt[node]++
                  }
              }
              return total
          }
        `,
        swift: code`
          func countPairs(_ nums: [Int], _ low: Int, _ high: Int) -> Int {
              let size = nums.count * 15 + 2
              var ch = [Int](repeating: 0, count: size * 2)
              var cnt = [Int](repeating: 0, count: size)
              func below(_ x: Int, _ limit: Int) -> Int {
                  var node = 0
                  var res = 0
                  var b = 14
                  while b >= 0 {
                      let xb = (x >> b) & 1
                      if (limit >> b) & 1 == 1 {
                          let same = ch[node * 2 + xb]
                          if same != 0 { res += cnt[same] }
                          node = ch[node * 2 + (xb ^ 1)]
                      } else {
                          node = ch[node * 2 + xb]
                      }
                      if node == 0 { return res }
                      b -= 1
                  }
                  return res
              }
              var nodes = 1
              var total = 0
              for v in nums {
                  total += below(v, high + 1) - below(v, low)
                  var node = 0
                  var b = 14
                  while b >= 0 {
                      let bit = (v >> b) & 1
                      if ch[node * 2 + bit] == 0 {
                          ch[node * 2 + bit] = nodes
                          nodes += 1
                      }
                      node = ch[node * 2 + bit]
                      cnt[node] += 1
                      b -= 1
                  }
              }
              return total
          }
        `,
        rust: code`
          fn cpx_below(ch: &Vec<usize>, cnt: &Vec<i32>, x: i32, limit: i32) -> i32 {
              let mut node = 0usize;
              let mut res = 0;
              for b in (0..15).rev() {
                  let xb = ((x >> b) & 1) as usize;
                  if (limit >> b) & 1 == 1 {
                      let same = ch[node * 2 + xb];
                      if same != 0 {
                          res += cnt[same];
                      }
                      node = ch[node * 2 + (xb ^ 1)];
                  } else {
                      node = ch[node * 2 + xb];
                  }
                  if node == 0 {
                      return res;
                  }
              }
              res
          }

          fn countPairs(nums: Vec<i32>, low: i32, high: i32) -> i32 {
              let size = nums.len() * 15 + 2;
              let mut ch = vec![0usize; size * 2];
              let mut cnt = vec![0i32; size];
              let mut nodes = 1usize;
              let mut total = 0;
              for &v in nums.iter() {
                  total += cpx_below(&ch, &cnt, v, high + 1) - cpx_below(&ch, &cnt, v, low);
                  let mut node = 0usize;
                  for b in (0..15).rev() {
                      let bit = ((v >> b) & 1) as usize;
                      if ch[node * 2 + bit] == 0 {
                          ch[node * 2 + bit] = nodes;
                          nodes += 1;
                      }
                      node = ch[node * 2 + bit];
                      cnt[node] += 1;
                  }
              }
              total
          }
        `,
        php: code`
          function cpxBelow(&$ch, &$cnt, $x, $limit) {
              $node = 0;
              $res = 0;
              for ($b = 14; $b >= 0; $b--) {
                  $xb = ($x >> $b) & 1;
                  if (($limit >> $b) & 1) {
                      $same = $ch[$node * 2 + $xb];
                      if ($same) $res += $cnt[$same];
                      $node = $ch[$node * 2 + ($xb ^ 1)];
                  } else {
                      $node = $ch[$node * 2 + $xb];
                  }
                  if (!$node) return $res;
              }
              return $res;
          }

          function countPairs($nums, $low, $high) {
              $size = count($nums) * 15 + 2;
              $ch = array_fill(0, $size * 2, 0);
              $cnt = array_fill(0, $size, 0);
              $nodes = 1;
              $total = 0;
              foreach ($nums as $v) {
                  $total += cpxBelow($ch, $cnt, $v, $high + 1) - cpxBelow($ch, $cnt, $v, $low);
                  $node = 0;
                  for ($b = 14; $b >= 0; $b--) {
                      $bit = ($v >> $b) & 1;
                      if (!$ch[$node * 2 + $bit]) {
                          $ch[$node * 2 + $bit] = $nodes;
                          $nodes++;
                      }
                      $node = $ch[$node * 2 + $bit];
                      $cnt[$node]++;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def cpx_below(ch, cnt, x, limit)
            node = 0
            res = 0
            14.downto(0) do |b|
              xb = (x >> b) & 1
              if (limit >> b) & 1 == 1
                same = ch[node * 2 + xb]
                res += cnt[same] if same != 0
                node = ch[node * 2 + (xb ^ 1)]
              else
                node = ch[node * 2 + xb]
              end
              return res if node == 0
            end
            res
          end

          def countPairs(nums, low, high)
            size = nums.length * 15 + 2
            ch = Array.new(size * 2, 0)
            cnt = Array.new(size, 0)
            nodes = 1
            total = 0
            nums.each do |v|
              total += cpx_below(ch, cnt, v, high + 1) - cpx_below(ch, cnt, v, low)
              node = 0
              14.downto(0) do |b|
                bit = (v >> b) & 1
                if ch[node * 2 + bit] == 0
                  ch[node * 2 + bit] = nodes
                  nodes += 1
                end
                node = ch[node * 2 + bit]
                cnt[node] += 1
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum XOR With an Element From Array (LC 1707) ────────────
  (() => {
    const ref = (nums: number[], queries: number[][]) => queries.map(([x, m]) => {
      let best = -1;
      for (const v of nums) if (v <= m) best = Math.max(best, (v ^ x) >>> 0);
      return best;
    });
    return {
      slug: "maximum-xor-with-an-element-from-array",
      title: "Maximum XOR With an Element From Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Bit Manipulation", "Trie", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "maximizeXor",
        params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given an array `nums` of non-negative integers and an array `queries` where `queries[i] = [xi, mi]`.\n\nThe answer to query `i` is the largest value of `xi XOR nums[j]` over all indices `j` with `nums[j] <= mi`. If every element of `nums` is larger than `mi`, the answer is `-1`.\n\nReturn an array `answer` with `answer[i]` the answer to the `i`-th query.",
        [
          { in: "nums = [0,1,2,3,4], queries = [[3,1],[1,3],[5,6]]", out: "[3,3,7]", note: "Query 0 may use 0 and 1: `3 XOR 0 = 3`. Query 1 may use 0..3: `1 XOR 2 = 3`. Query 2 may use everything: `5 XOR 2 = 7`." },
          { in: "nums = [6,9,12], queries = [[8,5],[4,10],[0,20]]", out: "[-1,13,12]", note: "No element is at most 5. With limit 10, `4 XOR 9 = 13` beats `4 XOR 6 = 2`." },
        ],
        ["1 <= nums.length, queries.length <= 10^5", "queries[i].length == 2", "0 <= nums[j], xi, mi <= 10^9"]),
      hints: [
        "Without the limit this is the classic maximum-XOR query: a binary trie of the numbers, walked greedily from the top bit.",
        "The limit only removes numbers. Can you answer the queries in an order where the allowed set only grows?",
        "Sort `nums` and sort the queries by `mi`; before each query insert every number `<= mi` into the trie, then walk it preferring the opposite bit of `xi`.",
      ],
      editorial: explain({
        idea: "Answer the queries offline in increasing order of `mi`, so the set of allowed numbers only grows and a single binary trie can hold exactly them.",
        steps: [
          "Sort `nums`, and sort the query indices by `mi`.",
          "Keep a pointer into the sorted `nums`. For each query in that order, insert every number `<= mi` into a 30-level binary trie (10^9 < 2^30).",
          "If nothing has been inserted, the answer is -1.",
          "Otherwise walk from bit 29 down: at each level go to the child holding the opposite of `xi`'s bit if it exists (that bit of the XOR becomes 1), else the other child. The bits collected form the answer.",
          "Store each answer at its original query index.",
        ],
        why: "After the insertions the trie contains precisely the numbers allowed by the current query. The greedy walk is optimal because a 1 in a higher XOR bit outweighs every lower bit combined, so whenever the opposite bit is available taking it can never be beaten.",
        time: "O((n + q) · 30 + n log n + q log q)",
        space: "O(n · 30)",
        pitfalls: [
          "Answers must be returned in the original query order, not the sorted one.",
          "Use `<= mi`, not `< mi`, when inserting.",
          "Return -1 only when no number is allowed — an allowed number can still give XOR 0.",
        ],
      }),
      examples: [
        { input: "[0,1,2,3,4]\n[[3,1],[1,3],[5,6]]", expectedOutput: "[3,3,7]" },
        { input: "[6,9,12]\n[[8,5],[4,10],[0,20]]", expectedOutput: "[-1,13,12]" },
      ],
      gen: (rng: Rng) => {
        const hi = pick(rng, [15, 1000, 1000000000]);
        const n = pick(rng, [1, ri(rng, 1, 6), ri(rng, 1, 20)]);
        const q = pick(rng, [1, ri(rng, 1, 6), ri(rng, 1, 12)]);
        const nums = Array.from({ length: n }, () => randVal(rng, hi));
        const queries = Array.from({ length: q }, () => [randVal(rng, hi), randVal(rng, hi)]);
        return { input: `${fmtIntArr(nums)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(nums, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximizeXor(nums: List[int], queries: List[List[int]]) -> List[int]:
              srt = sorted(nums)
              order = sorted(range(len(queries)), key=lambda i: queries[i][1])
              ch = [0] * ((len(srt) * 30 + 2) * 2)
              nodes = 1
              p = 0
              ans = [0] * len(queries)
              for qi in order:
                  x, m = queries[qi]
                  while p < len(srt) and srt[p] <= m:
                      node = 0
                      v = srt[p]
                      for b in range(29, -1, -1):
                          bit = (v >> b) & 1
                          if not ch[node * 2 + bit]:
                              ch[node * 2 + bit] = nodes
                              nodes += 1
                          node = ch[node * 2 + bit]
                      p += 1
                  if p == 0:
                      ans[qi] = -1
                      continue
                  cur = 0
                  best = 0
                  for b in range(29, -1, -1):
                      want = ((x >> b) & 1) ^ 1
                      if ch[cur * 2 + want]:
                          best |= 1 << b
                          cur = ch[cur * 2 + want]
                      else:
                          cur = ch[cur * 2 + (want ^ 1)]
                  ans[qi] = best
              return ans
        `,
        javascript: code`
          var maximizeXor = function(nums, queries) {
              var srt = nums.slice().sort(function(a, b) { return a - b; });
              var order = [];
              for (var i = 0; i < queries.length; i++) order.push(i);
              order.sort(function(a, b) { return queries[a][1] - queries[b][1]; });
              var ch = new Int32Array((srt.length * 30 + 2) * 2);
              var nodes = 1, p = 0;
              var ans = new Array(queries.length);
              for (var t = 0; t < order.length; t++) {
                  var qi = order[t], x = queries[qi][0], m = queries[qi][1];
                  while (p < srt.length && srt[p] <= m) {
                      var node = 0;
                      for (var b = 29; b >= 0; b--) {
                          var bit = (srt[p] >> b) & 1;
                          if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                          node = ch[node * 2 + bit];
                      }
                      p++;
                  }
                  if (p === 0) { ans[qi] = -1; continue; }
                  var cur = 0, best = 0;
                  for (var b2 = 29; b2 >= 0; b2--) {
                      var want = ((x >> b2) & 1) ^ 1;
                      if (ch[cur * 2 + want]) { best |= 1 << b2; cur = ch[cur * 2 + want]; }
                      else cur = ch[cur * 2 + (want ^ 1)];
                  }
                  ans[qi] = best;
              }
              return ans;
          };
        `,
        typescript: code`
          function maximizeXor(nums: number[], queries: number[][]): number[] {
              var srt = nums.slice().sort(function(a, b) { return a - b; });
              var order: number[] = [];
              for (var i = 0; i < queries.length; i++) order.push(i);
              order.sort(function(a, b) { return queries[a][1] - queries[b][1]; });
              var ch: number[] = [];
              var cap = (srt.length * 30 + 2) * 2;
              for (var z = 0; z < cap; z++) ch.push(0);
              var nodes = 1, p = 0;
              var ans: number[] = [];
              for (var y = 0; y < queries.length; y++) ans.push(0);
              for (var t = 0; t < order.length; t++) {
                  var qi = order[t], x = queries[qi][0], m = queries[qi][1];
                  while (p < srt.length && srt[p] <= m) {
                      var node = 0;
                      for (var b = 29; b >= 0; b--) {
                          var bit = (srt[p] >> b) & 1;
                          if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                          node = ch[node * 2 + bit];
                      }
                      p++;
                  }
                  if (p === 0) { ans[qi] = -1; continue; }
                  var cur = 0, best = 0;
                  for (var b2 = 29; b2 >= 0; b2--) {
                      var want = ((x >> b2) & 1) ^ 1;
                      if (ch[cur * 2 + want]) { best |= 1 << b2; cur = ch[cur * 2 + want]; }
                      else cur = ch[cur * 2 + (want ^ 1)];
                  }
                  ans[qi] = best;
              }
              return ans;
          }
        `,
        java: code`
          public static int[] maximizeXor(int[] nums, int[][] queries) {
              int[] srt = nums.clone();
              Arrays.sort(srt);
              int q = queries.length;
              Integer[] order = new Integer[q];
              for (int i = 0; i < q; i++) order[i] = i;
              Arrays.sort(order, (a, b) -> Integer.compare(queries[a][1], queries[b][1]));
              int[] ch = new int[(srt.length * 30 + 2) * 2];
              int nodes = 1, p = 0;
              int[] ans = new int[q];
              for (int t = 0; t < q; t++) {
                  int qi = order[t], x = queries[qi][0], m = queries[qi][1];
                  while (p < srt.length && srt[p] <= m) {
                      int node = 0;
                      for (int b = 29; b >= 0; b--) {
                          int bit = (srt[p] >> b) & 1;
                          if (ch[node * 2 + bit] == 0) ch[node * 2 + bit] = nodes++;
                          node = ch[node * 2 + bit];
                      }
                      p++;
                  }
                  if (p == 0) { ans[qi] = -1; continue; }
                  int cur = 0, best = 0;
                  for (int b = 29; b >= 0; b--) {
                      int want = ((x >> b) & 1) ^ 1;
                      if (ch[cur * 2 + want] != 0) { best |= 1 << b; cur = ch[cur * 2 + want]; }
                      else cur = ch[cur * 2 + (want ^ 1)];
                  }
                  ans[qi] = best;
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> maximizeXor(vector<int>& nums, vector<vector<int>>& queries) {
              vector<int> srt(nums);
              sort(srt.begin(), srt.end());
              int q = queries.size();
              vector<int> order(q);
              for (int i = 0; i < q; i++) order[i] = i;
              sort(order.begin(), order.end(), [&](int a, int b) { return queries[a][1] < queries[b][1]; });
              vector<int> ch(((int)srt.size() * 30 + 2) * 2, 0);
              int nodes = 1, p = 0;
              vector<int> ans(q);
              for (int t = 0; t < q; t++) {
                  int qi = order[t], x = queries[qi][0], m = queries[qi][1];
                  while (p < (int)srt.size() && srt[p] <= m) {
                      int node = 0;
                      for (int b = 29; b >= 0; b--) {
                          int bit = (srt[p] >> b) & 1;
                          if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                          node = ch[node * 2 + bit];
                      }
                      p++;
                  }
                  if (p == 0) { ans[qi] = -1; continue; }
                  int cur = 0, best = 0;
                  for (int b = 29; b >= 0; b--) {
                      int want = ((x >> b) & 1) ^ 1;
                      if (ch[cur * 2 + want]) { best |= 1 << b; cur = ch[cur * 2 + want]; }
                      else cur = ch[cur * 2 + (want ^ 1)];
                  }
                  ans[qi] = best;
              }
              return ans;
          }
        `,
        c: code`
          static int* mxqKeys;

          static int mxqOrderCmp(const void* a, const void* b) {
              int x = mxqKeys[*(const int*)a], y = mxqKeys[*(const int*)b];
              return (x > y) - (x < y);
          }

          static int mxqIntCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int* maximizeXor(int* nums, int numsSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int* srt = (int*) malloc((numsSize + 1) * sizeof(int));
              for (int i = 0; i < numsSize; i++) srt[i] = nums[i];
              qsort(srt, numsSize, sizeof(int), mxqIntCmp);
              int* keys = (int*) malloc((queriesSize + 1) * sizeof(int));
              int* order = (int*) malloc((queriesSize + 1) * sizeof(int));
              for (int i = 0; i < queriesSize; i++) { keys[i] = queries[i][1]; order[i] = i; }
              mxqKeys = keys;
              qsort(order, queriesSize, sizeof(int), mxqOrderCmp);
              int* ch = (int*) calloc((size_t)(numsSize * 30 + 2) * 2, sizeof(int));
              int nodes = 1, p = 0;
              int* ans = (int*) malloc((queriesSize + 1) * sizeof(int));
              for (int t = 0; t < queriesSize; t++) {
                  int qi = order[t], x = queries[qi][0], m = queries[qi][1];
                  while (p < numsSize && srt[p] <= m) {
                      int node = 0;
                      for (int b = 29; b >= 0; b--) {
                          int bit = (srt[p] >> b) & 1;
                          if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                          node = ch[node * 2 + bit];
                      }
                      p++;
                  }
                  if (p == 0) { ans[qi] = -1; continue; }
                  int cur = 0, best = 0;
                  for (int b = 29; b >= 0; b--) {
                      int want = ((x >> b) & 1) ^ 1;
                      if (ch[cur * 2 + want]) { best |= 1 << b; cur = ch[cur * 2 + want]; }
                      else cur = ch[cur * 2 + (want ^ 1)];
                  }
                  ans[qi] = best;
              }
              free(srt);
              free(keys);
              free(order);
              free(ch);
              *returnSize = queriesSize;
              return ans;
          }
        `,
        csharp: code`
          public static int[] MaximizeXor(int[] nums, int[][] queries)
          {
              int[] srt = (int[])nums.Clone();
              Array.Sort(srt);
              int q = queries.Length;
              int[] order = Enumerable.Range(0, q).OrderBy(i => queries[i][1]).ToArray();
              int[] ch = new int[(srt.Length * 30 + 2) * 2];
              int nodes = 1, p = 0;
              int[] ans = new int[q];
              foreach (int qi in order)
              {
                  int x = queries[qi][0], m = queries[qi][1];
                  while (p < srt.Length && srt[p] <= m)
                  {
                      int node = 0;
                      for (int b = 29; b >= 0; b--)
                      {
                          int bit = (srt[p] >> b) & 1;
                          if (ch[node * 2 + bit] == 0) ch[node * 2 + bit] = nodes++;
                          node = ch[node * 2 + bit];
                      }
                      p++;
                  }
                  if (p == 0) { ans[qi] = -1; continue; }
                  int cur = 0, best = 0;
                  for (int b = 29; b >= 0; b--)
                  {
                      int want = ((x >> b) & 1) ^ 1;
                      if (ch[cur * 2 + want] != 0) { best |= 1 << b; cur = ch[cur * 2 + want]; }
                      else cur = ch[cur * 2 + (want ^ 1)];
                  }
                  ans[qi] = best;
              }
              return ans;
          }
        `,
        go: code`
          func maximizeXor(nums []int, queries [][]int) []int {
          	srt := make([]int, len(nums))
          	copy(srt, nums)
          	sort.Ints(srt)
          	q := len(queries)
          	order := make([]int, q)
          	for i := 0; i < q; i++ {
          		order[i] = i
          	}
          	sort.Slice(order, func(a, b int) bool { return queries[order[a]][1] < queries[order[b]][1] })
          	ch := make([]int, (len(srt)*30+2)*2)
          	nodes, p := 1, 0
          	ans := make([]int, q)
          	for _, qi := range order {
          		x, m := queries[qi][0], queries[qi][1]
          		for p < len(srt) && srt[p] <= m {
          			node := 0
          			for b := uint(30); b > 0; b-- {
          				bit := (srt[p] >> (b - 1)) & 1
          				if ch[node*2+bit] == 0 {
          					ch[node*2+bit] = nodes
          					nodes++
          				}
          				node = ch[node*2+bit]
          			}
          			p++
          		}
          		if p == 0 {
          			ans[qi] = -1
          			continue
          		}
          		cur, best := 0, 0
          		for b := uint(30); b > 0; b-- {
          			want := ((x >> (b - 1)) & 1) ^ 1
          			if ch[cur*2+want] != 0 {
          				best |= 1 << (b - 1)
          				cur = ch[cur*2+want]
          			} else {
          				cur = ch[cur*2+(want^1)]
          			}
          		}
          		ans[qi] = best
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun maximizeXor(nums: IntArray, queries: Array<IntArray>): IntArray {
              val srt = nums.copyOf()
              srt.sort()
              val q = queries.size
              val order = (0 until q).sortedBy { queries[it][1] }
              val ch = IntArray((srt.size * 30 + 2) * 2)
              var nodes = 1
              var p = 0
              val ans = IntArray(q)
              for (qi in order) {
                  val x = queries[qi][0]
                  val m = queries[qi][1]
                  while (p < srt.size && srt[p] <= m) {
                      var node = 0
                      for (b in 29 downTo 0) {
                          val bit = (srt[p] shr b) and 1
                          if (ch[node * 2 + bit] == 0) {
                              ch[node * 2 + bit] = nodes
                              nodes++
                          }
                          node = ch[node * 2 + bit]
                      }
                      p++
                  }
                  if (p == 0) {
                      ans[qi] = -1
                      continue
                  }
                  var cur = 0
                  var best = 0
                  for (b in 29 downTo 0) {
                      val want = ((x shr b) and 1) xor 1
                      if (ch[cur * 2 + want] != 0) {
                          best = best or (1 shl b)
                          cur = ch[cur * 2 + want]
                      } else {
                          cur = ch[cur * 2 + (want xor 1)]
                      }
                  }
                  ans[qi] = best
              }
              return ans
          }
        `,
        swift: code`
          func maximizeXor(_ nums: [Int], _ queries: [[Int]]) -> [Int] {
              let srt = nums.sorted()
              let q = queries.count
              let order = (0..<q).sorted { queries[$0][1] < queries[$1][1] }
              var ch = [Int](repeating: 0, count: (srt.count * 30 + 2) * 2)
              var nodes = 1
              var p = 0
              var ans = [Int](repeating: 0, count: q)
              for qi in order {
                  let x = queries[qi][0]
                  let m = queries[qi][1]
                  while p < srt.count && srt[p] <= m {
                      var node = 0
                      var b = 29
                      while b >= 0 {
                          let bit = (srt[p] >> b) & 1
                          if ch[node * 2 + bit] == 0 {
                              ch[node * 2 + bit] = nodes
                              nodes += 1
                          }
                          node = ch[node * 2 + bit]
                          b -= 1
                      }
                      p += 1
                  }
                  if p == 0 {
                      ans[qi] = -1
                      continue
                  }
                  var cur = 0
                  var best = 0
                  var b = 29
                  while b >= 0 {
                      let want = ((x >> b) & 1) ^ 1
                      if ch[cur * 2 + want] != 0 {
                          best |= 1 << b
                          cur = ch[cur * 2 + want]
                      } else {
                          cur = ch[cur * 2 + (want ^ 1)]
                      }
                      b -= 1
                  }
                  ans[qi] = best
              }
              return ans
          }
        `,
        rust: code`
          fn maximizeXor(nums: Vec<i32>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let mut srt = nums.clone();
              srt.sort();
              let q = queries.len();
              let mut order: Vec<usize> = (0..q).collect();
              order.sort_by_key(|&i| queries[i][1]);
              let mut ch = vec![0usize; (srt.len() * 30 + 2) * 2];
              let mut nodes = 1usize;
              let mut p = 0usize;
              let mut ans = vec![0i32; q];
              for &qi in order.iter() {
                  let x = queries[qi][0];
                  let m = queries[qi][1];
                  while p < srt.len() && srt[p] <= m {
                      let mut node = 0usize;
                      for b in (0..30).rev() {
                          let bit = ((srt[p] >> b) & 1) as usize;
                          if ch[node * 2 + bit] == 0 {
                              ch[node * 2 + bit] = nodes;
                              nodes += 1;
                          }
                          node = ch[node * 2 + bit];
                      }
                      p += 1;
                  }
                  if p == 0 {
                      ans[qi] = -1;
                      continue;
                  }
                  let mut cur = 0usize;
                  let mut best = 0i32;
                  for b in (0..30).rev() {
                      let want = (((x >> b) & 1) ^ 1) as usize;
                      if ch[cur * 2 + want] != 0 {
                          best |= 1 << b;
                          cur = ch[cur * 2 + want];
                      } else {
                          cur = ch[cur * 2 + (want ^ 1)];
                      }
                  }
                  ans[qi] = best;
              }
              ans
          }
        `,
        php: code`
          function maximizeXor($nums, $queries) {
              $srt = $nums;
              sort($srt);
              $q = count($queries);
              $order = range(0, $q - 1);
              usort($order, function($a, $b) use ($queries) { return $queries[$a][1] <=> $queries[$b][1]; });
              $ch = array_fill(0, (count($srt) * 30 + 2) * 2, 0);
              $nodes = 1;
              $p = 0;
              $n = count($srt);
              $ans = array_fill(0, $q, 0);
              foreach ($order as $qi) {
                  $x = $queries[$qi][0];
                  $m = $queries[$qi][1];
                  while ($p < $n && $srt[$p] <= $m) {
                      $node = 0;
                      for ($b = 29; $b >= 0; $b--) {
                          $bit = ($srt[$p] >> $b) & 1;
                          if (!$ch[$node * 2 + $bit]) {
                              $ch[$node * 2 + $bit] = $nodes;
                              $nodes++;
                          }
                          $node = $ch[$node * 2 + $bit];
                      }
                      $p++;
                  }
                  if ($p == 0) {
                      $ans[$qi] = -1;
                      continue;
                  }
                  $cur = 0;
                  $best = 0;
                  for ($b = 29; $b >= 0; $b--) {
                      $want = (($x >> $b) & 1) ^ 1;
                      if ($ch[$cur * 2 + $want]) {
                          $best |= 1 << $b;
                          $cur = $ch[$cur * 2 + $want];
                      } else {
                          $cur = $ch[$cur * 2 + ($want ^ 1)];
                      }
                  }
                  $ans[$qi] = $best;
              }
              return $ans;
          }
        `,
        ruby: code`
          def maximizeXor(nums, queries)
            srt = nums.sort
            q = queries.length
            order = (0...q).sort_by { |i| queries[i][1] }
            ch = Array.new((srt.length * 30 + 2) * 2, 0)
            nodes = 1
            p = 0
            ans = Array.new(q, 0)
            order.each do |qi|
              x, m = queries[qi]
              while p < srt.length && srt[p] <= m
                node = 0
                29.downto(0) do |b|
                  bit = (srt[p] >> b) & 1
                  if ch[node * 2 + bit] == 0
                    ch[node * 2 + bit] = nodes
                    nodes += 1
                  end
                  node = ch[node * 2 + bit]
                end
                p += 1
              end
              if p == 0
                ans[qi] = -1
                next
              end
              cur = 0
              best = 0
              29.downto(0) do |b|
                want = ((x >> b) & 1) ^ 1
                if ch[cur * 2 + want] != 0
                  best |= 1 << b
                  cur = ch[cur * 2 + want]
                else
                  cur = ch[cur * 2 + (want ^ 1)]
                end
              end
              ans[qi] = best
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Triples with Bitwise AND Equal To Zero (LC 982) ─────────────
  (() => {
    const ref = (nums: number[]) => {
      let c = 0;
      for (const a of nums) for (const b of nums) for (const d of nums) if ((a & b & d) === 0) c++;
      return c;
    };
    return {
      slug: "triples-with-bitwise-and-equal-to-zero",
      title: "Triples with Bitwise AND Equal To Zero",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Flipkart", "Amazon"],
      signature: { funcName: "countTriplets", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, count the **AND triples**: ordered triples of indices `(i, j, k)` with `0 <= i, j, k < nums.length` (indices may repeat) such that `nums[i] AND nums[j] AND nums[k] == 0`.\n\nReturn the number of AND triples.",
        [
          { in: "nums = [1,2]", out: "6", note: "Of the 8 index triples only `(0,0,0)` (AND 1) and `(1,1,1)` (AND 2) are non-zero." },
          { in: "nums = [0]", out: "1" },
          { in: "nums = [4,4,3]", out: "18", note: "The AND is non-zero only when all three indices pick a 4 (8 triples) or all pick the 3 (1 triple): 27 - 9 = 18." },
        ],
        ["1 <= nums.length <= 1000", "0 <= nums[i] < 2^16"]),
      hints: [
        "Three nested loops cost 10^9 steps. Can two of the indices be handled together?",
        "`nums[i] AND nums[j]` takes at most 2^16 distinct values. Count how often each one occurs over all ordered pairs.",
        "Then, for each `nums[k]`, add the counts of the pair-ANDs `p` with `p AND nums[k] == 0`.",
      ],
      editorial: explain({
        idea: "Split the triple into a pair and a single element: tabulate how many ordered pairs produce each AND value, then match every third element against the table.",
        steps: [
          "For every ordered pair `(i, j)`, increment `count[nums[i] AND nums[j]]`, and remember each value the first time it appears.",
          "For every `k`, walk the distinct pair-AND values `p` and add `count[p]` whenever `p AND nums[k] == 0`.",
          "Return the sum.",
        ],
        why: "Each triple `(i, j, k)` is counted exactly once: its pair `(i, j)` lands in the bucket of its AND value `p`, and that bucket is added for `k` precisely when `p AND nums[k] == 0`, which is the triple's condition.",
        time: "O(n² + n · d), d = distinct pair ANDs ≤ min(n², 2^16)",
        space: "O(2^16)",
        pitfalls: [
          "Triples are ordered and indices may repeat — `(0,0,0)` counts, and `(0,1,2)` differs from `(2,1,0)`.",
          "The count can reach 10^9; it still fits a 32-bit signed integer, but only just.",
          "Scanning all 2^16 values for every `k` is correct but much slower than scanning only the values that occur.",
        ],
      }),
      examples: [
        { input: "[1,2]", expectedOutput: "6" },
        { input: "[0]", expectedOutput: "1" },
        { input: "[4,4,3]", expectedOutput: "18" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 5), ri(rng, 1, 15)]);
        const hi = pick(rng, [3, 15, 255, 65535]);
        const nums = Array.from({ length: n }, () => {
          if (rng() < 0.6) return ri(rng, 0, hi);
          let v = hi;
          for (let t = 0; t < 3; t++) v &= ri(rng, 0, hi);
          return v | (1 << ri(rng, 0, 3));
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countTriplets(nums: List[int]) -> int:
              pairs = {}
              for a in nums:
                  for b in nums:
                      v = a & b
                      pairs[v] = pairs.get(v, 0) + 1
              items = list(pairs.items())
              total = 0
              for c in nums:
                  for v, k in items:
                      if (v & c) == 0:
                          total += k
              return total
        `,
        javascript: code`
          var countTriplets = function(nums) {
              var cnt = new Map();
              for (var i = 0; i < nums.length; i++) {
                  for (var j = 0; j < nums.length; j++) {
                      var v = nums[i] & nums[j];
                      cnt.set(v, (cnt.get(v) || 0) + 1);
                  }
              }
              var keys = [], vals = [];
              cnt.forEach(function(c, key) { keys.push(key); vals.push(c); });
              var total = 0;
              for (var k = 0; k < nums.length; k++) {
                  for (var t = 0; t < keys.length; t++) {
                      if ((keys[t] & nums[k]) === 0) total += vals[t];
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function countTriplets(nums: number[]): number {
              var cnt: { [key: string]: number } = {};
              var keys: number[] = [];
              for (var i = 0; i < nums.length; i++) {
                  for (var j = 0; j < nums.length; j++) {
                      var v = nums[i] & nums[j];
                      var key = "" + v;
                      if (cnt[key] === undefined) { cnt[key] = 0; keys.push(v); }
                      cnt[key]++;
                  }
              }
              var total = 0;
              for (var k = 0; k < nums.length; k++) {
                  for (var t = 0; t < keys.length; t++) {
                      if ((keys[t] & nums[k]) === 0) total += cnt["" + keys[t]];
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int countTriplets(int[] nums) {
              int[] cnt = new int[1 << 16];
              int[] keys = new int[Math.min(nums.length * nums.length, 1 << 16)];
              int nk = 0;
              for (int a : nums) {
                  for (int b : nums) {
                      int v = a & b;
                      if (cnt[v]++ == 0) keys[nk++] = v;
                  }
              }
              int total = 0;
              for (int c : nums) {
                  for (int t = 0; t < nk; t++) {
                      if ((keys[t] & c) == 0) total += cnt[keys[t]];
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int countTriplets(vector<int>& nums) {
              vector<int> cnt(1 << 16, 0);
              vector<int> keys;
              for (int a : nums) {
                  for (int b : nums) {
                      int v = a & b;
                      if (cnt[v]++ == 0) keys.push_back(v);
                  }
              }
              int total = 0;
              for (int c : nums) {
                  for (int v : keys) {
                      if ((v & c) == 0) total += cnt[v];
                  }
              }
              return total;
          }
        `,
        c: code`
          int countTriplets(int* nums, int numsSize) {
              int* cnt = (int*) calloc(1 << 16, sizeof(int));
              int* keys = (int*) malloc((1 << 16) * sizeof(int));
              int nk = 0;
              for (int i = 0; i < numsSize; i++) {
                  for (int j = 0; j < numsSize; j++) {
                      int v = nums[i] & nums[j];
                      if (cnt[v]++ == 0) keys[nk++] = v;
                  }
              }
              int total = 0;
              for (int k = 0; k < numsSize; k++) {
                  for (int t = 0; t < nk; t++) {
                      if ((keys[t] & nums[k]) == 0) total += cnt[keys[t]];
                  }
              }
              free(cnt);
              free(keys);
              return total;
          }
        `,
        csharp: code`
          public static int CountTriplets(int[] nums)
          {
              var cnt = new Dictionary<int, int>();
              foreach (int a in nums)
              {
                  foreach (int b in nums)
                  {
                      int v = a & b;
                      int cur;
                      cnt.TryGetValue(v, out cur);
                      cnt[v] = cur + 1;
                  }
              }
              int total = 0;
              foreach (int c in nums)
              {
                  foreach (var kv in cnt)
                  {
                      if ((kv.Key & c) == 0) total += kv.Value;
                  }
              }
              return total;
          }
        `,
        go: code`
          func countTriplets(nums []int) int {
          	cnt := map[int]int{}
          	for _, a := range nums {
          		for _, b := range nums {
          			cnt[a&b]++
          		}
          	}
          	total := 0
          	for _, c := range nums {
          		for v, k := range cnt {
          			if v&c == 0 {
          				total += k
          			}
          		}
          	}
          	return total
          }
        `,
        kotlin: code`
          fun countTriplets(nums: IntArray): Int {
              val cnt = HashMap<Int, Int>()
              for (a in nums) {
                  for (b in nums) {
                      val v = a and b
                      cnt[v] = (cnt[v] ?: 0) + 1
                  }
              }
              var total = 0
              for (c in nums) {
                  for ((v, k) in cnt) {
                      if ((v and c) == 0) total += k
                  }
              }
              return total
          }
        `,
        swift: code`
          func countTriplets(_ nums: [Int]) -> Int {
              var cnt = [Int: Int]()
              for a in nums {
                  for b in nums {
                      cnt[a & b, default: 0] += 1
                  }
              }
              var total = 0
              for c in nums {
                  for (v, k) in cnt where v & c == 0 {
                      total += k
                  }
              }
              return total
          }
        `,
        rust: code`
          fn countTriplets(nums: Vec<i32>) -> i32 {
              let mut cnt = vec![0i32; 1 << 16];
              let mut keys: Vec<usize> = Vec::new();
              for &a in nums.iter() {
                  for &b in nums.iter() {
                      let v = (a & b) as usize;
                      if cnt[v] == 0 {
                          keys.push(v);
                      }
                      cnt[v] += 1;
                  }
              }
              let mut total = 0i32;
              for &c in nums.iter() {
                  for &v in keys.iter() {
                      if (v as i32) & c == 0 {
                          total += cnt[v];
                      }
                  }
              }
              total
          }
        `,
        php: code`
          function countTriplets($nums) {
              $cnt = [];
              foreach ($nums as $a) {
                  foreach ($nums as $b) {
                      $v = $a & $b;
                      $cnt[$v] = (isset($cnt[$v]) ? $cnt[$v] : 0) + 1;
                  }
              }
              $total = 0;
              foreach ($nums as $c) {
                  foreach ($cnt as $v => $k) {
                      if (($v & $c) == 0) $total += $k;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def countTriplets(nums)
            cnt = Hash.new(0)
            nums.each do |a|
              nums.each { |b| cnt[a & b] += 1 }
            end
            total = 0
            nums.each do |c|
              cnt.each { |v, k| total += k if (v & c) == 0 }
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Score Words Formed by Letters (LC 1255) ─────────────
  (() => {
    const ref = (words: string[], letters: string[], score: number[]) => {
      let best = 0;
      for (let mask = 0; mask < 1 << words.length; mask++) {
        const have = new Array(26).fill(0);
        for (const l of letters) have[l.charCodeAt(0) - 97]++;
        let s = 0, ok = true;
        for (let i = 0; i < words.length && ok; i++) {
          if (!(mask >> i & 1)) continue;
          for (const ch of words[i]) {
            const c = ch.charCodeAt(0) - 97;
            if (--have[c] < 0) { ok = false; break; }
            s += score[c];
          }
        }
        if (ok && s > best) best = s;
      }
      return best;
    };
    const SCORE1 = [1, 0, 3, 2, 1, 0, 0, 0, 1, 0, 5, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];
    const ONES = new Array(26).fill(1);
    const SCORE3 = [4].concat(new Array(25).fill(0));
    return {
      slug: "maximum-score-words-formed-by-letters",
      title: "Maximum Score Words Formed by Letters",
      difficulty: "HARD" as const,
      tags: ["Array", "String", "Backtracking", "Bitmask", "Amazon", "Google"],
      signature: {
        funcName: "maxScoreWords",
        params: [{ name: "words", type: "string[]" as const }, { name: "letters", type: "string[]" as const }, { name: "score", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a list of `words`, a pool of `letters` (each entry is a single lowercase letter; letters may repeat) and an array `score` of length 26, where `score[0]` is the value of `'a'`, `score[1]` the value of `'b'`, and so on.\n\nChoose any set of the words — each word at most once — that can be spelled together from the pool, where every letter tile is used at most once. The score of the set is the sum of the values of all letters in the chosen words.\n\nReturn the **maximum** score of any valid set (the empty set scores 0). You do not have to use every letter.",
        [
          { in: "words = [\"code\",\"kairo\",\"ode\"], letters = [\"c\",\"o\",\"d\",\"e\",\"k\",\"a\",\"i\",\"r\",\"o\"], score = [1,0,3,2,1,0,0,0,1,0,5,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0]", out: "16", note: "\"code\" (7) and \"kairo\" (9) use the two `o` tiles between them. \"code\" and \"ode\" would need two `d` tiles." },
          { in: "words = [\"xyz\"], letters = [\"x\",\"y\"], score = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]", out: "0" },
          { in: "words = [\"aa\",\"a\"], letters = [\"a\",\"a\",\"a\"], score = [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]", out: "12" },
        ],
        ["1 <= words.length <= 14", "1 <= words[i].length <= 15", "1 <= letters.length <= 100", "letters[i].length == 1", "score.length == 26", "0 <= score[i] <= 10", "words[i] and letters[i] contain only lowercase English letters"]),
      hints: [
        "With at most 14 words there are at most 2^14 subsets — few enough to try them all.",
        "Keep a count of the tiles still available; a word can be added only if the counts cover it.",
        "Backtrack word by word: skip it, or (if it fits) subtract its letters, recurse, and add them back.",
      ],
      editorial: explain({
        idea: "The word list is tiny, so search every subset by backtracking, carrying the remaining tile counts and pruning any branch that would overdraw a letter.",
        steps: [
          "Count the available tiles per letter and precompute each word's value.",
          "`dfs(i)` returns the best score using words `i..n-1`: first try skipping word `i`.",
          "Then subtract word `i`'s letters from the counts; if no count went negative, try `value[i] + dfs(i + 1)`.",
          "Restore the counts and return the better of the two options.",
        ],
        why: "Every subset of words corresponds to one root-to-leaf path of take/skip decisions, and a subset is valid exactly when no letter count ever goes negative along its path. So the recursion examines every valid subset and nothing else, and returns the largest score among them.",
        time: "O(2^n · L), L = total word length",
        space: "O(n + 26)",
        pitfalls: [
          "Restore the counts even when the word did not fit, since they were already decremented.",
          "A word may repeat a letter (\"aa\"), so it needs as many tiles as occurrences.",
          "Choosing words greedily by value fails — two medium words can beat one expensive word that blocks them.",
        ],
      }),
      examples: [
        { input: `["code","kairo","ode"]\n["c","o","d","e","k","a","i","r","o"]\n${fmtIntArr(SCORE1)}`, expectedOutput: "16" },
        { input: `["xyz"]\n["x","y"]\n${fmtIntArr(ONES)}`, expectedOutput: "0" },
        { input: `["aa","a"]\n["a","a","a"]\n${fmtIntArr(SCORE3)}`, expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const alpha = "abcdefghijklmnopqrstuvwxyz".slice(0, pick(rng, [2, 4, 6, 26]));
        const n = pick(rng, [1, ri(rng, 1, 4), ri(rng, 1, 8)]);
        const words = Array.from({ length: n }, () => randLower(rng, 1, pick(rng, [3, 6]), alpha));
        const letters = Array.from({ length: ri(rng, 1, 20) }, () => alpha[ri(rng, 0, alpha.length - 1)]);
        const score = Array.from({ length: 26 }, () => ri(rng, 0, 10));
        return {
          input: `${fmtStrArr(words)}\n${fmtStrArr(letters)}\n${fmtIntArr(score)}`,
          expectedOutput: String(ref(words, letters, score)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def maxScoreWords(words: List[str], letters: List[str], score: List[int]) -> int:
              have = [0] * 26
              for ch in letters:
                  have[ord(ch) - 97] += 1
              codes = [[ord(ch) - 97 for ch in w] for w in words]
              worth = [sum(score[c] for c in cs) for cs in codes]
              n = len(words)

              def dfs(i):
                  if i == n:
                      return 0
                  best = dfs(i + 1)
                  cs = codes[i]
                  for c in cs:
                      have[c] -= 1
                  if all(have[c] >= 0 for c in cs):
                      best = max(best, worth[i] + dfs(i + 1))
                  for c in cs:
                      have[c] += 1
                  return best

              return dfs(0)
        `,
        javascript: code`
          var maxScoreWords = function(words, letters, score) {
              var have = new Array(26).fill(0);
              for (var i = 0; i < letters.length; i++) have[letters[i].charCodeAt(0) - 97]++;
              var codes = words.map(function(w) {
                  var cs = [];
                  for (var k = 0; k < w.length; k++) cs.push(w.charCodeAt(k) - 97);
                  return cs;
              });
              var worth = codes.map(function(cs) {
                  var s = 0;
                  for (var k = 0; k < cs.length; k++) s += score[cs[k]];
                  return s;
              });
              function dfs(i) {
                  if (i === words.length) return 0;
                  var best = dfs(i + 1);
                  var cs = codes[i], ok = true, k;
                  for (k = 0; k < cs.length; k++) have[cs[k]]--;
                  for (k = 0; k < cs.length; k++) if (have[cs[k]] < 0) ok = false;
                  if (ok) best = Math.max(best, worth[i] + dfs(i + 1));
                  for (k = 0; k < cs.length; k++) have[cs[k]]++;
                  return best;
              }
              return dfs(0);
          };
        `,
        typescript: code`
          function maxScoreWords(words: string[], letters: string[], score: number[]): number {
              var have: number[] = [];
              for (var c = 0; c < 26; c++) have.push(0);
              for (var i = 0; i < letters.length; i++) have[letters[i].charCodeAt(0) - 97]++;
              var codes: number[][] = [];
              var worth: number[] = [];
              for (var w = 0; w < words.length; w++) {
                  var cs: number[] = [];
                  var s = 0;
                  for (var k = 0; k < words[w].length; k++) {
                      var code = words[w].charCodeAt(k) - 97;
                      cs.push(code);
                      s += score[code];
                  }
                  codes.push(cs);
                  worth.push(s);
              }
              var dfs = function(idx: number): number {
                  if (idx === words.length) return 0;
                  var best = dfs(idx + 1);
                  var list = codes[idx], ok = true, t: number;
                  for (t = 0; t < list.length; t++) have[list[t]]--;
                  for (t = 0; t < list.length; t++) if (have[list[t]] < 0) ok = false;
                  if (ok) best = Math.max(best, worth[idx] + dfs(idx + 1));
                  for (t = 0; t < list.length; t++) have[list[t]]++;
                  return best;
              };
              return dfs(0);
          }
        `,
        java: code`
          public static int maxScoreWords(String[] words, String[] letters, int[] score) {
              int[] have = new int[26];
              for (String l : letters) have[l.charAt(0) - 'a']++;
              int n = words.length;
              int[] worth = new int[n];
              for (int i = 0; i < n; i++) {
                  for (int k = 0; k < words[i].length(); k++) worth[i] += score[words[i].charAt(k) - 'a'];
              }
              return mswDfs(words, worth, have, 0);
          }

          static int mswDfs(String[] words, int[] worth, int[] have, int i) {
              if (i == words.length) return 0;
              int best = mswDfs(words, worth, have, i + 1);
              String w = words[i];
              boolean ok = true;
              for (int k = 0; k < w.length(); k++) have[w.charAt(k) - 'a']--;
              for (int k = 0; k < w.length(); k++) if (have[w.charAt(k) - 'a'] < 0) ok = false;
              if (ok) best = Math.max(best, worth[i] + mswDfs(words, worth, have, i + 1));
              for (int k = 0; k < w.length(); k++) have[w.charAt(k) - 'a']++;
              return best;
          }
        `,
        cpp: code`
          static int mswDfs(const vector<string>& words, const vector<int>& worth, vector<int>& have, int i) {
              if (i == (int)words.size()) return 0;
              int best = mswDfs(words, worth, have, i + 1);
              const string& w = words[i];
              bool ok = true;
              for (char ch : w) have[ch - 'a']--;
              for (char ch : w) if (have[ch - 'a'] < 0) ok = false;
              if (ok) best = max(best, worth[i] + mswDfs(words, worth, have, i + 1));
              for (char ch : w) have[ch - 'a']++;
              return best;
          }

          int maxScoreWords(vector<string>& words, vector<string>& letters, vector<int>& score) {
              vector<int> have(26, 0);
              for (const string& l : letters) have[l[0] - 'a']++;
              vector<int> worth(words.size(), 0);
              for (size_t i = 0; i < words.size(); i++) {
                  for (char ch : words[i]) worth[i] += score[ch - 'a'];
              }
              return mswDfs(words, worth, have, 0);
          }
        `,
        c: code`
          static int mswHave[26];
          static int mswWorth[16];

          static int mswDfs(char** words, int n, int i) {
              if (i == n) return 0;
              int best = mswDfs(words, n, i + 1);
              const char* w = words[i];
              int ok = 1;
              for (int k = 0; w[k]; k++) mswHave[w[k] - 'a']--;
              for (int k = 0; w[k]; k++) if (mswHave[w[k] - 'a'] < 0) ok = 0;
              if (ok) {
                  int v = mswWorth[i] + mswDfs(words, n, i + 1);
                  if (v > best) best = v;
              }
              for (int k = 0; w[k]; k++) mswHave[w[k] - 'a']++;
              return best;
          }

          int maxScoreWords(char** words, int wordsSize, char** letters, int lettersSize, int* score, int scoreSize) {
              for (int c = 0; c < 26; c++) mswHave[c] = 0;
              for (int i = 0; i < lettersSize; i++) mswHave[letters[i][0] - 'a']++;
              for (int i = 0; i < wordsSize; i++) {
                  int s = 0;
                  for (int k = 0; words[i][k]; k++) s += score[words[i][k] - 'a'];
                  mswWorth[i] = s;
              }
              return mswDfs(words, wordsSize, 0);
          }
        `,
        csharp: code`
          public static int MaxScoreWords(string[] words, string[] letters, int[] score)
          {
              int[] have = new int[26];
              foreach (string l in letters) have[l[0] - 'a']++;
              int[] worth = new int[words.Length];
              for (int i = 0; i < words.Length; i++)
              {
                  foreach (char ch in words[i]) worth[i] += score[ch - 'a'];
              }
              return MswDfs(words, worth, have, 0);
          }

          static int MswDfs(string[] words, int[] worth, int[] have, int i)
          {
              if (i == words.Length) return 0;
              int best = MswDfs(words, worth, have, i + 1);
              string w = words[i];
              bool ok = true;
              foreach (char ch in w) have[ch - 'a']--;
              foreach (char ch in w) if (have[ch - 'a'] < 0) ok = false;
              if (ok) best = Math.Max(best, worth[i] + MswDfs(words, worth, have, i + 1));
              foreach (char ch in w) have[ch - 'a']++;
              return best;
          }
        `,
        go: code`
          func maxScoreWords(words []string, letters []string, score []int) int {
          	have := make([]int, 26)
          	for _, l := range letters {
          		have[l[0]-'a']++
          	}
          	n := len(words)
          	worth := make([]int, n)
          	for i, w := range words {
          		for k := 0; k < len(w); k++ {
          			worth[i] += score[w[k]-'a']
          		}
          	}
          	var dfs func(i int) int
          	dfs = func(i int) int {
          		if i == n {
          			return 0
          		}
          		best := dfs(i + 1)
          		w := words[i]
          		ok := true
          		for k := 0; k < len(w); k++ {
          			have[w[k]-'a']--
          		}
          		for k := 0; k < len(w); k++ {
          			if have[w[k]-'a'] < 0 {
          				ok = false
          			}
          		}
          		if ok {
          			if v := worth[i] + dfs(i+1); v > best {
          				best = v
          			}
          		}
          		for k := 0; k < len(w); k++ {
          			have[w[k]-'a']++
          		}
          		return best
          	}
          	return dfs(0)
          }
        `,
        kotlin: code`
          fun maxScoreWords(words: Array<String>, letters: Array<String>, score: IntArray): Int {
              val have = IntArray(26)
              for (l in letters) have[l[0] - 'a']++
              val n = words.size
              val worth = IntArray(n)
              for (i in 0 until n) for (ch in words[i]) worth[i] += score[ch - 'a']
              fun dfs(i: Int): Int {
                  if (i == n) return 0
                  var best = dfs(i + 1)
                  val w = words[i]
                  var ok = true
                  for (ch in w) have[ch - 'a']--
                  for (ch in w) if (have[ch - 'a'] < 0) ok = false
                  if (ok) best = maxOf(best, worth[i] + dfs(i + 1))
                  for (ch in w) have[ch - 'a']++
                  return best
              }
              return dfs(0)
          }
        `,
        swift: code`
          func maxScoreWords(_ words: [String], _ letters: [String], _ score: [Int]) -> Int {
              var have = [Int](repeating: 0, count: 26)
              for l in letters { have[Int(l.utf8.first!) - 97] += 1 }
              let codes: [[Int]] = words.map { w in w.utf8.map { Int($0) - 97 } }
              let worth: [Int] = codes.map { cs in cs.reduce(0) { $0 + score[$1] } }
              let n = words.count
              func dfs(_ i: Int) -> Int {
                  if i == n { return 0 }
                  var best = dfs(i + 1)
                  let cs = codes[i]
                  var ok = true
                  for c in cs { have[c] -= 1 }
                  for c in cs where have[c] < 0 { ok = false }
                  if ok { best = max(best, worth[i] + dfs(i + 1)) }
                  for c in cs { have[c] += 1 }
                  return best
              }
              return dfs(0)
          }
        `,
        rust: code`
          fn msw_dfs(codes: &Vec<Vec<usize>>, worth: &Vec<i32>, have: &mut Vec<i32>, i: usize) -> i32 {
              if i == codes.len() {
                  return 0;
              }
              let mut best = msw_dfs(codes, worth, have, i + 1);
              let mut ok = true;
              for &c in codes[i].iter() {
                  have[c] -= 1;
              }
              for &c in codes[i].iter() {
                  if have[c] < 0 {
                      ok = false;
                  }
              }
              if ok {
                  let v = worth[i] + msw_dfs(codes, worth, have, i + 1);
                  if v > best {
                      best = v;
                  }
              }
              for &c in codes[i].iter() {
                  have[c] += 1;
              }
              best
          }

          fn maxScoreWords(words: Vec<String>, letters: Vec<String>, score: Vec<i32>) -> i32 {
              let mut have = vec![0i32; 26];
              for l in letters.iter() {
                  have[(l.as_bytes()[0] - b'a') as usize] += 1;
              }
              let codes: Vec<Vec<usize>> = words.iter().map(|w| w.bytes().map(|b| (b - b'a') as usize).collect()).collect();
              let worth: Vec<i32> = codes.iter().map(|cs| cs.iter().map(|&c| score[c]).sum()).collect();
              msw_dfs(&codes, &worth, &mut have, 0)
          }
        `,
        php: code`
          function mswDfs(&$codes, &$worth, &$have, $i) {
              if ($i == count($codes)) return 0;
              $best = mswDfs($codes, $worth, $have, $i + 1);
              $cs = $codes[$i];
              $ok = true;
              foreach ($cs as $c) $have[$c]--;
              foreach ($cs as $c) if ($have[$c] < 0) $ok = false;
              if ($ok) {
                  $v = $worth[$i] + mswDfs($codes, $worth, $have, $i + 1);
                  if ($v > $best) $best = $v;
              }
              foreach ($cs as $c) $have[$c]++;
              return $best;
          }

          function maxScoreWords($words, $letters, $score) {
              $have = array_fill(0, 26, 0);
              foreach ($letters as $l) $have[ord($l[0]) - 97]++;
              $codes = [];
              $worth = [];
              foreach ($words as $w) {
                  $cs = [];
                  $s = 0;
                  for ($k = 0; $k < strlen($w); $k++) {
                      $c = ord($w[$k]) - 97;
                      $cs[] = $c;
                      $s += $score[$c];
                  }
                  $codes[] = $cs;
                  $worth[] = $s;
              }
              return mswDfs($codes, $worth, $have, 0);
          }
        `,
        ruby: code`
          def msw_dfs(codes, worth, have, i)
            return 0 if i == codes.length
            best = msw_dfs(codes, worth, have, i + 1)
            cs = codes[i]
            cs.each { |c| have[c] -= 1 }
            if cs.all? { |c| have[c] >= 0 }
              v = worth[i] + msw_dfs(codes, worth, have, i + 1)
              best = v if v > best
            end
            cs.each { |c| have[c] += 1 }
            best
          end

          def maxScoreWords(words, letters, score)
            have = Array.new(26, 0)
            letters.each { |l| have[l.ord - 97] += 1 }
            codes = words.map { |w| w.bytes.map { |b| b - 97 } }
            worth = codes.map { |cs| cs.sum { |c| score[c] } }
            msw_dfs(codes, worth, have, 0)
          end
        `,
      },
    };
  })(),

  // ── Number of Excellent Pairs (LC 2354) ─────────────────────────
  (() => {
    const pc = (v: number) => { let c = 0; while (v) { c += v & 1; v >>>= 1; } return c; };
    const ref = (nums: number[], k: number) => {
      const d = Array.from(new Set(nums));
      let c = 0;
      for (const a of d) for (const b of d) if (pc(a | b) + pc(a & b) >= k) c++;
      return c;
    };
    return {
      slug: "number-of-excellent-pairs",
      title: "Number of Excellent Pairs",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Bit Manipulation", "Amazon", "Google"],
      signature: { funcName: "countExcellentPairs", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of positive integers and a positive integer `k`. A pair of numbers `(num1, num2)` is **excellent** when:\n\n- both `num1` and `num2` occur in `nums`, and\n- the number of set bits in `num1 OR num2` plus the number of set bits in `num1 AND num2` is at least `k`.\n\nPairs are ordered and compared by value: `(a, b)` and `(b, a)` are different pairs when `a != b`, while repeated occurrences of the same values give the same pair. `num1` and `num2` may be the same value, as long as it occurs at least once.\n\nReturn the number of **distinct** excellent pairs.\n\n*CodeKairo bound:* the original allows `10^5` elements, whose answer needs 64 bits; here `nums.length <= 4 * 10^4`, so the answer fits a 32-bit integer.",
        [
          { in: "nums = [5,1,6,5], k = 4", out: "4", note: "5 and 6 each have 2 set bits. The pairs (5,5), (5,6), (6,5) and (6,6) reach 4; any pair with 1 reaches at most 3." },
          { in: "nums = [7,8], k = 5", out: "1", note: "Only (7,7): 3 + 3 = 6." },
          { in: "nums = [3], k = 10", out: "0" },
        ],
        ["1 <= nums.length <= 4 * 10^4", "1 <= nums[i] <= 10^9", "1 <= k <= 60"]),
      hints: [
        "Count the bits of `a OR b` and of `a AND b` bit by bit: what is their sum in terms of `a` and `b` alone?",
        "A bit set in both counts twice, a bit set in one counts once — so the sum is `popcount(a) + popcount(b)`.",
        "Deduplicate `nums`, bucket the distinct values by popcount (at most 30 buckets), and add `cnt[i] * cnt[j]` for every `i + j >= k`.",
      ],
      editorial: explain({
        idea: "`popcount(a OR b) + popcount(a AND b) = popcount(a) + popcount(b)`, so a pair is excellent based only on the two popcounts, and the counting collapses to at most 30 × 30 bucket pairs.",
        steps: [
          "Remove duplicate values from `nums`.",
          "Count the distinct values by popcount: `cnt[p]` for `p` from 0 to 30.",
          "Sum `cnt[i] * cnt[j]` over all `i, j` with `i + j >= k` and return it.",
        ],
        why: "Look at one bit. If it is set in both numbers it contributes 1 to the OR and 1 to the AND; if set in exactly one it contributes 1 to the OR only; otherwise nothing. That is exactly its contribution to `popcount(a) + popcount(b)`. Ordered pairs of distinct values `(a, b)` with popcounts `(i, j)` number `cnt[i] * cnt[j]`, including `a = b` when `i = j`.",
        time: "O(n + 30²)",
        space: "O(n)",
        pitfalls: [
          "Deduplicate first — pairs are counted by value, not by index.",
          "Pairs are ordered, so `(a, b)` and `(b, a)` are both counted, and `(a, a)` counts once.",
          "In languages with 32-bit ints, accumulate the sum in a 64-bit variable even though the tightened answer fits.",
        ],
      }),
      examples: [
        { input: "[5,1,6,5]\n4", expectedOutput: "4" },
        { input: "[7,8]\n5", expectedOutput: "1" },
        { input: "[3]\n10", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 8), ri(rng, 1, 40)]);
        const hi = pick(rng, [15, 255, 1000000000]);
        const nums = Array.from({ length: n }, () => Math.max(1, randVal(rng, hi)));
        const k = pick(rng, [ri(rng, 1, 8), ri(rng, 1, 30), ri(rng, 1, 60)]);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countExcellentPairs(nums: List[int], k: int) -> int:
              cnt = [0] * 32
              for v in set(nums):
                  cnt[bin(v).count("1")] += 1
              total = 0
              for i in range(32):
                  for j in range(32):
                      if i + j >= k:
                          total += cnt[i] * cnt[j]
              return total
        `,
        javascript: code`
          var countExcellentPairs = function(nums, k) {
              var cnt = new Array(32).fill(0);
              var seen = new Set(nums);
              seen.forEach(function(v) {
                  var c = 0;
                  while (v) { c += v & 1; v >>>= 1; }
                  cnt[c]++;
              });
              var total = 0;
              for (var i = 0; i < 32; i++) {
                  for (var j = 0; j < 32; j++) {
                      if (i + j >= k) total += cnt[i] * cnt[j];
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function countExcellentPairs(nums: number[], k: number): number {
              var cnt: number[] = [];
              for (var z = 0; z < 32; z++) cnt.push(0);
              var seen: { [key: string]: boolean } = {};
              for (var t = 0; t < nums.length; t++) {
                  var key = "" + nums[t];
                  if (seen[key]) continue;
                  seen[key] = true;
                  var v = nums[t], c = 0;
                  while (v) { c += v & 1; v >>>= 1; }
                  cnt[c]++;
              }
              var total = 0;
              for (var i = 0; i < 32; i++) {
                  for (var j = 0; j < 32; j++) {
                      if (i + j >= k) total += cnt[i] * cnt[j];
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int countExcellentPairs(int[] nums, int k) {
              long[] cnt = new long[32];
              Set<Integer> seen = new HashSet<>();
              for (int v : nums) if (seen.add(v)) cnt[Integer.bitCount(v)]++;
              long total = 0;
              for (int i = 0; i < 32; i++) {
                  for (int j = 0; j < 32; j++) {
                      if (i + j >= k) total += cnt[i] * cnt[j];
                  }
              }
              return (int) total;
          }
        `,
        cpp: code`
          int countExcellentPairs(vector<int>& nums, int k) {
              vector<long long> cnt(32, 0);
              unordered_set<int> seen(nums.begin(), nums.end());
              for (int v : seen) cnt[__builtin_popcount(v)]++;
              long long total = 0;
              for (int i = 0; i < 32; i++) {
                  for (int j = 0; j < 32; j++) {
                      if (i + j >= k) total += cnt[i] * cnt[j];
                  }
              }
              return (int) total;
          }
        `,
        c: code`
          static int cepCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int countExcellentPairs(int* nums, int numsSize, int k) {
              int* srt = (int*) malloc((numsSize + 1) * sizeof(int));
              for (int i = 0; i < numsSize; i++) srt[i] = nums[i];
              qsort(srt, numsSize, sizeof(int), cepCmp);
              long long cnt[32];
              for (int i = 0; i < 32; i++) cnt[i] = 0;
              for (int i = 0; i < numsSize; i++) {
                  if (i > 0 && srt[i] == srt[i - 1]) continue;
                  int v = srt[i], c = 0;
                  while (v) { c += v & 1; v >>= 1; }
                  cnt[c]++;
              }
              long long total = 0;
              for (int i = 0; i < 32; i++) {
                  for (int j = 0; j < 32; j++) {
                      if (i + j >= k) total += cnt[i] * cnt[j];
                  }
              }
              free(srt);
              return (int) total;
          }
        `,
        csharp: code`
          public static int CountExcellentPairs(int[] nums, int k)
          {
              long[] cnt = new long[32];
              foreach (int d in new HashSet<int>(nums))
              {
                  int v = d, c = 0;
                  while (v != 0) { c += v & 1; v >>= 1; }
                  cnt[c]++;
              }
              long total = 0;
              for (int i = 0; i < 32; i++)
              {
                  for (int j = 0; j < 32; j++)
                  {
                      if (i + j >= k) total += cnt[i] * cnt[j];
                  }
              }
              return (int) total;
          }
        `,
        go: code`
          func countExcellentPairs(nums []int, k int) int {
          	cnt := make([]int, 32)
          	seen := map[int]bool{}
          	for _, v := range nums {
          		if seen[v] {
          			continue
          		}
          		seen[v] = true
          		c := 0
          		for x := v; x > 0; x >>= 1 {
          			c += x & 1
          		}
          		cnt[c]++
          	}
          	total := 0
          	for i := 0; i < 32; i++ {
          		for j := 0; j < 32; j++ {
          			if i+j >= k {
          				total += cnt[i] * cnt[j]
          			}
          		}
          	}
          	return total
          }
        `,
        kotlin: code`
          fun countExcellentPairs(nums: IntArray, k: Int): Int {
              val cnt = LongArray(32)
              for (v in nums.toHashSet()) cnt[Integer.bitCount(v)]++
              var total = 0L
              for (i in 0 until 32) {
                  for (j in 0 until 32) {
                      if (i + j >= k) total += cnt[i] * cnt[j]
                  }
              }
              return total.toInt()
          }
        `,
        swift: code`
          func countExcellentPairs(_ nums: [Int], _ k: Int) -> Int {
              var cnt = [Int](repeating: 0, count: 64)
              for v in Set(nums) { cnt[v.nonzeroBitCount] += 1 }
              var total = 0
              for i in 0..<32 {
                  for j in 0..<32 where i + j >= k {
                      total += cnt[i] * cnt[j]
                  }
              }
              return total
          }
        `,
        rust: code`
          fn countExcellentPairs(nums: Vec<i32>, k: i32) -> i32 {
              let mut d = nums.clone();
              d.sort();
              d.dedup();
              let mut cnt = vec![0i64; 33];
              for &v in d.iter() {
                  cnt[v.count_ones() as usize] += 1;
              }
              let mut total: i64 = 0;
              for i in 0..32 {
                  for j in 0..32 {
                      if (i + j) as i32 >= k {
                          total += cnt[i] * cnt[j];
                      }
                  }
              }
              total as i32
          }
        `,
        php: code`
          function countExcellentPairs($nums, $k) {
              $cnt = array_fill(0, 32, 0);
              foreach (array_unique($nums) as $v) {
                  $c = 0;
                  while ($v > 0) { $c += $v & 1; $v >>= 1; }
                  $cnt[$c]++;
              }
              $total = 0;
              for ($i = 0; $i < 32; $i++) {
                  for ($j = 0; $j < 32; $j++) {
                      if ($i + $j >= $k) $total += $cnt[$i] * $cnt[$j];
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def countExcellentPairs(nums, k)
            cnt = Array.new(32, 0)
            nums.uniq.each { |v| cnt[v.to_s(2).count("1")] += 1 }
            total = 0
            32.times do |i|
              32.times do |j|
                total += cnt[i] * cnt[j] if i + j >= k
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Strong Pair XOR II (LC 2935) ────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (const a of nums) for (const b of nums) if (Math.abs(a - b) <= Math.min(a, b)) best = Math.max(best, a ^ b);
      return best;
    };
    return {
      slug: "maximum-strong-pair-xor-ii",
      title: "Maximum Strong Pair XOR II",
      difficulty: "HARD" as const,
      tags: ["Array", "Bit Manipulation", "Trie", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "maximumStrongPairXor", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A pair of integers `x` and `y` is **strong** when `|x - y| <= min(x, y)`.\n\nGiven an array `nums` of positive integers, choose two of its integers (you may pick the same element twice) that form a strong pair, so that their bitwise XOR is as large as possible.\n\nReturn that maximum XOR value.",
        [
          { in: "nums = [6,9,12]", out: "15", note: "(6, 9) is strong since 3 <= 6, and `6 XOR 9 = 15`. (6, 12) and (9, 12) are strong too but give 10 and 5." },
          { in: "nums = [3,50]", out: "0", note: "(3, 50) is not strong, so only (3, 3) and (50, 50) remain, both with XOR 0." },
          { in: "nums = [7,4,5]", out: "3" },
        ],
        ["1 <= nums.length <= 5 * 10^4", "1 <= nums[i] <= 2^20 - 1"]),
      hints: [
        "With `x <= y`, the strong condition simplifies to `y <= 2x`.",
        "Sort the numbers. For each `y` taken as the larger element, the valid partners `x` form a contiguous window ending at `y` whose left edge only moves right.",
        "Keep the window in a binary trie that supports deletion (a count per node) and query the maximum XOR with `y` greedily from the top bit.",
      ],
      editorial: explain({
        idea: "After sorting, the partners of each `y` are exactly the values in `[y/2, y]`, a sliding window. A binary trie with per-node counts can add and remove numbers and answer \"maximum XOR with y\" in O(20).",
        steps: [
          "Sort `nums` ascending and set a left pointer to 0.",
          "For each `y` in order: insert `y` into the trie (incrementing counts along its path).",
          "While `2 * nums[left] < y`, remove `nums[left]` from the trie (decrementing counts) and advance `left`.",
          "Walk the trie from bit 19 down, preferring the child with the opposite bit of `y` whenever its count is positive; the bits gained form the best XOR for this `y`.",
          "Return the largest XOR seen.",
        ],
        why: "For `x <= y`, `|x - y| <= min(x, y)` reads `y - x <= x`, i.e. `2x >= y`. Since the array is sorted and `y` only grows, the smallest allowed `x` only grows too, so the window moves monotonically and contains exactly the allowed partners when the query runs. The greedy walk maximises XOR because a higher bit outweighs all lower bits together; the count check ensures the walk follows only numbers still inside the window.",
        time: "O(n log n + n · 20)",
        space: "O(n · 20)",
        pitfalls: [
          "Deleting must decrement counts, not unlink nodes, because other numbers can share the path.",
          "The pair (y, y) is always strong, so the answer is at least 0 and the trie is never empty during a query.",
          "Compare `2 * x < y` (strict) to evict — `y = 2x` is still strong.",
        ],
      }),
      examples: [
        { input: "[6,9,12]", expectedOutput: "15" },
        { input: "[3,50]", expectedOutput: "0" },
        { input: "[7,4,5]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 6), ri(rng, 6, 30)]);
        const mode = ri(rng, 0, 2);
        const base = ri(rng, 1, 600000);
        const nums = Array.from({ length: n }, () => {
          if (mode === 0) return ri(rng, 1, 1048575);
          if (mode === 1) return ri(rng, base, Math.min(1048575, 2 * base + ri(rng, 0, base)));
          return ri(rng, 1, pick(rng, [15, 100]));
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumStrongPairXor(nums: List[int]) -> int:
              srt = sorted(nums)
              n = len(srt)
              ch = [0] * ((n * 20 + 2) * 2)
              cnt = [0] * (n * 20 + 2)
              nodes = 1

              def update(v, d):
                  nonlocal nodes
                  node = 0
                  for b in range(19, -1, -1):
                      bit = (v >> b) & 1
                      if not ch[node * 2 + bit]:
                          ch[node * 2 + bit] = nodes
                          nodes += 1
                      node = ch[node * 2 + bit]
                      cnt[node] += d

              best = 0
              left = 0
              for y in srt:
                  update(y, 1)
                  while srt[left] * 2 < y:
                      update(srt[left], -1)
                      left += 1
                  node = 0
                  cur = 0
                  for b in range(19, -1, -1):
                      want = ((y >> b) & 1) ^ 1
                      c = ch[node * 2 + want]
                      if c and cnt[c] > 0:
                          cur |= 1 << b
                          node = c
                      else:
                          node = ch[node * 2 + (want ^ 1)]
                  if cur > best:
                      best = cur
              return best
        `,
        javascript: code`
          var maximumStrongPairXor = function(nums) {
              var srt = nums.slice().sort(function(a, b) { return a - b; });
              var n = srt.length;
              var ch = new Int32Array((n * 20 + 2) * 2), cnt = new Int32Array(n * 20 + 2);
              var nodes = 1;
              function update(v, d) {
                  var node = 0;
                  for (var b = 19; b >= 0; b--) {
                      var bit = (v >> b) & 1;
                      if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                      node = ch[node * 2 + bit];
                      cnt[node] += d;
                  }
              }
              var best = 0, left = 0;
              for (var i = 0; i < n; i++) {
                  var y = srt[i];
                  update(y, 1);
                  while (srt[left] * 2 < y) { update(srt[left], -1); left++; }
                  var node = 0, cur = 0;
                  for (var b = 19; b >= 0; b--) {
                      var want = ((y >> b) & 1) ^ 1;
                      var c = ch[node * 2 + want];
                      if (c && cnt[c] > 0) { cur |= 1 << b; node = c; }
                      else node = ch[node * 2 + (want ^ 1)];
                  }
                  if (cur > best) best = cur;
              }
              return best;
          };
        `,
        typescript: code`
          function maximumStrongPairXor(nums: number[]): number {
              var srt = nums.slice().sort(function(a, b) { return a - b; });
              var n = srt.length;
              var ch: number[] = [];
              var cnt: number[] = [];
              for (var z = 0; z < n * 20 + 2; z++) { ch.push(0); ch.push(0); cnt.push(0); }
              var nodes = 1;
              var update = function(v: number, d: number): void {
                  var node = 0;
                  for (var b = 19; b >= 0; b--) {
                      var bit = (v >> b) & 1;
                      if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                      node = ch[node * 2 + bit];
                      cnt[node] += d;
                  }
              };
              var best = 0, left = 0;
              for (var i = 0; i < n; i++) {
                  var y = srt[i];
                  update(y, 1);
                  while (srt[left] * 2 < y) { update(srt[left], -1); left++; }
                  var cur = 0, at = 0;
                  for (var b2 = 19; b2 >= 0; b2--) {
                      var want = ((y >> b2) & 1) ^ 1;
                      var c = ch[at * 2 + want];
                      if (c && cnt[c] > 0) { cur |= 1 << b2; at = c; }
                      else at = ch[at * 2 + (want ^ 1)];
                  }
                  if (cur > best) best = cur;
              }
              return best;
          }
        `,
        java: code`
          public static int maximumStrongPairXor(int[] nums) {
              int[] srt = nums.clone();
              Arrays.sort(srt);
              int n = srt.length;
              int[] ch = new int[(n * 20 + 2) * 2];
              int[] cnt = new int[n * 20 + 2];
              int[] nodes = {1};
              int best = 0, left = 0;
              for (int i = 0; i < n; i++) {
                  int y = srt[i];
                  mspxUpdate(ch, cnt, nodes, y, 1);
                  while (srt[left] * 2 < y) { mspxUpdate(ch, cnt, nodes, srt[left], -1); left++; }
                  int node = 0, cur = 0;
                  for (int b = 19; b >= 0; b--) {
                      int want = ((y >> b) & 1) ^ 1;
                      int c = ch[node * 2 + want];
                      if (c != 0 && cnt[c] > 0) { cur |= 1 << b; node = c; }
                      else node = ch[node * 2 + (want ^ 1)];
                  }
                  best = Math.max(best, cur);
              }
              return best;
          }

          static void mspxUpdate(int[] ch, int[] cnt, int[] nodes, int v, int d) {
              int node = 0;
              for (int b = 19; b >= 0; b--) {
                  int bit = (v >> b) & 1;
                  if (ch[node * 2 + bit] == 0) ch[node * 2 + bit] = nodes[0]++;
                  node = ch[node * 2 + bit];
                  cnt[node] += d;
              }
          }
        `,
        cpp: code`
          int maximumStrongPairXor(vector<int>& nums) {
              vector<int> srt(nums);
              sort(srt.begin(), srt.end());
              int n = srt.size();
              vector<int> ch((n * 20 + 2) * 2, 0), cnt(n * 20 + 2, 0);
              int nodes = 1;
              auto update = [&](int v, int d) {
                  int node = 0;
                  for (int b = 19; b >= 0; b--) {
                      int bit = (v >> b) & 1;
                      if (!ch[node * 2 + bit]) ch[node * 2 + bit] = nodes++;
                      node = ch[node * 2 + bit];
                      cnt[node] += d;
                  }
              };
              int best = 0, left = 0;
              for (int i = 0; i < n; i++) {
                  int y = srt[i];
                  update(y, 1);
                  while (srt[left] * 2 < y) { update(srt[left], -1); left++; }
                  int node = 0, cur = 0;
                  for (int b = 19; b >= 0; b--) {
                      int want = ((y >> b) & 1) ^ 1;
                      int c = ch[node * 2 + want];
                      if (c && cnt[c] > 0) { cur |= 1 << b; node = c; }
                      else node = ch[node * 2 + (want ^ 1)];
                  }
                  best = max(best, cur);
              }
              return best;
          }
        `,
        c: code`
          static int mspxCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          static void mspxUpdate(int* ch, int* cnt, int* nodes, int v, int d) {
              int node = 0;
              for (int b = 19; b >= 0; b--) {
                  int bit = (v >> b) & 1;
                  if (!ch[node * 2 + bit]) ch[node * 2 + bit] = (*nodes)++;
                  node = ch[node * 2 + bit];
                  cnt[node] += d;
              }
          }

          int maximumStrongPairXor(int* nums, int numsSize) {
              int n = numsSize;
              int* srt = (int*) malloc((n + 1) * sizeof(int));
              for (int i = 0; i < n; i++) srt[i] = nums[i];
              qsort(srt, n, sizeof(int), mspxCmp);
              int* ch = (int*) calloc((size_t)(n * 20 + 2) * 2, sizeof(int));
              int* cnt = (int*) calloc((size_t)(n * 20 + 2), sizeof(int));
              int nodes = 1, best = 0, left = 0;
              for (int i = 0; i < n; i++) {
                  int y = srt[i];
                  mspxUpdate(ch, cnt, &nodes, y, 1);
                  while (srt[left] * 2 < y) { mspxUpdate(ch, cnt, &nodes, srt[left], -1); left++; }
                  int node = 0, cur = 0;
                  for (int b = 19; b >= 0; b--) {
                      int want = ((y >> b) & 1) ^ 1;
                      int c = ch[node * 2 + want];
                      if (c && cnt[c] > 0) { cur |= 1 << b; node = c; }
                      else node = ch[node * 2 + (want ^ 1)];
                  }
                  if (cur > best) best = cur;
              }
              free(srt);
              free(ch);
              free(cnt);
              return best;
          }
        `,
        csharp: code`
          public static int MaximumStrongPairXor(int[] nums)
          {
              int[] srt = (int[])nums.Clone();
              Array.Sort(srt);
              int n = srt.Length;
              int[] ch = new int[(n * 20 + 2) * 2];
              int[] cnt = new int[n * 20 + 2];
              int nodes = 1, best = 0, left = 0;
              for (int i = 0; i < n; i++)
              {
                  int y = srt[i];
                  MspxUpdate(ch, cnt, ref nodes, y, 1);
                  while (srt[left] * 2 < y) { MspxUpdate(ch, cnt, ref nodes, srt[left], -1); left++; }
                  int node = 0, cur = 0;
                  for (int b = 19; b >= 0; b--)
                  {
                      int want = ((y >> b) & 1) ^ 1;
                      int c = ch[node * 2 + want];
                      if (c != 0 && cnt[c] > 0) { cur |= 1 << b; node = c; }
                      else node = ch[node * 2 + (want ^ 1)];
                  }
                  best = Math.Max(best, cur);
              }
              return best;
          }

          static void MspxUpdate(int[] ch, int[] cnt, ref int nodes, int v, int d)
          {
              int node = 0;
              for (int b = 19; b >= 0; b--)
              {
                  int bit = (v >> b) & 1;
                  if (ch[node * 2 + bit] == 0) ch[node * 2 + bit] = nodes++;
                  node = ch[node * 2 + bit];
                  cnt[node] += d;
              }
          }
        `,
        go: code`
          func maximumStrongPairXor(nums []int) int {
          	srt := make([]int, len(nums))
          	copy(srt, nums)
          	sort.Ints(srt)
          	n := len(srt)
          	ch := make([]int, (n*20+2)*2)
          	cnt := make([]int, n*20+2)
          	nodes := 1
          	update := func(v int, d int) {
          		node := 0
          		for b := uint(20); b > 0; b-- {
          			bit := (v >> (b - 1)) & 1
          			if ch[node*2+bit] == 0 {
          				ch[node*2+bit] = nodes
          				nodes++
          			}
          			node = ch[node*2+bit]
          			cnt[node] += d
          		}
          	}
          	best, left := 0, 0
          	for _, y := range srt {
          		update(y, 1)
          		for srt[left]*2 < y {
          			update(srt[left], -1)
          			left++
          		}
          		node, cur := 0, 0
          		for b := uint(20); b > 0; b-- {
          			want := ((y >> (b - 1)) & 1) ^ 1
          			c := ch[node*2+want]
          			if c != 0 && cnt[c] > 0 {
          				cur |= 1 << (b - 1)
          				node = c
          			} else {
          				node = ch[node*2+(want^1)]
          			}
          		}
          		if cur > best {
          			best = cur
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun maximumStrongPairXor(nums: IntArray): Int {
              val srt = nums.copyOf()
              srt.sort()
              val n = srt.size
              val ch = IntArray((n * 20 + 2) * 2)
              val cnt = IntArray(n * 20 + 2)
              var nodes = 1
              fun update(v: Int, d: Int) {
                  var node = 0
                  for (b in 19 downTo 0) {
                      val bit = (v shr b) and 1
                      if (ch[node * 2 + bit] == 0) {
                          ch[node * 2 + bit] = nodes
                          nodes++
                      }
                      node = ch[node * 2 + bit]
                      cnt[node] += d
                  }
              }
              var best = 0
              var left = 0
              for (y in srt) {
                  update(y, 1)
                  while (srt[left] * 2 < y) {
                      update(srt[left], -1)
                      left++
                  }
                  var node = 0
                  var cur = 0
                  for (b in 19 downTo 0) {
                      val want = ((y shr b) and 1) xor 1
                      val c = ch[node * 2 + want]
                      if (c != 0 && cnt[c] > 0) {
                          cur = cur or (1 shl b)
                          node = c
                      } else {
                          node = ch[node * 2 + (want xor 1)]
                      }
                  }
                  if (cur > best) best = cur
              }
              return best
          }
        `,
        swift: code`
          func maximumStrongPairXor(_ nums: [Int]) -> Int {
              let srt = nums.sorted()
              let n = srt.count
              var ch = [Int](repeating: 0, count: (n * 20 + 2) * 2)
              var cnt = [Int](repeating: 0, count: n * 20 + 2)
              var nodes = 1
              func update(_ v: Int, _ d: Int) {
                  var node = 0
                  var b = 19
                  while b >= 0 {
                      let bit = (v >> b) & 1
                      if ch[node * 2 + bit] == 0 {
                          ch[node * 2 + bit] = nodes
                          nodes += 1
                      }
                      node = ch[node * 2 + bit]
                      cnt[node] += d
                      b -= 1
                  }
              }
              var best = 0
              var left = 0
              for y in srt {
                  update(y, 1)
                  while srt[left] * 2 < y {
                      update(srt[left], -1)
                      left += 1
                  }
                  var node = 0
                  var cur = 0
                  var b = 19
                  while b >= 0 {
                      let want = ((y >> b) & 1) ^ 1
                      let c = ch[node * 2 + want]
                      if c != 0 && cnt[c] > 0 {
                          cur |= 1 << b
                          node = c
                      } else {
                          node = ch[node * 2 + (want ^ 1)]
                      }
                      b -= 1
                  }
                  if cur > best { best = cur }
              }
              return best
          }
        `,
        rust: code`
          fn mspx_update(ch: &mut Vec<usize>, cnt: &mut Vec<i32>, nodes: &mut usize, v: i32, d: i32) {
              let mut node = 0usize;
              for b in (0..20).rev() {
                  let bit = ((v >> b) & 1) as usize;
                  if ch[node * 2 + bit] == 0 {
                      ch[node * 2 + bit] = *nodes;
                      *nodes += 1;
                  }
                  node = ch[node * 2 + bit];
                  cnt[node] += d;
              }
          }

          fn maximumStrongPairXor(nums: Vec<i32>) -> i32 {
              let mut srt = nums.clone();
              srt.sort();
              let n = srt.len();
              let mut ch = vec![0usize; (n * 20 + 2) * 2];
              let mut cnt = vec![0i32; n * 20 + 2];
              let mut nodes = 1usize;
              let mut best = 0;
              let mut left = 0usize;
              for i in 0..n {
                  let y = srt[i];
                  mspx_update(&mut ch, &mut cnt, &mut nodes, y, 1);
                  while srt[left] * 2 < y {
                      mspx_update(&mut ch, &mut cnt, &mut nodes, srt[left], -1);
                      left += 1;
                  }
                  let mut node = 0usize;
                  let mut cur = 0i32;
                  for b in (0..20).rev() {
                      let want = (((y >> b) & 1) ^ 1) as usize;
                      let c = ch[node * 2 + want];
                      if c != 0 && cnt[c] > 0 {
                          cur |= 1 << b;
                          node = c;
                      } else {
                          node = ch[node * 2 + (want ^ 1)];
                      }
                  }
                  if cur > best {
                      best = cur;
                  }
              }
              best
          }
        `,
        php: code`
          function mspxUpdate(&$ch, &$cnt, &$nodes, $v, $d) {
              $node = 0;
              for ($b = 19; $b >= 0; $b--) {
                  $bit = ($v >> $b) & 1;
                  if (!$ch[$node * 2 + $bit]) {
                      $ch[$node * 2 + $bit] = $nodes;
                      $nodes++;
                  }
                  $node = $ch[$node * 2 + $bit];
                  $cnt[$node] += $d;
              }
          }

          function maximumStrongPairXor($nums) {
              $srt = $nums;
              sort($srt);
              $n = count($srt);
              $ch = array_fill(0, ($n * 20 + 2) * 2, 0);
              $cnt = array_fill(0, $n * 20 + 2, 0);
              $nodes = 1;
              $best = 0;
              $left = 0;
              foreach ($srt as $y) {
                  mspxUpdate($ch, $cnt, $nodes, $y, 1);
                  while ($srt[$left] * 2 < $y) {
                      mspxUpdate($ch, $cnt, $nodes, $srt[$left], -1);
                      $left++;
                  }
                  $node = 0;
                  $cur = 0;
                  for ($b = 19; $b >= 0; $b--) {
                      $want = (($y >> $b) & 1) ^ 1;
                      $c = $ch[$node * 2 + $want];
                      if ($c && $cnt[$c] > 0) {
                          $cur |= 1 << $b;
                          $node = $c;
                      } else {
                          $node = $ch[$node * 2 + ($want ^ 1)];
                      }
                  }
                  if ($cur > $best) $best = $cur;
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumStrongPairXor(nums)
            srt = nums.sort
            n = srt.length
            ch = Array.new((n * 20 + 2) * 2, 0)
            cnt = Array.new(n * 20 + 2, 0)
            nodes = 1
            update = lambda do |v, d|
              node = 0
              19.downto(0) do |b|
                bit = (v >> b) & 1
                if ch[node * 2 + bit] == 0
                  ch[node * 2 + bit] = nodes
                  nodes += 1
                end
                node = ch[node * 2 + bit]
                cnt[node] += d
              end
            end
            best = 0
            left = 0
            srt.each do |y|
              update.call(y, 1)
              while srt[left] * 2 < y
                update.call(srt[left], -1)
                left += 1
              end
              node = 0
              cur = 0
              19.downto(0) do |b|
                want = ((y >> b) & 1) ^ 1
                c = ch[node * 2 + want]
                if c != 0 && cnt[c] > 0
                  cur |= 1 << b
                  node = c
                else
                  node = ch[node * 2 + (want ^ 1)]
                end
              end
              best = cur if cur > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Count Prefix and Suffix Pairs II (LC 3045) ──────────────────
  (() => {
    const ref = (words: string[]) => {
      let c = 0;
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
          if (words[j].startsWith(words[i]) && words[j].endsWith(words[i])) c++;
        }
      }
      return c;
    };
    return {
      slug: "count-prefix-and-suffix-pairs-ii",
      title: "Count Prefix and Suffix Pairs II",
      difficulty: "HARD" as const,
      tags: ["Array", "String", "Trie", "Rolling Hash", "Google", "Amazon"],
      signature: { funcName: "countPrefixSuffixPairs", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array of lowercase strings `words`. Say that `isPrefixAndSuffix(str1, str2)` is true when `str1` is **both** a prefix and a suffix of `str2` — for example `\"co\"` and `\"coco\"`, but not `\"co\"` and `\"code\"`.\n\nReturn the number of index pairs `(i, j)` with `i < j` for which `isPrefixAndSuffix(words[i], words[j])` is true.\n\n*CodeKairo bound:* the original allows `10^5` words, whose answer needs 64 bits; here `words.length <= 5 * 10^4`, so the answer fits a 32-bit integer.",
        [
          { in: "words = [\"co\",\"code\",\"coco\",\"c\"]", out: "1", note: "Only `(0, 2)`: \"co\" starts and ends \"coco\". \"code\" starts with \"co\" but does not end with it." },
          { in: "words = [\"a\",\"a\",\"a\"]", out: "3" },
          { in: "words = [\"abc\",\"c\",\"cbc\",\"cabc\"]", out: "2", note: "`(1, 2)` and `(1, 3)`." },
        ],
        ["1 <= words.length <= 5 * 10^4", "1 <= words[i].length <= 10^5", "The total length of all words is at most 5 * 10^5", "words[i] consists only of lowercase English letters"]),
      hints: [
        "`a` is a prefix and a suffix of `b` exactly when, for every `k < a.length`, `a[k] == b[k]` and `a[len(a)-1-k] == b[len(b)-1-k]`.",
        "So read each word as a sequence of character **pairs** `(w[k], w[len-1-k])`. The condition becomes \"the pair sequence of `a` is a prefix of the pair sequence of `b`\".",
        "Insert the words, in order, into a trie over these pairs. While walking word `j`, every earlier word that ended at a node on the path is a match — add those end counts.",
      ],
      editorial: explain({
        idea: "Pair each position with its mirror: word `w` becomes the sequence `(w[0], w[L-1]), (w[1], w[L-2]), …`. Being a prefix and a suffix at once is then just being a prefix of that pair sequence, which a trie counts directly.",
        steps: [
          "Keep a trie whose edges are labelled by a pair of letters (676 possible labels, stored in a hash map), and an `ends` counter per node.",
          "For each word `s` in index order, walk the trie along its pairs `(s[k], s[L-1-k])` for `k = 0..L-1`, creating missing nodes.",
          "At every node reached, add `ends[node]` to the answer — those are earlier words whose whole pair sequence matches this prefix.",
          "After the walk, increment `ends` of the final node.",
        ],
        why: "An earlier word `a` of length `m` ends at the node of depth `m` on `s`'s path exactly when its first `m` pairs equal `s`'s first `m` pairs, i.e. `a[k] = s[k]` (prefix) and `a[m-1-k] = s[L-1-k]` (suffix) for all `k < m`. Querying before inserting `s` counts only pairs with `i < j`, each once.",
        time: "O(total length)",
        space: "O(total length)",
        pitfalls: [
          "Checking prefix and suffix separately with two tries does not work — the two matches must come from the same earlier word.",
          "Equal words count: \"a\" is a prefix and a suffix of \"a\".",
          "Add `ends` at every node on the path, not only at the last one.",
        ],
      }),
      examples: [
        { input: '["co","code","coco","c"]', expectedOutput: "1" },
        { input: '["a","a","a"]', expectedOutput: "3" },
        { input: '["abc","c","cbc","cabc"]', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const n = pick(rng, [1, ri(rng, 1, 6), ri(rng, 1, 25)]);
        const pool: string[] = [];
        const words = Array.from({ length: n }, () => {
          if (pool.length && rng() < 0.5) {
            const w = pick(rng, pool);
            const r = ri(rng, 0, 3);
            if (r === 0) return w;
            if (r === 1) return w + randLower(rng, 0, 3, alpha) + w;
            if (r === 2) return w + w.slice(Math.max(0, w.length - ri(rng, 0, w.length)));
            return w.slice(0, ri(rng, 1, w.length));
          }
          const w = randLower(rng, 1, 4, alpha);
          pool.push(w);
          return w;
        });
        return { input: fmtStrArr(words), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countPrefixSuffixPairs(words: List[str]) -> int:
              child = {}
              ends = [0]
              total = 0
              for s in words:
                  length = len(s)
                  node = 0
                  for k in range(length):
                      key = node * 676 + (ord(s[k]) - 97) * 26 + (ord(s[length - 1 - k]) - 97)
                      nxt = child.get(key)
                      if nxt is None:
                          nxt = len(ends)
                          ends.append(0)
                          child[key] = nxt
                      node = nxt
                      total += ends[node]
                  ends[node] += 1
              return total
        `,
        javascript: code`
          var countPrefixSuffixPairs = function(words) {
              var child = new Map();
              var ends = [0];
              var total = 0;
              for (var w = 0; w < words.length; w++) {
                  var s = words[w], len = s.length, node = 0;
                  for (var k = 0; k < len; k++) {
                      var key = node * 676 + (s.charCodeAt(k) - 97) * 26 + (s.charCodeAt(len - 1 - k) - 97);
                      var nxt = child.get(key);
                      if (nxt === undefined) {
                          nxt = ends.length;
                          ends.push(0);
                          child.set(key, nxt);
                      }
                      node = nxt;
                      total += ends[node];
                  }
                  ends[node]++;
              }
              return total;
          };
        `,
        typescript: code`
          function countPrefixSuffixPairs(words: string[]): number {
              var child: { [key: string]: number } = {};
              var ends: number[] = [0];
              var total = 0;
              for (var w = 0; w < words.length; w++) {
                  var s = words[w], len = s.length, node = 0;
                  for (var k = 0; k < len; k++) {
                      var key = "" + (node * 676 + (s.charCodeAt(k) - 97) * 26 + (s.charCodeAt(len - 1 - k) - 97));
                      var nxt = child[key];
                      if (nxt === undefined) {
                          nxt = ends.length;
                          ends.push(0);
                          child[key] = nxt;
                      }
                      node = nxt;
                      total += ends[node];
                  }
                  ends[node]++;
              }
              return total;
          }
        `,
        java: code`
          public static int countPrefixSuffixPairs(String[] words) {
              int cap = 1;
              for (String s : words) cap += s.length();
              int[] ends = new int[cap];
              HashMap<Integer, Integer> child = new HashMap<>();
              int nodes = 1;
              long total = 0;
              for (String s : words) {
                  int len = s.length(), node = 0;
                  for (int k = 0; k < len; k++) {
                      int key = node * 676 + (s.charAt(k) - 'a') * 26 + (s.charAt(len - 1 - k) - 'a');
                      Integer nxt = child.get(key);
                      if (nxt == null) {
                          nxt = nodes++;
                          child.put(key, nxt);
                      }
                      node = nxt;
                      total += ends[node];
                  }
                  ends[node]++;
              }
              return (int) total;
          }
        `,
        cpp: code`
          int countPrefixSuffixPairs(vector<string>& words) {
              unordered_map<int, int> child;
              vector<int> ends(1, 0);
              long long total = 0;
              for (const string& s : words) {
                  int len = s.size(), node = 0;
                  for (int k = 0; k < len; k++) {
                      int key = node * 676 + (s[k] - 'a') * 26 + (s[len - 1 - k] - 'a');
                      auto it = child.find(key);
                      int nxt;
                      if (it == child.end()) {
                          nxt = ends.size();
                          ends.push_back(0);
                          child[key] = nxt;
                      } else {
                          nxt = it->second;
                      }
                      node = nxt;
                      total += ends[node];
                  }
                  ends[node]++;
              }
              return (int) total;
          }
        `,
        c: code`
          int countPrefixSuffixPairs(char** words, int wordsSize) {
              int* lens = (int*) malloc((wordsSize + 1) * sizeof(int));
              int totalLen = 0;
              for (int i = 0; i < wordsSize; i++) {
                  int L = 0;
                  while (words[i][L]) L++;
                  lens[i] = L;
                  totalLen += L;
              }
              int cap = 1;
              while (cap < 2 * (totalLen + 1)) cap <<= 1;
              int* hkey = (int*) malloc(cap * sizeof(int));
              int* hval = (int*) malloc(cap * sizeof(int));
              for (int i = 0; i < cap; i++) hkey[i] = -1;
              int* ends = (int*) calloc(totalLen + 1, sizeof(int));
              int nodes = 1;
              long long total = 0;
              for (int i = 0; i < wordsSize; i++) {
                  const char* s = words[i];
                  int len = lens[i], node = 0;
                  for (int k = 0; k < len; k++) {
                      int key = node * 676 + (s[k] - 'a') * 26 + (s[len - 1 - k] - 'a');
                      unsigned int h = ((unsigned int) key * 2654435761u) & (unsigned int)(cap - 1);
                      while (hkey[h] != -1 && hkey[h] != key) h = (h + 1) & (unsigned int)(cap - 1);
                      if (hkey[h] == -1) {
                          hkey[h] = key;
                          hval[h] = nodes++;
                      }
                      node = hval[h];
                      total += ends[node];
                  }
                  ends[node]++;
              }
              free(lens);
              free(hkey);
              free(hval);
              free(ends);
              return (int) total;
          }
        `,
        csharp: code`
          public static int CountPrefixSuffixPairs(string[] words)
          {
              var child = new Dictionary<int, int>();
              var ends = new List<int>();
              ends.Add(0);
              long total = 0;
              foreach (string s in words)
              {
                  int len = s.Length, node = 0;
                  for (int k = 0; k < len; k++)
                  {
                      int key = node * 676 + (s[k] - 'a') * 26 + (s[len - 1 - k] - 'a');
                      int nxt;
                      if (!child.TryGetValue(key, out nxt))
                      {
                          nxt = ends.Count;
                          ends.Add(0);
                          child[key] = nxt;
                      }
                      node = nxt;
                      total += ends[node];
                  }
                  ends[node]++;
              }
              return (int) total;
          }
        `,
        go: code`
          func countPrefixSuffixPairs(words []string) int {
          	child := map[int]int{}
          	ends := []int{0}
          	total := 0
          	for _, s := range words {
          		n := len(s)
          		node := 0
          		for k := 0; k < n; k++ {
          			key := node*676 + int(s[k]-'a')*26 + int(s[n-1-k]-'a')
          			nxt, ok := child[key]
          			if !ok {
          				nxt = len(ends)
          				ends = append(ends, 0)
          				child[key] = nxt
          			}
          			node = nxt
          			total += ends[node]
          		}
          		ends[node]++
          	}
          	return total
          }
        `,
        kotlin: code`
          fun countPrefixSuffixPairs(words: Array<String>): Int {
              var cap = 1
              for (s in words) cap += s.length
              val ends = IntArray(cap)
              val child = HashMap<Int, Int>()
              var nodes = 1
              var total = 0L
              for (s in words) {
                  val len = s.length
                  var node = 0
                  for (k in 0 until len) {
                      val key = node * 676 + (s[k] - 'a') * 26 + (s[len - 1 - k] - 'a')
                      var nxt = child[key] ?: -1
                      if (nxt == -1) {
                          nxt = nodes
                          nodes++
                          child[key] = nxt
                      }
                      node = nxt
                      total += ends[node]
                  }
                  ends[node]++
              }
              return total.toInt()
          }
        `,
        swift: code`
          func countPrefixSuffixPairs(_ words: [String]) -> Int {
              var child = [Int: Int]()
              var ends = [0]
              var total = 0
              for w in words {
                  let s = Array(w.utf8)
                  let len = s.count
                  var node = 0
                  for k in 0..<len {
                      let key = node * 676 + (Int(s[k]) - 97) * 26 + (Int(s[len - 1 - k]) - 97)
                      if let nxt = child[key] {
                          node = nxt
                      } else {
                          child[key] = ends.count
                          node = ends.count
                          ends.append(0)
                      }
                      total += ends[node]
                  }
                  ends[node] += 1
              }
              return total
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn countPrefixSuffixPairs(words: Vec<String>) -> i32 {
              let mut child: HashMap<usize, usize> = HashMap::new();
              let mut ends: Vec<i64> = vec![0];
              let mut total: i64 = 0;
              for w in words.iter() {
                  let s = w.as_bytes();
                  let len = s.len();
                  let mut node = 0usize;
                  for k in 0..len {
                      let key = node * 676 + ((s[k] - b'a') as usize) * 26 + ((s[len - 1 - k] - b'a') as usize);
                      let fresh = ends.len();
                      let nxt = *child.entry(key).or_insert(fresh);
                      if nxt == fresh {
                          ends.push(0);
                      }
                      node = nxt;
                      total += ends[node];
                  }
                  ends[node] += 1;
              }
              total as i32
          }
        `,
        php: code`
          function countPrefixSuffixPairs($words) {
              $child = [];
              $ends = [0];
              $total = 0;
              foreach ($words as $s) {
                  $len = strlen($s);
                  $node = 0;
                  for ($k = 0; $k < $len; $k++) {
                      $key = $node * 676 + (ord($s[$k]) - 97) * 26 + (ord($s[$len - 1 - $k]) - 97);
                      if (!isset($child[$key])) {
                          $child[$key] = count($ends);
                          $ends[] = 0;
                      }
                      $node = $child[$key];
                      $total += $ends[$node];
                  }
                  $ends[$node]++;
              }
              return $total;
          }
        `,
        ruby: code`
          def countPrefixSuffixPairs(words)
            child = {}
            ends = [0]
            total = 0
            words.each do |s|
              b = s.bytes
              len = b.length
              node = 0
              len.times do |k|
                key = node * 676 + (b[k] - 97) * 26 + (b[len - 1 - k] - 97)
                nxt = child[key]
                if nxt.nil?
                  nxt = ends.length
                  ends << 0
                  child[key] = nxt
                end
                node = nxt
                total += ends[node]
              end
              ends[node] += 1
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Smallest Subarrays With Maximum Bitwise OR (LC 2411) ────────
  (() => {
    const ref = (nums: number[]) => nums.map((_, i) => {
      let target = 0;
      for (let j = i; j < nums.length; j++) target |= nums[j];
      let cur = 0;
      for (let j = i; j < nums.length; j++) {
        cur |= nums[j];
        if (cur === target) return j - i + 1;
      }
      return 1;
    });
    return {
      slug: "smallest-subarrays-with-maximum-bitwise-or",
      title: "Smallest Subarrays With Maximum Bitwise OR",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Bit Manipulation", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "smallestSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an array `nums` of non-negative integers. For every index `i`, consider the non-empty subarrays that **start** at `i`; among them, some reach the largest possible bitwise OR.\n\nLet `answer[i]` be the length of the **shortest** subarray starting at `i` whose OR equals that maximum.\n\nReturn the array `answer`.",
        [
          { in: "nums = [4,1,0,2]", out: "[4,3,2,1]", note: "From index 0 the maximum OR is `4 OR 1 OR 0 OR 2 = 7`, which needs the 2 at index 3. From index 2 it is 2, reached at index 3." },
          { in: "nums = [0,0]", out: "[1,1]", note: "The maximum OR is 0 and a subarray cannot be empty." },
          { in: "nums = [5,2,8]", out: "[3,2,1]" },
        ],
        ["n == nums.length", "1 <= n <= 10^5", "0 <= nums[i] <= 10^9"]),
      hints: [
        "The maximum OR from `i` is the OR of the whole suffix `nums[i..n-1]` — OR never decreases as the subarray grows.",
        "Each bit of that maximum must be supplied by some element. Which occurrence of a bit is the cheapest to reach?",
        "Scan from the right, remembering for every bit the nearest index at or after `i` that has it. The subarray must reach the farthest of those nearest indices.",
      ],
      editorial: explain({
        idea: "Bit by bit, the subarray starting at `i` must stretch to the nearest element (at or after `i`) carrying that bit. The answer is the farthest of these nearest positions.",
        steps: [
          "Keep `last[b]`, the smallest index `>= i` whose element has bit `b`, or -1 if none; start with all -1.",
          "Walk `i` from `n - 1` down to 0. For every bit `b` set in `nums[i]`, set `last[b] = i`.",
          "Let `far` be the maximum of `i` and every `last[b]`; set `answer[i] = far - i + 1`.",
        ],
        why: "A subarray `[i, j]` has the maximum OR exactly when every bit present in the suffix appears somewhere in `nums[i..j]`, i.e. when `j >= last[b]` for every bit `b` with `last[b] != -1`. The smallest such `j` is the maximum of those positions (and at least `i`, since the subarray is non-empty).",
        time: "O(30 · n)",
        space: "O(30)",
        pitfalls: [
          "When the suffix ORs to 0 (all zeros) the answer is 1, not 0.",
          "Update `last` with the current element before computing `far`.",
          "Values reach 10^9, so track 30 bits.",
        ],
      }),
      examples: [
        { input: "[4,1,0,2]", expectedOutput: "[4,3,2,1]" },
        { input: "[0,0]", expectedOutput: "[1,1]" },
        { input: "[5,2,8]", expectedOutput: "[3,2,1]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 8), ri(rng, 1, 30)]);
        const hi = pick(rng, [1, 15, 255, 1000000000]);
        const zeroBias = rng() < 0.3;
        const nums = Array.from({ length: n }, () => (zeroBias && rng() < 0.6 ? 0 : randVal(rng, hi)));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def smallestSubarrays(nums: List[int]) -> List[int]:
              n = len(nums)
              last = [-1] * 30
              ans = [0] * n
              for i in range(n - 1, -1, -1):
                  far = i
                  v = nums[i]
                  for b in range(30):
                      if (v >> b) & 1:
                          last[b] = i
                      if last[b] > far:
                          far = last[b]
                  ans[i] = far - i + 1
              return ans
        `,
        javascript: code`
          var smallestSubarrays = function(nums) {
              var n = nums.length, last = new Array(30).fill(-1), ans = new Array(n);
              for (var i = n - 1; i >= 0; i--) {
                  var far = i;
                  for (var b = 0; b < 30; b++) {
                      if ((nums[i] >> b) & 1) last[b] = i;
                      if (last[b] > far) far = last[b];
                  }
                  ans[i] = far - i + 1;
              }
              return ans;
          };
        `,
        typescript: code`
          function smallestSubarrays(nums: number[]): number[] {
              var n = nums.length;
              var last: number[] = [];
              for (var z = 0; z < 30; z++) last.push(-1);
              var ans: number[] = [];
              for (var y = 0; y < n; y++) ans.push(0);
              for (var i = n - 1; i >= 0; i--) {
                  var far = i;
                  for (var b = 0; b < 30; b++) {
                      if ((nums[i] >> b) & 1) last[b] = i;
                      if (last[b] > far) far = last[b];
                  }
                  ans[i] = far - i + 1;
              }
              return ans;
          }
        `,
        java: code`
          public static int[] smallestSubarrays(int[] nums) {
              int n = nums.length;
              int[] last = new int[30];
              Arrays.fill(last, -1);
              int[] ans = new int[n];
              for (int i = n - 1; i >= 0; i--) {
                  int far = i;
                  for (int b = 0; b < 30; b++) {
                      if (((nums[i] >> b) & 1) == 1) last[b] = i;
                      far = Math.max(far, last[b]);
                  }
                  ans[i] = far - i + 1;
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> smallestSubarrays(vector<int>& nums) {
              int n = nums.size();
              vector<int> last(30, -1), ans(n);
              for (int i = n - 1; i >= 0; i--) {
                  int far = i;
                  for (int b = 0; b < 30; b++) {
                      if ((nums[i] >> b) & 1) last[b] = i;
                      far = max(far, last[b]);
                  }
                  ans[i] = far - i + 1;
              }
              return ans;
          }
        `,
        c: code`
          int* smallestSubarrays(int* nums, int numsSize, int* returnSize) {
              int last[30];
              for (int b = 0; b < 30; b++) last[b] = -1;
              int* ans = (int*) malloc((numsSize + 1) * sizeof(int));
              for (int i = numsSize - 1; i >= 0; i--) {
                  int far = i;
                  for (int b = 0; b < 30; b++) {
                      if ((nums[i] >> b) & 1) last[b] = i;
                      if (last[b] > far) far = last[b];
                  }
                  ans[i] = far - i + 1;
              }
              *returnSize = numsSize;
              return ans;
          }
        `,
        csharp: code`
          public static int[] SmallestSubarrays(int[] nums)
          {
              int n = nums.Length;
              int[] last = new int[30];
              for (int b = 0; b < 30; b++) last[b] = -1;
              int[] ans = new int[n];
              for (int i = n - 1; i >= 0; i--)
              {
                  int far = i;
                  for (int b = 0; b < 30; b++)
                  {
                      if (((nums[i] >> b) & 1) == 1) last[b] = i;
                      far = Math.Max(far, last[b]);
                  }
                  ans[i] = far - i + 1;
              }
              return ans;
          }
        `,
        go: code`
          func smallestSubarrays(nums []int) []int {
          	n := len(nums)
          	last := make([]int, 30)
          	for b := range last {
          		last[b] = -1
          	}
          	ans := make([]int, n)
          	for i := n - 1; i >= 0; i-- {
          		far := i
          		for b := uint(0); b < 30; b++ {
          			if (nums[i]>>b)&1 == 1 {
          				last[b] = i
          			}
          			if last[b] > far {
          				far = last[b]
          			}
          		}
          		ans[i] = far - i + 1
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun smallestSubarrays(nums: IntArray): IntArray {
              val n = nums.size
              val last = IntArray(30) { -1 }
              val ans = IntArray(n)
              for (i in n - 1 downTo 0) {
                  var far = i
                  for (b in 0 until 30) {
                      if (((nums[i] shr b) and 1) == 1) last[b] = i
                      if (last[b] > far) far = last[b]
                  }
                  ans[i] = far - i + 1
              }
              return ans
          }
        `,
        swift: code`
          func smallestSubarrays(_ nums: [Int]) -> [Int] {
              let n = nums.count
              var last = [Int](repeating: -1, count: 30)
              var ans = [Int](repeating: 0, count: n)
              var i = n - 1
              while i >= 0 {
                  var far = i
                  for b in 0..<30 {
                      if (nums[i] >> b) & 1 == 1 { last[b] = i }
                      if last[b] > far { far = last[b] }
                  }
                  ans[i] = far - i + 1
                  i -= 1
              }
              return ans
          }
        `,
        rust: code`
          fn smallestSubarrays(nums: Vec<i32>) -> Vec<i32> {
              let n = nums.len();
              let mut last = vec![-1i32; 30];
              let mut ans = vec![0i32; n];
              for i in (0..n).rev() {
                  let mut far = i as i32;
                  for b in 0..30 {
                      if (nums[i] >> b) & 1 == 1 {
                          last[b] = i as i32;
                      }
                      if last[b] > far {
                          far = last[b];
                      }
                  }
                  ans[i] = far - i as i32 + 1;
              }
              ans
          }
        `,
        php: code`
          function smallestSubarrays($nums) {
              $n = count($nums);
              $last = array_fill(0, 30, -1);
              $ans = array_fill(0, $n, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $far = $i;
                  for ($b = 0; $b < 30; $b++) {
                      if (($nums[$i] >> $b) & 1) $last[$b] = $i;
                      if ($last[$b] > $far) $far = $last[$b];
                  }
                  $ans[$i] = $far - $i + 1;
              }
              return $ans;
          }
        `,
        ruby: code`
          def smallestSubarrays(nums)
            n = nums.length
            last = Array.new(30, -1)
            ans = Array.new(n, 0)
            (n - 1).downto(0) do |i|
              far = i
              v = nums[i]
              30.times do |b|
                last[b] = i if (v >> b) & 1 == 1
                far = last[b] if last[b] > far
              end
              ans[i] = far - i + 1
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximum Xor Product (LC 2939) ───────────────────────────────
  (() => {
    /** Closed form: equal bits below n become 1 in both; differing bits all go to the smaller side. */
    const pair = (a: number, b: number, n: number): [number, number] => {
      const mask = n === 0 ? 0 : 2 ** n - 1;
      const ah = a - (a & mask), bh = b - (b & mask);
      let common = 0, diff = 0, top = -1;
      for (let i = n - 1; i >= 0; i--) {
        const x = (a >> i) & 1, y = (b >> i) & 1;
        if (x === y) common += 2 ** i;
        else { diff += 2 ** i; if (top < 0) top = i; }
      }
      if (ah > bh) return [ah + common, bh + common + diff];
      if (ah < bh) return [ah + common + diff, bh + common];
      if (top < 0) return [ah + common, bh + common];
      return [ah + common + 2 ** top, bh + common + diff - 2 ** top];
    };
    const ref = (a: number, b: number, n: number) => {
      const [p, q] = pair(a, b, n);
      const best = BigInt(p) * BigInt(q);
      if (n <= 8) {
        let brute = 0n;
        for (let x = 0; x < 1 << n; x++) {
          const v = BigInt((a ^ x) >>> 0) * BigInt((b ^ x) >>> 0);
          if (v > brute) brute = v;
        }
        if (brute !== best) throw new Error(`maximum-xor-product: closed form ${best} != brute ${brute} for ${a},${b},${n}`);
      }
      return Number(best % BigInt(MOD));
    };
    return {
      slug: "maximum-xor-product",
      title: "Maximum Xor Product",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Bit Manipulation", "Amazon", "Google"],
      signature: {
        funcName: "maximumXorProduct",
        params: [{ name: "a", type: "int" as const }, { name: "b", type: "int" as const }, { name: "n", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given three integers `a`, `b` and `n`, find the maximum value of `(a XOR x) * (b XOR x)` over all integers `x` with `0 <= x < 2^n`.\n\nThe product can be huge, so return the **maximum product** taken modulo `10^9 + 7` (maximise the true product first, then reduce it).\n\n*CodeKairo bound:* the original allows `a, b < 2^50` and `n <= 50`; here `a, b < 2^30` and `n <= 30` so every input fits a 32-bit integer.",
        [
          { in: "a = 3, b = 9, n = 2", out: "27", note: "`x = 0` gives 3 × 9 = 27; `x = 1` gives 2 × 8 = 16, `x = 2` gives 1 × 11 and `x = 3` gives 0 × 10." },
          { in: "a = 0, b = 0, n = 3", out: "49", note: "`x = 7` turns both into 7." },
          { in: "a = 1000000000, b = 1000000000, n = 0", out: "49", note: "Only `x = 0` is allowed; 10^18 modulo 10^9 + 7 is 49." },
        ],
        ["0 <= a, b < 2^30", "0 <= n <= 30"]),
      hints: [
        "`x` can only change the lowest `n` bits of `a` and `b`; everything above stays fixed.",
        "Within those bits, if `a` and `b` agree at a position, `x` can make both bits 1 — always worth it. If they disagree, exactly one of them gets the 1 whatever `x` is.",
        "For disagreeing bits the sum `a' + b'` is fixed, and a product with a fixed sum is largest when the two factors are as close as possible: from the top bit down, give each disagreeing bit to whichever number is currently smaller.",
      ],
      editorial: explain({
        idea: "Bits above `n` are fixed. Below `n`, matching bits can both become 1, and each mismatched bit lands in exactly one number — so the sum is fixed and the product is maximised by keeping the two numbers as balanced as possible.",
        steps: [
          "Walk `i` from `n - 1` down to 0 with `bit = 2^i`.",
          "If `a` and `b` have the same value at `bit`, set it in both.",
          "Otherwise, if `a > b` (comparing the current values), make sure the bit ends up in `b`; else make sure it ends up in `a` — toggling both when it is on the wrong side (that is what XOR with `x` does).",
          "Return `(a mod M) × (b mod M) mod M` with `M = 10^9 + 7`, multiplying in 64 bits.",
        ],
        why: "Setting a matching bit raises both factors, so it can only help. For mismatched bits the total `a' + b'` is the same for every choice of `x`, and for a fixed sum the product grows as the factors get closer. Processing from the highest bit, the factor that is currently smaller stays smaller whatever lower bits do (a lower bit is worth less than a higher one), so handing it each mismatched bit is optimal; when the high parts tie, either choice gives the same product by symmetry.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Maximise the real product, then take the modulus — comparing products after `mod` picks the wrong `x`.",
          "Reduce `a` and `b` modulo `M` before multiplying, and multiply in 64 bits: two values near 2^30 overflow 32-bit arithmetic.",
          "With `n = 0` the only choice is `x = 0`.",
        ],
      }),
      examples: [
        { input: "3\n9\n2", expectedOutput: "27" },
        { input: "0\n0\n3", expectedOutput: "49" },
        { input: "1000000000\n1000000000\n0", expectedOutput: "49" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [4, 10, 20, 30]);
        const a = ri(rng, 0, 2 ** top - 1);
        const b = rng() < 0.2 ? a : ri(rng, 0, 2 ** pick(rng, [4, 10, 20, 30]) - 1);
        const n = pick(rng, [ri(rng, 0, 8), ri(rng, 0, 8), ri(rng, 0, 30)]);
        return { input: `${a}\n${b}\n${n}`, expectedOutput: String(ref(a, b, n)) };
      },
      solutions: {
        python: code`
          def maximumXorProduct(a: int, b: int, n: int) -> int:
              for i in range(n - 1, -1, -1):
                  bit = 1 << i
                  if (a & bit) == (b & bit):
                      a |= bit
                      b |= bit
                  elif a > b:
                      if a & bit:
                          a ^= bit
                          b ^= bit
                  else:
                      if b & bit:
                          a ^= bit
                          b ^= bit
              return (a * b) % 1000000007
        `,
        javascript: code`
          var maximumXorProduct = function(a, b, n) {
              for (var i = n - 1; i >= 0; i--) {
                  var bit = 1 << i;
                  if ((a & bit) === (b & bit)) { a |= bit; b |= bit; }
                  else if (a > b) { if (a & bit) { a ^= bit; b ^= bit; } }
                  else { if (b & bit) { a ^= bit; b ^= bit; } }
              }
              var M = 1000000007;
              a %= M;
              b %= M;
              return ((a * (b >>> 16)) % M * 65536 + a * (b & 65535)) % M;
          };
        `,
        typescript: code`
          function maximumXorProduct(a: number, b: number, n: number): number {
              for (var i = n - 1; i >= 0; i--) {
                  var bit = 1 << i;
                  if ((a & bit) === (b & bit)) { a |= bit; b |= bit; }
                  else if (a > b) { if (a & bit) { a ^= bit; b ^= bit; } }
                  else { if (b & bit) { a ^= bit; b ^= bit; } }
              }
              var M = 1000000007;
              a %= M;
              b %= M;
              return ((a * (b >>> 16)) % M * 65536 + a * (b & 65535)) % M;
          }
        `,
        java: code`
          public static int maximumXorProduct(int a, int b, int n) {
              for (int i = n - 1; i >= 0; i--) {
                  int bit = 1 << i;
                  if ((a & bit) == (b & bit)) { a |= bit; b |= bit; }
                  else if (a > b) { if ((a & bit) != 0) { a ^= bit; b ^= bit; } }
                  else { if ((b & bit) != 0) { a ^= bit; b ^= bit; } }
              }
              long M = 1000000007L;
              return (int) ((a % M) * (b % M) % M);
          }
        `,
        cpp: code`
          int maximumXorProduct(int a, int b, int n) {
              for (int i = n - 1; i >= 0; i--) {
                  int bit = 1 << i;
                  if ((a & bit) == (b & bit)) { a |= bit; b |= bit; }
                  else if (a > b) { if (a & bit) { a ^= bit; b ^= bit; } }
                  else { if (b & bit) { a ^= bit; b ^= bit; } }
              }
              const long long M = 1000000007LL;
              return (int) ((a % M) * (b % M) % M);
          }
        `,
        c: code`
          int maximumXorProduct(int a, int b, int n) {
              for (int i = n - 1; i >= 0; i--) {
                  int bit = 1 << i;
                  if ((a & bit) == (b & bit)) { a |= bit; b |= bit; }
                  else if (a > b) { if (a & bit) { a ^= bit; b ^= bit; } }
                  else { if (b & bit) { a ^= bit; b ^= bit; } }
              }
              long long M = 1000000007LL;
              return (int) (((long long) a % M) * ((long long) b % M) % M);
          }
        `,
        csharp: code`
          public static int MaximumXorProduct(int a, int b, int n)
          {
              for (int i = n - 1; i >= 0; i--)
              {
                  int bit = 1 << i;
                  if ((a & bit) == (b & bit)) { a |= bit; b |= bit; }
                  else if (a > b) { if ((a & bit) != 0) { a ^= bit; b ^= bit; } }
                  else { if ((b & bit) != 0) { a ^= bit; b ^= bit; } }
              }
              long M = 1000000007L;
              return (int) (((long) a % M) * ((long) b % M) % M);
          }
        `,
        go: code`
          func maximumXorProduct(a int, b int, n int) int {
          	for i := n - 1; i >= 0; i-- {
          		bit := 1 << uint(i)
          		if a&bit == b&bit {
          			a |= bit
          			b |= bit
          		} else if a > b {
          			if a&bit != 0 {
          				a ^= bit
          				b ^= bit
          			}
          		} else {
          			if b&bit != 0 {
          				a ^= bit
          				b ^= bit
          			}
          		}
          	}
          	const M = 1000000007
          	return (a % M) * (b % M) % M
          }
        `,
        kotlin: code`
          fun maximumXorProduct(a: Int, b: Int, n: Int): Int {
              var x = a
              var y = b
              for (i in n - 1 downTo 0) {
                  val bit = 1 shl i
                  if ((x and bit) == (y and bit)) {
                      x = x or bit
                      y = y or bit
                  } else if (x > y) {
                      if ((x and bit) != 0) { x = x xor bit; y = y xor bit }
                  } else {
                      if ((y and bit) != 0) { x = x xor bit; y = y xor bit }
                  }
              }
              val m = 1000000007L
              return ((x.toLong() % m) * (y.toLong() % m) % m).toInt()
          }
        `,
        swift: code`
          func maximumXorProduct(_ a: Int, _ b: Int, _ n: Int) -> Int {
              var x = a
              var y = b
              var i = n - 1
              while i >= 0 {
                  let bit = 1 << i
                  if (x & bit) == (y & bit) {
                      x |= bit
                      y |= bit
                  } else if x > y {
                      if x & bit != 0 { x ^= bit; y ^= bit }
                  } else {
                      if y & bit != 0 { x ^= bit; y ^= bit }
                  }
                  i -= 1
              }
              let m = 1000000007
              return (x % m) * (y % m) % m
          }
        `,
        rust: code`
          fn maximumXorProduct(a: i32, b: i32, n: i32) -> i32 {
              let mut x = a as i64;
              let mut y = b as i64;
              let mut i = n - 1;
              while i >= 0 {
                  let bit: i64 = 1 << i;
                  if (x & bit) == (y & bit) {
                      x |= bit;
                      y |= bit;
                  } else if x > y {
                      if x & bit != 0 {
                          x ^= bit;
                          y ^= bit;
                      }
                  } else if y & bit != 0 {
                      x ^= bit;
                      y ^= bit;
                  }
                  i -= 1;
              }
              let m: i64 = 1000000007;
              ((x % m) * (y % m) % m) as i32
          }
        `,
        php: code`
          function maximumXorProduct($a, $b, $n) {
              for ($i = $n - 1; $i >= 0; $i--) {
                  $bit = 1 << $i;
                  if (($a & $bit) == ($b & $bit)) {
                      $a |= $bit;
                      $b |= $bit;
                  } elseif ($a > $b) {
                      if ($a & $bit) { $a ^= $bit; $b ^= $bit; }
                  } else {
                      if ($b & $bit) { $a ^= $bit; $b ^= $bit; }
                  }
              }
              $m = 1000000007;
              return (($a % $m) * ($b % $m)) % $m;
          }
        `,
        ruby: code`
          def maximumXorProduct(a, b, n)
            (n - 1).downto(0) do |i|
              bit = 1 << i
              if (a & bit) == (b & bit)
                a |= bit
                b |= bit
              elsif a > b
                if a & bit != 0
                  a ^= bit
                  b ^= bit
                end
              elsif b & bit != 0
                a ^= bit
                b ^= bit
              end
            end
            (a * b) % 1000000007
          end
        `,
      },
    };
  })(),

  // ── Apply Operations on Array to Maximize Sum of Squares (LC 2897) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      const cnt = new Array(31).fill(0);
      for (const v of nums) for (let b = 0; b < 31; b++) if (v >> b & 1) cnt[b]++;
      let total = 0n;
      for (let t = 0; t < k; t++) {
        let x = 0;
        for (let b = 0; b < 31; b++) if (cnt[b] > 0) { cnt[b]--; x += 2 ** b; }
        total += BigInt(x) * BigInt(x);
      }
      return Number(total % BigInt(MOD));
    };
    return {
      slug: "apply-operations-on-array-to-maximize-sum-of-squares",
      title: "Apply Operations on Array to Maximize Sum of Squares",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Greedy", "Bit Manipulation", "Amazon", "Google"],
      signature: { funcName: "maxSum", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of positive integers and a positive integer `k`. Any number of times, you may pick two distinct indices `i` and `j` and **simultaneously** replace `nums[i]` with `nums[i] AND nums[j]` and `nums[j]` with `nums[i] OR nums[j]`.\n\nAfterwards you choose `k` elements of the final array. Return the **maximum** possible sum of their squares, modulo `10^9 + 7`.",
        [
          { in: "nums = [1,2,4], k = 1", out: "49", note: "Merging everything into one element gives 7, and 7² = 49." },
          { in: "nums = [3,3], k = 2", out: "18" },
          { in: "nums = [5,2,8,1], k = 2", out: "226", note: "Bit 0 appears twice, the others once, so the best two values are 15 and 1: 225 + 1." },
        ],
        ["1 <= k <= nums.length <= 10^5", "1 <= nums[i] <= 10^9"]),
      hints: [
        "Look at one bit position across the whole array. Does the operation change how many elements have that bit set?",
        "It does not: AND and OR just move a bit from one element to the other. And by repeating the operation, every bit can be pushed onto any element that wants it.",
        "So only the per-bit counts matter. Squares reward concentration: build the largest possible number from one copy of every available bit, then the next largest from what remains, `k` times.",
      ],
      editorial: explain({
        idea: "The operation preserves, for every bit, how many elements carry it, and it can move bits freely. So the reachable arrays are exactly those with the same per-bit counts, and squares are maximised by stacking bits onto as few elements as possible.",
        steps: [
          "Count `cnt[b]`, the number of elements with bit `b` set, for `b` from 0 to 29.",
          "Repeat `k` times: build `x` by taking bit `b` for every `b` with `cnt[b] > 0` (and decrement that count); add `x²` to the answer modulo `10^9 + 7`.",
          "Return the sum.",
        ],
        why: "Applying the operation to `p` and `q` yields `p AND q` and `p OR q`: a bit set in both stays in both, a bit set in one moves to the OR side, so each bit's count is unchanged, and repeating it gathers all shared bits onto one element. For a fixed total, moving a bit of value `v` from a smaller number `s` to a larger `l` changes the sum of squares by `(l+v)² + (s-v)² - l² - s² = 2v(l - s + v) > 0`, so the greedy stacking — each new number takes one copy of every remaining bit — is optimal, and the largest `k` numbers are the first `k` built.",
        time: "O(30 · (n + k))",
        space: "O(30)",
        pitfalls: [
          "The built numbers stay below 2^30 but their squares reach 2^60 — reduce and multiply in 64 bits (or split the multiplication).",
          "Take the modulus only when adding squares; the choice of numbers is made on true values.",
          "Once the counts run out, the remaining chosen elements are 0 and add nothing.",
        ],
      }),
      examples: [
        { input: "[1,2,4]\n1", expectedOutput: "49" },
        { input: "[3,3]\n2", expectedOutput: "18" },
        { input: "[5,2,8,1]\n2", expectedOutput: "226" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 6), ri(rng, 1, 20)]);
        const hi = pick(rng, [7, 255, 1000000000]);
        const nums = Array.from({ length: n }, () => Math.max(1, randVal(rng, hi)));
        const k = pick(rng, [1, n, ri(rng, 1, n)]);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSum(nums: List[int], k: int) -> int:
              cnt = [0] * 30
              for v in nums:
                  for b in range(30):
                      cnt[b] += (v >> b) & 1
              total = 0
              for _ in range(k):
                  x = 0
                  for b in range(30):
                      if cnt[b] > 0:
                          cnt[b] -= 1
                          x |= 1 << b
                  total = (total + x * x) % 1000000007
              return total
        `,
        javascript: code`
          var maxSum = function(nums, k) {
              var M = 1000000007, cnt = new Array(30).fill(0);
              for (var i = 0; i < nums.length; i++) {
                  for (var b = 0; b < 30; b++) cnt[b] += (nums[i] >> b) & 1;
              }
              var total = 0;
              for (var t = 0; t < k; t++) {
                  var x = 0;
                  for (var c = 0; c < 30; c++) {
                      if (cnt[c] > 0) { cnt[c]--; x |= 1 << c; }
                  }
                  var r = x % M;
                  total = (total + ((r * (r >>> 16)) % M * 65536 + r * (r & 65535)) % M) % M;
              }
              return total;
          };
        `,
        typescript: code`
          function maxSum(nums: number[], k: number): number {
              var M = 1000000007;
              var cnt: number[] = [];
              for (var z = 0; z < 30; z++) cnt.push(0);
              for (var i = 0; i < nums.length; i++) {
                  for (var b = 0; b < 30; b++) cnt[b] += (nums[i] >> b) & 1;
              }
              var total = 0;
              for (var t = 0; t < k; t++) {
                  var x = 0;
                  for (var c = 0; c < 30; c++) {
                      if (cnt[c] > 0) { cnt[c]--; x |= 1 << c; }
                  }
                  var r = x % M;
                  total = (total + ((r * (r >>> 16)) % M * 65536 + r * (r & 65535)) % M) % M;
              }
              return total;
          }
        `,
        java: code`
          public static int maxSum(int[] nums, int k) {
              final long M = 1000000007L;
              int[] cnt = new int[30];
              for (int v : nums) {
                  for (int b = 0; b < 30; b++) cnt[b] += (v >> b) & 1;
              }
              long total = 0;
              for (int t = 0; t < k; t++) {
                  long x = 0;
                  for (int b = 0; b < 30; b++) {
                      if (cnt[b] > 0) { cnt[b]--; x |= 1L << b; }
                  }
                  total = (total + x * x % M) % M;
              }
              return (int) total;
          }
        `,
        cpp: code`
          int maxSum(vector<int>& nums, int k) {
              const long long M = 1000000007LL;
              int cnt[30] = {0};
              for (int v : nums) {
                  for (int b = 0; b < 30; b++) cnt[b] += (v >> b) & 1;
              }
              long long total = 0;
              for (int t = 0; t < k; t++) {
                  long long x = 0;
                  for (int b = 0; b < 30; b++) {
                      if (cnt[b] > 0) { cnt[b]--; x |= 1LL << b; }
                  }
                  total = (total + x * x % M) % M;
              }
              return (int) total;
          }
        `,
        c: code`
          int maxSum(int* nums, int numsSize, int k) {
              const long long M = 1000000007LL;
              int cnt[30];
              for (int b = 0; b < 30; b++) cnt[b] = 0;
              for (int i = 0; i < numsSize; i++) {
                  for (int b = 0; b < 30; b++) cnt[b] += (nums[i] >> b) & 1;
              }
              long long total = 0;
              for (int t = 0; t < k; t++) {
                  long long x = 0;
                  for (int b = 0; b < 30; b++) {
                      if (cnt[b] > 0) { cnt[b]--; x |= 1LL << b; }
                  }
                  total = (total + x * x % M) % M;
              }
              return (int) total;
          }
        `,
        csharp: code`
          public static int MaxSum(int[] nums, int k)
          {
              const long M = 1000000007L;
              int[] cnt = new int[30];
              foreach (int v in nums)
              {
                  for (int b = 0; b < 30; b++) cnt[b] += (v >> b) & 1;
              }
              long total = 0;
              for (int t = 0; t < k; t++)
              {
                  long x = 0;
                  for (int b = 0; b < 30; b++)
                  {
                      if (cnt[b] > 0) { cnt[b]--; x |= 1L << b; }
                  }
                  total = (total + x * x % M) % M;
              }
              return (int) total;
          }
        `,
        go: code`
          func maxSum(nums []int, k int) int {
          	const M = 1000000007
          	cnt := make([]int, 30)
          	for _, v := range nums {
          		for b := uint(0); b < 30; b++ {
          			cnt[b] += (v >> b) & 1
          		}
          	}
          	total := 0
          	for t := 0; t < k; t++ {
          		x := 0
          		for b := uint(0); b < 30; b++ {
          			if cnt[b] > 0 {
          				cnt[b]--
          				x |= 1 << b
          			}
          		}
          		total = (total + x*x%M) % M
          	}
          	return total
          }
        `,
        kotlin: code`
          fun maxSum(nums: IntArray, k: Int): Int {
              val m = 1000000007L
              val cnt = IntArray(30)
              for (v in nums) {
                  for (b in 0 until 30) cnt[b] += (v shr b) and 1
              }
              var total = 0L
              for (t in 0 until k) {
                  var x = 0L
                  for (b in 0 until 30) {
                      if (cnt[b] > 0) {
                          cnt[b]--
                          x = x or (1L shl b)
                      }
                  }
                  total = (total + x * x % m) % m
              }
              return total.toInt()
          }
        `,
        swift: code`
          func maxSum(_ nums: [Int], _ k: Int) -> Int {
              let m = 1000000007
              var cnt = [Int](repeating: 0, count: 30)
              for v in nums {
                  for b in 0..<30 { cnt[b] += (v >> b) & 1 }
              }
              var total = 0
              for _ in 0..<k {
                  var x = 0
                  for b in 0..<30 where cnt[b] > 0 {
                      cnt[b] -= 1
                      x |= 1 << b
                  }
                  total = (total + x * x % m) % m
              }
              return total
          }
        `,
        rust: code`
          fn maxSum(nums: Vec<i32>, k: i32) -> i32 {
              let m: i64 = 1000000007;
              let mut cnt = vec![0i32; 30];
              for &v in nums.iter() {
                  for b in 0..30 {
                      cnt[b] += (v >> b) & 1;
                  }
              }
              let mut total: i64 = 0;
              for _ in 0..k {
                  let mut x: i64 = 0;
                  for b in 0..30 {
                      if cnt[b] > 0 {
                          cnt[b] -= 1;
                          x |= 1i64 << b;
                      }
                  }
                  total = (total + x * x % m) % m;
              }
              total as i32
          }
        `,
        php: code`
          function maxSum($nums, $k) {
              $m = 1000000007;
              $cnt = array_fill(0, 30, 0);
              foreach ($nums as $v) {
                  for ($b = 0; $b < 30; $b++) $cnt[$b] += ($v >> $b) & 1;
              }
              $total = 0;
              for ($t = 0; $t < $k; $t++) {
                  $x = 0;
                  for ($b = 0; $b < 30; $b++) {
                      if ($cnt[$b] > 0) {
                          $cnt[$b]--;
                          $x |= 1 << $b;
                      }
                  }
                  $total = ($total + ($x * $x) % $m) % $m;
              }
              return $total;
          }
        `,
        ruby: code`
          def maxSum(nums, k)
            cnt = Array.new(30, 0)
            nums.each do |v|
              30.times { |b| cnt[b] += (v >> b) & 1 }
            end
            total = 0
            k.times do
              x = 0
              30.times do |b|
                if cnt[b] > 0
                  cnt[b] -= 1
                  x |= 1 << b
                end
              end
              total = (total + x * x) % 1000000007
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Rows Covered by Columns (LC 2397) ───────────────────
  (() => {
    const ref = (matrix: number[][], numSelect: number) => {
      const m = matrix.length, n = matrix[0].length;
      const chosen = new Array(n).fill(false);
      let best = 0;
      const rec = (col: number, left: number) => {
        if (left === 0) {
          let cov = 0;
          for (let i = 0; i < m; i++) if (matrix[i].every((v, j) => v === 0 || chosen[j])) cov++;
          best = Math.max(best, cov);
          return;
        }
        if (col === n) return;
        chosen[col] = true; rec(col + 1, left - 1);
        chosen[col] = false; rec(col + 1, left);
      };
      rec(0, numSelect);
      return best;
    };
    return {
      slug: "maximum-rows-covered-by-columns",
      title: "Maximum Rows Covered by Columns",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Bit Manipulation", "Matrix", "Enumeration", "Google", "Amazon"],
      signature: {
        funcName: "maximumRows",
        params: [{ name: "matrix", type: "int[][]" as const }, { name: "numSelect", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an `m x n` binary matrix `matrix` and an integer `numSelect`. Select exactly `numSelect` **distinct** columns.\n\nA row is **covered** when every column in which that row holds a 1 is among the selected columns. In particular, a row of all zeros is always covered.\n\nReturn the maximum number of rows that can be covered by a selection of `numSelect` columns.",
        [
          { in: "matrix = [[0,1,0],[1,1,0],[0,0,0],[0,0,1]], numSelect = 2", out: "3", note: "Selecting columns 0 and 1 covers rows 0, 1 and 2; row 3 needs column 2." },
          { in: "matrix = [[1,0],[0,1],[1,1]], numSelect = 1", out: "1" },
          { in: "matrix = [[1],[0]], numSelect = 1", out: "2" },
        ],
        ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 12", "matrix[i][j] is either 0 or 1", "1 <= numSelect <= n"]),
      hints: [
        "There are at most 2^12 = 4096 ways to choose columns — enumerate them.",
        "Turn each row into a bitmask of its 1-columns, and each selection into a bitmask too.",
        "A row with mask `r` is covered by selection `s` exactly when `r AND NOT s == 0`. Try every `s` with `numSelect` bits set.",
      ],
      editorial: explain({
        idea: "With at most 12 columns, every selection fits in a 12-bit mask; enumerate the masks with exactly `numSelect` bits and test each row with one AND.",
        steps: [
          "Encode each row as `rows[i]`, the mask of columns where it holds a 1.",
          "For every mask `s` from 0 to 2^n - 1 whose popcount equals `numSelect`:",
          "count the rows with `rows[i] AND NOT s == 0`, and keep the maximum count.",
        ],
        why: "A row is covered exactly when none of its 1-columns lies outside the selection, which is the condition `rows[i] AND NOT s == 0`. Every legal selection is one of the masks examined, so the maximum is exact.",
        time: "O(2^n · m)",
        space: "O(m)",
        pitfalls: [
          "Exactly `numSelect` columns must be chosen, not at most — though choosing more never uncovers a row, the masks must have the right popcount.",
          "All-zero rows count as covered by any selection.",
          "Precompute row masks; re-scanning the matrix for every selection multiplies the work by `n`.",
        ],
      }),
      examples: [
        { input: "[[0,1,0],[1,1,0],[0,0,0],[0,0,1]]\n2", expectedOutput: "3" },
        { input: "[[1,0],[0,1],[1,1]]\n1", expectedOutput: "1" },
        { input: "[[1],[0]]\n1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const m = pick(rng, [1, ri(rng, 1, 4), ri(rng, 1, 8)]);
        const n = pick(rng, [1, ri(rng, 1, 4), ri(rng, 1, 8)]);
        const density = pick(rng, [0.15, 0.3, 0.5, 0.8]);
        const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < density ? 1 : 0)));
        const numSelect = ri(rng, 1, n);
        return { input: `${fmtIntMat(matrix)}\n${numSelect}`, expectedOutput: String(ref(matrix, numSelect)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumRows(matrix: List[List[int]], numSelect: int) -> int:
              n = len(matrix[0])
              rows = []
              for row in matrix:
                  r = 0
                  for j in range(n):
                      if row[j]:
                          r |= 1 << j
                  rows.append(r)
              best = 0
              for s in range(1 << n):
                  if bin(s).count("1") != numSelect:
                      continue
                  cov = 0
                  for r in rows:
                      if r & ~s == 0:
                          cov += 1
                  if cov > best:
                      best = cov
              return best
        `,
        javascript: code`
          var maximumRows = function(matrix, numSelect) {
              var m = matrix.length, n = matrix[0].length, rows = [];
              for (var i = 0; i < m; i++) {
                  var r = 0;
                  for (var j = 0; j < n; j++) if (matrix[i][j]) r |= 1 << j;
                  rows.push(r);
              }
              var best = 0;
              for (var s = 0; s < (1 << n); s++) {
                  var c = 0, x = s;
                  while (x) { c += x & 1; x >>= 1; }
                  if (c !== numSelect) continue;
                  var cov = 0;
                  for (var t = 0; t < m; t++) if ((rows[t] & ~s) === 0) cov++;
                  if (cov > best) best = cov;
              }
              return best;
          };
        `,
        typescript: code`
          function maximumRows(matrix: number[][], numSelect: number): number {
              var m = matrix.length, n = matrix[0].length;
              var rows: number[] = [];
              for (var i = 0; i < m; i++) {
                  var r = 0;
                  for (var j = 0; j < n; j++) if (matrix[i][j]) r |= 1 << j;
                  rows.push(r);
              }
              var best = 0;
              for (var s = 0; s < (1 << n); s++) {
                  var c = 0, x = s;
                  while (x) { c += x & 1; x >>= 1; }
                  if (c !== numSelect) continue;
                  var cov = 0;
                  for (var t = 0; t < m; t++) if ((rows[t] & ~s) === 0) cov++;
                  if (cov > best) best = cov;
              }
              return best;
          }
        `,
        java: code`
          public static int maximumRows(int[][] matrix, int numSelect) {
              int m = matrix.length, n = matrix[0].length;
              int[] rows = new int[m];
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) if (matrix[i][j] == 1) rows[i] |= 1 << j;
              }
              int best = 0;
              for (int s = 0; s < (1 << n); s++) {
                  if (Integer.bitCount(s) != numSelect) continue;
                  int cov = 0;
                  for (int r : rows) if ((r & ~s) == 0) cov++;
                  best = Math.max(best, cov);
              }
              return best;
          }
        `,
        cpp: code`
          int maximumRows(vector<vector<int>>& matrix, int numSelect) {
              int m = matrix.size(), n = matrix[0].size();
              vector<int> rows(m, 0);
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) if (matrix[i][j]) rows[i] |= 1 << j;
              }
              int best = 0;
              for (int s = 0; s < (1 << n); s++) {
                  if (__builtin_popcount(s) != numSelect) continue;
                  int cov = 0;
                  for (int r : rows) if ((r & ~s) == 0) cov++;
                  best = max(best, cov);
              }
              return best;
          }
        `,
        c: code`
          int maximumRows(int** matrix, int matrixSize, int* matrixColSize, int numSelect) {
              int m = matrixSize, n = matrixColSize[0];
              int rows[12];
              for (int i = 0; i < m; i++) {
                  rows[i] = 0;
                  for (int j = 0; j < n; j++) if (matrix[i][j]) rows[i] |= 1 << j;
              }
              int best = 0;
              for (int s = 0; s < (1 << n); s++) {
                  int c = 0;
                  for (int x = s; x; x >>= 1) c += x & 1;
                  if (c != numSelect) continue;
                  int cov = 0;
                  for (int i = 0; i < m; i++) if ((rows[i] & ~s) == 0) cov++;
                  if (cov > best) best = cov;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaximumRows(int[][] matrix, int numSelect)
          {
              int m = matrix.Length, n = matrix[0].Length;
              int[] rows = new int[m];
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < n; j++) if (matrix[i][j] == 1) rows[i] |= 1 << j;
              }
              int best = 0;
              for (int s = 0; s < (1 << n); s++)
              {
                  int c = 0;
                  for (int x = s; x != 0; x >>= 1) c += x & 1;
                  if (c != numSelect) continue;
                  int cov = 0;
                  foreach (int r in rows) if ((r & ~s) == 0) cov++;
                  best = Math.Max(best, cov);
              }
              return best;
          }
        `,
        go: code`
          func maximumRows(matrix [][]int, numSelect int) int {
          	m, n := len(matrix), len(matrix[0])
          	rows := make([]int, m)
          	for i := 0; i < m; i++ {
          		for j := 0; j < n; j++ {
          			if matrix[i][j] == 1 {
          				rows[i] |= 1 << uint(j)
          			}
          		}
          	}
          	best := 0
          	for s := 0; s < 1<<uint(n); s++ {
          		c := 0
          		for x := s; x > 0; x >>= 1 {
          			c += x & 1
          		}
          		if c != numSelect {
          			continue
          		}
          		cov := 0
          		for _, r := range rows {
          			if r&^s == 0 {
          				cov++
          			}
          		}
          		if cov > best {
          			best = cov
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun maximumRows(matrix: Array<IntArray>, numSelect: Int): Int {
              val m = matrix.size
              val n = matrix[0].size
              val rows = IntArray(m)
              for (i in 0 until m) {
                  for (j in 0 until n) if (matrix[i][j] == 1) rows[i] = rows[i] or (1 shl j)
              }
              var best = 0
              for (s in 0 until (1 shl n)) {
                  if (Integer.bitCount(s) != numSelect) continue
                  var cov = 0
                  for (r in rows) if ((r and s.inv()) == 0) cov++
                  if (cov > best) best = cov
              }
              return best
          }
        `,
        swift: code`
          func maximumRows(_ matrix: [[Int]], _ numSelect: Int) -> Int {
              let m = matrix.count
              let n = matrix[0].count
              var rows = [Int](repeating: 0, count: m)
              for i in 0..<m {
                  for j in 0..<n where matrix[i][j] == 1 { rows[i] |= 1 << j }
              }
              var best = 0
              for s in 0..<(1 << n) where s.nonzeroBitCount == numSelect {
                  var cov = 0
                  for r in rows where r & ~s == 0 { cov += 1 }
                  if cov > best { best = cov }
              }
              return best
          }
        `,
        rust: code`
          fn maximumRows(matrix: Vec<Vec<i32>>, numSelect: i32) -> i32 {
              let m = matrix.len();
              let n = matrix[0].len();
              let mut rows = vec![0u32; m];
              for i in 0..m {
                  for j in 0..n {
                      if matrix[i][j] == 1 {
                          rows[i] |= 1 << j;
                      }
                  }
              }
              let mut best = 0;
              for s in 0u32..(1u32 << n) {
                  if s.count_ones() as i32 != numSelect {
                      continue;
                  }
                  let mut cov = 0;
                  for &r in rows.iter() {
                      if r & !s == 0 {
                          cov += 1;
                      }
                  }
                  if cov > best {
                      best = cov;
                  }
              }
              best
          }
        `,
        php: code`
          function maximumRows($matrix, $numSelect) {
              $m = count($matrix);
              $n = count($matrix[0]);
              $rows = array_fill(0, $m, 0);
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $n; $j++) if ($matrix[$i][$j] == 1) $rows[$i] |= 1 << $j;
              }
              $best = 0;
              for ($s = 0; $s < (1 << $n); $s++) {
                  if (substr_count(decbin($s), "1") != $numSelect) continue;
                  $cov = 0;
                  foreach ($rows as $r) if (($r & ~$s) == 0) $cov++;
                  if ($cov > $best) $best = $cov;
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumRows(matrix, numSelect)
            n = matrix[0].length
            rows = matrix.map do |row|
              r = 0
              n.times { |j| r |= 1 << j if row[j] == 1 }
              r
            end
            best = 0
            (1 << n).times do |s|
              next if s.to_s(2).count("1") != numSelect
              cov = rows.count { |r| (r & ~s) == 0 }
              best = cov if cov > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Number of Subarrays With AND Value of K (LC 3209) ───────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let c = 0;
      for (let i = 0; i < nums.length; i++) {
        let a = -1;
        for (let j = i; j < nums.length; j++) {
          a &= nums[j];
          if (a === k) c++;
        }
      }
      return c;
    };
    return {
      slug: "number-of-subarrays-with-and-value-of-k",
      title: "Number of Subarrays With AND Value of K",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Bit Manipulation", "Segment Tree", "Amazon", "Google"],
      signature: { funcName: "countSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return the number of non-empty contiguous subarrays whose bitwise AND of all elements equals `k`.\n\n*CodeKairo bound:* the original allows `10^5` elements, whose answer needs 64 bits; here `nums.length <= 5 * 10^4`, so the answer fits a 32-bit integer.",
        [
          { in: "nums = [7,3,3,1], k = 3", out: "5", note: "`[3]` twice, `[3,3]`, `[7,3]` and `[7,3,3]`." },
          { in: "nums = [4,4], k = 0", out: "0" },
          { in: "nums = [2,1,3], k = 0", out: "2", note: "`[2,1]` and `[2,1,3]`." },
        ],
        ["1 <= nums.length <= 5 * 10^4", "0 <= nums[i], k <= 10^9"]),
      hints: [
        "Fix the right end `j` and let the left end move left: the AND can only lose bits.",
        "Each time the AND changes it loses at least one of at most 30 bits, so the subarrays ending at `j` produce at most 31 distinct AND values.",
        "Keep, for each `j`, the list of distinct AND values of subarrays ending at `j` with how many subarrays give each; build the list for `j + 1` from the one for `j`.",
      ],
      editorial: explain({
        idea: "The ANDs of all subarrays ending at a fixed index take at most 31 distinct values, so carrying a compressed list of (value, count) pairs from one index to the next counts every subarray in O(30) per element.",
        steps: [
          "Keep a list of pairs `(value, count)`: the distinct ANDs of subarrays ending at the previous index, ordered by start position.",
          "For the new element `x`, replace every value `v` by `v AND x`, merging neighbours that become equal (they are adjacent because the ANDs only grow as the start moves right), then append `(x, 1)` for the subarray `[x]` itself, merging it too.",
          "Add the count of the pair whose value equals `k` (if any) to the answer.",
        ],
        why: "Every subarray ending at `j` is represented in the list exactly once through its count, because extending all subarrays ending at `j - 1` by `nums[j]` and adding the single-element subarray produces exactly the subarrays ending at `j`. A value can only drop bits as the start moves left, so there are at most 31 distinct values, keeping each step O(30).",
        time: "O(30 · n)",
        space: "O(30)",
        pitfalls: [
          "Counting distinct values is not enough — keep how many subarrays share each value.",
          "`k` may be 0; zeros in `nums` make every subarray through them AND to 0.",
          "The O(n²) double loop works but is too slow for 5 · 10^4 elements in the slower languages.",
        ],
      }),
      examples: [
        { input: "[7,3,3,1]\n3", expectedOutput: "5" },
        { input: "[4,4]\n0", expectedOutput: "0" },
        { input: "[2,1,3]\n0", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 8), ri(rng, 1, 30)]);
        const wide = rng() < 0.3;
        const base = wide ? ri(rng, 0, 1000000000) : ri(rng, 0, 63);
        const nums = Array.from({ length: n }, () => {
          if (wide) return rng() < 0.7 ? base | (ri(rng, 0, 1000000000) & ri(rng, 0, 1000000000)) & 1073741823 : ri(rng, 0, 1000000000);
          return rng() < 0.6 ? base | ri(rng, 0, 63) : ri(rng, 0, 63);
        }).map((v) => Math.min(v, 1000000000));
        let k: number;
        if (rng() < 0.75) {
          const i = ri(rng, 0, n - 1), j = ri(rng, i, n - 1);
          k = -1;
          for (let t = i; t <= j; t++) k &= nums[t];
        } else k = wide ? ri(rng, 0, 1000000000) : ri(rng, 0, 63);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countSubarrays(nums: List[int], k: int) -> int:
              vals = []
              cnts = []
              total = 0
              for x in nums:
                  nv = []
                  nc = []
                  for v, c in zip(vals, cnts):
                      w = v & x
                      if nv and nv[-1] == w:
                          nc[-1] += c
                      else:
                          nv.append(w)
                          nc.append(c)
                  if nv and nv[-1] == x:
                      nc[-1] += 1
                  else:
                      nv.append(x)
                      nc.append(1)
                  vals, cnts = nv, nc
                  for v, c in zip(vals, cnts):
                      if v == k:
                          total += c
              return total
        `,
        javascript: code`
          var countSubarrays = function(nums, k) {
              var vals = [], cnts = [], total = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], nv = [], nc = [];
                  for (var t = 0; t < vals.length; t++) {
                      var w = vals[t] & x;
                      if (nv.length && nv[nv.length - 1] === w) nc[nc.length - 1] += cnts[t];
                      else { nv.push(w); nc.push(cnts[t]); }
                  }
                  if (nv.length && nv[nv.length - 1] === x) nc[nc.length - 1] += 1;
                  else { nv.push(x); nc.push(1); }
                  vals = nv;
                  cnts = nc;
                  for (var u = 0; u < vals.length; u++) if (vals[u] === k) total += cnts[u];
              }
              return total;
          };
        `,
        typescript: code`
          function countSubarrays(nums: number[], k: number): number {
              var vals: number[] = [], cnts: number[] = [], total = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  var nv: number[] = [], nc: number[] = [];
                  for (var t = 0; t < vals.length; t++) {
                      var w = vals[t] & x;
                      if (nv.length && nv[nv.length - 1] === w) nc[nc.length - 1] += cnts[t];
                      else { nv.push(w); nc.push(cnts[t]); }
                  }
                  if (nv.length && nv[nv.length - 1] === x) nc[nc.length - 1] += 1;
                  else { nv.push(x); nc.push(1); }
                  vals = nv;
                  cnts = nc;
                  for (var u = 0; u < vals.length; u++) if (vals[u] === k) total += cnts[u];
              }
              return total;
          }
        `,
        java: code`
          public static int countSubarrays(int[] nums, int k) {
              int[] vals = new int[33], cnts = new int[33];
              int[] nv = new int[33], nc = new int[33];
              int len = 0;
              long total = 0;
              for (int x : nums) {
                  int nl = 0;
                  for (int t = 0; t < len; t++) {
                      int w = vals[t] & x;
                      if (nl > 0 && nv[nl - 1] == w) nc[nl - 1] += cnts[t];
                      else { nv[nl] = w; nc[nl] = cnts[t]; nl++; }
                  }
                  if (nl > 0 && nv[nl - 1] == x) nc[nl - 1] += 1;
                  else { nv[nl] = x; nc[nl] = 1; nl++; }
                  int[] tmp = vals; vals = nv; nv = tmp;
                  tmp = cnts; cnts = nc; nc = tmp;
                  len = nl;
                  for (int u = 0; u < len; u++) if (vals[u] == k) total += cnts[u];
              }
              return (int) total;
          }
        `,
        cpp: code`
          int countSubarrays(vector<int>& nums, int k) {
              vector<pair<int, int>> cur, nxt;
              long long total = 0;
              for (int x : nums) {
                  nxt.clear();
                  for (auto& p : cur) {
                      int w = p.first & x;
                      if (!nxt.empty() && nxt.back().first == w) nxt.back().second += p.second;
                      else nxt.push_back(make_pair(w, p.second));
                  }
                  if (!nxt.empty() && nxt.back().first == x) nxt.back().second += 1;
                  else nxt.push_back(make_pair(x, 1));
                  swap(cur, nxt);
                  for (auto& p : cur) if (p.first == k) total += p.second;
              }
              return (int) total;
          }
        `,
        c: code`
          int countSubarrays(int* nums, int numsSize, int k) {
              int vals[33], cnts[33], nv[33], nc[33];
              int len = 0;
              long long total = 0;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i], nl = 0;
                  for (int t = 0; t < len; t++) {
                      int w = vals[t] & x;
                      if (nl > 0 && nv[nl - 1] == w) nc[nl - 1] += cnts[t];
                      else { nv[nl] = w; nc[nl] = cnts[t]; nl++; }
                  }
                  if (nl > 0 && nv[nl - 1] == x) nc[nl - 1] += 1;
                  else { nv[nl] = x; nc[nl] = 1; nl++; }
                  for (int t = 0; t < nl; t++) { vals[t] = nv[t]; cnts[t] = nc[t]; }
                  len = nl;
                  for (int u = 0; u < len; u++) if (vals[u] == k) total += cnts[u];
              }
              return (int) total;
          }
        `,
        csharp: code`
          public static int CountSubarrays(int[] nums, int k)
          {
              var vals = new List<int>();
              var cnts = new List<int>();
              long total = 0;
              foreach (int x in nums)
              {
                  var nv = new List<int>();
                  var nc = new List<int>();
                  for (int t = 0; t < vals.Count; t++)
                  {
                      int w = vals[t] & x;
                      if (nv.Count > 0 && nv[nv.Count - 1] == w) nc[nc.Count - 1] += cnts[t];
                      else { nv.Add(w); nc.Add(cnts[t]); }
                  }
                  if (nv.Count > 0 && nv[nv.Count - 1] == x) nc[nc.Count - 1] += 1;
                  else { nv.Add(x); nc.Add(1); }
                  vals = nv;
                  cnts = nc;
                  for (int u = 0; u < vals.Count; u++) if (vals[u] == k) total += cnts[u];
              }
              return (int) total;
          }
        `,
        go: code`
          func countSubarrays(nums []int, k int) int {
          	vals, cnts := []int{}, []int{}
          	total := 0
          	for _, x := range nums {
          		nv, nc := []int{}, []int{}
          		for t := range vals {
          			w := vals[t] & x
          			if len(nv) > 0 && nv[len(nv)-1] == w {
          				nc[len(nc)-1] += cnts[t]
          			} else {
          				nv = append(nv, w)
          				nc = append(nc, cnts[t])
          			}
          		}
          		if len(nv) > 0 && nv[len(nv)-1] == x {
          			nc[len(nc)-1]++
          		} else {
          			nv = append(nv, x)
          			nc = append(nc, 1)
          		}
          		vals, cnts = nv, nc
          		for u := range vals {
          			if vals[u] == k {
          				total += cnts[u]
          			}
          		}
          	}
          	return total
          }
        `,
        kotlin: code`
          fun countSubarrays(nums: IntArray, k: Int): Int {
              var vals = ArrayList<Int>()
              var cnts = ArrayList<Int>()
              var total = 0L
              for (x in nums) {
                  val nv = ArrayList<Int>()
                  val nc = ArrayList<Int>()
                  for (t in vals.indices) {
                      val w = vals[t] and x
                      if (nv.isNotEmpty() && nv[nv.size - 1] == w) nc[nc.size - 1] = nc[nc.size - 1] + cnts[t]
                      else { nv.add(w); nc.add(cnts[t]) }
                  }
                  if (nv.isNotEmpty() && nv[nv.size - 1] == x) nc[nc.size - 1] = nc[nc.size - 1] + 1
                  else { nv.add(x); nc.add(1) }
                  vals = nv
                  cnts = nc
                  for (u in vals.indices) if (vals[u] == k) total += cnts[u]
              }
              return total.toInt()
          }
        `,
        swift: code`
          func countSubarrays(_ nums: [Int], _ k: Int) -> Int {
              var vals: [Int] = []
              var cnts: [Int] = []
              var total = 0
              for x in nums {
                  var nv: [Int] = []
                  var nc: [Int] = []
                  for t in 0..<vals.count {
                      let w = vals[t] & x
                      if !nv.isEmpty && nv[nv.count - 1] == w {
                          nc[nc.count - 1] += cnts[t]
                      } else {
                          nv.append(w)
                          nc.append(cnts[t])
                      }
                  }
                  if !nv.isEmpty && nv[nv.count - 1] == x {
                      nc[nc.count - 1] += 1
                  } else {
                      nv.append(x)
                      nc.append(1)
                  }
                  vals = nv
                  cnts = nc
                  for u in 0..<vals.count where vals[u] == k { total += cnts[u] }
              }
              return total
          }
        `,
        rust: code`
          fn countSubarrays(nums: Vec<i32>, k: i32) -> i32 {
              let mut cur: Vec<(i32, i64)> = Vec::new();
              let mut total: i64 = 0;
              for &x in nums.iter() {
                  let mut nxt: Vec<(i32, i64)> = Vec::new();
                  for &(v, c) in cur.iter() {
                      let w = v & x;
                      let merge = match nxt.last() {
                          Some(&(lv, _)) => lv == w,
                          None => false,
                      };
                      if merge {
                          let last = nxt.len() - 1;
                          nxt[last].1 += c;
                      } else {
                          nxt.push((w, c));
                      }
                  }
                  let merge = match nxt.last() {
                      Some(&(lv, _)) => lv == x,
                      None => false,
                  };
                  if merge {
                      let last = nxt.len() - 1;
                      nxt[last].1 += 1;
                  } else {
                      nxt.push((x, 1));
                  }
                  cur = nxt;
                  for &(v, c) in cur.iter() {
                      if v == k {
                          total += c;
                      }
                  }
              }
              total as i32
          }
        `,
        php: code`
          function countSubarrays($nums, $k) {
              $vals = [];
              $cnts = [];
              $total = 0;
              foreach ($nums as $x) {
                  $nv = [];
                  $nc = [];
                  $nl = 0;
                  for ($t = 0; $t < count($vals); $t++) {
                      $w = $vals[$t] & $x;
                      if ($nl > 0 && $nv[$nl - 1] == $w) {
                          $nc[$nl - 1] += $cnts[$t];
                      } else {
                          $nv[] = $w;
                          $nc[] = $cnts[$t];
                          $nl++;
                      }
                  }
                  if ($nl > 0 && $nv[$nl - 1] == $x) {
                      $nc[$nl - 1] += 1;
                  } else {
                      $nv[] = $x;
                      $nc[] = 1;
                      $nl++;
                  }
                  $vals = $nv;
                  $cnts = $nc;
                  for ($u = 0; $u < $nl; $u++) if ($vals[$u] == $k) $total += $cnts[$u];
              }
              return $total;
          }
        `,
        ruby: code`
          def countSubarrays(nums, k)
            vals = []
            cnts = []
            total = 0
            nums.each do |x|
              nv = []
              nc = []
              vals.each_with_index do |v, t|
                w = v & x
                if !nv.empty? && nv[-1] == w
                  nc[-1] += cnts[t]
                else
                  nv << w
                  nc << cnts[t]
                end
              end
              if !nv.empty? && nv[-1] == x
                nc[-1] += 1
              else
                nv << x
                nc << 1
              end
              vals = nv
              cnts = nc
              vals.each_with_index { |v, u| total += cnts[u] if v == k }
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Possible Number by Binary Concatenation (LC 3309) ───
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      for (const p of perms) best = Math.max(best, parseInt(p.map((i) => nums[i].toString(2)).join(""), 2));
      return best;
    };
    return {
      slug: "maximum-possible-number-by-binary-concatenation",
      title: "Maximum Possible Number by Binary Concatenation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Bit Manipulation", "Enumeration", "Amazon", "Google"],
      signature: { funcName: "maxGoodNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of exactly three positive integers. Arrange the three numbers in some order and write their binary representations one after another (each without leading zeros) to form a single binary string.\n\nReturn the **largest** number, in decimal, that such a concatenation can represent.",
        [
          { in: "nums = [5,1,4]", out: "108", note: "The order 1, 5, 4 gives \"1\" + \"101\" + \"100\" = \"1101100\" = 108." },
          { in: "nums = [127,127,127]", out: "2097151", note: "Twenty-one ones." },
          { in: "nums = [6,9,1]", out: "233", note: "\"1\" + \"110\" + \"1001\" = \"11101001\"." },
        ],
        ["nums.length == 3", "1 <= nums[i] <= 127"]),
      hints: [
        "There are only 3! = 6 orders. Try them all.",
        "Concatenating `x` before `y` in binary is `(x << bits(y)) | y`, where `bits(y)` is the length of `y` in binary.",
        "The result has at most 21 bits, so it fits easily in a 32-bit integer.",
      ],
      editorial: explain({
        idea: "With three numbers there are six orders; compute the concatenated value of each with shifts and keep the largest.",
        steps: [
          "For each number compute its binary length `bits(v)` by shifting until it reaches 0.",
          "For each of the 6 permutations `(p, q, r)`, form `((p << bits(q)) | q) << bits(r) | r`.",
          "Return the maximum.",
        ],
        why: "Writing `y`'s bits after `x`'s is the same as shifting `x` left by `y`'s length and OR-ing `y` in, so each permutation's value is computed exactly; the maximum over all six orders is the answer by definition.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Shift by the binary length of the following number, not by a fixed 7 bits — leading zeros are not written.",
          "Sorting by the numbers' values is wrong: 1 then 5 beats 5 then 1 here because \"1101\" > \"1011\".",
          "All three numbers must be used exactly once.",
        ],
      }),
      examples: [
        { input: "[5,1,4]", expectedOutput: "108" },
        { input: "[127,127,127]", expectedOutput: "2097151" },
        { input: "[6,9,1]", expectedOutput: "233" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: 3 }, () => ri(rng, 1, pick(rng, [3, 15, 127])));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from itertools import permutations

          def maxGoodNumber(nums: List[int]) -> int:
              best = 0
              for p in permutations(nums):
                  v = 0
                  for x in p:
                      v = (v << x.bit_length()) | x
                  best = max(best, v)
              return best
        `,
        javascript: code`
          var maxGoodNumber = function(nums) {
              var perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
              var best = 0;
              for (var p = 0; p < 6; p++) {
                  var v = 0;
                  for (var t = 0; t < 3; t++) {
                      var x = nums[perms[p][t]], len = 0;
                      for (var y = x; y > 0; y >>= 1) len++;
                      v = (v << len) | x;
                  }
                  if (v > best) best = v;
              }
              return best;
          };
        `,
        typescript: code`
          function maxGoodNumber(nums: number[]): number {
              var perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
              var best = 0;
              for (var p = 0; p < 6; p++) {
                  var v = 0;
                  for (var t = 0; t < 3; t++) {
                      var x = nums[perms[p][t]], len = 0;
                      for (var y = x; y > 0; y >>= 1) len++;
                      v = (v << len) | x;
                  }
                  if (v > best) best = v;
              }
              return best;
          }
        `,
        java: code`
          public static int maxGoodNumber(int[] nums) {
              int[][] perms = {{0, 1, 2}, {0, 2, 1}, {1, 0, 2}, {1, 2, 0}, {2, 0, 1}, {2, 1, 0}};
              int best = 0;
              for (int[] p : perms) {
                  int v = 0;
                  for (int i : p) {
                      int x = nums[i];
                      int len = 32 - Integer.numberOfLeadingZeros(x);
                      v = (v << len) | x;
                  }
                  best = Math.max(best, v);
              }
              return best;
          }
        `,
        cpp: code`
          int maxGoodNumber(vector<int>& nums) {
              vector<int> p(nums);
              sort(p.begin(), p.end());
              int best = 0;
              do {
                  int v = 0;
                  for (int x : p) {
                      int len = 0;
                      for (int y = x; y > 0; y >>= 1) len++;
                      v = (v << len) | x;
                  }
                  best = max(best, v);
              } while (next_permutation(p.begin(), p.end()));
              return best;
          }
        `,
        c: code`
          int maxGoodNumber(int* nums, int numsSize) {
              int perms[6][3] = {{0, 1, 2}, {0, 2, 1}, {1, 0, 2}, {1, 2, 0}, {2, 0, 1}, {2, 1, 0}};
              int best = 0;
              for (int p = 0; p < 6; p++) {
                  int v = 0;
                  for (int t = 0; t < 3; t++) {
                      int x = nums[perms[p][t]], len = 0;
                      for (int y = x; y > 0; y >>= 1) len++;
                      v = (v << len) | x;
                  }
                  if (v > best) best = v;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaxGoodNumber(int[] nums)
          {
              int[][] perms = new int[][] {
                  new int[] {0, 1, 2}, new int[] {0, 2, 1}, new int[] {1, 0, 2},
                  new int[] {1, 2, 0}, new int[] {2, 0, 1}, new int[] {2, 1, 0}
              };
              int best = 0;
              foreach (int[] p in perms)
              {
                  int v = 0;
                  foreach (int i in p)
                  {
                      int x = nums[i], len = 0;
                      for (int y = x; y > 0; y >>= 1) len++;
                      v = (v << len) | x;
                  }
                  best = Math.Max(best, v);
              }
              return best;
          }
        `,
        go: code`
          func maxGoodNumber(nums []int) int {
          	perms := [][]int{{0, 1, 2}, {0, 2, 1}, {1, 0, 2}, {1, 2, 0}, {2, 0, 1}, {2, 1, 0}}
          	best := 0
          	for _, p := range perms {
          		v := 0
          		for _, i := range p {
          			x := nums[i]
          			length := uint(0)
          			for y := x; y > 0; y >>= 1 {
          				length++
          			}
          			v = (v << length) | x
          		}
          		if v > best {
          			best = v
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun maxGoodNumber(nums: IntArray): Int {
              val perms = arrayOf(intArrayOf(0, 1, 2), intArrayOf(0, 2, 1), intArrayOf(1, 0, 2), intArrayOf(1, 2, 0), intArrayOf(2, 0, 1), intArrayOf(2, 1, 0))
              var best = 0
              for (p in perms) {
                  var v = 0
                  for (i in p) {
                      val x = nums[i]
                      val len = 32 - Integer.numberOfLeadingZeros(x)
                      v = (v shl len) or x
                  }
                  if (v > best) best = v
              }
              return best
          }
        `,
        swift: code`
          func maxGoodNumber(_ nums: [Int]) -> Int {
              let perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
              var best = 0
              for p in perms {
                  var v = 0
                  for i in p {
                      let x = nums[i]
                      var len = 0
                      var y = x
                      while y > 0 {
                          len += 1
                          y >>= 1
                      }
                      v = (v << len) | x
                  }
                  if v > best { best = v }
              }
              return best
          }
        `,
        rust: code`
          fn maxGoodNumber(nums: Vec<i32>) -> i32 {
              let perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
              let mut best = 0;
              for p in perms.iter() {
                  let mut v: i32 = 0;
                  for &i in p.iter() {
                      let x = nums[i];
                      let len = 32 - x.leading_zeros();
                      v = (v << len) | x;
                  }
                  if v > best {
                      best = v;
                  }
              }
              best
          }
        `,
        php: code`
          function maxGoodNumber($nums) {
              $perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
              $best = 0;
              foreach ($perms as $p) {
                  $v = 0;
                  foreach ($p as $i) {
                      $x = $nums[$i];
                      $v = ($v << strlen(decbin($x))) | $x;
                  }
                  if ($v > $best) $best = $v;
              }
              return $best;
          }
        `,
        ruby: code`
          def maxGoodNumber(nums)
            nums.permutation.map { |p| p.map { |x| x.to_s(2) }.join.to_i(2) }.max
          end
        `,
      },
    };
  })(),

  // ── Substring XOR Queries (LC 2564) ─────────────────────────────
  (() => {
    const ref = (s: string, queries: number[][]) => {
      const n = s.length;
      const subs: Array<[number, number, number]> = [];
      for (let len = 1; len <= n; len++) {
        for (let l = 0; l + len <= n; l++) {
          if (len > 31 && s[l] === "1") continue;
          subs.push([parseInt(s.slice(l, l + len), 2), l, l + len - 1]);
        }
      }
      return queries.map(([a, b]) => {
        const t = (a ^ b) >>> 0;
        for (const [v, l, r] of subs) if (v === t) return [l, r];
        return [-1, -1];
      });
    };
    return {
      slug: "substring-xor-queries",
      title: "Substring XOR Queries",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Bit Manipulation", "Amazon", "Google"],
      signature: {
        funcName: "substringXorQueries",
        params: [{ name: "s", type: "string" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[][]" as const,
      },
      description: describe(
        "You are given a binary string `s` and an array `queries` with `queries[i] = [firsti, secondi]`.\n\nFor query `i`, find the **shortest** substring of `s` whose decimal value `val` (reading the substring as a binary number, leading zeros allowed) satisfies `val XOR firsti == secondi`. The answer is the pair `[lefti, righti]` of the substring's 0-indexed endpoints (inclusive). If several shortest substrings qualify, take the one with the **smallest** `lefti`; if none exists, the answer is `[-1, -1]`.\n\nReturn the array of answers.",
        [
          { in: "s = \"1101\", queries = [[2,1],[0,0],[7,1]]", out: "[[0,1],[2,2],[0,2]]", note: "The targets are `2 XOR 1 = 3` (\"11\"), 0 (\"0\") and `7 XOR 1 = 6` (\"110\")." },
          { in: "s = \"0101\", queries = [[12,2]]", out: "[[-1,-1]]", note: "The target 14 is \"1110\", which does not occur." },
          { in: "s = \"1\", queries = [[4,5]]", out: "[[0,0]]" },
        ],
        ["1 <= s.length <= 10^4", "s[i] is either '0' or '1'", "1 <= queries.length <= 10^5", "0 <= firsti, secondi <= 10^9"]),
      hints: [
        "XOR is its own inverse: the condition says `val == firsti XOR secondi`, a fixed target per query.",
        "Targets are below 2^30, and a shortest substring with a positive value cannot start with a 0 — so only substrings that start with '1' and have at most 30 characters matter (plus a single '0' for target 0).",
        "Precompute, for every such substring value, its first occurrence (scanning start positions left to right), then answer each query with one lookup.",
      ],
      editorial: explain({
        idea: "Each query just asks for the target `firsti XOR secondi`. Every useful substring is short — at most 30 characters, starting with '1' unless the target is 0 — so all of them can be tabulated in advance.",
        steps: [
          "Scan start positions `i` from left to right. If `s[i]` is '0', record value 0 at `[i, i]` if 0 has no entry yet, and move on.",
          "Otherwise extend `j` from `i` while `j < n` and `j - i < 30`, keeping the running value `v = 2v + s[j]`; record `[i, j]` for `v` if `v` has no entry yet.",
          "For each query, look up `firsti XOR secondi`; return its entry or `[-1, -1]`.",
        ],
        why: "For a positive target, any substring with leading zeros has a shorter suffix with the same value, so the shortest ones start with '1' and all have exactly the target's bit length. Among those, recording only the first time a value is seen while scanning starts left to right yields the smallest left end. The target 0 is best served by the leftmost single '0'. Targets never exceed 2^30 - 1, so 30 characters suffice.",
        time: "O(30 · n + q)",
        space: "O(30 · n)",
        pitfalls: [
          "Do not record substrings that start with '0' (except the single '0'): with leading zeros they are not the shortest.",
          "Stop extending after 30 characters — longer values exceed every possible target and overflow 32-bit integers.",
          "Ties go to the smallest left index, which the left-to-right scan with \"record only if absent\" gives for free.",
        ],
      }),
      examples: [
        { input: '"1101"\n[[2,1],[0,0],[7,1]]', expectedOutput: "[[0,1],[2,2],[0,2]]" },
        { input: '"0101"\n[[12,2]]', expectedOutput: "[[-1,-1]]" },
        { input: '"1"\n[[4,5]]', expectedOutput: "[[0,0]]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 4), ri(rng, 1, 12), ri(rng, 12, 30)]);
        const ones = pick(rng, [0.2, 0.5, 0.8]);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < ones ? "1" : "0";
        const q = pick(rng, [1, ri(rng, 1, 4), ri(rng, 1, 8)]);
        const queries = Array.from({ length: q }, () => {
          let target: number;
          if (rng() < 0.7) {
            const l = ri(rng, 0, n - 1), len = ri(rng, 1, Math.min(29, n - l));
            target = parseInt(s.slice(l, l + len), 2);
          } else target = ri(rng, 0, pick(rng, [7, 255, 100000]));
          if (rng() < 0.3) {
            const a = ri(rng, 0, 1000000000), b = ri(rng, 0, 1000000000);
            return [a, b];
          }
          const first = ri(rng, 0, pick(rng, [0, 15, 536870911]));
          return [first, (first ^ target) >>> 0];
        });
        return { input: `"${s}"\n${fmtIntMat(queries)}`, expectedOutput: fmtIntMat(ref(s, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def substringXorQueries(s: str, queries: List[List[int]]) -> List[List[int]]:
              n = len(s)
              seen = {}
              for i in range(n):
                  if s[i] == "0":
                      if 0 not in seen:
                          seen[0] = [i, i]
                      continue
                  v = 0
                  for j in range(i, min(n, i + 30)):
                      v = v * 2 + (1 if s[j] == "1" else 0)
                      if v not in seen:
                          seen[v] = [i, j]
              return [seen.get(a ^ b, [-1, -1]) for a, b in queries]
        `,
        javascript: code`
          var substringXorQueries = function(s, queries) {
              var n = s.length, seen = new Map();
              for (var i = 0; i < n; i++) {
                  if (s[i] === "0") {
                      if (!seen.has(0)) seen.set(0, [i, i]);
                      continue;
                  }
                  var v = 0;
                  for (var j = i; j < n && j < i + 30; j++) {
                      v = v * 2 + (s[j] === "1" ? 1 : 0);
                      if (!seen.has(v)) seen.set(v, [i, j]);
                  }
              }
              return queries.map(function(q) {
                  var hit = seen.get(q[0] ^ q[1]);
                  return hit ? hit.slice() : [-1, -1];
              });
          };
        `,
        typescript: code`
          function substringXorQueries(s: string, queries: number[][]): number[][] {
              var n = s.length;
              var seen: { [key: string]: number[] } = {};
              for (var i = 0; i < n; i++) {
                  if (s.charAt(i) === "0") {
                      if (seen["0"] === undefined) seen["0"] = [i, i];
                      continue;
                  }
                  var v = 0;
                  for (var j = i; j < n && j < i + 30; j++) {
                      v = v * 2 + (s.charAt(j) === "1" ? 1 : 0);
                      if (seen["" + v] === undefined) seen["" + v] = [i, j];
                  }
              }
              var ans: number[][] = [];
              for (var q = 0; q < queries.length; q++) {
                  var hit = seen["" + (queries[q][0] ^ queries[q][1])];
                  ans.push(hit === undefined ? [-1, -1] : [hit[0], hit[1]]);
              }
              return ans;
          }
        `,
        java: code`
          public static int[][] substringXorQueries(String s, int[][] queries) {
              int n = s.length();
              HashMap<Integer, int[]> seen = new HashMap<>();
              for (int i = 0; i < n; i++) {
                  if (s.charAt(i) == '0') {
                      if (!seen.containsKey(0)) seen.put(0, new int[] {i, i});
                      continue;
                  }
                  int v = 0;
                  for (int j = i; j < n && j < i + 30; j++) {
                      v = v * 2 + (s.charAt(j) - '0');
                      if (!seen.containsKey(v)) seen.put(v, new int[] {i, j});
                  }
              }
              int[][] ans = new int[queries.length][];
              for (int q = 0; q < queries.length; q++) {
                  int[] hit = seen.get(queries[q][0] ^ queries[q][1]);
                  ans[q] = hit == null ? new int[] {-1, -1} : new int[] {hit[0], hit[1]};
              }
              return ans;
          }
        `,
        cpp: code`
          vector<vector<int>> substringXorQueries(string s, vector<vector<int>>& queries) {
              int n = s.size();
              unordered_map<int, pair<int, int>> seen;
              for (int i = 0; i < n; i++) {
                  if (s[i] == '0') {
                      if (!seen.count(0)) seen[0] = make_pair(i, i);
                      continue;
                  }
                  int v = 0;
                  for (int j = i; j < n && j < i + 30; j++) {
                      v = v * 2 + (s[j] - '0');
                      if (!seen.count(v)) seen[v] = make_pair(i, j);
                  }
              }
              vector<vector<int>> ans;
              for (auto& q : queries) {
                  auto it = seen.find(q[0] ^ q[1]);
                  if (it == seen.end()) ans.push_back({-1, -1});
                  else ans.push_back({it->second.first, it->second.second});
              }
              return ans;
          }
        `,
        c: code`
          typedef struct { int v, l, r; } SxqEntry;

          static int sxqCmp(const void* a, const void* b) {
              const SxqEntry* x = (const SxqEntry*) a;
              const SxqEntry* y = (const SxqEntry*) b;
              if (x->v != y->v) return (x->v > y->v) - (x->v < y->v);
              return (x->l > y->l) - (x->l < y->l);
          }

          int** substringXorQueries(const char* s, int** queries, int queriesSize, int* queriesColSize, int* returnSize, int** returnColumnSizes) {
              int n = 0;
              while (s[n]) n++;
              SxqEntry* e = (SxqEntry*) malloc(sizeof(SxqEntry) * (n * 30 + 1));
              int ne = 0;
              for (int i = 0; i < n; i++) {
                  if (s[i] == '0') {
                      e[ne].v = 0; e[ne].l = i; e[ne].r = i; ne++;
                      continue;
                  }
                  int v = 0;
                  for (int j = i; j < n && j < i + 30; j++) {
                      v = v * 2 + (s[j] - '0');
                      e[ne].v = v; e[ne].l = i; e[ne].r = j; ne++;
                  }
              }
              qsort(e, ne, sizeof(SxqEntry), sxqCmp);
              int** ans = (int**) malloc(sizeof(int*) * (queriesSize + 1));
              *returnColumnSizes = (int*) malloc(sizeof(int) * (queriesSize + 1));
              for (int q = 0; q < queriesSize; q++) {
                  int target = queries[q][0] ^ queries[q][1];
                  int lo = 0, hi = ne;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (e[mid].v < target) lo = mid + 1; else hi = mid;
                  }
                  ans[q] = (int*) malloc(sizeof(int) * 2);
                  if (lo < ne && e[lo].v == target) { ans[q][0] = e[lo].l; ans[q][1] = e[lo].r; }
                  else { ans[q][0] = -1; ans[q][1] = -1; }
                  (*returnColumnSizes)[q] = 2;
              }
              free(e);
              *returnSize = queriesSize;
              return ans;
          }
        `,
        csharp: code`
          public static int[][] SubstringXorQueries(string s, int[][] queries)
          {
              int n = s.Length;
              var seen = new Dictionary<int, int[]>();
              for (int i = 0; i < n; i++)
              {
                  if (s[i] == '0')
                  {
                      if (!seen.ContainsKey(0)) seen[0] = new int[] { i, i };
                      continue;
                  }
                  int v = 0;
                  for (int j = i; j < n && j < i + 30; j++)
                  {
                      v = v * 2 + (s[j] - '0');
                      if (!seen.ContainsKey(v)) seen[v] = new int[] { i, j };
                  }
              }
              int[][] ans = new int[queries.Length][];
              for (int q = 0; q < queries.Length; q++)
              {
                  int[] hit;
                  if (seen.TryGetValue(queries[q][0] ^ queries[q][1], out hit)) ans[q] = new int[] { hit[0], hit[1] };
                  else ans[q] = new int[] { -1, -1 };
              }
              return ans;
          }
        `,
        go: code`
          func substringXorQueries(s string, queries [][]int) [][]int {
          	n := len(s)
          	seen := map[int][2]int{}
          	for i := 0; i < n; i++ {
          		if s[i] == '0' {
          			if _, ok := seen[0]; !ok {
          				seen[0] = [2]int{i, i}
          			}
          			continue
          		}
          		v := 0
          		for j := i; j < n && j < i+30; j++ {
          			v = v*2 + int(s[j]-'0')
          			if _, ok := seen[v]; !ok {
          				seen[v] = [2]int{i, j}
          			}
          		}
          	}
          	ans := make([][]int, len(queries))
          	for q, pr := range queries {
          		if hit, ok := seen[pr[0]^pr[1]]; ok {
          			ans[q] = []int{hit[0], hit[1]}
          		} else {
          			ans[q] = []int{-1, -1}
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun substringXorQueries(s: String, queries: Array<IntArray>): Array<IntArray> {
              val n = s.length
              val seen = HashMap<Int, IntArray>()
              for (i in 0 until n) {
                  if (s[i] == '0') {
                      if (!seen.containsKey(0)) seen[0] = intArrayOf(i, i)
                      continue
                  }
                  var v = 0
                  var j = i
                  while (j < n && j < i + 30) {
                      v = v * 2 + (s[j] - '0')
                      if (!seen.containsKey(v)) seen[v] = intArrayOf(i, j)
                      j++
                  }
              }
              return Array(queries.size) { q ->
                  val hit = seen[queries[q][0] xor queries[q][1]]
                  if (hit == null) intArrayOf(-1, -1) else intArrayOf(hit[0], hit[1])
              }
          }
        `,
        swift: code`
          func substringXorQueries(_ s: String, _ queries: [[Int]]) -> [[Int]] {
              let b = Array(s.utf8)
              let n = b.count
              var seen = [Int: [Int]]()
              for i in 0..<n {
                  if b[i] == 48 {
                      if seen[0] == nil { seen[0] = [i, i] }
                      continue
                  }
                  var v = 0
                  var j = i
                  while j < n && j < i + 30 {
                      v = v * 2 + Int(b[j]) - 48
                      if seen[v] == nil { seen[v] = [i, j] }
                      j += 1
                  }
              }
              return queries.map { q in seen[q[0] ^ q[1]] ?? [-1, -1] }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn substringXorQueries(s: String, queries: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let b = s.as_bytes();
              let n = b.len();
              let mut seen: HashMap<i32, (i32, i32)> = HashMap::new();
              for i in 0..n {
                  if b[i] == b'0' {
                      seen.entry(0).or_insert((i as i32, i as i32));
                      continue;
                  }
                  let mut v: i32 = 0;
                  let mut j = i;
                  while j < n && j < i + 30 {
                      v = v * 2 + (b[j] - b'0') as i32;
                      seen.entry(v).or_insert((i as i32, j as i32));
                      j += 1;
                  }
              }
              queries
                  .iter()
                  .map(|q| match seen.get(&(q[0] ^ q[1])) {
                      Some(&(l, r)) => vec![l, r],
                      None => vec![-1, -1],
                  })
                  .collect()
          }
        `,
        php: code`
          function substringXorQueries($s, $queries) {
              $n = strlen($s);
              $seen = [];
              for ($i = 0; $i < $n; $i++) {
                  if ($s[$i] === "0") {
                      if (!isset($seen[0])) $seen[0] = [$i, $i];
                      continue;
                  }
                  $v = 0;
                  for ($j = $i; $j < $n && $j < $i + 30; $j++) {
                      $v = $v * 2 + ($s[$j] === "1" ? 1 : 0);
                      if (!isset($seen[$v])) $seen[$v] = [$i, $j];
                  }
              }
              $ans = [];
              foreach ($queries as $q) {
                  $t = $q[0] ^ $q[1];
                  $ans[] = isset($seen[$t]) ? $seen[$t] : [-1, -1];
              }
              return $ans;
          }
        `,
        ruby: code`
          def substringXorQueries(s, queries)
            n = s.length
            seen = {}
            n.times do |i|
              if s[i] == "0"
                seen[0] = [i, i] unless seen.key?(0)
                next
              end
              v = 0
              j = i
              while j < n && j < i + 30
                v = v * 2 + (s[j] == "1" ? 1 : 0)
                seen[v] = [i, j] unless seen.key?(v)
                j += 1
              end
            end
            queries.map { |a, b| seen.fetch(a ^ b, [-1, -1]) }
          end
        `,
      },
    };
  })(),

  // ── Minimum XOR Sum of Two Arrays (LC 1879) ─────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const n = a.length;
      const memo = new Map<number, number>();
      const f = (i: number, used: number): number => {
        if (i === n) return 0;
        const key = used;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = Infinity;
        for (let j = 0; j < n; j++) if (!(used >> j & 1)) best = Math.min(best, (a[i] ^ b[j]) + f(i + 1, used | (1 << j)));
        memo.set(key, best);
        return best;
      };
      return f(0, 0);
    };
    return {
      slug: "minimum-xor-sum-of-two-arrays",
      title: "Minimum XOR Sum of Two Arrays",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Bitmask", "Amazon", "Google"],
      signature: { funcName: "minimumXORSum", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given two integer arrays `nums1` and `nums2` of the same length `n`. Their **XOR sum** is `(nums1[0] XOR nums2[0]) + (nums1[1] XOR nums2[1]) + ... + (nums1[n-1] XOR nums2[n-1])`.\n\nYou may rearrange the elements of `nums2` in any order. Return the **smallest** XOR sum you can achieve.",
        [
          { in: "nums1 = [4,7], nums2 = [6,5]", out: "2", note: "Rearranged as `[5,6]`: `(4 XOR 5) + (7 XOR 6) = 1 + 1`." },
          { in: "nums1 = [0,0,0], nums2 = [1,2,3]", out: "6" },
          { in: "nums1 = [9], nums2 = [9]", out: "0" },
        ],
        ["n == nums1.length", "n == nums2.length", "1 <= n <= 14", "0 <= nums1[i], nums2[i] <= 10^7"]),
      hints: [
        "This is an assignment problem: match each `nums1[i]` with a distinct `nums2[j]` at cost `nums1[i] XOR nums2[j]`.",
        "Trying all n! orders is too many for n = 14, but the set of already-used `nums2` elements fits in a 14-bit mask.",
        "Let `dp[mask]` be the cheapest way to match the first `popcount(mask)` elements of `nums1` with the elements of `nums2` in `mask`. Extend it by matching the next `nums1` element with each unused `j`.",
      ],
      editorial: explain({
        idea: "Match `nums1` in order. After matching the first `i` elements, only *which* `nums2` elements are used matters — a bitmask — so a DP over the 2^n masks replaces the n! permutations.",
        steps: [
          "Set `dp[0] = 0` and every other `dp[mask]` to infinity.",
          "Visit masks in increasing order. With `i = popcount(mask)` (the next `nums1` index), for each `j` not in `mask` update `dp[mask | 1<<j]` with `dp[mask] + (nums1[i] XOR nums2[j])`.",
          "Return `dp[2^n - 1]`.",
        ],
        why: "Any rearrangement assigns `nums1[0], nums1[1], …` in turn to distinct `nums2` elements, so it is a path from the empty mask to the full mask that adds exactly its XOR terms. The cost of finishing depends only on which elements are still free, so keeping the cheapest cost per mask loses nothing. Masks only grow, so increasing order processes each mask after all its predecessors.",
        time: "O(n · 2^n)",
        space: "O(2^n)",
        pitfalls: [
          "Greedy pairing (sorting both arrays, or always taking the closest XOR) is not optimal.",
          "The `nums1` index is the popcount of the mask, not a separate DP dimension.",
          "The sum stays below 14 · 2^24, so a 32-bit integer suffices, but the infinity value must not overflow when an edge cost is added.",
        ],
      }),
      examples: [
        { input: "[4,7]\n[6,5]", expectedOutput: "2" },
        { input: "[0,0,0]\n[1,2,3]", expectedOutput: "6" },
        { input: "[9]\n[9]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 4), ri(rng, 1, 8)]);
        const hi = pick(rng, [7, 255, 10000000]);
        const nums1 = Array.from({ length: n }, () => randVal(rng, hi));
        const nums2 = Array.from({ length: n }, () => randVal(rng, hi));
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}`, expectedOutput: String(ref(nums1, nums2)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumXORSum(nums1: List[int], nums2: List[int]) -> int:
              n = len(nums1)
              full = 1 << n
              inf = float("inf")
              dp = [inf] * full
              dp[0] = 0
              for mask in range(full):
                  cur = dp[mask]
                  i = bin(mask).count("1")
                  if i >= n:
                      continue
                  a = nums1[i]
                  for j in range(n):
                      if mask & (1 << j):
                          continue
                      nm = mask | (1 << j)
                      v = cur + (a ^ nums2[j])
                      if v < dp[nm]:
                          dp[nm] = v
              return dp[full - 1]
        `,
        javascript: code`
          var minimumXORSum = function(nums1, nums2) {
              var n = nums1.length, full = 1 << n;
              var dp = new Array(full).fill(Infinity), pc = new Array(full).fill(0);
              dp[0] = 0;
              for (var mask = 0; mask < full; mask++) {
                  if (mask) pc[mask] = pc[mask >> 1] + (mask & 1);
                  var i = pc[mask];
                  if (i >= n) continue;
                  for (var j = 0; j < n; j++) {
                      if (mask & (1 << j)) continue;
                      var nm = mask | (1 << j), v = dp[mask] + (nums1[i] ^ nums2[j]);
                      if (v < dp[nm]) dp[nm] = v;
                  }
              }
              return dp[full - 1];
          };
        `,
        typescript: code`
          function minimumXORSum(nums1: number[], nums2: number[]): number {
              var n = nums1.length, full = 1 << n, INF = 1 << 30;
              var dp: number[] = [], pc: number[] = [];
              for (var z = 0; z < full; z++) { dp.push(INF); pc.push(0); }
              dp[0] = 0;
              for (var mask = 0; mask < full; mask++) {
                  if (mask) pc[mask] = pc[mask >> 1] + (mask & 1);
                  var i = pc[mask];
                  if (i >= n) continue;
                  for (var j = 0; j < n; j++) {
                      if (mask & (1 << j)) continue;
                      var nm = mask | (1 << j), v = dp[mask] + (nums1[i] ^ nums2[j]);
                      if (v < dp[nm]) dp[nm] = v;
                  }
              }
              return dp[full - 1];
          }
        `,
        java: code`
          public static int minimumXORSum(int[] nums1, int[] nums2) {
              int n = nums1.length, full = 1 << n;
              int[] dp = new int[full];
              Arrays.fill(dp, 1 << 30);
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  int i = Integer.bitCount(mask);
                  if (i >= n) continue;
                  for (int j = 0; j < n; j++) {
                      if ((mask & (1 << j)) != 0) continue;
                      int nm = mask | (1 << j);
                      dp[nm] = Math.min(dp[nm], dp[mask] + (nums1[i] ^ nums2[j]));
                  }
              }
              return dp[full - 1];
          }
        `,
        cpp: code`
          int minimumXORSum(vector<int>& nums1, vector<int>& nums2) {
              int n = nums1.size(), full = 1 << n;
              vector<int> dp(full, 1 << 30);
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  int i = __builtin_popcount(mask);
                  if (i >= n) continue;
                  for (int j = 0; j < n; j++) {
                      if (mask & (1 << j)) continue;
                      int nm = mask | (1 << j);
                      dp[nm] = min(dp[nm], dp[mask] + (nums1[i] ^ nums2[j]));
                  }
              }
              return dp[full - 1];
          }
        `,
        c: code`
          int minimumXORSum(int* nums1, int nums1Size, int* nums2, int nums2Size) {
              int n = nums1Size, full = 1 << n;
              int* dp = (int*) malloc(full * sizeof(int));
              int* pc = (int*) malloc(full * sizeof(int));
              for (int mask = 0; mask < full; mask++) {
                  dp[mask] = 1 << 30;
                  pc[mask] = mask ? pc[mask >> 1] + (mask & 1) : 0;
              }
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  int i = pc[mask];
                  if (i >= n) continue;
                  for (int j = 0; j < n; j++) {
                      if (mask & (1 << j)) continue;
                      int nm = mask | (1 << j);
                      int v = dp[mask] + (nums1[i] ^ nums2[j]);
                      if (v < dp[nm]) dp[nm] = v;
                  }
              }
              int ans = dp[full - 1];
              free(dp);
              free(pc);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumXORSum(int[] nums1, int[] nums2)
          {
              int n = nums1.Length, full = 1 << n;
              int[] dp = new int[full];
              int[] pc = new int[full];
              for (int mask = 0; mask < full; mask++)
              {
                  dp[mask] = 1 << 30;
                  pc[mask] = mask == 0 ? 0 : pc[mask >> 1] + (mask & 1);
              }
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++)
              {
                  int i = pc[mask];
                  if (i >= n) continue;
                  for (int j = 0; j < n; j++)
                  {
                      if ((mask & (1 << j)) != 0) continue;
                      int nm = mask | (1 << j);
                      dp[nm] = Math.Min(dp[nm], dp[mask] + (nums1[i] ^ nums2[j]));
                  }
              }
              return dp[full - 1];
          }
        `,
        go: code`
          func minimumXORSum(nums1 []int, nums2 []int) int {
          	n := len(nums1)
          	full := 1 << uint(n)
          	dp := make([]int, full)
          	pc := make([]int, full)
          	for mask := 1; mask < full; mask++ {
          		dp[mask] = 1 << 30
          		pc[mask] = pc[mask>>1] + mask&1
          	}
          	for mask := 0; mask < full; mask++ {
          		i := pc[mask]
          		if i >= n {
          			continue
          		}
          		for j := 0; j < n; j++ {
          			if mask&(1<<uint(j)) != 0 {
          				continue
          			}
          			nm := mask | (1 << uint(j))
          			if v := dp[mask] + (nums1[i] ^ nums2[j]); v < dp[nm] {
          				dp[nm] = v
          			}
          		}
          	}
          	return dp[full-1]
          }
        `,
        kotlin: code`
          fun minimumXORSum(nums1: IntArray, nums2: IntArray): Int {
              val n = nums1.size
              val full = 1 shl n
              val dp = IntArray(full) { 1 shl 30 }
              dp[0] = 0
              for (mask in 0 until full) {
                  val i = Integer.bitCount(mask)
                  if (i >= n) continue
                  for (j in 0 until n) {
                      if ((mask and (1 shl j)) != 0) continue
                      val nm = mask or (1 shl j)
                      val v = dp[mask] + (nums1[i] xor nums2[j])
                      if (v < dp[nm]) dp[nm] = v
                  }
              }
              return dp[full - 1]
          }
        `,
        swift: code`
          func minimumXORSum(_ nums1: [Int], _ nums2: [Int]) -> Int {
              let n = nums1.count
              let full = 1 << n
              var dp = [Int](repeating: 1 << 30, count: full)
              dp[0] = 0
              for mask in 0..<full {
                  let i = mask.nonzeroBitCount
                  if i >= n { continue }
                  for j in 0..<n where mask & (1 << j) == 0 {
                      let nm = mask | (1 << j)
                      let v = dp[mask] + (nums1[i] ^ nums2[j])
                      if v < dp[nm] { dp[nm] = v }
                  }
              }
              return dp[full - 1]
          }
        `,
        rust: code`
          fn minimumXORSum(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {
              let n = nums1.len();
              let full = 1usize << n;
              let mut dp = vec![1i32 << 30; full];
              dp[0] = 0;
              for mask in 0..full {
                  let i = (mask as u32).count_ones() as usize;
                  if i >= n {
                      continue;
                  }
                  for j in 0..n {
                      if mask & (1 << j) != 0 {
                          continue;
                      }
                      let nm = mask | (1 << j);
                      let v = dp[mask] + (nums1[i] ^ nums2[j]);
                      if v < dp[nm] {
                          dp[nm] = v;
                      }
                  }
              }
              dp[full - 1]
          }
        `,
        php: code`
          function minimumXORSum($nums1, $nums2) {
              $n = count($nums1);
              $full = 1 << $n;
              $dp = array_fill(0, $full, 1 << 30);
              $pc = array_fill(0, $full, 0);
              $dp[0] = 0;
              for ($mask = 0; $mask < $full; $mask++) {
                  if ($mask) $pc[$mask] = $pc[$mask >> 1] + ($mask & 1);
                  $i = $pc[$mask];
                  if ($i >= $n) continue;
                  for ($j = 0; $j < $n; $j++) {
                      if ($mask & (1 << $j)) continue;
                      $nm = $mask | (1 << $j);
                      $v = $dp[$mask] + ($nums1[$i] ^ $nums2[$j]);
                      if ($v < $dp[$nm]) $dp[$nm] = $v;
                  }
              }
              return $dp[$full - 1];
          }
        `,
        ruby: code`
          def minimumXORSum(nums1, nums2)
            n = nums1.length
            full = 1 << n
            dp = Array.new(full, 1 << 30)
            pc = Array.new(full, 0)
            dp[0] = 0
            full.times do |mask|
              pc[mask] = pc[mask >> 1] + (mask & 1) if mask > 0
              i = pc[mask]
              next if i >= n
              a = nums1[i]
              cur = dp[mask]
              n.times do |j|
                next if mask & (1 << j) != 0
                nm = mask | (1 << j)
                v = cur + (a ^ nums2[j])
                dp[nm] = v if v < dp[nm]
              end
            end
            dp[full - 1]
          end
        `,
      },
    };
  })(),

  // ── Maximum Students Taking Exam (LC 1349) ──────────────────────
  (() => {
    const ref = (seats: string[]) => {
      const m = seats.length, n = seats[0].length;
      const good: Array<[number, number]> = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (seats[r][c] === ".") good.push([r, c]);
      if (good.length <= 14) {
        let best = 0;
        for (let mask = 0; mask < 1 << good.length; mask++) {
          const pts: Array<[number, number]> = [];
          for (let i = 0; i < good.length; i++) if (mask >> i & 1) pts.push(good[i]);
          let ok = true;
          for (let i = 0; i < pts.length && ok; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              const dr = Math.abs(pts[i][0] - pts[j][0]), dc = Math.abs(pts[i][1] - pts[j][1]);
              if (dc === 1 && dr <= 1) { ok = false; break; }
            }
          }
          if (ok) best = Math.max(best, pts.length);
        }
        return best;
      }
      // Larger boards: plain row DP over every pair of row masks.
      let prev = new Array(1 << n).fill(-1);
      prev[0] = 0;
      for (let r = 0; r < m; r++) {
        const cur = new Array(1 << n).fill(-1);
        for (let mask = 0; mask < 1 << n; mask++) {
          let fits = true;
          for (let c = 0; c < n; c++) if (mask >> c & 1 && (seats[r][c] !== "." || (c > 0 && mask >> (c - 1) & 1))) fits = false;
          if (!fits) continue;
          let cnt = 0;
          for (let c = 0; c < n; c++) cnt += mask >> c & 1;
          for (let p = 0; p < 1 << n; p++) {
            if (prev[p] < 0 || (mask & (p << 1)) || (mask & (p >> 1))) continue;
            cur[mask] = Math.max(cur[mask], prev[p] + cnt);
          }
        }
        prev = cur;
      }
      return Math.max(...prev);
    };
    return {
      slug: "maximum-students-taking-exam",
      title: "Maximum Students Taking Exam",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Bit Manipulation", "Matrix", "Bitmask", "Google", "Amazon"],
      signature: { funcName: "maxStudents", params: [{ name: "seats", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "A classroom is described by `seats`, an `m x n` grid given as `m` strings of length `n`: `'.'` is a usable seat and `'#'` is a broken one.\n\nA student can see the answer sheets of students sitting directly to their **left**, **right**, **upper left** and **upper right**, but not of the students directly in front of or behind them. Seat students only in usable seats so that **no** student can see another student's answers.\n\nReturn the maximum number of students that can take the exam together.",
        [
          { in: "seats = [\".#.#.\",\".....\"]", out: "6", note: "Columns 0, 2 and 4 in both rows. The back row's diagonals all point at broken seats, and same-column seats do not see each other." },
          { in: "seats = [\"..\",\"..\"]", out: "2", note: "Both seats of one column — any other pair is side by side or diagonal." },
          { in: "seats = [\"#\"]", out: "0" },
        ],
        ["seats.length == m", "seats[i].length == n", "1 <= m, n <= 8", "seats[i][j] is '.' or '#'"]),
      hints: [
        "Process the room row by row. Which seats in one row can be filled together, and how does a row constrain the next one?",
        "Encode a row's occupied seats as a bitmask. Within a row no two set bits may be adjacent; across consecutive rows, the lower row's mask may not overlap the upper row's mask shifted left or right by one.",
        "Let `dp[row][mask]` be the most students in rows `0..row` with `mask` occupied in `row`. With at most 8 columns there are few valid masks per row, so trying every pair of consecutive masks is cheap.",
      ],
      editorial: explain({
        idea: "Conflicts only connect a row with itself and with the row directly above, so a DP over rows whose state is the occupancy bitmask of the current row captures everything that matters.",
        steps: [
          "For each row compute `good`, the mask of usable seats.",
          "A row mask is valid if it is a subset of `good` and has no two adjacent bits (`mask AND (mask << 1) == 0`).",
          "Start from the empty row (`dp = {0: 0}`). For each row and each valid mask, take the best previous mask `p` with `mask AND (p << 1) == 0` and `mask AND (p >> 1) == 0`, and store that value plus `popcount(mask)`.",
          "Return the largest value after the last row.",
        ],
        why: "Every forbidden pair is either two neighbours in one row (ruled out by the adjacency test) or a student and someone in the row above at a diagonal (ruled out by the two shifted tests); pairs two or more rows apart never conflict. So an arrangement is valid exactly when each row mask is valid and each consecutive pair is compatible, and the DP maximises over all such sequences.",
        time: "O(m · F²), F ≤ 55 valid masks per row",
        space: "O(2^n)",
        pitfalls: [
          "Students directly in front or behind do not conflict — only the diagonals of the row above (and below, which is the same relation).",
          "Check broken seats with the `good` mask, not just adjacency.",
          "Keep only reachable previous masks to avoid scanning all 2^n × 2^n pairs.",
        ],
      }),
      examples: [
        { input: '[".#.#.","....."]', expectedOutput: "6" },
        { input: '["..",".."]', expectedOutput: "2" },
        { input: '["#"]', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = pick(rng, [1, ri(rng, 1, 3), ri(rng, 1, 8)]);
        const n = pick(rng, [1, ri(rng, 1, 3), ri(rng, 1, 6), ri(rng, 1, 7)]);
        const broken = pick(rng, [0, 0.2, 0.4, 0.7]);
        const seats = Array.from({ length: m }, () => {
          let row = "";
          for (let c = 0; c < n; c++) row += rng() < broken ? "#" : ".";
          return row;
        });
        return { input: fmtStrArr(seats), expectedOutput: String(ref(seats)) };
      },
      hiddenCount: 2500,
      solutions: {
        python: code`
          from typing import List

          def maxStudents(seats: List[str]) -> int:
              n = len(seats[0])
              prev = {0: 0}
              for row in seats:
                  good = 0
                  for c in range(n):
                      if row[c] == ".":
                          good |= 1 << c
                  cur = {}
                  for mask in range(1 << n):
                      if (mask & ~good) or (mask & (mask << 1)):
                          continue
                      best = -1
                      for p, v in prev.items():
                          if (mask & (p << 1)) or (mask & (p >> 1)):
                              continue
                          if v > best:
                              best = v
                      if best >= 0:
                          cur[mask] = best + bin(mask).count("1")
                  prev = cur
              return max(prev.values())
        `,
        javascript: code`
          var maxStudents = function(seats) {
              var n = seats[0].length, full = 1 << n;
              var prevMasks = [0], prevVals = [0];
              for (var r = 0; r < seats.length; r++) {
                  var good = 0;
                  for (var c = 0; c < n; c++) if (seats[r][c] === ".") good |= 1 << c;
                  var curMasks = [], curVals = [];
                  for (var mask = 0; mask < full; mask++) {
                      if ((mask & ~good) || (mask & (mask << 1))) continue;
                      var best = -1;
                      for (var t = 0; t < prevMasks.length; t++) {
                          var p = prevMasks[t];
                          if ((mask & (p << 1)) || (mask & (p >> 1))) continue;
                          if (prevVals[t] > best) best = prevVals[t];
                      }
                      if (best < 0) continue;
                      var cnt = 0;
                      for (var x = mask; x; x >>= 1) cnt += x & 1;
                      curMasks.push(mask);
                      curVals.push(best + cnt);
                  }
                  prevMasks = curMasks;
                  prevVals = curVals;
              }
              var ans = 0;
              for (var k = 0; k < prevVals.length; k++) if (prevVals[k] > ans) ans = prevVals[k];
              return ans;
          };
        `,
        typescript: code`
          function maxStudents(seats: string[]): number {
              var n = seats[0].length, full = 1 << n;
              var prevMasks: number[] = [0], prevVals: number[] = [0];
              for (var r = 0; r < seats.length; r++) {
                  var good = 0;
                  for (var c = 0; c < n; c++) if (seats[r].charAt(c) === ".") good |= 1 << c;
                  var curMasks: number[] = [], curVals: number[] = [];
                  for (var mask = 0; mask < full; mask++) {
                      if ((mask & ~good) || (mask & (mask << 1))) continue;
                      var best = -1;
                      for (var t = 0; t < prevMasks.length; t++) {
                          var p = prevMasks[t];
                          if ((mask & (p << 1)) || (mask & (p >> 1))) continue;
                          if (prevVals[t] > best) best = prevVals[t];
                      }
                      if (best < 0) continue;
                      var cnt = 0;
                      for (var x = mask; x; x >>= 1) cnt += x & 1;
                      curMasks.push(mask);
                      curVals.push(best + cnt);
                  }
                  prevMasks = curMasks;
                  prevVals = curVals;
              }
              var ans = 0;
              for (var k = 0; k < prevVals.length; k++) if (prevVals[k] > ans) ans = prevVals[k];
              return ans;
          }
        `,
        java: code`
          public static int maxStudents(String[] seats) {
              int n = seats[0].length(), full = 1 << n;
              int[] prevMasks = new int[full], prevVals = new int[full];
              int[] curMasks = new int[full], curVals = new int[full];
              int pl = 1;
              prevMasks[0] = 0;
              prevVals[0] = 0;
              for (String row : seats) {
                  int good = 0;
                  for (int c = 0; c < n; c++) if (row.charAt(c) == '.') good |= 1 << c;
                  int cl = 0;
                  for (int mask = 0; mask < full; mask++) {
                      if ((mask & ~good) != 0 || (mask & (mask << 1)) != 0) continue;
                      int best = -1;
                      for (int t = 0; t < pl; t++) {
                          int p = prevMasks[t];
                          if ((mask & (p << 1)) != 0 || (mask & (p >> 1)) != 0) continue;
                          best = Math.max(best, prevVals[t]);
                      }
                      if (best < 0) continue;
                      curMasks[cl] = mask;
                      curVals[cl] = best + Integer.bitCount(mask);
                      cl++;
                  }
                  int[] tmp = prevMasks; prevMasks = curMasks; curMasks = tmp;
                  tmp = prevVals; prevVals = curVals; curVals = tmp;
                  pl = cl;
              }
              int ans = 0;
              for (int t = 0; t < pl; t++) ans = Math.max(ans, prevVals[t]);
              return ans;
          }
        `,
        cpp: code`
          int maxStudents(vector<string>& seats) {
              int n = seats[0].size(), full = 1 << n;
              vector<pair<int, int>> prev(1, make_pair(0, 0)), cur;
              for (const string& row : seats) {
                  int good = 0;
                  for (int c = 0; c < n; c++) if (row[c] == '.') good |= 1 << c;
                  cur.clear();
                  for (int mask = 0; mask < full; mask++) {
                      if ((mask & ~good) || (mask & (mask << 1))) continue;
                      int best = -1;
                      for (auto& pv : prev) {
                          if ((mask & (pv.first << 1)) || (mask & (pv.first >> 1))) continue;
                          best = max(best, pv.second);
                      }
                      if (best < 0) continue;
                      cur.push_back(make_pair(mask, best + __builtin_popcount(mask)));
                  }
                  swap(prev, cur);
              }
              int ans = 0;
              for (auto& pv : prev) ans = max(ans, pv.second);
              return ans;
          }
        `,
        c: code`
          int maxStudents(char** seats, int seatsSize) {
              int n = 0;
              while (seats[0][n]) n++;
              int full = 1 << n;
              int prevMasks[256], prevVals[256], curMasks[256], curVals[256];
              int pl = 1;
              prevMasks[0] = 0;
              prevVals[0] = 0;
              for (int r = 0; r < seatsSize; r++) {
                  int good = 0;
                  for (int c = 0; c < n; c++) if (seats[r][c] == '.') good |= 1 << c;
                  int cl = 0;
                  for (int mask = 0; mask < full; mask++) {
                      if ((mask & ~good) || (mask & (mask << 1))) continue;
                      int best = -1;
                      for (int t = 0; t < pl; t++) {
                          int p = prevMasks[t];
                          if ((mask & (p << 1)) || (mask & (p >> 1))) continue;
                          if (prevVals[t] > best) best = prevVals[t];
                      }
                      if (best < 0) continue;
                      int cnt = 0;
                      for (int x = mask; x; x >>= 1) cnt += x & 1;
                      curMasks[cl] = mask;
                      curVals[cl] = best + cnt;
                      cl++;
                  }
                  for (int t = 0; t < cl; t++) { prevMasks[t] = curMasks[t]; prevVals[t] = curVals[t]; }
                  pl = cl;
              }
              int ans = 0;
              for (int t = 0; t < pl; t++) if (prevVals[t] > ans) ans = prevVals[t];
              return ans;
          }
        `,
        csharp: code`
          public static int MaxStudents(string[] seats)
          {
              int n = seats[0].Length, full = 1 << n;
              var prevMasks = new List<int> { 0 };
              var prevVals = new List<int> { 0 };
              foreach (string row in seats)
              {
                  int good = 0;
                  for (int c = 0; c < n; c++) if (row[c] == '.') good |= 1 << c;
                  var curMasks = new List<int>();
                  var curVals = new List<int>();
                  for (int mask = 0; mask < full; mask++)
                  {
                      if ((mask & ~good) != 0 || (mask & (mask << 1)) != 0) continue;
                      int best = -1;
                      for (int t = 0; t < prevMasks.Count; t++)
                      {
                          int p = prevMasks[t];
                          if ((mask & (p << 1)) != 0 || (mask & (p >> 1)) != 0) continue;
                          best = Math.Max(best, prevVals[t]);
                      }
                      if (best < 0) continue;
                      int cnt = 0;
                      for (int x = mask; x != 0; x >>= 1) cnt += x & 1;
                      curMasks.Add(mask);
                      curVals.Add(best + cnt);
                  }
                  prevMasks = curMasks;
                  prevVals = curVals;
              }
              int ans = 0;
              foreach (int v in prevVals) ans = Math.Max(ans, v);
              return ans;
          }
        `,
        go: code`
          func maxStudents(seats []string) int {
          	n := len(seats[0])
          	full := 1 << uint(n)
          	prevMasks, prevVals := []int{0}, []int{0}
          	for _, row := range seats {
          		good := 0
          		for c := 0; c < n; c++ {
          			if row[c] == '.' {
          				good |= 1 << uint(c)
          			}
          		}
          		curMasks, curVals := []int{}, []int{}
          		for mask := 0; mask < full; mask++ {
          			if mask&^good != 0 || mask&(mask<<1) != 0 {
          				continue
          			}
          			best := -1
          			for t, p := range prevMasks {
          				if mask&(p<<1) != 0 || mask&(p>>1) != 0 {
          					continue
          				}
          				if prevVals[t] > best {
          					best = prevVals[t]
          				}
          			}
          			if best < 0 {
          				continue
          			}
          			cnt := 0
          			for x := mask; x > 0; x >>= 1 {
          				cnt += x & 1
          			}
          			curMasks = append(curMasks, mask)
          			curVals = append(curVals, best+cnt)
          		}
          		prevMasks, prevVals = curMasks, curVals
          	}
          	ans := 0
          	for _, v := range prevVals {
          		if v > ans {
          			ans = v
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun maxStudents(seats: Array<String>): Int {
              val n = seats[0].length
              val full = 1 shl n
              var prevMasks = intArrayOf(0)
              var prevVals = intArrayOf(0)
              for (row in seats) {
                  var good = 0
                  for (c in 0 until n) if (row[c] == '.') good = good or (1 shl c)
                  val curMasks = ArrayList<Int>()
                  val curVals = ArrayList<Int>()
                  for (mask in 0 until full) {
                      if ((mask and good.inv()) != 0 || (mask and (mask shl 1)) != 0) continue
                      var best = -1
                      for (t in prevMasks.indices) {
                          val p = prevMasks[t]
                          if ((mask and (p shl 1)) != 0 || (mask and (p shr 1)) != 0) continue
                          if (prevVals[t] > best) best = prevVals[t]
                      }
                      if (best < 0) continue
                      curMasks.add(mask)
                      curVals.add(best + Integer.bitCount(mask))
                  }
                  prevMasks = curMasks.toIntArray()
                  prevVals = curVals.toIntArray()
              }
              var ans = 0
              for (v in prevVals) if (v > ans) ans = v
              return ans
          }
        `,
        swift: code`
          func maxStudents(_ seats: [String]) -> Int {
              let rows = seats.map { Array($0.utf8) }
              let n = rows[0].count
              let full = 1 << n
              var prevMasks = [0]
              var prevVals = [0]
              for row in rows {
                  var good = 0
                  for c in 0..<n where row[c] == 46 { good |= 1 << c }
                  var curMasks: [Int] = []
                  var curVals: [Int] = []
                  for mask in 0..<full {
                      if mask & ~good != 0 || mask & (mask << 1) != 0 { continue }
                      var best = -1
                      for t in 0..<prevMasks.count {
                          let p = prevMasks[t]
                          if mask & (p << 1) != 0 || mask & (p >> 1) != 0 { continue }
                          if prevVals[t] > best { best = prevVals[t] }
                      }
                      if best < 0 { continue }
                      curMasks.append(mask)
                      curVals.append(best + mask.nonzeroBitCount)
                  }
                  prevMasks = curMasks
                  prevVals = curVals
              }
              return prevVals.max() ?? 0
          }
        `,
        rust: code`
          fn maxStudents(seats: Vec<String>) -> i32 {
              let n = seats[0].len();
              let full = 1u32 << n;
              let mut prev: Vec<(u32, i32)> = vec![(0, 0)];
              for row in seats.iter() {
                  let b = row.as_bytes();
                  let mut good = 0u32;
                  for c in 0..n {
                      if b[c] == b'.' {
                          good |= 1 << c;
                      }
                  }
                  let mut cur: Vec<(u32, i32)> = Vec::new();
                  for mask in 0..full {
                      if mask & !good != 0 || mask & (mask << 1) != 0 {
                          continue;
                      }
                      let mut best = -1;
                      for &(p, v) in prev.iter() {
                          if mask & (p << 1) != 0 || mask & (p >> 1) != 0 {
                              continue;
                          }
                          if v > best {
                              best = v;
                          }
                      }
                      if best < 0 {
                          continue;
                      }
                      cur.push((mask, best + mask.count_ones() as i32));
                  }
                  prev = cur;
              }
              let mut ans = 0;
              for &(_, v) in prev.iter() {
                  if v > ans {
                      ans = v;
                  }
              }
              ans
          }
        `,
        php: code`
          function maxStudents($seats) {
              $n = strlen($seats[0]);
              $full = 1 << $n;
              $prev = [0 => 0];
              foreach ($seats as $row) {
                  $good = 0;
                  for ($c = 0; $c < $n; $c++) if ($row[$c] === ".") $good |= 1 << $c;
                  $cur = [];
                  for ($mask = 0; $mask < $full; $mask++) {
                      if (($mask & ~$good) || ($mask & ($mask << 1))) continue;
                      $best = -1;
                      foreach ($prev as $p => $v) {
                          if (($mask & ($p << 1)) || ($mask & ($p >> 1))) continue;
                          if ($v > $best) $best = $v;
                      }
                      if ($best < 0) continue;
                      $cur[$mask] = $best + substr_count(decbin($mask), "1");
                  }
                  $prev = $cur;
              }
              return max($prev);
          }
        `,
        ruby: code`
          def maxStudents(seats)
            n = seats[0].length
            prev = { 0 => 0 }
            seats.each do |row|
              good = 0
              n.times { |c| good |= 1 << c if row[c] == "." }
              cur = {}
              (1 << n).times do |mask|
                next if (mask & ~good) != 0 || (mask & (mask << 1)) != 0
                best = -1
                prev.each do |p, v|
                  next if (mask & (p << 1)) != 0 || (mask & (p >> 1)) != 0
                  best = v if v > best
                end
                next if best < 0
                cur[mask] = best + mask.to_s(2).count("1")
              end
              prev = cur
            end
            prev.values.max
          end
        `,
      },
    };
  })(),

  // ── Number of Ways to Wear Different Hats to Each Other (LC 1434) ──
  (() => {
    const ref = (hats: number[][]) => {
      const n = hats.length;
      const same = hats.every((h) => h.length === hats[0].length && [...h].sort((x, y) => x - y).join() === [...hats[0]].sort((x, y) => x - y).join());
      if (same && n > 6) {
        // Everyone likes the same s hats: s * (s-1) * ... * (s-n+1) ways.
        let ways = 1n;
        for (let i = 0; i < n; i++) ways = ways * BigInt(Math.max(0, hats[0].length - i));
        return Number(ways % BigInt(MOD));
      }
      const used = new Set<number>();
      const rec = (p: number): number => {
        if (p === n) return 1;
        let c = 0;
        for (const h of hats[p]) if (!used.has(h)) { used.add(h); c += rec(p + 1); used.delete(h); }
        return c;
      };
      return rec(0) % MOD;
    };
    return {
      slug: "number-of-ways-to-wear-different-hats-to-each-other",
      title: "Number of Ways to Wear Different Hats to Each Other",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Bitmask", "Google", "Amazon"],
      signature: { funcName: "numberWays", params: [{ name: "hats", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` people and 40 kinds of hats labelled `1` to `40`. `hats[i]` lists the hat labels that person `i` likes (the lists may have different lengths).\n\nCount the ways to give every person one hat they like so that no two people wear the same hat. Two ways differ if some person wears a different hat.\n\nReturn the count modulo `10^9 + 7`.",
        [
          { in: "hats = [[1,2],[1,2]]", out: "2" },
          { in: "hats = [[1,2,3],[2,3],[1,4]]", out: "6", note: "If person 2 takes hat 1, persons 0 and 1 share {2,3}: 2 ways. If person 2 takes hat 4, there are 3 × 2 choices minus the 2 clashes: 4 ways." },
          { in: "hats = [[7],[7]]", out: "0" },
        ],
        ["n == hats.length", "1 <= n <= 10", "1 <= hats[i].length <= 40", "1 <= hats[i][j] <= 40", "hats[i] contains distinct integers"]),
      hints: [
        "A bitmask over the 40 hats is far too big, but there are at most 10 people.",
        "Flip the point of view: go through the hats one at a time and decide which person (if any) gets each hat.",
        "Let `dp[mask]` be the number of ways in which exactly the people in `mask` have hats, using the hats processed so far. Each new hat either stays unused or goes to one person who likes it and is not yet in `mask`.",
      ],
      editorial: explain({
        idea: "Iterate over hats instead of people: with at most 10 people, the set of people already wearing a hat fits in a 10-bit mask, and each hat moves the DP from a mask to a mask with one more person.",
        steps: [
          "Build `likes[h]`, the people who like hat `h`.",
          "Start with `dp[0] = 1`.",
          "For each hat `h` from 1 to 40, walk the masks from largest to smallest; for each person `p` in `likes[h]` not in `mask`, add `dp[mask]` to `dp[mask | 1<<p]` modulo `10^9 + 7`. (Leaving `dp[mask]` as is means hat `h` stays unused.)",
          "Return `dp[2^n - 1]`.",
        ],
        why: "Every valid assignment gives each hat to at most one person, so it is described uniquely by the sequence of decisions \"hat h goes to nobody / to person p\" taken in hat order, and the DP counts exactly those sequences that end with everyone served. Walking the masks downward makes the update in place safe: a mask only feeds larger masks, which have already been visited for this hat, so no hat is handed out twice.",
        time: "O(40 · 2^n · n)",
        space: "O(2^n)",
        pitfalls: [
          "A DP over people with a mask of used hats needs 2^40 states — the hat-major order is the whole trick.",
          "Update masks in descending order (or into a fresh array) so a hat is not given to two people.",
          "Add modulo 10^9 + 7 at every step; the true count is enormous when many people like many hats.",
        ],
      }),
      examples: [
        { input: "[[1,2],[1,2]]", expectedOutput: "2" },
        { input: "[[1,2,3],[2,3],[1,4]]", expectedOutput: "6" },
        { input: "[[7],[7]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const labels = (k: number, top: number) => shuffle(rng, Array.from({ length: top }, (_, i) => i + 1)).slice(0, k);
        if (rng() < 0.03) {
          const n = ri(rng, 7, 8);
          const list = labels(ri(rng, n - 1, 40), 40);
          return { input: fmtIntMat(Array.from({ length: n }, () => shuffle(rng, list.slice()))), expectedOutput: String(ref(Array.from({ length: n }, () => list))) };
        }
        const n = pick(rng, [1, ri(rng, 1, 3), ri(rng, 1, 6)]);
        const top = pick(rng, [4, 8, 40]);
        const hats = Array.from({ length: n }, () => labels(ri(rng, 1, Math.min(6, top)), top));
        return { input: fmtIntMat(hats), expectedOutput: String(ref(hats)) };
      },
      hiddenCount: 2500,
      solutions: {
        python: code`
          from typing import List

          def numberWays(hats: List[List[int]]) -> int:
              mod = 1000000007
              n = len(hats)
              full = 1 << n
              likes = [[] for _ in range(41)]
              for p in range(n):
                  for h in hats[p]:
                      likes[h].append(p)
              dp = [0] * full
              dp[0] = 1
              for h in range(1, 41):
                  people = likes[h]
                  if not people:
                      continue
                  for mask in range(full - 1, -1, -1):
                      ways = dp[mask]
                      if not ways:
                          continue
                      for p in people:
                          bit = 1 << p
                          if not mask & bit:
                              dp[mask | bit] = (dp[mask | bit] + ways) % mod
              return dp[full - 1]
        `,
        javascript: code`
          var numberWays = function(hats) {
              var M = 1000000007, n = hats.length, full = 1 << n;
              var likes = [];
              for (var h = 0; h <= 40; h++) likes.push([]);
              for (var p = 0; p < n; p++) {
                  for (var t = 0; t < hats[p].length; t++) likes[hats[p][t]].push(p);
              }
              var dp = new Array(full).fill(0);
              dp[0] = 1;
              for (var hat = 1; hat <= 40; hat++) {
                  var people = likes[hat];
                  if (!people.length) continue;
                  for (var mask = full - 1; mask >= 0; mask--) {
                      if (!dp[mask]) continue;
                      for (var q = 0; q < people.length; q++) {
                          var bit = 1 << people[q];
                          if (mask & bit) continue;
                          dp[mask | bit] = (dp[mask | bit] + dp[mask]) % M;
                      }
                  }
              }
              return dp[full - 1];
          };
        `,
        typescript: code`
          function numberWays(hats: number[][]): number {
              var M = 1000000007, n = hats.length, full = 1 << n;
              var likes: number[][] = [];
              for (var h = 0; h <= 40; h++) likes.push([]);
              for (var p = 0; p < n; p++) {
                  for (var t = 0; t < hats[p].length; t++) likes[hats[p][t]].push(p);
              }
              var dp: number[] = [];
              for (var z = 0; z < full; z++) dp.push(0);
              dp[0] = 1;
              for (var hat = 1; hat <= 40; hat++) {
                  var people = likes[hat];
                  if (!people.length) continue;
                  for (var mask = full - 1; mask >= 0; mask--) {
                      if (!dp[mask]) continue;
                      for (var q = 0; q < people.length; q++) {
                          var bit = 1 << people[q];
                          if (mask & bit) continue;
                          dp[mask | bit] = (dp[mask | bit] + dp[mask]) % M;
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        java: code`
          public static int numberWays(int[][] hats) {
              final int M = 1000000007;
              int n = hats.length, full = 1 << n;
              List<List<Integer>> likes = new ArrayList<>();
              for (int h = 0; h <= 40; h++) likes.add(new ArrayList<Integer>());
              for (int p = 0; p < n; p++) for (int h : hats[p]) likes.get(h).add(p);
              int[] dp = new int[full];
              dp[0] = 1;
              for (int h = 1; h <= 40; h++) {
                  List<Integer> people = likes.get(h);
                  if (people.isEmpty()) continue;
                  for (int mask = full - 1; mask >= 0; mask--) {
                      if (dp[mask] == 0) continue;
                      for (int p : people) {
                          int bit = 1 << p;
                          if ((mask & bit) != 0) continue;
                          dp[mask | bit] = (dp[mask | bit] + dp[mask]) % M;
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        cpp: code`
          int numberWays(vector<vector<int>>& hats) {
              const int M = 1000000007;
              int n = hats.size(), full = 1 << n;
              vector<vector<int>> likes(41);
              for (int p = 0; p < n; p++) for (int h : hats[p]) likes[h].push_back(p);
              vector<int> dp(full, 0);
              dp[0] = 1;
              for (int h = 1; h <= 40; h++) {
                  if (likes[h].empty()) continue;
                  for (int mask = full - 1; mask >= 0; mask--) {
                      if (!dp[mask]) continue;
                      for (int p : likes[h]) {
                          int bit = 1 << p;
                          if (mask & bit) continue;
                          dp[mask | bit] = (dp[mask | bit] + dp[mask]) % M;
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        c: code`
          int numberWays(int** hats, int hatsSize, int* hatsColSize) {
              const int M = 1000000007;
              int n = hatsSize, full = 1 << n;
              int likes[41][10];
              int nl[41];
              for (int h = 0; h <= 40; h++) nl[h] = 0;
              for (int p = 0; p < n; p++) {
                  for (int t = 0; t < hatsColSize[p]; t++) {
                      int h = hats[p][t];
                      likes[h][nl[h]++] = p;
                  }
              }
              int* dp = (int*) calloc(full, sizeof(int));
              dp[0] = 1;
              for (int h = 1; h <= 40; h++) {
                  if (nl[h] == 0) continue;
                  for (int mask = full - 1; mask >= 0; mask--) {
                      if (!dp[mask]) continue;
                      for (int q = 0; q < nl[h]; q++) {
                          int bit = 1 << likes[h][q];
                          if (mask & bit) continue;
                          dp[mask | bit] = (dp[mask | bit] + dp[mask]) % M;
                      }
                  }
              }
              int ans = dp[full - 1];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int NumberWays(int[][] hats)
          {
              const int M = 1000000007;
              int n = hats.Length, full = 1 << n;
              var likes = new List<int>[41];
              for (int h = 0; h <= 40; h++) likes[h] = new List<int>();
              for (int p = 0; p < n; p++) foreach (int h in hats[p]) likes[h].Add(p);
              int[] dp = new int[full];
              dp[0] = 1;
              for (int h = 1; h <= 40; h++)
              {
                  if (likes[h].Count == 0) continue;
                  for (int mask = full - 1; mask >= 0; mask--)
                  {
                      if (dp[mask] == 0) continue;
                      foreach (int p in likes[h])
                      {
                          int bit = 1 << p;
                          if ((mask & bit) != 0) continue;
                          dp[mask | bit] = (dp[mask | bit] + dp[mask]) % M;
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        go: code`
          func numberWays(hats [][]int) int {
          	const M = 1000000007
          	n := len(hats)
          	full := 1 << uint(n)
          	likes := make([][]int, 41)
          	for p := 0; p < n; p++ {
          		for _, h := range hats[p] {
          			likes[h] = append(likes[h], p)
          		}
          	}
          	dp := make([]int, full)
          	dp[0] = 1
          	for h := 1; h <= 40; h++ {
          		if len(likes[h]) == 0 {
          			continue
          		}
          		for mask := full - 1; mask >= 0; mask-- {
          			if dp[mask] == 0 {
          				continue
          			}
          			for _, p := range likes[h] {
          				bit := 1 << uint(p)
          				if mask&bit != 0 {
          					continue
          				}
          				dp[mask|bit] = (dp[mask|bit] + dp[mask]) % M
          			}
          		}
          	}
          	return dp[full-1]
          }
        `,
        kotlin: code`
          fun numberWays(hats: Array<IntArray>): Int {
              val m = 1000000007
              val n = hats.size
              val full = 1 shl n
              val likes = Array(41) { ArrayList<Int>() }
              for (p in 0 until n) for (h in hats[p]) likes[h].add(p)
              val dp = IntArray(full)
              dp[0] = 1
              for (h in 1..40) {
                  if (likes[h].isEmpty()) continue
                  for (mask in full - 1 downTo 0) {
                      if (dp[mask] == 0) continue
                      for (p in likes[h]) {
                          val bit = 1 shl p
                          if ((mask and bit) != 0) continue
                          dp[mask or bit] = (dp[mask or bit] + dp[mask]) % m
                      }
                  }
              }
              return dp[full - 1]
          }
        `,
        swift: code`
          func numberWays(_ hats: [[Int]]) -> Int {
              let m = 1000000007
              let n = hats.count
              let full = 1 << n
              var likes = [[Int]](repeating: [], count: 41)
              for p in 0..<n {
                  for h in hats[p] { likes[h].append(p) }
              }
              var dp = [Int](repeating: 0, count: full)
              dp[0] = 1
              for h in 1...40 where !likes[h].isEmpty {
                  var mask = full - 1
                  while mask >= 0 {
                      if dp[mask] != 0 {
                          for p in likes[h] {
                              let bit = 1 << p
                              if mask & bit == 0 {
                                  dp[mask | bit] = (dp[mask | bit] + dp[mask]) % m
                              }
                          }
                      }
                      mask -= 1
                  }
              }
              return dp[full - 1]
          }
        `,
        rust: code`
          fn numberWays(hats: Vec<Vec<i32>>) -> i32 {
              let m: i64 = 1000000007;
              let n = hats.len();
              let full = 1usize << n;
              let mut likes: Vec<Vec<usize>> = vec![Vec::new(); 41];
              for p in 0..n {
                  for &h in hats[p].iter() {
                      likes[h as usize].push(p);
                  }
              }
              let mut dp = vec![0i64; full];
              dp[0] = 1;
              for h in 1..41 {
                  if likes[h].is_empty() {
                      continue;
                  }
                  for mask in (0..full).rev() {
                      if dp[mask] == 0 {
                          continue;
                      }
                      for &p in likes[h].iter() {
                          let bit = 1usize << p;
                          if mask & bit != 0 {
                              continue;
                          }
                          dp[mask | bit] = (dp[mask | bit] + dp[mask]) % m;
                      }
                  }
              }
              dp[full - 1] as i32
          }
        `,
        php: code`
          function numberWays($hats) {
              $m = 1000000007;
              $n = count($hats);
              $full = 1 << $n;
              $likes = array_fill(0, 41, []);
              for ($p = 0; $p < $n; $p++) foreach ($hats[$p] as $h) $likes[$h][] = $p;
              $dp = array_fill(0, $full, 0);
              $dp[0] = 1;
              for ($h = 1; $h <= 40; $h++) {
                  if (count($likes[$h]) == 0) continue;
                  for ($mask = $full - 1; $mask >= 0; $mask--) {
                      if ($dp[$mask] == 0) continue;
                      foreach ($likes[$h] as $p) {
                          $bit = 1 << $p;
                          if ($mask & $bit) continue;
                          $dp[$mask | $bit] = ($dp[$mask | $bit] + $dp[$mask]) % $m;
                      }
                  }
              }
              return $dp[$full - 1];
          }
        `,
        ruby: code`
          def numberWays(hats)
            mod = 1000000007
            n = hats.length
            full = 1 << n
            likes = Array.new(41) { [] }
            hats.each_with_index { |list, p| list.each { |h| likes[h] << p } }
            dp = Array.new(full, 0)
            dp[0] = 1
            (1..40).each do |h|
              people = likes[h]
              next if people.empty?
              (full - 1).downto(0) do |mask|
                ways = dp[mask]
                next if ways == 0
                people.each do |p|
                  bit = 1 << p
                  next if mask & bit != 0
                  dp[mask | bit] = (dp[mask | bit] + ways) % mod
                end
              end
            end
            dp[full - 1]
          end
        `,
      },
    };
  })(),

  // ── Parallel Courses II (LC 1494) ───────────────────────────────
  (() => {
    const ref = (n: number, relations: number[][], k: number) => {
      const pre = new Array(n).fill(0);
      for (const [a, b] of relations) pre[b - 1] |= 1 << (a - 1);
      const full = (1 << n) - 1;
      const dist = new Map<number, number>([[0, 0]]);
      let frontier = [0];
      while (frontier.length) {
        const next: number[] = [];
        for (const mask of frontier) {
          if (mask === full) return dist.get(mask)!;
          let avail = 0;
          for (let c = 0; c < n; c++) if (!(mask >> c & 1) && (pre[c] & mask) === pre[c]) avail |= 1 << c;
          // Any non-empty subset of the available courses of size at most k.
          for (let sub = avail; sub; sub = (sub - 1) & avail) {
            let cnt = 0;
            for (let x = sub; x; x >>= 1) cnt += x & 1;
            if (cnt > k) continue;
            const nm = mask | sub;
            if (!dist.has(nm)) { dist.set(nm, dist.get(mask)! + 1); next.push(nm); }
          }
        }
        frontier = next;
      }
      return dist.get(full)!;
    };
    return {
      slug: "parallel-courses-ii",
      title: "Parallel Courses II",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Bit Manipulation", "Graph", "Bitmask", "Google", "Amazon"],
      signature: {
        funcName: "minNumberOfSemesters",
        params: [{ name: "n", type: "int" as const }, { name: "relations", type: "int[][]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` courses labelled `1` to `n`. Each entry `relations[i] = [prevCourse, nextCourse]` says that `prevCourse` must be completed before `nextCourse` can be taken. The prerequisites form no cycle.\n\nIn one semester you may take **at most `k`** courses, provided every prerequisite of each of them was completed in an **earlier** semester.\n\nReturn the minimum number of semesters needed to take all the courses.",
        [
          { in: "n = 5, relations = [[1,3],[2,3],[3,4],[3,5]], k = 2", out: "3", note: "Courses 1 and 2, then 3, then 4 and 5." },
          { in: "n = 3, relations = [], k = 2", out: "2" },
          { in: "n = 4, relations = [[1,2],[2,3],[3,4]], k = 4", out: "4", note: "A chain allows only one course per semester." },
        ],
        ["1 <= n <= 15", "1 <= k <= n", "0 <= relations.length <= n * (n-1) / 2", "relations[i].length == 2", "1 <= prevCourse, nextCourse <= n", "prevCourse != nextCourse", "All pairs are distinct", "The prerequisite graph is acyclic"]),
      hints: [
        "Picking the available courses greedily (for example by how many courses depend on them) fails on some graphs — this needs an exact search.",
        "With n <= 15, the set of completed courses is a bitmask. From a mask, the courses you may take next are those whose prerequisite mask is contained in it.",
        "Let `dp[mask]` be the fewest semesters to complete `mask`. If at most `k` courses are available, take them all; otherwise try every `k`-subset of the available ones (enumerate submasks).",
      ],
      editorial: explain({
        idea: "The state is the set of finished courses, a 15-bit mask. From each state either all available courses fit into one semester, or we must choose exactly `k` of them — and trying every such choice by submask enumeration is affordable.",
        steps: [
          "Compute `pre[c]`, the mask of prerequisites of course `c`.",
          "Set `dp[0] = 0` and everything else to infinity; visit masks in increasing order.",
          "For a reachable `mask`, let `avail` be the courses outside `mask` whose `pre` is inside it.",
          "If `popcount(avail) <= k`, relax `dp[mask | avail]` with `dp[mask] + 1`. Otherwise enumerate the submasks `sub` of `avail` with exactly `k` bits and relax `dp[mask | sub]`.",
          "Return `dp[2^n - 1]`.",
        ],
        why: "Taking an available course now never hurts: it can only unlock more courses later. So when everything available fits, taking all of it is optimal, and when it does not fit, an optimal schedule fills the semester with exactly `k` available courses — all of which the enumeration tries. Transitions only add courses, so increasing numeric order handles every mask after its predecessors.",
        time: "O(3^n) in the worst case (submask enumeration)",
        space: "O(2^n)",
        pitfalls: [
          "Greedy by depth, out-degree or topological order is wrong — it was the accepted-then-broken approach for this problem.",
          "Courses are 1-indexed in `relations`; shift them to bits `0..n-1`.",
          "When more than `k` courses are available, a semester with fewer than `k` courses is never needed, so only `k`-subsets must be tried.",
        ],
      }),
      examples: [
        { input: "5\n[[1,3],[2,3],[3,4],[3,5]]\n2", expectedOutput: "3" },
        { input: "3\n[]\n2", expectedOutput: "2" },
        { input: "4\n[[1,2],[2,3],[3,4]]\n4", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 4), ri(rng, 1, 8), ri(rng, 6, 9)]);
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        const p = pick(rng, [0, 0.15, 0.3, 0.6]);
        const relations: number[][] = [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (rng() < p) relations.push([order[i], order[j]]);
        shuffle(rng, relations);
        const k = pick(rng, [1, ri(rng, 1, n), ri(rng, 1, Math.min(n, 3))]);
        return { input: `${n}\n${fmtIntMat(relations)}\n${k}`, expectedOutput: String(ref(n, relations, k)) };
      },
      hiddenCount: 2500,
      solutions: {
        python: code`
          from typing import List

          def minNumberOfSemesters(n: int, relations: List[List[int]], k: int) -> int:
              pre = [0] * n
              for a, b in relations:
                  pre[b - 1] |= 1 << (a - 1)
              full = 1 << n
              inf = float("inf")
              dp = [inf] * full
              dp[0] = 0
              for mask in range(full):
                  if dp[mask] == inf:
                      continue
                  avail = 0
                  for c in range(n):
                      if not (mask >> c) & 1 and (pre[c] & mask) == pre[c]:
                          avail |= 1 << c
                  if avail == 0:
                      continue
                  nxt = dp[mask] + 1
                  if bin(avail).count("1") <= k:
                      if nxt < dp[mask | avail]:
                          dp[mask | avail] = nxt
                  else:
                      sub = avail
                      while sub:
                          if bin(sub).count("1") == k and nxt < dp[mask | sub]:
                              dp[mask | sub] = nxt
                          sub = (sub - 1) & avail
              return dp[full - 1]
        `,
        javascript: code`
          var minNumberOfSemesters = function(n, relations, k) {
              var pre = new Array(n).fill(0);
              for (var i = 0; i < relations.length; i++) pre[relations[i][1] - 1] |= 1 << (relations[i][0] - 1);
              var full = 1 << n, INF = 1 << 30;
              var dp = new Array(full).fill(INF);
              dp[0] = 0;
              var pop = function(x) { var c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
              for (var mask = 0; mask < full; mask++) {
                  if (dp[mask] === INF) continue;
                  var avail = 0;
                  for (var c = 0; c < n; c++) {
                      if (!(mask & (1 << c)) && (pre[c] & mask) === pre[c]) avail |= 1 << c;
                  }
                  if (avail === 0) continue;
                  var nxt = dp[mask] + 1;
                  if (pop(avail) <= k) {
                      if (nxt < dp[mask | avail]) dp[mask | avail] = nxt;
                  } else {
                      for (var sub = avail; sub; sub = (sub - 1) & avail) {
                          if (pop(sub) === k && nxt < dp[mask | sub]) dp[mask | sub] = nxt;
                      }
                  }
              }
              return dp[full - 1];
          };
        `,
        typescript: code`
          function minNumberOfSemesters(n: number, relations: number[][], k: number): number {
              var pre: number[] = [];
              for (var z = 0; z < n; z++) pre.push(0);
              for (var i = 0; i < relations.length; i++) pre[relations[i][1] - 1] |= 1 << (relations[i][0] - 1);
              var full = 1 << n, INF = 1 << 30;
              var dp: number[] = [];
              for (var y = 0; y < full; y++) dp.push(INF);
              dp[0] = 0;
              var pop = function(x: number): number { var c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
              for (var mask = 0; mask < full; mask++) {
                  if (dp[mask] === INF) continue;
                  var avail = 0;
                  for (var c = 0; c < n; c++) {
                      if (!(mask & (1 << c)) && (pre[c] & mask) === pre[c]) avail |= 1 << c;
                  }
                  if (avail === 0) continue;
                  var nxt = dp[mask] + 1;
                  if (pop(avail) <= k) {
                      if (nxt < dp[mask | avail]) dp[mask | avail] = nxt;
                  } else {
                      for (var sub = avail; sub; sub = (sub - 1) & avail) {
                          if (pop(sub) === k && nxt < dp[mask | sub]) dp[mask | sub] = nxt;
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        java: code`
          public static int minNumberOfSemesters(int n, int[][] relations, int k) {
              int[] pre = new int[n];
              for (int[] r : relations) pre[r[1] - 1] |= 1 << (r[0] - 1);
              int full = 1 << n, INF = 1 << 30;
              int[] dp = new int[full];
              Arrays.fill(dp, INF);
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int avail = 0;
                  for (int c = 0; c < n; c++) {
                      if ((mask & (1 << c)) == 0 && (pre[c] & mask) == pre[c]) avail |= 1 << c;
                  }
                  if (avail == 0) continue;
                  int nxt = dp[mask] + 1;
                  if (Integer.bitCount(avail) <= k) {
                      dp[mask | avail] = Math.min(dp[mask | avail], nxt);
                  } else {
                      for (int sub = avail; sub != 0; sub = (sub - 1) & avail) {
                          if (Integer.bitCount(sub) == k) dp[mask | sub] = Math.min(dp[mask | sub], nxt);
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        cpp: code`
          int minNumberOfSemesters(int n, vector<vector<int>>& relations, int k) {
              vector<int> pre(n, 0);
              for (auto& r : relations) pre[r[1] - 1] |= 1 << (r[0] - 1);
              int full = 1 << n, INF = 1 << 30;
              vector<int> dp(full, INF);
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int avail = 0;
                  for (int c = 0; c < n; c++) {
                      if (!(mask & (1 << c)) && (pre[c] & mask) == pre[c]) avail |= 1 << c;
                  }
                  if (avail == 0) continue;
                  int nxt = dp[mask] + 1;
                  if (__builtin_popcount(avail) <= k) {
                      dp[mask | avail] = min(dp[mask | avail], nxt);
                  } else {
                      for (int sub = avail; sub; sub = (sub - 1) & avail) {
                          if (__builtin_popcount(sub) == k) dp[mask | sub] = min(dp[mask | sub], nxt);
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        c: code`
          static int pc2Pop(int x) {
              int c = 0;
              while (x) { c += x & 1; x >>= 1; }
              return c;
          }

          int minNumberOfSemesters(int n, int** relations, int relationsSize, int* relationsColSize, int k) {
              int pre[15];
              for (int c = 0; c < n; c++) pre[c] = 0;
              for (int i = 0; i < relationsSize; i++) pre[relations[i][1] - 1] |= 1 << (relations[i][0] - 1);
              int full = 1 << n, INF = 1 << 30;
              int* dp = (int*) malloc(full * sizeof(int));
              for (int mask = 0; mask < full; mask++) dp[mask] = INF;
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int avail = 0;
                  for (int c = 0; c < n; c++) {
                      if (!(mask & (1 << c)) && (pre[c] & mask) == pre[c]) avail |= 1 << c;
                  }
                  if (avail == 0) continue;
                  int nxt = dp[mask] + 1;
                  if (pc2Pop(avail) <= k) {
                      if (nxt < dp[mask | avail]) dp[mask | avail] = nxt;
                  } else {
                      for (int sub = avail; sub; sub = (sub - 1) & avail) {
                          if (pc2Pop(sub) == k && nxt < dp[mask | sub]) dp[mask | sub] = nxt;
                      }
                  }
              }
              int ans = dp[full - 1];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MinNumberOfSemesters(int n, int[][] relations, int k)
          {
              int[] pre = new int[n];
              foreach (int[] r in relations) pre[r[1] - 1] |= 1 << (r[0] - 1);
              int full = 1 << n, INF = 1 << 30;
              int[] dp = new int[full];
              for (int mask = 0; mask < full; mask++) dp[mask] = INF;
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++)
              {
                  if (dp[mask] == INF) continue;
                  int avail = 0;
                  for (int c = 0; c < n; c++)
                  {
                      if ((mask & (1 << c)) == 0 && (pre[c] & mask) == pre[c]) avail |= 1 << c;
                  }
                  if (avail == 0) continue;
                  int nxt = dp[mask] + 1;
                  if (Pc2Pop(avail) <= k)
                  {
                      dp[mask | avail] = Math.Min(dp[mask | avail], nxt);
                  }
                  else
                  {
                      for (int sub = avail; sub != 0; sub = (sub - 1) & avail)
                      {
                          if (Pc2Pop(sub) == k) dp[mask | sub] = Math.Min(dp[mask | sub], nxt);
                      }
                  }
              }
              return dp[full - 1];
          }

          static int Pc2Pop(int x)
          {
              int c = 0;
              while (x != 0) { c += x & 1; x >>= 1; }
              return c;
          }
        `,
        go: code`
          func pc2Pop(x int) int {
          	c := 0
          	for ; x > 0; x >>= 1 {
          		c += x & 1
          	}
          	return c
          }

          func minNumberOfSemesters(n int, relations [][]int, k int) int {
          	pre := make([]int, n)
          	for _, r := range relations {
          		pre[r[1]-1] |= 1 << uint(r[0]-1)
          	}
          	full := 1 << uint(n)
          	inf := 1 << 30
          	dp := make([]int, full)
          	for mask := range dp {
          		dp[mask] = inf
          	}
          	dp[0] = 0
          	for mask := 0; mask < full; mask++ {
          		if dp[mask] == inf {
          			continue
          		}
          		avail := 0
          		for c := 0; c < n; c++ {
          			if mask&(1<<uint(c)) == 0 && pre[c]&mask == pre[c] {
          				avail |= 1 << uint(c)
          			}
          		}
          		if avail == 0 {
          			continue
          		}
          		nxt := dp[mask] + 1
          		if pc2Pop(avail) <= k {
          			if nxt < dp[mask|avail] {
          				dp[mask|avail] = nxt
          			}
          		} else {
          			for sub := avail; sub > 0; sub = (sub - 1) & avail {
          				if pc2Pop(sub) == k && nxt < dp[mask|sub] {
          					dp[mask|sub] = nxt
          				}
          			}
          		}
          	}
          	return dp[full-1]
          }
        `,
        kotlin: code`
          fun minNumberOfSemesters(n: Int, relations: Array<IntArray>, k: Int): Int {
              val pre = IntArray(n)
              for (r in relations) pre[r[1] - 1] = pre[r[1] - 1] or (1 shl (r[0] - 1))
              val full = 1 shl n
              val inf = 1 shl 30
              val dp = IntArray(full) { inf }
              dp[0] = 0
              for (mask in 0 until full) {
                  if (dp[mask] == inf) continue
                  var avail = 0
                  for (c in 0 until n) {
                      if ((mask and (1 shl c)) == 0 && (pre[c] and mask) == pre[c]) avail = avail or (1 shl c)
                  }
                  if (avail == 0) continue
                  val nxt = dp[mask] + 1
                  if (Integer.bitCount(avail) <= k) {
                      if (nxt < dp[mask or avail]) dp[mask or avail] = nxt
                  } else {
                      var sub = avail
                      while (sub != 0) {
                          if (Integer.bitCount(sub) == k && nxt < dp[mask or sub]) dp[mask or sub] = nxt
                          sub = (sub - 1) and avail
                      }
                  }
              }
              return dp[full - 1]
          }
        `,
        swift: code`
          func minNumberOfSemesters(_ n: Int, _ relations: [[Int]], _ k: Int) -> Int {
              var pre = [Int](repeating: 0, count: n)
              for r in relations { pre[r[1] - 1] |= 1 << (r[0] - 1) }
              let full = 1 << n
              let inf = 1 << 30
              var dp = [Int](repeating: inf, count: full)
              dp[0] = 0
              for mask in 0..<full where dp[mask] != inf {
                  var avail = 0
                  for c in 0..<n where mask & (1 << c) == 0 && pre[c] & mask == pre[c] {
                      avail |= 1 << c
                  }
                  if avail == 0 { continue }
                  let nxt = dp[mask] + 1
                  if avail.nonzeroBitCount <= k {
                      if nxt < dp[mask | avail] { dp[mask | avail] = nxt }
                  } else {
                      var sub = avail
                      while sub != 0 {
                          if sub.nonzeroBitCount == k && nxt < dp[mask | sub] { dp[mask | sub] = nxt }
                          sub = (sub - 1) & avail
                      }
                  }
              }
              return dp[full - 1]
          }
        `,
        rust: code`
          fn minNumberOfSemesters(n: i32, relations: Vec<Vec<i32>>, k: i32) -> i32 {
              let n = n as usize;
              let mut pre = vec![0usize; n];
              for r in relations.iter() {
                  pre[(r[1] - 1) as usize] |= 1 << ((r[0] - 1) as usize);
              }
              let full = 1usize << n;
              let inf = 1i32 << 30;
              let mut dp = vec![inf; full];
              dp[0] = 0;
              for mask in 0..full {
                  if dp[mask] == inf {
                      continue;
                  }
                  let mut avail = 0usize;
                  for c in 0..n {
                      if mask & (1 << c) == 0 && pre[c] & mask == pre[c] {
                          avail |= 1 << c;
                      }
                  }
                  if avail == 0 {
                      continue;
                  }
                  let nxt = dp[mask] + 1;
                  if (avail.count_ones() as i32) <= k {
                      if nxt < dp[mask | avail] {
                          dp[mask | avail] = nxt;
                      }
                  } else {
                      let mut sub = avail;
                      while sub != 0 {
                          if sub.count_ones() as i32 == k && nxt < dp[mask | sub] {
                              dp[mask | sub] = nxt;
                          }
                          sub = (sub - 1) & avail;
                      }
                  }
              }
              dp[full - 1]
          }
        `,
        php: code`
          function pc2Pop($x) {
              $c = 0;
              while ($x > 0) { $c += $x & 1; $x >>= 1; }
              return $c;
          }

          function minNumberOfSemesters($n, $relations, $k) {
              $pre = array_fill(0, $n, 0);
              foreach ($relations as $r) $pre[$r[1] - 1] |= 1 << ($r[0] - 1);
              $full = 1 << $n;
              $inf = 1 << 30;
              $dp = array_fill(0, $full, $inf);
              $dp[0] = 0;
              for ($mask = 0; $mask < $full; $mask++) {
                  if ($dp[$mask] == $inf) continue;
                  $avail = 0;
                  for ($c = 0; $c < $n; $c++) {
                      if (!($mask & (1 << $c)) && ($pre[$c] & $mask) == $pre[$c]) $avail |= 1 << $c;
                  }
                  if ($avail == 0) continue;
                  $nxt = $dp[$mask] + 1;
                  if (pc2Pop($avail) <= $k) {
                      if ($nxt < $dp[$mask | $avail]) $dp[$mask | $avail] = $nxt;
                  } else {
                      for ($sub = $avail; $sub; $sub = ($sub - 1) & $avail) {
                          if (pc2Pop($sub) == $k && $nxt < $dp[$mask | $sub]) $dp[$mask | $sub] = $nxt;
                      }
                  }
              }
              return $dp[$full - 1];
          }
        `,
        ruby: code`
          def minNumberOfSemesters(n, relations, k)
            pre = Array.new(n, 0)
            relations.each { |a, b| pre[b - 1] |= 1 << (a - 1) }
            full = 1 << n
            inf = 1 << 30
            dp = Array.new(full, inf)
            dp[0] = 0
            full.times do |mask|
              next if dp[mask] == inf
              avail = 0
              n.times do |c|
                avail |= 1 << c if (mask >> c) & 1 == 0 && (pre[c] & mask) == pre[c]
              end
              next if avail == 0
              nxt = dp[mask] + 1
              if avail.to_s(2).count("1") <= k
                dp[mask | avail] = nxt if nxt < dp[mask | avail]
              else
                sub = avail
                while sub != 0
                  dp[mask | sub] = nxt if sub.to_s(2).count("1") == k && nxt < dp[mask | sub]
                  sub = (sub - 1) & avail
                end
              end
            end
            dp[full - 1]
          end
        `,
      },
    };
  })(),

  // ── Beautiful Arrangement (LC 526) ──────────────────────────────
  (() => {
    const ref = (n: number) => {
      const used = new Array(n + 1).fill(false);
      const rec = (pos: number): number => {
        if (pos > n) return 1;
        let c = 0;
        for (let v = 1; v <= n; v++) {
          if (used[v] || (v % pos !== 0 && pos % v !== 0)) continue;
          used[v] = true; c += rec(pos + 1); used[v] = false;
        }
        return c;
      };
      return rec(1);
    };
    return {
      slug: "beautiful-arrangement",
      title: "Beautiful Arrangement",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Backtracking", "Bit Manipulation", "Bitmask", "Google", "Amazon"],
      signature: { funcName: "countArrangement", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Take a permutation `perm` of the integers `1` to `n`, indexed from 1. It is a **beautiful arrangement** if, for every position `i` (`1 <= i <= n`), either `perm[i]` is divisible by `i` or `i` is divisible by `perm[i]`.\n\nGiven `n`, return the number of beautiful arrangements.",
        [
          { in: "n = 3", out: "3", note: "`[1,2,3]`, `[2,1,3]` and `[3,2,1]`. In `[1,3,2]`, position 2 holds 3, and neither divides the other." },
          { in: "n = 4", out: "8" },
          { in: "n = 6", out: "36" },
        ],
        ["1 <= n <= 15"]),
      hints: [
        "Fill the positions one at a time and only place a number that is compatible with its position — most branches die early.",
        "The only thing that matters for the remaining positions is which numbers are already used: a 15-bit mask.",
        "Let `dp[mask]` count the ways to fill positions `1..popcount(mask)` with exactly the numbers in `mask`; extend it by placing each compatible unused number at position `popcount(mask) + 1`.",
      ],
      editorial: explain({
        idea: "Positions are filled in order, so the next position is determined by how many numbers are used; the state is just the set of used numbers, and a DP over the 2^n subsets counts all valid permutations.",
        steps: [
          "Set `dp[0] = 1`.",
          "For each `mask` with `dp[mask] > 0`, let `pos = popcount(mask) + 1`.",
          "For each number `v` not in `mask` with `v % pos == 0` or `pos % v == 0`, add `dp[mask]` to `dp[mask | bit(v)]`.",
          "Return `dp[2^n - 1]`.",
        ],
        why: "Every beautiful arrangement corresponds to exactly one sequence of placements (position 1, then 2, …), and each prefix of that sequence is a used-set mask whose count includes it. Whether the rest can be completed depends only on the used set, so merging all prefixes with the same mask counts each arrangement exactly once.",
        time: "O(n · 2^n)",
        space: "O(2^n)",
        pitfalls: [
          "Positions are 1-indexed; with 0-indexing the divisibility test breaks (everything divides 0).",
          "Either direction of divisibility is enough.",
          "Generating all n! permutations and filtering is far too slow for n = 15.",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "3" },
        { input: "4", expectedOutput: "8" },
        { input: "6", expectedOutput: "36" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 10), ri(rng, 1, 12), ri(rng, 1, 15)]);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      hiddenCount: 100,
      solutions: {
        python: code`
          def countArrangement(n: int) -> int:
              full = 1 << n
              dp = [0] * full
              dp[0] = 1
              for mask in range(full):
                  ways = dp[mask]
                  if not ways:
                      continue
                  pos = bin(mask).count("1") + 1
                  for v in range(1, n + 1):
                      bit = 1 << (v - 1)
                      if mask & bit:
                          continue
                      if v % pos == 0 or pos % v == 0:
                          dp[mask | bit] += ways
              return dp[full - 1]
        `,
        javascript: code`
          var countArrangement = function(n) {
              var full = 1 << n, dp = new Array(full).fill(0);
              dp[0] = 1;
              for (var mask = 0; mask < full; mask++) {
                  if (!dp[mask]) continue;
                  var pos = 1;
                  for (var x = mask; x; x >>= 1) pos += x & 1;
                  for (var v = 1; v <= n; v++) {
                      var bit = 1 << (v - 1);
                      if (mask & bit) continue;
                      if (v % pos === 0 || pos % v === 0) dp[mask | bit] += dp[mask];
                  }
              }
              return dp[full - 1];
          };
        `,
        typescript: code`
          function countArrangement(n: number): number {
              var full = 1 << n;
              var dp: number[] = [];
              for (var z = 0; z < full; z++) dp.push(0);
              dp[0] = 1;
              for (var mask = 0; mask < full; mask++) {
                  if (!dp[mask]) continue;
                  var pos = 1;
                  for (var x = mask; x; x >>= 1) pos += x & 1;
                  for (var v = 1; v <= n; v++) {
                      var bit = 1 << (v - 1);
                      if (mask & bit) continue;
                      if (v % pos === 0 || pos % v === 0) dp[mask | bit] += dp[mask];
                  }
              }
              return dp[full - 1];
          }
        `,
        java: code`
          public static int countArrangement(int n) {
              int full = 1 << n;
              int[] dp = new int[full];
              dp[0] = 1;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == 0) continue;
                  int pos = Integer.bitCount(mask) + 1;
                  for (int v = 1; v <= n; v++) {
                      int bit = 1 << (v - 1);
                      if ((mask & bit) != 0) continue;
                      if (v % pos == 0 || pos % v == 0) dp[mask | bit] += dp[mask];
                  }
              }
              return dp[full - 1];
          }
        `,
        cpp: code`
          int countArrangement(int n) {
              int full = 1 << n;
              vector<int> dp(full, 0);
              dp[0] = 1;
              for (int mask = 0; mask < full; mask++) {
                  if (!dp[mask]) continue;
                  int pos = __builtin_popcount(mask) + 1;
                  for (int v = 1; v <= n; v++) {
                      int bit = 1 << (v - 1);
                      if (mask & bit) continue;
                      if (v % pos == 0 || pos % v == 0) dp[mask | bit] += dp[mask];
                  }
              }
              return dp[full - 1];
          }
        `,
        c: code`
          int countArrangement(int n) {
              int full = 1 << n;
              int* dp = (int*) calloc(full, sizeof(int));
              dp[0] = 1;
              for (int mask = 0; mask < full; mask++) {
                  if (!dp[mask]) continue;
                  int pos = 1;
                  for (int x = mask; x; x >>= 1) pos += x & 1;
                  for (int v = 1; v <= n; v++) {
                      int bit = 1 << (v - 1);
                      if (mask & bit) continue;
                      if (v % pos == 0 || pos % v == 0) dp[mask | bit] += dp[mask];
                  }
              }
              int ans = dp[full - 1];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int CountArrangement(int n)
          {
              int full = 1 << n;
              int[] dp = new int[full];
              dp[0] = 1;
              for (int mask = 0; mask < full; mask++)
              {
                  if (dp[mask] == 0) continue;
                  int pos = 1;
                  for (int x = mask; x != 0; x >>= 1) pos += x & 1;
                  for (int v = 1; v <= n; v++)
                  {
                      int bit = 1 << (v - 1);
                      if ((mask & bit) != 0) continue;
                      if (v % pos == 0 || pos % v == 0) dp[mask | bit] += dp[mask];
                  }
              }
              return dp[full - 1];
          }
        `,
        go: code`
          func countArrangement(n int) int {
          	full := 1 << uint(n)
          	dp := make([]int, full)
          	dp[0] = 1
          	for mask := 0; mask < full; mask++ {
          		if dp[mask] == 0 {
          			continue
          		}
          		pos := 1
          		for x := mask; x > 0; x >>= 1 {
          			pos += x & 1
          		}
          		for v := 1; v <= n; v++ {
          			bit := 1 << uint(v-1)
          			if mask&bit != 0 {
          				continue
          			}
          			if v%pos == 0 || pos%v == 0 {
          				dp[mask|bit] += dp[mask]
          			}
          		}
          	}
          	return dp[full-1]
          }
        `,
        kotlin: code`
          fun countArrangement(n: Int): Int {
              val full = 1 shl n
              val dp = IntArray(full)
              dp[0] = 1
              for (mask in 0 until full) {
                  if (dp[mask] == 0) continue
                  val pos = Integer.bitCount(mask) + 1
                  for (v in 1..n) {
                      val bit = 1 shl (v - 1)
                      if ((mask and bit) != 0) continue
                      if (v % pos == 0 || pos % v == 0) dp[mask or bit] += dp[mask]
                  }
              }
              return dp[full - 1]
          }
        `,
        swift: code`
          func countArrangement(_ n: Int) -> Int {
              let full = 1 << n
              var dp = [Int](repeating: 0, count: full)
              dp[0] = 1
              for mask in 0..<full where dp[mask] != 0 {
                  let pos = mask.nonzeroBitCount + 1
                  for v in 1...n {
                      let bit = 1 << (v - 1)
                      if mask & bit != 0 { continue }
                      if v % pos == 0 || pos % v == 0 { dp[mask | bit] += dp[mask] }
                  }
              }
              return dp[full - 1]
          }
        `,
        rust: code`
          fn countArrangement(n: i32) -> i32 {
              let n = n as usize;
              let full = 1usize << n;
              let mut dp = vec![0i32; full];
              dp[0] = 1;
              for mask in 0..full {
                  if dp[mask] == 0 {
                      continue;
                  }
                  let pos = (mask as u32).count_ones() as usize + 1;
                  for v in 1..(n + 1) {
                      let bit = 1usize << (v - 1);
                      if mask & bit != 0 {
                          continue;
                      }
                      if v % pos == 0 || pos % v == 0 {
                          dp[mask | bit] += dp[mask];
                      }
                  }
              }
              dp[full - 1]
          }
        `,
        php: code`
          function countArrangement($n) {
              $full = 1 << $n;
              $dp = array_fill(0, $full, 0);
              $dp[0] = 1;
              for ($mask = 0; $mask < $full; $mask++) {
                  $ways = $dp[$mask];
                  if ($ways == 0) continue;
                  $pos = 1;
                  for ($x = $mask; $x > 0; $x >>= 1) $pos += $x & 1;
                  for ($v = 1; $v <= $n; $v++) {
                      $bit = 1 << ($v - 1);
                      if ($mask & $bit) continue;
                      if ($v % $pos == 0 || $pos % $v == 0) $dp[$mask | $bit] += $ways;
                  }
              }
              return $dp[$full - 1];
          }
        `,
        ruby: code`
          def countArrangement(n)
            full = 1 << n
            dp = Array.new(full, 0)
            dp[0] = 1
            full.times do |mask|
              ways = dp[mask]
              next if ways == 0
              pos = mask.to_s(2).count("1") + 1
              (1..n).each do |v|
                bit = 1 << (v - 1)
                next if mask & bit != 0
                dp[mask | bit] += ways if v % pos == 0 || pos % v == 0
              end
            end
            dp[full - 1]
          end
        `,
      },
    };
  })(),

  // ── Special Permutations (LC 2741) ──────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const used = new Array(n).fill(false);
      const rec = (depth: number, last: number): number => {
        if (depth === n) return 1;
        let c = 0;
        for (let i = 0; i < n; i++) {
          if (used[i]) continue;
          if (last >= 0 && nums[last] % nums[i] !== 0 && nums[i] % nums[last] !== 0) continue;
          used[i] = true; c += rec(depth + 1, i); used[i] = false;
        }
        return c;
      };
      return rec(0, -1) % MOD;
    };
    return {
      slug: "special-permutations",
      title: "Special Permutations",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Bitmask", "Amazon", "Google"],
      signature: { funcName: "specialPerm", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of `n` **distinct** positive integers. A permutation of `nums` is **special** if every pair of neighbours divides one way or the other: for all `0 <= i < n - 1`, either `nums[i] % nums[i+1] == 0` or `nums[i+1] % nums[i] == 0`.\n\nReturn the number of special permutations modulo `10^9 + 7`.",
        [
          { in: "nums = [4,2,8]", out: "6", note: "Every pair divides, so all 3! orders are special." },
          { in: "nums = [3,5]", out: "0" },
          { in: "nums = [1,6,3,5]", out: "4", note: "5 only pairs with 1, so it sits at an end next to 1: [5,1,6,3], [5,1,3,6] and their reverses." },
        ],
        ["2 <= nums.length <= 14", "1 <= nums[i] <= 10^9", "All values in nums are distinct"]),
      hints: [
        "Build the permutation left to right. What do you need to know about the part already built to decide what may come next?",
        "Only the set of used elements and the last element matter.",
        "Let `dp[mask][last]` count the orderings of the elements in `mask` that end with `last`; extend with any unused `j` that divides or is divided by `nums[last]`.",
      ],
      editorial: explain({
        idea: "A special permutation is a Hamiltonian path in the \"divides\" graph; counting them is the classic bitmask DP over (used set, last element).",
        steps: [
          "Precompute `ok[i][j]` = `nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0`.",
          "Set `dp[1 << i][i] = 1` for every `i`.",
          "For each `mask` in increasing order and each `last` with `dp[mask][last] > 0`, add it to `dp[mask | 1<<j][j]` for every `j` not in `mask` with `ok[last][j]`, modulo `10^9 + 7`.",
          "Return the sum of `dp[2^n - 1][last]` over all `last`.",
        ],
        why: "The validity of the next element depends only on the previous one, and the elements still available depend only on the used set, so `(mask, last)` captures everything needed to continue. Each special permutation is counted along its unique sequence of prefixes, ending in the full mask with its own last element.",
        time: "O(n² · 2^n)",
        space: "O(n · 2^n)",
        pitfalls: [
          "Check divisibility in both directions.",
          "Start every element as a possible first element — `dp[1<<i][i] = 1`, not only index 0.",
          "Take the modulus while adding; with 14 elements the counts can exceed 32 bits.",
        ],
      }),
      examples: [
        { input: "[4,2,8]", expectedOutput: "6" },
        { input: "[3,5]", expectedOutput: "0" },
        { input: "[1,6,3,5]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, ri(rng, 2, 5), ri(rng, 2, 8)]);
        const mode = ri(rng, 0, 2);
        const seen = new Set<number>();
        const nums: number[] = [];
        while (nums.length < n) {
          let v: number;
          if (mode === 0) v = ri(rng, 1, pick(rng, [12, 48]));
          else if (mode === 1) v = (2 ** ri(rng, 0, 6)) * (3 ** ri(rng, 0, 3));
          else v = (2 ** ri(rng, 0, 9)) * (3 ** ri(rng, 0, 5)) * pick(rng, [1, 5, 7, 1000]);
          if (v > 1000000000 || seen.has(v)) continue;
          seen.add(v);
          nums.push(v);
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      hiddenCount: 2500,
      solutions: {
        python: code`
          from typing import List

          def specialPerm(nums: List[int]) -> int:
              mod = 1000000007
              n = len(nums)
              full = 1 << n
              ok = [[i != j and (nums[i] % nums[j] == 0 or nums[j] % nums[i] == 0) for j in range(n)] for i in range(n)]
              dp = [[0] * n for _ in range(full)]
              for i in range(n):
                  dp[1 << i][i] = 1
              for mask in range(1, full):
                  row = dp[mask]
                  for last in range(n):
                      w = row[last]
                      if not w:
                          continue
                      for j in range(n):
                          if (mask >> j) & 1 or not ok[last][j]:
                              continue
                          nm = mask | (1 << j)
                          dp[nm][j] = (dp[nm][j] + w) % mod
              return sum(dp[full - 1]) % mod
        `,
        javascript: code`
          var specialPerm = function(nums) {
              var M = 1000000007, n = nums.length, full = 1 << n;
              var ok = [];
              for (var i = 0; i < n; i++) {
                  ok.push([]);
                  for (var j = 0; j < n; j++) ok[i].push(i !== j && (nums[i] % nums[j] === 0 || nums[j] % nums[i] === 0));
              }
              var dp = new Array(full * n).fill(0);
              for (var s = 0; s < n; s++) dp[(1 << s) * n + s] = 1;
              for (var mask = 1; mask < full; mask++) {
                  for (var last = 0; last < n; last++) {
                      var w = dp[mask * n + last];
                      if (!w) continue;
                      for (var nx = 0; nx < n; nx++) {
                          if (((mask >> nx) & 1) || !ok[last][nx]) continue;
                          var at = (mask | (1 << nx)) * n + nx;
                          dp[at] = (dp[at] + w) % M;
                      }
                  }
              }
              var total = 0;
              for (var e = 0; e < n; e++) total = (total + dp[(full - 1) * n + e]) % M;
              return total;
          };
        `,
        typescript: code`
          function specialPerm(nums: number[]): number {
              var M = 1000000007, n = nums.length, full = 1 << n;
              var ok: boolean[][] = [];
              for (var i = 0; i < n; i++) {
                  ok.push([]);
                  for (var j = 0; j < n; j++) ok[i].push(i !== j && (nums[i] % nums[j] === 0 || nums[j] % nums[i] === 0));
              }
              var dp: number[] = [];
              for (var z = 0; z < full * n; z++) dp.push(0);
              for (var s = 0; s < n; s++) dp[(1 << s) * n + s] = 1;
              for (var mask = 1; mask < full; mask++) {
                  for (var last = 0; last < n; last++) {
                      var w = dp[mask * n + last];
                      if (!w) continue;
                      for (var nx = 0; nx < n; nx++) {
                          if (((mask >> nx) & 1) || !ok[last][nx]) continue;
                          var at = (mask | (1 << nx)) * n + nx;
                          dp[at] = (dp[at] + w) % M;
                      }
                  }
              }
              var total = 0;
              for (var e = 0; e < n; e++) total = (total + dp[(full - 1) * n + e]) % M;
              return total;
          }
        `,
        java: code`
          public static int specialPerm(int[] nums) {
              final int M = 1000000007;
              int n = nums.length, full = 1 << n;
              boolean[][] ok = new boolean[n][n];
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) ok[i][j] = i != j && (nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0);
              }
              int[][] dp = new int[full][n];
              for (int i = 0; i < n; i++) dp[1 << i][i] = 1;
              for (int mask = 1; mask < full; mask++) {
                  for (int last = 0; last < n; last++) {
                      int w = dp[mask][last];
                      if (w == 0) continue;
                      for (int j = 0; j < n; j++) {
                          if (((mask >> j) & 1) == 1 || !ok[last][j]) continue;
                          int nm = mask | (1 << j);
                          dp[nm][j] = (dp[nm][j] + w) % M;
                      }
                  }
              }
              int total = 0;
              for (int e = 0; e < n; e++) total = (total + dp[full - 1][e]) % M;
              return total;
          }
        `,
        cpp: code`
          int specialPerm(vector<int>& nums) {
              const int M = 1000000007;
              int n = nums.size(), full = 1 << n;
              vector<vector<bool>> ok(n, vector<bool>(n, false));
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) ok[i][j] = i != j && (nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0);
              }
              vector<vector<int>> dp(full, vector<int>(n, 0));
              for (int i = 0; i < n; i++) dp[1 << i][i] = 1;
              for (int mask = 1; mask < full; mask++) {
                  for (int last = 0; last < n; last++) {
                      int w = dp[mask][last];
                      if (!w) continue;
                      for (int j = 0; j < n; j++) {
                          if (((mask >> j) & 1) || !ok[last][j]) continue;
                          int nm = mask | (1 << j);
                          dp[nm][j] = (dp[nm][j] + w) % M;
                      }
                  }
              }
              int total = 0;
              for (int e = 0; e < n; e++) total = (total + dp[full - 1][e]) % M;
              return total;
          }
        `,
        c: code`
          int specialPerm(int* nums, int numsSize) {
              const int M = 1000000007;
              int n = numsSize, full = 1 << n;
              int ok[14][14];
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) ok[i][j] = i != j && (nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0);
              }
              int* dp = (int*) calloc((size_t) full * n, sizeof(int));
              for (int i = 0; i < n; i++) dp[(1 << i) * n + i] = 1;
              for (int mask = 1; mask < full; mask++) {
                  for (int last = 0; last < n; last++) {
                      int w = dp[mask * n + last];
                      if (!w) continue;
                      for (int j = 0; j < n; j++) {
                          if (((mask >> j) & 1) || !ok[last][j]) continue;
                          int at = (mask | (1 << j)) * n + j;
                          dp[at] = (dp[at] + w) % M;
                      }
                  }
              }
              int total = 0;
              for (int e = 0; e < n; e++) total = (total + dp[(full - 1) * n + e]) % M;
              free(dp);
              return total;
          }
        `,
        csharp: code`
          public static int SpecialPerm(int[] nums)
          {
              const int M = 1000000007;
              int n = nums.Length, full = 1 << n;
              bool[,] ok = new bool[n, n];
              for (int i = 0; i < n; i++)
              {
                  for (int j = 0; j < n; j++) ok[i, j] = i != j && (nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0);
              }
              int[,] dp = new int[full, n];
              for (int i = 0; i < n; i++) dp[1 << i, i] = 1;
              for (int mask = 1; mask < full; mask++)
              {
                  for (int last = 0; last < n; last++)
                  {
                      int w = dp[mask, last];
                      if (w == 0) continue;
                      for (int j = 0; j < n; j++)
                      {
                          if (((mask >> j) & 1) == 1 || !ok[last, j]) continue;
                          int nm = mask | (1 << j);
                          dp[nm, j] = (dp[nm, j] + w) % M;
                      }
                  }
              }
              int total = 0;
              for (int e = 0; e < n; e++) total = (total + dp[full - 1, e]) % M;
              return total;
          }
        `,
        go: code`
          func specialPerm(nums []int) int {
          	const M = 1000000007
          	n := len(nums)
          	full := 1 << uint(n)
          	ok := make([][]bool, n)
          	for i := 0; i < n; i++ {
          		ok[i] = make([]bool, n)
          		for j := 0; j < n; j++ {
          			ok[i][j] = i != j && (nums[i]%nums[j] == 0 || nums[j]%nums[i] == 0)
          		}
          	}
          	dp := make([]int, full*n)
          	for i := 0; i < n; i++ {
          		dp[(1<<uint(i))*n+i] = 1
          	}
          	for mask := 1; mask < full; mask++ {
          		for last := 0; last < n; last++ {
          			w := dp[mask*n+last]
          			if w == 0 {
          				continue
          			}
          			for j := 0; j < n; j++ {
          				if (mask>>uint(j))&1 == 1 || !ok[last][j] {
          					continue
          				}
          				at := (mask|(1<<uint(j)))*n + j
          				dp[at] = (dp[at] + w) % M
          			}
          		}
          	}
          	total := 0
          	for e := 0; e < n; e++ {
          		total = (total + dp[(full-1)*n+e]) % M
          	}
          	return total
          }
        `,
        kotlin: code`
          fun specialPerm(nums: IntArray): Int {
              val m = 1000000007
              val n = nums.size
              val full = 1 shl n
              val ok = Array(n) { i -> BooleanArray(n) { j -> i != j && (nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0) } }
              val dp = Array(full) { IntArray(n) }
              for (i in 0 until n) dp[1 shl i][i] = 1
              for (mask in 1 until full) {
                  for (last in 0 until n) {
                      val w = dp[mask][last]
                      if (w == 0) continue
                      for (j in 0 until n) {
                          if (((mask shr j) and 1) == 1 || !ok[last][j]) continue
                          val nm = mask or (1 shl j)
                          dp[nm][j] = (dp[nm][j] + w) % m
                      }
                  }
              }
              var total = 0
              for (e in 0 until n) total = (total + dp[full - 1][e]) % m
              return total
          }
        `,
        swift: code`
          func specialPerm(_ nums: [Int]) -> Int {
              let m = 1000000007
              let n = nums.count
              let full = 1 << n
              var ok = [[Bool]](repeating: [Bool](repeating: false, count: n), count: n)
              for i in 0..<n {
                  for j in 0..<n where i != j {
                      ok[i][j] = nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0
                  }
              }
              var dp = [Int](repeating: 0, count: full * n)
              for i in 0..<n { dp[(1 << i) * n + i] = 1 }
              for mask in 1..<full {
                  for last in 0..<n {
                      let w = dp[mask * n + last]
                      if w == 0 { continue }
                      for j in 0..<n where (mask >> j) & 1 == 0 && ok[last][j] {
                          let at = (mask | (1 << j)) * n + j
                          dp[at] = (dp[at] + w) % m
                      }
                  }
              }
              var total = 0
              for e in 0..<n { total = (total + dp[(full - 1) * n + e]) % m }
              return total
          }
        `,
        rust: code`
          fn specialPerm(nums: Vec<i32>) -> i32 {
              let m: i64 = 1000000007;
              let n = nums.len();
              let full = 1usize << n;
              let mut ok = vec![vec![false; n]; n];
              for i in 0..n {
                  for j in 0..n {
                      ok[i][j] = i != j && (nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0);
                  }
              }
              let mut dp = vec![0i64; full * n];
              for i in 0..n {
                  dp[(1 << i) * n + i] = 1;
              }
              for mask in 1..full {
                  for last in 0..n {
                      let w = dp[mask * n + last];
                      if w == 0 {
                          continue;
                      }
                      for j in 0..n {
                          if (mask >> j) & 1 == 1 || !ok[last][j] {
                              continue;
                          }
                          let at = (mask | (1 << j)) * n + j;
                          dp[at] = (dp[at] + w) % m;
                      }
                  }
              }
              let mut total: i64 = 0;
              for e in 0..n {
                  total = (total + dp[(full - 1) * n + e]) % m;
              }
              total as i32
          }
        `,
        php: code`
          function specialPerm($nums) {
              $m = 1000000007;
              $n = count($nums);
              $full = 1 << $n;
              $ok = [];
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      $ok[$i][$j] = $i != $j && ($nums[$i] % $nums[$j] == 0 || $nums[$j] % $nums[$i] == 0);
                  }
              }
              $dp = array_fill(0, $full * $n, 0);
              for ($i = 0; $i < $n; $i++) $dp[(1 << $i) * $n + $i] = 1;
              for ($mask = 1; $mask < $full; $mask++) {
                  for ($last = 0; $last < $n; $last++) {
                      $w = $dp[$mask * $n + $last];
                      if ($w == 0) continue;
                      for ($j = 0; $j < $n; $j++) {
                          if ((($mask >> $j) & 1) || !$ok[$last][$j]) continue;
                          $at = ($mask | (1 << $j)) * $n + $j;
                          $dp[$at] = ($dp[$at] + $w) % $m;
                      }
                  }
              }
              $total = 0;
              for ($e = 0; $e < $n; $e++) $total = ($total + $dp[($full - 1) * $n + $e]) % $m;
              return $total;
          }
        `,
        ruby: code`
          def specialPerm(nums)
            mod = 1000000007
            n = nums.length
            full = 1 << n
            ok = Array.new(n) { |i| Array.new(n) { |j| i != j && (nums[i] % nums[j] == 0 || nums[j] % nums[i] == 0) } }
            dp = Array.new(full * n, 0)
            n.times { |i| dp[(1 << i) * n + i] = 1 }
            (1...full).each do |mask|
              n.times do |last|
                w = dp[mask * n + last]
                next if w == 0
                n.times do |j|
                  next if (mask >> j) & 1 == 1 || !ok[last][j]
                  at = (mask | (1 << j)) * n + j
                  dp[at] = (dp[at] + w) % mod
                end
              end
            end
            total = 0
            n.times { |e| total = (total + dp[(full - 1) * n + e]) % mod }
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Compatibility Score Sum (LC 1947) ───────────────────
  (() => {
    const ref = (students: number[][], mentors: number[][]) => {
      const m = students.length;
      const perm = Array.from({ length: m }, (_, i) => i);
      let best = 0;
      const rec = (i: number) => {
        if (i === m) {
          let s = 0;
          for (let a = 0; a < m; a++) for (let q = 0; q < students[a].length; q++) if (students[a][q] === mentors[perm[a]][q]) s++;
          best = Math.max(best, s);
          return;
        }
        for (let j = i; j < m; j++) {
          [perm[i], perm[j]] = [perm[j], perm[i]];
          rec(i + 1);
          [perm[i], perm[j]] = [perm[j], perm[i]];
        }
      };
      rec(0);
      return best;
    };
    return {
      slug: "maximum-compatibility-score-sum",
      title: "Maximum Compatibility Score Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Backtracking", "Bit Manipulation", "Bitmask", "Amazon", "Google"],
      signature: {
        funcName: "maxCompatibilitySum",
        params: [{ name: "students", type: "int[][]" as const }, { name: "mentors", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A survey has `n` yes/no questions. `m` students and `m` mentors answered it: `students[i]` and `mentors[j]` are arrays of `n` answers, each 0 or 1.\n\nThe **compatibility score** of a student and a mentor is the number of questions they answered the same way. Pair every student with a different mentor (a one-to-one assignment).\n\nReturn the maximum possible sum of the compatibility scores of the pairs.",
        [
          { in: "students = [[1,0],[0,1]], mentors = [[0,1],[1,0]]", out: "4", note: "Student 0 with mentor 1 and student 1 with mentor 0 agree on everything." },
          { in: "students = [[0,0]], mentors = [[1,1]]", out: "0" },
          { in: "students = [[1,1,1],[0,0,0]], mentors = [[1,0,1],[0,1,0]]", out: "4" },
        ],
        ["m == students.length == mentors.length", "n == students[i].length == mentors[j].length", "1 <= m, n <= 8", "students[i][k] and mentors[j][k] are 0 or 1"]),
      hints: [
        "Precompute the score of every student–mentor pair: an `m x m` table.",
        "With m <= 8 even trying all m! assignments works, but a bitmask DP is cleaner.",
        "Let `dp[mask]` be the best total when the first `popcount(mask)` students are paired with the mentors in `mask`; extend by pairing the next student with each free mentor.",
      ],
      editorial: explain({
        idea: "This is an assignment problem on a tiny `m x m` score table: process the students in order and keep a bitmask of mentors already taken.",
        steps: [
          "Compute `score[i][j]` = number of equal answers between student `i` and mentor `j`.",
          "Set `dp[0] = 0`; visit masks in increasing order.",
          "For `mask`, the next student is `i = popcount(mask)`; for every mentor `j` not in `mask`, update `dp[mask | 1<<j]` with `dp[mask] + score[i][j]`.",
          "Return `dp[2^m - 1]`.",
        ],
        why: "Any assignment pairs students `0, 1, …, m-1` in turn with distinct mentors, i.e. it is a path from the empty mask to the full mask collecting exactly its scores. The best completion depends only on which mentors remain, so keeping the best score per mask is exact.",
        time: "O(m · 2^m + m² · n)",
        space: "O(2^m)",
        pitfalls: [
          "Pairing each student greedily with their best remaining mentor is not optimal.",
          "Compatibility counts matching answers, zeros included — not the number of shared 1s.",
          "The student index is the popcount of the mask; no second DP dimension is needed.",
        ],
      }),
      examples: [
        { input: "[[1,0],[0,1]]\n[[0,1],[1,0]]", expectedOutput: "4" },
        { input: "[[0,0]]\n[[1,1]]", expectedOutput: "0" },
        { input: "[[1,1,1],[0,0,0]]\n[[1,0,1],[0,1,0]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const m = pick(rng, [1, ri(rng, 1, 4), ri(rng, 1, 7)]);
        const n = ri(rng, 1, 8);
        const bits = () => Array.from({ length: n }, () => ri(rng, 0, 1));
        const students = Array.from({ length: m }, bits);
        const mentors = Array.from({ length: m }, bits);
        return { input: `${fmtIntMat(students)}\n${fmtIntMat(mentors)}`, expectedOutput: String(ref(students, mentors)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxCompatibilitySum(students: List[List[int]], mentors: List[List[int]]) -> int:
              m = len(students)
              n = len(students[0])
              score = [[sum(1 for q in range(n) if students[i][q] == mentors[j][q]) for j in range(m)] for i in range(m)]
              full = 1 << m
              dp = [-1] * full
              dp[0] = 0
              for mask in range(full):
                  if dp[mask] < 0:
                      continue
                  i = bin(mask).count("1")
                  if i >= m:
                      continue
                  for j in range(m):
                      if mask & (1 << j):
                          continue
                      nm = mask | (1 << j)
                      v = dp[mask] + score[i][j]
                      if v > dp[nm]:
                          dp[nm] = v
              return dp[full - 1]
        `,
        javascript: code`
          var maxCompatibilitySum = function(students, mentors) {
              var m = students.length, n = students[0].length, full = 1 << m;
              var score = [];
              for (var i = 0; i < m; i++) {
                  score.push([]);
                  for (var j = 0; j < m; j++) {
                      var s = 0;
                      for (var q = 0; q < n; q++) if (students[i][q] === mentors[j][q]) s++;
                      score[i].push(s);
                  }
              }
              var dp = new Array(full).fill(-1);
              dp[0] = 0;
              for (var mask = 0; mask < full; mask++) {
                  if (dp[mask] < 0) continue;
                  var st = 0;
                  for (var x = mask; x; x >>= 1) st += x & 1;
                  if (st >= m) continue;
                  for (var t = 0; t < m; t++) {
                      if (mask & (1 << t)) continue;
                      var nm = mask | (1 << t), v = dp[mask] + score[st][t];
                      if (v > dp[nm]) dp[nm] = v;
                  }
              }
              return dp[full - 1];
          };
        `,
        typescript: code`
          function maxCompatibilitySum(students: number[][], mentors: number[][]): number {
              var m = students.length, n = students[0].length, full = 1 << m;
              var score: number[][] = [];
              for (var i = 0; i < m; i++) {
                  score.push([]);
                  for (var j = 0; j < m; j++) {
                      var s = 0;
                      for (var q = 0; q < n; q++) if (students[i][q] === mentors[j][q]) s++;
                      score[i].push(s);
                  }
              }
              var dp: number[] = [];
              for (var z = 0; z < full; z++) dp.push(-1);
              dp[0] = 0;
              for (var mask = 0; mask < full; mask++) {
                  if (dp[mask] < 0) continue;
                  var st = 0;
                  for (var x = mask; x; x >>= 1) st += x & 1;
                  if (st >= m) continue;
                  for (var t = 0; t < m; t++) {
                      if (mask & (1 << t)) continue;
                      var nm = mask | (1 << t), v = dp[mask] + score[st][t];
                      if (v > dp[nm]) dp[nm] = v;
                  }
              }
              return dp[full - 1];
          }
        `,
        java: code`
          public static int maxCompatibilitySum(int[][] students, int[][] mentors) {
              int m = students.length, n = students[0].length, full = 1 << m;
              int[][] score = new int[m][m];
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < m; j++) {
                      for (int q = 0; q < n; q++) if (students[i][q] == mentors[j][q]) score[i][j]++;
                  }
              }
              int[] dp = new int[full];
              Arrays.fill(dp, -1);
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] < 0) continue;
                  int i = Integer.bitCount(mask);
                  if (i >= m) continue;
                  for (int j = 0; j < m; j++) {
                      if ((mask & (1 << j)) != 0) continue;
                      int nm = mask | (1 << j);
                      dp[nm] = Math.max(dp[nm], dp[mask] + score[i][j]);
                  }
              }
              return dp[full - 1];
          }
        `,
        cpp: code`
          int maxCompatibilitySum(vector<vector<int>>& students, vector<vector<int>>& mentors) {
              int m = students.size(), n = students[0].size(), full = 1 << m;
              vector<vector<int>> score(m, vector<int>(m, 0));
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < m; j++) {
                      for (int q = 0; q < n; q++) if (students[i][q] == mentors[j][q]) score[i][j]++;
                  }
              }
              vector<int> dp(full, -1);
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] < 0) continue;
                  int i = __builtin_popcount(mask);
                  if (i >= m) continue;
                  for (int j = 0; j < m; j++) {
                      if (mask & (1 << j)) continue;
                      int nm = mask | (1 << j);
                      dp[nm] = max(dp[nm], dp[mask] + score[i][j]);
                  }
              }
              return dp[full - 1];
          }
        `,
        c: code`
          int maxCompatibilitySum(int** students, int studentsSize, int* studentsColSize, int** mentors, int mentorsSize, int* mentorsColSize) {
              int m = studentsSize, n = studentsColSize[0], full = 1 << m;
              int score[8][8];
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < m; j++) {
                      score[i][j] = 0;
                      for (int q = 0; q < n; q++) if (students[i][q] == mentors[j][q]) score[i][j]++;
                  }
              }
              int dp[256];
              for (int mask = 0; mask < full; mask++) dp[mask] = -1;
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] < 0) continue;
                  int i = 0;
                  for (int x = mask; x; x >>= 1) i += x & 1;
                  if (i >= m) continue;
                  for (int j = 0; j < m; j++) {
                      if (mask & (1 << j)) continue;
                      int nm = mask | (1 << j);
                      int v = dp[mask] + score[i][j];
                      if (v > dp[nm]) dp[nm] = v;
                  }
              }
              return dp[full - 1];
          }
        `,
        csharp: code`
          public static int MaxCompatibilitySum(int[][] students, int[][] mentors)
          {
              int m = students.Length, n = students[0].Length, full = 1 << m;
              int[,] score = new int[m, m];
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < m; j++)
                  {
                      for (int q = 0; q < n; q++) if (students[i][q] == mentors[j][q]) score[i, j]++;
                  }
              }
              int[] dp = new int[full];
              for (int mask = 0; mask < full; mask++) dp[mask] = -1;
              dp[0] = 0;
              for (int mask = 0; mask < full; mask++)
              {
                  if (dp[mask] < 0) continue;
                  int i = 0;
                  for (int x = mask; x != 0; x >>= 1) i += x & 1;
                  if (i >= m) continue;
                  for (int j = 0; j < m; j++)
                  {
                      if ((mask & (1 << j)) != 0) continue;
                      int nm = mask | (1 << j);
                      dp[nm] = Math.Max(dp[nm], dp[mask] + score[i, j]);
                  }
              }
              return dp[full - 1];
          }
        `,
        go: code`
          func maxCompatibilitySum(students [][]int, mentors [][]int) int {
          	m, n := len(students), len(students[0])
          	full := 1 << uint(m)
          	score := make([][]int, m)
          	for i := 0; i < m; i++ {
          		score[i] = make([]int, m)
          		for j := 0; j < m; j++ {
          			for q := 0; q < n; q++ {
          				if students[i][q] == mentors[j][q] {
          					score[i][j]++
          				}
          			}
          		}
          	}
          	dp := make([]int, full)
          	for mask := range dp {
          		dp[mask] = -1
          	}
          	dp[0] = 0
          	for mask := 0; mask < full; mask++ {
          		if dp[mask] < 0 {
          			continue
          		}
          		i := 0
          		for x := mask; x > 0; x >>= 1 {
          			i += x & 1
          		}
          		if i >= m {
          			continue
          		}
          		for j := 0; j < m; j++ {
          			if mask&(1<<uint(j)) != 0 {
          				continue
          			}
          			nm := mask | (1 << uint(j))
          			if v := dp[mask] + score[i][j]; v > dp[nm] {
          				dp[nm] = v
          			}
          		}
          	}
          	return dp[full-1]
          }
        `,
        kotlin: code`
          fun maxCompatibilitySum(students: Array<IntArray>, mentors: Array<IntArray>): Int {
              val m = students.size
              val n = students[0].size
              val full = 1 shl m
              val score = Array(m) { i -> IntArray(m) { j -> (0 until n).count { q -> students[i][q] == mentors[j][q] } } }
              val dp = IntArray(full) { -1 }
              dp[0] = 0
              for (mask in 0 until full) {
                  if (dp[mask] < 0) continue
                  val i = Integer.bitCount(mask)
                  if (i >= m) continue
                  for (j in 0 until m) {
                      if ((mask and (1 shl j)) != 0) continue
                      val nm = mask or (1 shl j)
                      dp[nm] = maxOf(dp[nm], dp[mask] + score[i][j])
                  }
              }
              return dp[full - 1]
          }
        `,
        swift: code`
          func maxCompatibilitySum(_ students: [[Int]], _ mentors: [[Int]]) -> Int {
              let m = students.count
              let n = students[0].count
              let full = 1 << m
              var score = [[Int]](repeating: [Int](repeating: 0, count: m), count: m)
              for i in 0..<m {
                  for j in 0..<m {
                      for q in 0..<n where students[i][q] == mentors[j][q] { score[i][j] += 1 }
                  }
              }
              var dp = [Int](repeating: -1, count: full)
              dp[0] = 0
              for mask in 0..<full where dp[mask] >= 0 {
                  let i = mask.nonzeroBitCount
                  if i >= m { continue }
                  for j in 0..<m where mask & (1 << j) == 0 {
                      let nm = mask | (1 << j)
                      dp[nm] = max(dp[nm], dp[mask] + score[i][j])
                  }
              }
              return dp[full - 1]
          }
        `,
        rust: code`
          fn maxCompatibilitySum(students: Vec<Vec<i32>>, mentors: Vec<Vec<i32>>) -> i32 {
              let m = students.len();
              let n = students[0].len();
              let full = 1usize << m;
              let mut score = vec![vec![0i32; m]; m];
              for i in 0..m {
                  for j in 0..m {
                      for q in 0..n {
                          if students[i][q] == mentors[j][q] {
                              score[i][j] += 1;
                          }
                      }
                  }
              }
              let mut dp = vec![-1i32; full];
              dp[0] = 0;
              for mask in 0..full {
                  if dp[mask] < 0 {
                      continue;
                  }
                  let i = (mask as u32).count_ones() as usize;
                  if i >= m {
                      continue;
                  }
                  for j in 0..m {
                      if mask & (1 << j) != 0 {
                          continue;
                      }
                      let nm = mask | (1 << j);
                      let v = dp[mask] + score[i][j];
                      if v > dp[nm] {
                          dp[nm] = v;
                      }
                  }
              }
              dp[full - 1]
          }
        `,
        php: code`
          function maxCompatibilitySum($students, $mentors) {
              $m = count($students);
              $n = count($students[0]);
              $full = 1 << $m;
              $score = [];
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $m; $j++) {
                      $s = 0;
                      for ($q = 0; $q < $n; $q++) if ($students[$i][$q] == $mentors[$j][$q]) $s++;
                      $score[$i][$j] = $s;
                  }
              }
              $dp = array_fill(0, $full, -1);
              $dp[0] = 0;
              for ($mask = 0; $mask < $full; $mask++) {
                  if ($dp[$mask] < 0) continue;
                  $i = substr_count(decbin($mask), "1");
                  if ($i >= $m) continue;
                  for ($j = 0; $j < $m; $j++) {
                      if ($mask & (1 << $j)) continue;
                      $nm = $mask | (1 << $j);
                      $v = $dp[$mask] + $score[$i][$j];
                      if ($v > $dp[$nm]) $dp[$nm] = $v;
                  }
              }
              return $dp[$full - 1];
          }
        `,
        ruby: code`
          def maxCompatibilitySum(students, mentors)
            m = students.length
            n = students[0].length
            full = 1 << m
            score = Array.new(m) { |i| Array.new(m) { |j| (0...n).count { |q| students[i][q] == mentors[j][q] } } }
            dp = Array.new(full, -1)
            dp[0] = 0
            full.times do |mask|
              next if dp[mask] < 0
              i = mask.to_s(2).count("1")
              next if i >= m
              m.times do |j|
                next if mask & (1 << j) != 0
                nm = mask | (1 << j)
                v = dp[mask] + score[i][j]
                dp[nm] = v if v > dp[nm]
              end
            end
            dp[full - 1]
          end
        `,
      },
    };
  })(),

  // ── Maximize Score After N Operations (LC 1799) ─────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const ref = (nums: number[]) => {
      // Every perfect matching, its gcds sorted ascending get multipliers 1..n (rearrangement inequality).
      let best = 0;
      const rec = (left: number[], gs: number[]) => {
        if (!left.length) {
          const s = gs.slice().sort((x, y) => x - y);
          best = Math.max(best, s.reduce((acc, g, i) => acc + (i + 1) * g, 0));
          return;
        }
        const a = left[0];
        for (let t = 1; t < left.length; t++) {
          const rest = left.filter((_, i) => i !== 0 && i !== t);
          rec(rest, gs.concat([gcd(a, left[t])]));
        }
      };
      rec(nums, []);
      return best;
    };
    return {
      slug: "maximize-score-after-n-operations",
      title: "Maximize Score After N Operations",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Number Theory", "Bitmask", "Google", "Amazon"],
      signature: { funcName: "maxScore", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of `2 * n` positive integers and must perform exactly `n` operations. In the `i`-th operation (1-indexed) you choose two remaining elements `x` and `y`, gain `i * gcd(x, y)` points, and remove both from the array.\n\nReturn the maximum total score after all `n` operations.",
        [
          { in: "nums = [6,9]", out: "3", note: "One operation: `1 * gcd(6, 9) = 3`." },
          { in: "nums = [4,6,8,12]", out: "16", note: "First (4, 8) for `1 * 4`, then (6, 12) for `2 * 6`." },
          { in: "nums = [5,5,5,5]", out: "15" },
        ],
        ["1 <= n <= 7", "nums.length == 2 * n", "1 <= nums[i] <= 10^6"]),
      hints: [
        "With at most 14 elements, the set of removed elements fits in a bitmask, and the number of the next operation is half its popcount plus one.",
        "Let `dp[mask]` be the best score after removing exactly the elements in `mask` (an even number of them).",
        "From `mask`, try every pair `(i, j)` of remaining elements: `dp[mask | bit(i) | bit(j)] = max(…, dp[mask] + op * gcd(nums[i], nums[j]))`, with the gcds precomputed.",
      ],
      editorial: explain({
        idea: "The order of operations matters only through the multiplier, which equals one plus the number of pairs already removed — that is, it is fixed by the mask. So a DP over masks of removed elements captures the whole problem.",
        steps: [
          "Precompute `g[i][j] = gcd(nums[i], nums[j])` for all pairs.",
          "Set `dp[0] = 0` and visit masks in increasing order, skipping masks with an odd popcount.",
          "For a mask, `op = popcount(mask) / 2 + 1`. For each pair `i < j` of elements not in `mask`, update `dp[mask | 1<<i | 1<<j]` with `dp[mask] + op * g[i][j]`.",
          "Return `dp[2^(2n) - 1]`.",
        ],
        why: "Any sequence of operations removes pairs one by one, passing through masks with 2, 4, … elements, and the `k`-th removal always earns `k` times its gcd. The best way to finish from a given mask does not depend on how that mask was reached, so storing the best score per mask is exact, and every possible sequence is a path the DP examines.",
        time: "O(4^n · n²)",
        space: "O(4^n)",
        pitfalls: [
          "Pairing the lowest free element first (a common speed-up for matching) is wrong here: it fixes the order of the pairs, and order changes the multipliers.",
          "The multiplier comes from how many pairs were already removed, not from the indices of the elements.",
          "Precompute the gcds — recomputing them inside the DP loop is the slow part otherwise.",
        ],
      }),
      examples: [
        { input: "[6,9]", expectedOutput: "3" },
        { input: "[4,6,8,12]", expectedOutput: "16" },
        { input: "[5,5,5,5]", expectedOutput: "15" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 3), ri(rng, 1, 4), ri(rng, 1, 5)]);
        const mode = ri(rng, 0, 2);
        const base = ri(rng, 1, 1000);
        const nums = Array.from({ length: 2 * n }, () => {
          if (mode === 0) return ri(rng, 1, 1000000);
          if (mode === 1) return ri(rng, 1, 30);
          return Math.min(1000000, base * ri(rng, 1, 60));
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      hiddenCount: 2500,
      solutions: {
        python: code`
          from typing import List
          from math import gcd

          def maxScore(nums: List[int]) -> int:
              m = len(nums)
              g = [[gcd(nums[i], nums[j]) for j in range(m)] for i in range(m)]
              full = 1 << m
              dp = [0] * full
              for mask in range(full):
                  c = bin(mask).count("1")
                  if c & 1:
                      continue
                  op = c // 2 + 1
                  base = dp[mask]
                  for i in range(m):
                      if (mask >> i) & 1:
                          continue
                      for j in range(i + 1, m):
                          if (mask >> j) & 1:
                              continue
                          nm = mask | (1 << i) | (1 << j)
                          v = base + op * g[i][j]
                          if v > dp[nm]:
                              dp[nm] = v
              return dp[full - 1]
        `,
        javascript: code`
          var maxScore = function(nums) {
              var m = nums.length, full = 1 << m;
              var gcd = function(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
              var g = [];
              for (var i = 0; i < m; i++) {
                  g.push([]);
                  for (var j = 0; j < m; j++) g[i].push(gcd(nums[i], nums[j]));
              }
              var dp = new Array(full).fill(0);
              for (var mask = 0; mask < full; mask++) {
                  var c = 0;
                  for (var x = mask; x; x >>= 1) c += x & 1;
                  if (c & 1) continue;
                  var op = c / 2 + 1;
                  for (var a = 0; a < m; a++) {
                      if (mask & (1 << a)) continue;
                      for (var b = a + 1; b < m; b++) {
                          if (mask & (1 << b)) continue;
                          var nm = mask | (1 << a) | (1 << b), v = dp[mask] + op * g[a][b];
                          if (v > dp[nm]) dp[nm] = v;
                      }
                  }
              }
              return dp[full - 1];
          };
        `,
        typescript: code`
          function maxScore(nums: number[]): number {
              var m = nums.length, full = 1 << m;
              var gcd = function(a: number, b: number): number { while (b) { var t = a % b; a = b; b = t; } return a; };
              var g: number[][] = [];
              for (var i = 0; i < m; i++) {
                  g.push([]);
                  for (var j = 0; j < m; j++) g[i].push(gcd(nums[i], nums[j]));
              }
              var dp: number[] = [];
              for (var z = 0; z < full; z++) dp.push(0);
              for (var mask = 0; mask < full; mask++) {
                  var c = 0;
                  for (var x = mask; x; x >>= 1) c += x & 1;
                  if (c & 1) continue;
                  var op = c / 2 + 1;
                  for (var a = 0; a < m; a++) {
                      if (mask & (1 << a)) continue;
                      for (var b = a + 1; b < m; b++) {
                          if (mask & (1 << b)) continue;
                          var nm = mask | (1 << a) | (1 << b), v = dp[mask] + op * g[a][b];
                          if (v > dp[nm]) dp[nm] = v;
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        java: code`
          public static int maxScore(int[] nums) {
              int m = nums.length, full = 1 << m;
              int[][] g = new int[m][m];
              for (int i = 0; i < m; i++) for (int j = 0; j < m; j++) g[i][j] = msnGcd(nums[i], nums[j]);
              int[] dp = new int[full];
              for (int mask = 0; mask < full; mask++) {
                  int c = Integer.bitCount(mask);
                  if ((c & 1) == 1) continue;
                  int op = c / 2 + 1;
                  for (int a = 0; a < m; a++) {
                      if ((mask & (1 << a)) != 0) continue;
                      for (int b = a + 1; b < m; b++) {
                          if ((mask & (1 << b)) != 0) continue;
                          int nm = mask | (1 << a) | (1 << b);
                          dp[nm] = Math.max(dp[nm], dp[mask] + op * g[a][b]);
                      }
                  }
              }
              return dp[full - 1];
          }

          static int msnGcd(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }
        `,
        cpp: code`
          static int msnGcd(int a, int b) {
              while (b) { int t = a % b; a = b; b = t; }
              return a;
          }

          int maxScore(vector<int>& nums) {
              int m = nums.size(), full = 1 << m;
              vector<vector<int>> g(m, vector<int>(m));
              for (int i = 0; i < m; i++) for (int j = 0; j < m; j++) g[i][j] = msnGcd(nums[i], nums[j]);
              vector<int> dp(full, 0);
              for (int mask = 0; mask < full; mask++) {
                  int c = __builtin_popcount(mask);
                  if (c & 1) continue;
                  int op = c / 2 + 1;
                  for (int a = 0; a < m; a++) {
                      if (mask & (1 << a)) continue;
                      for (int b = a + 1; b < m; b++) {
                          if (mask & (1 << b)) continue;
                          int nm = mask | (1 << a) | (1 << b);
                          dp[nm] = max(dp[nm], dp[mask] + op * g[a][b]);
                      }
                  }
              }
              return dp[full - 1];
          }
        `,
        c: code`
          static int msnGcd(int a, int b) {
              while (b) { int t = a % b; a = b; b = t; }
              return a;
          }

          int maxScore(int* nums, int numsSize) {
              int m = numsSize, full = 1 << m;
              int g[14][14];
              for (int i = 0; i < m; i++) for (int j = 0; j < m; j++) g[i][j] = msnGcd(nums[i], nums[j]);
              int* dp = (int*) calloc(full, sizeof(int));
              for (int mask = 0; mask < full; mask++) {
                  int c = 0;
                  for (int x = mask; x; x >>= 1) c += x & 1;
                  if (c & 1) continue;
                  int op = c / 2 + 1;
                  for (int a = 0; a < m; a++) {
                      if (mask & (1 << a)) continue;
                      for (int b = a + 1; b < m; b++) {
                          if (mask & (1 << b)) continue;
                          int nm = mask | (1 << a) | (1 << b);
                          int v = dp[mask] + op * g[a][b];
                          if (v > dp[nm]) dp[nm] = v;
                      }
                  }
              }
              int ans = dp[full - 1];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MaxScore(int[] nums)
          {
              int m = nums.Length, full = 1 << m;
              int[,] g = new int[m, m];
              for (int i = 0; i < m; i++) for (int j = 0; j < m; j++) g[i, j] = MsnGcd(nums[i], nums[j]);
              int[] dp = new int[full];
              for (int mask = 0; mask < full; mask++)
              {
                  int c = 0;
                  for (int x = mask; x != 0; x >>= 1) c += x & 1;
                  if ((c & 1) == 1) continue;
                  int op = c / 2 + 1;
                  for (int a = 0; a < m; a++)
                  {
                      if ((mask & (1 << a)) != 0) continue;
                      for (int b = a + 1; b < m; b++)
                      {
                          if ((mask & (1 << b)) != 0) continue;
                          int nm = mask | (1 << a) | (1 << b);
                          dp[nm] = Math.Max(dp[nm], dp[mask] + op * g[a, b]);
                      }
                  }
              }
              return dp[full - 1];
          }

          static int MsnGcd(int a, int b)
          {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }
        `,
        go: code`
          func msnGcd(a int, b int) int {
          	for b != 0 {
          		a, b = b, a%b
          	}
          	return a
          }

          func maxScore(nums []int) int {
          	m := len(nums)
          	full := 1 << uint(m)
          	g := make([][]int, m)
          	for i := 0; i < m; i++ {
          		g[i] = make([]int, m)
          		for j := 0; j < m; j++ {
          			g[i][j] = msnGcd(nums[i], nums[j])
          		}
          	}
          	dp := make([]int, full)
          	for mask := 0; mask < full; mask++ {
          		c := 0
          		for x := mask; x > 0; x >>= 1 {
          			c += x & 1
          		}
          		if c&1 == 1 {
          			continue
          		}
          		op := c/2 + 1
          		for a := 0; a < m; a++ {
          			if mask&(1<<uint(a)) != 0 {
          				continue
          			}
          			for b := a + 1; b < m; b++ {
          				if mask&(1<<uint(b)) != 0 {
          					continue
          				}
          				nm := mask | (1 << uint(a)) | (1 << uint(b))
          				if v := dp[mask] + op*g[a][b]; v > dp[nm] {
          					dp[nm] = v
          				}
          			}
          		}
          	}
          	return dp[full-1]
          }
        `,
        kotlin: code`
          fun maxScore(nums: IntArray): Int {
              val m = nums.size
              val full = 1 shl m
              fun gcd(x: Int, y: Int): Int {
                  var a = x
                  var b = y
                  while (b != 0) {
                      val t = a % b
                      a = b
                      b = t
                  }
                  return a
              }
              val g = Array(m) { i -> IntArray(m) { j -> gcd(nums[i], nums[j]) } }
              val dp = IntArray(full)
              for (mask in 0 until full) {
                  val c = Integer.bitCount(mask)
                  if ((c and 1) == 1) continue
                  val op = c / 2 + 1
                  for (a in 0 until m) {
                      if ((mask and (1 shl a)) != 0) continue
                      for (b in a + 1 until m) {
                          if ((mask and (1 shl b)) != 0) continue
                          val nm = mask or (1 shl a) or (1 shl b)
                          dp[nm] = maxOf(dp[nm], dp[mask] + op * g[a][b])
                      }
                  }
              }
              return dp[full - 1]
          }
        `,
        swift: code`
          func maxScore(_ nums: [Int]) -> Int {
              let m = nums.count
              let full = 1 << m
              func gcd(_ x: Int, _ y: Int) -> Int {
                  var a = x
                  var b = y
                  while b != 0 {
                      let t = a % b
                      a = b
                      b = t
                  }
                  return a
              }
              var g = [[Int]](repeating: [Int](repeating: 0, count: m), count: m)
              for i in 0..<m {
                  for j in 0..<m { g[i][j] = gcd(nums[i], nums[j]) }
              }
              var dp = [Int](repeating: 0, count: full)
              for mask in 0..<full {
                  let c = mask.nonzeroBitCount
                  if c & 1 == 1 { continue }
                  let op = c / 2 + 1
                  for a in 0..<m where mask & (1 << a) == 0 {
                      var b = a + 1
                      while b < m {
                          if mask & (1 << b) == 0 {
                              let nm = mask | (1 << a) | (1 << b)
                              dp[nm] = max(dp[nm], dp[mask] + op * g[a][b])
                          }
                          b += 1
                      }
                  }
              }
              return dp[full - 1]
          }
        `,
        rust: code`
          fn msn_gcd(a: i32, b: i32) -> i32 {
              let mut a = a;
              let mut b = b;
              while b != 0 {
                  let t = a % b;
                  a = b;
                  b = t;
              }
              a
          }

          fn maxScore(nums: Vec<i32>) -> i32 {
              let m = nums.len();
              let full = 1usize << m;
              let mut g = vec![vec![0i32; m]; m];
              for i in 0..m {
                  for j in 0..m {
                      g[i][j] = msn_gcd(nums[i], nums[j]);
                  }
              }
              let mut dp = vec![0i32; full];
              for mask in 0..full {
                  let c = (mask as u32).count_ones() as i32;
                  if c & 1 == 1 {
                      continue;
                  }
                  let op = c / 2 + 1;
                  for a in 0..m {
                      if mask & (1 << a) != 0 {
                          continue;
                      }
                      for b in (a + 1)..m {
                          if mask & (1 << b) != 0 {
                              continue;
                          }
                          let nm = mask | (1 << a) | (1 << b);
                          let v = dp[mask] + op * g[a][b];
                          if v > dp[nm] {
                              dp[nm] = v;
                          }
                      }
                  }
              }
              dp[full - 1]
          }
        `,
        php: code`
          function msnGcd($a, $b) {
              while ($b != 0) {
                  $t = $a % $b;
                  $a = $b;
                  $b = $t;
              }
              return $a;
          }

          function maxScore($nums) {
              $m = count($nums);
              $full = 1 << $m;
              $g = [];
              for ($i = 0; $i < $m; $i++) for ($j = 0; $j < $m; $j++) $g[$i][$j] = msnGcd($nums[$i], $nums[$j]);
              $dp = array_fill(0, $full, 0);
              for ($mask = 0; $mask < $full; $mask++) {
                  $c = substr_count(decbin($mask), "1");
                  if ($c & 1) continue;
                  $op = intdiv($c, 2) + 1;
                  for ($a = 0; $a < $m; $a++) {
                      if ($mask & (1 << $a)) continue;
                      for ($b = $a + 1; $b < $m; $b++) {
                          if ($mask & (1 << $b)) continue;
                          $nm = $mask | (1 << $a) | (1 << $b);
                          $v = $dp[$mask] + $op * $g[$a][$b];
                          if ($v > $dp[$nm]) $dp[$nm] = $v;
                      }
                  }
              }
              return $dp[$full - 1];
          }
        `,
        ruby: code`
          def maxScore(nums)
            m = nums.length
            full = 1 << m
            g = Array.new(m) { |i| Array.new(m) { |j| nums[i].gcd(nums[j]) } }
            dp = Array.new(full, 0)
            full.times do |mask|
              c = mask.to_s(2).count("1")
              next if c.odd?
              op = c / 2 + 1
              base = dp[mask]
              m.times do |a|
                next if (mask >> a) & 1 == 1
                ((a + 1)...m).each do |b|
                  next if (mask >> b) & 1 == 1
                  nm = mask | (1 << a) | (1 << b)
                  v = base + op * g[a][b]
                  dp[nm] = v if v > dp[nm]
                end
              end
            end
            dp[full - 1]
          end
        `,
      },
    };
  })(),

  // ── Fair Distribution of Cookies (LC 2305) ──────────────────────
  (() => {
    const ref = (cookies: number[], k: number) => {
      const n = cookies.length, full = 1 << n;
      const sum = new Array(full).fill(0);
      for (let mask = 1; mask < full; mask++) {
        const low = mask & -mask;
        sum[mask] = sum[mask ^ low] + cookies[31 - Math.clz32(low)];
      }
      let f = sum.slice();
      for (let j = 2; j <= k; j++) {
        const g = new Array(full).fill(Infinity);
        for (let mask = 0; mask < full; mask++) {
          for (let sub = mask; ; sub = (sub - 1) & mask) {
            g[mask] = Math.min(g[mask], Math.max(f[mask ^ sub], sum[sub]));
            if (sub === 0) break;
          }
        }
        f = g;
      }
      return f[full - 1];
    };
    return {
      slug: "fair-distribution-of-cookies",
      title: "Fair Distribution of Cookies",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Backtracking", "Bit Manipulation", "Bitmask", "Google", "Amazon"],
      signature: { funcName: "distributeCookies", params: [{ name: "cookies", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`cookies[i]` is the number of cookies in the `i`-th bag. Give every bag, unopened, to one of `k` children; a child may get several bags or none.\n\nThe **unfairness** of a distribution is the largest total number of cookies any single child receives.\n\nReturn the minimum unfairness over all distributions.",
        [
          { in: "cookies = [4,7,3,6,2], k = 2", out: "11", note: "`[4,7]` and `[3,6,2]` both total 11." },
          { in: "cookies = [5,5,5,5], k = 2", out: "10" },
          { in: "cookies = [9,1,2,3], k = 3", out: "9", note: "The bag of 9 alone already decides it: `[9]`, `[1,2]`, `[3]`." },
        ],
        ["2 <= cookies.length <= 8", "1 <= cookies[i] <= 10^5", "2 <= k <= cookies.length"]),
      hints: [
        "With at most 8 bags, try every way to hand them out — but prune hard.",
        "Assign bags one at a time to a child. Abandon a branch as soon as some child's total reaches the best unfairness found so far.",
        "Children with nothing yet are interchangeable: when a bag goes to an empty child, trying a second empty child repeats the same distribution. Handing out the largest bags first makes the pruning bite early.",
      ],
      editorial: explain({
        idea: "The instance is tiny, so a backtracking search over \"which child gets this bag\" is exact; symmetry breaking (empty children are identical) and bounding by the best answer so far keep it fast.",
        steps: [
          "Sort the bags in descending order and keep `sums[0..k-1]`, the children's totals, and `best` = infinity.",
          "`dfs(i, curMax)`: if `curMax >= best`, return. If all bags are placed, set `best = curMax`.",
          "Otherwise, for each child `j`: add bag `i` to `sums[j]`, recurse with `max(curMax, sums[j])`, then remove it. If `sums[j]` is 0 after removal (the child was empty), stop trying further children.",
          "Return `best`.",
        ],
        why: "Every distribution corresponds to a branch of the search, except that distributions differing only by a permutation of empty children are merged — they have identical unfairness, so nothing is lost. The bound prunes only branches whose unfairness can no longer drop below the best already found, since totals never decrease as more bags are added.",
        time: "O(k^n) worst case, far less with pruning",
        space: "O(n + k)",
        pitfalls: [
          "Without the empty-child symmetry break the search repeats each distribution up to k! times.",
          "Giving every bag to the currently poorest child (greedy) is not optimal.",
          "A child may receive no bags; do not force each child to get one.",
        ],
      }),
      examples: [
        { input: "[4,7,3,6,2]\n2", expectedOutput: "11" },
        { input: "[5,5,5,5]\n2", expectedOutput: "10" },
        { input: "[9,1,2,3]\n3", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, ri(rng, 2, 5), ri(rng, 2, 8)]);
        const hi = pick(rng, [5, 20, 100000]);
        const cookies = Array.from({ length: n }, () => ri(rng, 1, hi));
        const k = pick(rng, [2, ri(rng, 2, n), ri(rng, 2, Math.min(n, 3))]);
        return { input: `${fmtIntArr(cookies)}\n${k}`, expectedOutput: String(ref(cookies, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def distributeCookies(cookies: List[int], k: int) -> int:
              c = sorted(cookies, reverse=True)
              sums = [0] * k
              best = [1 << 30]

              def dfs(i, cur):
                  if cur >= best[0]:
                      return
                  if i == len(c):
                      best[0] = cur
                      return
                  for j in range(k):
                      sums[j] += c[i]
                      dfs(i + 1, max(cur, sums[j]))
                      sums[j] -= c[i]
                      if sums[j] == 0:
                          break

              dfs(0, 0)
              return best[0]
        `,
        javascript: code`
          var distributeCookies = function(cookies, k) {
              var c = cookies.slice().sort(function(a, b) { return b - a; });
              var sums = new Array(k).fill(0), best = 1 << 30;
              function dfs(i, cur) {
                  if (cur >= best) return;
                  if (i === c.length) { best = cur; return; }
                  for (var j = 0; j < k; j++) {
                      sums[j] += c[i];
                      dfs(i + 1, Math.max(cur, sums[j]));
                      sums[j] -= c[i];
                      if (sums[j] === 0) break;
                  }
              }
              dfs(0, 0);
              return best;
          };
        `,
        typescript: code`
          function distributeCookies(cookies: number[], k: number): number {
              var c = cookies.slice().sort(function(a, b) { return b - a; });
              var sums: number[] = [];
              for (var z = 0; z < k; z++) sums.push(0);
              var best = 1 << 30;
              var dfs = function(i: number, cur: number): void {
                  if (cur >= best) return;
                  if (i === c.length) { best = cur; return; }
                  for (var j = 0; j < k; j++) {
                      sums[j] += c[i];
                      dfs(i + 1, Math.max(cur, sums[j]));
                      sums[j] -= c[i];
                      if (sums[j] === 0) break;
                  }
              };
              dfs(0, 0);
              return best;
          }
        `,
        java: code`
          public static int distributeCookies(int[] cookies, int k) {
              int[] c = cookies.clone();
              Arrays.sort(c);
              for (int i = 0, j = c.length - 1; i < j; i++, j--) { int t = c[i]; c[i] = c[j]; c[j] = t; }
              int[] best = {1 << 30};
              dfcDfs(c, new int[k], 0, 0, best);
              return best[0];
          }

          static void dfcDfs(int[] c, int[] sums, int i, int cur, int[] best) {
              if (cur >= best[0]) return;
              if (i == c.length) { best[0] = cur; return; }
              for (int j = 0; j < sums.length; j++) {
                  sums[j] += c[i];
                  dfcDfs(c, sums, i + 1, Math.max(cur, sums[j]), best);
                  sums[j] -= c[i];
                  if (sums[j] == 0) break;
              }
          }
        `,
        cpp: code`
          static void dfcDfs(const vector<int>& c, vector<int>& sums, int i, int cur, int& best) {
              if (cur >= best) return;
              if (i == (int)c.size()) { best = cur; return; }
              for (size_t j = 0; j < sums.size(); j++) {
                  sums[j] += c[i];
                  dfcDfs(c, sums, i + 1, max(cur, sums[j]), best);
                  sums[j] -= c[i];
                  if (sums[j] == 0) break;
              }
          }

          int distributeCookies(vector<int>& cookies, int k) {
              vector<int> c(cookies);
              sort(c.rbegin(), c.rend());
              vector<int> sums(k, 0);
              int best = 1 << 30;
              dfcDfs(c, sums, 0, 0, best);
              return best;
          }
        `,
        c: code`
          static int dfcSums[8];
          static int dfcBest;

          static void dfcDfs(const int* c, int n, int k, int i, int cur) {
              if (cur >= dfcBest) return;
              if (i == n) { dfcBest = cur; return; }
              for (int j = 0; j < k; j++) {
                  dfcSums[j] += c[i];
                  dfcDfs(c, n, k, i + 1, dfcSums[j] > cur ? dfcSums[j] : cur);
                  dfcSums[j] -= c[i];
                  if (dfcSums[j] == 0) break;
              }
          }

          int distributeCookies(int* cookies, int cookiesSize, int k) {
              int c[8];
              for (int i = 0; i < cookiesSize; i++) c[i] = cookies[i];
              for (int i = 0; i < cookiesSize; i++) {
                  for (int j = i + 1; j < cookiesSize; j++) {
                      if (c[j] > c[i]) { int t = c[i]; c[i] = c[j]; c[j] = t; }
                  }
              }
              for (int j = 0; j < 8; j++) dfcSums[j] = 0;
              dfcBest = 1 << 30;
              dfcDfs(c, cookiesSize, k, 0, 0);
              return dfcBest;
          }
        `,
        csharp: code`
          public static int DistributeCookies(int[] cookies, int k)
          {
              int[] c = cookies.OrderByDescending(v => v).ToArray();
              int best = 1 << 30;
              DfcDfs(c, new int[k], 0, 0, ref best);
              return best;
          }

          static void DfcDfs(int[] c, int[] sums, int i, int cur, ref int best)
          {
              if (cur >= best) return;
              if (i == c.Length) { best = cur; return; }
              for (int j = 0; j < sums.Length; j++)
              {
                  sums[j] += c[i];
                  DfcDfs(c, sums, i + 1, Math.Max(cur, sums[j]), ref best);
                  sums[j] -= c[i];
                  if (sums[j] == 0) break;
              }
          }
        `,
        go: code`
          func distributeCookies(cookies []int, k int) int {
          	c := make([]int, len(cookies))
          	copy(c, cookies)
          	sort.Sort(sort.Reverse(sort.IntSlice(c)))
          	sums := make([]int, k)
          	best := 1 << 30
          	var dfs func(i int, cur int)
          	dfs = func(i int, cur int) {
          		if cur >= best {
          			return
          		}
          		if i == len(c) {
          			best = cur
          			return
          		}
          		for j := 0; j < k; j++ {
          			sums[j] += c[i]
          			nxt := cur
          			if sums[j] > nxt {
          				nxt = sums[j]
          			}
          			dfs(i+1, nxt)
          			sums[j] -= c[i]
          			if sums[j] == 0 {
          				break
          			}
          		}
          	}
          	dfs(0, 0)
          	return best
          }
        `,
        kotlin: code`
          fun distributeCookies(cookies: IntArray, k: Int): Int {
              val c = cookies.sortedDescending()
              val sums = IntArray(k)
              var best = 1 shl 30
              fun dfs(i: Int, cur: Int) {
                  if (cur >= best) return
                  if (i == c.size) {
                      best = cur
                      return
                  }
                  for (j in 0 until k) {
                      sums[j] += c[i]
                      dfs(i + 1, maxOf(cur, sums[j]))
                      sums[j] -= c[i]
                      if (sums[j] == 0) break
                  }
              }
              dfs(0, 0)
              return best
          }
        `,
        swift: code`
          func distributeCookies(_ cookies: [Int], _ k: Int) -> Int {
              let c = cookies.sorted(by: >)
              var sums = [Int](repeating: 0, count: k)
              var best = 1 << 30
              func dfs(_ i: Int, _ cur: Int) {
                  if cur >= best { return }
                  if i == c.count {
                      best = cur
                      return
                  }
                  for j in 0..<k {
                      sums[j] += c[i]
                      dfs(i + 1, max(cur, sums[j]))
                      sums[j] -= c[i]
                      if sums[j] == 0 { break }
                  }
              }
              dfs(0, 0)
              return best
          }
        `,
        rust: code`
          fn dfc_dfs(c: &Vec<i32>, sums: &mut Vec<i32>, i: usize, cur: i32, best: &mut i32) {
              if cur >= *best {
                  return;
              }
              if i == c.len() {
                  *best = cur;
                  return;
              }
              for j in 0..sums.len() {
                  sums[j] += c[i];
                  let nxt = if sums[j] > cur { sums[j] } else { cur };
                  dfc_dfs(c, sums, i + 1, nxt, best);
                  sums[j] -= c[i];
                  if sums[j] == 0 {
                      break;
                  }
              }
          }

          fn distributeCookies(cookies: Vec<i32>, k: i32) -> i32 {
              let mut c = cookies.clone();
              c.sort();
              c.reverse();
              let mut sums = vec![0i32; k as usize];
              let mut best = 1i32 << 30;
              dfc_dfs(&c, &mut sums, 0, 0, &mut best);
              best
          }
        `,
        php: code`
          function dfcDfs(&$c, &$sums, $k, $i, $cur, &$best) {
              if ($cur >= $best) return;
              if ($i == count($c)) {
                  $best = $cur;
                  return;
              }
              for ($j = 0; $j < $k; $j++) {
                  $sums[$j] += $c[$i];
                  dfcDfs($c, $sums, $k, $i + 1, $sums[$j] > $cur ? $sums[$j] : $cur, $best);
                  $sums[$j] -= $c[$i];
                  if ($sums[$j] == 0) break;
              }
          }

          function distributeCookies($cookies, $k) {
              $c = $cookies;
              rsort($c);
              $sums = array_fill(0, $k, 0);
              $best = 1 << 30;
              dfcDfs($c, $sums, $k, 0, 0, $best);
              return $best;
          }
        `,
        ruby: code`
          def dfc_dfs(c, sums, i, cur, best)
            return if cur >= best[0]
            if i == c.length
              best[0] = cur
              return
            end
            sums.length.times do |j|
              sums[j] += c[i]
              dfc_dfs(c, sums, i + 1, sums[j] > cur ? sums[j] : cur, best)
              sums[j] -= c[i]
              break if sums[j] == 0
            end
          end

          def distributeCookies(cookies, k)
            c = cookies.sort.reverse
            best = [1 << 30]
            dfc_dfs(c, Array.new(k, 0), 0, 0, best)
            best[0]
          end
        `,
      },
    };
  })(),

];
