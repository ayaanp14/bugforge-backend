/**
 * Dynamic programming, counting & grid problems — wave 7, batch 04.
 * Real problems only: LeetCode numbered problems from the 3200–3500s. Worked
 * examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Every answer fits a signed 32-bit integer: the counting problems keep the
 * original's `mod 1e9 + 7`, and Best Time to Buy and Sell Stock V caps prices
 * at 10^6 (the original allows 10^9) so its profit stays below 2^31. Products
 * of two residues are taken in 64-bit integers in the typed languages; in
 * JavaScript every such product here is a value below 2^17 times a residue,
 * which stays exact in a double (below 2^53).
 *
 * Generated sizes are far below the stated constraints: the judge runs a whole
 * suite of hidden cases in one process, so the `ref` implementations are brute
 * force (or the plainest DP) over small inputs and the solutions are the
 * intended algorithms.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const DP11_PROBLEMS: CatalogProblem[] = [

  // ── Find the Count of Monotonic Pairs I (LC 3250) ─────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (nums: number[]) => {
      // dp over arr1's value at each index, with every transition checked.
      let dp: number[] = [];
      for (let v = 0; v <= nums[0]; v++) dp.push(1);
      for (let i = 1; i < nums.length; i++) {
        const nd: number[] = [];
        for (let v = 0; v <= nums[i]; v++) {
          let s = 0;
          for (let u = 0; u <= nums[i - 1]; u++) {
            if (u <= v && nums[i - 1] - u >= nums[i] - v) s = (s + dp[u]) % MOD;
          }
          nd.push(s);
        }
        dp = nd;
      }
      return dp.reduce((s, v) => (s + v) % MOD, 0);
    };
    return {
      slug: "find-the-count-of-monotonic-pairs-i",
      title: "Find the Count of Monotonic Pairs I",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Combinatorics", "Prefix Sum", "Google"],
      signature: { funcName: "countOfPairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of `n` positive integers.\n\nA pair of non-negative integer arrays `(arr1, arr2)`, each of length `n`, is called **monotonic** when:\n\n- `arr1` is non-decreasing: `arr1[0] <= arr1[1] <= ... <= arr1[n - 1]`,\n- `arr2` is non-increasing: `arr2[0] >= arr2[1] >= ... >= arr2[n - 1]`, and\n- `arr1[i] + arr2[i] == nums[i]` for every index `i`.\n\nReturn the number of monotonic pairs. Since the count can be large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [2,3,2]", out: "4", note: "The pairs are ([0,1,1],[2,2,1]), ([0,1,2],[2,2,0]), ([0,2,2],[2,1,0]) and ([1,2,2],[1,1,0])." },
          { in: "nums = [5,5,5,5]", out: "126" },
          { in: "nums = [1]", out: "2", note: "Either arr1 = [0] and arr2 = [1], or arr1 = [1] and arr2 = [0]." },
        ],
        ["1 <= n == nums.length <= 2000", "1 <= nums[i] <= 50"]),
      hints: [
        "Once `arr1` is fixed, `arr2` is forced (`arr2[i] = nums[i] - arr1[i]`), so count the valid choices of `arr1` alone.",
        "Let `dp[i][v]` be the number of valid prefixes ending with `arr1[i] = v`. Write down which previous values `u = arr1[i - 1]` are allowed: `u <= v` and `nums[i - 1] - u >= nums[i] - v`.",
        "Both conditions say `u <= v - max(0, nums[i] - nums[i - 1])` (and `u <= nums[i - 1]`), so `dp[i][v]` is a prefix sum of `dp[i - 1]`.",
      ],
      editorial: explain({
        idea: "Choosing `arr1` decides `arr2`, so the task is to count non-decreasing arrays `arr1` with `0 <= arr1[i] <= nums[i]` whose complement `nums[i] - arr1[i]` is non-increasing. A DP over the value of `arr1[i]` counts them, and the allowed previous values always form a prefix, so each state is one prefix-sum lookup.",
        steps: [
          "Start with `dp[v] = 1` for every `v` in `0..nums[0]`.",
          "For each next index `i`, let `d = max(0, nums[i] - nums[i - 1])` and build prefix sums `pre` of the current `dp`.",
          "For each `v` in `0..nums[i]`, the previous value `u` may be anything up to `min(v - d, nums[i - 1])`; set `ndp[v] = pre[that bound]`, or 0 when `v - d < 0`.",
          "After the last index, the answer is the sum of `dp` modulo `10^9 + 7`.",
        ],
        why: "`arr1` non-decreasing means `u <= v`. `arr2` non-increasing means `nums[i - 1] - u >= nums[i] - v`, i.e. `u <= v - (nums[i] - nums[i - 1])`. When `nums[i] <= nums[i - 1]` the second bound is weaker than the first, so the binding bound is `v - max(0, nums[i] - nums[i - 1])` — always a prefix of the previous states, which is what makes the prefix sum exact.",
        time: "O(n · M)",
        space: "O(M)",
        pitfalls: [
          "`arr1` and `arr2` are non-negative, so `v` only ranges over `0..nums[i]`; the bound `u <= nums[i - 1]` matters when `v - d` exceeds the previous range.",
          "Reduce the prefix sums modulo `10^9 + 7` as you go — adding up to 51 counts near the modulus overflows a 32-bit integer.",
        ],
      }),
      examples: [
        { input: "[2,3,2]", expectedOutput: "4" },
        { input: "[5,5,5,5]", expectedOutput: "126" },
        { input: "[1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 10, 30, 40]));
        const top = pick(rng, [1, 3, 10, 50, 50]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countOfPairs(nums: List[int]) -> int:
              MOD = 10**9 + 7
              dp = [1] * (nums[0] + 1)
              for i in range(1, len(nums)):
                  d = max(0, nums[i] - nums[i - 1])
                  pre = []
                  s = 0
                  for x in dp:
                      s = (s + x) % MOD
                      pre.append(s)
                  ndp = [0] * (nums[i] + 1)
                  for v in range(nums[i] + 1):
                      top = min(v - d, nums[i - 1])
                      if top >= 0:
                          ndp[v] = pre[top]
                  dp = ndp
              return sum(dp) % MOD
        `,
        javascript: code`
          var countOfPairs = function(nums) {
              var MOD = 1000000007;
              var dp = [];
              for (var v = 0; v <= nums[0]; v++) dp.push(1);
              for (var i = 1; i < nums.length; i++) {
                  var d = Math.max(0, nums[i] - nums[i - 1]);
                  var pre = [], s = 0;
                  for (var u = 0; u < dp.length; u++) { s = (s + dp[u]) % MOD; pre.push(s); }
                  var nd = [];
                  for (var w = 0; w <= nums[i]; w++) {
                      var top = Math.min(w - d, nums[i - 1]);
                      nd.push(top >= 0 ? pre[top] : 0);
                  }
                  dp = nd;
              }
              var total = 0;
              for (var t = 0; t < dp.length; t++) total = (total + dp[t]) % MOD;
              return total;
          };
        `,
        typescript: code`
          function countOfPairs(nums: number[]): number {
              var MOD = 1000000007;
              var dp: number[] = [];
              for (var v = 0; v <= nums[0]; v++) dp.push(1);
              for (var i = 1; i < nums.length; i++) {
                  var d = Math.max(0, nums[i] - nums[i - 1]);
                  var pre: number[] = [], s = 0;
                  for (var u = 0; u < dp.length; u++) { s = (s + dp[u]) % MOD; pre.push(s); }
                  var nd: number[] = [];
                  for (var w = 0; w <= nums[i]; w++) {
                      var top = Math.min(w - d, nums[i - 1]);
                      nd.push(top >= 0 ? pre[top] : 0);
                  }
                  dp = nd;
              }
              var total = 0;
              for (var t = 0; t < dp.length; t++) total = (total + dp[t]) % MOD;
              return total;
          }
        `,
        java: code`
          public static int countOfPairs(int[] nums) {
              final long MOD = 1000000007L;
              long[] dp = new long[nums[0] + 1];
              Arrays.fill(dp, 1L);
              for (int i = 1; i < nums.length; i++) {
                  int d = Math.max(0, nums[i] - nums[i - 1]);
                  long[] pre = new long[dp.length];
                  long s = 0;
                  for (int u = 0; u < dp.length; u++) { s = (s + dp[u]) % MOD; pre[u] = s; }
                  long[] nd = new long[nums[i] + 1];
                  for (int v = 0; v <= nums[i]; v++) {
                      int top = Math.min(v - d, nums[i - 1]);
                      nd[v] = top >= 0 ? pre[top] : 0;
                  }
                  dp = nd;
              }
              long total = 0;
              for (long x : dp) total = (total + x) % MOD;
              return (int) total;
          }
        `,
        cpp: code`
          int countOfPairs(vector<int>& nums) {
              const long long MOD = 1000000007LL;
              vector<long long> dp(nums[0] + 1, 1);
              for (size_t i = 1; i < nums.size(); i++) {
                  int d = max(0, nums[i] - nums[i - 1]);
                  vector<long long> pre(dp.size());
                  long long s = 0;
                  for (size_t u = 0; u < dp.size(); u++) { s = (s + dp[u]) % MOD; pre[u] = s; }
                  vector<long long> nd(nums[i] + 1, 0);
                  for (int v = 0; v <= nums[i]; v++) {
                      int top = min(v - d, nums[i - 1]);
                      if (top >= 0) nd[v] = pre[top];
                  }
                  dp = nd;
              }
              long long total = 0;
              for (long long x : dp) total = (total + x) % MOD;
              return (int) total;
          }
        `,
        c: code`
          int countOfPairs(int* nums, int numsSize) {
              const long long MOD = 1000000007LL;
              long long dp[51], pre[51], nd[51];
              int len = nums[0] + 1;
              for (int v = 0; v < len; v++) dp[v] = 1;
              for (int i = 1; i < numsSize; i++) {
                  int d = nums[i] - nums[i - 1];
                  if (d < 0) d = 0;
                  long long s = 0;
                  for (int u = 0; u < len; u++) { s = (s + dp[u]) % MOD; pre[u] = s; }
                  for (int v = 0; v <= nums[i]; v++) {
                      int top = v - d;
                      if (top > nums[i - 1]) top = nums[i - 1];
                      nd[v] = top >= 0 ? pre[top] : 0;
                  }
                  len = nums[i] + 1;
                  for (int v = 0; v < len; v++) dp[v] = nd[v];
              }
              long long total = 0;
              for (int v = 0; v < len; v++) total = (total + dp[v]) % MOD;
              return (int) total;
          }
        `,
        csharp: code`
          public static int CountOfPairs(int[] nums)
          {
              const long MOD = 1000000007L;
              long[] dp = new long[nums[0] + 1];
              for (int v = 0; v < dp.Length; v++) dp[v] = 1;
              for (int i = 1; i < nums.Length; i++)
              {
                  int d = Math.Max(0, nums[i] - nums[i - 1]);
                  long[] pre = new long[dp.Length];
                  long s = 0;
                  for (int u = 0; u < dp.Length; u++) { s = (s + dp[u]) % MOD; pre[u] = s; }
                  long[] nd = new long[nums[i] + 1];
                  for (int v = 0; v <= nums[i]; v++)
                  {
                      int top = Math.Min(v - d, nums[i - 1]);
                      nd[v] = top >= 0 ? pre[top] : 0;
                  }
                  dp = nd;
              }
              long total = 0;
              foreach (long x in dp) total = (total + x) % MOD;
              return (int) total;
          }
        `,
        go: code`
          func countOfPairs(nums []int) int {
              const mod = 1000000007
              dp := make([]int, nums[0]+1)
              for v := range dp {
                  dp[v] = 1
              }
              for i := 1; i < len(nums); i++ {
                  d := nums[i] - nums[i-1]
                  if d < 0 {
                      d = 0
                  }
                  pre := make([]int, len(dp))
                  s := 0
                  for u, x := range dp {
                      s = (s + x) % mod
                      pre[u] = s
                  }
                  nd := make([]int, nums[i]+1)
                  for v := 0; v <= nums[i]; v++ {
                      top := v - d
                      if top > nums[i-1] {
                          top = nums[i-1]
                      }
                      if top >= 0 {
                          nd[v] = pre[top]
                      }
                  }
                  dp = nd
              }
              total := 0
              for _, x := range dp {
                  total = (total + x) % mod
              }
              return total
          }
        `,
        kotlin: code`
          fun countOfPairs(nums: IntArray): Int {
              val modulus = 1000000007L
              var dp = LongArray(nums[0] + 1) { 1L }
              for (i in 1 until nums.size) {
                  val d = maxOf(0, nums[i] - nums[i - 1])
                  val pre = LongArray(dp.size)
                  var s = 0L
                  for (u in dp.indices) { s = (s + dp[u]) % modulus; pre[u] = s }
                  val nd = LongArray(nums[i] + 1)
                  for (v in 0..nums[i]) {
                      val top = minOf(v - d, nums[i - 1])
                      if (top >= 0) nd[v] = pre[top]
                  }
                  dp = nd
              }
              var total = 0L
              for (x in dp) total = (total + x) % modulus
              return total.toInt()
          }
        `,
        swift: code`
          func countOfPairs(_ nums: [Int]) -> Int {
              let modulus = 1000000007
              var dp = [Int](repeating: 1, count: nums[0] + 1)
              var i = 1
              while i < nums.count {
                  let d = max(0, nums[i] - nums[i - 1])
                  var pre = [Int](repeating: 0, count: dp.count)
                  var s = 0
                  for u in 0..<dp.count { s = (s + dp[u]) % modulus; pre[u] = s }
                  var nd = [Int](repeating: 0, count: nums[i] + 1)
                  for v in 0...nums[i] {
                      let top = min(v - d, nums[i - 1])
                      if top >= 0 { nd[v] = pre[top] }
                  }
                  dp = nd
                  i += 1
              }
              var total = 0
              for x in dp { total = (total + x) % modulus }
              return total
          }
        `,
        rust: code`
          fn countOfPairs(nums: Vec<i32>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let mut dp: Vec<i64> = vec![1; nums[0] as usize + 1];
              for i in 1..nums.len() {
                  let d = std::cmp::max(0, nums[i] - nums[i - 1]);
                  let mut pre = vec![0i64; dp.len()];
                  let mut s = 0i64;
                  for u in 0..dp.len() {
                      s = (s + dp[u]) % modulus;
                      pre[u] = s;
                  }
                  let mut nd = vec![0i64; nums[i] as usize + 1];
                  for v in 0..=nums[i] {
                      let top = std::cmp::min(v - d, nums[i - 1]);
                      if top >= 0 {
                          nd[v as usize] = pre[top as usize];
                      }
                  }
                  dp = nd;
              }
              let mut total = 0i64;
              for x in dp {
                  total = (total + x) % modulus;
              }
              total as i32
          }
        `,
        php: code`
          function countOfPairs($nums) {
              $MOD = 1000000007;
              $dp = array_fill(0, $nums[0] + 1, 1);
              $n = count($nums);
              for ($i = 1; $i < $n; $i++) {
                  $d = max(0, $nums[$i] - $nums[$i - 1]);
                  $pre = [];
                  $s = 0;
                  foreach ($dp as $x) { $s = ($s + $x) % $MOD; $pre[] = $s; }
                  $nd = array_fill(0, $nums[$i] + 1, 0);
                  for ($v = 0; $v <= $nums[$i]; $v++) {
                      $top = min($v - $d, $nums[$i - 1]);
                      if ($top >= 0) $nd[$v] = $pre[$top];
                  }
                  $dp = $nd;
              }
              $total = 0;
              foreach ($dp as $x) $total = ($total + $x) % $MOD;
              return $total;
          }
        `,
        ruby: code`
          def countOfPairs(nums)
            mod = 1_000_000_007
            dp = Array.new(nums[0] + 1, 1)
            (1...nums.length).each do |i|
              d = [0, nums[i] - nums[i - 1]].max
              pre = []
              s = 0
              dp.each { |x| s = (s + x) % mod; pre << s }
              nd = Array.new(nums[i] + 1, 0)
              (0..nums[i]).each do |v|
                top = [v - d, nums[i - 1]].min
                nd[v] = pre[top] if top >= 0
              end
              dp = nd
            end
            dp.sum % mod
          end
        `,
      },
    };
  })(),

  // ── Select Cells in Grid With Maximum Score (LC 3276) ─────────────
  (() => {
    const ref = (grid: number[][]) => {
      // Every row picks nothing or one cell; values must be pairwise distinct.
      const used = new Set<number>();
      const go = (r: number): number => {
        if (r === grid.length) return 0;
        let best = go(r + 1);
        for (const v of grid[r]) {
          if (used.has(v)) continue;
          used.add(v);
          best = Math.max(best, v + go(r + 1));
          used.delete(v);
        }
        return best;
      };
      return go(0);
    };
    return {
      slug: "select-cells-in-grid-with-maximum-score",
      title: "Select Cells in Grid With Maximum Score",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Matrix", "Bitmask", "Google"],
      signature: { funcName: "maxScore", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a 2D matrix `grid` of positive integers.\n\nSelect **one or more** cells so that:\n\n- no two selected cells lie in the **same row**, and\n- the values of the selected cells are **pairwise distinct**.\n\nThe score is the sum of the selected values. Return the **maximum** score you can achieve.",
        [
          { in: "grid = [[1,2,3],[4,3,2],[1,1,1]]", out: "8", note: "Take 1 from the last row, 4 from the middle row and 3 from the first row: 1 + 4 + 3 = 8." },
          { in: "grid = [[8,7,6],[8,3,2]]", out: "15", note: "Take 7 from the first row and 8 from the second." },
          { in: "grid = [[7,7],[7,7]]", out: "7", note: "Every cell holds 7, so only one cell can be selected." },
        ],
        ["1 <= grid.length, grid[i].length <= 10", "1 <= grid[i][j] <= 100"]),
      hints: [
        "There are at most 10 rows, so the set of rows already used fits in a bitmask.",
        "Process the distinct values one at a time (each value is used at most once): the state is just which rows are already taken.",
        "For value `v`, either skip it or place it in one free row that contains `v`: `dp'[mask | 1 << r] = max(dp[mask] + v)`.",
      ],
      editorial: explain({
        idea: "Uniqueness is a constraint on values and the one-per-row rule is a constraint on rows. Iterating over values makes uniqueness automatic (each value is considered once), and with at most 10 rows the rows used so far fit in a bitmask.",
        steps: [
          "For every value `v`, record `rows[v]`, the bitmask of rows that contain `v`.",
          "Let `dp[mask]` be the best score using exactly the rows in `mask`; start with `dp[0] = 0` and every other mask unreachable.",
          "For each distinct value `v`, copy `dp` into `ndp`; for every reachable `mask` and every row `r` in `rows[v]` not in `mask`, relax `ndp[mask | 1 << r]` with `dp[mask] + v`. Then `dp = ndp`.",
          "Return the largest value in `dp`.",
        ],
        why: "Any valid selection assigns each chosen value to a distinct row that contains it. Walking the values in any fixed order and deciding for each whether (and in which free row) it is used enumerates exactly those assignments, and two selections with the same set of used rows are interchangeable for every later decision — so keeping only the best score per mask loses nothing.",
        time: "O(V · 2^R · R)",
        space: "O(2^R)",
        pitfalls: [
          "Update into a copy (`ndp`) — relaxing in place could place the same value twice.",
          "Greedily taking each row's maximum fails: two rows may share their best value.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[4,3,2],[1,1,1]]", expectedOutput: "8" },
        { input: "[[8,7,6],[8,3,2]]", expectedOutput: "15" },
        { input: "[[7,7],[7,7]]", expectedOutput: "7" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const R = ri(rng, 1, pick(rng, [1, 3, 5, 6]));
        const C = ri(rng, 1, pick(rng, [1, 3, 4, 5]));
        const top = pick(rng, [1, 3, 6, 20, 100]);
        const grid = Array.from({ length: R }, () => Array.from({ length: C }, () => ri(rng, 1, top)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxScore(grid: List[List[int]]) -> int:
              R = len(grid)
              rows = {}
              for r, row in enumerate(grid):
                  for v in row:
                      rows[v] = rows.get(v, 0) | (1 << r)
              full = 1 << R
              dp = [-1] * full
              dp[0] = 0
              for v, rm in rows.items():
                  nd = dp[:]
                  for mask in range(full):
                      if dp[mask] < 0:
                          continue
                      free = rm & ~mask
                      while free:
                          b = free & -free
                          free ^= b
                          if dp[mask] + v > nd[mask | b]:
                              nd[mask | b] = dp[mask] + v
                  dp = nd
              return max(dp)
        `,
        javascript: code`
          var maxScore = function(grid) {
              var R = grid.length;
              var rows = [];
              for (var v = 0; v <= 100; v++) rows.push(0);
              for (var r = 0; r < R; r++) {
                  for (var c = 0; c < grid[r].length; c++) rows[grid[r][c]] |= (1 << r);
              }
              var full = 1 << R;
              var dp = [];
              for (var m = 0; m < full; m++) dp.push(-1);
              dp[0] = 0;
              for (var val = 1; val <= 100; val++) {
                  if (rows[val] === 0) continue;
                  var nd = dp.slice();
                  for (var mask = 0; mask < full; mask++) {
                      if (dp[mask] < 0) continue;
                      var free = rows[val] & ~mask;
                      while (free) {
                          var b = free & -free;
                          free ^= b;
                          if (dp[mask] + val > nd[mask | b]) nd[mask | b] = dp[mask] + val;
                      }
                  }
                  dp = nd;
              }
              var best = 0;
              for (var k = 0; k < full; k++) if (dp[k] > best) best = dp[k];
              return best;
          };
        `,
        typescript: code`
          function maxScore(grid: number[][]): number {
              var R = grid.length;
              var rows: number[] = [];
              for (var v = 0; v <= 100; v++) rows.push(0);
              for (var r = 0; r < R; r++) {
                  for (var c = 0; c < grid[r].length; c++) rows[grid[r][c]] |= (1 << r);
              }
              var full = 1 << R;
              var dp: number[] = [];
              for (var m = 0; m < full; m++) dp.push(-1);
              dp[0] = 0;
              for (var val = 1; val <= 100; val++) {
                  if (rows[val] === 0) continue;
                  var nd = dp.slice();
                  for (var mask = 0; mask < full; mask++) {
                      if (dp[mask] < 0) continue;
                      var free = rows[val] & ~mask;
                      while (free) {
                          var b = free & -free;
                          free ^= b;
                          if (dp[mask] + val > nd[mask | b]) nd[mask | b] = dp[mask] + val;
                      }
                  }
                  dp = nd;
              }
              var best = 0;
              for (var k = 0; k < full; k++) if (dp[k] > best) best = dp[k];
              return best;
          }
        `,
        java: code`
          public static int maxScore(int[][] grid) {
              int R = grid.length;
              int[] rows = new int[101];
              for (int r = 0; r < R; r++) for (int v : grid[r]) rows[v] |= 1 << r;
              int full = 1 << R;
              int[] dp = new int[full];
              Arrays.fill(dp, -1);
              dp[0] = 0;
              for (int val = 1; val <= 100; val++) {
                  if (rows[val] == 0) continue;
                  int[] nd = dp.clone();
                  for (int mask = 0; mask < full; mask++) {
                      if (dp[mask] < 0) continue;
                      int free = rows[val] & ~mask;
                      while (free != 0) {
                          int b = free & -free;
                          free ^= b;
                          nd[mask | b] = Math.max(nd[mask | b], dp[mask] + val);
                      }
                  }
                  dp = nd;
              }
              int best = 0;
              for (int x : dp) best = Math.max(best, x);
              return best;
          }
        `,
        cpp: code`
          int maxScore(vector<vector<int>>& grid) {
              int R = grid.size();
              vector<int> rows(101, 0);
              for (int r = 0; r < R; r++) for (int v : grid[r]) rows[v] |= 1 << r;
              int full = 1 << R;
              vector<int> dp(full, -1);
              dp[0] = 0;
              for (int val = 1; val <= 100; val++) {
                  if (rows[val] == 0) continue;
                  vector<int> nd = dp;
                  for (int mask = 0; mask < full; mask++) {
                      if (dp[mask] < 0) continue;
                      int fr = rows[val] & ~mask;
                      while (fr) {
                          int b = fr & -fr;
                          fr ^= b;
                          nd[mask | b] = max(nd[mask | b], dp[mask] + val);
                      }
                  }
                  dp = nd;
              }
              return *max_element(dp.begin(), dp.end());
          }
        `,
        c: code`
          int maxScore(int** grid, int gridSize, int* gridColSize) {
              int R = gridSize;
              int rows[101];
              for (int v = 0; v <= 100; v++) rows[v] = 0;
              for (int r = 0; r < R; r++) for (int c = 0; c < gridColSize[r]; c++) rows[grid[r][c]] |= 1 << r;
              int full = 1 << R;
              int* dp = (int*) malloc(sizeof(int) * full);
              int* nd = (int*) malloc(sizeof(int) * full);
              for (int m = 0; m < full; m++) dp[m] = -1;
              dp[0] = 0;
              for (int val = 1; val <= 100; val++) {
                  if (rows[val] == 0) continue;
                  for (int m = 0; m < full; m++) nd[m] = dp[m];
                  for (int mask = 0; mask < full; mask++) {
                      if (dp[mask] < 0) continue;
                      int fr = rows[val] & ~mask;
                      while (fr) {
                          int b = fr & -fr;
                          fr ^= b;
                          if (dp[mask] + val > nd[mask | b]) nd[mask | b] = dp[mask] + val;
                      }
                  }
                  int* t = dp; dp = nd; nd = t;
              }
              int best = 0;
              for (int m = 0; m < full; m++) if (dp[m] > best) best = dp[m];
              free(dp);
              free(nd);
              return best;
          }
        `,
        csharp: code`
          public static int MaxScore(int[][] grid)
          {
              int R = grid.Length;
              int[] rows = new int[101];
              for (int r = 0; r < R; r++) foreach (int v in grid[r]) rows[v] |= 1 << r;
              int full = 1 << R;
              int[] dp = new int[full];
              for (int m = 0; m < full; m++) dp[m] = -1;
              dp[0] = 0;
              for (int val = 1; val <= 100; val++)
              {
                  if (rows[val] == 0) continue;
                  int[] nd = (int[]) dp.Clone();
                  for (int mask = 0; mask < full; mask++)
                  {
                      if (dp[mask] < 0) continue;
                      int fr = rows[val] & ~mask;
                      while (fr != 0)
                      {
                          int b = fr & -fr;
                          fr ^= b;
                          nd[mask | b] = Math.Max(nd[mask | b], dp[mask] + val);
                      }
                  }
                  dp = nd;
              }
              int best = 0;
              foreach (int x in dp) best = Math.Max(best, x);
              return best;
          }
        `,
        go: code`
          func maxScore(grid [][]int) int {
              R := len(grid)
              rows := make([]int, 101)
              for r := 0; r < R; r++ {
                  for _, v := range grid[r] {
                      rows[v] |= 1 << uint(r)
                  }
              }
              full := 1 << uint(R)
              dp := make([]int, full)
              for m := range dp {
                  dp[m] = -1
              }
              dp[0] = 0
              for val := 1; val <= 100; val++ {
                  if rows[val] == 0 {
                      continue
                  }
                  nd := make([]int, full)
                  copy(nd, dp)
                  for mask := 0; mask < full; mask++ {
                      if dp[mask] < 0 {
                          continue
                      }
                      fr := rows[val] &^ mask
                      for fr != 0 {
                          b := fr & -fr
                          fr ^= b
                          if dp[mask]+val > nd[mask|b] {
                              nd[mask|b] = dp[mask] + val
                          }
                      }
                  }
                  dp = nd
              }
              best := 0
              for _, x := range dp {
                  if x > best {
                      best = x
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxScore(grid: Array<IntArray>): Int {
              val rowCount = grid.size
              val rows = IntArray(101)
              for (r in 0 until rowCount) for (v in grid[r]) rows[v] = rows[v] or (1 shl r)
              val full = 1 shl rowCount
              var dp = IntArray(full) { -1 }
              dp[0] = 0
              for (value in 1..100) {
                  if (rows[value] == 0) continue
                  val nd = dp.copyOf()
                  for (mask in 0 until full) {
                      if (dp[mask] < 0) continue
                      var fr = rows[value] and mask.inv()
                      while (fr != 0) {
                          val b = fr and -fr
                          fr = fr xor b
                          nd[mask or b] = maxOf(nd[mask or b], dp[mask] + value)
                      }
                  }
                  dp = nd
              }
              var best = 0
              for (x in dp) best = maxOf(best, x)
              return best
          }
        `,
        swift: code`
          func maxScore(_ grid: [[Int]]) -> Int {
              let R = grid.count
              var rows = [Int](repeating: 0, count: 101)
              for r in 0..<R { for v in grid[r] { rows[v] |= 1 << r } }
              let full = 1 << R
              var dp = [Int](repeating: -1, count: full)
              dp[0] = 0
              for val in 1...100 {
                  if rows[val] == 0 { continue }
                  var nd = dp
                  for mask in 0..<full {
                      if dp[mask] < 0 { continue }
                      var fr = rows[val] & ~mask
                      while fr != 0 {
                          let b = fr & -fr
                          fr ^= b
                          nd[mask | b] = max(nd[mask | b], dp[mask] + val)
                      }
                  }
                  dp = nd
              }
              var best = 0
              for x in dp { best = max(best, x) }
              return best
          }
        `,
        rust: code`
          fn maxScore(grid: Vec<Vec<i32>>) -> i32 {
              let r_count = grid.len();
              let mut rows = vec![0usize; 101];
              for r in 0..r_count {
                  for &v in &grid[r] {
                      rows[v as usize] |= 1 << r;
                  }
              }
              let full = 1usize << r_count;
              let mut dp = vec![-1i32; full];
              dp[0] = 0;
              for val in 1..=100usize {
                  if rows[val] == 0 {
                      continue;
                  }
                  let mut nd = dp.clone();
                  for mask in 0..full {
                      if dp[mask] < 0 {
                          continue;
                      }
                      let mut fr = rows[val] & !mask;
                      while fr != 0 {
                          let b = fr & fr.wrapping_neg();
                          fr ^= b;
                          let cand = dp[mask] + val as i32;
                          if cand > nd[mask | b] {
                              nd[mask | b] = cand;
                          }
                      }
                  }
                  dp = nd;
              }
              *dp.iter().max().unwrap()
          }
        `,
        php: code`
          function maxScore($grid) {
              $R = count($grid);
              $rows = array_fill(0, 101, 0);
              for ($r = 0; $r < $R; $r++) foreach ($grid[$r] as $v) $rows[$v] |= 1 << $r;
              $full = 1 << $R;
              $dp = array_fill(0, $full, -1);
              $dp[0] = 0;
              for ($val = 1; $val <= 100; $val++) {
                  if ($rows[$val] == 0) continue;
                  $nd = $dp;
                  for ($mask = 0; $mask < $full; $mask++) {
                      if ($dp[$mask] < 0) continue;
                      $fr = $rows[$val] & ~$mask;
                      while ($fr != 0) {
                          $b = $fr & -$fr;
                          $fr ^= $b;
                          if ($dp[$mask] + $val > $nd[$mask | $b]) $nd[$mask | $b] = $dp[$mask] + $val;
                      }
                  }
                  $dp = $nd;
              }
              return max($dp);
          }
        `,
        ruby: code`
          def maxScore(grid)
            r_count = grid.length
            rows = Array.new(101, 0)
            grid.each_with_index { |row, r| row.each { |v| rows[v] |= 1 << r } }
            full = 1 << r_count
            dp = Array.new(full, -1)
            dp[0] = 0
            (1..100).each do |val|
              next if rows[val] == 0
              nd = dp.dup
              (0...full).each do |mask|
                next if dp[mask] < 0
                fr = rows[val] & ~mask
                while fr != 0
                  b = fr & -fr
                  fr ^= b
                  cand = dp[mask] + val
                  nd[mask | b] = cand if cand > nd[mask | b]
                end
              end
              dp = nd
            end
            dp.max
          end
        `,
      },
    };
  })(),

  // ── Maximum XOR Score Subarray Queries (LC 3277) ──────────────────
  (() => {
    const score = (a: number[]) => {
      let cur = a.slice();
      while (cur.length > 1) {
        const nx: number[] = [];
        for (let i = 0; i + 1 < cur.length; i++) nx.push(cur[i] ^ cur[i + 1]);
        cur = nx;
      }
      return cur[0];
    };
    const ref = (nums: number[], queries: number[][]) => queries.map(([l, r]) => {
      let best = 0;
      for (let i = l; i <= r; i++) for (let j = i; j <= r; j++) best = Math.max(best, score(nums.slice(i, j + 1)));
      return best;
    });
    return {
      slug: "maximum-xor-score-subarray-queries",
      title: "Maximum XOR Score Subarray Queries",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon"],
      signature: {
        funcName: "maximumSubarrayXor",
        params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given an array `nums` of `n` non-negative integers and a 2D array `queries`, where `queries[i] = [l_i, r_i]`.\n\nThe **XOR score** of an array `a` is found by repeating the following until only one element is left: replace every `a[i]` with `a[i] XOR a[i + 1]` for all indices except the last, then remove the last element. The single remaining element is the score.\n\nFor each query, return the **maximum XOR score** over all subarrays of `nums[l_i..r_i]` (inclusive). Return an array `answer` where `answer[i]` is the answer to the `i`-th query.",
        [
          { in: "nums = [2,8,4,32,16,1], queries = [[0,2],[1,4],[0,5]]", out: "[12,60,60]", note: "In [2,8,4] the subarray [8,4] scores 8 XOR 4 = 12. In [8,4,32,16] the subarray [4,32,16] scores (4^32)^(32^16) = 60, and nothing in the whole array beats it." },
          { in: "nums = [0,7,3,2,8,5,1], queries = [[0,3],[1,5],[2,4],[2,6],[5,6]]", out: "[7,14,11,14,5]" },
          { in: "nums = [5], queries = [[0,0]]", out: "[5]", note: "A one-element array scores its only element." },
        ],
        ["1 <= n == nums.length <= 2000", "0 <= nums[i] <= 2^31 - 1", "1 <= queries.length <= 10^5", "queries[i].length == 2", "0 <= l_i <= r_i <= n - 1"]),
      hints: [
        "Write out the score of `nums[i..j]` after its first step: it is the score of an array of length `j - i` built from neighbouring XORs. Can you relate it to shorter subarrays of `nums` itself?",
        "The score satisfies `score(i, j) = score(i, j - 1) XOR score(i + 1, j)` — the reduction is linear, like Pascal's triangle.",
        "Fill `score` for all `O(n^2)` pairs, then `best(i, j) = max(score(i, j), best(i, j - 1), best(i + 1, j))` answers every query in `O(1)`.",
      ],
      editorial: explain({
        idea: "The XOR reduction is a Pascal-triangle process: the score of `nums[i..j]` equals `score(i, j - 1) XOR score(i + 1, j)`. That gives every subarray's score in `O(n^2)`, and a second table of the best score inside each range answers the queries by lookup.",
        steps: [
          "Iterate `i` from `n - 1` down to 0 and `j` from `i` up to `n - 1`.",
          "Set `score[i][i] = best[i][i] = nums[i]`; for `j > i`, `score[i][j] = score[i][j - 1] XOR score[i + 1][j]`.",
          "Set `best[i][j] = max(score[i][j], best[i][j - 1], best[i + 1][j])` — every subarray of `[i, j]` is either the whole range or lies inside one of the two shorter ranges.",
          "For each query `[l, r]`, answer `best[l][r]`.",
        ],
        why: "After one step the array `nums[i..j]` becomes `d[k] = nums[k] XOR nums[k + 1]` for `k` in `i..j-1`, and the score is linear in its input over XOR. By induction the score of `nums[i..j]` is the XOR of the elements whose binomial coefficient `C(j - i, k - i)` is odd; Pascal's rule `C(m, t) = C(m - 1, t) + C(m - 1, t - 1)` turns that into `score(i, j - 1) XOR score(i + 1, j)`.",
        time: "O(n^2 + q)",
        space: "O(n^2)",
        pitfalls: [
          "Simulating the reduction per subarray is `O(n^3)` per query range — far too slow for 2000 elements.",
          "`best` must include the scores of all inner subarrays, not only the ones starting at `l` or ending at `r`.",
        ],
      }),
      examples: [
        { input: "[2,8,4,32,16,1]\n[[0,2],[1,4],[0,5]]", expectedOutput: "[12,60,60]" },
        { input: "[0,7,3,2,8,5,1]\n[[0,3],[1,5],[2,4],[2,6],[5,6]]", expectedOutput: "[7,14,11,14,5]" },
        { input: "[5]\n[[0,0]]", expectedOutput: "[5]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 18]));
        const top = pick(rng, [1, 15, 255, 1000000, 2147483647]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, top));
        const q = ri(rng, 1, pick(rng, [1, 4, 10]));
        const queries = Array.from({ length: q }, () => {
          const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
          return [Math.min(a, b), Math.max(a, b)];
        });
        return { input: `${fmtIntArr(nums)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(nums, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumSubarrayXor(nums: List[int], queries: List[List[int]]) -> List[int]:
              n = len(nums)
              score = [[0] * n for _ in range(n)]
              best = [[0] * n for _ in range(n)]
              for i in range(n - 1, -1, -1):
                  score[i][i] = best[i][i] = nums[i]
                  for j in range(i + 1, n):
                      score[i][j] = score[i][j - 1] ^ score[i + 1][j]
                      best[i][j] = max(score[i][j], best[i][j - 1], best[i + 1][j])
              return [best[l][r] for l, r in queries]
        `,
        javascript: code`
          var maximumSubarrayXor = function(nums, queries) {
              var n = nums.length;
              var score = [], best = [];
              for (var a = 0; a < n; a++) { score.push(new Array(n).fill(0)); best.push(new Array(n).fill(0)); }
              for (var i = n - 1; i >= 0; i--) {
                  score[i][i] = nums[i];
                  best[i][i] = nums[i];
                  for (var j = i + 1; j < n; j++) {
                      score[i][j] = score[i][j - 1] ^ score[i + 1][j];
                      best[i][j] = Math.max(score[i][j], best[i][j - 1], best[i + 1][j]);
                  }
              }
              var out = [];
              for (var q = 0; q < queries.length; q++) out.push(best[queries[q][0]][queries[q][1]]);
              return out;
          };
        `,
        typescript: code`
          function maximumSubarrayXor(nums: number[], queries: number[][]): number[] {
              var n = nums.length;
              var score: number[][] = [], best: number[][] = [];
              for (var a = 0; a < n; a++) {
                  var r1: number[] = [], r2: number[] = [];
                  for (var b = 0; b < n; b++) { r1.push(0); r2.push(0); }
                  score.push(r1);
                  best.push(r2);
              }
              for (var i = n - 1; i >= 0; i--) {
                  score[i][i] = nums[i];
                  best[i][i] = nums[i];
                  for (var j = i + 1; j < n; j++) {
                      score[i][j] = score[i][j - 1] ^ score[i + 1][j];
                      best[i][j] = Math.max(score[i][j], best[i][j - 1], best[i + 1][j]);
                  }
              }
              var out: number[] = [];
              for (var q = 0; q < queries.length; q++) out.push(best[queries[q][0]][queries[q][1]]);
              return out;
          }
        `,
        java: code`
          public static int[] maximumSubarrayXor(int[] nums, int[][] queries) {
              int n = nums.length;
              int[][] score = new int[n][n];
              int[][] best = new int[n][n];
              for (int i = n - 1; i >= 0; i--) {
                  score[i][i] = nums[i];
                  best[i][i] = nums[i];
                  for (int j = i + 1; j < n; j++) {
                      score[i][j] = score[i][j - 1] ^ score[i + 1][j];
                      best[i][j] = Math.max(score[i][j], Math.max(best[i][j - 1], best[i + 1][j]));
                  }
              }
              int[] out = new int[queries.length];
              for (int q = 0; q < queries.length; q++) out[q] = best[queries[q][0]][queries[q][1]];
              return out;
          }
        `,
        cpp: code`
          vector<int> maximumSubarrayXor(vector<int>& nums, vector<vector<int>>& queries) {
              int n = nums.size();
              vector<vector<int>> score(n, vector<int>(n, 0)), best(n, vector<int>(n, 0));
              for (int i = n - 1; i >= 0; i--) {
                  score[i][i] = best[i][i] = nums[i];
                  for (int j = i + 1; j < n; j++) {
                      score[i][j] = score[i][j - 1] ^ score[i + 1][j];
                      best[i][j] = max(score[i][j], max(best[i][j - 1], best[i + 1][j]));
                  }
              }
              vector<int> out;
              for (auto& q : queries) out.push_back(best[q[0]][q[1]]);
              return out;
          }
        `,
        c: code`
          int* maximumSubarrayXor(int* nums, int numsSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int n = numsSize;
              int* score = (int*) malloc(sizeof(int) * n * n);
              int* best = (int*) malloc(sizeof(int) * n * n);
              for (int i = n - 1; i >= 0; i--) {
                  score[i * n + i] = nums[i];
                  best[i * n + i] = nums[i];
                  for (int j = i + 1; j < n; j++) {
                      int s = score[i * n + j - 1] ^ score[(i + 1) * n + j];
                      int b = s;
                      if (best[i * n + j - 1] > b) b = best[i * n + j - 1];
                      if (best[(i + 1) * n + j] > b) b = best[(i + 1) * n + j];
                      score[i * n + j] = s;
                      best[i * n + j] = b;
                  }
              }
              int* out = (int*) malloc(sizeof(int) * (queriesSize > 0 ? queriesSize : 1));
              for (int q = 0; q < queriesSize; q++) out[q] = best[queries[q][0] * n + queries[q][1]];
              *returnSize = queriesSize;
              free(score);
              free(best);
              return out;
          }
        `,
        csharp: code`
          public static int[] MaximumSubarrayXor(int[] nums, int[][] queries)
          {
              int n = nums.Length;
              int[,] score = new int[n, n];
              int[,] best = new int[n, n];
              for (int i = n - 1; i >= 0; i--)
              {
                  score[i, i] = nums[i];
                  best[i, i] = nums[i];
                  for (int j = i + 1; j < n; j++)
                  {
                      score[i, j] = score[i, j - 1] ^ score[i + 1, j];
                      best[i, j] = Math.Max(score[i, j], Math.Max(best[i, j - 1], best[i + 1, j]));
                  }
              }
              int[] output = new int[queries.Length];
              for (int q = 0; q < queries.Length; q++) output[q] = best[queries[q][0], queries[q][1]];
              return output;
          }
        `,
        go: code`
          func maximumSubarrayXor(nums []int, queries [][]int) []int {
              n := len(nums)
              score := make([][]int, n)
              best := make([][]int, n)
              for i := range score {
                  score[i] = make([]int, n)
                  best[i] = make([]int, n)
              }
              for i := n - 1; i >= 0; i-- {
                  score[i][i] = nums[i]
                  best[i][i] = nums[i]
                  for j := i + 1; j < n; j++ {
                      score[i][j] = score[i][j-1] ^ score[i+1][j]
                      b := score[i][j]
                      if best[i][j-1] > b {
                          b = best[i][j-1]
                      }
                      if best[i+1][j] > b {
                          b = best[i+1][j]
                      }
                      best[i][j] = b
                  }
              }
              out := make([]int, len(queries))
              for q, qr := range queries {
                  out[q] = best[qr[0]][qr[1]]
              }
              return out
          }
        `,
        kotlin: code`
          fun maximumSubarrayXor(nums: IntArray, queries: Array<IntArray>): IntArray {
              val n = nums.size
              val score = Array(n) { IntArray(n) }
              val best = Array(n) { IntArray(n) }
              for (i in n - 1 downTo 0) {
                  score[i][i] = nums[i]
                  best[i][i] = nums[i]
                  for (j in i + 1 until n) {
                      score[i][j] = score[i][j - 1] xor score[i + 1][j]
                      best[i][j] = maxOf(score[i][j], maxOf(best[i][j - 1], best[i + 1][j]))
                  }
              }
              return IntArray(queries.size) { best[queries[it][0]][queries[it][1]] }
          }
        `,
        swift: code`
          func maximumSubarrayXor(_ nums: [Int], _ queries: [[Int]]) -> [Int] {
              let n = nums.count
              var score = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)
              var best = score
              for i in stride(from: n - 1, through: 0, by: -1) {
                  score[i][i] = nums[i]
                  best[i][i] = nums[i]
                  var j = i + 1
                  while j < n {
                      score[i][j] = score[i][j - 1] ^ score[i + 1][j]
                      best[i][j] = max(score[i][j], max(best[i][j - 1], best[i + 1][j]))
                      j += 1
                  }
              }
              return queries.map { best[$0[0]][$0[1]] }
          }
        `,
        rust: code`
          fn maximumSubarrayXor(nums: Vec<i32>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let n = nums.len();
              let mut score = vec![vec![0i32; n]; n];
              let mut best = vec![vec![0i32; n]; n];
              for i in (0..n).rev() {
                  score[i][i] = nums[i];
                  best[i][i] = nums[i];
                  for j in i + 1..n {
                      score[i][j] = score[i][j - 1] ^ score[i + 1][j];
                      best[i][j] = score[i][j].max(best[i][j - 1]).max(best[i + 1][j]);
                  }
              }
              queries.iter().map(|q| best[q[0] as usize][q[1] as usize]).collect()
          }
        `,
        php: code`
          function maximumSubarrayXor($nums, $queries) {
              $n = count($nums);
              $score = array_fill(0, $n, array_fill(0, $n, 0));
              $best = $score;
              for ($i = $n - 1; $i >= 0; $i--) {
                  $score[$i][$i] = $nums[$i];
                  $best[$i][$i] = $nums[$i];
                  for ($j = $i + 1; $j < $n; $j++) {
                      $score[$i][$j] = $score[$i][$j - 1] ^ $score[$i + 1][$j];
                      $best[$i][$j] = max($score[$i][$j], $best[$i][$j - 1], $best[$i + 1][$j]);
                  }
              }
              $out = [];
              foreach ($queries as $q) $out[] = $best[$q[0]][$q[1]];
              return $out;
          }
        `,
        ruby: code`
          def maximumSubarrayXor(nums, queries)
            n = nums.length
            score = Array.new(n) { Array.new(n, 0) }
            best = Array.new(n) { Array.new(n, 0) }
            (n - 1).downto(0) do |i|
              score[i][i] = nums[i]
              best[i][i] = nums[i]
              ((i + 1)...n).each do |j|
                score[i][j] = score[i][j - 1] ^ score[i + 1][j]
                best[i][j] = [score[i][j], best[i][j - 1], best[i + 1][j]].max
              end
            end
            queries.map { |l, r| best[l][r] }
          end
        `,
      },
    };
  })(),

  // ── Find the Maximum Sequence Value of Array (LC 3287) ────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      // Every choice of 2k indices, split into its first and last k.
      const n = nums.length;
      const idx: number[] = [];
      let best = 0;
      const rec = (start: number) => {
        if (idx.length === 2 * k) {
          let a = 0, b = 0;
          for (let t = 0; t < k; t++) a |= nums[idx[t]];
          for (let t = k; t < 2 * k; t++) b |= nums[idx[t]];
          best = Math.max(best, a ^ b);
          return;
        }
        for (let i = start; i <= n - (2 * k - idx.length); i++) { idx.push(i); rec(i + 1); idx.pop(); }
      };
      rec(0);
      return best;
    };
    return {
      slug: "find-the-maximum-sequence-value-of-array",
      title: "Find the Maximum Sequence Value of Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Google"],
      signature: { funcName: "maxValue", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and a positive integer `k`.\n\nThe **value** of a sequence `seq` of size `2 * x` is\n\n`(seq[0] OR seq[1] OR ... OR seq[x - 1]) XOR (seq[x] OR seq[x + 1] OR ... OR seq[2 * x - 1])`.\n\nReturn the **maximum value** of any subsequence of `nums` of size `2 * k` (elements kept in their original order).",
        [
          { in: "nums = [2,6,7], k = 1", out: "5", note: "The subsequence [2,7] has value 2 XOR 7 = 5." },
          { in: "nums = [4,2,5,6,7], k = 2", out: "2", note: "The subsequence [4,5,6,7] has value (4 OR 5) XOR (6 OR 7) = 5 XOR 7 = 2." },
          { in: "nums = [1,2], k = 1", out: "3", note: "The only subsequence of size 2 is the whole array: 1 XOR 2 = 3." },
        ],
        ["2 <= nums.length <= 400", "1 <= nums[i] < 2^7", "1 <= k <= nums.length / 2"]),
      hints: [
        "Every value is below 128, so an OR of any number of them is also below 128 — there are only 128 possible OR results.",
        "Split the array at a position `i`: the first `k` chosen elements come from `nums[0..i]`, the last `k` from `nums[i+1..]`. For each side you only need the set of ORs that are reachable.",
        "Compute `left[i]` = set of ORs reachable by picking exactly `k` elements from the prefix ending at `i` (a knapsack over count × OR value), `right[i]` likewise for suffixes, then try every pair across every split.",
      ],
      editorial: explain({
        idea: "The two halves are independent once you fix where the first half ends, and the OR of values below `2^7` has only 128 possibilities. So track, for every prefix, which ORs of exactly `k` chosen elements are reachable — a boolean knapsack — do the same for every suffix, and combine across splits.",
        steps: [
          "Run a DP over the array with `can[j][v]` = some `j` elements of the prefix seen so far have OR `v`; for each element `x`, for `j` from `k` down to 1, set `can[j][v | x]` whenever `can[j - 1][v]`.",
          "After element `i`, store `left[i] = can[k]` (a 128-entry set).",
          "Run the same DP from the right to get `right[i]` for the suffix starting at `i`.",
          "For every split `i` from `k - 1` to `n - k - 1`, and every `a` in `left[i]`, `b` in `right[i + 1]`, keep the maximum `a XOR b`.",
        ],
        why: "In any chosen subsequence of size `2k`, the `k`-th chosen index `i` separates the halves: the first half lies in `nums[0..i]` and the second in `nums[i+1..]`. Enumerating every split and every reachable OR on each side therefore covers every subsequence, and every pair counted is realised by some subsequence.",
        time: "O(n · k · 128 + n · 128^2)",
        space: "O(n · 128 + k · 128)",
        pitfalls: [
          "Iterate `j` downwards in the knapsack so an element is not picked twice in one pass.",
          "Store a copy of `can[k]` per index; the DP table keeps changing afterwards.",
          "XOR does not distribute over OR, so you cannot choose the best half greedily — you need the whole set of reachable ORs.",
        ],
      }),
      examples: [
        { input: "[2,6,7]\n1", expectedOutput: "5" },
        { input: "[4,2,5,6,7]\n2", expectedOutput: "2" },
        { input: "[1,2]\n1", expectedOutput: "3" },
      ],
      hiddenCount: 1000,
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 9, 12]));
        const k = ri(rng, 1, Math.floor(n / 2));
        const top = pick(rng, [3, 15, 127]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxValue(nums: List[int], k: int) -> int:
              n = len(nums)

              def sweep(order):
                  can = [[False] * 128 for _ in range(k + 1)]
                  can[0][0] = True
                  res = [None] * n
                  for p in order:
                      x = nums[p]
                      for j in range(k, 0, -1):
                          prev, cur = can[j - 1], can[j]
                          for v in range(128):
                              if prev[v]:
                                  cur[v | x] = True
                      res[p] = [v for v in range(128) if can[k][v]]
                  return res

              left = sweep(range(n))
              right = sweep(range(n - 1, -1, -1))
              best = 0
              for i in range(k - 1, n - k):
                  for a in left[i]:
                      for b in right[i + 1]:
                          if a ^ b > best:
                              best = a ^ b
              return best
        `,
        javascript: code`
          var maxValue = function(nums, k) {
              var n = nums.length;
              var sweep = function(from, to, step) {
                  var can = [];
                  for (var j = 0; j <= k; j++) can.push(new Array(128).fill(false));
                  can[0][0] = true;
                  var res = new Array(n);
                  for (var p = from; p !== to; p += step) {
                      var x = nums[p];
                      for (var j = k; j >= 1; j--) {
                          var prev = can[j - 1], cur = can[j];
                          for (var v = 0; v < 128; v++) if (prev[v]) cur[v | x] = true;
                      }
                      var list = [];
                      for (var v = 0; v < 128; v++) if (can[k][v]) list.push(v);
                      res[p] = list;
                  }
                  return res;
              };
              var left = sweep(0, n, 1);
              var right = sweep(n - 1, -1, -1);
              var best = 0;
              for (var i = k - 1; i < n - k; i++) {
                  var A = left[i], B = right[i + 1];
                  for (var a = 0; a < A.length; a++) {
                      for (var b = 0; b < B.length; b++) if ((A[a] ^ B[b]) > best) best = A[a] ^ B[b];
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function maxValue(nums: number[], k: number): number {
              var n = nums.length;
              var sweep = function(from: number, to: number, step: number): number[][] {
                  var can: boolean[][] = [];
                  for (var j = 0; j <= k; j++) {
                      var row: boolean[] = [];
                      for (var v = 0; v < 128; v++) row.push(false);
                      can.push(row);
                  }
                  can[0][0] = true;
                  var res: number[][] = [];
                  for (var t = 0; t < n; t++) res.push([]);
                  for (var p = from; p !== to; p += step) {
                      var x = nums[p];
                      for (var j = k; j >= 1; j--) {
                          var prev = can[j - 1], cur = can[j];
                          for (var v = 0; v < 128; v++) if (prev[v]) cur[v | x] = true;
                      }
                      var list: number[] = [];
                      for (var v = 0; v < 128; v++) if (can[k][v]) list.push(v);
                      res[p] = list;
                  }
                  return res;
              };
              var left = sweep(0, n, 1);
              var right = sweep(n - 1, -1, -1);
              var best = 0;
              for (var i = k - 1; i < n - k; i++) {
                  var A = left[i], B = right[i + 1];
                  for (var a = 0; a < A.length; a++) {
                      for (var b = 0; b < B.length; b++) if ((A[a] ^ B[b]) > best) best = A[a] ^ B[b];
                  }
              }
              return best;
          }
        `,
        java: code`
          static boolean[][] sweep(int[] nums, int k, boolean forward) {
              int n = nums.length;
              boolean[][] can = new boolean[k + 1][128];
              can[0][0] = true;
              boolean[][] res = new boolean[n][];
              for (int t = 0; t < n; t++) {
                  int p = forward ? t : n - 1 - t;
                  int x = nums[p];
                  for (int j = k; j >= 1; j--) {
                      for (int v = 0; v < 128; v++) if (can[j - 1][v]) can[j][v | x] = true;
                  }
                  res[p] = can[k].clone();
              }
              return res;
          }

          public static int maxValue(int[] nums, int k) {
              int n = nums.length;
              boolean[][] left = sweep(nums, k, true);
              boolean[][] right = sweep(nums, k, false);
              int best = 0;
              for (int i = k - 1; i < n - k; i++) {
                  for (int a = 0; a < 128; a++) {
                      if (!left[i][a]) continue;
                      for (int b = 0; b < 128; b++) if (right[i + 1][b]) best = Math.max(best, a ^ b);
                  }
              }
              return best;
          }
        `,
        cpp: code`
          vector<vector<char>> sweepOrs(const vector<int>& nums, int k, bool forward) {
              int n = nums.size();
              vector<vector<char>> can(k + 1, vector<char>(128, 0));
              can[0][0] = 1;
              vector<vector<char>> res(n);
              for (int t = 0; t < n; t++) {
                  int p = forward ? t : n - 1 - t;
                  int x = nums[p];
                  for (int j = k; j >= 1; j--) {
                      for (int v = 0; v < 128; v++) if (can[j - 1][v]) can[j][v | x] = 1;
                  }
                  res[p] = can[k];
              }
              return res;
          }

          int maxValue(vector<int>& nums, int k) {
              int n = nums.size();
              auto left = sweepOrs(nums, k, true);
              auto right = sweepOrs(nums, k, false);
              int best = 0;
              for (int i = k - 1; i < n - k; i++) {
                  for (int a = 0; a < 128; a++) {
                      if (!left[i][a]) continue;
                      for (int b = 0; b < 128; b++) if (right[i + 1][b]) best = max(best, a ^ b);
                  }
              }
              return best;
          }
        `,
        c: code`
          static void sweepOrs(int* nums, int n, int k, int forward, char* res) {
              char* can = (char*) calloc((size_t) (k + 1) * 128, 1);
              can[0] = 1;
              for (int t = 0; t < n; t++) {
                  int p = forward ? t : n - 1 - t;
                  int x = nums[p];
                  for (int j = k; j >= 1; j--) {
                      for (int v = 0; v < 128; v++) if (can[(j - 1) * 128 + v]) can[j * 128 + (v | x)] = 1;
                  }
                  for (int v = 0; v < 128; v++) res[p * 128 + v] = can[k * 128 + v];
              }
              free(can);
          }

          int maxValue(int* nums, int numsSize, int k) {
              int n = numsSize;
              char* left = (char*) malloc((size_t) n * 128);
              char* right = (char*) malloc((size_t) n * 128);
              sweepOrs(nums, n, k, 1, left);
              sweepOrs(nums, n, k, 0, right);
              int best = 0;
              for (int i = k - 1; i < n - k; i++) {
                  for (int a = 0; a < 128; a++) {
                      if (!left[i * 128 + a]) continue;
                      for (int b = 0; b < 128; b++) if (right[(i + 1) * 128 + b] && (a ^ b) > best) best = a ^ b;
                  }
              }
              free(left);
              free(right);
              return best;
          }
        `,
        csharp: code`
          static bool[][] Sweep(int[] nums, int k, bool forward)
          {
              int n = nums.Length;
              bool[][] can = new bool[k + 1][];
              for (int j = 0; j <= k; j++) can[j] = new bool[128];
              can[0][0] = true;
              bool[][] res = new bool[n][];
              for (int t = 0; t < n; t++)
              {
                  int p = forward ? t : n - 1 - t;
                  int x = nums[p];
                  for (int j = k; j >= 1; j--)
                  {
                      for (int v = 0; v < 128; v++) if (can[j - 1][v]) can[j][v | x] = true;
                  }
                  res[p] = (bool[]) can[k].Clone();
              }
              return res;
          }

          public static int MaxValue(int[] nums, int k)
          {
              int n = nums.Length;
              bool[][] left = Sweep(nums, k, true);
              bool[][] right = Sweep(nums, k, false);
              int best = 0;
              for (int i = k - 1; i < n - k; i++)
              {
                  for (int a = 0; a < 128; a++)
                  {
                      if (!left[i][a]) continue;
                      for (int b = 0; b < 128; b++) if (right[i + 1][b]) best = Math.Max(best, a ^ b);
                  }
              }
              return best;
          }
        `,
        go: code`
          func sweepOrs(nums []int, k int, forward bool) [][]bool {
              n := len(nums)
              can := make([][]bool, k+1)
              for j := range can {
                  can[j] = make([]bool, 128)
              }
              can[0][0] = true
              res := make([][]bool, n)
              for t := 0; t < n; t++ {
                  p := t
                  if !forward {
                      p = n - 1 - t
                  }
                  x := nums[p]
                  for j := k; j >= 1; j-- {
                      for v := 0; v < 128; v++ {
                          if can[j-1][v] {
                              can[j][v|x] = true
                          }
                      }
                  }
                  res[p] = append([]bool(nil), can[k]...)
              }
              return res
          }

          func maxValue(nums []int, k int) int {
              n := len(nums)
              left := sweepOrs(nums, k, true)
              right := sweepOrs(nums, k, false)
              best := 0
              for i := k - 1; i < n-k; i++ {
                  for a := 0; a < 128; a++ {
                      if !left[i][a] {
                          continue
                      }
                      for b := 0; b < 128; b++ {
                          if right[i+1][b] && a^b > best {
                              best = a ^ b
                          }
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun sweepOrs(nums: IntArray, k: Int, forward: Boolean): Array<BooleanArray> {
              val n = nums.size
              val can = Array(k + 1) { BooleanArray(128) }
              can[0][0] = true
              val res = Array(n) { BooleanArray(0) }
              for (t in 0 until n) {
                  val p = if (forward) t else n - 1 - t
                  val x = nums[p]
                  for (j in k downTo 1) {
                      for (v in 0 until 128) if (can[j - 1][v]) can[j][v or x] = true
                  }
                  res[p] = can[k].copyOf()
              }
              return res
          }

          fun maxValue(nums: IntArray, k: Int): Int {
              val n = nums.size
              val left = sweepOrs(nums, k, true)
              val right = sweepOrs(nums, k, false)
              var best = 0
              for (i in k - 1 until n - k) {
                  for (a in 0 until 128) {
                      if (!left[i][a]) continue
                      for (b in 0 until 128) if (right[i + 1][b]) best = maxOf(best, a xor b)
                  }
              }
              return best
          }
        `,
        swift: code`
          func sweepOrs(_ nums: [Int], _ k: Int, _ forward: Bool) -> [[Bool]] {
              let n = nums.count
              var can = [[Bool]](repeating: [Bool](repeating: false, count: 128), count: k + 1)
              can[0][0] = true
              var res = [[Bool]](repeating: [], count: n)
              for t in 0..<n {
                  let p = forward ? t : n - 1 - t
                  let x = nums[p]
                  var j = k
                  while j >= 1 {
                      for v in 0..<128 where can[j - 1][v] { can[j][v | x] = true }
                      j -= 1
                  }
                  res[p] = can[k]
              }
              return res
          }

          func maxValue(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              let left = sweepOrs(nums, k, true)
              let right = sweepOrs(nums, k, false)
              var best = 0
              var i = k - 1
              while i < n - k {
                  for a in 0..<128 where left[i][a] {
                      for b in 0..<128 where right[i + 1][b] { best = max(best, a ^ b) }
                  }
                  i += 1
              }
              return best
          }
        `,
        rust: code`
          fn sweep_ors(nums: &Vec<i32>, k: usize, forward: bool) -> Vec<Vec<bool>> {
              let n = nums.len();
              let mut can = vec![vec![false; 128]; k + 1];
              can[0][0] = true;
              let mut res = vec![Vec::new(); n];
              for t in 0..n {
                  let p = if forward { t } else { n - 1 - t };
                  let x = nums[p] as usize;
                  for j in (1..=k).rev() {
                      for v in 0..128 {
                          if can[j - 1][v] {
                              can[j][v | x] = true;
                          }
                      }
                  }
                  res[p] = can[k].clone();
              }
              res
          }

          fn maxValue(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let k = k as usize;
              let left = sweep_ors(&nums, k, true);
              let right = sweep_ors(&nums, k, false);
              let mut best = 0usize;
              for i in (k - 1)..(n - k) {
                  for a in 0..128 {
                      if !left[i][a] {
                          continue;
                      }
                      for b in 0..128 {
                          if right[i + 1][b] && (a ^ b) > best {
                              best = a ^ b;
                          }
                      }
                  }
              }
              best as i32
          }
        `,
        php: code`
          function sweepOrs($nums, $k, $forward) {
              $n = count($nums);
              $can = array_fill(0, $k + 1, array_fill(0, 128, false));
              $can[0][0] = true;
              $res = [];
              for ($t = 0; $t < $n; $t++) {
                  $p = $forward ? $t : $n - 1 - $t;
                  $x = $nums[$p];
                  for ($j = $k; $j >= 1; $j--) {
                      for ($v = 0; $v < 128; $v++) if ($can[$j - 1][$v]) $can[$j][$v | $x] = true;
                  }
                  $list = [];
                  for ($v = 0; $v < 128; $v++) if ($can[$k][$v]) $list[] = $v;
                  $res[$p] = $list;
              }
              return $res;
          }

          function maxValue($nums, $k) {
              $n = count($nums);
              $left = sweepOrs($nums, $k, true);
              $right = sweepOrs($nums, $k, false);
              $best = 0;
              for ($i = $k - 1; $i < $n - $k; $i++) {
                  foreach ($left[$i] as $a) {
                      foreach ($right[$i + 1] as $b) if (($a ^ $b) > $best) $best = $a ^ $b;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def sweep_ors(nums, k, order)
            can = Array.new(k + 1) { Array.new(128, false) }
            can[0][0] = true
            res = Array.new(nums.length)
            order.each do |p|
              x = nums[p]
              k.downto(1) do |j|
                prev = can[j - 1]
                cur = can[j]
                128.times { |v| cur[v | x] = true if prev[v] }
              end
              res[p] = (0...128).select { |v| can[k][v] }
            end
            res
          end

          def maxValue(nums, k)
            n = nums.length
            left = sweep_ors(nums, k, (0...n).to_a)
            right = sweep_ors(nums, k, (0...n).to_a.reverse)
            best = 0
            ((k - 1)...(n - k)).each do |i|
              left[i].each do |a|
                right[i + 1].each { |b| best = a ^ b if (a ^ b) > best }
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Find Maximum Removals From Source String (LC 3316) ────────────
  (() => {
    const isSub = (s: string, p: string) => {
      let j = 0;
      for (let i = 0; i < s.length && j < p.length; i++) if (s[i] === p[j]) j++;
      return j === p.length;
    };
    const ref = (source: string, pattern: string, targetIndices: number[]) => {
      // Try every subset of the removable indices.
      const t = targetIndices.length;
      let best = 0;
      for (let mask = 0; mask < (1 << t); mask++) {
        let cnt = 0;
        const drop = new Set<number>();
        for (let b = 0; b < t; b++) if (mask & (1 << b)) { drop.add(targetIndices[b]); cnt++; }
        if (cnt <= best) continue;
        let rest = "";
        for (let i = 0; i < source.length; i++) if (!drop.has(i)) rest += source[i];
        if (isSub(rest, pattern)) best = cnt;
      }
      return best;
    };
    return {
      slug: "find-maximum-removals-from-source-string",
      title: "Find Maximum Removals From Source String",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "String", "Dynamic Programming", "Google"],
      signature: {
        funcName: "maxRemovals",
        params: [{ name: "source", type: "string" as const }, { name: "pattern", type: "string" as const }, { name: "targetIndices", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a string `source` of length `n`, a string `pattern` that is a **subsequence** of `source`, and a sorted array `targetIndices` of distinct indices in `[0, n - 1]`.\n\nAn **operation** removes the character at some index `idx` of `source`, provided that `idx` is in `targetIndices` and `pattern` is still a subsequence of `source` afterwards. Removing a character does **not** shift the indices of the other characters.\n\nReturn the **maximum** number of operations that can be performed.",
        [
          { in: "source = \"abbaa\", pattern = \"aba\", targetIndices = [0,1,2]", out: "1", note: "Removing index 0, 1 or 2 alone keeps \"aba\" as a subsequence, but removing any two of them breaks it." },
          { in: "source = \"bcda\", pattern = \"d\", targetIndices = [0,3]", out: "2", note: "Both index 0 ('b') and index 3 ('a') can go; \"d\" is still there." },
          { in: "source = \"dda\", pattern = \"dda\", targetIndices = [0,1,2]", out: "0", note: "The pattern is the whole string, so nothing can be removed." },
        ],
        ["1 <= n == source.length <= 3 * 10^3", "1 <= pattern.length <= n", "1 <= targetIndices.length <= n", "targetIndices is sorted in ascending order and its values are distinct", "0 <= targetIndices[i] <= n - 1", "source and pattern consist only of lowercase English letters", "pattern is a subsequence of source"]),
      hints: [
        "Flip the question: the characters you keep must still contain `pattern` as a subsequence. Every target index you do not use for matching can be removed.",
        "So you want to match `pattern` inside `source` while *using* as few target indices as possible. Think of an LCS-style DP over `(i, j)` = first `i` characters of `source`, first `j` of `pattern`.",
        "`dp[i][j]` = most removable target indices among the first `i` characters while matching the first `j` pattern characters: skip `source[i - 1]` (gain 1 if it is a target) or, if it equals `pattern[j - 1]`, use it for the match.",
      ],
      editorial: explain({
        idea: "Removing characters is safe exactly when the remaining characters still embed `pattern`. So pick one embedding of `pattern` that touches as few target indices as possible; every other target index can be removed. A subsequence DP finds that embedding.",
        steps: [
          "Mark which indices of `source` are targets.",
          "Let `dp[j]` be the maximum number of removable targets so far while having matched `pattern[0..j)`; start with `dp[0] = 0` and `dp[j] = -∞` for `j > 0`.",
          "For each index `i` of `source` (with `t = 1` if `i` is a target), update `j` from `m` down to 1: `dp[j] = max(dp[j] + t, dp[j - 1] if source[i] == pattern[j - 1])`; then `dp[0] += t`.",
          "Return `dp[m]`.",
        ],
        why: "Each character of `source` is either used to match the next pattern character (so it must stay) or not used (so it may be removed if it is a target, and removing it never hurts). Any set of removals that keeps `pattern` as a subsequence corresponds to an embedding avoiding the removed indices, and the DP maximises the unused targets over all embeddings.",
        time: "O(n · m)",
        space: "O(m)",
        pitfalls: [
          "Updating `j` upwards would let one character match two pattern positions — go from `m` down to 1.",
          "Greedily matching `pattern` as early as possible is wrong: it may use target indices that a later match would have avoided.",
        ],
      }),
      examples: [
        { input: "\"abbaa\"\n\"aba\"\n[0,1,2]", expectedOutput: "1" },
        { input: "\"bcda\"\n\"d\"\n[0,3]", expectedOutput: "2" },
        { input: "\"dda\"\n\"dda\"\n[0,1,2]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const source = randLower(rng, 1, pick(rng, [1, 5, 10, 14]), pick(rng, ["a", "ab", "abc", "abcd"]));
        const n = source.length;
        let pattern = "";
        for (let i = 0; i < n; i++) if (rng() < 0.4) pattern += source[i];
        if (pattern.length === 0) pattern = source[ri(rng, 0, n - 1)];
        const idx = shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, ri(rng, 1, Math.min(n, 10)));
        idx.sort((a, b) => a - b);
        return { input: `"${source}"\n"${pattern}"\n${fmtIntArr(idx)}`, expectedOutput: String(ref(source, pattern, idx)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxRemovals(source: str, pattern: str, targetIndices: List[int]) -> int:
              n, m = len(source), len(pattern)
              is_target = [0] * n
              for i in targetIndices:
                  is_target[i] = 1
              NEG = -10**9
              dp = [0] + [NEG] * m
              for i in range(n):
                  t = is_target[i]
                  c = source[i]
                  for j in range(m, 0, -1):
                      best = dp[j] + t
                      if c == pattern[j - 1] and dp[j - 1] > best:
                          best = dp[j - 1]
                      dp[j] = best
                  dp[0] += t
              return dp[m]
        `,
        javascript: code`
          var maxRemovals = function(source, pattern, targetIndices) {
              var n = source.length, m = pattern.length;
              var isTarget = new Array(n).fill(0);
              for (var a = 0; a < targetIndices.length; a++) isTarget[targetIndices[a]] = 1;
              var NEG = -1000000000;
              var dp = [0];
              for (var j = 1; j <= m; j++) dp.push(NEG);
              for (var i = 0; i < n; i++) {
                  var t = isTarget[i], c = source.charAt(i);
                  for (var k = m; k >= 1; k--) {
                      var best = dp[k] + t;
                      if (c === pattern.charAt(k - 1) && dp[k - 1] > best) best = dp[k - 1];
                      dp[k] = best;
                  }
                  dp[0] += t;
              }
              return dp[m];
          };
        `,
        typescript: code`
          function maxRemovals(source: string, pattern: string, targetIndices: number[]): number {
              var n = source.length, m = pattern.length;
              var isTarget: number[] = [];
              for (var z = 0; z < n; z++) isTarget.push(0);
              for (var a = 0; a < targetIndices.length; a++) isTarget[targetIndices[a]] = 1;
              var NEG = -1000000000;
              var dp: number[] = [0];
              for (var j = 1; j <= m; j++) dp.push(NEG);
              for (var i = 0; i < n; i++) {
                  var t = isTarget[i], c = source.charAt(i);
                  for (var k = m; k >= 1; k--) {
                      var best = dp[k] + t;
                      if (c === pattern.charAt(k - 1) && dp[k - 1] > best) best = dp[k - 1];
                      dp[k] = best;
                  }
                  dp[0] += t;
              }
              return dp[m];
          }
        `,
        java: code`
          public static int maxRemovals(String source, String pattern, int[] targetIndices) {
              int n = source.length(), m = pattern.length();
              int[] isTarget = new int[n];
              for (int i : targetIndices) isTarget[i] = 1;
              final int NEG = -1000000000;
              int[] dp = new int[m + 1];
              Arrays.fill(dp, NEG);
              dp[0] = 0;
              for (int i = 0; i < n; i++) {
                  int t = isTarget[i];
                  char c = source.charAt(i);
                  for (int j = m; j >= 1; j--) {
                      int best = dp[j] + t;
                      if (c == pattern.charAt(j - 1) && dp[j - 1] > best) best = dp[j - 1];
                      dp[j] = best;
                  }
                  dp[0] += t;
              }
              return dp[m];
          }
        `,
        cpp: code`
          int maxRemovals(string source, string pattern, vector<int>& targetIndices) {
              int n = source.size(), m = pattern.size();
              vector<int> isTarget(n, 0);
              for (int i : targetIndices) isTarget[i] = 1;
              const int NEG = -1000000000;
              vector<int> dp(m + 1, NEG);
              dp[0] = 0;
              for (int i = 0; i < n; i++) {
                  int t = isTarget[i];
                  for (int j = m; j >= 1; j--) {
                      int best = dp[j] + t;
                      if (source[i] == pattern[j - 1] && dp[j - 1] > best) best = dp[j - 1];
                      dp[j] = best;
                  }
                  dp[0] += t;
              }
              return dp[m];
          }
        `,
        c: code`
          int maxRemovals(const char* source, const char* pattern, int* targetIndices, int targetIndicesSize) {
              int n = (int) strlen(source), m = (int) strlen(pattern);
              int* isTarget = (int*) calloc((size_t) n, sizeof(int));
              for (int a = 0; a < targetIndicesSize; a++) isTarget[targetIndices[a]] = 1;
              const int NEG = -1000000000;
              int* dp = (int*) malloc(sizeof(int) * (m + 1));
              for (int j = 0; j <= m; j++) dp[j] = NEG;
              dp[0] = 0;
              for (int i = 0; i < n; i++) {
                  int t = isTarget[i];
                  for (int j = m; j >= 1; j--) {
                      int best = dp[j] + t;
                      if (source[i] == pattern[j - 1] && dp[j - 1] > best) best = dp[j - 1];
                      dp[j] = best;
                  }
                  dp[0] += t;
              }
              int ans = dp[m];
              free(isTarget);
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MaxRemovals(string source, string pattern, int[] targetIndices)
          {
              int n = source.Length, m = pattern.Length;
              int[] isTarget = new int[n];
              foreach (int i in targetIndices) isTarget[i] = 1;
              const int NEG = -1000000000;
              int[] dp = new int[m + 1];
              for (int j = 1; j <= m; j++) dp[j] = NEG;
              for (int i = 0; i < n; i++)
              {
                  int t = isTarget[i];
                  for (int j = m; j >= 1; j--)
                  {
                      int best = dp[j] + t;
                      if (source[i] == pattern[j - 1] && dp[j - 1] > best) best = dp[j - 1];
                      dp[j] = best;
                  }
                  dp[0] += t;
              }
              return dp[m];
          }
        `,
        go: code`
          func maxRemovals(source string, pattern string, targetIndices []int) int {
              n, m := len(source), len(pattern)
              isTarget := make([]int, n)
              for _, i := range targetIndices {
                  isTarget[i] = 1
              }
              const neg = -1000000000
              dp := make([]int, m+1)
              for j := 1; j <= m; j++ {
                  dp[j] = neg
              }
              for i := 0; i < n; i++ {
                  t := isTarget[i]
                  for j := m; j >= 1; j-- {
                      best := dp[j] + t
                      if source[i] == pattern[j-1] && dp[j-1] > best {
                          best = dp[j-1]
                      }
                      dp[j] = best
                  }
                  dp[0] += t
              }
              return dp[m]
          }
        `,
        kotlin: code`
          fun maxRemovals(source: String, pattern: String, targetIndices: IntArray): Int {
              val n = source.length
              val m = pattern.length
              val isTarget = IntArray(n)
              for (i in targetIndices) isTarget[i] = 1
              val neg = -1000000000
              val dp = IntArray(m + 1) { if (it == 0) 0 else neg }
              for (i in 0 until n) {
                  val t = isTarget[i]
                  for (j in m downTo 1) {
                      var best = dp[j] + t
                      if (source[i] == pattern[j - 1] && dp[j - 1] > best) best = dp[j - 1]
                      dp[j] = best
                  }
                  dp[0] += t
              }
              return dp[m]
          }
        `,
        swift: code`
          func maxRemovals(_ source: String, _ pattern: String, _ targetIndices: [Int]) -> Int {
              let s = Array(source), p = Array(pattern)
              let n = s.count, m = p.count
              var isTarget = [Int](repeating: 0, count: n)
              for i in targetIndices { isTarget[i] = 1 }
              let neg = -1000000000
              var dp = [Int](repeating: neg, count: m + 1)
              dp[0] = 0
              for i in 0..<n {
                  let t = isTarget[i]
                  var j = m
                  while j >= 1 {
                      var best = dp[j] + t
                      if s[i] == p[j - 1] && dp[j - 1] > best { best = dp[j - 1] }
                      dp[j] = best
                      j -= 1
                  }
                  dp[0] += t
              }
              return dp[m]
          }
        `,
        rust: code`
          fn maxRemovals(source: String, pattern: String, target_indices: Vec<i32>) -> i32 {
              let s = source.as_bytes();
              let p = pattern.as_bytes();
              let n = s.len();
              let m = p.len();
              let mut is_target = vec![0i32; n];
              for &i in &target_indices {
                  is_target[i as usize] = 1;
              }
              let neg = -1_000_000_000i32;
              let mut dp = vec![neg; m + 1];
              dp[0] = 0;
              for i in 0..n {
                  let t = is_target[i];
                  for j in (1..=m).rev() {
                      let mut best = dp[j] + t;
                      if s[i] == p[j - 1] && dp[j - 1] > best {
                          best = dp[j - 1];
                      }
                      dp[j] = best;
                  }
                  dp[0] += t;
              }
              dp[m]
          }
        `,
        php: code`
          function maxRemovals($source, $pattern, $targetIndices) {
              $n = strlen($source);
              $m = strlen($pattern);
              $isTarget = array_fill(0, $n, 0);
              foreach ($targetIndices as $i) $isTarget[$i] = 1;
              $NEG = -1000000000;
              $dp = array_fill(0, $m + 1, $NEG);
              $dp[0] = 0;
              for ($i = 0; $i < $n; $i++) {
                  $t = $isTarget[$i];
                  $c = $source[$i];
                  for ($j = $m; $j >= 1; $j--) {
                      $best = $dp[$j] + $t;
                      if ($c === $pattern[$j - 1] && $dp[$j - 1] > $best) $best = $dp[$j - 1];
                      $dp[$j] = $best;
                  }
                  $dp[0] += $t;
              }
              return $dp[$m];
          }
        `,
        ruby: code`
          def maxRemovals(source, pattern, targetIndices)
            n = source.length
            m = pattern.length
            is_target = Array.new(n, 0)
            targetIndices.each { |i| is_target[i] = 1 }
            neg = -1_000_000_000
            dp = Array.new(m + 1, neg)
            dp[0] = 0
            n.times do |i|
              t = is_target[i]
              c = source[i]
              m.downto(1) do |j|
                best = dp[j] + t
                best = dp[j - 1] if c == pattern[j - 1] && dp[j - 1] > best
                dp[j] = best
              end
              dp[0] += t
            end
            dp[m]
          end
        `,
      },
    };
  })(),

  // ── Count The Number of Winning Sequences (LC 3320) ───────────────
  (() => {
    const MOD = 1000000007;
    const IDX: Record<string, number> = { F: 0, W: 1, E: 2 };
    // Bob's creature b against Alice's a: +1 when Bob wins the round, -1 when Alice does.
    const delta = (b: number, a: number) => { const d = (b - a + 3) % 3; return d === 1 ? 1 : d === 2 ? -1 : 0; };
    const brute = (s: string) => {
      let count = 0;
      const go = (i: number, last: number, diff: number) => {
        if (i === s.length) { if (diff > 0) count++; return; }
        for (let b = 0; b < 3; b++) if (b !== last) go(i + 1, b, diff + delta(b, IDX[s[i]]));
      };
      go(0, -1, 0);
      return count % MOD;
    };
    const dpRef = (s: string) => {
      // Map from "last,diff" to the number of sequences, reduced mod 1e9+7.
      let cur = new Map<string, number>();
      for (let b = 0; b < 3; b++) cur.set(`${b},${delta(b, IDX[s[0]])}`, 1);
      for (let i = 1; i < s.length; i++) {
        const nx = new Map<string, number>();
        for (const [key, c] of cur) {
          const [last, diff] = key.split(",").map(Number);
          for (let b = 0; b < 3; b++) {
            if (b === last) continue;
            const k2 = `${b},${diff + delta(b, IDX[s[i]])}`;
            nx.set(k2, ((nx.get(k2) || 0) + c) % MOD);
          }
        }
        cur = nx;
      }
      let total = 0;
      for (const [key, c] of cur) if (Number(key.split(",")[1]) > 0) total = (total + c) % MOD;
      return total;
    };
    const ref = (s: string) => (s.length <= 11 ? brute(s) : dpRef(s));
    return {
      slug: "count-the-number-of-winning-sequences",
      title: "Count The Number of Winning Sequences",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Amazon"],
      signature: { funcName: "countWinningSequences", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Alice and Bob play a game of `n` rounds. In each round both summon one of three creatures: a Fire Dragon (`'F'`), a Water Serpent (`'W'`) or an Earth Golem (`'E'`). In a round:\n\n- Fire Dragon against Earth Golem: the Fire Dragon's player scores a point.\n- Water Serpent against Fire Dragon: the Water Serpent's player scores a point.\n- Earth Golem against Water Serpent: the Earth Golem's player scores a point.\n- The same creature on both sides: nobody scores.\n\nYou are given Alice's moves as a string `s`, where `s[i]` is her creature in round `i`. Bob never summons the **same creature in two consecutive rounds**.\n\nReturn how many different sequences of moves let Bob finish with **strictly more** points than Alice. Since the answer may be very large, return it **modulo** `10^9 + 7`.",
        [
          { in: "s = \"FFF\"", out: "3", note: "Bob wins with \"WFW\", \"FWF\" or \"WEW\"." },
          { in: "s = \"FWEFW\"", out: "18" },
          { in: "s = \"E\"", out: "1", note: "Only a Fire Dragon beats Alice's Earth Golem." },
        ],
        ["1 <= s.length <= 1000", "s[i] is one of 'F', 'W' or 'E'"]),
      hints: [
        "Only two things about the past matter for the future: Bob's last creature (to avoid repeating it) and the current score difference.",
        "Let `dp[i][last][diff]` count Bob's sequences over the first `i` rounds ending with `last` and with Bob ahead by `diff` (which may be negative — shift it by `n`).",
        "Each round, extend every state with the two creatures different from `last`, adjusting `diff` by +1, 0 or -1. The answer sums the states with `diff > 0`.",
      ],
      editorial: explain({
        idea: "A round's outcome depends only on the two creatures in it, and Bob's only constraint links consecutive rounds. So the whole history collapses into (Bob's last creature, Bob's lead), and a DP over rounds counts sequences per state.",
        steps: [
          "Number the creatures F = 0, W = 1, E = 2; then Bob's `b` beats Alice's `a` exactly when `(b - a) mod 3 = 1`, and loses when it is 2.",
          "Initialise round 0: for each `b`, one sequence with lead `delta(b, s[0])`.",
          "For each later round, for every state `(last, lead)` with a non-zero count and every `b != last`, add the count to `(b, lead + delta(b, s[i]))` modulo `10^9 + 7`.",
          "Sum the counts of all states with `lead > 0`.",
        ],
        why: "Two partial sequences with the same last creature and the same lead can be extended by exactly the same continuations with the same final results, so merging them into one counted state is exact. The lead after `i` rounds lies in `[-i, i]`, giving `O(n)` leads per round.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "The lead can be negative — offset it by `n` when using it as an array index.",
          "\"Strictly more\" excludes ties: a lead of 0 does not count.",
        ],
      }),
      examples: [
        { input: "\"FFF\"", expectedOutput: "3" },
        { input: "\"FWEFW\"", expectedOutput: "18" },
        { input: "\"E\"", expectedOutput: "1" },
      ],
      hiddenCount: 2000,
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, pick(rng, [1, 4, 8, 11, 30, 45]), pick(rng, ["FWE", "FWE", "F", "FW", "WE"]));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def countWinningSequences(s: str) -> int:
              MOD = 10**9 + 7
              idx = {'F': 0, 'W': 1, 'E': 2}
              n = len(s)
              off = n
              width = 2 * n + 1

              def delta(b, a):
                  d = (b - a) % 3
                  return 1 if d == 1 else (-1 if d == 2 else 0)

              dp = [[0] * width for _ in range(3)]
              a0 = idx[s[0]]
              for b in range(3):
                  dp[b][off + delta(b, a0)] = 1
              for i in range(1, n):
                  a = idx[s[i]]
                  nd = [[0] * width for _ in range(3)]
                  for p in range(3):
                      row = dp[p]
                      for x in range(off - i, off + i + 1):
                          c = row[x]
                          if c == 0:
                              continue
                          for b in range(3):
                              if b != p:
                                  y = x + delta(b, a)
                                  nd[b][y] = (nd[b][y] + c) % MOD
                  dp = nd
              total = 0
              for b in range(3):
                  for x in range(off + 1, width):
                      total += dp[b][x]
              return total % MOD
        `,
        javascript: code`
          var countWinningSequences = function(s) {
              var MOD = 1000000007;
              var code = function(ch) { return ch === "F" ? 0 : ch === "W" ? 1 : 2; };
              var delta = function(b, a) { var d = (b - a + 3) % 3; return d === 1 ? 1 : d === 2 ? -1 : 0; };
              var n = s.length, off = n, width = 2 * n + 1;
              var dp = [];
              for (var b = 0; b < 3; b++) dp.push(new Array(width).fill(0));
              var a0 = code(s.charAt(0));
              for (var b0 = 0; b0 < 3; b0++) dp[b0][off + delta(b0, a0)] = 1;
              for (var i = 1; i < n; i++) {
                  var a = code(s.charAt(i));
                  var nd = [];
                  for (var t = 0; t < 3; t++) nd.push(new Array(width).fill(0));
                  for (var p = 0; p < 3; p++) {
                      for (var x = off - i; x <= off + i; x++) {
                          var c = dp[p][x];
                          if (c === 0) continue;
                          for (var b2 = 0; b2 < 3; b2++) {
                              if (b2 === p) continue;
                              var y = x + delta(b2, a);
                              nd[b2][y] = (nd[b2][y] + c) % MOD;
                          }
                      }
                  }
                  dp = nd;
              }
              var total = 0;
              for (var b3 = 0; b3 < 3; b3++) for (var z = off + 1; z < width; z++) total = (total + dp[b3][z]) % MOD;
              return total;
          };
        `,
        typescript: code`
          function countWinningSequences(s: string): number {
              var MOD = 1000000007;
              var code = function(ch: string): number { return ch === "F" ? 0 : ch === "W" ? 1 : 2; };
              var delta = function(b: number, a: number): number { var d = (b - a + 3) % 3; return d === 1 ? 1 : d === 2 ? -1 : 0; };
              var n = s.length, off = n, width = 2 * n + 1;
              var zeros = function(): number[] { var r: number[] = []; for (var q = 0; q < width; q++) r.push(0); return r; };
              var dp: number[][] = [zeros(), zeros(), zeros()];
              var a0 = code(s.charAt(0));
              for (var b0 = 0; b0 < 3; b0++) dp[b0][off + delta(b0, a0)] = 1;
              for (var i = 1; i < n; i++) {
                  var a = code(s.charAt(i));
                  var nd: number[][] = [zeros(), zeros(), zeros()];
                  for (var p = 0; p < 3; p++) {
                      for (var x = off - i; x <= off + i; x++) {
                          var c = dp[p][x];
                          if (c === 0) continue;
                          for (var b2 = 0; b2 < 3; b2++) {
                              if (b2 === p) continue;
                              var y = x + delta(b2, a);
                              nd[b2][y] = (nd[b2][y] + c) % MOD;
                          }
                      }
                  }
                  dp = nd;
              }
              var total = 0;
              for (var b3 = 0; b3 < 3; b3++) for (var z = off + 1; z < width; z++) total = (total + dp[b3][z]) % MOD;
              return total;
          }
        `,
        java: code`
          static int creature(char ch) { return ch == 'F' ? 0 : ch == 'W' ? 1 : 2; }

          static int delta(int b, int a) {
              int d = (b - a + 3) % 3;
              return d == 1 ? 1 : d == 2 ? -1 : 0;
          }

          public static int countWinningSequences(String s) {
              final int MOD = 1000000007;
              int n = s.length(), off = n, width = 2 * n + 1;
              int[][] dp = new int[3][width];
              int a0 = creature(s.charAt(0));
              for (int b = 0; b < 3; b++) dp[b][off + delta(b, a0)] = 1;
              for (int i = 1; i < n; i++) {
                  int a = creature(s.charAt(i));
                  int[][] nd = new int[3][width];
                  for (int p = 0; p < 3; p++) {
                      for (int x = off - i; x <= off + i; x++) {
                          int c = dp[p][x];
                          if (c == 0) continue;
                          for (int b = 0; b < 3; b++) {
                              if (b == p) continue;
                              int y = x + delta(b, a);
                              nd[b][y] = (nd[b][y] + c) % MOD;
                          }
                      }
                  }
                  dp = nd;
              }
              long total = 0;
              for (int b = 0; b < 3; b++) for (int x = off + 1; x < width; x++) total += dp[b][x];
              return (int) (total % MOD);
          }
        `,
        cpp: code`
          int countWinningSequences(string s) {
              const int MOD = 1000000007;
              auto creature = [](char ch) { return ch == 'F' ? 0 : ch == 'W' ? 1 : 2; };
              auto delta = [](int b, int a) { int d = (b - a + 3) % 3; return d == 1 ? 1 : d == 2 ? -1 : 0; };
              int n = s.size(), off = n, width = 2 * n + 1;
              vector<vector<int>> dp(3, vector<int>(width, 0));
              int a0 = creature(s[0]);
              for (int b = 0; b < 3; b++) dp[b][off + delta(b, a0)] = 1;
              for (int i = 1; i < n; i++) {
                  int a = creature(s[i]);
                  vector<vector<int>> nd(3, vector<int>(width, 0));
                  for (int p = 0; p < 3; p++) {
                      for (int x = off - i; x <= off + i; x++) {
                          int c = dp[p][x];
                          if (c == 0) continue;
                          for (int b = 0; b < 3; b++) {
                              if (b == p) continue;
                              int y = x + delta(b, a);
                              nd[b][y] = (nd[b][y] + c) % MOD;
                          }
                      }
                  }
                  dp = nd;
              }
              long long total = 0;
              for (int b = 0; b < 3; b++) for (int x = off + 1; x < width; x++) total += dp[b][x];
              return (int) (total % MOD);
          }
        `,
        c: code`
          static int creatureOf(char ch) { return ch == 'F' ? 0 : ch == 'W' ? 1 : 2; }

          static int roundDelta(int b, int a) {
              int d = (b - a + 3) % 3;
              return d == 1 ? 1 : d == 2 ? -1 : 0;
          }

          int countWinningSequences(const char* s) {
              const int MOD = 1000000007;
              int n = (int) strlen(s), off = n, width = 2 * n + 1;
              int* dp = (int*) calloc((size_t) 3 * width, sizeof(int));
              int* nd = (int*) calloc((size_t) 3 * width, sizeof(int));
              int a0 = creatureOf(s[0]);
              for (int b = 0; b < 3; b++) dp[b * width + off + roundDelta(b, a0)] = 1;
              for (int i = 1; i < n; i++) {
                  int a = creatureOf(s[i]);
                  for (int z = 0; z < 3 * width; z++) nd[z] = 0;
                  for (int p = 0; p < 3; p++) {
                      for (int x = off - i; x <= off + i; x++) {
                          int c = dp[p * width + x];
                          if (c == 0) continue;
                          for (int b = 0; b < 3; b++) {
                              if (b == p) continue;
                              int y = b * width + x + roundDelta(b, a);
                              nd[y] = (nd[y] + c) % MOD;
                          }
                      }
                  }
                  int* t = dp; dp = nd; nd = t;
              }
              long long total = 0;
              for (int b = 0; b < 3; b++) for (int x = off + 1; x < width; x++) total += dp[b * width + x];
              free(dp);
              free(nd);
              return (int) (total % MOD);
          }
        `,
        csharp: code`
          static int Creature(char ch) { return ch == 'F' ? 0 : ch == 'W' ? 1 : 2; }

          static int Delta(int b, int a)
          {
              int d = (b - a + 3) % 3;
              return d == 1 ? 1 : d == 2 ? -1 : 0;
          }

          public static int CountWinningSequences(string s)
          {
              const int MOD = 1000000007;
              int n = s.Length, off = n, width = 2 * n + 1;
              int[,] dp = new int[3, width];
              int a0 = Creature(s[0]);
              for (int b = 0; b < 3; b++) dp[b, off + Delta(b, a0)] = 1;
              for (int i = 1; i < n; i++)
              {
                  int a = Creature(s[i]);
                  int[,] nd = new int[3, width];
                  for (int p = 0; p < 3; p++)
                  {
                      for (int x = off - i; x <= off + i; x++)
                      {
                          int c = dp[p, x];
                          if (c == 0) continue;
                          for (int b = 0; b < 3; b++)
                          {
                              if (b == p) continue;
                              int y = x + Delta(b, a);
                              nd[b, y] = (nd[b, y] + c) % MOD;
                          }
                      }
                  }
                  dp = nd;
              }
              long total = 0;
              for (int b = 0; b < 3; b++) for (int x = off + 1; x < width; x++) total += dp[b, x];
              return (int) (total % MOD);
          }
        `,
        go: code`
          func countWinningSequences(s string) int {
              const mod = 1000000007
              creature := func(ch byte) int {
                  if ch == 'F' {
                      return 0
                  }
                  if ch == 'W' {
                      return 1
                  }
                  return 2
              }
              delta := func(b, a int) int {
                  d := (b - a + 3) % 3
                  if d == 1 {
                      return 1
                  }
                  if d == 2 {
                      return -1
                  }
                  return 0
              }
              n := len(s)
              off, width := n, 2*n+1
              dp := make([][]int, 3)
              for b := range dp {
                  dp[b] = make([]int, width)
              }
              a0 := creature(s[0])
              for b := 0; b < 3; b++ {
                  dp[b][off+delta(b, a0)] = 1
              }
              for i := 1; i < n; i++ {
                  a := creature(s[i])
                  nd := make([][]int, 3)
                  for b := range nd {
                      nd[b] = make([]int, width)
                  }
                  for p := 0; p < 3; p++ {
                      for x := off - i; x <= off+i; x++ {
                          c := dp[p][x]
                          if c == 0 {
                              continue
                          }
                          for b := 0; b < 3; b++ {
                              if b == p {
                                  continue
                              }
                              y := x + delta(b, a)
                              nd[b][y] = (nd[b][y] + c) % mod
                          }
                      }
                  }
                  dp = nd
              }
              total := 0
              for b := 0; b < 3; b++ {
                  for x := off + 1; x < width; x++ {
                      total = (total + dp[b][x]) % mod
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun countWinningSequences(s: String): Int {
              val modulus = 1000000007
              fun creature(ch: Char): Int = if (ch == 'F') 0 else if (ch == 'W') 1 else 2
              fun delta(b: Int, a: Int): Int {
                  val d = (b - a + 3) % 3
                  return if (d == 1) 1 else if (d == 2) -1 else 0
              }
              val n = s.length
              val off = n
              val width = 2 * n + 1
              var dp = Array(3) { IntArray(width) }
              val a0 = creature(s[0])
              for (b in 0 until 3) dp[b][off + delta(b, a0)] = 1
              for (i in 1 until n) {
                  val a = creature(s[i])
                  val nd = Array(3) { IntArray(width) }
                  for (p in 0 until 3) {
                      for (x in off - i..off + i) {
                          val c = dp[p][x]
                          if (c == 0) continue
                          for (b in 0 until 3) {
                              if (b == p) continue
                              val y = x + delta(b, a)
                              nd[b][y] = (nd[b][y] + c) % modulus
                          }
                      }
                  }
                  dp = nd
              }
              var total = 0L
              for (b in 0 until 3) for (x in off + 1 until width) total += dp[b][x]
              return (total % modulus).toInt()
          }
        `,
        swift: code`
          func countWinningSequences(_ s: String) -> Int {
              let modulus = 1000000007
              let moves: [Int] = s.map { $0 == "F" ? 0 : ($0 == "W" ? 1 : 2) }
              func delta(_ b: Int, _ a: Int) -> Int {
                  let d = (b - a + 3) % 3
                  return d == 1 ? 1 : (d == 2 ? -1 : 0)
              }
              let n = moves.count, off = n, width = 2 * n + 1
              var dp = [[Int]](repeating: [Int](repeating: 0, count: width), count: 3)
              for b in 0..<3 { dp[b][off + delta(b, moves[0])] = 1 }
              var i = 1
              while i < n {
                  let a = moves[i]
                  var nd = [[Int]](repeating: [Int](repeating: 0, count: width), count: 3)
                  for p in 0..<3 {
                      for x in (off - i)...(off + i) {
                          let c = dp[p][x]
                          if c == 0 { continue }
                          for b in 0..<3 where b != p {
                              let y = x + delta(b, a)
                              nd[b][y] = (nd[b][y] + c) % modulus
                          }
                      }
                  }
                  dp = nd
                  i += 1
              }
              var total = 0
              for b in 0..<3 {
                  var x = off + 1
                  while x < width { total = (total + dp[b][x]) % modulus; x += 1 }
              }
              return total
          }
        `,
        rust: code`
          fn countWinningSequences(s: String) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let moves: Vec<i64> = s.bytes().map(|ch| if ch == b'F' { 0 } else if ch == b'W' { 1 } else { 2 }).collect();
              let delta = |b: i64, a: i64| -> i64 {
                  let d = (b - a + 3) % 3;
                  if d == 1 { 1 } else if d == 2 { -1 } else { 0 }
              };
              let n = moves.len() as i64;
              let off = n;
              let width = (2 * n + 1) as usize;
              let mut dp = vec![vec![0i64; width]; 3];
              for b in 0..3i64 {
                  dp[b as usize][(off + delta(b, moves[0])) as usize] = 1;
              }
              for i in 1..n {
                  let a = moves[i as usize];
                  let mut nd = vec![vec![0i64; width]; 3];
                  for p in 0..3i64 {
                      for x in (off - i)..=(off + i) {
                          let c = dp[p as usize][x as usize];
                          if c == 0 {
                              continue;
                          }
                          for b in 0..3i64 {
                              if b == p {
                                  continue;
                              }
                              let y = (x + delta(b, a)) as usize;
                              nd[b as usize][y] = (nd[b as usize][y] + c) % modulus;
                          }
                      }
                  }
                  dp = nd;
              }
              let mut total = 0i64;
              for b in 0..3 {
                  for x in (off as usize + 1)..width {
                      total = (total + dp[b][x]) % modulus;
                  }
              }
              total as i32
          }
        `,
        php: code`
          function countWinningSequences($s) {
              $MOD = 1000000007;
              $map = ['F' => 0, 'W' => 1, 'E' => 2];
              $n = strlen($s);
              $off = $n;
              $width = 2 * $n + 1;
              $delta = function ($b, $a) {
                  $d = ($b - $a + 3) % 3;
                  return $d == 1 ? 1 : ($d == 2 ? -1 : 0);
              };
              $dp = array_fill(0, 3, array_fill(0, $width, 0));
              $a0 = $map[$s[0]];
              for ($b = 0; $b < 3; $b++) $dp[$b][$off + $delta($b, $a0)] = 1;
              for ($i = 1; $i < $n; $i++) {
                  $a = $map[$s[$i]];
                  $d = [$delta(0, $a), $delta(1, $a), $delta(2, $a)];
                  $nd = array_fill(0, 3, array_fill(0, $width, 0));
                  for ($p = 0; $p < 3; $p++) {
                      for ($x = $off - $i; $x <= $off + $i; $x++) {
                          $c = $dp[$p][$x];
                          if ($c == 0) continue;
                          for ($b = 0; $b < 3; $b++) {
                              if ($b == $p) continue;
                              $y = $x + $d[$b];
                              $nd[$b][$y] = ($nd[$b][$y] + $c) % $MOD;
                          }
                      }
                  }
                  $dp = $nd;
              }
              $total = 0;
              for ($b = 0; $b < 3; $b++) for ($x = $off + 1; $x < $width; $x++) $total = ($total + $dp[$b][$x]) % $MOD;
              return $total;
          }
        `,
        ruby: code`
          def countWinningSequences(s)
            mod = 1_000_000_007
            map = { 'F' => 0, 'W' => 1, 'E' => 2 }
            n = s.length
            off = n
            width = 2 * n + 1
            delta = lambda do |b, a|
              d = (b - a) % 3
              d == 1 ? 1 : (d == 2 ? -1 : 0)
            end
            dp = Array.new(3) { Array.new(width, 0) }
            a0 = map[s[0]]
            3.times { |b| dp[b][off + delta.call(b, a0)] = 1 }
            (1...n).each do |i|
              a = map[s[i]]
              d = [delta.call(0, a), delta.call(1, a), delta.call(2, a)]
              nd = Array.new(3) { Array.new(width, 0) }
              3.times do |p|
                row = dp[p]
                ((off - i)..(off + i)).each do |x|
                  c = row[x]
                  next if c == 0
                  3.times do |b|
                    next if b == p
                    y = x + d[b]
                    nd[b][y] = (nd[b][y] + c) % mod
                  end
                end
              end
              dp = nd
            end
            total = 0
            3.times { |b| ((off + 1)...width).each { |x| total += dp[b][x] } }
            total % mod
          end
        `,
      },
    };
  })(),

  // ── Maximum Points Tourist Can Earn (LC 3332) ─────────────────────
  (() => {
    const ref = (n: number, k: number, stayScore: number[][], travelScore: number[][]) => {
      // Every itinerary: a start city, then one city per day.
      let best = 0;
      const go = (day: number, city: number, pts: number) => {
        if (day === k) { best = Math.max(best, pts); return; }
        for (let next = 0; next < n; next++) {
          go(day + 1, next, pts + (next === city ? stayScore[day][city] : travelScore[city][next]));
        }
      };
      for (let c = 0; c < n; c++) go(0, c, 0);
      return best;
    };
    return {
      slug: "maximum-points-tourist-can-earn",
      title: "Maximum Points Tourist Can Earn",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon"],
      signature: {
        funcName: "maxScore",
        params: [
          { name: "n", type: "int" as const }, { name: "k", type: "int" as const },
          { name: "stayScore", type: "int[][]" as const }, { name: "travelScore", type: "int[][]" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A tourist visits a country of `n` cities, every pair of which is connected by a direct road, for exactly `k` days (numbered from 0). The tourist may start in **any** city.\n\nEach day, the tourist in city `curr` chooses one of two things:\n\n- **Stay** in `curr` and earn `stayScore[i][curr]` points on day `i`, or\n- **Move** to another city `dest` and earn `travelScore[curr][dest]` points.\n\nReturn the **maximum** total number of points the tourist can earn.",
        [
          { in: "n = 2, k = 1, stayScore = [[2,3]], travelScore = [[0,2],[1,0]]", out: "3", note: "Start in city 1 and stay there for the day." },
          { in: "n = 3, k = 2, stayScore = [[3,4,2],[2,1,2]], travelScore = [[0,2,1],[2,0,4],[3,2,0]]", out: "8", note: "Start in city 1, stay on day 0 (4 points) and move to city 2 on day 1 (4 points)." },
          { in: "n = 1, k = 3, stayScore = [[5],[1],[7]], travelScore = [[0]]", out: "13", note: "With one city the tourist stays every day: 5 + 1 + 7." },
        ],
        ["1 <= n <= 200", "1 <= k <= 200", "n == travelScore.length == travelScore[i].length == stayScore[i].length", "k == stayScore.length", "1 <= stayScore[i][j] <= 100", "0 <= travelScore[i][j] <= 100", "travelScore[i][i] == 0"]),
      hints: [
        "What matters at the end of a day is only which city the tourist is in — not how they got there.",
        "Let `dp[c]` be the best total so far ending the day in city `c`. Before day 0 every city is a free starting point, so `dp[c] = 0`.",
        "On day `i`, `new[c] = max(dp[c] + stayScore[i][c], max over p != c of dp[p] + travelScore[p][c])`.",
      ],
      editorial: explain({
        idea: "Each day's choice depends only on the current city, so a DP over (day, city) captures every itinerary: the tourist ends day `i` in city `c` either by staying there or by moving in from another city.",
        steps: [
          "Set `dp[c] = 0` for every city (the tourist may start anywhere).",
          "For each day `i`, compute `new[c] = max(dp[c] + stayScore[i][c], max_{p != c} dp[p] + travelScore[p][c])`.",
          "Replace `dp` with `new`; after `k` days return `max(dp)`.",
        ],
        why: "The points earned on later days depend only on where the tourist is, so among all histories that end day `i` in city `c`, only the best total can lead to an optimal answer. The two cases (stay, move from some `p`) are exactly the ways to end a day in `c`.",
        time: "O(k · n^2)",
        space: "O(n)",
        pitfalls: [
          "Staying in `c` earns `stayScore`, not `travelScore[c][c]` (which is 0) — keep the move case to `p != c`.",
          "The start city is free — no points are earned just for starting there.",
        ],
      }),
      examples: [
        { input: "2\n1\n[[2,3]]\n[[0,2],[1,0]]", expectedOutput: "3" },
        { input: "3\n2\n[[3,4,2],[2,1,2]]\n[[0,2,1],[2,0,4],[3,2,0]]", expectedOutput: "8" },
        { input: "1\n3\n[[5],[1],[7]]\n[[0]]", expectedOutput: "13" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 2, 3, 3, 4, 5, 6]);
        const kMax = n <= 2 ? 10 : n === 3 ? 6 : n === 4 ? 5 : n === 5 ? 4 : 3;
        const k = ri(rng, 1, kMax);
        const top = pick(rng, [5, 100]);
        const stayScore = Array.from({ length: k }, () => Array.from({ length: n }, () => ri(rng, 1, top)));
        const travelScore = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : ri(rng, 0, top))));
        return {
          input: `${n}\n${k}\n${fmtIntMat(stayScore)}\n${fmtIntMat(travelScore)}`,
          expectedOutput: String(ref(n, k, stayScore, travelScore)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def maxScore(n: int, k: int, stayScore: List[List[int]], travelScore: List[List[int]]) -> int:
              dp = [0] * n
              for day in range(k):
                  stay = stayScore[day]
                  nd = [0] * n
                  for c in range(n):
                      best = dp[c] + stay[c]
                      for p in range(n):
                          if p != c:
                              v = dp[p] + travelScore[p][c]
                              if v > best:
                                  best = v
                      nd[c] = best
                  dp = nd
              return max(dp)
        `,
        javascript: code`
          var maxScore = function(n, k, stayScore, travelScore) {
              var dp = new Array(n).fill(0);
              for (var day = 0; day < k; day++) {
                  var nd = new Array(n).fill(0);
                  for (var c = 0; c < n; c++) {
                      var best = dp[c] + stayScore[day][c];
                      for (var p = 0; p < n; p++) {
                          if (p !== c && dp[p] + travelScore[p][c] > best) best = dp[p] + travelScore[p][c];
                      }
                      nd[c] = best;
                  }
                  dp = nd;
              }
              var ans = 0;
              for (var i = 0; i < n; i++) if (dp[i] > ans) ans = dp[i];
              return ans;
          };
        `,
        typescript: code`
          function maxScore(n: number, k: number, stayScore: number[][], travelScore: number[][]): number {
              var dp: number[] = [];
              for (var z = 0; z < n; z++) dp.push(0);
              for (var day = 0; day < k; day++) {
                  var nd: number[] = [];
                  for (var c = 0; c < n; c++) {
                      var best = dp[c] + stayScore[day][c];
                      for (var p = 0; p < n; p++) {
                          if (p !== c && dp[p] + travelScore[p][c] > best) best = dp[p] + travelScore[p][c];
                      }
                      nd.push(best);
                  }
                  dp = nd;
              }
              var ans = 0;
              for (var i = 0; i < n; i++) if (dp[i] > ans) ans = dp[i];
              return ans;
          }
        `,
        java: code`
          public static int maxScore(int n, int k, int[][] stayScore, int[][] travelScore) {
              int[] dp = new int[n];
              for (int day = 0; day < k; day++) {
                  int[] nd = new int[n];
                  for (int c = 0; c < n; c++) {
                      int best = dp[c] + stayScore[day][c];
                      for (int p = 0; p < n; p++) {
                          if (p != c) best = Math.max(best, dp[p] + travelScore[p][c]);
                      }
                      nd[c] = best;
                  }
                  dp = nd;
              }
              int ans = 0;
              for (int v : dp) ans = Math.max(ans, v);
              return ans;
          }
        `,
        cpp: code`
          int maxScore(int n, int k, vector<vector<int>>& stayScore, vector<vector<int>>& travelScore) {
              vector<int> dp(n, 0);
              for (int day = 0; day < k; day++) {
                  vector<int> nd(n, 0);
                  for (int c = 0; c < n; c++) {
                      int best = dp[c] + stayScore[day][c];
                      for (int p = 0; p < n; p++) {
                          if (p != c) best = max(best, dp[p] + travelScore[p][c]);
                      }
                      nd[c] = best;
                  }
                  dp = nd;
              }
              return *max_element(dp.begin(), dp.end());
          }
        `,
        c: code`
          int maxScore(int n, int k, int** stayScore, int stayScoreSize, int* stayScoreColSize, int** travelScore, int travelScoreSize, int* travelScoreColSize) {
              int* dp = (int*) calloc((size_t) n, sizeof(int));
              int* nd = (int*) calloc((size_t) n, sizeof(int));
              for (int day = 0; day < k; day++) {
                  for (int c = 0; c < n; c++) {
                      int best = dp[c] + stayScore[day][c];
                      for (int p = 0; p < n; p++) {
                          if (p != c && dp[p] + travelScore[p][c] > best) best = dp[p] + travelScore[p][c];
                      }
                      nd[c] = best;
                  }
                  int* t = dp; dp = nd; nd = t;
              }
              int ans = 0;
              for (int c = 0; c < n; c++) if (dp[c] > ans) ans = dp[c];
              free(dp);
              free(nd);
              return ans;
          }
        `,
        csharp: code`
          public static int MaxScore(int n, int k, int[][] stayScore, int[][] travelScore)
          {
              int[] dp = new int[n];
              for (int day = 0; day < k; day++)
              {
                  int[] nd = new int[n];
                  for (int c = 0; c < n; c++)
                  {
                      int best = dp[c] + stayScore[day][c];
                      for (int p = 0; p < n; p++)
                      {
                          if (p != c) best = Math.Max(best, dp[p] + travelScore[p][c]);
                      }
                      nd[c] = best;
                  }
                  dp = nd;
              }
              int ans = 0;
              foreach (int v in dp) ans = Math.Max(ans, v);
              return ans;
          }
        `,
        go: code`
          func maxScore(n int, k int, stayScore [][]int, travelScore [][]int) int {
              dp := make([]int, n)
              for day := 0; day < k; day++ {
                  nd := make([]int, n)
                  for c := 0; c < n; c++ {
                      best := dp[c] + stayScore[day][c]
                      for p := 0; p < n; p++ {
                          if p != c && dp[p]+travelScore[p][c] > best {
                              best = dp[p] + travelScore[p][c]
                          }
                      }
                      nd[c] = best
                  }
                  dp = nd
              }
              ans := 0
              for _, v := range dp {
                  if v > ans {
                      ans = v
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maxScore(n: Int, k: Int, stayScore: Array<IntArray>, travelScore: Array<IntArray>): Int {
              var dp = IntArray(n)
              for (day in 0 until k) {
                  val nd = IntArray(n)
                  for (c in 0 until n) {
                      var best = dp[c] + stayScore[day][c]
                      for (p in 0 until n) {
                          if (p != c) best = maxOf(best, dp[p] + travelScore[p][c])
                      }
                      nd[c] = best
                  }
                  dp = nd
              }
              var ans = 0
              for (v in dp) ans = maxOf(ans, v)
              return ans
          }
        `,
        swift: code`
          func maxScore(_ n: Int, _ k: Int, _ stayScore: [[Int]], _ travelScore: [[Int]]) -> Int {
              var dp = [Int](repeating: 0, count: n)
              for day in 0..<k {
                  var nd = [Int](repeating: 0, count: n)
                  for c in 0..<n {
                      var best = dp[c] + stayScore[day][c]
                      for p in 0..<n where p != c {
                          best = max(best, dp[p] + travelScore[p][c])
                      }
                      nd[c] = best
                  }
                  dp = nd
              }
              var ans = 0
              for v in dp { ans = max(ans, v) }
              return ans
          }
        `,
        rust: code`
          fn maxScore(n: i32, k: i32, stay_score: Vec<Vec<i32>>, travel_score: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut dp = vec![0i32; n];
              for day in 0..k as usize {
                  let mut nd = vec![0i32; n];
                  for c in 0..n {
                      let mut best = dp[c] + stay_score[day][c];
                      for p in 0..n {
                          if p != c {
                              best = best.max(dp[p] + travel_score[p][c]);
                          }
                      }
                      nd[c] = best;
                  }
                  dp = nd;
              }
              *dp.iter().max().unwrap()
          }
        `,
        php: code`
          function maxScore($n, $k, $stayScore, $travelScore) {
              $dp = array_fill(0, $n, 0);
              for ($day = 0; $day < $k; $day++) {
                  $nd = array_fill(0, $n, 0);
                  for ($c = 0; $c < $n; $c++) {
                      $best = $dp[$c] + $stayScore[$day][$c];
                      for ($p = 0; $p < $n; $p++) {
                          if ($p != $c && $dp[$p] + $travelScore[$p][$c] > $best) $best = $dp[$p] + $travelScore[$p][$c];
                      }
                      $nd[$c] = $best;
                  }
                  $dp = $nd;
              }
              return max($dp);
          }
        `,
        ruby: code`
          def maxScore(n, k, stayScore, travelScore)
            dp = Array.new(n, 0)
            k.times do |day|
              nd = Array.new(n, 0)
              n.times do |c|
                best = dp[c] + stayScore[day][c]
                n.times do |p|
                  next if p == c
                  v = dp[p] + travelScore[p][c]
                  best = v if v > best
                end
                nd[c] = best
              end
              dp = nd
            end
            dp.max
          end
        `,
      },
    };
  })(),

  // ── Find the Original Typed String II (LC 3333) ───────────────────
  (() => {
    const MOD = 1000000007;
    const runs = (w: string) => {
      const g: number[] = [];
      for (let i = 0; i < w.length;) {
        let j = i;
        while (j < w.length && w[j] === w[i]) j++;
        g.push(j - i);
        i = j;
      }
      return g;
    };
    const ref = (word: string, k: number) => {
      // Enumerate the kept length of every run (1..run) and count totals >= k.
      const g = runs(word);
      let count = 0;
      const go = (i: number, len: number) => {
        if (i === g.length) { if (len >= k) count++; return; }
        for (let l = 1; l <= g[i]; l++) go(i + 1, len + l);
      };
      go(0, 0);
      return count % MOD;
    };
    return {
      slug: "find-the-original-typed-string-ii",
      title: "Find the Original Typed String II",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Prefix Sum", "Google"],
      signature: { funcName: "possibleStringCount", params: [{ name: "word", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Alice tried to type a string on her keyboard, but she may have held some keys down too long, so a character could appear **one or more** times in a row where she meant to type it once.\n\nYou are given `word`, what appeared on the screen, and a positive integer `k`. It is known that the string Alice **intended** to type had length **at least** `k`.\n\nReturn the number of different strings Alice might have intended. Since the answer may be very large, return it **modulo** `10^9 + 7`.",
        [
          { in: "word = \"aabbccdd\", k = 7", out: "5", note: "\"aabbccdd\", \"aabbccd\", \"aabbcdd\", \"aabccdd\" and \"abbccdd\"." },
          { in: "word = \"aabbccdd\", k = 8", out: "1", note: "Only the screen text itself is long enough." },
          { in: "word = \"aaabbb\", k = 3", out: "8", note: "Each of the two runs keeps 1, 2 or 3 characters (9 ways); only \"ab\" is shorter than 3." },
        ],
        ["1 <= word.length <= 5 * 10^5", "word consists only of lowercase English letters", "1 <= k <= 2000"]),
      hints: [
        "Split `word` into runs of equal characters. An intended string keeps between 1 and `len` characters of every run, independently.",
        "The total number of candidates is the product of the run lengths. It is easier to subtract the candidates that are too short (total length `< k`).",
        "If there are at least `k` runs, nothing is too short. Otherwise count the ways to reach each total `s < k` with a DP over runs, where each run adds 1..`len` — a sliding-window sum over the previous row.",
      ],
      editorial: explain({
        idea: "Every run of equal characters on the screen came from one intended character typed one or more times, so a candidate is a choice of kept length `1..len` for each run. Count all choices (a product) and subtract the ones whose total length is below `k`, which only involve sums below 2000.",
        steps: [
          "Compute the run lengths `g_1, ..., g_m` and `total = Π g_i mod 10^9 + 7`.",
          "If `m >= k`, every candidate has length at least `m >= k`: return `total`.",
          "Otherwise let `dp[s]` (for `s < k`) be the number of ways the runs processed so far keep exactly `s` characters; start with `dp[0] = 1`.",
          "For each run `g`, `new[s] = dp[s - 1] + dp[s - 2] + ... + dp[s - g]` (indices `>= 0`), computed with prefix sums.",
          "Return `(total - Σ dp[s]) mod 10^9 + 7`, adding the modulus back if the difference is negative.",
        ],
        why: "Different choices of kept lengths give different strings (the run structure of the intended string is the same as the screen's), so counting choices counts strings. Only totals below `k` must be excluded, and those are bounded by `k`, so the DP never needs more than `k` states per run.",
        time: "O(n + m · k)",
        space: "O(k)",
        pitfalls: [
          "Without the `m >= k` shortcut the DP is `O(m · k)` for up to `5 · 10^5` runs — the shortcut caps `m` below `k`.",
          "The subtraction is modular: take `(total - bad + MOD) % MOD`.",
          "`k` may exceed the length of `word`, in which case the answer is 0.",
        ],
      }),
      examples: [
        { input: "\"aabbccdd\"\n7", expectedOutput: "5" },
        { input: "\"aabbccdd\"\n8", expectedOutput: "1" },
        { input: "\"aaabbb\"\n3", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const target = ri(rng, 1, pick(rng, [1, 6, 14, 20]));
        const runMax = pick(rng, [1, 2, 3, 5]);
        let word = "";
        let last = "";
        while (word.length < target) {
          let ch = pick(rng, ["a", "b", "c"]);
          while (ch === last) ch = pick(rng, ["a", "b", "c"]);
          const len = Math.min(ri(rng, 1, runMax), target - word.length);
          word += ch.repeat(len);
          last = ch;
        }
        const k = ri(rng, 1, word.length + 2);
        return { input: `"${word}"\n${k}`, expectedOutput: String(ref(word, k)) };
      },
      solutions: {
        python: code`
          def possibleStringCount(word: str, k: int) -> int:
              MOD = 10**9 + 7
              groups = []
              i = 0
              while i < len(word):
                  j = i
                  while j < len(word) and word[j] == word[i]:
                      j += 1
                  groups.append(j - i)
                  i = j
              total = 1
              for g in groups:
                  total = total * g % MOD
              if len(groups) >= k:
                  return total
              dp = [0] * k
              dp[0] = 1
              for g in groups:
                  pre = [0] * (k + 1)
                  for s in range(k):
                      pre[s + 1] = (pre[s] + dp[s]) % MOD
                  nd = [0] * k
                  for s in range(k):
                      nd[s] = (pre[s] - pre[max(0, s - g)]) % MOD
                  dp = nd
              return (total - sum(dp)) % MOD
        `,
        javascript: code`
          var possibleStringCount = function(word, k) {
              var MOD = 1000000007;
              var groups = [];
              for (var i = 0; i < word.length;) {
                  var j = i;
                  while (j < word.length && word.charAt(j) === word.charAt(i)) j++;
                  groups.push(j - i);
                  i = j;
              }
              var total = 1;
              for (var a = 0; a < groups.length; a++) total = (total * groups[a]) % MOD;
              if (groups.length >= k) return total;
              var dp = new Array(k).fill(0);
              dp[0] = 1;
              for (var b = 0; b < groups.length; b++) {
                  var g = groups[b];
                  var pre = new Array(k + 1).fill(0);
                  for (var s = 0; s < k; s++) pre[s + 1] = (pre[s] + dp[s]) % MOD;
                  var nd = new Array(k).fill(0);
                  for (var t = 0; t < k; t++) nd[t] = (pre[t] - pre[Math.max(0, t - g)] + MOD) % MOD;
                  dp = nd;
              }
              var bad = 0;
              for (var u = 0; u < k; u++) bad = (bad + dp[u]) % MOD;
              return (total - bad + MOD) % MOD;
          };
        `,
        typescript: code`
          function possibleStringCount(word: string, k: number): number {
              var MOD = 1000000007;
              var groups: number[] = [];
              for (var i = 0; i < word.length;) {
                  var j = i;
                  while (j < word.length && word.charAt(j) === word.charAt(i)) j++;
                  groups.push(j - i);
                  i = j;
              }
              var total = 1;
              for (var a = 0; a < groups.length; a++) total = (total * groups[a]) % MOD;
              if (groups.length >= k) return total;
              var dp: number[] = [];
              for (var z = 0; z < k; z++) dp.push(0);
              dp[0] = 1;
              for (var b = 0; b < groups.length; b++) {
                  var g = groups[b];
                  var pre: number[] = [0];
                  for (var s = 0; s < k; s++) pre.push((pre[s] + dp[s]) % MOD);
                  var nd: number[] = [];
                  for (var t = 0; t < k; t++) nd.push((pre[t] - pre[Math.max(0, t - g)] + MOD) % MOD);
                  dp = nd;
              }
              var bad = 0;
              for (var u = 0; u < k; u++) bad = (bad + dp[u]) % MOD;
              return (total - bad + MOD) % MOD;
          }
        `,
        java: code`
          public static int possibleStringCount(String word, int k) {
              final long MOD = 1000000007L;
              List<Integer> groups = new ArrayList<>();
              for (int i = 0; i < word.length();) {
                  int j = i;
                  while (j < word.length() && word.charAt(j) == word.charAt(i)) j++;
                  groups.add(j - i);
                  i = j;
              }
              long total = 1;
              for (int g : groups) total = total * g % MOD;
              if (groups.size() >= k) return (int) total;
              long[] dp = new long[k];
              dp[0] = 1;
              for (int g : groups) {
                  long[] pre = new long[k + 1];
                  for (int s = 0; s < k; s++) pre[s + 1] = (pre[s] + dp[s]) % MOD;
                  long[] nd = new long[k];
                  for (int s = 0; s < k; s++) nd[s] = (pre[s] - pre[Math.max(0, s - g)] + MOD) % MOD;
                  dp = nd;
              }
              long bad = 0;
              for (long x : dp) bad = (bad + x) % MOD;
              return (int) ((total - bad + MOD) % MOD);
          }
        `,
        cpp: code`
          int possibleStringCount(string word, int k) {
              const long long MOD = 1000000007LL;
              vector<int> groups;
              for (size_t i = 0; i < word.size();) {
                  size_t j = i;
                  while (j < word.size() && word[j] == word[i]) j++;
                  groups.push_back((int) (j - i));
                  i = j;
              }
              long long total = 1;
              for (int g : groups) total = total * g % MOD;
              if ((int) groups.size() >= k) return (int) total;
              vector<long long> dp(k, 0);
              dp[0] = 1;
              for (int g : groups) {
                  vector<long long> pre(k + 1, 0);
                  for (int s = 0; s < k; s++) pre[s + 1] = (pre[s] + dp[s]) % MOD;
                  vector<long long> nd(k, 0);
                  for (int s = 0; s < k; s++) nd[s] = (pre[s] - pre[max(0, s - g)] + MOD) % MOD;
                  dp = nd;
              }
              long long bad = 0;
              for (long long x : dp) bad = (bad + x) % MOD;
              return (int) ((total - bad + MOD) % MOD);
          }
        `,
        c: code`
          int possibleStringCount(const char* word, int k) {
              const long long MOD = 1000000007LL;
              int n = (int) strlen(word);
              int* groups = (int*) malloc(sizeof(int) * (n + 1));
              int m = 0;
              for (int i = 0; i < n;) {
                  int j = i;
                  while (j < n && word[j] == word[i]) j++;
                  groups[m++] = j - i;
                  i = j;
              }
              long long total = 1;
              for (int a = 0; a < m; a++) total = total * groups[a] % MOD;
              if (m >= k) { free(groups); return (int) total; }
              long long* dp = (long long*) calloc((size_t) k, sizeof(long long));
              long long* nd = (long long*) calloc((size_t) k, sizeof(long long));
              long long* pre = (long long*) calloc((size_t) k + 1, sizeof(long long));
              dp[0] = 1;
              for (int a = 0; a < m; a++) {
                  int g = groups[a];
                  for (int s = 0; s < k; s++) pre[s + 1] = (pre[s] + dp[s]) % MOD;
                  for (int s = 0; s < k; s++) {
                      int lo = s - g < 0 ? 0 : s - g;
                      nd[s] = (pre[s] - pre[lo] + MOD) % MOD;
                  }
                  long long* t = dp; dp = nd; nd = t;
              }
              long long bad = 0;
              for (int s = 0; s < k; s++) bad = (bad + dp[s]) % MOD;
              free(groups);
              free(dp);
              free(nd);
              free(pre);
              return (int) ((total - bad + MOD) % MOD);
          }
        `,
        csharp: code`
          public static int PossibleStringCount(string word, int k)
          {
              const long MOD = 1000000007L;
              var groups = new List<int>();
              for (int i = 0; i < word.Length;)
              {
                  int j = i;
                  while (j < word.Length && word[j] == word[i]) j++;
                  groups.Add(j - i);
                  i = j;
              }
              long total = 1;
              foreach (int g in groups) total = total * g % MOD;
              if (groups.Count >= k) return (int) total;
              long[] dp = new long[k];
              dp[0] = 1;
              foreach (int g in groups)
              {
                  long[] pre = new long[k + 1];
                  for (int s = 0; s < k; s++) pre[s + 1] = (pre[s] + dp[s]) % MOD;
                  long[] nd = new long[k];
                  for (int s = 0; s < k; s++) nd[s] = (pre[s] - pre[Math.Max(0, s - g)] + MOD) % MOD;
                  dp = nd;
              }
              long bad = 0;
              foreach (long x in dp) bad = (bad + x) % MOD;
              return (int) ((total - bad + MOD) % MOD);
          }
        `,
        go: code`
          func possibleStringCount(word string, k int) int {
              const mod = 1000000007
              groups := []int{}
              for i := 0; i < len(word); {
                  j := i
                  for j < len(word) && word[j] == word[i] {
                      j++
                  }
                  groups = append(groups, j-i)
                  i = j
              }
              total := 1
              for _, g := range groups {
                  total = total * g % mod
              }
              if len(groups) >= k {
                  return total
              }
              dp := make([]int, k)
              dp[0] = 1
              for _, g := range groups {
                  pre := make([]int, k+1)
                  for s := 0; s < k; s++ {
                      pre[s+1] = (pre[s] + dp[s]) % mod
                  }
                  nd := make([]int, k)
                  for s := 0; s < k; s++ {
                      lo := s - g
                      if lo < 0 {
                          lo = 0
                      }
                      nd[s] = (pre[s] - pre[lo] + mod) % mod
                  }
                  dp = nd
              }
              bad := 0
              for _, x := range dp {
                  bad = (bad + x) % mod
              }
              return (total - bad + mod) % mod
          }
        `,
        kotlin: code`
          fun possibleStringCount(word: String, k: Int): Int {
              val modulus = 1000000007L
              val groups = ArrayList<Int>()
              var i = 0
              while (i < word.length) {
                  var j = i
                  while (j < word.length && word[j] == word[i]) j++
                  groups.add(j - i)
                  i = j
              }
              var total = 1L
              for (g in groups) total = total * g % modulus
              if (groups.size >= k) return total.toInt()
              var dp = LongArray(k)
              dp[0] = 1L
              for (g in groups) {
                  val pre = LongArray(k + 1)
                  for (s in 0 until k) pre[s + 1] = (pre[s] + dp[s]) % modulus
                  val nd = LongArray(k)
                  for (s in 0 until k) nd[s] = (pre[s] - pre[maxOf(0, s - g)] + modulus) % modulus
                  dp = nd
              }
              var bad = 0L
              for (x in dp) bad = (bad + x) % modulus
              return ((total - bad + modulus) % modulus).toInt()
          }
        `,
        swift: code`
          func possibleStringCount(_ word: String, _ k: Int) -> Int {
              let modulus = 1000000007
              let w = Array(word)
              var groups = [Int]()
              var i = 0
              while i < w.count {
                  var j = i
                  while j < w.count && w[j] == w[i] { j += 1 }
                  groups.append(j - i)
                  i = j
              }
              var total = 1
              for g in groups { total = total * g % modulus }
              if groups.count >= k { return total }
              var dp = [Int](repeating: 0, count: k)
              dp[0] = 1
              for g in groups {
                  var pre = [Int](repeating: 0, count: k + 1)
                  for s in 0..<k { pre[s + 1] = (pre[s] + dp[s]) % modulus }
                  var nd = [Int](repeating: 0, count: k)
                  for s in 0..<k { nd[s] = (pre[s] - pre[max(0, s - g)] + modulus) % modulus }
                  dp = nd
              }
              var bad = 0
              for x in dp { bad = (bad + x) % modulus }
              return (total - bad + modulus) % modulus
          }
        `,
        rust: code`
          fn possibleStringCount(word: String, k: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let w = word.as_bytes();
              let mut groups: Vec<usize> = Vec::new();
              let mut i = 0;
              while i < w.len() {
                  let mut j = i;
                  while j < w.len() && w[j] == w[i] {
                      j += 1;
                  }
                  groups.push(j - i);
                  i = j;
              }
              let k = k as usize;
              let mut total = 1i64;
              for &g in &groups {
                  total = total * g as i64 % modulus;
              }
              if groups.len() >= k {
                  return total as i32;
              }
              let mut dp = vec![0i64; k];
              dp[0] = 1;
              for &g in &groups {
                  let mut pre = vec![0i64; k + 1];
                  for s in 0..k {
                      pre[s + 1] = (pre[s] + dp[s]) % modulus;
                  }
                  let mut nd = vec![0i64; k];
                  for s in 0..k {
                      let lo = if s < g { 0 } else { s - g };
                      nd[s] = (pre[s] - pre[lo] + modulus) % modulus;
                  }
                  dp = nd;
              }
              let mut bad = 0i64;
              for x in dp {
                  bad = (bad + x) % modulus;
              }
              ((total - bad + modulus) % modulus) as i32
          }
        `,
        php: code`
          function possibleStringCount($word, $k) {
              $MOD = 1000000007;
              $n = strlen($word);
              $groups = [];
              for ($i = 0; $i < $n;) {
                  $j = $i;
                  while ($j < $n && $word[$j] === $word[$i]) $j++;
                  $groups[] = $j - $i;
                  $i = $j;
              }
              $total = 1;
              foreach ($groups as $g) $total = $total * $g % $MOD;
              if (count($groups) >= $k) return $total;
              $dp = array_fill(0, $k, 0);
              $dp[0] = 1;
              foreach ($groups as $g) {
                  $pre = array_fill(0, $k + 1, 0);
                  for ($s = 0; $s < $k; $s++) $pre[$s + 1] = ($pre[$s] + $dp[$s]) % $MOD;
                  $nd = array_fill(0, $k, 0);
                  for ($s = 0; $s < $k; $s++) $nd[$s] = ($pre[$s] - $pre[max(0, $s - $g)] + $MOD) % $MOD;
                  $dp = $nd;
              }
              $bad = 0;
              foreach ($dp as $x) $bad = ($bad + $x) % $MOD;
              return ($total - $bad + $MOD) % $MOD;
          }
        `,
        ruby: code`
          def possibleStringCount(word, k)
            mod = 1_000_000_007
            groups = []
            i = 0
            while i < word.length
              j = i
              j += 1 while j < word.length && word[j] == word[i]
              groups << j - i
              i = j
            end
            total = 1
            groups.each { |g| total = total * g % mod }
            return total if groups.length >= k
            dp = Array.new(k, 0)
            dp[0] = 1
            groups.each do |g|
              pre = Array.new(k + 1, 0)
              k.times { |s| pre[s + 1] = (pre[s] + dp[s]) % mod }
              dp = Array.new(k) { |s| (pre[s] - pre[[0, s - g].max]) % mod }
            end
            (total - dp.sum) % mod
          end
        `,
      },
    };
  })(),

  // ── Total Characters in String After Transformations I (LC 3335) ──
  (() => {
    const MOD = 1000000007;
    const ref = (s: string, t: number) => {
      // Count of each letter, advanced one transformation at a time.
      let cnt = new Array(26).fill(0);
      for (const ch of s) cnt[ch.charCodeAt(0) - 97]++;
      for (let step = 0; step < t; step++) {
        const nx = new Array(26).fill(0);
        for (let c = 0; c < 25; c++) nx[c + 1] = (nx[c + 1] + cnt[c]) % MOD;
        nx[0] = (nx[0] + cnt[25]) % MOD; // 'z' becomes "ab"
        nx[1] = (nx[1] + cnt[25]) % MOD;
        cnt = nx;
      }
      return cnt.reduce((a, b) => (a + b) % MOD, 0);
    };
    return {
      slug: "total-characters-in-string-after-transformations-i",
      title: "Total Characters in String After Transformations I",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "String", "Dynamic Programming", "Counting", "Amazon", "Google"],
      signature: { funcName: "lengthAfterTransformations", params: [{ name: "s", type: "string" as const }, { name: "t", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of lowercase letters and an integer `t`, the number of **transformations** to perform.\n\nIn one transformation, every character of `s` is replaced at the same time:\n\n- `'z'` becomes the two-character string `\"ab\"`;\n- every other character becomes the next letter of the alphabet (`'a'` becomes `'b'`, `'b'` becomes `'c'`, and so on).\n\nReturn the **length** of the string after exactly `t` transformations. Since it may be very large, return it **modulo** `10^9 + 7`.",
        [
          { in: "s = \"abcyy\", t = 2", out: "7", note: "After one step: \"bcdzz\". After two: \"cdeabab\", which has 7 characters." },
          { in: "s = \"azbk\", t = 1", out: "5", note: "One step gives \"babcl\"." },
          { in: "s = \"a\", t = 26", out: "2", note: "Twenty-five steps take 'a' to 'z'; the 26th turns it into \"ab\"." },
        ],
        ["1 <= s.length <= 10^5", "s consists only of lowercase English letters", "1 <= t <= 10^5"]),
      hints: [
        "The order of the characters never matters for the length — only how many of each letter there are.",
        "Keep a count for each of the 26 letters. One transformation shifts every count one letter up; the count of `'z'` moves to both `'a'` and `'b'`.",
        "Apply that shift `t` times, keeping every count modulo `10^9 + 7`, and add the counts up at the end.",
      ],
      editorial: explain({
        idea: "Characters transform independently, so the string can be replaced by a histogram of 26 counts. A transformation is a fixed linear map on that histogram: each letter's count moves to the next letter, and `'z'`'s count is added to both `'a'` and `'b'`.",
        steps: [
          "Count the occurrences of each letter in `s`.",
          "Repeat `t` times: `new[0] = cnt[25]`, `new[1] = cnt[0] + cnt[25]`, and `new[c] = cnt[c - 1]` for `c >= 2`, all modulo `10^9 + 7`.",
          "Return the sum of the counts modulo `10^9 + 7`.",
        ],
        why: "A character's descendants after any number of steps depend only on the character itself, never on its neighbours, so grouping equal letters loses nothing. The map above is exactly one step applied to every group at once.",
        time: "O(|s| + 26 · t)",
        space: "O(26)",
        pitfalls: [
          "Build the new counts from the old ones (or rotate carefully) — updating in place would move a count twice in one step.",
          "The length grows exponentially (roughly doubling every 26 steps), so reduce modulo `10^9 + 7` at every step.",
        ],
      }),
      examples: [
        { input: "\"abcyy\"\n2", expectedOutput: "7" },
        { input: "\"azbk\"\n1", expectedOutput: "5" },
        { input: "\"a\"\n26", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, pick(rng, [1, 5, 20, 40]), pick(rng, ["abcdefghijklmnopqrstuvwxyz", "xyz", "z", "a"]));
        const t = ri(rng, 1, pick(rng, [2, 26, 60, 150, 250]));
        return { input: `"${s}"\n${t}`, expectedOutput: String(ref(s, t)) };
      },
      solutions: {
        python: code`
          def lengthAfterTransformations(s: str, t: int) -> int:
              MOD = 10**9 + 7
              cnt = [0] * 26
              for ch in s:
                  cnt[ord(ch) - 97] += 1
              for _ in range(t):
                  z = cnt[25]
                  cnt = [z] + cnt[:25]
                  cnt[1] = (cnt[1] + z) % MOD
              return sum(cnt) % MOD
        `,
        javascript: code`
          var lengthAfterTransformations = function(s, t) {
              var MOD = 1000000007;
              var cnt = new Array(26).fill(0);
              for (var i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
              for (var step = 0; step < t; step++) {
                  var z = cnt[25];
                  for (var c = 25; c >= 1; c--) cnt[c] = cnt[c - 1];
                  cnt[0] = z;
                  cnt[1] = (cnt[1] + z) % MOD;
              }
              var total = 0;
              for (var j = 0; j < 26; j++) total = (total + cnt[j]) % MOD;
              return total;
          };
        `,
        typescript: code`
          function lengthAfterTransformations(s: string, t: number): number {
              var MOD = 1000000007;
              var cnt: number[] = [];
              for (var q = 0; q < 26; q++) cnt.push(0);
              for (var i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
              for (var step = 0; step < t; step++) {
                  var z = cnt[25];
                  for (var c = 25; c >= 1; c--) cnt[c] = cnt[c - 1];
                  cnt[0] = z;
                  cnt[1] = (cnt[1] + z) % MOD;
              }
              var total = 0;
              for (var j = 0; j < 26; j++) total = (total + cnt[j]) % MOD;
              return total;
          }
        `,
        java: code`
          public static int lengthAfterTransformations(String s, int t) {
              final long MOD = 1000000007L;
              long[] cnt = new long[26];
              for (int i = 0; i < s.length(); i++) cnt[s.charAt(i) - 'a']++;
              for (int step = 0; step < t; step++) {
                  long z = cnt[25];
                  for (int c = 25; c >= 1; c--) cnt[c] = cnt[c - 1];
                  cnt[0] = z;
                  cnt[1] = (cnt[1] + z) % MOD;
              }
              long total = 0;
              for (long x : cnt) total = (total + x) % MOD;
              return (int) total;
          }
        `,
        cpp: code`
          int lengthAfterTransformations(string s, int t) {
              const long long MOD = 1000000007LL;
              long long cnt[26] = {0};
              for (char ch : s) cnt[ch - 'a']++;
              for (int step = 0; step < t; step++) {
                  long long z = cnt[25];
                  for (int c = 25; c >= 1; c--) cnt[c] = cnt[c - 1];
                  cnt[0] = z;
                  cnt[1] = (cnt[1] + z) % MOD;
              }
              long long total = 0;
              for (int c = 0; c < 26; c++) total = (total + cnt[c]) % MOD;
              return (int) total;
          }
        `,
        c: code`
          int lengthAfterTransformations(const char* s, int t) {
              const long long MOD = 1000000007LL;
              long long cnt[26];
              for (int c = 0; c < 26; c++) cnt[c] = 0;
              for (int i = 0; s[i]; i++) cnt[s[i] - 'a']++;
              for (int step = 0; step < t; step++) {
                  long long z = cnt[25];
                  for (int c = 25; c >= 1; c--) cnt[c] = cnt[c - 1];
                  cnt[0] = z;
                  cnt[1] = (cnt[1] + z) % MOD;
              }
              long long total = 0;
              for (int c = 0; c < 26; c++) total = (total + cnt[c]) % MOD;
              return (int) total;
          }
        `,
        csharp: code`
          public static int LengthAfterTransformations(string s, int t)
          {
              const long MOD = 1000000007L;
              long[] cnt = new long[26];
              foreach (char ch in s) cnt[ch - 'a']++;
              for (int step = 0; step < t; step++)
              {
                  long z = cnt[25];
                  for (int c = 25; c >= 1; c--) cnt[c] = cnt[c - 1];
                  cnt[0] = z;
                  cnt[1] = (cnt[1] + z) % MOD;
              }
              long total = 0;
              foreach (long x in cnt) total = (total + x) % MOD;
              return (int) total;
          }
        `,
        go: code`
          func lengthAfterTransformations(s string, t int) int {
              const mod = 1000000007
              cnt := make([]int, 26)
              for i := 0; i < len(s); i++ {
                  cnt[s[i]-'a']++
              }
              for step := 0; step < t; step++ {
                  z := cnt[25]
                  for c := 25; c >= 1; c-- {
                      cnt[c] = cnt[c-1]
                  }
                  cnt[0] = z
                  cnt[1] = (cnt[1] + z) % mod
              }
              total := 0
              for _, x := range cnt {
                  total = (total + x) % mod
              }
              return total
          }
        `,
        kotlin: code`
          fun lengthAfterTransformations(s: String, t: Int): Int {
              val modulus = 1000000007L
              val cnt = LongArray(26)
              for (ch in s) cnt[ch - 'a']++
              repeat(t) {
                  val z = cnt[25]
                  for (c in 25 downTo 1) cnt[c] = cnt[c - 1]
                  cnt[0] = z
                  cnt[1] = (cnt[1] + z) % modulus
              }
              var total = 0L
              for (x in cnt) total = (total + x) % modulus
              return total.toInt()
          }
        `,
        swift: code`
          func lengthAfterTransformations(_ s: String, _ t: Int) -> Int {
              let modulus = 1000000007
              var cnt = [Int](repeating: 0, count: 26)
              for b in s.utf8 { cnt[Int(b) - 97] += 1 }
              for _ in 0..<t {
                  let z = cnt[25]
                  var c = 25
                  while c >= 1 { cnt[c] = cnt[c - 1]; c -= 1 }
                  cnt[0] = z
                  cnt[1] = (cnt[1] + z) % modulus
              }
              var total = 0
              for x in cnt { total = (total + x) % modulus }
              return total
          }
        `,
        rust: code`
          fn lengthAfterTransformations(s: String, t: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let mut cnt = [0i64; 26];
              for b in s.bytes() {
                  cnt[(b - b'a') as usize] += 1;
              }
              for _ in 0..t {
                  let z = cnt[25];
                  for c in (1..26).rev() {
                      cnt[c] = cnt[c - 1];
                  }
                  cnt[0] = z;
                  cnt[1] = (cnt[1] + z) % modulus;
              }
              let mut total = 0i64;
              for x in cnt.iter() {
                  total = (total + x) % modulus;
              }
              total as i32
          }
        `,
        php: code`
          function lengthAfterTransformations($s, $t) {
              $MOD = 1000000007;
              $cnt = array_fill(0, 26, 0);
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) $cnt[ord($s[$i]) - 97]++;
              for ($step = 0; $step < $t; $step++) {
                  $z = $cnt[25];
                  for ($c = 25; $c >= 1; $c--) $cnt[$c] = $cnt[$c - 1];
                  $cnt[0] = $z;
                  $cnt[1] = ($cnt[1] + $z) % $MOD;
              }
              $total = 0;
              foreach ($cnt as $x) $total = ($total + $x) % $MOD;
              return $total;
          }
        `,
        ruby: code`
          def lengthAfterTransformations(s, t)
            mod = 1_000_000_007
            cnt = Array.new(26, 0)
            s.each_byte { |b| cnt[b - 97] += 1 }
            t.times do
              z = cnt[25]
              cnt = [z] + cnt[0, 25]
              cnt[1] = (cnt[1] + z) % mod
            end
            cnt.sum % mod
          end
        `,
      },
    };
  })(),

  // ── Find the Number of Subsequences With Equal GCD (LC 3336) ──────
  (() => {
    const MOD = 1000000007;
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (nums: number[]) => {
      // Every element goes to seq1, seq2 or neither: 3^n assignments.
      const n = nums.length;
      let count = 0;
      const go = (i: number, g1: number, g2: number) => {
        if (i === n) { if (g1 > 0 && g1 === g2) count++; return; }
        go(i + 1, g1, g2);
        go(i + 1, gcd(g1, nums[i]), g2);
        go(i + 1, g1, gcd(g2, nums[i]));
      };
      go(0, 0, 0);
      return count % MOD;
    };
    return {
      slug: "find-the-number-of-subsequences-with-equal-gcd",
      title: "Find the Number of Subsequences With Equal GCD",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Number Theory", "Google"],
      signature: { funcName: "subsequencePairCount", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`.\n\nCount the pairs of **non-empty** subsequences `(seq1, seq2)` of `nums` such that:\n\n- `seq1` and `seq2` are **disjoint** — no index of `nums` is used by both, and\n- the GCD of the elements of `seq1` equals the GCD of the elements of `seq2`.\n\nThe pairs are ordered: `(seq1, seq2)` and `(seq2, seq1)` count separately when they are different. Return the count **modulo** `10^9 + 7`.",
        [
          { in: "nums = [1,2,3,4]", out: "10", note: "Every pair of disjoint subsequences with GCD 1 on both sides, e.g. ([1], [3]) or ([2,3], [1,4])." },
          { in: "nums = [10,20,30]", out: "2", note: "([10], [20,30]) and ([20,30], [10]) — both sides have GCD 10." },
          { in: "nums = [1,1,1,1]", out: "50" },
        ],
        ["1 <= nums.length <= 200", "1 <= nums[i] <= 200"]),
      hints: [
        "Each index has three fates: it joins `seq1`, joins `seq2`, or is left out. Brute force over all `3^n` choices is far too slow — what do you actually need to remember?",
        "Only the running GCD of each side matters. With values up to 200 there are at most 201 × 201 states (use 0 for an empty side, since `gcd(0, x) = x`).",
        "`dp[g1][g2]` counts assignments of the prefix with those GCDs. For each new `x`, add each state's count to itself, to `(gcd(g1, x), g2)` and to `(g1, gcd(g2, x))`. The answer is `Σ dp[g][g]` for `g >= 1`.",
      ],
      editorial: explain({
        idea: "Scan the array once, deciding for every element whether it joins the first subsequence, the second, or neither. The future only depends on the two running GCDs, and since all values are at most 200, a 201 × 201 table of counts captures everything.",
        steps: [
          "Let `M = max(nums)`. Start with `dp[0][0] = 1`, where GCD 0 means \"empty so far\".",
          "For each `x`: copy `dp` into `ndp` (leave `x` out); for every state `(g1, g2)` with count `c`, add `c` to `ndp[gcd(g1, x)][g2]` and to `ndp[g1][gcd(g2, x)]`.",
          "After all elements, return `Σ_{g = 1..M} dp[g][g]` modulo `10^9 + 7`.",
        ],
        why: "Each assignment of the elements to (first, second, neither) is followed by exactly one path through the states, and the final state records both GCDs. Requiring `g >= 1` excludes empty sides (an empty side has GCD 0), and diagonal states are exactly the pairs with equal GCDs.",
        time: "O(n · M^2)",
        space: "O(M^2)",
        pitfalls: [
          "Write into a copy of the table — updating in place would let one element join a side twice.",
          "Ordered pairs are intended: the DP naturally counts `(A, B)` and `(B, A)` separately, so do not divide by 2.",
          "Precompute `gcd(g, x)` or keep the helper cheap; it is called `O(n · M^2)` times.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "10" },
        { input: "[10,20,30]", expectedOutput: "2" },
        { input: "[1,1,1,1]", expectedOutput: "50" },
      ],
      hiddenCount: 1000,
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 7, 9]));
        const top = pick(rng, [2, 4, 8, 12]);
        const mul = pick(rng, [1, 1, 2, 3]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top) * mul);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import gcd

          def subsequencePairCount(nums: List[int]) -> int:
              MOD = 10**9 + 7
              M = max(nums)
              dp = [[0] * (M + 1) for _ in range(M + 1)]
              dp[0][0] = 1
              for x in nums:
                  g = [gcd(v, x) for v in range(M + 1)]
                  nd = [row[:] for row in dp]
                  for g1 in range(M + 1):
                      row = dp[g1]
                      a = g[g1]
                      for g2 in range(M + 1):
                          c = row[g2]
                          if c:
                              nd[a][g2] = (nd[a][g2] + c) % MOD
                              b = g[g2]
                              nd[g1][b] = (nd[g1][b] + c) % MOD
                  dp = nd
              return sum(dp[v][v] for v in range(1, M + 1)) % MOD
        `,
        javascript: code`
          var subsequencePairCount = function(nums) {
              var MOD = 1000000007;
              var gcd = function(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; };
              var M = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > M) M = nums[i];
              var dp = [];
              for (var r = 0; r <= M; r++) dp.push(new Array(M + 1).fill(0));
              dp[0][0] = 1;
              for (var k = 0; k < nums.length; k++) {
                  var x = nums[k];
                  var g = [];
                  for (var v = 0; v <= M; v++) g.push(gcd(v, x));
                  var nd = [];
                  for (var r2 = 0; r2 <= M; r2++) nd.push(dp[r2].slice());
                  for (var g1 = 0; g1 <= M; g1++) {
                      var a = g[g1];
                      for (var g2 = 0; g2 <= M; g2++) {
                          var c = dp[g1][g2];
                          if (c === 0) continue;
                          nd[a][g2] = (nd[a][g2] + c) % MOD;
                          var b = g[g2];
                          nd[g1][b] = (nd[g1][b] + c) % MOD;
                      }
                  }
                  dp = nd;
              }
              var total = 0;
              for (var d = 1; d <= M; d++) total = (total + dp[d][d]) % MOD;
              return total;
          };
        `,
        typescript: code`
          function subsequencePairCount(nums: number[]): number {
              var MOD = 1000000007;
              var gcd = function(a: number, b: number): number { while (b) { var t = a % b; a = b; b = t; } return a; };
              var M = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > M) M = nums[i];
              var dp: number[][] = [];
              for (var r = 0; r <= M; r++) {
                  var row: number[] = [];
                  for (var q = 0; q <= M; q++) row.push(0);
                  dp.push(row);
              }
              dp[0][0] = 1;
              for (var k = 0; k < nums.length; k++) {
                  var x = nums[k];
                  var g: number[] = [];
                  for (var v = 0; v <= M; v++) g.push(gcd(v, x));
                  var nd: number[][] = [];
                  for (var r2 = 0; r2 <= M; r2++) nd.push(dp[r2].slice());
                  for (var g1 = 0; g1 <= M; g1++) {
                      var a = g[g1];
                      for (var g2 = 0; g2 <= M; g2++) {
                          var c = dp[g1][g2];
                          if (c === 0) continue;
                          nd[a][g2] = (nd[a][g2] + c) % MOD;
                          var b = g[g2];
                          nd[g1][b] = (nd[g1][b] + c) % MOD;
                      }
                  }
                  dp = nd;
              }
              var total = 0;
              for (var d = 1; d <= M; d++) total = (total + dp[d][d]) % MOD;
              return total;
          }
        `,
        java: code`
          static int gcd(int a, int b) { while (b != 0) { int t = a % b; a = b; b = t; } return a; }

          public static int subsequencePairCount(int[] nums) {
              final int MOD = 1000000007;
              int M = 0;
              for (int x : nums) M = Math.max(M, x);
              int[][] dp = new int[M + 1][M + 1];
              dp[0][0] = 1;
              int[] g = new int[M + 1];
              for (int x : nums) {
                  for (int v = 0; v <= M; v++) g[v] = gcd(v, x);
                  int[][] nd = new int[M + 1][];
                  for (int r = 0; r <= M; r++) nd[r] = dp[r].clone();
                  for (int g1 = 0; g1 <= M; g1++) {
                      int a = g[g1];
                      for (int g2 = 0; g2 <= M; g2++) {
                          int c = dp[g1][g2];
                          if (c == 0) continue;
                          nd[a][g2] = (nd[a][g2] + c) % MOD;
                          int b = g[g2];
                          nd[g1][b] = (nd[g1][b] + c) % MOD;
                      }
                  }
                  dp = nd;
              }
              long total = 0;
              for (int d = 1; d <= M; d++) total += dp[d][d];
              return (int) (total % MOD);
          }
        `,
        cpp: code`
          int subsequencePairCount(vector<int>& nums) {
              const int MOD = 1000000007;
              int M = *max_element(nums.begin(), nums.end());
              vector<vector<int>> dp(M + 1, vector<int>(M + 1, 0));
              dp[0][0] = 1;
              vector<int> g(M + 1);
              for (int x : nums) {
                  for (int v = 0; v <= M; v++) g[v] = __gcd(v, x);
                  vector<vector<int>> nd = dp;
                  for (int g1 = 0; g1 <= M; g1++) {
                      int a = g[g1];
                      for (int g2 = 0; g2 <= M; g2++) {
                          int c = dp[g1][g2];
                          if (c == 0) continue;
                          nd[a][g2] = (nd[a][g2] + c) % MOD;
                          int b = g[g2];
                          nd[g1][b] = (nd[g1][b] + c) % MOD;
                      }
                  }
                  dp = nd;
              }
              long long total = 0;
              for (int d = 1; d <= M; d++) total += dp[d][d];
              return (int) (total % MOD);
          }
        `,
        c: code`
          static int gcdOf(int a, int b) { while (b) { int t = a % b; a = b; b = t; } return a; }

          int subsequencePairCount(int* nums, int numsSize) {
              const int MOD = 1000000007;
              int M = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] > M) M = nums[i];
              int W = M + 1;
              int* dp = (int*) calloc((size_t) W * W, sizeof(int));
              int* nd = (int*) calloc((size_t) W * W, sizeof(int));
              int* g = (int*) malloc(sizeof(int) * W);
              dp[0] = 1;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i];
                  for (int v = 0; v < W; v++) g[v] = gcdOf(v, x);
                  for (int z = 0; z < W * W; z++) nd[z] = dp[z];
                  for (int g1 = 0; g1 < W; g1++) {
                      int a = g[g1];
                      for (int g2 = 0; g2 < W; g2++) {
                          int c = dp[g1 * W + g2];
                          if (c == 0) continue;
                          nd[a * W + g2] = (nd[a * W + g2] + c) % MOD;
                          int b = g[g2];
                          nd[g1 * W + b] = (nd[g1 * W + b] + c) % MOD;
                      }
                  }
                  int* t = dp; dp = nd; nd = t;
              }
              long long total = 0;
              for (int d = 1; d < W; d++) total += dp[d * W + d];
              free(dp);
              free(nd);
              free(g);
              return (int) (total % MOD);
          }
        `,
        csharp: code`
          static int Gcd(int a, int b) { while (b != 0) { int t = a % b; a = b; b = t; } return a; }

          public static int SubsequencePairCount(int[] nums)
          {
              const int MOD = 1000000007;
              int M = 0;
              foreach (int x in nums) M = Math.Max(M, x);
              int[,] dp = new int[M + 1, M + 1];
              dp[0, 0] = 1;
              int[] g = new int[M + 1];
              foreach (int x in nums)
              {
                  for (int v = 0; v <= M; v++) g[v] = Gcd(v, x);
                  int[,] nd = (int[,]) dp.Clone();
                  for (int g1 = 0; g1 <= M; g1++)
                  {
                      int a = g[g1];
                      for (int g2 = 0; g2 <= M; g2++)
                      {
                          int c = dp[g1, g2];
                          if (c == 0) continue;
                          nd[a, g2] = (nd[a, g2] + c) % MOD;
                          int b = g[g2];
                          nd[g1, b] = (nd[g1, b] + c) % MOD;
                      }
                  }
                  dp = nd;
              }
              long total = 0;
              for (int d = 1; d <= M; d++) total += dp[d, d];
              return (int) (total % MOD);
          }
        `,
        go: code`
          func subsequencePairCount(nums []int) int {
              const mod = 1000000007
              gcd := func(a, b int) int {
                  for b != 0 {
                      a, b = b, a%b
                  }
                  return a
              }
              M := 0
              for _, x := range nums {
                  if x > M {
                      M = x
                  }
              }
              dp := make([][]int, M+1)
              for r := range dp {
                  dp[r] = make([]int, M+1)
              }
              dp[0][0] = 1
              g := make([]int, M+1)
              for _, x := range nums {
                  for v := 0; v <= M; v++ {
                      g[v] = gcd(v, x)
                  }
                  nd := make([][]int, M+1)
                  for r := range nd {
                      nd[r] = append([]int(nil), dp[r]...)
                  }
                  for g1 := 0; g1 <= M; g1++ {
                      a := g[g1]
                      for g2 := 0; g2 <= M; g2++ {
                          c := dp[g1][g2]
                          if c == 0 {
                              continue
                          }
                          nd[a][g2] = (nd[a][g2] + c) % mod
                          b := g[g2]
                          nd[g1][b] = (nd[g1][b] + c) % mod
                      }
                  }
                  dp = nd
              }
              total := 0
              for d := 1; d <= M; d++ {
                  total = (total + dp[d][d]) % mod
              }
              return total
          }
        `,
        kotlin: code`
          fun subsequencePairCount(nums: IntArray): Int {
              val modulus = 1000000007
              fun gcd(x: Int, y: Int): Int {
                  var a = x
                  var b = y
                  while (b != 0) { val t = a % b; a = b; b = t }
                  return a
              }
              var M = 0
              for (x in nums) M = maxOf(M, x)
              var dp = Array(M + 1) { IntArray(M + 1) }
              dp[0][0] = 1
              val g = IntArray(M + 1)
              for (x in nums) {
                  for (v in 0..M) g[v] = gcd(v, x)
                  val nd = Array(M + 1) { dp[it].copyOf() }
                  for (g1 in 0..M) {
                      val a = g[g1]
                      for (g2 in 0..M) {
                          val c = dp[g1][g2]
                          if (c == 0) continue
                          nd[a][g2] = (nd[a][g2] + c) % modulus
                          val b = g[g2]
                          nd[g1][b] = (nd[g1][b] + c) % modulus
                      }
                  }
                  dp = nd
              }
              var total = 0L
              for (d in 1..M) total += dp[d][d]
              return (total % modulus).toInt()
          }
        `,
        swift: code`
          func subsequencePairCount(_ nums: [Int]) -> Int {
              let modulus = 1000000007
              func gcd(_ x: Int, _ y: Int) -> Int {
                  var a = x, b = y
                  while b != 0 { (a, b) = (b, a % b) }
                  return a
              }
              let M = nums.max()!
              var dp = [[Int]](repeating: [Int](repeating: 0, count: M + 1), count: M + 1)
              dp[0][0] = 1
              var g = [Int](repeating: 0, count: M + 1)
              for x in nums {
                  for v in 0...M { g[v] = gcd(v, x) }
                  var nd = dp
                  for g1 in 0...M {
                      let a = g[g1]
                      for g2 in 0...M {
                          let c = dp[g1][g2]
                          if c == 0 { continue }
                          nd[a][g2] = (nd[a][g2] + c) % modulus
                          let b = g[g2]
                          nd[g1][b] = (nd[g1][b] + c) % modulus
                      }
                  }
                  dp = nd
              }
              var total = 0
              for d in 1...M { total = (total + dp[d][d]) % modulus }
              return total
          }
        `,
        rust: code`
          fn subsequencePairCount(nums: Vec<i32>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              fn gcd(mut a: usize, mut b: usize) -> usize {
                  while b != 0 {
                      let t = a % b;
                      a = b;
                      b = t;
                  }
                  a
              }
              let m = *nums.iter().max().unwrap() as usize;
              let mut dp = vec![vec![0i64; m + 1]; m + 1];
              dp[0][0] = 1;
              let mut g = vec![0usize; m + 1];
              for &x in &nums {
                  for v in 0..=m {
                      g[v] = gcd(v, x as usize);
                  }
                  let mut nd = dp.clone();
                  for g1 in 0..=m {
                      let a = g[g1];
                      for g2 in 0..=m {
                          let c = dp[g1][g2];
                          if c == 0 {
                              continue;
                          }
                          nd[a][g2] = (nd[a][g2] + c) % modulus;
                          let b = g[g2];
                          nd[g1][b] = (nd[g1][b] + c) % modulus;
                      }
                  }
                  dp = nd;
              }
              let mut total = 0i64;
              for d in 1..=m {
                  total = (total + dp[d][d]) % modulus;
              }
              total as i32
          }
        `,
        php: code`
          function subsequencePairCount($nums) {
              $MOD = 1000000007;
              $M = max($nums);
              $dp = array_fill(0, $M + 1, array_fill(0, $M + 1, 0));
              $dp[0][0] = 1;
              foreach ($nums as $x) {
                  $g = [];
                  for ($v = 0; $v <= $M; $v++) {
                      $a = $v; $b = $x;
                      while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }
                      $g[$v] = $a;
                  }
                  $nd = $dp;
                  for ($g1 = 0; $g1 <= $M; $g1++) {
                      $a = $g[$g1];
                      for ($g2 = 0; $g2 <= $M; $g2++) {
                          $c = $dp[$g1][$g2];
                          if ($c == 0) continue;
                          $nd[$a][$g2] = ($nd[$a][$g2] + $c) % $MOD;
                          $b = $g[$g2];
                          $nd[$g1][$b] = ($nd[$g1][$b] + $c) % $MOD;
                      }
                  }
                  $dp = $nd;
              }
              $total = 0;
              for ($d = 1; $d <= $M; $d++) $total = ($total + $dp[$d][$d]) % $MOD;
              return $total;
          }
        `,
        ruby: code`
          def subsequencePairCount(nums)
            mod = 1_000_000_007
            m = nums.max
            dp = Array.new(m + 1) { Array.new(m + 1, 0) }
            dp[0][0] = 1
            nums.each do |x|
              g = (0..m).map { |v| v.gcd(x) }
              nd = dp.map(&:dup)
              (0..m).each do |g1|
                row = dp[g1]
                a = g[g1]
                (0..m).each do |g2|
                  c = row[g2]
                  next if c == 0
                  nd[a][g2] = (nd[a][g2] + c) % mod
                  b = g[g2]
                  nd[g1][b] = (nd[g1][b] + c) % mod
                end
              end
              dp = nd
            end
            (1..m).sum { |d| dp[d][d] } % mod
          end
        `,
      },
    };
  })(),

  // ── Sum of Good Subsequences (LC 3351) ────────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (nums: number[]) => {
      // O(n^2): (count, sum) of good subsequences ending at each index.
      const n = nums.length;
      const cnt: number[] = [], sum: number[] = [];
      let total = 0;
      for (let i = 0; i < n; i++) {
        let c = 1, s = 0;
        for (let j = 0; j < i; j++) {
          if (Math.abs(nums[j] - nums[i]) === 1) { c = (c + cnt[j]) % MOD; s = (s + sum[j]) % MOD; }
        }
        s = (s + Number((BigInt(nums[i]) * BigInt(c)) % BigInt(MOD))) % MOD;
        cnt.push(c);
        sum.push(s);
        total = (total + s) % MOD;
      }
      return total;
    };
    return {
      slug: "sum-of-good-subsequences",
      title: "Sum of Good Subsequences",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Amazon"],
      signature: { funcName: "sumOfGoodSubsequences", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. A subsequence of `nums` is **good** if the absolute difference between every two **consecutive** elements of the subsequence is exactly 1. Every subsequence of length 1 is good.\n\nReturn the **sum of the elements** of all good subsequences of `nums`, counting each subsequence (chosen by its indices) once. Since the answer may be very large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [1,2,1]", out: "14", note: "The good subsequences are [1], [2], [1], [1,2], [2,1] and [1,2,1]; their elements add up to 14." },
          { in: "nums = [3,4,5]", out: "40", note: "[3], [4], [5], [3,4], [4,5] and [3,4,5] sum to 3 + 4 + 5 + 7 + 9 + 12 = 40." },
          { in: "nums = [5]", out: "5" },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^5"]),
      hints: [
        "A good subsequence ending at value `x` was extended from one ending at `x - 1` or `x + 1` (or it starts at `x`).",
        "For each value keep two numbers: how many good subsequences end with that value, and the total of their element sums.",
        "Appending `x` to `c` subsequences adds `x · c` to their combined sum. So for a new `x`: `c = 1 + cnt[x-1] + cnt[x+1]`, `s = sum[x-1] + sum[x+1] + x · c`; add both to value `x`'s entries.",
      ],
      editorial: explain({
        idea: "Process the array left to right and, for every value `v`, remember how many good subsequences so far end with `v` and the sum of all their elements. A new element `x` starts one subsequence and extends every subsequence ending with `x - 1` or `x + 1`.",
        steps: [
          "Keep arrays `cnt[v]` and `sum[v]` over values (offset by one so `x - 1` is valid for `x = 0`).",
          "For each `x`: `c = 1 + cnt[x - 1] + cnt[x + 1]` and `s = sum[x - 1] + sum[x + 1] + x · c`, all modulo `10^9 + 7`.",
          "Add `c` to `cnt[x]` and `s` to `sum[x]`.",
          "Return the total of `sum[v]` over all values.",
        ],
        why: "Every good subsequence ending at index `i` is either `[nums[i]]` or a good subsequence ending at an earlier index whose value differs from `nums[i]` by exactly 1, with `nums[i]` appended. Grouping those earlier subsequences by their last value gives exactly `cnt[x ± 1]` of them with total `sum[x ± 1]`, and appending `x` to each adds `x` once per subsequence.",
        time: "O(n + V)",
        space: "O(V)",
        pitfalls: [
          "`x · c` can reach about `10^5 × 10^9` — use 64-bit arithmetic before taking the modulus.",
          "Read `cnt[x - 1]`, `cnt[x + 1]` before updating `cnt[x]`; with equal neighbours there is no conflict, but keep the order clear.",
          "Value 0 has no `x - 1` neighbour — shift the indices instead of reading index -1.",
        ],
      }),
      examples: [
        { input: "[1,2,1]", expectedOutput: "14" },
        { input: "[3,4,5]", expectedOutput: "40" },
        { input: "[5]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40, 60]));
        const lo = pick(rng, [0, 0, 0, 5, 5, 1000, 1000, 99990]);
        const span = pick(rng, [1, 2, 3, 6]);
        const nums = Array.from({ length: n }, () => lo + ri(rng, 0, span));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumOfGoodSubsequences(nums: List[int]) -> int:
              MOD = 10**9 + 7
              size = max(nums) + 3
              cnt = [0] * size
              sm = [0] * size
              for x in nums:
                  i = x + 1  # shifted so that i - 1 is always valid
                  c = (1 + cnt[i - 1] + cnt[i + 1]) % MOD
                  s = (sm[i - 1] + sm[i + 1] + x * c) % MOD
                  cnt[i] = (cnt[i] + c) % MOD
                  sm[i] = (sm[i] + s) % MOD
              return sum(sm) % MOD
        `,
        javascript: code`
          var sumOfGoodSubsequences = function(nums) {
              var MOD = 1000000007;
              var M = 0;
              for (var k = 0; k < nums.length; k++) if (nums[k] > M) M = nums[k];
              var cnt = new Array(M + 3).fill(0), sm = new Array(M + 3).fill(0);
              for (var j = 0; j < nums.length; j++) {
                  var x = nums[j], i = x + 1;
                  var c = (1 + cnt[i - 1] + cnt[i + 1]) % MOD;
                  // x < 2^17 and c < 2^30, so x * c stays exact in a double.
                  var s = (sm[i - 1] + sm[i + 1] + (x * c) % MOD) % MOD;
                  cnt[i] = (cnt[i] + c) % MOD;
                  sm[i] = (sm[i] + s) % MOD;
              }
              var total = 0;
              for (var v = 0; v < sm.length; v++) total = (total + sm[v]) % MOD;
              return total;
          };
        `,
        typescript: code`
          function sumOfGoodSubsequences(nums: number[]): number {
              var MOD = 1000000007;
              var M = 0;
              for (var k = 0; k < nums.length; k++) if (nums[k] > M) M = nums[k];
              var cnt: number[] = [], sm: number[] = [];
              for (var z = 0; z < M + 3; z++) { cnt.push(0); sm.push(0); }
              for (var j = 0; j < nums.length; j++) {
                  var x = nums[j], i = x + 1;
                  var c = (1 + cnt[i - 1] + cnt[i + 1]) % MOD;
                  var s = (sm[i - 1] + sm[i + 1] + (x * c) % MOD) % MOD;
                  cnt[i] = (cnt[i] + c) % MOD;
                  sm[i] = (sm[i] + s) % MOD;
              }
              var total = 0;
              for (var v = 0; v < sm.length; v++) total = (total + sm[v]) % MOD;
              return total;
          }
        `,
        java: code`
          public static int sumOfGoodSubsequences(int[] nums) {
              final long MOD = 1000000007L;
              int M = 0;
              for (int x : nums) M = Math.max(M, x);
              long[] cnt = new long[M + 3], sm = new long[M + 3];
              for (int x : nums) {
                  int i = x + 1;
                  long c = (1 + cnt[i - 1] + cnt[i + 1]) % MOD;
                  long s = (sm[i - 1] + sm[i + 1] + (long) x * c) % MOD;
                  cnt[i] = (cnt[i] + c) % MOD;
                  sm[i] = (sm[i] + s) % MOD;
              }
              long total = 0;
              for (long v : sm) total = (total + v) % MOD;
              return (int) total;
          }
        `,
        cpp: code`
          int sumOfGoodSubsequences(vector<int>& nums) {
              const long long MOD = 1000000007LL;
              int M = *max_element(nums.begin(), nums.end());
              vector<long long> cnt(M + 3, 0), sm(M + 3, 0);
              for (int x : nums) {
                  int i = x + 1;
                  long long c = (1 + cnt[i - 1] + cnt[i + 1]) % MOD;
                  long long s = (sm[i - 1] + sm[i + 1] + (long long) x * c) % MOD;
                  cnt[i] = (cnt[i] + c) % MOD;
                  sm[i] = (sm[i] + s) % MOD;
              }
              long long total = 0;
              for (long long v : sm) total = (total + v) % MOD;
              return (int) total;
          }
        `,
        c: code`
          int sumOfGoodSubsequences(int* nums, int numsSize) {
              const long long MOD = 1000000007LL;
              int M = 0;
              for (int k = 0; k < numsSize; k++) if (nums[k] > M) M = nums[k];
              long long* cnt = (long long*) calloc((size_t) M + 3, sizeof(long long));
              long long* sm = (long long*) calloc((size_t) M + 3, sizeof(long long));
              for (int k = 0; k < numsSize; k++) {
                  int x = nums[k], i = x + 1;
                  long long c = (1 + cnt[i - 1] + cnt[i + 1]) % MOD;
                  long long s = (sm[i - 1] + sm[i + 1] + (long long) x * c) % MOD;
                  cnt[i] = (cnt[i] + c) % MOD;
                  sm[i] = (sm[i] + s) % MOD;
              }
              long long total = 0;
              for (int v = 0; v < M + 3; v++) total = (total + sm[v]) % MOD;
              free(cnt);
              free(sm);
              return (int) total;
          }
        `,
        csharp: code`
          public static int SumOfGoodSubsequences(int[] nums)
          {
              const long MOD = 1000000007L;
              int M = 0;
              foreach (int x in nums) M = Math.Max(M, x);
              long[] cnt = new long[M + 3], sm = new long[M + 3];
              foreach (int x in nums)
              {
                  int i = x + 1;
                  long c = (1 + cnt[i - 1] + cnt[i + 1]) % MOD;
                  long s = (sm[i - 1] + sm[i + 1] + (long) x * c) % MOD;
                  cnt[i] = (cnt[i] + c) % MOD;
                  sm[i] = (sm[i] + s) % MOD;
              }
              long total = 0;
              foreach (long v in sm) total = (total + v) % MOD;
              return (int) total;
          }
        `,
        go: code`
          func sumOfGoodSubsequences(nums []int) int {
              const mod = 1000000007
              M := 0
              for _, x := range nums {
                  if x > M {
                      M = x
                  }
              }
              cnt := make([]int, M+3)
              sm := make([]int, M+3)
              for _, x := range nums {
                  i := x + 1
                  c := (1 + cnt[i-1] + cnt[i+1]) % mod
                  s := (sm[i-1] + sm[i+1] + x*c) % mod
                  cnt[i] = (cnt[i] + c) % mod
                  sm[i] = (sm[i] + s) % mod
              }
              total := 0
              for _, v := range sm {
                  total = (total + v) % mod
              }
              return total
          }
        `,
        kotlin: code`
          fun sumOfGoodSubsequences(nums: IntArray): Int {
              val modulus = 1000000007L
              var M = 0
              for (x in nums) M = maxOf(M, x)
              val cnt = LongArray(M + 3)
              val sm = LongArray(M + 3)
              for (x in nums) {
                  val i = x + 1
                  val c = (1 + cnt[i - 1] + cnt[i + 1]) % modulus
                  val s = (sm[i - 1] + sm[i + 1] + x.toLong() * c) % modulus
                  cnt[i] = (cnt[i] + c) % modulus
                  sm[i] = (sm[i] + s) % modulus
              }
              var total = 0L
              for (v in sm) total = (total + v) % modulus
              return total.toInt()
          }
        `,
        swift: code`
          func sumOfGoodSubsequences(_ nums: [Int]) -> Int {
              let modulus = 1000000007
              let M = nums.max()!
              var cnt = [Int](repeating: 0, count: M + 3)
              var sm = [Int](repeating: 0, count: M + 3)
              for x in nums {
                  let i = x + 1
                  let c = (1 + cnt[i - 1] + cnt[i + 1]) % modulus
                  let s = (sm[i - 1] + sm[i + 1] + x * c) % modulus
                  cnt[i] = (cnt[i] + c) % modulus
                  sm[i] = (sm[i] + s) % modulus
              }
              var total = 0
              for v in sm { total = (total + v) % modulus }
              return total
          }
        `,
        rust: code`
          fn sumOfGoodSubsequences(nums: Vec<i32>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let m = *nums.iter().max().unwrap() as usize;
              let mut cnt = vec![0i64; m + 3];
              let mut sm = vec![0i64; m + 3];
              for &x in &nums {
                  let i = x as usize + 1;
                  let c = (1 + cnt[i - 1] + cnt[i + 1]) % modulus;
                  let s = (sm[i - 1] + sm[i + 1] + x as i64 * c) % modulus;
                  cnt[i] = (cnt[i] + c) % modulus;
                  sm[i] = (sm[i] + s) % modulus;
              }
              let mut total = 0i64;
              for v in sm {
                  total = (total + v) % modulus;
              }
              total as i32
          }
        `,
        php: code`
          function sumOfGoodSubsequences($nums) {
              $MOD = 1000000007;
              $M = max($nums);
              $cnt = array_fill(0, $M + 3, 0);
              $sm = array_fill(0, $M + 3, 0);
              foreach ($nums as $x) {
                  $i = $x + 1;
                  $c = (1 + $cnt[$i - 1] + $cnt[$i + 1]) % $MOD;
                  $s = ($sm[$i - 1] + $sm[$i + 1] + $x * $c) % $MOD;
                  $cnt[$i] = ($cnt[$i] + $c) % $MOD;
                  $sm[$i] = ($sm[$i] + $s) % $MOD;
              }
              $total = 0;
              foreach ($sm as $v) $total = ($total + $v) % $MOD;
              return $total;
          }
        `,
        ruby: code`
          def sumOfGoodSubsequences(nums)
            mod = 1_000_000_007
            m = nums.max
            cnt = Array.new(m + 3, 0)
            sm = Array.new(m + 3, 0)
            nums.each do |x|
              i = x + 1
              c = (1 + cnt[i - 1] + cnt[i + 1]) % mod
              s = (sm[i - 1] + sm[i + 1] + x * c) % mod
              cnt[i] = (cnt[i] + c) % mod
              sm[i] = (sm[i] + s) % mod
            end
            sm.sum % mod
          end
        `,
      },
    };
  })(),

  // ── Minimum Array Sum (LC 3366) ───────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number, op1: number, op2: number) => {
      // Every element: nothing, halve, subtract, or both (in either order).
      const n = nums.length;
      let best = Infinity;
      const go = (i: number, a: number, b: number, sum: number) => {
        if (i === n) { best = Math.min(best, sum); return; }
        const x = nums[i];
        go(i + 1, a, b, sum + x);
        if (a < op1) go(i + 1, a + 1, b, sum + Math.ceil(x / 2));
        if (b < op2 && x >= k) go(i + 1, a, b + 1, sum + x - k);
        if (a < op1 && b < op2) {
          const h = Math.ceil(x / 2);
          if (h >= k) go(i + 1, a + 1, b + 1, sum + h - k);
          if (x >= k) go(i + 1, a + 1, b + 1, sum + Math.ceil((x - k) / 2));
        }
      };
      go(0, 0, 0, 0);
      return best;
    };
    return {
      slug: "minimum-array-sum",
      title: "Minimum Array Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Google"],
      signature: {
        funcName: "minArraySum",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }, { name: "op1", type: "int" as const }, { name: "op2", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `nums` and three integers `k`, `op1` and `op2`. Two operations are available:\n\n- **Operation 1:** pick an index `i` and replace `nums[i]` with `nums[i] / 2` rounded **up**. You may do this at most `op1` times in total, and at most once per index.\n- **Operation 2:** pick an index `i` with `nums[i] >= k` and subtract `k` from it. You may do this at most `op2` times in total, and at most once per index.\n\nBoth operations may be applied to the same index (each at most once, in either order).\n\nReturn the **minimum** possible sum of all elements of `nums` after any number of operations.",
        [
          { in: "nums = [2,8,3,19,3], k = 3, op1 = 1, op2 = 1", out: "23", note: "Subtract 3 from 8 (it becomes 5) and halve 19 (it becomes 10): [2,5,3,10,3] sums to 23." },
          { in: "nums = [2,4,3], k = 3, op1 = 2, op2 = 1", out: "3", note: "Halve 2 to 1; halve 4 to 2; subtract 3 from 3: [1,2,0]." },
          { in: "nums = [5], k = 10, op1 = 1, op2 = 1", out: "3", note: "5 is below k, so only the halving applies: ceil(5 / 2) = 3." },
        ],
        ["1 <= nums.length <= 100", "0 <= nums[i] <= 10^5", "0 <= k <= 10^5", "0 <= op1, op2 <= nums.length"]),
      hints: [
        "Each index ends in one of four states: untouched, halved, reduced by `k`, or both. The only coupling between indices is the two budgets.",
        "That is a knapsack with two capacities: `dp[a][b]` = minimum sum of the processed prefix using `a` halvings and `b` subtractions.",
        "When both operations hit one index, the order matters: halving first needs `ceil(x / 2) >= k`, subtracting first needs `x >= k`. Try both valid orders and keep the smaller result.",
      ],
      editorial: explain({
        idea: "Every element independently chooses one of four outcomes, and the choices only interact through the two operation budgets. A DP over elements with the budgets used so far as the state explores all combinations in `O(n · op1 · op2)`.",
        steps: [
          "Let `dp[a][b]` be the minimum sum so far using `a` halvings and `b` subtractions; start with `dp[0][0] = 0` and everything else infinite.",
          "For each `x`, compute the four outcomes: `x`; `ceil(x / 2)`; `x - k` if `x >= k`; and for both, the smaller of `ceil(x / 2) - k` (if `ceil(x / 2) >= k`) and `ceil((x - k) / 2)` (if `x >= k`).",
          "Relax `ndp` from every finite `dp[a][b]` with each outcome, adding 1 to `a` and/or `b` as the outcome uses them, never past `op1`/`op2`.",
          "Return the minimum over all `dp[a][b]`.",
        ],
        why: "Because each operation may be used at most once per index, an index's contribution depends only on which operations it received and in which order; the four outcomes (with the better order for \"both\") are exhaustive. Two prefixes with the same budget usage are interchangeable for the rest of the array, so keeping the minimum per `(a, b)` is exact.",
        time: "O(n · op1 · op2)",
        space: "O(op1 · op2)",
        pitfalls: [
          "Operation 1 rounds **up**: `ceil(x / 2) = (x + 1) / 2` in integer arithmetic.",
          "Subtracting before halving is only allowed when `x >= k`; halving before subtracting only when `ceil(x / 2) >= k`. Either order can be the better one.",
          "A greedy (\"spend subtractions on the largest elements\") fails because the two budgets compete for the same elements.",
        ],
      }),
      examples: [
        { input: "[2,8,3,19,3]\n3\n1\n1", expectedOutput: "23" },
        { input: "[2,4,3]\n3\n2\n1", expectedOutput: "3" },
        { input: "[5]\n10\n1\n1", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 5, 6]));
        const top = pick(rng, [5, 20, 100, 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, top));
        const k = ri(rng, 0, pick(rng, [0, 3, top]));
        const op1 = ri(rng, 0, n), op2 = ri(rng, 0, n);
        return { input: `${fmtIntArr(nums)}\n${k}\n${op1}\n${op2}`, expectedOutput: String(ref(nums, k, op1, op2)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minArraySum(nums: List[int], k: int, op1: int, op2: int) -> int:
              INF = float('inf')
              dp = [[INF] * (op2 + 1) for _ in range(op1 + 1)]
              dp[0][0] = 0
              for x in nums:
                  half = (x + 1) // 2
                  sub = x - k if x >= k else None
                  both = None
                  if half >= k:
                      both = half - k
                  if x >= k:
                      v = (x - k + 1) // 2
                      both = v if both is None else min(both, v)
                  nd = [[INF] * (op2 + 1) for _ in range(op1 + 1)]
                  for a in range(op1 + 1):
                      for b in range(op2 + 1):
                          cur = dp[a][b]
                          if cur == INF:
                              continue
                          if cur + x < nd[a][b]:
                              nd[a][b] = cur + x
                          if a < op1 and cur + half < nd[a + 1][b]:
                              nd[a + 1][b] = cur + half
                          if sub is not None and b < op2 and cur + sub < nd[a][b + 1]:
                              nd[a][b + 1] = cur + sub
                          if both is not None and a < op1 and b < op2 and cur + both < nd[a + 1][b + 1]:
                              nd[a + 1][b + 1] = cur + both
                  dp = nd
              return min(min(row) for row in dp)
        `,
        javascript: code`
          var minArraySum = function(nums, k, op1, op2) {
              var INF = Infinity;
              var grid = function() {
                  var g = [];
                  for (var a = 0; a <= op1; a++) g.push(new Array(op2 + 1).fill(INF));
                  return g;
              };
              var dp = grid();
              dp[0][0] = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  var half = Math.floor((x + 1) / 2);
                  var sub = x >= k ? x - k : -1;
                  var both = -1;
                  if (half >= k) both = half - k;
                  if (x >= k) {
                      var v = Math.floor((x - k + 1) / 2);
                      if (both < 0 || v < both) both = v;
                  }
                  var nd = grid();
                  for (var a = 0; a <= op1; a++) {
                      for (var b = 0; b <= op2; b++) {
                          var cur = dp[a][b];
                          if (cur === INF) continue;
                          if (cur + x < nd[a][b]) nd[a][b] = cur + x;
                          if (a < op1 && cur + half < nd[a + 1][b]) nd[a + 1][b] = cur + half;
                          if (sub >= 0 && b < op2 && cur + sub < nd[a][b + 1]) nd[a][b + 1] = cur + sub;
                          if (both >= 0 && a < op1 && b < op2 && cur + both < nd[a + 1][b + 1]) nd[a + 1][b + 1] = cur + both;
                      }
                  }
                  dp = nd;
              }
              var best = INF;
              for (var p = 0; p <= op1; p++) for (var q = 0; q <= op2; q++) if (dp[p][q] < best) best = dp[p][q];
              return best;
          };
        `,
        typescript: code`
          function minArraySum(nums: number[], k: number, op1: number, op2: number): number {
              var INF = 1000000000;
              var grid = function(): number[][] {
                  var g: number[][] = [];
                  for (var a = 0; a <= op1; a++) {
                      var row: number[] = [];
                      for (var b = 0; b <= op2; b++) row.push(INF);
                      g.push(row);
                  }
                  return g;
              };
              var dp = grid();
              dp[0][0] = 0;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  var half = Math.floor((x + 1) / 2);
                  var sub = x >= k ? x - k : -1;
                  var both = -1;
                  if (half >= k) both = half - k;
                  if (x >= k) {
                      var v = Math.floor((x - k + 1) / 2);
                      if (both < 0 || v < both) both = v;
                  }
                  var nd = grid();
                  for (var a = 0; a <= op1; a++) {
                      for (var b = 0; b <= op2; b++) {
                          var cur = dp[a][b];
                          if (cur === INF) continue;
                          if (cur + x < nd[a][b]) nd[a][b] = cur + x;
                          if (a < op1 && cur + half < nd[a + 1][b]) nd[a + 1][b] = cur + half;
                          if (sub >= 0 && b < op2 && cur + sub < nd[a][b + 1]) nd[a][b + 1] = cur + sub;
                          if (both >= 0 && a < op1 && b < op2 && cur + both < nd[a + 1][b + 1]) nd[a + 1][b + 1] = cur + both;
                      }
                  }
                  dp = nd;
              }
              var best = INF;
              for (var p = 0; p <= op1; p++) for (var q = 0; q <= op2; q++) if (dp[p][q] < best) best = dp[p][q];
              return best;
          }
        `,
        java: code`
          public static int minArraySum(int[] nums, int k, int op1, int op2) {
              final int INF = Integer.MAX_VALUE / 2;
              int[][] dp = new int[op1 + 1][op2 + 1];
              for (int[] row : dp) Arrays.fill(row, INF);
              dp[0][0] = 0;
              for (int x : nums) {
                  int half = (x + 1) / 2;
                  int sub = x >= k ? x - k : -1;
                  int both = -1;
                  if (half >= k) both = half - k;
                  if (x >= k) {
                      int v = (x - k + 1) / 2;
                      if (both < 0 || v < both) both = v;
                  }
                  int[][] nd = new int[op1 + 1][op2 + 1];
                  for (int[] row : nd) Arrays.fill(row, INF);
                  for (int a = 0; a <= op1; a++) {
                      for (int b = 0; b <= op2; b++) {
                          int cur = dp[a][b];
                          if (cur == INF) continue;
                          nd[a][b] = Math.min(nd[a][b], cur + x);
                          if (a < op1) nd[a + 1][b] = Math.min(nd[a + 1][b], cur + half);
                          if (sub >= 0 && b < op2) nd[a][b + 1] = Math.min(nd[a][b + 1], cur + sub);
                          if (both >= 0 && a < op1 && b < op2) nd[a + 1][b + 1] = Math.min(nd[a + 1][b + 1], cur + both);
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (int[] row : dp) for (int v : row) best = Math.min(best, v);
              return best;
          }
        `,
        cpp: code`
          int minArraySum(vector<int>& nums, int k, int op1, int op2) {
              const int INF = INT_MAX / 2;
              vector<vector<int>> dp(op1 + 1, vector<int>(op2 + 1, INF));
              dp[0][0] = 0;
              for (int x : nums) {
                  int half = (x + 1) / 2;
                  int sub = x >= k ? x - k : -1;
                  int both = -1;
                  if (half >= k) both = half - k;
                  if (x >= k) {
                      int v = (x - k + 1) / 2;
                      if (both < 0 || v < both) both = v;
                  }
                  vector<vector<int>> nd(op1 + 1, vector<int>(op2 + 1, INF));
                  for (int a = 0; a <= op1; a++) {
                      for (int b = 0; b <= op2; b++) {
                          int cur = dp[a][b];
                          if (cur == INF) continue;
                          nd[a][b] = min(nd[a][b], cur + x);
                          if (a < op1) nd[a + 1][b] = min(nd[a + 1][b], cur + half);
                          if (sub >= 0 && b < op2) nd[a][b + 1] = min(nd[a][b + 1], cur + sub);
                          if (both >= 0 && a < op1 && b < op2) nd[a + 1][b + 1] = min(nd[a + 1][b + 1], cur + both);
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (auto& row : dp) for (int v : row) best = min(best, v);
              return best;
          }
        `,
        c: code`
          int minArraySum(int* nums, int numsSize, int k, int op1, int op2) {
              const int INF = 1000000000;
              int W = op2 + 1, cells = (op1 + 1) * (op2 + 1);
              int* dp = (int*) malloc(sizeof(int) * cells);
              int* nd = (int*) malloc(sizeof(int) * cells);
              for (int z = 0; z < cells; z++) dp[z] = INF;
              dp[0] = 0;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i];
                  int half = (x + 1) / 2;
                  int sub = x >= k ? x - k : -1;
                  int both = -1;
                  if (half >= k) both = half - k;
                  if (x >= k) {
                      int v = (x - k + 1) / 2;
                      if (both < 0 || v < both) both = v;
                  }
                  for (int z = 0; z < cells; z++) nd[z] = INF;
                  for (int a = 0; a <= op1; a++) {
                      for (int b = 0; b <= op2; b++) {
                          int cur = dp[a * W + b];
                          if (cur == INF) continue;
                          if (cur + x < nd[a * W + b]) nd[a * W + b] = cur + x;
                          if (a < op1 && cur + half < nd[(a + 1) * W + b]) nd[(a + 1) * W + b] = cur + half;
                          if (sub >= 0 && b < op2 && cur + sub < nd[a * W + b + 1]) nd[a * W + b + 1] = cur + sub;
                          if (both >= 0 && a < op1 && b < op2 && cur + both < nd[(a + 1) * W + b + 1]) nd[(a + 1) * W + b + 1] = cur + both;
                      }
                  }
                  int* t = dp; dp = nd; nd = t;
              }
              int best = INF;
              for (int z = 0; z < cells; z++) if (dp[z] < best) best = dp[z];
              free(dp);
              free(nd);
              return best;
          }
        `,
        csharp: code`
          public static int MinArraySum(int[] nums, int k, int op1, int op2)
          {
              const int INF = int.MaxValue / 2;
              int[,] dp = new int[op1 + 1, op2 + 1];
              for (int a = 0; a <= op1; a++) for (int b = 0; b <= op2; b++) dp[a, b] = INF;
              dp[0, 0] = 0;
              foreach (int x in nums)
              {
                  int half = (x + 1) / 2;
                  int sub = x >= k ? x - k : -1;
                  int both = -1;
                  if (half >= k) both = half - k;
                  if (x >= k)
                  {
                      int v = (x - k + 1) / 2;
                      if (both < 0 || v < both) both = v;
                  }
                  int[,] nd = new int[op1 + 1, op2 + 1];
                  for (int a = 0; a <= op1; a++) for (int b = 0; b <= op2; b++) nd[a, b] = INF;
                  for (int a = 0; a <= op1; a++)
                  {
                      for (int b = 0; b <= op2; b++)
                      {
                          int cur = dp[a, b];
                          if (cur == INF) continue;
                          nd[a, b] = Math.Min(nd[a, b], cur + x);
                          if (a < op1) nd[a + 1, b] = Math.Min(nd[a + 1, b], cur + half);
                          if (sub >= 0 && b < op2) nd[a, b + 1] = Math.Min(nd[a, b + 1], cur + sub);
                          if (both >= 0 && a < op1 && b < op2) nd[a + 1, b + 1] = Math.Min(nd[a + 1, b + 1], cur + both);
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              foreach (int v in dp) best = Math.Min(best, v);
              return best;
          }
        `,
        go: code`
          func minArraySum(nums []int, k int, op1 int, op2 int) int {
              const inf = 1 << 60
              grid := func() [][]int {
                  g := make([][]int, op1+1)
                  for a := range g {
                      g[a] = make([]int, op2+1)
                      for b := range g[a] {
                          g[a][b] = inf
                      }
                  }
                  return g
              }
              dp := grid()
              dp[0][0] = 0
              for _, x := range nums {
                  half := (x + 1) / 2
                  sub := -1
                  if x >= k {
                      sub = x - k
                  }
                  both := -1
                  if half >= k {
                      both = half - k
                  }
                  if x >= k {
                      v := (x - k + 1) / 2
                      if both < 0 || v < both {
                          both = v
                      }
                  }
                  nd := grid()
                  for a := 0; a <= op1; a++ {
                      for b := 0; b <= op2; b++ {
                          cur := dp[a][b]
                          if cur == inf {
                              continue
                          }
                          if cur+x < nd[a][b] {
                              nd[a][b] = cur + x
                          }
                          if a < op1 && cur+half < nd[a+1][b] {
                              nd[a+1][b] = cur + half
                          }
                          if sub >= 0 && b < op2 && cur+sub < nd[a][b+1] {
                              nd[a][b+1] = cur + sub
                          }
                          if both >= 0 && a < op1 && b < op2 && cur+both < nd[a+1][b+1] {
                              nd[a+1][b+1] = cur + both
                          }
                      }
                  }
                  dp = nd
              }
              best := inf
              for _, row := range dp {
                  for _, v := range row {
                      if v < best {
                          best = v
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minArraySum(nums: IntArray, k: Int, op1: Int, op2: Int): Int {
              val inf = Int.MAX_VALUE / 2
              var dp = Array(op1 + 1) { IntArray(op2 + 1) { inf } }
              dp[0][0] = 0
              for (x in nums) {
                  val half = (x + 1) / 2
                  val sub = if (x >= k) x - k else -1
                  var both = -1
                  if (half >= k) both = half - k
                  if (x >= k) {
                      val v = (x - k + 1) / 2
                      if (both < 0 || v < both) both = v
                  }
                  val nd = Array(op1 + 1) { IntArray(op2 + 1) { inf } }
                  for (a in 0..op1) {
                      for (b in 0..op2) {
                          val cur = dp[a][b]
                          if (cur == inf) continue
                          nd[a][b] = minOf(nd[a][b], cur + x)
                          if (a < op1) nd[a + 1][b] = minOf(nd[a + 1][b], cur + half)
                          if (sub >= 0 && b < op2) nd[a][b + 1] = minOf(nd[a][b + 1], cur + sub)
                          if (both >= 0 && a < op1 && b < op2) nd[a + 1][b + 1] = minOf(nd[a + 1][b + 1], cur + both)
                      }
                  }
                  dp = nd
              }
              var best = inf
              for (row in dp) for (v in row) best = minOf(best, v)
              return best
          }
        `,
        swift: code`
          func minArraySum(_ nums: [Int], _ k: Int, _ op1: Int, _ op2: Int) -> Int {
              let inf = Int.max / 2
              var dp = [[Int]](repeating: [Int](repeating: inf, count: op2 + 1), count: op1 + 1)
              dp[0][0] = 0
              for x in nums {
                  let half = (x + 1) / 2
                  let sub = x >= k ? x - k : -1
                  var both = -1
                  if half >= k { both = half - k }
                  if x >= k {
                      let v = (x - k + 1) / 2
                      if both < 0 || v < both { both = v }
                  }
                  var nd = [[Int]](repeating: [Int](repeating: inf, count: op2 + 1), count: op1 + 1)
                  for a in 0...op1 {
                      for b in 0...op2 {
                          let cur = dp[a][b]
                          if cur == inf { continue }
                          nd[a][b] = min(nd[a][b], cur + x)
                          if a < op1 { nd[a + 1][b] = min(nd[a + 1][b], cur + half) }
                          if sub >= 0 && b < op2 { nd[a][b + 1] = min(nd[a][b + 1], cur + sub) }
                          if both >= 0 && a < op1 && b < op2 { nd[a + 1][b + 1] = min(nd[a + 1][b + 1], cur + both) }
                      }
                  }
                  dp = nd
              }
              var best = inf
              for row in dp { for v in row { best = min(best, v) } }
              return best
          }
        `,
        rust: code`
          fn minArraySum(nums: Vec<i32>, k: i32, op1: i32, op2: i32) -> i32 {
              let inf = std::i32::MAX / 2;
              let (o1, o2) = (op1 as usize, op2 as usize);
              let mut dp = vec![vec![inf; o2 + 1]; o1 + 1];
              dp[0][0] = 0;
              for &x in &nums {
                  let half = (x + 1) / 2;
                  let sub = if x >= k { x - k } else { -1 };
                  let mut both = -1;
                  if half >= k {
                      both = half - k;
                  }
                  if x >= k {
                      let v = (x - k + 1) / 2;
                      if both < 0 || v < both {
                          both = v;
                      }
                  }
                  let mut nd = vec![vec![inf; o2 + 1]; o1 + 1];
                  for a in 0..=o1 {
                      for b in 0..=o2 {
                          let cur = dp[a][b];
                          if cur == inf {
                              continue;
                          }
                          nd[a][b] = nd[a][b].min(cur + x);
                          if a < o1 {
                              nd[a + 1][b] = nd[a + 1][b].min(cur + half);
                          }
                          if sub >= 0 && b < o2 {
                              nd[a][b + 1] = nd[a][b + 1].min(cur + sub);
                          }
                          if both >= 0 && a < o1 && b < o2 {
                              nd[a + 1][b + 1] = nd[a + 1][b + 1].min(cur + both);
                          }
                      }
                  }
                  dp = nd;
              }
              *dp.iter().map(|row| row.iter().min().unwrap()).min().unwrap()
          }
        `,
        php: code`
          function minArraySum($nums, $k, $op1, $op2) {
              $INF = PHP_INT_MAX;
              $dp = array_fill(0, $op1 + 1, array_fill(0, $op2 + 1, $INF));
              $dp[0][0] = 0;
              foreach ($nums as $x) {
                  $half = intdiv($x + 1, 2);
                  $sub = $x >= $k ? $x - $k : -1;
                  $both = -1;
                  if ($half >= $k) $both = $half - $k;
                  if ($x >= $k) {
                      $v = intdiv($x - $k + 1, 2);
                      if ($both < 0 || $v < $both) $both = $v;
                  }
                  $nd = array_fill(0, $op1 + 1, array_fill(0, $op2 + 1, $INF));
                  for ($a = 0; $a <= $op1; $a++) {
                      for ($b = 0; $b <= $op2; $b++) {
                          $cur = $dp[$a][$b];
                          if ($cur === $INF) continue;
                          if ($cur + $x < $nd[$a][$b]) $nd[$a][$b] = $cur + $x;
                          if ($a < $op1 && $cur + $half < $nd[$a + 1][$b]) $nd[$a + 1][$b] = $cur + $half;
                          if ($sub >= 0 && $b < $op2 && $cur + $sub < $nd[$a][$b + 1]) $nd[$a][$b + 1] = $cur + $sub;
                          if ($both >= 0 && $a < $op1 && $b < $op2 && $cur + $both < $nd[$a + 1][$b + 1]) $nd[$a + 1][$b + 1] = $cur + $both;
                      }
                  }
                  $dp = $nd;
              }
              $best = $INF;
              foreach ($dp as $row) foreach ($row as $v) if ($v < $best) $best = $v;
              return $best;
          }
        `,
        ruby: code`
          def minArraySum(nums, k, op1, op2)
            inf = Float::INFINITY
            dp = Array.new(op1 + 1) { Array.new(op2 + 1, inf) }
            dp[0][0] = 0
            nums.each do |x|
              half = (x + 1) / 2
              sub = x >= k ? x - k : nil
              both = nil
              both = half - k if half >= k
              if x >= k
                v = (x - k + 1) / 2
                both = v if both.nil? || v < both
              end
              nd = Array.new(op1 + 1) { Array.new(op2 + 1, inf) }
              (0..op1).each do |a|
                (0..op2).each do |b|
                  cur = dp[a][b]
                  next if cur == inf
                  nd[a][b] = cur + x if cur + x < nd[a][b]
                  nd[a + 1][b] = cur + half if a < op1 && cur + half < nd[a + 1][b]
                  nd[a][b + 1] = cur + sub if sub && b < op2 && cur + sub < nd[a][b + 1]
                  nd[a + 1][b + 1] = cur + both if both && a < op1 && b < op2 && cur + both < nd[a + 1][b + 1]
                end
              end
              dp = nd
            end
            dp.flatten.min
          end
        `,
      },
    };
  })(),

  // ── Count Beautiful Splits in an Array (LC 3388) ──────────────────
  (() => {
    const ref = (nums: number[]) => {
      // Every split, with the prefix conditions checked element by element.
      const n = nums.length;
      const isPrefix = (a: number, la: number, b: number, lb: number) => {
        if (la > lb) return false;
        for (let t = 0; t < la; t++) if (nums[a + t] !== nums[b + t]) return false;
        return true;
      };
      let count = 0;
      for (let i = 1; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (isPrefix(0, i, i, j - i) || isPrefix(i, j - i, j, n - j)) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-beautiful-splits-in-an-array",
      title: "Count Beautiful Splits in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Google"],
      signature: { funcName: "beautifulSplits", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums`. A split of `nums` into three **non-empty** consecutive parts `nums1`, `nums2` and `nums3` (so that `nums = nums1 + nums2 + nums3`) is **beautiful** if at least one of the following holds:\n\n- `nums1` is a prefix of `nums2`, or\n- `nums2` is a prefix of `nums3`.\n\nReturn the number of beautiful splits.",
        [
          { in: "nums = [1,1,2,1]", out: "2", note: "[1] | [1,2] | [1] works because [1] is a prefix of [1,2]; [1] | [1] | [2,1] works too." },
          { in: "nums = [1,2,3,4]", out: "0" },
          { in: "nums = [1,1,1]", out: "1", note: "The only split is [1] | [1] | [1], and [1] is a prefix of [1]." },
        ],
        ["1 <= nums.length <= 5000", "0 <= nums[i] <= 50"]),
      hints: [
        "A split is fixed by two cut points: `nums2` starts at `i` and `nums3` starts at `j` (`1 <= i < j < n`). That is only `O(n^2)` splits — the comparisons are the expensive part.",
        "\"`A` is a prefix of `B`\" for two suffixes of the same array is a longest-common-prefix question: it holds when `|A| <= |B|` and `lcp(start of A, start of B) >= |A|`.",
        "Precompute `lcp[a][b]` for all pairs of start positions with `lcp[a][b] = nums[a] == nums[b] ? lcp[a + 1][b + 1] + 1 : 0`, filled from the back.",
      ],
      editorial: explain({
        idea: "There are only `O(n^2)` splits, so each must be checked in `O(1)`. Both conditions compare two subarrays that start at known positions, which is exactly what a longest-common-prefix table over pairs of suffixes answers.",
        steps: [
          "Fill `lcp[a][b]` (for `a < b`) from the end: `lcp[a][b] = lcp[a + 1][b + 1] + 1` when `nums[a] == nums[b]`, else 0.",
          "For each `i` in `1..n-2` (start of `nums2`) and `j` in `i+1..n-1` (start of `nums3`):",
          "Condition 1: `i <= j - i` and `lcp[0][i] >= i` (`nums1` has length `i`).",
          "Condition 2: `j - i <= n - j` and `lcp[i][j] >= j - i` (`nums2` has length `j - i`).",
          "Count the splits where either condition holds.",
        ],
        why: "`A` is a prefix of `B` exactly when `A` is not longer than `B` and their first `|A|` elements agree, which is `lcp >= |A|` for the suffixes where they start. The recurrence for `lcp` is the standard one: two suffixes share a prefix of length `L + 1` iff their first elements match and the suffixes after them share `L`.",
        time: "O(n^2)",
        space: "O(n^2)",
        pitfalls: [
          "Count a split once even when both conditions hold — use `or`, not two separate counters.",
          "Check the length condition too: `lcp` alone can exceed the length of the shorter part.",
        ],
      }),
      examples: [
        { input: "[1,1,2,1]", expectedOutput: "2" },
        { input: "[1,2,3,4]", expectedOutput: "0" },
        { input: "[1,1,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 6, 15, 30]));
        const top = pick(rng, [0, 1, 2, 50]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def beautifulSplits(nums: List[int]) -> int:
              n = len(nums)
              lcp = [[0] * (n + 1) for _ in range(n + 1)]
              for a in range(n - 1, -1, -1):
                  for b in range(n - 1, a, -1):
                      if nums[a] == nums[b]:
                          lcp[a][b] = lcp[a + 1][b + 1] + 1
              count = 0
              for i in range(1, n - 1):
                  first = lcp[0][i] >= i
                  for j in range(i + 1, n):
                      if (first and i <= j - i) or (j - i <= n - j and lcp[i][j] >= j - i):
                          count += 1
              return count
        `,
        javascript: code`
          var beautifulSplits = function(nums) {
              var n = nums.length;
              var lcp = [];
              for (var r = 0; r <= n; r++) lcp.push(new Array(n + 1).fill(0));
              for (var a = n - 1; a >= 0; a--) {
                  for (var b = n - 1; b > a; b--) {
                      if (nums[a] === nums[b]) lcp[a][b] = lcp[a + 1][b + 1] + 1;
                  }
              }
              var count = 0;
              for (var i = 1; i < n - 1; i++) {
                  var first = lcp[0][i] >= i;
                  for (var j = i + 1; j < n; j++) {
                      if ((first && i <= j - i) || (j - i <= n - j && lcp[i][j] >= j - i)) count++;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function beautifulSplits(nums: number[]): number {
              var n = nums.length;
              var lcp: number[][] = [];
              for (var r = 0; r <= n; r++) {
                  var row: number[] = [];
                  for (var c = 0; c <= n; c++) row.push(0);
                  lcp.push(row);
              }
              for (var a = n - 1; a >= 0; a--) {
                  for (var b = n - 1; b > a; b--) {
                      if (nums[a] === nums[b]) lcp[a][b] = lcp[a + 1][b + 1] + 1;
                  }
              }
              var count = 0;
              for (var i = 1; i < n - 1; i++) {
                  var first = lcp[0][i] >= i;
                  for (var j = i + 1; j < n; j++) {
                      if ((first && i <= j - i) || (j - i <= n - j && lcp[i][j] >= j - i)) count++;
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int beautifulSplits(int[] nums) {
              int n = nums.length;
              int[][] lcp = new int[n + 1][n + 1];
              for (int a = n - 1; a >= 0; a--) {
                  for (int b = n - 1; b > a; b--) {
                      if (nums[a] == nums[b]) lcp[a][b] = lcp[a + 1][b + 1] + 1;
                  }
              }
              int count = 0;
              for (int i = 1; i < n - 1; i++) {
                  boolean first = lcp[0][i] >= i;
                  for (int j = i + 1; j < n; j++) {
                      if ((first && i <= j - i) || (j - i <= n - j && lcp[i][j] >= j - i)) count++;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int beautifulSplits(vector<int>& nums) {
              int n = nums.size();
              vector<vector<int>> lcp(n + 1, vector<int>(n + 1, 0));
              for (int a = n - 1; a >= 0; a--) {
                  for (int b = n - 1; b > a; b--) {
                      if (nums[a] == nums[b]) lcp[a][b] = lcp[a + 1][b + 1] + 1;
                  }
              }
              int count = 0;
              for (int i = 1; i < n - 1; i++) {
                  bool first = lcp[0][i] >= i;
                  for (int j = i + 1; j < n; j++) {
                      if ((first && i <= j - i) || (j - i <= n - j && lcp[i][j] >= j - i)) count++;
                  }
              }
              return count;
          }
        `,
        c: code`
          int beautifulSplits(int* nums, int numsSize) {
              int n = numsSize, W = n + 1;
              int* lcp = (int*) calloc((size_t) W * W, sizeof(int));
              for (int a = n - 1; a >= 0; a--) {
                  for (int b = n - 1; b > a; b--) {
                      if (nums[a] == nums[b]) lcp[a * W + b] = lcp[(a + 1) * W + b + 1] + 1;
                  }
              }
              int count = 0;
              for (int i = 1; i < n - 1; i++) {
                  int first = lcp[i] >= i;
                  for (int j = i + 1; j < n; j++) {
                      if ((first && i <= j - i) || (j - i <= n - j && lcp[i * W + j] >= j - i)) count++;
                  }
              }
              free(lcp);
              return count;
          }
        `,
        csharp: code`
          public static int BeautifulSplits(int[] nums)
          {
              int n = nums.Length;
              int[,] lcp = new int[n + 1, n + 1];
              for (int a = n - 1; a >= 0; a--)
              {
                  for (int b = n - 1; b > a; b--)
                  {
                      if (nums[a] == nums[b]) lcp[a, b] = lcp[a + 1, b + 1] + 1;
                  }
              }
              int count = 0;
              for (int i = 1; i < n - 1; i++)
              {
                  bool first = lcp[0, i] >= i;
                  for (int j = i + 1; j < n; j++)
                  {
                      if ((first && i <= j - i) || (j - i <= n - j && lcp[i, j] >= j - i)) count++;
                  }
              }
              return count;
          }
        `,
        go: code`
          func beautifulSplits(nums []int) int {
              n := len(nums)
              lcp := make([][]int, n+1)
              for r := range lcp {
                  lcp[r] = make([]int, n+1)
              }
              for a := n - 1; a >= 0; a-- {
                  for b := n - 1; b > a; b-- {
                      if nums[a] == nums[b] {
                          lcp[a][b] = lcp[a+1][b+1] + 1
                      }
                  }
              }
              count := 0
              for i := 1; i < n-1; i++ {
                  first := lcp[0][i] >= i
                  for j := i + 1; j < n; j++ {
                      if (first && i <= j-i) || (j-i <= n-j && lcp[i][j] >= j-i) {
                          count++
                      }
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun beautifulSplits(nums: IntArray): Int {
              val n = nums.size
              val lcp = Array(n + 1) { IntArray(n + 1) }
              for (a in n - 1 downTo 0) {
                  for (b in n - 1 downTo a + 1) {
                      if (nums[a] == nums[b]) lcp[a][b] = lcp[a + 1][b + 1] + 1
                  }
              }
              var count = 0
              for (i in 1 until n - 1) {
                  val first = lcp[0][i] >= i
                  for (j in i + 1 until n) {
                      if ((first && i <= j - i) || (j - i <= n - j && lcp[i][j] >= j - i)) count++
                  }
              }
              return count
          }
        `,
        swift: code`
          func beautifulSplits(_ nums: [Int]) -> Int {
              let n = nums.count
              var lcp = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: n + 1)
              var a = n - 1
              while a >= 0 {
                  var b = n - 1
                  while b > a {
                      if nums[a] == nums[b] { lcp[a][b] = lcp[a + 1][b + 1] + 1 }
                      b -= 1
                  }
                  a -= 1
              }
              var count = 0
              var i = 1
              while i < n - 1 {
                  let first = lcp[0][i] >= i
                  var j = i + 1
                  while j < n {
                      if (first && i <= j - i) || (j - i <= n - j && lcp[i][j] >= j - i) { count += 1 }
                      j += 1
                  }
                  i += 1
              }
              return count
          }
        `,
        rust: code`
          fn beautifulSplits(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut lcp = vec![vec![0usize; n + 1]; n + 1];
              for a in (0..n).rev() {
                  for b in (a + 1..n).rev() {
                      if nums[a] == nums[b] {
                          lcp[a][b] = lcp[a + 1][b + 1] + 1;
                      }
                  }
              }
              let mut count = 0i32;
              for i in 1..n.saturating_sub(1) {
                  let first = lcp[0][i] >= i;
                  for j in i + 1..n {
                      if (first && i <= j - i) || (j - i <= n - j && lcp[i][j] >= j - i) {
                          count += 1;
                      }
                  }
              }
              count
          }
        `,
        php: code`
          function beautifulSplits($nums) {
              $n = count($nums);
              $lcp = array_fill(0, $n + 1, array_fill(0, $n + 1, 0));
              for ($a = $n - 1; $a >= 0; $a--) {
                  for ($b = $n - 1; $b > $a; $b--) {
                      if ($nums[$a] == $nums[$b]) $lcp[$a][$b] = $lcp[$a + 1][$b + 1] + 1;
                  }
              }
              $count = 0;
              for ($i = 1; $i < $n - 1; $i++) {
                  $first = $lcp[0][$i] >= $i;
                  for ($j = $i + 1; $j < $n; $j++) {
                      if (($first && $i <= $j - $i) || ($j - $i <= $n - $j && $lcp[$i][$j] >= $j - $i)) $count++;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def beautifulSplits(nums)
            n = nums.length
            lcp = Array.new(n + 1) { Array.new(n + 1, 0) }
            (n - 1).downto(0) do |a|
              (n - 1).downto(a + 1) do |b|
                lcp[a][b] = lcp[a + 1][b + 1] + 1 if nums[a] == nums[b]
              end
            end
            count = 0
            (1...(n - 1)).each do |i|
              first = lcp[0][i] >= i
              ((i + 1)...n).each do |j|
                count += 1 if (first && i <= j - i) || (j - i <= n - j && lcp[i][j] >= j - i)
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Count Paths With the Given XOR Value (LC 3393) ────────────────
  (() => {
    const MOD = 1000000007;
    const brute = (grid: number[][], k: number) => {
      const m = grid.length, n = grid[0].length;
      let count = 0;
      const go = (i: number, j: number, x: number) => {
        x ^= grid[i][j];
        if (i === m - 1 && j === n - 1) { if (x === k) count++; return; }
        if (i + 1 < m) go(i + 1, j, x);
        if (j + 1 < n) go(i, j + 1, x);
      };
      go(0, 0, 0);
      return count % MOD;
    };
    const table = (grid: number[][], k: number) => {
      const m = grid.length, n = grid[0].length;
      const dp: number[][][] = Array.from({ length: m }, () => Array.from({ length: n }, () => new Array(16).fill(0)));
      dp[0][0][grid[0][0]] = 1;
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (i === 0 && j === 0) continue;
        for (let x = 0; x < 16; x++) {
          const c = ((i > 0 ? dp[i - 1][j][x] : 0) + (j > 0 ? dp[i][j - 1][x] : 0)) % MOD;
          dp[i][j][x ^ grid[i][j]] = c;
        }
      }
      return dp[m - 1][n - 1][k];
    };
    const paths = (m: number, n: number) => { let c = 1; for (let t = 1; t < m; t++) c = (c * (n - 1 + t)) / t; return c; };
    const ref = (grid: number[][], k: number) => (paths(grid.length, grid[0].length) <= 4000 ? brute(grid, k) : table(grid, k));
    return {
      slug: "count-paths-with-the-given-xor-value",
      title: "Count Paths With the Given XOR Value",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Matrix", "Google"],
      signature: { funcName: "countPathsWithXorValue", params: [{ name: "grid", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` integer matrix `grid` and an integer `k`.\n\nCount the paths from the top-left cell `(0, 0)` to the bottom-right cell `(m - 1, n - 1)` that move only **right** or **down** at each step, such that the **XOR of all the values** on the path (both ends included) equals `k`.\n\nReturn the count **modulo** `10^9 + 7`.",
        [
          { in: "grid = [[2,1,5],[7,10,0],[12,6,4]], k = 11", out: "3", note: "2→7→12→6→4, 2→7→10→0→4 and 2→1→10→6→4 all XOR to 11." },
          { in: "grid = [[1,3,3,3],[0,3,3,2],[3,0,1,1]], k = 2", out: "5" },
          { in: "grid = [[1,1,1,2],[3,0,3,2],[3,0,2,2]], k = 10", out: "0" },
        ],
        ["1 <= m == grid.length <= 300", "1 <= n == grid[r].length <= 300", "0 <= grid[r][c] < 16", "0 <= k < 16"]),
      hints: [
        "Counting all paths with a fixed sum would be hard, but here every value is below 16 — so every XOR along a path is below 16 too.",
        "Add the running XOR to the state: `dp[i][j][x]` = number of paths from `(0, 0)` to `(i, j)` whose XOR is `x`.",
        "A path reaching `(i, j)` with XOR `x ^ grid[i][j]` came from above or from the left with XOR `x`: `dp[i][j][x ^ grid[i][j]] = dp[i - 1][j][x] + dp[i][j - 1][x]`.",
      ],
      editorial: explain({
        idea: "The usual grid-path DP counts paths per cell; here the count must be split by the XOR so far. Because all values are below 16, there are only 16 possible XORs, so each cell holds 16 counters.",
        steps: [
          "Set `dp[0][0][grid[0][0]] = 1`.",
          "Visit cells row by row; for each cell `(i, j)` and each `x` in `0..15`, set `dp[i][j][x ^ grid[i][j]] = (dp[i - 1][j][x] + dp[i][j - 1][x]) mod 10^9 + 7`, treating missing neighbours as 0.",
          "Return `dp[m - 1][n - 1][k]`.",
        ],
        why: "Every path to `(i, j)` other than the start enters from exactly one of the two neighbours, and its XOR is the neighbour path's XOR combined with `grid[i][j]`. Since `x -> x ^ v` is a bijection on `0..15`, each neighbour state feeds exactly one state of the cell, so the counts add without double counting.",
        time: "O(m · n · 16)",
        space: "O(m · n · 16)",
        pitfalls: [
          "Include both the start and the end cell values in the XOR.",
          "Reduce modulo `10^9 + 7` — path counts in a 300 × 300 grid are astronomically large.",
        ],
      }),
      examples: [
        { input: "[[2,1,5],[7,10,0],[12,6,4]]\n11", expectedOutput: "3" },
        { input: "[[1,3,3,3],[0,3,3,2],[3,0,1,1]]\n2", expectedOutput: "5" },
        { input: "[[1,1,1,2],[3,0,3,2],[3,0,2,2]]\n10", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.08;
        const m = big ? ri(rng, 16, 22) : ri(rng, 1, pick(rng, [1, 3, 5, 7]));
        const n = big ? ri(rng, 16, 22) : ri(rng, 1, pick(rng, [1, 3, 5, 7]));
        const top = pick(rng, [0, 1, 3, 15]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 0, top)));
        const k = ri(rng, 0, pick(rng, [top, 15]));
        return { input: `${fmtIntMat(grid)}\n${k}`, expectedOutput: String(ref(grid, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countPathsWithXorValue(grid: List[List[int]], k: int) -> int:
              MOD = 10**9 + 7
              m, n = len(grid), len(grid[0])
              dp = [[[0] * 16 for _ in range(n)] for _ in range(m)]
              dp[0][0][grid[0][0]] = 1
              for i in range(m):
                  for j in range(n):
                      if i == 0 and j == 0:
                          continue
                      v = grid[i][j]
                      up = dp[i - 1][j] if i > 0 else None
                      left = dp[i][j - 1] if j > 0 else None
                      cur = dp[i][j]
                      for x in range(16):
                          c = 0
                          if up is not None:
                              c += up[x]
                          if left is not None:
                              c += left[x]
                          cur[x ^ v] = c % MOD
              return dp[m - 1][n - 1][k]
        `,
        javascript: code`
          var countPathsWithXorValue = function(grid, k) {
              var MOD = 1000000007;
              var m = grid.length, n = grid[0].length;
              var dp = [];
              for (var i = 0; i < m; i++) {
                  var row = [];
                  for (var j = 0; j < n; j++) row.push(new Array(16).fill(0));
                  dp.push(row);
              }
              dp[0][0][grid[0][0]] = 1;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      if (r === 0 && c === 0) continue;
                      var v = grid[r][c];
                      for (var x = 0; x < 16; x++) {
                          var cnt = 0;
                          if (r > 0) cnt += dp[r - 1][c][x];
                          if (c > 0) cnt += dp[r][c - 1][x];
                          dp[r][c][x ^ v] = cnt % MOD;
                      }
                  }
              }
              return dp[m - 1][n - 1][k];
          };
        `,
        typescript: code`
          function countPathsWithXorValue(grid: number[][], k: number): number {
              var MOD = 1000000007;
              var m = grid.length, n = grid[0].length;
              var dp: number[][][] = [];
              for (var i = 0; i < m; i++) {
                  var row: number[][] = [];
                  for (var j = 0; j < n; j++) {
                      var cell: number[] = [];
                      for (var q = 0; q < 16; q++) cell.push(0);
                      row.push(cell);
                  }
                  dp.push(row);
              }
              dp[0][0][grid[0][0]] = 1;
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      if (r === 0 && c === 0) continue;
                      var v = grid[r][c];
                      for (var x = 0; x < 16; x++) {
                          var cnt = 0;
                          if (r > 0) cnt += dp[r - 1][c][x];
                          if (c > 0) cnt += dp[r][c - 1][x];
                          dp[r][c][x ^ v] = cnt % MOD;
                      }
                  }
              }
              return dp[m - 1][n - 1][k];
          }
        `,
        java: code`
          public static int countPathsWithXorValue(int[][] grid, int k) {
              final int MOD = 1000000007;
              int m = grid.length, n = grid[0].length;
              int[][][] dp = new int[m][n][16];
              dp[0][0][grid[0][0]] = 1;
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      if (i == 0 && j == 0) continue;
                      int v = grid[i][j];
                      for (int x = 0; x < 16; x++) {
                          long c = 0;
                          if (i > 0) c += dp[i - 1][j][x];
                          if (j > 0) c += dp[i][j - 1][x];
                          dp[i][j][x ^ v] = (int) (c % MOD);
                      }
                  }
              }
              return dp[m - 1][n - 1][k];
          }
        `,
        cpp: code`
          int countPathsWithXorValue(vector<vector<int>>& grid, int k) {
              const int MOD = 1000000007;
              int m = grid.size(), n = grid[0].size();
              vector<vector<array<int, 16>>> dp(m, vector<array<int, 16>>(n));
              for (auto& row : dp) for (auto& cell : row) cell.fill(0);
              dp[0][0][grid[0][0]] = 1;
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      if (i == 0 && j == 0) continue;
                      int v = grid[i][j];
                      for (int x = 0; x < 16; x++) {
                          long long c = 0;
                          if (i > 0) c += dp[i - 1][j][x];
                          if (j > 0) c += dp[i][j - 1][x];
                          dp[i][j][x ^ v] = (int) (c % MOD);
                      }
                  }
              }
              return dp[m - 1][n - 1][k];
          }
        `,
        c: code`
          int countPathsWithXorValue(int** grid, int gridSize, int* gridColSize, int k) {
              const long long MOD = 1000000007LL;
              int m = gridSize, n = gridColSize[0];
              int* dp = (int*) calloc((size_t) m * n * 16, sizeof(int));
              dp[grid[0][0]] = 1;
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      if (i == 0 && j == 0) continue;
                      int v = grid[i][j];
                      int* cur = dp + (i * n + j) * 16;
                      for (int x = 0; x < 16; x++) {
                          long long c = 0;
                          if (i > 0) c += dp[((i - 1) * n + j) * 16 + x];
                          if (j > 0) c += dp[(i * n + j - 1) * 16 + x];
                          cur[x ^ v] = (int) (c % MOD);
                      }
                  }
              }
              int ans = dp[((m - 1) * n + n - 1) * 16 + k];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int CountPathsWithXorValue(int[][] grid, int k)
          {
              const int MOD = 1000000007;
              int m = grid.Length, n = grid[0].Length;
              int[,,] dp = new int[m, n, 16];
              dp[0, 0, grid[0][0]] = 1;
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      if (i == 0 && j == 0) continue;
                      int v = grid[i][j];
                      for (int x = 0; x < 16; x++)
                      {
                          long c = 0;
                          if (i > 0) c += dp[i - 1, j, x];
                          if (j > 0) c += dp[i, j - 1, x];
                          dp[i, j, x ^ v] = (int) (c % MOD);
                      }
                  }
              }
              return dp[m - 1, n - 1, k];
          }
        `,
        go: code`
          func countPathsWithXorValue(grid [][]int, k int) int {
              const mod = 1000000007
              m, n := len(grid), len(grid[0])
              dp := make([][][16]int, m)
              for i := range dp {
                  dp[i] = make([][16]int, n)
              }
              dp[0][0][grid[0][0]] = 1
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      if i == 0 && j == 0 {
                          continue
                      }
                      v := grid[i][j]
                      for x := 0; x < 16; x++ {
                          c := 0
                          if i > 0 {
                              c += dp[i-1][j][x]
                          }
                          if j > 0 {
                              c += dp[i][j-1][x]
                          }
                          dp[i][j][x^v] = c % mod
                      }
                  }
              }
              return dp[m-1][n-1][k]
          }
        `,
        kotlin: code`
          fun countPathsWithXorValue(grid: Array<IntArray>, k: Int): Int {
              val modulus = 1000000007L
              val m = grid.size
              val n = grid[0].size
              val dp = Array(m) { Array(n) { IntArray(16) } }
              dp[0][0][grid[0][0]] = 1
              for (i in 0 until m) {
                  for (j in 0 until n) {
                      if (i == 0 && j == 0) continue
                      val v = grid[i][j]
                      for (x in 0 until 16) {
                          var c = 0L
                          if (i > 0) c += dp[i - 1][j][x]
                          if (j > 0) c += dp[i][j - 1][x]
                          dp[i][j][x xor v] = (c % modulus).toInt()
                      }
                  }
              }
              return dp[m - 1][n - 1][k]
          }
        `,
        swift: code`
          func countPathsWithXorValue(_ grid: [[Int]], _ k: Int) -> Int {
              let modulus = 1000000007
              let m = grid.count, n = grid[0].count
              var dp = [[Int]](repeating: [Int](repeating: 0, count: 16), count: m * n)
              dp[0][grid[0][0]] = 1
              for i in 0..<m {
                  for j in 0..<n {
                      if i == 0 && j == 0 { continue }
                      let v = grid[i][j]
                      var cell = [Int](repeating: 0, count: 16)
                      for x in 0..<16 {
                          var c = 0
                          if i > 0 { c += dp[(i - 1) * n + j][x] }
                          if j > 0 { c += dp[i * n + j - 1][x] }
                          cell[x ^ v] = c % modulus
                      }
                      dp[i * n + j] = cell
                  }
              }
              return dp[m * n - 1][k]
          }
        `,
        rust: code`
          fn countPathsWithXorValue(grid: Vec<Vec<i32>>, k: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let m = grid.len();
              let n = grid[0].len();
              let mut dp = vec![vec![[0i64; 16]; n]; m];
              dp[0][0][grid[0][0] as usize] = 1;
              for i in 0..m {
                  for j in 0..n {
                      if i == 0 && j == 0 {
                          continue;
                      }
                      let v = grid[i][j] as usize;
                      for x in 0..16 {
                          let mut c = 0i64;
                          if i > 0 {
                              c += dp[i - 1][j][x];
                          }
                          if j > 0 {
                              c += dp[i][j - 1][x];
                          }
                          dp[i][j][x ^ v] = c % modulus;
                      }
                  }
              }
              dp[m - 1][n - 1][k as usize] as i32
          }
        `,
        php: code`
          function countPathsWithXorValue($grid, $k) {
              $MOD = 1000000007;
              $m = count($grid);
              $n = count($grid[0]);
              $dp = array_fill(0, $m * $n, array_fill(0, 16, 0));
              $dp[0][$grid[0][0]] = 1;
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      if ($i == 0 && $j == 0) continue;
                      $v = $grid[$i][$j];
                      $cell = array_fill(0, 16, 0);
                      for ($x = 0; $x < 16; $x++) {
                          $c = 0;
                          if ($i > 0) $c += $dp[($i - 1) * $n + $j][$x];
                          if ($j > 0) $c += $dp[$i * $n + $j - 1][$x];
                          $cell[$x ^ $v] = $c % $MOD;
                      }
                      $dp[$i * $n + $j] = $cell;
                  }
              }
              return $dp[$m * $n - 1][$k];
          }
        `,
        ruby: code`
          def countPathsWithXorValue(grid, k)
            mod = 1_000_000_007
            m = grid.length
            n = grid[0].length
            dp = Array.new(m) { Array.new(n) { Array.new(16, 0) } }
            dp[0][0][grid[0][0]] = 1
            m.times do |i|
              n.times do |j|
                next if i == 0 && j == 0
                v = grid[i][j]
                cell = dp[i][j]
                up = i > 0 ? dp[i - 1][j] : nil
                left = j > 0 ? dp[i][j - 1] : nil
                16.times do |x|
                  c = 0
                  c += up[x] if up
                  c += left[x] if left
                  cell[x ^ v] = c % mod
                end
              end
            end
            dp[m - 1][n - 1][k]
          end
        `,
      },
    };
  })(),

  // ── Maximum Amount of Money Robot Can Earn (LC 3418) ──────────────
  (() => {
    const ref = (coins: number[][]) => {
      // Every path; neutralise its (up to) two most negative cells.
      const m = coins.length, n = coins[0].length;
      let best = -Infinity;
      const path: number[] = [];
      const go = (i: number, j: number) => {
        path.push(coins[i][j]);
        if (i === m - 1 && j === n - 1) {
          const neg = path.filter((v) => v < 0).sort((a, b) => a - b);
          let total = path.reduce((s, v) => s + v, 0);
          for (let t = 0; t < Math.min(2, neg.length); t++) total -= neg[t];
          best = Math.max(best, total);
        } else {
          if (i + 1 < m) go(i + 1, j);
          if (j + 1 < n) go(i, j + 1);
        }
        path.pop();
      };
      go(0, 0);
      return best;
    };
    return {
      slug: "maximum-amount-of-money-robot-can-earn",
      title: "Maximum Amount of Money Robot Can Earn",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon", "Google"],
      signature: { funcName: "maximumAmount", params: [{ name: "coins", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A robot starts at the top-left corner `(0, 0)` of an `m x n` grid `coins` and must reach the bottom-right corner `(m - 1, n - 1)`, moving only **right** or **down**.\n\nWhen the robot enters a cell (including the first and the last) with value `coins[i][j]`:\n\n- if `coins[i][j] >= 0`, it gains that many coins;\n- if `coins[i][j] < 0`, a robber there takes `|coins[i][j]|` coins.\n\nThe robot may **neutralize** the robbers in at most **2** cells of its path; a neutralized cell takes nothing. The robot's total may become negative.\n\nReturn the **maximum** total the robot can end with.",
        [
          { in: "coins = [[0,1,-1],[1,-2,3],[2,-3,4]]", out: "8", note: "Path 0 → 1 → -2 → 3 → 4, neutralizing the -2: 0 + 1 + 0 + 3 + 4 = 8." },
          { in: "coins = [[10,10,10],[10,10,10]]", out: "40", note: "Every path collects 10 four times." },
          { in: "coins = [[-5]]", out: "0", note: "The single robber is neutralized." },
        ],
        ["m == coins.length", "n == coins[i].length", "1 <= m, n <= 500", "-1000 <= coins[i][j] <= 1000"]),
      hints: [
        "Without the neutralizations this is the classic maximum path sum on a grid: `dp[i][j] = coins[i][j] + max(dp[i - 1][j], dp[i][j - 1])`.",
        "The only extra information a path carries is how many neutralizations it has used — 0, 1 or 2.",
        "`dp[i][j][t]` = best total reaching `(i, j)` using at most `t` neutralizations: either take the cell (`best[t] + coins[i][j]`) or, for a robber and `t > 0`, neutralize it (`best[t - 1]`).",
      ],
      editorial: explain({
        idea: "Extend the standard best-path DP with a small third dimension: the number of neutralizations used so far. With only three possible values, the table stays `O(m · n)`.",
        steps: [
          "Let `dp[i][j][t]` be the best total on arrival at `(i, j)` having neutralized at most `t` robbers (`t` in 0..2).",
          "For each cell, let `prev[t]` be the better of the cell above and the cell to the left (or 0 for every `t` at the start cell).",
          "Set `dp[i][j][t] = prev[t] + coins[i][j]`; if `coins[i][j] < 0` and `t > 0`, also try `prev[t - 1]` (neutralize this cell).",
          "Return `dp[m - 1][n - 1][2]`.",
        ],
        why: "A path's total depends only on its cells and which of them were neutralized; the decision at a cell interacts with the future only through how many neutralizations remain. Keeping the best total for each count therefore loses no optimal path, and \"at most `t`\" makes the states monotone so the start cell can use 0 for every `t`.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "The start and end cells count — a robber at `(0, 0)` can be neutralized too.",
          "Neutralizing a non-negative cell only loses coins; only allow it for robbers (or simply never let it win).",
          "Totals can be negative: don't initialise unreachable states with 0.",
        ],
      }),
      examples: [
        { input: "[[0,1,-1],[1,-2,3],[2,-3,4]]", expectedOutput: "8" },
        { input: "[[10,10,10],[10,10,10]]", expectedOutput: "40" },
        { input: "[[-5]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 5, 6]));
        const n = ri(rng, 1, pick(rng, [1, 3, 5, 6]));
        const lo = pick(rng, [-1000, -10, -3, 0]);
        const hi = pick(rng, [1000, 10, 3, -1]);
        const coins = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, Math.min(lo, hi), Math.max(lo, hi))));
        return { input: fmtIntMat(coins), expectedOutput: String(ref(coins)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumAmount(coins: List[List[int]]) -> int:
              m, n = len(coins), len(coins[0])
              NEG = float('-inf')
              dp = [[[NEG] * 3 for _ in range(n)] for _ in range(m)]
              for i in range(m):
                  for j in range(n):
                      if i == 0 and j == 0:
                          prev = [0, 0, 0]
                      else:
                          prev = [NEG] * 3
                          for t in range(3):
                              if i > 0:
                                  prev[t] = max(prev[t], dp[i - 1][j][t])
                              if j > 0:
                                  prev[t] = max(prev[t], dp[i][j - 1][t])
                      v = coins[i][j]
                      for t in range(3):
                          best = prev[t] + v
                          if v < 0 and t > 0:
                              best = max(best, prev[t - 1])
                          dp[i][j][t] = best
              return dp[m - 1][n - 1][2]
        `,
        javascript: code`
          var maximumAmount = function(coins) {
              var m = coins.length, n = coins[0].length;
              var NEG = -1000000000;
              var dp = [];
              for (var i = 0; i < m; i++) {
                  var row = [];
                  for (var j = 0; j < n; j++) row.push([NEG, NEG, NEG]);
                  dp.push(row);
              }
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      var prev = [NEG, NEG, NEG];
                      if (r === 0 && c === 0) prev = [0, 0, 0];
                      for (var t = 0; t < 3; t++) {
                          if (r > 0 && dp[r - 1][c][t] > prev[t]) prev[t] = dp[r - 1][c][t];
                          if (c > 0 && dp[r][c - 1][t] > prev[t]) prev[t] = dp[r][c - 1][t];
                      }
                      var v = coins[r][c];
                      for (var u = 0; u < 3; u++) {
                          var best = prev[u] + v;
                          if (v < 0 && u > 0 && prev[u - 1] > best) best = prev[u - 1];
                          dp[r][c][u] = best;
                      }
                  }
              }
              return dp[m - 1][n - 1][2];
          };
        `,
        typescript: code`
          function maximumAmount(coins: number[][]): number {
              var m = coins.length, n = coins[0].length;
              var NEG = -1000000000;
              var dp: number[][][] = [];
              for (var i = 0; i < m; i++) {
                  var row: number[][] = [];
                  for (var j = 0; j < n; j++) row.push([NEG, NEG, NEG]);
                  dp.push(row);
              }
              for (var r = 0; r < m; r++) {
                  for (var c = 0; c < n; c++) {
                      var prev: number[] = [NEG, NEG, NEG];
                      if (r === 0 && c === 0) prev = [0, 0, 0];
                      for (var t = 0; t < 3; t++) {
                          if (r > 0 && dp[r - 1][c][t] > prev[t]) prev[t] = dp[r - 1][c][t];
                          if (c > 0 && dp[r][c - 1][t] > prev[t]) prev[t] = dp[r][c - 1][t];
                      }
                      var v = coins[r][c];
                      for (var u = 0; u < 3; u++) {
                          var best = prev[u] + v;
                          if (v < 0 && u > 0 && prev[u - 1] > best) best = prev[u - 1];
                          dp[r][c][u] = best;
                      }
                  }
              }
              return dp[m - 1][n - 1][2];
          }
        `,
        java: code`
          public static int maximumAmount(int[][] coins) {
              int m = coins.length, n = coins[0].length;
              final int NEG = -1000000000;
              int[][][] dp = new int[m][n][3];
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      int[] prev = new int[3];
                      if (!(i == 0 && j == 0)) {
                          for (int t = 0; t < 3; t++) {
                              prev[t] = NEG;
                              if (i > 0) prev[t] = Math.max(prev[t], dp[i - 1][j][t]);
                              if (j > 0) prev[t] = Math.max(prev[t], dp[i][j - 1][t]);
                          }
                      }
                      int v = coins[i][j];
                      for (int t = 0; t < 3; t++) {
                          int best = prev[t] + v;
                          if (v < 0 && t > 0) best = Math.max(best, prev[t - 1]);
                          dp[i][j][t] = best;
                      }
                  }
              }
              return dp[m - 1][n - 1][2];
          }
        `,
        cpp: code`
          int maximumAmount(vector<vector<int>>& coins) {
              int m = coins.size(), n = coins[0].size();
              const int NEG = -1000000000;
              vector<vector<array<int, 3>>> dp(m, vector<array<int, 3>>(n));
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      array<int, 3> prev = {0, 0, 0};
                      if (!(i == 0 && j == 0)) {
                          for (int t = 0; t < 3; t++) {
                              prev[t] = NEG;
                              if (i > 0) prev[t] = max(prev[t], dp[i - 1][j][t]);
                              if (j > 0) prev[t] = max(prev[t], dp[i][j - 1][t]);
                          }
                      }
                      int v = coins[i][j];
                      for (int t = 0; t < 3; t++) {
                          int best = prev[t] + v;
                          if (v < 0 && t > 0) best = max(best, prev[t - 1]);
                          dp[i][j][t] = best;
                      }
                  }
              }
              return dp[m - 1][n - 1][2];
          }
        `,
        c: code`
          int maximumAmount(int** coins, int coinsSize, int* coinsColSize) {
              int m = coinsSize, n = coinsColSize[0];
              const int NEG = -1000000000;
              int* dp = (int*) malloc(sizeof(int) * m * n * 3);
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      int prev[3] = {0, 0, 0};
                      if (!(i == 0 && j == 0)) {
                          for (int t = 0; t < 3; t++) {
                              prev[t] = NEG;
                              if (i > 0 && dp[((i - 1) * n + j) * 3 + t] > prev[t]) prev[t] = dp[((i - 1) * n + j) * 3 + t];
                              if (j > 0 && dp[(i * n + j - 1) * 3 + t] > prev[t]) prev[t] = dp[(i * n + j - 1) * 3 + t];
                          }
                      }
                      int v = coins[i][j];
                      for (int t = 0; t < 3; t++) {
                          int best = prev[t] + v;
                          if (v < 0 && t > 0 && prev[t - 1] > best) best = prev[t - 1];
                          dp[(i * n + j) * 3 + t] = best;
                      }
                  }
              }
              int ans = dp[((m - 1) * n + n - 1) * 3 + 2];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MaximumAmount(int[][] coins)
          {
              int m = coins.Length, n = coins[0].Length;
              const int NEG = -1000000000;
              int[,,] dp = new int[m, n, 3];
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      int[] prev = new int[3];
                      if (!(i == 0 && j == 0))
                      {
                          for (int t = 0; t < 3; t++)
                          {
                              prev[t] = NEG;
                              if (i > 0) prev[t] = Math.Max(prev[t], dp[i - 1, j, t]);
                              if (j > 0) prev[t] = Math.Max(prev[t], dp[i, j - 1, t]);
                          }
                      }
                      int v = coins[i][j];
                      for (int t = 0; t < 3; t++)
                      {
                          int best = prev[t] + v;
                          if (v < 0 && t > 0) best = Math.Max(best, prev[t - 1]);
                          dp[i, j, t] = best;
                      }
                  }
              }
              return dp[m - 1, n - 1, 2];
          }
        `,
        go: code`
          func maximumAmount(coins [][]int) int {
              m, n := len(coins), len(coins[0])
              const neg = -1000000000
              dp := make([][][3]int, m)
              for i := range dp {
                  dp[i] = make([][3]int, n)
              }
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      prev := [3]int{0, 0, 0}
                      if !(i == 0 && j == 0) {
                          for t := 0; t < 3; t++ {
                              prev[t] = neg
                              if i > 0 && dp[i-1][j][t] > prev[t] {
                                  prev[t] = dp[i-1][j][t]
                              }
                              if j > 0 && dp[i][j-1][t] > prev[t] {
                                  prev[t] = dp[i][j-1][t]
                              }
                          }
                      }
                      v := coins[i][j]
                      for t := 0; t < 3; t++ {
                          best := prev[t] + v
                          if v < 0 && t > 0 && prev[t-1] > best {
                              best = prev[t-1]
                          }
                          dp[i][j][t] = best
                      }
                  }
              }
              return dp[m-1][n-1][2]
          }
        `,
        kotlin: code`
          fun maximumAmount(coins: Array<IntArray>): Int {
              val m = coins.size
              val n = coins[0].size
              val neg = -1000000000
              val dp = Array(m) { Array(n) { IntArray(3) } }
              for (i in 0 until m) {
                  for (j in 0 until n) {
                      val prev = IntArray(3)
                      if (!(i == 0 && j == 0)) {
                          for (t in 0 until 3) {
                              prev[t] = neg
                              if (i > 0) prev[t] = maxOf(prev[t], dp[i - 1][j][t])
                              if (j > 0) prev[t] = maxOf(prev[t], dp[i][j - 1][t])
                          }
                      }
                      val v = coins[i][j]
                      for (t in 0 until 3) {
                          var best = prev[t] + v
                          if (v < 0 && t > 0) best = maxOf(best, prev[t - 1])
                          dp[i][j][t] = best
                      }
                  }
              }
              return dp[m - 1][n - 1][2]
          }
        `,
        swift: code`
          func maximumAmount(_ coins: [[Int]]) -> Int {
              let m = coins.count, n = coins[0].count
              let neg = -1000000000
              var dp = [[Int]](repeating: [neg, neg, neg], count: m * n)
              for i in 0..<m {
                  for j in 0..<n {
                      var prev = [0, 0, 0]
                      if !(i == 0 && j == 0) {
                          for t in 0..<3 {
                              prev[t] = neg
                              if i > 0 { prev[t] = max(prev[t], dp[(i - 1) * n + j][t]) }
                              if j > 0 { prev[t] = max(prev[t], dp[i * n + j - 1][t]) }
                          }
                      }
                      let v = coins[i][j]
                      var cell = [0, 0, 0]
                      for t in 0..<3 {
                          var best = prev[t] + v
                          if v < 0 && t > 0 { best = max(best, prev[t - 1]) }
                          cell[t] = best
                      }
                      dp[i * n + j] = cell
                  }
              }
              return dp[m * n - 1][2]
          }
        `,
        rust: code`
          fn maximumAmount(coins: Vec<Vec<i32>>) -> i32 {
              let m = coins.len();
              let n = coins[0].len();
              let neg = -1_000_000_000i32;
              let mut dp = vec![vec![[neg; 3]; n]; m];
              for i in 0..m {
                  for j in 0..n {
                      let mut prev = [0i32; 3];
                      if !(i == 0 && j == 0) {
                          for t in 0..3 {
                              prev[t] = neg;
                              if i > 0 {
                                  prev[t] = prev[t].max(dp[i - 1][j][t]);
                              }
                              if j > 0 {
                                  prev[t] = prev[t].max(dp[i][j - 1][t]);
                              }
                          }
                      }
                      let v = coins[i][j];
                      for t in 0..3 {
                          let mut best = prev[t] + v;
                          if v < 0 && t > 0 {
                              best = best.max(prev[t - 1]);
                          }
                          dp[i][j][t] = best;
                      }
                  }
              }
              dp[m - 1][n - 1][2]
          }
        `,
        php: code`
          function maximumAmount($coins) {
              $m = count($coins);
              $n = count($coins[0]);
              $NEG = -1000000000;
              $dp = [];
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      $prev = [0, 0, 0];
                      if (!($i == 0 && $j == 0)) {
                          for ($t = 0; $t < 3; $t++) {
                              $prev[$t] = $NEG;
                              if ($i > 0) $prev[$t] = max($prev[$t], $dp[$i - 1][$j][$t]);
                              if ($j > 0) $prev[$t] = max($prev[$t], $dp[$i][$j - 1][$t]);
                          }
                      }
                      $v = $coins[$i][$j];
                      $cell = [0, 0, 0];
                      for ($t = 0; $t < 3; $t++) {
                          $best = $prev[$t] + $v;
                          if ($v < 0 && $t > 0) $best = max($best, $prev[$t - 1]);
                          $cell[$t] = $best;
                      }
                      $dp[$i][$j] = $cell;
                  }
              }
              return $dp[$m - 1][$n - 1][2];
          }
        `,
        ruby: code`
          def maximumAmount(coins)
            m = coins.length
            n = coins[0].length
            neg = -1_000_000_000
            dp = Array.new(m) { Array.new(n) }
            m.times do |i|
              n.times do |j|
                prev = [0, 0, 0]
                unless i == 0 && j == 0
                  3.times do |t|
                    prev[t] = neg
                    prev[t] = dp[i - 1][j][t] if i > 0 && dp[i - 1][j][t] > prev[t]
                    prev[t] = dp[i][j - 1][t] if j > 0 && dp[i][j - 1][t] > prev[t]
                  end
                end
                v = coins[i][j]
                dp[i][j] = (0...3).map do |t|
                  best = prev[t] + v
                  best = prev[t - 1] if v < 0 && t > 0 && prev[t - 1] > best
                  best
                end
              end
            end
            dp[m - 1][n - 1][2]
          end
        `,
      },
    };
  })(),

  // ── Maximum Frequency After Subarray Operation (LC 3434) ──────────
  (() => {
    const ref = (nums: number[], k: number) => {
      // Every subarray and every shift x that could create a k.
      const n = nums.length;
      let best = 0;
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          for (let x = -49; x <= 49; x++) {
            let c = 0;
            for (let t = 0; t < n; t++) {
              const v = t >= i && t <= j ? nums[t] + x : nums[t];
              if (v === k) c++;
            }
            best = Math.max(best, c);
          }
        }
      }
      return best;
    };
    return {
      slug: "maximum-frequency-after-subarray-operation",
      title: "Maximum Frequency After Subarray Operation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Greedy", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "maxFrequency", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of length `n` and an integer `k`.\n\nYou must perform the following operation **exactly once**: choose a subarray `nums[i..j]` (with `0 <= i <= j <= n - 1`) and an integer `x`, and add `x` to **every** element of that subarray.\n\nReturn the **maximum** possible number of elements equal to `k` (the frequency of `k`) after the operation.",
        [
          { in: "nums = [1,2,3,4,5,6], k = 1", out: "2", note: "Add -5 to [6] (the last element): the array becomes [1,2,3,4,5,1]." },
          { in: "nums = [10,2,3,4,5,5,4,3,2,2], k = 10", out: "4", note: "Add 8 to the subarray [2,3,4,5,5,4,3,2,2] — the four 2s become 10, joining the original 10." },
          { in: "nums = [7], k = 7", out: "1", note: "Adding x = 0 keeps the single 7." },
        ],
        ["1 <= n == nums.length <= 10^5", "1 <= nums[i] <= 50", "1 <= k <= 50"]),
      hints: [
        "With a fixed shift `x`, the elements that become `k` are exactly the copies of `v = k - x` inside the subarray — while the original `k`s inside the subarray stop being `k` (unless `x = 0`).",
        "So for each candidate value `v != k` (only 49 of them), the gain of a subarray is (number of `v` inside) − (number of `k` inside).",
        "Maximise that gain with Kadane's algorithm (`+1` for `v`, `-1` for `k`, `0` otherwise), and add the best gain over all `v` to the original count of `k`.",
      ],
      editorial: explain({
        idea: "Choosing `x` means choosing which value `v = k - x` will turn into `k`. Inside the subarray every `v` becomes a `k` and every original `k` is lost; outside nothing changes. That is a maximum-subarray-sum problem per value `v`, and the values are bounded by 50.",
        steps: [
          "Let `base` be the number of elements equal to `k`.",
          "For each `v` in `1..50` with `v != k`, run Kadane's algorithm over `nums` with weight `+1` for `v`, `-1` for `k` and `0` otherwise, keeping the best non-negative prefix sum ending at each position.",
          "Let `gain` be the largest sum seen over all `v` (at least 0, which corresponds to `x = 0`).",
          "Return `base + gain`.",
        ],
        why: "For a fixed `x != 0` the final frequency of `k` is `base - (k inside) + (v inside)`, so maximising over subarrays is exactly the maximum subarray sum of the ±1 weights. `x = 0` leaves the array unchanged, which the floor of 0 covers, and every other `x` leads to a `v` outside `1..50` that never occurs and gains nothing.",
        time: "O(50 · n)",
        space: "O(1)",
        pitfalls: [
          "Elements equal to `k` inside the chosen subarray are *lost* when `x != 0` — they must count as `-1`.",
          "The operation is mandatory, but `x = 0` is allowed, so the answer is never below `base`.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6]\n1", expectedOutput: "2" },
        { input: "[10,2,3,4,5,5,4,3,2,2]\n10", expectedOutput: "4" },
        { input: "[7]\n7", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 10, 14]));
        const top = pick(rng, [2, 3, 5, 50]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const k = rng() < 0.7 ? ri(rng, 1, top) : ri(rng, 1, 50);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxFrequency(nums: List[int], k: int) -> int:
              base = nums.count(k)
              gain = 0
              for v in set(nums):
                  if v == k:
                      continue
                  cur = 0
                  for x in nums:
                      if x == v:
                          cur += 1
                      elif x == k:
                          cur -= 1
                      if cur < 0:
                          cur = 0
                      elif cur > gain:
                          gain = cur
              return base + gain
        `,
        javascript: code`
          var maxFrequency = function(nums, k) {
              var base = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] === k) base++;
              var gain = 0;
              for (var v = 1; v <= 50; v++) {
                  if (v === k) continue;
                  var cur = 0;
                  for (var j = 0; j < nums.length; j++) {
                      if (nums[j] === v) cur++;
                      else if (nums[j] === k) cur--;
                      if (cur < 0) cur = 0;
                      else if (cur > gain) gain = cur;
                  }
              }
              return base + gain;
          };
        `,
        typescript: code`
          function maxFrequency(nums: number[], k: number): number {
              var base = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] === k) base++;
              var gain = 0;
              for (var v = 1; v <= 50; v++) {
                  if (v === k) continue;
                  var cur = 0;
                  for (var j = 0; j < nums.length; j++) {
                      if (nums[j] === v) cur++;
                      else if (nums[j] === k) cur--;
                      if (cur < 0) cur = 0;
                      else if (cur > gain) gain = cur;
                  }
              }
              return base + gain;
          }
        `,
        java: code`
          public static int maxFrequency(int[] nums, int k) {
              int base = 0;
              for (int x : nums) if (x == k) base++;
              int gain = 0;
              for (int v = 1; v <= 50; v++) {
                  if (v == k) continue;
                  int cur = 0;
                  for (int x : nums) {
                      if (x == v) cur++;
                      else if (x == k) cur--;
                      if (cur < 0) cur = 0;
                      else if (cur > gain) gain = cur;
                  }
              }
              return base + gain;
          }
        `,
        cpp: code`
          int maxFrequency(vector<int>& nums, int k) {
              int base = 0;
              for (int x : nums) if (x == k) base++;
              int gain = 0;
              for (int v = 1; v <= 50; v++) {
                  if (v == k) continue;
                  int cur = 0;
                  for (int x : nums) {
                      if (x == v) cur++;
                      else if (x == k) cur--;
                      if (cur < 0) cur = 0;
                      else if (cur > gain) gain = cur;
                  }
              }
              return base + gain;
          }
        `,
        c: code`
          int maxFrequency(int* nums, int numsSize, int k) {
              int base = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] == k) base++;
              int gain = 0;
              for (int v = 1; v <= 50; v++) {
                  if (v == k) continue;
                  int cur = 0;
                  for (int i = 0; i < numsSize; i++) {
                      if (nums[i] == v) cur++;
                      else if (nums[i] == k) cur--;
                      if (cur < 0) cur = 0;
                      else if (cur > gain) gain = cur;
                  }
              }
              return base + gain;
          }
        `,
        csharp: code`
          public static int MaxFrequency(int[] nums, int k)
          {
              int baseCount = 0;
              foreach (int x in nums) if (x == k) baseCount++;
              int gain = 0;
              for (int v = 1; v <= 50; v++)
              {
                  if (v == k) continue;
                  int cur = 0;
                  foreach (int x in nums)
                  {
                      if (x == v) cur++;
                      else if (x == k) cur--;
                      if (cur < 0) cur = 0;
                      else if (cur > gain) gain = cur;
                  }
              }
              return baseCount + gain;
          }
        `,
        go: code`
          func maxFrequency(nums []int, k int) int {
              base := 0
              for _, x := range nums {
                  if x == k {
                      base++
                  }
              }
              gain := 0
              for v := 1; v <= 50; v++ {
                  if v == k {
                      continue
                  }
                  cur := 0
                  for _, x := range nums {
                      if x == v {
                          cur++
                      } else if x == k {
                          cur--
                      }
                      if cur < 0 {
                          cur = 0
                      } else if cur > gain {
                          gain = cur
                      }
                  }
              }
              return base + gain
          }
        `,
        kotlin: code`
          fun maxFrequency(nums: IntArray, k: Int): Int {
              var base = 0
              for (x in nums) if (x == k) base++
              var gain = 0
              for (v in 1..50) {
                  if (v == k) continue
                  var cur = 0
                  for (x in nums) {
                      if (x == v) cur++ else if (x == k) cur--
                      if (cur < 0) cur = 0 else if (cur > gain) gain = cur
                  }
              }
              return base + gain
          }
        `,
        swift: code`
          func maxFrequency(_ nums: [Int], _ k: Int) -> Int {
              var base = 0
              for x in nums where x == k { base += 1 }
              var gain = 0
              for v in 1...50 where v != k {
                  var cur = 0
                  for x in nums {
                      if x == v { cur += 1 } else if x == k { cur -= 1 }
                      if cur < 0 { cur = 0 } else if cur > gain { gain = cur }
                  }
              }
              return base + gain
          }
        `,
        rust: code`
          fn maxFrequency(nums: Vec<i32>, k: i32) -> i32 {
              let base = nums.iter().filter(|&&x| x == k).count() as i32;
              let mut gain = 0i32;
              for v in 1..=50 {
                  if v == k {
                      continue;
                  }
                  let mut cur = 0i32;
                  for &x in &nums {
                      if x == v {
                          cur += 1;
                      } else if x == k {
                          cur -= 1;
                      }
                      if cur < 0 {
                          cur = 0;
                      } else if cur > gain {
                          gain = cur;
                      }
                  }
              }
              base + gain
          }
        `,
        php: code`
          function maxFrequency($nums, $k) {
              $base = 0;
              foreach ($nums as $x) if ($x == $k) $base++;
              $gain = 0;
              foreach (array_unique($nums) as $v) {
                  if ($v == $k) continue;
                  $cur = 0;
                  foreach ($nums as $x) {
                      if ($x == $v) $cur++;
                      elseif ($x == $k) $cur--;
                      if ($cur < 0) $cur = 0;
                      elseif ($cur > $gain) $gain = $cur;
                  }
              }
              return $base + $gain;
          }
        `,
        ruby: code`
          def maxFrequency(nums, k)
            base = nums.count(k)
            gain = 0
            nums.uniq.each do |v|
              next if v == k
              cur = 0
              nums.each do |x|
                if x == v
                  cur += 1
                elsif x == k
                  cur -= 1
                end
                if cur < 0
                  cur = 0
                elsif cur > gain
                  gain = cur
                end
              end
            end
            base + gain
          end
        `,
      },
    };
  })(),

  // ── Length of Longest V-Shaped Diagonal Segment (LC 3459) ─────────
  (() => {
    const DR = [1, 1, -1, -1], DC = [1, -1, -1, 1];
    const ref = (grid: number[][]) => {
      // From every 1 and every direction: walk straight, then try turning clockwise at each cell.
      const n = grid.length, m = grid[0].length;
      const want = (s: number) => (s === 0 ? 1 : s % 2 === 1 ? 2 : 0);
      const inside = (r: number, c: number) => r >= 0 && r < n && c >= 0 && c < m;
      let best = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
        if (grid[i][j] !== 1) continue;
        for (let d = 0; d < 4; d++) {
          const cells: number[][] = [];
          let r = i, c = j;
          while (inside(r, c) && grid[r][c] === want(cells.length)) { cells.push([r, c]); r += DR[d]; c += DC[d]; }
          best = Math.max(best, cells.length);
          const d2 = (d + 1) % 4;
          for (let p = 0; p < cells.length; p++) {
            let len = p + 1;
            let rr = cells[p][0] + DR[d2], cc = cells[p][1] + DC[d2];
            while (inside(rr, cc) && grid[rr][cc] === want(len)) { len++; rr += DR[d2]; cc += DC[d2]; }
            best = Math.max(best, len);
          }
        }
      }
      return best;
    };
    return {
      slug: "length-of-longest-v-shaped-diagonal-segment",
      title: "Length of Longest V-Shaped Diagonal Segment",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Memoization", "Matrix", "Google"],
      signature: { funcName: "lenOfVDiagonal", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `n x m` matrix `grid` whose cells hold `0`, `1` or `2`.\n\nA **V-shaped diagonal segment** is a path of cells that:\n\n- starts at a cell holding `1`;\n- continues with the repeating sequence `2, 0, 2, 0, ...`;\n- moves along one of the four diagonal directions (down-right, down-left, up-left, up-right) — every step goes one cell in the current direction;\n- may make **at most one** clockwise 90° turn to the next diagonal direction (down-right → down-left → up-left → up-right → down-right), and then keeps going in the new direction while still following the sequence.\n\nReturn the length (number of cells) of the **longest** V-shaped diagonal segment, or `0` if there is none.",
        [
          { in: "grid = [[2,2,1,2,2],[2,0,2,2,0],[2,0,1,1,0],[1,0,2,2,2],[2,0,0,2,2]]", out: "5", note: "(0,2) → (1,3) → (2,4) going down-right, a clockwise turn, then (3,3) → (4,2) going down-left: 1, 2, 0, 2, 0." },
          { in: "grid = [[2,2,2,2,2],[2,0,2,2,0],[2,0,1,1,0],[1,0,2,2,2],[2,0,0,2,2]]", out: "4", note: "(2,3) → (3,2), turn, → (2,1) → (1,0): 1, 2, 0, 2." },
          { in: "grid = [[1]]", out: "1", note: "A lone 1 is a segment of length 1." },
        ],
        ["n == grid.length", "m == grid[i].length", "1 <= n, m <= 500", "grid[i][j] is 0, 1 or 2"]),
      hints: [
        "A segment is determined by its start, its first direction, and where (if anywhere) it turns. The value expected at the next cell depends only on the current cell's value: after 1 or 0 comes 2, after 2 comes 0.",
        "Define `f(i, j, d, canTurn)` = the longest continuation that starts at cell `(i, j)` (already part of the segment) moving in direction `d`. It either steps forward in `d` or, if `canTurn`, steps in the clockwise-next direction and gives up the turn.",
        "Memoise `f` over `n · m · 4 · 2` states, and take `max f(i, j, d, true)` over every cell holding 1 and every direction.",
      ],
      editorial: explain({
        idea: "The future of a segment depends only on where it is, which way it is heading, what value comes next (fixed by the current cell) and whether the turn is still available. That is `8` states per cell, so memoised search over them visits each state once.",
        steps: [
          "Order the directions clockwise: `(1,1), (1,-1), (-1,-1), (-1,1)`; a turn goes from `d` to `(d + 1) mod 4`.",
          "Let `f(i, j, d, t)` be the length of the longest continuation from `(i, j)` inclusive. The next value needed is 0 if `grid[i][j] == 2`, else 2.",
          "`f = 1 + max(f(next in d), and if t: f(next in d + 1 with t = 0))`, counting only neighbours inside the grid that hold the needed value; with no valid neighbour `f = 1`.",
          "Answer `max f(i, j, d, 1)` over cells with `grid[i][j] == 1` and all `d`, or 0 when there is no 1.",
        ],
        why: "Every V-shaped segment is a straight run, an optional clockwise turn at some cell, and a second straight run — exactly the choices `f` branches on. Because the needed value at a cell is determined by that cell's own value (a 1 only appears at the start), the state `(cell, direction, turn left)` captures everything that affects the rest of the segment.",
        time: "O(n · m)",
        space: "O(n · m)",
        pitfalls: [
          "Only clockwise turns count, and only one: track the turn in the state.",
          "The sequence after the start is 2, 0, 2, 0 — a 1 never appears again, so the needed value never depends on the position along the segment.",
          "Deep recursion on a 500 × 500 grid: raise the recursion limit or iterate.",
        ],
      }),
      examples: [
        { input: "[[2,2,1,2,2],[2,0,2,2,0],[2,0,1,1,0],[1,0,2,2,2],[2,0,0,2,2]]", expectedOutput: "5" },
        { input: "[[2,2,2,2,2],[2,0,2,2,0],[2,0,1,1,0],[1,0,2,2,2],[2,0,0,2,2]]", expectedOutput: "4" },
        { input: "[[1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 6, 9]));
        const m = ri(rng, 1, pick(rng, [1, 3, 6, 9]));
        const pOne = pick(rng, [0, 0.05, 0.15]);
        const grid = Array.from({ length: n }, () => Array.from({ length: m }, () => {
          const u = rng();
          return u < pOne ? 1 : u < pOne + (1 - pOne) / 2 ? 2 : 0;
        }));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List
          import sys

          def lenOfVDiagonal(grid: List[List[int]]) -> int:
              sys.setrecursionlimit(10000)
              n, m = len(grid), len(grid[0])
              DR = (1, 1, -1, -1)
              DC = (1, -1, -1, 1)
              memo = {}

              def f(i, j, d, t):
                  key = ((i * m + j) * 4 + d) * 2 + t
                  if key in memo:
                      return memo[key]
                  need = 0 if grid[i][j] == 2 else 2
                  best = 1
                  r, c = i + DR[d], j + DC[d]
                  if 0 <= r < n and 0 <= c < m and grid[r][c] == need:
                      best = 1 + f(r, c, d, t)
                  if t:
                      d2 = (d + 1) % 4
                      r, c = i + DR[d2], j + DC[d2]
                      if 0 <= r < n and 0 <= c < m and grid[r][c] == need:
                          best = max(best, 1 + f(r, c, d2, 0))
                  memo[key] = best
                  return best

              ans = 0
              for i in range(n):
                  for j in range(m):
                      if grid[i][j] == 1:
                          for d in range(4):
                              ans = max(ans, f(i, j, d, 1))
              return ans
        `,
        javascript: code`
          var lenOfVDiagonal = function(grid) {
              var n = grid.length, m = grid[0].length;
              var DR = [1, 1, -1, -1], DC = [1, -1, -1, 1];
              var memo = new Array(n * m * 8).fill(0);
              var f = function(i, j, d, t) {
                  var key = ((i * m + j) * 4 + d) * 2 + t;
                  if (memo[key]) return memo[key];
                  var need = grid[i][j] === 2 ? 0 : 2;
                  var best = 1;
                  var r = i + DR[d], c = j + DC[d];
                  if (r >= 0 && r < n && c >= 0 && c < m && grid[r][c] === need) best = 1 + f(r, c, d, t);
                  if (t) {
                      var d2 = (d + 1) % 4;
                      r = i + DR[d2]; c = j + DC[d2];
                      if (r >= 0 && r < n && c >= 0 && c < m && grid[r][c] === need) best = Math.max(best, 1 + f(r, c, d2, 0));
                  }
                  memo[key] = best;
                  return best;
              };
              var ans = 0;
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < m; j++) {
                      if (grid[i][j] !== 1) continue;
                      for (var d = 0; d < 4; d++) ans = Math.max(ans, f(i, j, d, 1));
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function lenOfVDiagonal(grid: number[][]): number {
              var n = grid.length, m = grid[0].length;
              var DR = [1, 1, -1, -1], DC = [1, -1, -1, 1];
              var memo: number[] = [];
              for (var z = 0; z < n * m * 8; z++) memo.push(0);
              var f = function(i: number, j: number, d: number, t: number): number {
                  var key = ((i * m + j) * 4 + d) * 2 + t;
                  if (memo[key]) return memo[key];
                  var need = grid[i][j] === 2 ? 0 : 2;
                  var best = 1;
                  var r = i + DR[d], c = j + DC[d];
                  if (r >= 0 && r < n && c >= 0 && c < m && grid[r][c] === need) best = 1 + f(r, c, d, t);
                  if (t) {
                      var d2 = (d + 1) % 4;
                      r = i + DR[d2]; c = j + DC[d2];
                      if (r >= 0 && r < n && c >= 0 && c < m && grid[r][c] === need) best = Math.max(best, 1 + f(r, c, d2, 0));
                  }
                  memo[key] = best;
                  return best;
              };
              var ans = 0;
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < m; j++) {
                      if (grid[i][j] !== 1) continue;
                      for (var d = 0; d < 4; d++) ans = Math.max(ans, f(i, j, d, 1));
                  }
              }
              return ans;
          }
        `,
        java: code`
          static final int[] DR = {1, 1, -1, -1};
          static final int[] DC = {1, -1, -1, 1};
          static int[] memo;
          static int[][] g;
          static int rows, cols;

          static int walk(int i, int j, int d, int t) {
              int key = ((i * cols + j) * 4 + d) * 2 + t;
              if (memo[key] != 0) return memo[key];
              int need = g[i][j] == 2 ? 0 : 2;
              int best = 1;
              int r = i + DR[d], c = j + DC[d];
              if (r >= 0 && r < rows && c >= 0 && c < cols && g[r][c] == need) best = 1 + walk(r, c, d, t);
              if (t == 1) {
                  int d2 = (d + 1) % 4;
                  r = i + DR[d2];
                  c = j + DC[d2];
                  if (r >= 0 && r < rows && c >= 0 && c < cols && g[r][c] == need) best = Math.max(best, 1 + walk(r, c, d2, 0));
              }
              memo[key] = best;
              return best;
          }

          public static int lenOfVDiagonal(int[][] grid) {
              g = grid;
              rows = grid.length;
              cols = grid[0].length;
              memo = new int[rows * cols * 8];
              int ans = 0;
              for (int i = 0; i < rows; i++) {
                  for (int j = 0; j < cols; j++) {
                      if (grid[i][j] != 1) continue;
                      for (int d = 0; d < 4; d++) ans = Math.max(ans, walk(i, j, d, 1));
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          int lenOfVDiagonal(vector<vector<int>>& grid) {
              int n = grid.size(), m = grid[0].size();
              const int DR[4] = {1, 1, -1, -1}, DC[4] = {1, -1, -1, 1};
              vector<int> memo(n * m * 8, 0);
              function<int(int, int, int, int)> f = [&](int i, int j, int d, int t) -> int {
                  int key = ((i * m + j) * 4 + d) * 2 + t;
                  if (memo[key]) return memo[key];
                  int need = grid[i][j] == 2 ? 0 : 2;
                  int best = 1;
                  int r = i + DR[d], c = j + DC[d];
                  if (r >= 0 && r < n && c >= 0 && c < m && grid[r][c] == need) best = 1 + f(r, c, d, t);
                  if (t) {
                      int d2 = (d + 1) % 4;
                      r = i + DR[d2];
                      c = j + DC[d2];
                      if (r >= 0 && r < n && c >= 0 && c < m && grid[r][c] == need) best = max(best, 1 + f(r, c, d2, 0));
                  }
                  return memo[key] = best;
              };
              int ans = 0;
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < m; j++)
                      if (grid[i][j] == 1)
                          for (int d = 0; d < 4; d++) ans = max(ans, f(i, j, d, 1));
              return ans;
          }
        `,
        c: code`
          static const int VDR[4] = {1, 1, -1, -1};
          static const int VDC[4] = {1, -1, -1, 1};
          static int* vMemo;
          static int** vGrid;
          static int vRows, vCols;

          static int vWalk(int i, int j, int d, int t) {
              int key = ((i * vCols + j) * 4 + d) * 2 + t;
              if (vMemo[key]) return vMemo[key];
              int need = vGrid[i][j] == 2 ? 0 : 2;
              int best = 1;
              int r = i + VDR[d], c = j + VDC[d];
              if (r >= 0 && r < vRows && c >= 0 && c < vCols && vGrid[r][c] == need) best = 1 + vWalk(r, c, d, t);
              if (t) {
                  int d2 = (d + 1) % 4;
                  r = i + VDR[d2];
                  c = j + VDC[d2];
                  if (r >= 0 && r < vRows && c >= 0 && c < vCols && vGrid[r][c] == need) {
                      int alt = 1 + vWalk(r, c, d2, 0);
                      if (alt > best) best = alt;
                  }
              }
              vMemo[key] = best;
              return best;
          }

          int lenOfVDiagonal(int** grid, int gridSize, int* gridColSize) {
              vGrid = grid;
              vRows = gridSize;
              vCols = gridColSize[0];
              vMemo = (int*) calloc((size_t) vRows * vCols * 8, sizeof(int));
              int ans = 0;
              for (int i = 0; i < vRows; i++) {
                  for (int j = 0; j < vCols; j++) {
                      if (grid[i][j] != 1) continue;
                      for (int d = 0; d < 4; d++) {
                          int v = vWalk(i, j, d, 1);
                          if (v > ans) ans = v;
                      }
                  }
              }
              free(vMemo);
              return ans;
          }
        `,
        csharp: code`
          static readonly int[] DR = { 1, 1, -1, -1 };
          static readonly int[] DC = { 1, -1, -1, 1 };
          static int[] memo;
          static int[][] g;
          static int rows, cols;

          static int Walk(int i, int j, int d, int t)
          {
              int key = ((i * cols + j) * 4 + d) * 2 + t;
              if (memo[key] != 0) return memo[key];
              int need = g[i][j] == 2 ? 0 : 2;
              int best = 1;
              int r = i + DR[d], c = j + DC[d];
              if (r >= 0 && r < rows && c >= 0 && c < cols && g[r][c] == need) best = 1 + Walk(r, c, d, t);
              if (t == 1)
              {
                  int d2 = (d + 1) % 4;
                  r = i + DR[d2];
                  c = j + DC[d2];
                  if (r >= 0 && r < rows && c >= 0 && c < cols && g[r][c] == need) best = Math.Max(best, 1 + Walk(r, c, d2, 0));
              }
              memo[key] = best;
              return best;
          }

          public static int LenOfVDiagonal(int[][] grid)
          {
              g = grid;
              rows = grid.Length;
              cols = grid[0].Length;
              memo = new int[rows * cols * 8];
              int ans = 0;
              for (int i = 0; i < rows; i++)
              {
                  for (int j = 0; j < cols; j++)
                  {
                      if (grid[i][j] != 1) continue;
                      for (int d = 0; d < 4; d++) ans = Math.Max(ans, Walk(i, j, d, 1));
                  }
              }
              return ans;
          }
        `,
        go: code`
          func lenOfVDiagonal(grid [][]int) int {
              n, m := len(grid), len(grid[0])
              DR := [4]int{1, 1, -1, -1}
              DC := [4]int{1, -1, -1, 1}
              memo := make([]int, n*m*8)
              var f func(i, j, d, t int) int
              f = func(i, j, d, t int) int {
                  key := ((i*m+j)*4+d)*2 + t
                  if memo[key] != 0 {
                      return memo[key]
                  }
                  need := 2
                  if grid[i][j] == 2 {
                      need = 0
                  }
                  best := 1
                  r, c := i+DR[d], j+DC[d]
                  if r >= 0 && r < n && c >= 0 && c < m && grid[r][c] == need {
                      best = 1 + f(r, c, d, t)
                  }
                  if t == 1 {
                      d2 := (d + 1) % 4
                      r, c = i+DR[d2], j+DC[d2]
                      if r >= 0 && r < n && c >= 0 && c < m && grid[r][c] == need {
                          if alt := 1 + f(r, c, d2, 0); alt > best {
                              best = alt
                          }
                      }
                  }
                  memo[key] = best
                  return best
              }
              ans := 0
              for i := 0; i < n; i++ {
                  for j := 0; j < m; j++ {
                      if grid[i][j] != 1 {
                          continue
                      }
                      for d := 0; d < 4; d++ {
                          if v := f(i, j, d, 1); v > ans {
                              ans = v
                          }
                      }
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun lenOfVDiagonal(grid: Array<IntArray>): Int {
              val n = grid.size
              val m = grid[0].size
              val dr = intArrayOf(1, 1, -1, -1)
              val dc = intArrayOf(1, -1, -1, 1)
              val memo = IntArray(n * m * 8)
              fun f(i: Int, j: Int, d: Int, t: Int): Int {
                  val key = ((i * m + j) * 4 + d) * 2 + t
                  if (memo[key] != 0) return memo[key]
                  val need = if (grid[i][j] == 2) 0 else 2
                  var best = 1
                  var r = i + dr[d]
                  var c = j + dc[d]
                  if (r in 0 until n && c in 0 until m && grid[r][c] == need) best = 1 + f(r, c, d, t)
                  if (t == 1) {
                      val d2 = (d + 1) % 4
                      r = i + dr[d2]
                      c = j + dc[d2]
                      if (r in 0 until n && c in 0 until m && grid[r][c] == need) best = maxOf(best, 1 + f(r, c, d2, 0))
                  }
                  memo[key] = best
                  return best
              }
              var ans = 0
              for (i in 0 until n) for (j in 0 until m) {
                  if (grid[i][j] != 1) continue
                  for (d in 0 until 4) ans = maxOf(ans, f(i, j, d, 1))
              }
              return ans
          }
        `,
        swift: code`
          func lenOfVDiagonal(_ grid: [[Int]]) -> Int {
              let n = grid.count, m = grid[0].count
              let dr = [1, 1, -1, -1], dc = [1, -1, -1, 1]
              var memo = [Int](repeating: 0, count: n * m * 8)
              func f(_ i: Int, _ j: Int, _ d: Int, _ t: Int) -> Int {
                  let key = ((i * m + j) * 4 + d) * 2 + t
                  if memo[key] != 0 { return memo[key] }
                  let need = grid[i][j] == 2 ? 0 : 2
                  var best = 1
                  var r = i + dr[d], c = j + dc[d]
                  if r >= 0 && r < n && c >= 0 && c < m && grid[r][c] == need { best = 1 + f(r, c, d, t) }
                  if t == 1 {
                      let d2 = (d + 1) % 4
                      r = i + dr[d2]
                      c = j + dc[d2]
                      if r >= 0 && r < n && c >= 0 && c < m && grid[r][c] == need { best = max(best, 1 + f(r, c, d2, 0)) }
                  }
                  memo[key] = best
                  return best
              }
              var ans = 0
              for i in 0..<n {
                  for j in 0..<m where grid[i][j] == 1 {
                      for d in 0..<4 { ans = max(ans, f(i, j, d, 1)) }
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn v_walk(grid: &Vec<Vec<i32>>, memo: &mut Vec<i32>, i: i32, j: i32, d: usize, t: usize) -> i32 {
              let n = grid.len() as i32;
              let m = grid[0].len() as i32;
              let dr = [1, 1, -1, -1];
              let dc = [1, -1, -1, 1];
              let key = (((i * m + j) as usize * 4 + d) * 2) + t;
              if memo[key] != 0 {
                  return memo[key];
              }
              let need = if grid[i as usize][j as usize] == 2 { 0 } else { 2 };
              let mut best = 1;
              let (r, c) = (i + dr[d], j + dc[d]);
              if r >= 0 && r < n && c >= 0 && c < m && grid[r as usize][c as usize] == need {
                  best = 1 + v_walk(grid, memo, r, c, d, t);
              }
              if t == 1 {
                  let d2 = (d + 1) % 4;
                  let (r, c) = (i + dr[d2], j + dc[d2]);
                  if r >= 0 && r < n && c >= 0 && c < m && grid[r as usize][c as usize] == need {
                      best = best.max(1 + v_walk(grid, memo, r, c, d2, 0));
                  }
              }
              memo[key] = best;
              best
          }

          fn lenOfVDiagonal(grid: Vec<Vec<i32>>) -> i32 {
              let n = grid.len();
              let m = grid[0].len();
              let mut memo = vec![0i32; n * m * 8];
              let mut ans = 0;
              for i in 0..n {
                  for j in 0..m {
                      if grid[i][j] != 1 {
                          continue;
                      }
                      for d in 0..4 {
                          ans = ans.max(v_walk(&grid, &mut memo, i as i32, j as i32, d, 1));
                      }
                  }
              }
              ans
          }
        `,
        php: code`
          function lenOfVDiagonal($grid) {
              $n = count($grid);
              $m = count($grid[0]);
              $DR = [1, 1, -1, -1];
              $DC = [1, -1, -1, 1];
              $memo = array_fill(0, $n * $m * 8, 0);
              $f = function ($i, $j, $d, $t) use (&$f, &$memo, $grid, $n, $m, $DR, $DC) {
                  $key = (($i * $m + $j) * 4 + $d) * 2 + $t;
                  if ($memo[$key]) return $memo[$key];
                  $need = $grid[$i][$j] == 2 ? 0 : 2;
                  $best = 1;
                  $r = $i + $DR[$d];
                  $c = $j + $DC[$d];
                  if ($r >= 0 && $r < $n && $c >= 0 && $c < $m && $grid[$r][$c] == $need) $best = 1 + $f($r, $c, $d, $t);
                  if ($t) {
                      $d2 = ($d + 1) % 4;
                      $r = $i + $DR[$d2];
                      $c = $j + $DC[$d2];
                      if ($r >= 0 && $r < $n && $c >= 0 && $c < $m && $grid[$r][$c] == $need) $best = max($best, 1 + $f($r, $c, $d2, 0));
                  }
                  $memo[$key] = $best;
                  return $best;
              };
              $ans = 0;
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $m; $j++) {
                      if ($grid[$i][$j] != 1) continue;
                      for ($d = 0; $d < 4; $d++) $ans = max($ans, $f($i, $j, $d, 1));
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def lenOfVDiagonal(grid)
            n = grid.length
            m = grid[0].length
            dr = [1, 1, -1, -1]
            dc = [1, -1, -1, 1]
            memo = Array.new(n * m * 8, 0)
            f = lambda do |i, j, d, t|
              key = ((i * m + j) * 4 + d) * 2 + t
              return memo[key] if memo[key] != 0
              need = grid[i][j] == 2 ? 0 : 2
              best = 1
              r = i + dr[d]
              c = j + dc[d]
              best = 1 + f.call(r, c, d, t) if r >= 0 && r < n && c >= 0 && c < m && grid[r][c] == need
              if t == 1
                d2 = (d + 1) % 4
                r = i + dr[d2]
                c = j + dc[d2]
                if r >= 0 && r < n && c >= 0 && c < m && grid[r][c] == need
                  alt = 1 + f.call(r, c, d2, 0)
                  best = alt if alt > best
                end
              end
              memo[key] = best
              best
            end
            ans = 0
            n.times do |i|
              m.times do |j|
                next unless grid[i][j] == 1
                4.times { |d| v = f.call(i, j, d, 1); ans = v if v > ans }
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Longest Palindromic Subsequence After at Most K Operations (LC 3472)
  (() => {
    const cost = (a: string, b: string) => { const d = Math.abs(a.charCodeAt(0) - b.charCodeAt(0)); return Math.min(d, 26 - d); };
    const ref = (s: string, k: number) => {
      // Every subsequence; its cheapest palindrome pairs the ends inwards.
      const n = s.length;
      let best = 0;
      for (let mask = 1; mask < (1 << n); mask++) {
        let sub = "";
        for (let i = 0; i < n; i++) if (mask & (1 << i)) sub += s[i];
        if (sub.length <= best) continue;
        let c = 0;
        for (let l = 0, r = sub.length - 1; l < r; l++, r--) c += cost(sub[l], sub[r]);
        if (c <= k) best = sub.length;
      }
      return best;
    };
    return {
      slug: "longest-palindromic-subsequence-after-at-most-k-operations",
      title: "Longest Palindromic Subsequence After at Most K Operations",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Google"],
      signature: { funcName: "longestPalindromicSubsequence", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of lowercase letters and an integer `k`.\n\nIn one operation you may replace any character of `s` with the next or the previous letter of the alphabet, which wraps around: the letter after `'z'` is `'a'`, and the letter before `'a'` is `'z'`.\n\nReturn the length of the **longest palindromic subsequence** of `s` that can be obtained after performing **at most** `k` operations.",
        [
          { in: "s = \"abced\", k = 2", out: "3", note: "Change 'c' to 'd' (1 operation): \"abded\" contains the palindrome \"ded\"." },
          { in: "s = \"aaazzz\", k = 4", out: "6", note: "Turn each 'a' into 'z' (1 operation each, wrapping backwards) — after 3 operations the whole string is \"zzzzzz\"." },
          { in: "s = \"a\", k = 1", out: "1" },
        ],
        ["1 <= s.length <= 200", "1 <= k <= 200", "s consists only of lowercase English letters"]),
      hints: [
        "Making two characters equal costs `min(|a - b|, 26 - |a - b|)` operations — move one of them around the shorter side of the alphabet circle.",
        "Extend the classic longest-palindromic-subsequence interval DP with the budget: `dp[i][j][c]` = longest palindrome inside `s[i..j]` using at most `c` operations.",
        "`dp[i][j][c] = max(dp[i + 1][j][c], dp[i][j - 1][c], 2 + dp[i + 1][j - 1][c - cost(s[i], s[j])])`, the last only when the cost fits.",
      ],
      editorial: explain({
        idea: "A palindromic subsequence pairs characters from the outside in, and each pair costs the circular distance between its letters. That is the standard interval DP for the longest palindromic subsequence with one extra dimension: the operations still available.",
        steps: [
          "Let `cost(a, b) = min(|a - b|, 26 - |a - b|)`.",
          "`dp[i][i][c] = 1` for every `c`; an empty range is 0.",
          "For `i` from `n - 1` down to 0 and `j > i`: `dp[i][j][c] = max(dp[i + 1][j][c], dp[i][j - 1][c])`, and if `cost(s[i], s[j]) <= c`, also `2 + dp[i + 1][j - 1][c - cost]`.",
          "Return `dp[0][n - 1][k]`.",
        ],
        why: "In an optimal palindrome inside `s[i..j]`, either `s[i]` or `s[j]` is unused (drop it) or both are used — then they must be the outermost pair, made equal at minimum cost `cost(s[i], s[j])`, and the rest is an optimal palindrome of `s[i+1..j-1]` with the remaining budget. A middle character costs nothing because it does not need a partner.",
        time: "O(n^2 · k)",
        space: "O(n^2 · k)",
        pitfalls: [
          "The alphabet wraps: 'a' and 'z' are one operation apart, not 25.",
          "Only one character of a pair needs to change, so the pair costs the distance, not twice the distance.",
          "Budgets are \"at most\", so `dp[...][c]` must be non-decreasing in `c` — which the recurrence gives automatically.",
        ],
      }),
      examples: [
        { input: "\"abced\"\n2", expectedOutput: "3" },
        { input: "\"aaazzz\"\n4", expectedOutput: "6" },
        { input: "\"a\"\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, pick(rng, [1, 5, 9, 12]), pick(rng, ["abcdefghijklmnopqrstuvwxyz", "abyz", "amz", "a"]));
        const k = ri(rng, 1, pick(rng, [1, 3, 10, 30]));
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: code`
          def longestPalindromicSubsequence(s: str, k: int) -> int:
              n = len(s)
              a = [ord(ch) - 97 for ch in s]
              K = k + 1
              dp = [[None] * n for _ in range(n)]
              for i in range(n - 1, -1, -1):
                  dp[i][i] = [1] * K
                  for j in range(i + 1, n):
                      d = abs(a[i] - a[j])
                      cost = min(d, 26 - d)
                      left, right = dp[i + 1][j], dp[i][j - 1]
                      inner = dp[i + 1][j - 1] if i + 1 <= j - 1 else None
                      row = [0] * K
                      for c in range(K):
                          best = left[c] if left[c] > right[c] else right[c]
                          if cost <= c:
                              v = 2 + (inner[c - cost] if inner is not None else 0)
                              if v > best:
                                  best = v
                          row[c] = best
                      dp[i][j] = row
              return dp[0][n - 1][k]
        `,
        javascript: code`
          var longestPalindromicSubsequence = function(s, k) {
              var n = s.length, K = k + 1;
              var dp = new Array(n * n * K).fill(0);
              var at = function(i, j, c) { return (i * n + j) * K + c; };
              for (var i = n - 1; i >= 0; i--) {
                  for (var c0 = 0; c0 < K; c0++) dp[at(i, i, c0)] = 1;
                  for (var j = i + 1; j < n; j++) {
                      var d = Math.abs(s.charCodeAt(i) - s.charCodeAt(j));
                      var cost = Math.min(d, 26 - d);
                      for (var c = 0; c < K; c++) {
                          var best = Math.max(dp[at(i + 1, j, c)], dp[at(i, j - 1, c)]);
                          if (cost <= c) {
                              var inner = i + 1 <= j - 1 ? dp[at(i + 1, j - 1, c - cost)] : 0;
                              if (2 + inner > best) best = 2 + inner;
                          }
                          dp[at(i, j, c)] = best;
                      }
                  }
              }
              return dp[at(0, n - 1, k)];
          };
        `,
        typescript: code`
          function longestPalindromicSubsequence(s: string, k: number): number {
              var n = s.length, K = k + 1;
              var dp: number[] = [];
              for (var z = 0; z < n * n * K; z++) dp.push(0);
              var at = function(i: number, j: number, c: number): number { return (i * n + j) * K + c; };
              for (var i = n - 1; i >= 0; i--) {
                  for (var c0 = 0; c0 < K; c0++) dp[at(i, i, c0)] = 1;
                  for (var j = i + 1; j < n; j++) {
                      var d = Math.abs(s.charCodeAt(i) - s.charCodeAt(j));
                      var cost = Math.min(d, 26 - d);
                      for (var c = 0; c < K; c++) {
                          var best = Math.max(dp[at(i + 1, j, c)], dp[at(i, j - 1, c)]);
                          if (cost <= c) {
                              var inner = i + 1 <= j - 1 ? dp[at(i + 1, j - 1, c - cost)] : 0;
                              if (2 + inner > best) best = 2 + inner;
                          }
                          dp[at(i, j, c)] = best;
                      }
                  }
              }
              return dp[at(0, n - 1, k)];
          }
        `,
        java: code`
          public static int longestPalindromicSubsequence(String s, int k) {
              int n = s.length(), K = k + 1;
              int[][][] dp = new int[n][n][K];
              for (int i = n - 1; i >= 0; i--) {
                  Arrays.fill(dp[i][i], 1);
                  for (int j = i + 1; j < n; j++) {
                      int d = Math.abs(s.charAt(i) - s.charAt(j));
                      int cost = Math.min(d, 26 - d);
                      for (int c = 0; c < K; c++) {
                          int best = Math.max(dp[i + 1][j][c], dp[i][j - 1][c]);
                          if (cost <= c) {
                              int inner = i + 1 <= j - 1 ? dp[i + 1][j - 1][c - cost] : 0;
                              best = Math.max(best, 2 + inner);
                          }
                          dp[i][j][c] = best;
                      }
                  }
              }
              return dp[0][n - 1][k];
          }
        `,
        cpp: code`
          int longestPalindromicSubsequence(string s, int k) {
              int n = s.size(), K = k + 1;
              vector<int> dp((size_t) n * n * K, 0);
              auto at = [&](int i, int j, int c) { return ((size_t) i * n + j) * K + c; };
              for (int i = n - 1; i >= 0; i--) {
                  for (int c = 0; c < K; c++) dp[at(i, i, c)] = 1;
                  for (int j = i + 1; j < n; j++) {
                      int d = abs(s[i] - s[j]);
                      int cost = min(d, 26 - d);
                      for (int c = 0; c < K; c++) {
                          int best = max(dp[at(i + 1, j, c)], dp[at(i, j - 1, c)]);
                          if (cost <= c) {
                              int inner = i + 1 <= j - 1 ? dp[at(i + 1, j - 1, c - cost)] : 0;
                              best = max(best, 2 + inner);
                          }
                          dp[at(i, j, c)] = best;
                      }
                  }
              }
              return dp[at(0, n - 1, k)];
          }
        `,
        c: code`
          int longestPalindromicSubsequence(const char* s, int k) {
              int n = (int) strlen(s), K = k + 1;
              int* dp = (int*) calloc((size_t) n * n * K, sizeof(int));
              for (int i = n - 1; i >= 0; i--) {
                  for (int c = 0; c < K; c++) dp[((size_t) i * n + i) * K + c] = 1;
                  for (int j = i + 1; j < n; j++) {
                      int d = s[i] - s[j];
                      if (d < 0) d = -d;
                      int cost = d < 26 - d ? d : 26 - d;
                      for (int c = 0; c < K; c++) {
                          int a = dp[((size_t) (i + 1) * n + j) * K + c];
                          int b = dp[((size_t) i * n + j - 1) * K + c];
                          int best = a > b ? a : b;
                          if (cost <= c) {
                              int inner = i + 1 <= j - 1 ? dp[((size_t) (i + 1) * n + j - 1) * K + c - cost] : 0;
                              if (2 + inner > best) best = 2 + inner;
                          }
                          dp[((size_t) i * n + j) * K + c] = best;
                      }
                  }
              }
              int ans = dp[((size_t) 0 * n + n - 1) * K + k];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int LongestPalindromicSubsequence(string s, int k)
          {
              int n = s.Length, K = k + 1;
              int[,,] dp = new int[n, n, K];
              for (int i = n - 1; i >= 0; i--)
              {
                  for (int c = 0; c < K; c++) dp[i, i, c] = 1;
                  for (int j = i + 1; j < n; j++)
                  {
                      int d = Math.Abs(s[i] - s[j]);
                      int cost = Math.Min(d, 26 - d);
                      for (int c = 0; c < K; c++)
                      {
                          int best = Math.Max(dp[i + 1, j, c], dp[i, j - 1, c]);
                          if (cost <= c)
                          {
                              int inner = i + 1 <= j - 1 ? dp[i + 1, j - 1, c - cost] : 0;
                              best = Math.Max(best, 2 + inner);
                          }
                          dp[i, j, c] = best;
                      }
                  }
              }
              return dp[0, n - 1, k];
          }
        `,
        go: code`
          func longestPalindromicSubsequence(s string, k int) int {
              n, K := len(s), k+1
              dp := make([]int, n*n*K)
              at := func(i, j, c int) int { return (i*n+j)*K + c }
              for i := n - 1; i >= 0; i-- {
                  for c := 0; c < K; c++ {
                      dp[at(i, i, c)] = 1
                  }
                  for j := i + 1; j < n; j++ {
                      d := int(s[i]) - int(s[j])
                      if d < 0 {
                          d = -d
                      }
                      cost := d
                      if 26-d < cost {
                          cost = 26 - d
                      }
                      for c := 0; c < K; c++ {
                          best := dp[at(i+1, j, c)]
                          if v := dp[at(i, j-1, c)]; v > best {
                              best = v
                          }
                          if cost <= c {
                              inner := 0
                              if i+1 <= j-1 {
                                  inner = dp[at(i+1, j-1, c-cost)]
                              }
                              if 2+inner > best {
                                  best = 2 + inner
                              }
                          }
                          dp[at(i, j, c)] = best
                      }
                  }
              }
              return dp[at(0, n-1, k)]
          }
        `,
        kotlin: code`
          fun longestPalindromicSubsequence(s: String, k: Int): Int {
              val n = s.length
              val kk = k + 1
              val dp = IntArray(n * n * kk)
              fun at(i: Int, j: Int, c: Int): Int = (i * n + j) * kk + c
              for (i in n - 1 downTo 0) {
                  for (c in 0 until kk) dp[at(i, i, c)] = 1
                  for (j in i + 1 until n) {
                      val d = Math.abs(s[i] - s[j])
                      val cost = minOf(d, 26 - d)
                      for (c in 0 until kk) {
                          var best = maxOf(dp[at(i + 1, j, c)], dp[at(i, j - 1, c)])
                          if (cost <= c) {
                              val inner = if (i + 1 <= j - 1) dp[at(i + 1, j - 1, c - cost)] else 0
                              best = maxOf(best, 2 + inner)
                          }
                          dp[at(i, j, c)] = best
                      }
                  }
              }
              return dp[at(0, n - 1, k)]
          }
        `,
        swift: code`
          func longestPalindromicSubsequence(_ s: String, _ k: Int) -> Int {
              let a = s.utf8.map { Int($0) }
              let n = a.count, K = k + 1
              var dp = [Int](repeating: 0, count: n * n * K)
              func at(_ i: Int, _ j: Int, _ c: Int) -> Int { return (i * n + j) * K + c }
              var i = n - 1
              while i >= 0 {
                  for c in 0..<K { dp[at(i, i, c)] = 1 }
                  var j = i + 1
                  while j < n {
                      let d = abs(a[i] - a[j])
                      let cost = min(d, 26 - d)
                      for c in 0..<K {
                          var best = max(dp[at(i + 1, j, c)], dp[at(i, j - 1, c)])
                          if cost <= c {
                              let inner = i + 1 <= j - 1 ? dp[at(i + 1, j - 1, c - cost)] : 0
                              best = max(best, 2 + inner)
                          }
                          dp[at(i, j, c)] = best
                      }
                      j += 1
                  }
                  i -= 1
              }
              return dp[at(0, n - 1, k)]
          }
        `,
        rust: code`
          fn longestPalindromicSubsequence(s: String, k: i32) -> i32 {
              let a: Vec<i32> = s.bytes().map(|b| b as i32).collect();
              let n = a.len();
              let kk = k as usize + 1;
              let mut dp = vec![0i32; n * n * kk];
              let at = |i: usize, j: usize, c: usize| (i * n + j) * kk + c;
              for i in (0..n).rev() {
                  for c in 0..kk {
                      dp[at(i, i, c)] = 1;
                  }
                  for j in i + 1..n {
                      let d = (a[i] - a[j]).abs();
                      let cost = d.min(26 - d) as usize;
                      for c in 0..kk {
                          let mut best = dp[at(i + 1, j, c)].max(dp[at(i, j - 1, c)]);
                          if cost <= c {
                              let inner = if i + 1 <= j - 1 { dp[at(i + 1, j - 1, c - cost)] } else { 0 };
                              best = best.max(2 + inner);
                          }
                          dp[at(i, j, c)] = best;
                      }
                  }
              }
              dp[at(0, n - 1, k as usize)]
          }
        `,
        php: code`
          function longestPalindromicSubsequence($s, $k) {
              $n = strlen($s);
              $K = $k + 1;
              $dp = array_fill(0, $n * $n * $K, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  for ($c = 0; $c < $K; $c++) $dp[($i * $n + $i) * $K + $c] = 1;
                  for ($j = $i + 1; $j < $n; $j++) {
                      $d = abs(ord($s[$i]) - ord($s[$j]));
                      $cost = min($d, 26 - $d);
                      $base1 = (($i + 1) * $n + $j) * $K;
                      $base2 = ($i * $n + $j - 1) * $K;
                      $base3 = (($i + 1) * $n + $j - 1) * $K;
                      $here = ($i * $n + $j) * $K;
                      for ($c = 0; $c < $K; $c++) {
                          $best = max($dp[$base1 + $c], $dp[$base2 + $c]);
                          if ($cost <= $c) {
                              $inner = $i + 1 <= $j - 1 ? $dp[$base3 + $c - $cost] : 0;
                              if (2 + $inner > $best) $best = 2 + $inner;
                          }
                          $dp[$here + $c] = $best;
                      }
                  }
              }
              return $dp[($n - 1) * $K + $k];
          }
        `,
        ruby: code`
          def longestPalindromicSubsequence(s, k)
            a = s.bytes
            n = a.length
            kk = k + 1
            dp = Array.new(n * n * kk, 0)
            (n - 1).downto(0) do |i|
              kk.times { |c| dp[(i * n + i) * kk + c] = 1 }
              ((i + 1)...n).each do |j|
                d = (a[i] - a[j]).abs
                cost = [d, 26 - d].min
                b1 = ((i + 1) * n + j) * kk
                b2 = (i * n + j - 1) * kk
                b3 = ((i + 1) * n + j - 1) * kk
                here = (i * n + j) * kk
                kk.times do |c|
                  best = dp[b1 + c] > dp[b2 + c] ? dp[b1 + c] : dp[b2 + c]
                  if cost <= c
                    inner = i + 1 <= j - 1 ? dp[b3 + c - cost] : 0
                    best = 2 + inner if 2 + inner > best
                  end
                  dp[here + c] = best
                end
              end
            end
            dp[(n - 1) * kk + k]
          end
        `,
      },
    };
  })(),

  // ── Best Time to Buy and Sell Stock V (LC 3573) ───────────────────
  (() => {
    const ref = (prices: number[], k: number) => {
      // f(d, r): best profit from day d on with r transactions left; a
      // transaction opens on day d and closes on a later day e (either way round).
      const n = prices.length;
      const memo = new Map<number, number>();
      const f = (d: number, r: number): number => {
        if (d >= n || r === 0) return 0;
        const key = d * 1000 + r;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = f(d + 1, r);
        for (let e = d + 1; e < n; e++) best = Math.max(best, Math.abs(prices[e] - prices[d]) + f(e + 1, r - 1));
        memo.set(key, best);
        return best;
      };
      return f(0, k);
    };
    return {
      slug: "best-time-to-buy-and-sell-stock-v",
      title: "Best Time to Buy and Sell Stock V",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Bloomberg"],
      signature: { funcName: "maximumProfit", params: [{ name: "prices", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `prices`, where `prices[i]` is the price of a stock on day `i`, and an integer `k`.\n\nYou may make at most `k` transactions, each of one of two kinds:\n\n- **Normal:** buy on day `i`, sell on a later day `j > i`, earning `prices[j] - prices[i]`.\n- **Short selling:** sell on day `i`, buy back on a later day `j > i`, earning `prices[i] - prices[j]`.\n\nTransactions may not overlap: one must be finished before the next starts, and a new transaction cannot start on the same day the previous one ends.\n\nReturn the **maximum** total profit you can earn.",
        [
          { in: "prices = [1,7,9,8,2], k = 2", out: "14", note: "Buy on day 0 at 1 and sell on day 2 at 9 (+8); short on day 3 at 8 and buy back on day 4 at 2 (+6)." },
          { in: "prices = [12,16,19,19,8,1,19,13,9], k = 3", out: "36", note: "Buy at 12, sell at 19 (+7); short at 19, buy back at 1 (+18); short at 19, buy back at 8 (+11)." },
          { in: "prices = [5,5], k = 1", out: "0", note: "No transaction can make money." },
        ],
        ["2 <= prices.length <= 10^3", "1 <= prices[i] <= 10^6 (the original allows 10^9; capped here so every profit fits a 32-bit integer)", "1 <= k <= prices.length / 2"]),
      hints: [
        "This is \"Best Time to Buy and Sell Stock IV\" with a second kind of position: holding a short.",
        "Track three states per number of completed transactions: free (no position), long (bought, not yet sold) and short (sold, not yet bought back).",
        "Each day, from yesterday's values: free → long pays `-price`, free → short earns `+price`, long → free earns `+price` and short → free pays `-price` (both completing a transaction). Using only yesterday's values keeps a transaction from opening on the day another closes.",
      ],
      editorial: explain({
        idea: "At the end of any day you are in one of three positions — flat, long or short — and what matters for the future is that position plus how many transactions are already done. A DP over days with those states covers every plan.",
        steps: [
          "Let `free[c]`, `long[c]`, `short[c]` be the best balance with `c` completed transactions; start with `free[0] = 0` and everything else `-∞`.",
          "For each price `p`, compute new values from the old ones: `free[c + 1] = max(free[c + 1], long[c] + p, short[c] - p)`; `long[c] = max(long[c], free[c] - p)` and `short[c] = max(short[c], free[c] + p)` for `c < k`.",
          "After the last day, return `max(free[c])` over `c`.",
        ],
        why: "Every valid schedule is a sequence of non-overlapping intervals, each opened from the flat state and closed back into it, and the DP tracks exactly the position held on each day. Reading only the previous day's values means a position closed today cannot feed a position opened today, which enforces the no-shared-day rule; opening and closing on the same day is likewise impossible.",
        time: "O(n · k)",
        space: "O(k)",
        pitfalls: [
          "A short sale is a separate state — you cannot model it as a negative long position in the same array.",
          "Update from the previous day's arrays (or iterate carefully); updating in place lets a transaction close and the next one open on the same day.",
          "Use 64-bit arithmetic for the `-∞` sentinels so `-∞ + p` cannot wrap around.",
        ],
      }),
      examples: [
        { input: "[1,7,9,8,2]\n2", expectedOutput: "14" },
        { input: "[12,16,19,19,8,1,19,13,9]\n3", expectedOutput: "36" },
        { input: "[5,5]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 6, 15, 30]));
        const top = pick(rng, [3, 20, 1000, 1000000]);
        const prices = Array.from({ length: n }, () => ri(rng, 1, top));
        const k = ri(rng, 1, Math.floor(n / 2));
        return { input: `${fmtIntArr(prices)}\n${k}`, expectedOutput: String(ref(prices, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumProfit(prices: List[int], k: int) -> int:
              NEG = float('-inf')
              free = [NEG] * (k + 1)
              hold = [NEG] * (k + 1)
              short = [NEG] * (k + 1)
              free[0] = 0
              for p in prices:
                  nf, nh, ns = free[:], hold[:], short[:]
                  for c in range(k):
                      if hold[c] + p > nf[c + 1]:
                          nf[c + 1] = hold[c] + p
                      if short[c] - p > nf[c + 1]:
                          nf[c + 1] = short[c] - p
                      if free[c] - p > nh[c]:
                          nh[c] = free[c] - p
                      if free[c] + p > ns[c]:
                          ns[c] = free[c] + p
                  free, hold, short = nf, nh, ns
              return int(max(free))
        `,
        javascript: code`
          var maximumProfit = function(prices, k) {
              var NEG = -Infinity;
              var free = [], hold = [], sh = [];
              for (var c = 0; c <= k; c++) { free.push(NEG); hold.push(NEG); sh.push(NEG); }
              free[0] = 0;
              for (var d = 0; d < prices.length; d++) {
                  var p = prices[d];
                  var nf = free.slice(), nh = hold.slice(), ns = sh.slice();
                  for (var t = 0; t < k; t++) {
                      if (hold[t] + p > nf[t + 1]) nf[t + 1] = hold[t] + p;
                      if (sh[t] - p > nf[t + 1]) nf[t + 1] = sh[t] - p;
                      if (free[t] - p > nh[t]) nh[t] = free[t] - p;
                      if (free[t] + p > ns[t]) ns[t] = free[t] + p;
                  }
                  free = nf; hold = nh; sh = ns;
              }
              var best = 0;
              for (var q = 0; q <= k; q++) if (free[q] > best) best = free[q];
              return best;
          };
        `,
        typescript: code`
          function maximumProfit(prices: number[], k: number): number {
              var NEG = -Infinity;
              var free: number[] = [], hold: number[] = [], sh: number[] = [];
              for (var c = 0; c <= k; c++) { free.push(NEG); hold.push(NEG); sh.push(NEG); }
              free[0] = 0;
              for (var d = 0; d < prices.length; d++) {
                  var p = prices[d];
                  var nf = free.slice(), nh = hold.slice(), ns = sh.slice();
                  for (var t = 0; t < k; t++) {
                      if (hold[t] + p > nf[t + 1]) nf[t + 1] = hold[t] + p;
                      if (sh[t] - p > nf[t + 1]) nf[t + 1] = sh[t] - p;
                      if (free[t] - p > nh[t]) nh[t] = free[t] - p;
                      if (free[t] + p > ns[t]) ns[t] = free[t] + p;
                  }
                  free = nf; hold = nh; sh = ns;
              }
              var best = 0;
              for (var q = 0; q <= k; q++) if (free[q] > best) best = free[q];
              return best;
          }
        `,
        java: code`
          public static int maximumProfit(int[] prices, int k) {
              final long NEG = Long.MIN_VALUE / 4;
              long[] free = new long[k + 1], hold = new long[k + 1], sh = new long[k + 1];
              Arrays.fill(free, NEG);
              Arrays.fill(hold, NEG);
              Arrays.fill(sh, NEG);
              free[0] = 0;
              for (int p : prices) {
                  long[] nf = free.clone(), nh = hold.clone(), ns = sh.clone();
                  for (int c = 0; c < k; c++) {
                      nf[c + 1] = Math.max(nf[c + 1], Math.max(hold[c] + p, sh[c] - p));
                      nh[c] = Math.max(nh[c], free[c] - p);
                      ns[c] = Math.max(ns[c], free[c] + p);
                  }
                  free = nf;
                  hold = nh;
                  sh = ns;
              }
              long best = 0;
              for (long v : free) best = Math.max(best, v);
              return (int) best;
          }
        `,
        cpp: code`
          int maximumProfit(vector<int>& prices, int k) {
              const long long NEG = LLONG_MIN / 4;
              vector<long long> fr(k + 1, NEG), hold(k + 1, NEG), sh(k + 1, NEG);
              fr[0] = 0;
              for (int p : prices) {
                  vector<long long> nf = fr, nh = hold, ns = sh;
                  for (int c = 0; c < k; c++) {
                      nf[c + 1] = max(nf[c + 1], max(hold[c] + p, sh[c] - p));
                      nh[c] = max(nh[c], fr[c] - p);
                      ns[c] = max(ns[c], fr[c] + p);
                  }
                  fr = nf;
                  hold = nh;
                  sh = ns;
              }
              long long best = 0;
              for (long long v : fr) best = max(best, v);
              return (int) best;
          }
        `,
        c: code`
          int maximumProfit(int* prices, int pricesSize, int k) {
              const long long NEG = -(1LL << 60);
              long long* st = (long long*) malloc(sizeof(long long) * 6 * (k + 1));
              long long *fr = st, *hold = st + (k + 1), *sh = st + 2 * (k + 1);
              long long *nf = st + 3 * (k + 1), *nh = st + 4 * (k + 1), *ns = st + 5 * (k + 1);
              for (int c = 0; c <= k; c++) { fr[c] = NEG; hold[c] = NEG; sh[c] = NEG; }
              fr[0] = 0;
              for (int d = 0; d < pricesSize; d++) {
                  long long p = prices[d];
                  for (int c = 0; c <= k; c++) { nf[c] = fr[c]; nh[c] = hold[c]; ns[c] = sh[c]; }
                  for (int c = 0; c < k; c++) {
                      if (hold[c] + p > nf[c + 1]) nf[c + 1] = hold[c] + p;
                      if (sh[c] - p > nf[c + 1]) nf[c + 1] = sh[c] - p;
                      if (fr[c] - p > nh[c]) nh[c] = fr[c] - p;
                      if (fr[c] + p > ns[c]) ns[c] = fr[c] + p;
                  }
                  for (int c = 0; c <= k; c++) { fr[c] = nf[c]; hold[c] = nh[c]; sh[c] = ns[c]; }
              }
              long long best = 0;
              for (int c = 0; c <= k; c++) if (fr[c] > best) best = fr[c];
              free(st);
              return (int) best;
          }
        `,
        csharp: code`
          public static int MaximumProfit(int[] prices, int k)
          {
              const long NEG = long.MinValue / 4;
              long[] free = new long[k + 1], hold = new long[k + 1], sh = new long[k + 1];
              for (int c = 0; c <= k; c++) { free[c] = NEG; hold[c] = NEG; sh[c] = NEG; }
              free[0] = 0;
              foreach (int p in prices)
              {
                  long[] nf = (long[]) free.Clone(), nh = (long[]) hold.Clone(), ns = (long[]) sh.Clone();
                  for (int c = 0; c < k; c++)
                  {
                      nf[c + 1] = Math.Max(nf[c + 1], Math.Max(hold[c] + p, sh[c] - p));
                      nh[c] = Math.Max(nh[c], free[c] - p);
                      ns[c] = Math.Max(ns[c], free[c] + p);
                  }
                  free = nf;
                  hold = nh;
                  sh = ns;
              }
              long best = 0;
              foreach (long v in free) best = Math.Max(best, v);
              return (int) best;
          }
        `,
        go: code`
          func maximumProfit(prices []int, k int) int {
              const neg = -(1 << 60)
              fr := make([]int, k+1)
              hold := make([]int, k+1)
              sh := make([]int, k+1)
              for c := 0; c <= k; c++ {
                  fr[c], hold[c], sh[c] = neg, neg, neg
              }
              fr[0] = 0
              for _, p := range prices {
                  nf := append([]int(nil), fr...)
                  nh := append([]int(nil), hold...)
                  ns := append([]int(nil), sh...)
                  for c := 0; c < k; c++ {
                      if hold[c]+p > nf[c+1] {
                          nf[c+1] = hold[c] + p
                      }
                      if sh[c]-p > nf[c+1] {
                          nf[c+1] = sh[c] - p
                      }
                      if fr[c]-p > nh[c] {
                          nh[c] = fr[c] - p
                      }
                      if fr[c]+p > ns[c] {
                          ns[c] = fr[c] + p
                      }
                  }
                  fr, hold, sh = nf, nh, ns
              }
              best := 0
              for _, v := range fr {
                  if v > best {
                      best = v
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maximumProfit(prices: IntArray, k: Int): Int {
              val neg = Long.MIN_VALUE / 4
              var free = LongArray(k + 1) { neg }
              var hold = LongArray(k + 1) { neg }
              var sh = LongArray(k + 1) { neg }
              free[0] = 0L
              for (p in prices) {
                  val nf = free.copyOf()
                  val nh = hold.copyOf()
                  val ns = sh.copyOf()
                  for (c in 0 until k) {
                      nf[c + 1] = maxOf(nf[c + 1], maxOf(hold[c] + p, sh[c] - p))
                      nh[c] = maxOf(nh[c], free[c] - p)
                      ns[c] = maxOf(ns[c], free[c] + p)
                  }
                  free = nf
                  hold = nh
                  sh = ns
              }
              var best = 0L
              for (v in free) best = maxOf(best, v)
              return best.toInt()
          }
        `,
        swift: code`
          func maximumProfit(_ prices: [Int], _ k: Int) -> Int {
              let neg = Int.min / 4
              var free = [Int](repeating: neg, count: k + 1)
              var hold = free
              var sh = free
              free[0] = 0
              for p in prices {
                  var nf = free, nh = hold, ns = sh
                  for c in 0..<k {
                      nf[c + 1] = max(nf[c + 1], max(hold[c] + p, sh[c] - p))
                      nh[c] = max(nh[c], free[c] - p)
                      ns[c] = max(ns[c], free[c] + p)
                  }
                  free = nf
                  hold = nh
                  sh = ns
              }
              var best = 0
              for v in free { best = max(best, v) }
              return best
          }
        `,
        rust: code`
          fn maximumProfit(prices: Vec<i32>, k: i32) -> i32 {
              let k = k as usize;
              let neg = std::i64::MIN / 4;
              let mut free = vec![neg; k + 1];
              let mut hold = vec![neg; k + 1];
              let mut sh = vec![neg; k + 1];
              free[0] = 0;
              for &price in &prices {
                  let p = price as i64;
                  let mut nf = free.clone();
                  let mut nh = hold.clone();
                  let mut ns = sh.clone();
                  for c in 0..k {
                      nf[c + 1] = nf[c + 1].max(hold[c] + p).max(sh[c] - p);
                      nh[c] = nh[c].max(free[c] - p);
                      ns[c] = ns[c].max(free[c] + p);
                  }
                  free = nf;
                  hold = nh;
                  sh = ns;
              }
              *free.iter().max().unwrap() as i32
          }
        `,
        php: code`
          function maximumProfit($prices, $k) {
              $NEG = -PHP_INT_MAX >> 2;
              $free = array_fill(0, $k + 1, $NEG);
              $hold = array_fill(0, $k + 1, $NEG);
              $sh = array_fill(0, $k + 1, $NEG);
              $free[0] = 0;
              foreach ($prices as $p) {
                  $nf = $free;
                  $nh = $hold;
                  $ns = $sh;
                  for ($c = 0; $c < $k; $c++) {
                      if ($hold[$c] + $p > $nf[$c + 1]) $nf[$c + 1] = $hold[$c] + $p;
                      if ($sh[$c] - $p > $nf[$c + 1]) $nf[$c + 1] = $sh[$c] - $p;
                      if ($free[$c] - $p > $nh[$c]) $nh[$c] = $free[$c] - $p;
                      if ($free[$c] + $p > $ns[$c]) $ns[$c] = $free[$c] + $p;
                  }
                  $free = $nf;
                  $hold = $nh;
                  $sh = $ns;
              }
              return max(0, max($free));
          }
        `,
        ruby: code`
          def maximumProfit(prices, k)
            neg = -(1 << 60)
            free = Array.new(k + 1, neg)
            hold = Array.new(k + 1, neg)
            sh = Array.new(k + 1, neg)
            free[0] = 0
            prices.each do |p|
              nf = free.dup
              nh = hold.dup
              ns = sh.dup
              k.times do |c|
                nf[c + 1] = hold[c] + p if hold[c] + p > nf[c + 1]
                nf[c + 1] = sh[c] - p if sh[c] - p > nf[c + 1]
                nh[c] = free[c] - p if free[c] - p > nh[c]
                ns[c] = free[c] + p if free[c] + p > ns[c]
              end
              free = nf
              hold = nh
              sh = ns
            end
            [free.max, 0].max
          end
        `,
      },
    };
  })(),

  // ── Count Partitions With Max-Min Difference at Most K (LC 3578) ──
  (() => {
    const MOD = 1000000007;
    const ref = (nums: number[], k: number) => {
      // O(n^2): dp[i] = partitions of the first i elements; extend the last segment leftwards.
      const n = nums.length;
      const dp = new Array(n + 1).fill(0);
      dp[0] = 1;
      for (let i = 1; i <= n; i++) {
        let lo = Infinity, hi = -Infinity;
        for (let j = i - 1; j >= 0; j--) {
          lo = Math.min(lo, nums[j]);
          hi = Math.max(hi, nums[j]);
          if (hi - lo > k) break;
          dp[i] = (dp[i] + dp[j]) % MOD;
        }
      }
      return dp[n];
    };
    return {
      slug: "count-partitions-with-max-min-difference-at-most-k",
      title: "Count Partitions With Max-Min Difference at Most K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Queue", "Sliding Window", "Prefix Sum", "Monotonic Queue", "Amazon"],
      signature: { funcName: "countPartitions", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and an integer `k`.\n\nPartition `nums` into one or more **non-empty contiguous** segments so that in **every** segment the difference between its maximum and its minimum element is **at most** `k`.\n\nReturn the number of ways to do this. Since the answer may be large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [9,4,1,3,7], k = 4", out: "6", note: "[[9],[4],[1],[3],[7]], [[9],[4],[1],[3,7]], [[9],[4],[1,3],[7]], [[9],[4,1],[3],[7]], [[9],[4,1],[3,7]] and [[9],[4,1,3],[7]]." },
          { in: "nums = [3,3,4], k = 0", out: "2", note: "[[3],[3],[4]] and [[3,3],[4]]." },
          { in: "nums = [1,2], k = 5", out: "2", note: "[[1],[2]] and [[1,2]]." },
        ],
        ["2 <= nums.length <= 5 * 10^4", "1 <= nums[i] <= 10^9", "0 <= k <= 10^9"]),
      hints: [
        "Let `dp[i]` be the number of valid partitions of the first `i` elements. The last segment is `nums[j..i-1]` for some `j`, so `dp[i]` sums `dp[j]` over every `j` whose segment is valid.",
        "If `nums[j..i-1]` is valid, so is every shorter segment ending at `i - 1`. The valid `j`s therefore form one range `[L, i - 1]`, and `L` never moves left as `i` grows.",
        "Track the window's maximum and minimum with two monotonic deques while advancing `L`, and read `dp[L] + ... + dp[i - 1]` from a running prefix sum.",
      ],
      editorial: explain({
        idea: "The count obeys a simple recurrence over the position of the last cut, and the valid positions for that cut form a sliding window. Monotonic deques maintain the window's max and min, and prefix sums of `dp` turn each window sum into one subtraction.",
        steps: [
          "Set `dp[0] = 1` and `pre[1] = 1`, where `pre[i] = dp[0] + ... + dp[i - 1]`.",
          "For each index `i` (0-based), push `i` onto a decreasing deque (for the max) and an increasing deque (for the min).",
          "While `max - min > k` for the window `[L, i]`, advance `L` and drop deque fronts that fall out of the window.",
          "Set `dp[i + 1] = pre[i + 1] - pre[L]` (mod `10^9 + 7`) and `pre[i + 2] = pre[i + 1] + dp[i + 1]`.",
          "Return `dp[n]`.",
        ],
        why: "Shrinking a segment can only lower its maximum and raise its minimum, so validity is monotone in the left end: once `nums[L..i]` is valid, every `nums[j..i]` with `j >= L` is valid, and once `nums[L..i]` is invalid it stays invalid for all larger `i`. That makes `L` a two-pointer boundary and the set of valid last-cut positions exactly `[L, i]`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The prefix-sum subtraction can go negative modulo `10^9 + 7` — add the modulus back.",
          "Values reach `10^9`, but their difference never exceeds `10^9`, so `max - min` fits a 32-bit integer; adding them would not.",
          "The deques store indices, not values, so you can tell when the front has left the window.",
        ],
      }),
      examples: [
        { input: "[9,4,1,3,7]\n4", expectedOutput: "6" },
        { input: "[3,3,4]\n0", expectedOutput: "2" },
        { input: "[1,2]\n5", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 8, 25, 60]));
        const top = pick(rng, [1, 5, 20, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const k = top === 1000000000 ? pick(rng, [0, ri(rng, 0, 1000000000), 1000000000]) : ri(rng, 0, top);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def countPartitions(nums: List[int], k: int) -> int:
              MOD = 10**9 + 7
              n = len(nums)
              dp = [0] * (n + 1)
              dp[0] = 1
              pre = [0] * (n + 2)
              pre[1] = 1
              mx, mn = deque(), deque()
              left = 0
              for i in range(n):
                  while mx and nums[mx[-1]] <= nums[i]:
                      mx.pop()
                  mx.append(i)
                  while mn and nums[mn[-1]] >= nums[i]:
                      mn.pop()
                  mn.append(i)
                  while nums[mx[0]] - nums[mn[0]] > k:
                      left += 1
                      if mx[0] < left:
                          mx.popleft()
                      if mn[0] < left:
                          mn.popleft()
                  dp[i + 1] = (pre[i + 1] - pre[left]) % MOD
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % MOD
              return dp[n]
        `,
        javascript: code`
          var countPartitions = function(nums, k) {
              var MOD = 1000000007;
              var n = nums.length;
              var dp = new Array(n + 1).fill(0);
              var pre = new Array(n + 2).fill(0);
              dp[0] = 1;
              pre[1] = 1;
              var mx = [], mn = [], mxHead = 0, mnHead = 0, left = 0;
              for (var i = 0; i < n; i++) {
                  while (mx.length > mxHead && nums[mx[mx.length - 1]] <= nums[i]) mx.pop();
                  mx.push(i);
                  while (mn.length > mnHead && nums[mn[mn.length - 1]] >= nums[i]) mn.pop();
                  mn.push(i);
                  while (nums[mx[mxHead]] - nums[mn[mnHead]] > k) {
                      left++;
                      if (mx[mxHead] < left) mxHead++;
                      if (mn[mnHead] < left) mnHead++;
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + MOD) % MOD;
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % MOD;
              }
              return dp[n];
          };
        `,
        typescript: code`
          function countPartitions(nums: number[], k: number): number {
              var MOD = 1000000007;
              var n = nums.length;
              var dp: number[] = [], pre: number[] = [];
              for (var z = 0; z <= n + 1; z++) { dp.push(0); pre.push(0); }
              dp[0] = 1;
              pre[1] = 1;
              var mx: number[] = [], mn: number[] = [], mxHead = 0, mnHead = 0, left = 0;
              for (var i = 0; i < n; i++) {
                  while (mx.length > mxHead && nums[mx[mx.length - 1]] <= nums[i]) mx.pop();
                  mx.push(i);
                  while (mn.length > mnHead && nums[mn[mn.length - 1]] >= nums[i]) mn.pop();
                  mn.push(i);
                  while (nums[mx[mxHead]] - nums[mn[mnHead]] > k) {
                      left++;
                      if (mx[mxHead] < left) mxHead++;
                      if (mn[mnHead] < left) mnHead++;
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + MOD) % MOD;
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % MOD;
              }
              return dp[n];
          }
        `,
        java: code`
          public static int countPartitions(int[] nums, int k) {
              final long MOD = 1000000007L;
              int n = nums.length;
              long[] dp = new long[n + 1], pre = new long[n + 2];
              dp[0] = 1;
              pre[1] = 1;
              ArrayDeque<Integer> mx = new ArrayDeque<>(), mn = new ArrayDeque<>();
              int left = 0;
              for (int i = 0; i < n; i++) {
                  while (!mx.isEmpty() && nums[mx.peekLast()] <= nums[i]) mx.pollLast();
                  mx.addLast(i);
                  while (!mn.isEmpty() && nums[mn.peekLast()] >= nums[i]) mn.pollLast();
                  mn.addLast(i);
                  while (nums[mx.peekFirst()] - nums[mn.peekFirst()] > k) {
                      left++;
                      if (mx.peekFirst() < left) mx.pollFirst();
                      if (mn.peekFirst() < left) mn.pollFirst();
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + MOD) % MOD;
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % MOD;
              }
              return (int) dp[n];
          }
        `,
        cpp: code`
          int countPartitions(vector<int>& nums, int k) {
              const long long MOD = 1000000007LL;
              int n = nums.size();
              vector<long long> dp(n + 1, 0), pre(n + 2, 0);
              dp[0] = 1;
              pre[1] = 1;
              deque<int> mx, mn;
              int left = 0;
              for (int i = 0; i < n; i++) {
                  while (!mx.empty() && nums[mx.back()] <= nums[i]) mx.pop_back();
                  mx.push_back(i);
                  while (!mn.empty() && nums[mn.back()] >= nums[i]) mn.pop_back();
                  mn.push_back(i);
                  while (nums[mx.front()] - nums[mn.front()] > k) {
                      left++;
                      if (mx.front() < left) mx.pop_front();
                      if (mn.front() < left) mn.pop_front();
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + MOD) % MOD;
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % MOD;
              }
              return (int) dp[n];
          }
        `,
        c: code`
          int countPartitions(int* nums, int numsSize, int k) {
              const long long MOD = 1000000007LL;
              int n = numsSize;
              long long* dp = (long long*) calloc((size_t) n + 1, sizeof(long long));
              long long* pre = (long long*) calloc((size_t) n + 2, sizeof(long long));
              int* mx = (int*) malloc(sizeof(int) * n);
              int* mn = (int*) malloc(sizeof(int) * n);
              int mxH = 0, mxT = 0, mnH = 0, mnT = 0, left = 0;
              dp[0] = 1;
              pre[1] = 1;
              for (int i = 0; i < n; i++) {
                  while (mxT > mxH && nums[mx[mxT - 1]] <= nums[i]) mxT--;
                  mx[mxT++] = i;
                  while (mnT > mnH && nums[mn[mnT - 1]] >= nums[i]) mnT--;
                  mn[mnT++] = i;
                  while (nums[mx[mxH]] - nums[mn[mnH]] > k) {
                      left++;
                      if (mx[mxH] < left) mxH++;
                      if (mn[mnH] < left) mnH++;
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + MOD) % MOD;
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % MOD;
              }
              int ans = (int) dp[n];
              free(dp);
              free(pre);
              free(mx);
              free(mn);
              return ans;
          }
        `,
        csharp: code`
          public static int CountPartitions(int[] nums, int k)
          {
              const long MOD = 1000000007L;
              int n = nums.Length;
              long[] dp = new long[n + 1], pre = new long[n + 2];
              dp[0] = 1;
              pre[1] = 1;
              int[] mx = new int[n], mn = new int[n];
              int mxH = 0, mxT = 0, mnH = 0, mnT = 0, left = 0;
              for (int i = 0; i < n; i++)
              {
                  while (mxT > mxH && nums[mx[mxT - 1]] <= nums[i]) mxT--;
                  mx[mxT++] = i;
                  while (mnT > mnH && nums[mn[mnT - 1]] >= nums[i]) mnT--;
                  mn[mnT++] = i;
                  while (nums[mx[mxH]] - nums[mn[mnH]] > k)
                  {
                      left++;
                      if (mx[mxH] < left) mxH++;
                      if (mn[mnH] < left) mnH++;
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + MOD) % MOD;
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % MOD;
              }
              return (int) dp[n];
          }
        `,
        go: code`
          func countPartitions(nums []int, k int) int {
              const mod = 1000000007
              n := len(nums)
              dp := make([]int, n+1)
              pre := make([]int, n+2)
              dp[0] = 1
              pre[1] = 1
              mx := make([]int, 0, n)
              mn := make([]int, 0, n)
              mxH, mnH, left := 0, 0, 0
              for i := 0; i < n; i++ {
                  for len(mx) > mxH && nums[mx[len(mx)-1]] <= nums[i] {
                      mx = mx[:len(mx)-1]
                  }
                  mx = append(mx, i)
                  for len(mn) > mnH && nums[mn[len(mn)-1]] >= nums[i] {
                      mn = mn[:len(mn)-1]
                  }
                  mn = append(mn, i)
                  for nums[mx[mxH]]-nums[mn[mnH]] > k {
                      left++
                      if mx[mxH] < left {
                          mxH++
                      }
                      if mn[mnH] < left {
                          mnH++
                      }
                  }
                  dp[i+1] = (pre[i+1] - pre[left] + mod) % mod
                  pre[i+2] = (pre[i+1] + dp[i+1]) % mod
              }
              return dp[n]
          }
        `,
        kotlin: code`
          fun countPartitions(nums: IntArray, k: Int): Int {
              val modulus = 1000000007L
              val n = nums.size
              val dp = LongArray(n + 1)
              val pre = LongArray(n + 2)
              dp[0] = 1L
              pre[1] = 1L
              val mx = IntArray(n)
              val mn = IntArray(n)
              var mxH = 0
              var mxT = 0
              var mnH = 0
              var mnT = 0
              var left = 0
              for (i in 0 until n) {
                  while (mxT > mxH && nums[mx[mxT - 1]] <= nums[i]) mxT--
                  mx[mxT++] = i
                  while (mnT > mnH && nums[mn[mnT - 1]] >= nums[i]) mnT--
                  mn[mnT++] = i
                  while (nums[mx[mxH]] - nums[mn[mnH]] > k) {
                      left++
                      if (mx[mxH] < left) mxH++
                      if (mn[mnH] < left) mnH++
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + modulus) % modulus
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % modulus
              }
              return dp[n].toInt()
          }
        `,
        swift: code`
          func countPartitions(_ nums: [Int], _ k: Int) -> Int {
              let modulus = 1000000007
              let n = nums.count
              var dp = [Int](repeating: 0, count: n + 1)
              var pre = [Int](repeating: 0, count: n + 2)
              dp[0] = 1
              pre[1] = 1
              var mx = [Int](repeating: 0, count: n), mn = [Int](repeating: 0, count: n)
              var mxH = 0, mxT = 0, mnH = 0, mnT = 0, left = 0
              for i in 0..<n {
                  while mxT > mxH && nums[mx[mxT - 1]] <= nums[i] { mxT -= 1 }
                  mx[mxT] = i
                  mxT += 1
                  while mnT > mnH && nums[mn[mnT - 1]] >= nums[i] { mnT -= 1 }
                  mn[mnT] = i
                  mnT += 1
                  while nums[mx[mxH]] - nums[mn[mnH]] > k {
                      left += 1
                      if mx[mxH] < left { mxH += 1 }
                      if mn[mnH] < left { mnH += 1 }
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + modulus) % modulus
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % modulus
              }
              return dp[n]
          }
        `,
        rust: code`
          fn countPartitions(nums: Vec<i32>, k: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let n = nums.len();
              let mut dp = vec![0i64; n + 1];
              let mut pre = vec![0i64; n + 2];
              dp[0] = 1;
              pre[1] = 1;
              let mut mx: Vec<usize> = Vec::with_capacity(n);
              let mut mn: Vec<usize> = Vec::with_capacity(n);
              let (mut mx_h, mut mn_h, mut left) = (0usize, 0usize, 0usize);
              for i in 0..n {
                  while mx.len() > mx_h && nums[*mx.last().unwrap()] <= nums[i] {
                      mx.pop();
                  }
                  mx.push(i);
                  while mn.len() > mn_h && nums[*mn.last().unwrap()] >= nums[i] {
                      mn.pop();
                  }
                  mn.push(i);
                  while nums[mx[mx_h]] - nums[mn[mn_h]] > k {
                      left += 1;
                      if mx[mx_h] < left {
                          mx_h += 1;
                      }
                      if mn[mn_h] < left {
                          mn_h += 1;
                      }
                  }
                  dp[i + 1] = (pre[i + 1] - pre[left] + modulus) % modulus;
                  pre[i + 2] = (pre[i + 1] + dp[i + 1]) % modulus;
              }
              dp[n] as i32
          }
        `,
        php: code`
          function countPartitions($nums, $k) {
              $MOD = 1000000007;
              $n = count($nums);
              $dp = array_fill(0, $n + 1, 0);
              $pre = array_fill(0, $n + 2, 0);
              $dp[0] = 1;
              $pre[1] = 1;
              $mx = [];
              $mn = [];
              $mxH = 0; $mxT = 0; $mnH = 0; $mnT = 0; $left = 0;
              for ($i = 0; $i < $n; $i++) {
                  while ($mxT > $mxH && $nums[$mx[$mxT - 1]] <= $nums[$i]) $mxT--;
                  $mx[$mxT++] = $i;
                  while ($mnT > $mnH && $nums[$mn[$mnT - 1]] >= $nums[$i]) $mnT--;
                  $mn[$mnT++] = $i;
                  while ($nums[$mx[$mxH]] - $nums[$mn[$mnH]] > $k) {
                      $left++;
                      if ($mx[$mxH] < $left) $mxH++;
                      if ($mn[$mnH] < $left) $mnH++;
                  }
                  $dp[$i + 1] = ($pre[$i + 1] - $pre[$left] + $MOD) % $MOD;
                  $pre[$i + 2] = ($pre[$i + 1] + $dp[$i + 1]) % $MOD;
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def countPartitions(nums, k)
            mod = 1_000_000_007
            n = nums.length
            dp = Array.new(n + 1, 0)
            pre = Array.new(n + 2, 0)
            dp[0] = 1
            pre[1] = 1
            mx = []
            mn = []
            mx_h = 0
            mn_h = 0
            left = 0
            n.times do |i|
              mx.pop while mx.length > mx_h && nums[mx[-1]] <= nums[i]
              mx << i
              mn.pop while mn.length > mn_h && nums[mn[-1]] >= nums[i]
              mn << i
              while nums[mx[mx_h]] - nums[mn[mn_h]] > k
                left += 1
                mx_h += 1 if mx[mx_h] < left
                mn_h += 1 if mn[mn_h] < left
              end
              dp[i + 1] = (pre[i + 1] - pre[left]) % mod
              pre[i + 2] = (pre[i + 1] + dp[i + 1]) % mod
            end
            dp[n]
          end
        `,
      },
    };
  })(),
];
