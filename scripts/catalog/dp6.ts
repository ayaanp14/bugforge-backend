/**
 * Dynamic programming problems — wave 6 (part I, mostly medium).
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Where LeetCode returns a 64-bit answer the constraints are tightened so the
 * true answer fits in int32 (each such entry says which bound moved); answers
 * taken modulo 1e9+7 keep the modulus, and the JS/TS solutions multiply with a
 * split `mulmod` because a product of two residues passes 2^53.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

const MOD = 1000000007;

export const DP6_PROBLEMS: CatalogProblem[] = [

  // ── Out of Boundary Paths (LC 576) ──────────────────────────────
  (() => {
    const ref = (m: number, n: number, maxMove: number, sr: number, sc: number) => {
      // memo[k][r][c] = ways to leave the grid from (r,c) with at most k moves left
      const memo = new Map<string, number>();
      const go = (r: number, c: number, k: number): number => {
        if (r < 0 || r >= m || c < 0 || c >= n) return 1;
        if (k === 0) return 0;
        const key = r + "," + c + "," + k;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        const v = (go(r + 1, c, k - 1) + go(r - 1, c, k - 1) + go(r, c + 1, k - 1) + go(r, c - 1, k - 1)) % MOD;
        memo.set(key, v);
        return v;
      };
      return go(sr, sc, maxMove);
    };
    return {
      slug: "out-of-boundary-paths",
      title: "Out of Boundary Paths",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Matrix", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "findPaths",
        params: [
          { name: "m", type: "int" as const }, { name: "n", type: "int" as const },
          { name: "maxMove", type: "int" as const }, { name: "startRow", type: "int" as const },
          { name: "startColumn", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A token sits on cell `(startRow, startColumn)` of an `m x n` grid. In one move it steps to one of the four orthogonally adjacent cells — and that step may carry it **off** the grid.\n\nYou may make **at most** `maxMove` moves. Count the distinct move sequences that end with the token leaving the grid (a sequence stops the moment the token crosses the boundary). Two sequences differ if they differ in any move.\n\nThe count can be huge, so return it modulo `10^9 + 7`.",
        [
          { in: "m = 2, n = 2, maxMove = 2, startRow = 0, startColumn = 0", out: "6", note: "Two one-move exits (up, left), then from each of the two neighbours two more exits each." },
          { in: "m = 1, n = 3, maxMove = 3, startRow = 0, startColumn = 1", out: "12" },
          { in: "m = 3, n = 3, maxMove = 1, startRow = 1, startColumn = 1", out: "0", note: "The centre cell is two steps from every edge." },
        ],
        ["1 <= m, n <= 50", "0 <= maxMove <= 50", "0 <= startRow < m", "0 <= startColumn < n"]),
      hints: [
        "Only the token's cell and the number of moves used matter — not the path that brought it there.",
        "Track, after each move, how many sequences put the token on each cell.",
        "Spread each cell's count to its four neighbours; whatever lands outside the grid is added to the answer.",
      ],
      editorial: explain({
        idea: "Push counts forward one move at a time. `ways[r][c]` after step `t` is how many length-`t` move sequences end on `(r, c)` without having left; every neighbour that falls outside the grid turns those sequences into finished exits.",
        steps: [
          "Start with `ways[startRow][startColumn] = 1` and an answer of 0.",
          "Repeat `maxMove` times: build a fresh zero grid; for every cell with a non-zero count, look at its four neighbours.",
          "A neighbour inside the grid receives the count; a neighbour outside adds the count to the answer. Reduce everything modulo `10^9 + 7`.",
          "Replace the grid with the fresh one and continue; return the answer.",
        ],
        why: "A sequence that leaves on move `t` is exactly a sequence of `t - 1` in-grid moves followed by one step across the edge, so summing, for each step, the counts that cross the edge counts every exiting sequence once — sequences stop at the edge, so nothing is double counted.",
        time: "O(maxMove · m · n)",
        space: "O(m · n)",
        pitfalls: [
          "`maxMove = 0` must return 0, not 1.",
          "A corner cell has two exits in one move, a cell on a 1-wide grid can have three or four — count each exit separately.",
          "Reduce after every addition; the raw counts grow like 4^maxMove.",
        ],
      }),
      examples: [
        { input: "2\n2\n2\n0\n0", expectedOutput: "6" },
        { input: "1\n3\n3\n0\n1", expectedOutput: "12" },
        { input: "3\n3\n1\n1\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.1;
        const m = big ? ri(rng, 6, 10) : ri(rng, 1, 7);
        const n = big ? ri(rng, 6, 10) : ri(rng, 1, 7);
        const maxMove = rng() < 0.1 ? ri(rng, 0, 2) : big ? ri(rng, 10, 20) : ri(rng, 0, 16);
        const sr = ri(rng, 0, m - 1);
        const sc = ri(rng, 0, n - 1);
        return { input: [m, n, maxMove, sr, sc].join("\n"), expectedOutput: String(ref(m, n, maxMove, sr, sc)) };
      },
      solutions: {
        python: code`
          def findPaths(m: int, n: int, maxMove: int, startRow: int, startColumn: int) -> int:
              MOD = 10**9 + 7
              cur = [[0] * n for _ in range(m)]
              cur[startRow][startColumn] = 1
              total = 0
              for _ in range(maxMove):
                  nxt = [[0] * n for _ in range(m)]
                  for r in range(m):
                      for c in range(n):
                          w = cur[r][c]
                          if w == 0:
                              continue
                          for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                              if 0 <= nr < m and 0 <= nc < n:
                                  nxt[nr][nc] = (nxt[nr][nc] + w) % MOD
                              else:
                                  total = (total + w) % MOD
                  cur = nxt
              return total
        `,
        javascript: code`
          var findPaths = function(m, n, maxMove, startRow, startColumn) {
              var MOD = 1000000007;
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var makeGrid = function() {
                  var g = [];
                  for (var i = 0; i < m; i++) g.push(new Array(n).fill(0));
                  return g;
              };
              var cur = makeGrid();
              cur[startRow][startColumn] = 1;
              var total = 0;
              for (var step = 0; step < maxMove; step++) {
                  var nxt = makeGrid();
                  for (var r = 0; r < m; r++) {
                      for (var c = 0; c < n; c++) {
                          var w = cur[r][c];
                          if (w === 0) continue;
                          for (var d = 0; d < 4; d++) {
                              var nr = r + dr[d], nc = c + dc[d];
                              if (nr < 0 || nr >= m || nc < 0 || nc >= n) total = (total + w) % MOD;
                              else nxt[nr][nc] = (nxt[nr][nc] + w) % MOD;
                          }
                      }
                  }
                  cur = nxt;
              }
              return total;
          };
        `,
        typescript: code`
          function findPaths(m: number, n: number, maxMove: number, startRow: number, startColumn: number): number {
              var MOD = 1000000007;
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var makeGrid = function (): number[][] {
                  var g: number[][] = [];
                  for (var i = 0; i < m; i++) {
                      var row: number[] = [];
                      for (var j = 0; j < n; j++) row.push(0);
                      g.push(row);
                  }
                  return g;
              };
              var cur = makeGrid();
              cur[startRow][startColumn] = 1;
              var total = 0;
              for (var step = 0; step < maxMove; step++) {
                  var nxt = makeGrid();
                  for (var r = 0; r < m; r++) {
                      for (var c = 0; c < n; c++) {
                          var w = cur[r][c];
                          if (w === 0) continue;
                          for (var d = 0; d < 4; d++) {
                              var nr = r + dr[d], nc = c + dc[d];
                              if (nr < 0 || nr >= m || nc < 0 || nc >= n) total = (total + w) % MOD;
                              else nxt[nr][nc] = (nxt[nr][nc] + w) % MOD;
                          }
                      }
                  }
                  cur = nxt;
              }
              return total;
          }
        `,
        java: code`
          public static int findPaths(int m, int n, int maxMove, int startRow, int startColumn) {
              final int MOD = 1000000007;
              int[] dr = {1, -1, 0, 0};
              int[] dc = {0, 0, 1, -1};
              int[][] cur = new int[m][n];
              cur[startRow][startColumn] = 1;
              int total = 0;
              for (int step = 0; step < maxMove; step++) {
                  int[][] nxt = new int[m][n];
                  for (int r = 0; r < m; r++) {
                      for (int c = 0; c < n; c++) {
                          int w = cur[r][c];
                          if (w == 0) continue;
                          for (int d = 0; d < 4; d++) {
                              int nr = r + dr[d], nc = c + dc[d];
                              if (nr < 0 || nr >= m || nc < 0 || nc >= n) total = (total + w) % MOD;
                              else nxt[nr][nc] = (nxt[nr][nc] + w) % MOD;
                          }
                      }
                  }
                  cur = nxt;
              }
              return total;
          }
        `,
        cpp: code`
          int findPaths(int m, int n, int maxMove, int startRow, int startColumn) {
              const int MOD = 1000000007;
              int dr[4] = {1, -1, 0, 0};
              int dc[4] = {0, 0, 1, -1};
              vector<vector<int>> cur(m, vector<int>(n, 0));
              cur[startRow][startColumn] = 1;
              int total = 0;
              for (int step = 0; step < maxMove; step++) {
                  vector<vector<int>> nxt(m, vector<int>(n, 0));
                  for (int r = 0; r < m; r++) {
                      for (int c = 0; c < n; c++) {
                          int w = cur[r][c];
                          if (w == 0) continue;
                          for (int d = 0; d < 4; d++) {
                              int nr = r + dr[d], nc = c + dc[d];
                              if (nr < 0 || nr >= m || nc < 0 || nc >= n) total = (total + w) % MOD;
                              else nxt[nr][nc] = (nxt[nr][nc] + w) % MOD;
                          }
                      }
                  }
                  cur = nxt;
              }
              return total;
          }
        `,
        c: code`
          int findPaths(int m, int n, int maxMove, int startRow, int startColumn) {
              const int MOD = 1000000007;
              int dr[4] = {1, -1, 0, 0};
              int dc[4] = {0, 0, 1, -1};
              static int cur[50][50];
              static int nxt[50][50];
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++) cur[r][c] = 0;
              cur[startRow][startColumn] = 1;
              int total = 0;
              for (int step = 0; step < maxMove; step++) {
                  for (int r = 0; r < m; r++)
                      for (int c = 0; c < n; c++) nxt[r][c] = 0;
                  for (int r = 0; r < m; r++) {
                      for (int c = 0; c < n; c++) {
                          int w = cur[r][c];
                          if (w == 0) continue;
                          for (int d = 0; d < 4; d++) {
                              int nr = r + dr[d], nc = c + dc[d];
                              if (nr < 0 || nr >= m || nc < 0 || nc >= n) total = (total + w) % MOD;
                              else nxt[nr][nc] = (nxt[nr][nc] + w) % MOD;
                          }
                      }
                  }
                  for (int r = 0; r < m; r++)
                      for (int c = 0; c < n; c++) cur[r][c] = nxt[r][c];
              }
              return total;
          }
        `,
        csharp: code`
          public static int FindPaths(int m, int n, int maxMove, int startRow, int startColumn)
          {
              const int MOD = 1000000007;
              int[] dr = { 1, -1, 0, 0 };
              int[] dc = { 0, 0, 1, -1 };
              int[,] cur = new int[m, n];
              cur[startRow, startColumn] = 1;
              int total = 0;
              for (int step = 0; step < maxMove; step++)
              {
                  int[,] nxt = new int[m, n];
                  for (int r = 0; r < m; r++)
                  {
                      for (int c = 0; c < n; c++)
                      {
                          int w = cur[r, c];
                          if (w == 0) continue;
                          for (int d = 0; d < 4; d++)
                          {
                              int nr = r + dr[d], nc = c + dc[d];
                              if (nr < 0 || nr >= m || nc < 0 || nc >= n) total = (total + w) % MOD;
                              else nxt[nr, nc] = (nxt[nr, nc] + w) % MOD;
                          }
                      }
                  }
                  cur = nxt;
              }
              return total;
          }
        `,
        go: code`
          func findPaths(m int, n int, maxMove int, startRow int, startColumn int) int {
          	const MOD = 1000000007
          	dr := []int{1, -1, 0, 0}
          	dc := []int{0, 0, 1, -1}
          	makeGrid := func() [][]int {
          		g := make([][]int, m)
          		for i := range g {
          			g[i] = make([]int, n)
          		}
          		return g
          	}
          	cur := makeGrid()
          	cur[startRow][startColumn] = 1
          	total := 0
          	for step := 0; step < maxMove; step++ {
          		nxt := makeGrid()
          		for r := 0; r < m; r++ {
          			for c := 0; c < n; c++ {
          				w := cur[r][c]
          				if w == 0 {
          					continue
          				}
          				for d := 0; d < 4; d++ {
          					nr, nc := r+dr[d], c+dc[d]
          					if nr < 0 || nr >= m || nc < 0 || nc >= n {
          						total = (total + w) % MOD
          					} else {
          						nxt[nr][nc] = (nxt[nr][nc] + w) % MOD
          					}
          				}
          			}
          		}
          		cur = nxt
          	}
          	return total
          }
        `,
        kotlin: code`
          fun findPaths(m: Int, n: Int, maxMove: Int, startRow: Int, startColumn: Int): Int {
              val MOD = 1000000007
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              var cur = Array(m) { IntArray(n) }
              cur[startRow][startColumn] = 1
              var total = 0
              for (step in 0 until maxMove) {
                  val nxt = Array(m) { IntArray(n) }
                  for (r in 0 until m) {
                      for (c in 0 until n) {
                          val w = cur[r][c]
                          if (w == 0) continue
                          for (d in 0 until 4) {
                              val nr = r + dr[d]
                              val nc = c + dc[d]
                              if (nr < 0 || nr >= m || nc < 0 || nc >= n) total = (total + w) % MOD
                              else nxt[nr][nc] = (nxt[nr][nc] + w) % MOD
                          }
                      }
                  }
                  cur = nxt
              }
              return total
          }
        `,
        swift: code`
          func findPaths(_ m: Int, _ n: Int, _ maxMove: Int, _ startRow: Int, _ startColumn: Int) -> Int {
              let MOD = 1000000007
              let dr = [1, -1, 0, 0]
              let dc = [0, 0, 1, -1]
              var cur = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)
              cur[startRow][startColumn] = 1
              var total = 0
              var step = 0
              while step < maxMove {
                  var nxt = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)
                  for r in 0..<m {
                      for c in 0..<n {
                          let w = cur[r][c]
                          if w == 0 { continue }
                          for d in 0..<4 {
                              let nr = r + dr[d]
                              let nc = c + dc[d]
                              if nr < 0 || nr >= m || nc < 0 || nc >= n {
                                  total = (total + w) % MOD
                              } else {
                                  nxt[nr][nc] = (nxt[nr][nc] + w) % MOD
                              }
                          }
                      }
                  }
                  cur = nxt
                  step += 1
              }
              return total
          }
        `,
        rust: code`
          fn findPaths(m: i32, n: i32, maxMove: i32, startRow: i32, startColumn: i32) -> i32 {
              let md: i64 = 1000000007;
              let dr = [1i32, -1, 0, 0];
              let dc = [0i32, 0, 1, -1];
              let (mu, nu) = (m as usize, n as usize);
              let mut cur = vec![vec![0i64; nu]; mu];
              cur[startRow as usize][startColumn as usize] = 1;
              let mut total: i64 = 0;
              for _ in 0..maxMove {
                  let mut nxt = vec![vec![0i64; nu]; mu];
                  for r in 0..m {
                      for c in 0..n {
                          let w = cur[r as usize][c as usize];
                          if w == 0 {
                              continue;
                          }
                          for d in 0..4 {
                              let nr = r + dr[d];
                              let nc = c + dc[d];
                              if nr < 0 || nr >= m || nc < 0 || nc >= n {
                                  total = (total + w) % md;
                              } else {
                                  let cell = &mut nxt[nr as usize][nc as usize];
                                  *cell = (*cell + w) % md;
                              }
                          }
                      }
                  }
                  cur = nxt;
              }
              total as i32
          }
        `,
        php: code`
          function findPaths($m, $n, $maxMove, $startRow, $startColumn) {
              $MOD = 1000000007;
              $dr = [1, -1, 0, 0];
              $dc = [0, 0, 1, -1];
              $cur = array_fill(0, $m, array_fill(0, $n, 0));
              $cur[$startRow][$startColumn] = 1;
              $total = 0;
              for ($step = 0; $step < $maxMove; $step++) {
                  $nxt = array_fill(0, $m, array_fill(0, $n, 0));
                  for ($r = 0; $r < $m; $r++) {
                      for ($c = 0; $c < $n; $c++) {
                          $w = $cur[$r][$c];
                          if ($w == 0) continue;
                          for ($d = 0; $d < 4; $d++) {
                              $nr = $r + $dr[$d];
                              $nc = $c + $dc[$d];
                              if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) $total = ($total + $w) % $MOD;
                              else $nxt[$nr][$nc] = ($nxt[$nr][$nc] + $w) % $MOD;
                          }
                      }
                  }
                  $cur = $nxt;
              }
              return $total;
          }
        `,
        ruby: code`
          def findPaths(m, n, maxMove, startRow, startColumn)
            md = 1_000_000_007
            dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            cur = Array.new(m) { Array.new(n, 0) }
            cur[startRow][startColumn] = 1
            total = 0
            maxMove.times do
              nxt = Array.new(m) { Array.new(n, 0) }
              m.times do |r|
                n.times do |c|
                  w = cur[r][c]
                  next if w == 0
                  dirs.each do |dr, dc|
                    nr = r + dr
                    nc = c + dc
                    if nr < 0 || nr >= m || nc < 0 || nc >= n
                      total = (total + w) % md
                    else
                      nxt[nr][nc] = (nxt[nr][nc] + w) % md
                    end
                  end
                end
              end
              cur = nxt
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Partition to K Equal Sum Subsets (LC 698) ───────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      // Plain bucket backtracking: drop each number into one of k buckets.
      const total = nums.reduce((a, b) => a + b, 0);
      if (total % k !== 0) return false;
      const target = total / k;
      const a = nums.slice().sort((x, y) => y - x);
      const buckets = new Array(k).fill(0);
      const place = (i: number): boolean => {
        if (i === a.length) return buckets.every((b) => b === target);
        for (let b = 0; b < k; b++) {
          if (buckets[b] + a[i] > target) continue;
          buckets[b] += a[i];
          if (place(i + 1)) return true;
          buckets[b] -= a[i];
          if (buckets[b] === 0) break; // empty buckets are interchangeable
        }
        return false;
      };
      return place(0);
    };
    const freqOk = (a: number[]) => {
      const c = new Map<number, number>();
      for (const v of a) {
        const x = (c.get(v) || 0) + 1;
        if (x > 4) return false;
        c.set(v, x);
      }
      return true;
    };
    return {
      slug: "partition-to-k-equal-sum-subsets",
      title: "Partition to K Equal Sum Subsets",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Backtracking", "Bitmask", "Amazon", "Google", "Microsoft", "LinkedIn"],
      signature: {
        funcName: "canPartitionKSubsets",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Given an integer array `nums` and an integer `k`, decide whether the elements can be split into exactly `k` **non-empty** groups whose sums are all equal.\n\nEvery element must go into exactly one group; the groups need not be contiguous. Return `true` if such a split exists and `false` otherwise.",
        [
          { in: "nums = [4,3,2,3,5,2,1], k = 4", out: "true", note: "`[5]`, `[1,4]`, `[2,3]`, `[2,3]` all sum to 5." },
          { in: "nums = [1,2,3,4], k = 3", out: "false", note: "The total 10 is not divisible by 3." },
          { in: "nums = [6,2,2,2,6,6], k = 3", out: "true" },
        ],
        ["1 <= k <= nums.length <= 16", "1 <= nums[i] <= 10^4", "Each value occurs at most 4 times in nums"]),
      hints: [
        "If the total is not a multiple of `k`, or some element exceeds `total / k`, the answer is immediately `false`.",
        "With at most 16 elements, the set of elements already used fits in a bitmask.",
        "Fill groups one at a time: for each used-set, the only thing that matters is how full the current group is (`sum of used % target`). Mark reachable masks and check the full mask.",
      ],
      editorial: explain({
        idea: "Fill the groups one after another. Once you know which elements are used, the fill level of the open group is determined (`sum(used) mod target`), so a DP over the 2^n subsets is enough.",
        steps: [
          "Let `target = total / k`; return `false` if the division is inexact or the largest element exceeds `target`.",
          "Sort ascending. `dp[mask]` = fill level of the open group after using `mask`, or -1 if `mask` cannot be reached; `dp[0] = 0`.",
          "For each reachable mask, try every unused element `i`: if `dp[mask] + nums[i] <= target`, the mask `mask | 1<<i` is reachable with level `(dp[mask] + nums[i]) % target`. Because the array is sorted, stop at the first element that overflows.",
          "Return whether the full mask is reachable.",
        ],
        why: "Any valid partition can be listed group by group, each group's elements in any order, and every prefix of that listing keeps the open group at or below `target` — so the full mask is reached. Conversely each transition only ever closes a group when it hits `target` exactly, so reaching the full mask means the elements were cut into groups of sum `target`, and there are exactly `total / target = k` of them.",
        time: "O(2^n · n)",
        space: "O(2^n)",
        pitfalls: [
          "Forgetting the early `max > target` check is harmless for the DP but the divisibility check is essential.",
          "The groups are not contiguous — a prefix-sum approach does not work.",
          "Plain backtracking without pruning (skip identical buckets) can blow up on adversarial inputs.",
        ],
      }),
      examples: [
        { input: "[4,3,2,3,5,2,1]\n4", expectedOutput: "true" },
        { input: "[1,2,3,4]\n3", expectedOutput: "false" },
        { input: "[6,2,2,2,6,6]\n3", expectedOutput: "true" },
      ],
      hiddenCount: 1000,
      gen: (rng: Rng) => {
        for (;;) {
          const n = rng() < 0.6 ? ri(rng, 1, 8) : ri(rng, 9, 11);
          const k = rng() < 0.15 ? 1 : ri(rng, 1, Math.min(n, 5));
          let nums: number[];
          if (rng() < 0.65 && k <= n) {
            // Build a yes-instance: k groups of equal sum, then maybe nudge one value.
            const counts = new Array(k).fill(1);
            for (let i = k; i < n; i++) counts[ri(rng, 0, k - 1)]++;
            const maxCount = Math.max(...counts);
            const span = pick(rng, [6, 20, 60, 2000]);
            const target = ri(rng, maxCount, Math.max(maxCount, span));
            nums = [];
            for (const cnt of counts) {
              // cut target into cnt positive parts
              const cuts = new Set<number>();
              while (cuts.size < cnt - 1) cuts.add(ri(rng, 1, target - 1));
              const sorted = [0, ...Array.from(cuts).sort((x, y) => x - y), target];
              for (let i = 1; i < sorted.length; i++) nums.push(sorted[i] - sorted[i - 1]);
            }
            if (rng() < 0.35) {
              const i = ri(rng, 0, nums.length - 1);
              const j = ri(rng, 0, nums.length - 1);
              if (i !== j && nums[i] > 1) { nums[i]--; nums[j]++; }
              else nums[i]++;
            }
            shuffle(rng, nums);
          } else {
            const hi = pick(rng, [5, 12, 100, 10000]);
            nums = Array.from({ length: n }, () => ri(rng, 1, hi));
          }
          if (nums.some((v) => v < 1 || v > 10000) || !freqOk(nums)) continue;
          return { input: fmtIntArr(nums) + "\n" + k, expectedOutput: bool(ref(nums, k)) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def canPartitionKSubsets(nums: List[int], k: int) -> bool:
              total = sum(nums)
              if total % k != 0:
                  return False
              target = total // k
              a = sorted(nums)
              if a[-1] > target:
                  return False
              n = len(a)
              dp = [-1] * (1 << n)
              dp[0] = 0
              for mask in range(1 << n):
                  cur = dp[mask]
                  if cur < 0:
                      continue
                  for i in range(n):
                      if mask & (1 << i):
                          continue
                      if cur + a[i] > target:
                          break
                      nm = mask | (1 << i)
                      if dp[nm] < 0:
                          dp[nm] = (cur + a[i]) % target
              return dp[(1 << n) - 1] == 0
        `,
        javascript: code`
          var canPartitionKSubsets = function(nums, k) {
              var total = 0;
              for (var i = 0; i < nums.length; i++) total += nums[i];
              if (total % k !== 0) return false;
              var target = total / k;
              var a = nums.slice().sort(function(x, y) { return x - y; });
              var n = a.length;
              if (a[n - 1] > target) return false;
              var full = (1 << n) - 1;
              var dp = new Array(full + 1).fill(-1);
              dp[0] = 0;
              for (var mask = 0; mask <= full; mask++) {
                  var cur = dp[mask];
                  if (cur < 0) continue;
                  for (i = 0; i < n; i++) {
                      if (mask & (1 << i)) continue;
                      if (cur + a[i] > target) break;
                      var nm = mask | (1 << i);
                      if (dp[nm] < 0) dp[nm] = (cur + a[i]) % target;
                  }
              }
              return dp[full] === 0;
          };
        `,
        typescript: code`
          function canPartitionKSubsets(nums: number[], k: number): boolean {
              var total = 0;
              for (var i = 0; i < nums.length; i++) total += nums[i];
              if (total % k !== 0) return false;
              var target = total / k;
              var a = nums.slice().sort(function (x, y) { return x - y; });
              var n = a.length;
              if (a[n - 1] > target) return false;
              var full = (1 << n) - 1;
              var dp: number[] = [];
              for (var t = 0; t <= full; t++) dp.push(-1);
              dp[0] = 0;
              for (var mask = 0; mask <= full; mask++) {
                  var cur = dp[mask];
                  if (cur < 0) continue;
                  for (i = 0; i < n; i++) {
                      if (mask & (1 << i)) continue;
                      if (cur + a[i] > target) break;
                      var nm = mask | (1 << i);
                      if (dp[nm] < 0) dp[nm] = (cur + a[i]) % target;
                  }
              }
              return dp[full] === 0;
          }
        `,
        java: code`
          public static boolean canPartitionKSubsets(int[] nums, int k) {
              int total = 0;
              for (int v : nums) total += v;
              if (total % k != 0) return false;
              int target = total / k;
              int[] a = nums.clone();
              Arrays.sort(a);
              int n = a.length;
              if (a[n - 1] > target) return false;
              int full = (1 << n) - 1;
              int[] dp = new int[full + 1];
              Arrays.fill(dp, -1);
              dp[0] = 0;
              for (int mask = 0; mask <= full; mask++) {
                  int cur = dp[mask];
                  if (cur < 0) continue;
                  for (int i = 0; i < n; i++) {
                      if ((mask & (1 << i)) != 0) continue;
                      if (cur + a[i] > target) break;
                      int nm = mask | (1 << i);
                      if (dp[nm] < 0) dp[nm] = (cur + a[i]) % target;
                  }
              }
              return dp[full] == 0;
          }
        `,
        cpp: code`
          bool canPartitionKSubsets(vector<int>& nums, int k) {
              int total = 0;
              for (int v : nums) total += v;
              if (total % k != 0) return false;
              int target = total / k;
              vector<int> a(nums.begin(), nums.end());
              sort(a.begin(), a.end());
              int n = a.size();
              if (a[n - 1] > target) return false;
              int full = (1 << n) - 1;
              vector<int> dp(full + 1, -1);
              dp[0] = 0;
              for (int mask = 0; mask <= full; mask++) {
                  int cur = dp[mask];
                  if (cur < 0) continue;
                  for (int i = 0; i < n; i++) {
                      if (mask & (1 << i)) continue;
                      if (cur + a[i] > target) break;
                      int nm = mask | (1 << i);
                      if (dp[nm] < 0) dp[nm] = (cur + a[i]) % target;
                  }
              }
              return dp[full] == 0;
          }
        `,
        c: code`
          static int cmpAscKs(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          bool canPartitionKSubsets(int* nums, int numsSize, int k) {
              int total = 0;
              for (int i = 0; i < numsSize; i++) total += nums[i];
              if (total % k != 0) return false;
              int target = total / k;
              int n = numsSize;
              int* a = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) a[i] = nums[i];
              qsort(a, n, sizeof(int), cmpAscKs);
              if (a[n - 1] > target) { free(a); return false; }
              int full = (1 << n) - 1;
              int* dp = (int*)malloc(sizeof(int) * (full + 1));
              for (int i = 0; i <= full; i++) dp[i] = -1;
              dp[0] = 0;
              for (int mask = 0; mask <= full; mask++) {
                  int cur = dp[mask];
                  if (cur < 0) continue;
                  for (int i = 0; i < n; i++) {
                      if (mask & (1 << i)) continue;
                      if (cur + a[i] > target) break;
                      int nm = mask | (1 << i);
                      if (dp[nm] < 0) dp[nm] = (cur + a[i]) % target;
                  }
              }
              bool ok = dp[full] == 0;
              free(a);
              free(dp);
              return ok;
          }
        `,
        csharp: code`
          public static bool CanPartitionKSubsets(int[] nums, int k)
          {
              int total = 0;
              foreach (int v in nums) total += v;
              if (total % k != 0) return false;
              int target = total / k;
              int[] a = (int[])nums.Clone();
              Array.Sort(a);
              int n = a.Length;
              if (a[n - 1] > target) return false;
              int full = (1 << n) - 1;
              int[] dp = new int[full + 1];
              for (int i = 0; i <= full; i++) dp[i] = -1;
              dp[0] = 0;
              for (int mask = 0; mask <= full; mask++)
              {
                  int cur = dp[mask];
                  if (cur < 0) continue;
                  for (int i = 0; i < n; i++)
                  {
                      if ((mask & (1 << i)) != 0) continue;
                      if (cur + a[i] > target) break;
                      int nm = mask | (1 << i);
                      if (dp[nm] < 0) dp[nm] = (cur + a[i]) % target;
                  }
              }
              return dp[full] == 0;
          }
        `,
        go: code`
          func canPartitionKSubsets(nums []int, k int) bool {
          	total := 0
          	for _, v := range nums {
          		total += v
          	}
          	if total%k != 0 {
          		return false
          	}
          	target := total / k
          	a := make([]int, len(nums))
          	copy(a, nums)
          	sort.Ints(a)
          	n := len(a)
          	if a[n-1] > target {
          		return false
          	}
          	full := (1 << uint(n)) - 1
          	dp := make([]int, full+1)
          	for i := range dp {
          		dp[i] = -1
          	}
          	dp[0] = 0
          	for mask := 0; mask <= full; mask++ {
          		cur := dp[mask]
          		if cur < 0 {
          			continue
          		}
          		for i := 0; i < n; i++ {
          			if mask&(1<<uint(i)) != 0 {
          				continue
          			}
          			if cur+a[i] > target {
          				break
          			}
          			nm := mask | (1 << uint(i))
          			if dp[nm] < 0 {
          				dp[nm] = (cur + a[i]) % target
          			}
          		}
          	}
          	return dp[full] == 0
          }
        `,
        kotlin: code`
          fun canPartitionKSubsets(nums: IntArray, k: Int): Boolean {
              val total = nums.sum()
              if (total % k != 0) return false
              val target = total / k
              val a = nums.sortedArray()
              val n = a.size
              if (a[n - 1] > target) return false
              val full = (1 shl n) - 1
              val dp = IntArray(full + 1) { -1 }
              dp[0] = 0
              for (mask in 0..full) {
                  val cur = dp[mask]
                  if (cur < 0) continue
                  for (i in 0 until n) {
                      if ((mask and (1 shl i)) != 0) continue
                      if (cur + a[i] > target) break
                      val nm = mask or (1 shl i)
                      if (dp[nm] < 0) dp[nm] = (cur + a[i]) % target
                  }
              }
              return dp[full] == 0
          }
        `,
        swift: code`
          func canPartitionKSubsets(_ nums: [Int], _ k: Int) -> Bool {
              let total = nums.reduce(0, +)
              if total % k != 0 { return false }
              let target = total / k
              let a = nums.sorted()
              let n = a.count
              if a[n - 1] > target { return false }
              let full = (1 << n) - 1
              var dp = [Int](repeating: -1, count: full + 1)
              dp[0] = 0
              for mask in 0...full {
                  let cur = dp[mask]
                  if cur < 0 { continue }
                  for i in 0..<n {
                      if mask & (1 << i) != 0 { continue }
                      if cur + a[i] > target { break }
                      let nm = mask | (1 << i)
                      if dp[nm] < 0 { dp[nm] = (cur + a[i]) % target }
                  }
              }
              return dp[full] == 0
          }
        `,
        rust: code`
          fn canPartitionKSubsets(nums: Vec<i32>, k: i32) -> bool {
              let total: i32 = nums.iter().sum();
              if total % k != 0 {
                  return false;
              }
              let target = total / k;
              let mut a = nums.clone();
              a.sort();
              let n = a.len();
              if a[n - 1] > target {
                  return false;
              }
              let full: usize = (1usize << n) - 1;
              let mut dp = vec![-1i32; full + 1];
              dp[0] = 0;
              for mask in 0..=full {
                  let cur = dp[mask];
                  if cur < 0 {
                      continue;
                  }
                  for i in 0..n {
                      if mask & (1 << i) != 0 {
                          continue;
                      }
                      if cur + a[i] > target {
                          break;
                      }
                      let nm = mask | (1 << i);
                      if dp[nm] < 0 {
                          dp[nm] = (cur + a[i]) % target;
                      }
                  }
              }
              dp[full] == 0
          }
        `,
        php: code`
          function canPartitionKSubsets($nums, $k) {
              $total = array_sum($nums);
              if ($total % $k != 0) return false;
              $target = intdiv($total, $k);
              $a = $nums;
              sort($a);
              $n = count($a);
              if ($a[$n - 1] > $target) return false;
              $full = (1 << $n) - 1;
              $dp = array_fill(0, $full + 1, -1);
              $dp[0] = 0;
              for ($mask = 0; $mask <= $full; $mask++) {
                  $cur = $dp[$mask];
                  if ($cur < 0) continue;
                  for ($i = 0; $i < $n; $i++) {
                      if ($mask & (1 << $i)) continue;
                      if ($cur + $a[$i] > $target) break;
                      $nm = $mask | (1 << $i);
                      if ($dp[$nm] < 0) $dp[$nm] = ($cur + $a[$i]) % $target;
                  }
              }
              return $dp[$full] == 0;
          }
        `,
        ruby: code`
          def canPartitionKSubsets(nums, k)
            total = nums.sum
            return false if total % k != 0
            target = total / k
            a = nums.sort
            n = a.length
            return false if a[n - 1] > target
            full = (1 << n) - 1
            dp = Array.new(full + 1, -1)
            dp[0] = 0
            (0..full).each do |mask|
              cur = dp[mask]
              next if cur < 0
              n.times do |i|
                next if mask & (1 << i) != 0
                break if cur + a[i] > target
                nm = mask | (1 << i)
                dp[nm] = (cur + a[i]) % target if dp[nm] < 0
              end
            end
            dp[full] == 0
          end
        `,
      },
    };
  })(),

  // ── Binary Trees With Factors (LC 823) ──────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      // Count trees rooted at each value with exact BigInt arithmetic.
      const vals = arr.slice().sort((a, b) => a - b);
      const have = new Set(vals);
      const ways = new Map<number, bigint>();
      const M = BigInt(MOD);
      let total = BigInt(0);
      for (const v of vals) {
        let w = BigInt(1);
        for (const a of vals) {
          if (a >= v) break;
          if (v % a === 0 && have.has(v / a)) w += ways.get(a)! * ways.get(v / a)!;
        }
        w %= M;
        ways.set(v, w);
        total += w;
      }
      return Number(total % M);
    };
    return {
      slug: "binary-trees-with-factors",
      title: "Binary Trees With Factors",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Sorting", "Amazon", "Google"],
      signature: { funcName: "numFactoredBinaryTrees", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`arr` holds **distinct** integers, each greater than 1. Build binary trees whose node values are taken from `arr` — any value may be used any number of times — subject to one rule: every non-leaf node has exactly two children and its value equals the **product** of its children's values.\n\nCount how many such trees exist. A single node is a tree; two trees are different if their shapes or any node values differ (so swapping the two children of a node gives a different tree when the children differ).\n\nReturn the count modulo `10^9 + 7`.",
        [
          { in: "arr = [2,4]", out: "3", note: "`[2]`, `[4]` and `4` with children `2, 2`." },
          { in: "arr = [2,4,5,10]", out: "7", note: "Four single nodes, `4 → (2,2)`, `10 → (2,5)` and `10 → (5,2)`." },
          { in: "arr = [3,7,11]", out: "3" },
        ],
        ["1 <= arr.length <= 1000", "2 <= arr[i] <= 10^9", "All values of arr are distinct"]),
      hints: [
        "The root's value is the product of its children's values, so both children are smaller than the root.",
        "Process values in increasing order and count the trees rooted at each value.",
        "trees(v) = 1 + Σ trees(a) · trees(v / a) over every `a` in `arr` that divides `v` with `v / a` also in `arr`.",
      ],
      editorial: explain({
        idea: "A tree rooted at `v` is either the single node `v` or a choice of left child value `a` and right child value `v / a` (both in `arr`) with any tree under each. Children are strictly smaller, so counting in increasing order of value works.",
        steps: [
          "Sort `arr` and index each value with a hash map.",
          "For each value `v` in increasing order, start `ways[v] = 1` (the leaf).",
          "For every smaller `a` that divides `v` where `b = v / a` is in the map, add `ways[a] · ways[b]` (mod `10^9 + 7`).",
          "Return the sum of `ways` over all values, modulo `10^9 + 7`.",
        ],
        why: "Every tree with root `v` and at least two nodes is determined uniquely by the ordered pair (left subtree, right subtree), whose roots multiply to `v`. Summing over ordered divisor pairs `(a, v/a)` counts each such pair of subtrees exactly once — `(a, b)` and `(b, a)` are distinct when `a ≠ b`, matching the rule that mirrored trees differ.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Products of two residues reach about 10^18: multiply in 64-bit (and in JavaScript split the multiplication, since doubles are exact only to 2^53).",
          "The pair `(a, a)` with `v = a²` must be counted once, not twice.",
          "Values reach 10^9, so never compute `a · b` in 32-bit to test for a factor — test `v % a == 0` instead.",
        ],
      }),
      examples: [
        { input: "[2,4]", expectedOutput: "3" },
        { input: "[2,4,5,10]", expectedOutput: "7" },
        { input: "[3,7,11]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const kind = ri(rng, 0, 4);
        let pool: number[];
        if (kind === 0) {
          pool = Array.from({ length: 59 }, (_, i) => i + 2);
        } else if (kind === 1) {
          pool = Array.from({ length: 29 }, (_, i) => 2 ** (i + 1));
        } else if (kind === 2) {
          pool = [];
          for (let a = 1; a <= 1e9; a *= 2) for (let b = a; b <= 1e9; b *= 3) for (let c = b; c <= 1e9; c *= 5) if (c >= 2) pool.push(c);
        } else if (kind === 3) {
          pool = Array.from({ length: 200 }, (_, i) => i + 2);
        } else {
          pool = Array.from({ length: 80 }, () => ri(rng, 2, 1e9));
          const base = ri(rng, 2, 40);
          for (let x = base; x <= 1e9; x *= base) pool.push(x);
        }
        pool = Array.from(new Set(pool));
        shuffle(rng, pool);
        const size = rng() < 0.2 ? ri(rng, 1, 4) : ri(rng, 5, Math.min(45, pool.length));
        const arr = pool.slice(0, size);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numFactoredBinaryTrees(arr: List[int]) -> int:
              MOD = 10**9 + 7
              a = sorted(arr)
              pos = {v: i for i, v in enumerate(a)}
              ways = [1] * len(a)
              for i in range(len(a)):
                  for j in range(i):
                      if a[i] % a[j] == 0:
                          q = a[i] // a[j]
                          if q in pos:
                              ways[i] = (ways[i] + ways[j] * ways[pos[q]]) % MOD
              return sum(ways) % MOD
        `,
        javascript: code`
          var numFactoredBinaryTrees = function(arr) {
              var MOD = 1000000007;
              var mulmod = function(x, y) {
                  return ((x * (y >>> 16)) % MOD * 65536 + x * (y & 65535)) % MOD;
              };
              var a = arr.slice().sort(function(x, y) { return x - y; });
              var pos = new Map();
              for (var i = 0; i < a.length; i++) pos.set(a[i], i);
              var ways = new Array(a.length).fill(1);
              var total = 0;
              for (i = 0; i < a.length; i++) {
                  for (var j = 0; j < i; j++) {
                      if (a[i] % a[j] === 0) {
                          var q = a[i] / a[j];
                          if (pos.has(q)) ways[i] = (ways[i] + mulmod(ways[j], ways[pos.get(q)])) % MOD;
                      }
                  }
                  total = (total + ways[i]) % MOD;
              }
              return total;
          };
        `,
        typescript: code`
          function numFactoredBinaryTrees(arr: number[]): number {
              var MOD = 1000000007;
              var mulmod = function (x: number, y: number): number {
                  return ((x * (y >>> 16)) % MOD * 65536 + x * (y & 65535)) % MOD;
              };
              var a = arr.slice().sort(function (x, y) { return x - y; });
              var pos: { [k: string]: number } = {};
              for (var i = 0; i < a.length; i++) pos["" + a[i]] = i;
              var ways: number[] = [];
              var total = 0;
              for (i = 0; i < a.length; i++) {
                  ways.push(1);
                  for (var j = 0; j < i; j++) {
                      if (a[i] % a[j] === 0) {
                          var key = "" + (a[i] / a[j]);
                          if (pos.hasOwnProperty(key)) ways[i] = (ways[i] + mulmod(ways[j], ways[pos[key]])) % MOD;
                      }
                  }
                  total = (total + ways[i]) % MOD;
              }
              return total;
          }
        `,
        java: code`
          public static int numFactoredBinaryTrees(int[] arr) {
              final long MOD = 1000000007L;
              int[] a = arr.clone();
              Arrays.sort(a);
              int n = a.length;
              Map<Integer, Integer> pos = new HashMap<>();
              for (int i = 0; i < n; i++) pos.put(a[i], i);
              long[] ways = new long[n];
              long total = 0;
              for (int i = 0; i < n; i++) {
                  ways[i] = 1;
                  for (int j = 0; j < i; j++) {
                      if (a[i] % a[j] == 0) {
                          Integer q = pos.get(a[i] / a[j]);
                          if (q != null) ways[i] = (ways[i] + ways[j] * ways[q]) % MOD;
                      }
                  }
                  total = (total + ways[i]) % MOD;
              }
              return (int) total;
          }
        `,
        cpp: code`
          int numFactoredBinaryTrees(vector<int>& arr) {
              const long long MOD = 1000000007LL;
              vector<int> a(arr.begin(), arr.end());
              sort(a.begin(), a.end());
              int n = a.size();
              unordered_map<int, int> pos;
              for (int i = 0; i < n; i++) pos[a[i]] = i;
              vector<long long> ways(n, 1);
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < i; j++) {
                      if (a[i] % a[j] == 0) {
                          auto it = pos.find(a[i] / a[j]);
                          if (it != pos.end()) ways[i] = (ways[i] + ways[j] * ways[it->second]) % MOD;
                      }
                  }
                  total = (total + ways[i]) % MOD;
              }
              return (int) total;
          }
        `,
        c: code`
          static int cmpAscBt(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          static int findIdxBt(const int* a, int n, int target) {
              int lo = 0, hi = n - 1;
              while (lo <= hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (a[mid] == target) return mid;
                  if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }

          int numFactoredBinaryTrees(int* arr, int arrSize) {
              const long long MOD = 1000000007LL;
              int n = arrSize;
              int* a = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) a[i] = arr[i];
              qsort(a, n, sizeof(int), cmpAscBt);
              long long* ways = (long long*)malloc(sizeof(long long) * n);
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  ways[i] = 1;
                  for (int j = 0; j < i; j++) {
                      if (a[i] % a[j] == 0) {
                          int q = findIdxBt(a, n, a[i] / a[j]);
                          if (q >= 0) ways[i] = (ways[i] + ways[j] * ways[q]) % MOD;
                      }
                  }
                  total = (total + ways[i]) % MOD;
              }
              free(a);
              free(ways);
              return (int) total;
          }
        `,
        csharp: code`
          public static int NumFactoredBinaryTrees(int[] arr)
          {
              const long MOD = 1000000007L;
              int[] a = (int[])arr.Clone();
              Array.Sort(a);
              int n = a.Length;
              var pos = new Dictionary<int, int>();
              for (int i = 0; i < n; i++) pos[a[i]] = i;
              long[] ways = new long[n];
              long total = 0;
              for (int i = 0; i < n; i++)
              {
                  ways[i] = 1;
                  for (int j = 0; j < i; j++)
                  {
                      if (a[i] % a[j] == 0)
                      {
                          int q;
                          if (pos.TryGetValue(a[i] / a[j], out q)) ways[i] = (ways[i] + ways[j] * ways[q]) % MOD;
                      }
                  }
                  total = (total + ways[i]) % MOD;
              }
              return (int)total;
          }
        `,
        go: code`
          func numFactoredBinaryTrees(arr []int) int {
          	const MOD = 1000000007
          	a := make([]int, len(arr))
          	copy(a, arr)
          	sort.Ints(a)
          	n := len(a)
          	pos := map[int]int{}
          	for i, v := range a {
          		pos[v] = i
          	}
          	ways := make([]int, n)
          	total := 0
          	for i := 0; i < n; i++ {
          		ways[i] = 1
          		for j := 0; j < i; j++ {
          			if a[i]%a[j] == 0 {
          				if q, ok := pos[a[i]/a[j]]; ok {
          					ways[i] = (ways[i] + ways[j]*ways[q]) % MOD
          				}
          			}
          		}
          		total = (total + ways[i]) % MOD
          	}
          	return total
          }
        `,
        kotlin: code`
          fun numFactoredBinaryTrees(arr: IntArray): Int {
              val MOD = 1000000007L
              val a = arr.sortedArray()
              val n = a.size
              val pos = HashMap<Int, Int>()
              for (i in 0 until n) pos[a[i]] = i
              val ways = LongArray(n)
              var total = 0L
              for (i in 0 until n) {
                  ways[i] = 1L
                  for (j in 0 until i) {
                      if (a[i] % a[j] == 0) {
                          val q = pos[a[i] / a[j]]
                          if (q != null) ways[i] = (ways[i] + ways[j] * ways[q]) % MOD
                      }
                  }
                  total = (total + ways[i]) % MOD
              }
              return total.toInt()
          }
        `,
        swift: code`
          func numFactoredBinaryTrees(_ arr: [Int]) -> Int {
              let MOD = 1000000007
              let a = arr.sorted()
              let n = a.count
              var pos = [Int: Int]()
              for i in 0..<n { pos[a[i]] = i }
              var ways = [Int](repeating: 1, count: n)
              var total = 0
              for i in 0..<n {
                  for j in 0..<i {
                      if a[i] % a[j] == 0, let q = pos[a[i] / a[j]] {
                          ways[i] = (ways[i] + ways[j] * ways[q]) % MOD
                      }
                  }
                  total = (total + ways[i]) % MOD
              }
              return total
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn numFactoredBinaryTrees(arr: Vec<i32>) -> i32 {
              let md: i64 = 1000000007;
              let mut a = arr.clone();
              a.sort();
              let n = a.len();
              let mut pos: HashMap<i32, usize> = HashMap::new();
              for i in 0..n {
                  pos.insert(a[i], i);
              }
              let mut ways = vec![1i64; n];
              let mut total: i64 = 0;
              for i in 0..n {
                  for j in 0..i {
                      if a[i] % a[j] == 0 {
                          if let Some(&q) = pos.get(&(a[i] / a[j])) {
                              ways[i] = (ways[i] + ways[j] * ways[q]) % md;
                          }
                      }
                  }
                  total = (total + ways[i]) % md;
              }
              total as i32
          }
        `,
        php: code`
          function numFactoredBinaryTrees($arr) {
              $MOD = 1000000007;
              $a = $arr;
              sort($a);
              $n = count($a);
              $pos = [];
              for ($i = 0; $i < $n; $i++) $pos[$a[$i]] = $i;
              $ways = array_fill(0, $n, 1);
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $i; $j++) {
                      if ($a[$i] % $a[$j] == 0) {
                          $q = intdiv($a[$i], $a[$j]);
                          if (isset($pos[$q])) $ways[$i] = ($ways[$i] + $ways[$j] * $ways[$pos[$q]]) % $MOD;
                      }
                  }
                  $total = ($total + $ways[$i]) % $MOD;
              }
              return $total;
          }
        `,
        ruby: code`
          def numFactoredBinaryTrees(arr)
            md = 1_000_000_007
            a = arr.sort
            pos = {}
            a.each_with_index { |v, i| pos[v] = i }
            ways = Array.new(a.length, 1)
            total = 0
            a.length.times do |i|
              i.times do |j|
                if a[i] % a[j] == 0
                  q = pos[a[i] / a[j]]
                  ways[i] = (ways[i] + ways[j] * ways[q]) % md if q
                end
              end
              total = (total + ways[i]) % md
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Length of Longest Fibonacci Subsequence (LC 873) ────────────
  (() => {
    const ref = (arr: number[]) => {
      const have = new Set(arr);
      let best = 0;
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          let x = arr[i], y = arr[j], len = 2;
          while (have.has(x + y)) { const z = x + y; x = y; y = z; len++; }
          if (len > best) best = len;
        }
      }
      return best >= 3 ? best : 0;
    };
    return {
      slug: "length-of-longest-fibonacci-subsequence",
      title: "Length of Longest Fibonacci Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "lenLongestFibSubseq", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A sequence `x1, x2, ..., xk` is **Fibonacci-like** when `k >= 3` and every term from the third on is the sum of the two before it: `x(i) + x(i+1) == x(i+2)`.\n\n`arr` is **strictly increasing**. Return the length of the longest Fibonacci-like subsequence of `arr` (keep elements in their original order, deleting any others), or `0` if there is none.",
        [
          { in: "arr = [1,2,3,4,5,6,7,8]", out: "5", note: "`[1,2,3,5,8]`." },
          { in: "arr = [1,3,7,11,12,14,18]", out: "3", note: "For example `[1,11,12]` or `[7,11,18]`." },
          { in: "arr = [2,4,7]", out: "0" },
        ],
        ["3 <= arr.length <= 1000", "1 <= arr[i] < arr[i + 1] <= 10^9"]),
      hints: [
        "A Fibonacci-like sequence is fixed once you know its first two terms — or its last two.",
        "Let `dp[j][k]` be the longest such sequence ending with `arr[j], arr[k]` (j < k).",
        "The term before `arr[j]` must be `arr[k] - arr[j]`; if it exists at index `i < j` (look it up in a hash map), then `dp[j][k] = dp[i][j] + 1`.",
      ],
      editorial: explain({
        idea: "Index states by the last two elements. Because `arr` is strictly increasing, the element preceding the pair `(arr[j], arr[k])` is forced to be `arr[k] - arr[j]`, and it must be smaller than `arr[j]`.",
        steps: [
          "Map every value to its index.",
          "For every pair `j < k`, let `p = arr[k] - arr[j]`. If `p < arr[j]` and `p` is in the map at index `i`, set `dp[j][k] = dp[i][j] + 1`, where a missing `dp[i][j]` counts as 2.",
          "Track the largest `dp` value produced; it is at least 3 whenever any extension happened.",
          "Return that maximum, or 0 if no pair was ever extended.",
        ],
        why: "Every Fibonacci-like subsequence ending in `(arr[j], arr[k])` has a unique predecessor term, so the longest one ending in that pair is one longer than the longest ending in `(arr[i], arr[j])`. Requiring `p < arr[j]` keeps the indices in order (the array is increasing), so the subsequence order is respected.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Return 0, not 2, when no three elements form a Fibonacci-like triple.",
          "Without the `p < arr[j]` check you could use an element that comes after `arr[j]`.",
          "Values reach 10^9 — compute the difference `arr[k] - arr[j]`, never the sum of two values in 32-bit arithmetic.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6,7,8]", expectedOutput: "5" },
        { input: "[1,3,7,11,12,14,18]", expectedOutput: "3" },
        { input: "[2,4,7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const r = rng();
        const n = r < 0.4 ? ri(rng, 3, 8) : r < 0.85 ? ri(rng, 9, 20) : ri(rng, 21, 32);
        const s = new Set<number>();
        const kind = ri(rng, 0, 3);
        if (kind === 0) {
          // dense small values: many triples
          const hi = Math.max(n, pick(rng, [n + 3, 2 * n, 60]));
          while (s.size < n) s.add(ri(rng, 1, hi));
        } else if (kind === 1 || kind === 2) {
          // plant one or two Fibonacci-like chains, then pad with noise
          const chains = kind === 1 ? 1 : 2;
          for (let c = 0; c < chains && s.size < n; c++) {
            let x = ri(rng, 1, pick(rng, [5, 50, 10000]));
            let y = x + ri(rng, 1, pick(rng, [5, 50, 10000]));
            const want = ri(rng, 3, Math.max(3, Math.min(n, 30)));
            let added = 0;
            while (added < want && s.size < n && x <= 1e9) {
              if (!s.has(x)) { s.add(x); added++; }
              const z = x + y; x = y; y = z;
            }
          }
          const hi = pick(rng, [100, 1000, 1e9]);
          while (s.size < n) s.add(ri(rng, 1, hi));
        } else {
          while (s.size < n) s.add(ri(rng, 1, 1e9));
        }
        const arr = Array.from(s).sort((a, b) => a - b);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def lenLongestFibSubseq(arr: List[int]) -> int:
              n = len(arr)
              pos = {v: i for i, v in enumerate(arr)}
              dp = [[2] * n for _ in range(n)]
              best = 0
              for k in range(n):
                  for j in range(k):
                      p = arr[k] - arr[j]
                      if p < arr[j] and p in pos:
                          i = pos[p]
                          dp[j][k] = dp[i][j] + 1
                          if dp[j][k] > best:
                              best = dp[j][k]
              return best
        `,
        javascript: code`
          var lenLongestFibSubseq = function(arr) {
              var n = arr.length;
              var pos = new Map();
              for (var i = 0; i < n; i++) pos.set(arr[i], i);
              var dp = [];
              for (i = 0; i < n; i++) dp.push(new Array(n).fill(2));
              var best = 0;
              for (var k = 0; k < n; k++) {
                  for (var j = 0; j < k; j++) {
                      var p = arr[k] - arr[j];
                      if (p < arr[j] && pos.has(p)) {
                          dp[j][k] = dp[pos.get(p)][j] + 1;
                          if (dp[j][k] > best) best = dp[j][k];
                      }
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function lenLongestFibSubseq(arr: number[]): number {
              var n = arr.length;
              var pos: { [k: string]: number } = {};
              for (var i = 0; i < n; i++) pos["" + arr[i]] = i;
              var dp: number[][] = [];
              for (i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var t = 0; t < n; t++) row.push(2);
                  dp.push(row);
              }
              var best = 0;
              for (var k = 0; k < n; k++) {
                  for (var j = 0; j < k; j++) {
                      var p = arr[k] - arr[j];
                      var key = "" + p;
                      if (p < arr[j] && pos.hasOwnProperty(key)) {
                          dp[j][k] = dp[pos[key]][j] + 1;
                          if (dp[j][k] > best) best = dp[j][k];
                      }
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int lenLongestFibSubseq(int[] arr) {
              int n = arr.length;
              Map<Integer, Integer> pos = new HashMap<>();
              for (int i = 0; i < n; i++) pos.put(arr[i], i);
              int[][] dp = new int[n][n];
              int best = 0;
              for (int k = 0; k < n; k++) {
                  for (int j = 0; j < k; j++) {
                      dp[j][k] = 2;
                      int p = arr[k] - arr[j];
                      if (p < arr[j]) {
                          Integer i = pos.get(p);
                          if (i != null) {
                              dp[j][k] = dp[i][j] + 1;
                              if (dp[j][k] > best) best = dp[j][k];
                          }
                      }
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int lenLongestFibSubseq(vector<int>& arr) {
              int n = arr.size();
              unordered_map<int, int> pos;
              for (int i = 0; i < n; i++) pos[arr[i]] = i;
              vector<vector<int>> dp(n, vector<int>(n, 2));
              int best = 0;
              for (int k = 0; k < n; k++) {
                  for (int j = 0; j < k; j++) {
                      int p = arr[k] - arr[j];
                      if (p < arr[j]) {
                          auto it = pos.find(p);
                          if (it != pos.end()) {
                              dp[j][k] = dp[it->second][j] + 1;
                              best = max(best, dp[j][k]);
                          }
                      }
                  }
              }
              return best;
          }
        `,
        c: code`
          static int findIdxFib(const int* a, int n, int target) {
              int lo = 0, hi = n - 1;
              while (lo <= hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (a[mid] == target) return mid;
                  if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }

          int lenLongestFibSubseq(int* arr, int arrSize) {
              int n = arrSize;
              int* dp = (int*)malloc(sizeof(int) * n * n);
              for (int i = 0; i < n * n; i++) dp[i] = 2;
              int best = 0;
              for (int k = 0; k < n; k++) {
                  for (int j = 0; j < k; j++) {
                      int p = arr[k] - arr[j];
                      if (p < arr[j]) {
                          int i = findIdxFib(arr, j, p);
                          if (i >= 0) {
                              dp[j * n + k] = dp[i * n + j] + 1;
                              if (dp[j * n + k] > best) best = dp[j * n + k];
                          }
                      }
                  }
              }
              free(dp);
              return best;
          }
        `,
        csharp: code`
          public static int LenLongestFibSubseq(int[] arr)
          {
              int n = arr.Length;
              var pos = new Dictionary<int, int>();
              for (int i = 0; i < n; i++) pos[arr[i]] = i;
              int[,] dp = new int[n, n];
              int best = 0;
              for (int k = 0; k < n; k++)
              {
                  for (int j = 0; j < k; j++)
                  {
                      dp[j, k] = 2;
                      int p = arr[k] - arr[j];
                      int i;
                      if (p < arr[j] && pos.TryGetValue(p, out i))
                      {
                          dp[j, k] = dp[i, j] + 1;
                          if (dp[j, k] > best) best = dp[j, k];
                      }
                  }
              }
              return best;
          }
        `,
        go: code`
          func lenLongestFibSubseq(arr []int) int {
          	n := len(arr)
          	pos := map[int]int{}
          	for i, v := range arr {
          		pos[v] = i
          	}
          	dp := make([][]int, n)
          	for i := range dp {
          		dp[i] = make([]int, n)
          		for t := range dp[i] {
          			dp[i][t] = 2
          		}
          	}
          	best := 0
          	for k := 0; k < n; k++ {
          		for j := 0; j < k; j++ {
          			p := arr[k] - arr[j]
          			if p < arr[j] {
          				if i, ok := pos[p]; ok {
          					dp[j][k] = dp[i][j] + 1
          					if dp[j][k] > best {
          						best = dp[j][k]
          					}
          				}
          			}
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun lenLongestFibSubseq(arr: IntArray): Int {
              val n = arr.size
              val pos = HashMap<Int, Int>()
              for (i in 0 until n) pos[arr[i]] = i
              val dp = Array(n) { IntArray(n) { 2 } }
              var best = 0
              for (k in 0 until n) {
                  for (j in 0 until k) {
                      val p = arr[k] - arr[j]
                      if (p < arr[j]) {
                          val i = pos[p]
                          if (i != null) {
                              dp[j][k] = dp[i][j] + 1
                              if (dp[j][k] > best) best = dp[j][k]
                          }
                      }
                  }
              }
              return best
          }
        `,
        swift: code`
          func lenLongestFibSubseq(_ arr: [Int]) -> Int {
              let n = arr.count
              var pos = [Int: Int]()
              for i in 0..<n { pos[arr[i]] = i }
              var dp = [[Int]](repeating: [Int](repeating: 2, count: n), count: n)
              var best = 0
              for k in 0..<n {
                  for j in 0..<k {
                      let p = arr[k] - arr[j]
                      if p < arr[j], let i = pos[p] {
                          dp[j][k] = dp[i][j] + 1
                          if dp[j][k] > best { best = dp[j][k] }
                      }
                  }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn lenLongestFibSubseq(arr: Vec<i32>) -> i32 {
              let n = arr.len();
              let mut pos: HashMap<i32, usize> = HashMap::new();
              for i in 0..n {
                  pos.insert(arr[i], i);
              }
              let mut dp = vec![vec![2i32; n]; n];
              let mut best = 0;
              for k in 0..n {
                  for j in 0..k {
                      let p = arr[k] - arr[j];
                      if p < arr[j] {
                          if let Some(&i) = pos.get(&p) {
                              dp[j][k] = dp[i][j] + 1;
                              if dp[j][k] > best {
                                  best = dp[j][k];
                              }
                          }
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function lenLongestFibSubseq($arr) {
              $n = count($arr);
              $pos = [];
              for ($i = 0; $i < $n; $i++) $pos[$arr[$i]] = $i;
              $dp = array_fill(0, $n, array_fill(0, $n, 2));
              $best = 0;
              for ($k = 0; $k < $n; $k++) {
                  for ($j = 0; $j < $k; $j++) {
                      $p = $arr[$k] - $arr[$j];
                      if ($p < $arr[$j] && isset($pos[$p])) {
                          $dp[$j][$k] = $dp[$pos[$p]][$j] + 1;
                          if ($dp[$j][$k] > $best) $best = $dp[$j][$k];
                      }
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def lenLongestFibSubseq(arr)
            n = arr.length
            pos = {}
            arr.each_with_index { |v, i| pos[v] = i }
            dp = Array.new(n) { Array.new(n, 2) }
            best = 0
            n.times do |k|
              k.times do |j|
                prev = arr[k] - arr[j]
                next unless prev < arr[j]
                i = pos[prev]
                next if i.nil?
                dp[j][k] = dp[i][j] + 1
                best = dp[j][k] if dp[j][k] > best
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Score Triangulation of Polygon (LC 1039) ────────────
  (() => {
    const ref = (values: number[]) => {
      const n = values.length;
      const memo = new Map<number, number>();
      const best = (i: number, j: number): number => {
        if (j - i < 2) return 0;
        const key = i * 64 + j;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let res = Infinity;
        for (let k = i + 1; k < j; k++) res = Math.min(res, best(i, k) + best(k, j) + values[i] * values[k] * values[j]);
        memo.set(key, res);
        return res;
      };
      return best(0, n - 1);
    };
    return {
      slug: "minimum-score-triangulation-of-polygon",
      title: "Minimum Score Triangulation of Polygon",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Uber"],
      signature: { funcName: "minScoreTriangulation", params: [{ name: "values", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A convex polygon has `n` vertices, and `values[i]` is the label of the `i`-th vertex in clockwise order.\n\nCut the polygon into `n - 2` triangles using non-crossing diagonals (a **triangulation**). Each triangle scores the **product** of the labels of its three vertices, and a triangulation scores the sum of its triangles' scores.\n\nReturn the smallest score any triangulation can achieve.",
        [
          { in: "values = [2,4,3]", out: "24", note: "Already a triangle: 2 · 4 · 3." },
          { in: "values = [1,5,2,4]", out: "18", note: "Diagonal 0–2 gives 1·5·2 + 1·2·4 = 18; diagonal 1–3 gives 60." },
          { in: "values = [1,3,1,4,1,5]", out: "13" },
        ],
        ["n == values.length", "3 <= n <= 50", "1 <= values[i] <= 100"]),
      hints: [
        "In any triangulation, the edge between vertex 0 and vertex n-1 belongs to exactly one triangle.",
        "If that triangle's third vertex is `k`, the rest splits into two independent smaller polygons: `0..k` and `k..n-1`.",
        "Let `dp[i][j]` be the best score for the polygon formed by vertices `i..j`; try every `k` strictly between them.",
      ],
      editorial: explain({
        idea: "Interval DP. For the sub-polygon on vertices `i..j`, the side `(i, j)` lies in exactly one triangle `(i, k, j)`, and choosing `k` splits the remainder into the sub-polygons `i..k` and `k..j`.",
        steps: [
          "`dp[i][j] = 0` when `j - i < 2` (an edge, nothing to triangulate).",
          "For increasing gap `j - i` from 2 to `n - 1`: `dp[i][j] = min over i < k < j of dp[i][k] + dp[k][j] + values[i]·values[k]·values[j]`.",
          "Return `dp[0][n-1]`.",
        ],
        why: "Every triangulation of `i..j` contains exactly one triangle on the side `(i, j)`, and the diagonals `(i, k)` and `(k, j)` separate the rest into two polygons that are triangulated independently. Taking the minimum over all `k` therefore covers every triangulation, and the two halves can each be chosen optimally on their own.",
        time: "O(n³)",
        space: "O(n²)",
        pitfalls: [
          "Fill the table by increasing interval length so both halves are ready.",
          "The polygon is cyclic, but fixing the side `(0, n-1)` removes the need for wrap-around.",
          "The answer can reach about 5·10^7, which fits in 32 bits — no modulus is involved.",
        ],
      }),
      examples: [
        { input: "[2,4,3]", expectedOutput: "24" },
        { input: "[1,5,2,4]", expectedOutput: "18" },
        { input: "[1,3,1,4,1,5]", expectedOutput: "13" },
      ],
      gen: (rng: Rng) => {
        const r = rng();
        const n = r < 0.3 ? ri(rng, 3, 6) : r < 0.85 ? ri(rng, 7, 14) : ri(rng, 15, 22);
        const hi = pick(rng, [3, 10, 100, 100]);
        const values = rng() < 0.08 ? new Array(n).fill(ri(rng, 1, 100)) : Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(values), expectedOutput: String(ref(values)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minScoreTriangulation(values: List[int]) -> int:
              n = len(values)
              dp = [[0] * n for _ in range(n)]
              for gap in range(2, n):
                  for i in range(n - gap):
                      j = i + gap
                      best = -1
                      for k in range(i + 1, j):
                          cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j]
                          if best < 0 or cand < best:
                              best = cand
                      dp[i][j] = best
              return dp[0][n - 1]
        `,
        javascript: code`
          var minScoreTriangulation = function(values) {
              var n = values.length;
              var dp = [];
              for (var i = 0; i < n; i++) dp.push(new Array(n).fill(0));
              for (var gap = 2; gap < n; gap++) {
                  for (i = 0; i + gap < n; i++) {
                      var j = i + gap;
                      var best = -1;
                      for (var k = i + 1; k < j; k++) {
                          var cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j];
                          if (best < 0 || cand < best) best = cand;
                      }
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          };
        `,
        typescript: code`
          function minScoreTriangulation(values: number[]): number {
              var n = values.length;
              var dp: number[][] = [];
              for (var i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var t = 0; t < n; t++) row.push(0);
                  dp.push(row);
              }
              for (var gap = 2; gap < n; gap++) {
                  for (i = 0; i + gap < n; i++) {
                      var j = i + gap;
                      var best = -1;
                      for (var k = i + 1; k < j; k++) {
                          var cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j];
                          if (best < 0 || cand < best) best = cand;
                      }
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          }
        `,
        java: code`
          public static int minScoreTriangulation(int[] values) {
              int n = values.length;
              int[][] dp = new int[n][n];
              for (int gap = 2; gap < n; gap++) {
                  for (int i = 0; i + gap < n; i++) {
                      int j = i + gap;
                      int best = -1;
                      for (int k = i + 1; k < j; k++) {
                          int cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j];
                          if (best < 0 || cand < best) best = cand;
                      }
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          }
        `,
        cpp: code`
          int minScoreTriangulation(vector<int>& values) {
              int n = values.size();
              vector<vector<int>> dp(n, vector<int>(n, 0));
              for (int gap = 2; gap < n; gap++) {
                  for (int i = 0; i + gap < n; i++) {
                      int j = i + gap;
                      int best = -1;
                      for (int k = i + 1; k < j; k++) {
                          int cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j];
                          if (best < 0 || cand < best) best = cand;
                      }
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          }
        `,
        c: code`
          int minScoreTriangulation(int* values, int valuesSize) {
              int n = valuesSize;
              static int dp[50][50];
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < n; j++) dp[i][j] = 0;
              for (int gap = 2; gap < n; gap++) {
                  for (int i = 0; i + gap < n; i++) {
                      int j = i + gap;
                      int best = -1;
                      for (int k = i + 1; k < j; k++) {
                          int cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j];
                          if (best < 0 || cand < best) best = cand;
                      }
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          }
        `,
        csharp: code`
          public static int MinScoreTriangulation(int[] values)
          {
              int n = values.Length;
              int[,] dp = new int[n, n];
              for (int gap = 2; gap < n; gap++)
              {
                  for (int i = 0; i + gap < n; i++)
                  {
                      int j = i + gap;
                      int best = -1;
                      for (int k = i + 1; k < j; k++)
                      {
                          int cand = dp[i, k] + dp[k, j] + values[i] * values[k] * values[j];
                          if (best < 0 || cand < best) best = cand;
                      }
                      dp[i, j] = best;
                  }
              }
              return dp[0, n - 1];
          }
        `,
        go: code`
          func minScoreTriangulation(values []int) int {
          	n := len(values)
          	dp := make([][]int, n)
          	for i := range dp {
          		dp[i] = make([]int, n)
          	}
          	for gap := 2; gap < n; gap++ {
          		for i := 0; i+gap < n; i++ {
          			j := i + gap
          			best := -1
          			for k := i + 1; k < j; k++ {
          				cand := dp[i][k] + dp[k][j] + values[i]*values[k]*values[j]
          				if best < 0 || cand < best {
          					best = cand
          				}
          			}
          			dp[i][j] = best
          		}
          	}
          	return dp[0][n-1]
          }
        `,
        kotlin: code`
          fun minScoreTriangulation(values: IntArray): Int {
              val n = values.size
              val dp = Array(n) { IntArray(n) }
              for (gap in 2 until n) {
                  for (i in 0 until n - gap) {
                      val j = i + gap
                      var best = -1
                      for (k in i + 1 until j) {
                          val cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j]
                          if (best < 0 || cand < best) best = cand
                      }
                      dp[i][j] = best
                  }
              }
              return dp[0][n - 1]
          }
        `,
        swift: code`
          func minScoreTriangulation(_ values: [Int]) -> Int {
              let n = values.count
              var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)
              if n < 3 { return 0 }
              for gap in 2..<n {
                  for i in 0..<(n - gap) {
                      let j = i + gap
                      var best = -1
                      for k in (i + 1)..<j {
                          let cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j]
                          if best < 0 || cand < best { best = cand }
                      }
                      dp[i][j] = best
                  }
              }
              return dp[0][n - 1]
          }
        `,
        rust: code`
          fn minScoreTriangulation(values: Vec<i32>) -> i32 {
              let n = values.len();
              let mut dp = vec![vec![0i32; n]; n];
              for gap in 2..n {
                  for i in 0..(n - gap) {
                      let j = i + gap;
                      let mut best = -1;
                      for k in (i + 1)..j {
                          let cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j];
                          if best < 0 || cand < best {
                              best = cand;
                          }
                      }
                      dp[i][j] = best;
                  }
              }
              dp[0][n - 1]
          }
        `,
        php: code`
          function minScoreTriangulation($values) {
              $n = count($values);
              $dp = array_fill(0, $n, array_fill(0, $n, 0));
              for ($gap = 2; $gap < $n; $gap++) {
                  for ($i = 0; $i + $gap < $n; $i++) {
                      $j = $i + $gap;
                      $best = -1;
                      for ($k = $i + 1; $k < $j; $k++) {
                          $cand = $dp[$i][$k] + $dp[$k][$j] + $values[$i] * $values[$k] * $values[$j];
                          if ($best < 0 || $cand < $best) $best = $cand;
                      }
                      $dp[$i][$j] = $best;
                  }
              }
              return $dp[0][$n - 1];
          }
        `,
        ruby: code`
          def minScoreTriangulation(values)
            n = values.length
            dp = Array.new(n) { Array.new(n, 0) }
            (2...n).each do |gap|
              (0...(n - gap)).each do |i|
                j = i + gap
                best = -1
                ((i + 1)...j).each do |k|
                  cand = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j]
                  best = cand if best < 0 || cand < best
                end
                dp[i][j] = best
              end
            end
            dp[0][n - 1]
          end
        `,
      },
    };
  })(),

  // ── Filling Bookcase Shelves (LC 1105) ──────────────────────────
  (() => {
    const ref = (books: number[][], shelfWidth: number) => {
      // best(i) = least total height to shelve books i..n-1, trying every first-shelf size
      const n = books.length;
      const memo: number[] = [];
      const best = (i: number): number => {
        if (i === n) return 0;
        if (memo[i] !== undefined) return memo[i];
        let res = Infinity, w = 0, h = 0;
        for (let j = i; j < n; j++) {
          w += books[j][0];
          if (w > shelfWidth) break;
          h = Math.max(h, books[j][1]);
          res = Math.min(res, h + best(j + 1));
        }
        memo[i] = res;
        return res;
      };
      return best(0);
    };
    return {
      slug: "filling-bookcase-shelves",
      title: "Filling Bookcase Shelves",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "minHeightShelves",
        params: [{ name: "books", type: "int[][]" as const }, { name: "shelfWidth", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "`books[i] = [thickness_i, height_i]` describes the `i`-th book. The books must go onto a bookcase **in the given order**: fill a shelf with a consecutive run of books, then start a new shelf below it for the next run, and so on.\n\nThe books on one shelf may have total thickness at most `shelfWidth`. A shelf is as tall as its tallest book, and the bookcase is as tall as the sum of its shelves' heights.\n\nReturn the minimum possible height of the bookcase.",
        [
          { in: "books = [[2,5],[3,1],[1,4]], shelfWidth = 4", out: "9", note: "Shelf 1 holds `[2,5]` (height 5); shelf 2 holds `[3,1]` and `[1,4]` (width 4, height 4)." },
          { in: "books = [[1,1],[2,3],[2,3],[1,1],[1,1],[1,1],[1,2]], shelfWidth = 4", out: "6", note: "Shelves `[1,1]`, then `[2,3],[2,3]`, then the last four books: 1 + 3 + 2." },
          { in: "books = [[3,7]], shelfWidth = 5", out: "7" },
        ],
        ["1 <= books.length <= 1000", "1 <= thickness_i <= shelfWidth <= 1000", "1 <= height_i <= 1000"]),
      hints: [
        "Think about which books share the **last** shelf: always a suffix of the books placed so far.",
        "Let `dp[i]` be the minimum height for the first `i` books.",
        "For `dp[i]`, extend the last shelf backwards from book `i` while the width allows, tracking its tallest book: `dp[i] = min(dp[j] + maxHeight(j..i-1))`.",
      ],
      editorial: explain({
        idea: "Because the order is fixed, a bookcase is just a way to cut the sequence into consecutive runs whose widths fit. The last run is some suffix, which gives a one-dimensional DP over prefixes.",
        steps: [
          "`dp[0] = 0`.",
          "For `i = 1..n`: walk `j` from `i` down to 1, adding book `j-1` to the last shelf; stop once the width exceeds `shelfWidth`.",
          "While walking, keep the shelf's maximum height `h` and update `dp[i] = min(dp[i], dp[j-1] + h)`.",
          "Return `dp[n]`.",
        ],
        why: "Any arrangement of the first `i` books ends with a shelf holding books `j-1..i-1` for some `j`, and the shelves above it form an arrangement of the first `j-1` books, whose best height is `dp[j-1]`. Trying every feasible `j` therefore finds the optimum.",
        time: "O(n²) (O(n · shelfWidth) when thicknesses are at least 1)",
        space: "O(n)",
        pitfalls: [
          "Books cannot be reordered — this is not a bin-packing problem.",
          "Stop extending the shelf as soon as the width overflows; earlier books only add width.",
          "Every single book fits on a shelf by the constraints, so `dp[i]` is always finite.",
        ],
      }),
      examples: [
        { input: "[[2,5],[3,1],[1,4]]\n4", expectedOutput: "9" },
        { input: "[[1,1],[2,3],[2,3],[1,1],[1,1],[1,1],[1,2]]\n4", expectedOutput: "6" },
        { input: "[[3,7]]\n5", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const r = rng();
        const n = r < 0.25 ? ri(rng, 1, 4) : r < 0.85 ? ri(rng, 5, 25) : ri(rng, 26, 60);
        const shelfWidth = pick(rng, [1, ri(rng, 2, 6), ri(rng, 5, 20), ri(rng, 20, 1000)]);
        const tHi = pick(rng, [shelfWidth, Math.max(1, Math.floor(shelfWidth / 3))]);
        const hHi = pick(rng, [5, 50, 1000]);
        const books = Array.from({ length: n }, () => [ri(rng, 1, tHi), ri(rng, 1, hHi)]);
        return { input: fmtIntMat(books) + "\n" + shelfWidth, expectedOutput: String(ref(books, shelfWidth)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minHeightShelves(books: List[List[int]], shelfWidth: int) -> int:
              n = len(books)
              INF = 10**18
              dp = [0] + [INF] * n
              for i in range(1, n + 1):
                  width = 0
                  height = 0
                  j = i
                  while j >= 1:
                      width += books[j - 1][0]
                      if width > shelfWidth:
                          break
                      if books[j - 1][1] > height:
                          height = books[j - 1][1]
                      if dp[j - 1] + height < dp[i]:
                          dp[i] = dp[j - 1] + height
                      j -= 1
              return dp[n]
        `,
        javascript: code`
          var minHeightShelves = function(books, shelfWidth) {
              var n = books.length;
              var dp = new Array(n + 1).fill(Infinity);
              dp[0] = 0;
              for (var i = 1; i <= n; i++) {
                  var width = 0, height = 0;
                  for (var j = i; j >= 1; j--) {
                      width += books[j - 1][0];
                      if (width > shelfWidth) break;
                      if (books[j - 1][1] > height) height = books[j - 1][1];
                      if (dp[j - 1] + height < dp[i]) dp[i] = dp[j - 1] + height;
                  }
              }
              return dp[n];
          };
        `,
        typescript: code`
          function minHeightShelves(books: number[][], shelfWidth: number): number {
              var n = books.length;
              var dp: number[] = [0];
              for (var i = 1; i <= n; i++) {
                  dp.push(2147483647);
                  var width = 0, height = 0;
                  for (var j = i; j >= 1; j--) {
                      width += books[j - 1][0];
                      if (width > shelfWidth) break;
                      if (books[j - 1][1] > height) height = books[j - 1][1];
                      if (dp[j - 1] + height < dp[i]) dp[i] = dp[j - 1] + height;
                  }
              }
              return dp[n];
          }
        `,
        java: code`
          public static int minHeightShelves(int[][] books, int shelfWidth) {
              int n = books.length;
              int[] dp = new int[n + 1];
              for (int i = 1; i <= n; i++) {
                  dp[i] = Integer.MAX_VALUE;
                  int width = 0, height = 0;
                  for (int j = i; j >= 1; j--) {
                      width += books[j - 1][0];
                      if (width > shelfWidth) break;
                      height = Math.max(height, books[j - 1][1]);
                      dp[i] = Math.min(dp[i], dp[j - 1] + height);
                  }
              }
              return dp[n];
          }
        `,
        cpp: code`
          int minHeightShelves(vector<vector<int>>& books, int shelfWidth) {
              int n = books.size();
              vector<int> dp(n + 1, INT_MAX);
              dp[0] = 0;
              for (int i = 1; i <= n; i++) {
                  int width = 0, height = 0;
                  for (int j = i; j >= 1; j--) {
                      width += books[j - 1][0];
                      if (width > shelfWidth) break;
                      height = max(height, books[j - 1][1]);
                      dp[i] = min(dp[i], dp[j - 1] + height);
                  }
              }
              return dp[n];
          }
        `,
        c: code`
          int minHeightShelves(int** books, int booksSize, int* booksColSize, int shelfWidth) {
              int n = booksSize;
              int* dp = (int*)malloc(sizeof(int) * (n + 1));
              dp[0] = 0;
              for (int i = 1; i <= n; i++) {
                  dp[i] = 2147483647;
                  int width = 0, height = 0;
                  for (int j = i; j >= 1; j--) {
                      width += books[j - 1][0];
                      if (width > shelfWidth) break;
                      if (books[j - 1][1] > height) height = books[j - 1][1];
                      if (dp[j - 1] + height < dp[i]) dp[i] = dp[j - 1] + height;
                  }
              }
              int res = dp[n];
              free(dp);
              return res;
          }
        `,
        csharp: code`
          public static int MinHeightShelves(int[][] books, int shelfWidth)
          {
              int n = books.Length;
              int[] dp = new int[n + 1];
              for (int i = 1; i <= n; i++)
              {
                  dp[i] = int.MaxValue;
                  int width = 0, height = 0;
                  for (int j = i; j >= 1; j--)
                  {
                      width += books[j - 1][0];
                      if (width > shelfWidth) break;
                      height = Math.Max(height, books[j - 1][1]);
                      dp[i] = Math.Min(dp[i], dp[j - 1] + height);
                  }
              }
              return dp[n];
          }
        `,
        go: code`
          func minHeightShelves(books [][]int, shelfWidth int) int {
          	n := len(books)
          	dp := make([]int, n+1)
          	for i := 1; i <= n; i++ {
          		dp[i] = 1 << 60
          		width, height := 0, 0
          		for j := i; j >= 1; j-- {
          			width += books[j-1][0]
          			if width > shelfWidth {
          				break
          			}
          			if books[j-1][1] > height {
          				height = books[j-1][1]
          			}
          			if dp[j-1]+height < dp[i] {
          				dp[i] = dp[j-1] + height
          			}
          		}
          	}
          	return dp[n]
          }
        `,
        kotlin: code`
          fun minHeightShelves(books: Array<IntArray>, shelfWidth: Int): Int {
              val n = books.size
              val dp = IntArray(n + 1)
              for (i in 1..n) {
                  dp[i] = Int.MAX_VALUE
                  var width = 0
                  var height = 0
                  var j = i
                  while (j >= 1) {
                      width += books[j - 1][0]
                      if (width > shelfWidth) break
                      height = maxOf(height, books[j - 1][1])
                      dp[i] = minOf(dp[i], dp[j - 1] + height)
                      j--
                  }
              }
              return dp[n]
          }
        `,
        swift: code`
          func minHeightShelves(_ books: [[Int]], _ shelfWidth: Int) -> Int {
              let n = books.count
              var dp = [Int](repeating: Int.max, count: n + 1)
              dp[0] = 0
              for i in stride(from: 1, through: n, by: 1) {
                  var width = 0
                  var height = 0
                  var j = i
                  while j >= 1 {
                      width += books[j - 1][0]
                      if width > shelfWidth { break }
                      height = max(height, books[j - 1][1])
                      dp[i] = min(dp[i], dp[j - 1] + height)
                      j -= 1
                  }
              }
              return dp[n]
          }
        `,
        rust: code`
          fn minHeightShelves(books: Vec<Vec<i32>>, shelfWidth: i32) -> i32 {
              let n = books.len();
              let mut dp = vec![std::i32::MAX; n + 1];
              dp[0] = 0;
              for i in 1..=n {
                  let mut width = 0;
                  let mut height = 0;
                  let mut j = i;
                  while j >= 1 {
                      width += books[j - 1][0];
                      if width > shelfWidth {
                          break;
                      }
                      height = height.max(books[j - 1][1]);
                      dp[i] = dp[i].min(dp[j - 1] + height);
                      j -= 1;
                  }
              }
              dp[n]
          }
        `,
        php: code`
          function minHeightShelves($books, $shelfWidth) {
              $n = count($books);
              $dp = array_fill(0, $n + 1, PHP_INT_MAX);
              $dp[0] = 0;
              for ($i = 1; $i <= $n; $i++) {
                  $width = 0;
                  $height = 0;
                  for ($j = $i; $j >= 1; $j--) {
                      $width += $books[$j - 1][0];
                      if ($width > $shelfWidth) break;
                      if ($books[$j - 1][1] > $height) $height = $books[$j - 1][1];
                      if ($dp[$j - 1] + $height < $dp[$i]) $dp[$i] = $dp[$j - 1] + $height;
                  }
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def minHeightShelves(books, shelfWidth)
            n = books.length
            inf = 1 << 60
            dp = Array.new(n + 1, inf)
            dp[0] = 0
            (1..n).each do |i|
              width = 0
              height = 0
              j = i
              while j >= 1
                width += books[j - 1][0]
                break if width > shelfWidth
                height = books[j - 1][1] if books[j - 1][1] > height
                dp[i] = dp[j - 1] + height if dp[j - 1] + height < dp[i]
                j -= 1
              end
            end
            dp[n]
          end
        `,
      },
    };
  })(),

  // ── Guess Number Higher or Lower II (LC 375) ────────────────────
  (() => {
    const ref = (n: number) => {
      const memo = new Map<number, number>();
      const cost = (lo: number, hi: number): number => {
        if (lo >= hi) return 0;
        const key = lo * 1000 + hi;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let res = Infinity;
        for (let g = lo; g <= hi; g++) res = Math.min(res, g + Math.max(cost(lo, g - 1), cost(g + 1, hi)));
        memo.set(key, res);
        return res;
      };
      return cost(1, n);
    };
    return {
      slug: "guess-number-higher-or-lower-ii",
      title: "Guess Number Higher or Lower II",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Game Theory", "Google", "Microsoft", "Amazon"],
      signature: { funcName: "getMoneyAmount", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A host secretly picks an integer between `1` and `n`. You guess repeatedly. When you guess the number you win; when you guess some `x` that is wrong you **pay `x` coins**, and the host tells you whether the secret is higher or lower than `x`.\n\nReturn the smallest amount of money that guarantees a win **no matter which number the host picked** — that is, the cost of your best strategy against its worst-case secret.",
        [
          { in: "n = 10", out: "16", note: "Open with 7. If the secret is higher, guess 9 next (at most 7 + 9 = 16 paid); if lower, guess 3 and then 1 or 5 (at most 7 + 3 + 5 = 15). A last remaining number is always guessed for free, and no strategy gets by on 15." },
          { in: "n = 1", out: "0", note: "The only possible number is guessed for free." },
          { in: "n = 5", out: "6", note: "Guess 4; if lower, guess 2 — the worst case pays 4 + 2." },
        ],
        ["1 <= n <= 200"]),
      hints: [
        "Picking the smallest-cost guess greedily (like binary search) is not optimal — the cost of a guess is its value.",
        "Define `cost(lo, hi)` as the money needed to guarantee a win when the secret is known to lie in `[lo, hi]`.",
        "`cost(lo, hi) = min over g in [lo, hi] of g + max(cost(lo, g-1), cost(g+1, hi))`, with `cost = 0` for ranges of size 0 or 1.",
      ],
      editorial: explain({
        idea: "A minimax over intervals: you choose the guess (minimise), the host chooses the side that hurts you most (maximise). Only the remaining interval matters, so memoise on `(lo, hi)`.",
        steps: [
          "`dp[lo][hi] = 0` when `lo >= hi` (zero or one candidate left — guessing it is free).",
          "For intervals of increasing length: `dp[lo][hi] = min over g of g + max(dp[lo][g-1], dp[g+1][hi])`.",
          "Return `dp[1][n]`.",
        ],
        why: "If you guess `g` and it is wrong you pay `g` and the host can steer you into whichever side is more expensive, so `g + max(...)` is exactly the guaranteed cost of opening with `g`; you then pick the best opening. Sub-intervals are independent of how you reached them, so the recurrence is exact.",
        time: "O(n³)",
        space: "O(n²)",
        pitfalls: [
          "Guessing correctly costs nothing, so a single remaining number costs 0, and two numbers `{a, a+1}` cost `a` (guess the smaller).",
          "Binary search is not optimal: for `n = 5` it would guess 3 first and pay 3 + 4 = 7 in the worst case, more than 6.",
          "Fill the table by increasing interval length.",
        ],
      }),
      examples: [
        { input: "10", expectedOutput: "16" },
        { input: "1", expectedOutput: "0" },
        { input: "5", expectedOutput: "6" },
      ],
      hiddenCount: 200,
      gen: (rng: Rng) => {
        const n = rng() < 0.9 ? ri(rng, 1, 60) : ri(rng, 61, 110);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def getMoneyAmount(n: int) -> int:
              dp = [[0] * (n + 2) for _ in range(n + 2)]
              for length in range(2, n + 1):
                  for lo in range(1, n - length + 2):
                      hi = lo + length - 1
                      best = 10**9
                      for g in range(lo, hi + 1):
                          left = dp[lo][g - 1]
                          right = dp[g + 1][hi]
                          cost = g + (left if left > right else right)
                          if cost < best:
                              best = cost
                      dp[lo][hi] = best
              return dp[1][n]
        `,
        javascript: code`
          var getMoneyAmount = function(n) {
              var dp = [];
              for (var i = 0; i < n + 2; i++) dp.push(new Array(n + 2).fill(0));
              for (var len = 2; len <= n; len++) {
                  for (var lo = 1; lo + len - 1 <= n; lo++) {
                      var hi = lo + len - 1;
                      var best = Infinity;
                      for (var g = lo; g <= hi; g++) {
                          var cost = g + Math.max(dp[lo][g - 1], dp[g + 1][hi]);
                          if (cost < best) best = cost;
                      }
                      dp[lo][hi] = best;
                  }
              }
              return dp[1][n];
          };
        `,
        typescript: code`
          function getMoneyAmount(n: number): number {
              var dp: number[][] = [];
              for (var i = 0; i < n + 2; i++) {
                  var row: number[] = [];
                  for (var t = 0; t < n + 2; t++) row.push(0);
                  dp.push(row);
              }
              for (var len = 2; len <= n; len++) {
                  for (var lo = 1; lo + len - 1 <= n; lo++) {
                      var hi = lo + len - 1;
                      var best = 2147483647;
                      for (var g = lo; g <= hi; g++) {
                          var cost = g + Math.max(dp[lo][g - 1], dp[g + 1][hi]);
                          if (cost < best) best = cost;
                      }
                      dp[lo][hi] = best;
                  }
              }
              return dp[1][n];
          }
        `,
        java: code`
          public static int getMoneyAmount(int n) {
              int[][] dp = new int[n + 2][n + 2];
              for (int len = 2; len <= n; len++) {
                  for (int lo = 1; lo + len - 1 <= n; lo++) {
                      int hi = lo + len - 1;
                      int best = Integer.MAX_VALUE;
                      for (int g = lo; g <= hi; g++) {
                          int cost = g + Math.max(dp[lo][g - 1], dp[g + 1][hi]);
                          if (cost < best) best = cost;
                      }
                      dp[lo][hi] = best;
                  }
              }
              return dp[1][n];
          }
        `,
        cpp: code`
          int getMoneyAmount(int n) {
              vector<vector<int>> dp(n + 2, vector<int>(n + 2, 0));
              for (int len = 2; len <= n; len++) {
                  for (int lo = 1; lo + len - 1 <= n; lo++) {
                      int hi = lo + len - 1;
                      int best = INT_MAX;
                      for (int g = lo; g <= hi; g++) {
                          int cost = g + max(dp[lo][g - 1], dp[g + 1][hi]);
                          if (cost < best) best = cost;
                      }
                      dp[lo][hi] = best;
                  }
              }
              return dp[1][n];
          }
        `,
        c: code`
          int getMoneyAmount(int n) {
              static int dp[202][202];
              for (int i = 0; i < n + 2; i++)
                  for (int j = 0; j < n + 2; j++) dp[i][j] = 0;
              for (int len = 2; len <= n; len++) {
                  for (int lo = 1; lo + len - 1 <= n; lo++) {
                      int hi = lo + len - 1;
                      int best = 2147483647;
                      for (int g = lo; g <= hi; g++) {
                          int a = dp[lo][g - 1], b = dp[g + 1][hi];
                          int cost = g + (a > b ? a : b);
                          if (cost < best) best = cost;
                      }
                      dp[lo][hi] = best;
                  }
              }
              return dp[1][n];
          }
        `,
        csharp: code`
          public static int GetMoneyAmount(int n)
          {
              int[,] dp = new int[n + 2, n + 2];
              for (int len = 2; len <= n; len++)
              {
                  for (int lo = 1; lo + len - 1 <= n; lo++)
                  {
                      int hi = lo + len - 1;
                      int best = int.MaxValue;
                      for (int g = lo; g <= hi; g++)
                      {
                          int cost = g + Math.Max(dp[lo, g - 1], dp[g + 1, hi]);
                          if (cost < best) best = cost;
                      }
                      dp[lo, hi] = best;
                  }
              }
              return dp[1, n];
          }
        `,
        go: code`
          func getMoneyAmount(n int) int {
          	dp := make([][]int, n+2)
          	for i := range dp {
          		dp[i] = make([]int, n+2)
          	}
          	for length := 2; length <= n; length++ {
          		for lo := 1; lo+length-1 <= n; lo++ {
          			hi := lo + length - 1
          			best := 1 << 60
          			for g := lo; g <= hi; g++ {
          				worse := dp[lo][g-1]
          				if dp[g+1][hi] > worse {
          					worse = dp[g+1][hi]
          				}
          				if g+worse < best {
          					best = g + worse
          				}
          			}
          			dp[lo][hi] = best
          		}
          	}
          	return dp[1][n]
          }
        `,
        kotlin: code`
          fun getMoneyAmount(n: Int): Int {
              val dp = Array(n + 2) { IntArray(n + 2) }
              for (len in 2..n) {
                  for (lo in 1..(n - len + 1)) {
                      val hi = lo + len - 1
                      var best = Int.MAX_VALUE
                      for (g in lo..hi) {
                          val cost = g + maxOf(dp[lo][g - 1], dp[g + 1][hi])
                          if (cost < best) best = cost
                      }
                      dp[lo][hi] = best
                  }
              }
              return dp[1][n]
          }
        `,
        swift: code`
          func getMoneyAmount(_ n: Int) -> Int {
              var dp = [[Int]](repeating: [Int](repeating: 0, count: n + 2), count: n + 2)
              var len = 2
              while len <= n {
                  var lo = 1
                  while lo + len - 1 <= n {
                      let hi = lo + len - 1
                      var best = Int.max
                      for g in lo...hi {
                          let cost = g + max(dp[lo][g - 1], dp[g + 1][hi])
                          if cost < best { best = cost }
                      }
                      dp[lo][hi] = best
                      lo += 1
                  }
                  len += 1
              }
              return dp[1][n]
          }
        `,
        rust: code`
          fn getMoneyAmount(n: i32) -> i32 {
              let n = n as usize;
              let mut dp = vec![vec![0i32; n + 2]; n + 2];
              for len in 2..=n {
                  for lo in 1..=(n + 1 - len) {
                      let hi = lo + len - 1;
                      let mut best = std::i32::MAX;
                      for g in lo..=hi {
                          let cost = g as i32 + dp[lo][g - 1].max(dp[g + 1][hi]);
                          if cost < best {
                              best = cost;
                          }
                      }
                      dp[lo][hi] = best;
                  }
              }
              dp[1][n]
          }
        `,
        php: code`
          function getMoneyAmount($n) {
              $dp = array_fill(0, $n + 2, array_fill(0, $n + 2, 0));
              for ($len = 2; $len <= $n; $len++) {
                  for ($lo = 1; $lo + $len - 1 <= $n; $lo++) {
                      $hi = $lo + $len - 1;
                      $best = PHP_INT_MAX;
                      for ($g = $lo; $g <= $hi; $g++) {
                          $a = $dp[$lo][$g - 1];
                          $b = $dp[$g + 1][$hi];
                          $cost = $g + ($a > $b ? $a : $b);
                          if ($cost < $best) $best = $cost;
                      }
                      $dp[$lo][$hi] = $best;
                  }
              }
              return $dp[1][$n];
          }
        `,
        ruby: code`
          def getMoneyAmount(n)
            dp = Array.new(n + 2) { Array.new(n + 2, 0) }
            (2..n).each do |len|
              (1..(n - len + 1)).each do |lo|
                hi = lo + len - 1
                best = nil
                (lo..hi).each do |g|
                  a = dp[lo][g - 1]
                  b = dp[g + 1][hi]
                  cost = g + (a > b ? a : b)
                  best = cost if best.nil? || cost < best
                end
                dp[lo][hi] = best
              end
            end
            dp[1][n]
          end
        `,
      },
    };
  })(),

  // ── Stone Game VI (LC 1686) ─────────────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      // Exhaustive minimax on (Alice score - Bob score) over the set of taken stones.
      const n = a.length;
      const memo = new Map<number, number>();
      const play = (mask: number, aliceTurn: boolean): number => {
        if (mask === (1 << n) - 1) return 0;
        const key = mask * 2 + (aliceTurn ? 1 : 0);
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let res = aliceTurn ? -Infinity : Infinity;
        for (let i = 0; i < n; i++) {
          if (mask & (1 << i)) continue;
          const v = play(mask | (1 << i), !aliceTurn) + (aliceTurn ? a[i] : -b[i]);
          res = aliceTurn ? Math.max(res, v) : Math.min(res, v);
        }
        memo.set(key, res);
        return res;
      };
      const d = play(0, true);
      return d > 0 ? 1 : d < 0 ? -1 : 0;
    };
    return {
      slug: "stone-game-vi",
      title: "Stone Game VI",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Game Theory", "Amazon", "Google"],
      signature: {
        funcName: "stoneGameVI",
        params: [{ name: "aliceValues", type: "int[]" as const }, { name: "bobValues", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` stones. Alice and Bob take turns, Alice first; on a turn a player removes any one remaining stone. Stone `i` is worth `aliceValues[i]` points to Alice and `bobValues[i]` points to Bob — each player only scores their own value for the stones they take.\n\nWhen no stones remain, the player with more points wins. Both players know both arrays and play optimally.\n\nReturn `1` if Alice wins, `-1` if Bob wins, and `0` for a draw.",
        [
          { in: "aliceValues = [1,3], bobValues = [2,1]", out: "1", note: "Alice takes stone 1 (3 points); Bob is left with stone 0 (2 points)." },
          { in: "aliceValues = [1,2], bobValues = [3,1]", out: "0", note: "Alice takes stone 0 to deny Bob 3 points; both end with 1." },
          { in: "aliceValues = [5,1], bobValues = [2,6]", out: "-1" },
        ],
        ["n == aliceValues.length == bobValues.length", "1 <= n <= 10^5", "1 <= aliceValues[i], bobValues[i] <= 100"]),
      hints: [
        "Taking a stone does two things: you gain your value and your opponent loses theirs.",
        "So stone `i` is worth `aliceValues[i] + bobValues[i]` to whoever takes it, in terms of the score difference.",
        "Sort stones by that sum, largest first, and let the players alternate taking them; compare the totals.",
      ],
      editorial: explain({
        idea: "Measure everything as Alice's score minus Bob's. Write `S = Σ bobValues`. If Alice ends with the set `A`, the difference is `Σ_{i∈A} aliceValues[i] − Σ_{i∉A} bobValues[i] = Σ_{i∈A} (aliceValues[i] + bobValues[i]) − S`. So both players only care about the combined value `a + b` of each stone.",
        steps: [
          "Compute `s[i] = aliceValues[i] + bobValues[i]` and sort descending.",
          "Alice gets the stones at even positions of that order (0, 2, 4, …), Bob the rest.",
          "The difference is `Σ s at even positions − Σ bobValues`.",
          "Return 1, -1 or 0 by its sign.",
        ],
        why: "By the identity above, Alice wants to maximise the sum of `s` over her stones and Bob — by the symmetric identity — wants to maximise it over his. With a common weight for each stone, the best move for either player at every turn is to take the heaviest remaining stone (an exchange argument: swapping a lighter pick for the heaviest one never hurts the picker). Stones with equal `s` are interchangeable, so ties do not matter.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting by your own value alone is wrong — example 2 shows that denying Bob matters.",
          "Ties in `a + b` can be broken arbitrarily; the result is the same.",
          "The game is a draw when the difference is exactly 0.",
        ],
      }),
      examples: [
        { input: "[1,3]\n[2,1]", expectedOutput: "1" },
        { input: "[1,2]\n[3,1]", expectedOutput: "0" },
        { input: "[5,1]\n[2,6]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.3 ? ri(rng, 1, 4) : ri(rng, 5, 10);
        const hi = pick(rng, [2, 5, 100]);
        const a = Array.from({ length: n }, () => ri(rng, 1, hi));
        const b = rng() < 0.15 ? a.slice() : Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(a) + "\n" + fmtIntArr(b), expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List

          def stoneGameVI(aliceValues: List[int], bobValues: List[int]) -> int:
              sums = sorted((a + b for a, b in zip(aliceValues, bobValues)), reverse=True)
              diff = sum(sums[0::2]) - sum(bobValues)
              return (diff > 0) - (diff < 0)
        `,
        javascript: code`
          var stoneGameVI = function(aliceValues, bobValues) {
              var n = aliceValues.length;
              var sums = [];
              var diff = 0;
              for (var i = 0; i < n; i++) {
                  sums.push(aliceValues[i] + bobValues[i]);
                  diff -= bobValues[i];
              }
              sums.sort(function(x, y) { return y - x; });
              for (i = 0; i < n; i += 2) diff += sums[i];
              return diff > 0 ? 1 : diff < 0 ? -1 : 0;
          };
        `,
        typescript: code`
          function stoneGameVI(aliceValues: number[], bobValues: number[]): number {
              var n = aliceValues.length;
              var sums: number[] = [];
              var diff = 0;
              for (var i = 0; i < n; i++) {
                  sums.push(aliceValues[i] + bobValues[i]);
                  diff -= bobValues[i];
              }
              sums.sort(function (x, y) { return y - x; });
              for (i = 0; i < n; i += 2) diff += sums[i];
              return diff > 0 ? 1 : diff < 0 ? -1 : 0;
          }
        `,
        java: code`
          public static int stoneGameVI(int[] aliceValues, int[] bobValues) {
              int n = aliceValues.length;
              int[] sums = new int[n];
              long diff = 0;
              for (int i = 0; i < n; i++) {
                  sums[i] = aliceValues[i] + bobValues[i];
                  diff -= bobValues[i];
              }
              Arrays.sort(sums);
              for (int t = 0; t < n; t += 2) diff += sums[n - 1 - t];
              return diff > 0 ? 1 : diff < 0 ? -1 : 0;
          }
        `,
        cpp: code`
          int stoneGameVI(vector<int>& aliceValues, vector<int>& bobValues) {
              int n = aliceValues.size();
              vector<int> sums(n);
              long long diff = 0;
              for (int i = 0; i < n; i++) {
                  sums[i] = aliceValues[i] + bobValues[i];
                  diff -= bobValues[i];
              }
              sort(sums.rbegin(), sums.rend());
              for (int i = 0; i < n; i += 2) diff += sums[i];
              return diff > 0 ? 1 : diff < 0 ? -1 : 0;
          }
        `,
        c: code`
          static int cmpDescSg(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a < b) - (a > b);
          }

          int stoneGameVI(int* aliceValues, int aliceValuesSize, int* bobValues, int bobValuesSize) {
              int n = aliceValuesSize;
              int* sums = (int*)malloc(sizeof(int) * n);
              long long diff = 0;
              for (int i = 0; i < n; i++) {
                  sums[i] = aliceValues[i] + bobValues[i];
                  diff -= bobValues[i];
              }
              qsort(sums, n, sizeof(int), cmpDescSg);
              for (int i = 0; i < n; i += 2) diff += sums[i];
              free(sums);
              return diff > 0 ? 1 : diff < 0 ? -1 : 0;
          }
        `,
        csharp: code`
          public static int StoneGameVI(int[] aliceValues, int[] bobValues)
          {
              int n = aliceValues.Length;
              int[] sums = new int[n];
              long diff = 0;
              for (int i = 0; i < n; i++)
              {
                  sums[i] = aliceValues[i] + bobValues[i];
                  diff -= bobValues[i];
              }
              Array.Sort(sums);
              Array.Reverse(sums);
              for (int i = 0; i < n; i += 2) diff += sums[i];
              return diff > 0 ? 1 : diff < 0 ? -1 : 0;
          }
        `,
        go: code`
          func stoneGameVI(aliceValues []int, bobValues []int) int {
          	n := len(aliceValues)
          	sums := make([]int, n)
          	diff := 0
          	for i := 0; i < n; i++ {
          		sums[i] = aliceValues[i] + bobValues[i]
          		diff -= bobValues[i]
          	}
          	sort.Sort(sort.Reverse(sort.IntSlice(sums)))
          	for i := 0; i < n; i += 2 {
          		diff += sums[i]
          	}
          	if diff > 0 {
          		return 1
          	}
          	if diff < 0 {
          		return -1
          	}
          	return 0
          }
        `,
        kotlin: code`
          fun stoneGameVI(aliceValues: IntArray, bobValues: IntArray): Int {
              val n = aliceValues.size
              val sums = IntArray(n) { aliceValues[it] + bobValues[it] }
              sums.sortDescending()
              var diff = 0L
              for (i in 0 until n) diff -= bobValues[i]
              var i = 0
              while (i < n) {
                  diff += sums[i]
                  i += 2
              }
              return if (diff > 0) 1 else if (diff < 0) -1 else 0
          }
        `,
        swift: code`
          func stoneGameVI(_ aliceValues: [Int], _ bobValues: [Int]) -> Int {
              let n = aliceValues.count
              var sums = [Int]()
              var diff = 0
              for i in 0..<n {
                  sums.append(aliceValues[i] + bobValues[i])
                  diff -= bobValues[i]
              }
              sums.sort(by: >)
              var i = 0
              while i < n {
                  diff += sums[i]
                  i += 2
              }
              return diff > 0 ? 1 : (diff < 0 ? -1 : 0)
          }
        `,
        rust: code`
          fn stoneGameVI(aliceValues: Vec<i32>, bobValues: Vec<i32>) -> i32 {
              let n = aliceValues.len();
              let mut sums: Vec<i32> = (0..n).map(|i| aliceValues[i] + bobValues[i]).collect();
              sums.sort_by(|x, y| y.cmp(x));
              let mut diff: i64 = 0;
              for i in 0..n {
                  diff -= bobValues[i] as i64;
              }
              let mut i = 0;
              while i < n {
                  diff += sums[i] as i64;
                  i += 2;
              }
              if diff > 0 {
                  1
              } else if diff < 0 {
                  -1
              } else {
                  0
              }
          }
        `,
        php: code`
          function stoneGameVI($aliceValues, $bobValues) {
              $n = count($aliceValues);
              $sums = [];
              $diff = 0;
              for ($i = 0; $i < $n; $i++) {
                  $sums[] = $aliceValues[$i] + $bobValues[$i];
                  $diff -= $bobValues[$i];
              }
              rsort($sums);
              for ($i = 0; $i < $n; $i += 2) $diff += $sums[$i];
              return $diff > 0 ? 1 : ($diff < 0 ? -1 : 0);
          }
        `,
        ruby: code`
          def stoneGameVI(aliceValues, bobValues)
            sums = aliceValues.each_index.map { |i| aliceValues[i] + bobValues[i] }.sort.reverse
            diff = -bobValues.sum
            sums.each_with_index { |s, i| diff += s if i.even? }
            diff <=> 0
          end
        `,
      },
    };
  })(),

  // ── Maximum Score from Performing Multiplication Operations (LC 1770) ──
  (() => {
    const ref = (nums: number[], mult: number[]) => {
      const n = nums.length, m = mult.length;
      const memo = new Map<number, number>();
      const go = (i: number, left: number): number => {
        if (i === m) return 0;
        const key = i * 1000 + left;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        const right = n - 1 - (i - left);
        const res = Math.max(mult[i] * nums[left] + go(i + 1, left + 1), mult[i] * nums[right] + go(i + 1, left));
        memo.set(key, res);
        return res;
      };
      return go(0, 0);
    };
    return {
      slug: "maximum-score-from-performing-multiplication-operations",
      title: "Maximum Score from Performing Multiplication Operations",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "maximumScore",
        params: [{ name: "nums", type: "int[]" as const }, { name: "multipliers", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given `nums` of length `n` and `multipliers` of length `m`, with `m <= n`. Starting from a score of 0, perform exactly `m` operations; in the `i`-th operation (0-indexed):\n\n- remove one element `x` from **either end** of `nums` (the first or the last remaining element), and\n- add `multipliers[i] * x` to the score.\n\nReturn the maximum score reachable after all `m` operations.",
        [
          { in: "nums = [1,2,3], multipliers = [3,2,1]", out: "14", note: "Take 3, 2, 1 from the right: 9 + 4 + 1." },
          { in: "nums = [4,-2,5], multipliers = [2,-1]", out: "12", note: "Take 5 (+10), then -2 from the right (+2)." },
          { in: "nums = [-5,-3,-3,-2,7,1], multipliers = [-10,-5,3,4,6]", out: "102" },
        ],
        ["n == nums.length", "m == multipliers.length", "1 <= m <= 300", "m <= n <= 10^5", "-1000 <= nums[i], multipliers[i] <= 1000"]),
      hints: [
        "Greedy choices fail — a big product now can leave terrible elements for later.",
        "After `i` operations, if `left` of them took from the front, the remaining array is fixed: it starts at `left` and ends at `n - 1 - (i - left)`.",
        "So the state is `(i, left)` — only `O(m²)` states, even though `n` is large. Take the better of front and back at each state.",
      ],
      editorial: explain({
        idea: "The removed elements always form a prefix and a suffix of `nums`. After `i` operations with `left` taken from the front, the right pointer is `n - 1 - (i - left)`, so `(i, left)` describes the state completely and there are only about `m²/2` of them.",
        steps: [
          "Let `dp[i][left]` be the best score obtainable from operations `i..m-1` when `left` elements have been taken from the front.",
          "`dp[m][*] = 0`.",
          "For `i` from `m-1` down to 0 and `left` from 0 to `i`: with `right = n - 1 - (i - left)`, `dp[i][left] = max(multipliers[i]·nums[left] + dp[i+1][left+1], multipliers[i]·nums[right] + dp[i+1][left])`.",
          "Return `dp[0][0]`; a single row of size `m + 1` suffices if `left` is processed in increasing order.",
        ],
        why: "Every play sequence is a sequence of front/back choices, and its future depends only on how many of each were made — exactly `(i, left)`. The recurrence tries both choices and adds the optimal continuation, so it equals the best total over all sequences.",
        time: "O(m²)",
        space: "O(m)",
        pitfalls: [
          "Indexing the DP by both ends (`O(n²)`) is too slow and too large when `n = 10^5`; index by operations and front-count instead.",
          "Values are negative too, so initialise maxima carefully (no 0 floor).",
          "The answer is at most `300 · 10^6`, which fits in 32 bits.",
        ],
      }),
      examples: [
        { input: "[1,2,3]\n[3,2,1]", expectedOutput: "14" },
        { input: "[4,-2,5]\n[2,-1]", expectedOutput: "12" },
        { input: "[-5,-3,-3,-2,7,1]\n[-10,-5,3,4,6]", expectedOutput: "102" },
      ],
      gen: (rng: Rng) => {
        const r = rng();
        const m = r < 0.3 ? ri(rng, 1, 3) : r < 0.9 ? ri(rng, 4, 14) : ri(rng, 15, 24);
        const n = m + (rng() < 0.3 ? 0 : ri(rng, 1, 25));
        const hi = pick(rng, [3, 20, 1000]);
        const nums = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const mult = Array.from({ length: m }, () => ri(rng, -hi, hi));
        return { input: fmtIntArr(nums) + "\n" + fmtIntArr(mult), expectedOutput: String(ref(nums, mult)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumScore(nums: List[int], multipliers: List[int]) -> int:
              n, m = len(nums), len(multipliers)
              dp = [0] * (m + 1)
              for i in range(m - 1, -1, -1):
                  mu = multipliers[i]
                  for left in range(i + 1):
                      right = n - 1 - (i - left)
                      a = mu * nums[left] + dp[left + 1]
                      b = mu * nums[right] + dp[left]
                      dp[left] = a if a > b else b
              return dp[0]
        `,
        javascript: code`
          var maximumScore = function(nums, multipliers) {
              var n = nums.length, m = multipliers.length;
              var dp = new Array(m + 1).fill(0);
              for (var i = m - 1; i >= 0; i--) {
                  var mu = multipliers[i];
                  for (var left = 0; left <= i; left++) {
                      var right = n - 1 - (i - left);
                      var a = mu * nums[left] + dp[left + 1];
                      var b = mu * nums[right] + dp[left];
                      dp[left] = a > b ? a : b;
                  }
              }
              return dp[0];
          };
        `,
        typescript: code`
          function maximumScore(nums: number[], multipliers: number[]): number {
              var n = nums.length, m = multipliers.length;
              var dp: number[] = [];
              for (var t = 0; t <= m; t++) dp.push(0);
              for (var i = m - 1; i >= 0; i--) {
                  var mu = multipliers[i];
                  for (var left = 0; left <= i; left++) {
                      var right = n - 1 - (i - left);
                      var a = mu * nums[left] + dp[left + 1];
                      var b = mu * nums[right] + dp[left];
                      dp[left] = a > b ? a : b;
                  }
              }
              return dp[0];
          }
        `,
        java: code`
          public static int maximumScore(int[] nums, int[] multipliers) {
              int n = nums.length, m = multipliers.length;
              int[] dp = new int[m + 1];
              for (int i = m - 1; i >= 0; i--) {
                  int mu = multipliers[i];
                  for (int left = 0; left <= i; left++) {
                      int right = n - 1 - (i - left);
                      int a = mu * nums[left] + dp[left + 1];
                      int b = mu * nums[right] + dp[left];
                      dp[left] = Math.max(a, b);
                  }
              }
              return dp[0];
          }
        `,
        cpp: code`
          int maximumScore(vector<int>& nums, vector<int>& multipliers) {
              int n = nums.size(), m = multipliers.size();
              vector<int> dp(m + 1, 0);
              for (int i = m - 1; i >= 0; i--) {
                  int mu = multipliers[i];
                  for (int left = 0; left <= i; left++) {
                      int right = n - 1 - (i - left);
                      int a = mu * nums[left] + dp[left + 1];
                      int b = mu * nums[right] + dp[left];
                      dp[left] = max(a, b);
                  }
              }
              return dp[0];
          }
        `,
        c: code`
          int maximumScore(int* nums, int numsSize, int* multipliers, int multipliersSize) {
              int n = numsSize, m = multipliersSize;
              int* dp = (int*)malloc(sizeof(int) * (m + 1));
              for (int t = 0; t <= m; t++) dp[t] = 0;
              for (int i = m - 1; i >= 0; i--) {
                  int mu = multipliers[i];
                  for (int left = 0; left <= i; left++) {
                      int right = n - 1 - (i - left);
                      int a = mu * nums[left] + dp[left + 1];
                      int b = mu * nums[right] + dp[left];
                      dp[left] = a > b ? a : b;
                  }
              }
              int res = dp[0];
              free(dp);
              return res;
          }
        `,
        csharp: code`
          public static int MaximumScore(int[] nums, int[] multipliers)
          {
              int n = nums.Length, m = multipliers.Length;
              int[] dp = new int[m + 1];
              for (int i = m - 1; i >= 0; i--)
              {
                  int mu = multipliers[i];
                  for (int left = 0; left <= i; left++)
                  {
                      int right = n - 1 - (i - left);
                      int a = mu * nums[left] + dp[left + 1];
                      int b = mu * nums[right] + dp[left];
                      dp[left] = Math.Max(a, b);
                  }
              }
              return dp[0];
          }
        `,
        go: code`
          func maximumScore(nums []int, multipliers []int) int {
          	n, m := len(nums), len(multipliers)
          	dp := make([]int, m+1)
          	for i := m - 1; i >= 0; i-- {
          		mu := multipliers[i]
          		for left := 0; left <= i; left++ {
          			right := n - 1 - (i - left)
          			a := mu*nums[left] + dp[left+1]
          			b := mu*nums[right] + dp[left]
          			if a > b {
          				dp[left] = a
          			} else {
          				dp[left] = b
          			}
          		}
          	}
          	return dp[0]
          }
        `,
        kotlin: code`
          fun maximumScore(nums: IntArray, multipliers: IntArray): Int {
              val n = nums.size
              val m = multipliers.size
              val dp = IntArray(m + 1)
              for (i in m - 1 downTo 0) {
                  val mu = multipliers[i]
                  for (left in 0..i) {
                      val right = n - 1 - (i - left)
                      val a = mu * nums[left] + dp[left + 1]
                      val b = mu * nums[right] + dp[left]
                      dp[left] = maxOf(a, b)
                  }
              }
              return dp[0]
          }
        `,
        swift: code`
          func maximumScore(_ nums: [Int], _ multipliers: [Int]) -> Int {
              let n = nums.count
              let m = multipliers.count
              var dp = [Int](repeating: 0, count: m + 1)
              var i = m - 1
              while i >= 0 {
                  let mu = multipliers[i]
                  for left in 0...i {
                      let right = n - 1 - (i - left)
                      let a = mu * nums[left] + dp[left + 1]
                      let b = mu * nums[right] + dp[left]
                      dp[left] = max(a, b)
                  }
                  i -= 1
              }
              return dp[0]
          }
        `,
        rust: code`
          fn maximumScore(nums: Vec<i32>, multipliers: Vec<i32>) -> i32 {
              let n = nums.len();
              let m = multipliers.len();
              let mut dp = vec![0i32; m + 1];
              for i in (0..m).rev() {
                  let mu = multipliers[i];
                  for left in 0..=i {
                      let right = n - 1 - (i - left);
                      let a = mu * nums[left] + dp[left + 1];
                      let b = mu * nums[right] + dp[left];
                      dp[left] = a.max(b);
                  }
              }
              dp[0]
          }
        `,
        php: code`
          function maximumScore($nums, $multipliers) {
              $n = count($nums);
              $m = count($multipliers);
              $dp = array_fill(0, $m + 1, 0);
              for ($i = $m - 1; $i >= 0; $i--) {
                  $mu = $multipliers[$i];
                  for ($left = 0; $left <= $i; $left++) {
                      $right = $n - 1 - ($i - $left);
                      $a = $mu * $nums[$left] + $dp[$left + 1];
                      $b = $mu * $nums[$right] + $dp[$left];
                      $dp[$left] = $a > $b ? $a : $b;
                  }
              }
              return $dp[0];
          }
        `,
        ruby: code`
          def maximumScore(nums, multipliers)
            n = nums.length
            m = multipliers.length
            dp = Array.new(m + 1, 0)
            (m - 1).downto(0) do |i|
              mu = multipliers[i]
              (0..i).each do |left|
                right = n - 1 - (i - left)
                a = mu * nums[left] + dp[left + 1]
                b = mu * nums[right] + dp[left]
                dp[left] = a > b ? a : b
              end
            end
            dp[0]
          end
        `,
      },
    };
  })(),

  // ── Closest Dessert Cost (LC 1774) ──────────────────────────────
  (() => {
    const ref = (base: number[], tops: number[], target: number) => {
      let best = -1;
      const consider = (c: number) => {
        if (best < 0) { best = c; return; }
        const d = Math.abs(c - target), bd = Math.abs(best - target);
        if (d < bd || (d === bd && c < best)) best = c;
      };
      const counts = new Array(tops.length).fill(0);
      for (const b of base) {
        // odometer over {0,1,2}^m
        counts.fill(0);
        for (;;) {
          let c = b;
          for (let i = 0; i < tops.length; i++) c += counts[i] * tops[i];
          consider(c);
          let i = 0;
          while (i < tops.length && counts[i] === 2) { counts[i] = 0; i++; }
          if (i === tops.length) break;
          counts[i]++;
        }
      }
      return best;
    };
    return {
      slug: "closest-dessert-cost",
      title: "Closest Dessert Cost",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Backtracking", "Google", "Amazon"],
      signature: {
        funcName: "closestCost",
        params: [
          { name: "baseCosts", type: "int[]" as const }, { name: "toppingCosts", type: "int[]" as const },
          { name: "target", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A dessert is built from **exactly one** ice-cream base and any toppings. `baseCosts[i]` is the price of base `i`; `toppingCosts[j]` is the price of one portion of topping `j`. Each topping may be added **zero, one or two** times.\n\nThe cost of a dessert is the base price plus the price of all topping portions on it. Return the dessert cost closest to `target`; if two costs are equally close, return the **lower** one.",
        [
          { in: "baseCosts = [1,7], toppingCosts = [3,4], target = 10", out: "10", note: "Base 7 plus one portion of topping 0 (3)." },
          { in: "baseCosts = [3,10], toppingCosts = [2,5], target = 9", out: "8", note: "Both 8 and 10 are 1 away; the lower wins. 9 itself cannot be made." },
          { in: "baseCosts = [5], toppingCosts = [3], target = 12", out: "11" },
        ],
        ["n == baseCosts.length", "m == toppingCosts.length", "1 <= n, m <= 10", "1 <= baseCosts[i], toppingCosts[j] <= 10^4", "1 <= target <= 10^4"]),
      hints: [
        "With at most 10 toppings and 3 choices each, there are only 3^10 = 59,049 topping combinations.",
        "Enumerate every combination for every base (DFS over toppings, choosing 0, 1 or 2 portions), and keep the best cost under the tie rule.",
        "Once a partial cost reaches `target`, adding more toppings can only move it further away — prune that branch.",
      ],
      editorial: explain({
        idea: "The search space is tiny: `n · 3^m ≤ 590,490` desserts. Enumerate them with a depth-first search, comparing each cost by distance to `target` and then by value.",
        steps: [
          "Keep `best`, initialised to any valid cost (for example the first base alone).",
          "For each base, run `dfs(i, cost)`: if `cost >= target` or `i == m`, compare `cost` with `best` and stop; otherwise recurse with 0, 1 and 2 portions of topping `i`.",
          "Comparison: `cost` replaces `best` if `|cost - target| < |best - target|`, or the distances tie and `cost < best`.",
          "Return `best`.",
        ],
        why: "Every dessert is reached by exactly one path of choices, so the minimum over all leaves is the answer. The prune is safe: from a cost `c >= target`, any extension `c' >= c` is at least as far from `target` and not lower, so it can never beat `c` under the comparison.",
        time: "O(n · 3^m)",
        space: "O(m) recursion depth",
        pitfalls: [
          "Exactly one base is required — a dessert of toppings only is not allowed.",
          "Ties go to the cheaper dessert, not the first one found.",
          "Each topping may be used at most twice, so this is not an unbounded knapsack.",
        ],
      }),
      examples: [
        { input: "[1,7]\n[3,4]\n10", expectedOutput: "10" },
        { input: "[3,10]\n[2,5]\n9", expectedOutput: "8" },
        { input: "[5]\n[3]\n12", expectedOutput: "11" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, rng() < 0.85 ? 4 : 6);
        const m = ri(rng, 1, rng() < 0.85 ? 4 : 5);
        const hi = pick(rng, [10, 50, 10000]);
        const base = Array.from({ length: n }, () => ri(rng, 1, hi));
        const tops = Array.from({ length: m }, () => ri(rng, 1, hi));
        const target = rng() < 0.7 ? Math.min(10000, ri(rng, 1, hi * 3)) : ri(rng, 1, 10000);
        return {
          input: fmtIntArr(base) + "\n" + fmtIntArr(tops) + "\n" + target,
          expectedOutput: String(ref(base, tops, target)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def closestCost(baseCosts: List[int], toppingCosts: List[int], target: int) -> int:
              sums = {0}
              for t in toppingCosts:
                  sums = {s + k * t for s in sums for k in range(3)}
              best = baseCosts[0]
              for b in baseCosts:
                  for s in sums:
                      c = b + s
                      d, bd = abs(c - target), abs(best - target)
                      if d < bd or (d == bd and c < best):
                          best = c
              return best
        `,
        javascript: code`
          var closestCost = function(baseCosts, toppingCosts, target) {
              var m = toppingCosts.length;
              var best = baseCosts[0];
              var consider = function(c) {
                  var d = Math.abs(c - target), bd = Math.abs(best - target);
                  if (d < bd || (d === bd && c < best)) best = c;
              };
              var dfs = function(i, cost) {
                  if (cost >= target || i === m) { consider(cost); return; }
                  dfs(i + 1, cost);
                  dfs(i + 1, cost + toppingCosts[i]);
                  dfs(i + 1, cost + 2 * toppingCosts[i]);
              };
              for (var b = 0; b < baseCosts.length; b++) dfs(0, baseCosts[b]);
              return best;
          };
        `,
        typescript: code`
          function closestCost(baseCosts: number[], toppingCosts: number[], target: number): number {
              var m = toppingCosts.length;
              var best = baseCosts[0];
              var consider = function (c: number): void {
                  var d = Math.abs(c - target), bd = Math.abs(best - target);
                  if (d < bd || (d === bd && c < best)) best = c;
              };
              var dfs = function (i: number, cost: number): void {
                  if (cost >= target || i === m) { consider(cost); return; }
                  dfs(i + 1, cost);
                  dfs(i + 1, cost + toppingCosts[i]);
                  dfs(i + 1, cost + 2 * toppingCosts[i]);
              };
              for (var b = 0; b < baseCosts.length; b++) dfs(0, baseCosts[b]);
              return best;
          }
        `,
        java: code`
          static int dessertBest;

          static void dessertDfs(int[] tops, int i, int cost, int target) {
              if (cost >= target || i == tops.length) {
                  int d = Math.abs(cost - target), bd = Math.abs(dessertBest - target);
                  if (d < bd || (d == bd && cost < dessertBest)) dessertBest = cost;
                  return;
              }
              dessertDfs(tops, i + 1, cost, target);
              dessertDfs(tops, i + 1, cost + tops[i], target);
              dessertDfs(tops, i + 1, cost + 2 * tops[i], target);
          }

          public static int closestCost(int[] baseCosts, int[] toppingCosts, int target) {
              dessertBest = baseCosts[0];
              for (int b : baseCosts) dessertDfs(toppingCosts, 0, b, target);
              return dessertBest;
          }
        `,
        cpp: code`
          void dessertDfs(const vector<int>& tops, int i, int cost, int target, int& best) {
              if (cost >= target || i == (int) tops.size()) {
                  int d = abs(cost - target), bd = abs(best - target);
                  if (d < bd || (d == bd && cost < best)) best = cost;
                  return;
              }
              dessertDfs(tops, i + 1, cost, target, best);
              dessertDfs(tops, i + 1, cost + tops[i], target, best);
              dessertDfs(tops, i + 1, cost + 2 * tops[i], target, best);
          }

          int closestCost(vector<int>& baseCosts, vector<int>& toppingCosts, int target) {
              int best = baseCosts[0];
              for (int b : baseCosts) dessertDfs(toppingCosts, 0, b, target, best);
              return best;
          }
        `,
        c: code`
          static int absDc(int x) { return x < 0 ? -x : x; }

          static void dessertDfs(const int* tops, int m, int i, int cost, int target, int* best) {
              if (cost >= target || i == m) {
                  int d = absDc(cost - target), bd = absDc(*best - target);
                  if (d < bd || (d == bd && cost < *best)) *best = cost;
                  return;
              }
              dessertDfs(tops, m, i + 1, cost, target, best);
              dessertDfs(tops, m, i + 1, cost + tops[i], target, best);
              dessertDfs(tops, m, i + 1, cost + 2 * tops[i], target, best);
          }

          int closestCost(int* baseCosts, int baseCostsSize, int* toppingCosts, int toppingCostsSize, int target) {
              int best = baseCosts[0];
              for (int b = 0; b < baseCostsSize; b++) dessertDfs(toppingCosts, toppingCostsSize, 0, baseCosts[b], target, &best);
              return best;
          }
        `,
        csharp: code`
          static int dessertBest;

          static void DessertDfs(int[] tops, int i, int cost, int target)
          {
              if (cost >= target || i == tops.Length)
              {
                  int d = Math.Abs(cost - target), bd = Math.Abs(dessertBest - target);
                  if (d < bd || (d == bd && cost < dessertBest)) dessertBest = cost;
                  return;
              }
              DessertDfs(tops, i + 1, cost, target);
              DessertDfs(tops, i + 1, cost + tops[i], target);
              DessertDfs(tops, i + 1, cost + 2 * tops[i], target);
          }

          public static int ClosestCost(int[] baseCosts, int[] toppingCosts, int target)
          {
              dessertBest = baseCosts[0];
              foreach (int b in baseCosts) DessertDfs(toppingCosts, 0, b, target);
              return dessertBest;
          }
        `,
        go: code`
          func closestCost(baseCosts []int, toppingCosts []int, target int) int {
          	m := len(toppingCosts)
          	best := baseCosts[0]
          	absInt := func(x int) int {
          		if x < 0 {
          			return -x
          		}
          		return x
          	}
          	var dfs func(i, cost int)
          	dfs = func(i, cost int) {
          		if cost >= target || i == m {
          			d, bd := absInt(cost-target), absInt(best-target)
          			if d < bd || (d == bd && cost < best) {
          				best = cost
          			}
          			return
          		}
          		dfs(i+1, cost)
          		dfs(i+1, cost+toppingCosts[i])
          		dfs(i+1, cost+2*toppingCosts[i])
          	}
          	for _, b := range baseCosts {
          		dfs(0, b)
          	}
          	return best
          }
        `,
        kotlin: code`
          fun closestCost(baseCosts: IntArray, toppingCosts: IntArray, target: Int): Int {
              val m = toppingCosts.size
              var best = baseCosts[0]
              fun dfs(i: Int, cost: Int) {
                  if (cost >= target || i == m) {
                      val d = Math.abs(cost - target)
                      val bd = Math.abs(best - target)
                      if (d < bd || (d == bd && cost < best)) best = cost
                      return
                  }
                  dfs(i + 1, cost)
                  dfs(i + 1, cost + toppingCosts[i])
                  dfs(i + 1, cost + 2 * toppingCosts[i])
              }
              for (b in baseCosts) dfs(0, b)
              return best
          }
        `,
        swift: code`
          func closestCost(_ baseCosts: [Int], _ toppingCosts: [Int], _ target: Int) -> Int {
              let m = toppingCosts.count
              var best = baseCosts[0]
              func dfs(_ i: Int, _ cost: Int) {
                  if cost >= target || i == m {
                      let d = abs(cost - target)
                      let bd = abs(best - target)
                      if d < bd || (d == bd && cost < best) { best = cost }
                      return
                  }
                  dfs(i + 1, cost)
                  dfs(i + 1, cost + toppingCosts[i])
                  dfs(i + 1, cost + 2 * toppingCosts[i])
              }
              for b in baseCosts { dfs(0, b) }
              return best
          }
        `,
        rust: code`
          fn dessert_dfs(tops: &Vec<i32>, i: usize, cost: i32, target: i32, best: &mut i32) {
              if cost >= target || i == tops.len() {
                  let d = (cost - target).abs();
                  let bd = (*best - target).abs();
                  if d < bd || (d == bd && cost < *best) {
                      *best = cost;
                  }
                  return;
              }
              dessert_dfs(tops, i + 1, cost, target, best);
              dessert_dfs(tops, i + 1, cost + tops[i], target, best);
              dessert_dfs(tops, i + 1, cost + 2 * tops[i], target, best);
          }

          fn closestCost(baseCosts: Vec<i32>, toppingCosts: Vec<i32>, target: i32) -> i32 {
              let mut best = baseCosts[0];
              for &b in baseCosts.iter() {
                  dessert_dfs(&toppingCosts, 0, b, target, &mut best);
              }
              best
          }
        `,
        php: code`
          function dessertDfs($tops, $i, $cost, $target, &$best) {
              if ($cost >= $target || $i == count($tops)) {
                  $d = abs($cost - $target);
                  $bd = abs($best - $target);
                  if ($d < $bd || ($d == $bd && $cost < $best)) $best = $cost;
                  return;
              }
              dessertDfs($tops, $i + 1, $cost, $target, $best);
              dessertDfs($tops, $i + 1, $cost + $tops[$i], $target, $best);
              dessertDfs($tops, $i + 1, $cost + 2 * $tops[$i], $target, $best);
          }

          function closestCost($baseCosts, $toppingCosts, $target) {
              $best = $baseCosts[0];
              foreach ($baseCosts as $b) dessertDfs($toppingCosts, 0, $b, $target, $best);
              return $best;
          }
        `,
        ruby: code`
          def closestCost(baseCosts, toppingCosts, target)
            sums = [0]
            toppingCosts.each do |t|
              sums = sums.flat_map { |s| [s, s + t, s + 2 * t] }.uniq
            end
            best = baseCosts[0]
            baseCosts.each do |b|
              sums.each do |s|
                c = b + s
                d = (c - target).abs
                bd = (best - target).abs
                best = c if d < bd || (d == bd && c < best)
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Sideway Jumps (LC 1824) ─────────────────────────────
  (() => {
    const ref = (obstacles: number[]) => {
      // 0-1 BFS over (point, lane): forward costs 0, a side jump costs 1.
      const n = obstacles.length - 1;
      const dist: number[][] = Array.from({ length: n + 1 }, () => [Infinity, Infinity, Infinity, Infinity]);
      const dq: Array<[number, number]> = [];
      dist[0][2] = 0;
      dq.push([0, 2]);
      let head = 0;
      const front: Array<[number, number]> = [];
      while (head < dq.length || front.length) {
        const [p, l] = front.length ? front.pop()! : dq[head++];
        const d = dist[p][l];
        if (p === n) return d;
        if (obstacles[p + 1] !== l && d < dist[p + 1][l]) { dist[p + 1][l] = d; front.push([p + 1, l]); }
        for (let t = 1; t <= 3; t++) {
          if (t !== l && obstacles[p] !== t && d + 1 < dist[p][t]) { dist[p][t] = d + 1; dq.push([p, t]); }
        }
      }
      return -1;
    };
    return {
      slug: "minimum-sideway-jumps",
      title: "Minimum Sideway Jumps",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Greedy", "Amazon", "Google"],
      signature: { funcName: "minSideJumps", params: [{ name: "obstacles", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A frog runs along a road with **3 lanes** (numbered 1 to 3) and points `0` to `n`. It starts at point 0 in lane **2** and wants to reach point `n` in any lane.\n\n`obstacles` has length `n + 1`: `obstacles[i]` is the lane blocked at point `i`, or `0` if point `i` is clear. At most one lane is blocked at any point, and points `0` and `n` are clear.\n\nFrom point `i` in lane `l` the frog may hop forward to point `i + 1` in the same lane if that spot is not blocked. It may also make a **side jump**: switch to any other lane at the same point (lanes need not be adjacent), as long as that lane is not blocked there.\n\nReturn the minimum number of side jumps needed to reach point `n`.",
        [
          { in: "obstacles = [0,1,2,3,0]", out: "2", note: "Lane 2 is blocked at point 2, so jump to lane 3 at point 1 (lane 1 is blocked there); lane 3 is blocked at point 3, so jump to lane 1 at point 2." },
          { in: "obstacles = [0,1,1,3,3,0]", out: "0", note: "Lane 2 is never blocked." },
          { in: "obstacles = [0,2,0]", out: "1" },
        ],
        ["obstacles.length == n + 1", "1 <= n <= 5 * 10^5", "0 <= obstacles[i] <= 3", "obstacles[0] == obstacles[n] == 0"]),
      hints: [
        "Track, for every point, the fewest side jumps needed to stand there in each of the three lanes.",
        "Moving forward costs nothing, but a lane blocked at point `i` becomes unreachable there.",
        "At each point, any open lane can also be reached from the best lane at that point with one extra jump: `dp[l] = min(dp[l], min(dp) + 1)`.",
      ],
      editorial: explain({
        idea: "Keep three numbers — the minimum jumps to be in lane 1, 2 or 3 at the current point — and advance them point by point.",
        steps: [
          "At point 0: `dp = [1, 0, 1]` (lane 2 is free, the others cost one jump).",
          "For each point `i = 1..n`: if lane `o = obstacles[i]` is blocked, set `dp[o] = ∞` (the frog cannot be there).",
          "Let `best = min(dp)`; for every lane not blocked at `i`, `dp[l] = min(dp[l], best + 1)`.",
          "Return `min(dp)` at point `n`.",
        ],
        why: "Carrying `dp[l]` forward is the free hop in the same lane, valid only when lane `l` is open at point `i` (otherwise it was set to ∞). A side jump at point `i` can reach any open lane from the cheapest position at point `i`, which costs `min(dp) + 1`; one jump per point is enough, because two jumps at the same point can always be replaced by a single jump to the final lane.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Side jumps are not restricted to adjacent lanes.",
          "Block the obstacle's lane **before** computing the minimum for side jumps at that point.",
          "Lanes are 1-indexed in the input but usually 0-indexed in code.",
        ],
      }),
      examples: [
        { input: "[0,1,2,3,0]", expectedOutput: "2" },
        { input: "[0,1,1,3,3,0]", expectedOutput: "0" },
        { input: "[0,2,0]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const r = rng();
        const n = r < 0.2 ? ri(rng, 1, 4) : r < 0.85 ? ri(rng, 5, 40) : ri(rng, 41, 200);
        const p = pick(rng, [0.2, 0.5, 0.8, 1]);
        const obstacles = [0];
        for (let i = 1; i < n; i++) obstacles.push(rng() < p ? ri(rng, 1, 3) : 0);
        obstacles.push(0);
        return { input: fmtIntArr(obstacles), expectedOutput: String(ref(obstacles)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minSideJumps(obstacles: List[int]) -> int:
              INF = 10**9
              dp = [1, 0, 1]
              for i in range(1, len(obstacles)):
                  o = obstacles[i]
                  if o:
                      dp[o - 1] = INF
                  best = min(dp)
                  for lane in range(3):
                      if o != lane + 1 and best + 1 < dp[lane]:
                          dp[lane] = best + 1
              return min(dp)
        `,
        javascript: code`
          var minSideJumps = function(obstacles) {
              var INF = 1000000000;
              var dp = [1, 0, 1];
              for (var i = 1; i < obstacles.length; i++) {
                  var o = obstacles[i];
                  if (o > 0) dp[o - 1] = INF;
                  var best = Math.min(dp[0], dp[1], dp[2]);
                  for (var lane = 0; lane < 3; lane++) {
                      if (o !== lane + 1 && best + 1 < dp[lane]) dp[lane] = best + 1;
                  }
              }
              return Math.min(dp[0], dp[1], dp[2]);
          };
        `,
        typescript: code`
          function minSideJumps(obstacles: number[]): number {
              var INF = 1000000000;
              var dp = [1, 0, 1];
              for (var i = 1; i < obstacles.length; i++) {
                  var o = obstacles[i];
                  if (o > 0) dp[o - 1] = INF;
                  var best = Math.min(dp[0], dp[1], dp[2]);
                  for (var lane = 0; lane < 3; lane++) {
                      if (o !== lane + 1 && best + 1 < dp[lane]) dp[lane] = best + 1;
                  }
              }
              return Math.min(dp[0], dp[1], dp[2]);
          }
        `,
        java: code`
          public static int minSideJumps(int[] obstacles) {
              final int INF = 1000000000;
              int[] dp = {1, 0, 1};
              for (int i = 1; i < obstacles.length; i++) {
                  int o = obstacles[i];
                  if (o > 0) dp[o - 1] = INF;
                  int best = Math.min(dp[0], Math.min(dp[1], dp[2]));
                  for (int lane = 0; lane < 3; lane++) {
                      if (o != lane + 1 && best + 1 < dp[lane]) dp[lane] = best + 1;
                  }
              }
              return Math.min(dp[0], Math.min(dp[1], dp[2]));
          }
        `,
        cpp: code`
          int minSideJumps(vector<int>& obstacles) {
              const int INF = 1000000000;
              int dp[3] = {1, 0, 1};
              for (int i = 1; i < (int) obstacles.size(); i++) {
                  int o = obstacles[i];
                  if (o > 0) dp[o - 1] = INF;
                  int best = min(dp[0], min(dp[1], dp[2]));
                  for (int lane = 0; lane < 3; lane++) {
                      if (o != lane + 1 && best + 1 < dp[lane]) dp[lane] = best + 1;
                  }
              }
              return min(dp[0], min(dp[1], dp[2]));
          }
        `,
        c: code`
          int minSideJumps(int* obstacles, int obstaclesSize) {
              const int INF = 1000000000;
              int dp[3] = {1, 0, 1};
              for (int i = 1; i < obstaclesSize; i++) {
                  int o = obstacles[i];
                  if (o > 0) dp[o - 1] = INF;
                  int best = dp[0];
                  if (dp[1] < best) best = dp[1];
                  if (dp[2] < best) best = dp[2];
                  for (int lane = 0; lane < 3; lane++) {
                      if (o != lane + 1 && best + 1 < dp[lane]) dp[lane] = best + 1;
                  }
              }
              int res = dp[0];
              if (dp[1] < res) res = dp[1];
              if (dp[2] < res) res = dp[2];
              return res;
          }
        `,
        csharp: code`
          public static int MinSideJumps(int[] obstacles)
          {
              const int INF = 1000000000;
              int[] dp = { 1, 0, 1 };
              for (int i = 1; i < obstacles.Length; i++)
              {
                  int o = obstacles[i];
                  if (o > 0) dp[o - 1] = INF;
                  int best = Math.Min(dp[0], Math.Min(dp[1], dp[2]));
                  for (int lane = 0; lane < 3; lane++)
                  {
                      if (o != lane + 1 && best + 1 < dp[lane]) dp[lane] = best + 1;
                  }
              }
              return Math.Min(dp[0], Math.Min(dp[1], dp[2]));
          }
        `,
        go: code`
          func minSideJumps(obstacles []int) int {
          	const INF = 1000000000
          	dp := []int{1, 0, 1}
          	minOf3 := func() int {
          		b := dp[0]
          		if dp[1] < b {
          			b = dp[1]
          		}
          		if dp[2] < b {
          			b = dp[2]
          		}
          		return b
          	}
          	for i := 1; i < len(obstacles); i++ {
          		o := obstacles[i]
          		if o > 0 {
          			dp[o-1] = INF
          		}
          		best := minOf3()
          		for lane := 0; lane < 3; lane++ {
          			if o != lane+1 && best+1 < dp[lane] {
          				dp[lane] = best + 1
          			}
          		}
          	}
          	return minOf3()
          }
        `,
        kotlin: code`
          fun minSideJumps(obstacles: IntArray): Int {
              val INF = 1000000000
              val dp = intArrayOf(1, 0, 1)
              for (i in 1 until obstacles.size) {
                  val o = obstacles[i]
                  if (o > 0) dp[o - 1] = INF
                  val best = minOf(dp[0], minOf(dp[1], dp[2]))
                  for (lane in 0 until 3) {
                      if (o != lane + 1 && best + 1 < dp[lane]) dp[lane] = best + 1
                  }
              }
              return minOf(dp[0], minOf(dp[1], dp[2]))
          }
        `,
        swift: code`
          func minSideJumps(_ obstacles: [Int]) -> Int {
              let INF = 1000000000
              var dp = [1, 0, 1]
              for i in 1..<obstacles.count {
                  let o = obstacles[i]
                  if o > 0 { dp[o - 1] = INF }
                  let best = min(dp[0], dp[1], dp[2])
                  for lane in 0..<3 {
                      if o != lane + 1 && best + 1 < dp[lane] { dp[lane] = best + 1 }
                  }
              }
              return min(dp[0], dp[1], dp[2])
          }
        `,
        rust: code`
          fn minSideJumps(obstacles: Vec<i32>) -> i32 {
              let inf = 1000000000;
              let mut dp = [1i32, 0, 1];
              for i in 1..obstacles.len() {
                  let o = obstacles[i];
                  if o > 0 {
                      dp[(o - 1) as usize] = inf;
                  }
                  let best = dp[0].min(dp[1]).min(dp[2]);
                  for lane in 0..3 {
                      if o != lane as i32 + 1 && best + 1 < dp[lane] {
                          dp[lane] = best + 1;
                      }
                  }
              }
              dp[0].min(dp[1]).min(dp[2])
          }
        `,
        php: code`
          function minSideJumps($obstacles) {
              $INF = 1000000000;
              $dp = [1, 0, 1];
              $len = count($obstacles);
              for ($i = 1; $i < $len; $i++) {
                  $o = $obstacles[$i];
                  if ($o > 0) $dp[$o - 1] = $INF;
                  $best = min($dp[0], $dp[1], $dp[2]);
                  for ($lane = 0; $lane < 3; $lane++) {
                      if ($o != $lane + 1 && $best + 1 < $dp[$lane]) $dp[$lane] = $best + 1;
                  }
              }
              return min($dp[0], $dp[1], $dp[2]);
          }
        `,
        ruby: code`
          def minSideJumps(obstacles)
            inf = 1_000_000_000
            dp = [1, 0, 1]
            (1...obstacles.length).each do |i|
              o = obstacles[i]
              dp[o - 1] = inf if o > 0
              best = dp.min
              3.times do |lane|
                dp[lane] = best + 1 if o != lane + 1 && best + 1 < dp[lane]
              end
            end
            dp.min
          end
        `,
      },
    };
  })(),

  // ── Minimum Total Space Wasted With K Resizing Operations (LC 1959) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      // f(i, r) = least waste for nums[i..] with r resizes still allowed
      const n = nums.length;
      const memo = new Map<number, number>();
      const f = (i: number, r: number): number => {
        if (i === n) return 0;
        const key = i * 1000 + r;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = Infinity, mx = 0, sum = 0;
        for (let j = i; j < n; j++) {
          mx = Math.max(mx, nums[j]);
          sum += nums[j];
          const waste = mx * (j - i + 1) - sum;
          if (j === n - 1) best = Math.min(best, waste);
          else if (r > 0) best = Math.min(best, waste + f(j + 1, r - 1));
        }
        memo.set(key, best);
        return best;
      };
      return f(0, k);
    };
    return {
      slug: "minimum-total-space-wasted-with-k-resizing-operations",
      title: "Minimum Total Space Wasted With K Resizing Operations",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "minSpaceWastedKResizing",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are designing a dynamic buffer. `nums[t]` is the number of elements it must hold at time `t`. At every time `t` the buffer's size `size_t` must be at least `nums[t]`, and the space wasted at time `t` is `size_t - nums[t]`. The **total waste** is the sum over all times.\n\nThe initial size can be anything and is free. After that, you may **resize** the buffer at most `k` times (each resize sets a new size of your choice).\n\nReturn the minimum possible total waste.",
        [
          { in: "nums = [10,20], k = 0", out: "10", note: "Without resizing the size must be 20 throughout, wasting 10 at time 0." },
          { in: "nums = [10,20,30], k = 1", out: "10", note: "Size 20 for times 0–1, then resize to 30." },
          { in: "nums = [10,20,15,30,20], k = 2", out: "15", note: "Sizes 10 | 20, 20 | 30, 30: waste 0 + 5 + 10." },
        ],
        ["1 <= nums.length <= 200", "1 <= nums[i] <= 10^6", "0 <= k <= nums.length - 1"]),
      hints: [
        "With `r` resizes the timeline splits into at most `r + 1` consecutive segments, each with one fixed size.",
        "Within a segment the best size is the segment's maximum, so its waste is `max · length − sum`.",
        "Let `dp[i][j]` be the least waste for the first `i` times split into `j` segments; try every start of the last segment.",
      ],
      editorial: explain({
        idea: "Resizing at most `k` times means cutting the array into at most `k + 1` contiguous blocks. Each block uses its own maximum as the size, wasting `max · len − sum`. The task becomes a classic partition DP.",
        steps: [
          "`dp[0][0] = 0`, every other entry ∞.",
          "For each prefix length `i`, scan the last block's start `p` from `i - 1` down to 0, maintaining the block's maximum and sum, so `waste(p, i-1)` is O(1) per step.",
          "For every block count `j = 1..k+1`: `dp[i][j] = min(dp[i][j], dp[p][j-1] + waste(p, i-1))`.",
          "Return `min over j ≤ k+1 of dp[n][j]`.",
        ],
        why: "Any schedule with at most `k` resizes is a partition into at most `k + 1` blocks, and for a fixed partition setting each block to its maximum is optimal (smaller is illegal, larger only wastes more). The DP enumerates every partition's last block and reuses the optimal cost of the prefix before it.",
        time: "O(n² · k)",
        space: "O(n · k)",
        pitfalls: [
          "`k` resizes give `k + 1` blocks — the initial size is free.",
          "Using fewer resizes than allowed is fine; take the minimum over all block counts up to `k + 1`.",
          "The total waste fits in 32 bits (at most `200 · 10^6`), but `max · len` must not be accumulated carelessly in a type narrower than that.",
        ],
      }),
      examples: [
        { input: "[10,20]\n0", expectedOutput: "10" },
        { input: "[10,20,30]\n1", expectedOutput: "10" },
        { input: "[10,20,15,30,20]\n2", expectedOutput: "15" },
      ],
      gen: (rng: Rng) => {
        const r = rng();
        const n = r < 0.3 ? ri(rng, 1, 5) : r < 0.85 ? ri(rng, 6, 14) : ri(rng, 15, 22);
        const k = rng() < 0.2 ? 0 : rng() < 0.1 ? n - 1 : ri(rng, 0, n - 1);
        const hi = pick(rng, [5, 100, 1000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums) + "\n" + k, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minSpaceWastedKResizing(nums: List[int], k: int) -> int:
              n = len(nums)
              segs = k + 1
              INF = 10**18
              dp = [[INF] * (segs + 1) for _ in range(n + 1)]
              dp[0][0] = 0
              for i in range(1, n + 1):
                  mx = 0
                  total = 0
                  for p in range(i - 1, -1, -1):
                      if nums[p] > mx:
                          mx = nums[p]
                      total += nums[p]
                      waste = mx * (i - p) - total
                      prev = dp[p]
                      cur = dp[i]
                      for j in range(1, segs + 1):
                          if prev[j - 1] + waste < cur[j]:
                              cur[j] = prev[j - 1] + waste
              return min(dp[n][1:])
        `,
        javascript: code`
          var minSpaceWastedKResizing = function(nums, k) {
              var n = nums.length, segs = k + 1;
              var dp = [];
              for (var i = 0; i <= n; i++) dp.push(new Array(segs + 1).fill(Infinity));
              dp[0][0] = 0;
              for (i = 1; i <= n; i++) {
                  var mx = 0, total = 0;
                  for (var p = i - 1; p >= 0; p--) {
                      if (nums[p] > mx) mx = nums[p];
                      total += nums[p];
                      var waste = mx * (i - p) - total;
                      for (var j = 1; j <= segs; j++) {
                          if (dp[p][j - 1] + waste < dp[i][j]) dp[i][j] = dp[p][j - 1] + waste;
                      }
                  }
              }
              var best = Infinity;
              for (j = 1; j <= segs; j++) if (dp[n][j] < best) best = dp[n][j];
              return best;
          };
        `,
        typescript: code`
          function minSpaceWastedKResizing(nums: number[], k: number): number {
              var n = nums.length, segs = k + 1;
              var INF = 4000000000;
              var dp: number[][] = [];
              for (var i = 0; i <= n; i++) {
                  var row: number[] = [];
                  for (var t = 0; t <= segs; t++) row.push(INF);
                  dp.push(row);
              }
              dp[0][0] = 0;
              for (i = 1; i <= n; i++) {
                  var mx = 0, total = 0;
                  for (var p = i - 1; p >= 0; p--) {
                      if (nums[p] > mx) mx = nums[p];
                      total += nums[p];
                      var waste = mx * (i - p) - total;
                      for (var j = 1; j <= segs; j++) {
                          if (dp[p][j - 1] + waste < dp[i][j]) dp[i][j] = dp[p][j - 1] + waste;
                      }
                  }
              }
              var best = INF;
              for (j = 1; j <= segs; j++) if (dp[n][j] < best) best = dp[n][j];
              return best;
          }
        `,
        java: code`
          public static int minSpaceWastedKResizing(int[] nums, int k) {
              int n = nums.length, segs = k + 1;
              final int INF = Integer.MAX_VALUE;
              int[][] dp = new int[n + 1][segs + 1];
              for (int[] row : dp) Arrays.fill(row, INF);
              dp[0][0] = 0;
              for (int i = 1; i <= n; i++) {
                  int mx = 0, total = 0;
                  for (int p = i - 1; p >= 0; p--) {
                      mx = Math.max(mx, nums[p]);
                      total += nums[p];
                      int waste = mx * (i - p) - total;
                      for (int j = 1; j <= segs; j++) {
                          if (dp[p][j - 1] == INF) continue;
                          dp[i][j] = Math.min(dp[i][j], dp[p][j - 1] + waste);
                      }
                  }
              }
              int best = INF;
              for (int j = 1; j <= segs; j++) best = Math.min(best, dp[n][j]);
              return best;
          }
        `,
        cpp: code`
          int minSpaceWastedKResizing(vector<int>& nums, int k) {
              int n = nums.size(), segs = k + 1;
              const long long INF = LLONG_MAX / 4;
              vector<vector<long long>> dp(n + 1, vector<long long>(segs + 1, INF));
              dp[0][0] = 0;
              for (int i = 1; i <= n; i++) {
                  long long mx = 0, total = 0;
                  for (int p = i - 1; p >= 0; p--) {
                      mx = max(mx, (long long) nums[p]);
                      total += nums[p];
                      long long waste = mx * (i - p) - total;
                      for (int j = 1; j <= segs; j++) {
                          dp[i][j] = min(dp[i][j], dp[p][j - 1] + waste);
                      }
                  }
              }
              long long best = INF;
              for (int j = 1; j <= segs; j++) best = min(best, dp[n][j]);
              return (int) best;
          }
        `,
        c: code`
          int minSpaceWastedKResizing(int* nums, int numsSize, int k) {
              int n = numsSize, segs = k + 1;
              const long long INF = 4000000000000000000LL;
              long long* dp = (long long*)malloc(sizeof(long long) * (n + 1) * (segs + 1));
              for (int t = 0; t < (n + 1) * (segs + 1); t++) dp[t] = INF;
              dp[0] = 0;
              for (int i = 1; i <= n; i++) {
                  long long mx = 0, total = 0;
                  for (int p = i - 1; p >= 0; p--) {
                      if (nums[p] > mx) mx = nums[p];
                      total += nums[p];
                      long long waste = mx * (i - p) - total;
                      for (int j = 1; j <= segs; j++) {
                          long long prev = dp[p * (segs + 1) + j - 1];
                          if (prev == INF) continue;
                          if (prev + waste < dp[i * (segs + 1) + j]) dp[i * (segs + 1) + j] = prev + waste;
                      }
                  }
              }
              long long best = INF;
              for (int j = 1; j <= segs; j++) if (dp[n * (segs + 1) + j] < best) best = dp[n * (segs + 1) + j];
              free(dp);
              return (int) best;
          }
        `,
        csharp: code`
          public static int MinSpaceWastedKResizing(int[] nums, int k)
          {
              int n = nums.Length, segs = k + 1;
              const long INF = long.MaxValue / 4;
              long[,] dp = new long[n + 1, segs + 1];
              for (int i = 0; i <= n; i++)
                  for (int j = 0; j <= segs; j++) dp[i, j] = INF;
              dp[0, 0] = 0;
              for (int i = 1; i <= n; i++)
              {
                  long mx = 0, total = 0;
                  for (int p = i - 1; p >= 0; p--)
                  {
                      mx = Math.Max(mx, nums[p]);
                      total += nums[p];
                      long waste = mx * (i - p) - total;
                      for (int j = 1; j <= segs; j++)
                      {
                          dp[i, j] = Math.Min(dp[i, j], dp[p, j - 1] + waste);
                      }
                  }
              }
              long best = INF;
              for (int j = 1; j <= segs; j++) best = Math.Min(best, dp[n, j]);
              return (int)best;
          }
        `,
        go: code`
          func minSpaceWastedKResizing(nums []int, k int) int {
          	n, segs := len(nums), k+1
          	const INF = 1 << 60
          	dp := make([][]int, n+1)
          	for i := range dp {
          		dp[i] = make([]int, segs+1)
          		for j := range dp[i] {
          			dp[i][j] = INF
          		}
          	}
          	dp[0][0] = 0
          	for i := 1; i <= n; i++ {
          		mx, total := 0, 0
          		for p := i - 1; p >= 0; p-- {
          			if nums[p] > mx {
          				mx = nums[p]
          			}
          			total += nums[p]
          			waste := mx*(i-p) - total
          			for j := 1; j <= segs; j++ {
          				if dp[p][j-1]+waste < dp[i][j] {
          					dp[i][j] = dp[p][j-1] + waste
          				}
          			}
          		}
          	}
          	best := INF
          	for j := 1; j <= segs; j++ {
          		if dp[n][j] < best {
          			best = dp[n][j]
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minSpaceWastedKResizing(nums: IntArray, k: Int): Int {
              val n = nums.size
              val segs = k + 1
              val INF = Long.MAX_VALUE / 4
              val dp = Array(n + 1) { LongArray(segs + 1) { INF } }
              dp[0][0] = 0L
              for (i in 1..n) {
                  var mx = 0L
                  var total = 0L
                  for (p in i - 1 downTo 0) {
                      if (nums[p] > mx) mx = nums[p].toLong()
                      total += nums[p]
                      val waste = mx * (i - p) - total
                      for (j in 1..segs) {
                          if (dp[p][j - 1] + waste < dp[i][j]) dp[i][j] = dp[p][j - 1] + waste
                      }
                  }
              }
              var best = INF
              for (j in 1..segs) if (dp[n][j] < best) best = dp[n][j]
              return best.toInt()
          }
        `,
        swift: code`
          func minSpaceWastedKResizing(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              let segs = k + 1
              let INF = Int.max / 4
              var dp = [[Int]](repeating: [Int](repeating: INF, count: segs + 1), count: n + 1)
              dp[0][0] = 0
              for i in 1...n {
                  var mx = 0
                  var total = 0
                  var p = i - 1
                  while p >= 0 {
                      if nums[p] > mx { mx = nums[p] }
                      total += nums[p]
                      let waste = mx * (i - p) - total
                      for j in 1...segs {
                          if dp[p][j - 1] + waste < dp[i][j] { dp[i][j] = dp[p][j - 1] + waste }
                      }
                      p -= 1
                  }
              }
              var best = INF
              for j in 1...segs where dp[n][j] < best { best = dp[n][j] }
              return best
          }
        `,
        rust: code`
          fn minSpaceWastedKResizing(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let segs = (k + 1) as usize;
              let inf: i64 = std::i64::MAX / 4;
              let mut dp = vec![vec![inf; segs + 1]; n + 1];
              dp[0][0] = 0;
              for i in 1..=n {
                  let mut mx: i64 = 0;
                  let mut total: i64 = 0;
                  for p in (0..i).rev() {
                      mx = mx.max(nums[p] as i64);
                      total += nums[p] as i64;
                      let waste = mx * ((i - p) as i64) - total;
                      for j in 1..=segs {
                          let cand = dp[p][j - 1] + waste;
                          if cand < dp[i][j] {
                              dp[i][j] = cand;
                          }
                      }
                  }
              }
              let mut best = inf;
              for j in 1..=segs {
                  best = best.min(dp[n][j]);
              }
              best as i32
          }
        `,
        php: code`
          function minSpaceWastedKResizing($nums, $k) {
              $n = count($nums);
              $segs = $k + 1;
              $INF = PHP_INT_MAX >> 2;
              $dp = array_fill(0, $n + 1, array_fill(0, $segs + 1, $INF));
              $dp[0][0] = 0;
              for ($i = 1; $i <= $n; $i++) {
                  $mx = 0;
                  $total = 0;
                  for ($p = $i - 1; $p >= 0; $p--) {
                      if ($nums[$p] > $mx) $mx = $nums[$p];
                      $total += $nums[$p];
                      $waste = $mx * ($i - $p) - $total;
                      for ($j = 1; $j <= $segs; $j++) {
                          if ($dp[$p][$j - 1] + $waste < $dp[$i][$j]) $dp[$i][$j] = $dp[$p][$j - 1] + $waste;
                      }
                  }
              }
              $best = $INF;
              for ($j = 1; $j <= $segs; $j++) if ($dp[$n][$j] < $best) $best = $dp[$n][$j];
              return $best;
          }
        `,
        ruby: code`
          def minSpaceWastedKResizing(nums, k)
            n = nums.length
            segs = k + 1
            inf = 1 << 60
            dp = Array.new(n + 1) { Array.new(segs + 1, inf) }
            dp[0][0] = 0
            (1..n).each do |i|
              mx = 0
              total = 0
              (i - 1).downto(0) do |p|
                mx = nums[p] if nums[p] > mx
                total += nums[p]
                waste = mx * (i - p) - total
                prev = dp[p]
                cur = dp[i]
                (1..segs).each do |j|
                  cand = prev[j - 1] + waste
                  cur[j] = cand if cand < cur[j]
                end
              end
            end
            dp[n][1..segs].min
          end
        `,
      },
    };
  })(),

  // ── Minimize the Difference Between Target and Chosen Elements (LC 1981) ──
  (() => {
    const ref = (mat: number[][], target: number) => {
      // every reachable sum, no pruning
      let sums = new Set<number>([0]);
      for (const row of mat) {
        const nxt = new Set<number>();
        for (const s of sums) for (const v of row) nxt.add(s + v);
        sums = nxt;
      }
      let best = Infinity;
      for (const s of sums) best = Math.min(best, Math.abs(s - target));
      return best;
    };
    return {
      slug: "minimize-the-difference-between-target-and-chosen-elements",
      title: "Minimize the Difference Between Target and Chosen Elements",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Google", "Amazon"],
      signature: {
        funcName: "minimizeTheDifference",
        params: [{ name: "mat", type: "int[][]" as const }, { name: "target", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an `m x n` integer matrix `mat` and an integer `target`. Pick **exactly one** element from **every row** and add the picked elements up.\n\nReturn the smallest possible value of `|sum - target|`.",
        [
          { in: "mat = [[1,2,3],[4,5,6],[7,8,9]], target = 13", out: "0", note: "1 + 5 + 7 = 13." },
          { in: "mat = [[2,5],[3,7]], target = 11", out: "1", note: "Reachable sums are 5, 8, 9 and 12; 12 is closest." },
          { in: "mat = [[1],[2],[3]], target = 100", out: "94" },
        ],
        ["m == mat.length", "n == mat[i].length", "1 <= m, n <= 70", "1 <= mat[i][j] <= 70", "1 <= target <= 800"]),
      hints: [
        "Values and row counts are small, so the set of reachable sums is small too (at most 70 · 70).",
        "Process row by row, turning the set of sums reachable so far into the set after picking one value from the next row.",
        "Sums above `target` only get worse as more rows are added — of those, keep only the smallest one.",
      ],
      editorial: explain({
        idea: "A subset-sum style DP over rows. Track which partial sums are reachable; because every element is positive, a partial sum that already exceeds `target` can only drift further away, so among those it suffices to remember the minimum.",
        steps: [
          "Keep a boolean array `reach[0..target]` (start with `reach[0] = true`) and `over` = the smallest reachable partial sum above `target` (start: none).",
          "For each row: new `over` = old `over` + the row's minimum (if old `over` exists). For each reachable `s` and each value `v` in the row: if `s + v <= target` mark it in the new array, otherwise update the new `over` with `s + v`.",
          "After the last row the answer is the smaller of `target - (largest reachable s)` and `over - target`.",
        ],
        why: "All partial sums up to `target` are tracked exactly. Any final sum built from a partial sum `p > target` is at least `p` plus the remaining rows' minima, which is minimised by the smallest such `p` — so dropping the other over-target sums never loses the optimum.",
        time: "O(m · n · target)",
        space: "O(target)",
        pitfalls: [
          "Every row must contribute exactly one element — skipping a row is not allowed.",
          "Without the cap, the set of sums can reach 4,900 values per row; it is still fine, but the cap makes it tighter.",
          "Do not prune sums below `target` greedily — a smaller partial sum can still end closer.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]\n13", expectedOutput: "0" },
        { input: "[[2,5],[3,7]]\n11", expectedOutput: "1" },
        { input: "[[1],[2],[3]]\n100", expectedOutput: "94" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, rng() < 0.85 ? 6 : 10);
        const n = ri(rng, 1, rng() < 0.85 ? 6 : 10);
        const hi = pick(rng, [3, 10, 70]);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, hi)));
        const target = rng() < 0.75 ? ri(rng, 1, Math.min(800, m * hi + 5)) : ri(rng, 1, 800);
        return { input: fmtIntMat(mat) + "\n" + target, expectedOutput: String(ref(mat, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimizeTheDifference(mat: List[List[int]], target: int) -> int:
              reach = {0}
              for row in mat:
                  vals = set(row)
                  nxt = set()
                  over = None
                  for s in reach:
                      for v in vals:
                          t = s + v
                          if t <= target:
                              nxt.add(t)
                          elif over is None or t < over:
                              over = t
                  if over is not None:
                      nxt.add(over)
                  reach = nxt
              return min(abs(s - target) for s in reach)
        `,
        javascript: code`
          var minimizeTheDifference = function(mat, target) {
              var INF = 1000000000;
              var reach = new Array(target + 1).fill(false);
              reach[0] = true;
              var over = INF;
              for (var r = 0; r < mat.length; r++) {
                  var row = mat[r];
                  var rowMin = INF;
                  for (var c = 0; c < row.length; c++) if (row[c] < rowMin) rowMin = row[c];
                  var nxt = new Array(target + 1).fill(false);
                  var nOver = over === INF ? INF : over + rowMin;
                  for (var s = 0; s <= target; s++) {
                      if (!reach[s]) continue;
                      for (c = 0; c < row.length; c++) {
                          var t = s + row[c];
                          if (t <= target) nxt[t] = true;
                          else if (t < nOver) nOver = t;
                      }
                  }
                  reach = nxt;
                  over = nOver;
              }
              var best = over === INF ? INF : over - target;
              for (s = 0; s <= target; s++) if (reach[s] && target - s < best) best = target - s;
              return best;
          };
        `,
        typescript: code`
          function minimizeTheDifference(mat: number[][], target: number): number {
              var INF = 1000000000;
              var reach: boolean[] = [];
              for (var i = 0; i <= target; i++) reach.push(i === 0);
              var over = INF;
              for (var r = 0; r < mat.length; r++) {
                  var row = mat[r];
                  var rowMin = INF;
                  for (var c = 0; c < row.length; c++) if (row[c] < rowMin) rowMin = row[c];
                  var nxt: boolean[] = [];
                  for (i = 0; i <= target; i++) nxt.push(false);
                  var nOver = over === INF ? INF : over + rowMin;
                  for (var s = 0; s <= target; s++) {
                      if (!reach[s]) continue;
                      for (c = 0; c < row.length; c++) {
                          var t = s + row[c];
                          if (t <= target) nxt[t] = true;
                          else if (t < nOver) nOver = t;
                      }
                  }
                  reach = nxt;
                  over = nOver;
              }
              var best = over === INF ? INF : over - target;
              for (s = 0; s <= target; s++) if (reach[s] && target - s < best) best = target - s;
              return best;
          }
        `,
        java: code`
          public static int minimizeTheDifference(int[][] mat, int target) {
              final int INF = 1000000000;
              boolean[] reach = new boolean[target + 1];
              reach[0] = true;
              int over = INF;
              for (int[] row : mat) {
                  int rowMin = INF;
                  for (int v : row) rowMin = Math.min(rowMin, v);
                  boolean[] nxt = new boolean[target + 1];
                  int nOver = over == INF ? INF : over + rowMin;
                  for (int s = 0; s <= target; s++) {
                      if (!reach[s]) continue;
                      for (int v : row) {
                          int t = s + v;
                          if (t <= target) nxt[t] = true;
                          else if (t < nOver) nOver = t;
                      }
                  }
                  reach = nxt;
                  over = nOver;
              }
              int best = over == INF ? INF : over - target;
              for (int s = 0; s <= target; s++) if (reach[s] && target - s < best) best = target - s;
              return best;
          }
        `,
        cpp: code`
          int minimizeTheDifference(vector<vector<int>>& mat, int target) {
              const int INF = 1000000000;
              vector<char> reach(target + 1, 0);
              reach[0] = 1;
              int over = INF;
              for (auto& row : mat) {
                  int rowMin = *min_element(row.begin(), row.end());
                  vector<char> nxt(target + 1, 0);
                  int nOver = over == INF ? INF : over + rowMin;
                  for (int s = 0; s <= target; s++) {
                      if (!reach[s]) continue;
                      for (int v : row) {
                          int t = s + v;
                          if (t <= target) nxt[t] = 1;
                          else if (t < nOver) nOver = t;
                      }
                  }
                  reach = nxt;
                  over = nOver;
              }
              int best = over == INF ? INF : over - target;
              for (int s = 0; s <= target; s++) if (reach[s] && target - s < best) best = target - s;
              return best;
          }
        `,
        c: code`
          int minimizeTheDifference(int** mat, int matSize, int* matColSize, int target) {
              const int INF = 1000000000;
              char* reach = (char*)calloc(target + 1, 1);
              char* nxt = (char*)calloc(target + 1, 1);
              reach[0] = 1;
              int over = INF;
              for (int r = 0; r < matSize; r++) {
                  int* row = mat[r];
                  int cols = matColSize[r];
                  int rowMin = INF;
                  for (int c = 0; c < cols; c++) if (row[c] < rowMin) rowMin = row[c];
                  for (int s = 0; s <= target; s++) nxt[s] = 0;
                  int nOver = over == INF ? INF : over + rowMin;
                  for (int s = 0; s <= target; s++) {
                      if (!reach[s]) continue;
                      for (int c = 0; c < cols; c++) {
                          int t = s + row[c];
                          if (t <= target) nxt[t] = 1;
                          else if (t < nOver) nOver = t;
                      }
                  }
                  char* tmp = reach;
                  reach = nxt;
                  nxt = tmp;
                  over = nOver;
              }
              int best = over == INF ? INF : over - target;
              for (int s = 0; s <= target; s++) if (reach[s] && target - s < best) best = target - s;
              free(reach);
              free(nxt);
              return best;
          }
        `,
        csharp: code`
          public static int MinimizeTheDifference(int[][] mat, int target)
          {
              const int INF = 1000000000;
              bool[] reach = new bool[target + 1];
              reach[0] = true;
              int over = INF;
              foreach (int[] row in mat)
              {
                  int rowMin = row.Min();
                  bool[] nxt = new bool[target + 1];
                  int nOver = over == INF ? INF : over + rowMin;
                  for (int s = 0; s <= target; s++)
                  {
                      if (!reach[s]) continue;
                      foreach (int v in row)
                      {
                          int t = s + v;
                          if (t <= target) nxt[t] = true;
                          else if (t < nOver) nOver = t;
                      }
                  }
                  reach = nxt;
                  over = nOver;
              }
              int best = over == INF ? INF : over - target;
              for (int s = 0; s <= target; s++) if (reach[s] && target - s < best) best = target - s;
              return best;
          }
        `,
        go: code`
          func minimizeTheDifference(mat [][]int, target int) int {
          	const INF = 1000000000
          	reach := make([]bool, target+1)
          	reach[0] = true
          	over := INF
          	for _, row := range mat {
          		rowMin := INF
          		for _, v := range row {
          			if v < rowMin {
          				rowMin = v
          			}
          		}
          		nxt := make([]bool, target+1)
          		nOver := INF
          		if over != INF {
          			nOver = over + rowMin
          		}
          		for s := 0; s <= target; s++ {
          			if !reach[s] {
          				continue
          			}
          			for _, v := range row {
          				t := s + v
          				if t <= target {
          					nxt[t] = true
          				} else if t < nOver {
          					nOver = t
          				}
          			}
          		}
          		reach = nxt
          		over = nOver
          	}
          	best := INF
          	if over != INF {
          		best = over - target
          	}
          	for s := 0; s <= target; s++ {
          		if reach[s] && target-s < best {
          			best = target - s
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minimizeTheDifference(mat: Array<IntArray>, target: Int): Int {
              val INF = 1000000000
              var reach = BooleanArray(target + 1)
              reach[0] = true
              var over = INF
              for (row in mat) {
                  var rowMin = INF
                  for (v in row) if (v < rowMin) rowMin = v
                  val nxt = BooleanArray(target + 1)
                  var nOver = if (over == INF) INF else over + rowMin
                  for (s in 0..target) {
                      if (!reach[s]) continue
                      for (v in row) {
                          val t = s + v
                          if (t <= target) nxt[t] = true
                          else if (t < nOver) nOver = t
                      }
                  }
                  reach = nxt
                  over = nOver
              }
              var best = if (over == INF) INF else over - target
              for (s in 0..target) if (reach[s] && target - s < best) best = target - s
              return best
          }
        `,
        swift: code`
          func minimizeTheDifference(_ mat: [[Int]], _ target: Int) -> Int {
              let INF = 1000000000
              var reach = [Bool](repeating: false, count: target + 1)
              reach[0] = true
              var over = INF
              for row in mat {
                  let rowMin = row.min()!
                  var nxt = [Bool](repeating: false, count: target + 1)
                  var nOver = over == INF ? INF : over + rowMin
                  for s in 0...target where reach[s] {
                      for v in row {
                          let t = s + v
                          if t <= target {
                              nxt[t] = true
                          } else if t < nOver {
                              nOver = t
                          }
                      }
                  }
                  reach = nxt
                  over = nOver
              }
              var best = over == INF ? INF : over - target
              for s in 0...target where reach[s] && target - s < best { best = target - s }
              return best
          }
        `,
        rust: code`
          fn minimizeTheDifference(mat: Vec<Vec<i32>>, target: i32) -> i32 {
              let inf = 1000000000;
              let tu = target as usize;
              let mut reach = vec![false; tu + 1];
              reach[0] = true;
              let mut over = inf;
              for row in mat.iter() {
                  let row_min = *row.iter().min().unwrap();
                  let mut nxt = vec![false; tu + 1];
                  let mut n_over = if over == inf { inf } else { over + row_min };
                  for s in 0..=tu {
                      if !reach[s] {
                          continue;
                      }
                      for &v in row.iter() {
                          let t = s as i32 + v;
                          if t <= target {
                              nxt[t as usize] = true;
                          } else if t < n_over {
                              n_over = t;
                          }
                      }
                  }
                  reach = nxt;
                  over = n_over;
              }
              let mut best = if over == inf { inf } else { over - target };
              for s in 0..=tu {
                  if reach[s] && target - (s as i32) < best {
                      best = target - s as i32;
                  }
              }
              best
          }
        `,
        php: code`
          function minimizeTheDifference($mat, $target) {
              $INF = 1000000000;
              $reach = array_fill(0, $target + 1, false);
              $reach[0] = true;
              $over = $INF;
              foreach ($mat as $row) {
                  $rowMin = min($row);
                  $nxt = array_fill(0, $target + 1, false);
                  $nOver = $over == $INF ? $INF : $over + $rowMin;
                  for ($s = 0; $s <= $target; $s++) {
                      if (!$reach[$s]) continue;
                      foreach ($row as $v) {
                          $t = $s + $v;
                          if ($t <= $target) $nxt[$t] = true;
                          elseif ($t < $nOver) $nOver = $t;
                      }
                  }
                  $reach = $nxt;
                  $over = $nOver;
              }
              $best = $over == $INF ? $INF : $over - $target;
              for ($s = 0; $s <= $target; $s++) if ($reach[$s] && $target - $s < $best) $best = $target - $s;
              return $best;
          }
        `,
        ruby: code`
          def minimizeTheDifference(mat, target)
            reach = [0]
            mat.each do |row|
              vals = row.uniq
              nxt = {}
              over = nil
              reach.each do |s|
                vals.each do |v|
                  t = s + v
                  if t <= target
                    nxt[t] = true
                  elsif over.nil? || t < over
                    over = t
                  end
                end
              end
              nxt[over] = true unless over.nil?
              reach = nxt.keys
            end
            reach.map { |s| (s - target).abs }.min
          end
        `,
      },
    };
  })(),

  // ── Maximum Earnings From Taxi (LC 2008) ────────────────────────
  (() => {
    const ref = (n: number, rides: number[][]) => {
      // weighted interval scheduling, O(r²) over rides sorted by end point
      const rs = rides.slice().sort((a, b) => a[1] - b[1]);
      const best: number[] = [];
      let answer = 0;
      for (let i = 0; i < rs.length; i++) {
        let before = 0;
        for (let j = 0; j < i; j++) if (rs[j][1] <= rs[i][0]) before = Math.max(before, best[j]);
        best.push(before + rs[i][1] - rs[i][0] + rs[i][2]);
        answer = Math.max(answer, best[i]);
      }
      return answer;
    };
    return {
      slug: "maximum-earnings-from-taxi",
      title: "Maximum Earnings From Taxi",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Sorting", "Uber", "Amazon"],
      signature: {
        funcName: "maxTaxiEarnings",
        params: [{ name: "n", type: "int" as const }, { name: "rides", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You drive a taxi along a road with points `1` to `n`, always moving from point 1 towards point `n` — you can never turn back.\n\n`rides[i] = [start_i, end_i, tip_i]` is a passenger who wants to go from `start_i` to `end_i` and tips `tip_i`. Carrying that passenger earns `end_i - start_i + tip_i`. You can carry **at most one passenger at a time**, but you may pick someone up at the very point where you drop the previous passenger off.\n\nReturn the maximum amount you can earn.\n\n*CodeKairo bound:* tips are capped at `10^4` (LeetCode allows `10^5`) so that the answer always fits in a 32-bit integer.",
        [
          { in: "n = 5, rides = [[2,5,4],[1,5,1]]", out: "7", note: "Take the first passenger: 5 - 2 + 4." },
          { in: "n = 10, rides = [[1,4,2],[4,7,1],[2,9,3]]", out: "10", note: "The two short rides earn 5 + 4 = 9; the long one alone earns 7 + 3 = 10." },
          { in: "n = 20, rides = [[1,6,1],[3,10,2],[10,12,3],[11,12,2],[12,15,2],[13,18,1]]", out: "20" },
        ],
        ["1 <= n <= 10^5", "1 <= rides.length <= 3 * 10^4", "rides[i].length == 3", "1 <= start_i < end_i <= n", "1 <= tip_i <= 10^4"]),
      hints: [
        "Let `dp[p]` be the most you can have earned by the time you reach point `p`.",
        "Reaching `p` without finishing a ride there gives `dp[p - 1]`.",
        "For every ride ending at `p`: `dp[p] = max(dp[p], dp[start] + end - start + tip)`. Group the rides by end point first.",
      ],
      editorial: explain({
        idea: "Sweep the road left to right. The best earnings at point `p` either carry over from `p - 1` or come from finishing some ride exactly at `p`, which started at a point whose best earnings are already known.",
        steps: [
          "Bucket (or sort) the rides by end point.",
          "`dp[1] = 0`. For `p = 2..n`: `dp[p] = dp[p - 1]`, then for each ride `[s, p, tip]` ending here, `dp[p] = max(dp[p], dp[s] + p - s + tip)`.",
          "Return `dp[n]`.",
        ],
        why: "Any valid schedule is a chain of non-overlapping rides in order of position. The last ride finishing at or before `p` either ends exactly at `p` (and the rest of the schedule is a valid schedule up to its start `s`, worth at most `dp[s]`) or ends earlier (covered by `dp[p - 1]`). Induction on `p` shows `dp[p]` is the true optimum.",
        time: "O(n + r log r)",
        space: "O(n + r)",
        pitfalls: [
          "A new ride may start at the same point the previous one ends — compare with `<=`, not `<`.",
          "The base fare `end - start` counts too, not just the tip.",
          "With LeetCode's original bounds the answer needs 64 bits; the tightened tip bound keeps it under 2^31.",
        ],
      }),
      examples: [
        { input: "5\n[[2,5,4],[1,5,1]]", expectedOutput: "7" },
        { input: "10\n[[1,4,2],[4,7,1],[2,9,3]]", expectedOutput: "10" },
        { input: "20\n[[1,6,1],[3,10,2],[10,12,3],[11,12,2],[12,15,2],[13,18,1]]", expectedOutput: "20" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 2, 5) : ri(rng, 6, 80);
        const r = ri(rng, 1, rng() < 0.8 ? 15 : 40);
        const tipHi = pick(rng, [1, 10, 100, 10000]);
        const maxLen = pick(rng, [2, 5, n]);
        const rides: number[][] = [];
        for (let i = 0; i < r; i++) {
          const s = ri(rng, 1, n - 1);
          const e = ri(rng, s + 1, Math.min(n, s + maxLen));
          rides.push([s, e, ri(rng, 1, tipHi)]);
        }
        return { input: n + "\n" + fmtIntMat(rides), expectedOutput: String(ref(n, rides)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxTaxiEarnings(n: int, rides: List[List[int]]) -> int:
              ending = [[] for _ in range(n + 1)]
              for s, e, tip in rides:
                  ending[e].append((s, e - s + tip))
              dp = [0] * (n + 1)
              for p in range(2, n + 1):
                  best = dp[p - 1]
                  for s, gain in ending[p]:
                      if dp[s] + gain > best:
                          best = dp[s] + gain
                  dp[p] = best
              return dp[n]
        `,
        javascript: code`
          var maxTaxiEarnings = function(n, rides) {
              var rs = rides.slice().sort(function(a, b) { return a[1] - b[1]; });
              var dp = new Array(n + 1).fill(0);
              var ptr = 0;
              for (var p = 1; p <= n; p++) {
                  if (p > 1) dp[p] = dp[p - 1];
                  while (ptr < rs.length && rs[ptr][1] === p) {
                      var r = rs[ptr];
                      var cand = dp[r[0]] + r[1] - r[0] + r[2];
                      if (cand > dp[p]) dp[p] = cand;
                      ptr++;
                  }
              }
              return dp[n];
          };
        `,
        typescript: code`
          function maxTaxiEarnings(n: number, rides: number[][]): number {
              var rs = rides.slice().sort(function (a, b) { return a[1] - b[1]; });
              var dp: number[] = [];
              for (var t = 0; t <= n; t++) dp.push(0);
              var ptr = 0;
              for (var p = 1; p <= n; p++) {
                  if (p > 1) dp[p] = dp[p - 1];
                  while (ptr < rs.length && rs[ptr][1] === p) {
                      var r = rs[ptr];
                      var cand = dp[r[0]] + r[1] - r[0] + r[2];
                      if (cand > dp[p]) dp[p] = cand;
                      ptr++;
                  }
              }
              return dp[n];
          }
        `,
        java: code`
          public static int maxTaxiEarnings(int n, int[][] rides) {
              int[][] rs = rides.clone();
              Arrays.sort(rs, (a, b) -> Integer.compare(a[1], b[1]));
              int[] dp = new int[n + 1];
              int ptr = 0;
              for (int p = 1; p <= n; p++) {
                  if (p > 1) dp[p] = dp[p - 1];
                  while (ptr < rs.length && rs[ptr][1] == p) {
                      int[] r = rs[ptr];
                      dp[p] = Math.max(dp[p], dp[r[0]] + r[1] - r[0] + r[2]);
                      ptr++;
                  }
              }
              return dp[n];
          }
        `,
        cpp: code`
          int maxTaxiEarnings(int n, vector<vector<int>>& rides) {
              vector<vector<int>> rs(rides.begin(), rides.end());
              sort(rs.begin(), rs.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });
              vector<int> dp(n + 1, 0);
              size_t ptr = 0;
              for (int p = 1; p <= n; p++) {
                  if (p > 1) dp[p] = dp[p - 1];
                  while (ptr < rs.size() && rs[ptr][1] == p) {
                      dp[p] = max(dp[p], dp[rs[ptr][0]] + rs[ptr][1] - rs[ptr][0] + rs[ptr][2]);
                      ptr++;
                  }
              }
              return dp[n];
          }
        `,
        c: code`
          static int cmpByEndTaxi(const void* x, const void* y) {
              int a = ((const int*)x)[1], b = ((const int*)y)[1];
              return (a > b) - (a < b);
          }

          int maxTaxiEarnings(int n, int** rides, int ridesSize, int* ridesColSize) {
              int* rs = (int*)malloc(sizeof(int) * 3 * ridesSize);
              for (int i = 0; i < ridesSize; i++) {
                  rs[3 * i] = rides[i][0];
                  rs[3 * i + 1] = rides[i][1];
                  rs[3 * i + 2] = rides[i][2];
              }
              qsort(rs, ridesSize, sizeof(int) * 3, cmpByEndTaxi);
              int* dp = (int*)calloc(n + 1, sizeof(int));
              int ptr = 0;
              for (int p = 1; p <= n; p++) {
                  if (p > 1) dp[p] = dp[p - 1];
                  while (ptr < ridesSize && rs[3 * ptr + 1] == p) {
                      int s = rs[3 * ptr], e = rs[3 * ptr + 1], tip = rs[3 * ptr + 2];
                      int cand = dp[s] + e - s + tip;
                      if (cand > dp[p]) dp[p] = cand;
                      ptr++;
                  }
              }
              int res = dp[n];
              free(rs);
              free(dp);
              return res;
          }
        `,
        csharp: code`
          public static int MaxTaxiEarnings(int n, int[][] rides)
          {
              int[][] rs = rides.OrderBy(r => r[1]).ToArray();
              int[] dp = new int[n + 1];
              int ptr = 0;
              for (int p = 1; p <= n; p++)
              {
                  if (p > 1) dp[p] = dp[p - 1];
                  while (ptr < rs.Length && rs[ptr][1] == p)
                  {
                      int[] r = rs[ptr];
                      dp[p] = Math.Max(dp[p], dp[r[0]] + r[1] - r[0] + r[2]);
                      ptr++;
                  }
              }
              return dp[n];
          }
        `,
        go: code`
          func maxTaxiEarnings(n int, rides [][]int) int {
          	rs := make([][]int, len(rides))
          	copy(rs, rides)
          	sort.Slice(rs, func(i, j int) bool { return rs[i][1] < rs[j][1] })
          	dp := make([]int, n+1)
          	ptr := 0
          	for p := 1; p <= n; p++ {
          		if p > 1 {
          			dp[p] = dp[p-1]
          		}
          		for ptr < len(rs) && rs[ptr][1] == p {
          			r := rs[ptr]
          			cand := dp[r[0]] + r[1] - r[0] + r[2]
          			if cand > dp[p] {
          				dp[p] = cand
          			}
          			ptr++
          		}
          	}
          	return dp[n]
          }
        `,
        kotlin: code`
          fun maxTaxiEarnings(n: Int, rides: Array<IntArray>): Int {
              val rs = rides.sortedBy { it[1] }
              val dp = IntArray(n + 1)
              var ptr = 0
              for (p in 1..n) {
                  if (p > 1) dp[p] = dp[p - 1]
                  while (ptr < rs.size && rs[ptr][1] == p) {
                      val r = rs[ptr]
                      dp[p] = maxOf(dp[p], dp[r[0]] + r[1] - r[0] + r[2])
                      ptr++
                  }
              }
              return dp[n]
          }
        `,
        swift: code`
          func maxTaxiEarnings(_ n: Int, _ rides: [[Int]]) -> Int {
              let rs = rides.sorted { $0[1] < $1[1] }
              var dp = [Int](repeating: 0, count: n + 1)
              var ptr = 0
              for p in 1...n {
                  if p > 1 { dp[p] = dp[p - 1] }
                  while ptr < rs.count && rs[ptr][1] == p {
                      let r = rs[ptr]
                      dp[p] = max(dp[p], dp[r[0]] + r[1] - r[0] + r[2])
                      ptr += 1
                  }
              }
              return dp[n]
          }
        `,
        rust: code`
          fn maxTaxiEarnings(n: i32, rides: Vec<Vec<i32>>) -> i32 {
              let mut rs = rides.clone();
              rs.sort_by_key(|r| r[1]);
              let nu = n as usize;
              let mut dp = vec![0i32; nu + 1];
              let mut ptr = 0;
              for p in 1..=nu {
                  if p > 1 {
                      dp[p] = dp[p - 1];
                  }
                  while ptr < rs.len() && rs[ptr][1] as usize == p {
                      let r = &rs[ptr];
                      let cand = dp[r[0] as usize] + r[1] - r[0] + r[2];
                      if cand > dp[p] {
                          dp[p] = cand;
                      }
                      ptr += 1;
                  }
              }
              dp[nu]
          }
        `,
        php: code`
          function maxTaxiEarnings($n, $rides) {
              $rs = $rides;
              usort($rs, function ($a, $b) { return $a[1] <=> $b[1]; });
              $dp = array_fill(0, $n + 1, 0);
              $ptr = 0;
              $cnt = count($rs);
              for ($p = 1; $p <= $n; $p++) {
                  if ($p > 1) $dp[$p] = $dp[$p - 1];
                  while ($ptr < $cnt && $rs[$ptr][1] == $p) {
                      $r = $rs[$ptr];
                      $cand = $dp[$r[0]] + $r[1] - $r[0] + $r[2];
                      if ($cand > $dp[$p]) $dp[$p] = $cand;
                      $ptr++;
                  }
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def maxTaxiEarnings(n, rides)
            rs = rides.sort_by { |r| r[1] }
            dp = Array.new(n + 1, 0)
            ptr = 0
            (1..n).each do |p|
              dp[p] = dp[p - 1] if p > 1
              while ptr < rs.length && rs[ptr][1] == p
                s, e, tip = rs[ptr]
                cand = dp[s] + e - s + tip
                dp[p] = cand if cand > dp[p]
                ptr += 1
              end
            end
            dp[n]
          end
        `,
      },
    };
  })(),

  // ── Solving Questions With Brainpower (LC 2140) ─────────────────
  (() => {
    const ref = (q: number[][]) => {
      const n = q.length;
      const memo: number[] = [];
      const go = (i: number): number => {
        if (i >= n) return 0;
        if (memo[i] !== undefined) return memo[i];
        return (memo[i] = Math.max(go(i + 1), q[i][0] + go(i + q[i][1] + 1)));
      };
      return go(0);
    };
    return {
      slug: "solving-questions-with-brainpower",
      title: "Solving Questions With Brainpower",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "mostPoints", params: [{ name: "questions", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An exam has questions in a fixed order; `questions[i] = [points_i, brainpower_i]`. Go through them from first to last, and for each one decide to **solve** it or **skip** it:\n\n- solving question `i` earns `points_i`, but you must then skip the next `brainpower_i` questions;\n- skipping question `i` lets you decide freely on question `i + 1`.\n\nReturn the maximum total points you can earn.\n\n*CodeKairo bound:* `points_i <= 10^4` (LeetCode allows `10^5`) so that the answer fits in a 32-bit integer.",
        [
          { in: "questions = [[3,2],[4,3],[4,4],[2,5]]", out: "5", note: "Solve question 0 (3 points, skip 1 and 2), then question 3 (2 points)." },
          { in: "questions = [[1,1],[2,2],[3,3],[4,4],[5,5]]", out: "7", note: "Solve questions 1 and 4." },
          { in: "questions = [[10,1],[3,1],[8,5]]", out: "18" },
        ],
        ["1 <= questions.length <= 10^5", "questions[i].length == 2", "1 <= points_i <= 10^4", "1 <= brainpower_i <= 10^5"]),
      hints: [
        "Deciding forwards is awkward because solving a question blocks the next few. Think backwards.",
        "Let `dp[i]` be the best score from question `i` to the end.",
        "`dp[i] = max(dp[i + 1], points_i + dp[i + brainpower_i + 1])`, treating indices past the end as 0.",
      ],
      editorial: explain({
        idea: "Suffix DP: what happens after question `i` depends only on where you resume, so compute the best score of every suffix from right to left.",
        steps: [
          "`dp[n] = 0` (and anything past `n` is 0).",
          "For `i = n-1` down to 0: `dp[i] = max(dp[i+1], points_i + dp[min(n, i + brainpower_i + 1)])`.",
          "Return `dp[0]`.",
        ],
        why: "At question `i` there are exactly two choices. Skipping leaves the suffix starting at `i + 1`; solving earns `points_i` and forces you to resume at `i + brainpower_i + 1`. Each continuation is an independent suffix problem whose optimum is already computed, so taking the better choice yields the optimum for suffix `i`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Clamp the jump index to `n` — `i + brainpower_i + 1` can run far past the end.",
          "Greedy (always solve the most valuable reachable question) is wrong — example 2.",
          "With the original bounds (`10^5 · 10^5`) the answer needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[[3,2],[4,3],[4,4],[2,5]]", expectedOutput: "5" },
        { input: "[[1,1],[2,2],[3,3],[4,4],[5,5]]", expectedOutput: "7" },
        { input: "[[10,1],[3,1],[8,5]]", expectedOutput: "18" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 1, 4) : ri(rng, 5, rng() < 0.85 ? 30 : 120);
        const pHi = pick(rng, [5, 100, 10000]);
        const bHi = pick(rng, [1, 3, n, 100000]);
        const questions = Array.from({ length: n }, () => [ri(rng, 1, pHi), ri(rng, 1, bHi)]);
        return { input: fmtIntMat(questions), expectedOutput: String(ref(questions)) };
      },
      solutions: {
        python: code`
          from typing import List

          def mostPoints(questions: List[List[int]]) -> int:
              n = len(questions)
              dp = [0] * (n + 1)
              for i in range(n - 1, -1, -1):
                  pts, bp = questions[i]
                  j = min(n, i + bp + 1)
                  dp[i] = max(dp[i + 1], pts + dp[j])
              return dp[0]
        `,
        javascript: code`
          var mostPoints = function(questions) {
              var n = questions.length;
              var dp = new Array(n + 1).fill(0);
              for (var i = n - 1; i >= 0; i--) {
                  var j = Math.min(n, i + questions[i][1] + 1);
                  dp[i] = Math.max(dp[i + 1], questions[i][0] + dp[j]);
              }
              return dp[0];
          };
        `,
        typescript: code`
          function mostPoints(questions: number[][]): number {
              var n = questions.length;
              var dp: number[] = [];
              for (var t = 0; t <= n; t++) dp.push(0);
              for (var i = n - 1; i >= 0; i--) {
                  var j = Math.min(n, i + questions[i][1] + 1);
                  dp[i] = Math.max(dp[i + 1], questions[i][0] + dp[j]);
              }
              return dp[0];
          }
        `,
        java: code`
          public static int mostPoints(int[][] questions) {
              int n = questions.length;
              int[] dp = new int[n + 1];
              for (int i = n - 1; i >= 0; i--) {
                  int j = (int) Math.min((long) n, (long) i + questions[i][1] + 1);
                  dp[i] = Math.max(dp[i + 1], questions[i][0] + dp[j]);
              }
              return dp[0];
          }
        `,
        cpp: code`
          int mostPoints(vector<vector<int>>& questions) {
              int n = questions.size();
              vector<int> dp(n + 1, 0);
              for (int i = n - 1; i >= 0; i--) {
                  long long jj = (long long) i + questions[i][1] + 1;
                  int j = jj > n ? n : (int) jj;
                  dp[i] = max(dp[i + 1], questions[i][0] + dp[j]);
              }
              return dp[0];
          }
        `,
        c: code`
          int mostPoints(int** questions, int questionsSize, int* questionsColSize) {
              int n = questionsSize;
              int* dp = (int*)calloc(n + 1, sizeof(int));
              for (int i = n - 1; i >= 0; i--) {
                  long long jj = (long long) i + questions[i][1] + 1;
                  int j = jj > n ? n : (int) jj;
                  int take = questions[i][0] + dp[j];
                  dp[i] = dp[i + 1] > take ? dp[i + 1] : take;
              }
              int res = dp[0];
              free(dp);
              return res;
          }
        `,
        csharp: code`
          public static int MostPoints(int[][] questions)
          {
              int n = questions.Length;
              int[] dp = new int[n + 1];
              for (int i = n - 1; i >= 0; i--)
              {
                  long jj = (long)i + questions[i][1] + 1;
                  int j = jj > n ? n : (int)jj;
                  dp[i] = Math.Max(dp[i + 1], questions[i][0] + dp[j]);
              }
              return dp[0];
          }
        `,
        go: code`
          func mostPoints(questions [][]int) int {
          	n := len(questions)
          	dp := make([]int, n+1)
          	for i := n - 1; i >= 0; i-- {
          		j := i + questions[i][1] + 1
          		if j > n {
          			j = n
          		}
          		take := questions[i][0] + dp[j]
          		if take > dp[i+1] {
          			dp[i] = take
          		} else {
          			dp[i] = dp[i+1]
          		}
          	}
          	return dp[0]
          }
        `,
        kotlin: code`
          fun mostPoints(questions: Array<IntArray>): Int {
              val n = questions.size
              val dp = IntArray(n + 1)
              for (i in n - 1 downTo 0) {
                  val jj = i.toLong() + questions[i][1] + 1
                  val j = if (jj > n) n else jj.toInt()
                  dp[i] = maxOf(dp[i + 1], questions[i][0] + dp[j])
              }
              return dp[0]
          }
        `,
        swift: code`
          func mostPoints(_ questions: [[Int]]) -> Int {
              let n = questions.count
              var dp = [Int](repeating: 0, count: n + 1)
              var i = n - 1
              while i >= 0 {
                  let j = min(n, i + questions[i][1] + 1)
                  dp[i] = max(dp[i + 1], questions[i][0] + dp[j])
                  i -= 1
              }
              return dp[0]
          }
        `,
        rust: code`
          fn mostPoints(questions: Vec<Vec<i32>>) -> i32 {
              let n = questions.len();
              let mut dp = vec![0i32; n + 1];
              for i in (0..n).rev() {
                  let j = std::cmp::min(n, i + questions[i][1] as usize + 1);
                  dp[i] = dp[i + 1].max(questions[i][0] + dp[j]);
              }
              dp[0]
          }
        `,
        php: code`
          function mostPoints($questions) {
              $n = count($questions);
              $dp = array_fill(0, $n + 1, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $j = min($n, $i + $questions[$i][1] + 1);
                  $dp[$i] = max($dp[$i + 1], $questions[$i][0] + $dp[$j]);
              }
              return $dp[0];
          }
        `,
        ruby: code`
          def mostPoints(questions)
            n = questions.length
            dp = Array.new(n + 1, 0)
            (n - 1).downto(0) do |i|
              pts, bp = questions[i]
              j = [n, i + bp + 1].min
              take = pts + dp[j]
              dp[i] = take > dp[i + 1] ? take : dp[i + 1]
            end
            dp[0]
          end
        `,
      },
    };
  })(),

  // ── Extra Characters in a String (LC 2707) ──────────────────────
  (() => {
    const ref = (s: string, dictionary: string[]) => {
      const words = new Set(dictionary);
      const n = s.length;
      const memo: number[] = [];
      const go = (i: number): number => {
        if (i === n) return 0;
        if (memo[i] !== undefined) return memo[i];
        let best = 1 + go(i + 1);
        for (let j = i + 1; j <= n; j++) if (words.has(s.slice(i, j))) best = Math.min(best, go(j));
        return (memo[i] = best);
      };
      return go(0);
    };
    return {
      slug: "extra-characters-in-a-string",
      title: "Extra Characters in a String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Dynamic Programming", "Trie", "Amazon", "Google", "Adobe"],
      signature: {
        funcName: "minExtraChar",
        params: [{ name: "s", type: "string" as const }, { name: "dictionary", type: "string[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a string `s` and a list of words `dictionary`. Break `s` into one or more **non-overlapping substrings** such that each substring is a word in `dictionary`; characters of `s` that end up in no chosen substring are **extra**.\n\nReturn the minimum possible number of extra characters.",
        [
          { in: "s = \"dsaroadmap\", dictionary = [\"road\",\"map\",\"ds\"]", out: "1", note: "`ds` + `road` + `map` leave only the `a` at index 2 unused." },
          { in: "s = \"sayhelloworld\", dictionary = [\"hello\",\"world\"]", out: "3", note: "`say` is left over." },
          { in: "s = \"codekairo\", dictionary = [\"code\",\"kair\",\"kai\",\"ro\"]", out: "0" },
        ],
        ["1 <= s.length <= 50", "1 <= dictionary.length <= 50", "1 <= dictionary[i].length <= 50", "dictionary[i] and s consist of only lowercase English letters", "dictionary contains distinct words"]),
      hints: [
        "Let `dp[i]` be the fewest extra characters in the suffix `s[i:]`.",
        "Either character `i` is extra (`1 + dp[i + 1]`), or a dictionary word starts at `i`.",
        "For every word `w` that matches at position `i`, `dp[i] = min(dp[i], dp[i + len(w)])`.",
      ],
      editorial: explain({
        idea: "Suffix DP over positions: at each index you either throw the character away or consume a whole dictionary word that starts there.",
        steps: [
          "`dp[n] = 0`.",
          "For `i = n-1` down to 0: start with `dp[i] = 1 + dp[i + 1]`.",
          "For each dictionary word `w` with `s` starting with `w` at `i`, set `dp[i] = min(dp[i], dp[i + |w|])`.",
          "Return `dp[0]`.",
        ],
        why: "In an optimal break-up, position `i` is either unused (cost 1 plus the best for the rest) or the start of some chosen word, after which the rest is again an independent suffix problem. The DP tries both, so it finds the optimum.",
        time: "O(n · D · L) — n positions, D words of length up to L (a trie makes it O(n²))",
        space: "O(n)",
        pitfalls: [
          "Greedily taking the longest word that matches can be wrong — a shorter word may let a later word fit.",
          "Words may be longer than the rest of `s`; check bounds before comparing.",
          "Characters inside a chosen word are never extra, but chosen words cannot overlap.",
        ],
      }),
      examples: [
        { input: "\"dsaroadmap\"\n[\"road\",\"map\",\"ds\"]", expectedOutput: "1" },
        { input: "\"sayhelloworld\"\n[\"hello\",\"world\"]", expectedOutput: "3" },
        { input: "\"codekairo\"\n[\"code\",\"kair\",\"kai\",\"ro\"]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcde", "abcdefghijklmnopqrstuvwxyz"]);
        const n = rng() < 0.2 ? ri(rng, 1, 5) : ri(rng, 6, 40);
        const s = randLower(rng, n, n, alpha);
        const want = ri(rng, 1, rng() < 0.85 ? 12 : 30);
        const dict = new Set<string>();
        let guard = 0;
        while (dict.size < want && guard++ < 500) {
          if (rng() < 0.6) {
            const a = ri(rng, 0, n - 1);
            const b = Math.min(n, a + ri(rng, 1, 6));
            dict.add(s.slice(a, b));
          } else {
            dict.add(randLower(rng, 1, pick(rng, [3, 6, 12]), alpha));
          }
        }
        const dictionary = Array.from(dict);
        shuffle(rng, dictionary);
        return { input: `"${s}"\n${fmtStrArr(dictionary)}`, expectedOutput: String(ref(s, dictionary)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minExtraChar(s: str, dictionary: List[str]) -> int:
              n = len(s)
              dp = [0] * (n + 1)
              for i in range(n - 1, -1, -1):
                  best = 1 + dp[i + 1]
                  for w in dictionary:
                      if s.startswith(w, i) and dp[i + len(w)] < best:
                          best = dp[i + len(w)]
                  dp[i] = best
              return dp[0]
        `,
        javascript: code`
          var minExtraChar = function(s, dictionary) {
              var n = s.length;
              var dp = new Array(n + 1).fill(0);
              for (var i = n - 1; i >= 0; i--) {
                  var best = 1 + dp[i + 1];
                  for (var k = 0; k < dictionary.length; k++) {
                      var w = dictionary[k];
                      if (i + w.length <= n && s.substr(i, w.length) === w && dp[i + w.length] < best) best = dp[i + w.length];
                  }
                  dp[i] = best;
              }
              return dp[0];
          };
        `,
        typescript: code`
          function minExtraChar(s: string, dictionary: string[]): number {
              var n = s.length;
              var dp: number[] = [];
              for (var t = 0; t <= n; t++) dp.push(0);
              for (var i = n - 1; i >= 0; i--) {
                  var best = 1 + dp[i + 1];
                  for (var k = 0; k < dictionary.length; k++) {
                      var w = dictionary[k];
                      if (i + w.length <= n && s.substr(i, w.length) === w && dp[i + w.length] < best) best = dp[i + w.length];
                  }
                  dp[i] = best;
              }
              return dp[0];
          }
        `,
        java: code`
          public static int minExtraChar(String s, String[] dictionary) {
              int n = s.length();
              int[] dp = new int[n + 1];
              for (int i = n - 1; i >= 0; i--) {
                  int best = 1 + dp[i + 1];
                  for (String w : dictionary) {
                      if (s.startsWith(w, i) && dp[i + w.length()] < best) best = dp[i + w.length()];
                  }
                  dp[i] = best;
              }
              return dp[0];
          }
        `,
        cpp: code`
          int minExtraChar(string s, vector<string>& dictionary) {
              int n = s.size();
              vector<int> dp(n + 1, 0);
              for (int i = n - 1; i >= 0; i--) {
                  int best = 1 + dp[i + 1];
                  for (const string& w : dictionary) {
                      int len = w.size();
                      if (i + len <= n && s.compare(i, len, w) == 0 && dp[i + len] < best) best = dp[i + len];
                  }
                  dp[i] = best;
              }
              return dp[0];
          }
        `,
        c: code`
          int minExtraChar(const char* s, char** dictionary, int dictionarySize) {
              int n = (int) strlen(s);
              int* dp = (int*)calloc(n + 1, sizeof(int));
              int* lens = (int*)malloc(sizeof(int) * (dictionarySize > 0 ? dictionarySize : 1));
              for (int k = 0; k < dictionarySize; k++) lens[k] = (int) strlen(dictionary[k]);
              for (int i = n - 1; i >= 0; i--) {
                  int best = 1 + dp[i + 1];
                  for (int k = 0; k < dictionarySize; k++) {
                      int len = lens[k];
                      if (i + len <= n && strncmp(s + i, dictionary[k], len) == 0 && dp[i + len] < best) best = dp[i + len];
                  }
                  dp[i] = best;
              }
              int res = dp[0];
              free(dp);
              free(lens);
              return res;
          }
        `,
        csharp: code`
          public static int MinExtraChar(string s, string[] dictionary)
          {
              int n = s.Length;
              int[] dp = new int[n + 1];
              for (int i = n - 1; i >= 0; i--)
              {
                  int best = 1 + dp[i + 1];
                  foreach (string w in dictionary)
                  {
                      if (i + w.Length <= n && string.CompareOrdinal(s, i, w, 0, w.Length) == 0 && dp[i + w.Length] < best) best = dp[i + w.Length];
                  }
                  dp[i] = best;
              }
              return dp[0];
          }
        `,
        go: code`
          func minExtraChar(s string, dictionary []string) int {
          	n := len(s)
          	dp := make([]int, n+1)
          	for i := n - 1; i >= 0; i-- {
          		best := 1 + dp[i+1]
          		for _, w := range dictionary {
          			if strings.HasPrefix(s[i:], w) && dp[i+len(w)] < best {
          				best = dp[i+len(w)]
          			}
          		}
          		dp[i] = best
          	}
          	return dp[0]
          }
        `,
        kotlin: code`
          fun minExtraChar(s: String, dictionary: Array<String>): Int {
              val n = s.length
              val dp = IntArray(n + 1)
              for (i in n - 1 downTo 0) {
                  var best = 1 + dp[i + 1]
                  for (w in dictionary) {
                      if (s.startsWith(w, i) && dp[i + w.length] < best) best = dp[i + w.length]
                  }
                  dp[i] = best
              }
              return dp[0]
          }
        `,
        swift: code`
          func minExtraChar(_ s: String, _ dictionary: [String]) -> Int {
              let chars = Array(s.utf8)
              let words = dictionary.map { Array($0.utf8) }
              let n = chars.count
              var dp = [Int](repeating: 0, count: n + 1)
              var i = n - 1
              while i >= 0 {
                  var best = 1 + dp[i + 1]
                  for w in words {
                      let len = w.count
                      if i + len > n || dp[i + len] >= best { continue }
                      var ok = true
                      for t in 0..<len where chars[i + t] != w[t] {
                          ok = false
                          break
                      }
                      if ok { best = dp[i + len] }
                  }
                  dp[i] = best
                  i -= 1
              }
              return dp[0]
          }
        `,
        rust: code`
          fn minExtraChar(s: String, dictionary: Vec<String>) -> i32 {
              let b = s.as_bytes();
              let n = b.len();
              let mut dp = vec![0i32; n + 1];
              for i in (0..n).rev() {
                  let mut best = 1 + dp[i + 1];
                  for w in dictionary.iter() {
                      let wb = w.as_bytes();
                      let len = wb.len();
                      if i + len <= n && &b[i..i + len] == wb && dp[i + len] < best {
                          best = dp[i + len];
                      }
                  }
                  dp[i] = best;
              }
              dp[0]
          }
        `,
        php: code`
          function minExtraChar($s, $dictionary) {
              $n = strlen($s);
              $dp = array_fill(0, $n + 1, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $best = 1 + $dp[$i + 1];
                  foreach ($dictionary as $w) {
                      $len = strlen($w);
                      if ($i + $len <= $n && substr_compare($s, $w, $i, $len) === 0 && $dp[$i + $len] < $best) $best = $dp[$i + $len];
                  }
                  $dp[$i] = $best;
              }
              return $dp[0];
          }
        `,
        ruby: code`
          def minExtraChar(s, dictionary)
            n = s.length
            dp = Array.new(n + 1, 0)
            (n - 1).downto(0) do |i|
              best = 1 + dp[i + 1]
              dictionary.each do |w|
                len = w.length
                next if i + len > n
                best = dp[i + len] if dp[i + len] < best && s[i, len] == w
              end
              dp[i] = best
            end
            dp[0]
          end
        `,
      },
    };
  })(),

  // ── Maximize the Profit as the Salesman (LC 2830) ───────────────
  (() => {
    const ref = (n: number, offers: number[][]) => {
      // weighted interval scheduling over offers sorted by end, O(r²)
      const os = offers.slice().sort((a, b) => a[1] - b[1]);
      const best: number[] = [];
      let answer = 0;
      for (let i = 0; i < os.length; i++) {
        let before = 0;
        for (let j = 0; j < i; j++) if (os[j][1] < os[i][0]) before = Math.max(before, best[j]);
        best.push(before + os[i][2]);
        answer = Math.max(answer, best[i]);
      }
      return answer;
    };
    return {
      slug: "maximize-the-profit-as-the-salesman",
      title: "Maximize the Profit as the Salesman",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Sorting", "Binary Search", "Amazon", "Google"],
      signature: {
        funcName: "maximizeTheProfit",
        params: [{ name: "n", type: "int" as const }, { name: "offers", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` houses on a street, numbered `0` to `n - 1`. As a salesman you receive offers `offers[i] = [start_i, end_i, gold_i]`: buyer `i` wants **every** house from `start_i` to `end_i` inclusive and will pay `gold_i` for them.\n\nEach house can be sold to at most one buyer, and some houses may stay unsold. Choose which offers to accept to maximise the total gold, and return that maximum.",
        [
          { in: "n = 5, offers = [[0,0,1],[0,2,2],[1,3,2]]", out: "3", note: "Accept `[0,0,1]` and `[1,3,2]`." },
          { in: "n = 5, offers = [[0,0,1],[0,2,10],[1,3,2]]", out: "10" },
          { in: "n = 4, offers = [[0,1,5],[2,3,5],[1,2,9]]", out: "10", note: "The two outer offers (5 + 5) beat the middle one (9)." },
        ],
        ["1 <= n <= 10^5", "1 <= offers.length <= 10^5", "offers[i].length == 3", "0 <= start_i <= end_i <= n - 1", "1 <= gold_i <= 10^3"]),
      hints: [
        "This is weighted interval scheduling: pick non-overlapping intervals of maximum total weight.",
        "Let `dp[i]` be the best gold using only houses `0..i-1`.",
        "`dp[i + 1] = max(dp[i], dp[start] + gold)` over every offer whose `end` is `i`.",
      ],
      editorial: explain({
        idea: "Sweep houses left to right. The best profit over the first `e + 1` houses either leaves house `e` unsold or sells it as the last house of some offer `[s, e, g]`, whose earlier houses are an independent prefix problem.",
        steps: [
          "Group (or sort) the offers by their end house.",
          "`dp[0] = 0`. For `e = 0..n-1`: `dp[e + 1] = dp[e]`, then for each offer `[s, e, g]`: `dp[e + 1] = max(dp[e + 1], dp[s] + g)`.",
          "Return `dp[n]`.",
        ],
        why: "In any valid choice of offers over houses `0..e`, either no accepted offer covers house `e` (the value is at most `dp[e]`), or exactly one accepted offer ends at `e` and all others lie in houses `0..s-1`, worth at most `dp[s]`. Both cases are covered, so by induction `dp` is optimal.",
        time: "O(n + m log m) for m offers",
        space: "O(n + m)",
        pitfalls: [
          "Offers that share a house conflict — the next offer must start strictly after the previous one's end (`dp[s]` covers houses `0..s-1`).",
          "Several offers can end at the same house; consider all of them.",
          "Houses may remain unsold, so carry `dp[e]` forward.",
        ],
      }),
      examples: [
        { input: "5\n[[0,0,1],[0,2,2],[1,3,2]]", expectedOutput: "3" },
        { input: "5\n[[0,0,1],[0,2,10],[1,3,2]]", expectedOutput: "10" },
        { input: "4\n[[0,1,5],[2,3,5],[1,2,9]]", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 1, 4) : ri(rng, 5, 70);
        const m = ri(rng, 1, rng() < 0.8 ? 15 : 40);
        const goldHi = pick(rng, [1, 10, 1000]);
        const maxLen = pick(rng, [1, 4, n]);
        const offers: number[][] = [];
        for (let i = 0; i < m; i++) {
          const s = ri(rng, 0, n - 1);
          const e = ri(rng, s, Math.min(n - 1, s + maxLen - 1));
          offers.push([s, e, ri(rng, 1, goldHi)]);
        }
        return { input: n + "\n" + fmtIntMat(offers), expectedOutput: String(ref(n, offers)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximizeTheProfit(n: int, offers: List[List[int]]) -> int:
              ending = [[] for _ in range(n)]
              for s, e, g in offers:
                  ending[e].append((s, g))
              dp = [0] * (n + 1)
              for e in range(n):
                  best = dp[e]
                  for s, g in ending[e]:
                      if dp[s] + g > best:
                          best = dp[s] + g
                  dp[e + 1] = best
              return dp[n]
        `,
        javascript: code`
          var maximizeTheProfit = function(n, offers) {
              var os = offers.slice().sort(function(a, b) { return a[1] - b[1]; });
              var dp = new Array(n + 1).fill(0);
              var ptr = 0;
              for (var e = 0; e < n; e++) {
                  dp[e + 1] = dp[e];
                  while (ptr < os.length && os[ptr][1] === e) {
                      var cand = dp[os[ptr][0]] + os[ptr][2];
                      if (cand > dp[e + 1]) dp[e + 1] = cand;
                      ptr++;
                  }
              }
              return dp[n];
          };
        `,
        typescript: code`
          function maximizeTheProfit(n: number, offers: number[][]): number {
              var os = offers.slice().sort(function (a, b) { return a[1] - b[1]; });
              var dp: number[] = [];
              for (var t = 0; t <= n; t++) dp.push(0);
              var ptr = 0;
              for (var e = 0; e < n; e++) {
                  dp[e + 1] = dp[e];
                  while (ptr < os.length && os[ptr][1] === e) {
                      var cand = dp[os[ptr][0]] + os[ptr][2];
                      if (cand > dp[e + 1]) dp[e + 1] = cand;
                      ptr++;
                  }
              }
              return dp[n];
          }
        `,
        java: code`
          public static int maximizeTheProfit(int n, int[][] offers) {
              int[][] os = offers.clone();
              Arrays.sort(os, (a, b) -> Integer.compare(a[1], b[1]));
              int[] dp = new int[n + 1];
              int ptr = 0;
              for (int e = 0; e < n; e++) {
                  dp[e + 1] = dp[e];
                  while (ptr < os.length && os[ptr][1] == e) {
                      dp[e + 1] = Math.max(dp[e + 1], dp[os[ptr][0]] + os[ptr][2]);
                      ptr++;
                  }
              }
              return dp[n];
          }
        `,
        cpp: code`
          int maximizeTheProfit(int n, vector<vector<int>>& offers) {
              vector<vector<int>> os(offers.begin(), offers.end());
              sort(os.begin(), os.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });
              vector<int> dp(n + 1, 0);
              size_t ptr = 0;
              for (int e = 0; e < n; e++) {
                  dp[e + 1] = dp[e];
                  while (ptr < os.size() && os[ptr][1] == e) {
                      dp[e + 1] = max(dp[e + 1], dp[os[ptr][0]] + os[ptr][2]);
                      ptr++;
                  }
              }
              return dp[n];
          }
        `,
        c: code`
          static int cmpByEndSales(const void* x, const void* y) {
              int a = ((const int*)x)[1], b = ((const int*)y)[1];
              return (a > b) - (a < b);
          }

          int maximizeTheProfit(int n, int** offers, int offersSize, int* offersColSize) {
              int* os = (int*)malloc(sizeof(int) * 3 * offersSize);
              for (int i = 0; i < offersSize; i++) {
                  os[3 * i] = offers[i][0];
                  os[3 * i + 1] = offers[i][1];
                  os[3 * i + 2] = offers[i][2];
              }
              qsort(os, offersSize, sizeof(int) * 3, cmpByEndSales);
              int* dp = (int*)calloc(n + 1, sizeof(int));
              int ptr = 0;
              for (int e = 0; e < n; e++) {
                  dp[e + 1] = dp[e];
                  while (ptr < offersSize && os[3 * ptr + 1] == e) {
                      int cand = dp[os[3 * ptr]] + os[3 * ptr + 2];
                      if (cand > dp[e + 1]) dp[e + 1] = cand;
                      ptr++;
                  }
              }
              int res = dp[n];
              free(os);
              free(dp);
              return res;
          }
        `,
        csharp: code`
          public static int MaximizeTheProfit(int n, int[][] offers)
          {
              int[][] os = offers.OrderBy(o => o[1]).ToArray();
              int[] dp = new int[n + 1];
              int ptr = 0;
              for (int e = 0; e < n; e++)
              {
                  dp[e + 1] = dp[e];
                  while (ptr < os.Length && os[ptr][1] == e)
                  {
                      dp[e + 1] = Math.Max(dp[e + 1], dp[os[ptr][0]] + os[ptr][2]);
                      ptr++;
                  }
              }
              return dp[n];
          }
        `,
        go: code`
          func maximizeTheProfit(n int, offers [][]int) int {
          	byEnd := make([][]int, len(offers))
          	copy(byEnd, offers)
          	sort.Slice(byEnd, func(i, j int) bool { return byEnd[i][1] < byEnd[j][1] })
          	dp := make([]int, n+1)
          	ptr := 0
          	for e := 0; e < n; e++ {
          		dp[e+1] = dp[e]
          		for ptr < len(byEnd) && byEnd[ptr][1] == e {
          			cand := dp[byEnd[ptr][0]] + byEnd[ptr][2]
          			if cand > dp[e+1] {
          				dp[e+1] = cand
          			}
          			ptr++
          		}
          	}
          	return dp[n]
          }
        `,
        kotlin: code`
          fun maximizeTheProfit(n: Int, offers: Array<IntArray>): Int {
              val os = offers.sortedBy { it[1] }
              val dp = IntArray(n + 1)
              var ptr = 0
              for (e in 0 until n) {
                  dp[e + 1] = dp[e]
                  while (ptr < os.size && os[ptr][1] == e) {
                      dp[e + 1] = maxOf(dp[e + 1], dp[os[ptr][0]] + os[ptr][2])
                      ptr++
                  }
              }
              return dp[n]
          }
        `,
        swift: code`
          func maximizeTheProfit(_ n: Int, _ offers: [[Int]]) -> Int {
              let os = offers.sorted { $0[1] < $1[1] }
              var dp = [Int](repeating: 0, count: n + 1)
              var ptr = 0
              for e in 0..<n {
                  dp[e + 1] = dp[e]
                  while ptr < os.count && os[ptr][1] == e {
                      dp[e + 1] = max(dp[e + 1], dp[os[ptr][0]] + os[ptr][2])
                      ptr += 1
                  }
              }
              return dp[n]
          }
        `,
        rust: code`
          fn maximizeTheProfit(n: i32, offers: Vec<Vec<i32>>) -> i32 {
              let mut os = offers.clone();
              os.sort_by_key(|o| o[1]);
              let nu = n as usize;
              let mut dp = vec![0i32; nu + 1];
              let mut ptr = 0;
              for e in 0..nu {
                  dp[e + 1] = dp[e];
                  while ptr < os.len() && os[ptr][1] as usize == e {
                      let cand = dp[os[ptr][0] as usize] + os[ptr][2];
                      if cand > dp[e + 1] {
                          dp[e + 1] = cand;
                      }
                      ptr += 1;
                  }
              }
              dp[nu]
          }
        `,
        php: code`
          function maximizeTheProfit($n, $offers) {
              $os = $offers;
              usort($os, function ($a, $b) { return $a[1] <=> $b[1]; });
              $dp = array_fill(0, $n + 1, 0);
              $ptr = 0;
              $cnt = count($os);
              for ($e = 0; $e < $n; $e++) {
                  $dp[$e + 1] = $dp[$e];
                  while ($ptr < $cnt && $os[$ptr][1] == $e) {
                      $cand = $dp[$os[$ptr][0]] + $os[$ptr][2];
                      if ($cand > $dp[$e + 1]) $dp[$e + 1] = $cand;
                      $ptr++;
                  }
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def maximizeTheProfit(n, offers)
            ending = Array.new(n) { [] }
            offers.each { |s, e, g| ending[e] << [s, g] }
            dp = Array.new(n + 1, 0)
            n.times do |e|
              best = dp[e]
              ending[e].each do |s, g|
                best = dp[s] + g if dp[s] + g > best
              end
              dp[e + 1] = best
            end
            dp[n]
          end
        `,
      },
    };
  })(),

  // ── Ways to Split Array Into Good Subarrays (LC 2750) ───────────
  (() => {
    const ref = (nums: number[]) => {
      // ways[i] = splits of the prefix nums[0..i-1]; additions only
      const n = nums.length;
      const ways = new Array(n + 1).fill(0);
      ways[0] = 1;
      for (let i = 1; i <= n; i++) {
        let ones = 0;
        for (let j = i - 1; j >= 0; j--) {
          ones += nums[j];
          if (ones > 1) break;
          if (ones === 1) ways[i] = (ways[i] + ways[j]) % MOD;
        }
      }
      return ways[n];
    };
    return {
      slug: "ways-to-split-array-into-good-subarrays",
      title: "Ways to Split Array Into Good Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Google", "Amazon"],
      signature: { funcName: "numberOfGoodSubarraySplits", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` is a binary array. A subarray is **good** if it contains **exactly one** element equal to `1`.\n\nCount the ways to split `nums` into consecutive non-empty good subarrays (every element belongs to exactly one piece, and every piece is good). Return the count modulo `10^9 + 7`.",
        [
          { in: "nums = [0,1,0,0,1]", out: "3", note: "`[0,1] [0,0,1]`, `[0,1,0] [0,1]` and `[0,1,0,0] [1]`." },
          { in: "nums = [1,0,0,1,0,1]", out: "6", note: "Three places to cut between the first two 1s, two between the last two." },
          { in: "nums = [0,0,0]", out: "0", note: "No piece can contain a 1." },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 1"]),
      hints: [
        "Each piece holds exactly one `1`, so between two consecutive `1`s there is exactly one cut.",
        "If consecutive `1`s sit at indices `p` and `q`, the cut can go after any of the positions `p, p+1, ..., q-1` — that is `q - p` choices.",
        "Multiply those counts for every adjacent pair of `1`s; an array without a `1` has no valid split.",
      ],
      editorial: explain({
        idea: "The pieces are pinned by the `1`s: the zeros before the first `1` and after the last `1` must join the first and last pieces, and the only freedom is where to cut inside each run of zeros between consecutive `1`s.",
        steps: [
          "Scan the array and remember the index `prev` of the previous `1`.",
          "At each new `1` at index `i`, multiply the answer by `i - prev` (mod `10^9 + 7`).",
          "If no `1` was seen, return 0; otherwise return the product (1 when there is a single `1`).",
        ],
        why: "A split into good pieces is fully determined by choosing, for every pair of consecutive `1`s at `p < q`, the position of the single cut between them, which may follow any of the `q - p` indices `p..q-1`. These choices are independent, so the count is their product.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "An array with no `1` gives 0, not 1.",
          "Leading and trailing zeros add no choices.",
          "Multiply in 64-bit before reducing: the running product is below `10^9 + 7` but one more factor can push it past 32 bits.",
        ],
      }),
      examples: [
        { input: "[0,1,0,0,1]", expectedOutput: "3" },
        { input: "[1,0,0,1,0,1]", expectedOutput: "6" },
        { input: "[0,0,0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 1, 6) : ri(rng, 7, 120);
        const p = pick(rng, [0, 0.05, 0.2, 0.35, 0.6, 1]);
        const nums = Array.from({ length: n }, () => (rng() < p ? 1 : 0));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numberOfGoodSubarraySplits(nums: List[int]) -> int:
              MOD = 10**9 + 7
              ans = 1
              prev = -1
              for i, v in enumerate(nums):
                  if v == 1:
                      if prev >= 0:
                          ans = ans * (i - prev) % MOD
                      prev = i
              return ans if prev >= 0 else 0
        `,
        javascript: code`
          var numberOfGoodSubarraySplits = function(nums) {
              var MOD = 1000000007;
              var ans = 1, prev = -1;
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] === 1) {
                      // ans < 2^30 and the gap < 2^17, so the product stays exact in a double
                      if (prev >= 0) ans = (ans * (i - prev)) % MOD;
                      prev = i;
                  }
              }
              return prev >= 0 ? ans : 0;
          };
        `,
        typescript: code`
          function numberOfGoodSubarraySplits(nums: number[]): number {
              var MOD = 1000000007;
              var ans = 1, prev = -1;
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] === 1) {
                      if (prev >= 0) ans = (ans * (i - prev)) % MOD;
                      prev = i;
                  }
              }
              return prev >= 0 ? ans : 0;
          }
        `,
        java: code`
          public static int numberOfGoodSubarraySplits(int[] nums) {
              final long MOD = 1000000007L;
              long ans = 1;
              int prev = -1;
              for (int i = 0; i < nums.length; i++) {
                  if (nums[i] == 1) {
                      if (prev >= 0) ans = ans * (i - prev) % MOD;
                      prev = i;
                  }
              }
              return prev >= 0 ? (int) ans : 0;
          }
        `,
        cpp: code`
          int numberOfGoodSubarraySplits(vector<int>& nums) {
              const long long MOD = 1000000007LL;
              long long ans = 1;
              int prev = -1;
              for (int i = 0; i < (int) nums.size(); i++) {
                  if (nums[i] == 1) {
                      if (prev >= 0) ans = ans * (i - prev) % MOD;
                      prev = i;
                  }
              }
              return prev >= 0 ? (int) ans : 0;
          }
        `,
        c: code`
          int numberOfGoodSubarraySplits(int* nums, int numsSize) {
              const long long MOD = 1000000007LL;
              long long ans = 1;
              int prev = -1;
              for (int i = 0; i < numsSize; i++) {
                  if (nums[i] == 1) {
                      if (prev >= 0) ans = ans * (i - prev) % MOD;
                      prev = i;
                  }
              }
              return prev >= 0 ? (int) ans : 0;
          }
        `,
        csharp: code`
          public static int NumberOfGoodSubarraySplits(int[] nums)
          {
              const long MOD = 1000000007L;
              long ans = 1;
              int prev = -1;
              for (int i = 0; i < nums.Length; i++)
              {
                  if (nums[i] == 1)
                  {
                      if (prev >= 0) ans = ans * (i - prev) % MOD;
                      prev = i;
                  }
              }
              return prev >= 0 ? (int)ans : 0;
          }
        `,
        go: code`
          func numberOfGoodSubarraySplits(nums []int) int {
          	const MOD = 1000000007
          	ans, prev := 1, -1
          	for i, v := range nums {
          		if v == 1 {
          			if prev >= 0 {
          				ans = ans * (i - prev) % MOD
          			}
          			prev = i
          		}
          	}
          	if prev < 0 {
          		return 0
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun numberOfGoodSubarraySplits(nums: IntArray): Int {
              val MOD = 1000000007L
              var ans = 1L
              var prev = -1
              for (i in nums.indices) {
                  if (nums[i] == 1) {
                      if (prev >= 0) ans = ans * (i - prev) % MOD
                      prev = i
                  }
              }
              return if (prev >= 0) ans.toInt() else 0
          }
        `,
        swift: code`
          func numberOfGoodSubarraySplits(_ nums: [Int]) -> Int {
              let MOD = 1000000007
              var ans = 1
              var prev = -1
              for i in 0..<nums.count where nums[i] == 1 {
                  if prev >= 0 { ans = ans * (i - prev) % MOD }
                  prev = i
              }
              return prev >= 0 ? ans : 0
          }
        `,
        rust: code`
          fn numberOfGoodSubarraySplits(nums: Vec<i32>) -> i32 {
              let md: i64 = 1000000007;
              let mut ans: i64 = 1;
              let mut prev: i64 = -1;
              for (i, &v) in nums.iter().enumerate() {
                  if v == 1 {
                      if prev >= 0 {
                          ans = ans * (i as i64 - prev) % md;
                      }
                      prev = i as i64;
                  }
              }
              if prev >= 0 {
                  ans as i32
              } else {
                  0
              }
          }
        `,
        php: code`
          function numberOfGoodSubarraySplits($nums) {
              $MOD = 1000000007;
              $ans = 1;
              $prev = -1;
              $n = count($nums);
              for ($i = 0; $i < $n; $i++) {
                  if ($nums[$i] == 1) {
                      if ($prev >= 0) $ans = $ans * ($i - $prev) % $MOD;
                      $prev = $i;
                  }
              }
              return $prev >= 0 ? $ans : 0;
          }
        `,
        ruby: code`
          def numberOfGoodSubarraySplits(nums)
            md = 1_000_000_007
            ans = 1
            prev = -1
            nums.each_with_index do |v, i|
              next unless v == 1
              ans = ans * (i - prev) % md if prev >= 0
              prev = i
            end
            prev >= 0 ? ans : 0
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Operations With the Same Score II (LC 3040) ──
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const run = (score: number) => {
        const memo = new Map<number, number>();
        const go = (l: number, r: number): number => {
          if (r - l < 1) return 0;
          const key = l * 4096 + r;
          const hit = memo.get(key);
          if (hit !== undefined) return hit;
          let best = 0;
          if (nums[l] + nums[l + 1] === score) best = Math.max(best, 1 + go(l + 2, r));
          if (nums[r - 1] + nums[r] === score) best = Math.max(best, 1 + go(l, r - 2));
          if (nums[l] + nums[r] === score) best = Math.max(best, 1 + go(l + 1, r - 1));
          memo.set(key, best);
          return best;
        };
        return go(0, n - 1);
      };
      return Math.max(run(nums[0] + nums[1]), run(nums[n - 2] + nums[n - 1]), run(nums[0] + nums[n - 1]));
    };
    return {
      slug: "maximum-number-of-operations-with-the-same-score-ii",
      title: "Maximum Number of Operations With the Same Score II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Memoization", "Google", "Amazon"],
      signature: { funcName: "maxOperations", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "While `nums` has at least two elements you may perform an operation of one of three kinds:\n\n- delete the **first two** elements,\n- delete the **last two** elements, or\n- delete the **first and the last** element.\n\nThe **score** of an operation is the sum of the two deleted elements. Perform as many operations as possible such that **all** of them have the same score, and return that maximum number of operations.",
        [
          { in: "nums = [3,2,1,2,3,4]", out: "3", note: "Delete 3 and 2 (score 5), then 1 and 4 (first and last), then 2 and 3." },
          { in: "nums = [3,2,6,1,4]", out: "2", note: "Delete 3 and 2 (score 5), then the last two, 1 and 4 (score 5). Only `[6]` is left." },
          { in: "nums = [7,7]", out: "1" },
        ],
        ["2 <= nums.length <= 2000", "1 <= nums[i] <= 1000"]),
      hints: [
        "The first operation fixes the score, and it can only be one of three sums: `nums[0] + nums[1]`, `nums[n-2] + nums[n-1]` or `nums[0] + nums[n-1]`.",
        "After any sequence of operations the remaining elements form a contiguous window `nums[l..r]`.",
        "For each of the three scores, run an interval DP over windows: `f(l, r)` = most operations on `nums[l..r]`, trying each of the three deletions that match the score.",
      ],
      editorial: explain({
        idea: "Every operation removes from the ends, so the state is the window `[l, r]` that remains. Fix the score (three candidates) and memoise the best number of operations per window.",
        steps: [
          "For each candidate score `S` in `{nums[0]+nums[1], nums[n-2]+nums[n-1], nums[0]+nums[n-1]}`:",
          "Define `f(l, r) = 0` when fewer than two elements remain; otherwise the maximum of `1 + f(l+2, r)` if `nums[l]+nums[l+1] = S`, `1 + f(l, r-2)` if `nums[r-1]+nums[r] = S`, and `1 + f(l+1, r-1)` if `nums[l]+nums[r] = S`.",
          "Fill the table bottom-up by increasing window length (or memoise top-down).",
          "Return the largest `f(0, n-1)` over the three scores.",
        ],
        why: "The first operation must be one of the three listed deletions, so the common score is one of three values; for a fixed score, every legal continuation from window `[l, r]` is one of the three moves, and each leads to a smaller window solved optimally by the DP.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Trying every possible score instead of the three candidates multiplies the work for nothing.",
          "The window shrinks by two each time — windows of length 0 and 1 are the base cases.",
          "A greedy that always deletes the first matching pair can miss longer sequences.",
        ],
      }),
      examples: [
        { input: "[3,2,1,2,3,4]", expectedOutput: "3" },
        { input: "[3,2,6,1,4]", expectedOutput: "2" },
        { input: "[7,7]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 2, 5) : ri(rng, 6, rng() < 0.85 ? 24 : 40);
        const kind = ri(rng, 0, 2);
        let nums: number[];
        if (kind === 0) {
          // pairs that sum to one score, shuffled at the ends
          const S = ri(rng, 2, 20);
          nums = [];
          while (nums.length < n) {
            const a = ri(rng, 1, S - 1);
            if (rng() < 0.5) nums.push(a, S - a); else nums.unshift(a, S - a);
          }
          nums = nums.slice(0, n);
          if (rng() < 0.3) nums[ri(rng, 0, n - 1)] = ri(rng, 1, S);
        } else {
          const hi = kind === 1 ? pick(rng, [2, 3, 5]) : 1000;
          nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxOperations(nums: List[int]) -> int:
              n = len(nums)

              def solve(score):
                  # h[l][r] = most operations on the window nums[l:r]
                  h = [[0] * (n + 1) for _ in range(n + 1)]
                  for length in range(2, n + 1):
                      for l in range(n - length + 1):
                          r = l + length
                          best = 0
                          if nums[l] + nums[l + 1] == score:
                              best = 1 + h[l + 2][r]
                          if nums[r - 2] + nums[r - 1] == score and 1 + h[l][r - 2] > best:
                              best = 1 + h[l][r - 2]
                          if nums[l] + nums[r - 1] == score and 1 + h[l + 1][r - 1] > best:
                              best = 1 + h[l + 1][r - 1]
                          h[l][r] = best
                  return h[0][n]

              return max(solve(nums[0] + nums[1]), solve(nums[-2] + nums[-1]), solve(nums[0] + nums[-1]))
        `,
        javascript: code`
          var maxOperations = function(nums) {
              var n = nums.length;
              var solve = function(score) {
                  var h = [];
                  for (var i = 0; i <= n; i++) h.push(new Array(n + 1).fill(0));
                  for (var len = 2; len <= n; len++) {
                      for (var l = 0; l + len <= n; l++) {
                          var r = l + len;
                          var best = 0;
                          if (nums[l] + nums[l + 1] === score) best = 1 + h[l + 2][r];
                          if (nums[r - 2] + nums[r - 1] === score && 1 + h[l][r - 2] > best) best = 1 + h[l][r - 2];
                          if (nums[l] + nums[r - 1] === score && 1 + h[l + 1][r - 1] > best) best = 1 + h[l + 1][r - 1];
                          h[l][r] = best;
                      }
                  }
                  return h[0][n];
              };
              return Math.max(solve(nums[0] + nums[1]), solve(nums[n - 2] + nums[n - 1]), solve(nums[0] + nums[n - 1]));
          };
        `,
        typescript: code`
          function maxOperations(nums: number[]): number {
              var n = nums.length;
              var solve = function (score: number): number {
                  var h: number[][] = [];
                  for (var i = 0; i <= n; i++) {
                      var row: number[] = [];
                      for (var t = 0; t <= n; t++) row.push(0);
                      h.push(row);
                  }
                  for (var len = 2; len <= n; len++) {
                      for (var l = 0; l + len <= n; l++) {
                          var r = l + len;
                          var best = 0;
                          if (nums[l] + nums[l + 1] === score) best = 1 + h[l + 2][r];
                          if (nums[r - 2] + nums[r - 1] === score && 1 + h[l][r - 2] > best) best = 1 + h[l][r - 2];
                          if (nums[l] + nums[r - 1] === score && 1 + h[l + 1][r - 1] > best) best = 1 + h[l + 1][r - 1];
                          h[l][r] = best;
                      }
                  }
                  return h[0][n];
              };
              return Math.max(solve(nums[0] + nums[1]), solve(nums[n - 2] + nums[n - 1]), solve(nums[0] + nums[n - 1]));
          }
        `,
        java: code`
          static int sameScoreSolve(int[] nums, int score) {
              int n = nums.length;
              int[][] h = new int[n + 1][n + 1];
              for (int len = 2; len <= n; len++) {
                  for (int l = 0; l + len <= n; l++) {
                      int r = l + len;
                      int best = 0;
                      if (nums[l] + nums[l + 1] == score) best = 1 + h[l + 2][r];
                      if (nums[r - 2] + nums[r - 1] == score) best = Math.max(best, 1 + h[l][r - 2]);
                      if (nums[l] + nums[r - 1] == score) best = Math.max(best, 1 + h[l + 1][r - 1]);
                      h[l][r] = best;
                  }
              }
              return h[0][n];
          }

          public static int maxOperations(int[] nums) {
              int n = nums.length;
              int a = sameScoreSolve(nums, nums[0] + nums[1]);
              int b = sameScoreSolve(nums, nums[n - 2] + nums[n - 1]);
              int c = sameScoreSolve(nums, nums[0] + nums[n - 1]);
              return Math.max(a, Math.max(b, c));
          }
        `,
        cpp: code`
          int sameScoreSolve(const vector<int>& nums, int score) {
              int n = nums.size();
              vector<vector<int>> h(n + 1, vector<int>(n + 1, 0));
              for (int len = 2; len <= n; len++) {
                  for (int l = 0; l + len <= n; l++) {
                      int r = l + len;
                      int best = 0;
                      if (nums[l] + nums[l + 1] == score) best = 1 + h[l + 2][r];
                      if (nums[r - 2] + nums[r - 1] == score) best = max(best, 1 + h[l][r - 2]);
                      if (nums[l] + nums[r - 1] == score) best = max(best, 1 + h[l + 1][r - 1]);
                      h[l][r] = best;
                  }
              }
              return h[0][n];
          }

          int maxOperations(vector<int>& nums) {
              int n = nums.size();
              int a = sameScoreSolve(nums, nums[0] + nums[1]);
              int b = sameScoreSolve(nums, nums[n - 2] + nums[n - 1]);
              int c = sameScoreSolve(nums, nums[0] + nums[n - 1]);
              return max(a, max(b, c));
          }
        `,
        c: code`
          static int sameScoreSolve(const int* nums, int n, int score, int* h) {
              int w = n + 1;
              for (int t = 0; t < w * w; t++) h[t] = 0;
              for (int len = 2; len <= n; len++) {
                  for (int l = 0; l + len <= n; l++) {
                      int r = l + len;
                      int best = 0;
                      if (nums[l] + nums[l + 1] == score) best = 1 + h[(l + 2) * w + r];
                      if (nums[r - 2] + nums[r - 1] == score && 1 + h[l * w + r - 2] > best) best = 1 + h[l * w + r - 2];
                      if (nums[l] + nums[r - 1] == score && 1 + h[(l + 1) * w + r - 1] > best) best = 1 + h[(l + 1) * w + r - 1];
                      h[l * w + r] = best;
                  }
              }
              return h[n];
          }

          int maxOperations(int* nums, int numsSize) {
              int n = numsSize;
              int* h = (int*)malloc(sizeof(int) * (n + 1) * (n + 1));
              int best = sameScoreSolve(nums, n, nums[0] + nums[1], h);
              int b = sameScoreSolve(nums, n, nums[n - 2] + nums[n - 1], h);
              if (b > best) best = b;
              b = sameScoreSolve(nums, n, nums[0] + nums[n - 1], h);
              if (b > best) best = b;
              free(h);
              return best;
          }
        `,
        csharp: code`
          static int SameScoreSolve(int[] nums, int score)
          {
              int n = nums.Length;
              int[,] h = new int[n + 1, n + 1];
              for (int len = 2; len <= n; len++)
              {
                  for (int l = 0; l + len <= n; l++)
                  {
                      int r = l + len;
                      int best = 0;
                      if (nums[l] + nums[l + 1] == score) best = 1 + h[l + 2, r];
                      if (nums[r - 2] + nums[r - 1] == score) best = Math.Max(best, 1 + h[l, r - 2]);
                      if (nums[l] + nums[r - 1] == score) best = Math.Max(best, 1 + h[l + 1, r - 1]);
                      h[l, r] = best;
                  }
              }
              return h[0, n];
          }

          public static int MaxOperations(int[] nums)
          {
              int n = nums.Length;
              int a = SameScoreSolve(nums, nums[0] + nums[1]);
              int b = SameScoreSolve(nums, nums[n - 2] + nums[n - 1]);
              int c = SameScoreSolve(nums, nums[0] + nums[n - 1]);
              return Math.Max(a, Math.Max(b, c));
          }
        `,
        go: code`
          func sameScoreSolve(nums []int, score int) int {
          	n := len(nums)
          	h := make([][]int, n+1)
          	for i := range h {
          		h[i] = make([]int, n+1)
          	}
          	for length := 2; length <= n; length++ {
          		for l := 0; l+length <= n; l++ {
          			r := l + length
          			best := 0
          			if nums[l]+nums[l+1] == score {
          				best = 1 + h[l+2][r]
          			}
          			if nums[r-2]+nums[r-1] == score && 1+h[l][r-2] > best {
          				best = 1 + h[l][r-2]
          			}
          			if nums[l]+nums[r-1] == score && 1+h[l+1][r-1] > best {
          				best = 1 + h[l+1][r-1]
          			}
          			h[l][r] = best
          		}
          	}
          	return h[0][n]
          }

          func maxOperations(nums []int) int {
          	n := len(nums)
          	best := sameScoreSolve(nums, nums[0]+nums[1])
          	if b := sameScoreSolve(nums, nums[n-2]+nums[n-1]); b > best {
          		best = b
          	}
          	if b := sameScoreSolve(nums, nums[0]+nums[n-1]); b > best {
          		best = b
          	}
          	return best
          }
        `,
        kotlin: code`
          fun sameScoreSolve(nums: IntArray, score: Int): Int {
              val n = nums.size
              val h = Array(n + 1) { IntArray(n + 1) }
              for (len in 2..n) {
                  for (l in 0..(n - len)) {
                      val r = l + len
                      var best = 0
                      if (nums[l] + nums[l + 1] == score) best = 1 + h[l + 2][r]
                      if (nums[r - 2] + nums[r - 1] == score) best = maxOf(best, 1 + h[l][r - 2])
                      if (nums[l] + nums[r - 1] == score) best = maxOf(best, 1 + h[l + 1][r - 1])
                      h[l][r] = best
                  }
              }
              return h[0][n]
          }

          fun maxOperations(nums: IntArray): Int {
              val n = nums.size
              val a = sameScoreSolve(nums, nums[0] + nums[1])
              val b = sameScoreSolve(nums, nums[n - 2] + nums[n - 1])
              val c = sameScoreSolve(nums, nums[0] + nums[n - 1])
              return maxOf(a, maxOf(b, c))
          }
        `,
        swift: code`
          func sameScoreSolve(_ nums: [Int], _ score: Int) -> Int {
              let n = nums.count
              var h = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: n + 1)
              var len = 2
              while len <= n {
                  for l in 0...(n - len) {
                      let r = l + len
                      var best = 0
                      if nums[l] + nums[l + 1] == score { best = 1 + h[l + 2][r] }
                      if nums[r - 2] + nums[r - 1] == score { best = max(best, 1 + h[l][r - 2]) }
                      if nums[l] + nums[r - 1] == score { best = max(best, 1 + h[l + 1][r - 1]) }
                      h[l][r] = best
                  }
                  len += 1
              }
              return h[0][n]
          }

          func maxOperations(_ nums: [Int]) -> Int {
              let n = nums.count
              let a = sameScoreSolve(nums, nums[0] + nums[1])
              let b = sameScoreSolve(nums, nums[n - 2] + nums[n - 1])
              let c = sameScoreSolve(nums, nums[0] + nums[n - 1])
              return max(a, max(b, c))
          }
        `,
        rust: code`
          fn same_score_solve(nums: &Vec<i32>, score: i32) -> i32 {
              let n = nums.len();
              let mut h = vec![vec![0i32; n + 1]; n + 1];
              for len in 2..=n {
                  for l in 0..=(n - len) {
                      let r = l + len;
                      let mut best = 0;
                      if nums[l] + nums[l + 1] == score {
                          best = 1 + h[l + 2][r];
                      }
                      if nums[r - 2] + nums[r - 1] == score && 1 + h[l][r - 2] > best {
                          best = 1 + h[l][r - 2];
                      }
                      if nums[l] + nums[r - 1] == score && 1 + h[l + 1][r - 1] > best {
                          best = 1 + h[l + 1][r - 1];
                      }
                      h[l][r] = best;
                  }
              }
              h[0][n]
          }

          fn maxOperations(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let a = same_score_solve(&nums, nums[0] + nums[1]);
              let b = same_score_solve(&nums, nums[n - 2] + nums[n - 1]);
              let c = same_score_solve(&nums, nums[0] + nums[n - 1]);
              a.max(b).max(c)
          }
        `,
        php: code`
          function sameScoreSolve($nums, $score) {
              $n = count($nums);
              $h = array_fill(0, $n + 1, array_fill(0, $n + 1, 0));
              for ($len = 2; $len <= $n; $len++) {
                  for ($l = 0; $l + $len <= $n; $l++) {
                      $r = $l + $len;
                      $best = 0;
                      if ($nums[$l] + $nums[$l + 1] == $score) $best = 1 + $h[$l + 2][$r];
                      if ($nums[$r - 2] + $nums[$r - 1] == $score && 1 + $h[$l][$r - 2] > $best) $best = 1 + $h[$l][$r - 2];
                      if ($nums[$l] + $nums[$r - 1] == $score && 1 + $h[$l + 1][$r - 1] > $best) $best = 1 + $h[$l + 1][$r - 1];
                      $h[$l][$r] = $best;
                  }
              }
              return $h[0][$n];
          }

          function maxOperations($nums) {
              $n = count($nums);
              $a = sameScoreSolve($nums, $nums[0] + $nums[1]);
              $b = sameScoreSolve($nums, $nums[$n - 2] + $nums[$n - 1]);
              $c = sameScoreSolve($nums, $nums[0] + $nums[$n - 1]);
              return max($a, $b, $c);
          }
        `,
        ruby: code`
          def same_score_solve(nums, score)
            n = nums.length
            h = Array.new(n + 1) { Array.new(n + 1, 0) }
            (2..n).each do |len|
              (0..(n - len)).each do |l|
                r = l + len
                best = 0
                best = 1 + h[l + 2][r] if nums[l] + nums[l + 1] == score
                best = 1 + h[l][r - 2] if nums[r - 2] + nums[r - 1] == score && 1 + h[l][r - 2] > best
                best = 1 + h[l + 1][r - 1] if nums[l] + nums[r - 1] == score && 1 + h[l + 1][r - 1] > best
                h[l][r] = best
              end
            end
            h[0][n]
          end

          def maxOperations(nums)
            n = nums.length
            [same_score_solve(nums, nums[0] + nums[1]),
             same_score_solve(nums, nums[n - 2] + nums[n - 1]),
             same_score_solve(nums, nums[0] + nums[n - 1])].max
          end
        `,
      },
    };
  })(),

  // ── Find All Possible Stable Binary Arrays I (LC 3129) ──────────
  (() => {
    const ref = (zero: number, one: number, limit: number) => {
      // g0/g1[i][j]: arrays with i zeros and j ones ending in a 0-run / 1-run; built run by run
      const g0: number[][] = Array.from({ length: zero + 1 }, () => new Array(one + 1).fill(0));
      const g1: number[][] = Array.from({ length: zero + 1 }, () => new Array(one + 1).fill(0));
      for (let i = 0; i <= zero; i++) {
        for (let j = 0; j <= one; j++) {
          if (i + j === 0) continue;
          let a = 0, b = 0;
          for (let k = 1; k <= Math.min(limit, i); k++) a = (a + g1[i - k][j] + (i - k === 0 && j === 0 ? 1 : 0)) % MOD;
          for (let k = 1; k <= Math.min(limit, j); k++) b = (b + g0[i][j - k] + (i === 0 && j - k === 0 ? 1 : 0)) % MOD;
          g0[i][j] = a;
          g1[i][j] = b;
        }
      }
      return (g0[zero][one] + g1[zero][one]) % MOD;
    };
    return {
      slug: "find-all-possible-stable-binary-arrays-i",
      title: "Find All Possible Stable Binary Arrays I",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Prefix Sum", "Combinatorics", "Google", "Amazon"],
      signature: {
        funcName: "numberOfStableArrays",
        params: [{ name: "zero", type: "int" as const }, { name: "one", type: "int" as const }, { name: "limit", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A binary array `arr` is **stable** when:\n\n- it contains exactly `zero` zeros and exactly `one` ones, and\n- every subarray longer than `limit` contains both a `0` and a `1` — in other words, no run of equal values is longer than `limit`.\n\nReturn the number of stable binary arrays, modulo `10^9 + 7`.",
        [
          { in: "zero = 1, one = 1, limit = 2", out: "2", note: "`[0,1]` and `[1,0]`." },
          { in: "zero = 1, one = 2, limit = 1", out: "1", note: "Only `[1,0,1]` — `[1,1,0]` and `[0,1,1]` have a run of two ones." },
          { in: "zero = 3, one = 3, limit = 2", out: "14" },
        ],
        ["1 <= zero, one, limit <= 200"]),
      hints: [
        "Build the array left to right; you need to know how many zeros and ones you have used and what the last value was.",
        "Let `dp[i][j][0]` count arrays with `i` zeros and `j` ones ending in `0` (similarly `[1]`). Appending a `0` to anything with `i - 1` zeros gives `dp[i-1][j][0] + dp[i-1][j][1]`.",
        "That over-counts arrays ending in a run of `limit + 1` zeros; those are exactly `dp[i-limit-1][j][1]` followed by `limit + 1` zeros — subtract them.",
      ],
      editorial: explain({
        idea: "Count by (zeros used, ones used, last value). Appending one more `0` is always fine unless it creates a run of `limit + 1` zeros, and the arrays where that happens are in bijection with arrays that ended in `1` exactly `limit + 1` zeros earlier.",
        steps: [
          "Bases: `dp[i][0][0] = 1` for `1 <= i <= limit` (all zeros), `dp[0][j][1] = 1` for `1 <= j <= limit`; everything else on the axes is 0.",
          "For `i, j >= 1`: `dp[i][j][0] = dp[i-1][j][0] + dp[i-1][j][1] - (i > limit ? dp[i-limit-1][j][1] : 0)`.",
          "Symmetrically `dp[i][j][1] = dp[i][j-1][0] + dp[i][j-1][1] - (j > limit ? dp[i][j-limit-1][0] : 0)`.",
          "Work modulo `10^9 + 7`, adding the modulus before reducing a difference; return `dp[zero][one][0] + dp[zero][one][1]`.",
        ],
        why: "Assume every count with fewer elements is exact. Appending `0` to a stable array with `i - 1` zeros is stable unless the final zero run becomes `limit + 1` long; such an extended array is a stable array with `i - limit - 1` zeros ending in `1` (or, when `i - limit - 1 = 0`, the all-ones prefix counted on the axis) followed by `limit + 1` zeros, so subtracting exactly those leaves the stable arrays ending in `0`.",
        time: "O(zero · one)",
        space: "O(zero · one)",
        pitfalls: [
          "The subtracted term must come from the array that ends in the **other** value.",
          "Modular subtraction can go negative — add the modulus first.",
          "The axis bases stop at `limit`: an all-zero array longer than `limit` is not stable.",
        ],
      }),
      examples: [
        { input: "1\n1\n2", expectedOutput: "2" },
        { input: "1\n2\n1", expectedOutput: "1" },
        { input: "3\n3\n2", expectedOutput: "14" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.1;
        const zero = big ? ri(rng, 15, 30) : ri(rng, 1, 14);
        const one = big ? ri(rng, 15, 30) : ri(rng, 1, 14);
        const limit = rng() < 0.2 ? ri(rng, Math.max(zero, one), 200) : ri(rng, 1, Math.max(1, Math.min(zero, one, 8)));
        return { input: zero + "\n" + one + "\n" + limit, expectedOutput: String(ref(zero, one, limit)) };
      },
      solutions: {
        python: code`
          def numberOfStableArrays(zero: int, one: int, limit: int) -> int:
              MOD = 10**9 + 7
              d0 = [[0] * (one + 1) for _ in range(zero + 1)]
              d1 = [[0] * (one + 1) for _ in range(zero + 1)]
              for i in range(1, min(zero, limit) + 1):
                  d0[i][0] = 1
              for j in range(1, min(one, limit) + 1):
                  d1[0][j] = 1
              for i in range(1, zero + 1):
                  for j in range(1, one + 1):
                      a = d0[i - 1][j] + d1[i - 1][j]
                      if i > limit:
                          a -= d1[i - limit - 1][j]
                      b = d0[i][j - 1] + d1[i][j - 1]
                      if j > limit:
                          b -= d0[i][j - limit - 1]
                      d0[i][j] = a % MOD
                      d1[i][j] = b % MOD
              return (d0[zero][one] + d1[zero][one]) % MOD
        `,
        javascript: code`
          var numberOfStableArrays = function(zero, one, limit) {
              var MOD = 1000000007;
              var d0 = [], d1 = [];
              for (var i = 0; i <= zero; i++) {
                  d0.push(new Array(one + 1).fill(0));
                  d1.push(new Array(one + 1).fill(0));
              }
              for (i = 1; i <= Math.min(zero, limit); i++) d0[i][0] = 1;
              for (var j = 1; j <= Math.min(one, limit); j++) d1[0][j] = 1;
              for (i = 1; i <= zero; i++) {
                  for (j = 1; j <= one; j++) {
                      var a = d0[i - 1][j] + d1[i - 1][j];
                      if (i > limit) a += MOD - d1[i - limit - 1][j];
                      var b = d0[i][j - 1] + d1[i][j - 1];
                      if (j > limit) b += MOD - d0[i][j - limit - 1];
                      d0[i][j] = a % MOD;
                      d1[i][j] = b % MOD;
                  }
              }
              return (d0[zero][one] + d1[zero][one]) % MOD;
          };
        `,
        typescript: code`
          function numberOfStableArrays(zero: number, one: number, limit: number): number {
              var MOD = 1000000007;
              var d0: number[][] = [], d1: number[][] = [];
              for (var i = 0; i <= zero; i++) {
                  var r0: number[] = [], r1: number[] = [];
                  for (var t = 0; t <= one; t++) { r0.push(0); r1.push(0); }
                  d0.push(r0);
                  d1.push(r1);
              }
              for (i = 1; i <= Math.min(zero, limit); i++) d0[i][0] = 1;
              for (var j = 1; j <= Math.min(one, limit); j++) d1[0][j] = 1;
              for (i = 1; i <= zero; i++) {
                  for (j = 1; j <= one; j++) {
                      var a = d0[i - 1][j] + d1[i - 1][j];
                      if (i > limit) a += MOD - d1[i - limit - 1][j];
                      var b = d0[i][j - 1] + d1[i][j - 1];
                      if (j > limit) b += MOD - d0[i][j - limit - 1];
                      d0[i][j] = a % MOD;
                      d1[i][j] = b % MOD;
                  }
              }
              return (d0[zero][one] + d1[zero][one]) % MOD;
          }
        `,
        java: code`
          public static int numberOfStableArrays(int zero, int one, int limit) {
              final long MOD = 1000000007L;
              long[][] d0 = new long[zero + 1][one + 1];
              long[][] d1 = new long[zero + 1][one + 1];
              for (int i = 1; i <= Math.min(zero, limit); i++) d0[i][0] = 1;
              for (int j = 1; j <= Math.min(one, limit); j++) d1[0][j] = 1;
              for (int i = 1; i <= zero; i++) {
                  for (int j = 1; j <= one; j++) {
                      long a = d0[i - 1][j] + d1[i - 1][j];
                      if (i > limit) a += MOD - d1[i - limit - 1][j];
                      long b = d0[i][j - 1] + d1[i][j - 1];
                      if (j > limit) b += MOD - d0[i][j - limit - 1];
                      d0[i][j] = a % MOD;
                      d1[i][j] = b % MOD;
                  }
              }
              return (int) ((d0[zero][one] + d1[zero][one]) % MOD);
          }
        `,
        cpp: code`
          int numberOfStableArrays(int zero, int one, int limit) {
              const long long MOD = 1000000007LL;
              vector<vector<long long>> d0(zero + 1, vector<long long>(one + 1, 0));
              vector<vector<long long>> d1(zero + 1, vector<long long>(one + 1, 0));
              for (int i = 1; i <= min(zero, limit); i++) d0[i][0] = 1;
              for (int j = 1; j <= min(one, limit); j++) d1[0][j] = 1;
              for (int i = 1; i <= zero; i++) {
                  for (int j = 1; j <= one; j++) {
                      long long a = d0[i - 1][j] + d1[i - 1][j];
                      if (i > limit) a += MOD - d1[i - limit - 1][j];
                      long long b = d0[i][j - 1] + d1[i][j - 1];
                      if (j > limit) b += MOD - d0[i][j - limit - 1];
                      d0[i][j] = a % MOD;
                      d1[i][j] = b % MOD;
                  }
              }
              return (int) ((d0[zero][one] + d1[zero][one]) % MOD);
          }
        `,
        c: code`
          int numberOfStableArrays(int zero, int one, int limit) {
              const long long MOD = 1000000007LL;
              int w = one + 1;
              long long* d0 = (long long*)calloc((zero + 1) * w, sizeof(long long));
              long long* d1 = (long long*)calloc((zero + 1) * w, sizeof(long long));
              for (int i = 1; i <= zero && i <= limit; i++) d0[i * w] = 1;
              for (int j = 1; j <= one && j <= limit; j++) d1[j] = 1;
              for (int i = 1; i <= zero; i++) {
                  for (int j = 1; j <= one; j++) {
                      long long a = d0[(i - 1) * w + j] + d1[(i - 1) * w + j];
                      if (i > limit) a += MOD - d1[(i - limit - 1) * w + j];
                      long long b = d0[i * w + j - 1] + d1[i * w + j - 1];
                      if (j > limit) b += MOD - d0[i * w + j - limit - 1];
                      d0[i * w + j] = a % MOD;
                      d1[i * w + j] = b % MOD;
                  }
              }
              int res = (int) ((d0[zero * w + one] + d1[zero * w + one]) % MOD);
              free(d0);
              free(d1);
              return res;
          }
        `,
        csharp: code`
          public static int NumberOfStableArrays(int zero, int one, int limit)
          {
              const long MOD = 1000000007L;
              long[,] d0 = new long[zero + 1, one + 1];
              long[,] d1 = new long[zero + 1, one + 1];
              for (int i = 1; i <= Math.Min(zero, limit); i++) d0[i, 0] = 1;
              for (int j = 1; j <= Math.Min(one, limit); j++) d1[0, j] = 1;
              for (int i = 1; i <= zero; i++)
              {
                  for (int j = 1; j <= one; j++)
                  {
                      long a = d0[i - 1, j] + d1[i - 1, j];
                      if (i > limit) a += MOD - d1[i - limit - 1, j];
                      long b = d0[i, j - 1] + d1[i, j - 1];
                      if (j > limit) b += MOD - d0[i, j - limit - 1];
                      d0[i, j] = a % MOD;
                      d1[i, j] = b % MOD;
                  }
              }
              return (int)((d0[zero, one] + d1[zero, one]) % MOD);
          }
        `,
        go: code`
          func numberOfStableArrays(zero int, one int, limit int) int {
          	const MOD = 1000000007
          	d0 := make([][]int, zero+1)
          	d1 := make([][]int, zero+1)
          	for i := range d0 {
          		d0[i] = make([]int, one+1)
          		d1[i] = make([]int, one+1)
          	}
          	for i := 1; i <= zero && i <= limit; i++ {
          		d0[i][0] = 1
          	}
          	for j := 1; j <= one && j <= limit; j++ {
          		d1[0][j] = 1
          	}
          	for i := 1; i <= zero; i++ {
          		for j := 1; j <= one; j++ {
          			a := d0[i-1][j] + d1[i-1][j]
          			if i > limit {
          				a += MOD - d1[i-limit-1][j]
          			}
          			b := d0[i][j-1] + d1[i][j-1]
          			if j > limit {
          				b += MOD - d0[i][j-limit-1]
          			}
          			d0[i][j] = a % MOD
          			d1[i][j] = b % MOD
          		}
          	}
          	return (d0[zero][one] + d1[zero][one]) % MOD
          }
        `,
        kotlin: code`
          fun numberOfStableArrays(zero: Int, one: Int, limit: Int): Int {
              val MOD = 1000000007L
              val d0 = Array(zero + 1) { LongArray(one + 1) }
              val d1 = Array(zero + 1) { LongArray(one + 1) }
              for (i in 1..minOf(zero, limit)) d0[i][0] = 1L
              for (j in 1..minOf(one, limit)) d1[0][j] = 1L
              for (i in 1..zero) {
                  for (j in 1..one) {
                      var a = d0[i - 1][j] + d1[i - 1][j]
                      if (i > limit) a += MOD - d1[i - limit - 1][j]
                      var b = d0[i][j - 1] + d1[i][j - 1]
                      if (j > limit) b += MOD - d0[i][j - limit - 1]
                      d0[i][j] = a % MOD
                      d1[i][j] = b % MOD
                  }
              }
              return ((d0[zero][one] + d1[zero][one]) % MOD).toInt()
          }
        `,
        swift: code`
          func numberOfStableArrays(_ zero: Int, _ one: Int, _ limit: Int) -> Int {
              let MOD = 1000000007
              var d0 = [[Int]](repeating: [Int](repeating: 0, count: one + 1), count: zero + 1)
              var d1 = [[Int]](repeating: [Int](repeating: 0, count: one + 1), count: zero + 1)
              for i in stride(from: 1, through: min(zero, limit), by: 1) { d0[i][0] = 1 }
              for j in stride(from: 1, through: min(one, limit), by: 1) { d1[0][j] = 1 }
              for i in 1...zero {
                  for j in 1...one {
                      var a = d0[i - 1][j] + d1[i - 1][j]
                      if i > limit { a += MOD - d1[i - limit - 1][j] }
                      var b = d0[i][j - 1] + d1[i][j - 1]
                      if j > limit { b += MOD - d0[i][j - limit - 1] }
                      d0[i][j] = a % MOD
                      d1[i][j] = b % MOD
                  }
              }
              return (d0[zero][one] + d1[zero][one]) % MOD
          }
        `,
        rust: code`
          fn numberOfStableArrays(zero: i32, one: i32, limit: i32) -> i32 {
              let md: i64 = 1000000007;
              let (z, o, lim) = (zero as usize, one as usize, limit as usize);
              let mut d0 = vec![vec![0i64; o + 1]; z + 1];
              let mut d1 = vec![vec![0i64; o + 1]; z + 1];
              for i in 1..=std::cmp::min(z, lim) {
                  d0[i][0] = 1;
              }
              for j in 1..=std::cmp::min(o, lim) {
                  d1[0][j] = 1;
              }
              for i in 1..=z {
                  for j in 1..=o {
                      let mut a = d0[i - 1][j] + d1[i - 1][j];
                      if i > lim {
                          a += md - d1[i - lim - 1][j];
                      }
                      let mut b = d0[i][j - 1] + d1[i][j - 1];
                      if j > lim {
                          b += md - d0[i][j - lim - 1];
                      }
                      d0[i][j] = a % md;
                      d1[i][j] = b % md;
                  }
              }
              ((d0[z][o] + d1[z][o]) % md) as i32
          }
        `,
        php: code`
          function numberOfStableArrays($zero, $one, $limit) {
              $MOD = 1000000007;
              $d0 = array_fill(0, $zero + 1, array_fill(0, $one + 1, 0));
              $d1 = array_fill(0, $zero + 1, array_fill(0, $one + 1, 0));
              for ($i = 1; $i <= $zero && $i <= $limit; $i++) $d0[$i][0] = 1;
              for ($j = 1; $j <= $one && $j <= $limit; $j++) $d1[0][$j] = 1;
              for ($i = 1; $i <= $zero; $i++) {
                  for ($j = 1; $j <= $one; $j++) {
                      $a = $d0[$i - 1][$j] + $d1[$i - 1][$j];
                      if ($i > $limit) $a += $MOD - $d1[$i - $limit - 1][$j];
                      $b = $d0[$i][$j - 1] + $d1[$i][$j - 1];
                      if ($j > $limit) $b += $MOD - $d0[$i][$j - $limit - 1];
                      $d0[$i][$j] = $a % $MOD;
                      $d1[$i][$j] = $b % $MOD;
                  }
              }
              return ($d0[$zero][$one] + $d1[$zero][$one]) % $MOD;
          }
        `,
        ruby: code`
          def numberOfStableArrays(zero, one, limit)
            md = 1_000_000_007
            d0 = Array.new(zero + 1) { Array.new(one + 1, 0) }
            d1 = Array.new(zero + 1) { Array.new(one + 1, 0) }
            (1..[zero, limit].min).each { |i| d0[i][0] = 1 }
            (1..[one, limit].min).each { |j| d1[0][j] = 1 }
            (1..zero).each do |i|
              (1..one).each do |j|
                a = d0[i - 1][j] + d1[i - 1][j]
                a -= d1[i - limit - 1][j] if i > limit
                b = d0[i][j - 1] + d1[i][j - 1]
                b -= d0[i][j - limit - 1] if j > limit
                d0[i][j] = a % md
                d1[i][j] = b % md
              end
            end
            (d0[zero][one] + d1[zero][one]) % md
          end
        `,
      },
    };
  })(),

  // ── Find the Maximum Length of a Good Subsequence I (LC 3176) ───
  (() => {
    const ref = (nums: number[], k: number) => {
      // dp[i][j] = longest good subsequence ending at index i with at most j changes, O(n² k)
      const n = nums.length;
      const dp: number[][] = Array.from({ length: n }, () => new Array(k + 1).fill(1));
      let best = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j <= k; j++) {
          for (let p = 0; p < i; p++) {
            if (nums[p] === nums[i]) dp[i][j] = Math.max(dp[i][j], dp[p][j] + 1);
            else if (j > 0) dp[i][j] = Math.max(dp[i][j], dp[p][j - 1] + 1);
          }
          best = Math.max(best, dp[i][j]);
        }
      }
      return best;
    };
    return {
      slug: "find-the-maximum-length-of-a-good-subsequence-i",
      title: "Find the Maximum Length of a Good Subsequence I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "maximumLength",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A sequence `seq` is **good** if there are at most `k` indices `i` in `[0, seq.length - 2]` with `seq[i] != seq[i + 1]` — that is, its value changes at most `k` times from one element to the next.\n\nReturn the maximum possible length of a good **subsequence** of `nums` (delete any elements, keep the rest in order).",
        [
          { in: "nums = [1,2,1,1,3], k = 2", out: "4", note: "`[1,2,1,1]` changes value twice." },
          { in: "nums = [1,2,3,4,5,1], k = 0", out: "2", note: "`[1,1]` — no changes allowed." },
          { in: "nums = [4,4,9,4], k = 1", out: "3" },
        ],
        ["1 <= nums.length <= 500", "1 <= nums[i] <= 10^9", "0 <= k <= min(nums.length, 25)"]),
      hints: [
        "Describe a subsequence by where it ends and how many value changes it has used.",
        "`dp[i][j]` = longest good subsequence ending at index `i` with at most `j` changes: extend from an earlier equal value at the same `j`, or from an earlier different value at `j - 1`.",
        "To avoid the O(n²) scan, keep for every value `v` the best `dp` ending with `v` at each `j`, and the overall best at each `j`; each element then updates in O(k).",
      ],
      editorial: explain({
        idea: "Let `f[v][j]` be the longest good subsequence (at most `j` changes) that ends with value `v`, and `best[j] = max over v of f[v][j]`. Appending `nums[i] = v` either continues a subsequence ending in `v` (no new change) or follows a subsequence ending in anything else (one more change).",
        steps: [
          "Process `nums` left to right. For the current value `v`, for `j` from `k` down to 0:",
          "`f[v][j] = 1 + max(f[v][j], j > 0 ? best[j - 1] : 0)` — the old `f[v][j]` continues a run of `v`, `best[j - 1]` pays one change.",
          "Update `best[j] = max(best[j], f[v][j])`.",
          "Return `best[k]`.",
        ],
        why: "Going through `j` downwards means `best[j - 1]` still describes elements before the current one when it is read. `best[j - 1]` may itself end in `v`, which would not actually need a change — but then `f[v][j] >= f[v][j - 1]` already gives at least as much, so the overcount never wins. Every good subsequence ending at the current element is one of the two cases, so the values are exact.",
        time: "O(n · k)",
        space: "O(d · k) for d distinct values",
        pitfalls: [
          "Count changes between neighbours of the subsequence, not of the original array.",
          "Iterate `j` downwards, or the current element can be used twice.",
          "With `k = 0` the answer is the highest frequency of any value.",
        ],
      }),
      examples: [
        { input: "[1,2,1,1,3]\n2", expectedOutput: "4" },
        { input: "[1,2,3,4,5,1]\n0", expectedOutput: "2" },
        { input: "[4,4,9,4]\n1", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 1, 5) : ri(rng, 6, rng() < 0.85 ? 22 : 34);
        const kind = ri(rng, 0, 2);
        const nums = kind === 0
          ? Array.from({ length: n }, () => ri(rng, 1, pick(rng, [2, 3, 5])))
          : kind === 1
            ? Array.from({ length: n }, () => pick(rng, [7, 1000000000, 42, 999999937]))
            : Array.from({ length: n }, () => ri(rng, 1, 1000000000));
        const k = rng() < 0.2 ? 0 : ri(rng, 0, Math.min(n, 25));
        return { input: fmtIntArr(nums) + "\n" + k, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumLength(nums: List[int], k: int) -> int:
              best = [0] * (k + 1)
              f = {}
              for v in nums:
                  cur = f.get(v)
                  if cur is None:
                      cur = [0] * (k + 1)
                      f[v] = cur
                  for j in range(k, -1, -1):
                      cand = cur[j] + 1
                      if j > 0 and best[j - 1] + 1 > cand:
                          cand = best[j - 1] + 1
                      cur[j] = cand
                      if cand > best[j]:
                          best[j] = cand
              return best[k]
        `,
        javascript: code`
          var maximumLength = function(nums, k) {
              var best = new Array(k + 1).fill(0);
              var f = new Map();
              for (var i = 0; i < nums.length; i++) {
                  var v = nums[i];
                  var cur = f.get(v);
                  if (cur === undefined) {
                      cur = new Array(k + 1).fill(0);
                      f.set(v, cur);
                  }
                  for (var j = k; j >= 0; j--) {
                      var cand = cur[j] + 1;
                      if (j > 0 && best[j - 1] + 1 > cand) cand = best[j - 1] + 1;
                      cur[j] = cand;
                      if (cand > best[j]) best[j] = cand;
                  }
              }
              return best[k];
          };
        `,
        typescript: code`
          function maximumLength(nums: number[], k: number): number {
              var best: number[] = [];
              for (var t = 0; t <= k; t++) best.push(0);
              var f: { [key: string]: number[] } = {};
              for (var i = 0; i < nums.length; i++) {
                  var key = "" + nums[i];
                  if (!f.hasOwnProperty(key)) {
                      var fresh: number[] = [];
                      for (t = 0; t <= k; t++) fresh.push(0);
                      f[key] = fresh;
                  }
                  var cur = f[key];
                  for (var j = k; j >= 0; j--) {
                      var cand = cur[j] + 1;
                      if (j > 0 && best[j - 1] + 1 > cand) cand = best[j - 1] + 1;
                      cur[j] = cand;
                      if (cand > best[j]) best[j] = cand;
                  }
              }
              return best[k];
          }
        `,
        java: code`
          public static int maximumLength(int[] nums, int k) {
              int[] best = new int[k + 1];
              Map<Integer, int[]> f = new HashMap<>();
              for (int v : nums) {
                  int[] cur = f.get(v);
                  if (cur == null) {
                      cur = new int[k + 1];
                      f.put(v, cur);
                  }
                  for (int j = k; j >= 0; j--) {
                      int cand = cur[j] + 1;
                      if (j > 0 && best[j - 1] + 1 > cand) cand = best[j - 1] + 1;
                      cur[j] = cand;
                      if (cand > best[j]) best[j] = cand;
                  }
              }
              return best[k];
          }
        `,
        cpp: code`
          int maximumLength(vector<int>& nums, int k) {
              vector<int> best(k + 1, 0);
              unordered_map<int, vector<int>> f;
              for (int v : nums) {
                  auto it = f.find(v);
                  if (it == f.end()) it = f.emplace(v, vector<int>(k + 1, 0)).first;
                  vector<int>& cur = it->second;
                  for (int j = k; j >= 0; j--) {
                      int cand = cur[j] + 1;
                      if (j > 0 && best[j - 1] + 1 > cand) cand = best[j - 1] + 1;
                      cur[j] = cand;
                      if (cand > best[j]) best[j] = cand;
                  }
              }
              return best[k];
          }
        `,
        c: code`
          static int cmpAscGood(const void* x, const void* y) {
              int a = *(const int*)x, b = *(const int*)y;
              return (a > b) - (a < b);
          }

          int maximumLength(int* nums, int numsSize, int k) {
              int n = numsSize;
              int* vals = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) vals[i] = nums[i];
              qsort(vals, n, sizeof(int), cmpAscGood);
              int u = 0;
              for (int i = 0; i < n; i++) if (i == 0 || vals[i] != vals[i - 1]) vals[u++] = vals[i];
              int* f = (int*)calloc(u * (k + 1), sizeof(int));
              int* best = (int*)calloc(k + 1, sizeof(int));
              for (int i = 0; i < n; i++) {
                  int lo = 0, hi = u - 1, id = 0;
                  while (lo <= hi) {
                      int mid = lo + (hi - lo) / 2;
                      if (vals[mid] == nums[i]) { id = mid; break; }
                      if (vals[mid] < nums[i]) lo = mid + 1; else hi = mid - 1;
                  }
                  int* cur = f + id * (k + 1);
                  for (int j = k; j >= 0; j--) {
                      int cand = cur[j] + 1;
                      if (j > 0 && best[j - 1] + 1 > cand) cand = best[j - 1] + 1;
                      cur[j] = cand;
                      if (cand > best[j]) best[j] = cand;
                  }
              }
              int res = best[k];
              free(vals);
              free(f);
              free(best);
              return res;
          }
        `,
        csharp: code`
          public static int MaximumLength(int[] nums, int k)
          {
              int[] best = new int[k + 1];
              var f = new Dictionary<int, int[]>();
              foreach (int v in nums)
              {
                  int[] cur;
                  if (!f.TryGetValue(v, out cur))
                  {
                      cur = new int[k + 1];
                      f[v] = cur;
                  }
                  for (int j = k; j >= 0; j--)
                  {
                      int cand = cur[j] + 1;
                      if (j > 0 && best[j - 1] + 1 > cand) cand = best[j - 1] + 1;
                      cur[j] = cand;
                      if (cand > best[j]) best[j] = cand;
                  }
              }
              return best[k];
          }
        `,
        go: code`
          func maximumLength(nums []int, k int) int {
          	best := make([]int, k+1)
          	f := map[int][]int{}
          	for _, v := range nums {
          		cur, ok := f[v]
          		if !ok {
          			cur = make([]int, k+1)
          			f[v] = cur
          		}
          		for j := k; j >= 0; j-- {
          			cand := cur[j] + 1
          			if j > 0 && best[j-1]+1 > cand {
          				cand = best[j-1] + 1
          			}
          			cur[j] = cand
          			if cand > best[j] {
          				best[j] = cand
          			}
          		}
          	}
          	return best[k]
          }
        `,
        kotlin: code`
          fun maximumLength(nums: IntArray, k: Int): Int {
              val best = IntArray(k + 1)
              val f = HashMap<Int, IntArray>()
              for (v in nums) {
                  val cur = f.getOrPut(v) { IntArray(k + 1) }
                  for (j in k downTo 0) {
                      var cand = cur[j] + 1
                      if (j > 0 && best[j - 1] + 1 > cand) cand = best[j - 1] + 1
                      cur[j] = cand
                      if (cand > best[j]) best[j] = cand
                  }
              }
              return best[k]
          }
        `,
        swift: code`
          func maximumLength(_ nums: [Int], _ k: Int) -> Int {
              var best = [Int](repeating: 0, count: k + 1)
              var ids = [Int: Int]()
              var f = [[Int]]()
              for v in nums {
                  var id = ids[v] ?? -1
                  if id < 0 {
                      id = f.count
                      ids[v] = id
                      f.append([Int](repeating: 0, count: k + 1))
                  }
                  var j = k
                  while j >= 0 {
                      var cand = f[id][j] + 1
                      if j > 0 && best[j - 1] + 1 > cand { cand = best[j - 1] + 1 }
                      f[id][j] = cand
                      if cand > best[j] { best[j] = cand }
                      j -= 1
                  }
              }
              return best[k]
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn maximumLength(nums: Vec<i32>, k: i32) -> i32 {
              let k = k as usize;
              let mut best = vec![0i32; k + 1];
              let mut f: HashMap<i32, Vec<i32>> = HashMap::new();
              for &v in nums.iter() {
                  let cur = f.entry(v).or_insert_with(|| vec![0i32; k + 1]);
                  for j in (0..=k).rev() {
                      let mut cand = cur[j] + 1;
                      if j > 0 && best[j - 1] + 1 > cand {
                          cand = best[j - 1] + 1;
                      }
                      cur[j] = cand;
                      if cand > best[j] {
                          best[j] = cand;
                      }
                  }
              }
              best[k]
          }
        `,
        php: code`
          function maximumLength($nums, $k) {
              $best = array_fill(0, $k + 1, 0);
              $f = [];
              foreach ($nums as $v) {
                  if (!isset($f[$v])) $f[$v] = array_fill(0, $k + 1, 0);
                  for ($j = $k; $j >= 0; $j--) {
                      $cand = $f[$v][$j] + 1;
                      if ($j > 0 && $best[$j - 1] + 1 > $cand) $cand = $best[$j - 1] + 1;
                      $f[$v][$j] = $cand;
                      if ($cand > $best[$j]) $best[$j] = $cand;
                  }
              }
              return $best[$k];
          }
        `,
        ruby: code`
          def maximumLength(nums, k)
            best = Array.new(k + 1, 0)
            f = {}
            nums.each do |v|
              cur = (f[v] ||= Array.new(k + 1, 0))
              k.downto(0) do |j|
                cand = cur[j] + 1
                cand = best[j - 1] + 1 if j > 0 && best[j - 1] + 1 > cand
                cur[j] = cand
                best[j] = cand if cand > best[j]
              end
            end
            best[k]
          end
        `,
      },
    };
  })(),

  // ── Maximum Energy Boost From Two Drinks (LC 3259) ──────────────
  (() => {
    const ref = (A: number[], B: number[]) => {
      // each hour: drink A, drink B or rest; A and B may never be in adjacent hours
      const n = A.length;
      const memo = new Map<number, number>();
      const go = (i: number, prev: number): number => {
        if (i === n) return 0;
        const key = i * 3 + prev;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let res = go(i + 1, 2);
        if (prev !== 1) res = Math.max(res, A[i] + go(i + 1, 0));
        if (prev !== 0) res = Math.max(res, B[i] + go(i + 1, 1));
        memo.set(key, res);
        return res;
      };
      return go(0, 2);
    };
    return {
      slug: "maximum-energy-boost-from-two-drinks",
      title: "Maximum Energy Boost From Two Drinks",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "maxEnergyBoost",
        params: [{ name: "energyDrinkA", type: "int[]" as const }, { name: "energyDrinkB", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Two arrays of length `n`, `energyDrinkA` and `energyDrinkB`, give the energy boost each drink provides in each of the next `n` hours.\n\nEvery hour you drink one of the two, starting with either. To **switch** from one drink to the other you must spend one hour cleansing your system, gaining nothing that hour.\n\nReturn the maximum total energy boost over the `n` hours.\n\n*CodeKairo bound:* boosts are at most `10^4` (LeetCode allows `10^5`) so that the total fits in a 32-bit integer.",
        [
          { in: "energyDrinkA = [1,3,1], energyDrinkB = [3,1,1]", out: "5", note: "Drink only A (1 + 3 + 1) or only B (3 + 1 + 1)." },
          { in: "energyDrinkA = [4,1,1], energyDrinkB = [1,1,3]", out: "7", note: "A in hour 0, cleanse in hour 1, B in hour 2." },
          { in: "energyDrinkA = [2,2,9,1], energyDrinkB = [5,5,1,1]", out: "15", note: "B, cleanse, A, A: 5 + 9 + 1." },
        ],
        ["n == energyDrinkA.length == energyDrinkB.length", "3 <= n <= 10^5", "1 <= energyDrinkA[i], energyDrinkB[i] <= 10^4"]),
      hints: [
        "Track the best total that ends with each drink at hour `i`.",
        "To drink A at hour `i`, the previous hour was either A, or a cleansing hour after B at hour `i - 2`.",
        "`a[i] = max(a[i-1], b[i-2]) + A[i]` and symmetrically for `b[i]`.",
      ],
      editorial: explain({
        idea: "Two-state DP. A switch costs exactly one hour, so the hour before an A-drink is either another A-drink or the cleanse that followed a B-drink two hours earlier.",
        steps: [
          "`a[0] = A[0]`, `b[0] = B[0]`; treat `a[-1] = b[-1] = 0`.",
          "For `i >= 1`: `a[i] = max(a[i-1], b[i-2]) + A[i]`, `b[i] = max(b[i-1], a[i-2]) + B[i]`.",
          "Return `max(a[n-1], b[n-1])`; only the last two values of each are ever needed.",
        ],
        why: "In an optimal plan the hour before drinking A at hour `i` either holds an A-drink (continue) or is a cleanse; a cleanse is only ever worth taking to switch, so the hour before it holds a B-drink. Both predecessors are optimal sub-plans, so the recurrence is exact (an unnecessary idle hour never helps because every boost is positive).",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Switching does not cost the next drink — it costs one whole hour of boost.",
          "You may start with either drink; do not force a start with A.",
          "With LeetCode's original bounds the total needs 64 bits; the tightened bound keeps it in 32.",
        ],
      }),
      examples: [
        { input: "[1,3,1]\n[3,1,1]", expectedOutput: "5" },
        { input: "[4,1,1]\n[1,1,3]", expectedOutput: "7" },
        { input: "[2,2,9,1]\n[5,5,1,1]", expectedOutput: "15" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 3, 5) : ri(rng, 6, rng() < 0.85 ? 40 : 150);
        const hi = pick(rng, [3, 10, 10000]);
        const A = Array.from({ length: n }, () => ri(rng, 1, hi));
        const B = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(A) + "\n" + fmtIntArr(B), expectedOutput: String(ref(A, B)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxEnergyBoost(energyDrinkA: List[int], energyDrinkB: List[int]) -> int:
              a, b = energyDrinkA, energyDrinkB
              pa = pb = 0
              ca, cb = a[0], b[0]
              for i in range(1, len(a)):
                  na = max(ca, pb) + a[i]
                  nb = max(cb, pa) + b[i]
                  pa, pb = ca, cb
                  ca, cb = na, nb
              return max(ca, cb)
        `,
        javascript: code`
          var maxEnergyBoost = function(energyDrinkA, energyDrinkB) {
              var pa = 0, pb = 0;
              var ca = energyDrinkA[0], cb = energyDrinkB[0];
              for (var i = 1; i < energyDrinkA.length; i++) {
                  var na = Math.max(ca, pb) + energyDrinkA[i];
                  var nb = Math.max(cb, pa) + energyDrinkB[i];
                  pa = ca; pb = cb;
                  ca = na; cb = nb;
              }
              return Math.max(ca, cb);
          };
        `,
        typescript: code`
          function maxEnergyBoost(energyDrinkA: number[], energyDrinkB: number[]): number {
              var pa = 0, pb = 0;
              var ca = energyDrinkA[0], cb = energyDrinkB[0];
              for (var i = 1; i < energyDrinkA.length; i++) {
                  var na = Math.max(ca, pb) + energyDrinkA[i];
                  var nb = Math.max(cb, pa) + energyDrinkB[i];
                  pa = ca; pb = cb;
                  ca = na; cb = nb;
              }
              return Math.max(ca, cb);
          }
        `,
        java: code`
          public static int maxEnergyBoost(int[] energyDrinkA, int[] energyDrinkB) {
              int pa = 0, pb = 0;
              int ca = energyDrinkA[0], cb = energyDrinkB[0];
              for (int i = 1; i < energyDrinkA.length; i++) {
                  int na = Math.max(ca, pb) + energyDrinkA[i];
                  int nb = Math.max(cb, pa) + energyDrinkB[i];
                  pa = ca; pb = cb;
                  ca = na; cb = nb;
              }
              return Math.max(ca, cb);
          }
        `,
        cpp: code`
          int maxEnergyBoost(vector<int>& energyDrinkA, vector<int>& energyDrinkB) {
              int pa = 0, pb = 0;
              int ca = energyDrinkA[0], cb = energyDrinkB[0];
              for (size_t i = 1; i < energyDrinkA.size(); i++) {
                  int na = max(ca, pb) + energyDrinkA[i];
                  int nb = max(cb, pa) + energyDrinkB[i];
                  pa = ca; pb = cb;
                  ca = na; cb = nb;
              }
              return max(ca, cb);
          }
        `,
        c: code`
          int maxEnergyBoost(int* energyDrinkA, int energyDrinkASize, int* energyDrinkB, int energyDrinkBSize) {
              int pa = 0, pb = 0;
              int ca = energyDrinkA[0], cb = energyDrinkB[0];
              for (int i = 1; i < energyDrinkASize; i++) {
                  int na = (ca > pb ? ca : pb) + energyDrinkA[i];
                  int nb = (cb > pa ? cb : pa) + energyDrinkB[i];
                  pa = ca; pb = cb;
                  ca = na; cb = nb;
              }
              return ca > cb ? ca : cb;
          }
        `,
        csharp: code`
          public static int MaxEnergyBoost(int[] energyDrinkA, int[] energyDrinkB)
          {
              int pa = 0, pb = 0;
              int ca = energyDrinkA[0], cb = energyDrinkB[0];
              for (int i = 1; i < energyDrinkA.Length; i++)
              {
                  int na = Math.Max(ca, pb) + energyDrinkA[i];
                  int nb = Math.Max(cb, pa) + energyDrinkB[i];
                  pa = ca; pb = cb;
                  ca = na; cb = nb;
              }
              return Math.Max(ca, cb);
          }
        `,
        go: code`
          func maxEnergyBoost(energyDrinkA []int, energyDrinkB []int) int {
          	big := func(x, y int) int {
          		if x > y {
          			return x
          		}
          		return y
          	}
          	pa, pb := 0, 0
          	ca, cb := energyDrinkA[0], energyDrinkB[0]
          	for i := 1; i < len(energyDrinkA); i++ {
          		na := big(ca, pb) + energyDrinkA[i]
          		nb := big(cb, pa) + energyDrinkB[i]
          		pa, pb = ca, cb
          		ca, cb = na, nb
          	}
          	return big(ca, cb)
          }
        `,
        kotlin: code`
          fun maxEnergyBoost(energyDrinkA: IntArray, energyDrinkB: IntArray): Int {
              var pa = 0
              var pb = 0
              var ca = energyDrinkA[0]
              var cb = energyDrinkB[0]
              for (i in 1 until energyDrinkA.size) {
                  val na = maxOf(ca, pb) + energyDrinkA[i]
                  val nb = maxOf(cb, pa) + energyDrinkB[i]
                  pa = ca
                  pb = cb
                  ca = na
                  cb = nb
              }
              return maxOf(ca, cb)
          }
        `,
        swift: code`
          func maxEnergyBoost(_ energyDrinkA: [Int], _ energyDrinkB: [Int]) -> Int {
              var pa = 0
              var pb = 0
              var ca = energyDrinkA[0]
              var cb = energyDrinkB[0]
              for i in 1..<energyDrinkA.count {
                  let na = max(ca, pb) + energyDrinkA[i]
                  let nb = max(cb, pa) + energyDrinkB[i]
                  pa = ca
                  pb = cb
                  ca = na
                  cb = nb
              }
              return max(ca, cb)
          }
        `,
        rust: code`
          fn maxEnergyBoost(energyDrinkA: Vec<i32>, energyDrinkB: Vec<i32>) -> i32 {
              let (mut pa, mut pb) = (0i32, 0i32);
              let (mut ca, mut cb) = (energyDrinkA[0], energyDrinkB[0]);
              for i in 1..energyDrinkA.len() {
                  let na = ca.max(pb) + energyDrinkA[i];
                  let nb = cb.max(pa) + energyDrinkB[i];
                  pa = ca;
                  pb = cb;
                  ca = na;
                  cb = nb;
              }
              ca.max(cb)
          }
        `,
        php: code`
          function maxEnergyBoost($energyDrinkA, $energyDrinkB) {
              $pa = 0;
              $pb = 0;
              $ca = $energyDrinkA[0];
              $cb = $energyDrinkB[0];
              $n = count($energyDrinkA);
              for ($i = 1; $i < $n; $i++) {
                  $na = max($ca, $pb) + $energyDrinkA[$i];
                  $nb = max($cb, $pa) + $energyDrinkB[$i];
                  $pa = $ca;
                  $pb = $cb;
                  $ca = $na;
                  $cb = $nb;
              }
              return max($ca, $cb);
          }
        `,
        ruby: code`
          def maxEnergyBoost(energyDrinkA, energyDrinkB)
            pa = 0
            pb = 0
            ca = energyDrinkA[0]
            cb = energyDrinkB[0]
            (1...energyDrinkA.length).each do |i|
              na = [ca, pb].max + energyDrinkA[i]
              nb = [cb, pa].max + energyDrinkB[i]
              pa = ca
              pb = cb
              ca = na
              cb = nb
            end
            [ca, cb].max
          end
        `,
      },
    };
  })(),

  // ── Maximum Multiplication Score (LC 3290) ──────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      let best = -Infinity;
      const n = b.length;
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          for (let k = j + 1; k < n; k++)
            for (let l = k + 1; l < n; l++)
              best = Math.max(best, a[0] * b[i] + a[1] * b[j] + a[2] * b[k] + a[3] * b[l]);
      return best;
    };
    return {
      slug: "maximum-multiplication-score",
      title: "Maximum Multiplication Score",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "maxScore",
        params: [{ name: "a", type: "int[]" as const }, { name: "b", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array `a` of length **4** and an array `b` of length at least 4.\n\nChoose four indices `i0 < i1 < i2 < i3` of `b`. Their score is `a[0] * b[i0] + a[1] * b[i1] + a[2] * b[i2] + a[3] * b[i3]`. Return the maximum score achievable.\n\n*CodeKairo bound:* values lie in `[-10^4, 10^4]` (LeetCode allows `±10^5`) so that the answer fits in a 32-bit integer.",
        [
          { in: "a = [3,2,5,6], b = [2,-6,4,-5,-3,2,-7]", out: "26", note: "Indices 0, 1, 2, 5: 3·2 + 2·(-6) + 5·4 + 6·2." },
          { in: "a = [-1,4,5,-2], b = [-5,-1,-3,-2,-4]", out: "-1", note: "Indices 0, 1, 3, 4." },
          { in: "a = [1,1,1,1], b = [1,2,3,4,5]", out: "14" },
        ],
        ["a.length == 4", "4 <= b.length <= 10^5", "-10^4 <= a[i], b[i] <= 10^4"]),
      hints: [
        "Choose the four indices left to right: the only thing that matters about a partial choice is how many of `a` it has used.",
        "Let `dp[k]` be the best score after assigning `a[0..k]` to indices chosen among the elements scanned so far.",
        "For each `b[j]`, update `k = 3, 2, 1, 0` (downwards): `dp[k] = max(dp[k], dp[k-1] + a[k] * b[j])`, with `dp[-1] = 0`.",
      ],
      editorial: explain({
        idea: "A tiny knapsack over the four slots of `a`. Scanning `b` left to right, each element may fill the next slot after any partial assignment made strictly earlier, which keeps the indices increasing.",
        steps: [
          "Initialise `dp[0..3] = -∞`.",
          "For each `x` in `b`, for `k` from 3 down to 0: `prev = (k == 0 ? 0 : dp[k-1])`; if `prev` is finite, `dp[k] = max(dp[k], prev + a[k] · x)`.",
          "Return `dp[3]`.",
        ],
        why: "After scanning a prefix of `b`, `dp[k]` is the best way to place `a[0..k]` on increasing indices inside that prefix. A new element either is not used, or becomes the index of `a[k]` after an optimal placement of `a[0..k-1]` on earlier elements. Updating `k` downwards guarantees `dp[k-1]` still refers to strictly earlier elements.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Updating `k` upwards lets one element fill two slots.",
          "Scores can be negative — start from -∞, not 0.",
          "A greedy pick of the largest products ignores the index order.",
        ],
      }),
      examples: [
        { input: "[3,2,5,6]\n[2,-6,4,-5,-3,2,-7]", expectedOutput: "26" },
        { input: "[-1,4,5,-2]\n[-5,-1,-3,-2,-4]", expectedOutput: "-1" },
        { input: "[1,1,1,1]\n[1,2,3,4,5]", expectedOutput: "14" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? 4 : ri(rng, 5, rng() < 0.85 ? 12 : 18);
        const hi = pick(rng, [3, 50, 10000]);
        const a = Array.from({ length: 4 }, () => ri(rng, -hi, hi));
        const b = Array.from({ length: n }, () => ri(rng, -hi, hi));
        return { input: fmtIntArr(a) + "\n" + fmtIntArr(b), expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxScore(a: List[int], b: List[int]) -> int:
              NEG = -10**18
              dp = [NEG] * 4
              for x in b:
                  for k in range(3, -1, -1):
                      prev = 0 if k == 0 else dp[k - 1]
                      if prev != NEG and prev + a[k] * x > dp[k]:
                          dp[k] = prev + a[k] * x
              return dp[3]
        `,
        javascript: code`
          var maxScore = function(a, b) {
              var dp = [-Infinity, -Infinity, -Infinity, -Infinity];
              for (var j = 0; j < b.length; j++) {
                  for (var k = 3; k >= 0; k--) {
                      var prev = k === 0 ? 0 : dp[k - 1];
                      if (prev !== -Infinity && prev + a[k] * b[j] > dp[k]) dp[k] = prev + a[k] * b[j];
                  }
              }
              return dp[3];
          };
        `,
        typescript: code`
          function maxScore(a: number[], b: number[]): number {
              var NEG = -1e18;
              var dp = [NEG, NEG, NEG, NEG];
              for (var j = 0; j < b.length; j++) {
                  for (var k = 3; k >= 0; k--) {
                      var prev = k === 0 ? 0 : dp[k - 1];
                      if (prev !== NEG && prev + a[k] * b[j] > dp[k]) dp[k] = prev + a[k] * b[j];
                  }
              }
              return dp[3];
          }
        `,
        java: code`
          public static int maxScore(int[] a, int[] b) {
              final long NEG = Long.MIN_VALUE;
              long[] dp = {NEG, NEG, NEG, NEG};
              for (int x : b) {
                  for (int k = 3; k >= 0; k--) {
                      long prev = k == 0 ? 0 : dp[k - 1];
                      if (prev == NEG) continue;
                      long cand = prev + (long) a[k] * x;
                      if (cand > dp[k]) dp[k] = cand;
                  }
              }
              return (int) dp[3];
          }
        `,
        cpp: code`
          int maxScore(vector<int>& a, vector<int>& b) {
              const long long NEG = LLONG_MIN;
              long long dp[4] = {NEG, NEG, NEG, NEG};
              for (int x : b) {
                  for (int k = 3; k >= 0; k--) {
                      long long prev = k == 0 ? 0 : dp[k - 1];
                      if (prev == NEG) continue;
                      long long cand = prev + (long long) a[k] * x;
                      if (cand > dp[k]) dp[k] = cand;
                  }
              }
              return (int) dp[3];
          }
        `,
        c: code`
          int maxScore(int* a, int aSize, int* b, int bSize) {
              const long long NEG = -4000000000000000000LL;
              long long dp[4] = {NEG, NEG, NEG, NEG};
              for (int j = 0; j < bSize; j++) {
                  for (int k = 3; k >= 0; k--) {
                      long long prev = k == 0 ? 0 : dp[k - 1];
                      if (prev == NEG) continue;
                      long long cand = prev + (long long) a[k] * b[j];
                      if (cand > dp[k]) dp[k] = cand;
                  }
              }
              return (int) dp[3];
          }
        `,
        csharp: code`
          public static int MaxScore(int[] a, int[] b)
          {
              const long NEG = long.MinValue;
              long[] dp = { NEG, NEG, NEG, NEG };
              foreach (int x in b)
              {
                  for (int k = 3; k >= 0; k--)
                  {
                      long prev = k == 0 ? 0 : dp[k - 1];
                      if (prev == NEG) continue;
                      long cand = prev + (long)a[k] * x;
                      if (cand > dp[k]) dp[k] = cand;
                  }
              }
              return (int)dp[3];
          }
        `,
        go: code`
          func maxScore(a []int, b []int) int {
          	const NEG = -(1 << 62)
          	dp := []int{NEG, NEG, NEG, NEG}
          	for _, x := range b {
          		for k := 3; k >= 0; k-- {
          			prev := 0
          			if k > 0 {
          				prev = dp[k-1]
          			}
          			if prev == NEG {
          				continue
          			}
          			if cand := prev + a[k]*x; cand > dp[k] {
          				dp[k] = cand
          			}
          		}
          	}
          	return dp[3]
          }
        `,
        kotlin: code`
          fun maxScore(a: IntArray, b: IntArray): Int {
              val NEG = Long.MIN_VALUE
              val dp = longArrayOf(NEG, NEG, NEG, NEG)
              for (x in b) {
                  for (k in 3 downTo 0) {
                      val prev = if (k == 0) 0L else dp[k - 1]
                      if (prev == NEG) continue
                      val cand = prev + a[k].toLong() * x
                      if (cand > dp[k]) dp[k] = cand
                  }
              }
              return dp[3].toInt()
          }
        `,
        swift: code`
          func maxScore(_ a: [Int], _ b: [Int]) -> Int {
              let NEG = Int.min
              var dp = [NEG, NEG, NEG, NEG]
              for x in b {
                  var k = 3
                  while k >= 0 {
                      let prev = k == 0 ? 0 : dp[k - 1]
                      if prev != NEG {
                          let cand = prev + a[k] * x
                          if cand > dp[k] { dp[k] = cand }
                      }
                      k -= 1
                  }
              }
              return dp[3]
          }
        `,
        rust: code`
          fn maxScore(a: Vec<i32>, b: Vec<i32>) -> i32 {
              let neg = std::i64::MIN;
              let mut dp = [neg; 4];
              for &x in b.iter() {
                  for k in (0..4).rev() {
                      let prev = if k == 0 { 0 } else { dp[k - 1] };
                      if prev == neg {
                          continue;
                      }
                      let cand = prev + a[k] as i64 * x as i64;
                      if cand > dp[k] {
                          dp[k] = cand;
                      }
                  }
              }
              dp[3] as i32
          }
        `,
        php: code`
          function maxScore($a, $b) {
              $NEG = PHP_INT_MIN;
              $dp = [$NEG, $NEG, $NEG, $NEG];
              foreach ($b as $x) {
                  for ($k = 3; $k >= 0; $k--) {
                      $prev = $k == 0 ? 0 : $dp[$k - 1];
                      if ($prev == $NEG) continue;
                      $cand = $prev + $a[$k] * $x;
                      if ($cand > $dp[$k]) $dp[$k] = $cand;
                  }
              }
              return $dp[3];
          }
        `,
        ruby: code`
          def maxScore(a, b)
            dp = [nil, nil, nil, nil]
            b.each do |x|
              3.downto(0) do |k|
                prev = k == 0 ? 0 : dp[k - 1]
                next if prev.nil?
                cand = prev + a[k] * x
                dp[k] = cand if dp[k].nil? || cand > dp[k]
              end
            end
            dp[3]
          end
        `,
      },
    };
  })(),

  // ── Visit Array Positions to Maximize Score (LC 2786) ───────────
  (() => {
    const ref = (nums: number[], x: number) => {
      // f[j] = best score of a visit sequence that ends at j, O(n²)
      const n = nums.length;
      const f: number[] = [nums[0]];
      let best = nums[0];
      for (let j = 1; j < n; j++) {
        let b = -Infinity;
        for (let i = 0; i < j; i++) b = Math.max(b, f[i] - ((nums[i] - nums[j]) % 2 !== 0 ? x : 0));
        f.push(b + nums[j]);
        best = Math.max(best, f[j]);
      }
      return best;
    };
    return {
      slug: "visit-array-positions-to-maximize-score",
      title: "Visit Array Positions to Maximize Score",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "maxScore",
        params: [{ name: "nums", type: "int[]" as const }, { name: "x", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You start at index `0` of `nums` with a score of `nums[0]`. From index `i` you may move to any index `j > i`; arriving at `j` adds `nums[j]` to the score. If `nums[i]` and `nums[j]` have **different parities** (one even, one odd), the move also costs `x` points.\n\nYou may stop at any time. Return the maximum score you can finish with.\n\n*CodeKairo bound:* `nums[i] <= 10^4` (LeetCode allows `10^6`) so that the answer fits in a 32-bit integer.",
        [
          { in: "nums = [2,3,6,1,9,2], x = 5", out: "13", note: "Visit 0 → 2 → 3 → 4: 2 + 6 + 1 + 9 − 5 (the move 6 → 1 changes parity)." },
          { in: "nums = [2,4,6,8], x = 3", out: "20", note: "All even: take everything." },
          { in: "nums = [7,10,9], x = 2", out: "22" },
        ],
        ["2 <= nums.length <= 10^5", "1 <= nums[i] <= 10^4", "1 <= x <= 10^6"]),
      hints: [
        "The penalty depends only on the parity of the last value visited, not on its position.",
        "Keep two numbers: the best score of a path ending on an even value and on an odd value.",
        "For `nums[j]` with parity `p`: `best[p] = max(best[p], max(best[p], best[1-p] - x) + nums[j])`.",
      ],
      editorial: explain({
        idea: "A path's future depends only on the parity of where it currently stands. So among all paths ending before `j`, only the best ending on an even value and the best ending on an odd value matter.",
        steps: [
          "`best[p] = -∞` for both parities, then `best[nums[0] % 2] = nums[0]`.",
          "For each later `v = nums[j]` with parity `p`: `cand = max(best[p] + v, best[1-p] + v - x)`; set `best[p] = max(best[p], cand)`.",
          "Return `max(best[0], best[1])`.",
        ],
        why: "Any path ending at `j` arrives from some earlier index `i`; its score is that path's score plus `nums[j]`, minus `x` exactly when the parities differ. The best such predecessor among same-parity indices is `best[p]` and among opposite-parity ones is `best[1-p]`, so `cand` is the optimum ending at `j`. Keeping `best[p]` as a running maximum also allows skipping `j`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The start index 0 is mandatory — the opposite parity starts at -∞, not 0.",
          "Skipping elements is allowed, so `best[p]` must never decrease.",
          "With the original bounds the score needs 64 bits; with these it stays below 2^31.",
        ],
      }),
      examples: [
        { input: "[2,3,6,1,9,2]\n5", expectedOutput: "13" },
        { input: "[2,4,6,8]\n3", expectedOutput: "20" },
        { input: "[7,10,9]\n2", expectedOutput: "22" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 2, 4) : ri(rng, 5, rng() < 0.85 ? 40 : 120);
        const hi = pick(rng, [4, 20, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        const x = pick(rng, [1, ri(rng, 1, 10), ri(rng, 1, hi), ri(rng, 1, 1000000)]);
        return { input: fmtIntArr(nums) + "\n" + x, expectedOutput: String(ref(nums, x)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxScore(nums: List[int], x: int) -> int:
              NEG = -10**18
              best = [NEG, NEG]
              best[nums[0] % 2] = nums[0]
              for v in nums[1:]:
                  p = v % 2
                  cand = max(best[p] + v, best[1 - p] + v - x)
                  if cand > best[p]:
                      best[p] = cand
              return max(best)
        `,
        javascript: code`
          var maxScore = function(nums, x) {
              var best = [-Infinity, -Infinity];
              best[nums[0] % 2] = nums[0];
              for (var j = 1; j < nums.length; j++) {
                  var v = nums[j], p = v % 2;
                  var cand = Math.max(best[p] + v, best[1 - p] + v - x);
                  if (cand > best[p]) best[p] = cand;
              }
              return Math.max(best[0], best[1]);
          };
        `,
        typescript: code`
          function maxScore(nums: number[], x: number): number {
              var NEG = -1e18;
              var best = [NEG, NEG];
              best[nums[0] % 2] = nums[0];
              for (var j = 1; j < nums.length; j++) {
                  var v = nums[j], p = v % 2;
                  var cand = Math.max(best[p] + v, best[1 - p] + v - x);
                  if (cand > best[p]) best[p] = cand;
              }
              return Math.max(best[0], best[1]);
          }
        `,
        java: code`
          public static int maxScore(int[] nums, int x) {
              final long NEG = Long.MIN_VALUE / 4;
              long[] best = {NEG, NEG};
              best[nums[0] % 2] = nums[0];
              for (int j = 1; j < nums.length; j++) {
                  int v = nums[j], p = v % 2;
                  long cand = Math.max(best[p] + v, best[1 - p] + v - x);
                  if (cand > best[p]) best[p] = cand;
              }
              return (int) Math.max(best[0], best[1]);
          }
        `,
        cpp: code`
          int maxScore(vector<int>& nums, int x) {
              const long long NEG = LLONG_MIN / 4;
              long long best[2] = {NEG, NEG};
              best[nums[0] % 2] = nums[0];
              for (size_t j = 1; j < nums.size(); j++) {
                  int v = nums[j], p = v % 2;
                  long long cand = max(best[p] + v, best[1 - p] + v - x);
                  if (cand > best[p]) best[p] = cand;
              }
              return (int) max(best[0], best[1]);
          }
        `,
        c: code`
          int maxScore(int* nums, int numsSize, int x) {
              const long long NEG = -1000000000000000000LL;
              long long best[2] = {NEG, NEG};
              best[nums[0] % 2] = nums[0];
              for (int j = 1; j < numsSize; j++) {
                  int v = nums[j], p = v % 2;
                  long long same = best[p] + v;
                  long long other = best[1 - p] + v - x;
                  long long cand = same > other ? same : other;
                  if (cand > best[p]) best[p] = cand;
              }
              return (int) (best[0] > best[1] ? best[0] : best[1]);
          }
        `,
        csharp: code`
          public static int MaxScore(int[] nums, int x)
          {
              const long NEG = long.MinValue / 4;
              long[] best = { NEG, NEG };
              best[nums[0] % 2] = nums[0];
              for (int j = 1; j < nums.Length; j++)
              {
                  int v = nums[j], p = v % 2;
                  long cand = Math.Max(best[p] + v, best[1 - p] + v - x);
                  if (cand > best[p]) best[p] = cand;
              }
              return (int)Math.Max(best[0], best[1]);
          }
        `,
        go: code`
          func maxScore(nums []int, x int) int {
          	const NEG = -(1 << 60)
          	best := []int{NEG, NEG}
          	best[nums[0]%2] = nums[0]
          	for j := 1; j < len(nums); j++ {
          		v := nums[j]
          		p := v % 2
          		cand := best[p] + v
          		if best[1-p]+v-x > cand {
          			cand = best[1-p] + v - x
          		}
          		if cand > best[p] {
          			best[p] = cand
          		}
          	}
          	if best[0] > best[1] {
          		return best[0]
          	}
          	return best[1]
          }
        `,
        kotlin: code`
          fun maxScore(nums: IntArray, x: Int): Int {
              val NEG = Long.MIN_VALUE / 4
              val best = longArrayOf(NEG, NEG)
              best[nums[0] % 2] = nums[0].toLong()
              for (j in 1 until nums.size) {
                  val v = nums[j]
                  val p = v % 2
                  val cand = maxOf(best[p] + v, best[1 - p] + v - x)
                  if (cand > best[p]) best[p] = cand
              }
              return maxOf(best[0], best[1]).toInt()
          }
        `,
        swift: code`
          func maxScore(_ nums: [Int], _ x: Int) -> Int {
              let NEG = Int.min / 4
              var best = [NEG, NEG]
              best[nums[0] % 2] = nums[0]
              for j in 1..<nums.count {
                  let v = nums[j]
                  let p = v % 2
                  let cand = max(best[p] + v, best[1 - p] + v - x)
                  if cand > best[p] { best[p] = cand }
              }
              return max(best[0], best[1])
          }
        `,
        rust: code`
          fn maxScore(nums: Vec<i32>, x: i32) -> i32 {
              let neg = std::i64::MIN / 4;
              let mut best = [neg, neg];
              best[(nums[0] % 2) as usize] = nums[0] as i64;
              for j in 1..nums.len() {
                  let v = nums[j] as i64;
                  let p = (nums[j] % 2) as usize;
                  let cand = (best[p] + v).max(best[1 - p] + v - x as i64);
                  if cand > best[p] {
                      best[p] = cand;
                  }
              }
              best[0].max(best[1]) as i32
          }
        `,
        php: code`
          function maxScore($nums, $x) {
              $NEG = intdiv(PHP_INT_MIN, 4);
              $best = [$NEG, $NEG];
              $best[$nums[0] % 2] = $nums[0];
              $n = count($nums);
              for ($j = 1; $j < $n; $j++) {
                  $v = $nums[$j];
                  $p = $v % 2;
                  $cand = max($best[$p] + $v, $best[1 - $p] + $v - $x);
                  if ($cand > $best[$p]) $best[$p] = $cand;
              }
              return max($best[0], $best[1]);
          }
        `,
        ruby: code`
          def maxScore(nums, x)
            neg = -(1 << 60)
            best = [neg, neg]
            best[nums[0] % 2] = nums[0]
            (1...nums.length).each do |j|
              v = nums[j]
              p = v % 2
              cand = [best[p] + v, best[1 - p] + v - x].max
              best[p] = cand if cand > best[p]
            end
            best.max
          end
        `,
      },
    };
  })(),

  // ── Minimum Swaps To Make Sequences Increasing (LC 801) ─────────
  (() => {
    const brute = (a: number[], b: number[]) => {
      const n = a.length;
      let best = Infinity;
      for (let mask = 0; mask < 1 << n; mask++) {
        let ok = true, prevA = -1, prevB = -1, cnt = 0;
        for (let i = 0; i < n && ok; i++) {
          const sw = (mask >> i) & 1;
          const x = sw ? b[i] : a[i], y = sw ? a[i] : b[i];
          cnt += sw;
          if (x <= prevA || y <= prevB) ok = false;
          prevA = x; prevB = y;
        }
        if (ok) best = Math.min(best, cnt);
      }
      return best;
    };
    const memoRef = (a: number[], b: number[]) => {
      // f(i, s) = fewest swaps for positions i.. given position i-1 is swapped (s = 1) or not
      const n = a.length;
      const memo = new Map<number, number>();
      const f = (i: number, s: number): number => {
        if (i === n) return 0;
        const key = i * 2 + s;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        const pa = i === 0 ? -1 : s ? b[i - 1] : a[i - 1];
        const pb = i === 0 ? -1 : s ? a[i - 1] : b[i - 1];
        let res = Infinity;
        if (a[i] > pa && b[i] > pb) res = Math.min(res, f(i + 1, 0));
        if (b[i] > pa && a[i] > pb) res = Math.min(res, 1 + f(i + 1, 1));
        memo.set(key, res);
        return res;
      };
      return f(0, 0);
    };
    return {
      slug: "minimum-swaps-to-make-sequences-increasing",
      title: "Minimum Swaps To Make Sequences Increasing",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Meta"],
      signature: {
        funcName: "minSwap",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two integer arrays `nums1` and `nums2` of the same length. In one operation you may swap `nums1[i]` with `nums2[i]` for some index `i`.\n\nReturn the minimum number of operations needed to make **both** arrays strictly increasing. The input is generated so that this is always possible.",
        [
          { in: "nums1 = [1,3,5,4], nums2 = [1,2,3,7]", out: "1", note: "Swap index 3: `[1,3,5,7]` and `[1,2,3,4]`." },
          { in: "nums1 = [1,6,3,8], nums2 = [5,2,7,4]", out: "2", note: "Swap indices 1 and 3 (or 0 and 2); no single swap works." },
          { in: "nums1 = [0,3,5,8,9], nums2 = [2,1,4,6,9]", out: "1" },
        ],
        ["2 <= nums1.length <= 10^5", "nums2.length == nums1.length", "0 <= nums1[i], nums2[i] <= 2 * 10^5", "A valid sequence of swaps always exists"]),
      hints: [
        "Whether index `i` can be swapped depends only on whether index `i - 1` was swapped.",
        "Track two numbers per index: the fewest swaps with index `i` kept as is (`keep`) and with index `i` swapped (`swap`).",
        "If both arrays already increase at `i` with the same orientation, `keep ← keep`, `swap ← swap + 1`; if they increase crosswise, `keep ← swap`, `swap ← keep + 1`. Take minima when both hold.",
      ],
      editorial: explain({
        idea: "Two-state DP over indices. Consider only adjacent pairs: the arrays are strictly increasing iff every adjacent pair is, and the pair `(i-1, i)` only cares whether each of the two indices was swapped.",
        steps: [
          "`keep = 0`, `swap = 1` for index 0.",
          "For `i >= 1`, start `nk = ns = ∞`.",
          "If `nums1[i-1] < nums1[i]` and `nums2[i-1] < nums2[i]`: same orientation works — `nk = min(nk, keep)`, `ns = min(ns, swap + 1)`.",
          "If `nums1[i-1] < nums2[i]` and `nums2[i-1] < nums1[i]`: crossed orientation works — `nk = min(nk, swap)`, `ns = min(ns, keep + 1)`.",
          "Set `keep = nk`, `swap = ns`; return `min(keep, swap)` at the end.",
        ],
        why: "The conditions listed are exactly the ways the pair `(i-1, i)` can be strictly increasing in both arrays given the swap state of each index. Since only the previous index's state constrains index `i`, the best cost for each state of `i` is determined by the best costs for the two states of `i - 1`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Both conditions can hold at once — consider both transitions, not `else if`.",
          "Swapping index 0 costs 1 even though nothing precedes it.",
          "The comparisons are strict: equal neighbours are not increasing.",
        ],
      }),
      examples: [
        { input: "[1,3,5,4]\n[1,2,3,7]", expectedOutput: "1" },
        { input: "[1,6,3,8]\n[5,2,7,4]", expectedOutput: "2" },
        { input: "[0,3,5,8,9]\n[2,1,4,6,9]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.75 ? ri(rng, 2, 10) : ri(rng, 11, 40);
        const step = pick(rng, [2, 3, 10, 4000]);
        const a: number[] = [], b: number[] = [];
        let x = ri(rng, 0, 5), y = ri(rng, 0, 5);
        for (let i = 0; i < n; i++) {
          x += ri(rng, 1, step);
          y += ri(rng, 1, step);
          a.push(x);
          b.push(y);
        }
        const p = pick(rng, [0, 0.2, 0.5]);
        for (let i = 0; i < n; i++) if (rng() < p) { const t = a[i]; a[i] = b[i]; b[i] = t; }
        const expected = n <= 10 ? brute(a, b) : memoRef(a, b);
        return { input: fmtIntArr(a) + "\n" + fmtIntArr(b), expectedOutput: String(expected) };
      },
      solutions: {
        python: code`
          from typing import List

          def minSwap(nums1: List[int], nums2: List[int]) -> int:
              INF = 10**9
              keep, swap = 0, 1
              for i in range(1, len(nums1)):
                  nk = ns = INF
                  if nums1[i - 1] < nums1[i] and nums2[i - 1] < nums2[i]:
                      nk = min(nk, keep)
                      ns = min(ns, swap + 1)
                  if nums1[i - 1] < nums2[i] and nums2[i - 1] < nums1[i]:
                      nk = min(nk, swap)
                      ns = min(ns, keep + 1)
                  keep, swap = nk, ns
              return min(keep, swap)
        `,
        javascript: code`
          var minSwap = function(nums1, nums2) {
              var INF = 1000000000;
              var keep = 0, swap = 1;
              for (var i = 1; i < nums1.length; i++) {
                  var nk = INF, ns = INF;
                  if (nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i]) {
                      nk = Math.min(nk, keep);
                      ns = Math.min(ns, swap + 1);
                  }
                  if (nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i]) {
                      nk = Math.min(nk, swap);
                      ns = Math.min(ns, keep + 1);
                  }
                  keep = nk;
                  swap = ns;
              }
              return Math.min(keep, swap);
          };
        `,
        typescript: code`
          function minSwap(nums1: number[], nums2: number[]): number {
              var INF = 1000000000;
              var keep = 0, swap = 1;
              for (var i = 1; i < nums1.length; i++) {
                  var nk = INF, ns = INF;
                  if (nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i]) {
                      nk = Math.min(nk, keep);
                      ns = Math.min(ns, swap + 1);
                  }
                  if (nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i]) {
                      nk = Math.min(nk, swap);
                      ns = Math.min(ns, keep + 1);
                  }
                  keep = nk;
                  swap = ns;
              }
              return Math.min(keep, swap);
          }
        `,
        java: code`
          public static int minSwap(int[] nums1, int[] nums2) {
              final int INF = 1000000000;
              int keep = 0, swap = 1;
              for (int i = 1; i < nums1.length; i++) {
                  int nk = INF, ns = INF;
                  if (nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i]) {
                      nk = Math.min(nk, keep);
                      ns = Math.min(ns, swap + 1);
                  }
                  if (nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i]) {
                      nk = Math.min(nk, swap);
                      ns = Math.min(ns, keep + 1);
                  }
                  keep = nk;
                  swap = ns;
              }
              return Math.min(keep, swap);
          }
        `,
        cpp: code`
          int minSwap(vector<int>& nums1, vector<int>& nums2) {
              const int INF = 1000000000;
              int keep = 0, swp = 1;
              for (size_t i = 1; i < nums1.size(); i++) {
                  int nk = INF, ns = INF;
                  if (nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i]) {
                      nk = min(nk, keep);
                      ns = min(ns, swp + 1);
                  }
                  if (nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i]) {
                      nk = min(nk, swp);
                      ns = min(ns, keep + 1);
                  }
                  keep = nk;
                  swp = ns;
              }
              return min(keep, swp);
          }
        `,
        c: code`
          int minSwap(int* nums1, int nums1Size, int* nums2, int nums2Size) {
              const int INF = 1000000000;
              int keep = 0, swp = 1;
              for (int i = 1; i < nums1Size; i++) {
                  int nk = INF, ns = INF;
                  if (nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i]) {
                      if (keep < nk) nk = keep;
                      if (swp + 1 < ns) ns = swp + 1;
                  }
                  if (nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i]) {
                      if (swp < nk) nk = swp;
                      if (keep + 1 < ns) ns = keep + 1;
                  }
                  keep = nk;
                  swp = ns;
              }
              return keep < swp ? keep : swp;
          }
        `,
        csharp: code`
          public static int MinSwap(int[] nums1, int[] nums2)
          {
              const int INF = 1000000000;
              int keep = 0, swap = 1;
              for (int i = 1; i < nums1.Length; i++)
              {
                  int nk = INF, ns = INF;
                  if (nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i])
                  {
                      nk = Math.Min(nk, keep);
                      ns = Math.Min(ns, swap + 1);
                  }
                  if (nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i])
                  {
                      nk = Math.Min(nk, swap);
                      ns = Math.Min(ns, keep + 1);
                  }
                  keep = nk;
                  swap = ns;
              }
              return Math.Min(keep, swap);
          }
        `,
        go: code`
          func minSwap(nums1 []int, nums2 []int) int {
          	const INF = 1000000000
          	keep, swp := 0, 1
          	for i := 1; i < len(nums1); i++ {
          		nk, ns := INF, INF
          		if nums1[i-1] < nums1[i] && nums2[i-1] < nums2[i] {
          			if keep < nk {
          				nk = keep
          			}
          			if swp+1 < ns {
          				ns = swp + 1
          			}
          		}
          		if nums1[i-1] < nums2[i] && nums2[i-1] < nums1[i] {
          			if swp < nk {
          				nk = swp
          			}
          			if keep+1 < ns {
          				ns = keep + 1
          			}
          		}
          		keep, swp = nk, ns
          	}
          	if keep < swp {
          		return keep
          	}
          	return swp
          }
        `,
        kotlin: code`
          fun minSwap(nums1: IntArray, nums2: IntArray): Int {
              val INF = 1000000000
              var keep = 0
              var swp = 1
              for (i in 1 until nums1.size) {
                  var nk = INF
                  var ns = INF
                  if (nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i]) {
                      nk = minOf(nk, keep)
                      ns = minOf(ns, swp + 1)
                  }
                  if (nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i]) {
                      nk = minOf(nk, swp)
                      ns = minOf(ns, keep + 1)
                  }
                  keep = nk
                  swp = ns
              }
              return minOf(keep, swp)
          }
        `,
        swift: code`
          func minSwap(_ nums1: [Int], _ nums2: [Int]) -> Int {
              let INF = 1000000000
              var keep = 0
              var swp = 1
              for i in 1..<nums1.count {
                  var nk = INF
                  var ns = INF
                  if nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i] {
                      nk = min(nk, keep)
                      ns = min(ns, swp + 1)
                  }
                  if nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i] {
                      nk = min(nk, swp)
                      ns = min(ns, keep + 1)
                  }
                  keep = nk
                  swp = ns
              }
              return min(keep, swp)
          }
        `,
        rust: code`
          fn minSwap(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {
              let inf = 1000000000;
              let mut keep = 0;
              let mut swp = 1;
              for i in 1..nums1.len() {
                  let mut nk = inf;
                  let mut ns = inf;
                  if nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i] {
                      nk = nk.min(keep);
                      ns = ns.min(swp + 1);
                  }
                  if nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i] {
                      nk = nk.min(swp);
                      ns = ns.min(keep + 1);
                  }
                  keep = nk;
                  swp = ns;
              }
              keep.min(swp)
          }
        `,
        php: code`
          function minSwap($nums1, $nums2) {
              $INF = 1000000000;
              $keep = 0;
              $swp = 1;
              $n = count($nums1);
              for ($i = 1; $i < $n; $i++) {
                  $nk = $INF;
                  $ns = $INF;
                  if ($nums1[$i - 1] < $nums1[$i] && $nums2[$i - 1] < $nums2[$i]) {
                      $nk = min($nk, $keep);
                      $ns = min($ns, $swp + 1);
                  }
                  if ($nums1[$i - 1] < $nums2[$i] && $nums2[$i - 1] < $nums1[$i]) {
                      $nk = min($nk, $swp);
                      $ns = min($ns, $keep + 1);
                  }
                  $keep = $nk;
                  $swp = $ns;
              }
              return min($keep, $swp);
          }
        `,
        ruby: code`
          def minSwap(nums1, nums2)
            inf = 1_000_000_000
            keep = 0
            swp = 1
            (1...nums1.length).each do |i|
              nk = inf
              ns = inf
              if nums1[i - 1] < nums1[i] && nums2[i - 1] < nums2[i]
                nk = [nk, keep].min
                ns = [ns, swp + 1].min
              end
              if nums1[i - 1] < nums2[i] && nums2[i - 1] < nums1[i]
                nk = [nk, swp].min
                ns = [ns, keep + 1].min
              end
              keep = nk
              swp = ns
            end
            [keep, swp].min
          end
        `,
      },
    };
  })(),

];
