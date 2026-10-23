/**
 * Dynamic programming, wave 7 — batch 02: twenty company-asked LeetCode
 * problems (LC 1595–2770), every one in all 13 languages. Worked examples are
 * phrased for CodeKairo; statements are written fresh.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 * TypeScript solutions compile against the ES5 library, so they keep to plain
 * arrays and object maps (no Array.prototype.fill, Map or Set).
 *
 * int32 rule: every input and answer fits a signed 32-bit int. Where the
 * original's answer is a 64-bit value (Minimum Total Distance Traveled, Count
 * Increasing Quadruplets) the stated constraints are narrowed so it provably
 * cannot exceed 2^31 - 1, and the statement says so; Count of Integers and
 * First Day Where You Have Been in All the Rooms keep their own mod 1e9+7.
 *
 * References: each `ref` is the plain, obviously-correct version — a brute
 * force over subsets/paths/partitions where the hidden sizes allow it, and a
 * direct memoised recursion of the defining recurrence where they do not —
 * while the authored solutions carry the intended algorithm.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const DP9_PROBLEMS: CatalogProblem[] = [

  // ── Minimum Cost to Connect Two Groups of Points (LC 1595) ──────
  (() => {
    // f(i, covered): rows i.. still to place, `covered` = group-2 points
    // already touched; each row takes exactly one edge, and whatever group-2
    // points are left at the end take their cheapest edge.
    const ref = (cost: number[][]) => {
      const n1 = cost.length, n2 = cost[0].length;
      const minCol = Array.from({ length: n2 }, (_, j) => Math.min(...cost.map((r) => r[j])));
      const memo = new Map<number, number>();
      const f = (i: number, mask: number): number => {
        if (i === n1) {
          let s = 0;
          for (let j = 0; j < n2; j++) if (!(mask & (1 << j))) s += minCol[j];
          return s;
        }
        const key = i * 4096 + mask;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = Infinity;
        for (let j = 0; j < n2; j++) best = Math.min(best, cost[i][j] + f(i + 1, mask | (1 << j)));
        memo.set(key, best);
        return best;
      };
      return f(0, 0);
    };
    return {
      slug: "minimum-cost-to-connect-two-groups-of-points",
      title: "Minimum Cost to Connect Two Groups of Points",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Matrix", "Bitmask", "Google", "Amazon"],
      signature: { funcName: "connectTwoGroups", params: [{ name: "cost", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are two groups of points: the first holds `size1` points and the second `size2` points, with `size1 >= size2`. The grid `cost` has `size1` rows and `size2` columns, and `cost[i][j]` is the price of drawing a link between point `i` of the first group and point `j` of the second.\n\nThe groups are **connected** when every point of the first group is linked to at least one point of the second group, **and** every point of the second group is linked to at least one point of the first. You may draw any number of links.\n\nReturn the minimum total price of a set of links that connects the two groups.",
        [
          { in: "cost = [[15,96],[36,2]]", out: "17", note: "Link 1–A for 15 and 2–B for 2: every point is touched, total 17." },
          { in: "cost = [[1,3,5],[4,1,1],[1,5,3]]", out: "4", note: "Links 1–A (1), 2–B (1), 2–C (1) and 3–A (1) touch every point for a total of 4." },
          { in: "cost = [[2,5,1],[3,4,7],[8,1,2],[6,2,4],[3,8,8]]", out: "10" },
        ],
        ["size1 == cost.length", "size2 == cost[i].length", "1 <= size1, size2 <= 12", "size1 >= size2", "0 <= cost[i][j] <= 100"]),
      hints: [
        "A point of the first group never needs two links: if it had a second one, that link only exists to cover some point of the second group, and that point could use its own cheapest link instead.",
        "So walk the first group row by row, give each row exactly one link, and remember which second-group points are already covered — at most `2^12` sets.",
        "After the last row, every second-group point still uncovered is paid for with its cheapest link from any first-group point. Take the best total over all covered-sets.",
      ],
      editorial: explain({
        idea: "Split the links into two kinds: one chosen link per first-group point, and one cheapest link for every second-group point the first kind left uncovered. A DP over first-group rows with a bitmask of covered second-group points prices the first kind; the second kind is a fixed per-column minimum.",
        steps: [
          "Precompute `minCol[j]`, the cheapest link into second-group point `j`.",
          "Let `dp[mask]` be the cheapest way to give one link to each of the rows handled so far with exactly `mask` covered; start with `dp[0] = 0`.",
          "For each row `i`, build a new table: from every reachable `mask` and every column `j`, relax `new[mask | 1<<j]` with `dp[mask] + cost[i][j]`.",
          "At the end, the answer is the minimum over `mask` of `dp[mask]` plus `minCol[j]` for every `j` not in `mask`.",
        ],
        why: "Take any optimal link set. Every first-group point keeps at least one link; mark one of them per point as its chosen link. Any other link `(i, j)` exists only to cover `j`, and is never cheaper than `minCol[j]`, so swapping all such links for the cheapest ones (at most one per uncovered column) keeps the groups connected and never raises the price. The DP enumerates exactly every way to choose one link per row and then pays the cheapest completion, so it reaches that optimum.",
        time: "O(size1 * 2^size2 * size2)",
        space: "O(2^size2)",
        pitfalls: [
          "Covering a second-group point once is enough — paying `minCol[j]` for columns already in the mask would double-count.",
          "A row may link to a column that is already covered; the transition must allow `mask | 1<<j == mask`.",
          "Costs can be `0`, so do not use `0` as an \"unreached\" marker.",
        ],
      }),
      examples: [
        { input: "[[15,96],[36,2]]", expectedOutput: "17" },
        { input: "[[1,3,5],[4,1,1],[1,5,3]]", expectedOutput: "4" },
        { input: "[[2,5,1],[3,4,7],[8,1,2],[6,2,4],[3,8,8]]", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const n1 = ri(rng, 1, pick(rng, [1, 3, 5, 7]));
        const n2 = ri(rng, 1, n1);
        const top = pick(rng, [0, 1, 5, 100]);
        const cost = Array.from({ length: n1 }, () => Array.from({ length: n2 }, () => ri(rng, 0, top)));
        return { input: fmtIntMat(cost), expectedOutput: String(ref(cost)) };
      },
      solutions: {
        python: code`
          from typing import List

          def connectTwoGroups(cost: List[List[int]]) -> int:
              n1, n2 = len(cost), len(cost[0])
              full = 1 << n2
              INF = float('inf')
              min_col = [min(cost[i][j] for i in range(n1)) for j in range(n2)]
              dp = [INF] * full
              dp[0] = 0
              for i in range(n1):
                  nd = [INF] * full
                  row = cost[i]
                  for mask in range(full):
                      base = dp[mask]
                      if base == INF:
                          continue
                      for j in range(n2):
                          nm = mask | (1 << j)
                          v = base + row[j]
                          if v < nd[nm]:
                              nd[nm] = v
                  dp = nd
              best = INF
              for mask in range(full):
                  if dp[mask] == INF:
                      continue
                  total = dp[mask] + sum(min_col[j] for j in range(n2) if not (mask >> j) & 1)
                  best = min(best, total)
              return best
        `,
        javascript: code`
          var connectTwoGroups = function(cost) {
              var n1 = cost.length, n2 = cost[0].length, full = 1 << n2, INF = 1000000000;
              var minCol = [];
              for (var j = 0; j < n2; j++) {
                  var m = INF;
                  for (var i = 0; i < n1; i++) if (cost[i][j] < m) m = cost[i][j];
                  minCol.push(m);
              }
              var dp = new Array(full).fill(INF);
              dp[0] = 0;
              for (var i = 0; i < n1; i++) {
                  var nd = new Array(full).fill(INF);
                  for (var mask = 0; mask < full; mask++) {
                      if (dp[mask] === INF) continue;
                      for (var j = 0; j < n2; j++) {
                          var nm = mask | (1 << j), v = dp[mask] + cost[i][j];
                          if (v < nd[nm]) nd[nm] = v;
                      }
                  }
                  dp = nd;
              }
              var best = INF;
              for (var mask = 0; mask < full; mask++) {
                  if (dp[mask] === INF) continue;
                  var total = dp[mask];
                  for (var j = 0; j < n2; j++) if (((mask >> j) & 1) === 0) total += minCol[j];
                  if (total < best) best = total;
              }
              return best;
          };
        `,
        typescript: code`
          function connectTwoGroups(cost: number[][]): number {
              var n1 = cost.length, n2 = cost[0].length, full = 1 << n2, INF = 1000000000;
              var minCol: number[] = [];
              for (var j = 0; j < n2; j++) {
                  var m = INF;
                  for (var i = 0; i < n1; i++) if (cost[i][j] < m) m = cost[i][j];
                  minCol.push(m);
              }
              var dp: number[] = [];
              for (var s = 0; s < full; s++) dp.push(INF);
              dp[0] = 0;
              for (var i = 0; i < n1; i++) {
                  var nd: number[] = [];
                  for (var s = 0; s < full; s++) nd.push(INF);
                  for (var mask = 0; mask < full; mask++) {
                      if (dp[mask] === INF) continue;
                      for (var j = 0; j < n2; j++) {
                          var nm = mask | (1 << j), v = dp[mask] + cost[i][j];
                          if (v < nd[nm]) nd[nm] = v;
                      }
                  }
                  dp = nd;
              }
              var best = INF;
              for (var mask = 0; mask < full; mask++) {
                  if (dp[mask] === INF) continue;
                  var total = dp[mask];
                  for (var j = 0; j < n2; j++) if (((mask >> j) & 1) === 0) total += minCol[j];
                  if (total < best) best = total;
              }
              return best;
          }
        `,
        java: code`
          public static int connectTwoGroups(int[][] cost) {
              int n1 = cost.length, n2 = cost[0].length, full = 1 << n2;
              final int INF = Integer.MAX_VALUE / 2;
              int[] minCol = new int[n2];
              Arrays.fill(minCol, INF);
              for (int i = 0; i < n1; i++) for (int j = 0; j < n2; j++) minCol[j] = Math.min(minCol[j], cost[i][j]);
              int[] dp = new int[full];
              Arrays.fill(dp, INF);
              dp[0] = 0;
              for (int i = 0; i < n1; i++) {
                  int[] nd = new int[full];
                  Arrays.fill(nd, INF);
                  for (int mask = 0; mask < full; mask++) {
                      if (dp[mask] == INF) continue;
                      for (int j = 0; j < n2; j++) {
                          int nm = mask | (1 << j);
                          nd[nm] = Math.min(nd[nm], dp[mask] + cost[i][j]);
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int total = dp[mask];
                  for (int j = 0; j < n2; j++) if ((mask & (1 << j)) == 0) total += minCol[j];
                  best = Math.min(best, total);
              }
              return best;
          }
        `,
        cpp: code`
          int connectTwoGroups(vector<vector<int>>& cost) {
              int n1 = cost.size(), n2 = cost[0].size(), full = 1 << n2;
              const int INF = INT_MAX / 2;
              vector<int> minCol(n2, INF);
              for (int i = 0; i < n1; i++) for (int j = 0; j < n2; j++) minCol[j] = min(minCol[j], cost[i][j]);
              vector<int> dp(full, INF);
              dp[0] = 0;
              for (int i = 0; i < n1; i++) {
                  vector<int> nd(full, INF);
                  for (int mask = 0; mask < full; mask++) {
                      if (dp[mask] == INF) continue;
                      for (int j = 0; j < n2; j++) {
                          int nm = mask | (1 << j);
                          nd[nm] = min(nd[nm], dp[mask] + cost[i][j]);
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int total = dp[mask];
                  for (int j = 0; j < n2; j++) if (!(mask & (1 << j))) total += minCol[j];
                  best = min(best, total);
              }
              return best;
          }
        `,
        c: code`
          int connectTwoGroups(int** cost, int costSize, int* costColSize) {
              int n1 = costSize, n2 = costColSize[0], full = 1 << n2;
              const int INF = 1000000000;
              int minCol[12];
              for (int j = 0; j < n2; j++) {
                  minCol[j] = INF;
                  for (int i = 0; i < n1; i++) if (cost[i][j] < minCol[j]) minCol[j] = cost[i][j];
              }
              int* dp = (int*)malloc(sizeof(int) * full);
              int* nd = (int*)malloc(sizeof(int) * full);
              for (int m = 0; m < full; m++) dp[m] = INF;
              dp[0] = 0;
              for (int i = 0; i < n1; i++) {
                  for (int m = 0; m < full; m++) nd[m] = INF;
                  for (int mask = 0; mask < full; mask++) {
                      if (dp[mask] == INF) continue;
                      for (int j = 0; j < n2; j++) {
                          int nm = mask | (1 << j), v = dp[mask] + cost[i][j];
                          if (v < nd[nm]) nd[nm] = v;
                      }
                  }
                  int* t = dp; dp = nd; nd = t;
              }
              int best = INF;
              for (int mask = 0; mask < full; mask++) {
                  if (dp[mask] == INF) continue;
                  int total = dp[mask];
                  for (int j = 0; j < n2; j++) if (!(mask & (1 << j))) total += minCol[j];
                  if (total < best) best = total;
              }
              free(dp);
              free(nd);
              return best;
          }
        `,
        csharp: code`
          public static int ConnectTwoGroups(int[][] cost)
          {
              int n1 = cost.Length, n2 = cost[0].Length, full = 1 << n2;
              const int INF = int.MaxValue / 2;
              int[] minCol = new int[n2];
              for (int j = 0; j < n2; j++)
              {
                  minCol[j] = INF;
                  for (int i = 0; i < n1; i++) minCol[j] = Math.Min(minCol[j], cost[i][j]);
              }
              int[] dp = new int[full];
              for (int m = 0; m < full; m++) dp[m] = INF;
              dp[0] = 0;
              for (int i = 0; i < n1; i++)
              {
                  int[] nd = new int[full];
                  for (int m = 0; m < full; m++) nd[m] = INF;
                  for (int mask = 0; mask < full; mask++)
                  {
                      if (dp[mask] == INF) continue;
                      for (int j = 0; j < n2; j++)
                      {
                          int nm = mask | (1 << j);
                          nd[nm] = Math.Min(nd[nm], dp[mask] + cost[i][j]);
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (int mask = 0; mask < full; mask++)
              {
                  if (dp[mask] == INF) continue;
                  int total = dp[mask];
                  for (int j = 0; j < n2; j++) if ((mask & (1 << j)) == 0) total += minCol[j];
                  best = Math.Min(best, total);
              }
              return best;
          }
        `,
        go: code`
          func connectTwoGroups(cost [][]int) int {
              n1, n2 := len(cost), len(cost[0])
              full := 1 << uint(n2)
              const INF = 1 << 30
              minCol := make([]int, n2)
              for j := 0; j < n2; j++ {
                  minCol[j] = INF
                  for i := 0; i < n1; i++ {
                      if cost[i][j] < minCol[j] {
                          minCol[j] = cost[i][j]
                      }
                  }
              }
              dp := make([]int, full)
              for m := range dp {
                  dp[m] = INF
              }
              dp[0] = 0
              for i := 0; i < n1; i++ {
                  nd := make([]int, full)
                  for m := range nd {
                      nd[m] = INF
                  }
                  for mask := 0; mask < full; mask++ {
                      if dp[mask] == INF {
                          continue
                      }
                      for j := 0; j < n2; j++ {
                          nm := mask | (1 << uint(j))
                          if v := dp[mask] + cost[i][j]; v < nd[nm] {
                              nd[nm] = v
                          }
                      }
                  }
                  dp = nd
              }
              best := INF
              for mask := 0; mask < full; mask++ {
                  if dp[mask] == INF {
                      continue
                  }
                  total := dp[mask]
                  for j := 0; j < n2; j++ {
                      if mask&(1<<uint(j)) == 0 {
                          total += minCol[j]
                      }
                  }
                  if total < best {
                      best = total
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun connectTwoGroups(cost: Array<IntArray>): Int {
              val n1 = cost.size
              val n2 = cost[0].size
              val full = 1 shl n2
              val inf = Int.MAX_VALUE / 2
              val minCol = IntArray(n2) { inf }
              for (i in 0 until n1) for (j in 0 until n2) minCol[j] = minOf(minCol[j], cost[i][j])
              var dp = IntArray(full) { inf }
              dp[0] = 0
              for (i in 0 until n1) {
                  val nd = IntArray(full) { inf }
                  for (mask in 0 until full) {
                      if (dp[mask] == inf) continue
                      for (j in 0 until n2) {
                          val nm = mask or (1 shl j)
                          nd[nm] = minOf(nd[nm], dp[mask] + cost[i][j])
                      }
                  }
                  dp = nd
              }
              var best = inf
              for (mask in 0 until full) {
                  if (dp[mask] == inf) continue
                  var total = dp[mask]
                  for (j in 0 until n2) if (mask and (1 shl j) == 0) total += minCol[j]
                  best = minOf(best, total)
              }
              return best
          }
        `,
        swift: code`
          func connectTwoGroups(_ cost: [[Int]]) -> Int {
              let n1 = cost.count, n2 = cost[0].count, full = 1 << n2
              let inf = Int.max / 2
              var minCol = [Int](repeating: inf, count: n2)
              for i in 0..<n1 { for j in 0..<n2 { minCol[j] = min(minCol[j], cost[i][j]) } }
              var dp = [Int](repeating: inf, count: full)
              dp[0] = 0
              for i in 0..<n1 {
                  var nd = [Int](repeating: inf, count: full)
                  for mask in 0..<full {
                      if dp[mask] == inf { continue }
                      for j in 0..<n2 {
                          let nm = mask | (1 << j)
                          nd[nm] = min(nd[nm], dp[mask] + cost[i][j])
                      }
                  }
                  dp = nd
              }
              var best = inf
              for mask in 0..<full {
                  if dp[mask] == inf { continue }
                  var total = dp[mask]
                  for j in 0..<n2 where mask & (1 << j) == 0 { total += minCol[j] }
                  best = min(best, total)
              }
              return best
          }
        `,
        rust: code`
          fn connectTwoGroups(cost: Vec<Vec<i32>>) -> i32 {
              let n1 = cost.len();
              let n2 = cost[0].len();
              let full = 1usize << n2;
              let inf = std::i32::MAX / 2;
              let mut min_col = vec![inf; n2];
              for row in cost.iter() {
                  for j in 0..n2 {
                      min_col[j] = min_col[j].min(row[j]);
                  }
              }
              let mut dp = vec![inf; full];
              dp[0] = 0;
              for i in 0..n1 {
                  let mut nd = vec![inf; full];
                  for mask in 0..full {
                      if dp[mask] == inf {
                          continue;
                      }
                      for j in 0..n2 {
                          let nm = mask | (1 << j);
                          nd[nm] = nd[nm].min(dp[mask] + cost[i][j]);
                      }
                  }
                  dp = nd;
              }
              let mut best = inf;
              for mask in 0..full {
                  if dp[mask] == inf {
                      continue;
                  }
                  let mut total = dp[mask];
                  for j in 0..n2 {
                      if mask & (1 << j) == 0 {
                          total += min_col[j];
                      }
                  }
                  best = best.min(total);
              }
              best
          }
        `,
        php: code`
          function connectTwoGroups($cost) {
              $n1 = count($cost);
              $n2 = count($cost[0]);
              $full = 1 << $n2;
              $INF = 1000000000;
              $minCol = array_fill(0, $n2, $INF);
              for ($i = 0; $i < $n1; $i++) for ($j = 0; $j < $n2; $j++) $minCol[$j] = min($minCol[$j], $cost[$i][$j]);
              $dp = array_fill(0, $full, $INF);
              $dp[0] = 0;
              for ($i = 0; $i < $n1; $i++) {
                  $nd = array_fill(0, $full, $INF);
                  $row = $cost[$i];
                  for ($mask = 0; $mask < $full; $mask++) {
                      $base = $dp[$mask];
                      if ($base == $INF) continue;
                      for ($j = 0; $j < $n2; $j++) {
                          $nm = $mask | (1 << $j);
                          $v = $base + $row[$j];
                          if ($v < $nd[$nm]) $nd[$nm] = $v;
                      }
                  }
                  $dp = $nd;
              }
              $best = $INF;
              for ($mask = 0; $mask < $full; $mask++) {
                  if ($dp[$mask] == $INF) continue;
                  $total = $dp[$mask];
                  for ($j = 0; $j < $n2; $j++) if (($mask & (1 << $j)) == 0) $total += $minCol[$j];
                  if ($total < $best) $best = $total;
              }
              return $best;
          }
        `,
        ruby: code`
          def connectTwoGroups(cost)
            n1 = cost.length
            n2 = cost[0].length
            full = 1 << n2
            inf = 1_000_000_000
            min_col = (0...n2).map { |j| (0...n1).map { |i| cost[i][j] }.min }
            dp = Array.new(full, inf)
            dp[0] = 0
            cost.each do |row|
              nd = Array.new(full, inf)
              full.times do |mask|
                base = dp[mask]
                next if base == inf
                n2.times do |j|
                  nm = mask | (1 << j)
                  v = base + row[j]
                  nd[nm] = v if v < nd[nm]
                end
              end
              dp = nd
            end
            best = inf
            full.times do |mask|
              next if dp[mask] == inf
              total = dp[mask]
              n2.times { |j| total += min_col[j] if mask[j] == 0 }
              best = total if total < best
            end
            best
          end
        `,
      },
    };
  })(),


  // ── Best Team With No Conflicts (LC 1626) ───────────────────────
  (() => {
    // Small teams: every subset, checked pair by pair. Larger: the sorted
    // longest-non-decreasing-chain DP (a chain in (age, score) order is
    // exactly a conflict-free team).
    const ref = (scores: number[], ages: number[]) => {
      const n = scores.length;
      if (n <= 10) {
        let best = 0;
        for (let mask = 1; mask < 1 << n; mask++) {
          let ok = true, sum = 0;
          for (let a = 0; a < n && ok; a++) {
            if (!(mask & (1 << a))) continue;
            sum += scores[a];
            for (let b = 0; b < n; b++) {
              if ((mask & (1 << b)) && ages[a] < ages[b] && scores[a] > scores[b]) { ok = false; break; }
            }
          }
          if (ok && sum > best) best = sum;
        }
        return best;
      }
      const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => ages[a] - ages[b] || scores[a] - scores[b]);
      const dp: number[] = [];
      for (let i = 0; i < n; i++) {
        let top = 0;
        for (let j = 0; j < i; j++) if (scores[order[j]] <= scores[order[i]]) top = Math.max(top, dp[j]);
        dp.push(top + scores[order[i]]);
      }
      return Math.max(...dp);
    };
    return {
      slug: "best-team-with-no-conflicts",
      title: "Best Team With No Conflicts",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Sorting", "Amazon", "Google"],
      signature: { funcName: "bestTeamScore", params: [{ name: "scores", type: "int[]" as const }, { name: "ages", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A coach is picking a team for a CodeKairo tournament. Player `i` has a rating `scores[i]` and an age `ages[i]`; the team's score is the **sum** of its players' scores.\n\nThe team must have no **conflict**: a conflict happens when a younger player has a **strictly higher** score than an older player. Two players of the same age never conflict.\n\nReturn the highest team score the coach can reach.",
        [
          { in: "scores = [1,3,5,10,15], ages = [1,2,3,4,5]", out: "34", note: "Scores rise with age, so everyone can play together." },
          { in: "scores = [4,5,6,5], ages = [2,1,2,1]", out: "16", note: "Take the last three players: the two 1-year-olds score 5 and 5, and the 2-year-old scores 6. The first player (age 2, score 4) would conflict with the younger players scoring 5." },
          { in: "scores = [1,2,3,5], ages = [8,9,10,1]", out: "6", note: "The youngest player (score 5) conflicts with every older player, so take the first three: 1 + 2 + 3 = 6." },
        ],
        ["1 <= scores.length, ages.length <= 1000", "scores.length == ages.length", "1 <= scores[i] <= 10^6", "1 <= ages[i] <= 1000"]),
      hints: [
        "Sort the players by age, breaking ties by score. In that order, when is a set of players conflict-free?",
        "After sorting, a team is valid exactly when its scores never go down from one chosen player to the next.",
        "So the answer is a maximum-sum non-decreasing subsequence of the sorted scores: `dp[i] = scores[i] + max(dp[j])` over earlier `j` with `scores[j] <= scores[i]`.",
      ],
      editorial: explain({
        idea: "Sorting by `(age, score)` turns the pairwise conflict rule into a chain condition: a team is valid if and only if its scores are non-decreasing in that order. The best team is then a maximum-sum non-decreasing subsequence.",
        steps: [
          "Sort the players by age, and by score among players of the same age.",
          "For each player `i` in that order, set `dp[i]` to its score plus the largest `dp[j]` over earlier players `j` whose score is at most `scores[i]` (or plus 0 if none).",
          "Return the largest `dp[i]`.",
        ],
        why: "Two chosen players in sorted order either share an age (no conflict, and the tie-break puts the lower score first) or the earlier one is younger, in which case a conflict means exactly that its score is higher. So a set is conflict-free iff its scores never decrease along the sorted order, and the DP enumerates every such chain ending at each player.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "Ties in age must be broken by score: sorting by age alone can put a higher score first and wrongly forbid two same-aged players together.",
          "The comparison is `<=`, not `<` — equal scores never conflict.",
          "The answer is the maximum over all `dp[i]`, not `dp[n - 1]`.",
        ],
      }),
      examples: [
        { input: "[1,3,5,10,15]\n[1,2,3,4,5]", expectedOutput: "34" },
        { input: "[4,5,6,5]\n[2,1,2,1]", expectedOutput: "16" },
        { input: "[1,2,3,5]\n[8,9,10,1]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 10, 40]));
        const topAge = pick(rng, [1, 3, 10, 1000]);
        const topScore = pick(rng, [1, 5, 50, 1000000]);
        const scores = Array.from({ length: n }, () => ri(rng, 1, topScore));
        const ages = Array.from({ length: n }, () => ri(rng, 1, topAge));
        return { input: `${fmtIntArr(scores)}\n${fmtIntArr(ages)}`, expectedOutput: String(ref(scores, ages)) };
      },
      solutions: {
        python: code`
          from typing import List

          def bestTeamScore(scores: List[int], ages: List[int]) -> int:
              players = sorted(zip(ages, scores))
              dp = []
              best = 0
              for i, (_, s) in enumerate(players):
                  top = 0
                  for j in range(i):
                      if players[j][1] <= s and dp[j] > top:
                          top = dp[j]
                  dp.append(top + s)
                  best = max(best, top + s)
              return best
        `,
        javascript: code`
          var bestTeamScore = function(scores, ages) {
              var n = scores.length, order = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(a, b) { return ages[a] !== ages[b] ? ages[a] - ages[b] : scores[a] - scores[b]; });
              var dp = [], best = 0;
              for (var i = 0; i < n; i++) {
                  var s = scores[order[i]], top = 0;
                  for (var j = 0; j < i; j++) if (scores[order[j]] <= s && dp[j] > top) top = dp[j];
                  dp.push(top + s);
                  if (top + s > best) best = top + s;
              }
              return best;
          };
        `,
        typescript: code`
          function bestTeamScore(scores: number[], ages: number[]): number {
              var n = scores.length, order: number[] = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(a, b) { return ages[a] !== ages[b] ? ages[a] - ages[b] : scores[a] - scores[b]; });
              var dp: number[] = [], best = 0;
              for (var i = 0; i < n; i++) {
                  var s = scores[order[i]], top = 0;
                  for (var j = 0; j < i; j++) if (scores[order[j]] <= s && dp[j] > top) top = dp[j];
                  dp.push(top + s);
                  if (top + s > best) best = top + s;
              }
              return best;
          }
        `,
        java: code`
          public static int bestTeamScore(int[] scores, int[] ages) {
              int n = scores.length;
              Integer[] order = new Integer[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Arrays.sort(order, (a, b) -> ages[a] != ages[b] ? ages[a] - ages[b] : scores[a] - scores[b]);
              int[] dp = new int[n];
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int s = scores[order[i]], top = 0;
                  for (int j = 0; j < i; j++) if (scores[order[j]] <= s && dp[j] > top) top = dp[j];
                  dp[i] = top + s;
                  best = Math.max(best, dp[i]);
              }
              return best;
          }
        `,
        cpp: code`
          int bestTeamScore(vector<int>& scores, vector<int>& ages) {
              int n = scores.size();
              vector<pair<int, int>> players(n);
              for (int i = 0; i < n; i++) players[i] = {ages[i], scores[i]};
              sort(players.begin(), players.end());
              vector<int> dp(n, 0);
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int s = players[i].second, top = 0;
                  for (int j = 0; j < i; j++) if (players[j].second <= s && dp[j] > top) top = dp[j];
                  dp[i] = top + s;
                  best = max(best, dp[i]);
              }
              return best;
          }
        `,
        c: code`
          static int cmpLL(const void* a, const void* b) {
              long long x = *(const long long*)a, y = *(const long long*)b;
              return x < y ? -1 : (x > y ? 1 : 0);
          }

          int bestTeamScore(int* scores, int scoresSize, int* ages, int agesSize) {
              int n = scoresSize;
              // Pack (age, score) into one key: scores stay below 2,000,000.
              long long* key = (long long*)malloc(sizeof(long long) * n);
              for (int i = 0; i < n; i++) key[i] = (long long)ages[i] * 2000000LL + scores[i];
              qsort(key, n, sizeof(long long), cmpLL);
              int* dp = (int*)malloc(sizeof(int) * n);
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int s = (int)(key[i] % 2000000LL), top = 0;
                  for (int j = 0; j < i; j++) {
                      int sj = (int)(key[j] % 2000000LL);
                      if (sj <= s && dp[j] > top) top = dp[j];
                  }
                  dp[i] = top + s;
                  if (dp[i] > best) best = dp[i];
              }
              free(key);
              free(dp);
              return best;
          }
        `,
        csharp: code`
          public static int BestTeamScore(int[] scores, int[] ages)
          {
              int n = scores.Length;
              int[] order = new int[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Array.Sort(order, (a, b) => ages[a] != ages[b] ? ages[a].CompareTo(ages[b]) : scores[a].CompareTo(scores[b]));
              int[] dp = new int[n];
              int best = 0;
              for (int i = 0; i < n; i++)
              {
                  int s = scores[order[i]], top = 0;
                  for (int j = 0; j < i; j++) if (scores[order[j]] <= s && dp[j] > top) top = dp[j];
                  dp[i] = top + s;
                  best = Math.Max(best, dp[i]);
              }
              return best;
          }
        `,
        go: code`
          func bestTeamScore(scores []int, ages []int) int {
              n := len(scores)
              order := make([]int, n)
              for i := range order {
                  order[i] = i
              }
              sort.Slice(order, func(a, b int) bool {
                  x, y := order[a], order[b]
                  if ages[x] != ages[y] {
                      return ages[x] < ages[y]
                  }
                  return scores[x] < scores[y]
              })
              dp := make([]int, n)
              best := 0
              for i := 0; i < n; i++ {
                  s, top := scores[order[i]], 0
                  for j := 0; j < i; j++ {
                      if scores[order[j]] <= s && dp[j] > top {
                          top = dp[j]
                      }
                  }
                  dp[i] = top + s
                  if dp[i] > best {
                      best = dp[i]
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun bestTeamScore(scores: IntArray, ages: IntArray): Int {
              val n = scores.size
              val order = (0 until n).sortedWith(compareBy<Int>({ ages[it] }, { scores[it] }))
              val dp = IntArray(n)
              var best = 0
              for (i in 0 until n) {
                  val s = scores[order[i]]
                  var top = 0
                  for (j in 0 until i) if (scores[order[j]] <= s && dp[j] > top) top = dp[j]
                  dp[i] = top + s
                  best = maxOf(best, dp[i])
              }
              return best
          }
        `,
        swift: code`
          func bestTeamScore(_ scores: [Int], _ ages: [Int]) -> Int {
              let n = scores.count
              let order = (0..<n).sorted { ages[$0] != ages[$1] ? ages[$0] < ages[$1] : scores[$0] < scores[$1] }
              var dp = [Int](repeating: 0, count: n)
              var best = 0
              for i in 0..<n {
                  let s = scores[order[i]]
                  var top = 0
                  for j in 0..<i where scores[order[j]] <= s && dp[j] > top { top = dp[j] }
                  dp[i] = top + s
                  best = max(best, dp[i])
              }
              return best
          }
        `,
        rust: code`
          fn bestTeamScore(scores: Vec<i32>, ages: Vec<i32>) -> i32 {
              let n = scores.len();
              let mut order: Vec<usize> = (0..n).collect();
              order.sort_by_key(|&i| (ages[i], scores[i]));
              let mut dp = vec![0i32; n];
              let mut best = 0;
              for i in 0..n {
                  let s = scores[order[i]];
                  let mut top = 0;
                  for j in 0..i {
                      if scores[order[j]] <= s && dp[j] > top {
                          top = dp[j];
                      }
                  }
                  dp[i] = top + s;
                  best = best.max(dp[i]);
              }
              best
          }
        `,
        php: code`
          function bestTeamScore($scores, $ages) {
              $n = count($scores);
              $order = range(0, $n - 1);
              usort($order, function ($a, $b) use ($scores, $ages) {
                  if ($ages[$a] != $ages[$b]) return $ages[$a] - $ages[$b];
                  return $scores[$a] - $scores[$b];
              });
              $dp = [];
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  $s = $scores[$order[$i]];
                  $top = 0;
                  for ($j = 0; $j < $i; $j++) if ($scores[$order[$j]] <= $s && $dp[$j] > $top) $top = $dp[$j];
                  $dp[$i] = $top + $s;
                  if ($dp[$i] > $best) $best = $dp[$i];
              }
              return $best;
          }
        `,
        ruby: code`
          def bestTeamScore(scores, ages)
            players = ages.zip(scores).sort
            dp = []
            best = 0
            players.each_with_index do |(_, s), i|
              top = 0
              i.times { |j| top = dp[j] if players[j][1] <= s && dp[j] > top }
              dp << top + s
              best = top + s if top + s > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Removals to Make Mountain Array (LC 1671) ─
  (() => {
    // Brute force over kept subsets for short arrays; the quadratic
    // LIS-from-both-sides DP otherwise.
    const isMountain = (a: number[]) => {
      if (a.length < 3) return false;
      let i = 0;
      while (i + 1 < a.length && a[i] < a[i + 1]) i++;
      if (i === 0 || i === a.length - 1) return false;
      while (i + 1 < a.length && a[i] > a[i + 1]) i++;
      return i === a.length - 1;
    };
    const lisBoth = (nums: number[]) => {
      const n = nums.length, inc = new Array(n).fill(1), dec = new Array(n).fill(1);
      for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (nums[j] < nums[i]) inc[i] = Math.max(inc[i], inc[j] + 1);
      for (let i = n - 1; i >= 0; i--) for (let j = n - 1; j > i; j--) if (nums[j] < nums[i]) dec[i] = Math.max(dec[i], dec[j] + 1);
      return { inc, dec };
    };
    const feasible = (nums: number[]) => {
      const { inc, dec } = lisBoth(nums);
      return inc.some((v, i) => v > 1 && dec[i] > 1);
    };
    const ref = (nums: number[]) => {
      const n = nums.length;
      if (n <= 12) {
        let keep = 0;
        for (let mask = 1; mask < 1 << n; mask++) {
          const sub = nums.filter((_, i) => mask & (1 << i));
          if (sub.length > keep && isMountain(sub)) keep = sub.length;
        }
        return n - keep;
      }
      const { inc, dec } = lisBoth(nums);
      let keep = 0;
      for (let i = 0; i < n; i++) if (inc[i] > 1 && dec[i] > 1) keep = Math.max(keep, inc[i] + dec[i] - 1);
      return n - keep;
    };
    return {
      slug: "minimum-number-of-removals-to-make-mountain-array",
      title: "Minimum Number of Removals to Make Mountain Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Greedy", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "minimumMountainRemovals", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An array `arr` is a **mountain** when `arr.length >= 3` and there is a peak index `i` with `0 < i < arr.length - 1` such that the values strictly increase up to the peak and strictly decrease after it:\n\n- `arr[0] < arr[1] < ... < arr[i]`\n- `arr[i] > arr[i + 1] > ... > arr[arr.length - 1]`\n\nGiven an array `nums`, return the **fewest** elements you must delete (keeping the others in order) so that what remains is a mountain. The input is guaranteed to allow a mountain.",
        [
          { in: "nums = [1,3,1]", out: "0", note: "It is already a mountain." },
          { in: "nums = [2,1,1,5,6,2,3,1]", out: "3", note: "Delete indices 0, 1 and 5 to keep [1,5,6,3,1]." },
          { in: "nums = [4,3,2,1,1,2,3,1]", out: "4", note: "Keep [1,2,3,1]; no five elements form a mountain." },
        ],
        ["3 <= nums.length <= 1000", "1 <= nums[i] <= 10^9", "a mountain can always be made from nums"]),
      hints: [
        "Fix the peak. The best mountain with that peak keeps the longest strictly increasing run of chosen values ending at it, and the longest strictly decreasing one starting from it.",
        "Compute, for every index, the longest strictly increasing subsequence ending there (left to right) and the longest strictly decreasing subsequence starting there (right to left).",
        "A peak is only valid if both sides have length at least 2 — otherwise one slope is empty. The answer is `n - max(inc[i] + dec[i] - 1)` over valid peaks.",
      ],
      editorial: explain({
        idea: "Deleting the fewest elements means keeping the longest mountain subsequence. For a fixed peak, its two slopes are independent: a longest increasing subsequence ending at the peak and a longest decreasing subsequence starting at it.",
        steps: [
          "`inc[i]` = length of the longest strictly increasing subsequence ending at `i`: `1 + max(inc[j])` over `j < i` with `nums[j] < nums[i]`.",
          "`dec[i]` = length of the longest strictly decreasing subsequence starting at `i`, computed the same way from the right.",
          "For each `i` with `inc[i] >= 2` and `dec[i] >= 2`, the mountain peaking at `i` keeps `inc[i] + dec[i] - 1` elements (the peak is counted twice).",
          "Return `n` minus the largest such kept length.",
        ],
        why: "The left slope uses only indices before the peak with values below it, the right slope only indices after it with values below it, so the two choices never interact and each can be maximised on its own. Every mountain has some peak, so taking the best peak covers all mountains.",
        time: "O(n^2) (O(n log n) with patience sorting for the two LIS passes)",
        space: "O(n)",
        pitfalls: [
          "A peak at the very start or end of the kept sequence is not a mountain: require `inc[i] > 1` **and** `dec[i] > 1`.",
          "Both slopes are strict — equal neighbours break a mountain, so compare with `<`, not `<=`.",
        ],
      }),
      examples: [
        { input: "[1,3,1]", expectedOutput: "0" },
        { input: "[2,1,1,5,6,2,3,1]", expectedOutput: "3" },
        { input: "[4,3,2,1,1,2,3,1]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const n = ri(rng, 3, pick(rng, [3, 6, 12, 12, 40]));
          const top = pick(rng, [3, 5, 20, 1000000000]);
          const nums = Array.from({ length: n }, () => ri(rng, 1, top));
          if (feasible(nums)) return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def minimumMountainRemovals(nums: List[int]) -> int:
              n = len(nums)
              inc = [1] * n
              dec = [1] * n
              for i in range(n):
                  for j in range(i):
                      if nums[j] < nums[i] and inc[j] + 1 > inc[i]:
                          inc[i] = inc[j] + 1
              for i in range(n - 1, -1, -1):
                  for j in range(i + 1, n):
                      if nums[j] < nums[i] and dec[j] + 1 > dec[i]:
                          dec[i] = dec[j] + 1
              keep = 0
              for i in range(n):
                  if inc[i] > 1 and dec[i] > 1:
                      keep = max(keep, inc[i] + dec[i] - 1)
              return n - keep
        `,
        javascript: code`
          var minimumMountainRemovals = function(nums) {
              var n = nums.length, inc = new Array(n).fill(1), dec = new Array(n).fill(1);
              for (var i = 0; i < n; i++)
                  for (var j = 0; j < i; j++)
                      if (nums[j] < nums[i] && inc[j] + 1 > inc[i]) inc[i] = inc[j] + 1;
              for (var i = n - 1; i >= 0; i--)
                  for (var j = i + 1; j < n; j++)
                      if (nums[j] < nums[i] && dec[j] + 1 > dec[i]) dec[i] = dec[j] + 1;
              var keep = 0;
              for (var i = 0; i < n; i++)
                  if (inc[i] > 1 && dec[i] > 1 && inc[i] + dec[i] - 1 > keep) keep = inc[i] + dec[i] - 1;
              return n - keep;
          };
        `,
        typescript: code`
          function minimumMountainRemovals(nums: number[]): number {
              var n = nums.length, inc: number[] = [], dec: number[] = [];
              for (var i = 0; i < n; i++) { inc.push(1); dec.push(1); }
              for (var i = 0; i < n; i++)
                  for (var j = 0; j < i; j++)
                      if (nums[j] < nums[i] && inc[j] + 1 > inc[i]) inc[i] = inc[j] + 1;
              for (var i = n - 1; i >= 0; i--)
                  for (var j = i + 1; j < n; j++)
                      if (nums[j] < nums[i] && dec[j] + 1 > dec[i]) dec[i] = dec[j] + 1;
              var keep = 0;
              for (var i = 0; i < n; i++)
                  if (inc[i] > 1 && dec[i] > 1 && inc[i] + dec[i] - 1 > keep) keep = inc[i] + dec[i] - 1;
              return n - keep;
          }
        `,
        java: code`
          public static int minimumMountainRemovals(int[] nums) {
              int n = nums.length;
              int[] inc = new int[n], dec = new int[n];
              for (int i = 0; i < n; i++) {
                  inc[i] = 1;
                  for (int j = 0; j < i; j++) if (nums[j] < nums[i]) inc[i] = Math.max(inc[i], inc[j] + 1);
              }
              for (int i = n - 1; i >= 0; i--) {
                  dec[i] = 1;
                  for (int j = i + 1; j < n; j++) if (nums[j] < nums[i]) dec[i] = Math.max(dec[i], dec[j] + 1);
              }
              int keep = 0;
              for (int i = 0; i < n; i++) if (inc[i] > 1 && dec[i] > 1) keep = Math.max(keep, inc[i] + dec[i] - 1);
              return n - keep;
          }
        `,
        cpp: code`
          int minimumMountainRemovals(vector<int>& nums) {
              int n = nums.size();
              vector<int> inc(n, 1), dec(n, 1);
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < i; j++)
                      if (nums[j] < nums[i]) inc[i] = max(inc[i], inc[j] + 1);
              for (int i = n - 1; i >= 0; i--)
                  for (int j = i + 1; j < n; j++)
                      if (nums[j] < nums[i]) dec[i] = max(dec[i], dec[j] + 1);
              int keep = 0;
              for (int i = 0; i < n; i++) if (inc[i] > 1 && dec[i] > 1) keep = max(keep, inc[i] + dec[i] - 1);
              return n - keep;
          }
        `,
        c: code`
          int minimumMountainRemovals(int* nums, int numsSize) {
              int n = numsSize;
              int* inc = (int*)malloc(sizeof(int) * n);
              int* dec = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) {
                  inc[i] = 1;
                  for (int j = 0; j < i; j++) if (nums[j] < nums[i] && inc[j] + 1 > inc[i]) inc[i] = inc[j] + 1;
              }
              for (int i = n - 1; i >= 0; i--) {
                  dec[i] = 1;
                  for (int j = i + 1; j < n; j++) if (nums[j] < nums[i] && dec[j] + 1 > dec[i]) dec[i] = dec[j] + 1;
              }
              int keep = 0;
              for (int i = 0; i < n; i++) if (inc[i] > 1 && dec[i] > 1 && inc[i] + dec[i] - 1 > keep) keep = inc[i] + dec[i] - 1;
              free(inc);
              free(dec);
              return n - keep;
          }
        `,
        csharp: code`
          public static int MinimumMountainRemovals(int[] nums)
          {
              int n = nums.Length;
              int[] inc = new int[n], dec = new int[n];
              for (int i = 0; i < n; i++)
              {
                  inc[i] = 1;
                  for (int j = 0; j < i; j++) if (nums[j] < nums[i]) inc[i] = Math.Max(inc[i], inc[j] + 1);
              }
              for (int i = n - 1; i >= 0; i--)
              {
                  dec[i] = 1;
                  for (int j = i + 1; j < n; j++) if (nums[j] < nums[i]) dec[i] = Math.Max(dec[i], dec[j] + 1);
              }
              int keep = 0;
              for (int i = 0; i < n; i++) if (inc[i] > 1 && dec[i] > 1) keep = Math.Max(keep, inc[i] + dec[i] - 1);
              return n - keep;
          }
        `,
        go: code`
          func minimumMountainRemovals(nums []int) int {
              n := len(nums)
              inc := make([]int, n)
              dec := make([]int, n)
              for i := 0; i < n; i++ {
                  inc[i] = 1
                  for j := 0; j < i; j++ {
                      if nums[j] < nums[i] && inc[j]+1 > inc[i] {
                          inc[i] = inc[j] + 1
                      }
                  }
              }
              for i := n - 1; i >= 0; i-- {
                  dec[i] = 1
                  for j := i + 1; j < n; j++ {
                      if nums[j] < nums[i] && dec[j]+1 > dec[i] {
                          dec[i] = dec[j] + 1
                      }
                  }
              }
              keep := 0
              for i := 0; i < n; i++ {
                  if inc[i] > 1 && dec[i] > 1 && inc[i]+dec[i]-1 > keep {
                      keep = inc[i] + dec[i] - 1
                  }
              }
              return n - keep
          }
        `,
        kotlin: code`
          fun minimumMountainRemovals(nums: IntArray): Int {
              val n = nums.size
              val inc = IntArray(n) { 1 }
              val dec = IntArray(n) { 1 }
              for (i in 0 until n) for (j in 0 until i) if (nums[j] < nums[i]) inc[i] = maxOf(inc[i], inc[j] + 1)
              for (i in n - 1 downTo 0) for (j in i + 1 until n) if (nums[j] < nums[i]) dec[i] = maxOf(dec[i], dec[j] + 1)
              var keep = 0
              for (i in 0 until n) if (inc[i] > 1 && dec[i] > 1) keep = maxOf(keep, inc[i] + dec[i] - 1)
              return n - keep
          }
        `,
        swift: code`
          func minimumMountainRemovals(_ nums: [Int]) -> Int {
              let n = nums.count
              var inc = [Int](repeating: 1, count: n)
              var dec = [Int](repeating: 1, count: n)
              for i in 0..<n {
                  for j in 0..<i where nums[j] < nums[i] { inc[i] = max(inc[i], inc[j] + 1) }
              }
              for i in stride(from: n - 1, through: 0, by: -1) {
                  for j in (i + 1)..<n where nums[j] < nums[i] { dec[i] = max(dec[i], dec[j] + 1) }
              }
              var keep = 0
              for i in 0..<n where inc[i] > 1 && dec[i] > 1 { keep = max(keep, inc[i] + dec[i] - 1) }
              return n - keep
          }
        `,
        rust: code`
          fn minimumMountainRemovals(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut inc = vec![1usize; n];
              let mut dec = vec![1usize; n];
              for i in 0..n {
                  for j in 0..i {
                      if nums[j] < nums[i] && inc[j] + 1 > inc[i] {
                          inc[i] = inc[j] + 1;
                      }
                  }
              }
              for i in (0..n).rev() {
                  for j in (i + 1)..n {
                      if nums[j] < nums[i] && dec[j] + 1 > dec[i] {
                          dec[i] = dec[j] + 1;
                      }
                  }
              }
              let mut keep = 0;
              for i in 0..n {
                  if inc[i] > 1 && dec[i] > 1 {
                      keep = keep.max(inc[i] + dec[i] - 1);
                  }
              }
              (n - keep) as i32
          }
        `,
        php: code`
          function minimumMountainRemovals($nums) {
              $n = count($nums);
              $inc = array_fill(0, $n, 1);
              $dec = array_fill(0, $n, 1);
              for ($i = 0; $i < $n; $i++)
                  for ($j = 0; $j < $i; $j++)
                      if ($nums[$j] < $nums[$i] && $inc[$j] + 1 > $inc[$i]) $inc[$i] = $inc[$j] + 1;
              for ($i = $n - 1; $i >= 0; $i--)
                  for ($j = $i + 1; $j < $n; $j++)
                      if ($nums[$j] < $nums[$i] && $dec[$j] + 1 > $dec[$i]) $dec[$i] = $dec[$j] + 1;
              $keep = 0;
              for ($i = 0; $i < $n; $i++)
                  if ($inc[$i] > 1 && $dec[$i] > 1) $keep = max($keep, $inc[$i] + $dec[$i] - 1);
              return $n - $keep;
          }
        `,
        ruby: code`
          def minimumMountainRemovals(nums)
            n = nums.length
            inc = Array.new(n, 1)
            dec = Array.new(n, 1)
            n.times do |i|
              i.times { |j| inc[i] = inc[j] + 1 if nums[j] < nums[i] && inc[j] + 1 > inc[i] }
            end
            (n - 1).downto(0) do |i|
              ((i + 1)...n).each { |j| dec[i] = dec[j] + 1 if nums[j] < nums[i] && dec[j] + 1 > dec[i] }
            end
            keep = 0
            n.times { |i| keep = inc[i] + dec[i] - 1 if inc[i] > 1 && dec[i] > 1 && inc[i] + dec[i] - 1 > keep }
            n - keep
          end
        `,
      },
    };
  })(),

  // ── Delivering Boxes from Storage to Ports (LC 1687) ────────────
  (() => {
    // O(n^2): try every last load j..i-1 that fits; its trips are 2 plus the
    // number of port changes inside it.
    const ref = (boxes: number[][], maxBoxes: number, maxWeight: number) => {
      const n = boxes.length, dp = new Array(n + 1).fill(Infinity);
      dp[0] = 0;
      for (let i = 1; i <= n; i++) {
        let weight = 0, changes = 0;
        for (let j = i - 1; j >= 0 && i - j <= maxBoxes; j--) {
          weight += boxes[j][1];
          if (weight > maxWeight) break;
          if (j + 1 <= i - 1 && boxes[j][0] !== boxes[j + 1][0]) changes++;
          dp[i] = Math.min(dp[i], dp[j] + 2 + changes);
        }
      }
      return dp[n];
    };
    return {
      slug: "delivering-boxes-from-storage-to-ports",
      title: "Delivering Boxes from Storage to Ports",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Segment Tree", "Queue", "Prefix Sum", "Monotonic Queue", "Amazon"],
      signature: {
        funcName: "boxDelivering",
        params: [
          { name: "boxes", type: "int[][]" as const },
          { name: "portsCount", type: "int" as const },
          { name: "maxBoxes", type: "int" as const },
          { name: "maxWeight", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A single delivery ship moves boxes from a storage yard to `portsCount` ports. `boxes[i] = [port_i, weight_i]` says box `i` must go to port `port_i` and weighs `weight_i`. The ship carries at most `maxBoxes` boxes and at most `maxWeight` total weight per load.\n\nBoxes must be delivered **in the given order**. The ship repeats:\n\n1. At storage, load the next few waiting boxes (in order), within both limits.\n2. Sail to each loaded box's port in order and deliver it. If the next box goes to the port the ship is already at, no sailing is needed; every move to a **different** place is one trip.\n3. Sail back to storage — one more trip.\n\nThe ship must finish at storage. Return the minimum number of trips needed to deliver every box.",
        [
          { in: "boxes = [[1,1],[2,1],[1,1]], portsCount = 2, maxBoxes = 3, maxWeight = 3", out: "4", note: "One load of all three boxes: storage → 1 → 2 → 1 → storage is 4 trips." },
          { in: "boxes = [[1,2],[3,3],[3,1],[3,1],[2,4]], portsCount = 3, maxBoxes = 3, maxWeight = 6", out: "6", note: "Load box 0 (2 trips), then boxes 1–3, which all go to port 3 (2 trips), then box 4 (2 trips)." },
          { in: "boxes = [[1,4],[1,2],[2,1],[2,1],[3,2],[3,4]], portsCount = 3, maxBoxes = 6, maxWeight = 7", out: "6", note: "Loads [0,1], [2,3] and [4,5] each visit a single port: 2 + 2 + 2 = 6 trips." },
        ],
        ["1 <= boxes.length <= 10^5", "1 <= portsCount, maxBoxes, maxWeight <= 10^5", "1 <= port_i <= portsCount", "1 <= weight_i <= maxWeight"]),
      hints: [
        "A load of boxes `j..i-1` always costs `2` plus the number of adjacent pairs inside it that go to different ports. So `dp[i] = min(dp[j] + 2 + changes(j, i-1))` over loads that fit.",
        "Let `c[k]` count port changes among the first `k` boxes. Then `changes(j, i-1) = c[i] - c[j+1]`, and the term to minimise is `dp[j] - c[j+1]`, which does not depend on `i`.",
        "The valid `j` form a sliding window (the box and weight limits only ever push its left end forward), so keep a monotonic deque of `j` ordered by `dp[j] - c[j+1]`.",
      ],
      editorial: explain({
        idea: "Partition the box sequence into consecutive loads. A load's price is 2 plus its internal port changes, which splits into a part depending on its start and a part depending on its end — so the DP minimum over a sliding window of starts can be served by a monotonic deque.",
        steps: [
          "Build prefix weights `W[k]` and change counts `c[k]` (`c[k]` = number of `t` in `[1, k-1]` with `port[t] != port[t-1]`).",
          "`dp[0] = 0`. For `i = 1..n`, the last load is boxes `j..i-1` with `i - j <= maxBoxes` and `W[i] - W[j] <= maxWeight`; its cost is `dp[j] + c[i] - c[j+1] + 2`.",
          "Keep a deque of candidate `j` with increasing `dp[j] - c[j+1]`. Before computing `dp[i]`, drop front entries that violate the box or weight limit; the front is the best `j`.",
          "After computing `dp[i]` (for `i < n`), push `i`, first popping back entries whose key is not smaller.",
          "Return `dp[n]`.",
        ],
        why: "The window of feasible starts only moves right as `i` grows, so an index that leaves it never returns, and an index dominated by a later one with no larger key can never be the minimum again. The front of the deque is therefore always the best feasible start, giving the same value as the quadratic DP.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A load counts the return trip: a load to a single port is 2 trips, not 1.",
          "Port changes are counted only **inside** a load; the first box of a load is reached by the trip out of storage, already in the `+ 2`.",
          "The window is never empty: a single box always fits, since `weight_i <= maxWeight` and `maxBoxes >= 1`.",
        ],
      }),
      examples: [
        { input: "[[1,1],[2,1],[1,1]]\n2\n3\n3", expectedOutput: "4" },
        { input: "[[1,2],[3,3],[3,1],[3,1],[2,4]]\n3\n3\n6", expectedOutput: "6" },
        { input: "[[1,4],[1,2],[2,1],[2,1],[3,2],[3,4]]\n3\n6\n7", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40]));
        const portsCount = ri(rng, 1, pick(rng, [1, 2, 4, 10]));
        const maxWeight = ri(rng, 1, pick(rng, [1, 5, 20, 100000]));
        const maxBoxes = ri(rng, 1, pick(rng, [1, 3, n + 2]));
        const wTop = Math.min(maxWeight, pick(rng, [1, 3, 100000]));
        const boxes = Array.from({ length: n }, () => [ri(rng, 1, portsCount), ri(rng, 1, wTop)]);
        return {
          input: `${fmtIntMat(boxes)}\n${portsCount}\n${maxBoxes}\n${maxWeight}`,
          expectedOutput: String(ref(boxes, maxBoxes, maxWeight)),
        };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def boxDelivering(boxes: List[List[int]], portsCount: int, maxBoxes: int, maxWeight: int) -> int:
              n = len(boxes)
              W = [0] * (n + 1)
              c = [0] * (n + 1)
              for k in range(1, n + 1):
                  W[k] = W[k - 1] + boxes[k - 1][1]
                  if k >= 2:
                      c[k] = c[k - 1] + (1 if boxes[k - 1][0] != boxes[k - 2][0] else 0)
              dp = [0] * (n + 1)
              dq = deque([0])
              for i in range(1, n + 1):
                  while i - dq[0] > maxBoxes or W[i] - W[dq[0]] > maxWeight:
                      dq.popleft()
                  j = dq[0]
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2
                  if i < n:
                      key = dp[i] - c[i + 1]
                      while dq and dp[dq[-1]] - c[dq[-1] + 1] >= key:
                          dq.pop()
                      dq.append(i)
              return dp[n]
        `,
        javascript: code`
          var boxDelivering = function(boxes, portsCount, maxBoxes, maxWeight) {
              var n = boxes.length, W = new Array(n + 1).fill(0), c = new Array(n + 1).fill(0);
              for (var k = 1; k <= n; k++) {
                  W[k] = W[k - 1] + boxes[k - 1][1];
                  if (k >= 2) c[k] = c[k - 1] + (boxes[k - 1][0] !== boxes[k - 2][0] ? 1 : 0);
              }
              var dp = new Array(n + 1).fill(0), dq = new Array(n + 1), head = 0, tail = 0;
              dq[tail++] = 0;
              for (var i = 1; i <= n; i++) {
                  while (i - dq[head] > maxBoxes || W[i] - W[dq[head]] > maxWeight) head++;
                  var j = dq[head];
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2;
                  if (i < n) {
                      var key = dp[i] - c[i + 1];
                      while (tail > head && dp[dq[tail - 1]] - c[dq[tail - 1] + 1] >= key) tail--;
                      dq[tail++] = i;
                  }
              }
              return dp[n];
          };
        `,
        typescript: code`
          function boxDelivering(boxes: number[][], portsCount: number, maxBoxes: number, maxWeight: number): number {
              var n = boxes.length, W: number[] = [0], c: number[] = [0];
              for (var k = 1; k <= n; k++) {
                  W.push(W[k - 1] + boxes[k - 1][1]);
                  c.push(k >= 2 ? c[k - 1] + (boxes[k - 1][0] !== boxes[k - 2][0] ? 1 : 0) : 0);
              }
              var dp: number[] = [0], dq: number[] = [0], head = 0;
              for (var i = 1; i <= n; i++) {
                  while (i - dq[head] > maxBoxes || W[i] - W[dq[head]] > maxWeight) head++;
                  var j = dq[head];
                  dp.push(dp[j] - c[j + 1] + c[i] + 2);
                  if (i < n) {
                      var key = dp[i] - c[i + 1];
                      while (dq.length > head && dp[dq[dq.length - 1]] - c[dq[dq.length - 1] + 1] >= key) dq.pop();
                      dq.push(i);
                  }
              }
              return dp[n];
          }
        `,
        java: code`
          public static int boxDelivering(int[][] boxes, int portsCount, int maxBoxes, int maxWeight) {
              int n = boxes.length;
              long[] W = new long[n + 1];
              int[] c = new int[n + 1];
              for (int k = 1; k <= n; k++) {
                  W[k] = W[k - 1] + boxes[k - 1][1];
                  if (k >= 2) c[k] = c[k - 1] + (boxes[k - 1][0] != boxes[k - 2][0] ? 1 : 0);
              }
              int[] dp = new int[n + 1];
              int[] dq = new int[n + 1];
              int head = 0, tail = 0;
              dq[tail++] = 0;
              for (int i = 1; i <= n; i++) {
                  while (i - dq[head] > maxBoxes || W[i] - W[dq[head]] > maxWeight) head++;
                  int j = dq[head];
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2;
                  if (i < n) {
                      int key = dp[i] - c[i + 1];
                      while (tail > head && dp[dq[tail - 1]] - c[dq[tail - 1] + 1] >= key) tail--;
                      dq[tail++] = i;
                  }
              }
              return dp[n];
          }
        `,
        cpp: code`
          int boxDelivering(vector<vector<int>>& boxes, int portsCount, int maxBoxes, int maxWeight) {
              int n = boxes.size();
              vector<long long> W(n + 1, 0);
              vector<int> c(n + 1, 0);
              for (int k = 1; k <= n; k++) {
                  W[k] = W[k - 1] + boxes[k - 1][1];
                  if (k >= 2) c[k] = c[k - 1] + (boxes[k - 1][0] != boxes[k - 2][0] ? 1 : 0);
              }
              vector<int> dp(n + 1, 0);
              deque<int> dq;
              dq.push_back(0);
              for (int i = 1; i <= n; i++) {
                  while (i - dq.front() > maxBoxes || W[i] - W[dq.front()] > maxWeight) dq.pop_front();
                  int j = dq.front();
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2;
                  if (i < n) {
                      int key = dp[i] - c[i + 1];
                      while (!dq.empty() && dp[dq.back()] - c[dq.back() + 1] >= key) dq.pop_back();
                      dq.push_back(i);
                  }
              }
              return dp[n];
          }
        `,
        c: code`
          int boxDelivering(int** boxes, int boxesSize, int* boxesColSize, int portsCount, int maxBoxes, int maxWeight) {
              int n = boxesSize;
              long long* W = (long long*)calloc(n + 1, sizeof(long long));
              int* c = (int*)calloc(n + 1, sizeof(int));
              for (int k = 1; k <= n; k++) {
                  W[k] = W[k - 1] + boxes[k - 1][1];
                  if (k >= 2) c[k] = c[k - 1] + (boxes[k - 1][0] != boxes[k - 2][0] ? 1 : 0);
              }
              int* dp = (int*)calloc(n + 1, sizeof(int));
              int* dq = (int*)malloc(sizeof(int) * (n + 1));
              int head = 0, tail = 0;
              dq[tail++] = 0;
              for (int i = 1; i <= n; i++) {
                  while (i - dq[head] > maxBoxes || W[i] - W[dq[head]] > maxWeight) head++;
                  int j = dq[head];
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2;
                  if (i < n) {
                      int key = dp[i] - c[i + 1];
                      while (tail > head && dp[dq[tail - 1]] - c[dq[tail - 1] + 1] >= key) tail--;
                      dq[tail++] = i;
                  }
              }
              int ans = dp[n];
              free(W); free(c); free(dp); free(dq);
              return ans;
          }
        `,
        csharp: code`
          public static int BoxDelivering(int[][] boxes, int portsCount, int maxBoxes, int maxWeight)
          {
              int n = boxes.Length;
              long[] W = new long[n + 1];
              int[] c = new int[n + 1];
              for (int k = 1; k <= n; k++)
              {
                  W[k] = W[k - 1] + boxes[k - 1][1];
                  if (k >= 2) c[k] = c[k - 1] + (boxes[k - 1][0] != boxes[k - 2][0] ? 1 : 0);
              }
              int[] dp = new int[n + 1];
              int[] dq = new int[n + 1];
              int head = 0, tail = 0;
              dq[tail++] = 0;
              for (int i = 1; i <= n; i++)
              {
                  while (i - dq[head] > maxBoxes || W[i] - W[dq[head]] > maxWeight) head++;
                  int j = dq[head];
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2;
                  if (i < n)
                  {
                      int key = dp[i] - c[i + 1];
                      while (tail > head && dp[dq[tail - 1]] - c[dq[tail - 1] + 1] >= key) tail--;
                      dq[tail++] = i;
                  }
              }
              return dp[n];
          }
        `,
        go: code`
          func boxDelivering(boxes [][]int, portsCount int, maxBoxes int, maxWeight int) int {
              n := len(boxes)
              W := make([]int, n+1)
              c := make([]int, n+1)
              for k := 1; k <= n; k++ {
                  W[k] = W[k-1] + boxes[k-1][1]
                  if k >= 2 {
                      c[k] = c[k-1]
                      if boxes[k-1][0] != boxes[k-2][0] {
                          c[k]++
                      }
                  }
              }
              dp := make([]int, n+1)
              dq := make([]int, 0, n+1)
              dq = append(dq, 0)
              head := 0
              for i := 1; i <= n; i++ {
                  for i-dq[head] > maxBoxes || W[i]-W[dq[head]] > maxWeight {
                      head++
                  }
                  j := dq[head]
                  dp[i] = dp[j] - c[j+1] + c[i] + 2
                  if i < n {
                      key := dp[i] - c[i+1]
                      for len(dq) > head && dp[dq[len(dq)-1]]-c[dq[len(dq)-1]+1] >= key {
                          dq = dq[:len(dq)-1]
                      }
                      dq = append(dq, i)
                  }
              }
              return dp[n]
          }
        `,
        kotlin: code`
          fun boxDelivering(boxes: Array<IntArray>, portsCount: Int, maxBoxes: Int, maxWeight: Int): Int {
              val n = boxes.size
              val w = LongArray(n + 1)
              val c = IntArray(n + 1)
              for (k in 1..n) {
                  w[k] = w[k - 1] + boxes[k - 1][1]
                  if (k >= 2) c[k] = c[k - 1] + (if (boxes[k - 1][0] != boxes[k - 2][0]) 1 else 0)
              }
              val dp = IntArray(n + 1)
              val dq = IntArray(n + 1)
              var head = 0
              var tail = 0
              dq[tail++] = 0
              for (i in 1..n) {
                  while (i - dq[head] > maxBoxes || w[i] - w[dq[head]] > maxWeight) head++
                  val j = dq[head]
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2
                  if (i < n) {
                      val key = dp[i] - c[i + 1]
                      while (tail > head && dp[dq[tail - 1]] - c[dq[tail - 1] + 1] >= key) tail--
                      dq[tail++] = i
                  }
              }
              return dp[n]
          }
        `,
        swift: code`
          func boxDelivering(_ boxes: [[Int]], _ portsCount: Int, _ maxBoxes: Int, _ maxWeight: Int) -> Int {
              let n = boxes.count
              var W = [Int](repeating: 0, count: n + 1)
              var c = [Int](repeating: 0, count: n + 1)
              for k in stride(from: 1, through: n, by: 1) {
                  W[k] = W[k - 1] + boxes[k - 1][1]
                  if k >= 2 { c[k] = c[k - 1] + (boxes[k - 1][0] != boxes[k - 2][0] ? 1 : 0) }
              }
              var dp = [Int](repeating: 0, count: n + 1)
              var dq = [Int](repeating: 0, count: n + 1)
              var head = 0, tail = 1
              for i in stride(from: 1, through: n, by: 1) {
                  while i - dq[head] > maxBoxes || W[i] - W[dq[head]] > maxWeight { head += 1 }
                  let j = dq[head]
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2
                  if i < n {
                      let key = dp[i] - c[i + 1]
                      while tail > head && dp[dq[tail - 1]] - c[dq[tail - 1] + 1] >= key { tail -= 1 }
                      dq[tail] = i
                      tail += 1
                  }
              }
              return dp[n]
          }
        `,
        rust: code`
          fn boxDelivering(boxes: Vec<Vec<i32>>, ports_count: i32, max_boxes: i32, max_weight: i32) -> i32 {
              let _ = ports_count;
              let n = boxes.len();
              let mut w = vec![0i64; n + 1];
              let mut c = vec![0i32; n + 1];
              for k in 1..=n {
                  w[k] = w[k - 1] + boxes[k - 1][1] as i64;
                  if k >= 2 {
                      c[k] = c[k - 1] + if boxes[k - 1][0] != boxes[k - 2][0] { 1 } else { 0 };
                  }
              }
              let mut dp = vec![0i32; n + 1];
              let mut dq = vec![0usize; n + 1];
              let (mut head, mut tail) = (0usize, 1usize);
              for i in 1..=n {
                  while (i - dq[head]) as i32 > max_boxes || w[i] - w[dq[head]] > max_weight as i64 {
                      head += 1;
                  }
                  let j = dq[head];
                  dp[i] = dp[j] - c[j + 1] + c[i] + 2;
                  if i < n {
                      let key = dp[i] - c[i + 1];
                      while tail > head && dp[dq[tail - 1]] - c[dq[tail - 1] + 1] >= key {
                          tail -= 1;
                      }
                      dq[tail] = i;
                      tail += 1;
                  }
              }
              dp[n]
          }
        `,
        php: code`
          function boxDelivering($boxes, $portsCount, $maxBoxes, $maxWeight) {
              $n = count($boxes);
              $W = array_fill(0, $n + 1, 0);
              $c = array_fill(0, $n + 1, 0);
              for ($k = 1; $k <= $n; $k++) {
                  $W[$k] = $W[$k - 1] + $boxes[$k - 1][1];
                  if ($k >= 2) $c[$k] = $c[$k - 1] + ($boxes[$k - 1][0] != $boxes[$k - 2][0] ? 1 : 0);
              }
              $dp = array_fill(0, $n + 1, 0);
              $dq = [0];
              $head = 0;
              $tail = 1;
              for ($i = 1; $i <= $n; $i++) {
                  while ($i - $dq[$head] > $maxBoxes || $W[$i] - $W[$dq[$head]] > $maxWeight) $head++;
                  $j = $dq[$head];
                  $dp[$i] = $dp[$j] - $c[$j + 1] + $c[$i] + 2;
                  if ($i < $n) {
                      $key = $dp[$i] - $c[$i + 1];
                      while ($tail > $head && $dp[$dq[$tail - 1]] - $c[$dq[$tail - 1] + 1] >= $key) $tail--;
                      $dq[$tail++] = $i;
                  }
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def boxDelivering(boxes, portsCount, maxBoxes, maxWeight)
            n = boxes.length
            w = Array.new(n + 1, 0)
            c = Array.new(n + 1, 0)
            (1..n).each do |k|
              w[k] = w[k - 1] + boxes[k - 1][1]
              c[k] = c[k - 1] + (boxes[k - 1][0] != boxes[k - 2][0] ? 1 : 0) if k >= 2
            end
            dp = Array.new(n + 1, 0)
            dq = [0]
            head = 0
            (1..n).each do |i|
              head += 1 while i - dq[head] > maxBoxes || w[i] - w[dq[head]] > maxWeight
              j = dq[head]
              dp[i] = dp[j] - c[j + 1] + c[i] + 2
              next unless i < n
              key = dp[i] - c[i + 1]
              dq.pop while dq.length > head && dp[dq[-1]] - c[dq[-1] + 1] >= key
              dq << i
            end
            dp[n]
          end
        `,
      },
    };
  })(),


  // ── Make the XOR of All Segments Equal to Zero (LC 1787) ────────
  (() => {
    // Group i % k must end constant, and the k group values must XOR to 0.
    // The reference runs the textbook DP with the full B x B transition (every
    // value v for every group) — no "only values present" shortcut — and
    // falls back to that shortcut only for the rare wide-value cases.
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      let B = 1;
      while (B <= Math.max(...nums)) B <<= 1;
      let dp = new Array(B).fill(Infinity);
      dp[0] = 0;
      for (let g = 0; g < k; g++) {
        const freq = new Array(B).fill(0);
        let sz = 0;
        for (let i = g; i < n; i += k) { freq[nums[i]]++; sz++; }
        const nd = new Array(B).fill(Infinity);
        if (B <= 64) {
          for (let x = 0; x < B; x++) for (let v = 0; v < B; v++) nd[x] = Math.min(nd[x], dp[x ^ v] + sz - freq[v]);
        } else {
          const low = Math.min(...dp);
          for (let x = 0; x < B; x++) {
            nd[x] = low + sz;
            for (let v = 0; v < B; v++) if (freq[v]) nd[x] = Math.min(nd[x], dp[x ^ v] + sz - freq[v]);
          }
        }
        dp = nd;
      }
      return dp[0];
    };
    return {
      slug: "make-the-xor-of-all-segments-equal-to-zero",
      title: "Make the XOR of All Segments Equal to Zero",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Google"],
      signature: { funcName: "minChanges", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` and an integer `k`. The XOR of a segment `[left, right]` (with `left <= right`) is `nums[left] XOR nums[left + 1] XOR ... XOR nums[right]`.\n\nIn one change you may replace any element with any non-negative integer. Return the **minimum** number of elements to change so that **every** segment of length exactly `k` has XOR equal to `0`.",
        [
          { in: "nums = [1,2,0,3,0], k = 1", out: "3", note: "Each single element must be 0, so the three non-zero elements change: [0,0,0,0,0]." },
          { in: "nums = [3,4,5,2,1,7,3,4,7], k = 3", out: "3", note: "Change it to [3,4,7,3,4,7,3,4,7]: every window of three is 3 XOR 4 XOR 7 = 0." },
          { in: "nums = [1,2,4,1,2,5,1,2,6], k = 3", out: "3", note: "Change it to [1,2,3,1,2,3,1,2,3]." },
        ],
        ["1 <= k <= nums.length <= 2000", "0 <= nums[i] < 2^10"]),
      hints: [
        "Two consecutive windows of length `k` share `k - 1` elements, so their XORs being equal forces `nums[i] == nums[i + k]`. In the final array, every position with the same `i % k` holds the same value.",
        "So the task is: pick one value per residue class `0..k-1` so the `k` values XOR to 0, paying for every element of the class that differs from the picked value. Process the classes one by one with `dp[x]` = cheapest cost so far with running XOR `x`.",
        "For a class of size `sz`, either pick a value that already occurs `freq[v]` times there (cost `sz - freq[v]`, from `dp[x ^ v]`), or pick something absent (cost `sz`, from the best `dp` of all) — only the present values need individual transitions.",
      ],
      editorial: explain({
        idea: "All windows of length `k` XOR to zero exactly when the array is periodic with period `k` and one period XORs to zero. That reduces the problem to choosing one value per residue class, a DP over the running XOR of the chosen values.",
        steps: [
          "Let `B` be the smallest power of two above `max(nums)` (at most 1024); every useful value lies below `B`.",
          "Start with `dp[0] = 0` and `dp[x] = ∞` otherwise.",
          "For each class `g = 0..k-1`, count `freq[v]` of its elements and its size `sz`. Set `low = min(dp)`.",
          "New `dp[x] = min(low + sz, min over present v of dp[x ^ v] + sz - freq[v])`: the first term picks a value absent from the class (all its elements change; that value can make the XOR anything), the second keeps the copies of `v`.",
          "After all classes, the answer is `dp[0]`.",
        ],
        why: "If every window XORs to 0, then subtracting window `i` from window `i + 1` gives `nums[i] = nums[i + k]`, and the first window XORing to 0 covers the rest. A class's cost depends only on the chosen value. A value not in the class always costs `sz`, so among absent values only the cheapest predecessor matters, which is `low`. Restricting values below `B` is safe because clearing the higher bits of every chosen value keeps the XOR zero and changes no element that already matched.",
        time: "O(B * (k + n)) with B ≤ 1024",
        space: "O(B)",
        pitfalls: [
          "Trying every value `v` for every class costs `O(k * B^2)`; only values that actually occur need their own transition.",
          "The `low + sz` option is essential: the best choice for a class is sometimes a value that never appears in it.",
          "When `k == n` each class has one element, and the answer is 0 or 1 depending on whether the whole array already XORs to 0.",
        ],
      }),
      examples: [
        { input: "[1,2,0,3,0]\n1", expectedOutput: "3" },
        { input: "[3,4,5,2,1,7,3,4,7]\n3", expectedOutput: "3" },
        { input: "[1,2,4,1,2,5,1,2,6]\n3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const wide = rng() < 0.1;
        const n = wide ? ri(rng, 1, 10) : ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const k = ri(rng, 1, wide ? Math.min(n, 3) : n);
        const bits = wide ? 10 : pick(rng, [1, 2, 3, 4, 6]);
        let nums: number[];
        if (rng() < 0.3) {
          // A nearly periodic array, so small answers show up too.
          const period = Array.from({ length: k }, () => ri(rng, 0, (1 << bits) - 1));
          nums = Array.from({ length: n }, (_, i) => (rng() < 0.2 ? ri(rng, 0, (1 << bits) - 1) : period[i % k]));
        } else {
          nums = Array.from({ length: n }, () => ri(rng, 0, (1 << bits) - 1));
        }
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minChanges(nums: List[int], k: int) -> int:
              n = len(nums)
              B = 1
              while B <= max(nums):
                  B <<= 1
              INF = float('inf')
              dp = [INF] * B
              dp[0] = 0
              for g in range(k):
                  freq = {}
                  sz = 0
                  for i in range(g, n, k):
                      freq[nums[i]] = freq.get(nums[i], 0) + 1
                      sz += 1
                  low = min(dp) + sz
                  items = list(freq.items())
                  nd = [low] * B
                  for x in range(B):
                      best = low
                      for v, f in items:
                          c = dp[x ^ v] + sz - f
                          if c < best:
                              best = c
                      nd[x] = best
                  dp = nd
              return dp[0]
        `,
        javascript: code`
          var minChanges = function(nums, k) {
              var n = nums.length, mx = 0;
              for (var i = 0; i < n; i++) if (nums[i] > mx) mx = nums[i];
              var B = 1;
              while (B <= mx) B <<= 1;
              var INF = 1 << 29, dp = new Array(B).fill(INF), freq = new Array(B).fill(0);
              dp[0] = 0;
              for (var g = 0; g < k; g++) {
                  var vals = [], sz = 0;
                  for (var i = g; i < n; i += k) {
                      if (freq[nums[i]] === 0) vals.push(nums[i]);
                      freq[nums[i]]++;
                      sz++;
                  }
                  var low = INF;
                  for (var x = 0; x < B; x++) if (dp[x] < low) low = dp[x];
                  var nd = new Array(B);
                  for (var x = 0; x < B; x++) {
                      var best = low + sz;
                      for (var t = 0; t < vals.length; t++) {
                          var c = dp[x ^ vals[t]] + sz - freq[vals[t]];
                          if (c < best) best = c;
                      }
                      nd[x] = best;
                  }
                  for (var t = 0; t < vals.length; t++) freq[vals[t]] = 0;
                  dp = nd;
              }
              return dp[0];
          };
        `,
        typescript: code`
          function minChanges(nums: number[], k: number): number {
              var n = nums.length, mx = 0;
              for (var i = 0; i < n; i++) if (nums[i] > mx) mx = nums[i];
              var B = 1;
              while (B <= mx) B <<= 1;
              var INF = 1 << 29, dp: number[] = [], freq: number[] = [];
              for (var x = 0; x < B; x++) { dp.push(INF); freq.push(0); }
              dp[0] = 0;
              for (var g = 0; g < k; g++) {
                  var vals: number[] = [], sz = 0;
                  for (var i = g; i < n; i += k) {
                      if (freq[nums[i]] === 0) vals.push(nums[i]);
                      freq[nums[i]]++;
                      sz++;
                  }
                  var low = INF;
                  for (var x = 0; x < B; x++) if (dp[x] < low) low = dp[x];
                  var nd: number[] = [];
                  for (var x = 0; x < B; x++) {
                      var best = low + sz;
                      for (var t = 0; t < vals.length; t++) {
                          var c = dp[x ^ vals[t]] + sz - freq[vals[t]];
                          if (c < best) best = c;
                      }
                      nd.push(best);
                  }
                  for (var t = 0; t < vals.length; t++) freq[vals[t]] = 0;
                  dp = nd;
              }
              return dp[0];
          }
        `,
        java: code`
          public static int minChanges(int[] nums, int k) {
              int n = nums.length, mx = 0;
              for (int v : nums) mx = Math.max(mx, v);
              int B = 1;
              while (B <= mx) B <<= 1;
              final int INF = 1 << 29;
              int[] dp = new int[B], freq = new int[B], vals = new int[n];
              Arrays.fill(dp, INF);
              dp[0] = 0;
              for (int g = 0; g < k; g++) {
                  int cnt = 0, sz = 0;
                  for (int i = g; i < n; i += k) {
                      if (freq[nums[i]] == 0) vals[cnt++] = nums[i];
                      freq[nums[i]]++;
                      sz++;
                  }
                  int low = INF;
                  for (int x = 0; x < B; x++) low = Math.min(low, dp[x]);
                  int[] nd = new int[B];
                  for (int x = 0; x < B; x++) {
                      int best = low + sz;
                      for (int t = 0; t < cnt; t++) best = Math.min(best, dp[x ^ vals[t]] + sz - freq[vals[t]]);
                      nd[x] = best;
                  }
                  for (int t = 0; t < cnt; t++) freq[vals[t]] = 0;
                  dp = nd;
              }
              return dp[0];
          }
        `,
        cpp: code`
          int minChanges(vector<int>& nums, int k) {
              int n = nums.size(), mx = 0;
              for (int v : nums) mx = max(mx, v);
              int B = 1;
              while (B <= mx) B <<= 1;
              const int INF = 1 << 29;
              vector<int> dp(B, INF), freq(B, 0);
              dp[0] = 0;
              for (int g = 0; g < k; g++) {
                  vector<int> vals;
                  int sz = 0;
                  for (int i = g; i < n; i += k) {
                      if (freq[nums[i]] == 0) vals.push_back(nums[i]);
                      freq[nums[i]]++;
                      sz++;
                  }
                  int low = *min_element(dp.begin(), dp.end());
                  vector<int> nd(B);
                  for (int x = 0; x < B; x++) {
                      int best = low + sz;
                      for (int v : vals) best = min(best, dp[x ^ v] + sz - freq[v]);
                      nd[x] = best;
                  }
                  for (int v : vals) freq[v] = 0;
                  dp = nd;
              }
              return dp[0];
          }
        `,
        c: code`
          int minChanges(int* nums, int numsSize, int k) {
              int n = numsSize, mx = 0;
              for (int i = 0; i < n; i++) if (nums[i] > mx) mx = nums[i];
              int B = 1;
              while (B <= mx) B <<= 1;
              const int INF = 1 << 29;
              int* dp = (int*)malloc(sizeof(int) * B);
              int* nd = (int*)malloc(sizeof(int) * B);
              int* freq = (int*)calloc(B, sizeof(int));
              int* vals = (int*)malloc(sizeof(int) * (n + 1));
              for (int x = 0; x < B; x++) dp[x] = INF;
              dp[0] = 0;
              for (int g = 0; g < k; g++) {
                  int cnt = 0, sz = 0;
                  for (int i = g; i < n; i += k) {
                      if (freq[nums[i]] == 0) vals[cnt++] = nums[i];
                      freq[nums[i]]++;
                      sz++;
                  }
                  int low = INF;
                  for (int x = 0; x < B; x++) if (dp[x] < low) low = dp[x];
                  for (int x = 0; x < B; x++) {
                      int best = low + sz;
                      for (int t = 0; t < cnt; t++) {
                          int c = dp[x ^ vals[t]] + sz - freq[vals[t]];
                          if (c < best) best = c;
                      }
                      nd[x] = best;
                  }
                  for (int t = 0; t < cnt; t++) freq[vals[t]] = 0;
                  int* tmp = dp; dp = nd; nd = tmp;
              }
              int ans = dp[0];
              free(dp); free(nd); free(freq); free(vals);
              return ans;
          }
        `,
        csharp: code`
          public static int MinChanges(int[] nums, int k)
          {
              int n = nums.Length, mx = 0;
              foreach (int v in nums) mx = Math.Max(mx, v);
              int B = 1;
              while (B <= mx) B <<= 1;
              const int INF = 1 << 29;
              int[] dp = new int[B], freq = new int[B], vals = new int[n];
              for (int x = 0; x < B; x++) dp[x] = INF;
              dp[0] = 0;
              for (int g = 0; g < k; g++)
              {
                  int cnt = 0, sz = 0;
                  for (int i = g; i < n; i += k)
                  {
                      if (freq[nums[i]] == 0) vals[cnt++] = nums[i];
                      freq[nums[i]]++;
                      sz++;
                  }
                  int low = INF;
                  for (int x = 0; x < B; x++) low = Math.Min(low, dp[x]);
                  int[] nd = new int[B];
                  for (int x = 0; x < B; x++)
                  {
                      int best = low + sz;
                      for (int t = 0; t < cnt; t++) best = Math.Min(best, dp[x ^ vals[t]] + sz - freq[vals[t]]);
                      nd[x] = best;
                  }
                  for (int t = 0; t < cnt; t++) freq[vals[t]] = 0;
                  dp = nd;
              }
              return dp[0];
          }
        `,
        go: code`
          func minChanges(nums []int, k int) int {
              n, mx := len(nums), 0
              for _, v := range nums {
                  if v > mx {
                      mx = v
                  }
              }
              B := 1
              for B <= mx {
                  B <<= 1
              }
              const INF = 1 << 29
              dp := make([]int, B)
              freq := make([]int, B)
              for x := range dp {
                  dp[x] = INF
              }
              dp[0] = 0
              for g := 0; g < k; g++ {
                  vals := []int{}
                  sz := 0
                  for i := g; i < n; i += k {
                      if freq[nums[i]] == 0 {
                          vals = append(vals, nums[i])
                      }
                      freq[nums[i]]++
                      sz++
                  }
                  low := INF
                  for _, d := range dp {
                      if d < low {
                          low = d
                      }
                  }
                  nd := make([]int, B)
                  for x := 0; x < B; x++ {
                      best := low + sz
                      for _, v := range vals {
                          if c := dp[x^v] + sz - freq[v]; c < best {
                              best = c
                          }
                      }
                      nd[x] = best
                  }
                  for _, v := range vals {
                      freq[v] = 0
                  }
                  dp = nd
              }
              return dp[0]
          }
        `,
        kotlin: code`
          fun minChanges(nums: IntArray, k: Int): Int {
              val n = nums.size
              val mx = nums.maxOrNull() ?: 0
              var b = 1
              while (b <= mx) b = b shl 1
              val inf = 1 shl 29
              var dp = IntArray(b) { inf }
              val freq = IntArray(b)
              val vals = IntArray(n)
              dp[0] = 0
              for (g in 0 until k) {
                  var cnt = 0
                  var sz = 0
                  var i = g
                  while (i < n) {
                      if (freq[nums[i]] == 0) vals[cnt++] = nums[i]
                      freq[nums[i]]++
                      sz++
                      i += k
                  }
                  var low = inf
                  for (d in dp) if (d < low) low = d
                  val nd = IntArray(b)
                  for (x in 0 until b) {
                      var best = low + sz
                      for (t in 0 until cnt) best = minOf(best, dp[x xor vals[t]] + sz - freq[vals[t]])
                      nd[x] = best
                  }
                  for (t in 0 until cnt) freq[vals[t]] = 0
                  dp = nd
              }
              return dp[0]
          }
        `,
        swift: code`
          func minChanges(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              let mx = nums.max() ?? 0
              var B = 1
              while B <= mx { B <<= 1 }
              let inf = 1 << 29
              var dp = [Int](repeating: inf, count: B)
              var freq = [Int](repeating: 0, count: B)
              dp[0] = 0
              for g in 0..<k {
                  var vals = [Int]()
                  var sz = 0
                  var i = g
                  while i < n {
                      if freq[nums[i]] == 0 { vals.append(nums[i]) }
                      freq[nums[i]] += 1
                      sz += 1
                      i += k
                  }
                  let low = dp.min()!
                  var nd = [Int](repeating: 0, count: B)
                  for x in 0..<B {
                      var best = low + sz
                      for v in vals { best = min(best, dp[x ^ v] + sz - freq[v]) }
                      nd[x] = best
                  }
                  for v in vals { freq[v] = 0 }
                  dp = nd
              }
              return dp[0]
          }
        `,
        rust: code`
          fn minChanges(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let k = k as usize;
              let mx = *nums.iter().max().unwrap() as usize;
              let mut b = 1usize;
              while b <= mx {
                  b <<= 1;
              }
              let inf = 1i32 << 29;
              let mut dp = vec![inf; b];
              let mut freq = vec![0i32; b];
              dp[0] = 0;
              for g in 0..k {
                  let mut vals: Vec<usize> = Vec::new();
                  let mut sz = 0i32;
                  let mut i = g;
                  while i < n {
                      let v = nums[i] as usize;
                      if freq[v] == 0 {
                          vals.push(v);
                      }
                      freq[v] += 1;
                      sz += 1;
                      i += k;
                  }
                  let low = *dp.iter().min().unwrap();
                  let mut nd = vec![0i32; b];
                  for x in 0..b {
                      let mut best = low + sz;
                      for &v in vals.iter() {
                          best = best.min(dp[x ^ v] + sz - freq[v]);
                      }
                      nd[x] = best;
                  }
                  for &v in vals.iter() {
                      freq[v] = 0;
                  }
                  dp = nd;
              }
              dp[0]
          }
        `,
        php: code`
          function minChanges($nums, $k) {
              $n = count($nums);
              $mx = max($nums);
              $B = 1;
              while ($B <= $mx) $B <<= 1;
              $INF = 1 << 29;
              $dp = array_fill(0, $B, $INF);
              $dp[0] = 0;
              for ($g = 0; $g < $k; $g++) {
                  $freq = [];
                  $sz = 0;
                  for ($i = $g; $i < $n; $i += $k) {
                      $freq[$nums[$i]] = ($freq[$nums[$i]] ?? 0) + 1;
                      $sz++;
                  }
                  $low = min($dp) + $sz;
                  $nd = array_fill(0, $B, $low);
                  for ($x = 0; $x < $B; $x++) {
                      $best = $low;
                      foreach ($freq as $v => $f) {
                          $c = $dp[$x ^ $v] + $sz - $f;
                          if ($c < $best) $best = $c;
                      }
                      $nd[$x] = $best;
                  }
                  $dp = $nd;
              }
              return $dp[0];
          }
        `,
        ruby: code`
          def minChanges(nums, k)
            n = nums.length
            b = 1
            b <<= 1 while b <= nums.max
            inf = 1 << 29
            dp = Array.new(b, inf)
            dp[0] = 0
            k.times do |g|
              freq = Hash.new(0)
              sz = 0
              g.step(n - 1, k) do |i|
                freq[nums[i]] += 1
                sz += 1
              end
              low = dp.min + sz
              items = freq.to_a
              dp = Array.new(b) do |x|
                best = low
                items.each do |v, f|
                  c = dp[x ^ v] + sz - f
                  best = c if c < best
                end
                best
              end
            end
            dp[0]
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Groups Getting Fresh Donuts (LC 1815) ─────
  (() => {
    // Plain memoised search over how many groups of each remainder are left
    // (no pairing shortcut), keyed by the count vector.
    const ref = (batchSize: number, groups: number[]) => {
      const b = batchSize, cnt = new Array(b).fill(0);
      for (const g of groups) cnt[g % b]++;
      const memo = new Map<string, number>();
      const f = (left: number): number => {
        const key = cnt.join(",");
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = 0;
        for (let r = 0; r < b; r++) {
          if (!cnt[r]) continue;
          cnt[r]--;
          best = Math.max(best, (left === 0 ? 1 : 0) + f((left + r) % b));
          cnt[r]++;
        }
        memo.set(key, best);
        return best;
      };
      return f(0);
    };
    return {
      slug: "maximum-number-of-groups-getting-fresh-donuts",
      title: "Maximum Number of Groups Getting Fresh Donuts",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Memoization", "Bitmask", "Google"],
      signature: { funcName: "maxHappyGroups", params: [{ name: "batchSize", type: "int" as const }, { name: "groups", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A donut shop bakes donuts in batches of exactly `batchSize`, and it never starts a new batch until every donut of the current batch has been served. Groups of customers arrive: group `i` has `groups[i]` people, and all members of a group are served one after another before the next group begins. Every customer gets one donut.\n\nA group is **happy** if its first customer receives a freshly baked donut — that is, the batch in progress had no donuts left over from earlier customers when this group started.\n\nYou may arrange the groups in any order. Return the maximum possible number of happy groups.",
        [
          { in: "batchSize = 3, groups = [1,2,3,4,5,6]", out: "4", note: "One good order is [6,2,4,5,1,3]: groups 6, 2, 4 and 1 each start on a fresh batch." },
          { in: "batchSize = 4, groups = [1,3,2,5,2,2,1,6]", out: "4" },
          { in: "batchSize = 1, groups = [7,7,7]", out: "3", note: "With batches of one donut, every group starts fresh." },
        ],
        ["1 <= batchSize <= 9", "1 <= groups.length <= 30", "1 <= groups[i] <= 10^9"]),
      hints: [
        "Only `groups[i] % batchSize` matters. Groups whose size is a multiple of `batchSize` can all go first, and each of them is happy.",
        "A group with remainder `r` followed by one with remainder `batchSize - r` brings the leftover back to zero: greedily pair them up, each pair contributing one happy group.",
        "What remains is small: count how many groups of each remainder are left and search over those counts, where the leftover is fixed by which groups have been served. Memoise on the counts.",
      ],
      editorial: explain({
        idea: "Reduce every group to its remainder modulo `batchSize`. The state of the arrangement is then just how many groups of each remainder are still waiting — the current leftover is determined by what has been served. Greedy pairing of complementary remainders shrinks that state space to a few thousand.",
        steps: [
          "Count `cnt[r]` groups per remainder. Start with `answer = cnt[0]` (they go first, each happy).",
          "For `r < batchSize - r`, pair `p = min(cnt[r], cnt[batchSize - r])` groups: each pair adds 1. For `r == batchSize - r`, pairs within the class add `cnt[r] / 2`. Remove the paired groups.",
          "Encode the remaining counts as a mixed-radix index; `dp[u]` is the most happy groups among the groups used in state `u`. Iterate states in increasing order; the served sum modulo `batchSize` tells whether the next group is happy.",
          "Return `answer + dp[all used]`.",
        ],
        why: "A group is happy exactly when the remainders served before it sum to 0 modulo `batchSize`, so the outcome depends only on the multiset of remainders served, which the count vector captures. Pairing complementary remainders is safe: in any arrangement, rearranging so each such pair is adjacent never loses a happy group, since a pair restores the leftover to zero and contributes one happy start. After pairing, at most one of each complementary pair of classes is non-empty, so the remaining state count is tiny.",
        time: "O(S * batchSize) where S is the number of count vectors (a few thousand)",
        space: "O(S)",
        pitfalls: [
          "Large group sizes (up to 10^9) only matter modulo `batchSize`; never simulate donuts.",
          "Remainder classes with `r == batchSize - r` pair with themselves.",
          "The first group served is always happy, even after the zero-remainder groups.",
        ],
      }),
      examples: [
        { input: "3\n[1,2,3,4,5,6]", expectedOutput: "4" },
        { input: "4\n[1,3,2,5,2,2,1,6]", expectedOutput: "4" },
        { input: "1\n[7,7,7]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const b = ri(rng, 1, 9);
        const top = b <= 5 ? 30 : pick(rng, [6, 12, 16]);
        const n = ri(rng, 1, pick(rng, [1, 5, top]));
        const big = rng() < 0.3;
        const groups = Array.from({ length: n }, () => (big ? ri(rng, 1, 1000000000) : ri(rng, 1, 20)));
        return { input: `${b}\n${fmtIntArr(groups)}`, expectedOutput: String(ref(b, groups)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxHappyGroups(batchSize: int, groups: List[int]) -> int:
              b = batchSize
              cnt = [0] * b
              for g in groups:
                  cnt[g % b] += 1
              ans = cnt[0]
              for r in range(1, b):
                  s = b - r
                  if r < s:
                      p = min(cnt[r], cnt[s])
                      ans += p
                      cnt[r] -= p
                      cnt[s] -= p
                  elif r == s:
                      ans += cnt[r] // 2
                      cnt[r] %= 2
              stride = [0] * b
              total = 1
              for r in range(1, b):
                  stride[r] = total
                  total *= cnt[r] + 1
              dp = [0] * total
              for idx in range(total):
                  used = [(idx // stride[r]) % (cnt[r] + 1) if r else 0 for r in range(b)]
                  happy = 1 if sum(used[r] * r for r in range(b)) % b == 0 else 0
                  cur = dp[idx] + happy
                  for r in range(1, b):
                      if used[r] < cnt[r] and cur > dp[idx + stride[r]]:
                          dp[idx + stride[r]] = cur
              return ans + dp[total - 1]
        `,
        javascript: code`
          var maxHappyGroups = function(batchSize, groups) {
              var b = batchSize, cnt = new Array(b).fill(0);
              for (var i = 0; i < groups.length; i++) cnt[groups[i] % b]++;
              var ans = cnt[0];
              for (var r = 1; r < b; r++) {
                  var s = b - r;
                  if (r < s) {
                      var p = Math.min(cnt[r], cnt[s]);
                      ans += p; cnt[r] -= p; cnt[s] -= p;
                  } else if (r === s) {
                      ans += Math.floor(cnt[r] / 2);
                      cnt[r] %= 2;
                  }
              }
              var stride = new Array(b).fill(0), total = 1;
              for (var r = 1; r < b; r++) { stride[r] = total; total *= cnt[r] + 1; }
              var dp = new Array(total).fill(0), used = new Array(b).fill(0);
              for (var idx = 0; idx < total; idx++) {
                  var sum = 0;
                  for (var r = 1; r < b; r++) {
                      used[r] = Math.floor(idx / stride[r]) % (cnt[r] + 1);
                      sum += used[r] * r;
                  }
                  var cur = dp[idx] + (sum % b === 0 ? 1 : 0);
                  for (var r = 1; r < b; r++) {
                      if (used[r] < cnt[r] && cur > dp[idx + stride[r]]) dp[idx + stride[r]] = cur;
                  }
              }
              return ans + dp[total - 1];
          };
        `,
        typescript: code`
          function maxHappyGroups(batchSize: number, groups: number[]): number {
              var b = batchSize, cnt: number[] = [], stride: number[] = [], used: number[] = [];
              for (var r = 0; r < b; r++) { cnt.push(0); stride.push(0); used.push(0); }
              for (var i = 0; i < groups.length; i++) cnt[groups[i] % b]++;
              var ans = cnt[0];
              for (var r = 1; r < b; r++) {
                  var s = b - r;
                  if (r < s) {
                      var p = Math.min(cnt[r], cnt[s]);
                      ans += p; cnt[r] -= p; cnt[s] -= p;
                  } else if (r === s) {
                      ans += Math.floor(cnt[r] / 2);
                      cnt[r] %= 2;
                  }
              }
              var total = 1;
              for (var r = 1; r < b; r++) { stride[r] = total; total *= cnt[r] + 1; }
              var dp: number[] = [];
              for (var idx = 0; idx < total; idx++) dp.push(0);
              for (var idx = 0; idx < total; idx++) {
                  var sum = 0;
                  for (var r = 1; r < b; r++) {
                      used[r] = Math.floor(idx / stride[r]) % (cnt[r] + 1);
                      sum += used[r] * r;
                  }
                  var cur = dp[idx] + (sum % b === 0 ? 1 : 0);
                  for (var r = 1; r < b; r++) {
                      if (used[r] < cnt[r] && cur > dp[idx + stride[r]]) dp[idx + stride[r]] = cur;
                  }
              }
              return ans + dp[total - 1];
          }
        `,
        java: code`
          public static int maxHappyGroups(int batchSize, int[] groups) {
              int b = batchSize;
              int[] cnt = new int[b];
              for (int g : groups) cnt[g % b]++;
              int ans = cnt[0];
              for (int r = 1; r < b; r++) {
                  int s = b - r;
                  if (r < s) {
                      int p = Math.min(cnt[r], cnt[s]);
                      ans += p; cnt[r] -= p; cnt[s] -= p;
                  } else if (r == s) {
                      ans += cnt[r] / 2;
                      cnt[r] %= 2;
                  }
              }
              int[] stride = new int[b];
              int total = 1;
              for (int r = 1; r < b; r++) { stride[r] = total; total *= cnt[r] + 1; }
              int[] dp = new int[total], used = new int[b];
              for (int idx = 0; idx < total; idx++) {
                  int sum = 0;
                  for (int r = 1; r < b; r++) {
                      used[r] = (idx / stride[r]) % (cnt[r] + 1);
                      sum += used[r] * r;
                  }
                  int cur = dp[idx] + (sum % b == 0 ? 1 : 0);
                  for (int r = 1; r < b; r++) {
                      if (used[r] < cnt[r] && cur > dp[idx + stride[r]]) dp[idx + stride[r]] = cur;
                  }
              }
              return ans + dp[total - 1];
          }
        `,
        cpp: code`
          int maxHappyGroups(int batchSize, vector<int>& groups) {
              int b = batchSize;
              vector<int> cnt(b, 0);
              for (int g : groups) cnt[g % b]++;
              int ans = cnt[0];
              for (int r = 1; r < b; r++) {
                  int s = b - r;
                  if (r < s) {
                      int p = min(cnt[r], cnt[s]);
                      ans += p; cnt[r] -= p; cnt[s] -= p;
                  } else if (r == s) {
                      ans += cnt[r] / 2;
                      cnt[r] %= 2;
                  }
              }
              vector<int> stride(b, 0), used(b, 0);
              int total = 1;
              for (int r = 1; r < b; r++) { stride[r] = total; total *= cnt[r] + 1; }
              vector<int> dp(total, 0);
              for (int idx = 0; idx < total; idx++) {
                  int sum = 0;
                  for (int r = 1; r < b; r++) {
                      used[r] = (idx / stride[r]) % (cnt[r] + 1);
                      sum += used[r] * r;
                  }
                  int cur = dp[idx] + (sum % b == 0 ? 1 : 0);
                  for (int r = 1; r < b; r++) {
                      if (used[r] < cnt[r] && cur > dp[idx + stride[r]]) dp[idx + stride[r]] = cur;
                  }
              }
              return ans + dp[total - 1];
          }
        `,
        c: code`
          int maxHappyGroups(int batchSize, int* groups, int groupsSize) {
              int b = batchSize;
              int cnt[9] = {0}, stride[9] = {0}, used[9] = {0};
              for (int i = 0; i < groupsSize; i++) cnt[groups[i] % b]++;
              int ans = cnt[0];
              for (int r = 1; r < b; r++) {
                  int s = b - r;
                  if (r < s) {
                      int p = cnt[r] < cnt[s] ? cnt[r] : cnt[s];
                      ans += p; cnt[r] -= p; cnt[s] -= p;
                  } else if (r == s) {
                      ans += cnt[r] / 2;
                      cnt[r] %= 2;
                  }
              }
              int total = 1;
              for (int r = 1; r < b; r++) { stride[r] = total; total *= cnt[r] + 1; }
              int* dp = (int*)calloc(total, sizeof(int));
              for (int idx = 0; idx < total; idx++) {
                  int sum = 0;
                  for (int r = 1; r < b; r++) {
                      used[r] = (idx / stride[r]) % (cnt[r] + 1);
                      sum += used[r] * r;
                  }
                  int cur = dp[idx] + (sum % b == 0 ? 1 : 0);
                  for (int r = 1; r < b; r++) {
                      if (used[r] < cnt[r] && cur > dp[idx + stride[r]]) dp[idx + stride[r]] = cur;
                  }
              }
              int res = ans + dp[total - 1];
              free(dp);
              return res;
          }
        `,
        csharp: code`
          public static int MaxHappyGroups(int batchSize, int[] groups)
          {
              int b = batchSize;
              int[] cnt = new int[b];
              foreach (int g in groups) cnt[g % b]++;
              int ans = cnt[0];
              for (int r = 1; r < b; r++)
              {
                  int s = b - r;
                  if (r < s)
                  {
                      int p = Math.Min(cnt[r], cnt[s]);
                      ans += p; cnt[r] -= p; cnt[s] -= p;
                  }
                  else if (r == s)
                  {
                      ans += cnt[r] / 2;
                      cnt[r] %= 2;
                  }
              }
              int[] stride = new int[b], used = new int[b];
              int total = 1;
              for (int r = 1; r < b; r++) { stride[r] = total; total *= cnt[r] + 1; }
              int[] dp = new int[total];
              for (int idx = 0; idx < total; idx++)
              {
                  int sum = 0;
                  for (int r = 1; r < b; r++)
                  {
                      used[r] = (idx / stride[r]) % (cnt[r] + 1);
                      sum += used[r] * r;
                  }
                  int cur = dp[idx] + (sum % b == 0 ? 1 : 0);
                  for (int r = 1; r < b; r++)
                  {
                      if (used[r] < cnt[r] && cur > dp[idx + stride[r]]) dp[idx + stride[r]] = cur;
                  }
              }
              return ans + dp[total - 1];
          }
        `,
        go: code`
          func maxHappyGroups(batchSize int, groups []int) int {
              b := batchSize
              cnt := make([]int, b)
              for _, g := range groups {
                  cnt[g%b]++
              }
              ans := cnt[0]
              for r := 1; r < b; r++ {
                  s := b - r
                  if r < s {
                      p := cnt[r]
                      if cnt[s] < p {
                          p = cnt[s]
                      }
                      ans += p
                      cnt[r] -= p
                      cnt[s] -= p
                  } else if r == s {
                      ans += cnt[r] / 2
                      cnt[r] %= 2
                  }
              }
              stride := make([]int, b)
              used := make([]int, b)
              total := 1
              for r := 1; r < b; r++ {
                  stride[r] = total
                  total *= cnt[r] + 1
              }
              dp := make([]int, total)
              for idx := 0; idx < total; idx++ {
                  sum := 0
                  for r := 1; r < b; r++ {
                      used[r] = (idx / stride[r]) % (cnt[r] + 1)
                      sum += used[r] * r
                  }
                  cur := dp[idx]
                  if sum%b == 0 {
                      cur++
                  }
                  for r := 1; r < b; r++ {
                      if used[r] < cnt[r] && cur > dp[idx+stride[r]] {
                          dp[idx+stride[r]] = cur
                      }
                  }
              }
              return ans + dp[total-1]
          }
        `,
        kotlin: code`
          fun maxHappyGroups(batchSize: Int, groups: IntArray): Int {
              val b = batchSize
              val cnt = IntArray(b)
              for (g in groups) cnt[g % b]++
              var ans = cnt[0]
              for (r in 1 until b) {
                  val s = b - r
                  if (r < s) {
                      val p = minOf(cnt[r], cnt[s])
                      ans += p
                      cnt[r] -= p
                      cnt[s] -= p
                  } else if (r == s) {
                      ans += cnt[r] / 2
                      cnt[r] %= 2
                  }
              }
              val stride = IntArray(b)
              val used = IntArray(b)
              var total = 1
              for (r in 1 until b) {
                  stride[r] = total
                  total *= cnt[r] + 1
              }
              val dp = IntArray(total)
              for (idx in 0 until total) {
                  var sum = 0
                  for (r in 1 until b) {
                      used[r] = (idx / stride[r]) % (cnt[r] + 1)
                      sum += used[r] * r
                  }
                  val cur = dp[idx] + (if (sum % b == 0) 1 else 0)
                  for (r in 1 until b) {
                      if (used[r] < cnt[r] && cur > dp[idx + stride[r]]) dp[idx + stride[r]] = cur
                  }
              }
              return ans + dp[total - 1]
          }
        `,
        swift: code`
          func maxHappyGroups(_ batchSize: Int, _ groups: [Int]) -> Int {
              let b = batchSize
              var cnt = [Int](repeating: 0, count: b)
              for g in groups { cnt[g % b] += 1 }
              var ans = cnt[0]
              for r in stride(from: 1, to: b, by: 1) {
                  let s = b - r
                  if r < s {
                      let p = min(cnt[r], cnt[s])
                      ans += p
                      cnt[r] -= p
                      cnt[s] -= p
                  } else if r == s {
                      ans += cnt[r] / 2
                      cnt[r] %= 2
                  }
              }
              var step = [Int](repeating: 0, count: b)
              var used = [Int](repeating: 0, count: b)
              var total = 1
              for r in stride(from: 1, to: b, by: 1) {
                  step[r] = total
                  total *= cnt[r] + 1
              }
              var dp = [Int](repeating: 0, count: total)
              for idx in 0..<total {
                  var sum = 0
                  for r in stride(from: 1, to: b, by: 1) {
                      used[r] = (idx / step[r]) % (cnt[r] + 1)
                      sum += used[r] * r
                  }
                  let cur = dp[idx] + (sum % b == 0 ? 1 : 0)
                  for r in stride(from: 1, to: b, by: 1) where used[r] < cnt[r] && cur > dp[idx + step[r]] {
                      dp[idx + step[r]] = cur
                  }
              }
              return ans + dp[total - 1]
          }
        `,
        rust: code`
          fn maxHappyGroups(batch_size: i32, groups: Vec<i32>) -> i32 {
              let b = batch_size as usize;
              let mut cnt = vec![0usize; b];
              for &g in groups.iter() {
                  cnt[g as usize % b] += 1;
              }
              let mut ans = cnt[0];
              for r in 1..b {
                  let s = b - r;
                  if r < s {
                      let p = cnt[r].min(cnt[s]);
                      ans += p;
                      cnt[r] -= p;
                      cnt[s] -= p;
                  } else if r == s {
                      ans += cnt[r] / 2;
                      cnt[r] %= 2;
                  }
              }
              let mut stride = vec![0usize; b];
              let mut used = vec![0usize; b];
              let mut total = 1usize;
              for r in 1..b {
                  stride[r] = total;
                  total *= cnt[r] + 1;
              }
              let mut dp = vec![0usize; total];
              for idx in 0..total {
                  let mut sum = 0usize;
                  for r in 1..b {
                      used[r] = (idx / stride[r]) % (cnt[r] + 1);
                      sum += used[r] * r;
                  }
                  let cur = dp[idx] + if sum % b == 0 { 1 } else { 0 };
                  for r in 1..b {
                      if used[r] < cnt[r] && cur > dp[idx + stride[r]] {
                          dp[idx + stride[r]] = cur;
                      }
                  }
              }
              (ans + dp[total - 1]) as i32
          }
        `,
        php: code`
          function maxHappyGroups($batchSize, $groups) {
              $b = $batchSize;
              $cnt = array_fill(0, $b, 0);
              foreach ($groups as $g) $cnt[$g % $b]++;
              $ans = $cnt[0];
              for ($r = 1; $r < $b; $r++) {
                  $s = $b - $r;
                  if ($r < $s) {
                      $p = min($cnt[$r], $cnt[$s]);
                      $ans += $p;
                      $cnt[$r] -= $p;
                      $cnt[$s] -= $p;
                  } elseif ($r == $s) {
                      $ans += intdiv($cnt[$r], 2);
                      $cnt[$r] %= 2;
                  }
              }
              $stride = array_fill(0, $b, 0);
              $used = array_fill(0, $b, 0);
              $total = 1;
              for ($r = 1; $r < $b; $r++) {
                  $stride[$r] = $total;
                  $total *= $cnt[$r] + 1;
              }
              $dp = array_fill(0, $total, 0);
              for ($idx = 0; $idx < $total; $idx++) {
                  $sum = 0;
                  for ($r = 1; $r < $b; $r++) {
                      $used[$r] = intdiv($idx, $stride[$r]) % ($cnt[$r] + 1);
                      $sum += $used[$r] * $r;
                  }
                  $cur = $dp[$idx] + ($sum % $b == 0 ? 1 : 0);
                  for ($r = 1; $r < $b; $r++) {
                      if ($used[$r] < $cnt[$r] && $cur > $dp[$idx + $stride[$r]]) $dp[$idx + $stride[$r]] = $cur;
                  }
              }
              return $ans + $dp[$total - 1];
          }
        `,
        ruby: code`
          def maxHappyGroups(batchSize, groups)
            b = batchSize
            cnt = Array.new(b, 0)
            groups.each { |g| cnt[g % b] += 1 }
            ans = cnt[0]
            (1...b).each do |r|
              s = b - r
              if r < s
                p = [cnt[r], cnt[s]].min
                ans += p
                cnt[r] -= p
                cnt[s] -= p
              elsif r == s
                ans += cnt[r] / 2
                cnt[r] %= 2
              end
            end
            stride = Array.new(b, 0)
            used = Array.new(b, 0)
            total = 1
            (1...b).each do |r|
              stride[r] = total
              total *= cnt[r] + 1
            end
            dp = Array.new(total, 0)
            total.times do |idx|
              sum = 0
              (1...b).each do |r|
                used[r] = (idx / stride[r]) % (cnt[r] + 1)
                sum += used[r] * r
              end
              cur = dp[idx] + (sum % b == 0 ? 1 : 0)
              (1...b).each do |r|
                nx = idx + stride[r]
                dp[nx] = cur if used[r] < cnt[r] && cur > dp[nx]
              end
            end
            ans + dp[total - 1]
          end
        `,
      },
    };
  })(),

  // ── Egg Drop With 2 Eggs and N Floors (LC 1884) ─────────────────
  (() => {
    // The general egg-drop recurrence for two eggs, tabulated once:
    // drop at x — breaks: x - 1 floors with one egg; survives: n - x with two.
    const table: number[] = [0];
    for (let m = 1; m <= 1000; m++) {
      let best = Infinity;
      for (let x = 1; x <= m; x++) best = Math.min(best, 1 + Math.max(x - 1, table[m - x]));
      table.push(best);
    }
    const ref = (n: number) => table[n];
    return {
      slug: "egg-drop-with-2-eggs-and-n-floors",
      title: "Egg Drop With 2 Eggs and N Floors",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Google", "Amazon", "Goldman Sachs"],
      signature: { funcName: "twoEggDrop", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have **two identical eggs** and a building with floors `1` to `n`. There is an unknown floor `f` with `0 <= f <= n`: an egg dropped from any floor higher than `f` breaks, and an egg dropped from floor `f` or lower survives.\n\nIn one move you drop an unbroken egg from any floor. A broken egg is gone; an egg that survives can be dropped again.\n\nReturn the minimum number of moves that guarantees you find `f` exactly, whatever its value.",
        [
          { in: "n = 2", out: "2", note: "Drop from floor 1: if it breaks, f = 0; otherwise drop from floor 2 to decide between f = 1 and f = 2." },
          { in: "n = 100", out: "14", note: "Drop the first egg from floors 14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100 — each step 1 shorter — and scan with the second egg after it breaks." },
          { in: "n = 1", out: "1" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "Once the first egg breaks, the second egg must test the floors in between one at a time, from the bottom up.",
        "If you are allowed `k` moves in total, the first drop can be at most from floor `k` (otherwise a break leaves too many floors to scan). After it survives, the next jump can be at most `k - 1` floors, and so on.",
        "So `k` moves cover `k + (k - 1) + ... + 1 = k(k + 1) / 2` floors. Find the smallest `k` with `k(k + 1) / 2 >= n` — or use the DP `dp[m] = min over x of 1 + max(x - 1, dp[m - x])`.",
      ],
      editorial: explain({
        idea: "With `k` moves and two eggs, the first egg's drops must shrink by one floor each time, so `k` moves can resolve at most `k(k + 1) / 2` floors — and that many is achievable.",
        steps: [
          "Start with `k = 0`.",
          "While `k(k + 1) / 2 < n`, increase `k`.",
          "Return `k`.",
        ],
        why: "Suppose `k` moves remain and both eggs are intact. If the first egg breaks on its drop, the second egg has `k - 1` moves to test every floor below one by one, so the drop can be at most `k - 1` floors above the last safe floor — that is, it covers `k` floors in its gap. If it survives, the problem repeats with `k - 1` moves. So the floors covered are at most `k + (k - 1) + ... + 1`, and dropping exactly at those gaps achieves it. The equivalent DP `dp[m] = min over x of 1 + max(x - 1, dp[m - x])` gives the same numbers.",
        time: "O(sqrt(n))",
        space: "O(1)",
        pitfalls: [
          "Binary search on floors is wrong here: after the first egg breaks there is only one egg left, which must be used linearly.",
          "`f` may be 0 (every floor breaks the egg) — the count of possibilities is `n + 1`, which the triangular bound already accounts for.",
        ],
      }),
      examples: [
        { input: "2", expectedOutput: "2" },
        { input: "100", expectedOutput: "14" },
        { input: "1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? pick(rng, [1, 2, 3, 6, 10, 990, 991, 1000]) : ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def twoEggDrop(n: int) -> int:
              k = 0
              while k * (k + 1) // 2 < n:
                  k += 1
              return k
        `,
        javascript: code`
          var twoEggDrop = function(n) {
              var k = 0;
              while (k * (k + 1) / 2 < n) k++;
              return k;
          };
        `,
        typescript: code`
          function twoEggDrop(n: number): number {
              var k = 0;
              while (k * (k + 1) / 2 < n) k++;
              return k;
          }
        `,
        java: code`
          public static int twoEggDrop(int n) {
              int k = 0;
              while (k * (k + 1) / 2 < n) k++;
              return k;
          }
        `,
        cpp: code`
          int twoEggDrop(int n) {
              int k = 0;
              while (k * (k + 1) / 2 < n) k++;
              return k;
          }
        `,
        c: code`
          int twoEggDrop(int n) {
              int k = 0;
              while (k * (k + 1) / 2 < n) k++;
              return k;
          }
        `,
        csharp: code`
          public static int TwoEggDrop(int n)
          {
              int k = 0;
              while (k * (k + 1) / 2 < n) k++;
              return k;
          }
        `,
        go: code`
          func twoEggDrop(n int) int {
              k := 0
              for k*(k+1)/2 < n {
                  k++
              }
              return k
          }
        `,
        kotlin: code`
          fun twoEggDrop(n: Int): Int {
              var k = 0
              while (k * (k + 1) / 2 < n) k++
              return k
          }
        `,
        swift: code`
          func twoEggDrop(_ n: Int) -> Int {
              var k = 0
              while k * (k + 1) / 2 < n { k += 1 }
              return k
          }
        `,
        rust: code`
          fn twoEggDrop(n: i32) -> i32 {
              let mut k = 0;
              while k * (k + 1) / 2 < n {
                  k += 1;
              }
              k
          }
        `,
        php: code`
          function twoEggDrop($n) {
              $k = 0;
              while (intdiv($k * ($k + 1), 2) < $n) $k++;
              return $k;
          }
        `,
        ruby: code`
          def twoEggDrop(n)
            k = 0
            k += 1 while k * (k + 1) / 2 < n
            k
          end
        `,
      },
    };
  })(),

  // ── The Earliest and Latest Rounds Where Players Compete (LC 1900)
  (() => {
    // Brute force over every outcome of every match not involving the two
    // stars, memoised on (players left, their two positions) — the outcome
    // never depends on anything else.
    const memo = new Map<number, [number, number]>();
    const ref = (n: number, a: number, b: number): [number, number] => {
      if (a + b === n + 1) return [1, 1];
      const key = (n * 32 + a) * 32 + b;
      const hit = memo.get(key);
      if (hit) return hit;
      const half = Math.floor(n / 2);
      const free: number[] = [];
      for (let m = 1; m <= half; m++) {
        const o = n + 1 - m;
        if (m !== a && m !== b && o !== a && o !== b) free.push(m);
      }
      let lo = Infinity, hi = -Infinity;
      for (let mask = 0; mask < 1 << free.length; mask++) {
        const frontWins = new Set<number>();
        free.forEach((m, t) => { if (mask & (1 << t)) frontWins.add(m); });
        const winners: number[] = [];
        for (let p = 1; p <= n; p++) {
          if (p === a || p === b) { winners.push(p); continue; }
          const o = n + 1 - p;
          if (o === p) { winners.push(p); continue; }
          if (o === a || o === b) continue;
          const m = Math.min(p, o);
          if ((p === m) === frontWins.has(m)) winners.push(p);
        }
        const [e, l] = ref(winners.length, winners.indexOf(a) + 1, winners.indexOf(b) + 1);
        lo = Math.min(lo, e + 1);
        hi = Math.max(hi, l + 1);
      }
      const res: [number, number] = [lo, hi];
      memo.set(key, res);
      return res;
    };
    return {
      slug: "the-earliest-and-latest-rounds-where-players-compete",
      title: "The Earliest and Latest Rounds Where Players Compete",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Memoization", "Google"],
      signature: {
        funcName: "earliestAndLatest",
        params: [{ name: "n", type: "int" as const }, { name: "firstPlayer", type: "int" as const }, { name: "secondPlayer", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "`n` players stand in a row, numbered `1` to `n` by their position, for a knockout tournament. In every round, the `i`-th player from the front plays the `i`-th player from the back, and the winner advances. If the number of players in a round is odd, the player in the middle advances automatically.\n\nAfter a round, the winners line up again **in their original relative order** (by their starting numbers), and the next round begins.\n\nPlayers `firstPlayer` and `secondPlayer` are the strongest: each beats any other opponent. Every other match may go either way — you choose. Return `[earliest, latest]`: the earliest and the latest round numbers (counting from 1) in which `firstPlayer` and `secondPlayer` can meet.",
        [
          { in: "n = 11, firstPlayer = 2, secondPlayer = 4", out: "[3,4]", note: "Earliest: round 1 can leave 2,3,4,5,6,11, round 2 can leave 2,3,4, and then 2 faces 4 in round 3. Latest: the results can also keep them apart until round 4." },
          { in: "n = 5, firstPlayer = 1, secondPlayer = 5", out: "[1,1]", note: "Players 1 and 5 face each other in the very first round." },
          { in: "n = 4, firstPlayer = 1, secondPlayer = 3", out: "[2,2]", note: "Round 1 pairs 1–4 and 2–3, so both stars win and meet in round 2." },
        ],
        ["2 <= n <= 28", "1 <= firstPlayer < secondPlayer <= n"]),
      hints: [
        "Only three numbers matter for the rest of the tournament: how many players are left and the positions of the two stars. Memoise on `(n, first, second)`.",
        "The tournament is symmetric: mirroring the row (position `p` becomes `n + 1 - p`) does not change the answer, so you may assume the stars are closer to the front, `first + second <= n + 1`.",
        "Instead of enumerating every match result, count how many winners land before the first star (`i`) and between the stars (`j`): those two numbers decide the stars' new positions. Careful with the case where the second star is in the back half — the players between its opponent and itself contribute a fixed number of winners.",
      ],
      editorial: explain({
        idea: "The future depends only on the number of players left and the two stars' positions, so a memoised search on `(n, f, s)` works. Within a round, the stars' next positions are determined by how many winners precede each of them, which can be enumerated directly instead of trying all `2^(n/2)` match outcomes.",
        steps: [
          "If `f + s == n + 1`, the stars meet now: return `[1, 1]`.",
          "If `f + s > n + 1`, mirror: `(f, s) = (n + 1 - s, n + 1 - f)`. Let `nxt = (n + 1) / 2` be the next round's size.",
          "If `s <= nxt` (both in the front half): for `i` in `[0, f - 1]` winners before `f` and `j` in `[0, s - f - 1]` winners between them, recurse on `(nxt, i + 1, i + j + 2)`.",
          "Otherwise `s` is in the back half and plays `s' = n + 1 - s` (with `f < s'`). The `n - 2s'` players strictly between `s'` and `s` always contribute `mid = (n - 2s' + 1) / 2` winners. For `i` in `[0, f - 1]` and `j` in `[0, s' - f - 1]`, recurse on `(nxt, i + 1, i + j + mid + 2)`.",
          "Return 1 plus the minimum and 1 plus the maximum of the recursive answers.",
        ],
        why: "Every match pairs position `p` with `n + 1 - p`. A match in front of the first star (`p < f`) has its other player behind both stars, so it adds a winner before `f` exactly when the front player wins — any count from 0 to `f - 1` is possible, and which matches are won does not matter. The same reasoning applies between the stars. Players between `s'` and `s` pair among themselves (plus the middle player), so they always add the same number of winners before `s`. That enumerates every reachable pair of next positions.",
        time: "O(n^5) in the worst case, tiny for n ≤ 28",
        space: "O(n^3)",
        pitfalls: [
          "Winners keep their original relative order — a winner from the back half does not take its opponent's place.",
          "The middle player of an odd round advances automatically and must be counted when it sits between the stars.",
          "Rounds are counted from 1, so meeting immediately is `[1, 1]`.",
        ],
      }),
      examples: [
        { input: "11\n2\n4", expectedOutput: "[3,4]" },
        { input: "5\n1\n5", expectedOutput: "[1,1]" },
        { input: "4\n1\n3", expectedOutput: "[2,2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [5, 12, 28, 28]));
        const a = ri(rng, 1, n - 1);
        const b = ri(rng, a + 1, n);
        return { input: `${n}\n${a}\n${b}`, expectedOutput: fmtIntArr(ref(n, a, b)) };
      },
      hiddenCount: 1500,
      solutions: {
        python: code`
          from typing import List
          from functools import lru_cache

          def earliestAndLatest(n: int, firstPlayer: int, secondPlayer: int) -> List[int]:
              @lru_cache(maxsize=None)
              def dfs(n, f, s):
                  if f + s == n + 1:
                      return (1, 1)
                  if f + s > n + 1:
                      f, s = n + 1 - s, n + 1 - f
                  nxt = (n + 1) // 2
                  lo, hi = 100, 0
                  if s <= nxt:
                      for i in range(f):
                          for j in range(s - f):
                              a, b = dfs(nxt, i + 1, i + j + 2)
                              lo = min(lo, a)
                              hi = max(hi, b)
                  else:
                      sp = n + 1 - s
                      mid = (n - 2 * sp + 1) // 2
                      for i in range(f):
                          for j in range(sp - f):
                              a, b = dfs(nxt, i + 1, i + j + mid + 2)
                              lo = min(lo, a)
                              hi = max(hi, b)
                  return (lo + 1, hi + 1)

              return list(dfs(n, firstPlayer, secondPlayer))
        `,
        javascript: code`
          var earliestAndLatest = function(n, firstPlayer, secondPlayer) {
              var memo = {};
              var dfs = function(n, f, s) {
                  if (f + s === n + 1) return [1, 1];
                  if (f + s > n + 1) { var t = f; f = n + 1 - s; s = n + 1 - t; }
                  var key = n * 1024 + f * 32 + s;
                  if (memo[key]) return memo[key];
                  var nxt = Math.floor((n + 1) / 2), lo = 100, hi = 0, r, i, j;
                  if (s <= nxt) {
                      for (i = 0; i < f; i++) for (j = 0; j < s - f; j++) {
                          r = dfs(nxt, i + 1, i + j + 2);
                          if (r[0] < lo) lo = r[0];
                          if (r[1] > hi) hi = r[1];
                      }
                  } else {
                      var sp = n + 1 - s, mid = Math.floor((n - 2 * sp + 1) / 2);
                      for (i = 0; i < f; i++) for (j = 0; j < sp - f; j++) {
                          r = dfs(nxt, i + 1, i + j + mid + 2);
                          if (r[0] < lo) lo = r[0];
                          if (r[1] > hi) hi = r[1];
                      }
                  }
                  memo[key] = [lo + 1, hi + 1];
                  return memo[key];
              };
              return dfs(n, firstPlayer, secondPlayer);
          };
        `,
        typescript: code`
          function earliestAndLatest(n: number, firstPlayer: number, secondPlayer: number): number[] {
              var memo: { [key: number]: number[] } = {};
              var dfs = function(n: number, f: number, s: number): number[] {
                  if (f + s === n + 1) return [1, 1];
                  if (f + s > n + 1) { var t = f; f = n + 1 - s; s = n + 1 - t; }
                  var key = n * 1024 + f * 32 + s;
                  if (memo[key]) return memo[key];
                  var nxt = Math.floor((n + 1) / 2), lo = 100, hi = 0, r: number[], i: number, j: number;
                  if (s <= nxt) {
                      for (i = 0; i < f; i++) for (j = 0; j < s - f; j++) {
                          r = dfs(nxt, i + 1, i + j + 2);
                          if (r[0] < lo) lo = r[0];
                          if (r[1] > hi) hi = r[1];
                      }
                  } else {
                      var sp = n + 1 - s, mid = Math.floor((n - 2 * sp + 1) / 2);
                      for (i = 0; i < f; i++) for (j = 0; j < sp - f; j++) {
                          r = dfs(nxt, i + 1, i + j + mid + 2);
                          if (r[0] < lo) lo = r[0];
                          if (r[1] > hi) hi = r[1];
                      }
                  }
                  memo[key] = [lo + 1, hi + 1];
                  return memo[key];
              };
              return dfs(n, firstPlayer, secondPlayer);
          }
        `,
        java: code`
          static int[][][][] tourMemo = new int[29][29][29][];

          static int[] tourDfs(int n, int f, int s) {
              if (f + s == n + 1) return new int[] {1, 1};
              if (f + s > n + 1) { int t = f; f = n + 1 - s; s = n + 1 - t; }
              if (tourMemo[n][f][s] != null) return tourMemo[n][f][s];
              int nxt = (n + 1) / 2, lo = 100, hi = 0;
              if (s <= nxt) {
                  for (int i = 0; i < f; i++) for (int j = 0; j < s - f; j++) {
                      int[] r = tourDfs(nxt, i + 1, i + j + 2);
                      lo = Math.min(lo, r[0]);
                      hi = Math.max(hi, r[1]);
                  }
              } else {
                  int sp = n + 1 - s, mid = (n - 2 * sp + 1) / 2;
                  for (int i = 0; i < f; i++) for (int j = 0; j < sp - f; j++) {
                      int[] r = tourDfs(nxt, i + 1, i + j + mid + 2);
                      lo = Math.min(lo, r[0]);
                      hi = Math.max(hi, r[1]);
                  }
              }
              tourMemo[n][f][s] = new int[] {lo + 1, hi + 1};
              return tourMemo[n][f][s];
          }

          public static int[] earliestAndLatest(int n, int firstPlayer, int secondPlayer) {
              int[] r = tourDfs(n, firstPlayer, secondPlayer);
              return new int[] {r[0], r[1]};
          }
        `,
        cpp: code`
          static pair<int, int> tourMemo[29][29][29];
          static bool tourSeen[29][29][29];

          static pair<int, int> tourDfs(int n, int f, int s) {
              if (f + s == n + 1) return {1, 1};
              if (f + s > n + 1) { int t = f; f = n + 1 - s; s = n + 1 - t; }
              if (tourSeen[n][f][s]) return tourMemo[n][f][s];
              int nxt = (n + 1) / 2, lo = 100, hi = 0;
              if (s <= nxt) {
                  for (int i = 0; i < f; i++) for (int j = 0; j < s - f; j++) {
                      auto r = tourDfs(nxt, i + 1, i + j + 2);
                      lo = min(lo, r.first);
                      hi = max(hi, r.second);
                  }
              } else {
                  int sp = n + 1 - s, mid = (n - 2 * sp + 1) / 2;
                  for (int i = 0; i < f; i++) for (int j = 0; j < sp - f; j++) {
                      auto r = tourDfs(nxt, i + 1, i + j + mid + 2);
                      lo = min(lo, r.first);
                      hi = max(hi, r.second);
                  }
              }
              tourSeen[n][f][s] = true;
              tourMemo[n][f][s] = {lo + 1, hi + 1};
              return tourMemo[n][f][s];
          }

          vector<int> earliestAndLatest(int n, int firstPlayer, int secondPlayer) {
              auto r = tourDfs(n, firstPlayer, secondPlayer);
              return {r.first, r.second};
          }
        `,
        c: code`
          static int tourLo[29][29][29], tourHi[29][29][29];
          static char tourSeen[29][29][29];

          static void tourDfs(int n, int f, int s, int* lo, int* hi) {
              if (f + s == n + 1) { *lo = 1; *hi = 1; return; }
              if (f + s > n + 1) { int t = f; f = n + 1 - s; s = n + 1 - t; }
              if (tourSeen[n][f][s]) { *lo = tourLo[n][f][s]; *hi = tourHi[n][f][s]; return; }
              int nxt = (n + 1) / 2, bestLo = 100, bestHi = 0, a, b;
              if (s <= nxt) {
                  for (int i = 0; i < f; i++) for (int j = 0; j < s - f; j++) {
                      tourDfs(nxt, i + 1, i + j + 2, &a, &b);
                      if (a < bestLo) bestLo = a;
                      if (b > bestHi) bestHi = b;
                  }
              } else {
                  int sp = n + 1 - s, mid = (n - 2 * sp + 1) / 2;
                  for (int i = 0; i < f; i++) for (int j = 0; j < sp - f; j++) {
                      tourDfs(nxt, i + 1, i + j + mid + 2, &a, &b);
                      if (a < bestLo) bestLo = a;
                      if (b > bestHi) bestHi = b;
                  }
              }
              tourSeen[n][f][s] = 1;
              tourLo[n][f][s] = bestLo + 1;
              tourHi[n][f][s] = bestHi + 1;
              *lo = bestLo + 1;
              *hi = bestHi + 1;
          }

          int* earliestAndLatest(int n, int firstPlayer, int secondPlayer, int* returnSize) {
              int* res = (int*)malloc(sizeof(int) * 2);
              tourDfs(n, firstPlayer, secondPlayer, &res[0], &res[1]);
              *returnSize = 2;
              return res;
          }
        `,
        csharp: code`
          static int[,,] tourLo = new int[29, 29, 29];
          static int[,,] tourHi = new int[29, 29, 29];

          static void TourDfs(int n, int f, int s, out int lo, out int hi)
          {
              if (f + s == n + 1) { lo = 1; hi = 1; return; }
              if (f + s > n + 1) { int t = f; f = n + 1 - s; s = n + 1 - t; }
              if (tourLo[n, f, s] != 0) { lo = tourLo[n, f, s]; hi = tourHi[n, f, s]; return; }
              int nxt = (n + 1) / 2, bestLo = 100, bestHi = 0, a, b;
              if (s <= nxt)
              {
                  for (int i = 0; i < f; i++) for (int j = 0; j < s - f; j++)
                  {
                      TourDfs(nxt, i + 1, i + j + 2, out a, out b);
                      bestLo = Math.Min(bestLo, a);
                      bestHi = Math.Max(bestHi, b);
                  }
              }
              else
              {
                  int sp = n + 1 - s, mid = (n - 2 * sp + 1) / 2;
                  for (int i = 0; i < f; i++) for (int j = 0; j < sp - f; j++)
                  {
                      TourDfs(nxt, i + 1, i + j + mid + 2, out a, out b);
                      bestLo = Math.Min(bestLo, a);
                      bestHi = Math.Max(bestHi, b);
                  }
              }
              tourLo[n, f, s] = bestLo + 1;
              tourHi[n, f, s] = bestHi + 1;
              lo = bestLo + 1;
              hi = bestHi + 1;
          }

          public static int[] EarliestAndLatest(int n, int firstPlayer, int secondPlayer)
          {
              int lo, hi;
              TourDfs(n, firstPlayer, secondPlayer, out lo, out hi);
              return new int[] { lo, hi };
          }
        `,
        go: code`
          func earliestAndLatest(n int, firstPlayer int, secondPlayer int) []int {
              memo := map[int][2]int{}
              var dfs func(n, f, s int) [2]int
              dfs = func(n, f, s int) [2]int {
                  if f+s == n+1 {
                      return [2]int{1, 1}
                  }
                  if f+s > n+1 {
                      f, s = n+1-s, n+1-f
                  }
                  key := n*1024 + f*32 + s
                  if r, ok := memo[key]; ok {
                      return r
                  }
                  nxt, lo, hi := (n+1)/2, 100, 0
                  update := func(r [2]int) {
                      if r[0] < lo {
                          lo = r[0]
                      }
                      if r[1] > hi {
                          hi = r[1]
                      }
                  }
                  if s <= nxt {
                      for i := 0; i < f; i++ {
                          for j := 0; j < s-f; j++ {
                              update(dfs(nxt, i+1, i+j+2))
                          }
                      }
                  } else {
                      sp := n + 1 - s
                      mid := (n - 2*sp + 1) / 2
                      for i := 0; i < f; i++ {
                          for j := 0; j < sp-f; j++ {
                              update(dfs(nxt, i+1, i+j+mid+2))
                          }
                      }
                  }
                  res := [2]int{lo + 1, hi + 1}
                  memo[key] = res
                  return res
              }
              r := dfs(n, firstPlayer, secondPlayer)
              return []int{r[0], r[1]}
          }
        `,
        kotlin: code`
          fun earliestAndLatest(n: Int, firstPlayer: Int, secondPlayer: Int): IntArray {
              val memo = HashMap<Int, IntArray>()
              fun dfs(n: Int, f0: Int, s0: Int): IntArray {
                  var f = f0
                  var s = s0
                  if (f + s == n + 1) return intArrayOf(1, 1)
                  if (f + s > n + 1) {
                      val t = f
                      f = n + 1 - s
                      s = n + 1 - t
                  }
                  val key = n * 1024 + f * 32 + s
                  memo[key]?.let { return it }
                  val nxt = (n + 1) / 2
                  var lo = 100
                  var hi = 0
                  if (s <= nxt) {
                      for (i in 0 until f) for (j in 0 until s - f) {
                          val r = dfs(nxt, i + 1, i + j + 2)
                          lo = minOf(lo, r[0])
                          hi = maxOf(hi, r[1])
                      }
                  } else {
                      val sp = n + 1 - s
                      val mid = (n - 2 * sp + 1) / 2
                      for (i in 0 until f) for (j in 0 until sp - f) {
                          val r = dfs(nxt, i + 1, i + j + mid + 2)
                          lo = minOf(lo, r[0])
                          hi = maxOf(hi, r[1])
                      }
                  }
                  val res = intArrayOf(lo + 1, hi + 1)
                  memo[key] = res
                  return res
              }
              return dfs(n, firstPlayer, secondPlayer)
          }
        `,
        swift: code`
          func earliestAndLatest(_ n: Int, _ firstPlayer: Int, _ secondPlayer: Int) -> [Int] {
              var memo = [Int: (Int, Int)]()
              func dfs(_ n: Int, _ f0: Int, _ s0: Int) -> (Int, Int) {
                  var f = f0, s = s0
                  if f + s == n + 1 { return (1, 1) }
                  if f + s > n + 1 {
                      let t = f
                      f = n + 1 - s
                      s = n + 1 - t
                  }
                  let key = n * 1024 + f * 32 + s
                  if let hit = memo[key] { return hit }
                  let nxt = (n + 1) / 2
                  var lo = 100, hi = 0
                  if s <= nxt {
                      for i in 0..<f {
                          for j in 0..<(s - f) {
                              let r = dfs(nxt, i + 1, i + j + 2)
                              lo = min(lo, r.0)
                              hi = max(hi, r.1)
                          }
                      }
                  } else {
                      let sp = n + 1 - s
                      let mid = (n - 2 * sp + 1) / 2
                      for i in 0..<f {
                          for j in 0..<(sp - f) {
                              let r = dfs(nxt, i + 1, i + j + mid + 2)
                              lo = min(lo, r.0)
                              hi = max(hi, r.1)
                          }
                      }
                  }
                  memo[key] = (lo + 1, hi + 1)
                  return (lo + 1, hi + 1)
              }
              let r = dfs(n, firstPlayer, secondPlayer)
              return [r.0, r.1]
          }
        `,
        rust: code`
          fn tour_dfs(n: usize, f0: usize, s0: usize, memo: &mut Vec<(i32, i32)>) -> (i32, i32) {
              let (mut f, mut s) = (f0, s0);
              if f + s == n + 1 {
                  return (1, 1);
              }
              if f + s > n + 1 {
                  let t = f;
                  f = n + 1 - s;
                  s = n + 1 - t;
              }
              let key = (n * 29 + f) * 29 + s;
              if memo[key].0 != 0 {
                  return memo[key];
              }
              let nxt = (n + 1) / 2;
              let (mut lo, mut hi) = (100, 0);
              if s <= nxt {
                  for i in 0..f {
                      for j in 0..(s - f) {
                          let r = tour_dfs(nxt, i + 1, i + j + 2, memo);
                          lo = lo.min(r.0);
                          hi = hi.max(r.1);
                      }
                  }
              } else {
                  let sp = n + 1 - s;
                  let mid = (n - 2 * sp + 1) / 2;
                  for i in 0..f {
                      for j in 0..(sp - f) {
                          let r = tour_dfs(nxt, i + 1, i + j + mid + 2, memo);
                          lo = lo.min(r.0);
                          hi = hi.max(r.1);
                      }
                  }
              }
              memo[key] = (lo + 1, hi + 1);
              memo[key]
          }

          fn earliestAndLatest(n: i32, first_player: i32, second_player: i32) -> Vec<i32> {
              let mut memo = vec![(0, 0); 29 * 29 * 29];
              let r = tour_dfs(n as usize, first_player as usize, second_player as usize, &mut memo);
              vec![r.0, r.1]
          }
        `,
        php: code`
          function earliestAndLatest($n, $firstPlayer, $secondPlayer) {
              $memo = [];
              $dfs = function ($n, $f, $s) use (&$dfs, &$memo) {
                  if ($f + $s == $n + 1) return [1, 1];
                  if ($f + $s > $n + 1) { $t = $f; $f = $n + 1 - $s; $s = $n + 1 - $t; }
                  $key = $n * 1024 + $f * 32 + $s;
                  if (isset($memo[$key])) return $memo[$key];
                  $nxt = intdiv($n + 1, 2);
                  $lo = 100;
                  $hi = 0;
                  if ($s <= $nxt) {
                      for ($i = 0; $i < $f; $i++) for ($j = 0; $j < $s - $f; $j++) {
                          $r = $dfs($nxt, $i + 1, $i + $j + 2);
                          $lo = min($lo, $r[0]);
                          $hi = max($hi, $r[1]);
                      }
                  } else {
                      $sp = $n + 1 - $s;
                      $mid = intdiv($n - 2 * $sp + 1, 2);
                      for ($i = 0; $i < $f; $i++) for ($j = 0; $j < $sp - $f; $j++) {
                          $r = $dfs($nxt, $i + 1, $i + $j + $mid + 2);
                          $lo = min($lo, $r[0]);
                          $hi = max($hi, $r[1]);
                      }
                  }
                  $memo[$key] = [$lo + 1, $hi + 1];
                  return $memo[$key];
              };
              return $dfs($n, $firstPlayer, $secondPlayer);
          }
        `,
        ruby: code`
          def tour_dfs(n, f, s, memo)
            return [1, 1] if f + s == n + 1
            if f + s > n + 1
              f, s = n + 1 - s, n + 1 - f
            end
            key = n * 1024 + f * 32 + s
            return memo[key] if memo.key?(key)
            nxt = (n + 1) / 2
            lo = 100
            hi = 0
            if s <= nxt
              f.times do |i|
                (s - f).times do |j|
                  r = tour_dfs(nxt, i + 1, i + j + 2, memo)
                  lo = r[0] if r[0] < lo
                  hi = r[1] if r[1] > hi
                end
              end
            else
              sp = n + 1 - s
              mid = (n - 2 * sp + 1) / 2
              f.times do |i|
                (sp - f).times do |j|
                  r = tour_dfs(nxt, i + 1, i + j + mid + 2, memo)
                  lo = r[0] if r[0] < lo
                  hi = r[1] if r[1] > hi
                end
              end
            end
            memo[key] = [lo + 1, hi + 1]
          end

          def earliestAndLatest(n, firstPlayer, secondPlayer)
            tour_dfs(n, firstPlayer, secondPlayer, {})
          end
        `,
      },
    };
  })(),


  // ── First Day Where You Have Been in All the Rooms (LC 1997) ────
  (() => {
    // Short inputs: simulate day by day. Longer ones (days grow like 2^n):
    // the first-arrival recurrence, mod 1e9+7.
    const MOD = 1000000007;
    const ref = (nextVisit: number[]) => {
      const n = nextVisit.length;
      if (n <= 14) {
        const visits = new Array(n).fill(0);
        let room = 0, day = 0, seen = 0;
        for (;;) {
          if (visits[room] === 0) seen++;
          visits[room]++;
          if (seen === n) return day % MOD;
          room = visits[room] % 2 === 1 ? nextVisit[room] : (room + 1) % n;
          day++;
        }
      }
      const dp = [0];
      for (let i = 0; i + 1 < n; i++) dp.push((((2 * dp[i] - dp[nextVisit[i]] + 2) % MOD) + MOD) % MOD);
      return dp[n - 1];
    };
    return {
      slug: "first-day-where-you-have-been-in-all-the-rooms",
      title: "First Day Where You Have Been in All the Rooms",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "firstDayBeenInAllRooms", params: [{ name: "nextVisit", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` rooms numbered `0` to `n - 1`, and you visit exactly one room per day, starting with room `0` on day `0`. Which room you visit the next day follows a fixed rule, using the array `nextVisit` (with `0 <= nextVisit[i] <= i`):\n\n- If, counting today's visit, you have been in room `i` an **odd** number of times, tomorrow you visit room `nextVisit[i]`.\n- If you have been in room `i` an **even** number of times, tomorrow you visit room `(i + 1) mod n`.\n\nReturn the label of the **first day** on which you have visited every room at least once. The answer can be huge, so return it modulo `10^9 + 7`.",
        [
          { in: "nextVisit = [0,0]", out: "2", note: "Day 0: room 0 (1st visit, odd → room 0). Day 1: room 0 (2nd visit, even → room 1). Day 2: room 1 — every room seen." },
          { in: "nextVisit = [0,0,2]", out: "6", note: "Rooms visited on days 0..6 are 0, 0, 1, 0, 0, 1, 2." },
          { in: "nextVisit = [0,1,2,0]", out: "6", note: "Rooms visited on days 0..6 are 0, 0, 1, 1, 2, 2, 3." },
        ],
        ["n == nextVisit.length", "2 <= n <= 10^5", "0 <= nextVisit[i] <= i"]),
      hints: [
        "You can only move forward from room `i` to room `i + 1` by visiting room `i` an even number of times. Because `nextVisit[i] <= i`, you never reach room `i + 1` before room `i`.",
        "When you first enter room `i`, every room before it has been visited an even number of times. After the odd visit, you jump back to `nextVisit[i]` — and from there it takes exactly as long to get back to `i` as it took the first time from `nextVisit[i]` to `i`.",
        "So with `dp[i]` = first day in room `i`: `dp[i + 1] = dp[i] + 1 + (dp[i] - dp[nextVisit[i]]) + 1`. Keep it modulo `10^9 + 7` (and keep it non-negative).",
      ],
      editorial: explain({
        idea: "Let `dp[i]` be the first day you stand in room `i`. Reaching room `i + 1` requires a second visit to room `i`, and the detour in between replays exactly the stretch from `nextVisit[i]` to `i`, which took `dp[i] - dp[nextVisit[i]]` days the first time.",
        steps: [
          "`dp[0] = 0`.",
          "For `i = 0..n-2`: `dp[i + 1] = 2 * dp[i] - dp[nextVisit[i]] + 2` (modulo `10^9 + 7`, adding the modulus before the final reduction so the value stays non-negative).",
          "Return `dp[n - 1]`.",
        ],
        why: "When you first arrive at room `i`, every room `j < i` has an even visit count — you left each of them forward, which only happens on even visits. Going back to `nextVisit[i] = k` puts you in the same position as your first arrival at `k` (all rooms from `k` on even), so the walk from `k` back to `i` repeats the original walk and takes `dp[i] - dp[k]` days. Counting the day spent jumping to `k` and the day stepping from `i` to `i + 1` gives the recurrence.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Subtracting `dp[nextVisit[i]]` under a modulus can go negative — add the modulus back.",
          "`2 * dp[i]` reaches about 2·10^9 before the reduction, which overflows a 32-bit int; use 64-bit arithmetic.",
          "The answer is the first day the **last** room is entered, which is `dp[n - 1]` because rooms are always reached in order.",
        ],
      }),
      examples: [
        { input: "[0,0]", expectedOutput: "2" },
        { input: "[0,0,2]", expectedOutput: "6" },
        { input: "[0,1,2,0]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.6 ? ri(rng, 2, 14) : ri(rng, 15, pick(rng, [40, 80]));
        const mode = ri(rng, 0, 3);
        const nextVisit = Array.from({ length: n }, (_, i) => (mode === 0 ? 0 : mode === 1 ? i : ri(rng, 0, i)));
        return { input: fmtIntArr(nextVisit), expectedOutput: String(ref(nextVisit)) };
      },
      solutions: {
        python: code`
          from typing import List

          def firstDayBeenInAllRooms(nextVisit: List[int]) -> int:
              MOD = 10 ** 9 + 7
              n = len(nextVisit)
              dp = [0] * n
              for i in range(n - 1):
                  dp[i + 1] = (2 * dp[i] - dp[nextVisit[i]] + 2) % MOD
              return dp[n - 1]
        `,
        javascript: code`
          var firstDayBeenInAllRooms = function(nextVisit) {
              var MOD = 1000000007, n = nextVisit.length, dp = new Array(n).fill(0);
              for (var i = 0; i + 1 < n; i++) {
                  dp[i + 1] = ((2 * dp[i] - dp[nextVisit[i]] + 2) % MOD + MOD) % MOD;
              }
              return dp[n - 1];
          };
        `,
        typescript: code`
          function firstDayBeenInAllRooms(nextVisit: number[]): number {
              var MOD = 1000000007, n = nextVisit.length, dp: number[] = [0];
              for (var i = 0; i + 1 < n; i++) {
                  dp.push(((2 * dp[i] - dp[nextVisit[i]] + 2) % MOD + MOD) % MOD);
              }
              return dp[n - 1];
          }
        `,
        java: code`
          public static int firstDayBeenInAllRooms(int[] nextVisit) {
              final long MOD = 1000000007L;
              int n = nextVisit.length;
              long[] dp = new long[n];
              for (int i = 0; i + 1 < n; i++) {
                  dp[i + 1] = ((2 * dp[i] - dp[nextVisit[i]] + 2) % MOD + MOD) % MOD;
              }
              return (int) dp[n - 1];
          }
        `,
        cpp: code`
          int firstDayBeenInAllRooms(vector<int>& nextVisit) {
              const long long MOD = 1000000007LL;
              int n = nextVisit.size();
              vector<long long> dp(n, 0);
              for (int i = 0; i + 1 < n; i++) {
                  dp[i + 1] = ((2 * dp[i] - dp[nextVisit[i]] + 2) % MOD + MOD) % MOD;
              }
              return (int)dp[n - 1];
          }
        `,
        c: code`
          int firstDayBeenInAllRooms(int* nextVisit, int nextVisitSize) {
              const long long MOD = 1000000007LL;
              int n = nextVisitSize;
              long long* dp = (long long*)calloc(n, sizeof(long long));
              for (int i = 0; i + 1 < n; i++) {
                  dp[i + 1] = ((2 * dp[i] - dp[nextVisit[i]] + 2) % MOD + MOD) % MOD;
              }
              int ans = (int)dp[n - 1];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int FirstDayBeenInAllRooms(int[] nextVisit)
          {
              const long MOD = 1000000007L;
              int n = nextVisit.Length;
              long[] dp = new long[n];
              for (int i = 0; i + 1 < n; i++)
              {
                  dp[i + 1] = ((2 * dp[i] - dp[nextVisit[i]] + 2) % MOD + MOD) % MOD;
              }
              return (int)dp[n - 1];
          }
        `,
        go: code`
          func firstDayBeenInAllRooms(nextVisit []int) int {
              const mod = 1000000007
              n := len(nextVisit)
              dp := make([]int, n)
              for i := 0; i+1 < n; i++ {
                  dp[i+1] = ((2*dp[i]-dp[nextVisit[i]]+2)%mod + mod) % mod
              }
              return dp[n-1]
          }
        `,
        kotlin: code`
          fun firstDayBeenInAllRooms(nextVisit: IntArray): Int {
              val mod = 1000000007L
              val n = nextVisit.size
              val dp = LongArray(n)
              for (i in 0 until n - 1) {
                  dp[i + 1] = ((2 * dp[i] - dp[nextVisit[i]] + 2) % mod + mod) % mod
              }
              return dp[n - 1].toInt()
          }
        `,
        swift: code`
          func firstDayBeenInAllRooms(_ nextVisit: [Int]) -> Int {
              let mod = 1000000007
              let n = nextVisit.count
              var dp = [Int](repeating: 0, count: n)
              for i in 0..<(n - 1) {
                  dp[i + 1] = ((2 * dp[i] - dp[nextVisit[i]] + 2) % mod + mod) % mod
              }
              return dp[n - 1]
          }
        `,
        rust: code`
          fn firstDayBeenInAllRooms(next_visit: Vec<i32>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let n = next_visit.len();
              let mut dp = vec![0i64; n];
              for i in 0..n - 1 {
                  dp[i + 1] = ((2 * dp[i] - dp[next_visit[i] as usize] + 2) % modulus + modulus) % modulus;
              }
              dp[n - 1] as i32
          }
        `,
        php: code`
          function firstDayBeenInAllRooms($nextVisit) {
              $MOD = 1000000007;
              $n = count($nextVisit);
              $dp = array_fill(0, $n, 0);
              for ($i = 0; $i + 1 < $n; $i++) {
                  $dp[$i + 1] = ((2 * $dp[$i] - $dp[$nextVisit[$i]] + 2) % $MOD + $MOD) % $MOD;
              }
              return $dp[$n - 1];
          }
        `,
        ruby: code`
          def firstDayBeenInAllRooms(nextVisit)
            mod = 1_000_000_007
            n = nextVisit.length
            dp = Array.new(n, 0)
            (0...(n - 1)).each do |i|
              dp[i + 1] = (2 * dp[i] - dp[nextVisit[i]] + 2) % mod
            end
            dp[n - 1]
          end
        `,
      },
    };
  })(),

  // ── Check if There Is a Valid Parentheses String Path (LC 2267) ─
  (() => {
    // Every monotone path, walked with its running balance (abandoned the
    // moment it goes negative).
    const ref = (grid: string[]) => {
      const m = grid.length, n = grid[0].length;
      const go = (i: number, j: number, bal: number): boolean => {
        bal += grid[i][j] === "(" ? 1 : -1;
        if (bal < 0) return false;
        if (i === m - 1 && j === n - 1) return bal === 0;
        return (i + 1 < m && go(i + 1, j, bal)) || (j + 1 < n && go(i, j + 1, bal));
      };
      return go(0, 0, 0);
    };
    return {
      slug: "check-if-there-is-a-valid-parentheses-string-path",
      title: "Check if There Is a Valid Parentheses String Path",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Google"],
      signature: { funcName: "hasValidPath", params: [{ name: "grid", type: "string[]" as const }], returns: "bool" as const },
      description: describe(
        "A string of parentheses is **valid** if it is empty, or is `AB` with `A` and `B` valid, or is `(A)` with `A` valid — in other words, every `(` is matched by a later `)`.\n\nYou are given an `m x n` grid `grid` as `m` strings of length `n`, each character `'('` or `')'`. A **valid path** starts at the top-left cell `(0, 0)`, ends at the bottom-right cell `(m - 1, n - 1)`, only ever moves **down** or **right**, and the characters it passes over (including both ends) form a valid parentheses string.\n\nReturn `true` if some valid path exists, otherwise `false`.",
        [
          { in: "grid = [\"(((\",\")()\",\"(()\",\"(()\"]", out: "true", note: "Right, right, down, down, down reads `((()))`, which is valid." },
          { in: "grid = [\"))\",\"((\"]", out: "false", note: "Both paths start with `)`, so neither can be valid." },
          { in: "grid = [\"()\"]", out: "true" },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 100", "grid[i][j] is '(' or ')'"]),
      hints: [
        "A path is valid exactly when its running balance (`+1` for `(`, `-1` for `)`) never drops below zero and ends at zero.",
        "Two paths reaching the same cell with the same balance are interchangeable for the rest of the walk. So the state is `(row, col, balance)` — at most `100 * 100 * 200` states.",
        "Fill a boolean table `can[i][j][b]` from the top-left, or run a memoised DFS. Quick rejections: the path length `m + n - 1` must be even, the start must be `(` and the end `)`.",
      ],
      editorial: explain({
        idea: "Validity of a parentheses string only depends on its running balance. So instead of paths, track which balances can be standing on each cell: a 3D reachability DP over (row, column, balance).",
        steps: [
          "If `m + n - 1` is odd, return `false`.",
          "Let `can[i][j][b]` be true when some path from `(0, 0)` to `(i, j)` has balance `b` after reading `grid[i][j]`, never having gone negative.",
          "Seed `can[0][0][1] = true` if `grid[0][0] == '('` (otherwise nothing is reachable).",
          "For each other cell in row-major order, for each balance `b` reachable on the cell above or to the left, mark `b + 1` or `b - 1` here (skipping negatives and balances above `m + n`).",
          "Return `can[m-1][n-1][0]`.",
        ],
        why: "Any two partial paths that reach the same cell with the same balance can be completed by exactly the same suffixes, so keeping one boolean per (cell, balance) loses nothing. The DP considers every move into every cell, so it marks exactly the balances some valid prefix can have.",
        time: "O(m * n * (m + n))",
        space: "O(n * (m + n)) with two rows",
        pitfalls: [
          "A prefix that ever goes negative can never recover into a valid string — drop it immediately instead of tracking negative balances.",
          "Searching paths one by one is exponential; the balance is the only thing that matters.",
          "A balance larger than the number of cells left can never return to zero — capping it keeps the table small.",
        ],
      }),
      examples: [
        { input: '["(((",")()","(()","(()"]', expectedOutput: "true" },
        { input: '["))","(("]', expectedOutput: "false" },
        { input: '["()"]', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 4, 7]));
        const n = ri(rng, 1, pick(rng, [2, 4, 7]));
        const g: string[][] = Array.from({ length: m }, () => Array.from({ length: n }, (): string => (rng() < 0.5 ? "(" : ")")));
        if ((m + n - 1) % 2 === 0 && rng() < 0.5) {
          // Plant a valid string along a random monotone path.
          const len = m + n - 1;
          const moves = shuffle(rng, [...Array(m - 1).fill("D"), ...Array(n - 1).fill("R")]);
          const chars: string[] = [];
          let open = 0;
          for (let t = 0; t < len; t++) {
            const remaining = len - t;
            if (open === remaining) { chars.push(")"); open--; }
            else if (open === 0 || rng() < 0.5) { chars.push("("); open++; }
            else { chars.push(")"); open--; }
          }
          let i = 0, j = 0;
          g[0][0] = chars[0];
          moves.forEach((mv, t) => { if (mv === "D") i++; else j++; g[i][j] = chars[t + 1]; });
          if (rng() < 0.3) { const x = ri(rng, 0, m - 1), y = ri(rng, 0, n - 1); g[x][y] = g[x][y] === "(" ? ")" : "("; }
        }
        const grid = g.map((r) => r.join(""));
        return { input: fmtStrArr(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def hasValidPath(grid: List[str]) -> bool:
              m, n = len(grid), len(grid[0])
              if (m + n - 1) % 2 == 1 or grid[0][0] == ')' or grid[m - 1][n - 1] == '(':
                  return False
              L = m + n
              prev = None
              for i in range(m):
                  cur = [[False] * (L + 1) for _ in range(n)]
                  for j in range(n):
                      d = 1 if grid[i][j] == '(' else -1
                      if i == 0 and j == 0:
                          cur[0][1] = True
                          continue
                      here = cur[j]
                      up = prev[j] if i > 0 else None
                      left = cur[j - 1] if j > 0 else None
                      for b in range(L + 1):
                          if (up is not None and up[b]) or (left is not None and left[b]):
                              nb = b + d
                              if 0 <= nb <= L:
                                  here[nb] = True
                  prev = cur
              return prev[n - 1][0]
        `,
        javascript: code`
          var hasValidPath = function(grid) {
              var m = grid.length, n = grid[0].length;
              if ((m + n - 1) % 2 === 1 || grid[0][0] === ')' || grid[m - 1][n - 1] === '(') return false;
              var L = m + n, W = L + 1, prev = null;
              for (var i = 0; i < m; i++) {
                  var cur = new Array(n * W).fill(false);
                  for (var j = 0; j < n; j++) {
                      var d = grid[i][j] === '(' ? 1 : -1;
                      if (i === 0 && j === 0) { cur[1] = true; continue; }
                      for (var b = 0; b <= L; b++) {
                          if ((i > 0 && prev[j * W + b]) || (j > 0 && cur[(j - 1) * W + b])) {
                              var nb = b + d;
                              if (nb >= 0 && nb <= L) cur[j * W + nb] = true;
                          }
                      }
                  }
                  prev = cur;
              }
              return prev[(n - 1) * W];
          };
        `,
        typescript: code`
          function hasValidPath(grid: string[]): boolean {
              var m = grid.length, n = grid[0].length;
              if ((m + n - 1) % 2 === 1 || grid[0].charAt(0) === ')' || grid[m - 1].charAt(n - 1) === '(') return false;
              var L = m + n, W = L + 1, prev: boolean[] = [];
              for (var i = 0; i < m; i++) {
                  var cur: boolean[] = [];
                  for (var t = 0; t < n * W; t++) cur.push(false);
                  for (var j = 0; j < n; j++) {
                      var d = grid[i].charAt(j) === '(' ? 1 : -1;
                      if (i === 0 && j === 0) { cur[1] = true; continue; }
                      for (var b = 0; b <= L; b++) {
                          if ((i > 0 && prev[j * W + b]) || (j > 0 && cur[(j - 1) * W + b])) {
                              var nb = b + d;
                              if (nb >= 0 && nb <= L) cur[j * W + nb] = true;
                          }
                      }
                  }
                  prev = cur;
              }
              return prev[(n - 1) * W];
          }
        `,
        java: code`
          public static boolean hasValidPath(String[] grid) {
              int m = grid.length, n = grid[0].length();
              if ((m + n - 1) % 2 == 1 || grid[0].charAt(0) == ')' || grid[m - 1].charAt(n - 1) == '(') return false;
              int L = m + n, W = L + 1;
              boolean[] prev = new boolean[n * W];
              for (int i = 0; i < m; i++) {
                  boolean[] cur = new boolean[n * W];
                  for (int j = 0; j < n; j++) {
                      int d = grid[i].charAt(j) == '(' ? 1 : -1;
                      if (i == 0 && j == 0) { cur[1] = true; continue; }
                      for (int b = 0; b <= L; b++) {
                          if ((i > 0 && prev[j * W + b]) || (j > 0 && cur[(j - 1) * W + b])) {
                              int nb = b + d;
                              if (nb >= 0 && nb <= L) cur[j * W + nb] = true;
                          }
                      }
                  }
                  prev = cur;
              }
              return prev[(n - 1) * W];
          }
        `,
        cpp: code`
          bool hasValidPath(vector<string>& grid) {
              int m = grid.size(), n = grid[0].size();
              if ((m + n - 1) % 2 == 1 || grid[0][0] == ')' || grid[m - 1][n - 1] == '(') return false;
              int L = m + n, W = L + 1;
              vector<char> prev(n * W, 0);
              for (int i = 0; i < m; i++) {
                  vector<char> cur(n * W, 0);
                  for (int j = 0; j < n; j++) {
                      int d = grid[i][j] == '(' ? 1 : -1;
                      if (i == 0 && j == 0) { cur[1] = 1; continue; }
                      for (int b = 0; b <= L; b++) {
                          if ((i > 0 && prev[j * W + b]) || (j > 0 && cur[(j - 1) * W + b])) {
                              int nb = b + d;
                              if (nb >= 0 && nb <= L) cur[j * W + nb] = 1;
                          }
                      }
                  }
                  prev = cur;
              }
              return prev[(n - 1) * W];
          }
        `,
        c: code`
          bool hasValidPath(char** grid, int gridSize) {
              int m = gridSize, n = (int)strlen(grid[0]);
              if ((m + n - 1) % 2 == 1 || grid[0][0] == ')' || grid[m - 1][n - 1] == '(') return false;
              int L = m + n, W = L + 1;
              char* prev = (char*)calloc(n * W, 1);
              char* cur = (char*)calloc(n * W, 1);
              for (int i = 0; i < m; i++) {
                  memset(cur, 0, n * W);
                  for (int j = 0; j < n; j++) {
                      int d = grid[i][j] == '(' ? 1 : -1;
                      if (i == 0 && j == 0) { cur[1] = 1; continue; }
                      for (int b = 0; b <= L; b++) {
                          if ((i > 0 && prev[j * W + b]) || (j > 0 && cur[(j - 1) * W + b])) {
                              int nb = b + d;
                              if (nb >= 0 && nb <= L) cur[j * W + nb] = 1;
                          }
                      }
                  }
                  char* t = prev; prev = cur; cur = t;
              }
              bool ans = prev[(n - 1) * W] != 0;
              free(prev);
              free(cur);
              return ans;
          }
        `,
        csharp: code`
          public static bool HasValidPath(string[] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              if ((m + n - 1) % 2 == 1 || grid[0][0] == ')' || grid[m - 1][n - 1] == '(') return false;
              int L = m + n, W = L + 1;
              bool[] prev = new bool[n * W];
              for (int i = 0; i < m; i++)
              {
                  bool[] cur = new bool[n * W];
                  for (int j = 0; j < n; j++)
                  {
                      int d = grid[i][j] == '(' ? 1 : -1;
                      if (i == 0 && j == 0) { cur[1] = true; continue; }
                      for (int b = 0; b <= L; b++)
                      {
                          if ((i > 0 && prev[j * W + b]) || (j > 0 && cur[(j - 1) * W + b]))
                          {
                              int nb = b + d;
                              if (nb >= 0 && nb <= L) cur[j * W + nb] = true;
                          }
                      }
                  }
                  prev = cur;
              }
              return prev[(n - 1) * W];
          }
        `,
        go: code`
          func hasValidPath(grid []string) bool {
              m, n := len(grid), len(grid[0])
              if (m+n-1)%2 == 1 || grid[0][0] == ')' || grid[m-1][n-1] == '(' {
                  return false
              }
              L := m + n
              W := L + 1
              prev := make([]bool, n*W)
              for i := 0; i < m; i++ {
                  cur := make([]bool, n*W)
                  for j := 0; j < n; j++ {
                      d := -1
                      if grid[i][j] == '(' {
                          d = 1
                      }
                      if i == 0 && j == 0 {
                          cur[1] = true
                          continue
                      }
                      for b := 0; b <= L; b++ {
                          if (i > 0 && prev[j*W+b]) || (j > 0 && cur[(j-1)*W+b]) {
                              nb := b + d
                              if nb >= 0 && nb <= L {
                                  cur[j*W+nb] = true
                              }
                          }
                      }
                  }
                  prev = cur
              }
              return prev[(n-1)*W]
          }
        `,
        kotlin: code`
          fun hasValidPath(grid: Array<String>): Boolean {
              val m = grid.size
              val n = grid[0].length
              if ((m + n - 1) % 2 == 1 || grid[0][0] == ')' || grid[m - 1][n - 1] == '(') return false
              val l = m + n
              val w = l + 1
              var prev = BooleanArray(n * w)
              for (i in 0 until m) {
                  val cur = BooleanArray(n * w)
                  for (j in 0 until n) {
                      val d = if (grid[i][j] == '(') 1 else -1
                      if (i == 0 && j == 0) {
                          cur[1] = true
                          continue
                      }
                      for (b in 0..l) {
                          if ((i > 0 && prev[j * w + b]) || (j > 0 && cur[(j - 1) * w + b])) {
                              val nb = b + d
                              if (nb in 0..l) cur[j * w + nb] = true
                          }
                      }
                  }
                  prev = cur
              }
              return prev[(n - 1) * w]
          }
        `,
        swift: code`
          func hasValidPath(_ grid: [String]) -> Bool {
              let g = grid.map { Array($0) }
              let m = g.count, n = g[0].count
              if (m + n - 1) % 2 == 1 || g[0][0] == ")" || g[m - 1][n - 1] == "(" { return false }
              let L = m + n, W = L + 1
              var prev = [Bool](repeating: false, count: n * W)
              for i in 0..<m {
                  var cur = [Bool](repeating: false, count: n * W)
                  for j in 0..<n {
                      let d = g[i][j] == "(" ? 1 : -1
                      if i == 0 && j == 0 {
                          cur[1] = true
                          continue
                      }
                      for b in 0...L {
                          if (i > 0 && prev[j * W + b]) || (j > 0 && cur[(j - 1) * W + b]) {
                              let nb = b + d
                              if nb >= 0 && nb <= L { cur[j * W + nb] = true }
                          }
                      }
                  }
                  prev = cur
              }
              return prev[(n - 1) * W]
          }
        `,
        rust: code`
          fn hasValidPath(grid: Vec<String>) -> bool {
              let g: Vec<&[u8]> = grid.iter().map(|s| s.as_bytes()).collect();
              let m = g.len();
              let n = g[0].len();
              if (m + n - 1) % 2 == 1 || g[0][0] == b')' || g[m - 1][n - 1] == b'(' {
                  return false;
              }
              let l = m + n;
              let w = l + 1;
              let mut prev = vec![false; n * w];
              for i in 0..m {
                  let mut cur = vec![false; n * w];
                  for j in 0..n {
                      if i == 0 && j == 0 {
                          cur[1] = true;
                          continue;
                      }
                      let open = g[i][j] == b'(';
                      for b in 0..=l {
                          if (i > 0 && prev[j * w + b]) || (j > 0 && cur[(j - 1) * w + b]) {
                              if open {
                                  if b + 1 <= l {
                                      cur[j * w + b + 1] = true;
                                  }
                              } else if b >= 1 {
                                  cur[j * w + b - 1] = true;
                              }
                          }
                      }
                  }
                  prev = cur;
              }
              prev[(n - 1) * w]
          }
        `,
        php: code`
          function hasValidPath($grid) {
              $m = count($grid);
              $n = strlen($grid[0]);
              if (($m + $n - 1) % 2 == 1 || $grid[0][0] === ')' || $grid[$m - 1][$n - 1] === '(') return false;
              $L = $m + $n;
              $W = $L + 1;
              $prev = [];
              for ($i = 0; $i < $m; $i++) {
                  $cur = array_fill(0, $n * $W, false);
                  for ($j = 0; $j < $n; $j++) {
                      $d = $grid[$i][$j] === '(' ? 1 : -1;
                      if ($i == 0 && $j == 0) { $cur[1] = true; continue; }
                      for ($b = 0; $b <= $L; $b++) {
                          if (($i > 0 && $prev[$j * $W + $b]) || ($j > 0 && $cur[($j - 1) * $W + $b])) {
                              $nb = $b + $d;
                              if ($nb >= 0 && $nb <= $L) $cur[$j * $W + $nb] = true;
                          }
                      }
                  }
                  $prev = $cur;
              }
              return $prev[($n - 1) * $W];
          }
        `,
        ruby: code`
          def hasValidPath(grid)
            m = grid.length
            n = grid[0].length
            return false if (m + n - 1).odd? || grid[0][0] == ')' || grid[m - 1][n - 1] == '('
            l = m + n
            w = l + 1
            prev = nil
            m.times do |i|
              cur = Array.new(n * w, false)
              n.times do |j|
                d = grid[i][j] == '(' ? 1 : -1
                if i == 0 && j == 0
                  cur[1] = true
                  next
                end
                (0..l).each do |b|
                  next unless (i > 0 && prev[j * w + b]) || (j > 0 && cur[(j - 1) * w + b])
                  nb = b + d
                  cur[j * w + nb] = true if nb >= 0 && nb <= l
                end
              end
              prev = cur
            end
            prev[(n - 1) * w]
          end
        `,
      },
    };
  })(),

  // ── Substring With Largest Variance (LC 2272) ───────────────────
  (() => {
    // Every substring, counting letters incrementally.
    const ref = (s: string) => {
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        const cnt = new Array(26).fill(0);
        for (let j = i; j < s.length; j++) {
          cnt[s.charCodeAt(j) - 97]++;
          let hi = 0, lo = Infinity;
          for (const c of cnt) if (c > 0) { hi = Math.max(hi, c); lo = Math.min(lo, c); }
          best = Math.max(best, hi - lo);
        }
      }
      return best;
    };
    return {
      slug: "substring-with-largest-variance",
      title: "Substring With Largest Variance",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft"],
      signature: { funcName: "largestVariance", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "The **variance** of a string is the largest difference between the number of occurrences of **any two** characters present in it (the two characters may be the same, giving 0).\n\nGiven a string `s` of lowercase English letters, return the largest variance over all of its substrings. A substring is a contiguous, non-empty run of characters.",
        [
          { in: "s = \"aababbb\"", out: "3", note: "In \"babbb\", 'b' appears 4 times and 'a' once: variance 3." },
          { in: "s = \"abcde\"", out: "0", note: "Every letter appears at most once in any substring." },
          { in: "s = \"aaaa\"", out: "0", note: "With a single distinct letter, the only difference is 0." },
        ],
        ["1 <= s.length <= 10^4", "s consists of lowercase English letters"]),
      hints: [
        "The answer is achieved by some pair of letters: `a` the most frequent and `b` the least frequent in the best substring. There are only `26 * 25` ordered pairs.",
        "For a fixed pair, map `a` to `+1`, `b` to `-1` and every other letter to `0`. The variance of a substring is its sum — but only if the substring contains at least one `b`.",
        "Run Kadane's maximum-subarray scan for each pair, tracking whether the current window holds a `b`. Reset the window when the count of `b` exceeds `a` only if another `b` is still ahead in the string.",
      ],
      editorial: explain({
        idea: "Fix which letter should be most frequent (`a`) and which least frequent (`b`). The substring's score is `count(a) - count(b)` with at least one `b` present — a maximum-subarray problem with an extra condition, solved by a modified Kadane scan for each of the 650 pairs.",
        steps: [
          "For every ordered pair `(a, b)` of distinct letters that both occur in `s`:",
          "Scan `s` keeping `ca` and `cb` (counts in the current window) and `restB` (occurrences of `b` not yet scanned).",
          "On `a`, `ca++`; on `b`, `cb++` and `restB--`. Whenever `cb > 0`, update the answer with `ca - cb`.",
          "If `ca < cb` and `restB > 0`, reset both counts to 0 — a window starting later can do better and will still find a `b`.",
          "Return the best value seen.",
        ],
        why: "For the optimal substring, its most and least frequent present letters form one of the pairs, and its variance equals that pair's `+1/-1` sum, so maximising every pair's constrained sum covers the optimum (and never overshoots, since each pair's sum is at most the true variance of that substring). The reset is Kadane's rule — a negative prefix never helps — except that dropping the window's only `b` would lose the condition, which is why a reset waits until another `b` remains.",
        time: "O(26 * 26 * n)",
        space: "O(1)",
        pitfalls: [
          "A window with no `b` does not count: \"aaaa\" scores 0, not 4.",
          "Resetting whenever `ca < cb` loses windows like \"baaa\": keep the `b` when it is the last one available.",
          "Skip pairs whose letters do not both occur — otherwise the 26×26 loop dominates on short strings.",
        ],
      }),
      examples: [
        { input: '"aababbb"', expectedOutput: "3" },
        { input: '"abcde"', expectedOutput: "0" },
        { input: '"aaaa"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = pick(rng, ["a", "ab", "ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]);
        const s = randLower(rng, 1, pick(rng, [1, 6, 20, 40]), alphabet);
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def largestVariance(s: str) -> int:
              present = sorted(set(s))
              best = 0
              for a in present:
                  for b in present:
                      if a == b:
                          continue
                      rest_b = s.count(b)
                      ca = cb = 0
                      for ch in s:
                          if ch == a:
                              ca += 1
                          elif ch == b:
                              cb += 1
                              rest_b -= 1
                          else:
                              continue
                          if cb > 0 and ca - cb > best:
                              best = ca - cb
                          if ca < cb and rest_b > 0:
                              ca = cb = 0
              return best
        `,
        javascript: code`
          var largestVariance = function(s) {
              var total = new Array(26).fill(0), n = s.length, best = 0;
              var codes = new Array(n);
              for (var i = 0; i < n; i++) { codes[i] = s.charCodeAt(i) - 97; total[codes[i]]++; }
              for (var a = 0; a < 26; a++) {
                  if (!total[a]) continue;
                  for (var b = 0; b < 26; b++) {
                      if (a === b || !total[b]) continue;
                      var ca = 0, cb = 0, restB = total[b];
                      for (var i = 0; i < n; i++) {
                          var c = codes[i];
                          if (c === a) ca++;
                          else if (c === b) { cb++; restB--; }
                          else continue;
                          if (cb > 0 && ca - cb > best) best = ca - cb;
                          if (ca < cb && restB > 0) { ca = 0; cb = 0; }
                      }
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function largestVariance(s: string): number {
              var total: number[] = [], n = s.length, best = 0, codes: number[] = [];
              for (var c0 = 0; c0 < 26; c0++) total.push(0);
              for (var i = 0; i < n; i++) { codes.push(s.charCodeAt(i) - 97); total[codes[i]]++; }
              for (var a = 0; a < 26; a++) {
                  if (!total[a]) continue;
                  for (var b = 0; b < 26; b++) {
                      if (a === b || !total[b]) continue;
                      var ca = 0, cb = 0, restB = total[b];
                      for (var i = 0; i < n; i++) {
                          var c = codes[i];
                          if (c === a) ca++;
                          else if (c === b) { cb++; restB--; }
                          else continue;
                          if (cb > 0 && ca - cb > best) best = ca - cb;
                          if (ca < cb && restB > 0) { ca = 0; cb = 0; }
                      }
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int largestVariance(String s) {
              int n = s.length(), best = 0;
              int[] total = new int[26];
              for (int i = 0; i < n; i++) total[s.charAt(i) - 'a']++;
              for (int a = 0; a < 26; a++) {
                  if (total[a] == 0) continue;
                  for (int b = 0; b < 26; b++) {
                      if (a == b || total[b] == 0) continue;
                      int ca = 0, cb = 0, restB = total[b];
                      for (int i = 0; i < n; i++) {
                          int c = s.charAt(i) - 'a';
                          if (c == a) ca++;
                          else if (c == b) { cb++; restB--; }
                          else continue;
                          if (cb > 0) best = Math.max(best, ca - cb);
                          if (ca < cb && restB > 0) { ca = 0; cb = 0; }
                      }
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int largestVariance(string s) {
              int n = s.size(), best = 0;
              int total[26] = {0};
              for (char ch : s) total[ch - 'a']++;
              for (int a = 0; a < 26; a++) {
                  if (!total[a]) continue;
                  for (int b = 0; b < 26; b++) {
                      if (a == b || !total[b]) continue;
                      int ca = 0, cb = 0, restB = total[b];
                      for (int i = 0; i < n; i++) {
                          int c = s[i] - 'a';
                          if (c == a) ca++;
                          else if (c == b) { cb++; restB--; }
                          else continue;
                          if (cb > 0) best = max(best, ca - cb);
                          if (ca < cb && restB > 0) { ca = 0; cb = 0; }
                      }
                  }
              }
              return best;
          }
        `,
        c: code`
          int largestVariance(const char* s) {
              int n = (int)strlen(s), best = 0;
              int total[26] = {0};
              for (int i = 0; i < n; i++) total[s[i] - 'a']++;
              for (int a = 0; a < 26; a++) {
                  if (!total[a]) continue;
                  for (int b = 0; b < 26; b++) {
                      if (a == b || !total[b]) continue;
                      int ca = 0, cb = 0, restB = total[b];
                      for (int i = 0; i < n; i++) {
                          int c = s[i] - 'a';
                          if (c == a) ca++;
                          else if (c == b) { cb++; restB--; }
                          else continue;
                          if (cb > 0 && ca - cb > best) best = ca - cb;
                          if (ca < cb && restB > 0) { ca = 0; cb = 0; }
                      }
                  }
              }
              return best;
          }
        `,
        csharp: code`
          public static int LargestVariance(string s)
          {
              int n = s.Length, best = 0;
              int[] total = new int[26];
              foreach (char ch in s) total[ch - 'a']++;
              for (int a = 0; a < 26; a++)
              {
                  if (total[a] == 0) continue;
                  for (int b = 0; b < 26; b++)
                  {
                      if (a == b || total[b] == 0) continue;
                      int ca = 0, cb = 0, restB = total[b];
                      for (int i = 0; i < n; i++)
                      {
                          int c = s[i] - 'a';
                          if (c == a) ca++;
                          else if (c == b) { cb++; restB--; }
                          else continue;
                          if (cb > 0) best = Math.Max(best, ca - cb);
                          if (ca < cb && restB > 0) { ca = 0; cb = 0; }
                      }
                  }
              }
              return best;
          }
        `,
        go: code`
          func largestVariance(s string) int {
              n, best := len(s), 0
              total := [26]int{}
              for i := 0; i < n; i++ {
                  total[s[i]-'a']++
              }
              for a := 0; a < 26; a++ {
                  if total[a] == 0 {
                      continue
                  }
                  for b := 0; b < 26; b++ {
                      if a == b || total[b] == 0 {
                          continue
                      }
                      ca, cb, restB := 0, 0, total[b]
                      for i := 0; i < n; i++ {
                          c := int(s[i] - 'a')
                          if c == a {
                              ca++
                          } else if c == b {
                              cb++
                              restB--
                          } else {
                              continue
                          }
                          if cb > 0 && ca-cb > best {
                              best = ca - cb
                          }
                          if ca < cb && restB > 0 {
                              ca, cb = 0, 0
                          }
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun largestVariance(s: String): Int {
              val n = s.length
              var best = 0
              val total = IntArray(26)
              for (ch in s) total[ch - 'a']++
              for (a in 0 until 26) {
                  if (total[a] == 0) continue
                  for (b in 0 until 26) {
                      if (a == b || total[b] == 0) continue
                      var ca = 0
                      var cb = 0
                      var restB = total[b]
                      for (i in 0 until n) {
                          val c = s[i] - 'a'
                          if (c == a) ca++
                          else if (c == b) {
                              cb++
                              restB--
                          } else continue
                          if (cb > 0) best = maxOf(best, ca - cb)
                          if (ca < cb && restB > 0) {
                              ca = 0
                              cb = 0
                          }
                      }
                  }
              }
              return best
          }
        `,
        swift: code`
          func largestVariance(_ s: String) -> Int {
              let codes = s.unicodeScalars.map { Int($0.value) - 97 }
              var total = [Int](repeating: 0, count: 26)
              for c in codes { total[c] += 1 }
              var best = 0
              for a in 0..<26 where total[a] > 0 {
                  for b in 0..<26 where a != b && total[b] > 0 {
                      var ca = 0, cb = 0, restB = total[b]
                      for c in codes {
                          if c == a {
                              ca += 1
                          } else if c == b {
                              cb += 1
                              restB -= 1
                          } else {
                              continue
                          }
                          if cb > 0 { best = max(best, ca - cb) }
                          if ca < cb && restB > 0 {
                              ca = 0
                              cb = 0
                          }
                      }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn largestVariance(s: String) -> i32 {
              let codes: Vec<usize> = s.bytes().map(|c| (c - b'a') as usize).collect();
              let mut total = [0i32; 26];
              for &c in codes.iter() {
                  total[c] += 1;
              }
              let mut best = 0;
              for a in 0..26 {
                  if total[a] == 0 {
                      continue;
                  }
                  for b in 0..26 {
                      if a == b || total[b] == 0 {
                          continue;
                      }
                      let (mut ca, mut cb, mut rest_b) = (0i32, 0i32, total[b]);
                      for &c in codes.iter() {
                          if c == a {
                              ca += 1;
                          } else if c == b {
                              cb += 1;
                              rest_b -= 1;
                          } else {
                              continue;
                          }
                          if cb > 0 && ca - cb > best {
                              best = ca - cb;
                          }
                          if ca < cb && rest_b > 0 {
                              ca = 0;
                              cb = 0;
                          }
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function largestVariance($s) {
              $n = strlen($s);
              $codes = [];
              $total = array_fill(0, 26, 0);
              for ($i = 0; $i < $n; $i++) {
                  $codes[$i] = ord($s[$i]) - 97;
                  $total[$codes[$i]]++;
              }
              $best = 0;
              for ($a = 0; $a < 26; $a++) {
                  if ($total[$a] == 0) continue;
                  for ($b = 0; $b < 26; $b++) {
                      if ($a == $b || $total[$b] == 0) continue;
                      $ca = 0;
                      $cb = 0;
                      $restB = $total[$b];
                      foreach ($codes as $c) {
                          if ($c == $a) $ca++;
                          elseif ($c == $b) { $cb++; $restB--; }
                          else continue;
                          if ($cb > 0 && $ca - $cb > $best) $best = $ca - $cb;
                          if ($ca < $cb && $restB > 0) { $ca = 0; $cb = 0; }
                      }
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def largestVariance(s)
            codes = s.bytes.map { |c| c - 97 }
            total = Array.new(26, 0)
            codes.each { |c| total[c] += 1 }
            best = 0
            26.times do |a|
              next if total[a] == 0
              26.times do |b|
                next if a == b || total[b] == 0
                ca = 0
                cb = 0
                rest_b = total[b]
                codes.each do |c|
                  if c == a
                    ca += 1
                  elsif c == b
                    cb += 1
                    rest_b -= 1
                  else
                    next
                  end
                  best = ca - cb if cb > 0 && ca - cb > best
                  if ca < cb && rest_b > 0
                    ca = 0
                    cb = 0
                  end
                end
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Path Cost in a Grid (LC 2304) ───────────────────────
  (() => {
    // Every path (n^m of them — the generator keeps that small).
    const ref = (grid: number[][], moveCost: number[][]) => {
      const m = grid.length, n = grid[0].length;
      let best = Infinity;
      const go = (r: number, c: number, acc: number) => {
        acc += grid[r][c];
        if (r === m - 1) { best = Math.min(best, acc); return; }
        for (let nc = 0; nc < n; nc++) go(r + 1, nc, acc + moveCost[grid[r][c]][nc]);
      };
      for (let c = 0; c < n; c++) go(0, c, 0);
      return best;
    };
    return {
      slug: "minimum-path-cost-in-a-grid",
      title: "Minimum Path Cost in a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon"],
      signature: {
        funcName: "minPathCost",
        params: [{ name: "grid", type: "int[][]" as const }, { name: "moveCost", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an `m x n` grid `grid` holding each of the numbers `0` to `m * n - 1` exactly once. From any cell `(x, y)` with `x < m - 1` you may move to **any** cell of the next row, `(x + 1, 0)` through `(x + 1, n - 1)`. Cells in the last row have no moves.\n\nA move has a price: moving from a cell holding value `v` into column `j` of the next row costs `moveCost[v][j]`.\n\nA path starts at any cell of the first row and ends at any cell of the last row. Its cost is the sum of the **values** of all cells it visits plus the prices of all its moves. Return the minimum cost of a path.",
        [
          { in: "grid = [[5,3],[4,0],[2,1]], moveCost = [[9,8],[1,5],[10,12],[18,6],[2,4],[14,3]]", out: "17", note: "Path 5 → 0 → 1: cell values 5 + 0 + 1 = 6, moves moveCost[5][1] = 3 and moveCost[0][1] = 8, total 17." },
          { in: "grid = [[5,1,2],[4,0,3]], moveCost = [[12,10,15],[20,23,8],[21,7,1],[8,1,13],[9,10,25],[5,3,2]]", out: "6", note: "Path 2 → 3: values 2 + 3 and move moveCost[2][2] = 1." },
        ],
        ["m == grid.length", "n == grid[i].length", "2 <= m, n <= 50", "grid is a permutation of 0..m*n-1", "moveCost.length == m * n", "moveCost[i].length == n", "1 <= moveCost[i][j] <= 100"]),
      hints: [
        "The cost of reaching a cell only depends on which cell of the previous row you came from — a row-by-row DP.",
        "Let `dp[j]` be the cheapest cost of a path ending at column `j` of the current row (including that cell's value).",
        "For the next row: `new[j] = grid[r+1][j] + min over k of (dp[k] + moveCost[grid[r][k]][j])`. The answer is the minimum of the last row.",
      ],
      editorial: explain({
        idea: "Each row only depends on the row above, so a DP over rows with one value per column finds the cheapest path in `O(m * n^2)`.",
        steps: [
          "Start with `dp[j] = grid[0][j]` for the first row.",
          "For each next row `r`, compute `new[j] = grid[r][j] + min over k of (dp[k] + moveCost[grid[r-1][k]][j])`.",
          "Replace `dp` with `new` and continue.",
          "Return the minimum of `dp` after the last row.",
        ],
        why: "Any path to cell `(r, j)` arrives from some `(r - 1, k)`, and its cost is the cost of the path to `(r - 1, k)` plus the move price and the new cell's value. Taking the cheapest path to every `(r - 1, k)` and minimising over `k` is therefore exact — the classic optimal-substructure argument.",
        time: "O(m * n^2)",
        space: "O(n)",
        pitfalls: [
          "The move price is indexed by the **value** in the cell you leave, not by its coordinates.",
          "The path cost includes the values of the first and the last cell.",
        ],
      }),
      examples: [
        { input: "[[5,3],[4,0],[2,1]]\n[[9,8],[1,5],[10,12],[18,6],[2,4],[14,3]]", expectedOutput: "17" },
        { input: "[[5,1,2],[4,0,3]]\n[[12,10,15],[20,23,8],[21,7,1],[8,1,13],[9,10,25],[5,3,2]]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 2, 6);
        const maxN = Math.max(2, Math.floor(Math.pow(4096, 1 / m) + 1e-9));
        const n = ri(rng, 2, Math.min(6, maxN));
        const vals = shuffle(rng, Array.from({ length: m * n }, (_, i) => i));
        const grid = Array.from({ length: m }, (_, r) => vals.slice(r * n, r * n + n));
        const top = pick(rng, [1, 5, 100]);
        const moveCost = Array.from({ length: m * n }, () => Array.from({ length: n }, () => ri(rng, 1, top)));
        return { input: `${fmtIntMat(grid)}\n${fmtIntMat(moveCost)}`, expectedOutput: String(ref(grid, moveCost)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minPathCost(grid: List[List[int]], moveCost: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              dp = grid[0][:]
              for r in range(1, m):
                  nd = []
                  for j in range(n):
                      best = min(dp[k] + moveCost[grid[r - 1][k]][j] for k in range(n))
                      nd.append(best + grid[r][j])
                  dp = nd
              return min(dp)
        `,
        javascript: code`
          var minPathCost = function(grid, moveCost) {
              var m = grid.length, n = grid[0].length, dp = grid[0].slice();
              for (var r = 1; r < m; r++) {
                  var nd = new Array(n);
                  for (var j = 0; j < n; j++) {
                      var best = Infinity;
                      for (var k = 0; k < n; k++) {
                          var c = dp[k] + moveCost[grid[r - 1][k]][j];
                          if (c < best) best = c;
                      }
                      nd[j] = best + grid[r][j];
                  }
                  dp = nd;
              }
              return Math.min.apply(null, dp);
          };
        `,
        typescript: code`
          function minPathCost(grid: number[][], moveCost: number[][]): number {
              var m = grid.length, n = grid[0].length, dp: number[] = grid[0].slice();
              for (var r = 1; r < m; r++) {
                  var nd: number[] = [];
                  for (var j = 0; j < n; j++) {
                      var best = Infinity;
                      for (var k = 0; k < n; k++) {
                          var c = dp[k] + moveCost[grid[r - 1][k]][j];
                          if (c < best) best = c;
                      }
                      nd.push(best + grid[r][j]);
                  }
                  dp = nd;
              }
              return Math.min.apply(null, dp);
          }
        `,
        java: code`
          public static int minPathCost(int[][] grid, int[][] moveCost) {
              int m = grid.length, n = grid[0].length;
              int[] dp = grid[0].clone();
              for (int r = 1; r < m; r++) {
                  int[] nd = new int[n];
                  for (int j = 0; j < n; j++) {
                      int best = Integer.MAX_VALUE;
                      for (int k = 0; k < n; k++) best = Math.min(best, dp[k] + moveCost[grid[r - 1][k]][j]);
                      nd[j] = best + grid[r][j];
                  }
                  dp = nd;
              }
              int ans = Integer.MAX_VALUE;
              for (int v : dp) ans = Math.min(ans, v);
              return ans;
          }
        `,
        cpp: code`
          int minPathCost(vector<vector<int>>& grid, vector<vector<int>>& moveCost) {
              int m = grid.size(), n = grid[0].size();
              vector<int> dp = grid[0];
              for (int r = 1; r < m; r++) {
                  vector<int> nd(n);
                  for (int j = 0; j < n; j++) {
                      int best = INT_MAX;
                      for (int k = 0; k < n; k++) best = min(best, dp[k] + moveCost[grid[r - 1][k]][j]);
                      nd[j] = best + grid[r][j];
                  }
                  dp = nd;
              }
              return *min_element(dp.begin(), dp.end());
          }
        `,
        c: code`
          int minPathCost(int** grid, int gridSize, int* gridColSize, int** moveCost, int moveCostSize, int* moveCostColSize) {
              int m = gridSize, n = gridColSize[0];
              int* dp = (int*)malloc(sizeof(int) * n);
              int* nd = (int*)malloc(sizeof(int) * n);
              for (int j = 0; j < n; j++) dp[j] = grid[0][j];
              for (int r = 1; r < m; r++) {
                  for (int j = 0; j < n; j++) {
                      int best = 2147483647;
                      for (int k = 0; k < n; k++) {
                          int c = dp[k] + moveCost[grid[r - 1][k]][j];
                          if (c < best) best = c;
                      }
                      nd[j] = best + grid[r][j];
                  }
                  int* t = dp; dp = nd; nd = t;
              }
              int ans = dp[0];
              for (int j = 1; j < n; j++) if (dp[j] < ans) ans = dp[j];
              free(dp);
              free(nd);
              return ans;
          }
        `,
        csharp: code`
          public static int MinPathCost(int[][] grid, int[][] moveCost)
          {
              int m = grid.Length, n = grid[0].Length;
              int[] dp = (int[])grid[0].Clone();
              for (int r = 1; r < m; r++)
              {
                  int[] nd = new int[n];
                  for (int j = 0; j < n; j++)
                  {
                      int best = int.MaxValue;
                      for (int k = 0; k < n; k++) best = Math.Min(best, dp[k] + moveCost[grid[r - 1][k]][j]);
                      nd[j] = best + grid[r][j];
                  }
                  dp = nd;
              }
              int ans = int.MaxValue;
              foreach (int v in dp) ans = Math.Min(ans, v);
              return ans;
          }
        `,
        go: code`
          func minPathCost(grid [][]int, moveCost [][]int) int {
              m, n := len(grid), len(grid[0])
              dp := append([]int{}, grid[0]...)
              for r := 1; r < m; r++ {
                  nd := make([]int, n)
                  for j := 0; j < n; j++ {
                      best := 1 << 30
                      for k := 0; k < n; k++ {
                          if c := dp[k] + moveCost[grid[r-1][k]][j]; c < best {
                              best = c
                          }
                      }
                      nd[j] = best + grid[r][j]
                  }
                  dp = nd
              }
              ans := dp[0]
              for _, v := range dp {
                  if v < ans {
                      ans = v
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun minPathCost(grid: Array<IntArray>, moveCost: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              var dp = grid[0].copyOf()
              for (r in 1 until m) {
                  val nd = IntArray(n)
                  for (j in 0 until n) {
                      var best = Int.MAX_VALUE
                      for (k in 0 until n) best = minOf(best, dp[k] + moveCost[grid[r - 1][k]][j])
                      nd[j] = best + grid[r][j]
                  }
                  dp = nd
              }
              return dp.minOrNull()!!
          }
        `,
        swift: code`
          func minPathCost(_ grid: [[Int]], _ moveCost: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count
              var dp = grid[0]
              for r in 1..<m {
                  var nd = [Int](repeating: 0, count: n)
                  for j in 0..<n {
                      var best = Int.max
                      for k in 0..<n { best = min(best, dp[k] + moveCost[grid[r - 1][k]][j]) }
                      nd[j] = best + grid[r][j]
                  }
                  dp = nd
              }
              return dp.min()!
          }
        `,
        rust: code`
          fn minPathCost(grid: Vec<Vec<i32>>, move_cost: Vec<Vec<i32>>) -> i32 {
              let m = grid.len();
              let n = grid[0].len();
              let mut dp = grid[0].clone();
              for r in 1..m {
                  let mut nd = vec![0i32; n];
                  for j in 0..n {
                      let mut best = std::i32::MAX;
                      for k in 0..n {
                          best = best.min(dp[k] + move_cost[grid[r - 1][k] as usize][j]);
                      }
                      nd[j] = best + grid[r][j];
                  }
                  dp = nd;
              }
              *dp.iter().min().unwrap()
          }
        `,
        php: code`
          function minPathCost($grid, $moveCost) {
              $m = count($grid);
              $n = count($grid[0]);
              $dp = $grid[0];
              for ($r = 1; $r < $m; $r++) {
                  $nd = [];
                  for ($j = 0; $j < $n; $j++) {
                      $best = PHP_INT_MAX;
                      for ($k = 0; $k < $n; $k++) {
                          $c = $dp[$k] + $moveCost[$grid[$r - 1][$k]][$j];
                          if ($c < $best) $best = $c;
                      }
                      $nd[] = $best + $grid[$r][$j];
                  }
                  $dp = $nd;
              }
              return min($dp);
          }
        `,
        ruby: code`
          def minPathCost(grid, moveCost)
            m = grid.length
            n = grid[0].length
            dp = grid[0].dup
            (1...m).each do |r|
              dp = (0...n).map do |j|
                (0...n).map { |k| dp[k] + moveCost[grid[r - 1][k]][j] }.min + grid[r][j]
              end
            end
            dp.min
          end
        `,
      },
    };
  })(),


  // ── Maximum Deletions on a String (LC 2430) ─────────────────────
  (() => {
    // Memoised recursion over the remaining suffix, comparing halves directly.
    const ref = (s: string) => {
      const n = s.length, memo = new Array(n).fill(0);
      for (let i = n - 1; i >= 0; i--) {
        let best = 1;
        for (let len = 1; i + 2 * len <= n; len++) {
          if (s.substr(i, len) === s.substr(i + len, len)) best = Math.max(best, 1 + memo[i + len]);
        }
        memo[i] = best;
      }
      return memo[0];
    };
    return {
      slug: "maximum-deletions-on-a-string",
      title: "Maximum Deletions on a String",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Rolling Hash", "String Matching", "Hash Table", "Google", "Amazon"],
      signature: { funcName: "deleteString", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of lowercase letters. In one operation you can either:\n\n- delete **all** of `s`, or\n- delete the first `i` letters of `s`, for some `1 <= i <= s.length / 2`, provided they are **equal** to the next `i` letters — that is, `s` starts with some block written twice in a row.\n\nReturn the **maximum** number of operations needed to delete all of `s`.",
        [
          { in: "s = \"abcabcdabc\"", out: "2", note: "Delete \"abc\" (it is followed by \"abc\"), leaving \"abcdabc\"; then delete everything. No first step can be followed by more deletions." },
          { in: "s = \"aaabaab\"", out: "4", note: "Delete \"a\" → \"aabaab\", delete \"aab\" → \"aab\", delete \"a\" → \"ab\", delete all." },
          { in: "s = \"aaaaa\"", out: "5", note: "Delete one 'a' at a time." },
        ],
        ["1 <= s.length <= 4000", "s consists only of lowercase English letters"]),
      hints: [
        "After some operations the string left is always a suffix of `s`. So let `dp[i]` be the most operations that delete the suffix starting at `i`.",
        "`dp[i] = 1 + max(dp[i + len])` over every `len` with `s[i..i+len) == s[i+len..i+2len)`, or `1` if none — iterate `i` from the end.",
        "Comparing substrings naively costs `O(n)` each. Precompute `lcp[i][j]`, the length of the longest common prefix of the suffixes at `i` and `j` (`lcp[i][j] = lcp[i+1][j+1] + 1` when `s[i] == s[j]`); the halves match when `lcp[i][i+len] >= len`.",
      ],
      editorial: explain({
        idea: "Every intermediate string is a suffix of `s`, so a DP over suffixes works; the only expensive part is checking whether a suffix starts with a doubled block, which a longest-common-prefix table answers in `O(1)`.",
        steps: [
          "Process `i` from `n - 1` down to `0`, maintaining the LCP row for `i`: `lcp[j] = s[i] == s[j] ? lcpNext[j + 1] + 1 : 0` for `j > i`.",
          "Set `dp[i] = 1` (delete the whole suffix).",
          "For every `len` with `i + 2·len <= n`, if `lcp[i + len] >= len`, the first `len` letters repeat: `dp[i] = max(dp[i], 1 + dp[i + len])`.",
          "Return `dp[0]`.",
        ],
        why: "An operation removes a prefix of the current string, so the string is always a suffix `s[i..]`, and the best number of further operations depends only on `i`. The LCP of suffixes `i` and `i + len` is at least `len` exactly when the two blocks are equal, so the transition set is exact.",
        time: "O(n^2)",
        space: "O(n) with two LCP rows",
        pitfalls: [
          "A full `n × n` LCP table of ints is 64 MB at `n = 4000`; two rolling rows suffice because row `i` needs only row `i + 1`.",
          "Deleting the whole string is always allowed, so `dp[i] >= 1` — it is also the right final step.",
          "Greedily deleting the shortest repeated block is wrong: the `aaabaab` example needs a longer block in the middle.",
        ],
      }),
      examples: [
        { input: '"abcabcdabc"', expectedOutput: "2" },
        { input: '"aaabaab"', expectedOutput: "4" },
        { input: '"aaaaa"', expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 3);
        let s: string;
        if (mode === 0) {
          const unit = randLower(rng, 1, 3, pick(rng, ["a", "ab", "abc"]));
          s = unit.repeat(ri(rng, 1, Math.max(1, Math.floor(40 / unit.length))));
          if (rng() < 0.5) s += randLower(rng, 0, 4, "ab");
        } else {
          s = randLower(rng, 1, pick(rng, [1, 8, 25, 40]), pick(rng, ["a", "ab", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]));
        }
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def deleteString(s: str) -> int:
              n = len(s)
              dp = [0] * (n + 1)
              nxt = [0] * (n + 2)
              for i in range(n - 1, -1, -1):
                  cur = [0] * (n + 2)
                  ci = s[i]
                  for j in range(i + 1, n):
                      if s[j] == ci:
                          cur[j] = nxt[j + 1] + 1
                  best = 1
                  for length in range(1, (n - i) // 2 + 1):
                      if cur[i + length] >= length and dp[i + length] + 1 > best:
                          best = dp[i + length] + 1
                  dp[i] = best
                  nxt = cur
              return dp[0]
        `,
        javascript: code`
          var deleteString = function(s) {
              var n = s.length, dp = new Array(n + 1).fill(0);
              var nxt = new Array(n + 2).fill(0), cur = new Array(n + 2).fill(0);
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = 0; j <= n + 1; j++) cur[j] = 0;
                  for (var j = i + 1; j < n; j++) if (s[j] === s[i]) cur[j] = nxt[j + 1] + 1;
                  var best = 1;
                  for (var len = 1; i + 2 * len <= n; len++) {
                      if (cur[i + len] >= len && dp[i + len] + 1 > best) best = dp[i + len] + 1;
                  }
                  dp[i] = best;
                  var t = nxt; nxt = cur; cur = t;
              }
              return dp[0];
          };
        `,
        typescript: code`
          function deleteString(s: string): number {
              var n = s.length, dp: number[] = [], nxt: number[] = [], cur: number[] = [];
              for (var j = 0; j <= n + 1; j++) { dp.push(0); nxt.push(0); cur.push(0); }
              for (var i = n - 1; i >= 0; i--) {
                  for (var j = 0; j <= n + 1; j++) cur[j] = 0;
                  for (var j = i + 1; j < n; j++) if (s.charAt(j) === s.charAt(i)) cur[j] = nxt[j + 1] + 1;
                  var best = 1;
                  for (var len = 1; i + 2 * len <= n; len++) {
                      if (cur[i + len] >= len && dp[i + len] + 1 > best) best = dp[i + len] + 1;
                  }
                  dp[i] = best;
                  var t = nxt; nxt = cur; cur = t;
              }
              return dp[0];
          }
        `,
        java: code`
          public static int deleteString(String s) {
              int n = s.length();
              int[] dp = new int[n + 1], nxt = new int[n + 2], cur = new int[n + 2];
              for (int i = n - 1; i >= 0; i--) {
                  Arrays.fill(cur, 0);
                  char ci = s.charAt(i);
                  for (int j = i + 1; j < n; j++) if (s.charAt(j) == ci) cur[j] = nxt[j + 1] + 1;
                  int best = 1;
                  for (int len = 1; i + 2 * len <= n; len++) {
                      if (cur[i + len] >= len) best = Math.max(best, dp[i + len] + 1);
                  }
                  dp[i] = best;
                  int[] t = nxt; nxt = cur; cur = t;
              }
              return dp[0];
          }
        `,
        cpp: code`
          int deleteString(string s) {
              int n = s.size();
              vector<int> dp(n + 1, 0), nxt(n + 2, 0), cur(n + 2, 0);
              for (int i = n - 1; i >= 0; i--) {
                  fill(cur.begin(), cur.end(), 0);
                  for (int j = i + 1; j < n; j++) if (s[j] == s[i]) cur[j] = nxt[j + 1] + 1;
                  int best = 1;
                  for (int len = 1; i + 2 * len <= n; len++) {
                      if (cur[i + len] >= len) best = max(best, dp[i + len] + 1);
                  }
                  dp[i] = best;
                  swap(nxt, cur);
              }
              return dp[0];
          }
        `,
        c: code`
          int deleteString(const char* s) {
              int n = (int)strlen(s);
              int* dp = (int*)calloc(n + 1, sizeof(int));
              int* nxt = (int*)calloc(n + 2, sizeof(int));
              int* cur = (int*)calloc(n + 2, sizeof(int));
              for (int i = n - 1; i >= 0; i--) {
                  memset(cur, 0, sizeof(int) * (n + 2));
                  for (int j = i + 1; j < n; j++) if (s[j] == s[i]) cur[j] = nxt[j + 1] + 1;
                  int best = 1;
                  for (int len = 1; i + 2 * len <= n; len++) {
                      if (cur[i + len] >= len && dp[i + len] + 1 > best) best = dp[i + len] + 1;
                  }
                  dp[i] = best;
                  int* t = nxt; nxt = cur; cur = t;
              }
              int ans = dp[0];
              free(dp); free(nxt); free(cur);
              return ans;
          }
        `,
        csharp: code`
          public static int DeleteString(string s)
          {
              int n = s.Length;
              int[] dp = new int[n + 1], nxt = new int[n + 2], cur = new int[n + 2];
              for (int i = n - 1; i >= 0; i--)
              {
                  Array.Clear(cur, 0, cur.Length);
                  for (int j = i + 1; j < n; j++) if (s[j] == s[i]) cur[j] = nxt[j + 1] + 1;
                  int best = 1;
                  for (int len = 1; i + 2 * len <= n; len++)
                  {
                      if (cur[i + len] >= len) best = Math.Max(best, dp[i + len] + 1);
                  }
                  dp[i] = best;
                  int[] t = nxt; nxt = cur; cur = t;
              }
              return dp[0];
          }
        `,
        go: code`
          func deleteString(s string) int {
              n := len(s)
              dp := make([]int, n+1)
              nxt := make([]int, n+2)
              cur := make([]int, n+2)
              for i := n - 1; i >= 0; i-- {
                  for j := range cur {
                      cur[j] = 0
                  }
                  for j := i + 1; j < n; j++ {
                      if s[j] == s[i] {
                          cur[j] = nxt[j+1] + 1
                      }
                  }
                  best := 1
                  for l := 1; i+2*l <= n; l++ {
                      if cur[i+l] >= l && dp[i+l]+1 > best {
                          best = dp[i+l] + 1
                      }
                  }
                  dp[i] = best
                  nxt, cur = cur, nxt
              }
              return dp[0]
          }
        `,
        kotlin: code`
          fun deleteString(s: String): Int {
              val n = s.length
              val dp = IntArray(n + 1)
              var nxt = IntArray(n + 2)
              var cur = IntArray(n + 2)
              for (i in n - 1 downTo 0) {
                  cur.fill(0)
                  for (j in i + 1 until n) if (s[j] == s[i]) cur[j] = nxt[j + 1] + 1
                  var best = 1
                  var len = 1
                  while (i + 2 * len <= n) {
                      if (cur[i + len] >= len) best = maxOf(best, dp[i + len] + 1)
                      len++
                  }
                  dp[i] = best
                  val t = nxt
                  nxt = cur
                  cur = t
              }
              return dp[0]
          }
        `,
        swift: code`
          func deleteString(_ s: String) -> Int {
              let c = Array(s.utf8)
              let n = c.count
              var dp = [Int](repeating: 0, count: n + 1)
              var nxt = [Int](repeating: 0, count: n + 2)
              var cur = [Int](repeating: 0, count: n + 2)
              for i in stride(from: n - 1, through: 0, by: -1) {
                  for j in 0..<(n + 2) { cur[j] = 0 }
                  var j = i + 1
                  while j < n {
                      if c[j] == c[i] { cur[j] = nxt[j + 1] + 1 }
                      j += 1
                  }
                  var best = 1
                  var len = 1
                  while i + 2 * len <= n {
                      if cur[i + len] >= len { best = max(best, dp[i + len] + 1) }
                      len += 1
                  }
                  dp[i] = best
                  swap(&nxt, &cur)
              }
              return dp[0]
          }
        `,
        rust: code`
          fn deleteString(s: String) -> i32 {
              let c = s.as_bytes();
              let n = c.len();
              let mut dp = vec![0i32; n + 1];
              let mut nxt = vec![0usize; n + 2];
              let mut cur = vec![0usize; n + 2];
              for i in (0..n).rev() {
                  for v in cur.iter_mut() {
                      *v = 0;
                  }
                  for j in (i + 1)..n {
                      if c[j] == c[i] {
                          cur[j] = nxt[j + 1] + 1;
                      }
                  }
                  let mut best = 1;
                  let mut len = 1;
                  while i + 2 * len <= n {
                      if cur[i + len] >= len {
                          best = best.max(dp[i + len] + 1);
                      }
                      len += 1;
                  }
                  dp[i] = best;
                  std::mem::swap(&mut nxt, &mut cur);
              }
              dp[0]
          }
        `,
        php: code`
          function deleteString($s) {
              $n = strlen($s);
              $dp = array_fill(0, $n + 1, 0);
              $nxt = array_fill(0, $n + 2, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $cur = array_fill(0, $n + 2, 0);
                  $ci = $s[$i];
                  for ($j = $i + 1; $j < $n; $j++) if ($s[$j] === $ci) $cur[$j] = $nxt[$j + 1] + 1;
                  $best = 1;
                  for ($len = 1; $i + 2 * $len <= $n; $len++) {
                      if ($cur[$i + $len] >= $len && $dp[$i + $len] + 1 > $best) $best = $dp[$i + $len] + 1;
                  }
                  $dp[$i] = $best;
                  $nxt = $cur;
              }
              return $dp[0];
          }
        `,
        ruby: code`
          def deleteString(s)
            n = s.length
            c = s.bytes
            dp = Array.new(n + 1, 0)
            nxt = Array.new(n + 2, 0)
            (n - 1).downto(0) do |i|
              cur = Array.new(n + 2, 0)
              ci = c[i]
              ((i + 1)...n).each { |j| cur[j] = nxt[j + 1] + 1 if c[j] == ci }
              best = 1
              len = 1
              while i + 2 * len <= n
                best = dp[i + len] + 1 if cur[i + len] >= len && dp[i + len] + 1 > best
                len += 1
              end
              dp[i] = best
              nxt = cur
            end
            dp[0]
          end
        `,
      },
    };
  })(),

  // ── Minimum Total Distance Traveled (LC 2463) ───────────────────
  (() => {
    // Small inputs: every robot → factory assignment within the limits.
    // Larger: the sorted-order DP (robots i.. against factories j..).
    const dpRef = (robot: number[], factory: number[][]) => {
      const r = robot.slice().sort((a, b) => a - b);
      const f = factory.map((x) => x.slice()).sort((a, b) => a[0] - b[0]);
      const n = r.length, m = f.length;
      const memo = new Map<number, number>();
      const go = (i: number, j: number): number => {
        if (i === n) return 0;
        if (j === m) return Infinity;
        const key = i * 1000 + j;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = go(i, j + 1), cost = 0;
        for (let k = 1; k <= f[j][1] && i + k <= n; k++) {
          cost += Math.abs(r[i + k - 1] - f[j][0]);
          best = Math.min(best, cost + go(i + k, j + 1));
        }
        memo.set(key, best);
        return best;
      };
      return go(0, 0);
    };
    const ref = (robot: number[], factory: number[][]) => {
      const n = robot.length, m = factory.length;
      if (Math.pow(m, n) > 5000) return dpRef(robot, factory);
      let best = Infinity;
      const used = new Array(m).fill(0);
      const go = (i: number, acc: number) => {
        if (i === n) { best = Math.min(best, acc); return; }
        for (let j = 0; j < m; j++) {
          if (used[j] === factory[j][1]) continue;
          used[j]++;
          go(i + 1, acc + Math.abs(robot[i] - factory[j][0]));
          used[j]--;
        }
      };
      go(0, 0);
      return best;
    };
    return {
      slug: "minimum-total-distance-traveled",
      title: "Minimum Total Distance Traveled",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "minimumTotalDistance",
        params: [{ name: "robot", type: "int[]" as const }, { name: "factory", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Robots and factories sit on a number line. `robot[i]` is the position of robot `i`, and `factory[j] = [position_j, limit_j]` says factory `j` is at `position_j` and can repair at most `limit_j` robots. Every robot is broken.\n\nYou choose, for each robot, a direction to move (left or right). A robot moves until it reaches a factory that still has capacity; that factory repairs it and the robot stops. Robots move at the same speed and never collide. Equivalently, you assign every robot to a factory, respecting the limits, and the robot travels the distance between them.\n\nReturn the **minimum total distance** traveled by all robots. The input guarantees that every robot can be repaired.\n\n*CodeKairo note:* positions here lie in `[-10^6, 10^6]` (the original allows `±10^9`), so the answer always fits in a 32-bit integer.",
        [
          { in: "robot = [0,4,6], factory = [[2,2],[6,2]]", out: "4", note: "Robot at 0 goes to 2 (distance 2), robot at 4 goes to 2 (distance 2), robot at 6 is already at the factory at 6: total 4." },
          { in: "robot = [1,-1], factory = [[-2,1],[2,1]]", out: "2", note: "Robot at 1 goes to 2 and robot at -1 goes to -2: total 2." },
          { in: "robot = [5], factory = [[5,1]]", out: "0" },
        ],
        ["1 <= robot.length, factory.length <= 100", "factory[j].length == 2", "-10^6 <= robot[i], position_j <= 10^6", "0 <= limit_j <= robot.length", "all robot positions are distinct; all factory positions are distinct", "the factories can repair every robot"]),
      hints: [
        "Sort robots and factories by position. In some optimal assignment, the robots served by each factory form a **contiguous** block in sorted order, and the blocks go to factories left to right.",
        "So let `dp[i][j]` be the cheapest way to repair robots `i..` using factories `j..`: either skip factory `j`, or let it take the next `k` robots (`1 <= k <= limit_j`).",
        "`dp[i][j] = min(dp[i][j+1], min over k of (Σ |robot[i+t] - pos_j| for t < k) + dp[i+k][j+1])`, with `dp[n][*] = 0` and `dp[i<n][m] = ∞`.",
      ],
      editorial: explain({
        idea: "After sorting, crossing assignments are never better than uncrossed ones, so each factory serves a contiguous run of robots in order. That turns the assignment problem into a two-pointer DP over (next robot, next factory).",
        steps: [
          "Sort `robot` ascending and `factory` by position.",
          "`dp[i][j]` = minimum total distance to repair robots `i..n-1` with factories `j..m-1`; `dp[n][j] = 0`, `dp[i][m] = ∞` for `i < n`.",
          "Transition: `dp[i][j] = dp[i][j+1]` (factory `j` takes nobody), then for `k = 1..limit_j` with `i + k <= n`, accumulate `cost += |robot[i+k-1] - pos_j|` and take `cost + dp[i+k][j+1]`.",
          "Fill from `i = n, j = m` backwards and return `dp[0][0]`.",
        ],
        why: "If robot `a < b` were assigned to factories `x > y`, swapping their factories never increases `|a - x| + |b - y|` (an exchange argument on the number line), so some optimal assignment is order-preserving. In such an assignment factory `j` takes a contiguous block right after the robots taken by factories before it, which is exactly what the DP enumerates.",
        time: "O(n * m * n) in the worst case (the inner loop is bounded by each limit)",
        space: "O(n * m)",
        pitfalls: [
          "A factory with `limit = 0` can only be skipped.",
          "Use a 64-bit or large sentinel for 'impossible' and do not add to it — `∞ + cost` overflows a 32-bit int.",
          "The movement story (directions, factories passed by) is a distraction: a robot can always walk past full factories, so any capacity-respecting assignment is achievable.",
        ],
      }),
      examples: [
        { input: "[0,4,6]\n[[2,2],[6,2]]", expectedOutput: "4" },
        { input: "[1,-1]\n[[-2,1],[2,1]]", expectedOutput: "2" },
        { input: "[5]\n[[5,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.25;
        const n = ri(rng, 1, big ? 20 : 6);
        const m = ri(rng, 1, big ? 8 : 4);
        const span = pick(rng, [10, 30, 1000000]);
        const distinct = (count: number) => {
          const s = new Set<number>();
          while (s.size < count) s.add(ri(rng, -Math.max(span, count), Math.max(span, count)));
          return [...s];
        };
        const robot = shuffle(rng, distinct(n));
        const pos = shuffle(rng, distinct(m));
        const limits = pos.map(() => ri(rng, 0, Math.max(1, Math.ceil(n / m) + 1)));
        let total = limits.reduce((a, b) => a + b, 0);
        while (total < n) { limits[ri(rng, 0, m - 1)]++; total++; }
        const factory = pos.map((p, j) => [p, limits[j]]);
        return { input: `${fmtIntArr(robot)}\n${fmtIntMat(factory)}`, expectedOutput: String(ref(robot, factory)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumTotalDistance(robot: List[int], factory: List[List[int]]) -> int:
              r = sorted(robot)
              f = sorted(factory)
              n, m = len(r), len(f)
              INF = float('inf')
              dp = [[INF] * (m + 1) for _ in range(n + 1)]
              for j in range(m + 1):
                  dp[n][j] = 0
              for j in range(m - 1, -1, -1):
                  pos, limit = f[j]
                  for i in range(n - 1, -1, -1):
                      best = dp[i][j + 1]
                      cost = 0
                      for k in range(1, limit + 1):
                          if i + k > n:
                              break
                          cost += abs(r[i + k - 1] - pos)
                          cand = cost + dp[i + k][j + 1]
                          if cand < best:
                              best = cand
                      dp[i][j] = best
              return dp[0][0]
        `,
        javascript: code`
          var minimumTotalDistance = function(robot, factory) {
              var r = robot.slice().sort(function(a, b) { return a - b; });
              var f = factory.slice().sort(function(a, b) { return a[0] - b[0]; });
              var n = r.length, m = f.length, INF = Infinity, dp = [];
              for (var i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(i === n ? 0 : INF));
              for (var j = m - 1; j >= 0; j--) {
                  var pos = f[j][0], limit = f[j][1];
                  for (var i = n - 1; i >= 0; i--) {
                      var best = dp[i][j + 1], cost = 0;
                      for (var k = 1; k <= limit && i + k <= n; k++) {
                          cost += Math.abs(r[i + k - 1] - pos);
                          if (cost + dp[i + k][j + 1] < best) best = cost + dp[i + k][j + 1];
                      }
                      dp[i][j] = best;
                  }
              }
              return dp[0][0];
          };
        `,
        typescript: code`
          function minimumTotalDistance(robot: number[], factory: number[][]): number {
              var r = robot.slice().sort(function(a, b) { return a - b; });
              var f = factory.slice().sort(function(a, b) { return a[0] - b[0]; });
              var n = r.length, m = f.length, INF = Infinity, dp: number[][] = [];
              for (var i = 0; i <= n; i++) {
                  var row: number[] = [];
                  for (var j = 0; j <= m; j++) row.push(i === n ? 0 : INF);
                  dp.push(row);
              }
              for (var j = m - 1; j >= 0; j--) {
                  var pos = f[j][0], limit = f[j][1];
                  for (var i = n - 1; i >= 0; i--) {
                      var best = dp[i][j + 1], cost = 0;
                      for (var k = 1; k <= limit && i + k <= n; k++) {
                          cost += Math.abs(r[i + k - 1] - pos);
                          if (cost + dp[i + k][j + 1] < best) best = cost + dp[i + k][j + 1];
                      }
                      dp[i][j] = best;
                  }
              }
              return dp[0][0];
          }
        `,
        java: code`
          public static int minimumTotalDistance(int[] robot, int[][] factory) {
              int[] r = robot.clone();
              Arrays.sort(r);
              int[][] f = factory.clone();
              Arrays.sort(f, (a, b) -> Integer.compare(a[0], b[0]));
              int n = r.length, m = f.length;
              final long INF = Long.MAX_VALUE / 4;
              long[][] dp = new long[n + 1][m + 1];
              for (int i = 0; i < n; i++) Arrays.fill(dp[i], INF);
              for (int j = m - 1; j >= 0; j--) {
                  int pos = f[j][0], limit = f[j][1];
                  for (int i = n - 1; i >= 0; i--) {
                      long best = dp[i][j + 1], cost = 0;
                      for (int k = 1; k <= limit && i + k <= n; k++) {
                          cost += Math.abs(r[i + k - 1] - pos);
                          best = Math.min(best, cost + dp[i + k][j + 1]);
                      }
                      dp[i][j] = best;
                  }
              }
              return (int) dp[0][0];
          }
        `,
        cpp: code`
          int minimumTotalDistance(vector<int>& robot, vector<vector<int>>& factory) {
              vector<int> r = robot;
              sort(r.begin(), r.end());
              vector<vector<int>> f = factory;
              sort(f.begin(), f.end());
              int n = r.size(), m = f.size();
              const long long INF = LLONG_MAX / 4;
              vector<vector<long long>> dp(n + 1, vector<long long>(m + 1, INF));
              for (int j = 0; j <= m; j++) dp[n][j] = 0;
              for (int j = m - 1; j >= 0; j--) {
                  int pos = f[j][0], limit = f[j][1];
                  for (int i = n - 1; i >= 0; i--) {
                      long long best = dp[i][j + 1], cost = 0;
                      for (int k = 1; k <= limit && i + k <= n; k++) {
                          cost += abs(r[i + k - 1] - pos);
                          best = min(best, cost + dp[i + k][j + 1]);
                      }
                      dp[i][j] = best;
                  }
              }
              return (int)dp[0][0];
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          static int cmpRow(const void* a, const void* b) {
              int x = (*(int* const*)a)[0], y = (*(int* const*)b)[0];
              return (x > y) - (x < y);
          }

          int minimumTotalDistance(int* robot, int robotSize, int** factory, int factorySize, int* factoryColSize) {
              int n = robotSize, m = factorySize;
              int* r = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) r[i] = robot[i];
              qsort(r, n, sizeof(int), cmpInt);
              int** f = (int**)malloc(sizeof(int*) * m);
              for (int j = 0; j < m; j++) f[j] = factory[j];
              qsort(f, m, sizeof(int*), cmpRow);
              const long long INF = 4000000000000000000LL;
              long long* dp = (long long*)malloc(sizeof(long long) * (n + 1) * (m + 1));
              int W = m + 1;
              for (int i = 0; i <= n; i++) for (int j = 0; j <= m; j++) dp[i * W + j] = (i == n) ? 0 : INF;
              for (int j = m - 1; j >= 0; j--) {
                  int pos = f[j][0], limit = f[j][1];
                  for (int i = n - 1; i >= 0; i--) {
                      long long best = dp[i * W + j + 1], cost = 0;
                      for (int k = 1; k <= limit && i + k <= n; k++) {
                          long long d = (long long)r[i + k - 1] - pos;
                          cost += d < 0 ? -d : d;
                          long long cand = cost + dp[(i + k) * W + j + 1];
                          if (cand < best) best = cand;
                      }
                      dp[i * W + j] = best;
                  }
              }
              int ans = (int)dp[0];
              free(r); free(f); free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumTotalDistance(int[] robot, int[][] factory)
          {
              int[] r = (int[])robot.Clone();
              Array.Sort(r);
              int[][] f = (int[][])factory.Clone();
              Array.Sort(f, (a, b) => a[0].CompareTo(b[0]));
              int n = r.Length, m = f.Length;
              const long INF = long.MaxValue / 4;
              long[,] dp = new long[n + 1, m + 1];
              for (int i = 0; i < n; i++) for (int j = 0; j <= m; j++) dp[i, j] = INF;
              for (int j = m - 1; j >= 0; j--)
              {
                  int pos = f[j][0], limit = f[j][1];
                  for (int i = n - 1; i >= 0; i--)
                  {
                      long best = dp[i, j + 1], cost = 0;
                      for (int k = 1; k <= limit && i + k <= n; k++)
                      {
                          cost += Math.Abs(r[i + k - 1] - pos);
                          best = Math.Min(best, cost + dp[i + k, j + 1]);
                      }
                      dp[i, j] = best;
                  }
              }
              return (int)dp[0, 0];
          }
        `,
        go: code`
          func minimumTotalDistance(robot []int, factory [][]int) int {
              r := append([]int{}, robot...)
              sort.Ints(r)
              f := append([][]int{}, factory...)
              sort.Slice(f, func(a, b int) bool { return f[a][0] < f[b][0] })
              n, m := len(r), len(f)
              const INF = 1 << 60
              dp := make([][]int, n+1)
              for i := range dp {
                  dp[i] = make([]int, m+1)
                  if i < n {
                      for j := range dp[i] {
                          dp[i][j] = INF
                      }
                  }
              }
              for j := m - 1; j >= 0; j-- {
                  pos, limit := f[j][0], f[j][1]
                  for i := n - 1; i >= 0; i-- {
                      best, cost := dp[i][j+1], 0
                      for k := 1; k <= limit && i+k <= n; k++ {
                          d := r[i+k-1] - pos
                          if d < 0 {
                              d = -d
                          }
                          cost += d
                          if c := cost + dp[i+k][j+1]; c < best {
                              best = c
                          }
                      }
                      dp[i][j] = best
                  }
              }
              return dp[0][0]
          }
        `,
        kotlin: code`
          fun minimumTotalDistance(robot: IntArray, factory: Array<IntArray>): Int {
              val r = robot.sortedArray()
              val f = factory.sortedBy { it[0] }
              val n = r.size
              val m = f.size
              val inf = Long.MAX_VALUE / 4
              val dp = Array(n + 1) { i -> LongArray(m + 1) { if (i == n) 0L else inf } }
              for (j in m - 1 downTo 0) {
                  val pos = f[j][0]
                  val limit = f[j][1]
                  for (i in n - 1 downTo 0) {
                      var best = dp[i][j + 1]
                      var cost = 0L
                      var k = 1
                      while (k <= limit && i + k <= n) {
                          cost += Math.abs(r[i + k - 1] - pos)
                          best = minOf(best, cost + dp[i + k][j + 1])
                          k++
                      }
                      dp[i][j] = best
                  }
              }
              return dp[0][0].toInt()
          }
        `,
        swift: code`
          func minimumTotalDistance(_ robot: [Int], _ factory: [[Int]]) -> Int {
              let r = robot.sorted()
              let f = factory.sorted { $0[0] < $1[0] }
              let n = r.count, m = f.count
              let inf = Int.max / 4
              var dp = [[Int]](repeating: [Int](repeating: inf, count: m + 1), count: n + 1)
              for j in 0...m { dp[n][j] = 0 }
              for j in stride(from: m - 1, through: 0, by: -1) {
                  let pos = f[j][0], limit = f[j][1]
                  for i in stride(from: n - 1, through: 0, by: -1) {
                      var best = dp[i][j + 1]
                      var cost = 0
                      var k = 1
                      while k <= limit && i + k <= n {
                          cost += abs(r[i + k - 1] - pos)
                          best = min(best, cost + dp[i + k][j + 1])
                          k += 1
                      }
                      dp[i][j] = best
                  }
              }
              return dp[0][0]
          }
        `,
        rust: code`
          fn minimumTotalDistance(robot: Vec<i32>, factory: Vec<Vec<i32>>) -> i32 {
              let mut r = robot.clone();
              r.sort();
              let mut f = factory.clone();
              f.sort_by_key(|x| x[0]);
              let n = r.len();
              let m = f.len();
              let inf = std::i64::MAX / 4;
              let mut dp = vec![vec![inf; m + 1]; n + 1];
              for j in 0..=m {
                  dp[n][j] = 0;
              }
              for j in (0..m).rev() {
                  let pos = f[j][0] as i64;
                  let limit = f[j][1] as usize;
                  for i in (0..n).rev() {
                      let mut best = dp[i][j + 1];
                      let mut cost = 0i64;
                      let mut k = 1;
                      while k <= limit && i + k <= n {
                          cost += (r[i + k - 1] as i64 - pos).abs();
                          best = best.min(cost + dp[i + k][j + 1]);
                          k += 1;
                      }
                      dp[i][j] = best;
                  }
              }
              dp[0][0] as i32
          }
        `,
        php: code`
          function minimumTotalDistance($robot, $factory) {
              $r = $robot;
              sort($r);
              $f = $factory;
              usort($f, function ($a, $b) { return $a[0] <=> $b[0]; });
              $n = count($r);
              $m = count($f);
              $INF = PHP_INT_MAX >> 2;
              $dp = [];
              for ($i = 0; $i <= $n; $i++) $dp[$i] = array_fill(0, $m + 1, $i == $n ? 0 : $INF);
              for ($j = $m - 1; $j >= 0; $j--) {
                  $pos = $f[$j][0];
                  $limit = $f[$j][1];
                  for ($i = $n - 1; $i >= 0; $i--) {
                      $best = $dp[$i][$j + 1];
                      $cost = 0;
                      for ($k = 1; $k <= $limit && $i + $k <= $n; $k++) {
                          $cost += abs($r[$i + $k - 1] - $pos);
                          $cand = $cost + $dp[$i + $k][$j + 1];
                          if ($cand < $best) $best = $cand;
                      }
                      $dp[$i][$j] = $best;
                  }
              }
              return $dp[0][0];
          }
        `,
        ruby: code`
          def minimumTotalDistance(robot, factory)
            r = robot.sort
            f = factory.sort_by { |x| x[0] }
            n = r.length
            m = f.length
            inf = Float::INFINITY
            dp = Array.new(n + 1) { |i| Array.new(m + 1, i == n ? 0 : inf) }
            (m - 1).downto(0) do |j|
              pos, limit = f[j]
              (n - 1).downto(0) do |i|
                best = dp[i][j + 1]
                cost = 0
                k = 1
                while k <= limit && i + k <= n
                  cost += (r[i + k - 1] - pos).abs
                  cand = cost + dp[i + k][j + 1]
                  best = cand if cand < best
                  k += 1
                end
                dp[i][j] = best
              end
            end
            dp[0][0]
          end
        `,
      },
    };
  })(),

  // ── Count Increasing Quadruplets (LC 2552) ──────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let count = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (nums[i] >= nums[j]) continue;
        for (let k = j + 1; k < n; k++) {
          if (!(nums[i] < nums[k] && nums[k] < nums[j])) continue;
          for (let l = k + 1; l < n; l++) if (nums[l] > nums[j]) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-increasing-quadruplets",
      title: "Count Increasing Quadruplets",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Binary Indexed Tree", "Enumeration", "Prefix Sum", "Amazon"],
      signature: { funcName: "countQuadruplets", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of length `n` that is a permutation of `1..n`. A quadruplet of indices `(i, j, k, l)` is **increasing** when:\n\n- `0 <= i < j < k < l < n`, and\n- `nums[i] < nums[k] < nums[j] < nums[l]`.\n\nNote the middle two are swapped: the value at `k` sits between the values at `i` and `j`. Return the number of increasing quadruplets.\n\n*CodeKairo note:* `n` is at most 400 here (the original allows 4000), so the count — at most `C(400, 4)` — always fits in a 32-bit integer.",
        [
          { in: "nums = [1,3,2,4,5]", out: "2", note: "(0,1,2,3): 1 < 2 < 3 < 4, and (0,1,2,4): 1 < 2 < 3 < 5." },
          { in: "nums = [1,2,3,4]", out: "0", note: "The only quadruplet has nums[k] = 3 > nums[j] = 2." },
          { in: "nums = [2,4,3,1,5]", out: "1", note: "Only (0,1,2,4): 2 < 3 < 4 < 5." },
        ],
        ["4 <= nums.length <= 400", "1 <= nums[i] <= nums.length", "all values are distinct (nums is a permutation)"]),
      hints: [
        "Fix the middle pair `(j, k)` with `j < k` and `nums[j] > nums[k]`. The quadruplets through it number (indices `i < j` with `nums[i] < nums[k]`) × (indices `l > k` with `nums[l] > nums[j]`).",
        "Those counts can be precomputed in prefix tables in `O(n^2)` — or folded into a single pass.",
        "Single pass: scan `l` from left to right; for each earlier `j`, keep `cnt[j]` = number of pairs `(i, k)` with `i < j < k < l`, `nums[i] < nums[k] < nums[j]`. When `nums[j] < nums[l]`, add `cnt[j]` to the answer; otherwise `l` can serve as a new `k` for `j`, adding the number of earlier indices with values below `nums[l]`.",
      ],
      editorial: explain({
        idea: "Count by the middle pair. Sweeping the last index `l` and keeping, for every `j`, how many valid `(i, k)` pairs already sit around it gives an `O(n^2)` count without extra tables.",
        steps: [
          "Keep `cnt[j]` = number of pairs `(i, k)` seen so far with `i < j < k` and `nums[i] < nums[k] < nums[j]`.",
          "For each `l` from left to right, set `smaller = 0` and scan `j` from `0` to `l - 1`:",
          "If `nums[j] < nums[l]`: every pair counted in `cnt[j]` combines with `l` (since `nums[l] > nums[j]`), so add `cnt[j]` to the answer, and increment `smaller` (one more index before `l` with a smaller value).",
          "Otherwise (`nums[j] > nums[l]`): `l` can be the `k` of a new pair for `j`, with any of the `smaller` indices before `j` as `i` — add `smaller` to `cnt[j]`.",
          "Return the answer.",
        ],
        why: "When `j` is visited in the inner loop for a given `l`, `smaller` counts the indices `i < j` with `nums[i] < nums[l]`, which is exactly the number of ways to pick `i` when `l` plays the role of `k`. And when `nums[l] > nums[j]`, all pairs `(i, k)` recorded for `j` have `k < l`, so each forms a quadruplet with `l`. Every quadruplet is counted exactly once, at its `l`.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "The pattern is `i < k < j < l` in **value** order — a 1-3-2-4 shape — not a plain increasing run.",
          "In the original problem the count needs 64 bits; here `n <= 400` keeps it inside 32 bits, but the `O(n^4)` brute force is far too slow either way.",
          "Update `cnt[j]` with `smaller` **as of index `j`** — counting indices after `j` would break `i < j`.",
        ],
      }),
      examples: [
        { input: "[1,3,2,4,5]", expectedOutput: "2" },
        { input: "[1,2,3,4]", expectedOutput: "0" },
        { input: "[2,4,3,1,5]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 4, pick(rng, [5, 10, 25]));
        const nums = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countQuadruplets(nums: List[int]) -> int:
              n = len(nums)
              cnt = [0] * n
              ans = 0
              for l in range(n):
                  smaller = 0
                  vl = nums[l]
                  for j in range(l):
                      if nums[j] < vl:
                          smaller += 1
                          ans += cnt[j]
                      else:
                          cnt[j] += smaller
              return ans
        `,
        javascript: code`
          var countQuadruplets = function(nums) {
              var n = nums.length, cnt = new Array(n).fill(0), ans = 0;
              for (var l = 0; l < n; l++) {
                  var smaller = 0;
                  for (var j = 0; j < l; j++) {
                      if (nums[j] < nums[l]) { smaller++; ans += cnt[j]; }
                      else cnt[j] += smaller;
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function countQuadruplets(nums: number[]): number {
              var n = nums.length, cnt: number[] = [], ans = 0;
              for (var t = 0; t < n; t++) cnt.push(0);
              for (var l = 0; l < n; l++) {
                  var smaller = 0;
                  for (var j = 0; j < l; j++) {
                      if (nums[j] < nums[l]) { smaller++; ans += cnt[j]; }
                      else cnt[j] += smaller;
                  }
              }
              return ans;
          }
        `,
        java: code`
          public static int countQuadruplets(int[] nums) {
              int n = nums.length;
              int[] cnt = new int[n];
              int ans = 0;
              for (int l = 0; l < n; l++) {
                  int smaller = 0;
                  for (int j = 0; j < l; j++) {
                      if (nums[j] < nums[l]) { smaller++; ans += cnt[j]; }
                      else cnt[j] += smaller;
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          int countQuadruplets(vector<int>& nums) {
              int n = nums.size();
              vector<int> cnt(n, 0);
              int ans = 0;
              for (int l = 0; l < n; l++) {
                  int smaller = 0;
                  for (int j = 0; j < l; j++) {
                      if (nums[j] < nums[l]) { smaller++; ans += cnt[j]; }
                      else cnt[j] += smaller;
                  }
              }
              return ans;
          }
        `,
        c: code`
          int countQuadruplets(int* nums, int numsSize) {
              int n = numsSize;
              int* cnt = (int*)calloc(n, sizeof(int));
              int ans = 0;
              for (int l = 0; l < n; l++) {
                  int smaller = 0;
                  for (int j = 0; j < l; j++) {
                      if (nums[j] < nums[l]) { smaller++; ans += cnt[j]; }
                      else cnt[j] += smaller;
                  }
              }
              free(cnt);
              return ans;
          }
        `,
        csharp: code`
          public static int CountQuadruplets(int[] nums)
          {
              int n = nums.Length;
              int[] cnt = new int[n];
              int ans = 0;
              for (int l = 0; l < n; l++)
              {
                  int smaller = 0;
                  for (int j = 0; j < l; j++)
                  {
                      if (nums[j] < nums[l]) { smaller++; ans += cnt[j]; }
                      else cnt[j] += smaller;
                  }
              }
              return ans;
          }
        `,
        go: code`
          func countQuadruplets(nums []int) int {
              n := len(nums)
              cnt := make([]int, n)
              ans := 0
              for l := 0; l < n; l++ {
                  smaller := 0
                  for j := 0; j < l; j++ {
                      if nums[j] < nums[l] {
                          smaller++
                          ans += cnt[j]
                      } else {
                          cnt[j] += smaller
                      }
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun countQuadruplets(nums: IntArray): Int {
              val n = nums.size
              val cnt = IntArray(n)
              var ans = 0
              for (l in 0 until n) {
                  var smaller = 0
                  for (j in 0 until l) {
                      if (nums[j] < nums[l]) {
                          smaller++
                          ans += cnt[j]
                      } else {
                          cnt[j] += smaller
                      }
                  }
              }
              return ans
          }
        `,
        swift: code`
          func countQuadruplets(_ nums: [Int]) -> Int {
              let n = nums.count
              var cnt = [Int](repeating: 0, count: n)
              var ans = 0
              for l in 0..<n {
                  var smaller = 0
                  for j in 0..<l {
                      if nums[j] < nums[l] {
                          smaller += 1
                          ans += cnt[j]
                      } else {
                          cnt[j] += smaller
                      }
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn countQuadruplets(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut cnt = vec![0i32; n];
              let mut ans = 0i32;
              for l in 0..n {
                  let mut smaller = 0i32;
                  for j in 0..l {
                      if nums[j] < nums[l] {
                          smaller += 1;
                          ans += cnt[j];
                      } else {
                          cnt[j] += smaller;
                      }
                  }
              }
              ans
          }
        `,
        php: code`
          function countQuadruplets($nums) {
              $n = count($nums);
              $cnt = array_fill(0, $n, 0);
              $ans = 0;
              for ($l = 0; $l < $n; $l++) {
                  $smaller = 0;
                  $vl = $nums[$l];
                  for ($j = 0; $j < $l; $j++) {
                      if ($nums[$j] < $vl) { $smaller++; $ans += $cnt[$j]; }
                      else $cnt[$j] += $smaller;
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def countQuadruplets(nums)
            n = nums.length
            cnt = Array.new(n, 0)
            ans = 0
            n.times do |l|
              smaller = 0
              vl = nums[l]
              l.times do |j|
                if nums[j] < vl
                  smaller += 1
                  ans += cnt[j]
                else
                  cnt[j] += smaller
                end
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximum Strictly Increasing Cells in a Matrix (LC 2713) ─────
  (() => {
    // Memoised longest walk: from a cell, any strictly larger cell in its
    // row or column.
    const ref = (mat: number[][]) => {
      const m = mat.length, n = mat[0].length, memo = new Map<number, number>();
      const f = (r: number, c: number): number => {
        const key = r * n + c;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = 1;
        for (let x = 0; x < m; x++) if (mat[x][c] > mat[r][c]) best = Math.max(best, 1 + f(x, c));
        for (let y = 0; y < n; y++) if (mat[r][y] > mat[r][c]) best = Math.max(best, 1 + f(r, y));
        memo.set(key, best);
        return best;
      };
      let ans = 0;
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) ans = Math.max(ans, f(r, c));
      return ans;
    };
    return {
      slug: "maximum-strictly-increasing-cells-in-a-matrix",
      title: "Maximum Strictly Increasing Cells in a Matrix",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Dynamic Programming", "Memoization", "Sorting", "Matrix", "Ordered Set", "Google", "Amazon"],
      signature: { funcName: "maxIncreasingCells", params: [{ name: "mat", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` integer matrix `mat`. Start from any cell. From the current cell you may jump to **any** other cell in the same row or the same column, as long as its value is **strictly greater** than the current cell's value. You can keep jumping as long as a move exists.\n\nReturn the maximum number of cells you can visit (counting the starting cell).",
        [
          { in: "mat = [[3,1],[3,4]]", out: "2", note: "From 1 jump to 3 or 4 (same row/column), then no further strictly larger cell is reachable." },
          { in: "mat = [[1,1],[1,1]]", out: "1", note: "No value is strictly larger than another." },
          { in: "mat = [[3,1,6],[-9,5,7]]", out: "4", note: "-9 → 3 (same column) → 6 (same row) → 7 (same column) visits 4 cells." },
        ],
        ["m == mat.length", "n == mat[i].length", "1 <= m, n <= 10^5", "1 <= m * n <= 10^5", "-10^5 <= mat[i][j] <= 10^5"]),
      hints: [
        "Process the cells in increasing order of value. The best path ending at a cell only depends on smaller cells in its row and column.",
        "Keep `rowBest[r]` = the longest path ending at any processed cell of row `r`, and `colBest[c]` likewise. A cell's best is `1 + max(rowBest[r], colBest[c])`.",
        "Cells with **equal** values must not chain into each other: compute every cell of one value first, and only then update `rowBest`/`colBest`.",
      ],
      editorial: explain({
        idea: "A path visits strictly increasing values, so processing cells in increasing value order means every possible predecessor is already finished. The predecessors of a cell are only its row and column, so two arrays of 'best so far' per row and per column replace scanning them.",
        steps: [
          "Sort all cells by value.",
          "Walk the sorted cells one group of equal values at a time.",
          "For each cell `(r, c)` in the group, compute `best = 1 + max(rowBest[r], colBest[c])` from the arrays as they were before the group.",
          "Then apply the group: `rowBest[r] = max(rowBest[r], best)` and `colBest[c] = max(colBest[c], best)`; track the overall maximum.",
          "Return the maximum.",
        ],
        why: "When a cell is processed, `rowBest[r]` and `colBest[c]` hold the longest paths ending at strictly smaller cells of its row and column — exactly the cells that may jump into it — so `1 + max` is the longest path ending there. Deferring the updates within an equal-value group keeps equal cells from counting each other, which the strict inequality forbids.",
        time: "O(m n log(m n))",
        space: "O(m n)",
        pitfalls: [
          "Updating `rowBest`/`colBest` immediately inside a group of equal values lets equal cells chain — wrong for strictly increasing jumps.",
          "A jump can skip any number of cells in the row or column; it is not a move to a neighbour.",
          "The matrix can be one long row or column (`m * n <= 10^5`), so do not allocate `m × n` by `max(m, n)` tables.",
        ],
      }),
      examples: [
        { input: "[[3,1],[3,4]]", expectedOutput: "2" },
        { input: "[[1,1],[1,1]]", expectedOutput: "1" },
        { input: "[[3,1,6],[-9,5,7]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 7]));
        const n = ri(rng, 1, pick(rng, [1, 3, 7]));
        const span = pick(rng, [1, 3, 10, 100000]);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, -span, span)));
        return { input: fmtIntMat(mat), expectedOutput: String(ref(mat)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxIncreasingCells(mat: List[List[int]]) -> int:
              m, n = len(mat), len(mat[0])
              cells = sorted((mat[r][c], r, c) for r in range(m) for c in range(n))
              row_best = [0] * m
              col_best = [0] * n
              ans = 0
              i = 0
              total = len(cells)
              while i < total:
                  j = i
                  while j < total and cells[j][0] == cells[i][0]:
                      j += 1
                  results = []
                  for t in range(i, j):
                      _, r, c = cells[t]
                      results.append(1 + max(row_best[r], col_best[c]))
                  for t in range(i, j):
                      _, r, c = cells[t]
                      best = results[t - i]
                      if best > row_best[r]:
                          row_best[r] = best
                      if best > col_best[c]:
                          col_best[c] = best
                      if best > ans:
                          ans = best
                  i = j
              return ans
        `,
        javascript: code`
          var maxIncreasingCells = function(mat) {
              var m = mat.length, n = mat[0].length, total = m * n, order = [];
              for (var t = 0; t < total; t++) order.push(t);
              order.sort(function(a, b) {
                  return mat[(a / n) | 0][a % n] - mat[(b / n) | 0][b % n];
              });
              var rowBest = new Array(m).fill(0), colBest = new Array(n).fill(0), ans = 0;
              var results = new Array(total);
              for (var i = 0; i < total;) {
                  var v = mat[(order[i] / n) | 0][order[i] % n], j = i;
                  while (j < total && mat[(order[j] / n) | 0][order[j] % n] === v) j++;
                  for (var t = i; t < j; t++) {
                      var r = (order[t] / n) | 0, c = order[t] % n;
                      results[t] = 1 + Math.max(rowBest[r], colBest[c]);
                  }
                  for (var t = i; t < j; t++) {
                      var r = (order[t] / n) | 0, c = order[t] % n, best = results[t];
                      if (best > rowBest[r]) rowBest[r] = best;
                      if (best > colBest[c]) colBest[c] = best;
                      if (best > ans) ans = best;
                  }
                  i = j;
              }
              return ans;
          };
        `,
        typescript: code`
          function maxIncreasingCells(mat: number[][]): number {
              var m = mat.length, n = mat[0].length, total = m * n, order: number[] = [];
              for (var t = 0; t < total; t++) order.push(t);
              order.sort(function(a, b) {
                  return mat[(a / n) | 0][a % n] - mat[(b / n) | 0][b % n];
              });
              var rowBest: number[] = [], colBest: number[] = [], results: number[] = [], ans = 0;
              for (var r0 = 0; r0 < m; r0++) rowBest.push(0);
              for (var c0 = 0; c0 < n; c0++) colBest.push(0);
              for (var t = 0; t < total; t++) results.push(0);
              for (var i = 0; i < total;) {
                  var v = mat[(order[i] / n) | 0][order[i] % n], j = i;
                  while (j < total && mat[(order[j] / n) | 0][order[j] % n] === v) j++;
                  for (var t = i; t < j; t++) {
                      var r = (order[t] / n) | 0, c = order[t] % n;
                      results[t] = 1 + Math.max(rowBest[r], colBest[c]);
                  }
                  for (var t = i; t < j; t++) {
                      var r = (order[t] / n) | 0, c = order[t] % n, best = results[t];
                      if (best > rowBest[r]) rowBest[r] = best;
                      if (best > colBest[c]) colBest[c] = best;
                      if (best > ans) ans = best;
                  }
                  i = j;
              }
              return ans;
          }
        `,
        java: code`
          public static int maxIncreasingCells(int[][] mat) {
              int m = mat.length, n = mat[0].length, total = m * n;
              long[] key = new long[total];
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++)
                      key[r * n + c] = (long) (mat[r][c] + 100000) * total + (r * n + c);
              Arrays.sort(key);
              int[] rowBest = new int[m], colBest = new int[n], results = new int[total];
              int ans = 0;
              for (int i = 0; i < total;) {
                  long v = key[i] / total;
                  int j = i;
                  while (j < total && key[j] / total == v) j++;
                  for (int t = i; t < j; t++) {
                      int idx = (int) (key[t] % total), r = idx / n, c = idx % n;
                      results[t] = 1 + Math.max(rowBest[r], colBest[c]);
                  }
                  for (int t = i; t < j; t++) {
                      int idx = (int) (key[t] % total), r = idx / n, c = idx % n;
                      rowBest[r] = Math.max(rowBest[r], results[t]);
                      colBest[c] = Math.max(colBest[c], results[t]);
                      ans = Math.max(ans, results[t]);
                  }
                  i = j;
              }
              return ans;
          }
        `,
        cpp: code`
          int maxIncreasingCells(vector<vector<int>>& mat) {
              int m = mat.size(), n = mat[0].size(), total = m * n;
              vector<pair<int, int>> cells;
              cells.reserve(total);
              for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) cells.push_back({mat[r][c], r * n + c});
              sort(cells.begin(), cells.end());
              vector<int> rowBest(m, 0), colBest(n, 0), results(total, 0);
              int ans = 0;
              for (int i = 0; i < total;) {
                  int j = i;
                  while (j < total && cells[j].first == cells[i].first) j++;
                  for (int t = i; t < j; t++) {
                      int r = cells[t].second / n, c = cells[t].second % n;
                      results[t] = 1 + max(rowBest[r], colBest[c]);
                  }
                  for (int t = i; t < j; t++) {
                      int r = cells[t].second / n, c = cells[t].second % n;
                      rowBest[r] = max(rowBest[r], results[t]);
                      colBest[c] = max(colBest[c], results[t]);
                      ans = max(ans, results[t]);
                  }
                  i = j;
              }
              return ans;
          }
        `,
        c: code`
          static int cmpKey(const void* a, const void* b) {
              long long x = *(const long long*)a, y = *(const long long*)b;
              return (x > y) - (x < y);
          }

          int maxIncreasingCells(int** mat, int matSize, int* matColSize) {
              int m = matSize, n = matColSize[0], total = m * n;
              long long* key = (long long*)malloc(sizeof(long long) * total);
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++)
                      key[r * n + c] = (long long)(mat[r][c] + 100000) * total + (r * n + c);
              qsort(key, total, sizeof(long long), cmpKey);
              int* rowBest = (int*)calloc(m, sizeof(int));
              int* colBest = (int*)calloc(n, sizeof(int));
              int* results = (int*)malloc(sizeof(int) * total);
              int ans = 0;
              for (int i = 0; i < total;) {
                  long long v = key[i] / total;
                  int j = i;
                  while (j < total && key[j] / total == v) j++;
                  for (int t = i; t < j; t++) {
                      int idx = (int)(key[t] % total), r = idx / n, c = idx % n;
                      results[t] = 1 + (rowBest[r] > colBest[c] ? rowBest[r] : colBest[c]);
                  }
                  for (int t = i; t < j; t++) {
                      int idx = (int)(key[t] % total), r = idx / n, c = idx % n;
                      if (results[t] > rowBest[r]) rowBest[r] = results[t];
                      if (results[t] > colBest[c]) colBest[c] = results[t];
                      if (results[t] > ans) ans = results[t];
                  }
                  i = j;
              }
              free(key); free(rowBest); free(colBest); free(results);
              return ans;
          }
        `,
        csharp: code`
          public static int MaxIncreasingCells(int[][] mat)
          {
              int m = mat.Length, n = mat[0].Length, total = m * n;
              long[] key = new long[total];
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++)
                      key[r * n + c] = (long)(mat[r][c] + 100000) * total + (r * n + c);
              Array.Sort(key);
              int[] rowBest = new int[m], colBest = new int[n], results = new int[total];
              int ans = 0;
              for (int i = 0; i < total;)
              {
                  long v = key[i] / total;
                  int j = i;
                  while (j < total && key[j] / total == v) j++;
                  for (int t = i; t < j; t++)
                  {
                      int idx = (int)(key[t] % total), r = idx / n, c = idx % n;
                      results[t] = 1 + Math.Max(rowBest[r], colBest[c]);
                  }
                  for (int t = i; t < j; t++)
                  {
                      int idx = (int)(key[t] % total), r = idx / n, c = idx % n;
                      rowBest[r] = Math.Max(rowBest[r], results[t]);
                      colBest[c] = Math.Max(colBest[c], results[t]);
                      ans = Math.Max(ans, results[t]);
                  }
                  i = j;
              }
              return ans;
          }
        `,
        go: code`
          func maxIncreasingCells(mat [][]int) int {
              m, n := len(mat), len(mat[0])
              total := m * n
              order := make([]int, total)
              for i := range order {
                  order[i] = i
              }
              val := func(idx int) int { return mat[idx/n][idx%n] }
              sort.Slice(order, func(a, b int) bool { return val(order[a]) < val(order[b]) })
              rowBest := make([]int, m)
              colBest := make([]int, n)
              results := make([]int, total)
              ans := 0
              for i := 0; i < total; {
                  j := i
                  for j < total && val(order[j]) == val(order[i]) {
                      j++
                  }
                  for t := i; t < j; t++ {
                      r, c := order[t]/n, order[t]%n
                      best := rowBest[r]
                      if colBest[c] > best {
                          best = colBest[c]
                      }
                      results[t] = best + 1
                  }
                  for t := i; t < j; t++ {
                      r, c := order[t]/n, order[t]%n
                      if results[t] > rowBest[r] {
                          rowBest[r] = results[t]
                      }
                      if results[t] > colBest[c] {
                          colBest[c] = results[t]
                      }
                      if results[t] > ans {
                          ans = results[t]
                      }
                  }
                  i = j
              }
              return ans
          }
        `,
        kotlin: code`
          fun maxIncreasingCells(mat: Array<IntArray>): Int {
              val m = mat.size
              val n = mat[0].size
              val total = m * n
              val key = LongArray(total) { idx -> (mat[idx / n][idx % n] + 100000).toLong() * total + idx }
              key.sort()
              val rowBest = IntArray(m)
              val colBest = IntArray(n)
              val results = IntArray(total)
              var ans = 0
              var i = 0
              while (i < total) {
                  val v = key[i] / total
                  var j = i
                  while (j < total && key[j] / total == v) j++
                  for (t in i until j) {
                      val idx = (key[t] % total).toInt()
                      results[t] = 1 + maxOf(rowBest[idx / n], colBest[idx % n])
                  }
                  for (t in i until j) {
                      val idx = (key[t] % total).toInt()
                      val r = idx / n
                      val c = idx % n
                      rowBest[r] = maxOf(rowBest[r], results[t])
                      colBest[c] = maxOf(colBest[c], results[t])
                      ans = maxOf(ans, results[t])
                  }
                  i = j
              }
              return ans
          }
        `,
        swift: code`
          func maxIncreasingCells(_ mat: [[Int]]) -> Int {
              let m = mat.count, n = mat[0].count, total = m * n
              let order = (0..<total).sorted { mat[$0 / n][$0 % n] < mat[$1 / n][$1 % n] }
              var rowBest = [Int](repeating: 0, count: m)
              var colBest = [Int](repeating: 0, count: n)
              var results = [Int](repeating: 0, count: total)
              var ans = 0
              var i = 0
              while i < total {
                  let v = mat[order[i] / n][order[i] % n]
                  var j = i
                  while j < total && mat[order[j] / n][order[j] % n] == v { j += 1 }
                  for t in i..<j {
                      results[t] = 1 + max(rowBest[order[t] / n], colBest[order[t] % n])
                  }
                  for t in i..<j {
                      let r = order[t] / n, c = order[t] % n
                      rowBest[r] = max(rowBest[r], results[t])
                      colBest[c] = max(colBest[c], results[t])
                      ans = max(ans, results[t])
                  }
                  i = j
              }
              return ans
          }
        `,
        rust: code`
          fn maxIncreasingCells(mat: Vec<Vec<i32>>) -> i32 {
              let m = mat.len();
              let n = mat[0].len();
              let total = m * n;
              let mut order: Vec<usize> = (0..total).collect();
              order.sort_by_key(|&idx| mat[idx / n][idx % n]);
              let mut row_best = vec![0i32; m];
              let mut col_best = vec![0i32; n];
              let mut results = vec![0i32; total];
              let mut ans = 0;
              let mut i = 0;
              while i < total {
                  let v = mat[order[i] / n][order[i] % n];
                  let mut j = i;
                  while j < total && mat[order[j] / n][order[j] % n] == v {
                      j += 1;
                  }
                  for t in i..j {
                      results[t] = 1 + row_best[order[t] / n].max(col_best[order[t] % n]);
                  }
                  for t in i..j {
                      let (r, c) = (order[t] / n, order[t] % n);
                      row_best[r] = row_best[r].max(results[t]);
                      col_best[c] = col_best[c].max(results[t]);
                      ans = ans.max(results[t]);
                  }
                  i = j;
              }
              ans
          }
        `,
        php: code`
          function maxIncreasingCells($mat) {
              $m = count($mat);
              $n = count($mat[0]);
              $cells = [];
              for ($r = 0; $r < $m; $r++) for ($c = 0; $c < $n; $c++) $cells[] = [$mat[$r][$c], $r, $c];
              usort($cells, function ($a, $b) { return $a[0] <=> $b[0]; });
              $total = count($cells);
              $rowBest = array_fill(0, $m, 0);
              $colBest = array_fill(0, $n, 0);
              $ans = 0;
              for ($i = 0; $i < $total;) {
                  $j = $i;
                  while ($j < $total && $cells[$j][0] == $cells[$i][0]) $j++;
                  $results = [];
                  for ($t = $i; $t < $j; $t++) $results[$t] = 1 + max($rowBest[$cells[$t][1]], $colBest[$cells[$t][2]]);
                  for ($t = $i; $t < $j; $t++) {
                      $r = $cells[$t][1];
                      $c = $cells[$t][2];
                      if ($results[$t] > $rowBest[$r]) $rowBest[$r] = $results[$t];
                      if ($results[$t] > $colBest[$c]) $colBest[$c] = $results[$t];
                      if ($results[$t] > $ans) $ans = $results[$t];
                  }
                  $i = $j;
              }
              return $ans;
          }
        `,
        ruby: code`
          def maxIncreasingCells(mat)
            m = mat.length
            n = mat[0].length
            cells = []
            m.times { |r| n.times { |c| cells << [mat[r][c], r, c] } }
            cells.sort_by! { |x| x[0] }
            row_best = Array.new(m, 0)
            col_best = Array.new(n, 0)
            ans = 0
            i = 0
            total = cells.length
            while i < total
              j = i
              j += 1 while j < total && cells[j][0] == cells[i][0]
              results = (i...j).map { |t| 1 + [row_best[cells[t][1]], col_best[cells[t][2]]].max }
              (i...j).each do |t|
                _, r, c = cells[t]
                best = results[t - i]
                row_best[r] = best if best > row_best[r]
                col_best[c] = best if best > col_best[c]
                ans = best if best > ans
              end
              i = j
            end
            ans
          end
        `,
      },
    };
  })(),


  // ── Count of Integers (LC 2719) ─────────────────────────────────
  (() => {
    const MOD = 1000000007;
    const digitSum = (s: string) => [...s].reduce((a, c) => a + Number(c), 0);
    // Short ranges: walk every integer with BigInt. Long ranges: a memoised
    // (position, sum, tight) digit recursion over count(<= X).
    const upTo = (x: string, lo: number, hi: number) => {
      const memo = new Map<string, number>();
      const go = (pos: number, sum: number, tight: boolean): number => {
        if (sum > hi) return 0;
        if (pos === x.length) return sum >= lo ? 1 : 0;
        const key = `${pos},${sum},${tight}`;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        const top = tight ? Number(x[pos]) : 9;
        let total = 0;
        for (let d = 0; d <= top; d++) total = (total + go(pos + 1, sum + d, tight && d === top)) % MOD;
        memo.set(key, total);
        return total;
      };
      return go(0, 0, true);
    };
    const ref = (num1: string, num2: string, lo: number, hi: number) => {
      const a = BigInt(num1), b = BigInt(num2);
      if (b - a <= BigInt(400)) {
        let c = 0;
        for (let v = a; v <= b; v++) { const d = digitSum(v.toString()); if (d >= lo && d <= hi) c++; }
        return c % MOD;
      }
      const inside = digitSum(num1) >= lo && digitSum(num1) <= hi ? 1 : 0;
      return (((upTo(num2, lo, hi) - upTo(num1, lo, hi) + inside) % MOD) + MOD) % MOD;
    };
    const randNum = (rng: Rng, len: number) => {
      let s = String(ri(rng, 1, 9));
      for (let i = 1; i < len; i++) s += String(ri(rng, 0, 9));
      return s;
    };
    return {
      slug: "count-of-integers",
      title: "Count of Integers",
      difficulty: "HARD" as const,
      tags: ["Math", "String", "Dynamic Programming", "Digit DP", "Amazon", "Google"],
      signature: {
        funcName: "countIntegers",
        params: [
          { name: "num1", type: "string" as const },
          { name: "num2", type: "string" as const },
          { name: "min_sum", type: "int" as const },
          { name: "max_sum", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "You are given two numeric strings `num1` and `num2` and two integers `min_sum` and `max_sum`. An integer `x` is **good** when:\n\n- `num1 <= x <= num2`, and\n- `min_sum <= digit_sum(x) <= max_sum`,\n\nwhere `digit_sum(x)` is the sum of the decimal digits of `x`. Return the number of good integers. Since it can be huge, return it modulo `10^9 + 7`.",
        [
          { in: "num1 = \"1\", num2 = \"12\", min_sum = 1, max_sum = 8", out: "11", note: "1, 2, 3, 4, 5, 6, 7, 8, 10, 11 and 12 qualify." },
          { in: "num1 = \"1\", num2 = \"5\", min_sum = 1, max_sum = 5", out: "5", note: "1, 2, 3, 4 and 5." },
          { in: "num1 = \"100\", num2 = \"199\", min_sum = 20, max_sum = 400", out: "0", note: "The largest digit sum in range is 1 + 9 + 9 = 19." },
        ],
        ["1 <= num1 <= num2 <= 10^22", "1 <= min_sum <= max_sum <= 400", "num1 and num2 have no leading zeros"]),
      hints: [
        "Counting a range is the difference of two prefix counts: `good(num2) - good(num1) + [num1 is good]`, where `good(X)` counts integers in `[0, X]`.",
        "To count integers up to `X` with a given digit sum, build them digit by digit: once a digit is smaller than `X`'s digit at that position, every later digit is free. That is digit DP over (position, digit sum so far, still tight?).",
        "The digit sum never exceeds `9 × 22 = 198`, so the state space is tiny. Keep the counts modulo `10^9 + 7` and fix up a negative difference at the end.",
      ],
      editorial: explain({
        idea: "Turn the range into two prefix counts and count each prefix with a digit DP that tracks the running digit sum, splitting off the 'already smaller than X' numbers from the single 'equal to X so far' prefix.",
        steps: [
          "Define `good(X)` = number of integers `0 <= y <= X` with `min_sum <= digit_sum(y) <= max_sum`.",
          "Scan `X`'s digits left to right. Keep `free[s]` = how many prefixes are already smaller than `X`'s prefix with digit sum `s` (leading zeros allowed — they add nothing), plus the sum `t` of `X`'s own prefix.",
          "At each digit `d`: every `free[s]` extends with any digit `0..9`; the tight prefix extends with digits `0..d-1` into `free`; then `t += d`.",
          "At the end `good(X)` = Σ `free[s]` over `s` in range, plus 1 if `t` itself is in range (the number `X`).",
          "Answer: `good(num2) - good(num1) + [digit_sum(num1) in range]`, taken modulo `10^9 + 7`.",
        ],
        why: "Every integer below `X` (padded with leading zeros to the same length) has a unique first position where it drops below `X`; at that point it enters `free` exactly once, and the free extensions enumerate all of its continuations. So each `y < X` is counted once with its digit sum, and `X` itself is handled separately.",
        time: "O(L · S · 10) for L ≤ 23 digits and S ≤ 199 reachable sums",
        space: "O(S)",
        pitfalls: [
          "`num1` and `num2` exceed 64-bit integers — never convert them to numbers.",
          "`good(num2) - good(num1)` excludes `num1` itself; add it back when its digit sum qualifies.",
          "The modular difference can be negative; add the modulus before the final reduction.",
        ],
      }),
      examples: [
        { input: '"1"\n"12"\n1\n8', expectedOutput: "11" },
        { input: '"1"\n"5"\n1\n5', expectedOutput: "5" },
        { input: '"100"\n"199"\n20\n400', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        let num1: string, num2: string;
        if (rng() < 0.5) {
          num1 = randNum(rng, ri(rng, 1, pick(rng, [3, 10, 22])));
          let b = BigInt(num1) + BigInt(ri(rng, 0, 400));
          if (b > BigInt("10000000000000000000000")) b = BigInt("10000000000000000000000");
          if (b < BigInt(num1)) b = BigInt(num1);
          num2 = b.toString();
        } else {
          const l2 = ri(rng, 1, pick(rng, [8, 15, 22, 23]));
          num2 = l2 === 23 ? "10000000000000000000000" : randNum(rng, l2);
          const l1 = ri(rng, 1, num2.length);
          num1 = randNum(rng, l1);
          if (BigInt(num1) > BigInt(num2)) [num1, num2] = [num2, num1];
        }
        const lo = ri(rng, 1, pick(rng, [5, 30, 100, 400]));
        const hi = ri(rng, lo, pick(rng, [lo, lo + 10, 400]));
        return { input: `${JSON.stringify(num1)}\n${JSON.stringify(num2)}\n${lo}\n${hi}`, expectedOutput: String(ref(num1, num2, lo, hi)) };
      },
      hiddenCount: 2000,
      solutions: {
        python: code`
          MOD = 10 ** 9 + 7

          def countIntegers(num1: str, num2: str, min_sum: int, max_sum: int) -> int:
              hi = min(max_sum, 9 * len(num2))
              if min_sum > hi:
                  return 0
              inside = 1 if min_sum <= sum(ord(c) - 48 for c in num1) <= max_sum else 0
              return (_good(num2, min_sum, hi) - _good(num1, min_sum, hi) + inside) % MOD

          def _good(x: str, lo: int, hi: int) -> int:
              free = [0] * (hi + 1)
              tight = 0
              for ch in x:
                  d = ord(ch) - 48
                  nf = [0] * (hi + 1)
                  for s in range(hi + 1):
                      nf[s] = sum(free[max(0, s - 9):s + 1]) % MOD
                  for k in range(d):
                      if tight + k <= hi:
                          nf[tight + k] += 1
                  tight += d
                  free = nf
              total = sum(free[lo:hi + 1])
              if lo <= tight <= hi:
                  total += 1
              return total % MOD
        `,
        javascript: code`
          var countIntegers = function(num1, num2, min_sum, max_sum) {
              var MOD = 1000000007;
              var hi = Math.min(max_sum, 9 * num2.length);
              if (min_sum > hi) return 0;
              var good = function(x) {
                  var free = new Array(hi + 1).fill(0), tight = 0;
                  for (var p = 0; p < x.length; p++) {
                      var d = x.charCodeAt(p) - 48, nf = new Array(hi + 1).fill(0), win = 0;
                      for (var s = 0; s <= hi; s++) {
                          win += free[s];
                          if (s - 10 >= 0) win -= free[s - 10];
                          win %= MOD;
                          if (win < 0) win += MOD;
                          nf[s] = win;
                      }
                      for (var k = 0; k < d; k++) if (tight + k <= hi) nf[tight + k] = (nf[tight + k] + 1) % MOD;
                      tight += d;
                      free = nf;
                  }
                  var total = 0;
                  for (var s = min_sum; s <= hi; s++) total = (total + free[s]) % MOD;
                  if (tight >= min_sum && tight <= hi) total = (total + 1) % MOD;
                  return total;
              };
              var ds = 0;
              for (var i = 0; i < num1.length; i++) ds += num1.charCodeAt(i) - 48;
              var inside = ds >= min_sum && ds <= max_sum ? 1 : 0;
              return ((good(num2) - good(num1) + inside) % MOD + MOD) % MOD;
          };
        `,
        typescript: code`
          function countIntegers(num1: string, num2: string, min_sum: number, max_sum: number): number {
              var MOD = 1000000007;
              var hi = Math.min(max_sum, 9 * num2.length);
              if (min_sum > hi) return 0;
              var good = function(x: string): number {
                  var free: number[] = [], tight = 0;
                  for (var s = 0; s <= hi; s++) free.push(0);
                  for (var p = 0; p < x.length; p++) {
                      var d = x.charCodeAt(p) - 48, nf: number[] = [], win = 0;
                      for (var s = 0; s <= hi; s++) {
                          win += free[s];
                          if (s - 10 >= 0) win -= free[s - 10];
                          win %= MOD;
                          if (win < 0) win += MOD;
                          nf.push(win);
                      }
                      for (var k = 0; k < d; k++) if (tight + k <= hi) nf[tight + k] = (nf[tight + k] + 1) % MOD;
                      tight += d;
                      free = nf;
                  }
                  var total = 0;
                  for (var s = min_sum; s <= hi; s++) total = (total + free[s]) % MOD;
                  if (tight >= min_sum && tight <= hi) total = (total + 1) % MOD;
                  return total;
              };
              var ds = 0;
              for (var i = 0; i < num1.length; i++) ds += num1.charCodeAt(i) - 48;
              var inside = ds >= min_sum && ds <= max_sum ? 1 : 0;
              return ((good(num2) - good(num1) + inside) % MOD + MOD) % MOD;
          }
        `,
        java: code`
          static final long CNT_MOD = 1000000007L;

          static long countGood(String x, int lo, int hi) {
              long[] free = new long[hi + 1];
              int tight = 0;
              for (int p = 0; p < x.length(); p++) {
                  int d = x.charAt(p) - '0';
                  long[] nf = new long[hi + 1];
                  long win = 0;
                  for (int s = 0; s <= hi; s++) {
                      win += free[s];
                      if (s >= 10) win -= free[s - 10];
                      win = ((win % CNT_MOD) + CNT_MOD) % CNT_MOD;
                      nf[s] = win;
                  }
                  for (int k = 0; k < d; k++) if (tight + k <= hi) nf[tight + k] = (nf[tight + k] + 1) % CNT_MOD;
                  tight += d;
                  free = nf;
              }
              long total = 0;
              for (int s = lo; s <= hi; s++) total = (total + free[s]) % CNT_MOD;
              if (tight >= lo && tight <= hi) total = (total + 1) % CNT_MOD;
              return total;
          }

          public static int countIntegers(String num1, String num2, int min_sum, int max_sum) {
              int hi = Math.min(max_sum, 9 * num2.length());
              if (min_sum > hi) return 0;
              int ds = 0;
              for (int i = 0; i < num1.length(); i++) ds += num1.charAt(i) - '0';
              long inside = (ds >= min_sum && ds <= max_sum) ? 1 : 0;
              long ans = (countGood(num2, min_sum, hi) - countGood(num1, min_sum, hi) + inside) % CNT_MOD;
              return (int) ((ans + CNT_MOD) % CNT_MOD);
          }
        `,
        cpp: code`
          static long long countGood(const string& x, int lo, int hi) {
              const long long MOD = 1000000007LL;
              vector<long long> freeCnt(hi + 1, 0);
              int tight = 0;
              for (char ch : x) {
                  int d = ch - '0';
                  vector<long long> nf(hi + 1, 0);
                  long long win = 0;
                  for (int s = 0; s <= hi; s++) {
                      win += freeCnt[s];
                      if (s >= 10) win -= freeCnt[s - 10];
                      win = ((win % MOD) + MOD) % MOD;
                      nf[s] = win;
                  }
                  for (int k = 0; k < d; k++) if (tight + k <= hi) nf[tight + k] = (nf[tight + k] + 1) % MOD;
                  tight += d;
                  freeCnt = nf;
              }
              long long total = 0;
              for (int s = lo; s <= hi; s++) total = (total + freeCnt[s]) % MOD;
              if (tight >= lo && tight <= hi) total = (total + 1) % MOD;
              return total;
          }

          int countIntegers(string num1, string num2, int min_sum, int max_sum) {
              const long long MOD = 1000000007LL;
              int hi = min(max_sum, 9 * (int)num2.size());
              if (min_sum > hi) return 0;
              int ds = 0;
              for (char ch : num1) ds += ch - '0';
              long long inside = (ds >= min_sum && ds <= max_sum) ? 1 : 0;
              long long ans = (countGood(num2, min_sum, hi) - countGood(num1, min_sum, hi) + inside) % MOD;
              return (int)((ans + MOD) % MOD);
          }
        `,
        c: code`
          static long long countGood(const char* x, int lo, int hi) {
              const long long MOD = 1000000007LL;
              long long* freeCnt = (long long*)calloc(hi + 1, sizeof(long long));
              long long* nf = (long long*)calloc(hi + 1, sizeof(long long));
              int tight = 0, len = (int)strlen(x);
              for (int p = 0; p < len; p++) {
                  int d = x[p] - '0';
                  long long win = 0;
                  for (int s = 0; s <= hi; s++) {
                      win += freeCnt[s];
                      if (s >= 10) win -= freeCnt[s - 10];
                      win = ((win % MOD) + MOD) % MOD;
                      nf[s] = win;
                  }
                  for (int k = 0; k < d; k++) if (tight + k <= hi) nf[tight + k] = (nf[tight + k] + 1) % MOD;
                  tight += d;
                  long long* t = freeCnt; freeCnt = nf; nf = t;
              }
              long long total = 0;
              for (int s = lo; s <= hi; s++) total = (total + freeCnt[s]) % MOD;
              if (tight >= lo && tight <= hi) total = (total + 1) % MOD;
              free(freeCnt);
              free(nf);
              return total;
          }

          int countIntegers(const char* num1, const char* num2, int min_sum, int max_sum) {
              const long long MOD = 1000000007LL;
              int hi = 9 * (int)strlen(num2);
              if (max_sum < hi) hi = max_sum;
              if (min_sum > hi) return 0;
              int ds = 0;
              for (const char* p = num1; *p; p++) ds += *p - '0';
              long long inside = (ds >= min_sum && ds <= max_sum) ? 1 : 0;
              long long ans = (countGood(num2, min_sum, hi) - countGood(num1, min_sum, hi) + inside) % MOD;
              return (int)((ans + MOD) % MOD);
          }
        `,
        csharp: code`
          const long CntMod = 1000000007L;

          static long CountGood(string x, int lo, int hi)
          {
              long[] free = new long[hi + 1];
              int tight = 0;
              foreach (char ch in x)
              {
                  int d = ch - '0';
                  long[] nf = new long[hi + 1];
                  long win = 0;
                  for (int s = 0; s <= hi; s++)
                  {
                      win += free[s];
                      if (s >= 10) win -= free[s - 10];
                      win = ((win % CntMod) + CntMod) % CntMod;
                      nf[s] = win;
                  }
                  for (int k = 0; k < d; k++) if (tight + k <= hi) nf[tight + k] = (nf[tight + k] + 1) % CntMod;
                  tight += d;
                  free = nf;
              }
              long total = 0;
              for (int s = lo; s <= hi; s++) total = (total + free[s]) % CntMod;
              if (tight >= lo && tight <= hi) total = (total + 1) % CntMod;
              return total;
          }

          public static int CountIntegers(string num1, string num2, int min_sum, int max_sum)
          {
              int hi = Math.Min(max_sum, 9 * num2.Length);
              if (min_sum > hi) return 0;
              int ds = 0;
              foreach (char ch in num1) ds += ch - '0';
              long inside = (ds >= min_sum && ds <= max_sum) ? 1 : 0;
              long ans = (CountGood(num2, min_sum, hi) - CountGood(num1, min_sum, hi) + inside) % CntMod;
              return (int)((ans + CntMod) % CntMod);
          }
        `,
        go: code`
          func countGood(x string, lo, hi int) int {
              const mod = 1000000007
              free := make([]int, hi+1)
              tight := 0
              for p := 0; p < len(x); p++ {
                  d := int(x[p] - '0')
                  nf := make([]int, hi+1)
                  win := 0
                  for s := 0; s <= hi; s++ {
                      win += free[s]
                      if s >= 10 {
                          win -= free[s-10]
                      }
                      win = (win%mod + mod) % mod
                      nf[s] = win
                  }
                  for k := 0; k < d; k++ {
                      if tight+k <= hi {
                          nf[tight+k] = (nf[tight+k] + 1) % mod
                      }
                  }
                  tight += d
                  free = nf
              }
              total := 0
              for s := lo; s <= hi; s++ {
                  total = (total + free[s]) % mod
              }
              if tight >= lo && tight <= hi {
                  total = (total + 1) % mod
              }
              return total
          }

          func countIntegers(num1 string, num2 string, min_sum int, max_sum int) int {
              const mod = 1000000007
              hi := 9 * len(num2)
              if max_sum < hi {
                  hi = max_sum
              }
              if min_sum > hi {
                  return 0
              }
              ds := 0
              for i := 0; i < len(num1); i++ {
                  ds += int(num1[i] - '0')
              }
              inside := 0
              if ds >= min_sum && ds <= max_sum {
                  inside = 1
              }
              ans := (countGood(num2, min_sum, hi) - countGood(num1, min_sum, hi) + inside) % mod
              return (ans + mod) % mod
          }
        `,
        kotlin: code`
          fun countGood(x: String, lo: Int, hi: Int): Long {
              val mod = 1000000007L
              var free = LongArray(hi + 1)
              var tight = 0
              for (ch in x) {
                  val d = ch - '0'
                  val nf = LongArray(hi + 1)
                  var win = 0L
                  for (s in 0..hi) {
                      win += free[s]
                      if (s >= 10) win -= free[s - 10]
                      win = ((win % mod) + mod) % mod
                      nf[s] = win
                  }
                  for (k in 0 until d) if (tight + k <= hi) nf[tight + k] = (nf[tight + k] + 1) % mod
                  tight += d
                  free = nf
              }
              var total = 0L
              for (s in lo..hi) total = (total + free[s]) % mod
              if (tight in lo..hi) total = (total + 1) % mod
              return total
          }

          fun countIntegers(num1: String, num2: String, min_sum: Int, max_sum: Int): Int {
              val mod = 1000000007L
              val hi = minOf(max_sum, 9 * num2.length)
              if (min_sum > hi) return 0
              var ds = 0
              for (ch in num1) ds += ch - '0'
              val inside = if (ds in min_sum..max_sum) 1L else 0L
              val ans = (countGood(num2, min_sum, hi) - countGood(num1, min_sum, hi) + inside) % mod
              return ((ans + mod) % mod).toInt()
          }
        `,
        swift: code`
          func countGood(_ x: [Int], _ lo: Int, _ hi: Int) -> Int {
              let mod = 1000000007
              var free = [Int](repeating: 0, count: hi + 1)
              var tight = 0
              for d in x {
                  var nf = [Int](repeating: 0, count: hi + 1)
                  var win = 0
                  for s in 0...hi {
                      win += free[s]
                      if s >= 10 { win -= free[s - 10] }
                      win = (win % mod + mod) % mod
                      nf[s] = win
                  }
                  for k in 0..<d where tight + k <= hi { nf[tight + k] = (nf[tight + k] + 1) % mod }
                  tight += d
                  free = nf
              }
              var total = 0
              if lo <= hi { for s in lo...hi { total = (total + free[s]) % mod } }
              if tight >= lo && tight <= hi { total = (total + 1) % mod }
              return total
          }

          func countIntegers(_ num1: String, _ num2: String, _ min_sum: Int, _ max_sum: Int) -> Int {
              let mod = 1000000007
              let a = num1.unicodeScalars.map { Int($0.value) - 48 }
              let b = num2.unicodeScalars.map { Int($0.value) - 48 }
              let hi = min(max_sum, 9 * b.count)
              if min_sum > hi { return 0 }
              let ds = a.reduce(0, +)
              let inside = (ds >= min_sum && ds <= max_sum) ? 1 : 0
              let ans = (countGood(b, min_sum, hi) - countGood(a, min_sum, hi) + inside) % mod
              return (ans + mod) % mod
          }
        `,
        rust: code`
          fn count_good(x: &[u8], lo: usize, hi: usize) -> i64 {
              let modulus: i64 = 1_000_000_007;
              let mut free = vec![0i64; hi + 1];
              let mut tight = 0usize;
              for &ch in x.iter() {
                  let d = (ch - b'0') as usize;
                  let mut nf = vec![0i64; hi + 1];
                  let mut win = 0i64;
                  for s in 0..=hi {
                      win += free[s];
                      if s >= 10 {
                          win -= free[s - 10];
                      }
                      win = (win % modulus + modulus) % modulus;
                      nf[s] = win;
                  }
                  for k in 0..d {
                      if tight + k <= hi {
                          nf[tight + k] = (nf[tight + k] + 1) % modulus;
                      }
                  }
                  tight += d;
                  free = nf;
              }
              let mut total = 0i64;
              for s in lo..=hi {
                  total = (total + free[s]) % modulus;
              }
              if tight >= lo && tight <= hi {
                  total = (total + 1) % modulus;
              }
              total
          }

          fn countIntegers(num1: String, num2: String, min_sum: i32, max_sum: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let hi = (max_sum as usize).min(9 * num2.len());
              let lo = min_sum as usize;
              if lo > hi {
                  return 0;
              }
              let ds: i32 = num1.bytes().map(|c| (c - b'0') as i32).sum();
              let inside = if ds >= min_sum && ds <= max_sum { 1 } else { 0 };
              let ans = (count_good(num2.as_bytes(), lo, hi) - count_good(num1.as_bytes(), lo, hi) + inside) % modulus;
              ((ans + modulus) % modulus) as i32
          }
        `,
        php: code`
          function countGood($x, $lo, $hi) {
              $MOD = 1000000007;
              $free = array_fill(0, $hi + 1, 0);
              $tight = 0;
              $len = strlen($x);
              for ($p = 0; $p < $len; $p++) {
                  $d = ord($x[$p]) - 48;
                  $nf = array_fill(0, $hi + 1, 0);
                  $win = 0;
                  for ($s = 0; $s <= $hi; $s++) {
                      $win += $free[$s];
                      if ($s >= 10) $win -= $free[$s - 10];
                      $win = (($win % $MOD) + $MOD) % $MOD;
                      $nf[$s] = $win;
                  }
                  for ($k = 0; $k < $d; $k++) if ($tight + $k <= $hi) $nf[$tight + $k] = ($nf[$tight + $k] + 1) % $MOD;
                  $tight += $d;
                  $free = $nf;
              }
              $total = 0;
              for ($s = $lo; $s <= $hi; $s++) $total = ($total + $free[$s]) % $MOD;
              if ($tight >= $lo && $tight <= $hi) $total = ($total + 1) % $MOD;
              return $total;
          }

          function countIntegers($num1, $num2, $min_sum, $max_sum) {
              $MOD = 1000000007;
              $hi = min($max_sum, 9 * strlen($num2));
              if ($min_sum > $hi) return 0;
              $ds = array_sum(str_split($num1));
              $inside = ($ds >= $min_sum && $ds <= $max_sum) ? 1 : 0;
              $ans = (countGood($num2, $min_sum, $hi) - countGood($num1, $min_sum, $hi) + $inside) % $MOD;
              return ($ans + $MOD) % $MOD;
          }
        `,
        ruby: code`
          CNT_MOD = 1_000_000_007

          def count_good(x, lo, hi)
            free = Array.new(hi + 1, 0)
            tight = 0
            x.each_byte do |ch|
              d = ch - 48
              nf = Array.new(hi + 1, 0)
              win = 0
              (0..hi).each do |s|
                win += free[s]
                win -= free[s - 10] if s >= 10
                win %= CNT_MOD
                nf[s] = win
              end
              d.times { |k| nf[tight + k] = (nf[tight + k] + 1) % CNT_MOD if tight + k <= hi }
              tight += d
              free = nf
            end
            total = 0
            (lo..hi).each { |s| total = (total + free[s]) % CNT_MOD }
            total = (total + 1) % CNT_MOD if tight >= lo && tight <= hi
            total
          end

          def countIntegers(num1, num2, min_sum, max_sum)
            hi = [max_sum, 9 * num2.length].min
            return 0 if min_sum > hi
            ds = num1.each_byte.sum { |c| c - 48 }
            inside = ds >= min_sum && ds <= max_sum ? 1 : 0
            (count_good(num2, min_sum, hi) - count_good(num1, min_sum, hi) + inside) % CNT_MOD
          end
        `,
      },
    };
  })(),

  // ── Decremental String Concatenation (LC 2746) ──────────────────
  (() => {
    // Every left/right choice, carried as (first char, last char, length).
    const ref = (words: string[]) => {
      let best = Infinity;
      const n = words.length;
      for (let mask = 0; mask < 1 << (n - 1); mask++) {
        let first = words[0][0], last = words[0][words[0].length - 1], len = words[0].length;
        for (let i = 1; i < n; i++) {
          const w = words[i], wf = w[0], wl = w[w.length - 1];
          if (mask & (1 << (i - 1))) { len += w.length - (wl === first ? 1 : 0); first = wf; }
          else { len += w.length - (last === wf ? 1 : 0); last = wl; }
        }
        best = Math.min(best, len);
      }
      return best;
    };
    return {
      slug: "decremental-string-concatenation",
      title: "Decremental String Concatenation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Dynamic Programming", "Amazon"],
      signature: { funcName: "minimizeConcatenatedLength", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Define `join(x, y)` as the concatenation `xy`, except that when the last character of `x` equals the first character of `y`, **one** of those two characters is dropped. For example `join(\"ab\", \"ba\") = \"aba\"` and `join(\"ab\", \"cde\") = \"abcde\"`.\n\nYou are given `n` strings `words`. Start with `str_0 = words[0]`. For each `i` from `1` to `n - 1`, choose either `str_i = join(str_(i-1), words[i])` or `str_i = join(words[i], str_(i-1))`.\n\nReturn the **minimum** possible length of `str_(n-1)`.",
        [
          { in: "words = [\"aa\",\"ab\",\"bc\"]", out: "4", note: "join(\"aa\",\"ab\") = \"aab\", then join(\"aab\",\"bc\") = \"aabc\"." },
          { in: "words = [\"ab\",\"b\"]", out: "2", note: "join(\"ab\",\"b\") = \"ab\"." },
          { in: "words = [\"aaa\",\"c\",\"aba\"]", out: "6", note: "\"aaac\" then join(\"aba\",\"aaac\") = \"abaaac\"." },
        ],
        ["1 <= words.length <= 1000", "1 <= words[i].length <= 50", "words[i] consists of lowercase English letters"]),
      hints: [
        "Whatever happens in the middle of the string never matters again — only its first and last characters affect future joins.",
        "So the state after `i` words is `(first char, last char)` with the shortest length that reaches it: at most `26 × 26` states.",
        "Appending word `w` to state `(a, b)` gives `(a, w.last)` with length `+|w| - [b == w.first]`; prepending gives `(w.first, b)` with length `+|w| - [w.last == a]`.",
      ],
      editorial: explain({
        idea: "The only information about the built string that future joins use is its first and last character, so a DP over those two letters, keeping the minimum length for each pair, captures every choice sequence.",
        steps: [
          "Initialise `dp[a][b] = ∞`, then `dp[words[0][0]][words[0][last]] = |words[0]|`.",
          "For each next word `w` with first letter `f`, last letter `l` and length `L`, build a new table: from each finite `dp[a][b]`, relax `new[a][l]` with `dp[a][b] + L - (b == f)` and `new[f][b]` with `dp[a][b] + L - (l == a)`.",
          "After the last word, return the minimum over the table.",
        ],
        why: "Two partial strings with the same first and last characters behave identically for every later join, so keeping only the shorter one never loses the optimum. Every sequence of left/right choices is represented by the transitions, so the minimum of the final table is the answer.",
        time: "O(n · 26²)",
        space: "O(26²)",
        pitfalls: [
          "A one-character word has the same first and last letter — both overlaps can apply to it in different steps.",
          "Only one character is removed per join, even if both ends match.",
          "Tracking the whole string (or only its length) is not enough — the ends are what matter.",
        ],
      }),
      examples: [
        { input: '["aa","ab","bc"]', expectedOutput: "4" },
        { input: '["ab","b"]', expectedOutput: "2" },
        { input: '["aaa","c","aba"]', expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12]));
        const alphabet = pick(rng, ["ab", "abc", "abcde", "abcdefghijklmnopqrstuvwxyz"]);
        const words = Array.from({ length: n }, () => randLower(rng, 1, pick(rng, [1, 3, 50]), alphabet));
        return { input: fmtStrArr(words), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimizeConcatenatedLength(words: List[str]) -> int:
              INF = float('inf')
              dp = [[INF] * 26 for _ in range(26)]
              w0 = words[0]
              dp[ord(w0[0]) - 97][ord(w0[-1]) - 97] = len(w0)
              for w in words[1:]:
                  f, l, L = ord(w[0]) - 97, ord(w[-1]) - 97, len(w)
                  nd = [[INF] * 26 for _ in range(26)]
                  for a in range(26):
                      row = dp[a]
                      for b in range(26):
                          cur = row[b]
                          if cur == INF:
                              continue
                          v = cur + L - (1 if b == f else 0)
                          if v < nd[a][l]:
                              nd[a][l] = v
                          v = cur + L - (1 if l == a else 0)
                          if v < nd[f][b]:
                              nd[f][b] = v
                  dp = nd
              return min(min(row) for row in dp)
        `,
        javascript: code`
          var minimizeConcatenatedLength = function(words) {
              var INF = 1e9, dp = new Array(676).fill(INF), w0 = words[0];
              dp[(w0.charCodeAt(0) - 97) * 26 + w0.charCodeAt(w0.length - 1) - 97] = w0.length;
              for (var i = 1; i < words.length; i++) {
                  var w = words[i], f = w.charCodeAt(0) - 97, l = w.charCodeAt(w.length - 1) - 97, L = w.length;
                  var nd = new Array(676).fill(INF);
                  for (var a = 0; a < 26; a++) {
                      for (var b = 0; b < 26; b++) {
                          var cur = dp[a * 26 + b];
                          if (cur === INF) continue;
                          var v = cur + L - (b === f ? 1 : 0);
                          if (v < nd[a * 26 + l]) nd[a * 26 + l] = v;
                          v = cur + L - (l === a ? 1 : 0);
                          if (v < nd[f * 26 + b]) nd[f * 26 + b] = v;
                      }
                  }
                  dp = nd;
              }
              var best = INF;
              for (var k = 0; k < 676; k++) if (dp[k] < best) best = dp[k];
              return best;
          };
        `,
        typescript: code`
          function minimizeConcatenatedLength(words: string[]): number {
              var INF = 1e9, dp: number[] = [], w0 = words[0];
              for (var k = 0; k < 676; k++) dp.push(INF);
              dp[(w0.charCodeAt(0) - 97) * 26 + w0.charCodeAt(w0.length - 1) - 97] = w0.length;
              for (var i = 1; i < words.length; i++) {
                  var w = words[i], f = w.charCodeAt(0) - 97, l = w.charCodeAt(w.length - 1) - 97, L = w.length;
                  var nd: number[] = [];
                  for (var k = 0; k < 676; k++) nd.push(INF);
                  for (var a = 0; a < 26; a++) {
                      for (var b = 0; b < 26; b++) {
                          var cur = dp[a * 26 + b];
                          if (cur === INF) continue;
                          var v = cur + L - (b === f ? 1 : 0);
                          if (v < nd[a * 26 + l]) nd[a * 26 + l] = v;
                          v = cur + L - (l === a ? 1 : 0);
                          if (v < nd[f * 26 + b]) nd[f * 26 + b] = v;
                      }
                  }
                  dp = nd;
              }
              var best = INF;
              for (var k = 0; k < 676; k++) if (dp[k] < best) best = dp[k];
              return best;
          }
        `,
        java: code`
          public static int minimizeConcatenatedLength(String[] words) {
              final int INF = Integer.MAX_VALUE / 2;
              int[] dp = new int[676];
              Arrays.fill(dp, INF);
              String w0 = words[0];
              dp[(w0.charAt(0) - 'a') * 26 + (w0.charAt(w0.length() - 1) - 'a')] = w0.length();
              for (int i = 1; i < words.length; i++) {
                  String w = words[i];
                  int f = w.charAt(0) - 'a', l = w.charAt(w.length() - 1) - 'a', L = w.length();
                  int[] nd = new int[676];
                  Arrays.fill(nd, INF);
                  for (int a = 0; a < 26; a++) {
                      for (int b = 0; b < 26; b++) {
                          int cur = dp[a * 26 + b];
                          if (cur == INF) continue;
                          nd[a * 26 + l] = Math.min(nd[a * 26 + l], cur + L - (b == f ? 1 : 0));
                          nd[f * 26 + b] = Math.min(nd[f * 26 + b], cur + L - (l == a ? 1 : 0));
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (int v : dp) best = Math.min(best, v);
              return best;
          }
        `,
        cpp: code`
          int minimizeConcatenatedLength(vector<string>& words) {
              const int INF = INT_MAX / 2;
              vector<int> dp(676, INF);
              const string& w0 = words[0];
              dp[(w0.front() - 'a') * 26 + (w0.back() - 'a')] = w0.size();
              for (size_t i = 1; i < words.size(); i++) {
                  const string& w = words[i];
                  int f = w.front() - 'a', l = w.back() - 'a', L = w.size();
                  vector<int> nd(676, INF);
                  for (int a = 0; a < 26; a++) {
                      for (int b = 0; b < 26; b++) {
                          int cur = dp[a * 26 + b];
                          if (cur == INF) continue;
                          nd[a * 26 + l] = min(nd[a * 26 + l], cur + L - (b == f ? 1 : 0));
                          nd[f * 26 + b] = min(nd[f * 26 + b], cur + L - (l == a ? 1 : 0));
                      }
                  }
                  dp = nd;
              }
              return *min_element(dp.begin(), dp.end());
          }
        `,
        c: code`
          int minimizeConcatenatedLength(char** words, int wordsSize) {
              const int INF = 1000000000;
              int dp[676], nd[676];
              for (int k = 0; k < 676; k++) dp[k] = INF;
              int len0 = (int)strlen(words[0]);
              dp[(words[0][0] - 'a') * 26 + (words[0][len0 - 1] - 'a')] = len0;
              for (int i = 1; i < wordsSize; i++) {
                  int L = (int)strlen(words[i]);
                  int f = words[i][0] - 'a', l = words[i][L - 1] - 'a';
                  for (int k = 0; k < 676; k++) nd[k] = INF;
                  for (int a = 0; a < 26; a++) {
                      for (int b = 0; b < 26; b++) {
                          int cur = dp[a * 26 + b];
                          if (cur == INF) continue;
                          int v = cur + L - (b == f ? 1 : 0);
                          if (v < nd[a * 26 + l]) nd[a * 26 + l] = v;
                          v = cur + L - (l == a ? 1 : 0);
                          if (v < nd[f * 26 + b]) nd[f * 26 + b] = v;
                      }
                  }
                  for (int k = 0; k < 676; k++) dp[k] = nd[k];
              }
              int best = INF;
              for (int k = 0; k < 676; k++) if (dp[k] < best) best = dp[k];
              return best;
          }
        `,
        csharp: code`
          public static int MinimizeConcatenatedLength(string[] words)
          {
              const int INF = int.MaxValue / 2;
              int[] dp = new int[676];
              for (int k = 0; k < 676; k++) dp[k] = INF;
              string w0 = words[0];
              dp[(w0[0] - 'a') * 26 + (w0[w0.Length - 1] - 'a')] = w0.Length;
              for (int i = 1; i < words.Length; i++)
              {
                  string w = words[i];
                  int f = w[0] - 'a', l = w[w.Length - 1] - 'a', L = w.Length;
                  int[] nd = new int[676];
                  for (int k = 0; k < 676; k++) nd[k] = INF;
                  for (int a = 0; a < 26; a++)
                  {
                      for (int b = 0; b < 26; b++)
                      {
                          int cur = dp[a * 26 + b];
                          if (cur == INF) continue;
                          nd[a * 26 + l] = Math.Min(nd[a * 26 + l], cur + L - (b == f ? 1 : 0));
                          nd[f * 26 + b] = Math.Min(nd[f * 26 + b], cur + L - (l == a ? 1 : 0));
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
          func minimizeConcatenatedLength(words []string) int {
              const INF = 1 << 30
              dp := make([]int, 676)
              for k := range dp {
                  dp[k] = INF
              }
              w0 := words[0]
              dp[int(w0[0]-'a')*26+int(w0[len(w0)-1]-'a')] = len(w0)
              for _, w := range words[1:] {
                  f, l, L := int(w[0]-'a'), int(w[len(w)-1]-'a'), len(w)
                  nd := make([]int, 676)
                  for k := range nd {
                      nd[k] = INF
                  }
                  for a := 0; a < 26; a++ {
                      for b := 0; b < 26; b++ {
                          cur := dp[a*26+b]
                          if cur == INF {
                              continue
                          }
                          v := cur + L
                          if b == f {
                              v--
                          }
                          if v < nd[a*26+l] {
                              nd[a*26+l] = v
                          }
                          v = cur + L
                          if l == a {
                              v--
                          }
                          if v < nd[f*26+b] {
                              nd[f*26+b] = v
                          }
                      }
                  }
                  dp = nd
              }
              best := INF
              for _, v := range dp {
                  if v < best {
                      best = v
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minimizeConcatenatedLength(words: Array<String>): Int {
              val inf = Int.MAX_VALUE / 2
              var dp = IntArray(676) { inf }
              val w0 = words[0]
              dp[(w0.first() - 'a') * 26 + (w0.last() - 'a')] = w0.length
              for (i in 1 until words.size) {
                  val w = words[i]
                  val f = w.first() - 'a'
                  val l = w.last() - 'a'
                  val len = w.length
                  val nd = IntArray(676) { inf }
                  for (a in 0 until 26) {
                      for (b in 0 until 26) {
                          val cur = dp[a * 26 + b]
                          if (cur == inf) continue
                          nd[a * 26 + l] = minOf(nd[a * 26 + l], cur + len - (if (b == f) 1 else 0))
                          nd[f * 26 + b] = minOf(nd[f * 26 + b], cur + len - (if (l == a) 1 else 0))
                      }
                  }
                  dp = nd
              }
              return dp.minOrNull()!!
          }
        `,
        swift: code`
          func minimizeConcatenatedLength(_ words: [String]) -> Int {
              let inf = Int.max / 2
              let codes = words.map { $0.unicodeScalars.map { Int($0.value) - 97 } }
              var dp = [Int](repeating: inf, count: 676)
              dp[codes[0][0] * 26 + codes[0][codes[0].count - 1]] = codes[0].count
              for i in stride(from: 1, to: codes.count, by: 1) {
                  let w = codes[i]
                  let f = w[0], l = w[w.count - 1], L = w.count
                  var nd = [Int](repeating: inf, count: 676)
                  for a in 0..<26 {
                      for b in 0..<26 {
                          let cur = dp[a * 26 + b]
                          if cur == inf { continue }
                          nd[a * 26 + l] = min(nd[a * 26 + l], cur + L - (b == f ? 1 : 0))
                          nd[f * 26 + b] = min(nd[f * 26 + b], cur + L - (l == a ? 1 : 0))
                      }
                  }
                  dp = nd
              }
              return dp.min()!
          }
        `,
        rust: code`
          fn minimizeConcatenatedLength(words: Vec<String>) -> i32 {
              let inf = std::i32::MAX / 2;
              let mut dp = vec![inf; 676];
              let w0 = words[0].as_bytes();
              dp[(w0[0] - b'a') as usize * 26 + (w0[w0.len() - 1] - b'a') as usize] = w0.len() as i32;
              for w in words.iter().skip(1) {
                  let w = w.as_bytes();
                  let f = (w[0] - b'a') as usize;
                  let l = (w[w.len() - 1] - b'a') as usize;
                  let len = w.len() as i32;
                  let mut nd = vec![inf; 676];
                  for a in 0..26 {
                      for b in 0..26 {
                          let cur = dp[a * 26 + b];
                          if cur == inf {
                              continue;
                          }
                          let v = cur + len - if b == f { 1 } else { 0 };
                          nd[a * 26 + l] = nd[a * 26 + l].min(v);
                          let v = cur + len - if l == a { 1 } else { 0 };
                          nd[f * 26 + b] = nd[f * 26 + b].min(v);
                      }
                  }
                  dp = nd;
              }
              *dp.iter().min().unwrap()
          }
        `,
        php: code`
          function minimizeConcatenatedLength($words) {
              $INF = 1000000000;
              $dp = array_fill(0, 676, $INF);
              $w0 = $words[0];
              $dp[(ord($w0[0]) - 97) * 26 + ord($w0[strlen($w0) - 1]) - 97] = strlen($w0);
              $n = count($words);
              for ($i = 1; $i < $n; $i++) {
                  $w = $words[$i];
                  $L = strlen($w);
                  $f = ord($w[0]) - 97;
                  $l = ord($w[$L - 1]) - 97;
                  $nd = array_fill(0, 676, $INF);
                  for ($a = 0; $a < 26; $a++) {
                      for ($b = 0; $b < 26; $b++) {
                          $cur = $dp[$a * 26 + $b];
                          if ($cur == $INF) continue;
                          $v = $cur + $L - ($b == $f ? 1 : 0);
                          if ($v < $nd[$a * 26 + $l]) $nd[$a * 26 + $l] = $v;
                          $v = $cur + $L - ($l == $a ? 1 : 0);
                          if ($v < $nd[$f * 26 + $b]) $nd[$f * 26 + $b] = $v;
                      }
                  }
                  $dp = $nd;
              }
              return min($dp);
          }
        `,
        ruby: code`
          def minimizeConcatenatedLength(words)
            inf = 1_000_000_000
            dp = Array.new(676, inf)
            w0 = words[0]
            dp[(w0.getbyte(0) - 97) * 26 + w0.getbyte(-1) - 97] = w0.length
            words.drop(1).each do |w|
              f = w.getbyte(0) - 97
              l = w.getbyte(-1) - 97
              len = w.length
              nd = Array.new(676, inf)
              26.times do |a|
                26.times do |b|
                  cur = dp[a * 26 + b]
                  next if cur == inf
                  v = cur + len - (b == f ? 1 : 0)
                  nd[a * 26 + l] = v if v < nd[a * 26 + l]
                  v = cur + len - (l == a ? 1 : 0)
                  nd[f * 26 + b] = v if v < nd[f * 26 + b]
                end
              end
              dp = nd
            end
            dp.min
          end
        `,
      },
    };
  })(),

  // ── Partition String Into Minimum Beautiful Substrings (LC 2767) ─
  (() => {
    const isPow5 = (v: number) => { if (v < 1) return false; while (v % 5 === 0) v /= 5; return v === 1; };
    // Plain recursion over every cut that produces a beautiful piece.
    const ref = (s: string): number => {
      const go = (i: number): number => {
        if (i === s.length) return 0;
        if (s[i] === "0") return Infinity;
        let best = Infinity;
        for (let j = i + 1; j <= s.length; j++) {
          if (isPow5(parseInt(s.slice(i, j), 2))) best = Math.min(best, 1 + go(j));
        }
        return best;
      };
      const r = go(0);
      return r === Infinity ? -1 : r;
    };
    const POW5 = ["1", "101", "11001", "1111101", "1001110001", "110000110101", "11110100001001"];
    return {
      slug: "partition-string-into-minimum-beautiful-substrings",
      title: "Partition String Into Minimum Beautiful Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Dynamic Programming", "Backtracking", "Amazon"],
      signature: { funcName: "minimumBeautifulSubstrings", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A binary string is **beautiful** if it has no leading zeros and, read as a binary number, equals a power of 5 (`1`, `5`, `25`, `125`, …).\n\nGiven a binary string `s`, split it into one or more contiguous substrings so that every piece is beautiful. Return the **minimum** number of pieces, or `-1` if no such split exists.",
        [
          { in: "s = \"1011\"", out: "2", note: "\"101\" is 5 and \"1\" is 1." },
          { in: "s = \"111\"", out: "3", note: "Three pieces of \"1\"." },
          { in: "s = \"0\"", out: "-1", note: "A piece cannot start with a zero." },
        ],
        ["1 <= s.length <= 15", "s[i] is '0' or '1'"]),
      hints: [
        "Every piece must start with a `1` (no leading zeros), so a string that starts with `0` can never be split, and a cut can only fall just before a `1`.",
        "Let `dp[i]` be the fewest pieces for the prefix of length `i`. Try every last piece `s[j..i)`: it must start with `1` and its value must be a power of 5.",
        "Values are below `2^15`, so test a power of 5 by dividing by 5 while possible and checking you reach 1 — or precompute the few powers of 5 that fit.",
      ],
      editorial: explain({
        idea: "A classic partition DP: the best split of a prefix is one more than the best split of a shorter prefix, over all last pieces that are beautiful.",
        steps: [
          "`dp[0] = 0`, `dp[i] = ∞` for `i > 0`.",
          "For each end `i` from 1 to `n`, and each start `j < i` with `s[j] == '1'`, compute the value of `s[j..i)`; if it is a power of 5 and `dp[j]` is finite, set `dp[i] = min(dp[i], dp[j] + 1)`.",
          "Return `dp[n]`, or `-1` if it is still `∞`.",
        ],
        why: "Every valid split has a last piece `s[j..n)`, and the pieces before it form a valid split of the prefix of length `j`. Minimising over `j` with the best split of each prefix is therefore exact.",
        time: "O(n^2 · log v) — at most 15 × 15 checks",
        space: "O(n)",
        pitfalls: [
          "\"0\" is not a power of 5, and a piece like \"0101\" has a leading zero — both are invalid.",
          "Return `-1` when the string cannot be split at all (for example, when it starts with `0`).",
        ],
      }),
      examples: [
        { input: '"1011"', expectedOutput: "2" },
        { input: '"111"', expectedOutput: "3" },
        { input: '"0"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        let s = "";
        if (rng() < 0.5) {
          const len = ri(rng, 1, 15);
          for (let i = 0; i < len; i++) s += rng() < 0.6 ? "1" : "0";
        } else {
          while (s.length < 15) {
            const p = pick(rng, POW5);
            if (s.length + p.length > 15) break;
            s += p;
            if (rng() < 0.3) break;
          }
          if (!s) s = "1";
          if (rng() < 0.2) { const i = ri(rng, 0, s.length - 1); s = s.slice(0, i) + (s[i] === "1" ? "0" : "1") + s.slice(i + 1); }
        }
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def minimumBeautifulSubstrings(s: str) -> int:
              def is_pow5(v):
                  if v < 1:
                      return False
                  while v % 5 == 0:
                      v //= 5
                  return v == 1

              n = len(s)
              INF = float('inf')
              dp = [0] + [INF] * n
              for i in range(1, n + 1):
                  for j in range(i):
                      if s[j] == '1' and dp[j] + 1 < dp[i] and is_pow5(int(s[j:i], 2)):
                          dp[i] = dp[j] + 1
              return dp[n] if dp[n] != INF else -1
        `,
        javascript: code`
          var minimumBeautifulSubstrings = function(s) {
              var n = s.length, INF = 1000, dp = new Array(n + 1).fill(INF);
              dp[0] = 0;
              for (var j = 0; j < n; j++) {
                  if (s[j] !== '1' || dp[j] === INF) continue;
                  var v = 0;
                  for (var i = j; i < n; i++) {
                      v = v * 2 + (s[i] === '1' ? 1 : 0);
                      var t = v;
                      while (t % 5 === 0) t /= 5;
                      if (t === 1 && dp[j] + 1 < dp[i + 1]) dp[i + 1] = dp[j] + 1;
                  }
              }
              return dp[n] === INF ? -1 : dp[n];
          };
        `,
        typescript: code`
          function minimumBeautifulSubstrings(s: string): number {
              var n = s.length, INF = 1000, dp: number[] = [0];
              for (var k = 0; k < n; k++) dp.push(INF);
              for (var j = 0; j < n; j++) {
                  if (s.charAt(j) !== '1' || dp[j] === INF) continue;
                  var v = 0;
                  for (var i = j; i < n; i++) {
                      v = v * 2 + (s.charAt(i) === '1' ? 1 : 0);
                      var t = v;
                      while (t % 5 === 0) t /= 5;
                      if (t === 1 && dp[j] + 1 < dp[i + 1]) dp[i + 1] = dp[j] + 1;
                  }
              }
              return dp[n] === INF ? -1 : dp[n];
          }
        `,
        java: code`
          public static int minimumBeautifulSubstrings(String s) {
              int n = s.length(), INF = 1000;
              int[] dp = new int[n + 1];
              Arrays.fill(dp, INF);
              dp[0] = 0;
              for (int j = 0; j < n; j++) {
                  if (s.charAt(j) != '1' || dp[j] == INF) continue;
                  int v = 0;
                  for (int i = j; i < n; i++) {
                      v = v * 2 + (s.charAt(i) - '0');
                      int t = v;
                      while (t % 5 == 0) t /= 5;
                      if (t == 1) dp[i + 1] = Math.min(dp[i + 1], dp[j] + 1);
                  }
              }
              return dp[n] == INF ? -1 : dp[n];
          }
        `,
        cpp: code`
          int minimumBeautifulSubstrings(string s) {
              int n = s.size(), INF = 1000;
              vector<int> dp(n + 1, INF);
              dp[0] = 0;
              for (int j = 0; j < n; j++) {
                  if (s[j] != '1' || dp[j] == INF) continue;
                  int v = 0;
                  for (int i = j; i < n; i++) {
                      v = v * 2 + (s[i] - '0');
                      int t = v;
                      while (t % 5 == 0) t /= 5;
                      if (t == 1) dp[i + 1] = min(dp[i + 1], dp[j] + 1);
                  }
              }
              return dp[n] == INF ? -1 : dp[n];
          }
        `,
        c: code`
          int minimumBeautifulSubstrings(const char* s) {
              int n = (int)strlen(s), INF = 1000;
              int dp[16];
              for (int k = 0; k <= n; k++) dp[k] = INF;
              dp[0] = 0;
              for (int j = 0; j < n; j++) {
                  if (s[j] != '1' || dp[j] == INF) continue;
                  int v = 0;
                  for (int i = j; i < n; i++) {
                      v = v * 2 + (s[i] - '0');
                      int t = v;
                      while (t % 5 == 0) t /= 5;
                      if (t == 1 && dp[j] + 1 < dp[i + 1]) dp[i + 1] = dp[j] + 1;
                  }
              }
              return dp[n] == INF ? -1 : dp[n];
          }
        `,
        csharp: code`
          public static int MinimumBeautifulSubstrings(string s)
          {
              int n = s.Length, INF = 1000;
              int[] dp = new int[n + 1];
              for (int k = 1; k <= n; k++) dp[k] = INF;
              for (int j = 0; j < n; j++)
              {
                  if (s[j] != '1' || dp[j] == INF) continue;
                  int v = 0;
                  for (int i = j; i < n; i++)
                  {
                      v = v * 2 + (s[i] - '0');
                      int t = v;
                      while (t % 5 == 0) t /= 5;
                      if (t == 1) dp[i + 1] = Math.Min(dp[i + 1], dp[j] + 1);
                  }
              }
              return dp[n] == INF ? -1 : dp[n];
          }
        `,
        go: code`
          func minimumBeautifulSubstrings(s string) int {
              n, INF := len(s), 1000
              dp := make([]int, n+1)
              for k := 1; k <= n; k++ {
                  dp[k] = INF
              }
              for j := 0; j < n; j++ {
                  if s[j] != '1' || dp[j] == INF {
                      continue
                  }
                  v := 0
                  for i := j; i < n; i++ {
                      v = v*2 + int(s[i]-'0')
                      t := v
                      for t%5 == 0 {
                          t /= 5
                      }
                      if t == 1 && dp[j]+1 < dp[i+1] {
                          dp[i+1] = dp[j] + 1
                      }
                  }
              }
              if dp[n] == INF {
                  return -1
              }
              return dp[n]
          }
        `,
        kotlin: code`
          fun minimumBeautifulSubstrings(s: String): Int {
              val n = s.length
              val inf = 1000
              val dp = IntArray(n + 1) { if (it == 0) 0 else inf }
              for (j in 0 until n) {
                  if (s[j] != '1' || dp[j] == inf) continue
                  var v = 0
                  for (i in j until n) {
                      v = v * 2 + (s[i] - '0')
                      var t = v
                      while (t % 5 == 0) t /= 5
                      if (t == 1) dp[i + 1] = minOf(dp[i + 1], dp[j] + 1)
                  }
              }
              return if (dp[n] == inf) -1 else dp[n]
          }
        `,
        swift: code`
          func minimumBeautifulSubstrings(_ s: String) -> Int {
              let c = Array(s.utf8)
              let n = c.count, inf = 1000
              var dp = [Int](repeating: inf, count: n + 1)
              dp[0] = 0
              for j in 0..<n {
                  if c[j] != 49 || dp[j] == inf { continue }
                  var v = 0
                  for i in j..<n {
                      v = v * 2 + Int(c[i] - 48)
                      var t = v
                      while t % 5 == 0 { t /= 5 }
                      if t == 1 { dp[i + 1] = min(dp[i + 1], dp[j] + 1) }
                  }
              }
              return dp[n] == inf ? -1 : dp[n]
          }
        `,
        rust: code`
          fn minimumBeautifulSubstrings(s: String) -> i32 {
              let c = s.as_bytes();
              let n = c.len();
              let inf = 1000;
              let mut dp = vec![inf; n + 1];
              dp[0] = 0;
              for j in 0..n {
                  if c[j] != b'1' || dp[j] == inf {
                      continue;
                  }
                  let mut v = 0;
                  for i in j..n {
                      v = v * 2 + (c[i] - b'0') as i32;
                      let mut t = v;
                      while t % 5 == 0 {
                          t /= 5;
                      }
                      if t == 1 {
                          dp[i + 1] = dp[i + 1].min(dp[j] + 1);
                      }
                  }
              }
              if dp[n] == inf { -1 } else { dp[n] }
          }
        `,
        php: code`
          function minimumBeautifulSubstrings($s) {
              $n = strlen($s);
              $INF = 1000;
              $dp = array_fill(0, $n + 1, $INF);
              $dp[0] = 0;
              for ($j = 0; $j < $n; $j++) {
                  if ($s[$j] !== '1' || $dp[$j] == $INF) continue;
                  $v = 0;
                  for ($i = $j; $i < $n; $i++) {
                      $v = $v * 2 + ($s[$i] === '1' ? 1 : 0);
                      $t = $v;
                      while ($t % 5 == 0) $t = intdiv($t, 5);
                      if ($t == 1 && $dp[$j] + 1 < $dp[$i + 1]) $dp[$i + 1] = $dp[$j] + 1;
                  }
              }
              return $dp[$n] == $INF ? -1 : $dp[$n];
          }
        `,
        ruby: code`
          def minimumBeautifulSubstrings(s)
            n = s.length
            inf = 1000
            dp = Array.new(n + 1, inf)
            dp[0] = 0
            n.times do |j|
              next if s[j] != '1' || dp[j] == inf
              v = 0
              (j...n).each do |i|
                v = v * 2 + (s[i] == '1' ? 1 : 0)
                t = v
                t /= 5 while t % 5 == 0
                dp[i + 1] = dp[j] + 1 if t == 1 && dp[j] + 1 < dp[i + 1]
              end
            end
            dp[n] == inf ? -1 : dp[n]
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Jumps to Reach the Last Index (LC 2770) ───
  (() => {
    // Longest path in the forward-jump DAG, by memoised recursion from the end.
    const ref = (nums: number[], target: number) => {
      const n = nums.length, memo = new Map<number, number>();
      const go = (i: number): number => {
        if (i === n - 1) return 0;
        const hit = memo.get(i);
        if (hit !== undefined) return hit;
        let best = -Infinity;
        for (let j = i + 1; j < n; j++) if (Math.abs(nums[j] - nums[i]) <= target) best = Math.max(best, 1 + go(j));
        memo.set(i, best);
        return best;
      };
      const r = go(0);
      return r === -Infinity ? -1 : r;
    };
    return {
      slug: "maximum-number-of-jumps-to-reach-the-last-index",
      title: "Maximum Number of Jumps to Reach the Last Index",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon"],
      signature: { funcName: "maximumJumps", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of `n` integers and an integer `target`. You start at index `0`. In one jump you may move from index `i` to any index `j` with `i < j < n` as long as `-target <= nums[j] - nums[i] <= target`.\n\nReturn the **maximum** number of jumps that takes you from index `0` to index `n - 1`, or `-1` if index `n - 1` cannot be reached.",
        [
          { in: "nums = [1,3,6,4,1,2], target = 2", out: "3", note: "0 → 1 → 3 → 5: values 1, 3, 4, 2, each step changes by at most 2." },
          { in: "nums = [1,3,6,4,1,2], target = 3", out: "5", note: "Every adjacent step is allowed: 0 → 1 → 2 → 3 → 4 → 5." },
          { in: "nums = [1,3,6,4,1,2], target = 0", out: "-1", note: "No jump keeps the value the same." },
        ],
        ["2 <= nums.length <= 1000", "-10^9 <= nums[i] <= 10^9", "0 <= target <= 2 * 10^9"]),
      hints: [
        "Jumps only go forward, so the indices form a DAG and you want its longest path from `0` to `n - 1`.",
        "Let `dp[j]` be the most jumps that reach index `j` (or unreachable). Then `dp[j] = max(dp[i] + 1)` over earlier reachable `i` with `|nums[j] - nums[i]| <= target`.",
        "Differences reach `2·10^9`, beyond a 32-bit int: compute them in 64 bits.",
      ],
      editorial: explain({
        idea: "Forward-only jumps make this a longest-path problem in a DAG ordered by index, which a simple quadratic DP solves.",
        steps: [
          "Set `dp[0] = 0` and `dp[j] = -1` (unreachable) for `j > 0`.",
          "For each `j` from 1 to `n - 1`, for each `i < j` with `dp[i] >= 0` and `|nums[j] - nums[i]| <= target`, set `dp[j] = max(dp[j], dp[i] + 1)`.",
          "Return `dp[n - 1]`.",
        ],
        why: "Every path to `j` ends with a jump from some earlier `i`, and the rest of it is a path to `i`; using the longest path to each `i` maximises the total. Processing indices in increasing order means each `dp[i]` is final before it is used.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "`nums[j] - nums[i]` can be `2·10^9` and overflow a 32-bit int — use 64-bit arithmetic.",
          "Never extend from an unreachable index: `-1 + 1 = 0` would wrongly mark it reachable.",
          "This is the *maximum* number of jumps, not the minimum — BFS does not apply.",
        ],
      }),
      examples: [
        { input: "[1,3,6,4,1,2]\n2", expectedOutput: "3" },
        { input: "[1,3,6,4,1,2]\n3", expectedOutput: "5" },
        { input: "[1,3,6,4,1,2]\n0", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [3, 10, 40]));
        const span = pick(rng, [2, 10, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, -span, span));
        const target = rng() < 0.1 ? pick(rng, [0, 2000000000]) : ri(rng, 0, Math.min(2000000000, span * 2));
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumJumps(nums: List[int], target: int) -> int:
              n = len(nums)
              dp = [-1] * n
              dp[0] = 0
              for j in range(1, n):
                  vj = nums[j]
                  best = -1
                  for i in range(j):
                      if dp[i] >= 0 and dp[i] + 1 > best and abs(vj - nums[i]) <= target:
                          best = dp[i] + 1
                  dp[j] = best
              return dp[n - 1]
        `,
        javascript: code`
          var maximumJumps = function(nums, target) {
              var n = nums.length, dp = new Array(n).fill(-1);
              dp[0] = 0;
              for (var j = 1; j < n; j++) {
                  for (var i = 0; i < j; i++) {
                      if (dp[i] >= 0 && dp[i] + 1 > dp[j] && Math.abs(nums[j] - nums[i]) <= target) dp[j] = dp[i] + 1;
                  }
              }
              return dp[n - 1];
          };
        `,
        typescript: code`
          function maximumJumps(nums: number[], target: number): number {
              var n = nums.length, dp: number[] = [0];
              for (var k = 1; k < n; k++) dp.push(-1);
              for (var j = 1; j < n; j++) {
                  for (var i = 0; i < j; i++) {
                      if (dp[i] >= 0 && dp[i] + 1 > dp[j] && Math.abs(nums[j] - nums[i]) <= target) dp[j] = dp[i] + 1;
                  }
              }
              return dp[n - 1];
          }
        `,
        java: code`
          public static int maximumJumps(int[] nums, int target) {
              int n = nums.length;
              int[] dp = new int[n];
              Arrays.fill(dp, -1);
              dp[0] = 0;
              for (int j = 1; j < n; j++) {
                  for (int i = 0; i < j; i++) {
                      if (dp[i] >= 0 && Math.abs((long) nums[j] - nums[i]) <= target) dp[j] = Math.max(dp[j], dp[i] + 1);
                  }
              }
              return dp[n - 1];
          }
        `,
        cpp: code`
          int maximumJumps(vector<int>& nums, int target) {
              int n = nums.size();
              vector<int> dp(n, -1);
              dp[0] = 0;
              for (int j = 1; j < n; j++) {
                  for (int i = 0; i < j; i++) {
                      long long d = (long long)nums[j] - nums[i];
                      if (d < 0) d = -d;
                      if (dp[i] >= 0 && d <= target) dp[j] = max(dp[j], dp[i] + 1);
                  }
              }
              return dp[n - 1];
          }
        `,
        c: code`
          int maximumJumps(int* nums, int numsSize, int target) {
              int n = numsSize;
              int* dp = (int*)malloc(sizeof(int) * n);
              for (int k = 0; k < n; k++) dp[k] = -1;
              dp[0] = 0;
              for (int j = 1; j < n; j++) {
                  for (int i = 0; i < j; i++) {
                      long long d = (long long)nums[j] - nums[i];
                      if (d < 0) d = -d;
                      if (dp[i] >= 0 && d <= target && dp[i] + 1 > dp[j]) dp[j] = dp[i] + 1;
                  }
              }
              int ans = dp[n - 1];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MaximumJumps(int[] nums, int target)
          {
              int n = nums.Length;
              int[] dp = new int[n];
              for (int k = 1; k < n; k++) dp[k] = -1;
              for (int j = 1; j < n; j++)
              {
                  for (int i = 0; i < j; i++)
                  {
                      if (dp[i] >= 0 && Math.Abs((long)nums[j] - nums[i]) <= target) dp[j] = Math.Max(dp[j], dp[i] + 1);
                  }
              }
              return dp[n - 1];
          }
        `,
        go: code`
          func maximumJumps(nums []int, target int) int {
              n := len(nums)
              dp := make([]int, n)
              for k := 1; k < n; k++ {
                  dp[k] = -1
              }
              for j := 1; j < n; j++ {
                  for i := 0; i < j; i++ {
                      d := nums[j] - nums[i]
                      if d < 0 {
                          d = -d
                      }
                      if dp[i] >= 0 && d <= target && dp[i]+1 > dp[j] {
                          dp[j] = dp[i] + 1
                      }
                  }
              }
              return dp[n-1]
          }
        `,
        kotlin: code`
          fun maximumJumps(nums: IntArray, target: Int): Int {
              val n = nums.size
              val dp = IntArray(n) { if (it == 0) 0 else -1 }
              for (j in 1 until n) {
                  for (i in 0 until j) {
                      if (dp[i] >= 0 && Math.abs(nums[j].toLong() - nums[i]) <= target) dp[j] = maxOf(dp[j], dp[i] + 1)
                  }
              }
              return dp[n - 1]
          }
        `,
        swift: code`
          func maximumJumps(_ nums: [Int], _ target: Int) -> Int {
              let n = nums.count
              var dp = [Int](repeating: -1, count: n)
              dp[0] = 0
              for j in 1..<n {
                  for i in 0..<j where dp[i] >= 0 && abs(nums[j] - nums[i]) <= target {
                      dp[j] = max(dp[j], dp[i] + 1)
                  }
              }
              return dp[n - 1]
          }
        `,
        rust: code`
          fn maximumJumps(nums: Vec<i32>, target: i32) -> i32 {
              let n = nums.len();
              let mut dp = vec![-1i32; n];
              dp[0] = 0;
              for j in 1..n {
                  for i in 0..j {
                      let d = (nums[j] as i64 - nums[i] as i64).abs();
                      if dp[i] >= 0 && d <= target as i64 {
                          dp[j] = dp[j].max(dp[i] + 1);
                      }
                  }
              }
              dp[n - 1]
          }
        `,
        php: code`
          function maximumJumps($nums, $target) {
              $n = count($nums);
              $dp = array_fill(0, $n, -1);
              $dp[0] = 0;
              for ($j = 1; $j < $n; $j++) {
                  for ($i = 0; $i < $j; $i++) {
                      if ($dp[$i] >= 0 && $dp[$i] + 1 > $dp[$j] && abs($nums[$j] - $nums[$i]) <= $target) $dp[$j] = $dp[$i] + 1;
                  }
              }
              return $dp[$n - 1];
          }
        `,
        ruby: code`
          def maximumJumps(nums, target)
            n = nums.length
            dp = Array.new(n, -1)
            dp[0] = 0
            (1...n).each do |j|
              j.times do |i|
                dp[j] = dp[i] + 1 if dp[i] >= 0 && dp[i] + 1 > dp[j] && (nums[j] - nums[i]).abs <= target
              end
            end
            dp[n - 1]
          end
        `,
      },
    };
  })(),

];
