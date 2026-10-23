/**
 * Array scans, prefix sums & difference arrays — wave 7, batch 13.
 * Real problems only: LeetCode numbered problems, from the recent weekly
 * contest easies (adjacent increasing runs, trionic arrays, stable mountains)
 * to the classic prefix/difference-array hards (Smallest Rotation with Highest
 * Score, Stamping the Grid, Maximum Number of Ways to Partition an Array).
 * Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * int32: every answer here fits a signed 32-bit int. Where the original's
 * answer could not (Collecting Chocolates, Intervals Between Identical
 * Elements) the stated constraints are reduced so it provably does, and the
 * statement says so; where only an intermediate can overflow (prefix sums in
 * Count the Hidden Sequences and Ways to Partition an Array, `k * x` in
 * Collecting Chocolates) the typed languages carry it in 64 bits.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const ARRAYS9_PROBLEMS: CatalogProblem[] = [

  // ── Number of Adjacent Elements With the Same Color (LC 2672) ──
  (() => {
    const ref = (n: number, queries: number[][]) => {
      const col = new Array(n).fill(0);
      const out: number[] = [];
      for (const [i, c] of queries) {
        col[i] = c;
        let cnt = 0;
        for (let j = 0; j + 1 < n; j++) if (col[j] !== 0 && col[j] === col[j + 1]) cnt++;
        out.push(cnt);
      }
      return out;
    };
    return {
      slug: "number-of-adjacent-elements-with-the-same-color",
      title: "Number of Adjacent Elements With the Same Color",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Simulation", "Amazon", "Google"],
      signature: { funcName: "colorTheArray", params: [{ name: "n", type: "int" as const }, { name: "queries", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A row of `n` cells starts out uncoloured — every cell holds `0`. You then process `queries` in order, where `queries[i] = [index, color]` paints cell `index` with `color` (overwriting whatever it held; `color` is always at least `1`).\n\nAfter each query, count the pairs of **neighbouring** cells `j` and `j + 1` that are both coloured and hold the same colour. Uncoloured cells never form a pair.\n\nReturn an array whose `i`-th entry is that count right after the `i`-th query.",
        [
          { in: "n = 4, queries = [[0,2],[1,2],[3,1],[1,1],[2,1]]", out: "[0,1,1,0,2]", note: "The row goes [2,0,0,0] → [2,2,0,0] → [2,2,0,1] → [2,1,0,1] → [2,1,1,1]; the last row has the pairs (1,2) and (2,3)." },
          { in: "n = 3, queries = [[1,5],[1,5],[0,5],[2,5],[1,3]]", out: "[0,0,1,2,0]", note: "Repainting a cell with its own colour changes nothing; painting the middle cell 3 breaks both pairs at once." },
          { in: "n = 1, queries = [[0,100000]]", out: "[0]", note: "A single cell has no neighbour." },
        ],
        ["1 <= n <= 10^5", "1 <= queries.length <= 10^5", "queries[i].length == 2", "0 <= index <= n - 1", "1 <= color <= 10^5"]),
      hints: [
        "Recounting every pair after each query is `O(n)` per query — too slow for `10^5` queries. Only the pairs that touch the painted cell can change.",
        "Keep a running count. A query at `index` only affects the pairs `(index - 1, index)` and `(index, index + 1)`.",
        "Before repainting, subtract the pairs the cell's old colour formed with its neighbours (only if it was coloured); after repainting, add the pairs the new colour forms.",
      ],
      editorial: explain({
        idea: "A query changes one cell, and a cell belongs to at most two neighbouring pairs, so the number of equal pairs can be maintained incrementally in `O(1)` per query.",
        steps: [
          "Keep the colours in an array of zeros and a counter `count = 0`.",
          "For a query `[i, c]`, if cell `i` is coloured, subtract one for each neighbour (`i - 1`, `i + 1`) that exists and holds the same colour as cell `i`.",
          "Paint cell `i` with `c`.",
          "Add one for each existing neighbour that now holds `c`, and record `count`.",
        ],
        why: "Every pair not containing cell `i` is untouched by the query, so its contribution to the count is unchanged. The two pairs that do contain `i` are first removed with their old status and then re-added with their new one, so after each query `count` equals the true number of equal coloured pairs.",
        time: "O(n + q)",
        space: "O(n)",
        pitfalls: [
          "An uncoloured cell (`0`) must never pair with another uncoloured cell — guard the subtraction with `old != 0` (the addition is safe because `color >= 1`).",
          "Repainting a cell with the colour it already has must leave the count unchanged; subtract-then-add handles it naturally.",
          "Check the array bounds for both neighbours, especially when `n = 1`.",
        ],
      }),
      examples: [
        { input: "4\n[[0,2],[1,2],[3,1],[1,1],[2,1]]", expectedOutput: "[0,1,1,0,2]" },
        { input: "3\n[[1,5],[1,5],[0,5],[2,5],[1,3]]", expectedOutput: "[0,0,1,2,0]" },
        { input: "1\n[[0,100000]]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 2, 5, 12, 30]));
        const q = ri(rng, 1, pick(rng, [1, 5, 15, 40]));
        const top = pick(rng, [1, 2, 3, 100000]);
        const queries = Array.from({ length: q }, () => [ri(rng, 0, n - 1), ri(rng, 1, top)]);
        return { input: `${n}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(n, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def colorTheArray(n: int, queries: List[List[int]]) -> List[int]:
              colors = [0] * n
              count = 0
              answer = []
              for i, c in queries:
                  old = colors[i]
                  if old != 0:
                      if i > 0 and colors[i - 1] == old:
                          count -= 1
                      if i + 1 < n and colors[i + 1] == old:
                          count -= 1
                  colors[i] = c
                  if i > 0 and colors[i - 1] == c:
                      count += 1
                  if i + 1 < n and colors[i + 1] == c:
                      count += 1
                  answer.append(count)
              return answer
        `,
        javascript: code`
          var colorTheArray = function(n, queries) {
              var colors = new Array(n);
              for (var k = 0; k < n; k++) colors[k] = 0;
              var count = 0;
              var answer = [];
              for (var q = 0; q < queries.length; q++) {
                  var i = queries[q][0], c = queries[q][1];
                  var old = colors[i];
                  if (old !== 0) {
                      if (i > 0 && colors[i - 1] === old) count--;
                      if (i + 1 < n && colors[i + 1] === old) count--;
                  }
                  colors[i] = c;
                  if (i > 0 && colors[i - 1] === c) count++;
                  if (i + 1 < n && colors[i + 1] === c) count++;
                  answer.push(count);
              }
              return answer;
          };
        `,
        typescript: code`
          function colorTheArray(n: number, queries: number[][]): number[] {
              var colors: number[] = [];
              for (var k = 0; k < n; k++) colors.push(0);
              var count = 0;
              var answer: number[] = [];
              for (var q = 0; q < queries.length; q++) {
                  var i = queries[q][0], c = queries[q][1];
                  var old = colors[i];
                  if (old !== 0) {
                      if (i > 0 && colors[i - 1] === old) count--;
                      if (i + 1 < n && colors[i + 1] === old) count--;
                  }
                  colors[i] = c;
                  if (i > 0 && colors[i - 1] === c) count++;
                  if (i + 1 < n && colors[i + 1] === c) count++;
                  answer.push(count);
              }
              return answer;
          }
        `,
        java: code`
          public static int[] colorTheArray(int n, int[][] queries) {
              int[] colors = new int[n];
              int[] answer = new int[queries.length];
              int count = 0;
              for (int q = 0; q < queries.length; q++) {
                  int i = queries[q][0], c = queries[q][1];
                  int old = colors[i];
                  if (old != 0) {
                      if (i > 0 && colors[i - 1] == old) count--;
                      if (i + 1 < n && colors[i + 1] == old) count--;
                  }
                  colors[i] = c;
                  if (i > 0 && colors[i - 1] == c) count++;
                  if (i + 1 < n && colors[i + 1] == c) count++;
                  answer[q] = count;
              }
              return answer;
          }
        `,
        cpp: code`
          vector<int> colorTheArray(int n, vector<vector<int>>& queries) {
              vector<int> colors(n, 0), answer;
              int count = 0;
              for (auto& qu : queries) {
                  int i = qu[0], c = qu[1];
                  int old = colors[i];
                  if (old != 0) {
                      if (i > 0 && colors[i - 1] == old) count--;
                      if (i + 1 < n && colors[i + 1] == old) count--;
                  }
                  colors[i] = c;
                  if (i > 0 && colors[i - 1] == c) count++;
                  if (i + 1 < n && colors[i + 1] == c) count++;
                  answer.push_back(count);
              }
              return answer;
          }
        `,
        c: code`
          int* colorTheArray(int n, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int* colors = (int*) calloc((size_t) n, sizeof(int));
              int* answer = (int*) malloc((size_t) (queriesSize + 1) * sizeof(int));
              int count = 0;
              for (int q = 0; q < queriesSize; q++) {
                  int i = queries[q][0], c = queries[q][1];
                  int old = colors[i];
                  if (old != 0) {
                      if (i > 0 && colors[i - 1] == old) count--;
                      if (i + 1 < n && colors[i + 1] == old) count--;
                  }
                  colors[i] = c;
                  if (i > 0 && colors[i - 1] == c) count++;
                  if (i + 1 < n && colors[i + 1] == c) count++;
                  answer[q] = count;
              }
              free(colors);
              *returnSize = queriesSize;
              return answer;
          }
        `,
        csharp: code`
          public static int[] ColorTheArray(int n, int[][] queries)
          {
              int[] colors = new int[n];
              int[] answer = new int[queries.Length];
              int count = 0;
              for (int q = 0; q < queries.Length; q++)
              {
                  int i = queries[q][0], c = queries[q][1];
                  int old = colors[i];
                  if (old != 0)
                  {
                      if (i > 0 && colors[i - 1] == old) count--;
                      if (i + 1 < n && colors[i + 1] == old) count--;
                  }
                  colors[i] = c;
                  if (i > 0 && colors[i - 1] == c) count++;
                  if (i + 1 < n && colors[i + 1] == c) count++;
                  answer[q] = count;
              }
              return answer;
          }
        `,
        go: code`
          func colorTheArray(n int, queries [][]int) []int {
              colors := make([]int, n)
              answer := make([]int, 0, len(queries))
              count := 0
              for _, qu := range queries {
                  i, c := qu[0], qu[1]
                  old := colors[i]
                  if old != 0 {
                      if i > 0 && colors[i-1] == old {
                          count--
                      }
                      if i+1 < n && colors[i+1] == old {
                          count--
                      }
                  }
                  colors[i] = c
                  if i > 0 && colors[i-1] == c {
                      count++
                  }
                  if i+1 < n && colors[i+1] == c {
                      count++
                  }
                  answer = append(answer, count)
              }
              return answer
          }
        `,
        kotlin: code`
          fun colorTheArray(n: Int, queries: Array<IntArray>): IntArray {
              val colors = IntArray(n)
              val answer = IntArray(queries.size)
              var count = 0
              for (q in queries.indices) {
                  val i = queries[q][0]
                  val c = queries[q][1]
                  val old = colors[i]
                  if (old != 0) {
                      if (i > 0 && colors[i - 1] == old) count--
                      if (i + 1 < n && colors[i + 1] == old) count--
                  }
                  colors[i] = c
                  if (i > 0 && colors[i - 1] == c) count++
                  if (i + 1 < n && colors[i + 1] == c) count++
                  answer[q] = count
              }
              return answer
          }
        `,
        swift: code`
          func colorTheArray(_ n: Int, _ queries: [[Int]]) -> [Int] {
              var colors = [Int](repeating: 0, count: n)
              var answer = [Int]()
              var count = 0
              for qu in queries {
                  let i = qu[0], c = qu[1]
                  let old = colors[i]
                  if old != 0 {
                      if i > 0 && colors[i - 1] == old { count -= 1 }
                      if i + 1 < n && colors[i + 1] == old { count -= 1 }
                  }
                  colors[i] = c
                  if i > 0 && colors[i - 1] == c { count += 1 }
                  if i + 1 < n && colors[i + 1] == c { count += 1 }
                  answer.append(count)
              }
              return answer
          }
        `,
        rust: code`
          fn colorTheArray(n: i32, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let n = n as usize;
              let mut colors = vec![0i32; n];
              let mut answer = Vec::with_capacity(queries.len());
              let mut count = 0i32;
              for qu in queries.iter() {
                  let i = qu[0] as usize;
                  let c = qu[1];
                  let old = colors[i];
                  if old != 0 {
                      if i > 0 && colors[i - 1] == old { count -= 1; }
                      if i + 1 < n && colors[i + 1] == old { count -= 1; }
                  }
                  colors[i] = c;
                  if i > 0 && colors[i - 1] == c { count += 1; }
                  if i + 1 < n && colors[i + 1] == c { count += 1; }
                  answer.push(count);
              }
              answer
          }
        `,
        php: code`
          function colorTheArray($n, $queries) {
              $colors = array_fill(0, $n, 0);
              $count = 0;
              $answer = [];
              foreach ($queries as $qu) {
                  $i = $qu[0];
                  $c = $qu[1];
                  $old = $colors[$i];
                  if ($old != 0) {
                      if ($i > 0 && $colors[$i - 1] == $old) $count--;
                      if ($i + 1 < $n && $colors[$i + 1] == $old) $count--;
                  }
                  $colors[$i] = $c;
                  if ($i > 0 && $colors[$i - 1] == $c) $count++;
                  if ($i + 1 < $n && $colors[$i + 1] == $c) $count++;
                  $answer[] = $count;
              }
              return $answer;
          }
        `,
        ruby: code`
          def colorTheArray(n, queries)
            colors = Array.new(n, 0)
            count = 0
            answer = []
            queries.each do |i, c|
              old = colors[i]
              if old != 0
                count -= 1 if i > 0 && colors[i - 1] == old
                count -= 1 if i + 1 < n && colors[i + 1] == old
              end
              colors[i] = c
              count += 1 if i > 0 && colors[i - 1] == c
              count += 1 if i + 1 < n && colors[i + 1] == c
              answer << count
            end
            answer
          end
        `,
      },
    };
  })(),

  // ── Semi-Ordered Permutation (LC 2717) ──────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      // Simulate: bubble 1 to the front, then n to the back, one swap at a time.
      const a = nums.slice();
      const n = a.length;
      let ops = 0;
      let i = a.indexOf(1);
      while (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; i--; ops++; }
      let j = a.indexOf(n);
      while (j < n - 1) { [a[j + 1], a[j]] = [a[j], a[j + 1]]; j++; ops++; }
      return ops;
    };
    return {
      slug: "semi-ordered-permutation",
      title: "Semi-Ordered Permutation",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Microsoft"],
      signature: { funcName: "semiOrderedPermutation", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` is a permutation of the integers `1` to `n` (each appears exactly once). The permutation is **semi-ordered** when its first element is `1` and its last element is `n`.\n\nIn one operation you may swap any two **adjacent** elements. Return the minimum number of operations needed to make `nums` semi-ordered.",
        [
          { in: "nums = [2,1,4,3]", out: "2", note: "Swap the first two elements to get [1,2,4,3], then the last two to get [1,2,3,4]." },
          { in: "nums = [2,4,1,3]", out: "3", note: "Moving 1 to the front takes two swaps ([1,2,4,3]); moving 4 to the back takes one more." },
          { in: "nums = [1,3,4,2,5]", out: "0", note: "Already semi-ordered — the middle does not matter." },
        ],
        ["2 <= nums.length == n <= 50", "1 <= nums[i] <= 50", "nums is a permutation of 1..n"]),
      hints: [
        "Only two values matter: where `1` is and where `n` is.",
        "Moving `1` from position `i` to the front costs `i` adjacent swaps; moving `n` from position `j` to the back costs `n - 1 - j`.",
        "If `1` starts to the right of `n`, the two walks cross: one of the swaps moves both at once, so subtract one.",
      ],
      editorial: explain({
        idea: "The answer is the distance `1` has to travel left plus the distance `n` has to travel right, minus one when their paths cross, because a single swap of the adjacent pair `(n, 1)` advances both.",
        steps: [
          "Find `i`, the index of `1`, and `j`, the index of `n`.",
          "The answer is `i + (n - 1 - j)`.",
          "If `i > j`, subtract `1`.",
        ],
        why: "Each adjacent swap moves `1` at most one place left and `n` at most one place right, so at least `i` swaps must touch `1` and at least `n - 1 - j` must touch `n`; only a swap of the two of them can count for both, and that happens at most once — exactly when `1` starts to the right of `n`. Bubbling `1` to the front and then `n` to the back achieves this bound.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the crossing case over-counts by one (`[2,4,1,3]` needs 3, not 4).",
          "Elements other than `1` and `n` never need to be put in order.",
        ],
      }),
      examples: [
        { input: "[2,1,4,3]", expectedOutput: "2" },
        { input: "[2,4,1,3]", expectedOutput: "3" },
        { input: "[1,3,4,2,5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 3, 6, 20, 50]));
        const nums = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def semiOrderedPermutation(nums: List[int]) -> int:
              n = len(nums)
              i = nums.index(1)
              j = nums.index(n)
              ops = i + (n - 1 - j)
              if i > j:
                  ops -= 1
              return ops
        `,
        javascript: code`
          var semiOrderedPermutation = function(nums) {
              var n = nums.length;
              var i = nums.indexOf(1), j = nums.indexOf(n);
              var ops = i + (n - 1 - j);
              if (i > j) ops--;
              return ops;
          };
        `,
        typescript: code`
          function semiOrderedPermutation(nums: number[]): number {
              var n = nums.length;
              var i = nums.indexOf(1), j = nums.indexOf(n);
              var ops = i + (n - 1 - j);
              if (i > j) ops--;
              return ops;
          }
        `,
        java: code`
          public static int semiOrderedPermutation(int[] nums) {
              int n = nums.length, i = 0, j = 0;
              for (int k = 0; k < n; k++) {
                  if (nums[k] == 1) i = k;
                  if (nums[k] == n) j = k;
              }
              int ops = i + (n - 1 - j);
              if (i > j) ops--;
              return ops;
          }
        `,
        cpp: code`
          int semiOrderedPermutation(vector<int>& nums) {
              int n = nums.size(), i = 0, j = 0;
              for (int k = 0; k < n; k++) {
                  if (nums[k] == 1) i = k;
                  if (nums[k] == n) j = k;
              }
              int ops = i + (n - 1 - j);
              if (i > j) ops--;
              return ops;
          }
        `,
        c: code`
          int semiOrderedPermutation(int* nums, int numsSize) {
              int n = numsSize, i = 0, j = 0;
              for (int k = 0; k < n; k++) {
                  if (nums[k] == 1) i = k;
                  if (nums[k] == n) j = k;
              }
              int ops = i + (n - 1 - j);
              if (i > j) ops--;
              return ops;
          }
        `,
        csharp: code`
          public static int SemiOrderedPermutation(int[] nums)
          {
              int n = nums.Length;
              int i = Array.IndexOf(nums, 1), j = Array.IndexOf(nums, n);
              int ops = i + (n - 1 - j);
              if (i > j) ops--;
              return ops;
          }
        `,
        go: code`
          func semiOrderedPermutation(nums []int) int {
              n := len(nums)
              i, j := 0, 0
              for k, v := range nums {
                  if v == 1 {
                      i = k
                  }
                  if v == n {
                      j = k
                  }
              }
              ops := i + (n - 1 - j)
              if i > j {
                  ops--
              }
              return ops
          }
        `,
        kotlin: code`
          fun semiOrderedPermutation(nums: IntArray): Int {
              val n = nums.size
              val i = nums.indexOf(1)
              val j = nums.indexOf(n)
              var ops = i + (n - 1 - j)
              if (i > j) ops--
              return ops
          }
        `,
        swift: code`
          func semiOrderedPermutation(_ nums: [Int]) -> Int {
              let n = nums.count
              let i = nums.firstIndex(of: 1)!
              let j = nums.firstIndex(of: n)!
              var ops = i + (n - 1 - j)
              if i > j { ops -= 1 }
              return ops
          }
        `,
        rust: code`
          fn semiOrderedPermutation(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let i = nums.iter().position(|&v| v == 1).unwrap();
              let j = nums.iter().position(|&v| v as usize == n).unwrap();
              let mut ops = (i + (n - 1 - j)) as i32;
              if i > j { ops -= 1; }
              ops
          }
        `,
        php: code`
          function semiOrderedPermutation($nums) {
              $n = count($nums);
              $i = array_search(1, $nums);
              $j = array_search($n, $nums);
              $ops = $i + ($n - 1 - $j);
              if ($i > $j) $ops--;
              return $ops;
          }
        `,
        ruby: code`
          def semiOrderedPermutation(nums)
            n = nums.length
            i = nums.index(1)
            j = nums.index(n)
            ops = i + (n - 1 - j)
            ops -= 1 if i > j
            ops
          end
        `,
      },
    };
  })(),

  // ── Collecting Chocolates (LC 2735) ─────────────────────────────
  (() => {
    const ref = (nums: number[], x: number) => {
      // By definition: after k rotations, type t can be bought at any of the
      // k + 1 positions it has visited.
      const n = nums.length;
      let best = Infinity;
      for (let k = 0; k < n; k++) {
        let total = k * x;
        for (let t = 0; t < n; t++) {
          let m = Infinity;
          for (let j = 0; j <= k; j++) m = Math.min(m, nums[(t - j + n) % n]);
          total += m;
        }
        best = Math.min(best, total);
      }
      return best;
    };
    return {
      slug: "collecting-chocolates",
      title: "Collecting Chocolates",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Enumeration", "Amazon"],
      signature: { funcName: "minCost", params: [{ name: "nums", type: "int[]" as const }, { name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A shop has `n` chocolates in a row. At the start, the chocolate at index `i` is of type `i`, and buying the chocolate at index `i` costs `nums[i]` — the price belongs to the **position**, not the type.\n\nYou may perform an operation any number of times, each costing `x`: every chocolate changes type at once, the one of type `t` becoming type `(t + 1) mod n`.\n\nYou want to own one chocolate of **every** type. You can interleave purchases and operations freely. Return the minimum total cost (purchases plus operations).\n\nThe constraints are tightened from the original so the answer always fits in a 32-bit integer.",
        [
          { in: "nums = [20,1,15], x = 5", out: "13", note: "Buy type 1 for 1. Rotate (cost 5): index 1 now holds type 2 — buy it for 1. Rotate again (cost 5): index 1 holds type 0 — buy it for 1. Total 1 + 5 + 1 + 5 + 1 = 13." },
          { in: "nums = [1,2,3], x = 4", out: "6", note: "Rotating never pays off: buy each type where it starts, for 1 + 2 + 3 = 6." },
          { in: "nums = [7], x = 1000000", out: "7" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 10^6", "1 <= x <= 10^6"]),
      hints: [
        "Fix the number of operations `k` you will do in total. Doing more than `n - 1` can never help — after `n` the types are back where they started.",
        "With `k` operations, type `t` passes through `k + 1` consecutive positions, and you can buy it at whichever of them is cheapest. The cost is `k * x` plus the sum of those minima.",
        "Going from `k` to `k + 1` extends every type's window by one position, so update each type's running minimum in `O(1)` instead of recomputing it: `O(n^2)` overall.",
      ],
      editorial: explain({
        idea: "Choose the total number of rotations `k` (`0 <= k < n`). Then every type can be bought at the cheapest of the `k + 1` positions it visits, and those purchases can always be scheduled at the right moments. Try every `k`, extending each type's window by one per step.",
        steps: [
          "Let `best[i] = nums[i]` — the cheapest price for the type that starts at `i` with zero rotations — and `answer = sum(best)`.",
          "For `k = 1 .. n - 1`: set `best[i] = min(best[i], nums[(i + k) mod n])` for every `i`, then `answer = min(answer, k * x + sum(best))`.",
          "Return `answer`.",
        ],
        why: "With `k` rotations each type occupies `k + 1` cyclically consecutive positions at successive moments and can be bought at any one of them, so the cheapest of those prices is optimal for it independently of the other types. Summing over all types, the windows starting at each index and the windows ending at each index are the same set, so `best` as computed gives the same total. Doing `k >= n` rotations costs more and opens no new positions, so the enumeration over `0 <= k < n` covers the optimum.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "`k * x + sum(best)` can exceed `2^31 - 1` even though the answer does not (it is at most `sum(nums)`): use 64-bit arithmetic for the candidate.",
          "Do not stop at the first `k` where the cost rises — try every `k` up to `n - 1`.",
        ],
      }),
      examples: [
        { input: "[20,1,15]\n5", expectedOutput: "13" },
        { input: "[1,2,3]\n4", expectedOutput: "6" },
        { input: "[7]\n1000000", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 20, 40]));
        const top = pick(rng, [1, 10, 1000, 1000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const x = ri(rng, 1, pick(rng, [1, 5, 100, 1000000]));
        return { input: `${fmtIntArr(nums)}\n${x}`, expectedOutput: String(ref(nums, x)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minCost(nums: List[int], x: int) -> int:
              n = len(nums)
              best = nums[:]
              answer = sum(best)
              for k in range(1, n):
                  for i in range(n):
                      v = nums[(i + k) % n]
                      if v < best[i]:
                          best[i] = v
                  answer = min(answer, k * x + sum(best))
              return answer
        `,
        javascript: code`
          var minCost = function(nums, x) {
              var n = nums.length;
              var best = nums.slice();
              var answer = 0;
              for (var i = 0; i < n; i++) answer += best[i];
              for (var k = 1; k < n; k++) {
                  var total = k * x;
                  for (var j = 0; j < n; j++) {
                      var v = nums[(j + k) % n];
                      if (v < best[j]) best[j] = v;
                      total += best[j];
                  }
                  if (total < answer) answer = total;
              }
              return answer;
          };
        `,
        typescript: code`
          function minCost(nums: number[], x: number): number {
              var n = nums.length;
              var best = nums.slice();
              var answer = 0;
              for (var i = 0; i < n; i++) answer += best[i];
              for (var k = 1; k < n; k++) {
                  var total = k * x;
                  for (var j = 0; j < n; j++) {
                      var v = nums[(j + k) % n];
                      if (v < best[j]) best[j] = v;
                      total += best[j];
                  }
                  if (total < answer) answer = total;
              }
              return answer;
          }
        `,
        java: code`
          public static int minCost(int[] nums, int x) {
              int n = nums.length;
              int[] best = nums.clone();
              long answer = 0;
              for (int v : best) answer += v;
              for (int k = 1; k < n; k++) {
                  long total = (long) k * x;
                  for (int j = 0; j < n; j++) {
                      best[j] = Math.min(best[j], nums[(j + k) % n]);
                      total += best[j];
                  }
                  answer = Math.min(answer, total);
              }
              return (int) answer;
          }
        `,
        cpp: code`
          int minCost(vector<int>& nums, int x) {
              int n = nums.size();
              vector<int> best(nums);
              long long answer = 0;
              for (int v : best) answer += v;
              for (int k = 1; k < n; k++) {
                  long long total = (long long) k * x;
                  for (int j = 0; j < n; j++) {
                      best[j] = min(best[j], nums[(j + k) % n]);
                      total += best[j];
                  }
                  answer = min(answer, total);
              }
              return (int) answer;
          }
        `,
        c: code`
          int minCost(int* nums, int numsSize, int x) {
              int n = numsSize;
              int* best = (int*) malloc((size_t) n * sizeof(int));
              long long answer = 0;
              for (int i = 0; i < n; i++) { best[i] = nums[i]; answer += nums[i]; }
              for (int k = 1; k < n; k++) {
                  long long total = (long long) k * x;
                  for (int j = 0; j < n; j++) {
                      int v = nums[(j + k) % n];
                      if (v < best[j]) best[j] = v;
                      total += best[j];
                  }
                  if (total < answer) answer = total;
              }
              free(best);
              return (int) answer;
          }
        `,
        csharp: code`
          public static int MinCost(int[] nums, int x)
          {
              int n = nums.Length;
              int[] best = (int[]) nums.Clone();
              long answer = 0;
              foreach (int v in best) answer += v;
              for (int k = 1; k < n; k++)
              {
                  long total = (long) k * x;
                  for (int j = 0; j < n; j++)
                  {
                      best[j] = Math.Min(best[j], nums[(j + k) % n]);
                      total += best[j];
                  }
                  answer = Math.Min(answer, total);
              }
              return (int) answer;
          }
        `,
        go: code`
          func minCost(nums []int, x int) int {
              n := len(nums)
              best := make([]int, n)
              copy(best, nums)
              answer := 0
              for _, v := range best {
                  answer += v
              }
              for k := 1; k < n; k++ {
                  total := k * x
                  for j := 0; j < n; j++ {
                      if v := nums[(j+k)%n]; v < best[j] {
                          best[j] = v
                      }
                      total += best[j]
                  }
                  if total < answer {
                      answer = total
                  }
              }
              return answer
          }
        `,
        kotlin: code`
          fun minCost(nums: IntArray, x: Int): Int {
              val n = nums.size
              val best = nums.copyOf()
              var answer = 0L
              for (v in best) answer += v
              for (k in 1 until n) {
                  var total = k.toLong() * x
                  for (j in 0 until n) {
                      best[j] = minOf(best[j], nums[(j + k) % n])
                      total += best[j]
                  }
                  answer = minOf(answer, total)
              }
              return answer.toInt()
          }
        `,
        swift: code`
          func minCost(_ nums: [Int], _ x: Int) -> Int {
              let n = nums.count
              var best = nums
              var answer = best.reduce(0, +)
              for k in stride(from: 1, to: n, by: 1) {
                  var total = k * x
                  for j in 0..<n {
                      best[j] = min(best[j], nums[(j + k) % n])
                      total += best[j]
                  }
                  answer = min(answer, total)
              }
              return answer
          }
        `,
        rust: code`
          fn minCost(nums: Vec<i32>, x: i32) -> i32 {
              let n = nums.len();
              let mut best = nums.clone();
              let mut answer: i64 = best.iter().map(|&v| v as i64).sum();
              for k in 1..n {
                  let mut total = k as i64 * x as i64;
                  for j in 0..n {
                      best[j] = best[j].min(nums[(j + k) % n]);
                      total += best[j] as i64;
                  }
                  answer = answer.min(total);
              }
              answer as i32
          }
        `,
        php: code`
          function minCost($nums, $x) {
              $n = count($nums);
              $best = $nums;
              $answer = array_sum($best);
              for ($k = 1; $k < $n; $k++) {
                  $total = $k * $x;
                  for ($j = 0; $j < $n; $j++) {
                      $v = $nums[($j + $k) % $n];
                      if ($v < $best[$j]) $best[$j] = $v;
                      $total += $best[$j];
                  }
                  if ($total < $answer) $answer = $total;
              }
              return $answer;
          }
        `,
        ruby: code`
          def minCost(nums, x)
            n = nums.length
            best = nums.dup
            answer = best.sum
            (1...n).each do |k|
              total = k * x
              (0...n).each do |j|
                v = nums[(j + k) % n]
                best[j] = v if v < best[j]
                total += best[j]
              end
              answer = total if total < answer
            end
            answer
          end
        `,
      },
    };
  })(),

  // ── Maximum Area of Longest Diagonal Rectangle (LC 3000) ────────
  (() => {
    const ref = (dimensions: number[][]) => {
      let bd = -1, ba = 0;
      for (const [l, w] of dimensions) {
        const d = l * l + w * w, a = l * w;
        if (d > bd || (d === bd && a > ba)) { bd = d; ba = a; }
      }
      return ba;
    };
    return {
      slug: "maximum-area-of-longest-diagonal-rectangle",
      title: "Maximum Area of Longest Diagonal Rectangle",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google"],
      signature: { funcName: "areaOfMaxDiagonal", params: [{ name: "dimensions", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a list of rectangles, where `dimensions[i] = [length, width]` describes rectangle `i`.\n\nFind the rectangle with the **longest diagonal** and return its area. If several rectangles share the longest diagonal, return the **largest area** among them.",
        [
          { in: "dimensions = [[9,3],[8,6]]", out: "48", note: "The diagonals are √90 ≈ 9.49 and √100 = 10, so the second rectangle wins with area 8 × 6 = 48." },
          { in: "dimensions = [[3,4],[4,3]]", out: "12", note: "Both diagonals are 5 and both areas are 12." },
          { in: "dimensions = [[1,7],[5,5],[2,6]]", out: "25", note: "1² + 7² = 5² + 5² = 50 is the longest; between areas 7 and 25 the larger is taken." },
        ],
        ["1 <= dimensions.length <= 100", "dimensions[i].length == 2", "1 <= dimensions[i][0], dimensions[i][1] <= 100"]),
      hints: [
        "The diagonal of an `l × w` rectangle is `sqrt(l² + w²)`. Do you need the square root to compare two diagonals?",
        "Compare `l² + w²` directly — it is an integer and orders the diagonals exactly, with no floating-point ties to worry about.",
        "Scan once, keeping the best squared diagonal and, for ties, the best area.",
      ],
      editorial: explain({
        idea: "The square root is monotonic, so the longest diagonal is the one with the largest `l² + w²`. Comparing those integers avoids floating point entirely; ties are broken by area.",
        steps: [
          "Keep `bestDiag = -1` and `bestArea = 0`.",
          "For each `[l, w]`, compute `d = l² + w²` and `a = l × w`.",
          "If `d > bestDiag`, or `d == bestDiag` and `a > bestArea`, take `d` and `a` as the new best.",
          "Return `bestArea`.",
        ],
        why: "`sqrt` is strictly increasing on non-negative numbers, so `sqrt(d1) < sqrt(d2)` exactly when `d1 < d2`; the scan therefore ends on the largest diagonal, and the tie rule keeps the largest area among the rectangles that share it.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Comparing floating-point square roots can misjudge exact ties such as `[1,7]` and `[5,5]`; compare the squares.",
          "A tie on the diagonal does not imply a tie on the area — handle the tie-break explicitly.",
        ],
      }),
      examples: [
        { input: "[[9,3],[8,6]]", expectedOutput: "48" },
        { input: "[[3,4],[4,3]]", expectedOutput: "12" },
        { input: "[[1,7],[5,5],[2,6]]", expectedOutput: "25" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 10, 40]));
        const top = pick(rng, [3, 10, 100]);
        const dims = Array.from({ length: n }, () => [ri(rng, 1, top), ri(rng, 1, top)]);
        return { input: fmtIntMat(dims), expectedOutput: String(ref(dims)) };
      },
      solutions: {
        python: code`
          from typing import List

          def areaOfMaxDiagonal(dimensions: List[List[int]]) -> int:
              best_diag, best_area = -1, 0
              for l, w in dimensions:
                  d, a = l * l + w * w, l * w
                  if d > best_diag or (d == best_diag and a > best_area):
                      best_diag, best_area = d, a
              return best_area
        `,
        javascript: code`
          var areaOfMaxDiagonal = function(dimensions) {
              var bestDiag = -1, bestArea = 0;
              for (var i = 0; i < dimensions.length; i++) {
                  var l = dimensions[i][0], w = dimensions[i][1];
                  var d = l * l + w * w, a = l * w;
                  if (d > bestDiag || (d === bestDiag && a > bestArea)) { bestDiag = d; bestArea = a; }
              }
              return bestArea;
          };
        `,
        typescript: code`
          function areaOfMaxDiagonal(dimensions: number[][]): number {
              var bestDiag = -1, bestArea = 0;
              for (var i = 0; i < dimensions.length; i++) {
                  var l = dimensions[i][0], w = dimensions[i][1];
                  var d = l * l + w * w, a = l * w;
                  if (d > bestDiag || (d === bestDiag && a > bestArea)) { bestDiag = d; bestArea = a; }
              }
              return bestArea;
          }
        `,
        java: code`
          public static int areaOfMaxDiagonal(int[][] dimensions) {
              int bestDiag = -1, bestArea = 0;
              for (int[] r : dimensions) {
                  int d = r[0] * r[0] + r[1] * r[1], a = r[0] * r[1];
                  if (d > bestDiag || (d == bestDiag && a > bestArea)) { bestDiag = d; bestArea = a; }
              }
              return bestArea;
          }
        `,
        cpp: code`
          int areaOfMaxDiagonal(vector<vector<int>>& dimensions) {
              int bestDiag = -1, bestArea = 0;
              for (auto& r : dimensions) {
                  int d = r[0] * r[0] + r[1] * r[1], a = r[0] * r[1];
                  if (d > bestDiag || (d == bestDiag && a > bestArea)) { bestDiag = d; bestArea = a; }
              }
              return bestArea;
          }
        `,
        c: code`
          int areaOfMaxDiagonal(int** dimensions, int dimensionsSize, int* dimensionsColSize) {
              int bestDiag = -1, bestArea = 0;
              for (int i = 0; i < dimensionsSize; i++) {
                  int l = dimensions[i][0], w = dimensions[i][1];
                  int d = l * l + w * w, a = l * w;
                  if (d > bestDiag || (d == bestDiag && a > bestArea)) { bestDiag = d; bestArea = a; }
              }
              return bestArea;
          }
        `,
        csharp: code`
          public static int AreaOfMaxDiagonal(int[][] dimensions)
          {
              int bestDiag = -1, bestArea = 0;
              foreach (int[] r in dimensions)
              {
                  int d = r[0] * r[0] + r[1] * r[1], a = r[0] * r[1];
                  if (d > bestDiag || (d == bestDiag && a > bestArea)) { bestDiag = d; bestArea = a; }
              }
              return bestArea;
          }
        `,
        go: code`
          func areaOfMaxDiagonal(dimensions [][]int) int {
              bestDiag, bestArea := -1, 0
              for _, r := range dimensions {
                  d, a := r[0]*r[0]+r[1]*r[1], r[0]*r[1]
                  if d > bestDiag || (d == bestDiag && a > bestArea) {
                      bestDiag, bestArea = d, a
                  }
              }
              return bestArea
          }
        `,
        kotlin: code`
          fun areaOfMaxDiagonal(dimensions: Array<IntArray>): Int {
              var bestDiag = -1
              var bestArea = 0
              for (r in dimensions) {
                  val d = r[0] * r[0] + r[1] * r[1]
                  val a = r[0] * r[1]
                  if (d > bestDiag || (d == bestDiag && a > bestArea)) { bestDiag = d; bestArea = a }
              }
              return bestArea
          }
        `,
        swift: code`
          func areaOfMaxDiagonal(_ dimensions: [[Int]]) -> Int {
              var bestDiag = -1, bestArea = 0
              for r in dimensions {
                  let d = r[0] * r[0] + r[1] * r[1], a = r[0] * r[1]
                  if d > bestDiag || (d == bestDiag && a > bestArea) { bestDiag = d; bestArea = a }
              }
              return bestArea
          }
        `,
        rust: code`
          fn areaOfMaxDiagonal(dimensions: Vec<Vec<i32>>) -> i32 {
              let (mut best_diag, mut best_area) = (-1i32, 0i32);
              for r in dimensions.iter() {
                  let d = r[0] * r[0] + r[1] * r[1];
                  let a = r[0] * r[1];
                  if d > best_diag || (d == best_diag && a > best_area) {
                      best_diag = d;
                      best_area = a;
                  }
              }
              best_area
          }
        `,
        php: code`
          function areaOfMaxDiagonal($dimensions) {
              $bestDiag = -1;
              $bestArea = 0;
              foreach ($dimensions as $r) {
                  $d = $r[0] * $r[0] + $r[1] * $r[1];
                  $a = $r[0] * $r[1];
                  if ($d > $bestDiag || ($d == $bestDiag && $a > $bestArea)) { $bestDiag = $d; $bestArea = $a; }
              }
              return $bestArea;
          }
        `,
        ruby: code`
          def areaOfMaxDiagonal(dimensions)
            best_diag = -1
            best_area = 0
            dimensions.each do |l, w|
              d = l * l + w * w
              a = l * w
              if d > best_diag || (d == best_diag && a > best_area)
                best_diag = d
                best_area = a
              end
            end
            best_area
          end
        `,
      },
    };
  })(),

  // ── Longest Strictly Increasing or Strictly Decreasing Subarray (LC 3105)
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i; j < nums.length; j++) {
          let inc = true, dec = true;
          for (let k = i; k < j; k++) {
            if (nums[k] >= nums[k + 1]) inc = false;
            if (nums[k] <= nums[k + 1]) dec = false;
          }
          if (inc || dec) best = Math.max(best, j - i + 1);
        }
      }
      return best;
    };
    return {
      slug: "longest-strictly-increasing-or-strictly-decreasing-subarray",
      title: "Longest Strictly Increasing or Strictly Decreasing Subarray",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google"],
      signature: { funcName: "longestMonotonicSubarray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the length of the longest **contiguous** subarray that is either **strictly increasing** or **strictly decreasing**.\n\nA single element counts as both.",
        [
          { in: "nums = [1,4,3,3,2]", out: "2", note: "[1,4] is increasing and [4,3] and [3,2] are decreasing; nothing longer works because of the repeated 3." },
          { in: "nums = [3,3,3,3]", out: "1", note: "Equal neighbours break both kinds of run, so only single elements qualify." },
          { in: "nums = [3,2,1]", out: "3", note: "The whole array is strictly decreasing." },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 50"]),
      hints: [
        "A strictly increasing subarray can always be extended as long as the next element is larger — think in terms of maximal runs.",
        "Walk the array once, keeping the length of the increasing run and of the decreasing run that end at the current index.",
        "When `nums[i] > nums[i - 1]` the increasing run grows and the decreasing run restarts at `1`; the opposite for `<`; both restart on equality.",
      ],
      editorial: explain({
        idea: "Track two run lengths ending at each index — one for strictly increasing, one for strictly decreasing. Each step either extends a run or resets it to `1`, and the answer is the largest value either reaches.",
        steps: [
          "Set `inc = dec = best = 1`.",
          "For each `i >= 1`: if `nums[i] > nums[i - 1]`, then `inc += 1` and `dec = 1`; if `nums[i] < nums[i - 1]`, then `dec += 1` and `inc = 1`; otherwise both become `1`.",
          "Update `best = max(best, inc, dec)` and return it.",
        ],
        why: "`inc` at index `i` is exactly the length of the longest strictly increasing subarray ending at `i`: it can extend the one ending at `i - 1` precisely when `nums[i] > nums[i - 1]`. The same holds for `dec`, and every candidate subarray ends somewhere, so the maximum over all `i` is the answer.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Equal neighbours break both runs — \"strictly\" means `[3,3]` is neither increasing nor decreasing.",
          "Start `best` at `1`: a one-element array is a valid answer of length 1.",
        ],
      }),
      examples: [
        { input: "[1,4,3,3,2]", expectedOutput: "2" },
        { input: "[3,3,3,3]", expectedOutput: "1" },
        { input: "[3,2,1]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30, 50]));
        const top = pick(rng, [1, 2, 5, 50]);
        let nums = Array.from({ length: n }, () => ri(rng, 1, top));
        if (rng() < 0.2) {
          const desc = rng() < 0.5;
          nums = nums.sort((a, b) => (desc ? b - a : a - b));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def longestMonotonicSubarray(nums: List[int]) -> int:
              inc = dec = best = 1
              for i in range(1, len(nums)):
                  if nums[i] > nums[i - 1]:
                      inc, dec = inc + 1, 1
                  elif nums[i] < nums[i - 1]:
                      inc, dec = 1, dec + 1
                  else:
                      inc = dec = 1
                  best = max(best, inc, dec)
              return best
        `,
        javascript: code`
          var longestMonotonicSubarray = function(nums) {
              var inc = 1, dec = 1, best = 1;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) { inc++; dec = 1; }
                  else if (nums[i] < nums[i - 1]) { dec++; inc = 1; }
                  else { inc = 1; dec = 1; }
                  best = Math.max(best, inc, dec);
              }
              return best;
          };
        `,
        typescript: code`
          function longestMonotonicSubarray(nums: number[]): number {
              var inc = 1, dec = 1, best = 1;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) { inc++; dec = 1; }
                  else if (nums[i] < nums[i - 1]) { dec++; inc = 1; }
                  else { inc = 1; dec = 1; }
                  best = Math.max(best, inc, dec);
              }
              return best;
          }
        `,
        java: code`
          public static int longestMonotonicSubarray(int[] nums) {
              int inc = 1, dec = 1, best = 1;
              for (int i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) { inc++; dec = 1; }
                  else if (nums[i] < nums[i - 1]) { dec++; inc = 1; }
                  else { inc = 1; dec = 1; }
                  best = Math.max(best, Math.max(inc, dec));
              }
              return best;
          }
        `,
        cpp: code`
          int longestMonotonicSubarray(vector<int>& nums) {
              int inc = 1, dec = 1, best = 1;
              for (size_t i = 1; i < nums.size(); i++) {
                  if (nums[i] > nums[i - 1]) { inc++; dec = 1; }
                  else if (nums[i] < nums[i - 1]) { dec++; inc = 1; }
                  else { inc = 1; dec = 1; }
                  best = max(best, max(inc, dec));
              }
              return best;
          }
        `,
        c: code`
          int longestMonotonicSubarray(int* nums, int numsSize) {
              int inc = 1, dec = 1, best = 1;
              for (int i = 1; i < numsSize; i++) {
                  if (nums[i] > nums[i - 1]) { inc++; dec = 1; }
                  else if (nums[i] < nums[i - 1]) { dec++; inc = 1; }
                  else { inc = 1; dec = 1; }
                  if (inc > best) best = inc;
                  if (dec > best) best = dec;
              }
              return best;
          }
        `,
        csharp: code`
          public static int LongestMonotonicSubarray(int[] nums)
          {
              int inc = 1, dec = 1, best = 1;
              for (int i = 1; i < nums.Length; i++)
              {
                  if (nums[i] > nums[i - 1]) { inc++; dec = 1; }
                  else if (nums[i] < nums[i - 1]) { dec++; inc = 1; }
                  else { inc = 1; dec = 1; }
                  best = Math.Max(best, Math.Max(inc, dec));
              }
              return best;
          }
        `,
        go: code`
          func longestMonotonicSubarray(nums []int) int {
              inc, dec, best := 1, 1, 1
              for i := 1; i < len(nums); i++ {
                  if nums[i] > nums[i-1] {
                      inc, dec = inc+1, 1
                  } else if nums[i] < nums[i-1] {
                      inc, dec = 1, dec+1
                  } else {
                      inc, dec = 1, 1
                  }
                  if inc > best {
                      best = inc
                  }
                  if dec > best {
                      best = dec
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun longestMonotonicSubarray(nums: IntArray): Int {
              var inc = 1
              var dec = 1
              var best = 1
              for (i in 1 until nums.size) {
                  if (nums[i] > nums[i - 1]) { inc++; dec = 1 }
                  else if (nums[i] < nums[i - 1]) { dec++; inc = 1 }
                  else { inc = 1; dec = 1 }
                  best = maxOf(best, inc, dec)
              }
              return best
          }
        `,
        swift: code`
          func longestMonotonicSubarray(_ nums: [Int]) -> Int {
              var inc = 1, dec = 1, best = 1
              for i in stride(from: 1, to: nums.count, by: 1) {
                  if nums[i] > nums[i - 1] { inc += 1; dec = 1 }
                  else if nums[i] < nums[i - 1] { dec += 1; inc = 1 }
                  else { inc = 1; dec = 1 }
                  best = max(best, inc, dec)
              }
              return best
          }
        `,
        rust: code`
          fn longestMonotonicSubarray(nums: Vec<i32>) -> i32 {
              let (mut inc, mut dec, mut best) = (1, 1, 1);
              for i in 1..nums.len() {
                  if nums[i] > nums[i - 1] { inc += 1; dec = 1; }
                  else if nums[i] < nums[i - 1] { dec += 1; inc = 1; }
                  else { inc = 1; dec = 1; }
                  best = best.max(inc).max(dec);
              }
              best
          }
        `,
        php: code`
          function longestMonotonicSubarray($nums) {
              $inc = 1; $dec = 1; $best = 1;
              for ($i = 1; $i < count($nums); $i++) {
                  if ($nums[$i] > $nums[$i - 1]) { $inc++; $dec = 1; }
                  elseif ($nums[$i] < $nums[$i - 1]) { $dec++; $inc = 1; }
                  else { $inc = 1; $dec = 1; }
                  $best = max($best, $inc, $dec);
              }
              return $best;
          }
        `,
        ruby: code`
          def longestMonotonicSubarray(nums)
            inc = dec = best = 1
            (1...nums.length).each do |i|
              if nums[i] > nums[i - 1]
                inc += 1
                dec = 1
              elsif nums[i] < nums[i - 1]
                dec += 1
                inc = 1
              else
                inc = dec = 1
              end
              best = [best, inc, dec].max
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Find Indices of Stable Mountains (LC 3285) ──────────────────
  (() => {
    const ref = (height: number[], threshold: number) => {
      const out: number[] = [];
      for (let i = 1; i < height.length; i++) if (height[i - 1] > threshold) out.push(i);
      return out;
    };
    return {
      slug: "find-indices-of-stable-mountains",
      title: "Find Indices of Stable Mountains",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon"],
      signature: { funcName: "stableMountains", params: [{ name: "height", type: "int[]" as const }, { name: "threshold", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "There are `n` mountains in a row; mountain `i` has height `height[i]`. A mountain is **stable** when the mountain immediately before it is **strictly taller** than `threshold`. Mountain `0` has nothing before it, so it is never stable.\n\nReturn the indices of all stable mountains in **increasing order** (an empty array if there are none).",
        [
          { in: "height = [1,2,3,4,5], threshold = 2", out: "[3,4]", note: "Mountain 3 follows height 3 > 2 and mountain 4 follows height 4 > 2." },
          { in: "height = [10,1,10,1,10], threshold = 3", out: "[1,3]" },
          { in: "height = [10,1,10,1,10], threshold = 10", out: "[]", note: "No height is strictly greater than 10." },
        ],
        ["2 <= n == height.length <= 100", "1 <= height[i] <= 100", "1 <= threshold <= 100"]),
      hints: [
        "Stability of mountain `i` depends only on `height[i - 1]` — not on its own height.",
        "Loop `i` from `1` to `n - 1` and keep `i` whenever `height[i - 1] > threshold`; the loop order already gives increasing indices.",
      ],
      editorial: explain({
        idea: "Each mountain's stability is a single comparison on its left neighbour, so one pass collects the answer, already in increasing order.",
        steps: [
          "Start with an empty list.",
          "For `i = 1 .. n - 1`, append `i` if `height[i - 1] > threshold`.",
          "Return the list.",
        ],
        why: "The definition is checked literally for every index that can be stable, and indices are visited in increasing order.",
        time: "O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "The comparison is strict: a neighbour exactly equal to `threshold` does not make a mountain stable.",
          "Return the index of the mountain *after* the tall one, not the tall one itself.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n2", expectedOutput: "[3,4]" },
        { input: "[10,1,10,1,10]\n3", expectedOutput: "[1,3]" },
        { input: "[10,1,10,1,10]\n10", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 20, 60, 100]));
        const top = pick(rng, [5, 20, 100]);
        const height = Array.from({ length: n }, () => ri(rng, 1, top));
        const threshold = ri(rng, 1, Math.min(100, top + 1));
        return { input: `${fmtIntArr(height)}\n${threshold}`, expectedOutput: fmtIntArr(ref(height, threshold)) };
      },
      solutions: {
        python: code`
          from typing import List

          def stableMountains(height: List[int], threshold: int) -> List[int]:
              return [i for i in range(1, len(height)) if height[i - 1] > threshold]
        `,
        javascript: code`
          var stableMountains = function(height, threshold) {
              var out = [];
              for (var i = 1; i < height.length; i++) if (height[i - 1] > threshold) out.push(i);
              return out;
          };
        `,
        typescript: code`
          function stableMountains(height: number[], threshold: number): number[] {
              var out: number[] = [];
              for (var i = 1; i < height.length; i++) if (height[i - 1] > threshold) out.push(i);
              return out;
          }
        `,
        java: code`
          public static int[] stableMountains(int[] height, int threshold) {
              List<Integer> out = new ArrayList<>();
              for (int i = 1; i < height.length; i++) if (height[i - 1] > threshold) out.add(i);
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> stableMountains(vector<int>& height, int threshold) {
              vector<int> out;
              for (size_t i = 1; i < height.size(); i++) if (height[i - 1] > threshold) out.push_back((int) i);
              return out;
          }
        `,
        c: code`
          int* stableMountains(int* height, int heightSize, int threshold, int* returnSize) {
              int* out = (int*) malloc((size_t) (heightSize + 1) * sizeof(int));
              int k = 0;
              for (int i = 1; i < heightSize; i++) if (height[i - 1] > threshold) out[k++] = i;
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static int[] StableMountains(int[] height, int threshold)
          {
              var out_ = new List<int>();
              for (int i = 1; i < height.Length; i++) if (height[i - 1] > threshold) out_.Add(i);
              return out_.ToArray();
          }
        `,
        go: code`
          func stableMountains(height []int, threshold int) []int {
              out := []int{}
              for i := 1; i < len(height); i++ {
                  if height[i-1] > threshold {
                      out = append(out, i)
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun stableMountains(height: IntArray, threshold: Int): IntArray {
              val out = ArrayList<Int>()
              for (i in 1 until height.size) if (height[i - 1] > threshold) out.add(i)
              return out.toIntArray()
          }
        `,
        swift: code`
          func stableMountains(_ height: [Int], _ threshold: Int) -> [Int] {
              var out = [Int]()
              for i in stride(from: 1, to: height.count, by: 1) where height[i - 1] > threshold {
                  out.append(i)
              }
              return out
          }
        `,
        rust: code`
          fn stableMountains(height: Vec<i32>, threshold: i32) -> Vec<i32> {
              (1..height.len()).filter(|&i| height[i - 1] > threshold).map(|i| i as i32).collect()
          }
        `,
        php: code`
          function stableMountains($height, $threshold) {
              $out = [];
              for ($i = 1; $i < count($height); $i++) if ($height[$i - 1] > $threshold) $out[] = $i;
              return $out;
          }
        `,
        ruby: code`
          def stableMountains(height, threshold)
            (1...height.length).select { |i| height[i - 1] > threshold }
          end
        `,
      },
    };
  })(),

  // ── Adjacent Increasing Subarrays Detection I (LC 3349) ─────────
  (() => {
    const incAt = (nums: number[], a: number, k: number) => {
      for (let i = a; i + 1 < a + k; i++) if (nums[i] >= nums[i + 1]) return false;
      return true;
    };
    const ref = (nums: number[], k: number) => {
      for (let a = 0; a + 2 * k <= nums.length; a++) if (incAt(nums, a, k) && incAt(nums, a + k, k)) return true;
      return false;
    };
    return {
      slug: "adjacent-increasing-subarrays-detection-i",
      title: "Adjacent Increasing Subarrays Detection I",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google"],
      signature: { funcName: "hasIncreasingSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an array `nums` and an integer `k`, decide whether there are **two adjacent** subarrays of length `k` that are both **strictly increasing**.\n\nFormally, return `true` if some index `a` exists such that `nums[a..a + k - 1]` and `nums[a + k..a + 2k - 1]` are both strictly increasing, and `false` otherwise. The second subarray starts right where the first one ends.",
        [
          { in: "nums = [2,5,7,8,9,2,3,4,3,1], k = 3", out: "true", note: "[7,8,9] starts at index 2 and [2,3,4] starts at index 5 — both strictly increasing and back to back." },
          { in: "nums = [1,2,3,4,4,4,4,5,6,7], k = 5", out: "false", note: "The repeated 4s break every run, and no run is long enough." },
          { in: "nums = [-3,-2], k = 1", out: "true", note: "Every single element is a strictly increasing subarray of length 1." },
        ],
        ["2 <= nums.length <= 100", "1 < 2 * k <= nums.length", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Break the array into maximal strictly increasing runs. Where can the two subarrays live?",
        "Either both fit inside one run (it has length at least `2k`), or the first ends a run and the second starts the next run.",
        "Walking left to right with the length of the previous run `prev` and the current run `cur`, the best `k` is `max(cur / 2, min(prev, cur))` — check it against `k`.",
      ],
      editorial: explain({
        idea: "Two back-to-back strictly increasing windows of length `k` either sit inside one maximal increasing run of length `>= 2k`, or straddle the boundary between two consecutive runs, each long enough on its side. Tracking the previous and current run lengths covers both cases in one pass.",
        steps: [
          "Keep `prev = 0` (length of the previous run) and `cur = 1` (length of the run ending here), and `best = 0`.",
          "For each `i >= 1`: if `nums[i] > nums[i - 1]` then `cur += 1`; otherwise `prev = cur` and `cur = 1`.",
          "After each step set `best = max(best, cur / 2, min(prev, cur))` (integer division).",
          "Also apply the update once for the first element, then return `best >= k`.",
        ],
        why: "If both windows lie in one run of length `L`, any `k <= L / 2` works. If they do not, the boundary between them must coincide with a break between two runs — otherwise the windows would lie in one run — and then the first window is a suffix of the earlier run and the second a prefix of the later one, so `k <= min(prev, cur)`. Every pair of consecutive runs is seen with `cur` reaching its full length, so the maximum is found.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Strictly increasing: equal neighbours end a run.",
          "Do not forget the case where both windows come from one long run (`cur / 2`).",
        ],
      }),
      examples: [
        { input: "[2,5,7,8,9,2,3,4,3,1]\n3", expectedOutput: "true" },
        { input: "[1,2,3,4,4,4,4,5,6,7]\n5", expectedOutput: "false" },
        { input: "[-3,-2]\n1", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 6, 20, 50, 100]));
        const mode = ri(rng, 0, 2);
        let nums: number[];
        if (mode === 0) nums = Array.from({ length: n }, () => ri(rng, -1000, 1000));
        else if (mode === 1) nums = Array.from({ length: n }, () => ri(rng, 1, 4));
        else {
          nums = [];
          let v = ri(rng, -1000, -900);
          for (let i = 0; i < n; i++) {
            if (rng() < 0.15) v = ri(rng, -1000, 0); else v = Math.min(1000, v + ri(rng, 1, 3));
            nums.push(v);
          }
        }
        const k = ri(rng, 1, Math.floor(n / 2));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: bool(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def hasIncreasingSubarrays(nums: List[int], k: int) -> bool:
              prev, cur, best = 0, 1, 0
              for i in range(1, len(nums)):
                  if nums[i] > nums[i - 1]:
                      cur += 1
                  else:
                      prev, cur = cur, 1
                  best = max(best, cur // 2, min(prev, cur))
              return best >= k
        `,
        javascript: code`
          var hasIncreasingSubarrays = function(nums, k) {
              var prev = 0, cur = 1, best = 0;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = Math.max(best, Math.floor(cur / 2), Math.min(prev, cur));
              }
              return best >= k;
          };
        `,
        typescript: code`
          function hasIncreasingSubarrays(nums: number[], k: number): boolean {
              var prev = 0, cur = 1, best = 0;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = Math.max(best, Math.floor(cur / 2), Math.min(prev, cur));
              }
              return best >= k;
          }
        `,
        java: code`
          public static boolean hasIncreasingSubarrays(int[] nums, int k) {
              int prev = 0, cur = 1, best = 0;
              for (int i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = Math.max(best, Math.max(cur / 2, Math.min(prev, cur)));
              }
              return best >= k;
          }
        `,
        cpp: code`
          bool hasIncreasingSubarrays(vector<int>& nums, int k) {
              int prev = 0, cur = 1, best = 0;
              for (size_t i = 1; i < nums.size(); i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = max(best, max(cur / 2, min(prev, cur)));
              }
              return best >= k;
          }
        `,
        c: code`
          bool hasIncreasingSubarrays(int* nums, int numsSize, int k) {
              int prev = 0, cur = 1, best = 0;
              for (int i = 1; i < numsSize; i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  int half = cur / 2, both = prev < cur ? prev : cur;
                  if (half > best) best = half;
                  if (both > best) best = both;
              }
              return best >= k;
          }
        `,
        csharp: code`
          public static bool HasIncreasingSubarrays(int[] nums, int k)
          {
              int prev = 0, cur = 1, best = 0;
              for (int i = 1; i < nums.Length; i++)
              {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = Math.Max(best, Math.Max(cur / 2, Math.Min(prev, cur)));
              }
              return best >= k;
          }
        `,
        go: code`
          func hasIncreasingSubarrays(nums []int, k int) bool {
              prev, cur, best := 0, 1, 0
              for i := 1; i < len(nums); i++ {
                  if nums[i] > nums[i-1] {
                      cur++
                  } else {
                      prev, cur = cur, 1
                  }
                  if cur/2 > best {
                      best = cur / 2
                  }
                  both := prev
                  if cur < both {
                      both = cur
                  }
                  if both > best {
                      best = both
                  }
              }
              return best >= k
          }
        `,
        kotlin: code`
          fun hasIncreasingSubarrays(nums: IntArray, k: Int): Boolean {
              var prev = 0
              var cur = 1
              var best = 0
              for (i in 1 until nums.size) {
                  if (nums[i] > nums[i - 1]) cur++ else { prev = cur; cur = 1 }
                  best = maxOf(best, cur / 2, minOf(prev, cur))
              }
              return best >= k
          }
        `,
        swift: code`
          func hasIncreasingSubarrays(_ nums: [Int], _ k: Int) -> Bool {
              var prev = 0, cur = 1, best = 0
              for i in stride(from: 1, to: nums.count, by: 1) {
                  if nums[i] > nums[i - 1] { cur += 1 } else { prev = cur; cur = 1 }
                  best = max(best, cur / 2, min(prev, cur))
              }
              return best >= k
          }
        `,
        rust: code`
          fn hasIncreasingSubarrays(nums: Vec<i32>, k: i32) -> bool {
              let (mut prev, mut cur, mut best) = (0i32, 1i32, 0i32);
              for i in 1..nums.len() {
                  if nums[i] > nums[i - 1] { cur += 1; } else { prev = cur; cur = 1; }
                  best = best.max(cur / 2).max(prev.min(cur));
              }
              best >= k
          }
        `,
        php: code`
          function hasIncreasingSubarrays($nums, $k) {
              $prev = 0; $cur = 1; $best = 0;
              for ($i = 1; $i < count($nums); $i++) {
                  if ($nums[$i] > $nums[$i - 1]) $cur++;
                  else { $prev = $cur; $cur = 1; }
                  $best = max($best, intdiv($cur, 2), min($prev, $cur));
              }
              return $best >= $k;
          }
        `,
        ruby: code`
          def hasIncreasingSubarrays(nums, k)
            prev = 0
            cur = 1
            best = 0
            (1...nums.length).each do |i|
              if nums[i] > nums[i - 1]
                cur += 1
              else
                prev = cur
                cur = 1
              end
              best = [best, cur / 2, [prev, cur].min].max
            end
            best >= k
          end
        `,
      },
    };
  })(),

  // ── Adjacent Increasing Subarrays Detection II (LC 3350) ────────
  (() => {
    const incAt = (nums: number[], a: number, k: number) => {
      for (let i = a; i + 1 < a + k; i++) if (nums[i] >= nums[i + 1]) return false;
      return true;
    };
    const ref = (nums: number[]) => {
      for (let k = Math.floor(nums.length / 2); k >= 1; k--) {
        for (let a = 0; a + 2 * k <= nums.length; a++) if (incAt(nums, a, k) && incAt(nums, a + k, k)) return k;
      }
      return 0;
    };
    return {
      slug: "adjacent-increasing-subarrays-detection-ii",
      title: "Adjacent Increasing Subarrays Detection II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google"],
      signature: { funcName: "maxIncreasingSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` of length `n`, find the **largest** `k` for which there exist two **adjacent** subarrays of length `k` that are both **strictly increasing** — that is, an index `a` such that `nums[a..a + k - 1]` and `nums[a + k..a + 2k - 1]` are both strictly increasing.\n\nReturn that maximum `k`. Since `n >= 2`, `k = 1` always works.",
        [
          { in: "nums = [2,5,7,8,9,2,3,4,3,1]", out: "3", note: "[7,8,9] and [2,3,4] are adjacent and increasing; no `k = 4` pair exists." },
          { in: "nums = [1,2,3,4,4,4,4,5,6,7]", out: "2", note: "Inside the run [1,2,3,4] the windows [1,2] and [3,4] work; the run [4,5,6,7] gives the same." },
          { in: "nums = [5,4]", out: "1" },
        ],
        ["2 <= nums.length <= 2 * 10^5", "-10^9 <= nums[i] <= 10^9"]),
      hints: [
        "Split the array into maximal strictly increasing runs. The two windows either both fit in one run, or meet exactly at the boundary of two consecutive runs.",
        "Inside one run of length `L`, the best is `floor(L / 2)`. Across consecutive runs of lengths `p` and `c`, the best is `min(p, c)`.",
        "Keep the previous run length and the current one as you scan; update the answer with both formulas at every index.",
      ],
      editorial: explain({
        idea: "The answer is the best over two shapes: both windows inside one maximal increasing run (`floor(L / 2)`), or the first window ending one run and the second starting the next (`min(prev, cur)`). One left-to-right scan with two run lengths evaluates both.",
        steps: [
          "Set `prev = 0`, `cur = 1`, `best = 0`.",
          "For `i = 1 .. n - 1`: if `nums[i] > nums[i - 1]` extend `cur`; otherwise `prev = cur`, `cur = 1`.",
          "Update `best = max(best, cur / 2, min(prev, cur))`.",
          "Return `best`.",
        ],
        why: "Take an optimal pair of windows. If no run break falls strictly inside the span `[a, a + 2k - 1]`, both lie in one run of length at least `2k`, caught by `cur / 2`. Otherwise the only break can be between the windows (each window is itself increasing), so the first is a suffix of one run and the second a prefix of the next, caught by `min(prev, cur)` when `cur` reaches that run's length. Conversely, every value the formulas produce is achievable, so the maximum is exact.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A binary search over `k` with an `O(n)` check also works, but is unnecessary — and the check must still handle both shapes.",
          "Equal elements break a run (strictly increasing).",
        ],
      }),
      examples: [
        { input: "[2,5,7,8,9,2,3,4,3,1]", expectedOutput: "3" },
        { input: "[1,2,3,4,4,4,4,5,6,7]", expectedOutput: "2" },
        { input: "[5,4]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 6, 20, 40, 60]));
        const mode = ri(rng, 0, 2);
        let nums: number[];
        if (mode === 0) nums = Array.from({ length: n }, () => ri(rng, -1000000000, 1000000000));
        else if (mode === 1) nums = Array.from({ length: n }, () => ri(rng, 1, 4));
        else {
          nums = [];
          let v = ri(rng, -1000000000, -999999000);
          for (let i = 0; i < n; i++) {
            if (rng() < 0.12) v = ri(rng, -1000000000, 0); else v = Math.min(1000000000, v + ri(rng, 1, 1000));
            nums.push(v);
          }
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxIncreasingSubarrays(nums: List[int]) -> int:
              prev, cur, best = 0, 1, 0
              for i in range(1, len(nums)):
                  if nums[i] > nums[i - 1]:
                      cur += 1
                  else:
                      prev, cur = cur, 1
                  best = max(best, cur // 2, min(prev, cur))
              return best
        `,
        javascript: code`
          var maxIncreasingSubarrays = function(nums) {
              var prev = 0, cur = 1, best = 0;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = Math.max(best, Math.floor(cur / 2), Math.min(prev, cur));
              }
              return best;
          };
        `,
        typescript: code`
          function maxIncreasingSubarrays(nums: number[]): number {
              var prev = 0, cur = 1, best = 0;
              for (var i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = Math.max(best, Math.floor(cur / 2), Math.min(prev, cur));
              }
              return best;
          }
        `,
        java: code`
          public static int maxIncreasingSubarrays(int[] nums) {
              int prev = 0, cur = 1, best = 0;
              for (int i = 1; i < nums.length; i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = Math.max(best, Math.max(cur / 2, Math.min(prev, cur)));
              }
              return best;
          }
        `,
        cpp: code`
          int maxIncreasingSubarrays(vector<int>& nums) {
              int prev = 0, cur = 1, best = 0;
              for (size_t i = 1; i < nums.size(); i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = max(best, max(cur / 2, min(prev, cur)));
              }
              return best;
          }
        `,
        c: code`
          int maxIncreasingSubarrays(int* nums, int numsSize) {
              int prev = 0, cur = 1, best = 0;
              for (int i = 1; i < numsSize; i++) {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  int half = cur / 2, both = prev < cur ? prev : cur;
                  if (half > best) best = half;
                  if (both > best) best = both;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaxIncreasingSubarrays(int[] nums)
          {
              int prev = 0, cur = 1, best = 0;
              for (int i = 1; i < nums.Length; i++)
              {
                  if (nums[i] > nums[i - 1]) cur++;
                  else { prev = cur; cur = 1; }
                  best = Math.Max(best, Math.Max(cur / 2, Math.Min(prev, cur)));
              }
              return best;
          }
        `,
        go: code`
          func maxIncreasingSubarrays(nums []int) int {
              prev, cur, best := 0, 1, 0
              for i := 1; i < len(nums); i++ {
                  if nums[i] > nums[i-1] {
                      cur++
                  } else {
                      prev, cur = cur, 1
                  }
                  if cur/2 > best {
                      best = cur / 2
                  }
                  both := prev
                  if cur < both {
                      both = cur
                  }
                  if both > best {
                      best = both
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxIncreasingSubarrays(nums: IntArray): Int {
              var prev = 0
              var cur = 1
              var best = 0
              for (i in 1 until nums.size) {
                  if (nums[i] > nums[i - 1]) cur++ else { prev = cur; cur = 1 }
                  best = maxOf(best, cur / 2, minOf(prev, cur))
              }
              return best
          }
        `,
        swift: code`
          func maxIncreasingSubarrays(_ nums: [Int]) -> Int {
              var prev = 0, cur = 1, best = 0
              for i in stride(from: 1, to: nums.count, by: 1) {
                  if nums[i] > nums[i - 1] { cur += 1 } else { prev = cur; cur = 1 }
                  best = max(best, cur / 2, min(prev, cur))
              }
              return best
          }
        `,
        rust: code`
          fn maxIncreasingSubarrays(nums: Vec<i32>) -> i32 {
              let (mut prev, mut cur, mut best) = (0i32, 1i32, 0i32);
              for i in 1..nums.len() {
                  if nums[i] > nums[i - 1] { cur += 1; } else { prev = cur; cur = 1; }
                  best = best.max(cur / 2).max(prev.min(cur));
              }
              best
          }
        `,
        php: code`
          function maxIncreasingSubarrays($nums) {
              $prev = 0; $cur = 1; $best = 0;
              for ($i = 1; $i < count($nums); $i++) {
                  if ($nums[$i] > $nums[$i - 1]) $cur++;
                  else { $prev = $cur; $cur = 1; }
                  $best = max($best, intdiv($cur, 2), min($prev, $cur));
              }
              return $best;
          }
        `,
        ruby: code`
          def maxIncreasingSubarrays(nums)
            prev = 0
            cur = 1
            best = 0
            (1...nums.length).each do |i|
              if nums[i] > nums[i - 1]
                cur += 1
              else
                prev = cur
                cur = 1
              end
              best = [best, cur / 2, [prev, cur].min].max
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Button with Longest Push Time (LC 3386) ─────────────────────
  (() => {
    const ref = (presses: number[][]) => {
      let bestIdx = -1, bestTime = -1, prev = 0;
      presses.forEach(([idx, t], i) => {
        const d = i === 0 ? t : t - prev;
        if (d > bestTime || (d === bestTime && idx < bestIdx)) { bestTime = d; bestIdx = idx; }
        prev = t;
      });
      return bestIdx;
    };
    return {
      slug: "button-with-longest-push-time",
      title: "Button with Longest Push Time",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon"],
      signature: { funcName: "buttonWithLongestTime", params: [{ name: "presses", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A keypad logs every button press as `presses[i] = [index, time]`: button `index` was pressed at moment `time`. The log is sorted by `time` in strictly increasing order.\n\nThe time a press **took** is the gap since the previous press — `time[i] - time[i - 1]` — and for the very first press it is simply `time[0]`.\n\nReturn the `index` of the button whose single press took the longest. If several presses tie for the longest, return the **smallest** button `index` among them.",
        [
          { in: "presses = [[1,2],[2,5],[3,9],[1,15]]", out: "1", note: "The presses took 2, 3, 4 and 6 units; the longest (6) was button 1." },
          { in: "presses = [[10,5],[1,7]]", out: "10", note: "Button 10 took 5 and button 1 took 2." },
          { in: "presses = [[3,1],[2,4],[1,7]]", out: "1", note: "Buttons 2 and 1 both took 3 units — the smaller index wins." },
        ],
        ["1 <= presses.length <= 1000", "presses[i].length == 2", "1 <= index, time <= 10^5", "presses is sorted by time in strictly increasing order"]),
      hints: [
        "Each press's duration only depends on its own time and the previous press's time.",
        "Scan once, computing each duration and keeping the best duration seen with its button index.",
        "On a tie, keep the smaller index — the same button can appear many times, so compare indices, not positions.",
      ],
      editorial: explain({
        idea: "Compute each press's duration in one pass — `time` for the first press, the gap to the previous press otherwise — and keep the longest, breaking ties by the smaller button index.",
        steps: [
          "Set `bestTime = -1`, `bestIdx = -1`, `prev = 0`.",
          "For each press `[idx, t]`: `d = t - prev` (with `prev = 0` this gives `t` for the first press).",
          "If `d > bestTime`, or `d == bestTime` and `idx < bestIdx`, set `bestTime = d`, `bestIdx = idx`. Then `prev = t`.",
          "Return `bestIdx`.",
        ],
        why: "Every press's duration is examined exactly once and the comparison implements the required order (longer first, then smaller index), so the final state is the required button.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The first press's duration is its own time, not zero.",
          "The tie-break is on the button `index`, not on which press came first.",
        ],
      }),
      examples: [
        { input: "[[1,2],[2,5],[3,9],[1,15]]", expectedOutput: "1" },
        { input: "[[10,5],[1,7]]", expectedOutput: "10" },
        { input: "[[3,1],[2,4],[1,7]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 10, 40]));
        const topIdx = pick(rng, [2, 5, 100000]);
        const step = pick(rng, [1, 2, 3, 50]);
        const presses: number[][] = [];
        let t = 0;
        for (let i = 0; i < n; i++) {
          t += ri(rng, 1, step);
          presses.push([ri(rng, 1, topIdx), t]);
        }
        return { input: fmtIntMat(presses), expectedOutput: String(ref(presses)) };
      },
      solutions: {
        python: code`
          from typing import List

          def buttonWithLongestTime(presses: List[List[int]]) -> int:
              best_time, best_idx, prev = -1, -1, 0
              for idx, t in presses:
                  d = t - prev
                  if d > best_time or (d == best_time and idx < best_idx):
                      best_time, best_idx = d, idx
                  prev = t
              return best_idx
        `,
        javascript: code`
          var buttonWithLongestTime = function(presses) {
              var bestTime = -1, bestIdx = -1, prev = 0;
              for (var i = 0; i < presses.length; i++) {
                  var idx = presses[i][0], t = presses[i][1];
                  var d = t - prev;
                  if (d > bestTime || (d === bestTime && idx < bestIdx)) { bestTime = d; bestIdx = idx; }
                  prev = t;
              }
              return bestIdx;
          };
        `,
        typescript: code`
          function buttonWithLongestTime(presses: number[][]): number {
              var bestTime = -1, bestIdx = -1, prev = 0;
              for (var i = 0; i < presses.length; i++) {
                  var idx = presses[i][0], t = presses[i][1];
                  var d = t - prev;
                  if (d > bestTime || (d === bestTime && idx < bestIdx)) { bestTime = d; bestIdx = idx; }
                  prev = t;
              }
              return bestIdx;
          }
        `,
        java: code`
          public static int buttonWithLongestTime(int[][] presses) {
              int bestTime = -1, bestIdx = -1, prev = 0;
              for (int[] p : presses) {
                  int d = p[1] - prev;
                  if (d > bestTime || (d == bestTime && p[0] < bestIdx)) { bestTime = d; bestIdx = p[0]; }
                  prev = p[1];
              }
              return bestIdx;
          }
        `,
        cpp: code`
          int buttonWithLongestTime(vector<vector<int>>& presses) {
              int bestTime = -1, bestIdx = -1, prev = 0;
              for (auto& p : presses) {
                  int d = p[1] - prev;
                  if (d > bestTime || (d == bestTime && p[0] < bestIdx)) { bestTime = d; bestIdx = p[0]; }
                  prev = p[1];
              }
              return bestIdx;
          }
        `,
        c: code`
          int buttonWithLongestTime(int** presses, int pressesSize, int* pressesColSize) {
              int bestTime = -1, bestIdx = -1, prev = 0;
              for (int i = 0; i < pressesSize; i++) {
                  int idx = presses[i][0], t = presses[i][1];
                  int d = t - prev;
                  if (d > bestTime || (d == bestTime && idx < bestIdx)) { bestTime = d; bestIdx = idx; }
                  prev = t;
              }
              return bestIdx;
          }
        `,
        csharp: code`
          public static int ButtonWithLongestTime(int[][] presses)
          {
              int bestTime = -1, bestIdx = -1, prev = 0;
              foreach (int[] p in presses)
              {
                  int d = p[1] - prev;
                  if (d > bestTime || (d == bestTime && p[0] < bestIdx)) { bestTime = d; bestIdx = p[0]; }
                  prev = p[1];
              }
              return bestIdx;
          }
        `,
        go: code`
          func buttonWithLongestTime(presses [][]int) int {
              bestTime, bestIdx, prev := -1, -1, 0
              for _, p := range presses {
                  d := p[1] - prev
                  if d > bestTime || (d == bestTime && p[0] < bestIdx) {
                      bestTime, bestIdx = d, p[0]
                  }
                  prev = p[1]
              }
              return bestIdx
          }
        `,
        kotlin: code`
          fun buttonWithLongestTime(presses: Array<IntArray>): Int {
              var bestTime = -1
              var bestIdx = -1
              var prev = 0
              for (p in presses) {
                  val d = p[1] - prev
                  if (d > bestTime || (d == bestTime && p[0] < bestIdx)) { bestTime = d; bestIdx = p[0] }
                  prev = p[1]
              }
              return bestIdx
          }
        `,
        swift: code`
          func buttonWithLongestTime(_ presses: [[Int]]) -> Int {
              var bestTime = -1, bestIdx = -1, prev = 0
              for p in presses {
                  let d = p[1] - prev
                  if d > bestTime || (d == bestTime && p[0] < bestIdx) { bestTime = d; bestIdx = p[0] }
                  prev = p[1]
              }
              return bestIdx
          }
        `,
        rust: code`
          fn buttonWithLongestTime(presses: Vec<Vec<i32>>) -> i32 {
              let (mut best_time, mut best_idx, mut prev) = (-1i32, -1i32, 0i32);
              for p in presses.iter() {
                  let d = p[1] - prev;
                  if d > best_time || (d == best_time && p[0] < best_idx) {
                      best_time = d;
                      best_idx = p[0];
                  }
                  prev = p[1];
              }
              best_idx
          }
        `,
        php: code`
          function buttonWithLongestTime($presses) {
              $bestTime = -1; $bestIdx = -1; $prev = 0;
              foreach ($presses as $p) {
                  $d = $p[1] - $prev;
                  if ($d > $bestTime || ($d == $bestTime && $p[0] < $bestIdx)) { $bestTime = $d; $bestIdx = $p[0]; }
                  $prev = $p[1];
              }
              return $bestIdx;
          }
        `,
        ruby: code`
          def buttonWithLongestTime(presses)
            best_time = -1
            best_idx = -1
            prev = 0
            presses.each do |idx, t|
              d = t - prev
              if d > best_time || (d == best_time && idx < best_idx)
                best_time = d
                best_idx = idx
              end
              prev = t
            end
            best_idx
          end
        `,
      },
    };
  })(),

  // ── Sum of Good Numbers (LC 3452) ───────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let s = 0;
      for (let i = 0; i < nums.length; i++) {
        const leftOk = i - k < 0 || nums[i] > nums[i - k];
        const rightOk = i + k >= nums.length || nums[i] > nums[i + k];
        if (leftOk && rightOk) s += nums[i];
      }
      return s;
    };
    return {
      slug: "sum-of-good-numbers",
      title: "Sum of Good Numbers",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon"],
      signature: { funcName: "sumOfGoodNumbers", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` and an integer `k`, the element `nums[i]` is **good** when it is **strictly greater** than `nums[i - k]` and than `nums[i + k]` — each comparison applies only if that index exists. An element with neither index in range is good automatically.\n\nReturn the sum of all good elements.",
        [
          { in: "nums = [1,3,2,1,5,4], k = 2", out: "12", note: "3 (index 1) beats nums[3] = 1; 5 (index 4) beats nums[2] = 2; 4 (index 5) beats nums[3] = 1. 3 + 5 + 4 = 12." },
          { in: "nums = [2,1], k = 1", out: "2", note: "2 beats its only partner 1; 1 does not beat 2." },
          { in: "nums = [4,4,4], k = 1", out: "0", note: "Equal values are not strictly greater." },
        ],
        ["2 <= nums.length <= 100", "1 <= nums[i] <= 1000", "1 <= k <= floor(nums.length / 2)"]),
      hints: [
        "Each element is compared with at most two others, `k` positions away on each side.",
        "Treat a missing partner (index out of range) as a comparison that passes.",
      ],
      editorial: explain({
        idea: "Check the definition directly: for every index, compare with `i - k` and `i + k` when those exist, and add the element if it wins every comparison that applies.",
        steps: [
          "Set `sum = 0`.",
          "For each `i`, let `ok = true`; if `i - k >= 0` and `nums[i] <= nums[i - k]`, set `ok = false`; likewise for `i + k < n`.",
          "If `ok`, add `nums[i]` to `sum`. Return `sum`.",
        ],
        why: "The loop applies the definition of a good element literally to every index, so exactly the good elements are summed.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "\"Strictly greater\": ties make an element not good.",
          "A missing partner does not disqualify an element — only an existing larger-or-equal one does.",
        ],
      }),
      examples: [
        { input: "[1,3,2,1,5,4]\n2", expectedOutput: "12" },
        { input: "[2,1]\n1", expectedOutput: "2" },
        { input: "[4,4,4]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 20, 60, 100]));
        const top = pick(rng, [1, 3, 20, 1000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const k = ri(rng, 1, Math.floor(n / 2));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumOfGoodNumbers(nums: List[int], k: int) -> int:
              n = len(nums)
              total = 0
              for i, v in enumerate(nums):
                  if i - k >= 0 and v <= nums[i - k]:
                      continue
                  if i + k < n and v <= nums[i + k]:
                      continue
                  total += v
              return total
        `,
        javascript: code`
          var sumOfGoodNumbers = function(nums, k) {
              var n = nums.length, total = 0;
              for (var i = 0; i < n; i++) {
                  if (i - k >= 0 && nums[i] <= nums[i - k]) continue;
                  if (i + k < n && nums[i] <= nums[i + k]) continue;
                  total += nums[i];
              }
              return total;
          };
        `,
        typescript: code`
          function sumOfGoodNumbers(nums: number[], k: number): number {
              var n = nums.length, total = 0;
              for (var i = 0; i < n; i++) {
                  if (i - k >= 0 && nums[i] <= nums[i - k]) continue;
                  if (i + k < n && nums[i] <= nums[i + k]) continue;
                  total += nums[i];
              }
              return total;
          }
        `,
        java: code`
          public static int sumOfGoodNumbers(int[] nums, int k) {
              int n = nums.length, total = 0;
              for (int i = 0; i < n; i++) {
                  if (i - k >= 0 && nums[i] <= nums[i - k]) continue;
                  if (i + k < n && nums[i] <= nums[i + k]) continue;
                  total += nums[i];
              }
              return total;
          }
        `,
        cpp: code`
          int sumOfGoodNumbers(vector<int>& nums, int k) {
              int n = nums.size(), total = 0;
              for (int i = 0; i < n; i++) {
                  if (i - k >= 0 && nums[i] <= nums[i - k]) continue;
                  if (i + k < n && nums[i] <= nums[i + k]) continue;
                  total += nums[i];
              }
              return total;
          }
        `,
        c: code`
          int sumOfGoodNumbers(int* nums, int numsSize, int k) {
              int n = numsSize, total = 0;
              for (int i = 0; i < n; i++) {
                  if (i - k >= 0 && nums[i] <= nums[i - k]) continue;
                  if (i + k < n && nums[i] <= nums[i + k]) continue;
                  total += nums[i];
              }
              return total;
          }
        `,
        csharp: code`
          public static int SumOfGoodNumbers(int[] nums, int k)
          {
              int n = nums.Length, total = 0;
              for (int i = 0; i < n; i++)
              {
                  if (i - k >= 0 && nums[i] <= nums[i - k]) continue;
                  if (i + k < n && nums[i] <= nums[i + k]) continue;
                  total += nums[i];
              }
              return total;
          }
        `,
        go: code`
          func sumOfGoodNumbers(nums []int, k int) int {
              n, total := len(nums), 0
              for i := 0; i < n; i++ {
                  if i-k >= 0 && nums[i] <= nums[i-k] {
                      continue
                  }
                  if i+k < n && nums[i] <= nums[i+k] {
                      continue
                  }
                  total += nums[i]
              }
              return total
          }
        `,
        kotlin: code`
          fun sumOfGoodNumbers(nums: IntArray, k: Int): Int {
              val n = nums.size
              var total = 0
              for (i in 0 until n) {
                  if (i - k >= 0 && nums[i] <= nums[i - k]) continue
                  if (i + k < n && nums[i] <= nums[i + k]) continue
                  total += nums[i]
              }
              return total
          }
        `,
        swift: code`
          func sumOfGoodNumbers(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              var total = 0
              for i in 0..<n {
                  if i - k >= 0 && nums[i] <= nums[i - k] { continue }
                  if i + k < n && nums[i] <= nums[i + k] { continue }
                  total += nums[i]
              }
              return total
          }
        `,
        rust: code`
          fn sumOfGoodNumbers(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let k = k as usize;
              let mut total = 0;
              for i in 0..n {
                  if i >= k && nums[i] <= nums[i - k] { continue; }
                  if i + k < n && nums[i] <= nums[i + k] { continue; }
                  total += nums[i];
              }
              total
          }
        `,
        php: code`
          function sumOfGoodNumbers($nums, $k) {
              $n = count($nums);
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  if ($i - $k >= 0 && $nums[$i] <= $nums[$i - $k]) continue;
                  if ($i + $k < $n && $nums[$i] <= $nums[$i + $k]) continue;
                  $total += $nums[$i];
              }
              return $total;
          }
        `,
        ruby: code`
          def sumOfGoodNumbers(nums, k)
            n = nums.length
            total = 0
            nums.each_with_index do |v, i|
              next if i - k >= 0 && v <= nums[i - k]
              next if i + k < n && v <= nums[i + k]
              total += v
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost to Reach Every Position (LC 3502) ──────────────
  (() => {
    const ref = (cost: number[]) => cost.map((_, i) => Math.min(...cost.slice(0, i + 1)));
    return {
      slug: "minimum-cost-to-reach-every-position",
      title: "Minimum Cost to Reach Every Position",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon"],
      signature: { funcName: "minCosts", params: [{ name: "cost", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "`n` people stand in a queue at positions `0` to `n - 1`, and you join at the very end, at position `n`. You can move forward by swapping places with someone:\n\n- swapping with the person at a position **in front of you** (`i` smaller than yours) costs `cost[i]`, and you move to position `i`;\n- people **behind you** will swap with you for free.\n\nFor every position `i`, find the minimum total cost for you to end up at position `i`. Return the array `answer` of length `n` with those costs.",
        [
          { in: "cost = [5,3,4,1,3,2]", out: "[5,3,3,1,1,1]", note: "To reach position 2, pay 3 to jump to position 1, then swap backwards with the person at 2 for free." },
          { in: "cost = [1,2,4,6,7]", out: "[1,1,1,1,1]", note: "Pay 1 to reach the front, then every other position is a free swap backwards." },
          { in: "cost = [9]", out: "[9]" },
        ],
        ["1 <= n == cost.length <= 100", "1 <= cost[i] <= 100"]),
      hints: [
        "Once you have paid to reach some position `j`, every position behind `j` is free.",
        "So reaching position `i` costs the cheapest `cost[j]` over all `j <= i`.",
        "That is a running (prefix) minimum.",
      ],
      editorial: explain({
        idea: "Paying `cost[j]` puts you at `j`, after which you can drift backwards to any `i >= j` for free. So the cost of position `i` is the minimum of `cost[0..i]` — a prefix minimum.",
        steps: [
          "Keep `best = cost[0]`.",
          "For each `i`, set `best = min(best, cost[i])` and write `answer[i] = best`.",
          "Return `answer`.",
        ],
        why: "Any route to position `i` must pay for at least one swap forward, landing at some `j` — and the last paid swap lands at some `j <= i` (otherwise you would still have to move forward to `i`, which needs another paid swap). Its cost is at least `min(cost[0..i])`, and paying exactly that minimum and then swapping back for free achieves it.",
        time: "O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "Position `i` itself is allowed as the paid swap: `answer[i] <= cost[i]` always.",
          "Do not add costs along the way — one paid swap is enough.",
        ],
      }),
      examples: [
        { input: "[5,3,4,1,3,2]", expectedOutput: "[5,3,3,1,1,1]" },
        { input: "[1,2,4,6,7]", expectedOutput: "[1,1,1,1,1]" },
        { input: "[9]", expectedOutput: "[9]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 20, 60, 100]));
        const top = pick(rng, [1, 5, 100]);
        const cost = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(cost), expectedOutput: fmtIntArr(ref(cost)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minCosts(cost: List[int]) -> List[int]:
              answer = []
              best = cost[0]
              for c in cost:
                  best = min(best, c)
                  answer.append(best)
              return answer
        `,
        javascript: code`
          var minCosts = function(cost) {
              var answer = [], best = cost[0];
              for (var i = 0; i < cost.length; i++) {
                  if (cost[i] < best) best = cost[i];
                  answer.push(best);
              }
              return answer;
          };
        `,
        typescript: code`
          function minCosts(cost: number[]): number[] {
              var answer: number[] = [], best = cost[0];
              for (var i = 0; i < cost.length; i++) {
                  if (cost[i] < best) best = cost[i];
                  answer.push(best);
              }
              return answer;
          }
        `,
        java: code`
          public static int[] minCosts(int[] cost) {
              int[] answer = new int[cost.length];
              int best = cost[0];
              for (int i = 0; i < cost.length; i++) {
                  best = Math.min(best, cost[i]);
                  answer[i] = best;
              }
              return answer;
          }
        `,
        cpp: code`
          vector<int> minCosts(vector<int>& cost) {
              vector<int> answer(cost.size());
              int best = cost[0];
              for (size_t i = 0; i < cost.size(); i++) {
                  best = min(best, cost[i]);
                  answer[i] = best;
              }
              return answer;
          }
        `,
        c: code`
          int* minCosts(int* cost, int costSize, int* returnSize) {
              int* answer = (int*) malloc((size_t) costSize * sizeof(int));
              int best = cost[0];
              for (int i = 0; i < costSize; i++) {
                  if (cost[i] < best) best = cost[i];
                  answer[i] = best;
              }
              *returnSize = costSize;
              return answer;
          }
        `,
        csharp: code`
          public static int[] MinCosts(int[] cost)
          {
              int[] answer = new int[cost.Length];
              int best = cost[0];
              for (int i = 0; i < cost.Length; i++)
              {
                  best = Math.Min(best, cost[i]);
                  answer[i] = best;
              }
              return answer;
          }
        `,
        go: code`
          func minCosts(cost []int) []int {
              answer := make([]int, len(cost))
              best := cost[0]
              for i, c := range cost {
                  if c < best {
                      best = c
                  }
                  answer[i] = best
              }
              return answer
          }
        `,
        kotlin: code`
          fun minCosts(cost: IntArray): IntArray {
              val answer = IntArray(cost.size)
              var best = cost[0]
              for (i in cost.indices) {
                  best = minOf(best, cost[i])
                  answer[i] = best
              }
              return answer
          }
        `,
        swift: code`
          func minCosts(_ cost: [Int]) -> [Int] {
              var answer = [Int]()
              var best = cost[0]
              for c in cost {
                  best = min(best, c)
                  answer.append(best)
              }
              return answer
          }
        `,
        rust: code`
          fn minCosts(cost: Vec<i32>) -> Vec<i32> {
              let mut best = cost[0];
              cost.iter().map(|&c| { best = best.min(c); best }).collect()
          }
        `,
        php: code`
          function minCosts($cost) {
              $answer = [];
              $best = $cost[0];
              foreach ($cost as $c) {
                  $best = min($best, $c);
                  $answer[] = $best;
              }
              return $answer;
          }
        `,
        ruby: code`
          def minCosts(cost)
            best = cost[0]
            cost.map { |c| best = [best, c].min }
          end
        `,
      },
    };
  })(),

  // ── Trionic Array I (LC 3637) ───────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const inc = (a: number, b: number) => { for (let i = a; i < b; i++) if (nums[i] >= nums[i + 1]) return false; return true; };
      const dec = (a: number, b: number) => { for (let i = a; i < b; i++) if (nums[i] <= nums[i + 1]) return false; return true; };
      for (let p = 1; p < n - 2; p++) for (let q = p + 1; q < n - 1; q++) if (inc(0, p) && dec(p, q) && inc(q, n - 1)) return true;
      return false;
    };
    return {
      slug: "trionic-array-i",
      title: "Trionic Array I",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon"],
      signature: { funcName: "isTrionic", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "An array `nums` of length `n` is **trionic** if there are indices `0 < p < q < n - 1` such that:\n\n- `nums[0..p]` is strictly increasing,\n- `nums[p..q]` is strictly decreasing, and\n- `nums[q..n - 1]` is strictly increasing.\n\nIn other words, the array goes up, then down, then up again, each part with at least one step. Return `true` if `nums` is trionic and `false` otherwise.",
        [
          { in: "nums = [1,3,5,4,2,6]", out: "true", note: "p = 2 and q = 4: [1,3,5] rises, [5,4,2] falls, [2,6] rises." },
          { in: "nums = [2,1,3]", out: "false", note: "The array starts by falling, so no valid p exists." },
          { in: "nums = [1,2,1,2]", out: "true", note: "p = 1 and q = 2: one step up, one down, one up." },
        ],
        ["3 <= n <= 100", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "The three parts are forced: `p` must be where the first rise ends and `q` where the following fall ends.",
        "Walk forward while the array rises, then while it falls, then while it rises again — and check each phase moved at least one step.",
        "The array is trionic exactly when the third phase reaches the last index.",
      ],
      editorial: explain({
        idea: "If the array is trionic, `p` is the end of the maximal strictly increasing prefix and `q` the end of the strictly decreasing run after it — there is no choice. So three greedy walks decide it.",
        steps: [
          "Advance `i` from `0` while `nums[i] < nums[i + 1]`; set `p = i`. If `p == 0`, return `false`.",
          "Advance while `nums[i] > nums[i + 1]`; set `q = i`. If `q == p` or `q == n - 1`, return `false`.",
          "Advance while `nums[i] < nums[i + 1]`. Return `i == n - 1`.",
        ],
        why: "The first part must be a strictly increasing prefix ending at a peak, and it cannot stop before the rise does (the next step would be part of the decreasing part, but it rises) nor go past it. The same argument fixes `q` given `p`. With both forced, the remaining condition — the rest rises — is exactly what the third walk checks; equal neighbours stop every walk, as \"strictly\" requires.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Each phase needs at least one step: `p > 0`, `q > p` and `q < n - 1`.",
          "Equal neighbours stop every phase — `[1,2,2,1,3]` is not trionic.",
        ],
      }),
      examples: [
        { input: "[1,3,5,4,2,6]", expectedOutput: "true" },
        { input: "[2,1,3]", expectedOutput: "false" },
        { input: "[1,2,1,2]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, pick(rng, [3, 4, 8, 20, 60]));
        let nums: number[];
        if (rng() < 0.6) {
          // A trionic shape, sometimes nudged so it breaks.
          const p = ri(rng, 1, n - 2), q = ri(rng, p + 1, n - 1);
          nums = [ri(rng, -300, 300)];
          for (let i = 1; i < n; i++) {
            const step = ri(rng, 1, 5);
            nums.push(i <= p ? nums[i - 1] + step : i <= q ? nums[i - 1] - step : nums[i - 1] + step);
          }
          if (rng() < 0.35) nums[ri(rng, 0, n - 1)] = ri(rng, -300, 300);
          if (rng() < 0.15) { const j = ri(rng, 1, n - 1); nums[j] = nums[j - 1]; }
        } else {
          const top = pick(rng, [2, 5, 1000]);
          nums = Array.from({ length: n }, () => ri(rng, -top, top));
        }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isTrionic(nums: List[int]) -> bool:
              n = len(nums)
              i = 0
              while i + 1 < n and nums[i] < nums[i + 1]:
                  i += 1
              p = i
              if p == 0:
                  return False
              while i + 1 < n and nums[i] > nums[i + 1]:
                  i += 1
              q = i
              if q == p or q == n - 1:
                  return False
              while i + 1 < n and nums[i] < nums[i + 1]:
                  i += 1
              return i == n - 1
        `,
        javascript: code`
          var isTrionic = function(nums) {
              var n = nums.length, i = 0;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              var p = i;
              if (p === 0) return false;
              while (i + 1 < n && nums[i] > nums[i + 1]) i++;
              var q = i;
              if (q === p || q === n - 1) return false;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              return i === n - 1;
          };
        `,
        typescript: code`
          function isTrionic(nums: number[]): boolean {
              var n = nums.length, i = 0;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              var p = i;
              if (p === 0) return false;
              while (i + 1 < n && nums[i] > nums[i + 1]) i++;
              var q = i;
              if (q === p || q === n - 1) return false;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              return i === n - 1;
          }
        `,
        java: code`
          public static boolean isTrionic(int[] nums) {
              int n = nums.length, i = 0;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              int p = i;
              if (p == 0) return false;
              while (i + 1 < n && nums[i] > nums[i + 1]) i++;
              int q = i;
              if (q == p || q == n - 1) return false;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              return i == n - 1;
          }
        `,
        cpp: code`
          bool isTrionic(vector<int>& nums) {
              int n = nums.size(), i = 0;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              int p = i;
              if (p == 0) return false;
              while (i + 1 < n && nums[i] > nums[i + 1]) i++;
              int q = i;
              if (q == p || q == n - 1) return false;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              return i == n - 1;
          }
        `,
        c: code`
          bool isTrionic(int* nums, int numsSize) {
              int n = numsSize, i = 0;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              int p = i;
              if (p == 0) return false;
              while (i + 1 < n && nums[i] > nums[i + 1]) i++;
              int q = i;
              if (q == p || q == n - 1) return false;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              return i == n - 1;
          }
        `,
        csharp: code`
          public static bool IsTrionic(int[] nums)
          {
              int n = nums.Length, i = 0;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              int p = i;
              if (p == 0) return false;
              while (i + 1 < n && nums[i] > nums[i + 1]) i++;
              int q = i;
              if (q == p || q == n - 1) return false;
              while (i + 1 < n && nums[i] < nums[i + 1]) i++;
              return i == n - 1;
          }
        `,
        go: code`
          func isTrionic(nums []int) bool {
              n, i := len(nums), 0
              for i+1 < n && nums[i] < nums[i+1] {
                  i++
              }
              p := i
              if p == 0 {
                  return false
              }
              for i+1 < n && nums[i] > nums[i+1] {
                  i++
              }
              q := i
              if q == p || q == n-1 {
                  return false
              }
              for i+1 < n && nums[i] < nums[i+1] {
                  i++
              }
              return i == n-1
          }
        `,
        kotlin: code`
          fun isTrionic(nums: IntArray): Boolean {
              val n = nums.size
              var i = 0
              while (i + 1 < n && nums[i] < nums[i + 1]) i++
              val p = i
              if (p == 0) return false
              while (i + 1 < n && nums[i] > nums[i + 1]) i++
              val q = i
              if (q == p || q == n - 1) return false
              while (i + 1 < n && nums[i] < nums[i + 1]) i++
              return i == n - 1
          }
        `,
        swift: code`
          func isTrionic(_ nums: [Int]) -> Bool {
              let n = nums.count
              var i = 0
              while i + 1 < n && nums[i] < nums[i + 1] { i += 1 }
              let p = i
              if p == 0 { return false }
              while i + 1 < n && nums[i] > nums[i + 1] { i += 1 }
              let q = i
              if q == p || q == n - 1 { return false }
              while i + 1 < n && nums[i] < nums[i + 1] { i += 1 }
              return i == n - 1
          }
        `,
        rust: code`
          fn isTrionic(nums: Vec<i32>) -> bool {
              let n = nums.len();
              let mut i = 0;
              while i + 1 < n && nums[i] < nums[i + 1] { i += 1; }
              let p = i;
              if p == 0 { return false; }
              while i + 1 < n && nums[i] > nums[i + 1] { i += 1; }
              let q = i;
              if q == p || q == n - 1 { return false; }
              while i + 1 < n && nums[i] < nums[i + 1] { i += 1; }
              i == n - 1
          }
        `,
        php: code`
          function isTrionic($nums) {
              $n = count($nums);
              $i = 0;
              while ($i + 1 < $n && $nums[$i] < $nums[$i + 1]) $i++;
              $p = $i;
              if ($p == 0) return false;
              while ($i + 1 < $n && $nums[$i] > $nums[$i + 1]) $i++;
              $q = $i;
              if ($q == $p || $q == $n - 1) return false;
              while ($i + 1 < $n && $nums[$i] < $nums[$i + 1]) $i++;
              return $i == $n - 1;
          }
        `,
        ruby: code`
          def isTrionic(nums)
            n = nums.length
            i = 0
            i += 1 while i + 1 < n && nums[i] < nums[i + 1]
            p = i
            return false if p == 0
            i += 1 while i + 1 < n && nums[i] > nums[i + 1]
            q = i
            return false if q == p || q == n - 1
            i += 1 while i + 1 < n && nums[i] < nums[i + 1]
            i == n - 1
          end
        `,
      },
    };
  })(),

  // ── Smallest Rotation with Highest Score (LC 798) ───────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let bestK = 0, bestS = -1;
      for (let k = 0; k < n; k++) {
        let s = 0;
        for (let i = 0; i < n; i++) if (nums[(i + k) % n] <= i) s++;
        if (s > bestS) { bestS = s; bestK = k; }
      }
      return bestK;
    };
    return {
      slug: "smallest-rotation-with-highest-score",
      title: "Smallest Rotation with Highest Score",
      difficulty: "HARD" as const,
      tags: ["Array", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "bestRotation", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of length `n`. Rotating it by `k` (`0 <= k < n`) moves the first `k` elements to the back, giving `[nums[k], nums[k + 1], …, nums[n - 1], nums[0], …, nums[k - 1]]`.\n\nAfter the rotation, every element that is **less than or equal to its new index** scores one point.\n\nReturn the rotation `k` with the highest score. If several rotations tie, return the **smallest** such `k`.",
        [
          { in: "nums = [2,3,1,4,0]", out: "3", note: "Scores for k = 0..4 are 2, 3, 3, 4, 3. Rotating by 3 gives [4,0,2,3,1]: 0 <= 1, 2 <= 2, 3 <= 3 and 1 <= 4 score." },
          { in: "nums = [1,3,0,2,4]", out: "0", note: "Every rotation scores 3, so the smallest k wins." },
          { in: "nums = [0]", out: "0" },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] < nums.length"]),
      hints: [
        "Trying every rotation and recounting costs `O(n^2)`. Instead, ask for each element: for which rotations `k` does it score?",
        "Element `nums[i]` lands at index `(i - k) mod n`. It scores when that index is at least `nums[i]` — this happens for one contiguous (cyclic) range of `k`, and it fails on the complementary range.",
        "The failing range is `k` in `[(i - nums[i] + 1) mod n, i]` (cyclically). Mark every element's failing range in a difference array, take prefix sums, and pick the `k` with the fewest failures.",
      ],
      editorial: explain({
        idea: "Instead of scoring each rotation, compute for each element the rotations where it loses its point. Each such set is one cyclic interval of `k`, so a difference array over `k` adds them all up in `O(n)`; the best rotation is the one with the fewest losses.",
        steps: [
          "Create `change` of length `n`, all zero.",
          "For each `i` with `nums[i] > 0`, the element loses its point exactly for `k` from `lo = (i - nums[i] + 1) mod n` up to `i` (wrapping around). Do `change[lo] -= 1` and `change[(i + 1) mod n] += 1`; if the interval wraps (`lo > i`), also do `change[0] -= 1`.",
          "Sweep `k = 0 .. n - 1`, keeping the prefix sum `cur` of `change` — it equals the score of rotation `k` minus `n`.",
          "Return the first `k` where `cur` is largest.",
        ],
        why: "After rotating by `k`, element `i` sits at index `j = (i - k) mod n` and scores iff `j >= nums[i]`. As `k` runs over `0..n-1`, `j` takes every value exactly once; the failing values `j < nums[i]` correspond to `k = i - j` for `j = 0 .. nums[i] - 1`, i.e. `k` from `i - nums[i] + 1` to `i` modulo `n` — one cyclic block of length `nums[i]`. A difference array adds `-1` over each block (split in two when it wraps), so the prefix sum at `k` is minus the number of elements failing at `k`, which differs from the score by the constant `n`. A strict comparison while scanning keeps the smallest best `k`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Use a non-negative modulo: in C-family languages `(i - nums[i] + 1) % n` can be negative.",
          "An element with `nums[i] = 0` scores at every rotation and has no failing range — skip it, or the formula `lo = i + 1` would be mistaken for a wrapping interval.",
          "Ties go to the smallest `k`: update the best only on a strictly larger score.",
        ],
      }),
      examples: [
        { input: "[2,3,1,4,0]", expectedOutput: "3" },
        { input: "[1,3,0,2,4]", expectedOutput: "0" },
        { input: "[0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 25, 50]));
        const cap = pick(rng, [1, 2, n]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, Math.min(n, cap) - 1));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def bestRotation(nums: List[int]) -> int:
              n = len(nums)
              change = [0] * n
              for i, x in enumerate(nums):
                  if x == 0:
                      continue  # always scores
                  lo, hi = (i - x + 1) % n, (i + 1) % n
                  change[lo] -= 1
                  change[hi] += 1
                  if lo > i:
                      change[0] -= 1
              best, best_k, cur = -n - 1, 0, 0
              for k in range(n):
                  cur += change[k]
                  if cur > best:
                      best, best_k = cur, k
              return best_k
        `,
        javascript: code`
          var bestRotation = function(nums) {
              var n = nums.length;
              var change = new Array(n);
              for (var t = 0; t < n; t++) change[t] = 0;
              for (var i = 0; i < n; i++) {
                  if (nums[i] === 0) continue; // always scores
                  var lo = ((i - nums[i] + 1) % n + n) % n, hi = (i + 1) % n;
                  change[lo]--;
                  change[hi]++;
                  if (lo > i) change[0]--;
              }
              var best = -n - 1, bestK = 0, cur = 0;
              for (var k = 0; k < n; k++) {
                  cur += change[k];
                  if (cur > best) { best = cur; bestK = k; }
              }
              return bestK;
          };
        `,
        typescript: code`
          function bestRotation(nums: number[]): number {
              var n = nums.length;
              var change: number[] = [];
              for (var t = 0; t < n; t++) change.push(0);
              for (var i = 0; i < n; i++) {
                  if (nums[i] === 0) continue; // always scores
                  var lo = ((i - nums[i] + 1) % n + n) % n, hi = (i + 1) % n;
                  change[lo]--;
                  change[hi]++;
                  if (lo > i) change[0]--;
              }
              var best = -n - 1, bestK = 0, cur = 0;
              for (var k = 0; k < n; k++) {
                  cur += change[k];
                  if (cur > best) { best = cur; bestK = k; }
              }
              return bestK;
          }
        `,
        java: code`
          public static int bestRotation(int[] nums) {
              int n = nums.length;
              int[] change = new int[n];
              for (int i = 0; i < n; i++) {
                  if (nums[i] == 0) continue; // always scores
                  int lo = ((i - nums[i] + 1) % n + n) % n, hi = (i + 1) % n;
                  change[lo]--;
                  change[hi]++;
                  if (lo > i) change[0]--;
              }
              int best = -n - 1, bestK = 0, cur = 0;
              for (int k = 0; k < n; k++) {
                  cur += change[k];
                  if (cur > best) { best = cur; bestK = k; }
              }
              return bestK;
          }
        `,
        cpp: code`
          int bestRotation(vector<int>& nums) {
              int n = nums.size();
              vector<int> change(n, 0);
              for (int i = 0; i < n; i++) {
                  if (nums[i] == 0) continue; // always scores
                  int lo = ((i - nums[i] + 1) % n + n) % n, hi = (i + 1) % n;
                  change[lo]--;
                  change[hi]++;
                  if (lo > i) change[0]--;
              }
              int best = -n - 1, bestK = 0, cur = 0;
              for (int k = 0; k < n; k++) {
                  cur += change[k];
                  if (cur > best) { best = cur; bestK = k; }
              }
              return bestK;
          }
        `,
        c: code`
          int bestRotation(int* nums, int numsSize) {
              int n = numsSize;
              int* change = (int*) calloc((size_t) n, sizeof(int));
              for (int i = 0; i < n; i++) {
                  if (nums[i] == 0) continue; // always scores
                  int lo = ((i - nums[i] + 1) % n + n) % n, hi = (i + 1) % n;
                  change[lo]--;
                  change[hi]++;
                  if (lo > i) change[0]--;
              }
              int best = -n - 1, bestK = 0, cur = 0;
              for (int k = 0; k < n; k++) {
                  cur += change[k];
                  if (cur > best) { best = cur; bestK = k; }
              }
              free(change);
              return bestK;
          }
        `,
        csharp: code`
          public static int BestRotation(int[] nums)
          {
              int n = nums.Length;
              int[] change = new int[n];
              for (int i = 0; i < n; i++)
              {
                  if (nums[i] == 0) continue; // always scores
                  int lo = ((i - nums[i] + 1) % n + n) % n, hi = (i + 1) % n;
                  change[lo]--;
                  change[hi]++;
                  if (lo > i) change[0]--;
              }
              int best = -n - 1, bestK = 0, cur = 0;
              for (int k = 0; k < n; k++)
              {
                  cur += change[k];
                  if (cur > best) { best = cur; bestK = k; }
              }
              return bestK;
          }
        `,
        go: code`
          func bestRotation(nums []int) int {
              n := len(nums)
              change := make([]int, n)
              for i, x := range nums {
                  if x == 0 {
                      continue // always scores
                  }
                  lo, hi := ((i-x+1)%n+n)%n, (i+1)%n
                  change[lo]--
                  change[hi]++
                  if lo > i {
                      change[0]--
                  }
              }
              best, bestK, cur := -n-1, 0, 0
              for k := 0; k < n; k++ {
                  cur += change[k]
                  if cur > best {
                      best, bestK = cur, k
                  }
              }
              return bestK
          }
        `,
        kotlin: code`
          fun bestRotation(nums: IntArray): Int {
              val n = nums.size
              val change = IntArray(n)
              for (i in 0 until n) {
                  if (nums[i] == 0) continue // always scores
                  val lo = ((i - nums[i] + 1) % n + n) % n
                  val hi = (i + 1) % n
                  change[lo]--
                  change[hi]++
                  if (lo > i) change[0]--
              }
              var best = -n - 1
              var bestK = 0
              var cur = 0
              for (k in 0 until n) {
                  cur += change[k]
                  if (cur > best) { best = cur; bestK = k }
              }
              return bestK
          }
        `,
        swift: code`
          func bestRotation(_ nums: [Int]) -> Int {
              let n = nums.count
              var change = [Int](repeating: 0, count: n)
              for i in 0..<n {
                  if nums[i] == 0 { continue } // always scores
                  let lo = ((i - nums[i] + 1) % n + n) % n, hi = (i + 1) % n
                  change[lo] -= 1
                  change[hi] += 1
                  if lo > i { change[0] -= 1 }
              }
              var best = -n - 1, bestK = 0, cur = 0
              for k in 0..<n {
                  cur += change[k]
                  if cur > best { best = cur; bestK = k }
              }
              return bestK
          }
        `,
        rust: code`
          fn bestRotation(nums: Vec<i32>) -> i32 {
              let n = nums.len() as i32;
              let mut change = vec![0i32; n as usize];
              for i in 0..n {
                  if nums[i as usize] == 0 { continue; } // always scores
                  let lo = ((i - nums[i as usize] + 1) % n + n) % n;
                  let hi = (i + 1) % n;
                  change[lo as usize] -= 1;
                  change[hi as usize] += 1;
                  if lo > i { change[0] -= 1; }
              }
              let (mut best, mut best_k, mut cur) = (-n - 1, 0i32, 0i32);
              for k in 0..n {
                  cur += change[k as usize];
                  if cur > best { best = cur; best_k = k; }
              }
              best_k
          }
        `,
        php: code`
          function bestRotation($nums) {
              $n = count($nums);
              $change = array_fill(0, $n, 0);
              for ($i = 0; $i < $n; $i++) {
                  if ($nums[$i] == 0) continue; // always scores
                  $lo = (($i - $nums[$i] + 1) % $n + $n) % $n;
                  $hi = ($i + 1) % $n;
                  $change[$lo]--;
                  $change[$hi]++;
                  if ($lo > $i) $change[0]--;
              }
              $best = -$n - 1; $bestK = 0; $cur = 0;
              for ($k = 0; $k < $n; $k++) {
                  $cur += $change[$k];
                  if ($cur > $best) { $best = $cur; $bestK = $k; }
              }
              return $bestK;
          }
        `,
        ruby: code`
          def bestRotation(nums)
            n = nums.length
            change = Array.new(n, 0)
            nums.each_with_index do |x, i|
              next if x == 0 # always scores
              lo = (i - x + 1) % n
              hi = (i + 1) % n
              change[lo] -= 1
              change[hi] += 1
              change[0] -= 1 if lo > i
            end
            best = -n - 1
            best_k = 0
            cur = 0
            (0...n).each do |k|
              cur += change[k]
              if cur > best
                best = cur
                best_k = k
              end
            end
            best_k
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Non-Overlapping Subarrays With Sum Equals Target (LC 1546)
  (() => {
    const ref = (nums: number[], target: number) => {
      // dp[i] = best count using nums[0..i-1].
      const n = nums.length;
      const dp = new Array(n + 1).fill(0);
      for (let i = 1; i <= n; i++) {
        dp[i] = dp[i - 1];
        let s = 0;
        for (let j = i - 1; j >= 0; j--) {
          s += nums[j];
          if (s === target) dp[i] = Math.max(dp[i], dp[j] + 1);
        }
      }
      return dp[n];
    };
    return {
      slug: "maximum-number-of-non-overlapping-subarrays-with-sum-equals-target",
      title: "Maximum Number of Non-Overlapping Subarrays With Sum Equals Target",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Greedy", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "maxNonOverlapping", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` and an integer `target`, choose as many **non-empty, non-overlapping** subarrays as possible such that every chosen subarray sums to exactly `target`. Two subarrays overlap if they share an index.\n\nReturn the maximum number of subarrays you can choose.",
        [
          { in: "nums = [1,1,1,1,1], target = 2", out: "2", note: "[1,1] at indices 0–1 and [1,1] at indices 2–3 (or 3–4)." },
          { in: "nums = [-1,3,5,1,4,2,-9], target = 6", out: "2", note: "Subarrays summing to 6: [5,1], [4,2] and [3,5,1,4,2,-9]. The first two do not overlap." },
          { in: "nums = [0,0,0], target = 0", out: "3", note: "Each single 0 is its own subarray." },
        ],
        ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "0 <= target <= 10^6"]),
      hints: [
        "Think greedily: among all valid subarrays, which one would you want to pick first?",
        "Picking the valid subarray that **ends earliest** never hurts — it leaves the most room for the rest.",
        "Scan with prefix sums and a set of the prefix sums seen since the last chosen subarray ended. When `prefix - target` is in the set, a subarray ends here: count it and clear the set (start fresh from this point).",
      ],
      editorial: explain({
        idea: "This is interval scheduling: the subarrays summing to `target` are intervals, and the classic greedy — always take the one that ends first — maximises the count. Prefix sums with a hash set find, at every index, whether some valid subarray that starts after the last chosen one ends here.",
        steps: [
          "Keep `seen = {0}`, `prefix = 0`, `count = 0`.",
          "For each element, add it to `prefix`.",
          "If `prefix - target` is in `seen`, a valid subarray ends here: `count += 1`, then reset `seen = {0}` and `prefix = 0` so later subarrays start after this index.",
          "Otherwise add `prefix` to `seen`. Return `count`.",
        ],
        why: "Exchange argument: in any optimal selection, replace its first subarray by the valid subarray with the earliest end; it still ends no later, so it overlaps nothing else in the selection. Repeating on the remainder of the array yields the greedy choice at every step. The set holds exactly the prefix sums of the positions after the last chosen subarray, so `prefix - target` in the set means a valid subarray starting after that point ends at the current index — and the first such index is the earliest end.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Reset the set to contain `0` (the empty prefix of the new segment), not to empty — otherwise a subarray that starts right after the previous one is missed.",
          "Negative numbers rule out a sliding window; prefix sums with a hash set are needed.",
          "`target = 0` with zeros: each zero alone counts, which the reset handles.",
        ],
      }),
      examples: [
        { input: "[1,1,1,1,1]\n2", expectedOutput: "2" },
        { input: "[-1,3,5,1,4,2,-9]\n6", expectedOutput: "2" },
        { input: "[0,0,0]\n0", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40, 60]));
        const span = pick(rng, [1, 3, 10, 10000]);
        const lo = rng() < 0.4 ? 0 : -span;
        const nums = Array.from({ length: n }, () => ri(rng, lo, span));
        const target = rng() < 0.1 ? ri(rng, 0, 1000000) : ri(rng, 0, Math.min(1000000, span * 3));
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxNonOverlapping(nums: List[int], target: int) -> int:
              seen = {0}
              prefix = 0
              count = 0
              for x in nums:
                  prefix += x
                  if prefix - target in seen:
                      count += 1
                      seen = {0}
                      prefix = 0
                  else:
                      seen.add(prefix)
              return count
        `,
        javascript: code`
          var maxNonOverlapping = function(nums, target) {
              var seen = new Set([0]);
              var prefix = 0, count = 0;
              for (var i = 0; i < nums.length; i++) {
                  prefix += nums[i];
                  if (seen.has(prefix - target)) {
                      count++;
                      seen = new Set([0]);
                      prefix = 0;
                  } else {
                      seen.add(prefix);
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function maxNonOverlapping(nums: number[], target: number): number {
              var seen: { [key: number]: boolean } = {};
              seen[0] = true;
              var prefix = 0, count = 0;
              for (var i = 0; i < nums.length; i++) {
                  prefix += nums[i];
                  if (seen[prefix - target]) {
                      count++;
                      seen = {};
                      seen[0] = true;
                      prefix = 0;
                  } else {
                      seen[prefix] = true;
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int maxNonOverlapping(int[] nums, int target) {
              Set<Integer> seen = new HashSet<>();
              seen.add(0);
              int prefix = 0, count = 0;
              for (int x : nums) {
                  prefix += x;
                  if (seen.contains(prefix - target)) {
                      count++;
                      seen.clear();
                      seen.add(0);
                      prefix = 0;
                  } else {
                      seen.add(prefix);
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int maxNonOverlapping(vector<int>& nums, int target) {
              unordered_set<int> seen{0};
              int prefix = 0, count = 0;
              for (int x : nums) {
                  prefix += x;
                  if (seen.count(prefix - target)) {
                      count++;
                      seen.clear();
                      seen.insert(0);
                      prefix = 0;
                  } else {
                      seen.insert(prefix);
                  }
              }
              return count;
          }
        `,
        c: code`
          // Open-addressing set of ints; a generation stamp per slot makes
          // "clear" O(1): a slot belongs to the set only if its stamp is current.
          int maxNonOverlapping(int* nums, int numsSize, int target) {
              int cap = 1;
              while (cap < 2 * (numsSize + 2)) cap <<= 1;
              int* keys = (int*) malloc((size_t) cap * sizeof(int));
              int* stamp = (int*) calloc((size_t) cap, sizeof(int));
              int gen = 1;
              int prefix = 0, count = 0;
              #define SLOT(v) ((int) (((unsigned int) (v) * 2654435761u) & (unsigned int) (cap - 1)))
              // insert 0
              { int h = SLOT(0); while (stamp[h] == gen && keys[h] != 0) h = (h + 1) & (cap - 1); stamp[h] = gen; keys[h] = 0; }
              for (int i = 0; i < numsSize; i++) {
                  prefix += nums[i];
                  int want = prefix - target;
                  int h = SLOT(want), found = 0;
                  while (stamp[h] == gen) {
                      if (keys[h] == want) { found = 1; break; }
                      h = (h + 1) & (cap - 1);
                  }
                  if (found) {
                      count++;
                      gen++;
                      prefix = 0;
                      h = SLOT(0);
                      stamp[h] = gen;
                      keys[h] = 0;
                  } else {
                      h = SLOT(prefix);
                      while (stamp[h] == gen && keys[h] != prefix) h = (h + 1) & (cap - 1);
                      stamp[h] = gen;
                      keys[h] = prefix;
                  }
              }
              #undef SLOT
              free(keys);
              free(stamp);
              return count;
          }
        `,
        csharp: code`
          public static int MaxNonOverlapping(int[] nums, int target)
          {
              var seen = new HashSet<int> { 0 };
              int prefix = 0, count = 0;
              foreach (int x in nums)
              {
                  prefix += x;
                  if (seen.Contains(prefix - target))
                  {
                      count++;
                      seen.Clear();
                      seen.Add(0);
                      prefix = 0;
                  }
                  else
                  {
                      seen.Add(prefix);
                  }
              }
              return count;
          }
        `,
        go: code`
          func maxNonOverlapping(nums []int, target int) int {
              seen := map[int]bool{0: true}
              prefix, count := 0, 0
              for _, x := range nums {
                  prefix += x
                  if seen[prefix-target] {
                      count++
                      seen = map[int]bool{0: true}
                      prefix = 0
                  } else {
                      seen[prefix] = true
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun maxNonOverlapping(nums: IntArray, target: Int): Int {
              val seen = HashSet<Int>()
              seen.add(0)
              var prefix = 0
              var count = 0
              for (x in nums) {
                  prefix += x
                  if (seen.contains(prefix - target)) {
                      count++
                      seen.clear()
                      seen.add(0)
                      prefix = 0
                  } else {
                      seen.add(prefix)
                  }
              }
              return count
          }
        `,
        swift: code`
          func maxNonOverlapping(_ nums: [Int], _ target: Int) -> Int {
              var seen: Set<Int> = [0]
              var prefix = 0, count = 0
              for x in nums {
                  prefix += x
                  if seen.contains(prefix - target) {
                      count += 1
                      seen = [0]
                      prefix = 0
                  } else {
                      seen.insert(prefix)
                  }
              }
              return count
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn maxNonOverlapping(nums: Vec<i32>, target: i32) -> i32 {
              let mut seen: HashSet<i32> = HashSet::new();
              seen.insert(0);
              let (mut prefix, mut count) = (0i32, 0i32);
              for &x in nums.iter() {
                  prefix += x;
                  if seen.contains(&(prefix - target)) {
                      count += 1;
                      seen.clear();
                      seen.insert(0);
                      prefix = 0;
                  } else {
                      seen.insert(prefix);
                  }
              }
              count
          }
        `,
        php: code`
          function maxNonOverlapping($nums, $target) {
              $seen = [0 => true];
              $prefix = 0;
              $count = 0;
              foreach ($nums as $x) {
                  $prefix += $x;
                  if (isset($seen[$prefix - $target])) {
                      $count++;
                      $seen = [0 => true];
                      $prefix = 0;
                  } else {
                      $seen[$prefix] = true;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          require 'set'

          def maxNonOverlapping(nums, target)
            seen = Set[0]
            prefix = 0
            count = 0
            nums.each do |x|
              prefix += x
              if seen.include?(prefix - target)
                count += 1
                seen = Set[0]
                prefix = 0
              else
                seen << prefix
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Ways to Partition an Array (LC 2025) ──────
  (() => {
    const pivots = (a: number[]) => {
      const total = a.reduce((s, v) => s + v, 0);
      let left = 0, c = 0;
      for (let p = 1; p < a.length; p++) { left += a[p - 1]; if (left * 2 === total) c++; }
      return c;
    };
    const ref = (nums: number[], k: number) => {
      let best = pivots(nums);
      for (let i = 0; i < nums.length; i++) {
        const b = nums.slice(); b[i] = k;
        best = Math.max(best, pivots(b));
      }
      return best;
    };
    return {
      slug: "maximum-number-of-ways-to-partition-an-array",
      title: "Maximum Number of Ways to Partition an Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Counting", "Enumeration", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "waysToPartition", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of length `n`. A **pivot** is an index `p` with `1 <= p < n` that splits the array into two non-empty parts with equal sums: `nums[0] + … + nums[p - 1] == nums[p] + … + nums[n - 1]`.\n\nYou may also change **at most one** element of `nums` to the value `k` (or leave the array unchanged).\n\nReturn the maximum possible number of pivots after making at most one such change.",
        [
          { in: "nums = [2,-1,2], k = 3", out: "1", note: "Change nums[0] to 3: [3,-1,2] has the pivot p = 1 (3 == -1 + 2)." },
          { in: "nums = [0,0,0], k = 1", out: "2", note: "Leaving the array as is keeps both pivots p = 1 and p = 2." },
          { in: "nums = [22,4,-25,-20,-15,15,-16,7,19,-10,0,-13,-14], k = -33", out: "4", note: "Changing nums[2] to -33 gives four pivots." },
        ],
        ["n == nums.length", "2 <= n <= 10^5", "-10^5 <= k, nums[i] <= 10^5"]),
      hints: [
        "Without any change, pivot `p` works when `2 * prefix[p] - total == 0`. Call `d[p] = 2 * prefix[p] - total`.",
        "If `nums[i]` becomes `k`, let `delta = k - nums[i]`. Pivots with `p <= i` keep their left sum and gain `delta` on the right, so they now need `d[p] == delta`; pivots with `p > i` gain `delta` on the left, so they need `d[p] == -delta`.",
        "Sweep `i` from left to right with two hash maps of `d` values: one for pivots `p <= i`, one for `p > i`. Moving `i` forward moves one pivot from the right map to the left map.",
      ],
      editorial: explain({
        idea: "Measure each pivot by its imbalance `d[p] = left - right = 2 * prefix[p] - total`. Changing one element shifts the imbalance of every pivot on one side of it by the same amount, so the question becomes \"how many pivots on the left have imbalance `delta`, and how many on the right have imbalance `-delta`?\" — two hash-map lookups per candidate index.",
        steps: [
          "Compute `total` and `d[p]` for every pivot `p = 1 .. n - 1`. Put all of them in a map `right` (value → count); `left` starts empty.",
          "The answer starts as `right[0]` — no change at all.",
          "For `i = 0 .. n - 1`: with `delta = k - nums[i]`, the candidate is `left[delta] + right[-delta]`; update the answer. Then move pivot `p = i + 1` (if it exists) from `right` to `left`.",
          "Return the answer.",
        ],
        why: "Changing `nums[i]` by `delta` adds `delta` to the right part of every pivot `p <= i` (index `i` lies right of the cut), turning `d[p]` into `d[p] - delta`, and adds `delta` to the left part of every pivot `p > i`, turning `d[p]` into `d[p] + delta`. A pivot is valid iff its new imbalance is zero. At step `i`, `left` holds exactly the pivots `1..i` and `right` the pivots `i + 1..n - 1`, so the two lookups count exactly the pivots valid after the change.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Sums reach `10^10` in magnitude — use 64-bit integers for prefix sums and imbalances.",
          "Pivot `p` has `nums[p]` in the **right** part: move it to the left map only after processing `i = p - 1`.",
          "Leaving the array unchanged is allowed and must be counted (it can beat every change).",
        ],
      }),
      examples: [
        { input: "[2,-1,2]\n3", expectedOutput: "1" },
        { input: "[0,0,0]\n1", expectedOutput: "2" },
        { input: "[22,4,-25,-20,-15,15,-16,7,19,-10,0,-13,-14]\n-33", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 4, 10, 25, 40]));
        const span = pick(rng, [0, 1, 3, 20, 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, -span, span));
        const k = rng() < 0.5 ? ri(rng, -span, span) : ri(rng, -100000, 100000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def waysToPartition(nums: List[int], k: int) -> int:
              n = len(nums)
              total = sum(nums)
              d = [0] * n
              prefix = 0
              right = Counter()
              for p in range(1, n):
                  prefix += nums[p - 1]
                  d[p] = 2 * prefix - total
                  right[d[p]] += 1
              left = Counter()
              best = right[0]
              for i in range(n):
                  delta = k - nums[i]
                  best = max(best, left[delta] + right[-delta])
                  if i + 1 < n:
                      right[d[i + 1]] -= 1
                      left[d[i + 1]] += 1
              return best
        `,
        javascript: code`
          var waysToPartition = function(nums, k) {
              var n = nums.length, total = 0;
              for (var t = 0; t < n; t++) total += nums[t];
              var d = new Array(n);
              var right = new Map(), left = new Map();
              var bump = function(m, key, by) { m.set(key, (m.get(key) || 0) + by); };
              var prefix = 0;
              for (var p = 1; p < n; p++) {
                  prefix += nums[p - 1];
                  d[p] = 2 * prefix - total;
                  bump(right, d[p], 1);
              }
              var best = right.get(0) || 0;
              for (var i = 0; i < n; i++) {
                  var delta = k - nums[i];
                  var c = (left.get(delta) || 0) + (right.get(-delta) || 0);
                  if (c > best) best = c;
                  if (i + 1 < n) {
                      bump(right, d[i + 1], -1);
                      bump(left, d[i + 1], 1);
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function waysToPartition(nums: number[], k: number): number {
              var n = nums.length, total = 0;
              for (var t = 0; t < n; t++) total += nums[t];
              var d: number[] = [];
              var right: { [key: string]: number } = {}, left: { [key: string]: number } = {};
              var get = function(m: { [key: string]: number }, key: number): number { var v = m[String(key)]; return v === undefined ? 0 : v; };
              var bump = function(m: { [key: string]: number }, key: number, by: number): void { m[String(key)] = get(m, key) + by; };
              var prefix = 0;
              d.push(0);
              for (var p = 1; p < n; p++) {
                  prefix += nums[p - 1];
                  d.push(2 * prefix - total);
                  bump(right, d[p], 1);
              }
              var best = get(right, 0);
              for (var i = 0; i < n; i++) {
                  var delta = k - nums[i];
                  var c = get(left, delta) + get(right, -delta);
                  if (c > best) best = c;
                  if (i + 1 < n) {
                      bump(right, d[i + 1], -1);
                      bump(left, d[i + 1], 1);
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int waysToPartition(int[] nums, int k) {
              int n = nums.length;
              long total = 0;
              for (int x : nums) total += x;
              long[] d = new long[n];
              Map<Long, Integer> right = new HashMap<>(), left = new HashMap<>();
              long prefix = 0;
              for (int p = 1; p < n; p++) {
                  prefix += nums[p - 1];
                  d[p] = 2 * prefix - total;
                  right.merge(d[p], 1, Integer::sum);
              }
              int best = right.getOrDefault(0L, 0);
              for (int i = 0; i < n; i++) {
                  long delta = (long) k - nums[i];
                  best = Math.max(best, left.getOrDefault(delta, 0) + right.getOrDefault(-delta, 0));
                  if (i + 1 < n) {
                      right.merge(d[i + 1], -1, Integer::sum);
                      left.merge(d[i + 1], 1, Integer::sum);
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int waysToPartition(vector<int>& nums, int k) {
              int n = nums.size();
              long long total = 0;
              for (int x : nums) total += x;
              vector<long long> d(n, 0);
              unordered_map<long long, int> right, left;
              long long prefix = 0;
              for (int p = 1; p < n; p++) {
                  prefix += nums[p - 1];
                  d[p] = 2 * prefix - total;
                  right[d[p]]++;
              }
              int best = right.count(0) ? right[0] : 0;
              for (int i = 0; i < n; i++) {
                  long long delta = (long long) k - nums[i];
                  int c = 0;
                  auto a = left.find(delta);
                  if (a != left.end()) c += a->second;
                  auto b = right.find(-delta);
                  if (b != right.end()) c += b->second;
                  best = max(best, c);
                  if (i + 1 < n) {
                      right[d[i + 1]]--;
                      left[d[i + 1]]++;
                  }
              }
              return best;
          }
        `,
        c: code`
          // A tiny open-addressing map long long -> count (keys are never removed;
          // a count may drop to zero, which reads the same as absent).
          typedef struct { long long* keys; int* vals; char* used; int cap; } WpMap;

          static void wpInit(WpMap* m, int n) {
              m->cap = 1;
              while (m->cap < 2 * (n + 2)) m->cap <<= 1;
              m->keys = (long long*) malloc((size_t) m->cap * sizeof(long long));
              m->vals = (int*) calloc((size_t) m->cap, sizeof(int));
              m->used = (char*) calloc((size_t) m->cap, 1);
          }

          static int wpSlot(WpMap* m, long long key) {
              unsigned long long h = (unsigned long long) key * 11400714819323198485ull;
              int i = (int) (h >> 40) & (m->cap - 1);
              while (m->used[i] && m->keys[i] != key) i = (i + 1) & (m->cap - 1);
              return i;
          }

          static void wpAdd(WpMap* m, long long key, int by) {
              int i = wpSlot(m, key);
              if (!m->used[i]) { m->used[i] = 1; m->keys[i] = key; m->vals[i] = 0; }
              m->vals[i] += by;
          }

          static int wpGet(WpMap* m, long long key) {
              int i = wpSlot(m, key);
              return m->used[i] ? m->vals[i] : 0;
          }

          static void wpFree(WpMap* m) { free(m->keys); free(m->vals); free(m->used); }

          int waysToPartition(int* nums, int numsSize, int k) {
              int n = numsSize;
              long long total = 0;
              for (int i = 0; i < n; i++) total += nums[i];
              long long* d = (long long*) calloc((size_t) n, sizeof(long long));
              WpMap right, left;
              wpInit(&right, n);
              wpInit(&left, n);
              long long prefix = 0;
              for (int p = 1; p < n; p++) {
                  prefix += nums[p - 1];
                  d[p] = 2 * prefix - total;
                  wpAdd(&right, d[p], 1);
              }
              int best = wpGet(&right, 0);
              for (int i = 0; i < n; i++) {
                  long long delta = (long long) k - nums[i];
                  int c = wpGet(&left, delta) + wpGet(&right, -delta);
                  if (c > best) best = c;
                  if (i + 1 < n) {
                      wpAdd(&right, d[i + 1], -1);
                      wpAdd(&left, d[i + 1], 1);
                  }
              }
              wpFree(&right);
              wpFree(&left);
              free(d);
              return best;
          }
        `,
        csharp: code`
          public static int WaysToPartition(int[] nums, int k)
          {
              int n = nums.Length;
              long total = 0;
              foreach (int x in nums) total += x;
              long[] d = new long[n];
              var right = new Dictionary<long, int>();
              var left = new Dictionary<long, int>();
              long prefix = 0;
              for (int p = 1; p < n; p++)
              {
                  prefix += nums[p - 1];
                  d[p] = 2 * prefix - total;
                  right[d[p]] = right.TryGetValue(d[p], out int r) ? r + 1 : 1;
              }
              int best = right.TryGetValue(0L, out int z) ? z : 0;
              for (int i = 0; i < n; i++)
              {
                  long delta = (long) k - nums[i];
                  int c = (left.TryGetValue(delta, out int a) ? a : 0) + (right.TryGetValue(-delta, out int b) ? b : 0);
                  if (c > best) best = c;
                  if (i + 1 < n)
                  {
                      right[d[i + 1]] -= 1;
                      left[d[i + 1]] = left.TryGetValue(d[i + 1], out int l) ? l + 1 : 1;
                  }
              }
              return best;
          }
        `,
        go: code`
          func waysToPartition(nums []int, k int) int {
              n := len(nums)
              total := 0
              for _, x := range nums {
                  total += x
              }
              d := make([]int, n)
              right, left := map[int]int{}, map[int]int{}
              prefix := 0
              for p := 1; p < n; p++ {
                  prefix += nums[p-1]
                  d[p] = 2*prefix - total
                  right[d[p]]++
              }
              best := right[0]
              for i := 0; i < n; i++ {
                  delta := k - nums[i]
                  if c := left[delta] + right[-delta]; c > best {
                      best = c
                  }
                  if i+1 < n {
                      right[d[i+1]]--
                      left[d[i+1]]++
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun waysToPartition(nums: IntArray, k: Int): Int {
              val n = nums.size
              var total = 0L
              for (x in nums) total += x
              val d = LongArray(n)
              val right = HashMap<Long, Int>()
              val left = HashMap<Long, Int>()
              var prefix = 0L
              for (p in 1 until n) {
                  prefix += nums[p - 1]
                  d[p] = 2 * prefix - total
                  right[d[p]] = (right[d[p]] ?: 0) + 1
              }
              var best = right[0L] ?: 0
              for (i in 0 until n) {
                  val delta = k.toLong() - nums[i]
                  val c = (left[delta] ?: 0) + (right[-delta] ?: 0)
                  if (c > best) best = c
                  if (i + 1 < n) {
                      right[d[i + 1]] = (right[d[i + 1]] ?: 0) - 1
                      left[d[i + 1]] = (left[d[i + 1]] ?: 0) + 1
                  }
              }
              return best
          }
        `,
        swift: code`
          func waysToPartition(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              let total = nums.reduce(0, +)
              var d = [Int](repeating: 0, count: n)
              var right = [Int: Int](), left = [Int: Int]()
              var prefix = 0
              for p in stride(from: 1, to: n, by: 1) {
                  prefix += nums[p - 1]
                  d[p] = 2 * prefix - total
                  right[d[p], default: 0] += 1
              }
              var best = right[0, default: 0]
              for i in 0..<n {
                  let delta = k - nums[i]
                  let c = left[delta, default: 0] + right[-delta, default: 0]
                  if c > best { best = c }
                  if i + 1 < n {
                      right[d[i + 1], default: 0] -= 1
                      left[d[i + 1], default: 0] += 1
                  }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn waysToPartition(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let total: i64 = nums.iter().map(|&x| x as i64).sum();
              let mut d = vec![0i64; n];
              let mut right: HashMap<i64, i32> = HashMap::new();
              let mut left: HashMap<i64, i32> = HashMap::new();
              let mut prefix = 0i64;
              for p in 1..n {
                  prefix += nums[p - 1] as i64;
                  d[p] = 2 * prefix - total;
                  *right.entry(d[p]).or_insert(0) += 1;
              }
              let mut best = *right.get(&0).unwrap_or(&0);
              for i in 0..n {
                  let delta = k as i64 - nums[i] as i64;
                  let c = *left.get(&delta).unwrap_or(&0) + *right.get(&-delta).unwrap_or(&0);
                  if c > best { best = c; }
                  if i + 1 < n {
                      *right.entry(d[i + 1]).or_insert(0) -= 1;
                      *left.entry(d[i + 1]).or_insert(0) += 1;
                  }
              }
              best
          }
        `,
        php: code`
          function waysToPartition($nums, $k) {
              $n = count($nums);
              $total = array_sum($nums);
              $d = array_fill(0, $n, 0);
              $right = [];
              $left = [];
              $prefix = 0;
              for ($p = 1; $p < $n; $p++) {
                  $prefix += $nums[$p - 1];
                  $d[$p] = 2 * $prefix - $total;
                  $right[$d[$p]] = ($right[$d[$p]] ?? 0) + 1;
              }
              $best = $right[0] ?? 0;
              for ($i = 0; $i < $n; $i++) {
                  $delta = $k - $nums[$i];
                  $c = ($left[$delta] ?? 0) + ($right[-$delta] ?? 0);
                  if ($c > $best) $best = $c;
                  if ($i + 1 < $n) {
                      $right[$d[$i + 1]] -= 1;
                      $left[$d[$i + 1]] = ($left[$d[$i + 1]] ?? 0) + 1;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def waysToPartition(nums, k)
            n = nums.length
            total = nums.sum
            d = Array.new(n, 0)
            right = Hash.new(0)
            left = Hash.new(0)
            prefix = 0
            (1...n).each do |p|
              prefix += nums[p - 1]
              d[p] = 2 * prefix - total
              right[d[p]] += 1
            end
            best = right[0]
            (0...n).each do |i|
              delta = k - nums[i]
              c = left[delta] + right[-delta]
              best = c if c > best
              if i + 1 < n
                right[d[i + 1]] -= 1
                left[d[i + 1]] += 1
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Find Good Days to Rob the Bank (LC 2100) ────────────────────
  (() => {
    const ref = (security: number[], time: number) => {
      const out: number[] = [];
      for (let i = time; i + time < security.length; i++) {
        let ok = true;
        for (let j = i - time; j < i; j++) if (security[j] < security[j + 1]) ok = false;
        for (let j = i; j < i + time; j++) if (security[j] > security[j + 1]) ok = false;
        if (ok) out.push(i);
      }
      return out;
    };
    return {
      slug: "find-good-days-to-rob-the-bank",
      title: "Find Good Days to Rob the Bank",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "goodDaysToRobBank", params: [{ name: "security", type: "int[]" as const }, { name: "time", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "A bank logs how many guards are on duty each day: `security[i]` is the count on day `i`. Given an integer `time`, day `i` is a **good day** when:\n\n- there are at least `time` days before and after it,\n- the guard counts over the `time` days before day `i` never increase: `security[i - time] >= … >= security[i - 1] >= security[i]`, and\n- the guard counts over the `time` days after it never decrease: `security[i] <= security[i + 1] <= … <= security[i + time]`.\n\nReturn all good days in **increasing order**.",
        [
          { in: "security = [5,3,3,3,5,6,2], time = 2", out: "[2,3]", note: "Day 2: 5 >= 3 >= 3 and 3 <= 3 <= 5. Day 3: 3 >= 3 >= 3 and 3 <= 5 <= 6. No other day qualifies." },
          { in: "security = [1,1,1,1,1], time = 0", out: "[0,1,2,3,4]", note: "With `time = 0` every day is good." },
          { in: "security = [1,2,3,4,5,6], time = 2", out: "[]", note: "The counts only ever rise, so no day has a non-increasing stretch before it." },
        ],
        ["1 <= security.length <= 10^5", "0 <= security[i], time <= 10^5"]),
      hints: [
        "Checking `2 * time` neighbours for every day is too slow. Can you know, for each day, how long the non-increasing stretch ending there is?",
        "Let `before[i]` be the number of consecutive steps ending at `i` with `security[j - 1] >= security[j]`, and `after[i]` the number of consecutive steps starting at `i` with `security[j] <= security[j + 1]`. Both are one linear pass.",
        "Day `i` is good exactly when `before[i] >= time` and `after[i] >= time`.",
      ],
      editorial: explain({
        idea: "Precompute, for every day, how far the non-increasing run reaches back and how far the non-decreasing run reaches forward. A day is good when both reach at least `time` steps.",
        steps: [
          "`before[0] = 0`; for `i >= 1`, `before[i] = before[i - 1] + 1` if `security[i - 1] >= security[i]`, else `0`.",
          "`after[n - 1] = 0`; for `i <= n - 2` from right to left, `after[i] = after[i + 1] + 1` if `security[i] <= security[i + 1]`, else `0`.",
          "Collect every `i` (in increasing order) with `before[i] >= time` and `after[i] >= time`.",
        ],
        why: "`before[i]` counts the longest run of non-increasing steps ending at `i`, so the `time` days before `i` are non-increasing iff `before[i] >= time` — which also guarantees `i >= time`. Symmetrically for `after[i]`, which also guarantees `i + time <= n - 1`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The conditions are non-strict: equal guard counts are allowed on both sides.",
          "With `time = 0` every day qualifies — `before[i] >= 0` always holds.",
        ],
      }),
      examples: [
        { input: "[5,3,3,3,5,6,2]\n2", expectedOutput: "[2,3]" },
        { input: "[1,1,1,1,1]\n0", expectedOutput: "[0,1,2,3,4]" },
        { input: "[1,2,3,4,5,6]\n2", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40, 60]));
        const top = pick(rng, [1, 2, 4, 100000]);
        const security = Array.from({ length: n }, () => ri(rng, 0, top));
        const time = rng() < 0.05 ? ri(rng, 0, 100000) : ri(rng, 0, Math.max(0, Math.floor(n / 2) + 1));
        return { input: `${fmtIntArr(security)}\n${time}`, expectedOutput: fmtIntArr(ref(security, time)) };
      },
      solutions: {
        python: code`
          from typing import List

          def goodDaysToRobBank(security: List[int], time: int) -> List[int]:
              n = len(security)
              before = [0] * n
              after = [0] * n
              for i in range(1, n):
                  if security[i - 1] >= security[i]:
                      before[i] = before[i - 1] + 1
              for i in range(n - 2, -1, -1):
                  if security[i] <= security[i + 1]:
                      after[i] = after[i + 1] + 1
              return [i for i in range(n) if before[i] >= time and after[i] >= time]
        `,
        javascript: code`
          var goodDaysToRobBank = function(security, time) {
              var n = security.length;
              var before = new Array(n), after = new Array(n);
              before[0] = 0;
              for (var i = 1; i < n; i++) before[i] = security[i - 1] >= security[i] ? before[i - 1] + 1 : 0;
              after[n - 1] = 0;
              for (var j = n - 2; j >= 0; j--) after[j] = security[j] <= security[j + 1] ? after[j + 1] + 1 : 0;
              var out = [];
              for (var k = 0; k < n; k++) if (before[k] >= time && after[k] >= time) out.push(k);
              return out;
          };
        `,
        typescript: code`
          function goodDaysToRobBank(security: number[], time: number): number[] {
              var n = security.length;
              var before: number[] = [], after: number[] = [];
              for (var t = 0; t < n; t++) { before.push(0); after.push(0); }
              for (var i = 1; i < n; i++) before[i] = security[i - 1] >= security[i] ? before[i - 1] + 1 : 0;
              for (var j = n - 2; j >= 0; j--) after[j] = security[j] <= security[j + 1] ? after[j + 1] + 1 : 0;
              var out: number[] = [];
              for (var k = 0; k < n; k++) if (before[k] >= time && after[k] >= time) out.push(k);
              return out;
          }
        `,
        java: code`
          public static int[] goodDaysToRobBank(int[] security, int time) {
              int n = security.length;
              int[] before = new int[n], after = new int[n];
              for (int i = 1; i < n; i++) before[i] = security[i - 1] >= security[i] ? before[i - 1] + 1 : 0;
              for (int i = n - 2; i >= 0; i--) after[i] = security[i] <= security[i + 1] ? after[i + 1] + 1 : 0;
              List<Integer> out = new ArrayList<>();
              for (int i = 0; i < n; i++) if (before[i] >= time && after[i] >= time) out.add(i);
              int[] res = new int[out.size()];
              for (int i = 0; i < res.length; i++) res[i] = out.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> goodDaysToRobBank(vector<int>& security, int time) {
              int n = security.size();
              vector<int> before(n, 0), after(n, 0), out;
              for (int i = 1; i < n; i++) before[i] = security[i - 1] >= security[i] ? before[i - 1] + 1 : 0;
              for (int i = n - 2; i >= 0; i--) after[i] = security[i] <= security[i + 1] ? after[i + 1] + 1 : 0;
              for (int i = 0; i < n; i++) if (before[i] >= time && after[i] >= time) out.push_back(i);
              return out;
          }
        `,
        c: code`
          int* goodDaysToRobBank(int* security, int securitySize, int time, int* returnSize) {
              int n = securitySize;
              int* before = (int*) calloc((size_t) n, sizeof(int));
              int* after = (int*) calloc((size_t) n, sizeof(int));
              for (int i = 1; i < n; i++) before[i] = security[i - 1] >= security[i] ? before[i - 1] + 1 : 0;
              for (int i = n - 2; i >= 0; i--) after[i] = security[i] <= security[i + 1] ? after[i + 1] + 1 : 0;
              int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int k = 0;
              for (int i = 0; i < n; i++) if (before[i] >= time && after[i] >= time) out[k++] = i;
              free(before);
              free(after);
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static int[] GoodDaysToRobBank(int[] security, int time)
          {
              int n = security.Length;
              int[] before = new int[n], after = new int[n];
              for (int i = 1; i < n; i++) before[i] = security[i - 1] >= security[i] ? before[i - 1] + 1 : 0;
              for (int i = n - 2; i >= 0; i--) after[i] = security[i] <= security[i + 1] ? after[i + 1] + 1 : 0;
              var res = new List<int>();
              for (int i = 0; i < n; i++) if (before[i] >= time && after[i] >= time) res.Add(i);
              return res.ToArray();
          }
        `,
        go: code`
          func goodDaysToRobBank(security []int, time int) []int {
              n := len(security)
              before, after := make([]int, n), make([]int, n)
              for i := 1; i < n; i++ {
                  if security[i-1] >= security[i] {
                      before[i] = before[i-1] + 1
                  }
              }
              for i := n - 2; i >= 0; i-- {
                  if security[i] <= security[i+1] {
                      after[i] = after[i+1] + 1
                  }
              }
              out := []int{}
              for i := 0; i < n; i++ {
                  if before[i] >= time && after[i] >= time {
                      out = append(out, i)
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun goodDaysToRobBank(security: IntArray, time: Int): IntArray {
              val n = security.size
              val before = IntArray(n)
              val after = IntArray(n)
              for (i in 1 until n) before[i] = if (security[i - 1] >= security[i]) before[i - 1] + 1 else 0
              for (i in n - 2 downTo 0) after[i] = if (security[i] <= security[i + 1]) after[i + 1] + 1 else 0
              val out = ArrayList<Int>()
              for (i in 0 until n) if (before[i] >= time && after[i] >= time) out.add(i)
              return out.toIntArray()
          }
        `,
        swift: code`
          func goodDaysToRobBank(_ security: [Int], _ time: Int) -> [Int] {
              let n = security.count
              var before = [Int](repeating: 0, count: n), after = [Int](repeating: 0, count: n)
              for i in stride(from: 1, to: n, by: 1) where security[i - 1] >= security[i] {
                  before[i] = before[i - 1] + 1
              }
              for i in stride(from: n - 2, through: 0, by: -1) where security[i] <= security[i + 1] {
                  after[i] = after[i + 1] + 1
              }
              var out = [Int]()
              for i in 0..<n where before[i] >= time && after[i] >= time { out.append(i) }
              return out
          }
        `,
        rust: code`
          fn goodDaysToRobBank(security: Vec<i32>, time: i32) -> Vec<i32> {
              let n = security.len();
              let mut before = vec![0i32; n];
              let mut after = vec![0i32; n];
              for i in 1..n {
                  if security[i - 1] >= security[i] { before[i] = before[i - 1] + 1; }
              }
              for i in (0..n.saturating_sub(1)).rev() {
                  if security[i] <= security[i + 1] { after[i] = after[i + 1] + 1; }
              }
              (0..n).filter(|&i| before[i] >= time && after[i] >= time).map(|i| i as i32).collect()
          }
        `,
        php: code`
          function goodDaysToRobBank($security, $time) {
              $n = count($security);
              $before = array_fill(0, $n, 0);
              $after = array_fill(0, $n, 0);
              for ($i = 1; $i < $n; $i++) if ($security[$i - 1] >= $security[$i]) $before[$i] = $before[$i - 1] + 1;
              for ($i = $n - 2; $i >= 0; $i--) if ($security[$i] <= $security[$i + 1]) $after[$i] = $after[$i + 1] + 1;
              $out = [];
              for ($i = 0; $i < $n; $i++) if ($before[$i] >= $time && $after[$i] >= $time) $out[] = $i;
              return $out;
          }
        `,
        ruby: code`
          def goodDaysToRobBank(security, time)
            n = security.length
            before = Array.new(n, 0)
            after = Array.new(n, 0)
            (1...n).each { |i| before[i] = before[i - 1] + 1 if security[i - 1] >= security[i] }
            (n - 2).downto(0) { |i| after[i] = after[i + 1] + 1 if security[i] <= security[i + 1] }
            (0...n).select { |i| before[i] >= time && after[i] >= time }
          end
        `,
      },
    };
  })(),

  // ── Intervals Between Identical Elements (LC 2121) ──────────────
  (() => {
    const ref = (arr: number[]) => arr.map((v, i) => {
      let s = 0;
      arr.forEach((w, j) => { if (w === v) s += Math.abs(i - j); });
      return s;
    });
    return {
      slug: "intervals-between-identical-elements",
      title: "Intervals Between Identical Elements",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "getDistances", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an array `arr` of `n` integers. The **interval** between two positions `i` and `j` is `|i - j|`.\n\nFor every index `i`, compute the sum of the intervals between `i` and every other index `j` holding the **same value** (`arr[j] == arr[i]`). Return the array `intervals` of those sums.\n\nThe constraints are tightened from the original (`n` is at most `4 * 10^4`) so every sum fits in a 32-bit integer.",
        [
          { in: "arr = [2,1,3,1,2,3,3]", out: "[4,2,7,2,4,4,5]", note: "Index 2 (value 3) pairs with indices 5 and 6: |2 - 5| + |2 - 6| = 7. Index 0 (value 2) pairs with index 4: 4." },
          { in: "arr = [10,5,10,10]", out: "[5,0,3,4]", note: "The 5 at index 1 is alone, so its sum is 0." },
          { in: "arr = [7]", out: "[0]" },
        ],
        ["n == arr.length", "1 <= n <= 4 * 10^4", "1 <= arr[i] <= 10^5"]),
      hints: [
        "Only indices with the same value interact, so handle each value's list of positions separately.",
        "For a sorted list of positions, the distance from position `p` to everything on its left is `count_left * p - sum_left`; to its right, `sum_right - count_right * p`.",
        "Sweep once left to right keeping, per value, how many positions you have seen and their sum; then once right to left. Add both contributions.",
      ],
      editorial: explain({
        idea: "Split `|i - j|` by side: for the earlier positions of the same value it is `i - j`, for the later ones `j - i`. Summing `i - j` over the earlier ones is `count * i - sum` — two running totals per value are enough, so two sweeps answer every index.",
        steps: [
          "Left to right: keep `cnt[v]` and `sum[v]` of the positions seen so far with value `v`. At index `i` with value `v`, add `cnt[v] * i - sum[v]` to `answer[i]`, then include `i`.",
          "Right to left with fresh totals: add `sum[v] - cnt[v] * i` to `answer[i]`, then include `i`.",
          "Return `answer`.",
        ],
        why: "For a fixed `i`, every same-valued index `j < i` contributes `i - j`, and the sum of those is `cnt * i - sum` over exactly the indices counted when the left sweep reaches `i`. The right sweep symmetrically sums `j - i` over `j > i`. Indices with other values never enter the totals for `v`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The quadratic \"compare with every equal element\" approach times out on long runs of one value.",
          "In the original problem (`n` up to `10^5`) the sums need 64-bit integers; here `n <= 4 * 10^4` keeps every sum below `8 * 10^8`.",
        ],
      }),
      examples: [
        { input: "[2,1,3,1,2,3,3]", expectedOutput: "[4,2,7,2,4,4,5]" },
        { input: "[10,5,10,10]", expectedOutput: "[5,0,3,4]" },
        { input: "[7]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40, 60]));
        const vals = pick(rng, [1, 2, 4, 100000]);
        const pool = Array.from({ length: vals }, () => ri(rng, 1, 100000));
        const arr = Array.from({ length: n }, () => pick(rng, pool));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getDistances(arr: List[int]) -> List[int]:
              n = len(arr)
              answer = [0] * n
              cnt, tot = {}, {}
              for i, v in enumerate(arr):
                  c, s = cnt.get(v, 0), tot.get(v, 0)
                  answer[i] += c * i - s
                  cnt[v], tot[v] = c + 1, s + i
              cnt, tot = {}, {}
              for i in range(n - 1, -1, -1):
                  v = arr[i]
                  c, s = cnt.get(v, 0), tot.get(v, 0)
                  answer[i] += s - c * i
                  cnt[v], tot[v] = c + 1, s + i
              return answer
        `,
        javascript: code`
          var getDistances = function(arr) {
              var n = arr.length;
              var answer = new Array(n);
              var cnt = new Map(), tot = new Map();
              for (var i = 0; i < n; i++) {
                  var v = arr[i], c = cnt.get(v) || 0, s = tot.get(v) || 0;
                  answer[i] = c * i - s;
                  cnt.set(v, c + 1);
                  tot.set(v, s + i);
              }
              cnt = new Map();
              tot = new Map();
              for (var j = n - 1; j >= 0; j--) {
                  var w = arr[j], c2 = cnt.get(w) || 0, s2 = tot.get(w) || 0;
                  answer[j] += s2 - c2 * j;
                  cnt.set(w, c2 + 1);
                  tot.set(w, s2 + j);
              }
              return answer;
          };
        `,
        typescript: code`
          function getDistances(arr: number[]): number[] {
              var n = arr.length;
              var answer: number[] = [];
              var cnt: { [key: number]: number } = {}, tot: { [key: number]: number } = {};
              for (var i = 0; i < n; i++) {
                  var v = arr[i], c = cnt[v] || 0, s = tot[v] || 0;
                  answer.push(c * i - s);
                  cnt[v] = c + 1;
                  tot[v] = s + i;
              }
              cnt = {};
              tot = {};
              for (var j = n - 1; j >= 0; j--) {
                  var w = arr[j], c2 = cnt[w] || 0, s2 = tot[w] || 0;
                  answer[j] += s2 - c2 * j;
                  cnt[w] = c2 + 1;
                  tot[w] = s2 + j;
              }
              return answer;
          }
        `,
        java: code`
          public static int[] getDistances(int[] arr) {
              int n = arr.length;
              int[] answer = new int[n];
              Map<Integer, int[]> seen = new HashMap<>();
              for (int i = 0; i < n; i++) {
                  int[] cs = seen.computeIfAbsent(arr[i], key -> new int[2]);
                  answer[i] += cs[0] * i - cs[1];
                  cs[0]++;
                  cs[1] += i;
              }
              seen.clear();
              for (int i = n - 1; i >= 0; i--) {
                  int[] cs = seen.computeIfAbsent(arr[i], key -> new int[2]);
                  answer[i] += cs[1] - cs[0] * i;
                  cs[0]++;
                  cs[1] += i;
              }
              return answer;
          }
        `,
        cpp: code`
          vector<int> getDistances(vector<int>& arr) {
              int n = arr.size();
              vector<int> answer(n, 0);
              unordered_map<int, pair<int, int>> seen;
              for (int i = 0; i < n; i++) {
                  auto& cs = seen[arr[i]];
                  answer[i] += cs.first * i - cs.second;
                  cs.first++;
                  cs.second += i;
              }
              seen.clear();
              for (int i = n - 1; i >= 0; i--) {
                  auto& cs = seen[arr[i]];
                  answer[i] += cs.second - cs.first * i;
                  cs.first++;
                  cs.second += i;
              }
              return answer;
          }
        `,
        c: code`
          // Values are at most 10^5, so plain arrays indexed by value serve as
          // the per-value counters (cleared between the two sweeps by
          // re-walking only the values that occur).
          int* getDistances(int* arr, int arrSize, int* returnSize) {
              int n = arrSize;
              int* answer = (int*) calloc((size_t) n, sizeof(int));
              int* cnt = (int*) calloc(100001, sizeof(int));
              int* tot = (int*) calloc(100001, sizeof(int));
              for (int i = 0; i < n; i++) {
                  int v = arr[i];
                  answer[i] += cnt[v] * i - tot[v];
                  cnt[v]++;
                  tot[v] += i;
              }
              for (int i = 0; i < n; i++) { cnt[arr[i]] = 0; tot[arr[i]] = 0; }
              for (int i = n - 1; i >= 0; i--) {
                  int v = arr[i];
                  answer[i] += tot[v] - cnt[v] * i;
                  cnt[v]++;
                  tot[v] += i;
              }
              free(cnt);
              free(tot);
              *returnSize = n;
              return answer;
          }
        `,
        csharp: code`
          public static int[] GetDistances(int[] arr)
          {
              int n = arr.Length;
              int[] answer = new int[n];
              var seen = new Dictionary<int, int[]>();
              for (int i = 0; i < n; i++)
              {
                  if (!seen.TryGetValue(arr[i], out int[] cs)) { cs = new int[2]; seen[arr[i]] = cs; }
                  answer[i] += cs[0] * i - cs[1];
                  cs[0]++;
                  cs[1] += i;
              }
              seen.Clear();
              for (int i = n - 1; i >= 0; i--)
              {
                  if (!seen.TryGetValue(arr[i], out int[] cs)) { cs = new int[2]; seen[arr[i]] = cs; }
                  answer[i] += cs[1] - cs[0] * i;
                  cs[0]++;
                  cs[1] += i;
              }
              return answer;
          }
        `,
        go: code`
          func getDistances(arr []int) []int {
              n := len(arr)
              answer := make([]int, n)
              cnt, tot := map[int]int{}, map[int]int{}
              for i, v := range arr {
                  answer[i] += cnt[v]*i - tot[v]
                  cnt[v]++
                  tot[v] += i
              }
              cnt, tot = map[int]int{}, map[int]int{}
              for i := n - 1; i >= 0; i-- {
                  v := arr[i]
                  answer[i] += tot[v] - cnt[v]*i
                  cnt[v]++
                  tot[v] += i
              }
              return answer
          }
        `,
        kotlin: code`
          fun getDistances(arr: IntArray): IntArray {
              val n = arr.size
              val answer = IntArray(n)
              val seen = HashMap<Int, IntArray>()
              for (i in 0 until n) {
                  val cs = seen.getOrPut(arr[i]) { IntArray(2) }
                  answer[i] += cs[0] * i - cs[1]
                  cs[0]++
                  cs[1] += i
              }
              seen.clear()
              for (i in n - 1 downTo 0) {
                  val cs = seen.getOrPut(arr[i]) { IntArray(2) }
                  answer[i] += cs[1] - cs[0] * i
                  cs[0]++
                  cs[1] += i
              }
              return answer
          }
        `,
        swift: code`
          func getDistances(_ arr: [Int]) -> [Int] {
              let n = arr.count
              var answer = [Int](repeating: 0, count: n)
              var cnt = [Int: Int](), tot = [Int: Int]()
              for i in 0..<n {
                  let v = arr[i]
                  answer[i] += cnt[v, default: 0] * i - tot[v, default: 0]
                  cnt[v, default: 0] += 1
                  tot[v, default: 0] += i
              }
              cnt = [:]
              tot = [:]
              for i in stride(from: n - 1, through: 0, by: -1) {
                  let v = arr[i]
                  answer[i] += tot[v, default: 0] - cnt[v, default: 0] * i
                  cnt[v, default: 0] += 1
                  tot[v, default: 0] += i
              }
              return answer
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn getDistances(arr: Vec<i32>) -> Vec<i32> {
              let n = arr.len();
              let mut answer = vec![0i64; n];
              let mut seen: HashMap<i32, (i64, i64)> = HashMap::new();
              for i in 0..n {
                  let e = seen.entry(arr[i]).or_insert((0, 0));
                  answer[i] += e.0 * i as i64 - e.1;
                  e.0 += 1;
                  e.1 += i as i64;
              }
              seen.clear();
              for i in (0..n).rev() {
                  let e = seen.entry(arr[i]).or_insert((0, 0));
                  answer[i] += e.1 - e.0 * i as i64;
                  e.0 += 1;
                  e.1 += i as i64;
              }
              answer.into_iter().map(|v| v as i32).collect()
          }
        `,
        php: code`
          function getDistances($arr) {
              $n = count($arr);
              $answer = array_fill(0, $n, 0);
              $cnt = [];
              $tot = [];
              for ($i = 0; $i < $n; $i++) {
                  $v = $arr[$i];
                  $c = $cnt[$v] ?? 0;
                  $s = $tot[$v] ?? 0;
                  $answer[$i] += $c * $i - $s;
                  $cnt[$v] = $c + 1;
                  $tot[$v] = $s + $i;
              }
              $cnt = [];
              $tot = [];
              for ($i = $n - 1; $i >= 0; $i--) {
                  $v = $arr[$i];
                  $c = $cnt[$v] ?? 0;
                  $s = $tot[$v] ?? 0;
                  $answer[$i] += $s - $c * $i;
                  $cnt[$v] = $c + 1;
                  $tot[$v] = $s + $i;
              }
              return $answer;
          }
        `,
        ruby: code`
          def getDistances(arr)
            n = arr.length
            answer = Array.new(n, 0)
            cnt = Hash.new(0)
            tot = Hash.new(0)
            arr.each_with_index do |v, i|
              answer[i] += cnt[v] * i - tot[v]
              cnt[v] += 1
              tot[v] += i
            end
            cnt = Hash.new(0)
            tot = Hash.new(0)
            (n - 1).downto(0) do |i|
              v = arr[i]
              answer[i] += tot[v] - cnt[v] * i
              cnt[v] += 1
              tot[v] += i
            end
            answer
          end
        `,
      },
    };
  })(),

  // ── Stamping the Grid (LC 2132) ─────────────────────────────────
  (() => {
    const ref = (grid: number[][], h: number, w: number) => {
      const m = grid.length, n = grid[0].length;
      const fits = (r: number, c: number) => {
        if (r + h > m || c + w > n) return false;
        for (let i = r; i < r + h; i++) for (let j = c; j < c + w; j++) if (grid[i][j]) return false;
        return true;
      };
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (grid[i][j]) continue;
        let covered = false;
        for (let r = Math.max(0, i - h + 1); r <= i && !covered; r++)
          for (let c = Math.max(0, j - w + 1); c <= j && !covered; c++) if (fits(r, c)) covered = true;
        if (!covered) return false;
      }
      return true;
    };
    return {
      slug: "stamping-the-grid",
      title: "Stamping the Grid",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Matrix", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "possibleToStamp", params: [{ name: "grid", type: "int[][]" as const }, { name: "stampHeight", type: "int" as const }, { name: "stampWidth", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You are given an `m × n` binary matrix `grid` where `0` is an empty cell and `1` is occupied. You have unlimited stamps, each a rectangle of exactly `stampHeight × stampWidth` cells. Place stamps so that:\n\n- every **empty** cell is covered by at least one stamp,\n- no stamp covers an **occupied** cell,\n- stamps may overlap each other,\n- stamps may not be rotated, and must lie completely inside the grid.\n\nReturn `true` if the empty cells can be covered this way, and `false` otherwise.",
        [
          { in: "grid = [[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]], stampHeight = 4, stampWidth = 3", out: "true", note: "Two overlapping 4 × 3 stamps — one on rows 0–3, one on rows 1–4, both on columns 1–3 — cover every empty cell." },
          { in: "grid = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]], stampHeight = 2, stampWidth = 2", out: "false", note: "The empty cell at the bottom-left corner (row 3, column 0) lies in no 2 × 2 block free of occupied cells." },
          { in: "grid = [[1,1],[1,1]], stampHeight = 3, stampWidth = 3", out: "true", note: "There is nothing to cover, so no stamp is needed." },
        ],
        ["m == grid.length", "n == grid[r].length", "1 <= m, n <= 10^5", "1 <= m * n <= 2 * 10^5", "grid[r][c] is 0 or 1", "1 <= stampHeight, stampWidth <= 10^5"]),
      hints: [
        "Since stamps may overlap, there is no harm in placing a stamp **everywhere** it is allowed. The question becomes: is every empty cell covered by some allowed placement?",
        "A placement with top-left corner `(r, c)` is allowed when its `stampHeight × stampWidth` rectangle fits in the grid and contains no `1`. A 2D prefix sum over the grid answers \"how many 1s in this rectangle?\" in `O(1)`.",
        "Mark every allowed placement in a 2D difference array (+1 at the corners pattern), take its 2D prefix sum to get each cell's cover count, and check that every empty cell has a positive count.",
      ],
      editorial: explain({
        idea: "Overlap is free, so stamp every legal position at once. Two 2D prefix-sum tricks make it linear: a prefix sum of the grid tests a placement in `O(1)`, and a 2D difference array records every placement in `O(1)`, after which another prefix sum gives each cell's coverage.",
        steps: [
          "Build `P`, the 2D prefix sum of `grid` (size `(m + 1) × (n + 1)`).",
          "For every top-left `(r, c)` with `r + h <= m` and `c + w <= n`, if the rectangle's sum from `P` is `0`, add the placement to a difference array `D`: `D[r][c] += 1`, `D[r][c + w] -= 1`, `D[r + h][c] -= 1`, `D[r + h][c + w] += 1`.",
          "Take the 2D prefix sum of `D`; the value at `(i, j)` is the number of placements covering that cell.",
          "If any empty cell has coverage `0`, return `false`; otherwise `true`.",
        ],
        why: "Every legal placement covers only empty cells, so using all of them violates nothing, and any valid stamping uses a subset of them — so a valid stamping exists iff the union of all legal placements covers every empty cell. The difference array adds `1` over exactly each placement's rectangle once prefix-summed, so the coverage counts are exact.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Stamps larger than the grid have no legal placement at all — then the answer is `true` only if there are no empty cells.",
          "Use `(m + 1) × (n + 1)` (or `+ 2`) arrays so the difference updates at `r + h` and `c + w` stay in bounds.",
          "Testing each placement cell by cell is `O(m · n · h · w)` — the prefix sum is what makes it fast.",
        ],
      }),
      examples: [
        { input: "[[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]]\n4\n3", expectedOutput: "true" },
        { input: "[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]\n2\n2", expectedOutput: "false" },
        { input: "[[1,1],[1,1]]\n3\n3", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 6, 8])), n = ri(rng, 1, pick(rng, [1, 3, 6, 8]));
        const dens = pick(rng, [0, 0.05, 0.15, 0.35, 0.9]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < dens ? 1 : 0)));
        const h = rng() < 0.05 ? ri(rng, 1, 100000) : ri(rng, 1, m + 1);
        const w = rng() < 0.05 ? ri(rng, 1, 100000) : ri(rng, 1, n + 1);
        return { input: `${fmtIntMat(grid)}\n${h}\n${w}`, expectedOutput: bool(ref(grid, h, w)) };
      },
      solutions: {
        python: code`
          from typing import List

          def possibleToStamp(grid: List[List[int]], stampHeight: int, stampWidth: int) -> bool:
              m, n = len(grid), len(grid[0])
              h, w = stampHeight, stampWidth
              P = [[0] * (n + 1) for _ in range(m + 1)]
              for i in range(m):
                  row, cur, nxt = grid[i], P[i], P[i + 1]
                  for j in range(n):
                      nxt[j + 1] = row[j] + cur[j + 1] + nxt[j] - cur[j]
              D = [[0] * (n + 2) for _ in range(m + 2)]
              for r in range(m - h + 1):
                  for c in range(n - w + 1):
                      if P[r + h][c + w] - P[r][c + w] - P[r + h][c] + P[r][c] == 0:
                          D[r][c] += 1
                          D[r][c + w] -= 1
                          D[r + h][c] -= 1
                          D[r + h][c + w] += 1
              cover = [[0] * (n + 1) for _ in range(m + 1)]
              for i in range(m):
                  for j in range(n):
                      cover[i + 1][j + 1] = D[i][j] + cover[i][j + 1] + cover[i + 1][j] - cover[i][j]
                      if grid[i][j] == 0 and cover[i + 1][j + 1] == 0:
                          return False
              return True
        `,
        javascript: code`
          var possibleToStamp = function(grid, stampHeight, stampWidth) {
              var m = grid.length, n = grid[0].length, h = stampHeight, w = stampWidth;
              var mat = function(r, c) { var a = []; for (var i = 0; i < r; i++) { var row = new Array(c); for (var j = 0; j < c; j++) row[j] = 0; a.push(row); } return a; };
              var P = mat(m + 1, n + 1);
              for (var i = 0; i < m; i++)
                  for (var j = 0; j < n; j++)
                      P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
              var D = mat(m + 2, n + 2);
              for (var r = 0; r + h <= m; r++)
                  for (var c = 0; c + w <= n; c++)
                      if (P[r + h][c + w] - P[r][c + w] - P[r + h][c] + P[r][c] === 0) {
                          D[r][c]++; D[r][c + w]--; D[r + h][c]--; D[r + h][c + w]++;
                      }
              var C = mat(m + 1, n + 1);
              for (var x = 0; x < m; x++)
                  for (var y = 0; y < n; y++) {
                      C[x + 1][y + 1] = D[x][y] + C[x][y + 1] + C[x + 1][y] - C[x][y];
                      if (grid[x][y] === 0 && C[x + 1][y + 1] === 0) return false;
                  }
              return true;
          };
        `,
        typescript: code`
          function possibleToStamp(grid: number[][], stampHeight: number, stampWidth: number): boolean {
              var m = grid.length, n = grid[0].length, h = stampHeight, w = stampWidth;
              var mat = function(r: number, c: number): number[][] { var a: number[][] = []; for (var i = 0; i < r; i++) { var row: number[] = []; for (var j = 0; j < c; j++) row.push(0); a.push(row); } return a; };
              var P = mat(m + 1, n + 1);
              for (var i = 0; i < m; i++)
                  for (var j = 0; j < n; j++)
                      P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
              var D = mat(m + 2, n + 2);
              for (var r = 0; r + h <= m; r++)
                  for (var c = 0; c + w <= n; c++)
                      if (P[r + h][c + w] - P[r][c + w] - P[r + h][c] + P[r][c] === 0) {
                          D[r][c]++; D[r][c + w]--; D[r + h][c]--; D[r + h][c + w]++;
                      }
              var C = mat(m + 1, n + 1);
              for (var x = 0; x < m; x++)
                  for (var y = 0; y < n; y++) {
                      C[x + 1][y + 1] = D[x][y] + C[x][y + 1] + C[x + 1][y] - C[x][y];
                      if (grid[x][y] === 0 && C[x + 1][y + 1] === 0) return false;
                  }
              return true;
          }
        `,
        java: code`
          public static boolean possibleToStamp(int[][] grid, int stampHeight, int stampWidth) {
              int m = grid.length, n = grid[0].length, h = stampHeight, w = stampWidth;
              int[][] P = new int[m + 1][n + 1];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
              int[][] D = new int[m + 2][n + 2];
              for (int r = 0; r + h <= m; r++)
                  for (int c = 0; c + w <= n; c++)
                      if (P[r + h][c + w] - P[r][c + w] - P[r + h][c] + P[r][c] == 0) {
                          D[r][c]++; D[r][c + w]--; D[r + h][c]--; D[r + h][c + w]++;
                      }
              int[][] C = new int[m + 1][n + 1];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++) {
                      C[i + 1][j + 1] = D[i][j] + C[i][j + 1] + C[i + 1][j] - C[i][j];
                      if (grid[i][j] == 0 && C[i + 1][j + 1] == 0) return false;
                  }
              return true;
          }
        `,
        cpp: code`
          bool possibleToStamp(vector<vector<int>>& grid, int stampHeight, int stampWidth) {
              int m = grid.size(), n = grid[0].size(), h = stampHeight, w = stampWidth;
              vector<vector<int>> P(m + 1, vector<int>(n + 1, 0)), D(m + 2, vector<int>(n + 2, 0)), C(m + 1, vector<int>(n + 1, 0));
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
              for (int r = 0; r + h <= m; r++)
                  for (int c = 0; c + w <= n; c++)
                      if (P[r + h][c + w] - P[r][c + w] - P[r + h][c] + P[r][c] == 0) {
                          D[r][c]++; D[r][c + w]--; D[r + h][c]--; D[r + h][c + w]++;
                      }
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++) {
                      C[i + 1][j + 1] = D[i][j] + C[i][j + 1] + C[i + 1][j] - C[i][j];
                      if (grid[i][j] == 0 && C[i + 1][j + 1] == 0) return false;
                  }
              return true;
          }
        `,
        c: code`
          bool possibleToStamp(int** grid, int gridSize, int* gridColSize, int stampHeight, int stampWidth) {
              int m = gridSize, n = gridColSize[0], h = stampHeight, w = stampWidth;
              int W1 = n + 1, W2 = n + 2;
              int* P = (int*) calloc((size_t) (m + 1) * W1, sizeof(int));
              int* D = (int*) calloc((size_t) (m + 2) * W2, sizeof(int));
              int* C = (int*) calloc((size_t) (m + 1) * W1, sizeof(int));
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      P[(i + 1) * W1 + j + 1] = grid[i][j] + P[i * W1 + j + 1] + P[(i + 1) * W1 + j] - P[i * W1 + j];
              for (int r = 0; r + h <= m; r++)
                  for (int c = 0; c + w <= n; c++)
                      if (P[(r + h) * W1 + c + w] - P[r * W1 + c + w] - P[(r + h) * W1 + c] + P[r * W1 + c] == 0) {
                          D[r * W2 + c]++;
                          D[r * W2 + c + w]--;
                          D[(r + h) * W2 + c]--;
                          D[(r + h) * W2 + c + w]++;
                      }
              bool ok = true;
              for (int i = 0; i < m && ok; i++)
                  for (int j = 0; j < n; j++) {
                      C[(i + 1) * W1 + j + 1] = D[i * W2 + j] + C[i * W1 + j + 1] + C[(i + 1) * W1 + j] - C[i * W1 + j];
                      if (grid[i][j] == 0 && C[(i + 1) * W1 + j + 1] == 0) { ok = false; break; }
                  }
              free(P);
              free(D);
              free(C);
              return ok;
          }
        `,
        csharp: code`
          public static bool PossibleToStamp(int[][] grid, int stampHeight, int stampWidth)
          {
              int m = grid.Length, n = grid[0].Length, h = stampHeight, w = stampWidth;
              int[,] P = new int[m + 1, n + 1], D = new int[m + 2, n + 2], C = new int[m + 1, n + 1];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      P[i + 1, j + 1] = grid[i][j] + P[i, j + 1] + P[i + 1, j] - P[i, j];
              for (int r = 0; r + h <= m; r++)
                  for (int c = 0; c + w <= n; c++)
                      if (P[r + h, c + w] - P[r, c + w] - P[r + h, c] + P[r, c] == 0)
                      {
                          D[r, c]++; D[r, c + w]--; D[r + h, c]--; D[r + h, c + w]++;
                      }
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                  {
                      C[i + 1, j + 1] = D[i, j] + C[i, j + 1] + C[i + 1, j] - C[i, j];
                      if (grid[i][j] == 0 && C[i + 1, j + 1] == 0) return false;
                  }
              return true;
          }
        `,
        go: code`
          func possibleToStamp(grid [][]int, stampHeight int, stampWidth int) bool {
              m, n, h, w := len(grid), len(grid[0]), stampHeight, stampWidth
              mat := func(r, c int) [][]int {
                  a := make([][]int, r)
                  for i := range a {
                      a[i] = make([]int, c)
                  }
                  return a
              }
              P, D, C := mat(m+1, n+1), mat(m+2, n+2), mat(m+1, n+1)
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      P[i+1][j+1] = grid[i][j] + P[i][j+1] + P[i+1][j] - P[i][j]
                  }
              }
              for r := 0; r+h <= m; r++ {
                  for c := 0; c+w <= n; c++ {
                      if P[r+h][c+w]-P[r][c+w]-P[r+h][c]+P[r][c] == 0 {
                          D[r][c]++
                          D[r][c+w]--
                          D[r+h][c]--
                          D[r+h][c+w]++
                      }
                  }
              }
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      C[i+1][j+1] = D[i][j] + C[i][j+1] + C[i+1][j] - C[i][j]
                      if grid[i][j] == 0 && C[i+1][j+1] == 0 {
                          return false
                      }
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun possibleToStamp(grid: Array<IntArray>, stampHeight: Int, stampWidth: Int): Boolean {
              val m = grid.size
              val n = grid[0].size
              val h = stampHeight
              val w = stampWidth
              val P = Array(m + 1) { IntArray(n + 1) }
              val D = Array(m + 2) { IntArray(n + 2) }
              val C = Array(m + 1) { IntArray(n + 1) }
              for (i in 0 until m) for (j in 0 until n)
                  P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]
              var r = 0
              while (r + h <= m) {
                  var c = 0
                  while (c + w <= n) {
                      if (P[r + h][c + w] - P[r][c + w] - P[r + h][c] + P[r][c] == 0) {
                          D[r][c]++; D[r][c + w]--; D[r + h][c]--; D[r + h][c + w]++
                      }
                      c++
                  }
                  r++
              }
              for (i in 0 until m) for (j in 0 until n) {
                  C[i + 1][j + 1] = D[i][j] + C[i][j + 1] + C[i + 1][j] - C[i][j]
                  if (grid[i][j] == 0 && C[i + 1][j + 1] == 0) return false
              }
              return true
          }
        `,
        swift: code`
          func possibleToStamp(_ grid: [[Int]], _ stampHeight: Int, _ stampWidth: Int) -> Bool {
              let m = grid.count, n = grid[0].count, h = stampHeight, w = stampWidth
              var P = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m + 1)
              var D = [[Int]](repeating: [Int](repeating: 0, count: n + 2), count: m + 2)
              var C = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m + 1)
              for i in 0..<m {
                  for j in 0..<n {
                      P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]
                  }
              }
              if h <= m && w <= n {
                  for r in 0...(m - h) {
                      for c in 0...(n - w) where P[r + h][c + w] - P[r][c + w] - P[r + h][c] + P[r][c] == 0 {
                          D[r][c] += 1; D[r][c + w] -= 1; D[r + h][c] -= 1; D[r + h][c + w] += 1
                      }
                  }
              }
              for i in 0..<m {
                  for j in 0..<n {
                      C[i + 1][j + 1] = D[i][j] + C[i][j + 1] + C[i + 1][j] - C[i][j]
                      if grid[i][j] == 0 && C[i + 1][j + 1] == 0 { return false }
                  }
              }
              return true
          }
        `,
        rust: code`
          fn possibleToStamp(grid: Vec<Vec<i32>>, stamp_height: i32, stamp_width: i32) -> bool {
              let (m, n) = (grid.len(), grid[0].len());
              let (h, w) = (stamp_height as usize, stamp_width as usize);
              let mut p = vec![vec![0i32; n + 1]; m + 1];
              let mut d = vec![vec![0i32; n + 2]; m + 2];
              let mut cv = vec![vec![0i32; n + 1]; m + 1];
              for i in 0..m {
                  for j in 0..n {
                      p[i + 1][j + 1] = grid[i][j] + p[i][j + 1] + p[i + 1][j] - p[i][j];
                  }
              }
              if h <= m && w <= n {
                  for r in 0..=(m - h) {
                      for c in 0..=(n - w) {
                          if p[r + h][c + w] - p[r][c + w] - p[r + h][c] + p[r][c] == 0 {
                              d[r][c] += 1;
                              d[r][c + w] -= 1;
                              d[r + h][c] -= 1;
                              d[r + h][c + w] += 1;
                          }
                      }
                  }
              }
              for i in 0..m {
                  for j in 0..n {
                      cv[i + 1][j + 1] = d[i][j] + cv[i][j + 1] + cv[i + 1][j] - cv[i][j];
                      if grid[i][j] == 0 && cv[i + 1][j + 1] == 0 { return false; }
                  }
              }
              true
          }
        `,
        php: code`
          function possibleToStamp($grid, $stampHeight, $stampWidth) {
              $m = count($grid);
              $n = count($grid[0]);
              $h = $stampHeight;
              $w = $stampWidth;
              $P = array_fill(0, $m + 1, array_fill(0, $n + 1, 0));
              $D = array_fill(0, $m + 2, array_fill(0, $n + 2, 0));
              $C = array_fill(0, $m + 1, array_fill(0, $n + 1, 0));
              for ($i = 0; $i < $m; $i++)
                  for ($j = 0; $j < $n; $j++)
                      $P[$i + 1][$j + 1] = $grid[$i][$j] + $P[$i][$j + 1] + $P[$i + 1][$j] - $P[$i][$j];
              for ($r = 0; $r + $h <= $m; $r++)
                  for ($c = 0; $c + $w <= $n; $c++)
                      if ($P[$r + $h][$c + $w] - $P[$r][$c + $w] - $P[$r + $h][$c] + $P[$r][$c] == 0) {
                          $D[$r][$c]++; $D[$r][$c + $w]--; $D[$r + $h][$c]--; $D[$r + $h][$c + $w]++;
                      }
              for ($i = 0; $i < $m; $i++)
                  for ($j = 0; $j < $n; $j++) {
                      $C[$i + 1][$j + 1] = $D[$i][$j] + $C[$i][$j + 1] + $C[$i + 1][$j] - $C[$i][$j];
                      if ($grid[$i][$j] == 0 && $C[$i + 1][$j + 1] == 0) return false;
                  }
              return true;
          }
        `,
        ruby: code`
          def possibleToStamp(grid, stampHeight, stampWidth)
            m = grid.length
            n = grid[0].length
            h = stampHeight
            w = stampWidth
            pre = Array.new(m + 1) { Array.new(n + 1, 0) }
            d = Array.new(m + 2) { Array.new(n + 2, 0) }
            cov = Array.new(m + 1) { Array.new(n + 1, 0) }
            (0...m).each do |i|
              (0...n).each do |j|
                pre[i + 1][j + 1] = grid[i][j] + pre[i][j + 1] + pre[i + 1][j] - pre[i][j]
              end
            end
            (0..(m - h)).each do |r|
              (0..(n - w)).each do |c|
                next unless pre[r + h][c + w] - pre[r][c + w] - pre[r + h][c] + pre[r][c] == 0
                d[r][c] += 1
                d[r][c + w] -= 1
                d[r + h][c] -= 1
                d[r + h][c + w] += 1
              end
            end
            (0...m).each do |i|
              (0...n).each do |j|
                cov[i + 1][j + 1] = d[i][j] + cov[i][j + 1] + cov[i + 1][j] - cov[i][j]
                return false if grid[i][j] == 0 && cov[i + 1][j + 1] == 0
              end
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Count the Hidden Sequences (LC 2145) ────────────────────────
  (() => {
    const ref = (differences: number[], lower: number, upper: number) => {
      if (upper - lower <= 3000) {
        // Brute force: try every starting value.
        let count = 0;
        for (let x = lower; x <= upper; x++) {
          let v = x, ok = true;
          for (const d of differences) { v += d; if (v < lower || v > upper) { ok = false; break; } }
          if (ok) count++;
        }
        return count;
      }
      let v = 0, lo = 0, hi = 0;
      for (const d of differences) { v += d; lo = Math.min(lo, v); hi = Math.max(hi, v); }
      return Math.max(0, (upper - lower) - (hi - lo) + 1);
    };
    return {
      slug: "count-the-hidden-sequences",
      title: "Count the Hidden Sequences",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "numberOfArrays", params: [{ name: "differences", type: "int[]" as const }, { name: "lower", type: "int" as const }, { name: "upper", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A hidden sequence of `n + 1` integers was recorded only by its consecutive differences: `differences[i] = hidden[i + 1] - hidden[i]`. You also know every value of the hidden sequence lies in the inclusive range `[lower, upper]`.\n\nReturn how many hidden sequences are possible. If none is, return `0`.",
        [
          { in: "differences = [1,-3,4], lower = 1, upper = 6", out: "2", note: "[3,4,1,5] and [4,5,2,6] both fit in [1, 6]." },
          { in: "differences = [3,-4,5,1,-2], lower = -4, upper = 5", out: "4", note: "Starting values -3, -2, -1 and 0 all keep the sequence within [-4, 5]." },
          { in: "differences = [4,-7,2], lower = 3, upper = 6", out: "0", note: "The sequence swings across 7 values, but the range only holds 4." },
        ],
        ["n == differences.length", "1 <= n <= 10^5", "-10^5 <= differences[i] <= 10^5", "-10^5 <= lower <= upper <= 10^5"]),
      hints: [
        "Once the first value is fixed, the whole sequence is fixed. So count the valid first values.",
        "Shift the sequence to start at `0` and track its minimum `lo` and maximum `hi` along the way (including the starting `0`).",
        "The sequence starting at `x` spans `[x + lo, x + hi]`; it fits iff `lower - lo <= x <= upper - hi`. Count the integers in that range.",
      ],
      editorial: explain({
        idea: "The differences fix the shape of the sequence; only the starting value is free. The shape occupies a band of width `hi - lo`, and the number of positions of that band inside `[lower, upper]` is `(upper - lower) - (hi - lo) + 1`, or zero if it does not fit.",
        steps: [
          "Walk the prefix sums starting from `0`, tracking the minimum `lo` and maximum `hi` (both start at `0`).",
          "Return `max(0, (upper - lower) - (hi - lo) + 1)`.",
          "(Optional) stop early once `hi - lo > upper - lower` — the answer is already `0`.",
        ],
        why: "With start `x` the sequence's values are `x + s` for each prefix sum `s`, so its minimum is `x + lo` and maximum `x + hi`. All values lie in `[lower, upper]` iff `x + lo >= lower` and `x + hi <= upper`, i.e. `x` in `[lower - lo, upper - hi]`, which contains `(upper - hi) - (lower - lo) + 1` integers when non-negative.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Prefix sums reach `10^10` in magnitude — use 64-bit integers (or stop early once the band is wider than the range).",
          "Include the starting value `0` in `lo` and `hi`.",
        ],
      }),
      examples: [
        { input: "[1,-3,4]\n1\n6", expectedOutput: "2" },
        { input: "[3,-4,5,1,-2]\n-4\n5", expectedOutput: "4" },
        { input: "[4,-7,2]\n3\n6", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 15, 40]));
        const span = pick(rng, [0, 2, 10, 100, 100000]);
        const differences = Array.from({ length: n }, () => ri(rng, -span, span));
        const wide = rng() < 0.3;
        const lower = wide ? ri(rng, -100000, 0) : ri(rng, -500, 500);
        const upper = wide ? ri(rng, Math.max(lower, 0), 100000) : Math.min(100000, lower + ri(rng, 0, pick(rng, [0, 5, 50, 2000])));
        return { input: `${fmtIntArr(differences)}\n${lower}\n${upper}`, expectedOutput: String(ref(differences, lower, upper)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numberOfArrays(differences: List[int], lower: int, upper: int) -> int:
              cur = lo = hi = 0
              for d in differences:
                  cur += d
                  lo = min(lo, cur)
                  hi = max(hi, cur)
              return max(0, (upper - lower) - (hi - lo) + 1)
        `,
        javascript: code`
          var numberOfArrays = function(differences, lower, upper) {
              var cur = 0, lo = 0, hi = 0;
              for (var i = 0; i < differences.length; i++) {
                  cur += differences[i];
                  if (cur < lo) lo = cur;
                  if (cur > hi) hi = cur;
              }
              return Math.max(0, (upper - lower) - (hi - lo) + 1);
          };
        `,
        typescript: code`
          function numberOfArrays(differences: number[], lower: number, upper: number): number {
              var cur = 0, lo = 0, hi = 0;
              for (var i = 0; i < differences.length; i++) {
                  cur += differences[i];
                  if (cur < lo) lo = cur;
                  if (cur > hi) hi = cur;
              }
              return Math.max(0, (upper - lower) - (hi - lo) + 1);
          }
        `,
        java: code`
          public static int numberOfArrays(int[] differences, int lower, int upper) {
              long cur = 0, lo = 0, hi = 0;
              for (int d : differences) {
                  cur += d;
                  lo = Math.min(lo, cur);
                  hi = Math.max(hi, cur);
              }
              return (int) Math.max(0L, (long) (upper - lower) - (hi - lo) + 1);
          }
        `,
        cpp: code`
          int numberOfArrays(vector<int>& differences, int lower, int upper) {
              long long cur = 0, lo = 0, hi = 0;
              for (int d : differences) {
                  cur += d;
                  lo = min(lo, cur);
                  hi = max(hi, cur);
              }
              return (int) max(0LL, (long long) (upper - lower) - (hi - lo) + 1);
          }
        `,
        c: code`
          int numberOfArrays(int* differences, int differencesSize, int lower, int upper) {
              long long cur = 0, lo = 0, hi = 0;
              for (int i = 0; i < differencesSize; i++) {
                  cur += differences[i];
                  if (cur < lo) lo = cur;
                  if (cur > hi) hi = cur;
              }
              long long ans = (long long) (upper - lower) - (hi - lo) + 1;
              return ans > 0 ? (int) ans : 0;
          }
        `,
        csharp: code`
          public static int NumberOfArrays(int[] differences, int lower, int upper)
          {
              long cur = 0, lo = 0, hi = 0;
              foreach (int d in differences)
              {
                  cur += d;
                  lo = Math.Min(lo, cur);
                  hi = Math.Max(hi, cur);
              }
              return (int) Math.Max(0L, (long) (upper - lower) - (hi - lo) + 1);
          }
        `,
        go: code`
          func numberOfArrays(differences []int, lower int, upper int) int {
              cur, lo, hi := 0, 0, 0
              for _, d := range differences {
                  cur += d
                  if cur < lo {
                      lo = cur
                  }
                  if cur > hi {
                      hi = cur
                  }
              }
              ans := (upper - lower) - (hi - lo) + 1
              if ans < 0 {
                  return 0
              }
              return ans
          }
        `,
        kotlin: code`
          fun numberOfArrays(differences: IntArray, lower: Int, upper: Int): Int {
              var cur = 0L
              var lo = 0L
              var hi = 0L
              for (d in differences) {
                  cur += d
                  lo = minOf(lo, cur)
                  hi = maxOf(hi, cur)
              }
              return maxOf(0L, (upper - lower).toLong() - (hi - lo) + 1).toInt()
          }
        `,
        swift: code`
          func numberOfArrays(_ differences: [Int], _ lower: Int, _ upper: Int) -> Int {
              var cur = 0, lo = 0, hi = 0
              for d in differences {
                  cur += d
                  lo = min(lo, cur)
                  hi = max(hi, cur)
              }
              return max(0, (upper - lower) - (hi - lo) + 1)
          }
        `,
        rust: code`
          fn numberOfArrays(differences: Vec<i32>, lower: i32, upper: i32) -> i32 {
              let (mut cur, mut lo, mut hi) = (0i64, 0i64, 0i64);
              for &d in differences.iter() {
                  cur += d as i64;
                  lo = lo.min(cur);
                  hi = hi.max(cur);
              }
              (upper as i64 - lower as i64 - (hi - lo) + 1).max(0) as i32
          }
        `,
        php: code`
          function numberOfArrays($differences, $lower, $upper) {
              $cur = 0; $lo = 0; $hi = 0;
              foreach ($differences as $d) {
                  $cur += $d;
                  if ($cur < $lo) $lo = $cur;
                  if ($cur > $hi) $hi = $cur;
              }
              return max(0, ($upper - $lower) - ($hi - $lo) + 1);
          }
        `,
        ruby: code`
          def numberOfArrays(differences, lower, upper)
            cur = lo = hi = 0
            differences.each do |d|
              cur += d
              lo = cur if cur < lo
              hi = cur if cur > hi
            end
            [0, (upper - lower) - (hi - lo) + 1].max
          end
        `,
      },
    };
  })(),

  // ── All Divisions With the Highest Score of a Binary Array (LC 2155)
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const scores: number[] = [];
      for (let i = 0; i <= n; i++) {
        let s = 0;
        for (let j = 0; j < i; j++) if (nums[j] === 0) s++;
        for (let j = i; j < n; j++) if (nums[j] === 1) s++;
        scores.push(s);
      }
      const best = Math.max(...scores);
      return scores.map((s, i) => (s === best ? i : -1)).filter((i) => i >= 0);
    };
    return {
      slug: "all-divisions-with-the-highest-score-of-a-binary-array",
      title: "All Divisions With the Highest Score of a Binary Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "maxScoreIndices", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given a binary array `nums` of length `n`. Dividing it at index `i` (`0 <= i <= n`) splits it into `left = nums[0..i - 1]` and `right = nums[i..n - 1]` — either part may be empty (`i = 0` or `i = n`).\n\nThe **division score** at `i` is the number of `0`s in `left` plus the number of `1`s in `right`.\n\nReturn all indices with the highest division score, in **increasing order**.",
        [
          { in: "nums = [0,0,1,0]", out: "[2,4]", note: "Scores for i = 0..4 are 1, 2, 3, 2, 3. The highest, 3, occurs at i = 2 and i = 4." },
          { in: "nums = [0,0,0]", out: "[3]", note: "Putting every 0 on the left scores 3." },
          { in: "nums = [1,1]", out: "[0]", note: "Putting every 1 on the right scores 2." },
        ],
        ["n == nums.length", "1 <= n <= 10^5", "nums[i] is either 0 or 1"]),
      hints: [
        "Recounting both halves for each of the `n + 1` divisions is `O(n^2)`. How does the score change when the split moves one step right?",
        "Moving from `i` to `i + 1` moves `nums[i]` from right to left: a `0` adds one point, a `1` loses one point.",
        "Start with the score at `i = 0` (the count of 1s), update it step by step, and collect every index that matches the running maximum — resetting the list whenever a new maximum appears.",
      ],
      editorial: explain({
        idea: "The score at consecutive split points differs by exactly `+1` (a `0` crossed into the left) or `-1` (a `1` left the right part). One sweep computes all `n + 1` scores and keeps the indices of the maximum.",
        steps: [
          "`score` = number of 1s in `nums` (the division at `i = 0`); `best = score`, `answer = [0]`.",
          "For `i = 1 .. n`: `score += 1` if `nums[i - 1] == 0`, else `score -= 1`.",
          "If `score > best`, set `best = score` and `answer = [i]`; if `score == best`, append `i`.",
          "Return `answer`.",
        ],
        why: "Moving the split from `i - 1` to `i` transfers only `nums[i - 1]` between the parts, so the update is exact. The maintained list always holds every index seen so far whose score equals the best seen so far, in increasing order.",
        time: "O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "There are `n + 1` divisions, including the empty-left `i = 0` and the empty-right `i = n`.",
          "Reset the list when a strictly higher score appears; append on a tie.",
        ],
      }),
      examples: [
        { input: "[0,0,1,0]", expectedOutput: "[2,4]" },
        { input: "[0,0,0]", expectedOutput: "[3]" },
        { input: "[1,1]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 40, 60]));
        const p = pick(rng, [0, 0.2, 0.5, 0.8, 1]);
        const nums = Array.from({ length: n }, () => (rng() < p ? 1 : 0));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxScoreIndices(nums: List[int]) -> List[int]:
              score = sum(nums)
              best = score
              answer = [0]
              for i in range(1, len(nums) + 1):
                  score += 1 if nums[i - 1] == 0 else -1
                  if score > best:
                      best = score
                      answer = [i]
                  elif score == best:
                      answer.append(i)
              return answer
        `,
        javascript: code`
          var maxScoreIndices = function(nums) {
              var score = 0;
              for (var k = 0; k < nums.length; k++) score += nums[k];
              var best = score, answer = [0];
              for (var i = 1; i <= nums.length; i++) {
                  score += nums[i - 1] === 0 ? 1 : -1;
                  if (score > best) { best = score; answer = [i]; }
                  else if (score === best) answer.push(i);
              }
              return answer;
          };
        `,
        typescript: code`
          function maxScoreIndices(nums: number[]): number[] {
              var score = 0;
              for (var k = 0; k < nums.length; k++) score += nums[k];
              var best = score, answer: number[] = [0];
              for (var i = 1; i <= nums.length; i++) {
                  score += nums[i - 1] === 0 ? 1 : -1;
                  if (score > best) { best = score; answer = [i]; }
                  else if (score === best) answer.push(i);
              }
              return answer;
          }
        `,
        java: code`
          public static int[] maxScoreIndices(int[] nums) {
              int score = 0;
              for (int x : nums) score += x;
              int best = score;
              List<Integer> answer = new ArrayList<>();
              answer.add(0);
              for (int i = 1; i <= nums.length; i++) {
                  score += nums[i - 1] == 0 ? 1 : -1;
                  if (score > best) { best = score; answer.clear(); answer.add(i); }
                  else if (score == best) answer.add(i);
              }
              int[] res = new int[answer.size()];
              for (int i = 0; i < res.length; i++) res[i] = answer.get(i);
              return res;
          }
        `,
        cpp: code`
          vector<int> maxScoreIndices(vector<int>& nums) {
              int score = 0;
              for (int x : nums) score += x;
              int best = score;
              vector<int> answer{0};
              for (int i = 1; i <= (int) nums.size(); i++) {
                  score += nums[i - 1] == 0 ? 1 : -1;
                  if (score > best) { best = score; answer.assign(1, i); }
                  else if (score == best) answer.push_back(i);
              }
              return answer;
          }
        `,
        c: code`
          int* maxScoreIndices(int* nums, int numsSize, int* returnSize) {
              int* answer = (int*) malloc((size_t) (numsSize + 1) * sizeof(int));
              int score = 0;
              for (int i = 0; i < numsSize; i++) score += nums[i];
              int best = score, k = 0;
              answer[k++] = 0;
              for (int i = 1; i <= numsSize; i++) {
                  score += nums[i - 1] == 0 ? 1 : -1;
                  if (score > best) { best = score; k = 0; answer[k++] = i; }
                  else if (score == best) answer[k++] = i;
              }
              *returnSize = k;
              return answer;
          }
        `,
        csharp: code`
          public static int[] MaxScoreIndices(int[] nums)
          {
              int score = 0;
              foreach (int x in nums) score += x;
              int best = score;
              var answer = new List<int> { 0 };
              for (int i = 1; i <= nums.Length; i++)
              {
                  score += nums[i - 1] == 0 ? 1 : -1;
                  if (score > best) { best = score; answer.Clear(); answer.Add(i); }
                  else if (score == best) answer.Add(i);
              }
              return answer.ToArray();
          }
        `,
        go: code`
          func maxScoreIndices(nums []int) []int {
              score := 0
              for _, x := range nums {
                  score += x
              }
              best := score
              answer := []int{0}
              for i := 1; i <= len(nums); i++ {
                  if nums[i-1] == 0 {
                      score++
                  } else {
                      score--
                  }
                  if score > best {
                      best = score
                      answer = []int{i}
                  } else if score == best {
                      answer = append(answer, i)
                  }
              }
              return answer
          }
        `,
        kotlin: code`
          fun maxScoreIndices(nums: IntArray): IntArray {
              var score = nums.sum()
              var best = score
              val answer = arrayListOf(0)
              for (i in 1..nums.size) {
                  score += if (nums[i - 1] == 0) 1 else -1
                  if (score > best) { best = score; answer.clear(); answer.add(i) }
                  else if (score == best) answer.add(i)
              }
              return answer.toIntArray()
          }
        `,
        swift: code`
          func maxScoreIndices(_ nums: [Int]) -> [Int] {
              var score = nums.reduce(0, +)
              var best = score
              var answer = [0]
              for i in stride(from: 1, through: nums.count, by: 1) {
                  score += nums[i - 1] == 0 ? 1 : -1
                  if score > best { best = score; answer = [i] }
                  else if score == best { answer.append(i) }
              }
              return answer
          }
        `,
        rust: code`
          fn maxScoreIndices(nums: Vec<i32>) -> Vec<i32> {
              let mut score: i32 = nums.iter().sum();
              let mut best = score;
              let mut answer = vec![0i32];
              for i in 1..=nums.len() {
                  score += if nums[i - 1] == 0 { 1 } else { -1 };
                  if score > best {
                      best = score;
                      answer = vec![i as i32];
                  } else if score == best {
                      answer.push(i as i32);
                  }
              }
              answer
          }
        `,
        php: code`
          function maxScoreIndices($nums) {
              $score = array_sum($nums);
              $best = $score;
              $answer = [0];
              $n = count($nums);
              for ($i = 1; $i <= $n; $i++) {
                  $score += $nums[$i - 1] == 0 ? 1 : -1;
                  if ($score > $best) { $best = $score; $answer = [$i]; }
                  elseif ($score == $best) $answer[] = $i;
              }
              return $answer;
          }
        `,
        ruby: code`
          def maxScoreIndices(nums)
            score = nums.sum
            best = score
            answer = [0]
            (1..nums.length).each do |i|
              score += nums[i - 1] == 0 ? 1 : -1
              if score > best
                best = score
                answer = [i]
              elsif score == best
                answer << i
              end
            end
            answer
          end
        `,
      },
    };
  })(),
];
