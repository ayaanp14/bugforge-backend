/**
 * Graph problems — wave 7, batch 06.
 * Real problems only: LeetCode numbered problems that companies list. Worked
 * examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Every generator builds the graph the statement promises — trees are trees,
 * functional graphs have one out-edge per node, "no repeated edges" holds —
 * and keeps sizes small, because the judge runs all 5,000 cases of a problem in
 * one process and Python/Ruby/PHP pay ~30× V8. The references are brute force
 * wherever the size allows (every subset of edges, every flip, every start,
 * Floyd–Warshall instead of Dijkstra), so they share nothing with the authored
 * solutions but the statement.
 *
 * int32 rule: where the real problem's answer can pass 2^31 − 1 (path weights
 * in LC 2203, the number of valid paths in LC 2867, the total conversion cost
 * in LC 2976) the stated constraints are reduced so it provably cannot, and
 * each statement says so. Languages without a priority queue on the judge
 * carry a small binary min-heap of packed integers, `dist * 2^14 + node`,
 * exact in a JavaScript double because every key stays below 2^53.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** A random tree on nodes `base .. base+n-1` as an edge list. */
const randomTreeEdges = (rng: Rng, n: number, base: number): number[][] => {
  const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + base));
  const edges: number[][] = [];
  for (let i = 1; i < n; i++) {
    const e = [order[ri(rng, 0, i - 1)], order[i]];
    edges.push(rng() < 0.5 ? e : [e[1], e[0]]);
  }
  return shuffle(rng, edges);
};

/** `m` distinct undirected pairs [u, v] (u != v) on nodes 0..n-1, random orientation. */
const randomSimplePairs = (rng: Rng, n: number, m: number): number[][] => {
  const all: number[][] = [];
  for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) all.push(rng() < 0.5 ? [u, v] : [v, u]);
  return shuffle(rng, all).slice(0, Math.min(m, all.length));
};

/** Adjacency lists of an undirected edge list on n nodes (offset subtracted). */
const adjOf = (n: number, edges: number[][], off = 0): number[][] => {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const e of edges) { adj[e[0] - off].push(e[1] - off); adj[e[1] - off].push(e[0] - off); }
  return adj;
};

/** Component labels of nodes 0..n-1 using only the edges whose `keep` flag is set. */
const componentsOf = (n: number, edges: number[][], keep: boolean[]): number[] => {
  const p = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (p[x] === x ? x : (p[x] = find(p[x])));
  edges.forEach((e, i) => { if (keep[i]) p[find(e[0])] = find(e[1]); });
  return p.map((_, i) => find(i));
};

void bool; void fmtStrArr; void adjOf; void componentsOf; void randomTreeEdges; void randomSimplePairs; void fmtIntMat;

export const GRAPHS8_PROBLEMS: CatalogProblem[] = [

  // ── Minimum Operations to Convert Number (LC 2059) ──────────────
  (() => {
    const ref = (nums: number[], start: number, goal: number) => {
      // Plain BFS over every produced value; out-of-range values are dead ends.
      const dist = new Map<number, number>([[start, 0]]);
      const q = [start];
      for (let h = 0; h < q.length; h++) {
        const x = q[h];
        if (x < 0 || x > 1000) continue;
        for (const a of nums) {
          for (const y of [x + a, x - a, x ^ a]) {
            if (!dist.has(y)) { dist.set(y, dist.get(x)! + 1); q.push(y); }
          }
        }
      }
      return dist.has(goal) ? dist.get(goal)! : -1;
    };
    return {
      slug: "minimum-operations-to-convert-number",
      title: "Minimum Operations to Convert Number",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Breadth-First Search", "Amazon", "Google"],
      signature: { funcName: "minimumOperations", params: [{ name: "nums", type: "int[]" as const }, { name: "start", type: "int" as const }, { name: "goal", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of **distinct** integers, a starting value `start` and a target value `goal`.\n\nA variable `x` begins at `start`. While `0 <= x <= 1000`, you may apply any of these operations, using any element `nums[i]` any number of times:\n\n- `x = x + nums[i]`\n- `x = x - nums[i]`\n- `x = x XOR nums[i]` (bitwise exclusive or)\n\nAn operation is allowed to take `x` outside the range `[0, 1000]`, but once `x` is outside that range no further operation can be applied.\n\nReturn the **minimum** number of operations needed to turn `start` into `goal`, or `-1` if it cannot be done.",
        [
          { in: "nums = [2,4,12], start = 2, goal = 12", out: "2", note: "2 + 12 = 14, then 14 - 2 = 12." },
          { in: "nums = [3,5,7], start = 0, goal = -4", out: "2", note: "0 + 3 = 3, then 3 - 7 = -4. Leaving the range is fine on the last step." },
          { in: "nums = [2,8,16], start = 0, goal = 1", out: "-1", note: "Every value reachable from 0 is even, so 1 never appears." },
        ],
        ["1 <= nums.length <= 1000", "-10^9 <= nums[i], goal <= 10^9", "0 <= start <= 1000", "start != goal", "all nums[i] are distinct"]),
      hints: [
        "Only values inside `[0, 1000]` can be continued from, so there are at most 1001 interesting states.",
        "Every operation costs one step — the minimum number of steps is a shortest path in an unweighted graph. Use BFS from `start`.",
        "Check each produced value against `goal` **before** checking the range: the final step may leave `[0, 1000]`.",
      ],
      editorial: explain({
        idea: "Treat every value in `[0, 1000]` as a node and every operation as an edge of length 1. A breadth-first search from `start` meets each value at its smallest number of operations, and the goal may be produced by the last step even when it lies outside the range.",
        steps: [
          "Keep `dist[0..1000] = -1` and set `dist[start] = 0`; push `start` into a queue.",
          "Pop `x`. For every `a` in `nums` form `x + a`, `x - a` and `x XOR a`.",
          "If a produced value equals `goal`, return `dist[x] + 1`.",
          "Otherwise, if it lies in `[0, 1000]` and has not been seen, record `dist[x] + 1` and push it.",
          "If the queue empties, return `-1`.",
        ],
        why: "BFS removes states in non-decreasing order of distance, so the first time `goal` is produced it is produced with the fewest operations. Values outside the range can never be extended, so they only matter as possible goals, which is exactly the check made when a value is produced.",
        time: "O(1001 · n)",
        space: "O(1001)",
        pitfalls: [
          "Do not discard an out-of-range value before comparing it to `goal` — Example 2 ends at -4.",
          "XOR with a negative number works on two's complement; every language here gives the same result for 32-bit values.",
          "`x + nums[i]` can reach about `10^9 + 1000`, which still fits a 32-bit integer.",
        ],
      }),
      examples: [
        { input: "[2,4,12]\n2\n12", expectedOutput: "2" },
        { input: "[3,5,7]\n0\n-4", expectedOutput: "2" },
        { input: "[2,8,16]\n0\n1", expectedOutput: "-1" },
      ],
      hiddenCount: 600,
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 2, 4, 6]));
        const span = pick(rng, [5, 20, 200, 1000, 1000000000]);
        const set = new Set<number>();
        while (set.size < n) set.add(ri(rng, -span, span));
        const nums = shuffle(rng, [...set]);
        const start = pick(rng, [0, 1000, ri(rng, 0, 1000), ri(rng, 0, 30)]);
        let goal = start;
        while (goal === start || set.has(goal) || Math.abs(goal) > 1000000000) {
          const mode = ri(rng, 0, 6);
          if (mode >= 4) {
            // A short random walk from start, so many goals are reachable.
            let x = start;
            const steps = ri(rng, 1, 5);
            for (let s = 0; s < steps && x >= 0 && x <= 1000; s++) {
              const a = pick(rng, nums), op = ri(rng, 0, 2);
              x = op === 0 ? x + a : op === 1 ? x - a : x ^ a;
            }
            goal = x;
          } else if (mode === 0) goal = ri(rng, 0, 1000);
          else if (mode === 1) goal = ri(rng, -1000000000, 1000000000);
          else if (mode === 2) goal = ri(rng, -50, 1050);
          else goal = Math.max(-1000000000, Math.min(1000000000, pick(rng, nums) + ri(rng, -20, 1020)));
        }
        return { input: `${fmtIntArr(nums)}\n${start}\n${goal}`, expectedOutput: String(ref(nums, start, goal)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def minimumOperations(nums: List[int], start: int, goal: int) -> int:
              dist = [-1] * 1001
              dist[start] = 0
              q = deque([start])
              while q:
                  x = q.popleft()
                  d = dist[x] + 1
                  for a in nums:
                      for y in (x + a, x - a, x ^ a):
                          if y == goal:
                              return d
                          if 0 <= y <= 1000 and dist[y] < 0:
                              dist[y] = d
                              q.append(y)
              return -1
        `,
        javascript: code`
          var minimumOperations = function(nums, start, goal) {
              var dist = new Array(1001);
              for (var i = 0; i <= 1000; i++) dist[i] = -1;
              dist[start] = 0;
              var q = [start];
              for (var h = 0; h < q.length; h++) {
                  var x = q[h], d = dist[x] + 1;
                  for (var j = 0; j < nums.length; j++) {
                      var a = nums[j];
                      var cand = [x + a, x - a, x ^ a];
                      for (var t = 0; t < 3; t++) {
                          var y = cand[t];
                          if (y === goal) return d;
                          if (y >= 0 && y <= 1000 && dist[y] < 0) { dist[y] = d; q.push(y); }
                      }
                  }
              }
              return -1;
          };
        `,
        typescript: code`
          function minimumOperations(nums: number[], start: number, goal: number): number {
              var dist: number[] = [];
              for (var i = 0; i <= 1000; i++) dist.push(-1);
              dist[start] = 0;
              var q: number[] = [start];
              for (var h = 0; h < q.length; h++) {
                  var x = q[h], d = dist[x] + 1;
                  for (var j = 0; j < nums.length; j++) {
                      var a = nums[j];
                      var cand = [x + a, x - a, x ^ a];
                      for (var t = 0; t < 3; t++) {
                          var y = cand[t];
                          if (y === goal) return d;
                          if (y >= 0 && y <= 1000 && dist[y] < 0) { dist[y] = d; q.push(y); }
                      }
                  }
              }
              return -1;
          }
        `,
        java: code`
          public static int minimumOperations(int[] nums, int start, int goal) {
              int[] dist = new int[1001];
              Arrays.fill(dist, -1);
              int[] q = new int[1001];
              int head = 0, tail = 0;
              dist[start] = 0;
              q[tail++] = start;
              while (head < tail) {
                  int x = q[head++], d = dist[x] + 1;
                  for (int a : nums) {
                      int[] cand = {x + a, x - a, x ^ a};
                      for (int y : cand) {
                          if (y == goal) return d;
                          if (y >= 0 && y <= 1000 && dist[y] < 0) { dist[y] = d; q[tail++] = y; }
                      }
                  }
              }
              return -1;
          }
        `,
        cpp: code`
          int minimumOperations(vector<int>& nums, int start, int goal) {
              vector<int> dist(1001, -1);
              vector<int> q;
              dist[start] = 0;
              q.push_back(start);
              for (size_t h = 0; h < q.size(); h++) {
                  int x = q[h], d = dist[x] + 1;
                  for (int a : nums) {
                      int cand[3] = {x + a, x - a, x ^ a};
                      for (int y : cand) {
                          if (y == goal) return d;
                          if (y >= 0 && y <= 1000 && dist[y] < 0) { dist[y] = d; q.push_back(y); }
                      }
                  }
              }
              return -1;
          }
        `,
        c: code`
          int minimumOperations(int* nums, int numsSize, int start, int goal) {
              int dist[1001], q[1001];
              for (int i = 0; i <= 1000; i++) dist[i] = -1;
              int head = 0, tail = 0;
              dist[start] = 0;
              q[tail++] = start;
              while (head < tail) {
                  int x = q[head++], d = dist[x] + 1;
                  for (int j = 0; j < numsSize; j++) {
                      int a = nums[j];
                      int cand[3] = {x + a, x - a, x ^ a};
                      for (int t = 0; t < 3; t++) {
                          int y = cand[t];
                          if (y == goal) return d;
                          if (y >= 0 && y <= 1000 && dist[y] < 0) { dist[y] = d; q[tail++] = y; }
                      }
                  }
              }
              return -1;
          }
        `,
        csharp: code`
          public static int MinimumOperations(int[] nums, int start, int goal)
          {
              var dist = new int[1001];
              for (int i = 0; i <= 1000; i++) dist[i] = -1;
              var q = new int[1001];
              int head = 0, tail = 0;
              dist[start] = 0;
              q[tail++] = start;
              while (head < tail)
              {
                  int x = q[head++], d = dist[x] + 1;
                  foreach (int a in nums)
                  {
                      int[] cand = { x + a, x - a, x ^ a };
                      foreach (int y in cand)
                      {
                          if (y == goal) return d;
                          if (y >= 0 && y <= 1000 && dist[y] < 0) { dist[y] = d; q[tail++] = y; }
                      }
                  }
              }
              return -1;
          }
        `,
        go: code`
          func minimumOperations(nums []int, start int, goal int) int {
              dist := make([]int, 1001)
              for i := range dist {
                  dist[i] = -1
              }
              dist[start] = 0
              q := []int{start}
              for h := 0; h < len(q); h++ {
                  x := q[h]
                  d := dist[x] + 1
                  for _, a := range nums {
                      for _, y := range [3]int{x + a, x - a, x ^ a} {
                          if y == goal {
                              return d
                          }
                          if y >= 0 && y <= 1000 && dist[y] < 0 {
                              dist[y] = d
                              q = append(q, y)
                          }
                      }
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun minimumOperations(nums: IntArray, start: Int, goal: Int): Int {
              val dist = IntArray(1001) { -1 }
              val q = IntArray(1001)
              var head = 0
              var tail = 0
              dist[start] = 0
              q[tail++] = start
              while (head < tail) {
                  val x = q[head++]
                  val d = dist[x] + 1
                  for (a in nums) {
                      for (y in intArrayOf(x + a, x - a, x xor a)) {
                          if (y == goal) return d
                          if (y in 0..1000 && dist[y] < 0) { dist[y] = d; q[tail++] = y }
                      }
                  }
              }
              return -1
          }
        `,
        swift: code`
          func minimumOperations(_ nums: [Int], _ start: Int, _ goal: Int) -> Int {
              var dist = [Int](repeating: -1, count: 1001)
              dist[start] = 0
              var q = [start]
              var h = 0
              while h < q.count {
                  let x = q[h]
                  h += 1
                  let d = dist[x] + 1
                  for a in nums {
                      for y in [x + a, x - a, x ^ a] {
                          if y == goal { return d }
                          if y >= 0 && y <= 1000 && dist[y] < 0 { dist[y] = d; q.append(y) }
                      }
                  }
              }
              return -1
          }
        `,
        rust: code`
          fn minimumOperations(nums: Vec<i32>, start: i32, goal: i32) -> i32 {
              let mut dist = vec![-1i32; 1001];
              dist[start as usize] = 0;
              let mut q: Vec<i32> = vec![start];
              let mut h = 0;
              while h < q.len() {
                  let x = q[h];
                  h += 1;
                  let d = dist[x as usize] + 1;
                  for &a in nums.iter() {
                      for &y in [x + a, x - a, x ^ a].iter() {
                          if y == goal {
                              return d;
                          }
                          if y >= 0 && y <= 1000 && dist[y as usize] < 0 {
                              dist[y as usize] = d;
                              q.push(y);
                          }
                      }
                  }
              }
              -1
          }
        `,
        php: code`
          function minimumOperations($nums, $start, $goal) {
              $dist = array_fill(0, 1001, -1);
              $dist[$start] = 0;
              $q = [$start];
              for ($h = 0; $h < count($q); $h++) {
                  $x = $q[$h];
                  $d = $dist[$x] + 1;
                  foreach ($nums as $a) {
                      foreach ([$x + $a, $x - $a, $x ^ $a] as $y) {
                          if ($y == $goal) return $d;
                          if ($y >= 0 && $y <= 1000 && $dist[$y] < 0) { $dist[$y] = $d; $q[] = $y; }
                      }
                  }
              }
              return -1;
          }
        `,
        ruby: code`
          def minimumOperations(nums, start, goal)
            dist = Array.new(1001, -1)
            dist[start] = 0
            q = [start]
            h = 0
            while h < q.length
              x = q[h]
              h += 1
              d = dist[x] + 1
              nums.each do |a|
                [x + a, x - a, x ^ a].each do |y|
                  return d if y == goal
                  if y >= 0 && y <= 1000 && dist[y] < 0
                    dist[y] = d
                    q << y
                  end
                end
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── K Highest Ranked Items Within a Price Range (LC 2146) ───────
  (() => {
    const ref = (grid: number[][], pricing: number[], start: number[], k: number) => {
      const m = grid.length, n = grid[0].length;
      const dist = grid.map((row) => row.map(() => -1));
      dist[start[0]][start[1]] = 0;
      const q: number[][] = [start];
      for (let h = 0; h < q.length; h++) {
        const [r, c] = q[h];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] === 0 || dist[nr][nc] >= 0) continue;
          dist[nr][nc] = dist[r][c] + 1;
          q.push([nr, nc]);
        }
      }
      const items: number[][] = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        if (dist[r][c] >= 0 && grid[r][c] >= pricing[0] && grid[r][c] <= pricing[1]) items.push([dist[r][c], grid[r][c], r, c]);
      }
      items.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]);
      return items.slice(0, k).map((t) => [t[2], t[3]]);
    };
    return {
      slug: "k-highest-ranked-items-within-a-price-range",
      title: "K Highest Ranked Items Within a Price Range",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Breadth-First Search", "Sorting", "Heap (Priority Queue)", "Matrix", "Amazon", "Google"],
      signature: {
        funcName: "highestRankedKItems",
        params: [{ name: "grid", type: "int[][]" as const }, { name: "pricing", type: "int[]" as const }, { name: "start", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int[][]" as const,
      },
      description: describe(
        "A shop floor is described by an `m x n` integer matrix `grid`:\n\n- `0` is a wall you cannot enter,\n- `1` is an empty aisle cell,\n- any value greater than `1` is a cell holding an item whose price is that value (you can walk through it).\n\nMoving to one of the four neighbouring cells takes one step. You stand at `start = [row, col]` and are interested only in items whose price lies in `pricing = [low, high]` (inclusive) and that you can reach.\n\nItems are ranked by these keys, in order — the earlier key decides:\n\n1. shorter walking distance from `start` ranks higher;\n2. lower price ranks higher;\n3. smaller row number ranks higher;\n4. smaller column number ranks higher.\n\nReturn the positions `[row, col]` of the `k` highest-ranked items, highest first. If fewer than `k` items qualify, return all of them in rank order.",
        [
          { in: "grid = [[1,2,0,1],[1,3,0,1],[0,2,5,1]], pricing = [2,5], start = [0,0], k = 3", out: "[[0,1],[1,1],[2,1]]", note: "The items at (0,1), (1,1), (2,1) and (2,2) are in range at distances 1, 2, 3 and 4; the first three are returned." },
          { in: "grid = [[1,2,0,1],[1,3,3,1],[0,2,5,1]], pricing = [2,3], start = [2,3], k = 2", out: "[[2,1],[1,2]]", note: "(2,1) and (1,2) are both 2 steps away; (2,1) is cheaper (2 < 3), so it ranks first." },
          { in: "grid = [[1,1,1],[0,0,1],[2,3,4]], pricing = [2,3], start = [0,0], k = 3", out: "[[2,1],[2,0]]", note: "Only two items are in range, so both are returned: (2,1) at distance 5 before (2,0) at distance 6." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 10^5", "1 <= m * n <= 10^5", "0 <= grid[i][j] <= 10^5", "pricing.length == 2", "2 <= low <= high <= 10^5", "start.length == 2", "grid[start[0]][start[1]] > 0", "1 <= k <= m * n"]),
      hints: [
        "The first ranking key is the walking distance, and every step costs 1 — that is a breadth-first search from `start`.",
        "During the BFS, record every reached cell whose value lies in `[low, high]` together with its distance (the start cell itself counts, at distance 0).",
        "Sort the recorded items by (distance, price, row, column) and keep the first `k`.",
      ],
      editorial: explain({
        idea: "Distances on an unweighted grid come from one BFS. Once every reachable item has its distance, the ranking is a plain lexicographic sort on the four keys.",
        steps: [
          "BFS from `start` over non-wall cells, writing each cell's distance when it is first reached.",
          "For every reached cell with `low <= grid[r][c] <= high`, record `(dist, price, r, c)`.",
          "Sort the records lexicographically.",
          "Return the `[r, c]` of the first `min(k, count)` records.",
        ],
        why: "BFS assigns each cell its true shortest walking distance, so the first key is exact; the remaining keys are values read off the cell. Sorting the tuples applies the keys in exactly the order the statement gives.",
        time: "O(mn log(mn))",
        space: "O(mn)",
        pitfalls: [
          "The starting cell is itself an item if its price is in range — at distance 0 it ranks first.",
          "Cells with value 1 are walkable but are never items, since `low >= 2`.",
          "Return fewer than `k` positions when fewer items qualify; an empty list is a valid answer.",
        ],
      }),
      examples: [
        { input: "[[1,2,0,1],[1,3,0,1],[0,2,5,1]]\n[2,5]\n[0,0]\n3", expectedOutput: "[[0,1],[1,1],[2,1]]" },
        { input: "[[1,2,0,1],[1,3,3,1],[0,2,5,1]]\n[2,3]\n[2,3]\n2", expectedOutput: "[[2,1],[1,2]]" },
        { input: "[[1,1,1],[0,0,1],[2,3,4]]\n[2,3]\n[0,0]\n3", expectedOutput: "[[2,1],[2,0]]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 5, 7, 8])), n = ri(rng, 1, pick(rng, [2, 5, 7, 8]));
        const maxP = pick(rng, [3, 6, 20, 100000]);
        const wall = pick(rng, [0, 0.15, 0.3]), empty = pick(rng, [0.1, 0.3, 0.5]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => {
          const x = rng();
          return x < wall ? 0 : x < wall + empty ? 1 : ri(rng, 2, maxP);
        }));
        const start = [ri(rng, 0, m - 1), ri(rng, 0, n - 1)];
        if (grid[start[0]][start[1]] === 0) grid[start[0]][start[1]] = pick(rng, [1, ri(rng, 2, maxP)]);
        const a = ri(rng, 2, maxP), b = ri(rng, 2, maxP);
        const pricing = rng() < 0.4 ? [2, maxP] : [Math.min(a, b), Math.max(a, b)];
        const k = ri(rng, 1, pick(rng, [3, 6, m * n]));
        return { input: `${fmtIntMat(grid)}\n${fmtIntArr(pricing)}\n${fmtIntArr(start)}\n${k}`, expectedOutput: fmtIntMat(ref(grid, pricing, start, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def highestRankedKItems(grid: List[List[int]], pricing: List[int], start: List[int], k: int) -> List[List[int]]:
              m, n = len(grid), len(grid[0])
              low, high = pricing
              dist = [[-1] * n for _ in range(m)]
              sr, sc = start
              dist[sr][sc] = 0
              q = deque([(sr, sc)])
              items = []
              while q:
                  r, c = q.popleft()
                  v = grid[r][c]
                  if low <= v <= high:
                      items.append((dist[r][c], v, r, c))
                  for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                      nr, nc = r + dr, c + dc
                      if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] != 0 and dist[nr][nc] < 0:
                          dist[nr][nc] = dist[r][c] + 1
                          q.append((nr, nc))
              items.sort()
              return [[r, c] for _, _, r, c in items[:k]]
        `,
        javascript: code`
          var highestRankedKItems = function(grid, pricing, start, k) {
              var m = grid.length, n = grid[0].length;
              var low = pricing[0], high = pricing[1];
              var dist = [];
              for (var i = 0; i < m; i++) { dist.push([]); for (var j = 0; j < n; j++) dist[i].push(-1); }
              dist[start[0]][start[1]] = 0;
              var q = [[start[0], start[1]]];
              var items = [];
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              for (var h = 0; h < q.length; h++) {
                  var r = q[h][0], c = q[h][1], v = grid[r][c];
                  if (v >= low && v <= high) items.push([dist[r][c], v, r, c]);
                  for (var d = 0; d < 4; d++) {
                      var nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] === 0 || dist[nr][nc] >= 0) continue;
                      dist[nr][nc] = dist[r][c] + 1;
                      q.push([nr, nc]);
                  }
              }
              items.sort(function(a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]; });
              var res = [];
              for (var t = 0; t < items.length && t < k; t++) res.push([items[t][2], items[t][3]]);
              return res;
          };
        `,
        typescript: code`
          function highestRankedKItems(grid: number[][], pricing: number[], start: number[], k: number): number[][] {
              var m = grid.length, n = grid[0].length;
              var low = pricing[0], high = pricing[1];
              var dist: number[][] = [];
              for (var i = 0; i < m; i++) { var row: number[] = []; for (var j = 0; j < n; j++) row.push(-1); dist.push(row); }
              dist[start[0]][start[1]] = 0;
              var q: number[][] = [[start[0], start[1]]];
              var items: number[][] = [];
              var DR = [1, -1, 0, 0], DC = [0, 0, 1, -1];
              for (var h = 0; h < q.length; h++) {
                  var r = q[h][0], c = q[h][1], v = grid[r][c];
                  if (v >= low && v <= high) items.push([dist[r][c], v, r, c]);
                  for (var d = 0; d < 4; d++) {
                      var nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] === 0 || dist[nr][nc] >= 0) continue;
                      dist[nr][nc] = dist[r][c] + 1;
                      q.push([nr, nc]);
                  }
              }
              items.sort(function(a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]; });
              var res: number[][] = [];
              for (var t = 0; t < items.length && t < k; t++) res.push([items[t][2], items[t][3]]);
              return res;
          }
        `,
        java: code`
          public static int[][] highestRankedKItems(int[][] grid, int[] pricing, int[] start, int k) {
              int m = grid.length, n = grid[0].length;
              int[][] dist = new int[m][n];
              for (int[] row : dist) Arrays.fill(row, -1);
              dist[start[0]][start[1]] = 0;
              ArrayDeque<int[]> q = new ArrayDeque<>();
              q.add(new int[]{start[0], start[1]});
              List<int[]> items = new ArrayList<>();
              int[] DR = {1, -1, 0, 0}, DC = {0, 0, 1, -1};
              while (!q.isEmpty()) {
                  int[] cur = q.poll();
                  int r = cur[0], c = cur[1], v = grid[r][c];
                  if (v >= pricing[0] && v <= pricing[1]) items.add(new int[]{dist[r][c], v, r, c});
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] == 0 || dist[nr][nc] >= 0) continue;
                      dist[nr][nc] = dist[r][c] + 1;
                      q.add(new int[]{nr, nc});
                  }
              }
              items.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] != b[1] ? a[1] - b[1] : a[2] != b[2] ? a[2] - b[2] : a[3] - b[3]);
              int take = Math.min(k, items.size());
              int[][] res = new int[take][];
              for (int t = 0; t < take; t++) res[t] = new int[]{items.get(t)[2], items.get(t)[3]};
              return res;
          }
        `,
        cpp: code`
          vector<vector<int>> highestRankedKItems(vector<vector<int>>& grid, vector<int>& pricing, vector<int>& start, int k) {
              int m = grid.size(), n = grid[0].size();
              vector<vector<int>> dist(m, vector<int>(n, -1));
              dist[start[0]][start[1]] = 0;
              vector<pair<int, int>> q = {{start[0], start[1]}};
              vector<array<int, 4>> items;
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              for (size_t h = 0; h < q.size(); h++) {
                  int r = q[h].first, c = q[h].second, v = grid[r][c];
                  if (v >= pricing[0] && v <= pricing[1]) items.push_back({dist[r][c], v, r, c});
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] == 0 || dist[nr][nc] >= 0) continue;
                      dist[nr][nc] = dist[r][c] + 1;
                      q.push_back({nr, nc});
                  }
              }
              sort(items.begin(), items.end());
              vector<vector<int>> res;
              for (size_t t = 0; t < items.size() && (int) t < k; t++) res.push_back({items[t][2], items[t][3]});
              return res;
          }
        `,
        c: code`
          typedef struct { int d, p, r, c; } RankedItem;

          static int cmpRankedItem(const void* a, const void* b) {
              const RankedItem* x = (const RankedItem*) a;
              const RankedItem* y = (const RankedItem*) b;
              if (x->d != y->d) return x->d - y->d;
              if (x->p != y->p) return x->p - y->p;
              if (x->r != y->r) return x->r - y->r;
              return x->c - y->c;
          }

          int** highestRankedKItems(int** grid, int gridSize, int* gridColSize, int* pricing, int pricingSize, int* start, int startSize, int k, int* returnSize, int** returnColumnSizes) {
              int m = gridSize, n = gridColSize[0];
              int* dist = (int*) malloc((size_t) m * n * sizeof(int));
              int* q = (int*) malloc((size_t) m * n * sizeof(int));
              RankedItem* items = (RankedItem*) malloc((size_t) m * n * sizeof(RankedItem));
              for (int i = 0; i < m * n; i++) dist[i] = -1;
              int DR[4] = {1, -1, 0, 0}, DC[4] = {0, 0, 1, -1};
              int head = 0, tail = 0, cnt = 0;
              dist[start[0] * n + start[1]] = 0;
              q[tail++] = start[0] * n + start[1];
              while (head < tail) {
                  int cell = q[head++];
                  int r = cell / n, c = cell % n, v = grid[r][c];
                  if (v >= pricing[0] && v <= pricing[1]) {
                      items[cnt].d = dist[cell]; items[cnt].p = v; items[cnt].r = r; items[cnt].c = c;
                      cnt++;
                  }
                  for (int d = 0; d < 4; d++) {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] == 0 || dist[nr * n + nc] >= 0) continue;
                      dist[nr * n + nc] = dist[cell] + 1;
                      q[tail++] = nr * n + nc;
                  }
              }
              qsort(items, cnt, sizeof(RankedItem), cmpRankedItem);
              int take = cnt < k ? cnt : k;
              int** res = (int**) malloc((size_t) (take + 1) * sizeof(int*));
              *returnColumnSizes = (int*) malloc((size_t) (take + 1) * sizeof(int));
              for (int t = 0; t < take; t++) {
                  res[t] = (int*) malloc(2 * sizeof(int));
                  res[t][0] = items[t].r;
                  res[t][1] = items[t].c;
                  (*returnColumnSizes)[t] = 2;
              }
              *returnSize = take;
              free(dist); free(q); free(items);
              return res;
          }
        `,
        csharp: code`
          public static int[][] HighestRankedKItems(int[][] grid, int[] pricing, int[] start, int k)
          {
              int m = grid.Length, n = grid[0].Length;
              var dist = new int[m, n];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++) dist[i, j] = -1;
              dist[start[0], start[1]] = 0;
              var q = new Queue<int[]>();
              q.Enqueue(new[] { start[0], start[1] });
              var items = new List<int[]>();
              int[] DR = { 1, -1, 0, 0 }, DC = { 0, 0, 1, -1 };
              while (q.Count > 0)
              {
                  var cur = q.Dequeue();
                  int r = cur[0], c = cur[1], v = grid[r][c];
                  if (v >= pricing[0] && v <= pricing[1]) items.Add(new[] { dist[r, c], v, r, c });
                  for (int d = 0; d < 4; d++)
                  {
                      int nr = r + DR[d], nc = c + DC[d];
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] == 0 || dist[nr, nc] >= 0) continue;
                      dist[nr, nc] = dist[r, c] + 1;
                      q.Enqueue(new[] { nr, nc });
                  }
              }
              items.Sort((a, b) => a[0] != b[0] ? a[0].CompareTo(b[0]) : a[1] != b[1] ? a[1].CompareTo(b[1]) : a[2] != b[2] ? a[2].CompareTo(b[2]) : a[3].CompareTo(b[3]));
              int take = Math.Min(k, items.Count);
              var res = new int[take][];
              for (int t = 0; t < take; t++) res[t] = new[] { items[t][2], items[t][3] };
              return res;
          }
        `,
        go: code`
          func highestRankedKItems(grid [][]int, pricing []int, start []int, k int) [][]int {
              m, n := len(grid), len(grid[0])
              dist := make([][]int, m)
              for i := range dist {
                  dist[i] = make([]int, n)
                  for j := range dist[i] {
                      dist[i][j] = -1
                  }
              }
              dist[start[0]][start[1]] = 0
              q := [][2]int{{start[0], start[1]}}
              items := [][4]int{}
              DR := []int{1, -1, 0, 0}
              DC := []int{0, 0, 1, -1}
              for h := 0; h < len(q); h++ {
                  r, c := q[h][0], q[h][1]
                  v := grid[r][c]
                  if v >= pricing[0] && v <= pricing[1] {
                      items = append(items, [4]int{dist[r][c], v, r, c})
                  }
                  for d := 0; d < 4; d++ {
                      nr, nc := r+DR[d], c+DC[d]
                      if nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] == 0 || dist[nr][nc] >= 0 {
                          continue
                      }
                      dist[nr][nc] = dist[r][c] + 1
                      q = append(q, [2]int{nr, nc})
                  }
              }
              sort.Slice(items, func(a, b int) bool {
                  for t := 0; t < 4; t++ {
                      if items[a][t] != items[b][t] {
                          return items[a][t] < items[b][t]
                      }
                  }
                  return false
              })
              res := [][]int{}
              for t := 0; t < len(items) && t < k; t++ {
                  res = append(res, []int{items[t][2], items[t][3]})
              }
              return res
          }
        `,
        kotlin: code`
          fun highestRankedKItems(grid: Array<IntArray>, pricing: IntArray, start: IntArray, k: Int): Array<IntArray> {
              val m = grid.size
              val n = grid[0].size
              val dist = Array(m) { IntArray(n) { -1 } }
              dist[start[0]][start[1]] = 0
              val q = ArrayList<IntArray>()
              q.add(intArrayOf(start[0], start[1]))
              var h = 0
              val items = ArrayList<IntArray>()
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              while (h < q.size) {
                  val cur = q[h++]
                  val r = cur[0]
                  val c = cur[1]
                  val v = grid[r][c]
                  if (v >= pricing[0] && v <= pricing[1]) items.add(intArrayOf(dist[r][c], v, r, c))
                  for (d in 0 until 4) {
                      val nr = r + dr[d]
                      val nc = c + dc[d]
                      if (nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] == 0 || dist[nr][nc] >= 0) continue
                      dist[nr][nc] = dist[r][c] + 1
                      q.add(intArrayOf(nr, nc))
                  }
              }
              items.sortWith(compareBy<IntArray>({ it[0] }, { it[1] }, { it[2] }, { it[3] }))
              return Array(minOf(k, items.size)) { intArrayOf(items[it][2], items[it][3]) }
          }
        `,
        swift: code`
          func highestRankedKItems(_ grid: [[Int]], _ pricing: [Int], _ start: [Int], _ k: Int) -> [[Int]] {
              let m = grid.count, n = grid[0].count
              var dist = [[Int]](repeating: [Int](repeating: -1, count: n), count: m)
              dist[start[0]][start[1]] = 0
              var q = [(start[0], start[1])]
              var items = [[Int]]()
              let DR = [1, -1, 0, 0], DC = [0, 0, 1, -1]
              var h = 0
              while h < q.count {
                  let (r, c) = q[h]
                  h += 1
                  let v = grid[r][c]
                  if v >= pricing[0] && v <= pricing[1] { items.append([dist[r][c], v, r, c]) }
                  for d in 0..<4 {
                      let nr = r + DR[d], nc = c + DC[d]
                      if nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] == 0 || dist[nr][nc] >= 0 { continue }
                      dist[nr][nc] = dist[r][c] + 1
                      q.append((nr, nc))
                  }
              }
              items.sort { a, b in
                  for t in 0..<4 where a[t] != b[t] { return a[t] < b[t] }
                  return false
              }
              return items.prefix(k).map { [$0[2], $0[3]] }
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          fn highestRankedKItems(grid: Vec<Vec<i32>>, pricing: Vec<i32>, start: Vec<i32>, k: i32) -> Vec<Vec<i32>> {
              let m = grid.len() as i32;
              let n = grid[0].len() as i32;
              let mut dist = vec![vec![-1i32; n as usize]; m as usize];
              dist[start[0] as usize][start[1] as usize] = 0;
              let mut q = VecDeque::new();
              q.push_back((start[0], start[1]));
              let mut items: Vec<(i32, i32, i32, i32)> = Vec::new();
              let dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)];
              while let Some((r, c)) = q.pop_front() {
                  let v = grid[r as usize][c as usize];
                  let dc = dist[r as usize][c as usize];
                  if v >= pricing[0] && v <= pricing[1] {
                      items.push((dc, v, r, c));
                  }
                  for &(dr, dcol) in dirs.iter() {
                      let (nr, nc) = (r + dr, c + dcol);
                      if nr < 0 || nc < 0 || nr >= m || nc >= n {
                          continue;
                      }
                      let (ur, uc) = (nr as usize, nc as usize);
                      if grid[ur][uc] == 0 || dist[ur][uc] >= 0 {
                          continue;
                      }
                      dist[ur][uc] = dc + 1;
                      q.push_back((nr, nc));
                  }
              }
              items.sort();
              items.iter().take(k as usize).map(|t| vec![t.2, t.3]).collect()
          }
        `,
        php: code`
          function highestRankedKItems($grid, $pricing, $start, $k) {
              $m = count($grid);
              $n = count($grid[0]);
              $dist = array_fill(0, $m, array_fill(0, $n, -1));
              $dist[$start[0]][$start[1]] = 0;
              $q = [[$start[0], $start[1]]];
              $items = [];
              $DR = [1, -1, 0, 0];
              $DC = [0, 0, 1, -1];
              for ($h = 0; $h < count($q); $h++) {
                  [$r, $c] = $q[$h];
                  $v = $grid[$r][$c];
                  if ($v >= $pricing[0] && $v <= $pricing[1]) $items[] = [$dist[$r][$c], $v, $r, $c];
                  for ($d = 0; $d < 4; $d++) {
                      $nr = $r + $DR[$d];
                      $nc = $c + $DC[$d];
                      if ($nr < 0 || $nc < 0 || $nr >= $m || $nc >= $n || $grid[$nr][$nc] == 0 || $dist[$nr][$nc] >= 0) continue;
                      $dist[$nr][$nc] = $dist[$r][$c] + 1;
                      $q[] = [$nr, $nc];
                  }
              }
              usort($items, function ($a, $b) { return $a <=> $b; });
              $res = [];
              for ($t = 0; $t < count($items) && $t < $k; $t++) $res[] = [$items[$t][2], $items[$t][3]];
              return $res;
          }
        `,
        ruby: code`
          def highestRankedKItems(grid, pricing, start, k)
            m = grid.length
            n = grid[0].length
            dist = Array.new(m) { Array.new(n, -1) }
            dist[start[0]][start[1]] = 0
            q = [[start[0], start[1]]]
            items = []
            h = 0
            while h < q.length
              r, c = q[h]
              h += 1
              v = grid[r][c]
              items << [dist[r][c], v, r, c] if v >= pricing[0] && v <= pricing[1]
              [[1, 0], [-1, 0], [0, 1], [0, -1]].each do |dr, dc|
                nr = r + dr
                nc = c + dc
                next if nr < 0 || nc < 0 || nr >= m || nc >= n || grid[nr][nc] == 0 || dist[nr][nc] >= 0
                dist[nr][nc] = dist[r][c] + 1
                q << [nr, nc]
              end
            end
            items.sort.first(k).map { |t| [t[2], t[3]] }
          end
        `,
      },
    };
  })(),

  // ── Minimum Weighted Subgraph With the Required Paths (LC 2203) ─
  (() => {
    const ref = (n: number, edges: number[][], src1: number, src2: number, dest: number) => {
      // Floyd–Warshall on the small generated graphs; the answer is the best
      // meeting node v of src1 → v, src2 → v and v → dest.
      const INF = 1e15;
      const d: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)));
      for (const [u, v, w] of edges) d[u][v] = Math.min(d[u][v], w);
      for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
      let best = INF;
      for (let v = 0; v < n; v++) best = Math.min(best, d[src1][v] + d[src2][v] + d[v][dest]);
      return best >= INF ? -1 : best;
    };
    return {
      slug: "minimum-weighted-subgraph-with-the-required-paths",
      title: "Minimum Weighted Subgraph With the Required Paths",
      difficulty: "HARD" as const,
      tags: ["Graph", "Shortest Path", "Heap (Priority Queue)", "Google", "Amazon"],
      signature: {
        funcName: "minimumWeight",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "src1", type: "int" as const }, { name: "src2", type: "int" as const }, { name: "dest", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A weighted **directed** graph has `n` nodes numbered `0` to `n - 1`. Each `edges[i] = [from, to, weight]` is an edge from `from` to `to` with the given positive weight; there may be several edges between the same pair of nodes.\n\nYou are also given three distinct nodes `src1`, `src2` and `dest`. Choose a set of edges (a subgraph) in which `dest` can be reached from `src1` **and** from `src2`. The weight of the subgraph is the sum of its edges' weights, each edge counted once.\n\nReturn the **minimum** possible weight of such a subgraph, or `-1` if no subgraph works.\n\nCodeKairo keeps every answer inside a 32-bit integer by bounding `n` and the weights (see the constraints).",
        [
          { in: "n = 6, edges = [[0,2,2],[0,5,6],[1,0,3],[1,4,5],[2,1,1],[2,3,3],[2,3,4],[3,4,2],[4,5,1]], src1 = 0, src2 = 1, dest = 5", out: "9", note: "Keep 1 → 0 (3), 0 → 5 (6): both sources reach 5 for a total of 9." },
          { in: "n = 3, edges = [[0,1,1],[2,1,1]], src1 = 0, src2 = 1, dest = 2", out: "-1", note: "No edge leaves node 1, so `dest = 2` is unreachable from `src2`." },
          { in: "n = 4, edges = [[0,2,4],[1,2,4],[2,3,5],[0,3,20],[1,3,20]], src1 = 0, src2 = 1, dest = 3", out: "13", note: "Both paths meet at node 2 and share the edge 2 → 3: 4 + 4 + 5 = 13." },
        ],
        ["3 <= n <= 10^4", "0 <= edges.length <= 10^5", "edges[i].length == 3", "0 <= from, to < n", "from != to", "1 <= weight <= 10^4", "0 <= src1, src2, dest < n", "src1, src2 and dest are pairwise distinct"]),
      hints: [
        "In an optimal subgraph the path from `src1` and the path from `src2` meet at some node `v` and share everything from `v` to `dest`.",
        "So the answer is `min over v` of `dist(src1, v) + dist(src2, v) + dist(v, dest)` — three shortest-path tables.",
        "Run Dijkstra from `src1` and from `src2` on the graph, and from `dest` on the graph with every edge reversed; that last run gives `dist(v, dest)` for all `v` at once.",
      ],
      editorial: explain({
        idea: "Two paths into the same destination can be assumed to merge once and then share the rest. If they merge at `v`, the cheapest such subgraph costs the shortest `src1 → v`, plus the shortest `src2 → v`, plus the shortest `v → dest`. Trying every `v` needs only three Dijkstra runs.",
        steps: [
          "Build the adjacency list and the reversed adjacency list.",
          "Dijkstra from `src1` and from `src2` on the graph; Dijkstra from `dest` on the reversed graph.",
          "For every node `v` reached by all three runs, evaluate `d1[v] + d2[v] + dr[v]`.",
          "Return the minimum, or `-1` if no node is reached by all three.",
        ],
        why: "Take an optimal subgraph and walk back from `dest` along the `src1` path; the first node where it touches the `src2` path is a merge point `v`, and from there the two can share one route. Replacing each of the three pieces by a shortest path cannot increase the weight, and the formula's value is always realisable (the union of the three paths), so the minimum over `v` is the answer.",
        time: "O((n + m) log m)",
        space: "O(n + m)",
        pitfalls: [
          "Edges are directed; the third search must run on the **reversed** graph from `dest`, not forward.",
          "`v` may be `src1`, `src2` or `dest` itself — e.g. when one source's path passes through the other.",
          "Use 64-bit (or a large sentinel) for unreachable distances so adding three of them cannot overflow.",
        ],
      }),
      examples: [
        { input: "6\n[[0,2,2],[0,5,6],[1,0,3],[1,4,5],[2,1,1],[2,3,3],[2,3,4],[3,4,2],[4,5,1]]\n0\n1\n5", expectedOutput: "9" },
        { input: "3\n[[0,1,1],[2,1,1]]\n0\n1\n2", expectedOutput: "-1" },
        { input: "4\n[[0,2,4],[1,2,4],[2,3,5],[0,3,20],[1,3,20]]\n0\n1\n3", expectedOutput: "13" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, pick(rng, [3, 5, 8, 10]));
        const m = ri(rng, 0, pick(rng, [n, 2 * n, 4 * n]));
        const W = pick(rng, [1, 5, 100, 10000]);
        const edges: number[][] = [];
        for (let i = 0; i < m; i++) {
          const u = ri(rng, 0, n - 1);
          let v = ri(rng, 0, n - 2);
          if (v >= u) v++;
          edges.push([u, v, ri(rng, 1, W)]);
        }
        const [src1, src2, dest] = shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, 3);
        // Most cases plant a route from each source to dest so -1 stays a minority.
        for (const s of [src1, src2]) {
          if (rng() < 0.25) continue;
          let at = s;
          while (at !== dest) {
            const next = rng() < 0.4 ? dest : ri(rng, 0, n - 1);
            if (next !== at) edges.push([at, next, ri(rng, 1, W)]);
            at = next;
          }
        }
        shuffle(rng, edges);
        return { input: `${n}\n${fmtIntMat(edges)}\n${src1}\n${src2}\n${dest}`, expectedOutput: String(ref(n, edges, src1, src2, dest)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def minimumWeight(n: int, edges: List[List[int]], src1: int, src2: int, dest: int) -> int:
              fwd = [[] for _ in range(n)]
              rev = [[] for _ in range(n)]
              for u, v, w in edges:
                  fwd[u].append((v, w))
                  rev[v].append((u, w))
              INF = float("inf")

              def dijkstra(adj, src):
                  dist = [INF] * n
                  dist[src] = 0
                  heap = [(0, src)]
                  while heap:
                      d, u = heapq.heappop(heap)
                      if d > dist[u]:
                          continue
                      for v, w in adj[u]:
                          if d + w < dist[v]:
                              dist[v] = d + w
                              heapq.heappush(heap, (d + w, v))
                  return dist

              a, b, c = dijkstra(fwd, src1), dijkstra(fwd, src2), dijkstra(rev, dest)
              best = min(a[v] + b[v] + c[v] for v in range(n))
              return -1 if best == INF else best
        `,
        javascript: code`
          var minimumWeight = function(n, edges, src1, src2, dest) {
              var fwd = [], rev = [];
              for (var i = 0; i < n; i++) { fwd.push([]); rev.push([]); }
              for (var e = 0; e < edges.length; e++) {
                  fwd[edges[e][0]].push(edges[e][1], edges[e][2]);
                  rev[edges[e][1]].push(edges[e][0], edges[e][2]);
              }
              var a = dijkstra(n, fwd, src1), b = dijkstra(n, fwd, src2), c = dijkstra(n, rev, dest);
              var best = -1;
              for (var v = 0; v < n; v++) {
                  if (a[v] < 0 || b[v] < 0 || c[v] < 0) continue;
                  var s = a[v] + b[v] + c[v];
                  if (best < 0 || s < best) best = s;
              }
              return best;
          };

          // Dijkstra over a heap of packed keys dist * 16384 + node (n <= 10^4).
          var dijkstra = function(n, adj, src) {
              var dist = [], done = [];
              for (var i = 0; i < n; i++) { dist.push(-1); done.push(false); }
              dist[src] = 0;
              var heap = [src];
              while (heap.length > 0) {
                  var key = heapPop(heap), u = key % 16384, d = (key - u) / 16384;
                  if (done[u]) continue;
                  done[u] = true;
                  var list = adj[u];
                  for (var j = 0; j < list.length; j += 2) {
                      var v = list[j], nd = d + list[j + 1];
                      if (!done[v] && (dist[v] < 0 || nd < dist[v])) { dist[v] = nd; heapPush(heap, nd * 16384 + v); }
                  }
              }
              return dist;
          };

          var heapPush = function(h, v) {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          };

          var heapPop = function(h) {
              var top = h[0];
              var last = h.pop();
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function heapPush(h: number[], v: number): void {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          function heapPop(h: number[]): number {
              var top = h[0];
              var last = h.pop() as number;
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          // Dijkstra over a heap of packed keys dist * 16384 + node (n <= 10^4).
          function dijkstra(n: number, adj: number[][], src: number): number[] {
              var dist: number[] = [], done: boolean[] = [];
              for (var i = 0; i < n; i++) { dist.push(-1); done.push(false); }
              dist[src] = 0;
              var heap: number[] = [src];
              while (heap.length > 0) {
                  var key = heapPop(heap), u = key % 16384, d = (key - u) / 16384;
                  if (done[u]) continue;
                  done[u] = true;
                  var list = adj[u];
                  for (var j = 0; j < list.length; j += 2) {
                      var v = list[j], nd = d + list[j + 1];
                      if (!done[v] && (dist[v] < 0 || nd < dist[v])) { dist[v] = nd; heapPush(heap, nd * 16384 + v); }
                  }
              }
              return dist;
          }

          function minimumWeight(n: number, edges: number[][], src1: number, src2: number, dest: number): number {
              var fwd: number[][] = [], rev: number[][] = [];
              for (var i = 0; i < n; i++) { fwd.push([]); rev.push([]); }
              for (var e = 0; e < edges.length; e++) {
                  fwd[edges[e][0]].push(edges[e][1], edges[e][2]);
                  rev[edges[e][1]].push(edges[e][0], edges[e][2]);
              }
              var a = dijkstra(n, fwd, src1), b = dijkstra(n, fwd, src2), c = dijkstra(n, rev, dest);
              var best = -1;
              for (var v = 0; v < n; v++) {
                  if (a[v] < 0 || b[v] < 0 || c[v] < 0) continue;
                  var s = a[v] + b[v] + c[v];
                  if (best < 0 || s < best) best = s;
              }
              return best;
          }
        `,
        java: code`
          static long[] dijkstra(int n, List<List<int[]>> adj, int src) {
              long[] dist = new long[n];
              Arrays.fill(dist, Long.MAX_VALUE);
              dist[src] = 0;
              PriorityQueue<long[]> pq = new PriorityQueue<>((x, y) -> Long.compare(x[0], y[0]));
              pq.add(new long[]{0, src});
              while (!pq.isEmpty()) {
                  long[] top = pq.poll();
                  int u = (int) top[1];
                  if (top[0] > dist[u]) continue;
                  for (int[] e : adj.get(u)) {
                      long nd = top[0] + e[1];
                      if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(new long[]{nd, e[0]}); }
                  }
              }
              return dist;
          }

          public static int minimumWeight(int n, int[][] edges, int src1, int src2, int dest) {
              List<List<int[]>> fwd = new ArrayList<>(), rev = new ArrayList<>();
              for (int i = 0; i < n; i++) { fwd.add(new ArrayList<>()); rev.add(new ArrayList<>()); }
              for (int[] e : edges) {
                  fwd.get(e[0]).add(new int[]{e[1], e[2]});
                  rev.get(e[1]).add(new int[]{e[0], e[2]});
              }
              long[] a = dijkstra(n, fwd, src1), b = dijkstra(n, fwd, src2), c = dijkstra(n, rev, dest);
              long best = Long.MAX_VALUE;
              for (int v = 0; v < n; v++) {
                  if (a[v] == Long.MAX_VALUE || b[v] == Long.MAX_VALUE || c[v] == Long.MAX_VALUE) continue;
                  best = Math.min(best, a[v] + b[v] + c[v]);
              }
              return best == Long.MAX_VALUE ? -1 : (int) best;
          }
        `,
        cpp: code`
          vector<long long> dijkstraFrom(int n, vector<vector<pair<int, int>>>& adj, int src) {
              const long long INF = LLONG_MAX / 4;
              vector<long long> dist(n, INF);
              priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
              dist[src] = 0;
              pq.push({0, src});
              while (!pq.empty()) {
                  long long d = pq.top().first;
                  int u = pq.top().second;
                  pq.pop();
                  if (d > dist[u]) continue;
                  for (auto& e : adj[u]) {
                      int v = e.first, w = e.second;
                      if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }
                  }
              }
              return dist;
          }

          int minimumWeight(int n, vector<vector<int>>& edges, int src1, int src2, int dest) {
              vector<vector<pair<int, int>>> fwd(n), rev(n);
              for (auto& e : edges) {
                  fwd[e[0]].push_back({e[1], e[2]});
                  rev[e[1]].push_back({e[0], e[2]});
              }
              auto a = dijkstraFrom(n, fwd, src1), b = dijkstraFrom(n, fwd, src2), c = dijkstraFrom(n, rev, dest);
              const long long INF = LLONG_MAX / 4;
              long long best = INF;
              for (int v = 0; v < n; v++) {
                  if (a[v] == INF || b[v] == INF || c[v] == INF) continue;
                  best = min(best, a[v] + b[v] + c[v]);
              }
              return best == INF ? -1 : (int) best;
          }
        `,
        c: code`
          static void hpPush(long long* h, int* size, long long v) {
              int i = (*size)++;
              h[i] = v;
              while (i > 0) {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long long hpPop(long long* h, int* size) {
              long long top = h[0];
              (*size)--;
              if (*size > 0) {
                  h[0] = h[*size];
                  int j = 0;
                  for (;;) {
                      int l = 2 * j + 1, r = l + 1, s = j;
                      if (l < *size && h[l] < h[s]) s = l;
                      if (r < *size && h[r] < h[s]) s = r;
                      if (s == j) break;
                      long long t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          /* Dijkstra over linked adjacency (head/nxt/to/wt); keys are dist * 16384 + node. */
          static long long* dijkstraFrom(int n, int m, int* head, int* nxt, int* to, int* wt, int src) {
              long long* dist = (long long*) malloc((size_t) n * sizeof(long long));
              char* done = (char*) calloc((size_t) n, 1);
              long long* heap = (long long*) malloc((size_t) (m + 1) * sizeof(long long));
              int size = 0;
              for (int i = 0; i < n; i++) dist[i] = -1;
              dist[src] = 0;
              hpPush(heap, &size, src);
              while (size > 0) {
                  long long key = hpPop(heap, &size);
                  int u = (int) (key % 16384);
                  long long d = key / 16384;
                  if (done[u]) continue;
                  done[u] = 1;
                  for (int e = head[u]; e != -1; e = nxt[e]) {
                      int v = to[e];
                      long long nd = d + wt[e];
                      if (!done[v] && (dist[v] < 0 || nd < dist[v])) { dist[v] = nd; hpPush(heap, &size, nd * 16384 + v); }
                  }
              }
              free(done); free(heap);
              return dist;
          }

          int minimumWeight(int n, int** edges, int edgesSize, int* edgesColSize, int src1, int src2, int dest) {
              int m = edgesSize;
              int* fh = (int*) malloc((size_t) n * sizeof(int));
              int* rh = (int*) malloc((size_t) n * sizeof(int));
              int* fn = (int*) malloc((size_t) (m + 1) * sizeof(int));
              int* rn = (int*) malloc((size_t) (m + 1) * sizeof(int));
              int* ft = (int*) malloc((size_t) (m + 1) * sizeof(int));
              int* rt = (int*) malloc((size_t) (m + 1) * sizeof(int));
              int* w = (int*) malloc((size_t) (m + 1) * sizeof(int));
              for (int i = 0; i < n; i++) { fh[i] = -1; rh[i] = -1; }
              for (int e = 0; e < m; e++) {
                  int u = edges[e][0], v = edges[e][1];
                  w[e] = edges[e][2];
                  ft[e] = v; fn[e] = fh[u]; fh[u] = e;
                  rt[e] = u; rn[e] = rh[v]; rh[v] = e;
              }
              long long* a = dijkstraFrom(n, m, fh, fn, ft, w, src1);
              long long* b = dijkstraFrom(n, m, fh, fn, ft, w, src2);
              long long* c = dijkstraFrom(n, m, rh, rn, rt, w, dest);
              long long best = -1;
              for (int v = 0; v < n; v++) {
                  if (a[v] < 0 || b[v] < 0 || c[v] < 0) continue;
                  long long s = a[v] + b[v] + c[v];
                  if (best < 0 || s < best) best = s;
              }
              free(a); free(b); free(c);
              free(fh); free(rh); free(fn); free(rn); free(ft); free(rt); free(w);
              return (int) best;
          }
        `,
        csharp: code`
          static void HeapPush(List<long> h, long v)
          {
              h.Add(v);
              int i = h.Count - 1;
              while (i > 0)
              {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long HeapPop(List<long> h)
          {
              long top = h[0];
              int last = h.Count - 1;
              h[0] = h[last];
              h.RemoveAt(last);
              int j = 0;
              while (true)
              {
                  int l = 2 * j + 1, r = l + 1, s = j;
                  if (l < h.Count && h[l] < h[s]) s = l;
                  if (r < h.Count && h[r] < h[s]) s = r;
                  if (s == j) break;
                  long t = h[s]; h[s] = h[j]; h[j] = t;
                  j = s;
              }
              return top;
          }

          // Dijkstra over a heap of packed keys dist * 16384 + node (n <= 10^4).
          static long[] Dijkstra(int n, List<int[]>[] adj, int src)
          {
              var dist = new long[n];
              var done = new bool[n];
              for (int i = 0; i < n; i++) dist[i] = -1;
              dist[src] = 0;
              var heap = new List<long> { src };
              while (heap.Count > 0)
              {
                  long key = HeapPop(heap);
                  int u = (int) (key % 16384);
                  long d = key / 16384;
                  if (done[u]) continue;
                  done[u] = true;
                  foreach (var e in adj[u])
                  {
                      long nd = d + e[1];
                      if (!done[e[0]] && (dist[e[0]] < 0 || nd < dist[e[0]])) { dist[e[0]] = nd; HeapPush(heap, nd * 16384 + e[0]); }
                  }
              }
              return dist;
          }

          public static int MinimumWeight(int n, int[][] edges, int src1, int src2, int dest)
          {
              var fwd = new List<int[]>[n];
              var rev = new List<int[]>[n];
              for (int i = 0; i < n; i++) { fwd[i] = new List<int[]>(); rev[i] = new List<int[]>(); }
              foreach (var e in edges)
              {
                  fwd[e[0]].Add(new[] { e[1], e[2] });
                  rev[e[1]].Add(new[] { e[0], e[2] });
              }
              long[] a = Dijkstra(n, fwd, src1), b = Dijkstra(n, fwd, src2), c = Dijkstra(n, rev, dest);
              long best = -1;
              for (int v = 0; v < n; v++)
              {
                  if (a[v] < 0 || b[v] < 0 || c[v] < 0) continue;
                  long s = a[v] + b[v] + c[v];
                  if (best < 0 || s < best) best = s;
              }
              return (int) best;
          }
        `,
        go: code`
          func hpPush(h *[]int, v int) {
              *h = append(*h, v)
              a := *h
              i := len(a) - 1
              for i > 0 {
                  p := (i - 1) / 2
                  if a[p] <= a[i] {
                      break
                  }
                  a[p], a[i] = a[i], a[p]
                  i = p
              }
          }

          func hpPop(h *[]int) int {
              a := *h
              top := a[0]
              last := len(a) - 1
              a[0] = a[last]
              a = a[:last]
              j := 0
              for {
                  l, r, s := 2*j+1, 2*j+2, j
                  if l < len(a) && a[l] < a[s] {
                      s = l
                  }
                  if r < len(a) && a[r] < a[s] {
                      s = r
                  }
                  if s == j {
                      break
                  }
                  a[s], a[j] = a[j], a[s]
                  j = s
              }
              *h = a
              return top
          }

          // dijkstra over a heap of packed keys dist*16384 + node (n <= 10^4).
          func dijkstra(n int, adj [][][2]int, src int) []int {
              dist := make([]int, n)
              done := make([]bool, n)
              for i := range dist {
                  dist[i] = -1
              }
              dist[src] = 0
              heap := []int{src}
              for len(heap) > 0 {
                  key := hpPop(&heap)
                  u, d := key%16384, key/16384
                  if done[u] {
                      continue
                  }
                  done[u] = true
                  for _, e := range adj[u] {
                      v, nd := e[0], d+e[1]
                      if !done[v] && (dist[v] < 0 || nd < dist[v]) {
                          dist[v] = nd
                          hpPush(&heap, nd*16384+v)
                      }
                  }
              }
              return dist
          }

          func minimumWeight(n int, edges [][]int, src1 int, src2 int, dest int) int {
              fwd := make([][][2]int, n)
              rev := make([][][2]int, n)
              for _, e := range edges {
                  fwd[e[0]] = append(fwd[e[0]], [2]int{e[1], e[2]})
                  rev[e[1]] = append(rev[e[1]], [2]int{e[0], e[2]})
              }
              a, b, c := dijkstra(n, fwd, src1), dijkstra(n, fwd, src2), dijkstra(n, rev, dest)
              best := -1
              for v := 0; v < n; v++ {
                  if a[v] < 0 || b[v] < 0 || c[v] < 0 {
                      continue
                  }
                  s := a[v] + b[v] + c[v]
                  if best < 0 || s < best {
                      best = s
                  }
              }
              return best
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun dijkstra(n: Int, adj: Array<ArrayList<IntArray>>, src: Int): LongArray {
              val dist = LongArray(n) { Long.MAX_VALUE }
              dist[src] = 0L
              val pq = PriorityQueue<Long>()
              pq.add(src.toLong())
              while (pq.isNotEmpty()) {
                  val key = pq.poll()
                  val u = (key % 16384).toInt()
                  val d = key / 16384
                  if (d > dist[u]) continue
                  for (e in adj[u]) {
                      val nd = d + e[1]
                      if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(nd * 16384 + e[0]) }
                  }
              }
              return dist
          }

          fun minimumWeight(n: Int, edges: Array<IntArray>, src1: Int, src2: Int, dest: Int): Int {
              val fwd = Array(n) { ArrayList<IntArray>() }
              val rev = Array(n) { ArrayList<IntArray>() }
              for (e in edges) {
                  fwd[e[0]].add(intArrayOf(e[1], e[2]))
                  rev[e[1]].add(intArrayOf(e[0], e[2]))
              }
              val a = dijkstra(n, fwd, src1)
              val b = dijkstra(n, fwd, src2)
              val c = dijkstra(n, rev, dest)
              var best = Long.MAX_VALUE
              for (v in 0 until n) {
                  if (a[v] == Long.MAX_VALUE || b[v] == Long.MAX_VALUE || c[v] == Long.MAX_VALUE) continue
                  best = minOf(best, a[v] + b[v] + c[v])
              }
              return if (best == Long.MAX_VALUE) -1 else best.toInt()
          }
        `,
        swift: code`
          func hpPush(_ h: inout [Int], _ v: Int) {
              h.append(v)
              var i = h.count - 1
              while i > 0 {
                  let p = (i - 1) / 2
                  if h[p] <= h[i] { break }
                  h.swapAt(p, i)
                  i = p
              }
          }

          func hpPop(_ h: inout [Int]) -> Int {
              let top = h[0]
              let last = h.removeLast()
              if !h.isEmpty {
                  h[0] = last
                  var j = 0
                  while true {
                      let l = 2 * j + 1, r = l + 1
                      var s = j
                      if l < h.count && h[l] < h[s] { s = l }
                      if r < h.count && h[r] < h[s] { s = r }
                      if s == j { break }
                      h.swapAt(s, j)
                      j = s
                  }
              }
              return top
          }

          // Dijkstra over a heap of packed keys dist * 16384 + node (n <= 10^4).
          func dijkstra(_ n: Int, _ adj: [[(Int, Int)]], _ src: Int) -> [Int] {
              var dist = [Int](repeating: -1, count: n)
              var done = [Bool](repeating: false, count: n)
              dist[src] = 0
              var heap = [src]
              while !heap.isEmpty {
                  let key = hpPop(&heap)
                  let u = key % 16384, d = key / 16384
                  if done[u] { continue }
                  done[u] = true
                  for (v, w) in adj[u] {
                      let nd = d + w
                      if !done[v] && (dist[v] < 0 || nd < dist[v]) { dist[v] = nd; hpPush(&heap, nd * 16384 + v) }
                  }
              }
              return dist
          }

          func minimumWeight(_ n: Int, _ edges: [[Int]], _ src1: Int, _ src2: Int, _ dest: Int) -> Int {
              var fwd = [[(Int, Int)]](repeating: [], count: n)
              var rev = [[(Int, Int)]](repeating: [], count: n)
              for e in edges {
                  fwd[e[0]].append((e[1], e[2]))
                  rev[e[1]].append((e[0], e[2]))
              }
              let a = dijkstra(n, fwd, src1), b = dijkstra(n, fwd, src2), c = dijkstra(n, rev, dest)
              var best = -1
              for v in 0..<n where a[v] >= 0 && b[v] >= 0 && c[v] >= 0 {
                  let s = a[v] + b[v] + c[v]
                  if best < 0 || s < best { best = s }
              }
              return best
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn dijkstra(n: usize, adj: &Vec<Vec<(usize, i64)>>, src: usize) -> Vec<i64> {
              let mut dist = vec![std::i64::MAX; n];
              dist[src] = 0;
              let mut pq = BinaryHeap::new();
              pq.push(Reverse((0i64, src)));
              while let Some(Reverse((d, u))) = pq.pop() {
                  if d > dist[u] {
                      continue;
                  }
                  for &(v, w) in adj[u].iter() {
                      if d + w < dist[v] {
                          dist[v] = d + w;
                          pq.push(Reverse((dist[v], v)));
                      }
                  }
              }
              dist
          }

          fn minimumWeight(n: i32, edges: Vec<Vec<i32>>, src1: i32, src2: i32, dest: i32) -> i32 {
              let n = n as usize;
              let mut fwd: Vec<Vec<(usize, i64)>> = vec![Vec::new(); n];
              let mut rev: Vec<Vec<(usize, i64)>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  fwd[e[0] as usize].push((e[1] as usize, e[2] as i64));
                  rev[e[1] as usize].push((e[0] as usize, e[2] as i64));
              }
              let a = dijkstra(n, &fwd, src1 as usize);
              let b = dijkstra(n, &fwd, src2 as usize);
              let c = dijkstra(n, &rev, dest as usize);
              let mut best = std::i64::MAX;
              for v in 0..n {
                  if a[v] == std::i64::MAX || b[v] == std::i64::MAX || c[v] == std::i64::MAX {
                      continue;
                  }
                  best = best.min(a[v] + b[v] + c[v]);
              }
              if best == std::i64::MAX { -1 } else { best as i32 }
          }
        `,
        php: code`
          // Dijkstra over SplMinHeap of packed keys dist * 16384 + node (n <= 10^4).
          function dijkstraFrom($n, $adj, $src) {
              $dist = array_fill(0, $n, -1);
              $done = array_fill(0, $n, false);
              $dist[$src] = 0;
              $heap = new \SplMinHeap();
              $heap->insert($src);
              while (!$heap->isEmpty()) {
                  $key = $heap->extract();
                  $u = $key % 16384;
                  $d = intdiv($key, 16384);
                  if ($done[$u]) continue;
                  $done[$u] = true;
                  foreach ($adj[$u] as [$v, $w]) {
                      $nd = $d + $w;
                      if (!$done[$v] && ($dist[$v] < 0 || $nd < $dist[$v])) { $dist[$v] = $nd; $heap->insert($nd * 16384 + $v); }
                  }
              }
              return $dist;
          }

          function minimumWeight($n, $edges, $src1, $src2, $dest) {
              $fwd = array_fill(0, $n, []);
              $rev = array_fill(0, $n, []);
              foreach ($edges as [$u, $v, $w]) {
                  $fwd[$u][] = [$v, $w];
                  $rev[$v][] = [$u, $w];
              }
              $a = dijkstraFrom($n, $fwd, $src1);
              $b = dijkstraFrom($n, $fwd, $src2);
              $c = dijkstraFrom($n, $rev, $dest);
              $best = -1;
              for ($v = 0; $v < $n; $v++) {
                  if ($a[$v] < 0 || $b[$v] < 0 || $c[$v] < 0) continue;
                  $s = $a[$v] + $b[$v] + $c[$v];
                  if ($best < 0 || $s < $best) $best = $s;
              }
              return $best;
          }
        `,
        ruby: code`
          def hp_push(h, v)
            h << v
            i = h.length - 1
            while i > 0
              par = (i - 1) / 2
              break if h[par] <= h[i]
              h[par], h[i] = h[i], h[par]
              i = par
            end
          end

          def hp_pop(h)
            top = h[0]
            last = h.pop
            unless h.empty?
              h[0] = last
              j = 0
              loop do
                l = 2 * j + 1
                r = l + 1
                s = j
                s = l if l < h.length && h[l] < h[s]
                s = r if r < h.length && h[r] < h[s]
                break if s == j
                h[s], h[j] = h[j], h[s]
                j = s
              end
            end
            top
          end

          # Dijkstra over a heap of packed keys dist * 16384 + node (n <= 10^4).
          def dijkstra_from(n, adj, src)
            dist = Array.new(n, -1)
            done = Array.new(n, false)
            dist[src] = 0
            heap = [src]
            until heap.empty?
              key = hp_pop(heap)
              u = key % 16384
              d = key / 16384
              next if done[u]
              done[u] = true
              adj[u].each do |v, w|
                nd = d + w
                if !done[v] && (dist[v] < 0 || nd < dist[v])
                  dist[v] = nd
                  hp_push(heap, nd * 16384 + v)
                end
              end
            end
            dist
          end

          def minimumWeight(n, edges, src1, src2, dest)
            fwd = Array.new(n) { [] }
            rev = Array.new(n) { [] }
            edges.each do |u, v, w|
              fwd[u] << [v, w]
              rev[v] << [u, w]
            end
            a = dijkstra_from(n, fwd, src1)
            b = dijkstra_from(n, fwd, src2)
            c = dijkstra_from(n, rev, dest)
            best = -1
            n.times do |v|
              next if a[v] < 0 || b[v] < 0 || c[v] < 0
              s = a[v] + b[v] + c[v]
              best = s if best < 0 || s < best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Maximum Score of a Node Sequence (LC 2242) ──────────────────
  (() => {
    const ref = (scores: number[], edges: number[][]) => {
      // Every sequence a-b-c-d of distinct nodes joined by edges, tried directly.
      const n = scores.length;
      const adj = adjOf(n, edges);
      let best = -1;
      for (let a = 0; a < n; a++) for (const b of adj[a]) for (const c of adj[b]) {
        if (c === a) continue;
        for (const d of adj[c]) {
          if (d === a || d === b) continue;
          best = Math.max(best, scores[a] + scores[b] + scores[c] + scores[d]);
        }
      }
      return best;
    };
    return {
      slug: "maximum-score-of-a-node-sequence",
      title: "Maximum Score of a Node Sequence",
      difficulty: "HARD" as const,
      tags: ["Array", "Graph", "Sorting", "Enumeration", "Google", "Amazon"],
      signature: { funcName: "maximumScore", params: [{ name: "scores", type: "int[]" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected graph has `n` nodes numbered `0` to `n - 1`. Node `i` carries the score `scores[i]`, and each `edges[j] = [a, b]` is an undirected edge between `a` and `b`.\n\nA node sequence is **valid** when every pair of adjacent nodes in it is joined by an edge and no node appears twice. Its score is the sum of its nodes' scores.\n\nReturn the **maximum** score of a valid sequence of length **exactly 4**, or `-1` if there is none.",
        [
          { in: "scores = [5,2,9,8,4], edges = [[0,1],[1,2],[2,3],[0,2],[1,3],[2,4]]", out: "24", note: "The sequence [0,1,2,3] scores 5 + 2 + 9 + 8 = 24; no length-4 sequence scores more." },
          { in: "scores = [9,20,6,4,11,12], edges = [[0,3],[5,3],[2,4],[1,3]]", out: "-1", note: "Every edge touches node 3 or is the lone edge 2–4, so no path visits four distinct nodes." },
          { in: "scores = [1,1,1,1], edges = [[0,1],[1,2],[2,3]]", out: "4" },
        ],
        ["n == scores.length", "4 <= n <= 5 * 10^4", "1 <= scores[i] <= 10^8", "0 <= edges.length <= 5 * 10^4", "edges[j].length == 2", "0 <= a, b <= n - 1", "a != b", "there are no duplicate edges"]),
      hints: [
        "A sequence of four nodes is `a – b – c – d`: one middle edge `(b, c)` with one extra neighbour on each side.",
        "Fix the middle edge. The best `a` is a high-scoring neighbour of `b`, and the best `d` a high-scoring neighbour of `c` — but they must avoid `c`, `b` and each other.",
        "Those three exclusions can rule out at most two candidates on a side, so keeping only the **three** highest-scoring neighbours of every node is enough.",
      ],
      editorial: explain({
        idea: "Enumerate the middle edge `(b, c)` of the sequence. The end nodes are then a neighbour of `b` and a neighbour of `c`, chosen as large as possible subject to being distinct from the other three nodes. At most three nodes can be forbidden for each end, so only each node's top three neighbours by score ever matter.",
        steps: [
          "For every node keep its three highest-scoring neighbours.",
          "For each edge `(b, c)`: for each `a` in `top(b)` and each `d` in `top(c)`, skip if `a == c`, `d == b` or `a == d`; otherwise evaluate `scores[a] + scores[b] + scores[c] + scores[d]`.",
          "Return the best value, or `-1` if no combination was valid.",
        ],
        why: "Suppose the optimal sequence uses an end `a` that is not among `b`'s top three neighbours. Of those three, at most two are excluded (`c` and `d`), so one remaining top neighbour scores at least as much as `a` and gives a valid sequence too. The same argument applies to `d`, so restricting both ends to the top three loses nothing.",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "Try both orientations of every edge — each end of the middle edge can play `b`.",
          "Top-two is not enough: `c` and `d` can both be among `b`'s best neighbours.",
          "The sum of four scores reaches `4 · 10^8`, still within a 32-bit integer.",
        ],
      }),
      examples: [
        { input: "[5,2,9,8,4]\n[[0,1],[1,2],[2,3],[0,2],[1,3],[2,4]]", expectedOutput: "24" },
        { input: "[9,20,6,4,11,12]\n[[0,3],[5,3],[2,4],[1,3]]", expectedOutput: "-1" },
        { input: "[1,1,1,1]\n[[0,1],[1,2],[2,3]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 4, pick(rng, [4, 6, 9, 12]));
        const S = pick(rng, [1, 10, 1000, 100000000]);
        const scores = Array.from({ length: n }, () => ri(rng, 1, S));
        const maxM = (n * (n - 1)) / 2;
        const edges = randomSimplePairs(rng, n, rng() < 0.15 ? ri(rng, 0, 4) : ri(rng, n - 1, Math.min(maxM, pick(rng, [n + 2, 2 * n, maxM]))));
        return { input: `${fmtIntArr(scores)}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(scores, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumScore(scores: List[int], edges: List[List[int]]) -> int:
              n = len(scores)
              top = [[] for _ in range(n)]

              def add(u, v):
                  t = top[u]
                  t.append(v)
                  t.sort(key=lambda x: -scores[x])
                  if len(t) > 3:
                      t.pop()

              for a, b in edges:
                  add(a, b)
                  add(b, a)
              best = -1
              for a, b in edges:
                  for x, y in ((a, b), (b, a)):
                      base = scores[x] + scores[y]
                      for p in top[x]:
                          if p == y:
                              continue
                          for q in top[y]:
                              if q == x or q == p:
                                  continue
                              best = max(best, base + scores[p] + scores[q])
              return best
        `,
        javascript: code`
          var maximumScore = function(scores, edges) {
              var n = scores.length;
              var top = new Array(3 * n);
              for (var i = 0; i < 3 * n; i++) top[i] = -1;
              var add = function(u, v) {
                  for (var i = 0; i < 3; i++) {
                      var cur = top[3 * u + i];
                      if (cur === -1 || scores[v] > scores[cur]) {
                          for (var j = 2; j > i; j--) top[3 * u + j] = top[3 * u + j - 1];
                          top[3 * u + i] = v;
                          return;
                      }
                  }
              };
              for (var e = 0; e < edges.length; e++) { add(edges[e][0], edges[e][1]); add(edges[e][1], edges[e][0]); }
              var best = -1;
              for (var e2 = 0; e2 < edges.length; e2++) {
                  for (var side = 0; side < 2; side++) {
                      var x = edges[e2][side], y = edges[e2][1 - side];
                      for (var i2 = 0; i2 < 3; i2++) {
                          var p = top[3 * x + i2];
                          if (p === -1 || p === y) continue;
                          for (var j2 = 0; j2 < 3; j2++) {
                              var q = top[3 * y + j2];
                              if (q === -1 || q === x || q === p) continue;
                              var s = scores[p] + scores[x] + scores[y] + scores[q];
                              if (s > best) best = s;
                          }
                      }
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function maximumScore(scores: number[], edges: number[][]): number {
              var n = scores.length;
              var top: number[] = [];
              for (var i = 0; i < 3 * n; i++) top.push(-1);
              var add = function(u: number, v: number): void {
                  for (var i = 0; i < 3; i++) {
                      var cur = top[3 * u + i];
                      if (cur === -1 || scores[v] > scores[cur]) {
                          for (var j = 2; j > i; j--) top[3 * u + j] = top[3 * u + j - 1];
                          top[3 * u + i] = v;
                          return;
                      }
                  }
              };
              for (var e = 0; e < edges.length; e++) { add(edges[e][0], edges[e][1]); add(edges[e][1], edges[e][0]); }
              var best = -1;
              for (var e2 = 0; e2 < edges.length; e2++) {
                  for (var side = 0; side < 2; side++) {
                      var x = edges[e2][side], y = edges[e2][1 - side];
                      for (var i2 = 0; i2 < 3; i2++) {
                          var p = top[3 * x + i2];
                          if (p === -1 || p === y) continue;
                          for (var j2 = 0; j2 < 3; j2++) {
                              var q = top[3 * y + j2];
                              if (q === -1 || q === x || q === p) continue;
                              var s = scores[p] + scores[x] + scores[y] + scores[q];
                              if (s > best) best = s;
                          }
                      }
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int maximumScore(int[] scores, int[][] edges) {
              int n = scores.length;
              int[][] top = new int[n][3];
              for (int[] t : top) Arrays.fill(t, -1);
              for (int[] e : edges) {
                  for (int side = 0; side < 2; side++) {
                      int u = e[side], v = e[1 - side];
                      for (int i = 0; i < 3; i++) {
                          if (top[u][i] == -1 || scores[v] > scores[top[u][i]]) {
                              for (int j = 2; j > i; j--) top[u][j] = top[u][j - 1];
                              top[u][i] = v;
                              break;
                          }
                      }
                  }
              }
              int best = -1;
              for (int[] e : edges) {
                  for (int side = 0; side < 2; side++) {
                      int x = e[side], y = e[1 - side];
                      for (int p : top[x]) {
                          if (p == -1 || p == y) continue;
                          for (int q : top[y]) {
                              if (q == -1 || q == x || q == p) continue;
                              best = Math.max(best, scores[p] + scores[x] + scores[y] + scores[q]);
                          }
                      }
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int maximumScore(vector<int>& scores, vector<vector<int>>& edges) {
              int n = scores.size();
              vector<array<int, 3>> top(n, {-1, -1, -1});
              for (auto& e : edges) {
                  for (int side = 0; side < 2; side++) {
                      int u = e[side], v = e[1 - side];
                      for (int i = 0; i < 3; i++) {
                          if (top[u][i] == -1 || scores[v] > scores[top[u][i]]) {
                              for (int j = 2; j > i; j--) top[u][j] = top[u][j - 1];
                              top[u][i] = v;
                              break;
                          }
                      }
                  }
              }
              int best = -1;
              for (auto& e : edges) {
                  for (int side = 0; side < 2; side++) {
                      int x = e[side], y = e[1 - side];
                      for (int p : top[x]) {
                          if (p == -1 || p == y) continue;
                          for (int q : top[y]) {
                              if (q == -1 || q == x || q == p) continue;
                              best = max(best, scores[p] + scores[x] + scores[y] + scores[q]);
                          }
                      }
                  }
              }
              return best;
          }
        `,
        c: code`
          int maximumScore(int* scores, int scoresSize, int** edges, int edgesSize, int* edgesColSize) {
              int n = scoresSize;
              int* top = (int*) malloc((size_t) 3 * n * sizeof(int));
              for (int i = 0; i < 3 * n; i++) top[i] = -1;
              for (int e = 0; e < edgesSize; e++) {
                  for (int side = 0; side < 2; side++) {
                      int u = edges[e][side], v = edges[e][1 - side];
                      for (int i = 0; i < 3; i++) {
                          int cur = top[3 * u + i];
                          if (cur == -1 || scores[v] > scores[cur]) {
                              for (int j = 2; j > i; j--) top[3 * u + j] = top[3 * u + j - 1];
                              top[3 * u + i] = v;
                              break;
                          }
                      }
                  }
              }
              int best = -1;
              for (int e = 0; e < edgesSize; e++) {
                  for (int side = 0; side < 2; side++) {
                      int x = edges[e][side], y = edges[e][1 - side];
                      for (int i = 0; i < 3; i++) {
                          int p = top[3 * x + i];
                          if (p == -1 || p == y) continue;
                          for (int j = 0; j < 3; j++) {
                              int q = top[3 * y + j];
                              if (q == -1 || q == x || q == p) continue;
                              int s = scores[p] + scores[x] + scores[y] + scores[q];
                              if (s > best) best = s;
                          }
                      }
                  }
              }
              free(top);
              return best;
          }
        `,
        csharp: code`
          public static int MaximumScore(int[] scores, int[][] edges)
          {
              int n = scores.Length;
              var top = new int[n, 3];
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < 3; j++) top[i, j] = -1;
              foreach (var e in edges)
              {
                  for (int side = 0; side < 2; side++)
                  {
                      int u = e[side], v = e[1 - side];
                      for (int i = 0; i < 3; i++)
                      {
                          if (top[u, i] == -1 || scores[v] > scores[top[u, i]])
                          {
                              for (int j = 2; j > i; j--) top[u, j] = top[u, j - 1];
                              top[u, i] = v;
                              break;
                          }
                      }
                  }
              }
              int best = -1;
              foreach (var e in edges)
              {
                  for (int side = 0; side < 2; side++)
                  {
                      int x = e[side], y = e[1 - side];
                      for (int i = 0; i < 3; i++)
                      {
                          int p = top[x, i];
                          if (p == -1 || p == y) continue;
                          for (int j = 0; j < 3; j++)
                          {
                              int q = top[y, j];
                              if (q == -1 || q == x || q == p) continue;
                              best = Math.Max(best, scores[p] + scores[x] + scores[y] + scores[q]);
                          }
                      }
                  }
              }
              return best;
          }
        `,
        go: code`
          func maximumScore(scores []int, edges [][]int) int {
              n := len(scores)
              top := make([][3]int, n)
              for i := range top {
                  top[i] = [3]int{-1, -1, -1}
              }
              for _, e := range edges {
                  for side := 0; side < 2; side++ {
                      u, v := e[side], e[1-side]
                      for i := 0; i < 3; i++ {
                          if top[u][i] == -1 || scores[v] > scores[top[u][i]] {
                              for j := 2; j > i; j-- {
                                  top[u][j] = top[u][j-1]
                              }
                              top[u][i] = v
                              break
                          }
                      }
                  }
              }
              best := -1
              for _, e := range edges {
                  for side := 0; side < 2; side++ {
                      x, y := e[side], e[1-side]
                      for _, p := range top[x] {
                          if p == -1 || p == y {
                              continue
                          }
                          for _, q := range top[y] {
                              if q == -1 || q == x || q == p {
                                  continue
                              }
                              if s := scores[p] + scores[x] + scores[y] + scores[q]; s > best {
                                  best = s
                              }
                          }
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maximumScore(scores: IntArray, edges: Array<IntArray>): Int {
              val n = scores.size
              val top = Array(n) { IntArray(3) { -1 } }
              for (e in edges) {
                  for (side in 0..1) {
                      val u = e[side]
                      val v = e[1 - side]
                      for (i in 0 until 3) {
                          if (top[u][i] == -1 || scores[v] > scores[top[u][i]]) {
                              for (j in 2 downTo i + 1) top[u][j] = top[u][j - 1]
                              top[u][i] = v
                              break
                          }
                      }
                  }
              }
              var best = -1
              for (e in edges) {
                  for (side in 0..1) {
                      val x = e[side]
                      val y = e[1 - side]
                      for (p in top[x]) {
                          if (p == -1 || p == y) continue
                          for (q in top[y]) {
                              if (q == -1 || q == x || q == p) continue
                              best = maxOf(best, scores[p] + scores[x] + scores[y] + scores[q])
                          }
                      }
                  }
              }
              return best
          }
        `,
        swift: code`
          func maximumScore(_ scores: [Int], _ edges: [[Int]]) -> Int {
              let n = scores.count
              var top = [[Int]](repeating: [-1, -1, -1], count: n)
              for e in edges {
                  for side in 0..<2 {
                      let u = e[side], v = e[1 - side]
                      for i in 0..<3 {
                          if top[u][i] == -1 || scores[v] > scores[top[u][i]] {
                              var j = 2
                              while j > i { top[u][j] = top[u][j - 1]; j -= 1 }
                              top[u][i] = v
                              break
                          }
                      }
                  }
              }
              var best = -1
              for e in edges {
                  for side in 0..<2 {
                      let x = e[side], y = e[1 - side]
                      for p in top[x] where p != -1 && p != y {
                          for q in top[y] where q != -1 && q != x && q != p {
                              best = max(best, scores[p] + scores[x] + scores[y] + scores[q])
                          }
                      }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn maximumScore(scores: Vec<i32>, edges: Vec<Vec<i32>>) -> i32 {
              let n = scores.len();
              let mut top = vec![[-1i32; 3]; n];
              for e in edges.iter() {
                  for side in 0..2 {
                      let u = e[side] as usize;
                      let v = e[1 - side];
                      for i in 0..3 {
                          let cur = top[u][i];
                          if cur == -1 || scores[v as usize] > scores[cur as usize] {
                              let mut j = 2;
                              while j > i {
                                  top[u][j] = top[u][j - 1];
                                  j -= 1;
                              }
                              top[u][i] = v;
                              break;
                          }
                      }
                  }
              }
              let mut best = -1;
              for e in edges.iter() {
                  for side in 0..2 {
                      let (x, y) = (e[side], e[1 - side]);
                      for &p in top[x as usize].iter() {
                          if p == -1 || p == y {
                              continue;
                          }
                          for &q in top[y as usize].iter() {
                              if q == -1 || q == x || q == p {
                                  continue;
                              }
                              let s = scores[p as usize] + scores[x as usize] + scores[y as usize] + scores[q as usize];
                              if s > best {
                                  best = s;
                              }
                          }
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function maximumScore($scores, $edges) {
              $n = count($scores);
              $top = array_fill(0, $n, [-1, -1, -1]);
              foreach ($edges as $e) {
                  for ($side = 0; $side < 2; $side++) {
                      $u = $e[$side];
                      $v = $e[1 - $side];
                      for ($i = 0; $i < 3; $i++) {
                          $cur = $top[$u][$i];
                          if ($cur == -1 || $scores[$v] > $scores[$cur]) {
                              for ($j = 2; $j > $i; $j--) $top[$u][$j] = $top[$u][$j - 1];
                              $top[$u][$i] = $v;
                              break;
                          }
                      }
                  }
              }
              $best = -1;
              foreach ($edges as $e) {
                  for ($side = 0; $side < 2; $side++) {
                      $x = $e[$side];
                      $y = $e[1 - $side];
                      foreach ($top[$x] as $p) {
                          if ($p == -1 || $p == $y) continue;
                          foreach ($top[$y] as $q) {
                              if ($q == -1 || $q == $x || $q == $p) continue;
                              $best = max($best, $scores[$p] + $scores[$x] + $scores[$y] + $scores[$q]);
                          }
                      }
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumScore(scores, edges)
            n = scores.length
            top = Array.new(n) { [-1, -1, -1] }
            edges.each do |e|
              [[e[0], e[1]], [e[1], e[0]]].each do |u, v|
                t = top[u]
                3.times do |i|
                  if t[i] == -1 || scores[v] > scores[t[i]]
                    j = 2
                    while j > i
                      t[j] = t[j - 1]
                      j -= 1
                    end
                    t[i] = v
                    break
                  end
                end
              end
            end
            best = -1
            edges.each do |e|
              [[e[0], e[1]], [e[1], e[0]]].each do |x, y|
                top[x].each do |p|
                  next if p == -1 || p == y
                  top[y].each do |q|
                    next if q == -1 || q == x || q == p
                    s = scores[p] + scores[x] + scores[y] + scores[q]
                    best = s if s > best
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

  // ── Minimum Score After Removals on a Tree (LC 2322) ────────────
  (() => {
    const ref = (nums: number[], edges: number[][]) => {
      // Remove every pair of edges and XOR the three components directly.
      const n = nums.length;
      let best = Infinity;
      for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
        const keep = edges.map((_, k) => k !== i && k !== j);
        const lab = componentsOf(n, edges, keep);
        const x = new Map<number, number>();
        for (let v = 0; v < n; v++) x.set(lab[v], (x.get(lab[v]) ?? 0) ^ nums[v]);
        const vals = [...x.values()];
        best = Math.min(best, Math.max(...vals) - Math.min(...vals));
      }
      return best;
    };
    return {
      slug: "minimum-score-after-removals-on-a-tree",
      title: "Minimum Score After Removals on a Tree",
      difficulty: "HARD" as const,
      tags: ["Array", "Bit Manipulation", "Tree", "Depth-First Search", "Google", "Amazon"],
      signature: { funcName: "minimumScore", params: [{ name: "nums", type: "int[]" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected tree has `n` nodes numbered `0` to `n - 1`; node `i` holds the value `nums[i]` and `edges` lists its `n - 1` edges.\n\nRemove **two distinct** edges. The tree falls apart into exactly three connected components. Compute the XOR of all values in each component; the **score** of the removal is the largest of the three XORs minus the smallest.\n\nReturn the **minimum** score over every choice of two edges.",
        [
          { in: "nums = [1,5,5,4,11], edges = [[0,1],[1,2],[1,3],[3,4]]", out: "9", note: "Removing [0,1] and [1,2] leaves {1,3,4} (5 ^ 4 ^ 11 = 10), {0} (1) and {2} (5): the score is 10 - 1 = 9, and no other pair does better." },
          { in: "nums = [5,5,2,4,4,2], edges = [[0,1],[1,2],[5,2],[4,3],[1,3]]", out: "0", note: "Removing [1,2] and [1,3] leaves {0,1}, {2,5} and {3,4}, each with XOR 0." },
          { in: "nums = [7,7,7], edges = [[0,1],[1,2]]", out: "0", note: "The only choice removes both edges, leaving three components of XOR 7." },
        ],
        ["n == nums.length", "3 <= n <= 1000", "1 <= nums[i] <= 10^8", "edges.length == n - 1", "edges[i].length == 2", "0 <= a, b < n", "a != b", "edges represents a valid tree"]),
      hints: [
        "Root the tree. Removing an edge cuts off the subtree below it, so each removed edge is identified by its lower endpoint `v`, and the cut-off part has XOR `sub[v]` — the subtree XOR.",
        "For two lower endpoints `u` and `v`, the three components depend on whether one subtree contains the other. If `u` is an ancestor of `v`: `sub[v]`, `sub[u] ^ sub[v]`, `total ^ sub[u]`. If neither contains the other: `sub[u]`, `sub[v]`, `total ^ sub[u] ^ sub[v]`.",
        "Record entry times and subtree sizes in one DFS; `u` is an ancestor of `v` exactly when `tin[u] <= tin[v] < tin[u] + size[u]`. Then try all `O(n²)` pairs.",
      ],
      editorial: explain({
        idea: "Root the tree at node 0. Each removable edge is named by its child endpoint, and the XOR of everything below that child is precomputed. Two cuts produce three components whose XORs follow from the subtree XORs once you know whether one cut lies inside the other's subtree — which entry times answer in `O(1)`.",
        steps: [
          "DFS from node 0 (iteratively) to get a preorder, each node's parent, entry time `tin` and subtree `size`.",
          "In reverse preorder accumulate `sub[v] = nums[v] ^ XOR of sub[child]`; `total = sub[0]`.",
          "For every pair of non-root nodes `u < v`: if `u` is an ancestor of `v`, the parts are `sub[v]`, `sub[u] ^ sub[v]`, `total ^ sub[u]`; if `v` is an ancestor of `u`, swap roles; otherwise the parts are `sub[u]`, `sub[v]`, `total ^ sub[u] ^ sub[v]`.",
          "Track the minimum of `max(parts) - min(parts)`.",
        ],
        why: "XOR is its own inverse, so the XOR of a subtree with a nested subtree removed is `sub[u] ^ sub[v]`, and the rest of the tree is `total ^ (what was cut off)`. The three cases cover every relative position of two distinct edges in a rooted tree, so every removal pair is scored exactly.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Nested cuts and disjoint cuts give different formulas — using the disjoint formula for nested ones double-counts the inner subtree.",
          "The root has no parent edge, so it never names a cut.",
          "A recursive DFS on a 1,000-node path is fine in most languages, but Python's default recursion limit is close; an explicit stack avoids the question.",
        ],
      }),
      examples: [
        { input: "[1,5,5,4,11]\n[[0,1],[1,2],[1,3],[3,4]]", expectedOutput: "9" },
        { input: "[5,5,2,4,4,2]\n[[0,1],[1,2],[5,2],[4,3],[1,3]]", expectedOutput: "0" },
        { input: "[7,7,7]\n[[0,1],[1,2]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, pick(rng, [4, 7, 10, 13]));
        const V = pick(rng, [1, 7, 100, 100000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, V));
        const edges = randomTreeEdges(rng, n, 0);
        return { input: `${fmtIntArr(nums)}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(nums, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumScore(nums: List[int], edges: List[List[int]]) -> int:
              n = len(nums)
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-1] * n
              tin = [0] * n
              order = []
              seen = [False] * n
              seen[0] = True
              stack = [0]
              while stack:
                  u = stack.pop()
                  tin[u] = len(order)
                  order.append(u)
                  for v in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          stack.append(v)
              sub = nums[:]
              size = [1] * n
              for u in reversed(order):
                  p = parent[u]
                  if p >= 0:
                      sub[p] ^= sub[u]
                      size[p] += size[u]
              total = sub[0]

              def inside(u, v):  # is v in the subtree of u?
                  return tin[u] <= tin[v] < tin[u] + size[u]

              best = float("inf")
              for u in range(1, n):
                  for v in range(u + 1, n):
                      if inside(u, v):
                          a, b, c = sub[v], sub[u] ^ sub[v], total ^ sub[u]
                      elif inside(v, u):
                          a, b, c = sub[u], sub[v] ^ sub[u], total ^ sub[v]
                      else:
                          a, b, c = sub[u], sub[v], total ^ sub[u] ^ sub[v]
                      best = min(best, max(a, b, c) - min(a, b, c))
              return best
        `,
        javascript: code`
          var minimumScore = function(nums, edges) {
              var n = nums.length;
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].push(edges[e][1]); adj[edges[e][1]].push(edges[e][0]); }
              var parent = [], tin = [], seen = [], sub = [], size = [];
              for (var i2 = 0; i2 < n; i2++) { parent.push(-1); tin.push(0); seen.push(false); sub.push(nums[i2]); size.push(1); }
              var order = [], stack = [0];
              seen[0] = true;
              while (stack.length > 0) {
                  var u = stack.pop();
                  tin[u] = order.length;
                  order.push(u);
                  for (var k = 0; k < adj[u].length; k++) {
                      var v = adj[u][k];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; stack.push(v); }
                  }
              }
              for (var t = n - 1; t >= 0; t--) {
                  var x = order[t], p = parent[x];
                  if (p >= 0) { sub[p] ^= sub[x]; size[p] += size[x]; }
              }
              var total = sub[0];
              var inside = function(a, b) { return tin[a] <= tin[b] && tin[b] < tin[a] + size[a]; };
              var best = Infinity;
              for (var a = 1; a < n; a++) {
                  for (var b = a + 1; b < n; b++) {
                      var p1, p2, p3;
                      if (inside(a, b)) { p1 = sub[b]; p2 = sub[a] ^ sub[b]; p3 = total ^ sub[a]; }
                      else if (inside(b, a)) { p1 = sub[a]; p2 = sub[b] ^ sub[a]; p3 = total ^ sub[b]; }
                      else { p1 = sub[a]; p2 = sub[b]; p3 = total ^ sub[a] ^ sub[b]; }
                      var s = Math.max(p1, p2, p3) - Math.min(p1, p2, p3);
                      if (s < best) best = s;
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function minimumScore(nums: number[], edges: number[][]): number {
              var n = nums.length;
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].push(edges[e][1]); adj[edges[e][1]].push(edges[e][0]); }
              var parent: number[] = [], tin: number[] = [], seen: boolean[] = [], sub: number[] = [], size: number[] = [];
              for (var i2 = 0; i2 < n; i2++) { parent.push(-1); tin.push(0); seen.push(false); sub.push(nums[i2]); size.push(1); }
              var order: number[] = [], stack: number[] = [0];
              seen[0] = true;
              while (stack.length > 0) {
                  var u = stack.pop() as number;
                  tin[u] = order.length;
                  order.push(u);
                  for (var k = 0; k < adj[u].length; k++) {
                      var v = adj[u][k];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; stack.push(v); }
                  }
              }
              for (var t = n - 1; t >= 0; t--) {
                  var x = order[t], p = parent[x];
                  if (p >= 0) { sub[p] ^= sub[x]; size[p] += size[x]; }
              }
              var total = sub[0];
              var inside = function(a: number, b: number): boolean { return tin[a] <= tin[b] && tin[b] < tin[a] + size[a]; };
              var best = Infinity;
              for (var a = 1; a < n; a++) {
                  for (var b = a + 1; b < n; b++) {
                      var p1: number, p2: number, p3: number;
                      if (inside(a, b)) { p1 = sub[b]; p2 = sub[a] ^ sub[b]; p3 = total ^ sub[a]; }
                      else if (inside(b, a)) { p1 = sub[a]; p2 = sub[b] ^ sub[a]; p3 = total ^ sub[b]; }
                      else { p1 = sub[a]; p2 = sub[b]; p3 = total ^ sub[a] ^ sub[b]; }
                      var s = Math.max(p1, p2, p3) - Math.min(p1, p2, p3);
                      if (s < best) best = s;
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int minimumScore(int[] nums, int[][] edges) {
              int n = nums.length;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], tin = new int[n], sub = nums.clone(), size = new int[n], order = new int[n];
              boolean[] seen = new boolean[n];
              Arrays.fill(parent, -1);
              Arrays.fill(size, 1);
              int[] stack = new int[n];
              int sp = 0, cnt = 0;
              stack[sp++] = 0;
              seen[0] = true;
              while (sp > 0) {
                  int u = stack[--sp];
                  tin[u] = cnt;
                  order[cnt++] = u;
                  for (int v : adj.get(u)) if (!seen[v]) { seen[v] = true; parent[v] = u; stack[sp++] = v; }
              }
              for (int t = n - 1; t >= 0; t--) {
                  int x = order[t], p = parent[x];
                  if (p >= 0) { sub[p] ^= sub[x]; size[p] += size[x]; }
              }
              int total = sub[0], best = Integer.MAX_VALUE;
              for (int a = 1; a < n; a++) {
                  for (int b = a + 1; b < n; b++) {
                      int p1, p2, p3;
                      if (tin[a] <= tin[b] && tin[b] < tin[a] + size[a]) { p1 = sub[b]; p2 = sub[a] ^ sub[b]; p3 = total ^ sub[a]; }
                      else if (tin[b] <= tin[a] && tin[a] < tin[b] + size[b]) { p1 = sub[a]; p2 = sub[b] ^ sub[a]; p3 = total ^ sub[b]; }
                      else { p1 = sub[a]; p2 = sub[b]; p3 = total ^ sub[a] ^ sub[b]; }
                      best = Math.min(best, Math.max(p1, Math.max(p2, p3)) - Math.min(p1, Math.min(p2, p3)));
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int minimumScore(vector<int>& nums, vector<vector<int>>& edges) {
              int n = nums.size();
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -1), tin(n), sub(nums), sz(n, 1), order;
              vector<bool> seen(n, false);
              vector<int> st = {0};
              seen[0] = true;
              while (!st.empty()) {
                  int u = st.back();
                  st.pop_back();
                  tin[u] = order.size();
                  order.push_back(u);
                  for (int v : adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; st.push_back(v); }
              }
              for (int t = n - 1; t >= 0; t--) {
                  int x = order[t], p = parent[x];
                  if (p >= 0) { sub[p] ^= sub[x]; sz[p] += sz[x]; }
              }
              int total = sub[0], best = INT_MAX;
              auto inside = [&](int a, int b) { return tin[a] <= tin[b] && tin[b] < tin[a] + sz[a]; };
              for (int a = 1; a < n; a++) {
                  for (int b = a + 1; b < n; b++) {
                      int p1, p2, p3;
                      if (inside(a, b)) { p1 = sub[b]; p2 = sub[a] ^ sub[b]; p3 = total ^ sub[a]; }
                      else if (inside(b, a)) { p1 = sub[a]; p2 = sub[b] ^ sub[a]; p3 = total ^ sub[b]; }
                      else { p1 = sub[a]; p2 = sub[b]; p3 = total ^ sub[a] ^ sub[b]; }
                      best = min(best, max({p1, p2, p3}) - min({p1, p2, p3}));
                  }
              }
              return best;
          }
        `,
        c: code`
          int minimumScore(int* nums, int numsSize, int** edges, int edgesSize, int* edgesColSize) {
              int n = numsSize;
              int* head = (int*) malloc((size_t) n * sizeof(int));
              int* nxt = (int*) malloc((size_t) 2 * n * sizeof(int));
              int* to = (int*) malloc((size_t) 2 * n * sizeof(int));
              int ec = 0;
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < edgesSize; e++) {
                  int a = edges[e][0], b = edges[e][1];
                  to[ec] = b; nxt[ec] = head[a]; head[a] = ec++;
                  to[ec] = a; nxt[ec] = head[b]; head[b] = ec++;
              }
              int* parent = (int*) malloc((size_t) n * sizeof(int));
              int* tin = (int*) malloc((size_t) n * sizeof(int));
              int* sub = (int*) malloc((size_t) n * sizeof(int));
              int* size = (int*) malloc((size_t) n * sizeof(int));
              int* order = (int*) malloc((size_t) n * sizeof(int));
              int* stack = (int*) malloc((size_t) n * sizeof(int));
              char* seen = (char*) calloc((size_t) n, 1);
              for (int i = 0; i < n; i++) { parent[i] = -1; sub[i] = nums[i]; size[i] = 1; }
              int sp = 0, cnt = 0;
              stack[sp++] = 0;
              seen[0] = 1;
              while (sp > 0) {
                  int u = stack[--sp];
                  tin[u] = cnt;
                  order[cnt++] = u;
                  for (int e = head[u]; e != -1; e = nxt[e]) {
                      int v = to[e];
                      if (!seen[v]) { seen[v] = 1; parent[v] = u; stack[sp++] = v; }
                  }
              }
              for (int t = n - 1; t >= 0; t--) {
                  int x = order[t], p = parent[x];
                  if (p >= 0) { sub[p] ^= sub[x]; size[p] += size[x]; }
              }
              int total = sub[0], best = 2147483647;
              for (int a = 1; a < n; a++) {
                  for (int b = a + 1; b < n; b++) {
                      int p1, p2, p3;
                      if (tin[a] <= tin[b] && tin[b] < tin[a] + size[a]) { p1 = sub[b]; p2 = sub[a] ^ sub[b]; p3 = total ^ sub[a]; }
                      else if (tin[b] <= tin[a] && tin[a] < tin[b] + size[b]) { p1 = sub[a]; p2 = sub[b] ^ sub[a]; p3 = total ^ sub[b]; }
                      else { p1 = sub[a]; p2 = sub[b]; p3 = total ^ sub[a] ^ sub[b]; }
                      int hi = p1, lo = p1;
                      if (p2 > hi) hi = p2;
                      if (p3 > hi) hi = p3;
                      if (p2 < lo) lo = p2;
                      if (p3 < lo) lo = p3;
                      if (hi - lo < best) best = hi - lo;
                  }
              }
              free(head); free(nxt); free(to); free(parent); free(tin); free(sub); free(size); free(order); free(stack); free(seen);
              return best;
          }
        `,
        csharp: code`
          public static int MinimumScore(int[] nums, int[][] edges)
          {
              int n = nums.Length;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var parent = new int[n];
              var tin = new int[n];
              var sub = (int[]) nums.Clone();
              var size = new int[n];
              var order = new int[n];
              var seen = new bool[n];
              for (int i = 0; i < n; i++) { parent[i] = -1; size[i] = 1; }
              var stack = new Stack<int>();
              stack.Push(0);
              seen[0] = true;
              int cnt = 0;
              while (stack.Count > 0)
              {
                  int u = stack.Pop();
                  tin[u] = cnt;
                  order[cnt++] = u;
                  foreach (int v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; stack.Push(v); }
              }
              for (int t = n - 1; t >= 0; t--)
              {
                  int x = order[t], p = parent[x];
                  if (p >= 0) { sub[p] ^= sub[x]; size[p] += size[x]; }
              }
              int total = sub[0], best = int.MaxValue;
              for (int a = 1; a < n; a++)
              {
                  for (int b = a + 1; b < n; b++)
                  {
                      int p1, p2, p3;
                      if (tin[a] <= tin[b] && tin[b] < tin[a] + size[a]) { p1 = sub[b]; p2 = sub[a] ^ sub[b]; p3 = total ^ sub[a]; }
                      else if (tin[b] <= tin[a] && tin[a] < tin[b] + size[b]) { p1 = sub[a]; p2 = sub[b] ^ sub[a]; p3 = total ^ sub[b]; }
                      else { p1 = sub[a]; p2 = sub[b]; p3 = total ^ sub[a] ^ sub[b]; }
                      best = Math.Min(best, Math.Max(p1, Math.Max(p2, p3)) - Math.Min(p1, Math.Min(p2, p3)));
                  }
              }
              return best;
          }
        `,
        go: code`
          func minimumScore(nums []int, edges [][]int) int {
              n := len(nums)
              adj := make([][]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], e[1])
                  adj[e[1]] = append(adj[e[1]], e[0])
              }
              parent := make([]int, n)
              tin := make([]int, n)
              sub := make([]int, n)
              size := make([]int, n)
              seen := make([]bool, n)
              for i := 0; i < n; i++ {
                  parent[i] = -1
                  sub[i] = nums[i]
                  size[i] = 1
              }
              order := []int{}
              stack := []int{0}
              seen[0] = true
              for len(stack) > 0 {
                  u := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  tin[u] = len(order)
                  order = append(order, u)
                  for _, v := range adj[u] {
                      if !seen[v] {
                          seen[v] = true
                          parent[v] = u
                          stack = append(stack, v)
                      }
                  }
              }
              for t := n - 1; t >= 0; t-- {
                  x := order[t]
                  if p := parent[x]; p >= 0 {
                      sub[p] ^= sub[x]
                      size[p] += size[x]
                  }
              }
              total := sub[0]
              inside := func(a, b int) bool { return tin[a] <= tin[b] && tin[b] < tin[a]+size[a] }
              best := 1 << 62
              for a := 1; a < n; a++ {
                  for b := a + 1; b < n; b++ {
                      var p1, p2, p3 int
                      if inside(a, b) {
                          p1, p2, p3 = sub[b], sub[a]^sub[b], total^sub[a]
                      } else if inside(b, a) {
                          p1, p2, p3 = sub[a], sub[b]^sub[a], total^sub[b]
                      } else {
                          p1, p2, p3 = sub[a], sub[b], total^sub[a]^sub[b]
                      }
                      hi, lo := p1, p1
                      for _, q := range []int{p2, p3} {
                          if q > hi {
                              hi = q
                          }
                          if q < lo {
                              lo = q
                          }
                      }
                      if hi-lo < best {
                          best = hi - lo
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minimumScore(nums: IntArray, edges: Array<IntArray>): Int {
              val n = nums.size
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -1 }
              val tin = IntArray(n)
              val sub = nums.copyOf()
              val size = IntArray(n) { 1 }
              val order = IntArray(n)
              val seen = BooleanArray(n)
              val stack = IntArray(n)
              var sp = 0
              var cnt = 0
              stack[sp++] = 0
              seen[0] = true
              while (sp > 0) {
                  val u = stack[--sp]
                  tin[u] = cnt
                  order[cnt++] = u
                  for (v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; stack[sp++] = v }
              }
              for (t in n - 1 downTo 0) {
                  val x = order[t]
                  val p = parent[x]
                  if (p >= 0) { sub[p] = sub[p] xor sub[x]; size[p] += size[x] }
              }
              val total = sub[0]
              fun inside(a: Int, b: Int) = tin[a] <= tin[b] && tin[b] < tin[a] + size[a]
              var best = Int.MAX_VALUE
              for (a in 1 until n) {
                  for (b in a + 1 until n) {
                      val p = when {
                          inside(a, b) -> intArrayOf(sub[b], sub[a] xor sub[b], total xor sub[a])
                          inside(b, a) -> intArrayOf(sub[a], sub[b] xor sub[a], total xor sub[b])
                          else -> intArrayOf(sub[a], sub[b], total xor sub[a] xor sub[b])
                      }
                      best = minOf(best, maxOf(p[0], maxOf(p[1], p[2])) - minOf(p[0], minOf(p[1], p[2])))
                  }
              }
              return best
          }
        `,
        swift: code`
          func minimumScore(_ nums: [Int], _ edges: [[Int]]) -> Int {
              let n = nums.count
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -1, count: n)
              var tin = [Int](repeating: 0, count: n)
              var sub = nums
              var size = [Int](repeating: 1, count: n)
              var seen = [Bool](repeating: false, count: n)
              var order = [Int]()
              var stack = [0]
              seen[0] = true
              while let u = stack.popLast() {
                  tin[u] = order.count
                  order.append(u)
                  for v in adj[u] where !seen[v] {
                      seen[v] = true
                      parent[v] = u
                      stack.append(v)
                  }
              }
              for x in order.reversed() {
                  let p = parent[x]
                  if p >= 0 { sub[p] ^= sub[x]; size[p] += size[x] }
              }
              let total = sub[0]
              func inside(_ a: Int, _ b: Int) -> Bool { return tin[a] <= tin[b] && tin[b] < tin[a] + size[a] }
              var best = Int.max
              for a in 1..<n {
                  for b in (a + 1)..<n {
                      let parts: [Int]
                      if inside(a, b) { parts = [sub[b], sub[a] ^ sub[b], total ^ sub[a]] }
                      else if inside(b, a) { parts = [sub[a], sub[b] ^ sub[a], total ^ sub[b]] }
                      else { parts = [sub[a], sub[b], total ^ sub[a] ^ sub[b]] }
                      best = min(best, parts.max()! - parts.min()!)
                  }
              }
              return best
          }
        `,
        rust: code`
          fn minimumScore(nums: Vec<i32>, edges: Vec<Vec<i32>>) -> i32 {
              let n = nums.len();
              let mut adj = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut parent = vec![std::usize::MAX; n];
              let mut tin = vec![0usize; n];
              let mut sub = nums.clone();
              let mut size = vec![1usize; n];
              let mut seen = vec![false; n];
              let mut order: Vec<usize> = Vec::with_capacity(n);
              let mut stack = vec![0usize];
              seen[0] = true;
              while let Some(u) = stack.pop() {
                  tin[u] = order.len();
                  order.push(u);
                  for &v in adj[u].iter() {
                      if !seen[v] {
                          seen[v] = true;
                          parent[v] = u;
                          stack.push(v);
                      }
                  }
              }
              for &x in order.iter().rev() {
                  let p = parent[x];
                  if p != std::usize::MAX {
                      sub[p] ^= sub[x];
                      size[p] += size[x];
                  }
              }
              let total = sub[0];
              let inside = |a: usize, b: usize| tin[a] <= tin[b] && tin[b] < tin[a] + size[a];
              let mut best = std::i32::MAX;
              for a in 1..n {
                  for b in (a + 1)..n {
                      let (p1, p2, p3) = if inside(a, b) {
                          (sub[b], sub[a] ^ sub[b], total ^ sub[a])
                      } else if inside(b, a) {
                          (sub[a], sub[b] ^ sub[a], total ^ sub[b])
                      } else {
                          (sub[a], sub[b], total ^ sub[a] ^ sub[b])
                      };
                      let hi = p1.max(p2).max(p3);
                      let lo = p1.min(p2).min(p3);
                      best = best.min(hi - lo);
                  }
              }
              best
          }
        `,
        php: code`
          function minimumScore($nums, $edges) {
              $n = count($nums);
              $adj = array_fill(0, $n, []);
              foreach ($edges as [$a, $b]) { $adj[$a][] = $b; $adj[$b][] = $a; }
              $parent = array_fill(0, $n, -1);
              $tin = array_fill(0, $n, 0);
              $sub = $nums;
              $size = array_fill(0, $n, 1);
              $seen = array_fill(0, $n, false);
              $order = [];
              $stack = [0];
              $seen[0] = true;
              while ($stack) {
                  $u = array_pop($stack);
                  $tin[$u] = count($order);
                  $order[] = $u;
                  foreach ($adj[$u] as $v) {
                      if (!$seen[$v]) { $seen[$v] = true; $parent[$v] = $u; $stack[] = $v; }
                  }
              }
              for ($t = $n - 1; $t >= 0; $t--) {
                  $x = $order[$t];
                  $p = $parent[$x];
                  if ($p >= 0) { $sub[$p] ^= $sub[$x]; $size[$p] += $size[$x]; }
              }
              $total = $sub[0];
              $best = PHP_INT_MAX;
              for ($a = 1; $a < $n; $a++) {
                  for ($b = $a + 1; $b < $n; $b++) {
                      if ($tin[$a] <= $tin[$b] && $tin[$b] < $tin[$a] + $size[$a]) $parts = [$sub[$b], $sub[$a] ^ $sub[$b], $total ^ $sub[$a]];
                      elseif ($tin[$b] <= $tin[$a] && $tin[$a] < $tin[$b] + $size[$b]) $parts = [$sub[$a], $sub[$b] ^ $sub[$a], $total ^ $sub[$b]];
                      else $parts = [$sub[$a], $sub[$b], $total ^ $sub[$a] ^ $sub[$b]];
                      $best = min($best, max($parts) - min($parts));
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def minimumScore(nums, edges)
            n = nums.length
            adj = Array.new(n) { [] }
            edges.each { |a, b| adj[a] << b; adj[b] << a }
            parent = Array.new(n, -1)
            tin = Array.new(n, 0)
            sub = nums.dup
            size = Array.new(n, 1)
            seen = Array.new(n, false)
            order = []
            stack = [0]
            seen[0] = true
            until stack.empty?
              u = stack.pop
              tin[u] = order.length
              order << u
              adj[u].each do |v|
                next if seen[v]
                seen[v] = true
                parent[v] = u
                stack << v
              end
            end
            order.reverse_each do |x|
              p = parent[x]
              next if p < 0
              sub[p] ^= sub[x]
              size[p] += size[x]
            end
            total = sub[0]
            best = nil
            (1...n).each do |a|
              ((a + 1)...n).each do |b|
                parts =
                  if tin[a] <= tin[b] && tin[b] < tin[a] + size[a]
                    [sub[b], sub[a] ^ sub[b], total ^ sub[a]]
                  elsif tin[b] <= tin[a] && tin[a] < tin[b] + size[b]
                    [sub[a], sub[b] ^ sub[a], total ^ sub[b]]
                  else
                    [sub[a], sub[b], total ^ sub[a] ^ sub[b]]
                  end
                s = parts.max - parts.min
                best = s if best.nil? || s < best
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Create Components With Same Value (LC 2440) ─────────────────
  (() => {
    const ref = (nums: number[], edges: number[][]) => {
      // Every subset of edges to delete; keep the largest one that leaves equal sums.
      const n = nums.length, m = edges.length;
      let best = 0;
      for (let mask = 0; mask < 1 << m; mask++) {
        let cut = 0;
        const keep = edges.map((_, i) => { const c = (mask >> i) & 1; cut += c; return c === 0; });
        if (cut <= best) continue;
        const lab = componentsOf(n, edges, keep);
        const sum = new Map<number, number>();
        for (let v = 0; v < n; v++) sum.set(lab[v], (sum.get(lab[v]) ?? 0) + nums[v]);
        if (new Set(sum.values()).size === 1) best = cut;
      }
      return best;
    };
    return {
      slug: "create-components-with-same-value",
      title: "Create Components With Same Value",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Tree", "Depth-First Search", "Enumeration", "Google", "Microsoft"],
      signature: { funcName: "componentValue", params: [{ name: "nums", type: "int[]" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected tree has `n` nodes numbered `0` to `n - 1`; node `i` has the value `nums[i]`, and `edges` lists the tree's `n - 1` edges.\n\nYou may delete some of the edges, splitting the tree into connected components. The **value** of a component is the sum of `nums` over its nodes.\n\nReturn the **maximum** number of edges you can delete so that **every** component ends up with the same value.",
        [
          { in: "nums = [6,2,2,2,6], edges = [[0,1],[1,2],[1,3],[3,4]]", out: "2", note: "Delete [0,1] and [3,4]: the components {0}, {1,2,3} and {4} all have value 6." },
          { in: "nums = [2], edges = []", out: "0", note: "A single node has no edges to delete." },
          { in: "nums = [1,1,1,1], edges = [[0,1],[1,2],[2,3]]", out: "3", note: "Deleting every edge leaves four components of value 1." },
        ],
        ["1 <= n <= 2 * 10^4", "nums.length == n", "1 <= nums[i] <= 50", "edges.length == n - 1", "edges[i].length == 2", "0 <= edges[i][0], edges[i][1] <= n - 1", "edges represents a valid tree"]),
      hints: [
        "If the tree ends in `k` components of equal value, each one is worth exactly `total / k` — so `k` must divide the total sum.",
        "For a fixed target value `t`, cut greedily from the leaves up: a subtree whose remaining sum reaches exactly `t` must be cut off, and one whose sum exceeds `t` makes `t` impossible.",
        "Try `k` from the largest possible value downwards (it is at most `n`); the first `k` whose greedy check succeeds gives `k - 1` deletions.",
      ],
      editorial: explain({
        idea: "Deleting `k - 1` edges makes `k` components, all worth `total / k`. For a candidate `k`, a post-order pass decides feasibility: each subtree passes up the sum of what has not been cut off yet; that sum must never exceed the target, and it is cut (reset to 0) the moment it equals the target.",
        steps: [
          "Compute `total = sum(nums)` and a DFS order of the tree from node 0.",
          "For `k = n` down to `1`, skipping `k` that do not divide `total`: let `t = total / k`.",
          "Walk the nodes in reverse DFS order, setting `rem[v] = nums[v] + rem of its children`. If `rem[v] > t` the target fails; if `rem[v] == t`, set `rem[v] = 0` (the edge above `v` is cut).",
          "If no node failed and the root ends at `rem = 0`, return `k - 1`.",
        ],
        why: "With all values positive, a subtree whose leftover sum equals `t` cannot keep anything above it in the same component without exceeding `t`, so cutting there is forced; a leftover above `t` cannot be fixed by cuts higher up. Hence the greedy check succeeds exactly when a split into components worth `t` exists, and the largest feasible `k` maximises the deletions.",
        time: "O(n · d(total))",
        space: "O(n)",
        pitfalls: [
          "`k` cannot exceed `n`, and `t` cannot be below `max(nums)` — both prune the loop.",
          "The root must finish at exactly 0 left over; anything else means the last component is short.",
          "Recursion on a 20,000-node path overflows some stacks — a precomputed DFS order processed in reverse avoids it.",
        ],
      }),
      examples: [
        { input: "[6,2,2,2,6]\n[[0,1],[1,2],[1,3],[3,4]]", expectedOutput: "2" },
        { input: "[2]\n[]", expectedOutput: "0" },
        { input: "[1,1,1,1]\n[[0,1],[1,2],[2,3]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 5, 8, 11]));
        const mode = ri(rng, 0, 3);
        const top = pick(rng, [2, 3, 6, 50]);
        let nums = Array.from({ length: n }, () => ri(rng, 1, top));
        if (mode === 0) { const c = ri(rng, 1, 50); nums = nums.map(() => c); }
        const edges = randomTreeEdges(rng, n, 0);
        if (mode >= 2 && n > 1) {
          // Plant a split: cut random edges, then give every part the same sum.
          const lab = componentsOf(n, edges, edges.map(() => rng() < 0.6));
          const parts = new Map<number, number[]>();
          lab.forEach((l, v) => { if (!parts.has(l)) parts.set(l, []); parts.get(l)!.push(v); });
          const sizes = [...parts.values()].map((p) => p.length);
          const lo = Math.max(...sizes), hi = 50 * Math.min(...sizes);
          if (lo <= hi) {
            const t = ri(rng, lo, Math.min(hi, lo * pick(rng, [1, 2, 4, 10])));
            for (const p of parts.values()) {
              for (const v of p) nums[v] = 1;
              let left = t - p.length;
              while (left > 0) {
                const v = pick(rng, p);
                if (nums[v] < 50) { const add = Math.min(left, 50 - nums[v], ri(rng, 1, 10)); nums[v] += add; left -= add; }
              }
            }
          }
        }
        return { input: `${fmtIntArr(nums)}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(nums, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def componentValue(nums: List[int], edges: List[List[int]]) -> int:
              n = len(nums)
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-1] * n
              order = []
              seen = [False] * n
              seen[0] = True
              stack = [0]
              while stack:
                  u = stack.pop()
                  order.append(u)
                  for v in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          stack.append(v)
              total = sum(nums)
              biggest = max(nums)
              for k in range(min(n, total // biggest), 0, -1):
                  if total % k:
                      continue
                  t = total // k
                  rem = nums[:]
                  ok = True
                  for u in reversed(order):
                      if rem[u] > t:
                          ok = False
                          break
                      if rem[u] == t:
                          rem[u] = 0
                      if parent[u] >= 0:
                          rem[parent[u]] += rem[u]
                  if ok and rem[0] == 0:
                      return k - 1
              return 0
        `,
        javascript: code`
          var componentValue = function(nums, edges) {
              var n = nums.length;
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].push(edges[e][1]); adj[edges[e][1]].push(edges[e][0]); }
              var parent = [], seen = [];
              for (var i2 = 0; i2 < n; i2++) { parent.push(-1); seen.push(false); }
              var order = [], stack = [0];
              seen[0] = true;
              while (stack.length > 0) {
                  var u = stack.pop();
                  order.push(u);
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; stack.push(v); }
                  }
              }
              var total = 0, biggest = 0;
              for (var i3 = 0; i3 < n; i3++) { total += nums[i3]; if (nums[i3] > biggest) biggest = nums[i3]; }
              for (var k = Math.min(n, Math.floor(total / biggest)); k >= 1; k--) {
                  if (total % k !== 0) continue;
                  var t = total / k, rem = nums.slice(), ok = true;
                  for (var p = n - 1; p >= 0; p--) {
                      var x = order[p];
                      if (rem[x] > t) { ok = false; break; }
                      if (rem[x] === t) rem[x] = 0;
                      if (parent[x] >= 0) rem[parent[x]] += rem[x];
                  }
                  if (ok && rem[0] === 0) return k - 1;
              }
              return 0;
          };
        `,
        typescript: code`
          function componentValue(nums: number[], edges: number[][]): number {
              var n = nums.length;
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].push(edges[e][1]); adj[edges[e][1]].push(edges[e][0]); }
              var parent: number[] = [], seen: boolean[] = [];
              for (var i2 = 0; i2 < n; i2++) { parent.push(-1); seen.push(false); }
              var order: number[] = [], stack: number[] = [0];
              seen[0] = true;
              while (stack.length > 0) {
                  var u = stack.pop() as number;
                  order.push(u);
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; stack.push(v); }
                  }
              }
              var total = 0, biggest = 0;
              for (var i3 = 0; i3 < n; i3++) { total += nums[i3]; if (nums[i3] > biggest) biggest = nums[i3]; }
              for (var k = Math.min(n, Math.floor(total / biggest)); k >= 1; k--) {
                  if (total % k !== 0) continue;
                  var t = total / k, rem = nums.slice(), ok = true;
                  for (var p = n - 1; p >= 0; p--) {
                      var x = order[p];
                      if (rem[x] > t) { ok = false; break; }
                      if (rem[x] === t) rem[x] = 0;
                      if (parent[x] >= 0) rem[parent[x]] += rem[x];
                  }
                  if (ok && rem[0] === 0) return k - 1;
              }
              return 0;
          }
        `,
        java: code`
          public static int componentValue(int[] nums, int[][] edges) {
              int n = nums.length;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], order = new int[n], stack = new int[n];
              boolean[] seen = new boolean[n];
              Arrays.fill(parent, -1);
              int sp = 0, cnt = 0;
              stack[sp++] = 0;
              seen[0] = true;
              while (sp > 0) {
                  int u = stack[--sp];
                  order[cnt++] = u;
                  for (int v : adj.get(u)) if (!seen[v]) { seen[v] = true; parent[v] = u; stack[sp++] = v; }
              }
              int total = 0, biggest = 0;
              for (int x : nums) { total += x; biggest = Math.max(biggest, x); }
              for (int k = Math.min(n, total / biggest); k >= 1; k--) {
                  if (total % k != 0) continue;
                  int t = total / k;
                  int[] rem = nums.clone();
                  boolean ok = true;
                  for (int p = n - 1; p >= 0; p--) {
                      int x = order[p];
                      if (rem[x] > t) { ok = false; break; }
                      if (rem[x] == t) rem[x] = 0;
                      if (parent[x] >= 0) rem[parent[x]] += rem[x];
                  }
                  if (ok && rem[0] == 0) return k - 1;
              }
              return 0;
          }
        `,
        cpp: code`
          int componentValue(vector<int>& nums, vector<vector<int>>& edges) {
              int n = nums.size();
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -1), order, st = {0};
              vector<bool> seen(n, false);
              seen[0] = true;
              while (!st.empty()) {
                  int u = st.back();
                  st.pop_back();
                  order.push_back(u);
                  for (int v : adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; st.push_back(v); }
              }
              int total = 0, biggest = 0;
              for (int x : nums) { total += x; biggest = max(biggest, x); }
              for (int k = min(n, total / biggest); k >= 1; k--) {
                  if (total % k != 0) continue;
                  int t = total / k;
                  vector<int> rem(nums);
                  bool ok = true;
                  for (int p = n - 1; p >= 0; p--) {
                      int x = order[p];
                      if (rem[x] > t) { ok = false; break; }
                      if (rem[x] == t) rem[x] = 0;
                      if (parent[x] >= 0) rem[parent[x]] += rem[x];
                  }
                  if (ok && rem[0] == 0) return k - 1;
              }
              return 0;
          }
        `,
        c: code`
          int componentValue(int* nums, int numsSize, int** edges, int edgesSize, int* edgesColSize) {
              int n = numsSize;
              int* head = (int*) malloc((size_t) n * sizeof(int));
              int* nxt = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int* to = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int ec = 0;
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < edgesSize; e++) {
                  int a = edges[e][0], b = edges[e][1];
                  to[ec] = b; nxt[ec] = head[a]; head[a] = ec++;
                  to[ec] = a; nxt[ec] = head[b]; head[b] = ec++;
              }
              int* parent = (int*) malloc((size_t) n * sizeof(int));
              int* order = (int*) malloc((size_t) n * sizeof(int));
              int* stack = (int*) malloc((size_t) n * sizeof(int));
              int* rem = (int*) malloc((size_t) n * sizeof(int));
              char* seen = (char*) calloc((size_t) n, 1);
              for (int i = 0; i < n; i++) parent[i] = -1;
              int sp = 0, cnt = 0;
              stack[sp++] = 0;
              seen[0] = 1;
              while (sp > 0) {
                  int u = stack[--sp];
                  order[cnt++] = u;
                  for (int e = head[u]; e != -1; e = nxt[e]) {
                      int v = to[e];
                      if (!seen[v]) { seen[v] = 1; parent[v] = u; stack[sp++] = v; }
                  }
              }
              int total = 0, biggest = 0, answer = 0;
              for (int i = 0; i < n; i++) { total += nums[i]; if (nums[i] > biggest) biggest = nums[i]; }
              int start = total / biggest < n ? total / biggest : n;
              for (int k = start; k >= 1; k--) {
                  if (total % k != 0) continue;
                  int t = total / k, ok = 1;
                  for (int i = 0; i < n; i++) rem[i] = nums[i];
                  for (int p = n - 1; p >= 0; p--) {
                      int x = order[p];
                      if (rem[x] > t) { ok = 0; break; }
                      if (rem[x] == t) rem[x] = 0;
                      if (parent[x] >= 0) rem[parent[x]] += rem[x];
                  }
                  if (ok && rem[0] == 0) { answer = k - 1; break; }
              }
              free(head); free(nxt); free(to); free(parent); free(order); free(stack); free(rem); free(seen);
              return answer;
          }
        `,
        csharp: code`
          public static int ComponentValue(int[] nums, int[][] edges)
          {
              int n = nums.Length;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var parent = new int[n];
              var order = new int[n];
              var seen = new bool[n];
              for (int i = 0; i < n; i++) parent[i] = -1;
              var stack = new Stack<int>();
              stack.Push(0);
              seen[0] = true;
              int cnt = 0;
              while (stack.Count > 0)
              {
                  int u = stack.Pop();
                  order[cnt++] = u;
                  foreach (int v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; stack.Push(v); }
              }
              int total = 0, biggest = 0;
              foreach (int x in nums) { total += x; biggest = Math.Max(biggest, x); }
              for (int k = Math.Min(n, total / biggest); k >= 1; k--)
              {
                  if (total % k != 0) continue;
                  int t = total / k;
                  var rem = (int[]) nums.Clone();
                  bool ok = true;
                  for (int p = n - 1; p >= 0; p--)
                  {
                      int x = order[p];
                      if (rem[x] > t) { ok = false; break; }
                      if (rem[x] == t) rem[x] = 0;
                      if (parent[x] >= 0) rem[parent[x]] += rem[x];
                  }
                  if (ok && rem[0] == 0) return k - 1;
              }
              return 0;
          }
        `,
        go: code`
          func componentValue(nums []int, edges [][]int) int {
              n := len(nums)
              adj := make([][]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], e[1])
                  adj[e[1]] = append(adj[e[1]], e[0])
              }
              parent := make([]int, n)
              for i := range parent {
                  parent[i] = -1
              }
              seen := make([]bool, n)
              order := []int{}
              stack := []int{0}
              seen[0] = true
              for len(stack) > 0 {
                  u := stack[len(stack)-1]
                  stack = stack[:len(stack)-1]
                  order = append(order, u)
                  for _, v := range adj[u] {
                      if !seen[v] {
                          seen[v] = true
                          parent[v] = u
                          stack = append(stack, v)
                      }
                  }
              }
              total, biggest := 0, 0
              for _, x := range nums {
                  total += x
                  if x > biggest {
                      biggest = x
                  }
              }
              start := total / biggest
              if n < start {
                  start = n
              }
              rem := make([]int, n)
              for k := start; k >= 1; k-- {
                  if total%k != 0 {
                      continue
                  }
                  t := total / k
                  copy(rem, nums)
                  ok := true
                  for p := n - 1; p >= 0; p-- {
                      x := order[p]
                      if rem[x] > t {
                          ok = false
                          break
                      }
                      if rem[x] == t {
                          rem[x] = 0
                      }
                      if parent[x] >= 0 {
                          rem[parent[x]] += rem[x]
                      }
                  }
                  if ok && rem[0] == 0 {
                      return k - 1
                  }
              }
              return 0
          }
        `,
        kotlin: code`
          fun componentValue(nums: IntArray, edges: Array<IntArray>): Int {
              val n = nums.size
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -1 }
              val order = IntArray(n)
              val stack = IntArray(n)
              val seen = BooleanArray(n)
              var sp = 0
              var cnt = 0
              stack[sp++] = 0
              seen[0] = true
              while (sp > 0) {
                  val u = stack[--sp]
                  order[cnt++] = u
                  for (v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; stack[sp++] = v }
              }
              var total = 0
              var biggest = 0
              for (x in nums) { total += x; biggest = maxOf(biggest, x) }
              for (k in minOf(n, total / biggest) downTo 1) {
                  if (total % k != 0) continue
                  val t = total / k
                  val rem = nums.copyOf()
                  var ok = true
                  for (p in n - 1 downTo 0) {
                      val x = order[p]
                      if (rem[x] > t) { ok = false; break }
                      if (rem[x] == t) rem[x] = 0
                      if (parent[x] >= 0) rem[parent[x]] += rem[x]
                  }
                  if (ok && rem[0] == 0) return k - 1
              }
              return 0
          }
        `,
        swift: code`
          func componentValue(_ nums: [Int], _ edges: [[Int]]) -> Int {
              let n = nums.count
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -1, count: n)
              var seen = [Bool](repeating: false, count: n)
              var order = [Int]()
              var stack = [0]
              seen[0] = true
              while let u = stack.popLast() {
                  order.append(u)
                  for v in adj[u] where !seen[v] {
                      seen[v] = true
                      parent[v] = u
                      stack.append(v)
                  }
              }
              let total = nums.reduce(0, +)
              let biggest = nums.max()!
              var k = min(n, total / biggest)
              while k >= 1 {
                  defer { k -= 1 }
                  if total % k != 0 { continue }
                  let t = total / k
                  var rem = nums
                  var ok = true
                  for x in order.reversed() {
                      if rem[x] > t { ok = false; break }
                      if rem[x] == t { rem[x] = 0 }
                      if parent[x] >= 0 { rem[parent[x]] += rem[x] }
                  }
                  if ok && rem[0] == 0 { return k - 1 }
              }
              return 0
          }
        `,
        rust: code`
          fn componentValue(nums: Vec<i32>, edges: Vec<Vec<i32>>) -> i32 {
              let n = nums.len();
              let mut adj = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut parent = vec![std::usize::MAX; n];
              let mut seen = vec![false; n];
              let mut order: Vec<usize> = Vec::with_capacity(n);
              let mut stack = vec![0usize];
              seen[0] = true;
              while let Some(u) = stack.pop() {
                  order.push(u);
                  for &v in adj[u].iter() {
                      if !seen[v] {
                          seen[v] = true;
                          parent[v] = u;
                          stack.push(v);
                      }
                  }
              }
              let total: i32 = nums.iter().sum();
              let biggest = *nums.iter().max().unwrap();
              let mut k = std::cmp::min(n as i32, total / biggest);
              while k >= 1 {
                  if total % k == 0 {
                      let t = total / k;
                      let mut rem = nums.clone();
                      let mut ok = true;
                      for &x in order.iter().rev() {
                          if rem[x] > t {
                              ok = false;
                              break;
                          }
                          if rem[x] == t {
                              rem[x] = 0;
                          }
                          if parent[x] != std::usize::MAX {
                              let p = parent[x];
                              rem[p] += rem[x];
                          }
                      }
                      if ok && rem[0] == 0 {
                          return k - 1;
                      }
                  }
                  k -= 1;
              }
              0
          }
        `,
        php: code`
          function componentValue($nums, $edges) {
              $n = count($nums);
              $adj = array_fill(0, $n, []);
              foreach ($edges as [$a, $b]) { $adj[$a][] = $b; $adj[$b][] = $a; }
              $parent = array_fill(0, $n, -1);
              $seen = array_fill(0, $n, false);
              $order = [];
              $stack = [0];
              $seen[0] = true;
              while ($stack) {
                  $u = array_pop($stack);
                  $order[] = $u;
                  foreach ($adj[$u] as $v) {
                      if (!$seen[$v]) { $seen[$v] = true; $parent[$v] = $u; $stack[] = $v; }
                  }
              }
              $total = array_sum($nums);
              $biggest = max($nums);
              for ($k = min($n, intdiv($total, $biggest)); $k >= 1; $k--) {
                  if ($total % $k != 0) continue;
                  $t = intdiv($total, $k);
                  $rem = $nums;
                  $ok = true;
                  for ($p = $n - 1; $p >= 0; $p--) {
                      $x = $order[$p];
                      if ($rem[$x] > $t) { $ok = false; break; }
                      if ($rem[$x] == $t) $rem[$x] = 0;
                      if ($parent[$x] >= 0) $rem[$parent[$x]] += $rem[$x];
                  }
                  if ($ok && $rem[0] == 0) return $k - 1;
              }
              return 0;
          }
        `,
        ruby: code`
          def componentValue(nums, edges)
            n = nums.length
            adj = Array.new(n) { [] }
            edges.each { |a, b| adj[a] << b; adj[b] << a }
            parent = Array.new(n, -1)
            seen = Array.new(n, false)
            order = []
            stack = [0]
            seen[0] = true
            until stack.empty?
              u = stack.pop
              order << u
              adj[u].each do |v|
                next if seen[v]
                seen[v] = true
                parent[v] = u
                stack << v
              end
            end
            total = nums.sum
            [n, total / nums.max].min.downto(1) do |k|
              next if total % k != 0
              t = total / k
              rem = nums.dup
              ok = true
              order.reverse_each do |x|
                if rem[x] > t
                  ok = false
                  break
                end
                rem[x] = 0 if rem[x] == t
                rem[parent[x]] += rem[x] if parent[x] >= 0
              end
              return k - 1 if ok && rem[0] == 0
            end
            0
          end
        `,
      },
    };
  })(),

  // ── Add Edges to Make Degrees of All Nodes Even (LC 2508) ───────
  (() => {
    const ref = (n: number, edges: number[][]) => {
      // Try adding nothing, every single new edge, and every pair of new edges.
      const has = new Set(edges.map((e) => Math.min(e[0], e[1]) * 100 + Math.max(e[0], e[1])));
      const deg = new Array(n + 1).fill(0);
      for (const [a, b] of edges) { deg[a]++; deg[b]++; }
      const free: number[][] = [];
      for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) if (!has.has(a * 100 + b)) free.push([a, b]);
      const even = (extra: number[][]) => {
        const d = deg.slice();
        for (const [a, b] of extra) { d[a]++; d[b]++; }
        return d.every((x) => x % 2 === 0);
      };
      if (even([])) return true;
      for (let i = 0; i < free.length; i++) {
        if (even([free[i]])) return true;
        for (let j = i + 1; j < free.length; j++) if (even([free[i], free[j]])) return true;
      }
      return false;
    };
    return {
      slug: "add-edges-to-make-degrees-of-all-nodes-even",
      title: "Add Edges to Make Degrees of All Nodes Even",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "Graph", "Google", "Amazon"],
      signature: { funcName: "isPossible", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "An undirected graph has `n` nodes numbered `1` to `n`; each `edges[i] = [a, b]` is an edge between `a` and `b`. The graph may be disconnected.\n\nYou may add **at most two** new edges. A new edge must not join a node to itself and must not repeat an edge that already exists (including one you added).\n\nReturn `true` if you can make the **degree of every node even** this way, and `false` otherwise. The degree of a node is the number of edges touching it.",
        [
          { in: "n = 5, edges = [[1,2],[2,3],[3,4],[4,2],[1,4],[2,5]]", out: "true", note: "Only nodes 4 and 5 have odd degree, and they are not yet joined: adding the edge [4,5] makes every degree even." },
          { in: "n = 4, edges = [[1,2],[3,4]]", out: "true", note: "Add [1,3] and [2,4]: every node now has degree 2." },
          { in: "n = 4, edges = [[1,2],[1,3],[1,4]]", out: "false", note: "All four nodes have odd degree, and every way to pair them up needs an edge that already exists." },
        ],
        ["3 <= n <= 10^5", "2 <= edges.length <= 10^5", "edges[i].length == 2", "1 <= a, b <= n", "a != b", "there are no repeated edges"]),
      hints: [
        "An added edge changes the parity of exactly its two endpoints, so only the nodes of odd degree matter — and there is always an even number of them.",
        "With two edges you can fix at most four odd nodes. More than four: impossible. Zero: already done.",
        "Four odd nodes `a, b, c, d`: try the three ways to pair them, each pair needing a missing edge. Two odd nodes `a, b`: either join them directly, or find a third node joined to neither and connect it to both.",
      ],
      editorial: explain({
        idea: "Adding an edge flips the parity of its two endpoints, so the problem is about the set of odd-degree nodes. With at most two edges, only 0, 2 or 4 odd nodes can be fixed, and each case is a constant number of edge-existence checks.",
        steps: [
          "Count degrees and collect the odd nodes.",
          "None odd: return `true`. More than four odd: return `false`.",
          "Two odd nodes `a, b`: if `a–b` is not an edge, add it. Otherwise look for any node `c` (not `a` or `b`) adjacent to neither; adding `a–c` and `b–c` fixes both while `c` gains 2.",
          "Four odd nodes: return whether one of the pairings `{ab, cd}`, `{ac, bd}`, `{ad, bc}` uses two missing edges.",
        ],
        why: "Every odd node needs an odd number of new edges touching it, so two edges can serve at most four odd nodes. With four, both edges must join odd nodes in disjoint pairs — exactly the three pairings. With two, either one edge joins them, or two edges meet at a common third node (any other shape would leave a new odd node).",
        time: "O(n + m)",
        space: "O(n + m)",
        pitfalls: [
          "With two odd nodes that are already adjacent, the third node must avoid **both** of them, not just one.",
          "The graph can be disconnected; the third node may come from any component.",
          "Store edges in a set (or scan adjacency) so each existence check is cheap — never test all pairs.",
        ],
      }),
      examples: [
        { input: "5\n[[1,2],[2,3],[3,4],[4,2],[1,4],[2,5]]", expectedOutput: "true" },
        { input: "4\n[[1,2],[3,4]]", expectedOutput: "true" },
        { input: "4\n[[1,2],[1,3],[1,4]]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, pick(rng, [4, 6, 8, 10]));
        const maxM = (n * (n - 1)) / 2;
        const m = ri(rng, 2, Math.min(maxM, pick(rng, [3, n, 2 * n, maxM])));
        const edges = randomSimplePairs(rng, n, m).map((e) => [e[0] + 1, e[1] + 1]);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: bool(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isPossible(n: int, edges: List[List[int]]) -> bool:
              adj = [set() for _ in range(n + 1)]
              for a, b in edges:
                  adj[a].add(b)
                  adj[b].add(a)
              odd = [v for v in range(1, n + 1) if len(adj[v]) % 2 == 1]
              if not odd:
                  return True
              if len(odd) == 2:
                  a, b = odd
                  if b not in adj[a]:
                      return True
                  return any(c != a and c != b and c not in adj[a] and c not in adj[b] for c in range(1, n + 1))
              if len(odd) == 4:
                  a, b, c, d = odd

                  def free(x, y):
                      return y not in adj[x]

                  return (free(a, b) and free(c, d)) or (free(a, c) and free(b, d)) or (free(a, d) and free(b, c))
              return False
        `,
        javascript: code`
          var isPossible = function(n, edges) {
              var adj = [];
              for (var i = 0; i <= n; i++) adj.push(new Set());
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].add(edges[e][1]); adj[edges[e][1]].add(edges[e][0]); }
              var odd = [];
              for (var v = 1; v <= n; v++) if (adj[v].size % 2 === 1) odd.push(v);
              var free = function(x, y) { return !adj[x].has(y); };
              if (odd.length === 0) return true;
              if (odd.length === 2) {
                  var a = odd[0], b = odd[1];
                  if (free(a, b)) return true;
                  for (var c = 1; c <= n; c++) if (c !== a && c !== b && free(a, c) && free(b, c)) return true;
                  return false;
              }
              if (odd.length === 4) {
                  var p = odd[0], q = odd[1], r = odd[2], s = odd[3];
                  return (free(p, q) && free(r, s)) || (free(p, r) && free(q, s)) || (free(p, s) && free(q, r));
              }
              return false;
          };
        `,
        typescript: code`
          function isPossible(n: number, edges: number[][]): boolean {
              var adj: Array<{ [k: number]: boolean }> = [];
              var deg: number[] = [];
              for (var i = 0; i <= n; i++) { adj.push({}); deg.push(0); }
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]][edges[e][1]] = true;
                  adj[edges[e][1]][edges[e][0]] = true;
                  deg[edges[e][0]]++;
                  deg[edges[e][1]]++;
              }
              var odd: number[] = [];
              for (var v = 1; v <= n; v++) if (deg[v] % 2 === 1) odd.push(v);
              var free = function(x: number, y: number): boolean { return !adj[x][y]; };
              if (odd.length === 0) return true;
              if (odd.length === 2) {
                  var a = odd[0], b = odd[1];
                  if (free(a, b)) return true;
                  for (var c = 1; c <= n; c++) if (c !== a && c !== b && free(a, c) && free(b, c)) return true;
                  return false;
              }
              if (odd.length === 4) {
                  var p = odd[0], q = odd[1], r = odd[2], s = odd[3];
                  return (free(p, q) && free(r, s)) || (free(p, r) && free(q, s)) || (free(p, s) && free(q, r));
              }
              return false;
          }
        `,
        java: code`
          public static boolean isPossible(int n, int[][] edges) {
              List<Set<Integer>> adj = new ArrayList<>();
              for (int i = 0; i <= n; i++) adj.add(new HashSet<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              List<Integer> odd = new ArrayList<>();
              for (int v = 1; v <= n; v++) if (adj.get(v).size() % 2 == 1) odd.add(v);
              if (odd.isEmpty()) return true;
              if (odd.size() == 2) {
                  int a = odd.get(0), b = odd.get(1);
                  if (!adj.get(a).contains(b)) return true;
                  for (int c = 1; c <= n; c++)
                      if (c != a && c != b && !adj.get(a).contains(c) && !adj.get(b).contains(c)) return true;
                  return false;
              }
              if (odd.size() == 4) {
                  int a = odd.get(0), b = odd.get(1), c = odd.get(2), d = odd.get(3);
                  Set<Integer> A = adj.get(a), B = adj.get(b), C = adj.get(c);
                  return (!A.contains(b) && !C.contains(d)) || (!A.contains(c) && !B.contains(d)) || (!A.contains(d) && !B.contains(c));
              }
              return false;
          }
        `,
        cpp: code`
          bool isPossible(int n, vector<vector<int>>& edges) {
              vector<unordered_set<int>> adj(n + 1);
              for (auto& e : edges) { adj[e[0]].insert(e[1]); adj[e[1]].insert(e[0]); }
              vector<int> odd;
              for (int v = 1; v <= n; v++) if (adj[v].size() % 2 == 1) odd.push_back(v);
              auto freeEdge = [&](int x, int y) { return adj[x].count(y) == 0; };
              if (odd.empty()) return true;
              if (odd.size() == 2) {
                  int a = odd[0], b = odd[1];
                  if (freeEdge(a, b)) return true;
                  for (int c = 1; c <= n; c++)
                      if (c != a && c != b && freeEdge(a, c) && freeEdge(b, c)) return true;
                  return false;
              }
              if (odd.size() == 4) {
                  int a = odd[0], b = odd[1], c = odd[2], d = odd[3];
                  return (freeEdge(a, b) && freeEdge(c, d)) || (freeEdge(a, c) && freeEdge(b, d)) || (freeEdge(a, d) && freeEdge(b, c));
              }
              return false;
          }
        `,
        c: code`
          /* Linked adjacency; an edge test scans the shorter of the two lists. */
          static int *g_head, *g_nxt, *g_to, *g_deg;

          static bool hasEdge(int x, int y) {
              if (g_deg[x] > g_deg[y]) { int t = x; x = y; y = t; }
              for (int e = g_head[x]; e != -1; e = g_nxt[e]) if (g_to[e] == y) return true;
              return false;
          }

          bool isPossible(int n, int** edges, int edgesSize, int* edgesColSize) {
              g_head = (int*) malloc((size_t) (n + 1) * sizeof(int));
              g_deg = (int*) calloc((size_t) (n + 1), sizeof(int));
              g_nxt = (int*) malloc((size_t) (2 * edgesSize) * sizeof(int));
              g_to = (int*) malloc((size_t) (2 * edgesSize) * sizeof(int));
              for (int i = 0; i <= n; i++) g_head[i] = -1;
              int ec = 0;
              for (int e = 0; e < edgesSize; e++) {
                  int a = edges[e][0], b = edges[e][1];
                  g_to[ec] = b; g_nxt[ec] = g_head[a]; g_head[a] = ec++;
                  g_to[ec] = a; g_nxt[ec] = g_head[b]; g_head[b] = ec++;
                  g_deg[a]++; g_deg[b]++;
              }
              int odd[5], cnt = 0;
              for (int v = 1; v <= n; v++) if (g_deg[v] % 2 == 1) { if (cnt < 5) odd[cnt] = v; cnt++; }
              bool ans = false;
              if (cnt == 0) ans = true;
              else if (cnt == 2) {
                  int a = odd[0], b = odd[1];
                  if (!hasEdge(a, b)) ans = true;
                  else {
                      char* mark = (char*) calloc((size_t) (n + 1), 1);
                      for (int e = g_head[a]; e != -1; e = g_nxt[e]) mark[g_to[e]] = 1;
                      for (int e = g_head[b]; e != -1; e = g_nxt[e]) mark[g_to[e]] = 1;
                      for (int c = 1; c <= n && !ans; c++) if (c != a && c != b && !mark[c]) ans = true;
                      free(mark);
                  }
              } else if (cnt == 4) {
                  int a = odd[0], b = odd[1], c = odd[2], d = odd[3];
                  ans = (!hasEdge(a, b) && !hasEdge(c, d)) || (!hasEdge(a, c) && !hasEdge(b, d)) || (!hasEdge(a, d) && !hasEdge(b, c));
              }
              free(g_head); free(g_deg); free(g_nxt); free(g_to);
              return ans;
          }
        `,
        csharp: code`
          public static bool IsPossible(int n, int[][] edges)
          {
              var adj = new HashSet<int>[n + 1];
              for (int i = 0; i <= n; i++) adj[i] = new HashSet<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var odd = new List<int>();
              for (int v = 1; v <= n; v++) if (adj[v].Count % 2 == 1) odd.Add(v);
              Func<int, int, bool> free = (x, y) => !adj[x].Contains(y);
              if (odd.Count == 0) return true;
              if (odd.Count == 2)
              {
                  int a = odd[0], b = odd[1];
                  if (free(a, b)) return true;
                  for (int c = 1; c <= n; c++)
                      if (c != a && c != b && free(a, c) && free(b, c)) return true;
                  return false;
              }
              if (odd.Count == 4)
              {
                  int a = odd[0], b = odd[1], c = odd[2], d = odd[3];
                  return (free(a, b) && free(c, d)) || (free(a, c) && free(b, d)) || (free(a, d) && free(b, c));
              }
              return false;
          }
        `,
        go: code`
          func isPossible(n int, edges [][]int) bool {
              adj := make([]map[int]bool, n+1)
              for i := range adj {
                  adj[i] = map[int]bool{}
              }
              for _, e := range edges {
                  adj[e[0]][e[1]] = true
                  adj[e[1]][e[0]] = true
              }
              odd := []int{}
              for v := 1; v <= n; v++ {
                  if len(adj[v])%2 == 1 {
                      odd = append(odd, v)
                  }
              }
              free := func(x, y int) bool { return !adj[x][y] }
              switch len(odd) {
              case 0:
                  return true
              case 2:
                  a, b := odd[0], odd[1]
                  if free(a, b) {
                      return true
                  }
                  for c := 1; c <= n; c++ {
                      if c != a && c != b && free(a, c) && free(b, c) {
                          return true
                      }
                  }
                  return false
              case 4:
                  a, b, c, d := odd[0], odd[1], odd[2], odd[3]
                  return (free(a, b) && free(c, d)) || (free(a, c) && free(b, d)) || (free(a, d) && free(b, c))
              }
              return false
          }
        `,
        kotlin: code`
          fun isPossible(n: Int, edges: Array<IntArray>): Boolean {
              val adj = Array(n + 1) { HashSet<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val odd = (1..n).filter { adj[it].size % 2 == 1 }
              fun free(x: Int, y: Int) = !adj[x].contains(y)
              return when (odd.size) {
                  0 -> true
                  2 -> {
                      val a = odd[0]
                      val b = odd[1]
                      free(a, b) || (1..n).any { it != a && it != b && free(a, it) && free(b, it) }
                  }
                  4 -> {
                      val (a, b, c, d) = odd
                      (free(a, b) && free(c, d)) || (free(a, c) && free(b, d)) || (free(a, d) && free(b, c))
                  }
                  else -> false
              }
          }
        `,
        swift: code`
          func isPossible(_ n: Int, _ edges: [[Int]]) -> Bool {
              var adj = [Set<Int>](repeating: Set<Int>(), count: n + 1)
              for e in edges { adj[e[0]].insert(e[1]); adj[e[1]].insert(e[0]) }
              let odd = (1...n).filter { adj[$0].count % 2 == 1 }
              func free(_ x: Int, _ y: Int) -> Bool { return !adj[x].contains(y) }
              if odd.isEmpty { return true }
              if odd.count == 2 {
                  let a = odd[0], b = odd[1]
                  if free(a, b) { return true }
                  for c in 1...n where c != a && c != b && free(a, c) && free(b, c) { return true }
                  return false
              }
              if odd.count == 4 {
                  let a = odd[0], b = odd[1], c = odd[2], d = odd[3]
                  return (free(a, b) && free(c, d)) || (free(a, c) && free(b, d)) || (free(a, d) && free(b, c))
              }
              return false
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn isPossible(n: i32, edges: Vec<Vec<i32>>) -> bool {
              let n = n as usize;
              let mut adj: Vec<HashSet<usize>> = vec![HashSet::new(); n + 1];
              for e in edges.iter() {
                  let (a, b) = (e[0] as usize, e[1] as usize);
                  adj[a].insert(b);
                  adj[b].insert(a);
              }
              let odd: Vec<usize> = (1..=n).filter(|&v| adj[v].len() % 2 == 1).collect();
              let free = |x: usize, y: usize| !adj[x].contains(&y);
              match odd.len() {
                  0 => true,
                  2 => {
                      let (a, b) = (odd[0], odd[1]);
                      free(a, b) || (1..=n).any(|c| c != a && c != b && free(a, c) && free(b, c))
                  }
                  4 => {
                      let (a, b, c, d) = (odd[0], odd[1], odd[2], odd[3]);
                      (free(a, b) && free(c, d)) || (free(a, c) && free(b, d)) || (free(a, d) && free(b, c))
                  }
                  _ => false,
              }
          }
        `,
        php: code`
          function isPossible($n, $edges) {
              $adj = array_fill(0, $n + 1, []);
              foreach ($edges as [$a, $b]) { $adj[$a][$b] = true; $adj[$b][$a] = true; }
              $odd = [];
              for ($v = 1; $v <= $n; $v++) if (count($adj[$v]) % 2 == 1) $odd[] = $v;
              $free = function ($x, $y) use (&$adj) { return !isset($adj[$x][$y]); };
              if (count($odd) == 0) return true;
              if (count($odd) == 2) {
                  [$a, $b] = $odd;
                  if ($free($a, $b)) return true;
                  for ($c = 1; $c <= $n; $c++) if ($c != $a && $c != $b && $free($a, $c) && $free($b, $c)) return true;
                  return false;
              }
              if (count($odd) == 4) {
                  [$a, $b, $c, $d] = $odd;
                  return ($free($a, $b) && $free($c, $d)) || ($free($a, $c) && $free($b, $d)) || ($free($a, $d) && $free($b, $c));
              }
              return false;
          }
        `,
        ruby: code`
          require 'set'

          def isPossible(n, edges)
            adj = Array.new(n + 1) { Set.new }
            edges.each { |a, b| adj[a] << b; adj[b] << a }
            odd = (1..n).select { |v| adj[v].size.odd? }
            free = ->(x, y) { !adj[x].include?(y) }
            case odd.length
            when 0
              true
            when 2
              a, b = odd
              free.(a, b) || (1..n).any? { |c| c != a && c != b && free.(a, c) && free.(b, c) }
            when 4
              a, b, c, d = odd
              (free.(a, b) && free.(c, d)) || (free.(a, c) && free.(b, d)) || (free.(a, d) && free.(b, c))
            else
              false
            end
          end
        `,
      },
    };
  })(),

  // ── Disconnect Path in a Binary Matrix by at Most One Flip (LC 2556) ─
  (() => {
    const reaches = (g: number[][]) => {
      const m = g.length, n = g[0].length;
      const f = g.map((row) => row.map(() => false));
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (g[i][j] !== 1) continue;
        f[i][j] = (i === 0 && j === 0) || (i > 0 && f[i - 1][j]) || (j > 0 && f[i][j - 1]);
      }
      return f[m - 1][n - 1];
    };
    const ref = (grid: number[][]) => {
      // Already cut, or some single 1-cell (not a corner) whose removal cuts it.
      if (!reaches(grid)) return true;
      const m = grid.length, n = grid[0].length;
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (grid[i][j] !== 1 || (i === 0 && j === 0) || (i === m - 1 && j === n - 1)) continue;
        const g = grid.map((row) => row.slice());
        g[i][j] = 0;
        if (!reaches(g)) return true;
      }
      return false;
    };
    return {
      slug: "disconnect-path-in-a-binary-matrix-by-at-most-one-flip",
      title: "Disconnect Path in a Binary Matrix by at Most One Flip",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Depth-First Search", "Breadth-First Search", "Matrix", "Google", "Amazon"],
      signature: { funcName: "isPossibleToCutPath", params: [{ name: "grid", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "You are given an `m x n` binary matrix `grid`. From a cell `(row, col)` you may move only to `(row + 1, col)` or `(row, col + 1)`, and only onto cells holding `1`.\n\nThe matrix is **disconnected** if there is no such path from `(0, 0)` to `(m - 1, n - 1)`.\n\nYou may flip **at most one** cell (change a `0` to `1` or a `1` to `0`), but you may not flip `(0, 0)` or `(m - 1, n - 1)`.\n\nReturn `true` if the matrix can be made disconnected, and `false` otherwise.",
        [
          { in: "grid = [[1,1,1],[1,0,0],[1,1,1]]", out: "true", note: "The top row is a dead end because (1,2) is 0, so every path goes down through (1,0). Flipping (1,0) to 0 cuts them all." },
          { in: "grid = [[1,1,1],[1,0,1],[1,1,1]]", out: "false", note: "The top-right route and the bottom-left route share no cell besides the corners, so no single flip cuts both." },
          { in: "grid = [[1]]", out: "false", note: "Start and end are the same cell, which may not be flipped." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 1000", "1 <= m * n <= 10^5", "grid[i][j] is either 0 or 1", "grid[0][0] == grid[m - 1][n - 1] == 1"]),
      hints: [
        "Turning a `0` into a `1` never disconnects anything, so the only useful flip removes a cell that lies on a path.",
        "Every right/down path visits exactly one cell on each anti-diagonal `i + j = d`. Mark the cells that are both reachable from the start and able to reach the end.",
        "If some anti-diagonal strictly between the corners holds exactly **one** such cell, every path goes through it — flip it. (If no path exists at all, the answer is already `true`.)",
      ],
      editorial: explain({
        idea: "A monotone path takes exactly one step from anti-diagonal `d` to `d + 1`, so it meets every anti-diagonal exactly once. The cells usable by some path are those reachable from `(0, 0)` that can also reach `(m - 1, n - 1)`. If an intermediate anti-diagonal contains a single usable cell, that cell is on every path; flipping it disconnects the grid. If every intermediate anti-diagonal has two or more, no one cell blocks everything.",
        steps: [
          "Forward DP: `f[i][j]` is true when `grid[i][j] == 1` and `(i, j)` is the start or `f` holds above or to the left.",
          "Backward DP: `g[i][j]` is true when `grid[i][j] == 1` and `(i, j)` is the end or `g` holds below or to the right.",
          "If `f[m-1][n-1]` is false the grid is already disconnected: return `true`.",
          "Count usable cells (`f && g`) per anti-diagonal; return `true` if any `d` in `1 .. m + n - 3` has count 1, else `false`.",
        ],
        why: "If a diagonal has one usable cell, every start-to-end path passes through it, so removing it leaves none. Conversely, if every intermediate diagonal has at least two usable cells, the topmost and bottommost usable paths are vertex-disjoint apart from the corners (a standard Menger-type argument on this grid), so removing any single cell leaves one of them intact.",
        time: "O(mn)",
        space: "O(mn)",
        pitfalls: [
          "Exclude the two corner diagonals (`d = 0` and `d = m + n - 2`) — those cells cannot be flipped.",
          "A cell reachable from the start but unable to reach the end is not on any path; counting it hides a bottleneck.",
          "A grid with no path at all needs zero flips: answer `true`.",
        ],
      }),
      examples: [
        { input: "[[1,1,1],[1,0,0],[1,1,1]]", expectedOutput: "true" },
        { input: "[[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "false" },
        { input: "[[1]]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 4, 6])), n = ri(rng, 1, pick(rng, [2, 4, 6]));
        const p = pick(rng, [0.6, 0.75, 0.85, 0.95]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < p ? 1 : 0)));
        grid[0][0] = 1;
        grid[m - 1][n - 1] = 1;
        return { input: fmtIntMat(grid), expectedOutput: bool(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isPossibleToCutPath(grid: List[List[int]]) -> bool:
              m, n = len(grid), len(grid[0])
              f = [[False] * n for _ in range(m)]
              g = [[False] * n for _ in range(m)]
              for i in range(m):
                  for j in range(n):
                      if grid[i][j] == 1:
                          f[i][j] = (i == 0 and j == 0) or (i > 0 and f[i - 1][j]) or (j > 0 and f[i][j - 1])
              for i in range(m - 1, -1, -1):
                  for j in range(n - 1, -1, -1):
                      if grid[i][j] == 1:
                          g[i][j] = (i == m - 1 and j == n - 1) or (i < m - 1 and g[i + 1][j]) or (j < n - 1 and g[i][j + 1])
              if not f[m - 1][n - 1]:
                  return True
              cnt = [0] * (m + n - 1)
              for i in range(m):
                  for j in range(n):
                      if f[i][j] and g[i][j]:
                          cnt[i + j] += 1
              return any(cnt[d] == 1 for d in range(1, m + n - 2))
        `,
        javascript: code`
          var isPossibleToCutPath = function(grid) {
              var m = grid.length, n = grid[0].length;
              var f = [], g = [];
              for (var i = 0; i < m; i++) { f.push([]); g.push([]); for (var j = 0; j < n; j++) { f[i].push(false); g[i].push(false); } }
              for (var a = 0; a < m; a++)
                  for (var b = 0; b < n; b++)
                      if (grid[a][b] === 1) f[a][b] = (a === 0 && b === 0) || (a > 0 && f[a - 1][b]) || (b > 0 && f[a][b - 1]);
              for (var c = m - 1; c >= 0; c--)
                  for (var d = n - 1; d >= 0; d--)
                      if (grid[c][d] === 1) g[c][d] = (c === m - 1 && d === n - 1) || (c < m - 1 && g[c + 1][d]) || (d < n - 1 && g[c][d + 1]);
              if (!f[m - 1][n - 1]) return true;
              var cnt = [];
              for (var k = 0; k < m + n - 1; k++) cnt.push(0);
              for (var x = 0; x < m; x++)
                  for (var y = 0; y < n; y++)
                      if (f[x][y] && g[x][y]) cnt[x + y]++;
              for (var t = 1; t <= m + n - 3; t++) if (cnt[t] === 1) return true;
              return false;
          };
        `,
        typescript: code`
          function isPossibleToCutPath(grid: number[][]): boolean {
              var m = grid.length, n = grid[0].length;
              var f: boolean[][] = [], g: boolean[][] = [];
              for (var i = 0; i < m; i++) {
                  var fr: boolean[] = [], gr: boolean[] = [];
                  for (var j = 0; j < n; j++) { fr.push(false); gr.push(false); }
                  f.push(fr); g.push(gr);
              }
              for (var a = 0; a < m; a++)
                  for (var b = 0; b < n; b++)
                      if (grid[a][b] === 1) f[a][b] = (a === 0 && b === 0) || (a > 0 && f[a - 1][b]) || (b > 0 && f[a][b - 1]);
              for (var c = m - 1; c >= 0; c--)
                  for (var d = n - 1; d >= 0; d--)
                      if (grid[c][d] === 1) g[c][d] = (c === m - 1 && d === n - 1) || (c < m - 1 && g[c + 1][d]) || (d < n - 1 && g[c][d + 1]);
              if (!f[m - 1][n - 1]) return true;
              var cnt: number[] = [];
              for (var k = 0; k < m + n - 1; k++) cnt.push(0);
              for (var x = 0; x < m; x++)
                  for (var y = 0; y < n; y++)
                      if (f[x][y] && g[x][y]) cnt[x + y]++;
              for (var t = 1; t <= m + n - 3; t++) if (cnt[t] === 1) return true;
              return false;
          }
        `,
        java: code`
          public static boolean isPossibleToCutPath(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              boolean[][] f = new boolean[m][n], g = new boolean[m][n];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      if (grid[i][j] == 1) f[i][j] = (i == 0 && j == 0) || (i > 0 && f[i - 1][j]) || (j > 0 && f[i][j - 1]);
              for (int i = m - 1; i >= 0; i--)
                  for (int j = n - 1; j >= 0; j--)
                      if (grid[i][j] == 1) g[i][j] = (i == m - 1 && j == n - 1) || (i < m - 1 && g[i + 1][j]) || (j < n - 1 && g[i][j + 1]);
              if (!f[m - 1][n - 1]) return true;
              int[] cnt = new int[m + n - 1];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      if (f[i][j] && g[i][j]) cnt[i + j]++;
              for (int d = 1; d <= m + n - 3; d++) if (cnt[d] == 1) return true;
              return false;
          }
        `,
        cpp: code`
          bool isPossibleToCutPath(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              vector<vector<char>> f(m, vector<char>(n, 0)), g(m, vector<char>(n, 0));
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      if (grid[i][j] == 1) f[i][j] = (i == 0 && j == 0) || (i > 0 && f[i - 1][j]) || (j > 0 && f[i][j - 1]);
              for (int i = m - 1; i >= 0; i--)
                  for (int j = n - 1; j >= 0; j--)
                      if (grid[i][j] == 1) g[i][j] = (i == m - 1 && j == n - 1) || (i < m - 1 && g[i + 1][j]) || (j < n - 1 && g[i][j + 1]);
              if (!f[m - 1][n - 1]) return true;
              vector<int> cnt(m + n - 1, 0);
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      if (f[i][j] && g[i][j]) cnt[i + j]++;
              for (int d = 1; d <= m + n - 3; d++) if (cnt[d] == 1) return true;
              return false;
          }
        `,
        c: code`
          bool isPossibleToCutPath(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0];
              char* f = (char*) calloc((size_t) m * n, 1);
              char* g = (char*) calloc((size_t) m * n, 1);
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      if (grid[i][j] == 1) f[i * n + j] = (i == 0 && j == 0) || (i > 0 && f[(i - 1) * n + j]) || (j > 0 && f[i * n + j - 1]);
              for (int i = m - 1; i >= 0; i--)
                  for (int j = n - 1; j >= 0; j--)
                      if (grid[i][j] == 1) g[i * n + j] = (i == m - 1 && j == n - 1) || (i < m - 1 && g[(i + 1) * n + j]) || (j < n - 1 && g[i * n + j + 1]);
              bool ans = false;
              if (!f[m * n - 1]) ans = true;
              else {
                  int* cnt = (int*) calloc((size_t) (m + n), sizeof(int));
                  for (int i = 0; i < m; i++)
                      for (int j = 0; j < n; j++)
                          if (f[i * n + j] && g[i * n + j]) cnt[i + j]++;
                  for (int d = 1; d <= m + n - 3; d++) if (cnt[d] == 1) ans = true;
                  free(cnt);
              }
              free(f); free(g);
              return ans;
          }
        `,
        csharp: code`
          public static bool IsPossibleToCutPath(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              var f = new bool[m, n];
              var g = new bool[m, n];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      if (grid[i][j] == 1) f[i, j] = (i == 0 && j == 0) || (i > 0 && f[i - 1, j]) || (j > 0 && f[i, j - 1]);
              for (int i = m - 1; i >= 0; i--)
                  for (int j = n - 1; j >= 0; j--)
                      if (grid[i][j] == 1) g[i, j] = (i == m - 1 && j == n - 1) || (i < m - 1 && g[i + 1, j]) || (j < n - 1 && g[i, j + 1]);
              if (!f[m - 1, n - 1]) return true;
              var cnt = new int[m + n - 1];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      if (f[i, j] && g[i, j]) cnt[i + j]++;
              for (int d = 1; d <= m + n - 3; d++) if (cnt[d] == 1) return true;
              return false;
          }
        `,
        go: code`
          func isPossibleToCutPath(grid [][]int) bool {
              m, n := len(grid), len(grid[0])
              f := make([][]bool, m)
              g := make([][]bool, m)
              for i := range f {
                  f[i] = make([]bool, n)
                  g[i] = make([]bool, n)
              }
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      if grid[i][j] == 1 {
                          f[i][j] = (i == 0 && j == 0) || (i > 0 && f[i-1][j]) || (j > 0 && f[i][j-1])
                      }
                  }
              }
              for i := m - 1; i >= 0; i-- {
                  for j := n - 1; j >= 0; j-- {
                      if grid[i][j] == 1 {
                          g[i][j] = (i == m-1 && j == n-1) || (i < m-1 && g[i+1][j]) || (j < n-1 && g[i][j+1])
                      }
                  }
              }
              if !f[m-1][n-1] {
                  return true
              }
              cnt := make([]int, m+n-1)
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      if f[i][j] && g[i][j] {
                          cnt[i+j]++
                      }
                  }
              }
              for d := 1; d <= m+n-3; d++ {
                  if cnt[d] == 1 {
                      return true
                  }
              }
              return false
          }
        `,
        kotlin: code`
          fun isPossibleToCutPath(grid: Array<IntArray>): Boolean {
              val m = grid.size
              val n = grid[0].size
              val f = Array(m) { BooleanArray(n) }
              val g = Array(m) { BooleanArray(n) }
              for (i in 0 until m)
                  for (j in 0 until n)
                      if (grid[i][j] == 1) f[i][j] = (i == 0 && j == 0) || (i > 0 && f[i - 1][j]) || (j > 0 && f[i][j - 1])
              for (i in m - 1 downTo 0)
                  for (j in n - 1 downTo 0)
                      if (grid[i][j] == 1) g[i][j] = (i == m - 1 && j == n - 1) || (i < m - 1 && g[i + 1][j]) || (j < n - 1 && g[i][j + 1])
              if (!f[m - 1][n - 1]) return true
              val cnt = IntArray(m + n - 1)
              for (i in 0 until m)
                  for (j in 0 until n)
                      if (f[i][j] && g[i][j]) cnt[i + j]++
              for (d in 1..m + n - 3) if (cnt[d] == 1) return true
              return false
          }
        `,
        swift: code`
          func isPossibleToCutPath(_ grid: [[Int]]) -> Bool {
              let m = grid.count, n = grid[0].count
              var f = [[Bool]](repeating: [Bool](repeating: false, count: n), count: m)
              var g = f
              for i in 0..<m {
                  for j in 0..<n where grid[i][j] == 1 {
                      f[i][j] = (i == 0 && j == 0) || (i > 0 && f[i - 1][j]) || (j > 0 && f[i][j - 1])
                  }
              }
              for i in stride(from: m - 1, through: 0, by: -1) {
                  for j in stride(from: n - 1, through: 0, by: -1) where grid[i][j] == 1 {
                      g[i][j] = (i == m - 1 && j == n - 1) || (i < m - 1 && g[i + 1][j]) || (j < n - 1 && g[i][j + 1])
                  }
              }
              if !f[m - 1][n - 1] { return true }
              var cnt = [Int](repeating: 0, count: m + n - 1)
              for i in 0..<m {
                  for j in 0..<n where f[i][j] && g[i][j] { cnt[i + j] += 1 }
              }
              var d = 1
              while d <= m + n - 3 {
                  if cnt[d] == 1 { return true }
                  d += 1
              }
              return false
          }
        `,
        rust: code`
          fn isPossibleToCutPath(grid: Vec<Vec<i32>>) -> bool {
              let (m, n) = (grid.len(), grid[0].len());
              let mut f = vec![vec![false; n]; m];
              let mut g = vec![vec![false; n]; m];
              for i in 0..m {
                  for j in 0..n {
                      if grid[i][j] == 1 {
                          f[i][j] = (i == 0 && j == 0) || (i > 0 && f[i - 1][j]) || (j > 0 && f[i][j - 1]);
                      }
                  }
              }
              for i in (0..m).rev() {
                  for j in (0..n).rev() {
                      if grid[i][j] == 1 {
                          g[i][j] = (i == m - 1 && j == n - 1) || (i + 1 < m && g[i + 1][j]) || (j + 1 < n && g[i][j + 1]);
                      }
                  }
              }
              if !f[m - 1][n - 1] {
                  return true;
              }
              let mut cnt = vec![0; m + n - 1];
              for i in 0..m {
                  for j in 0..n {
                      if f[i][j] && g[i][j] {
                          cnt[i + j] += 1;
                      }
                  }
              }
              (1..(m + n).saturating_sub(2)).any(|d| cnt[d] == 1)
          }
        `,
        php: code`
          function isPossibleToCutPath($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $f = array_fill(0, $m, array_fill(0, $n, false));
              $g = $f;
              for ($i = 0; $i < $m; $i++)
                  for ($j = 0; $j < $n; $j++)
                      if ($grid[$i][$j] == 1) $f[$i][$j] = ($i == 0 && $j == 0) || ($i > 0 && $f[$i - 1][$j]) || ($j > 0 && $f[$i][$j - 1]);
              for ($i = $m - 1; $i >= 0; $i--)
                  for ($j = $n - 1; $j >= 0; $j--)
                      if ($grid[$i][$j] == 1) $g[$i][$j] = ($i == $m - 1 && $j == $n - 1) || ($i < $m - 1 && $g[$i + 1][$j]) || ($j < $n - 1 && $g[$i][$j + 1]);
              if (!$f[$m - 1][$n - 1]) return true;
              $cnt = array_fill(0, $m + $n - 1, 0);
              for ($i = 0; $i < $m; $i++)
                  for ($j = 0; $j < $n; $j++)
                      if ($f[$i][$j] && $g[$i][$j]) $cnt[$i + $j]++;
              for ($d = 1; $d <= $m + $n - 3; $d++) if ($cnt[$d] == 1) return true;
              return false;
          }
        `,
        ruby: code`
          def isPossibleToCutPath(grid)
            m = grid.length
            n = grid[0].length
            f = Array.new(m) { Array.new(n, false) }
            g = Array.new(m) { Array.new(n, false) }
            m.times do |i|
              n.times do |j|
                next unless grid[i][j] == 1
                f[i][j] = (i == 0 && j == 0) || (i > 0 && f[i - 1][j]) || (j > 0 && f[i][j - 1])
              end
            end
            (m - 1).downto(0) do |i|
              (n - 1).downto(0) do |j|
                next unless grid[i][j] == 1
                g[i][j] = (i == m - 1 && j == n - 1) || (i < m - 1 && g[i + 1][j]) || (j < n - 1 && g[i][j + 1])
              end
            end
            return true unless f[m - 1][n - 1]
            cnt = Array.new(m + n - 1, 0)
            m.times { |i| n.times { |j| cnt[i + j] += 1 if f[i][j] && g[i][j] } }
            (1..(m + n - 3)).any? { |d| cnt[d] == 1 }
          end
        `,
      },
    };
  })(),

  // ── Collect Coins in a Tree (LC 2603) ───────────────────────────
  (() => {
    const ref = (coins: number[], edges: number[][]) => {
      // For a fixed start r, rooted at r, node v must be visited exactly when
      // its subtree holds a coin at distance >= 2 from v (and r always is):
      // that set is connected and covers every coin. Try every start.
      const n = coins.length;
      const adj = adjOf(n, edges);
      const dist = Array.from({ length: n }, (_, s) => {
        const d = new Array(n).fill(-1);
        d[s] = 0;
        const q = [s];
        for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (d[v] < 0) { d[v] = d[q[h]] + 1; q.push(v); }
        return d;
      });
      let best = Infinity;
      for (let r = 0; r < n; r++) {
        let size = 1;
        for (let v = 0; v < n; v++) {
          if (v === r) continue;
          // c is in v's subtree (rooted at r) iff dist(r, c) = dist(r, v) + dist(v, c).
          let need = false;
          for (let c = 0; c < n && !need; c++) {
            if (coins[c] === 1 && dist[v][c] >= 2 && dist[r][c] === dist[r][v] + dist[v][c]) need = true;
          }
          if (need) size++;
        }
        best = Math.min(best, 2 * (size - 1));
      }
      return best;
    };
    return {
      slug: "collect-coins-in-a-tree",
      title: "Collect Coins in a Tree",
      difficulty: "HARD" as const,
      tags: ["Array", "Tree", "Graph", "Topological Sort", "Google", "Amazon"],
      signature: { funcName: "collectTheCoins", params: [{ name: "coins", type: "int[]" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected tree has `n` nodes numbered `0` to `n - 1`, connected by the `n - 1` edges in `edges`. `coins[i]` is `1` if node `i` holds a coin and `0` otherwise.\n\nYou start at any node you like. You may repeat these actions any number of times:\n\n- collect every coin at distance **at most 2** from your current node, or\n- move to an adjacent node.\n\nReturn the **minimum** number of edge traversals needed to collect all the coins and come back to the node you started from. Traversing the same edge twice counts twice.",
        [
          { in: "coins = [1,0,0,0,0,1], edges = [[0,1],[1,2],[2,3],[3,4],[4,5]]", out: "2", note: "Start at node 2 and collect the coin at node 0; walk to node 3, collect the coin at node 5, and walk back to node 2." },
          { in: "coins = [0,0,0,1,1,0,0,1], edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[5,6],[5,7]]", out: "2", note: "Start at node 0: collect the coins at 3 and 4, go to node 2, collect the coin at 7, and return to node 0." },
          { in: "coins = [1,1,1,1,1,1,1], edges = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]", out: "4", note: "Standing on nodes 2 and 4 covers the whole path; walking 2 → 4 and back costs 4." },
        ],
        ["n == coins.length", "1 <= n <= 3 * 10^4", "0 <= coins[i] <= 1", "edges.length == n - 1", "edges[i].length == 2", "0 <= a, b < n", "a != b", "edges represents a valid tree"]),
      hints: [
        "A leaf without a coin is never worth visiting — delete it, and keep deleting until every leaf holds a coin.",
        "Now every leaf has a coin, but a coin can be collected from two steps away: the walk never needs to enter the current leaves, nor the nodes that become leaves once those are gone. Peel off two more layers of leaves.",
        "The walk must cover every edge that is left exactly twice (there and back), so the answer is `2 × remaining edges` — or 0 if nothing remains.",
      ],
      editorial: explain({
        idea: "The nodes the walk must visit form a subtree, and a closed walk covering a subtree with `k` edges costs exactly `2k`. That subtree is what is left after trimming useless branches: first every coinless leaf, repeatedly, then two rounds of leaves (because coins are collected from distance 2).",
        steps: [
          "Compute degrees; `left = n - 1` counts the remaining edges.",
          "Topological trim: queue every leaf with no coin; popping one removes one edge, and a neighbour that becomes a coinless leaf joins the queue.",
          "Collect the current leaves (all of them hold coins) and remove them, subtracting one edge each.",
          "Every neighbour whose degree drops to exactly 1 is a second-layer leaf: remove it too, subtracting one more edge.",
          "Return `max(2 · left, 0)`.",
        ],
        why: "A coinless leaf contributes nothing, so the optimal walk never goes there. After that every leaf has a coin, and that coin is collected from any node within two steps, so the walk can stop two edges short of every leaf; it cannot stop shorter, because then that coin would be three or more steps away. Every edge of the trimmed subtree must be traversed in both directions in a closed walk, giving `2 · edges`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Trimming can consume the whole tree (few coins close together); the edge count then goes negative and the answer is 0.",
          "In the second phase count a neighbour only when its degree becomes exactly 1, so it is removed once even if several coin leaves hang off it.",
          "The walk must return to its start, so every remaining edge is paid twice.",
        ],
      }),
      examples: [
        { input: "[1,0,0,0,0,1]\n[[0,1],[1,2],[2,3],[3,4],[4,5]]", expectedOutput: "2" },
        { input: "[0,0,0,1,1,0,0,1]\n[[0,1],[0,2],[1,3],[1,4],[2,5],[5,6],[5,7]]", expectedOutput: "2" },
        { input: "[1,1,1,1,1,1,1]\n[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 1, 5) : ri(rng, 8, 26);
        const p = rng() < 0.1 ? 0 : pick(rng, [0.1, 0.2, 0.35, 0.6]);
        const coins = Array.from({ length: n }, () => (rng() < p ? 1 : 0));
        let edges: number[][];
        if (rng() < 0.65) {
          // A path or a caterpillar stretches distances, so the answer grows.
          const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          edges = [];
          for (let i = 1; i < n; i++) edges.push([order[rng() < 0.8 ? i - 1 : ri(rng, 0, i - 1)], order[i]]);
        } else edges = randomTreeEdges(rng, n, 0);
        return { input: `${fmtIntArr(coins)}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(coins, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def collectTheCoins(coins: List[int], edges: List[List[int]]) -> int:
              n = len(coins)
              adj = [[] for _ in range(n)]
              deg = [0] * n
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
                  deg[a] += 1
                  deg[b] += 1
              left = n - 1
              q = [v for v in range(n) if deg[v] == 1 and coins[v] == 0]
              while q:
                  x = q.pop()
                  left -= 1
                  for y in adj[x]:
                      deg[y] -= 1
                      if deg[y] == 1 and coins[y] == 0:
                          q.append(y)
              leaves = [v for v in range(n) if deg[v] == 1 and coins[v] == 1]
              left -= len(leaves)
              for x in leaves:
                  for y in adj[x]:
                      deg[y] -= 1
                      if deg[y] == 1:
                          left -= 1
              return max(2 * left, 0)
        `,
        javascript: code`
          var collectTheCoins = function(coins, edges) {
              var n = coins.length;
              var adj = [], deg = [];
              for (var i = 0; i < n; i++) { adj.push([]); deg.push(0); }
              for (var e = 0; e < edges.length; e++) {
                  var a = edges[e][0], b = edges[e][1];
                  adj[a].push(b); adj[b].push(a); deg[a]++; deg[b]++;
              }
              var left = n - 1, q = [];
              for (var v = 0; v < n; v++) if (deg[v] === 1 && coins[v] === 0) q.push(v);
              while (q.length > 0) {
                  var x = q.pop();
                  left--;
                  for (var k = 0; k < adj[x].length; k++) {
                      var y = adj[x][k];
                      deg[y]--;
                      if (deg[y] === 1 && coins[y] === 0) q.push(y);
                  }
              }
              var leaves = [];
              for (var w = 0; w < n; w++) if (deg[w] === 1 && coins[w] === 1) leaves.push(w);
              left -= leaves.length;
              for (var t = 0; t < leaves.length; t++) {
                  var lf = leaves[t];
                  for (var k2 = 0; k2 < adj[lf].length; k2++) {
                      var z = adj[lf][k2];
                      deg[z]--;
                      if (deg[z] === 1) left--;
                  }
              }
              return Math.max(2 * left, 0);
          };
        `,
        typescript: code`
          function collectTheCoins(coins: number[], edges: number[][]): number {
              var n = coins.length;
              var adj: number[][] = [], deg: number[] = [];
              for (var i = 0; i < n; i++) { adj.push([]); deg.push(0); }
              for (var e = 0; e < edges.length; e++) {
                  var a = edges[e][0], b = edges[e][1];
                  adj[a].push(b); adj[b].push(a); deg[a]++; deg[b]++;
              }
              var left = n - 1, q: number[] = [];
              for (var v = 0; v < n; v++) if (deg[v] === 1 && coins[v] === 0) q.push(v);
              while (q.length > 0) {
                  var x = q.pop() as number;
                  left--;
                  for (var k = 0; k < adj[x].length; k++) {
                      var y = adj[x][k];
                      deg[y]--;
                      if (deg[y] === 1 && coins[y] === 0) q.push(y);
                  }
              }
              var leaves: number[] = [];
              for (var w = 0; w < n; w++) if (deg[w] === 1 && coins[w] === 1) leaves.push(w);
              left -= leaves.length;
              for (var t = 0; t < leaves.length; t++) {
                  var lf = leaves[t];
                  for (var k2 = 0; k2 < adj[lf].length; k2++) {
                      var z = adj[lf][k2];
                      deg[z]--;
                      if (deg[z] === 1) left--;
                  }
              }
              return Math.max(2 * left, 0);
          }
        `,
        java: code`
          public static int collectTheCoins(int[] coins, int[][] edges) {
              int n = coins.length;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              int[] deg = new int[n];
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); deg[e[0]]++; deg[e[1]]++; }
              int left = n - 1;
              ArrayDeque<Integer> q = new ArrayDeque<>();
              for (int v = 0; v < n; v++) if (deg[v] == 1 && coins[v] == 0) q.push(v);
              while (!q.isEmpty()) {
                  int x = q.pop();
                  left--;
                  for (int y : adj.get(x)) {
                      deg[y]--;
                      if (deg[y] == 1 && coins[y] == 0) q.push(y);
                  }
              }
              List<Integer> leaves = new ArrayList<>();
              for (int v = 0; v < n; v++) if (deg[v] == 1 && coins[v] == 1) leaves.add(v);
              left -= leaves.size();
              for (int x : leaves) {
                  for (int y : adj.get(x)) {
                      deg[y]--;
                      if (deg[y] == 1) left--;
                  }
              }
              return Math.max(2 * left, 0);
          }
        `,
        cpp: code`
          int collectTheCoins(vector<int>& coins, vector<vector<int>>& edges) {
              int n = coins.size();
              vector<vector<int>> adj(n);
              vector<int> deg(n, 0);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); deg[e[0]]++; deg[e[1]]++; }
              int left = n - 1;
              vector<int> q;
              for (int v = 0; v < n; v++) if (deg[v] == 1 && coins[v] == 0) q.push_back(v);
              while (!q.empty()) {
                  int x = q.back();
                  q.pop_back();
                  left--;
                  for (int y : adj[x]) {
                      deg[y]--;
                      if (deg[y] == 1 && coins[y] == 0) q.push_back(y);
                  }
              }
              vector<int> leaves;
              for (int v = 0; v < n; v++) if (deg[v] == 1 && coins[v] == 1) leaves.push_back(v);
              left -= leaves.size();
              for (int x : leaves) {
                  for (int y : adj[x]) {
                      deg[y]--;
                      if (deg[y] == 1) left--;
                  }
              }
              return max(2 * left, 0);
          }
        `,
        c: code`
          int collectTheCoins(int* coins, int coinsSize, int** edges, int edgesSize, int* edgesColSize) {
              int n = coinsSize;
              int* head = (int*) malloc((size_t) n * sizeof(int));
              int* nxt = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int* to = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int* deg = (int*) calloc((size_t) n, sizeof(int));
              int* q = (int*) malloc((size_t) n * sizeof(int));
              int ec = 0, sp = 0;
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < edgesSize; e++) {
                  int a = edges[e][0], b = edges[e][1];
                  to[ec] = b; nxt[ec] = head[a]; head[a] = ec++;
                  to[ec] = a; nxt[ec] = head[b]; head[b] = ec++;
                  deg[a]++; deg[b]++;
              }
              int left = n - 1;
              for (int v = 0; v < n; v++) if (deg[v] == 1 && coins[v] == 0) q[sp++] = v;
              while (sp > 0) {
                  int x = q[--sp];
                  left--;
                  for (int e = head[x]; e != -1; e = nxt[e]) {
                      int y = to[e];
                      deg[y]--;
                      if (deg[y] == 1 && coins[y] == 0) q[sp++] = y;
                  }
              }
              int cnt = 0;
              for (int v = 0; v < n; v++) if (deg[v] == 1 && coins[v] == 1) q[cnt++] = v;
              left -= cnt;
              for (int t = 0; t < cnt; t++) {
                  for (int e = head[q[t]]; e != -1; e = nxt[e]) {
                      int y = to[e];
                      deg[y]--;
                      if (deg[y] == 1) left--;
                  }
              }
              free(head); free(nxt); free(to); free(deg); free(q);
              return left > 0 ? 2 * left : 0;
          }
        `,
        csharp: code`
          public static int CollectTheCoins(int[] coins, int[][] edges)
          {
              int n = coins.Length;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              var deg = new int[n];
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); deg[e[0]]++; deg[e[1]]++; }
              int left = n - 1;
              var q = new Stack<int>();
              for (int v = 0; v < n; v++) if (deg[v] == 1 && coins[v] == 0) q.Push(v);
              while (q.Count > 0)
              {
                  int x = q.Pop();
                  left--;
                  foreach (int y in adj[x])
                  {
                      deg[y]--;
                      if (deg[y] == 1 && coins[y] == 0) q.Push(y);
                  }
              }
              var leaves = new List<int>();
              for (int v = 0; v < n; v++) if (deg[v] == 1 && coins[v] == 1) leaves.Add(v);
              left -= leaves.Count;
              foreach (int x in leaves)
              {
                  foreach (int y in adj[x])
                  {
                      deg[y]--;
                      if (deg[y] == 1) left--;
                  }
              }
              return Math.Max(2 * left, 0);
          }
        `,
        go: code`
          func collectTheCoins(coins []int, edges [][]int) int {
              n := len(coins)
              adj := make([][]int, n)
              deg := make([]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], e[1])
                  adj[e[1]] = append(adj[e[1]], e[0])
                  deg[e[0]]++
                  deg[e[1]]++
              }
              left := n - 1
              q := []int{}
              for v := 0; v < n; v++ {
                  if deg[v] == 1 && coins[v] == 0 {
                      q = append(q, v)
                  }
              }
              for len(q) > 0 {
                  x := q[len(q)-1]
                  q = q[:len(q)-1]
                  left--
                  for _, y := range adj[x] {
                      deg[y]--
                      if deg[y] == 1 && coins[y] == 0 {
                          q = append(q, y)
                      }
                  }
              }
              leaves := []int{}
              for v := 0; v < n; v++ {
                  if deg[v] == 1 && coins[v] == 1 {
                      leaves = append(leaves, v)
                  }
              }
              left -= len(leaves)
              for _, x := range leaves {
                  for _, y := range adj[x] {
                      deg[y]--
                      if deg[y] == 1 {
                          left--
                      }
                  }
              }
              if left < 0 {
                  return 0
              }
              return 2 * left
          }
        `,
        kotlin: code`
          fun collectTheCoins(coins: IntArray, edges: Array<IntArray>): Int {
              val n = coins.size
              val adj = Array(n) { ArrayList<Int>() }
              val deg = IntArray(n)
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]); deg[e[0]]++; deg[e[1]]++ }
              var left = n - 1
              val q = ArrayList<Int>()
              for (v in 0 until n) if (deg[v] == 1 && coins[v] == 0) q.add(v)
              while (q.isNotEmpty()) {
                  val x = q.removeAt(q.size - 1)
                  left--
                  for (y in adj[x]) {
                      deg[y]--
                      if (deg[y] == 1 && coins[y] == 0) q.add(y)
                  }
              }
              val leaves = (0 until n).filter { deg[it] == 1 && coins[it] == 1 }
              left -= leaves.size
              for (x in leaves) {
                  for (y in adj[x]) {
                      deg[y]--
                      if (deg[y] == 1) left--
                  }
              }
              return maxOf(2 * left, 0)
          }
        `,
        swift: code`
          func collectTheCoins(_ coins: [Int], _ edges: [[Int]]) -> Int {
              let n = coins.count
              var adj = [[Int]](repeating: [], count: n)
              var deg = [Int](repeating: 0, count: n)
              for e in edges {
                  adj[e[0]].append(e[1]); adj[e[1]].append(e[0])
                  deg[e[0]] += 1; deg[e[1]] += 1
              }
              var left = n - 1
              var q = (0..<n).filter { deg[$0] == 1 && coins[$0] == 0 }
              while let x = q.popLast() {
                  left -= 1
                  for y in adj[x] {
                      deg[y] -= 1
                      if deg[y] == 1 && coins[y] == 0 { q.append(y) }
                  }
              }
              let leaves = (0..<n).filter { deg[$0] == 1 && coins[$0] == 1 }
              left -= leaves.count
              for x in leaves {
                  for y in adj[x] {
                      deg[y] -= 1
                      if deg[y] == 1 { left -= 1 }
                  }
              }
              return max(2 * left, 0)
          }
        `,
        rust: code`
          fn collectTheCoins(coins: Vec<i32>, edges: Vec<Vec<i32>>) -> i32 {
              let n = coins.len();
              let mut adj = vec![Vec::new(); n];
              let mut deg = vec![0i32; n];
              for e in edges.iter() {
                  let (a, b) = (e[0] as usize, e[1] as usize);
                  adj[a].push(b);
                  adj[b].push(a);
                  deg[a] += 1;
                  deg[b] += 1;
              }
              let mut left = n as i32 - 1;
              let mut q: Vec<usize> = (0..n).filter(|&v| deg[v] == 1 && coins[v] == 0).collect();
              while let Some(x) = q.pop() {
                  left -= 1;
                  for &y in adj[x].iter() {
                      deg[y] -= 1;
                      if deg[y] == 1 && coins[y] == 0 {
                          q.push(y);
                      }
                  }
              }
              let leaves: Vec<usize> = (0..n).filter(|&v| deg[v] == 1 && coins[v] == 1).collect();
              left -= leaves.len() as i32;
              for &x in leaves.iter() {
                  for &y in adj[x].iter() {
                      deg[y] -= 1;
                      if deg[y] == 1 {
                          left -= 1;
                      }
                  }
              }
              std::cmp::max(2 * left, 0)
          }
        `,
        php: code`
          function collectTheCoins($coins, $edges) {
              $n = count($coins);
              $adj = array_fill(0, $n, []);
              $deg = array_fill(0, $n, 0);
              foreach ($edges as [$a, $b]) { $adj[$a][] = $b; $adj[$b][] = $a; $deg[$a]++; $deg[$b]++; }
              $left = $n - 1;
              $q = [];
              for ($v = 0; $v < $n; $v++) if ($deg[$v] == 1 && $coins[$v] == 0) $q[] = $v;
              while ($q) {
                  $x = array_pop($q);
                  $left--;
                  foreach ($adj[$x] as $y) {
                      $deg[$y]--;
                      if ($deg[$y] == 1 && $coins[$y] == 0) $q[] = $y;
                  }
              }
              $leaves = [];
              for ($v = 0; $v < $n; $v++) if ($deg[$v] == 1 && $coins[$v] == 1) $leaves[] = $v;
              $left -= count($leaves);
              foreach ($leaves as $x) {
                  foreach ($adj[$x] as $y) {
                      $deg[$y]--;
                      if ($deg[$y] == 1) $left--;
                  }
              }
              return max(2 * $left, 0);
          }
        `,
        ruby: code`
          def collectTheCoins(coins, edges)
            n = coins.length
            adj = Array.new(n) { [] }
            deg = Array.new(n, 0)
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
              deg[a] += 1
              deg[b] += 1
            end
            left = n - 1
            q = (0...n).select { |v| deg[v] == 1 && coins[v] == 0 }
            until q.empty?
              x = q.pop
              left -= 1
              adj[x].each do |y|
                deg[y] -= 1
                q << y if deg[y] == 1 && coins[y] == 0
              end
            end
            leaves = (0...n).select { |v| deg[v] == 1 && coins[v] == 1 }
            left -= leaves.length
            leaves.each do |x|
              adj[x].each do |y|
                deg[y] -= 1
                left -= 1 if deg[y] == 1
              end
            end
            [2 * left, 0].max
          end
        `,
      },
    };
  })(),

  // ── Minimum Reverse Operations (LC 2612) ────────────────────────
  (() => {
    const ref = (n: number, p: number, banned: number[], k: number) => {
      // Plain BFS that tries every window of length k containing the 1.
      const bad = new Set(banned);
      const ans = new Array(n).fill(-1);
      ans[p] = 0;
      const q = [p];
      for (let h = 0; h < q.length; h++) {
        const i = q[h];
        for (let L = Math.max(0, i - k + 1); L <= Math.min(n - k, i); L++) {
          const j = 2 * L + k - 1 - i;
          if (!bad.has(j) && ans[j] < 0) { ans[j] = ans[i] + 1; q.push(j); }
        }
      }
      return ans;
    };
    return {
      slug: "minimum-reverse-operations",
      title: "Minimum Reverse Operations",
      difficulty: "HARD" as const,
      tags: ["Array", "Breadth-First Search", "Ordered Set", "Union Find", "Google", "Amazon"],
      signature: {
        funcName: "minReverseOperations",
        params: [{ name: "n", type: "int" as const }, { name: "p", type: "int" as const }, { name: "banned", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "An array `arr` of length `n` is all zeros except `arr[p] = 1`. The positions listed in `banned` are forbidden for the `1` (`p` itself is never banned).\n\nIn one operation you choose a contiguous subarray of length exactly `k` and reverse it — but only if, afterwards, the `1` does not sit on a banned position.\n\nReturn an array `ans` of length `n` where `ans[i]` is the **minimum** number of operations that bring the `1` to position `i`, or `-1` if that is impossible.",
        [
          { in: "n = 4, p = 0, banned = [1,2], k = 4", out: "[0,-1,-1,1]", note: "Reversing the whole array moves the 1 from 0 to 3. Positions 1 and 2 are banned." },
          { in: "n = 5, p = 0, banned = [2,4], k = 3", out: "[0,-1,-1,-1,-1]", note: "From 0 the only length-3 window is [0..2], which would land the 1 on banned 2." },
          { in: "n = 4, p = 2, banned = [0,1,3], k = 1", out: "[-1,-1,0,-1]", note: "Reversing a single element moves nothing." },
        ],
        ["1 <= n <= 10^5", "0 <= p <= n - 1", "0 <= banned.length <= n - 1", "0 <= banned[i] <= n - 1", "1 <= k <= n", "banned[i] != p", "all values in banned are unique"]),
      hints: [
        "Reversing the window `[L, L + k - 1]` that contains the 1 at `i` sends it to `2L + k - 1 - i`. Every operation costs 1, so this is a BFS over positions.",
        "From `i` the reachable positions form an arithmetic range with step 2: from `max(i - k + 1, k - 1 - i)` to `min(i + k - 1, 2n - k - 1 - i)`. Trying every window is `O(nk)` — too slow.",
        "Each position needs to be discovered only once. Keep the still-unvisited positions of each parity in a structure that jumps straight to the next unvisited one (a sorted set, or a 'next pointer' union-find), and delete positions as you visit them.",
      ],
      editorial: explain({
        idea: "The moves from position `i` reach every position of one parity inside a contiguous range, and BFS only needs to touch each position the first time it is discovered. A union-find 'next unvisited' pointer per parity lets each BFS step skip straight over positions already visited or banned, so the whole search is near-linear.",
        steps: [
          "Let `nxt[x] = x` for every `x` in `0 .. n + 1`; removing `x` means `nxt[x] = x + 2` (the next index of the same parity). `n` and `n + 1` are never removed.",
          "Remove `p` and every banned position. Set `ans[p] = 0` and queue `p`.",
          "Pop `i`. Compute `lo = max(i - k + 1, k - 1 - i)` and `hi = min(i + k - 1, 2n - k - 1 - i)`.",
          "Walk `x = find(lo)` while `x <= hi`: set `ans[x] = ans[i] + 1`, queue it, remove it, then `x = find(x + 2)`.",
          "Positions never reached keep `-1`.",
        ],
        why: "The window start `L` ranges over `max(0, i - k + 1) .. min(n - k, i)`, and the landing spot `2L + k - 1 - i` moves by 2 as `L` grows, so the reachable set is exactly every second position between `lo` and `hi`. BFS order gives each position its minimum number of operations, and removing a position the moment it is reached (or from the start, if banned) means `find` never returns it again.",
        time: "O(n α(n))",
        space: "O(n)",
        pitfalls: [
          "Both ends of the range are clipped by the array edges, which is where `k - 1 - i` and `2n - k - 1 - i` come from.",
          "Banned positions must never be entered, but they do not block reaching positions beyond them.",
          "Keep two sentinels (`n` and `n + 1`) so `find` always stops inside the array of pointers.",
        ],
      }),
      examples: [
        { input: "4\n0\n[1,2]\n4", expectedOutput: "[0,-1,-1,1]" },
        { input: "5\n0\n[2,4]\n3", expectedOutput: "[0,-1,-1,-1,-1]" },
        { input: "4\n2\n[0,1,3]\n1", expectedOutput: "[-1,-1,0,-1]" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.15 ? ri(rng, 1, 4) : ri(rng, 5, 40);
        const p = ri(rng, 0, n - 1);
        const others = shuffle(rng, Array.from({ length: n }, (_, i) => i).filter((i) => i !== p));
        const banned = others.slice(0, ri(rng, 0, Math.floor(others.length * pick(rng, [0, 0.1, 0.3, 0.7]))));
        const k = ri(rng, 1, n);
        return { input: `${n}\n${p}\n${fmtIntArr(banned)}\n${k}`, expectedOutput: fmtIntArr(ref(n, p, banned, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def minReverseOperations(n: int, p: int, banned: List[int], k: int) -> List[int]:
              nxt = list(range(n + 2))

              def find(x):
                  root = x
                  while nxt[root] != root:
                      root = nxt[root]
                  while nxt[x] != root:
                      nxt[x], x = root, nxt[x]
                  return root

              def remove(x):
                  nxt[x] = x + 2

              ans = [-1] * n
              ans[p] = 0
              remove(p)
              for b in banned:
                  remove(b)
              q = deque([p])
              while q:
                  i = q.popleft()
                  lo = max(i - k + 1, k - 1 - i)
                  hi = min(i + k - 1, 2 * n - k - 1 - i)
                  x = find(lo)
                  while x <= hi:
                      ans[x] = ans[i] + 1
                      q.append(x)
                      remove(x)
                      x = find(x + 2)
              return ans
        `,
        javascript: code`
          var minReverseOperations = function(n, p, banned, k) {
              var nxt = new Array(n + 2);
              for (var i = 0; i < n + 2; i++) nxt[i] = i;
              var find = function(x) {
                  var root = x;
                  while (nxt[root] !== root) root = nxt[root];
                  while (nxt[x] !== root) { var t = nxt[x]; nxt[x] = root; x = t; }
                  return root;
              };
              var ans = new Array(n);
              for (var j = 0; j < n; j++) ans[j] = -1;
              ans[p] = 0;
              nxt[p] = p + 2;
              for (var b = 0; b < banned.length; b++) nxt[banned[b]] = banned[b] + 2;
              var q = [p];
              for (var h = 0; h < q.length; h++) {
                  var cur = q[h];
                  var lo = Math.max(cur - k + 1, k - 1 - cur), hi = Math.min(cur + k - 1, 2 * n - k - 1 - cur);
                  var x = find(lo);
                  while (x <= hi) {
                      ans[x] = ans[cur] + 1;
                      q.push(x);
                      nxt[x] = x + 2;
                      x = find(x + 2);
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function minReverseOperations(n: number, p: number, banned: number[], k: number): number[] {
              var nxt: number[] = [];
              for (var i = 0; i < n + 2; i++) nxt.push(i);
              var find = function(x: number): number {
                  var root = x;
                  while (nxt[root] !== root) root = nxt[root];
                  while (nxt[x] !== root) { var t = nxt[x]; nxt[x] = root; x = t; }
                  return root;
              };
              var ans: number[] = [];
              for (var j = 0; j < n; j++) ans.push(-1);
              ans[p] = 0;
              nxt[p] = p + 2;
              for (var b = 0; b < banned.length; b++) nxt[banned[b]] = banned[b] + 2;
              var q: number[] = [p];
              for (var h = 0; h < q.length; h++) {
                  var cur = q[h];
                  var lo = Math.max(cur - k + 1, k - 1 - cur), hi = Math.min(cur + k - 1, 2 * n - k - 1 - cur);
                  var x = find(lo);
                  while (x <= hi) {
                      ans[x] = ans[cur] + 1;
                      q.push(x);
                      nxt[x] = x + 2;
                      x = find(x + 2);
                  }
              }
              return ans;
          }
        `,
        java: code`
          static int[] nxtPtr;

          static int findNext(int x) {
              int root = x;
              while (nxtPtr[root] != root) root = nxtPtr[root];
              while (nxtPtr[x] != root) { int t = nxtPtr[x]; nxtPtr[x] = root; x = t; }
              return root;
          }

          public static int[] minReverseOperations(int n, int p, int[] banned, int k) {
              nxtPtr = new int[n + 2];
              for (int i = 0; i < n + 2; i++) nxtPtr[i] = i;
              int[] ans = new int[n];
              Arrays.fill(ans, -1);
              ans[p] = 0;
              nxtPtr[p] = p + 2;
              for (int b : banned) nxtPtr[b] = b + 2;
              int[] q = new int[n];
              int head = 0, tail = 0;
              q[tail++] = p;
              while (head < tail) {
                  int cur = q[head++];
                  int lo = Math.max(cur - k + 1, k - 1 - cur), hi = Math.min(cur + k - 1, 2 * n - k - 1 - cur);
                  for (int x = findNext(lo); x <= hi; x = findNext(x + 2)) {
                      ans[x] = ans[cur] + 1;
                      q[tail++] = x;
                      nxtPtr[x] = x + 2;
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> minReverseOperations(int n, int p, vector<int>& banned, int k) {
              vector<int> nxt(n + 2);
              iota(nxt.begin(), nxt.end(), 0);
              auto find = [&](int x) {
                  int root = x;
                  while (nxt[root] != root) root = nxt[root];
                  while (nxt[x] != root) { int t = nxt[x]; nxt[x] = root; x = t; }
                  return root;
              };
              vector<int> ans(n, -1);
              ans[p] = 0;
              nxt[p] = p + 2;
              for (int b : banned) nxt[b] = b + 2;
              vector<int> q = {p};
              for (size_t h = 0; h < q.size(); h++) {
                  int cur = q[h];
                  int lo = max(cur - k + 1, k - 1 - cur), hi = min(cur + k - 1, 2 * n - k - 1 - cur);
                  for (int x = find(lo); x <= hi; x = find(x + 2)) {
                      ans[x] = ans[cur] + 1;
                      q.push_back(x);
                      nxt[x] = x + 2;
                  }
              }
              return ans;
          }
        `,
        c: code`
          static int* g_nxt;

          static int findNext(int x) {
              int root = x;
              while (g_nxt[root] != root) root = g_nxt[root];
              while (g_nxt[x] != root) { int t = g_nxt[x]; g_nxt[x] = root; x = t; }
              return root;
          }

          int* minReverseOperations(int n, int p, int* banned, int bannedSize, int k, int* returnSize) {
              g_nxt = (int*) malloc((size_t) (n + 2) * sizeof(int));
              for (int i = 0; i < n + 2; i++) g_nxt[i] = i;
              int* ans = (int*) malloc((size_t) n * sizeof(int));
              int* q = (int*) malloc((size_t) n * sizeof(int));
              for (int i = 0; i < n; i++) ans[i] = -1;
              ans[p] = 0;
              g_nxt[p] = p + 2;
              for (int b = 0; b < bannedSize; b++) g_nxt[banned[b]] = banned[b] + 2;
              int head = 0, tail = 0;
              q[tail++] = p;
              while (head < tail) {
                  int cur = q[head++];
                  int lo = cur - k + 1 > k - 1 - cur ? cur - k + 1 : k - 1 - cur;
                  int hi = cur + k - 1 < 2 * n - k - 1 - cur ? cur + k - 1 : 2 * n - k - 1 - cur;
                  for (int x = findNext(lo); x <= hi; x = findNext(x + 2)) {
                      ans[x] = ans[cur] + 1;
                      q[tail++] = x;
                      g_nxt[x] = x + 2;
                  }
              }
              free(g_nxt); free(q);
              *returnSize = n;
              return ans;
          }
        `,
        csharp: code`
          static int[] nxtPtr;

          static int FindNext(int x)
          {
              int root = x;
              while (nxtPtr[root] != root) root = nxtPtr[root];
              while (nxtPtr[x] != root) { int t = nxtPtr[x]; nxtPtr[x] = root; x = t; }
              return root;
          }

          public static int[] MinReverseOperations(int n, int p, int[] banned, int k)
          {
              nxtPtr = new int[n + 2];
              for (int i = 0; i < n + 2; i++) nxtPtr[i] = i;
              var ans = new int[n];
              for (int i = 0; i < n; i++) ans[i] = -1;
              ans[p] = 0;
              nxtPtr[p] = p + 2;
              foreach (int b in banned) nxtPtr[b] = b + 2;
              var q = new int[n];
              int head = 0, tail = 0;
              q[tail++] = p;
              while (head < tail)
              {
                  int cur = q[head++];
                  int lo = Math.Max(cur - k + 1, k - 1 - cur), hi = Math.Min(cur + k - 1, 2 * n - k - 1 - cur);
                  for (int x = FindNext(lo); x <= hi; x = FindNext(x + 2))
                  {
                      ans[x] = ans[cur] + 1;
                      q[tail++] = x;
                      nxtPtr[x] = x + 2;
                  }
              }
              return ans;
          }
        `,
        go: code`
          func minReverseOperations(n int, p int, banned []int, k int) []int {
              nxt := make([]int, n+2)
              for i := range nxt {
                  nxt[i] = i
              }
              find := func(x int) int {
                  root := x
                  for nxt[root] != root {
                      root = nxt[root]
                  }
                  for nxt[x] != root {
                      nxt[x], x = root, nxt[x]
                  }
                  return root
              }
              ans := make([]int, n)
              for i := range ans {
                  ans[i] = -1
              }
              ans[p] = 0
              nxt[p] = p + 2
              for _, b := range banned {
                  nxt[b] = b + 2
              }
              q := []int{p}
              for h := 0; h < len(q); h++ {
                  cur := q[h]
                  lo, hi := cur-k+1, cur+k-1
                  if k-1-cur > lo {
                      lo = k - 1 - cur
                  }
                  if 2*n-k-1-cur < hi {
                      hi = 2*n - k - 1 - cur
                  }
                  for x := find(lo); x <= hi; x = find(x + 2) {
                      ans[x] = ans[cur] + 1
                      q = append(q, x)
                      nxt[x] = x + 2
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun minReverseOperations(n: Int, p: Int, banned: IntArray, k: Int): IntArray {
              val nxt = IntArray(n + 2) { it }
              fun find(start: Int): Int {
                  var root = start
                  while (nxt[root] != root) root = nxt[root]
                  var x = start
                  while (nxt[x] != root) { val t = nxt[x]; nxt[x] = root; x = t }
                  return root
              }
              val ans = IntArray(n) { -1 }
              ans[p] = 0
              nxt[p] = p + 2
              for (b in banned) nxt[b] = b + 2
              val q = IntArray(n)
              var head = 0
              var tail = 0
              q[tail++] = p
              while (head < tail) {
                  val cur = q[head++]
                  val lo = maxOf(cur - k + 1, k - 1 - cur)
                  val hi = minOf(cur + k - 1, 2 * n - k - 1 - cur)
                  var x = find(lo)
                  while (x <= hi) {
                      ans[x] = ans[cur] + 1
                      q[tail++] = x
                      nxt[x] = x + 2
                      x = find(x + 2)
                  }
              }
              return ans
          }
        `,
        swift: code`
          func minReverseOperations(_ n: Int, _ p: Int, _ banned: [Int], _ k: Int) -> [Int] {
              var nxt = Array(0..<(n + 2))
              func find(_ start: Int) -> Int {
                  var root = start
                  while nxt[root] != root { root = nxt[root] }
                  var x = start
                  while nxt[x] != root { let t = nxt[x]; nxt[x] = root; x = t }
                  return root
              }
              var ans = [Int](repeating: -1, count: n)
              ans[p] = 0
              nxt[p] = p + 2
              for b in banned { nxt[b] = b + 2 }
              var q = [p]
              var h = 0
              while h < q.count {
                  let cur = q[h]
                  h += 1
                  let lo = max(cur - k + 1, k - 1 - cur), hi = min(cur + k - 1, 2 * n - k - 1 - cur)
                  var x = find(lo)
                  while x <= hi {
                      ans[x] = ans[cur] + 1
                      q.append(x)
                      nxt[x] = x + 2
                      x = find(x + 2)
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn find_next(nxt: &mut Vec<usize>, start: usize) -> usize {
              let mut root = start;
              while nxt[root] != root {
                  root = nxt[root];
              }
              let mut x = start;
              while nxt[x] != root {
                  let t = nxt[x];
                  nxt[x] = root;
                  x = t;
              }
              root
          }

          fn minReverseOperations(n: i32, p: i32, banned: Vec<i32>, k: i32) -> Vec<i32> {
              let (nu, pu) = (n as usize, p as usize);
              let mut nxt: Vec<usize> = (0..nu + 2).collect();
              let mut ans = vec![-1i32; nu];
              ans[pu] = 0;
              nxt[pu] = pu + 2;
              for &b in banned.iter() {
                  nxt[b as usize] = b as usize + 2;
              }
              let mut q = vec![pu];
              let mut h = 0;
              while h < q.len() {
                  let cur = q[h] as i32;
                  h += 1;
                  let lo = std::cmp::max(cur - k + 1, k - 1 - cur) as usize;
                  let hi = std::cmp::min(cur + k - 1, 2 * n - k - 1 - cur);
                  let mut x = find_next(&mut nxt, lo);
                  while (x as i32) <= hi {
                      ans[x] = ans[cur as usize] + 1;
                      q.push(x);
                      nxt[x] = x + 2;
                      x = find_next(&mut nxt, x + 2);
                  }
              }
              ans
          }
        `,
        php: code`
          function minReverseOperations($n, $p, $banned, $k) {
              $nxt = range(0, $n + 1);
              $find = function ($x) use (&$nxt) {
                  $root = $x;
                  while ($nxt[$root] != $root) $root = $nxt[$root];
                  while ($nxt[$x] != $root) { $t = $nxt[$x]; $nxt[$x] = $root; $x = $t; }
                  return $root;
              };
              $ans = array_fill(0, $n, -1);
              $ans[$p] = 0;
              $nxt[$p] = $p + 2;
              foreach ($banned as $b) $nxt[$b] = $b + 2;
              $q = [$p];
              for ($h = 0; $h < count($q); $h++) {
                  $cur = $q[$h];
                  $lo = max($cur - $k + 1, $k - 1 - $cur);
                  $hi = min($cur + $k - 1, 2 * $n - $k - 1 - $cur);
                  for ($x = $find($lo); $x <= $hi; $x = $find($x + 2)) {
                      $ans[$x] = $ans[$cur] + 1;
                      $q[] = $x;
                      $nxt[$x] = $x + 2;
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def minReverseOperations(n, p, banned, k)
            nxt = (0..n + 1).to_a
            find = lambda do |start|
              root = start
              root = nxt[root] while nxt[root] != root
              x = start
              while nxt[x] != root
                t = nxt[x]
                nxt[x] = root
                x = t
              end
              root
            end
            ans = Array.new(n, -1)
            ans[p] = 0
            nxt[p] = p + 2
            banned.each { |b| nxt[b] = b + 2 }
            q = [p]
            h = 0
            while h < q.length
              cur = q[h]
              h += 1
              lo = [cur - k + 1, k - 1 - cur].max
              hi = [cur + k - 1, 2 * n - k - 1 - cur].min
              x = find.call(lo)
              while x <= hi
                ans[x] = ans[cur] + 1
                q << x
                nxt[x] = x + 2
                x = find.call(x + 2)
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Visited Cells in a Grid (LC 2617) ─────────
  (() => {
    const ref = (grid: number[][]) => {
      // Plain BFS over every allowed jump.
      const m = grid.length, n = grid[0].length;
      const d = grid.map((row) => row.map(() => -1));
      d[0][0] = 1;
      const q: number[][] = [[0, 0]];
      for (let h = 0; h < q.length; h++) {
        const [i, j] = q[h];
        const g = grid[i][j];
        for (let k = j + 1; k <= Math.min(n - 1, j + g); k++) if (d[i][k] < 0) { d[i][k] = d[i][j] + 1; q.push([i, k]); }
        for (let k = i + 1; k <= Math.min(m - 1, i + g); k++) if (d[k][j] < 0) { d[k][j] = d[i][j] + 1; q.push([k, j]); }
      }
      return d[m - 1][n - 1];
    };
    return {
      slug: "minimum-number-of-visited-cells-in-a-grid",
      title: "Minimum Number of Visited Cells in a Grid",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Stack", "Breadth-First Search", "Union Find", "Heap (Priority Queue)", "Matrix", "Google", "Amazon"],
      signature: { funcName: "minimumVisitedCells", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` matrix `grid` of non-negative integers and start in the top-left cell `(0, 0)`.\n\nFrom a cell `(i, j)` you may jump:\n\n- **right** to any cell `(i, k)` with `j < k <= grid[i][j] + j`, or\n- **down** to any cell `(k, j)` with `i < k <= grid[i][j] + i`.\n\nReturn the **minimum number of cells you visit** on the way to the bottom-right cell `(m - 1, n - 1)`, counting both the starting and the final cell. If it cannot be reached, return `-1`.",
        [
          { in: "grid = [[3,4,2,1],[4,2,3,1],[2,1,0,0],[2,4,0,0]]", out: "4", note: "One shortest route is (0,0) → (0,1) → (3,1) → (3,3): four cells." },
          { in: "grid = [[3,4,2,1],[4,2,1,1],[2,1,1,0],[3,4,1,0]]", out: "3", note: "(0,0) → (3,0) → (3,3)." },
          { in: "grid = [[2,1,0],[1,0,0]]", out: "-1", note: "Every route stalls on a 0 before the corner." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 10^5", "1 <= m * n <= 10^5", "0 <= grid[i][j] < m * n", "grid[m - 1][n - 1] == 0"]),
      hints: [
        "Each jump costs one more visited cell regardless of its length, so this is a shortest path in an unweighted graph: BFS from `(0, 0)`.",
        "A cell can jump to up to `m + n` others, so scanning every target from every cell is `O(mn(m + n))`. But once a cell has been discovered, it never needs to be scanned again.",
        "Keep, for every row and every column, a 'next unvisited cell' pointer structure (union-find with path compression, or a sorted set). A BFS step then walks only over cells that are still unvisited and removes them as it goes.",
      ],
      editorial: explain({
        idea: "BFS gives the minimum number of jumps, but the naive neighbour scan revisits the same already-seen cells over and over. Each row and each column keeps a 'next unvisited' pointer: when a cell is discovered it is removed from both its row and its column, and the scan from any later cell jumps straight past it. Every cell is removed once, so the BFS is near-linear.",
        steps: [
          "Row pointers `R[i][j]` (with sentinel `j = n`) and column pointers `C[j][i]` (sentinel `i = m`) start pointing at themselves; removing a cell makes it point to the next index.",
          "Remove `(0, 0)` from both structures; queue it with distance 1.",
          "Pop `(i, j)` with distance `d`. Scan right: `k = findRow(i, j + 1)` while `k <= min(n - 1, j + grid[i][j])` — record `d + 1`, queue it, remove it from its row and column, continue from `findRow(i, k + 1)`.",
          "Scan down the same way with the column structure.",
          "Return the distance recorded for `(m - 1, n - 1)`, or `-1`.",
        ],
        why: "BFS order guarantees the first time a cell is discovered is with the fewest visited cells. Removing a discovered cell from its row and column cannot lose a shorter route, because any later discovery would only offer a larger distance. Path compression makes every `find` amortised near-constant, and each cell is removed exactly once.",
        time: "O(mn · α(mn))",
        space: "O(mn)",
        pitfalls: [
          "Count cells, not jumps: the start itself counts, so a `1 x 1` grid answers 1.",
          "A cell must be removed from **both** its row and its column structure when discovered, whichever direction found it.",
          "Clip each scan at the grid edge as well as at `grid[i][j]`.",
        ],
      }),
      examples: [
        { input: "[[3,4,2,1],[4,2,3,1],[2,1,0,0],[2,4,0,0]]", expectedOutput: "4" },
        { input: "[[3,4,2,1],[4,2,1,1],[2,1,1,0],[3,4,1,0]]", expectedOutput: "3" },
        { input: "[[2,1,0],[1,0,0]]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [2, 4, 7, 9])), n = ri(rng, 1, pick(rng, [2, 4, 7, 9]));
        const cap = Math.min(m * n - 1, pick(rng, [1, 2, 3, 5, m * n - 1]));
        const zero = pick(rng, [0, 0.05, 0.15, 0.3]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < zero || cap === 0 ? 0 : ri(rng, 1, cap))));
        grid[m - 1][n - 1] = 0;
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import deque

          def minimumVisitedCells(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              row = [list(range(n + 1)) for _ in range(m)]
              col = [list(range(m + 1)) for _ in range(n)]

              def find(p, x):
                  root = x
                  while p[root] != root:
                      root = p[root]
                  while p[x] != root:
                      p[x], x = root, p[x]
                  return root

              dist = [[-1] * n for _ in range(m)]

              def visit(i, j, d):
                  dist[i][j] = d
                  row[i][j] = j + 1
                  col[j][i] = i + 1
                  q.append((i, j))

              q = deque()
              visit(0, 0, 1)
              while q:
                  i, j = q.popleft()
                  d, g = dist[i][j], grid[i][j]
                  k = find(row[i], j + 1)
                  while k <= min(n - 1, j + g):
                      visit(i, k, d + 1)
                      k = find(row[i], k + 1)
                  k = find(col[j], i + 1)
                  while k <= min(m - 1, i + g):
                      visit(k, j, d + 1)
                      k = find(col[j], k + 1)
              return dist[m - 1][n - 1]
        `,
        javascript: code`
          var minimumVisitedCells = function(grid) {
              var m = grid.length, n = grid[0].length;
              // row pointers at i*(n+1)+j, column pointers at j*(m+1)+i
              var R = new Array(m * (n + 1)), C = new Array(n * (m + 1));
              for (var a = 0; a < m; a++) for (var b = 0; b <= n; b++) R[a * (n + 1) + b] = b;
              for (var c = 0; c < n; c++) for (var e = 0; e <= m; e++) C[c * (m + 1) + e] = e;
              var find = function(P, base, x) {
                  var root = x;
                  while (P[base + root] !== root) root = P[base + root];
                  while (P[base + x] !== root) { var t = P[base + x]; P[base + x] = root; x = t; }
                  return root;
              };
              var dist = new Array(m * n);
              for (var z = 0; z < m * n; z++) dist[z] = -1;
              var q = [];
              var visit = function(i, j, d) {
                  dist[i * n + j] = d;
                  R[i * (n + 1) + j] = j + 1;
                  C[j * (m + 1) + i] = i + 1;
                  q.push(i * n + j);
              };
              visit(0, 0, 1);
              for (var h = 0; h < q.length; h++) {
                  var i = Math.floor(q[h] / n), j = q[h] % n, d = dist[q[h]], g = grid[i][j];
                  var lim = Math.min(n - 1, j + g);
                  for (var k = find(R, i * (n + 1), j + 1); k <= lim; k = find(R, i * (n + 1), k + 1)) visit(i, k, d + 1);
                  var lim2 = Math.min(m - 1, i + g);
                  for (var k2 = find(C, j * (m + 1), i + 1); k2 <= lim2; k2 = find(C, j * (m + 1), k2 + 1)) visit(k2, j, d + 1);
              }
              return dist[m * n - 1];
          };
        `,
        typescript: code`
          function minimumVisitedCells(grid: number[][]): number {
              var m = grid.length, n = grid[0].length;
              // row pointers at i*(n+1)+j, column pointers at j*(m+1)+i
              var R: number[] = [], C: number[] = [];
              for (var a = 0; a < m; a++) for (var b = 0; b <= n; b++) R.push(b);
              for (var c = 0; c < n; c++) for (var e = 0; e <= m; e++) C.push(e);
              var find = function(P: number[], base: number, x: number): number {
                  var root = x;
                  while (P[base + root] !== root) root = P[base + root];
                  while (P[base + x] !== root) { var t = P[base + x]; P[base + x] = root; x = t; }
                  return root;
              };
              var dist: number[] = [];
              for (var z = 0; z < m * n; z++) dist.push(-1);
              var q: number[] = [];
              var visit = function(i: number, j: number, d: number): void {
                  dist[i * n + j] = d;
                  R[i * (n + 1) + j] = j + 1;
                  C[j * (m + 1) + i] = i + 1;
                  q.push(i * n + j);
              };
              visit(0, 0, 1);
              for (var h = 0; h < q.length; h++) {
                  var i = Math.floor(q[h] / n), j = q[h] % n, d = dist[q[h]], g = grid[i][j];
                  var lim = Math.min(n - 1, j + g);
                  for (var k = find(R, i * (n + 1), j + 1); k <= lim; k = find(R, i * (n + 1), k + 1)) visit(i, k, d + 1);
                  var lim2 = Math.min(m - 1, i + g);
                  for (var k2 = find(C, j * (m + 1), i + 1); k2 <= lim2; k2 = find(C, j * (m + 1), k2 + 1)) visit(k2, j, d + 1);
              }
              return dist[m * n - 1];
          }
        `,
        java: code`
          static int findPtr(int[] p, int base, int x) {
              int root = x;
              while (p[base + root] != root) root = p[base + root];
              while (p[base + x] != root) { int t = p[base + x]; p[base + x] = root; x = t; }
              return root;
          }

          public static int minimumVisitedCells(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              int[] R = new int[m * (n + 1)], C = new int[n * (m + 1)];
              for (int i = 0; i < m; i++) for (int j = 0; j <= n; j++) R[i * (n + 1) + j] = j;
              for (int j = 0; j < n; j++) for (int i = 0; i <= m; i++) C[j * (m + 1) + i] = i;
              int[] dist = new int[m * n];
              Arrays.fill(dist, -1);
              int[] q = new int[m * n];
              int head = 0, tail = 0;
              dist[0] = 1; R[0] = 1; C[0] = 1; q[tail++] = 0;
              while (head < tail) {
                  int cell = q[head++], i = cell / n, j = cell % n, d = dist[cell], g = grid[i][j];
                  int lim = Math.min(n - 1, j + g);
                  for (int k = findPtr(R, i * (n + 1), j + 1); k <= lim; k = findPtr(R, i * (n + 1), k + 1)) {
                      dist[i * n + k] = d + 1; R[i * (n + 1) + k] = k + 1; C[k * (m + 1) + i] = i + 1; q[tail++] = i * n + k;
                  }
                  int lim2 = Math.min(m - 1, i + g);
                  for (int k = findPtr(C, j * (m + 1), i + 1); k <= lim2; k = findPtr(C, j * (m + 1), k + 1)) {
                      dist[k * n + j] = d + 1; R[k * (n + 1) + j] = j + 1; C[j * (m + 1) + k] = k + 1; q[tail++] = k * n + j;
                  }
              }
              return dist[m * n - 1];
          }
        `,
        cpp: code`
          int findPtr(vector<int>& p, int base, int x) {
              int root = x;
              while (p[base + root] != root) root = p[base + root];
              while (p[base + x] != root) { int t = p[base + x]; p[base + x] = root; x = t; }
              return root;
          }

          int minimumVisitedCells(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              vector<int> R(m * (n + 1)), C(n * (m + 1)), dist(m * n, -1), q;
              for (int i = 0; i < m; i++) for (int j = 0; j <= n; j++) R[i * (n + 1) + j] = j;
              for (int j = 0; j < n; j++) for (int i = 0; i <= m; i++) C[j * (m + 1) + i] = i;
              auto visit = [&](int i, int j, int d) {
                  dist[i * n + j] = d;
                  R[i * (n + 1) + j] = j + 1;
                  C[j * (m + 1) + i] = i + 1;
                  q.push_back(i * n + j);
              };
              visit(0, 0, 1);
              for (size_t h = 0; h < q.size(); h++) {
                  int i = q[h] / n, j = q[h] % n, d = dist[q[h]], g = grid[i][j];
                  int lim = min(n - 1, j + g);
                  for (int k = findPtr(R, i * (n + 1), j + 1); k <= lim; k = findPtr(R, i * (n + 1), k + 1)) visit(i, k, d + 1);
                  int lim2 = min(m - 1, i + g);
                  for (int k = findPtr(C, j * (m + 1), i + 1); k <= lim2; k = findPtr(C, j * (m + 1), k + 1)) visit(k, j, d + 1);
              }
              return dist[m * n - 1];
          }
        `,
        c: code`
          static int findPtr(int* p, int base, int x) {
              int root = x;
              while (p[base + root] != root) root = p[base + root];
              while (p[base + x] != root) { int t = p[base + x]; p[base + x] = root; x = t; }
              return root;
          }

          int minimumVisitedCells(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0];
              int* R = (int*) malloc((size_t) m * (n + 1) * sizeof(int));
              int* C = (int*) malloc((size_t) n * (m + 1) * sizeof(int));
              int* dist = (int*) malloc((size_t) m * n * sizeof(int));
              int* q = (int*) malloc((size_t) m * n * sizeof(int));
              for (int i = 0; i < m; i++) for (int j = 0; j <= n; j++) R[i * (n + 1) + j] = j;
              for (int j = 0; j < n; j++) for (int i = 0; i <= m; i++) C[j * (m + 1) + i] = i;
              for (int z = 0; z < m * n; z++) dist[z] = -1;
              int head = 0, tail = 0;
              dist[0] = 1; R[0] = 1; C[0] = 1; q[tail++] = 0;
              while (head < tail) {
                  int cell = q[head++], i = cell / n, j = cell % n, d = dist[cell], g = grid[i][j];
                  int lim = j + g < n - 1 ? j + g : n - 1;
                  for (int k = findPtr(R, i * (n + 1), j + 1); k <= lim; k = findPtr(R, i * (n + 1), k + 1)) {
                      dist[i * n + k] = d + 1; R[i * (n + 1) + k] = k + 1; C[k * (m + 1) + i] = i + 1; q[tail++] = i * n + k;
                  }
                  int lim2 = i + g < m - 1 ? i + g : m - 1;
                  for (int k = findPtr(C, j * (m + 1), i + 1); k <= lim2; k = findPtr(C, j * (m + 1), k + 1)) {
                      dist[k * n + j] = d + 1; R[k * (n + 1) + j] = j + 1; C[j * (m + 1) + k] = k + 1; q[tail++] = k * n + j;
                  }
              }
              int ans = dist[m * n - 1];
              free(R); free(C); free(dist); free(q);
              return ans;
          }
        `,
        csharp: code`
          static int FindPtr(int[] p, int b, int x)
          {
              int root = x;
              while (p[b + root] != root) root = p[b + root];
              while (p[b + x] != root) { int t = p[b + x]; p[b + x] = root; x = t; }
              return root;
          }

          public static int MinimumVisitedCells(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              var R = new int[m * (n + 1)];
              var C = new int[n * (m + 1)];
              for (int i = 0; i < m; i++) for (int j = 0; j <= n; j++) R[i * (n + 1) + j] = j;
              for (int j = 0; j < n; j++) for (int i = 0; i <= m; i++) C[j * (m + 1) + i] = i;
              var dist = new int[m * n];
              for (int z = 0; z < m * n; z++) dist[z] = -1;
              var q = new int[m * n];
              int head = 0, tail = 0;
              dist[0] = 1; R[0] = 1; C[0] = 1; q[tail++] = 0;
              while (head < tail)
              {
                  int cell = q[head++], i = cell / n, j = cell % n, d = dist[cell], g = grid[i][j];
                  int lim = Math.Min(n - 1, j + g);
                  for (int k = FindPtr(R, i * (n + 1), j + 1); k <= lim; k = FindPtr(R, i * (n + 1), k + 1))
                  {
                      dist[i * n + k] = d + 1; R[i * (n + 1) + k] = k + 1; C[k * (m + 1) + i] = i + 1; q[tail++] = i * n + k;
                  }
                  int lim2 = Math.Min(m - 1, i + g);
                  for (int k = FindPtr(C, j * (m + 1), i + 1); k <= lim2; k = FindPtr(C, j * (m + 1), k + 1))
                  {
                      dist[k * n + j] = d + 1; R[k * (n + 1) + j] = j + 1; C[j * (m + 1) + k] = k + 1; q[tail++] = k * n + j;
                  }
              }
              return dist[m * n - 1];
          }
        `,
        go: code`
          func findPtr(p []int, base, x int) int {
              root := x
              for p[base+root] != root {
                  root = p[base+root]
              }
              for p[base+x] != root {
                  p[base+x], x = root, p[base+x]
              }
              return root
          }

          func minimumVisitedCells(grid [][]int) int {
              m, n := len(grid), len(grid[0])
              R := make([]int, m*(n+1))
              C := make([]int, n*(m+1))
              for i := 0; i < m; i++ {
                  for j := 0; j <= n; j++ {
                      R[i*(n+1)+j] = j
                  }
              }
              for j := 0; j < n; j++ {
                  for i := 0; i <= m; i++ {
                      C[j*(m+1)+i] = i
                  }
              }
              dist := make([]int, m*n)
              for z := range dist {
                  dist[z] = -1
              }
              q := []int{}
              visit := func(i, j, d int) {
                  dist[i*n+j] = d
                  R[i*(n+1)+j] = j + 1
                  C[j*(m+1)+i] = i + 1
                  q = append(q, i*n+j)
              }
              visit(0, 0, 1)
              for h := 0; h < len(q); h++ {
                  i, j := q[h]/n, q[h]%n
                  d, g := dist[q[h]], grid[i][j]
                  lim := j + g
                  if lim > n-1 {
                      lim = n - 1
                  }
                  for k := findPtr(R, i*(n+1), j+1); k <= lim; k = findPtr(R, i*(n+1), k+1) {
                      visit(i, k, d+1)
                  }
                  lim2 := i + g
                  if lim2 > m-1 {
                      lim2 = m - 1
                  }
                  for k := findPtr(C, j*(m+1), i+1); k <= lim2; k = findPtr(C, j*(m+1), k+1) {
                      visit(k, j, d+1)
                  }
              }
              return dist[m*n-1]
          }
        `,
        kotlin: code`
          fun findPtr(p: IntArray, base: Int, start: Int): Int {
              var root = start
              while (p[base + root] != root) root = p[base + root]
              var x = start
              while (p[base + x] != root) { val t = p[base + x]; p[base + x] = root; x = t }
              return root
          }

          fun minimumVisitedCells(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              val R = IntArray(m * (n + 1)) { it % (n + 1) }
              val C = IntArray(n * (m + 1)) { it % (m + 1) }
              val dist = IntArray(m * n) { -1 }
              val q = IntArray(m * n)
              var head = 0
              var tail = 0
              fun visit(i: Int, j: Int, d: Int) {
                  dist[i * n + j] = d
                  R[i * (n + 1) + j] = j + 1
                  C[j * (m + 1) + i] = i + 1
                  q[tail++] = i * n + j
              }
              visit(0, 0, 1)
              while (head < tail) {
                  val cell = q[head++]
                  val i = cell / n
                  val j = cell % n
                  val d = dist[cell]
                  val g = grid[i][j]
                  val lim = minOf(n - 1, j + g)
                  var k = findPtr(R, i * (n + 1), j + 1)
                  while (k <= lim) { visit(i, k, d + 1); k = findPtr(R, i * (n + 1), k + 1) }
                  val lim2 = minOf(m - 1, i + g)
                  k = findPtr(C, j * (m + 1), i + 1)
                  while (k <= lim2) { visit(k, j, d + 1); k = findPtr(C, j * (m + 1), k + 1) }
              }
              return dist[m * n - 1]
          }
        `,
        swift: code`
          func findPtr(_ p: inout [Int], _ base: Int, _ start: Int) -> Int {
              var root = start
              while p[base + root] != root { root = p[base + root] }
              var x = start
              while p[base + x] != root { let t = p[base + x]; p[base + x] = root; x = t }
              return root
          }

          func minimumVisitedCells(_ grid: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count
              var R = (0..<(m * (n + 1))).map { $0 % (n + 1) }
              var C = (0..<(n * (m + 1))).map { $0 % (m + 1) }
              var dist = [Int](repeating: -1, count: m * n)
              var q = [Int]()
              func visit(_ i: Int, _ j: Int, _ d: Int) {
                  dist[i * n + j] = d
                  R[i * (n + 1) + j] = j + 1
                  C[j * (m + 1) + i] = i + 1
                  q.append(i * n + j)
              }
              visit(0, 0, 1)
              var h = 0
              while h < q.count {
                  let cell = q[h]
                  h += 1
                  let i = cell / n, j = cell % n, d = dist[cell], g = grid[i][j]
                  let lim = min(n - 1, j + g)
                  var k = findPtr(&R, i * (n + 1), j + 1)
                  while k <= lim { visit(i, k, d + 1); k = findPtr(&R, i * (n + 1), k + 1) }
                  let lim2 = min(m - 1, i + g)
                  k = findPtr(&C, j * (m + 1), i + 1)
                  while k <= lim2 { visit(k, j, d + 1); k = findPtr(&C, j * (m + 1), k + 1) }
              }
              return dist[m * n - 1]
          }
        `,
        rust: code`
          fn find_ptr(p: &mut Vec<usize>, base: usize, start: usize) -> usize {
              let mut root = start;
              while p[base + root] != root {
                  root = p[base + root];
              }
              let mut x = start;
              while p[base + x] != root {
                  let t = p[base + x];
                  p[base + x] = root;
                  x = t;
              }
              root
          }

          fn minimumVisitedCells(grid: Vec<Vec<i32>>) -> i32 {
              let (m, n) = (grid.len(), grid[0].len());
              let mut rp: Vec<usize> = (0..m * (n + 1)).map(|x| x % (n + 1)).collect();
              let mut cp: Vec<usize> = (0..n * (m + 1)).map(|x| x % (m + 1)).collect();
              let mut dist = vec![-1i32; m * n];
              let mut q: Vec<usize> = Vec::new();
              dist[0] = 1;
              rp[0] = 1;
              cp[0] = 1;
              q.push(0);
              let mut h = 0;
              while h < q.len() {
                  let cell = q[h];
                  h += 1;
                  let (i, j) = (cell / n, cell % n);
                  let d = dist[cell];
                  let g = grid[i][j] as usize;
                  let lim = std::cmp::min(n - 1, j + g);
                  let mut k = find_ptr(&mut rp, i * (n + 1), j + 1);
                  while k <= lim {
                      dist[i * n + k] = d + 1;
                      rp[i * (n + 1) + k] = k + 1;
                      cp[k * (m + 1) + i] = i + 1;
                      q.push(i * n + k);
                      k = find_ptr(&mut rp, i * (n + 1), k + 1);
                  }
                  let lim2 = std::cmp::min(m - 1, i + g);
                  let mut k2 = find_ptr(&mut cp, j * (m + 1), i + 1);
                  while k2 <= lim2 {
                      dist[k2 * n + j] = d + 1;
                      rp[k2 * (n + 1) + j] = j + 1;
                      cp[j * (m + 1) + k2] = k2 + 1;
                      q.push(k2 * n + j);
                      k2 = find_ptr(&mut cp, j * (m + 1), k2 + 1);
                  }
              }
              dist[m * n - 1]
          }
        `,
        php: code`
          function findPtr(&$p, $base, $x) {
              $root = $x;
              while ($p[$base + $root] != $root) $root = $p[$base + $root];
              while ($p[$base + $x] != $root) { $t = $p[$base + $x]; $p[$base + $x] = $root; $x = $t; }
              return $root;
          }

          function minimumVisitedCells($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $R = [];
              for ($i = 0; $i < $m; $i++) for ($j = 0; $j <= $n; $j++) $R[$i * ($n + 1) + $j] = $j;
              $C = [];
              for ($j = 0; $j < $n; $j++) for ($i = 0; $i <= $m; $i++) $C[$j * ($m + 1) + $i] = $i;
              $dist = array_fill(0, $m * $n, -1);
              $dist[0] = 1; $R[0] = 1; $C[0] = 1;
              $q = [0];
              for ($h = 0; $h < count($q); $h++) {
                  $cell = $q[$h];
                  $i = intdiv($cell, $n);
                  $j = $cell % $n;
                  $d = $dist[$cell];
                  $g = $grid[$i][$j];
                  $lim = min($n - 1, $j + $g);
                  for ($k = findPtr($R, $i * ($n + 1), $j + 1); $k <= $lim; $k = findPtr($R, $i * ($n + 1), $k + 1)) {
                      $dist[$i * $n + $k] = $d + 1; $R[$i * ($n + 1) + $k] = $k + 1; $C[$k * ($m + 1) + $i] = $i + 1; $q[] = $i * $n + $k;
                  }
                  $lim2 = min($m - 1, $i + $g);
                  for ($k = findPtr($C, $j * ($m + 1), $i + 1); $k <= $lim2; $k = findPtr($C, $j * ($m + 1), $k + 1)) {
                      $dist[$k * $n + $j] = $d + 1; $R[$k * ($n + 1) + $j] = $j + 1; $C[$j * ($m + 1) + $k] = $k + 1; $q[] = $k * $n + $j;
                  }
              }
              return $dist[$m * $n - 1];
          }
        `,
        ruby: code`
          def find_ptr(p, base, x)
            root = x
            root = p[base + root] while p[base + root] != root
            while p[base + x] != root
              t = p[base + x]
              p[base + x] = root
              x = t
            end
            root
          end

          def minimumVisitedCells(grid)
            m = grid.length
            n = grid[0].length
            rp = Array.new(m * (n + 1)) { |x| x % (n + 1) }
            cp = Array.new(n * (m + 1)) { |x| x % (m + 1) }
            dist = Array.new(m * n, -1)
            dist[0] = 1
            rp[0] = 1
            cp[0] = 1
            q = [0]
            h = 0
            while h < q.length
              cell = q[h]
              h += 1
              i = cell / n
              j = cell % n
              d = dist[cell]
              g = grid[i][j]
              lim = [n - 1, j + g].min
              k = find_ptr(rp, i * (n + 1), j + 1)
              while k <= lim
                dist[i * n + k] = d + 1
                rp[i * (n + 1) + k] = k + 1
                cp[k * (m + 1) + i] = i + 1
                q << i * n + k
                k = find_ptr(rp, i * (n + 1), k + 1)
              end
              lim2 = [m - 1, i + g].min
              k = find_ptr(cp, j * (m + 1), i + 1)
              while k <= lim2
                dist[k * n + j] = d + 1
                rp[k * (n + 1) + j] = j + 1
                cp[j * (m + 1) + k] = k + 1
                q << k * n + j
                k = find_ptr(cp, j * (m + 1), k + 1)
              end
            end
            dist[m * n - 1]
          end
        `,
      },
    };
  })(),

  // ── Minimize the Total Price of the Trips (LC 2646) ─────────────
  (() => {
    const ref = (n: number, edges: number[][], price: number[], trips: number[][]) => {
      // Count how often each node is used, then try every non-adjacent halving set.
      const adj = adjOf(n, edges);
      const cnt = new Array(n).fill(0);
      for (const [s, t] of trips) {
        const par = new Array(n).fill(-2);
        par[s] = -1;
        const q = [s];
        for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (par[v] === -2) { par[v] = q[h]; q.push(v); }
        for (let x = t; x !== -1; x = par[x]) cnt[x]++;
      }
      let best = Infinity;
      for (let mask = 0; mask < 1 << n; mask++) {
        if (edges.some(([a, b]) => (mask >> a) & 1 && (mask >> b) & 1)) continue;
        let total = 0;
        for (let v = 0; v < n; v++) total += cnt[v] * ((mask >> v) & 1 ? price[v] / 2 : price[v]);
        best = Math.min(best, total);
      }
      return best;
    };
    return {
      slug: "minimize-the-total-price-of-the-trips",
      title: "Minimize the Total Price of the Trips",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Tree", "Depth-First Search", "Graph", "Google", "Amazon"],
      signature: {
        funcName: "minimumTotalPrice",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "price", type: "int[]" as const }, { name: "trips", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An undirected tree has `n` nodes numbered `0` to `n - 1`, joined by the `n - 1` edges in `edges`. Every node has an **even** price `price[i]`.\n\nThe price of a path is the sum of the prices of every node on it (both ends included). You will make the trips `trips[i] = [start, end]`, each along the unique path from `start` to `end`.\n\nBefore the first trip you may pick a set of **pairwise non-adjacent** nodes and halve their prices. Return the **minimum** total price of all the trips.",
        [
          { in: "n = 4, edges = [[0,1],[1,2],[1,3]], price = [2,2,10,6], trips = [[0,3],[2,1],[2,3]]", out: "23", note: "Halve nodes 0, 2 and 3 (no two are adjacent): the prices become [1,2,5,3]. The trips cost 1+2+3 = 6, 5+2 = 7 and 5+2+3 = 10, a total of 23." },
          { in: "n = 2, edges = [[0,1]], price = [2,2], trips = [[0,0]]", out: "1", note: "Halve node 0; the single trip stays on node 0 and costs 1." },
          { in: "n = 1, edges = [], price = [6], trips = [[0,0],[0,0]]", out: "6" },
        ],
        ["1 <= n <= 50", "edges.length == n - 1", "0 <= a, b <= n - 1", "edges represents a valid tree", "price.length == n", "price[i] is even", "1 <= price[i] <= 1000", "1 <= trips.length <= 100", "0 <= start, end <= n - 1"]),
      hints: [
        "The trips do not depend on the halving, so first count, for every node, how many trips pass through it. Then a node costs `count · price` in full or `count · price / 2` when halved.",
        "With n ≤ 50 and at most 100 trips, walking each trip's path explicitly (find the path with a DFS from its start) is cheap.",
        "Choosing non-adjacent nodes to minimise a weighted sum on a tree is the 'house robber on a tree' DP: for each node keep the best subtree cost with the node halved and with it not halved.",
      ],
      editorial: explain({
        idea: "Split the problem in two. The trips fix how many times each node is paid for, `cnt[v]`. What remains is choosing an independent set of nodes to halve so that `Σ cnt[v]·price[v]·(1 or 1/2)` is smallest — a classic two-state tree DP.",
        steps: [
          "For each trip, find parents by a DFS/BFS from `start` and walk back from `end`, adding 1 to `cnt` of every node on the path.",
          "Root the tree at 0. Process nodes children-first and keep `full[v]` (v keeps its price) and `half[v]` (v is halved).",
          "`full[v] = cnt[v]·price[v] + Σ min(full[c], half[c])` and `half[v] = cnt[v]·price[v]/2 + Σ full[c]` over the children `c`.",
          "Return `min(full[0], half[0])`.",
        ],
        why: "The total price is a sum over nodes of `cnt[v]` times the node's (possibly halved) price, so the trip structure only enters through `cnt`. On a tree, whether `v` is halved only constrains its children (they must not be), so the two states per node capture every valid choice and the DP is exact.",
        time: "O(n · trips)",
        space: "O(n)",
        pitfalls: [
          "A trip may start and end at the same node; its path is that single node.",
          "Prices are even, so halving stays an integer.",
          "Halving is decided once for all trips — do not optimise each trip separately.",
        ],
      }),
      examples: [
        { input: "4\n[[0,1],[1,2],[1,3]]\n[2,2,10,6]\n[[0,3],[2,1],[2,3]]", expectedOutput: "23" },
        { input: "2\n[[0,1]]\n[2,2]\n[[0,0]]", expectedOutput: "1" },
        { input: "1\n[]\n[6]\n[[0,0],[0,0]]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 5, 8, 11]));
        const edges = randomTreeEdges(rng, n, 0);
        const P = pick(rng, [2, 20, 1000]);
        const price = Array.from({ length: n }, () => 2 * ri(rng, 1, P / 2));
        const trips = Array.from({ length: ri(rng, 1, pick(rng, [1, 4, 10])) }, () => [ri(rng, 0, n - 1), ri(rng, 0, n - 1)]);
        return { input: `${n}\n${fmtIntMat(edges)}\n${fmtIntArr(price)}\n${fmtIntMat(trips)}`, expectedOutput: String(ref(n, edges, price, trips)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumTotalPrice(n: int, edges: List[List[int]], price: List[int], trips: List[List[int]]) -> int:
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              cnt = [0] * n
              for s, t in trips:
                  par = [-2] * n
                  par[s] = -1
                  stack = [s]
                  while stack:
                      u = stack.pop()
                      for v in adj[u]:
                          if par[v] == -2:
                              par[v] = u
                              stack.append(v)
                  x = t
                  while x != -1:
                      cnt[x] += 1
                      x = par[x]
              parent = [-1] * n
              order = []
              seen = [False] * n
              seen[0] = True
              stack = [0]
              while stack:
                  u = stack.pop()
                  order.append(u)
                  for v in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          stack.append(v)
              full = [cnt[v] * price[v] for v in range(n)]
              half = [cnt[v] * price[v] // 2 for v in range(n)]
              for u in reversed(order):
                  p = parent[u]
                  if p >= 0:
                      full[p] += min(full[u], half[u])
                      half[p] += full[u]
              return min(full[0], half[0])
        `,
        javascript: code`
          var minimumTotalPrice = function(n, edges, price, trips) {
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].push(edges[e][1]); adj[edges[e][1]].push(edges[e][0]); }
              var cnt = new Array(n);
              for (var c = 0; c < n; c++) cnt[c] = 0;
              for (var t = 0; t < trips.length; t++) {
                  var par = new Array(n);
                  for (var k = 0; k < n; k++) par[k] = -2;
                  par[trips[t][0]] = -1;
                  var st = [trips[t][0]];
                  while (st.length > 0) {
                      var u = st.pop();
                      for (var j = 0; j < adj[u].length; j++) { var v = adj[u][j]; if (par[v] === -2) { par[v] = u; st.push(v); } }
                  }
                  for (var x = trips[t][1]; x !== -1; x = par[x]) cnt[x]++;
              }
              var parent = new Array(n), seen = new Array(n), order = [];
              for (var a = 0; a < n; a++) { parent[a] = -1; seen[a] = false; }
              seen[0] = true;
              var stack = [0];
              while (stack.length > 0) {
                  var w = stack.pop();
                  order.push(w);
                  for (var j2 = 0; j2 < adj[w].length; j2++) { var y = adj[w][j2]; if (!seen[y]) { seen[y] = true; parent[y] = w; stack.push(y); } }
              }
              var full = [], half = [];
              for (var b = 0; b < n; b++) { full.push(cnt[b] * price[b]); half.push(cnt[b] * price[b] / 2); }
              for (var p = n - 1; p >= 0; p--) {
                  var z = order[p], pz = parent[z];
                  if (pz >= 0) { full[pz] += Math.min(full[z], half[z]); half[pz] += full[z]; }
              }
              return Math.min(full[0], half[0]);
          };
        `,
        typescript: code`
          function minimumTotalPrice(n: number, edges: number[][], price: number[], trips: number[][]): number {
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].push(edges[e][1]); adj[edges[e][1]].push(edges[e][0]); }
              var cnt: number[] = [];
              for (var c = 0; c < n; c++) cnt.push(0);
              for (var t = 0; t < trips.length; t++) {
                  var par: number[] = [];
                  for (var k = 0; k < n; k++) par.push(-2);
                  par[trips[t][0]] = -1;
                  var st: number[] = [trips[t][0]];
                  while (st.length > 0) {
                      var u = st.pop() as number;
                      for (var j = 0; j < adj[u].length; j++) { var v = adj[u][j]; if (par[v] === -2) { par[v] = u; st.push(v); } }
                  }
                  for (var x = trips[t][1]; x !== -1; x = par[x]) cnt[x]++;
              }
              var parent: number[] = [], seen: boolean[] = [], order: number[] = [];
              for (var a = 0; a < n; a++) { parent.push(-1); seen.push(false); }
              seen[0] = true;
              var stack: number[] = [0];
              while (stack.length > 0) {
                  var w = stack.pop() as number;
                  order.push(w);
                  for (var j2 = 0; j2 < adj[w].length; j2++) { var y = adj[w][j2]; if (!seen[y]) { seen[y] = true; parent[y] = w; stack.push(y); } }
              }
              var full: number[] = [], half: number[] = [];
              for (var b = 0; b < n; b++) { full.push(cnt[b] * price[b]); half.push(cnt[b] * price[b] / 2); }
              for (var p = n - 1; p >= 0; p--) {
                  var z = order[p], pz = parent[z];
                  if (pz >= 0) { full[pz] += Math.min(full[z], half[z]); half[pz] += full[z]; }
              }
              return Math.min(full[0], half[0]);
          }
        `,
        java: code`
          public static int minimumTotalPrice(int n, int[][] edges, int[] price, int[][] trips) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] cnt = new int[n];
              int[] par = new int[n], stack = new int[n];
              for (int[] trip : trips) {
                  Arrays.fill(par, -2);
                  par[trip[0]] = -1;
                  int sp = 0;
                  stack[sp++] = trip[0];
                  while (sp > 0) {
                      int u = stack[--sp];
                      for (int v : adj.get(u)) if (par[v] == -2) { par[v] = u; stack[sp++] = v; }
                  }
                  for (int x = trip[1]; x != -1; x = par[x]) cnt[x]++;
              }
              int[] parent = new int[n], order = new int[n];
              boolean[] seen = new boolean[n];
              Arrays.fill(parent, -1);
              int sp = 0, k = 0;
              stack[sp++] = 0;
              seen[0] = true;
              while (sp > 0) {
                  int u = stack[--sp];
                  order[k++] = u;
                  for (int v : adj.get(u)) if (!seen[v]) { seen[v] = true; parent[v] = u; stack[sp++] = v; }
              }
              int[] full = new int[n], half = new int[n];
              for (int v = 0; v < n; v++) { full[v] = cnt[v] * price[v]; half[v] = cnt[v] * price[v] / 2; }
              for (int p = n - 1; p >= 0; p--) {
                  int z = order[p], pz = parent[z];
                  if (pz >= 0) { full[pz] += Math.min(full[z], half[z]); half[pz] += full[z]; }
              }
              return Math.min(full[0], half[0]);
          }
        `,
        cpp: code`
          int minimumTotalPrice(int n, vector<vector<int>>& edges, vector<int>& price, vector<vector<int>>& trips) {
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> cnt(n, 0), par(n);
              for (auto& trip : trips) {
                  fill(par.begin(), par.end(), -2);
                  par[trip[0]] = -1;
                  vector<int> st = {trip[0]};
                  while (!st.empty()) {
                      int u = st.back();
                      st.pop_back();
                      for (int v : adj[u]) if (par[v] == -2) { par[v] = u; st.push_back(v); }
                  }
                  for (int x = trip[1]; x != -1; x = par[x]) cnt[x]++;
              }
              vector<int> parent(n, -1), order, st = {0};
              vector<bool> seen(n, false);
              seen[0] = true;
              while (!st.empty()) {
                  int u = st.back();
                  st.pop_back();
                  order.push_back(u);
                  for (int v : adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; st.push_back(v); }
              }
              vector<int> full(n), half(n);
              for (int v = 0; v < n; v++) { full[v] = cnt[v] * price[v]; half[v] = cnt[v] * price[v] / 2; }
              for (int p = n - 1; p >= 0; p--) {
                  int z = order[p], pz = parent[z];
                  if (pz >= 0) { full[pz] += min(full[z], half[z]); half[pz] += full[z]; }
              }
              return min(full[0], half[0]);
          }
        `,
        c: code`
          int minimumTotalPrice(int n, int** edges, int edgesSize, int* edgesColSize, int* price, int priceSize, int** trips, int tripsSize, int* tripsColSize) {
              int* head = (int*) malloc((size_t) n * sizeof(int));
              int* nxt = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int* to = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int ec = 0;
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < edgesSize; e++) {
                  int a = edges[e][0], b = edges[e][1];
                  to[ec] = b; nxt[ec] = head[a]; head[a] = ec++;
                  to[ec] = a; nxt[ec] = head[b]; head[b] = ec++;
              }
              int* cnt = (int*) calloc((size_t) n, sizeof(int));
              int* par = (int*) malloc((size_t) n * sizeof(int));
              int* stack = (int*) malloc((size_t) n * sizeof(int));
              for (int t = 0; t < tripsSize; t++) {
                  for (int i = 0; i < n; i++) par[i] = -2;
                  par[trips[t][0]] = -1;
                  int sp = 0;
                  stack[sp++] = trips[t][0];
                  while (sp > 0) {
                      int u = stack[--sp];
                      for (int e = head[u]; e != -1; e = nxt[e]) if (par[to[e]] == -2) { par[to[e]] = u; stack[sp++] = to[e]; }
                  }
                  for (int x = trips[t][1]; x != -1; x = par[x]) cnt[x]++;
              }
              int* parent = (int*) malloc((size_t) n * sizeof(int));
              int* order = (int*) malloc((size_t) n * sizeof(int));
              char* seen = (char*) calloc((size_t) n, 1);
              for (int i = 0; i < n; i++) parent[i] = -1;
              int sp = 0, k = 0;
              stack[sp++] = 0;
              seen[0] = 1;
              while (sp > 0) {
                  int u = stack[--sp];
                  order[k++] = u;
                  for (int e = head[u]; e != -1; e = nxt[e]) if (!seen[to[e]]) { seen[to[e]] = 1; parent[to[e]] = u; stack[sp++] = to[e]; }
              }
              int* full = (int*) malloc((size_t) n * sizeof(int));
              int* half = (int*) malloc((size_t) n * sizeof(int));
              for (int v = 0; v < n; v++) { full[v] = cnt[v] * price[v]; half[v] = cnt[v] * price[v] / 2; }
              for (int p = n - 1; p >= 0; p--) {
                  int z = order[p], pz = parent[z];
                  if (pz >= 0) { full[pz] += full[z] < half[z] ? full[z] : half[z]; half[pz] += full[z]; }
              }
              int ans = full[0] < half[0] ? full[0] : half[0];
              free(head); free(nxt); free(to); free(cnt); free(par); free(stack); free(parent); free(order); free(seen); free(full); free(half);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumTotalPrice(int n, int[][] edges, int[] price, int[][] trips)
          {
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var cnt = new int[n];
              var par = new int[n];
              var stack = new Stack<int>();
              foreach (var trip in trips)
              {
                  for (int i = 0; i < n; i++) par[i] = -2;
                  par[trip[0]] = -1;
                  stack.Push(trip[0]);
                  while (stack.Count > 0)
                  {
                      int u = stack.Pop();
                      foreach (int v in adj[u]) if (par[v] == -2) { par[v] = u; stack.Push(v); }
                  }
                  for (int x = trip[1]; x != -1; x = par[x]) cnt[x]++;
              }
              var parent = new int[n];
              var order = new List<int>();
              var seen = new bool[n];
              for (int i = 0; i < n; i++) parent[i] = -1;
              stack.Push(0);
              seen[0] = true;
              while (stack.Count > 0)
              {
                  int u = stack.Pop();
                  order.Add(u);
                  foreach (int v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; stack.Push(v); }
              }
              var full = new int[n];
              var half = new int[n];
              for (int v = 0; v < n; v++) { full[v] = cnt[v] * price[v]; half[v] = cnt[v] * price[v] / 2; }
              for (int p = n - 1; p >= 0; p--)
              {
                  int z = order[p], pz = parent[z];
                  if (pz >= 0) { full[pz] += Math.Min(full[z], half[z]); half[pz] += full[z]; }
              }
              return Math.Min(full[0], half[0]);
          }
        `,
        go: code`
          func minimumTotalPrice(n int, edges [][]int, price []int, trips [][]int) int {
              adj := make([][]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], e[1])
                  adj[e[1]] = append(adj[e[1]], e[0])
              }
              cnt := make([]int, n)
              par := make([]int, n)
              for _, trip := range trips {
                  for i := range par {
                      par[i] = -2
                  }
                  par[trip[0]] = -1
                  st := []int{trip[0]}
                  for len(st) > 0 {
                      u := st[len(st)-1]
                      st = st[:len(st)-1]
                      for _, v := range adj[u] {
                          if par[v] == -2 {
                              par[v] = u
                              st = append(st, v)
                          }
                      }
                  }
                  for x := trip[1]; x != -1; x = par[x] {
                      cnt[x]++
                  }
              }
              parent := make([]int, n)
              for i := range parent {
                  parent[i] = -1
              }
              seen := make([]bool, n)
              seen[0] = true
              order := []int{}
              st := []int{0}
              for len(st) > 0 {
                  u := st[len(st)-1]
                  st = st[:len(st)-1]
                  order = append(order, u)
                  for _, v := range adj[u] {
                      if !seen[v] {
                          seen[v] = true
                          parent[v] = u
                          st = append(st, v)
                      }
                  }
              }
              full := make([]int, n)
              half := make([]int, n)
              for v := 0; v < n; v++ {
                  full[v] = cnt[v] * price[v]
                  half[v] = cnt[v] * price[v] / 2
              }
              for p := n - 1; p >= 0; p-- {
                  z := order[p]
                  if pz := parent[z]; pz >= 0 {
                      if full[z] < half[z] {
                          full[pz] += full[z]
                      } else {
                          full[pz] += half[z]
                      }
                      half[pz] += full[z]
                  }
              }
              if full[0] < half[0] {
                  return full[0]
              }
              return half[0]
          }
        `,
        kotlin: code`
          fun minimumTotalPrice(n: Int, edges: Array<IntArray>, price: IntArray, trips: Array<IntArray>): Int {
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val cnt = IntArray(n)
              val par = IntArray(n)
              val stack = IntArray(n)
              for (trip in trips) {
                  par.fill(-2)
                  par[trip[0]] = -1
                  var sp = 0
                  stack[sp++] = trip[0]
                  while (sp > 0) {
                      val u = stack[--sp]
                      for (v in adj[u]) if (par[v] == -2) { par[v] = u; stack[sp++] = v }
                  }
                  var x = trip[1]
                  while (x != -1) { cnt[x]++; x = par[x] }
              }
              val parent = IntArray(n) { -1 }
              val order = IntArray(n)
              val seen = BooleanArray(n)
              var sp = 0
              var k = 0
              stack[sp++] = 0
              seen[0] = true
              while (sp > 0) {
                  val u = stack[--sp]
                  order[k++] = u
                  for (v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; stack[sp++] = v }
              }
              val full = IntArray(n) { cnt[it] * price[it] }
              val half = IntArray(n) { cnt[it] * price[it] / 2 }
              for (p in n - 1 downTo 0) {
                  val z = order[p]
                  val pz = parent[z]
                  if (pz >= 0) { full[pz] += minOf(full[z], half[z]); half[pz] += full[z] }
              }
              return minOf(full[0], half[0])
          }
        `,
        swift: code`
          func minimumTotalPrice(_ n: Int, _ edges: [[Int]], _ price: [Int], _ trips: [[Int]]) -> Int {
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var cnt = [Int](repeating: 0, count: n)
              for trip in trips {
                  var par = [Int](repeating: -2, count: n)
                  par[trip[0]] = -1
                  var st = [trip[0]]
                  while let u = st.popLast() {
                      for v in adj[u] where par[v] == -2 { par[v] = u; st.append(v) }
                  }
                  var x = trip[1]
                  while x != -1 { cnt[x] += 1; x = par[x] }
              }
              var parent = [Int](repeating: -1, count: n)
              var seen = [Bool](repeating: false, count: n)
              var order = [Int]()
              var st = [0]
              seen[0] = true
              while let u = st.popLast() {
                  order.append(u)
                  for v in adj[u] where !seen[v] { seen[v] = true; parent[v] = u; st.append(v) }
              }
              var full = (0..<n).map { cnt[$0] * price[$0] }
              var half = (0..<n).map { cnt[$0] * price[$0] / 2 }
              for z in order.reversed() {
                  let pz = parent[z]
                  if pz >= 0 { full[pz] += min(full[z], half[z]); half[pz] += full[z] }
              }
              return min(full[0], half[0])
          }
        `,
        rust: code`
          fn minimumTotalPrice(n: i32, edges: Vec<Vec<i32>>, price: Vec<i32>, trips: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut adj = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut cnt = vec![0i32; n];
              for trip in trips.iter() {
                  let (s, t) = (trip[0] as usize, trip[1] as usize);
                  let mut par = vec![std::usize::MAX - 1; n];
                  par[s] = std::usize::MAX;
                  let mut st = vec![s];
                  while let Some(u) = st.pop() {
                      for &v in adj[u].iter() {
                          if par[v] == std::usize::MAX - 1 {
                              par[v] = u;
                              st.push(v);
                          }
                      }
                  }
                  let mut x = t;
                  loop {
                      cnt[x] += 1;
                      if par[x] == std::usize::MAX {
                          break;
                      }
                      x = par[x];
                  }
              }
              let mut parent = vec![std::usize::MAX; n];
              let mut seen = vec![false; n];
              let mut order = Vec::with_capacity(n);
              let mut st = vec![0usize];
              seen[0] = true;
              while let Some(u) = st.pop() {
                  order.push(u);
                  for &v in adj[u].iter() {
                      if !seen[v] {
                          seen[v] = true;
                          parent[v] = u;
                          st.push(v);
                      }
                  }
              }
              let mut full: Vec<i32> = (0..n).map(|v| cnt[v] * price[v]).collect();
              let mut half: Vec<i32> = (0..n).map(|v| cnt[v] * price[v] / 2).collect();
              for &z in order.iter().rev() {
                  let pz = parent[z];
                  if pz != std::usize::MAX {
                      full[pz] += std::cmp::min(full[z], half[z]);
                      half[pz] += full[z];
                  }
              }
              std::cmp::min(full[0], half[0])
          }
        `,
        php: code`
          function minimumTotalPrice($n, $edges, $price, $trips) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as [$a, $b]) { $adj[$a][] = $b; $adj[$b][] = $a; }
              $cnt = array_fill(0, $n, 0);
              foreach ($trips as [$s, $t]) {
                  $par = array_fill(0, $n, -2);
                  $par[$s] = -1;
                  $st = [$s];
                  while ($st) {
                      $u = array_pop($st);
                      foreach ($adj[$u] as $v) if ($par[$v] == -2) { $par[$v] = $u; $st[] = $v; }
                  }
                  for ($x = $t; $x != -1; $x = $par[$x]) $cnt[$x]++;
              }
              $parent = array_fill(0, $n, -1);
              $seen = array_fill(0, $n, false);
              $order = [];
              $st = [0];
              $seen[0] = true;
              while ($st) {
                  $u = array_pop($st);
                  $order[] = $u;
                  foreach ($adj[$u] as $v) if (!$seen[$v]) { $seen[$v] = true; $parent[$v] = $u; $st[] = $v; }
              }
              $full = [];
              $half = [];
              for ($v = 0; $v < $n; $v++) { $full[$v] = $cnt[$v] * $price[$v]; $half[$v] = intdiv($cnt[$v] * $price[$v], 2); }
              for ($p = $n - 1; $p >= 0; $p--) {
                  $z = $order[$p];
                  $pz = $parent[$z];
                  if ($pz >= 0) { $full[$pz] += min($full[$z], $half[$z]); $half[$pz] += $full[$z]; }
              }
              return min($full[0], $half[0]);
          }
        `,
        ruby: code`
          def minimumTotalPrice(n, edges, price, trips)
            adj = Array.new(n) { [] }
            edges.each { |a, b| adj[a] << b; adj[b] << a }
            cnt = Array.new(n, 0)
            trips.each do |s, t|
              par = Array.new(n, -2)
              par[s] = -1
              st = [s]
              until st.empty?
                u = st.pop
                adj[u].each do |v|
                  next unless par[v] == -2
                  par[v] = u
                  st << v
                end
              end
              x = t
              while x != -1
                cnt[x] += 1
                x = par[x]
              end
            end
            parent = Array.new(n, -1)
            seen = Array.new(n, false)
            order = []
            st = [0]
            seen[0] = true
            until st.empty?
              u = st.pop
              order << u
              adj[u].each do |v|
                next if seen[v]
                seen[v] = true
                parent[v] = u
                st << v
              end
            end
            full = (0...n).map { |v| cnt[v] * price[v] }
            half = (0...n).map { |v| cnt[v] * price[v] / 2 }
            order.reverse_each do |z|
              pz = parent[z]
              next if pz < 0
              full[pz] += [full[z], half[z]].min
              half[pz] += full[z]
            end
            [full[0], half[0]].min
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost of a Path With Special Roads (LC 2662) ─────────
  (() => {
    const ref = (start: number[], target: number[], roads: number[][]) => {
      // Floyd–Warshall over every interesting point with walking + road edges.
      const pts: number[][] = [start, target];
      for (const r of roads) { pts.push([r[0], r[1]]); pts.push([r[2], r[3]]); }
      const k = pts.length;
      const d = pts.map((a) => pts.map((b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])));
      roads.forEach((r, i) => { const a = 2 + 2 * i, b = 3 + 2 * i; d[a][b] = Math.min(d[a][b], r[4]); });
      for (let m = 0; m < k; m++) for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) d[i][j] = Math.min(d[i][j], d[i][m] + d[m][j]);
      return d[0][1];
    };
    return {
      slug: "minimum-cost-of-a-path-with-special-roads",
      title: "Minimum Cost of a Path With Special Roads",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Graph", "Heap (Priority Queue)", "Shortest Path", "Google", "Amazon"],
      signature: {
        funcName: "minimumCost",
        params: [{ name: "start", type: "int[]" as const }, { name: "target", type: "int[]" as const }, { name: "specialRoads", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are at `start = [startX, startY]` on a grid of integer points and want to reach `target = [targetX, targetY]`.\n\nWalking from `(x1, y1)` to `(x2, y2)` costs `|x2 - x1| + |y2 - y1|`. In addition there are one-way **special roads**: `specialRoads[i] = [x1, y1, x2, y2, cost]` takes you from `(x1, y1)` to `(x2, y2)` for `cost`. Each special road may be used any number of times.\n\nReturn the **minimum** cost of getting from `start` to `target`.",
        [
          { in: "start = [1,1], target = [4,5], specialRoads = [[1,2,3,3,2],[3,4,4,5,1]]", out: "5", note: "Walk to (1,2) for 1, take road 0 to (3,3) for 2, walk to (3,4) for 1, take road 1 to (4,5) for 1: 1 + 2 + 1 + 1 = 5." },
          { in: "start = [3,2], target = [5,7], specialRoads = [[3,2,3,4,4],[3,3,5,5,5],[3,4,5,6,6]]", out: "7", note: "No road beats walking straight there for |5 - 3| + |7 - 2| = 7." },
          { in: "start = [1,1], target = [10,4], specialRoads = [[4,2,1,1,3],[1,2,7,4,4],[10,3,6,1,2],[6,1,1,2,3]]", out: "8", note: "Walk to (1,2) for 1, take road 1 to (7,4) for 4, and walk to (10,4) for 3." },
        ],
        ["start.length == target.length == 2", "1 <= startX <= targetX <= 10^5", "1 <= startY <= targetY <= 10^5", "1 <= specialRoads.length <= 200", "specialRoads[i].length == 5", "startX <= x1, x2 <= targetX", "startY <= y1, y2 <= targetY", "1 <= cost <= 10^5"]),
      hints: [
        "Only a handful of points can matter: the start, the target and the two ends of each special road. Between them you simply walk, at Manhattan distance.",
        "It is enough to stop at the **end** of each road: from any point, the next useful move is 'walk to the start of road i and take it', landing on road i's end.",
        "That is a dense graph on at most 201 nodes — run Dijkstra in its simple `O(V²)` array form, and for each settled node also try walking straight to the target.",
      ],
      editorial: explain({
        idea: "The coordinates are huge but only `2k + 2` points are interesting. Model a node per road end plus the start; from any node you can 'walk to road i's start and ride it' to reach road i's end. Dijkstra over these nodes, finishing each with a straight walk to the target, gives the answer.",
        steps: [
          "Nodes: the start and the end `(x2, y2)` of every road. `dist[start] = 0`, everything else infinite.",
          "Repeat: pick the unsettled node `u` with the smallest distance and settle it.",
          "Update the answer with `dist[u] + |u - target|`.",
          "For every road `i`, relax its end with `dist[u] + |u - (x1, y1)| + cost`.",
          "After all nodes are settled, return the answer.",
        ],
        why: "Any optimal route alternates walking and riding roads. Each ride ends at a road end, and walking legs can be merged (Manhattan distance obeys the triangle inequality), so the route is a sequence of 'walk to a road start, ride' steps between road ends, followed by one final walk. Those are exactly the edges Dijkstra relaxes, and all edge weights are non-negative.",
        time: "O(k²)",
        space: "O(k)",
        pitfalls: [
          "A special road can cost **more** than walking between its ends; the final walk and the free choice of edges cover that, so never force a road.",
          "Roads are one-way: only `(x1, y1) → (x2, y2)`.",
          "The answer never exceeds the direct walk, at most `2 · 10^5`, so 32-bit integers suffice.",
        ],
      }),
      examples: [
        { input: "[1,1]\n[4,5]\n[[1,2,3,3,2],[3,4,4,5,1]]", expectedOutput: "5" },
        { input: "[3,2]\n[5,7]\n[[3,2,3,4,4],[3,3,5,5,5],[3,4,5,6,6]]", expectedOutput: "7" },
        { input: "[1,1]\n[10,4]\n[[4,2,1,1,3],[1,2,7,4,4],[10,3,6,1,2],[6,1,1,2,3]]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const C = pick(rng, [5, 20, 1000, 100000]);
        const sx = ri(rng, 1, C), sy = ri(rng, 1, C);
        const tx = ri(rng, sx, C), ty = ri(rng, sy, C);
        const maxCost = pick(rng, [1, 5, Math.max(1, Math.floor(C / 4)), 100000]);
        const roads = Array.from({ length: ri(rng, 1, pick(rng, [2, 5, 9])) }, () =>
          [ri(rng, sx, tx), ri(rng, sy, ty), ri(rng, sx, tx), ri(rng, sy, ty), ri(rng, 1, maxCost)]);
        return { input: `${fmtIntArr([sx, sy])}\n${fmtIntArr([tx, ty])}\n${fmtIntMat(roads)}`, expectedOutput: String(ref([sx, sy], [tx, ty], roads)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumCost(start: List[int], target: List[int], specialRoads: List[List[int]]) -> int:
              k = len(specialRoads)
              # node 0 is the start, node i + 1 is the end of road i
              px = [start[0]] + [r[2] for r in specialRoads]
              py = [start[1]] + [r[3] for r in specialRoads]
              INF = float("inf")
              dist = [INF] * (k + 1)
              dist[0] = 0
              done = [False] * (k + 1)
              best = abs(target[0] - start[0]) + abs(target[1] - start[1])
              for _ in range(k + 1):
                  u = -1
                  for v in range(k + 1):
                      if not done[v] and (u < 0 or dist[v] < dist[u]):
                          u = v
                  if dist[u] == INF:
                      break
                  done[u] = True
                  best = min(best, dist[u] + abs(target[0] - px[u]) + abs(target[1] - py[u]))
                  for i, (x1, y1, _, _, cost) in enumerate(specialRoads):
                      cand = dist[u] + abs(x1 - px[u]) + abs(y1 - py[u]) + cost
                      if cand < dist[i + 1]:
                          dist[i + 1] = cand
              return best
        `,
        javascript: code`
          var minimumCost = function(start, target, specialRoads) {
              var k = specialRoads.length;
              // node 0 is the start, node i + 1 is the end of road i
              var px = [start[0]], py = [start[1]], dist = [0], done = [false];
              for (var i = 0; i < k; i++) { px.push(specialRoads[i][2]); py.push(specialRoads[i][3]); dist.push(Infinity); done.push(false); }
              var best = Math.abs(target[0] - start[0]) + Math.abs(target[1] - start[1]);
              for (var it = 0; it <= k; it++) {
                  var u = -1;
                  for (var v = 0; v <= k; v++) if (!done[v] && (u < 0 || dist[v] < dist[u])) u = v;
                  if (dist[u] === Infinity) break;
                  done[u] = true;
                  best = Math.min(best, dist[u] + Math.abs(target[0] - px[u]) + Math.abs(target[1] - py[u]));
                  for (var r = 0; r < k; r++) {
                      var road = specialRoads[r];
                      var cand = dist[u] + Math.abs(road[0] - px[u]) + Math.abs(road[1] - py[u]) + road[4];
                      if (cand < dist[r + 1]) dist[r + 1] = cand;
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function minimumCost(start: number[], target: number[], specialRoads: number[][]): number {
              var k = specialRoads.length;
              // node 0 is the start, node i + 1 is the end of road i
              var px: number[] = [start[0]], py: number[] = [start[1]], dist: number[] = [0], done: boolean[] = [false];
              for (var i = 0; i < k; i++) { px.push(specialRoads[i][2]); py.push(specialRoads[i][3]); dist.push(Infinity); done.push(false); }
              var best = Math.abs(target[0] - start[0]) + Math.abs(target[1] - start[1]);
              for (var it = 0; it <= k; it++) {
                  var u = -1;
                  for (var v = 0; v <= k; v++) if (!done[v] && (u < 0 || dist[v] < dist[u])) u = v;
                  if (dist[u] === Infinity) break;
                  done[u] = true;
                  best = Math.min(best, dist[u] + Math.abs(target[0] - px[u]) + Math.abs(target[1] - py[u]));
                  for (var r = 0; r < k; r++) {
                      var road = specialRoads[r];
                      var cand = dist[u] + Math.abs(road[0] - px[u]) + Math.abs(road[1] - py[u]) + road[4];
                      if (cand < dist[r + 1]) dist[r + 1] = cand;
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int minimumCost(int[] start, int[] target, int[][] specialRoads) {
              int k = specialRoads.length;
              int[] px = new int[k + 1], py = new int[k + 1];
              long[] dist = new long[k + 1];
              boolean[] done = new boolean[k + 1];
              px[0] = start[0]; py[0] = start[1];
              for (int i = 0; i < k; i++) { px[i + 1] = specialRoads[i][2]; py[i + 1] = specialRoads[i][3]; }
              Arrays.fill(dist, Long.MAX_VALUE);
              dist[0] = 0;
              long best = Math.abs(target[0] - start[0]) + Math.abs(target[1] - start[1]);
              for (int it = 0; it <= k; it++) {
                  int u = -1;
                  for (int v = 0; v <= k; v++) if (!done[v] && (u < 0 || dist[v] < dist[u])) u = v;
                  if (dist[u] == Long.MAX_VALUE) break;
                  done[u] = true;
                  best = Math.min(best, dist[u] + Math.abs(target[0] - px[u]) + Math.abs(target[1] - py[u]));
                  for (int r = 0; r < k; r++) {
                      int[] road = specialRoads[r];
                      long cand = dist[u] + Math.abs(road[0] - px[u]) + Math.abs(road[1] - py[u]) + road[4];
                      if (cand < dist[r + 1]) dist[r + 1] = cand;
                  }
              }
              return (int) best;
          }
        `,
        cpp: code`
          int minimumCost(vector<int>& start, vector<int>& target, vector<vector<int>>& specialRoads) {
              int k = specialRoads.size();
              vector<long long> px(k + 1), py(k + 1), dist(k + 1, LLONG_MAX);
              vector<bool> done(k + 1, false);
              px[0] = start[0]; py[0] = start[1];
              for (int i = 0; i < k; i++) { px[i + 1] = specialRoads[i][2]; py[i + 1] = specialRoads[i][3]; }
              dist[0] = 0;
              long long best = llabs(target[0] - start[0]) + llabs(target[1] - start[1]);
              for (int it = 0; it <= k; it++) {
                  int u = -1;
                  for (int v = 0; v <= k; v++) if (!done[v] && (u < 0 || dist[v] < dist[u])) u = v;
                  if (dist[u] == LLONG_MAX) break;
                  done[u] = true;
                  best = min(best, dist[u] + llabs(target[0] - px[u]) + llabs(target[1] - py[u]));
                  for (int r = 0; r < k; r++) {
                      auto& road = specialRoads[r];
                      long long cand = dist[u] + llabs(road[0] - px[u]) + llabs(road[1] - py[u]) + road[4];
                      if (cand < dist[r + 1]) dist[r + 1] = cand;
                  }
              }
              return (int) best;
          }
        `,
        c: code`
          static int absInt(int x) { return x < 0 ? -x : x; }

          int minimumCost(int* start, int startSize, int* target, int targetSize, int** specialRoads, int specialRoadsSize, int* specialRoadsColSize) {
              int k = specialRoadsSize;
              int* px = (int*) malloc((size_t) (k + 1) * sizeof(int));
              int* py = (int*) malloc((size_t) (k + 1) * sizeof(int));
              int* dist = (int*) malloc((size_t) (k + 1) * sizeof(int));
              char* done = (char*) calloc((size_t) (k + 1), 1);
              const int INF = 2147483647;
              px[0] = start[0]; py[0] = start[1]; dist[0] = 0;
              for (int i = 0; i < k; i++) { px[i + 1] = specialRoads[i][2]; py[i + 1] = specialRoads[i][3]; dist[i + 1] = INF; }
              int best = absInt(target[0] - start[0]) + absInt(target[1] - start[1]);
              for (int it = 0; it <= k; it++) {
                  int u = -1;
                  for (int v = 0; v <= k; v++) if (!done[v] && (u < 0 || dist[v] < dist[u])) u = v;
                  if (dist[u] == INF) break;
                  done[u] = 1;
                  int viaWalk = dist[u] + absInt(target[0] - px[u]) + absInt(target[1] - py[u]);
                  if (viaWalk < best) best = viaWalk;
                  for (int r = 0; r < k; r++) {
                      int* road = specialRoads[r];
                      int cand = dist[u] + absInt(road[0] - px[u]) + absInt(road[1] - py[u]) + road[4];
                      if (cand < dist[r + 1]) dist[r + 1] = cand;
                  }
              }
              free(px); free(py); free(dist); free(done);
              return best;
          }
        `,
        csharp: code`
          public static int MinimumCost(int[] start, int[] target, int[][] specialRoads)
          {
              int k = specialRoads.Length;
              var px = new int[k + 1];
              var py = new int[k + 1];
              var dist = new long[k + 1];
              var done = new bool[k + 1];
              px[0] = start[0]; py[0] = start[1];
              for (int i = 0; i < k; i++) { px[i + 1] = specialRoads[i][2]; py[i + 1] = specialRoads[i][3]; dist[i + 1] = long.MaxValue; }
              long best = Math.Abs(target[0] - start[0]) + Math.Abs(target[1] - start[1]);
              for (int it = 0; it <= k; it++)
              {
                  int u = -1;
                  for (int v = 0; v <= k; v++) if (!done[v] && (u < 0 || dist[v] < dist[u])) u = v;
                  if (dist[u] == long.MaxValue) break;
                  done[u] = true;
                  best = Math.Min(best, dist[u] + Math.Abs(target[0] - px[u]) + Math.Abs(target[1] - py[u]));
                  for (int r = 0; r < k; r++)
                  {
                      var road = specialRoads[r];
                      long cand = dist[u] + Math.Abs(road[0] - px[u]) + Math.Abs(road[1] - py[u]) + road[4];
                      if (cand < dist[r + 1]) dist[r + 1] = cand;
                  }
              }
              return (int) best;
          }
        `,
        go: code`
          func absInt(x int) int {
              if x < 0 {
                  return -x
              }
              return x
          }

          func minimumCost(start []int, target []int, specialRoads [][]int) int {
              k := len(specialRoads)
              px := make([]int, k+1)
              py := make([]int, k+1)
              dist := make([]int, k+1)
              done := make([]bool, k+1)
              const INF = 1 << 60
              px[0], py[0] = start[0], start[1]
              for i, r := range specialRoads {
                  px[i+1], py[i+1] = r[2], r[3]
                  dist[i+1] = INF
              }
              best := absInt(target[0]-start[0]) + absInt(target[1]-start[1])
              for it := 0; it <= k; it++ {
                  u := -1
                  for v := 0; v <= k; v++ {
                      if !done[v] && (u < 0 || dist[v] < dist[u]) {
                          u = v
                      }
                  }
                  if dist[u] == INF {
                      break
                  }
                  done[u] = true
                  if w := dist[u] + absInt(target[0]-px[u]) + absInt(target[1]-py[u]); w < best {
                      best = w
                  }
                  for r, road := range specialRoads {
                      cand := dist[u] + absInt(road[0]-px[u]) + absInt(road[1]-py[u]) + road[4]
                      if cand < dist[r+1] {
                          dist[r+1] = cand
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minimumCost(start: IntArray, target: IntArray, specialRoads: Array<IntArray>): Int {
              val k = specialRoads.size
              val px = IntArray(k + 1)
              val py = IntArray(k + 1)
              val dist = LongArray(k + 1) { Long.MAX_VALUE }
              val done = BooleanArray(k + 1)
              px[0] = start[0]; py[0] = start[1]; dist[0] = 0L
              for (i in 0 until k) { px[i + 1] = specialRoads[i][2]; py[i + 1] = specialRoads[i][3] }
              var best = (Math.abs(target[0] - start[0]) + Math.abs(target[1] - start[1])).toLong()
              repeat(k + 1) {
                  var u = -1
                  for (v in 0..k) if (!done[v] && (u < 0 || dist[v] < dist[u])) u = v
                  if (dist[u] == Long.MAX_VALUE) return best.toInt()
                  done[u] = true
                  best = minOf(best, dist[u] + Math.abs(target[0] - px[u]) + Math.abs(target[1] - py[u]))
                  for (r in 0 until k) {
                      val road = specialRoads[r]
                      val cand = dist[u] + Math.abs(road[0] - px[u]) + Math.abs(road[1] - py[u]) + road[4]
                      if (cand < dist[r + 1]) dist[r + 1] = cand
                  }
              }
              return best.toInt()
          }
        `,
        swift: code`
          func minimumCost(_ start: [Int], _ target: [Int], _ specialRoads: [[Int]]) -> Int {
              let k = specialRoads.count
              var px = [start[0]], py = [start[1]]
              for r in specialRoads { px.append(r[2]); py.append(r[3]) }
              var dist = [Int](repeating: Int.max, count: k + 1)
              var done = [Bool](repeating: false, count: k + 1)
              dist[0] = 0
              var best = abs(target[0] - start[0]) + abs(target[1] - start[1])
              for _ in 0...k {
                  var u = -1
                  for v in 0...k where !done[v] && (u < 0 || dist[v] < dist[u]) { u = v }
                  if dist[u] == Int.max { break }
                  done[u] = true
                  best = min(best, dist[u] + abs(target[0] - px[u]) + abs(target[1] - py[u]))
                  for (r, road) in specialRoads.enumerated() {
                      let cand = dist[u] + abs(road[0] - px[u]) + abs(road[1] - py[u]) + road[4]
                      if cand < dist[r + 1] { dist[r + 1] = cand }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn minimumCost(start: Vec<i32>, target: Vec<i32>, specialRoads: Vec<Vec<i32>>) -> i32 {
              let k = specialRoads.len();
              let mut px = vec![start[0] as i64];
              let mut py = vec![start[1] as i64];
              for r in specialRoads.iter() {
                  px.push(r[2] as i64);
                  py.push(r[3] as i64);
              }
              let (tx, ty) = (target[0] as i64, target[1] as i64);
              let mut dist = vec![std::i64::MAX; k + 1];
              let mut done = vec![false; k + 1];
              dist[0] = 0;
              let mut best = (tx - px[0]).abs() + (ty - py[0]).abs();
              for _ in 0..=k {
                  let mut u = std::usize::MAX;
                  for v in 0..=k {
                      if !done[v] && (u == std::usize::MAX || dist[v] < dist[u]) {
                          u = v;
                      }
                  }
                  if dist[u] == std::i64::MAX {
                      break;
                  }
                  done[u] = true;
                  best = best.min(dist[u] + (tx - px[u]).abs() + (ty - py[u]).abs());
                  for (r, road) in specialRoads.iter().enumerate() {
                      let cand = dist[u] + (road[0] as i64 - px[u]).abs() + (road[1] as i64 - py[u]).abs() + road[4] as i64;
                      if cand < dist[r + 1] {
                          dist[r + 1] = cand;
                      }
                  }
              }
              best as i32
          }
        `,
        php: code`
          function minimumCost($start, $target, $specialRoads) {
              $k = count($specialRoads);
              $px = [$start[0]];
              $py = [$start[1]];
              foreach ($specialRoads as $r) { $px[] = $r[2]; $py[] = $r[3]; }
              $dist = array_fill(0, $k + 1, PHP_INT_MAX);
              $done = array_fill(0, $k + 1, false);
              $dist[0] = 0;
              $best = abs($target[0] - $start[0]) + abs($target[1] - $start[1]);
              for ($it = 0; $it <= $k; $it++) {
                  $u = -1;
                  for ($v = 0; $v <= $k; $v++) if (!$done[$v] && ($u < 0 || $dist[$v] < $dist[$u])) $u = $v;
                  if ($dist[$u] == PHP_INT_MAX) break;
                  $done[$u] = true;
                  $best = min($best, $dist[$u] + abs($target[0] - $px[$u]) + abs($target[1] - $py[$u]));
                  foreach ($specialRoads as $r => $road) {
                      $cand = $dist[$u] + abs($road[0] - $px[$u]) + abs($road[1] - $py[$u]) + $road[4];
                      if ($cand < $dist[$r + 1]) $dist[$r + 1] = $cand;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def minimumCost(start, target, specialRoads)
            k = specialRoads.length
            px = [start[0]] + specialRoads.map { |r| r[2] }
            py = [start[1]] + specialRoads.map { |r| r[3] }
            dist = Array.new(k + 1, nil)
            dist[0] = 0
            done = Array.new(k + 1, false)
            best = (target[0] - start[0]).abs + (target[1] - start[1]).abs
            (k + 1).times do
              u = nil
              (0..k).each { |v| u = v if !done[v] && dist[v] && (u.nil? || dist[v] < dist[u]) }
              break if u.nil?
              done[u] = true
              best = [best, dist[u] + (target[0] - px[u]).abs + (target[1] - py[u]).abs].min
              specialRoads.each_with_index do |road, r|
                cand = dist[u] + (road[0] - px[u]).abs + (road[1] - py[u]).abs + road[4]
                dist[r + 1] = cand if dist[r + 1].nil? || cand < dist[r + 1]
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Edge Weight Equilibrium Queries in a Tree (LC 2846) ─
  (() => {
    const ref = (n: number, edges: number[][], queries: number[][]) => {
      // Walk each query's path explicitly and count its weights.
      const adj: number[][][] = Array.from({ length: n }, () => []);
      for (const [u, v, w] of edges) { adj[u].push([v, w]); adj[v].push([u, w]); }
      return queries.map(([a, b]) => {
        const par = new Array(n).fill(-2), pw = new Array(n).fill(0);
        par[a] = -1;
        const q = [a];
        for (let h = 0; h < q.length; h++) for (const [v, w] of adj[q[h]]) if (par[v] === -2) { par[v] = q[h]; pw[v] = w; q.push(v); }
        const cnt = new Map<number, number>();
        let len = 0;
        for (let x = b; x !== a; x = par[x]) { len++; cnt.set(pw[x], (cnt.get(pw[x]) ?? 0) + 1); }
        return len - Math.max(0, ...cnt.values());
      });
    };
    return {
      slug: "minimum-edge-weight-equilibrium-queries-in-a-tree",
      title: "Minimum Edge Weight Equilibrium Queries in a Tree",
      difficulty: "HARD" as const,
      tags: ["Array", "Tree", "Graph", "Google", "Amazon"],
      signature: {
        funcName: "minOperationsQueries",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "An undirected tree has `n` nodes numbered `0` to `n - 1`. Each `edges[i] = [u, v, w]` is an edge between `u` and `v` with weight `w`, where `1 <= w <= 26`.\n\nFor each query `queries[j] = [a, b]`, find the minimum number of operations needed to make **every edge on the path from `a` to `b` have the same weight**. One operation changes the weight of one edge to any value.\n\nQueries are independent: the tree returns to its original weights before each query. Return an array whose `j`-th entry answers `queries[j]`.",
        [
          { in: "n = 7, edges = [[0,1,1],[1,2,1],[2,3,1],[3,4,2],[4,5,2],[5,6,2]], queries = [[0,3],[3,6],[2,6],[0,6]]", out: "[0,0,1,3]", note: "Path 2 → 6 has weights 1, 2, 2, 2: change the single 1. Path 0 → 6 has three 1s and three 2s: change three edges." },
          { in: "n = 8, edges = [[1,2,6],[1,3,4],[2,4,6],[2,5,3],[3,6,6],[3,0,8],[7,0,2]], queries = [[4,6],[0,4],[6,5],[7,4]]", out: "[1,2,2,3]", note: "Path 4 → 6 is 4–2–1–3–6 with weights 6, 6, 4, 6: change the 4." },
          { in: "n = 1, edges = [], queries = [[0,0]]", out: "[0]", note: "An empty path needs no changes." },
        ],
        ["1 <= n <= 10^4", "edges.length == n - 1", "edges[i].length == 3", "0 <= u, v < n", "1 <= w <= 26", "edges represents a valid tree", "1 <= queries.length <= 2 * 10^4", "queries[j].length == 2", "0 <= a, b < n"]),
      hints: [
        "For one path, keep the most common weight and change everything else: the answer is `path length − (count of the most frequent weight)`.",
        "There are only 26 possible weights. Root the tree and store, for every node, how many edges of each weight lie on its path from the root.",
        "With `l = LCA(a, b)`, the count of weight `w` on the path is `cnt[a][w] + cnt[b][w] − 2·cnt[l][w]`, and the length is `depth[a] + depth[b] − 2·depth[l]`. Find the LCA with binary lifting.",
      ],
      editorial: explain({
        idea: "The cheapest way to equalise a path is to keep its most frequent weight. Because weights come from just 26 values, per-node prefix counts from the root let any path's weight histogram be assembled from three nodes: the two endpoints and their lowest common ancestor.",
        steps: [
          "BFS from node 0 to get each node's parent, depth and `cnt[v][w]` — the number of edges of weight `w` between the root and `v` (the parent's counts plus the edge into `v`).",
          "Build binary-lifting tables `up[k][v]` (the `2^k`-th ancestor).",
          "For a query, lift the deeper endpoint to the other's depth, then lift both while their ancestors differ to find `l`.",
          "Path length `len = depth[a] + depth[b] − 2·depth[l]`; best kept weight `m = max_w (cnt[a][w] + cnt[b][w] − 2·cnt[l][w])`; answer `len − m`.",
        ],
        why: "The root-to-`a` and root-to-`b` paths both contain the root-to-`l` path; subtracting it twice leaves exactly the edges of the `a`–`b` path, so the histogram is exact. Changing every edge that differs from the kept weight is necessary and sufficient, and keeping the most frequent weight minimises the number of changes.",
        time: "O((n + q) · (26 + log n))",
        space: "O(n · (26 + log n))",
        pitfalls: [
          "When `a == b` the path is empty and the answer is 0.",
          "Weights are 1-based (1 to 26); size the count table accordingly.",
          "Per-query path walking is `O(n)` each — too slow for `2 · 10^4` queries on a long path; that is why the LCA is needed.",
        ],
      }),
      examples: [
        { input: "7\n[[0,1,1],[1,2,1],[2,3,1],[3,4,2],[4,5,2],[5,6,2]]\n[[0,3],[3,6],[2,6],[0,6]]", expectedOutput: "[0,0,1,3]" },
        { input: "8\n[[1,2,6],[1,3,4],[2,4,6],[2,5,3],[3,6,6],[3,0,8],[7,0,2]]\n[[4,6],[0,4],[6,5],[7,4]]", expectedOutput: "[1,2,2,3]" },
        { input: "1\n[]\n[[0,0]]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.1 ? ri(rng, 1, 4) : ri(rng, 5, 25);
        const W = rng() < 0.05 ? 1 : pick(rng, [2, 3, 5, 26]);
        const edges = randomTreeEdges(rng, n, 0).map((e) => [e[0], e[1], ri(rng, 1, W)]);
        const queries = Array.from({ length: ri(rng, 1, pick(rng, [2, 6, 12])) }, () => [ri(rng, 0, n - 1), ri(rng, 0, n - 1)]);
        return { input: `${n}\n${fmtIntMat(edges)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(n, edges, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minOperationsQueries(n: int, edges: List[List[int]], queries: List[List[int]]) -> List[int]:
              adj = [[] for _ in range(n)]
              for u, v, w in edges:
                  adj[u].append((v, w))
                  adj[v].append((u, w))
              LOG = max(1, n.bit_length())
              up = [[0] * n for _ in range(LOG)]
              depth = [0] * n
              cnt = [[0] * 27 for _ in range(n)]
              seen = [False] * n
              seen[0] = True
              order = [0]
              for u in order:
                  for v, w in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          up[0][v] = u
                          depth[v] = depth[u] + 1
                          cnt[v] = cnt[u][:]
                          cnt[v][w] += 1
                          order.append(v)
              for k in range(1, LOG):
                  prev, cur = up[k - 1], up[k]
                  for v in range(n):
                      cur[v] = prev[prev[v]]

              def lca(a, b):
                  if depth[a] < depth[b]:
                      a, b = b, a
                  diff = depth[a] - depth[b]
                  for k in range(LOG):
                      if diff >> k & 1:
                          a = up[k][a]
                  if a == b:
                      return a
                  for k in range(LOG - 1, -1, -1):
                      if up[k][a] != up[k][b]:
                          a, b = up[k][a], up[k][b]
                  return up[0][a]

              res = []
              for a, b in queries:
                  l = lca(a, b)
                  length = depth[a] + depth[b] - 2 * depth[l]
                  keep = max(cnt[a][w] + cnt[b][w] - 2 * cnt[l][w] for w in range(1, 27))
                  res.append(length - keep)
              return res
        `,
        javascript: code`
          var minOperationsQueries = function(n, edges, queries) {
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1], edges[e][2]);
                  adj[edges[e][1]].push(edges[e][0], edges[e][2]);
              }
              var LOG = 1;
              while ((1 << LOG) <= n) LOG++;
              var up = [], depth = new Array(n), cnt = new Array(n * 27), seen = new Array(n);
              for (var k = 0; k < LOG; k++) { up.push(new Array(n)); for (var z = 0; z < n; z++) up[k][z] = 0; }
              for (var a0 = 0; a0 < n; a0++) { depth[a0] = 0; seen[a0] = false; }
              for (var c0 = 0; c0 < n * 27; c0++) cnt[c0] = 0;
              seen[0] = true;
              var order = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j += 2) {
                      var v = adj[u][j], w = adj[u][j + 1];
                      if (seen[v]) continue;
                      seen[v] = true;
                      up[0][v] = u;
                      depth[v] = depth[u] + 1;
                      for (var t = 0; t < 27; t++) cnt[v * 27 + t] = cnt[u * 27 + t];
                      cnt[v * 27 + w]++;
                      order.push(v);
                  }
              }
              for (var k2 = 1; k2 < LOG; k2++) for (var x = 0; x < n; x++) up[k2][x] = up[k2 - 1][up[k2 - 1][x]];
              var lca = function(a, b) {
                  if (depth[a] < depth[b]) { var tmp = a; a = b; b = tmp; }
                  var diff = depth[a] - depth[b];
                  for (var k = 0; k < LOG; k++) if ((diff >> k) & 1) a = up[k][a];
                  if (a === b) return a;
                  for (var k3 = LOG - 1; k3 >= 0; k3--) if (up[k3][a] !== up[k3][b]) { a = up[k3][a]; b = up[k3][b]; }
                  return up[0][a];
              };
              var res = [];
              for (var q = 0; q < queries.length; q++) {
                  var p = queries[q][0], r = queries[q][1], l = lca(p, r);
                  var len = depth[p] + depth[r] - 2 * depth[l], keep = 0;
                  for (var wt = 1; wt <= 26; wt++) {
                      var c = cnt[p * 27 + wt] + cnt[r * 27 + wt] - 2 * cnt[l * 27 + wt];
                      if (c > keep) keep = c;
                  }
                  res.push(len - keep);
              }
              return res;
          };
        `,
        typescript: code`
          function minOperationsQueries(n: number, edges: number[][], queries: number[][]): number[] {
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1], edges[e][2]);
                  adj[edges[e][1]].push(edges[e][0], edges[e][2]);
              }
              var LOG = 1;
              while ((1 << LOG) <= n) LOG++;
              var up: number[][] = [], depth: number[] = [], cnt: number[] = [], seen: boolean[] = [];
              for (var k = 0; k < LOG; k++) { var row: number[] = []; for (var z = 0; z < n; z++) row.push(0); up.push(row); }
              for (var a0 = 0; a0 < n; a0++) { depth.push(0); seen.push(false); }
              for (var c0 = 0; c0 < n * 27; c0++) cnt.push(0);
              seen[0] = true;
              var order: number[] = [0];
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var j = 0; j < adj[u].length; j += 2) {
                      var v = adj[u][j], w = adj[u][j + 1];
                      if (seen[v]) continue;
                      seen[v] = true;
                      up[0][v] = u;
                      depth[v] = depth[u] + 1;
                      for (var t = 0; t < 27; t++) cnt[v * 27 + t] = cnt[u * 27 + t];
                      cnt[v * 27 + w]++;
                      order.push(v);
                  }
              }
              for (var k2 = 1; k2 < LOG; k2++) for (var x = 0; x < n; x++) up[k2][x] = up[k2 - 1][up[k2 - 1][x]];
              var lca = function(a: number, b: number): number {
                  if (depth[a] < depth[b]) { var tmp = a; a = b; b = tmp; }
                  var diff = depth[a] - depth[b];
                  for (var k = 0; k < LOG; k++) if ((diff >> k) & 1) a = up[k][a];
                  if (a === b) return a;
                  for (var k3 = LOG - 1; k3 >= 0; k3--) if (up[k3][a] !== up[k3][b]) { a = up[k3][a]; b = up[k3][b]; }
                  return up[0][a];
              };
              var res: number[] = [];
              for (var q = 0; q < queries.length; q++) {
                  var p = queries[q][0], r = queries[q][1], l = lca(p, r);
                  var len = depth[p] + depth[r] - 2 * depth[l], keep = 0;
                  for (var wt = 1; wt <= 26; wt++) {
                      var c = cnt[p * 27 + wt] + cnt[r * 27 + wt] - 2 * cnt[l * 27 + wt];
                      if (c > keep) keep = c;
                  }
                  res.push(len - keep);
              }
              return res;
          }
        `,
        java: code`
          public static int[] minOperationsQueries(int n, int[][] edges, int[][] queries) {
              List<List<int[]>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(new int[]{e[1], e[2]}); adj.get(e[1]).add(new int[]{e[0], e[2]}); }
              int LOG = 1;
              while ((1 << LOG) <= n) LOG++;
              int[][] up = new int[LOG][n];
              int[] depth = new int[n];
              int[][] cnt = new int[n][27];
              boolean[] seen = new boolean[n];
              int[] order = new int[n];
              int head = 0, tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              while (head < tail) {
                  int u = order[head++];
                  for (int[] e : adj.get(u)) {
                      int v = e[0];
                      if (seen[v]) continue;
                      seen[v] = true;
                      up[0][v] = u;
                      depth[v] = depth[u] + 1;
                      cnt[v] = cnt[u].clone();
                      cnt[v][e[1]]++;
                      order[tail++] = v;
                  }
              }
              for (int k = 1; k < LOG; k++) for (int v = 0; v < n; v++) up[k][v] = up[k - 1][up[k - 1][v]];
              int[] res = new int[queries.length];
              for (int q = 0; q < queries.length; q++) {
                  int a = queries[q][0], b = queries[q][1];
                  int x = a, y = b;
                  if (depth[x] < depth[y]) { int t = x; x = y; y = t; }
                  int diff = depth[x] - depth[y];
                  for (int k = 0; k < LOG; k++) if (((diff >> k) & 1) == 1) x = up[k][x];
                  if (x != y) {
                      for (int k = LOG - 1; k >= 0; k--) if (up[k][x] != up[k][y]) { x = up[k][x]; y = up[k][y]; }
                      x = up[0][x];
                  }
                  int l = x, keep = 0;
                  for (int w = 1; w <= 26; w++) keep = Math.max(keep, cnt[a][w] + cnt[b][w] - 2 * cnt[l][w]);
                  res[q] = depth[a] + depth[b] - 2 * depth[l] - keep;
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> minOperationsQueries(int n, vector<vector<int>>& edges, vector<vector<int>>& queries) {
              vector<vector<pair<int, int>>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back({e[1], e[2]}); adj[e[1]].push_back({e[0], e[2]}); }
              int LOG = 1;
              while ((1 << LOG) <= n) LOG++;
              vector<vector<int>> up(LOG, vector<int>(n, 0));
              vector<int> depth(n, 0);
              vector<array<int, 27>> cnt(n);
              cnt[0].fill(0);
              vector<bool> seen(n, false);
              vector<int> order = {0};
              seen[0] = true;
              for (size_t h = 0; h < order.size(); h++) {
                  int u = order[h];
                  for (auto& e : adj[u]) {
                      int v = e.first, w = e.second;
                      if (seen[v]) continue;
                      seen[v] = true;
                      up[0][v] = u;
                      depth[v] = depth[u] + 1;
                      cnt[v] = cnt[u];
                      cnt[v][w]++;
                      order.push_back(v);
                  }
              }
              for (int k = 1; k < LOG; k++) for (int v = 0; v < n; v++) up[k][v] = up[k - 1][up[k - 1][v]];
              vector<int> res;
              for (auto& q : queries) {
                  int a = q[0], b = q[1], x = a, y = b;
                  if (depth[x] < depth[y]) swap(x, y);
                  int diff = depth[x] - depth[y];
                  for (int k = 0; k < LOG; k++) if ((diff >> k) & 1) x = up[k][x];
                  if (x != y) {
                      for (int k = LOG - 1; k >= 0; k--) if (up[k][x] != up[k][y]) { x = up[k][x]; y = up[k][y]; }
                      x = up[0][x];
                  }
                  int l = x, keep = 0;
                  for (int w = 1; w <= 26; w++) keep = max(keep, cnt[a][w] + cnt[b][w] - 2 * cnt[l][w]);
                  res.push_back(depth[a] + depth[b] - 2 * depth[l] - keep);
              }
              return res;
          }
        `,
        c: code`
          int* minOperationsQueries(int n, int** edges, int edgesSize, int* edgesColSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int* head = (int*) malloc((size_t) n * sizeof(int));
              int* nxt = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int* to = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int* wt = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int ec = 0;
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < edgesSize; e++) {
                  int u = edges[e][0], v = edges[e][1], w = edges[e][2];
                  to[ec] = v; wt[ec] = w; nxt[ec] = head[u]; head[u] = ec++;
                  to[ec] = u; wt[ec] = w; nxt[ec] = head[v]; head[v] = ec++;
              }
              int LOG = 1;
              while ((1 << LOG) <= n) LOG++;
              int* up = (int*) calloc((size_t) LOG * n, sizeof(int));
              int* depth = (int*) calloc((size_t) n, sizeof(int));
              int* cnt = (int*) calloc((size_t) n * 27, sizeof(int));
              char* seen = (char*) calloc((size_t) n, 1);
              int* order = (int*) malloc((size_t) n * sizeof(int));
              int qh = 0, qt = 0;
              order[qt++] = 0;
              seen[0] = 1;
              while (qh < qt) {
                  int u = order[qh++];
                  for (int e = head[u]; e != -1; e = nxt[e]) {
                      int v = to[e];
                      if (seen[v]) continue;
                      seen[v] = 1;
                      up[v] = u;
                      depth[v] = depth[u] + 1;
                      for (int t = 0; t < 27; t++) cnt[v * 27 + t] = cnt[u * 27 + t];
                      cnt[v * 27 + wt[e]]++;
                      order[qt++] = v;
                  }
              }
              for (int k = 1; k < LOG; k++) for (int v = 0; v < n; v++) up[k * n + v] = up[(k - 1) * n + up[(k - 1) * n + v]];
              int* res = (int*) malloc((size_t) (queriesSize + 1) * sizeof(int));
              for (int q = 0; q < queriesSize; q++) {
                  int a = queries[q][0], b = queries[q][1], x = a, y = b;
                  if (depth[x] < depth[y]) { int t = x; x = y; y = t; }
                  int diff = depth[x] - depth[y];
                  for (int k = 0; k < LOG; k++) if ((diff >> k) & 1) x = up[k * n + x];
                  if (x != y) {
                      for (int k = LOG - 1; k >= 0; k--) if (up[k * n + x] != up[k * n + y]) { x = up[k * n + x]; y = up[k * n + y]; }
                      x = up[x];
                  }
                  int l = x, keep = 0;
                  for (int w = 1; w <= 26; w++) {
                      int c = cnt[a * 27 + w] + cnt[b * 27 + w] - 2 * cnt[l * 27 + w];
                      if (c > keep) keep = c;
                  }
                  res[q] = depth[a] + depth[b] - 2 * depth[l] - keep;
              }
              free(head); free(nxt); free(to); free(wt); free(up); free(depth); free(cnt); free(seen); free(order);
              *returnSize = queriesSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] MinOperationsQueries(int n, int[][] edges, int[][] queries)
          {
              var adj = new List<int[]>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int[]>();
              foreach (var e in edges) { adj[e[0]].Add(new[] { e[1], e[2] }); adj[e[1]].Add(new[] { e[0], e[2] }); }
              int LOG = 1;
              while ((1 << LOG) <= n) LOG++;
              var up = new int[LOG, n];
              var depth = new int[n];
              var cnt = new int[n, 27];
              var seen = new bool[n];
              var order = new int[n];
              int head = 0, tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              while (head < tail)
              {
                  int u = order[head++];
                  foreach (var e in adj[u])
                  {
                      int v = e[0];
                      if (seen[v]) continue;
                      seen[v] = true;
                      up[0, v] = u;
                      depth[v] = depth[u] + 1;
                      for (int t = 0; t < 27; t++) cnt[v, t] = cnt[u, t];
                      cnt[v, e[1]]++;
                      order[tail++] = v;
                  }
              }
              for (int k = 1; k < LOG; k++) for (int v = 0; v < n; v++) up[k, v] = up[k - 1, up[k - 1, v]];
              var res = new int[queries.Length];
              for (int q = 0; q < queries.Length; q++)
              {
                  int a = queries[q][0], b = queries[q][1], x = a, y = b;
                  if (depth[x] < depth[y]) { int t = x; x = y; y = t; }
                  int diff = depth[x] - depth[y];
                  for (int k = 0; k < LOG; k++) if (((diff >> k) & 1) == 1) x = up[k, x];
                  if (x != y)
                  {
                      for (int k = LOG - 1; k >= 0; k--) if (up[k, x] != up[k, y]) { x = up[k, x]; y = up[k, y]; }
                      x = up[0, x];
                  }
                  int l = x, keep = 0;
                  for (int w = 1; w <= 26; w++) keep = Math.Max(keep, cnt[a, w] + cnt[b, w] - 2 * cnt[l, w]);
                  res[q] = depth[a] + depth[b] - 2 * depth[l] - keep;
              }
              return res;
          }
        `,
        go: code`
          func minOperationsQueries(n int, edges [][]int, queries [][]int) []int {
              adj := make([][][2]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], [2]int{e[1], e[2]})
                  adj[e[1]] = append(adj[e[1]], [2]int{e[0], e[2]})
              }
              LOG := 1
              for (1 << LOG) <= n {
                  LOG++
              }
              up := make([][]int, LOG)
              for k := range up {
                  up[k] = make([]int, n)
              }
              depth := make([]int, n)
              cnt := make([][27]int, n)
              seen := make([]bool, n)
              order := []int{0}
              seen[0] = true
              for h := 0; h < len(order); h++ {
                  u := order[h]
                  for _, e := range adj[u] {
                      v := e[0]
                      if seen[v] {
                          continue
                      }
                      seen[v] = true
                      up[0][v] = u
                      depth[v] = depth[u] + 1
                      cnt[v] = cnt[u]
                      cnt[v][e[1]]++
                      order = append(order, v)
                  }
              }
              for k := 1; k < LOG; k++ {
                  for v := 0; v < n; v++ {
                      up[k][v] = up[k-1][up[k-1][v]]
                  }
              }
              res := make([]int, len(queries))
              for qi, q := range queries {
                  a, b := q[0], q[1]
                  x, y := a, b
                  if depth[x] < depth[y] {
                      x, y = y, x
                  }
                  diff := depth[x] - depth[y]
                  for k := 0; k < LOG; k++ {
                      if (diff>>k)&1 == 1 {
                          x = up[k][x]
                      }
                  }
                  if x != y {
                      for k := LOG - 1; k >= 0; k-- {
                          if up[k][x] != up[k][y] {
                              x, y = up[k][x], up[k][y]
                          }
                      }
                      x = up[0][x]
                  }
                  l, keep := x, 0
                  for w := 1; w <= 26; w++ {
                      if c := cnt[a][w] + cnt[b][w] - 2*cnt[l][w]; c > keep {
                          keep = c
                      }
                  }
                  res[qi] = depth[a] + depth[b] - 2*depth[l] - keep
              }
              return res
          }
        `,
        kotlin: code`
          fun minOperationsQueries(n: Int, edges: Array<IntArray>, queries: Array<IntArray>): IntArray {
              val adj = Array(n) { ArrayList<IntArray>() }
              for (e in edges) { adj[e[0]].add(intArrayOf(e[1], e[2])); adj[e[1]].add(intArrayOf(e[0], e[2])) }
              var LOG = 1
              while ((1 shl LOG) <= n) LOG++
              val up = Array(LOG) { IntArray(n) }
              val depth = IntArray(n)
              val cnt = Array(n) { IntArray(27) }
              val seen = BooleanArray(n)
              val order = IntArray(n)
              var head = 0
              var tail = 0
              order[tail++] = 0
              seen[0] = true
              while (head < tail) {
                  val u = order[head++]
                  for (e in adj[u]) {
                      val v = e[0]
                      if (seen[v]) continue
                      seen[v] = true
                      up[0][v] = u
                      depth[v] = depth[u] + 1
                      cnt[v] = cnt[u].copyOf()
                      cnt[v][e[1]]++
                      order[tail++] = v
                  }
              }
              for (k in 1 until LOG) for (v in 0 until n) up[k][v] = up[k - 1][up[k - 1][v]]
              return IntArray(queries.size) { qi ->
                  val a = queries[qi][0]
                  val b = queries[qi][1]
                  var x = a
                  var y = b
                  if (depth[x] < depth[y]) { val t = x; x = y; y = t }
                  val diff = depth[x] - depth[y]
                  for (k in 0 until LOG) if ((diff shr k) and 1 == 1) x = up[k][x]
                  if (x != y) {
                      for (k in LOG - 1 downTo 0) if (up[k][x] != up[k][y]) { x = up[k][x]; y = up[k][y] }
                      x = up[0][x]
                  }
                  val l = x
                  var keep = 0
                  for (w in 1..26) keep = maxOf(keep, cnt[a][w] + cnt[b][w] - 2 * cnt[l][w])
                  depth[a] + depth[b] - 2 * depth[l] - keep
              }
          }
        `,
        swift: code`
          func minOperationsQueries(_ n: Int, _ edges: [[Int]], _ queries: [[Int]]) -> [Int] {
              var adj = [[(Int, Int)]](repeating: [], count: n)
              for e in edges { adj[e[0]].append((e[1], e[2])); adj[e[1]].append((e[0], e[2])) }
              var LOG = 1
              while (1 << LOG) <= n { LOG += 1 }
              var up = [[Int]](repeating: [Int](repeating: 0, count: n), count: LOG)
              var depth = [Int](repeating: 0, count: n)
              var cnt = [[Int]](repeating: [Int](repeating: 0, count: 27), count: n)
              var seen = [Bool](repeating: false, count: n)
              var order = [0]
              seen[0] = true
              var h = 0
              while h < order.count {
                  let u = order[h]
                  h += 1
                  for (v, w) in adj[u] where !seen[v] {
                      seen[v] = true
                      up[0][v] = u
                      depth[v] = depth[u] + 1
                      cnt[v] = cnt[u]
                      cnt[v][w] += 1
                      order.append(v)
                  }
              }
              if LOG > 1 {
                  for k in 1..<LOG { for v in 0..<n { up[k][v] = up[k - 1][up[k - 1][v]] } }
              }
              var res = [Int]()
              for q in queries {
                  let a = q[0], b = q[1]
                  var x = a, y = b
                  if depth[x] < depth[y] { swap(&x, &y) }
                  let diff = depth[x] - depth[y]
                  for k in 0..<LOG where (diff >> k) & 1 == 1 { x = up[k][x] }
                  if x != y {
                      for k in stride(from: LOG - 1, through: 0, by: -1) where up[k][x] != up[k][y] {
                          x = up[k][x]
                          y = up[k][y]
                      }
                      x = up[0][x]
                  }
                  let l = x
                  var keep = 0
                  for w in 1...26 { keep = max(keep, cnt[a][w] + cnt[b][w] - 2 * cnt[l][w]) }
                  res.append(depth[a] + depth[b] - 2 * depth[l] - keep)
              }
              return res
          }
        `,
        rust: code`
          fn minOperationsQueries(n: i32, edges: Vec<Vec<i32>>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let n = n as usize;
              let mut adj: Vec<Vec<(usize, usize)>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push((e[1] as usize, e[2] as usize));
                  adj[e[1] as usize].push((e[0] as usize, e[2] as usize));
              }
              let mut log = 1;
              while (1usize << log) <= n {
                  log += 1;
              }
              let mut up = vec![vec![0usize; n]; log];
              let mut depth = vec![0i32; n];
              let mut cnt = vec![[0i32; 27]; n];
              let mut seen = vec![false; n];
              let mut order = vec![0usize];
              seen[0] = true;
              let mut h = 0;
              while h < order.len() {
                  let u = order[h];
                  h += 1;
                  for &(v, w) in adj[u].iter() {
                      if seen[v] {
                          continue;
                      }
                      seen[v] = true;
                      up[0][v] = u;
                      depth[v] = depth[u] + 1;
                      cnt[v] = cnt[u];
                      cnt[v][w] += 1;
                      order.push(v);
                  }
              }
              for k in 1..log {
                  for v in 0..n {
                      up[k][v] = up[k - 1][up[k - 1][v]];
                  }
              }
              let mut res = Vec::with_capacity(queries.len());
              for q in queries.iter() {
                  let (a, b) = (q[0] as usize, q[1] as usize);
                  let (mut x, mut y) = (a, b);
                  if depth[x] < depth[y] {
                      std::mem::swap(&mut x, &mut y);
                  }
                  let diff = depth[x] - depth[y];
                  for k in 0..log {
                      if (diff >> k) & 1 == 1 {
                          x = up[k][x];
                      }
                  }
                  if x != y {
                      for k in (0..log).rev() {
                          if up[k][x] != up[k][y] {
                              x = up[k][x];
                              y = up[k][y];
                          }
                      }
                      x = up[0][x];
                  }
                  let l = x;
                  let mut keep = 0;
                  for w in 1..27 {
                      keep = keep.max(cnt[a][w] + cnt[b][w] - 2 * cnt[l][w]);
                  }
                  res.push(depth[a] + depth[b] - 2 * depth[l] - keep);
              }
              res
          }
        `,
        php: code`
          function minOperationsQueries($n, $edges, $queries) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as [$u, $v, $w]) { $adj[$u][] = [$v, $w]; $adj[$v][] = [$u, $w]; }
              $LOG = 1;
              while ((1 << $LOG) <= $n) $LOG++;
              $up = array_fill(0, $LOG, array_fill(0, $n, 0));
              $depth = array_fill(0, $n, 0);
              $cnt = array_fill(0, $n, array_fill(0, 27, 0));
              $seen = array_fill(0, $n, false);
              $order = [0];
              $seen[0] = true;
              for ($h = 0; $h < count($order); $h++) {
                  $u = $order[$h];
                  foreach ($adj[$u] as [$v, $w]) {
                      if ($seen[$v]) continue;
                      $seen[$v] = true;
                      $up[0][$v] = $u;
                      $depth[$v] = $depth[$u] + 1;
                      $cnt[$v] = $cnt[$u];
                      $cnt[$v][$w]++;
                      $order[] = $v;
                  }
              }
              for ($k = 1; $k < $LOG; $k++) for ($v = 0; $v < $n; $v++) $up[$k][$v] = $up[$k - 1][$up[$k - 1][$v]];
              $res = [];
              foreach ($queries as [$a, $b]) {
                  $x = $a;
                  $y = $b;
                  if ($depth[$x] < $depth[$y]) { $t = $x; $x = $y; $y = $t; }
                  $diff = $depth[$x] - $depth[$y];
                  for ($k = 0; $k < $LOG; $k++) if (($diff >> $k) & 1) $x = $up[$k][$x];
                  if ($x != $y) {
                      for ($k = $LOG - 1; $k >= 0; $k--) if ($up[$k][$x] != $up[$k][$y]) { $x = $up[$k][$x]; $y = $up[$k][$y]; }
                      $x = $up[0][$x];
                  }
                  $l = $x;
                  $keep = 0;
                  for ($w = 1; $w <= 26; $w++) $keep = max($keep, $cnt[$a][$w] + $cnt[$b][$w] - 2 * $cnt[$l][$w]);
                  $res[] = $depth[$a] + $depth[$b] - 2 * $depth[$l] - $keep;
              }
              return $res;
          }
        `,
        ruby: code`
          def minOperationsQueries(n, edges, queries)
            adj = Array.new(n) { [] }
            edges.each { |u, v, w| adj[u] << [v, w]; adj[v] << [u, w] }
            log = 1
            log += 1 while (1 << log) <= n
            up = Array.new(log) { Array.new(n, 0) }
            depth = Array.new(n, 0)
            cnt = Array.new(n) { Array.new(27, 0) }
            seen = Array.new(n, false)
            order = [0]
            seen[0] = true
            h = 0
            while h < order.length
              u = order[h]
              h += 1
              adj[u].each do |v, w|
                next if seen[v]
                seen[v] = true
                up[0][v] = u
                depth[v] = depth[u] + 1
                cnt[v] = cnt[u].dup
                cnt[v][w] += 1
                order << v
              end
            end
            (1...log).each { |k| n.times { |v| up[k][v] = up[k - 1][up[k - 1][v]] } }
            queries.map do |a, b|
              x = a
              y = b
              x, y = y, x if depth[x] < depth[y]
              diff = depth[x] - depth[y]
              log.times { |k| x = up[k][x] if (diff >> k) & 1 == 1 }
              if x != y
                (log - 1).downto(0) do |k|
                  if up[k][x] != up[k][y]
                    x = up[k][x]
                    y = up[k][y]
                  end
                end
                x = up[0][x]
              end
              l = x
              keep = (1..26).map { |w| cnt[a][w] + cnt[b][w] - 2 * cnt[l][w] }.max
              depth[a] + depth[b] - 2 * depth[l] - keep
            end
          end
        `,
      },
    };
  })(),

  // ── Minimum Edge Reversals So Every Node Is Reachable (LC 2858) ─
  (() => {
    const ref = (n: number, edges: number[][]) => {
      // From every root separately: an edge pointing toward the root must flip.
      const adj: number[][][] = Array.from({ length: n }, () => []);
      for (const [u, v] of edges) { adj[u].push([v, 0]); adj[v].push([u, 1]); }
      return Array.from({ length: n }, (_, r) => {
        const seen = new Array(n).fill(false);
        seen[r] = true;
        const q = [r];
        let flips = 0;
        for (let h = 0; h < q.length; h++) for (const [v, c] of adj[q[h]]) if (!seen[v]) { seen[v] = true; flips += c; q.push(v); }
        return flips;
      });
    };
    return {
      slug: "minimum-edge-reversals-so-every-node-is-reachable",
      title: "Minimum Edge Reversals So Every Node Is Reachable",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Depth-First Search", "Breadth-First Search", "Graph", "Google", "Amazon"],
      signature: { funcName: "minEdgeReversals", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A **directed** graph has `n` nodes numbered `0` to `n - 1`; each `edges[i] = [u, v]` is an edge from `u` to `v`. If the directions are ignored, the graph is a tree.\n\nAn **edge reversal** turns an edge `u → v` into `v → u`.\n\nFor every node `i`, independently, find the minimum number of reversals needed so that every node can be reached from `i` by following directed edges. Return the answers as an array.",
        [
          { in: "n = 4, edges = [[2,0],[2,1],[1,3]]", out: "[1,1,0,2]", note: "From node 2 everything is already reachable. From node 0, only 2 → 0 points the wrong way. From node 3, both 1 → 3 and 2 → 1 must flip." },
          { in: "n = 3, edges = [[1,2],[2,0]]", out: "[2,0,1]", note: "The edges form the chain 1 → 2 → 0, so node 1 needs nothing and node 0 must flip both." },
          { in: "n = 2, edges = [[0,1]]", out: "[0,1]" },
        ],
        ["2 <= n <= 10^5", "edges.length == n - 1", "edges[i].length == 2", "0 <= u, v < n", "u != v", "the input is a tree when edge directions are ignored"]),
      hints: [
        "For a fixed root, every edge must point away from it; the answer is the number of edges that point toward the root. One traversal from node 0 computes it for node 0.",
        "Move the root from a node `p` to a neighbour `c`. Only the edge between them changes its role — every other edge keeps pointing the same way relative to the root.",
        "If the edge is `p → c` it was free and now needs flipping (`+1`); if it is `c → p` it needed flipping and now is free (`−1`). Propagate from node 0 outwards (rerooting).",
      ],
      editorial: explain({
        idea: "With root `r`, an edge is fine exactly when it points away from `r`, so the cost is the count of edges pointing toward `r`. Moving the root across one edge flips the status of only that edge, so all `n` answers follow from the first by a single traversal.",
        steps: [
          "Store each edge in both endpoints' lists: `(v, 0)` at `u` for the forward direction `u → v`, and `(u, 1)` at `v` for walking against it.",
          "Traverse from node 0 and add up the costs of the edges walked: that is `ans[0]`.",
          "Traverse again from node 0; for a child `c` reached through an edge of cost `w`, set `ans[c] = ans[p] + (w == 0 ? 1 : −1)`.",
          "Return `ans`.",
        ],
        why: "For any root, the edges between the root and a node `x` must all point toward `x`, and edges elsewhere are judged the same way. When the root moves from `p` to its neighbour `c`, every edge other than `p–c` lies on the same side of both roots and keeps its status; the `p–c` edge changes from 'must point to `c`' to 'must point to `p`', hence the ±1.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Walk the tree undirected — the reversal costs live on the edge entries, not on reachability.",
          "Use an explicit stack or queue; a recursive DFS can overflow on a path of 10^5 nodes.",
          "The ±1 depends on the direction of the edge between parent and child, read from the parent's side.",
        ],
      }),
      examples: [
        { input: "4\n[[2,0],[2,1],[1,3]]", expectedOutput: "[1,1,0,2]" },
        { input: "3\n[[1,2],[2,0]]", expectedOutput: "[2,0,1]" },
        { input: "2\n[[0,1]]", expectedOutput: "[0,1]" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.15 ? ri(rng, 2, 4) : ri(rng, 5, 25);
        const edges = randomTreeEdges(rng, n, 0);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: fmtIntArr(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minEdgeReversals(n: int, edges: List[List[int]]) -> List[int]:
              adj = [[] for _ in range(n)]
              for u, v in edges:
                  adj[u].append((v, 0))
                  adj[v].append((u, 1))
              order = [0]
              parent = [-1] * n
              pcost = [0] * n
              seen = [False] * n
              seen[0] = True
              for u in order:
                  for v, c in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          pcost[v] = c
                          order.append(v)
              ans = [0] * n
              ans[0] = sum(pcost)
              for v in order[1:]:
                  ans[v] = ans[parent[v]] + (1 if pcost[v] == 0 else -1)
              return ans
        `,
        javascript: code`
          var minEdgeReversals = function(n, edges) {
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1], 0);
                  adj[edges[e][1]].push(edges[e][0], 1);
              }
              var parent = [], pcost = [], seen = [], order = [0];
              for (var j = 0; j < n; j++) { parent.push(-1); pcost.push(0); seen.push(false); }
              seen[0] = true;
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var k = 0; k < adj[u].length; k += 2) {
                      var v = adj[u][k];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; pcost[v] = adj[u][k + 1]; order.push(v); }
                  }
              }
              var ans = new Array(n);
              ans[0] = 0;
              for (var a = 0; a < n; a++) ans[0] += pcost[a];
              for (var t = 1; t < n; t++) {
                  var x = order[t];
                  ans[x] = ans[parent[x]] + (pcost[x] === 0 ? 1 : -1);
              }
              return ans;
          };
        `,
        typescript: code`
          function minEdgeReversals(n: number, edges: number[][]): number[] {
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) {
                  adj[edges[e][0]].push(edges[e][1], 0);
                  adj[edges[e][1]].push(edges[e][0], 1);
              }
              var parent: number[] = [], pcost: number[] = [], seen: boolean[] = [], order: number[] = [0];
              for (var j = 0; j < n; j++) { parent.push(-1); pcost.push(0); seen.push(false); }
              seen[0] = true;
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var k = 0; k < adj[u].length; k += 2) {
                      var v = adj[u][k];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; pcost[v] = adj[u][k + 1]; order.push(v); }
                  }
              }
              var ans: number[] = [];
              for (var z = 0; z < n; z++) ans.push(0);
              for (var a = 0; a < n; a++) ans[0] += pcost[a];
              for (var t = 1; t < n; t++) {
                  var x = order[t];
                  ans[x] = ans[parent[x]] + (pcost[x] === 0 ? 1 : -1);
              }
              return ans;
          }
        `,
        java: code`
          public static int[] minEdgeReversals(int n, int[][] edges) {
              List<List<int[]>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(new int[]{e[1], 0}); adj.get(e[1]).add(new int[]{e[0], 1}); }
              int[] parent = new int[n], pcost = new int[n], order = new int[n];
              boolean[] seen = new boolean[n];
              int head = 0, tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              parent[0] = -1;
              while (head < tail) {
                  int u = order[head++];
                  for (int[] e : adj.get(u)) {
                      if (!seen[e[0]]) { seen[e[0]] = true; parent[e[0]] = u; pcost[e[0]] = e[1]; order[tail++] = e[0]; }
                  }
              }
              int[] ans = new int[n];
              for (int c : pcost) ans[0] += c;
              for (int t = 1; t < n; t++) {
                  int x = order[t];
                  ans[x] = ans[parent[x]] + (pcost[x] == 0 ? 1 : -1);
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> minEdgeReversals(int n, vector<vector<int>>& edges) {
              vector<vector<pair<int, int>>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back({e[1], 0}); adj[e[1]].push_back({e[0], 1}); }
              vector<int> parent(n, -1), pcost(n, 0), order = {0};
              vector<bool> seen(n, false);
              seen[0] = true;
              for (size_t h = 0; h < order.size(); h++) {
                  int u = order[h];
                  for (auto& e : adj[u]) {
                      int v = e.first, c = e.second;
                      if (!seen[v]) { seen[v] = true; parent[v] = u; pcost[v] = c; order.push_back(v); }
                  }
              }
              vector<int> ans(n, 0);
              for (int c : pcost) ans[0] += c;
              for (int t = 1; t < n; t++) {
                  int x = order[t];
                  ans[x] = ans[parent[x]] + (pcost[x] == 0 ? 1 : -1);
              }
              return ans;
          }
        `,
        c: code`
          int* minEdgeReversals(int n, int** edges, int edgesSize, int* edgesColSize, int* returnSize) {
              int* head = (int*) malloc((size_t) n * sizeof(int));
              int* nxt = (int*) malloc((size_t) (2 * n) * sizeof(int));
              int* to = (int*) malloc((size_t) (2 * n) * sizeof(int));
              int* cost = (int*) malloc((size_t) (2 * n) * sizeof(int));
              int ec = 0;
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < edgesSize; e++) {
                  int u = edges[e][0], v = edges[e][1];
                  to[ec] = v; cost[ec] = 0; nxt[ec] = head[u]; head[u] = ec++;
                  to[ec] = u; cost[ec] = 1; nxt[ec] = head[v]; head[v] = ec++;
              }
              int* parent = (int*) malloc((size_t) n * sizeof(int));
              int* pcost = (int*) calloc((size_t) n, sizeof(int));
              int* order = (int*) malloc((size_t) n * sizeof(int));
              char* seen = (char*) calloc((size_t) n, 1);
              int qh = 0, qt = 0;
              order[qt++] = 0;
              seen[0] = 1;
              parent[0] = -1;
              while (qh < qt) {
                  int u = order[qh++];
                  for (int e = head[u]; e != -1; e = nxt[e]) {
                      int v = to[e];
                      if (!seen[v]) { seen[v] = 1; parent[v] = u; pcost[v] = cost[e]; order[qt++] = v; }
                  }
              }
              int* ans = (int*) calloc((size_t) n, sizeof(int));
              for (int i = 0; i < n; i++) ans[0] += pcost[i];
              for (int t = 1; t < n; t++) {
                  int x = order[t];
                  ans[x] = ans[parent[x]] + (pcost[x] == 0 ? 1 : -1);
              }
              free(head); free(nxt); free(to); free(cost); free(parent); free(pcost); free(order); free(seen);
              *returnSize = n;
              return ans;
          }
        `,
        csharp: code`
          public static int[] MinEdgeReversals(int n, int[][] edges)
          {
              var adj = new List<int[]>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int[]>();
              foreach (var e in edges) { adj[e[0]].Add(new[] { e[1], 0 }); adj[e[1]].Add(new[] { e[0], 1 }); }
              var parent = new int[n];
              var pcost = new int[n];
              var order = new int[n];
              var seen = new bool[n];
              int head = 0, tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              parent[0] = -1;
              while (head < tail)
              {
                  int u = order[head++];
                  foreach (var e in adj[u])
                      if (!seen[e[0]]) { seen[e[0]] = true; parent[e[0]] = u; pcost[e[0]] = e[1]; order[tail++] = e[0]; }
              }
              var ans = new int[n];
              foreach (int c in pcost) ans[0] += c;
              for (int t = 1; t < n; t++)
              {
                  int x = order[t];
                  ans[x] = ans[parent[x]] + (pcost[x] == 0 ? 1 : -1);
              }
              return ans;
          }
        `,
        go: code`
          func minEdgeReversals(n int, edges [][]int) []int {
              adj := make([][][2]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], [2]int{e[1], 0})
                  adj[e[1]] = append(adj[e[1]], [2]int{e[0], 1})
              }
              parent := make([]int, n)
              pcost := make([]int, n)
              seen := make([]bool, n)
              order := []int{0}
              seen[0] = true
              parent[0] = -1
              for h := 0; h < len(order); h++ {
                  u := order[h]
                  for _, e := range adj[u] {
                      if !seen[e[0]] {
                          seen[e[0]] = true
                          parent[e[0]] = u
                          pcost[e[0]] = e[1]
                          order = append(order, e[0])
                      }
                  }
              }
              ans := make([]int, n)
              for _, c := range pcost {
                  ans[0] += c
              }
              for t := 1; t < n; t++ {
                  x := order[t]
                  if pcost[x] == 0 {
                      ans[x] = ans[parent[x]] + 1
                  } else {
                      ans[x] = ans[parent[x]] - 1
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun minEdgeReversals(n: Int, edges: Array<IntArray>): IntArray {
              val adj = Array(n) { ArrayList<IntArray>() }
              for (e in edges) { adj[e[0]].add(intArrayOf(e[1], 0)); adj[e[1]].add(intArrayOf(e[0], 1)) }
              val parent = IntArray(n) { -1 }
              val pcost = IntArray(n)
              val order = IntArray(n)
              val seen = BooleanArray(n)
              var head = 0
              var tail = 0
              order[tail++] = 0
              seen[0] = true
              while (head < tail) {
                  val u = order[head++]
                  for (e in adj[u]) if (!seen[e[0]]) { seen[e[0]] = true; parent[e[0]] = u; pcost[e[0]] = e[1]; order[tail++] = e[0] }
              }
              val ans = IntArray(n)
              ans[0] = pcost.sum()
              for (t in 1 until n) {
                  val x = order[t]
                  ans[x] = ans[parent[x]] + if (pcost[x] == 0) 1 else -1
              }
              return ans
          }
        `,
        swift: code`
          func minEdgeReversals(_ n: Int, _ edges: [[Int]]) -> [Int] {
              var adj = [[(Int, Int)]](repeating: [], count: n)
              for e in edges { adj[e[0]].append((e[1], 0)); adj[e[1]].append((e[0], 1)) }
              var parent = [Int](repeating: -1, count: n)
              var pcost = [Int](repeating: 0, count: n)
              var seen = [Bool](repeating: false, count: n)
              var order = [0]
              seen[0] = true
              var h = 0
              while h < order.count {
                  let u = order[h]
                  h += 1
                  for (v, c) in adj[u] where !seen[v] {
                      seen[v] = true
                      parent[v] = u
                      pcost[v] = c
                      order.append(v)
                  }
              }
              var ans = [Int](repeating: 0, count: n)
              ans[0] = pcost.reduce(0, +)
              for x in order.dropFirst() {
                  ans[x] = ans[parent[x]] + (pcost[x] == 0 ? 1 : -1)
              }
              return ans
          }
        `,
        rust: code`
          fn minEdgeReversals(n: i32, edges: Vec<Vec<i32>>) -> Vec<i32> {
              let n = n as usize;
              let mut adj: Vec<Vec<(usize, i32)>> = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push((e[1] as usize, 0));
                  adj[e[1] as usize].push((e[0] as usize, 1));
              }
              let mut parent = vec![0usize; n];
              let mut pcost = vec![0i32; n];
              let mut seen = vec![false; n];
              let mut order = vec![0usize];
              seen[0] = true;
              let mut h = 0;
              while h < order.len() {
                  let u = order[h];
                  h += 1;
                  for &(v, c) in adj[u].iter() {
                      if !seen[v] {
                          seen[v] = true;
                          parent[v] = u;
                          pcost[v] = c;
                          order.push(v);
                      }
                  }
              }
              let mut ans = vec![0i32; n];
              ans[0] = pcost.iter().sum();
              for t in 1..n {
                  let x = order[t];
                  ans[x] = ans[parent[x]] + if pcost[x] == 0 { 1 } else { -1 };
              }
              ans
          }
        `,
        php: code`
          function minEdgeReversals($n, $edges) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as [$u, $v]) { $adj[$u][] = [$v, 0]; $adj[$v][] = [$u, 1]; }
              $parent = array_fill(0, $n, -1);
              $pcost = array_fill(0, $n, 0);
              $seen = array_fill(0, $n, false);
              $order = [0];
              $seen[0] = true;
              for ($h = 0; $h < count($order); $h++) {
                  $u = $order[$h];
                  foreach ($adj[$u] as [$v, $c]) {
                      if (!$seen[$v]) { $seen[$v] = true; $parent[$v] = $u; $pcost[$v] = $c; $order[] = $v; }
                  }
              }
              $ans = array_fill(0, $n, 0);
              $ans[0] = array_sum($pcost);
              for ($t = 1; $t < $n; $t++) {
                  $x = $order[$t];
                  $ans[$x] = $ans[$parent[$x]] + ($pcost[$x] == 0 ? 1 : -1);
              }
              return $ans;
          }
        `,
        ruby: code`
          def minEdgeReversals(n, edges)
            adj = Array.new(n) { [] }
            edges.each { |u, v| adj[u] << [v, 0]; adj[v] << [u, 1] }
            parent = Array.new(n, -1)
            pcost = Array.new(n, 0)
            seen = Array.new(n, false)
            order = [0]
            seen[0] = true
            h = 0
            while h < order.length
              u = order[h]
              h += 1
              adj[u].each do |v, c|
                next if seen[v]
                seen[v] = true
                parent[v] = u
                pcost[v] = c
                order << v
              end
            end
            ans = Array.new(n, 0)
            ans[0] = pcost.sum
            order.drop(1).each { |x| ans[x] = ans[parent[x]] + (pcost[x] == 0 ? 1 : -1) }
            ans
          end
        `,
      },
    };
  })(),

  // ── Count Valid Paths in a Tree (LC 2867) ───────────────────────
  (() => {
    const isPrimeNum = (x: number) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
    const ref = (n: number, edges: number[][]) => {
      // Every pair (a, b), walking the path and counting primes on it.
      const adj = adjOf(n + 1, edges);
      let count = 0;
      for (let a = 1; a <= n; a++) {
        const par = new Array(n + 1).fill(-2);
        par[a] = -1;
        const q = [a];
        for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (par[v] === -2) { par[v] = q[h]; q.push(v); }
        for (let b = a + 1; b <= n; b++) {
          let primes = 0;
          for (let x = b; x !== -1; x = par[x]) if (isPrimeNum(x)) primes++;
          if (primes === 1) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-valid-paths-in-a-tree",
      title: "Count Valid Paths in a Tree",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Tree", "Depth-First Search", "Number Theory", "Union Find", "Google", "Amazon"],
      signature: { funcName: "countPaths", params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An undirected tree has `n` nodes labelled `1` to `n`, joined by the `n - 1` edges in `edges`.\n\nA path between two different nodes `a` and `b` is **valid** if **exactly one** of the node labels on it (endpoints included) is a prime number. The path from `a` to `b` and the path from `b` to `a` count as the same path.\n\nReturn the number of valid paths.\n\nCodeKairo bounds `n` at `10^4` so the count always fits in a 32-bit integer.",
        [
          { in: "n = 5, edges = [[1,2],[1,3],[2,4],[2,5]]", out: "4", note: "The valid paths are 1–2, 1–3, 1–2–4 and 2–4: each contains exactly one of the primes 2, 3, 5." },
          { in: "n = 6, edges = [[1,2],[1,3],[2,4],[3,5],[3,6]]", out: "6", note: "1–2, 1–3, 1–2–4, 2–4, 3–6 and 1–3–6." },
          { in: "n = 1, edges = []", out: "0", note: "There is no pair of different nodes." },
        ],
        ["1 <= n <= 10^4", "edges.length == n - 1", "edges[i].length == 2", "1 <= u, v <= n", "edges represents a valid tree"]),
      hints: [
        "Remove every prime node: the non-prime nodes fall apart into connected groups. A valid path contains exactly one prime, so everything else on it lies inside such groups.",
        "Fix the prime `p` on the path. Each end of the path is either `p` itself or a node in one of the non-prime groups touching `p` — and the two ends must come from different groups.",
        "Find the groups with union-find over edges joining two non-primes. For a prime `p` whose neighbouring groups have sizes `s1, s2, …`, add `s_i` (paths ending at `p`) plus `s_i · (s1 + … + s_{i-1})` (paths crossing `p`) for each `i`.",
      ],
      editorial: explain({
        idea: "A valid path has a single prime `p`; the rest of the path consists of non-prime nodes on either side of `p`, each side inside one connected group of non-primes adjacent to `p`. Precompute the size of every non-prime group, and count, for each prime, the pairs of ends it can join.",
        steps: [
          "Sieve the primes up to `n`.",
          "Union-find: join `u` and `v` for every edge whose ends are both non-prime; group sizes come from the roots.",
          "For each prime `p`, walk its non-prime neighbours; for a neighbour's group of size `s`, add `s · (1 + seen)` to the answer, then `seen += s` (`seen` starts at 0 for each prime).",
          "Return the total.",
        ],
        why: "Each valid path corresponds to exactly one prime `p` and one or two ends in distinct groups adjacent to `p` (two neighbours of `p` can never share a group, since the tree has no cycle). `s · 1` counts paths from `p` into the group, and `s · seen` counts paths between this group and the earlier ones through `p`; every such path is counted once.",
        time: "O(n α(n) + n log log n)",
        space: "O(n)",
        pitfalls: [
          "1 is not prime.",
          "Paths with zero primes or with two or more primes are both invalid — never count paths inside a single non-prime group.",
          "In the real problem `n` reaches `10^5` and the count needs 64 bits; with CodeKairo's bound of `10^4` it fits in 32.",
        ],
      }),
      examples: [
        { input: "5\n[[1,2],[1,3],[2,4],[2,5]]", expectedOutput: "4" },
        { input: "6\n[[1,2],[1,3],[2,4],[3,5],[3,6]]", expectedOutput: "6" },
        { input: "1\n[]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.1 ? ri(rng, 1, 4) : ri(rng, 5, 32);
        const edges = randomTreeEdges(rng, n, 1);
        return { input: `${n}\n${fmtIntMat(edges)}`, expectedOutput: String(ref(n, edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countPaths(n: int, edges: List[List[int]]) -> int:
              is_prime = [False, False] + [True] * (n - 1)
              for i in range(2, int(n ** 0.5) + 1):
                  if is_prime[i]:
                      for j in range(i * i, n + 1, i):
                          is_prime[j] = False
              parent = list(range(n + 1))
              size = [1] * (n + 1)

              def find(x):
                  while parent[x] != x:
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  return x

              adj = [[] for _ in range(n + 1)]
              for u, v in edges:
                  adj[u].append(v)
                  adj[v].append(u)
                  if not is_prime[u] and not is_prime[v]:
                      a, b = find(u), find(v)
                      if a != b:
                          if size[a] < size[b]:
                              a, b = b, a
                          parent[b] = a
                          size[a] += size[b]
              total = 0
              for p in range(2, n + 1):
                  if not is_prime[p]:
                      continue
                  seen = 0
                  for v in adj[p]:
                      if not is_prime[v]:
                          s = size[find(v)]
                          total += s * (1 + seen)
                          seen += s
              return total
        `,
        javascript: code`
          var countPaths = function(n, edges) {
              var isPrime = new Array(n + 1);
              for (var i = 0; i <= n; i++) isPrime[i] = i >= 2;
              for (var a = 2; a * a <= n; a++) if (isPrime[a]) for (var b = a * a; b <= n; b += a) isPrime[b] = false;
              var parent = new Array(n + 1), size = new Array(n + 1), adj = [];
              for (var k = 0; k <= n; k++) { parent[k] = k; size[k] = 1; adj.push([]); }
              var find = function(x) {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              for (var e = 0; e < edges.length; e++) {
                  var u = edges[e][0], v = edges[e][1];
                  adj[u].push(v); adj[v].push(u);
                  if (!isPrime[u] && !isPrime[v]) {
                      var ru = find(u), rv = find(v);
                      if (ru !== rv) {
                          if (size[ru] < size[rv]) { var t = ru; ru = rv; rv = t; }
                          parent[rv] = ru;
                          size[ru] += size[rv];
                      }
                  }
              }
              var total = 0;
              for (var p = 2; p <= n; p++) {
                  if (!isPrime[p]) continue;
                  var seen = 0;
                  for (var j = 0; j < adj[p].length; j++) {
                      var w = adj[p][j];
                      if (isPrime[w]) continue;
                      var s = size[find(w)];
                      total += s * (1 + seen);
                      seen += s;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function countPaths(n: number, edges: number[][]): number {
              var isPrime: boolean[] = [];
              for (var i = 0; i <= n; i++) isPrime.push(i >= 2);
              for (var a = 2; a * a <= n; a++) if (isPrime[a]) for (var b = a * a; b <= n; b += a) isPrime[b] = false;
              var parent: number[] = [], size: number[] = [], adj: number[][] = [];
              for (var k = 0; k <= n; k++) { parent.push(k); size.push(1); adj.push([]); }
              var find = function(x: number): number {
                  while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              for (var e = 0; e < edges.length; e++) {
                  var u = edges[e][0], v = edges[e][1];
                  adj[u].push(v); adj[v].push(u);
                  if (!isPrime[u] && !isPrime[v]) {
                      var ru = find(u), rv = find(v);
                      if (ru !== rv) {
                          if (size[ru] < size[rv]) { var t = ru; ru = rv; rv = t; }
                          parent[rv] = ru;
                          size[ru] += size[rv];
                      }
                  }
              }
              var total = 0;
              for (var p = 2; p <= n; p++) {
                  if (!isPrime[p]) continue;
                  var seen = 0;
                  for (var j = 0; j < adj[p].length; j++) {
                      var w = adj[p][j];
                      if (isPrime[w]) continue;
                      var s = size[find(w)];
                      total += s * (1 + seen);
                      seen += s;
                  }
              }
              return total;
          }
        `,
        java: code`
          static int[] dsuParent;

          static int dsuFind(int x) {
              while (dsuParent[x] != x) { dsuParent[x] = dsuParent[dsuParent[x]]; x = dsuParent[x]; }
              return x;
          }

          public static int countPaths(int n, int[][] edges) {
              boolean[] composite = new boolean[n + 1];
              composite[0] = true;
              if (n >= 1) composite[1] = true;
              for (int a = 2; (long) a * a <= n; a++) if (!composite[a]) for (int b = a * a; b <= n; b += a) composite[b] = true;
              dsuParent = new int[n + 1];
              int[] size = new int[n + 1];
              List<List<Integer>> adj = new ArrayList<>();
              for (int k = 0; k <= n; k++) { dsuParent[k] = k; size[k] = 1; adj.add(new ArrayList<>()); }
              for (int[] e : edges) {
                  int u = e[0], v = e[1];
                  adj.get(u).add(v); adj.get(v).add(u);
                  if (composite[u] && composite[v]) {
                      int ru = dsuFind(u), rv = dsuFind(v);
                      if (ru != rv) {
                          if (size[ru] < size[rv]) { int t = ru; ru = rv; rv = t; }
                          dsuParent[rv] = ru;
                          size[ru] += size[rv];
                      }
                  }
              }
              long total = 0;
              for (int p = 2; p <= n; p++) {
                  if (composite[p]) continue;
                  long seen = 0;
                  for (int w : adj.get(p)) {
                      if (!composite[w]) continue;
                      long s = size[dsuFind(w)];
                      total += s * (1 + seen);
                      seen += s;
                  }
              }
              return (int) total;
          }
        `,
        cpp: code`
          int countPaths(int n, vector<vector<int>>& edges) {
              vector<bool> composite(n + 1, false);
              composite[0] = true;
              if (n >= 1) composite[1] = true;
              for (int a = 2; (long long) a * a <= n; a++) if (!composite[a]) for (int b = a * a; b <= n; b += a) composite[b] = true;
              vector<int> parent(n + 1), sz(n + 1, 1);
              iota(parent.begin(), parent.end(), 0);
              function<int(int)> find = [&](int x) {
                  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
                  return x;
              };
              vector<vector<int>> adj(n + 1);
              for (auto& e : edges) {
                  int u = e[0], v = e[1];
                  adj[u].push_back(v); adj[v].push_back(u);
                  if (composite[u] && composite[v]) {
                      int ru = find(u), rv = find(v);
                      if (ru != rv) {
                          if (sz[ru] < sz[rv]) swap(ru, rv);
                          parent[rv] = ru;
                          sz[ru] += sz[rv];
                      }
                  }
              }
              long long total = 0;
              for (int p = 2; p <= n; p++) {
                  if (composite[p]) continue;
                  long long seen = 0;
                  for (int w : adj[p]) {
                      if (!composite[w]) continue;
                      long long s = sz[find(w)];
                      total += s * (1 + seen);
                      seen += s;
                  }
              }
              return (int) total;
          }
        `,
        c: code`
          static int* g_par;

          static int dsuFind(int x) {
              while (g_par[x] != x) { g_par[x] = g_par[g_par[x]]; x = g_par[x]; }
              return x;
          }

          int countPaths(int n, int** edges, int edgesSize, int* edgesColSize) {
              char* composite = (char*) calloc((size_t) (n + 1), 1);
              composite[0] = 1;
              if (n >= 1) composite[1] = 1;
              for (int a = 2; (long long) a * a <= n; a++) if (!composite[a]) for (int b = a * a; b <= n; b += a) composite[b] = 1;
              g_par = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int* size = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int* head = (int*) malloc((size_t) (n + 1) * sizeof(int));
              int* nxt = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int* to = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int ec = 0;
              for (int k = 0; k <= n; k++) { g_par[k] = k; size[k] = 1; head[k] = -1; }
              for (int e = 0; e < edgesSize; e++) {
                  int u = edges[e][0], v = edges[e][1];
                  to[ec] = v; nxt[ec] = head[u]; head[u] = ec++;
                  to[ec] = u; nxt[ec] = head[v]; head[v] = ec++;
                  if (composite[u] && composite[v]) {
                      int ru = dsuFind(u), rv = dsuFind(v);
                      if (ru != rv) {
                          if (size[ru] < size[rv]) { int t = ru; ru = rv; rv = t; }
                          g_par[rv] = ru;
                          size[ru] += size[rv];
                      }
                  }
              }
              long long total = 0;
              for (int p = 2; p <= n; p++) {
                  if (composite[p]) continue;
                  long long seen = 0;
                  for (int e = head[p]; e != -1; e = nxt[e]) {
                      int w = to[e];
                      if (!composite[w]) continue;
                      long long s = size[dsuFind(w)];
                      total += s * (1 + seen);
                      seen += s;
                  }
              }
              free(composite); free(g_par); free(size); free(head); free(nxt); free(to);
              return (int) total;
          }
        `,
        csharp: code`
          static int[] dsuParent;

          static int DsuFind(int x)
          {
              while (dsuParent[x] != x) { dsuParent[x] = dsuParent[dsuParent[x]]; x = dsuParent[x]; }
              return x;
          }

          public static int CountPaths(int n, int[][] edges)
          {
              var composite = new bool[n + 1];
              composite[0] = true;
              if (n >= 1) composite[1] = true;
              for (int a = 2; (long) a * a <= n; a++) if (!composite[a]) for (int b = a * a; b <= n; b += a) composite[b] = true;
              dsuParent = new int[n + 1];
              var size = new int[n + 1];
              var adj = new List<int>[n + 1];
              for (int k = 0; k <= n; k++) { dsuParent[k] = k; size[k] = 1; adj[k] = new List<int>(); }
              foreach (var e in edges)
              {
                  int u = e[0], v = e[1];
                  adj[u].Add(v); adj[v].Add(u);
                  if (composite[u] && composite[v])
                  {
                      int ru = DsuFind(u), rv = DsuFind(v);
                      if (ru != rv)
                      {
                          if (size[ru] < size[rv]) { int t = ru; ru = rv; rv = t; }
                          dsuParent[rv] = ru;
                          size[ru] += size[rv];
                      }
                  }
              }
              long total = 0;
              for (int p = 2; p <= n; p++)
              {
                  if (composite[p]) continue;
                  long seen = 0;
                  foreach (int w in adj[p])
                  {
                      if (!composite[w]) continue;
                      long s = size[DsuFind(w)];
                      total += s * (1 + seen);
                      seen += s;
                  }
              }
              return (int) total;
          }
        `,
        go: code`
          func countPaths(n int, edges [][]int) int {
              composite := make([]bool, n+1)
              composite[0] = true
              if n >= 1 {
                  composite[1] = true
              }
              for a := 2; a*a <= n; a++ {
                  if !composite[a] {
                      for b := a * a; b <= n; b += a {
                          composite[b] = true
                      }
                  }
              }
              parent := make([]int, n+1)
              size := make([]int, n+1)
              adj := make([][]int, n+1)
              for k := 0; k <= n; k++ {
                  parent[k] = k
                  size[k] = 1
              }
              find := func(x int) int {
                  for parent[x] != x {
                      parent[x] = parent[parent[x]]
                      x = parent[x]
                  }
                  return x
              }
              for _, e := range edges {
                  u, v := e[0], e[1]
                  adj[u] = append(adj[u], v)
                  adj[v] = append(adj[v], u)
                  if composite[u] && composite[v] {
                      ru, rv := find(u), find(v)
                      if ru != rv {
                          if size[ru] < size[rv] {
                              ru, rv = rv, ru
                          }
                          parent[rv] = ru
                          size[ru] += size[rv]
                      }
                  }
              }
              total := 0
              for p := 2; p <= n; p++ {
                  if composite[p] {
                      continue
                  }
                  seen := 0
                  for _, w := range adj[p] {
                      if !composite[w] {
                          continue
                      }
                      s := size[find(w)]
                      total += s * (1 + seen)
                      seen += s
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun countPaths(n: Int, edges: Array<IntArray>): Int {
              val composite = BooleanArray(n + 1)
              composite[0] = true
              if (n >= 1) composite[1] = true
              var a = 2
              while (a.toLong() * a <= n) {
                  if (!composite[a]) { var b = a * a; while (b <= n) { composite[b] = true; b += a } }
                  a++
              }
              val parent = IntArray(n + 1) { it }
              val size = IntArray(n + 1) { 1 }
              val adj = Array(n + 1) { ArrayList<Int>() }
              fun find(start: Int): Int {
                  var x = start
                  while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              for (e in edges) {
                  val u = e[0]
                  val v = e[1]
                  adj[u].add(v); adj[v].add(u)
                  if (composite[u] && composite[v]) {
                      var ru = find(u)
                      var rv = find(v)
                      if (ru != rv) {
                          if (size[ru] < size[rv]) { val t = ru; ru = rv; rv = t }
                          parent[rv] = ru
                          size[ru] += size[rv]
                      }
                  }
              }
              var total = 0L
              for (p in 2..n) {
                  if (composite[p]) continue
                  var seen = 0L
                  for (w in adj[p]) {
                      if (!composite[w]) continue
                      val s = size[find(w)].toLong()
                      total += s * (1 + seen)
                      seen += s
                  }
              }
              return total.toInt()
          }
        `,
        swift: code`
          func countPaths(_ n: Int, _ edges: [[Int]]) -> Int {
              var composite = [Bool](repeating: false, count: n + 1)
              composite[0] = true
              if n >= 1 { composite[1] = true }
              var a = 2
              while a * a <= n {
                  if !composite[a] { var b = a * a; while b <= n { composite[b] = true; b += a } }
                  a += 1
              }
              var parent = Array(0...n)
              var size = [Int](repeating: 1, count: n + 1)
              var adj = [[Int]](repeating: [], count: n + 1)
              func find(_ start: Int) -> Int {
                  var x = start
                  while parent[x] != x { parent[x] = parent[parent[x]]; x = parent[x] }
                  return x
              }
              for e in edges {
                  let u = e[0], v = e[1]
                  adj[u].append(v); adj[v].append(u)
                  if composite[u] && composite[v] {
                      var ru = find(u), rv = find(v)
                      if ru != rv {
                          if size[ru] < size[rv] { swap(&ru, &rv) }
                          parent[rv] = ru
                          size[ru] += size[rv]
                      }
                  }
              }
              var total = 0
              if n >= 2 {
                  for p in 2...n where !composite[p] {
                      var seen = 0
                      for w in adj[p] where composite[w] {
                          let s = size[find(w)]
                          total += s * (1 + seen)
                          seen += s
                      }
                  }
              }
              return total
          }
        `,
        rust: code`
          fn dsu_find(parent: &mut Vec<usize>, start: usize) -> usize {
              let mut x = start;
              while parent[x] != x {
                  parent[x] = parent[parent[x]];
                  x = parent[x];
              }
              x
          }

          fn countPaths(n: i32, edges: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let mut composite = vec![false; n + 1];
              composite[0] = true;
              if n >= 1 {
                  composite[1] = true;
              }
              let mut a = 2;
              while a * a <= n {
                  if !composite[a] {
                      let mut b = a * a;
                      while b <= n {
                          composite[b] = true;
                          b += a;
                      }
                  }
                  a += 1;
              }
              let mut parent: Vec<usize> = (0..=n).collect();
              let mut size = vec![1i64; n + 1];
              let mut adj = vec![Vec::new(); n + 1];
              for e in edges.iter() {
                  let (u, v) = (e[0] as usize, e[1] as usize);
                  adj[u].push(v);
                  adj[v].push(u);
                  if composite[u] && composite[v] {
                      let (mut ru, mut rv) = (dsu_find(&mut parent, u), dsu_find(&mut parent, v));
                      if ru != rv {
                          if size[ru] < size[rv] {
                              std::mem::swap(&mut ru, &mut rv);
                          }
                          parent[rv] = ru;
                          size[ru] += size[rv];
                      }
                  }
              }
              let mut total: i64 = 0;
              for p in 2..=n {
                  if composite[p] {
                      continue;
                  }
                  let mut seen: i64 = 0;
                  for i in 0..adj[p].len() {
                      let w = adj[p][i];
                      if !composite[w] {
                          continue;
                      }
                      let r = dsu_find(&mut parent, w);
                      let s = size[r];
                      total += s * (1 + seen);
                      seen += s;
                  }
              }
              total as i32
          }
        `,
        php: code`
          function countPaths($n, $edges) {
              $composite = array_fill(0, $n + 1, false);
              $composite[0] = true;
              if ($n >= 1) $composite[1] = true;
              for ($a = 2; $a * $a <= $n; $a++) if (!$composite[$a]) for ($b = $a * $a; $b <= $n; $b += $a) $composite[$b] = true;
              $parent = range(0, $n);
              $size = array_fill(0, $n + 1, 1);
              $adj = array_fill(0, $n + 1, []);
              $find = function ($x) use (&$parent) {
                  while ($parent[$x] != $x) { $parent[$x] = $parent[$parent[$x]]; $x = $parent[$x]; }
                  return $x;
              };
              foreach ($edges as [$u, $v]) {
                  $adj[$u][] = $v;
                  $adj[$v][] = $u;
                  if ($composite[$u] && $composite[$v]) {
                      $ru = $find($u);
                      $rv = $find($v);
                      if ($ru != $rv) {
                          if ($size[$ru] < $size[$rv]) { $t = $ru; $ru = $rv; $rv = $t; }
                          $parent[$rv] = $ru;
                          $size[$ru] += $size[$rv];
                      }
                  }
              }
              $total = 0;
              for ($p = 2; $p <= $n; $p++) {
                  if ($composite[$p]) continue;
                  $seen = 0;
                  foreach ($adj[$p] as $w) {
                      if (!$composite[$w]) continue;
                      $s = $size[$find($w)];
                      $total += $s * (1 + $seen);
                      $seen += $s;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def countPaths(n, edges)
            composite = Array.new(n + 1, false)
            composite[0] = true
            composite[1] = true if n >= 1
            a = 2
            while a * a <= n
              (a * a).step(n, a) { |b| composite[b] = true } unless composite[a]
              a += 1
            end
            parent = (0..n).to_a
            size = Array.new(n + 1, 1)
            adj = Array.new(n + 1) { [] }
            find = lambda do |x|
              while parent[x] != x
                parent[x] = parent[parent[x]]
                x = parent[x]
              end
              x
            end
            edges.each do |u, v|
              adj[u] << v
              adj[v] << u
              next unless composite[u] && composite[v]
              ru = find.call(u)
              rv = find.call(v)
              next if ru == rv
              ru, rv = rv, ru if size[ru] < size[rv]
              parent[rv] = ru
              size[ru] += size[rv]
            end
            total = 0
            (2..n).each do |p|
              next if composite[p]
              seen = 0
              adj[p].each do |w|
                next unless composite[w]
                s = size[find.call(w)]
                total += s * (1 + seen)
                seen += s
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of K-Divisible Components (LC 2872) ──────────
  (() => {
    const ref = (n: number, edges: number[][], values: number[], k: number) => {
      // Every subset of edges to cut; keep the most components that all divide by k.
      let best = 0;
      for (let mask = 0; mask < 1 << edges.length; mask++) {
        const lab = componentsOf(n, edges, edges.map((_, i) => ((mask >> i) & 1) === 0));
        const sums = new Map<number, number>();
        for (let v = 0; v < n; v++) sums.set(lab[v], ((sums.get(lab[v]) ?? 0) + values[v]) % k);
        if ([...sums.values()].every((s) => s === 0)) best = Math.max(best, sums.size);
      }
      return best;
    };
    return {
      slug: "maximum-number-of-k-divisible-components",
      title: "Maximum Number of K-Divisible Components",
      difficulty: "HARD" as const,
      tags: ["Tree", "Depth-First Search", "Amazon", "Google"],
      signature: {
        funcName: "maxKDivisibleComponents",
        params: [{ name: "n", type: "int" as const }, { name: "edges", type: "int[][]" as const }, { name: "values", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An undirected tree has `n` nodes numbered `0` to `n - 1`, joined by the `n - 1` edges in `edges`. Node `i` has the value `values[i]`, and the sum of all values is divisible by the integer `k`.\n\nA **valid split** removes some set of edges (possibly none) so that the value of every resulting component — the sum of its nodes' values — is divisible by `k`.\n\nReturn the **maximum** number of components in any valid split.",
        [
          { in: "n = 5, edges = [[0,2],[1,2],[1,3],[2,4]], values = [1,8,1,4,4], k = 6", out: "2", note: "Remove the edge [1,2]: the components {1,3} (8 + 4 = 12) and {0,2,4} (1 + 1 + 4 = 6) are both divisible by 6." },
          { in: "n = 7, edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]], values = [3,0,6,1,5,2,1], k = 3", out: "3", note: "Remove [0,1] and [0,2]: {0} = 3, {1,3,4} = 6 and {2,5,6} = 9." },
          { in: "n = 1, edges = [], values = [0], k = 7", out: "1" },
        ],
        ["1 <= n <= 3 * 10^4", "edges.length == n - 1", "edges[i].length == 2", "0 <= a, b < n", "values.length == n", "0 <= values[i] <= 10^9", "1 <= k <= 10^9", "the sum of values is divisible by k", "edges represents a valid tree"]),
      hints: [
        "Root the tree. Cutting the edge above a node `v` is only allowed if the part cut off — what remains of `v`'s subtree — is divisible by `k`.",
        "Work bottom-up: if a subtree's sum is divisible by `k`, cutting it off never hurts, because the rest of the tree keeps a sum divisible by `k` too.",
        "So count the subtrees whose sum is `0 mod k` in one post-order pass; the root's subtree always qualifies. Keep sums modulo `k` to avoid overflow.",
      ],
      editorial: explain({
        idea: "A component boundary can sit above node `v` exactly when `v`'s subtree sum is divisible by `k`: the total is divisible by `k`, so what is left above is divisible too. Every such subtree can be cut at once, giving one component per divisible subtree.",
        steps: [
          "Get an order of the nodes from root 0 with their parents (iterative DFS or BFS).",
          "Process nodes children-first, accumulating `sum[v] = (values[v] + Σ sum[child]) mod k`.",
          "Whenever `sum[v] == 0`, count one component.",
          "Return the count (the root always contributes 1).",
        ],
        why: "If `v`'s subtree sum is divisible by `k`, cutting above `v` splits off a valid piece and leaves a remainder that is still divisible, so all such cuts can be made together; the components are then the gaps between consecutive cuts, each with sum equal to a difference of multiples of `k`. Conversely, any valid split only cuts above nodes whose subtree sum is divisible (the subtree is the union of complete components). So the number of divisible subtrees is the maximum.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Two remainders below `k ≤ 10^9` add up to nearly `2 · 10^9` — use 64-bit arithmetic before taking the remainder.",
          "Values may be 0, so a zero-valued leaf is a component on its own.",
          "Recursion can overflow on a path of `3 · 10^4` nodes in some runtimes; an explicit order avoids it.",
        ],
      }),
      examples: [
        { input: "5\n[[0,2],[1,2],[1,3],[2,4]]\n[1,8,1,4,4]\n6", expectedOutput: "2" },
        { input: "7\n[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]\n[3,0,6,1,5,2,1]\n3", expectedOutput: "3" },
        { input: "1\n[]\n[0]\n7", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [3, 6, 9, 11]));
        const k = pick(rng, [1, 2, 3, 5, ri(rng, 2, 10), ri(rng, 1, 1000000000)]);
        const V = pick(rng, [k, 2 * k, 1000000000]);
        const values = Array.from({ length: n }, () => (rng() < 0.15 ? 0 : ri(rng, 0, Math.min(1000000000, V))));
        // Make the total divisible by k by topping up a node that has room.
        let rem = values.reduce((s, x) => (s + x) % k, 0);
        if (rem !== 0) {
          const need = k - rem;
          const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          const room = order.find((i) => values[i] + need <= 1000000000);
          if (room !== undefined) values[room] += need;
          else values[order[0]] -= rem;
          rem = 0;
        }
        const edges = randomTreeEdges(rng, n, 0);
        return { input: `${n}\n${fmtIntMat(edges)}\n${fmtIntArr(values)}\n${k}`, expectedOutput: String(ref(n, edges, values, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxKDivisibleComponents(n: int, edges: List[List[int]], values: List[int], k: int) -> int:
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-1] * n
              order = [0]
              seen = [False] * n
              seen[0] = True
              for u in order:
                  for v in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          order.append(v)
              rem = [x % k for x in values]
              count = 0
              for u in reversed(order):
                  if rem[u] == 0:
                      count += 1
                  if parent[u] >= 0:
                      rem[parent[u]] = (rem[parent[u]] + rem[u]) % k
              return count
        `,
        javascript: code`
          var maxKDivisibleComponents = function(n, edges, values, k) {
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].push(edges[e][1]); adj[edges[e][1]].push(edges[e][0]); }
              var parent = [], seen = [], rem = [];
              for (var j = 0; j < n; j++) { parent.push(-1); seen.push(false); rem.push(values[j] % k); }
              var order = [0];
              seen[0] = true;
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var t = 0; t < adj[u].length; t++) {
                      var v = adj[u][t];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; order.push(v); }
                  }
              }
              var count = 0;
              for (var p = n - 1; p >= 0; p--) {
                  var x = order[p];
                  if (rem[x] === 0) count++;
                  if (parent[x] >= 0) rem[parent[x]] = (rem[parent[x]] + rem[x]) % k;
              }
              return count;
          };
        `,
        typescript: code`
          function maxKDivisibleComponents(n: number, edges: number[][], values: number[], k: number): number {
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var e = 0; e < edges.length; e++) { adj[edges[e][0]].push(edges[e][1]); adj[edges[e][1]].push(edges[e][0]); }
              var parent: number[] = [], seen: boolean[] = [], rem: number[] = [];
              for (var j = 0; j < n; j++) { parent.push(-1); seen.push(false); rem.push(values[j] % k); }
              var order: number[] = [0];
              seen[0] = true;
              for (var h = 0; h < order.length; h++) {
                  var u = order[h];
                  for (var t = 0; t < adj[u].length; t++) {
                      var v = adj[u][t];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; order.push(v); }
                  }
              }
              var count = 0;
              for (var p = n - 1; p >= 0; p--) {
                  var x = order[p];
                  if (rem[x] === 0) count++;
                  if (parent[x] >= 0) rem[parent[x]] = (rem[parent[x]] + rem[x]) % k;
              }
              return count;
          }
        `,
        java: code`
          public static int maxKDivisibleComponents(int n, int[][] edges, int[] values, int k) {
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], order = new int[n];
              boolean[] seen = new boolean[n];
              long[] rem = new long[n];
              for (int i = 0; i < n; i++) { parent[i] = -1; rem[i] = values[i] % k; }
              int head = 0, tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              while (head < tail) {
                  int u = order[head++];
                  for (int v : adj.get(u)) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v; }
              }
              int count = 0;
              for (int p = n - 1; p >= 0; p--) {
                  int x = order[p];
                  if (rem[x] == 0) count++;
                  if (parent[x] >= 0) rem[parent[x]] = (rem[parent[x]] + rem[x]) % k;
              }
              return count;
          }
        `,
        cpp: code`
          int maxKDivisibleComponents(int n, vector<vector<int>>& edges, vector<int>& values, int k) {
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -1), order = {0};
              vector<bool> seen(n, false);
              vector<long long> rem(n);
              for (int i = 0; i < n; i++) rem[i] = values[i] % k;
              seen[0] = true;
              for (size_t h = 0; h < order.size(); h++) {
                  int u = order[h];
                  for (int v : adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order.push_back(v); }
              }
              int count = 0;
              for (int p = n - 1; p >= 0; p--) {
                  int x = order[p];
                  if (rem[x] == 0) count++;
                  if (parent[x] >= 0) rem[parent[x]] = (rem[parent[x]] + rem[x]) % k;
              }
              return count;
          }
        `,
        c: code`
          int maxKDivisibleComponents(int n, int** edges, int edgesSize, int* edgesColSize, int* values, int valuesSize, int k) {
              int* head = (int*) malloc((size_t) n * sizeof(int));
              int* nxt = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int* to = (int*) malloc((size_t) (2 * n + 1) * sizeof(int));
              int ec = 0;
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int e = 0; e < edgesSize; e++) {
                  int a = edges[e][0], b = edges[e][1];
                  to[ec] = b; nxt[ec] = head[a]; head[a] = ec++;
                  to[ec] = a; nxt[ec] = head[b]; head[b] = ec++;
              }
              int* parent = (int*) malloc((size_t) n * sizeof(int));
              int* order = (int*) malloc((size_t) n * sizeof(int));
              char* seen = (char*) calloc((size_t) n, 1);
              long long* rem = (long long*) malloc((size_t) n * sizeof(long long));
              for (int i = 0; i < n; i++) { parent[i] = -1; rem[i] = values[i] % k; }
              int qh = 0, qt = 0;
              order[qt++] = 0;
              seen[0] = 1;
              while (qh < qt) {
                  int u = order[qh++];
                  for (int e = head[u]; e != -1; e = nxt[e]) if (!seen[to[e]]) { seen[to[e]] = 1; parent[to[e]] = u; order[qt++] = to[e]; }
              }
              int count = 0;
              for (int p = n - 1; p >= 0; p--) {
                  int x = order[p];
                  if (rem[x] == 0) count++;
                  if (parent[x] >= 0) rem[parent[x]] = (rem[parent[x]] + rem[x]) % k;
              }
              free(head); free(nxt); free(to); free(parent); free(order); free(seen); free(rem);
              return count;
          }
        `,
        csharp: code`
          public static int MaxKDivisibleComponents(int n, int[][] edges, int[] values, int k)
          {
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              var parent = new int[n];
              var order = new int[n];
              var seen = new bool[n];
              var rem = new long[n];
              for (int i = 0; i < n; i++) { parent[i] = -1; rem[i] = values[i] % k; }
              int head = 0, tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              while (head < tail)
              {
                  int u = order[head++];
                  foreach (int v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v; }
              }
              int count = 0;
              for (int p = n - 1; p >= 0; p--)
              {
                  int x = order[p];
                  if (rem[x] == 0) count++;
                  if (parent[x] >= 0) rem[parent[x]] = (rem[parent[x]] + rem[x]) % k;
              }
              return count;
          }
        `,
        go: code`
          func maxKDivisibleComponents(n int, edges [][]int, values []int, k int) int {
              adj := make([][]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], e[1])
                  adj[e[1]] = append(adj[e[1]], e[0])
              }
              parent := make([]int, n)
              rem := make([]int, n)
              seen := make([]bool, n)
              for i := 0; i < n; i++ {
                  parent[i] = -1
                  rem[i] = values[i] % k
              }
              order := []int{0}
              seen[0] = true
              for h := 0; h < len(order); h++ {
                  u := order[h]
                  for _, v := range adj[u] {
                      if !seen[v] {
                          seen[v] = true
                          parent[v] = u
                          order = append(order, v)
                      }
                  }
              }
              count := 0
              for p := n - 1; p >= 0; p-- {
                  x := order[p]
                  if rem[x] == 0 {
                      count++
                  }
                  if parent[x] >= 0 {
                      rem[parent[x]] = (rem[parent[x]] + rem[x]) % k
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun maxKDivisibleComponents(n: Int, edges: Array<IntArray>, values: IntArray, k: Int): Int {
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -1 }
              val rem = LongArray(n) { (values[it] % k).toLong() }
              val order = IntArray(n)
              val seen = BooleanArray(n)
              var head = 0
              var tail = 0
              order[tail++] = 0
              seen[0] = true
              while (head < tail) {
                  val u = order[head++]
                  for (v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v }
              }
              var count = 0
              for (p in n - 1 downTo 0) {
                  val x = order[p]
                  if (rem[x] == 0L) count++
                  if (parent[x] >= 0) rem[parent[x]] = (rem[parent[x]] + rem[x]) % k
              }
              return count
          }
        `,
        swift: code`
          func maxKDivisibleComponents(_ n: Int, _ edges: [[Int]], _ values: [Int], _ k: Int) -> Int {
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -1, count: n)
              var rem = values.map { $0 % k }
              var seen = [Bool](repeating: false, count: n)
              var order = [0]
              seen[0] = true
              var h = 0
              while h < order.count {
                  let u = order[h]
                  h += 1
                  for v in adj[u] where !seen[v] { seen[v] = true; parent[v] = u; order.append(v) }
              }
              var count = 0
              for x in order.reversed() {
                  if rem[x] == 0 { count += 1 }
                  if parent[x] >= 0 { rem[parent[x]] = (rem[parent[x]] + rem[x]) % k }
              }
              return count
          }
        `,
        rust: code`
          fn maxKDivisibleComponents(n: i32, edges: Vec<Vec<i32>>, values: Vec<i32>, k: i32) -> i32 {
              let n = n as usize;
              let k = k as i64;
              let mut adj = vec![Vec::new(); n];
              for e in edges.iter() {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut parent = vec![std::usize::MAX; n];
              let mut rem: Vec<i64> = values.iter().map(|&x| x as i64 % k).collect();
              let mut seen = vec![false; n];
              let mut order = vec![0usize];
              seen[0] = true;
              let mut h = 0;
              while h < order.len() {
                  let u = order[h];
                  h += 1;
                  for &v in adj[u].iter() {
                      if !seen[v] {
                          seen[v] = true;
                          parent[v] = u;
                          order.push(v);
                      }
                  }
              }
              let mut count = 0;
              for &x in order.iter().rev() {
                  if rem[x] == 0 {
                      count += 1;
                  }
                  if parent[x] != std::usize::MAX {
                      let p = parent[x];
                      rem[p] = (rem[p] + rem[x]) % k;
                  }
              }
              count
          }
        `,
        php: code`
          function maxKDivisibleComponents($n, $edges, $values, $k) {
              $adj = array_fill(0, $n, []);
              foreach ($edges as [$a, $b]) { $adj[$a][] = $b; $adj[$b][] = $a; }
              $parent = array_fill(0, $n, -1);
              $seen = array_fill(0, $n, false);
              $rem = [];
              foreach ($values as $x) $rem[] = $x % $k;
              $order = [0];
              $seen[0] = true;
              for ($h = 0; $h < count($order); $h++) {
                  $u = $order[$h];
                  foreach ($adj[$u] as $v) if (!$seen[$v]) { $seen[$v] = true; $parent[$v] = $u; $order[] = $v; }
              }
              $count = 0;
              for ($p = $n - 1; $p >= 0; $p--) {
                  $x = $order[$p];
                  if ($rem[$x] == 0) $count++;
                  if ($parent[$x] >= 0) $rem[$parent[$x]] = ($rem[$parent[$x]] + $rem[$x]) % $k;
              }
              return $count;
          }
        `,
        ruby: code`
          def maxKDivisibleComponents(n, edges, values, k)
            adj = Array.new(n) { [] }
            edges.each { |a, b| adj[a] << b; adj[b] << a }
            parent = Array.new(n, -1)
            seen = Array.new(n, false)
            rem = values.map { |x| x % k }
            order = [0]
            seen[0] = true
            h = 0
            while h < order.length
              u = order[h]
              h += 1
              adj[u].each do |v|
                next if seen[v]
                seen[v] = true
                parent[v] = u
                order << v
              end
            end
            count = 0
            order.reverse_each do |x|
              count += 1 if rem[x] == 0
              rem[parent[x]] = (rem[parent[x]] + rem[x]) % k if parent[x] >= 0
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Count Visited Nodes in a Directed Graph (LC 2876) ───────────
  (() => {
    const ref = (edges: number[]) =>
      // Walk from every node until a node repeats.
      edges.map((_, s) => {
        const seen = new Set<number>();
        for (let x = s; !seen.has(x); x = edges[x]) seen.add(x);
        return seen.size;
      });
    return {
      slug: "count-visited-nodes-in-a-directed-graph",
      title: "Count Visited Nodes in a Directed Graph",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Graph", "Memoization", "Google", "Amazon"],
      signature: { funcName: "countVisitedNodes", params: [{ name: "edges", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "A directed graph has `n` nodes numbered `0` to `n - 1` and exactly `n` edges: node `i` has a single outgoing edge to `edges[i]` (never to itself).\n\nStarting from a node `x`, keep following the outgoing edges until you arrive at a node you have already visited in this walk.\n\nReturn an array `answer` where `answer[i]` is the number of **distinct** nodes visited by the walk that starts at node `i`.",
        [
          { in: "edges = [1,2,0,0]", out: "[3,3,3,4]", note: "Nodes 0, 1, 2 form the cycle 0 → 1 → 2 → 0. The walk from 3 visits 3 and then the whole cycle: 4 nodes." },
          { in: "edges = [1,2,3,4,0]", out: "[5,5,5,5,5]", note: "All five nodes lie on one cycle." },
          { in: "edges = [1,0,0,1,3]", out: "[2,2,3,3,4]", note: "The cycle is 0 ↔ 1; nodes 2 and 3 hang one step off it and node 4 two steps." },
        ],
        ["n == edges.length", "2 <= n <= 10^5", "0 <= edges[i] <= n - 1", "edges[i] != i"]),
      hints: [
        "Every node has exactly one outgoing edge, so each walk runs down a 'tail' and then loops around exactly one cycle. A node on a cycle visits exactly the cycle's nodes.",
        "Find the nodes that are **not** on any cycle by peeling: repeatedly remove nodes with no incoming edges (Kahn's algorithm). What survives is exactly the cycles.",
        "For each surviving cycle, every node's answer is the cycle length. Then process the peeled nodes in reverse peeling order: `answer[i] = answer[edges[i]] + 1`.",
      ],
      editorial: explain({
        idea: "In a functional graph every walk ends in a cycle. Peeling nodes of in-degree zero removes exactly the tail nodes, leaving the cycles. Cycle nodes see their own cycle; a tail node sees itself plus everything its successor sees.",
        steps: [
          "Count in-degrees and queue every node with in-degree 0.",
          "Pop a node, record it in the peel order, decrement the in-degree of its successor and queue the successor when it reaches 0.",
          "Every node never peeled lies on a cycle: walk each such cycle once to measure its length and assign that length to all its nodes.",
          "Go through the peel order backwards and set `answer[i] = answer[edges[i]] + 1`.",
        ],
        why: "A node on a cycle always keeps an incoming edge from its cycle predecessor, so it is never peeled; a tail node eventually loses all incoming edges, because everything pointing into it lies on tails too. Walking from a cycle node visits exactly the cycle; walking from a tail node visits the node itself and then the walk of its successor, which shares no nodes with it. A successor is peeled after its predecessor, so the reverse order computes it first.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "There can be several separate cycles — measure each one.",
          "A recursive DFS along a long tail of 10^5 nodes can overflow the stack; the peel order needs none.",
          "Count distinct nodes: the walk stops on the first repeat, which is a cycle node already counted.",
        ],
      }),
      examples: [
        { input: "[1,2,0,0]", expectedOutput: "[3,3,3,4]" },
        { input: "[1,2,3,4,0]", expectedOutput: "[5,5,5,5,5]" },
        { input: "[1,0,0,1,3]", expectedOutput: "[2,2,3,3,4]" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.1 ? ri(rng, 2, 4) : ri(rng, 5, 40);
        const mode = ri(rng, 0, 2);
        let edges: number[];
        if (mode === 0) {
          edges = Array.from({ length: n }, (_, i) => { let t = ri(rng, 0, n - 2); if (t >= i) t++; return t; });
        } else {
          // Long tails: most nodes point to a node with a smaller index, a few close cycles.
          const perm = shuffle(rng, Array.from({ length: n }, (_, i) => i));
          edges = new Array(n).fill(0);
          for (let i = 0; i < n; i++) {
            const lo = Math.max(0, i - (mode === 1 ? 1 : 4));
            let j = i === 0 || rng() < 0.08 ? ri(rng, i + 1 < n ? i + 1 : 0, n - 1) : ri(rng, lo, i - 1);
            if (j === i) j = (i + 1) % n;
            edges[perm[i]] = perm[j];
          }
        }
        return { input: fmtIntArr(edges), expectedOutput: fmtIntArr(ref(edges)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countVisitedNodes(edges: List[int]) -> List[int]:
              n = len(edges)
              indeg = [0] * n
              for t in edges:
                  indeg[t] += 1
              order = [i for i in range(n) if indeg[i] == 0]
              for u in order:
                  v = edges[u]
                  indeg[v] -= 1
                  if indeg[v] == 0:
                      order.append(v)
              ans = [0] * n
              for i in range(n):
                  if indeg[i] > 0 and ans[i] == 0:
                      cycle = [i]
                      x = edges[i]
                      while x != i:
                          cycle.append(x)
                          x = edges[x]
                      for c in cycle:
                          ans[c] = len(cycle)
              for u in reversed(order):
                  ans[u] = ans[edges[u]] + 1
              return ans
        `,
        javascript: code`
          var countVisitedNodes = function(edges) {
              var n = edges.length;
              var indeg = new Array(n), ans = new Array(n);
              for (var i = 0; i < n; i++) { indeg[i] = 0; ans[i] = 0; }
              for (var j = 0; j < n; j++) indeg[edges[j]]++;
              var order = [];
              for (var k = 0; k < n; k++) if (indeg[k] === 0) order.push(k);
              for (var h = 0; h < order.length; h++) {
                  var v = edges[order[h]];
                  if (--indeg[v] === 0) order.push(v);
              }
              for (var s = 0; s < n; s++) {
                  if (indeg[s] > 0 && ans[s] === 0) {
                      var len = 1;
                      for (var x = edges[s]; x !== s; x = edges[x]) len++;
                      ans[s] = len;
                      for (var y = edges[s]; y !== s; y = edges[y]) ans[y] = len;
                  }
              }
              for (var t = order.length - 1; t >= 0; t--) ans[order[t]] = ans[edges[order[t]]] + 1;
              return ans;
          };
        `,
        typescript: code`
          function countVisitedNodes(edges: number[]): number[] {
              var n = edges.length;
              var indeg: number[] = [], ans: number[] = [];
              for (var i = 0; i < n; i++) { indeg.push(0); ans.push(0); }
              for (var j = 0; j < n; j++) indeg[edges[j]]++;
              var order: number[] = [];
              for (var k = 0; k < n; k++) if (indeg[k] === 0) order.push(k);
              for (var h = 0; h < order.length; h++) {
                  var v = edges[order[h]];
                  if (--indeg[v] === 0) order.push(v);
              }
              for (var s = 0; s < n; s++) {
                  if (indeg[s] > 0 && ans[s] === 0) {
                      var len = 1;
                      for (var x = edges[s]; x !== s; x = edges[x]) len++;
                      ans[s] = len;
                      for (var y = edges[s]; y !== s; y = edges[y]) ans[y] = len;
                  }
              }
              for (var t = order.length - 1; t >= 0; t--) ans[order[t]] = ans[edges[order[t]]] + 1;
              return ans;
          }
        `,
        java: code`
          public static int[] countVisitedNodes(int[] edges) {
              int n = edges.length;
              int[] indeg = new int[n], ans = new int[n], order = new int[n];
              for (int t : edges) indeg[t]++;
              int tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) order[tail++] = i;
              for (int h = 0; h < tail; h++) {
                  int v = edges[order[h]];
                  if (--indeg[v] == 0) order[tail++] = v;
              }
              for (int s = 0; s < n; s++) {
                  if (indeg[s] > 0 && ans[s] == 0) {
                      int len = 1;
                      for (int x = edges[s]; x != s; x = edges[x]) len++;
                      ans[s] = len;
                      for (int y = edges[s]; y != s; y = edges[y]) ans[y] = len;
                  }
              }
              for (int t = tail - 1; t >= 0; t--) ans[order[t]] = ans[edges[order[t]]] + 1;
              return ans;
          }
        `,
        cpp: code`
          vector<int> countVisitedNodes(vector<int>& edges) {
              int n = edges.size();
              vector<int> indeg(n, 0), ans(n, 0), order;
              for (int t : edges) indeg[t]++;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) order.push_back(i);
              for (size_t h = 0; h < order.size(); h++) {
                  int v = edges[order[h]];
                  if (--indeg[v] == 0) order.push_back(v);
              }
              for (int s = 0; s < n; s++) {
                  if (indeg[s] > 0 && ans[s] == 0) {
                      int len = 1;
                      for (int x = edges[s]; x != s; x = edges[x]) len++;
                      ans[s] = len;
                      for (int y = edges[s]; y != s; y = edges[y]) ans[y] = len;
                  }
              }
              for (int t = (int) order.size() - 1; t >= 0; t--) ans[order[t]] = ans[edges[order[t]]] + 1;
              return ans;
          }
        `,
        c: code`
          int* countVisitedNodes(int* edges, int edgesSize, int* returnSize) {
              int n = edgesSize;
              int* indeg = (int*) calloc((size_t) n, sizeof(int));
              int* ans = (int*) calloc((size_t) n, sizeof(int));
              int* order = (int*) malloc((size_t) n * sizeof(int));
              for (int i = 0; i < n; i++) indeg[edges[i]]++;
              int tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) order[tail++] = i;
              for (int h = 0; h < tail; h++) {
                  int v = edges[order[h]];
                  if (--indeg[v] == 0) order[tail++] = v;
              }
              for (int s = 0; s < n; s++) {
                  if (indeg[s] > 0 && ans[s] == 0) {
                      int len = 1;
                      for (int x = edges[s]; x != s; x = edges[x]) len++;
                      ans[s] = len;
                      for (int y = edges[s]; y != s; y = edges[y]) ans[y] = len;
                  }
              }
              for (int t = tail - 1; t >= 0; t--) ans[order[t]] = ans[edges[order[t]]] + 1;
              free(indeg); free(order);
              *returnSize = n;
              return ans;
          }
        `,
        csharp: code`
          public static int[] CountVisitedNodes(int[] edges)
          {
              int n = edges.Length;
              var indeg = new int[n];
              var ans = new int[n];
              var order = new int[n];
              foreach (int t in edges) indeg[t]++;
              int tail = 0;
              for (int i = 0; i < n; i++) if (indeg[i] == 0) order[tail++] = i;
              for (int h = 0; h < tail; h++)
              {
                  int v = edges[order[h]];
                  if (--indeg[v] == 0) order[tail++] = v;
              }
              for (int s = 0; s < n; s++)
              {
                  if (indeg[s] > 0 && ans[s] == 0)
                  {
                      int len = 1;
                      for (int x = edges[s]; x != s; x = edges[x]) len++;
                      ans[s] = len;
                      for (int y = edges[s]; y != s; y = edges[y]) ans[y] = len;
                  }
              }
              for (int t = tail - 1; t >= 0; t--) ans[order[t]] = ans[edges[order[t]]] + 1;
              return ans;
          }
        `,
        go: code`
          func countVisitedNodes(edges []int) []int {
              n := len(edges)
              indeg := make([]int, n)
              ans := make([]int, n)
              for _, t := range edges {
                  indeg[t]++
              }
              order := []int{}
              for i := 0; i < n; i++ {
                  if indeg[i] == 0 {
                      order = append(order, i)
                  }
              }
              for h := 0; h < len(order); h++ {
                  v := edges[order[h]]
                  indeg[v]--
                  if indeg[v] == 0 {
                      order = append(order, v)
                  }
              }
              for s := 0; s < n; s++ {
                  if indeg[s] > 0 && ans[s] == 0 {
                      length := 1
                      for x := edges[s]; x != s; x = edges[x] {
                          length++
                      }
                      ans[s] = length
                      for y := edges[s]; y != s; y = edges[y] {
                          ans[y] = length
                      }
                  }
              }
              for t := len(order) - 1; t >= 0; t-- {
                  ans[order[t]] = ans[edges[order[t]]] + 1
              }
              return ans
          }
        `,
        kotlin: code`
          fun countVisitedNodes(edges: IntArray): IntArray {
              val n = edges.size
              val indeg = IntArray(n)
              val ans = IntArray(n)
              val order = IntArray(n)
              for (t in edges) indeg[t]++
              var tail = 0
              for (i in 0 until n) if (indeg[i] == 0) order[tail++] = i
              var h = 0
              while (h < tail) {
                  val v = edges[order[h++]]
                  if (--indeg[v] == 0) order[tail++] = v
              }
              for (s in 0 until n) {
                  if (indeg[s] > 0 && ans[s] == 0) {
                      var len = 1
                      var x = edges[s]
                      while (x != s) { len++; x = edges[x] }
                      ans[s] = len
                      x = edges[s]
                      while (x != s) { ans[x] = len; x = edges[x] }
                  }
              }
              for (t in tail - 1 downTo 0) ans[order[t]] = ans[edges[order[t]]] + 1
              return ans
          }
        `,
        swift: code`
          func countVisitedNodes(_ edges: [Int]) -> [Int] {
              let n = edges.count
              var indeg = [Int](repeating: 0, count: n)
              var ans = [Int](repeating: 0, count: n)
              for t in edges { indeg[t] += 1 }
              var order = (0..<n).filter { indeg[$0] == 0 }
              var h = 0
              while h < order.count {
                  let v = edges[order[h]]
                  h += 1
                  indeg[v] -= 1
                  if indeg[v] == 0 { order.append(v) }
              }
              for s in 0..<n where indeg[s] > 0 && ans[s] == 0 {
                  var len = 1
                  var x = edges[s]
                  while x != s { len += 1; x = edges[x] }
                  ans[s] = len
                  x = edges[s]
                  while x != s { ans[x] = len; x = edges[x] }
              }
              for u in order.reversed() { ans[u] = ans[edges[u]] + 1 }
              return ans
          }
        `,
        rust: code`
          fn countVisitedNodes(edges: Vec<i32>) -> Vec<i32> {
              let n = edges.len();
              let e: Vec<usize> = edges.iter().map(|&x| x as usize).collect();
              let mut indeg = vec![0i32; n];
              for &t in e.iter() {
                  indeg[t] += 1;
              }
              let mut order: Vec<usize> = (0..n).filter(|&i| indeg[i] == 0).collect();
              let mut h = 0;
              while h < order.len() {
                  let v = e[order[h]];
                  h += 1;
                  indeg[v] -= 1;
                  if indeg[v] == 0 {
                      order.push(v);
                  }
              }
              let mut ans = vec![0i32; n];
              for s in 0..n {
                  if indeg[s] > 0 && ans[s] == 0 {
                      let mut len = 1;
                      let mut x = e[s];
                      while x != s {
                          len += 1;
                          x = e[x];
                      }
                      ans[s] = len;
                      x = e[s];
                      while x != s {
                          ans[x] = len;
                          x = e[x];
                      }
                  }
              }
              for &u in order.iter().rev() {
                  ans[u] = ans[e[u]] + 1;
              }
              ans
          }
        `,
        php: code`
          function countVisitedNodes($edges) {
              $n = count($edges);
              $indeg = array_fill(0, $n, 0);
              $ans = array_fill(0, $n, 0);
              foreach ($edges as $t) $indeg[$t]++;
              $order = [];
              for ($i = 0; $i < $n; $i++) if ($indeg[$i] == 0) $order[] = $i;
              for ($h = 0; $h < count($order); $h++) {
                  $v = $edges[$order[$h]];
                  if (--$indeg[$v] == 0) $order[] = $v;
              }
              for ($s = 0; $s < $n; $s++) {
                  if ($indeg[$s] > 0 && $ans[$s] == 0) {
                      $len = 1;
                      for ($x = $edges[$s]; $x != $s; $x = $edges[$x]) $len++;
                      $ans[$s] = $len;
                      for ($y = $edges[$s]; $y != $s; $y = $edges[$y]) $ans[$y] = $len;
                  }
              }
              for ($t = count($order) - 1; $t >= 0; $t--) $ans[$order[$t]] = $ans[$edges[$order[$t]]] + 1;
              return $ans;
          }
        `,
        ruby: code`
          def countVisitedNodes(edges)
            n = edges.length
            indeg = Array.new(n, 0)
            edges.each { |t| indeg[t] += 1 }
            order = (0...n).select { |i| indeg[i] == 0 }
            h = 0
            while h < order.length
              v = edges[order[h]]
              h += 1
              indeg[v] -= 1
              order << v if indeg[v] == 0
            end
            ans = Array.new(n, 0)
            n.times do |s|
              next unless indeg[s] > 0 && ans[s] == 0
              len = 1
              x = edges[s]
              while x != s
                len += 1
                x = edges[x]
              end
              ans[s] = len
              x = edges[s]
              while x != s
                ans[x] = len
                x = edges[x]
              end
            end
            order.reverse_each { |u| ans[u] = ans[edges[u]] + 1 }
            ans
          end
        `,
      },
    };
  })(),

  // ── Number of Possible Sets of Closing Branches (LC 2959) ───────
  (() => {
    const ref = (n: number, maxDistance: number, roads: number[][]) => {
      // Every subset of open branches; distances by Bellman–Ford from each open branch.
      let count = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        let ok = true;
        for (let s = 0; s < n && ok; s++) {
          if (!((mask >> s) & 1)) continue;
          const d = new Array(n).fill(Infinity);
          d[s] = 0;
          for (let it = 0; it < n; it++) {
            for (const [u, v, w] of roads) {
              if (!((mask >> u) & 1) || !((mask >> v) & 1)) continue;
              if (d[u] + w < d[v]) d[v] = d[u] + w;
              if (d[v] + w < d[u]) d[u] = d[v] + w;
            }
          }
          for (let t = 0; t < n; t++) if ((mask >> t) & 1 && d[t] > maxDistance) ok = false;
        }
        if (ok) count++;
      }
      return count;
    };
    return {
      slug: "number-of-possible-sets-of-closing-branches",
      title: "Number of Possible Sets of Closing Branches",
      difficulty: "HARD" as const,
      tags: ["Bit Manipulation", "Graph", "Heap (Priority Queue)", "Shortest Path", "Enumeration", "Google", "Amazon"],
      signature: {
        funcName: "numberOfSets",
        params: [{ name: "n", type: "int" as const }, { name: "maxDistance", type: "int" as const }, { name: "roads", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A company has `n` branches numbered `0` to `n - 1`, linked by two-way roads: `roads[i] = [u, v, w]` is a road of length `w` between branches `u` and `v`. There may be several roads between the same two branches.\n\nThe company wants to close some set of branches (possibly none, possibly all). After closing, the branches still open must all be within `maxDistance` of each other, travelling **only through open branches**. Closed branches and the roads touching them can no longer be used.\n\nReturn the number of possible sets of branches to close such that every pair of open branches is at distance at most `maxDistance`.",
        [
          { in: "n = 3, maxDistance = 5, roads = [[0,1,2],[1,2,10],[0,2,10]]", out: "5", note: "Valid closings: {0,1,2} (nothing open), {0,1} and {1,2} and {0,2} (one branch open), and {2} (0 and 1 open, 2 apart). Keeping 2 open with another branch puts them 10 apart." },
          { in: "n = 3, maxDistance = 5, roads = [[0,1,20],[0,1,10],[1,2,2],[0,2,2]]", out: "7", note: "Every closing works except closing only {2}: then 0 and 1 are 10 apart." },
          { in: "n = 1, maxDistance = 10, roads = []", out: "2", note: "Close the only branch, or keep it open." },
        ],
        ["1 <= n <= 10", "1 <= maxDistance <= 10^5", "0 <= roads.length <= 1000", "roads[i].length == 3", "0 <= u, v <= n - 1", "u != v", "1 <= w <= 1000", "all branches are reachable from each other when every road is used"]),
      hints: [
        "With at most 10 branches there are at most `2^10 = 1024` choices of which branches stay open — try them all.",
        "For one choice, you need shortest distances between open branches using only roads whose both ends are open. Floyd–Warshall over the open branches is short and fast enough.",
        "Keep only the cheapest road between each pair, and count the choice when every pair of open branches ends up within `maxDistance` (an empty or single-branch choice always counts).",
      ],
      editorial: explain({
        idea: "The number of branches is tiny, so enumerate every subset of open branches as a bitmask. For each subset, all-pairs shortest paths restricted to the open branches decide whether it is valid.",
        steps: [
          "Build `w[u][v]`, the cheapest road between `u` and `v` (infinity if none).",
          "For each mask from 0 to `2^n − 1`: copy `w` restricted to the open branches into `d`, with `d[i][i] = 0`.",
          "Run Floyd–Warshall over the open branches only.",
          "If every pair of open branches has `d[i][j] <= maxDistance`, count the mask.",
        ],
        why: "Closing a branch removes it and its roads, so the distances that matter are shortest paths in the subgraph induced by the open branches — exactly what the restricted Floyd–Warshall computes. Enumerating all masks covers every possible set of closed branches once.",
        time: "O(2^n · n^3)",
        space: "O(n^2)",
        pitfalls: [
          "Multiple roads can join the same pair; keep the shortest.",
          "Paths may not pass through closed branches — restrict the intermediate node in Floyd–Warshall too.",
          "Disconnected open branches have infinite distance and make the mask invalid; the empty mask and every single-branch mask are always valid.",
        ],
      }),
      examples: [
        { input: "3\n5\n[[0,1,2],[1,2,10],[0,2,10]]", expectedOutput: "5" },
        { input: "3\n5\n[[0,1,20],[0,1,10],[1,2,2],[0,2,2]]", expectedOutput: "7" },
        { input: "1\n10\n[]", expectedOutput: "2" },
      ],
      hiddenCount: 500,
      gen: (rng: Rng) => {
        const x = rng();
        const n = x < 0.6 ? ri(rng, 1, 6) : x < 0.85 ? 7 : 8;
        const W = pick(rng, [3, 10, 1000]);
        // A connected multigraph: a random tree plus a few extra (possibly parallel) roads.
        const roads = randomTreeEdges(rng, n, 0).map((e) => [e[0], e[1], ri(rng, 1, W)]);
        const extra = n > 1 ? ri(rng, 0, pick(rng, [0, n, 2 * n])) : 0;
        for (let i = 0; i < extra; i++) {
          const u = ri(rng, 0, n - 1);
          let v = ri(rng, 0, n - 2);
          if (v >= u) v++;
          roads.push([u, v, ri(rng, 1, W)]);
        }
        shuffle(rng, roads);
        const maxDistance = ri(rng, 1, Math.max(1, W * pick(rng, [1, 2, 4])));
        return { input: `${n}\n${maxDistance}\n${fmtIntMat(roads)}`, expectedOutput: String(ref(n, maxDistance, roads)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numberOfSets(n: int, maxDistance: int, roads: List[List[int]]) -> int:
              INF = float("inf")
              w = [[INF] * n for _ in range(n)]
              for u, v, c in roads:
                  if c < w[u][v]:
                      w[u][v] = w[v][u] = c
              count = 0
              for mask in range(1 << n):
                  nodes = [i for i in range(n) if mask >> i & 1]
                  d = [row[:] for row in w]
                  for i in nodes:
                      d[i][i] = 0
                  for k in nodes:
                      dk = d[k]
                      for i in nodes:
                          di = d[i]
                          dik = di[k]
                          if dik == INF:
                              continue
                          for j in nodes:
                              if dik + dk[j] < di[j]:
                                  di[j] = dik + dk[j]
                  if all(d[i][j] <= maxDistance for i in nodes for j in nodes):
                      count += 1
              return count
        `,
        javascript: code`
          var numberOfSets = function(n, maxDistance, roads) {
              var INF = 1000000000;
              var w = [];
              for (var i = 0; i < n; i++) { w.push([]); for (var j = 0; j < n; j++) w[i].push(INF); }
              for (var r = 0; r < roads.length; r++) {
                  var u = roads[r][0], v = roads[r][1], c = roads[r][2];
                  if (c < w[u][v]) { w[u][v] = c; w[v][u] = c; }
              }
              var count = 0;
              var d = [];
              for (var a = 0; a < n; a++) d.push(new Array(n));
              for (var mask = 0; mask < (1 << n); mask++) {
                  var nodes = [];
                  for (var b = 0; b < n; b++) if ((mask >> b) & 1) nodes.push(b);
                  for (var x = 0; x < n; x++) for (var y = 0; y < n; y++) d[x][y] = x === y ? 0 : w[x][y];
                  for (var p = 0; p < nodes.length; p++) {
                      var k = nodes[p];
                      for (var q = 0; q < nodes.length; q++) {
                          var s = nodes[q];
                          if (d[s][k] === INF) continue;
                          for (var t = 0; t < nodes.length; t++) {
                              var e = nodes[t];
                              if (d[s][k] + d[k][e] < d[s][e]) d[s][e] = d[s][k] + d[k][e];
                          }
                      }
                  }
                  var ok = true;
                  for (var f = 0; f < nodes.length && ok; f++)
                      for (var g = 0; g < nodes.length; g++)
                          if (d[nodes[f]][nodes[g]] > maxDistance) { ok = false; break; }
                  if (ok) count++;
              }
              return count;
          };
        `,
        typescript: code`
          function numberOfSets(n: number, maxDistance: number, roads: number[][]): number {
              var INF = 1000000000;
              var w: number[][] = [];
              for (var i = 0; i < n; i++) { var row: number[] = []; for (var j = 0; j < n; j++) row.push(INF); w.push(row); }
              for (var r = 0; r < roads.length; r++) {
                  var u = roads[r][0], v = roads[r][1], c = roads[r][2];
                  if (c < w[u][v]) { w[u][v] = c; w[v][u] = c; }
              }
              var count = 0;
              var d: number[][] = [];
              for (var a = 0; a < n; a++) { var drow: number[] = []; for (var z = 0; z < n; z++) drow.push(0); d.push(drow); }
              for (var mask = 0; mask < (1 << n); mask++) {
                  var nodes: number[] = [];
                  for (var b = 0; b < n; b++) if ((mask >> b) & 1) nodes.push(b);
                  for (var x = 0; x < n; x++) for (var y = 0; y < n; y++) d[x][y] = x === y ? 0 : w[x][y];
                  for (var p = 0; p < nodes.length; p++) {
                      var k = nodes[p];
                      for (var q = 0; q < nodes.length; q++) {
                          var s = nodes[q];
                          if (d[s][k] === INF) continue;
                          for (var t = 0; t < nodes.length; t++) {
                              var e = nodes[t];
                              if (d[s][k] + d[k][e] < d[s][e]) d[s][e] = d[s][k] + d[k][e];
                          }
                      }
                  }
                  var ok = true;
                  for (var f = 0; f < nodes.length && ok; f++)
                      for (var g = 0; g < nodes.length; g++)
                          if (d[nodes[f]][nodes[g]] > maxDistance) { ok = false; break; }
                  if (ok) count++;
              }
              return count;
          }
        `,
        java: code`
          public static int numberOfSets(int n, int maxDistance, int[][] roads) {
              final int INF = 1000000000;
              int[][] w = new int[n][n];
              for (int[] row : w) Arrays.fill(row, INF);
              for (int[] r : roads) if (r[2] < w[r[0]][r[1]]) { w[r[0]][r[1]] = r[2]; w[r[1]][r[0]] = r[2]; }
              int count = 0;
              int[][] d = new int[n][n];
              int[] nodes = new int[n];
              for (int mask = 0; mask < (1 << n); mask++) {
                  int m = 0;
                  for (int b = 0; b < n; b++) if (((mask >> b) & 1) == 1) nodes[m++] = b;
                  for (int x = 0; x < n; x++) for (int y = 0; y < n; y++) d[x][y] = x == y ? 0 : w[x][y];
                  for (int p = 0; p < m; p++) {
                      int k = nodes[p];
                      for (int q = 0; q < m; q++) {
                          int s = nodes[q];
                          if (d[s][k] == INF) continue;
                          for (int t = 0; t < m; t++) {
                              int e = nodes[t];
                              if (d[s][k] + d[k][e] < d[s][e]) d[s][e] = d[s][k] + d[k][e];
                          }
                      }
                  }
                  boolean ok = true;
                  for (int f = 0; f < m && ok; f++)
                      for (int g = 0; g < m; g++)
                          if (d[nodes[f]][nodes[g]] > maxDistance) { ok = false; break; }
                  if (ok) count++;
              }
              return count;
          }
        `,
        cpp: code`
          int numberOfSets(int n, int maxDistance, vector<vector<int>>& roads) {
              const int INF = 1000000000;
              vector<vector<int>> w(n, vector<int>(n, INF)), d(n, vector<int>(n));
              for (auto& r : roads) if (r[2] < w[r[0]][r[1]]) { w[r[0]][r[1]] = r[2]; w[r[1]][r[0]] = r[2]; }
              int count = 0;
              for (int mask = 0; mask < (1 << n); mask++) {
                  vector<int> nodes;
                  for (int b = 0; b < n; b++) if ((mask >> b) & 1) nodes.push_back(b);
                  for (int x = 0; x < n; x++) for (int y = 0; y < n; y++) d[x][y] = x == y ? 0 : w[x][y];
                  for (int k : nodes)
                      for (int s : nodes) {
                          if (d[s][k] == INF) continue;
                          for (int e : nodes)
                              if (d[s][k] + d[k][e] < d[s][e]) d[s][e] = d[s][k] + d[k][e];
                      }
                  bool ok = true;
                  for (int f : nodes) {
                      for (int g : nodes) if (d[f][g] > maxDistance) { ok = false; break; }
                      if (!ok) break;
                  }
                  if (ok) count++;
              }
              return count;
          }
        `,
        c: code`
          int numberOfSets(int n, int maxDistance, int** roads, int roadsSize, int* roadsColSize) {
              const int INF = 1000000000;
              int w[10][10], d[10][10], nodes[10];
              for (int x = 0; x < n; x++) for (int y = 0; y < n; y++) w[x][y] = INF;
              for (int r = 0; r < roadsSize; r++) {
                  int u = roads[r][0], v = roads[r][1], c = roads[r][2];
                  if (c < w[u][v]) { w[u][v] = c; w[v][u] = c; }
              }
              int count = 0;
              for (int mask = 0; mask < (1 << n); mask++) {
                  int m = 0;
                  for (int b = 0; b < n; b++) if ((mask >> b) & 1) nodes[m++] = b;
                  for (int x = 0; x < n; x++) for (int y = 0; y < n; y++) d[x][y] = x == y ? 0 : w[x][y];
                  for (int p = 0; p < m; p++) {
                      int k = nodes[p];
                      for (int q = 0; q < m; q++) {
                          int s = nodes[q];
                          if (d[s][k] == INF) continue;
                          for (int t = 0; t < m; t++) {
                              int e = nodes[t];
                              if (d[s][k] + d[k][e] < d[s][e]) d[s][e] = d[s][k] + d[k][e];
                          }
                      }
                  }
                  int ok = 1;
                  for (int f = 0; f < m && ok; f++)
                      for (int g = 0; g < m; g++)
                          if (d[nodes[f]][nodes[g]] > maxDistance) { ok = 0; break; }
                  if (ok) count++;
              }
              return count;
          }
        `,
        csharp: code`
          public static int NumberOfSets(int n, int maxDistance, int[][] roads)
          {
              const int INF = 1000000000;
              var w = new int[n, n];
              var d = new int[n, n];
              for (int x = 0; x < n; x++) for (int y = 0; y < n; y++) w[x, y] = INF;
              foreach (var r in roads) if (r[2] < w[r[0], r[1]]) { w[r[0], r[1]] = r[2]; w[r[1], r[0]] = r[2]; }
              int count = 0;
              var nodes = new int[n];
              for (int mask = 0; mask < (1 << n); mask++)
              {
                  int m = 0;
                  for (int b = 0; b < n; b++) if (((mask >> b) & 1) == 1) nodes[m++] = b;
                  for (int x = 0; x < n; x++) for (int y = 0; y < n; y++) d[x, y] = x == y ? 0 : w[x, y];
                  for (int p = 0; p < m; p++)
                  {
                      int k = nodes[p];
                      for (int q = 0; q < m; q++)
                      {
                          int s = nodes[q];
                          if (d[s, k] == INF) continue;
                          for (int t = 0; t < m; t++)
                          {
                              int e = nodes[t];
                              if (d[s, k] + d[k, e] < d[s, e]) d[s, e] = d[s, k] + d[k, e];
                          }
                      }
                  }
                  bool ok = true;
                  for (int f = 0; f < m && ok; f++)
                      for (int g = 0; g < m; g++)
                          if (d[nodes[f], nodes[g]] > maxDistance) { ok = false; break; }
                  if (ok) count++;
              }
              return count;
          }
        `,
        go: code`
          func numberOfSets(n int, maxDistance int, roads [][]int) int {
              const INF = 1000000000
              w := make([][]int, n)
              d := make([][]int, n)
              for i := range w {
                  w[i] = make([]int, n)
                  d[i] = make([]int, n)
                  for j := range w[i] {
                      w[i][j] = INF
                  }
              }
              for _, r := range roads {
                  if r[2] < w[r[0]][r[1]] {
                      w[r[0]][r[1]] = r[2]
                      w[r[1]][r[0]] = r[2]
                  }
              }
              count := 0
              for mask := 0; mask < 1<<n; mask++ {
                  nodes := []int{}
                  for b := 0; b < n; b++ {
                      if (mask>>b)&1 == 1 {
                          nodes = append(nodes, b)
                      }
                  }
                  for x := 0; x < n; x++ {
                      for y := 0; y < n; y++ {
                          if x == y {
                              d[x][y] = 0
                          } else {
                              d[x][y] = w[x][y]
                          }
                      }
                  }
                  for _, k := range nodes {
                      for _, s := range nodes {
                          if d[s][k] == INF {
                              continue
                          }
                          for _, e := range nodes {
                              if d[s][k]+d[k][e] < d[s][e] {
                                  d[s][e] = d[s][k] + d[k][e]
                              }
                          }
                      }
                  }
                  ok := true
                  for _, f := range nodes {
                      for _, g := range nodes {
                          if d[f][g] > maxDistance {
                              ok = false
                          }
                      }
                  }
                  if ok {
                      count++
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun numberOfSets(n: Int, maxDistance: Int, roads: Array<IntArray>): Int {
              val inf = 1000000000
              val w = Array(n) { IntArray(n) { inf } }
              for (r in roads) if (r[2] < w[r[0]][r[1]]) { w[r[0]][r[1]] = r[2]; w[r[1]][r[0]] = r[2] }
              val d = Array(n) { IntArray(n) }
              val nodes = IntArray(n)
              var count = 0
              for (mask in 0 until (1 shl n)) {
                  var m = 0
                  for (b in 0 until n) if ((mask shr b) and 1 == 1) nodes[m++] = b
                  for (x in 0 until n) for (y in 0 until n) d[x][y] = if (x == y) 0 else w[x][y]
                  for (p in 0 until m) {
                      val k = nodes[p]
                      for (q in 0 until m) {
                          val s = nodes[q]
                          if (d[s][k] == inf) continue
                          for (t in 0 until m) {
                              val e = nodes[t]
                              if (d[s][k] + d[k][e] < d[s][e]) d[s][e] = d[s][k] + d[k][e]
                          }
                      }
                  }
                  var ok = true
                  loop@ for (f in 0 until m) for (g in 0 until m) if (d[nodes[f]][nodes[g]] > maxDistance) { ok = false; break@loop }
                  if (ok) count++
              }
              return count
          }
        `,
        swift: code`
          func numberOfSets(_ n: Int, _ maxDistance: Int, _ roads: [[Int]]) -> Int {
              let inf = 1000000000
              var w = [[Int]](repeating: [Int](repeating: inf, count: n), count: n)
              for r in roads where r[2] < w[r[0]][r[1]] { w[r[0]][r[1]] = r[2]; w[r[1]][r[0]] = r[2] }
              var count = 0
              for mask in 0..<(1 << n) {
                  let nodes = (0..<n).filter { (mask >> $0) & 1 == 1 }
                  var d = w
                  for i in 0..<n { d[i][i] = 0 }
                  for k in nodes {
                      for s in nodes where d[s][k] != inf {
                          for e in nodes where d[s][k] + d[k][e] < d[s][e] { d[s][e] = d[s][k] + d[k][e] }
                      }
                  }
                  var ok = true
                  outer: for f in nodes {
                      for g in nodes where d[f][g] > maxDistance { ok = false; break outer }
                  }
                  if ok { count += 1 }
              }
              return count
          }
        `,
        rust: code`
          fn numberOfSets(n: i32, maxDistance: i32, roads: Vec<Vec<i32>>) -> i32 {
              let n = n as usize;
              let inf = 1000000000i32;
              let mut w = vec![vec![inf; n]; n];
              for r in roads.iter() {
                  let (u, v, c) = (r[0] as usize, r[1] as usize, r[2]);
                  if c < w[u][v] {
                      w[u][v] = c;
                      w[v][u] = c;
                  }
              }
              let mut count = 0;
              for mask in 0..(1usize << n) {
                  let nodes: Vec<usize> = (0..n).filter(|&b| (mask >> b) & 1 == 1).collect();
                  let mut d = w.clone();
                  for i in 0..n {
                      d[i][i] = 0;
                  }
                  for &k in nodes.iter() {
                      for &s in nodes.iter() {
                          if d[s][k] == inf {
                              continue;
                          }
                          for &e in nodes.iter() {
                              if d[s][k] + d[k][e] < d[s][e] {
                                  d[s][e] = d[s][k] + d[k][e];
                              }
                          }
                      }
                  }
                  let ok = nodes.iter().all(|&f| nodes.iter().all(|&g| d[f][g] <= maxDistance));
                  if ok {
                      count += 1;
                  }
              }
              count
          }
        `,
        php: code`
          function numberOfSets($n, $maxDistance, $roads) {
              $INF = 1000000000;
              $w = array_fill(0, $n, array_fill(0, $n, $INF));
              foreach ($roads as [$u, $v, $c]) if ($c < $w[$u][$v]) { $w[$u][$v] = $c; $w[$v][$u] = $c; }
              $count = 0;
              for ($mask = 0; $mask < (1 << $n); $mask++) {
                  $nodes = [];
                  for ($b = 0; $b < $n; $b++) if (($mask >> $b) & 1) $nodes[] = $b;
                  $d = $w;
                  for ($i = 0; $i < $n; $i++) $d[$i][$i] = 0;
                  foreach ($nodes as $k) {
                      foreach ($nodes as $s) {
                          if ($d[$s][$k] == $INF) continue;
                          foreach ($nodes as $e) {
                              if ($d[$s][$k] + $d[$k][$e] < $d[$s][$e]) $d[$s][$e] = $d[$s][$k] + $d[$k][$e];
                          }
                      }
                  }
                  $ok = true;
                  foreach ($nodes as $f) {
                      foreach ($nodes as $g) if ($d[$f][$g] > $maxDistance) { $ok = false; break 2; }
                  }
                  if ($ok) $count++;
              }
              return $count;
          }
        `,
        ruby: code`
          def numberOfSets(n, maxDistance, roads)
            inf = 1_000_000_000
            w = Array.new(n) { Array.new(n, inf) }
            roads.each do |u, v, c|
              if c < w[u][v]
                w[u][v] = c
                w[v][u] = c
              end
            end
            count = 0
            (1 << n).times do |mask|
              nodes = (0...n).select { |b| (mask >> b) & 1 == 1 }
              d = w.map(&:dup)
              n.times { |i| d[i][i] = 0 }
              nodes.each do |k|
                dk = d[k]
                nodes.each do |s|
                  ds = d[s]
                  dsk = ds[k]
                  next if dsk == inf
                  nodes.each do |e|
                    ds[e] = dsk + dk[e] if dsk + dk[e] < ds[e]
                  end
                end
              end
              ok = nodes.all? { |f| nodes.all? { |g| d[f][g] <= maxDistance } }
              count += 1 if ok
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost to Convert String I (LC 2976) ──────────────────
  (() => {
    const ref = (source: string, target: string, original: string[], changed: string[], cost: number[]) => {
      // Bellman–Ford from each needed source letter over the change rules.
      const memo = new Map<string, number[]>();
      const from = (c: string) => {
        if (!memo.has(c)) {
          const d = new Map<string, number>([[c, 0]]);
          for (let it = 0; it < 26; it++) {
            original.forEach((o, i) => {
              if (d.has(o) && (!d.has(changed[i]) || d.get(o)! + cost[i] < d.get(changed[i])!)) d.set(changed[i], d.get(o)! + cost[i]);
            });
          }
          memo.set(c, Array.from({ length: 26 }, (_, k) => { const ch = String.fromCharCode(97 + k); return d.has(ch) ? d.get(ch)! : -1; }));
        }
        return memo.get(c)!;
      };
      let total = 0;
      for (let i = 0; i < source.length; i++) {
        const d = from(source[i])[target.charCodeAt(i) - 97];
        if (d < 0) return -1;
        total += d;
      }
      return total;
    };
    return {
      slug: "minimum-cost-to-convert-string-i",
      title: "Minimum Cost to Convert String I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Graph", "Shortest Path", "Amazon", "Google"],
      signature: {
        funcName: "minimumCost",
        params: [
          { name: "source", type: "string" as const }, { name: "target", type: "string" as const },
          { name: "original", type: "string[]" as const }, { name: "changed", type: "string[]" as const }, { name: "cost", type: "int[]" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "You are given two strings `source` and `target` of the same length, both of lowercase English letters, and three arrays `original`, `changed` and `cost` of the same length. Each `original[i]` and `changed[i]` is a single lowercase letter.\n\nIn one operation you may change a character `x` of the current string into `y` at a cost of `z` if there is an index `j` with `original[j] == x`, `changed[j] == y` and `cost[j] == z`. Operations may be repeated any number of times, on any positions.\n\nReturn the **minimum** total cost of turning `source` into `target`, or `-1` if it is impossible.\n\nCodeKairo bounds the string length and the costs (see the constraints) so the total always fits in a 32-bit integer.",
        [
          { in: "source = \"abcd\", target = \"acbe\", original = [\"a\",\"b\",\"c\",\"c\",\"e\",\"d\"], changed = [\"b\",\"c\",\"b\",\"e\",\"b\",\"e\"], cost = [2,5,5,1,2,20]", out: "28", note: "a stays a; b → c costs 5; c → b is cheapest as c → e → b for 1 + 2 = 3; d → e costs 20. Total 5 + 3 + 20 = 28." },
          { in: "source = \"aaaa\", target = \"bbbb\", original = [\"a\",\"c\"], changed = [\"c\",\"b\"], cost = [1,2]", out: "12", note: "Each a becomes b through c for 1 + 2 = 3; four positions cost 12." },
          { in: "source = \"abcd\", target = \"abce\", original = [\"a\"], changed = [\"e\"], cost = [1000]", out: "-1", note: "No rule ever turns a d into an e." },
        ],
        ["1 <= source.length == target.length <= 10^4", "source and target consist of lowercase English letters", "1 <= cost.length == original.length == changed.length <= 2000", "original[i] and changed[i] are lowercase English letters", "1 <= cost[i] <= 10^3", "original[i] != changed[i]"]),
      hints: [
        "Each position is independent: the total is the sum, over positions, of the cheapest way to turn `source[i]` into `target[i]`.",
        "Treat the 26 letters as nodes of a weighted directed graph with an edge `original[j] → changed[j]` of weight `cost[j]` (keep the cheapest of parallel rules). The cheapest conversion is a shortest path.",
        "With only 26 nodes, Floyd–Warshall gives every letter-to-letter cost at once; then sum up, returning `-1` as soon as some needed pair is unreachable.",
      ],
      editorial: explain({
        idea: "Conversions of different positions never interact, so the problem reduces to the cheapest letter-to-letter conversion — an all-pairs shortest path on a 26-node graph — summed over the positions.",
        steps: [
          "Initialise `dist[x][x] = 0` and `dist[x][y] = ∞` otherwise; for each rule set `dist[o][c] = min(dist[o][c], cost)`.",
          "Run Floyd–Warshall over the 26 letters.",
          "For each position `i`, add `dist[source[i]][target[i]]`; if it is `∞`, return `-1`.",
          "Return the sum.",
        ],
        why: "A sequence of operations applied to one position is a walk in the letter graph from `source[i]` to `target[i]` whose cost is the sum of its edge weights, and the cheapest such walk is a shortest path. Positions do not share any resource, so minimising each one separately minimises the total.",
        time: "O(26³ + m + n)",
        space: "O(26²)",
        pitfalls: [
          "Several rules can join the same pair of letters with different costs — keep the cheapest.",
          "Positions where `source[i] == target[i]` cost nothing.",
          "In the original problem the total can exceed 32 bits; CodeKairo's bounds keep it below `2.5 · 10^8`.",
        ],
      }),
      examples: [
        { input: "\"abcd\"\n\"acbe\"\n[\"a\",\"b\",\"c\",\"c\",\"e\",\"d\"]\n[\"b\",\"c\",\"b\",\"e\",\"b\",\"e\"]\n[2,5,5,1,2,20]", expectedOutput: "28" },
        { input: "\"aaaa\"\n\"bbbb\"\n[\"a\",\"c\"]\n[\"c\",\"b\"]\n[1,2]", expectedOutput: "12" },
        { input: "\"abcd\"\n\"abce\"\n[\"a\"]\n[\"e\"]\n[1000]", expectedOutput: "-1" },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const A = pick(rng, [2, 3, 5, 8, 26]);
        const letter = () => String.fromCharCode(97 + ri(rng, 0, A - 1));
        const len = ri(rng, 1, pick(rng, [3, 10, 30]));
        const source = Array.from({ length: len }, letter).join("");
        const m = ri(rng, 1, pick(rng, [2, 6, 15, 30]));
        const original: string[] = [], changed: string[] = [], cost: number[] = [];
        const C = pick(rng, [1, 10, 1000]);
        for (let i = 0; i < m; i++) {
          const o = letter();
          let c = letter();
          if (c === o) c = String.fromCharCode(97 + ((o.charCodeAt(0) - 97 + 1) % Math.max(2, A)));
          original.push(o); changed.push(c); cost.push(ri(rng, 1, C));
        }
        // Most target letters are reached by following a few rules, so -1 stays a minority.
        const noise = pick(rng, [0, 0.03, 0.15]);
        const target = Array.from({ length: len }, (_, i) => {
          if (rng() < noise) return letter();
          let ch = source[i];
          const steps = ri(rng, 0, 3);
          for (let s = 0; s < steps; s++) {
            const opts = original.map((o, r) => (o === ch ? changed[r] : "")).filter((x) => x !== "");
            if (opts.length) ch = pick(rng, opts);
          }
          return ch;
        }).join("");
        return {
          input: `"${source}"\n"${target}"\n${fmtStrArr(original)}\n${fmtStrArr(changed)}\n${fmtIntArr(cost)}`,
          expectedOutput: String(ref(source, target, original, changed, cost)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumCost(source: str, target: str, original: List[str], changed: List[str], cost: List[int]) -> int:
              INF = float("inf")
              d = [[0 if i == j else INF for j in range(26)] for i in range(26)]
              for o, c, w in zip(original, changed, cost):
                  a, b = ord(o) - 97, ord(c) - 97
                  if w < d[a][b]:
                      d[a][b] = w
              for k in range(26):
                  dk = d[k]
                  for i in range(26):
                      di = d[i]
                      dik = di[k]
                      if dik == INF:
                          continue
                      for j in range(26):
                          if dik + dk[j] < di[j]:
                              di[j] = dik + dk[j]
              total = 0
              for s, t in zip(source, target):
                  w = d[ord(s) - 97][ord(t) - 97]
                  if w == INF:
                      return -1
                  total += w
              return total
        `,
        javascript: code`
          var minimumCost = function(source, target, original, changed, cost) {
              var INF = 1000000000;
              var d = [];
              for (var i = 0; i < 26; i++) { d.push([]); for (var j = 0; j < 26; j++) d[i].push(i === j ? 0 : INF); }
              for (var r = 0; r < original.length; r++) {
                  var a = original[r].charCodeAt(0) - 97, b = changed[r].charCodeAt(0) - 97;
                  if (cost[r] < d[a][b]) d[a][b] = cost[r];
              }
              for (var k = 0; k < 26; k++)
                  for (var x = 0; x < 26; x++) {
                      if (d[x][k] === INF) continue;
                      for (var y = 0; y < 26; y++) if (d[x][k] + d[k][y] < d[x][y]) d[x][y] = d[x][k] + d[k][y];
                  }
              var total = 0;
              for (var p = 0; p < source.length; p++) {
                  var w = d[source.charCodeAt(p) - 97][target.charCodeAt(p) - 97];
                  if (w === INF) return -1;
                  total += w;
              }
              return total;
          };
        `,
        typescript: code`
          function minimumCost(source: string, target: string, original: string[], changed: string[], cost: number[]): number {
              var INF = 1000000000;
              var d: number[][] = [];
              for (var i = 0; i < 26; i++) { var row: number[] = []; for (var j = 0; j < 26; j++) row.push(i === j ? 0 : INF); d.push(row); }
              for (var r = 0; r < original.length; r++) {
                  var a = original[r].charCodeAt(0) - 97, b = changed[r].charCodeAt(0) - 97;
                  if (cost[r] < d[a][b]) d[a][b] = cost[r];
              }
              for (var k = 0; k < 26; k++)
                  for (var x = 0; x < 26; x++) {
                      if (d[x][k] === INF) continue;
                      for (var y = 0; y < 26; y++) if (d[x][k] + d[k][y] < d[x][y]) d[x][y] = d[x][k] + d[k][y];
                  }
              var total = 0;
              for (var p = 0; p < source.length; p++) {
                  var w = d[source.charCodeAt(p) - 97][target.charCodeAt(p) - 97];
                  if (w === INF) return -1;
                  total += w;
              }
              return total;
          }
        `,
        java: code`
          public static int minimumCost(String source, String target, String[] original, String[] changed, int[] cost) {
              final int INF = 1000000000;
              int[][] d = new int[26][26];
              for (int i = 0; i < 26; i++) for (int j = 0; j < 26; j++) d[i][j] = i == j ? 0 : INF;
              for (int r = 0; r < original.length; r++) {
                  int a = original[r].charAt(0) - 'a', b = changed[r].charAt(0) - 'a';
                  d[a][b] = Math.min(d[a][b], cost[r]);
              }
              for (int k = 0; k < 26; k++)
                  for (int x = 0; x < 26; x++) {
                      if (d[x][k] == INF) continue;
                      for (int y = 0; y < 26; y++) if (d[x][k] + d[k][y] < d[x][y]) d[x][y] = d[x][k] + d[k][y];
                  }
              long total = 0;
              for (int p = 0; p < source.length(); p++) {
                  int w = d[source.charAt(p) - 'a'][target.charAt(p) - 'a'];
                  if (w == INF) return -1;
                  total += w;
              }
              return (int) total;
          }
        `,
        cpp: code`
          int minimumCost(string source, string target, vector<string>& original, vector<string>& changed, vector<int>& cost) {
              const int INF = 1000000000;
              vector<vector<int>> d(26, vector<int>(26, INF));
              for (int i = 0; i < 26; i++) d[i][i] = 0;
              for (size_t r = 0; r < original.size(); r++) {
                  int a = original[r][0] - 'a', b = changed[r][0] - 'a';
                  d[a][b] = min(d[a][b], cost[r]);
              }
              for (int k = 0; k < 26; k++)
                  for (int x = 0; x < 26; x++) {
                      if (d[x][k] == INF) continue;
                      for (int y = 0; y < 26; y++) if (d[x][k] + d[k][y] < d[x][y]) d[x][y] = d[x][k] + d[k][y];
                  }
              long long total = 0;
              for (size_t p = 0; p < source.size(); p++) {
                  int w = d[source[p] - 'a'][target[p] - 'a'];
                  if (w == INF) return -1;
                  total += w;
              }
              return (int) total;
          }
        `,
        c: code`
          int minimumCost(const char* source, const char* target, char** original, int originalSize, char** changed, int changedSize, int* cost, int costSize) {
              const int INF = 1000000000;
              int d[26][26];
              for (int i = 0; i < 26; i++) for (int j = 0; j < 26; j++) d[i][j] = i == j ? 0 : INF;
              for (int r = 0; r < originalSize; r++) {
                  int a = original[r][0] - 'a', b = changed[r][0] - 'a';
                  if (cost[r] < d[a][b]) d[a][b] = cost[r];
              }
              for (int k = 0; k < 26; k++)
                  for (int x = 0; x < 26; x++) {
                      if (d[x][k] == INF) continue;
                      for (int y = 0; y < 26; y++) if (d[x][k] + d[k][y] < d[x][y]) d[x][y] = d[x][k] + d[k][y];
                  }
              long long total = 0;
              for (int p = 0; source[p] != '\0'; p++) {
                  int w = d[source[p] - 'a'][target[p] - 'a'];
                  if (w == INF) return -1;
                  total += w;
              }
              return (int) total;
          }
        `,
        csharp: code`
          public static int MinimumCost(string source, string target, string[] original, string[] changed, int[] cost)
          {
              const int INF = 1000000000;
              var d = new int[26, 26];
              for (int i = 0; i < 26; i++) for (int j = 0; j < 26; j++) d[i, j] = i == j ? 0 : INF;
              for (int r = 0; r < original.Length; r++)
              {
                  int a = original[r][0] - 'a', b = changed[r][0] - 'a';
                  d[a, b] = Math.Min(d[a, b], cost[r]);
              }
              for (int k = 0; k < 26; k++)
                  for (int x = 0; x < 26; x++)
                  {
                      if (d[x, k] == INF) continue;
                      for (int y = 0; y < 26; y++) if (d[x, k] + d[k, y] < d[x, y]) d[x, y] = d[x, k] + d[k, y];
                  }
              long total = 0;
              for (int p = 0; p < source.Length; p++)
              {
                  int w = d[source[p] - 'a', target[p] - 'a'];
                  if (w == INF) return -1;
                  total += w;
              }
              return (int) total;
          }
        `,
        go: code`
          func minimumCost(source string, target string, original []string, changed []string, cost []int) int {
              const INF = 1000000000
              var d [26][26]int
              for i := 0; i < 26; i++ {
                  for j := 0; j < 26; j++ {
                      if i != j {
                          d[i][j] = INF
                      }
                  }
              }
              for r := range original {
                  a, b := int(original[r][0]-'a'), int(changed[r][0]-'a')
                  if cost[r] < d[a][b] {
                      d[a][b] = cost[r]
                  }
              }
              for k := 0; k < 26; k++ {
                  for x := 0; x < 26; x++ {
                      if d[x][k] == INF {
                          continue
                      }
                      for y := 0; y < 26; y++ {
                          if d[x][k]+d[k][y] < d[x][y] {
                              d[x][y] = d[x][k] + d[k][y]
                          }
                      }
                  }
              }
              total := 0
              for p := 0; p < len(source); p++ {
                  w := d[source[p]-'a'][target[p]-'a']
                  if w == INF {
                      return -1
                  }
                  total += w
              }
              return total
          }
        `,
        kotlin: code`
          fun minimumCost(source: String, target: String, original: Array<String>, changed: Array<String>, cost: IntArray): Int {
              val inf = 1000000000
              val d = Array(26) { i -> IntArray(26) { j -> if (i == j) 0 else inf } }
              for (r in original.indices) {
                  val a = original[r][0] - 'a'
                  val b = changed[r][0] - 'a'
                  d[a][b] = minOf(d[a][b], cost[r])
              }
              for (k in 0 until 26)
                  for (x in 0 until 26) {
                      if (d[x][k] == inf) continue
                      for (y in 0 until 26) if (d[x][k] + d[k][y] < d[x][y]) d[x][y] = d[x][k] + d[k][y]
                  }
              var total = 0L
              for (p in source.indices) {
                  val w = d[source[p] - 'a'][target[p] - 'a']
                  if (w == inf) return -1
                  total += w
              }
              return total.toInt()
          }
        `,
        swift: code`
          func minimumCost(_ source: String, _ target: String, _ original: [String], _ changed: [String], _ cost: [Int]) -> Int {
              let inf = 1000000000
              var d = [[Int]](repeating: [Int](repeating: inf, count: 26), count: 26)
              for i in 0..<26 { d[i][i] = 0 }
              for r in 0..<original.count {
                  let a = Int(original[r].utf8.first!) - 97, b = Int(changed[r].utf8.first!) - 97
                  d[a][b] = min(d[a][b], cost[r])
              }
              for k in 0..<26 {
                  for x in 0..<26 where d[x][k] != inf {
                      for y in 0..<26 where d[x][k] + d[k][y] < d[x][y] { d[x][y] = d[x][k] + d[k][y] }
                  }
              }
              let s = Array(source.utf8), t = Array(target.utf8)
              var total = 0
              for p in 0..<s.count {
                  let w = d[Int(s[p]) - 97][Int(t[p]) - 97]
                  if w == inf { return -1 }
                  total += w
              }
              return total
          }
        `,
        rust: code`
          fn minimumCost(source: String, target: String, original: Vec<String>, changed: Vec<String>, cost: Vec<i32>) -> i32 {
              let inf = 1000000000i64;
              let mut d = vec![vec![inf; 26]; 26];
              for i in 0..26 {
                  d[i][i] = 0;
              }
              for r in 0..original.len() {
                  let a = (original[r].as_bytes()[0] - b'a') as usize;
                  let b = (changed[r].as_bytes()[0] - b'a') as usize;
                  d[a][b] = d[a][b].min(cost[r] as i64);
              }
              for k in 0..26 {
                  for x in 0..26 {
                      if d[x][k] == inf {
                          continue;
                      }
                      for y in 0..26 {
                          if d[x][k] + d[k][y] < d[x][y] {
                              d[x][y] = d[x][k] + d[k][y];
                          }
                      }
                  }
              }
              let (s, t) = (source.as_bytes(), target.as_bytes());
              let mut total = 0i64;
              for p in 0..s.len() {
                  let w = d[(s[p] - b'a') as usize][(t[p] - b'a') as usize];
                  if w == inf {
                      return -1;
                  }
                  total += w;
              }
              total as i32
          }
        `,
        php: code`
          function minimumCost($source, $target, $original, $changed, $cost) {
              $INF = 1000000000;
              $d = [];
              for ($i = 0; $i < 26; $i++) for ($j = 0; $j < 26; $j++) $d[$i][$j] = $i == $j ? 0 : $INF;
              foreach ($original as $r => $o) {
                  $a = ord($o) - 97;
                  $b = ord($changed[$r]) - 97;
                  if ($cost[$r] < $d[$a][$b]) $d[$a][$b] = $cost[$r];
              }
              for ($k = 0; $k < 26; $k++)
                  for ($x = 0; $x < 26; $x++) {
                      if ($d[$x][$k] == $INF) continue;
                      for ($y = 0; $y < 26; $y++) if ($d[$x][$k] + $d[$k][$y] < $d[$x][$y]) $d[$x][$y] = $d[$x][$k] + $d[$k][$y];
                  }
              $total = 0;
              $len = strlen($source);
              for ($p = 0; $p < $len; $p++) {
                  $w = $d[ord($source[$p]) - 97][ord($target[$p]) - 97];
                  if ($w == $INF) return -1;
                  $total += $w;
              }
              return $total;
          }
        `,
        ruby: code`
          def minimumCost(source, target, original, changed, cost)
            inf = 1_000_000_000
            d = Array.new(26) { |i| Array.new(26) { |j| i == j ? 0 : inf } }
            original.each_with_index do |o, r|
              a = o.ord - 97
              b = changed[r].ord - 97
              d[a][b] = cost[r] if cost[r] < d[a][b]
            end
            26.times do |k|
              dk = d[k]
              26.times do |x|
                dx = d[x]
                dxk = dx[k]
                next if dxk == inf
                26.times { |y| dx[y] = dxk + dk[y] if dxk + dk[y] < dx[y] }
              end
            end
            total = 0
            source.bytes.each_with_index do |c, p|
              w = d[c - 97][target.getbyte(p) - 97]
              return -1 if w == inf
              total += w
            end
            total
          end
        `,
      },
    };
  })(),

];
