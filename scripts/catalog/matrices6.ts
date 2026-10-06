/**
 * Matrix and grid-search problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo. Character grids travel as string[] (one string per row).
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 * Generated grids stay small (BFS and search problems at most ~8×8) because the
 * whole 5,000-case suite runs in one process under a 15 CPU-second cap, and
 * Python/Ruby/PHP are ~30× slower than V8.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** A random m×n int grid with values in [lo, hi]. */
const randGrid = (rng: Rng, m: number, n: number, lo: number, hi: number) =>
  Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, lo, hi)));

export const MATRICES6_PROBLEMS: CatalogProblem[] = [

  // ── Diagonal Traverse II (LC 1424) ──────────────────────────────
  (() => {
    const ref = (nums: number[][]) => {
      const cells: Array<[number, number, number]> = [];
      for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums[i].length; j++) cells.push([i + j, -i, nums[i][j]]);
      }
      cells.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
      return cells.map((c) => c[2]);
    };
    return {
      slug: "diagonal-traverse-ii",
      title: "Diagonal Traverse II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Matrix", "Meta", "Google", "Amazon"],
      signature: { funcName: "findDiagonalOrder", params: [{ name: "nums", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "`nums` is a **jagged** 2D array: row `i` may have any positive length, so some positions `(i, j)` simply do not exist.\n\nCell `(i, j)` lies on anti-diagonal `i + j`. Return every element of `nums` read anti-diagonal by anti-diagonal, starting with diagonal `0`. Within one diagonal, read from the **bottom-most** row upwards (larger `i` first). Positions that do not exist are skipped.",
        [
          { in: "nums = [[3,8,1],[6,2,7],[9,4,5]]", out: "[3,6,8,9,2,1,4,7,5]" },
          { in: "nums = [[5,8],[3],[9,1,7]]", out: "[5,3,8,9,1,7]", note: "Diagonal 1 holds `(1,0)` = 3 and `(0,1)` = 8; diagonal 2 holds only `(2,0)` = 9 because rows 0 and 1 are too short." },
          { in: "nums = [[4,6,2]]", out: "[4,6,2]" },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i].length <= 10^5", "1 <= sum(nums[i].length) <= 10^5", "1 <= nums[i][j] <= 10^5"]),
      hints: [
        "Every element on the same diagonal shares the same value of `i + j`.",
        "Group elements by `i + j`. In what order should rows be visited so that each group comes out bottom-first?",
        "Visit rows from last to first and append each element to bucket `i + j`; then concatenate the buckets in order of `i + j`.",
      ],
      editorial: explain({
        idea: "The output order is a sort by `(i + j, -i)`. Bucketing by `i + j` achieves it in linear time, and visiting rows from the bottom makes each bucket already ordered.",
        steps: [
          "Create a list of buckets indexed by diagonal number.",
          "Walk the rows from the last one to the first; inside each row walk the columns left to right and append `nums[i][j]` to bucket `i + j`.",
          "Concatenate the buckets from diagonal 0 upwards.",
        ],
        why: "Within one bucket, elements arrive in decreasing row order because rows are scanned bottom-up, and a row contributes at most one element to a given diagonal. So each bucket is already in the required bottom-to-top order, and the buckets are output in diagonal order.",
        time: "O(N) where N is the total number of elements",
        space: "O(N)",
        pitfalls: [
          "Walking an `m × maxLen` rectangle is far too slow when one row is long and the others are short — only real elements should be touched.",
          "Scanning rows top-down fills each bucket upside down; either reverse each bucket or scan bottom-up.",
          "The number of diagonals is `max(i + len_i)`, not the length of the first row.",
        ],
      }),
      examples: [
        { input: "[[3,8,1],[6,2,7],[9,4,5]]", expectedOutput: "[3,6,8,9,2,1,4,7,5]" },
        { input: "[[5,8],[3],[9,1,7]]", expectedOutput: "[5,3,8,9,1,7]" },
        { input: "[[4,6,2]]", expectedOutput: "[4,6,2]" },
      ],
      gen: (rng: Rng) => {
        const shape = ri(rng, 0, 9);
        const rows = shape === 0 ? 1 : ri(rng, 1, 12);
        const maxLen = shape === 1 ? 1 : ri(rng, 1, 12);
        const hi = pick(rng, [9, 100, 100000]);
        const nums = Array.from({ length: rows }, () => Array.from({ length: ri(rng, 1, maxLen) }, () => ri(rng, 1, hi)));
        return { input: fmtIntMat(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findDiagonalOrder(nums: List[List[int]]) -> List[int]:
              buckets = []
              for i in range(len(nums) - 1, -1, -1):
                  for j, v in enumerate(nums[i]):
                      while len(buckets) <= i + j:
                          buckets.append([])
                      buckets[i + j].append(v)
              out = []
              for b in buckets:
                  out.extend(b)
              return out
        `,
        javascript: code`
          var findDiagonalOrder = function(nums) {
              var buckets = [];
              for (var i = nums.length - 1; i >= 0; i--) {
                  for (var j = 0; j < nums[i].length; j++) {
                      var d = i + j;
                      while (buckets.length <= d) buckets.push([]);
                      buckets[d].push(nums[i][j]);
                  }
              }
              var out = [];
              for (var b = 0; b < buckets.length; b++) {
                  for (var t = 0; t < buckets[b].length; t++) out.push(buckets[b][t]);
              }
              return out;
          };
        `,
        typescript: code`
          function findDiagonalOrder(nums: number[][]): number[] {
              var buckets: number[][] = [];
              for (var i = nums.length - 1; i >= 0; i--) {
                  for (var j = 0; j < nums[i].length; j++) {
                      var d = i + j;
                      while (buckets.length <= d) buckets.push([]);
                      buckets[d].push(nums[i][j]);
                  }
              }
              var out: number[] = [];
              for (var b = 0; b < buckets.length; b++) {
                  for (var t = 0; t < buckets[b].length; t++) out.push(buckets[b][t]);
              }
              return out;
          }
        `,
        java: code`
          public static int[] findDiagonalOrder(int[][] nums) {
              List<List<Integer>> buckets = new ArrayList<>();
              int total = 0;
              for (int i = nums.length - 1; i >= 0; i--) {
                  for (int j = 0; j < nums[i].length; j++) {
                      int d = i + j;
                      while (buckets.size() <= d) buckets.add(new ArrayList<>());
                      buckets.get(d).add(nums[i][j]);
                      total++;
                  }
              }
              int[] out = new int[total];
              int k = 0;
              for (List<Integer> b : buckets) for (int v : b) out[k++] = v;
              return out;
          }
        `,
        cpp: code`
          vector<int> findDiagonalOrder(vector<vector<int>>& nums) {
              vector<vector<int>> buckets;
              for (int i = (int)nums.size() - 1; i >= 0; i--) {
                  for (int j = 0; j < (int)nums[i].size(); j++) {
                      int d = i + j;
                      if ((int)buckets.size() <= d) buckets.resize(d + 1);
                      buckets[d].push_back(nums[i][j]);
                  }
              }
              vector<int> out;
              for (auto& b : buckets) for (int v : b) out.push_back(v);
              return out;
          }
        `,
        c: code`
          int* findDiagonalOrder(int** nums, int numsSize, int* numsColSize, int* returnSize) {
              int maxD = 0, total = 0;
              for (int i = 0; i < numsSize; i++) {
                  total += numsColSize[i];
                  if (i + numsColSize[i] - 1 > maxD) maxD = i + numsColSize[i] - 1;
              }
              /* start[d] = how many elements lie on diagonals before d (a counting sort). */
              int* start = (int*)calloc(maxD + 2, sizeof(int));
              for (int i = 0; i < numsSize; i++)
                  for (int j = 0; j < numsColSize[i]; j++) start[i + j + 1]++;
              for (int d = 1; d <= maxD + 1; d++) start[d] += start[d - 1];
              int* out = (int*)malloc((total > 0 ? total : 1) * sizeof(int));
              for (int i = numsSize - 1; i >= 0; i--)
                  for (int j = 0; j < numsColSize[i]; j++) out[start[i + j]++] = nums[i][j];
              free(start);
              *returnSize = total;
              return out;
          }
        `,
        csharp: code`
          public static int[] FindDiagonalOrder(int[][] nums)
          {
              var buckets = new List<List<int>>();
              for (int i = nums.Length - 1; i >= 0; i--)
              {
                  for (int j = 0; j < nums[i].Length; j++)
                  {
                      int d = i + j;
                      while (buckets.Count <= d) buckets.Add(new List<int>());
                      buckets[d].Add(nums[i][j]);
                  }
              }
              var result = new List<int>();
              foreach (var b in buckets) result.AddRange(b);
              return result.ToArray();
          }
        `,
        go: code`
          func findDiagonalOrder(nums [][]int) []int {
          	buckets := [][]int{}
          	for i := len(nums) - 1; i >= 0; i-- {
          		for j, v := range nums[i] {
          			d := i + j
          			for len(buckets) <= d {
          				buckets = append(buckets, []int{})
          			}
          			buckets[d] = append(buckets[d], v)
          		}
          	}
          	res := []int{}
          	for _, b := range buckets {
          		res = append(res, b...)
          	}
          	return res
          }
        `,
        kotlin: code`
          fun findDiagonalOrder(nums: Array<IntArray>): IntArray {
              val buckets = ArrayList<ArrayList<Int>>()
              for (i in nums.indices.reversed()) {
                  for (j in nums[i].indices) {
                      val d = i + j
                      while (buckets.size <= d) buckets.add(ArrayList())
                      buckets[d].add(nums[i][j])
                  }
              }
              val res = ArrayList<Int>()
              for (b in buckets) res.addAll(b)
              return res.toIntArray()
          }
        `,
        swift: code`
          func findDiagonalOrder(_ nums: [[Int]]) -> [Int] {
              var buckets = [[Int]]()
              for i in stride(from: nums.count - 1, through: 0, by: -1) {
                  for j in 0..<nums[i].count {
                      let d = i + j
                      while buckets.count <= d { buckets.append([]) }
                      buckets[d].append(nums[i][j])
                  }
              }
              var res = [Int]()
              for b in buckets { res.append(contentsOf: b) }
              return res
          }
        `,
        rust: code`
          fn findDiagonalOrder(nums: Vec<Vec<i32>>) -> Vec<i32> {
              let mut buckets: Vec<Vec<i32>> = Vec::new();
              for i in (0..nums.len()).rev() {
                  for j in 0..nums[i].len() {
                      let d = i + j;
                      while buckets.len() <= d {
                          buckets.push(Vec::new());
                      }
                      buckets[d].push(nums[i][j]);
                  }
              }
              let mut res: Vec<i32> = Vec::new();
              for b in buckets.iter() {
                  res.extend_from_slice(b);
              }
              res
          }
        `,
        php: code`
          function findDiagonalOrder($nums) {
              $buckets = [];
              for ($i = count($nums) - 1; $i >= 0; $i--) {
                  foreach ($nums[$i] as $j => $v) {
                      $buckets[$i + $j][] = $v;
                  }
              }
              ksort($buckets);
              $res = [];
              foreach ($buckets as $b) {
                  foreach ($b as $v) $res[] = $v;
              }
              return $res;
          }
        `,
        ruby: code`
          def findDiagonalOrder(nums)
            buckets = []
            (nums.length - 1).downto(0) do |i|
              nums[i].each_with_index do |v, j|
                (buckets[i + j] ||= []) << v
              end
            end
            res = []
            buckets.each { |b| res.concat(b) if b }
            res
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum of an Hourglass (LC 2428) ───────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      let best = -1;
      for (let r = 0; r + 2 < grid.length; r++) {
        for (let c = 0; c + 2 < grid[0].length; c++) {
          let s = grid[r + 1][c + 1];
          for (let k = 0; k < 3; k++) s += grid[r][c + k] + grid[r + 2][c + k];
          if (s > best) best = s;
        }
      }
      return best;
    };
    return {
      slug: "maximum-sum-of-an-hourglass",
      title: "Maximum Sum of an Hourglass",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Prefix Sum", "Amazon", "Google", "TCS"],
      signature: { funcName: "maxSum", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An **hourglass** in a matrix is a 3 × 3 window from which the middle-left and middle-right cells are removed — it keeps the whole top row of the window, its centre cell, and its whole bottom row (seven cells in all):\n\n```\na b c\n  d\ne f g\n```\n\nGiven an `m x n` integer matrix `grid`, return the largest sum of the seven cells over every hourglass that fits entirely inside the grid. The hourglass cannot be rotated.",
        [
          { in: "grid = [[1,2,3],[4,5,6],[7,8,9]]", out: "35", note: "The only hourglass is 1 + 2 + 3 + 5 + 7 + 8 + 9." },
          { in: "grid = [[3,1,4,1],[5,9,2,6],[5,3,5,8]]", out: "30", note: "The left hourglass sums to 3 + 1 + 4 + 9 + 5 + 3 + 5 = 30; the right one to 24." },
          { in: "grid = [[0,0,0],[0,0,0],[0,0,0]]", out: "0" },
        ],
        ["m == grid.length", "n == grid[i].length", "3 <= m, n <= 150", "0 <= grid[i][j] <= 10^6"]),
      hints: [
        "An hourglass is fixed by its top-left corner `(r, c)`, with `r <= m - 3` and `c <= n - 3`.",
        "Each hourglass has exactly seven cells, so summing them directly costs O(1).",
        "Try every top-left corner and keep the maximum of the seven-cell sums.",
      ],
      editorial: explain({
        idea: "There are only `(m - 2) × (n - 2)` hourglasses and each has a constant seven cells, so enumerating them all is already optimal.",
        steps: [
          "For every top-left corner `(r, c)` with `r + 2 < m` and `c + 2 < n`:",
          "Add `grid[r][c..c+2]`, `grid[r+1][c+1]` and `grid[r+2][c..c+2]`.",
          "Keep the largest sum seen and return it.",
        ],
        why: "Every hourglass that fits is identified by exactly one top-left corner in that range, so the loop examines each one once and the maximum is exact.",
        time: "O(m · n)",
        space: "O(1)",
        pitfalls: [
          "The middle row contributes only its centre cell — not all three.",
          "Corners must stop at `m - 3` and `n - 3`; going further reads outside the grid.",
          "Seven values of up to 10^6 sum to 7 × 10^6, which fits comfortably in 32 bits.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "35" },
        { input: "[[3,1,4,1],[5,9,2,6],[5,3,5,8]]", expectedOutput: "30" },
        { input: "[[0,0,0],[0,0,0],[0,0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 3, pick(rng, [3, 6, 12]));
        const n = ri(rng, 3, pick(rng, [3, 6, 12]));
        const hi = ri(rng, 0, 15) === 0 ? 0 : pick(rng, [9, 1000, 1000000]);
        const grid = randGrid(rng, m, n, 0, hi);
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSum(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              best = 0
              for r in range(m - 2):
                  for c in range(n - 2):
                      s = sum(grid[r][c:c + 3]) + grid[r + 1][c + 1] + sum(grid[r + 2][c:c + 3])
                      if s > best:
                          best = s
              return best
        `,
        javascript: code`
          var maxSum = function(grid) {
              var m = grid.length, n = grid[0].length, best = 0;
              for (var r = 0; r + 2 < m; r++) {
                  for (var c = 0; c + 2 < n; c++) {
                      var s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2]
                          + grid[r + 1][c + 1]
                          + grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2];
                      if (s > best) best = s;
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function maxSum(grid: number[][]): number {
              var m = grid.length, n = grid[0].length, best = 0;
              for (var r = 0; r + 2 < m; r++) {
                  for (var c = 0; c + 2 < n; c++) {
                      var s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2]
                          + grid[r + 1][c + 1]
                          + grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2];
                      if (s > best) best = s;
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int maxSum(int[][] grid) {
              int m = grid.length, n = grid[0].length, best = 0;
              for (int r = 0; r + 2 < m; r++) {
                  for (int c = 0; c + 2 < n; c++) {
                      int s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2]
                          + grid[r + 1][c + 1]
                          + grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2];
                      if (s > best) best = s;
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int maxSum(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size(), best = 0;
              for (int r = 0; r + 2 < m; r++) {
                  for (int c = 0; c + 2 < n; c++) {
                      int s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2]
                          + grid[r + 1][c + 1]
                          + grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2];
                      best = max(best, s);
                  }
              }
              return best;
          }
        `,
        c: code`
          int maxSum(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0], best = 0;
              for (int r = 0; r + 2 < m; r++) {
                  for (int c = 0; c + 2 < n; c++) {
                      int s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2]
                          + grid[r + 1][c + 1]
                          + grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2];
                      if (s > best) best = s;
                  }
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaxSum(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length, best = 0;
              for (int r = 0; r + 2 < m; r++)
              {
                  for (int c = 0; c + 2 < n; c++)
                  {
                      int s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2]
                          + grid[r + 1][c + 1]
                          + grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2];
                      if (s > best) best = s;
                  }
              }
              return best;
          }
        `,
        go: code`
          func maxSum(grid [][]int) int {
          	m, n, best := len(grid), len(grid[0]), 0
          	for r := 0; r+2 < m; r++ {
          		for c := 0; c+2 < n; c++ {
          			s := grid[r][c] + grid[r][c+1] + grid[r][c+2] +
          				grid[r+1][c+1] +
          				grid[r+2][c] + grid[r+2][c+1] + grid[r+2][c+2]
          			if s > best {
          				best = s
          			}
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun maxSum(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              var best = 0
              for (r in 0 until m - 2) {
                  for (c in 0 until n - 2) {
                      val s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2] +
                          grid[r + 1][c + 1] +
                          grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2]
                      if (s > best) best = s
                  }
              }
              return best
          }
        `,
        swift: code`
          func maxSum(_ grid: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count
              var best = 0
              for r in 0..<(m - 2) {
                  for c in 0..<(n - 2) {
                      var s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2]
                      s += grid[r + 1][c + 1]
                      s += grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2]
                      if s > best { best = s }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn maxSum(grid: Vec<Vec<i32>>) -> i32 {
              let m = grid.len();
              let n = grid[0].len();
              let mut best = 0;
              for r in 0..m - 2 {
                  for c in 0..n - 2 {
                      let s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2]
                          + grid[r + 1][c + 1]
                          + grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2];
                      if s > best {
                          best = s;
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function maxSum($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $best = 0;
              for ($r = 0; $r + 2 < $m; $r++) {
                  for ($c = 0; $c + 2 < $n; $c++) {
                      $s = $grid[$r][$c] + $grid[$r][$c + 1] + $grid[$r][$c + 2]
                          + $grid[$r + 1][$c + 1]
                          + $grid[$r + 2][$c] + $grid[$r + 2][$c + 1] + $grid[$r + 2][$c + 2];
                      if ($s > $best) $best = $s;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def maxSum(grid)
            m = grid.length
            n = grid[0].length
            best = 0
            (0...(m - 2)).each do |r|
              (0...(n - 2)).each do |c|
                s = grid[r][c] + grid[r][c + 1] + grid[r][c + 2] +
                    grid[r + 1][c + 1] +
                    grid[r + 2][c] + grid[r + 2][c + 1] + grid[r + 2][c + 2]
                best = s if s > best
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Difference of Number of Distinct Values on Diagonals (LC 2711) ──
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      return grid.map((row, r) => row.map((_, c) => {
        const a = new Set<number>(), b = new Set<number>();
        for (let i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) a.add(grid[i][j]);
        for (let i = r + 1, j = c + 1; i < m && j < n; i++, j++) b.add(grid[i][j]);
        return Math.abs(a.size - b.size);
      }));
    };
    return {
      slug: "difference-of-number-of-distinct-values-on-diagonals",
      title: "Difference of Number of Distinct Values on Diagonals",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Matrix", "Amazon", "Microsoft"],
      signature: { funcName: "differenceOfDistinctValues", params: [{ name: "grid", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given an `m x n` matrix `grid`. For a cell `(r, c)` look along its main-direction diagonal (the one running from top-left to bottom-right):\n\n- `leftAbove(r, c)` is the number of **distinct** values in the cells `(r-1, c-1), (r-2, c-2), …` that are inside the grid — strictly above-left of the cell.\n- `rightBelow(r, c)` is the number of **distinct** values in the cells `(r+1, c+1), (r+2, c+2), …` — strictly below-right of the cell.\n\nThe cell itself is counted in neither. Return an `m x n` matrix `answer` with `answer[r][c] = |leftAbove(r, c) - rightBelow(r, c)|`.",
        [
          { in: "grid = [[3,1,2],[4,3,1],[2,4,5]]", out: "[[2,1,0],[1,0,1],[0,1,1]]", note: "For `(0,0)` nothing lies above-left and below-right are 3 and 5, so the answer is `|0 - 2| = 2`. For `(2,2)` the above-left cells hold 3 twice — one distinct value — and nothing lies below-right, giving 1." },
          { in: "grid = [[7]]", out: "[[0]]" },
          { in: "grid = [[4,4],[4,9],[2,4]]", out: "[[1,0],[1,1],[0,1]]" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n, grid[i][j] <= 50"]),
      hints: [
        "Each cell only looks at the cells on its own top-left to bottom-right diagonal.",
        "For a single cell you can walk both directions and collect the values in a set — the grid is at most 50 × 50, so that is fast enough.",
        "For linear time, process each diagonal once: a prefix pass gives the distinct counts above-left, a suffix pass the counts below-right.",
      ],
      editorial: explain({
        idea: "Two cells interact only if they lie on the same diagonal, so the matrix splits into `m + n - 1` independent sequences; on each, answer = |distinct in the prefix before i − distinct in the suffix after i|.",
        steps: [
          "For each cell `(r, c)` walk up-left from `(r-1, c-1)` while inside the grid, marking values in a `seen` table, and count the distinct ones.",
          "Clear the table and do the same walking down-right from `(r+1, c+1)`.",
          "Store the absolute difference of the two counts in `answer[r][c]`.",
        ],
        why: "The walks visit exactly the cells the definition names, and a value table counts each value once no matter how often it repeats, so each entry is computed straight from its definition. Values are at most 50, so a boolean array of size 51 is a perfect set.",
        time: "O(m · n · min(m, n))",
        space: "O(m · n) for the answer",
        pitfalls: [
          "The cell itself belongs to neither side.",
          "It is the number of **distinct** values, not the number of cells — repeats count once.",
          "Only the main-direction diagonal matters; the anti-diagonal is never involved.",
        ],
      }),
      examples: [
        { input: "[[3,1,2],[4,3,1],[2,4,5]]", expectedOutput: "[[2,1,0],[1,0,1],[0,1,1]]" },
        { input: "[[7]]", expectedOutput: "[[0]]" },
        { input: "[[4,4],[4,9],[2,4]]", expectedOutput: "[[1,0],[1,1],[0,1]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [3, 6, 10]));
        const n = ri(rng, 1, pick(rng, [3, 6, 10]));
        const hi = pick(rng, [1, 3, 10, 50]);
        const grid = randGrid(rng, m, n, 1, hi);
        return { input: fmtIntMat(grid), expectedOutput: fmtIntMat(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def differenceOfDistinctValues(grid: List[List[int]]) -> List[List[int]]:
              m, n = len(grid), len(grid[0])
              ans = [[0] * n for _ in range(m)]
              for r in range(m):
                  for c in range(n):
                      above = set()
                      i, j = r - 1, c - 1
                      while i >= 0 and j >= 0:
                          above.add(grid[i][j])
                          i -= 1
                          j -= 1
                      below = set()
                      i, j = r + 1, c + 1
                      while i < m and j < n:
                          below.add(grid[i][j])
                          i += 1
                          j += 1
                      ans[r][c] = abs(len(above) - len(below))
              return ans
        `,
        javascript: code`
          var differenceOfDistinctValues = function(grid) {
              var m = grid.length, n = grid[0].length;
              var ans = [];
              for (var r = 0; r < m; r++) {
                  var row = [];
                  for (var c = 0; c < n; c++) {
                      var seen = new Array(51).fill(false), a = 0, b = 0;
                      for (var i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
                          if (!seen[grid[i][j]]) { seen[grid[i][j]] = true; a++; }
                      }
                      seen = new Array(51).fill(false);
                      for (var i2 = r + 1, j2 = c + 1; i2 < m && j2 < n; i2++, j2++) {
                          if (!seen[grid[i2][j2]]) { seen[grid[i2][j2]] = true; b++; }
                      }
                      row.push(Math.abs(a - b));
                  }
                  ans.push(row);
              }
              return ans;
          };
        `,
        typescript: code`
          function differenceOfDistinctValues(grid: number[][]): number[][] {
              var m = grid.length, n = grid[0].length;
              var ans: number[][] = [];
              for (var r = 0; r < m; r++) {
                  var row: number[] = [];
                  for (var c = 0; c < n; c++) {
                      var seenA: boolean[] = [], seenB: boolean[] = [], a = 0, b = 0;
                      for (var i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
                          if (!seenA[grid[i][j]]) { seenA[grid[i][j]] = true; a++; }
                      }
                      for (var i2 = r + 1, j2 = c + 1; i2 < m && j2 < n; i2++, j2++) {
                          if (!seenB[grid[i2][j2]]) { seenB[grid[i2][j2]] = true; b++; }
                      }
                      row.push(Math.abs(a - b));
                  }
                  ans.push(row);
              }
              return ans;
          }
        `,
        java: code`
          public static int[][] differenceOfDistinctValues(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              int[][] ans = new int[m][n];
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) {
                      boolean[] seenA = new boolean[51], seenB = new boolean[51];
                      int a = 0, b = 0;
                      for (int i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
                          if (!seenA[grid[i][j]]) { seenA[grid[i][j]] = true; a++; }
                      }
                      for (int i = r + 1, j = c + 1; i < m && j < n; i++, j++) {
                          if (!seenB[grid[i][j]]) { seenB[grid[i][j]] = true; b++; }
                      }
                      ans[r][c] = Math.abs(a - b);
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          vector<vector<int>> differenceOfDistinctValues(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              vector<vector<int>> ans(m, vector<int>(n, 0));
              for (int r = 0; r < m; r++) {
                  for (int c = 0; c < n; c++) {
                      bool seenA[51] = { false }, seenB[51] = { false };
                      int a = 0, b = 0;
                      for (int i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
                          if (!seenA[grid[i][j]]) { seenA[grid[i][j]] = true; a++; }
                      }
                      for (int i = r + 1, j = c + 1; i < m && j < n; i++, j++) {
                          if (!seenB[grid[i][j]]) { seenB[grid[i][j]] = true; b++; }
                      }
                      ans[r][c] = abs(a - b);
                  }
              }
              return ans;
          }
        `,
        c: code`
          int** differenceOfDistinctValues(int** grid, int gridSize, int* gridColSize, int* returnSize, int** returnColumnSizes) {
              int m = gridSize, n = gridColSize[0];
              int** ans = (int**)malloc(m * sizeof(int*));
              *returnColumnSizes = (int*)malloc(m * sizeof(int));
              for (int r = 0; r < m; r++) {
                  ans[r] = (int*)malloc(n * sizeof(int));
                  (*returnColumnSizes)[r] = n;
                  for (int c = 0; c < n; c++) {
                      bool seenA[51] = { false }, seenB[51] = { false };
                      int a = 0, b = 0;
                      for (int i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
                          if (!seenA[grid[i][j]]) { seenA[grid[i][j]] = true; a++; }
                      }
                      for (int i = r + 1, j = c + 1; i < m && j < n; i++, j++) {
                          if (!seenB[grid[i][j]]) { seenB[grid[i][j]] = true; b++; }
                      }
                      ans[r][c] = a > b ? a - b : b - a;
                  }
              }
              *returnSize = m;
              return ans;
          }
        `,
        csharp: code`
          public static int[][] DifferenceOfDistinctValues(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              var ans = new int[m][];
              for (int r = 0; r < m; r++)
              {
                  ans[r] = new int[n];
                  for (int c = 0; c < n; c++)
                  {
                      var seenA = new bool[51];
                      var seenB = new bool[51];
                      int a = 0, b = 0;
                      for (int i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--)
                      {
                          if (!seenA[grid[i][j]]) { seenA[grid[i][j]] = true; a++; }
                      }
                      for (int i = r + 1, j = c + 1; i < m && j < n; i++, j++)
                      {
                          if (!seenB[grid[i][j]]) { seenB[grid[i][j]] = true; b++; }
                      }
                      ans[r][c] = Math.Abs(a - b);
                  }
              }
              return ans;
          }
        `,
        go: code`
          func differenceOfDistinctValues(grid [][]int) [][]int {
          	m, n := len(grid), len(grid[0])
          	ans := make([][]int, m)
          	for r := 0; r < m; r++ {
          		ans[r] = make([]int, n)
          		for c := 0; c < n; c++ {
          			var seenA, seenB [51]bool
          			a, b := 0, 0
          			for i, j := r-1, c-1; i >= 0 && j >= 0; i, j = i-1, j-1 {
          				if !seenA[grid[i][j]] {
          					seenA[grid[i][j]] = true
          					a++
          				}
          			}
          			for i, j := r+1, c+1; i < m && j < n; i, j = i+1, j+1 {
          				if !seenB[grid[i][j]] {
          					seenB[grid[i][j]] = true
          					b++
          				}
          			}
          			if a > b {
          				ans[r][c] = a - b
          			} else {
          				ans[r][c] = b - a
          			}
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun differenceOfDistinctValues(grid: Array<IntArray>): Array<IntArray> {
              val m = grid.size
              val n = grid[0].size
              val ans = Array(m) { IntArray(n) }
              for (r in 0 until m) {
                  for (c in 0 until n) {
                      val seenA = BooleanArray(51)
                      val seenB = BooleanArray(51)
                      var a = 0
                      var b = 0
                      var i = r - 1
                      var j = c - 1
                      while (i >= 0 && j >= 0) {
                          if (!seenA[grid[i][j]]) { seenA[grid[i][j]] = true; a++ }
                          i--; j--
                      }
                      i = r + 1
                      j = c + 1
                      while (i < m && j < n) {
                          if (!seenB[grid[i][j]]) { seenB[grid[i][j]] = true; b++ }
                          i++; j++
                      }
                      ans[r][c] = Math.abs(a - b)
                  }
              }
              return ans
          }
        `,
        swift: code`
          func differenceOfDistinctValues(_ grid: [[Int]]) -> [[Int]] {
              let m = grid.count, n = grid[0].count
              var ans = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)
              for r in 0..<m {
                  for c in 0..<n {
                      var seenA = [Bool](repeating: false, count: 51)
                      var seenB = [Bool](repeating: false, count: 51)
                      var a = 0, b = 0
                      var i = r - 1, j = c - 1
                      while i >= 0 && j >= 0 {
                          if !seenA[grid[i][j]] { seenA[grid[i][j]] = true; a += 1 }
                          i -= 1; j -= 1
                      }
                      i = r + 1; j = c + 1
                      while i < m && j < n {
                          if !seenB[grid[i][j]] { seenB[grid[i][j]] = true; b += 1 }
                          i += 1; j += 1
                      }
                      ans[r][c] = abs(a - b)
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn differenceOfDistinctValues(grid: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let m = grid.len();
              let n = grid[0].len();
              let mut ans = vec![vec![0i32; n]; m];
              for r in 0..m {
                  for c in 0..n {
                      let mut seen_a = [false; 51];
                      let mut seen_b = [false; 51];
                      let mut a = 0i32;
                      let mut b = 0i32;
                      let (mut i, mut j) = (r, c);
                      while i > 0 && j > 0 {
                          i -= 1;
                          j -= 1;
                          let v = grid[i][j] as usize;
                          if !seen_a[v] {
                              seen_a[v] = true;
                              a += 1;
                          }
                      }
                      let (mut i, mut j) = (r + 1, c + 1);
                      while i < m && j < n {
                          let v = grid[i][j] as usize;
                          if !seen_b[v] {
                              seen_b[v] = true;
                              b += 1;
                          }
                          i += 1;
                          j += 1;
                      }
                      ans[r][c] = (a - b).abs();
                  }
              }
              ans
          }
        `,
        php: code`
          function differenceOfDistinctValues($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $ans = [];
              for ($r = 0; $r < $m; $r++) {
                  $row = [];
                  for ($c = 0; $c < $n; $c++) {
                      $above = [];
                      for ($i = $r - 1, $j = $c - 1; $i >= 0 && $j >= 0; $i--, $j--) $above[$grid[$i][$j]] = true;
                      $below = [];
                      for ($i = $r + 1, $j = $c + 1; $i < $m && $j < $n; $i++, $j++) $below[$grid[$i][$j]] = true;
                      $row[] = abs(count($above) - count($below));
                  }
                  $ans[] = $row;
              }
              return $ans;
          }
        `,
        ruby: code`
          def differenceOfDistinctValues(grid)
            m = grid.length
            n = grid[0].length
            Array.new(m) do |r|
              Array.new(n) do |c|
                above = {}
                i = r - 1
                j = c - 1
                while i >= 0 && j >= 0
                  above[grid[i][j]] = true
                  i -= 1
                  j -= 1
                end
                below = {}
                i = r + 1
                j = c + 1
                while i < m && j < n
                  below[grid[i][j]] = true
                  i += 1
                  j += 1
                end
                (above.size - below.size).abs
              end
            end
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Write the Letter Y on a Grid (LC 3071) ──
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length, h = (n - 1) / 2;
      const inY = (r: number, c: number) => (r <= h && (c === r || c === n - 1 - r)) || (r >= h && c === h);
      let best = Infinity;
      for (let a = 0; a < 3; a++) {
        for (let b = 0; b < 3; b++) {
          if (a === b) continue;
          let ops = 0;
          for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            if (inY(r, c) ? grid[r][c] !== a : grid[r][c] !== b) ops++;
          }
          best = Math.min(best, ops);
        }
      }
      return best;
    };
    return {
      slug: "minimum-operations-to-write-the-letter-y-on-a-grid",
      title: "Minimum Operations to Write the Letter Y on a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Matrix", "Counting", "Amazon", "Google"],
      signature: { funcName: "minimumOperationsToWriteY", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`grid` is an `n x n` matrix with **odd** `n` whose cells hold `0`, `1` or `2`. The **letter Y** consists of these cells:\n\n- the diagonal from the top-left corner down to the centre,\n- the diagonal from the top-right corner down to the centre,\n- the vertical line from the centre down to the bottom edge.\n\nThe Y is **written** on the grid when every Y cell holds the same value, every non-Y cell holds the same value, and those two values are different.\n\nOne operation changes any cell to `0`, `1` or `2`. Return the minimum number of operations needed to write the letter Y.",
        [
          { in: "grid = [[1,2,2],[1,1,0],[0,1,0]]", out: "3", note: "The Y cells are `(0,0)`, `(0,2)`, `(1,1)`, `(2,1)`. Making them all 1 and every other cell 0 changes `(0,2)`, `(0,1)` and `(1,0)`." },
          { in: "grid = [[0,0,0],[0,0,0],[0,0,0]]", out: "4", note: "Repainting the four Y cells is cheaper than repainting the five background cells." },
          { in: "grid = [[2,0,2],[0,2,0],[0,2,0]]", out: "0", note: "The Y already reads 2 on a background of 0." },
        ],
        ["3 <= n <= 49", "n == grid.length == grid[i].length", "0 <= grid[i][j] <= 2", "n is odd."]),
      hints: [
        "Only six (Y value, background value) pairs are possible, since the two must differ.",
        "For a fixed pair, the cost is the number of Y cells not already holding the Y value plus the background cells not holding the background value.",
        "Count how many Y cells and how many background cells hold each value once, then evaluate all six pairs from the counts.",
      ],
      editorial: explain({
        idea: "Choose the Y value `a` and background value `b` (`a ≠ b`); with the counts of each value inside and outside the Y, the cost of every choice is immediate.",
        steps: [
          "Let `h = (n - 1) / 2`. A cell `(r, c)` is on the Y when `r <= h` and `c == r` or `c == n - 1 - r`, or when `r >= h` and `c == h`.",
          "Count `inY[v]` and `outY[v]` for `v = 0, 1, 2`, and the totals `Ysize` and `restSize`.",
          "For each pair `a ≠ b`, the cost is `(Ysize - inY[a]) + (restSize - outY[b])`; return the minimum.",
        ],
        why: "Each cell is changed independently and at most once, and a cell needs changing exactly when it does not hold its target value. Trying every valid pair of targets therefore covers every possible final picture.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "The centre cell belongs to all three strokes — count it once.",
          "The Y value and the background value must be different; `a == b` is not allowed even if cheaper.",
          "The lower stroke runs from the centre down only, never up.",
        ],
      }),
      examples: [
        { input: "[[1,2,2],[1,1,0],[0,1,0]]", expectedOutput: "3" },
        { input: "[[0,0,0],[0,0,0],[0,0,0]]", expectedOutput: "4" },
        { input: "[[2,0,2],[0,2,0],[0,2,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [3, 3, 5, 5, 7, 9, 11, 13]);
        const mode = ri(rng, 0, 3);
        let grid: number[][];
        if (mode === 0) {
          // a written Y with a little noise
          const a = ri(rng, 0, 2);
          let b = ri(rng, 0, 2);
          if (b === a) b = (a + 1) % 3;
          const h = (n - 1) / 2;
          grid = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => {
            const y = (r <= h && (c === r || c === n - 1 - r)) || (r >= h && c === h);
            return rng() < 0.15 ? ri(rng, 0, 2) : (y ? a : b);
          }));
        } else if (mode === 1) {
          const v = ri(rng, 0, 2);
          grid = randGrid(rng, n, n, v, v);
        } else {
          grid = randGrid(rng, n, n, 0, 2);
        }
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumOperationsToWriteY(grid: List[List[int]]) -> int:
              n = len(grid)
              h = n // 2
              in_y = [0, 0, 0]
              out_y = [0, 0, 0]
              for r in range(n):
                  for c in range(n):
                      if (r <= h and (c == r or c == n - 1 - r)) or (r >= h and c == h):
                          in_y[grid[r][c]] += 1
                      else:
                          out_y[grid[r][c]] += 1
              y_size = sum(in_y)
              rest = sum(out_y)
              best = n * n
              for a in range(3):
                  for b in range(3):
                      if a != b:
                          best = min(best, y_size - in_y[a] + rest - out_y[b])
              return best
        `,
        javascript: code`
          var minimumOperationsToWriteY = function(grid) {
              var n = grid.length, h = (n - 1) / 2;
              var inY = [0, 0, 0], outY = [0, 0, 0];
              for (var r = 0; r < n; r++) {
                  for (var c = 0; c < n; c++) {
                      if ((r <= h && (c === r || c === n - 1 - r)) || (r >= h && c === h)) inY[grid[r][c]]++;
                      else outY[grid[r][c]]++;
                  }
              }
              var ySize = inY[0] + inY[1] + inY[2], rest = outY[0] + outY[1] + outY[2];
              var best = n * n;
              for (var a = 0; a < 3; a++) {
                  for (var b = 0; b < 3; b++) {
                      if (a !== b) best = Math.min(best, ySize - inY[a] + rest - outY[b]);
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function minimumOperationsToWriteY(grid: number[][]): number {
              var n = grid.length, h = (n - 1) / 2;
              var inY = [0, 0, 0], outY = [0, 0, 0];
              for (var r = 0; r < n; r++) {
                  for (var c = 0; c < n; c++) {
                      if ((r <= h && (c === r || c === n - 1 - r)) || (r >= h && c === h)) inY[grid[r][c]]++;
                      else outY[grid[r][c]]++;
                  }
              }
              var ySize = inY[0] + inY[1] + inY[2], rest = outY[0] + outY[1] + outY[2];
              var best = n * n;
              for (var a = 0; a < 3; a++) {
                  for (var b = 0; b < 3; b++) {
                      if (a !== b) best = Math.min(best, ySize - inY[a] + rest - outY[b]);
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int minimumOperationsToWriteY(int[][] grid) {
              int n = grid.length, h = n / 2;
              int[] inY = new int[3], outY = new int[3];
              for (int r = 0; r < n; r++) {
                  for (int c = 0; c < n; c++) {
                      if ((r <= h && (c == r || c == n - 1 - r)) || (r >= h && c == h)) inY[grid[r][c]]++;
                      else outY[grid[r][c]]++;
                  }
              }
              int ySize = inY[0] + inY[1] + inY[2], rest = outY[0] + outY[1] + outY[2];
              int best = n * n;
              for (int a = 0; a < 3; a++)
                  for (int b = 0; b < 3; b++)
                      if (a != b) best = Math.min(best, ySize - inY[a] + rest - outY[b]);
              return best;
          }
        `,
        cpp: code`
          int minimumOperationsToWriteY(vector<vector<int>>& grid) {
              int n = grid.size(), h = n / 2;
              int inY[3] = {0, 0, 0}, outY[3] = {0, 0, 0};
              for (int r = 0; r < n; r++) {
                  for (int c = 0; c < n; c++) {
                      if ((r <= h && (c == r || c == n - 1 - r)) || (r >= h && c == h)) inY[grid[r][c]]++;
                      else outY[grid[r][c]]++;
                  }
              }
              int ySize = inY[0] + inY[1] + inY[2], rest = outY[0] + outY[1] + outY[2];
              int best = n * n;
              for (int a = 0; a < 3; a++)
                  for (int b = 0; b < 3; b++)
                      if (a != b) best = min(best, ySize - inY[a] + rest - outY[b]);
              return best;
          }
        `,
        c: code`
          int minimumOperationsToWriteY(int** grid, int gridSize, int* gridColSize) {
              int n = gridSize, h = n / 2;
              int inY[3] = {0, 0, 0}, outY[3] = {0, 0, 0};
              for (int r = 0; r < n; r++) {
                  for (int c = 0; c < n; c++) {
                      if ((r <= h && (c == r || c == n - 1 - r)) || (r >= h && c == h)) inY[grid[r][c]]++;
                      else outY[grid[r][c]]++;
                  }
              }
              int ySize = inY[0] + inY[1] + inY[2], rest = outY[0] + outY[1] + outY[2];
              int best = n * n;
              for (int a = 0; a < 3; a++)
                  for (int b = 0; b < 3; b++)
                      if (a != b && ySize - inY[a] + rest - outY[b] < best) best = ySize - inY[a] + rest - outY[b];
              return best;
          }
        `,
        csharp: code`
          public static int MinimumOperationsToWriteY(int[][] grid)
          {
              int n = grid.Length, h = n / 2;
              int[] inY = new int[3], outY = new int[3];
              for (int r = 0; r < n; r++)
              {
                  for (int c = 0; c < n; c++)
                  {
                      if ((r <= h && (c == r || c == n - 1 - r)) || (r >= h && c == h)) inY[grid[r][c]]++;
                      else outY[grid[r][c]]++;
                  }
              }
              int ySize = inY[0] + inY[1] + inY[2], rest = outY[0] + outY[1] + outY[2];
              int best = n * n;
              for (int a = 0; a < 3; a++)
                  for (int b = 0; b < 3; b++)
                      if (a != b) best = Math.Min(best, ySize - inY[a] + rest - outY[b]);
              return best;
          }
        `,
        go: code`
          func minimumOperationsToWriteY(grid [][]int) int {
          	n := len(grid)
          	h := n / 2
          	inY := [3]int{}
          	outY := [3]int{}
          	for r := 0; r < n; r++ {
          		for c := 0; c < n; c++ {
          			if (r <= h && (c == r || c == n-1-r)) || (r >= h && c == h) {
          				inY[grid[r][c]]++
          			} else {
          				outY[grid[r][c]]++
          			}
          		}
          	}
          	ySize := inY[0] + inY[1] + inY[2]
          	rest := outY[0] + outY[1] + outY[2]
          	best := n * n
          	for a := 0; a < 3; a++ {
          		for b := 0; b < 3; b++ {
          			if a != b && ySize-inY[a]+rest-outY[b] < best {
          				best = ySize - inY[a] + rest - outY[b]
          			}
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minimumOperationsToWriteY(grid: Array<IntArray>): Int {
              val n = grid.size
              val h = n / 2
              val inY = IntArray(3)
              val outY = IntArray(3)
              for (r in 0 until n) {
                  for (c in 0 until n) {
                      if ((r <= h && (c == r || c == n - 1 - r)) || (r >= h && c == h)) inY[grid[r][c]]++
                      else outY[grid[r][c]]++
                  }
              }
              val ySize = inY.sum()
              val rest = outY.sum()
              var best = n * n
              for (a in 0 until 3) for (b in 0 until 3) {
                  if (a != b) best = minOf(best, ySize - inY[a] + rest - outY[b])
              }
              return best
          }
        `,
        swift: code`
          func minimumOperationsToWriteY(_ grid: [[Int]]) -> Int {
              let n = grid.count, h = n / 2
              var inY = [0, 0, 0], outY = [0, 0, 0]
              for r in 0..<n {
                  for c in 0..<n {
                      if (r <= h && (c == r || c == n - 1 - r)) || (r >= h && c == h) {
                          inY[grid[r][c]] += 1
                      } else {
                          outY[grid[r][c]] += 1
                      }
                  }
              }
              let ySize = inY[0] + inY[1] + inY[2], rest = outY[0] + outY[1] + outY[2]
              var best = n * n
              for a in 0..<3 {
                  for b in 0..<3 where a != b {
                      best = min(best, ySize - inY[a] + rest - outY[b])
                  }
              }
              return best
          }
        `,
        rust: code`
          fn minimumOperationsToWriteY(grid: Vec<Vec<i32>>) -> i32 {
              let n = grid.len();
              let h = n / 2;
              let mut in_y = [0i32; 3];
              let mut out_y = [0i32; 3];
              for r in 0..n {
                  for c in 0..n {
                      let v = grid[r][c] as usize;
                      if (r <= h && (c == r || c == n - 1 - r)) || (r >= h && c == h) {
                          in_y[v] += 1;
                      } else {
                          out_y[v] += 1;
                      }
                  }
              }
              let y_size = in_y[0] + in_y[1] + in_y[2];
              let rest = out_y[0] + out_y[1] + out_y[2];
              let mut best = (n * n) as i32;
              for a in 0..3 {
                  for b in 0..3 {
                      if a != b {
                          best = best.min(y_size - in_y[a] + rest - out_y[b]);
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function minimumOperationsToWriteY($grid) {
              $n = count($grid);
              $h = intdiv($n, 2);
              $inY = [0, 0, 0];
              $outY = [0, 0, 0];
              for ($r = 0; $r < $n; $r++) {
                  for ($c = 0; $c < $n; $c++) {
                      if (($r <= $h && ($c == $r || $c == $n - 1 - $r)) || ($r >= $h && $c == $h)) $inY[$grid[$r][$c]]++;
                      else $outY[$grid[$r][$c]]++;
                  }
              }
              $ySize = array_sum($inY);
              $rest = array_sum($outY);
              $best = $n * $n;
              for ($a = 0; $a < 3; $a++)
                  for ($b = 0; $b < 3; $b++)
                      if ($a != $b) $best = min($best, $ySize - $inY[$a] + $rest - $outY[$b]);
              return $best;
          }
        `,
        ruby: code`
          def minimumOperationsToWriteY(grid)
            n = grid.length
            h = n / 2
            in_y = [0, 0, 0]
            out_y = [0, 0, 0]
            n.times do |r|
              n.times do |c|
                if (r <= h && (c == r || c == n - 1 - r)) || (r >= h && c == h)
                  in_y[grid[r][c]] += 1
                else
                  out_y[grid[r][c]] += 1
                end
              end
            end
            y_size = in_y.sum
            rest = out_y.sum
            best = n * n
            3.times do |a|
              3.times do |b|
                next if a == b
                cost = y_size - in_y[a] + rest - out_y[b]
                best = cost if cost < best
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Max Sum of Rectangle No Larger Than K (LC 363) ──────────────
  (() => {
    /** Every sub-rectangle's sum, by 2D prefix sums (grids here are at most 8 × 8). */
    const rectSums = (mat: number[][]) => {
      const m = mat.length, n = mat[0].length;
      const p = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) p[i + 1][j + 1] = mat[i][j] + p[i][j + 1] + p[i + 1][j] - p[i][j];
      const out: number[] = [];
      for (let r1 = 0; r1 < m; r1++) for (let r2 = r1; r2 < m; r2++) {
        for (let c1 = 0; c1 < n; c1++) for (let c2 = c1; c2 < n; c2++) {
          out.push(p[r2 + 1][c2 + 1] - p[r1][c2 + 1] - p[r2 + 1][c1] + p[r1][c1]);
        }
      }
      return out;
    };
    const ref = (mat: number[][], k: number) => {
      let best = -Infinity;
      for (const s of rectSums(mat)) if (s <= k && s > best) best = s;
      return best;
    };
    return {
      slug: "max-sum-of-rectangle-no-larger-than-k",
      title: "Max Sum of Rectangle No Larger Than K",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Matrix", "Ordered Set", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "maxSumSubmatrix", params: [{ name: "matrix", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an `m x n` integer matrix `matrix` and an integer `k`, consider every non-empty axis-aligned rectangle of cells inside the matrix. Return the **largest** rectangle sum that is **no larger than** `k`.\n\nThe input guarantees that at least one rectangle has a sum `<= k`.",
        [
          { in: "matrix = [[2,-1,3],[-4,5,1]], k = 4", out: "4", note: "The whole first row sums to 2 - 1 + 3 = 4, the largest value allowed. The column `[3,1]` sums to 4 as well." },
          { in: "matrix = [[3,3,-1]], k = 5", out: "5", note: "`[3,3,-1]` sums to 5; `[3,3]` sums to 6, which is too large." },
          { in: "matrix = [[5,-2],[-1,4]], k = 0", out: "-1" },
        ],
        ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 100", "-100 <= matrix[i][j] <= 100", "-10^5 <= k <= 10^5"],
        "What if the number of rows is much larger than the number of columns?"),
      hints: [
        "Fix a top row and a bottom row. Squashing the band between them into one array of column sums turns the problem into a 1D one.",
        "In 1D: the sum of `cols[i+1..j]` is `prefix[j] - prefix[i]`. You want the largest such difference that is `<= k`.",
        "Scan the prefixes left to right and keep the earlier ones in a sorted structure; for `prefix[j]`, the best partner is the smallest earlier prefix that is `>= prefix[j] - k`.",
      ],
      editorial: explain({
        idea: "Reduce to 1D by fixing the row band, then answer \"max subarray sum `<= k`\" with prefix sums and an ordered set — the smallest earlier prefix that is at least `prefix - k` gives the best subarray ending here.",
        steps: [
          "For every pair of rows `top <= bottom`, maintain `cols[c]` = the sum of column `c` between them (add row `bottom` as it grows).",
          "Start a sorted set holding the empty prefix `0` and a running prefix `p = 0`.",
          "For each column, add `cols[c]` to `p`; find the smallest `q` in the set with `q >= p - k`. If it exists, `p - q` is a candidate — keep the maximum.",
          "Insert `p` into the set and continue. Stop early if the answer ever equals `k`.",
        ],
        why: "Every rectangle is a row band plus a column range, and every column range's sum is a difference of two prefixes of the band's column sums. For a fixed right end the difference `p - q` is largest when `q` is smallest, subject to `p - q <= k`, i.e. `q >= p - k` — exactly the ceiling query. So every rectangle is considered implicitly and the best valid one is found.",
        time: "O(m² · n log n)",
        space: "O(n)",
        pitfalls: [
          "Kadane's algorithm finds the maximum subarray but cannot respect the `<= k` cap — the ordered-set search is what handles it.",
          "Seed the set with `0`, or subarrays that start at the first column are missed.",
          "The answer can be negative; do not initialise the best value with 0.",
        ],
      }),
      examples: [
        { input: "[[2,-1,3],[-4,5,1]]\n4", expectedOutput: "4" },
        { input: "[[3,3,-1]]\n5", expectedOutput: "5" },
        { input: "[[5,-2],[-1,4]]\n0", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 8]));
        const n = ri(rng, 1, pick(rng, [1, 3, 8]));
        const [lo, hi] = pick(rng, [[-100, 100], [-5, 5], [0, 100], [-100, 0], [-20, 30]]);
        const mat = randGrid(rng, m, n, lo, hi);
        const sums = rectSums(mat);
        let mn = Infinity, mx = -Infinity;
        for (const s of sums) { if (s < mn) mn = s; if (s > mx) mx = s; }
        const mode = ri(rng, 0, 4);
        let k = mode === 0 ? pick(rng, sums)
          : mode === 1 ? pick(rng, sums) + ri(rng, -3, 3)
          : mode === 2 ? ri(rng, mn, mx + 10)
          : mode === 3 ? 100000 : mn;
        k = Math.min(100000, Math.max(k, mn));
        return { input: `${fmtIntMat(mat)}\n${k}`, expectedOutput: String(ref(mat, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def maxSumSubmatrix(matrix: List[List[int]], k: int) -> int:
              m, n = len(matrix), len(matrix[0])
              best = None
              for top in range(m):
                  cols = [0] * n
                  for bottom in range(top, m):
                      row = matrix[bottom]
                      for c in range(n):
                          cols[c] += row[c]
                      seen = [0]
                      prefix = 0
                      for v in cols:
                          prefix += v
                          i = bisect.bisect_left(seen, prefix - k)
                          if i < len(seen):
                              cand = prefix - seen[i]
                              if best is None or cand > best:
                                  best = cand
                          bisect.insort(seen, prefix)
                      if best == k:
                          return k
              return best
        `,
        javascript: code`
          var maxSumSubmatrix = function(matrix, k) {
              var m = matrix.length, n = matrix[0].length, best = -Infinity;
              var lowerBound = function(a, x) {
                  var lo = 0, hi = a.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (a[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              };
              for (var top = 0; top < m; top++) {
                  var cols = new Array(n).fill(0);
                  for (var bottom = top; bottom < m; bottom++) {
                      for (var c = 0; c < n; c++) cols[c] += matrix[bottom][c];
                      var seen = [0], prefix = 0;
                      for (var j = 0; j < n; j++) {
                          prefix += cols[j];
                          var i = lowerBound(seen, prefix - k);
                          if (i < seen.length && prefix - seen[i] > best) best = prefix - seen[i];
                          seen.splice(lowerBound(seen, prefix), 0, prefix);
                      }
                      if (best === k) return k;
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function lowerBound363(a: number[], x: number): number {
              var lo = 0, hi = a.length;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          function maxSumSubmatrix(matrix: number[][], k: number): number {
              var m = matrix.length, n = matrix[0].length, best = -Infinity;
              for (var top = 0; top < m; top++) {
                  var cols: number[] = [];
                  for (var c0 = 0; c0 < n; c0++) cols.push(0);
                  for (var bottom = top; bottom < m; bottom++) {
                      for (var c = 0; c < n; c++) cols[c] += matrix[bottom][c];
                      var seen: number[] = [0], prefix = 0;
                      for (var j = 0; j < n; j++) {
                          prefix += cols[j];
                          var i = lowerBound363(seen, prefix - k);
                          if (i < seen.length && prefix - seen[i] > best) best = prefix - seen[i];
                          seen.splice(lowerBound363(seen, prefix), 0, prefix);
                      }
                      if (best === k) return k;
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int maxSumSubmatrix(int[][] matrix, int k) {
              int m = matrix.length, n = matrix[0].length;
              int best = Integer.MIN_VALUE;
              for (int top = 0; top < m; top++) {
                  int[] cols = new int[n];
                  for (int bottom = top; bottom < m; bottom++) {
                      for (int c = 0; c < n; c++) cols[c] += matrix[bottom][c];
                      TreeSet<Integer> seen = new TreeSet<>();
                      seen.add(0);
                      int prefix = 0;
                      for (int c = 0; c < n; c++) {
                          prefix += cols[c];
                          Integer q = seen.ceiling(prefix - k);
                          if (q != null) best = Math.max(best, prefix - q);
                          seen.add(prefix);
                      }
                      if (best == k) return k;
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int maxSumSubmatrix(vector<vector<int>>& matrix, int k) {
              int m = matrix.size(), n = matrix[0].size();
              int best = INT_MIN;
              for (int top = 0; top < m; top++) {
                  vector<int> cols(n, 0);
                  for (int bottom = top; bottom < m; bottom++) {
                      for (int c = 0; c < n; c++) cols[c] += matrix[bottom][c];
                      set<int> seen;
                      seen.insert(0);
                      int prefix = 0;
                      for (int c = 0; c < n; c++) {
                          prefix += cols[c];
                          auto it = seen.lower_bound(prefix - k);
                          if (it != seen.end()) best = max(best, prefix - *it);
                          seen.insert(prefix);
                      }
                      if (best == k) return k;
                  }
              }
              return best;
          }
        `,
        c: code`
          int maxSumSubmatrix(int** matrix, int matrixSize, int* matrixColSize, int k) {
              int m = matrixSize, n = matrixColSize[0];
              int best = -2147483647 - 1;
              int* cols = (int*)malloc(n * sizeof(int));
              int* seen = (int*)malloc((n + 1) * sizeof(int));
              for (int top = 0; top < m; top++) {
                  for (int c = 0; c < n; c++) cols[c] = 0;
                  for (int bottom = top; bottom < m; bottom++) {
                      for (int c = 0; c < n; c++) cols[c] += matrix[bottom][c];
                      int cnt = 1, prefix = 0;
                      seen[0] = 0;
                      for (int c = 0; c < n; c++) {
                          prefix += cols[c];
                          int lo = 0, hi = cnt, target = prefix - k;
                          while (lo < hi) { int mid = (lo + hi) / 2; if (seen[mid] < target) lo = mid + 1; else hi = mid; }
                          if (lo < cnt && prefix - seen[lo] > best) best = prefix - seen[lo];
                          lo = 0; hi = cnt;
                          while (lo < hi) { int mid = (lo + hi) / 2; if (seen[mid] < prefix) lo = mid + 1; else hi = mid; }
                          memmove(seen + lo + 1, seen + lo, (cnt - lo) * sizeof(int));
                          seen[lo] = prefix;
                          cnt++;
                      }
                  }
              }
              free(cols);
              free(seen);
              return best;
          }
        `,
        csharp: code`
          public static int MaxSumSubmatrix(int[][] matrix, int k)
          {
              int m = matrix.Length, n = matrix[0].Length;
              int best = int.MinValue;
              for (int top = 0; top < m; top++)
              {
                  var cols = new int[n];
                  for (int bottom = top; bottom < m; bottom++)
                  {
                      for (int c = 0; c < n; c++) cols[c] += matrix[bottom][c];
                      var seen = new List<int> { 0 };
                      int prefix = 0;
                      for (int c = 0; c < n; c++)
                      {
                          prefix += cols[c];
                          int i = LowerBound363(seen, prefix - k);
                          if (i < seen.Count) best = Math.Max(best, prefix - seen[i]);
                          seen.Insert(LowerBound363(seen, prefix), prefix);
                      }
                      if (best == k) return k;
                  }
              }
              return best;
          }

          private static int LowerBound363(List<int> a, int x)
          {
              int lo = 0, hi = a.Count;
              while (lo < hi)
              {
                  int mid = (lo + hi) / 2;
                  if (a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }
        `,
        go: code`
          func maxSumSubmatrix(matrix [][]int, k int) int {
          	m, n := len(matrix), len(matrix[0])
          	best := -1 << 31
          	for top := 0; top < m; top++ {
          		cols := make([]int, n)
          		for bottom := top; bottom < m; bottom++ {
          			for c := 0; c < n; c++ {
          				cols[c] += matrix[bottom][c]
          			}
          			seen := []int{0}
          			prefix := 0
          			for c := 0; c < n; c++ {
          				prefix += cols[c]
          				i := sort.SearchInts(seen, prefix-k)
          				if i < len(seen) && prefix-seen[i] > best {
          					best = prefix - seen[i]
          				}
          				j := sort.SearchInts(seen, prefix)
          				seen = append(seen, 0)
          				copy(seen[j+1:], seen[j:])
          				seen[j] = prefix
          			}
          			if best == k {
          				return k
          			}
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun maxSumSubmatrix(matrix: Array<IntArray>, k: Int): Int {
              val m = matrix.size
              val n = matrix[0].size
              var best = Int.MIN_VALUE
              for (top in 0 until m) {
                  val cols = IntArray(n)
                  for (bottom in top until m) {
                      for (c in 0 until n) cols[c] += matrix[bottom][c]
                      val seen = java.util.TreeSet<Int>()
                      seen.add(0)
                      var prefix = 0
                      for (c in 0 until n) {
                          prefix += cols[c]
                          val q = seen.ceiling(prefix - k)
                          if (q != null && prefix - q > best) best = prefix - q
                          seen.add(prefix)
                      }
                      if (best == k) return k
                  }
              }
              return best
          }
        `,
        swift: code`
          func lowerBound363(_ a: [Int], _ x: Int) -> Int {
              var lo = 0, hi = a.count
              while lo < hi {
                  let mid = (lo + hi) / 2
                  if a[mid] < x { lo = mid + 1 } else { hi = mid }
              }
              return lo
          }

          func maxSumSubmatrix(_ matrix: [[Int]], _ k: Int) -> Int {
              let m = matrix.count, n = matrix[0].count
              var best = Int.min
              for top in 0..<m {
                  var cols = [Int](repeating: 0, count: n)
                  for bottom in top..<m {
                      for c in 0..<n { cols[c] += matrix[bottom][c] }
                      var seen = [0]
                      var prefix = 0
                      for c in 0..<n {
                          prefix += cols[c]
                          let i = lowerBound363(seen, prefix - k)
                          if i < seen.count && prefix - seen[i] > best { best = prefix - seen[i] }
                          seen.insert(prefix, at: lowerBound363(seen, prefix))
                      }
                      if best == k { return k }
                  }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::BTreeSet;

          fn maxSumSubmatrix(matrix: Vec<Vec<i32>>, k: i32) -> i32 {
              let m = matrix.len();
              let n = matrix[0].len();
              let mut best = std::i32::MIN;
              for top in 0..m {
                  let mut cols = vec![0i32; n];
                  for bottom in top..m {
                      for c in 0..n {
                          cols[c] += matrix[bottom][c];
                      }
                      let mut seen: BTreeSet<i32> = BTreeSet::new();
                      seen.insert(0);
                      let mut prefix = 0i32;
                      for c in 0..n {
                          prefix += cols[c];
                          if let Some(&q) = seen.range((prefix - k)..).next() {
                              if prefix - q > best {
                                  best = prefix - q;
                              }
                          }
                          seen.insert(prefix);
                      }
                      if best == k {
                          return k;
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function lowerBound363($a, $x) {
              $lo = 0;
              $hi = count($a);
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  if ($a[$mid] < $x) $lo = $mid + 1; else $hi = $mid;
              }
              return $lo;
          }

          function maxSumSubmatrix($matrix, $k) {
              $m = count($matrix);
              $n = count($matrix[0]);
              $best = PHP_INT_MIN;
              for ($top = 0; $top < $m; $top++) {
                  $cols = array_fill(0, $n, 0);
                  for ($bottom = $top; $bottom < $m; $bottom++) {
                      for ($c = 0; $c < $n; $c++) $cols[$c] += $matrix[$bottom][$c];
                      $seen = [0];
                      $prefix = 0;
                      for ($c = 0; $c < $n; $c++) {
                          $prefix += $cols[$c];
                          $i = lowerBound363($seen, $prefix - $k);
                          if ($i < count($seen) && $prefix - $seen[$i] > $best) $best = $prefix - $seen[$i];
                          array_splice($seen, lowerBound363($seen, $prefix), 0, [$prefix]);
                      }
                      if ($best == $k) return $k;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def maxSumSubmatrix(matrix, k)
            m = matrix.length
            n = matrix[0].length
            best = nil
            m.times do |top|
              cols = Array.new(n, 0)
              (top...m).each do |bottom|
                row = matrix[bottom]
                n.times { |c| cols[c] += row[c] }
                seen = [0]
                prefix = 0
                cols.each do |v|
                  prefix += v
                  i = seen.bsearch_index { |q| q >= prefix - k }
                  if i
                    cand = prefix - seen[i]
                    best = cand if best.nil? || cand > best
                  end
                  j = seen.bsearch_index { |q| q >= prefix } || seen.length
                  seen.insert(j, prefix)
                end
                return k if best == k
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Maximum Non Negative Product in a Matrix (LC 1594) ──────────
  (() => {
    const MODB = BigInt(1000000007);
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      let best: bigint | null = null;
      if (m + n <= 14) {
        // few enough paths (at most C(12, 6) = 924) to enumerate every one
        const walk = (i: number, j: number, p: bigint) => {
          const q = p * BigInt(grid[i][j]);
          if (i === m - 1 && j === n - 1) {
            if (best === null || q > best) best = q;
            return;
          }
          if (i + 1 < m) walk(i + 1, j, q);
          if (j + 1 < n) walk(i, j + 1, q);
        };
        walk(0, 0, BigInt(1));
      } else {
        // exact max/min products with arbitrary precision
        const hi: bigint[][] = [], lo: bigint[][] = [];
        for (let i = 0; i < m; i++) {
          hi.push([]); lo.push([]);
          for (let j = 0; j < n; j++) {
            const v = BigInt(grid[i][j]);
            const prev: bigint[] = [];
            if (i === 0 && j === 0) prev.push(BigInt(1));
            if (i > 0) prev.push(hi[i - 1][j], lo[i - 1][j]);
            if (j > 0) prev.push(hi[i][j - 1], lo[i][j - 1]);
            const c = prev.map((x) => x * v);
            hi[i].push(c.reduce((a, b) => (b > a ? b : a)));
            lo[i].push(c.reduce((a, b) => (b < a ? b : a)));
          }
        }
        best = hi[m - 1][n - 1];
      }
      const b = best as unknown as bigint;
      return b < BigInt(0) ? -1 : Number(b % MODB);
    };
    return {
      slug: "maximum-non-negative-product-in-a-matrix",
      title: "Maximum Non Negative Product in a Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Google", "Amazon"],
      signature: { funcName: "maxProductPath", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You start at the top-left cell `(0, 0)` of an `m x n` integer matrix `grid` and may only move **right** or **down** until you reach the bottom-right cell `(m - 1, n - 1)`. The **product** of a path is the product of every cell it visits, both ends included.\n\nFind the path with the **maximum** product. If that maximum is negative, return `-1`. Otherwise return the maximum product **modulo** `10^9 + 7`.\n\nThe maximum is decided on the exact products — the modulo is applied only to the final answer. (The grid here is at most 13 × 13, so every exact product is at most 4^25 in absolute value and fits in 64 bits — and even in a double.)",
        [
          { in: "grid = [[2,-1],[3,-2]]", out: "4", note: "Right then down gives 2 × (-1) × (-2) = 4; down then right gives 2 × 3 × (-2) = -12." },
          { in: "grid = [[-1,2],[3,4]]", out: "-1", note: "Both paths have a negative product (-8 and -12)." },
          { in: "grid = [[1,-3,0],[2,-4,1]]", out: "12", note: "1 × (-3) × (-4) × 1 = 12 beats the paths through 0 (product 0) and through 2 (product -8)." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 13", "-4 <= grid[i][j] <= 4"]),
      hints: [
        "Keeping only the largest product so far is not enough — a very negative product can become the largest after one more negative cell.",
        "For every cell, track both the maximum and the minimum product of a path that ends there.",
        "The new maximum and minimum at a cell come from multiplying its value with the max and min of the cell above and the cell to the left.",
      ],
      editorial: explain({
        idea: "Multiplying by a negative number swaps the order of products, so a DP that remembers both the largest and the smallest product reaching each cell is enough to recover the true maximum.",
        steps: [
          "Set `hi[0][0] = lo[0][0] = grid[0][0]`.",
          "For every other cell with value `v`, collect `hi * v` and `lo * v` for the cell above and the cell to the left (whichever exist).",
          "`hi[i][j]` is the largest of those candidates and `lo[i][j]` the smallest.",
          "If `hi[m-1][n-1] < 0` return `-1`; otherwise return it modulo `10^9 + 7`.",
        ],
        why: "For a fixed last step, `x · v` over all products `x` reaching the previous cell is maximised at an extreme of `x`: the largest `x` when `v >= 0`, the smallest when `v < 0`. So keeping only the two extremes per cell loses no optimal path, and the same argument applies to the minimum.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Taking the modulo inside the DP destroys the comparisons — keep exact 64-bit products and reduce only at the end.",
          "Zero is a valid non-negative answer; return `-1` only when the best product is strictly negative.",
          "In JavaScript, `0 * -3` is `-0`; normalise before printing.",
        ],
      }),
      examples: [
        { input: "[[2,-1],[3,-2]]", expectedOutput: "4" },
        { input: "[[-1,2],[3,4]]", expectedOutput: "-1" },
        { input: "[[1,-3,0],[2,-4,1]]", expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 5, 13]));
        const n = ri(rng, 1, pick(rng, [2, 5, 13]));
        const pool = pick(rng, [[-4, -3, -2, -1, 0, 1, 2, 3, 4], [-4, -3, -2, -1, 1, 2, 3, 4], [-4, 4], [-1, 1, 2], [-4, -2, 3, 4, 4]]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => pick(rng, pool)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxProductPath(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              hi = [[0] * n for _ in range(m)]
              lo = [[0] * n for _ in range(m)]
              for i in range(m):
                  for j in range(n):
                      v = grid[i][j]
                      if i == 0 and j == 0:
                          hi[i][j] = lo[i][j] = v
                          continue
                      cands = []
                      if i > 0:
                          cands += [hi[i - 1][j] * v, lo[i - 1][j] * v]
                      if j > 0:
                          cands += [hi[i][j - 1] * v, lo[i][j - 1] * v]
                      hi[i][j] = max(cands)
                      lo[i][j] = min(cands)
              best = hi[m - 1][n - 1]
              return -1 if best < 0 else best % 1000000007
        `,
        javascript: code`
          var maxProductPath = function(grid) {
              var m = grid.length, n = grid[0].length;
              var hi = [], lo = [];
              for (var i = 0; i < m; i++) {
                  hi.push([]); lo.push([]);
                  for (var j = 0; j < n; j++) {
                      var v = grid[i][j];
                      if (i === 0 && j === 0) { hi[i].push(v); lo[i].push(v); continue; }
                      var best = -Infinity, worst = Infinity;
                      if (i > 0) {
                          best = Math.max(best, hi[i - 1][j] * v, lo[i - 1][j] * v);
                          worst = Math.min(worst, hi[i - 1][j] * v, lo[i - 1][j] * v);
                      }
                      if (j > 0) {
                          best = Math.max(best, hi[i][j - 1] * v, lo[i][j - 1] * v);
                          worst = Math.min(worst, hi[i][j - 1] * v, lo[i][j - 1] * v);
                      }
                      hi[i].push(best); lo[i].push(worst);
                  }
              }
              var r = hi[m - 1][n - 1];
              // |r| <= 4^25 < 2^53, so the double is exact; + 0 turns -0 into 0
              return r < 0 ? -1 : (r % 1000000007) + 0;
          };
        `,
        typescript: code`
          function maxProductPath(grid: number[][]): number {
              var m = grid.length, n = grid[0].length;
              var hi: number[][] = [], lo: number[][] = [];
              for (var i = 0; i < m; i++) {
                  hi.push([]); lo.push([]);
                  for (var j = 0; j < n; j++) {
                      var v = grid[i][j];
                      if (i === 0 && j === 0) { hi[i].push(v); lo[i].push(v); continue; }
                      var best = -Infinity, worst = Infinity;
                      if (i > 0) {
                          best = Math.max(best, hi[i - 1][j] * v, lo[i - 1][j] * v);
                          worst = Math.min(worst, hi[i - 1][j] * v, lo[i - 1][j] * v);
                      }
                      if (j > 0) {
                          best = Math.max(best, hi[i][j - 1] * v, lo[i][j - 1] * v);
                          worst = Math.min(worst, hi[i][j - 1] * v, lo[i][j - 1] * v);
                      }
                      hi[i].push(best); lo[i].push(worst);
                  }
              }
              var r = hi[m - 1][n - 1];
              return r < 0 ? -1 : (r % 1000000007) + 0;
          }
        `,
        java: code`
          public static int maxProductPath(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              long[][] hi = new long[m][n], lo = new long[m][n];
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      long v = grid[i][j];
                      if (i == 0 && j == 0) { hi[i][j] = v; lo[i][j] = v; continue; }
                      long best = Long.MIN_VALUE, worst = Long.MAX_VALUE;
                      if (i > 0) {
                          best = Math.max(best, Math.max(hi[i - 1][j] * v, lo[i - 1][j] * v));
                          worst = Math.min(worst, Math.min(hi[i - 1][j] * v, lo[i - 1][j] * v));
                      }
                      if (j > 0) {
                          best = Math.max(best, Math.max(hi[i][j - 1] * v, lo[i][j - 1] * v));
                          worst = Math.min(worst, Math.min(hi[i][j - 1] * v, lo[i][j - 1] * v));
                      }
                      hi[i][j] = best;
                      lo[i][j] = worst;
                  }
              }
              long r = hi[m - 1][n - 1];
              return r < 0 ? -1 : (int) (r % 1000000007L);
          }
        `,
        cpp: code`
          int maxProductPath(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              vector<vector<long long>> hi(m, vector<long long>(n)), lo(m, vector<long long>(n));
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      long long v = grid[i][j];
                      if (i == 0 && j == 0) { hi[i][j] = lo[i][j] = v; continue; }
                      long long best = LLONG_MIN, worst = LLONG_MAX;
                      if (i > 0) {
                          best = max(best, max(hi[i - 1][j] * v, lo[i - 1][j] * v));
                          worst = min(worst, min(hi[i - 1][j] * v, lo[i - 1][j] * v));
                      }
                      if (j > 0) {
                          best = max(best, max(hi[i][j - 1] * v, lo[i][j - 1] * v));
                          worst = min(worst, min(hi[i][j - 1] * v, lo[i][j - 1] * v));
                      }
                      hi[i][j] = best;
                      lo[i][j] = worst;
                  }
              }
              long long r = hi[m - 1][n - 1];
              return r < 0 ? -1 : (int)(r % 1000000007LL);
          }
        `,
        c: code`
          int maxProductPath(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0];
              long long* hi = (long long*)malloc(m * n * sizeof(long long));
              long long* lo = (long long*)malloc(m * n * sizeof(long long));
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      long long v = grid[i][j];
                      if (i == 0 && j == 0) { hi[0] = v; lo[0] = v; continue; }
                      long long c[4];
                      int cnt = 0;
                      if (i > 0) { c[cnt++] = hi[(i - 1) * n + j] * v; c[cnt++] = lo[(i - 1) * n + j] * v; }
                      if (j > 0) { c[cnt++] = hi[i * n + j - 1] * v; c[cnt++] = lo[i * n + j - 1] * v; }
                      long long best = c[0], worst = c[0];
                      for (int t = 1; t < cnt; t++) {
                          if (c[t] > best) best = c[t];
                          if (c[t] < worst) worst = c[t];
                      }
                      hi[i * n + j] = best;
                      lo[i * n + j] = worst;
                  }
              }
              long long r = hi[m * n - 1];
              free(hi);
              free(lo);
              return r < 0 ? -1 : (int)(r % 1000000007LL);
          }
        `,
        csharp: code`
          public static int MaxProductPath(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              var hi = new long[m, n];
              var lo = new long[m, n];
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      long v = grid[i][j];
                      if (i == 0 && j == 0) { hi[i, j] = v; lo[i, j] = v; continue; }
                      long best = long.MinValue, worst = long.MaxValue;
                      if (i > 0)
                      {
                          best = Math.Max(best, Math.Max(hi[i - 1, j] * v, lo[i - 1, j] * v));
                          worst = Math.Min(worst, Math.Min(hi[i - 1, j] * v, lo[i - 1, j] * v));
                      }
                      if (j > 0)
                      {
                          best = Math.Max(best, Math.Max(hi[i, j - 1] * v, lo[i, j - 1] * v));
                          worst = Math.Min(worst, Math.Min(hi[i, j - 1] * v, lo[i, j - 1] * v));
                      }
                      hi[i, j] = best;
                      lo[i, j] = worst;
                  }
              }
              long r = hi[m - 1, n - 1];
              return r < 0 ? -1 : (int)(r % 1000000007L);
          }
        `,
        go: code`
          func maxProductPath(grid [][]int) int {
          	m, n := len(grid), len(grid[0])
          	hi := make([][]int64, m)
          	lo := make([][]int64, m)
          	for i := 0; i < m; i++ {
          		hi[i] = make([]int64, n)
          		lo[i] = make([]int64, n)
          		for j := 0; j < n; j++ {
          			v := int64(grid[i][j])
          			if i == 0 && j == 0 {
          				hi[i][j], lo[i][j] = v, v
          				continue
          			}
          			cands := []int64{}
          			if i > 0 {
          				cands = append(cands, hi[i-1][j]*v, lo[i-1][j]*v)
          			}
          			if j > 0 {
          				cands = append(cands, hi[i][j-1]*v, lo[i][j-1]*v)
          			}
          			best, worst := cands[0], cands[0]
          			for _, x := range cands[1:] {
          				if x > best {
          					best = x
          				}
          				if x < worst {
          					worst = x
          				}
          			}
          			hi[i][j], lo[i][j] = best, worst
          		}
          	}
          	r := hi[m-1][n-1]
          	if r < 0 {
          		return -1
          	}
          	return int(r % 1000000007)
          }
        `,
        kotlin: code`
          fun maxProductPath(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              val hi = Array(m) { LongArray(n) }
              val lo = Array(m) { LongArray(n) }
              for (i in 0 until m) {
                  for (j in 0 until n) {
                      val v = grid[i][j].toLong()
                      if (i == 0 && j == 0) { hi[i][j] = v; lo[i][j] = v; continue }
                      var best = Long.MIN_VALUE
                      var worst = Long.MAX_VALUE
                      if (i > 0) {
                          best = maxOf(best, hi[i - 1][j] * v, lo[i - 1][j] * v)
                          worst = minOf(worst, hi[i - 1][j] * v, lo[i - 1][j] * v)
                      }
                      if (j > 0) {
                          best = maxOf(best, hi[i][j - 1] * v, lo[i][j - 1] * v)
                          worst = minOf(worst, hi[i][j - 1] * v, lo[i][j - 1] * v)
                      }
                      hi[i][j] = best
                      lo[i][j] = worst
                  }
              }
              val r = hi[m - 1][n - 1]
              return if (r < 0) -1 else (r % 1000000007L).toInt()
          }
        `,
        swift: code`
          func maxProductPath(_ grid: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count
              var hi = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)
              var lo = hi
              for i in 0..<m {
                  for j in 0..<n {
                      let v = grid[i][j]
                      if i == 0 && j == 0 { hi[i][j] = v; lo[i][j] = v; continue }
                      var best = Int.min, worst = Int.max
                      if i > 0 {
                          best = max(best, hi[i - 1][j] * v, lo[i - 1][j] * v)
                          worst = min(worst, hi[i - 1][j] * v, lo[i - 1][j] * v)
                      }
                      if j > 0 {
                          best = max(best, hi[i][j - 1] * v, lo[i][j - 1] * v)
                          worst = min(worst, hi[i][j - 1] * v, lo[i][j - 1] * v)
                      }
                      hi[i][j] = best
                      lo[i][j] = worst
                  }
              }
              let r = hi[m - 1][n - 1]
              return r < 0 ? -1 : r % 1000000007
          }
        `,
        rust: code`
          fn maxProductPath(grid: Vec<Vec<i32>>) -> i32 {
              let m = grid.len();
              let n = grid[0].len();
              let mut hi = vec![vec![0i64; n]; m];
              let mut lo = vec![vec![0i64; n]; m];
              for i in 0..m {
                  for j in 0..n {
                      let v = grid[i][j] as i64;
                      if i == 0 && j == 0 {
                          hi[i][j] = v;
                          lo[i][j] = v;
                          continue;
                      }
                      let mut cands: Vec<i64> = Vec::new();
                      if i > 0 {
                          cands.push(hi[i - 1][j] * v);
                          cands.push(lo[i - 1][j] * v);
                      }
                      if j > 0 {
                          cands.push(hi[i][j - 1] * v);
                          cands.push(lo[i][j - 1] * v);
                      }
                      hi[i][j] = *cands.iter().max().unwrap();
                      lo[i][j] = *cands.iter().min().unwrap();
                  }
              }
              let r = hi[m - 1][n - 1];
              if r < 0 {
                  -1
              } else {
                  (r % 1_000_000_007) as i32
              }
          }
        `,
        php: code`
          function maxProductPath($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $hi = [];
              $lo = [];
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      $v = $grid[$i][$j];
                      if ($i == 0 && $j == 0) { $hi[0][0] = $v; $lo[0][0] = $v; continue; }
                      $c = [];
                      if ($i > 0) { $c[] = $hi[$i - 1][$j] * $v; $c[] = $lo[$i - 1][$j] * $v; }
                      if ($j > 0) { $c[] = $hi[$i][$j - 1] * $v; $c[] = $lo[$i][$j - 1] * $v; }
                      $hi[$i][$j] = max($c);
                      $lo[$i][$j] = min($c);
                  }
              }
              $r = $hi[$m - 1][$n - 1];
              return $r < 0 ? -1 : $r % 1000000007;
          }
        `,
        ruby: code`
          def maxProductPath(grid)
            m = grid.length
            n = grid[0].length
            hi = Array.new(m) { Array.new(n, 0) }
            lo = Array.new(m) { Array.new(n, 0) }
            m.times do |i|
              n.times do |j|
                v = grid[i][j]
                if i == 0 && j == 0
                  hi[i][j] = v
                  lo[i][j] = v
                  next
                end
                c = []
                c.push(hi[i - 1][j] * v, lo[i - 1][j] * v) if i > 0
                c.push(hi[i][j - 1] * v, lo[i][j - 1] * v) if j > 0
                hi[i][j] = c.max
                lo[i][j] = c.min
              end
            end
            r = hi[m - 1][n - 1]
            r < 0 ? -1 : r % 1000000007
          end
        `,
      },
    };
  })(),

  // ── Number of Paths with Max Score (LC 1301) ────────────────────
  (() => {
    const MODB = BigInt(1000000007);
    const ref = (board: string[]) => {
      const n = board.length;
      const memo = new Map<number, [number, bigint] | null>();
      // best (score, number of ways) of reaching (i, j) from S; null when unreachable
      const f = (i: number, j: number): [number, bigint] | null => {
        if (i >= n || j >= n || board[i][j] === "X") return null;
        if (i === n - 1 && j === n - 1) return [0, BigInt(1)];
        const key = i * n + j;
        if (memo.has(key)) return memo.get(key)!;
        let best: [number, bigint] | null = null;
        for (const [di, dj] of [[1, 0], [0, 1], [1, 1]]) {
          const r = f(i + di, j + dj);
          if (!r) continue;
          if (!best || r[0] > best[0]) best = [r[0], r[1]];
          else if (r[0] === best[0]) best = [best[0], best[1] + r[1]];
        }
        const ch = board[i][j];
        const res: [number, bigint] | null = best ? [best[0] + (ch >= "1" && ch <= "9" ? Number(ch) : 0), best[1]] : null;
        memo.set(key, res);
        return res;
      };
      const r = f(0, 0);
      return r ? [r[0], Number(r[1] % MODB)] : [0, 0];
    };
    return {
      slug: "number-of-paths-with-max-score",
      title: "Number of Paths with Max Score",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Samsung", "Google"],
      signature: { funcName: "pathsWithMaxScore", params: [{ name: "board", type: "string[]" as const }], returns: "int[]" as const },
      description: describe(
        "`board` is a square grid given as `n` strings of length `n`. The bottom-right cell is the start `'S'` and the top-left cell is the end `'E'`. Every other cell is either an obstacle `'X'` or a digit `'1'`–`'9'`.\n\nFrom any cell you may move **up**, **left**, or **diagonally up-left**, never onto an obstacle. A path from `'S'` to `'E'` scores the sum of the digits it passes over (`'S'` and `'E'` count as 0).\n\nReturn `[maxScore, ways]`: the highest score of any path, and how many different paths achieve it, taken modulo `10^9 + 7`. If `'E'` cannot be reached, return `[0, 0]`.",
        [
          { in: "board = [\"E31\",\"1X2\",\"42S\"]", out: "[7,1]", note: "S → left onto 2 → left onto 4 → up onto 1 → up to E scores 2 + 4 + 1 = 7." },
          { in: "board = [\"E11\",\"121\",\"11S\"]", out: "[4,4]", note: "Four different paths each pass over the 2 and two of the 1s." },
          { in: "board = [\"E9X\",\"XXX\",\"X1S\"]", out: "[0,0]" },
        ],
        ["2 <= board.length == board[i].length <= 100", "board[0][0] == 'E' and board[n-1][n-1] == 'S'", "every other cell is 'X' or a digit '1' to '9'"]),
      hints: [
        "Every move goes up, left or up-left, so a cell can only be entered from the cell below it, to its right, or diagonally below-right.",
        "Process cells from the bottom-right corner towards the top-left, so those three neighbours are always finished first.",
        "Keep two numbers per cell: the best score to reach it and the number of ways to get that score. Among reachable neighbours take the best score and add up the ways of every neighbour that ties it.",
      ],
      editorial: explain({
        idea: "A DP that carries a pair per cell — the best score reaching the cell and the count of paths achieving it — solves both questions in one sweep.",
        steps: [
          "Pad the board with an unreachable extra row and column; mark `best[n-1][n-1] = 0`, `ways[n-1][n-1] = 1`, everything else unreachable (`best = -1`).",
          "Visit cells from bottom-right to top-left, skipping obstacles.",
          "Look at the three predecessors (below, right, below-right). Among the reachable ones take the maximum `best`; `ways` is the sum, modulo `10^9 + 7`, of the predecessors that share that maximum.",
          "Add the cell's digit to the best score (0 for `'E'`). Leave the cell unreachable if no predecessor is reachable.",
          "Return `[best[0][0], ways[0][0]]`, or `[0, 0]` if `'E'` is unreachable.",
        ],
        why: "Every path into a cell arrives through exactly one predecessor, so the optimal paths into the cell are the optimal paths into its best predecessors extended by one step — the counts add and nothing is counted twice. The cell's own digit is added to every such path equally, so it does not change which predecessor is best.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Use a separate \"unreachable\" marker rather than `ways == 0`: a count can be 0 modulo `10^9 + 7` for a reachable cell.",
          "When two predecessors tie, both counts are added; when one is strictly better, the other's count is discarded.",
          "`'E'` and `'S'` are not digits — they add nothing to the score.",
        ],
      }),
      examples: [
        { input: '["E31","1X2","42S"]', expectedOutput: "[7,1]" },
        { input: '["E11","121","11S"]', expectedOutput: "[4,4]" },
        { input: '["E9X","XXX","X1S"]', expectedOutput: "[0,0]" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, 3, 4, 5, 6, 8, 12, 20]);
        const p = pick(rng, [0, 0.1, 0.25, 0.45]);
        const digits = pick(rng, ["123456789", "1", "12", "19"]);
        const board = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
          if (i === 0 && j === 0) return "E";
          if (i === n - 1 && j === n - 1) return "S";
          return rng() < p ? "X" : digits[ri(rng, 0, digits.length - 1)];
        }).join(""));
        return { input: fmtStrArr(board), expectedOutput: fmtIntArr(ref(board)) };
      },
      solutions: {
        python: code`
          from typing import List

          def pathsWithMaxScore(board: List[str]) -> List[int]:
              n = len(board)
              MOD = 10 ** 9 + 7
              best = [[-1] * (n + 1) for _ in range(n + 1)]
              ways = [[0] * (n + 1) for _ in range(n + 1)]
              best[n - 1][n - 1] = 0
              ways[n - 1][n - 1] = 1
              for i in range(n - 1, -1, -1):
                  for j in range(n - 1, -1, -1):
                      ch = board[i][j]
                      if ch == 'X' or (i == n - 1 and j == n - 1):
                          continue
                      top, cnt = -1, 0
                      for a, b in ((i + 1, j), (i, j + 1), (i + 1, j + 1)):
                          s = best[a][b]
                          if s < 0:
                              continue
                          if s > top:
                              top, cnt = s, ways[a][b]
                          elif s == top:
                              cnt = (cnt + ways[a][b]) % MOD
                      if top < 0:
                          continue
                      best[i][j] = top + (int(ch) if ch.isdigit() else 0)
                      ways[i][j] = cnt
              if best[0][0] < 0:
                  return [0, 0]
              return [best[0][0], ways[0][0]]
        `,
        javascript: code`
          var pathsWithMaxScore = function(board) {
              var n = board.length, MOD = 1000000007;
              var best = [], ways = [];
              for (var r = 0; r <= n; r++) { best.push(new Array(n + 1).fill(-1)); ways.push(new Array(n + 1).fill(0)); }
              best[n - 1][n - 1] = 0;
              ways[n - 1][n - 1] = 1;
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = n - 1; j >= 0; j--) {
                      var ch = board[i][j];
                      if (ch === 'X' || (i === n - 1 && j === n - 1)) continue;
                      var top = -1, cnt = 0;
                      var cand = [[i + 1, j], [i, j + 1], [i + 1, j + 1]];
                      for (var t = 0; t < 3; t++) {
                          var s = best[cand[t][0]][cand[t][1]];
                          if (s < 0) continue;
                          if (s > top) { top = s; cnt = ways[cand[t][0]][cand[t][1]]; }
                          else if (s === top) cnt = (cnt + ways[cand[t][0]][cand[t][1]]) % MOD;
                      }
                      if (top < 0) continue;
                      best[i][j] = top + (ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0);
                      ways[i][j] = cnt;
                  }
              }
              return best[0][0] < 0 ? [0, 0] : [best[0][0], ways[0][0]];
          };
        `,
        typescript: code`
          function pathsWithMaxScore(board: string[]): number[] {
              var n = board.length, MOD = 1000000007;
              var best: number[][] = [], ways: number[][] = [];
              for (var r = 0; r <= n; r++) {
                  var b: number[] = [], w: number[] = [];
                  for (var c = 0; c <= n; c++) { b.push(-1); w.push(0); }
                  best.push(b); ways.push(w);
              }
              best[n - 1][n - 1] = 0;
              ways[n - 1][n - 1] = 1;
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = n - 1; j >= 0; j--) {
                      var ch = board[i].charAt(j);
                      if (ch === 'X' || (i === n - 1 && j === n - 1)) continue;
                      var top = -1, cnt = 0;
                      var cand = [[i + 1, j], [i, j + 1], [i + 1, j + 1]];
                      for (var t = 0; t < 3; t++) {
                          var s = best[cand[t][0]][cand[t][1]];
                          if (s < 0) continue;
                          if (s > top) { top = s; cnt = ways[cand[t][0]][cand[t][1]]; }
                          else if (s === top) cnt = (cnt + ways[cand[t][0]][cand[t][1]]) % MOD;
                      }
                      if (top < 0) continue;
                      best[i][j] = top + (ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0);
                      ways[i][j] = cnt;
                  }
              }
              return best[0][0] < 0 ? [0, 0] : [best[0][0], ways[0][0]];
          }
        `,
        java: code`
          public static int[] pathsWithMaxScore(String[] board) {
              int n = board.length, MOD = 1000000007;
              int[][] best = new int[n + 1][n + 1], ways = new int[n + 1][n + 1];
              for (int[] row : best) Arrays.fill(row, -1);
              best[n - 1][n - 1] = 0;
              ways[n - 1][n - 1] = 1;
              int[][] moves = {{1, 0}, {0, 1}, {1, 1}};
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = n - 1; j >= 0; j--) {
                      char ch = board[i].charAt(j);
                      if (ch == 'X' || (i == n - 1 && j == n - 1)) continue;
                      int top = -1, cnt = 0;
                      for (int[] mv : moves) {
                          int s = best[i + mv[0]][j + mv[1]];
                          if (s < 0) continue;
                          if (s > top) { top = s; cnt = ways[i + mv[0]][j + mv[1]]; }
                          else if (s == top) cnt = (cnt + ways[i + mv[0]][j + mv[1]]) % MOD;
                      }
                      if (top < 0) continue;
                      best[i][j] = top + (ch >= '1' && ch <= '9' ? ch - '0' : 0);
                      ways[i][j] = cnt;
                  }
              }
              return best[0][0] < 0 ? new int[]{0, 0} : new int[]{best[0][0], ways[0][0]};
          }
        `,
        cpp: code`
          vector<int> pathsWithMaxScore(vector<string>& board) {
              int n = board.size();
              const int MOD = 1000000007;
              vector<vector<int>> best(n + 1, vector<int>(n + 1, -1)), ways(n + 1, vector<int>(n + 1, 0));
              best[n - 1][n - 1] = 0;
              ways[n - 1][n - 1] = 1;
              int moves[3][2] = {{1, 0}, {0, 1}, {1, 1}};
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = n - 1; j >= 0; j--) {
                      char ch = board[i][j];
                      if (ch == 'X' || (i == n - 1 && j == n - 1)) continue;
                      int top = -1, cnt = 0;
                      for (auto& mv : moves) {
                          int s = best[i + mv[0]][j + mv[1]];
                          if (s < 0) continue;
                          if (s > top) { top = s; cnt = ways[i + mv[0]][j + mv[1]]; }
                          else if (s == top) cnt = (cnt + ways[i + mv[0]][j + mv[1]]) % MOD;
                      }
                      if (top < 0) continue;
                      best[i][j] = top + (ch >= '1' && ch <= '9' ? ch - '0' : 0);
                      ways[i][j] = cnt;
                  }
              }
              if (best[0][0] < 0) return {0, 0};
              return {best[0][0], ways[0][0]};
          }
        `,
        c: code`
          int* pathsWithMaxScore(char** board, int boardSize, int* returnSize) {
              int n = boardSize, W = n + 1;
              const int MOD = 1000000007;
              int* best = (int*)malloc(W * W * sizeof(int));
              int* ways = (int*)malloc(W * W * sizeof(int));
              for (int t = 0; t < W * W; t++) { best[t] = -1; ways[t] = 0; }
              best[(n - 1) * W + n - 1] = 0;
              ways[(n - 1) * W + n - 1] = 1;
              int di[3] = {1, 0, 1}, dj[3] = {0, 1, 1};
              for (int i = n - 1; i >= 0; i--) {
                  for (int j = n - 1; j >= 0; j--) {
                      char ch = board[i][j];
                      if (ch == 'X' || (i == n - 1 && j == n - 1)) continue;
                      int top = -1, cnt = 0;
                      for (int t = 0; t < 3; t++) {
                          int at = (i + di[t]) * W + j + dj[t];
                          int s = best[at];
                          if (s < 0) continue;
                          if (s > top) { top = s; cnt = ways[at]; }
                          else if (s == top) cnt = (cnt + ways[at]) % MOD;
                      }
                      if (top < 0) continue;
                      best[i * W + j] = top + (ch >= '1' && ch <= '9' ? ch - '0' : 0);
                      ways[i * W + j] = cnt;
                  }
              }
              int* res = (int*)malloc(2 * sizeof(int));
              if (best[0] < 0) { res[0] = 0; res[1] = 0; }
              else { res[0] = best[0]; res[1] = ways[0]; }
              free(best);
              free(ways);
              *returnSize = 2;
              return res;
          }
        `,
        csharp: code`
          public static int[] PathsWithMaxScore(string[] board)
          {
              int n = board.Length;
              const int MOD = 1000000007;
              var best = new int[n + 1, n + 1];
              var ways = new int[n + 1, n + 1];
              for (int a = 0; a <= n; a++) for (int b = 0; b <= n; b++) best[a, b] = -1;
              best[n - 1, n - 1] = 0;
              ways[n - 1, n - 1] = 1;
              int[] di = { 1, 0, 1 }, dj = { 0, 1, 1 };
              for (int i = n - 1; i >= 0; i--)
              {
                  for (int j = n - 1; j >= 0; j--)
                  {
                      char ch = board[i][j];
                      if (ch == 'X' || (i == n - 1 && j == n - 1)) continue;
                      int top = -1, cnt = 0;
                      for (int t = 0; t < 3; t++)
                      {
                          int s = best[i + di[t], j + dj[t]];
                          if (s < 0) continue;
                          if (s > top) { top = s; cnt = ways[i + di[t], j + dj[t]]; }
                          else if (s == top) cnt = (cnt + ways[i + di[t], j + dj[t]]) % MOD;
                      }
                      if (top < 0) continue;
                      best[i, j] = top + (ch >= '1' && ch <= '9' ? ch - '0' : 0);
                      ways[i, j] = cnt;
                  }
              }
              return best[0, 0] < 0 ? new int[] { 0, 0 } : new int[] { best[0, 0], ways[0, 0] };
          }
        `,
        go: code`
          func pathsWithMaxScore(board []string) []int {
          	n := len(board)
          	const MOD = 1000000007
          	best := make([][]int, n+1)
          	ways := make([][]int, n+1)
          	for i := 0; i <= n; i++ {
          		best[i] = make([]int, n+1)
          		ways[i] = make([]int, n+1)
          		for j := 0; j <= n; j++ {
          			best[i][j] = -1
          		}
          	}
          	best[n-1][n-1] = 0
          	ways[n-1][n-1] = 1
          	di := []int{1, 0, 1}
          	dj := []int{0, 1, 1}
          	for i := n - 1; i >= 0; i-- {
          		for j := n - 1; j >= 0; j-- {
          			ch := board[i][j]
          			if ch == 'X' || (i == n-1 && j == n-1) {
          				continue
          			}
          			top, cnt := -1, 0
          			for t := 0; t < 3; t++ {
          				s := best[i+di[t]][j+dj[t]]
          				if s < 0 {
          					continue
          				}
          				if s > top {
          					top, cnt = s, ways[i+di[t]][j+dj[t]]
          				} else if s == top {
          					cnt = (cnt + ways[i+di[t]][j+dj[t]]) % MOD
          				}
          			}
          			if top < 0 {
          				continue
          			}
          			d := 0
          			if ch >= '1' && ch <= '9' {
          				d = int(ch - '0')
          			}
          			best[i][j] = top + d
          			ways[i][j] = cnt
          		}
          	}
          	if best[0][0] < 0 {
          		return []int{0, 0}
          	}
          	return []int{best[0][0], ways[0][0]}
          }
        `,
        kotlin: code`
          fun pathsWithMaxScore(board: Array<String>): IntArray {
              val n = board.size
              val MOD = 1000000007
              val best = Array(n + 1) { IntArray(n + 1) { -1 } }
              val ways = Array(n + 1) { IntArray(n + 1) }
              best[n - 1][n - 1] = 0
              ways[n - 1][n - 1] = 1
              val di = intArrayOf(1, 0, 1)
              val dj = intArrayOf(0, 1, 1)
              for (i in n - 1 downTo 0) {
                  for (j in n - 1 downTo 0) {
                      val ch = board[i][j]
                      if (ch == 'X' || (i == n - 1 && j == n - 1)) continue
                      var top = -1
                      var cnt = 0
                      for (t in 0 until 3) {
                          val s = best[i + di[t]][j + dj[t]]
                          if (s < 0) continue
                          if (s > top) { top = s; cnt = ways[i + di[t]][j + dj[t]] }
                          else if (s == top) cnt = (cnt + ways[i + di[t]][j + dj[t]]) % MOD
                      }
                      if (top < 0) continue
                      best[i][j] = top + (if (ch in '1'..'9') ch - '0' else 0)
                      ways[i][j] = cnt
                  }
              }
              return if (best[0][0] < 0) intArrayOf(0, 0) else intArrayOf(best[0][0], ways[0][0])
          }
        `,
        swift: code`
          func pathsWithMaxScore(_ board: [String]) -> [Int] {
              let n = board.count
              let MOD = 1000000007
              let g = board.map { Array($0.utf8) }
              var best = [[Int]](repeating: [Int](repeating: -1, count: n + 1), count: n + 1)
              var ways = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: n + 1)
              best[n - 1][n - 1] = 0
              ways[n - 1][n - 1] = 1
              let di = [1, 0, 1], dj = [0, 1, 1]
              for i in stride(from: n - 1, through: 0, by: -1) {
                  for j in stride(from: n - 1, through: 0, by: -1) {
                      let ch = Int(g[i][j])
                      if ch == 88 || (i == n - 1 && j == n - 1) { continue }
                      var top = -1, cnt = 0
                      for t in 0..<3 {
                          let s = best[i + di[t]][j + dj[t]]
                          if s < 0 { continue }
                          if s > top { top = s; cnt = ways[i + di[t]][j + dj[t]] }
                          else if s == top { cnt = (cnt + ways[i + di[t]][j + dj[t]]) % MOD }
                      }
                      if top < 0 { continue }
                      best[i][j] = top + ((ch >= 49 && ch <= 57) ? ch - 48 : 0)
                      ways[i][j] = cnt
                  }
              }
              return best[0][0] < 0 ? [0, 0] : [best[0][0], ways[0][0]]
          }
        `,
        rust: code`
          fn pathsWithMaxScore(board: Vec<String>) -> Vec<i32> {
              let n = board.len();
              let md: i64 = 1_000_000_007;
              let g: Vec<&[u8]> = board.iter().map(|s| s.as_bytes()).collect();
              let mut best = vec![vec![-1i64; n + 1]; n + 1];
              let mut ways = vec![vec![0i64; n + 1]; n + 1];
              best[n - 1][n - 1] = 0;
              ways[n - 1][n - 1] = 1;
              let moves = [(1usize, 0usize), (0, 1), (1, 1)];
              for i in (0..n).rev() {
                  for j in (0..n).rev() {
                      let ch = g[i][j];
                      if ch == b'X' || (i == n - 1 && j == n - 1) {
                          continue;
                      }
                      let mut top = -1i64;
                      let mut cnt = 0i64;
                      for &(di, dj) in moves.iter() {
                          let s = best[i + di][j + dj];
                          if s < 0 {
                              continue;
                          }
                          if s > top {
                              top = s;
                              cnt = ways[i + di][j + dj];
                          } else if s == top {
                              cnt = (cnt + ways[i + di][j + dj]) % md;
                          }
                      }
                      if top < 0 {
                          continue;
                      }
                      let d = if ch >= b'1' && ch <= b'9' { (ch - b'0') as i64 } else { 0 };
                      best[i][j] = top + d;
                      ways[i][j] = cnt;
                  }
              }
              if best[0][0] < 0 {
                  vec![0, 0]
              } else {
                  vec![best[0][0] as i32, ways[0][0] as i32]
              }
          }
        `,
        php: code`
          function pathsWithMaxScore($board) {
              $n = count($board);
              $MOD = 1000000007;
              $best = array_fill(0, $n + 1, array_fill(0, $n + 1, -1));
              $ways = array_fill(0, $n + 1, array_fill(0, $n + 1, 0));
              $best[$n - 1][$n - 1] = 0;
              $ways[$n - 1][$n - 1] = 1;
              $moves = [[1, 0], [0, 1], [1, 1]];
              for ($i = $n - 1; $i >= 0; $i--) {
                  for ($j = $n - 1; $j >= 0; $j--) {
                      $ch = $board[$i][$j];
                      if ($ch === 'X' || ($i == $n - 1 && $j == $n - 1)) continue;
                      $top = -1;
                      $cnt = 0;
                      foreach ($moves as $mv) {
                          $s = $best[$i + $mv[0]][$j + $mv[1]];
                          if ($s < 0) continue;
                          if ($s > $top) { $top = $s; $cnt = $ways[$i + $mv[0]][$j + $mv[1]]; }
                          elseif ($s == $top) $cnt = ($cnt + $ways[$i + $mv[0]][$j + $mv[1]]) % $MOD;
                      }
                      if ($top < 0) continue;
                      $o = ord($ch);
                      $best[$i][$j] = $top + (($o >= 49 && $o <= 57) ? $o - 48 : 0);
                      $ways[$i][$j] = $cnt;
                  }
              }
              return $best[0][0] < 0 ? [0, 0] : [$best[0][0], $ways[0][0]];
          }
        `,
        ruby: code`
          def pathsWithMaxScore(board)
            n = board.length
            mod = 1_000_000_007
            best = Array.new(n + 1) { Array.new(n + 1, -1) }
            ways = Array.new(n + 1) { Array.new(n + 1, 0) }
            best[n - 1][n - 1] = 0
            ways[n - 1][n - 1] = 1
            moves = [[1, 0], [0, 1], [1, 1]]
            (n - 1).downto(0) do |i|
              (n - 1).downto(0) do |j|
                ch = board[i][j]
                next if ch == 'X' || (i == n - 1 && j == n - 1)
                top = -1
                cnt = 0
                moves.each do |di, dj|
                  s = best[i + di][j + dj]
                  next if s < 0
                  if s > top
                    top = s
                    cnt = ways[i + di][j + dj]
                  elsif s == top
                    cnt = (cnt + ways[i + di][j + dj]) % mod
                  end
                end
                next if top < 0
                best[i][j] = top + (ch >= '1' && ch <= '9' ? ch.to_i : 0)
                ways[i][j] = cnt
              end
            end
            best[0][0] < 0 ? [0, 0] : [best[0][0], ways[0][0]]
          end
        `,
      },
    };
  })(),

  // ── Minimum Moves to Reach Target with Rotations (LC 1210) ──────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const free = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && grid[r][c] === 0;
      // state "r,c,o": tail at (r, c); o = 0 horizontal (head at r, c+1), 1 vertical (head at r+1, c)
      const seen = new Set<string>(["0,0,0"]);
      let frontier: Array<[number, number, number]> = [[0, 0, 0]];
      for (let d = 0; frontier.length; d++) {
        const next: Array<[number, number, number]> = [];
        for (const [r, c, o] of frontier) {
          if (r === n - 1 && c === n - 2 && o === 0) return d;
          const moves: Array<[number, number, number]> = [];
          if (o === 0) {
            if (free(r, c + 2)) moves.push([r, c + 1, 0]);
            if (free(r + 1, c) && free(r + 1, c + 1)) { moves.push([r + 1, c, 0]); moves.push([r, c, 1]); }
          } else {
            if (free(r + 2, c)) moves.push([r + 1, c, 1]);
            if (free(r, c + 1) && free(r + 1, c + 1)) { moves.push([r, c + 1, 1]); moves.push([r, c, 0]); }
          }
          for (const s of moves) {
            const key = s.join(",");
            if (!seen.has(key)) { seen.add(key); next.push(s); }
          }
        }
        frontier = next;
      }
      return -1;
    };
    return {
      slug: "minimum-moves-to-reach-target-with-rotations",
      title: "Minimum Moves to Reach Target with Rotations",
      difficulty: "HARD" as const,
      tags: ["Array", "Breadth-First Search", "Matrix", "Amazon", "Google"],
      signature: { funcName: "minimumMoves", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A snake two cells long lives on an `n x n` grid where `0` is an empty cell and `1` is a wall. It starts horizontally on `(0, 0)` and `(0, 1)` and wants to end horizontally on `(n-1, n-2)` and `(n-1, n-1)`.\n\nIn one move the snake can:\n\n- **move right** one cell, if the cells it moves into are empty (its orientation stays the same);\n- **move down** one cell, if the cells it moves into are empty (its orientation stays the same);\n- **rotate clockwise**, if it is horizontal on `(r, c), (r, c+1)` and both cells below it, `(r+1, c)` and `(r+1, c+1)`, are empty — it becomes vertical on `(r, c), (r+1, c)`;\n- **rotate counter-clockwise**, if it is vertical on `(r, c), (r+1, c)` and both cells to its right, `(r, c+1)` and `(r+1, c+1)`, are empty — it becomes horizontal on `(r, c), (r, c+1)`.\n\nReturn the minimum number of moves to reach the target, or `-1` if it cannot be reached.",
        [
          { in: "grid = [[0,0,0],[0,0,0],[0,0,0]]", out: "3", note: "Down, down, right." },
          { in: "grid = [[0,0,0,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]]", out: "5", note: "The wall blocks the left half of row 1, so the snake slides right twice and then moves down three times." },
          { in: "grid = [[0,0,1],[1,0,0],[0,0,0]]", out: "-1", note: "The snake cannot move right, move down, or rotate from its starting place." },
        ],
        ["2 <= n <= 100", "0 <= grid[i][j] <= 1", "the snake's two starting cells are empty"]),
      hints: [
        "The snake's whole situation is captured by its tail cell and its orientation — about `2n²` states.",
        "Every move costs 1, so a breadth-first search over those states finds the minimum.",
        "List exactly which cells must be empty for each of the four moves in each orientation; rotations need the 2 × 2 block containing the snake to be empty.",
      ],
      editorial: explain({
        idea: "Model the snake as a state `(row, col, orientation)` of its tail and run BFS; each of the four moves is an edge whose validity depends on one or two cells.",
        steps: [
          "Start BFS from `(0, 0, horizontal)` with distance 0.",
          "Horizontal at `(r, c)`: moving right needs `(r, c+2)` empty; moving down and rotating clockwise both need `(r+1, c)` and `(r+1, c+1)` empty.",
          "Vertical at `(r, c)`: moving down needs `(r+2, c)` empty; moving right and rotating counter-clockwise both need `(r, c+1)` and `(r+1, c+1)` empty.",
          "Return the distance when `(n-1, n-2, horizontal)` is dequeued; return `-1` if the queue empties.",
        ],
        why: "All moves have the same cost, so BFS visits states in order of their distance from the start and the first time the target state is dequeued its distance is minimal. The state space is finite (at most `2n²` states), so BFS terminates.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Orientation is part of the state: the same tail cell horizontal and vertical are different positions.",
          "A rotation checks the diagonal cell `(r+1, c+1)` too, not just the cell the head swings into.",
          "The target must be horizontal; being vertical in the bottom-right corner does not count.",
        ],
      }),
      examples: [
        { input: "[[0,0,0],[0,0,0],[0,0,0]]", expectedOutput: "3" },
        { input: "[[0,0,0,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]]", expectedOutput: "5" },
        { input: "[[0,0,1],[1,0,0],[0,0,0]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [4, 6, 8]));
        const p = pick(rng, [0, 0.1, 0.2, 0.3, 0.45]);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        grid[0][0] = 0;
        grid[0][1] = 0;
        if (rng() < 0.5) { grid[n - 1][n - 1] = 0; grid[n - 1][n - 2] = 0; }
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def minimumMoves(grid: List[List[int]]) -> int:
              n = len(grid)
              target = (n - 1, n - 2, 0)
              dist = {(0, 0, 0): 0}
              q = deque([(0, 0, 0)])
              while q:
                  r, c, o = q.popleft()
                  d = dist[(r, c, o)]
                  if (r, c, o) == target:
                      return d
                  nxt = []
                  if o == 0:
                      if c + 2 < n and grid[r][c + 2] == 0:
                          nxt.append((r, c + 1, 0))
                      if r + 1 < n and grid[r + 1][c] == 0 and grid[r + 1][c + 1] == 0:
                          nxt.append((r + 1, c, 0))
                          nxt.append((r, c, 1))
                  else:
                      if r + 2 < n and grid[r + 2][c] == 0:
                          nxt.append((r + 1, c, 1))
                      if c + 1 < n and grid[r][c + 1] == 0 and grid[r + 1][c + 1] == 0:
                          nxt.append((r, c + 1, 1))
                          nxt.append((r, c, 0))
                  for s in nxt:
                      if s not in dist:
                          dist[s] = d + 1
                          q.append(s)
              return -1
        `,
        javascript: code`
          var minimumMoves = function(grid) {
              var n = grid.length;
              var dist = new Array(n * n * 2).fill(-1);
              var queue = [0];
              dist[0] = 0;
              var target = ((n - 1) * n + (n - 2)) * 2;
              for (var head = 0; head < queue.length; head++) {
                  var s = queue[head];
                  if (s === target) return dist[s];
                  var o = s % 2, cell = (s - o) / 2, r = Math.floor(cell / n), c = cell % n;
                  var nexts = [];
                  if (o === 0) {
                      if (c + 2 < n && grid[r][c + 2] === 0) nexts.push((r * n + c + 1) * 2);
                      if (r + 1 < n && grid[r + 1][c] === 0 && grid[r + 1][c + 1] === 0) {
                          nexts.push(((r + 1) * n + c) * 2);
                          nexts.push((r * n + c) * 2 + 1);
                      }
                  } else {
                      if (r + 2 < n && grid[r + 2][c] === 0) nexts.push(((r + 1) * n + c) * 2 + 1);
                      if (c + 1 < n && grid[r][c + 1] === 0 && grid[r + 1][c + 1] === 0) {
                          nexts.push((r * n + c + 1) * 2 + 1);
                          nexts.push((r * n + c) * 2);
                      }
                  }
                  for (var t = 0; t < nexts.length; t++) {
                      if (dist[nexts[t]] === -1) { dist[nexts[t]] = dist[s] + 1; queue.push(nexts[t]); }
                  }
              }
              return -1;
          };
        `,
        typescript: code`
          function minimumMoves(grid: number[][]): number {
              var n = grid.length;
              var dist: number[] = [];
              for (var k = 0; k < n * n * 2; k++) dist.push(-1);
              var queue: number[] = [0];
              dist[0] = 0;
              var target = ((n - 1) * n + (n - 2)) * 2;
              for (var head = 0; head < queue.length; head++) {
                  var s = queue[head];
                  if (s === target) return dist[s];
                  var o = s % 2, cell = (s - o) / 2, r = Math.floor(cell / n), c = cell % n;
                  var nexts: number[] = [];
                  if (o === 0) {
                      if (c + 2 < n && grid[r][c + 2] === 0) nexts.push((r * n + c + 1) * 2);
                      if (r + 1 < n && grid[r + 1][c] === 0 && grid[r + 1][c + 1] === 0) {
                          nexts.push(((r + 1) * n + c) * 2);
                          nexts.push((r * n + c) * 2 + 1);
                      }
                  } else {
                      if (r + 2 < n && grid[r + 2][c] === 0) nexts.push(((r + 1) * n + c) * 2 + 1);
                      if (c + 1 < n && grid[r][c + 1] === 0 && grid[r + 1][c + 1] === 0) {
                          nexts.push((r * n + c + 1) * 2 + 1);
                          nexts.push((r * n + c) * 2);
                      }
                  }
                  for (var t = 0; t < nexts.length; t++) {
                      if (dist[nexts[t]] === -1) { dist[nexts[t]] = dist[s] + 1; queue.push(nexts[t]); }
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minimumMoves(int[][] grid) {
              int n = grid.length, total = n * n * 2;
              int[] dist = new int[total];
              Arrays.fill(dist, -1);
              int[] queue = new int[total];
              int head = 0, tail = 0, target = ((n - 1) * n + (n - 2)) * 2;
              dist[0] = 0;
              queue[tail++] = 0;
              int[] nx = new int[3];
              while (head < tail) {
                  int s = queue[head++];
                  if (s == target) return dist[s];
                  int o = s % 2, cell = s / 2, r = cell / n, c = cell % n, cnt = 0;
                  if (o == 0) {
                      if (c + 2 < n && grid[r][c + 2] == 0) nx[cnt++] = (r * n + c + 1) * 2;
                      if (r + 1 < n && grid[r + 1][c] == 0 && grid[r + 1][c + 1] == 0) {
                          nx[cnt++] = ((r + 1) * n + c) * 2;
                          nx[cnt++] = (r * n + c) * 2 + 1;
                      }
                  } else {
                      if (r + 2 < n && grid[r + 2][c] == 0) nx[cnt++] = ((r + 1) * n + c) * 2 + 1;
                      if (c + 1 < n && grid[r][c + 1] == 0 && grid[r + 1][c + 1] == 0) {
                          nx[cnt++] = (r * n + c + 1) * 2 + 1;
                          nx[cnt++] = (r * n + c) * 2;
                      }
                  }
                  for (int t = 0; t < cnt; t++) {
                      if (dist[nx[t]] == -1) { dist[nx[t]] = dist[s] + 1; queue[tail++] = nx[t]; }
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minimumMoves(vector<vector<int>>& grid) {
              int n = grid.size(), total = n * n * 2;
              vector<int> dist(total, -1), queue(total);
              int head = 0, tail = 0, target = ((n - 1) * n + (n - 2)) * 2;
              dist[0] = 0;
              queue[tail++] = 0;
              while (head < tail) {
                  int s = queue[head++];
                  if (s == target) return dist[s];
                  int o = s % 2, cell = s / 2, r = cell / n, c = cell % n, cnt = 0;
                  int nx[3];
                  if (o == 0) {
                      if (c + 2 < n && grid[r][c + 2] == 0) nx[cnt++] = (r * n + c + 1) * 2;
                      if (r + 1 < n && grid[r + 1][c] == 0 && grid[r + 1][c + 1] == 0) {
                          nx[cnt++] = ((r + 1) * n + c) * 2;
                          nx[cnt++] = (r * n + c) * 2 + 1;
                      }
                  } else {
                      if (r + 2 < n && grid[r + 2][c] == 0) nx[cnt++] = ((r + 1) * n + c) * 2 + 1;
                      if (c + 1 < n && grid[r][c + 1] == 0 && grid[r + 1][c + 1] == 0) {
                          nx[cnt++] = (r * n + c + 1) * 2 + 1;
                          nx[cnt++] = (r * n + c) * 2;
                      }
                  }
                  for (int t = 0; t < cnt; t++) {
                      if (dist[nx[t]] == -1) { dist[nx[t]] = dist[s] + 1; queue[tail++] = nx[t]; }
                  }
              }
              return -1;
          }
        `,
        c: code`
          int minimumMoves(int** grid, int gridSize, int* gridColSize) {
              int n = gridSize, total = n * n * 2;
              int* dist = (int*)malloc(total * sizeof(int));
              int* queue = (int*)malloc(total * sizeof(int));
              for (int i = 0; i < total; i++) dist[i] = -1;
              int head = 0, tail = 0, target = ((n - 1) * n + (n - 2)) * 2, ans = -1;
              dist[0] = 0;
              queue[tail++] = 0;
              while (head < tail) {
                  int s = queue[head++];
                  if (s == target) { ans = dist[s]; break; }
                  int o = s % 2, cell = s / 2, r = cell / n, c = cell % n, cnt = 0;
                  int nx[3];
                  if (o == 0) {
                      if (c + 2 < n && grid[r][c + 2] == 0) nx[cnt++] = (r * n + c + 1) * 2;
                      if (r + 1 < n && grid[r + 1][c] == 0 && grid[r + 1][c + 1] == 0) {
                          nx[cnt++] = ((r + 1) * n + c) * 2;
                          nx[cnt++] = (r * n + c) * 2 + 1;
                      }
                  } else {
                      if (r + 2 < n && grid[r + 2][c] == 0) nx[cnt++] = ((r + 1) * n + c) * 2 + 1;
                      if (c + 1 < n && grid[r][c + 1] == 0 && grid[r + 1][c + 1] == 0) {
                          nx[cnt++] = (r * n + c + 1) * 2 + 1;
                          nx[cnt++] = (r * n + c) * 2;
                      }
                  }
                  for (int t = 0; t < cnt; t++) {
                      if (dist[nx[t]] == -1) { dist[nx[t]] = dist[s] + 1; queue[tail++] = nx[t]; }
                  }
              }
              free(dist);
              free(queue);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumMoves(int[][] grid)
          {
              int n = grid.Length, total = n * n * 2;
              var dist = new int[total];
              for (int i = 0; i < total; i++) dist[i] = -1;
              var queue = new int[total];
              int head = 0, tail = 0, target = ((n - 1) * n + (n - 2)) * 2;
              dist[0] = 0;
              queue[tail++] = 0;
              var nx = new int[3];
              while (head < tail)
              {
                  int s = queue[head++];
                  if (s == target) return dist[s];
                  int o = s % 2, cell = s / 2, r = cell / n, c = cell % n, cnt = 0;
                  if (o == 0)
                  {
                      if (c + 2 < n && grid[r][c + 2] == 0) nx[cnt++] = (r * n + c + 1) * 2;
                      if (r + 1 < n && grid[r + 1][c] == 0 && grid[r + 1][c + 1] == 0)
                      {
                          nx[cnt++] = ((r + 1) * n + c) * 2;
                          nx[cnt++] = (r * n + c) * 2 + 1;
                      }
                  }
                  else
                  {
                      if (r + 2 < n && grid[r + 2][c] == 0) nx[cnt++] = ((r + 1) * n + c) * 2 + 1;
                      if (c + 1 < n && grid[r][c + 1] == 0 && grid[r + 1][c + 1] == 0)
                      {
                          nx[cnt++] = (r * n + c + 1) * 2 + 1;
                          nx[cnt++] = (r * n + c) * 2;
                      }
                  }
                  for (int t = 0; t < cnt; t++)
                  {
                      if (dist[nx[t]] == -1) { dist[nx[t]] = dist[s] + 1; queue[tail++] = nx[t]; }
                  }
              }
              return -1;
          }
        `,
        go: code`
          func minimumMoves(grid [][]int) int {
          	n := len(grid)
          	total := n * n * 2
          	dist := make([]int, total)
          	for i := range dist {
          		dist[i] = -1
          	}
          	queue := []int{0}
          	dist[0] = 0
          	target := ((n-1)*n + (n - 2)) * 2
          	for head := 0; head < len(queue); head++ {
          		s := queue[head]
          		if s == target {
          			return dist[s]
          		}
          		o, cell := s%2, s/2
          		r, c := cell/n, cell%n
          		nx := []int{}
          		if o == 0 {
          			if c+2 < n && grid[r][c+2] == 0 {
          				nx = append(nx, (r*n+c+1)*2)
          			}
          			if r+1 < n && grid[r+1][c] == 0 && grid[r+1][c+1] == 0 {
          				nx = append(nx, ((r+1)*n+c)*2, (r*n+c)*2+1)
          			}
          		} else {
          			if r+2 < n && grid[r+2][c] == 0 {
          				nx = append(nx, ((r+1)*n+c)*2+1)
          			}
          			if c+1 < n && grid[r][c+1] == 0 && grid[r+1][c+1] == 0 {
          				nx = append(nx, (r*n+c+1)*2+1, (r*n+c)*2)
          			}
          		}
          		for _, t := range nx {
          			if dist[t] == -1 {
          				dist[t] = dist[s] + 1
          				queue = append(queue, t)
          			}
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          fun minimumMoves(grid: Array<IntArray>): Int {
              val n = grid.size
              val total = n * n * 2
              val dist = IntArray(total) { -1 }
              val queue = IntArray(total)
              var head = 0
              var tail = 0
              val target = ((n - 1) * n + (n - 2)) * 2
              dist[0] = 0
              queue[tail++] = 0
              val nx = IntArray(3)
              while (head < tail) {
                  val s = queue[head++]
                  if (s == target) return dist[s]
                  val o = s % 2
                  val cell = s / 2
                  val r = cell / n
                  val c = cell % n
                  var cnt = 0
                  if (o == 0) {
                      if (c + 2 < n && grid[r][c + 2] == 0) nx[cnt++] = (r * n + c + 1) * 2
                      if (r + 1 < n && grid[r + 1][c] == 0 && grid[r + 1][c + 1] == 0) {
                          nx[cnt++] = ((r + 1) * n + c) * 2
                          nx[cnt++] = (r * n + c) * 2 + 1
                      }
                  } else {
                      if (r + 2 < n && grid[r + 2][c] == 0) nx[cnt++] = ((r + 1) * n + c) * 2 + 1
                      if (c + 1 < n && grid[r][c + 1] == 0 && grid[r + 1][c + 1] == 0) {
                          nx[cnt++] = (r * n + c + 1) * 2 + 1
                          nx[cnt++] = (r * n + c) * 2
                      }
                  }
                  for (t in 0 until cnt) {
                      if (dist[nx[t]] == -1) { dist[nx[t]] = dist[s] + 1; queue[tail++] = nx[t] }
                  }
              }
              return -1
          }
        `,
        swift: code`
          func minimumMoves(_ grid: [[Int]]) -> Int {
              let n = grid.count
              var dist = [Int](repeating: -1, count: n * n * 2)
              var queue = [0]
              dist[0] = 0
              let target = ((n - 1) * n + (n - 2)) * 2
              var head = 0
              while head < queue.count {
                  let s = queue[head]
                  head += 1
                  if s == target { return dist[s] }
                  let o = s % 2, cell = s / 2, r = cell / n, c = cell % n
                  var nx = [Int]()
                  if o == 0 {
                      if c + 2 < n && grid[r][c + 2] == 0 { nx.append((r * n + c + 1) * 2) }
                      if r + 1 < n && grid[r + 1][c] == 0 && grid[r + 1][c + 1] == 0 {
                          nx.append(((r + 1) * n + c) * 2)
                          nx.append((r * n + c) * 2 + 1)
                      }
                  } else {
                      if r + 2 < n && grid[r + 2][c] == 0 { nx.append(((r + 1) * n + c) * 2 + 1) }
                      if c + 1 < n && grid[r][c + 1] == 0 && grid[r + 1][c + 1] == 0 {
                          nx.append((r * n + c + 1) * 2 + 1)
                          nx.append((r * n + c) * 2)
                      }
                  }
                  for t in nx where dist[t] == -1 {
                      dist[t] = dist[s] + 1
                      queue.append(t)
                  }
              }
              return -1
          }
        `,
        rust: code`
          fn minimumMoves(grid: Vec<Vec<i32>>) -> i32 {
              let n = grid.len();
              let total = n * n * 2;
              let mut dist = vec![-1i32; total];
              let mut queue: Vec<usize> = vec![0];
              dist[0] = 0;
              let target = ((n - 1) * n + (n - 2)) * 2;
              let mut head = 0;
              while head < queue.len() {
                  let s = queue[head];
                  head += 1;
                  if s == target {
                      return dist[s];
                  }
                  let o = s % 2;
                  let cell = s / 2;
                  let (r, c) = (cell / n, cell % n);
                  let mut nx: Vec<usize> = Vec::new();
                  if o == 0 {
                      if c + 2 < n && grid[r][c + 2] == 0 {
                          nx.push((r * n + c + 1) * 2);
                      }
                      if r + 1 < n && grid[r + 1][c] == 0 && grid[r + 1][c + 1] == 0 {
                          nx.push(((r + 1) * n + c) * 2);
                          nx.push((r * n + c) * 2 + 1);
                      }
                  } else {
                      if r + 2 < n && grid[r + 2][c] == 0 {
                          nx.push(((r + 1) * n + c) * 2 + 1);
                      }
                      if c + 1 < n && grid[r][c + 1] == 0 && grid[r + 1][c + 1] == 0 {
                          nx.push((r * n + c + 1) * 2 + 1);
                          nx.push((r * n + c) * 2);
                      }
                  }
                  for &t in nx.iter() {
                      if dist[t] == -1 {
                          dist[t] = dist[s] + 1;
                          queue.push(t);
                      }
                  }
              }
              -1
          }
        `,
        php: code`
          function minimumMoves($grid) {
              $n = count($grid);
              $dist = array_fill(0, $n * $n * 2, -1);
              $queue = [0];
              $dist[0] = 0;
              $target = (($n - 1) * $n + ($n - 2)) * 2;
              for ($head = 0; $head < count($queue); $head++) {
                  $s = $queue[$head];
                  if ($s == $target) return $dist[$s];
                  $o = $s % 2;
                  $cell = intdiv($s, 2);
                  $r = intdiv($cell, $n);
                  $c = $cell % $n;
                  $nx = [];
                  if ($o == 0) {
                      if ($c + 2 < $n && $grid[$r][$c + 2] == 0) $nx[] = ($r * $n + $c + 1) * 2;
                      if ($r + 1 < $n && $grid[$r + 1][$c] == 0 && $grid[$r + 1][$c + 1] == 0) {
                          $nx[] = (($r + 1) * $n + $c) * 2;
                          $nx[] = ($r * $n + $c) * 2 + 1;
                      }
                  } else {
                      if ($r + 2 < $n && $grid[$r + 2][$c] == 0) $nx[] = (($r + 1) * $n + $c) * 2 + 1;
                      if ($c + 1 < $n && $grid[$r][$c + 1] == 0 && $grid[$r + 1][$c + 1] == 0) {
                          $nx[] = ($r * $n + $c + 1) * 2 + 1;
                          $nx[] = ($r * $n + $c) * 2;
                      }
                  }
                  foreach ($nx as $t) {
                      if ($dist[$t] == -1) { $dist[$t] = $dist[$s] + 1; $queue[] = $t; }
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def minimumMoves(grid)
            n = grid.length
            dist = Array.new(n * n * 2, -1)
            queue = [0]
            dist[0] = 0
            target = ((n - 1) * n + (n - 2)) * 2
            head = 0
            while head < queue.length
              s = queue[head]
              head += 1
              return dist[s] if s == target
              o = s % 2
              cell = s / 2
              r = cell / n
              c = cell % n
              nx = []
              if o == 0
                nx << (r * n + c + 1) * 2 if c + 2 < n && grid[r][c + 2] == 0
                if r + 1 < n && grid[r + 1][c] == 0 && grid[r + 1][c + 1] == 0
                  nx << ((r + 1) * n + c) * 2
                  nx << (r * n + c) * 2 + 1
                end
              else
                nx << ((r + 1) * n + c) * 2 + 1 if r + 2 < n && grid[r + 2][c] == 0
                if c + 1 < n && grid[r][c + 1] == 0 && grid[r + 1][c + 1] == 0
                  nx << (r * n + c + 1) * 2 + 1
                  nx << (r * n + c) * 2
                end
              end
              nx.each do |t|
                if dist[t] == -1
                  dist[t] = dist[s] + 1
                  queue << t
                end
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Image Overlap (LC 835) ──────────────────────────────────────
  (() => {
    const ref = (a: number[][], b: number[][]) => {
      const n = a.length;
      let best = 0;
      for (let dr = -(n - 1); dr <= n - 1; dr++) {
        for (let dc = -(n - 1); dc <= n - 1; dc++) {
          let cnt = 0;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const r = i + dr, c = j + dc;
            if (r >= 0 && c >= 0 && r < n && c < n && a[i][j] === 1 && b[r][c] === 1) cnt++;
          }
          if (cnt > best) best = cnt;
        }
      }
      return best;
    };
    return {
      slug: "image-overlap",
      title: "Image Overlap",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Enumeration", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "largestOverlap", params: [{ name: "img1", type: "int[][]" as const }, { name: "img2", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`img1` and `img2` are two binary images, each an `n x n` matrix of `0`s and `1`s.\n\nYou may **translate** `img1` — slide it any number of cells left, right, up and/or down (no rotation) — and then lay it over `img2`. Cells that slide outside the `n x n` frame are dropped. The **overlap** is the number of positions where both images hold a `1`.\n\nReturn the largest overlap over every possible translation.",
        [
          { in: "img1 = [[1,1,0],[0,1,0],[0,0,0]], img2 = [[0,0,0],[0,1,1],[0,0,1]]", out: "3", note: "Slide `img1` one cell right and one cell down: all three of its 1s land on 1s of `img2`." },
          { in: "img1 = [[1,0],[1,1]], img2 = [[1,1],[0,1]]", out: "2" },
          { in: "img1 = [[0]], img2 = [[0]]", out: "0" },
        ],
        ["n == img1.length == img1[i].length", "n == img2.length == img2[i].length", "1 <= n <= 30", "img1[i][j] is 0 or 1", "img2[i][j] is 0 or 1"]),
      hints: [
        "A translation is a vector `(dr, dc)` with each component between `-(n-1)` and `n-1`.",
        "A 1 at `(i, j)` in `img1` and a 1 at `(r, c)` in `img2` line up under exactly one translation: `(r - i, c - j)`.",
        "Pair every 1 of `img1` with every 1 of `img2`, count how often each translation vector occurs, and return the largest count.",
      ],
      editorial: explain({
        idea: "Instead of trying every shift and counting overlaps, let each pair of 1s vote for the single shift that aligns them; the most-voted shift is the answer and its vote count is the overlap.",
        steps: [
          "List the coordinates of the 1s in `img1` and in `img2`.",
          "For every pair (one from each list), compute `(r - i + n - 1, c - j + n - 1)` and increment that cell of a `(2n-1) × (2n-1)` counter.",
          "Return the largest counter value (0 if either image has no 1s).",
        ],
        why: "Under translation `(dr, dc)` the overlap is the number of 1s `(i, j)` of `img1` whose shifted position `(i + dr, j + dc)` is a 1 of `img2` — exactly the number of pairs that voted for `(dr, dc)`. A shifted cell that leaves the frame cannot hit a 1 of `img2`, so the dropped cells never cast votes.",
        time: "O(n⁴) in the worst case (all ones), typically much less",
        space: "O(n²)",
        pitfalls: [
          "Shifts are in both directions — negative offsets matter as much as positive ones.",
          "Offset the vector by `n - 1` before using it as an array index.",
          "The images are not wrapped around; cells pushed out of the frame are lost.",
        ],
      }),
      examples: [
        { input: "[[1,1,0],[0,1,0],[0,0,0]]\n[[0,0,0],[0,1,1],[0,0,1]]", expectedOutput: "3" },
        { input: "[[1,0],[1,1]]\n[[1,1],[0,1]]", expectedOutput: "2" },
        { input: "[[0]]\n[[0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 30) === 0 ? 1 : ri(rng, 2, pick(rng, [3, 6, 8]));
        const p1 = pick(rng, [0.2, 0.4, 0.6, 0.85]);
        const p2 = pick(rng, [0.2, 0.4, 0.6, 0.85]);
        const img1 = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < p1 ? 1 : 0)));
        let img2: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng() < p2 ? 1 : 0)));
        if (rng() < 0.3) {
          // img2 is a shifted copy of img1 with a little noise
          const dr = ri(rng, -2, 2), dc = ri(rng, -2, 2);
          img2 = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => {
            const i = r - dr, j = c - dc;
            const v = i >= 0 && j >= 0 && i < n && j < n ? img1[i][j] : 0;
            return rng() < 0.1 ? 1 - v : v;
          }));
        }
        return { input: `${fmtIntMat(img1)}\n${fmtIntMat(img2)}`, expectedOutput: String(ref(img1, img2)) };
      },
      solutions: {
        python: code`
          from typing import List

          def largestOverlap(img1: List[List[int]], img2: List[List[int]]) -> int:
              n = len(img1)
              a = [(i, j) for i in range(n) for j in range(n) if img1[i][j] == 1]
              b = [(i, j) for i in range(n) for j in range(n) if img2[i][j] == 1]
              size = 2 * n - 1
              count = [0] * (size * size)
              best = 0
              for ai, aj in a:
                  for bi, bj in b:
                      k = (bi - ai + n - 1) * size + (bj - aj + n - 1)
                      count[k] += 1
                      if count[k] > best:
                          best = count[k]
              return best
        `,
        javascript: code`
          var largestOverlap = function(img1, img2) {
              var n = img1.length, size = 2 * n - 1;
              var ar = [], ac = [], br = [], bc = [];
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < n; j++) {
                      if (img1[i][j] === 1) { ar.push(i); ac.push(j); }
                      if (img2[i][j] === 1) { br.push(i); bc.push(j); }
                  }
              }
              var count = new Array(size * size).fill(0), best = 0;
              for (var x = 0; x < ar.length; x++) {
                  for (var y = 0; y < br.length; y++) {
                      var k = (br[y] - ar[x] + n - 1) * size + (bc[y] - ac[x] + n - 1);
                      count[k]++;
                      if (count[k] > best) best = count[k];
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function largestOverlap(img1: number[][], img2: number[][]): number {
              var n = img1.length, size = 2 * n - 1;
              var ar: number[] = [], ac: number[] = [], br: number[] = [], bc: number[] = [];
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < n; j++) {
                      if (img1[i][j] === 1) { ar.push(i); ac.push(j); }
                      if (img2[i][j] === 1) { br.push(i); bc.push(j); }
                  }
              }
              var count: number[] = [];
              for (var t = 0; t < size * size; t++) count.push(0);
              var best = 0;
              for (var x = 0; x < ar.length; x++) {
                  for (var y = 0; y < br.length; y++) {
                      var k = (br[y] - ar[x] + n - 1) * size + (bc[y] - ac[x] + n - 1);
                      count[k]++;
                      if (count[k] > best) best = count[k];
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int largestOverlap(int[][] img1, int[][] img2) {
              int n = img1.length, size = 2 * n - 1;
              List<int[]> a = new ArrayList<>(), b = new ArrayList<>();
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      if (img1[i][j] == 1) a.add(new int[]{i, j});
                      if (img2[i][j] == 1) b.add(new int[]{i, j});
                  }
              }
              int[] count = new int[size * size];
              int best = 0;
              for (int[] p : a) {
                  for (int[] q : b) {
                      int k = (q[0] - p[0] + n - 1) * size + (q[1] - p[1] + n - 1);
                      if (++count[k] > best) best = count[k];
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int largestOverlap(vector<vector<int>>& img1, vector<vector<int>>& img2) {
              int n = img1.size(), size = 2 * n - 1;
              vector<pair<int, int>> a, b;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      if (img1[i][j] == 1) a.push_back({i, j});
                      if (img2[i][j] == 1) b.push_back({i, j});
                  }
              }
              vector<int> count(size * size, 0);
              int best = 0;
              for (auto& p : a) {
                  for (auto& q : b) {
                      int k = (q.first - p.first + n - 1) * size + (q.second - p.second + n - 1);
                      best = max(best, ++count[k]);
                  }
              }
              return best;
          }
        `,
        c: code`
          int largestOverlap(int** img1, int img1Size, int* img1ColSize, int** img2, int img2Size, int* img2ColSize) {
              int n = img1Size, size = 2 * n - 1;
              int* ar = (int*)malloc(n * n * sizeof(int));
              int* ac = (int*)malloc(n * n * sizeof(int));
              int* br = (int*)malloc(n * n * sizeof(int));
              int* bc = (int*)malloc(n * n * sizeof(int));
              int na = 0, nb = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      if (img1[i][j] == 1) { ar[na] = i; ac[na] = j; na++; }
                      if (img2[i][j] == 1) { br[nb] = i; bc[nb] = j; nb++; }
                  }
              }
              int* count = (int*)calloc(size * size, sizeof(int));
              int best = 0;
              for (int x = 0; x < na; x++) {
                  for (int y = 0; y < nb; y++) {
                      int k = (br[y] - ar[x] + n - 1) * size + (bc[y] - ac[x] + n - 1);
                      if (++count[k] > best) best = count[k];
                  }
              }
              free(ar); free(ac); free(br); free(bc); free(count);
              return best;
          }
        `,
        csharp: code`
          public static int LargestOverlap(int[][] img1, int[][] img2)
          {
              int n = img1.Length, size = 2 * n - 1;
              var a = new List<int[]>();
              var b = new List<int[]>();
              for (int i = 0; i < n; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      if (img1[i][j] == 1) a.Add(new[] { i, j });
                      if (img2[i][j] == 1) b.Add(new[] { i, j });
                  }
              }
              var count = new int[size * size];
              int best = 0;
              foreach (var p in a)
              {
                  foreach (var q in b)
                  {
                      int k = (q[0] - p[0] + n - 1) * size + (q[1] - p[1] + n - 1);
                      count[k]++;
                      if (count[k] > best) best = count[k];
                  }
              }
              return best;
          }
        `,
        go: code`
          func largestOverlap(img1 [][]int, img2 [][]int) int {
          	n := len(img1)
          	size := 2*n - 1
          	var ar, ac, br, bc []int
          	for i := 0; i < n; i++ {
          		for j := 0; j < n; j++ {
          			if img1[i][j] == 1 {
          				ar = append(ar, i)
          				ac = append(ac, j)
          			}
          			if img2[i][j] == 1 {
          				br = append(br, i)
          				bc = append(bc, j)
          			}
          		}
          	}
          	count := make([]int, size*size)
          	best := 0
          	for x := range ar {
          		for y := range br {
          			k := (br[y]-ar[x]+n-1)*size + (bc[y] - ac[x] + n - 1)
          			count[k]++
          			if count[k] > best {
          				best = count[k]
          			}
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun largestOverlap(img1: Array<IntArray>, img2: Array<IntArray>): Int {
              val n = img1.size
              val size = 2 * n - 1
              val a = ArrayList<IntArray>()
              val b = ArrayList<IntArray>()
              for (i in 0 until n) {
                  for (j in 0 until n) {
                      if (img1[i][j] == 1) a.add(intArrayOf(i, j))
                      if (img2[i][j] == 1) b.add(intArrayOf(i, j))
                  }
              }
              val count = IntArray(size * size)
              var best = 0
              for (p in a) {
                  for (q in b) {
                      val k = (q[0] - p[0] + n - 1) * size + (q[1] - p[1] + n - 1)
                      count[k]++
                      if (count[k] > best) best = count[k]
                  }
              }
              return best
          }
        `,
        swift: code`
          func largestOverlap(_ img1: [[Int]], _ img2: [[Int]]) -> Int {
              let n = img1.count, size = 2 * n - 1
              var a = [(Int, Int)](), b = [(Int, Int)]()
              for i in 0..<n {
                  for j in 0..<n {
                      if img1[i][j] == 1 { a.append((i, j)) }
                      if img2[i][j] == 1 { b.append((i, j)) }
                  }
              }
              var count = [Int](repeating: 0, count: size * size)
              var best = 0
              for p in a {
                  for q in b {
                      let k = (q.0 - p.0 + n - 1) * size + (q.1 - p.1 + n - 1)
                      count[k] += 1
                      if count[k] > best { best = count[k] }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn largestOverlap(img1: Vec<Vec<i32>>, img2: Vec<Vec<i32>>) -> i32 {
              let n = img1.len() as i32;
              let size = 2 * n - 1;
              let mut a: Vec<(i32, i32)> = Vec::new();
              let mut b: Vec<(i32, i32)> = Vec::new();
              for i in 0..n as usize {
                  for j in 0..n as usize {
                      if img1[i][j] == 1 {
                          a.push((i as i32, j as i32));
                      }
                      if img2[i][j] == 1 {
                          b.push((i as i32, j as i32));
                      }
                  }
              }
              let mut count = vec![0i32; (size * size) as usize];
              let mut best = 0;
              for &(ai, aj) in a.iter() {
                  for &(bi, bj) in b.iter() {
                      let k = ((bi - ai + n - 1) * size + (bj - aj + n - 1)) as usize;
                      count[k] += 1;
                      if count[k] > best {
                          best = count[k];
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function largestOverlap($img1, $img2) {
              $n = count($img1);
              $size = 2 * $n - 1;
              $a = [];
              $b = [];
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      if ($img1[$i][$j] == 1) $a[] = [$i, $j];
                      if ($img2[$i][$j] == 1) $b[] = [$i, $j];
                  }
              }
              $cnt = array_fill(0, $size * $size, 0);
              $best = 0;
              foreach ($a as $p) {
                  foreach ($b as $q) {
                      $k = ($q[0] - $p[0] + $n - 1) * $size + ($q[1] - $p[1] + $n - 1);
                      $cnt[$k]++;
                      if ($cnt[$k] > $best) $best = $cnt[$k];
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def largestOverlap(img1, img2)
            n = img1.length
            size = 2 * n - 1
            a = []
            b = []
            n.times do |i|
              n.times do |j|
                a << [i, j] if img1[i][j] == 1
                b << [i, j] if img2[i][j] == 1
              end
            end
            count = Array.new(size * size, 0)
            best = 0
            a.each do |ai, aj|
              b.each do |bi, bj|
                k = (bi - ai + n - 1) * size + (bj - aj + n - 1)
                count[k] += 1
                best = count[k] if count[k] > best
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Largest 1-Bordered Square (LC 1139) ─────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      let best = 0;
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        for (let k = 1; r + k <= m && c + k <= n; k++) {
          let ok = true;
          for (let t = 0; t < k && ok; t++) {
            if (!grid[r][c + t] || !grid[r + k - 1][c + t] || !grid[r + t][c] || !grid[r + t][c + k - 1]) ok = false;
          }
          if (ok && k > best) best = k;
        }
      }
      return best * best;
    };
    return {
      slug: "largest-1-bordered-square",
      title: "Largest 1-Bordered Square",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Samsung", "Google"],
      signature: { funcName: "largest1BorderedSquare", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a binary matrix `grid` of `0`s and `1`s. Find the largest **square** sub-grid whose **border** — its top row, bottom row, left column and right column — consists entirely of `1`s. The cells strictly inside the border may hold anything.\n\nReturn the number of cells in that square (its side length squared), or `0` if the grid has no `1` at all.",
        [
          { in: "grid = [[1,1,1,0],[1,0,1,1],[1,1,1,1]]", out: "9", note: "The 3 × 3 square in the first three columns has a border of 1s; the 0 in its centre does not matter." },
          { in: "grid = [[0,1],[1,1]]", out: "1", note: "The 2 × 2 square fails at its top-left corner, so the best is a single cell." },
          { in: "grid = [[0,0],[0,0]]", out: "0" },
        ],
        ["1 <= grid.length <= 100", "1 <= grid[0].length <= 100", "grid[i][j] is 0 or 1"]),
      hints: [
        "A square of side `k` with bottom-right corner `(i, j)` needs four runs of at least `k` ones: leftwards and upwards from `(i, j)`, upwards from `(i, j-k+1)` and leftwards from `(i-k+1, j)`.",
        "Precompute, for every cell, how many consecutive 1s end there going left and going up.",
        "For each cell as a bottom-right corner, try sides from `min(left, up)` downwards and stop at the first side whose other two edges are long enough.",
      ],
      editorial: explain({
        idea: "With run-length tables `left[i][j]` (consecutive 1s ending at `(i, j)` along the row) and `up[i][j]` (along the column), each candidate square's border is verified in O(1).",
        steps: [
          "Scan the grid row by row. For a 1 at `(i, j)` set `left[i][j] = left[i][j-1] + 1` and `up[i][j] = up[i-1][j] + 1` (0 for a 0 cell).",
          "Treat `(i, j)` as the bottom-right corner. For `k` from `min(left[i][j], up[i][j])` down to `best + 1`: the bottom and right edges are guaranteed; check the left edge `up[i][j-k+1] >= k` and the top edge `left[i-k+1][j] >= k`.",
          "On the first `k` that passes, record it as the new best side and stop trying smaller sides at this corner.",
          "Return `best * best`.",
        ],
        why: "A square's border is exactly four straight runs of 1s of length `k` meeting at its corners, and each run is checked by one table lookup at the run's far end. Every square is tried at its bottom-right corner, so the maximum is found.",
        time: "O(m · n · min(m, n))",
        space: "O(m · n)",
        pitfalls: [
          "The interior does not need to be 1s — only the border.",
          "Return the area (side squared), not the side length.",
          "A single 1 is already a valid 1 × 1 square.",
        ],
      }),
      examples: [
        { input: "[[1,1,1,0],[1,0,1,1],[1,1,1,1]]", expectedOutput: "9" },
        { input: "[[0,1],[1,1]]", expectedOutput: "1" },
        { input: "[[0,0],[0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 0, 20) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 7, 10]));
        const n = ri(rng, 0, 20) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 7, 10]));
        const p = pick(rng, [0.05, 0.5, 0.75, 0.9, 0.97]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        if (rng() < 0.5) {
          // plant a square whose border is all 1s (its interior stays random)
          const k = ri(rng, Math.min(2, m, n), Math.min(m, n));
          const r0 = ri(rng, 0, m - k), c0 = ri(rng, 0, n - k);
          for (let t = 0; t < k; t++) {
            grid[r0][c0 + t] = 1; grid[r0 + k - 1][c0 + t] = 1;
            grid[r0 + t][c0] = 1; grid[r0 + t][c0 + k - 1] = 1;
          }
        }
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def largest1BorderedSquare(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              left = [[0] * n for _ in range(m)]
              up = [[0] * n for _ in range(m)]
              best = 0
              for i in range(m):
                  for j in range(n):
                      if grid[i][j] == 0:
                          continue
                      left[i][j] = (left[i][j - 1] if j > 0 else 0) + 1
                      up[i][j] = (up[i - 1][j] if i > 0 else 0) + 1
                      k = min(left[i][j], up[i][j])
                      while k > best:
                          if up[i][j - k + 1] >= k and left[i - k + 1][j] >= k:
                              best = k
                              break
                          k -= 1
              return best * best
        `,
        javascript: code`
          var largest1BorderedSquare = function(grid) {
              var m = grid.length, n = grid[0].length, best = 0;
              var left = [], up = [];
              for (var r = 0; r < m; r++) { left.push(new Array(n).fill(0)); up.push(new Array(n).fill(0)); }
              for (var i = 0; i < m; i++) {
                  for (var j = 0; j < n; j++) {
                      if (grid[i][j] === 0) continue;
                      left[i][j] = (j > 0 ? left[i][j - 1] : 0) + 1;
                      up[i][j] = (i > 0 ? up[i - 1][j] : 0) + 1;
                      for (var k = Math.min(left[i][j], up[i][j]); k > best; k--) {
                          if (up[i][j - k + 1] >= k && left[i - k + 1][j] >= k) { best = k; break; }
                      }
                  }
              }
              return best * best;
          };
        `,
        typescript: code`
          function largest1BorderedSquare(grid: number[][]): number {
              var m = grid.length, n = grid[0].length, best = 0;
              var left: number[][] = [], up: number[][] = [];
              for (var r = 0; r < m; r++) {
                  var a: number[] = [], b: number[] = [];
                  for (var c = 0; c < n; c++) { a.push(0); b.push(0); }
                  left.push(a); up.push(b);
              }
              for (var i = 0; i < m; i++) {
                  for (var j = 0; j < n; j++) {
                      if (grid[i][j] === 0) continue;
                      left[i][j] = (j > 0 ? left[i][j - 1] : 0) + 1;
                      up[i][j] = (i > 0 ? up[i - 1][j] : 0) + 1;
                      for (var k = Math.min(left[i][j], up[i][j]); k > best; k--) {
                          if (up[i][j - k + 1] >= k && left[i - k + 1][j] >= k) { best = k; break; }
                      }
                  }
              }
              return best * best;
          }
        `,
        java: code`
          public static int largest1BorderedSquare(int[][] grid) {
              int m = grid.length, n = grid[0].length, best = 0;
              int[][] left = new int[m][n], up = new int[m][n];
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      if (grid[i][j] == 0) continue;
                      left[i][j] = (j > 0 ? left[i][j - 1] : 0) + 1;
                      up[i][j] = (i > 0 ? up[i - 1][j] : 0) + 1;
                      for (int k = Math.min(left[i][j], up[i][j]); k > best; k--) {
                          if (up[i][j - k + 1] >= k && left[i - k + 1][j] >= k) { best = k; break; }
                      }
                  }
              }
              return best * best;
          }
        `,
        cpp: code`
          int largest1BorderedSquare(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size(), best = 0;
              vector<vector<int>> left(m, vector<int>(n, 0)), up(m, vector<int>(n, 0));
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      if (grid[i][j] == 0) continue;
                      left[i][j] = (j > 0 ? left[i][j - 1] : 0) + 1;
                      up[i][j] = (i > 0 ? up[i - 1][j] : 0) + 1;
                      for (int k = min(left[i][j], up[i][j]); k > best; k--) {
                          if (up[i][j - k + 1] >= k && left[i - k + 1][j] >= k) { best = k; break; }
                      }
                  }
              }
              return best * best;
          }
        `,
        c: code`
          int largest1BorderedSquare(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0], best = 0;
              int* left = (int*)calloc(m * n, sizeof(int));
              int* up = (int*)calloc(m * n, sizeof(int));
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      if (grid[i][j] == 0) continue;
                      left[i * n + j] = (j > 0 ? left[i * n + j - 1] : 0) + 1;
                      up[i * n + j] = (i > 0 ? up[(i - 1) * n + j] : 0) + 1;
                      int k = left[i * n + j] < up[i * n + j] ? left[i * n + j] : up[i * n + j];
                      for (; k > best; k--) {
                          if (up[i * n + j - k + 1] >= k && left[(i - k + 1) * n + j] >= k) { best = k; break; }
                      }
                  }
              }
              free(left);
              free(up);
              return best * best;
          }
        `,
        csharp: code`
          public static int Largest1BorderedSquare(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length, best = 0;
              var left = new int[m, n];
              var up = new int[m, n];
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      if (grid[i][j] == 0) continue;
                      left[i, j] = (j > 0 ? left[i, j - 1] : 0) + 1;
                      up[i, j] = (i > 0 ? up[i - 1, j] : 0) + 1;
                      for (int k = Math.Min(left[i, j], up[i, j]); k > best; k--)
                      {
                          if (up[i, j - k + 1] >= k && left[i - k + 1, j] >= k) { best = k; break; }
                      }
                  }
              }
              return best * best;
          }
        `,
        go: code`
          func largest1BorderedSquare(grid [][]int) int {
          	m, n, best := len(grid), len(grid[0]), 0
          	left := make([][]int, m)
          	up := make([][]int, m)
          	for i := range left {
          		left[i] = make([]int, n)
          		up[i] = make([]int, n)
          	}
          	for i := 0; i < m; i++ {
          		for j := 0; j < n; j++ {
          			if grid[i][j] == 0 {
          				continue
          			}
          			left[i][j], up[i][j] = 1, 1
          			if j > 0 {
          				left[i][j] += left[i][j-1]
          			}
          			if i > 0 {
          				up[i][j] += up[i-1][j]
          			}
          			k := left[i][j]
          			if up[i][j] < k {
          				k = up[i][j]
          			}
          			for ; k > best; k-- {
          				if up[i][j-k+1] >= k && left[i-k+1][j] >= k {
          					best = k
          					break
          				}
          			}
          		}
          	}
          	return best * best
          }
        `,
        kotlin: code`
          fun largest1BorderedSquare(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              var best = 0
              val left = Array(m) { IntArray(n) }
              val up = Array(m) { IntArray(n) }
              for (i in 0 until m) {
                  for (j in 0 until n) {
                      if (grid[i][j] == 0) continue
                      left[i][j] = (if (j > 0) left[i][j - 1] else 0) + 1
                      up[i][j] = (if (i > 0) up[i - 1][j] else 0) + 1
                      var k = minOf(left[i][j], up[i][j])
                      while (k > best) {
                          if (up[i][j - k + 1] >= k && left[i - k + 1][j] >= k) { best = k; break }
                          k--
                      }
                  }
              }
              return best * best
          }
        `,
        swift: code`
          func largest1BorderedSquare(_ grid: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count
              var best = 0
              var left = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)
              var up = left
              for i in 0..<m {
                  for j in 0..<n {
                      if grid[i][j] == 0 { continue }
                      left[i][j] = (j > 0 ? left[i][j - 1] : 0) + 1
                      up[i][j] = (i > 0 ? up[i - 1][j] : 0) + 1
                      var k = min(left[i][j], up[i][j])
                      while k > best {
                          if up[i][j - k + 1] >= k && left[i - k + 1][j] >= k { best = k; break }
                          k -= 1
                      }
                  }
              }
              return best * best
          }
        `,
        rust: code`
          fn largest1BorderedSquare(grid: Vec<Vec<i32>>) -> i32 {
              let m = grid.len();
              let n = grid[0].len();
              let mut best = 0usize;
              let mut left = vec![vec![0usize; n]; m];
              let mut up = vec![vec![0usize; n]; m];
              for i in 0..m {
                  for j in 0..n {
                      if grid[i][j] == 0 {
                          continue;
                      }
                      left[i][j] = if j > 0 { left[i][j - 1] } else { 0 } + 1;
                      up[i][j] = if i > 0 { up[i - 1][j] } else { 0 } + 1;
                      let mut k = std::cmp::min(left[i][j], up[i][j]);
                      while k > best {
                          if up[i][j + 1 - k] >= k && left[i + 1 - k][j] >= k {
                              best = k;
                              break;
                          }
                          k -= 1;
                      }
                  }
              }
              (best * best) as i32
          }
        `,
        php: code`
          function largest1BorderedSquare($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $best = 0;
              $left = array_fill(0, $m, array_fill(0, $n, 0));
              $up = array_fill(0, $m, array_fill(0, $n, 0));
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      if ($grid[$i][$j] == 0) continue;
                      $left[$i][$j] = ($j > 0 ? $left[$i][$j - 1] : 0) + 1;
                      $up[$i][$j] = ($i > 0 ? $up[$i - 1][$j] : 0) + 1;
                      for ($k = min($left[$i][$j], $up[$i][$j]); $k > $best; $k--) {
                          if ($up[$i][$j - $k + 1] >= $k && $left[$i - $k + 1][$j] >= $k) { $best = $k; break; }
                      }
                  }
              }
              return $best * $best;
          }
        `,
        ruby: code`
          def largest1BorderedSquare(grid)
            m = grid.length
            n = grid[0].length
            best = 0
            left = Array.new(m) { Array.new(n, 0) }
            up = Array.new(m) { Array.new(n, 0) }
            m.times do |i|
              n.times do |j|
                next if grid[i][j] == 0
                left[i][j] = (j > 0 ? left[i][j - 1] : 0) + 1
                up[i][j] = (i > 0 ? up[i - 1][j] : 0) + 1
                k = [left[i][j], up[i][j]].min
                while k > best
                  if up[i][j - k + 1] >= k && left[i - k + 1][j] >= k
                    best = k
                    break
                  end
                  k -= 1
                end
              end
            end
            best * best
          end
        `,
      },
    };
  })(),

  // ── Minimum Swaps to Arrange a Binary Grid (LC 1536) ────────────
  (() => {
    const trailing = (grid: number[][]) => grid.map((row) => {
      let z = 0;
      for (let j = row.length - 1; j >= 0 && row[j] === 0; j--) z++;
      return z;
    });
    const greedy = (tz0: number[]) => {
      const tz = tz0.slice(), n = tz.length;
      let swaps = 0;
      for (let i = 0; i < n; i++) {
        let j = i;
        while (j < n && tz[j] < n - 1 - i) j++;
        if (j === n) return -1;
        for (; j > i; j--) { [tz[j], tz[j - 1]] = [tz[j - 1], tz[j]]; swaps++; }
      }
      return swaps;
    };
    // Brute force for small n: BFS over row orders (rows only matter through their trailing zeros).
    const bfs = (tz0: number[]) => {
      const n = tz0.length;
      const ok = (t: number[]) => t.every((z, i) => z >= n - 1 - i);
      const seen = new Set<string>([tz0.join(",")]);
      let frontier = [tz0];
      for (let d = 0; frontier.length; d++) {
        const next: number[][] = [];
        for (const t of frontier) {
          if (ok(t)) return d;
          for (let i = 0; i + 1 < n; i++) {
            const u = t.slice();
            [u[i], u[i + 1]] = [u[i + 1], u[i]];
            const key = u.join(",");
            if (!seen.has(key)) { seen.add(key); next.push(u); }
          }
        }
        frontier = next;
      }
      return -1;
    };
    const ref = (grid: number[][]) => {
      const tz = trailing(grid);
      return grid.length <= 6 ? bfs(tz) : greedy(tz);
    };
    return {
      slug: "minimum-swaps-to-arrange-a-binary-grid",
      title: "Minimum Swaps to Arrange a Binary Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Matrix", "Amazon", "Microsoft"],
      signature: { funcName: "minSwaps", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`grid` is an `n x n` binary matrix. In one step you may swap two **adjacent rows**.\n\nThe grid is **valid** when every cell strictly above the main diagonal is `0` — that is, `grid[i][j] == 0` whenever `j > i`.\n\nReturn the minimum number of steps needed to make the grid valid, or `-1` if no sequence of swaps can do it.",
        [
          { in: "grid = [[1,1,0],[1,0,0],[0,1,1]]", out: "1", note: "Swapping the first two rows gives `[[1,0,0],[1,1,0],[0,1,1]]`." },
          { in: "grid = [[0,0,1],[0,1,0],[1,0,0]]", out: "3", note: "The last row must climb to the top (two swaps), then the old first row must move below the old second row (one more)." },
          { in: "grid = [[0,1,0],[1,0,1],[0,0,1]]", out: "-1", note: "The top row needs two trailing zeros and no row has them." },
        ],
        ["n == grid.length == grid[i].length", "1 <= n <= 200", "grid[i][j] is 0 or 1"]),
      hints: [
        "Only one number per row matters: how many zeros it ends with.",
        "Row `i` (0-indexed) of a valid grid must end with at least `n - 1 - i` zeros, so the top row has the strictest requirement.",
        "Fill positions from the top: bring up the nearest row below that meets the requirement, paying one swap per row it passes. If no such row exists, return `-1`.",
      ],
      editorial: explain({
        idea: "Reduce each row to its count of trailing zeros, then fill the positions top-down, each time bubbling up the **closest** row that is good enough.",
        steps: [
          "Compute `tz[r]`, the number of trailing zeros of row `r`.",
          "For `i = 0 .. n-1`, find the first `j >= i` with `tz[j] >= n - 1 - i`. If none, return `-1`.",
          "Move it to position `i` by adjacent swaps (`j - i` of them), shifting the rows in between down by one, and add `j - i` to the answer.",
          "Return the total.",
        ],
        why: "Requirements only get weaker going down. Any row that satisfies position `i` also satisfies every later position, so taking the nearest qualifying row is never worse: rows passed over keep their relative order and only move down, where their requirement is weaker, and moving a farther row instead would cost at least as many swaps. A standard exchange argument turns any optimal sequence into the greedy one without increasing its length.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Choose the nearest qualifying row, not the one with the most trailing zeros — that would waste a strong row on an easy position and can cost extra swaps.",
          "Rows move by adjacent swaps, so moving row `j` to `i` costs `j - i` and shifts the others; simulate the shift.",
          "Count trailing zeros, not total zeros.",
        ],
      }),
      examples: [
        { input: "[[1,1,0],[1,0,0],[0,1,1]]", expectedOutput: "1" },
        { input: "[[0,0,1],[0,1,0],[1,0,0]]", expectedOutput: "3" },
        { input: "[[0,1,0],[1,0,1],[0,0,1]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 30) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 6, 10]));
        let tz: number[];
        if (rng() < 0.6) {
          // a solvable instance: a shuffled set of rows that is enough for every position
          tz = shuffle(rng, Array.from({ length: n }, (_, i) => Math.min(n, n - 1 - i + (rng() < 0.3 ? ri(rng, 0, 2) : 0))));
        } else {
          tz = Array.from({ length: n }, () => ri(rng, 0, n));
        }
        const grid = tz.map((z) => Array.from({ length: n }, (_, j) => {
          if (j >= n - z) return 0;
          if (j === n - z - 1) return 1;
          return rng() < 0.5 ? 1 : 0;
        }));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minSwaps(grid: List[List[int]]) -> int:
              n = len(grid)
              tz = []
              for row in grid:
                  z = 0
                  j = n - 1
                  while j >= 0 and row[j] == 0:
                      z += 1
                      j -= 1
                  tz.append(z)
              swaps = 0
              for i in range(n):
                  j = i
                  while j < n and tz[j] < n - 1 - i:
                      j += 1
                  if j == n:
                      return -1
                  swaps += j - i
                  tz.insert(i, tz.pop(j))
              return swaps
        `,
        javascript: code`
          var minSwaps = function(grid) {
              var n = grid.length, tz = [];
              for (var r = 0; r < n; r++) {
                  var z = 0;
                  for (var c = n - 1; c >= 0 && grid[r][c] === 0; c--) z++;
                  tz.push(z);
              }
              var swaps = 0;
              for (var i = 0; i < n; i++) {
                  var j = i;
                  while (j < n && tz[j] < n - 1 - i) j++;
                  if (j === n) return -1;
                  for (; j > i; j--) {
                      var t = tz[j]; tz[j] = tz[j - 1]; tz[j - 1] = t;
                      swaps++;
                  }
              }
              return swaps;
          };
        `,
        typescript: code`
          function minSwaps(grid: number[][]): number {
              var n = grid.length, tz: number[] = [];
              for (var r = 0; r < n; r++) {
                  var z = 0;
                  for (var c = n - 1; c >= 0 && grid[r][c] === 0; c--) z++;
                  tz.push(z);
              }
              var swaps = 0;
              for (var i = 0; i < n; i++) {
                  var j = i;
                  while (j < n && tz[j] < n - 1 - i) j++;
                  if (j === n) return -1;
                  for (; j > i; j--) {
                      var t = tz[j]; tz[j] = tz[j - 1]; tz[j - 1] = t;
                      swaps++;
                  }
              }
              return swaps;
          }
        `,
        java: code`
          public static int minSwaps(int[][] grid) {
              int n = grid.length;
              int[] tz = new int[n];
              for (int r = 0; r < n; r++) {
                  int z = 0;
                  for (int c = n - 1; c >= 0 && grid[r][c] == 0; c--) z++;
                  tz[r] = z;
              }
              int swaps = 0;
              for (int i = 0; i < n; i++) {
                  int j = i;
                  while (j < n && tz[j] < n - 1 - i) j++;
                  if (j == n) return -1;
                  for (; j > i; j--) {
                      int t = tz[j]; tz[j] = tz[j - 1]; tz[j - 1] = t;
                      swaps++;
                  }
              }
              return swaps;
          }
        `,
        cpp: code`
          int minSwaps(vector<vector<int>>& grid) {
              int n = grid.size();
              vector<int> tz(n, 0);
              for (int r = 0; r < n; r++) {
                  int z = 0;
                  for (int c = n - 1; c >= 0 && grid[r][c] == 0; c--) z++;
                  tz[r] = z;
              }
              int swaps = 0;
              for (int i = 0; i < n; i++) {
                  int j = i;
                  while (j < n && tz[j] < n - 1 - i) j++;
                  if (j == n) return -1;
                  for (; j > i; j--) {
                      swap(tz[j], tz[j - 1]);
                      swaps++;
                  }
              }
              return swaps;
          }
        `,
        c: code`
          int minSwaps(int** grid, int gridSize, int* gridColSize) {
              int n = gridSize;
              int* tz = (int*)malloc(n * sizeof(int));
              for (int r = 0; r < n; r++) {
                  int z = 0;
                  for (int c = n - 1; c >= 0 && grid[r][c] == 0; c--) z++;
                  tz[r] = z;
              }
              int swaps = 0;
              for (int i = 0; i < n; i++) {
                  int j = i;
                  while (j < n && tz[j] < n - 1 - i) j++;
                  if (j == n) { free(tz); return -1; }
                  for (; j > i; j--) {
                      int t = tz[j]; tz[j] = tz[j - 1]; tz[j - 1] = t;
                      swaps++;
                  }
              }
              free(tz);
              return swaps;
          }
        `,
        csharp: code`
          public static int MinSwaps(int[][] grid)
          {
              int n = grid.Length;
              var tz = new int[n];
              for (int r = 0; r < n; r++)
              {
                  int z = 0;
                  for (int c = n - 1; c >= 0 && grid[r][c] == 0; c--) z++;
                  tz[r] = z;
              }
              int swaps = 0;
              for (int i = 0; i < n; i++)
              {
                  int j = i;
                  while (j < n && tz[j] < n - 1 - i) j++;
                  if (j == n) return -1;
                  for (; j > i; j--)
                  {
                      int t = tz[j]; tz[j] = tz[j - 1]; tz[j - 1] = t;
                      swaps++;
                  }
              }
              return swaps;
          }
        `,
        go: code`
          func minSwaps(grid [][]int) int {
          	n := len(grid)
          	tz := make([]int, n)
          	for r := 0; r < n; r++ {
          		z := 0
          		for c := n - 1; c >= 0 && grid[r][c] == 0; c-- {
          			z++
          		}
          		tz[r] = z
          	}
          	swaps := 0
          	for i := 0; i < n; i++ {
          		j := i
          		for j < n && tz[j] < n-1-i {
          			j++
          		}
          		if j == n {
          			return -1
          		}
          		for ; j > i; j-- {
          			tz[j], tz[j-1] = tz[j-1], tz[j]
          			swaps++
          		}
          	}
          	return swaps
          }
        `,
        kotlin: code`
          fun minSwaps(grid: Array<IntArray>): Int {
              val n = grid.size
              val tz = IntArray(n)
              for (r in 0 until n) {
                  var z = 0
                  var c = n - 1
                  while (c >= 0 && grid[r][c] == 0) { z++; c-- }
                  tz[r] = z
              }
              var swaps = 0
              for (i in 0 until n) {
                  var j = i
                  while (j < n && tz[j] < n - 1 - i) j++
                  if (j == n) return -1
                  while (j > i) {
                      val t = tz[j]; tz[j] = tz[j - 1]; tz[j - 1] = t
                      j--
                      swaps++
                  }
              }
              return swaps
          }
        `,
        swift: code`
          func minSwaps(_ grid: [[Int]]) -> Int {
              let n = grid.count
              var tz = [Int](repeating: 0, count: n)
              for r in 0..<n {
                  var z = 0
                  var c = n - 1
                  while c >= 0 && grid[r][c] == 0 { z += 1; c -= 1 }
                  tz[r] = z
              }
              var swaps = 0
              for i in 0..<n {
                  var j = i
                  while j < n && tz[j] < n - 1 - i { j += 1 }
                  if j == n { return -1 }
                  while j > i {
                      tz.swapAt(j, j - 1)
                      j -= 1
                      swaps += 1
                  }
              }
              return swaps
          }
        `,
        rust: code`
          fn minSwaps(grid: Vec<Vec<i32>>) -> i32 {
              let n = grid.len();
              let mut tz: Vec<usize> = Vec::with_capacity(n);
              for r in 0..n {
                  let mut z = 0;
                  while z < n && grid[r][n - 1 - z] == 0 {
                      z += 1;
                  }
                  tz.push(z);
              }
              let mut swaps = 0;
              for i in 0..n {
                  let mut j = i;
                  while j < n && tz[j] + i + 1 < n {
                      j += 1;
                  }
                  if j == n {
                      return -1;
                  }
                  while j > i {
                      tz.swap(j, j - 1);
                      j -= 1;
                      swaps += 1;
                  }
              }
              swaps
          }
        `,
        php: code`
          function minSwaps($grid) {
              $n = count($grid);
              $tz = [];
              for ($r = 0; $r < $n; $r++) {
                  $z = 0;
                  for ($c = $n - 1; $c >= 0 && $grid[$r][$c] == 0; $c--) $z++;
                  $tz[] = $z;
              }
              $swaps = 0;
              for ($i = 0; $i < $n; $i++) {
                  $j = $i;
                  while ($j < $n && $tz[$j] < $n - 1 - $i) $j++;
                  if ($j == $n) return -1;
                  for (; $j > $i; $j--) {
                      $t = $tz[$j]; $tz[$j] = $tz[$j - 1]; $tz[$j - 1] = $t;
                      $swaps++;
                  }
              }
              return $swaps;
          }
        `,
        ruby: code`
          def minSwaps(grid)
            n = grid.length
            tz = grid.map do |row|
              z = 0
              c = n - 1
              while c >= 0 && row[c] == 0
                z += 1
                c -= 1
              end
              z
            end
            swaps = 0
            n.times do |i|
              j = i
              j += 1 while j < n && tz[j] < n - 1 - i
              return -1 if j == n
              swaps += j - i
              tz.insert(i, tz.delete_at(j))
            end
            swaps
          end
        `,
      },
    };
  })(),

  // ── Battleships in a Board (LC 419) ─────────────────────────────
  (() => {
    const ref = (board: string[]) => {
      const m = board.length, n = board[0].length;
      const seen = board.map((row) => Array.from(row, () => false));
      let ships = 0;
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (board[i][j] !== "X" || seen[i][j]) continue;
        ships++;
        const stack: Array<[number, number]> = [[i, j]];
        seen[i][j] = true;
        while (stack.length) {
          const [r, c] = stack.pop()!;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const a = r + dr, b = c + dc;
            if (a >= 0 && b >= 0 && a < m && b < n && board[a][b] === "X" && !seen[a][b]) { seen[a][b] = true; stack.push([a, b]); }
          }
        }
      }
      return ships;
    };
    return {
      slug: "battleships-in-a-board",
      title: "Battleships in a Board",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Depth-First Search", "Matrix", "Microsoft", "Amazon", "Meta"],
      signature: { funcName: "countBattleships", params: [{ name: "board", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "`board` is an `m x n` grid given as `m` strings, where `'X'` is part of a battleship and `'.'` is open water.\n\nEvery battleship is a straight line of cells: `1 x k` (horizontal) or `k x 1` (vertical) for some `k >= 1`. Two battleships never touch along an edge — at least one water cell separates them horizontally and vertically (they may meet diagonally).\n\nReturn the number of battleships on the board.",
        [
          { in: "board = [\"X..X\",\"...X\",\"XX.X\"]", out: "3", note: "A single-cell ship at the top-left, a vertical ship in the last column and a horizontal ship of length 2 at the bottom-left." },
          { in: "board = [\".\"]", out: "0" },
          { in: "board = [\"X.X\",\".X.\"]", out: "3", note: "Ships that meet only at corners are separate ships." },
        ],
        ["m == board.length", "n == board[i].length", "1 <= m, n <= 200", "board[i][j] is 'X' or '.'", "the board is a valid arrangement of battleships"],
        "Can you count them in one pass with O(1) extra memory and without modifying the board?"),
      hints: [
        "Flood-filling each group of `'X'` cells works, but the shapes are so restricted that you do not need to.",
        "Every ship has exactly one top-left cell — its first cell in reading order.",
        "Count the `'X'` cells whose upper neighbour and left neighbour are both not `'X'`.",
      ],
      editorial: explain({
        idea: "Count each ship once at its head — the cell with no `'X'` directly above it or directly to its left.",
        steps: [
          "Scan every cell `(i, j)`.",
          "Skip it unless it is `'X'`.",
          "Skip it if `(i-1, j)` is `'X'` or `(i, j-1)` is `'X'` — it continues a ship already counted.",
          "Otherwise add one.",
        ],
        why: "A horizontal ship's cells, other than the first, all have an `'X'` to their left; a vertical ship's have one above. The first cell of a ship has neither, because ships are straight and no other ship touches it along an edge. So exactly one cell per ship passes the test.",
        time: "O(m · n)",
        space: "O(1)",
        pitfalls: [
          "Diagonal neighbours do not join ships — check only above and to the left.",
          "Guard the first row and the first column before looking up or left.",
          "This trick relies on the board being valid; on arbitrary shapes you would need a flood fill.",
        ],
      }),
      examples: [
        { input: '["X..X","...X","XX.X"]', expectedOutput: "3" },
        { input: '["."]', expectedOutput: "0" },
        { input: '["X.X",".X."]', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [4, 7, 10]));
        const n = ri(rng, 1, pick(rng, [4, 7, 10]));
        const g = Array.from({ length: m }, () => new Array<string>(n).fill("."));
        const attempts = ri(rng, 0, pick(rng, [3, 10, 30]));
        for (let a = 0; a < attempts; a++) {
          const horiz = rng() < 0.5;
          const len = ri(rng, 1, Math.max(1, Math.min(4, horiz ? n : m)));
          const r = ri(rng, 0, horiz ? m - 1 : m - len);
          const c = ri(rng, 0, horiz ? n - len : n - 1);
          if (r < 0 || c < 0) continue;
          const cells: Array<[number, number]> = [];
          for (let t = 0; t < len; t++) cells.push(horiz ? [r, c + t] : [r + t, c]);
          let ok = true;
          for (const [x, y] of cells) {
            if (g[x][y] === "X") ok = false;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const p = x + dx, q = y + dy;
              if (p >= 0 && q >= 0 && p < m && q < n && g[p][q] === "X") ok = false;
            }
          }
          if (ok) for (const [x, y] of cells) g[x][y] = "X";
        }
        const board = g.map((row) => row.join(""));
        return { input: fmtStrArr(board), expectedOutput: String(ref(board)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countBattleships(board: List[str]) -> int:
              ships = 0
              for i in range(len(board)):
                  for j in range(len(board[i])):
                      if board[i][j] != 'X':
                          continue
                      if i > 0 and board[i - 1][j] == 'X':
                          continue
                      if j > 0 and board[i][j - 1] == 'X':
                          continue
                      ships += 1
              return ships
        `,
        javascript: code`
          var countBattleships = function(board) {
              var ships = 0;
              for (var i = 0; i < board.length; i++) {
                  for (var j = 0; j < board[i].length; j++) {
                      if (board[i][j] !== 'X') continue;
                      if (i > 0 && board[i - 1][j] === 'X') continue;
                      if (j > 0 && board[i][j - 1] === 'X') continue;
                      ships++;
                  }
              }
              return ships;
          };
        `,
        typescript: code`
          function countBattleships(board: string[]): number {
              var ships = 0;
              for (var i = 0; i < board.length; i++) {
                  for (var j = 0; j < board[i].length; j++) {
                      if (board[i].charAt(j) !== 'X') continue;
                      if (i > 0 && board[i - 1].charAt(j) === 'X') continue;
                      if (j > 0 && board[i].charAt(j - 1) === 'X') continue;
                      ships++;
                  }
              }
              return ships;
          }
        `,
        java: code`
          public static int countBattleships(String[] board) {
              int ships = 0;
              for (int i = 0; i < board.length; i++) {
                  for (int j = 0; j < board[i].length(); j++) {
                      if (board[i].charAt(j) != 'X') continue;
                      if (i > 0 && board[i - 1].charAt(j) == 'X') continue;
                      if (j > 0 && board[i].charAt(j - 1) == 'X') continue;
                      ships++;
                  }
              }
              return ships;
          }
        `,
        cpp: code`
          int countBattleships(vector<string>& board) {
              int ships = 0;
              for (int i = 0; i < (int)board.size(); i++) {
                  for (int j = 0; j < (int)board[i].size(); j++) {
                      if (board[i][j] != 'X') continue;
                      if (i > 0 && board[i - 1][j] == 'X') continue;
                      if (j > 0 && board[i][j - 1] == 'X') continue;
                      ships++;
                  }
              }
              return ships;
          }
        `,
        c: code`
          int countBattleships(char** board, int boardSize) {
              int ships = 0;
              for (int i = 0; i < boardSize; i++) {
                  int n = (int)strlen(board[i]);
                  for (int j = 0; j < n; j++) {
                      if (board[i][j] != 'X') continue;
                      if (i > 0 && board[i - 1][j] == 'X') continue;
                      if (j > 0 && board[i][j - 1] == 'X') continue;
                      ships++;
                  }
              }
              return ships;
          }
        `,
        csharp: code`
          public static int CountBattleships(string[] board)
          {
              int ships = 0;
              for (int i = 0; i < board.Length; i++)
              {
                  for (int j = 0; j < board[i].Length; j++)
                  {
                      if (board[i][j] != 'X') continue;
                      if (i > 0 && board[i - 1][j] == 'X') continue;
                      if (j > 0 && board[i][j - 1] == 'X') continue;
                      ships++;
                  }
              }
              return ships;
          }
        `,
        go: code`
          func countBattleships(board []string) int {
          	ships := 0
          	for i := 0; i < len(board); i++ {
          		for j := 0; j < len(board[i]); j++ {
          			if board[i][j] != 'X' {
          				continue
          			}
          			if i > 0 && board[i-1][j] == 'X' {
          				continue
          			}
          			if j > 0 && board[i][j-1] == 'X' {
          				continue
          			}
          			ships++
          		}
          	}
          	return ships
          }
        `,
        kotlin: code`
          fun countBattleships(board: Array<String>): Int {
              var ships = 0
              for (i in board.indices) {
                  for (j in board[i].indices) {
                      if (board[i][j] != 'X') continue
                      if (i > 0 && board[i - 1][j] == 'X') continue
                      if (j > 0 && board[i][j - 1] == 'X') continue
                      ships++
                  }
              }
              return ships
          }
        `,
        swift: code`
          func countBattleships(_ board: [String]) -> Int {
              let g = board.map { Array($0) }
              var ships = 0
              for i in 0..<g.count {
                  for j in 0..<g[i].count {
                      if g[i][j] != "X" { continue }
                      if i > 0 && g[i - 1][j] == "X" { continue }
                      if j > 0 && g[i][j - 1] == "X" { continue }
                      ships += 1
                  }
              }
              return ships
          }
        `,
        rust: code`
          fn countBattleships(board: Vec<String>) -> i32 {
              let g: Vec<&[u8]> = board.iter().map(|s| s.as_bytes()).collect();
              let mut ships = 0;
              for i in 0..g.len() {
                  for j in 0..g[i].len() {
                      if g[i][j] != b'X' {
                          continue;
                      }
                      if i > 0 && g[i - 1][j] == b'X' {
                          continue;
                      }
                      if j > 0 && g[i][j - 1] == b'X' {
                          continue;
                      }
                      ships += 1;
                  }
              }
              ships
          }
        `,
        php: code`
          function countBattleships($board) {
              $ships = 0;
              $m = count($board);
              for ($i = 0; $i < $m; $i++) {
                  $n = strlen($board[$i]);
                  for ($j = 0; $j < $n; $j++) {
                      if ($board[$i][$j] !== 'X') continue;
                      if ($i > 0 && $board[$i - 1][$j] === 'X') continue;
                      if ($j > 0 && $board[$i][$j - 1] === 'X') continue;
                      $ships++;
                  }
              }
              return $ships;
          }
        `,
        ruby: code`
          def countBattleships(board)
            ships = 0
            board.each_with_index do |row, i|
              row.length.times do |j|
                next if row[j] != 'X'
                next if i > 0 && board[i - 1][j] == 'X'
                next if j > 0 && row[j - 1] == 'X'
                ships += 1
              end
            end
            ships
          end
        `,
      },
    };
  })(),

  // ── Minesweeper (LC 529) ────────────────────────────────────────
  (() => {
    const ref = (board: string[], click: number[]) => {
      const m = board.length, n = board[0].length;
      const g = board.map((row) => row.split(""));
      const mines = (r: number, c: number) => {
        let k = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const a = r + dr, b = c + dc;
          if ((dr || dc) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] === "M") k++;
        }
        return k;
      };
      const reveal = (r: number, c: number) => {
        if (r < 0 || c < 0 || r >= m || c >= n || g[r][c] !== "E") return;
        const k = mines(r, c);
        if (k > 0) { g[r][c] = String(k); return; }
        g[r][c] = "B";
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) reveal(r + dr, c + dc);
      };
      if (g[click[0]][click[1]] === "M") g[click[0]][click[1]] = "X";
      else reveal(click[0], click[1]);
      return g.map((row) => row.join(""));
    };
    return {
      slug: "minesweeper",
      title: "Minesweeper",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Breadth-First Search", "Depth-First Search", "Matrix", "Meta", "Amazon", "Google"],
      signature: { funcName: "updateBoard", params: [{ name: "board", type: "string[]" as const }, { name: "click", type: "int[]" as const }], returns: "string[]" as const },
      description: describe(
        "A Minesweeper board is given as `m` strings of length `n`. Each character is one of:\n\n- `'M'` — an unrevealed mine;\n- `'E'` — an unrevealed empty square;\n- `'B'` — a revealed blank square with no mines among its (up to 8) neighbours — above, below, left, right and the four diagonals;\n- `'1'`–`'8'` — a revealed square showing how many of its neighbours are mines;\n- `'X'` — a revealed mine.\n\n`click = [r, c]` is the next click, always on an unrevealed square (`'M'` or `'E'`). Apply these rules and return the resulting board:\n\n1. If a mine `'M'` is clicked, it becomes `'X'` and nothing else changes.\n2. If an `'E'` with **no** adjacent mines is revealed, it becomes `'B'` and every unrevealed `'E'` neighbour is revealed too, by the same rules (recursively).\n3. If an `'E'` with at least one adjacent mine is revealed, it becomes the digit `'1'`–`'8'` for that count, and the reveal stops there.",
        [
          { in: "board = [\"EEEE\",\"EEME\",\"EEEE\"], click = [2,0]", out: "[\"B1EE\",\"B1ME\",\"B1EE\"]", note: "The bottom-left corner has no adjacent mines, so it opens up the whole left column; the squares beside the mine stop the spread with a `1`." },
          { in: "board = [\"EEEE\",\"EEME\",\"EEEE\"], click = [1,2]", out: "[\"EEEE\",\"EEXE\",\"EEEE\"]", note: "Clicking the mine ends the game." },
          { in: "board = [\"EM\",\"EE\"], click = [1,0]", out: "[\"EM\",\"1E\"]" },
        ],
        ["m == board.length", "n == board[i].length", "1 <= m, n <= 50", "board[i][j] is 'M', 'E', 'B', or a digit from '1' to '8'", "click.length == 2", "0 <= click[0] < m", "0 <= click[1] < n", "board[click[0]][click[1]] is 'M' or 'E'"]),
      hints: [
        "Handle the mine click first — it changes exactly one square.",
        "Revealing an empty square only ever spreads from squares that turn into `'B'`; a square that shows a digit stops the spread.",
        "Use a BFS (or DFS) from the click: count the adjacent mines of the current square; write the digit if the count is positive, otherwise write `'B'` and enqueue every unrevealed `'E'` neighbour.",
      ],
      editorial: explain({
        idea: "The reveal is a flood fill over the 8-neighbour graph that expands only through squares with zero adjacent mines.",
        steps: [
          "If the clicked square is `'M'`, set it to `'X'` and return.",
          "Otherwise start a queue with the clicked square and mark it visited.",
          "Pop a square and count mines among its 8 neighbours. If the count is positive, write the digit and stop expanding from it.",
          "If the count is 0, write `'B'` and push every unvisited neighbour that is still `'E'`.",
          "When the queue is empty, return the board.",
        ],
        why: "A `'B'` square has no mines around it, so every neighbour is safe and must be revealed — the rule is applied to each in turn. A digit square may border a mine, so the game stops there. The flood fill applies exactly these two rules, and marking visited squares guarantees each is processed once.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Mines are never revealed by the spread — only the clicked mine becomes `'X'`.",
          "Neighbours include the four diagonals for both the mine count and the spread.",
          "A deep recursive DFS can overflow the stack on a 50 × 50 empty board; an explicit queue is safer.",
        ],
      }),
      examples: [
        { input: '["EEEE","EEME","EEEE"]\n[2,0]', expectedOutput: '["B1EE","B1ME","B1EE"]' },
        { input: '["EEEE","EEME","EEEE"]\n[1,2]', expectedOutput: '["EEEE","EEXE","EEEE"]' },
        { input: '["EM","EE"]\n[1,0]', expectedOutput: '["EM","1E"]' },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 0, 15) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 6, 8]));
        const n = ri(rng, 0, 15) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 6, 8]));
        const p = ri(rng, 0, 9) === 0 ? 0 : pick(rng, [0.08, 0.15, 0.25, 0.4]);
        const g0 = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? "M" : "E")));
        if (p > 0 && !g0.some((row) => row.includes("M"))) g0[ri(rng, 0, m - 1)][ri(rng, 0, n - 1)] = "M";
        let board = g0.map((row) => row.join(""));
        const cellsOf = (b: string[], chars: string) => {
          const out: number[][] = [];
          for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (chars.includes(b[i][j])) out.push([i, j]);
          return out;
        };
        if (rng() < 0.4) {
          // an earlier safe click, so the board arrives partly revealed
          const safe = cellsOf(board, "E");
          if (safe.length) {
            const next = ref(board, pick(rng, safe));
            if (cellsOf(next, "ME").length) board = next;
          }
        }
        const open = cellsOf(board, "ME");
        const click = pick(rng, open);
        return { input: `${fmtStrArr(board)}\n${fmtIntArr(click)}`, expectedOutput: fmtStrArr(ref(board, click)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def updateBoard(board: List[str], click: List[int]) -> List[str]:
              m, n = len(board), len(board[0])
              g = [list(row) for row in board]
              r0, c0 = click
              if g[r0][c0] == 'M':
                  g[r0][c0] = 'X'
                  return [''.join(row) for row in g]
              seen = [[False] * n for _ in range(m)]
              seen[r0][c0] = True
              q = deque([(r0, c0)])
              while q:
                  r, c = q.popleft()
                  mines = 0
                  for dr in (-1, 0, 1):
                      for dc in (-1, 0, 1):
                          a, b = r + dr, c + dc
                          if (dr or dc) and 0 <= a < m and 0 <= b < n and g[a][b] == 'M':
                              mines += 1
                  if mines:
                      g[r][c] = str(mines)
                      continue
                  g[r][c] = 'B'
                  for dr in (-1, 0, 1):
                      for dc in (-1, 0, 1):
                          a, b = r + dr, c + dc
                          if 0 <= a < m and 0 <= b < n and g[a][b] == 'E' and not seen[a][b]:
                              seen[a][b] = True
                              q.append((a, b))
              return [''.join(row) for row in g]
        `,
        javascript: code`
          var updateBoard = function(board, click) {
              var m = board.length, n = board[0].length;
              var g = board.map(function(row) { return row.split(''); });
              var r0 = click[0], c0 = click[1];
              if (g[r0][c0] === 'M') {
                  g[r0][c0] = 'X';
                  return g.map(function(row) { return row.join(''); });
              }
              var seen = [];
              for (var i = 0; i < m; i++) seen.push(new Array(n).fill(false));
              seen[r0][c0] = true;
              var queue = [[r0, c0]];
              for (var h = 0; h < queue.length; h++) {
                  var r = queue[h][0], c = queue[h][1], mines = 0, dr, dc, a, b;
                  for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
                      a = r + dr; b = c + dc;
                      if ((dr !== 0 || dc !== 0) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] === 'M') mines++;
                  }
                  if (mines > 0) { g[r][c] = String(mines); continue; }
                  g[r][c] = 'B';
                  for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
                      a = r + dr; b = c + dc;
                      if (a >= 0 && b >= 0 && a < m && b < n && g[a][b] === 'E' && !seen[a][b]) {
                          seen[a][b] = true;
                          queue.push([a, b]);
                      }
                  }
              }
              return g.map(function(row) { return row.join(''); });
          };
        `,
        typescript: code`
          function updateBoard(board: string[], click: number[]): string[] {
              var m = board.length, n = board[0].length;
              var g: string[][] = [], seen: boolean[][] = [];
              for (var i = 0; i < m; i++) {
                  g.push(board[i].split(''));
                  var s: boolean[] = [];
                  for (var j = 0; j < n; j++) s.push(false);
                  seen.push(s);
              }
              var r0 = click[0], c0 = click[1];
              if (g[r0][c0] === 'M') {
                  g[r0][c0] = 'X';
              } else {
                  seen[r0][c0] = true;
                  var queue: number[][] = [[r0, c0]];
                  for (var h = 0; h < queue.length; h++) {
                      var r = queue[h][0], c = queue[h][1], mines = 0, dr: number, dc: number, a: number, b: number;
                      for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
                          a = r + dr; b = c + dc;
                          if ((dr !== 0 || dc !== 0) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] === 'M') mines++;
                      }
                      if (mines > 0) { g[r][c] = "" + mines; continue; }
                      g[r][c] = 'B';
                      for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
                          a = r + dr; b = c + dc;
                          if (a >= 0 && b >= 0 && a < m && b < n && g[a][b] === 'E' && !seen[a][b]) {
                              seen[a][b] = true;
                              queue.push([a, b]);
                          }
                      }
                  }
              }
              var out: string[] = [];
              for (var k = 0; k < m; k++) out.push(g[k].join(''));
              return out;
          }
        `,
        java: code`
          public static String[] updateBoard(String[] board, int[] click) {
              int m = board.length, n = board[0].length();
              char[][] g = new char[m][];
              for (int i = 0; i < m; i++) g[i] = board[i].toCharArray();
              int r0 = click[0], c0 = click[1];
              if (g[r0][c0] == 'M') {
                  g[r0][c0] = 'X';
              } else {
                  boolean[][] seen = new boolean[m][n];
                  ArrayDeque<int[]> q = new ArrayDeque<>();
                  q.add(new int[]{r0, c0});
                  seen[r0][c0] = true;
                  while (!q.isEmpty()) {
                      int[] cur = q.poll();
                      int r = cur[0], c = cur[1], mines = 0;
                      for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
                          int a = r + dr, b = c + dc;
                          if ((dr != 0 || dc != 0) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'M') mines++;
                      }
                      if (mines > 0) { g[r][c] = (char) ('0' + mines); continue; }
                      g[r][c] = 'B';
                      for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
                          int a = r + dr, b = c + dc;
                          if (a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'E' && !seen[a][b]) {
                              seen[a][b] = true;
                              q.add(new int[]{a, b});
                          }
                      }
                  }
              }
              String[] out = new String[m];
              for (int i = 0; i < m; i++) out[i] = new String(g[i]);
              return out;
          }
        `,
        cpp: code`
          vector<string> updateBoard(vector<string>& board, vector<int>& click) {
              vector<string> g = board;
              int m = g.size(), n = g[0].size();
              int r0 = click[0], c0 = click[1];
              if (g[r0][c0] == 'M') { g[r0][c0] = 'X'; return g; }
              vector<vector<bool>> seen(m, vector<bool>(n, false));
              queue<pair<int, int>> q;
              q.push({r0, c0});
              seen[r0][c0] = true;
              while (!q.empty()) {
                  int r = q.front().first, c = q.front().second;
                  q.pop();
                  int mines = 0;
                  for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
                      int a = r + dr, b = c + dc;
                      if ((dr || dc) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'M') mines++;
                  }
                  if (mines > 0) { g[r][c] = (char)('0' + mines); continue; }
                  g[r][c] = 'B';
                  for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
                      int a = r + dr, b = c + dc;
                      if (a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'E' && !seen[a][b]) {
                          seen[a][b] = true;
                          q.push({a, b});
                      }
                  }
              }
              return g;
          }
        `,
        c: code`
          char** updateBoard(char** board, int boardSize, int* click, int clickSize, int* returnSize) {
              int m = boardSize, n = (int)strlen(board[0]);
              char** g = (char**)malloc(m * sizeof(char*));
              for (int i = 0; i < m; i++) {
                  g[i] = (char*)malloc(n + 1);
                  memcpy(g[i], board[i], n + 1);
              }
              *returnSize = m;
              int r0 = click[0], c0 = click[1];
              if (g[r0][c0] == 'M') { g[r0][c0] = 'X'; return g; }
              int* qr = (int*)malloc(m * n * sizeof(int));
              int* qc = (int*)malloc(m * n * sizeof(int));
              char* seen = (char*)calloc(m * n, 1);
              int head = 0, tail = 0;
              qr[tail] = r0; qc[tail] = c0; tail++;
              seen[r0 * n + c0] = 1;
              while (head < tail) {
                  int r = qr[head], c = qc[head];
                  head++;
                  int mines = 0;
                  for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
                      int a = r + dr, b = c + dc;
                      if ((dr || dc) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'M') mines++;
                  }
                  if (mines > 0) { g[r][c] = (char)('0' + mines); continue; }
                  g[r][c] = 'B';
                  for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
                      int a = r + dr, b = c + dc;
                      if (a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'E' && !seen[a * n + b]) {
                          seen[a * n + b] = 1;
                          qr[tail] = a; qc[tail] = b; tail++;
                      }
                  }
              }
              free(qr);
              free(qc);
              free(seen);
              return g;
          }
        `,
        csharp: code`
          public static string[] UpdateBoard(string[] board, int[] click)
          {
              int m = board.Length, n = board[0].Length;
              var g = new char[m][];
              for (int i = 0; i < m; i++) g[i] = board[i].ToCharArray();
              int r0 = click[0], c0 = click[1];
              if (g[r0][c0] == 'M')
              {
                  g[r0][c0] = 'X';
              }
              else
              {
                  var seen = new bool[m, n];
                  var q = new Queue<int[]>();
                  q.Enqueue(new[] { r0, c0 });
                  seen[r0, c0] = true;
                  while (q.Count > 0)
                  {
                      var cur = q.Dequeue();
                      int r = cur[0], c = cur[1], mines = 0;
                      for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++)
                      {
                          int a = r + dr, b = c + dc;
                          if ((dr != 0 || dc != 0) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'M') mines++;
                      }
                      if (mines > 0) { g[r][c] = (char)('0' + mines); continue; }
                      g[r][c] = 'B';
                      for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++)
                      {
                          int a = r + dr, b = c + dc;
                          if (a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'E' && !seen[a, b])
                          {
                              seen[a, b] = true;
                              q.Enqueue(new[] { a, b });
                          }
                      }
                  }
              }
              var result = new string[m];
              for (int i = 0; i < m; i++) result[i] = new string(g[i]);
              return result;
          }
        `,
        go: code`
          func updateBoard(board []string, click []int) []string {
          	m, n := len(board), len(board[0])
          	g := make([][]byte, m)
          	for i := range board {
          		g[i] = []byte(board[i])
          	}
          	r0, c0 := click[0], click[1]
          	if g[r0][c0] == 'M' {
          		g[r0][c0] = 'X'
          	} else {
          		seen := make([]bool, m*n)
          		seen[r0*n+c0] = true
          		queue := [][2]int{{r0, c0}}
          		for h := 0; h < len(queue); h++ {
          			r, c := queue[h][0], queue[h][1]
          			mines := 0
          			for dr := -1; dr <= 1; dr++ {
          				for dc := -1; dc <= 1; dc++ {
          					a, b := r+dr, c+dc
          					if (dr != 0 || dc != 0) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'M' {
          						mines++
          					}
          				}
          			}
          			if mines > 0 {
          				g[r][c] = byte('0' + mines)
          				continue
          			}
          			g[r][c] = 'B'
          			for dr := -1; dr <= 1; dr++ {
          				for dc := -1; dc <= 1; dc++ {
          					a, b := r+dr, c+dc
          					if a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'E' && !seen[a*n+b] {
          						seen[a*n+b] = true
          						queue = append(queue, [2]int{a, b})
          					}
          				}
          			}
          		}
          	}
          	res := make([]string, m)
          	for i := range g {
          		res[i] = string(g[i])
          	}
          	return res
          }
        `,
        kotlin: code`
          fun updateBoard(board: Array<String>, click: IntArray): Array<String> {
              val m = board.size
              val n = board[0].length
              val g = Array(m) { board[it].toCharArray() }
              val r0 = click[0]
              val c0 = click[1]
              if (g[r0][c0] == 'M') {
                  g[r0][c0] = 'X'
              } else {
                  val seen = Array(m) { BooleanArray(n) }
                  val q = java.util.ArrayDeque<IntArray>()
                  q.add(intArrayOf(r0, c0))
                  seen[r0][c0] = true
                  while (q.isNotEmpty()) {
                      val cur = q.poll()
                      val r = cur[0]
                      val c = cur[1]
                      var mines = 0
                      for (dr in -1..1) for (dc in -1..1) {
                          val a = r + dr
                          val b = c + dc
                          if ((dr != 0 || dc != 0) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'M') mines++
                      }
                      if (mines > 0) { g[r][c] = '0' + mines; continue }
                      g[r][c] = 'B'
                      for (dr in -1..1) for (dc in -1..1) {
                          val a = r + dr
                          val b = c + dc
                          if (a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'E' && !seen[a][b]) {
                              seen[a][b] = true
                              q.add(intArrayOf(a, b))
                          }
                      }
                  }
              }
              return Array(m) { String(g[it]) }
          }
        `,
        swift: code`
          func updateBoard(_ board: [String], _ click: [Int]) -> [String] {
              var g = board.map { Array($0) }
              let m = g.count, n = g[0].count
              let r0 = click[0], c0 = click[1]
              if g[r0][c0] == "M" {
                  g[r0][c0] = "X"
              } else {
                  var seen = [[Bool]](repeating: [Bool](repeating: false, count: n), count: m)
                  seen[r0][c0] = true
                  var queue = [(r0, c0)]
                  var head = 0
                  while head < queue.count {
                      let (r, c) = queue[head]
                      head += 1
                      var mines = 0
                      for dr in -1...1 {
                          for dc in -1...1 {
                              let a = r + dr, b = c + dc
                              if (dr != 0 || dc != 0) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] == "M" { mines += 1 }
                          }
                      }
                      if mines > 0 {
                          g[r][c] = Character(String(mines))
                          continue
                      }
                      g[r][c] = "B"
                      for dr in -1...1 {
                          for dc in -1...1 {
                              let a = r + dr, b = c + dc
                              if a >= 0 && b >= 0 && a < m && b < n && g[a][b] == "E" && !seen[a][b] {
                                  seen[a][b] = true
                                  queue.append((a, b))
                              }
                          }
                      }
                  }
              }
              return g.map { String($0) }
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          fn updateBoard(board: Vec<String>, click: Vec<i32>) -> Vec<String> {
              let mut g: Vec<Vec<u8>> = board.iter().map(|s| s.as_bytes().to_vec()).collect();
              let m = g.len() as i32;
              let n = g[0].len() as i32;
              let (r0, c0) = (click[0], click[1]);
              if g[r0 as usize][c0 as usize] == b'M' {
                  g[r0 as usize][c0 as usize] = b'X';
              } else {
                  let mut seen = vec![vec![false; n as usize]; m as usize];
                  seen[r0 as usize][c0 as usize] = true;
                  let mut q: VecDeque<(i32, i32)> = VecDeque::new();
                  q.push_back((r0, c0));
                  while let Some((r, c)) = q.pop_front() {
                      let mut mines = 0u8;
                      for dr in -1..=1 {
                          for dc in -1..=1 {
                              let (a, b) = (r + dr, c + dc);
                              if (dr != 0 || dc != 0) && a >= 0 && b >= 0 && a < m && b < n && g[a as usize][b as usize] == b'M' {
                                  mines += 1;
                              }
                          }
                      }
                      if mines > 0 {
                          g[r as usize][c as usize] = b'0' + mines;
                          continue;
                      }
                      g[r as usize][c as usize] = b'B';
                      for dr in -1..=1 {
                          for dc in -1..=1 {
                              let (a, b) = (r + dr, c + dc);
                              if a >= 0 && b >= 0 && a < m && b < n && g[a as usize][b as usize] == b'E' && !seen[a as usize][b as usize] {
                                  seen[a as usize][b as usize] = true;
                                  q.push_back((a, b));
                              }
                          }
                      }
                  }
              }
              g.into_iter().map(|row| String::from_utf8(row).unwrap()).collect()
          }
        `,
        php: code`
          function updateBoard($board, $click) {
              $m = count($board);
              $n = strlen($board[0]);
              $g = [];
              foreach ($board as $row) $g[] = str_split($row);
              $r0 = $click[0];
              $c0 = $click[1];
              if ($g[$r0][$c0] === 'M') {
                  $g[$r0][$c0] = 'X';
              } else {
                  $seen = [];
                  $seen[$r0 * $n + $c0] = true;
                  $queue = [[$r0, $c0]];
                  for ($h = 0; $h < count($queue); $h++) {
                      $r = $queue[$h][0];
                      $c = $queue[$h][1];
                      $mines = 0;
                      for ($dr = -1; $dr <= 1; $dr++) for ($dc = -1; $dc <= 1; $dc++) {
                          $a = $r + $dr;
                          $b = $c + $dc;
                          if (($dr != 0 || $dc != 0) && $a >= 0 && $b >= 0 && $a < $m && $b < $n && $g[$a][$b] === 'M') $mines++;
                      }
                      if ($mines > 0) { $g[$r][$c] = (string)$mines; continue; }
                      $g[$r][$c] = 'B';
                      for ($dr = -1; $dr <= 1; $dr++) for ($dc = -1; $dc <= 1; $dc++) {
                          $a = $r + $dr;
                          $b = $c + $dc;
                          if ($a >= 0 && $b >= 0 && $a < $m && $b < $n && $g[$a][$b] === 'E' && !isset($seen[$a * $n + $b])) {
                              $seen[$a * $n + $b] = true;
                              $queue[] = [$a, $b];
                          }
                      }
                  }
              }
              $out = [];
              foreach ($g as $row) $out[] = implode('', $row);
              return $out;
          }
        `,
        ruby: code`
          def updateBoard(board, click)
            m = board.length
            n = board[0].length
            g = board.map { |row| row.chars }
            r0, c0 = click
            if g[r0][c0] == 'M'
              g[r0][c0] = 'X'
            else
              seen = Array.new(m) { Array.new(n, false) }
              seen[r0][c0] = true
              queue = [[r0, c0]]
              head = 0
              while head < queue.length
                r, c = queue[head]
                head += 1
                mines = 0
                (-1..1).each do |dr|
                  (-1..1).each do |dc|
                    a = r + dr
                    b = c + dc
                    mines += 1 if (dr != 0 || dc != 0) && a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'M'
                  end
                end
                if mines > 0
                  g[r][c] = mines.to_s
                  next
                end
                g[r][c] = 'B'
                (-1..1).each do |dr|
                  (-1..1).each do |dc|
                    a = r + dr
                    b = c + dc
                    if a >= 0 && b >= 0 && a < m && b < n && g[a][b] == 'E' && !seen[a][b]
                      seen[a][b] = true
                      queue << [a, b]
                    end
                  end
                end
              end
            end
            g.map(&:join)
          end
        `,
      },
    };
  })(),

  // ── Available Captures for Rook (LC 999) ────────────────────────
  (() => {
    const ref = (board: string[]) => {
      let r0 = 0, c0 = 0;
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (board[i][j] === "R") { r0 = i; c0 = j; }
      let caps = 0;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let r = r0 + dr, c = c0 + dc;
        while (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] === ".") { r += dr; c += dc; }
        if (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] === "p") caps++;
      }
      return caps;
    };
    return {
      slug: "available-captures-for-rook",
      title: "Available Captures for Rook",
      difficulty: "EASY" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Apple"],
      signature: { funcName: "numRookCaptures", params: [{ name: "board", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "An 8 × 8 chessboard is given as 8 strings of 8 characters. It holds exactly one white rook `'R'`, any number of white bishops `'B'` and black pawns `'p'`, and `'.'` for empty squares.\n\nThe rook moves any number of squares straight up, down, left or right, stopping at the first piece in its way or the edge of the board. It **attacks** a pawn when the pawn is the first piece it meets in one of those four directions; a bishop (its own piece) blocks the line.\n\nReturn the number of pawns the rook attacks.",
        [
          { in: "board = [\"........\",\"...p....\",\"...R..p.\",\"........\",\"........\",\"...p....\",\"........\",\"........\"]", out: "3", note: "The pawns straight above, to the right of and below the rook are all reachable." },
          { in: "board = [\"........\",\"...p....\",\"...B....\",\".pBR.Bp.\",\"........\",\"...p....\",\"........\",\"........\"]", out: "1", note: "Bishops block the rook upwards, to the left and to the right; only the pawn below is attacked." },
          { in: "board = [\"R.......\",\"........\",\"........\",\"........\",\"........\",\"........\",\"........\",\"........\"]", out: "0" },
        ],
        ["board.length == 8", "board[i].length == 8", "board[i][j] is 'R', '.', 'B' or 'p'", "there is exactly one 'R'"]),
      hints: [
        "Find the rook first.",
        "From the rook, walk in each of the four directions while the squares are empty.",
        "Look at the first non-empty square in each direction: count it if it is a pawn.",
      ],
      editorial: explain({
        idea: "The rook attacks at most one piece per direction — the first non-empty square — so four short walks settle it.",
        steps: [
          "Locate `'R'`.",
          "For each of the four directions, step from the rook while inside the board and on `'.'`.",
          "If the walk stopped on a `'p'`, add one; if it stopped on a `'B'` or left the board, add nothing.",
        ],
        why: "A rook's line of attack ends at the first occupied square, so the only pawn it can capture in a direction is the one on that square. Checking all four directions covers every possible capture.",
        time: "O(1) — at most 28 squares are visited on an 8 × 8 board",
        space: "O(1)",
        pitfalls: [
          "A bishop blocks the line even though it is on the rook's side — pawns behind it are safe.",
          "Pawns on a diagonal from the rook cannot be attacked.",
          "Only the first pawn in a direction counts, even if several are in line.",
        ],
      }),
      examples: [
        { input: '["........","...p....","...R..p.","........","........","...p....","........","........"]', expectedOutput: "3" },
        { input: '["........","...p....","...B....",".pBR.Bp.","........","...p....","........","........"]', expectedOutput: "1" },
        { input: '["R.......","........","........","........","........","........","........","........"]', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const g = Array.from({ length: 8 }, () => new Array<string>(8).fill("."));
        const r0 = ri(rng, 0, 7), c0 = ri(rng, 0, 7);
        g[r0][c0] = "R";
        const pieces = ri(rng, 0, pick(rng, [3, 8, 20]));
        const bishopShare = pick(rng, [0, 0.3, 0.5]);
        for (let t = 0; t < pieces; t++) {
          let r: number, c: number;
          if (rng() < 0.6) {
            // put most pieces on the rook's row or column, where they matter
            if (rng() < 0.5) { r = r0; c = ri(rng, 0, 7); } else { r = ri(rng, 0, 7); c = c0; }
          } else { r = ri(rng, 0, 7); c = ri(rng, 0, 7); }
          if (g[r][c] === ".") g[r][c] = rng() < bishopShare ? "B" : "p";
        }
        const board = g.map((row) => row.join(""));
        return { input: fmtStrArr(board), expectedOutput: String(ref(board)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numRookCaptures(board: List[str]) -> int:
              r0 = c0 = 0
              for i in range(8):
                  for j in range(8):
                      if board[i][j] == 'R':
                          r0, c0 = i, j
              caps = 0
              for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                  r, c = r0 + dr, c0 + dc
                  while 0 <= r < 8 and 0 <= c < 8 and board[r][c] == '.':
                      r += dr
                      c += dc
                  if 0 <= r < 8 and 0 <= c < 8 and board[r][c] == 'p':
                      caps += 1
              return caps
        `,
        javascript: code`
          var numRookCaptures = function(board) {
              var r0 = 0, c0 = 0;
              for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) if (board[i][j] === 'R') { r0 = i; c0 = j; }
              var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], caps = 0;
              for (var d = 0; d < 4; d++) {
                  var r = r0 + dirs[d][0], c = c0 + dirs[d][1];
                  while (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] === '.') { r += dirs[d][0]; c += dirs[d][1]; }
                  if (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] === 'p') caps++;
              }
              return caps;
          };
        `,
        typescript: code`
          function numRookCaptures(board: string[]): number {
              var r0 = 0, c0 = 0;
              for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) if (board[i].charAt(j) === 'R') { r0 = i; c0 = j; }
              var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], caps = 0;
              for (var d = 0; d < 4; d++) {
                  var r = r0 + dirs[d][0], c = c0 + dirs[d][1];
                  while (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r].charAt(c) === '.') { r += dirs[d][0]; c += dirs[d][1]; }
                  if (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r].charAt(c) === 'p') caps++;
              }
              return caps;
          }
        `,
        java: code`
          public static int numRookCaptures(String[] board) {
              int r0 = 0, c0 = 0;
              for (int i = 0; i < 8; i++) for (int j = 0; j < 8; j++) if (board[i].charAt(j) == 'R') { r0 = i; c0 = j; }
              int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
              int caps = 0;
              for (int[] d : dirs) {
                  int r = r0 + d[0], c = c0 + d[1];
                  while (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r].charAt(c) == '.') { r += d[0]; c += d[1]; }
                  if (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r].charAt(c) == 'p') caps++;
              }
              return caps;
          }
        `,
        cpp: code`
          int numRookCaptures(vector<string>& board) {
              int r0 = 0, c0 = 0;
              for (int i = 0; i < 8; i++) for (int j = 0; j < 8; j++) if (board[i][j] == 'R') { r0 = i; c0 = j; }
              int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
              int caps = 0;
              for (auto& d : dirs) {
                  int r = r0 + d[0], c = c0 + d[1];
                  while (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == '.') { r += d[0]; c += d[1]; }
                  if (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == 'p') caps++;
              }
              return caps;
          }
        `,
        c: code`
          int numRookCaptures(char** board, int boardSize) {
              int r0 = 0, c0 = 0;
              for (int i = 0; i < 8; i++) for (int j = 0; j < 8; j++) if (board[i][j] == 'R') { r0 = i; c0 = j; }
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              int caps = 0;
              for (int d = 0; d < 4; d++) {
                  int r = r0 + dr[d], c = c0 + dc[d];
                  while (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == '.') { r += dr[d]; c += dc[d]; }
                  if (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == 'p') caps++;
              }
              return caps;
          }
        `,
        csharp: code`
          public static int NumRookCaptures(string[] board)
          {
              int r0 = 0, c0 = 0;
              for (int i = 0; i < 8; i++) for (int j = 0; j < 8; j++) if (board[i][j] == 'R') { r0 = i; c0 = j; }
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              int caps = 0;
              for (int d = 0; d < 4; d++)
              {
                  int r = r0 + dr[d], c = c0 + dc[d];
                  while (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == '.') { r += dr[d]; c += dc[d]; }
                  if (r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == 'p') caps++;
              }
              return caps;
          }
        `,
        go: code`
          func numRookCaptures(board []string) int {
          	r0, c0 := 0, 0
          	for i := 0; i < 8; i++ {
          		for j := 0; j < 8; j++ {
          			if board[i][j] == 'R' {
          				r0, c0 = i, j
          			}
          		}
          	}
          	dr := []int{1, -1, 0, 0}
          	dc := []int{0, 0, 1, -1}
          	caps := 0
          	for d := 0; d < 4; d++ {
          		r, c := r0+dr[d], c0+dc[d]
          		for r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == '.' {
          			r += dr[d]
          			c += dc[d]
          		}
          		if r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == 'p' {
          			caps++
          		}
          	}
          	return caps
          }
        `,
        kotlin: code`
          fun numRookCaptures(board: Array<String>): Int {
              var r0 = 0
              var c0 = 0
              for (i in 0 until 8) for (j in 0 until 8) if (board[i][j] == 'R') { r0 = i; c0 = j }
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              var caps = 0
              for (d in 0 until 4) {
                  var r = r0 + dr[d]
                  var c = c0 + dc[d]
                  while (r in 0..7 && c in 0..7 && board[r][c] == '.') { r += dr[d]; c += dc[d] }
                  if (r in 0..7 && c in 0..7 && board[r][c] == 'p') caps++
              }
              return caps
          }
        `,
        swift: code`
          func numRookCaptures(_ board: [String]) -> Int {
              let g = board.map { Array($0) }
              var r0 = 0, c0 = 0
              for i in 0..<8 { for j in 0..<8 where g[i][j] == "R" { r0 = i; c0 = j } }
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              var caps = 0
              for d in 0..<4 {
                  var r = r0 + dr[d], c = c0 + dc[d]
                  while r >= 0 && c >= 0 && r < 8 && c < 8 && g[r][c] == "." { r += dr[d]; c += dc[d] }
                  if r >= 0 && c >= 0 && r < 8 && c < 8 && g[r][c] == "p" { caps += 1 }
              }
              return caps
          }
        `,
        rust: code`
          fn numRookCaptures(board: Vec<String>) -> i32 {
              let g: Vec<&[u8]> = board.iter().map(|s| s.as_bytes()).collect();
              let (mut r0, mut c0) = (0i32, 0i32);
              for i in 0..8 {
                  for j in 0..8 {
                      if g[i][j] == b'R' {
                          r0 = i as i32;
                          c0 = j as i32;
                      }
                  }
              }
              let dirs = [(1i32, 0i32), (-1, 0), (0, 1), (0, -1)];
              let mut caps = 0;
              for &(dr, dc) in dirs.iter() {
                  let (mut r, mut c) = (r0 + dr, c0 + dc);
                  while r >= 0 && c >= 0 && r < 8 && c < 8 && g[r as usize][c as usize] == b'.' {
                      r += dr;
                      c += dc;
                  }
                  if r >= 0 && c >= 0 && r < 8 && c < 8 && g[r as usize][c as usize] == b'p' {
                      caps += 1;
                  }
              }
              caps
          }
        `,
        php: code`
          function numRookCaptures($board) {
              $r0 = 0;
              $c0 = 0;
              for ($i = 0; $i < 8; $i++) for ($j = 0; $j < 8; $j++) if ($board[$i][$j] === 'R') { $r0 = $i; $c0 = $j; }
              $dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
              $caps = 0;
              foreach ($dirs as $d) {
                  $r = $r0 + $d[0];
                  $c = $c0 + $d[1];
                  while ($r >= 0 && $c >= 0 && $r < 8 && $c < 8 && $board[$r][$c] === '.') { $r += $d[0]; $c += $d[1]; }
                  if ($r >= 0 && $c >= 0 && $r < 8 && $c < 8 && $board[$r][$c] === 'p') $caps++;
              }
              return $caps;
          }
        `,
        ruby: code`
          def numRookCaptures(board)
            r0 = c0 = 0
            8.times do |i|
              8.times do |j|
                if board[i][j] == 'R'
                  r0 = i
                  c0 = j
                end
              end
            end
            caps = 0
            [[1, 0], [-1, 0], [0, 1], [0, -1]].each do |dr, dc|
              r = r0 + dr
              c = c0 + dc
              while r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == '.'
                r += dr
                c += dc
              end
              caps += 1 if r >= 0 && c >= 0 && r < 8 && c < 8 && board[r][c] == 'p'
            end
            caps
          end
        `,
      },
    };
  })(),

  // ── Queens That Can Attack the King (LC 1222) ───────────────────
  (() => {
    const ref = (queens: number[][], king: number[]) => {
      const has = new Set(queens.map(([r, c]) => r * 8 + c));
      const out: number[][] = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        for (let r = king[0] + dr, c = king[1] + dc; r >= 0 && c >= 0 && r < 8 && c < 8; r += dr, c += dc) {
          if (has.has(r * 8 + c)) { out.push([r, c]); break; }
        }
      }
      return out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    };
    return {
      slug: "queens-that-can-attack-the-king",
      title: "Queens That Can Attack the King",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Microsoft"],
      signature: { funcName: "queensAttacktheKing", params: [{ name: "queens", type: "int[][]" as const }, { name: "king", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "On an 8 × 8 chessboard (rows and columns numbered 0 to 7) there are several black queens and one white king. `queens[i] = [r, c]` is the square of the i-th queen and `king = [r, c]` is the square of the king.\n\nA queen attacks along its row, its column and both diagonals, but cannot see through another queen. Return the squares of every queen that **directly** attacks the king, sorted by row and then by column.",
        [
          { in: "queens = [[0,0],[1,1],[2,4],[3,0],[4,4],[0,4]], king = [2,2]", out: "[[0,4],[1,1],[2,4],[4,4]]", note: "`[0,0]` is hidden behind `[1,1]` on the same diagonal, and `[3,0]` shares no line with the king." },
          { in: "queens = [[5,5]], king = [0,0]", out: "[[5,5]]" },
          { in: "queens = [[1,2],[3,7]], king = [0,0]", out: "[]" },
        ],
        ["1 <= queens.length < 64", "queens[i].length == king.length == 2", "0 <= queens[i][j], king[j] < 8", "all the given positions are distinct"]),
      hints: [
        "Think from the king's point of view rather than from each queen's.",
        "From the king, look outwards in all 8 directions.",
        "In each direction, the first queen met (if any) attacks the king; everything behind it is blocked. Collect those, then sort.",
      ],
      editorial: explain({
        idea: "Only the nearest queen in each of the king's 8 directions can attack, so walking outwards from the king finds all attackers in at most 56 steps.",
        steps: [
          "Mark the queens' squares on an 8 × 8 grid.",
          "For each direction `(dr, dc)` with `dr, dc` in `{-1, 0, 1}` (not both 0), step from the king until leaving the board or reaching a marked square.",
          "Record the marked square found in each direction.",
          "Return the recorded squares sorted by row, then column (scanning the grid row by row over the recorded marks does this for free).",
        ],
        why: "A queen attacks the king exactly when it shares a line with the king and no piece lies between them — i.e. it is the first piece along that line from the king's side. The walk checks each line from the king outward and stops at the first queen, which is exactly that condition.",
        time: "O(q) to mark plus O(1) for the walks",
        space: "O(1) — the board has 64 squares",
        pitfalls: [
          "Queens behind another queen on the same line are blocked.",
          "There are 8 directions — the four diagonals are easy to forget.",
          "The answer can be empty.",
        ],
      }),
      examples: [
        { input: "[[0,0],[1,1],[2,4],[3,0],[4,4],[0,4]]\n[2,2]", expectedOutput: "[[0,4],[1,1],[2,4],[4,4]]" },
        { input: "[[5,5]]\n[0,0]", expectedOutput: "[[5,5]]" },
        { input: "[[1,2],[3,7]]\n[0,0]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const cells = shuffle(rng, Array.from({ length: 64 }, (_, i) => i));
        const k = cells[0];
        const count = ri(rng, 1, pick(rng, [3, 10, 25, 63]));
        const queens = cells.slice(1, 1 + count).map((v) => [Math.floor(v / 8), v % 8]);
        const king = [Math.floor(k / 8), k % 8];
        return { input: `${fmtIntMat(queens)}\n${fmtIntArr(king)}`, expectedOutput: fmtIntMat(ref(queens, king)) };
      },
      solutions: {
        python: code`
          from typing import List

          def queensAttacktheKing(queens: List[List[int]], king: List[int]) -> List[List[int]]:
              board = [[False] * 8 for _ in range(8)]
              for r, c in queens:
                  board[r][c] = True
              hit = [[False] * 8 for _ in range(8)]
              for dr in (-1, 0, 1):
                  for dc in (-1, 0, 1):
                      if dr == 0 and dc == 0:
                          continue
                      r, c = king[0] + dr, king[1] + dc
                      while 0 <= r < 8 and 0 <= c < 8:
                          if board[r][c]:
                              hit[r][c] = True
                              break
                          r += dr
                          c += dc
              return [[r, c] for r in range(8) for c in range(8) if hit[r][c]]
        `,
        javascript: code`
          var queensAttacktheKing = function(queens, king) {
              var board = [], hit = [];
              for (var i = 0; i < 8; i++) { board.push(new Array(8).fill(false)); hit.push(new Array(8).fill(false)); }
              for (var q = 0; q < queens.length; q++) board[queens[q][0]][queens[q][1]] = true;
              for (var dr = -1; dr <= 1; dr++) {
                  for (var dc = -1; dc <= 1; dc++) {
                      if (dr === 0 && dc === 0) continue;
                      for (var r = king[0] + dr, c = king[1] + dc; r >= 0 && c >= 0 && r < 8 && c < 8; r += dr, c += dc) {
                          if (board[r][c]) { hit[r][c] = true; break; }
                      }
                  }
              }
              var out = [];
              for (var a = 0; a < 8; a++) for (var b = 0; b < 8; b++) if (hit[a][b]) out.push([a, b]);
              return out;
          };
        `,
        typescript: code`
          function queensAttacktheKing(queens: number[][], king: number[]): number[][] {
              var board: boolean[][] = [], hit: boolean[][] = [];
              for (var i = 0; i < 8; i++) {
                  var x: boolean[] = [], y: boolean[] = [];
                  for (var j = 0; j < 8; j++) { x.push(false); y.push(false); }
                  board.push(x); hit.push(y);
              }
              for (var q = 0; q < queens.length; q++) board[queens[q][0]][queens[q][1]] = true;
              for (var dr = -1; dr <= 1; dr++) {
                  for (var dc = -1; dc <= 1; dc++) {
                      if (dr === 0 && dc === 0) continue;
                      for (var r = king[0] + dr, c = king[1] + dc; r >= 0 && c >= 0 && r < 8 && c < 8; r += dr, c += dc) {
                          if (board[r][c]) { hit[r][c] = true; break; }
                      }
                  }
              }
              var out: number[][] = [];
              for (var a = 0; a < 8; a++) for (var b = 0; b < 8; b++) if (hit[a][b]) out.push([a, b]);
              return out;
          }
        `,
        java: code`
          public static int[][] queensAttacktheKing(int[][] queens, int[] king) {
              boolean[][] board = new boolean[8][8], hit = new boolean[8][8];
              for (int[] q : queens) board[q[0]][q[1]] = true;
              for (int dr = -1; dr <= 1; dr++) {
                  for (int dc = -1; dc <= 1; dc++) {
                      if (dr == 0 && dc == 0) continue;
                      for (int r = king[0] + dr, c = king[1] + dc; r >= 0 && c >= 0 && r < 8 && c < 8; r += dr, c += dc) {
                          if (board[r][c]) { hit[r][c] = true; break; }
                      }
                  }
              }
              List<int[]> out = new ArrayList<>();
              for (int a = 0; a < 8; a++) for (int b = 0; b < 8; b++) if (hit[a][b]) out.add(new int[]{a, b});
              return out.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> queensAttacktheKing(vector<vector<int>>& queens, vector<int>& king) {
              bool board[8][8] = {}, hit[8][8] = {};
              for (auto& q : queens) board[q[0]][q[1]] = true;
              for (int dr = -1; dr <= 1; dr++) {
                  for (int dc = -1; dc <= 1; dc++) {
                      if (dr == 0 && dc == 0) continue;
                      for (int r = king[0] + dr, c = king[1] + dc; r >= 0 && c >= 0 && r < 8 && c < 8; r += dr, c += dc) {
                          if (board[r][c]) { hit[r][c] = true; break; }
                      }
                  }
              }
              vector<vector<int>> out;
              for (int a = 0; a < 8; a++) for (int b = 0; b < 8; b++) if (hit[a][b]) out.push_back({a, b});
              return out;
          }
        `,
        c: code`
          int** queensAttacktheKing(int** queens, int queensSize, int* queensColSize, int* king, int kingSize, int* returnSize, int** returnColumnSizes) {
              bool board[8][8] = {{false}}, hit[8][8] = {{false}};
              for (int i = 0; i < queensSize; i++) board[queens[i][0]][queens[i][1]] = true;
              for (int dr = -1; dr <= 1; dr++) {
                  for (int dc = -1; dc <= 1; dc++) {
                      if (dr == 0 && dc == 0) continue;
                      for (int r = king[0] + dr, c = king[1] + dc; r >= 0 && c >= 0 && r < 8 && c < 8; r += dr, c += dc) {
                          if (board[r][c]) { hit[r][c] = true; break; }
                      }
                  }
              }
              int** out = (int**)malloc(8 * sizeof(int*));
              *returnColumnSizes = (int*)malloc(8 * sizeof(int));
              int cnt = 0;
              for (int a = 0; a < 8; a++) {
                  for (int b = 0; b < 8; b++) {
                      if (!hit[a][b]) continue;
                      out[cnt] = (int*)malloc(2 * sizeof(int));
                      out[cnt][0] = a;
                      out[cnt][1] = b;
                      (*returnColumnSizes)[cnt] = 2;
                      cnt++;
                  }
              }
              *returnSize = cnt;
              return out;
          }
        `,
        csharp: code`
          public static int[][] QueensAttacktheKing(int[][] queens, int[] king)
          {
              var board = new bool[8, 8];
              var hit = new bool[8, 8];
              foreach (var q in queens) board[q[0], q[1]] = true;
              for (int dr = -1; dr <= 1; dr++)
              {
                  for (int dc = -1; dc <= 1; dc++)
                  {
                      if (dr == 0 && dc == 0) continue;
                      for (int r = king[0] + dr, c = king[1] + dc; r >= 0 && c >= 0 && r < 8 && c < 8; r += dr, c += dc)
                      {
                          if (board[r, c]) { hit[r, c] = true; break; }
                      }
                  }
              }
              var result = new List<int[]>();
              for (int a = 0; a < 8; a++) for (int b = 0; b < 8; b++) if (hit[a, b]) result.Add(new[] { a, b });
              return result.ToArray();
          }
        `,
        go: code`
          func queensAttacktheKing(queens [][]int, king []int) [][]int {
          	var board, hit [8][8]bool
          	for _, q := range queens {
          		board[q[0]][q[1]] = true
          	}
          	for dr := -1; dr <= 1; dr++ {
          		for dc := -1; dc <= 1; dc++ {
          			if dr == 0 && dc == 0 {
          				continue
          			}
          			for r, c := king[0]+dr, king[1]+dc; r >= 0 && c >= 0 && r < 8 && c < 8; r, c = r+dr, c+dc {
          				if board[r][c] {
          					hit[r][c] = true
          					break
          				}
          			}
          		}
          	}
          	out := [][]int{}
          	for a := 0; a < 8; a++ {
          		for b := 0; b < 8; b++ {
          			if hit[a][b] {
          				out = append(out, []int{a, b})
          			}
          		}
          	}
          	return out
          }
        `,
        kotlin: code`
          fun queensAttacktheKing(queens: Array<IntArray>, king: IntArray): Array<IntArray> {
              val board = Array(8) { BooleanArray(8) }
              val hit = Array(8) { BooleanArray(8) }
              for (q in queens) board[q[0]][q[1]] = true
              for (dr in -1..1) {
                  for (dc in -1..1) {
                      if (dr == 0 && dc == 0) continue
                      var r = king[0] + dr
                      var c = king[1] + dc
                      while (r in 0..7 && c in 0..7) {
                          if (board[r][c]) { hit[r][c] = true; break }
                          r += dr
                          c += dc
                      }
                  }
              }
              val out = ArrayList<IntArray>()
              for (a in 0 until 8) for (b in 0 until 8) if (hit[a][b]) out.add(intArrayOf(a, b))
              return out.toTypedArray()
          }
        `,
        swift: code`
          func queensAttacktheKing(_ queens: [[Int]], _ king: [Int]) -> [[Int]] {
              var board = [[Bool]](repeating: [Bool](repeating: false, count: 8), count: 8)
              var hit = board
              for q in queens { board[q[0]][q[1]] = true }
              for dr in -1...1 {
                  for dc in -1...1 {
                      if dr == 0 && dc == 0 { continue }
                      var r = king[0] + dr, c = king[1] + dc
                      while r >= 0 && c >= 0 && r < 8 && c < 8 {
                          if board[r][c] { hit[r][c] = true; break }
                          r += dr
                          c += dc
                      }
                  }
              }
              var out = [[Int]]()
              for a in 0..<8 { for b in 0..<8 where hit[a][b] { out.append([a, b]) } }
              return out
          }
        `,
        rust: code`
          fn queensAttacktheKing(queens: Vec<Vec<i32>>, king: Vec<i32>) -> Vec<Vec<i32>> {
              let mut board = [[false; 8]; 8];
              let mut hit = [[false; 8]; 8];
              for q in queens.iter() {
                  board[q[0] as usize][q[1] as usize] = true;
              }
              for dr in -1i32..=1 {
                  for dc in -1i32..=1 {
                      if dr == 0 && dc == 0 {
                          continue;
                      }
                      let (mut r, mut c) = (king[0] + dr, king[1] + dc);
                      while r >= 0 && c >= 0 && r < 8 && c < 8 {
                          if board[r as usize][c as usize] {
                              hit[r as usize][c as usize] = true;
                              break;
                          }
                          r += dr;
                          c += dc;
                      }
                  }
              }
              let mut out: Vec<Vec<i32>> = Vec::new();
              for a in 0..8 {
                  for b in 0..8 {
                      if hit[a][b] {
                          out.push(vec![a as i32, b as i32]);
                      }
                  }
              }
              out
          }
        `,
        php: code`
          function queensAttacktheKing($queens, $king) {
              $board = [];
              foreach ($queens as $q) $board[$q[0] * 8 + $q[1]] = true;
              $hit = [];
              for ($dr = -1; $dr <= 1; $dr++) {
                  for ($dc = -1; $dc <= 1; $dc++) {
                      if ($dr == 0 && $dc == 0) continue;
                      for ($r = $king[0] + $dr, $c = $king[1] + $dc; $r >= 0 && $c >= 0 && $r < 8 && $c < 8; $r += $dr, $c += $dc) {
                          if (isset($board[$r * 8 + $c])) { $hit[$r * 8 + $c] = true; break; }
                      }
                  }
              }
              $out = [];
              for ($a = 0; $a < 8; $a++) for ($b = 0; $b < 8; $b++) if (isset($hit[$a * 8 + $b])) $out[] = [$a, $b];
              return $out;
          }
        `,
        ruby: code`
          def queensAttacktheKing(queens, king)
            board = Array.new(8) { Array.new(8, false) }
            queens.each { |r, c| board[r][c] = true }
            hit = Array.new(8) { Array.new(8, false) }
            [-1, 0, 1].each do |dr|
              [-1, 0, 1].each do |dc|
                next if dr == 0 && dc == 0
                r = king[0] + dr
                c = king[1] + dc
                while r >= 0 && c >= 0 && r < 8 && c < 8
                  if board[r][c]
                    hit[r][c] = true
                    break
                  end
                  r += dr
                  c += dc
                end
              end
            end
            out = []
            8.times { |a| 8.times { |b| out << [a, b] if hit[a][b] } }
            out
          end
        `,
      },
    };
  })(),

  // ── Valid Tic-Tac-Toe State (LC 794) ────────────────────────────
  (() => {
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const wins = (b: string[], p: string) => LINES.some((l) => l.every((i) => b[i] === p));
    // Every position reachable in a real game, found by playing every game out (5,478 of them).
    let reach: string[] | null = null;
    const reachable = () => {
      if (reach) return reach;
      const seen = new Set<string>();
      const dfs = (b: string[], turn: string) => {
        const key = b.join("");
        if (seen.has(key)) return;
        seen.add(key);
        if (wins(b, "X") || wins(b, "O")) return;
        for (let i = 0; i < 9; i++) {
          if (b[i] !== " ") continue;
          b[i] = turn;
          dfs(b, turn === "X" ? "O" : "X");
          b[i] = " ";
        }
      };
      dfs(new Array<string>(9).fill(" "), "X");
      reach = [...seen];
      return reach;
    };
    let reachSet: Set<string> | null = null;
    const ref = (board: string[]) => {
      if (!reachSet) reachSet = new Set(reachable());
      return reachSet.has(board.join(""));
    };
    const rows = (flat: string) => [flat.slice(0, 3), flat.slice(3, 6), flat.slice(6, 9)];
    return {
      slug: "valid-tic-tac-toe-state",
      title: "Valid Tic-Tac-Toe State",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Microsoft", "Meta"],
      signature: { funcName: "validTicTacToe", params: [{ name: "board", type: "string[]" as const }], returns: "bool" as const },
      description: describe(
        "A tic-tac-toe board is given as 3 strings of 3 characters, each `'X'`, `'O'` or `' '` (an empty square).\n\nTwo players take turns placing marks on empty squares: the first player always places `'X'`, the second always `'O'`. The game ends as soon as one player has three of their marks in a row, column or diagonal, or when all nine squares are filled; no marks are placed after that.\n\nReturn `true` if this board can appear at some point during a valid game, and `false` otherwise.",
        [
          { in: "board = [\"O  \",\"   \",\"   \"]", out: "false", note: "`'X'` always moves first, so a lone `'O'` is impossible." },
          { in: "board = [\"XXX\",\"OO \",\"   \"]", out: "true", note: "X completes the top row on its third move, after O's second move." },
          { in: "board = [\"XXX\",\"   \",\"OOO\"]", out: "false", note: "Both players cannot have won — the game would have ended at the first win." },
        ],
        ["board.length == 3", "board[i].length == 3", "board[i][j] is 'X', 'O' or ' '"]),
      hints: [
        "Count the marks. Since X moves first and players alternate, how must the counts relate?",
        "If X has three in a row, the game ended right after one of X's moves. What does that say about the counts?",
        "Valid exactly when: `x == o` or `x == o + 1`; if X has a line then `x == o + 1`; if O has a line then `x == o`.",
      ],
      editorial: explain({
        idea: "A board is reachable exactly when its mark counts fit the turn order and any completed line belongs to the player who moved last.",
        steps: [
          "Count `x` and `o`. If not (`x == o` or `x == o + 1`), return `false`.",
          "Check whether X has three in a line and whether O does.",
          "If X has a line and `x != o + 1`, return `false` — X's winning move must have been the last.",
          "If O has a line and `x != o`, return `false` — O's winning move must have been the last.",
          "Otherwise return `true`.",
        ],
        why: "The conditions are necessary: turns alternate starting with X, and play stops right after a winning move, so the winner must have moved last. They are also sufficient: given counts that fit, remove the marks in an order that keeps a winning line's last mark until the very end — every earlier position then contains no completed line, so the game could have reached this board. (Both players winning is ruled out automatically, since it would need `x == o + 1` and `x == o` at once.)",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "X may legitimately have two winning lines at once (one move completing both), so do not reject a double line.",
          "A full board with no winner is valid if `x == 5` and `o == 4`.",
          "Spaces are significant characters in the rows — do not trim them.",
        ],
      }),
      examples: [
        { input: '["O  ","   ","   "]', expectedOutput: "false" },
        { input: '["XXX","OO ","   "]', expectedOutput: "true" },
        { input: '["XXX","   ","OOO"]', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const all = reachable();
        const mode = ri(rng, 0, 4);
        let flat: string;
        if (mode <= 1) {
          flat = pick(rng, all);
        } else if (mode === 2) {
          const b = pick(rng, all).split("");
          b[ri(rng, 0, 8)] = pick(rng, ["X", "O", " "]);
          flat = b.join("");
        } else {
          const w = pick(rng, [[1, 1, 1], [2, 2, 1], [1, 2, 2]]);
          flat = Array.from({ length: 9 }, () => {
            const t = rng() * (w[0] + w[1] + w[2]);
            return t < w[0] ? " " : t < w[0] + w[1] ? "X" : "O";
          }).join("");
        }
        const board = rows(flat);
        return { input: fmtStrArr(board), expectedOutput: bool(ref(board)) };
      },
      solutions: {
        python: code`
          from typing import List

          def validTicTacToe(board: List[str]) -> bool:
              x = sum(row.count('X') for row in board)
              o = sum(row.count('O') for row in board)
              if o > x or x > o + 1:
                  return False

              def wins(p):
                  for k in range(3):
                      if all(board[k][j] == p for j in range(3)):
                          return True
                      if all(board[i][k] == p for i in range(3)):
                          return True
                  if all(board[i][i] == p for i in range(3)):
                      return True
                  return all(board[i][2 - i] == p for i in range(3))

              if wins('X') and x != o + 1:
                  return False
              if wins('O') and x != o:
                  return False
              return True
        `,
        javascript: code`
          var validTicTacToe = function(board) {
              var x = 0, o = 0;
              for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
                  if (board[i][j] === 'X') x++;
                  else if (board[i][j] === 'O') o++;
              }
              if (o > x || x > o + 1) return false;
              var wins = function(p) {
                  for (var k = 0; k < 3; k++) {
                      if (board[k][0] === p && board[k][1] === p && board[k][2] === p) return true;
                      if (board[0][k] === p && board[1][k] === p && board[2][k] === p) return true;
                  }
                  return (board[0][0] === p && board[1][1] === p && board[2][2] === p) ||
                      (board[0][2] === p && board[1][1] === p && board[2][0] === p);
              };
              if (wins('X') && x !== o + 1) return false;
              if (wins('O') && x !== o) return false;
              return true;
          };
        `,
        typescript: code`
          function validTicTacToe(board: string[]): boolean {
              var at = function(r: number, c: number): string { return board[r].charAt(c); };
              var x = 0, o = 0;
              for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
                  if (at(i, j) === 'X') x++;
                  else if (at(i, j) === 'O') o++;
              }
              if (o > x || x > o + 1) return false;
              var wins = function(p: string): boolean {
                  for (var k = 0; k < 3; k++) {
                      if (at(k, 0) === p && at(k, 1) === p && at(k, 2) === p) return true;
                      if (at(0, k) === p && at(1, k) === p && at(2, k) === p) return true;
                  }
                  return (at(0, 0) === p && at(1, 1) === p && at(2, 2) === p) ||
                      (at(0, 2) === p && at(1, 1) === p && at(2, 0) === p);
              };
              if (wins('X') && x !== o + 1) return false;
              if (wins('O') && x !== o) return false;
              return true;
          }
        `,
        java: code`
          public static boolean validTicTacToe(String[] board) {
              int x = 0, o = 0;
              for (String row : board) for (char ch : row.toCharArray()) {
                  if (ch == 'X') x++;
                  else if (ch == 'O') o++;
              }
              if (o > x || x > o + 1) return false;
              if (winsTtt(board, 'X') && x != o + 1) return false;
              if (winsTtt(board, 'O') && x != o) return false;
              return true;
          }

          private static boolean winsTtt(String[] b, char p) {
              for (int k = 0; k < 3; k++) {
                  if (b[k].charAt(0) == p && b[k].charAt(1) == p && b[k].charAt(2) == p) return true;
                  if (b[0].charAt(k) == p && b[1].charAt(k) == p && b[2].charAt(k) == p) return true;
              }
              return (b[0].charAt(0) == p && b[1].charAt(1) == p && b[2].charAt(2) == p)
                  || (b[0].charAt(2) == p && b[1].charAt(1) == p && b[2].charAt(0) == p);
          }
        `,
        cpp: code`
          static bool winsTtt(vector<string>& b, char p) {
              for (int k = 0; k < 3; k++) {
                  if (b[k][0] == p && b[k][1] == p && b[k][2] == p) return true;
                  if (b[0][k] == p && b[1][k] == p && b[2][k] == p) return true;
              }
              return (b[0][0] == p && b[1][1] == p && b[2][2] == p) || (b[0][2] == p && b[1][1] == p && b[2][0] == p);
          }

          bool validTicTacToe(vector<string>& board) {
              int x = 0, o = 0;
              for (auto& row : board) for (char ch : row) {
                  if (ch == 'X') x++;
                  else if (ch == 'O') o++;
              }
              if (o > x || x > o + 1) return false;
              if (winsTtt(board, 'X') && x != o + 1) return false;
              if (winsTtt(board, 'O') && x != o) return false;
              return true;
          }
        `,
        c: code`
          static bool winsTtt(char** b, char p) {
              for (int k = 0; k < 3; k++) {
                  if (b[k][0] == p && b[k][1] == p && b[k][2] == p) return true;
                  if (b[0][k] == p && b[1][k] == p && b[2][k] == p) return true;
              }
              return (b[0][0] == p && b[1][1] == p && b[2][2] == p) || (b[0][2] == p && b[1][1] == p && b[2][0] == p);
          }

          bool validTicTacToe(char** board, int boardSize) {
              int x = 0, o = 0;
              for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) {
                  if (board[i][j] == 'X') x++;
                  else if (board[i][j] == 'O') o++;
              }
              if (o > x || x > o + 1) return false;
              if (winsTtt(board, 'X') && x != o + 1) return false;
              if (winsTtt(board, 'O') && x != o) return false;
              return true;
          }
        `,
        csharp: code`
          public static bool ValidTicTacToe(string[] board)
          {
              int x = 0, o = 0;
              foreach (var row in board) foreach (var ch in row)
              {
                  if (ch == 'X') x++;
                  else if (ch == 'O') o++;
              }
              if (o > x || x > o + 1) return false;
              if (WinsTtt(board, 'X') && x != o + 1) return false;
              if (WinsTtt(board, 'O') && x != o) return false;
              return true;
          }

          private static bool WinsTtt(string[] b, char p)
          {
              for (int k = 0; k < 3; k++)
              {
                  if (b[k][0] == p && b[k][1] == p && b[k][2] == p) return true;
                  if (b[0][k] == p && b[1][k] == p && b[2][k] == p) return true;
              }
              return (b[0][0] == p && b[1][1] == p && b[2][2] == p) || (b[0][2] == p && b[1][1] == p && b[2][0] == p);
          }
        `,
        go: code`
          func winsTtt(b []string, p byte) bool {
          	for k := 0; k < 3; k++ {
          		if b[k][0] == p && b[k][1] == p && b[k][2] == p {
          			return true
          		}
          		if b[0][k] == p && b[1][k] == p && b[2][k] == p {
          			return true
          		}
          	}
          	return (b[0][0] == p && b[1][1] == p && b[2][2] == p) || (b[0][2] == p && b[1][1] == p && b[2][0] == p)
          }

          func validTicTacToe(board []string) bool {
          	x, o := 0, 0
          	for i := 0; i < 3; i++ {
          		for j := 0; j < 3; j++ {
          			if board[i][j] == 'X' {
          				x++
          			} else if board[i][j] == 'O' {
          				o++
          			}
          		}
          	}
          	if o > x || x > o+1 {
          		return false
          	}
          	if winsTtt(board, 'X') && x != o+1 {
          		return false
          	}
          	if winsTtt(board, 'O') && x != o {
          		return false
          	}
          	return true
          }
        `,
        kotlin: code`
          fun winsTtt(b: Array<String>, p: Char): Boolean {
              for (k in 0 until 3) {
                  if (b[k][0] == p && b[k][1] == p && b[k][2] == p) return true
                  if (b[0][k] == p && b[1][k] == p && b[2][k] == p) return true
              }
              return (b[0][0] == p && b[1][1] == p && b[2][2] == p) || (b[0][2] == p && b[1][1] == p && b[2][0] == p)
          }

          fun validTicTacToe(board: Array<String>): Boolean {
              var x = 0
              var o = 0
              for (row in board) for (ch in row) {
                  if (ch == 'X') x++
                  else if (ch == 'O') o++
              }
              if (o > x || x > o + 1) return false
              if (winsTtt(board, 'X') && x != o + 1) return false
              if (winsTtt(board, 'O') && x != o) return false
              return true
          }
        `,
        swift: code`
          func validTicTacToe(_ board: [String]) -> Bool {
              let b = board.map { Array($0) }
              var x = 0, o = 0
              for row in b {
                  for ch in row {
                      if ch == "X" { x += 1 } else if ch == "O" { o += 1 }
                  }
              }
              if o > x || x > o + 1 { return false }
              func wins(_ p: Character) -> Bool {
                  for k in 0..<3 {
                      if b[k][0] == p && b[k][1] == p && b[k][2] == p { return true }
                      if b[0][k] == p && b[1][k] == p && b[2][k] == p { return true }
                  }
                  return (b[0][0] == p && b[1][1] == p && b[2][2] == p) || (b[0][2] == p && b[1][1] == p && b[2][0] == p)
              }
              if wins("X") && x != o + 1 { return false }
              if wins("O") && x != o { return false }
              return true
          }
        `,
        rust: code`
          fn winsTtt(b: &Vec<&[u8]>, p: u8) -> bool {
              for k in 0..3 {
                  if b[k][0] == p && b[k][1] == p && b[k][2] == p {
                      return true;
                  }
                  if b[0][k] == p && b[1][k] == p && b[2][k] == p {
                      return true;
                  }
              }
              (b[0][0] == p && b[1][1] == p && b[2][2] == p) || (b[0][2] == p && b[1][1] == p && b[2][0] == p)
          }

          fn validTicTacToe(board: Vec<String>) -> bool {
              let b: Vec<&[u8]> = board.iter().map(|s| s.as_bytes()).collect();
              let (mut x, mut o) = (0, 0);
              for row in b.iter() {
                  for &ch in row.iter() {
                      if ch == b'X' {
                          x += 1;
                      } else if ch == b'O' {
                          o += 1;
                      }
                  }
              }
              if o > x || x > o + 1 {
                  return false;
              }
              if winsTtt(&b, b'X') && x != o + 1 {
                  return false;
              }
              if winsTtt(&b, b'O') && x != o {
                  return false;
              }
              true
          }
        `,
        php: code`
          function winsTtt($b, $p) {
              for ($k = 0; $k < 3; $k++) {
                  if ($b[$k][0] === $p && $b[$k][1] === $p && $b[$k][2] === $p) return true;
                  if ($b[0][$k] === $p && $b[1][$k] === $p && $b[2][$k] === $p) return true;
              }
              return ($b[0][0] === $p && $b[1][1] === $p && $b[2][2] === $p) || ($b[0][2] === $p && $b[1][1] === $p && $b[2][0] === $p);
          }

          function validTicTacToe($board) {
              $x = 0;
              $o = 0;
              for ($i = 0; $i < 3; $i++) for ($j = 0; $j < 3; $j++) {
                  if ($board[$i][$j] === 'X') $x++;
                  elseif ($board[$i][$j] === 'O') $o++;
              }
              if ($o > $x || $x > $o + 1) return false;
              if (winsTtt($board, 'X') && $x != $o + 1) return false;
              if (winsTtt($board, 'O') && $x != $o) return false;
              return true;
          }
        `,
        ruby: code`
          def winsTtt(b, p)
            3.times do |k|
              return true if b[k][0] == p && b[k][1] == p && b[k][2] == p
              return true if b[0][k] == p && b[1][k] == p && b[2][k] == p
            end
            (b[0][0] == p && b[1][1] == p && b[2][2] == p) || (b[0][2] == p && b[1][1] == p && b[2][0] == p)
          end

          def validTicTacToe(board)
            x = board.sum { |row| row.count('X') }
            o = board.sum { |row| row.count('O') }
            return false if o > x || x > o + 1
            return false if winsTtt(board, 'X') && x != o + 1
            return false if winsTtt(board, 'O') && x != o
            true
          end
        `,
      },
    };
  })(),

  // ── Transform to Chessboard (LC 782) ────────────────────────────
  (() => {
    const isChess = (b: number[][]) => b.every((row, i) => row.every((v, j) => v === (b[0][0] ^ ((i + j) & 1))));
    // Brute force for n <= 4: BFS over boards reachable by row/column swaps (at most 4! · 4! of them).
    const bfs = (start: number[][]) => {
      const n = start.length;
      const key = (b: number[][]) => b.map((r) => r.join("")).join("|");
      const seen = new Set<string>([key(start)]);
      let frontier = [start];
      for (let d = 0; frontier.length; d++) {
        const next: number[][][] = [];
        for (const b of frontier) {
          if (isChess(b)) return d;
          for (let x = 0; x < n; x++) for (let y = x + 1; y < n; y++) {
            const rs = b.map((r) => r.slice());
            [rs[x], rs[y]] = [rs[y], rs[x]];
            const cs = b.map((r) => { const q = r.slice(); [q[x], q[y]] = [q[y], q[x]]; return q; });
            for (const nb of [rs, cs]) {
              const k = key(nb);
              if (!seen.has(k)) { seen.add(k); next.push(nb); }
            }
          }
        }
        frontier = next;
      }
      return -1;
    };
    // For larger boards: rows and columns are independent; a line pattern needs mismatches / 2 swaps.
    const formula = (b: number[][]) => {
      const n = b.length;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (b[0][0] ^ b[i][0] ^ b[0][j] ^ b[i][j]) return -1;
      const side = (line: number[]) => {
        const ones = line.reduce((a, v) => a + v, 0);
        if (ones !== Math.floor(n / 2) && ones !== Math.ceil(n / 2)) return -1;
        let best = Infinity;
        for (const first of [0, 1]) {
          const target = line.map((_, i) => first ^ (i & 1));
          if (target.reduce((a, v) => a + v, 0) !== ones) continue;
          const mism = line.reduce((a, v, i) => a + (v !== target[i] ? 1 : 0), 0);
          best = Math.min(best, mism / 2);
        }
        return best;
      };
      const rs = side(b.map((r) => r[0])), cs = side(b[0]);
      return rs < 0 || cs < 0 ? -1 : rs + cs;
    };
    const ref = (b: number[][]) => (b.length <= 4 ? bfs(b) : formula(b));
    return {
      slug: "transform-to-chessboard",
      title: "Transform to Chessboard",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Bit Manipulation", "Matrix", "Google", "Amazon"],
      signature: { funcName: "movesToChessboard", params: [{ name: "board", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`board` is an `n x n` binary grid. In one move you may swap **any two rows** or **any two columns**.\n\nA **chessboard** is a board in which no two cells that share an edge hold the same value — the 0s and 1s alternate along every row and every column.\n\nReturn the minimum number of moves that turn `board` into a chessboard, or `-1` if it cannot be done.",
        [
          { in: "board = [[1,1,0,0],[0,0,1,1],[1,1,0,0],[0,0,1,1]]", out: "1", note: "The rows already alternate; swapping columns 1 and 2 finishes the job." },
          { in: "board = [[1,0],[0,1]]", out: "0" },
          { in: "board = [[1,1,0],[0,0,1],[1,0,0]]", out: "-1", note: "Rows `[0,0,1]` and `[1,0,0]` are neither equal nor complementary, which no swap can fix." },
        ],
        ["n == board.length", "n == board[i].length", "2 <= n <= 30", "board[i][j] is 0 or 1"]),
      hints: [
        "Swapping rows never changes what a row contains, and swapping columns permutes every row the same way. In a chessboard, every row equals the first row or its complement.",
        "So the board is fixable only if every row is the first row or its exact complement (equivalently `b[0][0] ^ b[i][0] ^ b[0][j] ^ b[i][j] == 0` everywhere), and the two kinds are balanced.",
        "Rows and columns can then be solved independently: the first column must become `0101…` or `1010…`, and moving it there costs half the number of mismatched positions. Pick the cheaper valid target for each.",
      ],
      editorial: explain({
        idea: "Row swaps and column swaps act independently, and a chessboard is fully determined by its first row and first column, so the problem splits into two 1D \"make this 0/1 line alternate by swaps\" problems.",
        steps: [
          "Check `b[0][0] ^ b[i][0] ^ b[0][j] ^ b[i][j] == 0` for every cell; otherwise return `-1` (some row is neither the first row nor its complement).",
          "Count the 1s in the first row and in the first column; each must be `n / 2` or `(n + 1) / 2` (rounded down/up), otherwise return `-1`.",
          "Let `rowSwap` be the number of `i` with `b[i][0] == i % 2` and `colSwap` the number with `b[0][i] == i % 2` — the mismatches against the pattern `1010…`.",
          "If `n` is odd, only one pattern has the right number of 1s and its mismatch count is even: replace an odd count `x` by `n - x`. If `n` is even, take `min(x, n - x)`.",
          "Return `(rowSwap + colSwap) / 2`.",
        ],
        why: "Any reachable board has the same multiset of rows as the input, permuted, with all rows permuted by the same column order. A chessboard has exactly two row kinds (complements of each other) in alternating order, so the XOR condition and the balance are necessary — and sufficient, since the first column and first row can each be arranged independently. Fixing a 0/1 line needs one swap per pair of misplaced entries, i.e. mismatches / 2, and that is also a lower bound because a swap fixes at most two positions.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "For odd `n`, only the target whose majority value matches the line's majority is possible — do not take a plain minimum.",
          "Checking only the first row and column is not enough; every row must be the first row or its complement.",
          "Each swap fixes two mismatches, so divide the total by 2.",
        ],
      }),
      examples: [
        { input: "[[1,1,0,0],[0,0,1,1],[1,1,0,0],[0,0,1,1]]", expectedOutput: "1" },
        { input: "[[1,0],[0,1]]", expectedOutput: "0" },
        { input: "[[1,1,0],[0,0,1],[1,0,0]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [4, 4, 6, 9]));
        const mode = ri(rng, 0, 9);
        let b: number[][];
        if (mode <= 6) {
          // a chessboard with its rows and columns shuffled — always solvable
          const first = ri(rng, 0, 1);
          const chess = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => first ^ ((i + j) & 1)));
          const pr = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          const pc = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          b = pr.map((r) => pc.map((c) => chess[r][c]));
          if (mode === 6) b[ri(rng, 0, n - 1)][ri(rng, 0, n - 1)] ^= 1;
        } else if (mode <= 8) {
          // rows drawn from a line and its complement, possibly unbalanced
          const line = Array.from({ length: n }, () => ri(rng, 0, 1));
          b = Array.from({ length: n }, () => (rng() < 0.5 ? line.slice() : line.map((v) => v ^ 1)));
        } else {
          b = randGrid(rng, n, n, 0, 1);
        }
        return { input: fmtIntMat(b), expectedOutput: String(ref(b)) };
      },
      solutions: {
        python: code`
          from typing import List

          def movesToChessboard(board: List[List[int]]) -> int:
              n = len(board)
              for i in range(n):
                  for j in range(n):
                      if board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]:
                          return -1
              row_sum = sum(board[0])
              col_sum = sum(board[i][0] for i in range(n))
              if not (n // 2 <= row_sum <= (n + 1) // 2) or not (n // 2 <= col_sum <= (n + 1) // 2):
                  return -1
              row_swap = sum(1 for i in range(n) if board[i][0] == i % 2)
              col_swap = sum(1 for i in range(n) if board[0][i] == i % 2)
              if n % 2 == 1:
                  if row_swap % 2 == 1:
                      row_swap = n - row_swap
                  if col_swap % 2 == 1:
                      col_swap = n - col_swap
              else:
                  row_swap = min(row_swap, n - row_swap)
                  col_swap = min(col_swap, n - col_swap)
              return (row_swap + col_swap) // 2
        `,
        javascript: code`
          var movesToChessboard = function(board) {
              var n = board.length;
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < n; j++) {
                      if ((board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) !== 0) return -1;
                  }
              }
              var rowSum = 0, colSum = 0, rowSwap = 0, colSwap = 0;
              for (var k = 0; k < n; k++) {
                  rowSum += board[0][k];
                  colSum += board[k][0];
                  if (board[k][0] === k % 2) rowSwap++;
                  if (board[0][k] === k % 2) colSwap++;
              }
              var lo = Math.floor(n / 2), hi = Math.floor((n + 1) / 2);
              if (rowSum < lo || rowSum > hi || colSum < lo || colSum > hi) return -1;
              if (n % 2 === 1) {
                  if (rowSwap % 2 === 1) rowSwap = n - rowSwap;
                  if (colSwap % 2 === 1) colSwap = n - colSwap;
              } else {
                  rowSwap = Math.min(rowSwap, n - rowSwap);
                  colSwap = Math.min(colSwap, n - colSwap);
              }
              return (rowSwap + colSwap) / 2;
          };
        `,
        typescript: code`
          function movesToChessboard(board: number[][]): number {
              var n = board.length;
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < n; j++) {
                      if ((board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) !== 0) return -1;
                  }
              }
              var rowSum = 0, colSum = 0, rowSwap = 0, colSwap = 0;
              for (var k = 0; k < n; k++) {
                  rowSum += board[0][k];
                  colSum += board[k][0];
                  if (board[k][0] === k % 2) rowSwap++;
                  if (board[0][k] === k % 2) colSwap++;
              }
              var lo = Math.floor(n / 2), hi = Math.floor((n + 1) / 2);
              if (rowSum < lo || rowSum > hi || colSum < lo || colSum > hi) return -1;
              if (n % 2 === 1) {
                  if (rowSwap % 2 === 1) rowSwap = n - rowSwap;
                  if (colSwap % 2 === 1) colSwap = n - colSwap;
              } else {
                  rowSwap = Math.min(rowSwap, n - rowSwap);
                  colSwap = Math.min(colSwap, n - colSwap);
              }
              return (rowSwap + colSwap) / 2;
          }
        `,
        java: code`
          public static int movesToChessboard(int[][] board) {
              int n = board.length;
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++)
                      if ((board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) != 0) return -1;
              int rowSum = 0, colSum = 0, rowSwap = 0, colSwap = 0;
              for (int k = 0; k < n; k++) {
                  rowSum += board[0][k];
                  colSum += board[k][0];
                  if (board[k][0] == k % 2) rowSwap++;
                  if (board[0][k] == k % 2) colSwap++;
              }
              int lo = n / 2, hi = (n + 1) / 2;
              if (rowSum < lo || rowSum > hi || colSum < lo || colSum > hi) return -1;
              if (n % 2 == 1) {
                  if (rowSwap % 2 == 1) rowSwap = n - rowSwap;
                  if (colSwap % 2 == 1) colSwap = n - colSwap;
              } else {
                  rowSwap = Math.min(rowSwap, n - rowSwap);
                  colSwap = Math.min(colSwap, n - colSwap);
              }
              return (rowSwap + colSwap) / 2;
          }
        `,
        cpp: code`
          int movesToChessboard(vector<vector<int>>& board) {
              int n = board.size();
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++)
                      if ((board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) != 0) return -1;
              int rowSum = 0, colSum = 0, rowSwap = 0, colSwap = 0;
              for (int k = 0; k < n; k++) {
                  rowSum += board[0][k];
                  colSum += board[k][0];
                  if (board[k][0] == k % 2) rowSwap++;
                  if (board[0][k] == k % 2) colSwap++;
              }
              int lo = n / 2, hi = (n + 1) / 2;
              if (rowSum < lo || rowSum > hi || colSum < lo || colSum > hi) return -1;
              if (n % 2 == 1) {
                  if (rowSwap % 2 == 1) rowSwap = n - rowSwap;
                  if (colSwap % 2 == 1) colSwap = n - colSwap;
              } else {
                  rowSwap = min(rowSwap, n - rowSwap);
                  colSwap = min(colSwap, n - colSwap);
              }
              return (rowSwap + colSwap) / 2;
          }
        `,
        c: code`
          int movesToChessboard(int** board, int boardSize, int* boardColSize) {
              int n = boardSize;
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++)
                      if ((board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) != 0) return -1;
              int rowSum = 0, colSum = 0, rowSwap = 0, colSwap = 0;
              for (int k = 0; k < n; k++) {
                  rowSum += board[0][k];
                  colSum += board[k][0];
                  if (board[k][0] == k % 2) rowSwap++;
                  if (board[0][k] == k % 2) colSwap++;
              }
              int lo = n / 2, hi = (n + 1) / 2;
              if (rowSum < lo || rowSum > hi || colSum < lo || colSum > hi) return -1;
              if (n % 2 == 1) {
                  if (rowSwap % 2 == 1) rowSwap = n - rowSwap;
                  if (colSwap % 2 == 1) colSwap = n - colSwap;
              } else {
                  if (n - rowSwap < rowSwap) rowSwap = n - rowSwap;
                  if (n - colSwap < colSwap) colSwap = n - colSwap;
              }
              return (rowSwap + colSwap) / 2;
          }
        `,
        csharp: code`
          public static int MovesToChessboard(int[][] board)
          {
              int n = board.Length;
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++)
                      if ((board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) != 0) return -1;
              int rowSum = 0, colSum = 0, rowSwap = 0, colSwap = 0;
              for (int k = 0; k < n; k++)
              {
                  rowSum += board[0][k];
                  colSum += board[k][0];
                  if (board[k][0] == k % 2) rowSwap++;
                  if (board[0][k] == k % 2) colSwap++;
              }
              int lo = n / 2, hi = (n + 1) / 2;
              if (rowSum < lo || rowSum > hi || colSum < lo || colSum > hi) return -1;
              if (n % 2 == 1)
              {
                  if (rowSwap % 2 == 1) rowSwap = n - rowSwap;
                  if (colSwap % 2 == 1) colSwap = n - colSwap;
              }
              else
              {
                  rowSwap = Math.Min(rowSwap, n - rowSwap);
                  colSwap = Math.Min(colSwap, n - colSwap);
              }
              return (rowSwap + colSwap) / 2;
          }
        `,
        go: code`
          func movesToChessboard(board [][]int) int {
          	n := len(board)
          	for i := 0; i < n; i++ {
          		for j := 0; j < n; j++ {
          			if board[0][0]^board[i][0]^board[0][j]^board[i][j] != 0 {
          				return -1
          			}
          		}
          	}
          	rowSum, colSum, rowSwap, colSwap := 0, 0, 0, 0
          	for k := 0; k < n; k++ {
          		rowSum += board[0][k]
          		colSum += board[k][0]
          		if board[k][0] == k%2 {
          			rowSwap++
          		}
          		if board[0][k] == k%2 {
          			colSwap++
          		}
          	}
          	lo, hi := n/2, (n+1)/2
          	if rowSum < lo || rowSum > hi || colSum < lo || colSum > hi {
          		return -1
          	}
          	if n%2 == 1 {
          		if rowSwap%2 == 1 {
          			rowSwap = n - rowSwap
          		}
          		if colSwap%2 == 1 {
          			colSwap = n - colSwap
          		}
          	} else {
          		if n-rowSwap < rowSwap {
          			rowSwap = n - rowSwap
          		}
          		if n-colSwap < colSwap {
          			colSwap = n - colSwap
          		}
          	}
          	return (rowSwap + colSwap) / 2
          }
        `,
        kotlin: code`
          fun movesToChessboard(board: Array<IntArray>): Int {
              val n = board.size
              for (i in 0 until n)
                  for (j in 0 until n)
                      if ((board[0][0] xor board[i][0] xor board[0][j] xor board[i][j]) != 0) return -1
              var rowSum = 0
              var colSum = 0
              var rowSwap = 0
              var colSwap = 0
              for (k in 0 until n) {
                  rowSum += board[0][k]
                  colSum += board[k][0]
                  if (board[k][0] == k % 2) rowSwap++
                  if (board[0][k] == k % 2) colSwap++
              }
              val lo = n / 2
              val hi = (n + 1) / 2
              if (rowSum < lo || rowSum > hi || colSum < lo || colSum > hi) return -1
              if (n % 2 == 1) {
                  if (rowSwap % 2 == 1) rowSwap = n - rowSwap
                  if (colSwap % 2 == 1) colSwap = n - colSwap
              } else {
                  rowSwap = minOf(rowSwap, n - rowSwap)
                  colSwap = minOf(colSwap, n - colSwap)
              }
              return (rowSwap + colSwap) / 2
          }
        `,
        swift: code`
          func movesToChessboard(_ board: [[Int]]) -> Int {
              let n = board.count
              for i in 0..<n {
                  for j in 0..<n where (board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) != 0 {
                      return -1
                  }
              }
              var rowSum = 0, colSum = 0, rowSwap = 0, colSwap = 0
              for k in 0..<n {
                  rowSum += board[0][k]
                  colSum += board[k][0]
                  if board[k][0] == k % 2 { rowSwap += 1 }
                  if board[0][k] == k % 2 { colSwap += 1 }
              }
              let lo = n / 2, hi = (n + 1) / 2
              if rowSum < lo || rowSum > hi || colSum < lo || colSum > hi { return -1 }
              if n % 2 == 1 {
                  if rowSwap % 2 == 1 { rowSwap = n - rowSwap }
                  if colSwap % 2 == 1 { colSwap = n - colSwap }
              } else {
                  rowSwap = min(rowSwap, n - rowSwap)
                  colSwap = min(colSwap, n - colSwap)
              }
              return (rowSwap + colSwap) / 2
          }
        `,
        rust: code`
          fn movesToChessboard(board: Vec<Vec<i32>>) -> i32 {
              let n = board.len();
              for i in 0..n {
                  for j in 0..n {
                      if (board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) != 0 {
                          return -1;
                      }
                  }
              }
              let (mut row_sum, mut col_sum, mut row_swap, mut col_swap) = (0i32, 0i32, 0i32, 0i32);
              for k in 0..n {
                  row_sum += board[0][k];
                  col_sum += board[k][0];
                  if board[k][0] == (k % 2) as i32 {
                      row_swap += 1;
                  }
                  if board[0][k] == (k % 2) as i32 {
                      col_swap += 1;
                  }
              }
              let n = n as i32;
              let (lo, hi) = (n / 2, (n + 1) / 2);
              if row_sum < lo || row_sum > hi || col_sum < lo || col_sum > hi {
                  return -1;
              }
              if n % 2 == 1 {
                  if row_swap % 2 == 1 {
                      row_swap = n - row_swap;
                  }
                  if col_swap % 2 == 1 {
                      col_swap = n - col_swap;
                  }
              } else {
                  row_swap = std::cmp::min(row_swap, n - row_swap);
                  col_swap = std::cmp::min(col_swap, n - col_swap);
              }
              (row_swap + col_swap) / 2
          }
        `,
        php: code`
          function movesToChessboard($board) {
              $n = count($board);
              for ($i = 0; $i < $n; $i++)
                  for ($j = 0; $j < $n; $j++)
                      if (($board[0][0] ^ $board[$i][0] ^ $board[0][$j] ^ $board[$i][$j]) != 0) return -1;
              $rowSum = 0;
              $colSum = 0;
              $rowSwap = 0;
              $colSwap = 0;
              for ($k = 0; $k < $n; $k++) {
                  $rowSum += $board[0][$k];
                  $colSum += $board[$k][0];
                  if ($board[$k][0] == $k % 2) $rowSwap++;
                  if ($board[0][$k] == $k % 2) $colSwap++;
              }
              $lo = intdiv($n, 2);
              $hi = intdiv($n + 1, 2);
              if ($rowSum < $lo || $rowSum > $hi || $colSum < $lo || $colSum > $hi) return -1;
              if ($n % 2 == 1) {
                  if ($rowSwap % 2 == 1) $rowSwap = $n - $rowSwap;
                  if ($colSwap % 2 == 1) $colSwap = $n - $colSwap;
              } else {
                  $rowSwap = min($rowSwap, $n - $rowSwap);
                  $colSwap = min($colSwap, $n - $colSwap);
              }
              return intdiv($rowSwap + $colSwap, 2);
          }
        `,
        ruby: code`
          def movesToChessboard(board)
            n = board.length
            n.times do |i|
              n.times do |j|
                return -1 if (board[0][0] ^ board[i][0] ^ board[0][j] ^ board[i][j]) != 0
              end
            end
            row_sum = board[0].sum
            col_sum = board.sum { |row| row[0] }
            lo = n / 2
            hi = (n + 1) / 2
            return -1 if row_sum < lo || row_sum > hi || col_sum < lo || col_sum > hi
            row_swap = (0...n).count { |i| board[i][0] == i % 2 }
            col_swap = (0...n).count { |i| board[0][i] == i % 2 }
            if n.odd?
              row_swap = n - row_swap if row_swap.odd?
              col_swap = n - col_swap if col_swap.odd?
            else
              row_swap = [row_swap, n - row_swap].min
              col_swap = [col_swap, n - col_swap].min
            end
            (row_swap + col_swap) / 2
          end
        `,
      },
    };
  })(),

  // ── Get Biggest Three Rhombus Sums in a Grid (LC 1878) ──────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const sums = new Set<number>();
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        for (let k = 0; i + 2 * k < m && j - k >= 0 && j + k < n; k++) {
          // the four corners, then every cell on the segments between them
          const corners = [[i, j], [i + k, j + k], [i + 2 * k, j], [i + k, j - k]];
          const cells = new Set<number>();
          for (let e = 0; e < 4; e++) {
            const [r1, c1] = corners[e], [r2, c2] = corners[(e + 1) % 4];
            for (let t = 0; t <= k; t++) {
              const r = k === 0 ? r1 : r1 + ((r2 - r1) / k) * t;
              const c = k === 0 ? c1 : c1 + ((c2 - c1) / k) * t;
              cells.add(r * n + c);
            }
          }
          let s = 0;
          cells.forEach((v) => { s += grid[Math.floor(v / n)][v % n]; });
          sums.add(s);
        }
      }
      return [...sums].sort((a, b) => b - a).slice(0, 3);
    };
    return {
      slug: "get-biggest-three-rhombus-sums-in-a-grid",
      title: "Get Biggest Three Rhombus Sums in a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Prefix Sum", "Sorting", "Amazon", "Google"],
      signature: { funcName: "getBiggestThree", params: [{ name: "grid", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given an `m x n` integer matrix `grid`. A **rhombus** is a square rotated 45° whose four corners sit at the centres of grid cells; a single cell counts as a rhombus of size 0. A rhombus with top corner `(i, j)` and size `k` has its other corners at `(i+k, j+k)`, `(i+2k, j)` and `(i+k, j-k)`, and must lie entirely inside the grid.\n\nThe **rhombus sum** is the sum of the cells on the rhombus's **border** only (the cells its four edges pass through), not the cells inside.\n\nReturn the biggest three **distinct** rhombus sums in **descending** order. If there are fewer than three distinct values, return all of them.",
        [
          { in: "grid = [[5,1,2],[3,9,4],[1,6,7]]", out: "[14,9,7]", note: "The only rhombus of size 1 passes through 1, 4, 6 and 3 for a sum of 14; the largest single cells are 9 and 7." },
          { in: "grid = [[4,4,4]]", out: "[4]", note: "Every rhombus sum is 4, and duplicates count once." },
          { in: "grid = [[3,8]]", out: "[8,3]" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 50", "1 <= grid[i][j] <= 10^5"]),
      hints: [
        "A rhombus is fixed by its top cell `(i, j)` and its size `k`; it fits when `i + 2k < m`, `j - k >= 0` and `j + k < n`.",
        "Its border has exactly `4k` cells (1 when `k = 0`): walk the four edges, each `k` steps, without counting a corner twice.",
        "Keep only the three largest distinct sums seen so far — no need to store them all.",
      ],
      editorial: explain({
        idea: "Enumerate every rhombus by top corner and size, sum its border by walking four diagonal edges, and keep a running top-three of distinct values.",
        steps: [
          "For each cell `(i, j)`, offer `grid[i][j]` (the size-0 rhombus).",
          "For `k = 1, 2, …` while `i + 2k < m`, `j - k >= 0` and `j + k < n`: for `t` from 0 to `k - 1` add `grid[i+t][j+t]` (top→right), `grid[i+k+t][j+k-t]` (right→bottom), `grid[i+2k-t][j-t]` (bottom→left) and `grid[i+k-t][j-k+t]` (left→top).",
          "Offer the sum to the top-three list: ignore it if already present, otherwise insert it in order and drop anything beyond three.",
          "Return the list.",
        ],
        why: "Each edge walk starts at one corner and stops just before the next, so the four walks cover the `4k` border cells exactly once. Every rhombus inside the grid has a unique top corner and size, so all of them are offered, and the bounded list keeps exactly the three largest distinct values.",
        time: "O(m · n · min(m, n)²) — diagonal prefix sums bring it to O(m · n · min(m, n))",
        space: "O(1)",
        pitfalls: [
          "Corners belong to two edges; walk each edge half-open so they are counted once.",
          "Sums must be distinct — equal sums from different rhombi count once.",
          "A single cell is a valid rhombus of size 0.",
        ],
      }),
      examples: [
        { input: "[[5,1,2],[3,9,4],[1,6,7]]", expectedOutput: "[14,9,7]" },
        { input: "[[4,4,4]]", expectedOutput: "[4]" },
        { input: "[[3,8]]", expectedOutput: "[8,3]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 0, 12) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 6, 9]));
        const n = ri(rng, 0, 12) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 6, 9]));
        const hi = pick(rng, [4, 30, 100000, 100000]);
        const grid = randGrid(rng, m, n, 1, hi);
        return { input: fmtIntMat(grid), expectedOutput: fmtIntArr(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getBiggestThree(grid: List[List[int]]) -> List[int]:
              m, n = len(grid), len(grid[0])
              top = []

              def offer(v):
                  if v in top:
                      return
                  top.append(v)
                  top.sort(reverse=True)
                  if len(top) > 3:
                      top.pop()

              for i in range(m):
                  for j in range(n):
                      offer(grid[i][j])
                      k = 1
                      while i + 2 * k < m and j - k >= 0 and j + k < n:
                          s = 0
                          for t in range(k):
                              s += grid[i + t][j + t]
                              s += grid[i + k + t][j + k - t]
                              s += grid[i + 2 * k - t][j - t]
                              s += grid[i + k - t][j - k + t]
                          offer(s)
                          k += 1
              return top
        `,
        javascript: code`
          var getBiggestThree = function(grid) {
              var m = grid.length, n = grid[0].length, top = [];
              var offer = function(v) {
                  if (top.indexOf(v) >= 0) return;
                  top.push(v);
                  top.sort(function(a, b) { return b - a; });
                  if (top.length > 3) top.pop();
              };
              for (var i = 0; i < m; i++) {
                  for (var j = 0; j < n; j++) {
                      offer(grid[i][j]);
                      for (var k = 1; i + 2 * k < m && j - k >= 0 && j + k < n; k++) {
                          var s = 0;
                          for (var t = 0; t < k; t++) {
                              s += grid[i + t][j + t];
                              s += grid[i + k + t][j + k - t];
                              s += grid[i + 2 * k - t][j - t];
                              s += grid[i + k - t][j - k + t];
                          }
                          offer(s);
                      }
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function getBiggestThree(grid: number[][]): number[] {
              var m = grid.length, n = grid[0].length, top: number[] = [];
              var offer = function(v: number): void {
                  for (var q = 0; q < top.length; q++) if (top[q] === v) return;
                  top.push(v);
                  top.sort(function(a, b) { return b - a; });
                  if (top.length > 3) top.pop();
              };
              for (var i = 0; i < m; i++) {
                  for (var j = 0; j < n; j++) {
                      offer(grid[i][j]);
                      for (var k = 1; i + 2 * k < m && j - k >= 0 && j + k < n; k++) {
                          var s = 0;
                          for (var t = 0; t < k; t++) {
                              s += grid[i + t][j + t];
                              s += grid[i + k + t][j + k - t];
                              s += grid[i + 2 * k - t][j - t];
                              s += grid[i + k - t][j - k + t];
                          }
                          offer(s);
                      }
                  }
              }
              return top;
          }
        `,
        java: code`
          public static int[] getBiggestThree(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              TreeSet<Integer> top = new TreeSet<>();
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      top.add(grid[i][j]);
                      if (top.size() > 3) top.pollFirst();
                      for (int k = 1; i + 2 * k < m && j - k >= 0 && j + k < n; k++) {
                          int s = 0;
                          for (int t = 0; t < k; t++) {
                              s += grid[i + t][j + t];
                              s += grid[i + k + t][j + k - t];
                              s += grid[i + 2 * k - t][j - t];
                              s += grid[i + k - t][j - k + t];
                          }
                          top.add(s);
                          if (top.size() > 3) top.pollFirst();
                      }
                  }
              }
              int[] out = new int[top.size()];
              int idx = 0;
              for (int v : top.descendingSet()) out[idx++] = v;
              return out;
          }
        `,
        cpp: code`
          vector<int> getBiggestThree(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              set<int> top;
              auto offer = [&](int v) {
                  top.insert(v);
                  if (top.size() > 3) top.erase(top.begin());
              };
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      offer(grid[i][j]);
                      for (int k = 1; i + 2 * k < m && j - k >= 0 && j + k < n; k++) {
                          int s = 0;
                          for (int t = 0; t < k; t++) {
                              s += grid[i + t][j + t];
                              s += grid[i + k + t][j + k - t];
                              s += grid[i + 2 * k - t][j - t];
                              s += grid[i + k - t][j - k + t];
                          }
                          offer(s);
                      }
                  }
              }
              return vector<int>(top.rbegin(), top.rend());
          }
        `,
        c: code`
          static void offerTop3(int* top, int* cnt, int v) {
              for (int q = 0; q < *cnt; q++) if (top[q] == v) return;
              int pos = *cnt;
              while (pos > 0 && top[pos - 1] < v) pos--;
              if (pos >= 3) return;
              int last = *cnt < 3 ? *cnt : 2;
              for (int q = last; q > pos; q--) top[q] = top[q - 1];
              top[pos] = v;
              if (*cnt < 3) (*cnt)++;
          }

          int* getBiggestThree(int** grid, int gridSize, int* gridColSize, int* returnSize) {
              int m = gridSize, n = gridColSize[0];
              int* top = (int*)malloc(3 * sizeof(int));
              int cnt = 0;
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      offerTop3(top, &cnt, grid[i][j]);
                      for (int k = 1; i + 2 * k < m && j - k >= 0 && j + k < n; k++) {
                          int s = 0;
                          for (int t = 0; t < k; t++) {
                              s += grid[i + t][j + t];
                              s += grid[i + k + t][j + k - t];
                              s += grid[i + 2 * k - t][j - t];
                              s += grid[i + k - t][j - k + t];
                          }
                          offerTop3(top, &cnt, s);
                      }
                  }
              }
              *returnSize = cnt;
              return top;
          }
        `,
        csharp: code`
          public static int[] GetBiggestThree(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              var top = new List<int>();
              Action<int> offer = v =>
              {
                  if (top.Contains(v)) return;
                  top.Add(v);
                  top.Sort((a, b) => b.CompareTo(a));
                  if (top.Count > 3) top.RemoveAt(3);
              };
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      offer(grid[i][j]);
                      for (int k = 1; i + 2 * k < m && j - k >= 0 && j + k < n; k++)
                      {
                          int s = 0;
                          for (int t = 0; t < k; t++)
                          {
                              s += grid[i + t][j + t];
                              s += grid[i + k + t][j + k - t];
                              s += grid[i + 2 * k - t][j - t];
                              s += grid[i + k - t][j - k + t];
                          }
                          offer(s);
                      }
                  }
              }
              return top.ToArray();
          }
        `,
        go: code`
          func getBiggestThree(grid [][]int) []int {
          	m, n := len(grid), len(grid[0])
          	top := []int{}
          	offer := func(v int) {
          		for _, x := range top {
          			if x == v {
          				return
          			}
          		}
          		top = append(top, v)
          		sort.Sort(sort.Reverse(sort.IntSlice(top)))
          		if len(top) > 3 {
          			top = top[:3]
          		}
          	}
          	for i := 0; i < m; i++ {
          		for j := 0; j < n; j++ {
          			offer(grid[i][j])
          			for k := 1; i+2*k < m && j-k >= 0 && j+k < n; k++ {
          				s := 0
          				for t := 0; t < k; t++ {
          					s += grid[i+t][j+t]
          					s += grid[i+k+t][j+k-t]
          					s += grid[i+2*k-t][j-t]
          					s += grid[i+k-t][j-k+t]
          				}
          				offer(s)
          			}
          		}
          	}
          	return top
          }
        `,
        kotlin: code`
          fun getBiggestThree(grid: Array<IntArray>): IntArray {
              val m = grid.size
              val n = grid[0].size
              val top = java.util.TreeSet<Int>()
              fun offer(v: Int) {
                  top.add(v)
                  if (top.size > 3) top.pollFirst()
              }
              for (i in 0 until m) {
                  for (j in 0 until n) {
                      offer(grid[i][j])
                      var k = 1
                      while (i + 2 * k < m && j - k >= 0 && j + k < n) {
                          var s = 0
                          for (t in 0 until k) {
                              s += grid[i + t][j + t]
                              s += grid[i + k + t][j + k - t]
                              s += grid[i + 2 * k - t][j - t]
                              s += grid[i + k - t][j - k + t]
                          }
                          offer(s)
                          k++
                      }
                  }
              }
              return top.descendingSet().toIntArray()
          }
        `,
        swift: code`
          func getBiggestThree(_ grid: [[Int]]) -> [Int] {
              let m = grid.count, n = grid[0].count
              var top = [Int]()
              func offer(_ v: Int) {
                  if top.contains(v) { return }
                  top.append(v)
                  top.sort(by: >)
                  if top.count > 3 { top.removeLast() }
              }
              for i in 0..<m {
                  for j in 0..<n {
                      offer(grid[i][j])
                      var k = 1
                      while i + 2 * k < m && j - k >= 0 && j + k < n {
                          var s = 0
                          for t in 0..<k {
                              s += grid[i + t][j + t]
                              s += grid[i + k + t][j + k - t]
                              s += grid[i + 2 * k - t][j - t]
                              s += grid[i + k - t][j - k + t]
                          }
                          offer(s)
                          k += 1
                      }
                  }
              }
              return top
          }
        `,
        rust: code`
          fn getBiggestThree(grid: Vec<Vec<i32>>) -> Vec<i32> {
              let m = grid.len();
              let n = grid[0].len();
              let mut top: Vec<i32> = Vec::new();
              let mut offer = |v: i32, top: &mut Vec<i32>| {
                  if top.contains(&v) {
                      return;
                  }
                  top.push(v);
                  top.sort_by(|a, b| b.cmp(a));
                  top.truncate(3);
              };
              for i in 0..m {
                  for j in 0..n {
                      offer(grid[i][j], &mut top);
                      let mut k = 1;
                      while i + 2 * k < m && j >= k && j + k < n {
                          let mut s = 0;
                          for t in 0..k {
                              s += grid[i + t][j + t];
                              s += grid[i + k + t][j + k - t];
                              s += grid[i + 2 * k - t][j - t];
                              s += grid[i + k - t][j - k + t];
                          }
                          offer(s, &mut top);
                          k += 1;
                      }
                  }
              }
              top
          }
        `,
        php: code`
          function getBiggestThree($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $sums = [];
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      $sums[$grid[$i][$j]] = true;
                      for ($k = 1; $i + 2 * $k < $m && $j - $k >= 0 && $j + $k < $n; $k++) {
                          $s = 0;
                          for ($t = 0; $t < $k; $t++) {
                              $s += $grid[$i + $t][$j + $t];
                              $s += $grid[$i + $k + $t][$j + $k - $t];
                              $s += $grid[$i + 2 * $k - $t][$j - $t];
                              $s += $grid[$i + $k - $t][$j - $k + $t];
                          }
                          $sums[$s] = true;
                      }
                  }
              }
              $vals = array_keys($sums);
              rsort($vals);
              return array_slice($vals, 0, 3);
          }
        `,
        ruby: code`
          def getBiggestThree(grid)
            m = grid.length
            n = grid[0].length
            sums = {}
            m.times do |i|
              n.times do |j|
                sums[grid[i][j]] = true
                k = 1
                while i + 2 * k < m && j - k >= 0 && j + k < n
                  s = 0
                  k.times do |t|
                    s += grid[i + t][j + t]
                    s += grid[i + k + t][j + k - t]
                    s += grid[i + 2 * k - t][j - t]
                    s += grid[i + k - t][j - k + t]
                  end
                  sums[s] = true
                  k += 1
                end
              end
            end
            sums.keys.sort.reverse.first(3)
          end
        `,
      },
    };
  })(),

  // ── Largest Magic Square (LC 1895) ──────────────────────────────
  (() => {
    const isMagic = (g: number[][], r: number, c: number, k: number) => {
      const sums: number[] = [];
      for (let i = 0; i < k; i++) { let s = 0; for (let j = 0; j < k; j++) s += g[r + i][c + j]; sums.push(s); }
      for (let j = 0; j < k; j++) { let s = 0; for (let i = 0; i < k; i++) s += g[r + i][c + j]; sums.push(s); }
      let d1 = 0, d2 = 0;
      for (let i = 0; i < k; i++) { d1 += g[r + i][c + i]; d2 += g[r + i][c + k - 1 - i]; }
      sums.push(d1, d2);
      return sums.every((s) => s === sums[0]);
    };
    const ref = (g: number[][]) => {
      const m = g.length, n = g[0].length;
      let best = 1;
      for (let k = 2; k <= Math.min(m, n); k++) {
        for (let r = 0; r + k <= m; r++) for (let c = 0; c + k <= n; c++) if (isMagic(g, r, c, k)) best = k;
      }
      return best;
    };
    const LO_SHU = [[8, 1, 6], [3, 5, 7], [4, 9, 2]];
    const DURER = [[16, 3, 2, 13], [5, 10, 11, 8], [9, 6, 7, 12], [4, 15, 14, 1]];
    return {
      slug: "largest-magic-square",
      title: "Largest Magic Square",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "largestMagicSquare", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A `k x k` **magic square** is a square block of numbers in which every row sum, every column sum and both diagonal sums are all equal. The numbers need not be distinct, and every `1 x 1` block is trivially a magic square.\n\nGiven an `m x n` integer matrix `grid`, return the side length `k` of the largest magic square that appears as a contiguous `k x k` sub-grid of `grid`.",
        [
          { in: "grid = [[3,8,1,6],[1,3,5,7],[2,4,9,2]]", out: "3", note: "Columns 1–3 hold the classic 3 × 3 magic square: every row, column and diagonal sums to 15." },
          { in: "grid = [[5,1,3],[2,3,3],[1,3,3]]", out: "2", note: "The bottom-right block `[[3,3],[3,3]]` is magic; the whole grid is not." },
          { in: "grid = [[1,2],[3,4]]", out: "1" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 50", "1 <= grid[i][j] <= 10^6"]),
      hints: [
        "Try sizes from largest to smallest; the first size that has a magic square anywhere is the answer, and size 1 always works.",
        "Prefix sums along every row and every column turn each row or column sum of a block into one subtraction.",
        "For a candidate block, compare all `k` row sums and `k` column sums with the first row's sum, then compute the two diagonals directly.",
      ],
      editorial: explain({
        idea: "Check every block, largest sizes first, with row and column prefix sums making each line sum O(1).",
        steps: [
          "Build `rowP[i][j]` = sum of `grid[i][0..j-1]` and `colP[i][j]` = sum of `grid[0..i-1][j]`.",
          "For `k` from `min(m, n)` down to 2, for every top-left `(r, c)` with the block inside the grid:",
          "Let `target` be the block's first row sum. Every row sum `rowP[r+t][c+k] - rowP[r+t][c]` and column sum `colP[r+k][c+t] - colP[r][c+t]` must equal it; stop early on a mismatch.",
          "Add up both diagonals directly; if they also equal `target`, return `k`.",
          "If no block of size 2 or more is magic, return 1.",
        ],
        why: "The search is exhaustive over sizes and positions, and it checks exactly the definition: all rows, all columns and both diagonals of the block have one common sum. Scanning sizes downwards means the first hit is the largest.",
        time: "O(m · n · min(m, n)²)",
        space: "O(m · n)",
        pitfalls: [
          "Both diagonals must match, not just the rows and columns.",
          "Every `1 x 1` block is magic, so the answer is at least 1.",
          "Values reach 10^6 and a line has up to 50 of them — 5 × 10^7 still fits in 32 bits.",
        ],
      }),
      examples: [
        { input: "[[3,8,1,6],[1,3,5,7],[2,4,9,2]]", expectedOutput: "3" },
        { input: "[[5,1,3],[2,3,3],[1,3,3]]", expectedOutput: "2" },
        { input: "[[1,2],[3,4]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 0, 12) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 6, 8]));
        const n = ri(rng, 0, 12) === 0 ? 1 : ri(rng, 2, pick(rng, [4, 6, 8]));
        const hi = pick(rng, [2, 3, 9, 1000000]);
        const g = randGrid(rng, m, n, 1, hi);
        const k0 = Math.min(m, n);
        const plant = ri(rng, 1, 5) % 4;
        if (plant > 0 && k0 >= 2) {
          // plant a magic block: Lo Shu or Dürer's square (scaled, shifted, mirrored), or a constant block
          let block: number[][];
          if (plant === 1 && k0 >= 3) block = LO_SHU.map((r) => r.slice());
          else if (plant === 2 && k0 >= 4) block = DURER.map((r) => r.slice());
          else { const k = ri(rng, 2, k0), v = ri(rng, 1, 9); block = Array.from({ length: k }, () => new Array<number>(k).fill(v)); }
          const mul = ri(rng, 1, 3), add = ri(rng, 0, 5);
          block = block.map((r) => r.map((v) => v * mul + add));
          if (rng() < 0.5) block = block.map((r) => r.reverse());
          if (rng() < 0.5) block.reverse();
          const k = block.length, r0 = ri(rng, 0, m - k), c0 = ri(rng, 0, n - k);
          for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) g[r0 + i][c0 + j] = block[i][j];
        }
        return { input: fmtIntMat(g), expectedOutput: String(ref(g)) };
      },
      solutions: {
        python: code`
          from typing import List

          def largestMagicSquare(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              row_p = [[0] * (n + 1) for _ in range(m)]
              col_p = [[0] * n for _ in range(m + 1)]
              for i in range(m):
                  for j in range(n):
                      row_p[i][j + 1] = row_p[i][j] + grid[i][j]
                      col_p[i + 1][j] = col_p[i][j] + grid[i][j]
              for k in range(min(m, n), 1, -1):
                  for r in range(m - k + 1):
                      for c in range(n - k + 1):
                          target = row_p[r][c + k] - row_p[r][c]
                          ok = True
                          for t in range(k):
                              if row_p[r + t][c + k] - row_p[r + t][c] != target or col_p[r + k][c + t] - col_p[r][c + t] != target:
                                  ok = False
                                  break
                          if not ok:
                              continue
                          d1 = sum(grid[r + t][c + t] for t in range(k))
                          d2 = sum(grid[r + t][c + k - 1 - t] for t in range(k))
                          if d1 == target and d2 == target:
                              return k
              return 1
        `,
        javascript: code`
          var largestMagicSquare = function(grid) {
              var m = grid.length, n = grid[0].length, i, j;
              var rowP = [], colP = [];
              for (i = 0; i < m; i++) rowP.push(new Array(n + 1).fill(0));
              for (i = 0; i <= m; i++) colP.push(new Array(n).fill(0));
              for (i = 0; i < m; i++) {
                  for (j = 0; j < n; j++) {
                      rowP[i][j + 1] = rowP[i][j] + grid[i][j];
                      colP[i + 1][j] = colP[i][j] + grid[i][j];
                  }
              }
              for (var k = Math.min(m, n); k >= 2; k--) {
                  for (var r = 0; r + k <= m; r++) {
                      for (var c = 0; c + k <= n; c++) {
                          var target = rowP[r][c + k] - rowP[r][c], ok = true;
                          for (var t = 0; t < k && ok; t++) {
                              if (rowP[r + t][c + k] - rowP[r + t][c] !== target) ok = false;
                              else if (colP[r + k][c + t] - colP[r][c + t] !== target) ok = false;
                          }
                          if (!ok) continue;
                          var d1 = 0, d2 = 0;
                          for (var u = 0; u < k; u++) { d1 += grid[r + u][c + u]; d2 += grid[r + u][c + k - 1 - u]; }
                          if (d1 === target && d2 === target) return k;
                      }
                  }
              }
              return 1;
          };
        `,
        typescript: code`
          function largestMagicSquare(grid: number[][]): number {
              var m = grid.length, n = grid[0].length, i: number, j: number;
              var rowP: number[][] = [], colP: number[][] = [];
              for (i = 0; i < m; i++) { var a: number[] = []; for (j = 0; j <= n; j++) a.push(0); rowP.push(a); }
              for (i = 0; i <= m; i++) { var b: number[] = []; for (j = 0; j < n; j++) b.push(0); colP.push(b); }
              for (i = 0; i < m; i++) {
                  for (j = 0; j < n; j++) {
                      rowP[i][j + 1] = rowP[i][j] + grid[i][j];
                      colP[i + 1][j] = colP[i][j] + grid[i][j];
                  }
              }
              for (var k = Math.min(m, n); k >= 2; k--) {
                  for (var r = 0; r + k <= m; r++) {
                      for (var c = 0; c + k <= n; c++) {
                          var target = rowP[r][c + k] - rowP[r][c], ok = true;
                          for (var t = 0; t < k && ok; t++) {
                              if (rowP[r + t][c + k] - rowP[r + t][c] !== target) ok = false;
                              else if (colP[r + k][c + t] - colP[r][c + t] !== target) ok = false;
                          }
                          if (!ok) continue;
                          var d1 = 0, d2 = 0;
                          for (var u = 0; u < k; u++) { d1 += grid[r + u][c + u]; d2 += grid[r + u][c + k - 1 - u]; }
                          if (d1 === target && d2 === target) return k;
                      }
                  }
              }
              return 1;
          }
        `,
        java: code`
          public static int largestMagicSquare(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              int[][] rowP = new int[m][n + 1], colP = new int[m + 1][n];
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      rowP[i][j + 1] = rowP[i][j] + grid[i][j];
                      colP[i + 1][j] = colP[i][j] + grid[i][j];
                  }
              }
              for (int k = Math.min(m, n); k >= 2; k--) {
                  for (int r = 0; r + k <= m; r++) {
                      for (int c = 0; c + k <= n; c++) {
                          int target = rowP[r][c + k] - rowP[r][c];
                          boolean ok = true;
                          for (int t = 0; t < k && ok; t++) {
                              if (rowP[r + t][c + k] - rowP[r + t][c] != target) ok = false;
                              else if (colP[r + k][c + t] - colP[r][c + t] != target) ok = false;
                          }
                          if (!ok) continue;
                          int d1 = 0, d2 = 0;
                          for (int u = 0; u < k; u++) { d1 += grid[r + u][c + u]; d2 += grid[r + u][c + k - 1 - u]; }
                          if (d1 == target && d2 == target) return k;
                      }
                  }
              }
              return 1;
          }
        `,
        cpp: code`
          int largestMagicSquare(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              vector<vector<int>> rowP(m, vector<int>(n + 1, 0)), colP(m + 1, vector<int>(n, 0));
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      rowP[i][j + 1] = rowP[i][j] + grid[i][j];
                      colP[i + 1][j] = colP[i][j] + grid[i][j];
                  }
              }
              for (int k = min(m, n); k >= 2; k--) {
                  for (int r = 0; r + k <= m; r++) {
                      for (int c = 0; c + k <= n; c++) {
                          int target = rowP[r][c + k] - rowP[r][c];
                          bool ok = true;
                          for (int t = 0; t < k && ok; t++) {
                              if (rowP[r + t][c + k] - rowP[r + t][c] != target) ok = false;
                              else if (colP[r + k][c + t] - colP[r][c + t] != target) ok = false;
                          }
                          if (!ok) continue;
                          int d1 = 0, d2 = 0;
                          for (int u = 0; u < k; u++) { d1 += grid[r + u][c + u]; d2 += grid[r + u][c + k - 1 - u]; }
                          if (d1 == target && d2 == target) return k;
                      }
                  }
              }
              return 1;
          }
        `,
        c: code`
          int largestMagicSquare(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0];
              int* rowP = (int*)calloc(m * (n + 1), sizeof(int));
              int* colP = (int*)calloc((m + 1) * n, sizeof(int));
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      rowP[i * (n + 1) + j + 1] = rowP[i * (n + 1) + j] + grid[i][j];
                      colP[(i + 1) * n + j] = colP[i * n + j] + grid[i][j];
                  }
              }
              int ans = 1;
              for (int k = (m < n ? m : n); k >= 2 && ans == 1; k--) {
                  for (int r = 0; r + k <= m && ans == 1; r++) {
                      for (int c = 0; c + k <= n && ans == 1; c++) {
                          int target = rowP[r * (n + 1) + c + k] - rowP[r * (n + 1) + c];
                          int ok = 1;
                          for (int t = 0; t < k && ok; t++) {
                              if (rowP[(r + t) * (n + 1) + c + k] - rowP[(r + t) * (n + 1) + c] != target) ok = 0;
                              else if (colP[(r + k) * n + c + t] - colP[r * n + c + t] != target) ok = 0;
                          }
                          if (!ok) continue;
                          int d1 = 0, d2 = 0;
                          for (int u = 0; u < k; u++) { d1 += grid[r + u][c + u]; d2 += grid[r + u][c + k - 1 - u]; }
                          if (d1 == target && d2 == target) ans = k;
                      }
                  }
              }
              free(rowP);
              free(colP);
              return ans;
          }
        `,
        csharp: code`
          public static int LargestMagicSquare(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              var rowP = new int[m, n + 1];
              var colP = new int[m + 1, n];
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      rowP[i, j + 1] = rowP[i, j] + grid[i][j];
                      colP[i + 1, j] = colP[i, j] + grid[i][j];
                  }
              }
              for (int k = Math.Min(m, n); k >= 2; k--)
              {
                  for (int r = 0; r + k <= m; r++)
                  {
                      for (int c = 0; c + k <= n; c++)
                      {
                          int target = rowP[r, c + k] - rowP[r, c];
                          bool ok = true;
                          for (int t = 0; t < k && ok; t++)
                          {
                              if (rowP[r + t, c + k] - rowP[r + t, c] != target) ok = false;
                              else if (colP[r + k, c + t] - colP[r, c + t] != target) ok = false;
                          }
                          if (!ok) continue;
                          int d1 = 0, d2 = 0;
                          for (int u = 0; u < k; u++) { d1 += grid[r + u][c + u]; d2 += grid[r + u][c + k - 1 - u]; }
                          if (d1 == target && d2 == target) return k;
                      }
                  }
              }
              return 1;
          }
        `,
        go: code`
          func largestMagicSquare(grid [][]int) int {
          	m, n := len(grid), len(grid[0])
          	rowP := make([][]int, m)
          	colP := make([][]int, m+1)
          	for i := 0; i <= m; i++ {
          		colP[i] = make([]int, n)
          	}
          	for i := 0; i < m; i++ {
          		rowP[i] = make([]int, n+1)
          		for j := 0; j < n; j++ {
          			rowP[i][j+1] = rowP[i][j] + grid[i][j]
          			colP[i+1][j] = colP[i][j] + grid[i][j]
          		}
          	}
          	k := m
          	if n < k {
          		k = n
          	}
          	for ; k >= 2; k-- {
          		for r := 0; r+k <= m; r++ {
          			for c := 0; c+k <= n; c++ {
          				target := rowP[r][c+k] - rowP[r][c]
          				ok := true
          				for t := 0; t < k && ok; t++ {
          					if rowP[r+t][c+k]-rowP[r+t][c] != target || colP[r+k][c+t]-colP[r][c+t] != target {
          						ok = false
          					}
          				}
          				if !ok {
          					continue
          				}
          				d1, d2 := 0, 0
          				for u := 0; u < k; u++ {
          					d1 += grid[r+u][c+u]
          					d2 += grid[r+u][c+k-1-u]
          				}
          				if d1 == target && d2 == target {
          					return k
          				}
          			}
          		}
          	}
          	return 1
          }
        `,
        kotlin: code`
          fun largestMagicSquare(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              val rowP = Array(m) { IntArray(n + 1) }
              val colP = Array(m + 1) { IntArray(n) }
              for (i in 0 until m) {
                  for (j in 0 until n) {
                      rowP[i][j + 1] = rowP[i][j] + grid[i][j]
                      colP[i + 1][j] = colP[i][j] + grid[i][j]
                  }
              }
              for (k in minOf(m, n) downTo 2) {
                  for (r in 0..m - k) {
                      for (c in 0..n - k) {
                          val target = rowP[r][c + k] - rowP[r][c]
                          var ok = true
                          var t = 0
                          while (t < k && ok) {
                              if (rowP[r + t][c + k] - rowP[r + t][c] != target) ok = false
                              else if (colP[r + k][c + t] - colP[r][c + t] != target) ok = false
                              t++
                          }
                          if (!ok) continue
                          var d1 = 0
                          var d2 = 0
                          for (u in 0 until k) { d1 += grid[r + u][c + u]; d2 += grid[r + u][c + k - 1 - u] }
                          if (d1 == target && d2 == target) return k
                      }
                  }
              }
              return 1
          }
        `,
        swift: code`
          func largestMagicSquare(_ grid: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count
              var rowP = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m)
              var colP = [[Int]](repeating: [Int](repeating: 0, count: n), count: m + 1)
              for i in 0..<m {
                  for j in 0..<n {
                      rowP[i][j + 1] = rowP[i][j] + grid[i][j]
                      colP[i + 1][j] = colP[i][j] + grid[i][j]
                  }
              }
              var k = min(m, n)
              while k >= 2 {
                  for r in 0...(m - k) {
                      for c in 0...(n - k) {
                          let target = rowP[r][c + k] - rowP[r][c]
                          var ok = true
                          var t = 0
                          while t < k && ok {
                              if rowP[r + t][c + k] - rowP[r + t][c] != target || colP[r + k][c + t] - colP[r][c + t] != target { ok = false }
                              t += 1
                          }
                          if !ok { continue }
                          var d1 = 0, d2 = 0
                          for u in 0..<k { d1 += grid[r + u][c + u]; d2 += grid[r + u][c + k - 1 - u] }
                          if d1 == target && d2 == target { return k }
                      }
                  }
                  k -= 1
              }
              return 1
          }
        `,
        rust: code`
          fn largestMagicSquare(grid: Vec<Vec<i32>>) -> i32 {
              let m = grid.len();
              let n = grid[0].len();
              let mut row_p = vec![vec![0i32; n + 1]; m];
              let mut col_p = vec![vec![0i32; n]; m + 1];
              for i in 0..m {
                  for j in 0..n {
                      row_p[i][j + 1] = row_p[i][j] + grid[i][j];
                      col_p[i + 1][j] = col_p[i][j] + grid[i][j];
                  }
              }
              let mut k = std::cmp::min(m, n);
              while k >= 2 {
                  for r in 0..=(m - k) {
                      for c in 0..=(n - k) {
                          let target = row_p[r][c + k] - row_p[r][c];
                          let mut ok = true;
                          for t in 0..k {
                              if row_p[r + t][c + k] - row_p[r + t][c] != target || col_p[r + k][c + t] - col_p[r][c + t] != target {
                                  ok = false;
                                  break;
                              }
                          }
                          if !ok {
                              continue;
                          }
                          let (mut d1, mut d2) = (0i32, 0i32);
                          for u in 0..k {
                              d1 += grid[r + u][c + u];
                              d2 += grid[r + u][c + k - 1 - u];
                          }
                          if d1 == target && d2 == target {
                              return k as i32;
                          }
                      }
                  }
                  k -= 1;
              }
              1
          }
        `,
        php: code`
          function largestMagicSquare($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $rowP = array_fill(0, $m, array_fill(0, $n + 1, 0));
              $colP = array_fill(0, $m + 1, array_fill(0, $n, 0));
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      $rowP[$i][$j + 1] = $rowP[$i][$j] + $grid[$i][$j];
                      $colP[$i + 1][$j] = $colP[$i][$j] + $grid[$i][$j];
                  }
              }
              for ($k = min($m, $n); $k >= 2; $k--) {
                  for ($r = 0; $r + $k <= $m; $r++) {
                      for ($c = 0; $c + $k <= $n; $c++) {
                          $target = $rowP[$r][$c + $k] - $rowP[$r][$c];
                          $ok = true;
                          for ($t = 0; $t < $k && $ok; $t++) {
                              if ($rowP[$r + $t][$c + $k] - $rowP[$r + $t][$c] != $target) $ok = false;
                              elseif ($colP[$r + $k][$c + $t] - $colP[$r][$c + $t] != $target) $ok = false;
                          }
                          if (!$ok) continue;
                          $d1 = 0;
                          $d2 = 0;
                          for ($u = 0; $u < $k; $u++) { $d1 += $grid[$r + $u][$c + $u]; $d2 += $grid[$r + $u][$c + $k - 1 - $u]; }
                          if ($d1 == $target && $d2 == $target) return $k;
                      }
                  }
              }
              return 1;
          }
        `,
        ruby: code`
          def largestMagicSquare(grid)
            m = grid.length
            n = grid[0].length
            row_p = Array.new(m) { Array.new(n + 1, 0) }
            col_p = Array.new(m + 1) { Array.new(n, 0) }
            m.times do |i|
              n.times do |j|
                row_p[i][j + 1] = row_p[i][j] + grid[i][j]
                col_p[i + 1][j] = col_p[i][j] + grid[i][j]
              end
            end
            [m, n].min.downto(2) do |k|
              (0..(m - k)).each do |r|
                (0..(n - k)).each do |c|
                  target = row_p[r][c + k] - row_p[r][c]
                  ok = (0...k).all? { |t| row_p[r + t][c + k] - row_p[r + t][c] == target && col_p[r + k][c + t] - col_p[r][c + t] == target }
                  next unless ok
                  d1 = (0...k).sum { |u| grid[r + u][c + u] }
                  d2 = (0...k).sum { |u| grid[r + u][c + k - 1 - u] }
                  return k if d1 == target && d2 == target
                end
              end
            end
            1
          end
        `,
      },
    };
  })(),

  // ── Count Unguarded Cells in the Grid (LC 2257) ─────────────────
  (() => {
    const ref = (m: number, n: number, guards: number[][], walls: number[][]) => {
      const g = Array.from({ length: m }, () => new Array<string>(n).fill("."));
      for (const [r, c] of guards) g[r][c] = "G";
      for (const [r, c] of walls) g[r][c] = "W";
      const seen = Array.from({ length: m }, () => new Array<boolean>(n).fill(false));
      for (const [r0, c0] of guards) {
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          for (let r = r0 + dr, c = c0 + dc; r >= 0 && c >= 0 && r < m && c < n && g[r][c] === "."; r += dr, c += dc) seen[r][c] = true;
        }
      }
      let free = 0;
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (g[r][c] === "." && !seen[r][c]) free++;
      return free;
    };
    return {
      slug: "count-unguarded-cells-in-the-grid",
      title: "Count Unguarded Cells in the Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Simulation", "Amazon", "Google"],
      signature: { funcName: "countUnguarded", params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }, { name: "guards", type: "int[][]" as const }, { name: "walls", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A building floor is an `m x n` grid (rows `0..m-1`, columns `0..n-1`). `guards[i] = [r, c]` places a guard and `walls[j] = [r, c]` places a wall; all of these positions are distinct.\n\nA guard watches every cell in the four cardinal directions — up, down, left and right — from its position, until the view is blocked by a wall, another guard, or the edge of the grid. A cell is **guarded** if at least one guard watches it.\n\nReturn the number of cells that are not occupied by a guard or a wall and are **not** guarded.",
        [
          { in: "m = 3, n = 4, guards = [[0,0]], walls = [[0,2]]", out: "7", note: "The guard watches `(0,1)` (the wall stops it there) and `(1,0)`, `(2,0)` below; 12 - 2 occupied - 3 guarded = 7." },
          { in: "m = 2, n = 2, guards = [[0,0]], walls = [[1,1]]", out: "0" },
          { in: "m = 3, n = 3, guards = [[1,1]], walls = [[0,1],[1,0],[2,1],[1,2]]", out: "4", note: "The guard is boxed in by four walls; only the four corners are left, and none is watched." },
        ],
        ["1 <= m, n <= 10^5", "2 <= m * n <= 10^5", "1 <= guards.length, walls.length <= 5 * 10^4", "2 <= guards.length + walls.length <= m * n", "guards[i].length == walls[j].length == 2", "0 <= row < m, 0 <= col < n", "all positions in guards and walls are unique"]),
      hints: [
        "Mark guards and walls on an `m x n` board first.",
        "From each guard, walk in each direction until you hit a wall, a guard or the edge, marking the cells you pass.",
        "To be strictly linear, sweep each row left-to-right and right-to-left (and each column both ways) with a flag that turns on at a guard and off at a wall.",
      ],
      editorial: explain({
        idea: "A cell is guarded exactly when, in some direction, the nearest occupied cell is a guard — four directional sweeps with an on/off flag find that in linear time.",
        steps: [
          "Build the board: 1 for a guard, 2 for a wall, 0 for empty.",
          "For each row, sweep left to right keeping a flag: a guard turns it on, a wall turns it off, and an empty cell is marked guarded while the flag is on. Repeat right to left.",
          "Do the same down and up every column.",
          "Count the empty cells that were never marked.",
        ],
        why: "During a left-to-right sweep the flag is on at a cell exactly when the nearest occupied cell to its left is a guard — which is precisely when a guard watches it from the left (another guard in between would also switch the flag on, so blocking by guards changes nothing). The four sweeps cover the four directions a guard can look from.",
        time: "O(m · n + g + w)",
        space: "O(m · n)",
        pitfalls: [
          "Guards and walls themselves are never counted as unguarded cells.",
          "A wall blocks a guard's view; a cell behind it is not watched from that side.",
          "Walking from every guard until the edge (ignoring blocks) overcounts and, on long rows, is too slow.",
        ],
      }),
      examples: [
        { input: "3\n4\n[[0,0]]\n[[0,2]]", expectedOutput: "7" },
        { input: "2\n2\n[[0,0]]\n[[1,1]]", expectedOutput: "0" },
        { input: "3\n3\n[[1,1]]\n[[0,1],[1,0],[2,1],[1,2]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        let m: number, n: number;
        do { m = ri(rng, 1, pick(rng, [3, 6, 9])); n = ri(rng, 1, pick(rng, [3, 6, 9])); } while (m * n < 2);
        const total = m * n;
        const cells = shuffle(rng, Array.from({ length: total }, (_, i) => i));
        const gc = ri(rng, 1, Math.max(1, Math.min(total - 1, Math.floor(total / pick(rng, [3, 6, 10, 15])))));
        const wc = ri(rng, 1, Math.max(1, Math.min(total - gc, Math.floor(total / pick(rng, [3, 6, 10, 15])))));
        const guards = cells.slice(0, gc).map((v) => [Math.floor(v / n), v % n]);
        const walls = cells.slice(gc, gc + wc).map((v) => [Math.floor(v / n), v % n]);
        return { input: `${m}\n${n}\n${fmtIntMat(guards)}\n${fmtIntMat(walls)}`, expectedOutput: String(ref(m, n, guards, walls)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countUnguarded(m: int, n: int, guards: List[List[int]], walls: List[List[int]]) -> int:
              g = [[0] * n for _ in range(m)]
              for r, c in guards:
                  g[r][c] = 1
              for r, c in walls:
                  g[r][c] = 2
              seen = [[False] * n for _ in range(m)]

              def sweep(cells):
                  on = False
                  for r, c in cells:
                      v = g[r][c]
                      if v == 1:
                          on = True
                      elif v == 2:
                          on = False
                      elif on:
                          seen[r][c] = True

              for r in range(m):
                  sweep([(r, c) for c in range(n)])
                  sweep([(r, c) for c in range(n - 1, -1, -1)])
              for c in range(n):
                  sweep([(r, c) for r in range(m)])
                  sweep([(r, c) for r in range(m - 1, -1, -1)])
              return sum(1 for r in range(m) for c in range(n) if g[r][c] == 0 and not seen[r][c])
        `,
        javascript: code`
          var countUnguarded = function(m, n, guards, walls) {
              var g = new Array(m * n).fill(0), seen = new Array(m * n).fill(false), i;
              for (i = 0; i < guards.length; i++) g[guards[i][0] * n + guards[i][1]] = 1;
              for (i = 0; i < walls.length; i++) g[walls[i][0] * n + walls[i][1]] = 2;
              var visit = function(idx, on) {
                  if (g[idx] === 1) return true;
                  if (g[idx] === 2) return false;
                  if (on) seen[idx] = true;
                  return on;
              };
              var r, c, on;
              for (r = 0; r < m; r++) {
                  on = false;
                  for (c = 0; c < n; c++) on = visit(r * n + c, on);
                  on = false;
                  for (c = n - 1; c >= 0; c--) on = visit(r * n + c, on);
              }
              for (c = 0; c < n; c++) {
                  on = false;
                  for (r = 0; r < m; r++) on = visit(r * n + c, on);
                  on = false;
                  for (r = m - 1; r >= 0; r--) on = visit(r * n + c, on);
              }
              var free = 0;
              for (i = 0; i < m * n; i++) if (g[i] === 0 && !seen[i]) free++;
              return free;
          };
        `,
        typescript: code`
          function countUnguarded(m: number, n: number, guards: number[][], walls: number[][]): number {
              var g: number[] = [], seen: boolean[] = [], i: number;
              for (i = 0; i < m * n; i++) { g.push(0); seen.push(false); }
              for (i = 0; i < guards.length; i++) g[guards[i][0] * n + guards[i][1]] = 1;
              for (i = 0; i < walls.length; i++) g[walls[i][0] * n + walls[i][1]] = 2;
              var visit = function(idx: number, on: boolean): boolean {
                  if (g[idx] === 1) return true;
                  if (g[idx] === 2) return false;
                  if (on) seen[idx] = true;
                  return on;
              };
              var r: number, c: number, on: boolean;
              for (r = 0; r < m; r++) {
                  on = false;
                  for (c = 0; c < n; c++) on = visit(r * n + c, on);
                  on = false;
                  for (c = n - 1; c >= 0; c--) on = visit(r * n + c, on);
              }
              for (c = 0; c < n; c++) {
                  on = false;
                  for (r = 0; r < m; r++) on = visit(r * n + c, on);
                  on = false;
                  for (r = m - 1; r >= 0; r--) on = visit(r * n + c, on);
              }
              var free = 0;
              for (i = 0; i < m * n; i++) if (g[i] === 0 && !seen[i]) free++;
              return free;
          }
        `,
        java: code`
          public static int countUnguarded(int m, int n, int[][] guards, int[][] walls) {
              int[] g = new int[m * n];
              boolean[] seen = new boolean[m * n];
              for (int[] q : guards) g[q[0] * n + q[1]] = 1;
              for (int[] w : walls) g[w[0] * n + w[1]] = 2;
              for (int r = 0; r < m; r++) {
                  boolean on = false;
                  for (int c = 0; c < n; c++) on = visitCell(g, seen, r * n + c, on);
                  on = false;
                  for (int c = n - 1; c >= 0; c--) on = visitCell(g, seen, r * n + c, on);
              }
              for (int c = 0; c < n; c++) {
                  boolean on = false;
                  for (int r = 0; r < m; r++) on = visitCell(g, seen, r * n + c, on);
                  on = false;
                  for (int r = m - 1; r >= 0; r--) on = visitCell(g, seen, r * n + c, on);
              }
              int free = 0;
              for (int i = 0; i < m * n; i++) if (g[i] == 0 && !seen[i]) free++;
              return free;
          }

          private static boolean visitCell(int[] g, boolean[] seen, int idx, boolean on) {
              if (g[idx] == 1) return true;
              if (g[idx] == 2) return false;
              if (on) seen[idx] = true;
              return on;
          }
        `,
        cpp: code`
          int countUnguarded(int m, int n, vector<vector<int>>& guards, vector<vector<int>>& walls) {
              vector<int> g(m * n, 0);
              vector<char> seen(m * n, 0);
              for (auto& q : guards) g[q[0] * n + q[1]] = 1;
              for (auto& w : walls) g[w[0] * n + w[1]] = 2;
              auto visit = [&](int idx, bool on) {
                  if (g[idx] == 1) return true;
                  if (g[idx] == 2) return false;
                  if (on) seen[idx] = 1;
                  return on;
              };
              for (int r = 0; r < m; r++) {
                  bool on = false;
                  for (int c = 0; c < n; c++) on = visit(r * n + c, on);
                  on = false;
                  for (int c = n - 1; c >= 0; c--) on = visit(r * n + c, on);
              }
              for (int c = 0; c < n; c++) {
                  bool on = false;
                  for (int r = 0; r < m; r++) on = visit(r * n + c, on);
                  on = false;
                  for (int r = m - 1; r >= 0; r--) on = visit(r * n + c, on);
              }
              int free = 0;
              for (int i = 0; i < m * n; i++) if (g[i] == 0 && !seen[i]) free++;
              return free;
          }
        `,
        c: code`
          static bool visitGuardCell(int* g, char* seen, int idx, bool on) {
              if (g[idx] == 1) return true;
              if (g[idx] == 2) return false;
              if (on) seen[idx] = 1;
              return on;
          }

          int countUnguarded(int m, int n, int** guards, int guardsSize, int* guardsColSize, int** walls, int wallsSize, int* wallsColSize) {
              int* g = (int*)calloc(m * n, sizeof(int));
              char* seen = (char*)calloc(m * n, 1);
              for (int i = 0; i < guardsSize; i++) g[guards[i][0] * n + guards[i][1]] = 1;
              for (int i = 0; i < wallsSize; i++) g[walls[i][0] * n + walls[i][1]] = 2;
              for (int r = 0; r < m; r++) {
                  bool on = false;
                  for (int c = 0; c < n; c++) on = visitGuardCell(g, seen, r * n + c, on);
                  on = false;
                  for (int c = n - 1; c >= 0; c--) on = visitGuardCell(g, seen, r * n + c, on);
              }
              for (int c = 0; c < n; c++) {
                  bool on = false;
                  for (int r = 0; r < m; r++) on = visitGuardCell(g, seen, r * n + c, on);
                  on = false;
                  for (int r = m - 1; r >= 0; r--) on = visitGuardCell(g, seen, r * n + c, on);
              }
              int freeCells = 0;
              for (int i = 0; i < m * n; i++) if (g[i] == 0 && !seen[i]) freeCells++;
              free(g);
              free(seen);
              return freeCells;
          }
        `,
        csharp: code`
          public static int CountUnguarded(int m, int n, int[][] guards, int[][] walls)
          {
              var g = new int[m * n];
              var seen = new bool[m * n];
              foreach (var q in guards) g[q[0] * n + q[1]] = 1;
              foreach (var w in walls) g[w[0] * n + w[1]] = 2;
              Func<int, bool, bool> visit = (idx, on) =>
              {
                  if (g[idx] == 1) return true;
                  if (g[idx] == 2) return false;
                  if (on) seen[idx] = true;
                  return on;
              };
              for (int r = 0; r < m; r++)
              {
                  bool on = false;
                  for (int c = 0; c < n; c++) on = visit(r * n + c, on);
                  on = false;
                  for (int c = n - 1; c >= 0; c--) on = visit(r * n + c, on);
              }
              for (int c = 0; c < n; c++)
              {
                  bool on = false;
                  for (int r = 0; r < m; r++) on = visit(r * n + c, on);
                  on = false;
                  for (int r = m - 1; r >= 0; r--) on = visit(r * n + c, on);
              }
              int free = 0;
              for (int i = 0; i < m * n; i++) if (g[i] == 0 && !seen[i]) free++;
              return free;
          }
        `,
        go: code`
          func countUnguarded(m int, n int, guards [][]int, walls [][]int) int {
          	g := make([]int, m*n)
          	seen := make([]bool, m*n)
          	for _, q := range guards {
          		g[q[0]*n+q[1]] = 1
          	}
          	for _, w := range walls {
          		g[w[0]*n+w[1]] = 2
          	}
          	visit := func(idx int, on bool) bool {
          		if g[idx] == 1 {
          			return true
          		}
          		if g[idx] == 2 {
          			return false
          		}
          		if on {
          			seen[idx] = true
          		}
          		return on
          	}
          	for r := 0; r < m; r++ {
          		on := false
          		for c := 0; c < n; c++ {
          			on = visit(r*n+c, on)
          		}
          		on = false
          		for c := n - 1; c >= 0; c-- {
          			on = visit(r*n+c, on)
          		}
          	}
          	for c := 0; c < n; c++ {
          		on := false
          		for r := 0; r < m; r++ {
          			on = visit(r*n+c, on)
          		}
          		on = false
          		for r := m - 1; r >= 0; r-- {
          			on = visit(r*n+c, on)
          		}
          	}
          	free := 0
          	for i := 0; i < m*n; i++ {
          		if g[i] == 0 && !seen[i] {
          			free++
          		}
          	}
          	return free
          }
        `,
        kotlin: code`
          fun countUnguarded(m: Int, n: Int, guards: Array<IntArray>, walls: Array<IntArray>): Int {
              val g = IntArray(m * n)
              val seen = BooleanArray(m * n)
              for (q in guards) g[q[0] * n + q[1]] = 1
              for (w in walls) g[w[0] * n + w[1]] = 2
              fun visit(idx: Int, on: Boolean): Boolean {
                  if (g[idx] == 1) return true
                  if (g[idx] == 2) return false
                  if (on) seen[idx] = true
                  return on
              }
              for (r in 0 until m) {
                  var on = false
                  for (c in 0 until n) on = visit(r * n + c, on)
                  on = false
                  for (c in n - 1 downTo 0) on = visit(r * n + c, on)
              }
              for (c in 0 until n) {
                  var on = false
                  for (r in 0 until m) on = visit(r * n + c, on)
                  on = false
                  for (r in m - 1 downTo 0) on = visit(r * n + c, on)
              }
              var free = 0
              for (i in 0 until m * n) if (g[i] == 0 && !seen[i]) free++
              return free
          }
        `,
        swift: code`
          func countUnguarded(_ m: Int, _ n: Int, _ guards: [[Int]], _ walls: [[Int]]) -> Int {
              var g = [Int](repeating: 0, count: m * n)
              var seen = [Bool](repeating: false, count: m * n)
              for q in guards { g[q[0] * n + q[1]] = 1 }
              for w in walls { g[w[0] * n + w[1]] = 2 }
              func visit(_ idx: Int, _ on: Bool) -> Bool {
                  if g[idx] == 1 { return true }
                  if g[idx] == 2 { return false }
                  if on { seen[idx] = true }
                  return on
              }
              for r in 0..<m {
                  var on = false
                  for c in 0..<n { on = visit(r * n + c, on) }
                  on = false
                  for c in stride(from: n - 1, through: 0, by: -1) { on = visit(r * n + c, on) }
              }
              for c in 0..<n {
                  var on = false
                  for r in 0..<m { on = visit(r * n + c, on) }
                  on = false
                  for r in stride(from: m - 1, through: 0, by: -1) { on = visit(r * n + c, on) }
              }
              var free = 0
              for i in 0..<(m * n) where g[i] == 0 && !seen[i] { free += 1 }
              return free
          }
        `,
        rust: code`
          fn countUnguarded(m: i32, n: i32, guards: Vec<Vec<i32>>, walls: Vec<Vec<i32>>) -> i32 {
              let (m, n) = (m as usize, n as usize);
              let mut g = vec![0u8; m * n];
              let mut seen = vec![false; m * n];
              for q in guards.iter() {
                  g[q[0] as usize * n + q[1] as usize] = 1;
              }
              for w in walls.iter() {
                  g[w[0] as usize * n + w[1] as usize] = 2;
              }
              let mut lines: Vec<Vec<usize>> = Vec::new();
              for r in 0..m {
                  let row: Vec<usize> = (0..n).map(|c| r * n + c).collect();
                  let mut back = row.clone();
                  back.reverse();
                  lines.push(row);
                  lines.push(back);
              }
              for c in 0..n {
                  let col: Vec<usize> = (0..m).map(|r| r * n + c).collect();
                  let mut back = col.clone();
                  back.reverse();
                  lines.push(col);
                  lines.push(back);
              }
              for line in lines.iter() {
                  let mut on = false;
                  for &idx in line.iter() {
                      if g[idx] == 1 {
                          on = true;
                      } else if g[idx] == 2 {
                          on = false;
                      } else if on {
                          seen[idx] = true;
                      }
                  }
              }
              let mut free = 0;
              for i in 0..m * n {
                  if g[i] == 0 && !seen[i] {
                      free += 1;
                  }
              }
              free
          }
        `,
        php: code`
          function countUnguarded($m, $n, $guards, $walls) {
              $g = array_fill(0, $m * $n, 0);
              $seen = array_fill(0, $m * $n, false);
              foreach ($guards as $q) $g[$q[0] * $n + $q[1]] = 1;
              foreach ($walls as $w) $g[$w[0] * $n + $w[1]] = 2;
              $lines = [];
              for ($r = 0; $r < $m; $r++) {
                  $row = [];
                  for ($c = 0; $c < $n; $c++) $row[] = $r * $n + $c;
                  $lines[] = $row;
                  $lines[] = array_reverse($row);
              }
              for ($c = 0; $c < $n; $c++) {
                  $col = [];
                  for ($r = 0; $r < $m; $r++) $col[] = $r * $n + $c;
                  $lines[] = $col;
                  $lines[] = array_reverse($col);
              }
              foreach ($lines as $line) {
                  $on = false;
                  foreach ($line as $idx) {
                      if ($g[$idx] == 1) $on = true;
                      elseif ($g[$idx] == 2) $on = false;
                      elseif ($on) $seen[$idx] = true;
                  }
              }
              $free = 0;
              for ($i = 0; $i < $m * $n; $i++) if ($g[$i] == 0 && !$seen[$i]) $free++;
              return $free;
          }
        `,
        ruby: code`
          def countUnguarded(m, n, guards, walls)
            g = Array.new(m * n, 0)
            seen = Array.new(m * n, false)
            guards.each { |r, c| g[r * n + c] = 1 }
            walls.each { |r, c| g[r * n + c] = 2 }
            lines = []
            m.times do |r|
              row = (0...n).map { |c| r * n + c }
              lines << row << row.reverse
            end
            n.times do |c|
              col = (0...m).map { |r| r * n + c }
              lines << col << col.reverse
            end
            lines.each do |line|
              on = false
              line.each do |idx|
                if g[idx] == 1
                  on = true
                elsif g[idx] == 2
                  on = false
                elsif on
                  seen[idx] = true
                end
              end
            end
            (0...(m * n)).count { |i| g[i] == 0 && !seen[i] }
          end
        `,
      },
    };
  })(),

  // ── Shortest Path in a Grid with Obstacles Elimination (LC 1293) ─
  (() => {
    const ref = (grid: number[][], k: number) => {
      const m = grid.length, n = grid[0].length;
      // plain BFS over (row, col, obstacles removed so far)
      const seen = new Set<string>(["0,0,0"]);
      let frontier: number[][] = [[0, 0, 0]];
      for (let d = 0; frontier.length; d++) {
        const next: number[][] = [];
        for (const [r, c, e] of frontier) {
          if (r === m - 1 && c === n - 1) return d;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const a = r + dr, b = c + dc;
            if (a < 0 || b < 0 || a >= m || b >= n) continue;
            const e2 = e + grid[a][b];
            if (e2 > k) continue;
            const key = `${a},${b},${e2}`;
            if (!seen.has(key)) { seen.add(key); next.push([a, b, e2]); }
          }
        }
        frontier = next;
      }
      return -1;
    };
    return {
      slug: "shortest-path-in-a-grid-with-obstacles-elimination",
      title: "Shortest Path in a Grid with Obstacles Elimination",
      difficulty: "HARD" as const,
      tags: ["Array", "Breadth-First Search", "Matrix", "Google", "Amazon", "Meta"],
      signature: { funcName: "shortestPath", params: [{ name: "grid", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`grid` is an `m x n` matrix where `0` is an empty cell and `1` is an obstacle. In one step you move up, down, left or right to an adjacent cell.\n\nYou start in the top-left corner `(0, 0)` and want to reach the bottom-right corner `(m - 1, n - 1)`. Along the way you may **eliminate at most `k` obstacles**, which lets you step onto those obstacle cells.\n\nReturn the minimum number of steps needed, or `-1` if the corner cannot be reached with at most `k` eliminations.",
        [
          { in: "grid = [[0,1,1],[1,1,0],[1,0,0]], k = 1", out: "-1", note: "Every route from the start crosses at least two obstacles." },
          { in: "grid = [[0,1,1],[1,1,0],[1,0,0]], k = 2", out: "4", note: "Right through an obstacle, down through another, then down and right." },
          { in: "grid = [[0,0,0,0],[1,1,1,0],[0,0,0,0],[0,1,1,1],[0,0,0,0]], k = 1", out: "7", note: "Without eliminations the path snakes for 13 steps; removing the obstacle at `(1,0)` allows the direct 7-step route." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 40", "1 <= k <= m * n", "grid[i][j] is 0 or 1", "grid[0][0] == grid[m - 1][n - 1] == 0"]),
      hints: [
        "Plain BFS finds the shortest path, but the cell alone no longer describes where you are — how many eliminations you have left matters too.",
        "Run BFS over states `(row, col, eliminationsLeft)`; stepping onto an obstacle costs one elimination.",
        "If `k >= m + n - 2`, the straight Manhattan path is always affordable, so the answer is `m + n - 2` at once.",
      ],
      editorial: explain({
        idea: "Augment the BFS state with the number of eliminations remaining; every edge still costs one step, so BFS on the augmented graph is still a shortest-path search.",
        steps: [
          "If `k >= m + n - 2`, return `m + n - 2` — a monotone path has at most `m + n - 3` interior cells to clear.",
          "BFS from `(0, 0, k)` with `visited[r][c][rem]`.",
          "From `(r, c, rem)` try the four neighbours; entering an obstacle needs `rem > 0` and leads to `rem - 1`, an empty cell keeps `rem`.",
          "Return the BFS layer at which `(m - 1, n - 1)` is first dequeued (with any `rem`), or `-1`.",
        ],
        why: "Each state captures everything that affects the future: the position and how many obstacles can still be removed. Every move costs exactly one step, so BFS over these states reaches each one at its minimum distance, and the first time the target cell appears is the shortest path that respects the elimination budget.",
        time: "O(m · n · k)",
        space: "O(m · n · k)",
        pitfalls: [
          "Marking a cell visited regardless of `rem` is wrong: reaching it later with more eliminations left can still lead to a shorter overall path.",
          "Without the Manhattan shortcut, a large `k` makes the state space `m · n · k`, which is needlessly large.",
          "A 1 × 1 grid needs 0 steps.",
        ],
      }),
      examples: [
        { input: "[[0,1,1],[1,1,0],[1,0,0]]\n1", expectedOutput: "-1" },
        { input: "[[0,1,1],[1,1,0],[1,0,0]]\n2", expectedOutput: "4" },
        { input: "[[0,0,0,0],[1,1,1,0],[0,0,0,0],[0,1,1,1],[0,0,0,0]]\n1", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [3, 6, 8]));
        const n = ri(rng, 1, pick(rng, [3, 6, 8]));
        const p = pick(rng, [0.2, 0.35, 0.5, 0.65]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        grid[0][0] = 0;
        grid[m - 1][n - 1] = 0;
        const k = Math.min(m * n, ri(rng, 1, pick(rng, [1, 2, 4, 8, 20])));
        return { input: `${fmtIntMat(grid)}\n${k}`, expectedOutput: String(ref(grid, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def shortestPath(grid: List[List[int]], k: int) -> int:
              m, n = len(grid), len(grid[0])
              if k >= m + n - 2:
                  return m + n - 2
              seen = [[[False] * (k + 1) for _ in range(n)] for _ in range(m)]
              seen[0][0][k] = True
              q = deque([(0, 0, k)])
              steps = 0
              while q:
                  for _ in range(len(q)):
                      r, c, rem = q.popleft()
                      if r == m - 1 and c == n - 1:
                          return steps
                      for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                          a, b = r + dr, c + dc
                          if 0 <= a < m and 0 <= b < n:
                              left = rem - grid[a][b]
                              if left >= 0 and not seen[a][b][left]:
                                  seen[a][b][left] = True
                                  q.append((a, b, left))
                  steps += 1
              return -1
        `,
        javascript: code`
          var shortestPath = function(grid, k) {
              var m = grid.length, n = grid[0].length;
              if (k >= m + n - 2) return m + n - 2;
              var K = k + 1;
              var seen = new Array(m * n * K).fill(false);
              var cur = [[0, 0, k]];
              seen[k] = true;
              var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
              for (var steps = 0; cur.length > 0; steps++) {
                  var next = [];
                  for (var i = 0; i < cur.length; i++) {
                      var r = cur[i][0], c = cur[i][1], rem = cur[i][2];
                      if (r === m - 1 && c === n - 1) return steps;
                      for (var d = 0; d < 4; d++) {
                          var a = r + dirs[d][0], b = c + dirs[d][1];
                          if (a < 0 || b < 0 || a >= m || b >= n) continue;
                          var left = rem - grid[a][b];
                          if (left < 0) continue;
                          var key = (a * n + b) * K + left;
                          if (!seen[key]) { seen[key] = true; next.push([a, b, left]); }
                      }
                  }
                  cur = next;
              }
              return -1;
          };
        `,
        typescript: code`
          function shortestPath(grid: number[][], k: number): number {
              var m = grid.length, n = grid[0].length;
              if (k >= m + n - 2) return m + n - 2;
              var K = k + 1;
              var seen: boolean[] = [];
              for (var s = 0; s < m * n * K; s++) seen.push(false);
              var cur: number[][] = [[0, 0, k]];
              seen[k] = true;
              var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
              for (var steps = 0; cur.length > 0; steps++) {
                  var next: number[][] = [];
                  for (var i = 0; i < cur.length; i++) {
                      var r = cur[i][0], c = cur[i][1], rem = cur[i][2];
                      if (r === m - 1 && c === n - 1) return steps;
                      for (var d = 0; d < 4; d++) {
                          var a = r + dirs[d][0], b = c + dirs[d][1];
                          if (a < 0 || b < 0 || a >= m || b >= n) continue;
                          var left = rem - grid[a][b];
                          if (left < 0) continue;
                          var key = (a * n + b) * K + left;
                          if (!seen[key]) { seen[key] = true; next.push([a, b, left]); }
                      }
                  }
                  cur = next;
              }
              return -1;
          }
        `,
        java: code`
          public static int shortestPath(int[][] grid, int k) {
              int m = grid.length, n = grid[0].length;
              if (k >= m + n - 2) return m + n - 2;
              boolean[][][] seen = new boolean[m][n][k + 1];
              ArrayDeque<int[]> q = new ArrayDeque<>();
              q.add(new int[]{0, 0, k});
              seen[0][0][k] = true;
              int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
              for (int steps = 0; !q.isEmpty(); steps++) {
                  for (int size = q.size(); size > 0; size--) {
                      int[] cur = q.poll();
                      if (cur[0] == m - 1 && cur[1] == n - 1) return steps;
                      for (int[] d : dirs) {
                          int a = cur[0] + d[0], b = cur[1] + d[1];
                          if (a < 0 || b < 0 || a >= m || b >= n) continue;
                          int left = cur[2] - grid[a][b];
                          if (left < 0 || seen[a][b][left]) continue;
                          seen[a][b][left] = true;
                          q.add(new int[]{a, b, left});
                      }
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int shortestPath(vector<vector<int>>& grid, int k) {
              int m = grid.size(), n = grid[0].size();
              if (k >= m + n - 2) return m + n - 2;
              int K = k + 1;
              vector<char> seen(m * n * K, 0);
              queue<array<int, 3>> q;
              q.push({0, 0, k});
              seen[k] = 1;
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              for (int steps = 0; !q.empty(); steps++) {
                  for (int size = q.size(); size > 0; size--) {
                      auto cur = q.front();
                      q.pop();
                      if (cur[0] == m - 1 && cur[1] == n - 1) return steps;
                      for (int d = 0; d < 4; d++) {
                          int a = cur[0] + dr[d], b = cur[1] + dc[d];
                          if (a < 0 || b < 0 || a >= m || b >= n) continue;
                          int left = cur[2] - grid[a][b];
                          if (left < 0) continue;
                          int key = (a * n + b) * K + left;
                          if (seen[key]) continue;
                          seen[key] = 1;
                          q.push({a, b, left});
                      }
                  }
              }
              return -1;
          }
        `,
        c: code`
          int shortestPath(int** grid, int gridSize, int* gridColSize, int k) {
              int m = gridSize, n = gridColSize[0];
              if (k >= m + n - 2) return m + n - 2;
              int K = k + 1, total = m * n * K;
              char* seen = (char*)calloc(total, 1);
              int* q = (int*)malloc(total * sizeof(int));
              int head = 0, tail = 0, ans = -1;
              q[tail++] = k;
              seen[k] = 1;
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              for (int steps = 0; head < tail && ans < 0; steps++) {
                  int end = tail;
                  while (head < end) {
                      int s = q[head++];
                      int rem = s % K, cell = s / K, r = cell / n, c = cell % n;
                      if (r == m - 1 && c == n - 1) { ans = steps; break; }
                      for (int d = 0; d < 4; d++) {
                          int a = r + dr[d], b = c + dc[d];
                          if (a < 0 || b < 0 || a >= m || b >= n) continue;
                          int left = rem - grid[a][b];
                          if (left < 0) continue;
                          int key = (a * n + b) * K + left;
                          if (seen[key]) continue;
                          seen[key] = 1;
                          q[tail++] = key;
                      }
                  }
              }
              free(seen);
              free(q);
              return ans;
          }
        `,
        csharp: code`
          public static int ShortestPath(int[][] grid, int k)
          {
              int m = grid.Length, n = grid[0].Length;
              if (k >= m + n - 2) return m + n - 2;
              int K = k + 1;
              var seen = new bool[m * n * K];
              var q = new Queue<int>();
              q.Enqueue(k);
              seen[k] = true;
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              for (int steps = 0; q.Count > 0; steps++)
              {
                  for (int size = q.Count; size > 0; size--)
                  {
                      int s = q.Dequeue();
                      int rem = s % K, cell = s / K, r = cell / n, c = cell % n;
                      if (r == m - 1 && c == n - 1) return steps;
                      for (int d = 0; d < 4; d++)
                      {
                          int a = r + dr[d], b = c + dc[d];
                          if (a < 0 || b < 0 || a >= m || b >= n) continue;
                          int left = rem - grid[a][b];
                          if (left < 0) continue;
                          int key = (a * n + b) * K + left;
                          if (seen[key]) continue;
                          seen[key] = true;
                          q.Enqueue(key);
                      }
                  }
              }
              return -1;
          }
        `,
        go: code`
          func shortestPath(grid [][]int, k int) int {
          	m, n := len(grid), len(grid[0])
          	if k >= m+n-2 {
          		return m + n - 2
          	}
          	K := k + 1
          	seen := make([]bool, m*n*K)
          	seen[k] = true
          	cur := []int{k}
          	dr := []int{1, -1, 0, 0}
          	dc := []int{0, 0, 1, -1}
          	for steps := 0; len(cur) > 0; steps++ {
          		next := []int{}
          		for _, s := range cur {
          			rem, cell := s%K, s/K
          			r, c := cell/n, cell%n
          			if r == m-1 && c == n-1 {
          				return steps
          			}
          			for d := 0; d < 4; d++ {
          				a, b := r+dr[d], c+dc[d]
          				if a < 0 || b < 0 || a >= m || b >= n {
          					continue
          				}
          				left := rem - grid[a][b]
          				if left < 0 {
          					continue
          				}
          				key := (a*n+b)*K + left
          				if !seen[key] {
          					seen[key] = true
          					next = append(next, key)
          				}
          			}
          		}
          		cur = next
          	}
          	return -1
          }
        `,
        kotlin: code`
          fun shortestPath(grid: Array<IntArray>, k: Int): Int {
              val m = grid.size
              val n = grid[0].size
              if (k >= m + n - 2) return m + n - 2
              val K = k + 1
              val seen = BooleanArray(m * n * K)
              var cur = ArrayList<Int>()
              cur.add(k)
              seen[k] = true
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              var steps = 0
              while (cur.isNotEmpty()) {
                  val next = ArrayList<Int>()
                  for (s in cur) {
                      val rem = s % K
                      val cell = s / K
                      val r = cell / n
                      val c = cell % n
                      if (r == m - 1 && c == n - 1) return steps
                      for (d in 0 until 4) {
                          val a = r + dr[d]
                          val b = c + dc[d]
                          if (a < 0 || b < 0 || a >= m || b >= n) continue
                          val left = rem - grid[a][b]
                          if (left < 0) continue
                          val key = (a * n + b) * K + left
                          if (!seen[key]) { seen[key] = true; next.add(key) }
                      }
                  }
                  cur = next
                  steps++
              }
              return -1
          }
        `,
        swift: code`
          func shortestPath(_ grid: [[Int]], _ k: Int) -> Int {
              let m = grid.count, n = grid[0].count
              if k >= m + n - 2 { return m + n - 2 }
              let K = k + 1
              var seen = [Bool](repeating: false, count: m * n * K)
              seen[k] = true
              var cur = [k]
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              var steps = 0
              while !cur.isEmpty {
                  var next = [Int]()
                  for s in cur {
                      let rem = s % K, cell = s / K, r = cell / n, c = cell % n
                      if r == m - 1 && c == n - 1 { return steps }
                      for d in 0..<4 {
                          let a = r + dr[d], b = c + dc[d]
                          if a < 0 || b < 0 || a >= m || b >= n { continue }
                          let left = rem - grid[a][b]
                          if left < 0 { continue }
                          let key = (a * n + b) * K + left
                          if !seen[key] { seen[key] = true; next.append(key) }
                      }
                  }
                  cur = next
                  steps += 1
              }
              return -1
          }
        `,
        rust: code`
          fn shortestPath(grid: Vec<Vec<i32>>, k: i32) -> i32 {
              let m = grid.len() as i32;
              let n = grid[0].len() as i32;
              if k >= m + n - 2 {
                  return m + n - 2;
              }
              let kk = k + 1;
              let mut seen = vec![false; (m * n * kk) as usize];
              seen[k as usize] = true;
              let mut cur: Vec<i32> = vec![k];
              let dirs = [(1i32, 0i32), (-1, 0), (0, 1), (0, -1)];
              let mut steps = 0;
              while !cur.is_empty() {
                  let mut next: Vec<i32> = Vec::new();
                  for &s in cur.iter() {
                      let rem = s % kk;
                      let cell = s / kk;
                      let (r, c) = (cell / n, cell % n);
                      if r == m - 1 && c == n - 1 {
                          return steps;
                      }
                      for &(dr, dc) in dirs.iter() {
                          let (a, b) = (r + dr, c + dc);
                          if a < 0 || b < 0 || a >= m || b >= n {
                              continue;
                          }
                          let left = rem - grid[a as usize][b as usize];
                          if left < 0 {
                              continue;
                          }
                          let key = (a * n + b) * kk + left;
                          if !seen[key as usize] {
                              seen[key as usize] = true;
                              next.push(key);
                          }
                      }
                  }
                  cur = next;
                  steps += 1;
              }
              -1
          }
        `,
        php: code`
          function shortestPath($grid, $k) {
              $m = count($grid);
              $n = count($grid[0]);
              if ($k >= $m + $n - 2) return $m + $n - 2;
              $K = $k + 1;
              $seen = [];
              $seen[$k] = true;
              $cur = [$k];
              $dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
              for ($steps = 0; count($cur) > 0; $steps++) {
                  $next = [];
                  foreach ($cur as $s) {
                      $rem = $s % $K;
                      $cell = intdiv($s, $K);
                      $r = intdiv($cell, $n);
                      $c = $cell % $n;
                      if ($r == $m - 1 && $c == $n - 1) return $steps;
                      foreach ($dirs as $d) {
                          $a = $r + $d[0];
                          $b = $c + $d[1];
                          if ($a < 0 || $b < 0 || $a >= $m || $b >= $n) continue;
                          $left = $rem - $grid[$a][$b];
                          if ($left < 0) continue;
                          $key = ($a * $n + $b) * $K + $left;
                          if (!isset($seen[$key])) { $seen[$key] = true; $next[] = $key; }
                      }
                  }
                  $cur = $next;
              }
              return -1;
          }
        `,
        ruby: code`
          def shortestPath(grid, k)
            m = grid.length
            n = grid[0].length
            return m + n - 2 if k >= m + n - 2
            kk = k + 1
            seen = Array.new(m * n * kk, false)
            seen[k] = true
            cur = [k]
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            steps = 0
            until cur.empty?
              nxt = []
              cur.each do |s|
                rem = s % kk
                cell = s / kk
                r = cell / n
                c = cell % n
                return steps if r == m - 1 && c == n - 1
                dirs.each do |dr, dc|
                  a = r + dr
                  b = c + dc
                  next if a < 0 || b < 0 || a >= m || b >= n
                  left = rem - grid[a][b]
                  next if left < 0
                  key = (a * n + b) * kk + left
                  unless seen[key]
                    seen[key] = true
                    nxt << key
                  end
                end
              end
              cur = nxt
              steps += 1
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost to Make at Least One Valid Path in a Grid (LC 1368) ─
  (() => {
    const ref = (grid: number[][]) => {
      // Bellman-Ford style relaxation until nothing improves (grids here are tiny)
      const m = grid.length, n = grid[0].length;
      const DR = [0, 0, 0, 1, -1], DC = [0, 1, -1, 0, 0];
      const dist = Array.from({ length: m }, () => new Array<number>(n).fill(Infinity));
      dist[0][0] = 0;
      for (let changed = true; changed;) {
        changed = false;
        for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
          if (dist[r][c] === Infinity) continue;
          for (let d = 1; d <= 4; d++) {
            const a = r + DR[d], b = c + DC[d];
            if (a < 0 || b < 0 || a >= m || b >= n) continue;
            const w = dist[r][c] + (grid[r][c] === d ? 0 : 1);
            if (w < dist[a][b]) { dist[a][b] = w; changed = true; }
          }
        }
      }
      return dist[m - 1][n - 1];
    };
    return {
      slug: "minimum-cost-to-make-at-least-one-valid-path-in-a-grid",
      title: "Minimum Cost to Make at Least One Valid Path in a Grid",
      difficulty: "HARD" as const,
      tags: ["Breadth-First Search", "Graph", "Matrix", "Shortest Path", "Google", "Amazon"],
      signature: { funcName: "minCost", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Every cell of the `m x n` matrix `grid` holds a sign pointing to the next cell to visit:\n\n- `1` — go right, to `(i, j + 1)`;\n- `2` — go left, to `(i, j - 1)`;\n- `3` — go down, to `(i + 1, j)`;\n- `4` — go up, to `(i - 1, j)`.\n\nSome signs may point outside the grid. Starting at `(0, 0)` and following the signs gives a path; it is **valid** if it reaches `(m - 1, n - 1)`.\n\nYou may change the sign of any cell for a cost of 1 (each cell's sign at most once). Return the minimum total cost needed to make the grid contain at least one valid path.",
        [
          { in: "grid = [[1,1,3],[2,2,3],[4,4,1]]", out: "0", note: "Right, right, down, down already reaches the bottom-right corner." },
          { in: "grid = [[2,2],[2,2]]", out: "2", note: "Every sign points left; at least two of them must be changed, e.g. `(0,0)` to right and `(0,1)` to down." },
          { in: "grid = [[1,4],[1,1]]", out: "1" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 100", "1 <= grid[i][j] <= 4"]),
      hints: [
        "Model each cell as a node with an edge to each of its up to four neighbours.",
        "The edge in the sign's direction is free; every other edge costs 1 (changing the sign). The answer is the cheapest path from the start to the corner.",
        "With edge weights 0 and 1, a 0-1 BFS (deque: free edges to the front, paid edges to the back) finds shortest paths in linear time.",
      ],
      editorial: explain({
        idea: "Changing a sign is the same as taking a cost-1 edge out of that cell, so the task is a shortest path in a graph whose edges weigh 0 (follow the sign) or 1 (go elsewhere) — a 0-1 BFS.",
        steps: [
          "Set `dist[0][0] = 0` and all other distances to infinity; process cells in order of distance.",
          "Pop the cell with the smallest distance `d` (a deque or two buckets — `d` and `d + 1` — suffice). Skip it if already finalised.",
          "For each of the four directions, the neighbour costs `d` if the cell's sign points there and `d + 1` otherwise; relax it, pushing free moves into the current bucket and paid moves into the next.",
          "Return `dist[m-1][n-1]` when the corner is finalised.",
        ],
        why: "A path that follows signs except at `c` cells costs exactly `c`, and changing a cell's sign twice never helps on a shortest path because a shortest path never revisits a cell. So the minimum cost equals the shortest-path distance with 0/1 weights, and 0-1 BFS is Dijkstra specialised to those weights — cells leave the buckets in non-decreasing distance order.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "A plain BFS that counts edges ignores the free moves; the weights matter.",
          "Free moves must be processed before paid ones of the same layer — push them to the front of the deque (or into the current bucket).",
          "A 1 × 1 grid costs 0 whatever its sign.",
        ],
      }),
      examples: [
        { input: "[[1,1,3],[2,2,3],[4,4,1]]", expectedOutput: "0" },
        { input: "[[2,2],[2,2]]", expectedOutput: "2" },
        { input: "[[1,4],[1,1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [3, 6, 8]));
        const n = ri(rng, 1, pick(rng, [3, 6, 8]));
        const bias = pick(rng, [[1, 2, 3, 4], [1, 1, 3, 3, 2, 4], [2, 4], [1, 3]]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => pick(rng, bias)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def minCost(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              moves = {1: (0, 1), 2: (0, -1), 3: (1, 0), 4: (-1, 0)}
              INF = float('inf')
              dist = [[INF] * n for _ in range(m)]
              dist[0][0] = 0
              dq = deque([(0, 0)])
              while dq:
                  r, c = dq.popleft()
                  d = dist[r][c]
                  for sign, (dr, dc) in moves.items():
                      a, b = r + dr, c + dc
                      if 0 <= a < m and 0 <= b < n:
                          w = 0 if grid[r][c] == sign else 1
                          if d + w < dist[a][b]:
                              dist[a][b] = d + w
                              if w == 0:
                                  dq.appendleft((a, b))
                              else:
                                  dq.append((a, b))
              return dist[m - 1][n - 1]
        `,
        javascript: code`
          var minCost = function(grid) {
              var m = grid.length, n = grid[0].length, total = m * n;
              var DR = [0, 0, 0, 1, -1], DC = [0, 1, -1, 0, 0];
              var dist = new Array(total).fill(Infinity), done = new Array(total).fill(false);
              dist[0] = 0;
              var cur = [0];
              for (var level = 0; cur.length > 0; level++) {
                  var next = [];
                  while (cur.length > 0) {
                      var u = cur.pop();
                      if (done[u]) continue;
                      done[u] = true;
                      if (u === total - 1) return level;
                      var r = Math.floor(u / n), c = u % n;
                      for (var d = 1; d <= 4; d++) {
                          var a = r + DR[d], b = c + DC[d];
                          if (a < 0 || b < 0 || a >= m || b >= n) continue;
                          var v = a * n + b, w = grid[r][c] === d ? 0 : 1;
                          if (level + w < dist[v]) {
                              dist[v] = level + w;
                              if (w === 0) cur.push(v); else next.push(v);
                          }
                      }
                  }
                  cur = next;
              }
              return dist[total - 1];
          };
        `,
        typescript: code`
          function minCost(grid: number[][]): number {
              var m = grid.length, n = grid[0].length, total = m * n;
              var DR = [0, 0, 0, 1, -1], DC = [0, 1, -1, 0, 0];
              var dist: number[] = [], done: boolean[] = [];
              for (var i = 0; i < total; i++) { dist.push(Infinity); done.push(false); }
              dist[0] = 0;
              var cur: number[] = [0];
              for (var level = 0; cur.length > 0; level++) {
                  var next: number[] = [];
                  while (cur.length > 0) {
                      var u = cur.pop() as number;
                      if (done[u]) continue;
                      done[u] = true;
                      if (u === total - 1) return level;
                      var r = Math.floor(u / n), c = u % n;
                      for (var d = 1; d <= 4; d++) {
                          var a = r + DR[d], b = c + DC[d];
                          if (a < 0 || b < 0 || a >= m || b >= n) continue;
                          var v = a * n + b, w = grid[r][c] === d ? 0 : 1;
                          if (level + w < dist[v]) {
                              dist[v] = level + w;
                              if (w === 0) cur.push(v); else next.push(v);
                          }
                      }
                  }
                  cur = next;
              }
              return dist[total - 1];
          }
        `,
        java: code`
          public static int minCost(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              int[] DR = {0, 0, 0, 1, -1}, DC = {0, 1, -1, 0, 0};
              int[][] dist = new int[m][n];
              for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
              dist[0][0] = 0;
              ArrayDeque<int[]> dq = new ArrayDeque<>();
              dq.add(new int[]{0, 0});
              while (!dq.isEmpty()) {
                  int[] cur = dq.pollFirst();
                  int r = cur[0], c = cur[1], d0 = dist[r][c];
                  for (int d = 1; d <= 4; d++) {
                      int a = r + DR[d], b = c + DC[d];
                      if (a < 0 || b < 0 || a >= m || b >= n) continue;
                      int w = grid[r][c] == d ? 0 : 1;
                      if (d0 + w < dist[a][b]) {
                          dist[a][b] = d0 + w;
                          if (w == 0) dq.addFirst(new int[]{a, b});
                          else dq.addLast(new int[]{a, b});
                      }
                  }
              }
              return dist[m - 1][n - 1];
          }
        `,
        cpp: code`
          int minCost(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              int DR[5] = {0, 0, 0, 1, -1}, DC[5] = {0, 1, -1, 0, 0};
              vector<vector<int>> dist(m, vector<int>(n, INT_MAX));
              dist[0][0] = 0;
              deque<pair<int, int>> dq;
              dq.push_back({0, 0});
              while (!dq.empty()) {
                  auto cur = dq.front();
                  dq.pop_front();
                  int r = cur.first, c = cur.second, d0 = dist[r][c];
                  for (int d = 1; d <= 4; d++) {
                      int a = r + DR[d], b = c + DC[d];
                      if (a < 0 || b < 0 || a >= m || b >= n) continue;
                      int w = grid[r][c] == d ? 0 : 1;
                      if (d0 + w < dist[a][b]) {
                          dist[a][b] = d0 + w;
                          if (w == 0) dq.push_front({a, b});
                          else dq.push_back({a, b});
                      }
                  }
              }
              return dist[m - 1][n - 1];
          }
        `,
        c: code`
          int minCost(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0], total = m * n;
              int DR[5] = {0, 0, 0, 1, -1}, DC[5] = {0, 1, -1, 0, 0};
              int* dist = (int*)malloc(total * sizeof(int));
              for (int i = 0; i < total; i++) dist[i] = 2147483647;
              /* a deque in a ring buffer; every cell enters at most 4 times */
              int cap = 4 * total + 4;
              int* dq = (int*)malloc(cap * sizeof(int));
              int head = 0, size = 0;
              dist[0] = 0;
              dq[0] = 0;
              size = 1;
              while (size > 0) {
                  int u = dq[head];
                  head = (head + 1) % cap;
                  size--;
                  int r = u / n, c = u % n, d0 = dist[u];
                  for (int d = 1; d <= 4; d++) {
                      int a = r + DR[d], b = c + DC[d];
                      if (a < 0 || b < 0 || a >= m || b >= n) continue;
                      int v = a * n + b, w = grid[r][c] == d ? 0 : 1;
                      if (d0 + w < dist[v]) {
                          dist[v] = d0 + w;
                          if (w == 0) { head = (head - 1 + cap) % cap; dq[head] = v; }
                          else dq[(head + size) % cap] = v;
                          size++;
                      }
                  }
              }
              int ans = dist[total - 1];
              free(dist);
              free(dq);
              return ans;
          }
        `,
        csharp: code`
          public static int MinCost(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              int[] DR = { 0, 0, 0, 1, -1 }, DC = { 0, 1, -1, 0, 0 };
              var dist = new int[m, n];
              for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) dist[i, j] = int.MaxValue;
              dist[0, 0] = 0;
              var dq = new LinkedList<int[]>();
              dq.AddLast(new[] { 0, 0 });
              while (dq.Count > 0)
              {
                  var cur = dq.First.Value;
                  dq.RemoveFirst();
                  int r = cur[0], c = cur[1], d0 = dist[r, c];
                  for (int d = 1; d <= 4; d++)
                  {
                      int a = r + DR[d], b = c + DC[d];
                      if (a < 0 || b < 0 || a >= m || b >= n) continue;
                      int w = grid[r][c] == d ? 0 : 1;
                      if (d0 + w < dist[a, b])
                      {
                          dist[a, b] = d0 + w;
                          if (w == 0) dq.AddFirst(new[] { a, b });
                          else dq.AddLast(new[] { a, b });
                      }
                  }
              }
              return dist[m - 1, n - 1];
          }
        `,
        go: code`
          func minCost(grid [][]int) int {
          	m, n := len(grid), len(grid[0])
          	total := m * n
          	DR := []int{0, 0, 0, 1, -1}
          	DC := []int{0, 1, -1, 0, 0}
          	dist := make([]int, total)
          	done := make([]bool, total)
          	for i := range dist {
          		dist[i] = 1 << 30
          	}
          	dist[0] = 0
          	cur := []int{0}
          	for level := 0; len(cur) > 0; level++ {
          		next := []int{}
          		for len(cur) > 0 {
          			u := cur[len(cur)-1]
          			cur = cur[:len(cur)-1]
          			if done[u] {
          				continue
          			}
          			done[u] = true
          			if u == total-1 {
          				return level
          			}
          			r, c := u/n, u%n
          			for d := 1; d <= 4; d++ {
          				a, b := r+DR[d], c+DC[d]
          				if a < 0 || b < 0 || a >= m || b >= n {
          					continue
          				}
          				v := a*n + b
          				w := 1
          				if grid[r][c] == d {
          					w = 0
          				}
          				if level+w < dist[v] {
          					dist[v] = level + w
          					if w == 0 {
          						cur = append(cur, v)
          					} else {
          						next = append(next, v)
          					}
          				}
          			}
          		}
          		cur = next
          	}
          	return dist[total-1]
          }
        `,
        kotlin: code`
          fun minCost(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              val DR = intArrayOf(0, 0, 0, 1, -1)
              val DC = intArrayOf(0, 1, -1, 0, 0)
              val dist = Array(m) { IntArray(n) { Int.MAX_VALUE } }
              dist[0][0] = 0
              val dq = java.util.ArrayDeque<IntArray>()
              dq.add(intArrayOf(0, 0))
              while (dq.isNotEmpty()) {
                  val cur = dq.pollFirst()
                  val r = cur[0]
                  val c = cur[1]
                  val d0 = dist[r][c]
                  for (d in 1..4) {
                      val a = r + DR[d]
                      val b = c + DC[d]
                      if (a < 0 || b < 0 || a >= m || b >= n) continue
                      val w = if (grid[r][c] == d) 0 else 1
                      if (d0 + w < dist[a][b]) {
                          dist[a][b] = d0 + w
                          if (w == 0) dq.addFirst(intArrayOf(a, b)) else dq.addLast(intArrayOf(a, b))
                      }
                  }
              }
              return dist[m - 1][n - 1]
          }
        `,
        swift: code`
          func minCost(_ grid: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count, total = m * n
              let DR = [0, 0, 0, 1, -1], DC = [0, 1, -1, 0, 0]
              var dist = [Int](repeating: Int.max, count: total)
              var done = [Bool](repeating: false, count: total)
              dist[0] = 0
              var cur = [0]
              var level = 0
              while !cur.isEmpty {
                  var next = [Int]()
                  while let u = cur.popLast() {
                      if done[u] { continue }
                      done[u] = true
                      if u == total - 1 { return level }
                      let r = u / n, c = u % n
                      for d in 1...4 {
                          let a = r + DR[d], b = c + DC[d]
                          if a < 0 || b < 0 || a >= m || b >= n { continue }
                          let v = a * n + b, w = grid[r][c] == d ? 0 : 1
                          if level + w < dist[v] {
                              dist[v] = level + w
                              if w == 0 { cur.append(v) } else { next.append(v) }
                          }
                      }
                  }
                  cur = next
                  level += 1
              }
              return dist[total - 1]
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          fn minCost(grid: Vec<Vec<i32>>) -> i32 {
              let m = grid.len() as i32;
              let n = grid[0].len() as i32;
              let dr = [0i32, 0, 0, 1, -1];
              let dc = [0i32, 1, -1, 0, 0];
              let mut dist = vec![vec![std::i32::MAX; n as usize]; m as usize];
              dist[0][0] = 0;
              let mut dq: VecDeque<(i32, i32)> = VecDeque::new();
              dq.push_back((0, 0));
              while let Some((r, c)) = dq.pop_front() {
                  let d0 = dist[r as usize][c as usize];
                  for d in 1..5usize {
                      let (a, b) = (r + dr[d], c + dc[d]);
                      if a < 0 || b < 0 || a >= m || b >= n {
                          continue;
                      }
                      let w = if grid[r as usize][c as usize] == d as i32 { 0 } else { 1 };
                      if d0 + w < dist[a as usize][b as usize] {
                          dist[a as usize][b as usize] = d0 + w;
                          if w == 0 {
                              dq.push_front((a, b));
                          } else {
                              dq.push_back((a, b));
                          }
                      }
                  }
              }
              dist[(m - 1) as usize][(n - 1) as usize]
          }
        `,
        php: code`
          function minCost($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $total = $m * $n;
              $DR = [0, 0, 0, 1, -1];
              $DC = [0, 1, -1, 0, 0];
              $dist = array_fill(0, $total, PHP_INT_MAX);
              $done = array_fill(0, $total, false);
              $dist[0] = 0;
              $cur = [0];
              for ($level = 0; count($cur) > 0; $level++) {
                  $next = [];
                  while (count($cur) > 0) {
                      $u = array_pop($cur);
                      if ($done[$u]) continue;
                      $done[$u] = true;
                      if ($u == $total - 1) return $level;
                      $r = intdiv($u, $n);
                      $c = $u % $n;
                      for ($d = 1; $d <= 4; $d++) {
                          $a = $r + $DR[$d];
                          $b = $c + $DC[$d];
                          if ($a < 0 || $b < 0 || $a >= $m || $b >= $n) continue;
                          $v = $a * $n + $b;
                          $w = $grid[$r][$c] == $d ? 0 : 1;
                          if ($level + $w < $dist[$v]) {
                              $dist[$v] = $level + $w;
                              if ($w == 0) $cur[] = $v; else $next[] = $v;
                          }
                      }
                  }
                  $cur = $next;
              }
              return $dist[$total - 1];
          }
        `,
        ruby: code`
          def minCost(grid)
            m = grid.length
            n = grid[0].length
            total = m * n
            dr = [0, 0, 0, 1, -1]
            dc = [0, 1, -1, 0, 0]
            dist = Array.new(total, Float::INFINITY)
            done = Array.new(total, false)
            dist[0] = 0
            cur = [0]
            level = 0
            until cur.empty?
              nxt = []
              until cur.empty?
                u = cur.pop
                next if done[u]
                done[u] = true
                return level if u == total - 1
                r = u / n
                c = u % n
                (1..4).each do |d|
                  a = r + dr[d]
                  b = c + dc[d]
                  next if a < 0 || b < 0 || a >= m || b >= n
                  v = a * n + b
                  w = grid[r][c] == d ? 0 : 1
                  if level + w < dist[v]
                    dist[v] = level + w
                    if w == 0
                      cur << v
                    else
                      nxt << v
                    end
                  end
                end
              end
              cur = nxt
              level += 1
            end
            dist[total - 1]
          end
        `,
      },
    };
  })(),

  // ── Largest Submatrix With Rearrangements (LC 1727) ─────────────
  (() => {
    const ref = (mat: number[][]) => {
      // for every band of rows, the all-ones columns can be placed side by side
      const m = mat.length, n = mat[0].length;
      let best = 0;
      for (let top = 0; top < m; top++) {
        const full = new Array<boolean>(n).fill(true);
        for (let bottom = top; bottom < m; bottom++) {
          let cnt = 0;
          for (let c = 0; c < n; c++) { if (!mat[bottom][c]) full[c] = false; if (full[c]) cnt++; }
          best = Math.max(best, cnt * (bottom - top + 1));
        }
      }
      return best;
    };
    return {
      slug: "largest-submatrix-with-rearrangements",
      title: "Largest Submatrix With Rearrangements",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Matrix", "Google", "Amazon"],
      signature: { funcName: "largestSubmatrix", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` binary matrix `matrix`. You may reorder its **columns** in any way you like (each column moves as a whole).\n\nAfter reordering optimally, return the area of the largest sub-matrix in which every cell is `1`.",
        [
          { in: "matrix = [[1,0,1],[1,1,1],[0,1,1]]", out: "4", note: "Put column 2 next to column 0: rows 0–1 of those two columns are all 1s (area 4). Columns 1 and 2 over rows 1–2 also give 4." },
          { in: "matrix = [[0,1,0,1,1]]", out: "3" },
          { in: "matrix = [[0,0],[0,0]]", out: "0" },
        ],
        ["m == matrix.length", "n == matrix[i].length", "1 <= m * n <= 10^5", "matrix[i][j] is 0 or 1"]),
      hints: [
        "Fix the bottom row of the sub-matrix. For each column, how tall a run of 1s ends at that row?",
        "Columns can be reordered freely, so for a fixed bottom row you may line the columns up from tallest to shortest.",
        "Sort the heights in descending order; using the first `i + 1` of them gives width `i + 1` and height `heights[i]`. Take the best product over all rows.",
      ],
      editorial: explain({
        idea: "For each bottom row, the column heights (consecutive 1s ending there) fully describe what is possible, and sorting them descending turns the best rectangle into a simple scan.",
        steps: [
          "Maintain `h[c]`: the number of consecutive 1s in column `c` ending at the current row (reset to 0 on a 0).",
          "For each row, update `h`, copy it, and sort the copy in descending order.",
          "For each `i`, a rectangle of width `i + 1` and height `sorted[i]` fits (the `i + 1` tallest columns placed side by side); update the answer with `sorted[i] * (i + 1)`.",
        ],
        why: "Any all-ones sub-matrix with bottom row `r` and height `t` uses columns whose heights at `r` are at least `t`. Reordering lets all such columns sit together, so the best rectangle with bottom row `r` and width `w` has height equal to the `w`-th largest height — exactly what the sorted scan checks.",
        time: "O(m · n log n)",
        space: "O(n)",
        pitfalls: [
          "Only whole columns move — rows keep their order, so heights must be consecutive runs in the original row order.",
          "Reset a column's height to 0 when the current cell is 0.",
          "Sort a copy of the heights; the running heights must stay in column order for the next row.",
        ],
      }),
      examples: [
        { input: "[[1,0,1],[1,1,1],[0,1,1]]", expectedOutput: "4" },
        { input: "[[0,1,0,1,1]]", expectedOutput: "3" },
        { input: "[[0,0],[0,0]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [3, 7, 10]));
        const n = ri(rng, 1, pick(rng, [3, 7, 10]));
        const p = pick(rng, [0.3, 0.6, 0.8, 0.95]);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        return { input: fmtIntMat(mat), expectedOutput: String(ref(mat)) };
      },
      solutions: {
        python: code`
          from typing import List

          def largestSubmatrix(matrix: List[List[int]]) -> int:
              n = len(matrix[0])
              h = [0] * n
              best = 0
              for row in matrix:
                  for c in range(n):
                      h[c] = h[c] + 1 if row[c] == 1 else 0
                  s = sorted(h, reverse=True)
                  for i, v in enumerate(s):
                      best = max(best, v * (i + 1))
              return best
        `,
        javascript: code`
          var largestSubmatrix = function(matrix) {
              var n = matrix[0].length, h = new Array(n).fill(0), best = 0;
              for (var r = 0; r < matrix.length; r++) {
                  for (var c = 0; c < n; c++) h[c] = matrix[r][c] === 1 ? h[c] + 1 : 0;
                  var s = h.slice().sort(function(a, b) { return b - a; });
                  for (var i = 0; i < n; i++) best = Math.max(best, s[i] * (i + 1));
              }
              return best;
          };
        `,
        typescript: code`
          function largestSubmatrix(matrix: number[][]): number {
              var n = matrix[0].length, h: number[] = [], best = 0;
              for (var c0 = 0; c0 < n; c0++) h.push(0);
              for (var r = 0; r < matrix.length; r++) {
                  for (var c = 0; c < n; c++) h[c] = matrix[r][c] === 1 ? h[c] + 1 : 0;
                  var s = h.slice().sort(function(a, b) { return b - a; });
                  for (var i = 0; i < n; i++) best = Math.max(best, s[i] * (i + 1));
              }
              return best;
          }
        `,
        java: code`
          public static int largestSubmatrix(int[][] matrix) {
              int n = matrix[0].length, best = 0;
              int[] h = new int[n];
              for (int[] row : matrix) {
                  for (int c = 0; c < n; c++) h[c] = row[c] == 1 ? h[c] + 1 : 0;
                  int[] s = h.clone();
                  Arrays.sort(s);
                  for (int i = n - 1; i >= 0; i--) best = Math.max(best, s[i] * (n - i));
              }
              return best;
          }
        `,
        cpp: code`
          int largestSubmatrix(vector<vector<int>>& matrix) {
              int n = matrix[0].size(), best = 0;
              vector<int> h(n, 0);
              for (auto& row : matrix) {
                  for (int c = 0; c < n; c++) h[c] = row[c] == 1 ? h[c] + 1 : 0;
                  vector<int> s = h;
                  sort(s.rbegin(), s.rend());
                  for (int i = 0; i < n; i++) best = max(best, s[i] * (i + 1));
              }
              return best;
          }
        `,
        c: code`
          static int cmpDescInt(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x < y) - (x > y);
          }

          int largestSubmatrix(int** matrix, int matrixSize, int* matrixColSize) {
              int n = matrixColSize[0], best = 0;
              int* h = (int*)calloc(n, sizeof(int));
              int* s = (int*)malloc(n * sizeof(int));
              for (int r = 0; r < matrixSize; r++) {
                  for (int c = 0; c < n; c++) h[c] = matrix[r][c] == 1 ? h[c] + 1 : 0;
                  memcpy(s, h, n * sizeof(int));
                  qsort(s, n, sizeof(int), cmpDescInt);
                  for (int i = 0; i < n; i++) if (s[i] * (i + 1) > best) best = s[i] * (i + 1);
              }
              free(h);
              free(s);
              return best;
          }
        `,
        csharp: code`
          public static int LargestSubmatrix(int[][] matrix)
          {
              int n = matrix[0].Length, best = 0;
              var h = new int[n];
              foreach (var row in matrix)
              {
                  for (int c = 0; c < n; c++) h[c] = row[c] == 1 ? h[c] + 1 : 0;
                  var s = (int[])h.Clone();
                  Array.Sort(s);
                  for (int i = n - 1; i >= 0; i--) best = Math.Max(best, s[i] * (n - i));
              }
              return best;
          }
        `,
        go: code`
          func largestSubmatrix(matrix [][]int) int {
          	n := len(matrix[0])
          	h := make([]int, n)
          	best := 0
          	for _, row := range matrix {
          		for c := 0; c < n; c++ {
          			if row[c] == 1 {
          				h[c]++
          			} else {
          				h[c] = 0
          			}
          		}
          		s := append([]int{}, h...)
          		sort.Sort(sort.Reverse(sort.IntSlice(s)))
          		for i := 0; i < n; i++ {
          			if s[i]*(i+1) > best {
          				best = s[i] * (i + 1)
          			}
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun largestSubmatrix(matrix: Array<IntArray>): Int {
              val n = matrix[0].size
              val h = IntArray(n)
              var best = 0
              for (row in matrix) {
                  for (c in 0 until n) h[c] = if (row[c] == 1) h[c] + 1 else 0
                  val s = h.sortedDescending()
                  for (i in 0 until n) best = maxOf(best, s[i] * (i + 1))
              }
              return best
          }
        `,
        swift: code`
          func largestSubmatrix(_ matrix: [[Int]]) -> Int {
              let n = matrix[0].count
              var h = [Int](repeating: 0, count: n)
              var best = 0
              for row in matrix {
                  for c in 0..<n { h[c] = row[c] == 1 ? h[c] + 1 : 0 }
                  let s = h.sorted(by: >)
                  for i in 0..<n { best = max(best, s[i] * (i + 1)) }
              }
              return best
          }
        `,
        rust: code`
          fn largestSubmatrix(matrix: Vec<Vec<i32>>) -> i32 {
              let n = matrix[0].len();
              let mut h = vec![0i32; n];
              let mut best = 0;
              for row in matrix.iter() {
                  for c in 0..n {
                      h[c] = if row[c] == 1 { h[c] + 1 } else { 0 };
                  }
                  let mut s = h.clone();
                  s.sort_by(|a, b| b.cmp(a));
                  for i in 0..n {
                      best = std::cmp::max(best, s[i] * (i as i32 + 1));
                  }
              }
              best
          }
        `,
        php: code`
          function largestSubmatrix($matrix) {
              $n = count($matrix[0]);
              $h = array_fill(0, $n, 0);
              $best = 0;
              foreach ($matrix as $row) {
                  for ($c = 0; $c < $n; $c++) $h[$c] = $row[$c] == 1 ? $h[$c] + 1 : 0;
                  $s = $h;
                  rsort($s);
                  for ($i = 0; $i < $n; $i++) $best = max($best, $s[$i] * ($i + 1));
              }
              return $best;
          }
        `,
        ruby: code`
          def largestSubmatrix(matrix)
            n = matrix[0].length
            h = Array.new(n, 0)
            best = 0
            matrix.each do |row|
              n.times { |c| h[c] = row[c] == 1 ? h[c] + 1 : 0 }
              h.sort.reverse.each_with_index do |v, i|
                best = v * (i + 1) if v * (i + 1) > best
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Sudoku Solver (LC 37) ───────────────────────────────────────
  (() => {
    const popcount = (x: number) => { let k = 0; while (x) { x &= x - 1; k++; } return k; };
    const boxOf = (i: number) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
    /** Number of completions of `cells` (0 = empty), counting no further than `limit`. */
    const countSolutions = (cells0: number[], limit: number) => {
      const cells = cells0.slice();
      const rows = new Array<number>(9).fill(0), cols = new Array<number>(9).fill(0), boxes = new Array<number>(9).fill(0);
      for (let i = 0; i < 81; i++) if (cells[i]) { const bit = 1 << (cells[i] - 1); rows[Math.floor(i / 9)] |= bit; cols[i % 9] |= bit; boxes[boxOf(i)] |= bit; }
      let count = 0;
      const rec = () => {
        let best = -1, bestMask = 0, bestCnt = 10;
        for (let i = 0; i < 81; i++) {
          if (cells[i]) continue;
          const mask = ~(rows[Math.floor(i / 9)] | cols[i % 9] | boxes[boxOf(i)]) & 511;
          const cnt = popcount(mask);
          if (cnt < bestCnt) { best = i; bestMask = mask; bestCnt = cnt; if (cnt <= 1) break; }
        }
        if (best < 0) { count++; return; }
        const r = Math.floor(best / 9), c = best % 9, b = boxOf(best);
        for (let mk = bestMask; mk && count < limit; mk &= mk - 1) {
          const bit = mk & -mk;
          cells[best] = popcount(bit - 1) + 1; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
          rec();
          cells[best] = 0; rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
        }
      };
      rec();
      return count;
    };
    const toRows = (a: number[]) => Array.from({ length: 9 }, (_, r) => a.slice(r * 9, r * 9 + 9).map((v) => (v ? String(v) : ".")).join(""));
    return {
      slug: "sudoku-solver",
      title: "Sudoku Solver",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Backtracking", "Matrix", "Microsoft", "Amazon", "Google", "Uber"],
      signature: { funcName: "solveSudoku", params: [{ name: "board", type: "string[]" as const }], returns: "string[]" as const },
      hiddenCount: 300,
      description: describe(
        "A Sudoku puzzle is given as 9 strings of 9 characters each, where `'1'`–`'9'` are filled cells and `'.'` is an empty cell. Fill every empty cell so that:\n\n- each row contains every digit `1`–`9` exactly once;\n- each column contains every digit `1`–`9` exactly once;\n- each of the nine `3 x 3` boxes contains every digit `1`–`9` exactly once.\n\nThe puzzle is guaranteed to have **exactly one** solution. Return the solved board in the same format (9 strings of 9 digits).",
        [
          { in: "board = [\"7..43.56.\",\"9...65712\",\"....1.93.\",\"1.9..3.8.\",\"3..7.....\",\"...921..5\",\".9.65.87.\",\".5...8.93\",\"8....24..\"]", out: "[\"712439568\",\"934865712\",\"568217934\",\"129543687\",\"345786129\",\"687921345\",\"293654871\",\"456178293\",\"871392456\"]" },
          { in: "board = [\"46...3...\",\"..9...4..\",\"..1.762.9\",\"9..13275.\",\".2..8..4.\",\"7589....3\",\"8..6.73..\",\"..4....75\",\"6.5....1.\"]", out: "[\"467293581\",\"239518467\",\"581476239\",\"946132758\",\"123785946\",\"758964123\",\"812657394\",\"394821675\",\"675349812\"]" },
        ],
        ["board.length == 9", "board[i].length == 9", "board[i][j] is a digit '1'-'9' or '.'", "the puzzle has exactly one solution"]),
      hints: [
        "Keep, for every row, column and box, the set of digits already used — a 9-bit mask each makes checking a digit O(1).",
        "Backtracking: pick an empty cell, try each digit that fits, recurse, and undo on failure.",
        "Always branch on the empty cell with the **fewest** candidates. Cells with one candidate are forced, and a cell with zero candidates means the current branch is dead — this keeps the search tiny.",
      ],
      editorial: explain({
        idea: "Depth-first search over digit placements, with bitmasks for the used digits of every row, column and box, and the \"most constrained cell first\" rule to keep the search tree small.",
        steps: [
          "Read the board into a grid and set bit `d - 1` of `rows[r]`, `cols[c]` and `boxes[3 * (r / 3) + c / 3]` for every given digit `d`.",
          "Find the empty cell whose candidate mask `~(rows | cols | boxes) & 0x1FF` has the fewest bits. If no cell is empty, the board is solved; if some cell has no candidates, backtrack.",
          "For each candidate bit of that cell: place the digit (set the three masks), recurse, and if the recursion fails, clear the digit and the masks.",
          "Return the filled board as 9 strings.",
        ],
        why: "The masks always describe exactly the digits used in each unit, so a candidate never breaks a rule, and the search tries every candidate for the chosen cell, so it cannot miss the solution. Choosing the cell with the fewest options makes forced moves happen immediately and detects contradictions early; for puzzles with a unique solution that usually means very little backtracking.",
        time: "Exponential in the worst case; a few hundred nodes for typical puzzles",
        space: "O(81) for the board and the recursion",
        pitfalls: [
          "The box index is `3 * (r / 3) + c / 3` with integer division.",
          "Undo all three masks and the cell when backtracking, or later branches see phantom digits.",
          "Scanning cells in fixed order without the fewest-candidates rule can explode on hard puzzles.",
        ],
      }),
      examples: [
        { input: '["7..43.56.","9...65712","....1.93.","1.9..3.8.","3..7.....","...921..5",".9.65.87.",".5...8.93","8....24.."]', expectedOutput: '["712439568","934865712","568217934","129543687","345786129","687921345","293654871","456178293","871392456"]' },
        { input: '["46...3...","..9...4..","..1.762.9","9..13275.",".2..8..4.","7589....3","8..6.73..","..4....75","6.5....1."]', expectedOutput: '["467293581","239518467","581476239","946132758","123785946","758964123","812657394","394821675","675349812"]' },
      ],
      gen: (rng: Rng) => {
        // a random full grid: the classic pattern with shuffled bands, rows, stacks, columns and digits
        const order = () => shuffle(rng, [0, 1, 2]).flatMap((g) => shuffle(rng, [0, 1, 2]).map((x) => g * 3 + x));
        const ro = order(), co = order();
        const digits = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        let full: number[] = [];
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) full.push(digits[(3 * (ro[r] % 3) + Math.floor(ro[r] / 3) + co[c]) % 9]);
        if (rng() < 0.5) full = full.map((_, i) => full[(i % 9) * 9 + Math.floor(i / 9)]);
        // dig holes in random order, keeping only removals that leave the solution unique
        const cells = full.slice();
        const target = ri(rng, 30, 56);
        let blanks = 0;
        for (const i of shuffle(rng, Array.from({ length: 81 }, (_, k) => k))) {
          if (blanks >= target) break;
          const v = cells[i];
          cells[i] = 0;
          if (countSolutions(cells, 2) === 1) blanks++; else cells[i] = v;
        }
        return { input: fmtStrArr(toRows(cells)), expectedOutput: fmtStrArr(toRows(full)) };
      },
      solutions: {
        python: code`
          from typing import List

          def solveSudoku(board: List[str]) -> List[str]:
              cells = [0] * 81
              rows = [0] * 9
              cols = [0] * 9
              boxes = [0] * 9
              box_of = [(i // 27) * 3 + (i % 9) // 3 for i in range(81)]
              for i in range(81):
                  ch = board[i // 9][i % 9]
                  if ch != '.':
                      v = ord(ch) - 48
                      cells[i] = v
                      bit = 1 << (v - 1)
                      rows[i // 9] |= bit
                      cols[i % 9] |= bit
                      boxes[box_of[i]] |= bit

              def solve():
                  best, best_mask, best_cnt = -1, 0, 10
                  for i in range(81):
                      if cells[i]:
                          continue
                      mask = ~(rows[i // 9] | cols[i % 9] | boxes[box_of[i]]) & 511
                      cnt = bin(mask).count('1')
                      if cnt < best_cnt:
                          best, best_mask, best_cnt = i, mask, cnt
                          if cnt <= 1:
                              break
                  if best < 0:
                      return True
                  r, c, b = best // 9, best % 9, box_of[best]
                  m = best_mask
                  while m:
                      bit = m & -m
                      m ^= bit
                      cells[best] = bit.bit_length()
                      rows[r] |= bit
                      cols[c] |= bit
                      boxes[b] |= bit
                      if solve():
                          return True
                      cells[best] = 0
                      rows[r] ^= bit
                      cols[c] ^= bit
                      boxes[b] ^= bit
                  return False

              solve()
              return [''.join(str(cells[r * 9 + c]) for c in range(9)) for r in range(9)]
        `,
        javascript: code`
          var solveSudoku = function(board) {
              var cells = [], rows = [], cols = [], boxes = [], i;
              for (i = 0; i < 9; i++) { rows.push(0); cols.push(0); boxes.push(0); }
              var boxOf = function(k) { return Math.floor(k / 27) * 3 + Math.floor((k % 9) / 3); };
              var bitCount = function(x) { var k = 0; while (x) { x &= x - 1; k++; } return k; };
              for (i = 0; i < 81; i++) {
                  var ch = board[Math.floor(i / 9)][i % 9];
                  var v = ch === '.' ? 0 : ch.charCodeAt(0) - 48;
                  cells.push(v);
                  if (v) {
                      var bit = 1 << (v - 1);
                      rows[Math.floor(i / 9)] |= bit; cols[i % 9] |= bit; boxes[boxOf(i)] |= bit;
                  }
              }
              var solve = function() {
                  var best = -1, bestMask = 0, bestCnt = 10;
                  for (var k = 0; k < 81; k++) {
                      if (cells[k]) continue;
                      var mask = ~(rows[Math.floor(k / 9)] | cols[k % 9] | boxes[boxOf(k)]) & 511;
                      var cnt = bitCount(mask);
                      if (cnt < bestCnt) { best = k; bestMask = mask; bestCnt = cnt; if (cnt <= 1) break; }
                  }
                  if (best < 0) return true;
                  var r = Math.floor(best / 9), c = best % 9, b = boxOf(best);
                  for (var m = bestMask; m; m &= m - 1) {
                      var low = m & -m;
                      cells[best] = bitCount(low - 1) + 1;
                      rows[r] |= low; cols[c] |= low; boxes[b] |= low;
                      if (solve()) return true;
                      cells[best] = 0;
                      rows[r] ^= low; cols[c] ^= low; boxes[b] ^= low;
                  }
                  return false;
              };
              solve();
              var out = [];
              for (var r2 = 0; r2 < 9; r2++) out.push(cells.slice(r2 * 9, r2 * 9 + 9).join(''));
              return out;
          };
        `,
        typescript: code`
          function solveSudoku(board: string[]): string[] {
              var cells: number[] = [], rows: number[] = [], cols: number[] = [], boxes: number[] = [], i: number;
              for (i = 0; i < 9; i++) { rows.push(0); cols.push(0); boxes.push(0); }
              var boxOf = function(k: number): number { return Math.floor(k / 27) * 3 + Math.floor((k % 9) / 3); };
              var bitCount = function(x: number): number { var k = 0; while (x) { x &= x - 1; k++; } return k; };
              for (i = 0; i < 81; i++) {
                  var ch = board[Math.floor(i / 9)].charAt(i % 9);
                  var v = ch === '.' ? 0 : ch.charCodeAt(0) - 48;
                  cells.push(v);
                  if (v) {
                      var bit = 1 << (v - 1);
                      rows[Math.floor(i / 9)] |= bit; cols[i % 9] |= bit; boxes[boxOf(i)] |= bit;
                  }
              }
              var solve = function(): boolean {
                  var best = -1, bestMask = 0, bestCnt = 10;
                  for (var k = 0; k < 81; k++) {
                      if (cells[k]) continue;
                      var mask = ~(rows[Math.floor(k / 9)] | cols[k % 9] | boxes[boxOf(k)]) & 511;
                      var cnt = bitCount(mask);
                      if (cnt < bestCnt) { best = k; bestMask = mask; bestCnt = cnt; if (cnt <= 1) break; }
                  }
                  if (best < 0) return true;
                  var r = Math.floor(best / 9), c = best % 9, b = boxOf(best);
                  for (var m = bestMask; m; m &= m - 1) {
                      var low = m & -m;
                      cells[best] = bitCount(low - 1) + 1;
                      rows[r] |= low; cols[c] |= low; boxes[b] |= low;
                      if (solve()) return true;
                      cells[best] = 0;
                      rows[r] ^= low; cols[c] ^= low; boxes[b] ^= low;
                  }
                  return false;
              };
              solve();
              var out: string[] = [];
              for (var r2 = 0; r2 < 9; r2++) out.push(cells.slice(r2 * 9, r2 * 9 + 9).join(''));
              return out;
          }
        `,
        java: code`
          public static String[] solveSudoku(String[] board) {
              int[] cells = new int[81], rows = new int[9], cols = new int[9], boxes = new int[9];
              for (int i = 0; i < 81; i++) {
                  char ch = board[i / 9].charAt(i % 9);
                  if (ch == '.') continue;
                  int v = ch - '0', bit = 1 << (v - 1);
                  cells[i] = v;
                  rows[i / 9] |= bit;
                  cols[i % 9] |= bit;
                  boxes[(i / 27) * 3 + (i % 9) / 3] |= bit;
              }
              sudokuSearch(cells, rows, cols, boxes);
              String[] out = new String[9];
              for (int r = 0; r < 9; r++) {
                  StringBuilder sb = new StringBuilder();
                  for (int c = 0; c < 9; c++) sb.append(cells[r * 9 + c]);
                  out[r] = sb.toString();
              }
              return out;
          }

          private static boolean sudokuSearch(int[] cells, int[] rows, int[] cols, int[] boxes) {
              int best = -1, bestMask = 0, bestCnt = 10;
              for (int i = 0; i < 81; i++) {
                  if (cells[i] != 0) continue;
                  int mask = ~(rows[i / 9] | cols[i % 9] | boxes[(i / 27) * 3 + (i % 9) / 3]) & 511;
                  int cnt = Integer.bitCount(mask);
                  if (cnt < bestCnt) { best = i; bestMask = mask; bestCnt = cnt; if (cnt <= 1) break; }
              }
              if (best < 0) return true;
              int r = best / 9, c = best % 9, b = (best / 27) * 3 + c / 3;
              for (int m = bestMask; m != 0; m &= m - 1) {
                  int bit = m & -m;
                  cells[best] = Integer.numberOfTrailingZeros(bit) + 1;
                  rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
                  if (sudokuSearch(cells, rows, cols, boxes)) return true;
                  cells[best] = 0;
                  rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
              }
              return false;
          }
        `,
        cpp: code`
          static bool sudokuSearch(int* cells, int* rows, int* cols, int* boxes) {
              int best = -1, bestMask = 0, bestCnt = 10;
              for (int i = 0; i < 81; i++) {
                  if (cells[i]) continue;
                  int mask = ~(rows[i / 9] | cols[i % 9] | boxes[(i / 27) * 3 + (i % 9) / 3]) & 511;
                  int cnt = __builtin_popcount(mask);
                  if (cnt < bestCnt) { best = i; bestMask = mask; bestCnt = cnt; if (cnt <= 1) break; }
              }
              if (best < 0) return true;
              int r = best / 9, c = best % 9, b = (best / 27) * 3 + c / 3;
              for (int m = bestMask; m; m &= m - 1) {
                  int bit = m & -m;
                  cells[best] = __builtin_ctz(bit) + 1;
                  rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
                  if (sudokuSearch(cells, rows, cols, boxes)) return true;
                  cells[best] = 0;
                  rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
              }
              return false;
          }

          vector<string> solveSudoku(vector<string>& board) {
              int cells[81] = {0}, rows[9] = {0}, cols[9] = {0}, boxes[9] = {0};
              for (int i = 0; i < 81; i++) {
                  char ch = board[i / 9][i % 9];
                  if (ch == '.') continue;
                  int v = ch - '0', bit = 1 << (v - 1);
                  cells[i] = v;
                  rows[i / 9] |= bit;
                  cols[i % 9] |= bit;
                  boxes[(i / 27) * 3 + (i % 9) / 3] |= bit;
              }
              sudokuSearch(cells, rows, cols, boxes);
              vector<string> out(9, string(9, '0'));
              for (int i = 0; i < 81; i++) out[i / 9][i % 9] = (char)('0' + cells[i]);
              return out;
          }
        `,
        c: code`
          static int sudokuBits(int x) {
              int k = 0;
              while (x) { x &= x - 1; k++; }
              return k;
          }

          static bool sudokuSearch(int* cells, int* rows, int* cols, int* boxes) {
              int best = -1, bestMask = 0, bestCnt = 10;
              for (int i = 0; i < 81; i++) {
                  if (cells[i]) continue;
                  int mask = ~(rows[i / 9] | cols[i % 9] | boxes[(i / 27) * 3 + (i % 9) / 3]) & 511;
                  int cnt = sudokuBits(mask);
                  if (cnt < bestCnt) { best = i; bestMask = mask; bestCnt = cnt; if (cnt <= 1) break; }
              }
              if (best < 0) return true;
              int r = best / 9, c = best % 9, b = (best / 27) * 3 + c / 3;
              for (int m = bestMask; m; m &= m - 1) {
                  int bit = m & -m;
                  cells[best] = sudokuBits(bit - 1) + 1;
                  rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
                  if (sudokuSearch(cells, rows, cols, boxes)) return true;
                  cells[best] = 0;
                  rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
              }
              return false;
          }

          char** solveSudoku(char** board, int boardSize, int* returnSize) {
              int cells[81] = {0}, rows[9] = {0}, cols[9] = {0}, boxes[9] = {0};
              for (int i = 0; i < 81; i++) {
                  char ch = board[i / 9][i % 9];
                  if (ch == '.') continue;
                  int v = ch - '0', bit = 1 << (v - 1);
                  cells[i] = v;
                  rows[i / 9] |= bit;
                  cols[i % 9] |= bit;
                  boxes[(i / 27) * 3 + (i % 9) / 3] |= bit;
              }
              sudokuSearch(cells, rows, cols, boxes);
              char** out = (char**)malloc(9 * sizeof(char*));
              for (int r = 0; r < 9; r++) {
                  out[r] = (char*)malloc(10);
                  for (int c = 0; c < 9; c++) out[r][c] = (char)('0' + cells[r * 9 + c]);
                  out[r][9] = '\0';
              }
              *returnSize = 9;
              return out;
          }
        `,
        csharp: code`
          public static string[] SolveSudoku(string[] board)
          {
              int[] cells = new int[81], rows = new int[9], cols = new int[9], boxes = new int[9];
              for (int i = 0; i < 81; i++)
              {
                  char ch = board[i / 9][i % 9];
                  if (ch == '.') continue;
                  int v = ch - '0', bit = 1 << (v - 1);
                  cells[i] = v;
                  rows[i / 9] |= bit;
                  cols[i % 9] |= bit;
                  boxes[(i / 27) * 3 + (i % 9) / 3] |= bit;
              }
              SudokuSearch(cells, rows, cols, boxes);
              var result = new string[9];
              for (int r = 0; r < 9; r++)
              {
                  var sb = new System.Text.StringBuilder();
                  for (int c = 0; c < 9; c++) sb.Append(cells[r * 9 + c]);
                  result[r] = sb.ToString();
              }
              return result;
          }

          private static int SudokuBits(int x)
          {
              int k = 0;
              while (x != 0) { x &= x - 1; k++; }
              return k;
          }

          private static bool SudokuSearch(int[] cells, int[] rows, int[] cols, int[] boxes)
          {
              int best = -1, bestMask = 0, bestCnt = 10;
              for (int i = 0; i < 81; i++)
              {
                  if (cells[i] != 0) continue;
                  int mask = ~(rows[i / 9] | cols[i % 9] | boxes[(i / 27) * 3 + (i % 9) / 3]) & 511;
                  int cnt = SudokuBits(mask);
                  if (cnt < bestCnt) { best = i; bestMask = mask; bestCnt = cnt; if (cnt <= 1) break; }
              }
              if (best < 0) return true;
              int r = best / 9, c = best % 9, b = (best / 27) * 3 + c / 3;
              for (int m = bestMask; m != 0; m &= m - 1)
              {
                  int bit = m & -m;
                  cells[best] = SudokuBits(bit - 1) + 1;
                  rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
                  if (SudokuSearch(cells, rows, cols, boxes)) return true;
                  cells[best] = 0;
                  rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
              }
              return false;
          }
        `,
        go: code`
          func solveSudoku(board []string) []string {
          	cells := make([]int, 81)
          	rows := make([]int, 9)
          	cols := make([]int, 9)
          	boxes := make([]int, 9)
          	boxOf := func(i int) int { return (i/27)*3 + (i%9)/3 }
          	for i := 0; i < 81; i++ {
          		ch := board[i/9][i%9]
          		if ch == '.' {
          			continue
          		}
          		v := int(ch - '0')
          		bit := 1 << uint(v-1)
          		cells[i] = v
          		rows[i/9] |= bit
          		cols[i%9] |= bit
          		boxes[boxOf(i)] |= bit
          	}
          	var solve func() bool
          	solve = func() bool {
          		best, bestMask, bestCnt := -1, 0, 10
          		for i := 0; i < 81; i++ {
          			if cells[i] != 0 {
          				continue
          			}
          			mask := ^(rows[i/9] | cols[i%9] | boxes[boxOf(i)]) & 511
          			cnt := bits.OnesCount(uint(mask))
          			if cnt < bestCnt {
          				best, bestMask, bestCnt = i, mask, cnt
          				if cnt <= 1 {
          					break
          				}
          			}
          		}
          		if best < 0 {
          			return true
          		}
          		r, c, b := best/9, best%9, boxOf(best)
          		for m := bestMask; m != 0; m &= m - 1 {
          			bit := m & -m
          			cells[best] = bits.TrailingZeros(uint(bit)) + 1
          			rows[r] |= bit
          			cols[c] |= bit
          			boxes[b] |= bit
          			if solve() {
          				return true
          			}
          			cells[best] = 0
          			rows[r] ^= bit
          			cols[c] ^= bit
          			boxes[b] ^= bit
          		}
          		return false
          	}
          	solve()
          	out := make([]string, 9)
          	for r := 0; r < 9; r++ {
          		buf := make([]byte, 9)
          		for c := 0; c < 9; c++ {
          			buf[c] = byte('0' + cells[r*9+c])
          		}
          		out[r] = string(buf)
          	}
          	return out
          }
        `,
        kotlin: code`
          fun solveSudoku(board: Array<String>): Array<String> {
              val cells = IntArray(81)
              val rows = IntArray(9)
              val cols = IntArray(9)
              val boxes = IntArray(9)
              fun boxOf(i: Int) = (i / 27) * 3 + (i % 9) / 3
              for (i in 0 until 81) {
                  val ch = board[i / 9][i % 9]
                  if (ch == '.') continue
                  val v = ch - '0'
                  val bit = 1 shl (v - 1)
                  cells[i] = v
                  rows[i / 9] = rows[i / 9] or bit
                  cols[i % 9] = cols[i % 9] or bit
                  boxes[boxOf(i)] = boxes[boxOf(i)] or bit
              }
              fun solve(): Boolean {
                  var best = -1
                  var bestMask = 0
                  var bestCnt = 10
                  for (i in 0 until 81) {
                      if (cells[i] != 0) continue
                      val mask = (rows[i / 9] or cols[i % 9] or boxes[boxOf(i)]).inv() and 511
                      val cnt = Integer.bitCount(mask)
                      if (cnt < bestCnt) {
                          best = i; bestMask = mask; bestCnt = cnt
                          if (cnt <= 1) break
                      }
                  }
                  if (best < 0) return true
                  val r = best / 9
                  val c = best % 9
                  val b = boxOf(best)
                  var m = bestMask
                  while (m != 0) {
                      val bit = m and -m
                      m = m and (m - 1)
                      cells[best] = Integer.numberOfTrailingZeros(bit) + 1
                      rows[r] = rows[r] or bit; cols[c] = cols[c] or bit; boxes[b] = boxes[b] or bit
                      if (solve()) return true
                      cells[best] = 0
                      rows[r] = rows[r] xor bit; cols[c] = cols[c] xor bit; boxes[b] = boxes[b] xor bit
                  }
                  return false
              }
              solve()
              return Array(9) { r -> (0 until 9).joinToString("") { c -> cells[r * 9 + c].toString() } }
          }
        `,
        swift: code`
          func solveSudoku(_ board: [String]) -> [String] {
              let g = board.map { Array($0.utf8) }
              var cells = [Int](repeating: 0, count: 81)
              var rows = [Int](repeating: 0, count: 9)
              var cols = [Int](repeating: 0, count: 9)
              var boxes = [Int](repeating: 0, count: 9)
              func boxOf(_ i: Int) -> Int { return (i / 27) * 3 + (i % 9) / 3 }
              for i in 0..<81 {
                  let ch = Int(g[i / 9][i % 9])
                  if ch == 46 { continue }
                  let v = ch - 48, bit = 1 << (v - 1)
                  cells[i] = v
                  rows[i / 9] |= bit
                  cols[i % 9] |= bit
                  boxes[boxOf(i)] |= bit
              }
              func solve() -> Bool {
                  var best = -1, bestMask = 0, bestCnt = 10
                  for i in 0..<81 {
                      if cells[i] != 0 { continue }
                      let mask = ~(rows[i / 9] | cols[i % 9] | boxes[boxOf(i)]) & 511
                      let cnt = mask.nonzeroBitCount
                      if cnt < bestCnt {
                          best = i; bestMask = mask; bestCnt = cnt
                          if cnt <= 1 { break }
                      }
                  }
                  if best < 0 { return true }
                  let r = best / 9, c = best % 9, b = boxOf(best)
                  var m = bestMask
                  while m != 0 {
                      let bit = m & -m
                      m &= m - 1
                      cells[best] = bit.trailingZeroBitCount + 1
                      rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit
                      if solve() { return true }
                      cells[best] = 0
                      rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit
                  }
                  return false
              }
              _ = solve()
              var out = [String]()
              for r in 0..<9 {
                  var s = ""
                  for c in 0..<9 { s += String(cells[r * 9 + c]) }
                  out.append(s)
              }
              return out
          }
        `,
        rust: code`
          fn sudoku_search(cells: &mut [u32; 81], rows: &mut [u32; 9], cols: &mut [u32; 9], boxes: &mut [u32; 9]) -> bool {
              let mut best = 81usize;
              let mut best_mask = 0u32;
              let mut best_cnt = 10u32;
              for i in 0..81 {
                  if cells[i] != 0 {
                      continue;
                  }
                  let mask = !(rows[i / 9] | cols[i % 9] | boxes[(i / 27) * 3 + (i % 9) / 3]) & 511;
                  let cnt = mask.count_ones();
                  if cnt < best_cnt {
                      best = i;
                      best_mask = mask;
                      best_cnt = cnt;
                      if cnt <= 1 {
                          break;
                      }
                  }
              }
              if best == 81 {
                  return true;
              }
              let (r, c) = (best / 9, best % 9);
              let b = (best / 27) * 3 + c / 3;
              let mut m = best_mask;
              while m != 0 {
                  let bit = m & m.wrapping_neg();
                  m &= m - 1;
                  cells[best] = bit.trailing_zeros() + 1;
                  rows[r] |= bit;
                  cols[c] |= bit;
                  boxes[b] |= bit;
                  if sudoku_search(cells, rows, cols, boxes) {
                      return true;
                  }
                  cells[best] = 0;
                  rows[r] ^= bit;
                  cols[c] ^= bit;
                  boxes[b] ^= bit;
              }
              false
          }

          fn solveSudoku(board: Vec<String>) -> Vec<String> {
              let mut cells = [0u32; 81];
              let mut rows = [0u32; 9];
              let mut cols = [0u32; 9];
              let mut boxes = [0u32; 9];
              for i in 0..81 {
                  let ch = board[i / 9].as_bytes()[i % 9];
                  if ch == b'.' {
                      continue;
                  }
                  let v = (ch - b'0') as u32;
                  let bit = 1u32 << (v - 1);
                  cells[i] = v;
                  rows[i / 9] |= bit;
                  cols[i % 9] |= bit;
                  boxes[(i / 27) * 3 + (i % 9) / 3] |= bit;
              }
              sudoku_search(&mut cells, &mut rows, &mut cols, &mut boxes);
              (0..9)
                  .map(|r| (0..9).map(|c| std::char::from_digit(cells[r * 9 + c], 10).unwrap()).collect::<String>())
                  .collect()
          }
        `,
        php: code`
          function sudokuBits($x) {
              $k = 0;
              while ($x) { $x &= $x - 1; $k++; }
              return $k;
          }

          function sudokuSearch(&$cells, &$rows, &$cols, &$boxes) {
              $best = -1;
              $bestMask = 0;
              $bestCnt = 10;
              for ($i = 0; $i < 81; $i++) {
                  if ($cells[$i]) continue;
                  $mask = ~($rows[intdiv($i, 9)] | $cols[$i % 9] | $boxes[intdiv($i, 27) * 3 + intdiv($i % 9, 3)]) & 511;
                  $cnt = sudokuBits($mask);
                  if ($cnt < $bestCnt) {
                      $best = $i; $bestMask = $mask; $bestCnt = $cnt;
                      if ($cnt <= 1) break;
                  }
              }
              if ($best < 0) return true;
              $r = intdiv($best, 9);
              $c = $best % 9;
              $b = intdiv($best, 27) * 3 + intdiv($c, 3);
              for ($m = $bestMask; $m; $m &= $m - 1) {
                  $bit = $m & -$m;
                  $cells[$best] = sudokuBits($bit - 1) + 1;
                  $rows[$r] |= $bit; $cols[$c] |= $bit; $boxes[$b] |= $bit;
                  if (sudokuSearch($cells, $rows, $cols, $boxes)) return true;
                  $cells[$best] = 0;
                  $rows[$r] ^= $bit; $cols[$c] ^= $bit; $boxes[$b] ^= $bit;
              }
              return false;
          }

          function solveSudoku($board) {
              $cells = array_fill(0, 81, 0);
              $rows = array_fill(0, 9, 0);
              $cols = array_fill(0, 9, 0);
              $boxes = array_fill(0, 9, 0);
              for ($i = 0; $i < 81; $i++) {
                  $ch = $board[intdiv($i, 9)][$i % 9];
                  if ($ch === '.') continue;
                  $v = ord($ch) - 48;
                  $bit = 1 << ($v - 1);
                  $cells[$i] = $v;
                  $rows[intdiv($i, 9)] |= $bit;
                  $cols[$i % 9] |= $bit;
                  $boxes[intdiv($i, 27) * 3 + intdiv($i % 9, 3)] |= $bit;
              }
              sudokuSearch($cells, $rows, $cols, $boxes);
              $out = [];
              for ($r = 0; $r < 9; $r++) $out[] = implode('', array_slice($cells, $r * 9, 9));
              return $out;
          }
        `,
        ruby: code`
          def solveSudoku(board)
            cells = Array.new(81, 0)
            rows = Array.new(9, 0)
            cols = Array.new(9, 0)
            boxes = Array.new(9, 0)
            box_of = (0...81).map { |i| (i / 27) * 3 + (i % 9) / 3 }
            81.times do |i|
              ch = board[i / 9][i % 9]
              next if ch == '.'
              v = ch.ord - 48
              bit = 1 << (v - 1)
              cells[i] = v
              rows[i / 9] |= bit
              cols[i % 9] |= bit
              boxes[box_of[i]] |= bit
            end
            solve = lambda do
              best = -1
              best_mask = 0
              best_cnt = 10
              81.times do |i|
                next if cells[i] != 0
                mask = ~(rows[i / 9] | cols[i % 9] | boxes[box_of[i]]) & 511
                cnt = mask.to_s(2).count('1')
                if cnt < best_cnt
                  best = i
                  best_mask = mask
                  best_cnt = cnt
                  break if cnt <= 1
                end
              end
              return true if best < 0
              r = best / 9
              c = best % 9
              b = box_of[best]
              m = best_mask
              while m != 0
                bit = m & -m
                m &= m - 1
                cells[best] = bit.bit_length
                rows[r] |= bit
                cols[c] |= bit
                boxes[b] |= bit
                return true if solve.call
                cells[best] = 0
                rows[r] ^= bit
                cols[c] ^= bit
                boxes[b] ^= bit
              end
              false
            end
            solve.call
            (0...9).map { |r| cells[r * 9, 9].join }
          end
        `,
      },
    };
  })(),

  // ── Word Search II (LC 212) ─────────────────────────────────────
  (() => {
    const exists = (board: string[], word: string) => {
      const m = board.length, n = board[0].length;
      const used = Array.from({ length: m }, () => new Array<boolean>(n).fill(false));
      const dfs = (r: number, c: number, i: number): boolean => {
        if (r < 0 || c < 0 || r >= m || c >= n || used[r][c] || board[r][c] !== word[i]) return false;
        if (i === word.length - 1) return true;
        used[r][c] = true;
        const ok = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
        used[r][c] = false;
        return ok;
      };
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (dfs(r, c, 0)) return true;
      return false;
    };
    const ref = (board: string[], words: string[]) => words.filter((w) => exists(board, w)).sort();
    return {
      slug: "word-search-ii",
      title: "Word Search II",
      difficulty: "HARD" as const,
      tags: ["String", "Backtracking", "Trie", "Matrix", "Amazon", "Microsoft", "Google", "Uber"],
      signature: { funcName: "findWords", params: [{ name: "board", type: "string[]" as const }, { name: "words", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "`board` is an `m x n` grid of lowercase letters given as `m` strings, and `words` is a list of **distinct** lowercase words.\n\nA word can be **formed** on the board if its letters can be read along a path of cells where each step moves to a horizontally or vertically adjacent cell, and no cell is used more than once in that word.\n\nReturn every word of `words` that can be formed, sorted in ascending lexicographic order.",
        [
          { in: "board = [\"code\",\"tarx\",\"kibo\"], words = [\"cod\",\"dex\",\"bra\",\"kit\",\"tack\",\"oar\",\"box\"]", out: "[\"box\",\"bra\",\"cod\",\"dex\",\"oar\"]", note: "`kit` fails because no `t` touches the `i`, and `tack` because no `c` touches the `a`." },
          { in: "board = [\"ab\",\"cd\"], words = [\"abdc\",\"abcd\",\"acdb\"]", out: "[\"abdc\",\"acdb\"]", note: "`abcd` would need `b` next to `c`, but they touch only diagonally." },
          { in: "board = [\"a\"], words = [\"aa\"]", out: "[]", note: "A cell cannot be used twice in one word." },
        ],
        ["m == board.length", "n == board[i].length", "1 <= m, n <= 12", "board[i] consists of lowercase English letters", "1 <= words.length <= 3 * 10^4", "1 <= words[i].length <= 10", "words[i] consists of lowercase English letters", "all the strings of words are unique"]),
      hints: [
        "Searching the board once per word repeats the same work for words that share a prefix.",
        "Put all the words in a trie. Then a single DFS from each cell can follow the trie and the board together.",
        "During the DFS, stop as soon as the current path is not a prefix of any word; when you reach a node that ends a word, record it and clear the marker so it is reported once.",
      ],
      editorial: explain({
        idea: "Walk the board and a trie of the words in lockstep: the trie tells the DFS which next letters can still lead to a word, so hopeless paths are abandoned immediately.",
        steps: [
          "Insert every word into a trie; store the word (or its index) at the node where it ends.",
          "From every cell, start a DFS with the trie root. At cell `(r, c)` move to the child for its letter; if there is none, return.",
          "If that child ends a word, add the word to the answer and clear the marker (so it is not added twice).",
          "Mark the cell as used, recurse into the four neighbours with the child node, then unmark it.",
          "Sort the answer.",
        ],
        why: "A word is found exactly when some path of distinct adjacent cells spells it, and the DFS explores every such path whose letters stay inside the trie — any path leaving the trie cannot be a prefix of a word, so pruning it loses nothing. Clearing the end marker reports each word once even if it can be formed in several ways.",
        time: "O(m · n · 4 · 3^(L-1)) in the worst case, L = the longest word length",
        space: "O(total length of the words) for the trie",
        pitfalls: [
          "A cell may be reused across different words, but not within one word — unmark it when backtracking.",
          "Without clearing the end marker, a word that can be formed along two paths is reported twice.",
          "The answer must be sorted; the DFS finds words in board order.",
        ],
      }),
      examples: [
        { input: '["code","tarx","kibo"]\n["cod","dex","bra","kit","tack","oar","box"]', expectedOutput: '["box","bra","cod","dex","oar"]' },
        { input: '["ab","cd"]\n["abdc","abcd","acdb"]', expectedOutput: '["abdc","acdb"]' },
        { input: '["a"]\n["aa"]', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 3, 4]));
        const n = ri(rng, 1, pick(rng, [2, 3, 4]));
        const alpha = pick(rng, ["ab", "abc", "abcde", "aeiorst", "abcdefghijklmnopqrstuvwxyz"]);
        const board = Array.from({ length: m }, () => Array.from({ length: n }, () => alpha[ri(rng, 0, alpha.length - 1)]).join(""));
        const want = ri(rng, 1, pick(rng, [3, 6, 9]));
        const words: string[] = [];
        const seen = new Set<string>();
        for (let t = 0; t < want * 3 && words.length < want; t++) {
          let w = "";
          const len = ri(rng, 1, 6);
          if (rng() < 0.55) {
            // a random self-avoiding walk on the board, so many words really are there
            let r = ri(rng, 0, m - 1), c = ri(rng, 0, n - 1);
            const used = new Set<number>([r * n + c]);
            w = board[r][c];
            while (w.length < len) {
              const opts = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < m && b < n && !used.has(a * n + b));
              if (!opts.length) break;
              [r, c] = pick(rng, opts);
              used.add(r * n + c);
              w += board[r][c];
            }
            if (rng() < 0.2) w = w.slice(0, -1) + alpha[ri(rng, 0, alpha.length - 1)];
          } else {
            for (let i = 0; i < len; i++) w += alpha[ri(rng, 0, alpha.length - 1)];
          }
          if (w && !seen.has(w)) { seen.add(w); words.push(w); }
        }
        return { input: `${fmtStrArr(board)}\n${fmtStrArr(words)}`, expectedOutput: fmtStrArr(ref(board, words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findWords(board: List[str], words: List[str]) -> List[str]:
              m, n = len(board), len(board[0])
              g = [list(row) for row in board]
              root = {}
              for w in words:
                  node = root
                  for ch in w:
                      node = node.setdefault(ch, {})
                  node['$'] = w
              found = []

              def dfs(r, c, parent):
                  ch = g[r][c]
                  node = parent.get(ch)
                  if node is None:
                      return
                  if '$' in node:
                      found.append(node.pop('$'))
                  g[r][c] = '#'
                  if r > 0:
                      dfs(r - 1, c, node)
                  if r + 1 < m:
                      dfs(r + 1, c, node)
                  if c > 0:
                      dfs(r, c - 1, node)
                  if c + 1 < n:
                      dfs(r, c + 1, node)
                  g[r][c] = ch

              for r in range(m):
                  for c in range(n):
                      dfs(r, c, root)
              return sorted(found)
        `,
        javascript: code`
          var findWords = function(board, words) {
              var m = board.length, n = board[0].length;
              var g = board.map(function(row) { return row.split(''); });
              var next = [new Array(26).fill(0)], end = [-1];
              for (var w = 0; w < words.length; w++) {
                  var node = 0;
                  for (var i = 0; i < words[w].length; i++) {
                      var ch = words[w].charCodeAt(i) - 97;
                      if (!next[node][ch]) { next.push(new Array(26).fill(0)); end.push(-1); next[node][ch] = next.length - 1; }
                      node = next[node][ch];
                  }
                  end[node] = w;
              }
              var found = [];
              var dfs = function(r, c, parent) {
                  var letter = g[r][c];
                  if (letter === '#') return;
                  var cur = next[parent][letter.charCodeAt(0) - 97];
                  if (!cur) return;
                  if (end[cur] >= 0) { found.push(words[end[cur]]); end[cur] = -1; }
                  g[r][c] = '#';
                  if (r > 0) dfs(r - 1, c, cur);
                  if (r + 1 < m) dfs(r + 1, c, cur);
                  if (c > 0) dfs(r, c - 1, cur);
                  if (c + 1 < n) dfs(r, c + 1, cur);
                  g[r][c] = letter;
              };
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) dfs(r, c, 0);
              found.sort();
              return found;
          };
        `,
        typescript: code`
          function findWords(board: string[], words: string[]): string[] {
              var m = board.length, n = board[0].length;
              var g: string[][] = [];
              for (var r0 = 0; r0 < m; r0++) g.push(board[r0].split(''));
              var newNode = function(): number[] { var a: number[] = []; for (var t = 0; t < 26; t++) a.push(0); return a; };
              var next: number[][] = [newNode()], end: number[] = [-1];
              for (var w = 0; w < words.length; w++) {
                  var node = 0;
                  for (var i = 0; i < words[w].length; i++) {
                      var ch = words[w].charCodeAt(i) - 97;
                      if (!next[node][ch]) { next.push(newNode()); end.push(-1); next[node][ch] = next.length - 1; }
                      node = next[node][ch];
                  }
                  end[node] = w;
              }
              var found: string[] = [];
              var dfs = function(r: number, c: number, parent: number): void {
                  var letter = g[r][c];
                  if (letter === '#') return;
                  var cur = next[parent][letter.charCodeAt(0) - 97];
                  if (!cur) return;
                  if (end[cur] >= 0) { found.push(words[end[cur]]); end[cur] = -1; }
                  g[r][c] = '#';
                  if (r > 0) dfs(r - 1, c, cur);
                  if (r + 1 < m) dfs(r + 1, c, cur);
                  if (c > 0) dfs(r, c - 1, cur);
                  if (c + 1 < n) dfs(r, c + 1, cur);
                  g[r][c] = letter;
              };
              for (var r = 0; r < m; r++) for (var c = 0; c < n; c++) dfs(r, c, 0);
              found.sort();
              return found;
          }
        `,
        java: code`
          public static String[] findWords(String[] board, String[] words) {
              int m = board.length, n = board[0].length();
              char[][] g = new char[m][];
              for (int i = 0; i < m; i++) g[i] = board[i].toCharArray();
              List<int[]> next = new ArrayList<>();
              List<Integer> end = new ArrayList<>();
              next.add(new int[26]);
              end.add(-1);
              for (int w = 0; w < words.length; w++) {
                  int node = 0;
                  for (char ch : words[w].toCharArray()) {
                      int k = ch - 'a';
                      if (next.get(node)[k] == 0) {
                          next.add(new int[26]);
                          end.add(-1);
                          next.get(node)[k] = next.size() - 1;
                      }
                      node = next.get(node)[k];
                  }
                  end.set(node, w);
              }
              List<String> found = new ArrayList<>();
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++) wordDfs(g, r, c, 0, next, end, words, found);
              Collections.sort(found);
              return found.toArray(new String[0]);
          }

          private static void wordDfs(char[][] g, int r, int c, int parent, List<int[]> next, List<Integer> end, String[] words, List<String> found) {
              char letter = g[r][c];
              if (letter == '#') return;
              int cur = next.get(parent)[letter - 'a'];
              if (cur == 0) return;
              if (end.get(cur) >= 0) { found.add(words[end.get(cur)]); end.set(cur, -1); }
              g[r][c] = '#';
              if (r > 0) wordDfs(g, r - 1, c, cur, next, end, words, found);
              if (r + 1 < g.length) wordDfs(g, r + 1, c, cur, next, end, words, found);
              if (c > 0) wordDfs(g, r, c - 1, cur, next, end, words, found);
              if (c + 1 < g[0].length) wordDfs(g, r, c + 1, cur, next, end, words, found);
              g[r][c] = letter;
          }
        `,
        cpp: code`
          static void wordDfs(vector<string>& g, int r, int c, int parent, vector<array<int, 26>>& nxt, vector<int>& endAt, vector<string>& words, vector<string>& found) {
              char letter = g[r][c];
              if (letter == '#') return;
              int cur = nxt[parent][letter - 'a'];
              if (cur == 0) return;
              if (endAt[cur] >= 0) { found.push_back(words[endAt[cur]]); endAt[cur] = -1; }
              g[r][c] = '#';
              if (r > 0) wordDfs(g, r - 1, c, cur, nxt, endAt, words, found);
              if (r + 1 < (int)g.size()) wordDfs(g, r + 1, c, cur, nxt, endAt, words, found);
              if (c > 0) wordDfs(g, r, c - 1, cur, nxt, endAt, words, found);
              if (c + 1 < (int)g[0].size()) wordDfs(g, r, c + 1, cur, nxt, endAt, words, found);
              g[r][c] = letter;
          }

          vector<string> findWords(vector<string>& board, vector<string>& words) {
              vector<string> g = board;
              vector<array<int, 26>> nxt(1);
              nxt[0].fill(0);
              vector<int> endAt(1, -1);
              for (int w = 0; w < (int)words.size(); w++) {
                  int node = 0;
                  for (char ch : words[w]) {
                      int k = ch - 'a';
                      if (nxt[node][k] == 0) {
                          array<int, 26> fresh;
                          fresh.fill(0);
                          nxt.push_back(fresh);
                          endAt.push_back(-1);
                          nxt[node][k] = (int)nxt.size() - 1;
                      }
                      node = nxt[node][k];
                  }
                  endAt[node] = w;
              }
              vector<string> found;
              for (int r = 0; r < (int)g.size(); r++)
                  for (int c = 0; c < (int)g[0].size(); c++) wordDfs(g, r, c, 0, nxt, endAt, words, found);
              sort(found.begin(), found.end());
              return found;
          }
        `,
        c: code`
          static int wsM, wsN, wsCount;
          static int* wsNext;
          static int* wsEnd;
          static char** wsGrid;
          static char** wsWords;
          static char** wsFound;

          static void wordDfs(int r, int c, int parent) {
              char letter = wsGrid[r][c];
              if (letter == '#') return;
              int cur = wsNext[parent * 26 + (letter - 'a')];
              if (cur == 0) return;
              if (wsEnd[cur] >= 0) { wsFound[wsCount++] = wsWords[wsEnd[cur]]; wsEnd[cur] = -1; }
              wsGrid[r][c] = '#';
              if (r > 0) wordDfs(r - 1, c, cur);
              if (r + 1 < wsM) wordDfs(r + 1, c, cur);
              if (c > 0) wordDfs(r, c - 1, cur);
              if (c + 1 < wsN) wordDfs(r, c + 1, cur);
              wsGrid[r][c] = letter;
          }

          static int cmpWordStr(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          char** findWords(char** board, int boardSize, char** words, int wordsSize, int* returnSize) {
              wsM = boardSize;
              wsN = (int)strlen(board[0]);
              int nodes = 1;
              for (int w = 0; w < wordsSize; w++) nodes += (int)strlen(words[w]);
              wsNext = (int*)calloc(nodes * 26, sizeof(int));
              wsEnd = (int*)malloc(nodes * sizeof(int));
              for (int i = 0; i < nodes; i++) wsEnd[i] = -1;
              int used = 1;
              for (int w = 0; w < wordsSize; w++) {
                  int node = 0;
                  for (const char* p = words[w]; *p; p++) {
                      int k = *p - 'a';
                      if (wsNext[node * 26 + k] == 0) wsNext[node * 26 + k] = used++;
                      node = wsNext[node * 26 + k];
                  }
                  wsEnd[node] = w;
              }
              wsGrid = (char**)malloc(wsM * sizeof(char*));
              for (int r = 0; r < wsM; r++) {
                  wsGrid[r] = (char*)malloc(wsN + 1);
                  memcpy(wsGrid[r], board[r], wsN + 1);
              }
              wsWords = words;
              wsFound = (char**)malloc((wordsSize > 0 ? wordsSize : 1) * sizeof(char*));
              wsCount = 0;
              for (int r = 0; r < wsM; r++)
                  for (int c = 0; c < wsN; c++) wordDfs(r, c, 0);
              qsort(wsFound, wsCount, sizeof(char*), cmpWordStr);
              for (int r = 0; r < wsM; r++) free(wsGrid[r]);
              free(wsGrid);
              free(wsNext);
              free(wsEnd);
              *returnSize = wsCount;
              return wsFound;
          }
        `,
        csharp: code`
          public static string[] FindWords(string[] board, string[] words)
          {
              int m = board.Length, n = board[0].Length;
              var g = new char[m][];
              for (int i = 0; i < m; i++) g[i] = board[i].ToCharArray();
              var next = new List<int[]> { new int[26] };
              var end = new List<int> { -1 };
              for (int w = 0; w < words.Length; w++)
              {
                  int node = 0;
                  foreach (char ch in words[w])
                  {
                      int k = ch - 'a';
                      if (next[node][k] == 0)
                      {
                          next.Add(new int[26]);
                          end.Add(-1);
                          next[node][k] = next.Count - 1;
                      }
                      node = next[node][k];
                  }
                  end[node] = w;
              }
              var found = new List<string>();
              Action<int, int, int> dfs = null;
              dfs = (r, c, parent) =>
              {
                  char letter = g[r][c];
                  if (letter == '#') return;
                  int cur = next[parent][letter - 'a'];
                  if (cur == 0) return;
                  if (end[cur] >= 0) { found.Add(words[end[cur]]); end[cur] = -1; }
                  g[r][c] = '#';
                  if (r > 0) dfs(r - 1, c, cur);
                  if (r + 1 < m) dfs(r + 1, c, cur);
                  if (c > 0) dfs(r, c - 1, cur);
                  if (c + 1 < n) dfs(r, c + 1, cur);
                  g[r][c] = letter;
              };
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++) dfs(r, c, 0);
              found.Sort(string.CompareOrdinal);
              return found.ToArray();
          }
        `,
        go: code`
          func findWords(board []string, words []string) []string {
          	m, n := len(board), len(board[0])
          	g := make([][]byte, m)
          	for i := range board {
          		g[i] = []byte(board[i])
          	}
          	next := [][26]int{{}}
          	end := []int{-1}
          	for w, word := range words {
          		node := 0
          		for i := 0; i < len(word); i++ {
          			k := int(word[i] - 'a')
          			if next[node][k] == 0 {
          				next = append(next, [26]int{})
          				end = append(end, -1)
          				next[node][k] = len(next) - 1
          			}
          			node = next[node][k]
          		}
          		end[node] = w
          	}
          	found := []string{}
          	var dfs func(r, c, parent int)
          	dfs = func(r, c, parent int) {
          		letter := g[r][c]
          		if letter == '#' {
          			return
          		}
          		cur := next[parent][letter-'a']
          		if cur == 0 {
          			return
          		}
          		if end[cur] >= 0 {
          			found = append(found, words[end[cur]])
          			end[cur] = -1
          		}
          		g[r][c] = '#'
          		if r > 0 {
          			dfs(r-1, c, cur)
          		}
          		if r+1 < m {
          			dfs(r+1, c, cur)
          		}
          		if c > 0 {
          			dfs(r, c-1, cur)
          		}
          		if c+1 < n {
          			dfs(r, c+1, cur)
          		}
          		g[r][c] = letter
          	}
          	for r := 0; r < m; r++ {
          		for c := 0; c < n; c++ {
          			dfs(r, c, 0)
          		}
          	}
          	sort.Strings(found)
          	return found
          }
        `,
        kotlin: code`
          fun findWords(board: Array<String>, words: Array<String>): Array<String> {
              val m = board.size
              val n = board[0].length
              val g = Array(m) { board[it].toCharArray() }
              val next = ArrayList<IntArray>()
              val end = ArrayList<Int>()
              next.add(IntArray(26))
              end.add(-1)
              for (w in words.indices) {
                  var node = 0
                  for (ch in words[w]) {
                      val k = ch - 'a'
                      if (next[node][k] == 0) {
                          next.add(IntArray(26))
                          end.add(-1)
                          next[node][k] = next.size - 1
                      }
                      node = next[node][k]
                  }
                  end[node] = w
              }
              val found = ArrayList<String>()
              fun dfs(r: Int, c: Int, parent: Int) {
                  val letter = g[r][c]
                  if (letter == '#') return
                  val cur = next[parent][letter - 'a']
                  if (cur == 0) return
                  if (end[cur] >= 0) { found.add(words[end[cur]]); end[cur] = -1 }
                  g[r][c] = '#'
                  if (r > 0) dfs(r - 1, c, cur)
                  if (r + 1 < m) dfs(r + 1, c, cur)
                  if (c > 0) dfs(r, c - 1, cur)
                  if (c + 1 < n) dfs(r, c + 1, cur)
                  g[r][c] = letter
              }
              for (r in 0 until m) for (c in 0 until n) dfs(r, c, 0)
              found.sort()
              return found.toTypedArray()
          }
        `,
        swift: code`
          func findWords(_ board: [String], _ words: [String]) -> [String] {
              var g = board.map { Array($0.utf8) }
              let m = g.count, n = g[0].count
              var next = [[Int](repeating: 0, count: 26)]
              var end = [-1]
              for (w, word) in words.enumerated() {
                  var node = 0
                  for ch in word.utf8 {
                      let k = Int(ch) - 97
                      if next[node][k] == 0 {
                          next.append([Int](repeating: 0, count: 26))
                          end.append(-1)
                          next[node][k] = next.count - 1
                      }
                      node = next[node][k]
                  }
                  end[node] = w
              }
              var found = [String]()
              func dfs(_ r: Int, _ c: Int, _ parent: Int) {
                  let letter = g[r][c]
                  if letter == 35 { return }
                  let cur = next[parent][Int(letter) - 97]
                  if cur == 0 { return }
                  if end[cur] >= 0 { found.append(words[end[cur]]); end[cur] = -1 }
                  g[r][c] = 35
                  if r > 0 { dfs(r - 1, c, cur) }
                  if r + 1 < m { dfs(r + 1, c, cur) }
                  if c > 0 { dfs(r, c - 1, cur) }
                  if c + 1 < n { dfs(r, c + 1, cur) }
                  g[r][c] = letter
              }
              for r in 0..<m { for c in 0..<n { dfs(r, c, 0) } }
              return found.sorted()
          }
        `,
        rust: code`
          fn word_dfs(g: &mut Vec<Vec<u8>>, r: usize, c: usize, parent: usize, next: &Vec<[usize; 26]>, end: &mut Vec<i32>, words: &Vec<String>, found: &mut Vec<String>) {
              let letter = g[r][c];
              if letter == b'#' {
                  return;
              }
              let cur = next[parent][(letter - b'a') as usize];
              if cur == 0 {
                  return;
              }
              if end[cur] >= 0 {
                  found.push(words[end[cur] as usize].clone());
                  end[cur] = -1;
              }
              g[r][c] = b'#';
              let (m, n) = (g.len(), g[0].len());
              if r > 0 {
                  word_dfs(g, r - 1, c, cur, next, end, words, found);
              }
              if r + 1 < m {
                  word_dfs(g, r + 1, c, cur, next, end, words, found);
              }
              if c > 0 {
                  word_dfs(g, r, c - 1, cur, next, end, words, found);
              }
              if c + 1 < n {
                  word_dfs(g, r, c + 1, cur, next, end, words, found);
              }
              g[r][c] = letter;
          }

          fn findWords(board: Vec<String>, words: Vec<String>) -> Vec<String> {
              let mut g: Vec<Vec<u8>> = board.iter().map(|s| s.as_bytes().to_vec()).collect();
              let mut next: Vec<[usize; 26]> = vec![[0usize; 26]];
              let mut end: Vec<i32> = vec![-1];
              for (w, word) in words.iter().enumerate() {
                  let mut node = 0usize;
                  for &ch in word.as_bytes() {
                      let k = (ch - b'a') as usize;
                      if next[node][k] == 0 {
                          next.push([0usize; 26]);
                          end.push(-1);
                          let id = next.len() - 1;
                          next[node][k] = id;
                      }
                      node = next[node][k];
                  }
                  end[node] = w as i32;
              }
              let mut found: Vec<String> = Vec::new();
              let (m, n) = (g.len(), g[0].len());
              for r in 0..m {
                  for c in 0..n {
                      word_dfs(&mut g, r, c, 0, &next, &mut end, &words, &mut found);
                  }
              }
              found.sort();
              found
          }
        `,
        php: code`
          function wordDfs(&$g, $r, $c, $parent, &$next, &$end, &$words, &$found, $m, $n) {
              $letter = $g[$r][$c];
              if ($letter === '#') return;
              $k = ord($letter) - 97;
              if (!isset($next[$parent][$k])) return;
              $cur = $next[$parent][$k];
              if ($end[$cur] >= 0) { $found[] = $words[$end[$cur]]; $end[$cur] = -1; }
              $g[$r][$c] = '#';
              if ($r > 0) wordDfs($g, $r - 1, $c, $cur, $next, $end, $words, $found, $m, $n);
              if ($r + 1 < $m) wordDfs($g, $r + 1, $c, $cur, $next, $end, $words, $found, $m, $n);
              if ($c > 0) wordDfs($g, $r, $c - 1, $cur, $next, $end, $words, $found, $m, $n);
              if ($c + 1 < $n) wordDfs($g, $r, $c + 1, $cur, $next, $end, $words, $found, $m, $n);
              $g[$r][$c] = $letter;
          }

          function findWords($board, $words) {
              $m = count($board);
              $n = strlen($board[0]);
              $g = [];
              foreach ($board as $row) $g[] = str_split($row);
              $next = [[]];
              $end = [-1];
              foreach ($words as $w => $word) {
                  $node = 0;
                  $len = strlen($word);
                  for ($i = 0; $i < $len; $i++) {
                      $k = ord($word[$i]) - 97;
                      if (!isset($next[$node][$k])) {
                          $next[] = [];
                          $end[] = -1;
                          $next[$node][$k] = count($next) - 1;
                      }
                      $node = $next[$node][$k];
                  }
                  $end[$node] = $w;
              }
              $found = [];
              for ($r = 0; $r < $m; $r++)
                  for ($c = 0; $c < $n; $c++) wordDfs($g, $r, $c, 0, $next, $end, $words, $found, $m, $n);
              sort($found, SORT_STRING);
              return $found;
          }
        `,
        ruby: code`
          def findWords(board, words)
            m = board.length
            n = board[0].length
            g = board.map(&:dup)
            root = {}
            words.each do |w|
              node = root
              w.each_char { |ch| node = (node[ch] ||= {}) }
              node[:word] = w
            end
            found = []
            dfs = lambda do |r, c, parent|
              letter = g[r][c]
              return if letter == '#'
              node = parent[letter]
              return if node.nil?
              if node[:word]
                found << node[:word]
                node.delete(:word)
              end
              g[r][c] = '#'
              dfs.call(r - 1, c, node) if r > 0
              dfs.call(r + 1, c, node) if r + 1 < m
              dfs.call(r, c - 1, node) if c > 0
              dfs.call(r, c + 1, node) if c + 1 < n
              g[r][c] = letter
            end
            m.times { |r| n.times { |c| dfs.call(r, c, root) } }
            found.sort
          end
        `,
      },
    };
  })(),

];
