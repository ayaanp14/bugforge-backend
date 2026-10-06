/**
 * Greedy problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Several originals return a 64-bit answer; their value bounds are tightened
 * (and say so in the constraints) so every answer fits in int32.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const GREEDY6_PROBLEMS: CatalogProblem[] = [

  // ── Minimum Number of Groups to Create a Valid Assignment (LC 2910) ──
  (() => {
    const ref = (balls: number[]) => {
      const freq = new Map<number, number>();
      for (const v of balls) freq.set(v, (freq.get(v) || 0) + 1);
      const counts = [...freq.values()];
      const minC = Math.min(...counts);
      let best = Infinity;
      // Every valid arrangement has box sizes in {k, k+1} for some 1 <= k <= minC.
      for (let k = 1; k <= minC; k++) {
        let total = 0;
        let ok = true;
        for (const c of counts) {
          let found = -1;
          for (let g = 1; g <= c; g++) {
            if (g * k <= c && c <= g * (k + 1)) { found = g; break; }
          }
          if (found < 0) { ok = false; break; }
          total += found;
        }
        if (ok) best = Math.min(best, total);
      }
      return best;
    };
    return {
      slug: "minimum-number-of-groups-to-create-a-valid-assignment",
      title: "Minimum Number of Groups to Create a Valid Assignment",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Greedy", "Amazon", "Google"],
      signature: { funcName: "minGroupsForValidAssignment", params: [{ name: "balls", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The CodeKairo swag room has a pile of numbered balls; `balls[i]` is the number printed on the `i`-th ball. Every ball must go into a box, following two rules:\n\n- All balls inside one box carry the **same** number (balls with the same number may still be spread over several boxes).\n- The fullest box holds **at most one** ball more than the emptiest box.\n\nReturn the **fewest** boxes needed.",
        [
          { in: "balls = [3,2,3,2,3]", out: "2", note: "One box with the three 3s and one box with the two 2s: sizes 3 and 2 differ by one." },
          { in: "balls = [10,10,10,3,1,1]", out: "4", note: "The lone 3 forces boxes of size 1 or 2: `[10,10]`, `[10]`, `[3]`, `[1,1]`." },
          { in: "balls = [7,7,7,7,7,7,7,1,1,1]", out: "3", note: "Boxes of sizes 3 or 4: the seven 7s fill a box of 4 and a box of 3, the three 1s fill one box of 3." },
        ],
        ["1 <= balls.length <= 10^5", "1 <= balls[i] <= 10^9"]),
      hints: [
        "Only how many times each number occurs matters, not the numbers themselves.",
        "If the smallest box holds `k` balls, every box holds `k` or `k + 1`, and `k` can be at most the rarest number's count.",
        "For a fixed `k`, a count `c` needs `g = ceil(c / (k + 1))` boxes and works only if `g * k <= c`. Try `k` from the largest value down; the first `k` that works for every count gives the answer.",
      ],
      editorial: explain({
        idea: "Fix the size `k` of the smallest box. Every box then holds `k` or `k + 1` balls, each number's balls can be packed independently, and a larger `k` never needs more boxes — so the largest feasible `k` wins.",
        steps: [
          "Count the occurrences of each number; let `m` be the smallest count.",
          "For `k` from `m` down to 1: for each count `c`, take `g = ceil(c / (k + 1))` boxes — the fewest that can hold `c` balls at `k + 1` each.",
          "Those `g` boxes can hold anything from `g * k` to `g * (k + 1)` balls, so the count fits exactly when `g * k <= c`. If every count fits, return the sum of the `g`s.",
          "`k = 1` always fits (`ceil(c / 2)` boxes of one or two balls), so the loop always returns.",
        ],
        why: "The smallest box comes from some number, so `k` never exceeds the rarest count `m`. For a fixed `k`, using fewer than `ceil(c / (k + 1))` boxes cannot hold `c` balls, and using that many works whenever the boxes can be filled to at least `k` each. Since `ceil(c / (k + 1))` only shrinks as `k` grows, the first feasible `k` from the top gives the fewest boxes in total.",
        time: "O(n + m · d) where d is the number of distinct values",
        space: "O(d)",
        pitfalls: [
          "Box sizes `{k, k + 1}` must work for all numbers at once — check every count for the same `k`.",
          "Using `ceil(c / k)` boxes is the wrong count: the larger box size `k + 1` gives fewer boxes.",
          "Starting `k` above the rarest count can never succeed.",
        ],
      }),
      examples: [
        { input: "[3,2,3,2,3]", expectedOutput: "2" },
        { input: "[10,10,10,3,1,1]", expectedOutput: "4" },
        { input: "[7,7,7,7,7,7,7,1,1,1]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 4);
        let balls: number[] = [];
        if (kind === 0) {
          balls = Array.from({ length: ri(rng, 1, 3) }, () => ri(rng, 1, 1000000000));
        } else if (kind === 1) {
          const n = ri(rng, 1, 40);
          const span = pick(rng, [1, 2, 3, 5]);
          balls = Array.from({ length: n }, () => ri(rng, 1, span));
        } else {
          const labels = ri(rng, 1, 5);
          const base = ri(rng, 1, 12);
          for (let l = 0; l < labels; l++) {
            const value = kind === 4 ? ri(rng, 1, 1000000000) : ri(rng, 1, 50);
            const cnt = kind === 2 ? ri(rng, 1, 30) : base + ri(rng, 0, base * 3);
            for (let t = 0; t < cnt; t++) balls.push(value);
          }
          shuffle(rng, balls);
        }
        return { input: fmtIntArr(balls), expectedOutput: String(ref(balls)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def minGroupsForValidAssignment(balls: List[int]) -> int:
              counts = list(Counter(balls).values())
              m = min(counts)
              for k in range(m, 0, -1):
                  total = 0
                  ok = True
                  for c in counts:
                      g = (c + k) // (k + 1)
                      if g * k > c:
                          ok = False
                          break
                      total += g
                  if ok:
                      return total
              return 0
        `,
        javascript: code`
          var minGroupsForValidAssignment = function(balls) {
              var freq = new Map();
              for (var i = 0; i < balls.length; i++) freq.set(balls[i], (freq.get(balls[i]) || 0) + 1);
              var counts = Array.from(freq.values());
              var m = balls.length;
              for (var j = 0; j < counts.length; j++) if (counts[j] < m) m = counts[j];
              for (var k = m; k >= 1; k--) {
                  var total = 0, ok = true;
                  for (var t = 0; t < counts.length; t++) {
                      var c = counts[t];
                      var g = Math.floor((c + k) / (k + 1));
                      if (g * k > c) { ok = false; break; }
                      total += g;
                  }
                  if (ok) return total;
              }
              return 0;
          };
        `,
        typescript: code`
          function minGroupsForValidAssignment(balls: number[]): number {
              var freq: { [k: string]: number } = {};
              var keys: string[] = [];
              for (var i = 0; i < balls.length; i++) {
                  var key = "" + balls[i];
                  if (freq[key] === undefined) { freq[key] = 0; keys.push(key); }
                  freq[key]++;
              }
              var counts: number[] = [];
              var m = balls.length;
              for (var j = 0; j < keys.length; j++) {
                  counts.push(freq[keys[j]]);
                  if (freq[keys[j]] < m) m = freq[keys[j]];
              }
              for (var k = m; k >= 1; k--) {
                  var total = 0;
                  var ok = true;
                  for (var t = 0; t < counts.length; t++) {
                      var c = counts[t];
                      var g = Math.floor((c + k) / (k + 1));
                      if (g * k > c) { ok = false; break; }
                      total += g;
                  }
                  if (ok) return total;
              }
              return 0;
          }
        `,
        java: code`
          public static int minGroupsForValidAssignment(int[] balls) {
              Map<Integer, Integer> freq = new HashMap<>();
              for (int v : balls) freq.merge(v, 1, Integer::sum);
              int m = Integer.MAX_VALUE;
              for (int c : freq.values()) m = Math.min(m, c);
              for (int k = m; k >= 1; k--) {
                  int total = 0;
                  boolean ok = true;
                  for (int c : freq.values()) {
                      int g = (c + k) / (k + 1);
                      if ((long) g * k > c) { ok = false; break; }
                      total += g;
                  }
                  if (ok) return total;
              }
              return 0;
          }
        `,
        cpp: code`
          int minGroupsForValidAssignment(vector<int>& balls) {
              unordered_map<int, int> freq;
              for (int v : balls) freq[v]++;
              int m = INT_MAX;
              for (auto& p : freq) m = min(m, p.second);
              for (int k = m; k >= 1; k--) {
                  int total = 0;
                  bool ok = true;
                  for (auto& p : freq) {
                      int c = p.second;
                      int g = (c + k) / (k + 1);
                      if ((long long) g * k > c) { ok = false; break; }
                      total += g;
                  }
                  if (ok) return total;
              }
              return 0;
          }
        `,
        c: code`
          static int cmpGroupsInt(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int minGroupsForValidAssignment(int* balls, int ballsSize) {
              int* a = (int*)malloc(sizeof(int) * ballsSize);
              int* counts = (int*)malloc(sizeof(int) * ballsSize);
              int nc = 0, m = ballsSize, i, k;
              for (i = 0; i < ballsSize; i++) a[i] = balls[i];
              qsort(a, ballsSize, sizeof(int), cmpGroupsInt);
              i = 0;
              while (i < ballsSize) {
                  int j = i;
                  while (j < ballsSize && a[j] == a[i]) j++;
                  counts[nc++] = j - i;
                  if (j - i < m) m = j - i;
                  i = j;
              }
              for (k = m; k >= 1; k--) {
                  int total = 0, ok = 1, t;
                  for (t = 0; t < nc; t++) {
                      int c = counts[t];
                      int g = (c + k) / (k + 1);
                      if ((long long)g * k > c) { ok = 0; break; }
                      total += g;
                  }
                  if (ok) { free(a); free(counts); return total; }
              }
              free(a);
              free(counts);
              return 0;
          }
        `,
        csharp: code`
          public static int MinGroupsForValidAssignment(int[] balls)
          {
              var freq = new Dictionary<int, int>();
              foreach (var v in balls)
              {
                  int cur;
                  freq.TryGetValue(v, out cur);
                  freq[v] = cur + 1;
              }
              int m = int.MaxValue;
              foreach (var c in freq.Values) m = Math.Min(m, c);
              for (int k = m; k >= 1; k--)
              {
                  int total = 0;
                  bool ok = true;
                  foreach (var c in freq.Values)
                  {
                      int g = (c + k) / (k + 1);
                      if ((long)g * k > c) { ok = false; break; }
                      total += g;
                  }
                  if (ok) return total;
              }
              return 0;
          }
        `,
        go: code`
          func minGroupsForValidAssignment(balls []int) int {
          	freq := map[int]int{}
          	for _, v := range balls {
          		freq[v]++
          	}
          	m := len(balls)
          	for _, c := range freq {
          		if c < m {
          			m = c
          		}
          	}
          	for k := m; k >= 1; k-- {
          		total := 0
          		ok := true
          		for _, c := range freq {
          			g := (c + k) / (k + 1)
          			if g*k > c {
          				ok = false
          				break
          			}
          			total += g
          		}
          		if ok {
          			return total
          		}
          	}
          	return 0
          }
        `,
        kotlin: code`
          fun minGroupsForValidAssignment(balls: IntArray): Int {
              val freq = HashMap<Int, Int>()
              for (v in balls) freq[v] = (freq[v] ?: 0) + 1
              var m = Int.MAX_VALUE
              for (c in freq.values) if (c < m) m = c
              var k = m
              while (k >= 1) {
                  var total = 0
                  var ok = true
                  for (c in freq.values) {
                      val g = (c + k) / (k + 1)
                      if (g.toLong() * k > c) { ok = false; break }
                      total += g
                  }
                  if (ok) return total
                  k--
              }
              return 0
          }
        `,
        swift: code`
          func minGroupsForValidAssignment(_ balls: [Int]) -> Int {
              var freq = [Int: Int]()
              for v in balls { freq[v, default: 0] += 1 }
              var m = Int.max
              for c in freq.values { if c < m { m = c } }
              var k = m
              while k >= 1 {
                  var total = 0
                  var ok = true
                  for c in freq.values {
                      let g = (c + k) / (k + 1)
                      if g * k > c { ok = false; break }
                      total += g
                  }
                  if ok { return total }
                  k -= 1
              }
              return 0
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn minGroupsForValidAssignment(balls: Vec<i32>) -> i32 {
              let mut freq: HashMap<i32, i64> = HashMap::new();
              for &v in balls.iter() {
                  *freq.entry(v).or_insert(0) += 1;
              }
              let counts: Vec<i64> = freq.values().cloned().collect();
              let mut m = std::i64::MAX;
              for &c in counts.iter() {
                  if c < m {
                      m = c;
                  }
              }
              let mut k = m;
              while k >= 1 {
                  let mut total: i64 = 0;
                  let mut ok = true;
                  for &c in counts.iter() {
                      let g = (c + k) / (k + 1);
                      if g * k > c {
                          ok = false;
                          break;
                      }
                      total += g;
                  }
                  if ok {
                      return total as i32;
                  }
                  k -= 1;
              }
              0
          }
        `,
        php: code`
          function minGroupsForValidAssignment($balls) {
              $freq = [];
              foreach ($balls as $v) {
                  $freq[$v] = (isset($freq[$v]) ? $freq[$v] : 0) + 1;
              }
              $m = PHP_INT_MAX;
              foreach ($freq as $c) { if ($c < $m) $m = $c; }
              for ($k = $m; $k >= 1; $k--) {
                  $total = 0;
                  $ok = true;
                  foreach ($freq as $c) {
                      $g = intdiv($c + $k, $k + 1);
                      if ($g * $k > $c) { $ok = false; break; }
                      $total += $g;
                  }
                  if ($ok) return $total;
              }
              return 0;
          }
        `,
        ruby: code`
          def minGroupsForValidAssignment(balls)
            counts = balls.tally.values
            m = counts.min
            m.downto(1) do |k|
              total = 0
              ok = true
              counts.each do |c|
                g = (c + k) / (k + 1)
                if g * k > c
                  ok = false
                  break
                end
                total += g
              end
              return total if ok
            end
            0
          end
        `,
      },
    };
  })(),

  // ── Minimum Increment Operations to Make Array Beautiful (LC 2919) ──
  (() => {
    // Independent formulation: track how many trailing elements are still below k.
    const ref = (nums: number[], k: number) => {
      let f = [0, Infinity, Infinity];
      for (const v of nums) {
        const best = Math.min(f[0], f[1], f[2]);
        const nf = [best + Math.max(0, k - v), Infinity, Infinity];
        if (v < k) { nf[1] = f[0]; nf[2] = f[1]; }
        f = nf;
      }
      return Math.min(f[0], f[1], f[2]);
    };
    return {
      slug: "minimum-increment-operations-to-make-array-beautiful",
      title: "Minimum Increment Operations to Make Array Beautiful",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "minIncrementOperations",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array `nums` of length `n` and an integer `k`. In one operation you pick any index and add `1` to that element.\n\nThe array is **beautiful** when every contiguous subarray of length **3 or more** has a maximum of at least `k`.\n\nReturn the minimum number of operations that makes `nums` beautiful.\n\n*The original allows values up to 10^9; here values are capped at 10^4 so the answer always fits in a 32-bit integer.*",
        [
          { in: "nums = [2,3,0,0,2], k = 4", out: "3", note: "Raise `nums[1]` once and `nums[4]` twice: `[2,4,0,0,4]`. Every window of three now contains a 4." },
          { in: "nums = [0,1,3,3], k = 5", out: "2", note: "Raising `nums[2]` to 5 covers both windows of length 3." },
          { in: "nums = [1,1,2], k = 1", out: "0" },
        ],
        ["3 <= n == nums.length <= 10^5", "0 <= nums[i] <= 10^4", "0 <= k <= 10^4"]),
      hints: [
        "A subarray longer than 3 contains a window of length 3, so only the windows of exactly three matter.",
        "There is never a reason to raise an element above `k`, and every window of three needs at least one element at `k` or more.",
        "Let `dp[i]` be the cheapest cost when element `i` is the last one raised to `k`: it is `max(0, k - nums[i])` plus the best of the three previous `dp` values.",
      ],
      editorial: explain({
        idea: "The condition just says: no three consecutive elements may all stay below `k`. So we choose a set of positions to lift to `k`, with gaps of at most two between them — a DP over the last chosen position.",
        steps: [
          "Let `cost(i) = max(0, k - nums[i])`, the price of making `nums[i]` reach `k`.",
          "`dp[i] = cost(i) + min(dp[i-1], dp[i-2], dp[i-3])`, where an index before the array counts as `0` — the first three positions may be the first chosen one.",
          "Keep only the last three values in three variables.",
          "The answer is `min(dp[n-1], dp[n-2], dp[n-3])`: the last chosen position must be within the final window.",
        ],
        why: "Raising an element past `k` or raising two elements of one window is never forced, so an optimal solution lifts a set of positions exactly to `k` (already-large elements cost 0). The set is valid exactly when every window of three contains one of them, i.e. consecutive chosen positions are at most three apart and the first and last lie in the first and last windows — which is what the recurrence and the final minimum enforce.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Elements already at least `k` cost nothing — use `max(0, k - x)`, not `k - x`.",
          "The answer is the minimum of the last three states, not just `dp[n-1]`.",
          "With the original 10^9 bounds the total needs 64 bits; the tightened bounds keep it in int32.",
        ],
      }),
      examples: [
        { input: "[2,3,0,0,2]\n4", expectedOutput: "3" },
        { input: "[0,1,3,3]\n5", expectedOutput: "2" },
        { input: "[1,1,2]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [3, 4, ri(rng, 3, 10), ri(rng, 10, 40), ri(rng, 40, 80)]);
        const cls = ri(rng, 0, 3);
        const hi = cls === 0 ? 10 : cls === 1 ? 100 : 10000;
        const k = cls === 3 ? pick(rng, [0, 10000, ri(rng, 0, 10000)]) : ri(rng, 0, hi);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minIncrementOperations(nums: List[int], k: int) -> int:
              a = b = c = 0
              for x in nums:
                  cur = max(0, k - x) + min(a, b, c)
                  a, b, c = b, c, cur
              return min(a, b, c)
        `,
        javascript: code`
          var minIncrementOperations = function(nums, k) {
              var a = 0, b = 0, c = 0;
              for (var i = 0; i < nums.length; i++) {
                  var cur = Math.max(0, k - nums[i]) + Math.min(a, b, c);
                  a = b; b = c; c = cur;
              }
              return Math.min(a, b, c);
          };
        `,
        typescript: code`
          function minIncrementOperations(nums: number[], k: number): number {
              var a = 0, b = 0, c = 0;
              for (var i = 0; i < nums.length; i++) {
                  var cur = Math.max(0, k - nums[i]) + Math.min(a, b, c);
                  a = b; b = c; c = cur;
              }
              return Math.min(a, b, c);
          }
        `,
        java: code`
          public static int minIncrementOperations(int[] nums, int k) {
              long a = 0, b = 0, c = 0;
              for (int x : nums) {
                  long cur = Math.max(0, k - x) + Math.min(a, Math.min(b, c));
                  a = b; b = c; c = cur;
              }
              return (int) Math.min(a, Math.min(b, c));
          }
        `,
        cpp: code`
          int minIncrementOperations(vector<int>& nums, int k) {
              long long a = 0, b = 0, c = 0;
              for (int x : nums) {
                  long long cur = max(0, k - x) + min(a, min(b, c));
                  a = b; b = c; c = cur;
              }
              return (int) min(a, min(b, c));
          }
        `,
        c: code`
          static long long min3Beautiful(long long a, long long b, long long c) {
              long long m = a;
              if (b < m) m = b;
              if (c < m) m = c;
              return m;
          }

          int minIncrementOperations(int* nums, int numsSize, int k) {
              long long a = 0, b = 0, c = 0;
              for (int i = 0; i < numsSize; i++) {
                  long long need = k - nums[i];
                  if (need < 0) need = 0;
                  long long cur = need + min3Beautiful(a, b, c);
                  a = b; b = c; c = cur;
              }
              return (int) min3Beautiful(a, b, c);
          }
        `,
        csharp: code`
          public static int MinIncrementOperations(int[] nums, int k)
          {
              long a = 0, b = 0, c = 0;
              foreach (int x in nums)
              {
                  long cur = Math.Max(0, k - x) + Math.Min(a, Math.Min(b, c));
                  a = b; b = c; c = cur;
              }
              return (int)Math.Min(a, Math.Min(b, c));
          }
        `,
        go: code`
          func minIncrementOperations(nums []int, k int) int {
          	a, b, c := 0, 0, 0
          	for _, x := range nums {
          		need := k - x
          		if need < 0 {
          			need = 0
          		}
          		m := a
          		if b < m {
          			m = b
          		}
          		if c < m {
          			m = c
          		}
          		a, b, c = b, c, need+m
          	}
          	m := a
          	if b < m {
          		m = b
          	}
          	if c < m {
          		m = c
          	}
          	return m
          }
        `,
        kotlin: code`
          fun minIncrementOperations(nums: IntArray, k: Int): Int {
              var a = 0L
              var b = 0L
              var c = 0L
              for (x in nums) {
                  val cur = maxOf(0, k - x).toLong() + minOf(a, minOf(b, c))
                  a = b
                  b = c
                  c = cur
              }
              return minOf(a, minOf(b, c)).toInt()
          }
        `,
        swift: code`
          func minIncrementOperations(_ nums: [Int], _ k: Int) -> Int {
              var a = 0, b = 0, c = 0
              for x in nums {
                  let cur = max(0, k - x) + min(a, min(b, c))
                  a = b
                  b = c
                  c = cur
              }
              return min(a, min(b, c))
          }
        `,
        rust: code`
          fn minIncrementOperations(nums: Vec<i32>, k: i32) -> i32 {
              let (mut a, mut b, mut c): (i64, i64, i64) = (0, 0, 0);
              for &x in nums.iter() {
                  let need = std::cmp::max(0, k - x) as i64;
                  let cur = need + std::cmp::min(a, std::cmp::min(b, c));
                  a = b;
                  b = c;
                  c = cur;
              }
              std::cmp::min(a, std::cmp::min(b, c)) as i32
          }
        `,
        php: code`
          function minIncrementOperations($nums, $k) {
              $a = 0; $b = 0; $c = 0;
              foreach ($nums as $x) {
                  $cur = max(0, $k - $x) + min($a, $b, $c);
                  $a = $b; $b = $c; $c = $cur;
              }
              return min($a, $b, $c);
          }
        `,
        ruby: code`
          def minIncrementOperations(nums, k)
            a = b = c = 0
            nums.each do |x|
              cur = [0, k - x].max + [a, b, c].min
              a, b, c = b, c, cur
            end
            [a, b, c].min
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Coins for Fruits (LC 2944) ─────────────────
  (() => {
    const viaDp = (prices: number[]) => {
      const n = prices.length;
      const memo = new Map<number, number>();
      const f = (i: number): number => {
        if (i > n) return 0;
        if (memo.has(i)) return memo.get(i)!;
        let best = Infinity;
        for (let j = i + 1; j <= Math.min(2 * i + 1, n + 1); j++) best = Math.min(best, f(j));
        const r = prices[i - 1] + best;
        memo.set(i, r);
        return r;
      };
      return f(1);
    };
    // Brute force over the set of purchased fruits (1-indexed): fruit f is
    // covered when it is bought or some bought s has s < f <= 2s.
    const brute = (prices: number[]) => {
      const n = prices.length;
      const cover: number[] = [];
      for (let s = 1; s <= n; s++) {
        let m = 0;
        for (let f = s; f <= Math.min(2 * s, n); f++) m |= 1 << (f - 1);
        cover.push(m);
      }
      const full = (1 << n) - 1;
      const cov = new Array(1 << n).fill(0);
      const cost = new Array(1 << n).fill(0);
      let best = Infinity;
      for (let mask = 1; mask <= full; mask++) {
        const low = mask & -mask;
        const s = 31 - Math.clz32(low);
        cov[mask] = cov[mask ^ low] | cover[s];
        cost[mask] = cost[mask ^ low] + prices[s];
        if (cov[mask] === full && cost[mask] < best) best = cost[mask];
      }
      return best;
    };
    return {
      slug: "minimum-number-of-coins-for-fruits",
      title: "Minimum Number of Coins for Fruits",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Monotonic Queue", "Amazon", "Microsoft"],
      signature: { funcName: "minimumCoins", params: [{ name: "prices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A fruit stall at the CodeKairo meetup lines up `n` fruits, numbered from **1**. Buying the `i`-th fruit costs `prices[i - 1]` coins and comes with a reward: the **next `i` fruits** (numbers `i + 1` to `2i`) are yours for free.\n\nYou may still pay for a fruit you could take for free — buying it earns its own reward.\n\nReturn the minimum number of coins needed to end up with every fruit.",
        [
          { in: "prices = [5,2,8]", out: "7", note: "Buy fruit 1 (5 coins) and fruit 2 is free; buy fruit 2 anyway (2 coins) so fruits 3 and 4 are free." },
          { in: "prices = [1,10,1,1]", out: "2", note: "Buy fruit 1 (fruit 2 free), then buy fruit 3 (fruit 4 free)." },
          { in: "prices = [26,18,6,12,49,7,45,45]", out: "39" },
        ],
        ["1 <= prices.length <= 1000", "1 <= prices[i] <= 10^5"]),
      hints: [
        "Fruit 1 can never be free, so it is always bought.",
        "After buying fruit `i`, fruits up to `2i` are covered — the next fruit you must pay for is somewhere in `i + 1 .. 2i + 1`.",
        "Let `dp[i]` be the cheapest cost to own fruits `i..n` given you buy fruit `i`: `prices[i-1] + min(dp[j])` for `j` in `i + 1 .. 2i + 1`, with `dp[n + 1] = 0`.",
      ],
      editorial: explain({
        idea: "Think of the purchases in increasing order. After buying fruit `i`, everything up to `2i` is covered, so the next purchase can be any fruit from `i + 1` to `2i + 1` — buying earlier than needed is allowed and sometimes cheaper.",
        steps: [
          "Create `dp` of size `n + 2` with `dp[n + 1] = 0` (nothing left to buy).",
          "For `i` from `n` down to `1`: `dp[i] = prices[i - 1] + min(dp[j])` over `j` from `i + 1` to `min(2i + 1, n + 1)`.",
          "Return `dp[1]`, since fruit 1 must be bought.",
        ],
        why: "Sort the purchases of any valid plan. Consecutive purchases `i < j` must satisfy `j <= 2i + 1`, or fruit `2i + 1` would be neither bought nor covered (earlier purchases cover even less). Conversely, any chain starting at 1 where each step is at most `2i + 1` and the last purchase reaches `n` covers every fruit. The DP minimises over exactly these chains.",
        time: "O(n^2) — a monotonic deque over the window brings it to O(n)",
        space: "O(n)",
        pitfalls: [
          "Fruits are 1-indexed in the reward rule: fruit `i` frees `i` fruits, so index arithmetic on `prices` needs `i - 1`.",
          "Greedily taking every free fruit is not optimal — paying for a cheap fruit can unlock a longer free run.",
          "The window ends at `2i + 1`, not `2i`: that fruit is the first one not covered.",
        ],
      }),
      examples: [
        { input: "[5,2,8]", expectedOutput: "7" },
        { input: "[1,10,1,1]", expectedOutput: "2" },
        { input: "[26,18,6,12,49,7,45,45]", expectedOutput: "39" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, ri(rng, 4, 10), ri(rng, 4, 12), ri(rng, 13, 60)]);
        const hi = pick(rng, [5, 20, 100000]);
        const prices = Array.from({ length: n }, () => ri(rng, 1, hi));
        const out = n <= 12 ? brute(prices) : viaDp(prices);
        return { input: fmtIntArr(prices), expectedOutput: String(out) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumCoins(prices: List[int]) -> int:
              n = len(prices)
              dp = [0] * (n + 2)
              for i in range(n, 0, -1):
                  hi = min(2 * i + 1, n + 1)
                  dp[i] = prices[i - 1] + min(dp[i + 1:hi + 1])
              return dp[1]
        `,
        javascript: code`
          var minimumCoins = function(prices) {
              var n = prices.length;
              var dp = new Array(n + 2).fill(0);
              for (var i = n; i >= 1; i--) {
                  var hi = Math.min(2 * i + 1, n + 1);
                  var best = Infinity;
                  for (var j = i + 1; j <= hi; j++) if (dp[j] < best) best = dp[j];
                  dp[i] = prices[i - 1] + best;
              }
              return dp[1];
          };
        `,
        typescript: code`
          function minimumCoins(prices: number[]): number {
              var n = prices.length;
              var dp: number[] = [];
              for (var z = 0; z < n + 2; z++) dp.push(0);
              for (var i = n; i >= 1; i--) {
                  var hi = Math.min(2 * i + 1, n + 1);
                  var best = Infinity;
                  for (var j = i + 1; j <= hi; j++) if (dp[j] < best) best = dp[j];
                  dp[i] = prices[i - 1] + best;
              }
              return dp[1];
          }
        `,
        java: code`
          public static int minimumCoins(int[] prices) {
              int n = prices.length;
              int[] dp = new int[n + 2];
              for (int i = n; i >= 1; i--) {
                  int hi = Math.min(2 * i + 1, n + 1);
                  int best = Integer.MAX_VALUE;
                  for (int j = i + 1; j <= hi; j++) best = Math.min(best, dp[j]);
                  dp[i] = prices[i - 1] + best;
              }
              return dp[1];
          }
        `,
        cpp: code`
          int minimumCoins(vector<int>& prices) {
              int n = prices.size();
              vector<int> dp(n + 2, 0);
              for (int i = n; i >= 1; i--) {
                  int hi = min(2 * i + 1, n + 1);
                  int best = INT_MAX;
                  for (int j = i + 1; j <= hi; j++) best = min(best, dp[j]);
                  dp[i] = prices[i - 1] + best;
              }
              return dp[1];
          }
        `,
        c: code`
          int minimumCoins(int* prices, int pricesSize) {
              int n = pricesSize;
              int* dp = (int*)calloc(n + 2, sizeof(int));
              for (int i = n; i >= 1; i--) {
                  int hi = 2 * i + 1 < n + 1 ? 2 * i + 1 : n + 1;
                  int best = 2147483647;
                  for (int j = i + 1; j <= hi; j++) if (dp[j] < best) best = dp[j];
                  dp[i] = prices[i - 1] + best;
              }
              int ans = dp[1];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumCoins(int[] prices)
          {
              int n = prices.Length;
              int[] dp = new int[n + 2];
              for (int i = n; i >= 1; i--)
              {
                  int hi = Math.Min(2 * i + 1, n + 1);
                  int best = int.MaxValue;
                  for (int j = i + 1; j <= hi; j++) best = Math.Min(best, dp[j]);
                  dp[i] = prices[i - 1] + best;
              }
              return dp[1];
          }
        `,
        go: code`
          func minimumCoins(prices []int) int {
          	n := len(prices)
          	dp := make([]int, n+2)
          	for i := n; i >= 1; i-- {
          		hi := 2*i + 1
          		if hi > n+1 {
          			hi = n + 1
          		}
          		best := -1
          		for j := i + 1; j <= hi; j++ {
          			if best < 0 || dp[j] < best {
          				best = dp[j]
          			}
          		}
          		dp[i] = prices[i-1] + best
          	}
          	return dp[1]
          }
        `,
        kotlin: code`
          fun minimumCoins(prices: IntArray): Int {
              val n = prices.size
              val dp = IntArray(n + 2)
              for (i in n downTo 1) {
                  val hi = minOf(2 * i + 1, n + 1)
                  var best = Int.MAX_VALUE
                  for (j in i + 1..hi) best = minOf(best, dp[j])
                  dp[i] = prices[i - 1] + best
              }
              return dp[1]
          }
        `,
        swift: code`
          func minimumCoins(_ prices: [Int]) -> Int {
              let n = prices.count
              var dp = [Int](repeating: 0, count: n + 2)
              var i = n
              while i >= 1 {
                  let hi = min(2 * i + 1, n + 1)
                  var best = Int.max
                  var j = i + 1
                  while j <= hi {
                      best = min(best, dp[j])
                      j += 1
                  }
                  dp[i] = prices[i - 1] + best
                  i -= 1
              }
              return dp[1]
          }
        `,
        rust: code`
          fn minimumCoins(prices: Vec<i32>) -> i32 {
              let n = prices.len();
              let mut dp = vec![0i32; n + 2];
              let mut i = n;
              while i >= 1 {
                  let hi = std::cmp::min(2 * i + 1, n + 1);
                  let mut best = std::i32::MAX;
                  for j in (i + 1)..(hi + 1) {
                      best = std::cmp::min(best, dp[j]);
                  }
                  dp[i] = prices[i - 1] + best;
                  i -= 1;
              }
              dp[1]
          }
        `,
        php: code`
          function minimumCoins($prices) {
              $n = count($prices);
              $dp = array_fill(0, $n + 2, 0);
              for ($i = $n; $i >= 1; $i--) {
                  $hi = min(2 * $i + 1, $n + 1);
                  $best = PHP_INT_MAX;
                  for ($j = $i + 1; $j <= $hi; $j++) {
                      if ($dp[$j] < $best) $best = $dp[$j];
                  }
                  $dp[$i] = $prices[$i - 1] + $best;
              }
              return $dp[1];
          }
        `,
        ruby: code`
          def minimumCoins(prices)
            n = prices.length
            dp = Array.new(n + 2, 0)
            n.downto(1) do |i|
              hi = [2 * i + 1, n + 1].min
              dp[i] = prices[i - 1] + dp[(i + 1)..hi].min
            end
            dp[1]
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost to Make Array Equalindromic (LC 2967) ───────────
  (() => {
    const isPalNum = (x: number) => { const s = String(x); return s === s.split("").reverse().join(""); };
    const PALS: number[] = [];
    for (let x = 1; x <= 200002; x++) if (isPalNum(x)) PALS.push(x);
    const ref = (nums: number[]) => {
      const lo = Math.min(...nums), hi = Math.max(...nums);
      // Cost is convex in y, so the best palindrome lies between the largest
      // palindrome <= min(nums) and the smallest palindrome >= max(nums).
      let a = 0;
      while (a + 1 < PALS.length && PALS[a + 1] <= lo) a++;
      let best = Infinity;
      for (let i = a; i < PALS.length; i++) {
        const y = PALS[i];
        let c = 0;
        for (const v of nums) c += Math.abs(v - y);
        best = Math.min(best, c);
        if (y >= hi) break;
      }
      return best;
    };
    return {
      slug: "minimum-cost-to-make-array-equalindromic",
      title: "Minimum Cost to Make Array Equalindromic",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Greedy", "Sorting", "Amazon", "Google"],
      signature: { funcName: "minimumCost", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. You may change every element to one common value `y`, paying `|nums[i] - y|` for each element `i`.\n\nThe array is **equalindromic** when all its elements equal the same **palindromic** positive integer — a number that reads the same forwards and backwards in base 10, such as `7`, `44` or `121`.\n\nReturn the minimum total cost to make `nums` equalindromic.\n\n*The original allows up to 10^5 values of up to 10^9; here `n <= 10^4` and values are at most 10^5, so the cost always fits in a 32-bit integer.*",
        [
          { in: "nums = [10,12,13,14,15]", out: "11", note: "Change everything to the palindrome 11: 1 + 1 + 2 + 3 + 4 = 11." },
          { in: "nums = [101,104,99,250]", out: "154", note: "Choosing 101 costs 0 + 3 + 2 + 149." },
          { in: "nums = [22,33,22,33,22]", out: "22" },
        ],
        ["1 <= nums.length <= 10^4", "1 <= nums[i] <= 10^5"]),
      hints: [
        "Without the palindrome rule, the best common value is the median.",
        "The total cost `sum |nums[i] - y|` only increases as `y` moves away from the median, on either side.",
        "So only two palindromes matter: the largest one not above the median and the smallest one not below it. Find each by stepping one at a time.",
      ],
      editorial: explain({
        idea: "The cost `f(y) = sum |nums[i] - y|` is convex and minimised at the median. Moving away from the median in either direction never helps, so the best palindrome is one of the two palindromes that bracket the median.",
        steps: [
          "Sort `nums` and take the median `m = nums[n / 2]`.",
          "Step down from `m` until reaching a palindrome `lo`, and up from `m` until reaching a palindrome `hi`.",
          "Return `min(f(lo), f(hi))`, computing each sum in 64-bit arithmetic.",
        ],
        why: "`f` is flat between the two middle elements and strictly sloped outside them, so it is non-increasing up to the median and non-decreasing after it. Any palindrome below `lo` costs at least `f(lo)`, and any palindrome above `hi` costs at least `f(hi)`. Palindromes are dense enough (gaps of at most 110 below 10^5) that the stepping is short.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Checking only the nearest palindrome to the median by distance is wrong — compare the costs of both neighbours.",
          "With an even length either middle element works as the median, because `f` is flat between them.",
          "Accumulate the cost in 64 bits in fixed-width languages even though the tightened answer fits in int32.",
        ],
      }),
      examples: [
        { input: "[10,12,13,14,15]", expectedOutput: "11" },
        { input: "[101,104,99,250]", expectedOutput: "154" },
        { input: "[22,33,22,33,22]", expectedOutput: "22" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 8), ri(rng, 5, 25)]);
        const cls = ri(rng, 0, 3);
        let nums: number[];
        if (cls === 0) nums = Array.from({ length: n }, () => ri(rng, 1, 300));
        else if (cls === 1) {
          const c = ri(rng, 1, 100000);
          nums = Array.from({ length: n }, () => Math.max(1, Math.min(100000, c + ri(rng, -150, 150))));
        } else if (cls === 2) nums = Array.from({ length: n }, () => ri(rng, 1, 100000));
        else nums = Array.from({ length: n }, () => pick(rng, [1, 9, 10, 11, 99, 100, 1000, 99999, 100000]));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumCost(nums: List[int]) -> int:
              a = sorted(nums)
              med = a[len(a) // 2]

              def is_pal(x):
                  s = str(x)
                  return s == s[::-1]

              lo = med
              while not is_pal(lo):
                  lo -= 1
              hi = med
              while not is_pal(hi):
                  hi += 1
              return min(sum(abs(v - lo) for v in a), sum(abs(v - hi) for v in a))
        `,
        javascript: code`
          var minimumCost = function(nums) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var med = a[a.length >> 1];
              var isPal = function(x) {
                  var r = 0, t = x;
                  while (t > 0) { r = r * 10 + (t % 10); t = Math.floor(t / 10); }
                  return r === x;
              };
              var cost = function(y) {
                  var s = 0;
                  for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - y);
                  return s;
              };
              var lo = med, hi = med;
              while (!isPal(lo)) lo--;
              while (!isPal(hi)) hi++;
              return Math.min(cost(lo), cost(hi));
          };
        `,
        typescript: code`
          function minimumCost(nums: number[]): number {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var med = a[a.length >> 1];
              var isPal = function(x: number): boolean {
                  var r = 0, t = x;
                  while (t > 0) { r = r * 10 + (t % 10); t = Math.floor(t / 10); }
                  return r === x;
              };
              var cost = function(y: number): number {
                  var s = 0;
                  for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - y);
                  return s;
              };
              var lo = med, hi = med;
              while (!isPal(lo)) lo--;
              while (!isPal(hi)) hi++;
              return Math.min(cost(lo), cost(hi));
          }
        `,
        java: code`
          private static boolean isPalEq(int x) {
              int r = 0, t = x;
              while (t > 0) { r = r * 10 + t % 10; t /= 10; }
              return r == x;
          }

          private static long costEq(int[] a, int y) {
              long s = 0;
              for (int v : a) s += Math.abs(v - y);
              return s;
          }

          public static int minimumCost(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int med = a[a.length / 2];
              int lo = med, hi = med;
              while (!isPalEq(lo)) lo--;
              while (!isPalEq(hi)) hi++;
              return (int) Math.min(costEq(a, lo), costEq(a, hi));
          }
        `,
        cpp: code`
          static bool isPalEq(int x) {
              int r = 0, t = x;
              while (t > 0) { r = r * 10 + t % 10; t /= 10; }
              return r == x;
          }

          int minimumCost(vector<int>& nums) {
              vector<int> a(nums);
              sort(a.begin(), a.end());
              int med = a[a.size() / 2];
              int lo = med, hi = med;
              while (!isPalEq(lo)) lo--;
              while (!isPalEq(hi)) hi++;
              long long c1 = 0, c2 = 0;
              for (int v : a) {
                  c1 += llabs((long long)v - lo);
                  c2 += llabs((long long)v - hi);
              }
              return (int) min(c1, c2);
          }
        `,
        c: code`
          static int cmpEqInt(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          static int isPalEq(int x) {
              int r = 0, t = x;
              while (t > 0) { r = r * 10 + t % 10; t /= 10; }
              return r == x;
          }

          int minimumCost(int* nums, int numsSize) {
              int* a = (int*)malloc(sizeof(int) * numsSize);
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), cmpEqInt);
              int med = a[numsSize / 2];
              int lo = med, hi = med;
              while (!isPalEq(lo)) lo--;
              while (!isPalEq(hi)) hi++;
              long long c1 = 0, c2 = 0;
              for (int i = 0; i < numsSize; i++) {
                  long long d1 = (long long)a[i] - lo, d2 = (long long)a[i] - hi;
                  c1 += d1 < 0 ? -d1 : d1;
                  c2 += d2 < 0 ? -d2 : d2;
              }
              free(a);
              return (int)(c1 < c2 ? c1 : c2);
          }
        `,
        csharp: code`
          private static bool IsPalEq(int x)
          {
              int r = 0, t = x;
              while (t > 0) { r = r * 10 + t % 10; t /= 10; }
              return r == x;
          }

          public static int MinimumCost(int[] nums)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              int med = a[a.Length / 2];
              int lo = med, hi = med;
              while (!IsPalEq(lo)) lo--;
              while (!IsPalEq(hi)) hi++;
              long c1 = 0, c2 = 0;
              foreach (int v in a)
              {
                  c1 += Math.Abs((long)v - lo);
                  c2 += Math.Abs((long)v - hi);
              }
              return (int)Math.Min(c1, c2);
          }
        `,
        go: code`
          func isPalEq(x int) bool {
          	r, t := 0, x
          	for t > 0 {
          		r = r*10 + t%10
          		t /= 10
          	}
          	return r == x
          }

          func minimumCost(nums []int) int {
          	a := make([]int, len(nums))
          	copy(a, nums)
          	sort.Ints(a)
          	med := a[len(a)/2]
          	lo, hi := med, med
          	for !isPalEq(lo) {
          		lo--
          	}
          	for !isPalEq(hi) {
          		hi++
          	}
          	c1, c2 := 0, 0
          	for _, v := range a {
          		d1, d2 := v-lo, v-hi
          		if d1 < 0 {
          			d1 = -d1
          		}
          		if d2 < 0 {
          			d2 = -d2
          		}
          		c1 += d1
          		c2 += d2
          	}
          	if c1 < c2 {
          		return c1
          	}
          	return c2
          }
        `,
        kotlin: code`
          fun isPalEq(x: Int): Boolean {
              var r = 0
              var t = x
              while (t > 0) {
                  r = r * 10 + t % 10
                  t /= 10
              }
              return r == x
          }

          fun minimumCost(nums: IntArray): Int {
              val a = nums.sortedArray()
              val med = a[a.size / 2]
              var lo = med
              var hi = med
              while (!isPalEq(lo)) lo--
              while (!isPalEq(hi)) hi++
              var c1 = 0L
              var c2 = 0L
              for (v in a) {
                  c1 += Math.abs(v.toLong() - lo)
                  c2 += Math.abs(v.toLong() - hi)
              }
              return minOf(c1, c2).toInt()
          }
        `,
        swift: code`
          func isPalEq(_ x: Int) -> Bool {
              var r = 0
              var t = x
              while t > 0 {
                  r = r * 10 + t % 10
                  t /= 10
              }
              return r == x
          }

          func minimumCost(_ nums: [Int]) -> Int {
              let a = nums.sorted()
              let med = a[a.count / 2]
              var lo = med
              var hi = med
              while !isPalEq(lo) { lo -= 1 }
              while !isPalEq(hi) { hi += 1 }
              var c1 = 0
              var c2 = 0
              for v in a {
                  c1 += abs(v - lo)
                  c2 += abs(v - hi)
              }
              return min(c1, c2)
          }
        `,
        rust: code`
          fn is_pal_eq(x: i64) -> bool {
              let mut r: i64 = 0;
              let mut t = x;
              while t > 0 {
                  r = r * 10 + t % 10;
                  t /= 10;
              }
              r == x
          }

          fn minimumCost(nums: Vec<i32>) -> i32 {
              let mut a: Vec<i64> = nums.iter().map(|&v| v as i64).collect();
              a.sort();
              let med = a[a.len() / 2];
              let mut lo = med;
              let mut hi = med;
              while !is_pal_eq(lo) {
                  lo -= 1;
              }
              while !is_pal_eq(hi) {
                  hi += 1;
              }
              let mut c1: i64 = 0;
              let mut c2: i64 = 0;
              for &v in a.iter() {
                  c1 += (v - lo).abs();
                  c2 += (v - hi).abs();
              }
              std::cmp::min(c1, c2) as i32
          }
        `,
        php: code`
          function isPalEq($x) {
              $s = strval($x);
              return $s === strrev($s);
          }

          function minimumCost($nums) {
              $a = $nums;
              sort($a);
              $med = $a[intdiv(count($a), 2)];
              $lo = $med;
              $hi = $med;
              while (!isPalEq($lo)) $lo--;
              while (!isPalEq($hi)) $hi++;
              $c1 = 0;
              $c2 = 0;
              foreach ($a as $v) {
                  $c1 += abs($v - $lo);
                  $c2 += abs($v - $hi);
              }
              return min($c1, $c2);
          }
        `,
        ruby: code`
          def minimumCost(nums)
            a = nums.sort
            med = a[a.length / 2]
            lo = med
            lo -= 1 until lo.to_s == lo.to_s.reverse
            hi = med
            hi += 1 until hi.to_s == hi.to_s.reverse
            c1 = a.sum { |v| (v - lo).abs }
            c2 = a.sum { |v| (v - hi).abs }
            [c1, c2].min
          end
        `,
      },
    };
  })(),

  // ── Construct the Longest New String (LC 2745) ───────────────────
  (() => {
    // Exhaustive search over which piece goes next, memoised across calls.
    // last: 0 = nothing yet, 1 = "AA", 2 = "BB", 3 = "AB".
    const memo = new Int16Array(51 * 51 * 51 * 4).fill(-1);
    const f = (a: number, b: number, c: number, last: number): number => {
      const key = ((a * 51 + b) * 51 + c) * 4 + last;
      if (memo[key] >= 0) return memo[key];
      let best = 0;
      if (a > 0 && last !== 1) best = Math.max(best, 2 + f(a - 1, b, c, 1)); // AA after AA makes AAAA
      if (b > 0 && last !== 2 && last !== 3) best = Math.max(best, 2 + f(a, b - 1, c, 2)); // ..B + BB makes BBB
      if (c > 0 && last !== 1) best = Math.max(best, 2 + f(a, b, c - 1, 3)); // AA + AB makes AAA
      memo[key] = best;
      return best;
    };
    const ref = (x: number, y: number, z: number) => f(x, y, z, 0);
    return {
      slug: "construct-the-longest-new-string",
      title: "Construct the Longest New String",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Brainteaser", "Amazon", "Google"],
      signature: {
        funcName: "longestString",
        params: [{ name: "x", type: "int" as const }, { name: "y", type: "int" as const }, { name: "z", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You have `x` copies of the string `\"AA\"`, `y` copies of `\"BB\"` and `z` copies of `\"AB\"`. Pick any number of them (possibly none, possibly all) and glue them together in any order.\n\nThe result must not contain `\"AAA\"` or `\"BBB\"` as a substring. Return the maximum possible length of the result.",
        [
          { in: "x = 2, y = 5, z = 1", out: "12", note: "`\"BB\" \"AA\" \"BB\" \"AA\" \"BB\" \"AB\"` gives `BBAABBAABBAB`, length 12." },
          { in: "x = 3, y = 2, z = 2", out: "14", note: "`\"AB\" \"AB\" \"AA\" \"BB\" \"AA\" \"BB\" \"AA\"` gives `ABABAABBAABBAA`." },
          { in: "x = 1, y = 1, z = 1", out: "6" },
        ],
        ["1 <= x, y, z <= 50"]),
      hints: [
        "Which pieces may follow `\"AA\"`? Only `\"BB\"` — anything starting with `A` makes `AAA`.",
        "`\"AB\"` pieces can all be chained together (`ABAB…`) and placed at the front, and they never block an `\"AA\"` after them.",
        "`\"AA\"` and `\"BB\"` must alternate, so you can use `min(x, y)` of each, plus one extra of the more plentiful kind if `x != y`.",
      ],
      editorial: explain({
        idea: "`\"AA\"` and `\"BB\"` must strictly alternate, while every `\"AB\"` can be used: a block `ABAB…AB` fits in front of an `\"AA\"` (or alone). So the answer is a formula.",
        steps: [
          "Use all `z` copies of `\"AB\"` as one block `ABAB…AB`.",
          "Alternate `\"AA\"` and `\"BB\"`: with `x == y` use all of both; otherwise use `min(x, y)` of each plus one more of the larger kind (the alternation can start and end with it).",
          "The answer is `2 · (2 · min(x, y) + (x != y ? 1 : 0) + z)`.",
        ],
        why: "After `\"AA\"` only `\"BB\"` may follow, and two `\"BB\"`s can never touch, so the `\"AA\"` and `\"BB\"` pieces alternate and their counts differ by at most one. Every `\"AB\"` can always be used: when `x >= y`, put the chain `AB…AB` first and then `AA BB AA …` (`ABAA` is fine); when `y > x`, write `BB AA … BB` and append the chain (`BBAB` is fine). So the bound is reached.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "`\"AB\"` followed by `\"BB\"` makes `ABBB` — so the `AB` block must not sit right before a `\"BB\"`.",
          "When `x == y` there is no extra piece: the `+1` applies only to unequal counts.",
          "The answer is a length in characters, so multiply the number of pieces by 2.",
        ],
      }),
      examples: [
        { input: "2\n5\n1", expectedOutput: "12" },
        { input: "3\n2\n2", expectedOutput: "14" },
        { input: "1\n1\n1", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 3);
        let x: number, y: number, z: number;
        if (cls === 0) { x = ri(rng, 1, 6); y = ri(rng, 1, 6); z = ri(rng, 1, 6); }
        else if (cls === 1) { x = ri(rng, 1, 50); y = x + pick(rng, [-1, 0, 0, 1]); y = Math.max(1, Math.min(50, y)); z = ri(rng, 1, 50); }
        else { x = ri(rng, 1, 50); y = ri(rng, 1, 50); z = ri(rng, 1, 50); }
        return { input: `${x}\n${y}\n${z}`, expectedOutput: String(ref(x, y, z)) };
      },
      solutions: {
        python: code`
          def longestString(x: int, y: int, z: int) -> int:
              pairs = 2 * min(x, y) + (1 if x != y else 0)
              return 2 * (pairs + z)
        `,
        javascript: code`
          var longestString = function(x, y, z) {
              var pairs = 2 * Math.min(x, y) + (x !== y ? 1 : 0);
              return 2 * (pairs + z);
          };
        `,
        typescript: code`
          function longestString(x: number, y: number, z: number): number {
              var pairs = 2 * Math.min(x, y) + (x !== y ? 1 : 0);
              return 2 * (pairs + z);
          }
        `,
        java: code`
          public static int longestString(int x, int y, int z) {
              int pairs = 2 * Math.min(x, y) + (x != y ? 1 : 0);
              return 2 * (pairs + z);
          }
        `,
        cpp: code`
          int longestString(int x, int y, int z) {
              int pairs = 2 * min(x, y) + (x != y ? 1 : 0);
              return 2 * (pairs + z);
          }
        `,
        c: code`
          int longestString(int x, int y, int z) {
              int m = x < y ? x : y;
              int pairs = 2 * m + (x != y ? 1 : 0);
              return 2 * (pairs + z);
          }
        `,
        csharp: code`
          public static int LongestString(int x, int y, int z)
          {
              int pairs = 2 * Math.Min(x, y) + (x != y ? 1 : 0);
              return 2 * (pairs + z);
          }
        `,
        go: code`
          func longestString(x int, y int, z int) int {
          	m := x
          	if y < m {
          		m = y
          	}
          	pairs := 2 * m
          	if x != y {
          		pairs++
          	}
          	return 2 * (pairs + z)
          }
        `,
        kotlin: code`
          fun longestString(x: Int, y: Int, z: Int): Int {
              val pairs = 2 * minOf(x, y) + (if (x != y) 1 else 0)
              return 2 * (pairs + z)
          }
        `,
        swift: code`
          func longestString(_ x: Int, _ y: Int, _ z: Int) -> Int {
              let pairs = 2 * min(x, y) + (x != y ? 1 : 0)
              return 2 * (pairs + z)
          }
        `,
        rust: code`
          fn longestString(x: i32, y: i32, z: i32) -> i32 {
              let pairs = 2 * std::cmp::min(x, y) + if x != y { 1 } else { 0 };
              2 * (pairs + z)
          }
        `,
        php: code`
          function longestString($x, $y, $z) {
              $pairs = 2 * min($x, $y) + ($x != $y ? 1 : 0);
              return 2 * ($pairs + $z);
          }
        `,
        ruby: code`
          def longestString(x, y, z)
            pairs = 2 * [x, y].min + (x != y ? 1 : 0)
            2 * (pairs + z)
          end
        `,
      },
    };
  })(),

  // ── Broken Calculator (LC 991) ───────────────────────────────────
  (() => {
    const bfs = (s: number, t: number) => {
      const lim = 4 * Math.max(s, t) + 4;
      const dist = new Int32Array(lim + 1).fill(-1);
      const q = [s];
      dist[s] = 0;
      for (let h = 0; h < q.length; h++) {
        const v = q[h];
        if (v === t) return dist[v];
        const nb = [v * 2, v - 1];
        for (const w of nb) {
          if (w >= 1 && w <= lim && dist[w] < 0) { dist[w] = dist[v] + 1; q.push(w); }
        }
      }
      return -1;
    };
    const backward = (s: number, t: number): number => (t <= s ? s - t : 1 + backward(s, t % 2 === 1 ? t + 1 : t / 2));
    return {
      slug: "broken-calculator",
      title: "Broken Calculator",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "brokenCalc",
        params: [{ name: "startValue", type: "int" as const }, { name: "target", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A calculator on the CodeKairo help desk is half broken: its display starts at `startValue` and only two keys still work:\n\n- **Double** — multiply the displayed number by 2.\n- **Decrement** — subtract 1 from the displayed number.\n\nReturn the minimum number of key presses needed to show `target`.",
        [
          { in: "startValue = 4, target = 13", out: "4", note: "4 → 8 → 7 → 14 → 13." },
          { in: "startValue = 9, target = 3", out: "6", note: "Six decrements." },
          { in: "startValue = 5, target = 32", out: "4", note: "5 → 4 → 8 → 16 → 32." },
        ],
        ["1 <= startValue, target <= 10^9"]),
      hints: [
        "Going forwards, it is hard to know when to decrement before doubling. Try working backwards from `target`.",
        "Backwards, the moves become: halve (only when even) and add 1.",
        "While `target > startValue`: if it is odd, add 1; otherwise halve it. Once it drops to `startValue` or below, the rest is `startValue - target` decrements.",
      ],
      editorial: explain({
        idea: "Reverse the process: from `target`, the inverse moves are \"halve\" (when even) and \"add 1\". Halving as early as possible is always best, which gives a simple greedy.",
        steps: [
          "Set `ops = 0`.",
          "While `target > startValue`: if `target` is odd, increment it; otherwise halve it. Count each step.",
          "Return `ops + (startValue - target)` — the remaining gap is closed by adding 1 repeatedly (decrements in the forward direction).",
        ],
        why: "An odd target can only be reached forwards by a decrement, so backwards it must be `+1`. For an even target above `startValue`, halving first is never worse: doing `+1` twice and then halving reaches the same number as halving then `+1`, with one more step. Repeating this exchange turns any optimal reverse sequence into the greedy one without making it longer.",
        time: "O(log target)",
        space: "O(1)",
        pitfalls: [
          "Simulating forwards with a BFS explodes for values near 10^9.",
          "When `startValue > target` no doubling is useful — the answer is just `startValue - target`.",
          "`target + 1` stays within 32 bits for `target <= 10^9`, so no overflow occurs.",
        ],
      }),
      examples: [
        { input: "4\n13", expectedOutput: "4" },
        { input: "9\n3", expectedOutput: "6" },
        { input: "5\n32", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 4);
        let s: number, t: number;
        if (cls <= 2) { s = ri(rng, 1, 300); t = ri(rng, 1, 300); if (cls === 2) t = Math.min(300, s * ri(rng, 1, 8) + ri(rng, -3, 3)); if (t < 1) t = 1; }
        else if (cls === 3) { s = ri(rng, 1, 1000); t = ri(rng, 1, 1000000000); }
        else { s = ri(rng, 1, 1000000000); t = pick(rng, [1, 1000000000, ri(rng, 1, 1000000000)]); }
        const out = s <= 300 && t <= 300 ? bfs(s, t) : backward(s, t);
        return { input: `${s}\n${t}`, expectedOutput: String(out) };
      },
      solutions: {
        python: code`
          def brokenCalc(startValue: int, target: int) -> int:
              ops = 0
              while target > startValue:
                  if target % 2 == 1:
                      target += 1
                  else:
                      target //= 2
                  ops += 1
              return ops + startValue - target
        `,
        javascript: code`
          var brokenCalc = function(startValue, target) {
              var ops = 0;
              while (target > startValue) {
                  if (target % 2 === 1) target++;
                  else target /= 2;
                  ops++;
              }
              return ops + startValue - target;
          };
        `,
        typescript: code`
          function brokenCalc(startValue: number, target: number): number {
              var ops = 0;
              while (target > startValue) {
                  if (target % 2 === 1) target++;
                  else target /= 2;
                  ops++;
              }
              return ops + startValue - target;
          }
        `,
        java: code`
          public static int brokenCalc(int startValue, int target) {
              int ops = 0;
              while (target > startValue) {
                  if (target % 2 == 1) target++;
                  else target /= 2;
                  ops++;
              }
              return ops + startValue - target;
          }
        `,
        cpp: code`
          int brokenCalc(int startValue, int target) {
              int ops = 0;
              while (target > startValue) {
                  if (target % 2 == 1) target++;
                  else target /= 2;
                  ops++;
              }
              return ops + startValue - target;
          }
        `,
        c: code`
          int brokenCalc(int startValue, int target) {
              int ops = 0;
              while (target > startValue) {
                  if (target % 2 == 1) target++;
                  else target /= 2;
                  ops++;
              }
              return ops + startValue - target;
          }
        `,
        csharp: code`
          public static int BrokenCalc(int startValue, int target)
          {
              int ops = 0;
              while (target > startValue)
              {
                  if (target % 2 == 1) target++;
                  else target /= 2;
                  ops++;
              }
              return ops + startValue - target;
          }
        `,
        go: code`
          func brokenCalc(startValue int, target int) int {
          	ops := 0
          	for target > startValue {
          		if target%2 == 1 {
          			target++
          		} else {
          			target /= 2
          		}
          		ops++
          	}
          	return ops + startValue - target
          }
        `,
        kotlin: code`
          fun brokenCalc(startValue: Int, target: Int): Int {
              var t = target
              var ops = 0
              while (t > startValue) {
                  if (t % 2 == 1) {
                      t++
                  } else {
                      t /= 2
                  }
                  ops++
              }
              return ops + startValue - t
          }
        `,
        swift: code`
          func brokenCalc(_ startValue: Int, _ target: Int) -> Int {
              var t = target
              var ops = 0
              while t > startValue {
                  if t % 2 == 1 { t += 1 } else { t /= 2 }
                  ops += 1
              }
              return ops + startValue - t
          }
        `,
        rust: code`
          fn brokenCalc(startValue: i32, target: i32) -> i32 {
              let mut t = target;
              let mut ops = 0;
              while t > startValue {
                  if t % 2 == 1 {
                      t += 1;
                  } else {
                      t /= 2;
                  }
                  ops += 1;
              }
              ops + startValue - t
          }
        `,
        php: code`
          function brokenCalc($startValue, $target) {
              $ops = 0;
              while ($target > $startValue) {
                  if ($target % 2 == 1) $target++;
                  else $target = intdiv($target, 2);
                  $ops++;
              }
              return $ops + $startValue - $target;
          }
        `,
        ruby: code`
          def brokenCalc(startValue, target)
            ops = 0
            while target > startValue
              if target.odd?
                target += 1
              else
                target /= 2
              end
              ops += 1
            end
            ops + startValue - target
          end
        `,
      },
    };
  })(),

  // ── Score After Flipping Matrix (LC 861) ─────────────────────────
  (() => {
    // Brute force over every set of row flips; with rows fixed, each column is
    // flipped independently to keep the majority of ones.
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      let best = 0;
      for (let mask = 0; mask < 1 << m; mask++) {
        let total = 0;
        for (let j = 0; j < n; j++) {
          let ones = 0;
          for (let i = 0; i < m; i++) ones += grid[i][j] ^ ((mask >> i) & 1);
          total += Math.max(ones, m - ones) * 2 ** (n - 1 - j);
        }
        best = Math.max(best, total);
      }
      return best;
    };
    return {
      slug: "score-after-flipping-matrix",
      title: "Score After Flipping Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Bit Manipulation", "Matrix", "Amazon", "Google"],
      signature: { funcName: "matrixScore", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` binary matrix `grid`. A **move** picks one whole row or one whole column and toggles every cell in it (0 becomes 1, 1 becomes 0). You may make any number of moves.\n\nAfterwards each row is read as a binary number, most significant bit on the left, and the **score** is the sum of these numbers.\n\nReturn the highest score you can reach.",
        [
          { in: "grid = [[0,0,1,1],[1,0,1,0],[1,1,0,0]]", out: "39", note: "Flip row 0, then columns 2 and 3: rows read 1111, 1001, 1111 = 15 + 9 + 15." },
          { in: "grid = [[1,0,1],[0,1,1]]", out: "13" },
          { in: "grid = [[0]]", out: "1" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 20", "grid[i][j] is 0 or 1"]),
      hints: [
        "The leftmost bit of a row is worth more than all the other bits of that row combined.",
        "So every row should start with a 1 — flip the rows that start with 0.",
        "After that, columns are independent: flip a column whenever it has more zeros than ones.",
      ],
      editorial: explain({
        idea: "The leading bit dominates: `2^(n-1)` exceeds the sum of all lower bits. So first make every row start with 1 using row flips, then choose each remaining column's flip by majority.",
        steps: [
          "Conceptually flip every row whose first cell is 0. A cell `(i, j)` then holds 1 exactly when `grid[i][j] == grid[i][0]`.",
          "For each column `j`, count `ones` under that rule and take `max(ones, m - ones)` — flipping the column if zeros are the majority.",
          "Add `max(ones, m - ones) · 2^(n - 1 - j)` to the score.",
        ],
        why: "Any row with a leading 0 loses `2^(n-1)`, more than it can gain from the rest of its bits, so an optimal answer has every leading bit 1 (column 0 is never flipped afterwards). Once the row flips are fixed, column flips do not interact: each column contributes its count of ones times its place value, and flipping it swaps `ones` for `m - ones`.",
        time: "O(m · n)",
        space: "O(1)",
        pitfalls: [
          "Do not flip column 0 after fixing the rows — it is already all ones.",
          "Count a cell as 1 after the row flip, i.e. compare it to the row's first cell rather than reading the raw value.",
          "With `n <= 20` the score stays below `20 · 2^20`, so 32-bit integers suffice.",
        ],
      }),
      examples: [
        { input: "[[0,0,1,1],[1,0,1,0],[1,1,0,0]]", expectedOutput: "39" },
        { input: "[[1,0,1],[0,1,1]]", expectedOutput: "13" },
        { input: "[[0]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 3);
        const m = cls === 3 ? ri(rng, 1, 3) : ri(rng, 1, 8);
        const n = cls === 3 ? ri(rng, 10, 20) : ri(rng, 1, 10);
        const dens = pick(rng, [0.1, 0.5, 0.5, 0.9]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < dens ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def matrixScore(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              total = 0
              for j in range(n):
                  ones = sum(1 for i in range(m) if grid[i][j] == grid[i][0])
                  total += max(ones, m - ones) << (n - 1 - j)
              return total
        `,
        javascript: code`
          var matrixScore = function(grid) {
              var m = grid.length, n = grid[0].length;
              var total = 0;
              for (var j = 0; j < n; j++) {
                  var ones = 0;
                  for (var i = 0; i < m; i++) if (grid[i][j] === grid[i][0]) ones++;
                  total += Math.max(ones, m - ones) * (1 << (n - 1 - j));
              }
              return total;
          };
        `,
        typescript: code`
          function matrixScore(grid: number[][]): number {
              var m = grid.length, n = grid[0].length;
              var total = 0;
              for (var j = 0; j < n; j++) {
                  var ones = 0;
                  for (var i = 0; i < m; i++) if (grid[i][j] === grid[i][0]) ones++;
                  total += Math.max(ones, m - ones) * (1 << (n - 1 - j));
              }
              return total;
          }
        `,
        java: code`
          public static int matrixScore(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              int total = 0;
              for (int j = 0; j < n; j++) {
                  int ones = 0;
                  for (int i = 0; i < m; i++) if (grid[i][j] == grid[i][0]) ones++;
                  total += Math.max(ones, m - ones) * (1 << (n - 1 - j));
              }
              return total;
          }
        `,
        cpp: code`
          int matrixScore(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              int total = 0;
              for (int j = 0; j < n; j++) {
                  int ones = 0;
                  for (int i = 0; i < m; i++) if (grid[i][j] == grid[i][0]) ones++;
                  total += max(ones, m - ones) * (1 << (n - 1 - j));
              }
              return total;
          }
        `,
        c: code`
          int matrixScore(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0];
              int total = 0;
              for (int j = 0; j < n; j++) {
                  int ones = 0;
                  for (int i = 0; i < m; i++) if (grid[i][j] == grid[i][0]) ones++;
                  int best = ones > m - ones ? ones : m - ones;
                  total += best * (1 << (n - 1 - j));
              }
              return total;
          }
        `,
        csharp: code`
          public static int MatrixScore(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              int total = 0;
              for (int j = 0; j < n; j++)
              {
                  int ones = 0;
                  for (int i = 0; i < m; i++) if (grid[i][j] == grid[i][0]) ones++;
                  total += Math.Max(ones, m - ones) * (1 << (n - 1 - j));
              }
              return total;
          }
        `,
        go: code`
          func matrixScore(grid [][]int) int {
          	m, n := len(grid), len(grid[0])
          	total := 0
          	for j := 0; j < n; j++ {
          		ones := 0
          		for i := 0; i < m; i++ {
          			if grid[i][j] == grid[i][0] {
          				ones++
          			}
          		}
          		best := ones
          		if m-ones > best {
          			best = m - ones
          		}
          		total += best << uint(n-1-j)
          	}
          	return total
          }
        `,
        kotlin: code`
          fun matrixScore(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              var total = 0
              for (j in 0 until n) {
                  var ones = 0
                  for (i in 0 until m) if (grid[i][j] == grid[i][0]) ones++
                  total += maxOf(ones, m - ones) * (1 shl (n - 1 - j))
              }
              return total
          }
        `,
        swift: code`
          func matrixScore(_ grid: [[Int]]) -> Int {
              let m = grid.count
              let n = grid[0].count
              var total = 0
              for j in 0..<n {
                  var ones = 0
                  for i in 0..<m where grid[i][j] == grid[i][0] { ones += 1 }
                  total += max(ones, m - ones) * (1 << (n - 1 - j))
              }
              return total
          }
        `,
        rust: code`
          fn matrixScore(grid: Vec<Vec<i32>>) -> i32 {
              let m = grid.len();
              let n = grid[0].len();
              let mut total: i32 = 0;
              for j in 0..n {
                  let mut ones: i32 = 0;
                  for i in 0..m {
                      if grid[i][j] == grid[i][0] {
                          ones += 1;
                      }
                  }
                  let best = std::cmp::max(ones, m as i32 - ones);
                  total += best * (1 << (n - 1 - j));
              }
              total
          }
        `,
        php: code`
          function matrixScore($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $total = 0;
              for ($j = 0; $j < $n; $j++) {
                  $ones = 0;
                  for ($i = 0; $i < $m; $i++) {
                      if ($grid[$i][$j] == $grid[$i][0]) $ones++;
                  }
                  $total += max($ones, $m - $ones) * (1 << ($n - 1 - $j));
              }
              return $total;
          }
        `,
        ruby: code`
          def matrixScore(grid)
            m = grid.length
            n = grid[0].length
            total = 0
            (0...n).each do |j|
              ones = (0...m).count { |i| grid[i][j] == grid[i][0] }
              total += [ones, m - ones].max << (n - 1 - j)
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Patching Array (LC 330) ──────────────────────────────────────
  (() => {
    // Small n: compute the reachable subset sums outright and keep adding the
    // smallest value that cannot be formed.
    const subsetRef = (nums: number[], n: number) => {
      const items = nums.slice();
      let patches = 0;
      for (;;) {
        const reach = new Uint8Array(n + 1);
        reach[0] = 1;
        for (const v of items) for (let s = n; s >= v; s--) if (reach[s - v]) reach[s] = 1;
        let miss = -1;
        for (let s = 1; s <= n; s++) if (!reach[s]) { miss = s; break; }
        if (miss < 0) return patches;
        items.push(miss);
        patches++;
      }
    };
    const greedyRef = (nums: number[], n: number) => {
      let reach = 0, i = 0, patches = 0;
      while (reach < n) {
        if (i < nums.length && nums[i] <= reach + 1) reach += nums[i++];
        else { reach += reach + 1; patches++; }
      }
      return patches;
    };
    return {
      slug: "patching-array",
      title: "Patching Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Google", "Amazon"],
      signature: {
        funcName: "minPatches",
        params: [{ name: "nums", type: "int[]" as const }, { name: "n", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a sorted array of positive integers `nums` and an integer `n`. You may **patch** the array by inserting any positive integer into it.\n\nReturn the minimum number of patches needed so that **every** integer in the range `[1, n]` can be written as the sum of some elements of the array (each element used at most once).",
        [
          { in: "nums = [2,4], n = 10", out: "2", note: "Adding 1 makes every value up to 7 reachable; adding 8 then covers 8 to 15." },
          { in: "nums = [1,2,2], n = 5", out: "0", note: "1, 2, 1+2, 2+2 and 1+2+2 already cover 1 to 5." },
          { in: "nums = [3,7], n = 50", out: "4", note: "Patch 1, 2, 14 and 28." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 10^4", "nums is sorted in ascending order", "1 <= n <= 2^31 - 1"]),
      hints: [
        "Suppose every value in `[1, reach]` can already be formed. What happens when you add a number `x <= reach + 1`?",
        "Then every value up to `reach + x` can be formed. If the next array element is larger than `reach + 1`, the value `reach + 1` can never be formed without a patch.",
        "Patch with exactly `reach + 1` — it doubles the covered range, the most any single patch can do.",
      ],
      editorial: explain({
        idea: "Track the prefix `[1, reach]` of values that can be formed. An element `x <= reach + 1` extends it to `reach + x`; when the next element is too big, the gap `reach + 1` must be patched, and patching exactly `reach + 1` extends the range the furthest.",
        steps: [
          "Start with `miss = 1` (the smallest value not yet formable), index `i = 0` and `patches = 0`. Use 64-bit arithmetic: `miss` can exceed `2^31`.",
          "While `miss <= n`: if `i` is in range and `nums[i] <= miss`, set `miss += nums[i]` and advance `i`.",
          "Otherwise patch with `miss` itself: `miss += miss` and count a patch.",
          "Return `patches`.",
        ],
        why: "If every value below `miss` is formable and we add `x <= miss`, every value below `miss + x` becomes formable (old sums, plus `x` added to them). If the next element exceeds `miss`, no subset of the remaining elements can form `miss`, so some patch `p <= miss` is required, and `p = miss` gives the largest new range `[1, 2·miss)`. Any optimal solution can be exchanged for this one without needing more patches.",
        time: "O(len(nums) + log n)",
        space: "O(1)",
        pitfalls: [
          "`miss` can reach about `2^32` when `n` is near `2^31 - 1` — use a 64-bit counter.",
          "Use the array elements whenever they fit; patching is only for real gaps.",
          "Elements larger than `n` are simply never needed.",
        ],
      }),
      examples: [
        { input: "[2,4]\n10", expectedOutput: "2" },
        { input: "[1,2,2]\n5", expectedOutput: "0" },
        { input: "[3,7]\n50", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 4);
        let nums: number[], n: number, out: number;
        if (cls <= 2) {
          const len = ri(rng, 1, 10);
          nums = Array.from({ length: len }, () => ri(rng, 1, pick(rng, [3, 10, 40]))).sort((a, b) => a - b);
          n = ri(rng, 1, 120);
          out = subsetRef(nums, n);
        } else {
          const len = ri(rng, 1, 40);
          nums = Array.from({ length: len }, () => ri(rng, 1, pick(rng, [10, 1000, 10000]))).sort((a, b) => a - b);
          n = pick(rng, [2147483647, ri(rng, 1, 2147483647), ri(rng, 1, 100000)]);
          out = greedyRef(nums, n);
        }
        return { input: `${fmtIntArr(nums)}\n${n}`, expectedOutput: String(out) };
      },
      solutions: {
        python: code`
          from typing import List

          def minPatches(nums: List[int], n: int) -> int:
              miss = 1
              i = 0
              patches = 0
              while miss <= n:
                  if i < len(nums) and nums[i] <= miss:
                      miss += nums[i]
                      i += 1
                  else:
                      miss += miss
                      patches += 1
              return patches
        `,
        javascript: code`
          var minPatches = function(nums, n) {
              var miss = 1, i = 0, patches = 0;
              while (miss <= n) {
                  if (i < nums.length && nums[i] <= miss) { miss += nums[i]; i++; }
                  else { miss += miss; patches++; }
              }
              return patches;
          };
        `,
        typescript: code`
          function minPatches(nums: number[], n: number): number {
              var miss = 1, i = 0, patches = 0;
              while (miss <= n) {
                  if (i < nums.length && nums[i] <= miss) { miss += nums[i]; i++; }
                  else { miss += miss; patches++; }
              }
              return patches;
          }
        `,
        java: code`
          public static int minPatches(int[] nums, int n) {
              long miss = 1;
              int i = 0, patches = 0;
              while (miss <= n) {
                  if (i < nums.length && nums[i] <= miss) { miss += nums[i]; i++; }
                  else { miss += miss; patches++; }
              }
              return patches;
          }
        `,
        cpp: code`
          int minPatches(vector<int>& nums, int n) {
              long long miss = 1;
              int i = 0, patches = 0;
              while (miss <= n) {
                  if (i < (int)nums.size() && nums[i] <= miss) { miss += nums[i]; i++; }
                  else { miss += miss; patches++; }
              }
              return patches;
          }
        `,
        c: code`
          int minPatches(int* nums, int numsSize, int n) {
              long long miss = 1;
              int i = 0, patches = 0;
              while (miss <= n) {
                  if (i < numsSize && nums[i] <= miss) { miss += nums[i]; i++; }
                  else { miss += miss; patches++; }
              }
              return patches;
          }
        `,
        csharp: code`
          public static int MinPatches(int[] nums, int n)
          {
              long miss = 1;
              int i = 0, patches = 0;
              while (miss <= n)
              {
                  if (i < nums.Length && nums[i] <= miss) { miss += nums[i]; i++; }
                  else { miss += miss; patches++; }
              }
              return patches;
          }
        `,
        go: code`
          func minPatches(nums []int, n int) int {
          	var miss int64 = 1
          	limit := int64(n)
          	i, patches := 0, 0
          	for miss <= limit {
          		if i < len(nums) && int64(nums[i]) <= miss {
          			miss += int64(nums[i])
          			i++
          		} else {
          			miss += miss
          			patches++
          		}
          	}
          	return patches
          }
        `,
        kotlin: code`
          fun minPatches(nums: IntArray, n: Int): Int {
              var miss = 1L
              var i = 0
              var patches = 0
              while (miss <= n) {
                  if (i < nums.size && nums[i] <= miss) {
                      miss += nums[i]
                      i++
                  } else {
                      miss += miss
                      patches++
                  }
              }
              return patches
          }
        `,
        swift: code`
          func minPatches(_ nums: [Int], _ n: Int) -> Int {
              var miss = 1
              var i = 0
              var patches = 0
              while miss <= n {
                  if i < nums.count && nums[i] <= miss {
                      miss += nums[i]
                      i += 1
                  } else {
                      miss += miss
                      patches += 1
                  }
              }
              return patches
          }
        `,
        rust: code`
          fn minPatches(nums: Vec<i32>, n: i32) -> i32 {
              let mut miss: i64 = 1;
              let limit = n as i64;
              let mut i = 0usize;
              let mut patches = 0;
              while miss <= limit {
                  if i < nums.len() && (nums[i] as i64) <= miss {
                      miss += nums[i] as i64;
                      i += 1;
                  } else {
                      miss += miss;
                      patches += 1;
                  }
              }
              patches
          }
        `,
        php: code`
          function minPatches($nums, $n) {
              $miss = 1;
              $i = 0;
              $patches = 0;
              $len = count($nums);
              while ($miss <= $n) {
                  if ($i < $len && $nums[$i] <= $miss) { $miss += $nums[$i]; $i++; }
                  else { $miss += $miss; $patches++; }
              }
              return $patches;
          }
        `,
        ruby: code`
          def minPatches(nums, n)
            miss = 1
            i = 0
            patches = 0
            while miss <= n
              if i < nums.length && nums[i] <= miss
                miss += nums[i]
                i += 1
              else
                miss += miss
                patches += 1
              end
            end
            patches
          end
        `,
      },
    };
  })(),

  // ── Create Maximum Number (LC 321) ───────────────────────────────
  (() => {
    // DP over (i, j, t): the largest length-t sequence drawn from a[i..], b[j..]
    // keeping each array's order — every interleaving is reachable.
    const ref = (a: number[], b: number[], k: number) => {
      const m = a.length, n = b.length;
      const memo = new Map<number, number[]>();
      const cmp = (x: number[], y: number[]) => {
        for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
        return 0;
      };
      const best = (i: number, j: number, t: number): number[] => {
        if (t === 0) return [];
        const key = (i * 64 + j) * 64 + t;
        const hit = memo.get(key);
        if (hit) return hit;
        let res: number[] | null = null;
        const consider = (c: number[]) => { if (res === null || cmp(c, res) > 0) res = c; };
        const rem = (m - i) + (n - j);
        if (i < m) {
          consider([a[i], ...best(i + 1, j, t - 1)]);
          if (rem - 1 >= t) consider(best(i + 1, j, t));
        }
        if (j < n) {
          consider([b[j], ...best(i, j + 1, t - 1)]);
          if (rem - 1 >= t) consider(best(i, j + 1, t));
        }
        memo.set(key, res!);
        return res!;
      };
      return best(0, 0, k);
    };
    return {
      slug: "create-maximum-number",
      title: "Create Maximum Number",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Stack", "Monotonic Stack", "Google", "Amazon"],
      signature: {
        funcName: "maxNumber",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Two arrays `nums1` and `nums2` hold the digits of two numbers (each element is a digit `0`–`9`). Pick exactly `k` digits in total from the two arrays and line them up into a new number. The digits taken from the same array must keep their original relative order; digits from the two arrays may be interleaved freely.\n\nReturn the largest number you can build, as an array of its `k` digits.",
        [
          { in: "nums1 = [3,4,6,5], nums2 = [9,1,2,5,8,3], k = 5", out: "[9,8,6,5,3]" },
          { in: "nums1 = [6,7], nums2 = [6,0,4], k = 5", out: "[6,7,6,0,4]", note: "All five digits are used; starting with `nums1`'s 6 lets the 7 come second." },
          { in: "nums1 = [2,8,1], nums2 = [7,3,9], k = 3", out: "[9,8,1]", note: "Take the 9 from `nums2` first, then 8 and 1 from `nums1`." },
        ],
        ["m == nums1.length", "n == nums2.length", "1 <= m, n <= 500", "0 <= nums1[i], nums2[i] <= 9", "1 <= k <= m + n"]),
      hints: [
        "Split the job: take `s` digits from `nums1` and `k - s` from `nums2`, for every feasible `s`.",
        "The best `t` digits of a single array, in order, come from a monotonic stack: pop a smaller top while you can still afford to drop digits.",
        "Merge the two picks like merge sort, but when the heads are equal compare the **remaining suffixes** to decide which array to take from. Keep the best merged result over all `s`.",
      ],
      editorial: explain({
        idea: "Any answer takes some `s` digits from `nums1` and `k - s` from `nums2`. For a fixed `s`, the best choice from each array is its lexicographically largest subsequence of that length, and the best interleaving of two sequences is a greedy merge that compares suffixes.",
        steps: [
          "For `s` from `max(0, k - n)` to `min(k, m)`:",
          "Pick the largest length-`s` subsequence of `nums1` with a stack: for each digit, while digits may still be dropped and the top is smaller, pop; then push. Keep the first `s`. Do the same for `nums2` with `k - s`.",
          "Merge: repeatedly take the head of the sequence whose remaining suffix is lexicographically larger (a suffix that is a prefix of the other counts as smaller).",
          "Keep the largest merged array over all `s` and return it.",
        ],
        why: "Fix how many digits come from each array. The merged number is maximised by maximising each part (a lexicographically larger part can never yield a smaller merge), and the stack produces the largest subsequence of a given length because each pop replaces a digit by a larger one at an earlier position. In the merge, comparing whole suffixes on a tie picks the array whose next differing digit is larger, which can only be reached sooner by taking from it first.",
        time: "O(k · (m + n)^2) in the worst case",
        space: "O(m + n)",
        pitfalls: [
          "On equal heads, comparing only the next digit is not enough — compare the full remaining suffixes (e.g. `[6,7]` vs `[6,0,4]`).",
          "The range of `s` is limited by both lengths: `max(0, k - n) <= s <= min(k, m)`.",
          "In the stack, track how many digits may still be dropped; stop popping when that runs out.",
        ],
      }),
      examples: [
        { input: "[3,4,6,5]\n[9,1,2,5,8,3]\n5", expectedOutput: "[9,8,6,5,3]" },
        { input: "[6,7]\n[6,0,4]\n5", expectedOutput: "[6,7,6,0,4]" },
        { input: "[2,8,1]\n[7,3,9]\n3", expectedOutput: "[9,8,1]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const span = pick(rng, [1, 2, 3, 9, 9]);
        const lo = ri(rng, 0, 9 - Math.min(span, 9));
        const a = Array.from({ length: m }, () => lo + ri(rng, 0, span));
        const b = Array.from({ length: n }, () => lo + ri(rng, 0, span));
        const k = pick(rng, [1, m + n, ri(rng, 1, m + n), ri(rng, 1, m + n)]);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}\n${k}`, expectedOutput: fmtIntArr(ref(a, b, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxNumber(nums1: List[int], nums2: List[int], k: int) -> List[int]:
              def pick(a, t):
                  st = []
                  drop = len(a) - t
                  for x in a:
                      while drop > 0 and st and st[-1] < x:
                          st.pop()
                          drop -= 1
                      st.append(x)
                  return st[:t]

              def merge(a, b):
                  res = []
                  i = j = 0
                  while i < len(a) or j < len(b):
                      if a[i:] > b[j:]:
                          res.append(a[i])
                          i += 1
                      else:
                          res.append(b[j])
                          j += 1
                  return res

              m, n = len(nums1), len(nums2)
              best = []
              for s in range(max(0, k - n), min(k, m) + 1):
                  cand = merge(pick(nums1, s), pick(nums2, k - s))
                  if cand > best:
                      best = cand
              return best
        `,
        javascript: code`
          var maxNumber = function(nums1, nums2, k) {
              var pickMax = function(a, t) {
                  var st = [], drop = a.length - t;
                  for (var i = 0; i < a.length; i++) {
                      while (drop > 0 && st.length > 0 && st[st.length - 1] < a[i]) { st.pop(); drop--; }
                      st.push(a[i]);
                  }
                  return st.slice(0, t);
              };
              var greater = function(a, i, b, j) {
                  while (i < a.length && j < b.length && a[i] === b[j]) { i++; j++; }
                  return j === b.length || (i < a.length && a[i] > b[j]);
              };
              var merge = function(a, b) {
                  var res = [], i = 0, j = 0;
                  while (i < a.length || j < b.length) {
                      if (greater(a, i, b, j)) res.push(a[i++]);
                      else res.push(b[j++]);
                  }
                  return res;
              };
              var m = nums1.length, n = nums2.length;
              var best = [];
              for (var s = Math.max(0, k - n); s <= Math.min(k, m); s++) {
                  var cand = merge(pickMax(nums1, s), pickMax(nums2, k - s));
                  if (greater(cand, 0, best, 0)) best = cand;
              }
              return best;
          };
        `,
        typescript: code`
          function maxNumber(nums1: number[], nums2: number[], k: number): number[] {
              var pickMax = function(a: number[], t: number): number[] {
                  var st: number[] = [];
                  var drop = a.length - t;
                  for (var i = 0; i < a.length; i++) {
                      while (drop > 0 && st.length > 0 && st[st.length - 1] < a[i]) { st.pop(); drop--; }
                      st.push(a[i]);
                  }
                  return st.slice(0, t);
              };
              var greater = function(a: number[], i: number, b: number[], j: number): boolean {
                  while (i < a.length && j < b.length && a[i] === b[j]) { i++; j++; }
                  return j === b.length || (i < a.length && a[i] > b[j]);
              };
              var merge = function(a: number[], b: number[]): number[] {
                  var res: number[] = [];
                  var i = 0, j = 0;
                  while (i < a.length || j < b.length) {
                      if (greater(a, i, b, j)) res.push(a[i++]);
                      else res.push(b[j++]);
                  }
                  return res;
              };
              var m = nums1.length, n = nums2.length;
              var best: number[] = [];
              for (var s = Math.max(0, k - n); s <= Math.min(k, m); s++) {
                  var cand = merge(pickMax(nums1, s), pickMax(nums2, k - s));
                  if (greater(cand, 0, best, 0)) best = cand;
              }
              return best;
          }
        `,
        java: code`
          private static int[] pickMaxMN(int[] a, int t) {
              int[] st = new int[a.length];
              int top = 0, drop = a.length - t;
              for (int x : a) {
                  while (drop > 0 && top > 0 && st[top - 1] < x) { top--; drop--; }
                  st[top++] = x;
              }
              return Arrays.copyOf(st, t);
          }

          private static boolean greaterMN(int[] a, int i, int[] b, int j) {
              while (i < a.length && j < b.length && a[i] == b[j]) { i++; j++; }
              return j == b.length || (i < a.length && a[i] > b[j]);
          }

          public static int[] maxNumber(int[] nums1, int[] nums2, int k) {
              int m = nums1.length, n = nums2.length;
              int[] best = new int[0];
              for (int s = Math.max(0, k - n); s <= Math.min(k, m); s++) {
                  int[] a = pickMaxMN(nums1, s), b = pickMaxMN(nums2, k - s);
                  int[] cand = new int[k];
                  int i = 0, j = 0, p = 0;
                  while (i < a.length || j < b.length) {
                      if (greaterMN(a, i, b, j)) cand[p++] = a[i++];
                      else cand[p++] = b[j++];
                  }
                  if (greaterMN(cand, 0, best, 0)) best = cand;
              }
              return best;
          }
        `,
        cpp: code`
          static vector<int> pickMaxMN(const vector<int>& a, int t) {
              vector<int> st;
              int drop = (int)a.size() - t;
              for (int x : a) {
                  while (drop > 0 && !st.empty() && st.back() < x) { st.pop_back(); drop--; }
                  st.push_back(x);
              }
              st.resize(t);
              return st;
          }

          static bool greaterMN(const vector<int>& a, int i, const vector<int>& b, int j) {
              while (i < (int)a.size() && j < (int)b.size() && a[i] == b[j]) { i++; j++; }
              return j == (int)b.size() || (i < (int)a.size() && a[i] > b[j]);
          }

          vector<int> maxNumber(vector<int>& nums1, vector<int>& nums2, int k) {
              int m = nums1.size(), n = nums2.size();
              vector<int> best;
              for (int s = max(0, k - n); s <= min(k, m); s++) {
                  vector<int> a = pickMaxMN(nums1, s), b = pickMaxMN(nums2, k - s);
                  vector<int> cand;
                  int i = 0, j = 0;
                  while (i < (int)a.size() || j < (int)b.size()) {
                      if (greaterMN(a, i, b, j)) cand.push_back(a[i++]);
                      else cand.push_back(b[j++]);
                  }
                  if (greaterMN(cand, 0, best, 0)) best = cand;
              }
              return best;
          }
        `,
        c: code`
          static int greaterMN(int* a, int an, int i, int* b, int bn, int j) {
              while (i < an && j < bn && a[i] == b[j]) { i++; j++; }
              return j == bn || (i < an && a[i] > b[j]);
          }

          static void pickMaxMN(int* a, int an, int t, int* out) {
              int* st = (int*)malloc(sizeof(int) * (an + 1));
              int top = 0, drop = an - t;
              for (int i = 0; i < an; i++) {
                  while (drop > 0 && top > 0 && st[top - 1] < a[i]) { top--; drop--; }
                  st[top++] = a[i];
              }
              for (int i = 0; i < t; i++) out[i] = st[i];
              free(st);
          }

          int* maxNumber(int* nums1, int nums1Size, int* nums2, int nums2Size, int k, int* returnSize) {
              int* best = (int*)malloc(sizeof(int) * (k + 1));
              int* a = (int*)malloc(sizeof(int) * (k + 1));
              int* b = (int*)malloc(sizeof(int) * (k + 1));
              int* cand = (int*)malloc(sizeof(int) * (k + 1));
              int have = 0;
              int lo = k - nums2Size > 0 ? k - nums2Size : 0;
              int hi = k < nums1Size ? k : nums1Size;
              for (int s = lo; s <= hi; s++) {
                  pickMaxMN(nums1, nums1Size, s, a);
                  pickMaxMN(nums2, nums2Size, k - s, b);
                  int i = 0, j = 0, p = 0;
                  while (i < s || j < k - s) {
                      if (greaterMN(a, s, i, b, k - s, j)) cand[p++] = a[i++];
                      else cand[p++] = b[j++];
                  }
                  if (!have || greaterMN(cand, k, 0, best, k, 0)) {
                      for (int q = 0; q < k; q++) best[q] = cand[q];
                      have = 1;
                  }
              }
              free(a);
              free(b);
              free(cand);
              *returnSize = k;
              return best;
          }
        `,
        csharp: code`
          private static int[] PickMaxMN(int[] a, int t)
          {
              int[] st = new int[a.Length];
              int top = 0, drop = a.Length - t;
              foreach (int x in a)
              {
                  while (drop > 0 && top > 0 && st[top - 1] < x) { top--; drop--; }
                  st[top++] = x;
              }
              int[] res = new int[t];
              Array.Copy(st, res, t);
              return res;
          }

          private static bool GreaterMN(int[] a, int i, int[] b, int j)
          {
              while (i < a.Length && j < b.Length && a[i] == b[j]) { i++; j++; }
              return j == b.Length || (i < a.Length && a[i] > b[j]);
          }

          public static int[] MaxNumber(int[] nums1, int[] nums2, int k)
          {
              int m = nums1.Length, n = nums2.Length;
              int[] best = new int[0];
              for (int s = Math.Max(0, k - n); s <= Math.Min(k, m); s++)
              {
                  int[] a = PickMaxMN(nums1, s), b = PickMaxMN(nums2, k - s);
                  int[] cand = new int[k];
                  int i = 0, j = 0, p = 0;
                  while (i < a.Length || j < b.Length)
                  {
                      if (GreaterMN(a, i, b, j)) cand[p++] = a[i++];
                      else cand[p++] = b[j++];
                  }
                  if (GreaterMN(cand, 0, best, 0)) best = cand;
              }
              return best;
          }
        `,
        go: code`
          func pickMaxMN(a []int, t int) []int {
          	st := []int{}
          	drop := len(a) - t
          	for _, x := range a {
          		for drop > 0 && len(st) > 0 && st[len(st)-1] < x {
          			st = st[:len(st)-1]
          			drop--
          		}
          		st = append(st, x)
          	}
          	return st[:t]
          }

          func greaterMN(a []int, i int, b []int, j int) bool {
          	for i < len(a) && j < len(b) && a[i] == b[j] {
          		i++
          		j++
          	}
          	return j == len(b) || (i < len(a) && a[i] > b[j])
          }

          func maxNumber(nums1 []int, nums2 []int, k int) []int {
          	m, n := len(nums1), len(nums2)
          	best := []int{}
          	lo := k - n
          	if lo < 0 {
          		lo = 0
          	}
          	hi := k
          	if m < hi {
          		hi = m
          	}
          	for s := lo; s <= hi; s++ {
          		a := pickMaxMN(nums1, s)
          		b := pickMaxMN(nums2, k-s)
          		cand := make([]int, 0, k)
          		i, j := 0, 0
          		for i < len(a) || j < len(b) {
          			if greaterMN(a, i, b, j) {
          				cand = append(cand, a[i])
          				i++
          			} else {
          				cand = append(cand, b[j])
          				j++
          			}
          		}
          		if greaterMN(cand, 0, best, 0) {
          			best = cand
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun pickMaxMN(a: IntArray, t: Int): IntArray {
              val st = IntArray(a.size)
              var top = 0
              var drop = a.size - t
              for (x in a) {
                  while (drop > 0 && top > 0 && st[top - 1] < x) {
                      top--
                      drop--
                  }
                  st[top++] = x
              }
              return st.copyOf(t)
          }

          fun greaterMN(a: IntArray, i0: Int, b: IntArray, j0: Int): Boolean {
              var i = i0
              var j = j0
              while (i < a.size && j < b.size && a[i] == b[j]) {
                  i++
                  j++
              }
              return j == b.size || (i < a.size && a[i] > b[j])
          }

          fun maxNumber(nums1: IntArray, nums2: IntArray, k: Int): IntArray {
              val m = nums1.size
              val n = nums2.size
              var best = IntArray(0)
              for (s in maxOf(0, k - n)..minOf(k, m)) {
                  val a = pickMaxMN(nums1, s)
                  val b = pickMaxMN(nums2, k - s)
                  val cand = IntArray(k)
                  var i = 0
                  var j = 0
                  var p = 0
                  while (i < a.size || j < b.size) {
                      if (greaterMN(a, i, b, j)) {
                          cand[p++] = a[i++]
                      } else {
                          cand[p++] = b[j++]
                      }
                  }
                  if (greaterMN(cand, 0, best, 0)) best = cand
              }
              return best
          }
        `,
        swift: code`
          func pickMaxMN(_ a: [Int], _ t: Int) -> [Int] {
              var st = [Int]()
              var drop = a.count - t
              for x in a {
                  while drop > 0 && !st.isEmpty && st[st.count - 1] < x {
                      st.removeLast()
                      drop -= 1
                  }
                  st.append(x)
              }
              return Array(st[0..<t])
          }

          func greaterMN(_ a: [Int], _ i0: Int, _ b: [Int], _ j0: Int) -> Bool {
              var i = i0
              var j = j0
              while i < a.count && j < b.count && a[i] == b[j] {
                  i += 1
                  j += 1
              }
              return j == b.count || (i < a.count && a[i] > b[j])
          }

          func maxNumber(_ nums1: [Int], _ nums2: [Int], _ k: Int) -> [Int] {
              let m = nums1.count
              let n = nums2.count
              var best = [Int]()
              var s = max(0, k - n)
              while s <= min(k, m) {
                  let a = pickMaxMN(nums1, s)
                  let b = pickMaxMN(nums2, k - s)
                  var cand = [Int]()
                  var i = 0
                  var j = 0
                  while i < a.count || j < b.count {
                      if greaterMN(a, i, b, j) {
                          cand.append(a[i])
                          i += 1
                      } else {
                          cand.append(b[j])
                          j += 1
                      }
                  }
                  if greaterMN(cand, 0, best, 0) { best = cand }
                  s += 1
              }
              return best
          }
        `,
        rust: code`
          fn pick_max_mn(a: &Vec<i32>, t: usize) -> Vec<i32> {
              let mut st: Vec<i32> = Vec::new();
              let mut drop = a.len() - t;
              for &x in a.iter() {
                  while drop > 0 && !st.is_empty() && *st.last().unwrap() < x {
                      st.pop();
                      drop -= 1;
                  }
                  st.push(x);
              }
              st.truncate(t);
              st
          }

          fn greater_mn(a: &Vec<i32>, i0: usize, b: &Vec<i32>, j0: usize) -> bool {
              let mut i = i0;
              let mut j = j0;
              while i < a.len() && j < b.len() && a[i] == b[j] {
                  i += 1;
                  j += 1;
              }
              j == b.len() || (i < a.len() && a[i] > b[j])
          }

          fn maxNumber(nums1: Vec<i32>, nums2: Vec<i32>, k: i32) -> Vec<i32> {
              let k = k as usize;
              let m = nums1.len();
              let n = nums2.len();
              let lo = if k > n { k - n } else { 0 };
              let hi = std::cmp::min(k, m);
              let mut best: Vec<i32> = Vec::new();
              for s in lo..(hi + 1) {
                  let a = pick_max_mn(&nums1, s);
                  let b = pick_max_mn(&nums2, k - s);
                  let mut cand: Vec<i32> = Vec::with_capacity(k);
                  let mut i = 0;
                  let mut j = 0;
                  while i < a.len() || j < b.len() {
                      if greater_mn(&a, i, &b, j) {
                          cand.push(a[i]);
                          i += 1;
                      } else {
                          cand.push(b[j]);
                          j += 1;
                      }
                  }
                  if greater_mn(&cand, 0, &best, 0) {
                      best = cand;
                  }
              }
              best
          }
        `,
        php: code`
          function pickMaxMN($a, $t) {
              $st = [];
              $drop = count($a) - $t;
              foreach ($a as $x) {
                  while ($drop > 0 && count($st) > 0 && $st[count($st) - 1] < $x) {
                      array_pop($st);
                      $drop--;
                  }
                  $st[] = $x;
              }
              return array_slice($st, 0, $t);
          }

          function greaterMN($a, $i, $b, $j) {
              $an = count($a);
              $bn = count($b);
              while ($i < $an && $j < $bn && $a[$i] == $b[$j]) { $i++; $j++; }
              return $j == $bn || ($i < $an && $a[$i] > $b[$j]);
          }

          function maxNumber($nums1, $nums2, $k) {
              $m = count($nums1);
              $n = count($nums2);
              $best = [];
              for ($s = max(0, $k - $n); $s <= min($k, $m); $s++) {
                  $a = pickMaxMN($nums1, $s);
                  $b = pickMaxMN($nums2, $k - $s);
                  $cand = [];
                  $i = 0;
                  $j = 0;
                  while ($i < count($a) || $j < count($b)) {
                      if (greaterMN($a, $i, $b, $j)) { $cand[] = $a[$i]; $i++; }
                      else { $cand[] = $b[$j]; $j++; }
                  }
                  if (greaterMN($cand, 0, $best, 0)) $best = $cand;
              }
              return $best;
          }
        `,
        ruby: code`
          def maxNumber(nums1, nums2, k)
            pick = lambda do |a, t|
              st = []
              drop = a.length - t
              a.each do |x|
                while drop > 0 && !st.empty? && st[-1] < x
                  st.pop
                  drop -= 1
                end
                st << x
              end
              st[0, t]
            end
            greater = lambda do |a, i, b, j|
              while i < a.length && j < b.length && a[i] == b[j]
                i += 1
                j += 1
              end
              j == b.length || (i < a.length && a[i] > b[j])
            end
            m = nums1.length
            n = nums2.length
            best = []
            ([0, k - n].max..[k, m].min).each do |s|
              a = pick.call(nums1, s)
              b = pick.call(nums2, k - s)
              cand = []
              i = 0
              j = 0
              while i < a.length || j < b.length
                if greater.call(a, i, b, j)
                  cand << a[i]
                  i += 1
                else
                  cand << b[j]
                  j += 1
                end
              end
              best = cand if greater.call(cand, 0, best, 0)
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Couples Holding Hands (LC 765) ───────────────────────────────
  (() => {
    const done = (r: number[]) => {
      for (let i = 0; i < r.length; i += 2) if (r[i] >> 1 !== r[i + 1] >> 1) return false;
      return true;
    };
    // Tiny rows: breadth-first search over arbitrary swaps.
    const bfs = (row: number[]) => {
      const dist = new Map<string, number>([[row.join(","), 0]]);
      const q = [row.slice()];
      for (let h = 0; h < q.length; h++) {
        const cur = q[h];
        const d = dist.get(cur.join(","))!;
        if (done(cur)) return d;
        for (let a = 0; a < cur.length; a++) {
          for (let b = a + 1; b < cur.length; b++) {
            const nx = cur.slice();
            const t = nx[a]; nx[a] = nx[b]; nx[b] = t;
            const key = nx.join(",");
            if (!dist.has(key)) { dist.set(key, d + 1); q.push(nx); }
          }
        }
      }
      return -1;
    };
    // Larger rows: couples joined by shared seat pairs form cycles; a cycle of
    // c couples needs c - 1 swaps.
    const viaComponents = (row: number[]) => {
      const n = row.length / 2;
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      let comps = n;
      for (let i = 0; i < row.length; i += 2) {
        const a = find(row[i] >> 1), b = find(row[i + 1] >> 1);
        if (a !== b) { parent[a] = b; comps--; }
      }
      return n - comps;
    };
    return {
      slug: "couples-holding-hands",
      title: "Couples Holding Hands",
      difficulty: "HARD" as const,
      tags: ["Greedy", "Union Find", "Graph", "Google", "Amazon"],
      signature: { funcName: "minSwapsCouples", params: [{ name: "row", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "At the CodeKairo awards dinner, `n` couples sit in a row of `2n` seats. `row[i]` is the id of the person in seat `i`. Couples are numbered in order: person `0` is paired with `1`, `2` with `3`, and in general `2k` with `2k + 1`.\n\nA **swap** picks any two people and exchanges their seats. Return the minimum number of swaps so that every couple sits side by side, meaning seats `2i` and `2i + 1` hold a couple for every `i`.",
        [
          { in: "row = [0,2,1,3]", out: "1", note: "Swap the people in seats 1 and 2." },
          { in: "row = [3,2,0,1]", out: "0" },
          { in: "row = [4,0,3,1,2,5]", out: "2", note: "The three couples form one cycle through the seat pairs, which takes two swaps to untangle." },
        ],
        ["2n == row.length", "1 <= n <= 30", "0 <= row[i] < 2n", "All the elements of row are distinct"]),
      hints: [
        "Look at seat pairs `(0,1)`, `(2,3)`, …. Fixing a pair never needs to touch a pair that is already correct.",
        "Greedy: walk the pairs left to right; if the person in seat `2i` is not next to their partner, swap the partner into seat `2i + 1`.",
        "Why is that optimal? Draw couples as nodes and each seat pair as an edge between the two couples sitting there. Each cycle of `c` couples needs exactly `c - 1` swaps.",
      ],
      editorial: explain({
        idea: "Treat each couple as a node and each seat pair as an edge joining the couples of its two occupants. Every node has degree 2, so the graph is a set of cycles, and a cycle of `c` couples needs exactly `c - 1` swaps — which the left-to-right greedy achieves.",
        steps: [
          "Record the seat of every person in `pos`.",
          "For each pair of seats `(2i, 2i + 1)`: let `partner = row[2i] ^ 1`. If `row[2i + 1]` is already the partner, continue.",
          "Otherwise swap the partner (at `pos[partner]`) with the person in seat `2i + 1`, update both positions, and count one swap.",
          "Return the count.",
        ],
        why: "Each greedy swap seats one couple correctly and shortens its cycle by one couple, so a cycle of length `c` takes `c - 1` swaps, for a total of `n - (number of cycles)`. No method can do better: a single swap changes two seat pairs and can raise the number of cycles by at most one, and the goal state has `n` cycles.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The partner of `x` is `x ^ 1` (0↔1, 2↔3, …), not `x + 1`.",
          "Keep the position array in sync after each swap, for both people moved.",
          "Seat pairs are fixed at even offsets — couples in seats 1 and 2 do not count as sitting together.",
        ],
      }),
      examples: [
        { input: "[0,2,1,3]", expectedOutput: "1" },
        { input: "[3,2,0,1]", expectedOutput: "0" },
        { input: "[4,0,3,1,2,5]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 3, ri(rng, 4, 10), ri(rng, 10, 30)]);
        const row = shuffle(rng, Array.from({ length: 2 * n }, (_, i) => i));
        if (n > 3 && rng() < 0.2) {
          // Mostly seated already: a few random swaps away from a solved row.
          const solved = Array.from({ length: 2 * n }, (_, i) => i);
          for (let t = ri(rng, 0, 3); t > 0; t--) {
            const a = ri(rng, 0, 2 * n - 1), b = ri(rng, 0, 2 * n - 1);
            const x = solved[a]; solved[a] = solved[b]; solved[b] = x;
          }
          for (let i = 0; i < 2 * n; i++) row[i] = solved[i];
        }
        const out = n <= 3 ? bfs(row) : viaComponents(row);
        return { input: fmtIntArr(row), expectedOutput: String(out) };
      },
      solutions: {
        python: code`
          from typing import List

          def minSwapsCouples(row: List[int]) -> int:
              r = list(row)
              pos = [0] * len(r)
              for i, p in enumerate(r):
                  pos[p] = i
              swaps = 0
              for i in range(0, len(r), 2):
                  partner = r[i] ^ 1
                  if r[i + 1] != partner:
                      j = pos[partner]
                      other = r[i + 1]
                      r[j], pos[other] = other, j
                      r[i + 1], pos[partner] = partner, i + 1
                      swaps += 1
              return swaps
        `,
        javascript: code`
          var minSwapsCouples = function(row) {
              var r = row.slice();
              var pos = new Array(r.length);
              for (var i = 0; i < r.length; i++) pos[r[i]] = i;
              var swaps = 0;
              for (var s = 0; s < r.length; s += 2) {
                  var partner = r[s] ^ 1;
                  if (r[s + 1] !== partner) {
                      var j = pos[partner], other = r[s + 1];
                      r[j] = other; pos[other] = j;
                      r[s + 1] = partner; pos[partner] = s + 1;
                      swaps++;
                  }
              }
              return swaps;
          };
        `,
        typescript: code`
          function minSwapsCouples(row: number[]): number {
              var r = row.slice();
              var pos: number[] = [];
              for (var z = 0; z < r.length; z++) pos.push(0);
              for (var i = 0; i < r.length; i++) pos[r[i]] = i;
              var swaps = 0;
              for (var s = 0; s < r.length; s += 2) {
                  var partner = r[s] ^ 1;
                  if (r[s + 1] !== partner) {
                      var j = pos[partner], other = r[s + 1];
                      r[j] = other; pos[other] = j;
                      r[s + 1] = partner; pos[partner] = s + 1;
                      swaps++;
                  }
              }
              return swaps;
          }
        `,
        java: code`
          public static int minSwapsCouples(int[] row) {
              int[] r = row.clone();
              int[] pos = new int[r.length];
              for (int i = 0; i < r.length; i++) pos[r[i]] = i;
              int swaps = 0;
              for (int s = 0; s < r.length; s += 2) {
                  int partner = r[s] ^ 1;
                  if (r[s + 1] != partner) {
                      int j = pos[partner], other = r[s + 1];
                      r[j] = other; pos[other] = j;
                      r[s + 1] = partner; pos[partner] = s + 1;
                      swaps++;
                  }
              }
              return swaps;
          }
        `,
        cpp: code`
          int minSwapsCouples(vector<int>& row) {
              vector<int> r(row);
              vector<int> pos(r.size());
              for (int i = 0; i < (int)r.size(); i++) pos[r[i]] = i;
              int swaps = 0;
              for (int s = 0; s < (int)r.size(); s += 2) {
                  int partner = r[s] ^ 1;
                  if (r[s + 1] != partner) {
                      int j = pos[partner], other = r[s + 1];
                      r[j] = other; pos[other] = j;
                      r[s + 1] = partner; pos[partner] = s + 1;
                      swaps++;
                  }
              }
              return swaps;
          }
        `,
        c: code`
          int minSwapsCouples(int* row, int rowSize) {
              int* r = (int*)malloc(sizeof(int) * rowSize);
              int* pos = (int*)malloc(sizeof(int) * rowSize);
              for (int i = 0; i < rowSize; i++) { r[i] = row[i]; pos[r[i]] = i; }
              int swaps = 0;
              for (int s = 0; s < rowSize; s += 2) {
                  int partner = r[s] ^ 1;
                  if (r[s + 1] != partner) {
                      int j = pos[partner], other = r[s + 1];
                      r[j] = other; pos[other] = j;
                      r[s + 1] = partner; pos[partner] = s + 1;
                      swaps++;
                  }
              }
              free(r);
              free(pos);
              return swaps;
          }
        `,
        csharp: code`
          public static int MinSwapsCouples(int[] row)
          {
              int[] r = (int[])row.Clone();
              int[] pos = new int[r.Length];
              for (int i = 0; i < r.Length; i++) pos[r[i]] = i;
              int swaps = 0;
              for (int s = 0; s < r.Length; s += 2)
              {
                  int partner = r[s] ^ 1;
                  if (r[s + 1] != partner)
                  {
                      int j = pos[partner], other = r[s + 1];
                      r[j] = other; pos[other] = j;
                      r[s + 1] = partner; pos[partner] = s + 1;
                      swaps++;
                  }
              }
              return swaps;
          }
        `,
        go: code`
          func minSwapsCouples(row []int) int {
          	r := make([]int, len(row))
          	copy(r, row)
          	pos := make([]int, len(r))
          	for i, p := range r {
          		pos[p] = i
          	}
          	swaps := 0
          	for s := 0; s < len(r); s += 2 {
          		partner := r[s] ^ 1
          		if r[s+1] != partner {
          			j, other := pos[partner], r[s+1]
          			r[j] = other
          			pos[other] = j
          			r[s+1] = partner
          			pos[partner] = s + 1
          			swaps++
          		}
          	}
          	return swaps
          }
        `,
        kotlin: code`
          fun minSwapsCouples(row: IntArray): Int {
              val r = row.copyOf()
              val pos = IntArray(r.size)
              for (i in r.indices) pos[r[i]] = i
              var swaps = 0
              var s = 0
              while (s < r.size) {
                  val partner = r[s] xor 1
                  if (r[s + 1] != partner) {
                      val j = pos[partner]
                      val other = r[s + 1]
                      r[j] = other
                      pos[other] = j
                      r[s + 1] = partner
                      pos[partner] = s + 1
                      swaps++
                  }
                  s += 2
              }
              return swaps
          }
        `,
        swift: code`
          func minSwapsCouples(_ row: [Int]) -> Int {
              var r = row
              var pos = [Int](repeating: 0, count: r.count)
              for i in 0..<r.count { pos[r[i]] = i }
              var swaps = 0
              var s = 0
              while s < r.count {
                  let partner = r[s] ^ 1
                  if r[s + 1] != partner {
                      let j = pos[partner]
                      let other = r[s + 1]
                      r[j] = other
                      pos[other] = j
                      r[s + 1] = partner
                      pos[partner] = s + 1
                      swaps += 1
                  }
                  s += 2
              }
              return swaps
          }
        `,
        rust: code`
          fn minSwapsCouples(row: Vec<i32>) -> i32 {
              let mut r: Vec<usize> = row.iter().map(|&v| v as usize).collect();
              let mut pos = vec![0usize; r.len()];
              for i in 0..r.len() {
                  pos[r[i]] = i;
              }
              let mut swaps = 0;
              let mut s = 0;
              while s < r.len() {
                  let partner = r[s] ^ 1;
                  if r[s + 1] != partner {
                      let j = pos[partner];
                      let other = r[s + 1];
                      r[j] = other;
                      pos[other] = j;
                      r[s + 1] = partner;
                      pos[partner] = s + 1;
                      swaps += 1;
                  }
                  s += 2;
              }
              swaps
          }
        `,
        php: code`
          function minSwapsCouples($row) {
              $r = $row;
              $pos = [];
              foreach ($r as $i => $p) $pos[$p] = $i;
              $swaps = 0;
              $len = count($r);
              for ($s = 0; $s < $len; $s += 2) {
                  $partner = $r[$s] ^ 1;
                  if ($r[$s + 1] != $partner) {
                      $j = $pos[$partner];
                      $other = $r[$s + 1];
                      $r[$j] = $other;
                      $pos[$other] = $j;
                      $r[$s + 1] = $partner;
                      $pos[$partner] = $s + 1;
                      $swaps++;
                  }
              }
              return $swaps;
          }
        `,
        ruby: code`
          def minSwapsCouples(row)
            r = row.dup
            pos = Array.new(r.length, 0)
            r.each_with_index { |p, i| pos[p] = i }
            swaps = 0
            (0...r.length).step(2) do |s|
              partner = r[s] ^ 1
              next if r[s + 1] == partner
              j = pos[partner]
              other = r[s + 1]
              r[j] = other
              pos[other] = j
              r[s + 1] = partner
              pos[partner] = s + 1
              swaps += 1
            end
            swaps
          end
        `,
      },
    };
  })(),

  // ── Orderly Queue (LC 899) ───────────────────────────────────────
  (() => {
    // Tiny strings: explore every reachable string.
    const bfs = (s: string, k: number) => {
      const seen = new Set<string>([s]);
      const q = [s];
      let best = s;
      for (let h = 0; h < q.length; h++) {
        const cur = q[h];
        if (cur < best) best = cur;
        for (let i = 0; i < Math.min(k, cur.length); i++) {
          const nx = cur.slice(0, i) + cur.slice(i + 1) + cur[i];
          if (!seen.has(nx)) { seen.add(nx); q.push(nx); }
        }
      }
      return best;
    };
    const formula = (s: string, k: number) => {
      if (k > 1) return s.split("").sort().join("");
      let best = s;
      for (let i = 1; i < s.length; i++) { const c = s.slice(i) + s.slice(0, i); if (c < best) best = c; }
      return best;
    };
    return {
      slug: "orderly-queue",
      title: "Orderly Queue",
      difficulty: "HARD" as const,
      tags: ["Math", "String", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "orderlyQueue",
        params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given a string `s` and an integer `k`. In one move you choose one of the **first `k` letters** of `s`, remove it, and append it to the end of the string.\n\nYou may make any number of moves. Return the lexicographically smallest string you can end up with.",
        [
          { in: "s = \"kairo\", k = 1", out: "airok", note: "With `k = 1` only rotations are reachable; the smallest is `airok`." },
          { in: "s = \"baaca\", k = 3", out: "aaabc", note: "With `k >= 2` the letters can be put in any order." },
          { in: "s = \"cba\", k = 1", out: "acb" },
        ],
        ["1 <= k <= s.length <= 1000", "s consists of lowercase English letters"]),
      hints: [
        "With `k = 1` each move rotates the string by one position, so the reachable strings are exactly the rotations.",
        "With `k = 2` you can hold one letter back while the rest rotate past it — that lets you swap two adjacent letters.",
        "Adjacent swaps can sort anything, so for `k >= 2` the answer is simply the sorted string.",
      ],
      editorial: explain({
        idea: "Two cases. With `k = 1` the moves are rotations, so try all of them. With `k >= 2` any two adjacent letters can be swapped (while the rest rotate around), so every permutation is reachable and the sorted string wins.",
        steps: [
          "If `k == 1`: compare all `n` rotations `s[i:] + s[:i]` and return the smallest.",
          "Otherwise return the letters of `s` in sorted order.",
        ],
        why: "For `k >= 2`, view the string as a cycle with a pointer. Moving the first letter to the back advances the pointer; moving the second letter to the back instead swaps the order of the first two letters in the cycle. Rotations plus adjacent swaps generate every permutation — the same reason bubble sort works — so the sorted string is reachable, and nothing is smaller.",
        time: "O(n^2) for k = 1, O(n log n) otherwise",
        space: "O(n)",
        pitfalls: [
          "Simulating moves greedily for `k = 1` is not needed — the rotations are the whole search space.",
          "For `k >= 2` the answer does not depend on `k` at all.",
          "In C#, compare strings ordinally, not with culture-aware comparison.",
        ],
      }),
      examples: [
        { input: "\"kairo\"\n1", expectedOutput: "airok" },
        { input: "\"baaca\"\n3", expectedOutput: "aaabc" },
        { input: "\"cba\"\n1", expectedOutput: "acb" },
      ],
      gen: (rng: Rng) => {
        const small = rng() < 0.5;
        const s = small ? randLower(rng, 1, 6, pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"])) : randLower(rng, 7, 60, pick(rng, ["ab", "abc", "xyz", "abcdefghijklmnopqrstuvwxyz"]));
        const k = pick(rng, [1, 1, 2, ri(rng, 1, s.length), s.length]);
        const out = small ? bfs(s, k) : formula(s, k);
        return { input: `"${s}"\n${k}`, expectedOutput: out };
      },
      solutions: {
        python: code`
          def orderlyQueue(s: str, k: int) -> str:
              if k > 1:
                  return "".join(sorted(s))
              return min(s[i:] + s[:i] for i in range(len(s)))
        `,
        javascript: code`
          var orderlyQueue = function(s, k) {
              if (k > 1) return s.split("").sort().join("");
              var best = s;
              for (var i = 1; i < s.length; i++) {
                  var cand = s.slice(i) + s.slice(0, i);
                  if (cand < best) best = cand;
              }
              return best;
          };
        `,
        typescript: code`
          function orderlyQueue(s: string, k: number): string {
              if (k > 1) return s.split("").sort().join("");
              var best = s;
              for (var i = 1; i < s.length; i++) {
                  var cand = s.slice(i) + s.slice(0, i);
                  if (cand < best) best = cand;
              }
              return best;
          }
        `,
        java: code`
          public static String orderlyQueue(String s, int k) {
              if (k > 1) {
                  char[] a = s.toCharArray();
                  Arrays.sort(a);
                  return new String(a);
              }
              String best = s;
              for (int i = 1; i < s.length(); i++) {
                  String cand = s.substring(i) + s.substring(0, i);
                  if (cand.compareTo(best) < 0) best = cand;
              }
              return best;
          }
        `,
        cpp: code`
          string orderlyQueue(string s, int k) {
              if (k > 1) {
                  sort(s.begin(), s.end());
                  return s;
              }
              string best = s;
              for (size_t i = 1; i < s.size(); i++) {
                  string cand = s.substr(i) + s.substr(0, i);
                  if (cand < best) best = cand;
              }
              return best;
          }
        `,
        c: code`
          static int cmpCharOQ(const void* a, const void* b) {
              return (int)(*(const unsigned char*)a) - (int)(*(const unsigned char*)b);
          }

          char* orderlyQueue(const char* s, int k) {
              int n = (int)strlen(s);
              char* res = (char*)malloc(n + 1);
              strcpy(res, s);
              if (k > 1) {
                  qsort(res, n, 1, cmpCharOQ);
                  return res;
              }
              char* cand = (char*)malloc(n + 1);
              for (int i = 1; i < n; i++) {
                  memcpy(cand, s + i, n - i);
                  memcpy(cand + n - i, s, i);
                  cand[n] = '\0';
                  if (strcmp(cand, res) < 0) strcpy(res, cand);
              }
              free(cand);
              return res;
          }
        `,
        csharp: code`
          public static string OrderlyQueue(string s, int k)
          {
              if (k > 1)
              {
                  char[] a = s.ToCharArray();
                  Array.Sort(a);
                  return new string(a);
              }
              string best = s;
              for (int i = 1; i < s.Length; i++)
              {
                  string cand = s.Substring(i) + s.Substring(0, i);
                  if (string.CompareOrdinal(cand, best) < 0) best = cand;
              }
              return best;
          }
        `,
        go: code`
          func orderlyQueue(s string, k int) string {
          	if k > 1 {
          		b := []byte(s)
          		sort.Slice(b, func(i, j int) bool { return b[i] < b[j] })
          		return string(b)
          	}
          	best := s
          	for i := 1; i < len(s); i++ {
          		cand := s[i:] + s[:i]
          		if cand < best {
          			best = cand
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun orderlyQueue(s: String, k: Int): String {
              if (k > 1) {
                  val a = s.toCharArray()
                  a.sort()
                  return String(a)
              }
              var best = s
              for (i in 1 until s.length) {
                  val cand = s.substring(i) + s.substring(0, i)
                  if (cand < best) best = cand
              }
              return best
          }
        `,
        swift: code`
          func orderlyQueue(_ s: String, _ k: Int) -> String {
              if k > 1 { return String(s.sorted()) }
              let a = Array(s.utf8)
              var best = a
              for i in 1..<a.count {
                  let cand = Array(a[i...]) + Array(a[..<i])
                  if cand.lexicographicallyPrecedes(best) { best = cand }
              }
              return String(decoding: best, as: UTF8.self)
          }
        `,
        rust: code`
          fn orderlyQueue(s: String, k: i32) -> String {
              let b: Vec<u8> = s.into_bytes();
              if k > 1 {
                  let mut c = b.clone();
                  c.sort();
                  return String::from_utf8(c).unwrap();
              }
              let n = b.len();
              let mut best = b.clone();
              for i in 1..n {
                  let mut cand: Vec<u8> = Vec::with_capacity(n);
                  cand.extend_from_slice(&b[i..]);
                  cand.extend_from_slice(&b[..i]);
                  if cand < best {
                      best = cand;
                  }
              }
              String::from_utf8(best).unwrap()
          }
        `,
        php: code`
          function orderlyQueue($s, $k) {
              if ($k > 1) {
                  $a = str_split($s);
                  sort($a, SORT_STRING);
                  return implode("", $a);
              }
              $best = $s;
              $n = strlen($s);
              for ($i = 1; $i < $n; $i++) {
                  $cand = substr($s, $i) . substr($s, 0, $i);
                  if (strcmp($cand, $best) < 0) $best = $cand;
              }
              return $best;
          }
        `,
        ruby: code`
          def orderlyQueue(s, k)
            return s.chars.sort.join if k > 1
            best = s
            (1...s.length).each do |i|
              cand = s[i..-1] + s[0...i]
              best = cand if cand < best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Delete Columns to Make Sorted (LC 944) ───────────────────────
  (() => {
    const ref = (strs: string[]) => {
      let count = 0;
      for (let j = 0; j < strs[0].length; j++) {
        const col = strs.map((s) => s[j]);
        if (col.join("") !== col.slice().sort().join("")) count++;
      }
      return count;
    };
    return {
      slug: "delete-columns-to-make-sorted",
      title: "Delete Columns to Make Sorted",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Google"],
      signature: { funcName: "minDeletionSize", params: [{ name: "strs", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given `n` strings `strs`, all of the same length. Stack them as the rows of a grid, so column `j` reads `strs[0][j], strs[1][j], …, strs[n-1][j]` from top to bottom.\n\nA column is fine when its letters are in non-decreasing alphabetical order from top to bottom. Return the number of columns that are **not** fine — the columns you would have to delete.",
        [
          { in: "strs = [\"cba\",\"daf\",\"ghi\"]", out: "1", note: "Column 1 reads `b, a, h`, which is out of order; columns 0 and 2 are fine." },
          { in: "strs = [\"code\"]", out: "0", note: "A single row is always sorted." },
          { in: "strs = [\"zyx\",\"wvu\",\"tsr\"]", out: "3" },
        ],
        ["n == strs.length", "1 <= n <= 100", "1 <= strs[i].length <= 1000", "strs[i] consists of lowercase English letters"]),
      hints: [
        "Each column can be judged on its own.",
        "A column is out of order as soon as one letter is larger than the letter directly below it.",
        "Count the columns where some `strs[i][j] > strs[i + 1][j]`.",
      ],
      editorial: explain({
        idea: "Columns are independent: a column must be deleted exactly when some adjacent pair in it is out of order.",
        steps: [
          "For each column `j`, scan rows `i = 0 .. n - 2`.",
          "If `strs[i][j] > strs[i + 1][j]` for any `i`, count the column and move on.",
          "Return the count.",
        ],
        why: "A sequence is non-decreasing exactly when every adjacent pair is, so checking neighbours decides each column, and deleting a column never affects whether another column is sorted.",
        time: "O(n · m)",
        space: "O(1)",
        pitfalls: [
          "Equal letters are allowed — only a strict decrease breaks a column.",
          "Stop scanning a column at its first violation so it is counted once.",
          "Loop over columns in the outer loop; the strings are rows.",
        ],
      }),
      examples: [
        { input: "[\"cba\",\"daf\",\"ghi\"]", expectedOutput: "1" },
        { input: "[\"code\"]", expectedOutput: "0" },
        { input: "[\"zyx\",\"wvu\",\"tsr\"]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 2, 6), ri(rng, 5, 20)]);
        const len = pick(rng, [1, ri(rng, 1, 6), ri(rng, 5, 30)]);
        const alpha = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        let strs = Array.from({ length: n }, () => randLower(rng, len, len, alpha));
        if (rng() < 0.3) {
          // Sort a random subset of columns so "fine" columns are common.
          const grid = strs.map((s) => s.split(""));
          for (let j = 0; j < len; j++) {
            if (rng() < 0.6) {
              const col = grid.map((r) => r[j]).sort();
              for (let i = 0; i < n; i++) grid[i][j] = col[i];
            }
          }
          strs = grid.map((r) => r.join(""));
        }
        return { input: fmtStrArr(strs), expectedOutput: String(ref(strs)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minDeletionSize(strs: List[str]) -> int:
              count = 0
              for j in range(len(strs[0])):
                  for i in range(len(strs) - 1):
                      if strs[i][j] > strs[i + 1][j]:
                          count += 1
                          break
              return count
        `,
        javascript: code`
          var minDeletionSize = function(strs) {
              var count = 0;
              for (var j = 0; j < strs[0].length; j++) {
                  for (var i = 0; i + 1 < strs.length; i++) {
                      if (strs[i][j] > strs[i + 1][j]) { count++; break; }
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function minDeletionSize(strs: string[]): number {
              var count = 0;
              for (var j = 0; j < strs[0].length; j++) {
                  for (var i = 0; i + 1 < strs.length; i++) {
                      if (strs[i].charAt(j) > strs[i + 1].charAt(j)) { count++; break; }
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int minDeletionSize(String[] strs) {
              int count = 0;
              for (int j = 0; j < strs[0].length(); j++) {
                  for (int i = 0; i + 1 < strs.length; i++) {
                      if (strs[i].charAt(j) > strs[i + 1].charAt(j)) { count++; break; }
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int minDeletionSize(vector<string>& strs) {
              int count = 0;
              for (size_t j = 0; j < strs[0].size(); j++) {
                  for (size_t i = 0; i + 1 < strs.size(); i++) {
                      if (strs[i][j] > strs[i + 1][j]) { count++; break; }
                  }
              }
              return count;
          }
        `,
        c: code`
          int minDeletionSize(char** strs, int strsSize) {
              int len = (int)strlen(strs[0]);
              int count = 0;
              for (int j = 0; j < len; j++) {
                  for (int i = 0; i + 1 < strsSize; i++) {
                      if (strs[i][j] > strs[i + 1][j]) { count++; break; }
                  }
              }
              return count;
          }
        `,
        csharp: code`
          public static int MinDeletionSize(string[] strs)
          {
              int count = 0;
              for (int j = 0; j < strs[0].Length; j++)
              {
                  for (int i = 0; i + 1 < strs.Length; i++)
                  {
                      if (strs[i][j] > strs[i + 1][j]) { count++; break; }
                  }
              }
              return count;
          }
        `,
        go: code`
          func minDeletionSize(strs []string) int {
          	count := 0
          	for j := 0; j < len(strs[0]); j++ {
          		for i := 0; i+1 < len(strs); i++ {
          			if strs[i][j] > strs[i+1][j] {
          				count++
          				break
          			}
          		}
          	}
          	return count
          }
        `,
        kotlin: code`
          fun minDeletionSize(strs: Array<String>): Int {
              var count = 0
              for (j in 0 until strs[0].length) {
                  for (i in 0 until strs.size - 1) {
                      if (strs[i][j] > strs[i + 1][j]) {
                          count++
                          break
                      }
                  }
              }
              return count
          }
        `,
        swift: code`
          func minDeletionSize(_ strs: [String]) -> Int {
              let rows = strs.map { Array($0.utf8) }
              var count = 0
              for j in 0..<rows[0].count {
                  var i = 0
                  while i + 1 < rows.count {
                      if rows[i][j] > rows[i + 1][j] {
                          count += 1
                          break
                      }
                      i += 1
                  }
              }
              return count
          }
        `,
        rust: code`
          fn minDeletionSize(strs: Vec<String>) -> i32 {
              let rows: Vec<&[u8]> = strs.iter().map(|s| s.as_bytes()).collect();
              let mut count = 0;
              for j in 0..rows[0].len() {
                  for i in 0..rows.len() - 1 {
                      if rows[i][j] > rows[i + 1][j] {
                          count += 1;
                          break;
                      }
                  }
              }
              count
          }
        `,
        php: code`
          function minDeletionSize($strs) {
              $count = 0;
              $len = strlen($strs[0]);
              $n = count($strs);
              for ($j = 0; $j < $len; $j++) {
                  for ($i = 0; $i + 1 < $n; $i++) {
                      if (strcmp($strs[$i][$j], $strs[$i + 1][$j]) > 0) { $count++; break; }
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def minDeletionSize(strs)
            count = 0
            (0...strs[0].length).each do |j|
              (0...strs.length - 1).each do |i|
                if strs[i][j] > strs[i + 1][j]
                  count += 1
                  break
                end
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Delete Columns to Make Sorted II (LC 955) ────────────────────
  (() => {
    // Brute force: the largest set of kept columns whose projections are in order.
    const ref = (strs: string[]) => {
      const m = strs[0].length;
      let bestKept = 0;
      for (let mask = 0; mask < 1 << m; mask++) {
        let kept = 0;
        for (let j = 0; j < m; j++) if ((mask >> j) & 1) kept++;
        if (kept <= bestKept) continue;
        const proj = strs.map((s) => s.split("").filter((_, j) => (mask >> j) & 1).join(""));
        let ok = true;
        for (let i = 0; i + 1 < proj.length; i++) if (proj[i] > proj[i + 1]) { ok = false; break; }
        if (ok) bestKept = kept;
      }
      return m - bestKept;
    };
    return {
      slug: "delete-columns-to-make-sorted-ii",
      title: "Delete Columns to Make Sorted II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Greedy", "Google", "Amazon"],
      signature: { funcName: "minDeletionSize", params: [{ name: "strs", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given `n` strings `strs` of equal length. You may choose a set of column indices and delete those characters from **every** string.\n\nAfter the deletion, the strings must be in **lexicographic order**: `strs[0] <= strs[1] <= … <= strs[n - 1]`.\n\nReturn the minimum number of columns to delete.",
        [
          { in: "strs = [\"kc\",\"kb\",\"za\"]", out: "1", note: "Deleting column 1 leaves `[\"k\",\"k\",\"z\"]`, which is in order." },
          { in: "strs = [\"abx\",\"agz\",\"bgc\",\"bfc\"]", out: "1", note: "Delete column 1 to get `[\"ax\",\"az\",\"bc\",\"bc\"]`." },
          { in: "strs = [\"zyx\",\"wvu\",\"tsr\"]", out: "3" },
        ],
        ["n == strs.length", "1 <= n <= 100", "1 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters"]),
      hints: [
        "Process the columns from left to right, deciding keep or delete for each.",
        "Once two neighbouring strings differ (strictly) in a kept column, their order is settled and later columns cannot break it.",
        "Delete a column if it puts some still-unsettled neighbouring pair out of order; otherwise keep it and mark the pairs it separates as settled.",
      ],
      editorial: explain({
        idea: "Lexicographic order is decided by the first kept column where two strings differ. Scan columns left to right, remembering which adjacent pairs are already strictly ordered; a column is deleted only when it would break an unresolved pair.",
        steps: [
          "Keep a flag `settled[i]` for each adjacent pair `(i, i + 1)`, all false at first.",
          "For each column `j`: if some unsettled pair has `strs[i][j] > strs[i + 1][j]`, delete the column (count it) and skip it.",
          "Otherwise keep it, and set `settled[i]` for every pair with `strs[i][j] < strs[i + 1][j]`.",
          "Return the number of deleted columns.",
        ],
        why: "A column that breaks an unsettled pair must be deleted in every valid solution that keeps the earlier columns the greedy kept — keeping it would place that pair out of order for good. A column that breaks nothing can always be kept: it never hurts settled pairs and only settles more pairs, which leaves strictly more freedom for later columns. Comparing only adjacent pairs is enough, since sortedness of a list is the sortedness of its neighbours.",
        time: "O(n · m)",
        space: "O(n)",
        pitfalls: [
          "Unlike the first version, a column out of order for a pair that is already settled does not need deleting.",
          "Decide the column first, then update the settled flags — never update flags from a deleted column.",
          "Equal letters do not settle a pair; only a strict increase does.",
        ],
      }),
      examples: [
        { input: "[\"kc\",\"kb\",\"za\"]", expectedOutput: "1" },
        { input: "[\"abx\",\"agz\",\"bgc\",\"bfc\"]", expectedOutput: "1" },
        { input: "[\"zyx\",\"wvu\",\"tsr\"]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 2, 5), ri(rng, 4, 8)]);
        const len = ri(rng, 1, 8);
        const alpha = pick(rng, ["ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]);
        let strs = Array.from({ length: n }, () => randLower(rng, len, len, alpha));
        if (rng() < 0.4) strs = strs.slice().sort(); // sorted rows, then perturb
        if (rng() < 0.5 && n > 1) {
          const i = ri(rng, 0, n - 1), j = ri(rng, 0, len - 1);
          const c = alpha[ri(rng, 0, alpha.length - 1)];
          strs[i] = strs[i].slice(0, j) + c + strs[i].slice(j + 1);
        }
        return { input: fmtStrArr(strs), expectedOutput: String(ref(strs)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minDeletionSize(strs: List[str]) -> int:
              n, m = len(strs), len(strs[0])
              settled = [False] * (n - 1)
              deleted = 0
              for j in range(m):
                  if any(not settled[i] and strs[i][j] > strs[i + 1][j] for i in range(n - 1)):
                      deleted += 1
                      continue
                  for i in range(n - 1):
                      if strs[i][j] < strs[i + 1][j]:
                          settled[i] = True
              return deleted
        `,
        javascript: code`
          var minDeletionSize = function(strs) {
              var n = strs.length, m = strs[0].length;
              var settled = new Array(n).fill(false);
              var deleted = 0;
              for (var j = 0; j < m; j++) {
                  var bad = false;
                  for (var i = 0; i + 1 < n; i++) {
                      if (!settled[i] && strs[i][j] > strs[i + 1][j]) { bad = true; break; }
                  }
                  if (bad) { deleted++; continue; }
                  for (var t = 0; t + 1 < n; t++) if (strs[t][j] < strs[t + 1][j]) settled[t] = true;
              }
              return deleted;
          };
        `,
        typescript: code`
          function minDeletionSize(strs: string[]): number {
              var n = strs.length, m = strs[0].length;
              var settled: boolean[] = [];
              for (var z = 0; z < n; z++) settled.push(false);
              var deleted = 0;
              for (var j = 0; j < m; j++) {
                  var bad = false;
                  for (var i = 0; i + 1 < n; i++) {
                      if (!settled[i] && strs[i].charAt(j) > strs[i + 1].charAt(j)) { bad = true; break; }
                  }
                  if (bad) { deleted++; continue; }
                  for (var t = 0; t + 1 < n; t++) if (strs[t].charAt(j) < strs[t + 1].charAt(j)) settled[t] = true;
              }
              return deleted;
          }
        `,
        java: code`
          public static int minDeletionSize(String[] strs) {
              int n = strs.length, m = strs[0].length();
              boolean[] settled = new boolean[n];
              int deleted = 0;
              for (int j = 0; j < m; j++) {
                  boolean bad = false;
                  for (int i = 0; i + 1 < n; i++) {
                      if (!settled[i] && strs[i].charAt(j) > strs[i + 1].charAt(j)) { bad = true; break; }
                  }
                  if (bad) { deleted++; continue; }
                  for (int i = 0; i + 1 < n; i++) if (strs[i].charAt(j) < strs[i + 1].charAt(j)) settled[i] = true;
              }
              return deleted;
          }
        `,
        cpp: code`
          int minDeletionSize(vector<string>& strs) {
              int n = strs.size(), m = strs[0].size();
              vector<bool> settled(n, false);
              int deleted = 0;
              for (int j = 0; j < m; j++) {
                  bool bad = false;
                  for (int i = 0; i + 1 < n; i++) {
                      if (!settled[i] && strs[i][j] > strs[i + 1][j]) { bad = true; break; }
                  }
                  if (bad) { deleted++; continue; }
                  for (int i = 0; i + 1 < n; i++) if (strs[i][j] < strs[i + 1][j]) settled[i] = true;
              }
              return deleted;
          }
        `,
        c: code`
          int minDeletionSize(char** strs, int strsSize) {
              int n = strsSize, m = (int)strlen(strs[0]);
              char* settled = (char*)calloc(n, 1);
              int deleted = 0;
              for (int j = 0; j < m; j++) {
                  int bad = 0;
                  for (int i = 0; i + 1 < n; i++) {
                      if (!settled[i] && strs[i][j] > strs[i + 1][j]) { bad = 1; break; }
                  }
                  if (bad) { deleted++; continue; }
                  for (int i = 0; i + 1 < n; i++) if (strs[i][j] < strs[i + 1][j]) settled[i] = 1;
              }
              free(settled);
              return deleted;
          }
        `,
        csharp: code`
          public static int MinDeletionSize(string[] strs)
          {
              int n = strs.Length, m = strs[0].Length;
              bool[] settled = new bool[n];
              int deleted = 0;
              for (int j = 0; j < m; j++)
              {
                  bool bad = false;
                  for (int i = 0; i + 1 < n; i++)
                  {
                      if (!settled[i] && strs[i][j] > strs[i + 1][j]) { bad = true; break; }
                  }
                  if (bad) { deleted++; continue; }
                  for (int i = 0; i + 1 < n; i++) if (strs[i][j] < strs[i + 1][j]) settled[i] = true;
              }
              return deleted;
          }
        `,
        go: code`
          func minDeletionSize(strs []string) int {
          	n, m := len(strs), len(strs[0])
          	settled := make([]bool, n)
          	deleted := 0
          	for j := 0; j < m; j++ {
          		bad := false
          		for i := 0; i+1 < n; i++ {
          			if !settled[i] && strs[i][j] > strs[i+1][j] {
          				bad = true
          				break
          			}
          		}
          		if bad {
          			deleted++
          			continue
          		}
          		for i := 0; i+1 < n; i++ {
          			if strs[i][j] < strs[i+1][j] {
          				settled[i] = true
          			}
          		}
          	}
          	return deleted
          }
        `,
        kotlin: code`
          fun minDeletionSize(strs: Array<String>): Int {
              val n = strs.size
              val m = strs[0].length
              val settled = BooleanArray(n)
              var deleted = 0
              for (j in 0 until m) {
                  var bad = false
                  for (i in 0 until n - 1) {
                      if (!settled[i] && strs[i][j] > strs[i + 1][j]) {
                          bad = true
                          break
                      }
                  }
                  if (bad) {
                      deleted++
                      continue
                  }
                  for (i in 0 until n - 1) if (strs[i][j] < strs[i + 1][j]) settled[i] = true
              }
              return deleted
          }
        `,
        swift: code`
          func minDeletionSize(_ strs: [String]) -> Int {
              let rows = strs.map { Array($0.utf8) }
              let n = rows.count
              let m = rows[0].count
              var settled = [Bool](repeating: false, count: n)
              var deleted = 0
              for j in 0..<m {
                  var bad = false
                  var i = 0
                  while i + 1 < n {
                      if !settled[i] && rows[i][j] > rows[i + 1][j] {
                          bad = true
                          break
                      }
                      i += 1
                  }
                  if bad {
                      deleted += 1
                      continue
                  }
                  i = 0
                  while i + 1 < n {
                      if rows[i][j] < rows[i + 1][j] { settled[i] = true }
                      i += 1
                  }
              }
              return deleted
          }
        `,
        rust: code`
          fn minDeletionSize(strs: Vec<String>) -> i32 {
              let rows: Vec<&[u8]> = strs.iter().map(|s| s.as_bytes()).collect();
              let n = rows.len();
              let m = rows[0].len();
              let mut settled = vec![false; n];
              let mut deleted = 0;
              for j in 0..m {
                  let mut bad = false;
                  for i in 0..n - 1 {
                      if !settled[i] && rows[i][j] > rows[i + 1][j] {
                          bad = true;
                          break;
                      }
                  }
                  if bad {
                      deleted += 1;
                      continue;
                  }
                  for i in 0..n - 1 {
                      if rows[i][j] < rows[i + 1][j] {
                          settled[i] = true;
                      }
                  }
              }
              deleted
          }
        `,
        php: code`
          function minDeletionSize($strs) {
              $n = count($strs);
              $m = strlen($strs[0]);
              $settled = array_fill(0, $n, false);
              $deleted = 0;
              for ($j = 0; $j < $m; $j++) {
                  $bad = false;
                  for ($i = 0; $i + 1 < $n; $i++) {
                      if (!$settled[$i] && strcmp($strs[$i][$j], $strs[$i + 1][$j]) > 0) { $bad = true; break; }
                  }
                  if ($bad) { $deleted++; continue; }
                  for ($i = 0; $i + 1 < $n; $i++) {
                      if (strcmp($strs[$i][$j], $strs[$i + 1][$j]) < 0) $settled[$i] = true;
                  }
              }
              return $deleted;
          }
        `,
        ruby: code`
          def minDeletionSize(strs)
            n = strs.length
            m = strs[0].length
            settled = Array.new(n, false)
            deleted = 0
            (0...m).each do |j|
              bad = (0...n - 1).any? { |i| !settled[i] && strs[i][j] > strs[i + 1][j] }
              if bad
                deleted += 1
                next
              end
              (0...n - 1).each { |i| settled[i] = true if strs[i][j] < strs[i + 1][j] }
            end
            deleted
          end
        `,
      },
    };
  })(),

  // ── Delete Columns to Make Sorted III (LC 960) ───────────────────
  (() => {
    // Brute force: the largest set of kept columns that leaves every row sorted.
    const ref = (strs: string[]) => {
      const m = strs[0].length;
      let bestKept = 0;
      for (let mask = 1; mask < 1 << m; mask++) {
        const cols: number[] = [];
        for (let j = 0; j < m; j++) if ((mask >> j) & 1) cols.push(j);
        if (cols.length <= bestKept) continue;
        let ok = true;
        for (const s of strs) {
          for (let t = 0; t + 1 < cols.length; t++) if (s[cols[t]] > s[cols[t + 1]]) { ok = false; break; }
          if (!ok) break;
        }
        if (ok) bestKept = cols.length;
      }
      return m - bestKept;
    };
    return {
      slug: "delete-columns-to-make-sorted-iii",
      title: "Delete Columns to Make Sorted III",
      difficulty: "HARD" as const,
      tags: ["Array", "String", "Dynamic Programming", "Google", "Amazon"],
      signature: { funcName: "minDeletionSize", params: [{ name: "strs", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given `n` strings `strs` of equal length. You may choose a set of column indices and delete those characters from **every** string.\n\nAfter the deletion, **each string on its own** must be sorted: its letters appear in non-decreasing alphabetical order from left to right. (The strings do not need to be in any order relative to each other.)\n\nReturn the minimum number of columns to delete.",
        [
          { in: "strs = [\"kairo\",\"codes\"]", out: "3", note: "Keeping columns 2 and 3 leaves `\"ir\"` and `\"de\"`, both sorted; no three columns work for both rows." },
          { in: "strs = [\"dcba\"]", out: "3" },
          { in: "strs = [\"abc\",\"bcd\",\"xyz\"]", out: "0" },
        ],
        ["n == strs.length", "1 <= n <= 100", "1 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters"]),
      hints: [
        "Minimising deletions is the same as maximising the number of kept columns.",
        "Kept columns `i < j` are compatible when every row has `strs[r][i] <= strs[r][j]`. This is a longest-increasing-subsequence problem over columns.",
        "`dp[j]` = most columns you can keep ending with column `j` = `1 + max(dp[i])` over compatible `i < j`. Answer: `length - max(dp)`.",
      ],
      editorial: explain({
        idea: "Treat each column as an element and call `i < j` compatible when all rows are non-decreasing from column `i` to column `j`. We need the longest chain of pairwise-consecutive compatible columns — an LIS-style DP.",
        steps: [
          "Let `m` be the string length and `dp[j] = 1` for all `j`.",
          "For each `j` and each `i < j`: if `strs[r][i] <= strs[r][j]` for every row `r`, set `dp[j] = max(dp[j], dp[i] + 1)`.",
          "Return `m - max(dp)`.",
        ],
        why: "A set of kept columns leaves every row sorted exactly when each consecutive pair of kept columns is compatible (sortedness is checked between neighbours). So the kept set is a chain in the compatibility relation, and `dp[j]` is the longest such chain ending at `j`, built from the best chain ending at some compatible earlier column.",
        time: "O(n · m^2)",
        space: "O(m)",
        pitfalls: [
          "Compatibility must hold in every row at once, not just in one.",
          "Only consecutive kept columns need to be compared — no need to check all pairs within the chain.",
          "Equal letters are allowed (non-decreasing), so use `<=`.",
        ],
      }),
      examples: [
        { input: "[\"kairo\",\"codes\"]", expectedOutput: "3" },
        { input: "[\"dcba\"]", expectedOutput: "3" },
        { input: "[\"abc\",\"bcd\",\"xyz\"]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 1, 4), ri(rng, 3, 6)]);
        const len = ri(rng, 1, 8);
        const alpha = pick(rng, ["ab", "abc", "abcde", "abcdefghijklmnopqrstuvwxyz"]);
        const strs = Array.from({ length: n }, () => {
          const s = randLower(rng, len, len, alpha);
          return rng() < 0.3 ? s.split("").sort().join("") : s;
        });
        return { input: fmtStrArr(strs), expectedOutput: String(ref(strs)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minDeletionSize(strs: List[str]) -> int:
              m = len(strs[0])
              dp = [1] * m
              for j in range(m):
                  for i in range(j):
                      if all(s[i] <= s[j] for s in strs):
                          dp[j] = max(dp[j], dp[i] + 1)
              return m - max(dp)
        `,
        javascript: code`
          var minDeletionSize = function(strs) {
              var n = strs.length, m = strs[0].length;
              var dp = new Array(m).fill(1);
              var best = 0;
              for (var j = 0; j < m; j++) {
                  for (var i = 0; i < j; i++) {
                      var ok = true;
                      for (var r = 0; r < n; r++) if (strs[r][i] > strs[r][j]) { ok = false; break; }
                      if (ok && dp[i] + 1 > dp[j]) dp[j] = dp[i] + 1;
                  }
                  if (dp[j] > best) best = dp[j];
              }
              return m - best;
          };
        `,
        typescript: code`
          function minDeletionSize(strs: string[]): number {
              var n = strs.length, m = strs[0].length;
              var dp: number[] = [];
              for (var z = 0; z < m; z++) dp.push(1);
              var best = 0;
              for (var j = 0; j < m; j++) {
                  for (var i = 0; i < j; i++) {
                      var ok = true;
                      for (var r = 0; r < n; r++) if (strs[r].charAt(i) > strs[r].charAt(j)) { ok = false; break; }
                      if (ok && dp[i] + 1 > dp[j]) dp[j] = dp[i] + 1;
                  }
                  if (dp[j] > best) best = dp[j];
              }
              return m - best;
          }
        `,
        java: code`
          public static int minDeletionSize(String[] strs) {
              int n = strs.length, m = strs[0].length();
              int[] dp = new int[m];
              int best = 0;
              for (int j = 0; j < m; j++) {
                  dp[j] = 1;
                  for (int i = 0; i < j; i++) {
                      boolean ok = true;
                      for (int r = 0; r < n; r++) if (strs[r].charAt(i) > strs[r].charAt(j)) { ok = false; break; }
                      if (ok) dp[j] = Math.max(dp[j], dp[i] + 1);
                  }
                  best = Math.max(best, dp[j]);
              }
              return m - best;
          }
        `,
        cpp: code`
          int minDeletionSize(vector<string>& strs) {
              int n = strs.size(), m = strs[0].size();
              vector<int> dp(m, 1);
              int best = 0;
              for (int j = 0; j < m; j++) {
                  for (int i = 0; i < j; i++) {
                      bool ok = true;
                      for (int r = 0; r < n; r++) if (strs[r][i] > strs[r][j]) { ok = false; break; }
                      if (ok) dp[j] = max(dp[j], dp[i] + 1);
                  }
                  best = max(best, dp[j]);
              }
              return m - best;
          }
        `,
        c: code`
          int minDeletionSize(char** strs, int strsSize) {
              int n = strsSize, m = (int)strlen(strs[0]);
              int* dp = (int*)malloc(sizeof(int) * m);
              int best = 0;
              for (int j = 0; j < m; j++) {
                  dp[j] = 1;
                  for (int i = 0; i < j; i++) {
                      int ok = 1;
                      for (int r = 0; r < n; r++) if (strs[r][i] > strs[r][j]) { ok = 0; break; }
                      if (ok && dp[i] + 1 > dp[j]) dp[j] = dp[i] + 1;
                  }
                  if (dp[j] > best) best = dp[j];
              }
              free(dp);
              return m - best;
          }
        `,
        csharp: code`
          public static int MinDeletionSize(string[] strs)
          {
              int n = strs.Length, m = strs[0].Length;
              int[] dp = new int[m];
              int best = 0;
              for (int j = 0; j < m; j++)
              {
                  dp[j] = 1;
                  for (int i = 0; i < j; i++)
                  {
                      bool ok = true;
                      for (int r = 0; r < n; r++) if (strs[r][i] > strs[r][j]) { ok = false; break; }
                      if (ok) dp[j] = Math.Max(dp[j], dp[i] + 1);
                  }
                  best = Math.Max(best, dp[j]);
              }
              return m - best;
          }
        `,
        go: code`
          func minDeletionSize(strs []string) int {
          	n, m := len(strs), len(strs[0])
          	dp := make([]int, m)
          	best := 0
          	for j := 0; j < m; j++ {
          		dp[j] = 1
          		for i := 0; i < j; i++ {
          			ok := true
          			for r := 0; r < n; r++ {
          				if strs[r][i] > strs[r][j] {
          					ok = false
          					break
          				}
          			}
          			if ok && dp[i]+1 > dp[j] {
          				dp[j] = dp[i] + 1
          			}
          		}
          		if dp[j] > best {
          			best = dp[j]
          		}
          	}
          	return m - best
          }
        `,
        kotlin: code`
          fun minDeletionSize(strs: Array<String>): Int {
              val n = strs.size
              val m = strs[0].length
              val dp = IntArray(m) { 1 }
              var best = 0
              for (j in 0 until m) {
                  for (i in 0 until j) {
                      var ok = true
                      for (r in 0 until n) {
                          if (strs[r][i] > strs[r][j]) {
                              ok = false
                              break
                          }
                      }
                      if (ok) dp[j] = maxOf(dp[j], dp[i] + 1)
                  }
                  best = maxOf(best, dp[j])
              }
              return m - best
          }
        `,
        swift: code`
          func minDeletionSize(_ strs: [String]) -> Int {
              let rows = strs.map { Array($0.utf8) }
              let m = rows[0].count
              var dp = [Int](repeating: 1, count: m)
              var best = 0
              for j in 0..<m {
                  for i in 0..<j {
                      var ok = true
                      for row in rows where row[i] > row[j] {
                          ok = false
                          break
                      }
                      if ok { dp[j] = max(dp[j], dp[i] + 1) }
                  }
                  best = max(best, dp[j])
              }
              return m - best
          }
        `,
        rust: code`
          fn minDeletionSize(strs: Vec<String>) -> i32 {
              let rows: Vec<&[u8]> = strs.iter().map(|s| s.as_bytes()).collect();
              let m = rows[0].len();
              let mut dp = vec![1i32; m];
              let mut best = 0;
              for j in 0..m {
                  for i in 0..j {
                      let ok = rows.iter().all(|r| r[i] <= r[j]);
                      if ok && dp[i] + 1 > dp[j] {
                          dp[j] = dp[i] + 1;
                      }
                  }
                  if dp[j] > best {
                      best = dp[j];
                  }
              }
              m as i32 - best
          }
        `,
        php: code`
          function minDeletionSize($strs) {
              $n = count($strs);
              $m = strlen($strs[0]);
              $dp = array_fill(0, $m, 1);
              $best = 0;
              for ($j = 0; $j < $m; $j++) {
                  for ($i = 0; $i < $j; $i++) {
                      $ok = true;
                      for ($r = 0; $r < $n; $r++) {
                          if (strcmp($strs[$r][$i], $strs[$r][$j]) > 0) { $ok = false; break; }
                      }
                      if ($ok && $dp[$i] + 1 > $dp[$j]) $dp[$j] = $dp[$i] + 1;
                  }
                  if ($dp[$j] > $best) $best = $dp[$j];
              }
              return $m - $best;
          }
        `,
        ruby: code`
          def minDeletionSize(strs)
            m = strs[0].length
            dp = Array.new(m, 1)
            (0...m).each do |j|
              (0...j).each do |i|
                dp[j] = [dp[j], dp[i] + 1].max if strs.all? { |s| s[i] <= s[j] }
              end
            end
            m - dp.max
          end
        `,
      },
    };
  })(),

  // ── Minimum Initial Energy to Finish Tasks (LC 1665) ─────────────
  (() => {
    // Subset DP: f[S] = least starting energy that finishes exactly the tasks
    // in S in some order; the last task t needs sum(S \ t) + minimum_t.
    const ref = (tasks: number[][]) => {
      const n = tasks.length;
      const f = new Array(1 << n).fill(Infinity);
      const sum = new Array(1 << n).fill(0);
      f[0] = 0;
      for (let mask = 1; mask < 1 << n; mask++) {
        const low = mask & -mask;
        const lb = 31 - Math.clz32(low);
        sum[mask] = sum[mask ^ low] + tasks[lb][0];
        for (let t = 0; t < n; t++) {
          if (!((mask >> t) & 1)) continue;
          const prev = mask ^ (1 << t);
          f[mask] = Math.min(f[mask], Math.max(f[prev], sum[prev] + tasks[t][1]));
        }
      }
      return f[(1 << n) - 1];
    };
    return {
      slug: "minimum-initial-energy-to-finish-tasks",
      title: "Minimum Initial Energy to Finish Tasks",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google"],
      signature: { funcName: "minimumEffort", params: [{ name: "tasks", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You have a list of tasks, where `tasks[i] = [actual_i, minimum_i]`:\n\n- `actual_i` is the energy the task **consumes** when you do it.\n- `minimum_i` is the energy you must **have** before you may start it.\n\nFor example, with `[10, 12]` and 11 energy you cannot start; with 13 energy you can, and you finish with 3.\n\nYou may do the tasks in any order. Return the minimum initial energy that lets you finish all of them.",
        [
          { in: "tasks = [[2,5],[3,4]]", out: "6", note: "Start with 6: do `[2,5]` (left with 4), then `[3,4]` (left with 1)." },
          { in: "tasks = [[1,2],[2,4],[4,8]]", out: "8" },
          { in: "tasks = [[1,3],[2,4],[10,11],[10,12],[8,9]]", out: "32" },
        ],
        ["1 <= tasks.length <= 10^5", "1 <= actual_i <= minimum_i <= 10^4"]),
      hints: [
        "The total energy spent is fixed; what varies is how much slack you need before each task.",
        "A task with a large gap `minimum - actual` is best done early, while you still have plenty of energy.",
        "Sort by `minimum - actual` ascending and build the answer backwards: `energy = max(energy + actual, minimum)` for each task.",
      ],
      editorial: explain({
        idea: "Do tasks in decreasing order of `minimum - actual`. Computing the needed energy is easiest backwards: process tasks from the last one done (smallest gap) to the first, keeping the energy needed from that point on.",
        steps: [
          "Sort the tasks by `minimum - actual` ascending.",
          "Start with `need = 0` — the energy required after the last task.",
          "For each task in that order (the last task to be done first): `need = max(need + actual, minimum)`.",
          "Return `need`.",
        ],
        why: "Exchange argument: take two adjacent tasks `a` then `b` with `min_a - act_a < min_b - act_b`. Swapping them to `b` then `a` never increases the energy required, because the binding constraint `act_b + min_a` (doing `a` second) exceeds `act_a + min_b`. So the order by decreasing gap is optimal, and walking it backwards computes the least starting energy exactly: before a task you need both its minimum and enough to cover it plus everything after.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting by `minimum` alone is wrong — the deciding quantity is the gap `minimum - actual`.",
          "The backwards pass processes the smallest gap first because that task is done last.",
          "The answer can reach 10^9; it still fits in 32 bits, but 64-bit accumulation is the safe habit.",
        ],
      }),
      examples: [
        { input: "[[2,5],[3,4]]", expectedOutput: "6" },
        { input: "[[1,2],[2,4],[4,8]]", expectedOutput: "8" },
        { input: "[[1,3],[2,4],[10,11],[10,12],[8,9]]", expectedOutput: "32" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 2, 5), ri(rng, 5, 9)]);
        const hi = pick(rng, [5, 20, 10000]);
        const tasks = Array.from({ length: n }, () => {
          const a = ri(rng, 1, hi);
          const m = rng() < 0.2 ? a : ri(rng, a, hi);
          return [a, m];
        });
        return { input: fmtIntMat(tasks), expectedOutput: String(ref(tasks)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumEffort(tasks: List[List[int]]) -> int:
              need = 0
              for actual, minimum in sorted(tasks, key=lambda t: t[1] - t[0]):
                  need = max(need + actual, minimum)
              return need
        `,
        javascript: code`
          var minimumEffort = function(tasks) {
              var t = tasks.slice().sort(function(a, b) { return (a[1] - a[0]) - (b[1] - b[0]); });
              var need = 0;
              for (var i = 0; i < t.length; i++) need = Math.max(need + t[i][0], t[i][1]);
              return need;
          };
        `,
        typescript: code`
          function minimumEffort(tasks: number[][]): number {
              var t = tasks.slice().sort(function(a, b) { return (a[1] - a[0]) - (b[1] - b[0]); });
              var need = 0;
              for (var i = 0; i < t.length; i++) need = Math.max(need + t[i][0], t[i][1]);
              return need;
          }
        `,
        java: code`
          public static int minimumEffort(int[][] tasks) {
              int[][] t = tasks.clone();
              Arrays.sort(t, (a, b) -> Integer.compare(a[1] - a[0], b[1] - b[0]));
              long need = 0;
              for (int[] task : t) need = Math.max(need + task[0], task[1]);
              return (int) need;
          }
        `,
        cpp: code`
          int minimumEffort(vector<vector<int>>& tasks) {
              vector<vector<int>> t(tasks);
              sort(t.begin(), t.end(), [](const vector<int>& a, const vector<int>& b) {
                  return a[1] - a[0] < b[1] - b[0];
              });
              long long need = 0;
              for (auto& task : t) need = max(need + task[0], (long long)task[1]);
              return (int)need;
          }
        `,
        c: code`
          typedef struct { int act; int mn; } TaskME;

          static int cmpTaskME(const void* x, const void* y) {
              const TaskME* p = (const TaskME*)x;
              const TaskME* q = (const TaskME*)y;
              int dp = p->mn - p->act, dq = q->mn - q->act;
              return (dp > dq) - (dp < dq);
          }

          int minimumEffort(int** tasks, int tasksSize, int* tasksColSize) {
              TaskME* t = (TaskME*)malloc(sizeof(TaskME) * tasksSize);
              for (int i = 0; i < tasksSize; i++) { t[i].act = tasks[i][0]; t[i].mn = tasks[i][1]; }
              qsort(t, tasksSize, sizeof(TaskME), cmpTaskME);
              long long need = 0;
              for (int i = 0; i < tasksSize; i++) {
                  long long v = need + t[i].act;
                  need = v > t[i].mn ? v : t[i].mn;
              }
              free(t);
              return (int)need;
          }
        `,
        csharp: code`
          public static int MinimumEffort(int[][] tasks)
          {
              int[][] t = (int[][])tasks.Clone();
              Array.Sort(t, (a, b) => (a[1] - a[0]).CompareTo(b[1] - b[0]));
              long need = 0;
              foreach (var task in t) need = Math.Max(need + task[0], task[1]);
              return (int)need;
          }
        `,
        go: code`
          func minimumEffort(tasks [][]int) int {
          	t := make([][]int, len(tasks))
          	copy(t, tasks)
          	sort.Slice(t, func(i, j int) bool { return t[i][1]-t[i][0] < t[j][1]-t[j][0] })
          	need := 0
          	for _, task := range t {
          		need += task[0]
          		if task[1] > need {
          			need = task[1]
          		}
          	}
          	return need
          }
        `,
        kotlin: code`
          fun minimumEffort(tasks: Array<IntArray>): Int {
              val t = tasks.sortedBy { it[1] - it[0] }
              var need = 0L
              for (task in t) need = maxOf(need + task[0], task[1].toLong())
              return need.toInt()
          }
        `,
        swift: code`
          func minimumEffort(_ tasks: [[Int]]) -> Int {
              let t = tasks.sorted { ($0[1] - $0[0]) < ($1[1] - $1[0]) }
              var need = 0
              for task in t { need = max(need + task[0], task[1]) }
              return need
          }
        `,
        rust: code`
          fn minimumEffort(tasks: Vec<Vec<i32>>) -> i32 {
              let mut t = tasks.clone();
              t.sort_by_key(|x| x[1] - x[0]);
              let mut need: i64 = 0;
              for task in t.iter() {
                  need = std::cmp::max(need + task[0] as i64, task[1] as i64);
              }
              need as i32
          }
        `,
        php: code`
          function minimumEffort($tasks) {
              $t = $tasks;
              usort($t, function($a, $b) { return ($a[1] - $a[0]) <=> ($b[1] - $b[0]); });
              $need = 0;
              foreach ($t as $task) $need = max($need + $task[0], $task[1]);
              return $need;
          }
        `,
        ruby: code`
          def minimumEffort(tasks)
            need = 0
            tasks.sort_by { |a, m| m - a }.each do |a, m|
              need = [need + a, m].max
            end
            need
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Weeks for Which You Can Work (LC 1953) ─────
  (() => {
    // Simulation for small totals: each week work on the project with the
    // most milestones left among those not worked on last week.
    const sim = (ms: number[]) => {
      const r = ms.slice();
      let last = -1, weeks = 0;
      for (;;) {
        let bi = -1;
        for (let i = 0; i < r.length; i++) if (i !== last && r[i] > 0 && (bi < 0 || r[i] > r[bi])) bi = i;
        if (bi < 0) return weeks;
        r[bi]--;
        last = bi;
        weeks++;
      }
    };
    const formula = (ms: number[]) => {
      const total = ms.reduce((a, b) => a + b, 0), mx = Math.max(...ms), rest = total - mx;
      return mx > rest + 1 ? 2 * rest + 1 : total;
    };
    return {
      slug: "maximum-number-of-weeks-for-which-you-can-work",
      title: "Maximum Number of Weeks for Which You Can Work",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Amazon", "Google"],
      signature: { funcName: "numberOfWeeks", params: [{ name: "milestones", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You run `n` projects; project `i` has `milestones[i]` milestones. Each week you finish exactly **one** milestone of one project, and you must work every week. You may never work on the same project two weeks in a row.\n\nYou stop as soon as every milestone is done, or when the only remaining work would break the rule. Return the maximum number of weeks you can work.\n\n*The original allows up to 10^9 milestones per project; here each count is at most 10^4 so the answer fits in a 32-bit integer.*",
        [
          { in: "milestones = [1,2,3]", out: "6", note: "Working on projects 2, 1, 2, 0, 2, 1 in that order finishes everything." },
          { in: "milestones = [6,2,1]", out: "7", note: "Project 0 has too many milestones: you can interleave it with the other three, giving 0, 1, 0, 1, 0, 2, 0." },
          { in: "milestones = [4]", out: "1" },
        ],
        ["n == milestones.length", "1 <= n <= 10^5", "1 <= milestones[i] <= 10^4"]),
      hints: [
        "Only the largest project can cause trouble — all the others can be interleaved with it.",
        "Let `rest` be the total of all projects except the largest, `mx`. If `mx <= rest + 1`, everything can be finished.",
        "Otherwise each of the `rest` milestones can separate two milestones of the big project: `2 · rest + 1` weeks.",
      ],
      editorial: explain({
        idea: "Compare the biggest project `mx` with the sum of the others, `rest`. If it is not more than `rest + 1`, all milestones fit; otherwise the big project can be used only `rest + 1` times, alternating with the others.",
        steps: [
          "Compute `total` and `mx = max(milestones)`; let `rest = total - mx`.",
          "If `mx > rest + 1`, return `2 · rest + 1`.",
          "Otherwise return `total`.",
        ],
        why: "Two weeks on the big project need a different project between them, so it can be worked at most `rest + 1` times — that gives the bound `2 · rest + 1` when `mx` is larger. When `mx <= rest + 1`, greedily working on the project with the most remaining milestones (other than last week's) never gets stuck before everything is done, because no project ever exceeds the rest by more than one.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "With the original bounds the answer needs 64 bits; keep a 64-bit total in fixed-width languages anyway.",
          "The threshold is `rest + 1`, not `rest`: the big project may start and end the schedule.",
          "A single project gives exactly one week.",
        ],
      }),
      examples: [
        { input: "[1,2,3]", expectedOutput: "6" },
        { input: "[6,2,1]", expectedOutput: "7" },
        { input: "[4]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 3);
        let ms: number[];
        if (cls <= 1) {
          const n = ri(rng, 1, 6);
          ms = Array.from({ length: n }, () => ri(rng, 1, 12));
          if (cls === 1) ms[ri(rng, 0, n - 1)] = ri(rng, 1, 40);
        } else {
          const n = ri(rng, 1, 30);
          ms = Array.from({ length: n }, () => ri(rng, 1, pick(rng, [10, 10000])));
          if (cls === 3) ms[ri(rng, 0, n - 1)] = 10000;
        }
        const total = ms.reduce((a, b) => a + b, 0);
        return { input: fmtIntArr(ms), expectedOutput: String(total <= 200 ? sim(ms) : formula(ms)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numberOfWeeks(milestones: List[int]) -> int:
              total = sum(milestones)
              mx = max(milestones)
              rest = total - mx
              return 2 * rest + 1 if mx > rest + 1 else total
        `,
        javascript: code`
          var numberOfWeeks = function(milestones) {
              var total = 0, mx = 0;
              for (var i = 0; i < milestones.length; i++) {
                  total += milestones[i];
                  if (milestones[i] > mx) mx = milestones[i];
              }
              var rest = total - mx;
              return mx > rest + 1 ? 2 * rest + 1 : total;
          };
        `,
        typescript: code`
          function numberOfWeeks(milestones: number[]): number {
              var total = 0, mx = 0;
              for (var i = 0; i < milestones.length; i++) {
                  total += milestones[i];
                  if (milestones[i] > mx) mx = milestones[i];
              }
              var rest = total - mx;
              return mx > rest + 1 ? 2 * rest + 1 : total;
          }
        `,
        java: code`
          public static int numberOfWeeks(int[] milestones) {
              long total = 0;
              int mx = 0;
              for (int v : milestones) { total += v; mx = Math.max(mx, v); }
              long rest = total - mx;
              return (int) (mx > rest + 1 ? 2 * rest + 1 : total);
          }
        `,
        cpp: code`
          int numberOfWeeks(vector<int>& milestones) {
              long long total = 0;
              int mx = 0;
              for (int v : milestones) { total += v; mx = max(mx, v); }
              long long rest = total - mx;
              return (int)(mx > rest + 1 ? 2 * rest + 1 : total);
          }
        `,
        c: code`
          int numberOfWeeks(int* milestones, int milestonesSize) {
              long long total = 0;
              int mx = 0;
              for (int i = 0; i < milestonesSize; i++) {
                  total += milestones[i];
                  if (milestones[i] > mx) mx = milestones[i];
              }
              long long rest = total - mx;
              return (int)(mx > rest + 1 ? 2 * rest + 1 : total);
          }
        `,
        csharp: code`
          public static int NumberOfWeeks(int[] milestones)
          {
              long total = 0;
              int mx = 0;
              foreach (int v in milestones) { total += v; mx = Math.Max(mx, v); }
              long rest = total - mx;
              return (int)(mx > rest + 1 ? 2 * rest + 1 : total);
          }
        `,
        go: code`
          func numberOfWeeks(milestones []int) int {
          	total, mx := 0, 0
          	for _, v := range milestones {
          		total += v
          		if v > mx {
          			mx = v
          		}
          	}
          	rest := total - mx
          	if mx > rest+1 {
          		return 2*rest + 1
          	}
          	return total
          }
        `,
        kotlin: code`
          fun numberOfWeeks(milestones: IntArray): Int {
              var total = 0L
              var mx = 0
              for (v in milestones) {
                  total += v
                  if (v > mx) mx = v
              }
              val rest = total - mx
              return (if (mx > rest + 1) 2 * rest + 1 else total).toInt()
          }
        `,
        swift: code`
          func numberOfWeeks(_ milestones: [Int]) -> Int {
              let total = milestones.reduce(0, +)
              let mx = milestones.max()!
              let rest = total - mx
              return mx > rest + 1 ? 2 * rest + 1 : total
          }
        `,
        rust: code`
          fn numberOfWeeks(milestones: Vec<i32>) -> i32 {
              let total: i64 = milestones.iter().map(|&v| v as i64).sum();
              let mx = *milestones.iter().max().unwrap() as i64;
              let rest = total - mx;
              (if mx > rest + 1 { 2 * rest + 1 } else { total }) as i32
          }
        `,
        php: code`
          function numberOfWeeks($milestones) {
              $total = array_sum($milestones);
              $mx = max($milestones);
              $rest = $total - $mx;
              return $mx > $rest + 1 ? 2 * $rest + 1 : $total;
          }
        `,
        ruby: code`
          def numberOfWeeks(milestones)
            total = milestones.sum
            mx = milestones.max
            rest = total - mx
            mx > rest + 1 ? 2 * rest + 1 : total
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost to Set Cooking Time (LC 2162) ───────────────────
  (() => {
    // Brute force over every key sequence of 1 to 4 digits (leading zeros included).
    const ref = (startAt: number, moveCost: number, pushCost: number, target: number) => {
      let best = Infinity;
      for (let len = 1; len <= 4; len++) {
        const lim = 10 ** len;
        for (let v = 0; v < lim; v++) {
          if (Math.floor(v / 100) * 60 + (v % 100) !== target) continue;
          const ds = String(v).padStart(len, "0");
          let cur = startAt, cost = 0;
          for (const ch of ds) {
            const d = ch.charCodeAt(0) - 48;
            if (d !== cur) { cost += moveCost; cur = d; }
            cost += pushCost;
          }
          best = Math.min(best, cost);
        }
      }
      return best;
    };
    return {
      slug: "minimum-cost-to-set-cooking-time",
      title: "Minimum Cost to Set Cooking Time",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Enumeration", "Amazon", "Google"],
      signature: {
        funcName: "minCostSetTime",
        params: [
          { name: "startAt", type: "int" as const },
          { name: "moveCost", type: "int" as const },
          { name: "pushCost", type: "int" as const },
          { name: "targetSeconds", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "The office microwave takes a cooking time typed as **at most four digits**. It pads what you typed with leading zeros to exactly four digits, reads the first two as minutes and the last two as seconds, and cooks for `minutes · 60 + seconds` seconds. Seconds may go up to 99, so `0190` (1 minute 90 seconds) is 150 seconds, the same as `0230`.\n\nYour finger starts on the digit `startAt`. Moving it to a **different** digit costs `moveCost`; pressing the digit under it costs `pushCost`. Pressing the same digit twice in a row needs no move.\n\nReturn the minimum cost to make the microwave cook for exactly `targetSeconds` seconds.",
        [
          { in: "startAt = 1, moveCost = 3, pushCost = 1, targetSeconds = 125", out: "9", note: "Type `165` (1 minute 65 seconds): press 1 (1), move to 6 and press (4), move to 5 and press (4)." },
          { in: "startAt = 1, moveCost = 2, pushCost = 1, targetSeconds = 600", out: "6", note: "Type `1000` (10 minutes 0 seconds): press 1 (1), move to 0 and press (3), press 0 twice (2). The other encoding `960` costs 9." },
          { in: "startAt = 0, moveCost = 1, pushCost = 2, targetSeconds = 76", out: "6", note: "Type `76`: move to 7, press, move to 6, press." },
        ],
        ["0 <= startAt <= 9", "1 <= moveCost, pushCost <= 10^5", "1 <= targetSeconds <= 6039"]),
      hints: [
        "There are at most two ways to split the target into a valid minutes/seconds pair: `m` minutes and `target - 60m` seconds with `0 <= seconds <= 99`.",
        "Typing leading zeros never helps — the microwave adds them for free.",
        "For each valid split, write `100 · minutes + seconds` without leading zeros, and price the digits one by one from `startAt`.",
      ],
      editorial: explain({
        idea: "Only two encodings of the target are possible: the normal one, and the one that borrows a minute as 60 extra seconds (when seconds would still be at most 99). Price each typed without leading zeros and take the cheaper.",
        steps: [
          "For `m` from 0 to 99, let `s = targetSeconds - 60m`; skip it unless `0 <= s <= 99`.",
          "Form the number `100m + s` and take its decimal digits (no leading zeros).",
          "Walk the digits from `startAt`: add `moveCost` when the digit differs from the finger's current digit, then always add `pushCost`.",
          "Return the smallest total.",
        ],
        why: "Every four-digit display `MMSS` with `MM · 60 + SS = target` and `SS <= 99` is covered by the loop. Typing extra leading zeros only adds presses: it can save no move, because going from the finger to 0 and then to the first real digit costs at least as much as going there directly.",
        time: "O(1) — at most 100 candidates of 4 digits",
        space: "O(1)",
        pitfalls: [
          "Seconds may exceed 59 — `1:90` is a valid way to enter 150 seconds and may be cheaper.",
          "Minutes cannot exceed 99, so large targets have only one encoding.",
          "Charge `moveCost` only when the next digit differs from the finger's current digit.",
        ],
      }),
      examples: [
        { input: "1\n3\n1\n125", expectedOutput: "9" },
        { input: "1\n2\n1\n600", expectedOutput: "6" },
        { input: "0\n1\n2\n76", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const startAt = ri(rng, 0, 9);
        const moveCost = pick(rng, [1, ri(rng, 1, 10), ri(rng, 1, 100000)]);
        const pushCost = pick(rng, [1, ri(rng, 1, 10), ri(rng, 1, 100000)]);
        const targetSeconds = pick(rng, [ri(rng, 1, 99), ri(rng, 60, 200), ri(rng, 1, 6039), 6039, ri(rng, 5900, 6039)]);
        return {
          input: `${startAt}\n${moveCost}\n${pushCost}\n${targetSeconds}`,
          expectedOutput: String(ref(startAt, moveCost, pushCost, targetSeconds)),
        };
      },
      solutions: {
        python: code`
          def minCostSetTime(startAt: int, moveCost: int, pushCost: int, targetSeconds: int) -> int:
              best = None
              for m in range(100):
                  s = targetSeconds - 60 * m
                  if s < 0 or s > 99:
                      continue
                  cur = startAt
                  cost = 0
                  for ch in str(100 * m + s):
                      d = ord(ch) - 48
                      if d != cur:
                          cost += moveCost
                          cur = d
                      cost += pushCost
                  if best is None or cost < best:
                      best = cost
              return best
        `,
        javascript: code`
          var minCostSetTime = function(startAt, moveCost, pushCost, targetSeconds) {
              var best = Infinity;
              for (var m = 0; m <= 99; m++) {
                  var s = targetSeconds - 60 * m;
                  if (s < 0 || s > 99) continue;
                  var digits = String(100 * m + s);
                  var cur = startAt, cost = 0;
                  for (var i = 0; i < digits.length; i++) {
                      var d = digits.charCodeAt(i) - 48;
                      if (d !== cur) { cost += moveCost; cur = d; }
                      cost += pushCost;
                  }
                  if (cost < best) best = cost;
              }
              return best;
          };
        `,
        typescript: code`
          function minCostSetTime(startAt: number, moveCost: number, pushCost: number, targetSeconds: number): number {
              var best = Infinity;
              for (var m = 0; m <= 99; m++) {
                  var s = targetSeconds - 60 * m;
                  if (s < 0 || s > 99) continue;
                  var digits = String(100 * m + s);
                  var cur = startAt, cost = 0;
                  for (var i = 0; i < digits.length; i++) {
                      var d = digits.charCodeAt(i) - 48;
                      if (d !== cur) { cost += moveCost; cur = d; }
                      cost += pushCost;
                  }
                  if (cost < best) best = cost;
              }
              return best;
          }
        `,
        java: code`
          public static int minCostSetTime(int startAt, int moveCost, int pushCost, int targetSeconds) {
              int best = Integer.MAX_VALUE;
              for (int m = 0; m <= 99; m++) {
                  int s = targetSeconds - 60 * m;
                  if (s < 0 || s > 99) continue;
                  String digits = Integer.toString(100 * m + s);
                  int cur = startAt, cost = 0;
                  for (int i = 0; i < digits.length(); i++) {
                      int d = digits.charAt(i) - '0';
                      if (d != cur) { cost += moveCost; cur = d; }
                      cost += pushCost;
                  }
                  best = Math.min(best, cost);
              }
              return best;
          }
        `,
        cpp: code`
          int minCostSetTime(int startAt, int moveCost, int pushCost, int targetSeconds) {
              int best = INT_MAX;
              for (int m = 0; m <= 99; m++) {
                  int s = targetSeconds - 60 * m;
                  if (s < 0 || s > 99) continue;
                  string digits = to_string(100 * m + s);
                  int cur = startAt, cost = 0;
                  for (char ch : digits) {
                      int d = ch - '0';
                      if (d != cur) { cost += moveCost; cur = d; }
                      cost += pushCost;
                  }
                  best = min(best, cost);
              }
              return best;
          }
        `,
        c: code`
          int minCostSetTime(int startAt, int moveCost, int pushCost, int targetSeconds) {
              int best = 2147483647;
              for (int m = 0; m <= 99; m++) {
                  int s = targetSeconds - 60 * m;
                  if (s < 0 || s > 99) continue;
                  int v = 100 * m + s;
                  int digits[4], len = 0;
                  while (v > 0) { digits[len++] = v % 10; v /= 10; }
                  int cur = startAt, cost = 0;
                  for (int i = len - 1; i >= 0; i--) {
                      if (digits[i] != cur) { cost += moveCost; cur = digits[i]; }
                      cost += pushCost;
                  }
                  if (cost < best) best = cost;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MinCostSetTime(int startAt, int moveCost, int pushCost, int targetSeconds)
          {
              int best = int.MaxValue;
              for (int m = 0; m <= 99; m++)
              {
                  int s = targetSeconds - 60 * m;
                  if (s < 0 || s > 99) continue;
                  string digits = (100 * m + s).ToString();
                  int cur = startAt, cost = 0;
                  foreach (char ch in digits)
                  {
                      int d = ch - '0';
                      if (d != cur) { cost += moveCost; cur = d; }
                      cost += pushCost;
                  }
                  best = Math.Min(best, cost);
              }
              return best;
          }
        `,
        go: code`
          func minCostSetTime(startAt int, moveCost int, pushCost int, targetSeconds int) int {
          	best := -1
          	for m := 0; m <= 99; m++ {
          		s := targetSeconds - 60*m
          		if s < 0 || s > 99 {
          			continue
          		}
          		digits := fmt.Sprint(100*m + s)
          		cur, cost := startAt, 0
          		for i := 0; i < len(digits); i++ {
          			d := int(digits[i] - '0')
          			if d != cur {
          				cost += moveCost
          				cur = d
          			}
          			cost += pushCost
          		}
          		if best < 0 || cost < best {
          			best = cost
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minCostSetTime(startAt: Int, moveCost: Int, pushCost: Int, targetSeconds: Int): Int {
              var best = Int.MAX_VALUE
              for (m in 0..99) {
                  val s = targetSeconds - 60 * m
                  if (s < 0 || s > 99) continue
                  val digits = (100 * m + s).toString()
                  var cur = startAt
                  var cost = 0
                  for (ch in digits) {
                      val d = ch - '0'
                      if (d != cur) {
                          cost += moveCost
                          cur = d
                      }
                      cost += pushCost
                  }
                  best = minOf(best, cost)
              }
              return best
          }
        `,
        swift: code`
          func minCostSetTime(_ startAt: Int, _ moveCost: Int, _ pushCost: Int, _ targetSeconds: Int) -> Int {
              var best = Int.max
              for m in 0...99 {
                  let s = targetSeconds - 60 * m
                  if s < 0 || s > 99 { continue }
                  var cur = startAt
                  var cost = 0
                  for ch in String(100 * m + s).utf8 {
                      let d = Int(ch) - 48
                      if d != cur {
                          cost += moveCost
                          cur = d
                      }
                      cost += pushCost
                  }
                  best = min(best, cost)
              }
              return best
          }
        `,
        rust: code`
          fn minCostSetTime(startAt: i32, moveCost: i32, pushCost: i32, targetSeconds: i32) -> i32 {
              let mut best = std::i32::MAX;
              for m in 0..100 {
                  let s = targetSeconds - 60 * m;
                  if s < 0 || s > 99 {
                      continue;
                  }
                  let digits = (100 * m + s).to_string();
                  let mut cur = startAt;
                  let mut cost = 0;
                  for b in digits.bytes() {
                      let d = (b - b'0') as i32;
                      if d != cur {
                          cost += moveCost;
                          cur = d;
                      }
                      cost += pushCost;
                  }
                  if cost < best {
                      best = cost;
                  }
              }
              best
          }
        `,
        php: code`
          function minCostSetTime($startAt, $moveCost, $pushCost, $targetSeconds) {
              $best = PHP_INT_MAX;
              for ($m = 0; $m <= 99; $m++) {
                  $s = $targetSeconds - 60 * $m;
                  if ($s < 0 || $s > 99) continue;
                  $digits = strval(100 * $m + $s);
                  $cur = $startAt;
                  $cost = 0;
                  $len = strlen($digits);
                  for ($i = 0; $i < $len; $i++) {
                      $d = ord($digits[$i]) - 48;
                      if ($d != $cur) { $cost += $moveCost; $cur = $d; }
                      $cost += $pushCost;
                  }
                  if ($cost < $best) $best = $cost;
              }
              return $best;
          }
        `,
        ruby: code`
          def minCostSetTime(startAt, moveCost, pushCost, targetSeconds)
            best = nil
            (0..99).each do |m|
              s = targetSeconds - 60 * m
              next if s < 0 || s > 99
              cur = startAt
              cost = 0
              (100 * m + s).to_s.each_char do |ch|
                d = ch.ord - 48
                if d != cur
                  cost += moveCost
                  cur = d
                end
                cost += pushCost
              end
              best = cost if best.nil? || cost < best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Partition Array Into Two Arrays to Minimize Sum Difference (LC 2035) ──
  (() => {
    // Brute force over every half-size subset.
    const ref = (nums: number[]) => {
      const m = nums.length, n = m / 2;
      const total = nums.reduce((a, b) => a + b, 0);
      let best = Infinity;
      for (let mask = 0; mask < 1 << m; mask++) {
        let c = 0, s = 0;
        for (let b = 0; b < m; b++) if ((mask >> b) & 1) { c++; s += nums[b]; }
        if (c === n) best = Math.min(best, Math.abs(total - 2 * s));
      }
      return best;
    };
    return {
      slug: "partition-array-into-two-arrays-to-minimize-sum-difference",
      title: "Partition Array Into Two Arrays to Minimize Sum Difference",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Bit Manipulation", "Bitmask", "Google", "Amazon"],
      signature: { funcName: "minimumDifference", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` of length `2 · n`. Split it into two arrays of length `n` each, so that every element goes to exactly one of them.\n\nReturn the minimum possible **absolute difference** between the sums of the two arrays.",
        [
          { in: "nums = [5,1,8,2]", out: "2", note: "Split into `[1,8]` and `[5,2]`: sums 9 and 7." },
          { in: "nums = [-40,40]", out: "80" },
          { in: "nums = [7,-3,4,1,-6,2]", out: "1", note: "`[7,-6,1]` sums to 2 and `[-3,4,2]` sums to 3." },
        ],
        ["1 <= n <= 15", "nums.length == 2 * n", "-10^7 <= nums[i] <= 10^7"]),
      hints: [
        "Trying all `C(30, 15)` splits is about 155 million — too many. Split the array into its left and right halves instead.",
        "If you take `k` elements from the left half, you must take `n - k` from the right half. Enumerate each half's subset sums grouped by size.",
        "For each left subset sum `a` of size `k`, binary-search the sorted right sums of size `n - k` for the value that brings `a + b` closest to `total / 2`.",
      ],
      editorial: explain({
        idea: "Meet in the middle. Each half has only `2^n <= 32768` subsets. A partition picks `k` elements from the left half and `n - k` from the right; for a fixed left sum, the best right sum is found by binary search.",
        steps: [
          "Let `total` be the sum of all elements. For the left half and the right half, list all subset sums grouped by subset size.",
          "Sort each size group of the right half.",
          "For each size `k` and each left sum `a` of that size, the difference is `|total - 2(a + b)|` for a right sum `b` of size `n - k`. Binary-search the right group for the first `b` with `2b >= total - 2a` and check it and its predecessor.",
          "Return the smallest difference found.",
        ],
        why: "Every partition corresponds to one left subset and one right subset whose sizes add up to `n`, and its difference is `|total - 2·(a + b)|`. For fixed `a`, that expression is minimised by the `b` closest to `(total - 2a) / 2`, which is one of the two neighbours of the binary-search position in the sorted group.",
        time: "O(2^n · n)",
        space: "O(2^n)",
        pitfalls: [
          "Group the right sums by size — mixing sizes breaks the requirement that each array has exactly `n` elements.",
          "Compare with integers (`2b >= total - 2a`) rather than dividing by two, which goes wrong with odd or negative totals.",
          "Check both the found position and the one before it.",
        ],
      }),
      examples: [
        { input: "[5,1,8,2]", expectedOutput: "2" },
        { input: "[-40,40]", expectedOutput: "80" },
        { input: "[7,-3,4,1,-6,2]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, ri(rng, 4, 6), ri(rng, 5, 6)]);
        const cls = ri(rng, 0, 3);
        const nums = Array.from({ length: 2 * n }, () => {
          if (cls === 0) return ri(rng, -10, 10);
          if (cls === 1) return ri(rng, 0, 1000);
          if (cls === 2) return pick(rng, [-10000000, 10000000, ri(rng, -10000000, 10000000)]);
          return ri(rng, -10000000, 10000000);
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from bisect import bisect_left

          def minimumDifference(nums: List[int]) -> int:
              n = len(nums) // 2
              total = sum(nums)

              def sums(arr):
                  groups = [[] for _ in range(n + 1)]
                  for mask in range(1 << n):
                      s = 0
                      c = 0
                      for b in range(n):
                          if mask >> b & 1:
                              s += arr[b]
                              c += 1
                      groups[c].append(s)
                  return groups

              left = sums(nums[:n])
              right = sums(nums[n:])
              for g in right:
                  g.sort()
              best = None
              for k in range(n + 1):
                  r = right[n - k]
                  for a in left[k]:
                      need = total - 2 * a
                      i = bisect_left(r, (need + 1) // 2)
                      for j in (i - 1, i):
                          if 0 <= j < len(r):
                              d = abs(need - 2 * r[j])
                              if best is None or d < best:
                                  best = d
              return best
        `,
        javascript: code`
          var minimumDifference = function(nums) {
              var n = nums.length / 2;
              var total = 0;
              for (var i = 0; i < nums.length; i++) total += nums[i];
              var sums = function(off) {
                  var groups = [];
                  for (var k = 0; k <= n; k++) groups.push([]);
                  for (var mask = 0; mask < (1 << n); mask++) {
                      var s = 0, c = 0;
                      for (var b = 0; b < n; b++) if (mask & (1 << b)) { s += nums[off + b]; c++; }
                      groups[c].push(s);
                  }
                  return groups;
              };
              var left = sums(0), right = sums(n);
              for (var g = 0; g <= n; g++) right[g].sort(function(x, y) { return x - y; });
              var best = Infinity;
              for (var k2 = 0; k2 <= n; k2++) {
                  var R = right[n - k2];
                  for (var t = 0; t < left[k2].length; t++) {
                      var need = total - 2 * left[k2][t];
                      var lo = 0, hi = R.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (2 * R[mid] < need) lo = mid + 1; else hi = mid;
                      }
                      if (lo < R.length) best = Math.min(best, Math.abs(need - 2 * R[lo]));
                      if (lo > 0) best = Math.min(best, Math.abs(need - 2 * R[lo - 1]));
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function minimumDifference(nums: number[]): number {
              var n = nums.length / 2;
              var total = 0;
              for (var i = 0; i < nums.length; i++) total += nums[i];
              var sums = function(off: number): number[][] {
                  var groups: number[][] = [];
                  for (var k = 0; k <= n; k++) groups.push([]);
                  for (var mask = 0; mask < (1 << n); mask++) {
                      var s = 0, c = 0;
                      for (var b = 0; b < n; b++) if (mask & (1 << b)) { s += nums[off + b]; c++; }
                      groups[c].push(s);
                  }
                  return groups;
              };
              var left = sums(0), right = sums(n);
              for (var g = 0; g <= n; g++) right[g].sort(function(x, y) { return x - y; });
              var best = Infinity;
              for (var k2 = 0; k2 <= n; k2++) {
                  var R = right[n - k2];
                  for (var t = 0; t < left[k2].length; t++) {
                      var need = total - 2 * left[k2][t];
                      var lo = 0, hi = R.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (2 * R[mid] < need) lo = mid + 1; else hi = mid;
                      }
                      if (lo < R.length) best = Math.min(best, Math.abs(need - 2 * R[lo]));
                      if (lo > 0) best = Math.min(best, Math.abs(need - 2 * R[lo - 1]));
                  }
              }
              return best;
          }
        `,
        java: code`
          private static List<List<Long>> halfSumsMD(int[] nums, int off, int n) {
              List<List<Long>> groups = new ArrayList<>();
              for (int k = 0; k <= n; k++) groups.add(new ArrayList<>());
              for (int mask = 0; mask < (1 << n); mask++) {
                  long s = 0;
                  for (int b = 0; b < n; b++) if ((mask >> b & 1) == 1) s += nums[off + b];
                  groups.get(Integer.bitCount(mask)).add(s);
              }
              return groups;
          }

          public static int minimumDifference(int[] nums) {
              int n = nums.length / 2;
              long total = 0;
              for (int v : nums) total += v;
              List<List<Long>> left = halfSumsMD(nums, 0, n), right = halfSumsMD(nums, n, n);
              long[][] r = new long[n + 1][];
              for (int k = 0; k <= n; k++) {
                  List<Long> g = right.get(k);
                  r[k] = new long[g.size()];
                  for (int i = 0; i < g.size(); i++) r[k][i] = g.get(i);
                  Arrays.sort(r[k]);
              }
              long best = Long.MAX_VALUE;
              for (int k = 0; k <= n; k++) {
                  long[] R = r[n - k];
                  for (long a : left.get(k)) {
                      long need = total - 2 * a;
                      int lo = 0, hi = R.length;
                      while (lo < hi) {
                          int mid = (lo + hi) >>> 1;
                          if (2 * R[mid] < need) lo = mid + 1; else hi = mid;
                      }
                      if (lo < R.length) best = Math.min(best, Math.abs(need - 2 * R[lo]));
                      if (lo > 0) best = Math.min(best, Math.abs(need - 2 * R[lo - 1]));
                  }
              }
              return (int) best;
          }
        `,
        cpp: code`
          static vector<vector<long long>> halfSumsMD(const vector<int>& nums, int off, int n) {
              vector<vector<long long>> groups(n + 1);
              for (int mask = 0; mask < (1 << n); mask++) {
                  long long s = 0;
                  for (int b = 0; b < n; b++) if (mask >> b & 1) s += nums[off + b];
                  groups[__builtin_popcount(mask)].push_back(s);
              }
              return groups;
          }

          int minimumDifference(vector<int>& nums) {
              int n = nums.size() / 2;
              long long total = 0;
              for (int v : nums) total += v;
              vector<vector<long long>> left = halfSumsMD(nums, 0, n), right = halfSumsMD(nums, n, n);
              for (auto& g : right) sort(g.begin(), g.end());
              long long best = LLONG_MAX;
              for (int k = 0; k <= n; k++) {
                  const vector<long long>& R = right[n - k];
                  for (long long a : left[k]) {
                      long long need = total - 2 * a;
                      int lo = 0, hi = R.size();
                      while (lo < hi) {
                          int mid = (lo + hi) / 2;
                          if (2 * R[mid] < need) lo = mid + 1; else hi = mid;
                      }
                      if (lo < (int)R.size()) best = min(best, llabs(need - 2 * R[lo]));
                      if (lo > 0) best = min(best, llabs(need - 2 * R[lo - 1]));
                  }
              }
              return (int)best;
          }
        `,
        c: code`
          static int cmpLLMD(const void* a, const void* b) {
              long long x = *(const long long*)a, y = *(const long long*)b;
              return (x > y) - (x < y);
          }

          int minimumDifference(int* nums, int numsSize) {
              int n = numsSize / 2;
              int full = 1 << n;
              long long total = 0;
              for (int i = 0; i < numsSize; i++) total += nums[i];
              int* start = (int*)calloc(n + 2, sizeof(int));
              for (int mask = 0; mask < full; mask++) start[__builtin_popcount(mask) + 1]++;
              for (int k = 1; k <= n + 1; k++) start[k] += start[k - 1];
              int* fill = (int*)malloc(sizeof(int) * (n + 1));
              for (int k = 0; k <= n; k++) fill[k] = start[k];
              long long* R = (long long*)malloc(sizeof(long long) * full);
              for (int mask = 0; mask < full; mask++) {
                  long long s = 0;
                  for (int b = 0; b < n; b++) if (mask >> b & 1) s += nums[n + b];
                  R[fill[__builtin_popcount(mask)]++] = s;
              }
              for (int k = 0; k <= n; k++) qsort(R + start[k], start[k + 1] - start[k], sizeof(long long), cmpLLMD);
              long long best = -1;
              for (int mask = 0; mask < full; mask++) {
                  long long a = 0;
                  for (int b = 0; b < n; b++) if (mask >> b & 1) a += nums[b];
                  int k = n - __builtin_popcount(mask);
                  int first = start[k], end = start[k + 1];
                  int lo = first, hi = end;
                  long long need = total - 2 * a;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (2 * R[mid] < need) lo = mid + 1; else hi = mid;
                  }
                  if (lo < end) {
                      long long d = need - 2 * R[lo];
                      if (d < 0) d = -d;
                      if (best < 0 || d < best) best = d;
                  }
                  if (lo > first) {
                      long long d = need - 2 * R[lo - 1];
                      if (d < 0) d = -d;
                      if (best < 0 || d < best) best = d;
                  }
              }
              free(start);
              free(fill);
              free(R);
              return (int)best;
          }
        `,
        csharp: code`
          private static List<long>[] HalfSumsMD(int[] nums, int off, int n)
          {
              var groups = new List<long>[n + 1];
              for (int k = 0; k <= n; k++) groups[k] = new List<long>();
              for (int mask = 0; mask < (1 << n); mask++)
              {
                  long s = 0;
                  int c = 0;
                  for (int b = 0; b < n; b++) if ((mask >> b & 1) == 1) { s += nums[off + b]; c++; }
                  groups[c].Add(s);
              }
              return groups;
          }

          public static int MinimumDifference(int[] nums)
          {
              int n = nums.Length / 2;
              long total = 0;
              foreach (int v in nums) total += v;
              var left = HalfSumsMD(nums, 0, n);
              var right = HalfSumsMD(nums, n, n);
              foreach (var g in right) g.Sort();
              long best = long.MaxValue;
              for (int k = 0; k <= n; k++)
              {
                  var R = right[n - k];
                  foreach (long a in left[k])
                  {
                      long need = total - 2 * a;
                      int lo = 0, hi = R.Count;
                      while (lo < hi)
                      {
                          int mid = (lo + hi) / 2;
                          if (2 * R[mid] < need) lo = mid + 1; else hi = mid;
                      }
                      if (lo < R.Count) best = Math.Min(best, Math.Abs(need - 2 * R[lo]));
                      if (lo > 0) best = Math.Min(best, Math.Abs(need - 2 * R[lo - 1]));
                  }
              }
              return (int)best;
          }
        `,
        go: code`
          func halfSumsMD(nums []int, off int, n int) [][]int {
          	groups := make([][]int, n+1)
          	for mask := 0; mask < 1<<uint(n); mask++ {
          		s, c := 0, 0
          		for b := 0; b < n; b++ {
          			if mask>>uint(b)&1 == 1 {
          				s += nums[off+b]
          				c++
          			}
          		}
          		groups[c] = append(groups[c], s)
          	}
          	return groups
          }

          func minimumDifference(nums []int) int {
          	n := len(nums) / 2
          	total := 0
          	for _, v := range nums {
          		total += v
          	}
          	left := halfSumsMD(nums, 0, n)
          	right := halfSumsMD(nums, n, n)
          	for _, g := range right {
          		sort.Ints(g)
          	}
          	best := -1
          	for k := 0; k <= n; k++ {
          		r := right[n-k]
          		for _, a := range left[k] {
          			need := total - 2*a
          			lo, hi := 0, len(r)
          			for lo < hi {
          				mid := (lo + hi) / 2
          				if 2*r[mid] < need {
          					lo = mid + 1
          				} else {
          					hi = mid
          				}
          			}
          			for _, j := range []int{lo - 1, lo} {
          				if j >= 0 && j < len(r) {
          					d := need - 2*r[j]
          					if d < 0 {
          						d = -d
          					}
          					if best < 0 || d < best {
          						best = d
          					}
          				}
          			}
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun halfSumsMD(nums: IntArray, off: Int, n: Int): Array<MutableList<Long>> {
              val groups = Array(n + 1) { mutableListOf<Long>() }
              for (mask in 0 until (1 shl n)) {
                  var s = 0L
                  for (b in 0 until n) if ((mask shr b) and 1 == 1) s += nums[off + b]
                  groups[Integer.bitCount(mask)].add(s)
              }
              return groups
          }

          fun minimumDifference(nums: IntArray): Int {
              val n = nums.size / 2
              var total = 0L
              for (v in nums) total += v
              val left = halfSumsMD(nums, 0, n)
              val right = halfSumsMD(nums, n, n).map { it.sorted().toLongArray() }
              var best = Long.MAX_VALUE
              for (k in 0..n) {
                  val r = right[n - k]
                  for (a in left[k]) {
                      val need = total - 2 * a
                      var lo = 0
                      var hi = r.size
                      while (lo < hi) {
                          val mid = (lo + hi) / 2
                          if (2 * r[mid] < need) {
                              lo = mid + 1
                          } else {
                              hi = mid
                          }
                      }
                      if (lo < r.size) best = minOf(best, Math.abs(need - 2 * r[lo]))
                      if (lo > 0) best = minOf(best, Math.abs(need - 2 * r[lo - 1]))
                  }
              }
              return best.toInt()
          }
        `,
        swift: code`
          func halfSumsMD(_ nums: [Int], _ off: Int, _ n: Int) -> [[Int]] {
              var groups = [[Int]](repeating: [], count: n + 1)
              for mask in 0..<(1 << n) {
                  var s = 0
                  var c = 0
                  for b in 0..<n where (mask >> b) & 1 == 1 {
                      s += nums[off + b]
                      c += 1
                  }
                  groups[c].append(s)
              }
              return groups
          }

          func minimumDifference(_ nums: [Int]) -> Int {
              let n = nums.count / 2
              let total = nums.reduce(0, +)
              let left = halfSumsMD(nums, 0, n)
              let right = halfSumsMD(nums, n, n).map { $0.sorted() }
              var best = Int.max
              for k in 0...n {
                  let r = right[n - k]
                  for a in left[k] {
                      let need = total - 2 * a
                      var lo = 0
                      var hi = r.count
                      while lo < hi {
                          let mid = (lo + hi) / 2
                          if 2 * r[mid] < need { lo = mid + 1 } else { hi = mid }
                      }
                      if lo < r.count { best = min(best, abs(need - 2 * r[lo])) }
                      if lo > 0 { best = min(best, abs(need - 2 * r[lo - 1])) }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn half_sums_md(nums: &Vec<i32>, off: usize, n: usize) -> Vec<Vec<i64>> {
              let mut groups: Vec<Vec<i64>> = vec![Vec::new(); n + 1];
              for mask in 0..(1usize << n) {
                  let mut s: i64 = 0;
                  let mut c = 0;
                  for b in 0..n {
                      if (mask >> b) & 1 == 1 {
                          s += nums[off + b] as i64;
                          c += 1;
                      }
                  }
                  groups[c].push(s);
              }
              groups
          }

          fn minimumDifference(nums: Vec<i32>) -> i32 {
              let n = nums.len() / 2;
              let total: i64 = nums.iter().map(|&v| v as i64).sum();
              let left = half_sums_md(&nums, 0, n);
              let mut right = half_sums_md(&nums, n, n);
              for g in right.iter_mut() {
                  g.sort();
              }
              let mut best = std::i64::MAX;
              for k in 0..(n + 1) {
                  let r = &right[n - k];
                  for &a in left[k].iter() {
                      let need = total - 2 * a;
                      let mut lo = 0usize;
                      let mut hi = r.len();
                      while lo < hi {
                          let mid = (lo + hi) / 2;
                          if 2 * r[mid] < need {
                              lo = mid + 1;
                          } else {
                              hi = mid;
                          }
                      }
                      if lo < r.len() {
                          best = std::cmp::min(best, (need - 2 * r[lo]).abs());
                      }
                      if lo > 0 {
                          best = std::cmp::min(best, (need - 2 * r[lo - 1]).abs());
                      }
                  }
              }
              best as i32
          }
        `,
        php: code`
          function halfSumsMD($nums, $off, $n) {
              $groups = array_fill(0, $n + 1, []);
              for ($mask = 0; $mask < (1 << $n); $mask++) {
                  $s = 0;
                  $c = 0;
                  for ($b = 0; $b < $n; $b++) {
                      if (($mask >> $b) & 1) { $s += $nums[$off + $b]; $c++; }
                  }
                  $groups[$c][] = $s;
              }
              return $groups;
          }

          function minimumDifference($nums) {
              $n = intdiv(count($nums), 2);
              $total = array_sum($nums);
              $left = halfSumsMD($nums, 0, $n);
              $right = halfSumsMD($nums, $n, $n);
              for ($k = 0; $k <= $n; $k++) sort($right[$k]);
              $best = PHP_INT_MAX;
              for ($k = 0; $k <= $n; $k++) {
                  $r = $right[$n - $k];
                  $len = count($r);
                  foreach ($left[$k] as $a) {
                      $need = $total - 2 * $a;
                      $lo = 0;
                      $hi = $len;
                      while ($lo < $hi) {
                          $mid = intdiv($lo + $hi, 2);
                          if (2 * $r[$mid] < $need) $lo = $mid + 1; else $hi = $mid;
                      }
                      if ($lo < $len) $best = min($best, abs($need - 2 * $r[$lo]));
                      if ($lo > 0) $best = min($best, abs($need - 2 * $r[$lo - 1]));
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def minimumDifference(nums)
            n = nums.length / 2
            total = nums.sum
            sums = lambda do |off|
              groups = Array.new(n + 1) { [] }
              (0...(1 << n)).each do |mask|
                s = 0
                c = 0
                n.times do |b|
                  if (mask >> b) & 1 == 1
                    s += nums[off + b]
                    c += 1
                  end
                end
                groups[c] << s
              end
              groups
            end
            left = sums.call(0)
            right = sums.call(n).map(&:sort)
            best = nil
            (0..n).each do |k|
              r = right[n - k]
              left[k].each do |a|
                need = total - 2 * a
                lo = (0...r.length).bsearch { |i| 2 * r[i] >= need } || r.length
                [lo - 1, lo].each do |j|
                  next if j < 0 || j >= r.length
                  d = (need - 2 * r[j]).abs
                  best = d if best.nil? || d < best
                end
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Operations to Make Arrays Similar (LC 2449) ──
  (() => {
    // Small n: try every parity-preserving matching; with a matching fixed,
    // each operation moves 2 units, so the count is (sum of increases) / 2.
    const brute = (nums: number[], target: number[]) => {
      const n = nums.length;
      const used = new Array(n).fill(false);
      let best = Infinity;
      const go = (i: number, up: number) => {
        if (up >= best) return;
        if (i === n) { best = up; return; }
        for (let j = 0; j < n; j++) {
          if (used[j] || (target[j] - nums[i]) % 2 !== 0) continue;
          used[j] = true;
          go(i + 1, up + Math.max(0, target[j] - nums[i]) / 2);
          used[j] = false;
        }
      };
      go(0, 0);
      return best;
    };
    const sorted = (nums: number[], target: number[]) => {
      const part = (a: number[], r: number) => a.filter((x) => x % 2 === r).sort((x, y) => x - y);
      let total = 0;
      for (const r of [0, 1]) {
        const a = part(nums, r), b = part(target, r);
        for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
      }
      return total / 4;
    };
    return {
      slug: "minimum-number-of-operations-to-make-arrays-similar",
      title: "Minimum Number of Operations to Make Arrays Similar",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Walmart"],
      signature: {
        funcName: "makeSimilar",
        params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two positive integer arrays `nums` and `target` of the same length. In one operation you choose two **different** indices `i` and `j` and set `nums[i] = nums[i] + 2` and `nums[j] = nums[j] - 2`.\n\nTwo arrays are **similar** when every value occurs the same number of times in both (they are equal after sorting).\n\nReturn the minimum number of operations that makes `nums` similar to `target`. The input guarantees this is possible.\n\n*The original allows values up to 10^6; here values are at most 10^4 so the answer fits in a 32-bit integer.*",
        [
          { in: "nums = [5,10,3], target = [9,6,3]", out: "2", note: "Twice: add 2 to the 5 and subtract 2 from the 10, reaching `[9,6,3]`." },
          { in: "nums = [8,12,6], target = [2,14,10]", out: "2" },
          { in: "nums = [1,1,1,1,1], target = [1,1,1,1,1]", out: "0" },
        ],
        ["n == nums.length == target.length", "1 <= n <= 10^5", "1 <= nums[i], target[i] <= 10^4", "nums can always be made similar to target"]),
      hints: [
        "An operation changes values by 2, so an odd value always stays odd and an even value stays even.",
        "Odd values must be matched with odd targets, even with even. Within each parity, which matching is cheapest?",
        "Sort each parity group of both arrays and pair them in order. The total `sum |nums - target|` over the pairs is moved 4 units per operation.",
      ],
      editorial: explain({
        idea: "Parity never changes, so odd values are matched to odd targets and even to even. Within each class, matching sorted to sorted minimises the total distance, and each operation closes exactly 4 units of distance (+2 on one element, −2 on another).",
        steps: [
          "Split `nums` and `target` into odd and even values and sort each of the four lists.",
          "Pair the i-th smallest odd value of `nums` with the i-th smallest odd target, and the same for even values.",
          "Sum `|a - b|` over all pairs (in 64-bit) and return the sum divided by 4.",
        ],
        why: "Fix a matching. Every element must move by an even amount; one operation raises one element by 2 and lowers another by 2, so the number of operations is at least half the total increase, i.e. a quarter of the total absolute distance — and that is achievable by pairing raises with lowers. Matching sorted lists in order minimises the total absolute distance (crossing pairs can always be uncrossed without increasing it).",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting the whole arrays together mixes parities and gives wrong pairs.",
          "Divide by 4, not 2: each operation reduces the total distance by 4.",
          "Accumulate the distance in 64 bits under the original bounds.",
        ],
      }),
      examples: [
        { input: "[5,10,3]\n[9,6,3]", expectedOutput: "2" },
        { input: "[8,12,6]\n[2,14,10]", expectedOutput: "2" },
        { input: "[1,1,1,1,1]\n[1,1,1,1,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 2, 6), ri(rng, 5, 6), ri(rng, 7, 40)]);
        const hi = pick(rng, [10, 100, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        const target = nums.slice();
        if (n >= 2) {
          for (let t = ri(rng, 0, 3 * n); t > 0; t--) {
            const i = ri(rng, 0, n - 1), j = ri(rng, 0, n - 1);
            const d = 2 * ri(rng, 1, Math.max(1, Math.floor(hi / 8)));
            if (i !== j && target[i] + d <= hi && target[j] - d >= 1) { target[i] += d; target[j] -= d; }
          }
        }
        shuffle(rng, target);
        shuffle(rng, nums);
        const out = n <= 6 ? brute(nums, target) : sorted(nums, target);
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(target)}`, expectedOutput: String(out) };
      },
      solutions: {
        python: code`
          from typing import List

          def makeSimilar(nums: List[int], target: List[int]) -> int:
              total = 0
              for r in (0, 1):
                  a = sorted(x for x in nums if x % 2 == r)
                  b = sorted(x for x in target if x % 2 == r)
                  total += sum(abs(x - y) for x, y in zip(a, b))
              return total // 4
        `,
        javascript: code`
          var makeSimilar = function(nums, target) {
              var part = function(arr, r) {
                  return arr.filter(function(x) { return x % 2 === r; }).sort(function(x, y) { return x - y; });
              };
              var total = 0;
              for (var r = 0; r < 2; r++) {
                  var a = part(nums, r), b = part(target, r);
                  for (var i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
              }
              return total / 4;
          };
        `,
        typescript: code`
          function makeSimilar(nums: number[], target: number[]): number {
              var part = function(arr: number[], r: number): number[] {
                  var out: number[] = [];
                  for (var i = 0; i < arr.length; i++) if (arr[i] % 2 === r) out.push(arr[i]);
                  return out.sort(function(x, y) { return x - y; });
              };
              var total = 0;
              for (var r = 0; r < 2; r++) {
                  var a = part(nums, r), b = part(target, r);
                  for (var j = 0; j < a.length; j++) total += Math.abs(a[j] - b[j]);
              }
              return total / 4;
          }
        `,
        java: code`
          public static int makeSimilar(int[] nums, int[] target) {
              int[] a = nums.clone(), b = target.clone();
              Arrays.sort(a);
              Arrays.sort(b);
              long total = 0;
              for (int r = 0; r < 2; r++) {
                  int i = 0, j = 0;
                  while (true) {
                      while (i < a.length && a[i] % 2 != r) i++;
                      while (j < b.length && b[j] % 2 != r) j++;
                      if (i >= a.length || j >= b.length) break;
                      total += Math.abs(a[i] - b[j]);
                      i++;
                      j++;
                  }
              }
              return (int) (total / 4);
          }
        `,
        cpp: code`
          int makeSimilar(vector<int>& nums, vector<int>& target) {
              long long total = 0;
              for (int r = 0; r < 2; r++) {
                  vector<int> a, b;
                  for (int x : nums) if (x % 2 == r) a.push_back(x);
                  for (int x : target) if (x % 2 == r) b.push_back(x);
                  sort(a.begin(), a.end());
                  sort(b.begin(), b.end());
                  for (size_t i = 0; i < a.size(); i++) total += abs(a[i] - b[i]);
              }
              return (int)(total / 4);
          }
        `,
        c: code`
          static int cmpIntSim(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int makeSimilar(int* nums, int numsSize, int* target, int targetSize) {
              int* a = (int*)malloc(sizeof(int) * numsSize);
              int* b = (int*)malloc(sizeof(int) * targetSize);
              long long total = 0;
              for (int r = 0; r < 2; r++) {
                  int na = 0, nb = 0;
                  for (int i = 0; i < numsSize; i++) if (nums[i] % 2 == r) a[na++] = nums[i];
                  for (int i = 0; i < targetSize; i++) if (target[i] % 2 == r) b[nb++] = target[i];
                  qsort(a, na, sizeof(int), cmpIntSim);
                  qsort(b, nb, sizeof(int), cmpIntSim);
                  for (int i = 0; i < na && i < nb; i++) total += a[i] > b[i] ? a[i] - b[i] : b[i] - a[i];
              }
              free(a);
              free(b);
              return (int)(total / 4);
          }
        `,
        csharp: code`
          public static int MakeSimilar(int[] nums, int[] target)
          {
              long total = 0;
              for (int r = 0; r < 2; r++)
              {
                  int[] a = nums.Where(x => x % 2 == r).OrderBy(x => x).ToArray();
                  int[] b = target.Where(x => x % 2 == r).OrderBy(x => x).ToArray();
                  for (int i = 0; i < a.Length; i++) total += Math.Abs(a[i] - b[i]);
              }
              return (int)(total / 4);
          }
        `,
        go: code`
          func makeSimilar(nums []int, target []int) int {
          	total := 0
          	for r := 0; r < 2; r++ {
          		a, b := []int{}, []int{}
          		for _, x := range nums {
          			if x%2 == r {
          				a = append(a, x)
          			}
          		}
          		for _, x := range target {
          			if x%2 == r {
          				b = append(b, x)
          			}
          		}
          		sort.Ints(a)
          		sort.Ints(b)
          		for i := range a {
          			d := a[i] - b[i]
          			if d < 0 {
          				d = -d
          			}
          			total += d
          		}
          	}
          	return total / 4
          }
        `,
        kotlin: code`
          fun makeSimilar(nums: IntArray, target: IntArray): Int {
              var total = 0L
              for (r in 0..1) {
                  val a = nums.filter { it % 2 == r }.sorted()
                  val b = target.filter { it % 2 == r }.sorted()
                  for (i in a.indices) total += Math.abs(a[i] - b[i]).toLong()
              }
              return (total / 4).toInt()
          }
        `,
        swift: code`
          func makeSimilar(_ nums: [Int], _ target: [Int]) -> Int {
              var total = 0
              for r in 0...1 {
                  let a = nums.filter { $0 % 2 == r }.sorted()
                  let b = target.filter { $0 % 2 == r }.sorted()
                  for i in 0..<a.count { total += abs(a[i] - b[i]) }
              }
              return total / 4
          }
        `,
        rust: code`
          fn makeSimilar(nums: Vec<i32>, target: Vec<i32>) -> i32 {
              let mut total: i64 = 0;
              for r in 0..2 {
                  let mut a: Vec<i64> = nums.iter().filter(|&&x| x % 2 == r).map(|&x| x as i64).collect();
                  let mut b: Vec<i64> = target.iter().filter(|&&x| x % 2 == r).map(|&x| x as i64).collect();
                  a.sort();
                  b.sort();
                  for i in 0..a.len() {
                      total += (a[i] - b[i]).abs();
                  }
              }
              (total / 4) as i32
          }
        `,
        php: code`
          function makeSimilar($nums, $target) {
              $total = 0;
              for ($r = 0; $r < 2; $r++) {
                  $a = [];
                  $b = [];
                  foreach ($nums as $x) if ($x % 2 == $r) $a[] = $x;
                  foreach ($target as $x) if ($x % 2 == $r) $b[] = $x;
                  sort($a);
                  sort($b);
                  $len = count($a);
                  for ($i = 0; $i < $len; $i++) $total += abs($a[$i] - $b[$i]);
              }
              return intdiv($total, 4);
          }
        `,
        ruby: code`
          def makeSimilar(nums, target)
            total = 0
            [0, 1].each do |r|
              a = nums.select { |x| x % 2 == r }.sort
              b = target.select { |x| x % 2 == r }.sort
              a.each_index { |i| total += (a[i] - b[i]).abs }
            end
            total / 4
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost to Make All Characters Equal (LC 2712) ──────────
  (() => {
    // Small strings: Dijkstra over all 2^n states with both kinds of inversion.
    const dijkstra = (s: string) => {
      const n = s.length, full = (1 << n) - 1;
      let start = 0;
      for (let i = 0; i < n; i++) if (s[i] === "1") start |= 1 << i;
      const dist = new Array(1 << n).fill(Infinity);
      const done = new Array(1 << n).fill(false);
      dist[start] = 0;
      for (;;) {
        let u = -1;
        for (let v = 0; v <= full; v++) if (!done[v] && (u < 0 || dist[v] < dist[u])) u = v;
        if (u < 0 || dist[u] === Infinity) break;
        if (u === 0 || u === full) return dist[u];
        done[u] = true;
        for (let i = 0; i < n; i++) {
          const pre = u ^ ((1 << (i + 1)) - 1), preCost = dist[u] + i + 1;
          if (preCost < dist[pre]) dist[pre] = preCost;
          const suf = u ^ (full ^ ((1 << i) - 1)), sufCost = dist[u] + n - i;
          if (sufCost < dist[suf]) dist[suf] = sufCost;
        }
      }
      return -1;
    };
    const formula = (s: string) => {
      let ans = 0;
      for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) ans += Math.min(i, s.length - i);
      return ans;
    };
    return {
      slug: "minimum-cost-to-make-all-characters-equal",
      title: "Minimum Cost to Make All Characters Equal",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "minimumCost", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a binary string `s` of length `n`. Two kinds of operation are available, and you may use them any number of times:\n\n- Choose an index `i` and invert every character from index `0` to `i` (inclusive). This costs `i + 1`.\n- Choose an index `i` and invert every character from index `i` to `n - 1` (inclusive). This costs `n - i`.\n\nInverting turns `'0'` into `'1'` and `'1'` into `'0'`. Return the minimum total cost to make all characters of the string equal.\n\n*The original allows `n` up to 10^5; here `n <= 5 · 10^4` so the cost fits in a 32-bit integer.*",
        [
          { in: "s = \"0110\"", out: "2", note: "Invert the suffix from index 3 (cost 1) and the prefix up to index 0 (cost 1): `1111`." },
          { in: "s = \"10101\"", out: "6" },
          { in: "s = \"1\"", out: "0" },
        ],
        ["1 <= s.length == n <= 5 * 10^4", "s[i] is '0' or '1'"]),
      hints: [
        "Look at each boundary where `s[i - 1] != s[i]`. The string is uniform exactly when there are no boundaries.",
        "An operation flips one side of a boundary, so it removes the boundary at its edge and leaves every other boundary in place.",
        "Each boundary at position `i` is removed independently, at the cheaper of a prefix flip (`i`) or a suffix flip (`n - i`).",
      ],
      editorial: explain({
        idea: "Only the boundaries between different neighbours matter. A prefix inversion ending at `i - 1` or a suffix inversion starting at `i` toggles exactly the boundary between positions `i - 1` and `i`, so each boundary is paid for separately at `min(i, n - i)`.",
        steps: [
          "Set `ans = 0`.",
          "For each `i` from 1 to `n - 1` with `s[i] != s[i - 1]`, add `min(i, n - i)`.",
          "Return `ans`.",
        ],
        why: "Inverting a prefix `[0, i-1]` (cost `i`) or a suffix `[i, n-1]` (cost `n - i`) changes whether position `i - 1` equals position `i`, and no other adjacent pair. The string is uniform exactly when no boundary remains, so every boundary needs at least one operation at its own position, costing at least `min(i, n - i)`; doing exactly that cheapest one for each boundary achieves the bound.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The prefix ending at index `i - 1` costs `i`, not `i - 1` — mind the off-by-one between index and cost.",
          "It does not matter whether the final string is all zeros or all ones; the boundary count decides.",
          "Under the original `n <= 10^5` the total needs 64 bits.",
        ],
      }),
      examples: [
        { input: "\"0110\"", expectedOutput: "2" },
        { input: "\"10101\"", expectedOutput: "6" },
        { input: "\"1\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const small = rng() < 0.5;
        const n = small ? ri(rng, 1, 7) : pick(rng, [ri(rng, 8, 60), ri(rng, 100, 400)]);
        const mode = ri(rng, 0, 3);
        let s = "";
        for (let i = 0; i < n; i++) {
          if (mode === 0) s += i % 2 === 0 ? "0" : "1";
          else if (mode === 1) s += rng() < 0.15 ? (s.length && s[s.length - 1] === "1" ? "0" : "1") : (s.length ? s[s.length - 1] : "0");
          else s += rng() < 0.5 ? "0" : "1";
        }
        return { input: `"${s}"`, expectedOutput: String(small ? dijkstra(s) : formula(s)) };
      },
      solutions: {
        python: code`
          def minimumCost(s: str) -> int:
              n = len(s)
              return sum(min(i, n - i) for i in range(1, n) if s[i] != s[i - 1])
        `,
        javascript: code`
          var minimumCost = function(s) {
              var n = s.length, ans = 0;
              for (var i = 1; i < n; i++) if (s[i] !== s[i - 1]) ans += Math.min(i, n - i);
              return ans;
          };
        `,
        typescript: code`
          function minimumCost(s: string): number {
              var n = s.length, ans = 0;
              for (var i = 1; i < n; i++) if (s.charAt(i) !== s.charAt(i - 1)) ans += Math.min(i, n - i);
              return ans;
          }
        `,
        java: code`
          public static int minimumCost(String s) {
              int n = s.length();
              long ans = 0;
              for (int i = 1; i < n; i++) if (s.charAt(i) != s.charAt(i - 1)) ans += Math.min(i, n - i);
              return (int) ans;
          }
        `,
        cpp: code`
          int minimumCost(string s) {
              int n = s.size();
              long long ans = 0;
              for (int i = 1; i < n; i++) if (s[i] != s[i - 1]) ans += min(i, n - i);
              return (int)ans;
          }
        `,
        c: code`
          int minimumCost(const char* s) {
              int n = (int)strlen(s);
              long long ans = 0;
              for (int i = 1; i < n; i++) if (s[i] != s[i - 1]) ans += i < n - i ? i : n - i;
              return (int)ans;
          }
        `,
        csharp: code`
          public static int MinimumCost(string s)
          {
              int n = s.Length;
              long ans = 0;
              for (int i = 1; i < n; i++) if (s[i] != s[i - 1]) ans += Math.Min(i, n - i);
              return (int)ans;
          }
        `,
        go: code`
          func minimumCost(s string) int {
          	n := len(s)
          	ans := 0
          	for i := 1; i < n; i++ {
          		if s[i] != s[i-1] {
          			if i < n-i {
          				ans += i
          			} else {
          				ans += n - i
          			}
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun minimumCost(s: String): Int {
              val n = s.length
              var ans = 0L
              for (i in 1 until n) if (s[i] != s[i - 1]) ans += minOf(i, n - i)
              return ans.toInt()
          }
        `,
        swift: code`
          func minimumCost(_ s: String) -> Int {
              let a = Array(s.utf8)
              let n = a.count
              var ans = 0
              var i = 1
              while i < n {
                  if a[i] != a[i - 1] { ans += min(i, n - i) }
                  i += 1
              }
              return ans
          }
        `,
        rust: code`
          fn minimumCost(s: String) -> i32 {
              let b = s.as_bytes();
              let n = b.len();
              let mut ans: i64 = 0;
              for i in 1..n {
                  if b[i] != b[i - 1] {
                      ans += std::cmp::min(i, n - i) as i64;
                  }
              }
              ans as i32
          }
        `,
        php: code`
          function minimumCost($s) {
              $n = strlen($s);
              $ans = 0;
              for ($i = 1; $i < $n; $i++) {
                  if ($s[$i] !== $s[$i - 1]) $ans += min($i, $n - $i);
              }
              return $ans;
          }
        `,
        ruby: code`
          def minimumCost(s)
            n = s.length
            ans = 0
            (1...n).each { |i| ans += [i, n - i].min if s[i] != s[i - 1] }
            ans
          end
        `,
      },
    };
  })(),

  // ── Rearranging Fruits (LC 2561) ─────────────────────────────────
  (() => {
    // Small baskets: Dijkstra over the contents of basket 1 (basket 2 is the
    // rest of the fixed multiset), with every swap as an edge.
    const dijkstra = (b1: number[], b2: number[]) => {
      const total = new Map<number, number>();
      for (const v of [...b1, ...b2]) total.set(v, (total.get(v) || 0) + 1);
      const keyOf = (a: number[]) => a.slice().sort((x, y) => x - y).join(",");
      const other = (a: number[]) => {
        const left = new Map(total);
        for (const v of a) left.set(v, left.get(v)! - 1);
        const out: number[] = [];
        left.forEach((c, v) => { for (let t = 0; t < c; t++) out.push(v); });
        return out;
      };
      const dist = new Map<string, number>([[keyOf(b1), 0]]);
      const done = new Set<string>();
      for (;;) {
        let u: string | null = null;
        dist.forEach((d, k) => { if (!done.has(k) && (u === null || d < dist.get(u)!)) u = k; });
        if (u === null) return -1;
        const uk: string = u;
        done.add(uk);
        const a = uk.split(",").map(Number);
        const b = other(a);
        const d = dist.get(uk)!;
        if (keyOf(b) === uk) return d;
        for (let i = 0; i < a.length; i++) {
          for (let j = 0; j < b.length; j++) {
            if (a[i] === b[j]) continue;
            const na = a.slice();
            na[i] = b[j];
            const nk = keyOf(na);
            const nd = d + Math.min(a[i], b[j]);
            if (!done.has(nk) && (!dist.has(nk) || nd < dist.get(nk)!)) dist.set(nk, nd);
          }
        }
      }
    };
    const greedy = (b1: number[], b2: number[]) => {
      const diff = new Map<number, number>();
      let mn = Infinity;
      for (let i = 0; i < b1.length; i++) {
        diff.set(b1[i], (diff.get(b1[i]) || 0) + 1);
        diff.set(b2[i], (diff.get(b2[i]) || 0) - 1);
        mn = Math.min(mn, b1[i], b2[i]);
      }
      const extra: number[] = [];
      for (const [v, c] of diff) {
        if (c % 2 !== 0) return -1;
        for (let t = 0; t < Math.abs(c) / 2; t++) extra.push(v);
      }
      extra.sort((x, y) => x - y);
      let ans = 0;
      for (let j = 0; j < extra.length / 2; j++) ans += Math.min(extra[j], 2 * mn);
      return ans;
    };
    return {
      slug: "rearranging-fruits",
      title: "Rearranging Fruits",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Greedy", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "minCost",
        params: [{ name: "basket1", type: "int[]" as const }, { name: "basket2", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Two baskets hold `n` fruits each; `basket1[i]` and `basket2[i]` are fruit costs. You want the two baskets to be **equal** — the same costs with the same multiplicities, in any order.\n\nIn one move you pick a fruit from `basket1` and a fruit from `basket2` and swap them. The move costs `min(x, y)`, where `x` and `y` are the costs of the two fruits swapped.\n\nReturn the minimum total cost to make the baskets equal, or `-1` if it is impossible.\n\n*The original allows costs up to 10^9; here costs are at most 10^4 so the answer fits in a 32-bit integer.*",
        [
          { in: "basket1 = [5,5,1,3], basket2 = [3,1,7,7]", out: "2", note: "Swap a 5 for the 1 in basket 2 (cost 1), then swap that 1 for a 7 (cost 1)." },
          { in: "basket1 = [4,2,2,2], basket2 = [1,4,1,2]", out: "1", note: "Swap a 2 from basket 1 with a 1 from basket 2." },
          { in: "basket1 = [2,3,4,1], basket2 = [3,2,5,1]", out: "-1", note: "There is one 4 and one 5 in total; they cannot be split evenly." },
        ],
        ["basket1.length == basket2.length", "1 <= basket1.length <= 10^5", "1 <= basket1[i], basket2[i] <= 10^4"]),
      hints: [
        "Count each cost across both baskets. If some cost appears an odd number of times in total, the answer is `-1`.",
        "Each basket must end with half of every cost. List the surplus fruits each basket must give away; the two lists have equal length `k`.",
        "Sort all surplus fruits together and pay for the `k` cheapest. A swap can also go through the globally cheapest fruit twice, so each payment is `min(cost, 2 · globalMin)`.",
      ],
      editorial: explain({
        idea: "Only the surplus fruits need to move. Each swap moves one surplus fruit from each side, and its price is the smaller of the two — so pair the cheapest surpluses with the most expensive ones. A detour through the cheapest fruit overall (two swaps at `globalMin` each) can be cheaper than a direct swap.",
        steps: [
          "Compute `diff[v] = count1[v] - count2[v]` for every cost `v`, and `globalMin`, the smallest cost in either basket.",
          "If any `diff[v]` is odd, return `-1`.",
          "Collect `|diff[v]| / 2` copies of each `v` into one list of surplus fruits (from both baskets) and sort it. It has `2k` entries.",
          "Sum `min(list[i], 2 · globalMin)` for `i` in `0 .. k - 1` and return the total.",
        ],
        why: "Each move fixes at most one surplus fruit on each side, so at least `k` paid moves are needed, and a direct swap costs the cheaper of its two fruits. Pairing the `k` cheapest surplus fruits with the `k` most expensive ones makes every paid price one of the `k` cheapest values, which is the least possible sum. Alternatively a surplus pair can be exchanged by swapping each with the global minimum fruit, costing `2 · globalMin`; taking the cheaper option per pair is optimal.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Forgetting the `2 · globalMin` detour gives answers that are too large.",
          "Pay for only half of the combined surplus list — the other half rides along for free in the same swaps.",
          "A negative odd difference is also odd: check `diff % 2 != 0`, not `== 1`.",
        ],
      }),
      examples: [
        { input: "[5,5,1,3]\n[3,1,7,7]", expectedOutput: "2" },
        { input: "[4,2,2,2]\n[1,4,1,2]", expectedOutput: "1" },
        { input: "[2,3,4,1]\n[3,2,5,1]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const small = rng() < 0.5;
        const n = small ? ri(rng, 1, 4) : ri(rng, 5, 40);
        const hi = small ? pick(rng, [3, 6, 20]) : pick(rng, [10, 1000, 10000]);
        let b1: number[], b2: number[];
        if (rng() < 0.25) {
          b1 = Array.from({ length: n }, () => ri(rng, 1, hi));
          b2 = Array.from({ length: n }, () => ri(rng, 1, hi));
        } else {
          const items: number[] = [];
          for (let i = 0; i < n; i++) { const v = ri(rng, 1, hi); items.push(v, v); }
          shuffle(rng, items);
          b1 = items.slice(0, n);
          b2 = items.slice(n);
        }
        const out = small ? dijkstra(b1, b2) : greedy(b1, b2);
        return { input: `${fmtIntArr(b1)}\n${fmtIntArr(b2)}`, expectedOutput: String(out) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def minCost(basket1: List[int], basket2: List[int]) -> int:
              diff = Counter(basket1)
              diff.subtract(Counter(basket2))
              mn = min(min(basket1), min(basket2))
              extra = []
              for v, c in diff.items():
                  if c % 2 != 0:
                      return -1
                  extra.extend([v] * (abs(c) // 2))
              extra.sort()
              return sum(min(x, 2 * mn) for x in extra[:len(extra) // 2])
        `,
        javascript: code`
          var minCost = function(basket1, basket2) {
              var diff = new Map();
              var mn = Infinity;
              for (var i = 0; i < basket1.length; i++) {
                  diff.set(basket1[i], (diff.get(basket1[i]) || 0) + 1);
                  diff.set(basket2[i], (diff.get(basket2[i]) || 0) - 1);
                  mn = Math.min(mn, basket1[i], basket2[i]);
              }
              var extra = [], bad = false;
              diff.forEach(function(c, v) {
                  if (c % 2 !== 0) bad = true;
                  for (var t = 0; t < Math.abs(c) / 2; t++) extra.push(v);
              });
              if (bad) return -1;
              extra.sort(function(a, b) { return a - b; });
              var ans = 0;
              for (var j = 0; j < extra.length / 2; j++) ans += Math.min(extra[j], 2 * mn);
              return ans;
          };
        `,
        typescript: code`
          function minCost(basket1: number[], basket2: number[]): number {
              var diff: { [k: string]: number } = {};
              var keys: number[] = [];
              var mn = Infinity;
              for (var i = 0; i < basket1.length; i++) {
                  var a = "" + basket1[i], b = "" + basket2[i];
                  if (diff[a] === undefined) { diff[a] = 0; keys.push(basket1[i]); }
                  if (diff[b] === undefined) { diff[b] = 0; keys.push(basket2[i]); }
                  diff[a]++;
                  diff[b]--;
                  mn = Math.min(mn, basket1[i], basket2[i]);
              }
              var extra: number[] = [];
              for (var k = 0; k < keys.length; k++) {
                  var c = diff["" + keys[k]];
                  if (c % 2 !== 0) return -1;
                  for (var t = 0; t < Math.abs(c) / 2; t++) extra.push(keys[k]);
              }
              extra.sort(function(x, y) { return x - y; });
              var ans = 0;
              for (var j = 0; j < extra.length / 2; j++) ans += Math.min(extra[j], 2 * mn);
              return ans;
          }
        `,
        java: code`
          public static int minCost(int[] basket1, int[] basket2) {
              Map<Integer, Integer> diff = new HashMap<>();
              int mn = Integer.MAX_VALUE;
              for (int i = 0; i < basket1.length; i++) {
                  diff.merge(basket1[i], 1, Integer::sum);
                  diff.merge(basket2[i], -1, Integer::sum);
                  mn = Math.min(mn, Math.min(basket1[i], basket2[i]));
              }
              List<Integer> extra = new ArrayList<>();
              for (Map.Entry<Integer, Integer> e : diff.entrySet()) {
                  int c = e.getValue();
                  if (c % 2 != 0) return -1;
                  for (int t = 0; t < Math.abs(c) / 2; t++) extra.add(e.getKey());
              }
              Collections.sort(extra);
              long ans = 0;
              for (int j = 0; j < extra.size() / 2; j++) ans += Math.min(extra.get(j), 2 * mn);
              return (int) ans;
          }
        `,
        cpp: code`
          int minCost(vector<int>& basket1, vector<int>& basket2) {
              map<int, int> diff;
              int mn = INT_MAX;
              for (size_t i = 0; i < basket1.size(); i++) {
                  diff[basket1[i]]++;
                  diff[basket2[i]]--;
                  mn = min(mn, min(basket1[i], basket2[i]));
              }
              vector<int> extra;
              for (auto& p : diff) {
                  if (p.second % 2 != 0) return -1;
                  for (int t = 0; t < abs(p.second) / 2; t++) extra.push_back(p.first);
              }
              sort(extra.begin(), extra.end());
              long long ans = 0;
              for (size_t j = 0; j < extra.size() / 2; j++) ans += min(extra[j], 2 * mn);
              return (int)ans;
          }
        `,
        c: code`
          static int cmpIntFruit(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int minCost(int* basket1, int basket1Size, int* basket2, int basket2Size) {
              int n = basket1Size;
              int* a = (int*)malloc(sizeof(int) * n);
              int* b = (int*)malloc(sizeof(int) * n);
              int* extra = (int*)malloc(sizeof(int) * 2 * n);
              int ne = 0, mn = 2147483647;
              for (int i = 0; i < n; i++) {
                  a[i] = basket1[i];
                  b[i] = basket2[i];
                  if (a[i] < mn) mn = a[i];
                  if (b[i] < mn) mn = b[i];
              }
              qsort(a, n, sizeof(int), cmpIntFruit);
              qsort(b, n, sizeof(int), cmpIntFruit);
              int i = 0, j = 0, bad = 0;
              while (i < n || j < n) {
                  int v;
                  if (j >= n || (i < n && a[i] <= b[j])) v = a[i]; else v = b[j];
                  int ca = 0, cb = 0;
                  while (i < n && a[i] == v) { ca++; i++; }
                  while (j < n && b[j] == v) { cb++; j++; }
                  int d = ca - cb;
                  if (d % 2 != 0) { bad = 1; break; }
                  if (d < 0) d = -d;
                  for (int t = 0; t < d / 2; t++) extra[ne++] = v;
              }
              long long ans = 0;
              if (!bad) {
                  qsort(extra, ne, sizeof(int), cmpIntFruit);
                  for (int t = 0; t < ne / 2; t++) ans += extra[t] < 2 * mn ? extra[t] : 2 * mn;
              }
              free(a);
              free(b);
              free(extra);
              return bad ? -1 : (int)ans;
          }
        `,
        csharp: code`
          public static int MinCost(int[] basket1, int[] basket2)
          {
              var diff = new Dictionary<int, int>();
              int mn = int.MaxValue;
              for (int i = 0; i < basket1.Length; i++)
              {
                  int cur;
                  diff.TryGetValue(basket1[i], out cur);
                  diff[basket1[i]] = cur + 1;
                  diff.TryGetValue(basket2[i], out cur);
                  diff[basket2[i]] = cur - 1;
                  mn = Math.Min(mn, Math.Min(basket1[i], basket2[i]));
              }
              var extra = new List<int>();
              foreach (var kv in diff)
              {
                  if (kv.Value % 2 != 0) return -1;
                  for (int t = 0; t < Math.Abs(kv.Value) / 2; t++) extra.Add(kv.Key);
              }
              extra.Sort();
              long ans = 0;
              for (int j = 0; j < extra.Count / 2; j++) ans += Math.Min(extra[j], 2 * mn);
              return (int)ans;
          }
        `,
        go: code`
          func minCost(basket1 []int, basket2 []int) int {
          	diff := map[int]int{}
          	mn := basket1[0]
          	for i := range basket1 {
          		diff[basket1[i]]++
          		diff[basket2[i]]--
          		if basket1[i] < mn {
          			mn = basket1[i]
          		}
          		if basket2[i] < mn {
          			mn = basket2[i]
          		}
          	}
          	extra := []int{}
          	for v, c := range diff {
          		if c%2 != 0 {
          			return -1
          		}
          		if c < 0 {
          			c = -c
          		}
          		for t := 0; t < c/2; t++ {
          			extra = append(extra, v)
          		}
          	}
          	sort.Ints(extra)
          	ans := 0
          	for j := 0; j < len(extra)/2; j++ {
          		if extra[j] < 2*mn {
          			ans += extra[j]
          		} else {
          			ans += 2 * mn
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun minCost(basket1: IntArray, basket2: IntArray): Int {
              val diff = HashMap<Int, Int>()
              var mn = Int.MAX_VALUE
              for (i in basket1.indices) {
                  diff[basket1[i]] = (diff[basket1[i]] ?: 0) + 1
                  diff[basket2[i]] = (diff[basket2[i]] ?: 0) - 1
                  mn = minOf(mn, minOf(basket1[i], basket2[i]))
              }
              val extra = ArrayList<Int>()
              for ((v, c) in diff) {
                  if (c % 2 != 0) return -1
                  repeat(Math.abs(c) / 2) { extra.add(v) }
              }
              extra.sort()
              var ans = 0L
              for (j in 0 until extra.size / 2) ans += minOf(extra[j], 2 * mn)
              return ans.toInt()
          }
        `,
        swift: code`
          func minCost(_ basket1: [Int], _ basket2: [Int]) -> Int {
              var diff = [Int: Int]()
              var mn = Int.max
              for i in 0..<basket1.count {
                  diff[basket1[i], default: 0] += 1
                  diff[basket2[i], default: 0] -= 1
                  mn = min(mn, min(basket1[i], basket2[i]))
              }
              var extra = [Int]()
              for (v, c) in diff {
                  if c % 2 != 0 { return -1 }
                  for _ in 0..<(abs(c) / 2) { extra.append(v) }
              }
              extra.sort()
              var ans = 0
              for j in 0..<(extra.count / 2) { ans += min(extra[j], 2 * mn) }
              return ans
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn minCost(basket1: Vec<i32>, basket2: Vec<i32>) -> i32 {
              let mut diff: HashMap<i32, i32> = HashMap::new();
              let mut mn = std::i32::MAX;
              for i in 0..basket1.len() {
                  *diff.entry(basket1[i]).or_insert(0) += 1;
                  *diff.entry(basket2[i]).or_insert(0) -= 1;
                  mn = std::cmp::min(mn, std::cmp::min(basket1[i], basket2[i]));
              }
              let mut extra: Vec<i64> = Vec::new();
              for (&v, &c) in diff.iter() {
                  if c % 2 != 0 {
                      return -1;
                  }
                  for _ in 0..(c.abs() / 2) {
                      extra.push(v as i64);
                  }
              }
              extra.sort();
              let mut ans: i64 = 0;
              for j in 0..extra.len() / 2 {
                  ans += std::cmp::min(extra[j], 2 * mn as i64);
              }
              ans as i32
          }
        `,
        php: code`
          function minCost($basket1, $basket2) {
              $diff = [];
              $mn = PHP_INT_MAX;
              $n = count($basket1);
              for ($i = 0; $i < $n; $i++) {
                  $a = $basket1[$i];
                  $b = $basket2[$i];
                  $diff[$a] = (isset($diff[$a]) ? $diff[$a] : 0) + 1;
                  $diff[$b] = (isset($diff[$b]) ? $diff[$b] : 0) - 1;
                  $mn = min($mn, $a, $b);
              }
              $extra = [];
              foreach ($diff as $v => $c) {
                  if ($c % 2 != 0) return -1;
                  for ($t = 0; $t < intdiv(abs($c), 2); $t++) $extra[] = $v;
              }
              sort($extra);
              $ans = 0;
              $half = intdiv(count($extra), 2);
              for ($j = 0; $j < $half; $j++) $ans += min($extra[$j], 2 * $mn);
              return $ans;
          }
        `,
        ruby: code`
          def minCost(basket1, basket2)
            diff = Hash.new(0)
            basket1.each { |v| diff[v] += 1 }
            basket2.each { |v| diff[v] -= 1 }
            mn = [basket1.min, basket2.min].min
            extra = []
            diff.each do |v, c|
              return -1 if c.odd?
              (c.abs / 2).times { extra << v }
            end
            extra.sort!
            extra.first(extra.length / 2).sum { |x| [x, 2 * mn].min }
          end
        `,
      },
    };
  })(),

  // ── Maximum Strength of a Group (LC 2708) ────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = -Infinity;
      for (let mask = 1; mask < 1 << nums.length; mask++) {
        let p = 1;
        for (let i = 0; i < nums.length; i++) if ((mask >> i) & 1) p *= nums[i];
        best = Math.max(best, p);
      }
      return best;
    };
    return {
      slug: "maximum-strength-of-a-group",
      title: "Maximum Strength of a Group",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Enumeration", "Amazon", "Google"],
      signature: { funcName: "maxStrength", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums[i]` is the score of the `i`-th student in a CodeKairo study group. Pick a **non-empty** group of students; the group's **strength** is the product of their scores.\n\nReturn the maximum strength any group can have.\n\n*The original allows up to 13 students; here there are at most 9 so the product fits in a 32-bit integer.*",
        [
          { in: "nums = [3,-1,-5,2,5,-9]", out: "1350", note: "Take 3, -5, 2, 5 and -9: the two negatives cancel." },
          { in: "nums = [-2,0,-3,4]", out: "24" },
          { in: "nums = [0,-7]", out: "0", note: "The single negative is worse than the group `[0]`." },
        ],
        ["1 <= nums.length <= 9", "-9 <= nums[i] <= 9"]),
      hints: [
        "Every positive score helps; zeros never help unless nothing better exists.",
        "Negative scores come in pairs. With an odd number of negatives, drop the one closest to zero.",
        "Watch the corner cases: a single element, or nothing left to multiply (then the answer is 0 if a zero exists).",
      ],
      editorial: explain({
        idea: "Multiply all positives and all negatives, except that with an odd count of negatives you drop the one with the smallest absolute value. Zeros are only the fallback when no factor survives.",
        steps: [
          "If there is one element, return it.",
          "Multiply all positive values. Sort the negatives; multiply all of them, or all but the largest (closest to zero) if their count is odd.",
          "If no factor was used at all, the remaining elements are zeros (plus at most one negative) — return 0.",
          "Otherwise return the product.",
        ],
        why: "Any positive factor greater than or equal to 1 never lowers a positive product, and a pair of negatives multiplies to a positive, so the best product uses every positive and an even number of negatives — the most negative ones, which have the largest absolute values. When that leaves an empty group, a zero gives 0, which beats any negative group.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "A single negative element must be returned as is — the group cannot be empty.",
          "With one negative and some zeros the answer is 0, not the negative.",
          "Under the original 13 elements the product needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[3,-1,-5,2,5,-9]", expectedOutput: "1350" },
        { input: "[-2,0,-3,4]", expectedOutput: "24" },
        { input: "[0,-7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 1, 9), ri(rng, 6, 9)]);
        const cls = ri(rng, 0, 4);
        const nums = Array.from({ length: n }, () => {
          if (cls === 0) return ri(rng, -9, 0);
          if (cls === 1) return pick(rng, [0, 0, -1, 1, -9, 9]);
          if (cls === 2) return pick(rng, [-9, 9, -8, 8]);
          return ri(rng, -9, 9);
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxStrength(nums: List[int]) -> int:
              if len(nums) == 1:
                  return nums[0]
              prod = 1
              used = 0
              for x in nums:
                  if x > 0:
                      prod *= x
                      used += 1
              neg = sorted(x for x in nums if x < 0)
              take = len(neg) - (len(neg) % 2)
              for x in neg[:take]:
                  prod *= x
                  used += 1
              return prod if used > 0 else 0
        `,
        javascript: code`
          var maxStrength = function(nums) {
              if (nums.length === 1) return nums[0];
              var prod = 1, used = 0, neg = [];
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] > 0) { prod *= nums[i]; used++; }
                  else if (nums[i] < 0) neg.push(nums[i]);
              }
              neg.sort(function(a, b) { return a - b; });
              var take = neg.length - (neg.length % 2);
              for (var j = 0; j < take; j++) { prod *= neg[j]; used++; }
              return used > 0 ? prod : 0;
          };
        `,
        typescript: code`
          function maxStrength(nums: number[]): number {
              if (nums.length === 1) return nums[0];
              var prod = 1, used = 0;
              var neg: number[] = [];
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] > 0) { prod *= nums[i]; used++; }
                  else if (nums[i] < 0) neg.push(nums[i]);
              }
              neg.sort(function(a, b) { return a - b; });
              var take = neg.length - (neg.length % 2);
              for (var j = 0; j < take; j++) { prod *= neg[j]; used++; }
              return used > 0 ? prod : 0;
          }
        `,
        java: code`
          public static int maxStrength(int[] nums) {
              if (nums.length == 1) return nums[0];
              long prod = 1;
              int used = 0;
              List<Integer> neg = new ArrayList<>();
              for (int x : nums) {
                  if (x > 0) { prod *= x; used++; }
                  else if (x < 0) neg.add(x);
              }
              Collections.sort(neg);
              int take = neg.size() - (neg.size() % 2);
              for (int j = 0; j < take; j++) { prod *= neg.get(j); used++; }
              return used > 0 ? (int) prod : 0;
          }
        `,
        cpp: code`
          int maxStrength(vector<int>& nums) {
              if (nums.size() == 1) return nums[0];
              long long prod = 1;
              int used = 0;
              vector<int> neg;
              for (int x : nums) {
                  if (x > 0) { prod *= x; used++; }
                  else if (x < 0) neg.push_back(x);
              }
              sort(neg.begin(), neg.end());
              int take = neg.size() - (neg.size() % 2);
              for (int j = 0; j < take; j++) { prod *= neg[j]; used++; }
              return used > 0 ? (int)prod : 0;
          }
        `,
        c: code`
          static int cmpIntStrength(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int maxStrength(int* nums, int numsSize) {
              if (numsSize == 1) return nums[0];
              long long prod = 1;
              int used = 0, nn = 0;
              int* neg = (int*)malloc(sizeof(int) * numsSize);
              for (int i = 0; i < numsSize; i++) {
                  if (nums[i] > 0) { prod *= nums[i]; used++; }
                  else if (nums[i] < 0) neg[nn++] = nums[i];
              }
              qsort(neg, nn, sizeof(int), cmpIntStrength);
              int take = nn - (nn % 2);
              for (int j = 0; j < take; j++) { prod *= neg[j]; used++; }
              free(neg);
              return used > 0 ? (int)prod : 0;
          }
        `,
        csharp: code`
          public static int MaxStrength(int[] nums)
          {
              if (nums.Length == 1) return nums[0];
              long prod = 1;
              int used = 0;
              var neg = new List<int>();
              foreach (int x in nums)
              {
                  if (x > 0) { prod *= x; used++; }
                  else if (x < 0) neg.Add(x);
              }
              neg.Sort();
              int take = neg.Count - (neg.Count % 2);
              for (int j = 0; j < take; j++) { prod *= neg[j]; used++; }
              return used > 0 ? (int)prod : 0;
          }
        `,
        go: code`
          func maxStrength(nums []int) int {
          	if len(nums) == 1 {
          		return nums[0]
          	}
          	prod, used := 1, 0
          	neg := []int{}
          	for _, x := range nums {
          		if x > 0 {
          			prod *= x
          			used++
          		} else if x < 0 {
          			neg = append(neg, x)
          		}
          	}
          	sort.Ints(neg)
          	take := len(neg) - len(neg)%2
          	for j := 0; j < take; j++ {
          		prod *= neg[j]
          		used++
          	}
          	if used > 0 {
          		return prod
          	}
          	return 0
          }
        `,
        kotlin: code`
          fun maxStrength(nums: IntArray): Int {
              if (nums.size == 1) return nums[0]
              var prod = 1L
              var used = 0
              val neg = nums.filter { it < 0 }.sorted()
              for (x in nums) if (x > 0) {
                  prod *= x
                  used++
              }
              val take = neg.size - neg.size % 2
              for (j in 0 until take) {
                  prod *= neg[j]
                  used++
              }
              return if (used > 0) prod.toInt() else 0
          }
        `,
        swift: code`
          func maxStrength(_ nums: [Int]) -> Int {
              if nums.count == 1 { return nums[0] }
              var prod = 1
              var used = 0
              for x in nums where x > 0 {
                  prod *= x
                  used += 1
              }
              let neg = nums.filter { $0 < 0 }.sorted()
              let take = neg.count - neg.count % 2
              for j in 0..<take {
                  prod *= neg[j]
                  used += 1
              }
              return used > 0 ? prod : 0
          }
        `,
        rust: code`
          fn maxStrength(nums: Vec<i32>) -> i32 {
              if nums.len() == 1 {
                  return nums[0];
              }
              let mut prod: i64 = 1;
              let mut used = 0;
              for &x in nums.iter() {
                  if x > 0 {
                      prod *= x as i64;
                      used += 1;
                  }
              }
              let mut neg: Vec<i64> = nums.iter().filter(|&&x| x < 0).map(|&x| x as i64).collect();
              neg.sort();
              let take = neg.len() - neg.len() % 2;
              for j in 0..take {
                  prod *= neg[j];
                  used += 1;
              }
              if used > 0 { prod as i32 } else { 0 }
          }
        `,
        php: code`
          function maxStrength($nums) {
              if (count($nums) == 1) return $nums[0];
              $prod = 1;
              $used = 0;
              $neg = [];
              foreach ($nums as $x) {
                  if ($x > 0) { $prod *= $x; $used++; }
                  elseif ($x < 0) $neg[] = $x;
              }
              sort($neg);
              $take = count($neg) - (count($neg) % 2);
              for ($j = 0; $j < $take; $j++) { $prod *= $neg[$j]; $used++; }
              return $used > 0 ? $prod : 0;
          }
        `,
        ruby: code`
          def maxStrength(nums)
            return nums[0] if nums.length == 1
            prod = 1
            used = 0
            nums.each do |x|
              if x > 0
                prod *= x
                used += 1
              end
            end
            neg = nums.select { |x| x < 0 }.sort
            take = neg.length - neg.length % 2
            neg.first(take).each do |x|
              prod *= x
              used += 1
            end
            used > 0 ? prod : 0
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Form Subsequence With Target Sum (LC 2835) ──
  (() => {
    // Small inputs: BFS over the multiset of powers (as counts per bit), where
    // one move splits a 2^b into two 2^(b-1). Goal: target is a subset sum.
    const bfs = (nums: number[], target: number) => {
      const sum = nums.reduce((a, b) => a + b, 0);
      if (sum < target) return -1;
      const B = 6;
      const start = new Array(B).fill(0);
      for (const v of nums) start[31 - Math.clz32(v)]++;
      const formable = (cnt: number[]) => {
        let reach = 1; // bit s set = sum s formable (sums up to 31 tracked)
        for (let b = 0; b < B; b++) for (let t = 0; t < cnt[b]; t++) reach |= reach << (1 << b);
        return ((reach >>> target) & 1) === 1;
      };
      const seen = new Set<string>([start.join(",")]);
      let frontier = [start];
      for (let d = 0; frontier.length; d++) {
        const next: number[][] = [];
        for (const cnt of frontier) {
          if (formable(cnt)) return d;
          for (let b = 1; b < B; b++) {
            if (!cnt[b]) continue;
            const nc = cnt.slice();
            nc[b]--;
            nc[b - 1] += 2;
            const k = nc.join(",");
            if (!seen.has(k)) { seen.add(k); next.push(nc); }
          }
        }
        frontier = next;
      }
      return -1;
    };
    const greedy = (nums: number[], target: number) => {
      const cnt = new Array(64).fill(0);
      let sum = 0;
      for (const v of nums) { sum += v; cnt[31 - Math.clz32(v)]++; }
      if (sum < target) return -1;
      let ops = 0;
      for (let b = 0; b < 31; b++) {
        if (Math.floor(target / 2 ** b) % 2 === 1) {
          if (cnt[b] > 0) cnt[b]--;
          else {
            let j = b;
            while (cnt[j] === 0) j++;
            ops += j - b;
            cnt[j]--;
            for (let t = b; t < j; t++) cnt[t]++;
          }
        }
        cnt[b + 1] += Math.floor(cnt[b] / 2);
      }
      return ops;
    };
    return {
      slug: "minimum-operations-to-form-subsequence-with-target-sum",
      title: "Minimum Operations to Form Subsequence With Target Sum",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Bit Manipulation", "Amazon", "Google"],
      signature: {
        funcName: "minOperations",
        params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array `nums` of **powers of two** and an integer `target`. In one operation you pick an element `nums[i] > 1`, remove it, and append two copies of `nums[i] / 2` to the end of the array.\n\nReturn the minimum number of operations after which `nums` has a **subsequence** whose elements sum to `target`, or `-1` if that can never happen.",
        [
          { in: "nums = [16,1], target = 6", out: "3", note: "Split 16 → 8, 8; split an 8 → 4, 4; split a 4 → 2, 2. Now 4 + 2 = 6." },
          { in: "nums = [4,1,1], target = 3", out: "1", note: "Split the 4 into two 2s, then take 2 + 1." },
          { in: "nums = [8], target = 9", out: "-1", note: "The total is only 8." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 2^30", "nums consists only of non-negative powers of two", "1 <= target < 2^31"]),
      hints: [
        "Splitting never changes the total, so if `sum(nums) < target` the answer is `-1`; otherwise an answer always exists.",
        "Since a subsequence may take elements in any positions, only the count of each power matters. Go through the bits of `target` from the lowest.",
        "Small pieces can combine: two leftover `2^b` act as one `2^(b+1)`. When a needed bit has nothing available, split the nearest larger power down to it, costing one operation per level.",
      ],
      editorial: explain({
        idea: "Work bit by bit from the least significant. Keep counts of each power; unused small powers pair up to serve higher bits for free, and when a bit of `target` cannot be covered, break the smallest larger power — that costs exactly the number of levels it descends.",
        steps: [
          "If `sum(nums) < target`, return `-1` (use 64-bit for the sum).",
          "Count `cnt[b]`, the number of elements equal to `2^b`.",
          "For `b` from 0 to 30: if bit `b` of `target` is set, use one `2^b` if `cnt[b] > 0`; otherwise find the smallest `j > b` with `cnt[j] > 0`, add `j - b` to the answer, decrement `cnt[j]`, and add one to each `cnt[b] .. cnt[j - 1]` (splitting leaves one spare at each level, and the second `2^b` is the one used).",
          "Then carry: `cnt[b + 1] += cnt[b] / 2`, since two unused `2^b` sum to `2^(b+1)`.",
          "Return the total.",
        ],
        why: "Low bits of `target` can only be formed from equally low or lower powers, so it is safe to settle them first, and merging two spare `2^b` into a virtual `2^(b+1)` loses nothing. When a bit is missing, some larger power must be split at least down to that level; splitting the smallest available one costs the fewest operations and leaves spares (`2^b … 2^(j-1)`) that only help later bits.",
        time: "O(n + 31^2)",
        space: "O(31)",
        pitfalls: [
          "The sum of `nums` can exceed 32 bits — check feasibility with 64-bit arithmetic.",
          "Carry the leftover counts upward after handling each bit; otherwise pairs of small powers are wasted.",
          "Count one operation per halving level (`j - b`), not one per split power.",
        ],
      }),
      examples: [
        { input: "[16,1]\n6", expectedOutput: "3" },
        { input: "[4,1,1]\n3", expectedOutput: "1" },
        { input: "[8]\n9", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const small = rng() < 0.5;
        if (small) {
          const n = ri(rng, 1, 5);
          const nums = Array.from({ length: n }, () => 2 ** ri(rng, 0, 4));
          const target = ri(rng, 1, 31);
          return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(bfs(nums, target)) };
        }
        const n = ri(rng, 1, 30);
        const top = pick(rng, [5, 15, 30]);
        const nums = Array.from({ length: n }, () => 2 ** ri(rng, 0, top));
        const sum = nums.reduce((a, b) => a + b, 0);
        const target = pick(rng, [
          ri(rng, 1, 2147483647),
          Math.max(1, Math.min(2147483647, ri(rng, 1, Math.max(1, Math.min(sum, 2147483647))))),
          Math.min(2147483647, sum),
          Math.min(2147483647, sum + 1),
        ]);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(greedy(nums, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minOperations(nums: List[int], target: int) -> int:
              if sum(nums) < target:
                  return -1
              cnt = [0] * 64
              for v in nums:
                  cnt[v.bit_length() - 1] += 1
              ops = 0
              for b in range(31):
                  if target >> b & 1:
                      if cnt[b] > 0:
                          cnt[b] -= 1
                      else:
                          j = b
                          while cnt[j] == 0:
                              j += 1
                          ops += j - b
                          cnt[j] -= 1
                          for t in range(b, j):
                              cnt[t] += 1
                  cnt[b + 1] += cnt[b] // 2
              return ops
        `,
        javascript: code`
          var minOperations = function(nums, target) {
              var cnt = new Array(64).fill(0);
              var sum = 0;
              for (var i = 0; i < nums.length; i++) {
                  sum += nums[i];
                  cnt[31 - Math.clz32(nums[i])]++;
              }
              if (sum < target) return -1;
              var ops = 0;
              for (var b = 0; b < 31; b++) {
                  if ((target >> b) & 1) {
                      if (cnt[b] > 0) cnt[b]--;
                      else {
                          var j = b;
                          while (cnt[j] === 0) j++;
                          ops += j - b;
                          cnt[j]--;
                          for (var t = b; t < j; t++) cnt[t]++;
                      }
                  }
                  cnt[b + 1] += Math.floor(cnt[b] / 2);
              }
              return ops;
          };
        `,
        typescript: code`
          function minOperations(nums: number[], target: number): number {
              var cnt: number[] = [];
              for (var z = 0; z < 64; z++) cnt.push(0);
              var sum = 0;
              for (var i = 0; i < nums.length; i++) {
                  sum += nums[i];
                  var b0 = 0;
                  while ((1 << (b0 + 1)) <= nums[i] && b0 < 30) b0++;
                  cnt[b0]++;
              }
              if (sum < target) return -1;
              var ops = 0;
              for (var b = 0; b < 31; b++) {
                  if ((target >> b) & 1) {
                      if (cnt[b] > 0) cnt[b]--;
                      else {
                          var j = b;
                          while (cnt[j] === 0) j++;
                          ops += j - b;
                          cnt[j]--;
                          for (var t = b; t < j; t++) cnt[t]++;
                      }
                  }
                  cnt[b + 1] += Math.floor(cnt[b] / 2);
              }
              return ops;
          }
        `,
        java: code`
          public static int minOperations(int[] nums, int target) {
              long sum = 0;
              long[] cnt = new long[64];
              for (int v : nums) {
                  sum += v;
                  cnt[31 - Integer.numberOfLeadingZeros(v)]++;
              }
              if (sum < target) return -1;
              int ops = 0;
              for (int b = 0; b < 31; b++) {
                  if (((target >> b) & 1) == 1) {
                      if (cnt[b] > 0) cnt[b]--;
                      else {
                          int j = b;
                          while (cnt[j] == 0) j++;
                          ops += j - b;
                          cnt[j]--;
                          for (int t = b; t < j; t++) cnt[t]++;
                      }
                  }
                  cnt[b + 1] += cnt[b] / 2;
              }
              return ops;
          }
        `,
        cpp: code`
          int minOperations(vector<int>& nums, int target) {
              long long sum = 0;
              vector<long long> cnt(64, 0);
              for (int v : nums) {
                  sum += v;
                  cnt[31 - __builtin_clz((unsigned)v)]++;
              }
              if (sum < target) return -1;
              int ops = 0;
              for (int b = 0; b < 31; b++) {
                  if ((target >> b) & 1) {
                      if (cnt[b] > 0) cnt[b]--;
                      else {
                          int j = b;
                          while (cnt[j] == 0) j++;
                          ops += j - b;
                          cnt[j]--;
                          for (int t = b; t < j; t++) cnt[t]++;
                      }
                  }
                  cnt[b + 1] += cnt[b] / 2;
              }
              return ops;
          }
        `,
        c: code`
          int minOperations(int* nums, int numsSize, int target) {
              long long sum = 0;
              long long cnt[64];
              for (int i = 0; i < 64; i++) cnt[i] = 0;
              for (int i = 0; i < numsSize; i++) {
                  sum += nums[i];
                  int b = 0;
                  while (b < 30 && (1 << (b + 1)) <= nums[i]) b++;
                  cnt[b]++;
              }
              if (sum < target) return -1;
              int ops = 0;
              for (int b = 0; b < 31; b++) {
                  if ((target >> b) & 1) {
                      if (cnt[b] > 0) cnt[b]--;
                      else {
                          int j = b;
                          while (cnt[j] == 0) j++;
                          ops += j - b;
                          cnt[j]--;
                          for (int t = b; t < j; t++) cnt[t]++;
                      }
                  }
                  cnt[b + 1] += cnt[b] / 2;
              }
              return ops;
          }
        `,
        csharp: code`
          public static int MinOperations(int[] nums, int target)
          {
              long sum = 0;
              long[] cnt = new long[64];
              foreach (int v in nums)
              {
                  sum += v;
                  int b = 0;
                  while (b < 30 && (1 << (b + 1)) <= v) b++;
                  cnt[b]++;
              }
              if (sum < target) return -1;
              int ops = 0;
              for (int b = 0; b < 31; b++)
              {
                  if (((target >> b) & 1) == 1)
                  {
                      if (cnt[b] > 0) cnt[b]--;
                      else
                      {
                          int j = b;
                          while (cnt[j] == 0) j++;
                          ops += j - b;
                          cnt[j]--;
                          for (int t = b; t < j; t++) cnt[t]++;
                      }
                  }
                  cnt[b + 1] += cnt[b] / 2;
              }
              return ops;
          }
        `,
        go: code`
          func minOperations(nums []int, target int) int {
          	sum := 0
          	cnt := make([]int, 64)
          	for _, v := range nums {
          		sum += v
          		b := 0
          		for b < 30 && (1<<uint(b+1)) <= v {
          			b++
          		}
          		cnt[b]++
          	}
          	if sum < target {
          		return -1
          	}
          	ops := 0
          	for b := 0; b < 31; b++ {
          		if (target>>uint(b))&1 == 1 {
          			if cnt[b] > 0 {
          				cnt[b]--
          			} else {
          				j := b
          				for cnt[j] == 0 {
          					j++
          				}
          				ops += j - b
          				cnt[j]--
          				for t := b; t < j; t++ {
          					cnt[t]++
          				}
          			}
          		}
          		cnt[b+1] += cnt[b] / 2
          	}
          	return ops
          }
        `,
        kotlin: code`
          fun minOperations(nums: IntArray, target: Int): Int {
              var sum = 0L
              val cnt = LongArray(64)
              for (v in nums) {
                  sum += v
                  cnt[31 - Integer.numberOfLeadingZeros(v)]++
              }
              if (sum < target) return -1
              var ops = 0
              for (b in 0 until 31) {
                  if ((target shr b) and 1 == 1) {
                      if (cnt[b] > 0) {
                          cnt[b]--
                      } else {
                          var j = b
                          while (cnt[j] == 0L) j++
                          ops += j - b
                          cnt[j]--
                          for (t in b until j) cnt[t]++
                      }
                  }
                  cnt[b + 1] += cnt[b] / 2
              }
              return ops
          }
        `,
        swift: code`
          func minOperations(_ nums: [Int], _ target: Int) -> Int {
              var sum = 0
              var cnt = [Int](repeating: 0, count: 64)
              for v in nums {
                  sum += v
                  var b = 0
                  while b < 30 && (1 << (b + 1)) <= v { b += 1 }
                  cnt[b] += 1
              }
              if sum < target { return -1 }
              var ops = 0
              for b in 0..<31 {
                  if (target >> b) & 1 == 1 {
                      if cnt[b] > 0 {
                          cnt[b] -= 1
                      } else {
                          var j = b
                          while cnt[j] == 0 { j += 1 }
                          ops += j - b
                          cnt[j] -= 1
                          for t in b..<j { cnt[t] += 1 }
                      }
                  }
                  cnt[b + 1] += cnt[b] / 2
              }
              return ops
          }
        `,
        rust: code`
          fn minOperations(nums: Vec<i32>, target: i32) -> i32 {
              let mut sum: i64 = 0;
              let mut cnt = vec![0i64; 64];
              for &v in nums.iter() {
                  sum += v as i64;
                  cnt[31 - v.leading_zeros() as usize] += 1;
              }
              if sum < target as i64 {
                  return -1;
              }
              let mut ops = 0;
              for b in 0..31usize {
                  if (target >> b) & 1 == 1 {
                      if cnt[b] > 0 {
                          cnt[b] -= 1;
                      } else {
                          let mut j = b;
                          while cnt[j] == 0 {
                              j += 1;
                          }
                          ops += (j - b) as i32;
                          cnt[j] -= 1;
                          for t in b..j {
                              cnt[t] += 1;
                          }
                      }
                  }
                  let carry = cnt[b] / 2;
                  cnt[b + 1] += carry;
              }
              ops
          }
        `,
        php: code`
          function minOperations($nums, $target) {
              $sum = array_sum($nums);
              if ($sum < $target) return -1;
              $cnt = array_fill(0, 64, 0);
              foreach ($nums as $v) {
                  $b = 0;
                  while ($b < 30 && (1 << ($b + 1)) <= $v) $b++;
                  $cnt[$b]++;
              }
              $ops = 0;
              for ($b = 0; $b < 31; $b++) {
                  if (($target >> $b) & 1) {
                      if ($cnt[$b] > 0) $cnt[$b]--;
                      else {
                          $j = $b;
                          while ($cnt[$j] == 0) $j++;
                          $ops += $j - $b;
                          $cnt[$j]--;
                          for ($t = $b; $t < $j; $t++) $cnt[$t]++;
                      }
                  }
                  $cnt[$b + 1] += intdiv($cnt[$b], 2);
              }
              return $ops;
          }
        `,
        ruby: code`
          def minOperations(nums, target)
            return -1 if nums.sum < target
            cnt = Array.new(64, 0)
            nums.each { |v| cnt[v.bit_length - 1] += 1 }
            ops = 0
            31.times do |b|
              if (target >> b) & 1 == 1
                if cnt[b] > 0
                  cnt[b] -= 1
                else
                  j = b
                  j += 1 while cnt[j] == 0
                  ops += j - b
                  cnt[j] -= 1
                  (b...j).each { |t| cnt[t] += 1 }
                end
              end
              cnt[b + 1] += cnt[b] / 2
            end
            ops
          end
        `,
      },
    };
  })(),

  // ── Minimize Maximum Pair Sum in Array (LC 1877) ─────────────────
  (() => {
    // Small arrays: try every perfect pairing.
    const brute = (nums: number[]) => {
      const go = (rest: number[]): number => {
        if (rest.length === 0) return 0;
        let best = Infinity;
        for (let j = 1; j < rest.length; j++) {
          const others = rest.filter((_, k) => k !== 0 && k !== j);
          best = Math.min(best, Math.max(rest[0] + rest[j], go(others)));
        }
        return best;
      };
      return go(nums);
    };
    const viaSort = (nums: number[]) => {
      const a = nums.slice().sort((x, y) => x - y);
      let best = 0;
      for (let i = 0; i < a.length / 2; i++) best = Math.max(best, a[i] + a[a.length - 1 - i]);
      return best;
    };
    return {
      slug: "minimize-maximum-pair-sum-in-array",
      title: "Minimize Maximum Pair Sum in Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Greedy", "Sorting", "Amazon", "Google"],
      signature: { funcName: "minPairSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of **even** length `n`. Split its elements into `n / 2` pairs so that every element is in exactly one pair. The **pair sum** of `(a, b)` is `a + b`.\n\nReturn the smallest possible value of the **largest** pair sum.",
        [
          { in: "nums = [1,9,4,6]", out: "10", note: "Pairs `(1,9)` and `(4,6)` both sum to 10." },
          { in: "nums = [2,8,3,5,1,9]", out: "10", note: "Pairs `(1,9)`, `(2,8)` and `(3,5)`." },
          { in: "nums = [7,7]", out: "14" },
        ],
        ["n == nums.length", "2 <= n <= 10^5", "n is even", "1 <= nums[i] <= 10^5"]),
      hints: [
        "The largest element has to be paired with something. Which partner keeps its pair sum smallest?",
        "Pair the largest with the smallest, then the second largest with the second smallest, and so on.",
        "Sort the array and take the maximum of `nums[i] + nums[n - 1 - i]`.",
      ],
      editorial: explain({
        idea: "Sort the array and pair the smallest with the largest, the second smallest with the second largest, and so on. The answer is the largest of these sums.",
        steps: [
          "Sort `nums` ascending.",
          "For `i` from 0 to `n/2 - 1`, compute `nums[i] + nums[n - 1 - i]`.",
          "Return the maximum of these sums.",
        ],
        why: "Exchange argument: if the largest element `M` is paired with `x` while the smallest `m` is paired with `y`, swapping partners to `(M, m)` and `(x, y)` gives sums `M + m <= M + x` and `x + y <= M + x`, so the maximum does not grow. Repeating on the remaining elements yields the sorted pairing.",
        time: "O(n log n)",
        space: "O(1) beyond the sort",
        pitfalls: [
          "Pairing neighbours after sorting (`nums[0]` with `nums[1]`, …) maximises the largest sum instead of minimising it.",
          "Only half the indices need to be visited — each pair is counted once.",
          "Pair sums reach at most `2 · 10^5`, so there is no overflow.",
        ],
      }),
      examples: [
        { input: "[1,9,4,6]", expectedOutput: "10" },
        { input: "[2,8,3,5,1,9]", expectedOutput: "10" },
        { input: "[7,7]", expectedOutput: "14" },
      ],
      gen: (rng: Rng) => {
        const half = pick(rng, [1, 2, 3, 4, ri(rng, 5, 30)]);
        const hi = pick(rng, [5, 100, 100000]);
        const nums = Array.from({ length: 2 * half }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(half <= 4 ? brute(nums) : viaSort(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minPairSum(nums: List[int]) -> int:
              a = sorted(nums)
              n = len(a)
              return max(a[i] + a[n - 1 - i] for i in range(n // 2))
        `,
        javascript: code`
          var minPairSum = function(nums) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var n = a.length, best = 0;
              for (var i = 0; i < n / 2; i++) best = Math.max(best, a[i] + a[n - 1 - i]);
              return best;
          };
        `,
        typescript: code`
          function minPairSum(nums: number[]): number {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var n = a.length, best = 0;
              for (var i = 0; i < n / 2; i++) best = Math.max(best, a[i] + a[n - 1 - i]);
              return best;
          }
        `,
        java: code`
          public static int minPairSum(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int n = a.length, best = 0;
              for (int i = 0; i < n / 2; i++) best = Math.max(best, a[i] + a[n - 1 - i]);
              return best;
          }
        `,
        cpp: code`
          int minPairSum(vector<int>& nums) {
              vector<int> a(nums);
              sort(a.begin(), a.end());
              int n = a.size(), best = 0;
              for (int i = 0; i < n / 2; i++) best = max(best, a[i] + a[n - 1 - i]);
              return best;
          }
        `,
        c: code`
          static int cmpIntPair(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int minPairSum(int* nums, int numsSize) {
              int* a = (int*)malloc(sizeof(int) * numsSize);
              for (int i = 0; i < numsSize; i++) a[i] = nums[i];
              qsort(a, numsSize, sizeof(int), cmpIntPair);
              int best = 0;
              for (int i = 0; i < numsSize / 2; i++) {
                  int s = a[i] + a[numsSize - 1 - i];
                  if (s > best) best = s;
              }
              free(a);
              return best;
          }
        `,
        csharp: code`
          public static int MinPairSum(int[] nums)
          {
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              int n = a.Length, best = 0;
              for (int i = 0; i < n / 2; i++) best = Math.Max(best, a[i] + a[n - 1 - i]);
              return best;
          }
        `,
        go: code`
          func minPairSum(nums []int) int {
          	a := make([]int, len(nums))
          	copy(a, nums)
          	sort.Ints(a)
          	n, best := len(a), 0
          	for i := 0; i < n/2; i++ {
          		if s := a[i] + a[n-1-i]; s > best {
          			best = s
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minPairSum(nums: IntArray): Int {
              val a = nums.sortedArray()
              val n = a.size
              var best = 0
              for (i in 0 until n / 2) best = maxOf(best, a[i] + a[n - 1 - i])
              return best
          }
        `,
        swift: code`
          func minPairSum(_ nums: [Int]) -> Int {
              let a = nums.sorted()
              let n = a.count
              var best = 0
              for i in 0..<(n / 2) { best = max(best, a[i] + a[n - 1 - i]) }
              return best
          }
        `,
        rust: code`
          fn minPairSum(nums: Vec<i32>) -> i32 {
              let mut a = nums.clone();
              a.sort();
              let n = a.len();
              let mut best = 0;
              for i in 0..n / 2 {
                  best = std::cmp::max(best, a[i] + a[n - 1 - i]);
              }
              best
          }
        `,
        php: code`
          function minPairSum($nums) {
              $a = $nums;
              sort($a);
              $n = count($a);
              $best = 0;
              for ($i = 0; $i < intdiv($n, 2); $i++) $best = max($best, $a[$i] + $a[$n - 1 - $i]);
              return $best;
          }
        `,
        ruby: code`
          def minPairSum(nums)
            a = nums.sort
            n = a.length
            (0...n / 2).map { |i| a[i] + a[n - 1 - i] }.max
          end
        `,
      },
    };
  })(),

  // ── Maximum Score Of Spliced Array (LC 2321) ─────────────────────
  (() => {
    // Brute force over every splice [l, r] (plus no splice) with prefix sums.
    const ref = (a: number[], b: number[]) => {
      const n = a.length;
      const pa = [0], pb = [0];
      for (let i = 0; i < n; i++) { pa.push(pa[i] + a[i]); pb.push(pb[i] + b[i]); }
      let best = Math.max(pa[n], pb[n]);
      for (let l = 0; l < n; l++) {
        for (let r = l; r < n; r++) {
          const da = pa[r + 1] - pa[l], db = pb[r + 1] - pb[l];
          best = Math.max(best, pa[n] - da + db, pb[n] - db + da);
        }
      }
      return best;
    };
    return {
      slug: "maximum-score-of-spliced-array",
      title: "Maximum Score Of Spliced Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "maximumsSplicedArray",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two arrays `nums1` and `nums2` of the same length `n`. You may choose indices `left <= right` and **swap** the subarrays `nums1[left..right]` and `nums2[left..right]`, or choose not to swap anything at all (at most one swap).\n\nThe **score** is `max(sum(nums1), sum(nums2))` after the optional swap. Return the maximum possible score.",
        [
          { in: "nums1 = [1,9,1], nums2 = [8,2,8]", out: "25", note: "Swap index 1 only: `nums2` becomes `[8,9,8]` with sum 25." },
          { in: "nums1 = [5,5,5], nums2 = [1,1,1]", out: "15", note: "No swap is best." },
          { in: "nums1 = [3,8,2,6], nums2 = [7,1,9,4]", out: "28" },
        ],
        ["n == nums1.length == nums2.length", "1 <= n <= 10^5", "1 <= nums1[i], nums2[i] <= 10^4"]),
      hints: [
        "Try to maximise each array's sum separately; the score is the larger of the two results.",
        "Swapping `[l..r]` changes `sum(nums1)` by `sum(nums2[l..r]) - sum(nums1[l..r])`.",
        "So the best gain for `nums1` is the maximum subarray sum of `nums2[i] - nums1[i]` (or 0) — Kadane's algorithm. Do the same with the roles reversed.",
      ],
      editorial: explain({
        idea: "The gain from splicing `[l..r]` into `nums1` is the sum of `nums2[i] - nums1[i]` over that range, so the best splice for `nums1` is a maximum-subarray problem. Solve it for both directions with Kadane's algorithm.",
        steps: [
          "Compute `s1 = sum(nums1)` and `s2 = sum(nums2)`.",
          "Run Kadane on `d[i] = nums2[i] - nums1[i]`, allowing the empty range (gain 0): `cur = max(0, cur + d[i])`, `g1 = max(g1, cur)`.",
          "Run it again on `nums1[i] - nums2[i]` to get `g2`.",
          "Return `max(s1 + g1, s2 + g2)`.",
        ],
        why: "After swapping `[l..r]`, `nums1`'s sum is `s1 + sum(d[l..r])` and `nums2`'s is `s2 - sum(d[l..r])`. Maximising the larger of the two is the same as maximising each one on its own and taking the better, and each is a maximum subarray sum over a fixed array — exactly what Kadane computes in one pass.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Score the array that gains, not the one that loses — run Kadane in both directions.",
          "Allow a gain of 0 (no swap) so an all-negative difference array does not lower the answer.",
          "Sums reach `10^9`; that fits in 32 bits, but 64-bit accumulation is the safe habit.",
        ],
      }),
      examples: [
        { input: "[1,9,1]\n[8,2,8]", expectedOutput: "25" },
        { input: "[5,5,5]\n[1,1,1]", expectedOutput: "15" },
        { input: "[3,8,2,6]\n[7,1,9,4]", expectedOutput: "28" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 3, 10), ri(rng, 10, 40)]);
        const hi = pick(rng, [5, 100, 10000]);
        const a = Array.from({ length: n }, () => ri(rng, 1, hi));
        const b = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumsSplicedArray(nums1: List[int], nums2: List[int]) -> int:
              def gain(a, b):
                  best = cur = 0
                  for x, y in zip(a, b):
                      cur = max(0, cur + y - x)
                      best = max(best, cur)
                  return best
              return max(sum(nums1) + gain(nums1, nums2), sum(nums2) + gain(nums2, nums1))
        `,
        javascript: code`
          var maximumsSplicedArray = function(nums1, nums2) {
              var gain = function(a, b) {
                  var best = 0, cur = 0;
                  for (var i = 0; i < a.length; i++) {
                      cur = Math.max(0, cur + b[i] - a[i]);
                      if (cur > best) best = cur;
                  }
                  return best;
              };
              var s1 = 0, s2 = 0;
              for (var i = 0; i < nums1.length; i++) { s1 += nums1[i]; s2 += nums2[i]; }
              return Math.max(s1 + gain(nums1, nums2), s2 + gain(nums2, nums1));
          };
        `,
        typescript: code`
          function maximumsSplicedArray(nums1: number[], nums2: number[]): number {
              var gain = function(a: number[], b: number[]): number {
                  var best = 0, cur = 0;
                  for (var i = 0; i < a.length; i++) {
                      cur = Math.max(0, cur + b[i] - a[i]);
                      if (cur > best) best = cur;
                  }
                  return best;
              };
              var s1 = 0, s2 = 0;
              for (var j = 0; j < nums1.length; j++) { s1 += nums1[j]; s2 += nums2[j]; }
              return Math.max(s1 + gain(nums1, nums2), s2 + gain(nums2, nums1));
          }
        `,
        java: code`
          private static long gainSA(int[] a, int[] b) {
              long best = 0, cur = 0;
              for (int i = 0; i < a.length; i++) {
                  cur = Math.max(0, cur + b[i] - a[i]);
                  best = Math.max(best, cur);
              }
              return best;
          }

          public static int maximumsSplicedArray(int[] nums1, int[] nums2) {
              long s1 = 0, s2 = 0;
              for (int i = 0; i < nums1.length; i++) { s1 += nums1[i]; s2 += nums2[i]; }
              return (int) Math.max(s1 + gainSA(nums1, nums2), s2 + gainSA(nums2, nums1));
          }
        `,
        cpp: code`
          static long long gainSA(const vector<int>& a, const vector<int>& b) {
              long long best = 0, cur = 0;
              for (size_t i = 0; i < a.size(); i++) {
                  cur = max(0LL, cur + b[i] - a[i]);
                  best = max(best, cur);
              }
              return best;
          }

          int maximumsSplicedArray(vector<int>& nums1, vector<int>& nums2) {
              long long s1 = 0, s2 = 0;
              for (size_t i = 0; i < nums1.size(); i++) { s1 += nums1[i]; s2 += nums2[i]; }
              return (int)max(s1 + gainSA(nums1, nums2), s2 + gainSA(nums2, nums1));
          }
        `,
        c: code`
          static long long gainSA(int* a, int* b, int n) {
              long long best = 0, cur = 0;
              for (int i = 0; i < n; i++) {
                  cur = cur + b[i] - a[i];
                  if (cur < 0) cur = 0;
                  if (cur > best) best = cur;
              }
              return best;
          }

          int maximumsSplicedArray(int* nums1, int nums1Size, int* nums2, int nums2Size) {
              long long s1 = 0, s2 = 0;
              for (int i = 0; i < nums1Size; i++) { s1 += nums1[i]; s2 += nums2[i]; }
              long long x = s1 + gainSA(nums1, nums2, nums1Size);
              long long y = s2 + gainSA(nums2, nums1, nums1Size);
              return (int)(x > y ? x : y);
          }
        `,
        csharp: code`
          private static long GainSA(int[] a, int[] b)
          {
              long best = 0, cur = 0;
              for (int i = 0; i < a.Length; i++)
              {
                  cur = Math.Max(0, cur + b[i] - a[i]);
                  best = Math.Max(best, cur);
              }
              return best;
          }

          public static int MaximumsSplicedArray(int[] nums1, int[] nums2)
          {
              long s1 = 0, s2 = 0;
              for (int i = 0; i < nums1.Length; i++) { s1 += nums1[i]; s2 += nums2[i]; }
              return (int)Math.Max(s1 + GainSA(nums1, nums2), s2 + GainSA(nums2, nums1));
          }
        `,
        go: code`
          func gainSA(a []int, b []int) int {
          	best, cur := 0, 0
          	for i := range a {
          		cur += b[i] - a[i]
          		if cur < 0 {
          			cur = 0
          		}
          		if cur > best {
          			best = cur
          		}
          	}
          	return best
          }

          func maximumsSplicedArray(nums1 []int, nums2 []int) int {
          	s1, s2 := 0, 0
          	for i := range nums1 {
          		s1 += nums1[i]
          		s2 += nums2[i]
          	}
          	x := s1 + gainSA(nums1, nums2)
          	y := s2 + gainSA(nums2, nums1)
          	if x > y {
          		return x
          	}
          	return y
          }
        `,
        kotlin: code`
          fun gainSA(a: IntArray, b: IntArray): Long {
              var best = 0L
              var cur = 0L
              for (i in a.indices) {
                  cur = maxOf(0L, cur + b[i] - a[i])
                  best = maxOf(best, cur)
              }
              return best
          }

          fun maximumsSplicedArray(nums1: IntArray, nums2: IntArray): Int {
              var s1 = 0L
              var s2 = 0L
              for (i in nums1.indices) {
                  s1 += nums1[i]
                  s2 += nums2[i]
              }
              return maxOf(s1 + gainSA(nums1, nums2), s2 + gainSA(nums2, nums1)).toInt()
          }
        `,
        swift: code`
          func gainSA(_ a: [Int], _ b: [Int]) -> Int {
              var best = 0
              var cur = 0
              for i in 0..<a.count {
                  cur = max(0, cur + b[i] - a[i])
                  best = max(best, cur)
              }
              return best
          }

          func maximumsSplicedArray(_ nums1: [Int], _ nums2: [Int]) -> Int {
              let s1 = nums1.reduce(0, +)
              let s2 = nums2.reduce(0, +)
              return max(s1 + gainSA(nums1, nums2), s2 + gainSA(nums2, nums1))
          }
        `,
        rust: code`
          fn gain_sa(a: &Vec<i32>, b: &Vec<i32>) -> i64 {
              let mut best: i64 = 0;
              let mut cur: i64 = 0;
              for i in 0..a.len() {
                  cur = std::cmp::max(0, cur + b[i] as i64 - a[i] as i64);
                  best = std::cmp::max(best, cur);
              }
              best
          }

          fn maximumsSplicedArray(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {
              let s1: i64 = nums1.iter().map(|&v| v as i64).sum();
              let s2: i64 = nums2.iter().map(|&v| v as i64).sum();
              std::cmp::max(s1 + gain_sa(&nums1, &nums2), s2 + gain_sa(&nums2, &nums1)) as i32
          }
        `,
        php: code`
          function gainSA($a, $b) {
              $best = 0;
              $cur = 0;
              $n = count($a);
              for ($i = 0; $i < $n; $i++) {
                  $cur = max(0, $cur + $b[$i] - $a[$i]);
                  $best = max($best, $cur);
              }
              return $best;
          }

          function maximumsSplicedArray($nums1, $nums2) {
              return max(array_sum($nums1) + gainSA($nums1, $nums2), array_sum($nums2) + gainSA($nums2, $nums1));
          }
        `,
        ruby: code`
          def maximumsSplicedArray(nums1, nums2)
            gain = lambda do |a, b|
              best = 0
              cur = 0
              a.each_index do |i|
                cur = [0, cur + b[i] - a[i]].max
                best = cur if cur > best
              end
              best
            end
            [nums1.sum + gain.call(nums1, nums2), nums2.sum + gain.call(nums2, nums1)].max
          end
        `,
      },
    };
  })(),

];
